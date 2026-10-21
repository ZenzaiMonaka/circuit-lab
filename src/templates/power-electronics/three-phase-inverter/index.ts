import type { Point, SchematicPart } from "../../../schematic/types";
import type { Template } from "../../types";
import explanation from "./explanation.md?raw";

const PHASES = ["u", "v", "w"] as const;

// 回路図の配置(単位は図の座標)。スイッチの文字がダイオードに重ならないよう、ダイオードは少し離す
const LEG_X = [130, 270, 410];
const DIODE_DX = 70;
const STUB_DX = 110;
const TOP = 30;
const BOTTOM = 250;
const MID = 140;
const LOAD_ROWS = [70, 150, 230];

/** 回路図の 3 つの脚(U, V, W)。上下のスイッチと、それぞれに逆並列のダイオード */
function legParts(): SchematicPart[] {
  const names: [string, string][] = [["S1", "S4"], ["S3", "S6"], ["S5", "S2"]];
  return LEG_X.flatMap((x, i): SchematicPart[] => [
    { kind: "SW", from: [x, 60], to: [x, MID], name: names[i][0] },
    { kind: "SW", from: [x, MID], to: [x, 220], name: names[i][1] },
    { kind: "D", from: [x + DIODE_DX, MID], to: [x + DIODE_DX, 60], name: `D${i * 2 + 1}` },
    { kind: "D", from: [x + DIODE_DX, 220], to: [x + DIODE_DX, MID], name: `D${i * 2 + 2}` },
    { kind: "TEXT", at: [x + STUB_DX + 6, MID + 4], text: PHASES[i], anchor: "start" },
  ]);
}

/** 負荷(Y 結線の R と L)。脚とは、同じ名前の線(u, v, w)でつながっていることを文字で示す */
function loadParts(): SchematicPart[] {
  const parts: SchematicPart[] = PHASES.flatMap((phase, i): SchematicPart[] => [
    { kind: "TEXT", at: [550, LOAD_ROWS[i] + 4], text: phase, anchor: "end" },
    { kind: "R", from: [590, LOAD_ROWS[i]], to: [660, LOAD_ROWS[i]], name: `R${phase}`, param: "Rload" },
    { kind: "L", from: [660, LOAD_ROWS[i]], to: [740, LOAD_ROWS[i]], name: `L${phase}`, param: "L1" },
  ]);
  parts.push({ kind: "TEXT", at: [792, LOAD_ROWS[1] + 4], text: "N", anchor: "start" });
  return parts;
}

type Wire = Point[];

function wires(): Wire[] {
  const lastX = LEG_X[LEG_X.length - 1] + DIODE_DX;
  return [
    [[20, TOP], [lastX, TOP]],
    [[20, BOTTOM], [lastX, BOTTOM]],
    // 各脚の上下のスイッチ・ダイオードを、上下の線につなぐ。中点は右へ引き出す
    ...LEG_X.flatMap((x): Wire[] => [
      [[x, 60], [x, TOP]],
      [[x + DIODE_DX, 60], [x + DIODE_DX, TOP]],
      [[x, 220], [x, BOTTOM]],
      [[x + DIODE_DX, 220], [x + DIODE_DX, BOTTOM]],
      [[x, MID], [x + STUB_DX, MID]],
    ]),
    // 負荷の 3 つの枝と、中性点 N
    ...LOAD_ROWS.map((y): Wire => [[560, y], [590, y]]),
    ...LOAD_ROWS.map((y): Wire => [[740, y], [780, y]]),
    [[780, LOAD_ROWS[0]], [780, LOAD_ROWS[2]]],
  ];
}

export const threePhaseInverter: Template = {
  id: "three-phase-inverter",
  category: "power-electronics",
  title: "三相 矩形波インバータ(180° 通電)",
  summary: "6 個のスイッチで、直流から三相の交流(6 ステップ波形)を作る",
  params: [
    { key: "Vdc", label: "直流電圧 Vdc", unit: "V", default: 300, min: 10, max: 600, scale: "log" },
    { key: "f", label: "出力の周波数", unit: "Hz", default: 50, min: 10, max: 400, scale: "log" },
    { key: "Rload", label: "負荷の抵抗(1 相ぶん)R", unit: "Ω", default: 5, min: 1, max: 100, scale: "log" },
    { key: "L1", label: "負荷のインダクタンス(1 相ぶん)L", unit: "H", default: 10e-3, min: 1e-3, max: 100e-3, scale: "log" },
    { key: "td", label: "デッドタイム td", unit: "s", default: 200e-6, min: 1e-6, max: 1e-3, scale: "log" },
  ],
  analyses: [
    {
      kind: "tran",
      // 計算が重いので、ボタンを押したときだけ実行する。出力の 2 周期ぶんを計算する。
      // デッドタイムが短いときも細かく計算し、長いときは細かすぎないようにする
      autoRun: false,
      command: (v) => {
        const step = Math.max(v.td / 4, 1 / v.f / 5000);
        return `.tran ${step} ${2 / v.f} 0 ${step}`;
      },
      probes: [
        {
          label: "線間電圧 Vuv",
          unit: "V",
          signal: (get) => get("v(u)").map((u, i) => u - get("v(v)")[i]),
          group: "線間電圧 Vuv(U 相 − V 相)",
        },
        {
          label: "相電圧 Vun",
          unit: "V",
          signal: (get) => get("v(u)").map((u, i) => u - get("v(n)")[i]),
          group: "相電圧 Vun(負荷の中性点 N から見た U 相の電圧)",
        },
        { label: "U 相の電流", unit: "A", signal: "i(lu)", group: "負荷電流" },
        { label: "V 相の電流", unit: "A", signal: "i(lv)", group: "負荷電流" },
        { label: "W 相の電流", unit: "A", signal: "i(lw)", group: "負荷電流" },
      ],
    },
  ],
  models: ["SWITCH", "DIODE"],
  buildNetlist: (v) => {
    const period = 1 / v.f;
    const edge = 10e-9;
    // 上のスイッチは、半周期からデッドタイムを引いた間だけオン。下のスイッチは、半周期遅れて同じ幅だけオン
    const width = period / 2 - v.td;
    const gate = (delay: number) => `PULSE(0 5 ${delay} ${edge} ${edge} ${width} ${period})`;
    const legs = PHASES.map((p, i) => {
      const phase = (i * period) / 3;
      return `Vg${p}h g${p}h 0 ${gate(phase)}
Vg${p}l g${p}l 0 ${gate(phase + period / 2)}
S${p}h dc ${p} g${p}h 0 SWGEN
S${p}l ${p} 0 g${p}l 0 SWGEN
D${p}h ${p} dc DGEN
D${p}l 0 ${p} DGEN
R${p} ${p} n${p} ${v.Rload}
L${p} n${p} n ${v.L1}`;
    });
    return [`Vdc dc 0 DC ${v.Vdc}`, ...legs].join("\n");
  },
  schematic: {
    width: 840,
    height: 290,
    parts: [
      { kind: "VDC", from: [20, TOP], to: [20, BOTTOM], name: "Vdc", param: "Vdc" },
      ...legParts(),
      { kind: "GND", at: [90, BOTTOM] },
      ...loadParts(),
    ],
    wires: wires(),
    junctions: [
      ...LEG_X.flatMap((x): Point[] => [
        [x, TOP], [x + DIODE_DX, TOP], [x, BOTTOM], [x + DIODE_DX, BOTTOM], [x, MID], [x + DIODE_DX, MID],
      ]),
      [780, LOAD_ROWS[1]],
    ],
  },
  explanation,
};
