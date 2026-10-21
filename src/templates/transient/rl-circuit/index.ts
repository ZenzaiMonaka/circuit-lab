import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rlCircuit: Template = {
  id: "rl-circuit",
  category: "transient",
  title: "RL 回路の過渡応答",
  summary: "インダクタの電流がゆっくり立ち上がる様子(時定数 L/R)",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 5, min: 0.1, max: 100, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 100, min: 1, max: 10e3, scale: "log" },
    { key: "L1", label: "インダクタ L1", unit: "H", default: 10e-3, min: 10e-6, max: 1, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 入力は「5τ オン、5τ オフ」の矩形波。通電と遮断を 1 回ずつ、合計 20τ 見る
      command: (v) => {
        const tau = v.L1 / v.R1;
        return `.tran ${tau / 200} ${20 * tau}`;
      },
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "電圧" },
        { label: "インダクタの電圧 VL", unit: "V", signal: "v(x)", group: "電圧" },
        { label: "電流 I", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => {
    const tau = v.L1 / v.R1;
    return `Vin in 0 PULSE(0 ${v.Vin} 0 1n 1n ${5 * tau} ${10 * tau})
R1 in x ${v.R1}
L1 x 0 ${v.L1}`;
  },
  schematic: {
    width: 320,
    height: 190,
    parts: [
      { kind: "VPULSE", from: [60, 40], to: [60, 140], name: "Vin", note: "矩形波" },
      { kind: "R", from: [100, 40], to: [200, 40], name: "R1", param: "R1" },
      { kind: "L", from: [200, 40], to: [200, 140], name: "L1", param: "L1" },
      { kind: "GND", at: [130, 140] },
      { kind: "TEXT", at: [262, 34], text: "VL", anchor: "start" },
    ],
    wires: [
      [[60, 40], [100, 40]],
      [[200, 40], [260, 40]],
      [[60, 140], [200, 140]],
    ],
    junctions: [[200, 40], [260, 40]],
  },
  explanation,
};
