---
id: l10-bisect
title: Hunting a regression with bisect
minutes: 22
covers:
  - bisect for regression hunting
---

A simulation team gets a message from the mission analysts: "The orbit decay predictions from this week's build are off by a small but steady amount. Last month's release was fine." Between last month's release and today, the repository gained sixty commits from six people. Somewhere in there, one change broke something. Reading sixty diffs line by line would take a day, and the guilty change may look completely innocent.

A bug like this — something that used to work and now does not — is called a **[[regression|regression-word]]** (from the Latin for "going backward"). Git has a tool built for finding exactly which commit caused one: **`git bisect`**. You tell it one commit that was good and one that is bad, and it walks you to the culprit by testing only a handful of commits in between. With a small test script, it does the whole walk for you while you get a coffee.

This is the last lesson of the module, and it uses almost everything before it: commits as snapshots (lesson 01), detached HEAD (lesson 04), messages you can read (lesson 03), and tags as fixed points (lesson 09).

## The guessing game

You have probably played this. A friend thinks of a whole number from 1 to 100. You guess, and they say "higher" or "lower". The bad strategy is 1, 2, 3, … — up to 100 guesses. The good strategy is to guess the middle, 50. Whatever the answer, half the numbers are gone. Then guess the middle of what is left, 25 or 75, and so on. You never need more than 7 guesses.

That strategy is called **binary search**: repeatedly test the middle of the remaining range and throw away the half that cannot contain the answer. "Binary" because each test has two outcomes and cuts the range in two.

A regression hunt is the same game. Line up the commits from the last good one to the first known bad one, oldest to newest. Somewhere in that line is the **first bad commit**: every commit before it is good, and it and every commit after it are bad. Test the commit in the middle. If it is good, the break happened later; if it is bad, the break happened at or before it. Either way, [[half the suspects are cleared|halving-picture]] by one test.

### How many tests?

Start with $N$ suspect commits. Each test halves the number left, so after $k$ tests about $N / 2^k$ remain. You are done when one suspect is left:

$$
\frac{N}{2^k} \le 1 \quad\Longleftrightarrow\quad 2^k \ge N \quad\Longleftrightarrow\quad k \ge \log_2 N.
$$

Here $\log_2 N$, read "log base two of N", is the [[power|log-read-aloud]] you must raise 2 to in order to get $N$. For example, $\log_2 64 = 6$ because $2^6 = 64$. So bisect needs about $\log_2 N$ tests, rounded up to a whole number.

::: key How `git bisect` works
You mark one good and one bad commit; Git binary-searches the range, checking out midpoints for you to test. With `bisect run <script>` it automates the whole search and finds the culprit among N commits in about log2(N) builds.
:::

::: example Tests needed for sixty commits
The team's range has sixty commits after the last good release. How many tests will bisect need?

**Step 1 — bracket it between powers of two.** $2^5 = 32$ and $2^6 = 64$. Sixty lies between them, so five halvings are not quite enough and six are.

**Step 2 — the logarithm.** $\log_2 60 \approx 5.91$. Round up: **6 tests**.

**Step 3 — trace the halving.** 60 suspects, then about 30, 15, 8, 4, 2, 1. Count the arrows between those seven numbers: six tests.

**Step 4 — what it saves.** Suppose each test is a simulation run that takes 3 minutes. Testing commit after commit could take up to 59 runs, which is 177 minutes, about three hours. Bisect takes about $6 \times 3 = 18$ minutes.

**The practice repository.** Below, the first of its sixty commits is the known-good one, so 59 commits are suspects. $\log_2 59 \approx 5.88$: still 6 tests.

**Check with other sizes.** A thousand commits need 10 tests ($\log_2 1000 \approx 9.97$), and a million commits need only 20. Doubling the number of commits adds only one test, which is why bisect stays useful on huge, old projects.
:::

::: note Why halving gives a logarithm
Think backward instead of forward. With 1 test you can tell apart at most 2 possibilities (good or bad). With 2 tests, each of those 2 answers splits again, so at most $2 \times 2 = 4$. With $k$ tests, at most $2^k$ possibilities can be told apart. To single out one culprit among $N$ commits you need $2^k \ge N$, so $k \ge \log_2 N$. No yes-or-no testing strategy can do better, and bisect matches that limit — which is why it is the standard tool rather than one clever trick among many.
:::

## Bisect by hand

To see each move, let us run a hunt manually first. The practice repository is a version of orbit-sim with sixty commits. Its first commit sets standard gravity correctly, `G0 = 9.80665`. At its newest commit, `gravity.py` says:

```python
G0 = 9.81                  # m/s^2, standard gravity
```

Someone rounded it. The number $9.81$ is only $0.00335\,\mathrm{m/s^2}$ off, and in lesson 04 Maya saw that the existing surface-gravity test, which allows a difference of 0.05, still passes with it. But the analysts' orbit predictions depend on the exact value, and in a flight program a constant that disagrees with the defined standard is a defect. Which commit did it? (To make the hunt easy to follow, the practice repository numbers most of its commit messages, like `Tune drag table (30)` for the thirtieth commit.)

**Start the session and mark the ends.**

```bash
git bisect start
git bisect bad                  # the commit you are on (HEAD) is bad
git bisect good 6a47354         # the first commit was good
```

```text
status: waiting for both good and bad commits
status: waiting for good commit(s), bad commit known
Bisecting: 29 revisions left to test after this (roughly 5 steps)
[0a9bef5a3d9d33c98d62a130274d7d74075d1bf9] Tune drag table (30)
```

As soon as Git knows both ends, it checks out the middle commit — number 30 — in **detached HEAD** (lesson 04), and tells you roughly how many more tests you will need after this one. "Revisions" is Git's older word for commits.

**Test it, and report.** Our test is one line of Python that prints the constant. (The `-B` stops Python writing `__pycache__` files, so every checkout is tested fresh.)

```bash
python3 -B -c "import gravity; print(gravity.G0)"
```

```text
9.80665
```

Correct, so:

```bash
git bisect good
```

```text
Bisecting: 14 revisions left to test after this (roughly 4 steps)
[2dc17a8e0c2ede16d95dbef5285454ed2fccb30a] Add unit test for helper (45)
```

Git has thrown away commits 1 to 30 and jumped to the middle of 31 to 60. Test again: this time it prints `9.81`. So:

```bash
git bisect bad
```

```text
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[941207b5fd04851ab7c1d5924b96a020b54b8b52] Tidy constants block
```

Carry on the same way — that commit is bad, then commits 33, 35 and 36 are good — and Git prints `941207b… is the first bad commit`, with that commit's details.

**Finish.** A bisect session leaves you in detached HEAD at some old commit. Always end with:

```bash
git bisect reset
```

That returns you to the branch you started on (`Switched to branch 'main'`). Two more commands help mid-hunt: `git bisect log` prints every mark you have made, and `git bisect visualize --oneline` lists the suspects still in play.

::: key The manual bisect loop
`git bisect start`, `git bisect bad [commit]`, `git bisect good <commit>` — then test the commit Git checks out and answer `git bisect good` or `git bisect bad` until it names the first bad commit. `git bisect skip` if the commit cannot be tested. `git bisect reset` to go home.
:::

::: warning Good must really be good, and bad must really be bad
Bisect trusts every answer. Mark one commit wrongly — a test that failed for an unrelated reason, a typo in `good` versus `bad` — and it will confidently name the wrong commit. It also assumes the break happens once: good, good, good, then bad from there on. If the bug comes and goes (fixed in one commit and broken again later), bisect finds *a* place where good turns to bad, not necessarily the one you want. If an answer might be wrong, `git bisect log` shows your marks, and you can start over.
:::

## Letting Git run the test: `git bisect run`

Typing `good` and `bad` six times is fine once. For a test that takes a few minutes, or a hunt over thousands of commits, you want the computer to do it. **`git bisect run <command>`** runs a command at each step and reads its **[[exit status|exit-status]]** — the number every program hands back when it finishes, which you met in the shell module as `$?`. The rule:

| Exit status | Git treats the commit as |
| --- | --- |
| 0 | good |
| 1 to 127, except 125 | bad |
| 125 | cannot be tested: skip it |
| 128 or more (or a crash of the script) | stop the whole bisect with an error |

So you need a script that exits 0 when the code is right and non-zero when it is wrong. Here is one for the gravity constant, `check_g0.sh`:

```bash
#!/bin/sh
# Exit 0 if G0 is standard gravity, 1 if it is wrong,
# 125 if this commit cannot be tested (gravity.py does not even import).
python3 -B -c '
import sys
try:
    import gravity
except SyntaxError:
    sys.exit(125)
sys.exit(0 if gravity.G0 == 9.80665 else 1)
'
```

Line by line: `python3 -B -c '…'` runs the Python between the quotes. `sys.exit(n)` ends Python with exit status `n`, and because it is the last command in the script, the shell passes that status on to Git. If `gravity.py` cannot even be read by Python — a half-finished commit with a syntax error — the script exits 125. Otherwise it exits 0 if `G0` is exactly $9.80665$ and 1 if not.

::: warning Keep the test script out of the history you are searching
Bisect checks out old commits, replacing the tracked files in your working tree. If `check_g0.sh` were committed only recently, it would vanish at the first old checkout, and every run would fail. Put the script outside the repository (here, one folder up, `../check_g0.sh`) or leave it untracked, and make it executable with `chmod +x`, as in the shell module. If Git cannot run it at all, the shell returns 126 or 127, and Git 2.43 does not blindly call that "bad": it re-runs the script on the known-good commit, sees the same failure, and stops with `error: bogus exit code 127 for good revision`.
:::

::: example An automated hunt over sixty commits
**Step 1 — find the good end.** The first commit is the last line of `git log --oneline`:

```bash
git log --oneline | tail -1
```

```text
6a47354 Add point-mass gravity model
```

(`git rev-list --max-parents=0 HEAD` prints the same root commit's full hash: it lists commits with no parents.)

**Step 2 — start, naming bad first, then good.** `git bisect start <bad> <good>` does the three commands of the manual session in one:

```bash
git bisect start HEAD 6a47354
git bisect run ../check_g0.sh
```

**Step 3 — watch it work.** This is Git's real output, with the author and date lines of the final commit trimmed:

```text
Bisecting: 29 revisions left to test after this (roughly 5 steps)
[0a9bef5a3d9d33c98d62a130274d7d74075d1bf9] Tune drag table (30)
running '../check_g0.sh'
Bisecting: 14 revisions left to test after this (roughly 4 steps)
[2dc17a8e0c2ede16d95dbef5285454ed2fccb30a] Add unit test for helper (45)
running '../check_g0.sh'
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[941207b5fd04851ab7c1d5924b96a020b54b8b52] Tidy constants block
running '../check_g0.sh'
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[369bc21a0214b818e1340fcef07e5370b1bfe0ad] Fix typo in docs (33)
running '../check_g0.sh'
Bisecting: 1 revision left to test after this (roughly 1 step)
[5180f9fa20734dad53e079dece1f8f9c6ebfb7a1] Add unit test for helper (35)
running '../check_g0.sh'
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[e5468e03ade63ae3ed8fc66d85233e0597e4662d] Rename local variable (36)
running '../check_g0.sh'
941207b5fd04851ab7c1d5924b96a020b54b8b52 is the first bad commit
commit 941207b5fd04851ab7c1d5924b96a020b54b8b52
...
    Tidy constants block

 gravity.py   | 2 +-
 notes/log.md | 1 +
 2 files changed, 2 insertions(+), 1 deletion(-)
bisect found first bad commit
```

**Step 4 — follow the reasoning.** The script ran six times. Commit 30 was good, so the break is in 31–60. Commit 45 was bad: 31–45. The unnumbered commit, "Tidy constants block", was bad: it or something before it, back to 31. Commit 33 good: 34 onward. Commit 35 good. Commit 36 good. So the first bad commit is the one after 36 — "Tidy constants block", which is commit 37.

**Step 5 — check the answer.** `git bisect reset`, then look at the culprit's change to `gravity.py`:

```bash
git show 941207b -- gravity.py
```

```diff
@@ -1,5 +1,5 @@
 MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter
-G0 = 9.80665               # m/s^2, standard gravity
+G0 = 9.81                  # m/s^2, standard gravity
```

There it is. **Report:** first bad commit `941207b`, found in **6 steps**, exactly the $\lceil \log_2 60 \rceil$ the earlier example predicted (the brackets $\lceil\ \rceil$ mean "round up"). The message "Tidy constants block" gave no hint that a physical constant changed — a reminder of lesson 03, and of why bisect beats reading messages.
:::

To count the steps in your own hunt, count the `running` lines, or look at `git bisect log`: every `# good:`, `# bad:` or `# skip:` line after the first two marks is one test.

## When a commit cannot be tested

Real histories contain commits that do not build or do not run — a half-finished refactor, a file renamed in one commit and its imports fixed in the next. On such a commit your test cannot say good or bad. Answering "bad" would be a lie, and so would "good". Bisect's answer is **skip**: `git bisect skip` by hand, or exit status **125** from a `bisect run` script.

A skipped commit is left out. Git picks another commit near the middle and carries on. In a second practice repository, commit 45 has a syntax error in `gravity.py`. The same script, the same range:

```text
[0a9bef5a3d9d33c98d62a130274d7d74075d1bf9] Tune drag table (30)
[d437b28267fbd070a611a5faebdeb9779de7aabf] Start extracting orbit helpers
[37fa4fe7ea6f77cabbb471d551388bb510a24af3] Add CSV export (58)
[2bdf15caefa0bc0b30eb555f02d3de41405d6de8] Speed up integrator loop (44)
[941207b5fd04851ab7c1d5924b96a020b54b8b52] Tidy constants block
[369bc21a0214b818e1340fcef07e5370b1bfe0ad] Fix typo in docs (33)
[5180f9fa20734dad53e079dece1f8f9c6ebfb7a1] Add unit test for helper (35)
[e5468e03ade63ae3ed8fc66d85233e0597e4662d] Rename local variable (36)
941207b5fd04851ab7c1d5924b96a020b54b8b52 is the first bad commit
```

(Only the checked-out commits are shown.) The second commit tested, "Start extracting orbit helpers", is commit 45; the script exited 125 there, and `git bisect log` records it as `# skip:`. Git then tried commit 58 instead of the exact middle, and the hunt took 8 runs instead of 6 — but it still found the same culprit.

Skipping has a limit. If the untestable commit sits right next to the culprit, Git cannot tell which of the two broke things. When the broken commit is 36, the run ends with:

```text
There are only 'skip'ped commits left to test.
The first bad commit could be any of:
f694e82819a91209f66ef992bc828cbdf5949492
9b06e0591e2135736d5cac214486488a02daaba3
We cannot bisect more!
```

Two suspects instead of one is still a good result: you read two diffs, not sixty.

::: key Exit codes for `git bisect run`
0 means good. Any code from 1 to 127 except 125 means bad. 125 means "cannot test this commit — skip it". 128 or above aborts the bisect. A test that exits non-zero when the code is wrong is all `git bisect run` needs.
:::

::: warning A flaky test ruins a bisect
If your test sometimes fails for reasons unrelated to the code — a random seed, a timing race, a network download — bisect will mark good commits bad and blame an innocent change. Make the test **[[deterministic|deterministic-tests]]** (same answer every time for the same code): fix the random seed, remove the network, test one thing. For a Monte Carlo regression, compare a single seeded run against a stored result, not a statistical summary that wobbles.
:::

## Making your history easy to bisect

Bisect [[works on any Git history|bisect-history]], but some histories give much better answers than others:

- **Small commits.** If the culprit is a 3-line commit, bisect has solved your problem. If it is a 3,000-line "refactor everything" commit, bisect has only narrowed the search to one very large haystack.
- **Every commit builds and passes its tests.** Then you never need `skip`. Teams that run their test suite on every commit before it is merged get this almost for free.
- **Good messages.** Once bisect names the commit, the message is the first thing you read. "Tidy constants block" told nobody that a physical constant had changed; "Round G0 to 9.81 for display" would at least have explained the intent.
- **Tags on releases.** "Last month's release was fine" becomes `git bisect start HEAD v1.4.0`, with no digging for hashes.
- **Other kinds of change.** Bisect does not need a bug. For "when did this simulation get slow?", start with `git bisect start --term-old=fast --term-new=slow` and answer `git bisect fast` or `git bisect slow`. The search is the same.

## Where this module leaves you

You can now read Git the way it really works: snapshots named by their hashes, joined into a graph, with branches and tags as small pointers into it. You can stage and commit deliberately, read history and write messages people can use, branch and merge, undo with the right tool, fall back on the stash and the reflog, keep junk and giant binaries out, name releases, and hunt a regression in about $\log_2 N$ steps.

Everything so far has happened in one repository on one machine. The next module, **cod_git_02_collab**, [[takes Git onto the team|collab-bridge]]: **remotes** (other copies of the repository, and how `fetch`, `pull` and `push` move commits between them), **rebase** and interactive rebase for cleaning up a branch before others see it, and **pull requests** — the review workflow where every change to flight software is read by a second pair of eyes before it merges.

## Check yourself

::: check Budget the hunt
A test campaign runs one hardware-in-the-loop simulation per build, and each run takes 20 minutes. The regression appeared somewhere in 4,000 commits since the last good tag. About how long will an automated bisect take, and how does that compare with testing every commit?
:::

::: answer
$\log_2 4000 \approx 11.97$, so about 12 tests (check: $2^{12} = 4096 \ge 4000$, while $2^{11} = 2048$ is too few). At 20 minutes each that is $12 \times 20 = 240$ minutes, about four hours — one overnight run. Testing every commit could take up to 3,999 runs, $3999 \times 20 = 79{,}980$ minutes, which is about 55 days.
:::

::: check Write the exit codes
Your regression test is a pytest file, `tests/test_g0.py`, that exists in every commit of the range. Pytest exits 0 when all tests pass, 1 when a test fails, and 2 when it is interrupted or cannot even collect the tests, for example because of an import error. Is `git bisect run python3 -m pytest tests/test_g0.py` safe to use as it is? If not, what would you change?
:::

::: answer
Not quite. Passes (0) and failures (1) are read correctly. But a commit that cannot even be collected makes pytest exit 2, and Git reads 2 as **bad** — blaming a commit merely because it did not run. Wrap pytest in a small script that turns that case into a skip: run pytest, and if its status is 2, `exit 125`; otherwise pass pytest's status through. Also make sure the test file is not changed within the range, or bisect will be testing different tests at different commits; putting a copy outside the repository avoids that.
:::

::: check Why did it go wrong?
A colleague's bisect named a commit that only changed the README as "the first bad commit". Give two likely reasons.
:::

::: answer
(1) A wrong mark: they answered `bad` at a commit that was really good (a typing slip, or a test that failed for an unrelated reason), so the search was steered to the wrong half and ended beside the real break. (2) A flaky or non-deterministic test: it failed at random on a good commit, with the same effect. Other possibilities: the bad behaviour comes and goes, or the test script changed between commits because it was tracked in the repository. `git bisect log` shows every mark, which is the place to start looking.
:::

::: check Read the halving
In a manual bisect over commits 1 (good) to 100 (bad), Git's first checkout is commit 50. You answer `bad`. What range is left, which commit will it probably test next, and why does the good end never get tested again?
:::

::: answer
Commit 50 is bad, so the first bad commit is at 50 or earlier; commit 1 is already known good. The suspects are 2 to 50, 49 commits, and Git will check out one near their middle, around commit 25 or 26. The ends are never tested again because you already told Git their answers: commit 1 is good by your mark, and 50 is known bad. Every test is spent on commits whose answer is still unknown.
:::

::: check Report for the exercise
After a `git bisect run` over sixty commits, the output contains seven `running` lines, and `git bisect log` shows one `# skip:` line among the marks. How many steps did the bisect need, and how many of them told Git something useful? What do you report?
:::

::: answer
Seven runs of the script, so seven steps. One of them was a skip, so six runs gave a good-or-bad answer — in line with the six tests binary search needs for sixty commits — and the skip cost one extra run. Report the hash from the line `… is the first bad commit`, the step count (7, of which 1 skipped), and the diff of that commit showing the constant change. Then run `git bisect reset`.
:::

## Summary

| Command or idea | Meaning |
| --- | --- |
| Regression | something that used to work and now does not |
| First bad commit | the oldest commit with the problem; all before it are good |
| Tests needed | about $\log_2 N$ for $N$ commits, rounded up: 60 → 6, 1000 → 10 |
| `git bisect start [<bad> <good>]` | begin a session (optionally marking both ends) |
| `git bisect good` / `bad` / `skip` | report the result for the checked-out commit |
| `git bisect run <script>` | test automatically: exit 0 good, 1–127 bad, 125 skip, 128+ abort |
| `git bisect log`, `visualize` | the marks so far; the suspects still left |
| `git bisect reset` | end the session and return to your branch |
| `--term-old` / `--term-new` | hunt for any change, such as fast to slow |

This is the end of the module. The next one, cod_git_02_collab, moves from your own repository to the team's: remotes, rebase and pull requests.

::: context regression-word Why "regression"
In everyday English, to **regress** is to go back to an earlier, worse state. Software engineers use **regression** for a feature that worked in an earlier version and is broken in a later one, and **regression tests** for the tests that exist to catch that — often one test added for every bug ever fixed, so it can never quietly return. Flight software teams keep large regression suites of simulated missions, and a change is not accepted until they all pass.
:::

::: context halving-picture Six cuts to one commit
The real run over sixty commits. Each bar is the range of suspects before a test, drawn to scale with commits 1 to 60 running left to right; the dot is the commit tested, dark for good and red for bad. The numbers on the right count the suspects.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="11" fill="#1f2a44">tested</text>
  <text x="350" y="18" font-size="11" text-anchor="end" fill="#1f2a44">left</text>
  <rect x="45" y="30" width="295" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="187.5" cy="37" r="4" fill="#1f2a44"/>
  <text x="10" y="41" font-size="11" fill="#1f2a44">30 good</text>
  <text x="350" y="41" font-size="11" text-anchor="end" fill="#6c7a93">59</text>
  <rect x="190" y="54" width="150" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="262.5" cy="61" r="4" fill="#b4232c"/>
  <text x="10" y="65" font-size="11" fill="#b4232c">45 bad</text>
  <text x="350" y="65" font-size="11" text-anchor="end" fill="#6c7a93">30</text>
  <rect x="190" y="78" width="75" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="222.5" cy="85" r="4" fill="#b4232c"/>
  <text x="10" y="89" font-size="11" fill="#b4232c">37 bad</text>
  <text x="350" y="89" font-size="11" text-anchor="end" fill="#6c7a93">15</text>
  <rect x="190" y="102" width="35" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="202.5" cy="109" r="4" fill="#1f2a44"/>
  <text x="10" y="113" font-size="11" fill="#1f2a44">33 good</text>
  <text x="350" y="113" font-size="11" text-anchor="end" fill="#6c7a93">7</text>
  <rect x="205" y="126" width="20" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="212.5" cy="133" r="4" fill="#1f2a44"/>
  <text x="10" y="137" font-size="11" fill="#1f2a44">35 good</text>
  <text x="350" y="137" font-size="11" text-anchor="end" fill="#6c7a93">4</text>
  <rect x="215" y="150" width="10" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.5"/>
  <circle cx="217.5" cy="157" r="4" fill="#1f2a44"/>
  <text x="10" y="161" font-size="11" fill="#1f2a44">36 good</text>
  <text x="350" y="161" font-size="11" text-anchor="end" fill="#6c7a93">2</text>
  <rect x="220" y="174" width="5" height="14" fill="#b4232c"/>
  <text x="232" y="185" font-size="11" fill="#b4232c">commit 37</text>
  <text x="10" y="185" font-size="11" fill="#1f2a44">found</text>
  <text x="350" y="185" font-size="11" text-anchor="end" fill="#6c7a93">1</text>
</svg>
```

Each good answer clears everything up to the dot; each bad answer clears everything after it. The suspects shrink 59, 30, 15, 7, 4, 2, 1.
:::

::: context log-read-aloud Reading a logarithm
A **logarithm** answers the question "what power?". $\log_2 64 = 6$ is read "log base two of sixty-four is six" and means "2 to the sixth is 64". You met powers of ten in the math track; $\log_{10} 1000 = 3$ is the same idea with base ten. The number of digits in a number grows like its base-ten logarithm, and the number of halvings you need grows like its base-two logarithm. On a calculator or in Python, `math.log2(60)` returns about 5.91.
:::

::: context exit-status The number every program returns
Every program on Linux ends by handing its parent a small whole number from 0 to 255, its **exit status**. By long convention 0 means success and anything else means some kind of failure, which is why the shell's `&&` runs the next command only after a 0. Git's bisect borrows that convention and reserves two special ranges: 125 for "skip", because few programs use it by accident, and 128 and above, because a shell reports a program killed by a signal as 128 plus the signal's number — a crashed test should stop the hunt, not blame a commit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="11" fill="#1f2a44">exit status seen by git bisect run, 0 to 255</text>
  <rect x="30.0" y="40" width="1.2" height="22" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/>
  <rect x="31.2" y="40" width="145.3" height="22" fill="#b4232c" stroke="#1f2a44" stroke-width="0.8"/>
  <rect x="176.5" y="40" width="1.2" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <rect x="177.7" y="40" width="2.3" height="22" fill="#b4232c" stroke="#1f2a44" stroke-width="0.8"/>
  <rect x="180.0" y="40" width="150.0" height="22" fill="#fff" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="30.0" y="78" font-size="11" fill="#1d6fd1">0 good</text>
  <text x="102.7" y="78" font-size="11" text-anchor="middle" fill="#b4232c">1 to 127: bad</text>
  <line x1="177.1" y1="62" x2="177.1" y2="92" stroke="#1f2a44" stroke-width="1"/>
  <text x="177.1" y="106" font-size="11" text-anchor="middle" fill="#1f2a44">125 skip</text>
  <text x="255.0" y="78" font-size="11" text-anchor="middle" fill="#6c7a93">128 and up: abort</text>
</svg>
```
:::

::: context bisect-history Born for the Linux kernel
`git bisect` appeared in Git's first year, 2005. Git was written for the developers of the Linux kernel, a project that merges thousands of changes from hundreds of people for each release. When a new kernel stops booting on some machine, nobody can guess which of those thousands of changes is responsible, but a user with that machine can bisect: build, boot, answer good or bad, about a dozen times. Kernel developers still regularly ask bug reporters to "please bisect", and the reports that come back name the exact commit.
:::

::: context deterministic-tests Making a Monte Carlo run repeatable
A Monte Carlo simulation draws random numbers — wind gusts, sensor noise, engine thrust scatter — so two runs differ even with the same code. The random numbers come from a **pseudo-random generator**, which produces the same sequence every time it is started from the same **seed**. In NumPy, `rng = np.random.default_rng(42)` fixes the seed at 42. A regression test that fixes the seed, runs one case and compares the result with a stored golden value is deterministic: the same code always gives the same answer, which is exactly what bisect needs.
:::

::: context collab-bridge What the next module adds
Everything in this module works in a repository with no connection to anyone else. The next module adds **remotes**: named links to other copies, such as your team's server, and the commands `fetch`, `pull` and `push` that move commits between them. It also teaches **rebase**, which replays commits onto a new base to keep history straight (the reflog from lesson 07 is your net when it goes wrong), and the **pull request**, the review step in which teammates read, test and approve a change before it joins the shared branch.
:::
