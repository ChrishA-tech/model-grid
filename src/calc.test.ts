import { describe, expect, it } from "vitest";
import { evalCell, Sheet } from "./calc";

const ev = (s: Sheet, id = "A1") => evalCell(id, s);

describe("evalCell", () => {
  it("reads numbers, blanks and thousands separators", () => {
    expect(ev({ A1: "1200" })).toBe(1200);
    expect(ev({ A1: "1,380" })).toBe(1380);
    expect(ev({})).toBe(0);
    expect(ev({ A1: "abc" })).toBeNaN();
  });
  it("respects operator precedence, parentheses and unary minus", () => {
    expect(ev({ A1: "=2+3*4" })).toBe(14);
    expect(ev({ A1: "=(2+3)*4" })).toBe(20);
    expect(ev({ A1: "=-2*-3" })).toBe(6);
    expect(ev({ A1: "=10/4-1" })).toBe(1.5);
  });
  it("resolves references, case-insensitively", () => {
    const s = { B1: "1200", B2: "700", B3: "=b1-B2", B4: "=B3/B1*100" };
    expect(ev(s, "B3")).toBe(500);
    expect(ev(s, "B4")).toBeCloseTo(41.667, 3);
  });
  it("sums ranges across rows and columns", () => {
    const s = { B1: "1", B2: "2", C1: "3", C2: "4", D1: "=SUM(B1:C2)", D2: "=sum(B2:B1)", D3: "=SUM(C1)" };
    expect(ev(s, "D1")).toBe(10);
    expect(ev(s, "D2")).toBe(3);
    expect(ev(s, "D3")).toBe(3);
  });
  it("flags circular references, division by zero and bad syntax", () => {
    expect(ev({ A1: "=B1", B1: "=A1" })).toBeNaN();
    expect(ev({ A1: "=SUM(A1:A2)" })).toBeNaN();
    expect(ev({ A1: "=1/0" })).toBeNaN();
    expect(ev({ A1: "=1+" })).toBeNaN();
    expect(ev({ A1: "=(1+2" })).toBeNaN();
    expect(ev({ A1: "=MAX(B1:B2)" })).toBeNaN();
  });
  it("never executes code in a formula", () => {
    expect(ev({ A1: "=alert(1)" })).toBeNaN();
    expect(ev({ A1: "=constructor" })).toBeNaN();
    expect(ev({ A1: "=1;globalThis.x=1" })).toBeNaN();
    expect((globalThis as Record<string, unknown>).x).toBeUndefined();
  });
});
