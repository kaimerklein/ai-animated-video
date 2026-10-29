# References

## Videos (watch / analyse)
- **"The End Of The Show" — Claude music video about AI taking over.** Animated in TypeScript with three.js/Remotion by Claude Opus 5.5. Take-aways: consistent scenes, lyrics as animated text inside the world, orchestrator + sub-agents. Source: <https://youtu.be/tKrVYOUvrtA>
- Second video about code-built animation: <https://youtu.be/3TNpOD6bov8> (to review)
- **Video on automating editing and post-production with Claude** — mentions **HyperFrames by HeyGen**. To review; not yet evaluated.
- **Matt Penny — "Claude + Three.js = Premium 3D Motion Graphics".** Script with timings → three.js + shaders (glassmorphism, metal, particles) → headless capture → mp4; prompt tips and self-verification. Source: <https://www.youtube.com/watch?v=CCUSpJkAfgU>. Analysed in [threejs-motion-graphics.md](threejs-motion-graphics.md).
- **Christian Peverelli — automated video editing with Claude Code + Remotion.** Code-as-video editing of recorded footage: Descript pre-cut, transcript-driven zooms/captions/lower thirds, music ducking, custom skill files. Analysed in [automated-editing.md](automated-editing.md).

## Tools
| Tool | Role | Link |
|---|---|---|
| FLUX.2 (klein 4B) | Stills | Black Forest Labs |
| ComfyUI | Local image graphs | https://github.com/comfyanonymous/ComfyUI |
| DepthFlow | 2.5D parallax | https://github.com/BrokenSource/DepthFlow |
| Remotion | Code-driven video | https://www.remotion.dev |
| Remotion agent skills | Remotion know-how for Claude Code (`npx skills add remotion-dev/skills`) | https://www.remotion.dev/docs/ai/skills |
| Descript | Transcript-based rough cut of recorded speech (explainers) | https://www.descript.com |
| FFmpeg | Slicing, merging, encoding | https://ffmpeg.org |
| three.js | 3D / shaders | https://threejs.org |
| Blender (+ MCP) | 3D worlds | https://www.blender.org |
| Poly Haven | CC0 3D assets, HDRIs | https://polyhaven.com |
| stable-ts / WhisperX | Forced alignment | GitHub |
| Renderforest music visualizer | Look reference (free tier 60 s) | renderforest.com |
| HeyGen HyperFrames | To evaluate | heygen.com |

## Notes on sources
Tool links are the projects' main sites; check them for current install steps and licences before relying on a specific command.
