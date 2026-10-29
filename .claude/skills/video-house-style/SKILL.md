---
name: video-house-style
description: House rules for building or editing any video in this toolbox with Remotion or browser prototypes (timing, frame maths, typography, palette, captions, zooms, ducking). Use together with the official Remotion skills whenever writing or changing a composition, scene, caption or edit.
---

# Video house style

Syntax questions (how `<Sequence>`, `spring()`, `<OffthreadVideo>` work) → use the official Remotion skills (`/remotion-best-practices`, `/remotion-docs`). This skill defines *our* rules on top. Project repos may add a song- or channel-specific style skill; theirs wins on look, this one wins on mechanics.

## Mechanics (non-negotiable)
- Everything is a pure function of time. In Remotion: `const frame = useCurrentFrame(); const t = frame / fps;`. Never `Date.now()`, `Math.random()` without a seed, `requestAnimationFrame`, or state that accumulates across frames.
- Seconds → frames only through one helper: `const sec = (s: number) => Math.round(s * fps);`. All `from` / `durationInFrames` come from `sec(...)` applied to `timing.json` values. No hand-typed frame numbers.
- `timing.json` (see `docs/audio-sync.md`) is the master clock. If a time is missing, add it to the data, not to the component.
- Always pass `extrapolateLeft/Right: 'clamp'` to `interpolate` unless you deliberately want overshoot.
- fps and size come from the composition (`useVideoConfig()`), never hard-coded in components.
- Assets via `staticFile()`; video via `<OffthreadVideo>`.
- Self-check before finishing: no overlapping elements, text large enough (≈3 % of frame height minimum), readable contrast, everything inside the safe area. Fix, then say what was checked.
- HTML prototypes that will be captured expose `window.render(t)` and `window.DURATION`; capture steps `t = frame / fps`, never real-time screenshots.
- Before declaring done: open in Remotion Studio (`npx remotion studio`) or render a short range (`--frames=a-b`) of the hardest section.

## Look
- Palette: one palette object per video plus **one accent colour**, spent only at the emotional turn / key point.
- Typography: quiet thin serif for connecting words (Spectral), expressive display serif for image or key words (Cormorant Garamond), mono (JetBrains Mono) only for UI/HUD.
- Music videos: lyrics live inside the world (frost, glass, light), not in a subtitle bar. Each key word gets a behaviour that mirrors its meaning.
- Explainers: word-by-word captions, current word highlighted in the accent colour, max two lines, lower-third safe area kept free.
- Grain + vignette on every finished frame unless the project style says otherwise.
- Polished explainers / motion graphics: glassmorphism panels, metallic accents, particles and glow via shaders, one continuous 3D camera instead of slideshow cuts (see `docs/threejs-motion-graphics.md`).

## Editing moves
- Zoom / punch-in: scale 1.00 → 1.06–1.10 over 6–10 frames on an emphasis word, ease back over ≥ 20 frames. Max one punch-in per ~5 s. Music videos: slow push-ins only (≤ 1.05 over seconds).
- Cuts on a beat or section boundary from `timing.json`; otherwise crossfade 6–12 frames.
- Lower thirds / callouts (explainers): enter with `spring()`, hold ≥ 2 s, never overlap captions.
- Audio ducking (explainers): music bed at ~0.25 while speech is active, ~0.6 in gaps > 0.6 s, ramp over 8–12 frames. Derive speech activity from transcript word times.
- Sound effects: rare and quiet; only on transitions and callouts.

## Never
- Commit credentials, tunnel URLs, private lyrics or story material (public repo).
- Generate frames with AI video where a still + motion layer would do.
