import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const invertingAmp: Template = {
  id: "inverting-amp",
  category: "opamp",
  title: "反転増幅回路",
  summary: "オペアンプと 2 本の抵抗で、符号を反転して増幅する",
  params: [
    { key: "Rin", label: "入力抵抗 Rin", unit: "Ω", default: 10e3, min: 100, max: 1e6, scale: "log" },
    { key: "Rf", label: "帰還抵抗 Rf", unit: "Ω", default: 100e3, min: 100, max: 10e6, scale: "log" },
    { key: "vamp", label: "入力の振幅(過渡解析)", unit: "V", default: 0.1, min: 0.001, max: 5, scale: "log" },
    { key: "fin", label: "入力の周波数(過渡解析)", unit: "Hz", default: 1e3, min: 10, max: 10e6, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 40 10 100Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 200} ${4 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)" },
        { label: "出力 Vout", unit: "V", signal: "v(out)" },
      ],
    },
  ],
  models: ["OPAMP"],
  buildNetlist: (v) => `Vp vp 0 DC 15
Vn vn 0 DC -15
Vin in 0 DC 0 AC 1 SIN(0 ${v.vamp} ${v.fin})
Rin in inv ${v.Rin}
Rf inv out ${v.Rf}
XU1 0 inv out vp vn OPAMP`,
  schematic: {
    width: 420,
    height: 240,
    parts: [
      { kind: "VAC", from: [40, 100], to: [40, 200], name: "Vin" },
      { kind: "R", from: [80, 100], to: [160, 100], name: "Rin", param: "Rin" },
      { kind: "R", from: [200, 40], to: [300, 40], name: "Rf", param: "Rf" },
      { kind: "OPAMP", at: [200, 120], name: "U1", note: "電源 ±15V" },
      { kind: "GND", at: [120, 200] },
      { kind: "TEXT", at: [380, 114], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 100], [80, 100]],
      [[160, 100], [200, 100]],
      [[180, 100], [180, 40], [200, 40]],
      [[300, 40], [320, 40], [320, 120]],
      [[280, 120], [380, 120]],
      [[200, 140], [200, 200]],
      [[40, 200], [200, 200]],
    ],
    junctions: [[180, 100], [320, 120]],
  },
  explanation,
};
