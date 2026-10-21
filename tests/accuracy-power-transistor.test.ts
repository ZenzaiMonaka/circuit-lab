// 電源・トランジスタの回路を、実際に ngspice で解いて理論値・設計式と比べる。
import { describe, expect, it } from "vitest";
import type { AcData, OpData, TranData } from "../src/engine/results";
import { buckConverter } from "../src/templates/power-electronics/buck-converter";
import { bridgeRectifier } from "../src/templates/power-supply/bridge-rectifier";
import { clipperClamper } from "../src/templates/power-supply/clipper-clamper";
import { halfWaveRectifier } from "../src/templates/power-supply/half-wave-rectifier";
import { seriesRegulator } from "../src/templates/power-supply/series-regulator";
import { voltageDoubler } from "../src/templates/power-supply/voltage-doubler";
import { zenerRegulator } from "../src/templates/power-supply/zener-regulator";
import { bjtSwitch } from "../src/templates/transistor/bjt-switch";
import { currentMirror } from "../src/templates/transistor/current-mirror";
import { differentialPair } from "../src/templates/transistor/differential-pair";
import { emitterFollower } from "../src/templates/transistor/emitter-follower";
import { mosfetSwitch } from "../src/templates/transistor/mosfet-switch";
import { pushPull } from "../src/templates/transistor/push-pull";
import { simulate } from "./helpers/simulate";

const row = (data: OpData, label: string) => data.rows.find((r) => r.label.startsWith(label))!.value;
/** t 以降の部分の値 */
const after = (data: TranData, label: string, t: number) =>
  data.series.find((s) => s.label.startsWith(label))!.y.filter((_, i) => data.time[i] > t);
const lastThird = (data: TranData, label: string) => after(data, label, data.time[data.time.length - 1] * 0.66);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const ripple = (a: number[]) => Math.max(...a) - Math.min(...a);

describe("半波整流・全波整流・倍電圧整流", () => {
  it("半波整流の出力ピークは Vpk − Vd、リップルは I/(fC) の目安に近い", async () => {
    const out = lastThird((await simulate(halfWaveRectifier, "tran")) as TranData, "出力");
    expect(Math.max(...out)).toBeGreaterThan(8.9);
    expect(Math.max(...out)).toBeLessThan(9.5);
    const estimate = (mean(out) / 1e3) / (50 * 220e-6);
    expect(ripple(out)).toBeGreaterThan(estimate * 0.6);
    expect(ripple(out)).toBeLessThan(estimate * 1.2);
  });

  it("全波整流のリップルは、同じ条件の半波整流より小さく(約半分)、ピークはダイオード 2 個ぶん低い", async () => {
    const half = lastThird((await simulate(halfWaveRectifier, "tran")) as TranData, "出力");
    const full = lastThird((await simulate(bridgeRectifier, "tran")) as TranData, "出力");
    expect(ripple(full)).toBeLessThan(ripple(half) * 0.6);
    expect(Math.max(...full)).toBeLessThan(Math.max(...half) - 0.4);
    expect(Math.max(...full)).toBeGreaterThan(8.2);
  });

  it("倍電圧整流の出力が、入力ピークの約 2 倍(2Vpk − 2Vd 付近)になる", async () => {
    const out = lastThird((await simulate(voltageDoubler, "tran")) as TranData, "出力");
    expect(mean(out)).toBeGreaterThan(17);
    expect(mean(out)).toBeLessThan(19);
  });
});

describe("ツェナー定電圧・シリーズレギュレータ", () => {
  it("ツェナー電圧付近(5.1〜5.3V)で、電流の収支が合う", async () => {
    const op = (await simulate(zenerRegulator, "op")) as OpData;
    const vout = row(op, "出力電圧");
    expect(vout).toBeGreaterThan(5.0);
    expect(vout).toBeLessThan(5.35);
    expect(row(op, "ツェナーに流れる電流")).toBeCloseTo(row(op, "Rs に流れる電流") - row(op, "負荷に流れる電流"), 9);
  });

  it("入力が 12V → 20V に変わっても、出力は 0.3V 以内しか変わらない(ライン・レギュレーション)", async () => {
    const low = row((await simulate(zenerRegulator, "op", { Vin: 12 })) as OpData, "出力電圧");
    const high = row((await simulate(zenerRegulator, "op", { Vin: 20 })) as OpData, "出力電圧");
    expect(high - low).toBeGreaterThan(0);
    expect(high - low).toBeLessThan(0.3);
  });

  it("入力のリップルが、出力では 1/20 以下に減衰する", async () => {
    const tran = (await simulate(zenerRegulator, "tran")) as TranData;
    expect(ripple(after(tran, "出力", 0.01))).toBeLessThan(ripple(after(tran, "入力", 0.01)) / 20);
  });

  it("シリーズレギュレータの出力は Vz − Vbe 付近で、負荷が 10 倍重くなってもほとんど下がらない", async () => {
    const light = (await simulate(seriesRegulator, "op", { Rload: 100 })) as OpData;
    const heavy = (await simulate(seriesRegulator, "op", { Rload: 10 })) as OpData;
    expect(row(light, "出力電圧")).toBeGreaterThan(4.2);
    expect(row(light, "出力電圧")).toBeLessThan(4.7);
    expect(row(light, "出力電圧") - row(heavy, "出力電圧")).toBeLessThan(0.15);
  });

  it("同じ負荷(10Ω)では、ツェナーだけの回路よりシリーズレギュレータのほうが電圧を保てる", async () => {
    const zener = (await simulate(zenerRegulator, "op", { Rload: 50 })) as OpData;
    const series = (await simulate(seriesRegulator, "op", { Rload: 10 })) as OpData;
    expect(row(series, "出力電圧")).toBeGreaterThan(row(zener, "出力電圧") - 1);
    expect(row(series, "負荷に流れる電流")).toBeGreaterThan(row(zener, "負荷に流れる電流") * 3);
  });
});

describe("クリッパ・クランパ", () => {
  it("クリッパは Vb+0.7V と -0.7V で切り取り、クランパは下端を -0.7V に固定する", async () => {
    const tran = (await simulate(clipperClamper, "tran")) as TranData;
    const clip = after(tran, "クリッパの出力", 2e-3);
    expect(Math.max(...clip)).toBeCloseTo(2 + 0.7, 0);
    expect(Math.min(...clip)).toBeCloseTo(-0.7, 0);
    const clamp = after(tran, "クランパの出力", 2e-3);
    expect(Math.min(...clamp)).toBeCloseTo(-0.7, 0);
    expect(Math.max(...clamp)).toBeCloseTo(2 * 5 - 0.7, 0);
  });
});

describe("トランジスタスイッチ", () => {
  it("オン時は飽和し、遮断の瞬間のコレクタ電圧はダイオードありで Vcc+0.7V 付近、なしで 80V 付近になる", async () => {
    const withDiode = (await simulate(bjtSwitch, "tran", { diode: 1 })) as TranData;
    const vc = after(withDiode, "コレクタ", 0);
    expect(Math.min(...vc)).toBeLessThan(0.3);
    expect(Math.max(...vc)).toBeGreaterThan(12.3);
    expect(Math.max(...vc)).toBeLessThan(13.5);
    const without = (await simulate(bjtSwitch, "tran", { diode: 0 })) as TranData;
    expect(Math.max(...after(without, "コレクタ", 0))).toBeGreaterThan(70);
  });

  it("コイルの電流が Vcc/Rcoil(約 100mA)に近づく", async () => {
    const tran = (await simulate(bjtSwitch, "tran")) as TranData;
    expect(Math.max(...after(tran, "コイル", 0))).toBeCloseTo(0.1, 2);
  });

  it("ベース電流が足りないと、通電が落ち着いたあとも飽和しない", async () => {
    // 通電の直後は、コイルの電流がまだ 0 なので、トランジスタは(わずかな電流でも)飽和して見える。
    // 落ち着いた頃(4.5τ)のコレクタ電圧で比べる
    const settled = async (Rb: number) => {
      const tran = (await simulate(bjtSwitch, "tran", { Rb })) as TranData;
      const k = tran.time.findIndex((t) => t >= 4.5 * (100e-3 / 120));
      return tran.series.find((s) => s.label.startsWith("コレクタ"))!.y[k];
    };
    expect(await settled(4.7e3)).toBeLessThan(0.3);
    expect(await settled(100e3)).toBeGreaterThan(5);
  });
});

describe("MOSFET ローサイドスイッチ", () => {
  it("オン時にドレイン電圧が Id × Ron(0.2V 以下)まで下がり、負荷電流が Vdd/Rload に近づく", async () => {
    const tran = (await simulate(mosfetSwitch, "tran")) as TranData;
    expect(Math.min(...after(tran, "ドレイン", 1e-5))).toBeLessThan(0.2);
    expect(Math.max(...after(tran, "負荷", 1e-5))).toBeGreaterThan(0.95);
    expect(Math.max(...after(tran, "ドレイン", 1e-5))).toBeCloseTo(12, 1);
  });

  it("ゲート電圧がしきい値(3V)付近だと、十分には下がらない", async () => {
    const tran = (await simulate(mosfetSwitch, "tran", { Vgh: 3.5 })) as TranData;
    expect(Math.min(...after(tran, "ドレイン", 1e-5))).toBeGreaterThan(2);
  });
});

describe("エミッタフォロワ", () => {
  it("Ve は Vb − 0.7V 付近で、利得が 0 dB(−0.5 dB 以内)・位相ずれなし", async () => {
    const op = (await simulate(emitterFollower, "op")) as OpData;
    expect(row(op, "Vbe")).toBeGreaterThan(0.6);
    expect(row(op, "Vbe")).toBeLessThan(0.75);
    const ac = (await simulate(emitterFollower, "ac")) as AcData;
    const i = ac.frequency.findIndex((f) => f >= 10e3);
    expect(ac.series[0].gainDb[i]).toBeGreaterThan(-0.5);
    expect(ac.series[0].gainDb[i]).toBeLessThanOrEqual(0.01);
    expect(Math.abs(ac.series[0].phaseDeg[i])).toBeLessThan(5);
  });

  it("負荷を重くすると利得が下がる", async () => {
    const gain = async (RL: number) => {
      const ac = (await simulate(emitterFollower, "ac", { RL })) as AcData;
      return ac.series[0].gainDb[ac.frequency.findIndex((f) => f >= 10e3)];
    };
    expect(await gain(50)).toBeLessThan(await gain(10e3));
  });
});

describe("差動増幅回路", () => {
  it("左右がバランスし、差動利得が gm×RC(約 40 dB)になる", async () => {
    const op = (await simulate(differentialPair, "op")) as OpData;
    expect(row(op, "コレクタ電圧 Vc1")).toBeCloseTo(row(op, "コレクタ電圧 Vc2"), 6);
    const ic = row(op, "片方のトランジスタの電流");
    const expectedDb = 20 * Math.log10((ic / 0.02585) * 4.7e3);
    const ac = (await simulate(differentialPair, "ac")) as AcData;
    const i = ac.frequency.findIndex((f) => f >= 10e3);
    expect(Math.abs(ac.series[0].gainDb[i] - expectedDb)).toBeLessThan(1);
    expect(ac.series[1].gainDb[i]).toBeCloseTo(ac.series[0].gainDb[i] - 6.02, 0);
  });

  it("2 つの出力が逆位相で動く", async () => {
    const tran = (await simulate(differentialPair, "tran")) as TranData;
    const c1 = after(tran, "出力 Vc1", 1e-3);
    const c2 = after(tran, "出力 Vc2", 1e-3);
    const m1 = mean(c1);
    const m2 = mean(c2);
    const correlation = c1.reduce((sum, v, i) => sum + (v - m1) * (c2[i] - m2), 0);
    expect(correlation).toBeLessThan(0);
  });
});

describe("カレントミラー", () => {
  it("ミラー比が 1 に近く(ベース電流の誤差とアーリー効果で 1〜10% の範囲)、負荷が変わっても電流がほぼ一定", async () => {
    const op = (await simulate(currentMirror, "op")) as OpData;
    expect(row(op, "ミラー比")).toBeGreaterThan(0.97);
    expect(row(op, "ミラー比")).toBeLessThan(1.1);
    const small = row((await simulate(currentMirror, "op", { Rload: 1e3 })) as OpData, "出力電流");
    const large = row((await simulate(currentMirror, "op", { Rload: 8e3 })) as OpData, "出力電流");
    expect(Math.abs(small / large - 1)).toBeLessThan(0.1);
  });

  it("負荷が大きすぎると Q2 が飽和して電流が減る", async () => {
    const saturated = row((await simulate(currentMirror, "op", { Rload: 100e3 })) as OpData, "出力電流");
    const normal = row((await simulate(currentMirror, "op")) as OpData, "出力電流");
    expect(saturated).toBeLessThan(normal * 0.5);
  });
});

describe("プッシュプル出力段", () => {
  it("AB 級は入力に追従し、B 級は小さな入力で出力が出ない(クロスオーバー歪み)", async () => {
    const small = { vamp: 0.5 };
    const ab = (await simulate(pushPull, "tran", { ...small, bias: 1 })) as TranData;
    const b = (await simulate(pushPull, "tran", { ...small, bias: 0 })) as TranData;
    expect(Math.max(...after(ab, "出力", 1e-3))).toBeGreaterThan(0.4);
    expect(Math.max(...after(b, "出力", 1e-3))).toBeLessThan(0.05);
  });

  it("大きな入力では、どちらも出力が入力の約 −0.1V 以内に追従する", async () => {
    const ab = (await simulate(pushPull, "tran", { bias: 1 })) as TranData;
    expect(Math.max(...after(ab, "出力", 1e-3))).toBeGreaterThan(2.8);
    expect(Math.min(...after(ab, "出力", 1e-3))).toBeLessThan(-2.8);
  });
});

describe("降圧型 DC-DC コンバータ(ダイオードのモデル変更後)", () => {
  it("定常の出力電圧が Vin×D(6V)より、ダイオードの損失ぶん少し低い", async () => {
    const tran = (await simulate(buckConverter, "tran")) as TranData;
    const m = mean(after(tran, "出力", 2.5e-3));
    expect(m).toBeGreaterThan(5.3);
    expect(m).toBeLessThan(6);
  });
});
