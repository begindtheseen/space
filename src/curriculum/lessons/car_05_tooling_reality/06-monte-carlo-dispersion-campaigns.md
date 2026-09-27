---
id: l06-monte-carlo-dispersion-campaigns
title: "Monte Carlo dispersion campaigns: what they actually prove"
minutes: 19
covers:
  - Monte Carlo dispersion campaigns across tens of thousands of CPUs and what they are used to prove
---

Imagine you want to know whether a paper airplane design really works. Throwing it once, on a still day, with a perfect flick of the wrist, tells you it *can* fly. It does not tell you what happens when the fold is a millimeter off, a breeze comes up, or your throw is a bit weak. To find out, you would fold fifty of them, throw them in all sorts of conditions, and see how many land near the target.

The previous lesson was about one thing failing outright — a sensor, a computer — and how the system notices and recovers. This lesson is about a different, and in some ways harder, kind of uncertainty: nothing fails, but everything is a little off. The propellant load is not exactly the number on the spec sheet. The atmosphere on flight day is not exactly the standard model. Every sensor has some real noise and bias. None of these alone breaks anything. Together, in some unlucky combination, they might.

A **[[Monte Carlo|monte-carlo-name]] dispersion campaign** exists to find out how often, and by how much. "Monte Carlo" means using many random samples to answer a question. "Dispersion" means spreading each uncertain input across its realistic range. A "campaign" is the whole organized batch of runs. Together they are one of the most direct pieces of evidence this field has for the question "does this vehicle actually meet its requirements?"

## Why the nominal case is not evidence

A **nominal** simulation run uses the expected, textbook value for every uncertain quantity at once: the spec-sheet mass, the standard atmosphere, zero sensor noise, a perfectly centered thrust. A good result from that run proves something real. The vehicle can work — under the assumption that every uncertain quantity lands exactly on its expected value, all at the same time.

It says nothing about the vehicle when those quantities take other realistic values, alone or in combination. And that is the situation every real flight is in. Nobody gets to fly the nominal case.

A dispersion campaign answers the harder, more honest question directly:

1. Describe each uncertain quantity with a **[[probability distribution|bell-curve]]** — a rule for how likely each value is. The distribution is not a wild guess. It is built from manufacturing tolerances, test data, or careful engineering judgment about how well the quantity is known.
2. Draw a random value for every uncertain quantity at once. That set of values is one **case**.
3. Run the full high-fidelity simulation for that case.
4. Repeat for many independent cases.
5. Look at the spread of outcomes, not a single number.

Quantities commonly dispersed include:

- **mass properties** — mass, center of mass, and moments of inertia (how hard the vehicle is to spin about each axis);
- **propulsion** — thrust magnitude, mixture ratio, and any misalignment of the thrust from its intended direction;
- **atmosphere** — the density profile, and wind speed and direction;
- **sensor errors** — noise, bias and latency (delay);
- **actuator behavior** — lag, **deadband** (a small range of commands that produce no response) and **saturation** (hitting a physical limit);
- **initial conditions** — how uncertain the state is at the start of the flight phase being studied.

None of these is pushed to an artificial worst-case extreme by itself. Each is drawn from the distribution that represents how well it is genuinely known. The campaign's value comes from sampling realistic *combinations* of all of them together — exactly what a single nominal run cannot do.

::: key
What is a Monte Carlo dispersion campaign for? To show that a vehicle meets its requirements across the realistic range of uncertainties — mass properties, winds, atmospheric density, sensor noise, actuator variation — rather than only on the nominal trajectory. It is how a flight-readiness claim is actually substantiated.
:::

::: key
A single nominal-case simulation run shows the vehicle can work when every uncertain quantity happens to sit exactly at its expected value simultaneously. A dispersion campaign samples the realistic joint range of mass properties, environment, sensor and actuator uncertainty across many cases and reports the resulting distribution of outcomes — which is what an actual flight-readiness claim has to be based on, because no real flight gets to choose the nominal case.
:::

## Reading the result: percentiles, worst case, and the seed

A campaign's raw output is one number per case: a **[[figure of merit|figure-of-merit]]** — the single number you judge each case by — such as landing miss distance, peak structural load, or propellant left over at a key moment. Run 5,000 cases and you get 5,000 numbers.

The useful summary of those numbers is not one average. It is a distribution, described by:

- the **median** — half the cases did better, half did worse;
- the **[[95th and 99th percentiles|percentiles]]** — the value that 95% (or 99%) of cases came in at or under;
- the **worst case** — the single worst value actually seen among the cases run.

There is one more ingredient. A computer's "random" numbers come from a **[[seed|seed]]** — a starting number that fixes the whole sequence of draws. Same seed, same sequence, every time.

::: example A dispersion campaign, and why the seed is part of the result
A simplified miss-distance model, dispersed across wind, ignition-timing error and drag-coefficient uncertainty, run for 5,000 cases:

```python
import numpy as np

def run_campaign(seed, n_cases=5000):
    rng = np.random.default_rng(seed)
    wind = rng.normal(0.0, 4.0, n_cases)          # m/s
    timing_err = rng.normal(0.0, 0.15, n_cases)   # s
    cd_err = rng.normal(1.0, 0.03, n_cases)       # drag scale factor
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

Read the model line by line. Each case draws a wind (typically within about $4\,\mathrm{m/s}$ of zero), an ignition-timing error (typically within about $0.15\,\mathrm{s}$), and a drag factor near $1$. Every meter per second of wind moves the landing point $14.2\,\mathrm{m}$; every second of timing error moves it about $380\,\mathrm{m}$; and a little extra noise is added.

Sanity check the size. The typical wind effect is $14.2 \times 4 = 56.8\,\mathrm{m}$ and the typical timing effect is $380 \times 0.15 = 57\,\mathrm{m}$. Independent effects combine like the sides of a right triangle, so the typical total is about $\sqrt{56.8^2 + 57^2 + 2^2} \approx 80\,\mathrm{m}$. A median miss of about $54\,\mathrm{m}$ and a 95th percentile of about $154\,\mathrm{m}$ fit that scale.

Now compare the seeds. Two different seeds give two different sets of 5,000 outcomes, but very similar percentiles ($53.9$ vs $54.8\,\mathrm{m}$ median, $206.8$ vs $208.8\,\mathrm{m}$ at the 99th). That is correct: the seed decides *which* 5,000 points you happened to draw, not the shape of the distribution. The worst cases differ more ($321.5$ vs $330.2\,\mathrm{m}$), because a single extreme point is the least stable number in the summary. Run with the *same* seed, the campaign reproduces exactly, to the last digit.
:::

### Why reproducibility is not optional

That last property is load-bearing, for three separate reasons.

1. **Investigating a scary case.** If a case near the worst value looks worrying, a reproducible campaign lets you rerun exactly that case with extra logging switched on. An irreproducible one leaves you unable to get back to the scenario that worried you.
2. **Comparing before and after.** If someone proposes a design change to fix a marginal result, "before" and "after" only compare fairly if both campaigns sampled the same cases. Otherwise an apparent improvement might be nothing more than a luckier random draw.
3. **Independent checking.** When a reviewer asks to see the result reproduced, "run it again with the stated seed and configuration" has to give the same answer. If it cannot, the original result was never solid evidence.

::: warning A headline percentile without its sample size and seed is not a result you can check
"The 99th-percentile miss distance was 207 meters" is not, by itself, a checkable claim. The number of cases, the distribution each parameter was drawn from, and the seed are part of the result, not optional detail. Without them nobody — including the person who ran the campaign six months ago — can verify or rerun it.
:::

## What the result actually claims, and what it does not

A campaign supports a specific, bounded claim:

> Across the $N$ cases sampled from these stated distributions, the outcomes had this median, these percentiles, and this worst case.

That is a real and useful claim. It is also narrower than it can sound. It is a statement about the $N$ cases actually run, not a proof about every case that could occur.

The **tail** — the rare outcomes beyond the worst one the campaign happened to draw — is not directly sampled. A genuinely rare combination of conditions can sit out there, beyond what even a large $N$ happened to hit. That is why campaign size matters. It is why some analyses use special techniques aimed at estimating rare-tail behavior instead of relying on plain random sampling alone. And it is why a responsible summary states the [[sample size|rule-of-three]] and the distributions used right next to the percentiles, instead of a clean headline number on its own.

::: note Why more cases help, but only slowly
Suppose some bad outcome truly happens in a fraction $q$ of all possible cases. The chance that one random case misses it is $1 - q$, so the chance that all $N$ independent cases miss it is $(1-q)^N$. To make that small you need $N$ to be several times $1/q$. A problem that happens once in 100,000 flights will usually not appear at all in a 5,000-case campaign: $(1 - 10^{-5})^{5000} \approx 0.95$, a 95% chance of never seeing it. Rare tails demand large $N$.
:::

## Why it takes tens of thousands of CPUs

Running more cases shrinks that gap, at a real cost. A single high-fidelity 6-DOF case — "six degrees of freedom," three for position and three for orientation — can take anywhere from a few seconds to a few minutes, depending on how much physics the simulation models. A serious campaign runs thousands of cases or more. And it is repeated every time the vehicle design, the software or the mission changes.

That arithmetic is why this field describes dispersion work as needing compute at real scale — on the order of tens of thousands of **[[CPU cores|parallel-lanes]]** for a large campaign — rather than a batch you would casually queue on a laptop.

::: example What 2,000 cases costs, and what a much bigger campaign costs
The rule: wall-clock time $=$ (cases $\times$ seconds per case) $\div$ cores. It works because every case is independent, so cores can run them side by side.

**Laptop scale.** 2,000 cases at about 4 seconds each, on 8 cores:

```python
n, seconds_per_case, cores = 2000, 4.0, 8
wall_clock_min = (n * seconds_per_case / cores) / 60
print(round(wall_clock_min, 1))   # 16.7 minutes
```

Step by step: $2000 \times 4 = 8000$ core-seconds of work; $8000 / 8 = 1000\,\mathrm{s}$; $1000 / 60 \approx 16.7$ minutes. Under twenty minutes — a fine homework exercise.

**Bigger campaign, same laptop.** 200,000 cases at about 12 seconds each (more fidelity, so slower), still on 8 cores:

```python
n, seconds_per_case, cores = 200_000, 12.0, 8
wall_clock_hours = (n * seconds_per_case / cores) / 3600
print(round(wall_clock_hours, 1))   # 83.3 hours, about 3.5 days
```

Step by step: $200{,}000 \times 12 = 2{,}400{,}000$ core-seconds; $\div 8 = 300{,}000\,\mathrm{s}$; $\div 3600 \approx 83.3$ hours; $\div 24 \approx 3.5$ days. Far too slow for an iterative design loop, where an engineer needs an answer the same day, often more than once.

**Same campaign, a large fleet.** Spread across 20,000 cores:

```python
n, seconds_per_case, cores = 200_000, 12.0, 20_000
wall_clock_min = (n * seconds_per_case / cores) / 60
print(round(wall_clock_min, 1))   # 2.0 minutes
```

Step by step: $2{,}400{,}000 / 20{,}000 = 120\,\mathrm{s} = 2$ minutes. Sanity check: $20{,}000$ cores is $2{,}500$ times more than $8$, and $83.3$ hours $\times 60 / 2500 = 2.0$ minutes. It matches.

Nothing about the analysis changed between the three — only how many cases could run at once. The statistical question and the compute question turn out to be the same question.
:::

::: key
Why does GNC need tens of thousands of CPUs? Because a credible dispersion campaign is thousands to millions of high-fidelity 6-DOF runs, repeated every time the vehicle, the software or the mission changes. That is the workload the SRE GNC role exists to keep running.
:::

The **[[SRE GNC role|sre]]** in that card is a site reliability engineer who keeps the GNC team's computing fleet running. The next lesson looks at the tools that job uses.

## Check yourself

::: check
Name at least four categories of quantity commonly dispersed in a Monte Carlo campaign, and explain in one sentence why they are drawn from distributions rather than fixed at their nominal values.
:::

::: answer
Commonly dispersed quantities include vehicle mass properties (mass, center of mass, inertia), propulsion parameters such as thrust magnitude and misalignment, atmospheric conditions such as density and wind, sensor errors such as noise, bias and latency, actuator behavior such as lag and saturation, and initial conditions. They are drawn from distributions because no real flight has every uncertain quantity land exactly on its expected value at once, and the campaign's whole purpose is to characterize outcomes across the realistic combinations that can actually occur.
:::

::: check
Explain precisely why a single nominal-case simulation run does not constitute evidence that a vehicle meets its requirements.
:::

::: answer
A nominal run sets every uncertain quantity to its expected value at the same time and shows the vehicle can work under that one simultaneous assumption. It says nothing about performance when those quantities take other realistic values, alone or in combination — which is the condition every actual flight is under. No real flight gets to select the nominal case, so a result that holds only there is not a claim about real flight performance.
:::

::: check
Using the seeded-campaign example, give two concrete, different reasons why being able to reproduce a dispersion campaign exactly, from a stated seed, matters in practice.
:::

::: answer
First, if a case near the worst observed outcome needs investigating, reproducibility lets you rerun exactly that case with extra logging or diagnostics, instead of being unable to recreate it. Second, when judging a design change, "before" and "after" campaigns compare fairly only if both sampled the same cases; without a fixed seed, an apparent improvement could be a luckier random draw rather than a real effect. (A third: a reviewer can independently rerun it and get the same answer.)
:::

::: check
State precisely what a dispersion campaign's percentile results do claim and what they do not claim, using the idea of the sampled cases versus the full underlying distribution.
:::

::: answer
They claim that across the specific $N$ cases actually sampled from the stated distributions, the outcomes had a certain median, certain percentiles and a certain observed worst case. They do not claim that nothing worse than that worst case can occur. The true tail of the underlying distribution, beyond what a finite sample happened to draw, is not directly observed, so a rare combination of conditions can in principle lie beyond the worst case any particular campaign saw — especially at a modest sample size.
:::

::: check
Using the runtime-scaling numbers, explain why a serious dispersion campaign is described as needing compute at the scale of many thousands of CPU cores rather than a handful.
:::

::: answer
A 200,000-case, higher-fidelity campaign at about 12 seconds per case is 2,400,000 core-seconds of work: roughly 83 hours, or three and a half days, on 8 cores — far too slow for iterative design work, where an engineer needs results the same day. Spread across 20,000 cores the same campaign takes about two minutes, with nothing about the analysis changed. Neither the case count nor the per-case cost can shrink much without weakening the claim, so the only lever left is running many cases in parallel — which is why this work comes paired with infrastructure sized in the thousands to tens of thousands of cores.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Nominal case | Every uncertain quantity at its expected value at once; proves little on its own |
| Dispersion | Drawing each uncertain quantity from a distribution representing its real uncertainty |
| Case | One full simulation run with one random draw of every dispersed quantity |
| Figure of merit | The one number each case is judged by (miss distance, peak load, propellant margin) |
| Median / percentile / worst case | The distribution of outcomes across $N$ sampled cases, not a single average |
| Seed | The reproducibility key: same seed, same $N$ cases, same result, every time |
| Tail | Outcomes beyond the worst case a finite campaign happened to see; not proven absent |
| Wall-clock time | cases $\times$ seconds per case $\div$ cores, because cases are independent |

The next lesson looks at the infrastructure underneath a campaign like this one — the systems that package the simulation, run hundreds of thousands of cases across a fleet of machines, and get a result back.

::: context monte-carlo-name Named after a casino
Monte Carlo is a district of Monaco famous for its casino — a place where outcomes are decided by chance. In the late 1940s, scientists at Los Alamos, including Stanislaw Ulam, John von Neumann and Nicholas Metropolis, began using early computers to answer physics questions by running huge numbers of random trials instead of solving the equations directly. The method needed a code name, and a casino was the obvious joke. The name stuck, and today any "answer it by sampling at random many times" method is called Monte Carlo.
:::

::: context bell-curve The bell curve
The most common distribution for dispersions is the **normal distribution**, whose graph is a bell. It is described by a mean (the center) and a standard deviation, written $\sigma$ (said "sigma"), which measures the spread. About 68% of draws land within $1\sigma$ of the center, and about 95% within $2\sigma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="80,150 80,135.1 85,131.9 90,128.2 95,124.1 100,119.4 105,114.3 110,108.7 115,102.7 120,96.5 125,89.9 130,83.3 135,76.6 140,70.1 145,63.9 150,58.1 155,52.9 160,48.5 165,44.8 170,42.2 175,40.5 180,40.0 185,40.5 190,42.2 195,44.8 200,48.5 205,52.9 210,58.1 215,63.9 220,70.1 225,76.6 230,83.3 235,89.9 240,96.5 245,102.7 250,108.7 255,114.3 260,119.4 265,124.1 270,128.2 275,131.9 280,135.1 280,150" fill="#8fb8f0" stroke="none"/>
  <polygon points="130,150 130,83.3 135,76.6 140,70.1 145,63.9 150,58.1 155,52.9 160,48.5 165,44.8 170,42.2 175,40.5 180,40.0 185,40.5 190,42.2 195,44.8 200,48.5 205,52.9 210,58.1 215,63.9 220,70.1 225,76.6 230,83.3 230,150" fill="#1d6fd1" stroke="none"/>
  <polyline points="30,148.8 35,148.4 40,147.8 45,147.1 50,146.3 55,145.2 60,143.8 65,142.2 70,140.2 75,137.9 80,135.1 85,131.9 90,128.2 95,124.1 100,119.4 105,114.3 110,108.7 115,102.7 120,96.5 125,89.9 130,83.3 135,76.6 140,70.1 145,63.9 150,58.1 155,52.9 160,48.5 165,44.8 170,42.2 175,40.5 180,40.0 185,40.5 190,42.2 195,44.8 200,48.5 205,52.9 210,58.1 215,63.9 220,70.1 225,76.6 230,83.3 235,89.9 240,96.5 245,102.7 250,108.7 255,114.3 260,119.4 265,124.1 270,128.2 275,131.9 280,135.1 285,137.9 290,140.2 295,142.2 300,143.8 305,145.2 310,146.3 315,147.1 320,147.8 325,148.4 330,148.8" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="166">−2σ</text><text x="130" y="166">−1σ</text><text x="180" y="166">mean</text><text x="230" y="166">+1σ</text><text x="280" y="166">+2σ</text>
  </g>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#ffffff">68%</text>
  <text x="180" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">dark band about 68% · dark plus light about 95%</text>
  <text x="180" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">most draws near the center, a few far out</text>
</svg>
```

In the example, `rng.normal(0.0, 4.0, n)` draws winds from a bell centered on zero with $\sigma = 4\,\mathrm{m/s}$.
:::

::: context figure-of-merit One number to judge by
A **figure of merit** is the single number you use to score each case, so thousands of runs can be compared on one scale. Which number you pick depends on the requirement you are testing. For a landing rocket it may be miss distance from the pad; for ascent, the peak aerodynamic load on the structure; for a long burn, how much propellant is left at the end. A campaign often tracks several, but each requirement is judged against its own one.
:::

::: context percentiles Reading a percentile
Sort every case's result from best to worst. The 95th percentile is the value that 95% of cases are at or below. With 20 cases, that is the 19th smallest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.8">
    <rect x="20" y="156" width="14" height="4"/><rect x="36" y="152" width="14" height="8"/><rect x="52" y="149" width="14" height="11"/><rect x="68" y="146" width="14" height="14"/><rect x="84" y="143" width="14" height="17"/>
    <rect x="100" y="140" width="14" height="20"/><rect x="116" y="137" width="14" height="23"/><rect x="132" y="134" width="14" height="26"/><rect x="148" y="131" width="14" height="29"/><rect x="164" y="128" width="14" height="32"/>
    <rect x="180" y="125" width="14" height="35"/><rect x="196" y="122" width="14" height="38"/><rect x="212" y="118" width="14" height="42"/><rect x="228" y="114" width="14" height="46"/><rect x="244" y="110" width="14" height="50"/>
    <rect x="260" y="105" width="14" height="55"/><rect x="276" y="99" width="14" height="61"/><rect x="292" y="92" width="14" height="68"/>
  </g>
  <rect x="308" y="82" width="14" height="78" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <rect x="324" y="60" width="14" height="100" fill="#b4232c" stroke="#1f2a44" stroke-width="0.8"/>
  <line x1="179" y1="40" x2="179" y2="165" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="175" y="34" font-size="12" text-anchor="end" fill="#1d6fd1">median: 10 below, 10 above</text>
  <text x="300" y="72" font-size="12" text-anchor="end" fill="#1f2a44">95th</text>
  <text x="331" y="52" font-size="12" text-anchor="middle" fill="#b4232c">worst</text>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">20 cases, sorted by miss distance</text>
</svg>
```

Percentiles are steadier than the worst case, because they rest on many points instead of one.
:::

::: context seed Random, but repeatable
Computers do not roll real dice. They use a **pseudo-random number generator**: a formula that turns one number into the next in a way that looks random. The **seed** is where that chain starts. Start from the same seed and you get the identical chain of "random" numbers every time; start from a different one and you get a different chain. That is why `default_rng(1001)` twice gave identical results. Recording the seed turns a random experiment into a repeatable one.
:::

::: context rule-of-three How many cases is enough?
Statisticians have a handy shortcut called the **rule of three**. If you run $N$ independent cases and none of them fails, you can say with about 95% confidence that the true failure rate is below $3/N$. For 5,000 clean cases that bound is $3/5000 = 0.0006$, or 0.06%. For 200,000 clean cases it is $0.0015\%$. So a campaign with zero failures still cannot promise "never" — only "rarer than about $3/N$." That is one honest reason to state the sample size next to every result.
:::

::: context parallel-lanes Why the cases split so neatly
A **core** is one independent worker inside a processor; a modern laptop has several, a computing cluster has many thousands. Dispersion cases do not need to talk to each other, so they can be handed out to cores like pages to a room of readers. Computer scientists call this kind of job **embarrassingly parallel** — splitting it up is almost no effort.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">1 core: 12 cases, one after another</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="26" width="24" height="18"/><rect x="44" y="26" width="24" height="18"/><rect x="68" y="26" width="24" height="18"/><rect x="92" y="26" width="24" height="18"/><rect x="116" y="26" width="24" height="18"/><rect x="140" y="26" width="24" height="18"/>
    <rect x="164" y="26" width="24" height="18"/><rect x="188" y="26" width="24" height="18"/><rect x="212" y="26" width="24" height="18"/><rect x="236" y="26" width="24" height="18"/><rect x="260" y="26" width="24" height="18"/><rect x="284" y="26" width="24" height="18"/>
  </g>
  <text x="20" y="70" font-size="12" fill="#1f2a44">4 cores: same 12 cases, 3 each</text>
  <g fill="#1d6fd1" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="78" width="24" height="16"/><rect x="44" y="78" width="24" height="16"/><rect x="68" y="78" width="24" height="16"/>
    <rect x="20" y="96" width="24" height="16"/><rect x="44" y="96" width="24" height="16"/><rect x="68" y="96" width="24" height="16"/>
    <rect x="20" y="114" width="24" height="16"/><rect x="44" y="114" width="24" height="16"/><rect x="68" y="114" width="24" height="16"/>
    <rect x="20" y="132" width="24" height="16"/><rect x="44" y="132" width="24" height="16"/><rect x="68" y="132" width="24" height="16"/>
  </g>
  <text x="200" y="120" font-size="12" text-anchor="middle" fill="#b4232c">finishes in 1/4 of the time</text>
</svg>
```

Four cores finish in a quarter of the time; 20,000 cores, in a 20,000th — as long as there are enough cases to go around.
:::

::: context sre Who keeps the fleet running
**SRE** (said "S-R-E") stands for **site reliability engineering**, a job title that started at Google in the early 2000s for engineers who run large computing systems using software-engineering methods: automate everything, measure everything, and treat outages as bugs to fix for good. SpaceX has advertised SRE roles attached to GNC, whose job is to keep the simulation cluster, build systems and pipelines healthy so GNC engineers can launch a campaign and trust what comes back. The next lesson walks through their toolbox.
:::
