import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const commonEmitter: Template = {
  id: "common-emitter",
  category: "transistor",
  title: "エミッタ接地増幅回路",
  summary: "NPN トランジスタ 1 個の電圧増幅回路(電圧分割バイアス)",
  params: [
    { key: "Vcc", label: "電源電圧 Vcc", unit: "V", default: 12, min: 5, max: 30, scale: "linear" },
    { key: "R1", label: "バイアス抵抗 R1", unit: "Ω", default: 47e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "R2", label: "バイアス抵抗 R2", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "RC", label: "コレクタ抵抗 RC", unit: "Ω", default: 2.2e3, min: 100, max: 100e3, scale: "log" },
    { key: "RE", label: "エミッタ抵抗 RE", unit: "Ω", default: 470, min: 10, max: 10e3, scale: "log" },
    { key: "RL", label: "負荷抵抗 RL", unit: "Ω", default: 10e3, min: 100, max: 1e6, scale: "log" },
    { key: "vamp", label: "入力の振幅(過渡解析)", unit: "V", default: 0.01, min: 0.001, max: 0.2, scale: "log" },
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
        { label: "コレクタ電圧 Vc", unit: "V", signal: "v(c)" },
        { label: "コレクタ電流 Ic", unit: "A", signal: (get, v) => get("v(c)").map((vc) => (v.Vcc - vc) / v.RC) },
        { label: "Vce(コレクタ-エミッタ間)", unit: "V", signal: (get) => get("v(c)").map((vc, i) => vc - get("v(e)")[i]) },
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
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "入力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "出力" },
      ],
    },
  ],
  models: ["NPN"],
  buildNetlist: (v) => `Vcc vcc 0 DC ${v.Vcc}
Vin in 0 DC 0 AC 1 SIN(0 ${v.vamp} ${v.fin})
Cin in b 10u
R1 vcc b ${v.R1}
R2 b 0 ${v.R2}
Q1 c b e QGEN
RC vcc c ${v.RC}
RE e 0 ${v.RE}
CE e 0 100u
Cout c out 10u
RL out 0 ${v.RL}`,
  schematic: {
    width: 580,
    height: 340,
    parts: [
      { kind: "VAC", from: [40, 150], to: [40, 310], name: "Vin" },
      { kind: "C", from: [70, 150], to: [130, 150], name: "Cin", note: "10 µF" },
      { kind: "R", from: [170, 30], to: [170, 150], name: "R1", param: "R1" },
      { kind: "R", from: [170, 150], to: [170, 310], name: "R2", param: "R2" },
      { kind: "NPN", at: [210, 150], name: "Q1" },
      { kind: "R", from: [250, 30], to: [250, 120], name: "RC", param: "RC" },
      { kind: "R", from: [250, 180], to: [250, 310], name: "RE", param: "RE" },
      { kind: "C", from: [310, 200], to: [310, 310], name: "CE", note: "100 µF" },
      { kind: "C", from: [330, 120], to: [390, 120], name: "Cout", note: "10 µF" },
      { kind: "R", from: [390, 120], to: [390, 310], name: "RL", param: "RL" },
      { kind: "VDC", from: [520, 30], to: [520, 310], name: "Vcc", param: "Vcc" },
      { kind: "GND", at: [100, 310] },
      { kind: "TEXT", at: [440, 114], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 150], [70, 150]],
      [[130, 150], [210, 150]],
      [[170, 30], [520, 30]],
      [[250, 120], [330, 120]],
      [[390, 120], [440, 120]],
      [[250, 200], [310, 200]],
      [[40, 310], [520, 310]],
    ],
    junctions: [[170, 150], [170, 30], [250, 30], [250, 120], [250, 200], [310, 310], [250, 310], [170, 310], [390, 310], [390, 120]],
  },
  explanation,
};
