# Presentation Outline (about 10 minutes)

1. **Problem** - place N queens on an N x N board so that no two attack each other (same row, column or diagonal).
2. **Why backtracking** - build a solution row by row; the moment a partial placement is invalid, undo it and try the next option. This prunes huge parts of the N^N search space.
3. **Algorithm** - `place(row)`: try each column, check safety in O(1) using column / diagonal (row+col) / anti-diagonal (row-col) flags, recurse, then remove the queen (backtrack).
4. **Live demo**
   - N = 4, use **Step**: show conflicts (red line = attacker), a dead end, a backtrack, then the first solution. There are exactly 2 solutions.
   - N = 8, **Visualize** at medium speed, then **Find all solutions**: 92 solutions, matches the known value.
   - Tick **Unique only**: 12 solutions remain (the rest are rotations/reflections).
   - **Play all** and click gallery thumbnails.
   - N = 4 vs 6: 2 vs 4 solutions; N = 12: 14,200 solutions.
5. **Statistics** - compare queens placed, conflicts and backtracks as N grows.
6. **Implementation** - `js/nqueens.js` (pure logic; a generator yields one event per step), `js/app.js` (canvas + gallery), unit tests in `tests/`. No backend.
7. **Complexity** - worst case O(N!) with pruning (far fewer nodes in practice); space O(N).
8. **Future work** - bitmask optimization, first-solution-only mode, N up to 14+, other backtracking problems (Sudoku, graph coloring).

## Likely questions
- **Why no solution for N = 2 and 3?** Every placement leaves no safe square for a later row.
- **Why 92 and 12?** 92 total solutions; each unique one has up to 8 symmetric copies (4 rotations x mirror); one is symmetric, so 11x8 + 4 = 92.
- **Is the safe check really O(1)?** Yes, three boolean arrays.
- **Faster?** Bitmasks, symmetry pruning (search only half the first row).
