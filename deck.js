/* HRM deck v7 · Dusk Ascent
   Camera model: panes and the tower live in one virtual world, but nothing is a
   world-sized layer. Each visible element gets  camera ∘ own offset  as its
   transform, so the GPU only ever moves the tower plus one or two panes. */
(function () {
  const S = window.SCENES, X = window.EXTRAS;
  const byId = Object.fromEntries(S.map((s) => [s.id, s]));
  const img = (p) => p.replace("assets/", "img/");
  const thumb = (p) => p.replace("assets/", "img/thumbs/");
  const d = (n) => `style="--d:${n}"`;

  /* ───────── renderers: each returns the HTML for every state of a pane ───────── */
  const cover = (s) => `<div class="k in">${s.kicker}</div><h2 class="in" ${d(1)}>${s.title}</h2>`;
  const head = (s, count) => `<div class="k in">${s.kicker}</div><h2 class="in" ${d(1)}>${s.title}</h2>${count ? `<div class="count in" ${d(2)}>${count}</div>` : ""}`;
  const card = (k, o) => { if (o.tag && /^\d\d$/.test(o.tag)) o = Object.assign({}, o, { num: o.tag, tag: "" }); return cardHtml(k, o); };
  const cardHtml = (k, o) => `<div class="card in ${o.cls || ""}" ${d(k)}>${o.num ? `<div class="num">${o.num}</div>` : ""}${o.tag ? `<div class="tag">${o.tag}</div>` : ""}<h3>${o.head}</h3><p>${o.body}</p></div>`;

  const R = {
    hook(q, r) {
      return [
        { html: `<div class="k in">${q.kicker}</div><h1 class="in" ${d(1)}>${q.title}</h1><p class="dek in" ${d(2)}>${q.subtitle}</p>
          <div class="who in" ${d(3)}>Presented by <b>${X.presenters.join("</b> · <b>")}</b></div>` },
        { html: `<div class="k in">${r.kicker}</div>
          <div class="five-row in" ${d(1)}><div class="five">${r.bigNumber}</div><div class="five-note">${X.hookAnswerNote}</div></div>
          <h2 class="in" ${d(2)}>${r.title}</h2><p class="dek in" ${d(3)}>${r.subtitle}</p>
          <div class="metrics in" ${d(4)}>${r.metrics.map((m) => `<div><b>${m.val}</b><span>${m.label}</span></div>`).join("")}</div>` }
      ];
    },
    "cinema-title"(s) {
      const refs = s.id === 14;
      return [
        { cover: true, html: cover(s) },
        { html: `${head(s)}<p class="dek in" ${d(2)}>${s.subtitle}</p>
          <div class="grid g3 ${refs ? "refs" : ""}">${s.pillars.map((p, i) => card(i + 3, { num: refs ? "" : "0" + (i + 1), head: p.head, body: p.body })).join("")}</div>` }
      ];
    },
    "split-editorial"(s) {
      let body;
      if (s.id === 9) {
        body = `<div class="grid g3">${s.cards.slice(0, 3).map((c, i) => card(i + 3, c)).join("")}${card(6, Object.assign({ cls: "hi wide" }, s.cards[3]))}</div>`;
      } else if (s.id === 12) {
        body = `<div class="chips in" ${d(3)}>${X.pakistanChips.map((c) => `<span>${c}</span>`).join("")}</div>
          <div class="grid g2" style="margin-top:30px;gap:26px 44px">${s.cards.map((c, i) => card(i + 4, c)).join("")}</div>`;
      } else {
        body = `<div class="grid ${s.cards.length === 3 ? "g3" : "g2"}">${s.cards.map((c, i) => card(i + 3, c)).join("")}</div>`;
      }
      return [{ cover: true, html: cover(s) }, { html: `${head(s)}<p class="dek in" ${d(2)}>${s.subtitle}</p>${body}` }];
    },
    "matrix-8"(s) {
      const set = (a, b, k) => ({ html: `${head(s, X.functionsCount[k])}<div class="grid g2" style="margin-top:48px">${s.items.slice(a, b).map((it, i) => card(i + 3, { num: it.num, head: it.name, body: it.desc })).join("")}</div>` });
      return [{ cover: true, html: cover(s) }, set(0, 4, 0), set(4, 8, 1)];
    },
    "lifecycle-7"(s) {
      const node = (g, i) => `<div class="node in" ${d(i + 3)}><div class="num">${g.num}</div><h3>${g.name}</h3><p>${g.desc}</p></div>`;
      return [
        { cover: true, html: cover(s) },
        { html: `${head(s, X.stagesCount[0])}<div class="track" style="grid-template-columns:repeat(4,1fr)">${s.stages.slice(0, 4).map(node).join("")}</div>` },
        { html: `${head(s, X.stagesCount[1])}
          <div class="done-stages in" ${d(3)}>${s.stages.slice(0, 4).map((g) => `<span><i>${g.num}</i>${g.name}</span>`).join("")}</div>
          <div class="track" style="grid-template-columns:repeat(3,1fr);margin-top:44px">${s.stages.slice(4).map((g, i) => node(g, i + 1)).join("")}</div>` }
      ];
    },
    "pillars-5"(s) {
      return [
        { cover: true, html: cover(s) },
        { html: `${head(s)}<div class="rows ledger" style="margin-top:44px">${s.pillars.map((p, i) => `<div class="row in" ${d(i + 2)}><div class="num">0${i + 1}</div><div class="metric">${p.metric}</div><h3>${p.title}</h3><p>${p.desc}</p></div>`).join("")}</div>` }
      ];
    },
    "challenges-7"(s) {
      const c = (it, i, cls) => card(i + 3, { num: it.num, head: it.name, body: it.fix, cls });
      return [
        { cover: true, html: cover(s) },
        { html: `${head(s, X.challengesCount[0])}<div class="grid g2" style="margin-top:48px">${s.challenges.slice(0, 4).map((it, i) => c(it, i)).join("")}</div>` },
        { html: `${head(s, X.challengesCount[1])}<div class="grid g2" style="margin-top:48px">${s.challenges.slice(4).map((it, i) => c(it, i)).join("")}${c(X.challengesTakeaway, 3, "hi")}</div>` }
      ];
    },
    "recs-10"(s) {
      const set = (a, k) => ({ html: `${head(s, X.recsCount[k])}<div class="rows" style="margin-top:40px">${s.recs.slice(a, a + 5).map((r, i) => `<div class="row in" ${d(i + 3)}><div class="num">${String(a + i + 1).padStart(2, "0")}</div><p>${r}</p></div>`).join("")}</div>` });
      return [{ cover: true, html: cover(s) }, set(0, 0), set(5, 1)];
    },
    finale(s) {
      return [{ html: `<div class="fin"><div class="k in">${s.kicker}</div><h1 class="in" ${d(1)}>${s.title}</h1>
        <aside class="feats in" ${d(3)}><h3>${X.feats.head}</h3><ul>${X.feats.items.map((t) => `<li>${t}</li>`).join("")}</ul></aside></div>` }];
    }
  };

  /* ───────── world layout ───────── */
  const TOWER_CX = 1615;            // world x of the tower's centreline
  const STEP = 520, PANE_W = 1240, PANE_H = 960;
  const order = [[1, 2], 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const panes = order.map((ids, k) => {
    const s = Array.isArray(ids) ? byId[ids[0]] : byId[ids];
    const left = k % 2 === 0;
    const states = Array.isArray(ids) ? R.hook(byId[1], byId[2]) : R[s.type](s);
    const x = left ? 100 : 1890, y = 1100 + (order.length - 1 - k) * STEP;
    return { k, s, left, states, x, y, image: Array.isArray(ids) ? null : img(s.image), thumb: thumb(s.image),
      cam: { cx: left ? x + 960 - 60 : x + PANE_W - 960 + 60, cy: y + PANE_H / 2, s: 1 },
      floor: Math.round(1 + (k * 101) / order.length) };
  });
  const fin = byId[15];
  panes.push({ k: panes.length, s: fin, left: true, bare: true, states: R.finale(fin), x: 100, y: 120, image: null,
    cam: { cx: 1000, cy: 540, s: 1 }, floor: 102 });

  const WORLD_TOP = 540, WORLD_BOT = panes[0].cam.cy;
  const towerCam = (c) => c.tower || { cx: c.cx, cy: 540 + ((c.cy - WORLD_TOP) / (WORLD_BOT - WORLD_TOP)) * (2600 - 1080), s: 1 };
  const OVERVIEW = { overview: true, cx: TOWER_CX, cy: 540, s: 1, tower: { cx: TOWER_CX, cy: 1300, s: 1080 / 2600 }, floor: 102 };

  /* ───────── build DOM ───────── */
  const stage = document.getElementById("stage"), host = document.getElementById("panes"), towerEl = document.getElementById("tower");
  towerEl.style.left = "0px";
  const TOWER_IMG_X = TOWER_CX - 715;   // the building's axis sits 715px into the photo
  panes.forEach((p) => {
    const el = document.createElement("section");
    el.className = "pane" + (p.bare ? " bare" : "");
    el.innerHTML = (p.image ? `<div class="ph"><img src="${p.image}" alt="" style="object-position:${p.s.id === 8 ? "50% 30%" : "50% 40%"}"></div><div class="shade"></div>` : "") +
      p.states.map((st) => `<div class="st${st.cover ? " cover" : ""}">${st.html}</div>`).join("");
    host.appendChild(el);
    p.el = el; p.layers = [...el.querySelectorAll(".st")];
  });

  // overview: mini cards zig-zag up the tower, the same order as the climb
  const ov = document.getElementById("ov");
  document.getElementById("ovK").textContent = byId[16].kicker;
  document.getElementById("ovT").textContent = byId[16].title;
  panes.slice(0, order.length).forEach((p) => {
    const r = Math.floor(p.k / 2), y = p.left ? 900 - r * 136 : 900 - 68 - r * 136;
    const x = p.left ? 230 : 1360;
    const label = p.k === 0 ? byId[1].kicker : p.s.title;
    ov.insertAdjacentHTML("beforeend",
      `<div class="mc" style="left:${x}px;top:${y}px;--d:${p.k}"><img src="${p.k === 0 ? "img/thumbs/icarus.jpg" : p.thumb}" alt=""><div><b>${String(p.k + 1).padStart(2, "0")}</b>${label}</div></div>` +
      `<div class="lead" style="left:${p.left ? 560 : 1095}px;top:${y + 59}px;width:265px;--d:${p.k};${p.left ? "" : "transform:scaleX(-1);transform-origin:50% 0"}"></div>`);
  });

  /* ───────── states ───────── */
  const STATES = [];
  panes.forEach((p) => p.states.forEach((_, i) => STATES.push({ pane: p, st: i })));
  STATES.push(OVERVIEW);

  const camT = (c) => `translate(${960 - c.cx * c.s}px,${540 - c.cy * c.s}px) scale(${c.s})`;
  const paneT = (c, p) => `${camT(c)} translate(${p.x}px,${p.y}px)`;
  const towT = (c) => { const t = towerCam(c); return `${camT(t)} translate(${TOWER_IMG_X}px,0px)`; };

  let cam = null, live = [], cur = null, timers = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setLayer(p, i) {
    p.layers.forEach((l, k) => l.classList.toggle("on", k === i));
    p.el.classList.toggle("at-cover", !!p.states[i].cover);
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function fly(to, els, instant) {
    live.forEach((a) => a.finish()); live = [];
    const from = cam || to;
    const ms = instant || reduce ? 0 : 1450;
    const far = !instant && Math.hypot(from.cx - to.cx, from.cy - to.cy) > 50;
    const mid = { cx: (from.cx + to.cx) / 2, cy: (from.cy + to.cy) / 2, s: 0.8 };
    const midT = { tower: { cx: mid.cx, cy: (towerCam(from).cy + towerCam(to).cy) / 2, s: Math.min(towerCam(from).s, towerCam(to).s) * 0.92 } };
    const opts = { duration: ms, easing: "cubic-bezier(.55,0,.25,1)" };
    const go = (el, a, m, b) => {
      el.style.transform = b;
      if (ms) live.push(el.animate(far && m ? [{ transform: a }, { transform: m, offset: 0.5 }, { transform: b }] : [{ transform: a }, { transform: b }], opts));
    };
    go(towerEl, towT(from), towT(Object.assign({}, mid, midT)), towT(to));
    els.forEach((p) => go(p.el, paneT(from, p), to.overview || from.overview ? null : paneT(mid, p), paneT(to.overview ? from : to, p)));
    cam = to;
    return ms;
  }

  let floorRaf;
  function countFloor(to) {
    const el = document.getElementById("floor"), from = +el.textContent, t0 = performance.now();
    cancelAnimationFrame(floorRaf);
    (function tick(n) { const q = Math.min(1, (n - t0) / 1300); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - q, 3))); if (q < 1) floorRaf = requestAnimationFrame(tick); })(t0);
  }

  function go(i, instant) {
    const T = STATES[i], prev = cur; cur = T;
    clearTimers();
    document.getElementById("counter").textContent = `${i + 1} / ${STATES.length}`;
    history.replaceState(null, "", "#" + (i + 1));
    stage.classList.toggle("ov", !!T.overview);
    stage.classList.toggle("lit", T.overview || T.pane === panes[panes.length - 1]);
    countFloor(T.overview ? 102 : T.pane.floor);

    const prevPane = prev && !prev.overview ? prev.pane : null;
    if (T.overview) {
      if (prevPane) { prevPane.el.classList.remove("on"); later(() => prevPane.el.classList.remove("vis"), 600); }
      fly(OVERVIEW, [], instant);
      return;
    }
    const p = T.pane;
    if (prevPane === p) { setLayer(p, T.st); return; }   // same pane: crossfade in place

    // new pane: show its layer immediately (items wait for .on), fly, then reveal
    p.layers.forEach((l) => l.classList.remove("on"));
    p.el.classList.toggle("at-cover", !!p.states[T.st].cover);
    p.el.classList.add("vis");
    panes.forEach((q) => { if (q !== p && q !== prevPane) q.el.classList.remove("vis", "on"); });
    const ms = fly(p.cam, prevPane ? [p, prevPane] : [p], instant || (prev && prev.overview && false));
    if (prevPane) { prevPane.el.classList.remove("on"); later(() => prevPane.el.classList.remove("vis"), ms + 50); }
    requestAnimationFrame(() => p.el.classList.add("on"));
    later(() => setLayer(p, T.st), ms ? ms * 0.72 : 0);
  }

  /* ───────── input ───────── */
  let idx = 0;
  const step = (n) => { n = Math.max(0, Math.min(STATES.length - 1, n)); if (n !== idx) { idx = n; go(idx); } };
  addEventListener("keydown", (e) => {
    if (e.repeat && !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) { e.preventDefault(); step(idx + 1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); step(idx - 1); }
    else if (e.key === "Home") step(0);
    else if (e.key === "End") step(STATES.length - 1);
    else if (e.key === "h" || e.key === "H") stage.classList.toggle("nohud");
    else if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  addEventListener("mousedown", (e) => { if (e.button === 0) step(idx + 1); });
  addEventListener("contextmenu", (e) => { e.preventDefault(); step(idx - 1); });
  addEventListener("hashchange", () => { const n = parseInt(location.hash.slice(1), 10) - 1; if (n >= 0 && n < STATES.length && n !== idx) { idx = n; go(idx, true); } });

  function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `translate(-50%,-50%) scale(${k})`; }
  addEventListener("resize", fit); fit();

  /* ───────── boot: decode every image first so no flight ever waits on one ───────── */
  const urls = ["img/tower.jpg", ...panes.filter((p) => p.image).map((p) => p.image), ...[...ov.querySelectorAll("img")].map((i) => i.getAttribute("src"))];
  Promise.all([document.fonts.ready, ...urls.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); })]).then(() => {
    const n = parseInt(location.hash.slice(1), 10) - 1;
    idx = n >= 0 && n < STATES.length ? n : 0;
    go(idx, true);
    requestAnimationFrame(() => stage.classList.add("ready"));
  });
  window.__deck = { STATES, go: (n) => { idx = n; go(n, true); } };
})();
