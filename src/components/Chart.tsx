import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { formatSI } from "../engine/units";

export interface ChartSeries {
  label: string;
  y: number[];
}

interface Props {
  x: number[];
  series: ChartSeries[];
  xLabel: string;
  xUnit: string;
  yUnit: string;
  /** x 軸を対数にする(周波数特性) */
  logX?: boolean;
  height?: number;
}

// 明るい背景・暗い背景のどちらでも見分けやすい色
const PALETTE = ["#2a7de1", "#e3642a", "#1f9d6b", "#a45bd0"];

function cssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function Chart({ x, series, xLabel, xUnit, yUnit, logX = false, height = 260 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ink = cssVar("--ink-soft", "#555");
    const grid = cssVar("--grid", "#ddd");
    // 対数軸は 1, 2, ..., 9 の目盛りが密になって文字が重なるため、10 の累乗だけに文字を付ける
    const isDecade = (t: number) => Math.abs(Math.log10(t) - Math.round(Math.log10(t))) < 1e-9;
    const axis = (unit: string, isX: boolean): uPlot.Axis => ({
      stroke: ink,
      grid: { stroke: grid, width: 1 },
      ticks: { stroke: grid, width: 1 },
      size: isX ? 40 : 76,
      values: (_u, ticks) =>
        ticks.map((t) => (isX && logX && !isDecade(t) ? "" : formatSI(t, unit))),
    });

    const options: uPlot.Options = {
      width: container.clientWidth || 600,
      height,
      scales: { x: { time: false, distr: logX ? 3 : 1 } },
      axes: [axis(xUnit, true), axis(yUnit, false)],
      series: [
        { label: xLabel, value: (_u, v) => (v == null ? "—" : formatSI(v, xUnit)) },
        ...series.map((s, i) => ({
          label: s.label,
          stroke: PALETTE[i % PALETTE.length],
          width: 2,
          points: { show: false },
          value: (_u: uPlot, v: number | null) => (v == null ? "—" : formatSI(v, yUnit)),
        })),
      ],
      cursor: { drag: { x: true, y: false } },
    };

    const plot = new uPlot(options, [x, ...series.map((s) => s.y)], container);
    const observer = new ResizeObserver(() => plot.setSize({ width: container.clientWidth, height }));
    observer.observe(container);
    return () => {
      observer.disconnect();
      plot.destroy();
    };
  }, [x, series, xLabel, xUnit, yUnit, logX, height]);

  return <div ref={containerRef} className="chart" />;
}
