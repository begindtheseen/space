---
id: l10-environment-tools
title: Environments with venv, pip, uv and conda
minutes: 25
covers:
  - venv, pip, uv, conda and when each is the right answer
---

Think of two science-fair projects sharing one craft box. One project needs the old blue glue, because its poster was built with it and the new glue makes the paper curl. The other needs the new glue, because the blue kind will not hold its foam model. If there is only one glue slot in the box, one project always loses. The fix is easy to say: give each project its own box.

Python projects have exactly this problem. A Monte Carlo campaign you ran last year was checked against NumPy 1.26, and a design review signed off on its numbers. This year's navigation code uses NumPy 2. One computer, one Python, one folder of installed packages: something breaks. The fix is the same as with the glue. Each project gets its own **environment** — a private Python setup with its own folder of installed packages, so what one project installs cannot disturb another.

Four tools do this. **venv** makes environments. **pip** installs packages into them. **uv** is a newer, much faster tool that does both jobs and a few more. **conda** is a separate world that also installs things that are not Python at all. By the end you will know what each does on disk and which to reach for.

## What an environment is

Every Python installation has a folder where installed packages go. It is called **[[site-packages|site-packages]]** — the folder `import` searches after the standard library. When you run `pip install numpy`, the files land there. When you write `import numpy`, Python finds them there.

One folder means one version of each package. You cannot have NumPy 1.26 and NumPy 2 side by side in one site-packages, because both want to live in a folder called `numpy/`. That is the whole problem.

An environment solves it with three pieces:

1. a Python interpreter to run (often a link back to one already on the computer);
2. its own empty site-packages folder;
3. a `bin/` folder (called `Scripts\` on Windows) for commands that packages install, such as `pytest` or the `gnc-orbit` command from the entry-points lesson.

Python can tell you which environment it is running in. `sys.prefix` is the top folder of the current environment, and `sys.base_prefix` is the top folder of the Python it was made from. Inside an environment they differ.

```python
import sys

print(sys.prefix)
print(sys.base_prefix)
print("inside an environment:", sys.prefix != sys.base_prefix)
# /home/you/gnc-toolkit/.venv
# /usr
# inside an environment: True
```

(The first two lines depend on your computer. Outside any environment both print the same folder, and the last line says `False`.)

::: warning The system Python is not yours
Linux and macOS ship a Python that the operating system itself uses. Installing packages into it with `sudo pip install` can break system tools that expect particular versions. Recent Debian and Ubuntu releases now refuse outright: pip stops with an `externally-managed-environment` error. The fix is never to force it. Make an environment and install there.
:::

## venv: an environment in one command

**venv** is the environment maker built into Python since version 3.3. There is nothing to install. From the project folder:

```text
$ python3 -m venv .venv
$ ls .venv
bin  include  lib  lib64  pyvenv.cfg
$ ls -l .venv/bin          # trimmed to names and link targets
activate  activate.csh  activate.fish  Activate.ps1
pip  pip3  pip3.11
python -> python3
python3 -> /usr/local/bin/python3
python3.11 -> python3
```

Read `python3 -m venv .venv` as "run the venv module and make an environment in a folder called `.venv`". The dot at the front hides the folder in most file listings. Look at what came out. The `python3` in `bin/` is not a copy of Python — the arrow means it is a [[symbolic link|symlink-shortcut]] back to the real interpreter. What makes it a separate environment is the small text file `pyvenv.cfg`:

```text
$ cat .venv/pyvenv.cfg
home = /usr/local/bin
include-system-site-packages = false
version = 3.11.15
```

When Python starts, it looks for `pyvenv.cfg` next to itself or one folder up. If it finds one, it sets `sys.prefix` to that folder and uses `.venv/lib/python3.11/site-packages` instead of the global one. The line `include-system-site-packages = false` says "do not also look at the globally installed packages", so the environment starts empty apart from pip.

### Activating, and why you do not have to

`source .venv/bin/activate` (on Windows, `.venv\Scripts\activate`) is the command everyone learns first. It does less than people think. It puts `.venv/bin` at the front of your shell's **[[PATH|path-variable]]** — the list of folders the shell searches for commands — and sets a variable `VIRTUAL_ENV`. That is all.

```text
$ which python3
/usr/local/bin/python3
$ source .venv/bin/activate
(.venv) $ which python
/home/you/gnc-toolkit/.venv/bin/python
(.venv) $ deactivate
$ which python3
/usr/local/bin/python3
```

So you can skip activation entirely and name the environment's Python directly: `.venv/bin/python -m pytest`. Scripts, Makefiles and CI jobs often do exactly that, because it cannot silently pick up the wrong Python.

::: key An environment is disposable
An environment is an interpreter plus a private site-packages folder, marked by `pyvenv.cfg`. Activation only edits `PATH`. Never commit `.venv` to git and never edit files inside it: delete it and rebuild it from your dependency list.
:::

::: example Two simulations, two NumPys
Last year's Monte Carlo was validated with NumPy 1.26.4. New code needs NumPy 2.3.3. Make one environment for each and install into each through its own pip:

```text
$ python3 -m venv old-sim
$ python3 -m venv new-sim
$ old-sim/bin/pip install -q "numpy==1.26.4"
$ new-sim/bin/pip install -q "numpy==2.3.3"
$ old-sim/bin/python -c "import numpy; print(numpy.__version__)"
1.26.4
$ new-sim/bin/python -c "import numpy; print(numpy.__version__)"
2.3.3
$ du -sh old-sim new-sim
107M    old-sim
102M    new-sim
```

**Step 1.** Each `python3 -m venv` made a separate folder with its own empty site-packages.

**Step 2.** Each `pip` lives in its own environment's `bin/`, so it installs into that environment only.

**Step 3.** Asking each Python for its NumPy version gives two different answers on the same machine at the same moment.

**Sanity check.** The global Python on this machine has a third NumPy (2.4.6), untouched by either install. Each environment costs about 100 MB of disk, almost all of it NumPy. That is cheap enough to have one per project and throw them away freely.
:::

## pip: the installer

**pip** is the standard installer. It downloads packages from an index (PyPI by default, as the last lesson of this module explains), works out a set of versions that satisfy every requirement, and unpacks the wheels into the site-packages of the Python that runs it. That last part matters: `pip` installs into whichever environment its own Python belongs to. Writing `python -m pip` instead of bare `pip` makes that explicit and removes a common source of confusion.

The commands you use every day:

```text
$ python -m pip install .                  # the package in this folder, a real install
$ python -m pip install ".[plot,dev]"      # the same, plus two extras
$ python -m pip install -r requirements.txt
$ python -m pip freeze                     # every installed package, pinned with ==
```

pip does *not* create environments, does *not* install Python itself, and does *not* keep a lockfile for you. `pip freeze` prints what happens to be installed on this one machine — useful for a quick record, but it carries no hashes and is only right for this platform and this Python version.

What pip *can* do is enforce a lockfile somebody else produced. In **hash-checking mode**, every line of the requirements file carries one or more [[hashes|hash-fingerprint]] — fingerprints of the exact files allowed — and pip refuses anything else. Turn it on with `--require-hashes` (it also switches on by itself as soon as any line has a hash).

::: example A tampered file is refused
Write a one-line requirements file with a deliberately wrong fingerprint for the small `six` package:

```text
six==1.17.0 \
    --hash=sha256:0000000000000000000000000000000000000000000000000000000000000000
```

Install from it into a fresh environment:

```text
$ f2/bin/pip install --require-hashes -r bad.lock
Collecting six==1.17.0 (from -r bad.lock (line 1))
  Using cached six-1.17.0-py2.py3-none-any.whl (11 kB)
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    six==1.17.0 from https://files.pythonhosted.org/.../six-1.17.0-py2.py3-none-any.whl:
        Expected sha256 0000000000000000000000000000000000000000000000000000000000000000
             Got        4721f391ed90541fddacab5acf947aa0d3dc7d27b2e1e8eda2be8970586c3274
```

**Step 1.** pip found the right name and version and downloaded the wheel.

**Step 2.** Before unpacking, it computed the file's SHA-256 fingerprint.

**Step 3.** The fingerprint did not match the one written down, so it installed nothing at all.

**Sanity check.** The version was right; only the bytes differed. A lockfile with hashes pins the exact file, not only the version number, which is why a hashed lockfile protects you from a file that was swapped on the server.
:::

## uv: one fast tool for all of it

**uv** is a newer tool, written in the [[Rust|rust-speed]] programming language by the company Astral and first released in 2024. It does the jobs of venv, pip and a lockfile tool in one program, and it does them fast. It comes in two modes.

**Drop-in mode** copies pip's commands, so you can switch without changing habits:

```text
$ uv venv                          # like python -m venv .venv (but no pip inside)
$ uv pip install ".[plot]"         # like pip install, into ./.venv
$ uv pip compile pyproject.toml --generate-hashes -o requirements.lock
```

That last line writes a hashed lockfile from the dependencies in `pyproject.toml`. For the `gnc-toolkit` package with its `plot` extra, two direct dependencies (NumPy and matplotlib) grew into 11 pinned packages carrying 493 hashes — one hash per wheel file, because each package ships separate wheels for Linux, macOS, Windows and each Python version.

**Project mode** manages the whole project from `pyproject.toml`:

```text
$ uv lock
Resolved 26 packages in 354ms
$ uv sync
 + gnc-toolkit==0.1.0 (from file:///home/you/gnc-toolkit)
 + numpy==2.4.6
$ uv run gnc-orbit 400
7672.6 m/s
```

- `uv lock` resolves the full dependency graph and writes `uv.lock`. It is a **universal lockfile**: one file that records the right choice for every platform and every Python the project allows. That is why it holds 26 packages here, more than any one machine installs — it includes the extras and, for example, an older NumPy for Python 3.10, since NumPy 2.3 and later need Python 3.11.
- `uv sync` makes `.venv` match the lockfile exactly: installs what is missing, removes what is not listed. It installs your own package in editable mode, as in the editable-installs lesson.
- `uv run` syncs first if needed, then runs the command inside the environment. No activation.

If someone changes `pyproject.toml` and forgets to re-lock, `uv sync --locked` stops instead of quietly re-resolving:

```text
$ uv sync --locked
The lockfile at `uv.lock` needs to be updated, but `--locked` was provided.
```

That is the flag to use in CI. uv can also install Python itself. `uv python install 3.12` downloaded a standalone Python 3.12.11 in about 1.4 seconds here, without administrator rights.

::: example How much faster, and why
Install the same four pinned packages — NumPy 2.3.3, SciPy 1.16.2, matplotlib 3.10.6 and pytest 8.4.2, which pull in 16 packages in all — into three fresh environments on the same machine:

| Tool | Cache | Time |
|---|---|---|
| pip 26.2 | none | 13.8 s |
| uv 0.8 | empty | 1.44 s |
| uv 0.8 | already filled | 0.11 s |

**Step 1.** Cold against cold: $13.8 / 1.44 \approx 9.6$, so uv was about ten times faster with the same downloads to do. It downloads in parallel and unpacks while downloading.

**Step 2.** Warm: $13.8 / 0.11 \approx 130$ times faster. With a filled cache, uv does not unpack anything; it links the already-unpacked files from its cache into the new environment.

**Sanity check.** Your numbers will differ with your network and disk, but the shape will not. In CI, where every push builds a fresh environment, that adds up to hours a week.
:::

::: warning uv venv has no pip inside
An environment made by `uv venv` contains no pip, so `.venv/bin/python -m pip` fails with "No module named pip". That is on purpose: you install with `uv pip install`. If a tool insists on pip, make the environment with `uv venv --seed`.
:::

## conda: a different world

Everything so far installs **Python packages** from PyPI. **conda** is a separate package and environment manager with its own package format and its own servers, called **[[channels|conda-channels]]**. The key difference is that a conda package can be *anything*: Python itself, a C library, a Fortran compiler, the CUDA toolkit for GPUs, the HDF5 file library, the GDAL map-projection library, a math library like Intel MKL. conda resolves and installs all of them together, into an environment that lives in its own folder, with no administrator rights.

The daily commands look like this. Read them as a description; conda is not installed on the machine used to write this lesson, so there is no real output to show.

```text
$ conda create -n traj python=3.11 numpy scipy hdf5 -c conda-forge
$ conda activate traj
$ conda env export > environment.yml
```

- `conda create -n traj ...` makes a named environment `traj` and installs Python 3.11 plus the listed packages into it. `-c conda-forge` picks the community channel, conda-forge, which has the widest and freshest collection.
- `conda activate traj` switches your shell into it. Unlike venv, conda relies on activation, because non-Python libraries often need environment variables set.
- `environment.yml` is conda's list of what to install. Like `requirements.txt`, it is not a full lockfile; a separate tool, **conda-lock**, produces one.

**mamba** and **micromamba** are faster versions that accept the same commands.

When is conda the right answer? When the hard part of your install is not Python. A geodesy tool that needs GDAL and PROJ, a GPU code that needs a matching CUDA, or a Windows laptop that has no C compiler: conda installs prebuilt binaries for all of them. Anaconda's own default channel requires a paid license for commercial use at larger organizations, which is one reason many teams use conda-forge only.

::: warning Mixing conda and pip
You can run `pip install` inside a conda environment, but conda does not know what pip changed. If pip upgrades NumPy underneath a conda-installed SciPy that was built against the old one, you get the import-time crashes described in the dependency-resolution lesson. The rule: install everything you can with conda first, then pip for the rest, and never go back to conda afterwards in the same environment. If you need to change something, rebuild the environment.
:::

## Which tool, when

The four tools are not rivals so much as different sizes of the same idea.

| Situation | Reach for | Why |
|---|---|---|
| Quick experiment, nothing to install beyond Python | `venv` + `pip` | Built in, works everywhere |
| A pure-Python or wheel-based project, alone or on a team | `uv` (project mode) | Fast, one tool, universal lockfile |
| CI that builds a fresh environment on every push | `uv`, or pip with `--require-hashes` | Speed and exact reproduction |
| Needs non-Python binaries: CUDA, GDAL, compilers, MKL | `conda` / `mamba` from conda-forge | Installs system libraries without root |
| A result that must re-run identically in two years | lockfile inside a **container** | Pins everything below Python too |

That last row points back to the version-pinning lesson. An environment, however carefully locked, pins only the Python packages. The operating system, the C library and the compilers underneath are pinned by a container image named by its digest, and your own code by its version tag. Those three together are the reproducibility chain you met there. The tools in this lesson are how you build the middle link: `uv lock`, a hashed `uv pip compile` output, or conda-lock produce the lockfile, and `uv sync --locked` or `pip install --require-hashes` install exactly what it says, inside the container.

::: example Choosing for a real team
A GNC group has three jobs. Pick a tool for each.

**Job 1.** An analyst wants to try a new plotting idea this afternoon. Only `gnc-toolkit` and matplotlib are needed. **Answer:** a throwaway venv, or `uv venv` and `uv pip install ".[plot]"`. Nothing to lock; the environment is deleted tomorrow.

**Job 2.** The `gnc-toolkit` repository runs its tests in CI on every push, on Python 3.11 and 3.12. **Answer:** uv in project mode. `uv.lock` is committed; CI runs `uv sync --locked` and then `uv run pytest`. The universal lockfile covers both Python versions from one file.

**Job 3.** A trajectory-dispersion campaign that reads terrain from GeoTIFF files through GDAL, and whose numbers go into a launch-readiness review. **Answer:** a container image built from conda-forge (for GDAL and its C libraries) with a conda-lock lockfile, tagged by digest, running a tagged version of the package.

**Sanity check.** The tool got heavier exactly as the cost of an irreproducible answer went up: nothing, then a broken build, then a number nobody can re-derive.
:::

## Check yourself

::: check
You run `pip install scipy` and then `python -c "import scipy"` fails with `ModuleNotFoundError`. Give the most likely reason and a way to prevent it.
:::

::: answer
The `pip` command and the `python` command belong to different environments. For example, `pip` came from an activated environment (or the global Python) while `python` is another interpreter earlier on `PATH`. pip installed SciPy into its own environment's site-packages, which the other Python never searches. Prevent it by always installing with `python -m pip install scipy` (or `.venv/bin/python -m pip`), which guarantees that the Python that installs is the Python that runs. `python -c "import sys; print(sys.prefix)"` shows which environment you are really in.
:::

::: check
What does `source .venv/bin/activate` change, and what does it not change?
:::

::: answer
It puts `.venv/bin` at the front of the shell's `PATH` and sets `VIRTUAL_ENV` (and changes the prompt). So typing `python` or `pytest` now finds the environment's copies first. It does not install, copy or move anything, and it does not change which packages exist. The environment works the same without activation if you call `.venv/bin/python` directly.
:::

::: check
A teammate commits the output of `pip freeze` from their Mac and calls it the project's lockfile. Name two things it lacks compared with `uv.lock` or a hashed `uv pip compile` output.
:::

::: answer
First, it has no hashes, so it pins version numbers but not the exact files: a replaced file with the same version would install without complaint. Second, it records what was installed on one Mac with one Python version. Packages needed only on Linux or only on another Python version are missing, and packages that were installed by hand for other reasons are included. A proper lockfile is generated from the declared dependencies, covers every platform and Python you target, and carries a hash for every file.
:::

::: check
Your project needs SciPy and also the HDF5 C library at a specific version, and several teammates use Windows laptops with no compiler. Which tool fits, and what rule do you follow if one small package exists only on PyPI?
:::

::: answer
conda (or mamba) with the conda-forge channel, because it installs the HDF5 C library and prebuilt SciPy binaries on every platform without needing a compiler or administrator rights. For the PyPI-only package, create the environment with everything conda can provide first, then run `pip install` for that one package last, and do not run conda install in that environment afterwards. To change anything later, rebuild the environment from `environment.yml`.
:::

::: check
In the timing example, the second uv install took 0.11 s against pip's 13.8 s. Why is that comparison not the fair one if you want to know how much uv speeds up a CI job on a brand-new machine?
:::

::: answer
The 0.11 s run used a cache that was already full: uv only linked files that were already unpacked. A brand-new CI machine starts with an empty cache, so the fair comparison is cold against cold, 1.44 s against 13.8 s, a speed-up of about $13.8 / 1.44 \approx 9.6$ times. Many CI systems can save the uv cache between runs, and then the warm number becomes the realistic one.
:::

## Summary

| Tool or idea | What it is | Fact to remember |
|---|---|---|
| Environment | interpreter + private site-packages | marked by `pyvenv.cfg`; `sys.prefix != sys.base_prefix` inside |
| `venv` | built-in environment maker | `python3 -m venv .venv`; activation only edits `PATH` |
| `pip` | the standard installer | installs into its own Python's environment; `--require-hashes` enforces a lock |
| `uv` | fast all-in-one tool | `uv lock` / `uv sync --locked` / `uv run`; universal `uv.lock` |
| `conda` | cross-language package manager | installs non-Python binaries; conda first, pip last |
| Hashed lockfile | the middle link of the reproducibility chain | built by `uv lock` or `uv pip compile --generate-hashes`; installed with `uv sync --locked` |

You can now build an environment that runs your package the same way everywhere. The next lesson makes the package understandable to the people who use it: NumPy-style docstrings, a Sphinx site built from them, and a README that gets a stranger from clone to a plot in ten minutes.

::: context site-packages Where installed code lives
Every Python has a folder named `site-packages`, somewhere like `lib/python3.11/site-packages`. "Site" is old Python talk for "this particular installation", as in "site-specific". When pip installs NumPy, it unpacks the wheel into a `numpy/` folder there plus a small `numpy-2.3.3.dist-info` folder holding the metadata. Python adds site-packages to `sys.path` at startup, after the standard library, which is why installed packages can be imported from anywhere. An environment is, at heart, a way of swapping in a different site-packages folder.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="32" font-size="13" fill="#1f2a44">.venv/</text>
  <text x="40" y="56" font-size="12" fill="#1d6fd1">pyvenv.cfg</text>
  <text x="200" y="56" font-size="11" fill="#6c7a93">marks the environment</text>
  <text x="40" y="80" font-size="12" fill="#1f2a44">bin/python</text>
  <text x="200" y="80" font-size="11" fill="#6c7a93">link to real interpreter</text>
  <text x="40" y="104" font-size="12" fill="#1f2a44">lib/python3.11/</text>
  <rect x="56" y="114" width="126" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="64" y="131" font-size="12" fill="#1f2a44">site-packages/</text>
  <text x="200" y="131" font-size="11" fill="#6c7a93">numpy/, gnc/, …</text>
</svg>
```
:::

::: context symlink-shortcut A file that points at another file
A symbolic link, or symlink, is a tiny file whose only content is the path of another file. Open it and the operating system quietly opens the target instead, like a shortcut on a desktop. The editable-installs lesson used them to build a link tree. Here venv uses one so that `.venv/bin/python3` runs the real interpreter in `/usr/local/bin` without copying its megabytes. That is also why an environment breaks if you delete or upgrade the Python it was made from: the link points at nothing, or at a different version.
:::

::: context path-variable How the shell finds commands
When you type `python`, the shell does not search your whole disk. It reads an environment variable named `PATH`, a list of folders separated by colons, and runs the first `python` it finds, left to right. Activation adds `.venv/bin` to the left end, so its `python` wins. You can see the list with `echo $PATH`, and which file actually wins with `which python`. Most "wrong Python" puzzles are solved by those two commands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">PATH after activate, searched left to right</text>
  <rect x="10" y="34" width="110" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">.venv/bin</text>
  <rect x="130" y="34" width="110" height="34" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="185" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">/usr/local/bin</text>
  <rect x="250" y="34" width="100" height="34" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="300" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">/usr/bin</text>
  <line x1="20" y1="84" x2="330" y2="84" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="330,79 340,84 330,89" fill="#6c7a93"/>
  <text x="65" y="106" font-size="11" text-anchor="middle" fill="#b4232c">python found here</text>
  <text x="240" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">never reached</text>
</svg>
```
:::

::: context hash-fingerprint A fingerprint for a file
A hash function reads every byte of a file and produces a short fixed-length code. SHA-256 gives 256 bits, written as 64 hexadecimal characters. Change a single byte anywhere and the code changes completely, and nobody knows how to build a different file with the same code on purpose. So writing down a file's hash is like writing down its fingerprint: later, anyone can check they received exactly that file. Package indexes publish the hash of every file, and lockfiles copy those hashes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="110" height="44" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">six-1.17.0</text>
  <text x="65" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">.whl, 11 kB</text>
  <line x1="124" y1="42" x2="160" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="160,37 170,42 160,47" fill="#1f2a44"/>
  <text x="147" y="32" font-size="11" text-anchor="middle" fill="#6c7a93">SHA-256</text>
  <rect x="174" y="20" width="176" height="44" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="262" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">4721f391ed90…</text>
  <text x="262" y="56" font-size="11" text-anchor="middle" fill="#6c7a93">64 hex characters</text>
  <text x="10" y="92" font-size="11" fill="#1f2a44">one byte changed in the file</text>
  <text x="10" y="112" font-size="11" fill="#b4232c">a completely different code, and pip refuses it</text>
</svg>
```
:::

::: context rust-speed Why a Rust program installs faster
Rust is a compiled language, like C, so uv starts in milliseconds instead of loading a Python interpreter first. But most of the speed comes from design, not language. uv downloads many packages at once, reads only the metadata it needs to resolve versions, and keeps one global cache of unpacked wheels. A new environment gets links into that cache, not fresh copies, so installing SciPy the second time moves almost no bytes. pip, written in Python and built in an era of slower networks, does these steps more one at a time.
:::

::: context conda-channels Where conda packages come from
A conda channel is a server of conda packages, the way PyPI is a server of wheels. The two big ones are Anaconda's own default channel and conda-forge, a community project where volunteers maintain build recipes in public GitHub repositories and build every package for Linux, macOS and Windows. Because conda-forge also builds the C and Fortran libraries underneath, a package like SciPy there is linked against libraries from the same channel. Mixing channels in one environment can bring back the binary mismatches conda was meant to avoid, so teams usually pick conda-forge and set it as the only channel.
:::
