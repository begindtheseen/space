# Learn to code: Git — final report (branch claude/learn-git)

All three Git courses are rewritten in the plain voice with context notes and carry `@plainvoice true`. `npx vitest run src/learn` passes (65/65), including the check that every Git solution passes and every starter does not.

## Per course

| Course | Lessons rewritten | Lessons added | Notes per lesson |
| --- | --- | --- | --- |
| `git.txt` | 11 | git-07b | 4–6 |
| `git.intermediate.txt` | 12 | git2-10b | 4–6 |
| `git.advanced.txt` | 12 | git3-08b | 4–6 |

About one note in four has a small svg picture. Example terminal output in the lessons was taken from the practice shell (`src/lib/shell.ts`), so it matches what she sees.

## Lessons added

- **git-07b | Un-staging a file: restore --staged.** git-07 mentioned `git restore --staged` but never let her try it. New starter (two staged changes), solution `git restore --staged config.txt` + `git status`, and checks on the modified/staged state, the file content, `--staged` being used and the status output.
- **git2-10b | Backing out of a merge: git merge --abort.** Split out of git2-10 so resolving and aborting are separate ideas. New starter (conflict in `orbit.txt`, 380 km on `main` vs 420 km on `survey`), solution `git merge survey`, `cat`, `git merge --abort`, `git status`; checks on the CONFLICT message, the abort, an idle repo with no merge commit, the file content and the commit count.
- **git3-08b | Getting your team's work: fetch and pull.** Split out of git3-08 (clone and push) so fetch/pull is its own step. New starter (a teammate has pushed, she has nothing new), solution `git fetch`, `git status`, `git log --oneline main..origin/main`, `git pull`; checks on the fetch, the "behind by 1 commit" status, and that `main` fast-forwarded to `origin/main` with the new file and no merge commit.

## Starters, solutions and checks

No existing starter, solution or check was changed; none was wrong. The three new lessons have their own, and the test suite runs them.

## Facts corrected in the teaching text

- git-05: plain `git diff` shows unstaged changes only (the old text said "every line that differs from the last commit").
- git2-06: real git refuses to switch branches with uncommitted changes only when the other branch has a different version of the changed file; the lesson now says so and explains that the practice shell always refuses.
- git2-12: reflog entries are kept 90 days by default, but 30 days for commits no branch reaches (the old text said about 90 days).

## Things in the app that look off

No bugs found. Places where the practice shell differs from real git, which the lessons now mention where it matters:

- `git switch` with uncommitted changes always refuses, even when real git would carry the change across (see git2-06).
- `git diff` output leaves out the `@@ … @@` hunk header line real git prints.
- `git merge-base` is not supported (git-11 mentions it as "in real git").

## Other notes

- Some writers used `### Step` headings inside `--- teach`; no other Learn course did, so they were changed to bold lead-ins for consistency.
- Two facts written from memory and worth a spot check: NASA's F Prime is developed on GitHub with changes reviewed on branches (git-08/git-10 notes), and GitHub's default branch name became `main` in 2020, with `switch`/`restore` added in Git 2.23 (2019).
