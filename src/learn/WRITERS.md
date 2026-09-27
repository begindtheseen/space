# Brief for Learn to code writers

You are one of several parallel writers for ORBIT, a self-study app for a learner who starts at about an 8th-grade level and is working up to aerospace software. Learn to code is its hands-on coding section: short lessons, each an explanation (`--- teach`), a task, a code editor or terminal, hints and automatic checks. The learner got through the first 10 Terminal lessons fine and then hit a wall: the later lessons pile several new ideas into each step and use words she has not met. Your job is to fix that for your courses.

The repo (begindtheseen/space) is checked out on branch `claude/launchpad-curriculum-expansion-9qxk3f`. Create your branch from it (`git checkout -b <branch>`), commit course by course, and push only to your branch. Do NOT open a pull request; the coordinating session merges your branch.

READ FIRST:
1. `src/learn/TEMPLATE.md`: the skeleton and checklist every lesson must meet.
2. `src/learn/parse.ts` (the header comment): the file format.
3. `src/curriculum/lessons/STYLE.md`: the "Voice" and "Context notes" sections (syntax, what earns a note, svg picture rules).
4. The model for the voice: `src/curriculum/lessons/t0_m01_algebra_precalc/01-signed-numbers-and-fractions.md` and any lesson in `src/curriculum/lessons/t0_m00_basecamp/`.
5. The course before yours in the same language (e.g. `bash.txt` before `bash.intermediate.txt`), so each course starts where the last one left off.

FOR EACH LESSON in your courses, rewrite `--- teach`, `--- task` and the hints:
- Plain voice for a bright 12-year-old: link to the lesson before; everyday picture first; short sentences; bold each new term with a one-line meaning; say every symbol and flag in words; one new idea per step with its own tiny example; a "Watch out" for the real mistake.
- Keep every fact, command and idea the lesson teaches. Clearer, never thinner.
- Examples must not give the answer away: use different names, files and data from the task, and show each piece on its own, never the assembled solution. The validator fails a lesson whose solution appears word for word in an example, or whose multi-line solution is an example with the names swapped.
- 3–10 context notes at the very end of `--- teach` (`::: context <id> <Title>` … `:::`), each opened by a `[[phrase|id]]` mark in the explanation; none in the task. Words she may not know (shell, argument, flag, path, process, variable, function, index, pointer…), the why behind a rule, how engineers really use it, where it comes back later. About one in four with a small, correct svg picture.
- A lesson that is really two or three ideas can become two lessons: add the new one right after it in the same file with a new id (same prefix, e.g. `term2-01b`), its own task, starter, solution, hints and checks that you have run. Never change or reuse an existing lesson id: her progress is stored under them.
- Leave `starter`, `solution` and every `check` exactly as they are unless one is actually wrong. If you fix one, say so in your report.
- Write files with the Write/Edit tools or raw strings: a Python or JS string turns "\t", "\v", "\a" into control characters, and the validator fails on them.

HOW TO WORK: fan out with the Agent tool (background general-purpose subagents, at most 4 at once), giving each 3–4 lessons of one course plus this brief's rules. Each subagent validates with `npx vitest run src/learn` and reads its lessons once cold as the learner would, fixing anything that would lose her. Tell subagents to use uniquely named scratch files, and to edit only their own lessons' sections (the course file is shared, so one subagent per file at a time is safest, or have them return the rewritten lesson text for you to paste in).

WHEN A COURSE IS DONE:
1. `npx vitest run src/learn` passes.
2. Add `@plainvoice true` to the course file's header (the `@` lines at the top).
3. `git add src/learn/tracks/<file> && git commit -m "<Course name>: plain voice and context notes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01M8tqW58keMn4CYBgYhVHG7"`
4. `git push -u origin <your branch>` (retry up to 4 times with 2/4/8/16 s backoff on network errors).

Only change files in `src/learn/tracks/` that are on your list. If you hit a usage limit, wait and continue. Finish with a short report: per course, lessons rewritten, lessons added, notes, anything in the code or checks you fixed.
