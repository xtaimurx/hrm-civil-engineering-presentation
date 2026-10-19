/* v7 Engine:
   1. Persistent .pane-media primitive per pane that physically moves, crops,
      and resizes across states via Motion.animate (no static img swaps).
   2. Every pane stays populated on the canvas at all times (zero empty dark
      boxes during the opening zoom-out, cross-pane flights, or State 32 finale).
   3. Pre-zeroed single-run entrance animations (zero 100 -> 0 -> 100 double
      transition jank).
   4. Noticeable 3D parallax + perspective tilt on the active pane.
   5. State 31 = Spire Finale with feats side note; State 32 = Full-Canvas
      Empire State Building & glowing golden conduit network finale.
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

  // Flat cursor: one entry per (pane, state). Total = 32 states.
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

  const canAnimate = () => !instantMode && !reduced && !!window.Motion;

  // Declarative media primitive keyframes per pane & state:
  // { left, top, width, height, pos, scale, imgOpacity, scrimOpacity, subRect }
  const MEDIA_STATES = {
    3: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 26%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.22 },
      { left: 84, top: 176, width: 1432, height: 424, pos: "50% 34%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.08 },
    ],
    4: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "30% 42%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.30 },
      { left: 0, top: 0, width: 720, height: 900, pos: "30% 40%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10 },
    ],
    5: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 38%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.30 },
      { left: 0, top: 0, width: 440, height: 900, pos: "38% 36%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.12 },
      { left: 1160, top: 0, width: 440, height: 900, pos: "46% 36%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.12 },
    ],
    6: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 8%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.28 },
      { left: 912, top: 0, width: 688, height: 900, pos: "46% 12%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10 },
    ],
    7: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "30% 32%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.30 },
      { left: 60, top: 40, width: 1480, height: 108, pos: "30% 38%", scale: 1.0, imgOpacity: 0.96, scrimOpacity: 0.18 },
      { left: 60, top: 40, width: 1480, height: 108, pos: "65% 46%", scale: 1.06, imgOpacity: 0.96, scrimOpacity: 0.18 },
    ],
    8: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 28%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.32 },
      { left: 0, top: 0, width: 430, height: 900, pos: "46% 28%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10 },
    ],
    9: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 52%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.34 },
      { left: 0, top: 0, width: 608, height: 900, pos: "48% 52%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.12 },
    ],
    10: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 24%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.32 },
      { left: 0, top: 0, width: 440, height: 900, pos: "36% 24%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.12 },
      { left: 1160, top: 0, width: 440, height: 900, pos: "64% 24%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.12 },
    ],
    11: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "62% 40%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.28 },
      { left: 920, top: 0, width: 680, height: 900, pos: "68% 42%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10 },
    ],
    12: [
      {
        left: 0, top: 0, width: 1600, height: 900, pos: "58% 42%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.30,
        sub: { left: 0, top: 900, width: 592, height: 324, opacity: 0 },
      },
      {
        left: 0, top: 0, width: 592, height: 576, pos: "58% 42%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10,
        sub: { left: 0, top: 576, width: 592, height: 324, opacity: 1 },
      },
    ],
    13: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 28%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.32 },
      { left: 0, top: 0, width: 440, height: 900, pos: "32% 28%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.12 },
      { left: 1160, top: 0, width: 440, height: 900, pos: "72% 28%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.12 },
    ],
    14: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 36%", scale: 1.04, imgOpacity: 1.0, scrimOpacity: 0.24 },
      { left: 900, top: 0, width: 700, height: 900, pos: "52% 38%", scale: 1.0, imgOpacity: 1.0, scrimOpacity: 0.10 },
    ],
    15: [
      { left: 0, top: 0, width: 1600, height: 900, pos: "50% 0%", scale: 1.04, imgOpacity: 0.92, scrimOpacity: 0.32 },
    ],
  };

  function fitScale(w, h, fill) {
    return Math.min((viewport.clientWidth * fill) / w, (viewport.clientHeight * fill) / h);
  }

  function introTarget() {
    return { x: 4800, y: 3800, s: viewport.clientHeight / 2000 };
  }

  function spireTarget() {
    // Frame the upper third of the tower so the mast and setbacks read in context
    // (a tight crop on the spire alone just looks like a grey blob).
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

  // Build callout beams + glowing pulse overlays from the tower to each pane
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

    SCENES.forEach((s) => {
      if (s.id === 1 || s.isCanvasFinale) return;
      const el = document.createElement("section");
      el.className = "scene";
      el.id = "scene-" + s.id;
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";

      // 1. Persistent media primitive (always rendered, physically morphed across states)
      let mediaHtml = `
        <div class="pane-media" data-depth="bg">
          <img class="pane-img kb" src="${s.image}" alt="" />
          <div class="pane-scrim"></div>
        </div>`;
      if (s.image2) {
        mediaHtml += `
          <div class="pane-media-sub" data-depth="bg">
            <img class="pane-sub-img" src="${s.image2}" alt="" />
          </div>`;
      }

      // 2. State copy layers (State 0 starts with .is-on so the canvas is 100% populated!)
      const n = s.states || 1;
      let layersHtml = "";
      for (let k = 0; k < n; k++) {
        const fn = window.SCENE_RENDER && window.SCENE_RENDER[s.id];
        const onClass = k === 0 ? " is-on" : "";
        layersHtml += `<div class="state-layer${onClass}" data-state="${k}">${fn ? fn(s, k) : ""}</div>`;
      }

      el.innerHTML = mediaHtml + layersHtml;
      scenesLayer.appendChild(el);
      sceneEls[s.id] = el;
      applyMediaState(s.id, 0, false);
    });
  }

  // Physically morph a pane's persistent .pane-media box & image crop
  function applyMediaState(paneId, st, animate) {
    const el = sceneEls[paneId];
    const table = MEDIA_STATES[paneId];
    if (!el || !table) return;
    const cfg = table[Math.min(st, table.length - 1)];
    const mediaBox = el.querySelector(".pane-media");
    const img = el.querySelector(".pane-img");
    const scrim = el.querySelector(".pane-scrim");
    const subBox = el.querySelector(".pane-media-sub");
    if (!mediaBox || !img) return;

    // Only run continuous Ken Burns drift on full-bleed covers (state 0)
    img.classList.toggle("kb", st === 0);
    img.style.objectPosition = cfg.pos || "50% 50%";

    const boxProps = {
      left: cfg.left + "px",
      top: cfg.top + "px",
      width: cfg.width + "px",
      height: cfg.height + "px",
    };
    const imgProps = {
      opacity: cfg.imgOpacity !== undefined ? cfg.imgOpacity : 1,
      transform: `scale(${cfg.scale || 1})`,
    };
    const dur = animate && canAnimate() ? 0.88 : 0;

    if (dur === 0) {
      Object.assign(mediaBox.style, boxProps);
      img.style.opacity = String(imgProps.opacity);
      img.style.transform = imgProps.transform;
      if (scrim) scrim.style.opacity = String(cfg.scrimOpacity ?? 0.3);
      if (subBox && cfg.sub) {
        Object.assign(subBox.style, {
          left: cfg.sub.left + "px",
          top: cfg.sub.top + "px",
          width: cfg.sub.width + "px",
          height: cfg.sub.height + "px",
          opacity: String(cfg.sub.opacity),
        });
      }
      return;
    }

    window.Motion.animate(mediaBox, boxProps, { duration: dur, ease: [0.22, 1, 0.36, 1] });
    window.Motion.animate(img, imgProps, { duration: dur, ease: [0.22, 1, 0.36, 1] });
    if (scrim) {
      window.Motion.animate(scrim, { opacity: cfg.scrimOpacity ?? 0.3 }, { duration: dur });
    }
    if (subBox && cfg.sub) {
      window.Motion.animate(
        subBox,
        {
          left: cfg.sub.left + "px",
          top: cfg.sub.top + "px",
          width: cfg.sub.width + "px",
          height: cfg.sub.height + "px",
          opacity: cfg.sub.opacity,
        },
        { duration: dur, ease: [0.22, 1, 0.36, 1] }
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

  // -- Zero-jank single-pass item animations ----------------------------------
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
    // Synchronously zero before animating so there is NEVER a 100 -> 0 -> 100 flash
    items.forEach((item) => {
      item.dataset.anim = "1";
      item.style.opacity = "0";
      item.style.transform = "translateY(24px)";
    });
    items.forEach((item, i) => {
      window.Motion.animate(
        item,
        { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        { duration: 0.56, delay: 0.06 + i * 0.065, ease: [0.22, 1, 0.36, 1] }
      );
    });
    setTimeout(() => items.forEach((item) => delete item.dataset.anim), 700 + items.length * 70);
  }

  // -- Hook pane (Pane 1, States 0 & 1) ---------------------------------------
  function setHookState(st, animate, id) {
    const toReveal = st === 1;
    const incoming = toReveal ? hookR : hookQ;
    const outgoing = toReveal ? hookQ : hookR;
    const dur = animate && canAnimate() ? 0.88 : 0;
    const photoTo = toReveal
      ? { left: "68px", top: "68px", width: "610px", height: "764px" }
      : { left: "0px", top: "0px", width: "1600px", height: "900px" };

    // Keep layer containers at opacity 1; animate the .anim-item children directly
    // so parent opacity never fights child cascade!
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
    window.Motion.animate(hookPhoto, photoTo, { duration: dur, ease: [0.22, 1, 0.36, 1] });
    window.Motion.animate(hookShade, { opacity: toReveal ? 0.18 : 1 }, { duration: dur });

    setTimeout(() => {
      if (id !== seq) return;
      cascadeItems(incoming);
    }, 240);
  }

  // Initialize Hook in State 0 visible so the opening canvas zoom-out shows it cleanly
  setHookState(0, false, 0);

  // -- Generic pane state transition (Panes 3..15) ----------------------------
  function activatePane(paneId, st, opts, id) {
    if (paneId === 1) {
      setHookState(st, !!opts.morph && !opts.instant, id);
      return;
    }
    const el = sceneEls[paneId];
    if (!el) return;

    // 1. Physically move/resize the persistent .pane-media primitive
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
      // Same-pane state transition:
      // Pre-zero incoming items BEFORE adding .is-on so they never flash at 100%!
      preZeroItems(nxt);
      nxt.style.opacity = "1";
      nxt.classList.add("is-on");

      // Fade out outgoing layer cleanly
      window.Motion.animate(cur, { opacity: [1, 0] }, {
        duration: 0.22,
        onComplete: () => {
          cur.classList.remove("is-on");
          cur.style.opacity = "";
        },
      });

      // Cascade incoming items once from 0 -> 1
      setTimeout(() => {
        if (id !== seq) return;
        cascadeItems(nxt);
      }, 140);
    } else {
      // Landing on this pane: cascade its active state items once from 0 -> 1
      layers.forEach((l) => {
        if (l !== nxt) l.classList.remove("is-on");
      });
      preZeroItems(nxt);
      nxt.style.opacity = "1";
      nxt.classList.add("is-on");
      cascadeItems(nxt);
    }
  }

  // -- Callout beam -----------------------------------------------------------
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
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (activeBeam.style.strokeDashoffset = String(v)),
    });
  }

  // -- Camera flight ----------------------------------------------------------
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

  // -- Navigation -------------------------------------------------------------
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

    // Clear active border/tilt on previous pane, set on target pane.
    // NEVER blank or strip .is-on from any pane on the canvas!
    Object.entries(sceneEls).forEach(([pid, el]) => {
      const isTgt = tgt && +pid === tgt.pane;
      el.classList.toggle("is-active", !!isTgt);
      if (!isTgt) el.style.transform = "";
    });

    counterEl.textContent = next === -1 ? "Start" : `${next + 1} / ${FLAT.length}`;
    history.replaceState(null, "", next === -1 ? location.pathname + location.search : `#${next + 1}`);

    // State 32: Full-Canvas Illuminated Overview Finale
    if (isCanvasFinale) {
      activeBeam.setAttribute("d", "");
      if (!canAnimate() || opts.instant) {
        applyCam(canvasTarget());
      } else {
        flyTo(canvasTarget(), 2.1);
        playWhoosh();
      }
      return;
    }

    if (samePane) {
      // In-place state morph on the same pane: photo glides/resizes + items cascade once
      activatePane(tgt.pane, tgt.state, { morph: true, instant: opts.instant }, id);
      drawBeam(byId[tgt.pane]);
      return;
    }

    // Cross-pane flight: prepare the incoming pane's media state before landing,
    // and pre-zero its text items so the photo is visible during flight and text
    // cascades in cleanly once the camera lands!
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

  // -- Noticeable 3D Parallax + Perspective Tilt ------------------------------
  const px = { x: 0, y: 0, tx: 0, ty: 0, blend: 1 };
  const depthCur = new WeakMap();

  window.addEventListener("mousemove", (e) => {
    px.tx = e.clientX / window.innerWidth - 0.5;
    px.ty = e.clientY / window.innerHeight - 0.5;
  });

  function parallaxTick() {
    requestAnimationFrame(parallaxTick);
    if (!canAnimate()) return;
    const flying = document.body.classList.contains("is-flying");
    px.x += (px.tx - px.x) * 0.08;
    px.y += (px.ty - px.y) * 0.08;
    const goal = flying ? 0 : 1;
    px.blend += (goal - px.blend) * 0.12;
    if (px.blend < 0.01) return;
    const active = document.querySelector(".scene.is-active");
    if (!active) return;
    const ox = px.x; // -0.5 .. +0.5
    const oy = px.y;
    active.querySelectorAll("[data-depth]").forEach((el) => {
      if (el.dataset.anim) return;
      const f = { bg: 28, mid: 52, fg: 84 }[el.dataset.depth] || 36;
      const tx = Math.max(-48, Math.min(48, -ox * f * px.blend));
      const ty = Math.max(-36, Math.min(36, -oy * f * px.blend));
      let cur = depthCur.get(el);
      if (!cur) {
        cur = { x: 0, y: 0 };
        depthCur.set(el, cur);
      }
      cur.x += (tx - cur.x) * 0.18;
      cur.y += (ty - cur.y) * 0.18;
      el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
    });
    const rx = (-oy * 4.2 * px.blend).toFixed(3);
    const ry = (ox * 4.2 * px.blend).toFixed(3);
    active.style.transform = `perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
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

  // -- Ambient audio ----------------------------------------------------------
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

  const startHash = parseInt(location.hash.replace("#", ""), 10);
  if (Number.isFinite(startHash) && startHash >= 1) {
    introPlayed = true;
    goTo(startHash - 1, { instant: true });
  } else {
    applyCam(introTarget());
  }
})();
