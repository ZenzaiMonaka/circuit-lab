import { voltageDivider } from "./basic/voltage-divider";
import { rcLowpass } from "./filter/rc-lowpass";
import { commonEmitter } from "./transistor/common-emitter";
import { invertingAmp } from "./opamp/inverting-amp";
import { buckConverter } from "./power-electronics/buck-converter";
import type { Category, Template } from "./types";

/** 一覧に出す順番(分類ごとに並べる) */
export const TEMPLATES: Template[] = [voltageDivider, rcLowpass, commonEmitter, invertingAmp, buckConverter];

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

export function groupByCategory(): [Category, Template[]][] {
  const groups = new Map<Category, Template[]>();
  for (const template of TEMPLATES) {
    groups.set(template.category, [...(groups.get(template.category) ?? []), template]);
  }
  return [...groups.entries()];
}
