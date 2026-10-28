# Blender and 3D worlds (later phase)

Idea: build a 3D world once, then fly a camera through it for backgrounds, or render entire scenes in Blender. Combine with the audio visualizer (the 3D world becomes the animated background).

## Controlling Blender with Claude
Blender MCP gives Claude tools to build and edit scenes. Integrations commonly offered:
- **Poly Haven** — CC0 models, HDRIs, textures (safe to reuse)
- **Sketchfab** — large community library; check each asset's licence
- **Hyper3D Rodin** and **Hunyuan3D** — text/image → 3D generation

## Getting assets
| Need | Option | Cost |
|---|---|---|
| Rocks, trees, props, skies | Poly Haven | Free (CC0) |
| Specific objects | Sketchfab (filter by CC licence) | Free/varies |
| Image → 3D mesh, local | TRELLIS.2, Hunyuan3D (run locally); 3D Mate as a GUI option | Free, needs GPU memory |
| Text/image → 3D, hosted | Hyper3D Rodin, Hunyuan3D services | Pay per generation |
| Generate with FLUX, then lift to 3D | FLUX still → image-to-3D → clean up in Blender | Free locally |

Always check the licence of anything that ends up in a published video.

## Rendering
- Eevee for speed (good enough for stylised looks); Cycles only for hero shots.
- Fog, volumetric light and bloom do most of the "gothic" work cheaply.
- Camera paths: simple spline or keyframed dolly; render at 1080p, 24/30 fps.
- Audio reactivity: geometry nodes or drivers fed by baked audio-to-F-curves.

## Merge with the visualizer
1. Render the Blender fly-through as a looping clip.
2. Use it as `BackgroundClip` in Remotion ([remotion.md](remotion.md)).
3. Layer typography and reactive particles on top.

## When to move to Blender
Only once DepthFlow stills run out of freedom: moves that need real parallax (walking through a forest, through a hall) or recurring locations seen from several angles. Until then stills + overlays are cheaper.

Game engines (Unreal) were considered; they offer realtime cinematic quality but a steep learning curve and heavy toolchain. Parked.
