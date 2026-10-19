/* Scene 4 (P2): what HRM is. Two states: 0 cover, 1 definition split. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[4] = function (s, st) {
  if (st === 1) {
    return `
    <div class="s04-split">
      <div class="s04-photo" data-depth="bg">
        <img src="${s.image}" alt="Steel worker seated on a beam above the city" />
      </div>
      <div class="s04-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
        <div class="s04-cards">
          ${s.cards.map(c => `
          <div class="s04-card anim-item" data-depth="fg">
            <div class="tag">${c.tag}</div><h4>${c.head}</h4><p>${c.body}</p>
          </div>`).join("")}
        </div>
      </div>
    </div>`;
  }
  return `
  <div class="s04-cover">
    <div class="s04-cover-photo" data-depth="bg">
      <img class="kb" src="${s.image}" alt="Steel worker seated on a beam above the city" />
    </div>
    <div class="s04-cover-scrim" aria-hidden="true"></div>
    <div class="s04-cover-copy">
      <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
      <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
    </div>
  </div>`;
};
