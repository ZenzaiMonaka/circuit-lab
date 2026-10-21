import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const buckConverter: Template = {
  id: "buck-converter",
  category: "power-electronics",
  title: "降圧型 DC-DC コンバータ(バック)",
  summary: "スイッチを高速にオン・オフして、入力電圧を下げる",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 12, min: 3, max: 100, scale: "log" },
    { key: "duty", label: "デューティ比 D", unit: "%", default: 50, min: 5, max: 95, scale: "linear" },
    { key: "fsw", label: "スイッチング周波数 fsw", unit: "Hz", default: 100e3, min: 10e3, max: 500e3, scale: "log" },
    { key: "L1", label: "インダクタ L", unit: "H", default: 100e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "C1", label: "出力コンデンサ C", unit: "F", default: 47e-6, min: 1e-6, max: 1e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 10, min: 1, max: 1e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      // 計算が重いので、ボタンを押したときだけ実行する
      autoRun: false,
      // 最大刻みを 1 周期の 1/50 にして、スイッチの切り替わりを逃さない。
      // 計算は 3ms ぶん(初期値で 300 周期)。出力が落ち着くまでの目安
      command: (v) => `.tran ${1 / v.fsw / 100} 3m 0 ${1 / v.fsw / 50}`,
      probes: [
        // スイッチ点の電圧は 0〜Vin で振れ続けるため、同じグラフに重ねると出力電圧が隠れる。別のグラフにする
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
S1 in sw g 0 SWGEN
D1 0 sw DGEN
L1 sw out ${v.L1}
C1 out 0 ${v.C1}
Rload out 0 ${v.Rload}`;
  },
  schematic: {
    width: 520,
    height: 240,
    parts: [
      { kind: "VDC", from: [40, 60], to: [40, 200], name: "Vin", param: "Vin" },
      { kind: "SW", from: [90, 60], to: [160, 60], name: "S1", note: "PWM" },
      { kind: "D", from: [190, 200], to: [190, 60], name: "D1" },
      { kind: "L", from: [190, 60], to: [290, 60], name: "L", param: "L1" },
      { kind: "C", from: [330, 60], to: [330, 200], name: "C", param: "C1" },
      { kind: "R", from: [420, 60], to: [420, 200], name: "Rload", param: "Rload" },
      { kind: "GND", at: [250, 200] },
      { kind: "TEXT", at: [480, 54], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 60], [90, 60]],
      [[160, 60], [190, 60]],
      [[290, 60], [480, 60]],
      [[40, 200], [420, 200]],
    ],
    junctions: [[190, 60], [330, 60], [420, 60], [190, 200], [330, 200]],
  },
  explanation,
};
