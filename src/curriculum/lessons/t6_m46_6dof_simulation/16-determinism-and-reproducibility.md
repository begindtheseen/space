---
id: l16-determinism-and-reproducibility
title: Determinism and reproducibility
minutes: 19
covers:
  - "Determinism and reproducibility: seeded random number streams, per-case seeds, and bit-exact replay of a single case out of a campaign"
---

The previous lesson's whole method — compute a prediction, check every diff against it, find the one bug hiding in a sea of expected changes — depends on being able to run the same case twice and get the same answer. So does something this module has not built yet but is aiming squarely at: a dispersion campaign of thousands of cases, one of which fails, and an engineer who needs to reproduce *that exact case* to find out why. If the simulation cannot promise the same seed produces the same answer, bit for bit, that single failing case is gone the moment the campaign moves on, and nobody will ever know what it was actually testing.

## What determinism requires, item by item

Reproducibility is not a property a simulation has by default; it is a property you design in, and it fails in a small number of specific, recognisable ways.

::: example One shared stream versus one stream per model
A campaign case draws random numbers for several independent things: IMU noise, a wind gust, initial condition dispersion. The naive approach seeds one global generator and draws from it in sequence — which means every model's draws depend on exactly how many numbers every model *before* it in the sequence happened to draw.

```python
import numpy as np

def run_shared(case_seed, imu_draws):
    rng = np.random.default_rng(case_seed)
    _ = rng.standard_normal(imu_draws)         # model A: IMU noise
    wind_gust = rng.standard_normal(2)          # model B: wind, drawn from the SAME stream
    return wind_gust

def run_independent(case_seed, imu_draws):
    seeds = np.random.SeedSequence(case_seed).spawn(3)   # one sub-stream per model
    rng_imu, rng_wind, rng_ic = (np.random.default_rng(s) for s in seeds)
    _ = rng_imu.standard_normal(imu_draws)
    wind_gust = rng_wind.standard_normal(2)
    return wind_gust

case_seed = 42
print("shared stream, wind draw before/after IMU model changes its draw count:")
print(" ", run_shared(case_seed, 3), "vs", run_shared(case_seed, 5))
print("independent streams, wind draw before/after IMU model changes its draw count:")
print(" ", run_independent(case_seed, 3), "vs", run_independent(case_seed, 5))
# shared stream, wind draw before/after IMU model changes its draw count:
#   [ 0.94056472 -1.95103519] vs [-1.30217951  0.1278404 ]
# independent streams, wind draw before/after IMU model changes its draw count:
#   [1.25449437 0.60628944] vs [1.25449437 0.60628944]
```

With one shared stream, a change to the IMU noise model that has nothing to do with wind — even a change as small as how many random numbers it consumes — silently changes every wind gust in every case that follows it in the stream, and therefore every trajectory that depends on wind. The same case seed no longer means the same case; it means "whatever the current code happens to consume from a shared, order-dependent sequence." Spawning one independent sub-stream per model from the case's `SeedSequence`, as the second version does, means a change to one model's random consumption cannot touch any other model's draws, regardless of what changed elsewhere in the codebase. This is the mechanism behind the flashcard fact: one seeded stream per model, derived from the case seed.
:::

Three more requirements round out the list, each a specific failure mode rather than a vague caution. **No uninitialised state**: any buffer, counter or object attribute that survives from one case to the next carries information across a boundary that is supposed to be sealed, so the tenth case in a batch can behave differently from the same case run first, depending on what the ninth case happened to leave behind. **No dependence on wall-clock time, entropy or container iteration order**: seeding a stream from `time.time()` instead of the case seed makes every run unique by construction; a loop that runs "until 10 seconds have elapsed" rather than a fixed number of iterations makes the result depend on the speed of the machine it happened to run on; iterating a hash-based container whose order is not guaranteed to be stable across runs or language versions quietly reorders operations that are not associative. **A fixed floating-point reduction order under parallelism** is the subtlest of the four, and worth its own demonstration, because "the same numbers, added in a different order" sounds harmless and is not.

::: example Addition is not associative, and parallel reductions add in different orders
Sum the same million floating-point numbers three ways: a plain sequential loop, and two "parallel-style" reductions that split the array into chunks — the way a computation split across threads or cores actually would — and sum each chunk before combining the partial sums.

```python
import numpy as np

rng = np.random.default_rng(0)
x = rng.standard_normal(1_000_000)

def sequential_sum(arr):
    total = 0.0
    for v in arr:
        total += v
    return total

def chunked_sum(arr, n_chunks):
    total = 0.0
    for chunk in np.array_split(arr, n_chunks):
        total += float(np.sum(chunk))     # each chunk summed independently, as a thread would
    return total

s_forward = sequential_sum(x)
s_4 = chunked_sum(x, 4)
s_8 = chunked_sum(x, 8)
print("forward sequential sum:", repr(s_forward))
print("4-way 'parallel' sum:  ", repr(s_4))
print("8-way 'parallel' sum:  ", repr(s_8))
print("all exactly equal?", s_forward == s_4 == s_8)
print("max difference:", max(abs(s_forward-s_4), abs(s_forward-s_8), abs(s_4-s_8)))
# forward sequential sum: 998.570649438616
# 4-way 'parallel' sum:   998.5706494386212
# 8-way 'parallel' sum:   998.5706494386213
# all exactly equal? False
# max difference: 5.343281372915953e-12
```

Three mathematically equivalent ways of adding exactly the same one million numbers give three different floating-point answers, differing at the twelfth significant figure. That is not a bug in any one of them — floating-point addition genuinely is not associative, because each intermediate rounding depends on the order operands arrive in, and this module's frame-discipline lesson already showed how a difference this small, left to compound over enough steps, becomes a measurable divergence. If the number of threads or cores available on a given run determines how a reduction inside the physics is split, then the *same case seed, on the same code, on a different day with a different core count,* can produce a different trajectory. Bit-exact replay needs the reduction order fixed and known, not merely "close enough."
:::

## Why parallelism goes across cases, not within one

The fix implied by the last example is not "never parallelise" — a dispersion campaign of thousands of cases is exactly where parallelism earns its keep. It is to put the parallelism at the case boundary rather than inside a single case's arithmetic: run each of the thousands of cases as an independent, single-threaded, entirely serial simulation, and distribute *cases* across cores rather than splitting any one case's computation across them. A single-threaded run has one, fixed order of operations by construction, so replaying case 4{,}217 out of a ten-thousand-case campaign means running exactly that one case, alone, on one core, with its own seed — which reproduces bit-exact, because nothing about a single-threaded run depends on how many other cores happened to be busy at the time. This is also this module's own answer to where parallelism belongs, and the next lesson builds on it directly.

::: key What determinism requires
One seeded random stream per model, derived from the case seed via independent sub-streams — never one shared stream models draw from in sequence. No uninitialised state carried between cases. No dependence on wall-clock time, entropy, or container iteration order. A fixed floating-point reduction order, which in practice means keeping each case single-threaded rather than splitting its arithmetic across cores. Without all four, you cannot replay the one case out of ten thousand that failed.
:::

::: warning "It's only a rounding difference, it won't matter"
The reduction-order example's differences were twelve significant figures down — by any reasonable standard, tiny. This module has already shown, more than once, that a difference this small is exactly the kind that compounds under Euler's equations' gyroscopic coupling, a quaternion's renormalisation history, or a bisected event's crossing time, into something that eventually is not tiny at all. The question is never "is this rounding difference big" — it is "does bit-exact replay of this exact case still work," and a rounding difference of any size breaks that guarantee completely, even when its immediate physical effect is negligible.
:::

::: warning Seeding once at the top of a campaign instead of once per case
Seeding a single global generator once, at the start of a ten-thousand-case run, and letting every case draw from it in sequence reproduces the exact bug the first example demonstrated, at campaign scale: reordering the cases, running a subset of them, or adding a case in the middle all shift every subsequent case's random draws, so "case 4,217" stops meaning a fixed, reproducible scenario and starts meaning "whatever the 4,217th block of draws from this particular run's stream happened to be." Each case needs its own seed, derived deterministically from the case index, so that case 4,217 is the same case no matter what else the campaign around it does.
:::

## Check yourself

::: check
Why does giving each model its own random stream, spawned from the case seed, prevent a change to one model from affecting another model's results — when a single shared stream does not?
:::

::: answer
A spawned sub-stream is generated independently from the case's `SeedSequence` and has no positional relationship to any other model's stream — drawing more or fewer numbers from it affects only that model's own subsequent draws. A shared stream has no such separation: every model's draws occupy a specific position in one linear sequence, so any change to how many numbers an earlier model consumes shifts the starting position, and therefore the values, of every model that draws after it.
:::

::: check
The floating-point reduction-order example showed three different sums differing at the twelfth significant figure. Why is this specifically a threat to bit-exact replay, given that the difference is far smaller than any physical tolerance the simulation cares about?
:::

::: answer
Bit-exact replay requires the *exact same sequence of floating-point operations*, not merely an answer within physical tolerance — a twelfth-significant-figure difference means the replayed run is not bit-for-bit identical to the original, even though both are equally valid numerically. Once a run is not bit-exact, comparing it against the original run to debug a specific failure becomes unreliable, because any subsequent difference in the trajectory could be the bug under investigation or could be nothing more than this same rounding-order artefact compounding, and there is no way to tell the two apart without already knowing the answer.
:::

::: check
A campaign engineer proposes parallelising each individual case's physics across four cores to make the campaign finish faster, while keeping one seed per case. What specifically goes wrong with reproducibility, even though the seeding is done correctly?
:::

::: answer
Splitting one case's arithmetic across four cores introduces exactly the reduction-order dependency the second example demonstrated: the order in which partial results from each core are combined depends on scheduling details — which core finishes first, how the work happened to be divided — that are not fixed by the case seed at all. Two runs of the identical case, with the identical seed, can then produce different floating-point results depending on incidental timing on a given run, which breaks bit-exact replay even though the random-number seeding was done exactly right.
:::

::: check
Why is "no dependence on wall-clock time" listed as a determinism requirement separately from seeding, when seeding already fixes the random numbers?
:::

::: answer
Seeding fixes the *random number* stream, but wall-clock dependence can enter a simulation in ways that have nothing to do with drawing random numbers — a loop that terminates after a fixed real-time duration rather than a fixed iteration count, a timestamp logged as part of the state, or a timeout used as a control-flow condition. Any of these makes the simulation's behaviour depend on how fast the machine happens to run on a given occasion, which a correctly seeded random stream does nothing to prevent.
:::

::: check
A ten-thousand-case Monte Carlo campaign seeds one global random generator at the very start and lets all ten thousand cases draw from it in sequence, rather than giving each case its own seed. A later run adds five new cases to the front of the list to investigate a different question. What happens to case 4,217, and why does this matter for reproducing a failure found in the original run?
:::

::: answer
Inserting five cases before it shifts every subsequent case's position in the shared stream by five cases' worth of draws, so what was case 4,217 in the original run consumes a different segment of random numbers than case 4,222 does in the new run — despite both nominally being "case 4,217" by index, they are no longer the same scenario. An engineer trying to reproduce a failure originally seen at case 4,217 would be reproducing the wrong case entirely, with no indication anything was wrong beyond the numbers failing to match.
:::

::: check
Why does keeping each Monte Carlo case single-threaded make bit-exact replay of one case straightforward, in a way that is not straightforward for a simulation that parallelises within each case?
:::

::: answer
A single-threaded run has exactly one possible order of operations — there is no scheduling decision, no split-and-combine step, nothing whose outcome depends on how many cores were free or how work happened to be divided at runtime. Replaying that case means running the identical sequence of operations on the identical seed, which reproduces bit-exact by construction. A case parallelised internally reintroduces the reduction-order dependency the earlier example demonstrated, so the same case and the same seed no longer guarantee the same floating-point result run to run.
:::

## Summary

| Requirement | Failure mode if skipped | This lesson's evidence |
| --- | --- | --- |
| One stream per model | A shared stream makes every model's draws depend on every earlier model's draw count | Wind draw changed completely when the IMU model's draw count changed, under a shared stream |
| No uninitialised state | A case's result depends on what a previous case left behind | — |
| No wall-clock/entropy/container-order dependence | Results depend on machine speed or run-to-run entropy, not the case seed | — |
| Fixed floating-point reduction order | Parallel reductions add in different orders and get different answers | Three equivalent sums differed at the twelfth significant figure |
| Parallelism at the case boundary | Splitting one case's arithmetic across cores reintroduces reduction-order dependence | Single-threaded cases have exactly one operation order, by construction |

Determinism is what makes a ten-thousand-case campaign debuggable one case at a time. The next lesson turns to the campaign itself: where the performance actually needs to come from, and why it is cases in parallel, never a case split apart.
