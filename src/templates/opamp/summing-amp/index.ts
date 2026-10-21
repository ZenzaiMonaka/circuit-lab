import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const summingAmp: Template = {
  id: "summing-amp",
  category: "opamp",
  title: "加算回路",
  summary: "複数の入力電圧を、重みをつけて足し合わせる(反転)",
  params: [
    { key: "v1", label: "入力 V1(直流)", unit: "V", default: 1, min: -5, max: 5, scale: "linear" },
    { key: "v2", label: "入力 V2(直流分)", unit: "V", default: 0.5, min: -5, max: 5, scale: "linear" },
    { key: "R1", label: "抵抗 R1", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "R2", label: "抵抗 R2", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "Rf", label: "帰還抵抗 Rf", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
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
          label: "式から求めた値 −Rf(V1/R1 + V2/R2)",
          unit: "V",
          signal: (get, v) => get("v(out)").map(() => -v.Rf * (v.v1 / v.R1 + v.v2 / v.R2)),
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
R1 in1 inv ${v.R1}
R2 in2 inv ${v.R2}
Rf inv out ${v.Rf}
XU1 0 inv out vp vn OPAMP`,
  schematic: {
    width: 420,
    height: 250,
    parts: [
      { kind: "VDC", from: [40, 70], to: [40, 130], name: "V1", param: "v1" },
      { kind: "VAC", from: [40, 160], to: [40, 220], name: "V2" },
      { kind: "R", from: [80, 70], to: [160, 70], name: "R1", param: "R1" },
      { kind: "R", from: [80, 160], to: [160, 160], name: "R2", param: "R2" },
      { kind: "R", from: [220, 30], to: [300, 30], name: "Rf", param: "Rf" },
      { kind: "OPAMP", at: [240, 115], name: "U1", note: "電源 ±15V" },
      { kind: "GND", at: [40, 130] },
      { kind: "GND", at: [40, 220] },
      { kind: "GND", at: [240, 190] },
      { kind: "TEXT", at: [380, 109], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 70], [80, 70]],
      [[160, 70], [190, 70]],
      [[40, 160], [80, 160]],
      [[160, 160], [190, 160]],
      [[190, 30], [190, 160]],
      [[190, 30], [220, 30]],
      [[190, 95], [240, 95]],
      [[300, 30], [340, 30], [340, 115]],
      [[320, 115], [380, 115]],
      [[240, 135], [240, 190]],
    ],
    junctions: [[190, 70], [190, 95], [190, 160], [340, 115]],
  },
  explanation,
};
