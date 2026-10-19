/* Scene 10: seven challenges, three states (cover + 1 to 4 + 5 to 7 with takeaway). Owned by the scene-10 agent. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[10] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s10-cover">
      <div class="s10-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="" /></div>
      <div class="s10-shade" aria-hidden="true"></div>
      <div class="s10-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  if (st === 1) {
    const set = s.challenges.slice(0, 4);
    return `
    <div class="s10-matrix">
      <div class="s10-bg dim" data-depth="bg"><img src="${s.image}" alt="" /></div>
      <div class="s10-shade" aria-hidden="true"></div>
      <div class="s10-head">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <div class="s10-count anim-item" data-depth="mid">Challenges 1 to 4 of 7</div>
      </div>
      <div class="s10-grid">
        ${set.map(c => `
        <div class="s10-cell anim-item" data-depth="fg">
          <div class="cell-top"><div class="num">${c.num}</div><h3>${c.name}</h3></div>
          <p>${c.fix}</p>
        </div>`).join("")}
      </div>
    </div>`;
  }
  const set = s.challenges.slice(4, 7);
  return `
    <div class="s10-matrix">
      <div class="s10-bg dim" data-depth="bg"><img src="${s.image}" alt="" /></div>
      <div class="s10-shade" aria-hidden="true"></div>
      <div class="s10-head">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <div class="s10-count anim-item" data-depth="mid">Challenges 5 to 7 of 7</div>
      </div>
      <div class="s10-grid">
        ${set.map(c => `
        <div class="s10-cell anim-item" data-depth="fg">
          <div class="cell-top"><div class="num">${c.num}</div><h3>${c.name}</h3></div>
          <p>${c.fix}</p>
        </div>`).join("")}
        <div class="s10-cell s10-takeaway anim-item" data-depth="fg">
          <div class="cell-top"><div class="num">Takeaway</div><h3>Systematic HRM</h3></div>
          <p>Solving these seven challenges needs integrated planning, training and supervision rather than ad hoc fixes.</p>
        </div>
      </div>
    </div>`;
};
