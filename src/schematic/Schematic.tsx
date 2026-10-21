import type { CSSProperties, ReactNode } from "react";
import { formatSI } from "../engine/units";
import type { ParamDef, ParamValues } from "../templates/types";
import type { OpampPart, TransistorPart, Point, SchematicDef, TwoTerminalPart } from "./types";

interface Props {
  schematic: SchematicDef;
  params: ParamDef[];
  values: ParamValues;
  title: string;
}

/** 図の上に出る部品名・値の文字が切れないよう、上に空ける余白 */
const TOP_MARGIN = 14;

/** 部品の本体(記号)の長さ。両端の残りは配線(リード線)で埋める */
const BODY_LENGTH: Record<TwoTerminalPart["kind"], number> = {
  R: 36, C: 10, L: 40, D: 24, ZD: 24, SW: 34, VDC: 28, VAC: 28, VPULSE: 28, VM: 28,
};

/** 部品から名前・値の文字までの距離(部品の太さに合わせる) */
const LABEL_OFFSET: Record<TwoTerminalPart["kind"], number> = {
  R: 14, C: 20, L: 14, D: 18, ZD: 18, SW: 20, VDC: 22, VAC: 22, VPULSE: 22, VM: 22,
};

const isCircleSymbol = (kind: TwoTerminalPart["kind"]) =>
  kind === "VDC" || kind === "VAC" || kind === "VPULSE" || kind === "VM";

function line(x1: number, y1: number, x2: number, y2: number, key?: string | number): ReactNode {
  return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} />;
}

/** 電源・電圧計の記号は、文字や + − を傾けずに描くため、画面の座標のまま描く */
function SourceSymbol({ part }: { part: TwoTerminalPart }) {
  const [x1, y1] = part.from;
  const [x2, y2] = part.to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const radius = 14;
  return (
    <g>
      {line(x1, y1, cx - ux * radius, cy - uy * radius)}
      {line(cx + ux * radius, cy + uy * radius, x2, y2)}
      <circle cx={cx} cy={cy} r={radius} />
      {part.kind === "VDC" && (
        <>
          {/* 長い線が + 側(from 側) */}
          {line(cx - ux * 8 - 5, cy - uy * 8, cx - ux * 8 + 5, cy - uy * 8)}
          {line(cx - ux * 8, cy - uy * 8 - 5, cx - ux * 8, cy - uy * 8 + 5)}
          {line(cx + ux * 8 - 5, cy + uy * 8, cx + ux * 8 + 5, cy + uy * 8)}
        </>
      )}
      {part.kind === "VAC" && <path d={`M${cx - 8} ${cy} q4 -9 8 0 t8 0`} />}
      {part.kind === "VM" && (
        <text x={cx} y={cy + 4.5} textAnchor="middle" className="sch-fill sch-meter">V</text>
      )}
      {part.kind === "VPULSE" && <path d={`M${cx - 9} ${cy + 5} h0 v-9 h6 v9 h6 v-9`} />}
    </g>
  );
}

function BodySymbol({ kind }: { kind: TwoTerminalPart["kind"] }) {
  switch (kind) {
    case "R":
      return <rect x={-18} y={-7} width={36} height={14} />;
    case "C":
      return (
        <>
          {line(-5, -12, -5, 12)}
          {line(5, -12, 5, 12)}
        </>
      );
    case "L":
      return <path d="M-20 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0" />;
    case "D":
      return (
        <>
          <polygon points="-12,-10 -12,10 8,0" className="sch-fill" />
          {line(10, -10, 10, 10)}
        </>
      );
    case "ZD":
      return (
        <>
          <polygon points="-12,-10 -12,10 8,0" className="sch-fill" />
          <path d="M6 -13 L10 -10 L10 10 L14 13" />
        </>
      );
    case "SW":
      return (
        <>
          <circle cx={-14} cy={0} r={2.5} className="sch-fill" />
          <circle cx={14} cy={0} r={2.5} className="sch-fill" />
          {line(-14, 0, 10, -13)}
        </>
      );
    default:
      return null;
  }
}

function TwoTerminal({ part }: { part: TwoTerminalPart }) {
  if (isCircleSymbol(part.kind)) return <SourceSymbol part={part} />;
  const [x1, y1] = part.from;
  const [x2, y2] = part.to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const body = BODY_LENGTH[part.kind];
  return (
    <g transform={`translate(${(x1 + x2) / 2} ${(y1 + y2) / 2}) rotate(${angle})`}>
      {line(-len / 2, 0, -body / 2, 0)}
      {line(body / 2, 0, len / 2, 0)}
      <BodySymbol kind={part.kind} />
    </g>
  );
}

function PartLabel({ part, valueText }: { part: TwoTerminalPart; valueText: string }) {
  const [x1, y1] = part.from;
  const [x2, y2] = part.to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const offset = LABEL_OFFSET[part.kind];
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  const x = horizontal ? mx : mx + offset;
  const anchor = horizontal ? "middle" : "start";
  const y = horizontal ? my - offset - (valueText ? 12 : 0) : my - (valueText ? 3 : -4);
  return (
    <g className="sch-text" textAnchor={anchor}>
      <text x={x} y={y} className="sch-name">{part.name}</text>
      {valueText && <text x={x} y={y + 14}>{valueText}</text>}
    </g>
  );
}

/** トランジスタの記号(ベース・ゲートが原点、上の端子が (40,-30)、下の端子が (40,30)) */
function TransistorSymbol({ kind }: { kind: TransistorPart["kind"] }) {
  if (kind === "NMOS") {
    return (
      <>
        {line(0, 0, 12, 0)}
        {line(12, -14, 12, 14)}
        {line(18, -16, 18, -8)}
        {line(18, -4, 18, 4)}
        {line(18, 8, 18, 16)}
        <polyline points="18,-12 40,-12 40,-30" />
        <polyline points="18,12 40,12 40,30" />
        <polyline points="18,0 40,0 40,12" />
        <polygon points="18,0 26,-3 26,3" className="sch-fill" />
      </>
    );
  }
  return (
    <>
      {line(0, 0, 18, 0)}
      {line(18, -18, 18, 18)}
      {line(18, -9, 40, -30)}
      {line(18, 9, 40, 30)}
      {/* 矢印はエミッタに付く。NPN は外向き(下の端子)、PNP は内向き(上の端子) */}
      <polygon
        points={kind === "NPN" ? "38,28 29.4,25.4 35,19.6" : "21.6,-12.5 30.2,-15.1 24.6,-20.9"}
        className="sch-fill"
      />
    </>
  );
}

function Transistor({ part }: { part: TransistorPart }) {
  const [x, y] = part.at;
  return (
    <g>
      <g transform={`translate(${x} ${y})${part.mirror ? " scale(-1 1)" : ""}`}>
        <TransistorSymbol kind={part.kind} />
      </g>
      <text
        x={part.mirror ? x - 50 : x + 50}
        y={y + 6}
        textAnchor={part.mirror ? "end" : "start"}
        className="sch-text sch-name"
      >
        {part.name}
      </text>
    </g>
  );
}

function Opamp({ part }: { part: OpampPart }) {
  const [x, y] = part.at;
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,-40 0,40 80,0" />
      {line(6, -20, 14, -20)}
      {line(6, 20, 14, 20)}
      {line(10, 16, 10, 24)}
      <text x={34} y={4} textAnchor="middle" className="sch-text sch-name">{part.name}</text>
      {part.note && <text x={40} y={58} textAnchor="middle" className="sch-text">{part.note}</text>}
    </g>
  );
}

function pointList(points: Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

/** 回路図(SVG)。部品値は現在の値を反映して表示する */
export function Schematic({ schematic, params, values, title }: Props) {
  const unitOf = (key: string) => params.find((p) => p.key === key)?.unit ?? "";
  const valueText = (part: TwoTerminalPart) =>
    part.note ?? (part.param ? formatSI(values[part.param], unitOf(part.param)) : "");

  return (
    <svg
      className="schematic"
      viewBox={`0 ${-TOP_MARGIN} ${schematic.width} ${schematic.height + TOP_MARGIN}`}
      role="img"
      aria-label={`${title}の回路図`}
      // 横に長い回路図は縮小表示されるので、文字も図の幅に合わせて大きくする
      style={{ "--sch-font": `${Math.max(12, schematic.width / 34)}px` } as CSSProperties}
    >
      <g className="sch-line">
        {schematic.wires.map((wire, i) => (
          <polyline key={i} points={pointList(wire)} />
        ))}
        {schematic.parts.map((part, i) => {
          switch (part.kind) {
            case "GND": {
              const [x, y] = part.at;
              return (
                <g key={i}>
                  {line(x, y, x, y + 8)}
                  {line(x - 12, y + 8, x + 12, y + 8)}
                  {line(x - 8, y + 13, x + 8, y + 13)}
                  {line(x - 4, y + 18, x + 4, y + 18)}
                </g>
              );
            }
            case "NPN":
            case "PNP":
            case "NMOS":
              return <Transistor key={i} part={part} />;
            case "OPAMP":
              return <Opamp key={i} part={part} />;
            case "TEXT":
              return null;
            default:
              return <TwoTerminal key={i} part={part} />;
          }
        })}
        {schematic.junctions.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5} className="sch-dot" />
        ))}
      </g>
      {schematic.parts.map((part, i) => {
        if (part.kind === "TEXT") {
          return (
            <text key={i} x={part.at[0]} y={part.at[1]} textAnchor={part.anchor ?? "middle"} className="sch-text sch-name">
              {part.text}
            </text>
          );
        }
        if ("from" in part) return <PartLabel key={i} part={part} valueText={valueText(part)} />;
        return null;
      })}
    </svg>
  );
}
