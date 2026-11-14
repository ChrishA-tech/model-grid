import { useState } from "react";
import { evalCell, Sheet } from "./calc";

const years = ["2023", "2024", "2025", "2026E"];
const cols = ["B", "C", "D", "E"];
const rows = ["Revenue", "Cost of sales", "Gross profit", "Operating expenses", "Operating income", "Operating margin %"];

const baseline: Sheet = {};
const data = [
  [1200, 1380, 1520, 1710],
  [700, 790, 860, 950],
  null,
  [310, 340, 365, 400],
  null,
  null,
];
cols.forEach((c, i) => {
  data.forEach((r, n) => { if (r) baseline[`${c}${n + 1}`] = String(r[i]); });
  baseline[`${c}3`] = `=${c}1-${c}2`;
  baseline[`${c}5`] = `=${c}3-${c}4`;
  baseline[`${c}6`] = `=${c}5/${c}1*100`;
});

const fmt = (v: number, row: number) =>
  Number.isNaN(v) ? "#ERROR" : row === 6 ? `${v.toFixed(1)}%` : v.toLocaleString("en-GB");

export default function App() {
  const [sheet, setSheet] = useState<Sheet>(baseline);
  const [editing, setEditing] = useState<string | null>(null);
  const changed = Object.keys(sheet).filter((k) => sheet[k] !== baseline[k]).length;

  return (
    <main>
      <header>
        <h1>Operating model, £000</h1>
        <p>Type over any cell, including formulas such as <code>=B1-B2</code> or <code>=SUM(B1:B2)</code>. Edited cells are marked until you reset.</p>
      </header>
      <div className="scroll">
        <table>
          <thead>
            <tr><th />{years.map((y) => <th key={y}>{y}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((label, i) => (
              <tr key={label} className={i === 2 || i === 4 ? "total" : ""}>
                <th scope="row">{label}</th>
                {cols.map((c) => {
                  const id = `${c}${i + 1}`;
                  const v = evalCell(id, sheet);
                  return (
                    <td key={id} className={sheet[id] !== baseline[id] ? "edited" : ""}>
                      <input
                        aria-label={`${label} ${years[cols.indexOf(c)]}`}
                        value={editing === id ? sheet[id] : fmt(v, i + 1)}
                        onFocus={() => setEditing(id)}
                        onBlur={() => setEditing(null)}
                        onChange={(e) => setSheet({ ...sheet, [id]: e.target.value })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>
        <span>{changed ? `${changed} cell${changed > 1 ? "s" : ""} changed from the base case` : "Base case"}</span>
        <button disabled={!changed} onClick={() => setSheet(baseline)}>Reset to base case</button>
      </footer>
    </main>
  );
}
