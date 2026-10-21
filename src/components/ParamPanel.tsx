import { useEffect, useState } from "react";
import type { ValidationErrors } from "../engine/netlist";
import { formatSI, parseSI } from "../engine/units";
import type { ParamDef, ParamValues } from "../templates/types";

const SLIDER_STEPS = 1000;

function toPosition(param: ParamDef, value: number): number {
  const clamped = Math.min(param.max, Math.max(param.min, value));
  const ratio =
    param.scale === "log"
      ? Math.log(clamped / param.min) / Math.log(param.max / param.min)
      : (clamped - param.min) / (param.max - param.min);
  return Math.round(ratio * SLIDER_STEPS);
}

function fromPosition(param: ParamDef, position: number): number {
  const ratio = position / SLIDER_STEPS;
  const value =
    param.scale === "log"
      ? param.min * (param.max / param.min) ** ratio
      : param.min + (param.max - param.min) * ratio;
  // スライダーで選んだ値は 3 桁に丸める(4.7123k のような中途半端な値にしない)
  return Math.min(param.max, Math.max(param.min, Number(value.toPrecision(3))));
}

const toInputText = (value: number) => formatSI(value).replace(" ", "");

interface RowProps {
  param: ParamDef;
  value: number;
  error?: string;
  onChange: (key: string, value: number) => void;
}

function ParamRow({ param, value, error, onChange }: RowProps) {
  const [draft, setDraft] = useState(toInputText(value));
  const [draftError, setDraftError] = useState<string | null>(null);

  // スライダーなど外からの変更を入力欄に反映する
  useEffect(() => {
    setDraft(toInputText(value));
    setDraftError(null);
  }, [value]);

  const commit = () => {
    const parsed = parseSI(draft);
    if (parsed === null) {
      setDraftError("数値を入力してください(例: 4.7k, 100n)");
      return;
    }
    setDraftError(null);
    onChange(param.key, parsed);
  };

  const message = draftError ?? error;
  const id = `param-${param.key}`;

  if (param.scale === "switch") {
    return (
      <div className="param-row param-switch">
        <label htmlFor={id}>{param.label}</label>
        <input
          id={id}
          type="checkbox"
          checked={value >= 0.5}
          onChange={(e) => onChange(param.key, e.target.checked ? 1 : 0)}
        />
      </div>
    );
  }

  return (
    <div className="param-row">
      <label htmlFor={id}>{param.label}</label>
      <div className="param-input">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={draft}
          aria-invalid={message ? true : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
        <span className="param-unit">{param.unit}</span>
      </div>
      <input
        type="range"
        aria-label={`${param.label}のスライダー`}
        min={0}
        max={SLIDER_STEPS}
        value={toPosition(param, value)}
        onChange={(e) => onChange(param.key, fromPosition(param, Number(e.target.value)))}
      />
      {message && <p className="param-error" role="alert">{message}</p>}
    </div>
  );
}

interface Props {
  params: ParamDef[];
  values: ParamValues;
  errors: ValidationErrors;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
}

export function ParamPanel({ params, values, errors, onChange, onReset }: Props) {
  return (
    <div className="param-panel">
      {params.map((param) => (
        <ParamRow key={param.key} param={param} value={values[param.key]} error={errors[param.key]} onChange={onChange} />
      ))}
      <button type="button" className="link-button" onClick={onReset}>初期値に戻す</button>
    </div>
  );
}
