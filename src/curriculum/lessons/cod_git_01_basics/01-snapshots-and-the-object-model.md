---
id: l01-snapshots-and-the-object-model
title: Snapshots, objects and the commit graph
minutes: 22
covers:
  - Blobs, trees, commits, refs, HEAD and the commit DAG
---

Picture a team of twelve people writing the flight software for a small satellite. Over two years they will change the code tens of thousands of times. Two people will edit the same file on the same afternoon. Someone will make a change on a Tuesday that breaks the attitude controller, and nobody will notice until a simulation fails on Friday. And on launch day, somebody will ask the most important question of all: *exactly which code is on the vehicle?*

A tool that answers those questions is called a **version control system** — a program that records every saved state of a project, who made it, when and why, and lets you go back to any of them. Nearly every software team on Earth uses one called **Git**. We start with what Git actually stores on disk, because once you have seen that, every command in the next nine lessons turns into "move this pointer" or "write this object".

## Why a flight software team cannot work without version control

Think about how most people keep versions of a school essay: `essay.docx`, `essay_v2.docx`, `essay_final.docx`, `essay_final_REALLY.docx`. That works, badly, for one person and one file. Try it with a hundred files, twelve people and two years, and within a week nobody knows which copy of `gravity.py` is the good one or whose edit was lost when two people saved over each other.

A version control system fixes this with a few promises:

- **Every saved state is kept**, and you can return to any of them.
- **Every saved state carries a note:** who, when, and why.
- **Many people can work at once**, each on their own copy, and the tool helps combine the work.
- **Nothing is ambiguous.** Each saved state has a unique name, so "the code on the vehicle" is one exact identifier.

For flight software, the last promise is a requirement. When guidance code is tested and approved, the approval is for *one exact version*. If the tests ran on one version and the rocket flew another, the tests prove nothing about the flight. Engineers call this **[[configuration management|configuration-management]]**: knowing precisely what you built, tested and flew. Git is the everyday tool for it.

## Snapshots, not lists of changes

You could record history as a **list of changes**, like a recipe book's corrections page: "on page 4, change 2 cups to 3 cups". To see last month's recipe, you replay every correction from the start.

Or you could keep a **photo album**: every time you save, you photograph every file. To see last month's version, you open last month's photo.

Git keeps the photo album. Each saved state is a complete **snapshot** of every file. That sounds wasteful, but there is a trick: if a file did not change between two snapshots, the second one points at the copy already stored instead of storing it again. A snapshot costs space only for the files that changed.

When you ask "what changed between these two versions?", Git compares the two snapshots on the spot. That comparison is a **diff** — the same unified diff you met with `diff -u` in the shell module.

::: key Git stores snapshots, not diffs
Does Git store diffs? No. Each commit references a complete tree snapshot; identical file contents are shared by hash. Diffs are computed on demand, and **[[packfiles|packfiles]]** later apply delta compression as a storage optimisation only.
:::

## Every object is named by its fingerprint

How does Git know two files have the same contents, so it can share them? It gives every piece of content a **hash** — a fixed-length fingerprint computed from its bytes.

Picture a library that shelves books by fingerprint instead of title. Feed a book's whole text into a machine and it prints a 40-character code. The same text always gives the same code, on any machine in the world; change one comma and the code is completely different. The code *is* the shelf address.

Git's fingerprint machine is a function called **[[SHA-1|sha-1]]**. It turns any content into 40 **[[hexadecimal|hexadecimal]]** digits (`0`–`9` and `a`–`f`). Because each stored item is named by its content, Git is **content-addressed**: you look things up by what they contain, not where you put them.

You can ask Git for the fingerprint of any content with `git hash-object`. The `printf` command prints exactly the text you give it, with `\n` meaning "new line", and the pipe `|` hands that text to Git (`--stdin` means "read the content from the pipe"):

```bash
printf '# orbit-sim\n\nA tiny point-mass orbit simulator.\n' | git hash-object --stdin
```

```text
3cb1d563f99ecac031dffc44285e893190c81d3f
```

Now delete one character, the final period:

```bash
printf '# orbit-sim\n\nA tiny point-mass orbit simulator\n' | git hash-object --stdin
```

```text
3a7cff6c8d6da31eca0ed278ba56b657cbca2ef4
```

One missing dot, and nothing of the fingerprint survives. Run the first command on your own machine and you get `3cb1d56…` too: the hash depends only on the content.

::: note Why the hash is not the SHA-1 of the file alone
Git first glues a header on the front: the type, a space, the length in bytes, and a zero byte. For our 48-byte README, what gets fingerprinted is `blob 48\0` followed by the text. Python's `hashlib` confirms it:

```python
import hashlib
data = b"# orbit-sim\n\nA tiny point-mass orbit simulator.\n"
header = b"blob " + str(len(data)).encode() + b"\0"
print(len(data))                                  # 48
print(hashlib.sha1(header + data).hexdigest())    # 3cb1d563f99ecac031dffc44285e893190c81d3f
print(hashlib.sha1(data).hexdigest())             # b320a6530e580639e1ad803785deecdf6afe952b
```

With the header, Python and Git agree to the last digit; without it, they do not.
:::

## Looking inside a real repository

Our project for the whole module is a small flight simulator called **orbit-sim**: a `README.md`, a file `gravity.py` that computes Earth's pull, and a `tests` folder with one test.

A **repository** (or "repo") is a project folder that Git is tracking, together with its whole history. The commands below create one and save two snapshots. Type them; the next lesson takes `init`, `add` and `commit` apart one at a time. (`git config` sets the name and email Git stamps on your snapshots.)

```bash
git init -b main orbit-sim
cd orbit-sim
git config user.name "Maya Chen"
git config user.email "maya@example.com"
printf '# orbit-sim\n\nA tiny point-mass orbit simulator.\n' > README.md
git add README.md
git commit -m "Add README"
# ...create gravity.py and tests/test_gravity.py (shown below)...
git add gravity.py tests
git commit -m "Add point-mass gravity model"
```

Here is `gravity.py`. The constant `MU_EARTH` is Earth's gravitational parameter $\mu$ ("mu"), and `accel(r)` returns $\mu / r^2$, the size of gravity's pull at distance $r$ from Earth's center:

```python
MU_EARTH = 3.986004418e14  # m^3/s^2, Earth's gravitational parameter
G0 = 9.80665               # m/s^2, standard gravity


def accel(r):
    """Size of gravity's pull (m/s^2) at distance r (m) from Earth's center."""
    return MU_EARTH / r**2
```

And `tests/test_gravity.py` checks that at Earth's surface ($r = 6.371 \times 10^6\,\mathrm{m}$) the model gives about standard gravity ($3.986 \times 10^{14} / (6.371 \times 10^6)^2 \approx 9.82\,\mathrm{m/s^2}$, within $0.05$ of $9.80665$):

```python
from gravity import G0, accel


def test_surface_gravity():
    # At Earth's mean radius the model should give about standard gravity.
    assert abs(accel(6.371e6) - G0) < 0.05
```

Each saved snapshot is called a **commit**. Git keeps everything it knows in a hidden folder named `.git` at the top of the project. Look inside:

```bash
ls .git
```

```text
COMMIT_EDITMSG  HEAD  branches  config  description  hooks  index  info  logs  objects  refs
```

Three matter here: `objects`, where every snapshot's pieces live; `refs`, where names like `main` are kept; and `HEAD`, which says where you are. Git's whole memory is **four kinds of object** plus a few small name files.

### Blobs: file contents

Git keeps every object in `.git/objects`, filed under its hash: the first two hex digits become a folder name and the other 38 the file name. Our tiny repository holds eight objects:

```bash
find .git/objects -type f | sort
```

```text
.git/objects/16/a6d977f526da97f11d8dffe167d762b93d700e
.git/objects/3c/b1d563f99ecac031dffc44285e893190c81d3f
.git/objects/90/3724bf620d3671565f7ce3dea9d4edd4c2786b
.git/objects/b6/4772c10c59ca234213288122d1926fbb8f56dd
.git/objects/bf/fe485d25c97a8bc8031014106fa603f72c022b
.git/objects/cf/192edf4f4a9ab887cb65baaceb27e938ee2b6e
.git/objects/dc/f32b5f28dff47cbde7ee70112842cf01f9b68e
.git/objects/e0/c2fdf2d65e1d52d0ec8dc4f330542ebdbbf090
```

These files are **[[compressed|zlib]]**, so `cat` shows gibberish. The tool for reading them is `git cat-file` ("git cat file"): `-t` prints an object's **type**, and `-p` ("pretty-print") prints its contents readably. The first few digits of a hash are enough, as long as no other object starts the same way:

```bash
git cat-file -t 3cb1d56
git cat-file -p 3cb1d56
```

```text
blob
# orbit-sim

A tiny point-mass orbit simulator.
```

A **blob** (short for "binary large object") is the contents of one file — only the contents. It does not contain the name `README.md`, its folder, or a date. That is why two files with identical contents, in any repository, get the same blob hash.

### Trees: directory listings

If blobs have no names, where do the names live? In **trees**. A tree is Git's version of a folder: a list of entries, each saying "this name means that object". `HEAD^{tree}` below means "the tree of the commit I am on" (read it "HEAD's tree"):

```bash
git cat-file -p HEAD^{tree}
```

```text
100644 blob 3cb1d563f99ecac031dffc44285e893190c81d3f	README.md
100644 blob dcf32b5f28dff47cbde7ee70112842cf01f9b68e	gravity.py
040000 tree e0c2fdf2d65e1d52d0ec8dc4f330542ebdbbf090	tests
```

Each line has four columns: a **[[mode|file-mode]]** (`100644` is an ordinary file, `040000` a folder), the object type, the hash, and the name. The `tests` folder is itself a tree — trees contain trees, as folders contain folders:

```bash
git cat-file -p e0c2fdf
```

```text
100644 blob b64772c10c59ca234213288122d1926fbb8f56dd	test_gravity.py
```

So a snapshot of the whole project is one **root tree** — the tree for the top folder — with blobs and smaller trees hanging off it.

::: key The names live in trees
A blob hash covers only the file's contents (plus Git's short type-and-length header). File names and folder structure live in trees. So if you rename a file, its blob does not change at all; only the tree does. Git records no "rename" event — when you ask, it infers a rename by noticing that the same (or nearly the same) content appears under a new name.
:::

### Commits: a snapshot plus its story

A **commit** ties a root tree to its history. Print the commit you are on (`HEAD` means "the current commit"):

```bash
git cat-file -p HEAD
```

```text
tree bffe485d25c97a8bc8031014106fa603f72c022b
parent 903724bf620d3671565f7ce3dea9d4edd4c2786b
author Maya Chen <maya@example.com> 1789396800 -0500
committer Maya Chen <maya@example.com> 1789396800 -0500

Add point-mass gravity model
```

Read it line by line:

- `tree` — the root tree: the full snapshot of the project at this moment.
- `parent` — the commit that came right before this one.
- `author` — who wrote the change, with a **[[timestamp|unix-time]]** and time zone.
- `committer` — who saved it into the repository (usually the same person).
- then a blank line, and the **commit message**, the human explanation.

The very first commit in a repository has no earlier commit, so it has no `parent` line. It is called the **root commit**:

```bash
git cat-file -p 903724b
```

```text
tree 16a6d977f526da97f11d8dffe167d762b93d700e
author Maya Chen <maya@example.com> 1789395120 -0500
committer Maya Chen <maya@example.com> 1789395120 -0500

Add README
```

A commit's hash fingerprints *all* of that text. Change any part and the commit gets a new name.

### Annotated tags: labels with a story

The fourth kind of object is the **annotated tag**: a label on one commit, with its own author, date and message, used to mark releases like "version 0.1.0". Here is one, made in a copy of the repository:

```bash
git cat-file -p v0.1.0
```

```text
object cf192edf4f4a9ab887cb65baaceb27e938ee2b6e
type commit
tag v0.1.0
tagger Maya Chen <maya@example.com> 1789398300 -0500

First runnable gravity model
```

Lesson 09 covers tags properly.

::: key The four Git object types
Blob (file contents), tree (a directory listing of blobs and trees), commit (a tree plus parents, author, message) and annotated tag. Everything is content-addressed by the hash of its contents.
:::

::: example Walking from a commit down to a file
**Question.** Starting from the name `HEAD`, find the exact bytes of `tests/test_gravity.py` in the second commit, using only `git cat-file`.

**Step 1 — the commit.** `git cat-file -p HEAD` printed `tree bffe485…`. That is the root tree of this snapshot.

**Step 2 — the root tree.** `git cat-file -p bffe485` lists three entries. The one named `tests` is a tree, `e0c2fdf…`.

**Step 3 — the subtree.** `git cat-file -p e0c2fdf` lists one entry: `test_gravity.py`, a blob, `b64772c…`.

**Step 4 — the blob.** `git cat-file -p b64772c` prints the six lines of the test file.

**Sanity check.** `git cat-file -t` on the four hashes prints `commit`, `tree`, `tree`, `blob`, in that order. Every command that "shows a file from an old version" does this same walk.
:::

## Two snapshots share what did not change

Compare the two commits' root trees. The first:

```text
100644 blob 3cb1d563f99ecac031dffc44285e893190c81d3f	README.md
```

The second:

```text
100644 blob 3cb1d563f99ecac031dffc44285e893190c81d3f	README.md
100644 blob dcf32b5f28dff47cbde7ee70112842cf01f9b68e	gravity.py
040000 tree e0c2fdf2d65e1d52d0ec8dc4f330542ebdbbf090	tests
```

The README line is identical — same hash, `3cb1d56`. The second snapshot points at the *same stored blob*: both photos are complete, but the unchanged file is stored once. The [[picture of the object graph|object-graph-picture]] shows every one of the eight objects and every arrow between them.

::: example Counting the objects
**Question.** Account for each of the eight objects.

**First commit** (`Add README`) needed:

- a blob for the README contents, `3cb1d56`;
- a root tree listing it, `16a6d97`;
- the commit itself, `903724b`.

That is $3$ objects.

**Second commit** (`Add point-mass gravity model`) needed:

- a blob for `gravity.py`, `dcf32b5`;
- a blob for `test_gravity.py`, `b64772c`;
- a tree for the `tests` folder, `e0c2fdf`;
- a new root tree, `bffe485` (its list of entries changed);
- the commit, `cf192ed`.

That is $5$ objects; the README blob was *not* stored again.

**Total:** $3 + 5 = 8$, matching the eight files `find` listed. The one object shared between the two snapshots is exactly the one file that did not change.
:::

::: warning The root tree changes whenever anything changes
Edit a file three folders deep and you get a new blob, a new tree for each folder on the way up, and a new root tree, because each parent's list now holds a different hash. Everything *beside* that path is reused. Do not expect only the blob to change.
:::

## Refs and HEAD: names for commits

Nobody wants to say "please test `cf192edf4f4a9ab887cb65baaceb27e938ee2b6e`". So Git keeps small files that give commits human names. Such a name is a **ref** (short for "reference").

A **branch** is the most common ref. On disk, it is a tiny text file in `.git/refs/heads/` holding one commit hash:

```bash
cat .git/refs/heads/main
wc -c .git/refs/heads/main
```

```text
cf192edf4f4a9ab887cb65baaceb27e938ee2b6e
41 .git/refs/heads/main
```

Forty hex characters plus one newline: 41 bytes. That is the whole branch — no list of commits, no files. It points at one commit, the **tip** of the branch, and the rest of the history is found by following `parent` lines backward. When you commit on `main`, Git writes the new hash into this file. Lesson 04 is about what that makes possible.

Then there is **HEAD**, the "you are here" marker. It lives in the file `.git/HEAD`:

```bash
cat .git/HEAD
```

```text
ref: refs/heads/main
```

HEAD does not hold a hash. It holds the *name of a branch*. To find your current commit, Git reads two files: HEAD says "I am on `main`", and `main` says "I am at `cf192ed`". So when you commit, the branch moves forward and HEAD comes along without being rewritten.

::: key What a branch is, physically
A 41-byte file under `.git/refs/heads` containing a commit hash. Creating a branch is free; moving it is a one-line write. HEAD is a ref that usually points at a branch ref.
:::

::: warning The branch file can be missing — and the branch still exists
Git sometimes tidies small ref files into one shared file, `.git/packed-refs` (for example after `git gc`, its clean-up command). Then `.git/refs/heads/main` may not exist at all, yet `main` works fine. To ask Git where a ref points, use `git rev-parse main` rather than `cat`: it checks both places.
:::

## The commit graph

Each commit names its parent, back to the root commit. Draw each commit as a dot and each parent link as an arrow, and you get a **graph** — dots (called **nodes**) joined by arrows (called **edges**).

It is a special kind of graph called a **DAG**, read "dag", short for **directed acyclic graph**:

- **Directed** — every arrow has a direction. A commit points to its parent, never the other way. The parent was written first and cannot know about children that did not exist yet.
- **Acyclic** — there are no loops. Follow parent arrows from any commit and you always head back in time, ending at the root commit. You can never arrive back where you started.

Why can history never loop? A commit's hash includes its parent's hash. For A to be its own ancestor, A's hash would have to be inside the text that produces A's hash — before that hash existed. Impossible, so loops are impossible.

Our history so far is a straight line. When two people start from the same commit and each adds their own, the graph **forks**: two commits share one parent. When their work is combined, Git can create a **merge commit** with *two* `parent` lines, and the graph joins again (lesson 05). A [[drawing of a small DAG|dag-picture]] with branch names shows both shapes.

One last word, **reachable**: a commit is reachable if you can get to it from some ref by following parent arrows. "The history of `main`" is the set of commits reachable from `main`. Commits no ref can reach are not deleted straight away, but normal history stops showing them; lesson 07 shows how to find them again.

::: key HEAD, branches and the DAG
HEAD → branch → commit → parent → … → root commit. HEAD usually names a branch; a branch names one commit; each commit names its parents; the parent links form a directed acyclic graph (the commit DAG). A merge commit has two parents; the root commit has none.
:::

::: warning Arrows point backward in time
People often draw arrows from older to newer commits. Git stores the opposite: each commit points to its *parent*, so Git can walk from the newest commit back to the first but cannot, from an old commit alone, find the commits built on it.
:::

## Check yourself

::: check One letter
You fix a typo in `README.md` (one letter) and make a third commit. How many new objects does that commit add to `.git/objects`, and which old ones does it reuse?
:::

::: answer
Three new objects: a **new blob** for the changed README; a **new root tree**, because the tree lists the README's hash and that hash changed; and the **new commit**, naming that tree and the parent `cf192ed`. The `gravity.py` blob, the `tests` tree and the test blob did not change, so the new root tree points at those existing objects. Total: $8 + 3 = 11$ objects.
:::

::: check Same blob, different commit
A classmate follows this lesson on her own laptop, with her own name and email, typing exactly the same file contents. Her README blob hash is `3cb1d56…`, the same as ours. Her first commit's hash is not `903724b`. Explain both facts.
:::

::: answer
A blob's hash depends only on the file's bytes (with Git's `blob <length>\0` header), and her bytes are identical. A commit's hash fingerprints the whole commit text: tree hash, author name and email, timestamps and message. Her tree is even the same, but her name, email and time differ, so her commit text and its hash differ. Same content, same name; any difference, a different name.
:::

::: check Rename
In the next commit, you rename `gravity.py` to `gravity_model.py` without changing a single character inside it. Which of these get a new hash: the blob for that file, the root tree, the commit?
:::

::: answer
The blob keeps its hash, `dcf32b5`: its contents did not change, and a blob does not contain its name. The root tree gets a new hash, because one entry now reads `gravity_model.py`. The commit is new, as every commit is. Nowhere is a "rename" recorded; Git later notices the same blob under a new name and reports a rename.
:::

::: check Following the files
You run `cat .git/HEAD` and see `ref: refs/heads/main`, then `cat .git/refs/heads/main` and see `cf192ed…`. You make one more commit, whose hash is `a1b2c3d…`. Which of the two files changed, and what does each contain now?
:::

::: answer
Only the branch file. `.git/refs/heads/main` now contains `a1b2c3d…` and a newline (still 41 bytes). `.git/HEAD` still says `ref: refs/heads/main`: HEAD names the branch, the branch moved, so HEAD moved with it. The new commit's `parent` is `cf192ed…`, the old tip, which keeps history connected.
:::

::: check Is this a real Git history?
Someone shows you a hand-drawn history in which commit X's parent is Y, Y's parent is Z, and Z's parent is X. Could Git ever produce this? Give the reason in one or two sentences.
:::

::: answer
No. X's text includes Y's hash, Y's includes Z's, and Z's would include X's — so X's hash would be needed before it could be computed. Following parents always leads back in time to a root commit.
:::

## Summary

| Thing | What it is | How to look at it |
| --- | --- | --- |
| Hash | 40 hex digits (SHA-1) fingerprinting an object's content | `git hash-object`, or read it in any output |
| Blob | The contents of one file — no name, no date | `git cat-file -p <hash>` |
| Tree | A folder listing: mode, type, hash and name per entry | `git cat-file -p HEAD^{tree}` |
| Commit | A root tree + parent(s) + author + committer + message | `git cat-file -p HEAD` |
| Annotated tag | A named label on a commit, with tagger and message | `git cat-file -p v0.1.0` |
| Branch | A 41-byte file in `.git/refs/heads` holding one commit hash | `git rev-parse main` |
| HEAD | "You are here": usually `ref: refs/heads/<branch>` | `cat .git/HEAD` |
| Commit DAG | Commits linked to their parents; directed, never looping | coming in lesson 03 |

A commit is a whole snapshot, unchanged files are shared by hash, and history is the chain of parent links. Next lesson you make commits yourself and meet the three places a change passes through on its way in: the working tree, the staging area and the repository.

::: context configuration-management What engineers mean by configuration management
In aerospace, a **configuration** is the exact set of parts — hardware, software, documents — that make up a system at one moment. Configuration management is the discipline of knowing, for every build, what went into it and what changed since the last one. Software standards for aircraft (DO-178C) and NASA's software engineering requirements (NPR 7150.2) both require it. In practice the answer to "what code flew on this mission?" is a single commit hash written into the flight software's build, so it can be looked up in the repository years later.
:::

::: context packfiles Where the space is really saved
Loose objects, one compressed file each, are how Git starts out. From time to time (and when you run `git gc`, or send code over a network), Git bundles many objects into a **packfile**. Inside a pack, if two blobs are nearly identical — two versions of a 3,000-line file that differ in one line — Git may store one in full and the other as "that one, with these bytes changed". This is **delta compression**. It is only a way of squeezing the file on disk: every commit still means a complete snapshot, and Git rebuilds each full object when you ask for it. The model you reason with never changes.
:::

::: context sha-1 The fingerprint machine and its weak spot
SHA-1 is a **hash function**: it takes any amount of data and returns a 160-bit number, scrambled so thoroughly that no one can work backwards or predict it. In 2017 researchers showed they could, with enormous computing effort, build two different PDF files with the same SHA-1 — a **collision**. Git responded by switching to a hardened version of SHA-1 that detects that kind of attack, and newer Git can create repositories that use the stronger SHA-256 instead (its hashes are 64 hex digits long). For everything in this module, the idea is the same: one content, one name.
:::

::: context hexadecimal Counting in sixteens
Everyday numbers use ten digits, 0 to 9. **Hexadecimal** ("hex") uses sixteen: 0 to 9, then `a`=10, `b`=11, up to `f`=15. Each hex digit stands for exactly 4 bits, so 40 hex digits hold $40 \times 4 = 160$ bits — the size of a SHA-1 hash. That is about $1.46 \times 10^{48}$ possible names, which is why two different contents never land on the same hash by accident. A short prefix like `3cb1d56` (7 digits, 28 bits) is usually enough to be unique in one repository.
:::

::: context zlib Why cat shows gibberish
Every loose object is squeezed with **zlib**, the same compression used inside `.zip` and `.png` files, before it is written. Python can undo it. For the README blob, the 58 bytes on disk decompress to `blob 48\0# orbit-sim\n\nA tiny point-mass orbit simulator.\n` — the header Git fingerprinted, then the content:

```python
import zlib
raw = open(".git/objects/3c/b1d563f99ecac031dffc44285e893190c81d3f", "rb").read()
print(zlib.decompress(raw))   # b'blob 48\x00# orbit-sim\n\nA tiny point-mass orbit simulator.\n'
```

`git cat-file -p` does this decompression for you, and then strips the header.
:::

::: context file-mode The six-digit mode
The mode is borrowed from Unix file permissions, which you met in the shell module. Git only uses a few values: `100644` for an ordinary file, `100755` for a file with the execute bit set (a script you can run), `120000` for a symbolic link, and `040000` for a tree. Git does not record read or write permissions beyond that one execute bit, so changing a file's other permission bits never creates a new commit.
:::

::: context unix-time Counting seconds since 1970
`1789396800` is a **Unix timestamp**: the number of seconds since midnight UTC on 1 January 1970. It is the same instant everywhere on Earth. The `-0500` after it records the author's time zone, five hours behind UTC, so Git can show the local clock time the author saw. Converting with Python, `datetime.fromtimestamp(1789396800, timezone.utc)` gives 14:40 UTC on 14 September 2026 — which is 09:40 at `-0500`. Satellite telemetry is stamped the same way, with a count from a fixed starting moment called an **epoch**.
:::

::: context object-graph-picture All eight objects
Arrows go from the object that names a hash to the object with that hash. The README blob is shared by both root trees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <rect x="10" y="10" width="120" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">commit 903724b</text>
  <text x="70" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Add README</text>
  <rect x="220" y="10" width="130" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">commit cf192ed</text>
  <text x="285" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Add gravity model</text>
  <line x1="220" y1="28" x2="132" y2="28" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="176" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">parent</text>
  <rect x="20" y="78" width="100" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">tree 16a6d97</text>
  <rect x="235" y="78" width="100" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">tree bffe485</text>
  <line x1="70" y1="46" x2="70" y2="76" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a1)"/>
  <line x1="285" y1="46" x2="285" y2="76" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a1)"/>
  <rect x="276" y="136" width="76" height="24" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="314" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">tree e0c2fdf</text>
  <rect x="20" y="184" width="100" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="201" font-size="11" text-anchor="middle" fill="#1f2a44">blob 3cb1d56</text>
  <rect x="135" y="184" width="100" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="185" y="201" font-size="11" text-anchor="middle" fill="#1f2a44">blob dcf32b5</text>
  <rect x="264" y="184" width="90" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="309" y="201" font-size="11" text-anchor="middle" fill="#1f2a44">blob b64772c</text>
  <line x1="70" y1="104" x2="70" y2="182" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="76" y="150" font-size="11" fill="#1d6fd1">README.md</text>
  <line x1="245" y1="104" x2="110" y2="182" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#a1)"/>
  <line x1="285" y1="104" x2="215" y2="182" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="230" y="172" font-size="11" fill="#1d6fd1">gravity.py</text>
  <line x1="325" y1="104" x2="325" y2="134" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#a1)"/>
  <text x="292" y="124" font-size="11" fill="#1d6fd1">tests</text>
  <line x1="314" y1="160" x2="314" y2="182" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#a1)"/>
</svg>
```

Blue labels are the names stored in the trees; the orange boxes hold contents only.
:::

::: context dag-picture A small commit DAG with its refs
Five commits, A to E, with every arrow pointing to a parent. Two people started from C: one wrote D, the other E. The branch files point at the tips, and HEAD points at a branch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="100" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">A</text>
  <circle cx="110" cy="100" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">B</text>
  <circle cx="180" cy="100" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">C</text>
  <circle cx="250" cy="70" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">D</text>
  <circle cx="250" cy="135" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">E</text>
  <line x1="94" y1="100" x2="58" y2="100" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a2)"/>
  <line x1="164" y1="100" x2="128" y2="100" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a2)"/>
  <line x1="235" y1="77" x2="197" y2="94" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a2)"/>
  <line x1="235" y1="128" x2="197" y2="107" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a2)"/>
  <text x="40" y="136" font-size="11" text-anchor="middle" fill="#6c7a93">root</text>
  <rect x="290" y="58" width="56" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="318" y="74" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="290" y1="70" x2="268" y2="70" stroke="#b4232c" stroke-width="1.5" marker-end="url(#a2)"/>
  <rect x="290" y="123" width="56" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="318" y="139" font-size="11" text-anchor="middle" fill="#b4232c">drag</text>
  <line x1="290" y1="135" x2="268" y2="135" stroke="#b4232c" stroke-width="1.5" marker-end="url(#a2)"/>
  <rect x="290" y="12" width="56" height="24" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">HEAD</text>
  <line x1="318" y1="36" x2="318" y2="56" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#a2)"/>
</svg>
```

Following arrows from D reaches C, B, A; from E, the same. Nothing can reach D from E.
:::
