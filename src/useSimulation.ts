import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFullNetlist, validateValues } from "./engine/netlist";
import { convertResult, type AnalysisData } from "./engine/results";
import { SpiceRunner } from "./engine/runner";
import type { AnalysisDef, ParamValues, Template } from "./templates/types";

export type RunStatus = "idle" | "running" | "done" | "error";

export interface RunState {
  status: RunStatus;
  data?: AnalysisData;
  /** data がどのテンプレート・解析・部品値のものか */
  dataKey?: string;
  message?: string;
}

const DEBOUNCE_MS = 400;

/**
 * 解析の実行を管理する。
 * - autoRun の解析は、値の変更から 0.4 秒待って自動で再計算する
 * - 実行中にさらに変更があった場合は、古い依頼を捨てて最新の値だけ計算する
 *
 * 注意: 計算を始める関数(run)は、作り直されない(参照が変わらない)ようにしてある。
 * run が毎回作り直されると、「run が変わった → 再計算を予約 → 状態が変わる → 画面が描き直される →
 * run が変わった…」と、何もしなくても 0.4 秒ごとに計算が繰り返され、
 * 0.4 秒より長くかかる計算の結果は、毎回「古い」として捨てられて、「計算中」が終わらなくなる。
 */
export function useSimulation(template: Template, analysis: AnalysisDef, values: ParamValues) {
  const [state, setState] = useState<RunState>({ status: "idle" });
  const [engineLoading, setEngineLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const runnerRef = useRef<SpiceRunner | null>(null);
  const latestRequest = useRef(0);

  const runner = (runnerRef.current ??= new SpiceRunner(setEngineLoading));

  const valuesKey = JSON.stringify(values);
  const viewKey = `${template.id}:${analysis.kind}`;
  const dataKey = `${viewKey}:${valuesKey}`;
  const hasErrors = useMemo(() => Object.keys(validateValues(template, values)).length > 0, [template, values]);

  // 最新の入力を持っておき、run はここから読む(run を作り直さずに済む)
  const latest = useRef({ template, analysis, values, hasErrors, dataKey });
  latest.current = { template, analysis, values, hasErrors, dataKey };

  const run = useCallback(async () => {
    const { template, analysis, values, hasErrors, dataKey } = latest.current;
    const requestId = ++latestRequest.current;
    if (hasErrors) {
      // 部品値が不正なときは計算しない。実行中だった計算の結果は捨てられるので、「計算中」のまま残らないようにする
      setState((prev) => (prev.status === "running" ? { ...prev, status: "idle" } : prev));
      return;
    }
    setState((prev) => ({ ...prev, status: "running", message: undefined }));
    try {
      const netlist = buildFullNetlist(template, analysis, values);
      const result = await runner.run(netlist, () => requestId !== latestRequest.current);
      if (result === null || requestId !== latestRequest.current) return;
      setState({ status: "done", data: convertResult(result, analysis, values), dataKey });
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setState((prev) => ({ ...prev, status: "error", message: error instanceof Error ? error.message : String(error) }));
    }
  }, [runner]);

  const cancel = useCallback(() => runner.cancel(), [runner]);

  // 回路や解析の切り替え: 前の結果を捨て、自動実行の解析ならすぐ計算する
  const previousViewKey = useRef<string | null>(null);
  useEffect(() => {
    const viewChanged = previousViewKey.current !== viewKey;
    previousViewKey.current = viewKey;
    if (viewChanged) {
      latestRequest.current++;
      setState({ status: "idle" });
    }
    if (!analysis.autoRun) return;
    const timer = setTimeout(run, viewChanged ? 0 : DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [viewKey, dataKey, analysis.autoRun, run]);

  // 計算が長引いているときに、経過時間を出す(「止まっているのか」が分かるように)
  useEffect(() => {
    if (state.status !== "running") {
      setElapsedSec(0);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  const visibleData = state.dataKey?.startsWith(`${viewKey}:`) ? state.data : undefined;
  const stale = state.status !== "running" && visibleData !== undefined && state.dataKey !== dataKey;

  return { state, visibleData, stale, engineLoading, elapsedSec, run, cancel, hasErrors };
}
