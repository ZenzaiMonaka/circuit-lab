import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const emitterFollower: Template = {
  id: "emitter-follower",
  category: "transistor",
  title: "エミッタフォロワ",
  summary: "電圧は増幅せず、電流を増幅するバッファ(コレクタ接地)",
  params: [
    { key: "Vcc", label: "電源電圧 Vcc", unit: "V", default: 12, min: 5, max: 30, scale: "linear" },
    { key: "R1", label: "バイアス抵抗 R1", unit: "Ω", default: 22e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "R2", label: "バイアス抵抗 R2", unit: "Ω", default: 22e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "RE", label: "エミッタ抵抗 RE", unit: "Ω", default: 1e3, min: 10, max: 10e3, scale: "log" },
    { key: "RL", label: "負荷抵抗 RL", unit: "Ω", default: 1e3, min: 10, max: 1e6, scale: "log" },
    { key: "vamp", label: "入力の振幅(過渡解析)", unit: "V", default: 1, min: 0.01, max: 5, scale: "log" },
    { key: "fin", label: "入力の周波数(過渡解析)", unit: "Hz", default: 1e3, min: 10, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "ベース電圧 Vb", unit: "V", signal: "v(b)" },
        { label: "エミッタ電圧 Ve", unit: "V", signal: "v(e)" },
        { label: "Vbe(ベース-エミッタ間)", unit: "V", signal: (get) => get("v(b)").map((vb, i) => vb - get("v(e)")[i]) },
        { label: "エミッタ電流 Ie", unit: "A", signal: (get, v) => get("v(e)").map((ve) => ve / v.RE) },
      ],
    },
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 40 1 100Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 200} ${5 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)" },
        { label: "出力 Vout", unit: "V", signal: "v(out)" },
      ],
    },
  ],
  models: ["NPN"],
  buildNetlist: (v) => `Vcc vcc 0 DC ${v.Vcc}
Vin in 0 DC 0 AC 1 SIN(0 ${v.vamp} ${v.fin})
Cin in b 10u
R1 vcc b ${v.R1}
R2 b 0 ${v.R2}
Q1 vcc b e QGEN
RE e 0 ${v.RE}
Cout e out 10u
RL out 0 ${v.RL}`,
  schematic: {
    width: 580,
    height: 310,
    parts: [
      { kind: "VAC", from: [40, 130], to: [40, 270], name: "Vin" },
      { kind: "C", from: [70, 130], to: [130, 130], name: "Cin", note: "10 µF" },
      { kind: "R", from: [170, 30], to: [170, 130], name: "R1", param: "R1" },
      { kind: "R", from: [170, 130], to: [170, 270], name: "R2", param: "R2" },
      { kind: "NPN", at: [210, 130], name: "Q1" },
      { kind: "R", from: [250, 160], to: [250, 270], name: "RE", param: "RE" },
      { kind: "C", from: [290, 180], to: [350, 180], name: "Cout", note: "10 µF" },
      { kind: "R", from: [380, 180], to: [380, 270], name: "RL", param: "RL" },
      { kind: "VDC", from: [520, 30], to: [520, 270], name: "Vcc", param: "Vcc" },
      { kind: "GND", at: [100, 270] },
      { kind: "TEXT", at: [440, 174], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 130], [70, 130]],
      [[130, 130], [210, 130]],
      [[170, 30], [520, 30]],
      [[250, 100], [250, 30]],
      [[250, 180], [290, 180]],
      [[350, 180], [440, 180]],
      [[40, 270], [520, 270]],
    ],
    junctions: [[170, 130], [170, 30], [250, 30], [250, 180], [380, 180], [170, 270], [250, 270], [380, 270]],
  },
  explanation,
};
