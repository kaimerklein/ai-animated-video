# motion-graphics

Premium 3D motion graphics built with three.js + shaders (method: [docs/threejs-motion-graphics.md](../../docs/threejs-motion-graphics.md)).

- `pizza-a2.html` — PoC v2 (draft) of the skill-in-progress: concept A2 "recipe journey", palette "wood-fired night". 102 s (story authored in 32 s, stretched ×3.2), 8 shots (ignite, mix, knead, proof, stretch, top, bake, reveal). Glowing connector path, drift + expo-whip camera, morphing dough (sphere ↔ pizza base), live canvas faces on glass cards, HDR bloom + grade, word-synced narration captions, `RECIPE` data object as the single source for numbers, optional motion on twos (`?twos` or the deck button).
  - Open in a browser; shot chips jump to each shot for still-frame review; ←/→ step one frame at 60 fps.
  - `?capture` hides the deck and renders a fixed 1920×1080 stage; drive it with `window.render(t)` after `await window.ready` (see `window.DURATION`, `window.FPS`).
