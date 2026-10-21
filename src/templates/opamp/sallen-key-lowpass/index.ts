import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const sallenKeyLowpass: Template = {
  id: "sallen-key-lowpass",
  category: "opamp",
  title: "サレンキー型 2 次ローパスフィルタ",
  summary: "オペアンプ 1 個で作る、-40 dB/dec で下がる 2 次のローパスフィルタ",
  params: [
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "R2", label: "抵抗 R2", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "C1", label: "帰還コンデンサ C1", unit: "F", default: 20e-9, min: 100e-12, max: 10e-6, scale: "log" },
    { key: "C2", label: "接地コンデンサ C2", unit: "F", default: 10e-9, min: 100e-12, max: 10e-6, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 60 10 1Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
  ],
  models: ["OPAMP"],
  buildNetlist: (v) => `Vp vp 0 DC 15
Vn vn 0 DC -15
Vin in 0 DC 0 AC 1
R1 in a ${v.R1}
R2 a b ${v.R2}
C1 a out ${v.C1}
C2 b 0 ${v.C2}
XU1 b out out vp vn OPAMP`,
  schematic: {
    width: 440,
    height: 220,
    parts: [
      { kind: "VAC", from: [40, 120], to: [40, 200], name: "Vin" },
      { kind: "R", from: [60, 120], to: [110, 120], name: "R1", param: "R1" },
      { kind: "R", from: [125, 120], to: [185, 120], name: "R2", param: "R2" },
      { kind: "C", from: [205, 120], to: [205, 200], name: "C2", param: "C2" },
      { kind: "C", from: [145, 40], to: [225, 40], name: "C1", param: "C1" },
      { kind: "OPAMP", at: [260, 100], name: "U1", note: "ボルテージフォロワ" },
      { kind: "GND", at: [120, 200] },
      { kind: "TEXT", at: [400, 94], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 120], [60, 120]],
      [[110, 120], [125, 120]],
      [[185, 120], [260, 120]],
      [[125, 120], [125, 40], [145, 40]],
      [[225, 40], [380, 40], [380, 100]],
      [[340, 100], [400, 100]],
      [[360, 100], [360, 55], [240, 55], [240, 80], [260, 80]],
      [[40, 200], [205, 200]],
    ],
    junctions: [[125, 120], [205, 120], [360, 100], [380, 100]],
  },
  explanation,
};
