/* Scene 12: HRM in Pakistan's construction sector. Two states: cover + local proof. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[12] = function (s, st) {
  const main = s.image || "assets/pakistan_bridge.jpg";
  if (st === 0) {
    return `
    <div class="s12-cover">
      <div class="s12-bg" data-depth="bg"><img class="kb" src="${main}" alt="Men repairing a suspension bridge over a river in Gilgit Baltistan" /></div>
      <div class="s12-shade" aria-hidden="true"></div>
      <div class="s12-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  return `
    <div class="s12-proof">
      <div class="s12-rail">
        <figure class="s12-main anim-item" data-depth="bg">
          <img src="${main}" alt="Men repairing a suspension bridge over a river in Gilgit Baltistan" />
        </figure>
      </div>
      <div class="s12-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <p class="dek anim-item" data-depth="mid">${s.subtitle}</p>
        <div class="s12-chips anim-item" data-depth="mid">
          <span>Housing</span><span>Roads</span><span>Bridges</span><span>Dams</span><span>Irrigation</span><span>Energy</span>
        </div>
        <div class="s12-grid">
          ${s.cards.map((c) => `
          <div class="s12-card anim-item" data-depth="fg">
            <div class="tag">${c.tag}</div><h4>${c.head}</h4><p>${c.body}</p>
          </div>`).join("")}
        </div>
      </div>
    </div>`;
};
