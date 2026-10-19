/* Scene 6: right trade right stage. Two states: 0 cover, 1 phases. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[6] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s06-cover">
      <div class="s06-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="Three steel riveters at height on the Empire State frame" /></div>
      <div class="s06-shade"></div>
      <div class="s06-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  return `
    <div class="split-wrap side-right s06">
      <div class="split-photo s06-photo" data-depth="bg"><img src="${s.image}" alt="Three steel riveters at height on the Empire State frame" /></div>
      <div class="split-copy s06-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
        <div class="card-stack two-col s06-grid">
          ${s.cards.map(c => `
            <div class="ed-card s06-card anim-item" data-depth="fg">
              <div class="tag">${c.tag}</div><h4>${c.head}</h4><p>${c.body}</p>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
};
