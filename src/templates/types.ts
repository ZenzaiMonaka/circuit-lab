import type { SchematicDef } from "../schematic/types";
import type { ModelName } from "../models";

export type Category =
  | "basic" | "transient" | "filter" | "power-supply" | "transistor" | "opamp" | "power-electronics";

export const CATEGORY_LABELS: Record<Category, string> = {
  basic: "基本",
  transient: "過渡応答",
  filter: "フィルタ・共振",
  "power-supply": "電源",
  transistor: "トランジスタ",
  opamp: "オペアンプ",
  "power-electronics": "パワーエレクトロニクス",
};

export interface ParamDef {
  key: string;
  label: string;
  unit: string;
  default: number;
  min: number;
  max: number;
  /**
   * 桁が大きく変わる値(抵抗・容量など)は log にするとスライダーが使いやすい。
   * switch は「あり/なし」の切り替え(値は 1 か 0。min=0, max=1 にする)
   */
  scale: "linear" | "log" | "switch";
}

export type ParamValues = Record<string, number>;

/** 結果から数値の列を取り出す関数。name は "v(out)" のような ngspice の信号名 */
export type SignalGetter = (name: string) => number[];

export interface Probe {
  label: string;
  unit: string;
  /** 信号名、または計算式 */
  signal: string | ((get: SignalGetter, values: ParamValues) => number[]);
  /** 同じ group の信号は同じグラフに重ねる。省略時は単位ごと */
  group?: string;
}

export type AnalysisKind = "op" | "tran" | "ac";

export const ANALYSIS_LABELS: Record<AnalysisKind, string> = {
  op: "直流動作点",
  tran: "過渡解析",
  ac: "周波数特性",
};

export interface AnalysisDef {
  kind: AnalysisKind;
  command: (values: ParamValues) => string;
  probes: Probe[];
  /** 値を変えたら自動で再計算するか。計算が重いものは false にしてボタンで実行する */
  autoRun: boolean;
}

export interface Template {
  id: string;
  category: Category;
  title: string;
  summary: string;
  params: ParamDef[];
  analyses: AnalysisDef[];
  models: ModelName[];
  /** 回路本体のネットリスト(解析命令・モデルを除く) */
  buildNetlist: (values: ParamValues) => string;
  schematic: SchematicDef;
  /** 解説(Markdown + KaTeX の数式) */
  explanation: string;
}
