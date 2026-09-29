---
id: l08-semantic-versioning
title: Semantic versioning and deciding a bump
minutes: 23
covers:
  - Semantic versioning and how to decide a bump
---

Think about the updates your phone offers you. Some say "bug fixes and performance improvements", and you tap install without a thought. Some add a new feature, and everything you already did still works the same way. And once in a while an app is redesigned: the button you used every day has moved, and an old file will not open. You would like to know which kind of update it is *before* you install it.

A version number can tell you. **Semantic versioning** — "semver" for short — is a rule for writing version numbers so that the number itself says what kind of change happened. `2.4.1` to `2.4.2` is a fix. `2.4.2` to `2.5.0` adds something. `2.5.0` to `3.0.0` warns you that something you rely on may have changed.

In the last lesson, a library wrote ranges like `numpy>=1.26` and an application wrote `>=1.24,<2`. Those ranges only make sense if the numbers carry meaning. This lesson gives them that meaning, shows you how to read a diff and decide which number to bump, and pays special attention to a case that ordinary software rarely faces but a simulation library faces all the time: a change that alters the numbers your users get out.

## Three numbers, three promises

A semantic version has the form **MAJOR.MINOR.PATCH** — three whole numbers separated by dots, like `2.4.1`. Read it aloud as "two point four point one", or "major two, minor four, patch one".

Each number is a promise to the people who use your package:

- **PATCH** goes up when you fix behavior without changing the interface. "Same buttons, now they work correctly."
- **MINOR** goes up when you add capability in a **backward-compatible** way — anything that worked before still works the same. "New buttons; the old ones did not move."
- **MAJOR** goes up when you make a change that can break code written against the old version. "Some buttons moved or disappeared."

When one number goes up, the ones to its right go back to zero. After `2.4.1`, a patch gives `2.4.2`, a minor gives `2.5.0`, a major gives `3.0.0`. Never `2.5.1`, never `3.4.1`.

The "interface" in those promises has a name: the **[[public API|public-api]]**. API stands for application programming interface. It is everything a user is allowed to rely on: the importable names, the arguments of each function and their defaults, what each function returns, its units, the exceptions it raises, a command-line tool's flags, the format of files it writes. Semver is a promise about the public API, so the first step of any release is knowing what yours is. Anything not in it — a module named `_internal`, a function starting with an underscore — can change in any release.

::: key
How do you decide a semantic version bump? Break a public interface, bump MAJOR. Add capability compatibly, bump MINOR. Fix behavior without interface change, bump PATCH. For a simulation library, a change that alters numerical results is at minimum a MINOR and arguably a MAJOR, and must be in the changelog.
:::

The scheme was written down by **[[Tom Preston-Werner|semver-origin]]** at semver.org. It adds a few more rules worth knowing:

- A released version is frozen. If `2.4.1` has a bug, you publish `2.4.2`; you never replace the files of `2.4.1`.
- Versions starting with **0** — `0.y.z` — mean "initial development". Anything may change at any time, and nobody should read stability into them. Releasing `1.0.0` is the moment you declare a public API and start keeping the promises.
- When you **deprecate** something — announce that it will be removed later, while it still works — that is a MINOR release. The removal itself is the MAJOR release.

::: warning The numbers are not decimals
`1.10.0` is newer than `1.9.0`. As decimals, 1.10 would equal 1.1 and be smaller than 1.9, but a version is three separate whole numbers: minor 10 comes after minor 9. Tools that sort versions as text make the same mistake: Python's `sorted(["1.10.0", "1.9.0", "1.2.0"])` gives `['1.10.0', '1.2.0', '1.9.0']`, because it compares character by character and `"1"` comes before `"2"` and `"9"`. Always split into numbers first.
:::

## Deciding a bump from a diff

Here is the procedure. Go through every change in the release — every commit, every line of the diff that touches the public API or its behavior — and give each one a label. Then the release takes the **biggest** label.

For each change, ask three questions in this order:

1. **Could code that worked with the old version now fail, or silently do something different?** A removed or renamed function, a new required argument, a changed return type, a changed unit, a changed default. If yes: MAJOR.
2. **Is there a new thing a user can do, while everything old works as before?** A new function, a new optional argument with a default that keeps the old behavior, a new output column. If yes: MINOR.
3. **Otherwise, does behavior get more correct without any interface change?** A crash fixed, a wrong error message corrected, a speed-up. That is PATCH.

Pure internal changes — renaming a private helper, refactoring, new tests, documentation — need no bump on their own, though they ship inside whatever release comes next.

The question in step 1 has a word in it that matters: *silently*. A renamed function is loud. The user's code crashes with `AttributeError` on the first run, and they fix it in a minute. A changed default that makes the same call return a different number is silent. Nothing crashes. The numbers are different, and the user may not find out until a result disagrees with last month's.

::: example Labeling a release of an atmosphere library
Your library `atmos` is at version `2.4.1`. The diff for the next release contains four changes:

1. Fixed `density()` raising `ZeroDivisionError` at exactly $0\,\mathrm{km}$ altitude.
2. Added a new function `speed_of_sound(altitude_km)`.
3. Added an optional argument `density(altitude_km, table="std76")`, where leaving it out gives exactly the old table.
4. Renamed the private helper `_interp_row` to `_lookup`.

Label each one.

- Change 1: behavior gets more correct, interface unchanged. **PATCH.**
- Change 2: a new capability; no old call changes. **MINOR.**
- Change 3: a new optional argument whose default reproduces the old behavior. Every old call `density(12.0)` gives the same answer. **MINOR.**
- Change 4: private (leading underscore), not part of the public API. **No bump.**

The biggest label is MINOR, so the release is `2.5.0` — minor goes up, patch resets to zero.

Now suppose a fifth change sneaks in: `density()` now returns $\mathrm{g/m^3}$ instead of $\mathrm{kg/m^3}$. Every existing call still runs, but every number is 1000 times bigger. That is the silent kind of break. The label is **MAJOR**, and the release becomes `3.0.0`.

Sanity check: the only change that could hurt someone who upgraded without reading anything is the unit change, and it is the only one that forced a MAJOR.
:::

::: warning "It still runs" is not "it is compatible"
The most common wrong bump is calling a change PATCH because the tests still pass and nothing crashes. Ask instead: would a user who re-ran last month's script get the same outputs? If not, something in the public API changed, even if every signature is identical.
:::

### Deprecating before removing

A MAJOR bump is expensive for users, so good libraries give warning. Instead of deleting an old function, keep it for a while and make it announce its own retirement:

```python
import math
import warnings


def density(altitude_km):
    """Air density in kg/m^3 (simple exponential model)."""
    return 1.225 * math.exp(-altitude_km / 8.5)


def rho(altitude_km):
    """Old name, kept until the next major version."""
    warnings.warn("rho() is deprecated, use density()", DeprecationWarning, stacklevel=2)
    return density(altitude_km)


with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    print(round(rho(10.0), 4))
print(caught[0].category.__name__, "-", caught[0].message)

# 0.3777
# DeprecationWarning - rho() is deprecated, use density()
```

The old name still works and returns the same number, so adding the warning is a MINOR release. Users see the **[[deprecation warning|deprecation-warning]]** in their test runs and have time to switch. Deleting `rho` later is the MAJOR release.

## When the numbers change

Most software has a clear line between "fix" and "break". Simulation libraries have a large gray zone: changes that make the results *different* without making the old results *wrong in a way anyone noticed*. A new constant, an updated data table, a changed integrator default, a better interpolation scheme.

Think about who uses a simulation library. Someone ran a trajectory analysis, got a number, and put it in a report. Next month they upgrade and re-run for a design review. If the number changed and the version said PATCH, they will assume the change is in *their* inputs and may spend days looking for it. Worse, they may not re-run at all, and two reports built on two library versions will quietly disagree.

So the rule for a simulation library is stricter than plain semver:

- A change that alters numerical results is **at minimum MINOR**, even if every signature is the same and the new numbers are more accurate.
- Many teams go further and call it **MAJOR**, on the grounds that users' saved results no longer reproduce, which is exactly the kind of breakage semver exists to announce.
- Either way it goes in the **[[changelog|changelog]]** — the file listing what changed in each release — in words a user can act on: what changed, by how much, and how to get the old behavior back if they need it.

::: example A constant that moves a satellite
Version `1.7.3` of an orbit library uses Earth's gravitational parameter $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (read $\mu$ as "mu"). A contributor updates it to the more precise $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. No function signature changes. Is this a PATCH?

Step 1: size the change. The relative change in $\mu$ is

$$
\frac{3.986004418 - 3.986}{3.986} \approx 1.11 \times 10^{-6},
$$

about one part in a million. That sounds harmless.

Step 2: follow it into a result. The period of a circular orbit of radius $a$ is $T = 2\pi\sqrt{a^3/\mu}$. For $a = 7000\,\mathrm{km}$:

```python
import math

a = 7_000_000.0                         # orbit radius, m
for mu in (3.986e14, 3.986004418e14):   # old and new constant, m^3/s^2
    T = 2 * math.pi * math.sqrt(a**3 / mu)
    print(f"mu = {mu:.9e}  ->  T = {T:.4f} s")

# mu = 3.986000000e+14  ->  T = 5828.5199 s
# mu = 3.986004418e+14  ->  T = 5828.5166 s
```

The period drops by about $3.2\,\mathrm{ms}$.

Step 3: see where it goes. A day is $86400 / 5828.5 \approx 14.8$ orbits, so after one day the predicted satellite is about $14.8 \times 3.2\,\mathrm{ms} \approx 48\,\mathrm{ms}$ ahead of where the old version put it. At an orbital speed of about $7.55\,\mathrm{km/s}$ that is roughly $360\,\mathrm{m}$ along the track.

Step 4: decide. A user who re-runs a one-day propagation sees their satellite move by about a third of a kilometer. The new value is better, but the output changed, so this is not a PATCH. Release it as at least `1.8.0` — or `2.0.0` if your team treats result changes as breaking — with a changelog line such as "Earth $\mu$ updated to $3.986004418 \times 10^{14}$; one-day propagations at 7000 km shift by about 360 m."

Sanity check: a one-in-a-million change in a constant gave a few-hundred-meter change after a day, because errors in a period pile up every orbit. That is why "tiny" constant changes still get a version bump.
:::

## Pre-releases and build metadata

Before a big release you often want people to try it without getting it by accident. Semver lets you hang a **pre-release** label after the version with a hyphen: `2.0.0-alpha`, `2.0.0-beta.2`, `2.0.0-rc.1` ("rc" for release candidate). A pre-release means "not yet the real thing".

You can also add **build metadata** after a plus sign: `2.0.0+sha.5114f85` records, say, which commit was built. Build metadata is a label for humans and tools. It does **not** affect which version is newer: `2.0.0+sha.5114f85` and `2.0.0` rank the same.

Here is how to pull a full version string apart in Python, using `partition`, which splits at the first occurrence of a character and returns the part before, the character, and the part after:

```python
s = "2.0.0-rc.2+sha.5114f85"
core_and_pre, _, build = s.partition("+")
core, _, pre = core_and_pre.partition("-")
print(core, "|", pre, "|", build)
print(core.split("."), pre.split("."))

# 2.0.0 | rc.2 | sha.5114f85
# ['2', '0', '0'] ['rc', '2']
```

The pieces of a pre-release between the dots — `rc` and `2` here — are its **identifiers**.

### Which version is newer?

Semver ranks two versions like this:

1. Compare MAJOR, then MINOR, then PATCH, **as numbers**. The first difference decides.
2. If those are all equal, a version **with** a pre-release is lower than the same version **without** one. So `1.0.0-rc.1` comes before `1.0.0`. That makes sense: the candidate comes out before the release.
3. If both have pre-releases, compare their identifiers one pair at a time, left to right:
   - two identifiers made only of digits compare **as numbers**: `2` is less than `11`;
   - two identifiers with letters in them compare **[[lexically|lexical-order]]** — character by character, like a dictionary, using the ASCII character order: `alpha` is less than `beta`, and `beta` is less than `rc`;
   - a digits-only identifier is always **lower** than one with letters: `1` is less than `beta`.
4. If every identifier matched until one list ran out, the **longer** list is higher: `1.0.0-alpha` is less than `1.0.0-alpha.1`.
5. Build metadata is ignored throughout.

Python's tuples already compare left to right, number by number, which makes step 1 easy once you convert the strings:

```python
print("11" < "2", int("11") < int("2"))
print((1, 9, 9) < (1, 10, 0))
print("alpha" < "beta", "beta" < "rc")
print("rc".isdigit(), "2".isdigit())

# True False
# True
# True True
# False True
```

The first line is the trap: as strings, `"11"` sorts before `"2"`. As numbers it does not. `str.isdigit()` is how you tell which rule to use for an identifier.

::: example Putting a release series in order
Sort these, lowest first: `1.0.0`, `1.0.0-beta.11`, `1.0.0-alpha.beta`, `1.0.0-rc.1`, `1.0.0-alpha`, `1.0.0-beta.2`, `1.0.0-alpha.1`, `1.0.0-beta`.

Step 1: all share `1.0.0`, so the core never decides. By rule 2, the plain `1.0.0` is highest. It goes last.

Step 2: compare the first identifiers of the pre-releases: `alpha`, `beta` and `rc`, all letters, so dictionary order: alpha, then beta, then rc. That makes three groups.

Step 3: inside the alpha group — `alpha`, `alpha.1`, `alpha.beta`. The bare `alpha` has the fewest identifiers and matches the others as far as it goes, so by rule 4 it is lowest. Between `alpha.1` and `alpha.beta`, the second identifiers are `1` (digits) and `beta` (letters); digits rank lower, so `alpha.1` comes first.

Step 4: inside the beta group — `beta`, `beta.2`, `beta.11`. Bare `beta` is lowest by rule 4. Then `2` against `11`: both digits, compared as numbers, so `2` comes first.

The order is:

`1.0.0-alpha` < `1.0.0-alpha.1` < `1.0.0-alpha.beta` < `1.0.0-beta` < `1.0.0-beta.2` < `1.0.0-beta.11` < `1.0.0-rc.1` < `1.0.0`

Sanity check: every pre-release comes before the release, and `beta.11` sits after `beta.2`, which is what a human counting betas would expect.
:::

::: warning Python's own version rules are a cousin, not a twin
Python packages follow PEP 440 (from the last lesson), which borrows the MAJOR.MINOR.PATCH idea but spells pre-releases differently: `2.0.0rc1`, `2.0.0b2`, `2.0.0a1`, with no hyphen. The `packaging` library will read `1.0.0-rc.1` and rewrite it as `1.0.0rc1`. PEP 440 also has forms semver lacks, such as `.dev3` (before the pre-releases) and `.post1` (a re-release after the final), and it does *not* ignore a `+local` label when checking two versions for equality. Semver is the meaning of the numbers; PEP 440 is how you spell them on PyPI.
:::

Not every famous project follows semver strictly. NumPy and SciPy remove deprecated features in minor releases, after a warning period of a couple of releases. Python itself changes things in 3.x minor releases. Some tools use **[[calendar versioning|calver]]** instead. Before you write a range for a dependency, read its versioning policy. It tells you which of its numbers you can trust.

## Check yourself

::: check
A package is at `4.2.7`. What is the next version after (a) a patch, (b) a minor release, (c) a major release?
:::

::: answer
(a) `4.2.8`: only PATCH moves.

(b) `4.3.0`: MINOR goes up and PATCH resets to zero.

(c) `5.0.0`: MAJOR goes up, and both numbers to its right reset to zero.
:::

::: check
Your library's function `propagate(state, dt)` gains a new required argument, `propagate(state, dt, frame)`. The team says "it is only one argument, call it a MINOR". Are they right? What change would make it a genuine MINOR?
:::

::: answer
No. Every existing call `propagate(state, dt)` now fails with a `TypeError` about a missing argument, so code that worked before breaks: that is a MAJOR bump.

Making it optional with a default that reproduces the old behavior — say `frame="eci"` if the old code always worked in that frame — keeps every old call working and giving the same answers. Then it is a new capability added compatibly: MINOR.
:::

::: check
A release of your guidance library contains: a fix for a crash when the target list is empty, a new optional `max_iter` argument whose default equals the old hard-coded value, and a corrected sign in the drag term that changes every trajectory it computes by a few meters. What should the next version be if the current one is (a) `3.1.0`, (b) `0.9.4`?
:::

::: answer
Label the changes: the crash fix is PATCH, the optional argument is MINOR, and the drag sign fix changes numerical results, which for a simulation library is at minimum MINOR and arguably MAJOR. It needs a changelog entry either way.

From `3.1.0`: at least `3.2.0`, or `4.0.0` if the team treats result changes as breaking.

From `0.9.4`: the package is still in initial development, where semver makes no stability promise. By common convention the version becomes `0.10.0`, with the drag change prominent in the changelog. It is also a good moment to ask whether the API is stable enough to release `1.0.0`.
:::

::: check
Put these in semver order: `2.1.0-rc.2`, `2.1.0`, `2.0.9`, `2.1.0-rc.10`, `2.1.0-beta`, `2.1.0+build.7`.
:::

::: answer
`2.0.9` is lowest: its MINOR is 0, below 1.

Among the `2.1.0` versions, the pre-releases come first. `beta` is below `rc` in dictionary order. Between `rc.2` and `rc.10`, both second identifiers are digits, so compare as numbers: 2 before 10.

`2.1.0` and `2.1.0+build.7` rank equal, because build metadata is ignored, and both are above every pre-release.

So: `2.0.9` < `2.1.0-beta` < `2.1.0-rc.2` < `2.1.0-rc.10` < `2.1.0` = `2.1.0+build.7`.
:::

::: check
Explain why a function sorting versions with `sorted(list_of_strings)` gets `1.0.0-rc.10` and `1.0.0-rc.9` in the wrong order, and describe the fix without writing the whole function.
:::

::: answer
String comparison looks at one character at a time. After `1.0.0-rc.` the next characters are `1` and `9`, and `"1"` comes before `"9"`, so `rc.10` lands before `rc.9`. Semver says digit-only identifiers compare as numbers, and 10 is more than 9.

The fix is to split the version into its parts first — core numbers with `int()`, pre-release identifiers by splitting on dots — and compare each identifier with the right rule: numbers as numbers when `isdigit()` is true for both, text as text when both have letters, and digits below letters when they differ.
:::

## Summary

| Idea | In one line |
| --- | --- |
| MAJOR.MINOR.PATCH | three whole numbers; bumping one resets those to its right to 0 |
| MAJOR | a change that can break code written for the old version |
| MINOR | new capability, everything old still works the same; also deprecations |
| PATCH | behavior fixed, interface unchanged |
| Deciding a bump | label every change; the release takes the biggest label |
| Numerical results change | at minimum MINOR, arguably MAJOR, always in the changelog |
| 0.y.z | initial development; no stability promise |
| Pre-release | `1.0.0-rc.1` is lower than `1.0.0` |
| Identifier order | digits as numbers, letters as text, digits below letters, more fields wins |
| Build metadata | `+...` is ignored when ranking |

Next lesson: every package in an environment declares ranges built on these numbers, and something has to find one version of each that satisfies all of them at once. That is **dependency resolution** — and for NumPy and SciPy, which ship compiled code, the version numbers also have to match at the level of the machine code, which is the ABI problem.

::: context public-api What counts as public
Python has no keyword that makes a function private, so the community uses conventions. A name starting with an underscore, like `_lookup`, is private. A module named `_internal` and everything in it is private. If a package defines a list called `__all__`, that list names what `from package import *` exports and is a strong hint about the public surface. Anything documented is public, whatever its name.

The safest habit is to write the public API down — in the docs, or in `__init__.py` — so that "did this change the public API?" has a checkable answer.
:::

::: context semver-origin Who wrote the rules
Semantic Versioning was written by Tom Preston-Werner, a co-founder of GitHub, and published at semver.org. Version 2.0.0 of the specification, the one in use today, dates from 2013. It did not invent the idea of major, minor and patch numbers, which programmers had used loosely for decades. What it added was precise rules — especially for pre-releases and ordering — so that tools could act on the numbers automatically.
:::

::: context deprecation-warning Why nobody sees the warning
Python hides `DeprecationWarning` by default, so that end users of an application are not flooded with messages about libraries they cannot change. Since Python 3.7 it is shown when triggered by code in the script you ran directly (`__main__`). Test runners such as pytest show deprecation warnings in their summary, which is where developers usually meet them. That is the reason `stacklevel=2` matters: it makes the warning point at the caller's line, the one that has to change, rather than inside your library.
:::

::: context changelog A changelog a user can act on
A changelog is a file, often `CHANGELOG.md`, with one section per release, newest first. The useful ones group entries under headings such as Added, Changed, Deprecated, Removed and Fixed, and write each entry for the reader who is deciding whether to upgrade.

For a simulation library, an entry about changed results should say what changed, how big the effect is on a typical case, and how to get the old behavior back. "Updated $\mu$" is not enough. "Earth $\mu$ updated; one-day propagations at 7000 km shift by about 360 m" is.
:::

::: context lexical-order Dictionary order for computers
Lexical order compares two strings one character at a time, and the first difference decides — like finding a word in a dictionary. Computers use each character's code number, from the ASCII table, where digits come before capital letters, and capital letters before lowercase ones.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">0 – 9</text>
  <rect x="135" y="20" width="90" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">A – Z</text>
  <rect x="250" y="20" width="90" height="30" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="295" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">a – z</text>
  <line x1="112" y1="35" x2="131" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="133,35 126,31 126,39" fill="#1f2a44"/>
  <line x1="227" y1="35" x2="246" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="248,35 241,31 241,39" fill="#1f2a44"/>
  <text x="65" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">codes 48–57</text>
  <text x="180" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">codes 65–90</text>
  <text x="295" y="68" font-size="11" text-anchor="middle" fill="#6c7a93">codes 97–122</text>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#b4232c">"11" &lt; "2" as text, because "1" &lt; "2"</text>
</svg>
```

So `"Beta"` sorts before `"alpha"`. Semver pre-release labels are almost always lowercase, which keeps this from biting in practice.
:::

::: context calver Versions made of dates
Calendar versioning, or CalVer, puts the release date in the number. pip uses it: a version like `26.2.1` means the second feature release of 2026, plus a fix. Ubuntu's `24.04` means April 2024. CalVer tells you how old a release is at a glance, but it makes no promise about compatibility: `26.1` to `27.1` might break nothing or everything. For a dependency on CalVer, the changelog, not the number, tells you what changed.
:::
