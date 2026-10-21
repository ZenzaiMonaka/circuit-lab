import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const boostConverter: Template = {
  id: "boost-converter",
  category: "power-electronics",
  title: "昇圧型 DC-DC コンバータ(ブースト)",
  summary: "スイッチを高速にオン・オフして、入力電圧より高い電圧を作る",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 5, min: 2, max: 50, scale: "log" },
    { key: "duty", label: "デューティ比 D", unit: "%", default: 50, min: 5, max: 85, scale: "linear" },
    { key: "fsw", label: "スイッチング周波数 fsw", unit: "Hz", default: 100e3, min: 10e3, max: 500e3, scale: "log" },
    { key: "L1", label: "インダクタ L", unit: "H", default: 100e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "C1", label: "出力コンデンサ C", unit: "F", default: 100e-6, min: 1e-6, max: 1e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 20, min: 2, max: 1e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      // 計算が重いので、ボタンを押したときだけ実行する
      autoRun: false,
      // 5ms ぶん(初期値で 500 周期)。最大刻みを 1 周期の 1/50 にして、スイッチの切り替わりを逃さない
      command: (v) => `.tran ${1 / v.fsw / 100} 5m 0 ${1 / v.fsw / 50}`,
      probes: [
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)", group: "出力電圧" },
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
L1 in sw ${v.L1}
S1 sw 0 g 0 SWGEN
D1 sw out DGEN
C1 out 0 ${v.C1}
Rload out 0 ${v.Rload}`;
  },
  schematic: {
    width: 540,
    height: 240,
    parts: [
      { kind: "VDC", from: [40, 60], to: [40, 200], name: "Vin", param: "Vin" },
      { kind: "L", from: [80, 60], to: [180, 60], name: "L", param: "L1" },
      { kind: "SW", from: [200, 60], to: [200, 200], name: "S1", note: "PWM" },
      { kind: "D", from: [200, 60], to: [300, 60], name: "D1" },
      { kind: "C", from: [350, 60], to: [350, 200], name: "C", param: "C1" },
      { kind: "R", from: [440, 60], to: [440, 200], name: "Rload", param: "Rload" },
      { kind: "GND", at: [120, 200] },
      { kind: "TEXT", at: [500, 54], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 60], [80, 60]],
      [[180, 60], [200, 60]],
      [[300, 60], [500, 60]],
      [[40, 200], [440, 200]],
    ],
    junctions: [[200, 60], [350, 60], [440, 60], [200, 200], [350, 200]],
  },
  explanation,
};
