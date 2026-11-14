# Model Grid

A small spreadsheet-style operating model built with React and TypeScript. Cells accept numbers and formulas
(`=B1-B2`, `=SUM(B1:B2)`), recalculate instantly, flag circular references as `#ERROR`, and mark every cell
changed from the base case.

Built to explore how finance users expect a model to behave: formulas stay visible when you edit, results are
precise, and nothing changes silently.

## Run
```bash
npm install
npm run dev
```

## Notes
- `src/calc.ts` is the formula engine (dependency-aware, no `eval` of arbitrary text: input is validated first).
- Next steps: undo/redo, named scenarios, keyboard navigation between cells, unit tests for `evalCell`.
