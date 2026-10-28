# DepthFlow (2.5D parallax from stills)

DepthFlow (BrokenSource) estimates a depth map from an image and renders a virtual camera moving through it — dolly, orbit, zoom, parallax. It is the cheapest way to make a still "alive".

Status: installed and tested by Kai on the Mac. Verdict: works well **if the image contains nothing that should be moving** — see [still-world-rules.md](still-world-rules.md). Next step is a video-scale test (a full section of a song).

> Check the upstream project for current install and CLI syntax; it changes between versions. The notes below describe the intent and the commands as last known.

## Setup (macOS)
Use an isolated environment (uv or a venv), not the system Python. Typical flow:
```bash
# install uv if needed: brew install uv
uvx depthflow --help            # runs without a permanent install
# or: uv tool install depthflow
```
Rendering uses the GPU through the app's window/headless backend; on Apple Silicon this works but is slower than a discrete GPU. A 1080p × 6–10 s clip should be minutes, not hours.

## Basic render
```bash
depthflow input -i still.png main -o clip.mp4 --time 8 --fps 30 --ssaa 1.5
```
Typical knobs: duration, fps, resolution, anti-aliasing (SSAA), camera preset (orbit, dolly, zoom, horizontal/vertical), intensity, easing.

## Practices that worked / expected to work
- Generate stills a bit larger than the output; the camera needs margin.
- Slow, gentle moves (4–10 s per shot) look cinematic; fast moves expose depth artefacts.
- One camera idea per shot: push-in for tension, slow orbit for wonder, lateral drift for melancholy.
- Cut on the beat or on a section change; use a short crossfade (6–12 frames) otherwise.
- Always layer an atmosphere overlay (fog/dust/embers) so parallax edges are masked and the frame feels alive.
- Render each shot separately, name by song position: `NN_section_shotname.mp4`.

## Failure modes
| Symptom | Cause | Fix |
|---|---|---|
| Birds/waves look frozen | Moving subject in the still | Regenerate without them, add as overlay |
| Edges tear or stretch | Thin structures, strong depth discontinuities | Reduce move intensity; recompose |
| "Rubber" faces | Depth model on close-up faces | Keep headless in phase 1 |
| Black borders | Camera outruns image | Larger still, lower intensity |

## Fit in the pipeline
Stills (FLUX) → `depthflow` clips → composite in Remotion with overlays and typography. See [pipeline.md](pipeline.md) and [remotion.md](remotion.md).
