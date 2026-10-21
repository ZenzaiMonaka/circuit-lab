import { modelText } from "../models";
import { formatSI } from "./units";
import type { AnalysisDef, ParamValues, Template } from "../templates/types";

export type ValidationErrors = Record<string, string>;

/** 部品値が範囲内の数値かを調べる。ネットリストに入るのは検証済みの数値だけにするための関門 */
export function validateValues(template: Template, values: ParamValues): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const param of template.params) {
    const value = values[param.key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors[param.key] = "数値を入力してください";
    } else if (value < param.min || value > param.max) {
      errors[param.key] = `${formatSI(param.min, param.unit)} 〜 ${formatSI(param.max, param.unit)} の範囲で入力してください`;
    }
  }
  return errors;
}

export function defaultValues(template: Template): ParamValues {
  return Object.fromEntries(template.params.map((param) => [param.key, param.default]));
}

/** 回路本体 + 部品モデル + 解析命令 から、ngspice に渡す文字列を組み立てる */
export function buildFullNetlist(template: Template, analysis: AnalysisDef, values: ParamValues): string {
  const errors = validateValues(template, values);
  if (Object.keys(errors).length > 0) {
    throw new Error(`部品値が不正です: ${Object.values(errors).join(" / ")}`);
  }
  return [
    `circuit-lab: ${template.id}`, // 先頭行は SPICE ではタイトル扱い
    template.buildNetlist(values),
    modelText(template.models),
    analysis.command(values),
    ".end",
  ].join("\n");
}
