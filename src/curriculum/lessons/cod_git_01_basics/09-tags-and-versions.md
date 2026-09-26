---
id: l09-tags-and-versions
title: Tags and semantic versioning
minutes: 19
covers:
  - Tags and semantic versioning
---

Lesson 01 opened with the most important question on launch day: *exactly which code is on the vehicle?* A commit hash answers it precisely, but nobody wants to say "we are flying `9782d93fcd5d5a6ddec0d5f83b915a5dd774b591`" in a readiness review. People want a name — "flight software 2.4.1" — that is short, that everyone can say out loud, and that points at one commit forever.

That name is a **tag**. This lesson shows how Git's tags work, how they differ from branches, and how to read and write the version numbers that go in them. The numbering rules, called **semantic versioning**, are used across the software world, and they carry a promise: from the number alone, a user can tell whether upgrading is safe.

## A tag is a name that does not move

In lesson 04 you learned that a branch is a sticky note on a commit, and that the note moves forward each time you commit. That is exactly what you want while work is going on.

A release is different. Once you have said "version 0.1.0 is *this* snapshot", that must stay true next week and in five years. So Git has a second kind of ref that **does not move**: the tag. Picture the difference between a bookmark you slide forward as you read (a branch) and a note in the margin written in ink (a tag).

Physically, a tag is a file under `.git/refs/tags/`, next to the branch files in `.git/refs/heads/`. Committing moves the branch you are on and [[never touches a tag|tag-vs-branch-picture]].

::: key Tag versus branch
A branch is a ref that moves forward with each commit; a tag is a ref meant never to move. Branches live in `.git/refs/heads/`, tags in `.git/refs/tags/`. Tags mark fixed points such as releases.
:::

## Two kinds of tag

Git has two kinds, and the difference is what the ref points at.

### Lightweight tags

A **lightweight tag** is a bare name for a commit — a branch that does not move, and nothing more. Make one with `git tag <name>`, optionally followed by the commit to tag (the default is HEAD). Maya wants a quick bookmark on the commit where she added the orbital period function:

```bash
git tag try-period 2659286
cat .git/refs/tags/try-period
git cat-file -t try-period
```

```text
265928653ae2a979c363d757e7d3c8e3302b0983
commit
```

The file holds a commit hash, exactly like a branch file. `git cat-file -t` ("type") confirms the name leads straight to a commit.

### Annotated tags

An **annotated tag** is a full Git object — the fourth object type from lesson 01 — with its own tagger, date and message. Make one with `-a` ("annotate") and a message with `-m`:

```bash
git tag -a v0.1.0 -m "First release: point-mass gravity, circular and escape speed"
cat .git/refs/tags/v0.1.0
git cat-file -t v0.1.0
git cat-file -p v0.1.0
```

```text
ce0302f2deb2cb514a36f5ea096c0424f8102d91
tag
object 9782d93fcd5d5a6ddec0d5f83b915a5dd774b591
type commit
tag v0.1.0
tagger Maya Chen <maya@example.com> 1790258400 -0500

First release: point-mass gravity, circular and escape speed
```

Look at the first two lines. For an annotated tag, the ref file holds the hash of a **tag object** (`ce0302f`), not of the commit, and `git cat-file -t` says `tag`, not `commit`. The tag object then names the commit (`object 9782d93…`), and records who made the tag, when (the timestamp in seconds since 1970, like a commit's), and why. The chain is ref → tag object → commit → tree → blobs.

Because it is an object, an annotated tag is content-addressed like everything else: change its message and it becomes a different object with a different hash.

::: key Lightweight versus annotated tags
`git tag name [commit]` makes a lightweight tag: a ref holding a commit hash, nothing else. `git tag -a name -m "msg" [commit]` makes an annotated tag: a ref pointing at a tag object that records the commit, tagger, date and message. Use annotated tags for releases.
:::

Why annotated for releases? Because a release needs the same things a commit needs: who made the call, when, and why. `git describe` (below) uses only annotated tags by default, and an annotated tag can be **[[signed|signed-tags]]** (`git tag -s`), so anyone can check that the release really came from the release engineer. Lightweight tags are for your own bookmarks.

## Working with tags

The outputs in this section were captured a little later in the story, after Maya's second release, `v0.1.1`, which the example below makes.

**Listing.** `git tag` lists all tags in alphabetical order. Give it a pattern with `-l` to filter, and `-n1` to show the first line of each annotated tag's message:

```bash
git tag -n1 -l "v0.1*"
```

```text
v0.1.0          First release: point-mass gravity, circular and escape speed
v0.1.1          Clearer error for bad radius
```

**Seeing one.** `git show v0.1.0` prints the tag's own header and message, then the commit it points at and that commit's diff:

```text
tag v0.1.0
Tagger: Maya Chen <maya@example.com>
Date:   Thu Sep 24 09:00:00 2026 -0500

First release: point-mass gravity, circular and escape speed

commit 9782d93fcd5d5a6ddec0d5f83b915a5dd774b591
Author: Maya Chen <maya@example.com>
Date:   Tue Sep 22 11:30:00 2026 -0500

    Explain how to run the tests
...
```

**In the log.** `git log --oneline --decorate` shows tags beside the commits they mark:

```text
8531fc7 (HEAD -> main) Point README at gravity.py
7ed081b Add surface_gravity helper
5ddfaee (tag: v0.1.1) Show repr of bad radius in accel error
9782d93 (tag: v0.1.0) Explain how to run the tests
b3fa7df Test escape speed against circular speed
```

**Visiting.** `git switch --detach v0.1.0` puts you on the tagged commit in **detached HEAD** (lesson 04), and `git status` says `HEAD detached at v0.1.0`. That is how you rebuild an old release exactly. A tag cannot be "on", the way you are on a branch, because it must not move when you commit.

**Deleting.** `git tag -d try-period` removes a tag (`Deleted tag 'try-period' (was 2659286)`). The commit is untouched; only the name goes.

**No duplicates.** Git refuses to reuse a name:

```bash
git tag -a v0.1.0 -m again
```

```text
fatal: tag 'v0.1.0' already exists
```

That refusal is the point. You *can* force it with `-f`, but see the warning below.

**Sharing.** `git push` does not send tags by default. You send one with `git push origin v0.1.0`, or all of them with `git push --tags`. The next module covers pushing properly.

::: warning Never move a tag that others have seen
Once a tag has left your machine, other people's clones have it, and Git will not quietly replace their copy when you change yours. If you "fix" `v1.2.0` to point at a different commit, two engineers can hold two different `v1.2.0`s, both certain they have the real one. On a flight program, that is exactly the configuration confusion tags exist to prevent. If a release is wrong, make a new one — `v1.2.1` — and say in its message what it fixes.
:::

## `git describe`: where am I, relative to the last release?

Between releases, it helps to have a readable name for *any* commit. **`git describe`** finds the nearest annotated tag behind HEAD and tells you how far you are from it:

```bash
git describe
```

```text
v0.1.1-2-g8531fc7
```

Read it in three parts: `v0.1.1` is the nearest tag; `2` is the number of commits since that tag; `g8531fc7` is `g` (for "git") followed by the short hash of HEAD. So this is "two commits after 0.1.1, at `8531fc7`". If HEAD is exactly on a tag, `describe` prints the tag alone. Add `--tags` to let it use lightweight tags too.

This string is how many teams **[[stamp their builds|describe-in-builds]]**. The build script runs `git describe`, bakes the result into the program, and the software reports it at startup — in a log, or in the first telemetry packet after boot. Then "which code is on the vehicle?" has a one-line answer that leads back to one exact commit.

::: example Cutting a patch release
Ravi reports that the error message from `accel` is hard to read when the radius is `nan`. Maya fixes it on `main` (one commit, `5ddfaee`, "Show repr of bad radius in accel error") and releases it.

**Step 1 — what kind of change is it?** A bug fix that changes no function's name, arguments or results for valid inputs. Under the rules in the next section, that is a **patch**: `0.1.0` becomes `0.1.1`.

**Step 2 — tag it.**

```bash
git tag -a v0.1.1 -m "Clearer error for bad radius"
```

**Step 3 — check.** `git log --oneline --decorate -2` shows `5ddfaee (HEAD -> main, tag: v0.1.1)` on top of `9782d93 (tag: v0.1.0)`: one commit between the two releases, as intended. `git describe` now prints exactly `v0.1.1`, because HEAD sits on the tag.

**Step 4 — keep working.** Two commits later, `git describe` prints `v0.1.1-2-g8531fc7`. The count is right: `7ed081b` and `8531fc7` are the two commits after `5ddfaee`.
:::

## Semantic versioning: a number that makes a promise

A version number could be anything — a date, a code name, a counter. **Semantic versioning** (**[[SemVer|semver-origin]]** for short) is a widely used set of rules that makes the number *mean* something. "Semantic" means "about meaning".

A version has three whole numbers separated by dots, **[[MAJOR.MINOR.PATCH|semver-anatomy]]**, such as `2.4.1`. Before you can number anything, you need to decide what your **public API** is: the parts other people's code is allowed to use. (**API**, "application programming interface", is the set of functions, arguments and results that other code calls.) For orbit-sim that is the functions in `gravity.py` — `accel`, `circular_speed`, `escape_speed` — and what they return. Then each release bumps exactly one number:

- **PATCH** goes up (`0.1.0` → `0.1.1`) for bug fixes that change no API. Anyone can upgrade without changing a line.
- **MINOR** goes up (`0.1.1` → `0.2.0`) when you **add** to the API in a backward-compatible way: a new function, a new optional argument. Old code keeps working. PATCH resets to 0.
- **MAJOR** goes up (`1.4.2` → `2.0.0`) when you make an **incompatible** change: remove or rename a function, change what its result means, change its units. Code that used it may break. MINOR and PATCH reset to 0.

The promise to users: *if the MAJOR number did not change, upgrading will not break you.* That is why the reset rule matters: `1.9.0` → `1.10.0` is a feature release, but `1.9.0` → `2.0.0` is a warning sign.

### Special cases

- **Major version zero** (`0.y.z`) means "early development: anything may change at any time". Our orbit-sim releases are `0.x` for that reason. **Version 1.0.0** is the moment you declare the public API stable and start keeping the promise.
- A **pre-release** adds a hyphen and labels after the three numbers: `2.0.0-alpha`, `2.0.0-beta.2`, `2.0.0-rc.1` ("release candidate 1"). It comes *before* the plain version: `2.0.0-rc.1` is older than `2.0.0`. A pre-release does not promise stability.
- **Build metadata** adds a plus sign: `2.0.0+build.117`. It is ignored when comparing versions; two versions differing only after the `+` count as equal.

The tag name is usually the version with a `v` in front — `v0.1.1` — a convention, not part of SemVer itself.

::: key Semantic versioning
MAJOR.MINOR.PATCH. Bump PATCH for backward-compatible bug fixes, MINOR for backward-compatible additions (reset PATCH), MAJOR for incompatible API changes (reset MINOR and PATCH). `0.y.z` is initial development; `1.0.0` declares a stable public API. A pre-release (`-rc.1`) sorts before its release; build metadata (`+…`) is ignored for ordering.
:::

::: example Numbering a year of orbit-sim
Start at `v0.2.0`. Suppose the team declares the API stable and releases `v1.0.0`. What does each later release become?

1. A fix: `circular_speed` returned the wrong value for radii given in kilometres by mistake in one test helper; the public functions are unchanged. **Patch** → `1.0.1`.
2. A new function `orbital_period(r)` is added. Nothing old changes. **Minor** → `1.1.0` (PATCH resets to 0).
3. Another new function, `j2_accel(r, lat)`. **Minor** → `1.2.0`.
4. A bug in `escape_speed` for $r \le 0$ is fixed by raising `ValueError` (as `accel` already does). Valid inputs give the same results. **Patch** → `1.2.1`.
5. The team renames `accel(r)` to `gravity_accel(r)` and removes the old name. Any code calling `accel` now fails. **Major** → `2.0.0` (MINOR and PATCH reset).
6. Before shipping `2.0.0`, they publish a candidate for testing: that tag is `v2.0.0-rc.1`, and it sorts before `v2.0.0`.

**Check.** Only one step broke existing callers (step 5), and only one release has a new MAJOR number. A user on `1.0.1` could have upgraded to `1.2.1` blind; upgrading to `2.0.0` needed reading the release notes, which is exactly the warning SemVer is built to give.
:::

::: warning Changing units is a breaking change
Suppose version `1.2.1` of a guidance library returns thrust in newtons, and `1.2.2` "fixes" it to return kilonewtons. No function name changed, the code runs, the tests may even pass — and every caller is now wrong by a factor of 1,000. A change in what a result *means* is an incompatible API change, so it needs a new MAJOR version, however small the diff looks. A unit mix-up between two teams' software is exactly how NASA lost the **[[Mars Climate Orbiter|mars-climate-orbiter]]** in 1999.
:::

## Sorting version tags

Git lists tags alphabetically, as text. [[Text order|text-sort]] is not version order. With tags `v0.1.0`, `v0.1.1`, `v0.2.0`, `v0.2.0-rc.1`, `v0.9.0` and `v0.10.0`:

```bash
git tag -l "v0.*"
```

```text
v0.1.0
v0.1.1
v0.10.0
v0.2.0
v0.2.0-rc.1
v0.9.0
```

`v0.10.0` lands after `v0.1.1`, because text comparison looks at one character at a time and `1` comes before `2`. Ask for **version sort** with `--sort=v:refname`, which compares the numbers as numbers:

```bash
git tag -l --sort=v:refname "v0.*"
```

```text
v0.1.0
v0.1.1
v0.2.0
v0.2.0-rc.1
v0.9.0
v0.10.0
```

Better — but the release candidate still comes *after* its release, which SemVer says is backwards. Tell Git that `-rc` marks a pre-release with the setting `versionsort.suffix`:

```bash
git -c versionsort.suffix=-rc tag -l --sort=v:refname "v0.*"
```

```text
v0.1.0
v0.1.1
v0.2.0-rc.1
v0.2.0
v0.9.0
v0.10.0
```

Now the order is SemVer's. (`git -c name=value` sets a configuration value for one command; `git config --global versionsort.suffix -rc` would make it permanent.)

## Check yourself

::: check Which bump?
orbit-sim is at `v1.3.2`. Name the next version for each change on its own: (a) the docstring of `accel` is corrected; (b) `circular_speed` gains an optional argument `mu=MU_EARTH` so it works for Mars; (c) `escape_speed` now returns km/s instead of m/s; (d) a first test build of the Mars change goes out for review before the release.
:::

::: answer
(a) `v1.3.3`: no API change, so a patch. (b) `v1.4.0`: a backward-compatible addition, because old calls `circular_speed(r)` still work; PATCH resets to 0. (c) `v2.0.0`: the function's name is the same, but the meaning of its result changed, so every caller breaks; MINOR and PATCH reset. (d) A pre-release of the minor version, such as `v1.4.0-rc.1`, which sorts before `v1.4.0`.
:::

::: check Read the describe string
A build of the flight software reports `v3.2.0-14-g0e41c7a` in its startup telemetry. What does that tell you, and how do you get to the exact source?
:::

::: answer
It was built from commit `0e41c7a`, which is 14 commits after the nearest annotated tag, `v3.2.0`. So it is *not* a release build; it contains 14 commits of unreleased work. `git switch --detach 0e41c7a` (or `git show 0e41c7a`) takes you to exactly that source, and `git log --oneline v3.2.0..0e41c7a` lists the 14 commits.
:::

::: check Where does the arrow go?
You run `git tag v2.0.0` and `git tag -a v2.0.1 -m "Fix"` on two commits. For each, what hash is stored in its file under `.git/refs/tags/`, and what does `git cat-file -t` say?
:::

::: answer
`v2.0.0` is lightweight: its file holds the commit's hash, and `git cat-file -t v2.0.0` says `commit`. `v2.0.1` is annotated: its file holds the hash of a tag object, and `git cat-file -t v2.0.1` says `tag`. Printing that object with `git cat-file -p` shows an `object` line with the commit's hash, then the tagger, date and message.
:::

::: check The re-tag
A colleague tagged `v4.1.0`, pushed it, then found a typo in a config file. They propose `git tag -f -a v4.1.0` on the fixed commit and pushing again. What goes wrong, and what should they do?
:::

::: answer
Everyone who already fetched `v4.1.0` keeps the old tag, pointing at the old commit; Git does not overwrite an existing tag in a clone because the server's copy changed. Now two different snapshots are both called `v4.1.0`, and a test report or a flight log that says "4.1.0" no longer identifies one build. They should leave `v4.1.0` alone, commit the fix, and tag `v4.1.1` with a message saying what it corrects.
:::

::: check Sort these
Put these in SemVer order, oldest first: `1.10.0`, `1.2.0`, `1.10.0-rc.2`, `1.2.0+build.7`, `1.10.0-rc.10`, `1.9.3`.
:::

::: answer
`1.2.0` and `1.2.0+build.7` (equal in order: build metadata is ignored), then `1.9.3`, then `1.10.0-rc.2`, `1.10.0-rc.10`, and finally `1.10.0`. Compare MAJOR, then MINOR, then PATCH as whole numbers, so 10 comes after 9. Pre-releases come before their release, and within the pre-release label, the numeric part `rc.2` versus `rc.10` is also compared as a number, so `rc.2` is first.
:::

## Summary

| Command or rule | Meaning |
| --- | --- |
| `git tag name [commit]` | lightweight tag: ref → commit |
| `git tag -a name -m "msg" [commit]` | annotated tag: ref → tag object (tagger, date, message) → commit |
| `git tag -l "v1.*"`, `-n1` | list matching tags, with first message line |
| `git show v1.0.0` | tag header and message, then the commit |
| `git tag -d name` | delete the name only |
| `git push origin v1.0.0` | tags are not pushed by default |
| `git describe` | nearest annotated tag, commits since, `g` + short hash |
| `--sort=v:refname`, `versionsort.suffix=-rc` | sort tags as versions, with release candidates first |
| MAJOR.MINOR.PATCH | incompatible change / compatible addition / compatible fix |
| `0.y.z`, `1.0.0`, `-rc.1`, `+meta` | unstable; stable API declared; pre-release (sorts first); ignored for ordering |

Tags give you fixed points in history. The last lesson of the module uses fixed points to hunt: given one commit you know is good and one you know is bad, `git bisect` finds the commit in between that broke things, in a handful of steps.

::: context tag-vs-branch-picture A branch moves, a tag stays
Two commits after tagging `v0.1.1`, the branch `main` has moved forward twice. The tags have not moved at all. The annotated tag goes through its own tag object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="tb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <circle cx="40" cy="80" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">9782</text>
  <circle cx="120" cy="80" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">5dda</text>
  <circle cx="200" cy="80" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">7ed0</text>
  <circle cx="280" cy="80" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">8531</text>
  <line x1="104" y1="80" x2="58" y2="80" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#tb)"/>
  <line x1="184" y1="80" x2="138" y2="80" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#tb)"/>
  <line x1="264" y1="80" x2="218" y2="80" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#tb)"/>
  <rect x="252" y="16" width="56" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="280" y="32" font-size="11" text-anchor="middle" fill="#b4232c">main</text>
  <line x1="280" y1="40" x2="280" y2="61" stroke="#b4232c" stroke-width="1.5" marker-end="url(#tb)"/>
  <rect x="10" y="126" width="60" height="24" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">v0.1.0</text>
  <line x1="40" y1="126" x2="40" y2="99" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#tb)"/>
  <rect x="90" y="126" width="60" height="24" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">v0.1.1</text>
  <line x1="120" y1="126" x2="120" y2="99" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#tb)"/>
  <text x="200" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">tags: fixed</text>
  <text x="200" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">branch: moves right</text>
</svg>
```

For simplicity the drawing points each tag straight at its commit; for these annotated tags there is a tag object in between.
:::

::: context signed-tags Proving who made a release
A **signed tag** carries a digital signature made with the release engineer's private key (GPG or, in newer Git, an SSH key). Anyone with the matching public key can run `git tag -v v2.0.0` to check two things: the tag really was made by that person, and neither the tag nor the commit it names has been altered since. For flight software, where a ground station must be sure it is uploading the approved build, signed tags and signed builds are part of the chain of trust from the repository to the vehicle.
:::

::: context describe-in-builds Why builds carry their own name
Imagine a test engineer reports "the gimbal controller oscillated in run 42". If the log says only "flight software, latest", nobody can reproduce the run. If it says `v3.2.0-14-g0e41c7a`, anyone can check out that exact commit and rebuild the same code. In configuration management, being able to say which version of everything was used in every test is called **traceability**, and on a flight program it is a hard requirement, checked in reviews before launch. A build that reports its own `git describe` string makes traceability nearly automatic.
:::

::: context semver-origin Who wrote the rules
Semantic versioning was written up by Tom Preston-Werner, one of the founders of GitHub, as a short public specification at semver.org. It did not invent the idea of major and minor numbers, which programmers had used loosely for decades; it pinned down exactly what each bump promises, so that tools could rely on it. Package managers for Python, JavaScript, Rust and many other languages read version numbers this way when they decide which upgrades are safe to install automatically. The current specification is, fittingly, version 2.0.0.
:::

::: context semver-anatomy The parts of a version string
Each part of a full SemVer string has one job. Only the three numbers and the pre-release label decide which version counts as newer; build metadata is ignored.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="40" height="34" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="30" y="37" font-size="16" text-anchor="middle" fill="#b4232c">2</text>
  <text x="58" y="37" font-size="16" text-anchor="middle" fill="#1f2a44">.</text>
  <rect x="66" y="14" width="40" height="34" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="86" y="37" font-size="16" text-anchor="middle" fill="#1d6fd1">4</text>
  <text x="114" y="37" font-size="16" text-anchor="middle" fill="#1f2a44">.</text>
  <rect x="122" y="14" width="40" height="34" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="142" y="37" font-size="16" text-anchor="middle" fill="#1f2a44">1</text>
  <rect x="172" y="14" width="80" height="34" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="212" y="37" font-size="16" text-anchor="middle" fill="#1f2a44">-rc.1</text>
  <rect x="262" y="14" width="88" height="34" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="306" y="37" font-size="16" text-anchor="middle" fill="#6c7a93">+b117</text>
  <text x="30" y="68" font-size="11" text-anchor="middle" fill="#b4232c">MAJOR</text>
  <text x="86" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">MINOR</text>
  <text x="142" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">PATCH</text>
  <text x="212" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">pre-release</text>
  <text x="306" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">build metadata</text>
  <text x="30" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">breaks</text>
  <text x="86" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">adds</text>
  <text x="142" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">fixes</text>
  <text x="212" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">sorts earlier</text>
  <text x="306" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">not compared</text>
</svg>
```

Break the API: raise MAJOR. Add to it: raise MINOR. Fix it: raise PATCH.
:::

::: context mars-climate-orbiter A spacecraft lost to units
In September 1999, NASA's Mars Climate Orbiter was lost as it arrived at Mars. Ground software from one team reported thruster impulse in pound-force seconds, while the navigation software that used those numbers expected newton-seconds, a factor of about 4.45 apart. Small navigation errors built up over the months of cruise, and the spacecraft flew far too deep into the Martian atmosphere. The investigation board's report made unit agreement between software interfaces a lesson for the whole industry — and a reason to treat a change of units as the most serious kind of change.
:::

::: context text-sort Why text order fails for numbers
Text sorting compares strings one character at a time, from the left, and stops at the first difference. For `v0.10.0` and `v0.2.0`, the first four characters `v0.` and then `1` versus `2` decide it: `1` comes first, so `v0.10.0` sorts before `v0.2.0`, even though 10 is bigger than 2. Version sorting instead splits out each run of digits and compares it as a whole number. The same trap catches file names like `run_9.csv` and `run_10.csv`, which is why many telemetry pipelines pad numbers with zeros: `run_0009.csv`, `run_0010.csv`.
:::
