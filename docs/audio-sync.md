# Audio sync: getting timestamps for lyrics

Goal: a `timing.json` with start/end per word (and section markers) for any song, so kinetic type and scene changes line up with the vocal.

## Can I download timestamped lyrics from Suno?
**Not officially, as far as we could find.** Suno's player highlights lyrics in time, but we found no download of LRC/SRT. Options:

| Route | Notes |
|---|---|
| **Local forced alignment** (recommended) | Free, any render. Tools: `stable-ts` (Whisper-based) or WhisperX. Input: the mp3 + the known lyrics. Output: word-level timestamps. |
| LyricTime (third-party) | Upload the final mp3, paste lyrics, adjust timing, export SRT / LRC / VTT. Vendor's own product; judge quality yourself. |
| Suno's internal aligned-lyrics data | Unofficial, undocumented, may break and may conflict with Suno's terms — not relied on. |
| Manual | Play along and set times by hand (the prototype's "Line at [s]" field does this per line). |

## Recommended workflow
1. Put the final mp3 in the project repo (`audio/`).
2. Isolate vocals if the mix is dense (e.g. Demucs) — improves alignment accuracy.
3. Align known lyrics to audio with stable-ts or WhisperX → `timing.json`.
4. Spot-check against the audio: sung words often stretch or slur; fix outliers by hand.
5. Add section markers (intro / verse / chorus / bridge / outro) by ear.

## Suggested `timing.json`
```json
{
  "audio": "audio/thaw.mp3",
  "sections": [{ "name": "verse1", "start": 12.4, "end": 41.0 }],
  "lines": [
    {
      "text": "line text",
      "start": 14.2,
      "end": 18.9,
      "words": [{ "w": "word", "start": 14.2, "end": 14.6 }]
    }
  ]
}
```

## Why it matters
With `timing.json`, hand-set `data-t` times in prototypes become data. The Remotion port reads it and every animation lines up with the real vocal.
