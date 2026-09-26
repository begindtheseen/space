---
id: l05-merging-and-conflicts
title: Merging and resolving a conflict
minutes: 23
covers:
  - Fast-forward vs true merge; resolving a conflict
---

Last lesson, Maya's drag model grew on its own branch while `main` stayed safe for everyone else. Branches are only half the story, though. Sooner or later the drag model is finished, reviewed and tested, and it has to *join* `main` so the whole team gets it. Joining two lines of work is called **merging**.

Sometimes merging is almost nothing: Git slides a pointer forward and is done. Sometimes Git builds a new commit with two parents that ties the two lines together. And sometimes two people changed the same line in two different ways, and Git stops and asks a human to decide. That last case, a **merge conflict**, looks alarming the first time — strange arrows in the middle of your code — but it follows a few plain rules, and by the end of this lesson you will have resolved one.

Every idea here reuses what you already know: commits point to their parents, a branch is a pointer to one commit, and HEAD names the branch you are on.

## Where two branches last agreed: the merge base

Picture two hikers who walk the same trail together, then split at a fork, each taking a different path. To describe how their routes differ, you start from the fork: the last spot they stood together.

Two branches have a fork too. The **merge base** is the most recent commit that both branches contain — the newest common ancestor in the commit graph. Git finds it for you:

```bash
git merge-base main drag-model
```

```text
65bb5267418df1f4e9be8976d3dc45fbe73a3710
```

That is `65bb526`, where Maya created `drag-model` last lesson. The merge base matters because every merge is a question about it: *what has each side changed since the fork?* The [[fork picture|merge-base-picture]] shows it.

The command that joins branches is **`git merge <branch>`**. Read it as "bring that branch's work into the branch I am on". The branch you are on — the one HEAD names — is the one that moves. The other branch is only read.

## Fast-forward: sliding the pointer

Maya has tidied up after lesson 04: `git branch -d units-cleanup` removed that practice branch, and `git branch -D g0-experiment` removed the rounded-g0 experiment, which she decided not to keep. Here is the graph right before the merge:

```bash
git log --oneline --graph --all
```

```text
* 4fff28f (drag-model) Add exponential-atmosphere drag model
* 65bb526 (HEAD -> main) Explain how to run the tests
* 10b6fcf Add vector form of gravity acceleration
* cf192ed Add point-mass gravity model
* 903724b Add README
```

`main` has not moved since the fork. Its tip, `65bb526`, *is* the merge base. Everything `main` has, `drag-model` has too, plus one more commit. In graph words, `main`'s tip is an **ancestor** of `drag-model`'s tip: you can reach it by following parent arrows back from `4fff28f`.

So there is nothing to combine. `drag-model` is `main` plus more. Git can bring `main` up to date by moving its sticky note forward to `4fff28f`. That is a **fast-forward merge**:

::: example A fast-forward merge
**Step 1 — be on the branch that should move.** Maya is on `main` (the log shows `HEAD -> main`).

**Step 2 — merge.**

```bash
git merge drag-model
```

```text
Updating 65bb526..4fff28f
Fast-forward
 drag.py | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
 create mode 100644 drag.py
```

Read the first line as "moving from `65bb526` to `4fff28f`". The word `Fast-forward` names what happened. The rest is a summary of what changed in the working tree: `drag.py` appeared, 14 lines.

**Step 3 — check the graph.**

```bash
git log --oneline --graph --all
```

```text
* 4fff28f (HEAD -> main, drag-model) Add exponential-atmosphere drag model
* 65bb526 Explain how to run the tests
* 10b6fcf Add vector form of gravity acceleration
* cf192ed Add point-mass gravity model
* 903724b Add README
```

Both branches now point at `4fff28f`. The history is still a straight line.

**Sanity check.** No new commit was made — the newest commit is still Maya's drag commit, with its one parent `65bb526`. Git changed exactly one thing in `.git/refs`: the 41-byte `main` file now holds `4fff28f…`. It also updated the index and working tree to match, which is why `drag.py` appeared.
:::

## A true merge: when both branches moved

Most of the time, both sides keep working. While Leo, a teammate, adds a constant for Earth's **[[oblateness|j2-oblateness]]** on a branch called `j2-constant`, Maya lists the models in the README on `main`:

```text
* 40885d2 (HEAD -> main) List the models in the README
| * fc496ae (j2-constant) Add J2 oblateness constant
|/
* 4fff28f Add exponential-atmosphere drag model
* 65bb526 Explain how to run the tests
```

(That is the top of `git log --oneline --graph --all`. The `|/` is where the two lines fork.) Now neither tip is an ancestor of the other. `main` has `40885d2`, which `j2-constant` lacks, and the other way round. You cannot slide `main` forward to `fc496ae` — that would drop Maya's README commit from `main`'s history.

So Git does a **three-way merge**. It looks at three snapshots:

- the **base** — the merge base, `4fff28f`;
- **ours** — the tip of the branch we are on, `40885d2`;
- **theirs** — the tip of the branch being merged in, `fc496ae`.

Then it goes through every file, region by region, with one simple rule set:

| Base → ours | Base → theirs | Result |
| --- | --- | --- |
| unchanged | unchanged | keep it |
| changed | unchanged | take ours |
| unchanged | changed | take theirs |
| changed the same way | changed the same way | take it once |
| changed | changed differently | **conflict** — ask a human |

Only the last row needs you. Leo touched `gravity.py`; Maya touched `README.md`. No region was changed by both, so Git combines the two snapshots on its own and records the result as a new commit with **two parents**, called a **merge commit**.

::: example A merge commit and its two parents
**Step 1 — merge.** On `main`:

```bash
git merge j2-constant
```

Because this merge makes a new commit, Git opens your editor with a ready-made message, `Merge branch 'j2-constant'`. Save and close it (or add `--no-edit` to accept it without the editor). Then:

```text
Merge made by the 'ort' strategy.
 gravity.py | 2 ++
 1 file changed, 2 insertions(+)
```

The summary lists what came in *from the other side*: Leo's two lines in `gravity.py`. (**[['ort'|ort-strategy]]** is the name of Git's merge algorithm.)

**Step 2 — the graph.**

```bash
git log --oneline --graph --all
```

```text
*   f00b517 (HEAD -> main) Merge branch 'j2-constant'
|\
| * fc496ae (j2-constant) Add J2 oblateness constant
* | 40885d2 List the models in the README
|/
* 4fff28f Add exponential-atmosphere drag model
* 65bb526 Explain how to run the tests
```

The lines split at `4fff28f` and join again at `f00b517`. That diamond is the shape of a true merge.

**Step 3 — look inside the merge commit.**

```bash
git cat-file -p HEAD
```

```text
tree a172d4546942875e457d0623340122b95db9d24e
parent 40885d277f90cdc9e7b7c80ac1a468b003e18d4c
parent fc496aee14c55608234add23403dfa700fea0e4b
author Maya Chen <maya@example.com> 1789570800 -0500
committer Maya Chen <maya@example.com> 1789570800 -0500

Merge branch 'j2-constant'
```

Two `parent` lines. The first is where `main` was (ours); the second is the branch that came in (theirs). The tree is the combined snapshot, with both the README list and the J2 constant.

**Step 4 — name each parent.** Last lesson, `HEAD^` meant "the parent". For a merge, `HEAD^1` is the first parent and **`HEAD^2`**, read "HEAD caret two", is the second:

```bash
git log --oneline -1 HEAD^1
git log --oneline -1 HEAD^2
```

```text
40885d2 List the models in the README
fc496ae Add J2 oblateness constant
```

**Sanity check.** Only `main` moved: it now holds `f00b517`, and `j2-constant` still holds `fc496ae`. Every commit from both lines is reachable from `main` now, so `git branch -d j2-constant` succeeds — the work has a home.
:::

::: warning `~` and `^` differ at a merge
`HEAD~2` means "first parent, then first parent again" — two steps down the main line. `HEAD^2` means "the *second* parent of HEAD" — one step, onto the merged branch. On a straight history only `^1` exists, and `HEAD^` and `HEAD~1` agree. At a merge commit they go different places.
:::

## Choosing a merge commit anyway: `--no-ff`

A fast-forward leaves no trace that a branch ever existed: the drag commit sits on `main`'s straight line. Some teams want that trace. The graph then shows, forever, "these commits were developed together as the drag feature, and joined here".

The flag **`--no-ff`** ("no fast-forward") tells Git to make a merge commit even when a fast-forward was possible. Here is the drag merge again, done the other way from the same starting point:

```bash
git merge --no-ff drag-model
git log --oneline --graph --all
```

```text
Merge made by the 'ort' strategy.
 drag.py | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
 create mode 100644 drag.py
*   6bdb3c9 (HEAD -> main) Merge branch 'drag-model'
|\
| * 4fff28f (drag-model) Add exponential-atmosphere drag model
|/
* 65bb526 Explain how to run the tests
```

The merge commit `6bdb3c9` has parents `65bb526` and `4fff28f`. The snapshot is identical to the fast-forward's; only the shape of history differs. The [[side-by-side picture|ff-picture]] compares the two. Which one a team prefers is a matter of taste and of how their review tools work — the next module comes back to it.

One more case: if the branch you merge is *behind* yours (everything it has, you already have), there is nothing to do, and Git says `Already up to date.`

::: key Fast-forward merge vs merge commit
If the target branch tip is an ancestor of the source, Git can just slide the pointer forward with no new commit. Otherwise it creates a merge commit with two parents. `--no-ff` forces the merge commit so the branch topology survives in history.
:::

## When both sides changed the same lines: a conflict

Now the last row of the table. Maya and Leo both edit the first line of `gravity.py`, the value of Earth's gravitational parameter $\mu$.

- On a branch `egm96-mu`, Leo switches to the value from a gravity model called **[[EGM96|mu-values]]**: `3.986004415e14`, with the comment `(EGM96)`.
- On `main`, Maya keeps the value `3.986004418e14` but adds the source to the comment: `(WGS 84)`.

Base, ours and theirs all differ on the same line. No rule can pick for them — only a person who knows *why* each change was made can. So Git does all the parts of the merge it can, stops, and hands you the rest.

::: example Resolving a conflict, start to finish
**Step 1 — the merge stops.** On `main`:

```bash
git merge egm96-mu
```

```text
Auto-merging gravity.py
CONFLICT (content): Merge conflict in gravity.py
Automatic merge failed; fix conflicts and then commit the result.
```

No merge commit was made. You are now *in the middle of a merge*. Git remembers that (it writes `.git/MERGE_HEAD`, holding the other tip) until you finish or abort.

**Step 2 — ask status.**

```bash
git status
```

```text
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   gravity.py

no changes added to commit (use "git add" and/or "git commit -a")
```

`both modified` means: base to ours changed this file, base to theirs changed it too, and at least one region clashes. Any file that merged cleanly would be listed as already staged.

**Step 3 — read the conflict markers.** Git wrote both versions into the working file, fenced by **conflict markers**. Here are the first lines, with line numbers (`cat -n`):

```bash
cat -n gravity.py | head -7
```

```text
     1	<<<<<<< HEAD
     2	MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter (WGS 84)
     3	=======
     4	MU_EARTH = 3.986004415e14  # m^3/s^2, Earth's gravitational parameter (EGM96)
     5	>>>>>>> egm96-mu
     6	G0 = 9.80665               # m/s^2, standard gravity
     7	
```

Read the fence top to bottom:

- `<<<<<<< HEAD` opens the conflict. Below it is **ours** — the version on the branch you are on.
- `=======` separates the two sides.
- Below it is **theirs**, and `>>>>>>> egm96-mu` closes the conflict, naming the branch it came from.

Line 6 onward merged fine; only lines 1 to 5 are Git's question to you.

**Step 4 — see what the base said.** The two sides alone do not say who changed what. The command `git checkout --conflict=diff3 gravity.py` rewrites the markers with a middle section showing the **base** version too:

```text
     1	<<<<<<< ours
     2	MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter (WGS 84)
     3	||||||| base
     4	MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter
     5	=======
     6	MU_EARTH = 3.986004415e14  # m^3/s^2, Earth's gravitational parameter (EGM96)
     7	>>>>>>> theirs
```

Now the story is plain. Ours changed only the comment. Theirs changed the *number*. They are not really competing edits; they answer different questions. (You can make this three-part view your default; see the [[note on conflict styles|conflict-style]].)

**Step 5 — decide, then edit.** The team's navigation code uses WGS 84 everywhere, and the test expects that value. Leo's EGM96 number is still useful for one comparison study. So Maya keeps the WGS 84 value as `MU_EARTH` and keeps Leo's number under its own name. She deletes all the marker lines and writes:

```python
MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter (WGS 84)
MU_EARTH_EGM96 = 3.986004415e14  # m^3/s^2, the same constant in the EGM96 model
G0 = 9.80665               # m/s^2, standard gravity
```

Notice the resolution is *neither* side exactly. A resolution is whatever the code should be — you are not limited to picking one.

**Step 6 — test.** Before the edit, the test run would not even start: Python stops at line 1, `SyntaxError: invalid syntax`, because `<<<<<<< HEAD` is not Python. After the edit:

```bash
python3 -m pytest -q
```

```text
.                                                                        [100%]
1 passed in 0.00s
```

**Step 7 — mark it resolved and commit.** `git add` tells Git "this file is resolved". Then `git commit` finishes the merge:

```bash
git add gravity.py
git commit
```

```text
[main 84c8d78] Merge branch 'egm96-mu'
```

The editor opened with `Merge branch 'egm96-mu'` already filled in, plus a commented-out list of the conflicted files, which Git drops when you save.

**Sanity check.** `git log --oneline --graph` shows a second diamond, with `84c8d78` on top and parents `d169523` (Maya's WGS 84 commit) and `286467e` (Leo's). `git show HEAD` prints a **[[combined diff|combined-diff]]**, which marks with `++` the one line that is new compared with *both* parents — the line Maya wrote by hand, `MU_EARTH_EGM96 = …`.
:::

::: warning Git does not check that the markers are gone
`git add` will happily stage a file that still contains `<<<<<<<`, and `git commit` will commit it. The only thing standing between conflict markers and `main` is you. Before `git add`, search for them — `grep -n '<<<<<<<\|>>>>>>>' gravity.py` should print nothing — and run the tests.
:::

### Where the three versions live during a conflict

Lesson 02 described the index as holding one version of each file. During a conflict it holds up to three, numbered by **stage**: 1 is the base, 2 is ours, 3 is theirs. You can list them:

```bash
git ls-files -u
```

```text
100644 5b19a88d6bd2dd79cd656061734c533933be49a5 1	gravity.py
100644 fb2a4eef376ea41be51e7f677a7a24d0afce31fb 2	gravity.py
100644 d47c0f2d044e0e3eae3d79b0e0c9aa6cd1ff529c 3	gravity.py
```

That is why `git add` is the "resolved" signal: it replaces the three stages with the one file you give it. And it is why a conflict never loses anything — all three versions are safe blobs until you finish.

### Backing out: `git merge --abort`

If you start a merge and realise you are not ready — the conflict needs Leo, and Leo is at lunch — run:

```bash
git merge --abort
```

It prints nothing. It puts `main`, the index and the working tree back exactly as they were before `git merge`, and forgets the merge in progress. You can try again later.

::: key Resolving a conflict
A conflict happens when both sides changed the same (or touching) lines since the merge base. Git writes both versions between `<<<<<<<`, `=======` and `>>>>>>>` markers and stops. You edit the file to what it should be, remove every marker, test, `git add` the file to mark it resolved, then `git commit` to make the merge commit. `git merge --abort` returns to the state before the merge.
:::

::: warning Close is the same as overlapping
Git compares regions of lines, not single lines. If one side edits line 1 and the other edits line 2, with no unchanged line between them, that is a conflict too — Git cannot be sure the two edits do not depend on each other. Edits in well-separated parts of the same file merge cleanly.
:::

## Merging well on a real team

Conflicts are not failures. They are Git refusing to guess about code that matters. Still, a few habits make them rare and small:

- **Merge often.** A branch that lives for two days collects a few small conflicts. One that lives for two months collects a nightmare. Bring `main` into your branch now and then (`git merge main` while on your branch), so you meet each conflict while it is small.
- **Keep changes focused.** A branch that reformats every file *and* fixes a bug touches every line, so it conflicts with everyone. Put reformatting in its own branch, merged quickly.
- **Resolve with the author.** When the right answer is not obvious — like Leo's $\mu$ — ask the person who wrote the other side. The commit messages on both sides (lesson 03) should say *why*; that is exactly what you need here.
- **Never merge by picking a side without reading it.** Flags exist to take "all ours" or "all theirs" automatically. On guidance code, a conflict resolved without reading is how a correct fix quietly disappears.

Some files cannot be merged line by line at all — a Simulink model or a CAD part is a binary file, and "take lines 1 to 5 from each" means nothing for it. Lesson 08 shows how teams tell Git so, and why they lock such files instead.

## Check yourself

::: check Which kind of merge?
`main` points at `c3`. A branch `fix` was made at `c3` and has two new commits, `c4` and `c5`. Nobody touched `main`. On `main`, you run `git merge fix`. What kind of merge happens, how many new commits are made, and where does each branch point afterwards?
:::

::: answer
A fast-forward. `main`'s tip `c3` is an ancestor of `fix`'s tip `c5` (and is the merge base), so there is nothing to combine. No new commit is made. Afterwards `main` and `fix` both point at `c5`. With `--no-ff` instead, Git would make one new merge commit with parents `c3` and `c5`, and `main` would point at it while `fix` stayed at `c5`.
:::

::: check Apply the table
The base version of a file has three lines, A, B, C, each far apart. Ours changed A to A′ and left the rest. Theirs changed C to C′ and deleted nothing. A second file was changed identically on both sides. What does the three-way merge produce for each file? Is there a conflict?
:::

::: answer
First file: A′, B, C′. Line A changed only on our side, so ours wins; C changed only on theirs, so theirs wins; B changed nowhere. Second file: both sides made the same change, so it is taken once. No conflict anywhere, and Git makes the merge commit by itself.
:::

::: check Reading markers
During a merge from branch `thrust-table` into `main`, you see:

`<<<<<<< HEAD` / `ISP_VAC = 311.0` / `=======` / `ISP_VAC = 311.3` / `>>>>>>> thrust-table`

(each on its own line). Which value is on `main`, which on the branch, and what must be true of the file before you run `git add`?
:::

::: answer
The part between `<<<<<<< HEAD` and `=======` is ours — the branch you are on, `main` — so `main` has `311.0`. The part after `=======` is theirs, from `thrust-table`: `311.3`. Before `git add`, the file must contain what the code should be (one line, probably after asking whoever changed it and checking the data sheet) and none of the three marker lines. Then run the tests, `git add`, and `git commit`.
:::

::: check Parents
After the conflict example, HEAD is the merge commit `84c8d78`, whose parents are `d169523` (from `main`) and `286467e` (from `egm96-mu`). What do `HEAD^1`, `HEAD^2` and `HEAD~1` name? What would `HEAD^3` be?
:::

::: answer
`HEAD^1` is the first parent, `d169523` — where `main` was. `HEAD^2` is the second parent, `286467e` — the branch that was merged in. `HEAD~1` follows the first parent once, so it is also `d169523`. `HEAD^3` does not exist: this commit has only two parents, and Git reports that it cannot resolve the name.
:::

::: check Abort or resolve?
You started `git merge egm96-mu`, saw the conflict, edited `gravity.py` halfway, and then decided you need to talk to Leo first. What do you run, and what will the working tree look like afterwards?
:::

::: answer
`git merge --abort`. It puts the branch, the index and the working tree back to how they were right before the merge, so `gravity.py` returns to `main`'s committed version — your half-done edits and the markers are gone — and Git forgets the merge in progress. When you are ready, run `git merge egm96-mu` again and the same conflict appears.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Merge base | newest commit both branches contain; `git merge-base A B` |
| `git merge X` | bring branch X into the branch HEAD names; only your branch moves |
| Fast-forward | your tip is an ancestor of X's tip: slide the pointer, no new commit |
| Three-way merge | compare base, ours, theirs region by region; one-sided changes win |
| Merge commit | a commit with two parents; `HEAD^1` is ours, `HEAD^2` is theirs |
| `--no-ff` | make a merge commit even when a fast-forward was possible |
| Conflict | both sides changed the same or touching lines; markers `<<<<<<<` `=======` `>>>>>>>` |
| Resolve | edit, remove markers, test, `git add`, `git commit` |
| Stages | during a conflict the index holds 1 base, 2 ours, 3 theirs (`git ls-files -u`) |
| `git merge --abort` | put everything back as it was before the merge |

Merging only ever adds to history. Next lesson is about going backward: moving a branch to an older commit with `reset`, cancelling a commit with a new one using `revert`, and bringing back a file's old contents with `restore` — and exactly what each of them touches.

::: context merge-base-picture The fork where two branches last agreed
The merge base is the newest commit you reach by following parent arrows back from *both* tips. Here the tips are `40885d2` (`main`) and `fc496ae` (`j2-constant`), and the merge base is `4fff28f`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="q1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="85" r="17" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <circle cx="125" cy="85" r="17" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">4ff</text>
  <circle cx="220" cy="45" r="17" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">408</text>
  <circle cx="220" cy="125" r="17" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">fc4</text>
  <line x1="108" y1="85" x2="59" y2="85" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q1)"/>
  <line x1="204" y1="53" x2="142" y2="78" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q1)"/>
  <line x1="204" y1="117" x2="142" y2="92" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q1)"/>
  <text x="125" y="124" font-size="11" text-anchor="middle" fill="#b4232c">merge base</text>
  <rect x="265" y="35" width="80" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="305" y="49" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="265" y1="45" x2="240" y2="45" stroke="#b4232c" stroke-width="1.5" marker-end="url(#q1)"/>
  <rect x="265" y="115" width="80" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="305" y="129" font-size="11" text-anchor="middle" fill="#b4232c">j2-constant</text>
  <line x1="265" y1="125" x2="240" y2="125" stroke="#b4232c" stroke-width="1.5" marker-end="url(#q1)"/>
  <text x="220" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">ours</text>
  <text x="220" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">theirs</text>
</svg>
```

Everything older than the base (`65b` and back) is shared history, and the merge ignores it.
:::

::: context j2-oblateness What J2 measures
Earth is not a perfect ball. Its spin makes it bulge at the equator: the equatorial radius is about 21 km larger than the polar one. That bulge adds a small extra pull, strongest near the equator, which slowly swings the orbits of satellites around. The number $J_2 \approx 1.083 \times 10^{-3}$ ("J two") measures the size of the bulge's effect. It is the biggest correction to point-mass gravity for a satellite in low orbit, and it is the reason sun-synchronous orbits work. Orbit-sim will use it in a later module.
:::

::: context ort-strategy The name "ort"
Git can merge using different **strategies** (algorithms). Since Git 2.34, released in 2021, the default is **ort**, which its author said stands for "Ostensibly Recursive's Twin": it gives the same results as the older default, called "recursive", but was rewritten to be much faster on big repositories and to handle renames better. You will see "recursive" in older output. For everything in this module the two behave the same way.
:::

::: context ff-picture Fast-forward and --no-ff, side by side
Same starting point, same final files. On the left, `main` slid forward onto the drag commit. On the right, a merge commit M with two parents records that the drag work arrived as a branch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="q2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="80" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">fast-forward</text>
  <text x="270" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">--no-ff</text>
  <line x1="175" y1="10" x2="175" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="35" cy="110" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="35" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <circle cx="110" cy="110" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">4ff</text>
  <line x1="94" y1="110" x2="53" y2="110" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q2)"/>
  <rect x="83" y="48" width="54" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="110" y="62" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="110" y1="68" x2="110" y2="92" stroke="#b4232c" stroke-width="1.5" marker-end="url(#q2)"/>
  <circle cx="205" cy="110" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="205" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <circle cx="265" cy="145" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="149" font-size="11" text-anchor="middle" fill="#1f2a44">4ff</text>
  <circle cx="320" cy="110" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="320" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">M</text>
  <line x1="304" y1="110" x2="223" y2="110" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q2)"/>
  <line x1="306" y1="119" x2="279" y2="138" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q2)"/>
  <line x1="252" y1="140" x2="220" y2="118" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#q2)"/>
  <rect x="293" y="48" width="54" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="320" y="62" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="320" y1="68" x2="320" y2="92" stroke="#b4232c" stroke-width="1.5" marker-end="url(#q2)"/>
</svg>
```

M's first parent is `65b`, the old `main`; its second parent is `4ff`, the drag commit.
:::

::: context mu-values Two right answers for one constant
Earth's gravitational parameter $\mu$ is measured, not defined, so different reference models quote slightly different values. The WGS 84 system, which GPS uses, gives $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$; the EGM96 gravity model lists $3.986004415 \times 10^{14}$. They differ by about 7.5 parts in ten billion. That sounds like nothing — for a geostationary satellite it shifts the radius of an orbit with a fixed period by about 1 cm — but precise orbit work must use the *same* value everywhere, which is why a conflict on this line deserves a real decision.
:::

::: context conflict-style Seeing the base in every conflict
The two-part markers show ours and theirs but hide the base, so you cannot tell who changed what. One setting fixes that for good:

`git config --global merge.conflictStyle diff3`

After that, every conflict has a third section, opened by `|||||||` and the merge base's short hash (for this merge, `||||||| f00b517`), holding the original lines. Newer Git also offers `zdiff3`, which does the same but trims lines that are identical on all sides out of the conflict. Many experienced engineers turn one of these on first thing on a new machine.
:::

::: context combined-diff Reading a diff with two parents
A merge commit has two parents, so `git show` compares the result with *both* at once. This **combined diff** has two marker columns instead of one: the first column compares with parent 1, the second with parent 2. A line starting `++` is new compared with both parents — something the person resolving wrote by hand. A line starting ` +` or `+ ` was already in one parent. Stretches where the result matches one parent exactly are left out, so the combined diff of a clean merge is often empty. That makes it a quick way to review exactly what a person decided during a conflict.
:::
