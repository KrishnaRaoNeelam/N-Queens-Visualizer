/**
 * Pure N-Queens backtracking logic (no DOM). Works in the browser
 * (window.NQueens) and in Node (module.exports) for unit tests.
 * A solution is an array `cols` where cols[row] = column of the queen in that row.
 */
(function (global) {
  'use strict';
  // Known total solutions, indexed by N (OEIS A000170)
  const KNOWN = [1, 1, 0, 0, 2, 10, 4, 40, 92, 352, 724, 2680, 14200, 73712, 365596];

  /**
   * Generator: yields one event per step.
   *  { type:'place', row, col }    queen placed
   *  { type:'conflict', row, col } square rejected (attacked)
   *  { type:'remove', row, col }   queen removed (backtrack)
   *  { type:'solution', cols }     all N queens placed
   */
  function* backtrack(n) {
    const cols = new Array(n).fill(-1);
    const usedC = new Uint8Array(n), d1 = new Uint8Array(2 * n), d2 = new Uint8Array(2 * n);
    function* place(r) {
      if (r === n) { yield { type: 'solution', cols: cols.slice() }; return; }
      for (let c = 0; c < n; c++) {
        const a = r + c, b = r - c + n - 1;
        if (usedC[c] || d1[a] || d2[b]) { yield { type: 'conflict', row: r, col: c }; continue; }
        cols[r] = c; usedC[c] = d1[a] = d2[b] = 1;
        yield { type: 'place', row: r, col: c };
        yield* place(r + 1);
        usedC[c] = d1[a] = d2[b] = 0; cols[r] = -1;
        yield { type: 'remove', row: r, col: c };
      }
    }
    yield* place(0);
  }

  /** Fast non-animated version. Returns { solutions, stats }. */
  function solveAll(n) {
    const solutions = [], stats = { placements: 0, conflicts: 0, backtracks: 0 };
    const cols = new Array(n).fill(-1);
    const usedC = new Uint8Array(n), d1 = new Uint8Array(2 * n), d2 = new Uint8Array(2 * n);
    (function rec(r) {
      if (r === n) { solutions.push(cols.slice()); return; }
      for (let c = 0; c < n; c++) {
        const a = r + c, b = r - c + n - 1;
        if (usedC[c] || d1[a] || d2[b]) { stats.conflicts++; continue; }
        cols[r] = c; usedC[c] = d1[a] = d2[b] = 1; stats.placements++;
        rec(r + 1);
        usedC[c] = d1[a] = d2[b] = 0; cols[r] = -1; stats.backtracks++;
      }
    })(0);
    return { solutions, stats };
  }

  function isValid(cols) {
    const n = cols.length;
    for (let i = 0; i < n; i++) {
      if (cols[i] < 0 || cols[i] >= n) return false;
      for (let j = i + 1; j < n; j++)
        if (cols[i] === cols[j] || Math.abs(cols[i] - cols[j]) === j - i) return false;
    }
    return true;
  }

  const toCols = (pts, n) => { const a = new Array(n); for (const [r, c] of pts) a[r] = c; return a; };

  /** The 8 symmetric variants (4 rotations x optional mirror) of a solution. */
  function symmetries(cols) {
    const n = cols.length, out = [];
    let pts = cols.map((c, r) => [r, c]);
    for (let k = 0; k < 4; k++) {
      out.push(toCols(pts, n));
      out.push(toCols(pts.map(([r, c]) => [r, n - 1 - c]), n));
      pts = pts.map(([r, c]) => [c, n - 1 - r]); // rotate 90 degrees
    }
    return out;
  }

  /** Same key for all solutions that are rotations/reflections of each other. */
  function canonical(cols) {
    return symmetries(cols).map((s) => s.join(',')).reduce((a, b) => (b < a ? b : a));
  }

  const api = { KNOWN, backtrack, solveAll, isValid, symmetries, canonical };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.NQueens = api;
})(typeof window !== 'undefined' ? window : globalThis);
