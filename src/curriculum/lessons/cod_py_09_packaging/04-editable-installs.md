---
id: l04-editable-installs
title: Editable installs and what they really do
minutes: 22
covers:
  - Editable installs and what they actually do
---

Picture a photo on your phone. You can send a friend a **copy** of it, or you can send a **link** to the album where it lives. The copy is frozen: if you crop the photo tomorrow, your friend still has the old one. The link is live: every time your friend opens it, they see whatever is in the album right now, crop and all.

Installing a Python package works the same two ways. A normal install copies your code into the environment. That copy is frozen: edit the source afterwards and nothing changes until you install again. An **editable install** — `pip install -e .`, where `-e` stands for "editable" — installs a link to your source folder instead. Edit a file, rerun your program, and the change is there.

That is exactly what you want while you build a navigation filter or tune a guidance law: change a gain, rerun the Monte Carlo, look at the plot, repeat, fifty times an afternoon. But the link has a cost. It shows Python the whole source folder, and a real user never gets the source folder — they get whatever your build packed into the box. This lesson opens up both kinds of install, shows exactly what files `pip install -e .` writes and why, which edits reach your program and which do not, and how the link can hide a packaging bug until the day a colleague installs your code for real.

## What a regular install does

Start with the ordinary kind. When you run `pip install .` inside a project folder, pip does two things.

1. It asks your **build backend** (setuptools, hatchling or flit, from the previous lesson) to build a **wheel** — a zip file holding the package's files plus a little metadata. The next lesson opens a wheel up in detail.
2. It unpacks that wheel into the environment's **[[site-packages|site-packages]]** folder — the folder where every installed package lives.

Here is a small project, laid out the way the src-layout lesson recommends. It is the `gnc` toolkit from the first lesson, now reading Earth's constants from a small data file:

```text
gnc-toolkit/             <- the project folder
    pyproject.toml
    src/
        gnc/
            __init__.py
            constants.py
            orbits.py
            data/
                earth.json
    tests/
        test_constants.py
```

After `pip install .` into a fresh virtual environment, the package really is a copy. Ask Python where it loaded `gnc` from, and it answers with a path inside site-packages, not inside your project:

```text
$ python -c "import gnc; print(gnc.__file__)"
/home/you/gnc-toolkit/.venv/lib/python3.11/site-packages/gnc/__init__.py
```

Next to the copied `gnc/` folder, pip writes a folder named `gnc_toolkit-0.1.0.dist-info`. It holds the package's **metadata** — facts about the package rather than code. `METADATA` has the name, version and dependencies. `RECORD` lists every file that was installed, so `pip uninstall` knows what to delete. You will meet this folder again in the next two lessons.

Now open `src/gnc/orbits.py` and change a number. Rerun your program. Nothing happens. Python is reading the copy in site-packages, and the copy did not change. To see the edit you must run `pip install .` again.

## What an editable install does

Run `pip install -e .` instead. The first half of the story is the same: pip asks the backend for a wheel. But it asks for a special one, an **editable wheel**, using a hook that every modern backend supports. The rules for that hook are written in a Python standard called **[[PEP 660|pep-660]]**.

An editable wheel is tiny. For the `gnc` project it is about 1.2 kB. It holds the same `.dist-info` metadata as a real wheel, but no code at all. In place of the code it holds a **pointer** back to your source folder. Backends use one of three kinds of pointer.

### Pointer one: a path entry

Look in site-packages after an editable install with the setuptools backend and the src layout:

```text
$ ls .venv/lib/python3.11/site-packages
__editable__.gnc_toolkit-0.1.0.pth
gnc_toolkit-0.1.0.dist-info
pip
pip-24.0.dist-info
...
```

There is no `gnc/` folder at all. There is a file ending in `.pth` instead. Open it:

```text
$ cat .venv/lib/python3.11/site-packages/__editable__.gnc_toolkit-0.1.0.pth
/home/you/gnc-toolkit/src
```

One line: the path to your `src` folder. A **[[.pth file|pth-file]]** — a "path configuration file" — is a plain text file that Python reads every time it starts. Each line that names a folder gets added to the end of `sys.path`, the search path from the first lesson. So every Python in this environment now searches your `src` folder too:

```python
import sys

print(sys.path[-2:])
# ['/home/you/gnc-toolkit/.venv/lib/python3.11/site-packages', '/home/you/gnc-toolkit/src']
```

When your program says `import gnc`, Python walks the path, reaches `/home/you/gnc-toolkit/src`, finds `gnc/` there and loads your working files directly. Hatchling does the same thing: its file is named `_editable_impl_gnc_toolkit.pth`, and it holds the same one line.

### Pointer two: an import hook

A path entry is a blunt tool. It exposes *everything* in the folder it names. With the src layout that is fine, because `src/` holds only your package. With a **flat layout** — where the package folder sits at the top of the project, next to `setup.py`, `noxfile.py` and scratch scripts — adding the project folder to `sys.path` would make all those stray files importable too.

So for a flat layout, setuptools writes a small Python module instead, called a **finder**, and a `.pth` line that switches it on. (A `.pth` line that starts with `import` is run as code, not read as a folder.)

```text
$ cat .venv/lib/python3.11/site-packages/__editable__.gnc_toolkit-0.1.0.pth
import __editable___gnc_toolkit_0_1_0_finder; __editable___gnc_toolkit_0_1_0_finder.install()
```

Inside the finder is a dictionary that maps each package name to exactly one folder:

```python
MAPPING: dict[str, str] = {'gnc': '/home/you/gnc-toolkit/gnc'}
```

The finder joins Python's list of **[[import hooks|import-hooks]]** — the helpers Python asks, one after another, "can you find a module called this?". When asked for `gnc`, it answers with that folder. When asked for `noxfile`, it says no, so stray files stay hidden.

### Pointer three: a link tree

Setuptools has a third, stricter option. Ask for it with a setting passed through pip:

```bash
pip install -e . --config-settings editable_mode=strict
```

In **strict mode** the backend works out which files a real wheel would contain, and builds a folder in `build/` that holds a **[[symbolic link|symlink]]** — a shortcut file that points at another file — for each one, and nothing else. The `.pth` file points Python at that folder. Edits to existing files still show up, because each link points at your real file. But a file the wheel would leave out gets no link, so Python cannot see it. You will see below why that is useful.

::: key What `pip install -e .` does
It installs a link (a path entry or hook) to your source tree instead of copying files, so edits take effect without reinstalling. It is a development convenience, and it can hide packaging errors that a real install would expose.
:::

### How to tell which kind you have

`pip list` marks an editable project with the folder it points at:

```text
$ pip list
Package      Version Editable project location
------------ ------- -------------------------
gnc-toolkit  0.1.0   /home/you/gnc-toolkit
pip          24.0
```

Underneath, pip records the same fact in a file called `direct_url.json` inside the `.dist-info` folder: `{"dir_info": {"editable": true}, "url": "file:///home/you/gnc-toolkit"}`. And `gnc.__file__` is the quickest test of all: a path inside site-packages means a copy, a path inside your project means a link.

::: example Watching one edit travel
You have run `pip install -e .` for `gnc`. Here is what happens, step by step, when you change the code and rerun.

**Step 1.** Before the edit, compute the speed of a circular orbit at the International Space Station's height, $400\,\mathrm{km}$:

```python
from gnc.orbits import circular_speed

print(round(circular_speed(400_000), 1))
# 7668.6
```

Check it by hand with the file's constants, $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$ and the equator radius $R = 6\,378\,137\,\mathrm{m}$. The orbit radius is $r = 6\,378\,137 + 400\,000 = 6\,778\,137\,\mathrm{m}$, so

$$
v = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{3.986004418 \times 10^{14}}{6.778137 \times 10^{6}}} \approx 7668.6\,\mathrm{m/s}.
$$

**Step 2.** Where did that function come from? Print its file:

```python
import gnc.orbits

print(gnc.orbits.__file__)
# /home/you/gnc-toolkit/src/gnc/orbits.py
```

It is your working file, reached through the `.pth` line. No copy exists anywhere.

**Step 3.** Edit `src/gnc/orbits.py` so the function rounds to whole meters per second, save it, and start Python again. The new behavior is there with no reinstall, because Python reads the same file you saved.

**Step 4.** Add a brand-new file, `src/gnc/frames.py`. `import gnc.frames` works at once, because Python searches the whole `src/gnc/` folder. (In strict mode this step would fail until you reinstall, because the link tree has no link for a file it has never seen.)

So the path entry carries every code change straight through. That is the whole appeal.
:::

## Which edits reach your program, and which do not

An editable install links your *code*. It does not re-run the build. So anything that the build produces, rather than reads, is frozen at the moment you ran `pip install -e .`.

| You changed | Seen without reinstalling? |
|---|---|
| Python code in an existing module | Yes, after Python restarts |
| A new module inside the package | Yes (path entry or hook); no in strict mode |
| The version or dependencies in `pyproject.toml` | No: reinstall |
| Command-line scripts in `pyproject.toml` | No: reinstall |
| C, C++ or Cython extension code | No: rebuild and reinstall |

Three of these deserve a closer look.

**Python has to restart.** A module runs once and then lives in the module cache, `sys.modules`. A program that is already running, such as a Jupyter kernel with your package imported, keeps using the old code. Restart the kernel, or use the notebook's **[[autoreload|autoreload]]** extension.

**Metadata is a snapshot.** The `.dist-info` folder was written once, at install time. If you raise the version in `pyproject.toml`, the installed metadata still says the old one. Here the version was changed from `0.1.0` to `0.2.0` in both `pyproject.toml` and `__init__.py`, without reinstalling:

```python
import gnc
from importlib.metadata import version

print(gnc.__version__)   # read from your source file
print(version("gnc-toolkit"))    # read from the installed .dist-info
# 0.2.0
# 0.1.0
```

The two disagree. The same goes for a dependency you add: pip will not install it until you reinstall. And the same goes for command-line entry points, which lesson six covers: their launcher files are written at install time.

**Compiled code is built, not linked.** A C++ extension module has to be compiled into a shared library. The editable install compiled it once. Change the C++ and nothing happens until you build again.

::: warning Reinstall after touching pyproject.toml
Any edit to `pyproject.toml` — version, dependencies, entry points, which files to include — needs `pip install -e .` again. A good habit: whenever something about the package's *shape* changes, reinstall before you trust any result.
:::

## How the link hides a packaging bug

Here is the catch. Your source folder holds everything: every module, every data file, every scratch script. A wheel holds only what the backend was told to pack. An editable install lets Python read the source folder. A regular install lets Python read only the wheel. **The two modes exercise different sets of files.**

So a file that exists in your source tree but is missing from the wheel works perfectly for you and breaks for everybody else.

Notice that the src layout from lesson two does not save you here. That layout keeps the project root off `sys.path`, so a test cannot reach the source by accident. An editable install puts `src/` back on `sys.path` on purpose.

::: example A data file that only exists on your machine
The `gnc` constants module reads Earth's constants from a data file that sits inside the package, using `importlib.resources`, the standard way to read a file that ships inside a package:

```python
# src/gnc/constants.py
import json
from importlib.resources import files

_EARTH = json.loads(files("gnc").joinpath("data/earth.json").read_text())
MU_EARTH = _EARTH["mu_m3_s2"]
R_EARTH = _EARTH["radius_m"]
```

The project uses setuptools, and its `pyproject.toml` lists nothing about data files.

**Step 1: the editable install.** `pip install -e .`, then the test:

```text
$ pytest -q tests
.                                                    [100%]
1 passed in 0.17s
```

Green. `files("gnc")` pointed at `/home/you/gnc-toolkit/src/gnc`, and `earth.json` is sitting right there.

**Step 2: a regular install** into a fresh environment, then the same test, run from a folder outside the project:

```text
$ pytest -q ~/gnc-toolkit/tests
E   FileNotFoundError: [Errno 2] No such file or directory:
    '.../site-packages/gnc/data/earth.json'
1 error in 0.11s
```

**Step 3: look in the box.** List the installed package folder:

```text
$ ls .venv/lib/python3.11/site-packages/gnc
__init__.py  __pycache__  constants.py  orbits.py
```

Three modules, no `data/` folder. Setuptools packs `.py` files automatically, but it packs other files only when you tell it to, through a `package-data` setting or a `MANIFEST.in` file. Nobody told it.

**Step 4: fix and prove it.** Add two lines to `pyproject.toml`:

```toml
[tool.setuptools.package-data]
gnc = ["data/*.json"]
```

Reinstall into the fresh environment. Now `site-packages/gnc/data/earth.json` exists and the test passes: `1 passed`. The bug was never in the code. It was in the list of files, and the editable install could not see that list.
:::

Missing data files are the most common form of this bug, but not the only one. Others that editable mode hides:

- a **subpackage left out** of an explicit list such as `packages = ["gnc"]`, which leaves `gnc/nav/` out of the wheel;
- a file your **[[version control|version-control]]** ignores, when the backend decides what to pack by asking git;
- a module that sits outside the package but that your code imports by accident, when a path entry exposes the whole project folder (the reason for the src layout).

::: warning Green on your laptop is not green for your users
A test suite that passes under `pip install -e .` has tested your source folder, not your package. The two can differ by a single forgotten line in `pyproject.toml`, and nothing in your daily work will show it.
:::

## Testing the real thing

The cure is to test the package the way a user gets it, at least once for every change. The usual place is a job in **[[continuous integration|continuous-integration]]**, the server that runs your tests on every push:

```bash
python -m build --wheel                 # build the real box
python -m venv /tmp/fresh               # an empty environment
/tmp/fresh/bin/pip install dist/*.whl pytest
cd /tmp                                 # leave the source tree
/tmp/fresh/bin/python -m pytest ~/gnc-toolkit/tests
```

Each line closes one gap. Building a wheel packs exactly what users will get. A fresh environment has no leftover editable link. Changing folder takes your project off the front of `sys.path`. With the src layout, the tests can then import `gnc` only from the installed wheel. If a file is missing from the wheel, this job fails before any user sees it.

Locally, setuptools' strict mode gives you part of the same protection every day. Rerun the data-file example with `--config-settings editable_mode=strict` and the missing file shows up at once, even in editable mode:

```text
FileNotFoundError: [Errno 2] No such file or directory:
    '/home/you/gnc-toolkit/build/__editable__.gnc_toolkit-0.1.0-py3-none-any/gnc/data/earth.json'
```

The link tree held links only for the files the wheel would contain, and `earth.json` was not one of them.

::: note Why an editable install is not a worse regular install
It is tempting to conclude that editable installs are broken. They are not: they do exactly what they promise, which is to run your working files. The mistake is using one tool for two jobs. The editable install answers "does my code work?". The wheel installed in a clean environment answers "does my *package* work?". A healthy project asks both questions, the first fifty times a day and the second on every push.
:::

## Check yourself

::: check
You ran `pip install -e .` on a src-layout project that uses hatchling. Name the file that appeared in site-packages, say what is inside it, and explain how Python uses it.
:::

::: answer
A `.pth` file, named `_editable_impl_<name>.pth` by hatchling. It holds one line: the absolute path to the project's `src` folder. When Python starts, it reads every `.pth` file in site-packages and adds each folder line to the end of `sys.path`. So `import gnc` searches `src/` and finds the package in your working tree. No copy of the code is made; site-packages holds only this pointer and the `.dist-info` metadata.
:::

::: check
You add `scipy` to the `dependencies` list in `pyproject.toml`, save, and run your editable-installed code in a fresh environment. It fails with `ModuleNotFoundError: No module named 'scipy'`. Why, and what fixes it?
:::

::: answer
An editable install links your code but not your metadata. The dependency list was read once, when you ran `pip install -e .`, and pip installed the dependencies listed at that moment. Adding a line to `pyproject.toml` afterwards changes nothing in the environment. Rerun `pip install -e .`: pip reads the new list, installs SciPy, and rewrites the `.dist-info` metadata.
:::

::: check
Why does setuptools use an import hook, rather than a plain path entry, for a flat-layout project?
:::

::: answer
A path entry adds a whole folder to `sys.path`. In a flat layout, the package folder sits in the project root beside other files, such as `setup.py`, `noxfile.py` or scratch scripts. Putting the project root on `sys.path` would make every one of those importable, which a real install would never do. The import hook maps each package name to exactly one folder, so only the real package can be found. With the src layout the problem does not arise, because `src/` holds nothing but the package.
:::

::: check
In a Jupyter notebook you import `gnc`, run a simulation, then fix a bug in `src/gnc/orbits.py` and rerun the cell. The old, buggy result comes back. The install is editable. What went wrong?
:::

::: answer
Editable mode makes Python read your working file, but only when the module is imported. The kernel imported `gnc.orbits` before the fix, and the module now sits in `sys.modules`. Rerunning `import gnc.orbits` finds the cached module and does not read the file again. Restart the kernel, or turn on autoreload, and the fix appears.
:::

::: check
A teammate says: "Our tests all pass with `pip install -e .`, so the package is fine to publish." Give two concrete kinds of bug their test run cannot have caught, and one command sequence that would catch them.
:::

::: answer
Any file that is in the source tree but not in the wheel. For example: a data file such as a JSON table that the backend was never told to include, or a subpackage left out of an explicit `packages` list. Both import fine from the source folder and fail from a real install. To catch them, build a wheel with `python -m build --wheel`, install that wheel into a brand-new virtual environment, change to a folder outside the project, and run the tests there with that environment's Python.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Regular install | `pip install .` | Builds a wheel and copies it into site-packages; edits need a reinstall |
| Editable install | `pip install -e .` | Installs a pointer to the source tree; code edits show up after a restart |
| Editable wheel | What the backend builds for `-e` (PEP 660) | Metadata plus a pointer, no code; about 1 kB |
| Path entry | A `.pth` file naming `src/` | Adds the folder to the end of `sys.path` at startup |
| Import hook | A finder module switched on by a `.pth` line | Maps each package name to one folder; used for flat layouts |
| Strict mode | `--config-settings editable_mode=strict` | A tree of links to exactly the wheel's files; new files need a reinstall |
| Frozen at install | Version, dependencies, entry points, compiled code | Reinstall after editing `pyproject.toml` |
| The hidden bug | Source tree and wheel hold different files | Test the built wheel in a fresh environment, from outside the tree |

The next lesson opens up the box itself: what a wheel really contains, how it differs from a source distribution, and why NumPy and SciPy ship as prebuilt manylinux wheels.

::: context site-packages Where installed packages live
Every Python environment has one folder where installed third-party packages go. On Linux and macOS it is `lib/python3.X/site-packages` inside the environment; on Windows it is `Lib\site-packages`. Debian-based systems call the system one `dist-packages`. Python's `site` module adds this folder to `sys.path` at startup, which is why installed packages can be imported from anywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="bold">pip install .</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="bold">pip install -e .</text>
  <line x1="180" y1="8" x2="180" y2="162" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="20" y="30" width="140" height="40" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">src/gnc/ (your files)</text>
  <line x1="90" y1="70" x2="90" y2="104" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="90,112 84,100 96,100" fill="#1d6fd1"/>
  <text x="100" y="92" font-size="11" fill="#1d6fd1">copy</text>
  <rect x="20" y="114" width="140" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">site-packages/gnc/</text>
  <rect x="200" y="30" width="140" height="40" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">src/gnc/ (your files)</text>
  <rect x="200" y="114" width="140" height="40" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">site-packages/*.pth</text>
  <line x1="270" y1="112" x2="270" y2="80" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="5 3"/>
  <polygon points="270,72 264,84 276,84" fill="#b4232c"/>
  <text x="280" y="98" font-size="11" fill="#b4232c">points at</text>
</svg>
```
:::

::: context pep-660 The standard behind the -e flag
A PEP, a Python Enhancement Proposal, is a design document the Python community agrees on. PEP 660, accepted in 2021, added one hook, `build_editable`, that any build backend can offer. Before it, `pip install -e` only worked with setuptools, through an old command called `setup.py develop` that wrote an `.egg-link` file. PEP 660 moved the job into the backend, which is why hatchling and flit projects can be installed in editable mode today, and why each backend chooses its own kind of pointer.
:::

::: context pth-file How a two-line text file changes sys.path
When Python starts, the `site` module scans site-packages for files ending in `.pth`. Each line that names a folder that exists is appended to `sys.path`. Each line that starts with `import` is executed as Python code. Blank lines and lines starting with `#` are skipped. That is all an editable path entry needs: one line naming your `src` folder, and the folder is searched after site-packages itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="12" y="18" font-size="12" fill="#1f2a44" font-weight="bold">sys.path, searched top to bottom</text>
  <rect x="12" y="28" width="220" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="44" font-size="11" fill="#1f2a44">current folder</text>
  <rect x="12" y="52" width="220" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="68" font-size="11" fill="#1f2a44">standard library</text>
  <rect x="12" y="76" width="220" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="92" font-size="11" fill="#1f2a44">.venv/.../site-packages</text>
  <rect x="12" y="100" width="220" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="20" y="116" font-size="11" fill="#1f2a44">/home/you/gnc-toolkit/src</text>
  <rect x="262" y="76" width="88" height="24" rx="4" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="306" y="92" font-size="11" text-anchor="middle" fill="#b4232c">gnc.pth</text>
  <path d="M306,100 L306,112 L240,112" fill="none" stroke="#b4232c" stroke-width="1.8"/>
  <polygon points="234,112 244,107 244,117" fill="#b4232c"/>
  <text x="12" y="146" font-size="11" fill="#6c7a93">the .pth line adds the last entry</text>
</svg>
```
:::

::: context import-hooks Python asks a line of finders
Behind `import` sits a list called `sys.meta_path`: a short line of objects called finders. For each import, Python asks them in turn whether they can find a module by that name; the first one to answer wins. The usual last finder is the one that searches `sys.path`. A setuptools editable finder slots into this line, so it can answer for `gnc` with an exact folder and stay silent for every other name.
:::

::: context symlink A file that points at another file
A symbolic link, or symlink, is a small file whose whole content is the path of another file. Open the link and the operating system opens the target instead. Edit through the link and you edit the target. Strict editable mode builds a folder that looks like the installed package, but every file in it is a link back to your real source file. A file the wheel would leave out gets no link at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="80" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="bold">build/ link tree</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="bold">src/gnc/</text>
  <rect x="20" y="30" width="120" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="80" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">__init__.py</text>
  <rect x="20" y="62" width="120" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="80" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">constants.py</text>
  <rect x="20" y="94" width="120" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="80" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">orbits.py</text>
  <rect x="220" y="30" width="120" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="280" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">__init__.py</text>
  <rect x="220" y="62" width="120" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="280" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">constants.py</text>
  <rect x="220" y="94" width="120" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="280" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">orbits.py</text>
  <rect x="220" y="126" width="120" height="20" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="280" y="140" font-size="11" text-anchor="middle" fill="#b4232c">data/earth.json</text>
  <g stroke="#1d6fd1" stroke-width="1.8">
    <line x1="140" y1="42" x2="212" y2="42"/><line x1="140" y1="74" x2="212" y2="74"/><line x1="140" y1="106" x2="212" y2="106"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="220,42 210,37 210,47"/><polygon points="220,74 210,69 210,79"/><polygon points="220,106 210,101 210,111"/>
  </g>
  <text x="80" y="140" font-size="11" text-anchor="middle" fill="#b4232c">no link: not in wheel</text>
</svg>
```
:::

::: context autoreload Reloading code in a live notebook
IPython and Jupyter ship an extension that re-imports changed modules before each cell runs. Type `%load_ext autoreload` and then `%autoreload 2` at the top of a notebook. It pairs well with an editable install: edit the package in your editor, rerun the notebook cell, and the new code runs without restarting the kernel. It cannot always patch objects that were already created from the old code, so restart the kernel before trusting a final result.
:::

::: context version-control When the backend asks git what to pack
Version control is the system, usually git, that records every change to a project's files. Some backends and plugins decide what goes into a package partly by looking at git. Hatchling leaves out files that `.gitignore` lists, and the setuptools-scm plugin packs only files that git tracks. A data file you generated locally but never committed then works in your editable install and is absent from the wheel.
:::

::: context continuous-integration A robot that runs your tests on every push
Continuous integration, or CI, is a service (GitHub Actions, GitLab CI, Jenkins) that starts a clean machine every time someone pushes code, installs the project and runs its checks. Because the machine starts empty, it is the natural place to catch "works on my laptop" bugs. Flight software teams gate every merge on CI; a packaging job that builds and installs the real wheel is one cheap line in that gate.
:::
