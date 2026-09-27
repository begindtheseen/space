---
id: l10-submodules-subtrees-vendoring
title: "Other people's code: submodules, subtrees and vendoring"
minutes: 24
covers:
  - Submodules vs subtrees vs vendoring
---

Leo looks after a small library called `frames`: a handful of functions that build rotation matrices between reference frames. It lives in its own repository, with its own tests and its own version tags, because three projects use it — orbit-sim, the attitude simulator, and a ground-station tool. Now orbit-sim needs `rot_z` to turn Earth-fixed positions into inertial ones. How should the code of one repository get into another?

You could copy the file in and forget where it came from. That works until Leo fixes a sign error in `rot_x` and nobody can say whether orbit-sim has the fix. On a flight program, "which version?" needs a precise answer — the question lesson 08 answered for your own code with tags.

Git offers two built-in answers, **submodules** and **subtrees**, and there is a third answer that uses no special Git feature at all, **vendoring**. This lesson builds all three on orbit-sim, shows where each one bites, and ends with a table for choosing. (If the other code is published as a package — NumPy, say — a **package manager** with pinned versions is usually the right tool instead. These three are for code that is not packaged, or that you must build from source, which is common for C and C++ flight code.)

## Three ways to borrow a book

Picture a school report that needs a chapter from a library book.

- You can write the book's **call number and edition** in your report: "see Library item QA76.9, 3rd printing". Your report stays small, and it points at one exact printing. But every reader has to walk to the library to get it. That is a **submodule**.
- You can **photocopy the chapter** into your report and staple a note on top: "copied from QA76.9, 3rd printing". Now the report is complete by itself, but when a 4th printing fixes a mistake, you have to photocopy again by hand. That is **vendoring**.
- You can photocopy the chapter *and* keep a special stapler that knows how to swap in the pages of a newer printing, or send your corrections back to the author. That is a **subtree**.

All three answer the same question: *which version of the other code are we using?* They differ in where the code lives and who has to do the remembering.

## Submodules: a pointer to another repository's commit

A **submodule** is a Git repository placed inside a folder of another Git repository, the **superproject**, which records *one exact commit* of it. The superproject does not store the library's files. It stores the library's address and a commit hash — the call number and the edition.

### Adding one

Maya adds `frames` under a folder named `extern/`, a common home for outside code:

```bash
git submodule add ../frames.git extern/frames
git commit -m "Add frames library as a submodule at extern/frames"
```

```text
Cloning into '.../orbit-sim/extern/frames'...
done.
[main 33663e7] Add frames library as a submodule at extern/frames
 2 files changed, 4 insertions(+)
 create mode 100644 .gitmodules
 create mode 160000 extern/frames
```

(In the practice run the library was a folder next to orbit-sim, so its address is the relative path `../frames.git`. On a real team it is a URL on your Git server. Long paths in outputs are shortened with `...` in this lesson. A local path also needs one extra setting to be allowed, [[for security reasons|file-protocol]].)

Two things were committed. The first is a new file, **`.gitmodules`**, a small text file that maps each submodule's folder to its address:

```ini
[submodule "extern/frames"]
	path = extern/frames
	url = ../frames.git
```

The second is the interesting one: `create mode 160000 extern/frames`. Look at how the index lists it:

```bash
git ls-files -s
```

```text
100644 a2a520a67fd0649b19d38f1941278eff3fa59fe8 0	.gitmodules
160000 b462cf3405650546c09c8a0c5d52a7867e0abe27 0	extern/frames
100644 97742bcfdb4deb6c5b0bc5d12e02936a2356d44f 0	gravity.py
```

A normal file has mode `100644` and the hash of a blob. `extern/frames` has the special mode **`160000`** and a hash that is not a blob at all — it is a *commit* in the library's repository. Ask the tree that holds it:

```bash
git cat-file -p HEAD:extern
```

```text
160000 commit b462cf3405650546c09c8a0c5d52a7867e0abe27	frames
```

This entry is called a **gitlink**: a tree entry whose type is `commit`, naming a commit that lives in *another* repository ([[picture|gitlink-picture]]). The superproject's history therefore records, for every one of its commits, exactly which library commit went with it. That is what people mean by a submodule being **pinned**: the library cannot drift. Until someone commits a new gitlink, orbit-sim uses `b462cf3` and nothing else.

`git submodule status` shows the pin, with the nearest tag in brackets:

```text
 b462cf3405650546c09c8a0c5d52a7867e0abe27 extern/frames (v0.3.0)
```

::: key What a submodule stores
The superproject stores a **gitlink** — a tree entry with mode `160000` holding one commit hash of the other repository — plus `.gitmodules`, which maps the folder to the repository's URL. It does not store the library's files. The pinned commit changes only when someone commits a new gitlink.
:::

### Cloning a project that has submodules

Ravi clones orbit-sim the usual way, and finds a surprise:

```bash
git clone orbit-sim.git ravi
cd ravi
ls -A extern/frames
git submodule status
```

```text
Cloning into 'ravi'...
done.
-b462cf3405650546c09c8a0c5d52a7867e0abe27 extern/frames
```

`ls -A` printed nothing: the folder is empty. A plain clone makes the folder but does not fetch the library. The **minus sign** in front of the hash in `git submodule status` means "not initialized — not checked out here". Anything that imports `frames` now fails.

He fixes it with one command:

```bash
git submodule update --init
```

```text
Submodule 'extern/frames' (.../frames.git) registered for path 'extern/frames'
Cloning into '.../ravi/extern/frames'...
done.
Submodule path 'extern/frames': checked out 'b462cf3405650546c09c8a0c5d52a7867e0abe27'
```

**`--init`** copies the address from `.gitmodules` into Ravi's local configuration. **`update`** then clones the library if needed and checks out *exactly the pinned commit*. Leo avoids the problem entirely by cloning with **`git clone --recurse-submodules`**, which does the clone and the init-and-update in one go.

Inside the submodule, `git status` says `HEAD detached at b462cf3`. That is normal and on purpose. The superproject asked for a *commit*, not a branch, so the submodule stands on that commit with a detached HEAD — the state you met in the basics module. If you want to make changes inside it, switch to a branch there first, or your commits will be left dangling.

::: warning The second clone step everyone forgets
A plain `git clone` of a project with submodules leaves every submodule folder empty. The build then fails with an error that says nothing about submodules — "No module named frames", or a missing header in C. Clone with `--recurse-submodules`, or run `git submodule update --init` (add `--recursive` if the submodules have submodules of their own). Say so in the README, and make CI do it too.
:::

### Moving the pin to a new version

Leo releases `frames` v0.4.0 with a new `rot_x`. Orbit-sim does not get it automatically — that is the whole point of a pin. Moving the pin is a deliberate commit.

::: example Updating the pinned commit to v0.4.0
Maya goes *into* the submodule, fetches, and checks out the new tag. Then she comes back out and looks at the superproject:

```bash
cd extern/frames
git fetch --tags
git switch --detach v0.4.0
cd ../..
git status
```

```text
From .../frames
   b462cf3..068f791  main       -> origin/main
 * [new tag]         v0.4.0     -> v0.4.0
HEAD is now at 068f791 Add rot_x frame rotation
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   extern/frames (new commits)
```

From the superproject's point of view, a "file" changed: the commit checked out in `extern/frames` no longer matches the gitlink. `git diff` shows the whole change — one line, one hash for another:

```bash
git diff
```

```diff
diff --git a/extern/frames b/extern/frames
index b462cf3..068f791 160000
--- a/extern/frames
+++ b/extern/frames
@@ -1 +1 @@
-Subproject commit b462cf3405650546c09c8a0c5d52a7867e0abe27
+Subproject commit 068f7911b16e992fdf70ad2f08cf049c29dd0c93
```

A friendlier view lists the library commits between the two pins:

```bash
git diff --submodule=log
```

```text
Submodule extern/frames b462cf3..068f791:
  > Add rot_x frame rotation
```

She stages the gitlink like a file and commits:

```bash
git add extern/frames
git commit -m "Update frames to v0.4.0 (adds rot_x)"
```

```text
[main 068dabd] Update frames to v0.4.0 (adds rot_x)
 1 file changed, 1 insertion(+), 1 deletion(-)
```

**Check.** The new pin, `068f791`, is exactly the commit tag `v0.4.0` names in the library, as the `HEAD is now at 068f791` line showed. "1 insertion, 1 deletion" is the one `Subproject commit` line swapped. No file of the library entered orbit-sim's history — only a new 40-character hash.
:::

### The stale submodule trap

Now Ravi pulls Maya's commit:

```bash
git pull
git status
git submodule status
```

```text
Updating 33663e7..068dabd
Fast-forward
 extern/frames | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
...
	modified:   extern/frames (new commits)
...
+b462cf3405650546c09c8a0c5d52a7867e0abe27 extern/frames (v0.3.0)
```

This fools experienced engineers. The pull moved the *gitlink* to `068f791`, but it did not touch the submodule's *working tree*, which still has the old `b462cf3` checked out. The **plus sign** in `git submodule status` means "the checked-out commit does not match the pin". And `git status` calls this "new commits" — though Ravi's submodule is actually *older* than the pin. The message only means "different".

The danger is the next habit move. If Ravi runs `git commit -a` for some unrelated change, he stages the gitlink as it is on his disk — and commits orbit-sim back to v0.3.0, silently undoing Maya's update. The fix is to bring the submodule to the pin:

```bash
git submodule update
```

```text
Submodule path 'extern/frames': checked out '068f7911b16e992fdf70ad2f08cf049c29dd0c93'
```

After that, `git submodule status` shows a space instead of the plus, and `git status` is clean ([[the two things that can disagree|stale-picture]]). To make Git do this on every pull, switch, and checkout, set `git config submodule.recurse true` once, or pull with `git pull --recurse-submodules`.

::: warning Read the first column of `git submodule status`
A space means the checked-out commit matches the pin. A **`-`** means not initialized (run `git submodule update --init`). A **`+`** means the checked-out commit differs from the pin — after a pull, that usually means *you* are behind, not ahead. Run `git submodule update` before committing anything with `-a`.
:::

A few more commands complete the kit. `git submodule update --remote` moves a submodule to the newest commit on its remote branch, which is a quick way to pick up upstream work — followed, as always, by a commit of the new gitlink. `git submodule foreach '<command>'` runs a shell command inside every submodule. And `git rm extern/frames` removes a submodule: it deletes the gitlink and its section of `.gitmodules` in one go (a copy of the library's Git data stays under `.git/modules/` until you delete it).

::: key Submodule vs vendoring
A submodule pins an external repository by commit and keeps its history separate, at the cost of a second clone step everyone forgets. Vendoring copies the source in, making builds hermetic but updates manual. Pick by how often the dependency changes.
:::

## Subtrees: the library's files, inside your history

A **subtree** puts the library's actual files into a folder of your repository, as ordinary tracked files, *and* remembers which library commit they came from, so you can pull newer versions later and even push local fixes back. Nobody who clones orbit-sim needs to know it happened: a plain clone gets everything.

The tool is **`git subtree`**. It is not part of Git's core: it lives in Git's **[[contrib|contrib-folder]]** area, so whether you have it depends on how your Git was packaged. Check with:

```bash
git subtree -h
```

```text
usage: git subtree add   --prefix=<prefix> <commit>
   or: git subtree add   --prefix=<prefix> <repository> <ref>
   or: git subtree merge --prefix=<prefix> <commit>
   or: git subtree split --prefix=<prefix> [<commit>]
   or: git subtree pull  --prefix=<prefix> <repository> <ref>
...
```

On the Ubuntu machine used for this lesson it came with the ordinary `git` package. If you get `'subtree' is not a git command`, look for a separate package (some Linux distributions call it `git-subtree`), or put the shell script from `contrib/subtree` in Git's source code on your `PATH`. Only whoever *updates* the subtree needs the tool.

::: example Adding and updating frames as a subtree
In a copy of orbit-sim without the submodule, Maya adds the library at v0.3.0:

```bash
git subtree add --prefix=extern/frames ../frames.git v0.3.0 --squash
```

```text
git fetch ../frames.git v0.3.0
From ../frames
 * tag               v0.3.0     -> FETCH_HEAD
Added dir 'extern/frames'
```

**`--prefix`** names the folder. **`--squash`** means "bring the library's files as one commit, not its entire history" — usually what you want, or every commit Leo ever made would appear in orbit-sim's log. The history now [[looks like this|squash-picture]]:

```text
*   a8c68ef Merge commit '50f9b36c31441e9d28ee2f0b1005f3afad9f8388' as 'extern/frames'
|\
| * 50f9b36 Squashed 'extern/frames/' content from commit b462cf3
* 470820c Add gravity model
```

And the index holds a plain file, mode `100644`, not a gitlink:

```text
100644 5b475d79b40f16035ee8683cc94bc584f5f3ac4d 0	extern/frames/frames.py
100644 97742bcfdb4deb6c5b0bc5d12e02936a2356d44f 0	gravity.py
```

Where does the "which version" record live? In the squash commit's message. `git log -1 --format=%B 50f9b36` shows:

```text
Squashed 'extern/frames/' content from commit b462cf3

git-subtree-dir: extern/frames
git-subtree-split: b462cf3405650546c09c8a0c5d52a7867e0abe27
```

Those two trailer lines are how `git subtree` finds its place next time. To move to v0.4.0:

```bash
git subtree pull --prefix=extern/frames ../frames.git v0.4.0 --squash \
    -m "Update frames to v0.4.0 (adds rot_x)"
```

```text
From ../frames
 * tag               v0.4.0     -> FETCH_HEAD
Merge made by the 'ort' strategy.
 extern/frames/frames.py | 6 ++++++
 1 file changed, 6 insertions(+)
```

**Check.** The library's v0.4.0 added the six-line `rot_x` function (a blank line pair, the `def`, a docstring and two lines of body), and exactly six insertions arrived in `extern/frames/frames.py`. Counting `def rot` lines in the file now gives 2: `rot_z` and `rot_x`.
:::

Because the files are ordinary files, anyone can edit them in orbit-sim — convenient, and dangerous: a local fix makes orbit-sim's copy differ from every released `frames`. `git subtree push` can send such a fix back as a branch of the library's repository — Maya fixed a docstring and ran `git subtree push --prefix=extern/frames ../frames.git fix/rot-x-doc`, which created that branch upstream with her one commit on top of `068f791`, for Leo to review. The discipline is the same as a backport: changes to shared code go to the library first.

::: warning Subtree mistakes are quiet
A subtree has no pin you can see in `git status`. If someone edits `extern/frames/` and never sends the change upstream, the next `git subtree pull` may conflict, and until then nobody may notice orbit-sim is running a private variant. Keep local edits rare, commit them separately from other work, and send them upstream.
:::

## Vendoring: copy the files and write down where they came from

**Vendoring** is the simplest of the three: copy a released version of the library's files into your repository — commonly a folder called `third_party/` or `vendor/` — and commit them like your own. Git has no idea they came from somewhere else, so you write down [[where they came from|sbom]] yourself.

::: example Vendoring frames v0.4.0
`git archive` writes the files of one commit, without any `.git` data, as an archive; `tar -x` unpacks it into the folder:

```bash
mkdir -p third_party/frames
git --git-dir=../frames.git archive v0.4.0 | tar -x -C third_party/frames
git --git-dir=../frames.git rev-parse v0.4.0^{commit}
```

```text
068f7911b16e992fdf70ad2f08cf049c29dd0c93
```

The last command prints the full hash of the commit the tag names (`^{commit}` means "follow the tag to its commit"). Maya records it in a small text file beside the code:

```text
name:    frames
source:  https://git.example.com/gnc/frames.git
version: v0.4.0
commit:  068f7911b16e992fdf70ad2f08cf049c29dd0c93
local changes: none
```

```bash
git add third_party
git commit -m "Vendor frames v0.4.0 into third_party/frames"
```

```text
[main 8cb5650] Vendor frames v0.4.0 into third_party/frames
 2 files changed, 19 insertions(+)
 create mode 100644 third_party/frames/VENDORED
 create mode 100644 third_party/frames/frames.py
```

**Check.** Two files: the library's `frames.py` (14 lines at v0.4.0) and the 5-line `VENDORED` record, 19 insertions in all. The commit hash in the record matches the gitlink Maya committed in the submodule example — the same version, pinned by hand instead of by Git.
:::

Vendoring's strengths are all about the build. A clone is complete, with no second step, and the build needs no network or other server, which makes it **[[hermetic|hermetic-builds]]**: the same commit always builds from the same bytes. Auditors can read every line that goes into the flight build in one repository.

The cost is updates. To move to v0.5.0, someone repeats the copy, updates the record, and reviews the whole diff. If anyone patched the vendored copy locally, that patch must be listed under `local changes` and reapplied by hand, or it silently disappears at the next update. Vendoring is excellent for a dependency that changes twice a year and painful for one that changes twice a week.

## Choosing

| | Submodule | Subtree | Vendoring |
| --- | --- | --- | --- |
| What your repository stores | a gitlink (one commit hash) + `.gitmodules` | the library's files, plus squash commits | the library's files |
| Version record | the gitlink, exact and automatic | `git-subtree-split:` line in a commit message | a file you write by hand |
| Plain `git clone` gets the code? | no — needs `--recurse-submodules` or `update --init` | yes | yes |
| Library history | kept separate, in its own repository | squashed (or copied in full) | none |
| Updating | move pin inside the submodule, commit the gitlink | `git subtree pull` | copy again, edit the record |
| Sending fixes upstream | commit inside the submodule, push there | `git subtree push` | by hand, as a patch |
| Everyday trap | forgetting the second clone step; stale checkouts after pull | untracked local edits | forgotten local patches, stale copies |
| Fits | a dependency that changes often and that you also develop | a dependency you want invisible to most of the team | a stable dependency; hermetic, auditable builds |

The rule of thumb: **pick by how often the dependency changes**. For `frames`, which changes every few weeks and which orbit-sim developers sometimes fix, a submodule fits — with `submodule.recurse` set and CI cloning recursively. For a library released once a year and never edited, vendoring is simpler and safer. A subtree sits between: a normal clone for everyone, updates in one command.

## Check yourself

::: check Read the index
`git ls-files -s` in a repository prints `160000 4be1d0c… 0	libs/ekf`. What is `libs/ekf`, what does `4be1d0c…` name, and where would you look to find out where it is fetched from?
:::

::: answer
Mode `160000` marks a gitlink, so `libs/ekf` is a submodule, not a file or folder of this repository. `4be1d0c…` is a *commit* hash in the submodule's own repository — the pinned version. The address is in `.gitmodules`, in the `[submodule "libs/ekf"]` section's `url` line (and, once initialized, in the local `.git/config`).
:::

::: check The build that cannot find `frames`
A new intern clones orbit-sim and runs the tests. They fail with `ModuleNotFoundError: No module named 'frames'`. `git submodule status` prints a line starting with `-`. What happened, and what one command fixes it?
:::

::: answer
The intern cloned without `--recurse-submodules`, so the submodule folder exists but is empty; the leading `-` means "not initialized". Running `git submodule update --init` (with `--recursive` if needed) registers the submodule, clones it, and checks out the pinned commit. Next time, `git clone --recurse-submodules`.
:::

::: check Ahead or behind?
After `git pull`, `git status` shows `modified: extern/frames (new commits)` and `git submodule status` starts with `+`. Your colleague says "you have new commits in the submodule, commit them". Is that right? What do you check, and what do you run?
:::

::: answer
Not necessarily. The `+` only means the checked-out commit differs from the pinned one. Right after a pull that moved the pin, it usually means your submodule is *behind* — the pull updated the gitlink but not the submodule's working tree. Check with `git diff --submodule=log`: `<` lines are commits you have checked out that the new pin lacks, and `>` lines are commits the pin has that you do not. If you did not deliberately work inside the submodule, run `git submodule update`. Committing it as it stands would move the pin back to the old version.
:::

::: check Choose for each
Pick submodule, subtree or vendoring for each, and give one reason: (a) a coordinate-conversion library, released twice a year by another agency, never modified by your team, going into a flight build that must be audited; (b) your team's own estimation library, changed weekly by two engineers who also work on the simulator that uses it; (c) a plotting helper most of the team never touches, where you want a plain clone to work for everyone but one person pulls updates now and then.
:::

::: answer
(a) Vendoring: it changes rarely, you never edit it, and a hermetic, self-contained repository is exactly what an audit wants; record the version and commit in a file beside it. (b) Submodule: it changes often and you develop it too, so an exact pin in the simulator plus a separate repository with its own history and reviews fits; set `submodule.recurse` and clone recursively in CI. (c) Subtree: everyone gets the files from a plain clone, and the one person who updates it uses `git subtree pull --squash`.
:::

::: check Where is the version?
For each method, say where you would look to find exactly which commit of `frames` orbit-sim's `HEAD` uses.
:::

::: answer
Submodule: the gitlink in the tree, shown by `git ls-files -s extern/frames`, `git submodule status`, or `git cat-file -p HEAD:extern`. Subtree: the most recent `git-subtree-split:` trailer in the history of the prefix folder, for example with `git log -1 --grep=git-subtree-dir -- extern/frames`. Vendoring: only the record file the team wrote, such as `third_party/frames/VENDORED` — Git itself knows nothing.
:::

## Summary

| Command or idea | Meaning |
| --- | --- |
| submodule | another repository inside a folder, pinned to one commit |
| superproject | the repository that contains the submodule |
| gitlink | tree entry with mode `160000` whose hash is a commit of the other repository |
| `.gitmodules` | committed file mapping each submodule path to its URL |
| `git submodule add <url> <path>` | clone the library there and stage the gitlink and `.gitmodules` |
| `git clone --recurse-submodules` | clone and check out every submodule at its pinned commit |
| `git submodule update --init` | after a plain clone: register, clone, and check out the pin |
| `git submodule update` | move each submodule's checkout to the pinned commit |
| `git submodule status` | ` ` matches pin, `-` not initialized, `+` checkout differs from pin |
| `submodule.recurse true` | make pull, switch and checkout update submodules too |
| subtree | the library's files copied into a folder, with `git-subtree-*` trailers recording the source commit |
| `git subtree add/pull --prefix=<dir> <repo> <ref> --squash` | bring in or update a subtree as one squashed commit |
| `git subtree push --prefix=<dir> <repo> <branch>` | send local changes to the library as a branch |
| vendoring | copying released files in; version written in a record file by hand |
| hermetic build | builds from the repository alone, the same bytes every time |

All three methods deal with text code that Git can diff and merge. The last lesson of this module deals with files Git *cannot* merge at all — Simulink models and CAD parts — and the locking workflow that keeps two engineers from editing the same one at once.

::: context file-protocol Why local paths need permission
In 2022 a security flaw was found in how Git cloned submodules from local folders: a booby-trapped repository could use a local-path submodule to reach files it should not. Git 2.38.1 closed it by changing the default of a setting named `protocol.file.allow` so that submodules may no longer be fetched from local paths unless you say so. For practice repositories on one machine, running Git with `-c protocol.file.allow=always` allows it for that command. Real projects use `https://` or `ssh://` URLs, which are not affected.
:::

::: context gitlink-picture A tree entry that points out of the repository
Every other tree entry points at an object inside the same repository: a blob for a file, a tree for a folder. A gitlink points at a commit that is *not* in this repository's object database. Git does not follow it on its own. The submodule commands read the address from `.gitmodules`, fetch the other repository into the folder, and check out the named commit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="170" height="174" rx="8" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="16" y="26" font-size="11" fill="#6c7a93">orbit-sim repository</text>
  <rect x="20" y="40" width="146" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="93" y="57" font-size="11" text-anchor="middle" fill="#1f2a44">tree: extern/</text>
  <rect x="20" y="98" width="146" height="40" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="93" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">160000 commit</text>
  <text x="93" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">b462cf3  frames</text>
  <line x1="93" y1="66" x2="93" y2="96" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ga)"/>
  <text x="93" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">the gitlink</text>
  <rect x="200" y="8" width="152" height="174" rx="8" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="208" y="26" font-size="11" fill="#6c7a93">frames repository</text>
  <text x="240" y="96" font-size="11" text-anchor="middle" fill="#1d6fd1">v0.3.0</text>
  <circle cx="240" cy="118" r="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="240" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">b462cf3</text>
  <text x="310" y="96" font-size="11" text-anchor="middle" fill="#1d6fd1">v0.4.0</text>
  <circle cx="310" cy="118" r="14" fill="#fff" stroke="#1f2a44"/>
  <text x="310" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">068f791</text>
  <line x1="296" y1="118" x2="256" y2="118" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ga)"/>
  <line x1="168" y1="118" x2="224" y2="118" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#ga)"/>
</svg>
```
:::

::: context stale-picture Two records that can disagree
A submodule has two separate states in your clone. The **pin** is the gitlink in the superproject's commit — what the project says it uses. The **checkout** is the commit actually sitting in the submodule folder on your disk. `git pull` updates the pin; only `git submodule update` (or `submodule.recurse`) moves the checkout. The first column of `git submodule status` compares the two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" font-weight="bold" fill="#1f2a44">after git pull</text>
  <rect x="10" y="34" width="150" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">pin (gitlink)</text>
  <text x="85" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">068f791  v0.4.0</text>
  <rect x="200" y="34" width="150" height="40" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="275" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">checkout on disk</text>
  <text x="275" y="66" font-size="11" text-anchor="middle" fill="#b4232c">b462cf3  v0.3.0</text>
  <text x="180" y="58" font-size="14" text-anchor="middle" fill="#b4232c">≠</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">status column:  +  (they differ)</text>
  <text x="10" y="120" font-size="11" fill="#1f2a44">git submodule update  →  checkout becomes 068f791</text>
  <text x="10" y="140" font-size="11" fill="#6c7a93">then the column shows a space: they match</text>
</svg>
```
:::

::: context contrib-folder What "contrib" means
Git's source code has a folder named `contrib/`, short for "contributed": useful tools written by the community that ship alongside Git but are not part of its core and are not held to exactly the same rules. Packagers decide for themselves whether to include each one, which is why `git subtree` is present on one machine and missing on the next. Shell completion scripts for Bash and Zsh live in the same folder.
:::

::: context squash-picture What --squash leaves in the graph
Each `git subtree add` or `pull` with `--squash` makes two commits: a squash commit holding the library's files at one version (with no link to Leo's real history), and a merge commit that joins it into your branch under the prefix folder. The squash commits form their own little chain, one per version you pulled.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="sq" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="8" y="44" font-size="11" fill="#1f2a44">main</text>
  <circle cx="70" cy="40" r="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="180" cy="40" r="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="290" cy="40" r="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">470820c</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">a8c68ef</text>
  <text x="290" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">44acefb</text>
  <circle cx="130" cy="105" r="12" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="240" cy="105" r="12" fill="#f2b880" stroke="#1f2a44"/>
  <text x="130" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">50f9b36 (v0.3.0)</text>
  <text x="250" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">a09ebba (v0.4.0)</text>
  <line x1="168" y1="40" x2="84" y2="40" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sq)"/>
  <line x1="278" y1="40" x2="194" y2="40" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sq)"/>
  <line x1="172" y1="50" x2="140" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sq)"/>
  <line x1="282" y1="50" x2="250" y2="95" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sq)"/>
  <line x1="226" y1="105" x2="144" y2="105" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sq)"/>
  <text x="330" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">squash</text>
  <text x="330" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">commits</text>
</svg>
```
:::

::: context sbom Knowing every ingredient
Whichever method you choose, safety- and security-critical projects increasingly have to publish a **software bill of materials** (SBOM): a list of every outside component in a build, with its exact version and source, like the ingredient list on a food label. When a flaw is announced in some library, a team with an SBOM can answer "are we affected?" in minutes. A gitlink, a `git-subtree-split` line and a `VENDORED` record are all raw material for that list — which is why "copy it in and forget" is never acceptable.
:::

::: context hermetic-builds Sealed like a jar
**Hermetic** means airtight. The word comes from the old alchemists' "seal of Hermes", a glass tube melted shut. A hermetic build is sealed off from the outside world: it uses only what is in the repository (and a fixed toolchain), never downloads anything, and so produces the same result today, next year, and on a machine with no network. Flight software teams value this because a build that quietly fetched a different library version on the day of the flight build is exactly the kind of surprise a review cannot catch.
:::
