import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const clipperClamper: Template = {
  id: "clipper-clamper",
  category: "power-supply",
  title: "ダイオード クリッパ／クランパ",
  summary: "波形の上下を切り取る(クリッパ)・波形全体を上にずらす(クランパ)",
  params: [
    { key: "Vpk", label: "入力の振幅(ピーク電圧)", unit: "V", default: 5, min: 0.5, max: 20, scale: "log" },
    { key: "f", label: "入力の周波数", unit: "Hz", default: 1e3, min: 10, max: 100e3, scale: "log" },
    { key: "Vb", label: "クリッパのバイアス電圧 Vb", unit: "V", default: 2, min: 0, max: 10, scale: "linear" },
    { key: "R1", label: "クリッパの抵抗 R1", unit: "Ω", default: 1e3, min: 100, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.f / 400} ${5 / v.f}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "クリッパ(上下を切り取る)" },
        { label: "クリッパの出力", unit: "V", signal: "v(clip)", group: "クリッパ(上下を切り取る)" },
        { label: "入力 Vin ", unit: "V", signal: "v(in)", group: "クランパ(波形を上にずらす)" },
        { label: "クランパの出力", unit: "V", signal: "v(clamp)", group: "クランパ(波形を上にずらす)" },
      ],
    },
  ],
  models: ["DIODE"],
  buildNetlist: (v) => `Vin in 0 SIN(0 ${v.Vpk} ${v.f})
R1 in clip ${v.R1}
D1 clip nb DGEN
Vb nb 0 DC ${v.Vb}
D2 0 clip DGEN
C2 in clamp 1u
D3 0 clamp DGEN
Rl clamp 0 100k`,
  schematic: {
    width: 440,
    height: 410,
    parts: [
      { kind: "VAC", from: [40, 60], to: [40, 360], name: "Vin" },
      { kind: "R", from: [100, 60], to: [200, 60], name: "R1", param: "R1" },
      { kind: "D", from: [240, 60], to: [240, 110], name: "D1" },
      { kind: "VDC", from: [240, 110], to: [240, 180], name: "Vb", param: "Vb" },
      { kind: "D", from: [300, 180], to: [300, 60], name: "D2" },
      { kind: "C", from: [110, 240], to: [190, 240], name: "C2", note: "1 µF" },
      { kind: "D", from: [220, 360], to: [220, 240], name: "D3" },
      { kind: "R", from: [300, 240], to: [300, 360], name: "Rl", note: "100 kΩ" },
      { kind: "GND", at: [40, 360] },
      { kind: "GND", at: [270, 180] },
      { kind: "GND", at: [260, 360] },
      { kind: "TEXT", at: [380, 54], text: "Vclip", anchor: "start" },
      { kind: "TEXT", at: [380, 234], text: "Vclamp", anchor: "start" },
    ],
    wires: [
      [[40, 60], [100, 60]],
      [[200, 60], [380, 60]],
      [[240, 180], [300, 180]],
      [[90, 60], [90, 240], [110, 240]],
      [[190, 240], [380, 240]],
      [[220, 360], [300, 360]],
    ],
    junctions: [[90, 60], [240, 60], [300, 60], [220, 240], [300, 240], [270, 180], [260, 360]],
  },
  explanation,
};
