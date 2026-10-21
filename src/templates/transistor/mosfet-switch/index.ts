import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const mosfetSwitch: Template = {
  id: "mosfet-switch",
  category: "transistor",
  title: "MOSFET ローサイドスイッチ",
  summary: "N チャネル MOSFET で、負荷をグラウンド側でオン・オフする",
  params: [
    { key: "Vdd", label: "電源電圧 Vdd", unit: "V", default: 12, min: 3, max: 30, scale: "linear" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 12, min: 1, max: 1e3, scale: "log" },
    { key: "Vgh", label: "ゲート駆動電圧(High のとき)", unit: "V", default: 5, min: 1, max: 12, scale: "linear" },
    { key: "Rg", label: "ゲート抵抗 Rg", unit: "Ω", default: 100, min: 1, max: 10e3, scale: "log" },
    { key: "fsw", label: "スイッチング周波数", unit: "Hz", default: 100e3, min: 1e3, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 3 周期ぶんを、1 周期あたり 500 点で計算する
      command: (v) => `.tran ${1 / v.fsw / 500} ${3 / v.fsw}`,
      probes: [
        { label: "駆動電圧", unit: "V", signal: "v(gs)", group: "ゲート" },
        { label: "ゲートの電圧 Vgs", unit: "V", signal: "v(g)", group: "ゲート" },
        { label: "ドレイン電圧 Vds", unit: "V", signal: "v(d)", group: "ドレイン電圧" },
        { label: "負荷に流れる電流", unit: "A", signal: (get) => get("i(vdd)").map((i) => -i) },
      ],
    },
  ],
  models: ["NMOS"],
  buildNetlist: (v) => {
    const period = 1 / v.fsw;
    const edge = 10e-9;
    return `Vdd vdd 0 DC ${v.Vdd}
Vg gs 0 PULSE(0 ${v.Vgh} 0 ${edge} ${edge} ${period / 2 - edge} ${period})
Rg gs g ${v.Rg}
Ciss g 0 2n
M1 d g 0 0 NMOSGEN
Rl vdd d ${v.Rload}`;
  },
  schematic: {
    width: 410,
    height: 280,
    parts: [
      { kind: "VPULSE", from: [30, 160], to: [30, 230], name: "Vg", param: "Vgh" },
      { kind: "R", from: [60, 160], to: [120, 160], name: "Rg", param: "Rg" },
      { kind: "C", from: [126, 160], to: [126, 230], name: "Ciss", note: "2 nF" },
      { kind: "NMOS", at: [140, 160], name: "M1" },
      { kind: "R", from: [180, 40], to: [180, 130], name: "Rl", param: "Rload" },
      { kind: "VDC", from: [320, 40], to: [320, 230], name: "Vdd", param: "Vdd" },
      { kind: "GND", at: [250, 230] },
    ],
    wires: [
      [[30, 160], [60, 160]],
      [[120, 160], [140, 160]],
      [[180, 40], [320, 40]],
      [[180, 190], [180, 230]],
      [[30, 230], [320, 230]],
    ],
    junctions: [[126, 160], [126, 230], [180, 230]],
  },
  explanation,
};
