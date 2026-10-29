# Premium 3D motion graphics with Claude + three.js

Source: Matt Penny, "Claude + Three.js = Premium 3D Motion Graphics" (<https://www.youtube.com/watch?v=CCUSpJkAfgU>). Notes summarised from a written breakdown of the video; costs and model claims are the creator's, not our measurements.

Best fit: **explainer videos and very polished pieces** (product-style motion graphics, technical concepts in 3D). It extends [threejs-and-kinetic-type.md](threejs-and-kinetic-type.md) from "a world for a song" to "a designed showreel per topic".

## The recipe

1. **Script first.** Give Claude a scene-by-scene script with exact timings (scene, duration, what is on screen, transition).
2. **three.js for the 3D.** Explicitly ask for three.js: scenes, geometry, camera paths.
3. **Shaders for the premium look.** Ask for GPU shaders: lighting, glassmorphism (frosted, semi-transparent panes), metallic reflections, particles, glow.
4. **Render headless.** The page runs invisibly in a headless browser.
5. **Capture and stitch.** A capture engine grabs frames (60 fps in the video) and stitches them into an mp4.

No AI video model, no After Effects, no traditional 3D renderer.

## Visual building blocks (from the video's frames)

The look is a reusable kit, independent of the topic:

| Block | What it is | Notes for us |
|---|---|---|
| World | Dark dome lit by large soft gradient blobs (violet, orange, blue, pink) | Swap palette per project; keep "blobs on dark", not a flat background |
| Stations | Each step at its own 3D position; small orange "STEP 0X" eyebrow over one big white word | Eyebrow + one-word title = our scene header pattern |
| Glass panels | Rounded extruded slabs, frosted (`MeshPhysicalMaterial`, transmission, roughness ~0.4); face is a canvas texture redrawn every frame | All UI motion (typing, checklists, counters, charts) lives on the canvas face |
| Camera | Slow drift inside a station, fast whip between stations (expo ease) | Drift = reading time, whip = energy |
| Connector | Glowing tube along a CatmullRom curve through all stations, draws on with a bright head | The story's thread; progress = curve parameter |
| Props | Clear glass spheres, rings, icosahedra (dispersion) + small glowing orbs for parallax, kept off the camera path | Cheap depth |
| Reveal | Camera pulls back to show all stations; dark scrim, title, glass pill fixed to camera | Standard ending |
| Finish | HDR target + MSAA, subtle bloom (highlights only), neutral tone mapping, slight chromatic aberration, vignette, grain | Same "grade" layer as our music videos |

### Prompt structure used in the video (paraphrased)
1. Specs: duration, resolution, fps, style keyword.
2. Render method: frame by frame to mp4 (Playwright + ffmpeg), every animation driven by `t`.
3. World and materials.
4. Camera behaviour and station header style.
5. Scenes: `name (start–end s): objects + micro-animations`.
6. Throughout: connector, props.
7. Finish: post-processing, readability, check still frames of every scene before the full render.

## Key findings

| Finding | Detail |
|---|---|
| Cost | Video model (Seedance-class): ~$0.10/s, ~$1.50 per 15 s clip. Claude via API: ~$0.74 for a ~37k-token generation. Via subscription: creator estimates ~$0.05 per video. |
| Iteration | Changing a text or camera angle is a cheap code edit, not a full re-generation. |
| Clarity | 3D motion graphics explain technical concepts (RAG, vector spaces, gradient descent, packet routing) better than flat 2D. |
| Model | Creator: Opus-class models write the most reliable three.js/shader code; weaker models produce render errors or flat-looking depth. |

## Prompting tips

- **Name the stack:** "three.js", "GPU shaders", "realistic lighting and particles".
- **Name the materials:** glassmorphism / frosted glass panes, brushed or polished metal — depth and premium texture come mostly from materials and light.
- **Continuous camera:** ask for a 3D camera fly-through between scenes, not slideshow cuts.
- **Tone anchors:** "sleek", "professional", "premium".
- **Showreel framing:** the creator tells Claude to treat it as its portfolio piece for a top motion-graphics role. Anecdotal, cheap to try.
- **Strict timing table:** every scene with start, duration and transition.
- **Self-verification pass:** ask Claude to check for overlapping UI, text that is too small, and low contrast before it finalises.

## Prompt template

```
Build a <N>-second 1080p motion-graphics video as a single HTML file using three.js r128 (cdnjs)
and custom GLSL shaders. Topic: <concept>. Treat it as a portfolio showreel piece for a top
motion-graphics role: sleek, professional, premium.

Look: dark background, glassmorphism panels (frosted, semi-transparent, soft edge glow),
metallic accents, particles, bloom-like glow, one accent colour <hex>.
Camera: one continuous 3D fly-through; no slideshow cuts.

Scenes (exact timings):
| # | start | dur | on screen | transition |
| 1 | 0.0   | 4.0 | ...       | camera dolly to 2 |
| 2 | ...   |     |           |           |

Rules: everything is a pure function of t via render(t); no Date.now/random without a seed;
expose window.render(t) and window.DURATION for frame capture.

Before finishing, self-check: no overlapping elements, minimum text height ~3% of frame,
WCAG-level contrast for all text, nothing leaves the safe area. Fix, then report what you checked.
```

## How this maps to our toolbox

- **Same core as ours:** three.js + shaders in one HTML file, written by Claude. Our lighthouse and frost prototypes are the music-video version of this.
- **Capture must be deterministic.** Real-time screenshotting at 60 fps drops or duplicates frames under load. For us: the page exposes `render(t)`, and the capture loop steps `t = frame / fps` itself (Puppeteer/Playwright screenshot per frame → FFmpeg), or we port to Remotion with `@remotion/three`. See [remotion.md](remotion.md).
- **fps:** 60 suits UI-style motion graphics; music videos stay at 24/30.
- **Self-check** is now part of the house-style skill's "before declaring done".
- **Explainers:** pair with narration `timing.json` ([audio-sync.md](audio-sync.md)) so scene starts come from the voice-over, not hand-typed numbers.

## Ecosystem additions (community workflows)

Collected from creator tutorials and community write-ups; not yet verified by us. Our decision per item:

| Idea | What it is | Our take |
|---|---|---|
| Claude Code as the build agent | Scaffolds the project, installs `three`/`gsap`/`vite`, runs the render loop, self-debugs | Adopt. Same as our setup ([claude-code-setup.md](claude-code-setup.md)) |
| Remotion | React video, rendered frame by frame in a headless browser | Adopt for final renders ([remotion.md](remotion.md)) |
| GSAP timelines | Smooth tweening with less WebGL maths | Optional. Only as a paused timeline driven by `tl.seek(t)`, never real-time playback, so renders stay deterministic |
| Skill repositories (`.claude/skills/`) | Modular rulebooks: CDN versions, lighting, materials, anti-patterns | Adopt. Our motion-graphics skill follows this shape |
| Brand intake first | Hex colours, logo SVG, type, tone of voice loaded before any scene is built | Adopt as step 0 of the skill (a brand/palette file) |
| Dual-pane live preview | Dev server + browser beside the terminal; critique by timecode, Claude patches live | Adopt. Our PoCs have a review deck (scrubber, shot chips, frame step) for exactly this |
| Fact and asset grounding | Every number or label comes from an approved data file | Adopt. One data object feeds cards and narration (see pizza PoC `RECIPE`) |
| Motion on twos | Hold each pose 2 frames at 24 fps for a tactile, broadcast feel | Offer as a switch, applied to objects and UI; camera stays smooth |
| Banned defaults | No typewriter text, no neon purple-to-blue gradients, no flat glowing text boxes, no harsh inner shadows | Adopt as the skill's anti-pattern list |
| Camera and light | FOV ~45–75° with eased moves; key + warm directional light, shadows on | Adopt FOV range (PoC now 42–56°); shadows when a ground plane exists |
| Macro → micro → macro | Spatial journey: overview, tunnel into structure, pull back out | Adopt as a story template (e.g. tunnel into the gluten network at the windowpane test) |

## Captions for explainers

- Narration lives as data in the `timing.json` shape (`start`, `end`, `words[]`). Until a voice track exists, word times are estimated from word length and punctuation; after recording, forced alignment replaces them ([audio-sync.md](audio-sync.md)).
- Look: lower third, no box. A soft bottom shade keeps contrast. The whole line fades in from a slight blur and lift; spoken words brighten, the current word turns the accent colour and rises slightly; the line leaves upwards with a blur. No typewriter reveal.
- Ambient motion (fire, embers, grain, camera breathing) runs on real time; choreography runs on story time, so slowing a piece down does not turn it into slow motion.

## Open points
- Build a small deterministic capture script (`tools/frame-capture/`): headless Chromium, step `render(t)`, pipe PNGs to FFmpeg.
- First explainer test: one technical concept, 30–45 s, glass + metal look, using the template above.
- Measure our own token cost and iteration count per video.
