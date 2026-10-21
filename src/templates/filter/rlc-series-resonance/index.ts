import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rlcSeriesResonance: Template = {
  id: "rlc-series-resonance",
  category: "filter",
  title: "RLC 直列共振回路",
  summary: "特定の周波数だけを通すバンドパスフィルタ(共振周波数 f0 と Q)",
  params: [
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 50, min: 1, max: 10e3, scale: "log" },
    { key: "L1", label: "インダクタ L1", unit: "H", default: 10e-3, min: 1e-6, max: 1, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 1e-6, min: 100e-12, max: 100e-6, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 100 10 10Meg",
      probes: [{ label: "Vout(R1 の両端) / Vin", unit: "", signal: "v(out)" }],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 DC 0 AC 1
L1 in a ${v.L1}
C1 a out ${v.C1}
R1 out 0 ${v.R1}`,
  schematic: {
    width: 380,
    height: 190,
    parts: [
      { kind: "VAC", from: [60, 40], to: [60, 140], name: "Vin" },
      { kind: "L", from: [100, 40], to: [180, 40], name: "L1", param: "L1" },
      { kind: "C", from: [180, 40], to: [260, 40], name: "C1", param: "C1" },
      { kind: "R", from: [300, 40], to: [300, 140], name: "R1", param: "R1" },
      { kind: "GND", at: [180, 140] },
      { kind: "TEXT", at: [326, 34], text: "Vout", anchor: "start" },
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
