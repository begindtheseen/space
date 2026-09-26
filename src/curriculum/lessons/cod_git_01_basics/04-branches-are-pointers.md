---
id: l04-branches-are-pointers
title: Branches are pointers
minutes: 20
covers:
  - Branches as pointers; checkout/switch; detached HEAD
---

Maya wants to add air drag to orbit-sim. It will take a few days, and halfway through, the code will be broken — a function half written, a test that does not pass yet. Meanwhile the rest of the team runs the simulator from `main` every morning to check their own work. If Maya commits her half-finished drag model on `main`, she breaks everyone's morning.

What she needs is a second line of work: a place to commit freely, which leaves `main` exactly as it is until the drag model is ready. That is a **branch**. In many older version control systems, making a branch meant copying the whole project, and teams avoided it. In Git, a branch costs 41 bytes, and you will make dozens of them a week.

In lesson 01 you opened `.git/refs/heads/main` and found a single commit hash inside. This lesson takes that one fact and follows it all the way: what happens when you make a branch, move onto it, commit on it, and step off it — and the one odd state, **detached HEAD**, that puzzles almost everyone the first time.

## A branch is a sticky note on a commit

Think of the commit graph as a row of photos pinned to a wall, each with a string running back to the photo before it. A branch is a **sticky note** with a name written on it, stuck to one photo. The note does not contain any photos. It only says "here". You can put two notes on the same photo, peel a note off and stick it somewhere else, or throw a note away. None of that changes a single photo.

That is exactly what a branch is on disk. A branch is a **ref** — a named pointer — stored as a file under `.git/refs/heads/`, holding the hash of one commit, the **tip** of the branch. Everything else we call "the branch" (its whole history) is found by starting at that tip and following `parent` links backward, as lesson 01 showed.

The other name you need is **HEAD**, the "you are here" marker. Normally HEAD does not hold a hash; it holds the *name of a branch*, like `ref: refs/heads/main`. So there are two hops: HEAD names a branch, and the branch names a commit.

::: key What a branch is, physically
A 41-byte file under `.git/refs/heads` containing a commit hash. Creating a branch is free; moving it is a one-line write. HEAD is a ref that usually points at a branch ref.
:::

## Making a branch: `git branch`

Here is orbit-sim as lesson 02 left it: four commits on `main`, the last one `65bb526 Explain how to run the tests`. The command **`git branch`** with no name lists the branches; the star marks the one HEAD names:

```bash
git branch
```

```text
* main
```

Give it a name, and it makes a new branch pointing at the commit you are on:

```bash
git branch drag-model
git branch
```

```text
  drag-model
* main
```

Now look at the two branch files and at HEAD:

```bash
cat .git/refs/heads/drag-model
cat .git/refs/heads/main
cat .git/HEAD
```

```text
65bb5267418df1f4e9be8976d3dc45fbe73a3710
65bb5267418df1f4e9be8976d3dc45fbe73a3710
ref: refs/heads/main
```

Two sticky notes on the same photo. Git wrote one new 41-byte file and nothing else: no files were copied, no commit was made. HEAD still names `main`, so you are still "on" `main`. Making a branch does not move you onto it.

The log shows the same thing in one line. The part in brackets is called the **decoration** — the refs that point at each commit:

```bash
git log --oneline -1
```

```text
65bb526 (HEAD -> main, drag-model) Explain how to run the tests
```

Read `HEAD -> main` aloud as "HEAD points to main". The arrow is Git telling you about the two hops.

## Moving onto a branch: `git switch`

To work on the new branch, you move HEAD onto it with **`git switch`**:

```bash
git switch drag-model
cat .git/HEAD
```

```text
Switched to branch 'drag-model'
ref: refs/heads/drag-model
```

HEAD's file now names `drag-model`. In general, `git switch <branch>` does three things, in the language of lesson 02's three areas:

1. It points HEAD at that branch.
2. It fills the **index** (the staging area) with that branch's tip snapshot.
3. It updates the **working tree** — your files on disk — to match that snapshot, adding, changing and deleting files as needed.

Here steps 2 and 3 changed nothing, because both branches point at the same commit. The next example is where they start to matter.

::: example A commit on a branch moves only that branch
**Setup.** HEAD names `drag-model`, and both branches point at `65bb526`. Maya creates `drag.py`, with an air-density model and the drag formula:

```python
import math

RHO0 = 1.225      # kg/m^3, air density at sea level
H_SCALE = 8500.0  # m, scale height of the atmosphere


def density(h):
    """Air density (kg/m^3) at altitude h (m), exponential model."""
    return RHO0 * math.exp(-h / H_SCALE)


def drag_accel(h, v, cd, area, mass):
    """Size of the drag deceleration (m/s^2) on a body moving at speed v (m/s)."""
    return 0.5 * density(h) * v**2 * cd * area / mass
```

Air gets thinner with height, which `density(h)` models, and drag grows with the square of speed. The inputs `cd` (the drag coefficient, a number describing the body's shape), `area` (its frontal area, in m²) and `mass` (in kg) are whatever vehicle you are simulating.

**Step 1 — commit it.**

```bash
git add drag.py
git commit -m "Add exponential-atmosphere drag model"
```

```text
[drag-model 4fff28f] Add exponential-atmosphere drag model
 1 file changed, 14 insertions(+)
 create mode 100644 drag.py
```

The first bracket says which branch the commit went onto: `drag-model`.

**Step 2 — look at the two sticky notes.**

```bash
cat .git/refs/heads/drag-model
cat .git/refs/heads/main
```

```text
4fff28f24499543154596fe8ef676199e8965a3c
65bb5267418df1f4e9be8976d3dc45fbe73a3710
```

When Git made the commit, it wrote the new hash into the file of the branch HEAD names — and only that one. `main` did not move. The **[[before-and-after picture|branch-move-picture]]** shows the two notes pulling apart.

**Step 3 — the graph.** Using lesson 03's favorite command:

```bash
git log --oneline --graph --all
```

```text
* 4fff28f (HEAD -> drag-model) Add exponential-atmosphere drag model
* 65bb526 (main) Explain how to run the tests
* 10b6fcf Add vector form of gravity acceleration
* cf192ed Add point-mass gravity model
* 903724b Add README
```

**Step 4 — step back onto `main`.**

```bash
git switch main
ls
```

```text
Switched to branch 'main'
README.md  gravity.py  tests
```

`drag.py` has vanished from the folder. That is step 3 of `switch` at work: the working tree now matches `main`'s snapshot, and that snapshot has no `drag.py`. Nothing is lost — the blob, the tree and the commit are all safe in `.git/objects`, and `git switch drag-model` brings the file straight back.

**Sanity check.** The teammates who run from `main` get exactly the four commits they had this morning. Maya's work sits one commit ahead on her own branch, where it can be half-finished without hurting anyone.
:::

::: warning "My file disappeared!"
When a file vanishes after a switch, it almost always lives on the other branch. Run `git log --oneline --graph --all` to see where the branches are, and `git branch` to see which one you are on. Switching never deletes committed work.
:::

## Two commands for one job: `switch` and `checkout`

You will see **`git checkout`** everywhere — in older tutorials, in your team's scripts, in answers online. For years it was the only way to change branches, and it still works. The trouble is that `checkout` also does a second, unrelated job: overwriting files with older versions of them. One command, two very different effects, was a steady source of accidents. So in 2019 Git **[[split it into two|switch-restore-history]]**: `git switch` for moving between branches, and `git restore` for files (lesson 06).

Here are the pairs that do the same thing:

| Newer command | Older spelling | What it does |
| --- | --- | --- |
| `git switch drag-model` | `git checkout drag-model` | move onto an existing branch |
| `git switch -c units-cleanup` | `git checkout -b units-cleanup` | create a branch here and move onto it |
| `git switch --detach cf192ed` | `git checkout cf192ed` | stand on a commit without a branch |
| `git switch -` | `git checkout -` | go back to the branch you were on before |

The `-c` stands for "create", and `-b` for "branch". Both are the everyday way to start new work: make the branch and step onto it in one command.

```bash
git switch -c units-cleanup
```

```text
Switched to a new branch 'units-cleanup'
```

This lesson uses `switch`. When you meet `checkout` with a branch name, read it as `switch`.

## Naming commits by where they sit: `~` and `^`

Typing hashes gets old. Git lets you name a commit by counting back from another one.

- **`HEAD~1`**, read "HEAD tilde one", is the parent of the commit you are on.
- **`HEAD~2`** is the parent's parent — the grandparent — and so on. `HEAD~3` is three steps back.
- **`HEAD^`**, read "HEAD caret", is another way to write `HEAD~1`.

The same suffixes work after any branch name or hash: `main~2`, `4fff28f~1`. Ask Git to translate with `git rev-parse` (on `main`, whose tip is `65bb526`):

```bash
git rev-parse HEAD~1 HEAD~2 HEAD^
```

```text
10b6fcf1bdf5f2033472f1045ae534af24d49d9a
cf192edf4f4a9ab887cb65baaceb27e938ee2b6e
10b6fcf1bdf5f2033472f1045ae534af24d49d9a
```

Count it on the log: `65bb526` → one back is `10b6fcf` → two back is `cf192ed`. The [[counting picture|tilde-picture]] lines them up. Next lesson, when a commit has *two* parents, you will meet `^2`, which picks the second one.

::: key Relative names
`HEAD~n` is the commit $n$ parent steps back from HEAD, always following the first parent. `HEAD^` means the same as `HEAD~1`. They work after any ref or hash: `main~2`, `drag-model^`.
:::

## Detached HEAD: standing on a commit

Normally you ride on a branch: HEAD names the branch, and each commit you make pushes the branch forward, with HEAD along for the ride. But sometimes you want to look at an old commit directly — to run an old test, or see how the code behaved last month. For that, HEAD can hold a **commit hash** instead of a branch name. That state is called **detached HEAD**: HEAD is not attached to any branch.

`git switch` wants a branch name, so it refuses a bare hash and tells you what to add:

```bash
git switch cf192ed
```

```text
fatal: a branch is expected, got commit 'cf192ed'
hint: If you want to detach HEAD at the commit, try again with the --detach option.
```

`git checkout cf192ed` does detach, and prints a long notice worth reading once:

```text
Note: switching to 'cf192ed'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -c with the switch command. Example:

  git switch -c <new-branch-name>

Or undo this operation with:

  git switch -

Turn off this advice by setting config variable advice.detachedHead to false

HEAD is now at cf192ed Add point-mass gravity model
```

Look at HEAD's file now:

```bash
cat .git/HEAD
```

```text
cf192edf4f4a9ab887cb65baaceb27e938ee2b6e
```

A raw hash, where a branch name used to be. That is the whole difference. `git status` starts with `HEAD detached at cf192ed`, and the log decoration shows `(HEAD)` with no arrow, because HEAD points at nothing but the commit.

Detached HEAD is not an error. It is the normal way to inspect history, and tools use it all the time — lesson 10's `git bisect` hops you from one detached commit to the next while it hunts for a bug. The trouble starts only if you *commit* while detached.

::: example Committing while detached, and rescuing the commit
**Setup.** HEAD is detached at `cf192ed`, the second commit. Maya is curious whether rounding standard gravity to $9.81\,\mathrm{m/s^2}$ changes the test result, so she edits the line to `G0 = 9.81`. The test still passes — the model gives about 9.820 at the surface, within 0.05 of 9.81 — and she commits the experiment to keep it.

```bash
git commit -am "Try rounded g0"
git log --oneline --graph --all
```

```text
[detached HEAD 20982c3] Try rounded g0
 1 file changed, 1 insertion(+), 1 deletion(-)
* 20982c3 (HEAD) Try rounded g0
| * 4fff28f (drag-model) Add exponential-atmosphere drag model
| * 65bb526 (main) Explain how to run the tests
| * 10b6fcf Add vector form of gravity acceleration
|/
* cf192ed Add point-mass gravity model
* 903724b Add README
```

The commit worked: `20982c3` has `cf192ed` as its parent. But no branch file was updated, because HEAD named no branch. Only HEAD itself holds `20982c3`.

**Step 1 — switch away.** Watch what Git says:

```bash
git switch main
```

```text
Warning: you are leaving 1 commit behind, not connected to
any of your branches:

  20982c3 Try rounded g0

If you want to keep it by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 20982c3

Switched to branch 'main'
```

HEAD now names `main`, so nothing points at `20982c3` any more. Run the log with `--all` again and the commit is gone from the picture: it is **unreachable** — no ref leads to it.

**Step 2 — rescue it.** Git printed the hash, so give it a sticky note:

```bash
git branch g0-experiment 20982c3
```

`git branch <name> <commit>` makes a branch at any commit, not only where you are. The log with `--all` shows `20982c3 (g0-experiment) Try rounded g0` again.

**The better habit.** Had Maya run `git switch -c g0-experiment` *while still detached*, before switching away, the commit would never have been in danger. Any time you are about to commit on a detached HEAD, make a branch first.

**Sanity check.** Nothing in `main` or `drag-model` changed at any point: their files still hold `65bb526…` and `4fff28f…`. Detached work can only ever be lost, never leak into a branch by accident.
:::

::: warning Commits on a detached HEAD are easy to lose
If you switch away without making a branch and do not notice the warning, the commit is not deleted — the object is still in `.git/objects` — but nothing names it, and after enough weeks Git's clean-up may [[throw it away|garbage-collection]]. Lesson 07 shows the **reflog**, which remembers every place HEAD has been and can find such commits again.
:::

## Switching with work in progress

What happens to edits you have not committed when you switch? Git's rule is: carry them along if it safely can, refuse if it cannot.

If you have edited `README.md` on `main` and switch to `drag-model`, and the README is identical on both branches, Git leaves your edit in place and lists it on the way:

```text
M	README.md
Switched to branch 'drag-model'
```

The edit now sits in the working tree on the other branch. It was never part of any commit, so it belongs to no branch.

But if the switch would have to overwrite a file you changed — say you edited `drag.py` on `drag-model`, and `main` has no `drag.py` at all — Git stops before touching anything:

```bash
git switch main
```

```text
error: Your local changes to the following files would be overwritten by checkout:
	drag.py
Please commit your changes or stash them before you switch branches.
Aborting
```

You then have three choices: commit the change, put it aside with `git stash` (lesson 07), or throw it away (lesson 06's `git restore`). Git will not choose for you, and that is a feature.

## Listing, and throwing away, sticky notes

`git branch -v` lists each branch with its tip commit:

```bash
git branch -v
```

```text
  drag-model    4fff28f Add exponential-atmosphere drag model
  g0-experiment 20982c3 Try rounded g0
* main          65bb526 Explain how to run the tests
  units-cleanup 65bb526 Explain how to run the tests
```

Every branch from this lesson is there: `units-cleanup` from the `switch -c` demonstration still sits on `65bb526`, beside `main`.

**`git branch -d <name>`** deletes a branch — which means deleting the sticky note, one small file. The commits stay. Git protects you with a check: if the branch has commits that no other branch contains, `-d` refuses:

```bash
git branch -d drag-model
```

```text
error: the branch 'drag-model' is not fully merged.
If you are sure you want to delete it, run 'git branch -D drag-model'
```

"Not fully merged" means `4fff28f` is reachable only from `drag-model`. Delete the note and nothing would point at it. The capital `-D` deletes anyway. Use it only when you really want that work gone. Deleting a branch whose commits are already part of `main` is always safe, and `-d` allows it without complaint.

::: key What the branch commands touch
`git branch <name>` writes one ref file; you stay where you are. `git switch <name>` rewrites `.git/HEAD` and makes the index and working tree match the branch tip. A commit moves only the branch HEAD names. `git branch -d` deletes a ref file, never a commit.
:::

## How flight software teams use this

On a real team, **[[`main` is kept always working|always-green]]**: every commit on it builds and passes the tests, because other people start from it every day. New work happens on short-lived branches with names like `feature/drag-model` or `fix/j2-sign`, one branch per change, merged into `main` when finished and then deleted. Teams that ship to a vehicle often also keep **[[release branches|release-branches]]**, such as `release/2.4`, which hold the exact code for one flight build and receive only carefully chosen fixes.

All of it works because a branch is cheap. Making one writes a 41-byte file; switching rewrites HEAD and your working folder. There is no reason to hesitate.

## Check yourself

::: check Three branches, one commit
You are on `main` at commit `65bb526`. You run `git branch a` and then `git branch b`. How many new objects are in `.git/objects`? How many new files in `.git/refs/heads`? Which branch are you on?
:::

::: answer
No new objects at all: a branch is not an object. Two new files, `.git/refs/heads/a` and `.git/refs/heads/b`, each holding `65bb526…` and a newline, 41 bytes. You are still on `main` — `git branch <name>` makes a branch but never moves HEAD. `cat .git/HEAD` still prints `ref: refs/heads/main`.
:::

::: check Where does the commit go?
HEAD contains `ref: refs/heads/drag-model`. You commit, and the new commit is `9a1b2c3`. Which files under `.git` change (ignoring the objects folder and logs)? What does each hold now?
:::

::: answer
Only `.git/refs/heads/drag-model`, which now holds `9a1b2c3…`. `.git/HEAD` is unchanged — it still names `drag-model`, which is why HEAD "moved" without being rewritten. Every other branch file is untouched. The new commit's parent is whatever `drag-model` pointed to before.
:::

::: check Decode the decoration
`git log --oneline --graph --all` shows the top line `* 7d0e41a (HEAD, fix/j2-sign) Correct the J2 sign`. Is HEAD attached or detached? What command would you run to be safely "on" `fix/j2-sign`?
:::

::: answer
Detached. With an attached HEAD the decoration shows an arrow, `HEAD -> fix/j2-sign`. A comma-separated `HEAD, fix/j2-sign` means HEAD holds the hash `7d0e41a` directly, which happens to be where `fix/j2-sign` points. Run `git switch fix/j2-sign`: HEAD then names the branch, and your next commit will move it.
:::

::: check Counting back
The last five commits on `main`, newest first, are `e5`, `d4`, `c3`, `b2`, `a1`, and HEAD is on `main`. Which commit is `HEAD~3`? Which is `main^`? Which is `HEAD~4~1`?
:::

::: answer
`HEAD~3` is three parent steps from `e5`: `d4`, `c3`, `b2`. So `b2`. `main^` is one step back from `e5`: `d4`. `HEAD~4~1` goes four steps (`a1`) and then one more — the parent of `a1`, which is whatever commit came before it, if there is one; if `a1` is the root commit, Git reports that the name cannot be resolved.
:::

::: check Two safe deletions and one refusal
Branch `docs` points at a commit that is also on `main`. Branch `spike` points at a commit that is on no other branch. What do `git branch -d docs` and `git branch -d spike` each do, and why is only one refused?
:::

::: answer
`git branch -d docs` deletes the ref file and succeeds: every commit it pointed at is still reachable from `main`, so no work loses its name. `git branch -d spike` is refused with "not fully merged", because deleting that note would leave `spike`'s commit unreachable. `-D` would delete it anyway; the commit object would still exist for a while, but nothing would point at it.
:::

## Summary

| Command or name | What it does | What changes on disk |
| --- | --- | --- |
| `git branch` | list branches; `*` marks the one HEAD names | nothing |
| `git branch <name> [<commit>]` | make a branch at HEAD (or at the commit given) | one new file in `.git/refs/heads` |
| `git switch <name>` (`checkout <name>`) | move onto a branch | `.git/HEAD`, the index, the working tree |
| `git switch -c <name>` (`checkout -b`) | make a branch here and move onto it | both of the above |
| `git switch --detach <commit>` (`checkout <commit>`) | stand on a commit with no branch: detached HEAD | `.git/HEAD` now holds a hash |
| `HEAD~n`, `HEAD^` | the commit $n$ steps back; `^` is `~1` | — |
| `git commit` | new commit; moves only the branch HEAD names | that branch's file |
| `git branch -d` / `-D` | delete a branch (the pointer only); `-d` refuses unmerged work | one ref file removed |

A branch is a sticky note on a commit, HEAD says which note you are riding, and detached HEAD means you are standing on a commit with no note at all. Next lesson brings two branches back together: sometimes by sliding a note forward, sometimes with a commit that has two parents, and sometimes with a conflict you resolve by hand.

::: context branch-move-picture Two sticky notes pulling apart
Before the commit, `main` and `drag-model` both point at `65bb526`, and HEAD names `drag-model`. The commit writes `4fff28f`, whose parent is `65bb526`, and moves only the note HEAD names.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="p1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">Before</text>
  <circle cx="60" cy="60" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">10b</text>
  <circle cx="130" cy="60" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <line x1="114" y1="60" x2="78" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p1)"/>
  <rect x="170" y="30" width="54" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="197" y="44" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="170" y1="42" x2="146" y2="54" stroke="#b4232c" stroke-width="1.5" marker-end="url(#p1)"/>
  <rect x="170" y="70" width="80" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="210" y="84" font-size="11" text-anchor="middle" fill="#b4232c">drag-model</text>
  <line x1="170" y1="78" x2="146" y2="66" stroke="#b4232c" stroke-width="1.5" marker-end="url(#p1)"/>
  <rect x="280" y="70" width="54" height="20" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="307" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD</text>
  <line x1="280" y1="80" x2="253" y2="80" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p1)"/>
  <line x1="10" y1="106" x2="350" y2="106" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="10" y="126" font-size="12" font-weight="700" fill="#1f2a44">After git commit</text>
  <circle cx="60" cy="165" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="169" font-size="11" text-anchor="middle" fill="#1f2a44">10b</text>
  <circle cx="130" cy="165" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="169" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <circle cx="200" cy="165" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="169" font-size="11" text-anchor="middle" fill="#1f2a44">4ff</text>
  <line x1="114" y1="165" x2="78" y2="165" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p1)"/>
  <line x1="184" y1="165" x2="148" y2="165" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p1)"/>
  <rect x="103" y="130" width="54" height="18" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="130" y="143" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <rect x="236" y="155" width="80" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="276" y="169" font-size="11" text-anchor="middle" fill="#b4232c">drag-model</text>
  <line x1="236" y1="165" x2="219" y2="165" stroke="#b4232c" stroke-width="1.5" marker-end="url(#p1)"/>
  <rect x="249" y="124" width="54" height="20" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="276" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD</text>
  <line x1="276" y1="144" x2="276" y2="153" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p1)"/>
</svg>
```

The `main` label sits directly on `65b`, where it stayed.
:::

::: context switch-restore-history Why Git has both `switch` and `checkout`
`git switch` and `git restore` arrived in Git 2.23, released in August 2019. Before that, `git checkout main` switched branches and `git checkout -- gravity.py` silently overwrote your edits to `gravity.py` with the committed version — the same verb, one letter-pair apart, with one of the two throwing work away. The new commands split the jobs so that each name says what it does. `checkout` was kept, unchanged, because millions of scripts and habits depend on it, so you will read both for years to come.
:::

::: context tilde-picture Counting back from HEAD
On `main`, each step of `~` follows one parent arrow. `HEAD^` is a second name for `HEAD~1`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="p2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="60" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">903</text>
  <circle cx="130" cy="60" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">cf1</text>
  <circle cx="220" cy="60" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">10b</text>
  <circle cx="310" cy="60" r="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">65b</text>
  <line x1="292" y1="60" x2="240" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p2)"/>
  <line x1="202" y1="60" x2="150" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p2)"/>
  <line x1="112" y1="60" x2="60" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#p2)"/>
  <text x="310" y="26" font-size="12" text-anchor="middle" fill="#1d6fd1">HEAD</text>
  <text x="220" y="26" font-size="12" text-anchor="middle" fill="#1d6fd1">HEAD~1</text>
  <text x="130" y="26" font-size="12" text-anchor="middle" fill="#1d6fd1">HEAD~2</text>
  <text x="40" y="26" font-size="12" text-anchor="middle" fill="#1d6fd1">HEAD~3</text>
  <text x="220" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">also HEAD^</text>
  <text x="40" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">root commit</text>
</svg>
```

`HEAD~4` does not exist here: the root commit has no parent to step to.
:::

::: context garbage-collection What happens to commits nobody points at
Git has a clean-up command, `git gc` ("garbage collect"), which also runs by itself now and then. It packs objects together and deletes objects that nothing can reach. It is deliberately slow to delete: by default it keeps unreachable loose objects for about two weeks, and anything still listed in the reflog — which keeps entries for unreachable commits for 30 days and for the rest for 90 days — counts as reachable. So a lost commit usually survives for about a month. That is a safety margin, not a guarantee to lean on.
:::

::: context always-green Keeping `main` green
"Green" is the color of a passing test run on a team's build dashboard. A team that keeps `main` green runs the full test suite on every branch before it is merged, often on a build server that does nothing else, and refuses the merge if any test fails. For flight software that suite usually includes simulated flights — thousands of runs of the guidance code against a model of the vehicle — so a red `main` can stop a whole team's day. Short branches make that easy: small changes are quick to test and quick to review.
:::

::: context release-branches One branch per flight build
When a build of flight software is qualified for a mission — tested, reviewed and signed off — the team needs to be able to fix a bug in *that* build without dragging in months of newer, unqualified work from `main`. So they cut a branch at the qualified commit, named for the release, and allow onto it only fixes that have been reviewed for that vehicle. Because a branch is only a pointer, keeping ten release branches alive costs ten small files. The exact commit hash of each flown build is recorded in the configuration management records described in lesson 01.
:::
