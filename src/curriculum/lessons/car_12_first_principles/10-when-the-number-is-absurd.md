---
id: l10-when-the-number-is-absurd
title: "When the number comes out absurd"
minutes: 23
covers:
  - Fermi estimation method: decompose, bound each factor, multiply, sanity check, state uncertainty
  - worked space Fermi examples and how to bound them
---

Somewhere in a Fermi round your estimate will come out at a number that cannot be true. A spacecraft radiator at three thousand kelvin. A satellite orbiting in fourteen minutes. A propellant mass larger than the vehicle. Every candidate meets this moment; what separates them is the next ninety seconds.

The moment is the most informative in the whole round, and it is the one most candidates panic through. Here is why it is informative. Up to that point the interviewer has watched you build a model and turn a handle. They have learned that you can decompose and multiply. What they have *not* learned is whether you evaluate your own results — whether a number that arrives from your own algebra gets the same scepticism as a number someone hands you. An absurd result is the only way to find that out, and interviewers know it, which is one reason these problems are chosen with wide enough brackets that absurd intermediate results are likely.

The other thing this lesson covers is the fifth move of the method, stated properly: how to say which step carries most of the uncertainty, and how to know which one that is rather than guessing.

## What "absurd" means, precisely

Not "surprising". Surprising is a statement about your intuition and carries no evidential weight; plenty of correct estimates are surprising, and three are worked below. Absurd means the result **violates a bound you can state independently of the calculation**. There are five kinds worth recognising:

- **Physically impossible.** A speed above $c$, an efficiency above 1, a temperature above the melting point of everything you could build the thing from, a negative mass.
- **Violates a conservation law.** More energy out than in; a satellite radiating more than it collects, in steady state.
- **Contradicts an anchor by orders of magnitude.** Your estimate of the atmosphere's mass comes out at $10^{12}\,\mathrm{kg}$, but you know the ocean is about $10^{21}$ and air is not one part in a billion of the ocean.
- **Wrong sign.** Thrust pointing backwards; a satellite gaining energy from drag.
- **Wrong dimensions.** Covered in lesson 7, and the cheapest of the five to catch.

Say which kind it is. *"That is above the melting point of aluminium, so it is not merely large, it is impossible"* is a much stronger sentence than *"that seems high"*, because it names the bound that is being violated and therefore names the size of the error.

::: key
An absurd result violates a bound you can state independently — a physical limit, a conservation law, a known anchor, a sign, or dimensions. Say it out loud, quantify the discrepancy as a factor, then look for an error of that size. The factor tells you what kind of mistake to search for.
:::

## The repair procedure

Five steps, in order. The whole thing should take under two minutes.

1. **Name it.** *"That cannot be right, and here is the bound it breaks."* Do this immediately. An interviewer who watches you produce an absurd number and carry on has learned something permanent about you.
2. **Quantify the discrepancy as a factor**, not as a feeling. *"I expected a few hundred kelvin and I have three thousand, so I am a factor of ten out in temperature."*
3. **Convert the factor into a search.** A factor of exactly $10^k$ is a unit error. A factor near 2, 4 or 8 is a radius-versus-diameter confusion. A factor of $2\pi$ is frequency versus angular rate. The table below is the catalogue.
4. **Check in this order: units, then the decomposition, then the bounds.** Units are fastest and account for most of these errors. The decomposition is next — did you use an area where a volume belonged, or count something twice? The bounds are last, because being at the wrong end of a bracket gives you a factor of two or three, not a factor of a thousand.
5. **Decide whether the model or the number was wrong**, and say which. A factor of $10^4$ is a number error. A result that is out by a factor of three with no arithmetic error is usually a model error — a mechanism you left out or one you should not have included.

| Discrepancy | What it usually means |
| --- | --- |
| Exactly $10$, $10^3$, $10^6$ | A unit prefix: km against m, kPa against Pa, kg against g |
| Exactly $10^4$ or $10^6$ | $\mathrm{cm^2}$ against $\mathrm{m^2}$, or $\mathrm{cm^3}$ against $\mathrm{m^3}$ |
| 2 | A missing $\tfrac12$ in an energy, or radius against diameter in a length |
| 4 or 8 | Radius against diameter in an area or a volume |
| $\pi$ or $4/\pi$ | A circle approximated by its bounding square, or the reverse |
| $2\pi$ or $(2\pi)^2$ | Frequency against angular frequency |
| 60, 3600, 86400 | Per second against per minute, hour or day |
| 9.81 | A specific impulse in seconds used where a velocity belonged |
| 57.3 | Degrees against radians |
| 1000 against 1024 | Decimal against binary prefixes in a data-rate estimate |

::: warning Do not fix an absurd result by quietly widening a bracket
The tempting repair is to go back and say the array was really thirty square metres, not ten, because that makes the answer come out better. That is fitting the assumption to the desired conclusion, and it is visible. If a bound was genuinely wrong, say *why* it was wrong — *"I bounded the array by the spacecraft body, but the array deploys, so my upper bound was too low"* — which is a reason. "It makes the answer nicer" is not a reason.
:::

::: example Three thousand kelvin, and the factor that caused it
**The setting.** Continuing the satellite thermal estimate from the previous lesson: 2179 W to radiate, emissivity 0.85, and a radiator area taken from a drawing that gave it in square centimetres.

**The calculation, as performed.** Using $A = 6.0\,\mathrm{cm^2}$ without converting, which is $6.0\times 10^{-4}\,\mathrm{m^2}$:

$$
2179/(0.85 \times 5.670\times 10^{-8} \times 6.0\times 10^{-4}) = 7.535\times 10^{13},
$$

and $(7.535\times 10^{13})^{0.25} = 2946\,\mathrm{K}$.

**Name the absurdity.** Aluminium melts at 933 K and titanium at 1941 K. A radiator at 2946 K would be above the melting point of every structural metal except tungsten, would glow visibly, and would be radiating more power than the array collects. Three independent bounds, all broken.

**Quantify.** The expected answer was a few hundred kelvin — spacecraft run near room temperature because that is what their electronics require. $2946/294.6 = 10.0$: a factor of exactly ten in temperature.

**Convert to a search.** Temperature enters as the fourth root, so a factor of 10 in $T$ is a factor of $10^4$ in everything else. $10^4$ is not a modelling error or a bad bracket; it is a unit conversion, and $10^4$ is specifically the square-centimetre-to-square-metre conversion. Found in one step.

**Repair and restate.** With $A = 6.0\,\mathrm{m^2}$ the answer is 294.6 K, about 22 °C, which is exactly what a spacecraft thermal design targets.

**What to say.** *"That is a factor of ten in temperature, which is a factor of ten thousand in area, which is square centimetres to square metres — I did not convert the radiator area."* Fifteen seconds, and it demonstrates the fourth-power dependence, unit discipline and self-correction in one sentence.
:::

::: example A fourteen-minute orbit
**The setting.** Estimating the period of a 400 km circular orbit from the mean motion.

**The calculation, as performed.** $a = 6.771\times 10^6\,\mathrm{m}$, so $a^3 = 3.104\times 10^{20}\,\mathrm{m^3}$ and

$$
n = \sqrt{\mu/a^3} = \sqrt{3.986\times 10^{14}/3.104\times 10^{20}} = \sqrt{1.284\times 10^{-6}} = 1.133\times 10^{-3},
$$

and then, taking the period as the reciprocal of the mean motion, $1/1.133\times 10^{-3} = 882.6\,\mathrm{s}$ — 14.7 minutes.

**Name the absurdity.** A low orbit takes about ninety minutes; that anchor is one of the most reliable in the subject. Better, an independent bound: circling at that radius in 882.6 s requires a speed of $2\pi \times 6.771\times 10^6/882.6 = 48200\,\mathrm{m/s}$, and escape velocity at that radius is 10851 m/s. The implied speed is $48200/10851 = 4.44$ times escape velocity, so the satellite would not be in orbit at all.

**Quantify.** $5545/882.6 = 6.283$. That is $2\pi$ to four figures.

**Convert to a search.** A factor of exactly $2\pi$ between a period and a rate means the rate is an *angular* rate in radians per second, not a frequency in cycles per second. The mean motion $n$ is angular, so the period is $P = 2\pi/n$, not $1/n$.

**Repair.** $P = 2\pi/n = 5545\,\mathrm{s}$, 92.4 minutes. The anchor is satisfied and the implied speed becomes 7673 m/s, which is the orbital velocity as it must be.

**The general lesson.** $2\pi$ errors are invisible to a dimensional check, because radians are dimensionless and both $n$ and $1/P$ have units of inverse seconds. They can only be caught against an anchor or a physical bound, which is why the sanity check is a separate move from the units check and not a substitute for it.
:::

## When the absurd answer is right

The procedure above assumes an error. Sometimes there is none, and the estimate is telling you something true that your intuition had wrong. Distinguishing the two cases is the skill, and the test is the one stated at the top: does the result violate a **bound**, or does it merely violate an **expectation**?

An expectation has no evidential weight. If the only objection you can raise is "that feels like a lot", the estimate stands, and the correct move is to say *"that is larger than I expected, and I have checked it two ways, so I think it is right — and here is why it is less surprising than it looks."* That sentence is worth more than a correct answer that arrived without friction, because it shows you can hold a result against your own intuition.

::: example Two results that sound wrong and are not
**Ten tonnes of air on every square metre.** From lesson 8, $101325/9.80665 = 10332\,\mathrm{kg/m^2}$. A desk one metre square is carrying ten tonnes of atmosphere.

Is a bound violated? No. The result is nothing more than sea-level pressure restated: $101325\,\mathrm{Pa}$ is $101325\,\mathrm{N/m^2}$, and dividing a force by $g$ gives a mass. Any barometer confirms it. The reason the desk survives is that the same pressure acts underneath, which is a fact about the situation and not a problem with the estimate. Verdict: surprising, correct, keep it — and it is one of the most useful anchors in the set.

**Two kilograms of propellant to raise a satellite by 200 km.** A 300 kg satellite with an electric thruster at $I_{sp} = 1600\,\mathrm{s}$ raising itself from 350 km to 550 km.

The $\Delta v$ for a slow spiral between two circular orbits is the difference of the circular speeds: $\sqrt{3.986\times 10^{14}/6.721\times 10^6} = 7701\,\mathrm{m/s}$ at the lower orbit and $\sqrt{3.986\times 10^{14}/6.921\times 10^6} = 7589\,\mathrm{m/s}$ at the upper, so $7701 - 7589 = 112\,\mathrm{m/s}$.

The exponent is $112/(1600 \times 9.80665) = 0.00714$, small enough that the propellant mass is close to $300 \times 0.00714 = 2.14\,\mathrm{kg}$.

Is a bound violated? No. Two kilograms sounds impossible for a 200 km altitude change until you notice that 200 km is three per cent of the orbital radius, that the speed change is 1.5 per cent of orbital speed, and that a specific impulse of 1600 s is five times a chemical engine's. Every step is defensible and the surprise is entirely in the intuition, which was anchored on chemical propulsion. Verdict: correct, and the interesting sentence is *"the reason this is so small is that altitude is cheap and speed is expensive, and 200 km of altitude is only 112 m/s of speed."*

**The contrast worth naming.** The radiator at 2946 K broke a melting point. These two break nothing. That is the entire test, and applying it explicitly — *"what bound would this violate?"* — is what stops you from discarding a correct estimate because it felt wrong.
:::

## Saying which step carries the uncertainty

The fifth move of the method, done properly. Not *"there is a lot of uncertainty here"*, which says nothing, but a specific factor named with a reason.

The quantitative rule from lesson 8: each factor contributes $(\ln f_i)^2$ to the total log-variance, where $f_i = \sqrt{\text{upper}/\text{lower}}$. The dominant step is the one with the largest $(\ln f_i)^2$, and it is usually obvious by inspection — the factor with the widest bracket, weighted by the square of its log.

Three habits make the closing sentence land.

**Name the factor, not the topic.** *"The amplifier efficiency"*, not *"the electronics"*.

**Give the size.** *"It is uncertain by a factor of about two either way, which is more than the other three factors put together."*

**Say what would fix it.** *"If you can give me one number, make it that one"*, or *"a data sheet for a Ku-band solid-state amplifier would collapse that bracket to ten per cent."* This turns an admission into a plan, and it is what an engineer would actually say in a design review.

There is a version of this that is worth resisting: spreading the uncertainty evenly across everything so that no single assumption looks weak. It reads as hedging and it is usually false — in almost every estimate in the previous lesson, one factor dominated. Find it and name it.

## Check yourself

::: check
Your estimate of a satellite's data rate comes out at 8 Gbps and you expected something closer to 1 Gbps. What do you check first?
:::

::: answer
The factor is 8, and 8 is one of the catalogue entries: it is the bits-to-bytes conversion. Check whether one part of the calculation was in bytes and another in bits — a stored-data figure in gigabytes divided by a time gives bytes per second, and comparing that against a link rate in bits per second is out by exactly eight.

If that is not it, 8 is also $2^3$, which is a radius-versus-diameter confusion in a volume. That is unlikely in a data-rate problem, which is the point of the catalogue: it narrows the search to two candidates in a domain where one of them is far more plausible.

If neither holds, the discrepancy is not a clean factor and is more likely a genuine disagreement between your estimate and your expectation — at which point the expectation deserves scrutiny too.
:::

::: check
Distinguish "surprising" from "absurd", and give one test you can apply in ten seconds.
:::

::: answer
Surprising means the result conflicts with your expectation. Absurd means it violates a bound that can be stated without reference to the calculation — a physical limit, a conservation law, a measured anchor, a sign or a dimension.

The ten-second test: **try to name the bound it breaks.** If you can name one — "that is above the melting point", "that is more power out than in", "that is faster than escape velocity" — the result is absurd and there is an error to find. If the strongest objection you can construct is "that feels large", it is surprising, and the correct response is to check it a second way and then defend it.

The test matters because both failure modes are costly. Accepting an absurd answer shows you do not audit your own work; discarding a surprising but correct answer shows you trust intuition over calculation, which in a first-principles round is the more serious of the two.
:::

::: check
An estimate is out by a factor of about 3 and you can find no arithmetic error. What does that suggest, and what do you do?
:::

::: answer
A factor of three is not a unit error and not a geometry error — those come out at clean powers of ten, or at 2, 4, 8, $\pi$ or $2\pi$. A factor of three is the size of a bracket, or of a missing mechanism.

So look in two places. First, the bounds: if three factors were each taken slightly toward the same end of their brackets, the product drifts by about that much, and the honest statement is that the answer and the reference are consistent within the stated uncertainty. Second, the model: is there a mechanism you left out that would account for a factor of a few? Eclipse fraction, duty cycle, efficiency, a second loss term.

What you do is say which of the two it is. *"This is within my stated range, so I do not think there is an error — but if the true figure is three times mine, the likeliest single cause is that I ignored the duty cycle."* That closes the discussion properly instead of leaving a loose end.
:::

::: check
For the satellite radio-frequency power estimate of the previous lesson, state the dominant uncertainty the way you would say it at a whiteboard.
:::

::: answer
*"The answer is about two hundred watts of radio-frequency power, and the bracket is a hundred to four hundred. The uncertainty is dominated by two things: the power amplifier efficiency, which I bounded at 0.20 to 0.35, and the link margin I assumed, which I put at eighteen decibels and could defend anywhere from twelve to twenty-four — that alone is a factor of four.*

*The array area and the cell efficiency are comparatively well bounded, because the array size is constrained by the spacecraft's physical dimensions and cell efficiency does not vary much across current technology. So if you can give me one number, give me the link margin; it would halve my range."*

Three elements: the answer with its range, the named dominant factors with their brackets, and a specific request that would tighten it.
:::

::: check
Why do interviewers choose problems where an absurd intermediate result is likely?
:::

::: answer
Because it is the only reliable way to observe whether a candidate evaluates their own output.

A problem that goes smoothly tests decomposition and arithmetic and nothing else. A problem that produces an impossible number tests something no smooth problem can reach: whether the candidate notices, whether they can quantify the discrepancy, whether they can convert it into a search, and whether they can do all of that out loud without losing composure. Those are the behaviours that determine whether someone's analysis can be trusted in a design review, where nobody else is checking their arithmetic.

It is also the closest an interview gets to the real job. Engineering work is mostly the detection and repair of one's own errors; producing a correct answer first time is the exception. A round that never exposes an error has not seen you work.
:::

## Summary

| Item | Statement |
| --- | --- |
| Absurd, defined | Violates an independently statable bound: physical limit, conservation law, anchor, sign or dimension |
| Surprising, defined | Conflicts with expectation only; carries no evidential weight |
| The test | Try to name the bound it breaks, in ten seconds |
| Repair procedure | Name it, quantify the factor, convert the factor into a search, check units then decomposition then bounds, say whether the model or the number was wrong |
| $10^k$ | A unit prefix; $10^4$ and $10^6$ are $\mathrm{cm^2}$ and $\mathrm{cm^3}$ |
| 2, 4, 8 | Radius against diameter, in length, area, volume |
| $2\pi$ | Frequency against angular rate; invisible to a dimensional check |
| 9.81, 57.3, 8 | $I_{sp}$ as a velocity, degrees against radians, bytes against bits |
| Dominant uncertainty | The largest $(\ln f_i)^2$; name the factor, its size, and what would fix it |
| Worked repairs | Radiator 2946 K from $\mathrm{cm^2}$; 14.7 min orbit from $1/n$ instead of $2\pi/n$ |

The derivation and estimation halves of the module are now complete. The next lesson takes the third kind of problem this round asks — a physics puzzle, where the difficulty is not the algebra or the arithmetic but deciding what the mechanism is before any of it can begin.
