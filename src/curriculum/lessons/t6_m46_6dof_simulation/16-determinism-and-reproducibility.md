---
id: l16-determinism-and-reproducibility
title: Determinism and reproducibility
minutes: 22
covers:
  - "Determinism and reproducibility: seeded random number streams, per-case seeds, and bit-exact replay of a single case out of a campaign"
---

If you have played a game that builds its worlds from a **[[seed|seed-word]]** — a number you can type in — you know a strange fact. The world looks random: hills, rivers, caves in no pattern at all. But type the same seed on a different computer and you get the very same world, down to the last cave. The randomness was never really random. It was a long recipe that starts from one number.

A flight simulation needs exactly that trick. Soon you will run a **[[Monte Carlo|monte-carlo]]** campaign: the same flight simulated ten thousand times, each time with slightly different winds, sensor errors and starting conditions, to see how often things go wrong. Suppose case number 4,217 crashes. You need to run *that exact case* again, alone, with a debugger attached, to find out why. If you cannot get it back exactly, the one failure that mattered is gone the moment the campaign ends.

This lesson is about building that ability in. A simulation is **deterministic** when the same inputs always give the same outputs. It is **reproducible** when you can actually re-create those inputs later. And the bar is high: **bit-exact** replay, meaning every one of the **[[bits|bits]]** in every number matches, not "close enough". The previous lesson's golden files lean on this too — a diff only means something if running the same case twice gives no diff at all.

Reproducibility does not come free. You design it in. And it breaks in four specific ways, which this lesson takes one at a time.

## Random numbers from a recipe

A computer cannot flip a real coin. Instead it uses a **pseudo-random number generator** (PRNG): a small machine that takes a number, scrambles it, hands you some output, and remembers where it got to. Ask again and it scrambles its remembered state again. The outputs pass every test for looking random, but they are fully fixed by the starting number — the **seed**. Same seed, same list of numbers, forever. That list is called a **stream**.

So seeding gives you control. The question is *how many* streams, and *where* each gets its seed.

### One stream per model

A single campaign case draws random numbers for several unrelated things: the IMU's noise, a wind gust, the scatter in the starting conditions. Each of these lives in its own model — its own box in the five-box design.

The tempting shortcut is one generator for everything. The IMU model draws its numbers, then the wind model draws its numbers from the same stream, and so on down the line. Picture a deck of cards dealt around a table. If the first player suddenly takes three cards instead of two, every player after them gets a different hand — even though nothing about *their* seat changed.

::: example One shared stream versus one stream per model
The code draws a wind gust twice: once after the IMU model has used 3 numbers, and once after it has used 5. It does this two ways — with one shared stream, and with a separate stream for each model.

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

Read the output line by line.

- **Shared stream.** The IMU change had nothing to do with wind. It only changed how many numbers the IMU model took. Yet the gust went from $(0.94, -1.95)$ to $(-1.30, 0.13)$ — a completely different gust. Every trajectory that feels the wind now changes too.
- **Separate streams.** `SeedSequence(case_seed).spawn(3)` turns one case seed into three **[[independent sub-streams|spawn-tree]]**, one per model. The IMU can take as many numbers as it likes from its own stream. The wind stream never notices: the gust is $(1.25, 0.61)$ both times.

With a shared stream, "the same case seed" stops meaning "the same case". It means "whatever the current code happens to pull from one long, order-dependent list". With one stream per model, a change to one model cannot touch another model's draws.
:::

Sharing a stream has a second danger once threads are involved. If two parts of the code run at the same time and both draw from one generator, *which one draws first* depends on timing — which core was free, what else the machine was doing. That order can differ from run to run, so the numbers each part receives differ too, even with the seed held fixed.

### One seed per case

The same logic applies one level up, to the whole campaign. Each case needs its own seed, worked out from the case number itself — for example by feeding both the campaign seed and the case index into `SeedSequence`. Then case 4,217 is the same case whether you run the campaign forward, backward, or run that case alone next week.

::: example Replaying case 4,217 by itself
The code below runs a toy campaign of ten thousand cases in order, runs it again backward, and then runs case 4,217 alone. Each case builds its three model streams from `[CAMPAIGN_SEED, case_index]`.

```python
import numpy as np

CAMPAIGN_SEED = 2026

def case_streams(case_index):
    # one seed per case, built from the campaign seed and the case number
    ss = np.random.SeedSequence([CAMPAIGN_SEED, case_index])
    rng_imu, rng_wind, rng_ic = (np.random.default_rng(s) for s in ss.spawn(3))
    return rng_imu, rng_wind, rng_ic

def run_case(case_index):
    rng_imu, rng_wind, rng_ic = case_streams(case_index)
    v = 7000.0 + 5.0 * rng_ic.standard_normal()        # dispersed start speed, m/s
    for _ in range(100):                               # 100 steps of a toy flight
        v += 0.01 * rng_imu.standard_normal() - 0.02 * rng_wind.standard_normal()
    return v

campaign = [run_case(i) for i in range(10_000)]        # the full campaign, in order
backwards = {i: run_case(i) for i in reversed(range(10_000))}
replay = run_case(4217)                                # case 4217 alone, days later

print("case 4217 in the campaign:", campaign[4217].hex())
print("case 4217 run backwards:  ", backwards[4217].hex())
print("case 4217 replayed alone: ", replay.hex())
print("bit-exact?", campaign[4217] == backwards[4217] == replay)
# case 4217 in the campaign: 0x1.b58a1f1f07674p+12
# case 4217 run backwards:   0x1.b58a1f1f07674p+12
# case 4217 replayed alone:  0x1.b58a1f1f07674p+12
# bit-exact? True
```

The `.hex()` call prints the number's exact bits in **[[hexadecimal|hex-float]]**, so "the same" here means every bit, not the first few digits. (In ordinary decimal the value is about $7000.63\,\mathrm{m/s}$.) Three very different ways of reaching case 4,217 land on identical bits. That is bit-exact replay of a single case out of a campaign.
:::

::: warning Seeding once at the top of a campaign instead of once per case
Seed one global generator at the start of a ten-thousand-case run and let every case draw from it in turn, and you get the shared-stream bug again — at campaign scale. Reorder the cases, run only some of them, or add one in the middle, and every later case's draws shift. "Case 4,217" stops being a fixed scenario. It becomes "whatever the 4,217th block of numbers from this particular run happened to be". Give each case its own seed, worked out from its case number, so case 4,217 is the same case no matter what the campaign around it does.
:::

## Leftovers, clocks and shuffled lists

Seeding fixes the random numbers. But a run can also pick up differences from places that have nothing to do with random numbers. There are two more requirements.

### No uninitialized state

Picture a classroom whiteboard. If the last class did not erase it, the next class starts with somebody else's notes in the corner. **Uninitialized state** is the same thing in code: a buffer, a counter or a stored value that is not reset at the start of a case. The tenth case in a batch then begins with whatever the ninth case left behind. Run case ten first, alone, and it starts clean — and gives a different answer. Every case must start from a state set entirely by its own inputs.

### No clocks, no entropy, no container order

Three more ways the outside world sneaks in.

- **Wall-clock time.** Seeding a stream from the current time, `time.time()`, makes every run different by design. So does a loop that runs "until 10 seconds have passed" instead of "for 1,000 steps": a fast computer does more steps than a slow one. So does a timeout used to decide what the code does next.
- **Entropy.** The operating system can hand out truly unpredictable numbers, gathered from things like hardware timing noise. That is called **entropy**. Great for passwords, fatal for replay.
- **Container iteration order.** Some containers — Python's `set`, many **[[hash maps|hash-map]]** — do not promise any particular order when you loop over them. The order can change between runs or between language versions. If that loop feeds arithmetic, the operations happen in a different order.

You can watch the last one happen. Python scrambles string hashes with a per-run value called `PYTHONHASHSEED`. Fix it three different ways and loop over the same set:

```python
import os, subprocess, sys

for seed in ["1", "2", "3"]:
    env = dict(os.environ, PYTHONHASHSEED=seed)
    out = subprocess.run([sys.executable, "-c", 'print(list({"imu", "wind", "gps", "baro"}))'],
                         env=env, capture_output=True, text=True).stdout.strip()
    print(seed, out)
# 1 ['imu', 'wind', 'gps', 'baro']
# 2 ['imu', 'gps', 'wind', 'baro']
# 3 ['baro', 'imu', 'wind', 'gps']
```

Same four names, three orders. If a simulation updated its models by looping over a set like this, the models would run in a different order on each run. Loop over a list, or sort first.

## Adding in a different order

The fourth requirement is the sneakiest, because it sounds harmless.

In school arithmetic, $(a + b) + c = a + (b + c)$. The grouping does not matter; that rule is called **associativity**. Computers break it. A computer stores a number as a **[[floating-point number|floating-point]]** — a fixed count of significant digits (about 16 decimal digits for the usual 64-bit kind) and a power of two. After every addition, the result is rounded to fit. Change the order and the roundings happen at different moments, so the final answer can differ in its last digit:

$$
(0.1 + 0.2) + 0.3 = 0.6000000000000001, \qquad 0.1 + (0.2 + 0.3) = 0.6.
$$

A bigger case shows why. Add $1$ to $10^{16}$ first, and the $1$ is too small to fit in sixteen digits next to $10^{16}$, so it is rounded away: $(10^{16} + 1) - 10^{16} = 0$. Do the subtraction first and nothing is lost: $(10^{16} - 10^{16}) + 1 = 1$.

This matters for **parallelism** — splitting work across several processor **[[cores|cores-and-threads]]** at once. To add up a long list in parallel, each core adds up its own chunk. Then the chunk totals are added together. That is a different grouping from adding the list front to back.

::: example Addition is not associative, and parallel reductions add in different orders
Add the same million random numbers three ways: a plain front-to-back loop, and two "parallel-style" sums that split the list into 4 or 8 chunks, add each chunk on its own, then add the chunk totals. Adding a list down to one number is called a **reduction**.

```python
import numpy as np

rng = np.random.default_rng(0)
x = rng.standard_normal(1_000_000)

def sequential_sum(arr):
    total = 0.0
    for v in arr:
        total += float(v)
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

Three correct ways of adding the same million numbers give three different answers. They agree to about twelve significant figures, then split. None of them is a bug — each rounded at different moments.

Now the danger. Suppose the number of cores available on a given day decides how a sum inside the physics gets split. Then the *same case, same seed, same code* run on a machine with a different core count can give a different trajectory. And the frame-discipline lesson already showed how a difference this small, left to [[compound over many steps|compounding]], grows into one you can measure.
:::

The same thing happens without threads. A processor can add four or eight numbers in one instruction, a trick called **SIMD** (single instruction, multiple data). A different library version, compiler setting or processor may pick a different SIMD path, which again groups the additions differently. Bit-exact replay needs the order of every reduction fixed and known.

::: warning "It's only a rounding difference, it won't matter"
Those differences sat twelve significant figures down — tiny by any physical standard. But this module has shown more than once that a difference this small can grow: through the spin coupling in Euler's equations, a quaternion's renormalization history, or an event time found by bisection. More important, the right question is never "is this rounding difference big?" It is "does bit-exact replay of this case still work?" A rounding difference of *any* size breaks that promise completely, even when its physical effect is nothing.
:::

## Why parallelism goes across cases, not within one

So should you never use parallel computing? No — a ten-thousand-case campaign is exactly where parallel computing pays off. The fix is *where* you put it.

Think of a bakery with ten thousand cakes to make and a hundred ovens. You would not try to bake one cake in a hundred ovens at once. You put a whole cake in each oven. In the same way, run each case as its own complete, **single-threaded** simulation — one core, doing one case's arithmetic in one fixed order from start to finish. Then hand out *cases* to cores, not pieces of a case.

A single-threaded run has exactly one order of operations. Nothing about it depends on how many other cores are busy. So replaying case 4,217 out of ten thousand means running exactly that case, alone, on one core, with its own seed — and it reproduces bit for bit, as the replay example showed. The next lesson builds on this directly, because the same choice also turns out to be the fastest one.

::: key What determinism in a simulation requires
One seeded random stream per model derived from the case seed; no uninitialised state; no dependence on wall-clock time, entropy or container iteration order; and a fixed floating-point reduction order under parallelism. Without it you cannot replay the one case out of ten thousand that failed.
:::

In practice, the fixed reduction order comes from keeping each case single-threaded and running the cases in parallel.

## Check yourself

::: check
Why does giving each model its own random stream, spawned from the case seed, stop a change in one model from affecting another model's results — when a single shared stream does not?
:::

::: answer
A spawned sub-stream is generated independently from the case's `SeedSequence`. It has no position relative to any other model's stream, so drawing more or fewer numbers from it only changes that model's own later draws.

A shared stream has no such separation. Every model's draws sit at a particular place in one long list. If an earlier model takes more or fewer numbers, every model after it starts at a different place in the list and gets different values — like the card game where one player taking an extra card changes everyone else's hand.
:::

::: check
The reduction example showed three sums that differ at the twelfth significant figure. That is far smaller than any physical tolerance the simulation cares about. So why is it a threat to bit-exact replay?
:::

::: answer
Bit-exact replay needs the *exact same sequence of floating-point operations*, not merely an answer within physical tolerance. A twelfth-figure difference means the replayed run is not bit-for-bit identical to the original, even though both are equally good numerically.

Once a replay is not bit-exact, comparing it with the original to hunt a failure stops being reliable. Any later difference in the trajectory could be the bug you are chasing — or just this rounding-order effect growing over many steps. You cannot tell the two apart without already knowing the answer.
:::

::: check
An engineer proposes splitting each case's physics across four cores to finish the campaign faster, while still giving each case its own seed. What goes wrong with reproducibility, even though the seeding is done correctly?
:::

::: answer
Splitting one case across four cores brings back the reduction-order problem from the second example. The order in which the four partial results are combined depends on things the seed does not control — which core finishes first, how the work was divided on that run.

Two runs of the same case with the same seed can then give different floating-point results, depending on timing. Bit-exact replay breaks, even though the random numbers were seeded perfectly.
:::

::: check
Why is "no dependence on wall-clock time" listed as its own requirement, separate from seeding? Doesn't seeding already fix the random numbers?
:::

::: answer
Seeding fixes the *random number* streams. But clock time can enter a simulation in ways that have nothing to do with random numbers:

- a loop that stops after a fixed amount of real time instead of a fixed number of steps;
- a timestamp stored as part of the state;
- a timeout used to decide what the code does next.

Each of these makes the result depend on how fast the machine happened to run that day. A perfectly seeded random stream does nothing to prevent that.
:::

::: check
A ten-thousand-case campaign seeds one global generator at the very start and lets all cases draw from it in turn. A later run adds five new cases to the front of the list to study something else. What happens to case 4,217, and why does it matter for reproducing a failure found in the first run?
:::

::: answer
The five new cases use up their own draws first, so every later case starts at a different place in the shared stream. The scenario that was case 4,217 in the first run is now case 4,222 — but it no longer gets the same numbers either, because the positions have all shifted. The new "case 4,217" is simply a different scenario with the same label.

An engineer trying to reproduce the original failure at case 4,217 would be running the wrong case entirely. Nothing would warn them except that the numbers fail to match.
:::

::: check
Why does keeping each Monte Carlo case single-threaded make bit-exact replay of one case straightforward, when it is not straightforward for a simulation that splits each case across cores?
:::

::: answer
A single-threaded run has exactly one possible order of operations. There is no scheduling decision, no split-and-combine step, nothing that depends on how many cores were free or how the work was divided.

Replaying the case means running the identical sequence of operations from the identical seed, which reproduces bit-exact automatically. A case split across cores brings back the reduction-order dependence, so the same case and seed no longer guarantee the same result from run to run.
:::

## Summary

| Requirement | What goes wrong without it | Evidence in this lesson |
| --- | --- | --- |
| One stream per model | A shared stream makes each model's draws depend on how many numbers earlier models took | The wind gust changed completely when only the IMU's draw count changed |
| One seed per case, from its case number | Reordering or adding cases changes what "case 4,217" means | Case 4,217 gave identical bits run forward, backward and alone |
| No uninitialized state | A case's result depends on what the previous case left behind | — |
| No clock, entropy or container-order dependence | Results depend on machine speed or the run, not the seed | A set of four names looped in three different orders |
| Fixed floating-point reduction order | Adding in a different grouping gives a different answer | Three equivalent sums differed at the twelfth significant figure |
| Parallelism across cases | Splitting one case across cores brings back reduction-order dependence | A single-threaded case has exactly one order of operations |

Determinism is what makes a ten-thousand-case campaign debuggable one case at a time. The next lesson turns to the campaign itself: where the speed really comes from, and why the answer is many cases at once, never one case split apart.

::: context seed-word Seeds in games and in simulations
Many video games build their worlds from a seed, so players can share a number and explore the very same map. The world-builder is a pseudo-random generator: everything that looks random is computed from that one starting value. Simulation engineers use the same idea for the opposite reason. A player wants surprise that can be shared; an engineer wants scatter that can be *repeated*. In both cases the seed is a tiny piece of information that stands in for millions of "random" choices.
:::

::: context monte-carlo Why it is named after a casino
Monte Carlo is a district of Monaco famous for its casino. In the 1940s, scientists working on nuclear physics at Los Alamos — Stanislaw Ulam, John von Neumann and Nicholas Metropolis among them — began solving hard problems by running many random trials on early computers and counting the outcomes. Metropolis suggested the code name, a nod to games of chance. The next module is built around this method: disperse everything uncertain, run thousands of cases, and read the statistics.
:::

::: context bits What "bit-exact" is counting
A computer stores every number as a pattern of bits — ones and zeros. A standard 64-bit floating-point number is 64 of them: 1 for the sign, 11 for the power of two, and 52 for the digits. "Bit-exact" means all 64 match. Two numbers that print as $998.5706494386$ can still differ in their last few bits, so comparing printed values is not enough. Compare the numbers themselves with `==`, or print their exact bits.
:::

::: context spawn-tree One seed branching into many streams
A `SeedSequence` mixes its input numbers into a well-scrambled internal state, and `spawn` hands out children that are designed not to overlap. So one campaign seed can feed one seed per case, and each case seed can feed one stream per model:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="29" font-size="12" text-anchor="middle" fill="#1f2a44">campaign seed</text>
  <line x1="180" y1="38" x2="80" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="38" x2="280" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="70" width="100" height="28" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">case 4216</text>
  <rect x="230" y="70" width="100" height="28" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">case 4217</text>
  <line x1="280" y1="98" x2="220" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="98" x2="280" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="98" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="196" y="130" width="48" height="26" rx="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="220" y="147" font-size="11" text-anchor="middle" fill="#1d6fd1">IMU</text>
  <rect x="256" y="130" width="48" height="26" rx="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="280" y="147" font-size="11" text-anchor="middle" fill="#1d6fd1">wind</text>
  <rect x="312" y="130" width="44" height="26" rx="5" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="334" y="147" font-size="11" text-anchor="middle" fill="#1d6fd1">IC</text>
  <text x="80" y="125" font-size="11" text-anchor="middle" fill="#6c7a93">its own three streams</text>
</svg>
```

Each box depends only on the boxes above it, never on its neighbors.
:::

::: context hex-float Printing a number's exact bits
`float.hex()` writes a number in base 16 with its power of two: `0x1.b58a1f1f07674p+12` means $1.b58a1f1f07674_{16} \times 2^{12}$. The thirteen hex digits after the point are exactly the 52 stored digit bits (four bits per hex digit), so nothing is rounded for display. Ordinary printing rounds to a short decimal that is enough to rebuild the number, but it hides nothing only if you trust that rule. Hex hides nothing by construction, which is why it is handy when you are checking replay.
:::

::: context hash-map Why a hash map has no fixed order
A **hash map** (Python's `dict` is one; `set` is its keys-only cousin) finds items fast by turning each key into a number called a **hash** and using that number to pick a storage slot. Looping over a set visits the slots in storage order, which depends on the hashes. Python salts string hashes with a random value each time it starts, to protect web servers from attackers who craft keys that collide. So the loop order of a set of strings can change from one run to the next. Python's `dict` does keep insertion order, but `set` makes no such promise.
:::

::: context floating-point Floating point: a ruler with uneven marks
A floating-point number keeps about 16 significant decimal digits, wherever the decimal point sits. So the gaps between the numbers a computer can store grow as the numbers grow. Near $1$ the gap is about $2 \times 10^{-16}$. Near $10^{16}$ it is $2$ — which is why adding $1$ there disappears.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="45" x2="340" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="20" y1="37" x2="20" y2="53"/><line x1="30" y1="37" x2="30" y2="53"/><line x1="40" y1="37" x2="40" y2="53"/><line x1="50" y1="37" x2="50" y2="53"/>
    <line x1="60" y1="37" x2="60" y2="53"/><line x1="80" y1="37" x2="80" y2="53"/><line x1="100" y1="37" x2="100" y2="53"/><line x1="120" y1="37" x2="120" y2="53"/>
    <line x1="140" y1="37" x2="140" y2="53"/><line x1="180" y1="37" x2="180" y2="53"/><line x1="220" y1="37" x2="220" y2="53"/><line x1="260" y1="37" x2="260" y2="53"/>
    <line x1="300" y1="37" x2="300" y2="53"/>
  </g>
  <text x="40" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">small: fine marks</text>
  <text x="280" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">large: wide gaps</text>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">each doubling of size doubles the gap</text>
</svg>
```

Every result lands on the nearest mark. Which mark depends on the order you did things in.
:::

::: context cores-and-threads Cores, threads and who goes first
A **core** is one worker inside a processor that can run instructions on its own; a modern laptop chip has several, and a server may have dozens. A **thread** is one line of work the program hands to a core. When several threads run at once, the operating system decides from moment to moment which runs where, based on everything else the machine is doing. That is why "which thread finishes first" is not something your program controls — and why any result that depends on it cannot be replayed.
:::

::: context compounding How a tiny difference grows
Many systems this module simulates are sensitive to tiny changes: a tumbling body's spin, a trajectory steered by a controller reacting to its own past errors. A difference of one part in $10^{12}$ that doubles every so often reaches one part in a thousand after about $30$ doublings, since $2^{30} \approx 1.07 \times 10^{9}$. That is the "butterfly effect" in miniature. On a scale where each step up is ten times bigger, steady doubling is a straight line — every ten doublings climbs about three steps, since $2^{10} = 1024$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="60" y1="20" x2="330" y2="20"/><line x1="60" y1="53.3" x2="330" y2="53.3"/><line x1="60" y1="86.7" x2="330" y2="86.7"/>
  </g>
  <line x1="60" y1="120" x2="330" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="125" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="120" x2="330" y2="20" stroke="#b4232c" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="124">10⁻¹²</text><text x="55" y="91">10⁻⁹</text><text x="55" y="57">10⁻⁶</text><text x="55" y="24">10⁻³</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="136">0</text><text x="150" y="136">10</text><text x="240" y="136">20</text><text x="330" y="136">30</text>
  </g>
  <text x="195" y="148" font-size="11" text-anchor="middle" fill="#6c7a93">number of doublings</text>
</svg>
```

Whether a given simulation grows differences this fast or not, bit-exact replay avoids having to ask.
:::
