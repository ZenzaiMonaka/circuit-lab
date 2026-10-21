// 実際に ngspice を動かして、理論値と比べる(要件の完成条件)。
import { describe, expect, it } from "vitest";
import type { AcData, OpData, TranData } from "../src/engine/results";
import { voltageDivider } from "../src/templates/basic/voltage-divider";
import { rcLowpass } from "../src/templates/filter/rc-lowpass";
import { invertingAmp } from "../src/templates/opamp/inverting-amp";
import { buckConverter } from "../src/templates/power-electronics/buck-converter";
import { commonEmitter } from "../src/templates/transistor/common-emitter";
import { simulate } from "./helpers/simulate";

const row = (data: OpData, label: string) => data.rows.find((r) => r.label.startsWith(label))!.value;
const series = (data: TranData, label: string) => data.series.find((s) => s.label.startsWith(label))!.y;
/** 指定した周波数にいちばん近い点の番号 */
const nearest = (ac: AcData, hz: number) =>
  ac.frequency.reduce(
    (best, f, i) => (Math.abs(Math.log(f / hz)) < Math.abs(Math.log(ac.frequency[best] / hz)) ? i : best),
    0,
  );

describe("分圧回路", () => {
  it("出力電圧が Vin × R2/(R1+R2) になる", async () => {
    const op = (await simulate(voltageDivider, "op", { Vin: 10, R1: 3e3, R2: 7e3 })) as OpData;
    expect(row(op, "出力電圧")).toBeCloseTo(7, 6);
    expect(row(op, "回路に流れる電流")).toBeCloseTo(1e-3, 9);
  });
});

describe("RC ローパスフィルタ", () => {
  it("カットオフ周波数で -3 dB・位相 -45°になる", async () => {
    const ac = (await simulate(rcLowpass, "ac", { R1: 1e3, C1: 159.155e-9 })) as AcData; // fc = 1 kHz
    const i = nearest(ac, 1000);
    expect(ac.series[0].gainDb[i]).toBeCloseTo(-3.01, 1);
    expect(ac.series[0].phaseDeg[i]).toBeCloseTo(-45, 0);
  });

  it("過渡解析で時定数ぶん経つと 63% まで充電される", async () => {
    // 入力 200Hz の矩形波(半周期 2.5ms)、tau = 1 kΩ × 1 µF = 1 ms
    const tran = (await simulate(rcLowpass, "tran", { R1: 1e3, C1: 1e-6, fin: 200 })) as TranData;
    const k = tran.time.findIndex((t) => t >= 1e-3);
    expect(series(tran, "出力")[k]).toBeCloseTo(1 - Math.exp(-1), 2);
  });
});

describe("エミッタ接地増幅回路", () => {
  it("直流動作点が設計式の見積もり(Ic ≒ 3 mA、Vce が数 V)に収まる", async () => {
    const op = (await simulate(commonEmitter, "op")) as OpData;
    expect(row(op, "コレクタ電流")).toBeGreaterThan(2.5e-3);
    expect(row(op, "コレクタ電流")).toBeLessThan(3.5e-3);
    expect(row(op, "Vce")).toBeGreaterThan(3);
  });

  it("中域の利得が -(RC∥RL)/re に近く、位相が反転する", async () => {
    const op = (await simulate(commonEmitter, "op")) as OpData;
    const re = 0.026 / row(op, "コレクタ電流");
    const expectedDb = 20 * Math.log10(((2.2e3 * 10e3) / (2.2e3 + 10e3)) / re);
    const ac = (await simulate(commonEmitter, "ac")) as AcData;
    const i = nearest(ac, 10e3);
    expect(Math.abs(ac.series[0].gainDb[i] - expectedDb)).toBeLessThan(3);
    expect(Math.abs(Math.abs(ac.series[0].phaseDeg[i]) - 180)).toBeLessThan(15);
  });
});

describe("反転増幅回路", () => {
  it("低周波の利得が -Rf/Rin(20 dB・位相 180°)になる", async () => {
    const ac = (await simulate(invertingAmp, "ac")) as AcData;
    const i = nearest(ac, 100);
    expect(ac.series[0].gainDb[i]).toBeCloseTo(20, 1);
    expect(Math.abs(ac.series[0].phaseDeg[i])).toBeCloseTo(180, 0);
  });

  it("帯域 GBW/(1+Rf/Rin) ≒ 91 kHz で利得が約 3 dB 下がる", async () => {
    const ac = (await simulate(invertingAmp, "ac")) as AcData;
    expect(ac.series[0].gainDb[nearest(ac, 91e3)]).toBeCloseTo(17, 0);
  });

  it("入力が大きすぎると出力が電源電圧の内側でつぶれる", async () => {
    const tran = (await simulate(invertingAmp, "tran", { vamp: 2 })) as TranData;
    const vout = series(tran, "出力");
    expect(Math.max(...vout)).toBeGreaterThan(12.5);
    expect(Math.max(...vout)).toBeLessThan(13.6);
  });

  it("小さな入力では -Rf/Rin 倍に正確に増幅される", async () => {
    const tran = (await simulate(invertingAmp, "tran", { vamp: 0.1 })) as TranData;
    expect(Math.min(...series(tran, "出力"))).toBeCloseTo(-1, 1);
  });
});

describe("降圧型 DC-DC コンバータ", () => {
  it("定常状態の平均出力が Vin × D に近い(損失ぶん低い)", async () => {
    const tran = (await simulate(buckConverter, "tran")) as TranData;
    const tail = series(tran, "出力").filter((_, i) => tran.time[i] > 2.5e-3);
    const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
    expect(mean).toBeGreaterThan(5.5);
    expect(mean).toBeLessThanOrEqual(6);
  });

  it("軽負荷でインダクタ電流が 0 付近に留まる(不連続モード)", async () => {
    const tran = (await simulate(buckConverter, "tran", { Rload: 500 })) as TranData;
    const tail = series(tran, "インダクタ").filter((_, i) => tran.time[i] > 2.5e-3);
    // 電流が 0 になるとダイオードが切れ、ダイオードの容量と L の共振で数 mA の小さな振動が残る
    expect(Math.min(...tail)).toBeGreaterThan(-10e-3);
    expect(tail.filter((x) => Math.abs(x) < 5e-3).length).toBeGreaterThan(100);
  });
});
