---
id: l03-reading-history-and-writing-messages
title: Reading history and writing good commit messages
minutes: 24
covers:
  - log --oneline --graph --all, show, blame
  - "Commit message craft: imperative subject, why-not-what body"
---

Here is a situation every simulation engineer meets. On Tuesday, a **Monte Carlo** run — five thousand simulated orbits, each with slightly different random starting conditions — looked fine. On Friday, the same run with the same inputs gives different answers. Somewhere between Tuesday and Friday, somebody changed something. What changed? Who changed it? And the question that actually matters: *why* did they change it — were they fixing a real bug, or did they break something by accident?

Git can answer the first two questions by itself, because every commit records its snapshot, its author and its time. The third question it can answer only if the person who made the change wrote it down. This lesson covers both halves: the commands for reading history — `log`, `show` and `blame` — and the craft of writing commit messages that make that history worth reading.

We keep using orbit-sim. Since the last lesson it has gained three commits: Ravi Patel added a safety check to `accel` after a bug in the code that loads starting positions (the *initial-state loader*), Maya added a function for circular-orbit speed, and Ravi started some separate work on an atmosphere model on a line of development called `drag`. (Lesson 04 shows how such a separate line, a branch, is made.)

## `git log`: history, newest first

`git log` starts at HEAD and walks backward through the `parent` links you met in lesson 01, printing each commit as it goes. Here are the first two, limited with `-n 2`:

```bash
git log -n 2
```

```text
commit b1081538f554cffde5f40052f60fa9575bd92e4d (HEAD -> main)
Author: Maya Chen <maya@example.com>
Date:   Mon Sep 21 16:45:00 2026 -0500

    Add circular orbit speed helper

commit 1fbe379c3e292237df6b45b7b32328b729ff651c
Author: Ravi Patel <ravi@example.com>
Date:   Thu Sep 17 11:02:00 2026 -0500

    Reject non-positive radius in accel
    
    A sign error in the initial-state loader handed accel() r = -6.9e6 m.
    Because r is squared, the answer looked normal (8.37 m/s^2) and the
    Monte Carlo run finished with wrong trajectories and no error.
    
    Raise ValueError for r <= 0 so a bad state stops the run at its first
    step. Taking abs(r) was considered and rejected: it would hide the
    loader bug instead of reporting it.
```

Each entry shows the full hash, the author, the date (turned from the stored timestamp into a readable clock time) and the message, indented. The `(HEAD -> main)` after the first hash is a **decoration**: it tells you which refs point at that commit. Here HEAD points at `main`, and `main` points at `b108153`.

On a long history, `git log` opens in the **[[pager|pager]]** `less`, which you know from the shell module: space for the next page, `/` to search, `q` to quit.

### Shorter views

The full format is too long to scan. **`--oneline`** prints one line per commit: the short hash and the first line of the message.

```bash
git log --oneline
```

```text
b108153 (HEAD -> main) Add circular orbit speed helper
1fbe379 Reject non-positive radius in accel
1036755 Explain how to run the tests
da6039c Add vector form of gravity acceleration
cf192ed Add point-mass gravity model
903724b Add README
```

Six commits, newest at the top, ending at the root commit `903724b`. A few more options you will use weekly:

- **`-n 3`** — only the newest three commits.
- **`--stat`** — after each commit, the files it changed and how many lines were added and removed.
- **`-p`** — after each commit, its full diff (the "patch").
- **`-- gravity.py`** — only commits that changed that file. The two dashes mean "what follows are file names, not options or branch names".
- **`--author=Ravi`** — only commits whose author matches.

```bash
git log --oneline -- gravity.py
```

```text
b108153 (HEAD -> main) Add circular orbit speed helper
1fbe379 Reject non-positive radius in accel
da6039c Add vector form of gravity acceleration
cf192ed Add point-mass gravity model
```

Four of the six commits touched `gravity.py`; the other two only changed the README.

## Seeing the whole graph: `--graph --all`

Notice something missing from that log: Ravi's atmosphere work. It is not there because `git log` starts at HEAD and follows parents, and Ravi's commit is not an ancestor of HEAD — it sits on a different line of development. Two more options fix that:

- **`--all`** starts from *every* ref (every branch and tag), not only HEAD.
- **`--graph`** draws the parent links as a picture in the left margin, using text characters.

```bash
git log --oneline --graph --all
```

```text
* b108153 (HEAD -> main) Add circular orbit speed helper
| * 921a084 (drag) Add exponential atmosphere density model
|/  
* 1fbe379 Reject non-positive radius in accel
* 1036755 Explain how to run the tests
* da6039c Add vector form of gravity acceleration
* cf192ed Add point-mass gravity model
* 903724b Add README
```

Read the **[[text-art graph|ascii-graph]]** like this. Each `*` is a commit. A `|` is a line of history running down the page toward older commits. The `|/` means the right-hand line joins the left-hand one: commit `921a084` has the same parent as `b108153`, namely `1fbe379`. That fork is exactly the "two commits share one parent" shape from lesson 01. The decorations say `main` points at `b108153` and `drag` at `921a084`.

::: key The three log flags worth memorising
`git log --oneline --graph --all`: one line per commit, the parent links drawn in the margin, starting from every branch and tag rather than only HEAD. It is the fastest way to see the shape of a repository.
:::

::: example From a log to a drawing of the DAG
**Task.** Using only the `--oneline --graph --all` output above, draw the commit DAG with its refs.

**Step 1 — the straight part.** The five commits at the bottom are joined by a single `|` column, so each is the parent of the one above: `903724b` ← `cf192ed` ← `da6039c` ← `1036755` ← `1fbe379`. The arrows point to parents, backward in time, as in lesson 01.

**Step 2 — the fork.** The `|/` line joins the right-hand column into the left one right above `1fbe379`. So both `b108153` and `921a084` have `1fbe379` as their parent.

**Step 3 — the refs.** `main` → `b108153`; `drag` → `921a084`; `HEAD` → `main`.

**Check.** Count: $5 + 2 = 7$ commits, and the log printed 7 lines with a `*`. Only one commit, the root `903724b`, has no parent. The [[finished drawing|dag-from-log]] is in the note.
:::

## Naming commits relative to HEAD

Typing hashes gets old. Git lets you name a commit by counting back from another:

- **`HEAD~1`**, read "HEAD tilde one", is HEAD's parent. **`HEAD~2`** is the grandparent, and so on.
- **`HEAD^`**, read "HEAD caret", is also the first parent; `HEAD^` and `HEAD~1` mean the same commit.
- It works from any ref: **`drag~1`** is the parent of `drag`'s tip.

`git rev-parse --short` turns any such name into a short hash, which is a good way to check yourself:

```text
HEAD     b108153
HEAD~1   1fbe379
HEAD^    1fbe379
HEAD~2   1036755
HEAD~5   903724b
drag~1   1fbe379
```

`HEAD~5` walks back five parents from `b108153` and lands on the root commit. You will use this notation constantly in lessons 06 and 07, where commands like `git reset HEAD~3` take a commit as their target.

::: warning `~` and `^` differ on merge commits
For ordinary commits `HEAD~2` and `HEAD^^` are the same. They differ only after a merge, where a commit has two parents: `^2` means "the *second* parent", while `~2` always means "the first parent's first parent". Lesson 05 introduces merge commits; until then, use `~` and you will not be surprised.
:::

## `git show`: one commit in full

`git log` is for scanning. **`git show`** is for looking closely at one commit: its message and its complete diff. With no argument it shows HEAD.

```bash
git show 1fbe379
```

```text
commit 1fbe379c3e292237df6b45b7b32328b729ff651c
Author: Ravi Patel <ravi@example.com>
Date:   Thu Sep 17 11:02:00 2026 -0500

    Reject non-positive radius in accel
    
    A sign error in the initial-state loader handed accel() r = -6.9e6 m.
    ... (rest of the message, as above)

diff --git a/gravity.py b/gravity.py
index ee230c8..2639c23 100644
--- a/gravity.py
+++ b/gravity.py
@@ -4,6 +4,8 @@ G0 = 9.80665               # m/s^2, standard gravity
 
 def accel(r):
     """Size of gravity's pull (m/s^2) at distance r (m) from Earth's center."""
+    if r <= 0:
+        raise ValueError(f"radius must be positive, got {r} m")
     return MU_EARTH / r**2
 
 
```

The diff is not stored anywhere. Git computed it on the spot, by comparing this commit's snapshot with its parent's — as lesson 01 promised.

`git show` has two other uses worth knowing:

- **`git show --stat HEAD~2`** prints the message and a list of changed files instead of the full diff.
- **`git show HEAD~3:gravity.py`** — a commit, a colon, a path — prints the file *as it was in that commit*. This is the commit → tree → blob walk from lesson 01, done in one command. For orbit-sim it prints `gravity.py` as it stood before Ravi's check existed.

::: example Checking a number the message quotes
Ravi's message says that `accel(-6.9e6)` "looked normal (8.37 m/s^2)". Is that right?

The function computes $\mu / r^2$. Squaring removes the sign, since $(-6.9 \times 10^6)^2 = (6.9 \times 10^6)^2 = 4.761 \times 10^{13}$. So

$$
\frac{3.986 \times 10^{14}}{4.761 \times 10^{13}} \approx 8.37\,\mathrm{m/s^2}.
$$

That is a perfectly believable value for a satellite about 530 km up, which is exactly why the bug hid. The message is correct, and it teaches the reader the reason for the check in one number.
:::

## `git blame`: who last touched each line

`git log -- file` tells you which commits changed a file. **[[`git blame`|blame-name]]** goes line by line: for each line of the file as it is now, it prints the commit that last changed that line, its author and its date.

```bash
git blame -L 5,9 gravity.py
```

```text
cf192edf (Maya Chen  2026-09-14 09:40:00 -0500 5) def accel(r):
cf192edf (Maya Chen  2026-09-14 09:40:00 -0500 6)     """Size of gravity's pull (m/s^2) at distance r (m) from Earth's center."""
1fbe379c (Ravi Patel 2026-09-17 11:02:00 -0500 7)     if r <= 0:
1fbe379c (Ravi Patel 2026-09-17 11:02:00 -0500 8)         raise ValueError(f"radius must be positive, got {r} m")
cf192edf (Maya Chen  2026-09-14 09:40:00 -0500 9)     return MU_EARTH / r**2
```

**`-L 5,9`** limits the output to lines 5 through 9. On a real 2,000-line guidance file you almost always want a range, such as `git blame -L 120,140 guidance.py`. Each output line has the short commit hash, the author, the date and time, the line number, and then the line itself.

Blame is where the [[detective work|pickaxe]] starts, not where it ends. The useful question is never "whose fault is this?" — it is "what was this change trying to fix?" So you take the hash blame gives you and run `git show` on it, which brings up the whole commit and, if its author did their job, the reason.

::: key What `git blame -L 120,140 file` gives you
For each of those lines, the commit, author and date that last touched it. It is the entry point to the archaeology question that matters: what was this change trying to fix.
:::

::: example Archaeology on line 7
**The question.** You are reading `gravity.py` and wonder why `accel` refuses a radius of zero or less. Real orbits never have $r \le 0$, so the check looks pointless. Can you delete it?

**Step 1.** `git blame -L 7,8 gravity.py` says both lines came from `1fbe379c`, by Ravi Patel, on 17 September.

**Step 2.** `git show 1fbe379` prints the message: a loader bug once produced a negative radius, the squared result looked normal, and a whole Monte Carlo run finished with wrong answers and no error.

**Conclusion.** The check is not pointless. It guards against bad *inputs*, not bad physics. Deleting it would bring back a silent failure that already happened once. Two commands and thirty seconds answered a question that would otherwise need a meeting — because Ravi wrote down *why*.
:::

::: warning Blame shows the last touch, not the author of the idea
If someone re-indents a whole file or renames a variable everywhere, blame will name *that* commit on every line it touched, hiding the older history underneath. When that happens, use `git blame -w` (ignore whitespace-only changes), or run blame on the parent of the noisy commit: `git blame <hash>^ -- file`. And the root commit's lines are shown with a `^` in front of the hash, as in `^903724b`, meaning "the history stops here".
:::

## Writing commit messages people can use

Look back at the blame example. Everything useful came from Ravi's message. The diff could only say *what* changed: two lines were added. Only the author knew *why*. That is the whole philosophy of a commit message in one sentence: **the diff already says what changed; only you can record why.**

A good message has a fixed shape, which many tools depend on:

```text
Reject non-positive radius in accel          <- subject line

A sign error in the initial-state loader     <- body: why the change
handed accel() r = -6.9e6 m. ...                was needed, and what
                                                alternative was rejected
```

### The subject line

- **Imperative mood.** Write it as a command: "Add", "Fix", "Reject", "Remove" — not "Added", "Fixes" or "Adding". A good test is to finish the sentence *"If applied, this commit will …"*: "If applied, this commit will *reject non-positive radius in accel*." The [[imperative habit|imperative-origin]] matches the messages Git writes itself.
- **Short: about [[50 characters|fifty-seventy-two]] or fewer.** It must fit on one line of `git log --oneline`, in email subjects and in web tools that cut long lines. "Reject non-positive radius in accel" is 35 characters.
- **Capital first letter, no full stop at the end.** It is a title, not a sentence.
- **Say what the commit does, specifically.** "Fix bug" could describe half the commits ever made. "Fix sign error in quaternion-to-DCM conversion" (46 characters) tells a reader whether to open it.

### The blank line, then the body

After the subject, leave **one blank line**. Git and every tool built on it treat the first line as the title and everything after the blank line as the body. Without the blank line, the whole message becomes one giant title.

The **body** explains **why**, not what:

- What was wrong, or what need prompted the change? Symptoms, numbers, a [[test or ticket ID|traceability]].
- Why this approach? If there was an obvious alternative, name it and say why you rejected it — that stops the next person from "fixing" your code back into the bug.
- Wrap lines at about 72 characters, because `git log` indents the body and does not re-wrap it.

A small commit whose reason is obvious from the subject ("Fix typo in README") needs no body. A change to flight logic always does.

::: key What makes a good commit message
An imperative subject under about 50 characters describing the change, a blank line, then a body explaining why the change was needed and what alternative was rejected. The diff already says what changed; only you can record why.
:::

::: example Rewriting a weak message
**The weak version.** Suppose Ravi later finds that the trajectory code passes altitude to `density()` in kilometers, while `density()` expects meters. He fixes the caller and commits with:

```text
fixed drag bug
```

What is wrong with it? It is past tense, not imperative. "Drag bug" does not say which bug, so nobody scanning `--oneline` can tell whether this is the commit they need. And there is no body, so the reason — and the alternative he chose not to take — is lost.

**Step 1 — the subject.** Say what the commit does, as a command: "Convert altitude to meters before density lookup". That is 48 characters: under the limit.

**Step 2 — the evidence.** At 400 km, the bug made the code look up $h = 400\,\mathrm{m}$ instead of $400\,000\,\mathrm{m}$. With the exponential model, $\rho(400\,\mathrm{m}) = 1.225\,e^{-400/8500} \approx 1.17\,\mathrm{kg/m^3}$, while $\rho(400\,\mathrm{km}) = 1.225\,e^{-400000/8500} \approx 4.47 \times 10^{-21}\,\mathrm{kg/m^3}$. The ratio is about $2.6 \times 10^{20}$: drag came out some $10^{20}$ times too strong.

**Step 3 — the rejected alternative.** He could have made `density()` accept kilometers instead. He rejected that because other callers already pass meters correctly.

**The result:**

```text
Convert altitude to meters before density lookup

The trajectory module passed altitude in km, but density() expects
meters. At 400 km it looked up h = 400 m, so drag came out about
1e20 times too strong.

Converting inside density() was rejected: other callers already pass
meters, and a function that guesses its units invites the next bug.
```

**Check.** "If applied, this commit will convert altitude to meters before density lookup" — reads correctly. Subject under 50 characters, blank line, body says why and what was rejected, lines under 72 characters.
:::

::: warning "WIP", "fix" and "changes" are not messages
Messages like `WIP`, `fix`, `more changes` or `asdf` feel harmless when you write them and cost someone an hour a year later. If a commit truly is a work-in-progress save, that is fine on your own machine — the next module shows how to tidy a series of rough commits into clean ones before anyone reviews them.
:::

## Check yourself

::: check The missing commit
A teammate says "I committed my changes, but `git log --oneline` doesn't show them." The two of you are in the same repository, and `git log --oneline --all` does show the commit. Explain what is going on.
:::

::: answer
Plain `git log` starts at HEAD and follows parent links backward. The teammate's commit is not an ancestor of HEAD — it is on another branch (another line of development), like `921a084` on `drag`. `--all` starts from every ref, so it finds the commit. Nothing is lost; the commit is not in the history of the branch you are on. Adding `--graph` would show where the lines split.
:::

::: check Read the graph
In this output, which commit is the parent of `e4d1f07`, and how many commits have no parent?

```text
* 7a1c9e2 (HEAD -> main) Tune attitude controller gains
| * e4d1f07 (sensor-fix) Filter gyro spikes before integration
|/  
* 30b8c55 Add gyro bias estimator
* 0f2a6d1 Initial commit
```
:::

::: answer
The `|/` joins the right-hand column into the left one right above `30b8c55`, so `30b8c55` is the parent of `e4d1f07` — and of `7a1c9e2` too. Following parents down, everything ends at `0f2a6d1`, the only commit with no parent (the root commit). So exactly one commit has no parent. In total there are 4 commits and 2 branches, `main` and `sensor-fix`.
:::

::: check Relative names
In orbit-sim, `HEAD` is `b108153`. Without running anything, which commit is `HEAD~3`, and what does `git show HEAD~3:README.md` print?
:::

::: answer
Walk back three parents: `HEAD~1` is `1fbe379`, `HEAD~2` is `1036755`, `HEAD~3` is `da6039c`. At `da6039c` ("Add vector form of gravity acceleration") the README had not yet gained its "Running the tests" section — that came in `1036755`, one commit later. So it prints the three-line README: `# orbit-sim`, a blank line, and `A tiny point-mass orbit simulator.`
:::

::: check Grade these subjects
Which of these subject lines follow the rules, and how would you fix the others? (a) `Added unit conversion for thrust.` (b) `Clamp throttle command to the 40-100% range` (c) `Update gravity.py`
:::

::: answer
(a) Breaks two rules: past tense ("Added") and a full stop at the end. Fix: `Add unit conversion for thrust`. (b) Follows them: imperative, specific, 43 characters, capital first letter, no full stop. (c) Is imperative but says nothing a reader could not see from `--stat`: *which* change to `gravity.py`? Fix by naming it, for example `Add circular orbit speed helper`. In all three, the reason belongs in the body.
:::

::: check Blame to reason
`git blame -L 40,42 guidance.py` shows that line 41, `max_tilt_deg = 12.0`, came from commit `5e7c2aa`, whose whole message is `tweak`. What can you learn, and what should the team do differently?
:::

::: answer
Blame gives you the commit, author and date, and `git show 5e7c2aa` gives the diff — so you can learn the old value and who to ask. You cannot learn *why* it changed: the message records nothing. If the author has left or forgotten, the reason is gone, and nobody can safely decide whether 12.0 is a tuned limit or a leftover experiment. The fix is cultural: subjects that say what (`Limit maximum tilt to 12 degrees during ascent`) and bodies that say why, with the test or analysis that justified the number.
:::

## Summary

| Command or rule | What it gives you |
| --- | --- |
| `git log` | commits reachable from HEAD, newest first: hash, author, date, message |
| `git log --oneline --graph --all` | one line per commit, the DAG drawn in the margin, every branch included |
| `git log -n 3`, `--stat`, `-p`, `-- file`, `--author=` | limit, list changed files, show diffs, one file's history, one author |
| `HEAD~n`, `HEAD^` | the commit `n` parents back; the first parent |
| `git show <commit>` | that commit's message and diff (computed from its parent) |
| `git show <commit>:<path>` | the file as it was in that commit |
| `git blame -L a,b file` | per line: last commit, author, date |
| Subject line | imperative, about 50 characters or fewer, capitalised, no full stop |
| Body | after one blank line; why the change was needed and what alternative was rejected |

You can now read any history and leave one worth reading. Next lesson opens up the thing that made `drag` appear beside `main` in the graph: branches, which turn out to be nothing more than the 41-byte pointer files from lesson 01.

::: context pager Why the log opens in `less`
Git sends long output through a **pager**, a program that shows text one screen at a time, so a history of ten thousand commits does not scroll past faster than you can read. The default is `less`. If you want the output printed straight to the terminal (for example, to pipe it into `grep`), add `--no-pager` right after `git`: `git --no-pager log --oneline`. When Git's output goes into a pipe rather than a screen, it skips the pager automatically.
:::

::: context ascii-graph How the text-art graph maps to the DAG
Each `*` is a commit; each column of `|` is a line of history. A `/` or `\` shows two lines joining or splitting.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="13" fill="#1f2a44" font-family="monospace">* b108153</text>
  <text x="10" y="54" font-size="13" fill="#1f2a44" font-family="monospace">| * 921a084</text>
  <text x="10" y="78" font-size="13" fill="#1f2a44" font-family="monospace">|/</text>
  <text x="10" y="102" font-size="13" fill="#1f2a44" font-family="monospace">* 1fbe379</text>
  <line x1="130" y1="10" x2="130" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="190" cy="30" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="34" font-size="11" fill="#1f2a44">b108153 (main)</text>
  <circle cx="240" cy="70" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="74" font-size="11" fill="#1f2a44">921a084 (drag)</text>
  <circle cx="190" cy="115" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="119" font-size="11" fill="#1f2a44">1fbe379</text>
  <line x1="190" y1="42" x2="190" y2="101" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="190,103 185,93 195,93" fill="#1f2a44"/>
  <line x1="232" y1="80" x2="200" y2="105" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="198,107 202,96 208,103" fill="#1f2a44"/>
</svg>
```

Left: what `git log --graph` prints. Right: the same commits as a DAG, arrows pointing to the shared parent.
:::

::: context dag-from-log The whole orbit-sim DAG
Seven commits; arrows point to parents. The two branch files point at the two tips, and HEAD names `main`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="c1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="25" cy="95" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="75" cy="95" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="125" cy="95" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="175" cy="95" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="225" cy="95" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="280" cy="60" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="280" cy="130" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="25" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">903724b</text>
  <text x="75" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">cf192ed</text>
  <text x="125" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">da6039c</text>
  <text x="175" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">1036755</text>
  <text x="225" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">1fbe379</text>
  <text x="280" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">b108153</text>
  <text x="235" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">921a084</text>
  <line x1="64" y1="95" x2="38" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <line x1="114" y1="95" x2="88" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <line x1="164" y1="95" x2="138" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <line x1="214" y1="95" x2="188" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <line x1="270" y1="66" x2="237" y2="88" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <line x1="270" y1="124" x2="237" y2="102" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
  <rect x="306" y="48" width="48" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="330" y="64" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="306" y1="60" x2="293" y2="60" stroke="#b4232c" stroke-width="1.5" marker-end="url(#c1)"/>
  <rect x="306" y="118" width="48" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="330" y="134" font-size="11" text-anchor="middle" fill="#b4232c">drag</text>
  <line x1="306" y1="130" x2="293" y2="130" stroke="#b4232c" stroke-width="1.5" marker-end="url(#c1)"/>
  <rect x="306" y="4" width="48" height="22" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="19" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD</text>
  <line x1="330" y1="26" x2="330" y2="46" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#c1)"/>
</svg>
```
:::

::: context blame-name A harsh name for a useful tool
"Blame" sounds like an accusation. Git also accepts `git annotate`, which prints the same information in a slightly different layout. Good engineering teams run **blameless** reviews: when a bug reaches a test campaign, the question is how the process let it through, not who typed it. Used that way, blame is a map of who to *ask*, because the person who last touched a line is often the one who remembers why.
:::

::: context pickaxe When blame is not enough: the pickaxe
Blame only sees lines that still exist. To find the commit that *removed* something, use `git log -S` (nicknamed the **pickaxe**): it lists commits whose diff changed how many times a piece of text appears. In orbit-sim, `git log --oneline -S "r <= 0"` prints exactly one commit, `1fbe379 Reject non-positive radius in accel`. Lesson 10 adds the heavier tool, `git bisect`, for when you know *that* something broke but not what text to search for.
:::

::: context imperative-origin Why commands, not past tense
Git itself writes subjects in the imperative: when it makes a merge commit it writes `Merge branch 'drag'`, and when it reverts one it writes `Revert "..."`. Using the same mood keeps a log reading like one consistent list of actions. It also reflects how a commit is used: it is something you *apply* to a codebase, so its title says what applying it will do. Many teams, including the Linux kernel and Git's own developers, write their contribution rules this way.
:::

::: context fifty-seventy-two Where 50 and 72 come from
Git grew up exchanging commits as emails, where the subject line became the email subject, and on terminals 80 characters wide. A subject of about 50 characters leaves room for prefixes like `[PATCH 3/7]` and for the hash in `--oneline`. The body is wrapped at 72 because `git log` indents it by four spaces and some tools indent it again, and $72 + 4 + 4 = 80$ still fits. These are conventions, not rules Git enforces, but many code-review tools warn when a subject runs long.
:::

::: context traceability Tying commits to requirements
Flight software is built against written **requirements** ("the controller shall hold attitude to within 0.1 degrees"), and reviewers must be able to trace each change to the requirement, problem report or test that justified it. Teams do this by putting an ID in the message body, often as a **trailer** — a `Key: value` line at the very end, such as `Refs: GNC-142`. Tools can then list every commit that touched a given requirement, which is exactly the evidence an audit asks for.
:::
