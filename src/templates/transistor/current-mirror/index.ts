import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const currentMirror: Template = {
  id: "current-mirror",
  category: "transistor",
  title: "カレントミラー",
  summary: "基準の電流をコピーして、同じ大きさの電流を別の場所に流す",
  params: [
    { key: "Vcc", label: "電源電圧 Vcc", unit: "V", default: 12, min: 3, max: 30, scale: "linear" },
    { key: "Rref", label: "基準電流の抵抗 Rref", unit: "Ω", default: 10e3, min: 1e3, max: 100e3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 4.7e3, min: 100, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "基準電流 Iref", unit: "A", signal: (get, v) => get("v(b)").map((vb) => (v.Vcc - vb) / v.Rref) },
        { label: "出力電流 Iout", unit: "A", signal: (get, v) => get("v(c)").map((vc) => (v.Vcc - vc) / v.Rload) },
        {
          label: "ミラー比 Iout / Iref",
          unit: "",
          signal: (get, v) => get("v(c)").map((vc, i) => ((v.Vcc - vc) / v.Rload) / ((v.Vcc - get("v(b)")[i]) / v.Rref)),
        },
        { label: "Q1 のベース電圧(= Vbe)", unit: "V", signal: "v(b)" },
        { label: "Q2 のコレクタ電圧 Vce", unit: "V", signal: "v(c)" },
      ],
    },
  ],
  models: ["NPN"],
  buildNetlist: (v) => `Vcc vcc 0 DC ${v.Vcc}
Rref vcc b ${v.Rref}
Q1 b b 0 QGEN
Q2 c b 0 QGEN
Rl vcc c ${v.Rload}`,
  schematic: {
    width: 340,
    height: 260,
    parts: [
      { kind: "VDC", from: [40, 30], to: [40, 220], name: "Vcc", param: "Vcc" },
      { kind: "R", from: [120, 30], to: [120, 120], name: "Rref", param: "Rref" },
      { kind: "R", from: [240, 30], to: [240, 120], name: "Rl", param: "Rload" },
      { kind: "NPN", at: [160, 150], name: "Q1", mirror: true },
      { kind: "NPN", at: [200, 150], name: "Q2" },
      { kind: "GND", at: [80, 220] },
    ],
    wires: [
      [[40, 30], [240, 30]],
      [[160, 150], [200, 150]],
      [[180, 150], [180, 100], [120, 100]],
      [[120, 180], [120, 220]],
      [[240, 180], [240, 220]],
      [[40, 220], [240, 220]],
    ],
    junctions: [[120, 30], [180, 150], [120, 100], [120, 220], [240, 220]],
  },
  explanation,
};
