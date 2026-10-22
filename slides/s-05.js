/* Scene 5: eight HR functions, three states (cover + 4 + 4). Owned by the scene-05 agent. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[5] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s05-cover">
      <div class="s05-shade" aria-hidden="true"></div>
      <div class="s05-cover-copy">
        <div class="kicker anim-item">${s.kicker}</div>
        <h2 class="headline anim-item">${s.title}</h2>
      </div>
    </div>`;
  }
  const set = st === 1 ? s.items.slice(0, 4) : s.items.slice(4, 8);
  const count = st === 1 ? "Functions 1 to 4 of 8" : "Functions 5 to 8 of 8";
  return `
    <div class="s05-matrix">
      <div class="s05-head">
        <div class="kicker anim-item">${s.kicker}</div>
        <h2 class="headline anim-item">${s.title}</h2>
        <div class="s05-count anim-item">${count}</div>
      </div>
      <div class="s05-grid">
        ${set.map(it => `
        <div class="s05-cell anim-item">
          <div class="cell-top"><div class="num">${it.num}</div><h3>${it.name}</h3></div>
          <p>${it.desc}</p>
        </div>`).join("")}
      </div>
    </div>`;
};
