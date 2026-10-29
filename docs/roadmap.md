# Roadmap

## Done
- [x] `motion-graphics` skill v0 (`.claude/skills/motion-graphics/`): house style, option menus, iterative process, build rules; distilled from the pizza PoC
- [x] Research of cheap video approaches ([approaches.md](approaches.md))
- [x] Local FLUX.2 + ComfyUI with Claude via MCP ([comfyui-flux.md](comfyui-flux.md))
- [x] DepthFlow installed and tested; still-world rules written ([depthflow.md](depthflow.md), [still-world-rules.md](still-world-rules.md))
- [x] three.js lighthouse world prototype
- [x] Kinetic lyric prototype (frost / mirror / candle)
- [x] Central repo created and structured
- [x] Analysed automated editing with Claude Code + Remotion ([automated-editing.md](automated-editing.md)); house-style skill added (`.claude/skills/video-house-style/`)
- [x] Documented the Claude + three.js premium motion-graphics recipe ([threejs-motion-graphics.md](threejs-motion-graphics.md)); self-check pass added to house style
- [x] First 3D motion-graphics explainer PoC: `tools/motion-graphics/data-systems-explainer/` (30 s, glass + titanium, GSAP timeline seeked by `render(t)`, self-check with automatic scrim fix, capture script)

## Next
- [ ] Test the `motion-graphics` skill v0 on a topic unlike pizza (e.g. a technical flow) and refine it from what breaks
- [ ] Extract the reusable kit from the pizza PoC (world, glass, connector, panels, captions, grade, review deck) so new pieces start from it
- [ ] Get `timing.json` for the first song via forced alignment ([audio-sync.md](audio-sync.md))
- [ ] Scaffold Remotion project in `tools/remotion-visualizer/`; install official Remotion agent skills; port the kinetic prototype using the house-style skill
- [ ] Re-test the claude.ai ↔ ComfyUI connector; render the three still-world test images
- [ ] DepthFlow at video scale: one full song section with overlays
- [ ] Export ComfyUI workflow JSON into `tools/comfyui/workflows/`
- [ ] First complete headless music video, end to end

## Later
- [ ] Audio-reactive visualizer clone (Renderforest-style) as reusable components
- [ ] Orchestrator + per-scene agents + review dashboard for longer videos
- [ ] Blender worlds and fly-throughs; image-to-3D assets
- [ ] Phase 2: AI lip-sync scenes, used selectively
- [ ] Explainer-video template (narration `timing.json`, self-building diagrams) with the editing automations: captions, punch-ins, lower thirds, music ducking ([automated-editing.md](automated-editing.md))
- [ ] Decide explainer pre-processing: Descript vs. local Whisper + FFmpeg silence cut
- [ ] Measure our own edit time per video (creator claims 15–30 min vs. 4–8 h manual)
- [ ] Generalise `data-systems-explainer/scripts/capture.mjs` into `tools/frame-capture/` for all HTML prototypes
- [ ] Explainer PoC v2: real copy + narration `timing.json`, render a full mp4 with `scripts/capture.mjs --headed`
- [ ] Evaluate HeyGen HyperFrames for automating editing/post-production

## Open questions
- Browser prototypes: keep the single-file r128 UMD rule, or allow Vite + current three.js (needed for real glass refraction, used in the explainer PoC)?
- Frame rate and default resolution (24 vs 30 fps; 1080p vs 4K)
- Licence/terms for any commercial use of Remotion and Suno output (currently personal only)
- Whether to publish tools as a package or keep them as copy-in examples
