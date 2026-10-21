import { useMemo } from "react";
import type { AnalysisData, TranData } from "../engine/results";
import { formatSI } from "../engine/units";
import { Chart } from "./Chart";

function groupSeries(data: TranData): { group: string; unit: string; series: { label: string; y: number[] }[] }[] {
  const groups = new Map<string, { unit: string; series: { label: string; y: number[] }[] }>();
  for (const s of data.series) {
    const entry = groups.get(s.group) ?? { unit: s.unit, series: [] };
    entry.series.push({ label: s.label, y: s.y });
    groups.set(s.group, entry);
  }
  return [...groups.entries()].map(([group, entry]) => ({ group, ...entry }));
}

function TranView({ data }: { data: TranData }) {
  const groups = useMemo(() => groupSeries(data), [data]);
  return (
    <>
      {groups.map(({ group, unit, series }) => (
        <figure key={group}>
          <figcaption>{series.map((s) => s.label).join(" / ")}</figcaption>
          <Chart x={data.time} series={series} xLabel="時間" xUnit="s" yUnit={unit} />
        </figure>
      ))}
    </>
  );
}

const ZOOM_HINT = "グラフはドラッグで拡大、ダブルクリックで元に戻ります。凡例をクリックすると信号の表示を切り替えられます。";

export function ResultView({ data }: { data: AnalysisData }) {
  if (data.kind === "op") {
    return (
      <table className="op-table">
        <thead>
          <tr><th>項目</th><th>値</th></tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{formatSI(row.value, row.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (data.kind === "ac") {
    return (
      <>
        <p className="hint">{ZOOM_HINT}</p>
        <figure>
          <figcaption>ゲイン(入力 1V に対する出力の大きさ)</figcaption>
          <Chart
            x={data.frequency}
            series={data.series.map((s) => ({ label: s.label, y: s.gainDb }))}
            xLabel="周波数"
            xUnit="Hz"
            yUnit="dB"
            logX
          />
        </figure>
        <figure>
          <figcaption>位相(入力に対する出力の位相のずれ)</figcaption>
          <Chart
            x={data.frequency}
            series={data.series.map((s) => ({ label: s.label, y: s.phaseDeg }))}
            xLabel="周波数"
            xUnit="Hz"
            yUnit="°"
            logX
          />
        </figure>
      </>
    );
  }

  return (
    <>
      <p className="hint">{ZOOM_HINT}</p>
      <TranView data={data} />
    </>
  );
}
