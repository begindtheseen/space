---
id: l02-merge-versus-rebase
title: Merge versus rebase, and the golden rule
minutes: 19
covers:
  - Merge vs rebase and the golden rule about shared history
---

Last lesson, `git pull --rebase` did something new: it took Maya's escape-speed commit, set it aside, and replayed it on top of Leo's work, and the commit came back with a different hash. That move has a name, **rebase**, and it is the other way — besides merging — to bring two lines of work together.

Teams argue about merge and rebase more than about almost anything else in Git. The argument is mostly noise. Both produce the same files. What differs is the *shape of the history* and *which commits exist afterwards*, and one plain rule tells you when rebasing is safe and when it will hurt your teammates.

In this lesson you will do the same catch-up both ways on Maya's drag-model branch, look inside the commits to see exactly what a rebase changes, watch what happens to Leo when the rule is broken, and finish with a guide for choosing.

## The situation: a branch falls behind

Maya's `drag-model` branch has three commits: the density model and the drag acceleration, which she pushed last lesson as a backup, and a ballistic-coefficient helper she has not pushed yet. Meanwhile Ravi pushed a circular-orbit-period function to `main`. Maya fetches:

```bash
git fetch
git log --oneline --graph --all
```

```text
* 429dc72 Add ballistic coefficient
* 249df06 Add drag acceleration
* 900a897 Add exponential atmosphere density model
| * 5b0a267 Add circular orbit period
|/  
* 76ccba1 Add escape speed helper
* 8c27620 List the constants' units in the README
```

The two lines fork at `76ccba1`, the merge base (`git merge-base drag-model origin/main` prints it). Before asking for review, Maya wants her branch to include Ravi's work, so the reviewers see her code running with the current `main`. She has two ways to get there. Before trying either, she bookmarks where the branch is with `git branch before-rebase`, so she can compare afterwards.

## Way one: merge `main` into the branch

On `drag-model`, she merges the fetched `main`, exactly as in the last module:

```bash
git merge origin/main
```

```text
Merge made by the 'ort' strategy.
 gravity.py | 7 +++++++
 1 file changed, 7 insertions(+)
```

```text
*   94f7c8e Merge remote-tracking branch 'origin/main' into drag-model
|\  
| * 5b0a267 Add circular orbit period
* | 429dc72 Add ballistic coefficient
* | 249df06 Add drag acceleration
* | 900a897 Add exponential atmosphere density model
|/  
* 76ccba1 Add escape speed helper
```

Look at what did *not* happen. Maya's three commits are untouched: same hashes, same parents, same snapshots. Git added one new commit, `94f7c8e`, with two parents. The graph now tells the true story: these three commits were written against `76ccba1`, while Ravi worked in parallel, and the two lines were joined here.

The price is that extra commit. Its content is Ravi's, not Maya's, and a reviewer reading her branch has to step around it. Merge `main` into a long branch every morning for two weeks and there are ten such commits, each saying only "I caught up".

## Way two: rebase the branch onto `main`

Now picture three recipe cards you wrote as changes to page 12 of the family cookbook. A new edition of the book comes out. You could staple a note to your cards saying "these were written for the old edition, combine them with the new one" — that is a merge. Or you could rewrite each card as if you had written it against the new edition from the start — that is a **rebase**.

Maya throws away the merge (`git reset --hard before-rebase`, from lesson 06 of the last module) and runs:

```bash
git rebase origin/main
```

```text
Successfully rebased and updated refs/heads/drag-model.
```

Read **`git rebase <new-base>`** as "move the commits of my current branch so they start from `<new-base>`". Here is what Git did, step by step:

1. Found the merge base of `drag-model` and `origin/main`: `76ccba1`.
2. Listed the commits on `drag-model` since then — `900a897`, `249df06`, `429dc72` — and remembered the change each one made compared with its parent.
3. Moved to the new base, `5b0a267`.
4. For each remembered change, oldest first, applied it and made a new commit with the same author, date and message — exactly what `git cherry-pick` did in lesson 07 of the last module.
5. Moved the `drag-model` pointer to the last new commit, and saved the old tip in `ORIG_HEAD`.

The [[before-and-after picture|rebase-picture]] shows the result, and so does the log:

```text
* 9b54774 Add ballistic coefficient
* dce084f Add drag acceleration
* 6df721d Add exponential atmosphere density model
* 5b0a267 Add circular orbit period
| * 429dc72 Add ballistic coefficient
| * 249df06 Add drag acceleration
| * 900a897 Add exponential atmosphere density model
|/  
* 76ccba1 Add escape speed helper
```

A straight line from `76ccba1` through Ravi's commit to Maya's three. The old three are still in the graph only because the bookmark `before-rebase` points at them; without it they would be unreachable, kept only by the reflog.

::: example What exactly changed in a rebased commit
Compare the first commit before and after, with `git cat-file -p` from the object-model lesson.

**The new one:**

```bash
git cat-file -p HEAD~2
```

```text
tree eeed250466e4a553490b65b315ff2a2136668292
parent 5b0a267dd06a1923d4a80ee3f18b657ec87e4d97
author Maya Chen <maya@example.com> 1791381600 -0500
committer Maya Chen <maya@example.com> 1791403200 -0500

Add exponential atmosphere density model
```

**The old one:**

```bash
git cat-file -p before-rebase~2
```

```text
tree 3e9abf7b5a380ea8710e0be20891e6f2d0e6c06f
parent 76ccba18f094e07c365e78ef7197116152bfaf3f
author Maya Chen <maya@example.com> 1791381600 -0500
committer Maya Chen <maya@example.com> 1791381600 -0500

Add exponential atmosphere density model
```

Line by line:

| Field | Old `900a897` | New `6df721d` | Same? |
| --- | --- | --- | --- |
| `tree` | `3e9abf7…` | `eeed250…` | no |
| `parent` | `76ccba1…` | `5b0a267…` | no |
| `author` | 1791381600 | 1791381600 | yes |
| `committer` | 1791381600 | 1791403200 | no |
| message | same | same | yes |

The **parent** changed because that is the whole point. The **tree** changed because the new snapshot includes Ravi's `orbital_period`: `git diff before-rebase~2 HEAD~2 --stat` shows `gravity.py | 7 +++++++`, his seven lines. The **[[committer time|author-committer]]** changed to when the rebase ran; $1791403200 - 1791381600 = 21600$ seconds, which is 6 hours later, 15:00 instead of 09:00. Since a commit's hash is the fingerprint of all of these fields, three of them changing means a new hash.

**Sanity check.** The *change* each commit makes is the same as before — the density commit still adds the same 9 lines to `drag.py`. Only its surroundings moved.
:::

So now there are two copies of Maya's work: the old commits, which the server's `origin/drag-model` still points to, and the new ones on her branch. Git sees that:

```text
$ git status
On branch drag-model
Your branch and 'origin/drag-model' have diverged,
and have 4 and 2 different commits each, respectively.
```

Four on her side (Ravi's commit plus her three new copies), two on the server's (the old copies of the two she pushed). A plain `git push` would be refused. Replacing the server's branch needs a *forced* push, and lesson 03 shows the safe way to do one. That forced push is where the danger lives, and it is the subject of the golden rule.

::: key Merge vs rebase, one line each
Merge preserves the true topology and never rewrites existing commits. Rebase replays your commits onto a new base, producing a linear history at the cost of new commit hashes. Rebase your own unpushed work; merge anything others have.
:::

### When a rebase stops

A rebase applies commits one at a time, and any of them can hit a conflict, the same as a merge. When that happens Git stops at that commit and tells you which one it could not apply. You fix the file as in the last module, then:

- `git add <file>` and **`git rebase --continue`** to make that commit and carry on with the next;
- **`git rebase --skip`** to leave this commit out entirely;
- **`git rebase --abort`** to put the branch back exactly as it was before you started.

And if a rebase finishes but you do not like the result, `git reset --hard ORIG_HEAD` right away, or the `rebase (start)` line in `git reflog` later, takes you back. Lesson 04 works through a rebase conflict in full.

::: warning A rebased commit is a snapshot nobody has run
Before the rebase, Maya's tests passed on each of her commits. After it, every commit is a new snapshot — her change on top of Ravi's code — and none of them has ever been tested. Usually that is fine. Sometimes it is not: Ravi renamed something she calls, and the rebase went through without a single conflict. Run the tests after every rebase. `git rebase --exec "python3 -m pytest -q" origin/main` runs them after *each* replayed commit and stops at the first failure.
:::

## The golden rule

Here is what goes wrong when the rewritten commits are ones other people already have.

::: example Leo's afternoon after Maya's forced push
Rewind to before Maya's rebase. Leo fetched `drag-model` that morning, because he wanted to test Maya's density model, and committed a test on top of her pushed commits:

```text
* 9f6cd5e Test sea-level density
* 249df06 Add drag acceleration
* 900a897 Add exponential atmosphere density model
* 76ccba1 Add escape speed helper
```

Maya, not knowing, rebases her branch and overwrites the server's copy with `git push --force`:

```text
To /home/you/team/server/orbit-sim.git
 + 249df06...9b54774 drag-model -> drag-model (forced update)
```

The `+` and `(forced update)` mean the server's branch moved to a commit that does not contain the old tip — a jump sideways, not forward.

**Step 1 — Leo fetches.** His note moves the same way:

```text
From /home/you/team/server/orbit-sim
 + 249df06...9b54774 drag-model -> origin/drag-model  (forced update)
```

and his status says `have 3 and 4 different commits each`. He has three commits the server lacks — but two of them are only Maya's *old* copies.

**Step 2 — Leo pulls, with merge.**

```bash
git pull --no-rebase
```

```text
Auto-merging drag.py
CONFLICT (add/add): Merge conflict in drag.py
Automatic merge failed; fix conflicts and then commit the result.
```

A conflict in `drag.py`, a file Leo never touched! The merge base is `76ccba1`, from before `drag.py` existed, so to Git it looks as if both sides created `drag.py` independently (**[[add/add|add-add]]**) with different contents: one has the ballistic coefficient, the other does not.

**Step 3 — he resolves it and looks at the history.** Suppose he takes the server's version (`git checkout --theirs drag.py`, `git add drag.py`, `git commit`):

```text
*   4a0070c Merge branch 'drag-model' of /home/you/team/server/orbit-sim into drag-model
|\  
| * 9b54774 Add ballistic coefficient
| * dce084f Add drag acceleration
| * 6df721d Add exponential atmosphere density model
| * 5b0a267 Add circular orbit period
* | 9f6cd5e Test sea-level density
* | 249df06 Add drag acceleration
* | 900a897 Add exponential atmosphere density model
|/  
* 76ccba1 Add escape speed helper
```

"Add drag acceleration" appears **[[twice|duplicate-picture]]**, and so does the density model: two commits each, different hashes, same change. If Leo now pushes, the old copies land back on the server — the very commits Maya tried to replace — and everyone who fetches gets both.

**Sanity check — how it could have been worse.** Had Leo resolved the add/add conflict by keeping *his* `drag.py`, Maya's ballistic coefficient would have vanished from the branch with no error at all. One wrong click, and a colleague's work is dropped silently.
:::

That is why every Git team, whatever else they disagree about, keeps [[one rule|golden-rule-flow]]:

::: key What is the golden rule of rebasing?
Never rebase commits that exist outside your repository. Rewriting published history forces everyone else into a painful reconciliation and can silently duplicate or drop commits. The usual exception is your own pushed feature branch that nobody else builds on, rewritten and pushed with `--force-with-lease`.
:::

Leo does have a way out. If he throws away the merge and runs `git pull --rebase` instead, Git [[notices|fork-point]] that his first two commits are old copies of commits already upstream, skips them, and replays only his test:

```text
* ca1e5bf Test sea-level density
* 9b54774 Add ballistic coefficient
* dce084f Add drag acceleration
* 6df721d Add exponential atmosphere density model
* 5b0a267 Add circular orbit period
```

That rescue works when the person knows to use it and their clone still remembers the old position. On a team of twenty, with half of them on a merge-style pull, it is not a plan. The plan is the rule.

### What "outside your repository" means in practice

Commits are *outside* as soon as someone else may have them: you pushed them to a branch other people fetch from, a teammate pulled from you, or a build machine tagged one. `main` and release branches are the extreme case: dozens of clones, build records and test reports name their commits. Rewriting them is never acceptable, and many teams set their server to refuse it outright (lesson 06 covers these branch protections).

Teams do make one agreed exception. A **personal feature branch** — one person's work in progress, pushed so a reviewer can read it or so it is backed up — is outside your repository, strictly speaking. But if the team convention is "nobody commits onto someone else's feature branch", only you build on it, and rewriting it before merge harms no one. Maya's `drag-model` is such a branch. Two conditions come with the exception: say so if anyone else has fetched it, and push with the checked form `--force-with-lease` from the next lesson, never plain `--force`. Leo's afternoon happened because nobody knew he was building on Maya's branch.

## Choosing, situation by situation

With the rule in hand, most choices make themselves.

| Situation | Use | Why |
| --- | --- | --- |
| Your branch, not yet shared, and `main` moved | rebase onto `main` | private commits; you get a straight, easily reviewed line |
| Pulling `main` while you have unpushed commits on it | `pull --rebase` | your commits are private; avoids merge bubbles |
| A branch several people commit to | merge | its commits are in other clones |
| `main`, release branches, anything tagged | never rebase | builds and reports name these hashes |
| Finishing a feature into `main` | team policy | see below |

For the last row, both styles are respectable:

- **Merge commit (`--no-ff`)** — `main` gets one merge commit per feature. The graph keeps the true shape, and `git log --first-parent main` shows [[one line per feature|first-parent]].
- **Rebase, then fast-forward** — the feature branch is rebased onto the latest `main` and tested, then `main` slides forward (`git merge --ff-only`). History is a single straight line.

A straight line reads like a diary and [[bisects cleanly|bisect-linear]] (lesson 10 of the last module): each step is one small change. A merge-heavy graph records exactly what happened — who worked in parallel with whom, and when two lines met — which matters when you need to know what was *tested together*. Pick one per repository, write it down, and let the tools enforce it. Lesson 05 compares whole team workflows built on these choices.

::: warning Rebasing does not remove the need to test the combination
Whichever way you integrate, the combined code is new. A merge commit's snapshot and a rebased branch's tip have both never been run until you run them. The difference is only where Git records that combination happened.
:::

## Check yourself

::: check
Maya's branch had 3 commits after the merge base; `main` had 1. After `git rebase origin/main`, how many commits have new hashes, and does Ravi's commit `5b0a267` change? Why or why not?
:::

::: answer
Exactly 3 — Maya's three commits, replayed as `6df721d`, `dce084f` and `9b54774`. Ravi's `5b0a267` keeps its hash: rebase only rewrites the commits of the branch being moved. Ravi's commit is the new base; nothing about it (tree, parent, message, dates) changes, so its fingerprint is the same.
:::

::: check
In the example comparing `900a897` with `6df721d`, which three fields changed, and which of them would still have changed if Ravi had not pushed anything (so the base did not move) but Maya forced a rebase anyway?
:::

::: answer
The parent, the tree and the committer timestamp changed. If the base did not move, the parent and tree would be the same. Only the committer time would differ — and that alone is enough for a new hash. (Git normally avoids this: when a commit's parent would not change, rebase keeps the existing commit rather than re-creating it. A forced rebase, `git rebase --force-rebase`, re-creates it anyway.)
:::

::: check
Leo, Maya and Ravi all push fixes to a branch `release-prep` during the week. Leo's two latest commits are unpushed, and the server's `release-prep` has moved. Should Leo run `git pull --rebase` or `git pull --no-rebase`? Should he ever rebase the branch's older commits to tidy them up?
:::

::: answer
`git pull --rebase` is fine: it only replays Leo's two *unpushed* commits, which exist nowhere else, onto the server's tip. Tidying the older commits is not: they are on the server and in Maya's and Ravi's clones, so rewriting them breaks the golden rule — each of them would face duplicates or conflicts like Leo's afternoon.
:::

::: check
After her rebase, Maya's status said `have 4 and 2 different commits each`. Explain both numbers, and say what a plain `git push` would do.
:::

::: answer
Her `drag-model` has 4 commits that `origin/drag-model` lacks: Ravi's `5b0a267` (now in her branch's history) and her three new copies. `origin/drag-model` has 2 commits her branch lacks: the old copies `900a897` and `249df06` that she pushed last lesson (she never pushed the third). A plain `git push` is rejected as non-fast-forward, because the server's tip `249df06` is not in her branch's history.
:::

::: check
Name one thing a merge-commit history tells you that a rebased, straight-line history cannot, and one reason a team might accept losing it.
:::

::: answer
A merge commit records that two lines of work happened in parallel and exactly where they were joined — so you can see which commits arrived together as one feature, and what state of `main` each was written against. A rebased history loses that; every commit looks as if it were written after the one before. A team may accept that because the straight line is much easier to read, review and bisect, and the feature grouping can be kept in other ways, such as pull-request records.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Merge | adds a commit with two parents; never rewrites existing commits; keeps the true shape |
| Rebase | replays your commits, oldest first, onto a new base; straight history; new hashes |
| What changes in a rebased commit | parent, tree (usually) and committer time, so the hash |
| What stays | author, author date, message, and the change the commit makes |
| Stopped rebase | fix, `git add`, `git rebase --continue`; or `--skip`, or `--abort` |
| Undo a finished rebase | `git reset --hard ORIG_HEAD`, or the reflog |
| After rebasing pushed commits | branch and upstream have diverged; only a forced push replaces them |
| Golden rule | never rebase commits that exist outside your repository |
| Exception teams allow | your own feature branch nobody builds on, pushed with `--force-with-lease` |
| Test after integrating | `git rebase --exec "<test command>" <base>` tests each replayed commit |

The next lesson turns rebase from a way to catch up into a way to *edit*: interactive rebase lets you squash, reword, reorder and drop commits, so an eight-commit mess becomes two clean commits for review. It also shows how to push the result with `--force-with-lease`, the forced push that cannot erase a teammate's work.

::: context rebase-picture Before and after a rebase
The branch's three commits are copied onto the new base. The copies (primed names) have new hashes; the originals are left behind, reachable only through the reflog or a bookmark such as `before-rebase`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="r1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="30" cy="120" r="14" fill="#8fb8f0"/>
    <circle cx="90" cy="120" r="14" fill="#8fb8f0"/>
    <circle cx="90" cy="60" r="13" fill="#fff" stroke-dasharray="3 2"/>
    <circle cx="140" cy="60" r="13" fill="#fff" stroke-dasharray="3 2"/>
    <circle cx="190" cy="60" r="13" fill="#fff" stroke-dasharray="3 2"/>
    <circle cx="150" cy="120" r="14" fill="#f2b880"/>
    <circle cx="205" cy="120" r="14" fill="#f2b880"/>
    <circle cx="260" cy="120" r="14" fill="#f2b880"/>
  </g>
  <text x="30" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">76c</text>
  <text x="90" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">5b0</text>
  <text x="90" y="64" font-size="11" text-anchor="middle" fill="#6c7a93">A</text>
  <text x="140" y="64" font-size="11" text-anchor="middle" fill="#6c7a93">B</text>
  <text x="190" y="64" font-size="11" text-anchor="middle" fill="#6c7a93">C</text>
  <text x="150" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">A′</text>
  <text x="205" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">B′</text>
  <text x="260" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">C′</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="76" y1="120" x2="46" y2="120" marker-end="url(#r1)"/>
    <line x1="136" y1="120" x2="106" y2="120" marker-end="url(#r1)"/>
    <line x1="191" y1="120" x2="166" y2="120" marker-end="url(#r1)"/>
    <line x1="246" y1="120" x2="221" y2="120" marker-end="url(#r1)"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.2" fill="none" stroke-dasharray="3 2">
    <line x1="80" y1="69" x2="42" y2="110" marker-end="url(#r1)"/>
    <line x1="127" y1="60" x2="105" y2="60" marker-end="url(#r1)"/>
    <line x1="177" y1="60" x2="155" y2="60" marker-end="url(#r1)"/>
  </g>
  <rect x="222" y="30" width="100" height="20" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="272" y="44" font-size="11" text-anchor="middle" fill="#6c7a93">before-rebase</text>
  <line x1="222" y1="45" x2="205" y2="54" stroke="#6c7a93" stroke-width="1.2" marker-end="url(#r1)"/>
  <rect x="282" y="78" width="74" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="319" y="92" font-size="11" text-anchor="middle" fill="#b4232c">drag-model</text>
  <line x1="300" y1="98" x2="273" y2="112" stroke="#b4232c" stroke-width="1.5" marker-end="url(#r1)"/>
  <text x="90" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">origin/main</text>
</svg>
```

`A`, `B`, `C` are `900a897`, `249df06`, `429dc72`; `A′`, `B′`, `C′` are `6df721d`, `dce084f`, `9b54774`.
:::

::: context author-committer Two names and two clocks on every commit
Every commit records an **author** — who wrote the change, and when — and a **committer** — who made this particular commit object, and when. Usually they are the same person at the same moment. They split whenever a commit is re-created: a rebase or cherry-pick keeps the author line (the change is still Maya's, written at 09:00) and writes a fresh committer line (the copy was made at 15:00, by whoever ran the command). `git log` shows the author date by default; `git log --format=fuller` shows both. The split is useful in reviews: a commit authored weeks ago but committed today has been replayed onto something new.
:::

::: context add-add Why Git called it add/add
A three-way merge compares each side with the merge base. Leo's branch and the rewritten server branch fork at `76ccba1`, a commit from before `drag.py` existed. Seen from there, *both* sides added a file called `drag.py`, and the two files differ (one has the ballistic-coefficient function). Git labels that conflict **add/add**. The strange thing is that the real history of `drag.py` was shared — it was the same work, copied — but after a rewrite the copies have no common ancestor, so Git cannot know that. Rewriting published history takes away exactly the information Git needs to merge well.
:::

::: context duplicate-picture The same change, twice
After Leo's merge, each of Maya's first two changes exists as two commits: the old copy on Leo's side and the rebased copy on the server's side. Same diff, same message, different hashes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="u1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="25" cy="80" r="13" fill="#8fb8f0"/>
    <circle cx="75" cy="40" r="13" fill="#f2b880"/>
    <circle cx="125" cy="40" r="13" fill="#f2b880"/>
    <circle cx="175" cy="40" r="13" fill="#8fb8f0"/>
    <circle cx="75" cy="120" r="13" fill="#8fb8f0"/>
    <circle cx="125" cy="120" r="13" fill="#f2b880"/>
    <circle cx="175" cy="120" r="13" fill="#f2b880"/>
    <circle cx="225" cy="120" r="13" fill="#8fb8f0"/>
    <circle cx="285" cy="80" r="14" fill="#fff"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="25" y="84">76c</text><text x="75" y="44">D</text><text x="125" y="44">Dr</text><text x="175" y="44">T</text>
    <text x="75" y="124">P</text><text x="125" y="124">D′</text><text x="175" y="124">Dr′</text><text x="225" y="124">B′</text>
    <text x="285" y="84">M</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="62" y1="47" x2="37" y2="72" marker-end="url(#u1)"/>
    <line x1="62" y1="113" x2="37" y2="88" marker-end="url(#u1)"/>
    <line x1="112" y1="40" x2="88" y2="40" marker-end="url(#u1)"/>
    <line x1="162" y1="40" x2="138" y2="40" marker-end="url(#u1)"/>
    <line x1="112" y1="120" x2="88" y2="120" marker-end="url(#u1)"/>
    <line x1="162" y1="120" x2="138" y2="120" marker-end="url(#u1)"/>
    <line x1="212" y1="120" x2="188" y2="120" marker-end="url(#u1)"/>
    <line x1="273" y1="72" x2="187" y2="44" marker-end="url(#u1)"/>
    <line x1="273" y1="88" x2="237" y2="114" marker-end="url(#u1)"/>
  </g>
  <text x="125" y="16" font-size="11" text-anchor="middle" fill="#6c7a93">Leo's side (old copies)</text>
  <text x="150" y="152" font-size="11" text-anchor="middle" fill="#6c7a93">server's side (rebased copies)</text>
</svg>
```

D is the density model, Dr the drag acceleration, T Leo's test, P Ravi's period commit, B′ the ballistic coefficient, M the merge. The orange pairs are duplicates.
:::

::: context fork-point How pull --rebase recognized the old copies
When Leo ran `git pull --rebase`, Git did not replay everything on his branch that the new `origin/drag-model` lacked. It looked in the reflog of Leo's `origin/drag-model` — his record of where the server's branch had been — and found that `249df06` used to be the upstream tip. Anything at or below an old upstream tip was someone else's work, not his, so only commits after it (his test) were replayed. This is called the **fork point**. It only works if Leo's clone had fetched the old tip before the rewrite, which is one more reason it is a rescue, not a license to rewrite shared branches.
:::

::: context first-parent Reading a merge-based history one feature at a time
In a merge commit the first parent is the branch you were on (usually `main`), and the second is the branch that came in. `git log --first-parent main` follows only first parents, so it walks `main`'s own line: one merge commit per feature, each with a message like "Merge branch 'drag-model'", skipping the individual commits inside each feature. Teams that merge with `--no-ff` get a readable summary this way, and `git bisect --first-parent` can search that line first, finding which feature broke something before looking inside it.
:::

::: context golden-rule-flow One question decides it
Before you rebase, ask: could anyone else already have these commits?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="g1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="70" y="10" width="220" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="27" font-size="12" text-anchor="middle" fill="#1f2a44">Are these commits anywhere</text>
  <text x="180" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">but your own repository?</text>
  <line x1="130" y1="50" x2="80" y2="92" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#g1)"/>
  <line x1="230" y1="50" x2="280" y2="92" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#g1)"/>
  <text x="92" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">no</text>
  <text x="268" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">yes</text>
  <rect x="10" y="95" width="140" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">rebase freely</text>
  <text x="80" y="133" font-size="11" text-anchor="middle" fill="#1f2a44">tidy, reorder, catch up</text>
  <rect x="210" y="95" width="140" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">merge instead</text>
  <text x="280" y="133" font-size="11" text-anchor="middle" fill="#1f2a44">history stays as it is</text>
</svg>
```

The only agreed exception is your own feature branch that nobody builds on — and then with `--force-with-lease`.
:::

::: context bisect-linear Why straight histories bisect well
`git bisect` from the last module halves a range of commits at each step and tests the middle one. It works best when every commit is a small, working step. A rebased history is exactly that: one line, each commit building on the last. A merge-heavy history still bisects — Git handles merges — but the middle commit it picks may sit inside a feature branch that was written against an old `main`, where your test may not even run. Teams that care about bisecting two years from now often choose rebase-then-fast-forward for that reason.
:::
