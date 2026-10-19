/* Scene 15: Spire Finale (State 31 of 32).
   Shows the centered Questions and discussion invite together with the
   subtle right-docked Empire State Building feats side note on one state.
   State 32 of 32 is the full-canvas overview finale driven by engine.js. */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[15] = function (s) {
  return `
    <div class="fin15 is-note">
      <div class="fin15-center" data-depth="mid">
        <div class="kicker anim-item">${s.kicker}</div>
        <h2 class="headline fin15-headline anim-item">${s.title}</h2>
      </div>
      <aside class="fin15-note anim-item" data-depth="fg">
        <h3 class="anim-item">Empire State Building feats</h3>
        <ul>
          <li class="anim-item">102 floors above Manhattan</li>
          <li class="anim-item">Completed in 410 days</li>
          <li class="anim-item">About 3,400 workers at peak</li>
          <li class="anim-item">Five official fatalities on record</li>
        </ul>
      </aside>
    </div>`;
};
