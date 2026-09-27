---
id: l07-version-pinning
title: Version pinning, ranges and lockfiles
minutes: 22
covers:
  - 'Version pinning: exact pins for applications, ranges for libraries, lockfiles for both'
---

Think about two kinds of recipe. The first is in a cookbook that thousands of people will use. It says "two cups of all-purpose flour". It does not name a brand, because every reader shops at a different store, and the cake comes out fine with any reasonable flour. The second is the recipe a bakery uses for a wedding cake it has already sold to a customer. That one says "King Arthur all-purpose, the bag from this week's delivery", because the bakery promised the customer a cake exactly like the sample she tasted.

Python dependencies come in the same two flavors. A package that other code will import — a **library** — should say "any version of NumPy from here to there", so it can live next to other libraries in one environment. A program that produces a result someone relies on — an **application**, such as a trajectory simulation whose plots go into a design review — should say "exactly NumPy 2.4.6, exactly SciPy 1.17.1", so the same inputs give the same numbers next month on a different laptop.

This lesson teaches the notation for both, why each kind of project uses the one it does, and the file that makes an install truly repeatable: the **lockfile**, a machine-written list of every package and exact version in the environment, with a fingerprint of each file.

## Writing down which versions you accept

A **version specifier** is a small rule that says which versions of a package you accept. You have already written some in `pyproject.toml` in the lesson on project metadata: `"numpy>=1.26"` is the package name followed by a specifier. The notation comes from a Python standard called **[[PEP 440|pep-440]]**, and pip, uv and every other modern tool read it the same way.

Here are the operators you will meet:

| Operator | Read it as | Example | Accepts |
| --- | --- | --- | --- |
| `==` | "exactly" | `==1.26.4` | only 1.26.4 |
| `>=`, `>`, `<=`, `<` | "at least", "more than", … | `>=1.24` | 1.24 and anything newer |
| `!=` | "anything but" | `!=2.0.0` | every version except 2.0.0 |
| `~=` | "compatible release" | `~=1.26.0` | 1.26.0 or newer, but still 1.26.something |
| `==` with `*` | "any in this series" | `==1.26.*` | every 1.26 release |

A comma between specifiers means **and**: `>=1.24,<2` reads "at least 1.24 and less than 2". Every rule in the list must hold.

The one that confuses people is `~=`. It means "this version or a later one that only changes the last number you wrote". So `~=1.26.0` means `>=1.26.0, ==1.26.*`: any 1.26 patch release. And `~=2.1` means `>=2.1, ==2.*`: any 2.x from 2.1 on. The number of digits you write decides how much is allowed to move.

The `packaging` library — the same code pip uses inside — will check them for you:

```python
from packaging.specifiers import SpecifierSet

available = ["1.24.4", "1.26.4", "2.0.0", "2.1.3", "2.2.6", "2.3.0rc1"]

for spec in ["==1.26.4", ">=1.24", ">=1.24,<2", "~=1.26.0", "~=2.1", ">=1.26,!=2.0.0"]:
    allowed = list(SpecifierSet(spec).filter(available))
    print(f"{spec:15} -> {allowed}")

# ==1.26.4        -> ['1.26.4']
# >=1.24          -> ['1.24.4', '1.26.4', '2.0.0', '2.1.3', '2.2.6']
# >=1.24,<2       -> ['1.24.4', '1.26.4']
# ~=1.26.0        -> ['1.26.4']
# ~=2.1           -> ['2.1.3', '2.2.6']
# >=1.26,!=2.0.0  -> ['1.26.4', '2.1.3', '2.2.6']
```

Check each line against the table. Notice what never shows up: `2.3.0rc1`. The `rc1` makes it a **pre-release** — a test version published before the real one, here "release candidate 1". Installers skip pre-releases unless you ask for them (`pip install --pre`) or your specifier names one. So `>=1.24` quietly means "at least 1.24, final releases only".

::: warning A bare name is not "the current version"
Writing `numpy` with no specifier does not freeze anything. It means "any version at all", and the installer picks the newest one it can find *on the day you install*. The same file installed in March and in September can give you two different NumPys. If you want a specific version, the file has to say so.
:::

## Libraries declare ranges

Picture two libraries used in one simulation. `gnc-filters` needs NumPy for its matrix maths. `orbit-tools` needs NumPy too. Your application imports both. Python can only have **one** copy of NumPy in an environment — there is one folder called `numpy` in `site-packages`, and `import numpy` finds that one.

Now suppose each library author pinned the exact version on their own laptop:

```python
from packaging.specifiers import SpecifierSet

gnc_filters = SpecifierSet("==1.26.4")   # what the gnc-filters author had
orbit_tools = SpecifierSet("==2.1.3")    # what the orbit-tools author had

both = gnc_filters & orbit_tools          # "&" combines the two rules
print(both)
print(list(both.filter(["1.26.4", "2.1.3", "2.2.6"])))

# ==1.26.4,==2.1.3
# []
```

The combined rule accepts nothing. No version is both 1.26.4 and 2.1.3, so there is no way to install both libraries together. Neither library has a bug, yet they cannot share an environment. The installer stops with a conflict error, and the person who hits it is the user, who did nothing wrong.

If instead each library states the **range** it really works with, there is room to meet:

```python
from packaging.specifiers import SpecifierSet

gnc_filters = SpecifierSet(">=1.24")
orbit_tools = SpecifierSet(">=1.26,<3")

both = gnc_filters & orbit_tools
print(list(both.filter(["1.24.4", "1.26.4", "2.1.3", "2.2.6"])))

# ['1.26.4', '2.1.3', '2.2.6']
```

Three versions satisfy both, and the installer is free to choose the newest, 2.2.6. That freedom is the whole point: a library cannot know what else will be installed next to it, so it should forbid only what it knows is broken.

How wide should the range be?

- **Lower bound:** the oldest version you have actually tested, or the first one that has a feature you use. If your code calls a function added in SciPy 1.11, write `scipy>=1.11`.
- **Upper bound:** only when you *know* the next version breaks you. Adding `<3` everywhere "to be safe" blocks users from fixes and causes exactly the conflicts above. The debate over **[[upper caps|upper-caps]]** is real; the common advice for libraries is to leave the top open unless you have a reason.
- **Exclusions:** `!=2.0.0` when one specific release has a bug that hits you.

::: key
Pins or ranges? A library declares compatible ranges so it can coexist with others. An application or a simulation pins exact versions, usually through a lockfile, because reproducibility outweighs flexibility.
:::

## Applications pin exactly

An application is at the top of the pile. Nothing else will install it next to itself as a dependency, so it has no neighbors to be flexible for. What it needs instead is to give the same answer every time.

Why would a different version change the answer? A new SciPy release can change an integrator's default settings, fix a bug your code relied on, or reorder a sum so the last digits of a float move. But if your Monte Carlo landing dispersion was $\pm 41.2\,\mathrm{m}$ in the design review and is $\pm 41.7\,\mathrm{m}$ when an auditor re-runs it, someone now has to spend a day proving the difference is a library change and not a mistake.

So an application pins every package with `==`. And "every package" means more than the ones you typed. Your project lists its **direct dependencies** — the packages your own code imports. Each of those has its own dependencies, which have theirs. Those are the **[[transitive dependencies|transitive-deps]]**, and a version change in any of them can change your results too.

Here is how big that gap is. Two direct dependencies go in:

```text
# requirements.in
scipy>=1.11
matplotlib>=3.8
```

and `uv pip compile` — a tool that resolves the full tree and writes out every pin — gives back (trimmed):

```text
$ uv pip compile requirements.in --python-version 3.11 -o requirements.lock
contourpy==1.3.3
    # via matplotlib
cycler==0.12.1
    # via matplotlib
...
matplotlib==3.11.2
    # via -r requirements.in
numpy==2.4.6
    # via
    #   contourpy
    #   matplotlib
    #   scipy
...
scipy==1.17.1
    # via -r requirements.in
six==1.17.0
    # via python-dateutil
```

Two lines in, **twelve** pinned packages out. You never asked for `six`; it arrived because Matplotlib needs `python-dateutil`, which needs `six`. The `# via` comments record why each one is there.

::: example Counting what a pin file really covers
A team's `requirements.txt` for a simulation says `numpy==2.4.6` and `scipy==1.17.1` and nothing else. How much of the environment is actually pinned?

Step 1: list what gets installed. SciPy needs NumPy and nothing else at run time, so the environment is NumPy and SciPy: 2 packages, and both are pinned. Good.

Step 2: the team adds `matplotlib==3.11.2` for plots. From the compile output above, Matplotlib brings in `contourpy`, `cycler`, `fonttools`, `kiwisolver`, `packaging`, `pillow`, `pyparsing`, `python-dateutil` and, through that, `six`. That is 9 packages nobody pinned.

Step 3: the fraction pinned is now $3 / 12 = 0.25$ — only a quarter of the environment is under control. The rest floats to whatever is newest on install day.

Sanity check: a plotting library needs fonts, images and dates, so nine extra packages is believable. The fix is to pin all twelve, which is what a lockfile does.
:::

## requirements.txt and lockfiles

Two kinds of file get confused here, partly because they can share the name `requirements.txt`.

A **requirements file** written by a person usually lists the direct dependencies, with or without versions: "this project needs NumPy and SciPy". It is a statement of intent.

A **lockfile** is written by a tool. It records the **full resolved graph** — every direct and transitive package, each at one exact version — and a **[[hash|sha256-hash]]** for each file it may install. A hash is a 64-character fingerprint computed from every byte of the file. Change one byte and the fingerprint changes completely.

Why the hashes? Because `numpy==2.4.6` names a version, but not a specific file. If the index serves a different file under the same name — a corrupted download, a mirror that rebuilt it, or someone tampering with it — a version pin will not notice. A hash will. Here is pip refusing a wheel whose hash is one character off from the one in the file:

```text
$ pip install --require-hashes -r bad.txt
Processing ./dl/six-1.17.0-py2.py3-none-any.whl
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    six==1.17.0 from file:///.../dl/six-1.17.0-py2.py3-none-any.whl:
        Expected sha256 4721f391ed90541fddacab5acf947aa0d3dc7d27b2e1e8eda2be8970586c3275
             Got        4721f391ed90541fddacab5acf947aa0d3dc7d27b2e1e8eda2be8970586c3274
```

You can compute the same fingerprint yourself:

```python
import hashlib
from pathlib import Path

wheel = Path("dl/six-1.17.0-py2.py3-none-any.whl")
print(wheel.stat().st_size, "bytes")
print(hashlib.sha256(wheel.read_bytes()).hexdigest())

# 11050 bytes
# 4721f391ed90541fddacab5acf947aa0d3dc7d27b2e1e8eda2be8970586c3274
```

A package usually has many files per version — one wheel for each operating system and Python version — so a lockfile lists a hash for each. In the twelve-package example, `uv pip compile --generate-hashes` wrote 554 hash lines: 72 for NumPy alone, 2 for `six`.

::: key
requirements.txt or lockfile? requirements.txt is usually a human-written list of direct dependencies. A lockfile records the full resolved graph with hashes, which is what makes an install reproducible. Simulation work needs the lockfile.
:::

::: warning pip freeze is a snapshot, not a lockfile
`pip freeze > requirements.txt` writes every installed package with `==`, which looks like a lockfile. But it has no hashes, it copies whatever is in your environment (including that package you tried once), and nothing checks it against `pyproject.toml`. It is a record of one machine, not a reproducible install.
:::

### Project lockfiles with uv

Modern tools keep the lockfile next to `pyproject.toml` and manage it for you. With uv, the file is `uv.lock`. Start from a small application:

```toml
[project]
name = "trajsim"
version = "0.3.0"
requires-python = "~=3.11.0"
dependencies = ["numpy>=1.26", "scipy>=1.11"]
```

Running `uv lock` resolves it and writes `uv.lock`. Inside, each package gets an exact version, where it came from, and a hash for every file (trimmed):

```toml
[[package]]
name = "numpy"
version = "2.4.6"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/.../numpy-2.4.6.tar.gz", hash = "sha256:f3a3570c...", size = 20735807 }
```

Notice that the ranges stay in `pyproject.toml` and the exact versions live in `uv.lock`. Two files, two jobs: `pyproject.toml` says what the project *can* work with, and the lockfile says what it *did* install.

Then, on a teammate's laptop or a CI machine, `uv sync --locked` installs exactly what the lockfile says. The `--locked` flag also refuses to go on if the lockfile is out of date. Add `matplotlib>=3.8` to `pyproject.toml` without re-locking and you get:

```text
$ uv lock --check
Resolved 13 packages in 93ms
The lockfile at `uv.lock` needs to be updated, but `--locked` was provided. To update the lockfile, run `uv lock`.
```

That error is a gift: nobody can change the declared dependencies without re-locking in the same commit, where a reviewer sees it.

## Lockfiles for both

Here is the part that looks like a contradiction. Libraries use ranges. So why does the topic say lockfiles are for libraries too?

Because a library project has two different audiences:

- **Its users** see only the ranges in `pyproject.toml`. When they install `gnc-filters`, their installer reads `numpy>=1.24` and picks a NumPy that fits their whole environment. Your lockfile is not published and they never see it.
- **Its developers and its CI** need a repeatable environment to run the tests in. If the test suite passed yesterday and fails today, you want to know whether *your* change broke it or a new release of `pytest` did. A committed lockfile answers that: the tools and dependencies only change when someone updates the lockfile on purpose.

So the rule is: **ranges in the published metadata, a lockfile for the development environment.** Many library teams add one more CI job that installs the *newest* versions allowed by the ranges and another that installs the *oldest* (the lower bounds). Those two jobs check that the range you advertise is honest.

For an application, the lockfile is not only for development. It *is* the deliverable: the environment you ship, run and re-run.

::: example Choosing a policy for three projects
Decide pins or ranges, and whether to commit a lockfile, for each.

1. **`atmos`**, a small library that computes air density from altitude, imported by several teams. It is a library, so `pyproject.toml` declares ranges: `numpy>=1.24` (the oldest version its tests run against) with no upper cap. The repository commits a lockfile so the developers' test runs are repeatable, but users never see it.
2. **`landing-mc`**, a Monte Carlo landing-dispersion study whose plots go into a design review. It is an application. It pins exactly, through a committed lockfile with hashes, and every result it publishes records which lockfile produced it.
3. **A one-off notebook** you use to explore a data file for an afternoon. Nobody else runs it and no result leaves your desk. Ranges or even bare names are fine here — the cost of a lockfile outweighs the benefit. The moment a number from it goes into a report, it becomes an application and gets a lockfile.

Sanity check: the deciding question every time was "who installs this, and does anyone rely on its exact output?"
:::

## Updating on purpose

Pinning does not mean never updating. Old versions collect bugs and security holes. It means updates become a **deliberate change** instead of an accident:

1. Run `uv lock --upgrade` (or `uv lock --upgrade-package scipy` for one package). The lockfile changes, and the diff shows exactly which versions moved.
2. Run the test suite *and* re-run the reference simulations.
3. Compare the new results against the old ones. If numbers moved, decide whether the change is acceptable and record it. This is called **re-baselining**: the new results become the reference that future runs are compared against.
4. Commit the new lockfile and the new baseline together, with a message that says why.

Many teams let a **[[bot open these update pull requests|update-bots]]** on a schedule, so updates arrive in small, reviewable steps.

## The full chain of reproducibility

A lockfile pins the Python packages. It does not pin everything beneath them. NumPy's wheels run on top of the operating system's C library, and the results of floating-point maths can depend on the CPU instructions a library chooses at run time. Two machines with the same lockfile but different operating systems can, in rare cases, still disagree in the last digits.

The layer beneath is handled by a **[[container image|container-digest]]** — a packaged snapshot of an entire operating system plus everything installed on it. A container image can be named by its **digest**, a hash of the image itself, the same idea as the wheel hashes above but for the whole machine.

So a result is fully traceable when you can name three things:

- the **package version** of your own code (for example `trajsim 0.3.0`, or a git commit),
- the **lockfile** that pinned every Python dependency, with hashes,
- the **container digest** that pinned the operating system, compilers and system libraries underneath.

::: key
How does packaging interact with reproducibility? A pinned lockfile plus a versioned package plus a container digest is the full chain. Any one alone leaves a gap: the same code with different dependency versions can produce different numbers.
:::

::: warning A lockfile is per platform unless the tool says otherwise
A lockfile resolved on a Mac may list files that do not exist for Linux. uv's `uv.lock` is **universal**: it resolves for every operating system and Python version your project allows. Check that your lockfile covers the machines you actually run on.
:::

## Check yourself

::: check
List which of these versions satisfy `~=3.8.1`: 3.8.0, 3.8.1, 3.8.4, 3.9.0, 4.0.0. Then do the same for `~=3.8`.
:::

::: answer
`~=3.8.1` means `>=3.8.1, ==3.8.*`: only the last written number may move. So 3.8.1 and 3.8.4 pass. 3.8.0 is too old, and 3.9.0 and 4.0.0 leave the 3.8 series.

`~=3.8` means `>=3.8, ==3.*`: now the second number may move too. So 3.8.0, 3.8.1, 3.8.4 and 3.9.0 pass, and only 4.0.0 fails. Writing one fewer digit let a whole extra level float.
:::

::: check
You maintain a library, `quatlib`, whose `pyproject.toml` says `dependencies = ["numpy==2.4.6"]`. A user reports they cannot install it next to another library that needs `numpy>=2.5`. Explain what went wrong and what the dependency line should say.
:::

::: answer
An exact pin in a library forces that one NumPy on every environment that includes the library. The other library needs 2.5 or newer, and no version is both exactly 2.4.6 and at least 2.5, so the combined rule is empty and the install fails.

The line should state the range `quatlib` really works with, for example `numpy>=1.26` if that is the oldest version its tests pass on. If the developers want repeatable test runs, they commit a lockfile for development, which users never see.
:::

::: check
What is the difference between `numpy==2.4.6` in a requirements file and the entry for NumPy in a lockfile with hashes? Give one failure the hash catches that the version pin misses.
:::

::: answer
`numpy==2.4.6` names a version. The lockfile entry names the version *and* the exact files allowed, by their sha256 fingerprints.

If the index or a mirror serves a different file under the name `numpy-2.4.6` — corrupted in transit, rebuilt differently, or tampered with — the version pin is satisfied and the bad file installs. With hashes, the installer computes the fingerprint of what it downloaded, sees it does not match, and stops before installing anything.
:::

::: check
Your simulation application has a committed `uv.lock`. A colleague adds `pandas>=2.2` to `pyproject.toml` and pushes without running `uv lock`. The CI job runs `uv sync --locked`. What happens, and why is that good?
:::

::: answer
The job fails with "The lockfile at `uv.lock` needs to be updated, but `--locked` was provided." The declared dependencies no longer match the pinned set.

That is good because the alternative is worse: CI would either ignore pandas or resolve a fresh set of versions on the spot, and the environment that ran the tests would no longer be the one recorded in the repository. The failure forces the colleague to re-lock, so the new pins appear in the same change for a reviewer to see.
:::

::: check
Two engineers run the same git commit of an application with the same lockfile, one on a laptop and one in the team's standard container, and get landing dispersions that differ in the fourth significant figure. Name a layer the lockfile does not pin, and say how the team should make runs comparable.
:::

::: answer
The lockfile pins Python packages only. It does not pin the operating system, its C and maths libraries, or the compilers and system libraries underneath, and those can shift floating-point results in the last digits.

The team should name the container image by its digest and run official results inside it. Then the result is tied to three things: the code version, the lockfile and the container digest.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Version specifier | a rule for acceptable versions: `==`, `>=`, `<`, `!=`, `~=`; a comma means "and" |
| `~=X.Y.Z` | at least X.Y.Z, only the last written number may change |
| Pre-releases | skipped by default unless asked for |
| Library | declares ranges (a tested lower bound, no cap unless needed) so it can share an environment |
| Application | pins every package exactly, direct and transitive |
| requirements.txt | usually a human-written list of direct dependencies |
| Lockfile | the full resolved graph, exact versions, a hash for every file |
| Lockfiles for both | libraries lock their dev and CI environment; applications ship the lock |
| Updating | deliberate: re-lock, re-test, re-baseline, commit together |
| Reproducibility chain | package version + lockfile + container digest |

Next lesson: the numbers inside a version are not random. **Semantic versioning** gives each of the three numbers a meaning, so that a range like `>=1.24,<2` makes a promise — and you will learn how to decide which number to bump when you release.

::: context pep-440 Where the version rules are written down
Python's packaging standards are written as numbered proposals called PEPs (Python Enhancement Proposals). PEP 440, accepted in 2014, defines what a Python version number may look like — `1.2.3`, `2.0rc1`, `1.0.post1`, `1.1.dev3` — how they sort, and the meaning of every specifier operator. Because pip, uv and the `packaging` library all follow it, a specifier means the same thing to every tool.
:::

::: context upper-caps The argument about upper bounds
Suppose a library writes `numpy>=1.24,<2`. NumPy 2 ships, and a user who needs it for another reason now cannot install the library at all — even if the library would have worked perfectly with NumPy 2. The cap blocked something that was never broken.

The opposite risk is real too: with no cap, a breaking release installs and the library fails at import. The common compromise for libraries is: no caps by default, add a cap quickly when a real break is found, and release a fix. Applications avoid the whole question, because their lockfile pins everything anyway.
:::

::: context transitive-deps The tree beneath what you asked for
You asked for two packages. Each asked for others, which asked for more. The packages you never named are the transitive dependencies.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="8" width="80" height="24" rx="5" fill="#1d6fd1"/>
  <text x="180" y="24" font-size="12" text-anchor="middle" fill="#fff">your app</text>
  <line x1="165" y1="32" x2="85" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="195" y1="32" x2="275" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="45" y="62" width="80" height="24" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">scipy</text>
  <rect x="225" y="62" width="100" height="24" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="275" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">matplotlib</text>
  <line x1="85" y1="86" x2="150" y2="116" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="255" y1="86" x2="170" y2="116" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="86" x2="300" y2="116" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="120" y="116" width="70" height="22" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="155" y="131" font-size="11" text-anchor="middle" fill="#1f2a44">numpy</text>
  <rect x="245" y="116" width="110" height="22" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="131" font-size="11" text-anchor="middle" fill="#1f2a44">python-dateutil</text>
  <line x1="300" y1="138" x2="300" y2="148" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="275" y="148" width="50" height="20" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">six</text>
  <text x="12" y="162" font-size="11" fill="#6c7a93">orange: never named, still installed</text>
</svg>
```

Only a few of Matplotlib's nine dependencies are drawn. A pin file that lists only the blue boxes leaves the orange ones free to change.
:::

::: context sha256-hash A fingerprint for a file
SHA-256 is a hash function: it reads every byte of a file and produces a 256-bit number, written as 64 hexadecimal characters. The same file always gives the same fingerprint. Change a single byte and roughly half of the output bits flip, so the new fingerprint looks unrelated to the old one. There are $2^{256} \approx 1.16 \times 10^{77}$ possible fingerprints, and nobody knows a practical way to build a different file that matches a given one. That is what lets a lockfile say "this exact file, and no other".
:::

::: context update-bots Letting a robot propose updates
Tools such as Dependabot (built into GitHub) and Renovate watch your lockfile and open a pull request when a new version of a dependency appears. The pull request shows the lockfile diff and runs your CI; a human still decides whether to merge. When a small weekly update breaks something, only a handful of versions moved, so the culprit is easy to find.
:::

::: context container-digest Layers a lockfile does not reach
A lockfile covers the Python layer. A container image covers everything below it, and its digest pins that image exactly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="12" width="210" height="30" fill="#1d6fd1"/>
  <text x="125" y="32" font-size="12" text-anchor="middle" fill="#fff">your code (trajsim 0.3.0)</text>
  <rect x="20" y="46" width="210" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="125" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">numpy, scipy, … (Python)</text>
  <rect x="20" y="80" width="210" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="125" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">Python interpreter</text>
  <rect x="20" y="114" width="210" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="125" y="134" font-size="12" text-anchor="middle" fill="#1f2a44">OS, C library, compilers</text>
  <line x1="240" y1="14" x2="240" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <text x="250" y="31" font-size="11" fill="#1f2a44">version / commit</text>
  <line x1="240" y1="48" x2="240" y2="74" stroke="#1d6fd1" stroke-width="2"/>
  <text x="250" y="65" font-size="11" fill="#1d6fd1">lockfile + hashes</text>
  <line x1="240" y1="82" x2="240" y2="142" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="116" font-size="11" fill="#b4232c">container digest</text>
  <text x="20" y="166" font-size="11" fill="#6c7a93">each layer needs its own pin</text>
</svg>
```

The interpreter can be pinned by either one: uv can pin the Python version in the project, and the container fixes it for the whole machine.
:::
