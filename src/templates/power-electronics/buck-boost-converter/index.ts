import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const buckBoostConverter: Template = {
  id: "buck-boost-converter",
  category: "power-electronics",
  title: "昇降圧型 DC-DC コンバータ(バックブースト)",
  summary: "入力より高い電圧も低い電圧も作れる。出力の極性は反転する",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 12, min: 3, max: 50, scale: "log" },
    { key: "duty", label: "デューティ比 D", unit: "%", default: 50, min: 5, max: 85, scale: "linear" },
    { key: "fsw", label: "スイッチング周波数 fsw", unit: "Hz", default: 100e3, min: 10e3, max: 500e3, scale: "log" },
    { key: "L1", label: "インダクタ L", unit: "H", default: 100e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "C1", label: "出力コンデンサ C", unit: "F", default: 100e-6, min: 1e-6, max: 1e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 20, min: 2, max: 1e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: false,
      command: (v) => `.tran ${1 / v.fsw / 100} 5m 0 ${1 / v.fsw / 50}`,
      probes: [
        { label: "出力電圧 Vout(グラウンドより低い)", unit: "V", signal: "v(out)", group: "出力電圧" },
        { label: "スイッチ点の電圧 Vsw", unit: "V", signal: "v(sw)", group: "スイッチ点の電圧" },
        { label: "インダクタ電流 IL", unit: "A", signal: "i(l1)" },
      ],
    },
  ],
  models: ["SWITCH", "DIODE"],
  buildNetlist: (v) => {
    const period = 1 / v.fsw;
    const edge = 10e-9;
    return `Vin in 0 DC ${v.Vin}
Vg g 0 PULSE(0 5 0 ${edge} ${edge} ${(v.duty / 100) * period - edge} ${period})
S1 in sw g 0 SWGEN
L1 sw 0 ${v.L1}
D1 out sw DGEN
C1 out 0 ${v.C1}
Rload out 0 ${v.Rload}`;
  },
  schematic: {
    width: 600,
    height: 240,
    parts: [
      { kind: "VDC", from: [40, 60], to: [40, 200], name: "Vin", param: "Vin" },
      { kind: "SW", from: [80, 60], to: [160, 60], name: "S1", note: "PWM" },
      { kind: "L", from: [180, 60], to: [180, 200], name: "L", param: "L1" },
      { kind: "D", from: [290, 60], to: [210, 60], name: "D1" },
      { kind: "C", from: [350, 60], to: [350, 200], name: "C", param: "C1" },
      { kind: "R", from: [440, 60], to: [440, 200], name: "Rload", param: "Rload" },
      { kind: "GND", at: [110, 200] },
      { kind: "TEXT", at: [500, 54], text: "Vout(負)", anchor: "start" },
    ],
    wires: [
      [[40, 60], [80, 60]],
      [[160, 60], [180, 60]],
      [[180, 60], [210, 60]],
      [[290, 60], [500, 60]],
      [[40, 200], [440, 200]],
    ],
    junctions: [[180, 60], [350, 60], [440, 60], [180, 200], [350, 200]],
  },
  explanation,
};
