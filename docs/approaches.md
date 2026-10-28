# Approaches to cheap animated video

Goal: videos that look intentional and professional without paying for AI video generation on every shot. First use case: "headless" music videos (the artist is not shown in motion). Lip-synced AI scenes are a later, selective phase.

## Options compared

| Approach | Cost | Control | Looks like | Best for | Status |
|---|---|---|---|---|---|
| **Stills + 2.5D parallax** (FLUX → DepthFlow) | Free, local | High | Camera drifting through a painting | Atmospheric scenes, verses | Chosen, testing |
| **Stock footage + overlays** (fog, embers, rain, dust in screen/add blend) | Low | Medium | Cinematic texture on top of stills | Adding real motion to frozen worlds | Chosen as layer |
| **Code-built worlds** (three.js, GLSL shaders) | Free | Very high | Procedural, stylised | Choruses, loops, audio-reactive scenes | Prototype done (lighthouse) |
| **Kinetic typography** (HTML/Remotion) | Free | Very high | Lyrics as part of the scene | Any song, explainers | Prototype done (frost/mirror) |
| **Audio visualizer** (Remotion + `visualizeAudio`) | Free | High | Reactive shapes/particles | Beds under stills, intros/outros | Spec written |
| **Blender 3D worlds** | Free software; time | Highest | Real camera moves through a built world | Later phase, hero scenes | Planned |
| **Game engine (Unreal)** | Free; steep learning | Highest | Realtime cinematic | Probably overkill | Parked |
| **AI video (image-to-video, lip-sync)** | Pay per second | Low–medium | Realistic motion | Phase 2 scenes with the artist singing | Deferred |

## Decisions so far
1. **Phase 1 is headless**: no character in motion. Stills, parallax, overlays, visualizers, typography.
2. **Everything is code or local**: FLUX.2 via ComfyUI on a Mac (64 GB), DepthFlow, Remotion, three.js. Only Suno (audio) is a paid service.
3. **Prototype in the browser, render in Remotion.** Browser HTML is the fast sketchpad; the same `render(t)` logic ports to Remotion for deterministic frame-by-frame export.
4. **Claude drives the tools.** Claude Code on the Mac controls ComfyUI via MCP; claude.ai can reach it through a secured tunnel (see [comfyui-flux.md](comfyui-flux.md)).
5. **Blender later**, merged with the visualizer: build a 3D world once, fly a camera through it, use that as background (see [blender-3d.md](blender-3d.md)).

## The layered-scene recipe
A typical shot is built bottom-up:

1. **Base**: FLUX still → DepthFlow camera move (dolly, orbit, parallax).
2. **Atmosphere**: fog / dust / embers / rain stock clips, screen or add blend.
3. **World light**: shader or CSS glow, vignette, grain.
4. **Reactive layer** (optional): audio-driven particles, lantern pulses.
5. **Typography**: lyric lines timed to the vocal.
6. **Grade**: one palette, one accent colour used for the emotional turn.

Reuse across songs by changing the stills, the palette and the timeline, not the machinery.

## What the reference videos taught us
The "The End Of The Show" style video (animated entirely in TypeScript + three.js/Remotion, narrated by Claude) uses: consistent scenes that evolve through the song, lyrics animated as part of the world (not subtitles), an orchestrator that plans scenes plus per-scene sub-agents, and a dashboard to review scenes. See [references.md](references.md).
