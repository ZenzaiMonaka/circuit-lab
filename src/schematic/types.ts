export type Point = [number, number];

/** 両端子の部品。from → to の向きに描く(電源は from が + 側、ダイオードは from がアノード) */
export interface TwoTerminalPart {
  kind: "R" | "C" | "L" | "VDC" | "VAC" | "VPULSE" | "D" | "SW";
  from: Point;
  to: Point;
  name: string;
  /** 値を表示するパラメータの key */
  param?: string;
  /** 値の代わりに表示する固定テキスト */
  note?: string;
}

export interface GroundPart { kind: "GND"; at: Point }
/** NPN トランジスタ。at はベースの位置。コレクタは (+40,-30)、エミッタは (+40,+30) */
export interface NpnPart { kind: "NPN"; at: Point; name: string }
/** オペアンプ。at は左端の中央。反転入力は (0,-20)、非反転入力は (0,+20)、出力は (+80,0) */
export interface OpampPart { kind: "OPAMP"; at: Point; name: string; note?: string }
export interface TextPart { kind: "TEXT"; at: Point; text: string; anchor?: "start" | "middle" | "end" }

export type SchematicPart = TwoTerminalPart | GroundPart | NpnPart | OpampPart | TextPart;

export interface SchematicDef {
  width: number;
  height: number;
  parts: SchematicPart[];
  /** 配線(折れ線) */
  wires: Point[][];
  /** 配線の接続点(黒丸) */
  junctions: Point[];
}
