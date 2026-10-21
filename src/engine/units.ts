// SI 接頭辞つきの数値の入力・表示。
// 画面では "M" をメガ、"m" をミリとして扱う(SPICE の "M"=ミリとは違う)。
// ネットリストには接頭辞なしの数値だけを渡すので、この違いは回路の計算に影響しない。

const PREFIX_EXPONENT: Record<string, number> = {
  f: -15, p: -12, n: -9, u: -6, µ: -6, m: -3, k: 3, K: 3, M: 6, Meg: 6, meg: 6, G: 9, T: 12,
};

const DISPLAY_PREFIXES: [number, string][] = [
  [-15, "f"], [-12, "p"], [-9, "n"], [-6, "µ"], [-3, "m"], [0, ""], [3, "k"], [6, "M"], [9, "G"], [12, "T"],
];

const NUMBER_PATTERN = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(Meg|meg|[fpnuµmkKMGT])?\s*[A-Za-zΩ%°]*$/;

/** "4.7k" や "100 nF" を数値にする。読み取れなければ null。 */
export function parseSI(text: string): number | null {
  const match = NUMBER_PATTERN.exec(text.trim());
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const exponent = match[2] ? PREFIX_EXPONENT[match[2]] : 0;
  // 10 ** -6 などの掛け算は、誤差が出る(10 * 1e-6 は 9.999999999999999e-6 になる)。
  // 範囲の境目(例: 最小値 10µ)で「範囲外」と判定されないよう、有効数字 12 桁に丸める
  return Number((base * 10 ** exponent).toPrecision(12));
}

/** 3 桁の有効数字で接頭辞つきにする。例: formatSI(0.0047, "F") → "4.7 mF" */
export function formatSI(value: number, unit = ""): string {
  if (!Number.isFinite(value)) return `—${unit ? " " + unit : ""}`;
  if (value === 0) return `0${unit ? " " + unit : ""}`;
  // 先に有効数字で丸める。理由: 999.9k を丸めると 1000k になり、「1 M」と表示したいため
  const rounded = Number(value.toPrecision(3));
  const exponent = Math.floor(Math.log10(Math.abs(rounded)) / 3) * 3;
  const clamped = Math.min(12, Math.max(-15, exponent));
  const prefix = DISPLAY_PREFIXES.find(([e]) => e === clamped)?.[1] ?? "";
  const scaled = Number((rounded / 10 ** clamped).toPrecision(3));
  return `${scaled} ${prefix}${unit}`.trim();
}
