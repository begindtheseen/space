---
id: l11-numbers-resume-and-portfolio
title: "Framing your work with numbers: talks, resume and portfolio"
minutes: 18
covers:
  - "Framing self-taught projects as engineering results with numbers: RMSE, margins, run counts, solve times, not adjectives"
  - "Resume and portfolio construction around artefacts that can be read: repositories, reports, plots"
---

Picture two ads for the same used bike. The first says: "Great bike, super fast, excellent condition." The second says: "Bought in 2023, ridden about 400 miles, new tires in May, one small scratch on the frame (photo attached)." You trust the second one, even though you have never met either seller. It gives you facts you could check. The first gives you only the seller's opinion.

A self-taught candidate is in the position of a stranger selling a bike. There is no degree to point to, no employer's name to lend weight, no manager to vouch for the work. Every one of those credibility problems has the same fix, applied every time: replace each adjective about your own work with **a number, a unit, and the method that produced it**.

A panel cannot check that your simulation was "robust" or your filter "accurate". A panel *can* judge "landing **[[CEP|cep]]** of 4.2 m over 10,000 dispersed cases, 99.87th-percentile error of 11 m, pass criteria fixed before the campaign ran." That sentence carries everything needed to judge it on its own terms, no matter who wrote it or where they learned.

This lesson applies that one habit in three places where it decides whether your work is believed: what you say about a result out loud, what your resume claims, and what a repository or report shows a stranger who has ten minutes and no reason to trust you.

## What makes a number credible

A credible claim has four parts. Missing any one of them makes it weaker than it needs to be.

1. **The metric** — what was actually measured: miss distance, estimation error, solve time. The **[[RMS|rms]]** error, the median miss, the fraction of runs that passed.
2. **The unit** — meters, degrees, milliseconds. Without it, a number is not yet usable.
3. **The method** — how it was measured and over what sample. "4.2 m" from one lucky run and "4.2 m" from ten thousand **[[dispersed cases|dispersed-cases]]** read the same on the page. They are completely different claims.
4. **The worst case beside the central value.** An aerospace panel is trained to care about the tail of a distribution far more than its middle, because the tail is where a vehicle is actually lost. A number with no worst case invites the follow-up you would rather have answered already. That is why results are often quoted at the **[[99.87th percentile|three-sigma]]**.

::: key
State a result as a number, a unit, and a method: "CEP of 4.2 m over 10,000 dispersed cases, 99.87th percentile 11 m, criteria fixed before the run" — never "the accuracy was good". Give the worst case beside the central value, always.
:::

Adjectives fail this test by their nature, not by bad luck. "Robust", "accurate" and "efficient" carry nothing a listener can check. So they invite exactly the question you least want: "Robust by what measure?" A number with a stated method closes that question before it is asked, because the method *is* the answer.

::: example Computing the headline numbers
Suppose a landing simulation produced 10,000 dispersed runs. Each run lands some distance east and north of the target. Here is how the headline numbers come out of the raw results. (The misses here are made up — drawn at random — to show the steps.)

```python
import numpy as np

rng = np.random.default_rng(42)
# 10,000 dispersed landings: east and north miss distances in meters
miss = rng.normal(0.0, 3.5, size=(10_000, 2))
r = np.hypot(miss[:, 0], miss[:, 1])      # radial miss distance, m

print(f"CEP (median miss): {np.median(r):.1f} m")
print(f"RMS miss:          {np.sqrt(np.mean(r**2)):.1f} m")
print(f"99.87th pct:       {np.percentile(r, 99.87):.1f} m")
print(f"worst of 10,000:   {r.max():.1f} m")
# CEP (median miss): 4.1 m
# RMS miss:          5.0 m
# 99.87th pct:       12.4 m
# worst of 10,000:   15.4 m
```

**Step 1.** `np.hypot` turns each east-north pair into one straight-line miss distance, $r = \sqrt{x^2 + y^2}$.

**Step 2.** The median of those distances is the CEP: half the landings are closer than $4.1\,\mathrm{m}$.

**Step 3.** The RMS squares each miss, averages, and takes the square root: $5.0\,\mathrm{m}$. It is bigger than the median because squaring gives the far misses extra weight.

**Step 4.** The 99.87th percentile is $12.4\,\mathrm{m}$: only about 13 of the 10,000 runs did worse. The single worst run missed by $15.4\,\mathrm{m}$.

**Sanity check:** median $<$ RMS $<$ 99.87th percentile $<$ worst, as it must be for a spread of misses. The honest one-line claim is: "CEP 4.1 m, 99.87th percentile 12.4 m, over 10,000 dispersed cases."
:::

::: example A resume line, before and after
**Before:** "Built a Kalman filter for spacecraft attitude estimation that improved performance significantly."

**After:** "Reduced attitude estimation error from 0.8° to 0.2° RMS by modelling **[[gyro bias instability|gyro-bias]]** as an estimated state, verified over 2,000 dispersed Monte Carlo cases."

What changed, piece by piece:

- **Metric:** RMS attitude error, not "performance".
- **Numbers with units:** $0.8°$ before, $0.2°$ after — a factor of four.
- **The cause:** the specific technical change that did it.
- **The sample:** 2,000 dispersed cases.

The original supplies none of those four, in about the same number of words.
:::

## Resume bullets, piece by piece

A strong technical bullet has a shape you can repeat. It holds four things, not always in this order:

- the **action** you took,
- the specific **method** behind it,
- the **result**, with a number and a unit,
- the **breadth of verification** behind the claim.

Take this bullet: "Implemented a convex **[[second-order-cone|socp]]** solver for powered-descent guidance, achieving sub-250 ms worst-case solve time across 10,000 dispersed initial conditions with zero infeasible returns."

- Action: implemented a solver.
- Method: second-order cone — named exactly, not "an optimization approach".
- Result with units: 250 ms, and it is the *worst case*, not the average.
- Verification: 10,000 dispersed cases, plus the specific claim of zero failures.

Every piece is checkable. An interviewer could ask about any one of them and get a real answer, because each is a fact about the work, not an opinion of it.

::: warning
A bullet about effort ("spent six months building…") or difficulty ("a challenging project involving…") is not a stronger version of a weak bullet. It answers a question nobody asked. Resume space is scarce. Every word spent on effort or difficulty is a word not spent on the result, the method, or the verification — the three things the reader is trying to find.
:::

## A portfolio a stranger can read

Your strongest evidence is not the resume line at all. It is the **artifact** behind it — a repository, a report, a plot — because an artifact can be inspected directly instead of taken on faith. Each kind has its own bar for being readable by a stranger in one short sitting.

### The repository

A repository earns trust through four things.

- **A [[README|readme]] that states the requirement, the result, and how to reproduce it.** The result follows the same numbers-and-method rule as everywhere else. The install steps must actually work, not only aspire to.
- **Tests that run, visibly.** A green test suite is evidence a stranger can produce for themselves in minutes. It is worth more than a large pile of untested code, which they would have to trust secondhand.
- **One plot that carries the argument, at the top of the README** — not buried three folders deep.
- **A [[commit history|commit-history]] that shows real work.** Failed attempts, fixes and refactors are themselves evidence. A single "initial commit" holding an entire finished project reads as either copied or rebuilt afterward for show. A messy, honest history of real debugging shows the work was built step by step by the person claiming it.

### The report

A report applies the same numbers discipline all through its results. It adds one section worth writing *first*, not last: **known limitations**, stated plainly. What does the model leave out? What could not be checked against anything outside the simulation? What would need hardware or more data to settle?

This is not hedging. It is the same self-awareness a project talk's closing section is graded on. A reviewer who finds it missing tends to assume — correctly, more often than not — that the limits were never considered, not that there were none.

### The plot

A plot stands on its own only when it has:

- **labeled axes with units**,
- **the sample it came from** stated on it ("10,000 dispersed cases"),
- **the worst case marked**, not only a smooth central curve.

A single trajectory, plotted once, with no run count, no spread and no worst case, shows that something ran. It does not show a verified, characterized result. A reviewer who has seen both kinds can usually tell them apart at a glance.

::: example A repository README for a real project
For a convex landing-guidance project, the top of the README holds five things.

1. **The requirement:** "Soft-land within a thrust envelope, solved in real time onboard."
2. **The result, with method:** "Second-order-cone formulation via lossless convexification; sub-250 ms worst-case solve time across 10,000 dispersed cases; zero infeasible solves."
3. **The one plot:** landing-position dispersion with the target and the worst case marked, shown right there, not linked three pages away.
4. **Reproduce steps a stranger can run:** `pip install -r requirements.txt`, then one documented command that regenerates the dispersion result from a **[[fixed seed|fixed-seed]]**.
5. **A short, specific limitations line:** "Point-mass, rigid-body model; free-final-time and flexible-body effects are not yet handled."

**Check it as the reader would:** someone with ten minutes and no prior trust in the author can verify every claim in that section personally. That is the whole point of building it this way.
:::

## Check yourself

::: check
Name the four parts of a credible numeric claim, and explain why a claim missing the worst case, in particular, invites a follow-up.
:::

::: answer
Metric, unit, method (including the sample it was measured over), and the worst case beside the central value. Leaving out the worst case invites a follow-up because an aerospace panel weighs the tail of a distribution over its average — the average is rarely where a vehicle is lost. A number with only a mean or an RMS naturally prompts "what's your worst case?" Stating it up front removes the question before it is asked.
:::

::: check
Rewrite this resume bullet with the four-part structure: "Developed a 6-DOF simulation that was very accurate and used across the project."
:::

::: answer
Replace "very accurate" and "used across the project" with a specific method, a quantified result, and a stated verification. For example: "Built a 6-DOF flight simulation with RK4 propagation and closed-loop guidance and control, validated against an independent two-body analytical solution to within 0.1% specific-energy error over a 90-minute propagation, and used as the verification environment for three downstream guidance studies." That names the method (RK4, closed loop), gives a specific validation check with a number, and says concretely what the simulation was used for instead of claiming broad usefulness.
:::

::: check
Why does a repository's commit history count as evidence, beyond the code already visible in its final state?
:::

::: answer
The final state shows what was built, not how. A single "initial commit" holding a finished project fits several stories — copied, rebuilt afterward for show, or truly written in one sitting with no debugging — and a reviewer cannot tell them apart from the final code. A history with false starts, bug fixes and gradual refactors is hard-to-fake evidence that the work was built the way real engineering gets built: step by step, with mistakes along the way. That is exactly what a project talk's defense is trying to establish.
:::

::: check
A report's results section says: "Average landing error across the test campaign was 3.1 m." What is missing, and why does its absence weaken the claim more than it first seems to?
:::

::: answer
Missing: the sample size and method behind "the test campaign", and above all any worst-case or tail number beside the average. A mean alone cannot tell apart two very different situations. In one, the misses are tightly grouped. In the other, many good landings pull the average down while a few land catastrophically far away. Both can produce the same 3.1 m. Without the worst case and the sample size, a reader cannot tell which one they are looking at — and an experienced reviewer will assume the less favorable one until shown otherwise.
:::

::: check
Why should a report's known-limitations section be written early, taken seriously like a project talk's closing section, instead of tacked on at the end?
:::

::: answer
Writing it early forces an honest accounting of what the work does *not* show before the temptation to quietly skip an awkward gap appears — which is strongest once the rest is finished and you want it to look complete. It also shows the same self-awareness a strong talk's limitations section shows: you know exactly where your result stops being trustworthy. A reviewer reads that as engineering judgment, not weakness. Every real result has limits; the difference between a strong report and a weak one is whether they are stated or hidden.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Credible number | Metric, unit, method and sample, worst case beside the central value — "CEP of 4.2 m over 10,000 cases, 99.87th percentile 11 m" |
| CEP, RMS, percentile | Median miss; root of the mean squared miss; the value only a small fraction of runs exceed |
| Resume bullet | Action, specific method, quantified result with units, verification breadth — not effort or difficulty |
| Readable repository | README with requirement, result and working reproduce steps; tests that visibly run; one plot up front; honest commit history |
| Readable report | Same numbers discipline throughout; known limitations written early and plainly |
| Readable plot | Labeled axes with units, stated sample, worst case marked |

The final lesson closes out the non-technical parts of the process: work authorization handled early instead of as a surprise, realistic adjacent entry roles, and how to run the full timed mock loop that ties every round in this module together.

::: context cep Half the shots inside the circle
**CEP** stands for *circular error probable*. Draw a circle around the target just big enough to hold half of all the landings: its radius is the CEP. The term comes from artillery and bombing, where it measured how tightly shots grouped. It is the median miss, so it says nothing about the other half.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="95" r="74.0" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="120" cy="95" r="28.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="112" y1="95" x2="128" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="87" x2="120" y2="103" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="120.0" cy="103.4" r="2.5" fill="#1d6fd1"/><circle cx="112.3" cy="70.1" r="2.5" fill="#1d6fd1"/><circle cx="107.3" cy="67.2" r="2.5" fill="#6c7a93"/>
  <circle cx="121.7" cy="132.5" r="2.5" fill="#6c7a93"/><circle cx="106.2" cy="77.6" r="2.5" fill="#1d6fd1"/><circle cx="133.7" cy="105.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="123.0" cy="68.9" r="2.5" fill="#1d6fd1"/><circle cx="119.2" cy="114.5" r="2.5" fill="#1d6fd1"/><circle cx="82.4" cy="82.2" r="2.5" fill="#6c7a93"/>
  <circle cx="66.8" cy="58.9" r="2.5" fill="#6c7a93"/><circle cx="68.4" cy="88.4" r="2.5" fill="#6c7a93"/><circle cx="84.5" cy="102.6" r="2.5" fill="#6c7a93"/>
  <circle cx="124.4" cy="89.8" r="2.5" fill="#1d6fd1"/><circle cx="49.5" cy="79.9" r="2.5" fill="#6c7a93"/><circle cx="118.6" cy="98.2" r="2.5" fill="#1d6fd1"/>
  <circle cx="77.2" cy="81.6" r="2.5" fill="#6c7a93"/><circle cx="92.6" cy="72.4" r="2.5" fill="#6c7a93"/><circle cx="149.7" cy="72.4" r="2.5" fill="#6c7a93"/>
  <circle cx="119.1" cy="119.8" r="2.5" fill="#1d6fd1"/><circle cx="103.7" cy="91.9" r="2.5" fill="#1d6fd1"/><circle cx="123.1" cy="96.8" r="2.5" fill="#1d6fd1"/>
  <circle cx="85.7" cy="97.1" r="2.5" fill="#6c7a93"/><circle cx="158.0" cy="51.7" r="2.5" fill="#6c7a93"/><circle cx="144.1" cy="98.3" r="2.5" fill="#1d6fd1"/>
  <circle cx="102.0" cy="151.0" r="2.5" fill="#6c7a93"/><circle cx="141.3" cy="61.4" r="2.5" fill="#6c7a93"/><circle cx="122.1" cy="111.1" r="2.5" fill="#1d6fd1"/>
  <circle cx="114.7" cy="114.1" r="2.5" fill="#1d6fd1"/><circle cx="118.1" cy="113.7" r="2.5" fill="#1d6fd1"/><circle cx="160.3" cy="76.1" r="2.5" fill="#6c7a93"/>
  <circle cx="125.7" cy="82.0" r="2.5" fill="#1d6fd1"/><circle cx="123.6" cy="61.8" r="2.5" fill="#6c7a93"/><circle cx="103.8" cy="89.5" r="2.5" fill="#1d6fd1"/>
  <circle cx="145.2" cy="127.1" r="2.5" fill="#6c7a93"/><circle cx="82.9" cy="72.8" r="2.5" fill="#6c7a93"/><circle cx="138.1" cy="39.2" r="2.5" fill="#6c7a93"/>
  <circle cx="107.0" cy="92.3" r="2.5" fill="#1d6fd1"/><circle cx="155.2" cy="114.3" r="2.5" fill="#6c7a93"/><circle cx="110.8" cy="84.7" r="2.5" fill="#1d6fd1"/>
  <circle cx="113.0" cy="137.7" r="2.5" fill="#6c7a93"/><circle cx="108.0" cy="86.5" r="2.5" fill="#1d6fd1"/><circle cx="129.9" cy="91.6" r="2.5" fill="#1d6fd1"/>
  <circle cx="114.5" cy="63.8" r="2.5" fill="#6c7a93"/><circle cx="119.7" cy="82.6" r="2.5" fill="#1d6fd1"/><circle cx="152.7" cy="113.3" r="2.5" fill="#6c7a93"/>
  <circle cx="119.3" cy="113.7" r="2.5" fill="#1d6fd1"/><circle cx="110.5" cy="124.5" r="2.5" fill="#6c7a93"/><circle cx="119.8" cy="111.3" r="2.5" fill="#1d6fd1"/>
  <circle cx="83.9" cy="104.7" r="2.5" fill="#6c7a93"/><circle cx="72.7" cy="38.0" r="3.5" fill="#b4232c"/><circle cx="111.5" cy="69.8" r="2.5" fill="#1d6fd1"/>
  <circle cx="124.6" cy="157.9" r="2.5" fill="#6c7a93"/><circle cx="96.7" cy="77.5" r="2.5" fill="#6c7a93"/><circle cx="125.8" cy="108.8" r="2.5" fill="#1d6fd1"/>
  <circle cx="115.1" cy="89.2" r="2.5" fill="#1d6fd1"/><circle cx="139.7" cy="109.6" r="2.5" fill="#1d6fd1"/><circle cx="91.1" cy="92.8" r="2.5" fill="#6c7a93"/>
  <circle cx="121.0" cy="65.5" r="2.5" fill="#6c7a93"/><circle cx="127.3" cy="71.0" r="2.5" fill="#1d6fd1"/><circle cx="147.2" cy="100.4" r="2.5" fill="#1d6fd1"/>
  <text x="215" y="80" font-size="12" fill="#1d6fd1">CEP circle:</text>
  <text x="215" y="96" font-size="12" fill="#1d6fd1">30 of 60 inside</text>
  <text x="215" y="130" font-size="12" fill="#b4232c">dashed: worst case,</text>
  <text x="215" y="146" font-size="12" fill="#b4232c">the red landing</text>
</svg>
```

The worst landing is more than two and a half times the CEP away. That is why the CEP never travels alone.
:::

::: context rms Root mean square, read backwards
**RMS** means *root mean square*, and you compute it by reading the name backwards. **Square** each error, so minus signs vanish and big errors count extra. Take the **mean** of the squares. Take the square **root**, to get back to the original units. For errors of 1, 2 and 5 m: squares 1, 4, 25; mean 10; root about 3.2 m — higher than the plain average of 2.7 m, because the 5 m error weighs more. RMSE is the same thing for "root mean square error".
:::

::: context dispersed-cases Rolling the dice ten thousand times
A **dispersed case** is one simulation run in which the uncertain inputs — engine thrust, wind, sensor errors, the vehicle's mass, the starting position — are each drawn at random from a realistic spread instead of set to their expected values. Running thousands of them is a **Monte Carlo** campaign, named after the casino, because it is rolling dice on purpose. The point is to see not only how the design does on a good day, but how it does on the bad days a real flight might bring.
:::

::: context three-sigma Why 99.87 and not 99 or 100
For a bell-shaped spread, $99.87\%$ of values lie below the mean plus three standard deviations ("three sigma"). So the 99.87th percentile is the data-based version of a three-sigma worst case, and aerospace requirements are often written at that level. Out of 10,000 runs, only about 13 are worse than it. It is used instead of the single worst run because one extreme draw can move the maximum a lot, while a high percentile is steadier — but quoting both, as good reports do, costs one extra number.
:::

::: context gyro-bias A clock that drifts
A gyroscope measures how fast the vehicle turns, but it always adds a small wrong offset, its **bias**. Worse, the bias slowly wanders — the **bias instability**. Integrate a biased rate for an hour and the attitude error keeps growing, like a watch that runs a little fast and then a little slow. Adding the bias to the filter's state lets star-tracker measurements estimate it and subtract it continuously. That single modeling change is a common, real reason attitude error drops by a large factor.
:::

::: context socp A shape a solver can always handle
A **second-order cone program** is an optimization problem whose constraints look like an ice-cream cone: the length of a vector must be no bigger than some linear quantity, such as $\|\mathbf{T}\| \le \Gamma$. Problems of this shape are convex, so solvers can find the true best answer in a predictable, bounded number of steps. That predictability is why it matters for flight: a guidance solve that always finishes in time can be certified, a case the optimization module makes in its lessons on cone programming and lossless convexification.
:::

::: context readme The front door of a repository
A **README** is the file a code-hosting site shows on a repository's front page. For most visitors it is the only file they read. So it must answer, in the first screen: what problem this solves, what the result is (with numbers), and how to run it. A useful test: hand the link to a friend with a clean computer and see whether they can reproduce your headline plot without asking you anything.
:::

::: context commit-history A diary the code keeps
Version-control tools such as git record every saved change, called a **commit**, with its date and a short message. Read in order, commits tell the story of how the code came to be. A real history is uneven.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="30" x2="340" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#1d6fd1"><circle cx="30" cy="30" r="5"/><circle cx="60" cy="30" r="5"/><circle cx="82" cy="30" r="5"/><circle cx="140" cy="30" r="5"/><circle cx="152" cy="30" r="5"/><circle cx="210" cy="30" r="5"/><circle cx="262" cy="30" r="5"/><circle cx="330" cy="30" r="5"/></g>
  <circle cx="110" cy="30" r="5" fill="#b4232c"/><circle cx="240" cy="30" r="5" fill="#b4232c"/>
  <text x="20" y="55" font-size="11" fill="#1f2a44">real: small steps, reverts (red), fixes</text>
  <line x1="20" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="330" cy="80" r="7" fill="#6c7a93"/>
  <text x="20" y="102" font-size="11" fill="#6c7a93">suspicious: one "initial commit" with everything</text>
</svg>
```

Nobody expects a perfect history. Reviewers are reassured by one that looks like a person thinking.
:::

::: context fixed-seed Making randomness repeatable
Computers make "random" numbers from a starting value called a **seed**. Start from the same seed and you get exactly the same sequence every time. So a Monte Carlo campaign run with a fixed, recorded seed can be reproduced bit for bit by anyone — which turns "trust me, it was 10,000 cases" into "run this command and see". The code example in this lesson uses seed 42 for exactly that reason.
:::
