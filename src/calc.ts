export type Sheet = Record<string, string>;

const colNum = (c: string) => c.charCodeAt(0) - 65;
const colStr = (n: number) => String.fromCharCode(65 + n);

/** Evaluate a cell. Supports numbers, refs (B1), + - * / ( ) and SUM(B1:B3). Returns NaN on error or circular refs. */
export function evalCell(id: string, s: Sheet, seen: Set<string> = new Set()): number {
  if (seen.has(id)) return NaN;
  const raw = (s[id] ?? "").trim();
  if (!raw) return 0;
  if (!raw.startsWith("=")) return Number(raw);
  const next = new Set(seen).add(id);
  const f = raw
    .slice(1)
    .toUpperCase()
    .replace(/SUM\(([A-Z])(\d+):([A-Z])(\d+)\)/g, (_, c1, r1, c2, r2) => {
      let total = 0;
      for (let c = colNum(c1); c <= colNum(c2); c++)
        for (let r = Number(r1); r <= Number(r2); r++) total += evalCell(colStr(c) + r, s, next);
      return `(${total})`;
    })
    .replace(/[A-Z]\d+/g, (m) => `(${evalCell(m, s, next)})`);
  if (f.includes("NAN") || !/^[0-9+\-*/().\s]*$/.test(f)) return NaN;
  try {
    const v = Function(`"use strict";return (${f})`)();
    return Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}
