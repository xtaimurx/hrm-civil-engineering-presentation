/* Scene 14: conclusion. Two states. State 0 is the cover, state 1 is the closing.
   Photos render only through the engine's persistent .pane-media primitive
   (state-layer <img> tags are stripped); this file outputs copy only. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[14] = function (s, st) {
  if (st === 1) {
    return `
    <div class="s14-wrap s14-close">
      <div class="s14-top">
        <div class="kicker anim-item">${s.kicker}</div>
        <h2 class="headline anim-item s14-headline">${s.title}</h2>
        <p class="dek anim-item s14-dek">${s.subtitle}</p>
      </div>
      <div class="s14-refs">
        ${s.pillars.map(p => `
        <div class="s14-ref anim-item"><h3>${p.head}</h3><p>${p.body}</p></div>`).join("")}
      </div>
    </div>`;
  }
  return `
    <div class="s14-wrap s14-cover">
      <div class="s14-scrim scrim-cover"></div>
      <div class="s14-top">
        <div class="kicker anim-item">${s.kicker}</div>
        <h2 class="headline anim-item s14-headline">${s.title}</h2>
      </div>
    </div>`;
};
