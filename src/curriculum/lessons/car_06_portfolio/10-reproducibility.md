---
id: l10-reproducibility
title: "Reproducibility: seeded, one command, pinned, CI"
minutes: 19
covers:
  - "reproducibility: seeded, one-command, CI, pinned dependencies"
---

Think about a family recipe. If your grandmother writes "some flour, bake until done", only she can make the cake. If she writes "250 g of flour, 180 °C for 35 minutes", anyone with an oven can make the same cake. The second card is **reproducible**: a stranger follows it and gets the same result without phoning her.

A portfolio project needs the second kind of card. The first lesson in this module named "reproducible" as one of the five words a project is judged by. It defined it plainly: a stranger can get your result themselves, from your repository, without asking you anything. This lesson turns that definition into four concrete things you can check.

All four have to be true at once:

1. every random draw is **seeded**, so two runs give the same numbers;
2. every dependency is **pinned** to an exact version;
3. **one command** regenerates every number and figure the write-up quotes;
4. **continuous integration** runs that check automatically on every change.

For each one you will see the exact failure it prevents. One of them is not a made-up example. It is a real break that the tools behind this very course had to deal with.

## Seeded: two runs, identical output

Many GNC results come from randomness on purpose. A **[[Monte Carlo|monte-carlo]]** campaign runs the same simulation hundreds of times, each time with slightly different random errors — a gust here, a sensor bias there — and reports how the results spread. The dispersion campaign in anchor A and the filter consistency test in anchor C are both Monte Carlo runs.

Here is the problem. A reviewer who reads "mean NEES was 6.067" — the filter-honesty score from anchor C — wants to run your code and see 6.067 too. If the random numbers come out different every run, they will see 6.04 or 6.11. Close is not a check. Nobody can tell a real bug from ordinary run-to-run wobble.

The fix is a **[[seed|what-a-seed-is]]** — a starting number that fixes the whole sequence a random number generator produces. Computer "random" numbers come from a formula. Give the formula the same seed and it produces exactly the same sequence, every time. Record the seed and pass it to every random draw in the project. Never leave it to whatever state the generator happens to be in.

::: example Seeding really does remove run-to-run variation
Create two separate generators with the same seed, and compare what they produce:

```python
import numpy as np
rng1 = np.random.default_rng(42)
rng2 = np.random.default_rng(42)
print(np.array_equal(rng1.normal(size=5), rng2.normal(size=5)))
# True
```

Two independent generators, seeded the same way, give **bit-identical** output — the same number down to the last binary digit. Sanity check: if seeding did nothing, the chance of two sets of five random normal numbers matching exactly would be essentially zero, so `True` really does mean the seed controls everything.

So a README that says "seed 42", backed by an entry point that passes 42 through to every random part of the code, hands the reviewer your exact numbers — not numbers merely close to them.
:::

### Why one global seed is not enough

There is an older way to seed NumPy: call `np.random.seed(42)` once at the top of a script. It sets **hidden global state** — one shared generator that every part of the program quietly draws from. Picture a single deck of cards on a table that everyone in the room can take from. You shuffle it in a known order. But if anyone else takes a card before you, you no longer get the card you expected.

::: example One extra draw changes everything after it
```python
import numpy as np

np.random.seed(42)
a = np.random.normal(size=3)

np.random.seed(42)
np.random.random()             # one extra draw, somewhere else in the program
b = np.random.normal(size=3)

print(np.array_equal(a, b))    # False
```

Same seed both times. The only difference is one extra draw in between — the kind a library you import might make without telling you. The first value of `a` is about $0.497$; the first value of `b` is about $-1.11$. Every number after the extra draw has shifted.
:::

::: warning
A single global seed at the top of a script breaks silently the moment any part of the code makes its own generator, calls a library that draws random numbers inside it, or runs things in a different order on a second run. Instead, create one generator object with `np.random.default_rng(seed)` and pass it, as an argument, to each function that needs random numbers. Then no other code can take a card from your deck.
:::

## Pinned dependencies: a break that already happened

Your project stands on other people's code. NumPy, SciPy, Matplotlib — these are **dependencies**: libraries your code needs in order to run. Each library ships new **versions** over time, numbered like `2.4.6`. New versions sometimes change or remove things.

If your `requirements.txt` (the file listing what to install) says only `numpy`, then anyone who installs your project gets whatever NumPy is newest *on the day they install it*. That is not the version you tested. **Pinning** a dependency means writing down the exact version you tested against, like `numpy==2.4.6`, so everyone gets the same one.

::: example A real break, not a hypothetical one
**[[NumPy 2.0|version-numbers]]** removed `ptp` as a method on arrays. (`ptp`, "peak to peak", is the largest value minus the smallest.) Code written against NumPy 1.x that calls `a.ptp()` ran fine for its author. It breaks for anyone installing fresh today:

```python
import numpy as np

print(np.__version__)          # 2.4.6
a = np.array([1.0, 5.0, 3.0])
print(np.ptp(a))               # 4.0  (the function form still works)
try:
    a.ptp()                    # the method form was removed in NumPy 2.0
except AttributeError as err:
    print(err)                 # 'numpy.ndarray' object has no attribute 'ptp'
```

This is the real behavior of NumPy 2.4.6, run and checked. Sanity check on the answer: the largest value is $5$ and the smallest is $1$, and $5 - 1 = 4$, so `4.0` is right.

A line reading `numpy` gives a stranger no way to know which of the two behaviors your code expects. A line reading `numpy==2.4.6` — or at least a version range matching when the code was written — does. Pinning is not caution for its own sake. It is the difference between a bug report that makes sense and one where "it worked when I wrote it" is the only explanation anyone has.
:::

So: pin every dependency your project actually imports, to the exact version you tested. Use a `requirements.txt` with exact versions, or a **[[lock file|lock-files]]** if your tools make one. Write down the language version too — Python 3.11, say — because the same kind of break happens there.

## One command: every number and figure, regenerated

Your write-up quotes specific numbers: an energy-conservation tolerance, a mean NEES, a landing-accuracy percentile. A stranger checking your work should get every one of them back by typing a single command. Not a list of steps remembered from memory. Not steps hidden in paragraph three of the README.

A common way to do this is a small file of named commands run with a tool called **[[make|make-files]]**:

```text
make verify      # runs every test in tests/, including the analytic-case
                 # and conservation checks from the verification lesson
make results     # regenerates results/*.csv and every number the README quotes,
                 # from the seed stated in the README
```

"One command" means exactly this. A reviewer with a fresh copy of your repository and nothing else runs one line. The exact numbers in your write-up come back out.

If getting your headline result needs a sequence of manual steps, a setting you never wrote down, or a file that exists only on your laptop, the result is not reproducible — however carefully the code itself was written. Reproducibility belongs to the whole path, from a clean copy of the repository to the number on the page. It is not a property of the code alone.

## CI: proof it still works now, not only once

**Continuous integration**, or **CI** (said "see-eye"), is a service that runs your tests automatically every time you push a change. It uses a fresh machine that is not yours. That answers a question a README never can: does this still work *today*, somewhere other than the laptop where you last ran it by hand?

On GitHub, a short file in `.github/workflows/` sets it up:

```yaml
name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: pytest tests/
```

Read it top to bottom. On every push, or every **pull request** (a proposed change waiting to be merged): start a clean Ubuntu (a version of Linux) machine, copy the repository onto it, install Python 3.11, install the pinned dependencies, run the tests.

The result shows as a **[[green badge|ci-pipeline]]** on your repository page. A reviewer can trust it without running anything, because a machine you do not control produced it. It is the same reason an earlier lesson in this module said a result cross-checked by someone else is stronger than one checked only by its own author.

::: key
Reproducibility standard: seeded random draws, pinned dependencies, one command to regenerate every figure and number, and continuous integration that runs the tests. If a reviewer cannot reproduce it, the result is a claim rather than evidence.
:::

::: key
Seeds are passed explicitly as generator objects, not left to hidden global state; dependencies are pinned to the exact versions you tested; the one command works from a clean checkout; CI runs on a machine that is not yours. All four, together — a project with three of the four is not reproducible, only reproducible-sounding.
:::

## Why this is part of the real work

Every other claim in this module — a conservation check to a stated tolerance, a NEES mean inside its band, a landing-accuracy distribution — is only as trustworthy as a reviewer's ability to check it. Reproducibility is what lets them check without asking you anything.

A verification section with no reproducible path to its numbers asks the reviewer to trust you. A self-taught candidate, with no famous university or employer standing behind them, is exactly the person who can least afford to ask for that trust.

The honest test is the one this module's exercise sets. Delete your local environment. Clone the repository fresh onto a different machine — a **[[fresh machine|works-on-my-machine]]** with nothing installed. Run the one command. Check the output matches what the README says. If it does not, the rest of the write-up is still a claim, not yet evidence.

## Check yourself

::: check
Explain why calling `np.random.seed(42)` once at the top of a script is a weaker guarantee than creating a generator with `np.random.default_rng(42)` and passing it to every function that draws random numbers.
:::

::: answer
The global call sets hidden shared state. Every later random draw reads from it and moves it along — your own code, any library you call, and any code that runs in a different order on the next run. So the numbers a given line receives depend on everything that drew from that shared state before it, and that can change silently as the code grows or the run order shifts. The extra-draw example showed this: one extra call and every number afterward was different.

An explicit generator passed to the code that needs it has no hidden link to the rest of the program. The same generator, seeded the same way, in the same place in the code, gives the same output no matter what else in the program does or does not draw random numbers.
:::

::: check
A project's `requirements.txt` lists `numpy` with no version. Using this lesson's example, explain concretely what could go wrong for someone who clones it today compared with when it was written.
:::

::: answer
Suppose the code was written and tested against NumPy 1.x and calls `arr.ptp()` as a method. It runs correctly for the author. Anyone installing today gets NumPy 2.x, where the method was removed in 2.0, so the same line raises `AttributeError: 'numpy.ndarray' object has no attribute 'ptp'`. That is the real, checked behavior of NumPy 2.4.6. With no pin, which version gets installed — and so how the code behaves — depends on when and where it is installed, not on anything the author controls or wrote down.
:::

::: check
What does "one command" mean in this lesson? Why does a README that asks the reviewer to run three separate manual steps, in a remembered order, fail the standard even if each step is documented?
:::

::: answer
"One command" means a single line, run from a clean checkout with only the pinned dependencies installed, that regenerates every number and figure the write-up quotes.

Three manual steps fail because they bring back exactly the failures reproducibility exists to remove: an order that matters but is not enforced, a step quietly skipped, or a difference between what the author actually did on their machine and what the documentation says. Reproducibility belongs to the whole path from clean checkout to number. A path with a human in the middle of it is not fully pinned down by documentation, however carefully each step is written.
:::

::: check
Why does a green CI badge carry more weight with a reviewer than a README sentence saying "all tests pass on my machine"?
:::

::: answer
"Passes on my machine" is a claim about one environment at one past moment, checked by nobody except the author. A CI badge comes from an automatic run, on a fresh machine the author does not control, triggered by a real push. The reviewer can also open the workflow file and the run logs and see exactly what ran. So the badge is independent evidence, not a report the reviewer has to take on trust.
:::

::: check
A candidate says pinning is unnecessary because their code has not changed since they wrote it and still runs fine for them. What is wrong with this as an argument about reproducibility?
:::

::: answer
The code not changing says nothing about the *environment* changing. A library update on a reviewer's machine — outside the candidate's control and knowledge — can break code the candidate never touched, exactly as NumPy 2.0's removal of the `ptp` method broke code that called it. "Still runs for me" only confirms the code works in the one environment the author has not changed. Reproducibility is about the environment the reviewer will actually use, which is a different machine installing on a different day.
:::

## Summary

| Requirement | What it looks like | What it prevents |
| --- | --- | --- |
| Seeded | `rng = np.random.default_rng(42)` passed to every function that draws | Run-to-run variation that makes a quoted number impossible to check |
| Pinned dependencies | `numpy==2.4.6` in `requirements.txt`, plus the Python version | Silent breakage from environment drift, such as `ndarray.ptp()` removed in NumPy 2.0 while `np.ptp(arr)` still works |
| One command | `make results` from a clean checkout | Undocumented manual steps between a fresh copy and the numbers the write-up quotes |
| CI on every push | a workflow that installs pinned dependencies and runs `pytest` | A claim resting only on the author's "it works for me" |

The next lesson turns from making one project checkable to a question about the whole portfolio: what to do with work that cannot be shown at all, because it belongs to a previous employer or falls under export control — and how to license the work that is yours.

::: context monte-carlo Why it is named after a casino
Monte Carlo is a district of Monaco famous for its casino. In the 1940s, scientists at Los Alamos working on hard problems in physics started answering them by running many chance-driven trials and counting the results, the way a gambler learns the odds by playing many hands. The casino gave the method its name, and the name stuck.

In GNC work, a Monte Carlo campaign is how you ask "what happens across everything that could go slightly wrong?" instead of "what happens on the one perfect day?" Anchor A's dispersion campaign, anchor B's landing-accuracy study and anchor C's NEES test are all Monte Carlo runs — which is why seeding matters in every one of them.
:::

::: context what-a-seed-is Random numbers that are not random
A computer cannot flip a real coin. Its "random" numbers come from a formula that takes one number and produces the next, over and over, in a pattern so scrambled it looks random. These are called **pseudo-random** numbers ("pseudo" means "false").

The seed is the number the formula starts from. Start from the same seed and you walk the same path, every time, on any machine.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" fill="#6c7a93">run 1</text>
  <rect x="12" y="28" width="60" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="42" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">seed 42</text>
  <line x1="72" y1="43" x2="96" y2="43" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="102,43 94,39 94,47" fill="#1f2a44"/>
  <rect x="104" y="28" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="142" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">0.305</text>
  <rect x="186" y="28" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="224" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">−1.040</text>
  <rect x="268" y="28" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="306" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">0.750</text>
  <text x="12" y="88" font-size="12" fill="#6c7a93">run 2</text>
  <rect x="12" y="96" width="60" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="42" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">seed 42</text>
  <line x1="72" y1="111" x2="96" y2="111" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="102,111 94,107 94,115" fill="#1f2a44"/>
  <rect x="104" y="96" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="142" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">0.305</text>
  <rect x="186" y="96" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="224" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">−1.040</text>
  <rect x="268" y="96" width="76" height="30" rx="4" fill="#fff" stroke="#1d6fd1"/>
  <text x="306" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">0.750</text>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#1f2a44">first three normal draws of default_rng(42), rounded</text>
</svg>
```
:::

::: context version-numbers Reading a version number
A version like `2.4.6` is read "two point four point six". Many libraries, NumPy among them, use the three parts roughly like this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="90" y="52" font-size="34" text-anchor="middle" fill="#b4232c" font-weight="700">2</text>
  <text x="135" y="52" font-size="34" text-anchor="middle" fill="#1f2a44">.</text>
  <text x="180" y="52" font-size="34" text-anchor="middle" fill="#1d6fd1" font-weight="700">4</text>
  <text x="225" y="52" font-size="34" text-anchor="middle" fill="#1f2a44">.</text>
  <text x="270" y="52" font-size="34" text-anchor="middle" fill="#6c7a93" font-weight="700">6</text>
  <text x="90" y="80" font-size="12" text-anchor="middle" fill="#b4232c">major</text>
  <text x="90" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">may break things</text>
  <text x="180" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">minor</text>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">new features</text>
  <text x="270" y="80" font-size="12" text-anchor="middle" fill="#6c7a93">patch</text>
  <text x="270" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">bug fixes</text>
</svg>
```

The jump from 1.x to 2.0 is a major release — exactly where a project warns that old code may stop working. That is why the `ptp` method disappeared there and not in some small patch release.
:::

::: context lock-files A snapshot of everything installed
Your code imports NumPy, but NumPy may need other packages, and those need others. A `requirements.txt` usually lists only the packages you chose. A **lock file** records the exact version of *every* package that ended up installed, including the ones pulled in behind the scenes. Tools such as Poetry, uv and pip-tools can write one. Reinstalling from it rebuilds the same set of packages, not a set that merely satisfies the same rules.
:::

::: context make-files A tool from 1976
`make` was written in 1976 at Bell Labs, to rebuild programs without retyping long commands. It reads a file called `Makefile` that gives short names to longer commands, so `make results` can mean "run the simulation with seed 42, then write every table and figure." It is still installed on almost every Linux and Mac machine, which is why so many projects use it as their one front door. A single Python script such as `python run_all.py` does the same job — what matters is one entry point, not which tool provides it.
:::

::: context ci-pipeline What happens after you push
Every push starts the same chain on a machine that has never seen your project before. If any link fails, the badge turns red and you get an email.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="10" y="30" width="60" height="36" rx="5" fill="#fff" stroke="#1f2a44"/>
    <text x="40" y="52">push</text>
    <rect x="80" y="30" width="60" height="36" rx="5" fill="#fff" stroke="#1f2a44"/>
    <text x="110" y="46">fresh</text><text x="110" y="60">machine</text>
    <rect x="150" y="30" width="60" height="36" rx="5" fill="#fff" stroke="#1f2a44"/>
    <text x="180" y="46">install</text><text x="180" y="60">pinned</text>
    <rect x="220" y="30" width="60" height="36" rx="5" fill="#fff" stroke="#1f2a44"/>
    <text x="250" y="46">run</text><text x="250" y="60">tests</text>
    <rect x="290" y="30" width="60" height="36" rx="5" fill="#8fb8f0" stroke="#1d6fd1"/>
    <text x="320" y="52">badge</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="70" y1="48" x2="80" y2="48"/><line x1="140" y1="48" x2="150" y2="48"/>
    <line x1="210" y1="48" x2="220" y2="48"/><line x1="280" y1="48" x2="290" y2="48"/>
  </g>
  <text x="180" y="92" font-size="11" text-anchor="middle" fill="#b4232c">any step fails → red badge, and you hear about it</text>
</svg>
```

The word "continuous" is the point: the check runs every time, not once before a deadline.
:::

::: context works-on-my-machine "It works on my machine"
This phrase is an old joke among programmers, because it is what everyone says right before discovering their code depends on something only their computer has — a file, a setting, a library version.

One honest limit: even with seeds and pins, two different computers can disagree in the last few decimal places, because processors and math libraries may add floating-point numbers in a slightly different order. So good tests compare numbers to a stated tolerance, like $10^{-9}$, rather than demanding every digit match. Bit-identical output is what you get on the same setup; agreement to tolerance is what you promise across machines.
:::
