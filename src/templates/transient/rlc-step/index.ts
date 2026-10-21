import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rlcStep: Template = {
  id: "rlc-step",
  category: "transient",
  title: "RLC 直列回路のステップ応答",
  summary: "減衰振動(オーバーシュート)と、減衰の強さによる違い",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 5, min: 0.1, max: 100, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 20, min: 1, max: 2e3, scale: "log" },
    { key: "L1", label: "インダクタ L1", unit: "H", default: 10e-3, min: 100e-6, max: 1, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 1e-6, min: 100e-9, max: 100e-6, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 共振の周期 T0 の 8 倍、または減衰の時定数(2L/R)の 5 倍の長いほうまで、T0 の 1/100 刻みで計算する。
      // R が小さいと減衰が非常に遅いので、計算が重くなりすぎないよう T0 の 200 倍までにする
      command: (v) => {
        const period = 2 * Math.PI * Math.sqrt(v.L1 * v.C1);
        const stop = Math.min(Math.max(8 * period, (10 * v.L1) / v.R1), 200 * period);
        return `.tran ${period / 100} ${stop}`;
      },
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "電圧" },
        { label: "コンデンサの電圧 Vc", unit: "V", signal: "v(out)", group: "電圧" },
        { label: "電流 I", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 PULSE(0 ${v.Vin} 0 1n 1n 1 2)
R1 in a ${v.R1}
L1 a out ${v.L1}
C1 out 0 ${v.C1}`,
  schematic: {
    width: 360,
    height: 190,
    parts: [
      { kind: "VPULSE", from: [60, 40], to: [60, 140], name: "Vin", note: "ステップ" },
      { kind: "R", from: [100, 40], to: [180, 40], name: "R1", param: "R1" },
      { kind: "L", from: [180, 40], to: [260, 40], name: "L1", param: "L1" },
      { kind: "C", from: [300, 40], to: [300, 140], name: "C1", param: "C1" },
      { kind: "GND", at: [180, 140] },
      { kind: "TEXT", at: [326, 34], text: "Vc", anchor: "start" },
    ],
    wires: [
      [[60, 40], [100, 40]],
      [[260, 40], [320, 40]],
      [[60, 140], [300, 140]],
    ],
    junctions: [[300, 40]],
  },
  explanation,
};
