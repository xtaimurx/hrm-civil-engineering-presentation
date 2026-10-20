# Human Resource Management in Civil Engineering

A cinematic, camera-driven web presentation for a Functional English seminar
(Semester 1, Civil Engineering). The Empire State Building carries the
narrative: it opens the story, becomes the connective spine between chapters,
and closes it.

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
| `H` | Hide or show the control bar |
| `M` | Toggle ambient sound |

There are 32 states across 15 panes. Pressing next inside a pane morphs the
photography in place (it glides, crops, pans and resizes) rather than swapping
one static image for another. Moving the mouse adds parallax depth and a slight
3D tilt to the active pane and to the building itself.

## How the canvas is laid out

The world is a single 8200 by 10000 pixel canvas built around the Empire State
Building, which sits at its centre at a true 0.6154 aspect ratio, matching the
source photograph exactly. Nothing is stretched.

```
        Floor 102 spire finale          (700)
        row 6   left pane  |  right pane
        row 5   left pane  |  right pane
        ...
        row 1   left pane  |  right pane
        hook: the fatality question      (8400)
```

The twelve content panes overlap the building's faces, so they read as panels
mounted on the tower rather than slides floating beside it. Every pane is
wired to the building by a conduit that runs out from the building's core, and
a vertical spine runs the full height of the tower.

The world is deliberately kept near 8200 by 10000. Chrome allocates raster
memory per layer, and a larger canvas exceeds its tile budget and the page
stops drawing. The original 14000 by 13000 version could not be rendered at
all.

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
| 32 | Canvas finale | 3 | The whole building with the conduit network |

## Files

```
index.html    markup, engine styles, the 3D tower, the connector layer
engine.js     camera, state machine, media morphs, parallax, transitions
scenes.js     per-pane copy, coordinates and state counts
motion.js     Motion (motion.dev) for animation
slides/       one JS + one CSS file per pane
assets/       photographs (see assets/CREDITS.md)
assets/thumbs/ 480px versions used by the canvas finale
```

## Stack and performance notes

Vanilla HTML, CSS and JavaScript. Animation runs on [Motion](https://motion.dev)
bundled locally as `motion.js`, so the deck works offline and needs no network
access at run time.

Three decisions keep it smooth, and all three were measured:

- **Media morphs use `clip-path`, not layout properties.** Animating `width`,
  `height` or `left` re-lays out and re-rasters a 1600 by 900 photograph on
  every frame.
- **Nothing on the canvas carries a `filter`.** A `drop-shadow` on the old
  connector lines made Chrome re-rasterise a world-sized SVG every frame and
  dropped the canvas finale to 3.7fps.
- **The canvas finale swaps in 480px thumbnails.** At that zoom each pane is
  about 200 pixels on screen, and rasterising fifteen full-resolution
  photographs is a needless burst.

Measured over a two second transition in a software rendered headless browser:
16.7ms median frame, 20ms worst, no dropped frames.

## Note

This is an academic presentation. The Empire State Building is used as a
narrative hook, not as a subject. All images are credited in
`assets/CREDITS.md`; some require attribution under Creative Commons.
