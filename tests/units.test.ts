import { describe, expect, it } from "vitest";
import { formatSI, parseSI } from "../src/engine/units";

describe("parseSI", () => {
  it("接頭辞つきの数値を読み取る", () => {
    expect(parseSI("4.7k")).toBeCloseTo(4700);
    expect(parseSI("100n")).toBeCloseTo(1e-7, 15);
    expect(parseSI("2.2u")).toBeCloseTo(2.2e-6, 15);
    expect(parseSI("1M")).toBe(1e6);
    expect(parseSI("1m")).toBeCloseTo(1e-3, 15);
    expect(parseSI("1meg")).toBe(1e6);
  });

  it("単位つき・空白つきでも読み取る", () => {
    expect(parseSI("10 V")).toBe(10);
    expect(parseSI("4.7 kΩ")).toBeCloseTo(4700);
    expect(parseSI("100 nF")).toBeCloseTo(1e-7, 15);
    expect(parseSI("1 kHz")).toBe(1000);
    expect(parseSI("50%")).toBe(50);
  });

  it("掛け算の誤差で、境目の値がずれない(10u がちょうど 1e-5 になる)", () => {
    expect(parseSI("10u")).toBe(1e-5);
    expect(parseSI("4.7u")).toBe(4.7e-6);
    expect(parseSI("100n")).toBe(1e-7);
    expect(parseSI("22p")).toBe(22e-12);
    expect(parseSI("0.1m")).toBe(1e-4);
    expect(parseSI("1.5k")).toBe(1500);
  });

  it("指数表記と符号を読み取る", () => {
    expect(parseSI("1e-6")).toBeCloseTo(1e-6, 15);
    expect(parseSI("-2.5")).toBe(-2.5);
  });

  it("読み取れない文字列は null", () => {
    expect(parseSI("")).toBeNull();
    expect(parseSI("abc")).toBeNull();
    expect(parseSI("1.2.3")).toBeNull();
    expect(parseSI("k")).toBeNull();
  });
});

describe("formatSI", () => {
  it("3 桁の有効数字で接頭辞をつける", () => {
    expect(formatSI(4700, "Ω")).toBe("4.7 kΩ");
    expect(formatSI(1e-7, "F")).toBe("100 nF");
    expect(formatSI(0.0123456, "V")).toBe("12.3 mV");
    expect(formatSI(100e3, "Hz")).toBe("100 kHz");
  });

  it("丸めで桁が上がる場合は 1 つ上の接頭辞にする", () => {
    expect(formatSI(999900, "Ω")).toBe("1 MΩ");
  });

  it("0・負数・単位なしを扱える", () => {
    expect(formatSI(0, "V")).toBe("0 V");
    expect(formatSI(-0.002, "A")).toBe("-2 mA");
    expect(formatSI(1500)).toBe("1.5 k");
  });

  it("有限でない値は「—」", () => {
    expect(formatSI(NaN, "V")).toBe("— V");
  });
});
