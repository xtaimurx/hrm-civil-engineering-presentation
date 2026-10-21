/* v9 Engine.

   Structural changes over v8:
   - One continuous canvas built around a dominant Empire State Building.
     Panes overlap the tower's faces and every pane is wired to the building
     with a conduit that runs out from the building's core.
   - Connectors are HTML elements, not SVG. v8 used a world-sized SVG with
     drop-shadow filters on animated strokes: Chrome re-rasterised the
     filtered surface every frame, which dropped the canvas finale to
     3.7fps and made the dashes shimmer as flickering boxes. HTML with
     transforms only stays on the compositor.
   - The tower is three depth layers inside a perspective container, so it
     responds to the cursor instead of being a flat poster.
   - Transitions route through the tower: pull back, dwell on the building,
     then settle into the target pane.
   - Photographs are decoded before the show starts, and the canvas finale
     swaps in low-resolution thumbnails so the overview does not force a
     full-resolution rasterisation burst.
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

  /* ---- Canvas geometry (Option B: panes overlap the tower's faces) ---- */
  const GEO = {
    worldW: 8200,
    worldH: 9000,
    towerX: 2100,          // tower left edge
    towerW: 4000,          // 4000 / 6500 = 0.6154, matches the 985x1600 source
    towerTop: 1400,
    towerH: 6500,
    axisX: 4100,           // tower centreline, the conduit spine
    paneLeftX: 1700,       // left pane centres, overlapping the tower's face
    paneRightX: 6500,
    hookX: 4100,
    hookY: 8400,
    finX: 4100,
    finY: 500,
    rows: [7000, 5900, 4800, 3700, 2600, 1500],
    rowPitch: 1150,
  };
  const TOWER_BOTTOM = GEO.towerTop + GEO.towerH;

  const world = document.getElementById("world");
  const viewport = document.getElementById("viewport");
  const scenesLayer = document.getElementById("scenes-layer");
  const connLayer = document.getElementById("conn-layer");
  const counterEl = document.getElementById("scene-counter");
  const soundBtn = document.getElementById("btn-sound");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const instantMode = location.search.includes("instant");
  const sceneEls = {};
  const paneOrder = [];
  const connEls = {};
  const liveAnims = new Map();

  const canAnimate = () => !instantMode && !reduced && !!window.Motion;
  const lerp = (a, b, t) => a + (b - a) * t;
  const EASE = [0.22, 1, 0.36, 1];

  const MEDIA_STATES = {
    3: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 18%", scrim: 0.22 },
      { clip: [224, 84, 236, 84], imgScale: 1.04, imgX: -30, imgY: -40, scrim: 0.08 },
    ],
    4: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "30% 42%", scrim: 0.30 },
      { clip: [0, 880, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    5: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 38%", scrim: 0.30 },
      { clip: [0, 1160, 0, 0], imgScale: 1.12, imgX: 120, imgY: 0, scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.2, imgX: -140, imgY: 0, scrim: 0.12 },
    ],
    6: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 8%", scrim: 0.28 },
      { clip: [0, 0, 0, 912], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    7: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "30% 34%", scrim: 0.30 },
      { clip: [40, 60, 752, 60], imgScale: 1.0, imgX: 0, imgY: -470, pos: "50% 0%", scrim: 0.16 },
      { clip: [52, 150, 744, 150], imgScale: 1.06, imgX: 0, imgY: -478, pos: "50% 0%", scrim: 0.16 },
    ],
    8: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "65% 20%", scrim: 0.32 },
      { clip: [0, 1170, 0, 0], imgScale: 1.08, imgX: -680, imgY: 0, pos: "50% 30%", scrim: 0.10 },
    ],
    9: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 52%", scrim: 0.34 },
      { clip: [0, 992, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.12 },
    ],
    10: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 24%", scrim: 0.32 },
      { clip: [0, 1160, 0, 0], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.06, imgX: 0, imgY: 0, scrim: 0.12 },
    ],
    11: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "62% 40%", scrim: 0.28 },
      { clip: [0, 0, 0, 920], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    12: [
      {
        clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "58% 42%", scrim: 0.30,
        sub: { clip: [0, 0, 0, 0], opacity: 0 },
      },
      {
        // Proof state: the bridge photo fills the whole left rail.
        clip: [0, 1008, 0, 0], imgScale: 1, imgX: 0, imgY: 0, pos: "58% 42%", scrim: 0.10,
        sub: { clip: [0, 0, 0, 0], opacity: 0 },
      },
    ],
    13: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 28%", scrim: 0.32 },
      { clip: [0, 1160, 0, 0], imgScale: 1.14, imgX: 60, imgY: 0, pos: "30% 30%", scrim: 0.12 },
      { clip: [0, 0, 0, 1160], imgScale: 1.22, imgX: -80, imgY: 0, pos: "70% 30%", scrim: 0.12 },
    ],
    14: [
      { clip: [0, 0, 0, 0], imgScale: 1.04, imgX: 0, imgY: 0, pos: "50% 36%", scrim: 0.24 },
      { clip: [0, 0, 0, 900], imgScale: 1, imgX: 0, imgY: 0, scrim: 0.10 },
    ],
    15: [{ clip: [0, 0, 0, 0], imgScale: 1.0, imgX: 0, imgY: 0, pos: "50% 0%", scrim: 0.32 }],
  };

  function fitScale(w, h, fill) {
    return Math.min((viewport.clientWidth * fill) / w, (viewport.clientHeight * fill) / h);
  }

  function introTarget() {
    // Base of the building, seen from street level.
    return { x: GEO.axisX, y: TOWER_BOTTOM + 650, s: viewport.clientHeight / 1900 };
  }

  function spireTarget() {
    // The mast and the upper setbacks.
    return { x: GEO.axisX, y: GEO.towerTop + 1000, s: viewport.clientHeight / 2400 };
  }

  function canvasTarget() {
    // The whole canvas: building plus every pane. Framed on the content
    // bounds (the panes that overlap the tower) rather than the world box.
    return { x: GEO.axisX, y: 4500, s: fitScale(6600, 8000, 1.0) };
  }

  function paneTarget(paneId) {
    const s = byId[paneId];
    if (s.isCanvasFinale) return canvasTarget();
    return { x: s.x, y: s.y, s: fitScale(1600, 900, 0.9) };
  }

  /* ---- Connector geometry ---- */
  function connFor(paneId) {
    const s = byId[paneId];
    if (paneId === 1) {
      return { x1: GEO.axisX, x2: GEO.axisX, y: GEO.hookY, vertical: true, len: 900 };
    }
    if (paneId === 15) {
      return { x1: GEO.axisX, x2: GEO.axisX, y: GEO.finY, vertical: true, len: 800 };
    }
    const y = s.y;
    const left = s.x < GEO.axisX;
    const x1 = GEO.axisX;
    const x2 = left ? s.x - 800 : s.x + 800;
    return { x1, x2, y, vertical: false, len: Math.abs(x2 - x1) };
  }

  function buildConnectors() {
    // Central spine running the full height of the building. Offset by half
    // its own width so its centreline sits exactly on the tower axis.
    const spine = document.createElement("div");
    spine.className = "conn-spine";
    spine.style.left = GEO.axisX - 4 + "px";
    spine.style.top = GEO.finY + "px";
    spine.style.height = GEO.hookY - GEO.finY + "px";
    connLayer.appendChild(spine);

    const spineHi = document.createElement("div");
    spineHi.className = "conn-spine-hi";
    spineHi.style.left = GEO.axisX - 4 + "px";
    spineHi.style.top = GEO.finY + "px";
    connLayer.appendChild(spineHi);
    connEls.spine = spineHi;

    paneOrder.concat([15]).forEach((pid) => {
      const c = connFor(pid);
      const el = document.createElement("div");
      el.className = "conn-branch";
      if (c.vertical) {
        el.style.left = c.x1 + "px";
        el.style.top = c.y + "px";
        el.style.width = "6px";
        el.style.height = c.len + "px";
      } else {
        el.style.left = Math.min(c.x1, c.x2) + "px";
        el.style.top = c.y - 3 + "px";
        el.style.width = c.len + "px";
        el.style.height = "6px";
      }
      connLayer.appendChild(el);

      const hi = document.createElement("div");
      hi.className = "conn-hi";
      hi.dataset.pane = pid;
      if (c.vertical) {
        hi.style.left = c.x1 + "px";
        hi.style.top = c.y + "px";
      } else {
        hi.style.left = Math.min(c.x1, c.x2) + "px";
        hi.style.top = c.y - 3 + "px";
      }
      connLayer.appendChild(hi);
      // Where the traveller starts, measured from its anchor.
      c.startOffset = c.vertical ? 0 : c.x1 - Math.min(c.x1, c.x2);
      c.endOffset = c.vertical ? c.len : c.x2 - Math.min(c.x1, c.x2);
      connEls[pid] = hi;

      const node = document.createElement("div");
      node.className = "conn-node";
      node.style.left = c.x1 + "px";
      node.style.top = c.y + "px";
      connLayer.appendChild(node);
    });
  }

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

      const thumb = s.image.replace("assets/", "assets/thumbs/");
      let mediaHtml = `
        <div class="pane-media" data-depth="bg">
          <div class="pane-frame">
            <img class="pane-img" src="${s.image}" alt="" />
            <img class="pane-thumb" src="${thumb}" alt="" />
          </div>
          <div class="pane-scrim"></div>
        </div>`;
      if (s.image2) {
        const subThumb = s.image2.replace("assets/", "assets/thumbs/");
        mediaHtml += `
          <div class="pane-media-sub" data-depth="bg">
            <div class="pane-frame">
              <img class="pane-sub-img" src="${s.image2}" alt="" />
              <img class="pane-sub-thumb" src="${subThumb}" alt="" />
            </div>
          </div>`;
      }

      const n = s.states || 1;
      let layersHtml = "";
      for (let k = 0; k < n; k++) {
        const fn = window.SCENE_RENDER && window.SCENE_RENDER[s.id];
        const onClass = k === 0 ? " is-on" : "";
        const inner = fn ? fn(s, k).replace(/<img[^>]*>/g, "") : "";
        layersHtml += `<div class="state-layer${onClass}" data-state="${k}">${inner}</div>`;
      }

      el.innerHTML = mediaHtml + layersHtml;
      scenesLayer.appendChild(el);
      sceneEls[s.id] = el;
      paneOrder.push(s.id);
      applyMediaState(s.id, 0, false);
    });

    // The hook pane keeps its own photograph; give it a thumbnail too.
    const hookImg = document.querySelector("#hook-photo img");
    if (hookImg) {
      const t = document.createElement("img");
      t.className = "pane-thumb hook-thumb";
      t.src = hookImg.src.replace("assets/", "assets/thumbs/");
      hookImg.parentNode.insertBefore(t, hookImg.nextSibling);
    }
  }

  function stopAnim(key) {
    const a = liveAnims.get(key);
    if (a) {
      a.stop();
      liveAnims.delete(key);
    }
  }

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
      stopAnim("clip" + paneId);
      stopAnim("img" + paneId);
      setClip(to);
      img.style.transform = `translate(${cfg.imgX || 0}px, ${cfg.imgY || 0}px) scale(${cfg.imgScale || 1})`;
      if (scrim) scrim.style.opacity = String(cfg.scrim ?? 0.3);
      if (sub && cfg.sub) {
        sub.style.clipPath = `inset(${cfg.sub.clip[0]}px ${cfg.sub.clip[1]}px ${cfg.sub.clip[2]}px ${cfg.sub.clip[3]}px)`;
        sub.style.opacity = String(cfg.sub.opacity);
      }
      return;
    }

    stopAnim("clip" + paneId);
    stopAnim("img" + paneId);
    const a1 = window.Motion.animate(0, 1, {
      duration: dur,
      ease: EASE,
      onUpdate: (t) => {
        const c = from.map((v, i) => lerp(v, to[i], t));
        box.style.clipPath = `inset(${c[0]}px ${c[1]}px ${c[2]}px ${c[3]}px)`;
      },
      onComplete: () => setClip(to),
    });
    liveAnims.set("clip" + paneId, a1);
    const a2 = window.Motion.animate(
      img,
      { x: cfg.imgX || 0, y: cfg.imgY || 0, scale: cfg.imgScale || 1 },
      { duration: dur, ease: EASE }
    );
    liveAnims.set("img" + paneId, a2);
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
        { duration: dur, ease: EASE }
      );
    }
  }

  buildScenes();
  buildConnectors();

  const hookPhoto = document.getElementById("hook-photo");
  const hookShade = document.getElementById("hook-shade");
  const hookQ = document.getElementById("hook-q");
  const hookR = document.getElementById("hook-r");

  let cam = { x: GEO.axisX, y: TOWER_BOTTOM + 650, s: 0.46 };
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
      // Mark it as owned by the cascade so the parallax driver leaves it alone.
      item.dataset.anim = "1";
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
      item.style.opacity = "0";
      item.style.transform = "translateY(24px)";
    });
    items.forEach((item, i) => {
      window.Motion.animate(
        item,
        { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        { duration: 0.56, delay: 0.06 + i * 0.065, ease: EASE }
      );
    });
    setTimeout(() => {
      items.forEach((item) => delete item.dataset.anim);
      // hand the element back to the parallax driver
      items.forEach((item) => (item.style.transform = ""));
    }, 700 + items.length * 70);
  }

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
    window.Motion.animate(hookPhoto, photoTo, { duration: dur, ease: EASE });
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
    });
  }

  /* ---- Connector highlight: a short bright segment that travels the conduit ---- */
  let pulseTimer = null;
  const CONCURRENT = 2;
  function pulseConnectors() {
    if (!canAnimate()) return;
    const branches = Object.keys(connEls).filter((k) => k !== "spine");
    let i = 0;
    const step = () => {
      // Light several conduits at once, staggered, so the whole network
      // reads as carrying power rather than one dot crawling.
      for (let n = 0; n < CONCURRENT; n++) {
        const key = branches[(i + n) % branches.length];
        const el = connEls[key];
        if (!el) continue;
        const c = connFor(+key);
        const dist = c.len;
        el.style.opacity = "0";
        el.style.transform = "translateX(0)";
        window.Motion.animate(
          0,
          1,
          {
            duration: c.vertical ? 2.0 : 1.5,
            delay: n * 0.16,
            ease: "easeInOut",
            onUpdate: (t) => {
              // One animation drives both the travel and the fade envelope,
              // so the two never fight over the same property.
              el.style.opacity = String(Math.sin(Math.PI * Math.min(1, t * 1.08)));
              const off = c.startOffset + (c.endOffset - c.startOffset) * t;
              if (c.vertical) {
                el.style.transform = `translateY(${off}px)`;
              } else {
                el.style.transform = `translateX(${off}px)`;
              }
            },
            onComplete: () => {
              el.style.opacity = "0";
              el.style.transform = "translateX(0)";
            },
          }
        );
      }
      i += 1;
    };
    step();
    pulseTimer = setInterval(step, 2600);
  }

  function stopPulses() {
    if (pulseTimer) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
    Object.values(connEls).forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateX(0)";
      }
    });
  }

  function highlightPaneConn(paneId) {
    Object.entries(connEls).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle("is-active", +k === paneId);
    });
  }

  /* ---- Camera: a three phase flight that dwells on the building ---- */
  function towerWaypoint(a, b) {
    const midY = lerp(a.y, b.y, 0.5);
    const clampedY = Math.max(GEO.towerTop + 850, Math.min(TOWER_BOTTOM - 850, midY));
    const scale = (viewport.clientWidth * 0.72) / GEO.towerW;
    return { x: GEO.axisX, y: clampedY, s: scale };
  }

  // A plain two point move, used for the intro's beats (up to the spire, then
  // back to the full canvas) where the tower waypoint is not wanted.
  function flyTo(to, dur, onDone) {
    if (camAnim) camAnim.stop();
    camAnim = null;
    const from = { ...cam };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dip = dist > 600 ? 0.14 : 0;
    const ls0 = Math.log(from.s);
    const ls1 = Math.log(to.s);
    document.body.classList.add("is-flying");
    camAnim = window.Motion.animate(0, 1, {
      duration: dur,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (t) => {
        applyCam({
          x: lerp(from.x, to.x, t),
          y: lerp(from.y, to.y, t),
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

  // Three phase flight: climb out to the building, drift slowly past it, then
  // settle into the target pane. The middle phase is the showcase.
  const PHASE_OUT = 0.36;
  const PHASE_HOLD = 0.62;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function flyToPane(target, from, dur, onDone) {
    if (camAnim) camAnim.stop();
    camAnim = null;
    const start = { ...cam };
    const wp = towerWaypoint(from, target);
    // While crossing the building, drift upward along its face.
    const drift = { x: wp.x, y: wp.y - 320, s: wp.s * 1.06 };
    document.body.classList.add("is-flying");
    camAnim = window.Motion.animate(0, 1, {
      duration: dur,
      ease: "linear",
      onUpdate: (raw) => {
        let p;
        if (raw < PHASE_OUT) {
          const u = easeOut(raw / PHASE_OUT);
          p = { x: lerp(start.x, wp.x, u), y: lerp(start.y, wp.y, u) };
          const ls = lerp(Math.log(start.s), Math.log(wp.s), u);
          p.s = Math.exp(ls);
        } else if (raw < PHASE_HOLD) {
          const u = easeInOut((raw - PHASE_OUT) / (PHASE_HOLD - PHASE_OUT));
          p = { x: lerp(wp.x, drift.x, u), y: lerp(wp.y, drift.y, u) };
          p.s = Math.exp(lerp(Math.log(wp.s), Math.log(drift.s), u));
        } else {
          const u = easeInOut((raw - PHASE_HOLD) / (1 - PHASE_HOLD));
          p = { x: lerp(drift.x, target.x, u), y: lerp(drift.y, target.y, u) };
          p.s = Math.exp(lerp(Math.log(drift.s), Math.log(target.s), u));
        }
        applyCam(p);
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
    flyTo(spireTarget(), 1.8, () => {
      if (!alive()) return;
      setTimeout(() => {
        if (!alive()) return;
        flyTo(canvasTarget(), 1.3, () => {
          if (!alive()) return;
          setTimeout(() => {
            if (alive()) flyToPane(target, canvasTarget(), 1.4, done);
          }, 900);
        });
      }, 1600);
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

    if (isCanvasFinale) {
      resetAllToCovers(false);
      updateKenBurns(null);
      stopPulses();
      pulseConnectors();
      if (!canAnimate() || opts.instant) {
        applyCam(canvasTarget());
      } else {
        flyToPane(canvasTarget(), paneTarget(tgt.pane), 1.6);
        playWhoosh();
      }
      return;
    }

    updateKenBurns(tgt ? tgt.pane : null);
    highlightPaneConn(tgt ? tgt.pane : -1);

    if (samePane) {
      activatePane(tgt.pane, tgt.state, { morph: true, instant: opts.instant }, id);
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
      }
    };

    const target = next === -1 ? introTarget() : paneTarget(tgt.pane);
    const from = prev >= 0 ? paneTarget(prv.pane) : introTarget();
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
      flyToPane(target, from, 1.5, landed);
    }
    if (!opts.instant && tgt) playWhoosh();
  }

  /* ---- Parallax: the tower has depth; the active pane tilts as one rigid card.
     Per-element depth offsets inside panes were removed: text, cards, images
     and rules must move together so copy can never slide out from under its
     image or beam line. ---- */
  const px = { x: 0, y: 0, tx: 0, ty: 0, blend: 0, moved: false };
  let activePane = null;
  let lastActive = null;

  function setActivePane(id) {
    if (id === lastActive) return;
    lastActive = id;
    activePane = id;
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
    if (px.blend < 0.005) return;

    // Tower depth layers (always present, on the canvas). Frozen during the
    // canvas finale so the tilted tower can never drift off the spine.
    const tower = document.getElementById("tower-3d");
    if (tower) {
      if (document.body.classList.contains("is-canvas-finale")) {
        tower.style.transform = "none";
      } else {
        const ry = (px.x * 5.2 * px.blend).toFixed(3);
        const rx = (-px.y * 2.6 * px.blend).toFixed(3);
        tower.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    }

    // NOTE: no per-element parallax inside the active pane. Text, cards,
    // images and rules all move together as one rigid card (whole-pane tilt
    // below), so copy can never slide out from under its image or beam.
    const el = activePane ? sceneEls[activePane] : null;
    if (el) {
      const rx = (-px.y * 3.4 * px.blend).toFixed(3);
      const ry = (px.x * 3.4 * px.blend).toFixed(3);
      el.style.transform = `perspective(1800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
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

  /* ---- Decode every photograph before the show starts ---- */
  function warmImages() {
    const imgs = Array.from(document.images);
    let pending = imgs.length;
    const finish = () => {
      document.body.classList.add("images-ready");
      const loader = document.getElementById("loader");
      if (loader) loader.classList.add("is-done");
    };
    // Never let the loader hold the show hostage on a slow connection.
    setTimeout(finish, 4000);
    if (instantMode) {
      finish();
      return;
    }
    if (!pending) {
      finish();
      return;
    }
    const done = () => {
      pending -= 1;
      if (pending <= 0) finish();
    };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        done();
        return;
      }
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
})();
