import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const differentialPair: Template = {
  id: "differential-pair",
  category: "transistor",
  title: "差動増幅回路(差動対)",
  summary: "2 つの入力の「差」だけを増幅する、オペアンプの入力段の基本回路",
  params: [
    { key: "Vcc", label: "電源電圧 ±Vcc", unit: "V", default: 12, min: 5, max: 20, scale: "linear" },
    { key: "RC", label: "コレクタ抵抗 RC", unit: "Ω", default: 4.7e3, min: 1e3, max: 20e3, scale: "log" },
    { key: "Ree", label: "テール抵抗 Ree", unit: "Ω", default: 10e3, min: 1e3, max: 100e3, scale: "log" },
    { key: "vamp", label: "差動入力の振幅(過渡解析)", unit: "V", default: 0.01, min: 0.001, max: 0.2, scale: "log" },
    { key: "fin", label: "入力の周波数(過渡解析)", unit: "Hz", default: 1e3, min: 10, max: 1e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "コレクタ電圧 Vc1", unit: "V", signal: "v(c1)" },
        { label: "コレクタ電圧 Vc2", unit: "V", signal: "v(c2)" },
        { label: "テール点の電圧 Ve", unit: "V", signal: "v(e)" },
        { label: "テール電流(2 つの合計)", unit: "A", signal: (get, v) => get("v(e)").map((ve) => (ve + v.Vcc) / v.Ree) },
        { label: "片方のトランジスタの電流 Ic", unit: "A", signal: (get, v) => get("v(e)").map((ve) => (ve + v.Vcc) / v.Ree / 2) },
      ],
    },
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 40 1 100Meg",
      probes: [
        { label: "差動出力(Vc2 − Vc1)/ 差動入力 1V", unit: "", signal: "v(vod)" },
        { label: "片側の出力 Vc2 / 差動入力 1V", unit: "", signal: "v(c2)" },
      ],
    },
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 200} ${5 / v.fin}`,
      probes: [
        { label: "差動入力 (V1 − V2)", unit: "V", signal: (get) => get("v(in1)").map((a, i) => a - get("v(in2)")[i]), group: "入力" },
        { label: "出力 Vc1", unit: "V", signal: "v(c1)", group: "出力" },
        { label: "出力 Vc2", unit: "V", signal: "v(c2)", group: "出力" },
      ],
    },
  ],
  models: ["NPN"],
  // 入力は、V1 を +、V2 を − に半分ずつ振り、差動入力が 1V(交流解析)・vamp(過渡解析)になるようにする
  buildNetlist: (v) => `Vcc vcc 0 DC ${v.Vcc}
Vee vee 0 DC ${-v.Vcc}
V1 in1 0 DC 0 AC 0.5 SIN(0 ${v.vamp / 2} ${v.fin})
V2 in2 0 DC 0 AC 0.5 180 SIN(0 ${-v.vamp / 2} ${v.fin})
Q1 c1 in1 e QGEN
Q2 c2 in2 e QGEN
RC1 vcc c1 ${v.RC}
RC2 vcc c2 ${v.RC}
Ree e vee ${v.Ree}
Bod vod 0 V=V(c2)-V(c1)`,
  schematic: {
    width: 500,
    height: 280,
    parts: [
      { kind: "VAC", from: [30, 130], to: [30, 200], name: "V1" },
      { kind: "NPN", at: [80, 130], name: "Q1" },
      { kind: "NPN", at: [280, 130], name: "Q2", mirror: true },
      { kind: "VAC", from: [340, 130], to: [340, 200], name: "V2" },
      { kind: "R", from: [120, 30], to: [120, 100], name: "RC1", param: "RC" },
      { kind: "R", from: [240, 30], to: [240, 100], name: "RC2", param: "RC" },
      { kind: "R", from: [180, 160], to: [180, 250], name: "Ree", param: "Ree" },
      { kind: "VDC", from: [420, 30], to: [420, 140], name: "+Vcc", param: "Vcc" },
      { kind: "VDC", from: [420, 140], to: [420, 250], name: "−Vcc", param: "Vcc" },
      { kind: "GND", at: [30, 200] },
      { kind: "GND", at: [340, 200] },
      { kind: "GND", at: [460, 140] },
      { kind: "TEXT", at: [104, 96], text: "c1", anchor: "end" },
      { kind: "TEXT", at: [256, 96], text: "c2", anchor: "start" },
    ],
    wires: [
      [[30, 130], [80, 130]],
      [[340, 130], [280, 130]],
      [[120, 160], [240, 160]],
      [[120, 30], [420, 30]],
      [[180, 250], [420, 250]],
      [[420, 140], [460, 140]],
    ],
    junctions: [[240, 30], [180, 160], [120, 100], [240, 100]],
  },
  explanation,
};
