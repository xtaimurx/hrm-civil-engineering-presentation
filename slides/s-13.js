/* Scene 13: ten recommendations, three states (cover + 1 to 5 + 6 to 10). Owned by the scene-13 agent. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[13] = function (s, st) {
  if (st === 0) {
    return `
    <div class="s13-cover">
      <div class="s13-bg" data-depth="bg"><img class="kb" src="${s.image}" alt="" /></div>
      <div class="s13-shade" aria-hidden="true"></div>
      <div class="s13-cover-copy">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
      </div>
    </div>`;
  }
  const set = st === 1 ? s.recs.slice(0, 5) : s.recs.slice(5, 10);
  const base = st === 1 ? 0 : 5;
  const count = st === 1 ? "Strategies 1 to 5 of 10" : "Strategies 6 to 10 of 10";
  return `
    <div class="s13-list">
      <div class="s13-bg dim" data-depth="bg"><img src="${s.image}" alt="" /></div>
      <div class="s13-shade" aria-hidden="true"></div>
      <div class="s13-head">
        <div class="kicker anim-item" data-depth="mid">${s.kicker}</div>
        <h2 class="headline anim-item" data-depth="mid">${s.title}</h2>
        <div class="s13-count anim-item" data-depth="mid">${count}</div>
      </div>
      <div class="s13-rows">
        ${set.map((r, i) => `
        <div class="s13-row anim-item" data-depth="fg">
          <div class="s13-num">${String(base + i + 1).padStart(2, "0")}</div>
          <p>${r}</p>
        </div>`).join("")}
      </div>
    </div>`;
};
