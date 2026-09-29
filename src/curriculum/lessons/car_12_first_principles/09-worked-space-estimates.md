---
id: l09-worked-space-estimates
title: "Worked space estimates, and how to bound them"
minutes: 26
covers:
  - worked space Fermi examples and how to bound them
---

A cooking show does not only give you the recipe. It lets you watch the chef make the dish, start to finish, so you can see where the hands go and when to taste. The previous lesson gave you the recipe for a Fermi estimate. This lesson is the cooking show: four real space problems of the kind this round asks, each worked the way three minutes at a whiteboard should sound, with every assumption named as an assumption and every number carried with its units.

One rule governs all four. Suppose an interviewer hears *"I do not know the array area, so I am bounding it between five and twenty square meters from the size of the spacecraft."* They learn far more about you than from a confident number you made up. And if they happen to know the real figure, the first answer survives the correction and the made-up one does not.

::: warning Never invent a specification you do not have
When an estimate depends on a real system's figure you cannot check — an array area, a transmit power, the number of satellites in a constellation — build the quantity from physics and label the input as an assumption with a bracket. A made-up specification is worse than a bracket in two ways: it cannot absorb a correction, and if the interviewer knows the true value, they have learned that you will state numbers you cannot support.
:::

## Two routes to any resource estimate

Think about a school bake sale. You could estimate how many cookies to bake from the *supply* side: how many ovens, how many trays, how many hours. Or from the *demand* side: how many students, how many cookies each buys. The two routes use different guesses, so they go wrong in different ways. If both land near the same number, you can trust it far more than either alone.

Spacecraft are full of exactly this. A **resource** is anything one part of the vehicle produces and another part uses up: electrical power, propellant, data rate, the capacity to shed heat, mass. So every resource can be estimated from either end:

- **Supply side**: how much can the vehicle produce?
- **Demand side**: how much does the payload need?

Where the two brackets overlap is a narrower band than either one. Opening with *"let me bound this from the supply side, then check it against what the payload actually needs"* is strong, and the two answers agreeing is a much better finish than any single number.

::: key
Worked space estimates bound a resource from both ends: supply, what the vehicle can produce, and demand, what the payload requires. The two routes use different assumptions, so their brackets overlap in a narrower band than either alone. Headline results to carry: about 33 MJ per kilogram to low Earth orbit, roughly one litre of petrol; a broadband satellite radiating a couple of kilowatts in total, of which a few hundred watts is radio frequency.
:::

::: example How much energy does it take to put a kilogram into low Earth orbit?
**Restate.** The least energy, in joules per kilogram, to take something from rest on the ground to a circular orbit 400 km up. "Least" means ideal: no losses, no air. We also ignore Earth's spin; at the equator it would save about 0.1 MJ/kg, well under one percent of the energy (though about six percent of the speed needed).

**Decompose.** The **[[specific orbital energy|orbital-energy]]** $\varepsilon$ ("epsilon") is the energy per kilogram of an orbiting object, kinetic plus gravitational. For a circular orbit of radius $a$ it is $\varepsilon = -\mu/(2a)$. Sitting still on the surface, at radius $R$, it is $-\mu/R$. The energy needed is the difference. Two terms, both from constants.

**Numbers.** $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$, $R = 6.371\times 10^6\,\mathrm{m}$, and $a = R + 400\,\mathrm{km} = 6.771\times 10^6\,\mathrm{m}$.

$$
\varepsilon_{\text{surface}} = -\frac{3.986\times 10^{14}}{6.371\times 10^6} = -6.256\times 10^7\,\mathrm{J/kg},
$$
$$
\varepsilon_{\text{orbit}} = -\frac{3.986\times 10^{14}}{2\times 6.771\times 10^6} = -2.943\times 10^7\,\mathrm{J/kg}.
$$

The difference is $6.256\times 10^7 - 2.943\times 10^7 = 3.313\times 10^7\,\mathrm{J/kg}$ — **33.1 MJ per kilogram.**

**Where it goes.** Orbital speed here is $v = \sqrt{\mu/a} = 7673\,\mathrm{m/s}$. The kinetic energy is $\tfrac12 v^2 = 29.4\,\mathrm{MJ/kg}$. The rest, 3.70 MJ/kg, is the climb. Speed wins by a factor of eight. That is the physical point worth making: getting to orbit is about going sideways fast, not about going up.

**Sanity check against something known.** Petrol (gasoline) holds about 43 to 46 MJ per kilogram, depending on whether you count the heat in the water vapor it makes, and a litre weighs about 0.745 kg. So a litre holds $46 \times 0.745 = 34.3\,\mathrm{MJ}$ at the top end, or 32 MJ at the bottom. **One litre of petrol is about the energy needed to put one kilogram into orbit.** That is memorable and checkable, and it answers the second half of the module's own Fermi drill.

**Second check, against a real vehicle.** Take a medium launcher burning about 400 t of propellant to deliver 15 t — round numbers, not a quoted specification. If the propellant releases about 10 MJ per kilogram, the total is roughly $4.00\times 10^5\,\mathrm{kg} \times 10^7\,\mathrm{J/kg} = 4.00\times 10^{12}\,\mathrm{J}$. Per kilogram of payload that is $4.00\times 10^{12}/15\,000 = 2.67\times 10^8\,\mathrm{J/kg}$. So the overall efficiency is $3.313\times 10^7/2.67\times 10^8 = 0.124$ — about twelve percent. Plausible: the rest is lost to gravity and drag, to the exponential of the rocket equation, and to the fact that most of the propellant is spent speeding up other propellant.

**Uncertainty.** The ideal figure is good to better than one percent, because it comes from constants. The vehicle comparison is good to maybe a factor of two, dominated by the propellant energy and the payload figure.
:::

## Defining the question before answering it

The next example is the one most likely to be asked in a space interview. Its first difficulty is not physics. The question has two meanings that differ by about a factor of ten, and choosing between them — out loud — comes first.

::: example Estimate the power a communications satellite radiates
**Restate, and split.** *"Radiates"* can mean two things. **Total power radiated**: in steady state, everything the satellite collects, almost all of it leaving as infrared waste heat. Or **radio-frequency power** — the radio signal the payload sends — which is a modest share of that. Do both, because the first sets a ceiling on the second.

**No specification is assumed.** Picture a satellite of the kind used in a large low-orbit broadband constellation: a few hundred kilograms, one unfolding solar array, flying at 550 km. Everything below is either a physical constant or a bounded assumption.

**Reading one: total radiated power.** In **steady state** — averaged over an orbit, with nothing building up — energy in equals energy out. So the total radiated power equals the collected solar power.

- Solar constant at 1 AU: $1361\,\mathrm{W/m^2}$, known to a fraction of a percent.
- Array area: 5 to $20\,\mathrm{m^2}$; geometric middle $10\,\mathrm{m^2}$.
- **[[Triple-junction|triple-junction]]** cell efficiency: 0.28 to 0.32; middle 0.30.
- Packing, pointing and aging losses: take 0.85.

Peak, in sunlight: $1361 \times 10 \times 0.30 \times 0.85 = 3470\,\mathrm{W}$.

Now the time spent in **[[Earth's shadow|eclipse]]**. Take the worst case, with the Sun in the plane of the orbit. For a circular orbit of radius $r$, the satellite is in shadow over an angle $2\arcsin(R/r)$ of its circle, so the shadowed fraction is $\arcsin(R/r)/\pi$. Here $r = 6371 + 550 = 6921\,\mathrm{km}$ and $6371/6921 = 0.9205$. Its $\arcsin$ is $1.1694\,\mathrm{rad}$; divide by $\pi$ to get 0.3722. So the sunlit fraction is $1 - 0.3722 = 0.6278$.

Orbit-average collected, and therefore radiated: $3470 \times 0.628 = 2179\,\mathrm{W}$ — call it **2.2 kW**.

**Check it with heat.** That power leaves as infrared. Say it radiates from an effective area of $6.0\,\mathrm{m^2}$ with **emissivity** $\varepsilon = 0.85$ (how well a surface radiates, from 0 to 1; not the same $\varepsilon$ as orbital energy). The **[[Stefan–Boltzmann law|stefan-boltzmann]]** gives the temperature:

$$
T = \left(\frac{P}{\varepsilon\sigma A}\right)^{1/4}, \qquad \frac{2179}{0.85 \times 5.670\times 10^{-8} \times 6.0} = 7.535\times 10^{9},
$$

and $(7.535\times 10^{9})^{0.25} = 294.6\,\mathrm{K}$, about 22 °C. A spacecraft running at room temperature is exactly right. Had this come out at 1000 K, the model would be wrong. Two independent laws of physics agreeing is the strongest sanity check there is.

**Reading two: radio-frequency power, supply side.** Work down from the 2.2 kW:

- Battery and distribution, round trip: 0.90.
- Share of bus power going to the communications payload: 0.60 to 0.75; middle 0.671.
- Power amplifier efficiency (how much of its input the amplifier turns into radio signal): 0.20 to 0.35; middle 0.265.

$2179 \times 0.90 \times 0.6708 \times 0.2646 = 348\,\mathrm{W}$. Taking every factor — array area and cell efficiency included — to its lower bound gives about 110 W; every factor to its upper bound gives about 1100 W. The geometric middle is $\sqrt{110 \times 1100} = 348\,\mathrm{W}$, as it must be.

**Reading two, demand side.** Separately: what does the downlink to the user actually need? This is a **link budget**, kept in **[[decibels|decibels]]** so that multiplying becomes adding. Every line is a stated assumption.

| Line | Value | Basis |
| --- | --- | --- |
| Frequency, wavelength | 11 GHz, 0.0273 m | [[Ku-band|ku-band]] downlink |
| Slant range at 40° elevation | 812 km | Geometry from 550 km |
| Free-space path loss | 171.5 dB | $(4\pi d/\lambda)^2$ |
| User terminal gain | 33.0 dBi | 0.5 m aperture, 60 % efficient |
| System noise temperature | 250 K | Antenna plus receiver plus rain |
| Bandwidth | 240 MHz | One channel |
| Noise power $kTB$ | $-120.8$ dBW | $1.381\times 10^{-23} \times 250 \times 2.4\times 10^{8}$ |
| Required carrier-to-noise | 8 dB | Modest modulation and coding |

(Free-space path loss is how much the signal spreads out over distance $d$ at wavelength $\lambda$. "dBi" is gain compared with an antenna that sends equally in all directions; "dBW" is power compared with one watt. $kTB$ is the background noise: Boltzmann's constant times noise temperature times bandwidth.)

The receiver needs a signal 8 dB above the noise: $-120.8 + 8 = -112.8\,\mathrm{dBW}$. Add back the path loss, subtract the user dish's gain, and the satellite's **[[EIRP|eirp]]** must be $-112.8 + 171.5 - 33.0 = 25.7\,\mathrm{dBW}$, about 370 W.

Now the satellite antenna's gain. A **[[spot beam|spot-beam]]** 40 km wide seen from 550 km spans $4.17^\circ$, and a common rule of thumb gives gain $\approx 30\,000/\theta^2$ for a beam $\theta$ degrees wide: $30\,000/4.165^2 = 1730$, which is 32.4 dBi. So the transmit power per beam is $25.7 - 32.4 = -6.7\,\mathrm{dBW}$ — about a fifth of a watt.

**This is where honesty is required.** A fifth of a watt per beam is too small. It leaves out margin for rain, the higher signal-to-noise a fast data mode needs, losses when the user dish is aimed off-center, and the fact that a real antenna's gain is set by its physical size, not by the spot size you would like. Together those are plausibly 18 dB. Then $-6.7 + 18 = 11.3\,\mathrm{dBW}$, about 13.5 W per beam. With 8 to 32 beams at once, that is 110 W to 430 W of radio power.

**Combine the two routes.** Supply side: 110 to 1100 W. Demand side: 110 to 430 W. The overlap is **110 to 430 W, middle about 220 W of radio-frequency power** — and about **2.2 kW radiated in total**, the difference being waste heat.

**Which step dominates.** The amplifier efficiency and the margin allowance, in that order. The array area is fairly well bounded by the spacecraft's physical size. The 18 dB of margin is a guess good to a factor of four either way, and it moves the answer in proportion. If the interviewer will give you one number, ask for that one.
:::

## Geometry estimates

Some space Fermi questions are pure geometry. They reward drawing the picture before writing anything.

::: example How many satellites of a constellation are overhead right now?
**Restate and bound.** Satellites of a constellation at 550 km, seen more than 25° above the horizon from a site at 40° north. That minimum angle is the **elevation mask**. Take the constellation as $N = 6000$ satellites — state it as an input, because the real figure changes month to month. If the interviewer has a better one, substitute it.

**Decompose.** The fraction of the orbital shell that is visible, times $N$, times a correction because a tilted constellation is not spread evenly over the globe.

**Visible fraction.** Draw the triangle: observer, Earth's center, satellite. For elevation mask $E$ and orbit radius $R+h$, the angle at Earth's center out to the edge of what you can see is

$$
\lambda = 90^\circ - E - \arcsin\!\left(\frac{R\cos E}{R+h}\right).
$$

With $R = 6371$, $h = 550$, $E = 25^\circ$: $\cos E = 0.90631$, so $6371 \times 0.90631/6921 = 0.8343$. Its arcsine is $56.54^\circ$, giving $\lambda = 90 - 25 - 56.54 = 8.46^\circ$.

The visible part of the shell is a **spherical cap** — the top of a ball sliced off flat — with half-angle $\lambda$. A cap like that is a fraction $(1-\cos\lambda)/2$ of the whole sphere. With $\cos 8.46^\circ = 0.98912$, that is $(1 - 0.98912)/2 = 0.00544$ — about one two-hundredth of the sky shell.

**Even-spread answer.** $6000 \times 0.00544 = 32.6$ satellites.

**The correction.** A constellation tilted at **inclination** $i$ (the angle between its orbits and the equator) spends more time near latitudes $\pm i$ than anywhere else — each satellite lingers at the top and bottom of its path, like a swing at the ends of its arc. The density compared with even spread is $2/(\pi\sqrt{\sin^2 i - \sin^2\varphi})$ at latitude $\varphi$ ("phi"). For $i = 53^\circ$ and $\varphi = 40^\circ$, the square root is 0.4740, so the factor is 1.343.

**Answer.** $32.6 \times 1.343 = 43.8$ — about **forty satellites above 25° elevation**, at 40° north.

**Sanity check.** At the equator the same formula gives a factor of 0.797, so about 26 satellites; and above 53° latitude the density falls away again. The variation with latitude is under a factor of two ($1.343/0.797 = 1.69$). That is the right size: the constellation is designed to serve populated latitudes fairly evenly.

**Uncertainty.** The constellation size dominates completely. It is a stated input, not an estimate, and everything else here is geometry good to a percent. Say so, because it tells the interviewer exactly which number to hand you.
:::

::: example What launch cadence does a constellation need?
**Restate.** Launches per year to keep a 6000-satellite constellation full once it is built — its **steady state**.

**Decompose.** In steady state, satellites replaced per year equals constellation size divided by working life. Launches per year is that divided by satellites per launch. Two factors to bound.

**Bound them.** Working life 4 to 7 years — long enough to be worth launching, short enough that a low-orbit satellite with little propellant comes down. Geometric middle $\sqrt{4\times 7} = 5.29$ years. Satellites per launch 40 to 60, from a medium launcher's payload mass divided by a few hundred kilograms each. Middle $\sqrt{40\times 60} = 49.0$.

**Multiply.** $6000/(5.29 \times 49.0) = 23.15$ launches per year.

**Uncertainty.** $f_{\text{life}} = \sqrt{7/4} = 1.323$ and $f_{\text{per launch}} = \sqrt{60/40} = 1.225$. Their logs are 0.2798 and 0.2027; squared and added, $0.2798^2 + 0.2027^2 = 0.1194$, and $\sqrt{0.1194} = 0.346$. The total factor is $e^{0.346} = 1.41$. The range is $23.15/1.41 = 16.4$ to $23.15 \times 1.41 = 32.6$.

**Answer.** About **23 launches a year, plausibly between 16 and 33**, with working life the larger of the two uncertainties.

**Sanity check.** Round numbers: $6000/5 = 1200$ replacements a year, and $1200/50 = 24$ launches. About two a month — demanding but not impossible. And it leads to the right conclusion: constellations this size only make sense with **[[reusable rockets|reusable]]**, and the arithmetic shows why in three lines.
:::

## Check yourself

::: check
Why is estimating a satellite's total radiated power easier than estimating its radio-frequency output?
:::

::: answer
Total radiated power is fixed by conservation of energy and one well-known constant. Radio-frequency output depends on several poorly known efficiencies.

In steady state the satellite stores no energy, so everything it collects must leave. Total radiated equals collected, and collected is the solar constant times area times efficiency. The solar constant is known to a fraction of a percent, and the area is bounded by the spacecraft's physical size.

The radio-frequency share needs the payload's slice of the bus power, the amplifier efficiency and how much of the time it transmits — none of which follows from physics. Each is uncertain by a factor of one and a half to two, and they multiply. Saying which of two questions is easier, and why, is itself a good answer: it shows you can see where the information is.
:::

::: check
An interviewer asks for the energy to reach geostationary orbit instead of low Earth orbit, per kilogram. Do it.
:::

::: answer
Same decomposition, different $a$. Geostationary radius is about $4.216\times 10^7\,\mathrm{m}$.

$$
\varepsilon_{\text{GEO}} = -\frac{3.986\times 10^{14}}{2 \times 4.216\times 10^7} = -4.727\times 10^6\,\mathrm{J/kg}.
$$

The surface value is still $-6.256\times 10^7\,\mathrm{J/kg}$, so the energy needed is $6.256\times 10^7 - 4.727\times 10^6 = 5.783\times 10^7\,\mathrm{J/kg}$, about **58 MJ/kg**.

That is 1.75 times the low-orbit figure, not ten times — the interesting part. Geostationary orbit is far away, but the energy penalty is modest, because most of the low-orbit cost is speed, and a higher orbit is slower. Making that observation is worth more than the arithmetic.
:::

::: check
Your link-budget route and your solar-array route disagree by a factor of thirty. What do you do?
:::

::: answer
Say so immediately, then find the factor rather than picking a side.

First check units on both routes, since a factor that large is often a unit slip. Then look at which route has the widest bracket — in this lesson, the link budget, because decibel margins compound and 18 dB is a factor of 63. Then ask which route rests on quantities you actually know. The array route rests on the solar constant, the spacecraft's size and cell efficiency, each bounded within a factor of two. The link route rests on required margin, antenna gain and beam count, some of which span a factor of four each.

Finish with the overlap, not the average. If the brackets overlap, the overlap is your answer, tighter than either. If they do not overlap at all, one model is wrong — and saying *"these do not overlap, so one of my assumptions is not merely imprecise but incorrect, and I would look at the antenna gain first"* is the strongest thing you can say at that moment.
:::

::: check
For the satellites-overhead estimate, what changes if the question asks for satellites above 10° elevation instead of 25°?
:::

::: answer
Only the geometry, and it changes a lot. With $E = 10^\circ$: $\cos E = 0.98481$, so $6371 \times 0.98481/6921 = 0.9065$. Its arcsine is $65.03^\circ$, and $\lambda = 90 - 10 - 65.03 = 14.97^\circ$.

The cap fraction becomes $(1 - 0.96606)/2 = 0.01697$, giving $6000 \times 0.01697 = 102$ satellites before the latitude correction, and about 137 after it at 40° north.

So lowering the mask from 25° to 10° roughly triples the count. The reason: for small $\lambda$ the cap's area grows roughly as $\lambda^2$, and $\lambda$ nearly doubled. In practice, low elevations are avoided because the signal path is longer, passes through more air, and can be blocked by terrain — so the useful number is the one at the mask the system actually uses.
:::

::: check
The launch cadence estimate assumed a steady state. What would you change to estimate the cadence during initial deployment instead?
:::

::: answer
Deployment is a different problem: a stock to be built, not a flow to be kept up. The quantity becomes the constellation size divided by the target deployment time, plus the replacement flow for satellites already in orbit and aging.

For 6000 satellites deployed over 5 years at 49 per launch, building alone takes $6000/(5 \times 49.0) = 24.5$ launches a year. But by the end of that period the early satellites are being replaced, adding up to the steady-state 23 a year on top. So the peak cadence is roughly double the steady-state figure.

The insight to state: deployment cadence is set by how fast you want the service; replacement cadence is set by physics and economics — the satellite's life. They match only by accident, so a constellation's launch demand peaks during deployment and then falls.
:::

## Summary

| Estimate | Result | Dominant uncertainty |
| --- | --- | --- |
| Energy to low Earth orbit | 33.1 MJ/kg, of which 29.4 is kinetic | None — it is a constant-driven calculation |
| Comparison | About one litre of petrol per kilogram to orbit | Fuel energy density, a few percent |
| Real vehicle efficiency | About 12 % | Propellant energy density and payload figure |
| Satellite total radiated power | About 2.2 kW orbit-average; radiator at 295 K | Array area |
| Satellite radio-frequency power | 110–430 W, middle about 220 W | Amplifier efficiency and link margin |
| Satellites above 25° at 40° N | About 40, from 6000 in a 53° shell at 550 km | The constellation size, which is an input |
| Steady-state launch cadence | About 23 per year, range 16–33 | Operational life |
| The structural move | Estimate from supply and from demand, then intersect | — |

The next lesson takes the case this one avoided: what to do when the number that comes out is absurd. It is the most informative moment in the round, and the one candidates most often panic through.

::: context orbital-energy Climbing out of a well
Think of Earth's gravity as a deep well. Energy is counted from the top, where you would be free of Earth entirely, so everything inside the well has *negative* energy. Standing on the ground you are at the bottom. An orbit is partway up, and it counts its speed as well as its height. The energy to reach orbit is the height of that step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="180" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="250" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <text x="256" y="24" font-size="11" fill="#1f2a44">0 escaped</text>
  <line x1="60" y1="31.8" x2="250" y2="31.8" stroke="#8fb8f0" stroke-width="2"/>
  <text x="256" y="42" font-size="11" fill="#1d6fd1">−4.7 GEO</text>
  <line x1="60" y1="93.5" x2="250" y2="93.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="256" y="97" font-size="11" fill="#1d6fd1">−29.4 LEO</text>
  <line x1="60" y1="176.4" x2="250" y2="176.4" stroke="#1f2a44" stroke-width="3"/>
  <text x="256" y="180" font-size="11" fill="#1f2a44">−62.6 ground</text>
  <line x1="150" y1="174" x2="150" y2="100" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="150,95 145,105 155,105" fill="#b4232c"/>
  <text x="158" y="140" font-size="12" fill="#b4232c">33.1 MJ/kg</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">MJ/kg</text>
</svg>
```

The picture is to scale: the LEO step is a little over half the depth of the well.
:::

::: context triple-junction Three solar cells in one
A **triple-junction** cell stacks three thin layers of different semiconductor materials. Each layer is tuned to a different band of sunlight's colors: the top one catches blue light, the bottom one red and infrared, so less of the Sun's energy passes through unused. Ordinary rooftop silicon cells turn roughly a fifth of sunlight into electricity. Space-grade triple-junction cells reach about 30 percent, which is why they are worth their much higher price on a satellite.
:::

::: context eclipse How long a satellite spends in shadow
Sunlight comes from one side, so Earth casts a shadow roughly as wide as the planet behind it. A low orbit passes straight through that shadow every lap. At 550 km, the part of the circle inside the shadow spans $2\arcsin(6371/6921) = 134^\circ$ — about 37 percent of the orbit, drawn to scale below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="40" width="200" height="120" fill="#6c7a93" opacity="0.25"/>
  <circle cx="150" cy="100" r="65.18" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M175.46,40 A65.18,65.18 0 0,1 175.46,160" fill="none" stroke="#b4232c" stroke-width="4"/>
  <circle cx="150" cy="100" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <g stroke="#f2b880" stroke-width="2.5">
    <line x1="14" y1="60" x2="70" y2="60"/><line x1="14" y1="100" x2="70" y2="100"/><line x1="14" y1="140" x2="70" y2="140"/>
  </g>
  <text x="14" y="50" font-size="12" fill="#1f2a44">sunlight</text>
  <text x="228" y="92" font-size="12" fill="#b4232c">in shadow</text>
  <text x="228" y="108" font-size="12" fill="#b4232c">134° of 360°</text>
  <text x="270" y="152" font-size="11" fill="#1f2a44">shadow</text>
  <text x="120" y="190" font-size="11" fill="#1d6fd1">orbit at 550 km</text>
</svg>
```
:::

::: context stefan-boltzmann Hot things glow harder, much harder
Every warm surface radiates heat as light, mostly invisible infrared at room temperature. The **Stefan–Boltzmann law** says the power radiated is $\varepsilon\sigma A T^4$: emissivity times the constant $\sigma$ ("sigma") times area times temperature to the *fourth* power. Double the temperature and the glow is sixteen times stronger. That steep power is why this check is so forgiving: getting the power wrong by a factor of two moves the temperature by only about 19 percent.
:::

::: context decibels Decibels: multiplying by adding
A **decibel** (dB) is ten times the base-ten logarithm of a power ratio. Adding decibels multiplies ratios, which is why radio engineers keep link budgets in dB. Every 10 dB is a factor of ten; 3 dB is about a factor of two. The bars below are drawn in dB, so their lengths add while the factors multiply.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="14" width="30" height="22"/>
    <rect x="60" y="44" width="100" height="22"/>
    <rect x="60" y="74" width="180" height="22"/>
    <rect x="60" y="104" width="200" height="22"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="30">3 dB</text><text x="98" y="30">× 2</text>
    <text x="12" y="60">10 dB</text><text x="168" y="60">× 10</text>
    <text x="12" y="90">18 dB</text><text x="248" y="90">× 63</text>
    <text x="12" y="120">20 dB</text><text x="268" y="120">× 100</text>
  </g>
  <text x="60" y="144" font-size="11" fill="#6c7a93">bar length ∝ dB (10 px per dB)</text>
</svg>
```
:::

::: context ku-band Radio bands have letter names
Engineers name slices of the radio spectrum with letters reportedly left over from wartime radar secrecy: L, S, C, X, Ku, K, Ka and more. **Ku-band** runs from about 12 to 18 GHz on the classic radar chart, while satellite engineers usually count downlinks around 10.7 to 12.75 GHz as Ku too. Higher frequencies carry more data and allow smaller dishes, but rain soaks them up more — which is why the link budget needs a rain margin.
:::

::: context eirp EIRP: the brightness of a beam
**Effective isotropic radiated power** is how much power an antenna that shouts equally in every direction would need to match your beam's strength in its best direction. It is transmit power times antenna gain — in decibels, the sum. A flashlight with a tight reflector looks far brighter head-on than a bare bulb of the same wattage; its "EIRP" is higher. Satellite regulators often set limits on EIRP rather than on raw power.
:::

::: context spot-beam Spot beams
A **spot beam** lights a small patch of ground rather than a whole continent. Squeezing the same power into a smaller spot makes it stronger there, and because different spots can reuse the same radio frequencies without interfering, a satellite with many spot beams serves far more users. Broadband constellations use phased-array antennas that steer dozens of such beams electronically, with no moving parts.
:::

::: context reusable Why reuse changes the arithmetic
If every launch needs a brand-new rocket, two launches a month means building two rockets a month, forever. With a first stage that lands and flies again — as SpaceX's Falcon 9 boosters have done many times over — the factory mostly builds second stages, and the cost per launch falls. The cadence estimate shows why a large constellation and a reusable rocket tend to arrive together.
:::
