# kinetic-lyrics

`verse1-mirror.html` — test of two lyric lines as kinetic typography over a frost shader.

- Open in a browser. Click to start; "Load audio" plus the `Line at [s]` field syncs the lines to a track you load locally (the audio file is not in this repo).
- `render(t, now)` is a pure function of time: port it to Remotion by mapping `t = frame / fps`.
- Replace the text and per-word behaviours to reuse for another song; see [docs/threejs-and-kinetic-type.md](../../docs/threejs-and-kinetic-type.md).
- Next step: read word times from `timing.json` instead of the hard-coded `data-t` values ([docs/audio-sync.md](../../docs/audio-sync.md)).
