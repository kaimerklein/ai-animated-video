# three.js worlds and kinetic typography

Both are proven in the browser first, then ported to Remotion ([remotion.md](remotion.md)).

## Code-built worlds (three.js)
Example: [tools/threejs-scenes/lighthouse.html](../tools/threejs-scenes/lighthouse.html)
- Basalt hex columns via `InstancedMesh`; lighthouse as a group; rotating additive beam cones plus a `SpotLight`
- Sea as a `ShaderMaterial` (beam streak, lantern reflection)
- Fog points, drifting ash, seven ravens
- Three sections (verse / chorus / bridge) on a 48 s loop
- Optional audio analysis: bass → lantern, mids → ash
- three.js r128 UMD from cdnjs (single file, no build)

Rules for scenes:
- Everything is a function of `t`. Section changes are `smoothstep` blends between parameter sets, not state flips.
- One recurring symbol per song (the lantern, the ember) carries the emotional arc.
- Keep the palette small; spend the accent colour only at the turn.
- Respect `prefers-reduced-motion`.

## Kinetic typography
Example: [tools/kinetic-lyrics/verse1-mirror.html](../tools/kinetic-lyrics/verse1-mirror.html) — two lines, 18 s loop.

Structure:
- Fullscreen WebGL canvas: frost shader (voronoi/fbm), ember glow, melt radius uniform `uMelt`
- 2D canvas for sparks
- DOM rows for text, so fonts and per-letter effects are easy; later port to Remotion `<span>`s or canvas text
- `render(t, now)` is a pure function of time

Behaviours per word (the meaning lives in the motion):
| Word | Behaviour |
|---|---|
| "stranger's face" | typed in, then a mirrored, blurred copy fades in and flips to face the viewer |
| "candle" | letters ignite left → right with a text-shadow glow; the ember melts a circle in the frost |
| "burning out of place" | letters scatter in from hashed offsets; the last word never fully settles (residual jitter, warm colour) |
| end of line | blinking cursor, then fade-out |

Typography rules:
- Two faces: a quiet thin serif for connecting words (Spectral), an expressive display serif for image words (Cormorant Garamond); mono (JetBrains Mono) for UI only.
- Lines are timed to the vocal via `timing.json` ([audio-sync.md](audio-sync.md)); the prototype has a "Line at [s]" offset field to sync by hand against a loaded MP3.
- Text sits inside the world (frost, glass, light), not as a subtitle bar.

## Reusing for explainers
The same machinery gives explainers: replace lyrics with narration segments, replace the song motif with a process diagram that builds itself, keep `timing.json` as the master clock.
