# ai-animated-video

Central toolbox for **cheap, mostly code-built animated video** — music videos first, explainer videos later.

The core idea: don't generate every frame with an AI video model. Generate a few *stills* (FLUX), add motion with cheap deterministic tools (parallax, overlays, shaders, kinetic typography, 3D), and keep the timeline as **code** so it is repeatable, editable and renders offline for free.

## Projects using this toolbox

| Project | Repo | Notes |
|---|---|---|
| Ilyra Solyane (gothic rock) | `kaimerklein/ai-music-Ilyra-solyane` (private) | First user. Song folders hold lyrics, Suno prompts, concepts. |
| Juno Solyane (pop) | `kaimerklein/ai-music-juno-solyane` (private) | Same song format. |
| Explainer videos | — | Planned. Same pipeline, different content. |

Song- or channel-specific material (lyrics, characters, concepts) stays in the project repos. **This repo holds the reusable method and code.**

## The approach in one picture

```
audio + timing ─┐
                ├─►  scene timeline (pure function of time)  ─►  render  ─►  mp4
stills (FLUX) ──┤        ├─ DepthFlow parallax clips
overlays/stock ─┤        ├─ three.js / shader worlds
3D assets ──────┘        ├─ kinetic typography
                         └─ audio-reactive visualizers
```

## Where to start

| I want to… | Read |
|---|---|
| See the options and why we chose them | [docs/approaches.md](docs/approaches.md) |
| Run the end-to-end process | [docs/pipeline.md](docs/pipeline.md) |
| Make images that survive parallax | [docs/still-world-rules.md](docs/still-world-rules.md) |
| Set up local FLUX + ComfyUI, driven by Claude | [docs/comfyui-flux.md](docs/comfyui-flux.md) |
| Animate stills with DepthFlow | [docs/depthflow.md](docs/depthflow.md) |
| Build a Remotion visualizer | [docs/remotion.md](docs/remotion.md) |
| Automate editing (zooms, captions, ducking) with Claude Code | [docs/automated-editing.md](docs/automated-editing.md) |
| Build three.js worlds and lyric animation | [docs/threejs-and-kinetic-type.md](docs/threejs-and-kinetic-type.md) |
| Make premium 3D motion graphics (explainers, polished pieces) | [docs/threejs-motion-graphics.md](docs/threejs-motion-graphics.md), skill `.claude/skills/motion-graphics/` |
| Go 3D with Blender | [docs/blender-3d.md](docs/blender-3d.md) |
| Get exact word timings for lyrics | [docs/audio-sync.md](docs/audio-sync.md) |
| Set up Claude Code, remote control, tunnels | [docs/claude-code-setup.md](docs/claude-code-setup.md) |
| See what's decided, open, and next | [docs/roadmap.md](docs/roadmap.md) |
| Find references and to-watch items | [docs/references.md](docs/references.md) |

## Working examples

- [tools/kinetic-lyrics/verse1-mirror.html](tools/kinetic-lyrics/verse1-mirror.html) — kinetic lyric test: frost shader, typed/mirrored/igniting words, `render(t)` as a pure function of time. Open in a browser.
- [tools/threejs-scenes/lighthouse.html](tools/threejs-scenes/lighthouse.html) — procedural lighthouse world: basalt cliff, beam, sea shader, fog, ash, ravens, 48 s loop, optional audio reactivity.

Both are single self-contained HTML files (three.js r128 from cdnjs). Open them directly; no build step.

## Conventions

See [CLAUDE.md](CLAUDE.md). Short version: timelines are pure functions of time, binaries go through Git LFS, secrets live in `.env` only.
