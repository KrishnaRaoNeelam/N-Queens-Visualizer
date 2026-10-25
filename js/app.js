/** UI layer: board drawing, animation loop, solution gallery. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('board'), ctx = canvas.getContext('2d');
  const PAGE = 24;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const s = {
    n: 8, cols: [], trying: null, last: null,
    sols: [], uniq: [], seen: new Set(), sel: -1, showSol: false, page: 0,
    gen: null, running: false, finished: false, hold: 0, acc: 0, lastT: 0,
    dirty: false, lastGal: 0, cell: 40, dpr: 1, timer: null,
    stats: { placements: 0, conflicts: 0, backtracks: 0 }
  };
  const view = () => ($('unique').checked ? s.uniq : s.sols);
  const log = (m) => ($('log').textContent = m);

  function reset() {
    stopPlay();
    s.n = +$('n').value; $('nLabel').textContent = s.n;
    Object.assign(s, { cols: new Array(s.n).fill(-1), trying: null, last: null, sols: [], uniq: [], seen: new Set(),
      sel: -1, showSol: false, page: 0, gen: null, running: false, finished: false, hold: 0, dirty: false,
      stats: { placements: 0, conflicts: 0, backtracks: 0 } });
    log('Press ▶ Visualize to watch backtracking, or ⚡ to find all solutions.');
    $('solLabel').textContent = 'No solution selected';
    status('Ready'); resize(); renderGallery();
  }

  function status(t) {
    const v = s.stats, known = NQueens.KNOWN[s.n];
    $('sFound').textContent = s.sols.length; $('sUnique').textContent = s.uniq.length;
    $('sKnown').textContent = known; $('sPlace').textContent = v.placements;
    $('sConf').textContent = v.conflicts; $('sBack').textContent = v.backtracks;
    if (t) $('sStatus').textContent = t;
  }

  function resize() {
    s.dpr = window.devicePixelRatio || 1;
    const w = Math.min(560, canvas.parentElement.clientWidth - 24);
    s.cell = Math.max(20, Math.floor(w / s.n));
    const size = s.cell * s.n;
    canvas.style.width = canvas.style.height = size + 'px';
    canvas.width = canvas.height = size * s.dpr;
    draw();
  }

  function draw() {
    const n = s.n, c = s.cell;
    const shown = s.showSol && view()[s.sel] ? view()[s.sel] : s.cols;
    const full = shown.every((x) => x >= 0);
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
      ctx.fillStyle = (r + k) % 2 ? css('--sq2') : css('--sq1');
      ctx.fillRect(k * c, r * c, c, c);
    }
    if (!full) { // shade attacked squares
      ctx.fillStyle = css('--attack');
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
        for (let q = 0; q < n; q++) {
          const qc = shown[q];
          if (qc >= 0 && (q === r || qc === k || Math.abs(q - r) === Math.abs(qc - k))) { ctx.fillRect(k * c, r * c, c, c); break; }
        }
      }
    }
    if (s.trying && !s.showSol) {
      const { row, col } = s.trying;
      ctx.fillStyle = css('--bad'); ctx.globalAlpha = .55; ctx.fillRect(col * c, row * c, c, c); ctx.globalAlpha = 1;
      for (let q = 0; q < row; q++) {
        const qc = shown[q];
        if (qc === col || Math.abs(row - q) === Math.abs(col - qc)) { // draw line to the attacker
          ctx.strokeStyle = css('--bad'); ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(qc * c + c / 2, q * c + c / 2); ctx.lineTo(col * c + c / 2, row * c + c / 2); ctx.stroke(); break;
        }
      }
    }
    ctx.font = Math.floor(c * .75) + 'px "Segoe UI Symbol","Apple Symbols",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < n; r++) if (shown[r] >= 0) {
      const x = shown[r] * c + c / 2, y = r * c + c / 2 + c * .04;
      ctx.lineWidth = 3; ctx.strokeStyle = css('--halo'); ctx.strokeText('♛', x, y);
      ctx.fillStyle = css('--queen'); ctx.fillText('♛', x, y);
    }
    if (s.last && s.last.kind === 'place' && !s.showSol) {
      ctx.strokeStyle = css('--ok'); ctx.lineWidth = 3; ctx.strokeRect(s.last.col * c + 2, s.last.row * c + 2, c - 4, c - 4);
    }
    if (full) { ctx.strokeStyle = css('--ok'); ctx.lineWidth = 5; ctx.strokeRect(2.5, 2.5, n * c - 5, n * c - 5); }
  }

  function addSolution(cols) {
    s.sols.push(cols);
    const k = NQueens.canonical(cols);
    if (!s.seen.has(k)) { s.seen.add(k); s.uniq.push(cols); }
    s.dirty = true;
  }

  function apply(ev) {
    const st = s.stats;
    if (ev.type === 'place') {
      s.cols[ev.row] = ev.col; s.trying = null; s.last = { ...ev, kind: 'place' }; st.placements++;
      log(`Row ${ev.row + 1}: placed queen in column ${ev.col + 1}`);
    } else if (ev.type === 'conflict') {
      s.trying = ev; st.conflicts++;
      log(`Row ${ev.row + 1}: column ${ev.col + 1} is attacked, skip`);
    } else if (ev.type === 'remove') {
      s.cols[ev.row] = -1; s.trying = null; s.last = { ...ev, kind: 'remove' }; st.backtracks++;
      log(`Backtrack: removed queen from row ${ev.row + 1}, column ${ev.col + 1}`);
    } else if (ev.type === 'solution') {
      addSolution(ev.cols);
      log(`Solution #${s.sols.length} found!`);
      s.hold = performance.now() + ($('speed').value < 85 ? 600 : 0);
    }
  }

  function advance() {
    const r = s.gen.next();
    if (r.done) {
      s.gen = null; s.finished = true; s.running = false; s.trying = null; s.dirty = true;
      const ok = s.sols.length === NQueens.KNOWN[s.n];
      status(`Done: ${s.sols.length} solutions` + (ok ? ' ✓ matches known value' : ''));
      log('Search complete: every branch has been explored.');
    } else apply(r.value);
  }

  function init() {
    if (s.gen) return;
    if (s.sols.length || s.finished) reset();
    s.showSol = false; s.gen = NQueens.backtrack(s.n);
  }

  function start() {
    init(); s.running = true; s.lastT = performance.now(); s.acc = 0; status('Running…');
    requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!s.running) return;
    if (now >= s.hold) {
      const sps = $('speed').value ** 2 * 1.5 + 2;
      s.acc += Math.min(now - s.lastT, 100) * sps / 1000;
      let k = Math.floor(s.acc); s.acc -= k;
      while (k-- > 0 && s.running && s.gen) { advance(); if (performance.now() < s.hold) break; }
    }
    s.lastT = now;
    status(); draw();
    if (s.dirty && (now - s.lastGal > 250 || !s.running)) { renderGallery(); s.lastGal = now; }
    if (s.running) requestAnimationFrame(tick); else { renderGallery(); }
  }

  function solveInstant() {
    reset();
    const r = NQueens.solveAll(s.n);
    for (const c of r.solutions) addSolution(c);
    s.stats = r.stats; s.finished = true;
    const ok = s.sols.length === NQueens.KNOWN[s.n];
    status(`Done: ${s.sols.length} solutions` + (ok ? ' ✓ matches known value' : ''));
    log(`Backtracking explored the whole search tree for N = ${s.n}.`);
    if (s.sols.length) select(0); else { draw(); renderGallery(); }
  }

  // ---- gallery & selection ----
  function thumb(cv, sol) {
    const n = sol.length, c = Math.max(4, Math.floor(108 / n)), size = c * n, d = window.devicePixelRatio || 1;
    cv.width = cv.height = size * d; cv.style.width = cv.style.height = size + 'px';
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
      g.fillStyle = (r + k) % 2 ? css('--sq2') : css('--sq1'); g.fillRect(k * c, r * c, c, c);
    }
    g.fillStyle = css('--queen');
    sol.forEach((col, r) => { g.beginPath(); g.arc(col * c + c / 2, r * c + c / 2, c * .36, 0, 7); g.fill(); });
  }

  function renderGallery() {
    s.dirty = false;
    const v = view(), g = $('gallery'), pages = Math.max(1, Math.ceil(v.length / PAGE));
    s.page = Math.min(s.page, pages - 1); g.textContent = '';
    if (!v.length) g.textContent = 'No solutions yet. Run the visualization or press ⚡ Find all solutions.';
    for (let i = s.page * PAGE; i < Math.min(v.length, (s.page + 1) * PAGE); i++) {
      const fig = document.createElement('figure'), cv = document.createElement('canvas');
      thumb(cv, v[i]); cv.className = 'thumb' + (s.showSol && i === s.sel ? ' sel' : '');
      cv.onclick = () => select(i);
      fig.append(cv, '#' + (i + 1)); g.append(fig);
    }
    $('pageLabel').textContent = `Page ${s.page + 1} / ${pages} · ${v.length} solutions`;
  }

  function select(i) {
    const v = view(); if (!v.length) return;
    if (s.running) { s.running = false; }
    s.sel = i; s.showSol = true; s.page = Math.floor(i / PAGE);
    $('solLabel').textContent = `Solution ${i + 1} of ${v.length}: ` + v[i].map((c) => c + 1).join(' ');
    draw(); renderGallery();
  }
  const move = (d) => { const v = view(); if (v.length) select((s.sel + d + v.length) % v.length); };
  function stopPlay() { clearInterval(s.timer); s.timer = null; $('play').textContent = '▶ Play all'; }

  // ---- events ----
  $('start').onclick = start;
  $('pause').onclick = () => { s.running = false; status('Paused'); };
  $('step').onclick = () => { s.running = false; init(); if (s.gen) advance(); status(); draw(); renderGallery(); };
  $('reset').onclick = reset;
  $('solveAll').onclick = solveInstant;
  $('prev').onclick = () => move(-1);
  $('next').onclick = () => move(1);
  $('play').onclick = () => {
    if (s.timer) return stopPlay();
    if (!view().length) return;
    $('play').textContent = '⏸ Stop'; s.timer = setInterval(() => move(1), 700);
  };
  $('gPrev').onclick = () => { s.page = Math.max(0, s.page - 1); renderGallery(); };
  $('gNext').onclick = () => { s.page++; renderGallery(); };
  $('n').oninput = reset;
  $('unique').onchange = () => { s.sel = -1; s.showSol = false; s.page = 0; renderGallery(); draw(); };
  window.addEventListener('resize', resize);
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { draw(); renderGallery(); });
  reset();
})();
