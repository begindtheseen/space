---
id: l08-release-branches-and-changelogs
title: Release branches, tags and changelogs
minutes: 22
covers:
  - Release branches, tags, semantic versioning, changelogs
---

In the basics module (lesson 09) you learned to put a tag on a commit and give it a version number that makes a promise: `v1.4.0` means "these exact files", and the jump from `1.3` to `1.4` means "new features, nothing broken". That was enough while orbit-sim had one line of history and one person deciding when to release.

Real releases are messier. A flight software build goes to a hardware-in-the-loop test bench and is tested for three weeks; meanwhile the team keeps merging new work into `main` every day. A vehicle in orbit runs version 1.4 for two years while the ground team develops 2.0. Somebody asks "is the slew-rate fix in the build we flew?" and needs an answer in one minute, with evidence.

This lesson covers the three tools that handle that: **release branches**, which hold a version still while `main` moves on; **tags on the release line**, which mark each build that leaves the building; and the **changelog**, which tells the people who use a release what changed and why they should care.

## Why a release needs its own branch

Picture a school yearbook. For months, everyone edits the shared draft. Then the day comes to send it to the printer. You do not stop the whole school from writing — next year's book can start — but you also cannot let new pages sneak into the copy at the printer. So you make a copy for the printer, and from then on that copy only gets typo fixes.

A **release branch** is that copy. It is a branch cut from `main` at the moment a version is chosen, usually named for the version line, such as `release/1.4`. From then on:

- **Only fixes go on it.** No new features, no refactors, no "small improvements". Every change is a risk to a build that is being tested, so each one must earn its place.
- **`main` keeps moving.** New features merge into `main` as usual, heading for the next version.
- **Every build from it gets a tag.** `v1.4.0-rc.1`, `v1.4.0`, later `v1.4.1` — all on the release branch.

Why not freeze `main` instead? Because a **[[code freeze|code-freeze]]** on `main` stops the whole team for the length of the test campaign. With a release branch, only the release is frozen; everyone else keeps working. This is the "release branches on trunk" hybrid from lesson 05, and it is the part of GitFlow almost every team keeps.

::: key Release branch
A release branch (for example `release/1.4`) is cut from `main` when a version is chosen. It receives only fixes, never features; every build from it is tagged (`v1.4.0-rc.1`, `v1.4.0`, `v1.4.1`, …); and `main` continues toward the next version.
:::

::: warning A release branch is not a second main
The moment someone merges a feature into `release/1.4` "because the customer wants it in this version", the release branch has become a second development line, and its test results no longer describe what it contains. If a feature is truly needed, it is a new version: cut `release/1.5` from `main`.
:::

## Cutting the branch and tagging a candidate

Here is orbit-sim with five commits since `v1.3.0`. The team decides that everything up to and including the README update is version 1.4.

::: example Cutting release 1.4
**Step 1 — choose the commit.** Usually it is the tip of `main` at the chosen moment; it can be an older commit, as long as its checks passed. Maya is on `main` at `083fbce docs: describe attitude helpers`.

**Step 2 — make the branch and share it.**

```bash
git switch -c release/1.4
git push -u origin release/1.4
```

```text
Switched to a new branch 'release/1.4'
To /srv/git/orbit-sim.git
 * [new branch]      release/1.4 -> release/1.4
branch 'release/1.4' set up to track 'origin/release/1.4'.
```

**Step 3 — tag the first release candidate.** Nothing is promised yet, so it is a pre-release (basics lesson 09): `-rc.1`, which sorts before `1.4.0`. Tags are not pushed by default, so push it by name:

```bash
git tag -a v1.4.0-rc.1 -m "orbit-sim 1.4.0, release candidate 1"
git push origin v1.4.0-rc.1
```

```text
To /srv/git/orbit-sim.git
 * [new tag]         v1.4.0-rc.1 -> v1.4.0-rc.1
```

**Step 4 — test the candidate, then promote it.** The test campaign runs on exactly `v1.4.0-rc.1`. Meanwhile Ravi and Maya merge two new features into `main`. Ten days later the campaign passes with no changes needed, so the *same commit* becomes the release:

```bash
git tag -a v1.4.0 -m "orbit-sim 1.4.0" release/1.4
git push origin v1.4.0
git log --oneline --graph --all --decorate
```

```text
* 041e746 (HEAD -> main, origin/main) feat: add orbital period helper
* be66d39 feat!: rename accel() to gravity_accel()
* 083fbce (tag: v1.4.0-rc.1, tag: v1.4.0, origin/release/1.4, release/1.4) docs: describe attitude helpers
* 73c2fee fix: compare slew rate in rad/s, not deg/s
* 62b8368 feat: add quaternion-to-DCM conversion
* 6d3fee0 feat: add exponential atmosphere drag model
* 7cf1b2b (tag: v1.3.0) feat: add point-mass gravity model
```

**Sanity check.** Two tags sit on `083fbce`: the candidate and the release. That is exactly right: the build that was tested *is* the build that is released, down to the last byte. Rebuilding anything for "the real release" would throw away the test results. The two new features on `main` are not in 1.4, and the `feat!` one could not be (it breaks the API, so it belongs in 2.0.0).
:::

Notice that the graph is still a straight line. `release/1.4` has no commits of its own yet, so it is a pointer partway down `main`'s history. It will only fork visibly when the first fix lands on it. The [[release-line picture|release-picture]] shows what that looks like a few months on.

On the server, protect `release/*` the same way as `main` (lesson 06): pull requests only, required checks, no force pushes. Many teams also put a release manager in CODEOWNERS for the release branches, so nothing lands without their approval.

## Fixes: which way do they flow?

A bug found during the test campaign must be fixed on the release branch — and also on `main`, or 1.5 will ship with it again. There are two common policies:

- **Fix on `main` first, then carry the fix to the release branch.** The fix is reviewed and tested where all new work is, and `main` never misses it. The carrying is done with `git cherry-pick`, which copies one commit onto another branch. This is the most common policy in trunk-based teams, and it is the whole of the next lesson.
- **Fix on the release branch, then merge the release branch back into `main`.** This is GitFlow's rule (lesson 05). No copies are made, but every release branch must be merged forward faithfully.

Either way, the rule that matters is: **no fix exists on only one line by accident.** Each patch release on the branch gets its own PATCH bump — `v1.4.1`, `v1.4.2` — because a fix with no interface change is exactly what PATCH means.

## Asking the history questions

Tags and branches let you answer release questions from the command line in seconds.

**"What is this build?"** `git describe` (basics lesson 09) names the nearest tag:

```bash
git describe release/1.4
git describe main
```

```text
v1.4.0
v1.4.0-2-g041e746
```

The release branch is exactly on `v1.4.0`. `main` is two commits past it. (When two tags sit on the same commit, as here, `describe` picks the more recently made one.)

**"Which releases contain this fix?"** `git tag --contains <commit>` lists every tag whose history includes the commit:

```bash
git tag --contains 73c2fee
```

```text
v1.4.0
v1.4.0-rc.1
```

So the slew-rate fix is in 1.4.0 and its candidate, and, equally important, it is not in 1.3.0. For branches, `git branch -a --contains` does the same. Asking it about the breaking rename:

```bash
git branch -a --contains be66d39
```

```text
* main
  remotes/origin/main
```

The rename is on `main` only, not on `release/1.4`. That is the kind of [[evidence a review board wants|vdd]]: not "I think so", but a command anyone can rerun.

::: key Release questions in one line each
`git describe <branch>` names the nearest tag and the distance from it. `git tag --contains <commit>` lists the releases that include a commit; `git branch -a --contains <commit>` lists the branches. `git log --oneline vA..vB` lists what changed between two releases.
:::

::: warning A tag on the release branch is invisible from main
Suppose `v1.4.1` is tagged on a fix commit that exists only on `release/1.4`. Then `git describe main` still says `v1.4.0-…`, and `git tag --merged main` does not list `v1.4.1`, because that commit is not in `main`'s history. That is correct — `main` does not contain the 1.4.1 build — but it surprises people who expect "the newest tag" to show up everywhere.
:::

## How many release lines?

Every release branch you keep alive is a line you must fix, build and test. So teams decide on purpose how many versions they **support** — promise fixes for — and for how long. A web service with one running version keeps none for long: it deploys from `main` and at most keeps last week's branch for an emergency. A library used by many projects may support the newest two MINOR lines. A spacecraft keeps a release line for the whole mission, because the flying software can only be changed by an upload that has been tested exactly — so `release/1.4` may live for a decade, with a handful of carefully chosen fixes. Some ecosystems name their long-lived lines **[[LTS|lts]]**.

When a line reaches its **end of life**, say so in the README and the changelog, stop merging into it, and leave the branch and its tags in place. Tags are history; deleting them erases the answer to "what did we ship?"

## Changelogs: the release for humans

`git log` is written for the people who changed the code. A **changelog** is written for the people who *use* it: a file, usually `CHANGELOG.md` in the repository root, listing for each version what changed that a user needs to know. The mission operations team reading it before an upload does not care that Leo "tidied up a helper". They care that the slew limit is now enforced correctly, and that a function they call was renamed.

The most widely used layout is **[[Keep a Changelog|keep-a-changelog]]**. Its rules, in short:

- **Newest version first**, each as a heading with the version and the release date in `YYYY-MM-DD` form.
- An **`Unreleased`** section at the top collects changes already merged into `main` but not yet released. At release time, it is renamed to the new version.
- Within a version, entries are grouped by kind: **Added** (new features), **Changed** (changes in existing behavior), **Deprecated** (still works, will be removed), **Removed**, **Fixed** (bug fixes), and **Security**.
- Entries are written for users, in plain words, and say what they need to do if anything.

There is a neat match with semantic versioning. Anything under Removed, or a Changed entry that breaks callers, means MAJOR. Added or Deprecated means at least MINOR. Only Fixed means PATCH. If the changelog and the version number disagree, one of them is wrong.

::: key Changelog
A changelog (`CHANGELOG.md`) lists, per version and newest first, the changes users need to know, grouped as Added, Changed, Deprecated, Removed, Fixed and Security, with an `Unreleased` section on top. Breaking Changed/Removed entries require a MAJOR bump, Added a MINOR, Fixed-only a PATCH.
:::

### Getting the raw material from Git

You do not write a changelog from memory. Git lists what went into a release — the two-dot range from lesson 01, between two tags:

```bash
git log --oneline --no-merges v1.3.0..v1.4.0
```

```text
083fbce docs: describe attitude helpers
73c2fee fix: compare slew rate in rad/s, not deg/s
62b8368 feat: add quaternion-to-DCM conversion
6d3fee0 feat: add exponential atmosphere drag model
```

`--no-merges` leaves out merge commits, which say "Merge pull request #…" and nothing a user needs. **`git shortlog`** groups the same commits by author, which is handy for release notes that thank contributors:

```bash
git shortlog v1.3.0..v1.4.0
```

```text
Leo Park (2):
      feat: add quaternion-to-DCM conversion
      fix: compare slew rate in rad/s, not deg/s

Maya Chen (1):
      docs: describe attitude helpers

Ravi Patel (1):
      feat: add exponential atmosphere drag model
```

### Commit messages that sort themselves

Look at those subjects: each starts with a word and a colon. That is a convention called **[[Conventional Commits|conventional-commits]]**: the subject begins with a *type* — `feat` for a new feature, `fix` for a bug fix, and others such as `docs`, `test`, `refactor` that do not affect users — then a colon and the description. A `!` after the type (`feat!:`), or a footer line starting `BREAKING CHANGE:`, marks a change that breaks the API.

The types line up with SemVer: `fix` → PATCH, `feat` → MINOR, `!` or `BREAKING CHANGE` → MAJOR. So the log can sort itself. `--grep` keeps only commits whose message matches a pattern:

```bash
git log --format='- %s (%h)' --grep='^fix' v1.3.0..v1.4.0
```

```text
- fix: compare slew rate in rad/s, not deg/s (73c2fee)
```

(`--format='- %s (%h)'` prints a dash, the subject and the short hash — a ready-made list item.) Tools such as release-please and semantic-release go further and write the changelog and pick the next version automatically. Even then, a human should read the result: a commit subject is written for developers, and "fix: compare slew rate in rad/s" needs one more sentence before a mission operator knows what it means for them.

::: example Writing the 1.4.0 changelog
**Step 1 — gather.** The log above: two `feat`, one `fix`, one `docs`.

**Step 2 — sort into sections.** The two `feat` commits go under Added. The `fix` goes under Fixed. The `docs` commit changes no behavior; skip it, or mention it only if users would look for it.

**Step 3 — rewrite for users.** Say what changed *for them*, with units, and what to do.

```markdown
# Changelog

## [Unreleased]

## [1.4.0] - 2026-10-05

### Added
- `drag.py`: exponential-atmosphere density and drag acceleration (SI units).
  Valid below about 100 km altitude.
- `attitude.py`: quaternion (scalar-first, `[w, x, y, z]`) to DCM `C_bi`,
  and the Sun direction in body axes.

### Fixed
- The slew check now compares rates in rad/s. Before this fix the effective
  limit was 2 rad/s (about 114.6 deg/s) instead of 2 deg/s, so
  over-limit slews were not flagged.

## [1.3.0] - 2026-09-01
...
```

**Step 4 — check the number.** Added entries and a fix, nothing Removed, no breaking change: MINOR, so `1.3.0` → `1.4.0`. The changelog and the version agree.

**Sanity check.** Someone who reads only this file learns the two things that could hurt them: which quaternion order the new code expects, and that older builds under-enforced the slew limit by a factor of about 57. Neither fact was in the commit subjects alone.
:::

::: example What does main become?
The Unreleased section needs a version number too. The commits on `main` since `v1.4.0`:

```bash
git log --oneline v1.4.0..main
```

```text
041e746 feat: add orbital period helper
be66d39 feat!: rename accel() to gravity_accel()
```

**Step 1 — find the biggest change.** One `feat` (MINOR) and one `feat!` (MAJOR). The biggest wins.

**Step 2 — bump.** From `1.4.0`, a MAJOR bump gives `2.0.0`: MAJOR goes up by one, MINOR and PATCH reset to zero.

**Step 3 — write the entry.** The rename goes under **Changed** with instructions ("`accel(r)` is now `gravity_accel(r)`; replace calls"), or better, under **Deprecated** in a 1.5.0 first, keeping `accel` as an alias that warns, and **Removed** in 2.0.0. That gives users one version to migrate.

**Check.** Had the rename been left out of the version decision, the team would have shipped a breaking change as `1.5.0` — the exact broken promise basics lesson 09 warned about.
:::

## Check yourself

::: check Freeze or branch?
Your team plans a four-week test campaign on version 3.2. One engineer suggests "no merges to `main` for four weeks so we don't disturb the test build". What do you propose instead, and what may go onto the new branch?
:::

::: answer
Cut `release/3.2` from `main` at the chosen commit and tag `v3.2.0-rc.1` for the campaign. The campaign tests that tag; `main` stays open for everyone. Only fixes to problems found in 3.2 go onto `release/3.2`, each also landing on `main` (fixed on `main` and cherry-picked, or merged forward), and each new build from the branch gets a new tag (`v3.2.0-rc.2`, then `v3.2.0`).
:::

::: check Same commit, two tags
Why is it good that `v1.4.0-rc.1` and `v1.4.0` point at the same commit? What would be wrong with making a new commit "Release 1.4.0" that changes a version string, and tagging that instead?
:::

::: answer
It proves the released build is byte-for-byte the build that passed the test campaign. A new commit, even one that only edits a version string, is a different snapshot; strictly, it was never tested. Many teams avoid version-string commits entirely by stamping the build from `git describe` (basics lesson 09), so promoting a candidate is only a new tag.
:::

::: check Was it in the flight build?
The vehicle is flying `v2.1.3`. An engineer claims the fix `9e1f0aa` ("fix: guard against zero-norm quaternion") is on board. Which command settles it, and what output would prove it?
:::

::: answer
`git tag --contains 9e1f0aa`. If `v2.1.3` appears in the list, the fix is in that build's history. If it does not, the fix is not on board, whatever anyone remembers. (`git merge-base --is-ancestor 9e1f0aa v2.1.3`, which answers with its exit code, is the script-friendly version.)
:::

::: check Sort the commits
Since `v2.3.1` the log says: `fix: handle NaN in slew check`, `docs: add frame diagram`, `feat: add ECEF-to-ECI rotation`, `test: cover 2.1 deg/s case`. What is the next version, and which changelog sections get entries?
:::

::: answer
The largest change is a `feat`, and nothing is marked breaking, so MINOR: `2.4.0` (PATCH resets). Changelog: **Added** — ECEF-to-ECI rotation; **Fixed** — NaN handling in the slew check. The `docs` and `test` commits change no behavior for users, so they usually get no entry.
:::

::: check Where did 1.4.1 go?
After tagging `v1.4.1` on `release/1.4`, a teammate runs `git describe` on `main` and gets `v1.4.0-37-g…`. They think the tag was lost. What do you tell them?
:::

::: answer
The tag is fine. `v1.4.1` sits on a commit that exists only on `release/1.4`, so it is not in `main`'s history, and `describe` only looks at tags it can reach by following parents from `main`. `git tag --merged release/1.4` lists it; `git tag --merged main` does not. `main` really does not contain the 1.4.1 build (though it should contain an equivalent of its fix).
:::

## Summary

| Idea | In one line |
| --- | --- |
| Release branch | `release/1.4` cut from `main`; fixes only; `main` keeps moving |
| Candidate, then release | tag `v1.4.0-rc.1`, test it, tag the same commit `v1.4.0` |
| Pushing tags | `git push origin v1.4.0` (tags are not pushed by default) |
| Fix flow | fix on `main` then cherry-pick (next lesson), or fix on release and merge forward |
| Patch releases | `v1.4.1`, `v1.4.2` on the release branch |
| `git describe <branch>` | nearest reachable tag, commits since, short hash |
| `git tag --contains <c>` | which releases include commit `c` |
| `git log --oneline --no-merges vA..vB` | what went into a release; `git shortlog` groups it by author |
| Changelog | per version, newest first: Added, Changed, Deprecated, Removed, Fixed, Security; `Unreleased` on top |
| Conventional Commits | `fix:` → PATCH, `feat:` → MINOR, `!` or `BREAKING CHANGE:` → MAJOR |

A release branch is only useful if fixes can reach it without dragging `main`'s new features along. Next lesson shows the tool for that: `git cherry-pick`, which copies one commit onto another branch — and the bookkeeping that keeps the copy traceable to the original.

::: context code-freeze What a code freeze costs
A **code freeze** is a period when no changes may be merged, usually before a release. Some teams freeze all of `main`; the cost is that everyone's work piles up in branches for the whole freeze, and the day it lifts brings exactly the pile of big merges that lesson 05 warned about. A release branch moves the freeze to where it belongs: the release is frozen, the team is not. Flight programs often still have a formal freeze on the *release line* before a critical event such as launch, controlled by a change board that must approve every fix.
:::

::: context release-picture A release line, a few months on
`release/1.4` forks from `main` where 1.4 was chosen. Fixes land on it and each build is tagged. `main` carries on toward 2.0.0. The dashed arrows are fixes copied from `main` to the release line (next lesson).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="rp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#6c7a93"/>
    </marker>
  </defs>
  <text x="10" y="54" font-size="11" fill="#1d6fd1">main</text>
  <line x1="50" y1="50" x2="350" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="70" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="110" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="170" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="230" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="290" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="340" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="340" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">v2.0.0</text>
  <text x="10" y="124" font-size="11" fill="#b4232c">release/1.4</text>
  <path d="M110,50 Q130,120 170,120" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="170" y1="120" x2="330" y2="120" stroke="#b4232c" stroke-width="2"/>
  <text x="110" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">v1.4.0</text>
  <circle cx="230" cy="120" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="230" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">v1.4.1</text>
  <circle cx="300" cy="120" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">v1.4.2</text>
  <line x1="172" y1="56" x2="226" y2="113" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#rp)"/>
  <line x1="232" y1="56" x2="296" y2="113" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#rp)"/>
</svg>
```

Each orange dot is a patch release made only of fixes. None of the features added to `main` after the fork ever reach the release line.
:::

::: context vdd Proving what flew
Flight programs formalize "what exactly is in this build?" in a document often called a **Version Description Document**: the version identifier, the exact source it was built from, the changes since the previous version, the known open problems, and how it was built. NASA and defense software standards have required documents like this for decades. With tags, `git describe`, `git log vA..vB` and `git tag --contains`, most of it can be generated from the repository instead of typed by hand — and then anyone can check it by rerunning the same commands.
:::

::: context lts Long-term support
**LTS**, for **long-term support**, labels a release line that its makers promise to fix for longer than usual. Ubuntu's LTS releases, for example, get five years of standard security updates, while its other releases get about nine months. Python keeps each version in its support cycle for about five years. The label is a promise about *effort*: every supported line is a branch someone must build, test and patch. A spacecraft's flight software line is the extreme case — supported for the life of the mission, sometimes decades, as with the Voyager probes.
:::

::: context keep-a-changelog Where the format comes from
**Keep a Changelog** is a short public guide started by Olivier Lacan in 2014, now available in many languages. Its opening argument is that a changelog is for humans, not machines, and that dumping the commit log into a file is not a changelog, because commit messages are written for a different audience. The section names it proposes — Added, Changed, Deprecated, Removed, Fixed, Security — have become a common vocabulary, and many projects on GitHub and GitLab follow them exactly.
:::

::: context conventional-commits A commit grammar
**Conventional Commits** is a published specification (version 1.0.0) for the first line of a commit message: `type(optional scope): description`, as in `fix(attitude): compare slew rate in rad/s`. It grew out of the commit guidelines of the Angular web framework project, which used the prefixes to generate its changelog. The specification only defines `feat` and `fix` and the breaking-change markers; other types such as `docs`, `test`, `refactor` and `chore` are common conventions. The payoff is that tools can read history and decide the next SemVer number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="104" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">fix:</text>
  <rect x="128" y="12" width="104" height="28" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="31" font-size="12" text-anchor="middle" fill="#1d6fd1">feat:</text>
  <rect x="246" y="12" width="104" height="28" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="298" y="31" font-size="12" text-anchor="middle" fill="#b4232c">feat!: / BREAKING</text>
  <line x1="62" y1="40" x2="62" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="62" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="298" y1="40" x2="298" y2="62" stroke="#b4232c" stroke-width="1.5"/>
  <text x="62" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">PATCH</text>
  <text x="180" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">MINOR</text>
  <text x="298" y="80" font-size="12" text-anchor="middle" fill="#b4232c">MAJOR</text>
  <text x="62" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">1.4.0 → 1.4.1</text>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">1.4.0 → 1.5.0</text>
  <text x="298" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">1.4.0 → 2.0.0</text>
</svg>
```

The biggest change since the last release decides the bump.
:::
