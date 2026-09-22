---
id: l17-performance-and-parallelism
title: Performance and parallelism
minutes: 19
covers:
  - "Performance: vectorisation, parallelism over cases rather than within a case, and why Monte Carlo runs on a cluster"
---

The previous lesson's determinism requirements were not incidental to this one — they exist because of where this lesson puts the speed. A dispersion campaign needs thousands of cases, and there are exactly two honest ways to make that fast: make each case's own arithmetic cheaper, or run many cases at once. This lesson takes both in turn, and is specific about why only the second one is where the parallelism belongs.

## Vectorisation: the same answer, computed in bulk

Vectorisation replaces a Python-level loop over individual values with a single call that operates on a whole array at once, in code (typically C) that never pays Python's per-iteration interpreter overhead. It changes nothing about *what* is computed — the same formula, the same floating-point operations, the same answer to round-off — only how many times the interpreter has to get involved.

::: example The same gravity model, one point at a time versus all at once
Evaluate this module's $J_2$ gravity correction at $200{,}000$ independent points, once with an ordinary Python loop and once as a single vectorised numpy expression:

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

(A wall-clock measurement — expect a different exact multiple on another machine or run; the direction and rough size of the speedup is the point.)

Thirty-two times faster, agreeing with the loop to round-off. This is free performance in the sense that it costs nothing in physical fidelity or determinism — a vectorised expression has one fixed, reproducible order of operations, exactly the property the previous lesson insisted on. It applies wherever a computation naturally batches — precomputing an atmosphere or aerodynamic lookup table, evaluating several sensor channels at once, building a table for later interpolation — but it does not, by itself, solve the problem this lesson is really about: a single trajectory's time steps are a strict sequence, each one needing the previous step's result, and there is no batch of independent values to vectorise across within *one* case's own time march.
:::

## Where the real speed for a campaign comes from

A Monte Carlo campaign's cost is (time per case) $\times$ (number of cases), and vectorisation only ever attacks the first factor, and only in the parts of it that are not an inherently sequential recurrence. The second factor is where a campaign's real cost lives, and it has a structural property vectorisation does not: every case is completely independent of every other one — different draws from each model's seeded stream, no shared state, no case's result feeding into another's. That independence is exactly what "embarrassingly parallel" means, and it is what lets a campaign scale by running more cases at once rather than by making any single case cleverer.

::: example What ten thousand cases actually costs, and what changes it
This module's own (deliberately simplified) physics bundle, run for one full burn's worth of fine steps:

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

(The measured per-case time is a wall-clock figure and will differ on another machine; the illustrative $2\,\mathrm{s}$/case figure and everything derived from it is a labelled assumption, not a measurement.)

Even this module's simplified physics takes on the order of half an hour for ten thousand cases run one after another. A real case — the actual flight binary from the flight-software-in-the-loop boundary, a finer step to resolve real structural modes, full telemetry logging — costs more, illustratively a couple of seconds rather than a fraction of one, and at that cost a ten-thousand-case campaign is $5.56$ hours sequentially, $41.7$ minutes on eight cores, and under three minutes on $128$. Because the cases share nothing, this scaling is limited only by how many cores you can point at the problem simultaneously — which is precisely why a serious campaign runs on a cluster rather than a workstation: the arithmetic of embarrassingly parallel work turns "rent more cores" directly into "wait less time," in a way that no amount of cleverness inside a single case's code can match.
:::

The previous lesson's insistence that each case stay single-threaded is what makes this scaling actually deliver what the arithmetic promises. A shared, contended resource — cores fighting over the same physical hardware, a case's internal computation itself split across threads — degrades the clean (time per case) / (cores available) relationship the table above assumes, for exactly the reduction-order reasons that lesson demonstrated. A cluster allocation gives each case its own dedicated core with nothing else competing for it; a single workstation running many things at once does not, and the achieved speedup falls short of the arithmetic for reasons that have nothing to do with the simulation's own design.

::: key Where the parallelism goes
Vectorise within a case wherever a computation is naturally a batch of independent evaluations — it is free performance that changes nothing about the answer or its reproducibility. Parallelise a campaign across cases, never by splitting one case's arithmetic across cores: each case is an independent, deterministic, single-threaded run, which is what keeps bit-exact replay possible and what lets the campaign's wall-clock time scale down linearly with however many cores you can rent, exactly as the arithmetic predicts when nothing is contending for those cores.
:::

::: warning Expecting linear scaling on shared or contended hardware
The clean (cases $\times$ time-per-case) $/$ (cores) arithmetic assumes each core is genuinely dedicated to one case at a time. Run the same workload on hardware shared with other processes, or on a machine with fewer physically independent execution units than its reported core count suggests, and the achieved speedup falls well short of that arithmetic — not because the case-parallel strategy is wrong, but because the resource it depends on (uncontended cores) was not actually available. This is a reason to secure a dedicated allocation for a real campaign, not a reason to distrust the scaling argument itself.
:::

::: warning Reaching for vectorisation to solve a campaign's wall-clock problem
Vectorising a single case's internal arithmetic can shave milliseconds off that one case's runtime, but a campaign's total cost is dominated by the number of cases, not by how many microseconds each one saves internally — the campaign-scaling example above turned a multi-hour sequential run into minutes by adding cores, a change vectorisation inside one case cannot reach. Optimise the inner loop because it is free and it helps every case a little; solve the campaign's wall-clock time by adding cores across cases, because that is where the actual leverage is.
:::

## Check yourself

::: check
Why does vectorising a computation change its speed but not its answer or its determinism properties?
:::

::: answer
A vectorised expression performs the same floating-point operations, in a fixed, well-defined order determined by the array library's implementation, whether called once or a million times — it removes Python's per-iteration interpreter overhead, not any part of the actual arithmetic. The worked example's loop and vectorised versions agreed to round-off ($3.5\times10^{-18}$), confirming vectorisation is a performance change with no numerical consequence, unlike the reduction-order differences the determinism lesson demonstrated for genuinely different summation strategies.
:::

::: check
Why can a single case's time-stepping not be vectorised the same way the $J_2$ gravity evaluation was, even though both are numerical computations?
:::

::: answer
The $J_2$ example evaluated the same formula at $200{,}000$ independent points with no relationship between them, which is exactly what vectorisation batches efficiently. A single case's time steps are a strict recurrence — step $k+1$ needs the result of step $k$ — so there is no independent batch to evaluate at once; each step must wait for the one before it, regardless of how fast any individual step's arithmetic runs.
:::

::: check
The campaign-scaling example showed $39.2$ minutes for a sequential ten-thousand-case run using this module's simplified physics, but used an illustrative $2\,\mathrm{s}$ per case, not a measurement, for the "realistic" table further down. Why is that distinction worth stating explicitly rather than presenting both numbers the same way?
:::

::: answer
The $39.2$-minute figure came from actually timing this lesson's simplified physics bundle running the real number of fine steps in a burn, so it is a measurement. No real flight binary was run here to produce a "true" per-case cost for an actual vehicle simulation, so the $2\,\mathrm{s}$ figure is an assumption chosen to be illustrative of a more realistic workload, not a result — conflating the two would misrepresent an assumption as evidence, which is exactly the kind of unverified claim this module has avoided throughout.
:::

::: check
Why does the previous lesson's requirement that each case stay single-threaded matter for *performance*, not only for determinism?
:::

::: answer
The campaign's scaling arithmetic — wall-clock time falling in direct proportion to the number of cores used — depends on every core doing independent, uncontended work. Splitting one case's arithmetic across threads reintroduces contention and coordination overhead inside that case, which both breaks bit-exact reduction order (the determinism concern) and prevents the clean linear scaling the case-level parallelism strategy is supposed to deliver, so the same design choice serves both goals at once rather than trading one off against the other.
:::

::: check
A team observes only a $2\times$ speedup from $1$ to $4$ cores on a real campaign, well short of the $4\times$ the case-independence argument predicts. List two explanations consistent with this lesson, and one that is not.
:::

::: answer
Consistent: the hardware is shared with other processes or virtualised in a way that does not actually provide four independent execution units, so some cases are waiting for a core rather than running concurrently; or the campaign's per-case work was not actually kept single-threaded, so cases are contending with each other for the same physical resources from the inside as well as the outside. Not consistent with this lesson's argument: blaming the case-parallel strategy itself as fundamentally limited, since the whole premise established here is that cases share nothing and should scale linearly on genuinely dedicated cores — a shortfall points at the hardware allocation, not at case-level parallelism being the wrong approach.
:::

::: check
Why is "vectorise the inner loop" and "parallelise across cases" described as complementary rather than as two competing ways to get the same speedup?
:::

::: answer
They act on different factors of the same product: vectorisation reduces the time each individual case takes wherever its computation batches naturally, while case-level parallelism reduces how many of those per-case times have to happen one after another. A campaign gets the benefit of both at once — every worker running a case still benefits from that case's own vectorised inner operations, and the campaign as a whole still benefits from running many such workers simultaneously — rather than having to choose one optimisation over the other.
:::

## Summary

| Technique | Acts on | What it changes | Measured evidence |
| --- | --- | --- | --- |
| Vectorisation | A batch of independent evaluations within (or across) cases | Speed only — same answer, same deterministic order | $32.4\times$ speedup, agreement to $3.5\times10^{-18}$ |
| Case-level parallelism | The number of cases run concurrently | Campaign wall-clock time, roughly linearly in dedicated cores | $10{,}000$ cases: $5.56\,\mathrm{h}$ sequential $\to 2.6\,\mathrm{min}$ at $128$ cores (illustrative per-case cost) |
| Why not parallelise within a case | Time-stepping is a strict recurrence | No independent batch exists to split across cores | — |
| Requirement for the scaling to hold | Dedicated, uncontended cores; single-threaded cases | Matches the linear-scaling arithmetic | Shared/contended hardware falls short, for reasons outside the strategy itself |

Performance turns a campaign that would take days into one that takes minutes. The final lesson in this module turns to keeping all of this — the models, the parameters, the scenarios — under control as it changes, versioned separately from the code that runs it.
