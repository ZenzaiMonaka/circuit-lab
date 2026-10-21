import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rcHighpass: Template = {
  id: "rc-highpass",
  category: "filter",
  title: "RC ハイパスフィルタ",
  summary: "高い周波数を通し、低い周波数(直流)を遮る 1 次のフィルタ(微分回路)",
  params: [
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 1e3, min: 10, max: 10e6, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 159e-9, min: 10e-12, max: 100e-6, scale: "log" },
    { key: "fin", label: "入力の周波数(過渡解析)", unit: "Hz", default: 200, min: 1, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 40 1 10Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 400} ${4 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)" },
        { label: "出力 Vout", unit: "V", signal: "v(out)" },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 DC 0 AC 1 PULSE(0 1 0 1n 1n ${0.5 / v.fin} ${1 / v.fin})
C1 in out ${v.C1}
R1 out 0 ${v.R1}`,
  schematic: {
    width: 320,
    height: 190,
    parts: [
      { kind: "VPULSE", from: [60, 40], to: [60, 140], name: "Vin", note: "1V 矩形波" },
      { kind: "C", from: [100, 40], to: [180, 40], name: "C1", param: "C1" },
      { kind: "R", from: [220, 40], to: [220, 140], name: "R1", param: "R1" },
      { kind: "GND", at: [140, 140] },
      { kind: "TEXT", at: [282, 34], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[60, 40], [100, 40]],
      [[180, 40], [280, 40]],
      [[60, 140], [220, 140]],
    ],
    junctions: [[220, 40], [280, 40]],
  },
  explanation,
};
