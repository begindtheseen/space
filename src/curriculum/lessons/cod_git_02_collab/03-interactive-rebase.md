---
id: l03-interactive-rebase
title: Interactive rebase and force-with-lease
minutes: 22
covers:
  - "Interactive rebase: squash, fixup, reword, drop, reorder"
  - push --force-with-lease vs --force
---

Nobody writes code in clean, finished steps. You write a function, spot a typo, add a print statement, try another approach, give up on it, write the tests, fix another typo. Committing often is a good habit — every commit is a save point — but the result tells the story of your afternoon, not the story of the change.

A reviewer does not want your afternoon. She wants to read the change in a few clear steps, each of which makes sense on its own and passes the tests. Two years from now, someone running `git bisect` wants the same thing. So before a branch goes up for review, engineers rewrite its commits into that clear form. The tool for that is **interactive rebase**, and it is the subject of the first half of this lesson.

The second half is about getting the rewritten branch back onto the server. A rewritten branch can only be pushed by force, and a careless forced push can erase a teammate's commit without a word of warning. `--force-with-lease` is the version that checks first.

## Leo's eight commits

Leo has spent a day adding the $J_2$ term — the extra pull from Earth's equatorial bulge — to orbit-sim's gravity model. His branch `j2-accel` starts at `main`, and he pushed it once so the team's test server could run it. Here it is, newest first:

```bash
git log --oneline main..j2-accel
```

```text
270ae32 remove print, pole test
7e4481b fix typo
9963c7a Revert "try numpy"
7b5ecdb try numpy
018aeae tests wip
a4df01c debug
c8712e1 typo
0c74553 j2 accel
```

Read from the bottom up, that is his day:

1. `0c74553 j2 accel` — adds the constant `R_EARTH` and the function `j2_accel(x, y, z)`. The docstring says "oblatness", and the comment on `R_EARTH` says "equitorial".
2. `c8712e1 typo` — fixes "oblatness".
3. `a4df01c debug` — adds a line `print('DEBUG j2', r, k, s)` inside `j2_accel`.
4. `018aeae tests wip` — a test that the pull on the equator points inward.
5. `7b5ecdb try numpy` — rewrites two lines with NumPy, to see if it is faster.
6. `9963c7a Revert "try numpy"` — it was not; `git revert` undid it.
7. `7e4481b fix typo` — fixes "equitorial".
8. `270ae32 remove print, pole test` — deletes the debug print and adds a second test, over the pole.

Everything the branch *does* can be summed up in two sentences: it adds the $J_2$ acceleration, and it tests it at two points. So the goal is two commits, one for each sentence, with messages a reviewer can use.

Before touching anything, Leo records what the branch adds up to, so he can prove afterwards that the cleanup changed nothing but the history:

```bash
git diff --stat main j2-accel
git tag before-cleanup
```

```text
 gravity.py       | 10 ++++++++++
 tests/test_j2.py | 19 +++++++++++++++++++
 2 files changed, 29 insertions(+)
```

The tag `before-cleanup` is a fixed name for the old tip (lesson 09 of the last module). Notice that neither the debug print nor NumPy appears in the total: both were added and later taken out.

## The todo list

```bash
git rebase -i main
```

Read it as "rebase interactively onto `main`". The branch already starts at `main`, so nothing will move to a new base. The `-i` is what matters: before replaying anything, Git writes the plan into a text file and opens it in your editor. This file is the **todo list**:

```text
pick 0c74553 j2 accel
pick c8712e1 typo
pick a4df01c debug
pick 018aeae tests wip
pick 7b5ecdb try numpy
pick 9963c7a Revert "try numpy"
pick 7e4481b fix typo
pick 270ae32 remove print, pole test

# Rebase 9b54774..270ae32 onto 9b54774 (8 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup [-C | -c] <commit> = like "squash" but keep only the previous
#                    commit's log message, unless -C is used, in which case
#                    keep only this commit's message; -c is same as -C but
#                    opens the editor
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
...
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
```

(The comment block goes on to list a few more commands for advanced use; they are left out here.)

The first thing to notice: the list is **[[oldest first|oldest-first]]**, the reverse of `git log`. It is a script, and Git runs it from top to bottom, one line at a time. Each line is a command, a commit hash, and the commit's subject (the subject is only there to help you; Git goes by the hash).

You edit the script by changing the command word at the start of lines, and by moving lines up and down. The commands you will use nearly every time:

- **`pick`** — use the commit as it is.
- **`reword`** — use the commit, but stop to let you rewrite its message.
- **`squash`** — melt this commit into the one above it, and open the editor with *both* messages so you can write the combined one.
- **`fixup`** — melt this commit into the one above it and throw its message away; the combined commit keeps the message of the one above. The [[message picture|squash-fixup-picture]] shows the difference.
- **`drop`** — leave this commit out. (Deleting the line does the same, which is why the warning says the commit will be lost.)
- **Reorder** — cut a line and paste it elsewhere; the commit is replayed in its new place.

Two more are handy: **`edit`** stops after making the commit so you can change its contents (then `git commit --amend` and `git rebase --continue`), and **`exec`** runs a shell command at that point, such as the tests.

::: key What does `git rebase -i` squash vs fixup do?
Both combine a commit into the previous one; squash opens an editor to combine the messages, fixup discards the later message entirely. fixup is what you want for the typo-fix commits.
:::

## Planning the two commits

Leo goes through the list and decides each line:

| Commit | What it is | Command | Where it ends up |
| --- | --- | --- | --- |
| `0c74553 j2 accel` | the real change, with a poor message | `reword` | commit 1 |
| `c8712e1 typo` | fixes commit 1's docstring | `fixup` | commit 1 |
| `7e4481b fix typo` | fixes commit 1's comment | move up, `fixup` | commit 1 |
| `a4df01c debug` | a temporary print | `drop` | gone |
| `018aeae tests wip` | the first test | `pick` | commit 2 |
| `270ae32 remove print, pole test` | the second test | `squash` | commit 2 |
| `7b5ecdb try numpy` | a failed experiment | `drop` | gone |
| `9963c7a Revert "try numpy"` | undoes the experiment | `drop` | gone |

He saves this version of the todo list:

```text
reword 0c74553 j2 accel
fixup c8712e1 typo
fixup 7e4481b fix typo
drop a4df01c debug
pick 018aeae tests wip
squash 270ae32 remove print, pole test
drop 7b5ecdb try numpy
drop 9963c7a Revert "try numpy"
```

Three decisions deserve a closer look.

**The second typo fix moved.** `7e4481b` fixes a comment written in commit 1, but it sat seventh. A `fixup` melts a commit into *the line above it*, so Leo moved the line up under commit 1. That is a **reorder**. Moving commits past each other is safe when they touch different lines; if they overlap, Git may stop with a conflict.

**The experiment and its revert are dropped together.** Commit 5 added two NumPy lines and commit 6 removed exactly those lines. Together they change nothing. Dropping both leaves the final code exactly the same. Dropping only one of them would not: drop the experiment alone and the revert would try to remove lines that are not there.

**The debug print is dropped, but commit 8 still removes it.** When Git replays commit 8, the line it deletes never got added. Here Git applies commit 8 as a three-way merge: the [[old version had the print, both sides removed it|same-removal]], so both sides made the same change, and it merges cleanly. The only part of commit 8 that survives is the pole test.

## Running the plan

Leo saves the file and closes the editor. Git starts at the top. The first line is `reword`, so after re-creating the commit it opens the editor again, this time with the message:

```text
j2 accel

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
```

He replaces `j2 accel` with a real message — a subject, a blank line, and a body that says why (the rules from lesson 03 of the last module):

```text
Add J2 oblateness term to gravity acceleration

Point-mass gravity ignores Earth's equatorial bulge. For a satellite
in low orbit the J2 term is the largest correction: about 1e-3 of
the central pull, enough to swing the orbit plane by degrees per day.

j2_accel(x, y, z) returns the extra acceleration in the Earth-centered
frame, using J2 and the equatorial radius from WGS 84 (R_EARTH).
```

Git carries on: two fixups melt into that commit silently, the debug commit is skipped, the first test is picked. At the `squash` line it opens the editor once more, with both messages side by side:

```text
# This is a combination of 2 commits.
# This is the 1st commit message:

tests wip

# This is the commit message #2:

remove print, pole test
```

Neither old message is worth keeping, so he replaces the lot:

```text
Test J2 acceleration on the equator and over the pole

On the equator the bulge pulls inward, -1.5*J2*mu*R^2/r^4; over the
pole it pushes outward, +3*J2*mu*R^2/r^4. Checking both catches a
sign error in either the (1 - 5z^2/r^2) or the (3 - 5z^2/r^2) factor.
```

The last two `drop` lines do nothing, and Git finishes:

```text
Successfully rebased and updated refs/heads/j2-accel.
```

The [[whole mapping|todo-map-picture]] fits in one picture.

::: example Checking that the cleanup changed only the history
**Step 1 — count the commits.**

```bash
git log --oneline main..j2-accel
```

```text
0be5a20 Test J2 acceleration on the equator and over the pole
3b54b84 Add J2 oblateness term to gravity acceleration
```

Two commits, both with new hashes. Every commit the rebase re-created is a new object — different parent, different snapshot or different message — so every one has a new hash.

**Step 2 — see what each one does.** `git log --stat main..j2-accel` shows the full messages and:

```text
 tests/test_j2.py | 19 +++++++++++++++++++
 1 file changed, 19 insertions(+)
...
 gravity.py | 10 ++++++++++
 1 file changed, 10 insertions(+)
```

Commit 1 adds 10 lines to `gravity.py`; commit 2 adds 19 lines of tests. $10 + 19 = 29$, the same 29 insertions the whole branch added before.

**Step 3 — prove the end result is identical.**

```bash
git diff before-cleanup j2-accel
```

It prints nothing. The final snapshot is byte for byte the one Leo had before; only the path to it changed. So `git diff main j2-accel` is also unchanged — the branch still adds exactly what it added before.

**Step 4 — run the tests on the new commits.**

```bash
python3 -m pytest -q
```

```text
...                                                                      [100%]
3 passed in 0.01s
```

(Three tests: the older surface-gravity test plus Leo's two.) To be thorough, Leo could also check out the first commit alone and run its tests — each commit should work on its own. Adding `--exec "python3 -m pytest -q"` to the rebase command does that for every commit automatically.

**Sanity check.** The tests in commit 2 come *after* the function in commit 1, so every commit on the branch imports only code that exists at that point. Had Leo reordered the test commit above the function, commit 1 would have been tests for a function that did not exist yet — each commit should build and pass, not only the tip.
:::

::: warning Interactive rebase rewrites every commit it touches
Every commit from the first one you change onward gets a new hash, because its parent, snapshot or message changed. That is harmless on a branch only you have. On a branch others have fetched, it is the golden rule from the last lesson being broken. Clean up *before* others build on your branch — ideally before you ask for review.
:::

### When things go sideways

- **A conflict stops the rebase.** A reorder or a drop can make a later commit's change fail to apply. Git stops with `could not apply <hash>...`. Fix the file, `git add` it, `git rebase --continue` — as in the last lesson.
- **You regret a line of the plan halfway through.** `git rebase --edit-todo` reopens the remaining lines.
- **You want out.** `git rebase --abort` returns the branch to where it started.
- **It finished, and it is wrong.** The tag makes it one command: `git reset --hard before-cleanup`. Without a tag, `git reflog` shows every step, starting with a `rebase (start)` line; the line before it is the old tip.

```text
0be5a20 HEAD@{0}: rebase (finish): returning to refs/heads/j2-accel
0be5a20 HEAD@{1}: rebase (squash): Test J2 acceleration on the equator and over the pole
...
9b54774 HEAD@{7}: rebase (start): checkout main
270ae32 HEAD@{8}: commit: remove print, pole test
```

## Fixups as you go: `--fixup` and `--autosquash`

Planning a todo list by hand is fine once. When you already know which commit a small fix belongs to, let Git plan it. Reading his branch the next morning, Leo improves the docstring of `j2_accel` to say which frame the position is in. The change belongs in commit 1, `3b54b84`. He stages it and commits with:

```bash
git commit --fixup=3b54b84
```

```text
[j2-accel 3ef674b] fixup! Add J2 oblateness term to gravity acceleration
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Git wrote the message for him: [[`fixup!`|fixup-bang]] followed by the subject of the target commit. Then:

```bash
git rebase -i --autosquash main
```

The todo list opens *already arranged*:

```text
pick 3b54b84 Add J2 oblateness term to gravity acceleration
fixup 3ef674b fixup! Add J2 oblateness term to gravity acceleration
pick 0be5a20 Test J2 acceleration on the equator and over the pole
```

Leo saves it unchanged, and the branch is two commits again. (`git config --global rebase.autoSquash true` makes `--autosquash` the default for every `rebase -i`.) 

## Pushing a rewritten branch

Leo had pushed `j2-accel` before the cleanup. The server still has the eight old commits, so a plain push is refused, exactly as the last lesson predicted:

```text
 ! [rejected]        j2-accel -> j2-accel (non-fast-forward)
```

He has to tell the server to replace its branch. There are two ways to say that, and the difference is the whole point.

**`git push --force`** tells the server: "set `j2-accel` to my commit, whatever it is now." No check at all.

**`git push --force-with-lease`** tells the server: "set `j2-accel` to my commit, *but only if* it still points where I last saw it" — where Leo's remote-tracking branch `origin/j2-accel` says it is. If someone has pushed since then, the push is refused. The expected old value is the **[[lease|lease-word]]**.

The first time, nobody else had touched the branch, so the lease held:

```bash
git push --force-with-lease
```

```text
To /home/you/team/server/orbit-sim.git
 + 270ae32...0be5a20 j2-accel -> j2-accel (forced update)
```

The server's branch was at `270ae32`, which matched Leo's `origin/j2-accel`, so it moved to `0be5a20`.

::: example The lease that saved Ravi's commit
**What happened on the server.** Between Leo's cleanup push and his autosquash the next morning, Ravi — reviewing the branch — added a small test that the pull is the same along $x$ and $y$, and pushed it:

```text
To /home/you/team/server/orbit-sim.git
   0be5a20..82916c1  j2-accel -> j2-accel
```

Leo did not fetch. His `origin/j2-accel` still says `0be5a20`. His own branch, after the autosquash, is `0d63347`, built from commits Ravi never saw.

**Step 1 — Leo pushes with a lease.**

```bash
git push --force-with-lease
```

```text
To /home/you/team/server/orbit-sim.git
 ! [rejected]        j2-accel -> j2-accel (stale info)
error: failed to push some refs to '/home/you/team/server/orbit-sim.git'
```

`stale info` means: your information about the server is out of date. Leo expected `0be5a20`; the server has `82916c1`. Nothing was changed.

**Step 2 — what plain `--force` would have done.** Tried on a copy of the server:

```text
$ git push --force
 + 82916c1...0d63347 j2-accel -> j2-accel (forced update)
```

The branch jumps to Leo's `0d63347`, and `git log main..j2-accel` on the server lists only Leo's two commits. Ravi's `82916c1` is no longer on any branch. No error, no warning; Ravi finds out when his test is missing, if he notices at all.

**Step 3 — fetch and look.**

```bash
git fetch
git log --oneline HEAD..origin/j2-accel
```

```text
82916c1 Test that J2 pull is the same along x and y
0be5a20 Test J2 acceleration on the equator and over the pole
3b54b84 Add J2 oblateness term to gravity acceleration
```

The bottom two are Leo's own commits from before the autosquash (the same changes are already in his branch, with new hashes). The top one is Ravi's — the only thing that is new.

**Step 4 — bring Ravi's commit in, and test.**

```bash
git cherry-pick 82916c1
python3 -m pytest -q
```

```text
[j2-accel e712347] Test that J2 pull is the same along x and y
 Author: Ravi Patel <ravi@example.com>
...
4 passed in 0.01s
```

The copy keeps Ravi as author. Four tests pass.

**Step 5 — push again.** Leo's `origin/j2-accel` is now `82916c1` (the fetch updated it), which matches the server, so the lease holds:

```text
 + 82916c1...e712347 j2-accel -> j2-accel (forced update)
```

**Sanity check.** The server's branch contains Leo's two clean commits plus Ravi's test: three commits, and no one's work was lost.
:::

::: key Why is --force-with-lease safer than --force?
It refuses the push if the remote ref has moved since your last fetch, so you cannot silently overwrite a colleague commit that landed while you were rebasing. Plain --force overwrites unconditionally.
:::

::: warning A fetch renews the lease without you looking
The lease is whatever your `origin/j2-accel` says. Run `git fetch` — or let an editor that fetches in the background do it — and the lease quietly updates to include your colleague's commit, *even if you never looked at it*. After Leo's fetch in step 3, before the cherry-pick, a dry run shows the danger:

```text
$ git push --force-with-lease --dry-run
 + 82916c1...0d63347 j2-accel -> j2-accel (forced update)
```

It would have gone through, dropping Ravi's commit. So: after fetching, always look at what arrived before a forced push. Git 2.30 added a second check, `--force-if-includes`, which also refuses unless the remote's tip is in the history of your branch as you built it; with it, the same dry run is rejected with `(remote ref updated since checkout)`. It is a useful guard to [[add|force-if-includes]].
:::

A few team habits follow:

- Never use plain `--force` on a shared server. Some engineers set a shell alias so that `git pushf` means `git push --force-with-lease` and never type the other.
- Force-push only branches that are yours, as the golden rule's exception allows. `main` and release branches are [[protected by the server|protected-branches]] so that even a lease cannot rewrite them.
- When you do force-push a branch someone else has looked at, tell them. A reviewer who fetched the old version will need to fetch again.

## Check yourself

::: check
A branch has these commits, oldest first: `A add attitude estimator`, `B wip`, `C fix typo in A's docstring`, `D add estimator tests`, `E oops, forgot a file for D`. You want two commits: A (with its message improved) and D. Write the todo list.
:::

::: answer
```text
reword A add attitude estimator
fixup C fix typo in A's docstring
fixup B wip
pick D add estimator tests
fixup E oops, forgot a file for D
```

`reword` lets you fix A's message. C and B melt into A with `fixup`, which throws away their messages; C was moved up under A (a reorder), and B was already below A. Whether B belongs in A depends on what it contains — if it was a false start, `drop` it instead. E melts into D with `fixup`. If E's message had something worth keeping, use `squash` to see both messages and write one.
:::

::: check
Leo's branch contains the experiment `7b5ecdb` and its revert `9963c7a`. What goes wrong if he drops only `7b5ecdb` and keeps the revert? What if he keeps both?
:::

::: answer
Dropping only the experiment: when Git replays the revert, it tries to remove the NumPy lines, which were never added. The replay will conflict (the lines it expects to change are not there), or the revert applies as an odd change of its own. Keeping both: nothing breaks and the final code is the same, but the history still carries two commits that cancel out — noise for reviewers and for anyone bisecting. Dropping both together is correct because together they change nothing.
:::

::: check
After an interactive rebase, `git log --oneline main..` shows the two commits you wanted. Name two more checks before you push, and the command for each.
:::

::: answer
First, that the final code did not change: with a tag or branch at the old tip, `git diff before-cleanup HEAD` must print nothing (or, if you meant to change something, only that). Second, that the tests pass on the new commits: `python3 -m pytest -q` on the tip, and ideally on each commit — `git rebase --exec "python3 -m pytest -q" main` runs the tests after every commit. Also reread the messages with `git log main..`.
:::

::: check
Your `origin/feature` says `c41`. Unknown to you, a teammate pushed `d58` on top of it. You rebased and now run `git push --force-with-lease`. What happens? What would plain `--force` have done? And what if you had run `git fetch` right before the push?
:::

::: answer
With the lease, the push is rejected as `stale info`: you expected the server's branch at `c41`, but it is at `d58`. Nothing changes on the server. Plain `--force` would move the branch to your tip unconditionally, and your teammate's `d58` would no longer be on the branch. After a `git fetch`, your `origin/feature` would say `d58`, so the lease would match and the forced push would succeed — dropping `d58` unless you had first looked at it and brought it into your branch. That is why you look after every fetch, and why `--force-if-includes` exists.
:::

::: check
Why does every commit touched by an interactive rebase get a new hash, even the ones where you only changed the message?
:::

::: answer
A commit's hash is the fingerprint of its whole content: tree, parent(s), author, committer and message. Rewording changes the message, so the fingerprint changes. And because each later commit records the earlier one's hash as its parent, every commit after the first changed one gets a new parent and therefore a new hash too — even if you did not touch it. (Commits *before* the first change can keep their hashes; Git reuses them.)
:::

## Summary

| Idea | In one line |
| --- | --- |
| `git rebase -i <base>` | opens the todo list: one line per commit, oldest first, run top to bottom |
| `pick` / `reword` / `edit` | use as is / fix the message / stop to change the contents |
| `squash` / `fixup` | melt into the line above; squash combines messages, fixup keeps only the one above |
| `drop` / delete the line | leave the commit out |
| Reorder | move lines; a fixup must sit directly under its target |
| Experiment + revert | drop both together; they cancel |
| Checks after cleanup | `git log --oneline main..`, `git diff <old-tip> HEAD` is empty, tests pass |
| `git commit --fixup=<hash>` | makes a `fixup!` commit; `git rebase -i --autosquash` places it |
| Get out | `git rebase --abort`; afterwards `git reset --hard <tag>` or the reflog |
| `--force` | sets the server's branch to yours, no questions |
| `--force-with-lease` | refuses if the server's branch moved since your last fetch |
| After a fetch | the lease is renewed; look at what arrived first; `--force-if-includes` adds a check |

Rebases and merges both stop at conflicts, and so far we have resolved them by eye. The next lesson treats conflict resolution as a skill: reading all three versions, finding out *why* each side changed, catching the conflicts Git cannot see, and teaching Git to reuse a resolution with `rerere`.

::: context oldest-first Why the list runs the other way
`git log` shows newest first because that is usually what you want to read. The todo list is not for reading history; it is a script Git will *execute*, and a commit can only be made after its parent exists. So the list starts with the oldest commit — the first one to be rebuilt — and each line builds on the one above it. That is also why `squash` and `fixup` merge into the line *above*: that commit has already been made when Git reaches the line.
:::

::: context same-removal Why removing a line that is not there still worked
Git does not replay a commit by blindly deleting "line 37". It does a small three-way merge. The base is commit 8's parent (with the print line), "theirs" is commit 8 (without it) and "ours" is the rebuilt branch so far (also without it, because the debug commit was dropped). Both sides changed the base the same way — the line is gone on both — and the merge table from the last module says: changed the same way on both sides, take it once. No conflict.
:::

::: context todo-map-picture Eight commits into two
Each old commit, oldest at the top, and what became of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="t1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <g font-size="11" fill="#1f2a44">
    <rect x="5" y="8" width="130" height="20" rx="3" fill="#8fb8f0" stroke="#1f2a44"/><text x="11" y="22">1 j2 accel</text>
    <rect x="5" y="34" width="130" height="20" rx="3" fill="#8fb8f0" stroke="#1f2a44"/><text x="11" y="48">2 typo</text>
    <rect x="5" y="60" width="130" height="20" rx="3" fill="#fff" stroke="#6c7a93" stroke-dasharray="3 2"/><text x="11" y="74" fill="#6c7a93">3 debug</text>
    <rect x="5" y="86" width="130" height="20" rx="3" fill="#f2b880" stroke="#1f2a44"/><text x="11" y="100">4 tests wip</text>
    <rect x="5" y="112" width="130" height="20" rx="3" fill="#fff" stroke="#6c7a93" stroke-dasharray="3 2"/><text x="11" y="126" fill="#6c7a93">5 try numpy</text>
    <rect x="5" y="138" width="130" height="20" rx="3" fill="#fff" stroke="#6c7a93" stroke-dasharray="3 2"/><text x="11" y="152" fill="#6c7a93">6 revert numpy</text>
    <rect x="5" y="164" width="130" height="20" rx="3" fill="#8fb8f0" stroke="#1f2a44"/><text x="11" y="178">7 fix typo</text>
    <rect x="5" y="190" width="130" height="20" rx="3" fill="#f2b880" stroke="#1f2a44"/><text x="11" y="204">8 pole test</text>
  </g>
  <rect x="235" y="30" width="120" height="44" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">Add J2 oblateness</text>
  <text x="295" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">term (reword)</text>
  <rect x="235" y="140" width="120" height="44" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">Test J2 on equator</text>
  <text x="295" y="174" font-size="11" text-anchor="middle" fill="#1f2a44">and pole (squash)</text>
  <g stroke="#1f2a44" stroke-width="1.3" fill="none">
    <line x1="135" y1="18" x2="233" y2="44" marker-end="url(#t1)"/>
    <line x1="135" y1="44" x2="233" y2="52" marker-end="url(#t1)"/>
    <line x1="135" y1="174" x2="233" y2="62" marker-end="url(#t1)"/>
    <line x1="135" y1="96" x2="233" y2="154" marker-end="url(#t1)"/>
    <line x1="135" y1="200" x2="233" y2="170" marker-end="url(#t1)"/>
  </g>
</svg>
```

Blue lines became commit 1, orange lines commit 2, dashed lines were dropped. Line 7 had to move up so that its fixup landed in commit 1.
:::

::: context fixup-bang How autosquash finds the target
`--autosquash` looks for commit subjects that start with `fixup!`, `squash!` or `amend!`, followed by the subject of an earlier commit on the branch (or its hash). It moves each one directly under its target and sets the right command. So the matching is by *subject text*: if two commits have the same subject, it picks the most recent one. That is one more reason to give commits distinct, descriptive subjects instead of "wip". `git commit --squash=<hash>` makes a `squash!` commit, for when you want to edit the combined message.
:::

::: context squash-fixup-picture Where the messages go
Both commands put the two changes into one commit. They differ only in the message.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="s1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="90" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">squash</text>
  <text x="270" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">fixup</text>
  <line x1="180" y1="8" x2="180" y2="115" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <rect x="15" y="26" width="70" height="22" rx="3" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="41" font-size="11" text-anchor="middle" fill="#1f2a44">message A</text>
  <rect x="95" y="26" width="70" height="22" rx="3" fill="#f2b880" stroke="#1f2a44"/>
  <text x="130" y="41" font-size="11" text-anchor="middle" fill="#1f2a44">message B</text>
  <line x1="50" y1="48" x2="80" y2="78" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#s1)"/>
  <line x1="130" y1="48" x2="100" y2="78" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#s1)"/>
  <rect x="20" y="80" width="145" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="92" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">editor shows A and B</text>
  <rect x="195" y="26" width="70" height="22" rx="3" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="230" y="41" font-size="11" text-anchor="middle" fill="#1f2a44">message A</text>
  <rect x="275" y="26" width="70" height="22" rx="3" fill="#f2b880" stroke="#1f2a44"/>
  <text x="310" y="41" font-size="11" text-anchor="middle" fill="#1f2a44">message B</text>
  <line x1="230" y1="48" x2="260" y2="78" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#s1)"/>
  <text x="318" y="68" font-size="11" text-anchor="middle" fill="#b4232c">discarded</text>
  <rect x="210" y="80" width="120" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">keeps A, no editor</text>
  <text x="180" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">the code of A and B is combined either way</text>
</svg>
```

`fixup -C` is the rare reverse: keep B's message and drop A's.
:::

::: context lease-word Why it is called a lease
A lease is permission that holds only under stated conditions — like renting a flat until a given date. Here the condition is "the branch is still where I last saw it". Computer scientists call this pattern **compare-and-swap**: change a value only if it still equals what you read earlier, otherwise fail and let the caller look again. Flight software uses the same idea when several tasks share one piece of memory, such as the latest attitude estimate, so that no task overwrites an update it never saw.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="l1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <line x1="20" y1="75" x2="345" y2="75" stroke="#6c7a93" stroke-width="1.5" marker-end="url(#l1)"/>
  <text x="340" y="95" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
  <circle cx="60" cy="75" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="55" font-size="11" text-anchor="middle" fill="#1f2a44">Leo pushes</text>
  <text x="60" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">server: 0be</text>
  <circle cx="170" cy="75" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="55" font-size="11" text-anchor="middle" fill="#1f2a44">Ravi pushes</text>
  <text x="170" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">server: 829</text>
  <circle cx="285" cy="75" r="6" fill="#b4232c" stroke="#1f2a44"/>
  <text x="285" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">Leo: lease says 0be</text>
  <text x="285" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">server has 829</text>
  <text x="285" y="100" font-size="11" text-anchor="middle" fill="#b4232c">rejected:</text>
  <text x="285" y="115" font-size="11" text-anchor="middle" fill="#b4232c">stale info</text>
</svg>
```
:::

::: context force-if-includes The second check, explained
`--force-with-lease` compares the server with your remote-tracking branch. `--force-if-includes` adds: and the remote-tracking branch's tip must appear somewhere in your *local branch's* reflog — proof that at some point your branch really contained it. A background fetch moves the remote-tracking branch but not your branch, so the check fails and the push is refused. The catch: bringing a colleague's commit in by cherry-pick makes a copy, not the original, so this check still refuses; you then drop the flag for that one push, having looked. Set `git config --global push.useForceIfIncludes true` to add it to every lease push.
:::

::: context protected-branches Branches the server will not let anyone rewrite
Hosting services let a team mark branches as **protected**. A protected `main` typically refuses any forced push, refuses deletion, and accepts new commits only through a reviewed pull request whose tests passed. This turns the golden rule from a habit into a guarantee for the branches where breaking it would hurt most. Lesson 06 shows how these rules are set up alongside required reviews and checks.
:::
