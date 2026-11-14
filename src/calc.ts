export type Sheet = Record<string, string>;

const colNum = (c: string) => c.charCodeAt(0) - 65;
const colStr = (n: number) => String.fromCharCode(65 + n);

/**
 * Evaluate a cell. Supports numbers, cell refs (B1), + - * / unary minus, parentheses and SUM(B1:C3).
 * Formulas are parsed by a small recursive-descent parser: user text is never passed to eval or Function().
 * Returns NaN for invalid input, division by zero and circular references (shown as #ERROR).
 */
export function evalCell(id: string, s: Sheet, seen: Set<string> = new Set()): number {
  if (seen.has(id)) return NaN; // circular reference
  const raw = (s[id] ?? "").trim();
  if (!raw) return 0;
  if (!raw.startsWith("=")) return Number(raw.replace(/,/g, ""));
  const next = new Set(seen).add(id);
  try {
    const v = new Parser(raw.slice(1), (ref) => evalCell(ref, s, next)).parse();
    return Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

export type Tok =
  | { t: "num"; v: number }
  | { t: "ref"; v: string }
  | { t: "range"; a: string; b: string }
  | { t: "fn"; v: string }
  | { t: "op"; v: string };

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const re =
    /\s*(?:([A-Za-z])(\d+)\s*:\s*([A-Za-z])(\d+)|([A-Za-z])(\d+)|([A-Za-z]+)\s*(?=\()|(\d+(?:\.\d*)?|\.\d+)|([-+*/()]))/y;
  let i = 0;
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new Error(`Unexpected input at position ${i}`);
    if (m[1] !== undefined) out.push({ t: "range", a: m[1].toUpperCase() + m[2], b: m[3].toUpperCase() + m[4] });
    else if (m[5] !== undefined) out.push({ t: "ref", v: m[5].toUpperCase() + m[6] });
    else if (m[7] !== undefined) out.push({ t: "fn", v: m[7].toUpperCase() });
    else if (m[8] !== undefined) out.push({ t: "num", v: Number(m[8]) });
    else out.push({ t: "op", v: m[9] });
    i = re.lastIndex;
  }
  return out;
}

class Parser {
  private toks: Tok[];
  private i = 0;
  constructor(src: string, private ref: (id: string) => number) {
    this.toks = tokenize(src);
  }

  parse(): number {
    const v = this.expr();
    if (this.i !== this.toks.length) throw new Error("Unexpected trailing input");
    return v;
  }
  private peekOp(...ops: string[]): string | null {
    const t = this.toks[this.i];
    return t && t.t === "op" && ops.includes(t.v) ? t.v : null;
  }
  private expect(op: string) {
    if (!this.peekOp(op)) throw new Error(`Expected ${op}`);
    this.i++;
  }
  // expr := term (('+' | '-') term)*
  private expr(): number {
    let v = this.term();
    for (let op = this.peekOp("+", "-"); op; op = this.peekOp("+", "-")) {
      this.i++;
      const r = this.term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  // term := unary (('*' | '/') unary)*
  private term(): number {
    let v = this.unary();
    for (let op = this.peekOp("*", "/"); op; op = this.peekOp("*", "/")) {
      this.i++;
      const r = this.unary();
      if (op === "/" && r === 0) throw new Error("Division by zero");
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  private unary(): number {
    if (this.peekOp("-")) { this.i++; return -this.unary(); }
    if (this.peekOp("+")) { this.i++; return this.unary(); }
    return this.primary();
  }
  private primary(): number {
    const t = this.toks[this.i++];
    if (!t) throw new Error("Unexpected end of formula");
    if (t.t === "num") return t.v;
    if (t.t === "ref") return this.ref(t.v);
    if (t.t === "op" && t.v === "(") {
      const v = this.expr();
      this.expect(")");
      return v;
    }
    if (t.t === "fn") {
      if (t.v !== "SUM") throw new Error(`Unknown function ${t.v}`);
      this.expect("(");
      const r = this.toks[this.i++];
      let total = 0;
      if (r && r.t === "range") {
        const [c1, c2] = [colNum(r.a[0]), colNum(r.b[0])].sort((a, b) => a - b);
        const [r1, r2] = [Number(r.a.slice(1)), Number(r.b.slice(1))].sort((a, b) => a - b);
        for (let c = c1; c <= c2; c++) for (let n = r1; n <= r2; n++) total += this.ref(colStr(c) + n);
      } else if (r && r.t === "ref") {
        total = this.ref(r.v);
      } else throw new Error("SUM needs a range such as B1:B3");
      this.expect(")");
      return total;
    }
    throw new Error("Unexpected token");
  }
}
