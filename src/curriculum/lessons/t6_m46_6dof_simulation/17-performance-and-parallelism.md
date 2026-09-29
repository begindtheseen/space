---
id: l17-performance-and-parallelism
title: Performance and parallelism
minutes: 19
covers:
  - "Performance: vectorization, parallelism over cases rather than within a case, and why Monte Carlo runs on a cluster"
---

Imagine a bakery that has to make ten thousand cakes by Saturday. There are only two honest ways to go faster. You can make each cake quicker — for example, by mixing a whole tray of batter at once instead of one bowl at a time. Or you can make many cakes at the same time, by buying more ovens.

Notice what you *cannot* do. You cannot bake one cake faster by putting it in four ovens at once. A cake is a sequence: mix, then bake, then cool, then frost. Each step needs the step before it to be done.

A Monte Carlo campaign is that bakery. It needs thousands of simulated flights — thousands of **cases** — and every one of them is a sequence of time steps. This lesson looks at both ways of going faster. The first is **vectorization**: doing the same sum on a whole batch of numbers in one go. The second is **parallelism**: running many cases at once on many processor cores. It explains why the parallelism belongs *between* cases and never *inside* one, which is exactly the choice the previous lesson made for reproducibility. And it shows why serious campaigns run on a **cluster** — many computers working together — rather than on one desk.

## Vectorization: a whole tray at once

Python is pleasant to write but slow in one particular way. It runs your program through an **[[interpreter|interpreter]]**, which reads and checks each line every single time the line runs. In a loop over two hundred thousand numbers, that checking happens two hundred thousand times, and it costs far more than the arithmetic itself.

Vectorization gets around this. Instead of looping over values one at a time, you hand the whole array to a single library call — in NumPy, an expression like `np.sqrt(x*x + y*y)` on arrays `x` and `y`. The library runs its own loop in fast compiled code, written in C, so the interpreter gets involved once instead of two hundred thousand times.

The formula does not change. The arithmetic does not change. Only the overhead around it does.

::: example The same gravity model, one point at a time versus all at once
Evaluate this module's **[[J₂ gravity|j2]]** correction — the x-component of gravity including Earth's flattening — at $200{,}000$ independent points. Do it once with an ordinary Python loop and once as a single vectorized NumPy expression, and time both.

```python
import time
import numpy as np

mu, RE, J2 = 398600.4418, 6378.137, 1.08262668e-3

def gravity_j2_scalar(x, y, z):
    r = (x*x + y*y + z*z)**0.5
    factor = -1.5*J2*mu*RE**2/r**5
    zr2 = (z/r)**2
    ax = -mu*x/r**3 + factor*x*(1-5*zr2)
    return ax

def gravity_j2_vec(x, y, z):
    r = np.sqrt(x*x + y*y + z*z)
    factor = -1.5*J2*mu*RE**2/r**5
    zr2 = (z/r)**2
    return -mu*x/r**3 + factor*x*(1-5*zr2)

n = 200000
rng = np.random.default_rng(0)
xs = rng.uniform(6578, 42164, n)
ys = rng.uniform(-1000, 1000, n)
zs = rng.uniform(-1000, 1000, n)

t0 = time.perf_counter()
out_loop = np.array([gravity_j2_scalar(xs[i], ys[i], zs[i]) for i in range(n)])
t_loop = time.perf_counter() - t0

t0 = time.perf_counter()
out_vec = gravity_j2_vec(xs, ys, zs)
t_vec = time.perf_counter() - t0

print(f"Python loop:      {t_loop:.4f} s")
print(f"vectorised numpy: {t_vec:.4f} s")
print(f"speedup: {t_loop/t_vec:.1f}x")
print("max abs diff:", np.max(np.abs(out_loop - out_vec)))
# Python loop:      0.2821 s
# vectorised numpy: 0.0087 s
# speedup: 32.4x
# max abs diff: 3.469446951953614e-18
```

(The times are **[[wall-clock|wall-clock-timing]]** measurements. Expect a different exact multiple on another machine or another run; the direction and rough size of the speedup is the point.)

**Speed.** $0.2821 / 0.0087 \approx 32$: the vectorized version is about thirty times faster.

**Answer.** The two agree to $3.5 \times 10^{-18}\,\mathrm{km/s^2}$. The accelerations themselves are around $10^{-4}$ to $10^{-2}\,\mathrm{km/s^2}$, so this is a disagreement in the very last bit or two of some results — nothing physical.
:::

Why do they differ at all, if the formula is the same? Because the loop and the vectorized code call *different routines* for some operations. `**` on a single number and `**` on a whole array are separate pieces of code, and for powers like $r^5$ they can round the last bit differently. The loop also takes a square root as `**0.5` where the vectorized version calls `np.sqrt`, another place the last bit can differ. So vectorization is not a way to get the loop's *exact* bits. What it does guarantee is repeatability: the same vectorized code, on the same library and machine, gives the same bits every time. Switching a model from loop to vectorized form is a change you make once, like any code change, and the golden files may move by a last bit when you do.

::: warning A different vectorization path is a different order
A vectorized *reduction* — `np.sum`, a dot product, a norm — adds many numbers into one. How the library groups those additions can depend on the library version and on which **SIMD** instructions the processor offers. As the previous lesson showed, a different grouping gives a different last digit. Pin the library version for a campaign, and treat an upgrade like a code change: rerun the golden files and explain the diffs.
:::

Vectorization is cheap performance. It pays off wherever a computation is naturally a batch of independent values: building an atmosphere or aerodynamic lookup table, evaluating several sensor channels at once, filling a table for later interpolation.

But it cannot touch the heart of a single case. A trajectory is a strict sequence. Step $k+1$ needs the answer from step $k$. There is no batch of independent values to vectorize *across* inside one case's march through time — just like the cake.

## Where a campaign's real speed comes from

Write the cost of a campaign as a product:

$$
T_{\text{campaign}} = N \times t_{\text{case}}.
$$

Read it as "campaign time equals number of cases times time per case". Vectorization attacks $t_{\text{case}}$, and only in the parts of a case that are not a strict sequence. But $N$ is where the size lives — thousands of cases — and it has a property vectorization does not. Every case is completely independent of every other. Each has its own seed and its own random streams, shares no state, and never feeds its result into another case.

Work that splits into fully independent pieces like this is called **[[embarrassingly parallel|embarrassingly-parallel]]**. With $n$ cores each running one case at a time, the campaign time becomes

$$
T_{\text{campaign}} \approx \frac{N \times t_{\text{case}}}{n_{\text{cores}}}.
$$

Double the cores, halve the wait. That is **linear scaling**.

::: example What ten thousand cases actually cost, and what changes it
This module's own deliberately simplified physics — Euler's equations for a spinning body, stepped with RK4 — run for one full burn's worth of fine steps. The code times one case, then works out what campaigns would cost.

```python
import time
import numpy as np

I3 = np.array([1200.0, 1500.0, 2000.0])
def euler_deriv(w, M):
    return np.array([((I3[1]-I3[2])*w[1]*w[2]+M[0])/I3[0], ((I3[2]-I3[0])*w[2]*w[0]+M[1])/I3[1],
                      ((I3[0]-I3[1])*w[0]*w[1]+M[2])/I3[2]])

def rk4(w, dt):
    k1 = euler_deriv(w, np.zeros(3)); k2 = euler_deriv(w+0.5*dt*k1, np.zeros(3))
    k3 = euler_deriv(w+0.5*dt*k2, np.zeros(3)); k4 = euler_deriv(w+dt*k3, np.zeros(3))
    return w + dt/6*(k1+2*k2+2*k3+k4)

t_burn, dt_plant = 98.0665, 0.01
n_steps = int(round(t_burn/dt_plant))

w = np.array([0.02, 0.0, 0.10])
t0 = time.perf_counter()
for _ in range(n_steps):
    w = rk4(w, dt_plant)
t_per_case = time.perf_counter() - t0
print(f"measured time for one case's {n_steps} fine steps: {t_per_case*1000:.1f} ms")

n_campaign = 10000
print(f"sequential {n_campaign}-case campaign at this measured cost: {t_per_case*n_campaign/60:.1f} min")

t_realistic = 2.0   # s -- illustrative: real flight code, finer step, full telemetry logging
print(f"\nat an illustrative {t_realistic} s/case (real flight code, not this module's toy physics):")
print(f"  sequential: {t_realistic*n_campaign/3600:.2f} hours")
for n_cores in [1, 8, 32, 128]:
    print(f"  {n_cores:4d} cores: {t_realistic*n_campaign/n_cores/60:.1f} min")
# measured time for one case's 9807 fine steps: 234.9 ms
# sequential 10000-case campaign at this measured cost: 39.2 min
#
# at an illustrative 2.0 s/case (real flight code, not this module's toy physics):
#   sequential: 5.56 hours
#      1 cores: 333.3 min
#      8 cores: 41.7 min
#     32 cores: 10.4 min
#    128 cores: 2.6 min
```

Two kinds of number appear here, and it matters which is which.

**Measured.** One case took $234.9\,\mathrm{ms}$ for $9{,}807$ steps. That is about $24\,\mu\mathrm{s}$ per step ($\mu\mathrm{s}$, a microsecond, is a millionth of a second). Ten thousand such cases, one after another: $10{,}000 \times 0.2349\,\mathrm{s} \approx 2{,}349\,\mathrm{s} \approx 39.2$ minutes. This is a wall-clock figure and will differ on your machine.

**Assumed.** A real case costs more: the actual flight code from the flight-software-in-the-loop lesson, a finer step to resolve real structural modes, full telemetry logging. The $2\,\mathrm{s}$ per case is a labeled *assumption* for illustration, not a measurement. Using it:

- sequential: $10{,}000 \times 2\,\mathrm{s} = 20{,}000\,\mathrm{s} \approx 5.56$ hours;
- $8$ cores: $20{,}000 / 8 = 2{,}500\,\mathrm{s} \approx 41.7$ minutes;
- $32$ cores: $625\,\mathrm{s} \approx 10.4$ minutes;
- $128$ cores: about $156\,\mathrm{s} \approx 2.6$ minutes.

Sanity check: $128$ cores should be $128$ times faster than one, and $333.3 / 128 \approx 2.6$. It is.
:::

Because the cases share nothing, that scaling is limited only by how many cores you can point at the problem. That is why a serious campaign runs on a cluster — a room of networked computers with a **[[job scheduler|job-scheduler]]** handing out cases — rather than a workstation. With embarrassingly parallel work, "rent more cores" turns straight into "wait less time", in a way no cleverness inside one case's code can match.

::: key Where the parallelism goes in a Monte Carlo
Across cases, not within a case. Each case is an independent deterministic run of a single-threaded sim, which keeps bit-exact replay possible and scales linearly to as many cores as you can rent.
:::

## Why not split one case across cores?

Three reasons, and each one alone would be enough.

**It breaks replay.** Splitting one case's arithmetic across threads brings back the reduction-order problem from the previous lesson. The same case and seed can give different bits depending on which thread finished first.

**It barely helps.** One RK4 step of this module's physics took about $24\,\mu\mathrm{s}$. Handing part of that to another core and waiting for the answer back has its own cost, and for work this small the handoff can take about as long as the work. The steps still have to happen one after another, so the most you can split is the inside of each tiny step.

**It spoils the scaling.** The formula $N \, t_{\text{case}} / n_{\text{cores}}$ assumes every core is busy with its own case and nothing is fighting over shared hardware. A case that uses several threads competes with its neighbors for cores, memory and caches, so the campaign as a whole falls short of the arithmetic.

So the previous lesson's rule — each case single-threaded — is what makes the scaling deliver what the formula promises. A cluster allocation gives each case its own dedicated core with nothing else competing for it. One workstation running many other things at once does not, and the speedup falls short for reasons that have nothing to do with the simulation's design.

::: warning Expecting linear scaling on shared or contended hardware
The clean formula (cases × time per case) ÷ cores assumes each core is truly dedicated to one case at a time. Run the same work on hardware shared with other programs, or on a machine that reports more cores than it has physically separate ones (a trick called **[[hyper-threading|hyperthreading]]**), and the achieved speedup falls well short. That is not because running cases in parallel is the wrong strategy. It is because the resource the strategy needs — uncontended cores — was not really there. It is a reason to get a dedicated allocation for a real campaign, not a reason to distrust the scaling argument.
:::

::: warning Reaching for vectorization to fix a campaign's wall-clock time
Vectorizing a case's inner arithmetic can shave milliseconds off that one case. But the campaign's total is dominated by the number of cases. The campaign example went from hours to minutes by adding cores, a change that vectorization inside one case cannot reach. Optimize the inner loop because it is cheap and helps every case a little. Fix the campaign's wall-clock time by adding cores across cases, because that is where the leverage is.
:::

The two tools are not rivals. They act on different factors of the same product: vectorization shrinks $t_{\text{case}}$, and parallelism across cases shrinks how many of those times you wait through one after another. Use both.

## Check yourself

::: check
Vectorizing the $J_2$ gravity model made it about thirty times faster, and the answers agreed with the loop to $3.5 \times 10^{-18}$. What does vectorization change, what does it not change, and why was the agreement not perfect?
:::

::: answer
It changes the overhead: the interpreter is involved once for the whole array instead of once per value, so the same work runs much faster in compiled code.

It does not change the formula, and it keeps determinism: the same vectorized code on the same library and machine gives the same bits every run.

The agreement was not bit-for-bit because the loop and NumPy use different routines for some operations, such as $r^5$, which can round the last bit differently. $3.5 \times 10^{-18}$ against values of $10^{-4}$ or more is a last-bit difference, with no physical meaning. Switching paths is therefore a one-time code change, like any other, and may move golden files by a last bit.
:::

::: check
Why can a single case's time-stepping not be vectorized the way the $J_2$ evaluation was, even though both are numerical computations?
:::

::: answer
The $J_2$ example evaluated one formula at $200{,}000$ points that had nothing to do with each other. That is exactly the kind of batch vectorization handles well.

A case's time steps are a strict sequence: step $k+1$ needs the result of step $k$. There is no batch of independent values to process together. Each step must wait for the one before it, however fast each step's own arithmetic runs.
:::

::: check
The campaign example reported $39.2$ minutes for a sequential ten-thousand-case run of this module's simplified physics, but used $2\,\mathrm{s}$ per case for the "realistic" table. Why is it worth saying plainly that these are different kinds of number?
:::

::: answer
The $39.2$ minutes came from actually timing the simplified physics running the real number of steps in a burn. It is a measurement.

No real flight code was run here, so the $2\,\mathrm{s}$ per case is an assumption chosen to illustrate a heavier workload. It is not a result. Presenting both the same way would pass off an assumption as evidence — exactly the kind of unverified claim a simulation engineer must never make.
:::

::: check
Why does the previous lesson's rule that each case stays single-threaded matter for *speed*, not only for determinism?
:::

::: answer
The scaling formula — campaign time falling in step with the number of cores — assumes every core is doing independent work with nothing fighting over it. Splitting one case's arithmetic across threads adds handoff costs and makes cases compete for the same cores and memory. That both breaks the fixed reduction order (the determinism problem) and stops the campaign from scaling cleanly (the speed problem). One design choice serves both goals.
:::

::: check
A team sees only a $2\times$ speedup going from $1$ to $4$ cores on a real campaign, well short of the $4\times$ the case-independence argument predicts. Give two explanations consistent with this lesson, and one that is not.
:::

::: answer
Consistent:

- The hardware is shared with other programs, or is a virtual machine or hyper-threaded chip that does not really give four independent cores. Some cases are waiting for a core instead of running.
- The cases were not kept single-threaded, so they compete with each other for the same cores and memory from the inside.

Not consistent: "running cases in parallel is fundamentally limited." Cases share nothing and should scale linearly on truly dedicated cores. A shortfall points at the hardware allocation or at how the cases were run, not at the case-parallel strategy.
:::

::: check
Why are "vectorize the inner loop" and "run cases in parallel" described as working together rather than as two competing ways to get the same speedup?
:::

::: answer
They shrink different factors of the same product $N \times t_{\text{case}}$. Vectorization cuts $t_{\text{case}}$ wherever a case's work comes in natural batches. Parallelism across cases cuts how many of those case times happen one after another. A campaign gets both at once: every core running a case still enjoys that case's vectorized pieces, and the campaign as a whole still enjoys running many cores together.
:::

## Summary

| Idea | What it acts on | What it changes | Evidence here |
| --- | --- | --- | --- |
| Vectorization | A batch of independent values, inside or across cases | Speed only; repeatable, but may differ from a loop in the last bit | About $32\times$ faster, agreeing to $3.5 \times 10^{-18}$ |
| Campaign cost | $T \approx N\,t_{\text{case}}/n_{\text{cores}}$ | Wall-clock time falls linearly with dedicated cores | $10{,}000$ cases: $5.56\,\mathrm{h}$ on one core, $2.6\,\mathrm{min}$ on $128$ (assumed $2\,\mathrm{s}$ per case) |
| Parallelism across cases | How many cases run at once | Keeps each case single-threaded and replayable | Cases share nothing: embarrassingly parallel |
| Not within a case | Time steps are a strict sequence | Splitting a case breaks replay and adds handoff costs | One step is only about $24\,\mu\mathrm{s}$ |
| Condition for linear scaling | Dedicated, uncontended cores | Shared or hyper-threaded hardware falls short | Why campaigns run on a cluster |

Speed turns a campaign that would take days into one that takes minutes. The final lesson turns to keeping all of it under control as it changes — the models, the parameters, the scenarios — versioned separately from the code that runs them.

::: context interpreter What the interpreter is doing all that time
C code is translated into machine instructions once, before it runs. Python is not: the **interpreter** reads each line as it runs. For `x*x` it must look up what `x` is, check its type, find the right multiply for that type, make a new object for the answer, and tidy up the old one. The multiply itself is one quick instruction; the checking around it is dozens. A NumPy call does that checking once for the whole array, then runs a tight compiled loop — which is where the thirty-fold speedup comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44">Python loop</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="100" y="10" width="24" height="18" fill="#f2b880"/><rect x="124" y="10" width="6" height="18" fill="#1d6fd1"/>
    <rect x="130" y="10" width="24" height="18" fill="#f2b880"/><rect x="154" y="10" width="6" height="18" fill="#1d6fd1"/>
    <rect x="160" y="10" width="24" height="18" fill="#f2b880"/><rect x="184" y="10" width="6" height="18" fill="#1d6fd1"/>
    <rect x="190" y="10" width="24" height="18" fill="#f2b880"/><rect x="214" y="10" width="6" height="18" fill="#1d6fd1"/>
    <rect x="220" y="10" width="24" height="18" fill="#f2b880"/><rect x="244" y="10" width="6" height="18" fill="#1d6fd1"/>
    <rect x="250" y="10" width="24" height="18" fill="#f2b880"/><rect x="274" y="10" width="6" height="18" fill="#1d6fd1"/>
  </g>
  <text x="10" y="62" font-size="12" fill="#1f2a44">vectorized</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="100" y="50" width="24" height="18" fill="#f2b880"/><rect x="124" y="50" width="36" height="18" fill="#1d6fd1"/>
  </g>
  <rect x="100" y="92" width="14" height="12" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="102" font-size="11" fill="#1f2a44">checking and bookkeeping</text>
  <rect x="270" y="92" width="14" height="12" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="290" y="102" font-size="11" fill="#1f2a44">arithmetic</text>
</svg>
```

Same six sums of arithmetic (blue) in both rows; the loop pays for the checking six times.
:::

::: context j2 A reminder: what J₂ is
Earth is not a perfect ball. Spinning makes it bulge at the equator — its equatorial radius, about $6378\,\mathrm{km}$, is about $21\,\mathrm{km}$ more than its polar radius. $J_2 \approx 1.083 \times 10^{-3}$ measures the size of that bulge in the gravity field, and it is by far the biggest correction to plain inverse-square gravity. The environment-models lesson used it; here it only serves as a realistic formula to time.
:::

::: context wall-clock-timing Measuring time honestly
`time.perf_counter()` reads a high-resolution clock, so the difference between two readings is the real elapsed time — "wall-clock" time, as if you had timed it with the clock on the wall. It includes everything the computer was doing meanwhile, so the same code timed twice gives slightly different results. That is fine for *measuring* speed, and it is exactly why wall-clock time must never feed *into* a simulation's results, as the previous lesson warned.
:::

::: context embarrassingly-parallel An embarrassment of riches
The phrase is computer-science slang. It means a problem so easy to split that it is almost embarrassing to call it parallel programming: no piece needs to talk to any other piece until the end. Rendering the frames of an animated film, testing passwords, and Monte Carlo cases are classic examples. The opposite is a problem whose pieces must constantly swap results — like the time steps of one simulation, where every step waits for the last.
:::

::: context job-scheduler How a cluster hands out cases
A cluster is a set of computers, called **nodes**, joined by a fast network and shared by many users. You do not log into a node and run your campaign by hand. You submit a job — "run cases 0 to 9,999, one core each" — to a **scheduler** such as Slurm, which is common on university and lab clusters. It finds free cores, starts cases on them, and starts the next case as each one finishes. Cloud providers rent the same thing by the hour, which is what "as many cores as you can rent" means.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="10" y="27">core 1</text><text x="10" y="52">core 2</text><text x="10" y="77">core 3</text><text x="10" y="102">core 4</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" font-size="11" text-anchor="middle">
    <rect x="60" y="14" width="70" height="20" fill="#8fb8f0"/><rect x="130" y="14" width="70" height="20" fill="#8fb8f0"/><rect x="200" y="14" width="70" height="20" fill="#8fb8f0"/>
    <rect x="60" y="39" width="70" height="20" fill="#8fb8f0"/><rect x="130" y="39" width="70" height="20" fill="#8fb8f0"/><rect x="200" y="39" width="70" height="20" fill="#8fb8f0"/>
    <rect x="60" y="64" width="70" height="20" fill="#8fb8f0"/><rect x="130" y="64" width="70" height="20" fill="#8fb8f0"/><rect x="200" y="64" width="70" height="20" fill="#8fb8f0"/>
    <rect x="60" y="89" width="70" height="20" fill="#8fb8f0"/><rect x="130" y="89" width="70" height="20" fill="#8fb8f0"/><rect x="200" y="89" width="70" height="20" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="95" y="28">case 0</text><text x="165" y="28">case 4</text><text x="235" y="28">case 8</text>
    <text x="95" y="53">case 1</text><text x="165" y="53">case 5</text><text x="235" y="53">case 9</text>
    <text x="95" y="78">case 2</text><text x="165" y="78">case 6</text><text x="235" y="78">case 10</text>
    <text x="95" y="103">case 3</text><text x="165" y="103">case 7</text><text x="235" y="103">case 11</text>
  </g>
  <line x1="60" y1="118" x2="340" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="129" font-size="11" text-anchor="end" fill="#6c7a93">time →</text>
</svg>
```

Twelve equal cases on four cores take three case-lengths of time instead of twelve: $12/4 = 3$.
:::

::: context hyperthreading When eight cores are really four
Many processors let each physical core run two threads at once, filling gaps when one thread is waiting for memory. Intel calls this **Hyper-Threading**; the general name is simultaneous multithreading. The operating system then reports twice as many "cores" as there really are. For a campaign whose cases keep a core fully busy with arithmetic, the second thread on each core adds much less than a whole core's worth of speed. So a "4-core" virtual machine may give well under $4\times$ — which is one honest reason a team sees disappointing scaling.
:::
