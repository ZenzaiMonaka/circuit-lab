import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rcCharge: Template = {
  id: "rc-charge",
  category: "transient",
  title: "RC 充放電",
  summary: "コンデンサが抵抗を通して充電・放電される様子(時定数)",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 5, min: 0.1, max: 100, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 1e3, min: 10, max: 10e6, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 1e-6, min: 10e-12, max: 1e-3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 入力は「5τ オン、5τ オフ」の矩形波。充電と放電を 1 回ずつ、合計 20τ 見る
      command: (v) => {
        const tau = v.R1 * v.C1;
        return `.tran ${tau / 200} ${20 * tau}`;
      },
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "電圧" },
        { label: "コンデンサの電圧 Vout", unit: "V", signal: "v(out)", group: "電圧" },
        { label: "充放電の電流 I", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => {
    const tau = v.R1 * v.C1;
    return `Vin in 0 PULSE(0 ${v.Vin} 0 1n 1n ${5 * tau} ${10 * tau})
R1 in out ${v.R1}
C1 out 0 ${v.C1}`;
  },
  schematic: {
    width: 320,
    height: 190,
    parts: [
      { kind: "VPULSE", from: [60, 40], to: [60, 140], name: "Vin", note: "矩形波" },
      { kind: "R", from: [100, 40], to: [200, 40], name: "R1", param: "R1" },
      { kind: "C", from: [200, 40], to: [200, 140], name: "C1", param: "C1" },
      { kind: "GND", at: [130, 140] },
      { kind: "TEXT", at: [262, 34], text: "Vout", anchor: "start" },
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
