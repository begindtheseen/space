# Brief for parallel lesson writers

You are one of several parallel content writers for ORBIT, a self-study aerospace (GNC) engineering app for a learner who starts at about an 8th-grade level. The repo (begindtheseen/space) is checked out on branch `claude/launchpad-curriculum-expansion-9qxk3f`. Push your work to the branch named below (create it from the current HEAD: `git checkout -b <branch>`), committing module by module. Do NOT open a pull request and do NOT push to any other branch; the coordinating session merges your branch.

THE GOAL: every lesson reads so a curious 12-year-old can follow it, without losing anything an engineer needs, and carries Genius-style context notes (tap a marked phrase → a side panel explains it, sometimes with a picture).

READ FIRST, carefully, before anything else:
0. src/curriculum/lessons/TEMPLATE.md — the skeleton and checklist of everything every lesson must have. Every lesson you write or rewrite follows it, and every lesson carries context notes: no exceptions.
1. src/curriculum/lessons/STYLE.md — all of it; especially "Voice", "Context notes" (syntax, what earns a note, SVG picture rules) and the `.plain-voice` marker.
2. The models: src/curriculum/lessons/t0_m01_algebra_precalc/01-signed-numbers-and-fractions.md (voice + notes), plus any two lessons of src/curriculum/lessons/t0_m02_trigonometry/ and src/curriculum/lessons/t0_m00_basecamp/ to see the standard.
3. For each of your modules: its definition (search `id: '<moduleId>'` in src/curriculum/*.ts) — topics, objectives, cards (flashcards), quiz, exercises.

HOW TO WORK — fan out with the Agent tool (background subagents, general-purpose), at most 4 running at once:
- For a module that HAS lessons (rewrite): give each subagent 3 lessons of one module. Tell it to rewrite each in place in the plain voice exactly like the models (everyday picture first → precise rule → where it lives on a real vehicle; short sentences; bold each new term with a one-line meaning; say how to read symbols aloud; show and narrate every step; proofs in a `::: note` "Why it has to be true" after the intuition; sanity checks; American everyday words, SI units), keep ALL substance (every formula, derivation, key block, worked example, warning, every Check yourself question with its full answer — reword for clarity, keep numbers; fix anything actually wrong and report it), keep frontmatter `id` and `covers` exactly, update `minutes` (≈ prose words/180 + 2 per worked example), prose 1,400–3,200 words, and add 6–12 context notes at the very end after the Summary (about a third with an SVG picture, drawn precisely). Every flashcard fact must stay in a `::: key` block in the card's notation; every quiz question must stay answerable (never restate it); exercise prerequisites must stay taught. Compute every number with python3. Code in lessons must run (run Python with python3; C++ with g++ if present).
- For a module with NO lessons (new): first plan it yourself — 6 to 14 lessons that together cover every topic string in the module's `topics` (each lesson's `covers` lists 1–3 topics verbatim), in the order a beginner needs them, with file names `NN-slug.md` and ids `lNN-slug`. Then give each subagent 2–3 of those lessons to write from scratch in the same plain voice with notes, teaching everything the module's cards, quiz and exercises need, and assuming only the module's prerequisites. Tell each subagent the whole lesson plan so lessons connect ("next lesson…").
- Each subagent validates its own files: `LESSON_MODULE=<moduleId> NOTES_REQUIRED=<moduleId> npx vitest run src/curriculum/lessons.test.ts` (ignore failures in files other subagents are still writing, and the "matches the files on disk" manifest check), then reads each lesson once as a bright 12-year-old seeing it cold and fixes anything that would lose them. Tell subagents to use uniquely named scratch files (the scratch dir may be shared).

WHEN A MODULE IS DONE:
1. `LESSON_MODULE=<moduleId> NOTES_REQUIRED=<moduleId> npx vitest run src/curriculum/lessons.test.ts` passes for every lesson in the module.
2. `touch src/curriculum/lessons/<moduleId>/.plain-voice`
3. `npm run lessons:manifest`
4. `git add src/curriculum/lessons/<moduleId> src/curriculum/lessons/manifest.ts && git commit -m "<Module title>: plain voice and context notes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01M8tqW58keMn4CYBgYhVHG7"`
5. `git push -u origin <your branch>` (retry up to 4 times with 2/4/8/16 s backoff on network errors).
Only ever change files inside your modules' lesson folders plus manifest.ts. If a module definition (cards/quiz) is wrong, do not edit it — list it in your final report.

Keep going until every module on your list is committed and pushed. If you hit a usage limit, wait and continue. Finish with a short report: per module — lessons, notes, anything wrong that you fixed, anything in the module definitions that needs changing.
