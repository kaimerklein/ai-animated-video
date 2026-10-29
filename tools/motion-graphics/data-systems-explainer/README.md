# data-systems-explainer

PoC v1: a 30-second, 60 fps 3D motion-graphics explainer built with three.js, GSAP and custom GLSL. Generic placeholder topic ("complex data → real-time processing → enterprise scale → CTA") and placeholder brand "Lumen"; swap the copy in `index.html` for a real product.

| Scene | Time | What happens |
|---|---|---|
| 1 Concept | 0–7 s | Frosted glass icosahedron with a warm ember inside, GPU-instanced particle cloud; dolly (0,5,25) → (0,0,10) on a slight arc |
| 2 Process | 7–18 s | Icosahedron fractures into its 20 tetrahedral shards; 44 data lines draw on and carry GLSL light pulses; camera weaves through titanium hex rings with rack-focus depth of field |
| 3 Scale | 18–26 s | Pull back and high orbital sweep over 1,600 titanium nodes rising radially from a glass core; reflective floor with synced light pulses |
| 4 Resolve | 26–30 s | Decelerated lock-in at the isometric angle (12,12,12); nodes settle to one height, cube emblem aligns (reads as a hexagon), tagline + CTA |

## Run

```bash
npm install
npm run dev        # opens the review page
npm run build      # static build in dist/ (relative paths)
```

Review page: plays on load; deck at the bottom has play/pause, scene chips and a scrubber. Keys: `Space` play/pause, `←/→` step one frame at 60 fps, `1–4` jump to each scene's hold frame. With `prefers-reduced-motion` it opens paused on a hold frame.

URL flags: `?debug` shows the self-check report, `?t=12.5` starts at a time, `?capture` renders a fixed 1920×1080 stage without UI.

## Render to mp4 (deterministic)

```bash
npm i -D playwright && npx playwright install chromium   # once
npm run dev                                              # terminal 1
npm run capture -- --out out/explainer.mp4 --fps 60      # terminal 2
```

`scripts/capture.mjs` steps `window.render(t)` at `t = frame / fps`, screenshots each frame and pipes it into FFmpeg, so the result never drops or duplicates frames. Add `--headed` to use the real GPU (much faster than headless software GL), `--from/--to` for a range.

## How it is built

- **Timeline = pure function of t.** One paused `gsap.timeline()` holds every tween (camera, materials, uniforms, HTML captions) as explicit `fromTo` with `immediateRender: false`. `render(t)` seeks it, then `applyState(t)` derives the scene. No wall clock, no unseeded random (mulberry32 seeds all layouts and the grain).
- **Camera** is three continuous segments whose hand-off poses match exactly (t = 7: (0,0,10) looking −z; t = 18: (0,0,−105) looking −z), all eased (`power3`, `power2`, `sine`), never linear.
- **Custom GLSL:** instanced billboard particles, data-line pulses with a draw-on head, obsidian backdrop dome, node pulse rings injected into `MeshPhysicalMaterial` via `onBeforeCompile`, reflective floor (three's `Reflector` with a blurred, pulsing shader), HDR sanitiser, final grade (chromatic aberration, vignette, frame-locked grain).
- **Materials:** glass `MeshPhysicalMaterial` (transmission 0.9, roughness 0.25, ior 1.5, slight dispersion); brushed titanium (metalness 1, anisotropy). No `MeshBasicMaterial`.
- **Lighting:** key `#fff4e6` 2.5, rim `#a6c8ff` 4.0, ambient `#111622`, plus two warm practicals (tunnel light ahead of the camera, core light), procedural `RoomEnvironment` for reflections.
- **Post:** MSAA half-float target → sanitiser → Bokeh DOF (scene 2 only) → bloom → ACES output → grade.
- **Pixel ratio** capped at `min(devicePixelRatio, 2)`; resize updates renderer, composer, reflector and camera; portrait screens keep the horizontal field of view.

## Self-check

Runs on load and after every resize, at each scene's hold frame (`window.selfCheck()`, report in `window.selfCheckReport`, overlay with `?debug`):

- visible captions must not overlap each other, and must stay inside the 5 % safe area;
- title, body and CTA text ≥ 3 % of frame height (eyebrow HUD exempt);
- the scene's focal object (projected bounding sphere) must not sit under the caption;
- WCAG contrast ≥ 4.5:1 for the dimmest text colour against the 90th-percentile pixel behind the card, read back from the rendered frame. If it fails, the card's scrim is raised until it passes — that is the automatic fix.

Last run (1920×1080): all four scenes `ok`; contrast after fix 7.8 / 4.7 / 4.8 / 4.8 : 1.

## Deviations from the repo defaults (on purpose)

The brief asked for an ESM + Vite project with separate `index.html` / `styles.css` / `main.js`, three.js r128+ and `ior`. Our usual rule is "one HTML file, three.js r128 UMD from cdnjs". This PoC uses three.js 0.186 via npm because r128 lacks real transmission refraction (`ior`, `thickness`, `dispersion`) and the modern `OutputPass`. Everything else follows the house style (pure `render(t)`, capture hooks, reduced motion, self-check, type stack).

## Known limits / next steps

- Headless Chromium falls back to software GL: capture is slow there; use `--headed` on a Mac.
- Copy is placeholder; pair with a narration `timing.json` (docs/audio-sync.md) so scene starts come from the voice-over.
- Possible upgrades: real per-shard refraction thickness, GPU-side node updates, sound bed.
