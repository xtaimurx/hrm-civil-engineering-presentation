/* v8 Engine.
   Performance notes (this rewrite exists because v7 hitched):
   - Media morphs use clip-path, never width/height/left/top. Animating layout
     properties forced a full re-layout and re-raster of a 1600x900 image on
     every frame. clip-path is composited.
   - will-change is scoped to the active pane only. v7 promoted 13 large media
     layers plus ~100 depth elements at once, which is what made the camera
     flights stutter.
   - Ken Burns runs on the active cover only, not on all 13 covers at once.
   - The parallax driver caches its element list per activation instead of
     querying the DOM every frame.

   Structure:
   - 15 panes, 32 states. Every pane keeps one persistent .pane-media box.
   - All panes stay populated, so canvas zooms show real photography.
   - Entrances animate once from zero: items are zeroed before their layer is
     revealed.
*/
(function () {
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG" && !t.dataset.fbk) {
      t.dataset.fbk = "1";
      t.src = "assets/beam_lunch.jpg";
    }
  }, true);

  const SCENES = window.SCENES.filter((s) => s.id !== 2);
  const byId = {};
  SCENES.forEach((s) => (byId[s.id] = s));

  const FLAT = [];
  SCENES.forEach((s) => {
    const n = s.states || 1;
    for (let k = 0; k < n; k++) FLAT.push({ pane: s.id, state: k });
  });

  const world = document.getElementById("world");
  const viewport = document.getElementById("viewport");
  const scenesLayer = document.getElementById("scenes-layer");
  const calloutGroup = document.getElementById("callout-lines");
  const activeBeam = document.getElementById("active-beam");
  const counterEl = document.getElementById("scene-counter");
  const soundBtn = document.getElementById("btn-sound");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const instantMode = location.search.includes("instant");
  const svgNS = "http://www.w3.org/2000/svg";
  const sceneEls = {};
  const paneOrder = [];

  const canAnimate = () => !instantMode && !reduced && !!window.Motion;
  const lerp = (a, b, t) => a + (b - a) * t;
  const CLIP_EASE = [0.22, 1, 0.36, 1];

  /* Media keyframes per pane and state.
     clip = [top, right, bottom, left] inset in px on a fixed 1600x900 box.
     imgX/imgY/imgScale reframe the photograph inside that window.
     scrim = 0..1 darkening applied over the photo.
     sub  = optional second still (P12 only), same clip convention. */
  const MEDIA_STATES = {
    3: [
      { clip: [0, 0, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.22 },
      { clip: [176, 84, 300, 84], imgScale: 1.04, imgX: -30, imgY: -40, scrim: 0.08 },
    ],
    4: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.30 },
      { clip: [0, 880, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    5: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.30 },
      { clip: [0, 1160, 0, 0], imgScale: 1.12, imgX: 120, imgY: 0, scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.2, imgX: -140, imgY: 0, scrim: 0.12 },
    ],
    6: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.28 },
      { clip: [0, 0, 0, 912], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    7: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "30% 34%", scrim: 0.30 },
      { clip: [40, 60, 752, 60], imgScale: 1.0, imgX: 0, imgY: -470, pos: "50% 0%", scrim: 0.16 },
      { clip: [52, 150, 744, 150], imgScale: 1.06, imgX: 0, imgY: -478, pos: "50% 0%", scrim: 0.16 },
    ],
    8: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.32 },
      { clip: [0, 1170, 0, 0], imgScale: 1, imgX: 0, imgY: 0, pos: "50% 30%", scrim: 0.10 },
    ],
    9: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.34 },
      { clip: [0, 992, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.12 },
    ],
    10: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.32 },
      { clip: [0, 1160, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.06, imgX: 0, imgY: 0, scrim: 0.12 },
    ],
    11: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.28 },
      { clip: [0, 0, 0, 920], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    12: [
      {
        clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.30,
        sub: { clip: [576, 1008, 0, 0], opacity: 0 },
      },
      {
        clip: [0, 1008, 324, 0], imgScale: 1, imgX: 0, imgY: 0, pos: "50% 40%", scrim: 0.10,
        sub: { clip: [576, 1008, 0, 0], opacity: 1 },
      },
    ],
    13: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.32 },
      { clip: [0, 1160, 0, 0], imgScale: 1.14, imgX: 60, imgY: 0, pos: "30% 30%", scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.22, imgX: -80, imgY: 0, pos: "70% 30%", scrim: 0.12 },
    ],
    14: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, scrim: 0.24 },
      { clip: [0, 0, 0, 900], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    15: [{ clip: [0, 0, 0, 0], imgScale: 1.0, imgX: 0, imgY: 0, pos: "50% 0%", scrim: 0.32 }],
  };

  function fitScale(w, h, fill) {
    return Math.min((viewport.clientWidth * fill) / w, (viewport.clientHeight * fill) / h);
  }

  function introTarget() {
    return { x: 4800, y: 3800, s: viewport.clientHeight / 2000 };
  }

  function spireTarget() {
    return { x: 4800, y: 2250, s: viewport.clientHeight / 2900 };
  }

  function canvasTarget() {
    return { x: 4800, y: 1400, s: fitScale(9000, 11000, 0.92) };
  }

  function paneTarget(paneId) {
    const s = byId[paneId];
    if (s.isCanvasFinale) return canvasTarget();
    return { x: s.x, y: s.y, s: fitScale(1600, 900, 0.9) };
  }

  SCENES.forEach((s) => {
    if (s.isCanvasFinale) return;
    const towerX = s.x < 4800 ? 3500 : s.x > 4800 ? 6100 : 4800;
    const anchorY = s.id === 15 ? 450 : Math.max(700, Math.min(4600, s.y));
    const midX = (towerX + s.x) / 2;
    s._beamPath =
      s.x === 4800
        ? `M 4800 ${s.id === 15 ? 450 : 4675} L 4800 ${s.y}`
        : `M ${towerX} ${anchorY} L ${midX} ${anchorY} L ${s.x} ${s.y}`;

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", s._beamPath);
    path.setAttribute("class", "callout-base");
    calloutGroup.appendChild(path);

    const pulse = document.createElementNS(svgNS, "path");
    pulse.setAttribute("d", s._beamPath);
    pulse.setAttribute("class", "callout-pulse");
    calloutGroup.appendChild(pulse);

    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", towerX);
    dot.setAttribute("cy", anchorY);
    dot.setAttribute("r", 18);
    dot.setAttribute("class", "anchor-node");
    calloutGroup.appendChild(dot);
  });

  function buildScenes() {
    const s1 = byId[1];
    const s2 = window.SCENES.find((s) => s.id === 2);
    const morphEl = document.createElement("section");
    morphEl.className = "scene";
    morphEl.id = "scene-1";
    morphEl.style.left = s1.x + "px";
    morphEl.style.top = s1.y + "px";
    morphEl.innerHTML = window.HOOK_HTML(s1, s2);
    scenesLayer.appendChild(morphEl);
    sceneEls[1] = morphEl;
    paneOrder.push(1);

    SCENES.forEach((s) => {
      if (s.id === 1 || s.isCanvasFinale) return;
      const el = document.createElement("section");
      el.className = "scene";
      el.id = "scene-" + s.id;
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";

      let mediaHtml = `
        <div class="pane-media" data-depth="bg">
          <div class="pane-frame"><img class="pane-img" src="${s.image}" alt="" /></div>
          <div class="pane-scrim"></div>
        </div>`;
      if (s.image2) {
        mediaHtml += `
          <div class="pane-media-sub" data-depth="bg">
            <div class="pane-frame"><img class="pane-sub-img" src="${s.image2}" alt="" /></div>
          </div>`;
      }

      const n = s.states || 1;
      let layersHtml = "";
      for (let k = 0; k < n; k++) {
        const fn = window.SCENE_RENDER && window.SCENE_RENDER[s.id];
        const onClass = k === 0 ? " is-on" : "";
        // The pane's photograph is owned by the persistent .pane-media primitive.
        // Drop any duplicate <img> the slide renderer emitted: it would decode
        // the file a second time and carry a stray Ken Burns animation.
        const inner = fn ? fn(s, k).replace(/<img[^>]*>/g, "") : "";
        layersHtml += `<div class="state-layer${onClass}" data-state="${k}">${inner}</div>`;
      }

      el.innerHTML = mediaHtml + layersHtml;
      scenesLayer.appendChild(el);
      sceneEls[s.id] = el;
      paneOrder.push(s.id);
      applyMediaState(s.id, 0, false);
    });
  }

  // Morph the persistent media window. Uses clip-path only, so no layout work
  // happens per frame.
  function applyMediaState(paneId, st, animate) {
    const el = sceneEls[paneId];
    const table = MEDIA_STATES[paneId];
    if (!el || !table) return;
    const cfg = table[Math.min(st, table.length - 1)];
    const box = el.querySelector(".pane-media");
    const img = el.querySelector(".pane-img");
    const scrim = el.querySelector(".pane-scrim");
    const sub = el.querySelector(".pane-media-sub");
    if (!box || !img) return;

    const setClip = (c) => {
      box.style.clipPath = `inset(${c[0]}px ${c[1]}px ${c[2]}px ${c[3]}px)`;
      box.dataset.clip = c.join(",");
    };
    const from = box.dataset.clip ? box.dataset.clip.split(",").map(Number) : table[0].clip;
    const to = cfg.clip;
    const dur = animate && canAnimate() ? 0.88 : 0;

    if (cfg.pos) img.style.objectPosition = cfg.pos;

    if (dur === 0) {
      setClip(to);
      img.style.transform = `translate(${cfg.imgX || 0}px, ${cfg.imgY || 0}px) scale(${cfg.imgScale || 1})`;
      if (scrim) scrim.style.opacity = String(cfg.scrim ?? 0.3);
      if (sub && cfg.sub) {
        sub.style.clipPath = `inset(${cfg.sub.clip[0]}px ${cfg.sub.clip[1]}px ${cfg.sub.clip[2]}px ${cfg.sub.clip[3]}px)`;
        sub.style.opacity = String(cfg.sub.opacity);
      }
      return;
    }

    window.Motion.animate(0, 1, {
      duration: dur,
      ease: CLIP_EASE,
      onUpdate: (t) => {
        const c = from.map((v, i) => lerp(v, to[i], t));
        box.style.clipPath = `inset(${c[0]}px ${c[1]}px ${c[2]}px ${c[3]}px)`;
      },
      onComplete: () => setClip(to),
    });
    window.Motion.animate(
      img,
      {
        x: cfg.imgX || 0,
        y: cfg.imgY || 0,
        scale: cfg.imgScale || 1,
      },
      { duration: dur, ease: CLIP_EASE }
    );
    if (scrim) {
      window.Motion.animate(scrim, { opacity: cfg.scrim ?? 0.3 }, { duration: dur });
    }
    if (sub && cfg.sub) {
      window.Motion.animate(
        sub,
        {
          opacity: cfg.sub.opacity,
          clipPath: `inset(${cfg.sub.clip[0]}px ${cfg.sub.clip[1]}px ${cfg.sub.clip[2]}px ${cfg.sub.clip[3]}px)`,
        },
        { duration: dur, ease: CLIP_EASE }
      );
    }
  }

  buildScenes();

  const hookPhoto = document.getElementById("hook-photo");
  const hookShade = document.getElementById("hook-shade");
  const hookQ = document.getElementById("hook-q");
  const hookR = document.getElementById("hook-r");

  let cam = { x: 4800, y: 3800, s: 0.45 };
  let camAnim = null;
  let current = -1;
  let seq = 0;
  let introPlayed = false;

  function applyCam(c) {
    cam = c;
    world.style.transform =
      `translate3d(${viewport.clientWidth / 2}px, ${viewport.clientHeight / 2}px, 0) ` +
      `scale(${c.s}) translate3d(${-c.x}px, ${-c.y}px, 0)`;
  }

  function preZeroItems(root) {
    if (!root) return;
    root.querySelectorAll(".anim-item").forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(24px)";
    });
  }

  function showItemsInstant(root) {
    if (!root) return;
    root.querySelectorAll(".anim-item").forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "translateY(0px)";
    });
  }

  function cascadeItems(root) {
    if (!root) return;
    const items = Array.from(root.querySelectorAll(".anim-item"));
    if (!canAnimate()) {
      showItemsInstant(root);
      return;
    }
    items.forEach((item) => {
      item.dataset.anim = "1";
      item.style.opacity = "0";
      item.style.transform = "translateY(24px)";
    });
    items.forEach((item, i) => {
      window.Motion.animate(
        item,
        { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        { duration: 0.56, delay: 0.06 + i * 0.065, ease: CLIP_EASE }
      );
    });
    setTimeout(() => items.forEach((item) => delete item.dataset.anim), 700 + items.length * 70);
  }

  // Ken Burns only on the pane that is actually on camera.
  function updateKenBurns(activePaneId) {
    paneOrder.forEach((pid) => {
      const el = sceneEls[pid];
      if (!el) return;
      const frame = el.querySelector(".pane-frame");
      if (!frame) return;
      frame.classList.toggle("kb", pid === activePaneId);
    });
  }

  function setHookState(st, animate, id) {
    const toReveal = st === 1;
    const incoming = toReveal ? hookR : hookQ;
    const outgoing = toReveal ? hookQ : hookR;
    const dur = animate && canAnimate() ? 0.88 : 0;
    const photoTo = toReveal
      ? { left: "68px", top: "68px", width: "610px", height: "764px" }
      : { left: "0px", top: "0px", width: "1600px", height: "900px" };

    hookQ.style.opacity = toReveal ? "0" : "1";
    hookR.style.opacity = toReveal ? "1" : "0";
    hookQ.style.pointerEvents = toReveal ? "none" : "auto";
    hookR.style.pointerEvents = toReveal ? "auto" : "none";

    if (dur === 0) {
      Object.assign(hookPhoto.style, photoTo);
      hookShade.style.opacity = toReveal ? "0.18" : "1";
      preZeroItems(outgoing);
      showItemsInstant(incoming);
      return;
    }

    preZeroItems(incoming);
    window.Motion.animate(hookPhoto, photoTo, { duration: dur, ease: CLIP_EASE });
    window.Motion.animate(hookShade, { opacity: toReveal ? 0.18 : 1 }, { duration: dur });
    setTimeout(() => {
      if (id !== seq) return;
      cascadeItems(incoming);
    }, 240);
  }

  setHookState(0, false, 0);

  function activatePane(paneId, st, opts, id) {
    if (paneId === 1) {
      setHookState(st, !!opts.morph && !opts.instant, id);
      return;
    }
    const el = sceneEls[paneId];
    if (!el) return;

    applyMediaState(paneId, st, !!opts.morph && !opts.instant);

    const layers = el.querySelectorAll(".state-layer");
    const nxt = layers[st];
    if (!nxt) return;
    const cur = el.querySelector(".state-layer.is-on");

    if (!canAnimate() || opts.instant) {
      layers.forEach((l) => {
        l.classList.remove("is-on");
        l.style.opacity = "";
      });
      nxt.classList.add("is-on");
      showItemsInstant(nxt);
      return;
    }

    if (cur && cur !== nxt) {
      preZeroItems(nxt);
      nxt.style.opacity = "1";
      nxt.classList.add("is-on");
      window.Motion.animate(cur, { opacity: [1, 0] }, {
        duration: 0.22,
        onComplete: () => {
          cur.classList.remove("is-on");
          cur.style.opacity = "";
        },
      });
      setTimeout(() => {
        if (id !== seq) return;
        cascadeItems(nxt);
      }, 140);
    } else {
      layers.forEach((l) => {
        if (l !== nxt) l.classList.remove("is-on");
      });
      preZeroItems(nxt);
      nxt.style.opacity = "1";
      nxt.classList.add("is-on");
      cascadeItems(nxt);
    }
  }

  // Reset every pane to its cover state. Used by the canvas finale so the
  // overview reads as a wall of photography instead of text boxes.
  function resetAllToCovers(animate) {
    paneOrder.forEach((pid) => {
      if (pid === 1) return;
      const el = sceneEls[pid];
      if (!el) return;
      applyMediaState(pid, 0, animate);
      const layers = el.querySelectorAll(".state-layer");
      layers.forEach((l, i) => {
        l.classList.toggle("is-on", i === 0);
        l.style.opacity = "";
      });
      if (animate && canAnimate()) {
        const l0 = layers[0];
        preZeroItems(l0);
        cascadeItems(l0);
      }
    });
  }

  let beamAnim = null;
  function drawBeam(scene) {
    const d = scene && scene._beamPath ? scene._beamPath : "";
    activeBeam.setAttribute("d", d);
    if (!d || !canAnimate()) return;
    const len = activeBeam.getTotalLength();
    activeBeam.style.strokeDasharray = `${len} ${len}`;
    if (beamAnim) beamAnim.stop();
    beamAnim = window.Motion.animate(len, 0, {
      duration: 1.1,
      ease: CLIP_EASE,
      onUpdate: (v) => (activeBeam.style.strokeDashoffset = String(v)),
    });
  }

  let bowFlip = 1;
  function flyTo(to, dur, onDone) {
    if (camAnim) camAnim.stop();
    camAnim = null;
    const from = { ...cam };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const nx = dist > 0 ? -dy / dist : 0;
    const ny = dist > 0 ? dx / dist : 0;
    const bow = Math.min(dist * 0.07, 420) * bowFlip;
    bowFlip *= -1;
    const mx = from.x + dx / 2 + nx * bow;
    const my = from.y + dy / 2 + ny * bow;
    const dip = dist > 600 ? 0.12 : 0;
    const ls0 = Math.log(from.s);
    const ls1 = Math.log(to.s);
    document.body.classList.add("is-flying");
    camAnim = window.Motion.animate(0, 1, {
      duration: dur,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (t) => {
        const u = 1 - t;
        applyCam({
          x: u * u * from.x + 2 * u * t * mx + t * t * to.x,
          y: u * u * from.y + 2 * u * t * my + t * t * to.y,
          s: Math.exp(ls0 + (ls1 - ls0) * t - dip * Math.sin(Math.PI * t)),
        });
      },
      onComplete: () => {
        camAnim = null;
        setTimeout(() => document.body.classList.remove("is-flying"), 320);
        if (onDone) onDone();
      },
    });
  }

  function introSequence(id, target, done) {
    const alive = () => id === seq;
    flyTo(spireTarget(), 2.6, () => {
      if (!alive()) return;
      setTimeout(() => {
        if (!alive()) return;
        flyTo(canvasTarget(), 1.7, () => {
          if (!alive()) return;
          setTimeout(() => {
            if (alive()) flyTo(target, 1.8, done);
          }, 800);
        });
      }, 1500);
    });
  }

  function goTo(fi, opts = {}) {
    const next = Math.max(-1, Math.min(FLAT.length - 1, fi));
    if (next === current && !opts.force) return;
    const prev = current;
    current = next;
    const id = ++seq;

    const tgt = next >= 0 ? FLAT[next] : null;
    const prv = prev >= 0 ? FLAT[prev] : null;
    const samePane = !!(prv && tgt && prv.pane === tgt.pane);
    const isCanvasFinale = !!(tgt && byId[tgt.pane] && byId[tgt.pane].isCanvasFinale);

    document.body.classList.toggle("is-canvas-finale", isCanvasFinale);

    Object.entries(sceneEls).forEach(([pid, el]) => {
      const isTgt = tgt && +pid === tgt.pane;
      el.classList.toggle("is-active", !!isTgt);
      if (!isTgt) el.style.transform = "";
    });
    setActivePane(tgt && tgt.pane !== 1 ? tgt.pane : null);

    counterEl.textContent = next === -1 ? "Start" : `${next + 1} / ${FLAT.length}`;
    history.replaceState(null, "", next === -1 ? location.pathname + location.search : `#${next + 1}`);

    // State 32: the full illuminated canvas. Every pane drops back to its
    // cover so the overview reads as photography, not as text panels.
    if (isCanvasFinale) {
      activeBeam.setAttribute("d", "");
      resetAllToCovers(false);
      updateKenBurns(null);
      if (!canAnimate() || opts.instant) {
        applyCam(canvasTarget());
      } else {
        flyTo(canvasTarget(), 2.1);
        playWhoosh();
      }
      return;
    }

    updateKenBurns(tgt ? tgt.pane : null);

    if (samePane) {
      activatePane(tgt.pane, tgt.state, { morph: true, instant: opts.instant }, id);
      drawBeam(byId[tgt.pane]);
      return;
    }

    if (tgt) {
      if (tgt.pane === 1) {
        Object.assign(
          hookPhoto.style,
          tgt.state === 1
            ? { left: "68px", top: "68px", width: "610px", height: "764px" }
            : { left: "0px", top: "0px", width: "1600px", height: "900px" }
        );
        hookShade.style.opacity = tgt.state === 1 ? "0.18" : "1";
        hookQ.style.opacity = tgt.state === 1 ? "0" : "1";
        hookR.style.opacity = tgt.state === 1 ? "1" : "0";
        if (!opts.instant && canAnimate()) {
          preZeroItems(tgt.state === 1 ? hookR : hookQ);
        }
      } else {
        applyMediaState(tgt.pane, tgt.state, false);
        const el = sceneEls[tgt.pane];
        if (el) {
          const layers = el.querySelectorAll(".state-layer");
          layers.forEach((l, idx) => l.classList.toggle("is-on", idx === tgt.state));
          if (!opts.instant && canAnimate()) {
            preZeroItems(layers[tgt.state]);
          }
        }
      }
    }

    const landed = () => {
      if (id !== seq) return;
      if (tgt) {
        if (tgt.pane === 1) {
          const layer = tgt.state === 1 ? hookR : hookQ;
          if (!canAnimate() || opts.instant) showItemsInstant(layer);
          else cascadeItems(layer);
        } else {
          const el = sceneEls[tgt.pane];
          const layer = el && el.querySelectorAll(".state-layer")[tgt.state];
          if (!canAnimate() || opts.instant) showItemsInstant(layer);
          else cascadeItems(layer);
        }
        drawBeam(byId[tgt.pane]);
      }
    };

    const target = next === -1 ? introTarget() : paneTarget(tgt.pane);
    const runIntro =
      prev === -1 &&
      tgt &&
      tgt.pane === 1 &&
      tgt.state === 0 &&
      !introPlayed &&
      canAnimate() &&
      !opts.instant;

    if (runIntro) {
      introPlayed = true;
      introSequence(id, target, landed);
    } else if (!canAnimate() || opts.instant) {
      if (camAnim) camAnim.stop();
      camAnim = null;
      applyCam(target);
      landed();
    } else {
      flyTo(target, 1.3, landed);
    }
    if (!opts.instant && tgt) playWhoosh();
  }

  // ---- Parallax driver: cached element list, idle when the mouse is still ----
  const px = { x: 0, y: 0, tx: 0, ty: 0, blend: 1, moved: false };
  const depthCur = new WeakMap();
  let depthEls = [];
  let activePane = null;
  let lastActive = null;

  function cacheDepthEls() {
    const el = activePane ? sceneEls[activePane] : null;
    depthEls = el ? Array.from(el.querySelectorAll("[data-depth]")) : [];
  }

  window.addEventListener("mousemove", (e) => {
    px.tx = e.clientX / window.innerWidth - 0.5;
    px.ty = e.clientY / window.innerHeight - 0.5;
    px.moved = true;
  });

  function parallaxTick() {
    requestAnimationFrame(parallaxTick);
    if (!canAnimate()) return;
    const flying = document.body.classList.contains("is-flying");
    if (flying) {
      px.blend += (0 - px.blend) * 0.16;
    } else if (px.moved) {
      px.x += (px.tx - px.x) * 0.08;
      px.y += (px.ty - px.y) * 0.08;
      px.blend += (1 - px.blend) * 0.12;
    }
    if (px.blend < 0.01) return;
    if (!activePane) return;

    for (let i = 0; i < depthEls.length; i++) {
      const el = depthEls[i];
      if (el.dataset.anim) continue;
      const f = { bg: 28, mid: 52, fg: 84 }[el.dataset.depth] || 36;
      const tx = Math.max(-48, Math.min(48, -px.x * f * px.blend));
      const ty = Math.max(-36, Math.min(36, -px.y * f * px.blend));
      let cur = depthCur.get(el);
      if (!cur) {
        cur = { x: 0, y: 0 };
        depthCur.set(el, cur);
      }
      cur.x += (tx - cur.x) * 0.18;
      cur.y += (ty - cur.y) * 0.18;
      el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
    }
    const rx = (-px.y * 4.2 * px.blend).toFixed(3);
    const ry = (px.x * 4.2 * px.blend).toFixed(3);
    const el = sceneEls[activePane];
    if (el) el.style.transform = `perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  if (!instantMode && !reduced) requestAnimationFrame(parallaxTick);

  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (["ArrowRight", " ", "PageDown", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      goTo(current + 1);
    } else if (["ArrowLeft", "PageUp", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "h" || e.key === "H") {
      document.body.classList.toggle("hide-hud");
    } else if (e.key === "m" || e.key === "M") {
      toggleSound();
    }
  });

  document.getElementById("btn-prev").addEventListener("click", () => goTo(current - 1));
  document.getElementById("btn-next").addEventListener("click", () => goTo(current + 1));

  window.addEventListener("resize", () => {
    applyCam(current === -1 ? introTarget() : paneTarget(FLAT[current].pane));
  });

  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.replace("#", ""), 10);
    if (Number.isFinite(n) && n >= 1) goTo(n - 1, { instant: true });
  });

  let audioCtx = null;
  let soundOn = false;
  let masterGain = null;

  function toggleSound() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 240;
      filter.connect(masterGain);
      [55, 82.5, 110].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = f;
        g.gain.value = 0.14 / (i + 1);
        osc.connect(g);
        g.connect(filter);
        osc.start();
      });
    }
    soundOn = !soundOn;
    if (audioCtx.state === "suspended") audioCtx.resume();
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(soundOn ? 0.5 : 0, audioCtx.currentTime + 0.4);
    soundBtn.textContent = soundOn ? "Sound: On (M)" : "Sound: Off (M)";
    soundBtn.classList.toggle("active", soundOn);
  }

  function playWhoosh() {
    if (!audioCtx || !soundOn) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.45);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  soundBtn.addEventListener("click", toggleSound);

  // Decode every photograph up front. A JPEG decode landing mid-transition is a
  // classic source of first-press stutter on a deployed site.
  function warmImages() {
    const imgs = Array.from(document.images);
    let pending = imgs.length;
    const done = () => { pending -= 1; if (pending <= 0) document.body.classList.add("images-ready"); };
    imgs.forEach((img) => {
      if (img.complete) { done(); return; }
      if (img.decode) {
        img.decode().then(done).catch(done);
      } else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
  }
  warmImages();

  const startHash = parseInt(location.hash.replace("#", ""), 10);
  if (Number.isFinite(startHash) && startHash >= 1) {
    introPlayed = true;
    goTo(startHash - 1, { instant: true });
  } else {
    applyCam(introTarget());
  }

  // Keep the parallax cache in step with the active pane.
  function setActivePane(id) {
    if (id === lastActive) return;
    lastActive = id;
    activePane = id;
    cacheDepthEls();
  }
})();
