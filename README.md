# Human Resource Management in Civil Engineering

A cinematic, camera-driven web presentation for a Functional English seminar
(Semester 1, Civil Engineering). The talk climbs the Empire State Building as
its narrative spine: the building opens the story, becomes the connective
tissue between chapters, and closes it.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

| Key | Action |
| --- | --- |
| `→` / `Space` | Next state |
| `←` | Previous state |
| `O` | (reserved) |
| `H` | Hide or show the control bar |
| `M` | Toggle ambient sound |

There are 32 states across 15 panes. Pressing next inside a pane morphs the
photography in place (it glides, crops, pans and resizes) rather than swapping
one static image for another. Moving the mouse adds parallax depth and a slight
3D tilt to the active pane.

## Structure

| States | Pane | Speaker | Topic |
| --- | --- | --- | --- |
| 1 to 2 | Hook | 1 | The fatality question, then the official record |
| 3 to 4 | Why it matters | 1 | Thesis and the three failure modes |
| 5 to 6 | What HRM is | 1 | Definition, objectives, methodology |
| 7 to 9 | Eight functions | 2 | Core functions, four at a time |
| 10 to 11 | Planning and roles | 2 | Workforce planning, selection, role clarity |
| 12 to 14 | Life cycle | 2 | Seven project stages |
| 15 to 16 | Performance | 2 | Five project outcomes |
| 17 to 18 | Productivity | 2 | Output units and connected factors |
| 19 to 21 | Challenges | 3 | Seven recurring HRM challenges |
| 22 to 23 | Safety | 3 | Culture, not just equipment (ILO 2022) |
| 24 to 25 | Pakistan | 3 | Local context and the April 2026 OSH code |
| 26 to 28 | Recommendations | 3 | Ten strategies |
| 29 to 30 | Conclusion | 3 | People as a strategic project resource |
| 31 | Spire finale | 3 | Questions and discussion |
| 32 | Canvas finale | 3 | The full canvas with the glowing conduit network |

## Files

```
index.html    markup, engine styles, tower monument
engine.js     camera, state machine, media morphs, parallax
scenes.js     per-pane copy, coordinates and state counts
motion.js     Motion (motion.dev) for animation
slides/       one JS + one CSS file per pane
assets/       photographs (see assets/CREDITS.md)
```

## Stack

Vanilla HTML, CSS and JavaScript. Animation runs on [Motion](https://motion.dev)
bundled locally as `motion.js`, so the deck works offline and needs no network
access at run time.

## Note

This is an academic presentation. The Empire State Building is used as a
narrative hook, not as a subject. All images are credited in
`assets/CREDITS.md`; some require attribution under Creative Commons.
