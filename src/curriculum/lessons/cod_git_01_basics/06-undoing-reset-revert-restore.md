---
id: l06-undoing-reset-revert-restore
title: "Undoing things: reset, revert and restore"
minutes: 26
covers:
  - reset --soft/--mixed/--hard vs revert vs restore
---

Everybody makes mistakes in Git. You commit a debugging `print` you meant to delete. You stage a file that should not be in the commit. You make three messy commits that should have been one. Or, worse, a change that broke the simulator is already on `main`, and the whole team has pulled it.

Each needs a different kind of "undo", and Git has three commands for them: **`reset`**, **`revert`** and **`restore`**. Their names sound alike, and people mix them up constantly. The way to keep them apart is to ask, for each one, *which of Git's places does it change?* Once you can say exactly what each command moves, choosing the right one — and knowing which one can destroy work — becomes easy.

This matters beyond tidiness. Flight software history is evidence of what was tested and flown, and an undo that rewrites a shared branch can make that record lie.

## Three places, one question

Lesson 02 gave you the three areas. Lesson 04 showed that a branch is a pointer and HEAD names a branch. Put them together and there are three things an undo can change:

1. **The branch pointer** — which commit the current branch (and so HEAD) points at. Changing it changes what the branch says its history is.
2. **The index** — the staged snapshot for the next commit.
3. **The working tree** — the files you see and edit.

Every undo command in this lesson is a choice of which of these three to overwrite, and with what.

## `git reset`: move the branch, then maybe more

Picture a bookmark in a notebook. `git reset <commit>` picks up the bookmark of the branch you are on and moves it to another page — usually an earlier one. The pages after it are still in the notebook; the bookmark no longer says they are part of the story.

The precise rule: **`git reset <commit>`** moves the branch that HEAD names so that it points at `<commit>`. HEAD comes along, as always. Then, depending on the **mode**, it may also make the index and the working tree match that commit:

- **`--soft`**: move the branch. Stop.
- **`--mixed`** (the default when you give no mode): move the branch, then reset the index to match the new commit.
- **`--hard`**: move the branch, reset the index, then overwrite the working tree to match too.

Each mode does everything the one before it does, plus one more step. The [[picture of the three modes|reset-picture]] shows it as a grid.

To see them side by side, here is orbit-sim with three new commits on `main`. The last one, `1e9f72e`, is a mistake: Maya left a debugging `print` inside `density()`.

```bash
git log --oneline -4
```

```text
1e9f72e Print altitude in density()
79decf1 Add ballistic coefficient helper
8e31e8e Add sea-level test for the drag model
84c8d78 Merge branch 'egm96-mu'
```

Each run below starts from this same state, with nothing uncommitted, and resets to `HEAD~1` — one commit back, `79decf1`.

### `--soft`: the commit is undone, its changes stay staged

```bash
git reset --soft HEAD~1
git log --oneline -1
git status -s
```

```text
79decf1 Add ballistic coefficient helper
M  drag.py
```

`main` points at `79decf1` now. But the index and working tree were not touched, so they still hold the version *with* the `print`. Compared with the new HEAD, that is a staged change — `M` in the left column. It is as if you had staged the change and not committed it yet. `git commit` right now would make the same commit again; edit first, and you can make a better one.

### `--mixed`: the commit is undone, its changes are unstaged

```bash
git reset --mixed HEAD~1
```

```text
Unstaged changes after reset:
M	drag.py
```

and `git status -s` prints ` M drag.py`. The branch moved, and the index was reset to `79decf1`'s snapshot. The working tree still has the `print`, so it is now an unstaged edit — `M` in the right column. You are back to "edited, not yet added". Because this is the default, plain `git reset HEAD~1` does exactly this.

### `--hard`: the commit is undone, and so are the files

```bash
git reset --hard HEAD~1
```

```text
HEAD is now at 79decf1 Add ballistic coefficient helper
```

and `git status -s` prints nothing at all. The branch moved, the index was reset, and the working tree was overwritten with `79decf1`'s files. The `print` line is gone from `drag.py` on disk.

Here is the whole comparison in one table:

| Mode | Branch and HEAD | Index | Working tree | The undone commit's changes end up… |
| --- | --- | --- | --- | --- |
| `--soft` | moved to the target | not touched | not touched | staged, ready to commit again |
| `--mixed` (default) | moved to the target | reset to the target | not touched | in your files, unstaged |
| `--hard` | moved to the target | reset to the target | reset to the target | nowhere in your files |

::: key reset --soft vs --mixed vs --hard
`--soft` moves the branch pointer only, leaving index and working tree; `--mixed` (default) also resets the index, leaving your edits unstaged; `--hard` additionally overwrites the working tree, which is the only one that can lose uncommitted work.
:::

::: example Squashing three commits into one with `--soft`
**Situation.** The three new commits on `main` have not been shared with anyone. Maya decides they should be one clean commit — the test, the helper, and *no* `print`.

**Step 1 — move the branch back three commits, keeping everything staged.**

```bash
git reset --soft HEAD~3
git status -s
```

```text
M  drag.py
A  tests/test_drag.py
```

`main` now points at `84c8d78`, the merge from last lesson. The index still holds the snapshot from `1e9f72e`, so all three commits' changes appear as staged: `drag.py` modified, `tests/test_drag.py` added. `git diff --staged --stat` confirms `drag.py | 6 ++++++` (five lines of helper plus the `print`) and `tests/test_drag.py | 5 +++++`.

**Step 2 — fix the file.** Delete the `print` line from `drag.py`, then `git add drag.py`. Now `git diff --staged --stat` shows `drag.py | 5 +++++` — one line fewer, as it should be.

**Step 3 — commit once.**

```bash
git commit -m "Add ballistic coefficient and a sea-level drag test"
```

```text
[main a188739] Add ballistic coefficient and a sea-level drag test
 2 files changed, 10 insertions(+)
 create mode 100644 tests/test_drag.py
```

**Sanity check.** $5 + 5 = 10$ insertions: five lines of helper in `drag.py`, five lines of test. `git log --oneline -2` shows `a188739` directly on top of `84c8d78`. Three commits became one — a move people call **[[squashing|squash-bridge]]** — and nothing in the working tree was ever at risk: `--soft` touched only the branch pointer.
:::

::: warning Plain `git reset` with a file name is "unstage"
`git reset` with no commit means `git reset --mixed HEAD`: the branch "moves" to where it already is, and the index is reset to HEAD — which unstages everything, leaving your edits in the files. `git reset drag.py` does the same for one file. Neither touches the working tree. You will see these in older advice; `git restore --staged`, later in this lesson, says the same thing in plainer words.
:::

## What `--hard` destroys, and what it does not

`--hard` is the one mode that writes over your files, so it is worth being exact about the damage. Split everything into two kinds.

**Committed work is not destroyed.** Reset moves a pointer. It does not delete a single commit, tree or blob from `.git/objects`. The commits after the new tip become unreachable from the branch, but they are still there, and Git even writes the old tip down for you in a file called **[[ORIG_HEAD|orig-head]]**. What *does* happen is that nothing obvious names them any more, so after enough weeks Git's clean-up may eventually remove them.

**Uncommitted work is destroyed.** Edits you had not committed lived only in the working tree (and perhaps the index). `--hard` overwrites both. Git never made a commit of them, so there is no history to go back to. This is the only undo in this lesson that can lose work for good.

::: example A hard reset of three commits, audited
**Situation.** `main` is at `1e9f72e`, with the three new commits. Maya has also edited `README.md`, adding a line about the new helper, and not committed it. By mistake she runs:

```bash
git status -s
git reset --hard HEAD~3
git status -s
```

```text
 M README.md
HEAD is now at 84c8d78 Merge branch 'egm96-mu'
```

The second `status` prints nothing: the working tree is clean.

**What moved.** `main` now points at `84c8d78`. `git log --oneline --all -3` starts at `84c8d78` — no branch reaches the three commits any more.

**Are the commits gone?** Ask for the old tip by its hash:

```bash
git cat-file -t 1e9f72e
git log --oneline -3 1e9f72e
```

```text
commit
1e9f72e Print altitude in density()
79decf1 Add ballistic coefficient helper
8e31e8e Add sea-level test for the drag model
```

All three commits, intact, with their parent links. And the old tip was recorded:

```bash
cat .git/ORIG_HEAD
```

```text
1e9f72ec0adb62e273c52d908c6ade1b0f4f9c5a
```

**Undo the undo.** Reset again, to the old tip:

```bash
git reset --hard ORIG_HEAD
```

```text
HEAD is now at 1e9f72e Print altitude in density()
```

`main` is back at `1e9f72e` with all three commits.

**What stayed lost.** `tail -2 README.md` still ends with the old models list. The README line Maya had not committed is gone, and no command in this module brings it back.

**The audit, in writing.** Destroyed: the uncommitted edit to `README.md` (and anything that had been [[staged but not committed|staged-blobs]]). Not destroyed: the three commits and every object in them — only the branch pointer moved.
:::

::: warning Run `git status` before every `reset --hard`
If `status` shows any modified file you care about, commit it (or put it aside with `git stash`, next lesson) first. `ORIG_HEAD` can bring back commits; nothing brings back edits that were never committed.
:::

Here you knew the old hash, and `ORIG_HEAD` held it. But `ORIG_HEAD` remembers only the *last* such move, and next week you will not remember any hashes. Lesson 07 introduces the **reflog**, Git's diary of every place HEAD and each branch has pointed. It is the real net under a bad `reset --hard`: it names lost commits even when you have forgotten them.

## `git revert`: undo by adding a commit

Picture a [[bank statement|bank-ledger]]. When a bank charges you by mistake, it does not erase the charge from last month's statement — thousands of copies of that statement exist, and erasing would make them disagree. Instead it adds a new line: a refund of exactly that amount. The history stays true, and the balance comes out right.

**`git revert <commit>`** does the same. It works out the change that `<commit>` made, and makes a **new commit that applies the opposite change**. Nothing old is moved or removed. The branch moves *forward*, by one ordinary commit, like any other commit. The [[two histories side by side|revert-picture]] show the difference from a reset.

::: example Reverting a commit that is already shared
**Situation.** The `print` commit `1e9f72e` is on `main`, and the team has already pulled it. Since then Maya has also committed a README tweak on top, so the bad commit is no longer the tip:

```bash
git log --oneline -3
```

```text
8305457 Mention the ballistic coefficient in the README
1e9f72e Print altitude in density()
79decf1 Add ballistic coefficient helper
```

**Step 1 — revert it by hash.**

```bash
git revert 1e9f72e
```

Git opens the editor with a message it has written for you; save and close it.

```text
[main cbccd59] Revert "Print altitude in density()"
 1 file changed, 1 deletion(-)
```

**Step 2 — read what was made.**

```bash
git show HEAD
```

```diff
commit cbccd59fe882db38bf9645c595cbd1574235f16a
Author: Maya Chen <maya@example.com>
Date:   Thu Sep 17 10:15:00 2026 -0500

    Revert "Print altitude in density()"
    
    This reverts commit 1e9f72ec0adb62e273c52d908c6ade1b0f4f9c5a.

diff --git a/drag.py b/drag.py
index 5919e0a..a9b8342 100644
--- a/drag.py
+++ b/drag.py
@@ -6,7 +6,6 @@ H_SCALE = 8500.0  # m, scale height of the atmosphere
 
 def density(h):
     """Air density (kg/m^3) at altitude h (m), exponential model."""
-    print("density at", h, "m")
     return RHO0 * math.exp(-h / H_SCALE)
```

The new commit removes exactly the line the bad commit added. Its message names the commit it reverts by full hash.

**Step 3 — the history.**

```text
cbccd59 Revert "Print altitude in density()"
8305457 Mention the ballistic coefficient in the README
1e9f72e Print altitude in density()
79decf1 Add ballistic coefficient helper
```

All four commits are there. The README tweak, made *after* the bad commit, was kept.

**Sanity check.** `git diff 79decf1 HEAD -- drag.py` prints nothing: `drag.py` is back exactly as it was before the `print` went in. And every teammate's copy of `1e9f72e` is still a valid part of history, so their next pull adds `cbccd59` on top.
:::

Why not reset instead? Because on a **shared** branch, other people's clones already contain the commit. If you moved `main` backward and forced the server's copy to match (a **[[force push|force-push]]**, covered in the next module), every teammate's `main` would still include the old commits, and their next push or merge would bring them back or fail in confusing ways. Revert avoids all of that because it only adds.

::: key reset vs revert
reset moves a branch pointer, rewriting what the branch claims its history is. revert creates a new commit that undoes an old one, leaving history intact. Shared branches take revert.
:::

::: warning Reverting a merge needs a parent number
A merge commit has two parents, so "the change it made" depends on which parent you compare against. `git revert 84c8d78` on a merge fails with `error: commit 84c8d78… is a merge but no -m option was given.` Use `git revert -m 1 <merge>` to undo everything the merge brought in *relative to the first parent* — the branch you were on when you merged. Think twice before reverting a merge; [[re-merging that branch later|revert-merge-later]] has a surprise in it.
:::

## `git restore`: fix files, leave history alone

Sometimes the problem is not a commit at all. You edited `drag.py` to try a different scale height, and you want the committed version back. Or you staged a file by accident. **`git restore`** handles these. It never moves a branch. It only copies file contents *into* the working tree or the index, from somewhere else.

- **`git restore <file>`** copies the file from the **index into the working tree**, throwing away your unstaged edits.
- **`git restore --staged <file>`** copies the file from **HEAD into the index** — it unstages, and leaves your working file alone.
- **`--source=<commit>`** says where to copy from instead: `git restore --source=HEAD~3 drag.py` puts the version from three commits ago into your working tree.

::: example Three restores on `drag.py`
All three start from `main` at `1e9f72e`, as at the top of the lesson.

**Throw away an edit.** Maya changes the scale height to 7000 m to try it, then decides against it:

```bash
git status -s
git restore drag.py
git status -s
grep "^H_SCALE" drag.py
```

```text
 M drag.py
H_SCALE = 8500.0  # m, scale height of the atmosphere
```

The second `status` is empty and the file holds the committed `8500.0` again. The index had the committed version, and `restore` copied it over the edit.

**Unstage a file.** She makes the edit again and, by accident, also stages a scratch file:

```bash
git add drag.py notes.txt
git restore --staged notes.txt
git status -s
```

```text
M  drag.py
?? notes.txt
```

`notes.txt` is untracked again — out of the index, still on disk. `drag.py` stayed staged.

**Look at an old version.** To see the drag model as it was at the last merge, three commits back:

```bash
git restore --source=HEAD~3 drag.py
git diff --stat
```

```text
 drag.py | 6 ------
 1 file changed, 6 deletions(-)
```

The working file now lacks the six lines added since then — five of the helper, one `print`. The branch did not move, and `git restore --source=HEAD drag.py` puts the current version back.

**Sanity check.** In all three cases `git log --oneline -1` printed the same commit before and after. Restore changes files, never history.
:::

::: warning Restoring the working tree is also permanent
`git restore <file>` overwrites your edits with no copy kept, exactly like `--hard` does for one file. Read `git diff <file>` first. The older spelling of this command, **`git checkout -- <file>`**, does the same and is equally final.
:::

::: key What restore touches
`git restore <file>`: index → working tree (discards unstaged edits). `git restore --staged <file>`: HEAD → index (unstages; working file untouched). `--source=<commit>` copies from that commit instead. No branch moves, and no commit is made.
:::

## Choosing the right undo

Ask two questions: *is the mistake committed?* and *has anyone else got it?*

| Situation | Command | What moves |
| --- | --- | --- |
| Unwanted edits in a file, not staged | `git restore <file>` | working tree |
| Staged something by mistake | `git restore --staged <file>` | index |
| Last commit(s) not shared; want to redo them | `git reset --soft HEAD~n` (or `--mixed`) | branch (and index for `--mixed`) |
| Commits not shared; want them and their changes gone | `git reset --hard HEAD~n` (check `status` first) | branch, index, working tree |
| Bad commit already on a shared branch | `git revert <commit>` | branch moves forward by one new commit |

Resets and restores are for your own, unshared work. Revert is for history other people have.

## Check yourself

::: check Predict the status
You have committed `A`, then `B` on top of it. `B` changed only `gravity.py`. You have no other changes. For each of `git reset --soft HEAD~1`, `git reset HEAD~1` and `git reset --hard HEAD~1`, say what `git status -s` prints afterwards and where `main` points.
:::

::: answer
In all three, `main` points at `A`.

`--soft`: `M  gravity.py` (left column, staged) — index and working tree still hold `B`'s version.

`git reset HEAD~1` is `--mixed`: ` M gravity.py` (right column, unstaged) — the index was reset to `A`, the working file still has `B`'s changes.

`--hard`: nothing — index and working tree were both reset to `A`, so `B`'s change is not in your files. `B` itself still exists as an object, and `ORIG_HEAD` holds its hash.
:::

::: check Which undo?
For each case, pick `restore`, `reset` (with a mode) or `revert`, and say why. (a) You committed a wrong comment two minutes ago and have not pushed. You want to fix it and commit again. (b) A commit from last week, on `main`, made the orbit propagator diverge; ten people have pulled since. (c) You typed `git add .` and staged a 300 MB log file.
:::

::: answer
(a) `git reset --soft HEAD~1` (or `--mixed`): the commit is only yours, so moving your branch back is safe; the change stays staged (or unstaged), you fix the comment, and commit again.

(b) `git revert <that commit>`: it is on a shared branch, so you add a new commit that undoes it; everyone's history stays valid and they get the fix on their next pull.

(c) `git restore --staged <the log file>`: it takes the file out of the index and leaves it on disk. Nothing was committed, so no history needs changing. (Lesson 08 shows how to make Git ignore such files for good.)
:::

::: check What survives
Before running `git reset --hard HEAD~2`, you had two commits `P` and `Q` on top of the target, a staged new file `plot.py`, and an unstaged edit to `README.md`. List what you can get back afterwards and what you cannot.
:::

::: answer
You can get back `P` and `Q`: they are still in `.git/objects`, and `ORIG_HEAD` holds `Q`'s hash, so `git reset --hard ORIG_HEAD` (or `git branch rescue ORIG_HEAD`) recovers them. You cannot, by ordinary means, get back the unstaged `README.md` edit — it existed only in the working tree, which was overwritten — or the new `plot.py`, which was only in the index and working tree and never committed. `--hard` is the only reset mode that could have lost those.
:::

::: check Reading a revert
`git log --oneline -3` shows `d41f0aa Revert "Raise drag coefficient to 2.4"`, `7c3e2b1 Add density test`, `5b9a8c0 Raise drag coefficient to 2.4`. Which commit changed the coefficient back, and is the density test still there? What would `git revert d41f0aa` do?
:::

::: answer
`d41f0aa` changed it back: it is a new commit applying the opposite of `5b9a8c0`. The density test from `7c3e2b1` is untouched — revert undoes only the one commit's change, and nothing after it. `git revert d41f0aa` would revert the revert: a new commit that applies the opposite of `d41f0aa`, putting the coefficient back to 2.4. History would then have three commits about the coefficient, all visible — which is exactly what an auditor wants to see.
:::

::: check Soft reset arithmetic
Your branch has commits (oldest first) `c1` … `c6`, HEAD at `c6`. You run `git reset --soft HEAD~4` and then `git commit -m "Combine work"`. Which commit is the new commit's parent? How many commits does the branch have now, counting from `c1`?
:::

::: answer
`HEAD~4` from `c6` is four steps back: `c5`, `c4`, `c3`, `c2`. So the branch moved to `c2`, and the new commit's parent is `c2`. The index still held `c6`'s snapshot, so the new commit contains all of `c3`–`c6`'s changes at once. Counting from `c1`: `c1`, `c2`, and the new commit — three commits.
:::

## Summary

| Command | Branch and HEAD | Index | Working tree | Safe on shared history? |
| --- | --- | --- | --- | --- |
| `git reset --soft <c>` | moves to `<c>` | kept | kept | no — rewrites the branch |
| `git reset [--mixed] <c>` | moves to `<c>` | reset to `<c>` | kept | no |
| `git reset --hard <c>` | moves to `<c>` | reset to `<c>` | reset to `<c>` — uncommitted work lost | no |
| `git revert <c>` | forward, one new commit | updated | updated | yes |
| `git restore <file>` | — | — | from the index | yes (local only) |
| `git restore --staged <file>` | — | from HEAD | — | yes (local only) |
| `ORIG_HEAD` | the tip before the last reset (or merge) | | | |

Reset moves a pointer, revert adds a commit, restore copies files. Next lesson meets the two tools that make all of this safe to try: `git stash`, which puts unfinished work aside instead of risking it, and the **reflog**, which remembers every place your branches have been and finds the commits a bad `reset --hard` left behind.

::: context reset-picture What each reset mode overwrites
Rows are the three modes; columns are the three places. A filled box means "made to match the target commit"; an empty box means "left as it was".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="140" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">branch</text>
  <text x="140" y="38" font-size="11" text-anchor="middle" fill="#6c7a93">+ HEAD</text>
  <text x="225" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">index</text>
  <text x="310" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">working</text>
  <text x="310" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">tree</text>
  <text x="12" y="75" font-size="12" fill="#1f2a44">--soft</text>
  <text x="12" y="123" font-size="12" fill="#1f2a44">--mixed</text>
  <text x="12" y="171" font-size="12" fill="#1f2a44">--hard</text>
  <rect x="105" y="55" width="70" height="32" rx="5" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="55" width="70" height="32" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="55" width="80" height="32" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="105" y="103" width="70" height="32" rx="5" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="103" width="70" height="32" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="103" width="80" height="32" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="105" y="151" width="70" height="32" rx="5" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="151" width="70" height="32" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="151" width="80" height="32" rx="5" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="75" font-size="11" text-anchor="middle" fill="#fff">moved</text>
  <text x="140" y="123" font-size="11" text-anchor="middle" fill="#fff">moved</text>
  <text x="140" y="171" font-size="11" text-anchor="middle" fill="#fff">moved</text>
  <text x="225" y="75" font-size="11" text-anchor="middle" fill="#6c7a93">kept</text>
  <text x="310" y="75" font-size="11" text-anchor="middle" fill="#6c7a93">kept</text>
  <text x="225" y="123" font-size="11" text-anchor="middle" fill="#1f2a44">reset</text>
  <text x="310" y="123" font-size="11" text-anchor="middle" fill="#6c7a93">kept</text>
  <text x="225" y="171" font-size="11" text-anchor="middle" fill="#1f2a44">reset</text>
  <text x="310" y="171" font-size="11" text-anchor="middle" fill="#fff">overwritten</text>
</svg>
```

Each row adds one box to the row above. Only the red box can destroy something that was never committed.
:::

::: context squash-bridge Squashing, and the tool made for it
Combining several commits into one is called **squashing**, as if you pressed a stack of pages flat. `reset --soft` is the simplest way to squash the last few commits. The next module introduces **interactive rebase**, which can squash, reorder, reword or drop any commits in a range, one line per commit in an editor. Both rewrite history, so both belong only on commits nobody else has yet.
:::

::: context orig-head Git's one-slot memory
`ORIG_HEAD` is a plain file in `.git`, holding one hash. Commands that move a branch a long way — `reset`, `merge`, and `rebase` from the next module — write the old tip there before they move, so you can undo with `git reset --hard ORIG_HEAD` if you act right away. It has one slot only: the next such command overwrites it. The reflog in lesson 07 is the long-term version of the same idea, with a line for every move.
:::

::: context staged-blobs The faint trace of staged work
Lesson 02 showed that `git add` writes a blob into `.git/objects` straight away. So a file that was staged, then wiped by `reset --hard`, still exists as a **dangling blob** — an object nothing points at, with no file name attached. `git fsck --lost-found` can list such blobs and copy them into `.git/lost-found`, where you can open them one by one. It is slow detective work, and it cannot help with edits that were never staged. Treat it as a last resort, not a plan.
:::

::: context bank-ledger Append-only records in engineering
The bank-statement picture is a real principle, not only a metaphor. Accountants call it an **append-only ledger**: mistakes are fixed by new correcting entries, never by erasing old ones, so anyone can check how the balance was reached. Flight software records work the same way. Standards for safety-critical software ask teams to show the full change history of what was tested and flown, and a reverted commit stays in the record, beside the commit that cancelled it and the message explaining why.
:::

::: context revert-picture Reset goes back; revert goes forward
Top: after `git reset --hard HEAD~1`, `main` points at B, and C is left unreachable (dashed). Bottom: after `git revert C`, `main` moves forward to C′, a new commit whose change is the opposite of C's. Nothing is left behind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="r1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">reset --hard HEAD~1</text>
  <circle cx="40" cy="55" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">A</text>
  <circle cx="110" cy="55" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">B</text>
  <circle cx="180" cy="55" r="16" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="180" y="59" font-size="12" text-anchor="middle" fill="#6c7a93">C</text>
  <line x1="94" y1="55" x2="58" y2="55" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#r1)"/>
  <line x1="164" y1="55" x2="128" y2="55" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#r1)"/>
  <rect x="83" y="80" width="54" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="110" y="94" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="110" y1="80" x2="110" y2="74" stroke="#b4232c" stroke-width="1.5" marker-end="url(#r1)"/>
  <text x="215" y="59" font-size="11" fill="#6c7a93">unreachable</text>
  <line x1="10" y1="112" x2="350" y2="112" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="10" y="132" font-size="12" font-weight="700" fill="#1f2a44">revert C</text>
  <circle cx="40" cy="160" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">A</text>
  <circle cx="110" cy="160" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">B</text>
  <circle cx="180" cy="160" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">C</text>
  <circle cx="250" cy="160" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">C′</text>
  <line x1="94" y1="160" x2="58" y2="160" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#r1)"/>
  <line x1="164" y1="160" x2="128" y2="160" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#r1)"/>
  <line x1="234" y1="160" x2="198" y2="160" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#r1)"/>
  <rect x="290" y="150" width="54" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="317" y="164" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="290" y1="160" x2="269" y2="160" stroke="#b4232c" stroke-width="1.5" marker-end="url(#r1)"/>
</svg>
```

The files at B and at C′ are identical. Only the second history still tells the truth about C.
:::

::: context force-push Why rewriting shared history hurts
Your team keeps a shared copy of the repository on a server, and each person's clone pulls from it. Normally the server accepts only changes that *add* to a branch. After a reset, your `main` no longer contains commits the server's `main` has, so a normal push is refused. `git push --force` overrides that refusal and replaces the server's pointer with yours. Everyone else's clone still has the old commits; the next time they pull, Git sees two histories that disagree. Many teams switch force-pushing off entirely for `main` and release branches. The next module covers remotes and pushing properly.
:::

::: context revert-merge-later The trap in reverting a merge
Suppose you merged `drag-model` into `main`, found a bug, and reverted the merge with `git revert -m 1`. The branch's commits are still *in* `main`'s history — the revert only undid their effect. Later you fix the bug on `drag-model` and merge again. Git looks for commits that `main` does not contain yet, finds only the new fix, and brings in only that — the original drag code stays reverted. The usual cure is to revert the revert first, and then merge the fix. It is one more reason revert on a merge deserves a pause.
:::
