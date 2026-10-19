/* Scenes 1 and 2: shared morph box. Owned by the hook agent.
   s1 = question state, s2 = reveal state. Both layers live in one box so the
   photo can morph in place. Entry/exit is driven by index.html (enterLayer). */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.HOOK_HTML = function (s1, s2) {
  return `
    <div class="morph-stage">
      <div class="morph-photo" id="hook-photo">
        <img src="${s1.image}" alt="" />
        <div class="morph-shade" id="hook-shade"></div>
      </div>
      <div class="morph-question-layer" id="hook-q">
        <div class="kicker anim-item">${s1.kicker}</div>
        <h1 class="headline anim-item">${s1.title}</h1>
        <p class="dek anim-item">${s1.subtitle}</p>
        <div class="hook-cue anim-item"><span class="hook-cue-dot"></span>Press next for the official count</div>
      </div>
      <div class="morph-reveal-layer" id="hook-r">
        <div class="kicker anim-item">${s2.kicker}</div>
        <div class="hook-answer-row anim-item">
          <div class="giant-five">${s2.bigNumber}</div>
          <div class="hook-answer-note">official fatalities on record</div>
        </div>
        <h2 class="headline anim-item">${s2.title}</h2>
        <p class="dek anim-item">${s2.subtitle}</p>
        <div class="morph-metrics">
          ${s2.metrics.map(m => `
            <div class="morph-metric-card anim-item">
              <div class="val">${m.val}</div>
              <div class="lbl">${m.label}</div>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
};
