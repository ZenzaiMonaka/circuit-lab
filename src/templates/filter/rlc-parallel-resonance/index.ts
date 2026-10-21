import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const rlcParallelResonance: Template = {
  id: "rlc-parallel-resonance",
  category: "filter",
  title: "RLC 並列共振回路",
  summary: "インダクタとコンデンサの並列回路(タンク回路)による同調",
  params: [
    { key: "Rs", label: "信号源の抵抗 Rs", unit: "Ω", default: 1e3, min: 1, max: 1e6, scale: "log" },
    { key: "L1", label: "インダクタ L1", unit: "H", default: 10e-3, min: 1e-6, max: 1, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 1e-6, min: 100e-12, max: 100e-6, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 100 10 10Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 DC 0 AC 1
Rs in out ${v.Rs}
L1 out 0 ${v.L1}
C1 out 0 ${v.C1}`,
  schematic: {
    width: 400,
    height: 190,
    parts: [
      { kind: "VAC", from: [60, 40], to: [60, 140], name: "Vin" },
      { kind: "R", from: [100, 40], to: [200, 40], name: "Rs", param: "Rs" },
      { kind: "L", from: [240, 40], to: [240, 140], name: "L1", param: "L1" },
      { kind: "C", from: [320, 40], to: [320, 140], name: "C1", param: "C1" },
      { kind: "GND", at: [150, 140] },
      { kind: "TEXT", at: [372, 34], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[60, 40], [100, 40]],
      [[200, 40], [370, 40]],
      [[60, 140], [320, 140]],
    ],
    junctions: [[240, 40], [320, 40], [240, 140]],
  },
  explanation,
};
