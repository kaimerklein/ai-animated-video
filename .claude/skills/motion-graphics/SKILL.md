---
name: motion-graphics
description: Plan and build a premium 3D motion graphic (explainer, process story, polished intro) in three.js with our glass-and-glow house style, for any topic. Guides brief, concept and palette sketches, shot list, draft PoC, timecode review and render.
---

# Motion graphics: glass, glow and a camera that travels

Use this skill whenever someone wants a polished 3D motion graphic or explainer about any subject: a process, a system, a product, a concept. It is half template, half guided practice. The **house style** below is fixed. The **option menus** are where each topic gets its own shape. The **process** is iterative: sketches before code, a rough draft before polish, review by timecode.

Background and sources: `docs/threejs-motion-graphics.md`. Reference implementation: `tools/motion-graphics/pizza-a2.html`. Read it for the code skeleton, never copy its content, shots or palette.

Also follow `.claude/skills/video-house-style/SKILL.md` for mechanics (timing, frame maths, captions).

---

## 1. House style (always)

These blocks make a piece recognisably ours. Adapt their colour and content, keep their form.

| Block | Rule |
|---|---|
| World | Dark (or, by choice, light) dome lit by 3–4 large soft colour blobs from the palette. Never a flat background. Exponential fog in the base colour. |
| Stations | Each step of the story lives at its own place in 3D. Header: small accent eyebrow (`STEP 02`, or a category) over one or two large words in a heavy grotesk. |
| Glass panels | Rounded extruded slabs with a fresnel-glass look. Their face is a canvas texture redrawn from `t`: all UI motion lives there (lists that tick, counters, gauges, rings, small charts). |
| Connector | A glowing tube along a CatmullRom curve through all stations, drawn on by a bright head. It is the thread of the story and its progress bar. |
| Hero objects | The subject itself, built in 3D at each station, and preferably transforming from one station to the next so the story is visible without text. |
| Camera | Slow drift while the viewer reads; fast expo-eased whip between stations with a small rise and an FOV kick. FOV stays within 38–60°. One signature move per station, no two stations alike. |
| Props | A few clear glass spheres, rings, icosahedra plus small glowing orbs and particles for depth. Always off the camera path and never over text. |
| Light story | Light carries the arc: the scene warms, cools or brightens as the story progresses, with at most one flash at the climax. |
| Finish | HDR target, subtle bloom on highlights only, ACES-style tone map, slight chromatic aberration at the edges, vignette, fine grain. |
| Type | One heavy display grotesk for headers and big numbers, a mono for units and data, sentence case for captions. Big numbers carry units in the accent colour. |
| Captions | Lower third, no box, soft bottom shade. The line fades in from a slight blur and lift; spoken words brighten, the current word takes the accent colour and lifts slightly; the line leaves upwards. |

### Banned defaults
- Typewriter text reveals (letter by letter). Use word or line motion.
- Neon purple-to-blue gradients, unless they are the brand.
- Flat glowing text boxes, harsh inner shadows, drop-shadowed cards.
- Linear camera pans, FOV beyond 60°, cuts without motion.
- Lens flares, rotating 3D logos, generic "tech" particle tunnels without meaning.
- Text that sits over a busy object, text under ~3 % of frame height, more than ~12 words on screen at once besides captions.
- `Math.random()`, `Date.now()`, real-time GSAP or any wall-clock dependency.

---

## 2. Option menus (choose per topic)

Present options as **sketches** (inline visuals), at most 3–4 per decision, with one recommendation and a one-line reason. Never ask about something the brief already settles.

**A · Story structure**
- **Journey**: stations along the connector path; objects or panels at each stop. Best for processes and pipelines.
- **Object hero**: one central object transforms through the steps while panels ride an orbit ring. Best for one product or one thing that changes.
- **Card deck**: panels fly forward in depth, one big number or visual per panel. Cheapest; best for lists, KPIs, short social clips.
- **Macro → micro → macro**: start wide, tunnel through layers of structure (system → part → component → material), pull back out. Best for "how does it work inside".
- **Exploded diagram**: an assembly separates into labelled layers, then reassembles. Best for architecture and anatomy.
Structures can combine (a journey with one macro tunnel at the key station).

**B · Palette**: derive 3–4 from the subject's own world (its materials, light, brand). Show each as a mini frame with the objects on the path plus 5 swatches: base, blob 1, blob 2, accent, text. One accent colour only. A dark base is the default; a light base is allowed when the subject calls for it, with subtler glow.

**C · Hero-object technique** (mix per station)
- Procedural primitives and parametric morphs (sphere ↔ disc, ring ↔ line). Best default: deterministic, light, morphable.
- Particle clouds that re-form (points morph between target shapes). For abstract, data or "becoming" moments.
- Canvas-textured planes and slabs (screens, documents, diagrams on glass).
- Instanced repetition (racks, cells, grains, nodes) for scale and the macro tunnel.
- Supplied glTF assets only when the user provides them; otherwise do not invent asset downloads.

**D · Panel UI vocabulary**: checklist with ticks and strike-through, counter with unit, ring timer, half-gauge, progress bar, bar or line chart that grows, code editor, chat bar, node diagram, comparison table (max 3 rows). One idea per panel.

**E · Camera signature moves**: orbit around a hero, low macro slider, push-in, top-down crane, barrel roll on a whip, fly through a portal into light, tunnel along instanced structure, rack-focus feel by fog, pull-back reveal of every station. Pick per station by what the moment means (growth → crane up, entering → fly-through, finishing → reveal).

**F · Pace and feel**
- Length: social 15–30 s; explainer 60–120 s; intro 8–15 s.
- Author choreography in story seconds and stretch with a `SLOW` factor. Ambient motion (fire, particles, grain, camera breathing) always runs on real seconds.
- Motion feel: smooth (default) or **on twos** (objects and panels hold each pose for 2 frames at 24 fps or 12 poses per second; camera stays smooth). Offer a toggle in the draft.

**G · Narration**: none, on-screen captions only, or captions synced to a voice track (`timing.json` from forced alignment). Write narration as spoken sentences, 6–14 words, one idea each. Every number in narration and on panels comes from the data file.

**H · Delivery**: review page (published artifact), mp4 via deterministic capture (`?capture` + `window.render(t)` → ffmpeg), or a Remotion port for longer edits.

---

## 3. Process

Keep a task list. Every step ends with something the user can see and choose from.

0. **Brief and intake.** Topic, audience, purpose, length, language, where it will be shown (16:9, 9:16, 1:1). Brand intake if any: colours, logo SVG, fonts, tone. Create the **data file** (a single `DATA` object): every number, unit and label that will appear. Ask only what you cannot infer.
1. **Concepts.** Three concept sketches built from the house blocks, differing in structure (menu A) and in what the hero objects are. Recommend one.
2. **Palette.** 3–4 palette sketches (menu B). Recommend one, with the light story it enables.
3. **Shot list.** A table: shot, story time, hero object and its transformation, camera move, panel UI, narration line. Total length and pace. Wait for approval or edits.
4. **Draft PoC.** One self-contained HTML file: rough geometry, but the real camera path, timing, connector, panels and captions. Publish it with a review deck: play/pause, scrubber, one chip per shot, ←/→ frame step, toggles for options still open (e.g. on twos). Draft first, detail later; this keeps tokens and iterations cheap.
5. **Review by timecode.** Ask for feedback per shot chip ("Bake: card covers oven"). Apply, republish to the same artifact, repeat. Speed and readability first, then camera, then objects, then finish.
6. **Polish.** Materials, object detail, micro-animations, light story, final grade. Only after structure and timing are approved.
7. **Self-check, then render.** Check still frames at the middle and end of every shot: no overlap, text ≥ 3 % frame height, readable contrast, nothing outside the 5 % safe area, all numbers match the data file. Then capture.

Save each approved decision (concept, palette, shot list) next to the file or in the consuming project repo, so a later session can continue.

---

## 4. Build rules

**Stack**: three.js r128 UMD from cdnjs; post-processing from `cdn.jsdelivr.net/npm/three@0.128.0/examples/js/` (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader). One HTML file. Fonts from Google Fonts, awaited with `document.fonts.load` before any canvas text is drawn.

**Determinism**
- `render(tr)` is the only entry point; everything is a pure function of `tr` (real seconds). Story time `t = tr / SLOW`.
- Randomness only via a seeded `hash(n)`. Particle motion as closed-form functions of time (looping age with `%`), never integrated state.
- Expose `window.render`, `window.DURATION`, `window.FPS`, `window.ready` (fonts loaded). `?capture` renders a fixed 1920×1080 stage without the deck and with `preserveDrawingBuffer`.
- GSAP is allowed only as a paused timeline driven by `tl.seek(t)`.
- Honour `prefers-reduced-motion` (start paused on a meaningful frame).

**Code skeleton (in this order)**
config (durations, `SLOW`, `WHIP`, shots) → `DATA` → narration → pure helpers (clamp, lerp, seg, easings, hash) → renderer and scene → world dome shader → lights → stations and connector curve → shared materials (glass shader) → one `updateX(t)` per station → props and particles → camera poses per shot (`pose(i, u)` + whip blend) → panels (canvas faces, redrawn only when their time key changes) → post chain and grade → captions → `render(tr)` → sizing → transport and review deck.

**Performance**: pixel ratio ≤ 1.5 in preview; geometry morphs update only when their parameters change; canvas faces redraw at most 30 times per second of timeline; ≤ ~3000 particles total.

**Writing narration and labels**: spoken, plain, active; units always explicit; no claim the data file does not back.

---

## 5. Prompt shape (when delegating or briefing a fresh session)

1. Specs: duration, aspect, resolution, fps, style keywords ("glassmorphism, premium, sleek").
2. Render method: frame by frame via `window.render(t)`; everything driven by `t`.
3. World and materials, palette tokens.
4. Camera behaviour: drift within, expo whip between, signature move per station.
5. Shots: `name (start–end s): hero object + transformation, panel UI, camera move, narration`.
6. Throughout: connector, props, light story, captions.
7. Finish and checks: grade, readability rules, still-frame check per shot before the full render.
