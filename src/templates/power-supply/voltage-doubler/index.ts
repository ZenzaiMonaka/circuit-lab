import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const voltageDoubler: Template = {
  id: "voltage-doubler",
  category: "power-supply",
  title: "倍電圧整流回路",
  summary: "ダイオード 2 個とコンデンサ 2 個で、入力のピークの約 2 倍の直流を作る",
  params: [
    { key: "Vpk", label: "交流の振幅(ピーク電圧)", unit: "V", default: 10, min: 1, max: 50, scale: "log" },
    { key: "f", label: "交流の周波数", unit: "Hz", default: 50, min: 10, max: 1e3, scale: "log" },
    { key: "C1", label: "コンデンサ C1", unit: "F", default: 220e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "C2", label: "平滑コンデンサ C2", unit: "F", default: 220e-6, min: 1e-6, max: 10e-3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 5e3, min: 100, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 充電が落ち着くまでに数周期かかるので 12 周期ぶん計算する
      command: (v) => `.tran ${1 / v.f / 400} ${12 / v.f}`,
      probes: [
        { label: "交流入力 Vin", unit: "V", signal: "v(in)", group: "電圧" },
        { label: "C1 のあとの点 Va", unit: "V", signal: "v(a)", group: "電圧" },
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)", group: "電圧" },
      ],
    },
  ],
  models: ["DIODE"],
  buildNetlist: (v) => `Vin in 0 SIN(0 ${v.Vpk} ${v.f})
C1 in a ${v.C1}
D1 0 a DGEN
D2 a out DGEN
C2 out 0 ${v.C2}
Rload out 0 ${v.Rload}`,
  schematic: {
    width: 520,
    height: 230,
    parts: [
      { kind: "VAC", from: [40, 60], to: [40, 180], name: "Vin" },
      { kind: "C", from: [80, 60], to: [160, 60], name: "C1", param: "C1" },
      { kind: "D", from: [200, 180], to: [200, 60], name: "D1" },
      { kind: "D", from: [200, 60], to: [300, 60], name: "D2" },
      { kind: "C", from: [330, 60], to: [330, 180], name: "C2", param: "C2" },
      { kind: "R", from: [410, 60], to: [410, 180], name: "Rload", param: "Rload" },
      { kind: "GND", at: [120, 180] },
      { kind: "TEXT", at: [470, 54], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 60], [80, 60]],
      [[160, 60], [200, 60]],
      [[300, 60], [470, 60]],
      [[40, 180], [410, 180]],
    ],
    junctions: [[200, 60], [330, 60], [410, 60], [200, 180], [330, 180]],
  },
  explanation,
};
