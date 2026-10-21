import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const wheatstoneBridge: Template = {
  id: "wheatstone-bridge",
  category: "basic",
  title: "ホイートストンブリッジ",
  summary: "2 組の分圧回路の電圧差で、抵抗の小さな変化を見つける",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 10, min: 0.1, max: 100, scale: "log" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 1e3, min: 10, max: 1e6, scale: "log" },
    { key: "R2", label: "抵抗 R2", unit: "Ω", default: 1e3, min: 10, max: 1e6, scale: "log" },
    { key: "R3", label: "抵抗 R3", unit: "Ω", default: 1e3, min: 10, max: 1e6, scale: "log" },
    { key: "R4", label: "抵抗 R4(測定したい抵抗)", unit: "Ω", default: 1e3, min: 10, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "a 点の電圧 Va", unit: "V", signal: "v(a)" },
        { label: "b 点の電圧 Vb", unit: "V", signal: "v(b)" },
        { label: "ブリッジの出力 Vab = Va − Vb", unit: "V", signal: (get) => get("v(a)").map((va, i) => va - get("v(b)")[i]) },
        { label: "電源から流れる電流", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
      ],
    },
  ],
  models: [],
  buildNetlist: (v) => `Vin top 0 DC ${v.Vin}
R1 top a ${v.R1}
R2 a 0 ${v.R2}
R3 top b ${v.R3}
R4 b 0 ${v.R4}`,
  schematic: {
    width: 380,
    height: 200,
    parts: [
      { kind: "VDC", from: [60, 40], to: [60, 160], name: "Vin", param: "Vin" },
      { kind: "R", from: [180, 40], to: [180, 100], name: "R1", param: "R1" },
      { kind: "R", from: [180, 100], to: [180, 160], name: "R2", param: "R2" },
      { kind: "R", from: [300, 40], to: [300, 100], name: "R3", param: "R3" },
      { kind: "R", from: [300, 100], to: [300, 160], name: "R4", param: "R4" },
      { kind: "VM", from: [180, 100], to: [300, 100], name: "" },
      { kind: "GND", at: [120, 160] },
      { kind: "TEXT", at: [240, 136], text: "Vab", anchor: "middle" },
      { kind: "TEXT", at: [166, 96], text: "a", anchor: "end" },
      { kind: "TEXT", at: [314, 96], text: "b", anchor: "start" },
    ],
    wires: [
      [[60, 40], [300, 40]],
      [[60, 160], [300, 160]],
    ],
    junctions: [[180, 40], [180, 160], [180, 100], [300, 100]],
  },
  explanation,
};
