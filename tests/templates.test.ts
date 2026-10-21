import { describe, expect, it } from "vitest";
import { buildFullNetlist, defaultValues, validateValues } from "../src/engine/netlist";
import { TEMPLATES } from "../src/templates";

describe("全テンプレートの共通チェック", () => {
  it("id が重複していない", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const template of TEMPLATES) {
    describe(template.id, () => {
      it("初期値が範囲内で、解説文がある", () => {
        expect(validateValues(template, defaultValues(template))).toEqual({});
        expect(template.explanation.length).toBeGreaterThan(100);
      });

      it("すべての解析でネットリストが組み立てられ、数値以外が混ざらない", () => {
        for (const analysis of template.analyses) {
          const netlist = buildFullNetlist(template, analysis, defaultValues(template));
          expect(netlist).not.toMatch(/NaN|undefined|Infinity/);
          expect(netlist.trimEnd().endsWith(".end")).toBe(true);
        }
      });

      it("回路図の配線・接続点が図の範囲内にある", () => {
        const { width, height, wires, junctions } = template.schematic;
        for (const [x, y] of [...wires.flat(), ...junctions]) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(height);
        }
      });

      it("回路図の部品の端子が図の範囲内にある", () => {
        const { width, height, parts } = template.schematic;
        for (const part of parts) {
          const points = "from" in part ? [part.from, part.to] : [part.at];
          for (const [x, y] of points) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(height);
          }
        }
      });

      it("回路図が参照するパラメータが存在する", () => {
        const keys = new Set(template.params.map((p) => p.key));
        for (const part of template.schematic.parts) {
          if ("param" in part && part.param) expect(keys.has(part.param)).toBe(true);
        }
      });
    });
  }
});

describe("validateValues", () => {
  const template = TEMPLATES[0];

  it("範囲外・非数を検出する", () => {
    const errors = validateValues(template, { ...defaultValues(template), R1: 1, R2: NaN });
    expect(Object.keys(errors).sort()).toEqual(["R1", "R2"]);
  });

  it("範囲外の値ではネットリストを作らない", () => {
    expect(() => buildFullNetlist(template, template.analyses[0], { ...defaultValues(template), Vin: -5 })).toThrow(
      "部品値が不正です",
    );
  });
});
