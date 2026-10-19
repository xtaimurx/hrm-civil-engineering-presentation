/* Scene 11: safety culture, two states (cover + duty holders). Owned by the scene-11 agent. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[11] = function (s, st) {
  const alt = "Worker cutting steel rebar with a grinder, throwing a stream of sparks";
  if (st === 0) {
    return `
    <div class="s11-cover">
      <div class="s11-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="${alt}" /></div>
      <div class="s11-shade" aria-hidden="true"></div>
      <div class="s11-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  return `
    <div class="s11-duties">
      <div class="s11-bg" data-depth="bg"><img src="${s.image}" alt="${alt}" /></div>
      <div class="s11-shade s11-shade-duties" aria-hidden="true"></div>
      <div class="s11-top">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
      </div>
      <div class="s11-grid">
        ${s.pillars.map((p, i) => `
        <div class="s11-duty anim-item${i === 1 ? " is-mid" : ""}" data-depth="fg">
          <div class="num">0${i + 1}</div>
          <h3>${p.head}</h3>
          <p>${p.body}</p>
        </div>`).join("")}
      </div>
    </div>`;
};
