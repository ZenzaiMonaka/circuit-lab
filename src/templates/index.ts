import { ledResistor } from "./basic/led-resistor";
import { voltageDivider } from "./basic/voltage-divider";
import { wheatstoneBridge } from "./basic/wheatstone-bridge";
import { rcHighpass } from "./filter/rc-highpass";
import { rcLowpass } from "./filter/rc-lowpass";
import { rlcParallelResonance } from "./filter/rlc-parallel-resonance";
import { rlcSeriesResonance } from "./filter/rlc-series-resonance";
import { invertingAmp } from "./opamp/inverting-amp";
import { buckConverter } from "./power-electronics/buck-converter";
import { rcCharge } from "./transient/rc-charge";
import { rlCircuit } from "./transient/rl-circuit";
import { rlcStep } from "./transient/rlc-step";
import { commonEmitter } from "./transistor/common-emitter";
import type { Category, Template } from "./types";

/** 一覧に出す順番(分類ごとに並べる) */
export const TEMPLATES: Template[] = [
  voltageDivider,
  wheatstoneBridge,
  ledResistor,
  rcCharge,
  rlCircuit,
  rlcStep,
  rcLowpass,
  rcHighpass,
  rlcSeriesResonance,
  rlcParallelResonance,
  commonEmitter,
  invertingAmp,
  buckConverter,
];

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
