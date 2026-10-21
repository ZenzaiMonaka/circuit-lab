import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const nonInvertingAmp: Template = {
  id: "non-inverting-amp",
  category: "opamp",
  title: "非反転増幅回路",
  summary: "符号を変えずに増幅する。Rf を小さくするとボルテージフォロワ(バッファ)になる",
  params: [
    { key: "Rg", label: "接地側の抵抗 Rg", unit: "Ω", default: 10e3, min: 100, max: 10e6, scale: "log" },
    { key: "Rf", label: "帰還抵抗 Rf", unit: "Ω", default: 90e3, min: 1, max: 10e6, scale: "log" },
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
Rf inv out ${v.Rf}
Rg inv 0 ${v.Rg}
XU1 in inv out vp vn OPAMP`,
  schematic: {
    width: 420,
    height: 260,
    parts: [
      { kind: "VAC", from: [40, 100], to: [40, 230], name: "Vin" },
      { kind: "OPAMP", at: [200, 120], name: "U1", flip: true },
      { kind: "R", from: [120, 140], to: [120, 230], name: "Rg", param: "Rg" },
      { kind: "R", from: [300, 190], to: [220, 190], name: "Rf", param: "Rf" },
      { kind: "GND", at: [80, 230] },
      { kind: "TEXT", at: [380, 114], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 100], [200, 100]],
      [[200, 140], [120, 140]],
      [[320, 120], [320, 190], [300, 190]],
      [[220, 190], [186, 190], [186, 140]],
      [[280, 120], [380, 120]],
      [[40, 230], [120, 230]],
    ],
    junctions: [[186, 140], [320, 120]],
  },
  explanation,
};
