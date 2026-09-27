# Report: claude/learn-bash-a

Courses: Terminal basics (`src/learn/tracks/bash.txt`) and Terminal intermediate (`src/learn/tracks/bash.intermediate.txt`). Both now carry `@plainvoice true`, and `npx vitest run src/learn` passes.

## Terminal basics (`bash.txt`) — light touch

- **Lessons rewritten:** 10 of 10 (term-01 to term-10).
  - Each opens by linking to the lesson before and starts from an everyday picture.
  - Every symbol and flag is said in words, and the examples show the prompt and the output.
  - Each has a "Watch out" paragraph and three hints, from gentle to nearly the answer.
  - Every original fact is kept.
- **Lessons added:** none.
- **Notes:** 38 in all, 3–4 per lesson, 9 of them with an svg picture (every lesson except term-03). Topics include:
  - terminal vs shell, the prompt, the home folder, arguments;
  - relative vs absolute paths and root `/`, flags, recursive;
  - exit status behind `&&`, `&&` vs `;`, append vs overwrite;
  - dotfiles, `.` and `..`, reading `-rw-r--r--`, how `cd -` remembers;
  - a bridge note into the intermediate course.
- **Task wording:** two tasks gained a clarifying phrase but ask for the same thing.
  - term-06 now says the `old` folder needs the recursive flag.
  - term-07 now says `ERROR` is in capitals.

## Terminal intermediate (`bash.intermediate.txt`) — full rewrite

- **Lessons rewritten:** 12 of 12 (term2-01 to term2-12), in the plain voice, one idea per numbered step, each step with its own small prompt-and-output example.
- **Lessons added:** 6. Each is placed right after the lesson it came from, with its own task, starter, solution, 2–3 hints and shell checks, all passing the validator.
  - `term2-01b` More wildcards: sets, and two surprises. Covers `[12]`/`[abc]` sets, `*` skipping names that start with a dot, and a pattern that matches nothing being passed along unchanged.
  - `term2-02b` Building a pipeline one stage at a time. Covers what a stage is, looking at the output after every stage, and the `ls | echo` mistake.
  - `term2-06b` find with wildcards: quotes and -iname. Quoting the pattern moved here from term2-06.
  - `term2-07b` grep: any capitals, and only the file names. Covers `-i`, `-l` and `-ril`.
  - `term2-07c` Patterns: the start and end of a line. Covers the regular-expression characters `^`, `$` and `.`, and escaping with `\.`.
  - `term2-08b` Throwing errors away, and saving both at once. Covers `2> /dev/null`, pipes carrying only standard output, and `&>`.
- **Kept whole:** term2-03, term2-04 and term2-05, because their unchanged tasks need nearly every idea in them. Each is broken into smaller numbered steps instead.
- **What moved:** ideas left an original lesson only when its task did not need them. Nothing was dropped.
- **Notes:** 65 in all, 3–5 per lesson, 15 of them with an svg picture.

## Problems in the lessons' code or checks

None. No starter, solution or check in an original lesson was changed; a script compared them byte for byte against the originals. None was found to be wrong.
