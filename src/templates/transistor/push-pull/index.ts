import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const pushPull: Template = {
  id: "push-pull",
  category: "transistor",
  title: "プッシュプル出力段(B 級／AB 級)",
  summary: "NPN と PNP で、信号の正負を分担して負荷を駆動する",
  params: [
    { key: "Vcc", label: "電源電圧 ±Vcc", unit: "V", default: 12, min: 5, max: 20, scale: "linear" },
    { key: "vamp", label: "入力の振幅", unit: "V", default: 3, min: 0.1, max: 10, scale: "log" },
    { key: "fin", label: "入力の周波数", unit: "Hz", default: 1e3, min: 10, max: 100e3, scale: "log" },
    { key: "RL", label: "負荷抵抗 RL", unit: "Ω", default: 100, min: 8, max: 1e3, scale: "log" },
    { key: "Rb", label: "バイアス抵抗 Rb", unit: "Ω", default: 4.7e3, min: 1e3, max: 47e3, scale: "log" },
    { key: "bias", label: "バイアスダイオード(AB 級)", unit: "", default: 1, min: 0, max: 1, scale: "switch" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      command: (v) => `.tran ${1 / v.fin / 500} ${4 / v.fin}`,
      probes: [
        { label: "入力 Vin", unit: "V", signal: "v(in)", group: "入力と出力" },
        { label: "出力 Vout", unit: "V", signal: "v(out)", group: "入力と出力" },
        { label: "+Vcc 側の電源電流", unit: "A", signal: (get) => get("i(vcc)").map((i) => -i) },
      ],
    },
  ],
  models: ["NPN", "PNP", "DIODE"],
  // AB 級: 2 つのベースの間に、ダイオード 2 個ぶん(約 1.4V)のバイアスを入れる。
  // B 級: 2 つのベースを直接つなぐ(0V の電源でつなぐ)
  buildNetlist: (v) => `Vcc vcc 0 DC ${v.Vcc}
Vee vee 0 DC ${-v.Vcc}
Vin in 0 SIN(0 ${v.vamp} ${v.fin})
Cin in b1 100u
Rb1 vcc b1 ${v.Rb}
${v.bias >= 0.5 ? "D1 b1 m DGEN\nD2 m b2 DGEN" : "Vsh b1 b2 DC 0"}
Rb2 b2 vee ${v.Rb}
Q1 vcc b1 out QGEN
Q2 vee b2 out QPGEN
RL out 0 ${v.RL}`,
  schematic: {
    width: 540,
    height: 290,
    parts: [
      { kind: "VAC", from: [30, 100], to: [30, 200], name: "Vin" },
      { kind: "C", from: [46, 100], to: [86, 100], name: "Cin", note: "100 µF" },
      { kind: "R", from: [100, 40], to: [100, 100], name: "Rb1", param: "Rb" },
      { kind: "D", from: [100, 100], to: [100, 140], name: "D1", note: "AB 級のみ" },
      { kind: "D", from: [100, 140], to: [100, 180], name: "D2" },
      { kind: "R", from: [100, 180], to: [100, 250], name: "Rb2", param: "Rb" },
      { kind: "NPN", at: [160, 100], name: "Q1" },
      { kind: "PNP", at: [160, 180], name: "Q2" },
      { kind: "R", from: [320, 140], to: [320, 210], name: "RL", param: "RL" },
      { kind: "VDC", from: [460, 40], to: [460, 145], name: "+Vcc", param: "Vcc" },
      { kind: "VDC", from: [460, 145], to: [460, 250], name: "−Vcc", param: "Vcc" },
      { kind: "GND", at: [30, 200] },
      { kind: "GND", at: [320, 210] },
      { kind: "GND", at: [500, 145] },
      { kind: "TEXT", at: [260, 134], text: "Vout", anchor: "start" },
    ],
    wires: [
      [[30, 100], [46, 100]],
      [[86, 100], [160, 100]],
      [[100, 180], [160, 180]],
      [[100, 40], [460, 40]],
      [[200, 70], [200, 40]],
      [[200, 130], [200, 150]],
      [[200, 140], [320, 140]],
      [[200, 210], [200, 250]],
      [[100, 250], [460, 250]],
      [[460, 145], [500, 145]],
    ],
    junctions: [[100, 40], [200, 40], [100, 100], [100, 180], [200, 140], [100, 250], [200, 250]],
  },
  explanation,
};
