# Still-world rules (images for parallax)

DepthFlow and similar 2.5D tools only move the **camera**. Anything in the image that would move in reality stays frozen, and frozen motion reads as an error. Findings from our first DepthFlow tests: the failure is always a *moving thing caught mid-motion*.

## Avoid in base images
- Birds in the sky (can't stand still mid-flap)
- Breaking waves, spray, splashes
- Flames and flickering candles
- Wind-blown hair, cloth, banners
- Falling rain or snow in mid-fall
- Rotating objects with visible blur (beams, fans, wheels)
- Anything that is the obvious source of the scene's motion (even a lighthouse can feel wrong, because it "should" turn)

## Use instead
- Still water, glassy sea, wet stone
- Suspended mist, fog banks, frozen ash or snow
- Sleeping architecture: lighthouses with lantern off, halls, doorways, windows
- Statues, silhouettes, empty chairs, mirrors, glass
- Candles in glass, lanterns (unlit or with a steady glow)
- Long shadows, backlight, silhouettes against a sky

## Add real motion later, as separate layers
| Motion | Layer |
|---|---|
| Fog drifting | stock fog clip, screen blend |
| Embers, dust, ash | particle overlay clip or Remotion particles |
| Rain, snow | stock overlay |
| Light beam sweeping | shader / CSS gradient animated over the still |
| Water shimmer | displacement-mapped overlay |
| Birds | separate transparent sprites animated in code, kept sparse |

## Composition for depth
- Clear foreground / midground / background planes: depth estimation works best with obvious layering.
- Leave negative space where lyrics will appear.
- Avoid thin repeating structures (fences, grids) near the edge; they tear when parallax shifts.
- Generate slightly wider than the video frame so the camera has room to move without revealing edges.
- No text or logos in the image.

## Prompt pattern for FLUX
```
<subject in a frozen moment>, <depth cues: foreground/midground/background>, <static atmosphere>,
<palette + one warm accent>, cinematic lighting, painterly yet photorealistic,
no people, no text, nothing in motion, no birds, no breaking waves
```

## Test set to run when the image pipeline is available
1. Frozen sea at blue hour with a dark lighthouse (lantern off).
2. A lantern room with a single steady amber glow.
3. A forest of mirrors in fog.

Judge each by: does a 6-second dolly/orbit look like a place or like a glitch?
