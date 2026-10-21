import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const integrator: Template = {
  id: "integrator",
  category: "opamp",
  title: "積分回路(オペアンプ)",
  summary: "入力電圧を時間で積分する。矩形波を入れると三角波になる",
  params: [
    { key: "Rin", label: "入力抵抗 Rin", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "C1", label: "帰還コンデンサ C1", unit: "F", default: 10e-9, min: 100e-12, max: 10e-6, scale: "log" },
    { key: "Rp", label: "並列抵抗 Rp(直流の安定用)", unit: "Ω", default: 1e6, min: 100e3, max: 100e6, scale: "log" },
    { key: "vamp", label: "入力の振幅(過渡解析)", unit: "V", default: 1, min: 0.01, max: 5, scale: "log" },
    { key: "fin", label: "入力の周波数(過渡解析)", unit: "Hz", default: 1e3, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "ac",
      autoRun: true,
      command: () => ".ac dec 40 0.1 10Meg",
      probes: [{ label: "Vout / Vin", unit: "", signal: "v(out)" }],
    },
    {
      kind: "tran",
      autoRun: true,
      // 出力が 0 V から始まるよう、直流動作点を求めずに(uic)計算する。
      // 直流動作点を求めると、Rp による直流の大きな利得で、出力が電源電圧に張り付いた状態から始まってしまう
      command: (v) => {
        const step = 1 / v.fin / 500;
        return `.tran ${step} ${4 / v.fin} 0 ${step} uic`;
      },
      probes: [
        { label: "入力 Vin(矩形波)", unit: "V", signal: "v(in)" },
        { label: "出力 Vout", unit: "V", signal: "v(out)" },
      ],
    },
  ],
  models: ["OPAMP"],
  buildNetlist: (v) => `Vp vp 0 DC 15
Vn vn 0 DC -15
Vin in 0 DC 0 AC 1 PULSE(${v.vamp} ${-v.vamp} 0 1n 1n ${0.5 / v.fin} ${1 / v.fin})
R1 in inv ${v.Rin}
C1 inv out ${v.C1}
Rp inv out ${v.Rp}
XU1 0 inv out vp vn OPAMP`,
  schematic: {
    width: 420,
    height: 240,
    parts: [
      { kind: "VPULSE", from: [40, 100], to: [40, 200], name: "Vin", note: "矩形波" },
      { kind: "R", from: [80, 100], to: [160, 100], name: "Rin", param: "Rin" },
      { kind: "C", from: [200, 76], to: [300, 76], name: "C1", param: "C1" },
      { kind: "R", from: [200, 30], to: [300, 30], name: "Rp", param: "Rp" },
      { kind: "OPAMP", at: [200, 120], name: "U1", note: "電源 ±15V" },
      { kind: "GND", at: [120, 200] },
      { kind: "TEXT", at: [380, 114], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 100], [80, 100]],
      [[160, 100], [200, 100]],
      [[180, 100], [180, 30], [200, 30]],
      [[180, 76], [200, 76]],
      [[300, 30], [330, 30], [330, 120]],
      [[300, 76], [330, 76]],
      [[280, 120], [380, 120]],
      [[200, 140], [200, 200]],
      [[40, 200], [200, 200]],
    ],
    junctions: [[180, 100], [180, 76], [330, 76], [330, 120]],
  },
  explanation,
};
