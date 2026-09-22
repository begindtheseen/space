---
id: l03-workbench
title: "The workbench: environments, pip, notebooks and git"
minutes: 22
covers:
  - virtual environments and pip
  - Jupyter notebooks
  - git and GitHub
---

A trajectory analysis that cannot be re-run is an anecdote, not a result. Six months after a design review someone will ask why the dispersion ellipse was 4 km wide, and the only acceptable answer is to check out the exact code that produced the figure, install the exact library versions it used, and run it again. The tools in this lesson exist to make that answer possible: a *virtual environment* pins the libraries, *git* pins the code, and a *Jupyter notebook* gives you a place to explore before either of those pins is set.

None of this is glamorous, and all of it is expected. The module's objective "version-control every project from the first commit" is literal. Flight-software teams reject code that arrives without history, and a Monte Carlo campaign run outside a recorded environment is a campaign that has to be run again. Learn these habits now, on small projects, so that they are automatic when the projects are large.

## Why environments: the problem pip solves and the one it creates

Python ships with a standard library — `math`, `csv`, `json` and hundreds more — but NumPy, SciPy and matplotlib are *third-party packages*. They live on the Python Package Index (PyPI), and `pip`, the package installer, downloads and installs them:

```bash
pip install numpy scipy matplotlib
```

Left to itself, pip installs into the one *site-packages* directory of your system Python. That works until your second project. A propagator validated against NumPy 1.26 and a new tool that needs NumPy 2.4 cannot both live in a single directory; upgrading for one breaks the other, and you lose the ability to say which versions produced last year's results. The cure is to give every project its own private copy of the interpreter's package directory: a virtual environment.

## Virtual environments

A *venv* is a directory — conventionally `.venv` inside the project — containing a small `python` launcher that points back at your real interpreter, plus an empty `site-packages` of its own. Create it once per project and *activate* it in each shell you work in:

```bash
cd my-project
python -m venv .venv               # create (python3 on some systems)
source .venv/bin/activate          # activate on macOS / Linux
# .venv\Scripts\activate           # activate on Windows (PowerShell or cmd)
```

Activation edits the shell's `PATH` so that `python` and `pip` now mean the copies inside `.venv`; most shells show the environment's name in the prompt as a reminder. Type `deactivate` to leave. Inside the environment, the layout looks like this:

```bash
ls .venv
# bin  include  lib  lib64  pyvenv.cfg
ls .venv/bin
# Activate.ps1  activate  activate.csh  activate.fish  pip  pip3  pip3.11  python  python3  python3.11
cat .venv/pyvenv.cfg
# home = /usr/local/bin
# include-system-site-packages = false
# version = 3.11.15
```

`include-system-site-packages = false` is the important line: this environment sees nothing that is installed globally. A freshly created venv contains only pip itself, so `python -c "import numpy"` fails inside it until you install NumPy there:

```bash
python -c "import numpy"
# ModuleNotFoundError: No module named 'numpy'
python -m pip install numpy scipy matplotlib
```

Writing `python -m pip` rather than bare `pip` guarantees that the pip you run belongs to the python you are running. It is a small habit that removes an entire class of "but I installed it" confusion.

## Recording and restoring dependencies

Once the project works, freeze the exact versions into a text file and commit that file with the code:

```bash
python -m pip freeze > requirements.txt
cat requirements.txt
# numpy==2.4.6
# scipy==1.17.1
```

A colleague — or you, on a new laptop — recreates the environment from the file. This is the whole workflow, and it is worth memorising as one line:

::: key
Create and activate an isolated Python environment, then install the project's pinned dependencies:

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```
:::

Two supporting commands: `pip list` shows what is installed, and `pip show numpy` shows one package's version and location. The `==` in `numpy==2.4.6` is a *pin*: install exactly that version. Pins make results reproducible; the price is that you must update them deliberately, in a commit of their own, and re-run the tests when you do.

::: note
Two other tools do the same job and you will meet both. `conda` manages non-Python dependencies too and is common in scientific groups; `uv` is a fast modern replacement for pip and venv. The ideas — one isolated environment per project, versions written to a file that lives with the code — are identical, and the commands in this lesson are the ones every tutorial and every collaborator will assume you know.
:::

::: warning Never commit the environment
`.venv` can be hundreds of megabytes of platform-specific binaries, and it is completely reproducible from `requirements.txt`. Add `.venv/` to `.gitignore` before the first commit. The same applies to `__pycache__/` directories and to large generated data or figures — commit the script that makes them, not the output.
:::

## Jupyter notebooks

A notebook is a document of *cells* that you edit in a web browser and execute one at a time against a running Python *kernel*. Code cells hold Python and show their output — text, tables, plots — directly beneath; markdown cells hold prose and mathematics. Install it into the project environment and launch it from the project directory:

```bash
python -m pip install jupyterlab
jupyter lab
```

The browser opens; a new notebook gets a `.ipynb` file. Shift+Enter runs the current cell and moves on. Because the kernel keeps every variable alive between cells, a notebook is the ideal place to load a telemetry file once and then try a dozen plots against it without reloading, or to poke at an array's shape until you understand it. *Magics* — commands starting with `%` — add conveniences: `%timeit expr` times an expression carefully, and `%matplotlib inline` makes plots appear under the cell.

The kernel's persistence is also the notebook's trap. Cells can be run in any order, so a notebook whose cell 7 was run before cell 3 shows outputs that no top-to-bottom execution can reproduce. Before trusting any notebook result, and always before sharing one, use *Restart Kernel and Run All*: if the notebook does not run cleanly from the top, it is not a result yet.

Use notebooks for exploring and explaining; move anything you want to keep into a `.py` module and import it. A function that lives in a notebook cell cannot be tested with pytest, cannot be imported by a script, and is hard to review, because the `.ipynb` file is JSON with embedded output — a one-character change to the code can produce a diff of thousands of lines of base64 image data. Clear outputs before committing (or use a tool such as `nbstripout` that does it automatically), and keep `.ipynb_checkpoints/` in `.gitignore`. The module's plotting exercise insists that the final figure be saved from a script, not a notebook cell, for exactly this reason: a script regenerates the figure identically every time, with no hidden kernel state.

::: key
A notebook's kernel keeps state between cells, so cells can run out of order. Restart the kernel and run all cells top to bottom before trusting or sharing a result; keep reusable code in `.py` modules that the notebook imports.
:::

## git: a history of every version

Git records *snapshots* of a directory. Each snapshot — a *commit* — stores the full contents of every tracked file plus a message, an author and a pointer to the previous commit, so the history is a chain you can walk backwards. Nothing committed is ever lost, any earlier state can be restored in seconds, and two people can work on the same files and reconcile their changes. Three areas matter: the *working tree* (your files on disk), the *staging area* (the set of changes queued for the next commit) and the *repository* (the stored history, inside the hidden `.git` directory).

Start a repository in the project directory, tell git what to ignore, and make the first commit:

```bash
git init -b main
printf '.venv/\n__pycache__/\n*.pyc\n.ipynb_checkpoints/\n' > .gitignore
git status --short
# ?? .gitignore
# ?? orbits.py
git add -A
git commit -m "Initial commit: circular_speed and .gitignore"
git log --oneline
# f9d5dbe Initial commit: circular_speed and .gitignore
```

`??` marks files git has never seen. `git add -A` stages every change in the tree — new files, edits and deletions — and `git commit -m` records the staged snapshot with a message. Each commit is named by a hash; the seven-character prefix `f9d5dbe` is enough to refer to it. (The first time you use git on a machine it asks for `git config --global user.name` and `user.email`, which go into every commit's author line.)

Now edit `orbits.py` to add a function. `git status` shows the file as modified (` M`), and `git diff` shows exactly which lines changed — `+` for added, `-` for removed:

```bash
git status --short
#  M orbits.py
git diff
# --- a/orbits.py
# +++ b/orbits.py
# @@ -6,3 +6,7 @@ MU_EARTH = 3.986004418e14
#  def circular_speed(r, mu=MU_EARTH):
#      return math.sqrt(mu / r)
# +
# +
# +def period(r, mu=MU_EARTH):
# +    return 2 * math.pi * math.sqrt(r**3 / mu)
git add -A
git commit -m "Add circular-orbit period"
git log --oneline
# 2646e52 Add circular-orbit period
# f9d5dbe Initial commit: circular_speed and .gitignore
```

An uncommitted edit you regret is undone with `git restore orbits.py`, which puts the file back to its last committed state. An old version of a file is viewed without touching anything: `git show f9d5dbe:orbits.py`.

### Branches

A *branch* is a movable name for a line of commits. Work that might not pan out — a new drag model, a refactor — goes on its own branch so that `main` always holds something that runs. When the experiment succeeds, *merge* it back:

```bash
git switch -c drag-model            # create and switch to a new branch
# ... add aero.py, then:
git add -A
git commit -m "Add drag force helper"
git switch main
git merge drag-model
# Updating 2646e52..7499607
# Fast-forward
#  aero.py | 2 ++
git log --oneline --graph
# * 7499607 Add drag force helper
# * 2646e52 Add circular-orbit period
# * f9d5dbe Initial commit: circular_speed and .gitignore
git branch -d drag-model            # the branch name is no longer needed
```

If both branches changed the same lines, the merge stops with a *conflict* and marks the disputed region in the file; you edit it to the version you want, `git add` it and commit. Small, frequent commits make conflicts rare and tiny.

### Commit before every experiment

The habit that pays for all the others: commit whenever the code is in a state you would be willing to return to — before you start tuning a parameter, before a refactor, after every test passes. The commits are cheap and the message can be short. What they buy is `git bisect`: given one commit where a result was right and a later one where it is wrong, bisect checks out the midpoint, you (or a script) report good or bad, and it halves the interval until the single commit that introduced the regression is found. With a test script that exits non-zero on failure the whole search is automatic:

```bash
git bisect start HEAD ee34399        # bad = current, good = a known-good commit
git bisect run python3 check.py
# Bisecting: 2 revisions left to test after this (roughly 2 steps)
# ...
# 63a5e02fbaffa308a5a9a2638bde514f68ccae3f is the first bad commit
git bisect reset
```

Eight commits took three checks; a thousand would take ten. Bisect only works if the commits are small enough that "the first bad commit" points at a few lines.

## GitHub: publishing and collaborating

GitHub hosts repositories on a server so that they are backed up, shareable and reviewable. Create an empty repository on the site, then connect your local one to it as a *remote* called `origin` and *push* your branch:

```bash
git remote add origin https://github.com/you/my-project.git
git push -u origin main
# To https://github.com/you/my-project.git
#  * [new branch]      main -> main
# branch 'main' set up to track 'origin/main'.
```

After `-u` has recorded the tracking relationship, plain `git push` and `git pull` move commits to and from the server. Anyone with access gets a complete copy of the history with `git clone <url>`, and a *pull request* on GitHub proposes a branch for review — a colleague reads the diff, comments line by line, and merges when satisfied. GitHub can also run your test suite automatically on every push (its *Actions* feature), so a pull request arrives already marked green or red. Add a `README.md` explaining what the project is and how to set it up — usually the three-command line from the key idea above.

::: key
Record a snapshot and publish it:

```bash
git add -A
git commit -m "message"
git push origin <branch>
```

Commit before every experiment so you can bisect a regression later.
:::

::: example Starting a project from nothing
A new analysis task: a dispersion study of a sounding-rocket trajectory. Set up the project so that anyone can reproduce it.

```bash
mkdir sounding-mc && cd sounding-mc
git init -b main
python -m venv .venv
source .venv/bin/activate
python -m pip install numpy scipy matplotlib pytest
python -m pip freeze > requirements.txt
printf '.venv/\n__pycache__/\n*.pyc\n.ipynb_checkpoints/\nfigures/*.png\n' > .gitignore
printf '# sounding-mc\n\nDispersion study. Setup:\n\n    python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt\n' > README.md
git add -A
git commit -m "Initial commit: environment, requirements, README"
```

Five minutes, and the project already satisfies the module's objective: the first commit exists before any analysis code does, the environment is reproducible from `requirements.txt`, and the ignored patterns mean that `git add -A` will never sweep in the environment or generated figures. From here on, every working step is a commit.
:::

::: example Finding the commit that broke the propagator
A helper `circular_speed` has been returning values around $5 \times 10^{10}\,\mathrm{m/s}$ instead of $7.7\,\mathrm{km/s}$ since "sometime last week". The repository has eight commits since the last known-good one, `ee34399`. A three-line check script asserts the physically sensible range:

```python
import orbits
v = orbits.circular_speed(6.778137e6)
assert 7000 < v < 8000, v
```

Running `git bisect start HEAD ee34399` followed by `git bisect run python3 check.py` checks out `Experiment 5` (passes), then `Experiment 7` (fails), then `Experiment 6` (fails) and reports `63a5e02 … is the first bad commit`. `git show 63a5e02` reveals a one-character slip — `math.sqrt(mu * r)` where `mu / r` was intended, which at $r = 6.78 \times 10^{6}\,\mathrm{m}$ inflates the answer by a factor $r$, to $5.2 \times 10^{10}$. Because each commit was small, the culprit line was obvious the moment the commit was named.
:::

::: warning Check `git status` before `git add -A`
`-A` stages everything not ignored, including the 2 GB telemetry file you copied in for a quick look and the notebook with a password in a cell. Glance at `git status --short` first, and extend `.gitignore` when something appears that should not be tracked. A file already committed stays in history even after deletion; treat credentials in a commit as leaked.
:::

::: warning `pip install` outside the environment
If the prompt does not show `(.venv)`, you are installing into the system Python. Check with `which python` (or `where python` on Windows) — the answer must be inside your project's `.venv`. When in doubt, `python -m pip` cannot install into the wrong interpreter.
:::

## Check yourself

::: check
A teammate clones your repository and reports `ModuleNotFoundError: No module named 'scipy'`. List the commands they need, in order, assuming a `requirements.txt` exists.
:::

::: answer
```bash
python -m venv .venv
source .venv/bin/activate        # .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

The clone contains the code and the pinned requirements but never the environment itself (which is ignored). Creating the venv, activating it and installing from the file gives them exactly the versions you froze.
:::

::: check
Why is `python -m pip install numpy` preferred over `pip install numpy`?
:::

::: answer
`python -m pip` runs the pip module that belongs to whatever `python` currently resolves to, so the package lands in that interpreter's `site-packages`. A bare `pip` on the `PATH` may belong to a different interpreter — the system Python, or another environment — in which case the package installs somewhere your `python` cannot see and the import still fails.
:::

::: check
A notebook shows a plot labelled with a standard deviation of 3.2 m, but re-running it from the top gives 4.1 m. What most likely happened, and what should you do before trusting either number?
:::

::: answer
Cells were run out of order: the plotting cell used a variable left in the kernel by an earlier version of a cell that was later edited and not re-run, so the displayed output belongs to code that no longer exists. Restart the kernel and run all cells top to bottom; the 4.1 m produced by that clean run is the only reproducible one. Then move the computation into a `.py` module so a script — not kernel state — produces the figure.
:::

::: check
Your propagator's energy drift was acceptable at commit `a1b2c3d` and is not at `HEAD`, forty commits later, and you have a script `drift_check.py` that exits with an error when the drift is too large. How do you find the offending commit, and about how many checks will it take?
:::

::: answer
`git bisect start HEAD a1b2c3d` then `git bisect run python3 drift_check.py`. Bisect halves the range of forty commits each time, so about $\log_2 40 \approx 5.3$ — six checks — identifies the first bad commit, after which `git show <hash>` displays the change. Finish with `git bisect reset` to return to `HEAD`. This only works because the intermediate commits exist; had the forty changes been one commit, bisect could say no more than "it is in there somewhere".
:::

::: check
You added `.venv/` to `.gitignore` *after* committing the environment by mistake. Does the `.gitignore` entry remove it from the repository?
:::

::: answer
No. `.gitignore` only stops *untracked* files from being added; files already committed remain tracked. Remove them from tracking with `git rm -r --cached .venv` and commit that change. The directory stays on disk (the `--cached` flag removes it only from the index), but from that commit on it is ignored. The earlier commits still contain it, so the repository's history keeps its size — one reason to write `.gitignore` before the first `git add -A`.
:::

## Summary

| Task | Command |
| --- | --- |
| Create an environment | `python -m venv .venv` |
| Activate / deactivate | `source .venv/bin/activate` (Windows `.venv\Scripts\activate`) / `deactivate` |
| Install packages | `python -m pip install numpy scipy matplotlib` |
| Freeze / restore versions | `pip freeze > requirements.txt` / `pip install -r requirements.txt` |
| Launch a notebook | `python -m pip install jupyterlab` then `jupyter lab` |
| Trust a notebook | Restart Kernel and Run All; keep reusable code in `.py` modules |
| Start a repository | `git init -b main`, write `.gitignore`, `git add -A`, `git commit -m "..."` |
| Inspect | `git status --short`, `git diff`, `git log --oneline --graph`, `git show <hash>:file` |
| Undo an uncommitted edit | `git restore file` |
| Branch and merge | `git switch -c name`, `git switch main`, `git merge name`, `git branch -d name` |
| Find a regression | `git bisect start HEAD <good>`, `git bisect run python3 check.py`, `git bisect reset` |
| Publish | `git remote add origin <url>`, `git push -u origin main`, later `git push` / `git pull` |
| Ignore | `.venv/`, `__pycache__/`, `*.pyc`, `.ipynb_checkpoints/`, generated data and figures |

With the workbench in place, the next lesson returns to the language and builds two classes — a 3-vector and a quaternion — inside a module that lives in exactly this kind of repository.
