import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const schmittTrigger: Template = {
  id: "schmitt-trigger",
  category: "opamp",
  title: "シュミットトリガ(ヒステリシス付きコンパレータ)",
  summary: "出力を非反転入力に戻して(正帰還)、切り替わる電圧を上下で変える",
  params: [
    { key: "R1", label: "正帰還の抵抗 R1", unit: "Ω", default: 10e3, min: 1e3, max: 1e6, scale: "log" },
    { key: "R2", label: "接地側の抵抗 R2", unit: "Ω", default: 1e3, min: 100, max: 1e6, scale: "log" },
    { key: "vamp", label: "入力の振幅", unit: "V", default: 3, min: 0.1, max: 10, scale: "log" },
    { key: "fin", label: "入力の周波数", unit: "Hz", default: 1e3, min: 10, max: 100e3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 500} ${4 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "入力と出力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "入力と出力" },
        { label: "しきい値 Vth(非反転入力の電圧)", unit: "V", signal: "v(p)", group: "入力としきい値" },
        { label: "入力 Vin ", unit: "V", signal: "v(in)", group: "入力としきい値" },
      ],
    },
  ],
  models: ["OPAMP"],
  buildNetlist: (v) => `Vp vp 0 DC 15
Vn vn 0 DC -15
Vin in 0 SIN(0 ${v.vamp} ${v.fin})
R1 out p ${v.R1}
R2 p 0 ${v.R2}
XU1 p in out vp vn OPAMP`,
  schematic: {
    width: 520,
    height: 250,
    parts: [
      { kind: "VAC", from: [40, 100], to: [40, 180], name: "Vin" },
      { kind: "OPAMP", at: [300, 120], name: "U1", note: "電源 ±15V" },
      { kind: "R", from: [170, 140], to: [170, 210], name: "R2", param: "R2" },
      { kind: "R", from: [250, 140], to: [250, 210], name: "R1", param: "R1" },
      { kind: "GND", at: [40, 180] },
      { kind: "GND", at: [170, 210] },
      { kind: "TEXT", at: [480, 114], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[40, 100], [300, 100]],
      [[170, 140], [300, 140]],
      [[250, 210], [420, 210], [420, 120]],
      [[380, 120], [480, 120]],
    ],
    junctions: [[170, 140], [250, 140], [420, 120]],
  },
  explanation,
};
