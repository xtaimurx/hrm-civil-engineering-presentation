/* Scene 7: life cycle, seven stages in three states. Owned by the scene-07 agent.
   Contract: SCENE_RENDER[7](s, st), st 0 cover, st 1 stages 1-4, st 2 stages 5-7.
   Every text/card element is .anim-item. Photo wrappers data-depth="bg",
   headlines data-depth="mid", nodes data-depth="fg". */
window.SCENE_RENDER = window.SCENE_RENDER || {};
window.SCENE_RENDER[7] = function (s, st) {
  var IMG = "assets/steel_bolter.jpg";
  var ALT = "Steel worker bolting a girder high above the Manhattan skyline";

  function node(stg, dim) {
    return (
      '<div class="s07-node anim-item' + (dim ? " is-dim" : "") + '" data-depth="fg">' +
        '<div class="s07-node-in">' +
          "<div class=\"num\">" + stg.num + "</div><h3>" + stg.name + "</h3><p>" + stg.desc + "</p>" +
        "</div>" +
      "</div>"
    );
  }

  function banner() {
    // Borderless spacer: the persistent pane-media strip behind it carries
    // the real photograph (state-layer imgs are stripped by the engine).
    return '<div class="s07-banner-spacer" aria-hidden="true"></div>';
  }

  function beam() {
    return '<div class="s07-beam" aria-hidden="true"><span class="s07-beam-fill"></span></div>';
  }

  if (st === 0) {
    return (
      '<div class="s07-cover">' +
        '<div class="s07-bg" data-depth="bg"><img class="kb" src="' + IMG + '" alt="' + ALT + '" /></div>' +
        '<div class="s07-shade" aria-hidden="true"></div>' +
        '<div class="s07-cover-copy">' +
          '<div class="kicker anim-item" data-depth="mid">' + s.kicker + "</div>" +
          '<h2 class="headline anim-item" data-depth="mid">' + s.title + "</h2>" +
        "</div>" +
      "</div>"
    );
  }

  if (st === 1) {
    var first = s.stages.slice(0, 4).map(function (g) { return node(g, false); }).join("");
    return (
      '<div class="s07-wrap">' +
        banner() +
        '<div class="s07-head">' +
          '<div class="kicker anim-item" data-depth="mid">' + s.kicker + "</div>" +
          '<h2 class="headline anim-item" data-depth="mid">' + s.title + "</h2>" +
          '<div class="s07-count anim-item" data-depth="mid">Stages 1 to 4</div>' +
        "</div>" +
        beam() +
        '<div class="s07-track cols-4">' + first + "</div>" +
      "</div>"
    );
  }

  var all = s.stages.map(function (g, i) { return node(g, i < 4); }).join("");
  return (
    '<div class="s07-wrap">' +
      banner() +
      '<div class="s07-head">' +
        '<div class="kicker anim-item" data-depth="mid">' + s.kicker + "</div>" +
        '<h2 class="headline anim-item" data-depth="mid">' + s.title + "</h2>" +
        '<div class="s07-count anim-item" data-depth="mid">Stages 5 to 7</div>' +
      "</div>" +
      beam() +
      '<div class="s07-track cols-7">' + all + "</div>" +
    "</div>"
  );
};
