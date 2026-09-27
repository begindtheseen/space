---
id: l04-conflict-strategy-and-rerere
title: Resolving conflicts on purpose, and rerere
minutes: 21
covers:
  - Conflict resolution strategy; rerere
---

In the last module you resolved your first conflict: two values of Earth's $\mu$ on one line, markers around them, a decision, `git add`, `git commit`. That was the mechanics. This lesson is about judgment. A conflict is Git telling you that two people changed the same code for two different reasons, and that it cannot tell which reasons still matter. The fast way out is to pick one side. On flight software, that is how a correct fix quietly disappears.

So we treat resolving a conflict as an engineering task with steps: find out what *each* side meant, write code that does both, and then check for the conflicts Git never reports — the ones where the text merged cleanly but the program is now wrong. Along the way you will make the three-version view your default, learn why "ours" and "theirs" swap places during a rebase, and meet **rerere**, the Git feature that remembers a resolution so you never have to work out the same conflict twice.

## Two good changes to one function

Here is `drag_accel` in `drag.py` on `main`, as Maya wrote it two lessons ago:

```python
def drag_accel(v, h, cd, area, mass):
    """Drag deceleration (m/s^2) at speed v (m/s) and altitude h (m)."""
    return 0.5 * density(h) * v**2 * cd * area / mass
```

It computes the size of the drag: half the air density times speed squared, times drag coefficient $C_d$ and area $A$, divided by mass $m$. Two teammates changed it the same week, each for a good reason.

**Leo, on branch `drag-sign`.** The function always returned a positive number, so every caller had to remember to subtract it. The reentry script added it instead, and in the simulation the capsule *sped up* in the atmosphere. Leo made the result carry its own sign — always against the velocity — by writing $v\,|v|$ ("v times the absolute value of v") instead of $v^2$, with a minus sign in front. He also added a test that drag opposes motion in both directions.

**Ravi, on `main`.** Callers passed $C_d$, $A$ and $m$ separately, and one of them gave the area in square centimeters instead of square meters. Every vehicle file already states the **[[ballistic coefficient|ballistic-coefficient]]** $\beta = m / (C_d A)$, in $\mathrm{kg/m^2}$, so Ravi changed the function to take that one number: `drag_accel(v, h, beta)`.

Leo's branch is shared — Maya has been testing on it — so by the golden rule he brings `main` in with a merge, not a rebase:

```bash
git fetch
git merge origin/main
```

```text
Auto-merging drag.py
CONFLICT (content): Merge conflict in drag.py
Automatic merge failed; fix conflicts and then commit the result.
```

```text
* 5862b07 Take the ballistic coefficient in drag_accel
| * cfd8f07 Test that drag opposes motion in both directions
| * 91af44b Make drag oppose the velocity
|/  
* e712347 Test that J2 pull is the same along x and y
```

## Step 1: see all three versions

With Git's default markers, the conflict looks like this (`cat -n` numbers the lines):

```bash
cat -n drag.py | sed -n '12,25p'
```

```text
    12	<<<<<<< HEAD
    13	def drag_accel(v, h, cd, area, mass):
    14	    """Drag acceleration (m/s^2) along the velocity v (m/s) at altitude h (m).
    15	
    16	    The sign is always opposite to v, so drag slows the vehicle whichever
    17	    way it moves.
    18	    """
    19	    return -0.5 * density(h) * v * abs(v) * cd * area / mass
    20	=======
    21	def drag_accel(v, h, beta):
    22	    """Drag deceleration (m/s^2) at speed v (m/s), altitude h (m) and
    23	    ballistic coefficient beta (kg/m^2)."""
    24	    return 0.5 * density(h) * v**2 / beta
    25	>>>>>>> origin/main
```

Two versions, and no way to tell from this alone who changed what. Did Leo add the `abs(v)`, or did Ravi remove it? Did Ravi add `beta`, or did Leo take it out? Every merge is a **three-way** comparison — base, ours, theirs — and this display hides one of the three. The [[three-way picture|three-way-picture]] shows why the base is the key.

So the first move is always to bring the base back. Leo aborts (`git merge --abort`), sets the conflict style for this repository, and merges again:

```bash
git config merge.conflictStyle zdiff3
git merge origin/main
cat -n drag.py | sed -n '12,29p'
```

```text
    12	<<<<<<< HEAD
    13	def drag_accel(v, h, cd, area, mass):
    14	    """Drag acceleration (m/s^2) along the velocity v (m/s) at altitude h (m).
    15	
    16	    The sign is always opposite to v, so drag slows the vehicle whichever
    17	    way it moves.
    18	    """
    19	    return -0.5 * density(h) * v * abs(v) * cd * area / mass
    20	||||||| e712347
    21	def drag_accel(v, h, cd, area, mass):
    22	    """Drag deceleration (m/s^2) at speed v (m/s) and altitude h (m)."""
    23	    return 0.5 * density(h) * v**2 * cd * area / mass
    24	=======
    25	def drag_accel(v, h, beta):
    26	    """Drag deceleration (m/s^2) at speed v (m/s), altitude h (m) and
    27	    ballistic coefficient beta (kg/m^2)."""
    28	    return 0.5 * density(h) * v**2 / beta
    29	>>>>>>> origin/main
```

The new middle section, opened by `|||||||` and the merge base's hash `e712347`, is the **base**: the function before either of them touched it. Now each side can be read as a *change*:

- **Ours (base → HEAD):** the parameter list is untouched; the formula gains a minus sign and `v * abs(v)` replaces `v**2`; the docstring explains the sign.
- **Theirs (base → origin/main):** the parameter list becomes `(v, h, beta)`; `cd * area / mass` becomes `/ beta`; the docstring names `beta`.

Read that way, the two changes are not competing at all. They touch different *parts* of the same lines: Leo changed the sign and the $v$ factor, Ravi changed how the vehicle's properties arrive.

If you want the three versions as whole files, the index has them as stages 1, 2 and 3 (as `git ls-files -u` showed in the last module), and `git show :1:drag.py` prints the base, `:2:` ours and `:3:` theirs.

### `diff3` and `zdiff3`

The setting `merge.conflictStyle` chooses the marker layout. The default, `merge`, shows two sections. **`diff3`** adds the base section. **`zdiff3`** ("zealous diff3") is the same, but first moves any lines that ours and theirs share at the start or end of the conflict *outside* the markers, so the conflict holds only what really differs. In the drag conflict the two are identical. They differ when both sides made the same edit next to a different one:

::: example diff3 against zdiff3 on one small conflict
Maya's `settings.py` starts as one line, `DT = 10.0` (the integrator step in seconds). On branch `log-rate`, Ravi adds a run length and a logging rate every 300 s; on `main`, Maya adds the *same* run length and a logging rate every 60 s. Merging `log-rate` into `main`:

With `diff3`:

```text
     1	DT = 10.0         # s, integrator step
     2	<<<<<<< HEAD
     3	STEPS = 540       # one 90-minute orbit
     4	LOG_EVERY = 6     # log every 60 s
     5	||||||| e3621a2
     6	=======
     7	STEPS = 540       # one 90-minute orbit
     8	LOG_EVERY = 30    # log every 300 s
     9	>>>>>>> log-rate
```

With `zdiff3`:

```text
     1	DT = 10.0         # s, integrator step
     2	STEPS = 540       # one 90-minute orbit
     3	<<<<<<< HEAD
     4	LOG_EVERY = 6     # log every 60 s
     5	||||||| e3621a2
     6	=======
     7	LOG_EVERY = 30    # log every 300 s
     8	>>>>>>> log-rate
```

The base section is empty in both: neither line existed at the fork. `diff3` repeats `STEPS = 540` on both sides; `zdiff3` sees that both added it and moves it out, so the only question left is the logging rate.

**Sanity check.** Both comments are right: $540 \times 10\,\mathrm{s} = 5400\,\mathrm{s}$, which is 90 minutes; $6 \times 10\,\mathrm{s} = 60\,\mathrm{s}$; $30 \times 10\,\mathrm{s} = 300\,\mathrm{s}$. The conflict is purely a choice of logging rate, a question for whoever reads the logs.
:::

Most engineers set it once for every repository: `git config --global merge.conflictStyle zdiff3` ([[it needs Git 2.35 or newer|zdiff3-version]]; on older Git use `diff3`). To redraw a conflict that is already in your working tree in another style, `git checkout --conflict=diff3 drag.py` rewrites its markers.

## Step 2: find out why each side changed

The markers show *what* changed. The commit messages say *why*. `git log --merge` lists the commits, from both sides, that touched the conflicted files:

```bash
git log --merge --oneline
```

```text
5862b07 Take the ballistic coefficient in drag_accel
91af44b Make drag oppose the velocity
```

`git show 91af44b` gives Leo's reason (the capsule that sped up) and `git show 5862b07` gives Ravi's (the area given in square centimeters). This is where lesson 03 of the last module pays off: a message that explains *why* is exactly what the person resolving a conflict needs, often months later. If the messages do not say, ask the author before you guess.

## Step 3: write code that does both

Both reasons still hold, so the resolution must keep both changes: Leo's sign and $v\,|v|$, and Ravi's `beta`. Leo deletes every marker line and writes:

```python
def drag_accel(v, h, beta):
    """Drag acceleration (m/s^2) along the velocity v (m/s) at altitude h (m),
    for ballistic coefficient beta (kg/m^2).

    The sign is always opposite to v, so drag slows the vehicle whichever
    way it moves.
    """
    return -0.5 * density(h) * v * abs(v) / beta
```

Leo edits in a plain text editor; a [[three-pane merge tool|mergetool]] does the same job with more screen.

Picking "ours" would have brought back the five-argument form Ravi removed — and the centimeter bug with it. Picking "theirs" would have brought back the always-positive result — and the capsule that speeds up. The right answer is on neither side of the markers.

Check it the way you would check any formula: with $v > 0$, $v\,|v| = v^2 > 0$, so the result is negative — against the motion. With $v < 0$, $v\,|v| = -v^2 < 0$, so the result is positive — again against the motion. The size is $\tfrac{1}{2}\rho v^2/\beta$ in both cases, which is Ravi's formula. Units: $\mathrm{kg/m^3} \cdot \mathrm{m^2/s^2} \,/\, \mathrm{kg/m^2} = \mathrm{m/s^2}$, an acceleration.

Before `git add`, make sure no marker survived: `grep -n '^<<<<<<<\|^=======\|^>>>>>>>\|^|||||||' drag.py` must print nothing. Then `git diff` shows a combined diff of the resolution against both parents, a last look at what you decided.

## Step 4: hunt for the conflicts Git cannot see

Now the tests (output shortened):

```bash
python3 -m pytest -q
```

```text
F....                                                                    [100%]
    def test_drag_opposes_motion():
        # 400 km up, 7.67 km/s, Cd 2.2, 1 m^2, 100 kg: tiny, but against v.
>       assert drag_accel(7670.0, 400e3, 2.2, 1.0, 100.0) < 0
E       TypeError: drag_accel() takes 3 positional arguments but 5 were given
1 failed, 4 passed in 0.02s
```

The failing file is `tests/test_drag.py` — Leo's new test, which Git merged *without any conflict*, because nobody else had touched that file. It calls the function the old way. Ravi changed the function's signature on `main`, Leo wrote a new caller on his branch, and no line was changed by both. The text merged perfectly; the program is broken.

This is a **[[semantic conflict|semantic-conflict]]**: two changes that are fine alone, touch different lines, and are wrong together. Git works on lines of text, so it cannot see them. Only running the code can — which is why "test after every merge and every rebase" is a rule, not advice.

The fix follows Ravi's intent: build `beta` from the test's numbers with the existing helper.

```python
from drag import ballistic_coefficient, drag_accel


def test_drag_opposes_motion():
    # 400 km up, 7.67 km/s, Cd 2.2, 1 m^2, 100 kg: tiny, but against v.
    beta = ballistic_coefficient(2.2, 1.0, 100.0)
    assert drag_accel(7670.0, 400e3, beta) < 0
    assert drag_accel(-7670.0, 400e3, beta) > 0
```

```text
.....                                                                    [100%]
5 passed in 0.01s
```

(The comment's "tiny" is honest: $\beta = 100/2.2 \approx 45.5\,\mathrm{kg/m^2}$, and this simple exponential atmosphere gives about $4.5 \times 10^{-21}\,\mathrm{kg/m^3}$ at 400 km, so the drag is about $2.9 \times 10^{-15}\,\mathrm{m/s^2}$. The test checks only the sign.)

## Step 5: record the decision

```bash
git add drag.py tests/test_drag.py
git commit
```

Leo replaces the default merge message with one that says what he decided and why:

```text
Merge origin/main: keep the drag sign fix with the beta signature

main changed drag_accel(v, h, cd, area, mass) to drag_accel(v, h, beta);
this branch made its result oppose v. Both are wanted: the result is
-0.5*rho*v*|v|/beta. The new test on this branch still called the old
five-argument form, so it now builds beta with ballistic_coefficient().
```

```text
*   28dce25 Merge origin/main: keep the drag sign fix with the beta signature
|\  
| * 5862b07 Take the ballistic coefficient in drag_accel
* | cfd8f07 Test that drag opposes motion in both directions
* | 91af44b Make drag oppose the velocity
|/  
* e712347 Test that J2 pull is the same along x and y
```

A reviewer reading this merge next year does not have to reconstruct the reasoning. It is written down, next to the change.

::: key Resolving a three-way conflict on purpose
1. Show the base (`merge.conflictStyle zdiff3` or `diff3`) and read each side as a change from it.
2. Find out why each side changed: `git log --merge`, the commit messages, or the author.
3. Write the code that keeps every change that is still wanted — often neither side as written.
4. Remove every marker, then run the tests: a clean text merge can still be a semantic conflict.
5. `git add`, commit, and say in the message what you decided and why.
:::

::: warning "Take ours" and "take theirs" are for files, not decisions
Git has shortcuts: `git checkout --ours <file>` or `--theirs <file>` takes one side's whole file, and `git merge -X ours` settles every conflicting hunk in favor of one side automatically. They are right for a generated file you will regenerate anyway, or a lock file. On code that someone changed for a reason, they throw away that reason without anyone reading it.
:::

## During a rebase, ours and theirs swap

Leo's conflict came from a merge. The same two changes meet in a rebase too — for example if Leo's branch were still private and he rebased it onto `main`. The markers then look like this:

```bash
git rebase origin/main
```

```text
CONFLICT (content): Merge conflict in drag.py
error: could not apply 91af44b... Make drag oppose the velocity
```

```text
    12	<<<<<<< HEAD
    13	def drag_accel(v, h, beta):
    14	    """Drag deceleration (m/s^2) at speed v (m/s), altitude h (m) and
    15	    ballistic coefficient beta (kg/m^2)."""
    16	    return 0.5 * density(h) * v**2 / beta
    17	||||||| parent of 91af44b (Make drag oppose the velocity)
    18	def drag_accel(v, h, cd, area, mass):
    19	    """Drag deceleration (m/s^2) at speed v (m/s) and altitude h (m)."""
    20	    return 0.5 * density(h) * v**2 * cd * area / mass
    21	=======
    22	def drag_accel(v, h, cd, area, mass):
    23	    """Drag acceleration (m/s^2) along the velocity v (m/s) at altitude h (m).
    24	
    25	    The sign is always opposite to v, so drag slows the vehicle whichever
    26	    way it moves.
    27	    """
    28	    return -0.5 * density(h) * v * abs(v) * cd * area / mass
    29	>>>>>>> 91af44b (Make drag oppose the velocity)
```

The top section, `HEAD`, is now *Ravi's* version, and Leo's own change is at the bottom. It follows from how rebase works (last lesson): Git moves to `origin/main` first, then applies Leo's commits one at a time onto it. So while it is applying, HEAD — "ours" — is the new base plus whatever has been replayed so far, and "theirs" is the commit being replayed, your own. The [[swap picture|swap-picture]] lays it out.

The content of the conflict is the same, and so is the right resolution. What changes is the meaning of the labels, which matters most for the shortcuts: during a rebase, `git checkout --theirs drag.py` takes *your* commit's version, and `--ours` takes `main`'s. Read the labels, never assume.

## rerere: resolve once, reuse forever

Some conflicts come back. A long-lived branch waiting weeks for a review board gets rebased onto `main` every few days, and the same hunk conflicts every time. A maintainer does a trial merge to check that two branches combine, throws it away, and does the real merge a week later. Each time, someone works out the same resolution again — and each time might get it slightly different.

**rerere**, short for "reuse recorded resolution", makes Git remember. It is off by default; turn it on once:

```bash
git config --global rerere.enabled true
```

::: example rerere learns a resolution and replays it
Leo turns rerere on, throws away his merge commit (`git reset --hard HEAD~1`) and merges again, to watch it learn.

**Step 1 — the conflict is recorded.**

```bash
git merge origin/main
```

```text
Auto-merging drag.py
CONFLICT (content): Merge conflict in drag.py
Recorded preimage for 'drag.py'
Automatic merge failed; fix conflicts and then commit the result.
```

The new line: Git saved the conflicted hunk, the **preimage**, under a fingerprint of its content, in `.git/rr-cache/`:

```bash
ls .git/rr-cache
```

```text
a66729d5dfd0a145d8abfd74cd4f2ce9da767313
```

**Step 2 — resolve as before.** Leo writes the combined function and fixes the test, as in steps 3 and 4. `git rerere diff` shows what rerere will remember — the conflict (in its plain two-sided form) against his resolution:

```text
-<<<<<<<
 def drag_accel(v, h, beta):
-    """Drag deceleration (m/s^2) at speed v (m/s), altitude h (m) and
-    ballistic coefficient beta (kg/m^2)."""
-    return 0.5 * density(h) * v**2 / beta
-=======
-def drag_accel(v, h, cd, area, mass):
...
-    return -0.5 * density(h) * v * abs(v) * cd * area / mass
->>>>>>>
+    return -0.5 * density(h) * v * abs(v) / beta
```

**Step 3 — commit; the resolution is recorded.**

```text
Recorded resolution for 'drag.py'.
[drag-sign 1a8760c] Merge remote-tracking branch 'origin/main' into drag-sign
```

**Step 4 — meet the same conflict again.** Leo throws the merge away and merges once more:

```text
Auto-merging drag.py
CONFLICT (content): Merge conflict in drag.py
Resolved 'drag.py' using previous resolution.
Automatic merge failed; fix conflicts and then commit the result.
```

`drag.py` already holds his combined function, with no markers. Git still calls it a conflict and `git status` still lists `both modified: drag.py`, deliberately: rerere fills in the answer but leaves you to check it and `git add` it. (With `git config rerere.autoUpdate true` it also stages the file, printing `Staged 'drag.py' using previous resolution.`)

**Step 5 — the same answer during a rebase.** Leo aborts the merge and tries a rebase instead:

```text
CONFLICT (content): Merge conflict in drag.py
error: could not apply 91af44b... Make drag oppose the velocity
...
Resolved 'drag.py' using previous resolution.
```

The labels are swapped, but the two sides are the same text, so it is the same conflict. rerere [[sorts the sides|rr-cache]] before taking the fingerprint, which is why the merge's resolution fits the rebase.

**Sanity check — what it did not replay.** After the rebase finishes, the tests fail with the same `TypeError` as before. rerere remembers *conflicted hunks* only. Leo's fix to `tests/test_drag.py` was an ordinary edit to a file that never conflicted, so it was not recorded. The semantic conflict has to be fixed again — or better, fixed once in its own commit on the branch.
:::

::: key What is rerere?
Reuse recorded resolution. Git remembers how you resolved a specific conflict hunk and replays it automatically the next time the identical conflict appears, which matters on long-lived branches rebased repeatedly.
:::

A few more commands complete the picture. `git rerere status` lists the files whose conflicts are being recorded right now. If you recorded a wrong resolution, `git rerere forget drag.py`, run while that conflict is in front of you, deletes it (`Forgot resolution for 'drag.py'`), so you can resolve again. Recorded resolutions older than 60 days (15 days for conflicts never resolved) are cleaned away by `git gc`.

::: warning rerere is only as good as the resolution it copied
It replays text, not judgment. If the first resolution was wrong, every replay is wrong too, silently and consistently. And it knows nothing about semantic conflicts. Treat a "Resolved using previous resolution" line as a suggestion to review: look at `git diff`, run the tests, then `git add`.
:::

## Habits that keep conflicts small

- **Integrate often.** Small, frequent merges or rebases meet small conflicts while you still remember the code.
- **Commit refactors separately.** Renames and reformatting touch many lines; in their own commit, merged quickly, they conflict with less.
- **Write the why.** Every resolution above depended on commit messages.
- **Test the combination.** Neither side's tests ever ran on the merged code until you ran them.

## Check yourself

::: check
A conflict shows (zdiff3 style) base `THRUST = 7607  # kN`, ours `THRUST = 7607e3  # N`, theirs `THRUST = 7700  # kN, uprated engine`. What did each side change, and what should the resolved line be?
:::

::: answer
Ours changed the units, from kilonewtons to newtons (the same thrust, written as $7607 \times 10^3\,\mathrm{N}$). Theirs changed the value, for an uprated engine, keeping kilonewtons. Both are wanted: the new value in the new units, `THRUST = 7700e3  # N, uprated engine`. Picking ours loses the uprate; picking theirs puts a kN number where the code now expects newtons — off by a factor of 1000. Then search for every use of `THRUST`: a caller written for kN on either side is a semantic conflict.
:::

::: check
A merge finished with no conflicts, but the tests now fail with `NameError: name 'R_EQ' is not defined`. How can a merge with no conflicts produce this, and whose job is it to catch it?
:::

::: answer
One side renamed the constant (say `R_EQ` to `R_EARTH`) and updated every use it knew about; the other side added new code that uses `R_EQ`. The two changes touched different lines, so the text merged cleanly, but together they are wrong — a semantic conflict. Git cannot see it, because it compares lines of text, not meaning. The person integrating must catch it by running the tests after every merge or rebase; a continuous-integration server running them on every push is the team's safety net.
:::

::: check
You are rebasing your branch onto `main` and a conflict appears. You want to keep the version from *your* commit for a generated file, `ephemeris_table.py`, that you will regenerate anyway. Which command, and why is the obvious guess wrong?
:::

::: answer
`git checkout --theirs ephemeris_table.py`, then `git add` it (and regenerate it as planned). During a rebase, HEAD — "ours" — is the new base (`main` plus the commits replayed so far), and "theirs" is the commit being replayed, which is yours. The obvious guess, `--ours`, would take `main`'s version.
:::

::: check
rerere is on. You resolved a conflict in `guidance.py` last week during a merge and committed. Today a rebase hits the identical conflict. What will Git print, what will the file contain, and what must you still do?
:::

::: answer
Git prints `Resolved 'guidance.py' using previous resolution.` The file contains last week's resolution, with no markers. It is still listed as unmerged (unless `rerere.autoUpdate` is on), so you must review it — `git diff`, and run the tests, since rerere does not know about semantic conflicts or about any non-conflicting edits you made last time — then `git add guidance.py` and `git rebase --continue`.
:::

::: check
Why does the two-marker style make it hard to resolve the drag conflict correctly, and what exactly does the base section add?
:::

::: answer
With only ours and theirs you see two different functions, but not which differences each side *introduced*. It looks like a choice between two versions. The base shows the function before either change, so you can read each side as a change from it: Leo's side changed the sign and $v^2$ to $v\,|v|$; Ravi's side changed the parameters to `beta`. Once they are seen as two separate changes, it is clear both can be kept, and the resolution applies both to the base.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Show the base | `git config --global merge.conflictStyle zdiff3` (or `diff3`) |
| zdiff3 vs diff3 | zdiff3 moves lines both sides share out of the conflict |
| Three versions in full | `git show :1:file` base, `:2:` ours, `:3:` theirs |
| Why each side changed | `git log --merge`, then the commit messages or the author |
| Resolution | keep every change still wanted; often neither side as written |
| Semantic conflict | text merges cleanly, program is wrong; only tests catch it |
| Record the decision | say in the merge commit's message what you chose and why |
| Rebase labels | HEAD / ours = the new base; theirs = your commit being replayed |
| rerere | `rerere.enabled true`; records the preimage, then your resolution; replays it on the identical conflict |
| rerere limits | only conflicted hunks; still review, test and `git add` |

With merge, rebase, interactive rebase and conflict resolution in hand, you have every tool a single engineer needs. The next lesson zooms out to the team: how trunk-based development, GitFlow and forking workflows arrange branches, and why most flight software teams now integrate into one main branch many times a day.

::: context ballistic-coefficient One number for how drag affects a vehicle
Drag's pull on a vehicle depends on its mass $m$, its drag coefficient $C_d$ (a shape factor, about 2.2 for a typical satellite) and its reference area $A$. They always appear together as $m/(C_d A)$, the **ballistic coefficient** $\beta$, in $\mathrm{kg/m^2}$. A heavy, compact object has a large $\beta$ and barely notices the air; a light, broad one has a small $\beta$ and is slowed fast. Reentry and orbit-decay studies usually carry $\beta$ as one number, which is why Ravi's change removes a way to get the units wrong.
:::

::: context three-way-picture Why the base decides
Seen from the base B, each side is a change. Ours changed the formula's sign; theirs changed its parameters. Two separate changes can both be kept.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="w1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="120" y="10" width="120" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">base: +v², cd, area,</text>
  <text x="180" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">mass</text>
  <rect x="10" y="80" width="130" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">ours: −v|v|, cd,</text>
  <text x="75" y="109" font-size="11" text-anchor="middle" fill="#1f2a44">area, mass</text>
  <rect x="220" y="80" width="130" height="36" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">theirs: +v², beta</text>
  <rect x="110" y="130" width="140" height="34" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="151" font-size="11" text-anchor="middle" fill="#b4232c">result: −v|v|, beta</text>
  <line x1="150" y1="46" x2="95" y2="78" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#w1)"/>
  <line x1="210" y1="46" x2="265" y2="78" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#w1)"/>
  <text x="95" y="60" font-size="11" text-anchor="middle" fill="#6c7a93">sign change</text>
  <text x="270" y="60" font-size="11" text-anchor="middle" fill="#6c7a93">signature change</text>
  <line x1="95" y1="116" x2="140" y2="134" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#w1)"/>
  <line x1="265" y1="116" x2="220" y2="134" stroke="#1f2a44" stroke-width="1.3" marker-end="url(#w1)"/>
</svg>
```
:::

::: context semantic-conflict Conflicts no tool can see
A textual conflict is two edits to the same lines. A **semantic** conflict is two edits that are each correct but break the program together: a function renamed on one side and called by its old name on the other, a unit changed on one side and assumed on the other. They are the dangerous kind, because nothing stops you. Flight software teams defend against them with continuous integration — the full test suite on every merge candidate, before it reaches `main` — which lesson 06 covers.
:::

::: context swap-picture Who is "ours" in a merge and in a rebase
The same two changes, integrated two ways. In a merge you stand on your branch and pull `main` in. In a rebase you stand on `main` and apply your commits one by one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">git merge main</text>
  <text x="270" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">git rebase main</text>
  <line x1="180" y1="8" x2="180" y2="112" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <rect x="15" y="32" width="150" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">ours / HEAD: your branch</text>
  <rect x="15" y="72" width="150" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="90" y="91" font-size="11" text-anchor="middle" fill="#1f2a44">theirs: main</text>
  <rect x="195" y="32" width="150" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">ours / HEAD: main</text>
  <rect x="195" y="72" width="150" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="91" font-size="11" text-anchor="middle" fill="#1f2a44">theirs: your commit</text>
</svg>
```

Blue is your work, orange is `main`'s, in both halves.
:::

::: context rr-cache What rerere keeps on disk
Each recorded conflict is a folder in `.git/rr-cache`, named by a SHA-1 fingerprint of the conflicted hunks. Inside are `preimage` (the conflict as Git wrote it, markers included) and, once you commit, `postimage` (your resolution). Before fingerprinting, rerere writes each conflict with plain markers and puts its two sides in a fixed order, so the same clash has the same name whether it came from a merge or a rebase, and whichever side is "ours". Next time, Git fingerprints the new conflict, finds the folder, and applies the preimage-to-postimage change. Like the reflog, the cache is local: it is never pushed or cloned.
:::

::: context zdiff3-version When the styles arrived
`diff3` has been in Git for a very long time; it is named after the classic Unix tool that compares three files. `zdiff3` was added in Git 2.35, in early 2022. Check `git --version` before relying on it, and fall back to `diff3` on an older installation.
:::

::: context mergetool Resolving in a three-pane editor
`git mergetool` opens each conflicted file in a visual merge program — many editors, and tools such as Meld or KDiff3, show base, ours and theirs side by side, with the result below. It is the same three-way reasoning, with more screen. The steps in this lesson do not change: read each side as a change from the base, find out why, keep what is still wanted, then test.
:::
