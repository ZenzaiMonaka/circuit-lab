import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

export const bjtSwitch: Template = {
  id: "bjt-switch",
  category: "transistor",
  title: "トランジスタスイッチ(コイル負荷)",
  summary: "NPN でコイル(リレー)をオン・オフし、逆起電力をフライホイールダイオードで逃がす",
  params: [
    { key: "Vcc", label: "電源電圧 Vcc", unit: "V", default: 12, min: 5, max: 30, scale: "linear" },
    { key: "Vdrv", label: "駆動電圧(High のとき)", unit: "V", default: 5, min: 2, max: 12, scale: "linear" },
    { key: "Rb", label: "ベース抵抗 Rb", unit: "Ω", default: 4.7e3, min: 100, max: 100e3, scale: "log" },
    { key: "Rcoil", label: "コイルの抵抗 Rcoil", unit: "Ω", default: 120, min: 10, max: 1e3, scale: "log" },
    { key: "L1", label: "コイルのインダクタンス L1", unit: "H", default: 100e-3, min: 1e-3, max: 1, scale: "log" },
    { key: "diode", label: "フライホイールダイオード", unit: "", default: 1, min: 0, max: 1, scale: "switch" },
  ],
  analyses: [
    {
      kind: "tran",
      autoRun: true,
      // 駆動は「5τ オン、5τ オフ」(τ = L/Rcoil)。通電と遮断を 1 回ずつ見る
      command: (v) => {
        const tau = v.L1 / v.Rcoil;
        return `.tran ${tau / 200} ${20 * tau}`;
      },
      probes: [
        { label: "駆動電圧", unit: "V", signal: "v(g)", group: "駆動電圧" },
        { label: "コレクタ電圧 Vc", unit: "V", signal: "v(c)", group: "コレクタ電圧" },
        { label: "コイルの電流", unit: "A", signal: "i(l1)" },
      ],
    },
  ],
  models: ["NPN", "DIODE", "BREAKDOWN80"],
  buildNetlist: (v) => {
    const tau = v.L1 / v.Rcoil;
    // ダイオードなしのときは、トランジスタ自身のコレクタ降伏(80V と仮定)で電圧が頭打ちになる
    const diode = v.diode >= 0.5 ? "D1 c vcc DGEN" : "D1 0 c DBV80";
    return `Vcc vcc 0 DC ${v.Vcc}
Vdrv g 0 PULSE(0 ${v.Vdrv} 0 10n 10n ${5 * tau} ${10 * tau})
Rb g b ${v.Rb}
Q1 c b 0 QGEN
Rcoil vcc x ${v.Rcoil}
L1 x c ${v.L1}
${diode}`;
  },
  schematic: {
    width: 470,
    height: 290,
    parts: [
      { kind: "VPULSE", from: [40, 190], to: [40, 260], name: "Vdrv", param: "Vdrv" },
      { kind: "R", from: [70, 190], to: [130, 190], name: "Rb", param: "Rb" },
      { kind: "NPN", at: [140, 190], name: "Q1" },
      { kind: "R", from: [180, 40], to: [180, 100], name: "Rcoil", param: "Rcoil" },
      { kind: "L", from: [180, 100], to: [180, 160], name: "L1", param: "L1" },
      { kind: "D", from: [290, 160], to: [290, 40], name: "D1", note: "保護" },
      { kind: "VDC", from: [390, 40], to: [390, 260], name: "Vcc", param: "Vcc" },
      { kind: "GND", at: [110, 260] },
    ],
    wires: [
      [[40, 190], [70, 190]],
      [[130, 190], [140, 190]],
      [[180, 40], [390, 40]],
      [[180, 160], [290, 160]],
      [[180, 220], [180, 260]],
      [[40, 260], [390, 260]],
    ],
    junctions: [[290, 40], [290, 160], [180, 160], [180, 260]],
  },
  explanation,
};
