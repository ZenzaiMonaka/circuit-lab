import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const voltageDivider: Template = {
  id: "voltage-divider",
  category: "basic",
  title: "抵抗の分圧回路",
  summary: "2 本の抵抗で電圧を分ける、もっとも基本の回路",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 12, min: 0.1, max: 100, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 10e3, min: 10, max: 10e6, scale: "log" },
    { key: "R2", label: "抵抗 R2", unit: "Ω", default: 10e3, min: 10, max: 10e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "入力電圧 Vin", unit: "V", signal: "v(in)" },
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)" },
        { label: "回路に流れる電流 I", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
        { label: "R1 の消費電力", unit: "W", signal: (get, v) => get("i(vin)").map((i) => i * i * v.R1) },
        { label: "R2 の消費電力", unit: "W", signal: (get, v) => get("i(vin)").map((i) => i * i * v.R2) },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin in 0 DC ${v.Vin}
R1 in out ${v.R1}
R2 out 0 ${v.R2}`,
  schematic: {
    width: 340,
    height: 200,
    parts: [
      { kind: "VDC", from: [60, 40], to: [60, 160], name: "Vin", param: "Vin" },
      { kind: "R", from: [140, 40], to: [240, 40], name: "R1", param: "R1" },
      { kind: "R", from: [240, 40], to: [240, 160], name: "R2", param: "R2" },
      { kind: "GND", at: [150, 160] },
      { kind: "TEXT", at: [300, 34], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[60, 40], [140, 40]],
      [[240, 40], [300, 40]],
      [[60, 160], [240, 160]],
    ],
    junctions: [[240, 40], [300, 40]],
  },
  explanation,
};
