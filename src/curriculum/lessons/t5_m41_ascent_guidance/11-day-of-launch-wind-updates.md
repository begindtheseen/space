---
id: l11-day-of-launch-wind-updates
title: Day-of-launch trajectory updates from measured winds
minutes: 14
covers:
  - Day-of-launch trajectory updates from measured winds
---

The offline optimization the previous lesson described does not run only once, months before a vehicle first flies. It runs again, a final time, in the hours before this particular launch — fed the actual wind profile the atmosphere happens to have that day rather than the statistical design case the vehicle was originally sized against. This lesson is about that last update: what gets measured, what it changes, and how much it is worth in the same currency this module has been pricing everything else in — propellant, structural margin, and the kilograms of payload they translate into.

## What gets measured

In the hours before launch, a balloon sounding, a wind lidar, or both, measure the actual wind — speed and direction as a function of altitude — through the layer the vehicle will climb through under high dynamic pressure. Wind at these altitudes is not gentle or uniform: it commonly carries a jet-stream-scale feature near the tropopause, tens of metres per second, sometimes concentrated in a shear layer only a few kilometres thick, sitting close to where this module's earlier lessons placed both max-Q and the peak of the load indicator. That measured profile — not a statistical design-case wind, not the profile used when the vehicle's structure was originally sized — is what feeds the day's version of the offline optimization.

## What the update changes

The optimizer re-solves for a new pitch program biased to fly the vehicle's nose into the *measured* wind rather than a generic reference — **wind biasing** — so that the *mean* angle of attack through the high-dynamic-pressure window is close to zero for the wind that will actually be blowing, not for some other day's wind. Everything about the pitch program this module has treated as fixed — the pitch-kick angle and the gravity-turn shape that follows it — can shift slightly as a result, along with the load-relief gains and any other gain schedule that depends on the expected disturbance. The onboard guidance algorithm itself does not change at all; only the numbers it is handed do, exactly as the previous lesson's summary put it.

::: key
Day-of-launch update: the offline pitch-program optimization is re-run in the hours before launch using the actual measured wind profile, biasing the vehicle to fly nose-into that wind so mean angle of attack — and hence the load indicator — stays small for the wind that is actually present, not a statistical worst case.
:::

## What an unbiased wind actually costs

This module's second lesson showed how little angle of attack a launch vehicle's structure can tolerate at max dynamic pressure. Put a realistic jet-stream crosswind through that same arithmetic and the stakes become concrete.

::: example A crosswind, biased and unbiased
At this module's max-Q point — $\bar q = 44.6\ \mathrm{kPa}$, air-relative speed $V = 880.4\ \mathrm{m/s}$ — suppose a 45 m/s crosswind component is present, a realistic jet-stream-scale value near the tropopause. Flown with no wind bias at all, the wind alone produces an angle of attack

$$
\alpha = \arctan\!\left(\frac{45}{880.4}\right) = 2.926^\circ,
$$

giving a load indicator $\bar q\alpha = 44.6 \times 2.926 = 130.5\ \mathrm{kPa\cdot deg}$ — on its own, with no other error source at all, already past a typical 100 kPa·deg certified envelope. A wind this ordinary, left completely uncorrected, would be a structural problem by itself.

Bias the pitch program into the *measured* wind and only the forecast or measurement error remains as residual crosswind. Even an imperfect bias, accurate to only 30% of the true wind (a conservative allowance for measurement and modeling uncertainty), leaves a 13.5 m/s residual: $\alpha = 0.879^\circ$, $\bar q\alpha = 39.2\ \mathrm{kPa\cdot deg}$ — comfortably inside the envelope. A bias accurate to 20% leaves 9.0 m/s residual and $\bar q\alpha = 26.1\ \mathrm{kPa\cdot deg}$; accurate to 10%, 4.5 m/s and $\bar q\alpha = 13.1\ \mathrm{kPa\cdot deg}$. The update does not need to be perfect to matter enormously — cutting the *uncorrected* wind's contribution by even a modest fraction moves the load indicator from a structural violation to a small, ordinary contributor.
:::

::: warning
Wind biasing corrects for the *mean* of the measured profile, not gusts or shear on top of it. The residual angle of attack in the example above is what is left after biasing for the measured wind itself; the load-relief control law this module discussed in its own lesson on the subject is what handles the turbulence and shear a static wind-bias update cannot anticipate, and the two work together rather than one replacing the other.
:::

## What the accuracy buys back

A vehicle whose structure and pitch program were sized against a statistical worst-case wind envelope — one large enough to cover nearly every day the vehicle might ever launch on — carries margin on every ordinary day it does not need, because the design had no way to know in advance which day would be calm and which would be windy. The day-of-launch update converts that always-conservative picture into a specific one: on a calmer-than-worst-case day, less of the load budget needs to be reserved for wind at all, freeing margin the previous lesson's constrained optimization can spend elsewhere.

::: example What margin a calm day actually recovers
The previous lesson's constrained optimization found the unconstrained, loss-minimizing kick angle for this module's vehicle sits near $2.70^\circ$, costing $99.1\ \mathrm{m/s}$ less gravity-and-drag loss than the $2.0^\circ$ this module has flown throughout — but at $2.70^\circ$ max-$\bar q$ alone is already 84.4 kPa, leaving no room for *any* wind contribution on top of it before a 100 kPa·deg envelope is gone. A vehicle sized to survive a worst-case wind envelope at a fixed, unbiased pitch program has to sit well short of that loss-minimizing angle to leave room for the largest wind it might ever see; a vehicle whose pitch program is re-optimized for the *actual, measured* wind on a below-worst-case day — this lesson's 45 m/s example, biased down to a few kPa·deg of residual load — needs far less of that margin reserved for wind, and can sit closer to the $2.70^\circ$ side, recovering some fraction of that $99.1\ \mathrm{m/s}$ as extra performance on that specific day.
:::

That recovered margin is precisely converting, as the flashcard for this idea puts it, a worst-case design problem into a day-specific one, and it buys both payload and launch availability at once: a marginal wind day that a fixed, unbiased design would have to scrub can instead fly, biased, inside the same structural envelope.

## Check yourself

::: check
Compute the load indicator from a 30 m/s crosswind, unbiased, at this module's max-Q condition ($\bar q = 44.6\ \mathrm{kPa}$, $V = 880.4\ \mathrm{m/s}$), and state whether it alone would threaten a 100 kPa·deg envelope.
:::

::: answer
$\alpha = \arctan(30/880.4) = 1.952^\circ$, so $\bar q\alpha = 44.6 \times 1.952 = 87.0\ \mathrm{kPa\cdot deg}$ — below a 100 kPa·deg envelope on its own, but leaving only about 13 kPa·deg of margin for every other contributor (residual bias error, gusts, control error) combined, which is a thin margin for a single, moderate crosswind left completely unbiased.
:::

::: check
Explain why the day-of-launch update changes the pitch program's numbers but not the onboard guidance algorithm's code.
:::

::: answer
The pitch program is a stored, open-loop attitude-versus-time table, and the update re-runs the same offline optimization this module's previous lesson described with a new input — the measured wind profile — producing new numbers for that same table. It does not touch the onboard guidance software at all, whether that is the open-loop atmospheric steering or the exoatmospheric explicit guidance this module built in detail; those algorithms take the pitch program (or, later, the target orbit) as an input regardless of how that input was generated, so changing the input changes what is flown without changing what is running.
:::

::: check
Why does even an imperfect wind bias — accurate to only 30% of the true wind — recover most of the benefit, rather than needing near-perfect wind knowledge to be worthwhile?
:::

::: answer
The load indicator scales with the *residual* angle of attack after biasing, not the raw wind magnitude, and the relationship between crosswind and angle of attack is a simple ratio ($\alpha \approx W/V$ for small angles) — cutting the effective wind by 70% cuts the resulting angle of attack, and hence the load indicator, by the same 70%. Since the unbiased case in this lesson's example already overshoots a typical envelope by 30%, even a 70% reduction in the effective wind is enough to bring the load indicator back under it, which is why a good-but-imperfect measurement is worth having rather than only a perfect one.
:::

::: check
A mission is scrubbed on a day when measured upper-level winds exceed what any pitch-program bias can bring inside the structural envelope. Is this a failure of the day-of-launch update process?
:::

::: answer
No — it is the process working as intended. The update's job is to make the vehicle's performance and structural margin specific to the actual wind on a given day, which on most days recovers margin a worst-case design would otherwise waste; on a day whose wind is severe enough that no achievable bias keeps the load indicator inside the envelope, correctly identifying that and scrubbing is the update doing its job, not failing at it. The alternative — flying anyway on the hope that a bias too small to matter will be enough — is exactly the outcome the whole procedure exists to prevent.
:::

::: check
Using the trade described in this lesson, explain in your own words why "day-of-launch update" is as much a payload question as a safety question.
:::

::: answer
The offline pitch-program optimization is constrained by the structural load envelope, and the previous lesson showed the loss-minimizing (propellant-cheapest) kick angle sits well past where an unbiased, worst-case-wind design can safely fly. A day-of-launch update that replaces a worst-case wind assumption with the actual, usually milder, measured wind frees part of the load budget the worst-case design had to reserve, letting that day's pitch program sit closer to the loss-minimizing angle and use correspondingly less propellant for the same orbit — which is directly convertible, kilogram for kilogram, into extra payload capability on an average day, not only into a safety margin on a severe one.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Day-of-launch update | offline pitch-program optimization re-run hours before launch, using measured (not design-case) wind |
| Wind biasing | flies the vehicle's nose into the measured wind so mean angle of attack stays near zero for that day's wind |
| Unbiased 45 m/s crosswind at max-Q | $\alpha = 2.926^\circ$, $\bar q\alpha = 130.5\ \mathrm{kPa\cdot deg}$ — alone exceeds a typical 100 kPa·deg envelope |
| Biased to 20% residual | $\alpha = 0.586^\circ$, $\bar q\alpha = 26.1\ \mathrm{kPa\cdot deg}$ — comfortably inside it |
| What bias does not cover | gusts and shear on top of the measured mean — load relief's job, not wind biasing's |
| What accuracy buys | recovers load-budget margin a worst-case design must otherwise reserve, convertible into payload or launch availability |
| Algorithm vs. parameters | onboard guidance code is unchanged; only the pitch-program numbers it flies are updated |

Everything to this point has assumed the flight goes essentially as planned, wind aside. The next lesson takes up the other half of what can go wrong — not a dispersion guidance can quietly absorb, but a failure severe enough that the mission itself has to change, and the vocabulary and decision logic built to handle exactly that.
