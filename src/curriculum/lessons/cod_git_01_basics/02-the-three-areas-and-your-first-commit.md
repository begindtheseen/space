---
id: l02-the-three-areas-and-your-first-commit
title: The three areas and your first commits
minutes: 20
covers:
  - "The three areas: working tree, index/staging, repository"
  - init, clone, add, status, diff, diff --staged, commit
---

In the last lesson you opened up a finished repository and found blobs, trees, commits and a couple of tiny ref files. This lesson you make those objects yourself, one command at a time, and watch each one appear.

The key idea is that a change does not jump straight from your editor into history. It passes through three places on the way. Git has a command to move a change from one place to the next, and a command to compare any two places. Once you can picture the three places, `git status` and `git diff` stop being puzzles and become a dashboard.

On a flight software team this is where good history starts. The attitude-control engineer who fixes a sign bug *and* tidies a comment in the same afternoon can save them as [[two separate commits|why-stage]], so the reviewer sees the one-line fix on its own, and so that, if the fix ever has to be undone, the tidy-up is not undone with it.

## Three places a change lives

Think about taking a class photo. There is the whole classroom, with everybody wandering around doing their own thing. There is the spot in front of the camera, where you call the people who should be in *this* picture and arrange them. And there is the photo album, where every picture you have taken stays forever.

Git has the same three places:

- The **working tree** — the files in your project folder, the ones you open in an editor and change. This is the classroom: anything goes, nothing is saved yet.
- The **[[index|index-names]]**, also called the **staging area** — Git's list of exactly what will go into the *next* commit. This is the spot in front of the camera. You choose what stands there.
- The **repository** — the `.git` folder with every commit ever made. This is the album. A commit takes the index as it is and pastes it into the album as a new snapshot.

Two commands move changes forward. `git add` copies a file from the working tree into the index ("call this person in front of the camera"). `git commit` turns the whole index into a new commit ("take the picture"). The [[picture of the three areas|three-areas-picture]] shows the commands as arrows.

::: key The three areas
Working tree (your files on disk) → `git add` → index / staging area (the proposed next commit) → `git commit` → repository (the commits in `.git`). Each area can hold a different version of the same file.
:::

The index is not an idea; it is a real file, `.git/index`. You can list what is in it with `git ls-files -s` ("stage"). In the orbit-sim repository from lesson 01:

```bash
git ls-files -s
```

```text
100644 3cb1d563f99ecac031dffc44285e893190c81d3f 0	README.md
100644 dcf32b5f28dff47cbde7ee70112842cf01f9b68e 0	gravity.py
100644 b64772c10c59ca234213288122d1926fbb8f56dd 0	tests/test_gravity.py
```

Those are the same blob hashes you met in lesson 01. The index is a list of names and blob hashes — a tree waiting to be written. (The `0` is a stage number; it matters only while a merge conflict is being resolved, in lesson 05.)

## Starting a repository: `init` and `clone`

There are two ways to get a repository: make an empty one, or copy one that exists.

### `git init`

`git init` turns the current folder into a repository by creating an empty `.git` folder inside it. Nothing else changes; your files are not touched and nothing is saved yet. Let's rebuild orbit-sim from nothing, slowly:

```bash
mkdir orbit-sim
cd orbit-sim
git init -b main
```

```text
Initialized empty Git repository in /home/maya/orbit-sim/.git/
```

The `-b main` names the first branch `main`. Without it, Git 2.43 names it `master` and prints a long hint suggesting you choose a name. Most teams now use `main`; you can make that your default once with `git config --global init.defaultBranch main`.

Before the first commit, tell Git who you are. Every commit records a name and email, and Git refuses to guess:

```bash
git config --global user.name "Maya Chen"
git config --global user.email "maya@example.com"
```

**`--global`** stores the setting for every repository you use on this computer (in a file `~/.gitconfig`). Leave it off and the setting applies to this one repository only, stored in `.git/config`. Use the email your team's code-hosting server knows you by — that is how it [[links commits to people|identity-trust]].

::: warning "Author identity unknown"
If you skip that step, your first commit fails with:

```text
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.
```

Nothing is lost: your staged files are still in the index. Set the two values and run `git commit` again.
:::

### `git clone`

More often you join a project that already exists. `git clone` copies a whole repository — every commit, every branch, the full history — into a new folder, and fills the working tree with the latest snapshot. Usually you give it a web or SSH address from your team's server. It also works on a plain folder path, which is handy for practice (run this from the folder that *contains* `orbit-sim`):

```bash
git clone orbit-sim orbit-sim-copy
```

```text
Cloning into 'orbit-sim-copy'...
done.
```

Every commit hash in the copy is identical to the original, because the objects are identical. A clone is a [[complete copy|full-copy]], not a window onto a server. The clone remembers where it came from under the name **[[origin|origin-name]]**. The next module is all about working with that other copy — sending and fetching commits. For this module, one repository on your own machine is enough.

## `git status`: the dashboard

`git status` tells you, for every file that differs anywhere, which areas disagree. Run it constantly. In the brand-new repository:

```bash
git status
```

```text
On branch main

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```

Create the README and ask again:

```bash
printf '# orbit-sim\n\nA tiny point-mass orbit simulator.\n' > README.md
git status
```

```text
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

nothing added to commit but untracked files present (use "git add" to track)
```

**Untracked** means the file is in the working tree but Git has never been told about it: it is in neither the index nor any commit. Git will ignore it until you `add` it. Notice that `status` also tells you what to do next — it is worth reading the hints.

### `git add`

```bash
git add README.md
git status
```

```text
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   README.md
```

"Changes to be committed" is Git's phrase for "staged" — in the index, different from the last commit. Here is something that surprises people: `git add` has *already* written the blob. Before the `add`, `.git/objects` was empty. After it, `find .git/objects -type f` shows one file, `.git/objects/3c/b1d563…` — the README blob, with exactly the hash from lesson 01. The index now holds the name `README.md` and that hash.

You can `add` a whole folder (`git add tests`) and Git stages every file in it. `git add .` stages everything in the current folder and below — convenient, and also the classic way to commit a file you did not mean to. Look at `git status` before you commit.

### `git commit`

```bash
git commit -m "Add README"
```

```text
[main (root-commit) 903724b] Add README
 1 file changed, 3 insertions(+)
 create mode 100644 README.md
```

Read the first line: branch `main`, this is the `root-commit` (no parent), the short hash `903724b`, and the message. The **`-m`** flag gives the message on the command line. Your hash will differ from `903724b` unless your name, email and clock match Maya's to the second — lesson 01 explained why.

Here is everything `git commit` did, in the language of lesson 01:

1. Built tree objects from the index (here one root tree listing `README.md`).
2. Wrote a commit object naming that tree, the current commit as parent (none, this time), you as author and committer, and the message.
3. Wrote the new commit's hash into `.git/refs/heads/main`. HEAD still says `ref: refs/heads/main`, so HEAD moved with it.

It did not change your files and it did not empty the index. After a commit, the working tree, the index and the newest commit all agree:

```text
On branch main
nothing to commit, working tree clean
```

::: example Building the first two commits
The second commit adds `gravity.py` and `tests/test_gravity.py` (their contents are in lesson 01). Watch the short status after each step. **`git status -s`** prints one line per file with a [[two-letter code|status-columns]]; `??` means untracked and `A` means added to the index.

After creating the two files:

```bash
git status -s
```

```text
?? gravity.py
?? tests/
```

An untracked folder is listed as one line until something in it is added. Stage both:

```bash
git add gravity.py tests
git status -s
```

```text
A  gravity.py
A  tests/test_gravity.py
```

Now Git lists the file inside `tests`. Commit:

```bash
git commit -m "Add point-mass gravity model"
```

```text
[main cf192ed] Add point-mass gravity model
 2 files changed, 13 insertions(+)
 create mode 100644 gravity.py
 create mode 100644 tests/test_gravity.py
```

**Check against lesson 01.** Same names, emails, timestamps and contents gave the same hashes, `903724b` and `cf192ed`: this is exactly the repository we opened there. The count checks too: 7 lines of `gravity.py` plus 6 of the test file make the 13 insertions.
:::

## Reading `status -s`: two columns

When a file has changed in more than one place, the long `status` lists it twice and the short form packs it into two letters. The **left letter** compares the index with the last commit (what is staged). The **right letter** compares the working tree with the index (what is not staged yet). A space means "no difference there". So:

| Code | Left: index vs last commit | Right: working tree vs index |
| --- | --- | --- |
| `??` | untracked | untracked |
| `A ` | new file staged | nothing more |
| `M ` | modification staged | nothing more |
| ` M` | nothing staged | modified, not staged |
| `MM` | a modification staged | *and* a newer edit not staged |

The last row matters. It is covered in the next section.

## `git diff`: comparing two areas

`git status` tells you *which* files differ. `git diff` shows you *how*, as the unified diff you learned to read in the shell module: `-` lines removed, `+` lines added, `@@` hunk headers saying where. Because there are three areas, there are three comparisons worth knowing:

- **`git diff`** with nothing after it compares the **working tree with the index**. It shows what you have changed but *not yet staged*.
- **`git diff --staged`** compares the **index with the last commit** (HEAD). It shows what *will* go into the next commit. (`--cached` is an older name for the same flag.)
- **`git diff HEAD`** compares the **working tree with the last commit**: everything you have changed, staged or not.

::: key Which diff is which
`git diff` = working tree vs index (unstaged changes). `git diff --staged` = index vs HEAD (what the next commit will contain). `git diff HEAD` = working tree vs HEAD (all your changes).
:::

::: example Two changes, two commits
Maya adds a function `accel_vector` to `gravity.py` — gravity's pull as an $(x, y, z)$ vector, pointing toward Earth's center — and, while she is at it, adds a "Running the tests" section to `README.md`. These are two unrelated changes, so she wants two commits. (When the two changes are in the *same* file, [[git add -p|add-patch]] can split them.)

**Step 1 — look.** Both files are modified and nothing is staged:

```bash
git status -s
```

```text
 M README.md
 M gravity.py
```

Plain `git diff` shows both changes. Here is the part for `gravity.py`:

```diff
diff --git a/gravity.py b/gravity.py
index dcf32b5..1a99c9c 100644
--- a/gravity.py
+++ b/gravity.py
@@ -5,3 +5,10 @@ G0 = 9.80665               # m/s^2, standard gravity
 def accel(r):
     """Size of gravity's pull (m/s^2) at distance r (m) from Earth's center."""
     return MU_EARTH / r**2
+
+
+def accel_vector(x, y, z):
+    """Gravity's pull as a vector (m/s^2) at position (x, y, z) in meters."""
+    r = (x * x + y * y + z * z) ** 0.5
+    k = -MU_EARTH / r**3
+    return (k * x, k * y, k * z)
```

The line `index dcf32b5..1a99c9c` names the blob before (the one from lesson 01) and the blob after. The hunk header `@@ -5,3 +5,10 @@` says: from line 5, three old lines became ten new ones — the three context lines plus seven added.

**Step 2 — stage only the gravity change.**

```bash
git add gravity.py
git status -s
```

```text
 M README.md
M  gravity.py
```

`gravity.py` moved to the left column (staged); `README.md` is still in the right column (not staged).

**Step 3 — check each side.** Now `git diff` shows only the README hunk, because the gravity change is no longer a difference between working tree and index:

```diff
@@ -1,3 +1,7 @@
 # orbit-sim
 
 A tiny point-mass orbit simulator.
+
+## Running the tests
+
+From the top folder of the repository, run `python3 -m pytest`.
```

and `git diff --staged` shows only the `accel_vector` hunk — exactly what the next commit will hold. `git diff HEAD --stat` shows both: `README.md | 4 ++++` and `gravity.py | 7 +++++++`, 11 insertions in all.

**Step 4 — commit each.** `git commit -m "Add vector form of gravity acceleration"`, then `git add README.md` and `git commit -m "Explain how to run the tests"`. Two commits, each about one thing.

**Sanity check on the physics.** At $r = 6.921 \times 10^6\,\mathrm{m}$ (550 km up), `accel_vector(6.921e6, 0, 0)` returns about $(-8.32, 0, 0)\,\mathrm{m/s^2}$: the same size as `accel(6.921e6)`, pointing back toward the center, as gravity should.
:::

## `git add` stages a snapshot, not a file name

This is the most important detail in the lesson. When you run `git add gravity.py`, Git stores the file *as it is at that moment*. If you edit the file again afterwards, the index still holds the older version.

In the example above, right after staging `gravity.py`, Maya noticed the docstring should say the coordinates are Earth-centered, and fixed it. Status now shows the file twice:

```bash
git status -s
```

```text
 M README.md
MM gravity.py
```

`MM`: one modification staged, and a newer one not staged. Plain `git diff` shows only the new docstring edit (trimmed here to the two changed lines):

```diff
-    """Gravity's pull as a vector (m/s^2) at position (x, y, z) in meters."""
+    """Gravity's pull as a vector (m/s^2) at position (x, y, z) in meters, Earth-centered."""
```

If she committed now, the commit would contain the *old* docstring, and the fix would be left behind in the working tree. She ran `git add gravity.py` a second time, which replaced the staged version with the current one, and then committed.

::: warning Staged means "as it was when you added it"
After `git add`, any further edit to the same file is *not* staged. Run `git add` again after your last edit, and check `git status -s` for an `MM` before you commit.
:::

::: warning An empty `git diff` does not mean "no changes"
Plain `git diff` compares the working tree with the index. Right after `git add`, it prints nothing — the staged change has not vanished, it has moved. Use `git diff --staged` to see what is about to be committed.
:::

## Committing with a real message

`-m` is fine for a one-line message. For anything longer, run `git commit` with no `-m`. Git opens a text editor — on most Linux machines that is [[Vim|editor-choice]], which you met in the shell module — with a template:

```text

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch main
# Changes to be committed:
#	modified:   README.md
#
```

Write your message at the top, save and quit (`:wq` in Vim). Lines starting with `#` are thrown away. If you quit without writing anything, Git prints `Aborting commit due to empty commit message.` and makes no commit — a safe way to back out. Next lesson is about what to write in that message.

One more flag you will see: **`git commit -a`** stages every change to files Git *already tracks* and commits, in one step. It skips untracked files — a brand-new `drag.py` would be left out — and it defeats the point of choosing what goes in. Use it only when you have looked at `git status` and know every change belongs together.

::: warning `git add .` and `commit -a` are how junk gets committed
Large simulation outputs, editor backup files and passwords in config files end up in history through a careless `git add .`. Once committed and shared, a file stays in history even if a later commit deletes it — a [[leaked password|leaked-secret]] must be treated as public. Lesson 08 shows how to make Git ignore such files; until then, read `git status` before every commit.
:::

## Check yourself

::: check Where is it?
You edit `README.md`, run `git add README.md`, then edit it again. How many different versions of `README.md` now exist across the three areas, and where is each?
:::

::: answer
Three. The **last commit** holds the version from before any of today's edits. The **index** holds the version as it was when you ran `git add` (after the first edit). The **working tree** holds the current file, with both edits. `git status -s` would show `MM README.md`.
:::

::: check Choose the diff
You have staged some changes and left others unstaged. Which command shows (a) exactly what `git commit` would record right now, (b) what you would lose if you threw away your unstaged edits, (c) everything you have changed since the last commit?
:::

::: answer
(a) `git diff --staged` — index against the last commit, which is what a commit would record. (b) `git diff` — working tree against the index, the unstaged edits. (c) `git diff HEAD` — working tree against the last commit, staged and unstaged together.
:::

::: check Decode the short status
`git status -s` prints three lines: `A  drag.py`, ` M gravity.py` and `?? notes.txt`. Say in words what each line means, and what `git commit` (with no `-a`) would record.
:::

::: answer
`A  drag.py`: a new file, staged, with no further edits. ` M gravity.py`: modified in the working tree, nothing staged. `?? notes.txt`: untracked. A plain `git commit` records only the index, so the new commit adds `drag.py` and nothing else; the `gravity.py` edit and `notes.txt` stay where they are.
:::

::: check What `add` writes
In a fresh repository with no commits, you create a file and run `git add` on it, but you do not commit. Is there any object in `.git/objects` yet? If so, what type, and what does the index contain?
:::

::: answer
Yes: one **blob**, holding the file's contents. `git add` writes the blob right away. The index holds the file's mode, that blob's hash and the file name. No tree or commit exists until `git commit`, which builds the tree from the index and then the commit.
:::

::: check Commit -a
You created `drag.py` and edited `gravity.py`, then ran `git commit -a -m "Add drag model"`. Afterwards `git status -s` prints `?? drag.py`. What went wrong, and how do you fix it?
:::

::: answer
`commit -a` stages changes only to files Git already tracks. `gravity.py` was tracked, so its edit was committed; `drag.py` was untracked, so it was left out and the commit message is now misleading. Run `git add drag.py` and commit it; lesson 06 shows how to fold it into the previous commit instead.
:::

## Summary

| Command | What it does | Areas involved |
| --- | --- | --- |
| `git init -b main` | create an empty repository (`.git`) here | — |
| `git clone <source> <dir>` | copy a whole repository with all history | repository → new folder |
| `git status` / `-s` | which files differ, and where | all three |
| `git add <path>` | copy the file's current contents into the index (writes a blob) | working tree → index |
| `git commit -m "..."` | write trees and a commit from the index; move the branch | index → repository |
| `git diff` | unstaged changes | working tree vs index |
| `git diff --staged` | what the next commit will contain | index vs HEAD |
| `git diff HEAD` | all changes since the last commit | working tree vs HEAD |
| `git ls-files -s` | list the index: mode, blob hash, name | index |

Every change travels working tree → index → repository, and `status` and `diff` compare the areas. orbit-sim now has four commits; next lesson you read that history with `log`, `show` and `blame`, and learn to write the message that makes each commit worth reading.

::: context why-stage Why Git bothers with a staging area
Many version control tools commit every changed file at once. Git's designers added the index so that you decide what each commit contains. That matters when history is read later: a reviewer can approve a one-line guidance fix without wading through unrelated edits, and `git revert` (lesson 06) can undo exactly one idea. The Linux kernel, where Git was born, takes changes as series of small, single-purpose commits for exactly these reasons, and most flight software teams run their reviews the same way.
:::

::: context index-names Three names for one thing
The staging area has had several names over Git's life. In the earliest versions it was called the **cache**, which is why `git diff --cached` and `git rm --cached` still exist. The file on disk is `.git/index`, and Git's own internals call it the index. "Staging area" is the friendlier name used in most tutorials, and newer flags like `--staged` use it. All three mean the same list of names and blob hashes.
:::

::: context three-areas-picture The three areas and the commands between them
Arrows below the boxes move changes forward; the brackets above show what each `diff` compares.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="b1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="10" y="80" width="95" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="57" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">working</text>
  <text x="57" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">tree</text>
  <rect x="133" y="80" width="95" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">index</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">(staging)</text>
  <rect x="255" y="80" width="95" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">repository</text>
  <text x="302" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">(HEAD)</text>
  <line x1="57" y1="130" x2="57" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="57" y1="160" x2="160" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="160" y1="160" x2="160" y2="133" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#b1)"/>
  <text x="108" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">git add</text>
  <line x1="200" y1="130" x2="200" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="185" x2="302" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="302" y1="185" x2="302" y2="133" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#b1)"/>
  <text x="251" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">git commit</text>
  <path d="M57,76 L57,62 L180,62 L180,76" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="118" y="56" font-size="11" text-anchor="middle" fill="#1d6fd1">git diff</text>
  <path d="M184,76 L184,62 L302,62 L302,76" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="243" y="56" font-size="11" text-anchor="middle" fill="#1d6fd1">git diff --staged</text>
  <path d="M50,76 L50,28 L309,28 L309,76" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#b4232c">git diff HEAD</text>
</svg>
```
:::

::: context identity-trust Your name on a commit is a claim, not a proof
Git writes whatever name and email you configured; it does not check them. A code-hosting server links a commit to your account by matching the email. Because anyone could type anyone's name, teams with strict review rules often require **signed commits**: the commit carries a cryptographic signature made with a key only you hold, and the server shows it as "verified". On flight software projects, reviews and audits rely on knowing who really wrote each change, so this is common.
:::

::: context full-copy Every clone is a full backup
Git is **distributed**: each clone holds every commit, not only the latest files. You can read the whole history, make commits and compare old versions with no network at all. If the shared server dies, any up-to-date clone can rebuild it. Teams whose machines sit on isolated, disconnected networks (common for controlled aerospace work) can even move a repository across on removable media, using `git bundle` to pack it into one file.
:::

::: context origin-name Why "origin"
When you clone, Git records the address you cloned from as a **remote** — a named bookmark for another copy of the repository — and calls it `origin` by default. There is nothing special about the word; it is only the conventional name for "where this copy came from". `git remote -v` lists your remotes. On a real team, `origin` is usually the shared server (GitHub, GitLab or a company's own host), and the next module covers sending commits to it and fetching other people's.
:::

::: context status-columns The two columns of `status -s`
Each line is two letters and a path. The left letter compares the index with the last commit; the right letter compares the working tree with the index.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 136" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="50" width="26" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="133" y="71" font-size="16" text-anchor="middle" fill="#1f2a44">M</text>
  <rect x="146" y="50" width="26" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="159" y="71" font-size="16" text-anchor="middle" fill="#1f2a44">M</text>
  <text x="184" y="71" font-size="16" fill="#1f2a44">gravity.py</text>
  <line x1="133" y1="50" x2="100" y2="30" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="10" y="22" font-size="11" fill="#1d6fd1">left: index vs last commit</text>
  <text x="10" y="37" font-size="11" fill="#1d6fd1">(staged)</text>
  <line x1="159" y1="80" x2="190" y2="102" stroke="#b4232c" stroke-width="1.5"/>
  <text x="160" y="114" font-size="11" fill="#b4232c">right: working tree vs index</text>
  <text x="160" y="127" font-size="11" fill="#b4232c">(not staged)</text>
</svg>
```

`??` in both columns means untracked; a space means "no difference here".
:::

::: context add-patch Staging part of a file
`git add -p` ("patch") walks through a file's changes one hunk at a time and asks, for each, `Stage this hunk [y,n,q,a,d,e,?]?`. Answer `y` to stage it, `n` to leave it, `q` to stop; `?` explains the rest. That lets you split two unrelated edits in the same file into two commits. It is also a good habit on its own: reading every hunk before staging it catches the debugging `print` you forgot to delete.
:::

::: context editor-choice Choosing the editor Git opens
Git uses the editor named in the setting `core.editor`, or else the `EDITOR` environment variable, or else Vim. If you prefer Nano, run `git config --global core.editor nano`. If you land in Vim by surprise: press `i` to type, `Esc` to stop typing, then `:wq` and Enter to save and quit, or `:q!` to quit without saving (which aborts the commit, because the message stays empty).
:::

::: context leaked-secret Deleting a secret does not un-leak it
If a password or API key is committed and pushed, every clone made since has a copy in its history, and deleting the file in a later commit leaves the old blob reachable. Rewriting history can remove it from *your* copy, but you cannot recall other people's clones. The only safe response is to treat the secret as exposed: revoke it and issue a new one. Then add the file to `.gitignore` (lesson 08) so it cannot happen again.
:::
