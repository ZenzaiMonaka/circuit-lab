import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const ledResistor: Template = {
  id: "led-resistor",
  category: "basic",
  title: "LED の電流制限抵抗",
  summary: "LED に流す電流を、直列の抵抗で決める",
  params: [
    { key: "Vin", label: "電源電圧 Vin", unit: "V", default: 5, min: 2.5, max: 24, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 330, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "LED の順方向電圧 Vf", unit: "V", signal: "v(a)" },
        { label: "LED に流れる電流 If", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
        { label: "抵抗の電圧降下", unit: "V", signal: (get, v) => get("v(a)").map((va) => v.Vin - va) },
        { label: "抵抗の消費電力", unit: "W", signal: (get, v) => get("i(vin)").map((i) => i * i * v.R1) },
        { label: "LED の消費電力", unit: "W", signal: (get) => get("v(a)").map((va, i) => -va * get("i(vin)")[i]) },
      ],
    },
  ],
  models: ["LED"],
  buildNetlist: (v) => `Vin in 0 DC ${v.Vin}
R1 in a ${v.R1}
D1 a 0 DLED`,
  schematic: {
    width: 320,
    height: 200,
    parts: [
      { kind: "VDC", from: [60, 40], to: [60, 160], name: "Vin", param: "Vin" },
      { kind: "R", from: [100, 40], to: [200, 40], name: "R1", param: "R1" },
      { kind: "D", from: [240, 40], to: [240, 160], name: "LED", note: "赤色" },
      { kind: "GND", at: [150, 160] },
    ],
    wires: [
      [[60, 40], [100, 40]],
      [[200, 40], [240, 40]],
      [[60, 160], [240, 160]],
    ],
    junctions: [],
  },
  explanation,
};
