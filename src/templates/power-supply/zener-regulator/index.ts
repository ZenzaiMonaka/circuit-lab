import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const zenerRegulator: Template = {
  id: "zener-regulator",
  category: "power-supply",
  title: "ツェナーダイオード定電圧回路",
  summary: "ツェナーダイオードの降伏電圧を使って、一定の電圧を作る",
  params: [
    { key: "Vin", label: "入力電圧 Vin", unit: "V", default: 12, min: 6, max: 30, scale: "linear" },
    { key: "Rs", label: "直列抵抗 Rs", unit: "Ω", default: 330, min: 10, max: 10e3, scale: "log" },
    { key: "Rload", label: "負荷抵抗 Rload", unit: "Ω", default: 1e3, min: 50, max: 100e3, scale: "log" },
    { key: "Vr", label: "入力のリップル振幅(過渡解析)", unit: "V", default: 1, min: 0.1, max: 5, scale: "log" },
  ],
  analyses: [
    {
      kind: "op",
      autoRun: true,
      command: () => ".op",
      probes: [
        { label: "出力電圧 Vout", unit: "V", signal: "v(out)" },
        { label: "Rs に流れる電流", unit: "A", signal: (get, v) => get("v(out)").map((vo) => (v.Vin - vo) / v.Rs) },
        { label: "負荷に流れる電流", unit: "A", signal: (get, v) => get("v(out)").map((vo) => vo / v.Rload) },
        {
          label: "ツェナーに流れる電流 Iz",
          unit: "A",
          signal: (get, v) => get("v(out)").map((vo) => (v.Vin - vo) / v.Rs - vo / v.Rload),
        },
        {
          label: "ツェナーの消費電力",
          unit: "W",
          signal: (get, v) => get("v(out)").map((vo) => vo * ((v.Vin - vo) / v.Rs - vo / v.Rload)),
        },
      ],
    },
    {
      kind: "tran",
      autoRun: true,
      // 入力に 100Hz のリップルをのせて、3 周期ぶん見る
      command: () => ".tran 50u 30m",
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "入力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "出力" },
      ],
    },
  ],
  models: ["ZENER"],
  buildNetlist: (v) => `Vin in 0 DC ${v.Vin} SIN(${v.Vin} ${v.Vr} 100)
Rs in out ${v.Rs}
DZ 0 out DZ5V1
Rload out 0 ${v.Rload}`,
  schematic: {
    width: 420,
    height: 220,
    parts: [
      { kind: "VDC", from: [40, 40], to: [40, 180], name: "Vin", param: "Vin" },
      { kind: "R", from: [80, 40], to: [180, 40], name: "Rs", param: "Rs" },
      { kind: "ZD", from: [220, 180], to: [220, 40], name: "DZ", note: "5.1 V" },
      { kind: "R", from: [320, 40], to: [320, 180], name: "Rload", param: "Rload" },
      { kind: "GND", at: [130, 180] },
      { kind: "TEXT", at: [380, 34], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 40], [80, 40]],
      [[180, 40], [380, 40]],
      [[40, 180], [320, 180]],
    ],
    junctions: [[220, 40], [320, 40], [220, 180]],
  },
  explanation,
};
