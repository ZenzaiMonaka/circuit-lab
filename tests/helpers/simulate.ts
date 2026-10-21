import { Simulation } from "eecircuit-engine";
import { buildFullNetlist, defaultValues } from "../../src/engine/netlist";
import { convertResult, type AnalysisData } from "../../src/engine/results";
import type { AnalysisKind, ParamValues, Template } from "../../src/templates/types";

let shared: Simulation | null = null;

/** ブラウザの Worker と同じ手順で、Node 上でテンプレートの解析を実行する */
export async function simulate(
  template: Template,
  kind: AnalysisKind,
  overrides: ParamValues = {},
): Promise<AnalysisData> {
  if (!shared) {
    shared = new Simulation();
    await shared.start();
  }
  const analysis = template.analyses.find((a) => a.kind === kind);
  if (!analysis) throw new Error(`${template.id} に ${kind} 解析がありません`);
  const values = { ...defaultValues(template), ...overrides };
  shared.setNetList(buildFullNetlist(template, analysis, values));
  return convertResult(await shared.runSim(), analysis, values);
}
