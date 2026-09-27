---
id: l01-remotes-fetch-and-pull
title: "Remotes: fetch, pull and upstream tracking"
minutes: 24
covers:
  - "Remotes: fetch vs pull, pull --rebase, upstream tracking"
---

In the last module, orbit-sim lived in one folder on Maya's laptop. Every commit, branch and merge happened in that one repository. A real flight software team does not work like that. Five, twenty or two hundred engineers each have their own copy, and one shared copy sits on a server. Every change that flies has to travel from someone's laptop to that server, and from the server to everybody else.

This lesson is about that travel. You will meet the **remote** — a named link from your repository to another copy — and the three commands that move commits along it: `push` sends, `fetch` downloads, and `pull` downloads and then combines. You will also learn why Git sometimes says "Your branch is up to date" when it is not, and how each of your branches keeps track of its partner on the server.

The one idea to hold onto: your repository never changes by itself. Nothing arrives from the server until you ask for it, and nothing you do reaches the server until you send it. Once that clicks, every message in this lesson makes sense.

## A team on one computer

To see real output, we will build a small team on one machine. Everything lives in a folder called `~/team` (the `~` means your home folder). Inside it are three folders: `server` for the shared copy, `maya` for Maya's laptop, and `leo` for Leo's. On a real team these would be three different computers, and the server would be GitHub, GitLab or a company machine, but Git behaves exactly the same when the "server" is a folder.

The shared copy is a **bare repository** — a repository with no working tree, only the `.git` contents. Nobody edits files on the server, so it does not need a working tree. The flag `--bare` makes one:

```bash
cd ~/team/server
git init --bare -b main orbit-sim.git
```

```text
Initialized empty Git repository in /home/you/team/server/orbit-sim.git/
```

The folder name ends in `.git` by [[convention|bare-name]]. The `-b main` makes its first branch be called `main`, the same as Maya's.

Maya's orbit-sim already has five commits, from the gravity model to a `.gitignore` that keeps Python's cache folders out. She connects it to the server with **`git remote add <name> <address>`**:

```bash
cd ~/team/maya/orbit-sim
git remote add origin ~/team/server/orbit-sim.git
git remote -v
```

```text
origin	/home/you/team/server/orbit-sim.git (fetch)
origin	/home/you/team/server/orbit-sim.git (push)
```

A **remote** is only a bookmark: a short name (`origin`) for a long address. The `-v` ("verbose") lists each remote with the address used to fetch from it and the one used to push to it — usually the same.

Now she sends her commits:

```bash
git push -u origin main
```

```text
To /home/you/team/server/orbit-sim.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

Read **`git push origin main`** as "send my branch `main` to the remote `origin`". The line `* [new branch] main -> main` says her `main` became a new branch called `main` on the server. The `-u` flag and the last line are about *tracking*, which gets its own section below.

Leo joins by cloning, and sets his name in his copy (on a real team his laptop would already have it):

```bash
cd ~/team/leo
git clone ~/team/server/orbit-sim.git
cd orbit-sim
git config user.name "Leo Park"
git config user.email "leo@example.com"
```

```text
Cloning into 'orbit-sim'...
done.
```

A clone sets up the remote `origin` for you, pointing back where it came from.

## Remote-tracking branches: your notes about the server

Leo asks for every branch, with `-a` for "all":

```bash
git branch -a
```

```text
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
```

He has one branch of his own, `main`. The other two lines are something new. `origin/main` is a **remote-tracking branch**: a pointer in *your* repository that records where `main` was on `origin` the last time you talked to it. It is Git's note to itself, "at the last contact, the server's `main` was here". `origin/HEAD` records which branch the server treats as its default.

You never commit onto `origin/main`. Only talking to the server moves it. And it is only as fresh as your last contact — if a teammate pushes a minute later, your `origin/main` does not know.

How does Git know to keep these notes? The clone wrote this into `.git/config`:

```ini
[remote "origin"]
	url = /home/you/team/server/orbit-sim.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
```

The `fetch` line is a **[[refspec|refspec]]**, a rule for copying pointers. Read it as "for every branch on the server (`refs/heads/*`), keep a copy of its position here under `refs/remotes/origin/*`". The `[branch "main"]` section pairs Leo's `main` with the server's `main`; we will come back to it.

The [[three copies|three-copies-picture]] are easier to keep straight in a picture than in words.

::: key Remote-tracking branches
`origin/main` is a read-only pointer in your repository recording where `main` was on the remote `origin` at your last fetch, pull or push. Fetching moves it; committing never does. It can be out of date the moment someone else pushes.
:::

## `fetch`: download, and change nothing else

Leo adds Earth's oblateness constant $J_2$ to `gravity.py`, commits, and pushes. His clone already knows where `main` goes, so a plain `git push` is enough:

```text
To /home/you/team/server/orbit-sim.git
   3d7a875..a1bc7ad  main -> main
```

Read `3d7a875..a1bc7ad` as "the server's `main` moved from `3d7a875` to `a1bc7ad`".

Now look at Maya's laptop. She asks for the status:

```bash
git status
```

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

"Up to date" — but Leo's commit is on the server! This is the most common surprise in all of Git. `status` never contacts the server. It compares Maya's `main` with her *note* `origin/main`, and that note still says `3d7a875`. The sentence is true about the note and false about the world.

To refresh the note, she runs **`git fetch`**, which downloads any new commits from the remote and moves the remote-tracking branches — and does nothing else:

```bash
git fetch
```

```text
From /home/you/team/server/orbit-sim
   3d7a875..a1bc7ad  main       -> origin/main
```

"The server's `main` moved from `3d7a875` to `a1bc7ad`, and I moved my note `origin/main` to match." Her own `main`, her index and her working files are untouched. Fetch is always safe: it cannot change a line of code you are working on.

::: example Fetch, look, then integrate
**Step 1 — ask status again.** Now the note is fresh:

```text
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
```

"Behind by 1" means `origin/main` has one commit that `main` lacks. "Can be fast-forwarded" means `main` has nothing that `origin/main` lacks, so sliding the pointer forward is all it takes (the fast-forward from the last module).

**Step 2 — list what came in.**

```bash
git log --oneline main..origin/main
```

```text
a1bc7ad Add J2 oblateness constant
```

Read `main..origin/main` ("main dot-dot origin main") as "commits reachable from `origin/main` but not from `main`" — exactly the ones she has not got yet. The [[two-dot notation|two-dot]] note explains the name.

**Step 3 — read the change.**

```bash
git diff main origin/main
```

```diff
diff --git a/gravity.py b/gravity.py
index b9ca471..cb11ffd 100644
--- a/gravity.py
+++ b/gravity.py
@@ -1,5 +1,6 @@
 MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter
 G0 = 9.80665               # m/s^2, standard gravity
+J2 = 1.08262668e-3         # Earth's oblateness coefficient (dimensionless)
 
 
 def accel(r):
```

One added line, a constant with no units — which is right, because $J_2$ is a pure ratio.

**Step 4 — integrate.** A remote-tracking branch can be merged like any branch:

```bash
git merge origin/main
```

```text
Updating 3d7a875..a1bc7ad
Fast-forward
 gravity.py | 1 +
 1 file changed, 1 insertion(+)
```

**Sanity check.** `git status` says `Your branch is up to date with 'origin/main'` again, and this time it is true about the world too: `main`, `origin/main` and the server all point at `a1bc7ad`.
:::

That four-step habit — fetch, look, then merge — is how careful engineers bring in other people's work, especially on a branch that feeds flight builds. You see exactly what is arriving before a single file changes.

::: key fetch vs pull
fetch downloads remote objects and updates remote-tracking refs, changing nothing in your working tree. pull is fetch followed by merge (or rebase with --rebase). Fetch first when you want to look before you integrate.
:::

## `pull`: fetch, then combine

Most of the time you do not need to look first. **`git pull`** does both steps in one: it runs `git fetch`, then merges the fetched branch into the branch you are on. When the merge is a fast-forward, `pull` is exactly what you did by hand above.

The interesting case is when both sides moved. Maya commits an escape-speed helper to `gravity.py` on her `main`. Meanwhile Leo adds a paragraph to the README about the constants' units, and pushes first. Now Maya pushes:

```bash
git push
```

```text
To /home/you/team/server/orbit-sim.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/home/you/team/server/orbit-sim.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
```

The server refused. A push only moves the server's branch if the move is a **fast-forward** — if the server's tip is an ancestor of what you send. Maya's `main` does not contain Leo's README commit, so accepting her push would drop his commit off the end of `main`. The server protects him by saying no. That refusal is a feature, not an error in your work.

She fetches and looks:

```text
$ git status
On branch main
Your branch and 'origin/main' have diverged,
and have 1 and 1 different commits each, respectively.
```

```bash
git log --oneline --graph --all
```

```text
* 8c27620 List the constants' units in the README
| * 08b1813 Add escape speed helper
|/  
* a1bc7ad Add J2 oblateness constant
* 3d7a875 Ignore Python cache folders
```

**[[Diverged|diverged-picture]]** means each side has a commit the other lacks: one each, forking at `a1bc7ad`. Now she tries `git pull` (a few of the hint lines are left out here):

```text
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint: 
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
...
fatal: Need to specify how to reconcile divergent branches.
```

Current Git will not choose for you, because the choice shapes the history everyone reads. There are two ways to combine diverged work.

**Merge (`git pull --no-rebase`).** Fetch, then make a merge commit with two parents, exactly as in the last module:

```text
Merge made by the 'ort' strategy.
 README.md | 4 ++++
 1 file changed, 4 insertions(+)
```

```text
*   51b6bc3 Merge branch 'main' of /home/you/team/server/orbit-sim
|\  
| * 8c27620 List the constants' units in the README
* | 08b1813 Add escape speed helper
|/  
* a1bc7ad Add J2 oblateness constant
```

Nothing is lost, but the history now has a little diamond whose only message is "I happened to pull". Teammates call these **[[merge bubbles|merge-bubble]]**. One is harmless. A team of twenty pulling this way all day makes a log that is hard to read and hard to search.

**Rebase (`git pull --rebase`).** Fetch, then set Maya's own new commit aside, move `main` to the fetched tip, and replay her commit on top of it:

```bash
git pull --rebase
```

```text
Successfully rebased and updated refs/heads/main.
```

```text
* 76ccba1 Add escape speed helper
* 8c27620 List the constants' units in the README
* a1bc7ad Add J2 oblateness constant
* 3d7a875 Ignore Python cache folders
```

A straight line. Her escape-speed commit now sits after Leo's README commit, as if she had written it a minute later. Look at its hash: it was `08b1813` and is now `76ccba1`. A commit's hash covers its parent, and the parent changed, so this is a new commit with the same change and message. The next lesson looks at rebasing in detail and explains when that is fine and when it is dangerous. For a commit nobody else has seen yet — like this one — it is fine.

Her `main` now contains `origin/main`, so the push is a fast-forward and the server accepts it:

```text
To /home/you/team/server/orbit-sim.git
   8c27620..76ccba1  main -> main
```

::: example Choosing the pull once, for good
Typing `--rebase` on every pull is tedious. Many teams agree on this setting for every clone:

```bash
git config --global pull.rebase true
```

Now plain `git pull` fetches and rebases your unpushed commits onto the fetched tip. The alternative `git config --global pull.ff only` makes `pull` refuse anything but a fast-forward; when it refuses, you decide by hand.

**Check the arithmetic of the graph.** Before the pull, Maya's `main` had 7 commits in its history and `origin/main` had 7 too (6 shared plus one each). After `pull --rebase`, `main` has $6 + 1 + 1 = 8$ commits and no merge commit. After `pull --no-rebase` it would have had those same 8 plus 1 merge commit, 9 in all. Same files either way — only the shape of the history differs.
:::

::: warning `pull --rebase` wants a clean working tree
With uncommitted edits, `git pull --rebase` stops before doing anything: `error: cannot pull with rebase: You have unstaged changes.` Commit the edits, or shelve them with `git stash` (lesson 07 of the last module) and `git stash pop` afterwards. The flag `--autostash` does the stash and pop for you — but if the popped changes clash with what came in, you are left resolving a conflict, so know what you have in flight first.
:::

## Upstream tracking: each branch's partner

When Maya ran `git push -u origin main`, Git printed `branch 'main' set up to track 'origin/main'`. That set up her branch's **upstream**: the remote-tracking branch it is paired with. It is stored in `.git/config`, in the `[branch "main"]` section you saw in Leo's clone (`remote = origin`, `merge = refs/heads/main`).

The upstream is what makes the short forms work. Plain `git push`, `git pull` and `git fetch` know where to go because of it, and `git status` knows what to compare with.

A new branch has no upstream until you give it one. Maya starts the drag model on a new branch and commits a first density function:

```bash
git switch -c drag-model
git push
```

```text
fatal: The current branch drag-model has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin drag-model
```

`-u` is the short form of `--set-upstream`:

```bash
git push -u origin drag-model
```

```text
To /home/you/team/server/orbit-sim.git
 * [new branch]      drag-model -> drag-model
branch 'drag-model' set up to track 'origin/drag-model'.
```

You set it once per branch. (The setting [[push.autoSetupRemote|auto-setup]] can do it for you.)

::: example Reading ahead and behind
Maya commits a drag-acceleration function on `drag-model` but does not push it yet. The double-verbose branch list, `git branch -vv`, shows each branch's upstream and how far apart they are:

```bash
git branch -vv
```

```text
* drag-model 249df06 [origin/drag-model: ahead 1] Add drag acceleration
  main       76ccba1 [origin/main] Add escape speed helper
```

`ahead 1`: one commit on `drag-model` that `origin/drag-model` lacks — her unpushed work. `main` shows no count, so it matches its upstream.

The upstream has a short name, **`@{u}`** (read "at-u", for upstream), which saves typing the full name:

```bash
git log --oneline @{u}..
```

```text
249df06 Add drag acceleration
```

`@{u}..` means "reachable from here but not from my upstream" — the commits a push would send. The other way round, `..@{u}`, lists what a pull would bring in.

For the two counts as plain numbers — useful in a script — use `git rev-list --left-right --count A...B`, which prints how many commits only `A` has and how many only `B` has. When Maya's `main` had diverged from `origin/main` it printed `1	1`; the branch list then read `[origin/main: ahead 1, behind 1]`.

**Sanity check.** She pushes, and `git branch -vv` shows `[origin/drag-model]` with no count: `ahead 1` became zero because the server now has the commit.
:::

::: key Upstream tracking
A branch's upstream is the remote-tracking branch it is paired with, set by `git push -u origin <branch>` or automatically when you check out a branch that exists only on the remote. It lets bare `git push` and `git pull` know where to go, and makes `git status` and `git branch -vv` report ahead/behind counts. `@{u}` names it.
:::

::: warning Ahead and behind are counted against your notes
The counts compare your branch with your remote-tracking branch, not with the server. "Behind 0" after a week without fetching means nothing. When the number matters — before a release, before you tell a colleague "I have everything" — run `git fetch` first.
:::

## Branches that come and go

Two more everyday moves.

**Working on a teammate's branch.** After Leo fetches, he sees `origin/drag-model` in `git branch -a`. To work on it he runs `git switch drag-model`. There is no local branch of that name, but Git finds exactly one remote-tracking branch that matches, so it creates `drag-model` from it and sets the upstream in one go:

```text
Switched to a new branch 'drag-model'
branch 'drag-model' set up to track 'origin/drag-model'.
```

**Cleaning up.** When the drag work is finished and merged, Maya deletes the branch on the server with `git push origin --delete drag-model`. Leo's clone still has `origin/drag-model`: a plain fetch never removes notes. **`git fetch --prune`** does — it deletes remote-tracking branches whose branch is gone from the server:

```text
From /home/you/team/server/orbit-sim
 - [deleted]         (none)     -> origin/drag-model
```

Setting `git config --global fetch.prune true` makes every fetch prune. To see the whole picture from the server's side at any time, `git remote show origin` lists the remote's branches, which of yours track which, and whether each is up to date.

## How flight software teams use this

On a spacecraft project the server copy is the **[[single source of truth|source-of-truth]]**: a build is only real if it came from a commit on the server, because only then can anyone else rebuild it. A few habits follow from everything above:

- **Fetch often, and look before merging into anything important.** `git log main..origin/main` takes two seconds and has saved many a release branch.
- **Rebase your own unpushed commits when you pull.** It keeps the shared log a straight, readable line (the next lesson says exactly when this is safe).
- **Treat a rejected push as information.** Someone else's work landed first. Pull, run the tests again — the combination of their change and yours has never been tested — and then push.
- **Never push to get your work "backed up" onto `main`.** Push a branch with `-u` instead; `main` should only receive work that is reviewed and passing.

## Check yourself

::: check
Maya's `git status` says `Your branch is up to date with 'origin/main'`, but Ravi swears he pushed an hour ago. Who is right, and what one command settles it without touching Maya's files?
:::

::: answer
Both can be right. `status` compares `main` with the remote-tracking branch `origin/main`, which only moves when Maya fetches, pulls or pushes. If she has not done any of those in the last hour, her note is stale. `git fetch` downloads Ravi's commit and moves `origin/main`; it does not change her branch, index or working files. After it, `git status` will say she is behind by 1 (or more).
:::

::: check
Right after a `git fetch`, Leo sees `Your branch is behind 'origin/main' by 3 commits, and can be fast-forwarded.` Write the two commands he could use to (a) list those three commits and (b) see their combined change to the code, before integrating.
:::

::: answer
(a) `git log --oneline main..origin/main` lists the commits reachable from `origin/main` but not from `main` — the three he lacks. (b) `git diff main origin/main` shows the combined difference between his branch and the fetched tip. Because his branch has nothing extra, that diff is exactly what the three commits changed. He can then run `git merge origin/main`, which will be a fast-forward.
:::

::: check
Explain in your own words why the server rejected Maya's push with `(fetch first)`, and why `git push` succeeded right after `git pull --rebase`.
:::

::: answer
A push moves the server's branch to your commit only if that is a fast-forward — if the server's current tip is in your commit's history. Maya's `main` (with her escape-speed commit) did not contain Leo's README commit, so moving the server's `main` to her commit would have dropped his commit. After `git pull --rebase`, her `main` was Leo's commit plus her replayed commit on top, so the server's tip `8c27620` was an ancestor of her new tip `76ccba1`: a fast-forward, which the server accepts.
:::

::: check
Ravi creates a branch `atmos-table`, commits twice, and runs `git push`. It fails with `has no upstream branch`. What should he run instead, what does the `-u` part change for later, and what will `git branch -vv` show for `atmos-table` right afterwards?
:::

::: answer
`git push -u origin atmos-table`. It creates `atmos-table` on the server and records `origin/atmos-table` as the branch's upstream in `.git/config`. After that, plain `git push` and `git pull` on this branch know where to go, and `git status` reports ahead and behind counts. Right afterwards `git branch -vv` shows `[origin/atmos-table]` with no count, because both point at the same commit.
:::

::: check
Two teammates both have `pull.rebase true` set. Each made one commit on `main` without pushing, touching different files. Teammate A pushes first. What happens when teammate B runs `git pull` and then `git push`, and how many commits and merge commits does `main` gain on the server in total?
:::

::: answer
B's `git pull` fetches A's commit and replays B's commit on top of it (with a new hash). B's push is then a fast-forward and succeeds. The server's `main` gains exactly two commits — A's and B's rebased one — and no merge commit. The history is a straight line with A's commit first.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Remote | a named address of another copy; `git remote -v` lists them; `origin` by convention |
| Bare repository | a repository with no working tree, used as the shared server copy |
| Remote-tracking branch | `origin/main`: your note of where the server's `main` was at last contact |
| `git fetch` | download commits and move remote-tracking branches; nothing else changes |
| `git pull` | fetch, then merge the upstream into your branch |
| `git pull --rebase` | fetch, then replay your unpushed commits on top of the fetched tip |
| Rejected push | the server only accepts fast-forwards; pull (and test) first |
| Upstream | a branch's partner, set with `git push -u origin <branch>`; short name `@{u}` |
| Ahead / behind | `git branch -vv`; `git log @{u}..` is what you would push |
| Look before merging | `git log main..origin/main` and `git diff main origin/main` |
| Pruning | `git fetch --prune` deletes notes for branches removed on the server |

`pull --rebase` gave a taste of rebasing: commits replayed on a new base, with new hashes. The next lesson puts merge and rebase side by side, shows exactly what each does to the commit graph, and gives the one rule that decides which to use — the golden rule about shared history.

::: context bare-name Why the server copy ends in .git
A normal repository keeps its history in a hidden `.git` folder beside the files you edit. A bare repository *is* only that folder's contents, so by long habit it is named like one: `orbit-sim.git`. Git does not require the ending; it is a signal to people that there is no working tree inside and nobody should try to edit files there. Hosting services store every repository as a bare one, which is why their clone addresses usually end in `.git`.
:::

::: context refspec Reading the refspec out loud
`+refs/heads/*:refs/remotes/origin/*` has a source on the left of the colon and a destination on the right. `refs/heads/*` is every branch on the remote; `refs/remotes/origin/*` is where copies of their positions go in your repository. So the server's `main` becomes your `origin/main`, its `drag-model` becomes your `origin/drag-model`. The leading `+` means "update the copy even if the move is not a fast-forward" — a note should always show the truth, even when someone rewrote the server's branch. You rarely edit this line, but it explains why remote-tracking branches have the names they do.
:::

::: context three-copies-picture Three copies and the notes between them
After Leo's push and before Maya fetches. The server's `main` is at `a1b`. Maya's `main` and her note `origin/main` both still say `3d7`. Fetch moves only the note; merge then moves her branch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="8" y="10" width="160" height="84" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="88" y="27" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">server</text>
  <circle cx="45" cy="60" r="15" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">3d7</text>
  <circle cx="115" cy="60" r="15" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">a1b</text>
  <line x1="100" y1="60" x2="62" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="150" y="44" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="146" y1="48" x2="128" y2="52" stroke="#b4232c" stroke-width="1.5" marker-end="url(#a1)"/>
  <rect x="192" y="10" width="160" height="84" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="272" y="27" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">Leo</text>
  <circle cx="229" cy="60" r="15" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="229" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">3d7</text>
  <circle cx="299" cy="60" r="15" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="299" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">a1b</text>
  <line x1="284" y1="60" x2="246" y2="60" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="290" y="89" font-size="11" text-anchor="middle" fill="#b4232c">main, origin/main</text>
  <rect x="8" y="110" width="344" height="82" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="180" y="127" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">Maya (before fetch)</text>
  <circle cx="120" cy="160" r="15" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">3d7</text>
  <text x="235" y="156" font-size="11" text-anchor="middle" fill="#b4232c">main, origin/main</text>
  <line x1="180" y1="160" x2="138" y2="160" stroke="#b4232c" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="235" y="178" font-size="11" text-anchor="middle" fill="#6c7a93">(no a1b yet: fetch brings it)</text>
</svg>
```

Leo's `origin/main` is fresh because his own push updated it.
:::

::: context two-dot What the two dots mean
`A..B` is not a range of dates or a slice of a list. It is set subtraction on the commit graph: start from `B`, walk back through every parent, collect every commit you reach, then throw away every commit you could also reach from `A`. What is left is "in `B`, not in `A`". So `main..origin/main` is what the server has that you do not, and `origin/main..main` is what you have that the server does not. Swap the ends and you get the other direction — a common slip. Three dots, `A...B`, means the commits in either one but not both, which is why `rev-list --left-right --count main...origin/main` can report both counts at once.
:::

::: context diverged-picture What "ahead 1, behind 1" looks like
Maya's `main` and her fetched `origin/main` share history up to `a1b`. Each then has one commit the other lacks, so she is ahead by one and behind by one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="d1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="75" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">3d7</text>
  <circle cx="115" cy="75" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">a1b</text>
  <line x1="99" y1="75" x2="58" y2="75" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#d1)"/>
  <circle cx="200" cy="35" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">08b</text>
  <circle cx="200" cy="115" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="119" font-size="11" text-anchor="middle" fill="#1f2a44">8c2</text>
  <line x1="185" y1="42" x2="131" y2="68" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#d1)"/>
  <line x1="185" y1="108" x2="131" y2="82" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#d1)"/>
  <rect x="250" y="25" width="100" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="39" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="250" y1="35" x2="220" y2="35" stroke="#b4232c" stroke-width="1.5" marker-end="url(#d1)"/>
  <rect x="250" y="105" width="100" height="20" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="119" font-size="11" text-anchor="middle" fill="#b4232c">origin/main</text>
  <line x1="250" y1="115" x2="220" y2="115" stroke="#b4232c" stroke-width="1.5" marker-end="url(#d1)"/>
  <text x="200" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">ahead 1</text>
  <text x="200" y="90" font-size="11" text-anchor="middle" fill="#6c7a93">behind 1</text>
</svg>
```

`08b` is her escape-speed commit; `8c2` is Leo's README commit. Neither tip is an ancestor of the other, so no fast-forward is possible in either direction.
:::

::: context merge-bubble Where merge bubbles come from
Each `git pull` that has to merge makes a commit titled something like `Merge branch 'main' of <server>`. It records no decision anyone made; it only says two people committed at around the same time. On a busy branch the graph fills with these small diamonds, `git log` becomes a braid, and tools that walk history — `git bisect` from the last module, or someone reading "what changed in this release" — have to step through them. That is why many teams set `pull.rebase true`: your unpushed commits slide onto the fetched tip, and the bubble never forms.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="85" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">pull --no-rebase</text>
  <text x="275" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">pull --rebase</text>
  <line x1="180" y1="8" x2="180" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="75" x2="60" y2="75"/><line x1="60" y1="75" x2="95" y2="45"/><line x1="60" y1="75" x2="95" y2="105"/>
    <line x1="95" y1="45" x2="140" y2="75"/><line x1="95" y1="105" x2="140" y2="75"/>
    <line x1="200" y1="75" x2="315" y2="75"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="60" cy="75" r="10" fill="#8fb8f0"/><circle cx="95" cy="45" r="10" fill="#f2b880"/>
    <circle cx="95" cy="105" r="10" fill="#8fb8f0"/><circle cx="140" cy="75" r="11" fill="#fff"/>
    <circle cx="215" cy="75" r="10" fill="#8fb8f0"/><circle cx="265" cy="75" r="10" fill="#8fb8f0"/>
    <circle cx="315" cy="75" r="10" fill="#f2b880"/>
  </g>
  <text x="140" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">M</text>
  <text x="140" y="105" font-size="11" text-anchor="middle" fill="#6c7a93">bubble</text>
  <text x="265" y="105" font-size="11" text-anchor="middle" fill="#6c7a93">one straight line</text>
</svg>
```

Orange is Maya's own commit; on the right it was replayed after Leo's.
:::

::: context auto-setup Letting Git set the upstream
Since Git 2.37 (2022) you can run `git config --global push.autoSetupRemote true`. Then the first plain `git push` of a new branch behaves like `git push -u origin <branch>`: it creates the branch on the remote and sets the upstream, instead of stopping with "has no upstream branch". The error message you saw even points to this setting. It saves typing but hides a step, so learn the `-u` form first.
:::

::: context source-of-truth One shared copy that counts
In aerospace configuration management, every flight or test build must be traceable to exactly one recorded source version. A laptop is not a record: it can be lost, and nobody else can check what was on it. So teams treat the server repository as the one authority. Build machines fetch from it, test reports quote its commit hashes, and a change that exists only in someone's clone, however good, has not happened yet as far as the project is concerned. Teams working on isolated, disconnected networks keep the same rule; the "server" is a machine inside the secure network.
:::
