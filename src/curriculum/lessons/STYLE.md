# Writing ORBIT lessons

A lesson is the teaching. The learner may know nothing beyond the module's
prerequisites, may have no other book open, and must be able to answer every
flashcard and question in the module afterwards. If a fact is on a flashcard,
the lesson states it. If a question needs an idea, the lesson teaches the idea.
If a result matters, the lesson derives it instead of saying "it can be shown".
Never write "see the textbook" for anything the module tests.

## Files

- One markdown file per lesson at `src/curriculum/lessons/<moduleId>/<nn>-<slug>.md`,
  numbered `01`, `02`, … in study order; `slug` is lowercase letters, digits, dashes.
- Every file opens with this header, then the body:

  ```
  ---
  id: l03-logarithms
  title: Exponentials and logarithms
  minutes: 24
  covers:
    - exponentials and logarithms
    - sequences, series, and sigma notation
  ---
  ```

  `covers` lists the module's `topics` strings **verbatim** (copy them from the
  module source). A module's lessons together must cover every topic in its list —
  the validator fails otherwise. One lesson covers one to three topics; a big topic
  may take a whole lesson; the same topic may be listed by two lessons if both teach
  part of it.
- 6 to 14 lessons per module. Reading time in `minutes` ≈ prose words / 180, plus 2
  per worked example. A lesson is 1,400–3,200 prose words (the validator floors at
  600 and caps at 7,000; math and code do not count).

## Shape of a lesson

Use `##` for sections and `###` for subsections. Never `#` — the title is the h1.

1. **Opening** (no heading): two or three paragraphs. What this is, why a GNC engineer
   needs it, where it shows up on a real vehicle. Concrete, not motivational.
2. **Concept sections**, one `##` per idea, in the order a learner needs them. For each:
   plain-language intuition first, then the precise definition or statement, then the
   derivation with its steps visible, then units and typical magnitudes. Define every
   symbol the first time it appears.
3. **Worked examples**: at least two per lesson, in `::: example <short title>` blocks,
   with real numbers carried through to a result with units. Prefer aerospace numbers
   (a Falcon 9 first stage, LEO orbital speed ≈ 7.7 km/s, g₀ = 9.80665 m/s², Earth
   μ = 3.986 × 10¹⁴ m³/s²) when they fit; otherwise any honest numbers. Compute every
   number with `python3` before writing it down.
4. **Key ideas** in `::: key` blocks: the results to carry away, stated the way the
   module's flashcards state them, same notation.
5. **Common mistakes** in `::: warning` blocks, wherever learners actually slip.
6. `## Check yourself`: four to six questions, each a `::: check` block immediately
   followed by a `::: answer` block that works the answer out fully. Mix recall,
   understanding and application. Do not reuse the module's quiz questions.
7. `## Summary`: a table of the symbols, formulas and facts from the lesson, and one
   or two sentences on what the next lesson builds on it.

Other blocks: `::: note` for asides. Blockquotes are fine for quoted definitions.

## Context notes

Like the notes on an annotated lyric sheet: a phrase in the lesson is marked, and
tapping it opens a panel beside the lesson with the story behind it. The lesson
must read completely without them — a note is for the moment a word or a step
stops her, or she wants to know more.

Mark a phrase inline, and put every note at the very end of the lesson, after
`## Summary`, in the order the phrases appear:

```
… the **[[denominator|numerator-denominator]]**, says how many pieces …

::: context numerator-denominator Where the words come from
Numerator comes from the Latin for "counter" …
:::
```

The id is lowercase words and dashes, unique in the lesson. Marked phrases may
sit inside bold. Each note needs a title (a short headline, not the phrase
again) and 15–260 words; aim for 40–120. A note holds prose and math only — no
other `:::` blocks inside it.

**What earns a note** (4–15 per lesson in a plain-voice module):

- a word the lesson uses but a 12-year-old may not know, and that the lesson
  does not stop to teach ("oxidizer", "dimensionless");
- the *why* behind a step or a rule, told a different way from the lesson;
- where a word or symbol comes from, when that makes it stick;
- real-world context: how engineers at SpaceX or NASA actually meet this, a real
  vehicle's numbers, a mission that went wrong because of it;
- the picture that makes the idea click;
- a bridge: where this comes back later in the course and what it will be for.

Not: a note on every bold word, a repeat of the paragraph it sits in, or trivia
with no bearing on the lesson. Every fact must be true — check numbers with
python3 and do not invent history.

**Pictures.** Where a picture genuinely helps (about one note in three), add one
fenced `svg` block inside the note. It is shown as an image on a light card:

- `viewBox` required, about 360 wide and 90–220 tall; no width/height needed;
- dark ink on light: `#1f2a44` for lines and text, `#1d6fd1`/`#8fb8f0` blues,
  `#b4232c` red, `#f2b880` orange, `#6c7a93` grey; white fills are fine;
- `font-family="Inter, Arial, sans-serif"`, text at least 11 px, short labels;
- no scripts, event handlers, external links or embedded images; under 16,000
  characters (the validator checks all of this);
- every drawn quantity must be right — count the slices, check the angles.

`t0_m01_algebra_precalc/01-signed-numbers-and-fractions.md` is the model.

Every lesson carries 4–15 notes. The validator enforces it in every module
except the ones written before the rule (`WRITTEN_BEFORE_NOTES` in
lessons.test.ts), which are being rewritten. When every lesson in one of those
is in the plain voice with its notes, add an empty `.plain-voice` file to the
module's lesson folder; the coordinator then takes it off the list. A new
module is held to the rule from its first lesson. TEMPLATE.md has the skeleton
and the full checklist.

## Mathematics

KaTeX renders it. Inline `$…$`, display `$$` on its own line, formula, `$$` on its own
line. Nothing else: no `\(`, `\[`, `\begin{equation}`. Environments that work inside
`$$`: `aligned`, `cases`, `pmatrix`, `bmatrix`, `vmatrix`. Vectors `\mathbf{r}`,
matrices `\mathbf{A}`, unit vectors `\hat{\mathbf{x}}`, derivatives `\frac{d}{dt}`,
`\dot{x}`, `\ddot{x}`, units `\,\mathrm{m/s^2}` inside math. A literal dollar sign in
prose is `\$`. Every formula must parse — the validator renders each one.

Numbers: SI throughout, US customary only when the point is unit conversion. Three
significant figures unless precision is the subject. Say "about" when it is about.

## Markdown the renderer supports

Headings `##`/`###`, paragraphs, `**bold**`, `*italic*`, `` `code` ``, fenced code
blocks with a language tag, `-` lists (continuation lines indented two spaces, one
level of nesting), `1.` lists, `>` quotes, `---` rules, tables (`| a | b |` with a
`| --- | --- |` line), links `[text](https://…)` to https only, and the `:::` blocks
above. No HTML, no images, no footnotes.

Code: Python examples are welcome where they clarify (NumPy conventions), short and
runnable. Show output in a comment.

## Voice

Write so a curious 12-year-old could follow it, without leaving out anything an
engineer needs. Plain does not mean less: every formula, derivation, key fact and
worked number stays. What changes is the order and the words around them.

- **Picture first, then the rule, then the rocket.** Open each idea with something
  the reader already knows — money, a thermometer, a pizza, a recipe, a backpack of
  water bottles — then state the precise rule, then show where it lives on a vehicle.
- **Everyday words before technical ones.** Introduce a term only when it is needed,
  in bold, with a one-line meaning right there ("the **denominator** — the bottom
  number — says how many pieces the whole was cut into"). Say what a symbol is and
  how to read it aloud the first time ("$m_d$, read "m sub d", the dry mass").
- **Short sentences, short paragraphs.** One idea per paragraph. If a sentence needs
  a semicolon, it is probably two sentences.
- **Show the steps.** Write out every arithmetic step in the examples, and say in
  words what each step did. Nothing "follows easily".
- **Proofs are welcome, but after the intuition.** Put a "why it has to be true"
  argument in a `::: note` after the plain explanation, so the reader who wants it
  gets it and the reader who does not can keep going.
- **Check the answer makes sense** in the examples ("more than half, as it should
  be"), because that habit is what catches real mistakes.

Second person, warm and direct. No "simply", "obviously", "just", "clearly",
"trivially". No emoji. Do not apologise for the mathematics, and do not talk down:
the reader is smart and new, not slow. Use en-dashes and em-dashes freely; use the
module's own terminology once it has been introduced.

`t0_m01_algebra_precalc/01-signed-numbers-and-fractions.md` is the model for this
voice.

## Sources and originality

Everything is written fresh for ORBIT. Do not copy or closely paraphrase any book,
course or website; structure and wording are your own. You may mention a resource by
name as further reading ("Stitz and Zeager's *Precalculus* treats this at length").

## Consistency with the module

Before writing, read the module's `objectives`, `topics`, `cards`, `quiz`, `exercises`
and `resources` in its source file. Then make sure:

- every objective is reachable by a reader who has only these lessons;
- every flashcard's fact appears, in the same notation, in a lesson (usually a
  `::: key` block);
- every quiz question can be answered by that reader — teach the idea, but do not
  restate the question or its answer;
- every exercise's prerequisites are taught, including the notation its prompt uses.

## Checking your work

```
LESSON_MODULE=<moduleId> npx vitest run src/curriculum/lessons.test.ts
```

Fix until it passes. It checks the header, numbering, topic coverage, length, the
required sections and blocks, the markdown subset, and that KaTeX can render every
formula. It does not check correctness — that is on you: compute the numbers, check
each derivation step, and read the lesson once as the learner it is written for.

## Video

A lesson may embed video where seeing the thing beats reading about it — a
gimbal moving, a landing burn, a proof drawn out by hand. Use it when it
genuinely teaches, not as decoration or as a break in the text.

```
::: video dQw4w9WgXcQ
Title of the video · Channel name · 12 min
:::
```

The id after `video` is the YouTube id, exactly eleven URL-safe base64
characters. The body is the caption: title, who made it, running time. The
validator rejects a malformed id, so a typo fails the build rather than
rendering a dead panel in the middle of a lesson.

Nothing is downloaded until the learner presses play, and the position is
remembered, so a long video resumes where she stopped.

Rules:

- The lesson must stand on its own without the video. Someone offline, or
  someone who does not want to watch anything, must still learn the topic in
  full from the prose. A video supplements; it never carries a topic alone.
- Link only videos that are publicly available and likely to stay so. Prefer
  university lectures, agency footage and long-standing channels over a
  one-off upload.
- At most two or three per lesson. More than that and the lesson is a playlist.
- Put it near the section it illustrates, not in a block at the end.
