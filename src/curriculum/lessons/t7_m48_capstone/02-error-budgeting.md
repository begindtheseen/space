---
id: l02-error-budgeting
title: Error budgeting for a landing-accuracy requirement
minutes: 18
covers:
  - 'Error budgeting: allocating a landing-accuracy requirement across navigation, guidance and control'
---

Think about a family's monthly money. There is one number that matters — what comes in. Nobody spends against that one number directly. Instead they split it: so much for rent, so much for food, so much for the car, and a little set aside for surprises. Each piece is small enough for one person to manage. Added back up, the pieces must fit inside the whole.

A landing-accuracy requirement works the same way. This module's reference vehicle must touch down within a $10\,\mathrm m$ radius of the pad, $99.87\%$ of the time. Nobody builds a filter, a guidance law and a controller directly against one number like that. An **[[error budget|budget-word]]** is the tool that makes it buildable. It is a separate, smaller number for navigation, for guidance and for control — each one a requirement a single engineer can design and verify against — chosen so that combining them honestly gives back the number the mission needs.

Do the steps in the right order and the budget is a design tool. You build it before a line of the stack exists, and it tells you where to spend effort and money. Do it backward — measure what you happened to build, then call the measurement a budget — and it becomes an autopsy report with a nicer name. It can tell you nothing you did not already know. This lesson builds the budget the right way round, all the way down to the sensor errors that drive it, using the reference vehicle's numbers.

::: key Error budget method
Decompose the vehicle requirement into navigation, guidance, control and site-knowledge contributions; allocate with explicit margin; root-sum-square; push each allocation down to its drivers; then verify bottom-up against the measured Monte Carlo breakdown.
:::

The rest of the lesson takes those steps one at a time.

## From a percentile requirement to a one-sigma number

Picture a big class taking a test. Most scores bunch near the average, and fewer and fewer students land far above or far below it. The spread has a standard size, called the **[[standard deviation|sigma]]** and written $\sigma$ (the Greek letter "sigma"). For a bell-shaped, or **Gaussian**, spread there are well-known facts about how much lies within a few sigmas:

- $99.73\%$ lies within three sigmas *either side* of the average.
- $99.87\%$ lies *below* three sigmas above the average. That is the $99.73\%$ in the middle, plus the $0.13\%$ low tail.

So "$99.87\%$" is the engineer's way of saying "three sigma" for a requirement with a limit on one side: a miss can be too big, but never "too small". By that common convention, treat the $10\,\mathrm m$ requirement as a three-sigma radius. The **one-sigma** budget — the size every subsystem's own requirement is measured against — is one third of it:

$$
\sigma_{\text{total}} = \frac{R_{\text{req}}}{3} = \frac{10\,\mathrm m}{3} = 3.33\,\mathrm m.
$$

Read $\sigma_{\text{total}}$ as "sigma total" and $R_{\text{req}}$ as "R required".

Every number this lesson allocates is a one-sigma number, because one-sigma numbers combine by the simple rule in the next section. Turning the answer back into a percentage at the end, once a campaign has measured the real spread, is the job of the Monte Carlo lesson later in this module. This lesson stays in one-sigma units throughout.

::: warning "Divide by three" is a convention, not an exact law for a landing circle
A miss on the ground has two directions, downrange and crossrange. If each direction has the same one-sigma error $\sigma$, a circle of radius $3\sigma$ holds only about $98.9\%$ of landings, not $99.87\%$. To truly hold $99.87\%$ in a circle you need a radius of about $3.64\sigma$ — so, strictly, $\sigma$ per axis could be at most $10/3.64 \approx 2.75\,\mathrm m$. The budget below follows the everyday "divide by three" rule and keeps the margin in view. The real percentage is settled only by the Monte Carlo campaign, which measures the actual distribution of misses instead of assuming its shape.
:::

## Root-sum-square combination, and the assumption it rests on

Walk $3\,\mathrm m$ east and then $4\,\mathrm m$ north. You are not $7\,\mathrm m$ from where you started. You are $5\,\mathrm m$ away, because the two walks point in different directions and partly miss each other. Errors from unrelated causes behave the same way.

Take the four main contributors to the miss distance:

- navigation error at touchdown,
- guidance error,
- control tracking error,
- error in how well we know where the pad itself is — **[[site knowledge|site-survey]]**.

Treat each as a random quantity. If they are **independent** — none of them affects or shares a cause with any other — then the spread of their sum obeys a simple rule. The **[[variance|pythagoras]]**, which is the standard deviation squared, of the sum equals the sum of the variances. This identity comes from the earlier probability module, and this lesson uses it rather than proving it again:

$$
\sigma_{\text{total}}^2 = \sigma_{\text{nav}}^2 + \sigma_{\text{guid}}^2 + \sigma_{\text{ctrl}}^2 + \sigma_{\text{site}}^2 .
$$

Standard deviations do not add; variances do. So you allocate a budget by choosing four numbers whose *squares* add up to at most $\sigma_{\text{total}}^2$ — not four numbers that add up to $\sigma_{\text{total}}$. That one fact is the whole meaning of **root-sum-square**, or **RSS**: square each, sum them, take the square root.

The two rules give very different answers. Take four equal contributions of $1.67\,\mathrm m$. Added straight, they make $4 \times 1.67 = 6.67\,\mathrm m$. Combined by RSS they make only $3.33\,\mathrm m$ — the whole budget, from four pieces each less than half of it.

::: key Root-sum-square combination
For independent contributors, $\sigma_{\text{total}}^2 = \sum_i \sigma_i^2$. A budget allocates one-sigma numbers to each contributor such that their squares sum to no more than the one-sigma total, leaving explicit margin. Standard deviations combine in quadrature, not linearly — a contributor at $60\%$ of the total budget uses only $36\%$ of the *variance* budget.
:::

The symbol $\sum_i$ is read "the sum over $i$": add up the term for every contributor. **In quadrature** is another way to say "by root-sum-square", like the two sides of a right triangle.

The word **independent** is doing real work here, so name exactly where it is false before it surprises you later. Navigation error and control tracking error are *not* truly independent. A wind gust pushes the vehicle off its path once. The accelerometer feels that push, and it enters what the filter estimates. The controller has to fight the same push, and it enters the tracking error. One gust, two errors. Treating them as independent is a modeling choice, not a fact about the vehicle, and this budget makes that choice out loud. The more honest alternative carries **[[cross-terms|correlation]]** between contributors in a full covariance treatment. It is a lot more work, and a first-pass budget may start with the simpler assumption as long as it says so.

::: example The top-level allocation
The requirement is $\sigma_{\text{total}} = 3.33\,\mathrm m$. Allocate a one-sigma share to each contributor, and square each one:

| Contributor | One-sigma allocation (m) | Square (m²) |
| --- | --- | --- |
| Navigation | $2.2$ | $4.84$ |
| Guidance | $1.5$ | $2.25$ |
| Control | $1.2$ | $1.44$ |
| Site knowledge | $0.8$ | $0.64$ |

Add the squares and take the square root:

$$
\sigma_{\text{alloc}} = \sqrt{4.84+2.25+1.44+0.64} = \sqrt{9.17} \approx 3.03\,\mathrm m.
$$

Compare with the requirement. The margin is $3.333 - 3.028 \approx 0.305\,\mathrm m$, about $9\%$ of the total budget, held back instead of spent.

Sanity check: the total, $3.03\,\mathrm m$, is bigger than the biggest single piece ($2.2\,\mathrm m$) but far smaller than the straight sum ($5.7\,\mathrm m$). RSS totals always land in that range.

Why does navigation get the largest share? Because, as later lessons in this module show directly, every other contributor depends on it. Guidance solves from the navigation estimate, and control tracks a target that guidance built on it.
:::

## Pushing one allocation down to its drivers

"Navigation: $2.2\,\mathrm m$" is not yet something a navigation engineer can design against. It has to be pushed down one more level, to the physical error sources inside the filter and its sensors. For touchdown position error the main **drivers** — the root causes — are:

- **[[IMU bias|imu-bias]]** drift: a small steady error in the accelerometers, piling up over the time since the last good position fix;
- **radar-altimeter bias**: a steady error in measured height;
- **[[lever-arm|lever-arm]] error**: a mistake in the measured offset between where the IMU sits and the point on the vehicle guidance actually cares about;
- **[[timestamp latency|latency]]**: the delay between when a measurement is taken and when its correction reaches the navigation solution.

::: example Pushing navigation's allocation down one level
Give each driver a one-sigma share, and square each one:

| Driver | One-sigma allocation (m) | Square (m²) |
| --- | --- | --- |
| IMU bias-driven drift | $1.6$ | $2.56$ |
| Radar-altimeter bias | $0.8$ | $0.64$ |
| Lever-arm error | $0.6$ | $0.36$ |
| Timestamp latency | $0.8$ | $0.64$ |

Combine them the same way:

$$
\sigma_{\text{nav}} = \sqrt{2.56+0.64+0.36+0.64} = \sqrt{4.20} \approx 2.05\,\mathrm m.
$$

Against the $2.2\,\mathrm m$ navigation allocation, that leaves another $0.15\,\mathrm m$ of margin, one level down.

Each of these four numbers now belongs to a specific piece of hardware or code: an IMU bias specification, an altimeter calibration, a mechanical measurement, a scheduling deadline. That traceability — an allocation a person can actually be held to — is the whole point of pushing the tree down another level instead of stopping at "navigation: $2.2\,\mathrm m$".
:::

This is also where the biggest single lever usually shows up, so ask the question out loud. Of the four navigation drivers, IMU bias drift dominates. It contributes $2.56$ of the $4.20\,\mathrm{m^2}$ total — over $60\%$ of the **[[variance|variance-share]]**, from one term.

Now try halving it, from $1.6$ to $0.8\,\mathrm m$. Its square drops from $2.56$ to $0.64$, and the navigation sub-total becomes

$$
\sqrt{0.64+0.64+0.36+0.64}=\sqrt{2.28}\approx1.51\,\mathrm m.
$$

Halving the altimeter term instead (to $0.4\,\mathrm m$) gives only $\sqrt{2.56+0.16+0.36+0.64} = \sqrt{3.72} \approx 1.93\,\mathrm m$. Because RSS sums squares, effort spent on the biggest contributor buys more than the same effort spent anywhere else.

::: warning A budget that has never been verified is a guess wearing a spreadsheet
Every number in the two tables above was chosen, not measured. That is a fine first pass, but only a first pass. The **[[Monte Carlo lesson|monte-carlo]]** later in this module runs the whole stack many times and measures each contributor's real spread. The honest next step, once that campaign exists, is to compare the measured numbers with this allocation and chase down every place they disagree. A budget nobody ever checks against a real campaign is not wrong in any way you can detect. It is never tested — a different problem, and in some ways a worse one.
:::

::: warning This budget answers one question, and only one
Everything in this lesson bounds *miss distance* — how far from the pad the vehicle lands. It says nothing about touchdown speed, propellant left over, or any other way a landing can fail while landing exactly on target. A vehicle that meets every term of this budget and still comes down too fast has not broken this budget at all, because this budget was never asked about speed. The Monte Carlo lesson scores the campaign against a combined pass/fail rule for exactly this reason. The gap between what this lesson budgets and what that later rule checks is one of this module's more useful findings.
:::

## Check yourself

::: check
Using the rule that variances add, explain why four independent one-sigma contributors of $1.67\,\mathrm m$ each combine to $3.33\,\mathrm m$ by root-sum-square, not $6.67\,\mathrm m$.
:::

::: answer
Root-sum-square adds the *squares*: $4\times1.67^2 = 4\times2.789 = 11.156\,\mathrm{m^2}$. The square root is $\sqrt{11.156}\approx3.34\,\mathrm m$, which matches $3.33\,\mathrm m$ up to rounding.

Adding the standard deviations straight, $4\times1.67=6.67\,\mathrm m$, would be the right rule only if all four errors always pointed the same way at the same time. Independent errors do not. They partly cancel instead of always stacking, so the combined spread is smaller.
:::

::: check
A colleague proposes treating navigation error and control tracking error as independent, since they are estimated and controlled by entirely separate pieces of code. Is separate code enough to justify that? Give the physical mechanism that argues otherwise.
:::

::: answer
No. Independence is a claim about the random quantities themselves, not about which code computes them.

A wind gust during the landing burn pushes the vehicle off its path once. That single event shows up in two places. The accelerometer senses the push, so it enters the navigation solution. The controller has to fight the same gust's effect on attitude and turn rate, so it enters the tracking error.

Both errors come from one shared physical cause. Treating them as independent is a simplifying assumption this lesson makes out loud. Separate code modules do not make it true.
:::

::: check
In the navigation sub-budget, IMU bias drift is allocated $1.6\,\mathrm m$ against a $2.05\,\mathrm m$ combined sub-total. What fraction of the sub-budget's *variance* does this one term use? Use it to explain why halving this term is a better use of effort than halving any of the other three.
:::

::: answer
The term contributes $1.6^2=2.56\,\mathrm{m^2}$ of the sub-total's $4.20\,\mathrm{m^2}$, which is $2.56/4.20\approx61\%$ of the *variance*. That is more than the other three drivers combined. Its straight share ($1.6$ of $2.05\,\mathrm m$, about $78\%$) already looked dominant.

RSS adds squares, so shrinking the largest squared term removes the most from the sum under the square root. Halving this driver to $0.8\,\mathrm m$ drops the total from $2.05\,\mathrm m$ to about $1.51\,\mathrm m$. Halving the $0.8\,\mathrm m$ altimeter or latency term instead only reaches about $1.93\,\mathrm m$. The biggest term started as the biggest part of the sum, so cutting it pays the most.
:::

::: check
After its first Monte Carlo campaign, a program reports that measured control tracking error is $2.1\,\mathrm m$ one-sigma — nearly double this lesson's $1.2\,\mathrm m$ allocation — while measured navigation error is only $0.3\,\mathrm m$, far under its $2.2\,\mathrm m$ allocation. What is the correct response, and what is not?
:::

::: answer
The correct response is to treat this as exactly the disagreement the budget exists to reveal. Investigate why control tracking error is running at nearly double its allocation. Candidates: a gain schedule that falls short, an actuator limit nobody accounted for, a disturbance that was underestimated. The combined total may still meet the requirement — but only because navigation happened to beat its own allocation by a wide margin. A program should not rely on that kind of luck.

The incorrect response is to quietly widen the control allocation to match the measurement and declare the budget met. That turns the budget from a requirement into an after-the-fact description of whatever the vehicle did — the "autopsy" failure this lesson opened by warning against.
:::

::: check
Why does this lesson turn the $99.87\%$ mission requirement into a one-sigma number before allocating anything, instead of handing each contributor its own percentile requirement?
:::

::: answer
Root-sum-square is a rule about the variances of independent random quantities. Percentiles do not combine that way in general. A $99.87\%$ point for navigation error and a $99.87\%$ point for control error do not add, by any simple rule, to a $99.87\%$ point for the two together — especially once the combined spread is no longer a clean bell curve.

Standard deviations, by contrast, combine by the exact identity used throughout this lesson. Working in one-sigma units keeps every step on the same additive footing. Turning the result back into a percentage waits until the real distribution of the combined error is known — in the Monte Carlo campaign later in this module.
:::

## Summary

| Quantity or rule | Value or statement |
| --- | --- |
| Requirement | $10\,\mathrm m$ radius at $99.87\%$ ($3\sigma$) |
| One-sigma total | $\sigma_{\text{total}} = R_{\text{req}}/3 \approx 3.33\,\mathrm m$ |
| Combination rule | $\sigma_{\text{total}}^2=\sum_i\sigma_i^2$ for independent contributors — variances add, not standard deviations |
| Top-level allocation | nav $2.2\,\mathrm m$, guidance $1.5\,\mathrm m$, control $1.2\,\mathrm m$, site $0.8\,\mathrm m$; RSS $\approx3.03\,\mathrm m$, margin $\approx0.305\,\mathrm m$ |
| Navigation pushed down | IMU $1.6$, altimeter $0.8$, lever-arm $0.6$, latency $0.8\,\mathrm m$; RSS $\approx2.05\,\mathrm m$ |
| Independence caveat | Nav and control errors correlate through a shared disturbance (e.g. wind) — the RSS assumption is explicit, not exact |
| Circle caveat | a $3\sigma$ circle in two directions holds about $98.9\%$; the campaign, not the convention, settles the percentage |
| What the budget does not cover | Touchdown velocity, propellant margin, and any failure mode this budget's four terms were never asked about |

This budget answers "how accurate does each piece have to be?" The next lesson answers a different question the same requirement forces on the design: how *often* each piece gets to speak. That is the rate each of navigation, guidance, control and mode management runs at — and what happens at the boundary between two rates that were each chosen well on their own.

::: context budget-word Where "budget" comes from
The word comes from an old French word for a small leather bag — a purse. A money budget splits the purse among needs. Engineers borrowed the word for anything scarce that must be shared out: a **mass budget** (how many kilograms each subsystem may weigh), a **power budget**, a **pointing budget** for a telescope, and the **error budget** here.

They all work the same way. Top-down allocation first, a reserve held back, then bottom-up checking as real numbers arrive. What differs is the adding rule. Masses add straight. Independent errors add by root-sum-square.
:::

::: context sigma The bell curve and its sigmas
The bell curve is the shape many random errors take. Its width is measured in standard deviations, $\sigma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <polygon points="30.0,120.0 33.8,120.0 37.5,119.9 41.2,119.9 45.0,119.9 48.8,119.8 52.5,119.7 56.2,119.6 60.0,119.5 63.8,119.3 67.5,119.0 71.2,118.7 75.0,118.2 78.8,117.6 82.5,116.9 86.2,116.0 90.0,114.9 93.8,113.6 97.5,112.0 101.3,110.1 105.0,107.8 108.8,105.2 112.5,102.2 116.2,98.8 120.0,95.0 123.8,90.8 127.5,86.2 131.2,81.3 135.0,76.2 138.8,70.9 142.5,65.4 146.2,60.0 150.0,54.6 153.8,49.6 157.5,44.8 161.2,40.6 165.0,36.9 168.8,34.0 172.5,31.8 176.2,30.4 180.0,30.0 183.8,30.4 187.5,31.8 191.2,34.0 195.0,36.9 198.8,40.6 202.5,44.8 206.2,49.6 210.0,54.6 213.8,60.0 217.5,65.4 221.3,70.9 225.0,76.2 228.8,81.3 232.5,86.2 236.2,90.8 240.0,95.0 243.8,98.8 247.5,102.2 251.2,105.2 255.0,107.8 258.8,110.1 262.5,112.0 266.2,113.6 270.0,114.9 273.8,116.0 277.5,116.9 281.2,117.6 285.0,118.2 288.8,118.7 292.5,119.0 292.5,120.0" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="292.5,119.0 296.2,119.3 300.0,119.5 303.8,119.6 307.5,119.7 311.2,119.8 315.0,119.9 318.8,119.9 322.5,119.9 326.2,120.0 330.0,120.0 292.5,120.0" fill="#b4232c" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1"><line x1="67.5" y1="120" x2="67.5" y2="126"/><line x1="105" y1="120" x2="105" y2="126"/><line x1="142.5" y1="120" x2="142.5" y2="126"/><line x1="180" y1="120" x2="180" y2="126"/><line x1="217.5" y1="120" x2="217.5" y2="126"/><line x1="255" y1="120" x2="255" y2="126"/><line x1="292.5" y1="120" x2="292.5" y2="126"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="67.5" y="139">−3σ</text><text x="142.5" y="139">−σ</text><text x="180" y="139">0</text><text x="217.5" y="139">+σ</text><text x="292.5" y="139">+3σ</text></g>
  <text x="180" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">99.87% below +3σ</text>
  <text x="318" y="105" font-size="11" text-anchor="middle" fill="#b4232c">0.13%</text>
</svg>
```

The blue area is everything below $+3\sigma$: $99.87\%$ of the whole. The thin red tail beyond it is the $0.13\%$ that fails. Trim both tails at $\pm3\sigma$ instead and $99.73\%$ remains.
:::

::: context site-survey Knowing where the pad is
The vehicle can steer perfectly to where it *thinks* the pad is and still miss, if the pad's coordinates are wrong. Landing pads are surveyed — measured with precise ground GNSS equipment — to fix their position.

The survey's own error, and any mix-up about which reference model of the Earth the coordinates use, go straight into the miss distance. Nothing on the vehicle can correct them, which is why site knowledge gets its own line in the budget.
:::

::: context pythagoras Why errors add like triangle sides
Two independent errors behave like two walks at right angles. Their combined size is the long side of a right triangle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="60,150 220,150 60,30" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="150" x2="220" y2="150" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="60" y1="150" x2="60" y2="30" stroke="#f2b880" stroke-width="4"/>
  <line x1="60" y1="30" x2="220" y2="150" stroke="#b4232c" stroke-width="3"/>
  <polyline points="60,138 72,138 72,150" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="140" y="168" font-size="12" text-anchor="middle" fill="#1d6fd1">error A: 4 m</text>
  <text x="52" y="94" font-size="12" text-anchor="end" fill="#1f2a44">B: 3 m</text>
  <text x="150" y="82" font-size="12" fill="#b4232c">together: 5 m</text>
  <text x="240" y="40" font-size="11" fill="#1f2a44">straight sum: 7 m</text>
  <text x="240" y="56" font-size="11" fill="#1f2a44">RSS: √(16 + 9) = 5 m</text>
</svg>
```

Variance is the square of the side, so squares add — exactly Pythagoras. With more than two independent errors the rule keeps going: square them all, add, take the root.
:::

::: context correlation What a little correlation costs
When two errors share a cause, the rule gains a cross-term: $\sigma^2 = \sigma_a^2 + \sigma_b^2 + 2\rho\,\sigma_a\sigma_b$, where $\rho$ ("rho", the **correlation**) runs from $-1$ to $+1$. Independent means $\rho = 0$.

Try it on this lesson's budget. If navigation ($2.2\,\mathrm m$) and control ($1.2\,\mathrm m$) had $\rho = 0.5$ through a shared wind, the total would grow from $\sqrt{9.17} \approx 3.03\,\mathrm m$ to $\sqrt{9.17 + 2.64} \approx 3.44\,\mathrm m$ — past the $3.33\,\mathrm m$ requirement. A modest correlation can eat the whole margin. That is why the independence assumption has to be written down and later checked.
:::

::: context imu-bias How a tiny bias becomes meters
An accelerometer **bias** is a small steady error: it always reads a little too much, or a little too little. The navigation filter integrates acceleration twice to get position, so a steady bias $b$ grows into a position error of $\tfrac12 b t^2$ — it grows with the *square* of time.

A bias of one thousandth of $g_0$ ($0.0098\,\mathrm{m/s^2}$) left uncorrected for $20\,\mathrm s$ gives $\tfrac12 \times 0.0098 \times 20^2 \approx 1.96\,\mathrm m$. That is the same size as this lesson's $1.6\,\mathrm m$ allocation. It is why fresh GNSS and altimeter fixes near the ground matter so much: each good fix resets the clock on the drift.
:::

::: context lever-arm The IMU is not at the feet
The IMU sits somewhere inside the vehicle, often high up. What must land on the pad are the legs, many meters away. The fixed offset between the two is the **lever arm**.

The filter estimates where the IMU is, then adds the lever arm, turned by the vehicle's current attitude, to find the legs. A mistake in the measured offset moves the answer directly. A tilt makes it worse, because a small attitude error swings the whole lever arm like a door on its hinge.
:::

::: context latency A late measurement is a wrong measurement
A measurement describes where the vehicle was *when it was taken*. If the filter uses it as if it were taken now, the vehicle has moved on in between.

At $70\,\mathrm{m/s}$ of sideways speed, a delay of just $10\,\mathrm{ms}$ that nobody accounts for puts the fix $70 \times 0.01 = 0.7\,\mathrm m$ in the wrong place. That is why every measurement carries a **timestamp**, and why the latency term in the budget is really a promise about the flight computer's scheduling.
:::

::: context variance-share Where the navigation variance goes
Each bar below is one driver's share of the $4.20\,\mathrm{m^2}$ navigation variance, drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="182.9" height="34" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <rect x="212.9" y="30" width="45.7" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="258.6" y="30" width="25.7" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="284.3" y="30" width="45.7" height="34" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <text x="121" y="52" font-size="12" text-anchor="middle" fill="#fff">IMU bias 61%</text>
  <text x="235.7" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">alt 15%</text>
  <text x="271.4" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">lever 9%</text>
  <text x="307.1" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">latency 15%</text>
  <text x="30" y="102" font-size="11" fill="#1f2a44">shares of variance (m²): 2.56, 0.64, 0.36, 0.64</text>
</svg>
```

One driver owns well over half. That is where the next dollar should go.
:::

::: context monte-carlo Checking the budget by rolling dice
A **Monte Carlo** campaign runs the whole simulated landing thousands of times, each time with the uncertain things — winds, sensor biases, masses — drawn at random from their expected spreads. This module's campaign runs ten thousand cases.

It measures what the budget only guessed: the real spread of misses, and how much each contributor added. Lesson 11 runs it and brings back a second column for this lesson's tables — the measured numbers next to the allocated ones.
:::
