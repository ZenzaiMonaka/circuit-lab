import { useMemo, useState } from "react";
import { Explanation } from "./components/Explanation";
import { ParamPanel } from "./components/ParamPanel";
import { PwaNotice } from "./components/PwaNotice";
import { ResultView } from "./components/ResultView";
import { TemplateList } from "./components/TemplateList";
import { defaultValues, validateValues } from "./engine/netlist";
import { Schematic } from "./schematic/Schematic";
import { findTemplate, TEMPLATES } from "./templates";
import { ANALYSIS_LABELS, type AnalysisKind, type ParamValues } from "./templates/types";
import { useHashRoute } from "./useHashRoute";
import { useSimulation } from "./useSimulation";

export function App() {
  const route = useHashRoute();
  const template = findTemplate(route) ?? TEMPLATES[0];

  // 回路ごとの部品値。別の回路に切り替えて戻っても、変更した値を覚えておく
  const [valuesById, setValuesById] = useState<Record<string, ParamValues>>({});
  // useMemo で、値を変えない限り同じオブジェクトを返す。毎回作り直すと、
  // 「値が変わった」と見なされて、何もしなくても計算が繰り返されてしまう(useSimulation.ts 参照)
  const values = useMemo(() => valuesById[template.id] ?? defaultValues(template), [valuesById, template]);
  const errors = useMemo(() => validateValues(template, values), [template, values]);

  const [selectedKind, setSelectedKind] = useState<AnalysisKind | null>(null);
  const analysis = template.analyses.find((a) => a.kind === selectedKind) ?? template.analyses[0];

  const [menuOpen, setMenuOpen] = useState(false);
  const { state, visibleData, stale, engineLoading, elapsedSec, run, cancel, hasErrors } = useSimulation(
    template,
    analysis,
    values,
  );

  const setValue = (key: string, value: number) =>
    setValuesById((prev) => ({ ...prev, [template.id]: { ...(prev[template.id] ?? defaultValues(template)), [key]: value } }));

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="template-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          回路を選ぶ
        </button>
        <h1>circuit-lab</h1>
      </header>

      <div className="layout">
        <nav id="template-nav" className="sidebar" data-open={menuOpen} aria-label="回路の一覧">
          <TemplateList selectedId={template.id} onSelect={() => setMenuOpen(false)} />
        </nav>

        <main className="content">
          <div className="title-block">
            <h2>{template.title}</h2>
            <p>{template.summary}</p>
          </div>

          <div className="top-grid">
            <section className="card" aria-label="回路図">
              <Schematic schematic={template.schematic} params={template.params} values={values} title={template.title} />
            </section>
            <section className="card" aria-label="部品値">
              <h3>部品値</h3>
              <ParamPanel
                params={template.params}
                values={values}
                errors={errors}
                onChange={setValue}
                onReset={() => setValuesById((prev) => ({ ...prev, [template.id]: defaultValues(template) }))}
              />
            </section>
          </div>

          <section className="card" aria-label="解析結果">
            <div className="result-header">
              <div role="tablist" aria-label="解析の種類" className="tabs">
                {template.analyses.map((a) => (
                  <button
                    key={a.kind}
                    type="button"
                    role="tab"
                    aria-selected={a.kind === analysis.kind}
                    onClick={() => setSelectedKind(a.kind)}
                  >
                    {ANALYSIS_LABELS[a.kind]}
                  </button>
                ))}
              </div>
              {!analysis.autoRun && (
                <button type="button" className="run-button" disabled={hasErrors || state.status === "running"} onClick={run}>
                  {state.status === "running" ? "計算中…" : "実行"}
                </button>
              )}
            </div>

            <div className="status" role="status">
              {engineLoading && <p>計算エンジンを読み込み中です(初回のみ時間がかかります)…</p>}
              {!engineLoading && state.status === "running" && (
                <p>
                  計算中…{elapsedSec > 0 && ` ${elapsedSec} 秒`}
                  {elapsedSec >= 2 && (
                    <>
                      {" "}
                      <button type="button" className="link-button" onClick={cancel}>中止</button>
                    </>
                  )}
                </p>
              )}
              {hasErrors && <p className="error">部品値に誤りがあります。赤字の指示に従って直してください。</p>}
              {state.status === "error" && (
                <p className="error">
                  計算できませんでした: {state.message}
                </p>
              )}
              {!analysis.autoRun && !visibleData && state.status === "idle" && !hasErrors && (
                <p>この解析は計算に時間がかかるため、「実行」を押したときだけ計算します。</p>
              )}
              {!analysis.autoRun && stale && <p>部品値が変わりました。「実行」で再計算します(下の結果は前の値のものです)。</p>}
            </div>

            {visibleData && (
              <div className="result-body" data-stale={stale || state.status === "running"}>
                <ResultView data={visibleData} />
              </div>
            )}
          </section>

          <section className="card" aria-label="解説">
            <h3>解説</h3>
            <Explanation source={template.explanation} />
          </section>
        </main>
      </div>

      <PwaNotice />

      <footer className="app-footer">
        <p>
          計算エンジンに ngspice(修正 BSD ライセンス)を eecircuit-engine(MIT)経由で使っています。
          グラフは uPlot、数式は KaTeX、文書は marked、画面は React(いずれも MIT ライセンス)で作っています。
        </p>
      </footer>
    </div>
  );
}
