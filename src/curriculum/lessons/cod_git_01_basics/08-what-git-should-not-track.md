---
id: l08-what-git-should-not-track
title: "What Git should not track: .gitignore, .gitattributes and LFS"
minutes: 23
covers:
  - .gitignore, .gitattributes, Git LFS for large binary artefacts
---

Run orbit-sim a few times and look at the project folder. Python has left a `__pycache__` folder of compiled bytecode. The build step has made a `build/` folder. Every simulation run has written a CSV file into `out/`. There are log files. And someone has put a file called `.env` with an access token in it right at the top. `git status` lists all of it as untracked, and one careless `git add .` would commit the lot — including the secret.

This lesson is about the files around your code. Some should never enter the repository at all: that is **`.gitignore`**. Some should enter, but Git must treat them in a special way — never merge them as text, fix their line endings, or keep them off to the side because they are huge: that is **`.gitattributes`**, and for the huge ones, **Git LFS**. Aerospace repositories are unusually full of such files: Simulink models, CAD parts, recorded telemetry, reference datasets. Getting these three files right is what keeps a flight-software repository fast to clone and safe to merge.

## Which files belong in a repository

A good rule of thumb: **commit what a person wrote; do not commit what a machine can remake.**

- **Source** — code, tests, configuration, documentation — is written by people and cannot be regenerated. It belongs in Git.
- **Build products** — compiled bytecode, object files, executables — come out of a command. Anyone with the source can rebuild them, and they change every time you build, so committing them fills history with noise.
- **Run output** — logs, simulation results, plots — is also regenerated, and usually large.
- **Personal files** — your editor's settings folder, your operating system's thumbnail files — belong to you, not the project.
- **Secrets** — passwords, tokens, private keys — must never be committed. A commit is forever: even if you delete the file in the next commit, the old snapshot still contains it, in every clone.

The first four are clutter. The last one is a **[[security incident|leaked-secrets]]**. Both are why every serious repository has a `.gitignore`.

## `.gitignore`: a list of names Git should not see

A **`.gitignore`** file is a plain text file of **patterns**, one per line, that name files Git should treat as invisible when they are untracked. It lives in the repository (usually at the top) and is committed, so the whole team shares it. Picture a sign on a storeroom door: "Do not inventory the boxes in here."

Here is the one for orbit-sim:

```text
# Python bytecode, rebuilt on every run
__pycache__/
*.pyc

# Build products
/build/

# Simulation output: ignore everything in out/ except the README-style note
out/*
!out/keep.md

# Logs
*.log

# Secrets never go in a repository
.env
```

### Reading the patterns

The patterns use the same **[[glob|glob-patterns]]** wildcards as the shell (you met them in the shell module), plus a few rules of their own:

- A line starting with **`#`** is a comment. Blank lines are ignored.
- **`*`** matches any run of characters except `/`. So `*.log` matches `sim.log` and `debug.log`, in any folder.
- A pattern **ending in `/`** matches only folders. `__pycache__/` ignores every folder with that name, and everything inside it.
- A pattern **starting with `/`** is anchored to the folder holding the `.gitignore`. `/build/` ignores the top-level `build` folder but not `docs/build/`. A `/` in the *middle* anchors a pattern too: `out/*` means the top-level `out`. Only a pattern with no `/` except a trailing one, like `*.log` or `__pycache__/`, matches at any depth.
- **`**`** matches any number of folders: `data/**/raw/` means a `raw` folder anywhere under `data`.
- A line starting with **`!`** is a **negation**: it un-ignores something an earlier line ignored. Later lines win over earlier ones.

### Checking what the rules do

Before the `.gitignore`, `git status -s -uall` (the `-uall` lists every untracked file, not only folder names) showed nine untracked paths. After it:

```bash
git status -s -uall
```

```text
?? .gitignore
?? data/golden_pass_0417.bin
?? out/keep.md
```

Only three things are left: the `.gitignore` itself (which you do want to commit), a data file we deal with later in this lesson, and the note we deliberately un-ignored.

When a file is ignored and you do not know why, ask Git. **`git check-ignore -v`** prints the file, line number and pattern that matched:

```bash
git check-ignore -v out/run_0001.csv sim.log build/sim.o .env
```

```text
.gitignore:9:out/*	out/run_0001.csv
.gitignore:13:*.log	sim.log
.gitignore:6:/build/	build/sim.o
.gitignore:16:.env	.env
```

Read the first line as: "the pattern `out/*` on line 9 of `.gitignore` matches `out/run_0001.csv`". Line 9 counts the comments and blank lines too, exactly as your editor numbers them.

::: example Why `out/*` and not `out/`
We want to ignore every run file in `out/` but keep `out/keep.md`. The obvious attempt is:

```text
out/
!out/keep.md
```

Try it, and `git status -s -uall` no longer lists `out/keep.md` at all. Ask why:

```bash
git check-ignore -v out/keep.md
```

```text
.gitignore:9:out/	out/keep.md
```

The rule `out/` ignored the *folder*. When a folder is ignored, Git does not even look inside it, so it never reaches the `!out/keep.md` line — you cannot un-ignore a file whose parent folder is ignored.

The fix is `out/*`: "ignore everything *inside* `out`". Now Git does look in the folder, sees each file, and the negation can rescue `keep.md`. With the fixed rules, `git check-ignore -v out/keep.md` reports the rescuing line, `.gitignore:10:!out/keep.md`, and `git status` lists `out/keep.md` as untracked, ready to add. **Check:** two ways of writing "ignore out", two different behaviours, and `check-ignore -v` told us which line did it both times.
:::

::: warning `.gitignore` does nothing to files Git already tracks
Ignore rules apply only to **untracked** files. If `sim.log` was committed before anyone wrote `*.log`, Git keeps tracking it, and every run shows ` M sim.log` in `git status`. To stop tracking it without deleting your copy, remove it from the index only:

```bash
git rm --cached sim.log
git commit -m "Stop tracking sim.log"
```

`--cached` means "[[from the index|cached-name]], not the working tree" — the file stays on your disk and is now ignored. It stays in *old* commits, though. For a secret, that is not enough: treat the secret as leaked and change it.
:::

### Three places to put ignore rules

- **`.gitignore`** in the repository — rules for everybody on the project. Committed.
- **`.git/info/exclude`** — same format, but inside `.git`, so it is never committed. Use it for a file only you create in this project.
- **A global ignore file**, named with `git config --global core.excludesFile ~/.gitignore_global` — rules for every repository on your machine, like your editor's backup files. Your editor's junk is your business, not the project's.

::: key `.gitignore` in brief
Patterns for untracked files Git should not see: `*.log` (any depth), `build/` (folders only), `/build/` (top level only), `**/` (any depth of folders), `!pattern` (un-ignore; later lines win). A file inside an ignored folder cannot be un-ignored — ignore `dir/*` instead. Ignoring never affects files already tracked: `git rm --cached` them. `git check-ignore -v path` says which rule matched.
:::

## `.gitattributes`: how Git should treat the files it does track

`.gitignore` answers "should Git see this file?". **`.gitattributes`** answers a different question: "for a file Git *does* track, how should it behave?". Think of luggage tags at an airport. Every bag gets on the plane, but some tags say FRAGILE, some say HEAVY, and those bags get handled differently.

A `.gitattributes` file is a list of lines, each a path pattern (same syntax as `.gitignore`) followed by **attributes**. An attribute can be **set** (`text`), **unset** with a minus sign (`-text`), or given a value (`eol=lf`). Here is one for orbit-sim:

```text
# Let Git decide text vs binary, and store text with LF line endings
* text=auto

# Shell scripts must keep LF even on Windows checkouts
*.sh text eol=lf

# Simulink models and CAD parts: never diff or merge as text
*.slx binary
*.SLDPRT binary

# Large recorded telemetry goes through Git LFS
*.bin filter=lfs diff=lfs merge=lfs -text
```

`git check-attr -a` shows what applies to a path — a quick way to check your rules:

```bash
git check-attr -a gravity.py run.sh models/attitude.slx data/golden_pass_0417.bin
```

```text
gravity.py: text: auto
run.sh: text: set
run.sh: eol: lf
models/attitude.slx: binary: set
models/attitude.slx: diff: unset
models/attitude.slx: merge: unset
models/attitude.slx: text: unset
data/golden_pass_0417.bin: diff: lfs
data/golden_pass_0417.bin: merge: lfs
data/golden_pass_0417.bin: text: unset
data/golden_pass_0417.bin: filter: lfs
```

Notice what `binary` really is: a shorthand that turns off three things at once — `diff`, `merge` and `text`. Let us take the attributes one at a time.

### `text` and `eol`: line endings

Every line of a text file ends with an invisible **[[line-ending|line-endings]]** character. Linux and macOS use one byte, LF ("line feed"). Windows traditionally uses two, CR LF ("carriage return, line feed"). If half a team is on Windows, a file can flip between the two on every commit, and `git diff` shows every single line as changed.

- **`text`** marks a file as text. Git stores it in the repository with LF endings (this is **normalisation**) and may convert to the local style when writing it into your working tree.
- **`text=auto`** lets Git guess which files are text; binary-looking files are left alone.
- **`eol=lf`** (or `eol=crlf`) forces the ending in the working tree, whatever the machine. Shell scripts need `eol=lf`: a script saved with CR LF fails on Linux with a baffling "bad interpreter" error, because the first line then asks for a program named `/bin/sh` followed by an invisible carriage return.

### `diff` and `merge`: what Git may do with a file's contents

- **`-diff`** means "do not show a line-by-line diff". `git diff` prints a one-line notice instead.
- **`-merge`** means "do not try to combine two versions line by line". When both sides changed the file, Git keeps your version and declares a conflict for you to resolve by choosing.
- **`diff=name`** and **`merge=name`** hand the job to a named **driver**, a program you configure — for example, one that unzips a model file and diffs the XML inside it.

::: example A Simulink model two people edited
A Simulink `.slx` model is a zip archive of XML files. Change one gain in the diagram and the saved file is scrambled from top to bottom, because compression reshuffles everything after the change. A text merge of two such files would produce garbage that Simulink cannot open.

In a test repository with `*.slx binary` in `.gitattributes`, Maya changes the attitude controller's gain `Kp` from 0.80 to 0.70 on `main`, while Ravi changes it to 0.95 on a branch. Diffing Maya's commit:

```bash
git diff HEAD~1 -- attitude.slx
```

```text
diff --git a/attitude.slx b/attitude.slx
index 19635ba..079106a 100644
Binary files a/attitude.slx and b/attitude.slx differ
```

Then merging Ravi's branch:

```bash
git merge ravi-gains
```

```text
warning: Cannot merge binary files: attitude.slx (HEAD vs. ravi-gains)
Auto-merging attitude.slx
CONFLICT (content): Merge conflict in attitude.slx
Automatic merge failed; fix conflicts and then commit the result.
```

There are no conflict markers to edit. Git has left Maya's file in place and stopped. The only resolution is to pick one whole file — `git checkout --theirs attitude.slx` takes Ravi's, `--ours` keeps Maya's — then `git add` and commit. If both gain changes were needed, someone has to open Simulink and redo one of them by hand.

**Check the result.** After taking Ravi's side and committing, the model inside the zip reads `Value="0.95"`: Ravi's gain, whole and valid. Maya's 0.70 is gone from the tip. Nothing was blended.
:::

This is why aerospace teams do not *resolve* concurrent edits to model files; they *prevent* them. A model or a CAD part cannot be three-way merged — the "two sides plus common ancestor" merge of lesson 05 has nothing meaningful to work line by line — so only one person may edit it at a time. Teams mark such files **binary** and **lockable** (the LFS locking feature below), assign each model an owner, and compare versions with the modelling tool's own [[comparison tool|model-comparison]] rather than with `git diff`.

::: key What `.gitattributes` controls that `.gitignore` does not
Per-path behaviour for tracked files: text vs binary, end-of-line normalisation, diff and merge drivers, and which paths go through Git LFS. It is how teams stop Git from trying to text-merge a Simulink .slx or a CAD part file.
:::

::: warning Adding `text` rules to an old repository
If you add `* text=auto` to a repository that already has CR LF files committed, the next commit touching them may show every line changed. Do it in one dedicated commit: add the `.gitattributes`, run `git add --renormalize .`, and commit with a message saying so. Then the noise lives in one commit that everyone understands, instead of leaking into the next real change.
:::

## Git LFS: keeping giant files beside the repository

Lesson 01 showed that Git stores a *complete* new blob every time a file changes. For a code file of a few kilobytes that costs nothing. For a 10 MB file of recorded telemetry, it costs 10 MB per version, forever, in every clone.

::: example How fast a binary bloats a repository
In a test repository, a 10,000,000-byte file of **[[golden telemetry|golden-telemetry]]** was replaced and committed five times. Each version was completely different, as a re-exported binary usually is. Git's own accounting after packing:

```bash
git count-objects -vH
```

```text
count: 0
size: 0 bytes
in-pack: 15
packs: 1
size-pack: 47.70 MiB
...
```

**Work it out.** Five versions of 10,000,000 bytes is 50,000,000 bytes. Git reports sizes in **[[MiB|mebibytes]]** (mebibytes, where 1 MiB is $2^{20} = 1{,}048{,}576$ bytes), and

$$
\frac{50{,}000{,}000}{1{,}048{,}576} \approx 47.7\ \text{MiB},
$$

which matches `size-pack` almost exactly. Compression saved nothing: random-looking data does not compress, and delta compression (lesson 01's packfile trick) finds no shared pieces between unrelated versions. The 15 objects are 5 blobs, 5 trees and 5 commits.

**What it means.** Anyone who clones this repository downloads all 47.7 MiB, although the working tree needs only the newest 10 MB. Keep that file changing weekly for a year and the repository passes 500 MB for one file.
:::

**Git LFS** ("Large File Storage") is an extension to Git that fixes this. The idea: the repository stores a tiny **pointer file** in place of the big file, and the real content — the **payload** — lives on a separate LFS server. When you check out a commit, LFS downloads only the payloads that commit needs.

The pointer is a short text file. For the 10 MB telemetry file above it would be these three lines, 133 bytes in all:

```text
version https://git-lfs.github.com/spec/v1
oid sha256:e7cbd89274067399dc2df3b891d067c35c5958534733d63608203c06bf82c0b0
size 10000000
```

`oid` ("object id") is the SHA-256 fingerprint of the payload, and `size` its length in bytes. Git versions the pointer like any small text file; five versions of it cost Git about $5 \times 133 = 665$ bytes of content instead of 50 MB.

### How LFS hooks into Git

LFS is a separate program, `git-lfs`, installed once per machine. Then, in a repository:

```bash
git lfs install            # once per machine: set up LFS's hooks and filter
git lfs track "*.bin"      # adds a line to .gitattributes
git add .gitattributes data/golden_pass_0417.bin
git commit -m "Store golden telemetry in LFS"
```

`git lfs track` writes exactly the line you saw earlier: `*.bin filter=lfs diff=lfs merge=lfs -text`. That line is the whole connection. **`filter=lfs`** runs every matching file through LFS's **[[clean and smudge filters|clean-smudge]]**: on `git add` the file is swapped for its pointer (and the payload queued for upload), and on checkout the pointer is swapped back for the real file. **`-text`** stops line-ending conversion from corrupting the payload.

Two more features matter for engineering teams:

- **Locking.** Mark a pattern lockable (`git lfs track --lockable "*.slx"` adds a `lockable` attribute), and Git checks those files out **read-only**. To edit one you run `git lfs lock models/attitude.slx`, the LFS server records that you hold the lock, and anyone else who tries is refused until you `git lfs unlock`. That is "prevent, don't resolve" enforced by the server.
- **Selective download.** A laptop that only runs unit tests can skip gigabytes of payloads it does not need.

LFS is not magic. It needs a server that speaks LFS (the major Git hosting services do, usually with storage quotas), and a clone made without `git-lfs` installed contains only pointer files — the simulation reading `golden_pass_0417.bin` will then see 133 bytes of text instead of telemetry.

::: key Why Git LFS is relevant in aerospace repositories
Simulink models, CAD parts, golden telemetry files and reference datasets are large binaries that Git stores as whole new objects on every change, bloating clones. LFS keeps a pointer in the repository and the payload on a separate server.
:::

::: warning Moving a big file to LFS does not shrink old history
Tracking `*.bin` with LFS affects commits from now on. Every earlier commit still contains the full blobs, so clones stay large. Removing them means rewriting history (tools like `git lfs migrate`), which changes every later commit hash and must be coordinated with everyone who has a clone. Set up `.gitattributes` and LFS on day one, before the first model or dataset is committed.
:::

## Check yourself

::: check Write the rules
A GNC repository produces these files you do *not* want committed: every `*.mat` file inside any folder called `results`, the top-level folder `sim_cache/`, and all `.DS_Store` files that macOS drops everywhere. But `results/reference.mat` must stay tracked. Write the `.gitignore` lines, and say which one belongs in your global ignore file instead.
:::

::: answer
```text
**/results/*.mat
!results/reference.mat
/sim_cache/
.DS_Store
```

`**/results/*.mat` matches `.mat` files in a `results` folder at any depth, including the top level (`**/` can stand for no folders at all). The negation works because we ignored the files inside `results`, not the folder itself, and it comes after the rule it overrides; its middle `/` anchors it to the top-level `results/reference.mat`. A test with `git check-ignore -v` confirms `a/results/reference.mat` is ignored by line 1 and `results/reference.mat` is rescued by line 2. `/sim_cache/` is anchored to the top. `.DS_Store` has no slash, so it matches at any depth — but it is created by *your* operating system, not the project, so it belongs in your global ignore file (`core.excludesFile`).
:::

::: check Still showing up
You added `*.csv` to `.gitignore`, but `git status` keeps showing ` M out/summary.csv`. Why, and what do you do?
:::

::: answer
The leading space and `M` mean `out/summary.csv` is a *tracked* file that has been modified. Ignore rules only apply to untracked files, so Git keeps tracking it. Run `git rm --cached out/summary.csv` and commit; the file stays on disk, drops out of the index, and from then on the `*.csv` rule hides it. Old commits still contain it.
:::

::: check Ignore or attribute?
For each file, say whether it belongs in `.gitignore`, in `.gitattributes`, or neither: (a) `build/flight_sw.elf`, compiled output; (b) `models/guidance.slx`, a Simulink model the team edits; (c) `scripts/deploy.sh`, a shell script; (d) `thrust_curve.csv`, 4 KB, hand-edited by propulsion engineers.
:::

::: answer
(a) `.gitignore`: it is rebuilt from source, so it should not be committed at all. (b) `.gitattributes`: it must be tracked, but as `binary` (no text diff or merge), and in practice through LFS and `lockable`, so only one person edits it at a time. (c) `.gitattributes`: tracked as text with `eol=lf`, so a Windows checkout does not break it. (d) Neither, beyond the default `* text=auto`: it is small, human-edited text, and Git's line-by-line diff and merge work well on it.
:::

::: check The 133-byte simulation
A new team member clones the repository, runs the regression test, and it crashes with "file too short" while reading `data/golden_pass_0417.bin`. `ls -l` shows the file is 133 bytes. What happened?
:::

::: answer
The file is tracked through Git LFS, and their machine did not have `git-lfs` installed (or LFS was not set up) when they cloned. So Git checked out the *pointer file* — three short lines of text, 133 bytes — instead of the 10 MB payload. Installing LFS, running `git lfs install`, and then `git lfs pull` downloads the payloads and swaps the pointers for the real files.
:::

## Summary

| File or command | What it is for |
| --- | --- |
| `.gitignore` | patterns for untracked files Git should not see; committed and shared |
| `*.log`, `dir/`, `/dir/`, `**/`, `!pat` | any depth; folders only; top level only; any number of folders; un-ignore |
| `git check-ignore -v path` | which rule ignores a path |
| `git rm --cached file` | stop tracking a file but keep it on disk |
| `.git/info/exclude`, `core.excludesFile` | personal ignore rules, never committed |
| `.gitattributes` | per-path behaviour for tracked files |
| `text`, `text=auto`, `eol=lf` | treat as text, normalise to LF, force the working-tree ending |
| `binary` | shorthand for `-diff -merge -text`: no text diff, no text merge |
| `git check-attr -a path` | which attributes apply to a path |
| Git LFS | pointer file in Git, payload on an LFS server; `git lfs track`, `git lfs lock` |

The next lesson goes back to naming commits: **tags**, the permanent labels that mark releases, and **semantic versioning**, the numbering rules that tell everyone how big a change a new release is.

::: context leaked-secrets A commit is forever
Automated bots scan public code hosting sites around the clock for things that look like passwords and cloud access keys, and a key pushed to a public repository can be found and abused within minutes. Deleting the file in a later commit does not help: the earlier snapshot still holds it, in every clone. The only real fix is to **revoke** the secret — cancel it and issue a new one — and then keep secrets out of the repository for good, in files listed in `.gitignore` or in a separate secrets manager. Teams also run scanners that refuse a commit that contains something shaped like a key.
:::

::: context glob-patterns The shell's wildcards, again
In the shell module, `ls *.py` listed every Python file because the shell expanded `*` into matching names. `.gitignore` uses the same little language, called **glob patterns** after an early Unix program named `glob` (short for "global"). The main difference is that in `.gitignore` a single `*` never crosses a `/`, so `*.log` matches file names, not paths — which is why Git needs the extra `**` to mean "any number of folders".
:::

::: context cached-name Why "cached" means the index
In Git's early days the index was often called the **cache**, because it caches (keeps a quick copy of) information about the files in your working tree, such as their blob hashes and timestamps, so `git status` does not have to re-read every file. The name survives in options: `git rm --cached` works on the index only, and `git diff --cached` is another spelling of `git diff --staged` from lesson 02. "Cache", "index" and "staging area" all name the same file, `.git/index`.
:::

::: context line-endings Typewriters inside your files
The two line-ending characters are named after typewriters and teleprinters. **Carriage return** (CR, byte 13) slid the printing head back to the left edge. **Line feed** (LF, byte 10) rolled the paper up one line. Old teleprinters needed both, and Windows inherited the pair; Unix decided one byte, LF, was enough. The bytes are invisible in most editors, which is exactly why they cause trouble.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" font-weight="bold" fill="#1f2a44">Linux / macOS</text>
  <rect x="10" y="32" width="26" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="23" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">G</text>
  <rect x="36" y="32" width="26" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="49" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="62" y="32" width="36" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="80" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">LF</text>
  <text x="112" y="48" font-size="11" fill="#6c7a93">1 byte ends the line</text>
  <text x="10" y="80" font-size="12" font-weight="bold" fill="#1f2a44">Windows</text>
  <rect x="10" y="88" width="26" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="23" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">G</text>
  <rect x="36" y="88" width="26" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="49" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <rect x="62" y="88" width="36" height="24" fill="#fff" stroke="#b4232c" stroke-width="1.5"/><text x="80" y="104" font-size="11" text-anchor="middle" fill="#b4232c">CR</text>
  <rect x="98" y="88" width="36" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="116" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">LF</text>
  <text x="148" y="104" font-size="11" fill="#6c7a93">2 bytes end the line</text>
</svg>
```
:::

::: context model-comparison Comparing models without text diffs
Because a text diff of a model file is useless, modelling tools ship their own comparison. MathWorks' Simulink has a model comparison tool that opens two versions side by side and highlights changed blocks, lines and parameter values in the diagram itself. CAD systems have similar "compare parts" features. Many teams configure Git to launch these tools with a custom diff driver in `.gitattributes`, so that `git difftool` on a `.slx` file opens the graphical comparison instead of printing "Binary files differ".
:::

::: context golden-telemetry What "golden" means here
A **golden file** is a saved reference output that a test compares against: "the simulator, given these inputs, must produce exactly this". For flight software, golden telemetry is often a recording from a real test or flight — a pass over a ground station, a hot-fire of an engine — replayed through the code to check that a change did not alter the results. These files are precious and often large, from megabytes to gigabytes, which is exactly the kind of file Git LFS was built for.
:::

::: context mebibytes Two kinds of megabyte
Computer memory comes in powers of two, so programmers long used "kilobyte" for 1,024 bytes instead of 1,000. To end the confusion, standards bodies named the power-of-two units separately: a **kibibyte** (KiB) is $2^{10} = 1024$ bytes and a **mebibyte** (MiB) is $2^{20}$ bytes, while a megabyte (MB) is exactly one million bytes. The gap is about 5 percent at this size, which is why 50 MB of telemetry shows up as 47.7 MiB. Git, like many Linux tools, reports in the power-of-two units.
:::

::: context clean-smudge Clean on the way in, smudge on the way out
A Git **filter** is a pair of programs Git runs on a file as it moves between your working tree and the repository. The **clean** filter runs on the way *in* (`git add`), turning the working file into what gets stored. The **smudge** filter runs on the way *out* (checkout), turning the stored content back into a working file. LFS's clean filter stores a 133-byte pointer; its smudge filter fetches the payload.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="cs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="10" y="40" width="100" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">working tree</text>
  <text x="60" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">10 MB file</text>
  <rect x="250" y="40" width="100" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">repository</text>
  <text x="300" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">133-byte pointer</text>
  <line x1="112" y1="50" x2="248" y2="50" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cs)"/>
  <text x="180" y="42" font-size="11" text-anchor="middle" fill="#1d6fd1">clean (git add)</text>
  <line x1="248" y1="80" x2="112" y2="80" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cs)"/>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#b4232c">smudge (checkout)</text>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#6c7a93">payload lives on the LFS server</text>
</svg>
```
:::
