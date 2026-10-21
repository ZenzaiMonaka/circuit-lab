import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const seriesRegulator: Template = {
  id: "series-regulator",
  category: "power-supply",
  title: "シリーズレギュレータ(ツェナー＋トランジスタ)",
  summary: "ツェナーの基準電圧を、トランジスタで電流増幅して出力する",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 12, min: 8, max: 30, scale: "linear" },
    { key: "R1", label: "ツェナーの電流抵抗 R1", unit: "Ω", default: 470, min: 100, max: 10e3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 100, min: 10, max: 10e3, scale: "log" },
    { key: "Vr", label: "入力のリップル振幅(過渡解析)", unit: "V", default: 1, min: 0.1, max: 5, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "基準電圧(ツェナーの電圧)Vb", unit: "V", signal: "v(b)" },
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)" },
        { label: "負荷に流れる電流", unit: "A", signal: (get, v) => get("v(out)").map((vo) => vo / v.Rload) },
        { label: "R1 に流れる電流", unit: "A", signal: (get, v) => get("v(b)").map((vb) => (v.Vin - vb) / v.R1) },
        {
          label: "トランジスタの消費電力",
          unit: "W",
          signal: (get, v) => get("v(out)").map((vo) => ((v.Vin - vo) * vo) / v.Rload),
        },
      ],
    },
    {
      kind: "tran",
      autoRun: true,
      command: () => ".tran 50u 30m",
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "入力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "出力" },
      ],
    },
  ],
  models: ["ZENER", "NPN"],
  buildNetlist: (v) => `Vin in 0 DC ${v.Vin} SIN(${v.Vin} ${v.Vr} 100)
R1 in b ${v.R1}
DZ 0 b DZ5V1
Q1 in b out QGEN
Rload out 0 ${v.Rload}`,
  schematic: {
    width: 440,
    height: 250,
    parts: [
      { kind: "VDC", from: [40, 40], to: [40, 210], name: "Vin", param: "Vin" },
      { kind: "R", from: [140, 40], to: [140, 120], name: "R1", param: "R1" },
      { kind: "ZD", from: [140, 210], to: [140, 120], name: "DZ", note: "5.1 V" },
      { kind: "NPN", at: [180, 120], name: "Q1" },
      { kind: "R", from: [300, 150], to: [300, 210], name: "Rload", param: "Rload" },
      { kind: "GND", at: [90, 210] },
      { kind: "TEXT", at: [370, 144], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 40], [220, 40], [220, 90]],
      [[140, 120], [180, 120]],
      [[220, 150], [370, 150]],
      [[40, 210], [300, 210]],
    ],
    junctions: [[140, 40], [140, 120], [300, 150], [140, 210]],
  },
  explanation,
};
