---
id: l03-workbench
title: "The workbench: environments, pip, notebooks and git"
minutes: 22
covers:
  - virtual environments and pip
  - Jupyter notebooks
  - git and GitHub
---

A good bakery can make the same loaf every morning for twenty years, because it writes down the recipe *and* tracks exactly which flour it uses. Engineering results need the bakery's habits.

A trajectory analysis that cannot be run again is a story, not a result. Six months after a design review, someone will ask why the landing-point spread was 4 km wide. The only good answer is to fetch the exact code that made the figure, install the exact library versions it used, and run it again. The tools in this lesson make that possible. A **virtual environment** pins down the libraries. **git** pins down the code. And a **Jupyter notebook** gives you a scratch pad for exploring before either is pinned.

None of this is glamorous, and all of it is expected: flight-software teams reject code that arrives without a history. Learn these habits now, on small projects, so they are automatic when the projects are big.

## Why environments: the problem pip solves and the one it creates

Python comes with a **standard library** — `math`, `csv`, `json` and hundreds more toolboxes, all built in. NumPy, SciPy and matplotlib are not built in. They are **third-party packages**, written by other people and shared on the **[[Python Package Index|pypi]]** (PyPI). The tool that downloads and installs them is `pip`, the package installer:

```bash
pip install numpy scipy matplotlib
```

(A `bash` block like this one holds commands for the **terminal** — the text window where you type commands — not Python code.)

Left alone, pip installs everything into one shared folder of your computer's Python, called **[[site-packages|site-packages]]**. That works until your second project. Say an orbit propagator was checked against NumPy 1.26, and a new tool needs NumPy 2.4. Upgrading for one breaks the other, and you can no longer say which versions produced last year's results.

The cure is a private package folder for every project: a virtual environment.

## Virtual environments

Think of a lunchbox: each project packs its own, and nobody else's sandwich gets squashed. A **venv** (virtual environment) is a folder, by custom named `.venv`, inside the project. It holds a small `python` launcher that points back at your real Python, plus an empty `site-packages` of its own. Create it once per project, then **activate** it in each terminal window you work in:

```bash
cd my-project
python -m venv .venv               # create (python3 on some systems)
source .venv/bin/activate          # activate on macOS / Linux
# .venv\Scripts\activate           # activate on Windows (PowerShell or cmd)
```

Activating changes the terminal's **[[PATH|path-search]]** — the list of folders it searches for programs — so that `python` and `pip` now mean the copies inside `.venv`. Most terminals show `(.venv)` at the start of the prompt as a reminder. Type `deactivate` to leave.

Here is what is inside (`ls` lists a folder, and `head -3` shows a file's first three lines):

```bash
ls .venv
# bin  include  lib  lib64  pyvenv.cfg
ls .venv/bin
# Activate.ps1  activate  activate.csh  activate.fish  pip  pip3  pip3.11  python  python3  python3.11
head -3 .venv/pyvenv.cfg
# home = /usr/local/bin
# include-system-site-packages = false
# version = 3.11.15
```

The important line is `include-system-site-packages = false`. It means this environment sees nothing installed anywhere else. A brand-new venv holds little more than pip itself, so `import numpy` fails inside it until you install NumPy there:

```bash
python -c "import numpy"
# ModuleNotFoundError: No module named 'numpy'
python -m pip install numpy scipy matplotlib
```

(`python -c "..."` runs one line of Python straight from the terminal.)

Write `python -m pip`, not plain `pip`. It means "run the pip that belongs to *this* python", so the package lands where your `python` will look — which ends a whole family of "but I installed it!" puzzles.

## Recording and restoring dependencies

A project's **dependencies** are the packages it needs. Once the project works, write their exact versions into a text file with `pip freeze`, and commit that file along with the code:

```bash
python -m pip freeze > requirements.txt
cat requirements.txt
# numpy==2.4.6
# scipy==1.17.1
```

The `>` sends what `pip freeze` prints into a file instead of the screen, and `cat` shows a file's contents.

A colleague — or you, on a new laptop — rebuilds the environment from that file. This is the whole workflow, and it is worth memorizing as one line (the `&&` means "and then, if that worked"):

::: key
Create and activate an isolated Python environment, then install the project's pinned dependencies:

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```
:::

Also handy: `pip list` shows everything installed, and `pip show numpy` shows one package's version and location.

The `==` in `numpy==2.4.6` is a **[[pin|version-numbers]]**: it means "install exactly this version". Pins make results repeatable. The price is that you must update them on purpose, in a commit of their own, and re-run the tests when you do.

::: note Other tools, same idea
You will also meet `conda`, which manages non-Python dependencies too and is common in science groups, and `uv`, a fast modern replacement for pip and venv. The ideas are identical: one private environment per project, with the versions written to a file that lives with the code.
:::

::: warning Never commit the environment
`.venv` can be hundreds of megabytes of files built for one kind of computer, and it can be rebuilt exactly from `requirements.txt`. Add `.venv/` to `.gitignore` before the first commit. The same goes for `__pycache__/` folders and for large generated data or figures — commit the script that makes them, not the output.
:::

## Jupyter notebooks

A **notebook** is like a lab notebook that can run its own calculations. It is a document made of **cells**, which you edit in a web browser and run one at a time. Code cells hold Python and show their output — text, tables, plots — right beneath them. Text cells, written in a simple format called Markdown, hold writing and math. Every code cell is run by a Python **[[kernel|kernel]]**, a program running in the background that remembers everything you have run so far.

Install Jupyter into the project environment and start it from the project folder:

```bash
python -m pip install jupyterlab
jupyter lab
```

A browser tab opens; each notebook is saved as a `.ipynb` file, and Shift+Enter runs the current cell.

Because the kernel remembers every variable, a notebook is the ideal place to load a telemetry file once and try a dozen plots of it, or to poke at an array until you understand its shape. **Magics** — commands starting with `%` — add conveniences: `%timeit expr` times an expression carefully, and `%matplotlib inline` makes plots appear under the cell.

### The trap: cells run in any order

The kernel's memory is also the notebook's trap. You can run cells in **[[any order|run-order]]**. So a notebook whose cell 7 was run before cell 3 can show results that no top-to-bottom run could ever produce.

Before you trust a notebook's result, and always before you share one, choose *Restart Kernel and Run All*: it wipes the kernel's memory and runs every cell from the top. If the notebook does not run cleanly that way, it is not a result yet.

### Keep the real code in `.py` files

Use notebooks for exploring and explaining. Move anything you want to keep into a `.py` module and import it. A function that lives in a notebook cell cannot be tested with pytest (the testing tool of the next lesson), cannot be imported by a script, and is hard for a colleague to review.

That last point is about the file format. An `.ipynb` file also stores every output, including pictures turned into long runs of text, so a one-character code change can show up as thousands of changed lines. Clear the outputs before committing (a tool such as `nbstripout` does it for you), and keep `.ipynb_checkpoints/` in `.gitignore`.

That is why the module's plotting exercise insists the final figure be saved from a script, not a notebook cell: a script makes the same figure every time, with no hidden memory.

::: key
A notebook's kernel keeps state between cells, so cells can run out of order. Restart the kernel and run all cells top to bottom before trusting or sharing a result; keep reusable code in `.py` modules that the notebook imports.
:::

## git: a history of every version

Think of the save points in a video game. Before the hard level you save, so that if things go badly you can go back to exactly that moment. **git** gives your project save points.

git records **snapshots** of a folder. Each snapshot, a **commit**, stores the full contents of every tracked file, plus a message, an author, and a link to the commit before it — a chain you can walk backward. Nothing committed is lost, any earlier state comes back in seconds, and two people can work on the same files and combine their changes.

git keeps your work in **[[three places|three-areas]]**:

- the **working tree** — your files on disk, as you edit them;
- the **staging area** — the changes you have lined up for the next commit;
- the **repository** — the stored history, kept in a hidden `.git` folder.

### The first commit

Start a repository (a "repo") in the project folder, tell git which files to ignore, and make the first commit:

```bash
git init -b main
printf '.venv/\n__pycache__/\n*.pyc\n.ipynb_checkpoints/\n' > .gitignore
git status --short
# ?? .gitignore
# ?? orbits.py
git add -A
git commit -m "Initial commit: circular_speed and .gitignore"
git log --oneline
# 215df79 Initial commit: circular_speed and .gitignore
```

Line by line: `git init -b main` starts a repository whose main line is called `main`. `printf` writes the four ignore patterns into `.gitignore`, one per line (`\n` means "new line", and `*.pyc` means "any file ending in .pyc"). In `git status --short`, `??` marks files git has never seen. `git add -A` stages every change in the folder — new files, edits and deletions. `git commit -m` records the staged snapshot with a message. And `git log --oneline` lists the commits, newest first.

Each commit is named by a **[[hash|commit-hash]]**, a long code worked out from its contents. The first seven characters, here `215df79`, are enough to refer to it. Your hashes will be different from the ones shown here.

The first time you use git on a computer, it asks for your name and email (`git config --global user.name "..."` and `user.email`) for the author line.

### Seeing what changed

Now edit `orbits.py` to add a function. `git status` shows the file as modified (` M`), and `git diff` shows exactly which lines changed, with `+` for added and `-` for removed:

```bash
git status --short
#  M orbits.py
git diff
# diff --git a/orbits.py b/orbits.py
# index 485b1e2..96b86fd 100644
# --- a/orbits.py
# +++ b/orbits.py
# @@ -5,3 +5,7 @@ MU_EARTH = 3.986004418e14
#
#  def circular_speed(r, mu=MU_EARTH):
#      return math.sqrt(mu / r)
# +
# +
# +def period(r, mu=MU_EARTH):
# +    return 2 * math.pi * math.sqrt(r**3 / mu)
git add -A
git commit -m "Add circular-orbit period"
git log --oneline
# 3495b07 Add circular-orbit period
# 215df79 Initial commit: circular_speed and .gitignore
```

The line starting `@@` says where the change is: "old lines 5 to 7, new lines 5 to 11". The three lines without a sign are unchanged context, shown so you can see where the new lines went.

Two ways back in time. An edit you regret, and have not yet staged with `git add`, is undone with `git restore orbits.py`: the file goes back to how it was at the last commit. And any old version can be viewed without changing anything: `git show 215df79:orbits.py`.

### Branches

A **branch** is a movable name for a line of commits — a side road off the main street. Work that might not pan out, such as a new drag model, goes on its own branch, so `main` always holds something that runs. When the experiment works, you **merge** it back:

```bash
git switch -c drag-model            # create and switch to a new branch
# ... add aero.py, then:
git add -A
git commit -m "Add drag force helper"
git switch main
git merge drag-model
# Updating 3495b07..aa38478
# Fast-forward
#  aero.py | 2 ++
#  1 file changed, 2 insertions(+)
#  create mode 100644 aero.py
git log --oneline --graph
# * aa38478 Add drag force helper
# * 3495b07 Add circular-orbit period
# * 215df79 Initial commit: circular_speed and .gitignore
git branch -d drag-model            # the branch name is no longer needed
```

This merge was a **[[fast-forward|fast-forward]]**: nothing had happened on `main` since the branch split off, so git slid the `main` label forward to the new commit.

If both branches changed the same lines, the merge stops with a **conflict** and marks the disputed lines in the file. You edit the file to the version you want, `git add` it, and commit. Small, frequent commits make conflicts rare and tiny.

### Commit before every experiment

This habit pays for all the others. Commit whenever the code is in a state you would be glad to come back to: before tuning a number, before a big tidy-up, after every test passes. Commits are cheap.

What they buy you is `git bisect`, a tool for finding the commit that caused a **regression** — something that used to work and stopped. You tell it one commit where a result was right and a later one where it is wrong. It checks out the commit halfway between. You — or a script — say whether that one is good or bad. That **[[halves the search|bisect-halving]]**, and it repeats until it finds the single commit that brought the bug in.

With a check script that exits with an error when the result is wrong, the whole search runs by itself:

```bash
git bisect start HEAD ee34399        # bad = current, good = a known-good commit
git bisect run python3 check.py
# Bisecting: 3 revisions left to test after this (roughly 2 steps)
# ...
# 63a5e02fbaffa308a5a9a2638bde514f68ccae3f is the first bad commit
git bisect reset
```

`HEAD` means "the commit you are on now". Eight commits took three checks; a thousand would take ten. Small commits make "the first bad commit" point at a few lines rather than a week of work.

## GitHub: publishing and collaborating

**GitHub** is a website that keeps copies of git repositories, backed up, shareable and easy to review. Create an empty repository on the site, connect your local one to it as a **remote** — a copy somewhere else — called `origin`, and **push** (upload) your branch:

```bash
git remote add origin https://github.com/you/my-project.git
git push -u origin main
# To https://github.com/you/my-project.git
#  * [new branch]      main -> main
# branch 'main' set up to track 'origin/main'.
```

The `-u` tells git to remember that your `main` goes with `origin/main`. After that, plain `git push` uploads new commits and `git pull` downloads other people's.

Anyone with access gets the complete history with `git clone <url>`. A **pull request** on GitHub proposes a branch for review: a colleague reads the diff, comments line by line, and merges it when satisfied. GitHub's *Actions* feature can run your tests on every push, so a pull request arrives already marked green (passing) or red (failing).

Add a `README.md` file that says what the project is and how to set it up. Usually that is the three-command line from the key idea above.

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
A new job: a dispersion study of a sounding rocket's trajectory — how far its landing point scatters. Set the project up so anyone can repeat it.

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

Read it in four steps: make the folder and start a repository (`mkdir` makes a folder; `cd` moves into it); make the environment, install the tools and freeze their versions; write `.gitignore` and a `README.md`; commit.

Check it against the module's goal. The first commit exists before any analysis code does, the environment can be rebuilt from `requirements.txt`, and the ignore list keeps `git add -A` from sweeping in the environment or generated figures. From here on, every working step is a commit.
:::

::: example Finding the commit that broke the propagator
A helper, `circular_speed`, has been returning values around $5 \times 10^{10}\,\mathrm{m/s}$ instead of $7.7\,\mathrm{km/s}$ since "sometime last week". There are eight commits since the last known-good one, `ee34399`. A three-line check script asserts the answer is physically sensible:

```python
import orbits
v = orbits.circular_speed(6.778137e6)
assert 7000 < v < 8000, v
```

Run `git bisect start HEAD ee34399`, then `git bisect run python3 check.py`. Bisect checks out `Experiment 4` (passes), then `Experiment 6` (fails), then `Experiment 5` (passes). Since 5 is good and 6 is bad, it reports `63a5e02 … is the first bad commit`, which is `Experiment 6`.

`git show 63a5e02` shows the change: a one-character slip, `math.sqrt(mu * r)` where `mu / r` was meant. Does that explain the size of the error? The wrong formula is bigger than the right one by a factor of $r$, because

$$
\frac{\sqrt{\mu r}}{\sqrt{\mu / r}} = \sqrt{r^2} = r.
$$

So $7669\,\mathrm{m/s} \times 6.78 \times 10^{6} \approx 5.2 \times 10^{10}$ — exactly the bad value. Because each commit was small, the culprit line was obvious the moment bisect **[[named the commit|bisect-pycache]]**.
:::

::: warning Check `git status` before `git add -A`
`-A` stages everything that is not ignored — including the 2 GB telemetry file you copied in for a quick look, and the notebook with a password in one cell. Glance at `git status --short` first, and add to `.gitignore` when something shows up that should not be tracked. A file that was committed stays in the history even after you delete it, so treat a password that reached a commit as leaked.
:::

::: warning `pip install` outside the environment
If the prompt does not show `(.venv)`, you are installing into your computer's shared Python. Check with `which python` (or `where python` on Windows): the answer must be inside your project's `.venv`. When in doubt, `python -m pip` cannot install into the wrong Python.
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

The clone holds the code and the pinned requirements, but never the environment, because `.venv/` is ignored. These three commands rebuild it with exactly the versions you froze.
:::

::: check
Why is `python -m pip install numpy` preferred over `pip install numpy`?
:::

::: answer
`python -m pip` runs the pip that belongs to whichever `python` you are using, so the package lands in that Python's `site-packages`.

A bare `pip` found on the PATH may belong to a different Python — the computer's shared one, or another environment. Then the package installs somewhere your `python` never looks, and the import still fails.
:::

::: check
A notebook shows a plot labeled with a standard deviation of 3.2 m, but re-running it from the top gives 4.1 m. What most likely happened, and what should you do before trusting either number?
:::

::: answer
The cells were run out of order. The plotting cell used a variable left in the kernel by an earlier version of some cell, which was later edited and never re-run. So the 3.2 m belongs to code that no longer exists.

Restart the kernel and run all cells from the top. The 4.1 m from that clean run is the only number anyone can reproduce. Then move the calculation into a `.py` module, so that a script — not the kernel's memory — makes the figure.
:::

::: check
Your propagator's energy drift was acceptable at commit `a1b2c3d` and is not at `HEAD`, forty commits later. You have a script `drift_check.py` that exits with an error when the drift is too large. How do you find the offending commit, and about how many checks will it take?
:::

::: answer
Run `git bisect start HEAD a1b2c3d`, then `git bisect run python3 drift_check.py`.

Each check halves the forty commits still in doubt: 40, 20, 10, 5, 3, 2, 1. That is $\log_2 40 \approx 5.3$, so about six checks find the first bad commit. Then `git show <hash>` shows the change, and `git bisect reset` takes you back to `HEAD`.

This only works because the forty commits exist. Had all the changes gone in as one commit, bisect could say only "it is in there somewhere".
:::

::: check
You added `.venv/` to `.gitignore` *after* committing the environment by mistake. Does the `.gitignore` entry remove it from the repository?
:::

::: answer
No. `.gitignore` only stops *untracked* files — ones git has never recorded — from being added. Files already committed stay tracked.

Stop tracking them with `git rm -r --cached .venv` and commit that change. The `--cached` flag removes the folder only from git's records, so it stays on your disk; from that commit on it is ignored. The earlier commits still contain it, so the repository stays big. That is one more reason to write `.gitignore` before the first `git add -A`.
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
| Undo an unstaged edit | `git restore file` |
| Branch and merge | `git switch -c name`, `git switch main`, `git merge name`, `git branch -d name` |
| Find a regression | `git bisect start HEAD <good>`, `git bisect run python3 check.py`, `git bisect reset` |
| Publish | `git remote add origin <url>`, `git push -u origin main`, later `git push` / `git pull` |
| Ignore | `.venv/`, `__pycache__/`, `*.pyc`, `.ipynb_checkpoints/`, generated data and figures |

With the workbench set up, the next lesson goes back to the language and builds two classes — a 3-vector and a quaternion — inside a module that lives in exactly this kind of repository.

::: context pypi The Python Package Index
PyPI (say "pie-P-I") is a free public library of Python packages at pypi.org, holding hundreds of thousands of them. When you type `pip install numpy`, pip asks PyPI for the newest NumPy that suits your Python and computer, downloads it and unpacks it. Anyone can publish there, so stick to well-known packages and spell names carefully: attackers sometimes upload harmful packages with names one letter off from popular ones.
:::

::: context site-packages Where installed packages live
Every Python has a folder named `site-packages` where installed packages go. When you write `import numpy`, Python searches a list of folders, including that one, for something called `numpy`. You can ask where a package came from: `python -c "import numpy; print(numpy.__file__)"` prints its location. Inside an active venv, the path runs through `.venv/lib/…/site-packages` — proof you are using the project's own copy.
:::

::: context path-search How the terminal finds `python`
When you type a command, the terminal looks through the folders listed in PATH, in order, and runs the first match. Activating a venv puts `.venv/bin` at the front of the list.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">you type: python</text>
  <rect x="10" y="35" width="100" height="40" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">.venv/bin</text>
  <rect x="130" y="35" width="100" height="40" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="180" y="59" font-size="12" text-anchor="middle" fill="#6c7a93">/usr/local/bin</text>
  <rect x="250" y="35" width="100" height="40" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="300" y="59" font-size="12" text-anchor="middle" fill="#6c7a93">/usr/bin</text>
  <line x1="110" y1="55" x2="124" y2="55" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="230" y1="55" x2="244" y2="55" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="60" y="95" font-size="11" text-anchor="middle" fill="#1d6fd1">1st: found here,</text>
  <text x="60" y="109" font-size="11" text-anchor="middle" fill="#1d6fd1">search stops</text>
  <text x="240" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">never reached while the venv is active</text>
</svg>
```

Without the venv, the search would start at the shared folders and find the computer's own Python instead.
:::

::: context version-numbers Reading a version number
Most packages number their releases MAJOR.MINOR.PATCH. In `numpy==2.4.6`, 2 is the major version, 4 the minor and 6 the patch. By custom, a patch fixes bugs, a minor release adds features, and a major release may break old code. NumPy 2.0, released in 2024, removed a number of old names that some programs still used — exactly the kind of change a pin protects you from.
:::

::: context kernel What the kernel is
The notebook in your browser is only the front end: a place to type and to show results. The **kernel** is a separate program running Python behind it. When you run a cell, the text is sent to the kernel, which runs it and sends back the output. Because the kernel keeps running between cells, it remembers every variable. Restarting the kernel wipes that memory. Kernels exist for other languages too; the name Jupyter is built from Julia, Python and R.
:::

::: context run-order How a notebook fools you
The numbers in square brackets show the order in which the cells actually ran. The page reads top to bottom, but cell [2] sits at the bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="42" font-size="12" fill="#1d6fd1">[1]</text>
  <rect x="45" y="25" width="200" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="43" font-size="12" fill="#1f2a44">x = 2</text>
  <text x="10" y="80" font-size="12" fill="#b4232c">[3]</text>
  <rect x="45" y="63" width="200" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="81" font-size="12" fill="#1f2a44">print(x * 10)</text>
  <text x="55" y="104" font-size="12" fill="#b4232c">50</text>
  <text x="10" y="134" font-size="12" fill="#1d6fd1">[2]</text>
  <rect x="45" y="117" width="200" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="135" font-size="12" fill="#1f2a44">x = 5</text>
  <text x="258" y="70" font-size="11" fill="#1f2a44">shown: 50</text>
  <text x="258" y="88" font-size="11" fill="#1f2a44">top to bottom</text>
  <text x="258" y="102" font-size="11" fill="#1f2a44">gives: 20</text>
  <text x="10" y="162" font-size="11" fill="#6c7a93">Restart and Run All makes the page and the memory agree.</text>
</svg>
```

The `50` on the page came from `x = 5`, a cell *below* the print. Nobody reading the page top to bottom could get it.
:::

::: context three-areas The three places your work lives
`git add` copies changes from your files into the staging area. `git commit` turns everything staged into a permanent snapshot. `git restore` throws away edits you have not staged, copying the file back from the staging area — which, if you staged nothing, holds the last committed version.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="95" height="50" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="57.5" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">working</text>
  <text x="57.5" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">tree</text>
  <rect x="132.5" y="30" width="95" height="50" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">staging</text>
  <text x="180" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">area</text>
  <rect x="255" y="30" width="95" height="50" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="302.5" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">repository</text>
  <text x="302.5" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">(.git)</text>
  <line x1="105" y1="55" x2="126" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="132,55 124,51 124,59" fill="#1f2a44"/>
  <text x="118.75" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">git add</text>
  <line x1="227.5" y1="55" x2="249" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="255,55 247,51 247,59" fill="#1f2a44"/>
  <text x="241.25" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">git commit</text>
  <path d="M180,80 L180,110 L57.5,110 L57.5,86" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="57.5,80 53.5,88 61.5,88" fill="#b4232c"/>
  <text x="118.75" y="130" font-size="11" text-anchor="middle" fill="#b4232c">git restore: undo unstaged edits</text>
</svg>
```

The staging area lets you commit some of your changes and keep working on the rest.
:::

::: context commit-hash What a commit hash is
A **hash** is a fingerprint: a fixed-length code calculated from some data, so that any change to the data, however tiny, gives a completely different code. git hashes each commit's contents, message, author and parent. By default it uses an algorithm called SHA-1, which gives 40 hexadecimal characters (digits 0–9 and letters a–f). Because the parent's hash is part of what gets hashed, changing any old commit would change every hash after it — so a hash names not only a snapshot but its whole history.
:::

::: context fast-forward Why it is called a fast-forward
A branch name is only a label stuck on one commit. When `drag-model` split off, `main` stayed put while `drag-model` gained a new commit. Since `main` had no commits of its own to combine, git did not need to blend anything: it moved the `main` label forward along the chain to the newest commit, like pressing fast-forward on a video. If both branches had new commits, git would instead make a **merge commit** with two parents, tying the two lines together.
:::

::: context bisect-halving Why halving is so fast
Guess a number between 1 and 1000 when someone says "higher" or "lower" each time. Always guess the middle, and each answer cuts what is left in half: 1000, 500, 250, 125, … After ten guesses you are down to one, because $2^{10} = 1024$. The number of halvings needed for $N$ commits is $\log_2 N$, read "log base two of N" — the power you raise 2 to in order to get $N$. For 8 commits that is 3; for 40 it is about 5.3.
:::

::: context bisect-pycache A trap when bisecting Python
Python saves compiled copies of your modules in `__pycache__` and reuses them as long as the source file's size and modification time look unchanged. `__pycache__` is ignored by git, so it survives each checkout. Bisect switches commits so fast that a one-character edit — `mu * r` for `mu / r` is the same length — can land within the same second, and Python may reuse the old compiled copy. Bisect then blames the wrong commit. Delete `__pycache__` before you start, and run the check as `python3 -B check.py`, where `-B` tells Python not to write compiled files.
:::
