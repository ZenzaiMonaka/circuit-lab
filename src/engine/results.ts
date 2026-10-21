import type { ResultType } from "eecircuit-engine";
import type { AnalysisDef, ParamValues, Probe, SignalGetter } from "../templates/types";

export interface Series {
  label: string;
  unit: string;
  group: string;
  y: number[];
}

export interface TranData {
  kind: "tran";
  time: number[];
  series: Series[];
}

export interface AcSeries {
  label: string;
  gainDb: number[];
  phaseDeg: number[];
}

export interface AcData {
  kind: "ac";
  frequency: number[];
  series: AcSeries[];
}

export interface OpRow {
  label: string;
  unit: string;
  value: number;
}

export interface OpData {
  kind: "op";
  rows: OpRow[];
}

export type AnalysisData = TranData | AcData | OpData;

function realSignals(result: ResultType): SignalGetter {
  return (name) => {
    const column = result.data.find((d) => d.name === name.toLowerCase());
    if (!column) throw new Error(`信号 ${name} が結果にありません`);
    return column.values.map((v) => (typeof v === "number" ? v : v.real));
  };
}

function resolveProbe(probe: Probe, get: SignalGetter, values: ParamValues): number[] {
  return typeof probe.signal === "string" ? get(probe.signal) : probe.signal(get, values);
}

export function convertResult(result: ResultType, analysis: AnalysisDef, values: ParamValues): AnalysisData {
  if (analysis.kind === "ac") {
    const frequency = realSignals(result)("frequency");
    const series = analysis.probes.map((probe) => {
      if (typeof probe.signal !== "string") throw new Error("周波数特性の信号は名前で指定してください");
      const column = result.data.find((d) => d.name === (probe.signal as string).toLowerCase());
      if (!column) throw new Error(`信号 ${probe.signal} が結果にありません`);
      const complex = column.values.map((v) => (typeof v === "number" ? { real: v, img: 0 } : v));
      return {
        label: probe.label,
        gainDb: complex.map((c) => 20 * Math.log10(Math.hypot(c.real, c.img))),
        phaseDeg: complex.map((c) => (Math.atan2(c.img, c.real) * 180) / Math.PI),
      };
    });
    return { kind: "ac", frequency, series };
  }

  const get = realSignals(result);
  if (analysis.kind === "op") {
    const rows = analysis.probes.map((probe) => ({
      label: probe.label,
      unit: probe.unit,
      value: resolveProbe(probe, get, values)[0],
    }));
    return { kind: "op", rows };
  }

  return {
    kind: "tran",
    time: get("time"),
    series: analysis.probes.map((probe) => ({
      label: probe.label,
      unit: probe.unit,
      group: probe.group ?? probe.unit,
      y: resolveProbe(probe, get, values),
    })),
  };
}
