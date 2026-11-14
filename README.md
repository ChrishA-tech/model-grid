# Model Grid

**Live demo: https://chrisha-tech.github.io/model-grid/**

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
- `src/calc.ts` is the formula engine: a small recursive-descent parser (numbers, cell references, `+ - * /`,
  unary minus, parentheses, `SUM(range)`). User text is never passed to `eval` or `Function()`; circular
  references, division by zero and bad syntax show as `#ERROR`.
- `src/calc.test.ts`: unit tests for precedence, references, ranges, errors and code injection (`npm test`).
- Next steps: undo/redo, named scenarios, keyboard navigation between cells.
