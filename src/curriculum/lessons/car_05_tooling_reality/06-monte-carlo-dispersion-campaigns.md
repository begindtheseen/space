---
id: l06-monte-carlo-dispersion-campaigns
title: "Monte Carlo dispersion campaigns: what they actually prove"
minutes: 18
covers:
  - Monte Carlo dispersion campaigns across tens of thousands of CPUs and what they are used to prove
---

The previous lesson was about one thing failing outright — a sensor, a computer — and how the system is designed to notice and recover. This lesson is about a different, and in some ways harder, kind of uncertainty: nothing fails, but everything is a little off. The propellant load is not exactly the number on the spec sheet. The atmosphere on flight day is not exactly the standard model. Every sensor has some real, nonzero noise and bias. None of these, alone, breaks anything. Together, in some unlucky combination, they might. A Monte Carlo dispersion campaign exists to find out how often, and by how much, and it is one of the most direct pieces of evidence this field has for the question "does this vehicle actually meet its requirements."

## Why the nominal case is not evidence

A "nominal" simulation run uses the expected, textbook value for every uncertain quantity at once: the spec-sheet mass, the standard atmosphere, zero sensor noise, a perfectly centered thrust vector. Running that case and getting a good result proves something real — the vehicle can work, under the specific assumption that every uncertain quantity happens to land exactly on its expected value simultaneously. It says nothing about whether the vehicle works when those quantities take on the realistic range of values they can actually take, individually and in combination, which is the situation every real flight is actually in.

A dispersion campaign answers the harder, more honest question directly: draw each uncertain quantity from a distribution that represents its real uncertainty — not an arbitrary guess, but a distribution built from manufacturing tolerances, test data, or engineering judgment about how well a quantity is actually known — sample many independent combinations of all of them at once, run the full high-fidelity simulation for each sampled combination, and look at the resulting spread of outcomes rather than a single number. Quantities commonly dispersed this way include vehicle mass properties (mass, center of mass, moments of inertia), propulsion parameters (thrust magnitude, mixture ratio, any misalignment of the thrust vector from the intended axis), atmospheric conditions (density profile, wind speed and direction), sensor errors (noise, bias, latency), actuator behavior (lag, deadband, saturation), and initial-condition uncertainty at the start of the phase being studied. None of these is dispersed to some artificial worst-case extreme by itself; each is drawn from the distribution that represents how well that quantity is genuinely known, and the campaign's value comes from sampling realistic combinations of all of them together, which is exactly what a single nominal run cannot do.

::: key
A single nominal-case simulation run shows the vehicle can work when every uncertain quantity happens to sit exactly at its expected value simultaneously. A dispersion campaign samples the realistic joint range of mass properties, environment, sensor and actuator uncertainty across many cases and reports the resulting distribution of outcomes — which is what an actual flight-readiness claim has to be based on, because no real flight gets to choose the nominal case.
:::

## Reading the result: percentiles, worst case, and why reproducibility is not optional here

A campaign's raw output is one number per case — a figure of merit such as landing miss distance, peak structural load, or propellant margin at a specific event — for however many cases were run. The useful summary of that output is not a single average but a distribution: the median, the 95th and 99th percentiles, and the worst value actually observed among the cases that were run.

::: example A dispersion campaign, and why the seed is part of the result
A simplified miss-distance model, dispersed across wind, ignition-timing error and drag-coefficient uncertainty, run for 5,000 cases:

```python
import numpy as np

def run_campaign(seed, n_cases=5000):
    rng = np.random.default_rng(seed)
    wind = rng.normal(0.0, 4.0, n_cases)
    timing_err = rng.normal(0.0, 0.15, n_cases)
    cd_err = rng.normal(1.0, 0.03, n_cases)
    return 14.2*wind + 380.0*timing_err*cd_err + rng.normal(0, 2.0, n_cases)

miss_a = run_campaign(seed=1001)
miss_b = run_campaign(seed=1001)     # same seed, run again
miss_c = run_campaign(seed=7)        # different seed

print("same seed, identical results:", np.array_equal(miss_a, miss_b))         # True
print("different seed, identical results:", np.array_equal(miss_a, miss_c))    # False

for name, miss in (("seed=1001", miss_a), ("seed=7", miss_c)):
    p50, p95, p99 = np.percentile(np.abs(miss), [50, 95, 99])
    print(f"{name}: median={p50:.1f} m  p95={p95:.1f} m  p99={p99:.1f} m  worst={np.max(np.abs(miss)):.1f} m")
# seed=1001: median=53.9 m  p95=153.5 m  p99=206.8 m  worst=321.5 m
# seed=7:    median=54.8 m  p95=156.1 m  p99=208.8 m  worst=330.2 m
```

Two different seeds produce two different sets of 5,000 individual outcomes, but statistically similar percentiles — which is the correct behavior: the seed controls exactly which 5,000 points from the underlying distribution you happened to sample, not the shape of the distribution itself. Run with the *same* seed, the campaign reproduces exactly, down to the last digit.

That last property is not a curiosity, it is load-bearing. If a case near the worst observed value looks concerning and needs deeper investigation, a reproducible campaign lets you rerun exactly that case with extra logging turned on; an irreproducible one leaves you unable to get back to the exact scenario that worried you. If a design change is proposed to fix a marginal result, comparing "before" and "after" only means something if both campaigns sampled the same underlying cases — otherwise an apparent improvement might be nothing more than a luckier random draw, not a real fix. And when a reviewer asks to see the result reproduced independently, "run it again with the stated seed and configuration" has to actually produce the same answer, or the original result was never solid evidence to begin with.
:::

## What the result actually claims, and what it does not

A dispersion campaign's result supports a specific, bounded claim: across the $N$ cases sampled from these stated uncertainty distributions, the observed outcomes had this median, these percentiles, and this worst case. That is a real and useful claim, and it is also narrower than it can sound. It is a statement about the $N$ cases that were actually run, not a proof about every case that could occur — the true tail of the distribution, beyond whatever the worst-observed case happened to be, is not directly sampled by a finite campaign, and a genuinely rare combination of conditions can exist beyond what even a large $N$ happened to draw. This is exactly why campaign size matters, why some analyses use specialized techniques aimed specifically at estimating rare-tail behavior rather than relying on plain random sampling alone, and why a responsible summary of a dispersion result states the sample size and the distributions used right alongside the percentiles, rather than presenting a clean headline number on its own.

Running more cases narrows that gap, at a real cost: a single high-fidelity case can take anywhere from a few seconds to a few minutes depending on how much of the vehicle's physics the simulation models, and a serious campaign runs the case count into the thousands or more, repeated every time the vehicle design, the software or the mission changes. That arithmetic is why this field's dispersion work is described as needing compute at real scale — order of magnitude, tens of thousands of CPU cores for a large campaign — rather than a number of cases you would casually queue up on a laptop.

::: example What 2,000 cases costs, and what a much bigger campaign costs
A single case taking about four seconds, run 2,000 times on eight cores — a reasonable laptop-scale exercise —

```python
n, seconds_per_case, cores = 2000, 4.0, 8
wall_clock_min = (n * seconds_per_case / cores) / 60
print(round(wall_clock_min, 1))   # 16.7 minutes
```

finishes in under twenty minutes. A larger campaign — 200,000 cases, each taking about twelve seconds because it carries higher fidelity — run on the same eight cores:

```python
n, seconds_per_case, cores = 200_000, 12.0, 8
wall_clock_hours = (n * seconds_per_case / cores) / 3600
print(round(wall_clock_hours, 1))   # 83.3 hours, about 3.5 days
```

would take three and a half days — too slow to be part of an iterative design loop, where an engineer needs an answer the same day, often more than once. The same 200,000 cases spread across a fleet sized in the tens of thousands of cores instead:

```python
n, seconds_per_case, cores = 200_000, 12.0, 20_000
wall_clock_min = (n * seconds_per_case / cores) / 60
print(round(wall_clock_min, 1))   # 2.0 minutes
```

finishes in about two minutes. Nothing about the analysis changed between the two — only how many cases could run at once — which is exactly why serious dispersion work is inseparable from serious infrastructure: the statistical question and the compute question are the same question in practice, and the next lesson looks directly at the infrastructure that makes campaigns at this scale possible at all.
:::

::: warning A headline percentile without its sample size and seed is not a result you can check
"The 99th-percentile miss distance was 207 meters" is not, by itself, a reproducible or checkable claim. The number of cases, the distributions each parameter was drawn from, and the seed used are part of the result, not optional supporting detail — without them, nobody, including the person who ran the campaign six months earlier, can verify or rerun it.
:::

## Check yourself

::: check
Name at least four categories of quantity commonly dispersed in a Monte Carlo campaign, and explain in one sentence why they are drawn from distributions rather than fixed at their nominal values.
:::

::: answer
Commonly dispersed quantities include vehicle mass properties, propulsion parameters such as thrust magnitude and misalignment, atmospheric conditions such as density and wind, and sensor or actuator errors such as noise, bias and lag. They are drawn from distributions, rather than held at nominal values, because no real flight has every uncertain quantity land exactly on its expected value simultaneously, and a campaign's entire purpose is to characterize outcomes across the realistic combinations that can actually occur.
:::

::: check
Explain precisely why a single nominal-case simulation run does not constitute evidence that a vehicle meets its requirements.
:::

::: answer
A nominal run sets every uncertain quantity to its expected value at once and shows the vehicle can work under that specific, simultaneous assumption. It says nothing about performance when those quantities take on other realistic values individually or in combination, which is the condition every actual flight is under — no real flight gets to select the nominal case, so a result that only holds at the nominal point is not a claim about real flight performance.
:::

::: check
Using the seeded-campaign example, give two concrete, different reasons why being able to reproduce a dispersion campaign exactly, from a stated seed, matters in practice.
:::

::: answer
First, if a specific case near the worst observed outcome needs deeper investigation, reproducibility lets you rerun exactly that case with additional logging or diagnostics turned on, rather than being unable to recreate the scenario that produced it. Second, when comparing a design change's effect on the result, the comparison is only meaningful if both the "before" and "after" campaigns sampled the same underlying cases; without a fixed, reproducible seed, an apparent improvement could be nothing more than a luckier random draw rather than a real effect of the change.
:::

::: check
State precisely what a dispersion campaign's percentile results do claim and what they do not claim, using the idea of the sampled cases versus the full underlying distribution.
:::

::: answer
The results claim that, across the specific $N$ cases actually sampled from the stated uncertainty distributions, the outcomes had a specific median, specific percentiles, and a specific observed worst case. They do not claim that no worse outcome than the observed worst case can occur — the true tail of the underlying distribution, beyond whatever the campaign's finite sample happened to draw, is not directly observed, so a rare combination of conditions can in principle exist beyond the worst case any particular campaign happened to see, especially at a modest sample size.
:::

::: check
Using the runtime-scaling numbers, explain why a serious dispersion campaign is described as needing compute at the scale of many thousands of CPU cores rather than a handful.
:::

::: answer
A 200,000-case, higher-fidelity campaign at about twelve seconds per case would take roughly three and a half days on eight cores — far too slow to support iterative design work, where an engineer needs a result the same day. Spreading the same 200,000 cases across a fleet of many thousands of cores brings that down to about two minutes, with nothing about the analysis itself changing — only the number of cases that can run simultaneously. Since neither the case count nor the per-case cost can shrink much without weakening the claim the campaign supports, the only lever left is running many cases in parallel, which is exactly why this kind of work is paired with infrastructure sized in the thousands to tens of thousands of cores.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Nominal case | Every uncertain quantity at its expected value simultaneously; proves little on its own |
| Dispersion | Sampling each uncertain quantity from a distribution representing its real uncertainty |
| Percentile / worst case | The distribution of outcomes across $N$ sampled cases, not a single average |
| Seed | The reproducibility key; same seed, same $N$ cases, same result, every time |
| Tail | Outcomes beyond the worst case a finite campaign happened to observe; not directly proven absent |

The next lesson looks at the infrastructure underneath a campaign like this one — the systems that actually run thousands of cases across a fleet of machines and get a result back.
