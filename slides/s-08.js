/* Scene 8: project performance, two states. Owned by the scene-08 agent. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[8] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s08-cover">
      <div class="s08-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="" /></div>
      <div class="s08-shade" aria-hidden="true"></div>
      <div class="s08-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  return `
    <div class="s08-split">
      <div class="s08-strip" data-depth="bg"><img src="${s.image}" alt="" /></div>
      <div class="s08-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <div class="s08-list">
          ${s.pillars.map((p, i) => `
          <div class="s08-row anim-item" data-depth="fg">
            <div class="s08-num">0${i + 1}</div>
            <div class="s08-body">
              <div class="s08-meta"><span class="metric">${p.metric}</span><span class="s08-dot" aria-hidden="true"></span><h3>${p.title}</h3></div>
              <p>${p.desc}</p>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </div>`;
};
