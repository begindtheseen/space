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

Direct, precise, unhurried. Second person. Short paragraphs. Explain the why. No
"simply", "obviously", "just". No emoji. Do not apologise for the mathematics.
Use en-dashes and em-dashes freely; use the module's own terminology.

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
