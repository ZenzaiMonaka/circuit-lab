export type Point = [number, number];

/** 両端子の部品。from → to の向きに描く(電源は from が + 側、ダイオードは from がアノード。VM は電圧計) */
export interface TwoTerminalPart {
  kind: "R" | "C" | "L" | "VDC" | "VAC" | "VPULSE" | "VM" | "D" | "ZD" | "SW";
  from: Point;
  to: Point;
  name: string;
  /** 値を表示するパラメータの key */
  param?: string;
  /** 値の代わりに表示する固定テキスト */
  note?: string;
}

export interface GroundPart { kind: "GND"; at: Point }
/**
 * トランジスタ。at はベース(MOSFET はゲート)の位置。
 * NPN・NMOS: 上の端子(コレクタ・ドレイン)が (+40,-30)、下の端子(エミッタ・ソース)が (+40,+30)。
 * PNP: 上がエミッタ (+40,-30)、下がコレクタ (+40,+30)。
 * mirror が true のときは左右を反転する(端子の x が -40 になる)
 */
export interface TransistorPart { kind: "NPN" | "PNP" | "NMOS"; at: Point; name: string; mirror?: boolean }
/**
 * オペアンプ。at は左端の中央。反転入力は (0,-20)、非反転入力は (0,+20)、出力は (+80,0)。
 * flip が true のときは上下を反転する(非反転入力が上、反転入力が下になる)
 */
export interface OpampPart { kind: "OPAMP"; at: Point; name: string; note?: string; flip?: boolean }
export interface TextPart { kind: "TEXT"; at: Point; text: string; anchor?: "start" | "middle" | "end" }

export type SchematicPart = TwoTerminalPart | GroundPart | TransistorPart | OpampPart | TextPart;

export interface SchematicDef {
  width: number;
  height: number;
  parts: SchematicPart[];
  /** 配線(折れ線) */
  wires: Point[][];
  /** 配線の接続点(黒丸) */
  junctions: Point[];
}
