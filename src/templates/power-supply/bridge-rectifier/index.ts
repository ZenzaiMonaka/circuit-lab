import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const bridgeRectifier: Template = {
  id: "bridge-rectifier",
  category: "power-supply",
  title: "ブリッジ全波整流",
  summary: "ダイオード 4 個で、交流の両方の半周期を使って直流にする",
  params: [
    { key: "Vpk", label: "交流の振幅(ピーク電圧)", unit: "V", default: 10, min: 1, max: 50, scale: "log" },
    { key: "f", label: "交流の周波数", unit: "Hz", default: 50, min: 10, max: 1e3, scale: "log" },
    { key: "C1", label: "平滑コンデンサ C1", unit: "F", default: 220e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 1e3, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.f / 400} ${8 / v.f}`,
      probes: [
        { label: "交流入力 Vin", unit: "V", signal: (get) => get("v(p)").map((p, i) => p - get("v(n)")[i]), group: "電圧" },
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)", group: "電圧" },
      ],
    },
  ],
  models: ["DIODE"],
  buildNetlist: (v) => `Vin p n SIN(0 ${v.Vpk} ${v.f})
D1 p out DGEN
D2 n out DGEN
D3 0 p DGEN
D4 0 n DGEN
C1 out 0 ${v.C1}
Rload out 0 ${v.Rload}`,
  schematic: {
    width: 500,
    height: 240,
    parts: [
      { kind: "VAC", from: [120, 120], to: [320, 120], name: "Vin" },
      { kind: "D", from: [120, 120], to: [220, 40], name: "D1" },
      { kind: "D", from: [320, 120], to: [220, 40], name: "D2" },
      { kind: "D", from: [220, 200], to: [120, 120], name: "D3" },
      { kind: "D", from: [220, 200], to: [320, 120], name: "D4" },
      { kind: "C", from: [380, 40], to: [380, 200], name: "C1", param: "C1" },
      { kind: "R", from: [440, 40], to: [440, 200], name: "Rload", param: "Rload" },
      { kind: "GND", at: [220, 200] },
      { kind: "TEXT", at: [220, 28], text: "Vout", anchor: "middle" },
    ],
    wires: [
      [[220, 40], [440, 40]],
      [[220, 200], [440, 200]],
    ],
    junctions: [[220, 40], [220, 200], [380, 40], [380, 200], [120, 120], [320, 120]],
  },
  explanation,
};
