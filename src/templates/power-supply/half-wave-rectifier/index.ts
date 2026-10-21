import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const halfWaveRectifier: Template = {
  id: "half-wave-rectifier",
  category: "power-supply",
  title: "半波整流＋コンデンサ平滑",
  summary: "ダイオード 1 個で交流を直流にし、コンデンサでならす",
  params: [
    { key: "Vpk", label: "交流の振幅(ピーク電圧)", unit: "V", default: 10, min: 1, max: 50, scale: "log" },
    { key: "f", label: "交流の周波数", unit: "Hz", default: 50, min: 10, max: 1e3, scale: "log" },
    { key: "Rs", label: "電源の内部抵抗 Rs", unit: "Ω", default: 1, min: 0.1, max: 100, scale: "log" },
    { key: "C1", label: "平滑コンデンサ C1", unit: "F", default: 220e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 1e3, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 交流の 8 周期ぶん。最初の数周期でコンデンサが充電され、そのあと一定のリップルになる
      command: (v) => `.tran ${1 / v.f / 400} ${8 / v.f}`,
      probes: [
        { label: "交流入力 Vin", unit: "V", signal: "v(in)", group: "電圧" },
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)", group: "電圧" },
        { label: "ダイオードに流れる電流", unit: "A", signal: (get) => get("i(vin)").map((i) => -i) },
      ],
    },
  ],
  models: ["DIODE"],
  buildNetlist: (v) => `Vin in 0 SIN(0 ${v.Vpk} ${v.f})
Rs in a ${v.Rs}
D1 a out DGEN
C1 out 0 ${v.C1}
Rload out 0 ${v.Rload}`,
  schematic: {
    width: 480,
    height: 220,
    parts: [
      { kind: "VAC", from: [40, 50], to: [40, 180], name: "Vin" },
      { kind: "R", from: [80, 50], to: [150, 50], name: "Rs", param: "Rs" },
      { kind: "D", from: [170, 50], to: [250, 50], name: "D1" },
      { kind: "C", from: [300, 50], to: [300, 180], name: "C1", param: "C1" },
      { kind: "R", from: [380, 50], to: [380, 180], name: "Rload", param: "Rload" },
      { kind: "GND", at: [200, 180] },
      { kind: "TEXT", at: [440, 44], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 50], [80, 50]],
      [[150, 50], [170, 50]],
      [[250, 50], [440, 50]],
      [[40, 180], [380, 180]],
    ],
    junctions: [[300, 50], [380, 50], [300, 180]],
  },
  explanation,
};
