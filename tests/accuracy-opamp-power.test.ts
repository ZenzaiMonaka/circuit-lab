// オペアンプ・パワーエレクトロニクスの回路を、実際に ngspice で解いて理論値・設計式と比べる。
import { describe, expect, it } from "vitest";
import type { AcData, OpData, TranData } from "../src/engine/results";
import { differenceAmp } from "../src/templates/opamp/difference-amp";
import { integrator } from "../src/templates/opamp/integrator";
import { nonInvertingAmp } from "../src/templates/opamp/non-inverting-amp";
import { sallenKeyLowpass } from "../src/templates/opamp/sallen-key-lowpass";
import { schmittTrigger } from "../src/templates/opamp/schmitt-trigger";
import { summingAmp } from "../src/templates/opamp/summing-amp";
import { boostConverter } from "../src/templates/power-electronics/boost-converter";
import { buckBoostConverter } from "../src/templates/power-electronics/buck-boost-converter";
import { threePhaseInverter } from "../src/templates/power-electronics/three-phase-inverter";
import { simulate } from "./helpers/simulate";

const row = (data: OpData, label: string) => data.rows.find((r) => r.label.startsWith(label))!.value;
const series = (data: TranData, label: string) => data.series.find((s) => s.label.startsWith(label))!.y;
const after = (data: TranData, label: string, t: number) => series(data, label).filter((_, i) => data.time[i] > t);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const rms = (a: number[]) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
/** 指定した周波数以上で最初の点の番号 */
const indexAt = (ac: AcData, hz: number) => ac.frequency.findIndex((f) => f >= hz);

describe("非反転増幅回路", () => {
  it("利得が 1 + Rf/Rg(20 dB)で位相は反転しない。帯域 GBW/10 ≒ 100 kHz で約 3 dB 下がる", async () => {
    const ac = (await simulate(nonInvertingAmp, "ac")) as AcData;
    expect(ac.series[0].gainDb[indexAt(ac, 100)]).toBeCloseTo(20, 1);
    expect(Math.abs(ac.series[0].phaseDeg[indexAt(ac, 100)])).toBeLessThan(1);
    const g = ac.series[0].gainDb[indexAt(ac, 100e3)];
    expect(g).toBeGreaterThan(16.7);
    expect(g).toBeLessThan(17.3);
  });

  it("Rf を 1Ω、Rg を大きくするとボルテージフォロワ(0 dB)になる", async () => {
    const ac = (await simulate(nonInvertingAmp, "ac", { Rf: 1, Rg: 10e6 })) as AcData;
    expect(Math.abs(ac.series[0].gainDb[indexAt(ac, 1e3)])).toBeLessThan(0.01);
  });

  it("小さな入力では 10 倍に増幅される", async () => {
    const tran = (await simulate(nonInvertingAmp, "tran")) as TranData;
    expect(Math.max(...after(tran, "出力", 1e-3))).toBeCloseTo(1, 1);
  });
});

describe("加算回路", () => {
  it("出力が −Rf(V1/R1 + V2/R2) になる", async () => {
    const op = (await simulate(summingAmp, "op")) as OpData;
    expect(row(op, "出力電圧")).toBeCloseTo(-1.5, 3);
    const weighted = (await simulate(summingAmp, "op", { R1: 5e3 })) as OpData;
    expect(row(weighted, "出力電圧")).toBeCloseTo(-2.5, 3);
    expect(row(weighted, "出力電圧")).toBeCloseTo(row(weighted, "式から求めた値"), 3);
  });

  it("V2 の交流が、V1 の直流分を足されて、反転して出力される", async () => {
    const tran = (await simulate(summingAmp, "tran")) as TranData;
    const out = series(tran, "出力");
    expect(Math.max(...out)).toBeCloseTo(-1, 1);
    expect(Math.min(...out)).toBeCloseTo(-2, 1);
  });
});

describe("差動増幅回路(減算回路)", () => {
  it("出力が (Rf/Rin)(V2 − V1) になる", async () => {
    const op = (await simulate(differenceAmp, "op")) as OpData;
    expect(row(op, "出力電圧")).toBeCloseTo(1, 3);
    const gain10 = (await simulate(differenceAmp, "op", { v1: 1, v2: 1.1, Rf: 100e3 })) as OpData;
    expect(row(gain10, "出力電圧")).toBeCloseTo(1, 2);
  });

  it("両方の入力に同じ電圧(コモンモード)を加えると、出力がほぼ 0 になる", async () => {
    const op = (await simulate(differenceAmp, "op", { v1: 3, v2: 3 })) as OpData;
    expect(Math.abs(row(op, "出力電圧"))).toBeLessThan(1e-3);
  });
});

describe("積分回路", () => {
  it("1 kHz で利得が 1/(2πfRC) ≒ 4 dB、位相が +90°、10 倍の周波数で 20 dB 下がる", async () => {
    const ac = (await simulate(integrator, "ac")) as AcData;
    const at1k = ac.series[0].gainDb[indexAt(ac, 1e3)];
    expect(Math.abs(at1k - 20 * Math.log10(1 / (2 * Math.PI * 1e3 * 10e3 * 10e-9)))).toBeLessThan(0.3);
    expect(ac.series[0].phaseDeg[indexAt(ac, 1e3)]).toBeGreaterThan(87);
    expect(ac.series[0].phaseDeg[indexAt(ac, 1e3)]).toBeLessThan(93);
    expect(at1k - ac.series[0].gainDb[indexAt(ac, 1e4)]).toBeCloseTo(20, 0);
  });

  it("矩形波を入れると三角波になり、振幅が 1/(RC) × 半周期 ≒ 5V になる。C を 2 倍にすると半分", async () => {
    const tran = (await simulate(integrator, "tran")) as TranData;
    const out = series(tran, "出力");
    expect(Math.max(...out)).toBeGreaterThan(4.5);
    expect(Math.max(...out)).toBeLessThan(5.1);
    const bigC = (await simulate(integrator, "tran", { C1: 20e-9 })) as TranData;
    expect(Math.max(...series(bigC, "出力"))).toBeGreaterThan(2.2);
    expect(Math.max(...series(bigC, "出力"))).toBeLessThan(2.6);
  });
});

describe("サレンキー型 2 次ローパスフィルタ", () => {
  it("通過域は 0 dB で、カットオフ(約 1.1 kHz)で約 −3 dB、10 倍の周波数で約 −40 dB", async () => {
    const ac = (await simulate(sallenKeyLowpass, "ac")) as AcData;
    const gain = ac.series[0].gainDb;
    expect(Math.abs(gain[indexAt(ac, 20)])).toBeLessThan(0.05);
    expect(gain[indexAt(ac, 1125)]).toBeGreaterThan(-3.6);
    expect(gain[indexAt(ac, 1125)]).toBeLessThan(-2.6);
    expect(gain[indexAt(ac, 11250)]).toBeGreaterThan(-42);
    expect(gain[indexAt(ac, 11250)]).toBeLessThan(-38);
  });

  it("C1/C2 を大きくして Q を上げると、カットオフ付近にピークができる", async () => {
    const ac = (await simulate(sallenKeyLowpass, "ac", { C1: 100e-9 })) as AcData;
    expect(Math.max(...ac.series[0].gainDb)).toBeGreaterThan(3);
  });
});

describe("シュミットトリガ", () => {
  const signChanges = (values: number[]) => values.filter((v, i) => i > 0 && Math.sign(v) !== Math.sign(values[i - 1])).length;

  it("しきい値が、出力に合わせて ±Vsat×R2/(R1+R2) ≒ ±1.2V で切り替わる", async () => {
    const tran = (await simulate(schmittTrigger, "tran")) as TranData;
    const threshold = series(tran, "しきい値");
    expect(Math.max(...threshold)).toBeGreaterThan(1.1);
    expect(Math.max(...threshold)).toBeLessThan(1.3);
    expect(Math.min(...threshold)).toBeLessThan(-1.1);
    expect(Math.min(...threshold)).toBeGreaterThan(-1.3);
  });

  it("入力が ±しきい値を超えたときだけ出力が切り替わる(ヒステリシス)", async () => {
    const tran = (await simulate(schmittTrigger, "tran")) as TranData;
    const vin = series(tran, "入力 Vin");
    const vout = series(tran, "出力");
    const flips = vout
      .map((v, i) => (i > 0 && Math.sign(v) !== Math.sign(vout[i - 1]) && Math.abs(vout[i - 1]) > 5 ? i : -1))
      .filter((i) => i > 0);
    expect(flips.length).toBeGreaterThanOrEqual(4);
    for (const i of flips) {
      // オペアンプの応答の遅れで、しきい値(1.2V)を少し超えてから切り替わる
      expect(Math.abs(vin[i])).toBeGreaterThan(1.1);
      expect(Math.abs(vin[i])).toBeLessThan(2);
    }
  });

  it("入力の振幅がしきい値より小さいと、出力は切り替わらない", async () => {
    const tran = (await simulate(schmittTrigger, "tran", { vamp: 1 })) as TranData;
    expect(signChanges(after(tran, "出力", 2e-4))).toBe(0);
  });
});

describe("昇圧型・昇降圧型コンバータ", () => {
  const settled = (tran: TranData) => after(tran, "出力電圧", 4e-3);

  it("昇圧: 出力が Vin/(1−D) より、損失ぶん少し低く、デューティ比とともに上がる", async () => {
    const v50 = mean(settled((await simulate(boostConverter, "tran")) as TranData));
    expect(v50).toBeGreaterThan(8.5);
    expect(v50).toBeLessThan(10);
    const v70 = mean(settled((await simulate(boostConverter, "tran", { duty: 70 })) as TranData));
    expect(v70).toBeGreaterThan(v50 * 1.4);
  });

  it("昇圧: インダクタ電流の平均が、出力電流 /(1−D) に近い", async () => {
    const tran = (await simulate(boostConverter, "tran")) as TranData;
    const expected = mean(settled(tran)) / 20 / (1 - 0.5);
    expect(Math.abs(mean(after(tran, "インダクタ", 4e-3)) / expected - 1)).toBeLessThan(0.12);
  });

  it("昇降圧: 出力が負で、D=50% で入力と同程度、D が小さいと小さく、大きいと大きい", async () => {
    const v = async (duty: number) => mean(settled((await simulate(buckBoostConverter, "tran", { duty })) as TranData));
    const v50 = await v(50);
    expect(v50).toBeLessThan(-10);
    expect(v50).toBeGreaterThan(-12);
    expect(await v(25)).toBeGreaterThan(-4);
    expect(await v(25)).toBeLessThan(-2.5);
    expect(await v(70)).toBeLessThan(-24);
  });
});

describe("三相 矩形波インバータ", () => {
  it("線間電圧は ±Vdc 付近、相電圧は ±2Vdc/3 付近で、三相の電流が揃っている", async () => {
    const tran = (await simulate(threePhaseInverter, "tran")) as TranData;
    const period = tran.time[tran.time.length - 1] / 2;
    const line = after(tran, "線間電圧", period);
    expect(Math.max(...line)).toBeGreaterThan(295);
    expect(Math.max(...line)).toBeLessThan(306);
    expect(Math.min(...line)).toBeLessThan(-295);
    const phase = after(tran, "相電圧", period);
    expect(Math.max(...phase)).toBeGreaterThan(195);
    expect(Math.max(...phase)).toBeLessThan(206);
    const currents = ["U 相", "V 相", "W 相"].map((label) => rms(after(tran, label, period)));
    expect(Math.max(...currents) / Math.min(...currents)).toBeLessThan(1.1);
    expect(Math.max(...after(tran, "U 相", period))).toBeGreaterThan(30);
    expect(Math.max(...after(tran, "U 相", period))).toBeLessThan(40);
  });

  it("V 相の電流が、U 相より 120°(周期の 1/3)遅れる", async () => {
    const tran = (await simulate(threePhaseInverter, "tran")) as TranData;
    const period = tran.time[tran.time.length - 1] / 2;
    /** period 以降で、電流が負から正に変わる最初の時刻(直線で補間) */
    const upwardZero = (label: string) => {
      const y = series(tran, label);
      for (let i = 1; i < y.length; i++) {
        if (tran.time[i] > period && y[i - 1] < 0 && y[i] >= 0) {
          return tran.time[i - 1] + ((tran.time[i] - tran.time[i - 1]) * -y[i - 1]) / (y[i] - y[i - 1]);
        }
      }
      throw new Error(`${label} に上向きのゼロ交差がありません`);
    };
    const delay = (((upwardZero("V 相") - upwardZero("U 相")) % period) + period) % period;
    expect(delay / period).toBeGreaterThan(0.3);
    expect(delay / period).toBeLessThan(0.37);
  });

  it("デッドタイムを 1 ms にしても、線間電圧のピークはほぼ Vdc のまま", async () => {
    const tran = (await simulate(threePhaseInverter, "tran", { td: 1e-3 })) as TranData;
    const period = tran.time[tran.time.length - 1] / 2;
    expect(Math.max(...after(tran, "線間電圧", period))).toBeGreaterThan(295);
  });
});
