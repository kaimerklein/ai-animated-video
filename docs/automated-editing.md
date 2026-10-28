# Automated editing with Claude Code + Remotion ("code-as-video")

Source: a creator walkthrough by Christian Peverelli on fully automating video *editing* (cuts, zooms, captions, lower thirds, music ducking) with Claude Code, custom skills and Remotion. Notes summarised here; the time/cost figures are the creator's claims, not our measurements.

This complements our approach: we already build *visuals* as code. This walkthrough applies the same idea to *editing recorded footage* — directly relevant for explainer videos, and partly for music videos (captions, timing, skill files).

## The stack in the walkthrough

| Tool | Role | Our equivalent / decision |
|---|---|---|
| Claude Code (CLI) | Orchestrator: writes the video code, imports assets, runs scripts | Same. Runs on Kai's Mac ([claude-code-setup.md](claude-code-setup.md)) |
| Remotion | Video engine: React → MP4/WebM | Same ([remotion.md](remotion.md)) |
| Descript | Pre-processing of A-roll: transcription, rough cut, remove silences, filler words, bad takes | Only for explainers with recorded speech. Music videos have no A-roll. Local alternative: Whisper transcript + a silence-cut script with FFmpeg |
| Whisper / transcript API | Word/sentence timestamps that drive cutaways, zooms, b-roll | Same idea as our `timing.json` ([audio-sync.md](audio-sync.md)) |
| FFmpeg | Slicing, audio merging, waveforms, final encode (also used by Remotion internally) | Same |
| Custom Claude skill pack | Instructions teaching Claude Remotion syntax, pacing and the creator's style | Adopted: official Remotion skills + our own `.claude/skills/video-house-style/` |

## Core concepts

### 1. Code-as-video
No NLE timeline (Premiere, Final Cut). Every cut, overlay, zoom and transition is a React component with frame props. Result: deterministic, diffable, editable by talking to Claude. This is exactly our "timeline = pure function of time" principle, now extended to editing.

### 2. Skill files prevent errors
The key learning: without explicit rules, Claude produces invalid Remotion hooks or confuses seconds and frames. A structured skill file fixes that. Two layers:
- **Syntax layer** — how to use `<Sequence>`, `<AbsoluteFill>`, `spring()`, `interpolate()`, media components, frame maths. Covered by the **official Remotion agent skills** (`npx skills add remotion-dev/skills`; includes `/remotion-best-practices`, `/remotion-markup`, `/remotion-captions`, `/remotion-studio`, `/remotion-render`, `/remotion-docs`).
- **Style layer** — fonts, palette, accent rules, zoom ratios, caption look, sound-effect triggers, b-roll placement. This is ours: [`.claude/skills/video-house-style/SKILL.md`](../.claude/skills/video-house-style/SKILL.md). Project repos (Ilyra, Juno) can add their own style skill on top.

### 3. Frame-accurate timing from the transcript
Claude reads timestamps (seconds) from the transcript and turns them into `from` / `durationInFrames` on `<Sequence>`. Always via one helper (`sec(t) = Math.round(t * fps)`), never inline guesses. Same as our `timing.json` → Remotion plan.

## Workflow (adapted to us)

1. **Pre-process** (explainers only): record A-roll / screen capture → transcribe → cut silences, fillers, bad takes → export cleaned media + word-level transcript (JSON/SRT).
   Music videos skip this; the "cleaned media" is the final Suno mix, the transcript is the forced-aligned `timing.json`.
2. **Set up**: Claude Code in the video project; skills loaded (official Remotion + house style); assets in `public/` (video, audio, `timing.json`, b-roll, graphics).
3. **Generate**: Claude writes the composition from the transcript + style skill: sequences, zooms on emphasis words, captions, lower thirds, music bed with ducking.
4. **Review**: Remotion Studio (`npx remotion studio`) in the browser; give conversational fixes with timecodes ("zoom at 01:22 more subtle, add a swoosh").
5. **Render**: `npx remotion render <entry> <CompositionId> out/video.mp4`.

## Automations worth reusing

| Automation | How | Use for us |
|---|---|---|
| **Punch-ins / zooms** | `interpolate()` on `scale` (e.g. 1.0 → 1.1) around emphasis words found in the transcript; `spring()` for snappy entry | Explainers; in music videos as slow push-ins on key lyric words |
| **Kinetic captions** | Word-by-word highlight driven by word timestamps (`@remotion/captions` helps) | Explainers: standard captions. Music: our in-world kinetic type stays the hero; plain captions only as an option for Shorts |
| **Lower thirds / callouts** | Claude detects key terms or chapter headings in the transcript and inserts animated cards | Explainers |
| **Audio ducking** | Music volume as a function of frame: down while speech is active, up in pauses / full-screen b-roll (`<Audio volume={f => …}>` driven by transcript gaps) | Explainers (narration + music bed) |
| **Sound-effect triggers** | Rules in the style skill (whoosh on transition, tick on callout) | Explainers; sparingly |

## Learnings (from the walkthrough)

1. **Determinism beats pixel generation.** Code instead of generated frames: no artefacts, exact cuts, instant edits. Confirms our "cheap first" choice.
2. **Time and cost.** Creator reports editing time dropping from 4–8 h to 15–30 min per video (mostly review), and API cost far below a freelancer. Treat as an upper bound until we measure our own.
3. **The skill file is the lever.** Invest in the syntax + style skills before scaling to many videos.
4. **Human in the loop.** Fully automatic overnight runs are possible, but the best result is AI-generated base + human review in Studio.

## Open points
- Descript vs. a local route (Whisper + FFmpeg silence cut) for explainer pre-processing — decide when the first explainer is recorded.
- Measure our own edit time on the first explainer and the first music video.
- HeyGen HyperFrames (mentioned in a related video) is still to evaluate ([references.md](references.md)).
