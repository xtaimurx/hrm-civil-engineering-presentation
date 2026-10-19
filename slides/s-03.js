/* Scene 3 (pane P1 "why it matters"): two states. State 0 cover, state 1 stakes. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[3] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s3 s3-cover">
      <div class="s3-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="" /></div>
      <div class="s3-shade s3-shade-cover" aria-hidden="true"></div>
      <div class="s3-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  return `
    <div class="s3 s3-stakes">
      <div class="s3-bg s3-bg-dim" data-depth="bg"><img src="${s.image}" alt="" /></div>
      <div class="s3-shade s3-shade-stakes" aria-hidden="true"></div>
      <div class="s3-stakes-top">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <div class="s3-stakes-title anim-item" data-depth="mid">${s.title}</div>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
      </div>
      <div class="s3-pillars">
        ${s.pillars.map((p, i) => `
          <div class="s3-pillar anim-item" data-depth="fg"><span class="s3-num">0${i + 1}</span><h3>${p.head}</h3><p>${p.body}</p></div>`).join("")}
      </div>
    </div>`;
};
