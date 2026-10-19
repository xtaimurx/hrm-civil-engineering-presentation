/* Scene 9: productivity (P7). Two states: cover, then units split. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[9] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s09-cover">
      <div class="s09-cover-photo" data-depth="bg">
        <img class="kb" src="${s.image}" alt="Crew preparing a foundation pour with formwork and a concrete bucket" />
        <div class="s09-cover-shade"></div>
      </div>
      <div class="s09-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  const units = s.cards.slice(0, 3);
  const insight = s.cards[3];
  return `
    <div class="s09-wrap">
      <figure class="s09-photo" data-depth="bg">
        <img src="${s.image}" alt="Crew preparing a foundation pour with formwork and a concrete bucket" />
      </figure>
      <div class="s09-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
        <div class="s09-grid">
          ${units.map((c) => `
          <div class="s09-card anim-item" data-depth="fg">
            <div class="s09-unit">${c.tag}</div>
            <h4>${c.head}</h4>
            <p>${c.body}</p>
          </div>`).join("")}
          <div class="s09-card s09-insight anim-item" data-depth="fg">
            <div class="s09-unit">${insight.tag}</div>
            <h4>${insight.head}</h4>
            <p>${insight.body}</p>
          </div>
        </div>
      </div>
    </div>`;
};
