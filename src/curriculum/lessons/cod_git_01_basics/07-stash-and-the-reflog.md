---
id: l07-stash-and-the-reflog
title: "The safety net: stash and reflog"
minutes: 22
covers:
  - stash and reflog as the undo net
---

Two things happen to every engineer, usually in the same week. First: you are halfway through a change that does not even run yet, and someone needs a quick fix from you *right now*. You do not want to commit a broken half-thought, or lose it. Second: you type a `git reset --hard` one commit too far back, and three commits of real work vanish from `git log`.

Git has a tool for each. **`git stash`** puts half-finished work on a shelf so you can come back to it. The **reflog** is Git's private diary of every place your branches and HEAD have pointed, and it is how you find commits that seem to be gone. Together they are the undo net under everything you learned in lesson 06. Once you trust them, you can use the sharp tools without fear.

We keep working in orbit-sim. The hashes below come from one real run; yours will differ, as lesson 01 explained, but every step will look the same.

## Stash: a shelf for half-finished work

Picture your desk covered in papers for a project you are halfway through. A friend asks you to help with something small. You sweep the papers into a drawer, help your friend on a clean desk, then pull the papers back out exactly as they were. **`git stash`** is that drawer.

In Git words: **stashing** saves the uncommitted changes in your working tree and index somewhere safe, and puts your files back to match HEAD. Later you bring the changes back.

### Putting work on the shelf

Maya is adding an `escape_speed` function to `gravity.py`. It is half written. She also has a scratch file, `notes.txt`, that she never meant to commit. Then Ravi asks her to add one sentence to the README before a design review in ten minutes.

```bash
git status -s
```

```text
 M gravity.py
?? notes.txt
```

`M` in the second column means `gravity.py` is modified but not staged; `??` means `notes.txt` is untracked (lesson 02). Now stash, with a message so future Maya knows what this was:

```bash
git stash push -m "escape speed, half done"
```

```text
Saved working directory and index state On main: escape speed, half done
```

**`git stash push`** is the full command; plain `git stash` does the same thing without a message. Look at the status now:

```bash
git status -s
```

```text
?? notes.txt
```

The edit to `gravity.py` is gone — the file is back to the committed version. But `notes.txt` is still there: by default, stash saves only changes to **tracked** files, the ones Git already knows about.

If you want untracked files shelved too, add **`-u`** (short for `--include-untracked`):

```bash
git stash push -u -m "escape speed, half done"
```

Now the working tree is completely clean. (Ignored files, the subject of lesson 08, are left alone even with `-u`.)

### Seeing what is on the shelf

The shelf can hold many stashes, newest on top.

```bash
git stash list
```

```text
stash@{0}: On main: escape speed, half done
```

Read `stash@{0}` aloud as "stash at zero": the newest stash. The one before it is `stash@{1}`, and each new stash pushes the older ones down one number. `git stash show -p` (`-p` for "patch") shows a stash's full diff:

```bash
git stash show -p
```

```text
diff --git a/gravity.py b/gravity.py
index 72268a5..391b0d0 100644
--- a/gravity.py
+++ b/gravity.py
@@ -12,3 +12,8 @@ def accel(r):
 def circular_speed(r):
     """Speed (m/s) of a circular orbit of radius r (m)."""
     return (MU_EARTH / r) ** 0.5
+
+
+def escape_speed(r):
+    """Speed (m/s) needed to escape Earth from radius r (m)."""
+    return (2 * MU_EARTH / r) ** 0.5
```

### Taking work back off the shelf

There are three commands, and the difference matters:

- **`git stash pop`** applies the newest stash to your working tree *and* removes it from the list.
- **`git stash apply`** applies it but *keeps* it in the list. Useful if you want the same change on two branches.
- **`git stash drop`** removes a stash without applying it.

Each takes an optional name, like `git stash pop stash@{2}`, when you do not want the newest one.

::: example Answering an interruption without a half-baked commit
Maya has stashed her escape-speed work with `-u`, so the tree is clean. She edits the README, commits, and takes her work back:

```bash
printf '\nUnits are SI throughout: metres, seconds, kilograms.\n' >> README.md
git commit -qam "State that all units are SI"
git stash pop
```

```text
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   gravity.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	notes.txt

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (24064ddd719fbea4e721eb43dc29f5ca160ede76)
```

**Check the result.** The status lists exactly the two things she had before: `gravity.py` modified, `notes.txt` untracked. `git stash list` now prints nothing — pop removed the entry. And `git log --oneline` shows the README commit sitting on top of the first one, with no half-written function inside it:

```text
0c0c96e State that all units are SI
56c4c33 Add gravity model with circular orbit speed
```

:::

::: warning A pop that conflicts does not drop the stash
If the code changed while your work sat on the shelf, `git stash pop` can hit the same kind of conflict you resolved in lesson 05. Maya stashed her escape-speed function again, then committed a different function, `orbital_period`, at the same spot at the end of `gravity.py`. Popping gave:

```text
Auto-merging gravity.py
CONFLICT (content): Merge conflict in gravity.py
...
The stash entry is kept in case you need it again.
```

The file now has conflict markers labelled `Updated upstream` (what was committed) and `Stashed changes` (her stash). Fix the file as in lesson 05, `git add gravity.py`, and then run `git stash drop` yourself, because Git kept the stash on purpose. Forgetting that last step leaves an old stash on the list that you will not recognise in a month.
:::

::: key Stash in five commands
`git stash push -m "msg"` shelves uncommitted changes to tracked files (add `-u` for untracked files). `git stash list` shows the shelf, newest as `stash@{0}`. `git stash show -p` shows a stash's diff. `git stash pop` applies and removes; `git stash apply` applies and keeps; `git stash drop` removes without applying.
:::

A stash is not stored in some special hidden format. It is made of ordinary **[[commits|stash-commits]]** — one for the working tree, one for the index — and the ref `refs/stash` points at the newest. That is why a stash survives anything a commit survives, and why the reflog, which we meet next, can find even a stash you dropped by mistake.

::: warning A stash is a shelf, not a filing cabinet
A stash left for three weeks becomes a mystery: `stash@{4}: WIP on main: 56c4c33 Add gravity...` says almost nothing. If work will sit for more than a day, commit it on a branch (lesson 04) instead.
:::

## The reflog: Git's diary of where you have been

An airliner carries a **[[flight data recorder|flight-recorder]]**, the "black box". It does not steer the plane; it writes down what the plane did, so that afterwards anyone can reconstruct what happened. Git has the same thing for your repository.

The **reflog** (short for "reference log") is a list that Git keeps for HEAD and for each branch. Every time one of them moves — a commit, a reset, a switch, a merge, a stash — Git writes a line saying where it moved to, when, and why. It is stored in plain text files under `.git/logs/`.

Here is the reflog of our orbit-sim repository after a few more commits (the stash work above plus three new commits, which we are about to lose on purpose):

```bash
git reflog
```

```text
419813b HEAD@{0}: commit: Explain how to run the tests
ac40b8d HEAD@{1}: commit: Test escape speed against circular speed
4aaccc7 HEAD@{2}: commit: Add escape speed helper
2659286 HEAD@{3}: commit: Add circular orbit period
0c0c96e HEAD@{4}: reset: moving to HEAD
0c0c96e HEAD@{5}: reset: moving to HEAD
0c0c96e HEAD@{6}: commit: State that all units are SI
56c4c33 HEAD@{7}: reset: moving to HEAD
56c4c33 HEAD@{8}: reset: moving to HEAD
56c4c33 HEAD@{9}: commit (initial): Add gravity model with circular orbit speed
```

Each line gives the commit HEAD pointed at after the move, a name for that moment, and what caused the move. The newest line is on top.

The name **`HEAD@{3}`** is read "HEAD at three" and means "where HEAD was three moves ago". It is not `HEAD~3` (lesson 04), "three parents back". `HEAD~3` walks the commit graph; `HEAD@{3}` walks the diary. After a reset they name very different commits, and that difference is the whole trick of this lesson.

The lines `reset: moving to HEAD` came from `git stash`: to clean your working tree, stash quietly does the equivalent of `git reset --hard HEAD`. The diary records every move, even a move to the same place.

Each branch has its own reflog too. `git reflog show main` lists only the moves of `main`, with names like `main@{1}`, "main at one", meaning where `main` was one move ago. You can also name a moment by time: `main@{yesterday}` or `main@{2.hours.ago}`. And `git reflog --date=iso` swaps the counting names for real timestamps. Here are the top two lines as they look after the accident in the next section:

```text
2659286 HEAD@{2026-09-22 11:45:00 -0500}: reset: moving to HEAD~3
419813b HEAD@{2026-09-22 11:30:00 -0500}: commit: Explain how to run the tests
```

::: key What does the reflog record?
Every local movement of HEAD and of branch tips, with timestamps, for about 90 days by default. It is how you recover commits that are no longer reachable from any branch, including after a hard reset or a botched rebase.
:::

::: warning The reflog is yours alone
The reflog lives only in *your* `.git` folder. It is **[[not copied by clone|reflog-local]]** or sent to anyone else, and a fresh clone starts with an empty one. It is a record of what *you* did on *this* machine. So it can rescue your own mistakes, but it cannot tell you what a teammate did in their copy.
:::

## Why a "lost" commit is not gone

Lesson 01 gave you the word **reachable**: a commit is reachable if you can get to it from some ref (a branch, a tag, HEAD) by following parent arrows. `git log` shows only reachable commits.

Here is the key fact. When a commit becomes unreachable, **Git does not delete it**. Its object file stays in `.git/objects`, byte for byte, exactly as before. It is like a book that fell off the library catalogue: the book is still on the shelf; only the card that pointed to it is gone.

Commits do eventually disappear, through the clean-up command **`git gc`** ("**[[garbage collection|gc-timing]]**"), which Git also runs by itself now and then. But gc is deliberately slow:

- Reflog entries are kept for **90 days** by default.
- Entries that point at commits which are no longer reachable from their branch are kept for **30 days**.
- Anything a reflog entry names counts as reachable, so gc will not delete it.
- Once nothing at all names an object, gc still waits until it is about **two weeks** old before deleting it.

So a commit you lose by accident normally survives for about a month, with the reflog holding its name. That is a safety margin, not a plan — recover the same day.

## Recovering commits after `reset --hard`

Now the rescue. Maya has three fresh commits on `main`:

```text
419813b Explain how to run the tests
ac40b8d Test escape speed against circular speed
4aaccc7 Add escape speed helper
2659286 Add circular orbit period
0c0c96e State that all units are SI
56c4c33 Add gravity model with circular orbit speed
```

She means to throw away one experiment, but types:

```bash
git reset --hard HEAD~3
```

```text
HEAD is now at 2659286 Add circular orbit period
```

```bash
git log --oneline
```

```text
2659286 Add circular orbit period
0c0c96e State that all units are SI
56c4c33 Add gravity model with circular orbit speed
```

Three commits have vanished from the log, and the files in her working tree are back to how they were at `2659286`: no `escape_speed`, no tests.

In lesson 06, `git reset --hard ORIG_HEAD` undid a mistake like this. That works only while `ORIG_HEAD` still holds the old tip — it has one slot, and the next reset or merge overwrites it. The reflog keeps every move, so it works even if Maya notices the loss a day and several commands later.

::: example Finding and restoring three "lost" commits
**Step 1 — read the diary.**

```bash
git reflog -5
```

```text
2659286 HEAD@{0}: reset: moving to HEAD~3
419813b HEAD@{1}: commit: Explain how to run the tests
ac40b8d HEAD@{2}: commit: Test escape speed against circular speed
4aaccc7 HEAD@{3}: commit: Add escape speed helper
2659286 HEAD@{4}: commit: Add circular orbit period
```

The top line is the mistake. The line below it, `HEAD@{1}`, is where HEAD was *right before* the mistake: `419813b`, the newest of the three lost commits.

**Step 2 — make sure it is the right commit.** Any commit name works with `show`, including a reflog name:

```bash
git show --stat --oneline HEAD@{1}
```

```text
419813b Explain how to run the tests
 README.md | 2 ++
 1 file changed, 2 insertions(+)
```

**Step 3 — put a name on it.** The safest move is to create a branch there. A branch is a ref, so the commit becomes reachable again, and nothing else changes:

```bash
git branch rescue HEAD@{1}
git log --oneline --graph --decorate --all
```

```text
* 419813b (rescue) Explain how to run the tests
* ac40b8d Test escape speed against circular speed
* 4aaccc7 Add escape speed helper
* 2659286 (HEAD -> main) Add circular orbit period
* 0c0c96e State that all units are SI
* 56c4c33 Add gravity model with circular orbit speed
```

All six commits are back in view. `main` is still at `2659286`, and `rescue` points at `419813b`, whose parent chain runs through the two other lost commits.

**Step 4 — move `main` back.** Since Maya wants `main` exactly where it was before the mistake, she resets it to the reflog entry:

```bash
git reset --hard main@{1}
```

```text
HEAD is now at 419813b Explain how to run the tests
```

`main@{1}` means "where `main` was one move ago", which was `419813b`. `git log --oneline` now shows all six commits again, and the working tree has `escape_speed` and the tests back. Then `git branch -d rescue` removes the helper branch.

**Check.** Same hashes as before the mistake: `419813b`, `ac40b8d`, `4aaccc7`. These are the original commit objects; a pointer was put back.
:::

### A third way: `cherry-pick`

Sometimes `main` has gained new commits since the mistake, and you want the lost work added on top. **`git cherry-pick <commit>`** takes the change a commit made (its diff against its parent) and makes a *new* commit with that same change on top of wherever you are now. It is **[[named|cherry-pick-name]]** after picking single cherries off a tree instead of taking the whole branch.

Starting again from the reset state, with `main` at `2659286`:

```bash
git cherry-pick 4aaccc7 ac40b8d 419813b
```

```text
[main 3922da8] Add escape speed helper
 Date: Tue Sep 22 10:20:00 2026 -0500
 1 file changed, 5 insertions(+)
[main b3fa7df] Test escape speed against circular speed
 Date: Tue Sep 22 11:00:00 2026 -0500
 1 file changed, 10 insertions(+)
 create mode 100644 tests/test_gravity.py
[main 9782d93] Explain how to run the tests
 Date: Tue Sep 22 11:30:00 2026 -0500
 1 file changed, 2 insertions(+)
```

List the commits oldest first, so each change lands on top of the one it depends on. The three commits come back with the same messages, authors and contents, but **new hashes** (`3922da8`, not `4aaccc7`). A cherry-picked commit has a different parent or a different commit time, and lesson 01 showed that any change to a commit's text changes its name.

::: key Three ways back after a hard reset
Find the commit in `git reflog`, then either `git branch <name> <hash>` (safest: names it, moves nothing), `git reset --hard <branch>@{1}` (puts the branch back exactly, original hashes), or `git cherry-pick <hash>...` (re-applies the changes as new commits on top of where you are).
:::

## What `reset --hard` really destroys

Lesson 06 said `--hard` is the one kind of reset that can lose work. Now you can say exactly which work. Maya tries three kinds of uncommitted change at once: a line added to `gravity.py` and staged with `git add`, a line added to `README.md` but not staged, and a new file `draft.txt` never added.

```bash
git status -s
```

```text
 M README.md
M  gravity.py
?? draft.txt
```

```bash
git reset --hard HEAD
git status -s
```

```text
HEAD is now at 9782d93 Explain how to run the tests
?? draft.txt
```

Here is [[what happened to each|reset-hard-map]].

- **Committed work** is safe. The commits are still objects in the repository, and the reflog names them for weeks.
- **Untracked files** are untouched. `draft.txt` is still there: reset works on tracked files only.
- **Staged-but-uncommitted changes** are gone from the index and the working tree. But remember from lesson 02 that `git add` writes a blob right away. That blob is still in `.git/objects`, with no name pointing at it.
- **Unstaged changes to tracked files** are truly gone. They were never written into Git at all, so no reflog, no blob, nothing. This is the one real loss.

For the staged case there is a last-ditch tool. **`git fsck`** ("file system check") walks every object and reports the ones nothing points to. With `--lost-found`, it also copies each loose one into a **[[lost-and-found folder|lost-found]]**, `.git/lost-found/`:

```bash
git fsck --lost-found
```

```text
dangling commit 24064ddd719fbea4e721eb43dc29f5ca160ede76
dangling commit 419813bf3d0cbab85ac1bc82f983ae86a5b410ea
...
dangling blob def10fb78da311ad6ef5775e79aef30fa57d5b82
...
```

A **dangling** object is one that nothing points to. `git cat-file -p def10fb` prints the whole staged `gravity.py`, ending in Maya's line `J2 = 1.08263e-3  # Earth oblateness coefficient`. The dangling commits are old stashes (a popped or dropped stash becomes one) and the original `419813b` that cherry-pick copied. So `git fsck` also finds a stash dropped by accident: its message starts with `On main:` or `WIP on`.

::: key What `reset --hard` destroys, and what it does not
It moves the branch and overwrites the index and the tracked files in the working tree. Commits it "removes" survive as unreachable objects, named in the reflog. Untracked files are not touched. Staged changes survive only as dangling blobs (`git fsck --lost-found`). Unstaged edits to tracked files are lost for good.
:::

::: warning The reflog records commits, not keystrokes
The reflog can only take you back to states that were *committed* (or stashed). It has no record of the edits you typed and never committed. That is the practical reason to commit early and often on a branch of your own: every commit, even a messy one, is a point the net can catch. You can tidy the messy ones later, before anyone reviews them.
:::

## How flight software teams lean on the net

A typical rescue on a spacecraft software team: someone rewrites their branch (the next module's **[[rebase|rebase-preview]]**, or a reset) and the attitude-estimator commits from an hour ago are gone from the log. They run `git reflog`, find the line from before the rewrite, `git branch before-rewrite HEAD@{7}`, and compare with `git diff before-rewrite HEAD`. Five minutes, no drama.

## Check yourself

::: check Which diary line?
After a mistaken `git reset --hard HEAD~2`, your `git reflog` begins like this. Which commit do you want back, and name two different commands that make it reachable again.

```text
a41c9e0 HEAD@{0}: reset: moving to HEAD~2
77d2f18 HEAD@{1}: commit: Clamp thrust command to 100 percent
03bb5a9 HEAD@{2}: commit: Add thrust limiter test
a41c9e0 HEAD@{3}: commit: Read thrust table from CSV
```
:::

::: answer
The top line is the reset itself; the line under it, `HEAD@{1}`, is where you stood right before it: `77d2f18`, "Clamp thrust command to 100 percent". Its parent is `03bb5a9`, so getting `77d2f18` back also brings back the other lost commit. Two ways: `git branch recovered 77d2f18` (or `git branch recovered HEAD@{1}`), which names the commit without moving anything; or `git reset --hard 77d2f18` (or `HEAD@{1}`), which puts your current branch back where it was. Check first with `git show --stat 77d2f18`.
:::

::: check `~` versus `@{}`
Straight after that reset, do `HEAD~1` and `HEAD@{1}` name the same commit? Explain in one sentence each.
:::

::: answer
No. `HEAD~1` follows the parent arrow from where HEAD is *now* (`a41c9e0`), so it names `a41c9e0`'s parent, a commit older than anything in the snippet. `HEAD@{1}` reads the diary: where HEAD was one move ago, which is `77d2f18`, a commit *newer* than the current one. One walks the graph backward; the other walks your own actions backward.
:::

::: check Stash or not?
For each, say whether `git stash` alone would protect the work, and why: (a) you edited `thrusters.py`, a tracked file; (b) you created a new file `thruster_map.py` and never ran `git add`; (c) you edited `thrusters.py` and ran `git add` on it.
:::

::: answer
(a) Yes: stash saves changes to tracked files by default. (b) No: an untracked file is not stashed unless you use `git stash push -u`. Without `-u` it stays in the working tree, which is not dangerous, but it will not travel with the stash. (c) Yes: stash saves the index too, so staged changes are shelved and come back with `pop`. (To bring them back staged, not merely changed, use `git stash pop --index`.)
:::

::: check A dropped stash
You ran `git stash drop` on the wrong stash a few minutes ago. `git stash list` no longer shows it. Is it gone? How would you look for it?
:::

::: answer
Not yet. A stash is made of commits, and dropping it removes only the name `stash@{n}`; the objects stay until garbage collection deletes them. `git stash drop` even printed the hash, as in `Dropped refs/stash@{0} (24064dd…)`. If that has scrolled away, `git fsck --lost-found` lists dangling commits; the stash's message begins `On main:` or `WIP on`. Then `git stash apply <hash>` brings the changes back.
:::

::: check What the net cannot catch
A teammate says: "I ran `git reset --hard` and lost my morning of edits to `kalman.py`. Use the reflog." When is she right and when is she wrong?
:::

::: answer
Right if the work was committed: the commits are still objects, and the reflog names them. Partly right if the edits were staged: the staged version survives as a dangling blob that `git fsck --lost-found` can find. Wrong if the edits were never staged or committed: Git never stored them, so nothing can bring them back. Commit on a branch often, even messy commits.
:::

## Summary

| Command or idea | What it does |
| --- | --- |
| `git stash push -m "msg"` | shelve uncommitted changes to tracked files, leaving a clean working tree |
| `git stash push -u` | also shelve untracked files |
| `git stash list` / `show -p` | list stashes (`stash@{0}` is newest) / show one stash's diff |
| `git stash pop` / `apply` / `drop` | apply and remove / apply and keep / remove without applying |
| `git reflog` | every move of HEAD, newest first, with the reason |
| `HEAD@{n}`, `main@{n}` | where HEAD (or `main`) was `n` moves ago |
| `HEAD~n` | `n` parents back in the graph — not the same thing |
| Expiry | reflog entries 90 days; entries for unreachable commits 30 days; unnamed objects deleted by gc after about two weeks |
| Recovery | `git branch name <hash>`, `git reset --hard main@{1}`, or `git cherry-pick <hash>...` |
| `git fsck --lost-found` | find dangling commits and blobs (dropped stashes, staged-then-reset work) |
| Truly lost | unstaged edits to tracked files overwritten by `reset --hard` |

The next lesson turns from saving work to keeping things *out* of Git: build products, logs and secrets that should never be committed, and big binary files like Simulink models and golden telemetry that need special handling.

::: context stash-commits What a stash looks like inside
A stash is two or three ordinary commits. One records the index, with HEAD as its parent. The other records the working tree, and it has *two* parents — HEAD and the index commit — so it looks like a merge commit. With `-u`, a third commit holds the untracked files. `refs/stash` points at the working-tree commit, and older stashes are kept as earlier entries in the reflog of `refs/stash`. That is literally what `stash@{1}` means: "where the ref `stash` pointed one move ago".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="60" cy="100" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD</text>
  <text x="60" y="136" font-size="11" text-anchor="middle" fill="#6c7a93">0c0c96e</text>
  <circle cx="170" cy="55" r="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="59" font-size="11" text-anchor="middle" fill="#1f2a44">I</text>
  <text x="170" y="24" font-size="11" text-anchor="middle" fill="#6c7a93">index commit</text>
  <circle cx="260" cy="100" r="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">W</text>
  <text x="260" y="136" font-size="11" text-anchor="middle" fill="#6c7a93">working tree</text>
  <line x1="153" y1="62" x2="78" y2="92" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sa)"/>
  <line x1="242" y1="100" x2="80" y2="100" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sa)"/>
  <line x1="245" y1="89" x2="186" y2="64" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sa)"/>
  <rect x="300" y="45" width="54" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="327" y="61" font-size="11" text-anchor="middle" fill="#b4232c">stash</text>
  <line x1="315" y1="69" x2="274" y2="89" stroke="#b4232c" stroke-width="1.5" marker-end="url(#sa)"/>
</svg>
```

Arrows point from each commit to its parents, as in lesson 01.
:::

::: context flight-recorder Why aircraft carry a diary
A flight data recorder writes hundreds of measurements — altitude, airspeed, control positions, engine settings — many times a second onto memory built to survive a crash. Its whole job is to make the past recoverable after something goes wrong. Rockets do the same with telemetry: every flight streams its data to the ground, so that after an anomaly the team can replay exactly what happened, second by second. The reflog is a much humbler recorder, but it follows the same rule: write everything down while it happens, because you never know in advance which moment you will need.
:::

::: context reflog-local Why the reflog is not shared
When you clone a repository you get its objects and its refs, but not its `.git/logs` folder. That folder is a private record of one person's actions, like the undo history of a text editor — it would make no sense on anyone else's machine. So if a teammate asks you to find a commit they lost, the answer is always in *their* reflog, on *their* computer. The next module, on working with other copies of a repository, comes back to this: once a commit has been sent to a shared server, the server holds a named copy, and losing it locally stops mattering.
:::

::: context gc-timing The three clocks behind garbage collection
Three settings control how long a lost commit lives. `gc.reflogExpire` (default 90 days) deletes old reflog entries. `gc.reflogExpireUnreachable` (default 30 days) deletes sooner the entries that point at commits the branch can no longer reach — exactly the ones a hard reset creates. `gc.pruneExpire` (default two weeks) is how old an object with no name at all must be before gc deletes it. So for a commit lost by a reset, the reflog keeps it alive for 30 days, then gc may delete it the next time it runs. You can raise these numbers with `git config`, but the better habit is to recover the same day.
:::

::: context cherry-pick-name Where cherry-pick got its name
To "cherry-pick" in everyday English means to choose only the best items from a group, the way you would take only the ripe cherries from a tree. Git's command does that with commits: instead of merging a whole branch, you take one or a few commits and replay their changes where you are. Because each replayed commit gets a new parent, it is a new commit with a new hash, even though its diff and message are the same. Teams use it to carry a single urgent fix from a development branch onto a release branch without bringing along everything else.
:::

::: context reset-hard-map What each area loses in a hard reset
Four kinds of work, before and after `git reset --hard HEAD`. Only the red row is gone beyond Git's reach.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" font-weight="bold" fill="#1f2a44">kind of work</text>
  <text x="200" y="20" font-size="12" font-weight="bold" fill="#1f2a44">after reset --hard</text>
  <line x1="10" y1="28" x2="350" y2="28" stroke="#6c7a93" stroke-width="1"/>
  <rect x="10" y="36" width="340" height="28" rx="3" fill="#8fb8f0"/>
  <text x="18" y="54" font-size="11" fill="#1f2a44">committed</text>
  <text x="200" y="54" font-size="11" fill="#1f2a44">safe; named in reflog</text>
  <rect x="10" y="68" width="340" height="28" rx="3" fill="#8fb8f0"/>
  <text x="18" y="86" font-size="11" fill="#1f2a44">untracked file</text>
  <text x="200" y="86" font-size="11" fill="#1f2a44">untouched</text>
  <rect x="10" y="100" width="340" height="28" rx="3" fill="#f2b880"/>
  <text x="18" y="118" font-size="11" fill="#1f2a44">staged, not committed</text>
  <text x="200" y="118" font-size="11" fill="#1f2a44">dangling blob (fsck)</text>
  <rect x="10" y="132" width="340" height="28" rx="3" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="18" y="150" font-size="11" fill="#b4232c">unstaged edit, tracked file</text>
  <text x="200" y="150" font-size="11" fill="#b4232c">lost for good</text>
</svg>
```
:::

::: context lost-found The lost-and-found folder
The name `lost-found` comes from Unix. When a disk check program called `fsck` repairs a damaged file system, it finds pieces of files that no folder points to anymore, and it puts them into a folder called `lost+found` at the top of the disk, so a person can look through them. Git borrowed both the command name and the idea: `git fsck --lost-found` writes each dangling commit into `.git/lost-found/commit/` and each dangling blob into `.git/lost-found/other/`, named by hash, so you can open them with ordinary tools like `less`.
:::

::: context rebase-preview The botched rebase
The flashcard mentions "a botched rebase". **Rebase**, taught in the next module, rewrites a branch by replaying its commits on top of a different starting point, creating new commits with new hashes. If it goes wrong — a conflict resolved the wrong way, a commit accidentally dropped — the old commits are no longer on the branch. The reflog still has a line from right before the rebase started, often labelled `rebase (start)`, and `git reset --hard <branch>@{1}` or `HEAD@{n}` from that line takes you back to the branch exactly as it was.
:::
