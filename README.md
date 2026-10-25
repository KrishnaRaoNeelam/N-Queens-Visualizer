# N-Queens Backtracking Visualizer

An interactive web app that visualizes the **backtracking** algorithm solving the **N-Queens problem** and displays **all solutions**.

- Step-by-step animation (play, pause, single step, speed control), board size N = 4..12
- Attacked squares shaded; a conflict shows a red line to the attacking queen
- Live counters: solutions found, queens placed, conflicts checked, backtracks
- **Find all solutions** instantly, verified against the known totals (N=8 gives 92)
- **Unique only** filter that removes rotations and reflections (N=8 gives 12)
- Solution gallery with paging, Prev/Next and Play all

Plain HTML + CSS + JavaScript. **No backend, no build step, no dependencies.**

## Run in VS Code

1. Open this folder in VS Code (`File > Open Folder`).
2. Install the **Live Server** extension (VS Code will suggest it).
3. Right-click `index.html` and choose **Open with Live Server**.

Alternatives: double-click `index.html`, or `npm start` (needs Node.js).

## Run the tests

```bash
npm test
```

## Push to GitHub

Create an empty repository on github.com first (no README or license), then:

```bash
git init
git add .
git commit -m "N-Queens backtracking visualizer"
git branch -M main
git remote add origin https://github.com/<your-username>/nqueens-visualizer.git
git push -u origin main
```

### Free hosting with GitHub Pages
Repo **Settings > Pages > Source: GitHub Actions**. The included workflow publishes the site at `https://<your-username>.github.io/nqueens-visualizer/` on every push to `main`.

## Project structure

```
index.html            page layout
css/style.css         styles (light + dark mode)
js/nqueens.js         pure backtracking logic (testable, no DOM)
js/app.js             canvas drawing, animation, gallery
tests/                unit tests (node --test)
docs/PRESENTATION.md  class presentation outline
```

## How it works

`NQueens.backtrack(n)` is a generator that yields one event per step (`place`, `conflict`, `remove`, `solution`). The UI consumes events at the chosen speed. `NQueens.solveAll(n)` runs the same algorithm without animation for instant results.

| N | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|----|----|----|
| Solutions | 2 | 10 | 4 | 40 | 92 | 352 | 724 | 2680 | 14200 |

## License
MIT
