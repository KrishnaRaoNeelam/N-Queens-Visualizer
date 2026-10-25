const test = require('node:test');
const assert = require('node:assert');
const Q = require('../js/nqueens.js');

test('solution counts match the known values for N = 1..10', () => {
  for (let n = 1; n <= 10; n++) assert.strictEqual(Q.solveAll(n).solutions.length, Q.KNOWN[n], 'N=' + n);
});
test('every solution is valid and distinct (N = 8)', () => {
  const { solutions } = Q.solveAll(8);
  assert.ok(solutions.every(Q.isValid));
  assert.strictEqual(new Set(solutions.map((s) => s.join())).size, 92);
});
test('unique solutions up to rotation/reflection', () => {
  const expected = { 4: 1, 5: 2, 6: 1, 7: 6, 8: 12 };
  for (const [n, u] of Object.entries(expected))
    assert.strictEqual(new Set(Q.solveAll(+n).solutions.map(Q.canonical)).size, u, 'N=' + n);
});
test('generator matches solveAll (solutions and stats) for N = 6', () => {
  const sols = [], st = { placements: 0, conflicts: 0, backtracks: 0 };
  for (const e of Q.backtrack(6)) {
    if (e.type === 'solution') sols.push(e.cols);
    else if (e.type === 'place') st.placements++;
    else if (e.type === 'conflict') st.conflicts++;
    else if (e.type === 'remove') st.backtracks++;
  }
  const ref = Q.solveAll(6);
  assert.deepStrictEqual(sols, ref.solutions);
  assert.deepStrictEqual(st, ref.stats);
});
test('first events for N = 4 are placements down the first column then a conflict', () => {
  const it = Q.backtrack(4);
  assert.deepStrictEqual(it.next().value, { type: 'place', row: 0, col: 0 });
  assert.deepStrictEqual(it.next().value, { type: 'conflict', row: 1, col: 0 });
  assert.deepStrictEqual(it.next().value, { type: 'conflict', row: 1, col: 1 });
  assert.deepStrictEqual(it.next().value, { type: 'place', row: 1, col: 2 });
});
test('N = 2 and N = 3 have no solutions', () => {
  assert.strictEqual(Q.solveAll(2).solutions.length, 0);
  assert.strictEqual(Q.solveAll(3).solutions.length, 0);
});
