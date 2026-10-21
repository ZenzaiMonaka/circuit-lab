import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rcLowpass: Template = {
  id: "rc-lowpass",
  category: "filter",
  title: "RC ローパスフィルタ",
  summary: "低い周波数を通し、高い周波数を弱める 1 次のフィルタ(積分回路)",
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
      // 入力の 4 周期分を、1 周期あたり 400 点で計算する
      command: (v) => `.tran ${1 / v.fin / 400} ${4 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)" },
        { label: "出力 Vout", unit: "V", signal: "v(out)" },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 DC 0 AC 1 PULSE(0 1 0 1n 1n ${0.5 / v.fin} ${1 / v.fin})
R1 in out ${v.R1}
C1 out 0 ${v.C1}`,
  schematic: {
    width: 320,
    height: 190,
    parts: [
      { kind: "VPULSE", from: [60, 40], to: [60, 140], name: "Vin", note: "1V 矩形波" },
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
