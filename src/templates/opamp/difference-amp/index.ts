import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const differenceAmp: Template = {
  id: "difference-amp",
  category: "opamp",
  title: "差動増幅回路(減算回路)",
  summary: "2 つの入力電圧の差を取り出して増幅する",
  params: [
    { key: "v1", label: "入力 V1(反転側)", unit: "V", default: 1, min: -5, max: 5, scale: "linear" },
    { key: "v2", label: "入力 V2(非反転側)の直流分", unit: "V", default: 2, min: -5, max: 5, scale: "linear" },
    { key: "Rin", label: "入力抵抗 R1 = R3", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "Rf", label: "帰還抵抗 R2 = R4", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "vamp", label: "V2 にのせる交流の振幅(過渡解析)", unit: "V", default: 0.5, min: 0, max: 5, scale: "linear" },
    { key: "fin", label: "交流の周波数(過渡解析)", unit: "Hz", default: 1e3, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)" },
        {
          label: "式から求めた値 (Rf/Rin)(V2 − V1)",
          unit: "V",
          signal: (get, v) => get("v(out)").map(() => (v.Rf / v.Rin) * (v.v2 - v.v1)),
        },
      ],
    },
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 200} ${4 / v.fin}`,
      probes: [
        { label: "入力 V1", unit: "V", signal: "v(in1)", group: "入力" },
        { label: "入力 V2", unit: "V", signal: "v(in2)", group: "入力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "出力" },
      ],
    },
  ],
  models: ["OPAMP"],
  buildNetlist: (v) => `Vp vp 0 DC 15
Vn vn 0 DC -15
V1 in1 0 DC ${v.v1}
V2 in2 0 DC ${v.v2} SIN(${v.v2} ${v.vamp} ${v.fin})
R1 in1 inv ${v.Rin}
R2 inv out ${v.Rf}
R3 in2 nin ${v.Rin}
R4 nin 0 ${v.Rf}
XU1 nin inv out vp vn OPAMP`,
  schematic: {
    width: 440,
    height: 280,
    parts: [
      { kind: "VDC", from: [40, 90], to: [40, 150], name: "V1", param: "v1" },
      { kind: "VAC", from: [40, 190], to: [40, 250], name: "V2" },
      { kind: "R", from: [80, 90], to: [170, 90], name: "R1", param: "Rin" },
      { kind: "R", from: [80, 190], to: [170, 190], name: "R3", param: "Rin" },
      { kind: "R", from: [230, 40], to: [310, 40], name: "R2", param: "Rf" },
      { kind: "R", from: [210, 190], to: [210, 250], name: "R4", param: "Rf" },
      { kind: "OPAMP", at: [260, 110], name: "U1", note: "電源 ±15V" },
      { kind: "GND", at: [40, 150] },
      { kind: "GND", at: [40, 250] },
      { kind: "GND", at: [210, 250] },
      { kind: "TEXT", at: [400, 104], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 90], [80, 90]],
      [[170, 90], [260, 90]],
      [[210, 90], [210, 40], [230, 40]],
      [[310, 40], [350, 40], [350, 110]],
      [[340, 110], [400, 110]],
      [[40, 190], [80, 190]],
      [[170, 190], [210, 190]],
      [[210, 190], [210, 130], [260, 130]],
    ],
    junctions: [[210, 90], [210, 190], [350, 110]],
  },
  explanation,
};
