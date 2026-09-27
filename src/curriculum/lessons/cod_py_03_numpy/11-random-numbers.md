---
id: l11-random-numbers
title: Random numbers you can reproduce
minutes: 17
covers:
  - "Random numbers: default_rng, seeding, reproducibility"
---

Think about shuffling a deck of cards for a board game. If you shuffle, the order is a surprise. But suppose a friend wants to replay the exact game you played last night, card for card. Then "a surprise" is not good enough. You need a shuffle you can *repeat*: write down how you shuffled, and anyone can deal the same cards again.

Engineering simulations need both at once. A **[[Monte Carlo|monte-carlo-name]]** run — a simulation repeated thousands of times, each time with the uncertain inputs drawn at random — needs numbers that behave like real randomness, so the spread of the results is honest. And it needs to repeat exactly, so when case 880 of 1000 crashes the lander, you can run case 880 again tomorrow and watch it crash the same way.

Lesson 2 showed you how to make a generator with `np.random.default_rng(seed)` and draw from it. This lesson is about using it properly: why a computer's random numbers can be repeated at all, why the older `np.random.seed` style is avoided, how to give every Monte Carlo case its own independent stream with `SeedSequence`, and a full dispersion study from seed to result.

## Random numbers from a recipe

A computer that follows instructions exactly cannot flip a real coin. What NumPy gives you instead are **[[pseudo-random numbers|prng-picture]]**: numbers made by a fixed recipe that scrambles a hidden internal number, the **state**, over and over. Each time you ask for a number, the recipe updates the state and hands you something computed from it. The output passes every statistical test for randomness you would care about, but it is completely decided by where the state started.

The **seed** is what sets that starting state. Same seed, same state, same stream of numbers, on any computer:

```python
import numpy as np

rng1 = np.random.default_rng(0)
rng2 = np.random.default_rng(0)
print(rng1.normal(size=3))
# [ 0.12573022 -0.13210486  0.64042265]
print(rng2.normal(size=3))
# [ 0.12573022 -0.13210486  0.64042265]
print(rng1)
# Generator(PCG64)
```

`default_rng` returns a **Generator**, the object with the drawing methods (`normal`, `uniform`, `integers`, `random` and dozens more). Inside it sits a **bit generator**, the recipe that makes raw random bits; NumPy's default is called **[[PCG64|pcg64]]**. You will rarely touch the bit generator directly.

**Reproducibility** is the property that rerunning a computation gives the same result. For random simulations it comes down to one rule: every random number must come from a generator whose seed you wrote down.

::: key default_rng and seeding
`rng = np.random.default_rng(seed)` makes a Generator (bit generator PCG64) whose stream is fixed by the seed. Same seed, same numbers. `default_rng()` with no seed takes fresh entropy from the operating system, so every run differs.
:::

## Why not np.random.seed

Older code, and a lot of what you will find online, does this instead:

```python
np.random.seed(0)
x = np.random.normal(size=3)
```

Here there is no generator object. The functions `np.random.normal`, `np.random.rand` and the rest all share one hidden **global state** — a single generator living inside the NumPy module, shared by every piece of code in your program. `np.random.seed(0)` resets it.

That sharing is the problem. Watch what happens when some other piece of code, perhaps deep inside a library you imported, quietly draws one number from the same global state:

```python
np.random.seed(0)
print(np.random.normal(size=3))
# [1.76405235 0.40015721 0.97873798]

np.random.seed(0)
_ = np.random.rand()          # some library helper quietly draws one number
print(np.random.normal(size=3))
# [ 0.74159174  1.55291372 -2.2683282 ]
```

Same seed, completely different numbers. Your simulation did nothing differently. Something else took a number from the shared pile, and every draw after that shifted by one. In a big program you would never know which call did it, and the result would change whenever someone updated a library or reordered two imports.

A Generator does not have this weakness. It is an ordinary object that you create, name and pass to the functions that need it. Nothing else can draw from it unless you hand it over:

```python
rng1 = np.random.default_rng(0)
rng2 = np.random.default_rng(0)
_ = np.random.rand()          # the same meddling library call
print(rng1.normal(size=3), rng2.normal(size=3))
# [ 0.12573022 -0.13210486  0.64042265] [ 0.12573022 -0.13210486  0.64042265]
```

The global draw touched the global state only. Your generators are untouched.

::: key Why np.random.default_rng and not np.random.seed?
The Generator API gives you an independent, explicitly seeded stream you can pass around, instead of a hidden global state that any library call can perturb. Reproducible Monte Carlo requires the explicit version.
:::

::: warning Seed once, at the top, and pass the generator down
Do not create a new `default_rng(0)` inside a function that is called many times: every call would restart the same stream and draw the same "random" numbers again and again. Make the generator once, where the run starts, and pass it as an argument — `def add_noise(x, rng):` — so every function says in its signature that it uses randomness. The legacy `np.random.seed` still works (it drives the old **[[Mersenne Twister|mersenne]]** generator), but use it only when you must reproduce an old result exactly.
:::

## One stream per case: SeedSequence

A single generator is enough for a quick script. A serious Monte Carlo study needs more, for three reasons:

1. **Rerunning one case.** If all 1000 cases share one stream, case 880's numbers depend on how many numbers cases 0 to 879 drew. To rerun case 880 you must rerun everything before it.
2. **Parallel runs.** If eight processors each run part of the study, they each need their own stream, and those streams must not overlap or copy each other.
3. **Changing the model.** Add a new random input — a wind gust, say — and with one shared stream every later draw shifts. Every case changes, and you cannot tell whether a result moved because of the wind or because of the shift.

The fix is to give every case its own generator, derived from one recorded **master seed**. NumPy does the deriving with a **SeedSequence**, an object whose job is to turn one seed into many seeds that are independent of each other. Its `spawn(n)` method makes `n` [[children|spawn-tree]]:

```python
ss = np.random.SeedSequence(20260927)
children = ss.spawn(3)
print(children[0])
# SeedSequence(
#     entropy=20260927,
#     spawn_key=(0,),
# )
rngs = [np.random.default_rng(c) for c in children]
for r in rngs:
    print(r.normal(size=2))
# [-0.31719386 -1.15154558]
# [-0.11053096  0.48653459]
# [ 1.26795495 -0.33210855]
```

Each child remembers two things: the master's **entropy** (the seed, here `20260927`) and its **spawn key**, its position in the family, `(0,)`, `(1,)`, `(2,)`. Those two together fully decide its stream. So you can rebuild the generator for any single case without making the others, by naming its spawn key:

```python
direct = np.random.default_rng(np.random.SeedSequence(20260927, spawn_key=(2,)))
print(direct.normal(size=2))
# [ 1.26795495 -0.33210855]
```

That is exactly the third child's stream. The shortcut `rng.spawn(n)` does the same starting from a Generator: `np.random.default_rng(20260927).spawn(2)` gives children whose first stream matches `children[0]` above.

The mixing that SeedSequence does is also why neighboring seeds are safe: seeds `0`, `1` and `2` give streams with no visible relationship to one another.

::: key SeedSequence and spawn
`np.random.SeedSequence(master).spawn(n)` makes `n` independent child seeds; pass each to `default_rng`. A child is fixed by `(entropy, spawn_key)`, so `np.random.SeedSequence(master, spawn_key=(k,))` rebuilds case `k` alone. Record the master seed with the results.
:::

::: warning Recording "no seed" still means recording a seed
If you really want a fresh run, create `ss = np.random.SeedSequence()` with no argument and print `ss.entropy` — a large integer drawn from the operating system — into the log. The run was still random when it started, but now it can be repeated. A result nobody can reproduce is a result nobody can debug.
:::

## A dispersion study, end to end

In GNC, **[[dispersions|dispersions]]** are the small, uncertain differences between the vehicle you designed and the one that flies: an engine a little strong, a mass a little high, an angle a little off. A dispersion study draws those at random, many times, and looks at how widely the outcome spreads.

::: example Where does the sounding rocket land?
A small rocket burns out at speed $v$ and flight-path angle $\theta$ (measured up from the horizontal), then coasts. Ignoring the air, it lands a ground distance

$$
R = \frac{v^2 \sin 2\theta}{g_0}
$$

away, with $g_0 = 9.80665\,\mathrm{m/s^2}$. The design point is $v = 1000\,\mathrm{m/s}$, $\theta = 45°$. The engine is uncertain: $v$ has a standard deviation of $5\,\mathrm{m/s}$. The guidance is uncertain: $\theta$ has a standard deviation of $0.5°$. How far from the nominal point does it land?

```python
import numpy as np

g0 = 9.80665
MASTER = 20260927
n = 10_000
rng = np.random.default_rng(MASTER)
v = rng.normal(1000.0, 5.0, size=n)                     # m/s at burnout
theta = np.radians(rng.normal(45.0, 0.5, size=n))       # rad, flight-path angle
R = v**2 * np.sin(2 * theta) / g0                       # m, ground range
R_nom = 1000.0**2 / g0
miss = R - R_nom
print(f"nominal range  {R_nom:9.1f} m")
print(f"mean miss      {miss.mean():9.1f} m")
print(f"std of miss    {miss.std():9.1f} m")
print(f"99% of |miss|  {np.percentile(np.abs(miss), 99):9.1f} m")
print(f"worst case     {np.abs(miss).max():9.1f} m  (case {np.abs(miss).argmax()})")
# nominal range   101971.6 m
# mean miss            2.9 m
# std of miss       1012.1 m
# 99% of |miss|     2609.6 m
# worst case        4096.4 m  (case 8450)
```

**Step 1.** One generator, seeded with the recorded master, draws all $10\,000$ speeds and then all $10\,000$ angles. The whole study is array arithmetic, with no loop.

**Step 2.** The nominal range is $1000^2 / 9.80665 \approx 101\,972\,\mathrm{m}$, about $102\,\mathrm{km}$ ($\sin 90° = 1$).

**Step 3.** The spread of the miss is about $1012\,\mathrm{m}$. For 99 of every 100 flights, the rocket lands within about $2.6\,\mathrm{km}$ of the aim point; that **[[percentile|percentile]]** is the kind of number a range safety officer asks for.

**Sanity check.** Estimate the spread by hand. $R$ grows as $v^2$, so a $0.5\%$ change in $v$ changes $R$ by about $1\%$: $0.01 \times 101\,972 \approx 1020\,\mathrm{m}$. At $45°$, $\sin 2\theta$ is at its peak, so a small angle error barely changes the range. The prediction, about $1020\,\mathrm{m}$, matches the $1012\,\mathrm{m}$ simulated. The mean miss of $2.9\,\mathrm{m}$ is tiny next to the spread; with $10\,000$ cases the mean itself is only known to about $1012 / \sqrt{10\,000} \approx 10\,\mathrm{m}$. Run it again with the same master seed and every number is identical.
:::

That version is fast, because every draw is one array operation. Its weakness is the one listed above: case 8450's numbers are the 8451st entries of two long arrays. For a model this cheap that is fine. For a real six-degree-of-freedom simulation that takes a minute per case and runs across a computer cluster, you want each case to own its stream.

::: example Rerunning the worst case alone
Give each case its own generator, built from the master seed and the case number:

```python
import numpy as np

g0 = 9.80665
MASTER = 20260927          # recorded with the results

def run_case(k, master=MASTER):
    """One dispersed trajectory. Everything random comes from this case's own stream."""
    rng = np.random.default_rng(np.random.SeedSequence(master, spawn_key=(k,)))
    v = rng.normal(1000.0, 5.0)                   # m/s
    theta = np.radians(rng.normal(45.0, 0.5))     # rad
    return v**2 * np.sin(2 * theta) / g0 - 1000.0**2 / g0

misses = np.array([run_case(k) for k in range(1000)])
worst = int(np.abs(misses).argmax())
print(worst, misses[worst])
# 880 3490.9731318590057
print(run_case(worst))
# 3490.9731318590057
print(misses.std())
# 1021.6933945688448
```

**Step 1.** `run_case(k)` builds case `k`'s generator from `(MASTER, k)`, and draws everything that case needs from it. Nothing it does can shift any other case.

**Step 2.** After 1000 cases, the worst is case 880, which misses by about $3.49\,\mathrm{km}$.

**Step 3.** `run_case(880)` on its own gives the same miss to every digit. You can now run that one case under a debugger, with plots, as many times as you like.

**Sanity check.** The spread over these 1000 cases, $1022\,\mathrm{m}$, agrees with the $1012\,\mathrm{m}$ from $10\,000$ cases and with the $1020\,\mathrm{m}$ hand estimate. Different streams, same physics, same answer, as it should be. (Because a case here is so cheap, this loop is only there to keep the example small. Lesson 13 is about when a loop like this is the right choice.)
:::

In a parallel run, each worker process receives a list of case numbers and the master seed, and calls `run_case` for each. The result does not depend on how many workers there were or which one ran which case. That is the property to aim for.

::: warning Same seed, same numbers — on the same NumPy
The raw bit streams are kept stable between NumPy releases, but the methods that turn bits into, say, normal numbers may be improved in a new version, which changes their output. So write down the NumPy version next to the master seed (`np.__version__`), and pin it in the project's requirements, as the packaging lessons showed. Also remember that reproducible is not the same as correct: if the model has a bug, the same seed reproduces the same bug.
:::

## Check yourself

::: check
A teammate writes a noise helper `def noisy(x): return x + np.random.default_rng(1).normal(0, 0.1, x.shape)` and calls it on every telemetry frame. What is wrong, and how should it look?
:::

::: answer
A new generator seeded with `1` is created on every call, so every call draws the *same* noise. The "random" noise added to frame 2 is identical to the noise on frame 1, which is not noise at all and will fool any filter tested with it. Create the generator once where the run starts and pass it in: `def noisy(x, rng): return x + rng.normal(0.0, 0.1, x.shape)`, called as `noisy(frame, rng)`.
:::

::: check
A Monte Carlo script seeds with `np.random.seed(42)` and uses `np.random.normal` throughout. After someone adds `import some_plotting_helper` at the top, the results change even though no simulation code changed. Give the most likely reason, and the fix.
:::

::: answer
The legacy functions share one global state. Importing the helper probably ran code that drew random numbers from that global state (for example to pick default colors or jitter), which shifted every later draw in the simulation. The fix is to stop using the global state: create `rng = np.random.default_rng(42)` (or per-case generators from a SeedSequence) and pass it to every function that draws. Nothing an imported module does can then touch your stream.
:::

::: check
A study of 5000 cases used master seed `777` and gave each case the generator `default_rng(SeedSequence(777, spawn_key=(k,)))`. Case 3121 failed. Write the one line that recreates only that case's generator, and explain why the other 4999 cases do not need to run first.
:::

::: answer
`rng = np.random.default_rng(np.random.SeedSequence(777, spawn_key=(3121,)))`

A child's stream is fixed entirely by its entropy (the master seed, 777) and its spawn key (3121). It does not depend on how many numbers any other case drew, or in what order cases were run. So the generator for case 3121 is the same whether or not the others ran.
:::

::: check
You add a new random input, a wind speed, to `run_case` and draw it *before* the speed and angle. With per-case generators, do the speed and angle of case 17 change? What about in the first example's design, with one generator drawing whole arrays?
:::

::: answer
With per-case generators, yes: case 17 now draws wind first, so its speed and angle come from later positions in its own stream and change. But only case 17's own stream is affected, and only because its own draws were reordered; drawing the wind *last* would leave the speed and angle as before. (Giving each input its own child stream, with a second spawn level, removes even that.) In the one-generator design, drawing an extra array of $n$ wind values first shifts every later draw, so the speed and angle of *every* case change. That is why adding a model feature to a shared-stream study can move all the results at once.
:::

::: check
In the dispersion example, which input contributes most of the landing spread, and why does the other contribute so little? Use the formula to explain.
:::

::: answer
The speed does. $R \propto v^2$, so a $0.5\%$ speed error ($5\,\mathrm{m/s}$ of $1000$) makes about a $1\%$ range error, about $1020\,\mathrm{m}$. The angle enters as $\sin 2\theta$, and at $\theta = 45°$ that is at its maximum, where the curve is flat: a small change in $\theta$ changes $\sin 2\theta$ only by an amount proportional to the *square* of the change. For $0.5° \approx 0.0087\,\mathrm{rad}$, $1 - \cos(2 \times 0.0087) \approx 1.5 \times 10^{-4}$, about $16\,\mathrm{m}$ of range. That is why engineers often aim near the angle where the outcome is least sensitive.
:::

## Summary

| Tool | What it does | Remember |
| --- | --- | --- |
| `np.random.default_rng(seed)` | a Generator (PCG64) with its own stream | same seed, same numbers; pass it as an argument |
| `default_rng()` | fresh entropy from the operating system | log `SeedSequence().entropy` if you do this |
| `np.random.seed`, `np.random.normal` | legacy global state (Mersenne Twister) | any code can perturb it; avoid in new work |
| `np.random.SeedSequence(m).spawn(n)` | `n` independent child seeds | each child fixed by `(entropy, spawn_key)` |
| `SeedSequence(m, spawn_key=(k,))` | rebuild case `k` alone | rerun one failing case |
| `rng.spawn(n)` | child Generators from a Generator | same family as `SeedSequence.spawn` |
| Reproducibility | record master seed and `np.__version__` | reproducible is not the same as correct |

A dispersion study of real size produces a lot of numbers: millions of samples per case, thousands of cases. The next lesson is about getting arrays like that onto disk and back, quickly and safely, including files too big to fit in memory.

::: context monte-carlo-name Why it is called Monte Carlo
The method was named in the late 1940s by Stanislaw Ulam and John von Neumann, working at Los Alamos, with their colleague Nicholas Metropolis suggesting the name. Ulam had been thinking about the odds of winning a game of solitaire and realized it was easier to play many random games and count than to work out the answer exactly. Monte Carlo, the casino town in Monaco, stood for games of chance. The first large runs were done on ENIAC, one of the earliest electronic computers.
:::

::: context prng-picture The recipe inside a generator
A generator is a loop: the state goes through a scrambling step, a number comes out, and the scrambled state becomes the new state. The seed only sets where the loop starts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="60" height="34" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">seed</text>
  <line x1="70" y1="67" x2="102" y2="67" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="108,67 98,62 98,72" fill="#1f2a44"/>
  <rect x="110" y="50" width="70" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="145" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">state</text>
  <line x1="180" y1="67" x2="212" y2="67" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="218,67 208,62 208,72" fill="#1f2a44"/>
  <rect x="220" y="50" width="70" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="255" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">scramble</text>
  <line x1="290" y1="67" x2="322" y2="67" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="328,67 318,62 318,72" fill="#1d6fd1"/>
  <text x="340" y="71" font-size="12" text-anchor="middle" fill="#1d6fd1">0.13</text>
  <path d="M255,84 L255,116 L145,116 L145,90" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="145,86 140,96 150,96" fill="#b4232c"/>
  <text x="200" y="132" font-size="11" text-anchor="middle" fill="#b4232c">new state</text>
</svg>
```

Because the loop is fixed, knowing the seed means knowing every number that will ever come out. That is what makes the stream repeatable.
:::

::: context pcg64 What PCG64 is
PCG stands for "permuted congruential generator". It was published by Melissa O'Neill in 2014. Its state is a 128-bit number that is updated by a simple multiply-and-add, and each output is that state with its bits shuffled in a way that depends on the state itself. It is fast, small, and passes the demanding statistical test suites. NumPy made it the default in version 1.17, in 2019, when the Generator API arrived.
:::

::: context mersenne The Mersenne Twister
The Mersenne Twister, published by Makoto Matsumoto and Takuji Nishimura in 1998, was the standard generator in science software for two decades: Python's own `random` module, MATLAB and the legacy `np.random` all use it. Its name comes from its period, $2^{19937} - 1$, a Mersenne prime. It is still fine for many uses, but its state is large (about 2.5 kB), and it has no built-in way to split one seed into many independent streams, which is what modern parallel Monte Carlo needs.
:::

::: context spawn-tree A family tree of seeds
One recorded master seed becomes a whole family of independent streams, each named by its path from the root.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">master 20260927</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="40" x2="60" y2="90"/><line x1="180" y1="40" x2="180" y2="90"/><line x1="180" y1="40" x2="300" y2="90"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="90" width="80" height="28" rx="6"/><rect x="140" y="90" width="80" height="28" rx="6"/><rect x="260" y="90" width="80" height="28" rx="6"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="109">key (0,)</text><text x="180" y="109">key (1,)</text><text x="300" y="109">key (2,)</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="60" y="138">case 0</text><text x="180" y="138">case 1</text><text x="300" y="138">case 2</text>
  </g>
</svg>
```

A child can spawn its own children, whose keys get longer — `(2, 0)`, `(2, 1)` — for example one stream per random input inside case 2.
:::

::: context dispersions Dispersions in real flight analysis
Launch providers and space agencies run thousands of dispersed cases before a flight. Each case draws engine performance, masses, aerodynamic coefficients, winds and sensor errors from their expected ranges, then flies a full simulation. The results decide landing zones, fuel reserves and whether a guidance design has enough margin. The seeds are archived with the results, because months later someone will ask about one strange case, and the answer is to fly it again.
:::

::: context percentile What a percentile means
The 99th percentile of a set of numbers is the value that 99% of them fall at or below. If you sort 10,000 misses from smallest to largest, the 99th percentile sits near the 9,900th. Unlike the maximum, it does not jump around with a single freak case, and unlike the standard deviation, it does not assume the results form a bell curve. That makes it a favorite for safety numbers: "99 of 100 landings fall within 2.6 km".
:::
