/* Scene 14: conclusion. Two states. State 0 is the cover, state 1 is the closing. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[14] = function (s, st) {
  if (st === 1) {
    return `
    <div class="s14-wrap s14-close">
      <div class="s14-bg is-dim" data-depth="bg"><img src="${s.image}" alt="Six drillers standing with jackhammers at a canyon construction site" /></div>
      <div class="s14-scrim scrim-close"></div>
      <div class="s14-top">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item s14-headline" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item s14-dek" data-depth="mid">${s.subtitle}</p>
      </div>
      <div class="s14-refs">
        ${s.pillars.map(p => `
        <div class="s14-ref anim-item" data-depth="fg"><h3>${p.head}</h3><p>${p.body}</p></div>`).join("")}
      </div>
    </div>`;
  }
  return `
    <div class="s14-wrap s14-cover">
      <div class="s14-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="Six drillers standing with jackhammers at a canyon construction site" /></div>
      <div class="s14-scrim scrim-cover"></div>
      <div class="s14-top">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item s14-headline" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
};
