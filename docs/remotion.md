# Remotion: renderer and visualizer

Remotion (React + TypeScript) renders video frame by frame offline. A composition is a pure function of the frame number, which is exactly what we want. Prototype in HTML/three.js, port the same `render(t)` into Remotion for the final export.

## Why Remotion
- Deterministic, repeatable renders (no real-time glitches)
- Audio analysis built in: `getAudioData` / `visualizeAudio` give per-frame frequency bins
- Composes video clips (DepthFlow output), images, text, shaders and canvas/three.js in one timeline
- Everything is code, so Claude can edit and review it
- Free for personal use (check the licence if the use becomes commercial)

## What a "Renderforest-style" visualizer needs
Renderforest's music visualizer is free for only ~60 s. Cloning the core is a small project:

| Piece | Implementation |
|---|---|
| Audio input | mp3/wav in `public/`, `useAudioData` + `visualizeAudio({fps, frame, audioData, numberOfSamples: 64})` |
| Band split | Slice the bins into bass / mids / highs; smooth with a short moving average |
| Visual styles | Bars, radial spectrum, waveform ring, particle burst, glow orb — each a React component taking `{bass, mids, highs}` |
| Background | Still or DepthFlow clip, blurred/darkened |
| Overlays | Logo/title, lyric layer, progress bar |
| Theming | One palette object + accent colour |
| Output | `npx remotion render` 1080p, H.264, audio muxed |

Minimal data flow:
```
audio ─► visualizeAudio(frame) ─► {bass, mids, highs} ─► Visual components ─► <AbsoluteFill/>
```

## Suggested layout (to build in `tools/remotion-visualizer/`)
```
src/
  Root.tsx                    // registers compositions
  compositions/SongVideo.tsx  // timeline: sections → scenes
  components/
    AudioBands.ts             // smoothing + band split
    RadialSpectrum.tsx
    Particles.tsx
    LyricLine.tsx             // kinetic type, driven by timing.json
    BackgroundClip.tsx        // <OffthreadVideo> of a DepthFlow clip
  data/timing.json            // word-level timestamps
public/audio.mp3
```

## Porting a browser prototype
1. Keep every effect as `render(t)` (seconds) — convert with `t = frame / fps`.
2. Replace `requestAnimationFrame` loops with `useCurrentFrame()`.
3. For three.js/GLSL, use `@remotion/three` (`<ThreeCanvas>`) and drive uniforms from the frame, never from `Date.now()`.
4. Replace the audio file input with `staticFile('audio.mp3')`.

## Skills for Claude
Without explicit rules Claude tends to mix up seconds and frames or write invalid hooks. Load two layers before writing compositions ([automated-editing.md](automated-editing.md)):
- **Official Remotion agent skills**: `npx skills add remotion-dev/skills` (syntax, captions, studio, render, docs lookup).
- **Our house style**: [`.claude/skills/video-house-style/SKILL.md`](../.claude/skills/video-house-style/SKILL.md) (frame helper `sec()`, `timing.json` as master clock, typography, zoom/caption/ducking rules).

## Editing primitives
| Need | Remotion building block |
|---|---|
| Place a clip / text at a time | `<Sequence from={sec(start)} durationInFrames={sec(end - start)}>` |
| Smooth value over time | `interpolate(frame, [a, b], [v0, v1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})` |
| Snappy entry | `spring({frame, fps, config})` |
| Punch-in zoom | `scale` via `interpolate` around an emphasis word |
| Captions | word times from `timing.json`; `@remotion/captions` / `/remotion-captions` skill |
| Music ducking | `<Audio volume={(f) => …}>` derived from speech gaps |

## Review and render
- Preview: `npx remotion studio`, then fix by timecode in conversation ("01:22 zoom more subtle").
- Render: `npx remotion render <entry> <CompositionId> out/video.mp4`; for a test range add `--frames=a-b`.

## Orchestration idea (from the reference video)
For longer pieces: one *orchestrator* plans scenes (what, when, which palette), then per-scene agents build each scene as its own component, and a small HTML dashboard lists scenes with preview and status. Worth adopting once a video has more than ~6 distinct scenes.

## Open items
- Scaffold the project with `npx create-video@latest` in `tools/remotion-visualizer/`; accept or add the official agent skills.
- Port `tools/kinetic-lyrics/verse1-mirror.html` as the first real composition.
- Decide frame rate (24 vs 30) and a default resolution preset.
