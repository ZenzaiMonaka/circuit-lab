import type { ResultType } from "eecircuit-engine";
import { describe, expect, it } from "vitest";
import { convertResult } from "../src/engine/results";
import type { AnalysisDef } from "../src/templates/types";

/** 点が n 個の、時間・v(a)・v(b) だけの結果(ngspice を使わない) */
function fakeTranResult(n: number): ResultType {
  const time = Array.from({ length: n }, (_, i) => i * 1e-6);
  return {
    header: "",
    numVariables: 3,
    variableNames: ["time", "v(a)", "v(b)"],
    numPoints: n,
    dataType: "real",
    data: [
      { name: "time", type: "time", values: time },
      { name: "v(a)", type: "voltage", values: time.map((t) => 2 * t) },
      { name: "v(b)", type: "voltage", values: time.map((t) => t) },
    ],
  };
}

describe("convertResult", () => {
  // 回路の定義には、get("v(a)").map((a, i) => a - get("v(b)")[i]) のように、点ごとに信号を取り直す式がある
  const analysis: AnalysisDef = {
    kind: "tran",
    autoRun: true,
    command: () => ".tran 1u 1m",
    probes: [{ label: "差", unit: "V", signal: (get) => get("v(a)").map((a, i) => a - get("v(b)")[i]) }],
  };

  it("点ごとに信号を取り直す式でも、正しく計算できる", () => {
    const data = convertResult(fakeTranResult(5), analysis, {});
    expect(data.kind).toBe("tran");
    if (data.kind === "tran") expect(data.series[0].y).toEqual([0, 1e-6, 2e-6, 3e-6, 4e-6]);
  });

  it("点が 20 万個あっても、1 秒以内に変換できる(点の数の 2 乗の時間がかからない)", () => {
    const result = fakeTranResult(200_000);
    const started = performance.now();
    convertResult(result, analysis, {});
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
