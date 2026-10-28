# Roadmap

## Done
- [x] Research of cheap video approaches ([approaches.md](approaches.md))
- [x] Local FLUX.2 + ComfyUI with Claude via MCP ([comfyui-flux.md](comfyui-flux.md))
- [x] DepthFlow installed and tested; still-world rules written ([depthflow.md](depthflow.md), [still-world-rules.md](still-world-rules.md))
- [x] three.js lighthouse world prototype
- [x] Kinetic lyric prototype (frost / mirror / candle)
- [x] Central repo created and structured

## Next
- [ ] Get `timing.json` for the first song via forced alignment ([audio-sync.md](audio-sync.md))
- [ ] Scaffold Remotion project in `tools/remotion-visualizer/`; port the kinetic prototype
- [ ] Re-test the claude.ai ↔ ComfyUI connector; render the three still-world test images
- [ ] DepthFlow at video scale: one full song section with overlays
- [ ] Export ComfyUI workflow JSON into `tools/comfyui/workflows/`
- [ ] First complete headless music video, end to end

## Later
- [ ] Audio-reactive visualizer clone (Renderforest-style) as reusable components
- [ ] Orchestrator + per-scene agents + review dashboard for longer videos
- [ ] Blender worlds and fly-throughs; image-to-3D assets
- [ ] Phase 2: AI lip-sync scenes, used selectively
- [ ] Explainer-video template (narration `timing.json`, self-building diagrams)
- [ ] Evaluate HeyGen HyperFrames for automating editing/post-production

## Open questions
- Frame rate and default resolution (24 vs 30 fps; 1080p vs 4K)
- Licence/terms for any commercial use of Remotion and Suno output (currently personal only)
- Whether to publish tools as a package or keep them as copy-in examples
