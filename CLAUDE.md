# ai-animated-video — project instructions

Reusable toolbox for code-built, low-cost animated video (music videos now, explainers later). Owner: Kai Merklein. Kai may talk to you in German; write all repo content in English.

## Principles
- **Timeline = pure function of time.** Every scene exposes `render(t)` (or a Remotion component driven by `useCurrentFrame`). No hidden state, no wall-clock dependence. This is what makes a browser prototype portable to an offline Remotion render.
- **Cheap first.** Prefer stills + parallax + shaders + overlays + typography over AI video generation. Use AI video only for deliberate exceptions (e.g. lip-sync scenes).
- **Stills must survive camera-only motion** — see `docs/still-world-rules.md`.
- **Separate method from content.** Lyrics, characters, concepts live in the project repos (e.g. `ai-music-Ilyra-solyane`). This repo holds tools, docs, generic examples.
- **Public repo.** Do not commit private story material, unreleased lyrics beyond short test snippets, credentials, tunnel URLs or tokens. Keep personal/hidden song meanings out entirely.

## Layout
```
docs/      Method and findings (start at README.md)
tools/     Runnable code: kinetic-lyrics, threejs-scenes, remotion-visualizer, comfyui, depthflow
projects/  Pointers to consuming repos (no content copied)
```

## Rules for adding things
- Browser prototypes: one self-contained HTML file, three.js r128 UMD from cdnjs, honor `prefers-reduced-motion`.
- Remotion code: TypeScript, one `Composition` per video, shared components in `tools/remotion-visualizer/src/components`. Follow `.claude/skills/video-house-style/SKILL.md` plus the official Remotion skills (`npx skills add remotion-dev/skills`).
- ComfyUI workflows: export as API-format JSON into `tools/comfyui/workflows/` with a short note on required model files.
- Binaries (mp3, wav, mp4, png, jpg, blend, glb, …) go through Git LFS (`.gitattributes`). Never commit raw ComfyUI output dumps; only used images.
- Secrets (ngrok token, bearer tokens) only in `.env` (git-ignored).
- Update `docs/roadmap.md` when a decision is made or a task finishes.
- Keep the project repos and this repo consistent: if a technique is proven in a song repo, document the general version here.
