import { ledResistor } from "./basic/led-resistor";
import { voltageDivider } from "./basic/voltage-divider";
import { wheatstoneBridge } from "./basic/wheatstone-bridge";
import { rcHighpass } from "./filter/rc-highpass";
import { rcLowpass } from "./filter/rc-lowpass";
import { rlcParallelResonance } from "./filter/rlc-parallel-resonance";
import { rlcSeriesResonance } from "./filter/rlc-series-resonance";
import { invertingAmp } from "./opamp/inverting-amp";
import { bridgeRectifier } from "./power-supply/bridge-rectifier";
import { clipperClamper } from "./power-supply/clipper-clamper";
import { halfWaveRectifier } from "./power-supply/half-wave-rectifier";
import { seriesRegulator } from "./power-supply/series-regulator";
import { voltageDoubler } from "./power-supply/voltage-doubler";
import { zenerRegulator } from "./power-supply/zener-regulator";
import { buckConverter } from "./power-electronics/buck-converter";
import { rcCharge } from "./transient/rc-charge";
import { rlCircuit } from "./transient/rl-circuit";
import { rlcStep } from "./transient/rlc-step";
import { bjtSwitch } from "./transistor/bjt-switch";
import { commonEmitter } from "./transistor/common-emitter";
import { currentMirror } from "./transistor/current-mirror";
import { differentialPair } from "./transistor/differential-pair";
import { emitterFollower } from "./transistor/emitter-follower";
import { mosfetSwitch } from "./transistor/mosfet-switch";
import { pushPull } from "./transistor/push-pull";
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
  halfWaveRectifier,
  bridgeRectifier,
  voltageDoubler,
  zenerRegulator,
  seriesRegulator,
  clipperClamper,
  bjtSwitch,
  mosfetSwitch,
  commonEmitter,
  emitterFollower,
  differentialPair,
  currentMirror,
  pushPull,
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
