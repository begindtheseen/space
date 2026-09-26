# Voices for the natural read-aloud voice

Style vectors for Kokoro-82M, the neural text-to-speech model the app reads
lessons with (see `src/lib/voice/`). Each file is 510 × 256 float32 numbers:
one style per phoneme count.

They are copied unchanged from the `kokoro-js` package (version 1.2.1,
`voices/`), which redistributes them from
[hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M).
Kokoro-82M and its voices are licensed under the Apache License 2.0.
