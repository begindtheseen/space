---
id: l09-cherry-pick-and-backports
title: Cherry-pick and backporting a fix
minutes: 22
covers:
  - cherry-pick and backporting a fix to a release branch
---

Last lesson, the team cut `release/1.4` from `main` and tagged `v1.4.0`. That exact build is now on the [[hardware-in-the-loop|hil-bench]] test bench, and a test campaign is planned around it. Meanwhile `main` has kept moving: Maya renamed a parameter, added an `escape_speed` function, and merged other work. Then two bugs turn up. Ravi notices that standard gravity is still the rounded `9.81`. Leo finds that `speed_at_altitude(550)` returns about 7,905 m/s when the right answer is about 7,585 m/s.

Both bugs are fixed on `main` within the hour. But the test bench does not run `main`. It runs 1.4, and the campaign needs a 1.4 without those two bugs — and *without* the rename, the new function, and everything else that has landed on `main` since. You want to carry exactly two changes across, and nothing else.

That job is called a **[[backport|backport-word]]**: applying a fix made on newer code to an older release line. The tool for it is **`git cherry-pick`**, which you met briefly in the basics module as a way to recover lost commits. This lesson uses it the way release teams do, including the one real risk it carries.

## What cherry-pick does, precisely

The basics module gave the short version: `git cherry-pick <commit>` takes the change a commit made and commits the same change where you are. The precise version explains every surprise in this lesson.

A commit stores a snapshot, not a change. So Git first has to work out *what the commit changed*. It compares the commit with its parent. Then it applies that change to your current branch using the same **three-way merge** you used for `git merge`, with three inputs:

- the **base**: the picked commit's *parent*;
- **ours**: your current commit, `HEAD`;
- **theirs**: the picked commit itself.

Read that as: "whatever the picked commit changed relative to its parent, make the same change here". Lines the fix did not touch stay as they are on your branch. That is why one fix can land on a branch whose files look quite different — and why it conflicts when the fix touches lines that differ on your branch (the [[three inputs|pick-three-inputs]] picture shows it).

If the merge succeeds, Git makes a new commit. It copies the **[[author|author-committer]]** (the person who wrote the change) and the message. The **committer** (the person who made this particular commit object) becomes you, and the parent becomes your `HEAD`. Because the parent and committer changed, the commit's text changed, so its hash is new. The original commit on `main` is untouched.

::: key What cherry-pick makes
`git cherry-pick <commit>` computes the change `<commit>` made against its parent and applies it to `HEAD` with a three-way merge. The result is a *new* commit: same author and message, new committer, new parent, new hash. The original is not moved or changed.
:::

## The situation on orbit-sim

Here is the practice repository, drawn with `git log --oneline --graph --all`:

```text
*   930df96 (HEAD -> main) Merge branch 'fix/altitude-units'
|\
| * d450a71 (fix/altitude-units) Test speed_at_altitude at 550 km
| * 37136f2 Convert altitude from km to m in speed_at_altitude
|/
* 8491d16 Fix G0: use standard gravity 9.80665 m/s^2
* d22f118 Add escape_speed
* bd75d20 Rename h to alt_km in speed_at_altitude
* 07afbf6 (tag: v1.4.0, release/1.4) Add gravity model
```

Read it from the bottom. `release/1.4` still points at the commit tagged `v1.4.0`. Everything above it is on `main` only. Of those six commits, you want the G0 fix (`8491d16`) and the altitude fix, which arrived as a merged pull request: two commits on `fix/altitude-units` plus the merge commit `930df96`. You do *not* want the rename or `escape_speed`.

Why not merge `main` into `release/1.4`? Because a merge brings *everything* `main` has that the release lacks, and every extra change is something the test campaign has not tested. Cherry-pick moves one change and leaves the rest behind.

## Backporting a clean fix, with `-x`

Maya is the release manager for 1.4, so she does the backports. She switches to the release branch and picks Ravi's commit.

::: example Backporting the G0 fix
```bash
git switch release/1.4
git cherry-pick -x 8491d16
```

```text
Switched to branch 'release/1.4'
Auto-merging gravity.py
[release/1.4 fe4714c] Fix G0: use standard gravity 9.80665 m/s^2
 Author: Ravi Patel <ravi@example.com>
 Date: Tue Sep 15 15:05:00 2026 -0400
 1 file changed, 1 insertion(+), 1 deletion(-)
```

"Auto-merging" means the three-way merge ran and found nothing in the way. The new commit is `fe4714c` on `release/1.4`. Look at it in full, with both people shown:

```bash
git log -1 --format=fuller
```

```text
commit fe4714c0de9c364b7828f9a50c60adfd13b92f5e
Author:     Ravi Patel <ravi@example.com>
AuthorDate: Tue Sep 15 15:05:00 2026 -0400
Commit:     Maya Chen <maya@example.com>
CommitDate: Mon Sep 21 09:15:00 2026 -0400

    Fix G0: use standard gravity 9.80665 m/s^2

    9.81 is a rounded value; the defined standard is exactly 9.80665.

    (cherry picked from commit 8491d16eeb14f1fba75fbad28d00e14133462938)
```

**Read it line by line.** The author is still Ravi, with the date he wrote the fix. The committer is Maya, with the date she backported it. The message is Ravi's, plus one extra line at the bottom that the `-x` option added: the full hash of the commit it was copied from.

**Check.** `fe4714c` is not `8491d16`, as expected — new parent, new committer, new hash. The diff is the same single line: `1 insertion(+), 1 deletion(-)`, the old `G0 = 9.81` out and `G0 = 9.80665` in. And `release/1.4` still has the old parameter name `h` and no `escape_speed`, because neither was part of this commit's change.
:::

That extra line is **[[provenance|provenance-word]]**: a record of where something came from. Read `-x` aloud as "cross-reference". Months later, anyone reading `release/1.4` can follow it straight to the original commit on `main` and its review. Without it, the two commits are strangers that happen to say the same thing.

::: key Always backport with `-x`
`git cherry-pick -x <commit>` appends `(cherry picked from commit <full hash>)` to the message. Use it whenever the original commit lives on a shared branch, so the copy can be traced back to it. (For a commit on your own private branch it adds nothing, since nobody else can look that hash up.)
:::

## When the pick conflicts

The altitude fix is harder, for two separate reasons. It came in as a merge commit, and the lines it touches look different on the release branch. Take them one at a time.

### Cherry-picking a merge commit: `-m 1`

Maya tries the merge commit the same way:

```bash
git cherry-pick -x 930df96
```

```text
error: commit 930df962b424926cfb07263d3155a75b64870d71 is a merge but no -m option was given.
fatal: cherry-pick failed
```

Cherry-pick needs the change a commit made *against its parent*, and a merge has two parents. Against its first parent (`8491d16`, `main` before the merge) the change is the whole pull request: the unit fix and the new test. Against its second parent (`d450a71`, Leo's branch tip) it is everything `main` had that Leo's branch lacked — the opposite of what you want.

The **`-m <n>`** option (read it "mainline") tells Git which parent to measure against. Parent 1 of a merge is the branch you were on when you merged — here, `main`. So `-m 1` means "the change this merge brought into `main`", squeezed into one new commit. It is the same `-m 1` you met with `git revert` in the basics module, for the same reason ([[picture of the two parents|mainline-picture]]).

::: warning A picked merge becomes one ordinary commit
`git cherry-pick -m 1 <merge>` makes a single commit with *one* parent. The pull request's separate commits are flattened together, and the copied message still reads "Merge branch …", which is now false. Rewrite the message (below). If you would rather keep the separate commits, pick the branch's own commits instead of the merge: `git cherry-pick -x 8491d16..d450a71` picks every commit reachable from `d450a71` but not from `8491d16` — here `37136f2` and then `d450a71`, oldest first. In the range `A..B`, commit `A` itself is *excluded*, so `A` must be the commit right before the first one you want.
:::

### Resolving the conflict by reasoning about both sides

::: example Backporting the altitude fix through a conflict
Maya picks the merge with the mainline given:

```bash
git cherry-pick -x -m 1 930df96
```

```text
Auto-merging gravity.py
CONFLICT (content): Merge conflict in gravity.py
error: could not apply 930df96... Merge branch 'fix/altitude-units'
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
```

`git status` shows `test_gravity.py` already staged (a new file, so there is nothing for it to conflict with) and `gravity.py` under "Unmerged paths" as "both modified". The conflicted part of the file, printed with line numbers by `cat -n gravity.py`:

```text
    13	<<<<<<< HEAD
    14	def speed_at_altitude(h):
    15	    """Circular-orbit speed (m/s) at altitude h (km) above the equator."""
    16	    r = R_EARTH + h
    17	=======
    18	def speed_at_altitude(alt_km):
    19	    """Circular-orbit speed (m/s) at altitude alt_km (km) above the equator."""
    20	    r = R_EARTH + alt_km * 1000.0   # km -> m
    21	>>>>>>> 930df96 (Merge branch 'fix/altitude-units')
    22	    return circular_speed(r)
```

**Why it conflicted.** The base of this pick is the merge's first parent, where the parameter was already renamed to `alt_km`. On `release/1.4` those lines still say `h`, because the rename was never backported. Both sides differ from the base on the same lines, so Git stops and asks.

**Reason about each side instead of picking one.** Taking the bottom half ("theirs") whole would drag the rename into the release and break any 1.4 caller that writes `speed_at_altitude(h=550)`. Taking the top half ("ours") would throw the fix away. The fix's *intent* is one thing: convert kilometers to meters before adding to a radius in meters. So Maya keeps the release's names and applies that intent:

```python
def speed_at_altitude(h):
    """Circular-orbit speed (m/s) at altitude h (km) above the equator."""
    r = R_EARTH + h * 1000.0   # km -> m
    return circular_speed(r)
```

`git diff HEAD -- gravity.py` confirms that, compared with the release as it was, exactly one line changed:

```diff
-    r = R_EARTH + h
+    r = R_EARTH + h * 1000.0   # km -> m
```

**Test on the release branch, not on `main`.** The picked test file came along, so she runs it here:

```bash
python3 -m pytest -q
```

```text
.                                                                        [100%]
1 passed in 0.00s
```

**Sanity check the number.** With $\mu = 3.986004418 \times 10^{14}\ \mathrm{m^3/s^2}$ and $R_\oplus = 6{,}378{,}137\ \mathrm{m}$, the circular speed at 550 km is

$$
v = \sqrt{\frac{\mu}{R_\oplus + h}} = \sqrt{\frac{3.986004418 \times 10^{14}}{6{,}378{,}137 + 550{,}000}} \approx 7{,}585\ \mathrm{m/s}.
$$

The bug added 550 *meters*, so it computed the speed almost at the surface, radius 6,378,687 m: about 7,905 m/s. Lower orbits are faster, so a too-big answer is the direction you would expect.

**Finish, and fix the message.** She marks the file resolved and continues, asking for the editor so she can replace the misleading "Merge branch" title:

```bash
git add gravity.py
git cherry-pick --continue --edit
```

In the editor she writes a real message and keeps the provenance line at the bottom:

```text
Convert altitude from km to m in speed_at_altitude

speed_at_altitude(550) returned 7905 m/s instead of 7585 m/s because
the altitude in km was added to a radius in m. Backport of the
fix/altitude-units pull request, with its test.

(cherry picked from commit 930df962b424926cfb07263d3155a75b64870d71)
```

```text
[release/1.4 97b3c6c] Convert altitude from km to m in speed_at_altitude
 Date: Fri Sep 18 15:08:00 2026 -0400
 2 files changed, 6 insertions(+), 1 deletion(-)
 create mode 100644 test_gravity.py
```

**Check.** Two files changed: one line swapped in `gravity.py` and a new five-line test file, so 6 insertions and 1 deletion. The release still has `h` and still has no `escape_speed`.
:::

Three commands get you out of a stuck cherry-pick. **`--continue`** commits the resolution and moves on to the next picked commit. **`--skip`** drops the stuck commit and carries on. **`--abort`** puts everything back as it was before you started — the safe choice when the backport needs a conversation first.

::: warning A backport that compiles is not a backport that works
The fix was written and tested against `main`. The release branch is older code: a helper the fix calls might not exist there, a constant might have a different name, a caller might rely on the old behaviour. Git's merge only checks that the lines fit together, not that the program is right. Always build and run the tests *on the release branch* after a backport, and review the backport as its own pull request against `release/1.4`.
:::

## Which fixes are already on the release?

After a few weeks of backports, every release review asks: *is fix X on 1.4 or not?* Git can answer by comparing the two branches' *changes* rather than their hashes.

Each commit's change can be boiled down to a **[[patch ID|patch-id]]**: a fingerprint of the diff alone, ignoring hashes, dates, parents and messages. Two commits that make exactly the same change have the same patch ID, even though their commit hashes differ. **`git cherry`** uses it:

```bash
git cherry -v main release/1.4
```

```text
- fe4714c0de9c364b7828f9a50c60adfd13b92f5e Fix G0: use standard gravity 9.80665 m/s^2
+ 97b3c6c87661236472f23456fb7b54fa60691e04 Convert altitude from km to m in speed_at_altitude
```

Read it as "list the commits on `release/1.4` that are not on `main`, and mark each". A **minus** means "an equivalent change is already on `main`"; a **plus** means "no equivalent found". `-v` adds the message.

The G0 backport gets a minus: its diff is Ravi's, byte for byte. The altitude backport gets a plus — not because it is missing from `main`, but because Maya adapted it, so its patch ID differs. The tool recognises exact copies, not "the same idea". The `-x` line is what connects an adapted copy to its original.

The same marks are available in `git log`. `--cherry-mark` labels equivalent commits `=` and the rest `+`, over the commits that are on one side or the other (the three dots, `main...release/1.4`, mean "on either side but not both"):

```bash
git log --oneline --cherry-mark main...release/1.4
```

```text
+ 97b3c6c Convert altitude from km to m in speed_at_altitude
= fe4714c Fix G0: use standard gravity 9.80665 m/s^2
+ 930df96 Merge branch 'fix/altitude-units'
+ d450a71 Test speed_at_altitude at 550 km
+ 37136f2 Convert altitude from km to m in speed_at_altitude
= 8491d16 Fix G0: use standard gravity 9.80665 m/s^2
+ d22f118 Add escape_speed
+ bd75d20 Rename h to alt_km in speed_at_altitude
```

The two `=` lines are the pair that match: Ravi's original on `main` and Maya's copy on the release.

## The risk: divergent duplicates

Cherry-pick has one real cost. After a backport, the *same logical change* exists in the repository as *two different commits*. Git's graph does not know they are related — no arrow joins `8491d16` and `fe4714c`. Those two are **[[divergent duplicates|duplicate-picture]]**.

If the two branches are ever merged, Git has to reconcile the copies. Suppose the team decides to merge `release/1.4` back into `main`:

```bash
git switch main
git merge release/1.4
```

```text
Auto-merging gravity.py
CONFLICT (content): Merge conflict in gravity.py
Automatic merge failed; fix conflicts and then commit the result.
```

The G0 fix merged silently: both sides made the identical change since the merge base, and a three-way merge accepts that without complaint. The altitude fix conflicted: `main` says `alt_km * 1000.0`, the release says `h * 1000.0`. Two versions of one fix now fight each other.

It can be worse than a conflict. If one side later edits lines near the fix, a merge can go through cleanly and still leave the fix applied twice, or half-undone. An `* 1000.0` applied twice turns 550 km into 550,000 km — and it compiles.

::: key cherry-pick: what it is for and its risk
Applying one commit onto another branch, typically backporting a fix to a release line. The risk is divergent duplicates: the same logical change now exists as two different commits, so later merges can conflict or double-apply.
:::

Teams keep that risk small with a **policy**, written down, about which way fixes travel.

- **Fix on `main` first, then cherry-pick back.** This is the common rule in trunk-based teams, and it is sometimes called **[[upstream first|upstream-first]]**. The fix lands on `main`, is reviewed there, and each supported release gets a `-x` copy. Release branches are never merged back into `main`, so the duplicates never meet. Nothing can be "fixed on the release and forgotten on `main`".
- **Fix on the oldest release, then merge forward.** The fix is made on `release/1.4` and the release branch is merged into newer branches and `main`. There are no duplicates at all, because the same commit flows forward through merges — but every release branch must be merged forward faithfully, which is the GitFlow habit from lesson 05.

Either works. Mixing them is what hurts: it is exactly how two copies of one change end up in the same merge. And cherry-pick is for a few chosen fixes; picking twenty commits from one long-lived branch to another is a merge in disguise, with twenty future duplicates.

## A backport, start to finish

Put together, a backport looks like this.

1. **Find the whole fix**: the code change, its test, and any follow-up fix to the fix. A fix without its test is half a backport.
2. **Branch from the release**, `git switch -c backport/altitude-1.4 release/1.4`, so the backport is reviewed as its own pull request against the release branch.
3. **Pick oldest first, with `-x`**: `git cherry-pick -x <fix> <test>`.
4. **Resolve conflicts by intent**, not by whichever side is shorter.
5. **Build and test on the release branch.**
6. **Merge, tag a patch release, and write it down.** A bug fix with no interface change is a PATCH bump (lesson 08), so `v1.4.1`, with a changelog entry listing the backported fixes.

For orbit-sim, after Maya's two picks:

```bash
git tag -a v1.4.1 -m "orbit-sim 1.4.1: G0 and altitude-unit fixes"
git log --oneline --decorate -3
```

```text
97b3c6c (HEAD -> release/1.4, tag: v1.4.1) Convert altitude from km to m in speed_at_altitude
fe4714c Fix G0: use standard gravity 9.80665 m/s^2
07afbf6 (tag: v1.4.0) Add gravity model
```

Two commits on top of `v1.4.0`, each traceable to its original, and nothing else.

::: note Two more options worth knowing
`git cherry-pick -n <commit>` (`--no-commit`) applies the change to your working tree and index but does not commit, so you can combine several picks into one commit, or inspect the result first. `git cherry-pick -e <commit>` (`--edit`) opens the editor on the copied message before committing, which is how you would fix a message in a pick that has no conflict.
:::

## Check yourself

::: check Why did it conflict?
A one-line fix changes `thrust = cmd * 0.95` to `thrust = min(cmd, 1.0) * 0.95` on `main`. Cherry-picked onto `release/3.0`, it conflicts. On the release branch that line reads `thrust = cmd * 0.93`. Explain the conflict using the three inputs of a cherry-pick, and write the correct resolved line.
:::

::: answer
The base is the fix's parent on `main`, where the line was `thrust = cmd * 0.95`. Theirs (the fix) changed it to `min(cmd, 1.0) * 0.95`. Ours (`release/3.0`) has `cmd * 0.93` — different from the base on the same line. Both sides changed the same line relative to the base, so Git cannot choose. The fix's intent is "clamp the command to at most 1.0"; the release's value is 0.93. Keep both: `thrust = min(cmd, 1.0) * 0.93`. Taking theirs whole would silently change the release's 0.93 to 0.95; taking ours would drop the clamp.
:::

::: check Reading `git cherry`
`git cherry -v main release/5.2` prints three lines: `- a1… Fix NaN in quaternion normalize`, `+ b2… Fix sign of yaw rate in telemetry`, `+ c3… Bump version to 5.2.1`. What does each mark mean? Does the `+` on the yaw-rate line prove that fix is missing from `main`?
:::

::: answer
All three are on `release/5.2` and not on `main` by hash. The `-` says an identical change (same patch ID) is on `main`: a clean cherry-pick. The `+` lines say no identical change was found. For the version bump that is expected — it belongs only on the release. For the yaw-rate fix, `+` does *not* prove it is missing: if the backport needed a conflict resolution, its diff differs from the original and the patch IDs no longer match. Check its message for a `(cherry picked from commit …)` line and look at that commit on `main`.
:::

::: check Pick the merge or the commits?
A two-commit pull request (a fix and its test) was merged into `main` as merge commit `m9`, whose parents are `p1` (main before the merge) and `b2` (the branch tip, whose parent `b1` is the fix, whose parent is `p1`). Give two ways to backport it, and one advantage of each.
:::

::: answer
(1) `git cherry-pick -x -m 1 m9`: one command, and the whole pull request arrives as a single commit measured against parent 1, main's side; its message must be rewritten, since "Merge branch…" is no longer true. (2) `git cherry-pick -x p1..b2`, which picks `b1` then `b2` (everything reachable from `b2` but not from `p1`): the release keeps the same two separate commits as `main`, each with its own message and its own provenance line, and each diff matches its original exactly, so `git cherry` can recognise them if they apply cleanly.
:::

::: check Choosing a direction
A team supports `release/1.4` and `release/1.5` and develops on `main`. Half its fixes are made on `main` and cherry-picked back; the other half are made on `release/1.4` and merged forward into 1.5 and `main`. What goes wrong, and what would you change?
:::

::: answer
The two policies make divergent duplicates meet. A fix made on `main` and picked to 1.4 exists as two commits; when 1.4 is merged forward into `main`, the copy arrives where its original already lives. If the copy was adapted, the merge conflicts; if later edits touched nearby lines, it can double-apply or half-revert without any conflict. Pick one direction and write it down: for a trunk-based team, fix on `main` first, cherry-pick back with `-x`, and never merge release branches into `main`.
:::

## Summary

| Command or idea | Meaning |
| --- | --- |
| backport | applying a fix made on newer code to an older release line |
| `git cherry-pick <c>` | apply the change `<c>` made against its parent onto `HEAD`, as a new commit |
| three inputs | base = parent of the picked commit, ours = `HEAD`, theirs = the picked commit |
| new commit | same author and message; new committer, parent and hash |
| `-x` | append `(cherry picked from commit <hash>)`: provenance |
| `-m 1` | pick a merge commit, measuring its change against parent 1 (the mainline) |
| `A..B` | commits reachable from `B` but not from `A` (`A` excluded) |
| `--continue`, `--skip`, `--abort` | commit the resolution; drop the stuck commit; undo the whole pick |
| `-n`, `-e` | apply without committing; edit the message |
| patch ID | fingerprint of a diff alone; equal for identical changes |
| `git cherry -v up head` | commits on `head` not on `up`; `-` = equivalent already there, `+` = not found |
| `--cherry-mark A...B` | in `git log`, mark equivalent commits `=` |
| divergent duplicates | one logical change as two unrelated commits; later merges can conflict or double-apply |
| direction policy | fix on `main` and pick back, *or* fix on oldest release and merge forward — never both |

Cherry-pick moves changes between branches of one project. The next lesson is about code that comes from *another* project entirely — a shared library of frame transformations, say — and the three ways to bring it into orbit-sim: submodules, subtrees and vendoring.

::: context hil-bench A test bench that thinks it is flying
**Hardware-in-the-loop** (HIL) testing runs the real flight computer, with the real flight software, wired to a simulator that pretends to be the rest of the vehicle and the world. The simulator feeds the computer fake sensor readings — gyro rates, GPS positions, star-tracker attitudes — and reads back its commands to thrusters and reaction wheels. A HIL campaign is planned around one exact software build, often for weeks, which is why teams guard that build on a release branch and change it only through reviewed backports.
:::

::: context backport-word Porting, and why "back"
To **port** software originally meant to carry it to a different computer or operating system — from the Latin *portare*, "to carry", as in "portable". A **backport** carries a change *backwards in time*: from the newest code to an older version that is still in use. The opposite direction, bringing an old branch's fix up into newer code, is usually called a **forward port** or "merging forward".
:::

::: context pick-three-inputs The three snapshots of a cherry-pick
A merge compares two branch tips with their common ancestor. A cherry-pick borrows the same machinery but chooses the three snapshots differently: the base is the *picked commit's parent*, even though that commit may be nowhere near your branch in the graph. The dashed arrow is the change Git measures; the solid arrow is where it lands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="10" y="28" font-size="12" font-weight="bold" fill="#1f2a44">main</text>
  <rect x="70" y="12" width="100" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="29" font-size="11" text-anchor="middle" fill="#1f2a44">parent = base</text>
  <rect x="220" y="12" width="120" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="29" font-size="11" text-anchor="middle" fill="#1f2a44">picked = theirs</text>
  <line x1="172" y1="25" x2="218" y2="25" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#pa)"/>
  <text x="195" y="54" font-size="11" text-anchor="middle" fill="#1d6fd1">the change</text>
  <text x="10" y="118" font-size="12" font-weight="bold" fill="#1f2a44">release</text>
  <rect x="70" y="102" width="100" height="26" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="120" y="119" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD = ours</text>
  <rect x="220" y="102" width="120" height="26" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="280" y="119" font-size="11" text-anchor="middle" fill="#b4232c">new commit</text>
  <line x1="172" y1="115" x2="218" y2="115" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#pa)"/>
  <line x1="195" y1="60" x2="195" y2="98" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#pa)"/>
  <text x="180" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">same change, applied on top of HEAD</text>
</svg>
```
:::

::: context author-committer Why Git keeps two names on every commit
Git was built for the Linux kernel, where a change is often written by one person and applied to the official tree by another, the maintainer. So every commit records both: the **author**, who wrote the change, and the **committer**, who made this particular commit object. Normally they are the same person. A cherry-pick, a rebase or an applied patch makes them differ. `git log` shows only the author by default; `--format=fuller` shows both, with a date for each.
:::

::: context provenance-word Where a thing came from
**Provenance** is a word from art and museums: the documented history of a painting — who owned it, when, and how it got here — that proves it is genuine. Engineers borrowed it for any record of origin. In flight software it matters for certification: for every line in a flight build, an auditor may ask which requirement it serves, which review approved it, and where it came from. A `(cherry picked from commit …)` line answers the last question in one step.
:::

::: context mainline-picture Which parent is "1"?
A merge commit lists its parents in order. Parent 1 is the commit that `HEAD` pointed at when someone ran `git merge` — the branch being merged *into*, often `main`. Parent 2 is the tip of the branch that was merged in. "Mainline" is the name for parent 1's line. Measured against parent 1, the merge's change is "everything the pull request added". Measured against parent 2, it is "everything `main` had gained that the branch lacked", which is almost never what you want to backport.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="60" cy="50" r="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">p1</text>
  <circle cx="160" cy="110" r="14" fill="#fff" stroke="#1f2a44"/>
  <text x="160" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">b1</text>
  <circle cx="220" cy="110" r="14" fill="#fff" stroke="#1f2a44"/>
  <text x="220" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">b2</text>
  <circle cx="290" cy="50" r="16" fill="#f2b880" stroke="#1f2a44"/>
  <text x="290" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">M</text>
  <line x1="274" y1="50" x2="76" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ma)"/>
  <text x="175" y="42" font-size="11" text-anchor="middle" fill="#1d6fd1">parent 1 (mainline)</text>
  <line x1="277" y1="60" x2="233" y2="102" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ma)"/>
  <text x="300" y="100" font-size="11" fill="#b4232c">parent 2</text>
  <line x1="206" y1="110" x2="176" y2="110" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ma)"/>
  <line x1="147" y1="103" x2="72" y2="58" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ma)"/>
  <text x="60" y="140" font-size="11" fill="#6c7a93">arrows point from child to parent</text>
</svg>
```
:::

::: context patch-id How a patch ID is made
`git patch-id` reads a diff and hashes its lines — the changed ones and the few unchanged context lines around them — after removing whitespace and the line numbers in the `@@` headers. Hashes, dates, authors and messages never enter it. So two commits that make the same edit in the same surroundings get the same patch ID, even if the edit sits ten lines lower in one of the files. Change one character of the edit — `h` instead of `alt_km` — and the patch ID is completely different, which is why an adapted backport shows up as `+`.
:::

::: context duplicate-picture Two commits, one change, no arrow between them
After Maya's backport, the G0 fix exists twice. Each copy has its own parent and its own hash, and nothing in the graph links them — only the `-x` line in the copy's message and the matching patch ID say they are the same change. When the two branches are merged, Git meets both copies and has to reconcile them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="da" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="95" r="13" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">v1.4.0</text>
  <circle cx="110" cy="40" r="11" fill="#fff" stroke="#1f2a44"/>
  <circle cx="165" cy="40" r="11" fill="#fff" stroke="#1f2a44"/>
  <circle cx="220" cy="40" r="13" fill="#f2b880" stroke="#1f2a44"/>
  <text x="220" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">8491d16</text>
  <text x="300" y="44" font-size="11" fill="#1f2a44">main</text>
  <circle cx="220" cy="95" r="13" fill="#f2b880" stroke="#1f2a44"/>
  <text x="220" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">fe4714c</text>
  <text x="270" y="99" font-size="11" fill="#1f2a44">release/1.4</text>
  <line x1="99" y1="45" x2="52" y2="87" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#da)"/>
  <line x1="154" y1="40" x2="123" y2="40" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#da)"/>
  <line x1="207" y1="40" x2="178" y2="40" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#da)"/>
  <line x1="207" y1="95" x2="55" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#da)"/>
  <line x1="220" y1="55" x2="220" y2="80" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="228" y="72" font-size="11" fill="#b4232c">same change, no arrow</text>
</svg>
```
:::

::: context upstream-first How the Linux kernel does it
The Linux kernel maintains several older "stable" and "long-term" versions for years, and it is strict about backports. Its written rules for stable releases require that a fix be merged into the main development tree first; only then is it copied back, and the backported commit records the hash of the original. The reason is exactly this lesson's risk: a fix made only on an old branch can be forgotten in the new one, and the same bug then comes back in the next release. Many flight-software teams follow the same "upstream first" habit.
:::
