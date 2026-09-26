# Lesson template

Every ORBIT lesson has every part below. Copy the skeleton, fill each part, and
tick the checklist. STYLE.md explains the why of each rule; this file is the
what. `npx vitest run src/curriculum/lessons.test.ts` enforces everything the
checklist marks **(checked)**.

Models to read first: `t0_m01_algebra_precalc/01-signed-numbers-and-fractions.md`
and any lesson in `t0_m00_basecamp/`.

## The skeleton

````markdown
---
id: lNN-short-slug
title: Plain title a beginner would recognise
minutes: 20
covers:
  - one of the module's topic strings, copied exactly
---

An everyday picture a 12-year-old already knows (a pizza, a car's speedometer,
a skateboard ramp), in two or three short paragraphs. Then the idea's real name
in **bold** with a one-line meaning, and where it lives on a real rocket or
spacecraft. Mark the first word she might not know as a
**[[context phrase|note-id]]**.

## First idea

Intuition first, in everyday words. Then the precise rule or definition. Then
the steps, every one shown and narrated ("multiply both sides by 2, so…").
Say how to read each symbol aloud the first time it appears: read $\dot{y}$ as
"y dot". Units and typical sizes.

::: key
The result to carry away, in the same notation as the module's flashcards.
:::

::: example A short title
A real problem with real numbers (checked with python3), worked step by step to
an answer with units, and a sanity check at the end ("about 8 m/s, a sprinter's
speed, so that makes sense").
:::

::: warning
The mistake people actually make here, and how to catch it.
:::

::: note Why it has to be true
A proof or derivation, after the intuition, for the curious.
:::

## Second idea

…same shape. At least two `::: example` blocks in the whole lesson.

## Check yourself

::: check
A question: recall, understanding or applying it (four to six of these).
:::

::: answer
The answer, worked out in full, not just the number.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
|---|---|---|
| … | … | … |

One or two sentences on what the next lesson builds on this.

::: context note-id A short headline, not the phrase again
40–120 words (15–260 allowed) explaining the word, the why behind a step,
where the word comes from, how engineers really meet it, or where it comes back
later. About one note in three gets a picture:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <!-- dark ink #1f2a44, blues #1d6fd1 / #8fb8f0, red #b4232c, orange #f2b880, grey #6c7a93 -->
</svg>
```
:::
````

## The checklist

**The file**
- [ ] File named `NN-slug.md` in `src/curriculum/lessons/<moduleId>/`, numbered with no gaps. **(checked)**
- [ ] Header has `id`, `title`, `minutes` and `covers`, and each `covers` line is one of the module's topic strings, copied exactly. Across the module's lessons, every topic is covered. **(checked)**
- [ ] `minutes` is about prose words ÷ 180, plus 2 per worked example. **(checked, roughly)**
- [ ] 1,400–3,200 words of prose (600–7,000 is the hard limit). **(checked)**

**The voice** (STYLE.md → Voice)
- [ ] It opens with an everyday picture, before any symbol.
- [ ] Short sentences. Each new term is bold, with a one-line meaning, the first time it appears.
- [ ] How to read each symbol aloud is said once.
- [ ] Every step is shown and narrated; nothing is "clearly" or "obviously".
- [ ] American everyday words, SI units.
- [ ] Read it once, cold, as a bright 12-year-old would, and fix whatever loses you.

**The substance**
- [ ] One `##` section per idea: intuition → precise rule → steps → units and sizes.
- [ ] At least two `::: example` blocks, with real numbers computed with python3. **(checked)**
- [ ] `::: key` blocks carry every flashcard fact, in the card's notation.
- [ ] `::: warning` blocks where learners really slip.
- [ ] Every quiz question in the module can be answered from the lessons, but no lesson restates one.
- [ ] Any code block runs as written.
- [ ] `## Check yourself` has 4–6 `::: check` blocks, each followed by a full `::: answer`. **(checked)**
- [ ] `## Summary` has a table and a line pointing to the next lesson. **(checked: the Summary exists)**
- [ ] The arithmetic is right and the maths renders in KaTeX. **(checked)**

**The context notes** (STYLE.md → Context notes)
- [ ] 4–15 notes, each opened by a phrase marked `[[phrase|id]]` in the lesson. **(checked)**
- [ ] Notes sit after `## Summary`, in the order their phrases appear, and nothing else follows them. **(checked)**
- [ ] Ids are lowercase words and dashes, unique in the lesson; each note has a title and 15–260 words. **(checked)**
- [ ] No marks in the header, headings, code, links, tables or maths.
- [ ] Each note earns its place: a word she may not know, the why told another way, where a word comes from, real-world context, a picture, or a bridge to later.
- [ ] About a third have one `svg` picture, drawn correctly (count the slices, check the angles), following the picture rules. **(checked: safe and well-formed)**
- [ ] Every fact is true; numbers checked with python3.

**The module**
- [ ] When every lesson in the module is done, add an empty `.plain-voice` file to the folder and run `npm run lessons:manifest`.
- [ ] A module that is new (it had no lessons) carries notes from its first lesson: the validator requires them in every module that is not on the old-lessons list in `lessons.test.ts`. **(checked)**
