# Learn to code lesson template

Every Learn to code lesson has every part below. The file format is in
`parse.ts`; the voice and the context-note rules are the same as the module
lessons (`src/curriculum/lessons/STYLE.md` → Voice, Context notes). The checklist
marks with **(checked)** what `npx vitest run src/learn/learn.test.ts` enforces.

## The skeleton

````text
=== term2-01 | Wildcards: many files, one pattern
--- teach
One or two sentences that link to what she just learned ("Last lesson you
moved files one at a time.") and say what this one lets her do.

The idea in everyday words first, with a picture she already knows. Then the
real name in **bold** with a one-line meaning. Mark any word she may not know
as a [[context phrase|note-id]].

A tiny example she can read top to bottom, with what each line does:

```
~/project $ echo *.txt
notes.txt todo.txt
```

Then the next small step, and another example. One new idea per step; never
two new commands in the same sentence.

**Watch out:** the one mistake people really make here, and how to spot it.

::: context note-id A short headline, not the phrase again
40–120 words (15–260 allowed): what the word means, an everyday comparison,
why it matters when you do this for real, or where it comes back later. About
one note in four gets a small svg picture (same rules as module lessons).
:::
--- task
One clear thing to do, in the words the explanation used. Name every file,
folder and value she needs. Nothing the explanation did not teach.
--- starter
(unchanged unless it was wrong)
--- solution
(unchanged unless it was wrong)
--- hint
First hint: which idea from the explanation to use.
--- hint
Second hint: closer, almost the command.
--- hint
Last hint: the answer's shape, explained.
--- check …
(unchanged unless it was wrong)
````

## The checklist

**The voice**
- [ ] It opens by linking to the lesson before, then says what this one is for.
- [ ] Everyday picture before any jargon. Short sentences. Each new term is bold with a one-line meaning.
- [ ] One new idea per step, each with its own tiny example. A dense lesson becomes two lessons (new id, same course, placed next to it) rather than one wall of text.
- [ ] Every symbol and flag is said in words the first time (`-r` is "recursive: go into every folder inside").
- [ ] The task only asks for what the explanation showed. Read it cold as a bright 12-year-old who just finished the lesson before.
- [ ] **The examples never give the answer away.** Show the idea on different names, files, values and data from the task, and show the pieces one at a time rather than the finished answer. The task should make her adapt or combine what she saw, not copy it. **(checked: `giveaway.ts`, no solution word for word in an example, and no two-line-or-more solution that is an example with the names swapped)**
- [ ] Two or three hints, from gentle to nearly the answer. **(checked: at least one)**

**The context notes**
- [ ] 3–10 notes in the explanation (`--- teach`), each opened by a `[[phrase|id]]` mark in it; none in the task. **(checked)**
- [ ] Notes sit at the very end of the explanation, in the order their phrases appear. **(checked)**
- [ ] Each note 15–260 words; pictures safe and correct. **(checked)**
- [ ] No marks inside code, inline code, links or headings.
- [ ] Every fact true. Commands in notes actually work.

**The code** (do not break it)
- [ ] `starter`, `solution` and every `check` stay exactly as they were unless one is actually wrong; if you fix one, say so in your report.
- [ ] Lesson ids never change: her progress is stored under them. A new lesson gets a new id.
- [ ] `npx vitest run src/learn` passes. **(checked: every Terminal and Git solution passes and the starter does not)**

**The course**
- [ ] When every lesson in the course is done, add `@plainvoice true` to the file's header. From then on the validator holds the course to the notes rule.
