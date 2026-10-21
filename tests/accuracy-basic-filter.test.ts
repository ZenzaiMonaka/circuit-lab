// 基本・過渡応答・フィルタの回路を、実際に ngspice で解いて理論値と比べる。
import { describe, expect, it } from "vitest";
import type { AcData, OpData, TranData } from "../src/engine/results";
import { ledResistor } from "../src/templates/basic/led-resistor";
import { wheatstoneBridge } from "../src/templates/basic/wheatstone-bridge";
import { rcHighpass } from "../src/templates/filter/rc-highpass";
import { rlcParallelResonance } from "../src/templates/filter/rlc-parallel-resonance";
import { rlcSeriesResonance } from "../src/templates/filter/rlc-series-resonance";
import { rcCharge } from "../src/templates/transient/rc-charge";
import { rlCircuit } from "../src/templates/transient/rl-circuit";
import { rlcStep } from "../src/templates/transient/rlc-step";
import { simulate } from "./helpers/simulate";

const row = (data: OpData, label: string) => data.rows.find((r) => r.label.startsWith(label))!.value;
const series = (data: TranData, label: string) => data.series.find((s) => s.label.startsWith(label))!.y;
/** 時刻 t にいちばん近い点の値 */
const valueAt = (data: TranData, label: string, t: number) => {
  const k = data.time.findIndex((time) => time >= t);
  return series(data, label)[k];
};
const nearest = (ac: AcData, hz: number) =>
  ac.frequency.reduce(
    (best, f, i) => (Math.abs(Math.log(f / hz)) < Math.abs(Math.log(ac.frequency[best] / hz)) ? i : best),
    0,
  );
const peak = (ac: AcData) => {
  const gain = ac.series[0].gainDb;
  const index = gain.indexOf(Math.max(...gain));
  return { index, hz: ac.frequency[index], db: gain[index] };
};

/** ゲインが -3 dB を横切る 2 点の周波数の差(格子の間は直線で補間する) */
const bandwidth = (ac: AcData) => {
  const gain = ac.series[0].gainDb;
  const crossing = (a: number, b: number) =>
    ac.frequency[a] + ((ac.frequency[b] - ac.frequency[a]) * (-3.0103 - gain[a])) / (gain[b] - gain[a]);
  const top = gain.indexOf(Math.max(...gain));
  let lo = top;
  while (gain[lo] > -3.0103) lo--;
  let hi = top;
  while (gain[hi] > -3.0103) hi++;
  return crossing(hi - 1, hi) - crossing(lo, lo + 1);
};

describe("ホイートストンブリッジ", () => {
  it("4 本とも同じ抵抗なら平衡して Vab = 0", async () => {
    const op = (await simulate(wheatstoneBridge, "op")) as OpData;
    expect(Math.abs(row(op, "ブリッジの出力"))).toBeLessThan(1e-9);
  });

  it("R4 を +10% にすると Vab が理論値(約 -0.238 V)になる", async () => {
    const op = (await simulate(wheatstoneBridge, "op", { R4: 1.1e3 })) as OpData;
    expect(row(op, "ブリッジの出力")).toBeCloseTo(5 - (10 * 1.1) / 2.1, 6);
  });

  it("R1/R2 = R3/R4 を満たせば、別の値でも平衡する", async () => {
    const op = (await simulate(wheatstoneBridge, "op", { R1: 2e3, R2: 1e3, R3: 4e3, R4: 2e3 })) as OpData;
    expect(Math.abs(row(op, "ブリッジの出力"))).toBeLessThan(1e-9);
  });
});

describe("LED の電流制限抵抗", () => {
  it("5V・330Ω で Vf が約 2V、電流が 8〜10 mA になり、電圧の収支が合う", async () => {
    const op = (await simulate(ledResistor, "op")) as OpData;
    const vf = row(op, "LED の順方向電圧");
    const current = row(op, "LED に流れる電流");
    expect(vf).toBeGreaterThan(1.8);
    expect(vf).toBeLessThan(2.2);
    expect(current).toBeGreaterThan(8e-3);
    expect(current).toBeLessThan(10e-3);
    expect(vf + current * 330).toBeCloseTo(5, 6);
  });

  it("電源電圧が Vf に近いと、電流がほとんど流れない", async () => {
    const op = (await simulate(ledResistor, "op", { Vin: 2.5 })) as OpData;
    expect(row(op, "LED に流れる電流")).toBeLessThan(2e-3);
  });
});

describe("RC 充放電", () => {
  const tau = 1e3 * 1e-6;
  it("充電は時定数で 63.2%、5τ でほぼ完了し、放電は指数的に減る", async () => {
    const tran = (await simulate(rcCharge, "tran")) as TranData;
    expect(valueAt(tran, "コンデンサ", tau)).toBeCloseTo(5 * (1 - Math.exp(-1)), 1);
    expect(valueAt(tran, "コンデンサ", 4.99 * tau)).toBeCloseTo(5 * (1 - Math.exp(-5)), 1);
    // 5τ で入力が 0 に戻る。そこから 1τ 後
    expect(valueAt(tran, "コンデンサ", 6 * tau)).toBeCloseTo(5 * (1 - Math.exp(-5)) * Math.exp(-1), 1);
  });

  it("電流は切り替わりの瞬間に Vin/R になる", async () => {
    const tran = (await simulate(rcCharge, "tran")) as TranData;
    expect(Math.max(...series(tran, "充放電の電流"))).toBeCloseTo(5e-3, 4);
  });
});

describe("RL 回路の過渡応答", () => {
  const tau = 10e-3 / 100;
  it("電流が時定数で最終値(Vin/R)の 63.2% になる", async () => {
    const tran = (await simulate(rlCircuit, "tran")) as TranData;
    expect(valueAt(tran, "電流", tau)).toBeCloseTo(0.05 * (1 - Math.exp(-1)), 3);
  });

  it("通電の瞬間はインダクタに入力電圧がそのままかかる", async () => {
    const tran = (await simulate(rlCircuit, "tran")) as TranData;
    expect(Math.max(...series(tran, "インダクタの電圧"))).toBeCloseTo(5, 1);
  });
});

describe("RLC 直列回路のステップ応答", () => {
  it("不足減衰(ζ=0.1)で、理論どおりのオーバーシュートになる", async () => {
    const zeta = (20 / 2) * Math.sqrt(1e-6 / 10e-3);
    const expected = 5 * (1 + Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta ** 2)));
    const tran = (await simulate(rlcStep, "tran")) as TranData;
    expect(Math.max(...series(tran, "コンデンサ"))).toBeCloseTo(expected, 0);
  });

  it("臨界減衰の抵抗(2√(L/C) = 200Ω)では行き過ぎない", async () => {
    const tran = (await simulate(rlcStep, "tran", { R1: 200 })) as TranData;
    expect(Math.max(...series(tran, "コンデンサ"))).toBeLessThan(5.02);
  });

  it("最終的に入力電圧に収束する", async () => {
    const tran = (await simulate(rlcStep, "tran")) as TranData;
    const vc = series(tran, "コンデンサ");
    expect(vc[vc.length - 1]).toBeCloseTo(5, 1);
  });
});

describe("RC ハイパスフィルタ", () => {
  it("カットオフ周波数で -3 dB・位相 +45°になる", async () => {
    const ac = (await simulate(rcHighpass, "ac", { C1: 159.155e-9 })) as AcData; // fc = 1 kHz
    const i = nearest(ac, 1000);
    expect(ac.series[0].gainDb[i]).toBeCloseTo(-3.01, 1);
    expect(ac.series[0].phaseDeg[i]).toBeCloseTo(45, 0);
  });

  it("低い周波数ほどゲインが下がり、10 倍で 20 dB 下がる(+20 dB/dec)", async () => {
    const ac = (await simulate(rcHighpass, "ac")) as AcData;
    const gain = ac.series[0].gainDb;
    expect(gain[nearest(ac, 10)] - gain[nearest(ac, 100)]).toBeCloseTo(-20, 0);
  });
});

describe("RLC 直列共振回路", () => {
  const f0 = 1 / (2 * Math.PI * Math.sqrt(10e-3 * 1e-6));
  it("共振周波数でゲインが最大(0 dB)になる", async () => {
    const ac = (await simulate(rlcSeriesResonance, "ac")) as AcData;
    const p = peak(ac);
    expect(Math.abs(p.hz / f0 - 1)).toBeLessThan(0.03);
    expect(p.db).toBeCloseTo(0, 1);
  });

  it("Q = 2 のとき、帯域が f0/Q になる", async () => {
    const ac = (await simulate(rlcSeriesResonance, "ac")) as AcData;
    expect(Math.abs(bandwidth(ac) / (f0 / 2) - 1)).toBeLessThan(0.05);
  });
});

describe("RLC 並列共振回路", () => {
  const f0 = 1 / (2 * Math.PI * Math.sqrt(10e-3 * 1e-6));
  it("共振周波数でゲインが最大(0 dB)になる", async () => {
    const ac = (await simulate(rlcParallelResonance, "ac")) as AcData;
    const p = peak(ac);
    expect(Math.abs(p.hz / f0 - 1)).toBeLessThan(0.03);
    expect(p.db).toBeCloseTo(0, 1);
  });

  it("Q = 10 のとき、帯域が f0/Q になる。Rs を大きくすると鋭くなる", async () => {
    const width = async (Rs: number) => {
      return bandwidth((await simulate(rlcParallelResonance, "ac", { Rs })) as AcData);
    };
    expect(Math.abs((await width(1e3)) / (f0 / 10) - 1)).toBeLessThan(0.05);
    expect(await width(10e3)).toBeLessThan(await width(1e3));
  });
});
