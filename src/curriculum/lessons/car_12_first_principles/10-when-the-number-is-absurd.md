---
id: l10-when-the-number-is-absurd
title: "When the number comes out absurd"
minutes: 24
covers:
  - Fermi estimation method: decompose, bound each factor, multiply, sanity check, state uncertainty
  - worked space Fermi examples and how to bound them
---

Your phone says a car trip will take 400 hours. You do not pack for two weeks. You look again, because you know the drive is an afternoon. Something went wrong — maybe you typed the wrong town.

Estimates do the same thing. In a **[[Fermi round|fermi-round]]** — the interview question where you build an answer out loud from rough pieces — you will get a spacecraft radiator at three thousand kelvin. An orbit that takes fourteen minutes. A fuel load heavier than the rocket. What separates candidates is the next ninety seconds.

That moment tells the interviewer more than anything else in the round, and most candidates panic through it. Up to then, the interviewer has seen you break a problem into pieces and multiply. What they do *not* know yet is whether you check your own results — whether a number from your own algebra gets the same doubt you would give a stranger's. An absurd result is the only way to find out. So interviewers pick problems where one is likely.

This lesson also finishes the fifth move of the Fermi method: saying which step carries most of the uncertainty, and knowing it rather than guessing.

## What "absurd" means, exactly

"Absurd" does not mean "surprising". Surprising is a fact about *you* — what you expected — and is no evidence the answer is wrong. Plenty of correct estimates are surprising.

A result is **absurd** — impossible, not merely odd — when it **breaks a limit you can state without looking at the calculation**. There are five kinds worth knowing:

- **Physically impossible.** A speed faster than light, read $c$. An efficiency above 1 (more out than in). A temperature above the melting point of everything you could build the thing from. A negative mass.
- **Breaks a conservation law.** More energy coming out than going in. A satellite that, day after day, radiates more power than it collects.
- **Contradicts an anchor by powers of ten.** An **anchor** is a number you already know well. Say your estimate of the atmosphere's mass comes out at $10^{12}\,\mathrm{kg}$. You know the oceans are about $10^{21}\,\mathrm{kg}$, and the air is certainly not one part in a billion of the oceans.
- **Wrong sign.** Thrust pointing backwards. A satellite *gaining* energy from air drag.
- **Wrong dimensions.** Units that do not match, covered in lesson 7 — the cheapest of the five to catch.

Say which kind it is. *"That is above the melting point of aluminum, so it is impossible"* beats *"that seems high"*, because it names the limit being broken — and so the size of the error.

::: key
An absurd result violates a bound you can state independently — a physical limit, a conservation law, a known anchor, a sign, or dimensions. Say it out loud, quantify the discrepancy as a factor, then look for an error of that size. The factor tells you what kind of mistake to search for.
:::

## The repair procedure

A doctor does not say "you feel bad". She takes your temperature, and the number narrows down what could be wrong. The repair works the same way: five steps, in order, under two minutes.

1. **Name it.** *"That cannot be right, and here is the limit it breaks."* Do it at once. An interviewer who watches you carry on past an impossible number has learned something you cannot take back.
2. **Measure the gap as a factor, not a feeling.** A **factor** here means "how many times too big or too small". *"I expected a few hundred kelvin and I have three thousand, so I am out by a factor of ten in temperature."*
3. **Turn the factor into a search.** A factor of exactly $10^k$ — read "ten to the k" — is a unit mistake. A factor near 2, 4 or 8 is radius mixed up with diameter. A factor of $2\pi$ is a frequency mixed up with an angular rate. The table below is the catalog.
4. **Check in this order: units, then the breakdown, then the bounds.** Units are fastest and cause most of these errors. Then the breakdown — an area where a volume belonged, something counted twice? Bounds come last: the wrong end of a range gives a factor of two or three, never a thousand.
5. **Say whether the model or the number was wrong.** A factor of $10^4$ is a number mistake. A factor of three with no arithmetic error is usually a **model** mistake — an effect left out, or one that should not be in.

| Discrepancy | What it usually means |
| --- | --- |
| Exactly $10$, $10^3$, $10^6$ | A unit prefix: km against m, kPa against Pa, kg against g |
| Exactly $10^4$ or $10^6$ | $\mathrm{cm^2}$ against $\mathrm{m^2}$, or $\mathrm{cm^3}$ against $\mathrm{m^3}$ |
| 2 | A missing $\tfrac12$ in an energy, or radius against diameter in a length |
| 4 or 8 | Radius against diameter in an area or a volume |
| 8 | Bits against bytes in a data size or data rate |
| $\pi$ or $4/\pi$ | A circle approximated by its bounding square, or the reverse |
| $2\pi$ or $(2\pi)^2$ | Frequency against angular frequency |
| 60, 3600, 86400 | Per second against per minute, hour or day |
| 9.81 | A specific impulse in seconds used where a velocity belonged |
| 57.3 | Degrees against radians |
| 1000 against 1024 | Decimal against binary prefixes in a data-rate estimate |

Why 2, 4 and 8? Double every side of a square and its area grows $2 \times 2 = 4$ times; double every side of a box and its volume grows $2 \times 2 \times 2 = 8$ times. So a diameter used for a radius is out by 2 in a length, 4 in an area and 8 in a volume. These slips are not only interview problems: real spacecraft have been lost to a **[[unit mistake|mars-climate-orbiter]]**.

::: warning Do not fix an absurd result by quietly widening a bracket
The tempting repair is to decide the solar array was really thirty square meters, not ten, because the answer looks better. That bends an assumption to fit the answer you wanted, and it shows. If a bound really was wrong, say *why*: *"I limited the array to the spacecraft body, but it unfolds, so my upper bound was too low."* That is a reason. "It makes the answer nicer" is not.
:::

::: example Three thousand kelvin, and the factor that caused it
**The setting.** In the previous lesson's heat estimate, a satellite must shed 2179 W of heat. Its radiator has an **[[emissivity|emissivity]]** of 0.85, and its area came from a drawing that gave it in square centimeters.

**The calculation, as it was done.** A radiator's temperature comes from $T = \left(P/(\varepsilon\sigma A)\right)^{1/4}$. Here $T$ is the temperature in **[[kelvin|kelvin]]**, $P$ is the power to radiate, $\varepsilon$ (read "epsilon") is the emissivity, $\sigma$ (read "sigma") $= 5.670\times 10^{-8}\,\mathrm{W/(m^2\,K^4)}$ is a fixed constant of nature, and $A$ is the area. The mistake: using $A = 6.0\,\mathrm{cm^2}$ without converting. That is only $6.0\times 10^{-4}\,\mathrm{m^2}$. Dividing first:

$$
2179/(0.85 \times 5.670\times 10^{-8} \times 6.0\times 10^{-4}) = 7.535\times 10^{13},
$$

and then taking the fourth root, $(7.535\times 10^{13})^{0.25} = 2946\,\mathrm{K}$.

**Name the absurdity.** Aluminum melts at 933 K and titanium at 1941 K. At 2946 K the radiator would be above the melting point of nearly every metal — only a few, such as tungsten, survive it. It would glow like a light-bulb filament, and the electronics must sit near room temperature. Three independent limits, all broken.

**Measure the gap.** The right answer (found below) is 294.6 K, and $2946/294.6 = 10.0$: a factor of exactly ten in temperature.

**Turn it into a search.** Temperature comes out as a **[[fourth root|fourth-root]]**. So a factor of 10 in $T$ means a factor of $10^4$ in what sits under the root. That is no modeling error or bad range; it is a unit conversion, and $10^4$ is exactly the square-centimeter-to-square-meter conversion, because $1\,\mathrm{m} = 100\,\mathrm{cm}$ and $100^2 = 10^4$. 

**Repair.** With $A = 6.0\,\mathrm{m^2}$ the answer is 294.6 K. Subtracting 273.15 gives about 21 °C — what a spacecraft thermal design aims for.

**What to say.** *"That is a factor of ten in temperature, which is ten thousand in area, which is square centimeters to square meters — I did not convert the radiator area."* Fifteen seconds, showing the fourth-power dependence, unit discipline and self-correction at once.
:::

::: example A fourteen-minute orbit
**The setting.** Finding the time for one lap of a circular orbit 400 km up, from its **[[mean motion|mean-motion]]** $n$ — how fast it sweeps around, in radians per second.

**The calculation, as it was done.** The radius is Earth's radius plus the altitude, $a = 6.771\times 10^6\,\mathrm{m}$. Cubing it, $a^3 = 3.104\times 10^{20}\,\mathrm{m^3}$. With Earth's gravity constant $\mu$ (read "mew") $= 3.986\times 10^{14}\,\mathrm{m^3/s^2}$:

$$
n = \sqrt{\mu/a^3} = \sqrt{3.986\times 10^{14}/3.104\times 10^{20}} = \sqrt{1.284\times 10^{-6}} = 1.133\times 10^{-3}.
$$

Then, taking the period as one over the mean motion, $1/1.133\times 10^{-3} = 882.6\,\mathrm{s}$ — 14.7 minutes.

**Name the absurdity.** A low orbit takes about ninety minutes — one of the most reliable anchors there is. An even better limit: to circle that radius in 882.6 s, the speed would be distance over time: $2\pi \times 6.771\times 10^6/882.6 = 48200\,\mathrm{m/s}$. The **[[escape velocity|escape-velocity]]** at that radius is 10851 m/s. The implied speed is $48200/10851 = 4.44$ times escape velocity, so the satellite would fly off and not be in orbit at all.

**Measure the gap.** The true period is 5545 s. Dividing, $5545/882.6 = 6.283$. That is $2\pi$ to four figures.

**Turn it into a search.** A factor of exactly $2\pi$ between a period and a rate means the rate is *angular*, in radians per second, not turns per second. One full turn is $2\pi$ radians. The mean motion $n$ is angular, so the period is $P = 2\pi/n$, not $1/n$.

**Repair.** $P = 2\pi/n = 5545\,\mathrm{s}$, which is 92.4 minutes. The anchor is satisfied, and the implied speed becomes 7673 m/s — the orbital speed, as it must be.

**The general lesson.** A $2\pi$ error slips past a units check: radians have no units, so $n$ and $1/P$ are both "per second". Only an anchor or a physical limit catches it — which is why the sanity check is a separate move from the units check, not a replacement.
:::

## When the absurd answer is right

Sometimes there is no mistake. The estimate is telling you something true that your gut had wrong. The test is the one from the top: does the result break a **bound**, or only an **expectation**?

An expectation is not evidence. If your only objection is "that feels like a lot", the estimate stands. Say: *"That is larger than I expected. I have checked it two ways, so I think it is right — and here is why it is less surprising than it looks."* That is worth more than a correct answer that arrived with no friction, because it shows you can hold a result against your own gut.

::: example Two results that sound wrong and are not
**Ten metric tons of air on every square meter.** From lesson 8: sea-level air pressure is $101325\,\mathrm{Pa}$, and dividing by gravity, $101325/9.80665 = 10332\,\mathrm{kg/m^2}$. A desk one meter square is carrying ten metric tons of atmosphere.

Is a bound broken? No. It is sea-level pressure said another way: a pascal is one newton per square meter, and dividing a force by $g$ gives a mass. Any barometer confirms it. The desk survives because the same pressure pushes up from underneath — a fact about the desk, not a flaw in the estimate. Verdict: surprising, correct, and one of the most useful anchors you can carry.

**Two kilograms of propellant to raise a satellite by 200 km.** A 300 kg satellite has an **[[electric thruster|electric-thruster]]** with a specific impulse $I_{sp} = 1600\,\mathrm{s}$ (read "I-S-P", a measure of how much push each kilogram of propellant gives). It raises itself from 350 km to 550 km.

For a slow spiral between two circular orbits, the speed change $\Delta v$ (read "delta v") is the difference of the two circular speeds. Circular speed is $\sqrt{\mu/r}$. At the lower orbit, $r = 6.721\times 10^6\,\mathrm{m}$, so $\sqrt{3.986\times 10^{14}/6.721\times 10^6} = 7701\,\mathrm{m/s}$. At the upper orbit, $r = 6.921\times 10^6\,\mathrm{m}$, so $\sqrt{3.986\times 10^{14}/6.921\times 10^6} = 7589\,\mathrm{m/s}$. The difference is $7701 - 7589 = 112\,\mathrm{m/s}$.

The rocket equation's exponent is $\Delta v/(I_{sp} g_0) = 112/(1600 \times 9.80665) = 0.00714$. That is so small that the propellant mass is close to $300 \times 0.00714 = 2.14\,\mathrm{kg}$.

Is a bound broken? No. 200 km is only three percent of the orbit's radius, the speed change is 1.5 percent of orbital speed, and 1600 s is five times a chemical engine's specific impulse. The surprise is all in a gut trained on chemical rockets. Verdict: correct, and the interesting sentence is *"this is so small because altitude is cheap and speed is expensive, and 200 km of altitude is only 112 m/s of speed."*

**The contrast.** The radiator at 2946 K broke a melting point. These two break nothing. Asking *"what bound would this break?"* out loud is what stops you throwing away a correct estimate because it felt wrong.
:::

## Saying which step carries the uncertainty

This is the fifth move of the Fermi method from lesson 8. The method, in the words to carry:

::: key
The Fermi method: decompose into factors you can bound, bound each with an upper and a lower estimate, multiply the geometric middles, sanity check against something you know, and state the uncertainty. The decomposition is what is being graded, not the number.
:::

"There is a lot of uncertainty here" says nothing. A good closing names one specific factor and gives a reason.

The number rule, from lesson 8: each factor adds $(\ln f_i)^2$ to the total **[[log-variance|log-variance]]**, where $f_i = \sqrt{\text{upper}/\text{lower}}$ is how far that factor could be off, up or down. Read $\ln$ as "natural log". The dominant step has the largest $(\ln f_i)^2$ — usually the factor with the widest range, spotted by eye.

::: key
The dominant uncertainty is the factor with the largest $(\ln f_i)^2$, where $f_i = \sqrt{\text{upper}/\text{lower}}$. Name the factor, give its size, and say what would fix it.
:::

Three habits make the closing sentence land.

**Name the factor, not the topic.** *"The amplifier efficiency"*, not *"the electronics"*.

**Give the size.** *"It is uncertain by about two either way — more than the other three together."*

**Say what would fix it.** *"If you can give me one number, make it that one"*, or *"a data sheet for a Ku-band amplifier would shrink that range to ten percent."* That turns an admission into a plan — what an engineer would say in a **[[design review|design-review]]**.

::: warning Spreading the doubt evenly
It is tempting to spread the uncertainty across everything so no single assumption looks weak. It reads as hedging, and it is usually false: in almost every estimate in the previous lesson, one factor dominated. Find it and name it.
:::

## Check yourself

::: check
Your estimate of a satellite's data rate comes out at 8 Gbps (gigabits per second), and you expected something closer to 1 Gbps. What do you check first?
:::

::: answer
The factor is 8, and 8 is in the catalog: one byte is eight bits. Check whether one part was in bytes and another in bits. Stored data in gigabytes divided by a time gives bytes per second; comparing that with a link rate in bits per second is out by exactly eight.

8 is also $2^3$, radius-versus-diameter in a volume — unlikely in a data-rate problem. That is the point of the catalog: two candidates, and in this domain one is far more likely.

If neither holds, the gap is not a clean factor, and the expectation deserves checking too.
:::

::: check
What is the difference between "surprising" and "absurd"? Give one test you can apply in ten seconds.
:::

::: answer
Surprising means the result conflicts with what you expected. Absurd means it breaks a limit you can state without looking at the calculation — a physical limit, a conservation law, a measured anchor, a sign or a dimension.

The ten-second test: **try to name the bound it breaks** — "above the melting point", "more power out than in", "faster than escape velocity". If you can, there is an error to find. If your strongest objection is "that feels large", it is only surprising: check it a second way, then defend it.

Both mistakes cost you. Accepting an absurd answer shows you do not check your work. Throwing away a surprising but correct one shows you trust gut over calculation — in a first-principles round, the more serious of the two.
:::

::: check
An estimate is out by a factor of about 3, and you can find no arithmetic error. What does that suggest, and what do you do?
:::

::: answer
Unit and geometry errors come out at clean powers of ten, or at 2, 4, 8, $\pi$ or $2\pi$. A factor of three is the size of a range, or of a missing effect.

Look in two places. First, the bounds: three factors each taken a bit toward the same end of their ranges drift the product by about that much, and then the answer and the reference agree within the stated uncertainty. Second, the model: did you leave out an effect worth a factor of a few? Time in the Earth's shadow, a **duty cycle** (the fraction of time something is switched on), an efficiency, a second loss.

Then say which: *"This is within my stated range, so I do not think there is an error — but if the true figure is three times mine, the likeliest single cause is that I ignored the duty cycle."* That closes the point properly instead of leaving a loose end.
:::

::: check
For the satellite radio power estimate of the previous lesson, state the dominant uncertainty the way you would say it at a whiteboard.
:::

::: answer
*"The answer is about two hundred watts of radio-frequency power, and the range is roughly a hundred to four hundred. Two things dominate the uncertainty. One is the power amplifier efficiency, which I bounded at 0.20 to 0.35. The other is the link margin I assumed. I put it at eighteen **[[decibels|decibels]]**, and I could defend anywhere from twelve to twenty-four — six decibels either way is a factor of about four.*

*The array area and cell efficiency are much better bounded — the spacecraft's size limits the array, and cell efficiency varies little across current technology. If you can give me one number, give me the link margin."*

Three parts: the answer with its range, the dominant factors with their ranges, and a request that would tighten it.
:::

::: check
Why do interviewers choose problems where an absurd number along the way is likely?
:::

::: answer
Because it is the only reliable way to see whether a candidate checks their own output.

A smooth problem tests breaking-down and arithmetic, nothing else. An impossible number tests what a smooth problem cannot reach: does the candidate notice, measure the gap, turn it into a search, and do it all out loud, calmly? That decides whether their analysis can be trusted in a design review, where nobody else checks the arithmetic.

It is also the closest an interview gets to the real job, which is mostly finding and fixing your own errors. A round that never exposes an error has not seen you work.
:::

## Summary

| Item | Statement |
| --- | --- |
| Absurd, defined | Breaks an independently statable bound: physical limit, conservation law, anchor, sign or dimension |
| Surprising, defined | Conflicts with expectation only; not evidence of an error |
| The test | Try to name the bound it breaks, in ten seconds |
| Repair procedure | Name it, measure the factor, turn the factor into a search, check units then breakdown then bounds, say whether the model or the number was wrong |
| $10^k$ | A unit prefix; $10^4$ and $10^6$ are $\mathrm{cm^2}$ and $\mathrm{cm^3}$ |
| 2, 4, 8 | Radius against diameter, in length, area, volume |
| $2\pi$ | Frequency against angular rate; invisible to a units check |
| 9.81, 57.3, 8 | $I_{sp}$ as a velocity, degrees against radians, bytes against bits |
| Dominant uncertainty | The largest $(\ln f_i)^2$; name the factor, its size, and what would fix it |
| Worked repairs | Radiator 2946 K from $\mathrm{cm^2}$; 14.7 min orbit from $1/n$ instead of $2\pi/n$ |
| Correct surprises | 10 metric tons of air per square meter; about 2.14 kg of propellant for a 200 km electric climb |

That completes the derivation and estimation halves of the module. The next lesson takes the third kind of problem this round asks — a physics puzzle, where the hard part is not the algebra or the arithmetic but deciding what the mechanism is before any of it can begin.

::: context fermi-round Estimates built out loud
A Fermi question asks for a number nobody has written down — how much the atmosphere weighs, how many bolts are on a rocket stage — with no data allowed. You break it into pieces you can guess within a factor of two or three, multiply, and check. Lesson 8 taught the five moves. This lesson is about the moment the answer comes out wrong, which is the part of the round interviewers watch most closely.
:::

::: context mars-climate-orbiter A spacecraft lost to units
In 1999 NASA lost the Mars Climate Orbiter as it arrived at Mars. One team's ground software reported thruster impulse in pound-force seconds. The navigation software expected newton-seconds. One pound-force is about 4.45 newtons, so every small course correction was misjudged by that factor. Over months of cruise the errors added up, and the spacecraft passed far too low over Mars and was lost.

A factor of 4.45 is not in the catalog, which is the point: the catalog covers common slips, and a check against an independent anchor is still needed for the rest.
:::

::: context emissivity How well a surface glows
Every warm object sheds heat as invisible infrared light. **Emissivity** says how good a surface is at it, on a scale from 0 to 1. A perfect radiator scores 1. Polished metal scores low — that is why a shiny thermos keeps soup hot. Spacecraft radiators are painted with special white coatings that score around 0.85 to 0.9, so they shed heat well while reflecting most sunlight.
:::

::: context kelvin The temperature scale that starts at zero
The kelvin scale starts at **absolute zero**, the coldest anything can be, and counts up in steps the same size as Celsius degrees. To convert, subtract 273.15: room temperature is about 295 K, or 22 °C. Engineers use kelvin in radiation formulas because the heat radiated goes as $T^4$, and that only works on a scale with a true zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="20" x2="120" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="115" y="34" font-size="11" text-anchor="end" fill="#1f2a44">room 295 K</text>
  <rect x="120" y="24" width="18" height="14" fill="#8fb8f0"/>
  <text x="115" y="62" font-size="11" text-anchor="end" fill="#1f2a44">Al melts 933 K</text>
  <rect x="120" y="52" width="57" height="14" fill="#6c7a93"/>
  <text x="115" y="90" font-size="11" text-anchor="end" fill="#1f2a44">Ti melts 1941 K</text>
  <rect x="120" y="80" width="118" height="14" fill="#6c7a93"/>
  <text x="115" y="118" font-size="11" text-anchor="end" fill="#b4232c">radiator 2946 K</text>
  <rect x="120" y="108" width="179" height="14" fill="#b4232c"/>
  <text x="115" y="146" font-size="11" text-anchor="end" fill="#1f2a44">W melts 3695 K</text>
  <rect x="120" y="136" width="225" height="14" fill="#f2b880"/>
  <text x="120" y="176" font-size="11" fill="#6c7a93">bar length proportional to temperature</text>
</svg>
```
:::

::: context fourth-root Why a fourth root hides big mistakes
The radiated power grows as temperature to the fourth power. Run that backwards and temperature is the fourth root of everything else. The fourth root squashes big numbers: $10^4$ becomes 10, and $10^8$ becomes 100. So a unit slip of ten thousand shows up as only a factor of ten in the answer. Knowing the power in a formula lets you un-squash the gap and see the real size of the slip.
:::

::: context mean-motion Radians per second around the orbit
Mean motion is how fast a satellite sweeps around its orbit, measured as an angle per second. Angles here are in **radians**: one full turn is $2\pi$, about 6.283 radians. So the time for one turn is the full angle divided by the rate, $P = 2\pi/n$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="80" r="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="90" cy="80" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="90" y1="80" x2="150" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="80" x2="132.43" y2="37.57" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M120,80 A30,30 0 0,0 111.21,58.79" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="132.43" cy="37.57" r="5" fill="#b4232c"/>
  <text x="126" y="72" font-size="11" fill="#1d6fd1">n t</text>
  <text x="180" y="50" font-size="12" fill="#1f2a44">angle swept = n × time</text>
  <text x="180" y="78" font-size="12" fill="#1f2a44">one full turn = 2π rad</text>
  <text x="180" y="106" font-size="12" fill="#1d6fd1">period P = 2π / n</text>
  <text x="180" y="134" font-size="12" fill="#b4232c">not 1 / n</text>
</svg>
```
:::

::: context escape-velocity The speed that leaves for good
Throw a ball up and it comes back. Throw it fast enough and it never does — that speed is **escape velocity**, $\sqrt{2\mu/r}$. It is always $\sqrt{2}$, about 1.41, times the circular orbit speed at the same radius. At 400 km that is 10851 m/s against 7673 m/s. Anything moving much faster than escape velocity cannot be in orbit, which makes it a hard limit to test an orbit estimate against.
:::

::: context electric-thruster Tiny push, very little propellant
An electric thruster uses electricity from solar panels to fling charged gas atoms out the back at tens of kilometers per second, far faster than a chemical rocket's exhaust. The push is tiny — typically a fraction of a newton, about the weight of a few coins in your hand — so it takes weeks or months to change an orbit. But it uses very little propellant. Starlink satellites, for example, raise their own orbits with Hall-effect thrusters of this kind.
:::

::: context log-variance Why one wide range dominates
Each factor's contribution is $(\ln f)^2$, so ranges add up by their squares. Squaring rewards the biggest: a factor uncertain by 4 counts four times as much as one uncertain by 2, and about twelve times as much as one uncertain by 1.5.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="18" x2="90" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="84" y="36" font-size="11" text-anchor="end" fill="#1f2a44">f = 1.5</text>
  <rect x="90" y="26" width="18" height="16" fill="#8fb8f0"/>
  <text x="114" y="38" font-size="11" fill="#1f2a44">0.16</text>
  <text x="84" y="66" font-size="11" text-anchor="end" fill="#1f2a44">f = 2</text>
  <rect x="90" y="56" width="53" height="16" fill="#8fb8f0"/>
  <text x="149" y="68" font-size="11" fill="#1f2a44">0.48</text>
  <text x="84" y="96" font-size="11" text-anchor="end" fill="#1f2a44">f = 4</text>
  <rect x="90" y="86" width="211" height="16" fill="#b4232c"/>
  <text x="307" y="98" font-size="11" fill="#1f2a44">1.92</text>
  <text x="90" y="140" font-size="11" fill="#6c7a93">(ln f)² for each factor, bar length to scale</text>
</svg>
```
:::

::: context design-review Where engineers defend their numbers
A **design review** is a formal meeting where a team presents its design and other engineers try to find what is wrong with it. NASA projects pass through a series of them, such as the Preliminary Design Review (said "P-D-R") and the Critical Design Review ("C-D-R"). Reviewers ask exactly the question in this lesson: which assumption is the weakest, and what would it take to pin it down?
:::

::: context decibels Counting factors of ten
A **decibel** (dB) is a way of writing a ratio by counting powers of ten: 10 dB is a factor of 10, 20 dB is 100, and 3 dB is about a factor of 2. So 6 dB is about 4, and 18 dB is about 63. Radio engineers use decibels because the gains and losses in a link multiply, and in decibels they add instead.
:::
