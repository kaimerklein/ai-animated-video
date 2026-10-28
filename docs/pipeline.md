# Pipeline

Generic, project-independent. Project repos reference this and add their own steps (song writing, concepts).

```
1 Audio  →  2 Timing  →  3 Concept  →  4 Stills  →  5 Motion  →  6 Type  →  7 Render  →  8 Publish
```

## 0. Pre-process (explainers with recorded speech only)
Transcribe, cut silences / filler words / bad takes, export cleaned media + word-level transcript. Descript or local Whisper + FFmpeg — see [automated-editing.md](automated-editing.md).

## 1. Audio
Final mix as one file (mp3/wav). Use the *exact* version you will publish; a different render shifts every timestamp. Store in the project repo under `audio/` (Git LFS).

## 2. Timing
Get word-level timestamps for the vocal — see [audio-sync.md](audio-sync.md). Output: `timing.json` with `{word, start, end}` plus section markers (verse/chorus/bridge). Everything downstream reads this file.

## 3. Concept
Per song: palette, motifs, section → scene map, shot list with timecodes. Keep one recurring "emotional device" (e.g. an ember melting frost more at each chorus) so the video has an arc, not just pretty shots.

## 4. Stills
FLUX.2 via ComfyUI ([comfyui-flux.md](comfyui-flux.md)). Compose for camera-only motion ([still-world-rules.md](still-world-rules.md)). Keep only the images actually used.

## 5. Motion
- DepthFlow clip per still ([depthflow.md](depthflow.md)).
- Overlays: stock fog/embers/rain/dust, blended screen/add.
- Optional code worlds ([threejs-and-kinetic-type.md](threejs-and-kinetic-type.md)) and visualizers ([remotion.md](remotion.md)).
- Later: Blender camera flights ([blender-3d.md](blender-3d.md)).

## 6. Typography
Lyrics as kinetic type driven by `timing.json`. Image words get a display face, connecting words a quiet one; each key word gets a behaviour that mirrors its meaning (mirror flips, candle ignites, "out of place" jitters).

## 6b. Edit (explainers)
Transcript-driven punch-ins, captions, lower thirds and music ducking, written by Claude under the house-style skill ([automated-editing.md](automated-editing.md)).

## 7. Render
Remotion `npx remotion render` offline, frame by frame, 1080p/30 fps (24 for cinematic feel), audio muxed in. Encode H.264; for CRF-based encodes use a fast preset unless the final needs max quality.

## 8. Publish
Upload (e.g. YouTube / YouTube Music). Log the final render path and date in the project's song file.

## Review loop
Render a 20–30 s test of the hardest section first (usually the first chorus), review, then commit to the full render. Re-rendering is free but slow; mistakes caught at the still stage are the cheapest.

Between renders, preview in Remotion Studio (`npx remotion studio`) and give Claude fixes by timecode ("make the zoom at 01:22 subtler"). AI-generated base + human review beats fully unattended runs.
