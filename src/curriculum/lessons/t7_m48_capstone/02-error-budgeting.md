---
id: l02-error-budgeting
title: Error budgeting for a landing-accuracy requirement
minutes: 20
covers:
  - 'Error budgeting: allocating a landing-accuracy requirement across navigation, guidance and control'
---

A landing-accuracy requirement is a single number — this module's reference vehicle is required to touch down within a $10\,\mathrm m$ radius of the pad, $99.87\%$ of the time. Nobody builds a filter, a guidance law and a controller directly against a single number like that. An error budget is the tool that turns it into something buildable: a separate, smaller number for navigation, for guidance and for control, each one a requirement a single engineer can design and verify against, chosen so that combining all of them honestly reproduces the number the mission actually needs.

Get the order of operations right and the budget is a design tool, built before a line of the stack exists, that tells you where to spend effort and money. Get it backward — measure what you happened to build, then call the measurement a budget — and it becomes an autopsy report with a more flattering name, incapable of telling you anything you didn't already know. This lesson builds the budget the right way round, all the way down to the sensor error terms that actually drive it, using the reference vehicle's own numbers.

## From a percentile requirement to a one-sigma number

A $99.87\%$ requirement is, for a roughly Gaussian error, the three-sigma point: the familiar one-dimensional Gaussian fact that $99.73\%$ of the distribution's mass sits within three standard deviations of the mean carries over, with the same numeral, to a mission requirement stated the same way. Treat the $10\,\mathrm m$ landing-accuracy requirement as a three-sigma radius, and the *one-sigma* budget every subsystem's own requirement is measured against is one third of it:

$$
\sigma_{\text{total}} = \frac{R_{\text{req}}}{3} = \frac{10\,\mathrm m}{3} = 3.33\,\mathrm m.
$$

Every number the rest of this lesson allocates is a one-sigma number, because one-sigma quantities are the ones that combine by the simple rule the next section uses. Converting back to a percentile at the end, when the campaign reports its own measured spread, is the job of the Monte-Carlo lesson later in this module — this lesson stays in one-sigma units throughout.

## Root-sum-square combination, and the assumption it rests on

Treat the miss distance's four leading contributors — navigation error at touchdown, guidance error, control tracking error, and knowledge error in the landing site's own surveyed position — as random variables. If they are **independent**, the variance of their sum is the sum of their variances, an identity from the earlier probability module that this lesson leans on rather than re-derives:

$$
\sigma_{\text{total}}^2 = \sigma_{\text{nav}}^2 + \sigma_{\text{guid}}^2 + \sigma_{\text{ctrl}}^2 + \sigma_{\text{site}}^2 .
$$

Standard deviations do not add; variances do, so a budget is allocated by choosing four numbers whose *squares* sum to at most $\sigma_{\text{total}}^2$, not four numbers that sum to $\sigma_{\text{total}}$. This single fact is the entire content of "root-sum-square," and it is worth being precise about it, because the two combination rules give very different answers: four equal $1.67\,\mathrm m$ contributions sum linearly to the full $6.67\,\mathrm m$, but combine by root-sum-square to only $3.33\,\mathrm m$ — the whole budget, from four contributors each less than half of it.

::: key Root-sum-square combination
For independent contributors, $\sigma_{\text{total}}^2 = \sum_i \sigma_i^2$. A budget allocates one-sigma numbers to each contributor such that their squares sum to no more than the one-sigma total, leaving explicit margin. Standard deviations combine in quadrature, not linearly — a contributor at $60\%$ of the total budget uses only $36\%$ of the *variance* budget.
:::

The word **independent** is carrying real weight, and it is worth naming exactly where it is false before it causes a surprise later. Navigation error and control tracking error are not, in fact, independent: a wind gust perturbs the vehicle's true trajectory, which both the accelerometer senses (feeding into what the filter estimates) and the controller has to fight (feeding into tracking error), through the same physical gust. Treating them as independent is a modeling choice, not a fact about the vehicle, and it is one this budget makes explicitly rather than silently — the alternative, a full covariance treatment that carries cross-terms between contributors, is more honest and considerably more work, and a first-pass budget is entitled to start with the simpler assumption as long as it says so.

::: example The top-level allocation
Requirement: $\sigma_{\text{total}} = 3.33\,\mathrm m$. Allocate:

| Contributor | One-sigma allocation (m) | Square (m²) |
| --- | --- | --- |
| Navigation | $2.2$ | $4.84$ |
| Guidance | $1.5$ | $2.25$ |
| Control | $1.2$ | $1.44$ |
| Site knowledge | $0.8$ | $0.64$ |

$$
\sigma_{\text{alloc}} = \sqrt{4.84+2.25+1.44+0.64} = \sqrt{9.17} \approx 3.03\,\mathrm m,
$$

against the $3.33\,\mathrm m$ requirement — a margin of $3.33-3.03\approx0.31\,\mathrm m$, about $9\%$ of the total budget, held in reserve rather than spent. Navigation gets the largest single share because, as the next lesson in this module shows directly, it is the contributor every other one depends on: guidance solves from the navigation estimate, and control tracks a target guidance built on it.
:::

## Pushing one allocation down to its drivers

An allocation of $2.2\,\mathrm m$ to "navigation" is not yet something a navigation engineer can design against; it has to be pushed down again, to the actual physical error sources a filter and its sensor suite contribute. For touchdown position error specifically, the leading drivers are IMU bias integrated over the time since the last usable fix, radar-altimeter bias, the lever-arm offset between the IMU and the point on the vehicle guidance actually cares about, and the latency between when a measurement is taken and when its correction reaches the navigation solution.

::: example Pushing navigation's allocation down one level
| Driver | One-sigma allocation (m) | Square (m²) |
| --- | --- | --- |
| IMU bias-driven drift | $1.6$ | $2.56$ |
| Radar-altimeter bias | $0.8$ | $0.64$ |
| Lever-arm error | $0.6$ | $0.36$ |
| Timestamp latency | $0.8$ | $0.64$ |

$$
\sigma_{\text{nav}} = \sqrt{2.56+0.64+0.36+0.64} = \sqrt{4.20} \approx 2.05\,\mathrm m,
$$

against the $2.2\,\mathrm m$ navigation allocation — another $0.15\,\mathrm m$ of margin, one level down. Each of these four numbers is now something a specific piece of hardware or a specific piece of code is responsible for: an IMU bias specification, an altimeter calibration, a mechanical measurement, a scheduling deadline. That traceability, an allocation an engineer can actually be held to, is the entire point of pushing the tree down another level rather than stopping at "navigation: $2.2\,\mathrm m$."
:::

This is also where the biggest single lever usually appears, and it is worth asking the question explicitly rather than leaving it implicit: of the four navigation drivers above, IMU bias-driven drift dominates the sub-budget, contributing $2.56$ of the $4.20\,\mathrm{m^2}$ total — over $60\%$ of the *variance*, from one term. Halving that one contributor, to $0.8\,\mathrm m$, would shrink the navigation sub-total from $2.05\,\mathrm m$ to $\sqrt{0.64+0.64+0.36+0.64}=\sqrt{2.28}\approx1.51\,\mathrm m$ — a bigger improvement than halving any of the other three terms individually, because root-sum-square combination means effort spent on the dominant contributor buys more than the same effort spent anywhere else.

::: warning A budget that has never been verified is a guess wearing a spreadsheet
Every number in the two tables above was chosen, not measured — a legitimate first pass, but only a first pass. The Monte-Carlo lesson later in this module runs the whole stack and measures each contributor's actual, empirical spread, and the honest next step, once that campaign exists, is to compare the measured numbers against this chapter's allocation and investigate every place they disagree. A budget nobody ever checks against a real campaign is not wrong in any way you can detect — it is simply never tested, which is a different and in some ways worse problem.
:::

::: warning This budget answers one question, and only one
Everything in this lesson bounds *miss distance* — how far from the pad the vehicle lands. It says nothing at all about touchdown velocity, propellant margin, or any other way a landing can fail the mission while landing exactly on target. A vehicle that satisfies every term in this chapter's budget to the letter and still comes down too fast has not violated this budget in any way — because this budget was never asked about speed. The Monte-Carlo lesson late in this module scores the campaign against a composite criterion for exactly this reason, and the gap between what this chapter budgets and what that later criterion checks is itself one of this module's more instructive findings.
:::

## Check yourself

::: check
Explain, from the variance-addition identity, why four independent one-sigma contributors of $1.67\,\mathrm m$ each combine to a total of $3.33\,\mathrm m$ by root-sum-square, not $6.67\,\mathrm m$.
:::

::: answer
Root-sum-square combination sums the *squares*: $4\times1.67^2 = 4\times2.789 = 11.156\,\mathrm{m^2}$, and $\sqrt{11.156}\approx3.34\,\mathrm m$ — matching the total to rounding. Adding the standard deviations directly, $4\times1.67=6.67\,\mathrm m$, would be the right combination rule only if the four contributors always pointed the same direction at once, which independent random variables do not; the quadratic combination is smaller because unrelated errors partially cancel rather than always stacking.
:::

::: check
A colleague proposes simplifying the budget by assuming navigation error and control tracking error are independent, since they are estimated and controlled by entirely separate pieces of code. Is separate code enough to justify the independence assumption? Give the specific physical mechanism that argues otherwise.
:::

::: answer
No — independence is a claim about the underlying random variables, not about which code computes them. A wind gust during the landing burn perturbs the vehicle's true trajectory once, and that single physical event shows up in both places at once: the accelerometer senses the resulting specific-force disturbance, entering the navigation solution, while the controller has to fight the same gust's effect on the vehicle's attitude and rate, entering control tracking error. Both errors trace back to one shared physical cause, so treating them as independent is a simplifying assumption this lesson makes explicitly, not a fact that separate code modules would guarantee.
:::

::: check
In the navigation sub-budget, IMU bias-driven drift is allocated $1.6\,\mathrm m$ against a $2.2\,\mathrm m$ navigation total. Compute what fraction of the navigation sub-budget's *variance* this one term consumes, and explain why that fraction matters more than its fraction of the linear allocation.
:::

::: answer
The term contributes $1.6^2=2.56\,\mathrm{m^2}$ out of the sub-budget's total $4.20\,\mathrm{m^2}$, which is $2.56/4.20\approx61\%$ — well over its $1.6/2.05\approx78\%$... the linear share looks large already, but the *variance* share is what actually determines how much improving this one term helps, because root-sum-square combination means the total shrinks in proportion to how much a change in one squared term changes the sum under the square root; a term holding the majority of the variance is the one where effort spent buys the most reduction in the combined total, which is exactly the lever this lesson identifies for halving it.
:::

::: check
A program reports, after its first Monte Carlo campaign, that measured control tracking error is $2.1\,\mathrm m$ one-sigma — nearly double this lesson's $1.2\,\mathrm m$ allocation — while measured navigation error is only $0.3\,\mathrm m$, far under its $2.2\,\mathrm m$ allocation. What is the correct response, and what is not?
:::

::: answer
The correct response is to treat this as exactly the disagreement the budget exists to surface: investigate why control tracking error is running nearly double its allocation — a gain-scheduling shortfall, an actuator limit not accounted for, an underestimated disturbance — since the combined total may still be within requirement only because navigation happened to outperform its own allocation by a wide margin, which is not something a program should rely on by luck. The incorrect response is to quietly widen the control allocation to match what was measured and declare the budget satisfied; that converts the budget from a requirement into an after-the-fact description of whatever the vehicle happened to do, exactly the "autopsy" failure mode this lesson opened by warning against.
:::

::: check
Why does this lesson convert the $99.87\%$ mission requirement to a one-sigma number before allocating anything, rather than allocating percentile requirements directly to each contributor?
:::

::: answer
Root-sum-square combination is a statement about variances of independent random variables, and percentiles do not combine that way in general — a $99.87\%$ point for a navigation error and a $99.87\%$ point for a control error do not sum, by any simple rule, to a $99.87\%$ point for their combination, especially once the combined distribution is no longer a clean single Gaussian. Standard deviations, by contrast, combine by the exact identity this lesson used throughout. Working in one-sigma units keeps every step of the allocation on the same, additive footing, and the conversion back to a percentile claim is deferred to wherever the actual distribution of the combined error is known — the Monte-Carlo campaign later in this module.
:::

## Summary

| Quantity or rule | Value or statement |
| --- | --- |
| Requirement | $10\,\mathrm m$ radius at $99.87\%$ ($3\sigma$) |
| One-sigma total | $\sigma_{\text{total}} = R_{\text{req}}/3 \approx 3.33\,\mathrm m$ |
| Combination rule | $\sigma_{\text{total}}^2=\sum_i\sigma_i^2$ for independent contributors — variances add, not standard deviations |
| Top-level allocation | nav $2.2\,\mathrm m$, guidance $1.5\,\mathrm m$, control $1.2\,\mathrm m$, site $0.8\,\mathrm m$; RSS $\approx3.03\,\mathrm m$, margin $\approx0.31\,\mathrm m$ |
| Navigation pushed down | IMU $1.6$, altimeter $0.8$, lever-arm $0.6$, latency $0.8\,\mathrm m$; RSS $\approx2.05\,\mathrm m$ |
| Independence caveat | Nav and control errors correlate through a shared disturbance (e.g. wind) — the RSS assumption is explicit, not exact |
| What the budget does not cover | Touchdown velocity, propellant margin, and any failure mode this budget's four terms were never asked about |

The budget in this lesson answers "how accurate does each piece have to be." The next lesson answers a different question the same requirement forces on the design: how *often* each piece is allowed to speak at all — the rate each of navigation, guidance, control and mode management runs at, and what happens at the boundary between two rates that were each chosen correctly on their own.
