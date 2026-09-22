---
id: l09-worked-space-estimates
title: "Worked space estimates, and how to bound them"
minutes: 24
covers:
  - worked space Fermi examples and how to bound them
---

The previous lesson gave the method. This one runs it four times on the problems this round actually asks, in the domain it asks them in. Read these as transcripts: each is roughly what three minutes at a whiteboard should sound like, with every assumption named as an assumption and every number carried with its units.

One rule governs all four. An interviewer who hears *"I do not know the array area, so I am bounding it between five and twenty square metres from the size of the spacecraft"* learns far more about you than one who hears a confident number you invented — and if they happen to know the real figure, the first answer survives the correction and the second does not.

::: warning Never invent a specification you do not have
Where an estimate depends on a real system's figure you cannot check — an array area, a transmit power, a constellation size — build the quantity from physics and label the input as an assumption with a bracket. A fabricated specification is worse than a bracket in two ways: it cannot absorb a correction, and if the interviewer knows the true value they have learned that you will state numbers you cannot support.
:::

## Two routes to any resource estimate

Before the examples, one structural idea that does most of the work in this domain.

Any quantity that is produced and then consumed can be estimated from either end. **Supply side**: how much is available? **Demand side**: how much is needed? The two routes use different physics and different assumptions, so they fail in different ways — and when both are run, their overlap is tighter than either bracket alone.

This is the most powerful move available in a space estimation problem, because spacecraft are resource-limited machines. Power, propellant, data rate, thermal capacity and mass are all produced by one part of the vehicle and consumed by another. Saying *"let me bound this from the supply side and then check it against what the payload actually needs"* is a strong opening, and the two answers agreeing is a much better close than any single number.

::: key
Worked space estimates bound a resource from both ends: supply, what the vehicle can produce, and demand, what the payload requires. The two routes use different assumptions, so their brackets overlap in a narrower band than either alone. Headline results to carry: about 33 MJ per kilogram to low Earth orbit, roughly one litre of petrol; a broadband satellite radiating a couple of kilowatts in total, of which a few hundred watts is radio frequency.
:::

::: example How much energy does it take to put a kilogram into low Earth orbit?
**Restate.** The minimum energy, in joules per kilogram of payload, to go from rest on the surface to a circular orbit at 400 km. Minimum means ideal: no losses, no atmosphere, and ignoring the Earth's rotation, which helps by a few per cent.

**Decompose.** Specific orbital energy is $\varepsilon = -\mu/(2a)$, and on the surface at rest it is $-\mu/R$. The energy needed is the difference. Two terms, both from constants.

**Numbers.** $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$, $R = 6.371\times 10^6\,\mathrm{m}$, $a = R + 400\,\mathrm{km} = 6.771\times 10^6\,\mathrm{m}$.

$$
\varepsilon_{\text{surface}} = -3.986\times 10^{14}/6.371\times 10^6 = -6.256\times 10^7\,\mathrm{J/kg},
$$
$$
\varepsilon_{\text{orbit}} = -3.986\times 10^{14}/(2\times 6.771\times 10^6) = -2.943\times 10^7\,\mathrm{J/kg}.
$$

The difference is $6.256\times 10^7 - 2.943\times 10^7 = 3.313\times 10^7\,\mathrm{J/kg}$ — **33.1 MJ per kilogram.**

**Where it goes.** Kinetic energy in orbit is $\tfrac12 v^2$ with $v = 7673\,\mathrm{m/s}$, which is 29.4 MJ/kg; the rest, 3.70 MJ/kg, is the climb. Speed dominates by a factor of eight, which is the physical statement worth making: getting to orbit is about going sideways fast, not about going up.

**Sanity check against something known.** Petrol holds about 46 MJ per kilogram and has a density near 0.745, so $46 \times 0.745 = 34.3\,\mathrm{MJ/L}$. **One litre of petrol is about the energy needed to put one kilogram into orbit.** That is a memorable, checkable result, and it is the answer to the second half of the module's own Fermi drill.

**Second check, against a real vehicle.** A medium launcher burning about 400 t of propellant to deliver 15 t — round numbers, not a quoted specification — releases roughly $4.00\times 10^5 \times 10^7 = 4.00\times 10^{12}\,\mathrm{J}$ if the propellant mixture yields about 10 MJ per kilogram. Per kilogram of payload that is $4.00\times 10^{12}/15000 = 2.67\times 10^8\,\mathrm{J/kg}$, so the overall efficiency is $3.313\times 10^7/2.67\times 10^8 = 0.124$ — about twelve per cent. Plausible: the losses are the rocket equation's exponential, gravity and drag losses, and the fact that most of the propellant is spent accelerating other propellant.

**Uncertainty.** The ideal figure is good to better than one per cent, because it comes from constants. The vehicle comparison is good to maybe a factor of two, dominated by the propellant energy density and the payload figure.
:::

## Defining the question before answering it

The next example is the one the module's summary implies and the one most likely to be asked in a space interview. Its first difficulty is not physics: it is that the question has two meanings that differ by an order of magnitude, and choosing between them is the first thing you must do out loud.

::: example Estimate the power a communications satellite radiates
**Restate, and split.** *"Radiates"* can mean two things. **Total electromagnetic power radiated**, which in steady state is everything the satellite collects, almost all of it leaving as infrared waste heat. Or **radio-frequency power radiated by the payload**, which is a modest fraction of that. I will do both, because the first bounds the second.

**No specification is assumed.** Take a satellite of the general class used in a large low-orbit broadband constellation: a few hundred kilograms, one deployable array, operating at 550 km. Everything below is either a physical constant or a bounded assumption.

**Reading one: total radiated power.** In steady state, over an orbit, energy in equals energy out — the spacecraft stores nothing. So the total radiated power is the collected solar power.

- Solar constant at 1 AU: $1361\,\mathrm{W/m^2}$, known to a fraction of a per cent.
- Array area: between 5 and $20\,\mathrm{m^2}$; geometric middle $10\,\mathrm{m^2}$.
- Triple-junction cell efficiency: 0.28 to 0.32; middle 0.30.
- Packing, pointing and degradation: take 0.85.

Peak, in sunlight: $1361 \times 10 \times 0.30 \times 0.85 = 3470\,\mathrm{W}$.

Now the eclipse fraction. For a circular orbit of radius $r$ with the Sun in the orbit plane — the worst case — the satellite is in shadow over a central angle $2\arcsin(R/r)$, so the shadowed fraction of the orbit is $\arcsin(R/r)/\pi$. With $6371/6921 = 0.9205$, $\arcsin$ gives $1.1694\,\mathrm{rad}$, and dividing by $\pi$ gives 0.3722. So the sunlit fraction is $1 - 0.3722 = 0.6278$.

Orbit-average collected, and therefore radiated: $3470 \times 0.628 = 2179\,\mathrm{W}$ — call it **2.2 kW**.

**Check it thermally.** If that leaves as infrared from an effective radiating area of $6.0\,\mathrm{m^2}$ at emissivity 0.85, the Stefan–Boltzmann law gives

$$
T = \left(\frac{P}{\varepsilon\sigma A}\right)^{1/4}, \qquad 2179/(0.85 \times 5.670\times 10^{-8} \times 6.0) = 7.535\times 10^{9},
$$

and $(7.535\times 10^{9})^{0.25} = 294.6\,\mathrm{K}$, about 22 °C. A spacecraft running at room temperature is exactly right, and if this had come out at 1000 K the model would have been wrong. Two independent physical laws agreeing is the strongest sanity check available.

**Reading two: radio-frequency power, supply side.** Work down from the 2.2 kW:

- Battery and distribution round-trip: 0.90.
- Fraction of bus power to the communications payload: 0.60 to 0.75; middle 0.671.
- Power amplifier efficiency: 0.20 to 0.35; middle 0.265.

$2179 \times 0.90 \times 0.6708 \times 0.2646 = 348\,\mathrm{W}$. Taking every factor to its lower bound gives about 110 W and every factor to its upper bound about 1100 W, whose geometric middle is $\sqrt{110 \times 1100} = 348\,\mathrm{W}$, as it must be.

**Reading two, demand side.** Independently: what does the downlink actually need? A link budget in decibels, with every assumption stated.

| Line | Value | Basis |
| --- | --- | --- |
| Frequency, wavelength | 11 GHz, 0.0273 m | Ku-band downlink |
| Slant range at 40° elevation | 812 km | Geometry from 550 km |
| Free-space path loss | 171.5 dB | $(4\pi d/\lambda)^2$ |
| User terminal gain | 33.0 dBi | 0.5 m aperture, 60 % efficient |
| System noise temperature | 250 K | Antenna plus receiver plus rain |
| Bandwidth | 240 MHz | One channel |
| Noise power $kTB$ | $-120.8$ dBW | $1.381\times 10^{-23} \times 250 \times 2.4\times 10^{8}$ |
| Required carrier-to-noise | 8 dB | Modest modulation and coding |

Required carrier power is $-120.8 + 8 = -112.8\,\mathrm{dBW}$, so the satellite's effective isotropic radiated power must be $-112.8 + 171.5 - 33.0 = 25.7\,\mathrm{dBW}$, about 370 W.

Spot-beam gain: a 40 km spot from 550 km subtends $4.17^\circ$, and $30000/4.165^2 = 1730$, which is 32.4 dBi. So the transmit power per beam is $25.7 - 32.4 = -6.7\,\mathrm{dBW}$, a fifth of a watt.

**That is where the honesty is required.** A fifth of a watt per beam is clearly too small: it omits rain fade margin, the higher carrier-to-noise a high-rate mode needs, scan loss at the user terminal, and the fact that a real satellite antenna's gain is set by its aperture rather than by the spot size you would like. Those together are plausibly 18 dB, and $-6.7 + 18 = 11.3\,\mathrm{dBW}$, about 13.5 W per beam. With 8 to 32 simultaneous beams that is 110 W to 430 W of radio-frequency power.

**Combine the two routes.** Supply side says 110 to 1100 W. Demand side says 110 to 430 W. The overlap is **110 to 430 W, middle about 220 W of radio-frequency power** — and about **2.2 kW radiated in total**, the difference being waste heat.

**Which step dominates.** The amplifier efficiency and the margin allowance, in that order. The array area is comparatively well bounded by the physical size of the spacecraft; the 18 dB of assumed margin is a guess within a factor of four either way, and it moves the answer proportionally. If the interviewer will give you one number, ask for that one.
:::

## Geometry estimates

Some space Fermi questions are pure geometry, and they reward drawing the picture before writing anything. The next two are of that kind.

::: example How many satellites of a constellation are overhead right now?
**Restate and bound.** Satellites of a 550 km constellation above 25° elevation, as seen from a site at 40° north. Take the constellation as $N = 6000$ satellites — state it as an input, because the real figure changes month to month, and if the interviewer has a better one, substitute it.

**Decompose.** Fraction of the shell that is visible, times $N$, times a correction for the fact that an inclined constellation is not uniformly spread over the sphere.

**Visible fraction.** Draw the triangle: observer, Earth centre, satellite. For minimum elevation $E$ and orbit radius $R+h$, the Earth-central angle to the horizon of visibility is

$$
\lambda = 90^\circ - E - \arcsin\!\left(\frac{R\cos E}{R+h}\right).
$$

With $R = 6371$, $h = 550$, $E = 25^\circ$: $\cos E = 0.90631$, so $6371 \times 0.90631/6921 = 0.8343$, whose arcsine is $56.54^\circ$, giving $\lambda = 90 - 25 - 56.54 = 8.46^\circ$.

A spherical cap of half-angle $\lambda$ is a fraction $(1-\cos\lambda)/2$ of the sphere. With $\cos 8.46^\circ = 0.98912$, that is $(1 - 0.98912)/2 = 0.00544$.

**Uniform answer.** $6000 \times 0.00544 = 32.6$ satellites.

**The correction.** A constellation at inclination $i$ spends more time near latitude $\pm i$ than anywhere else, so its surface density is not uniform. The density relative to uniform is $2/(\pi\sqrt{\sin^2 i - \sin^2\varphi})$ at latitude $\varphi$. For $i = 53^\circ$ and $\varphi = 40^\circ$ the square root is 0.4740, so the factor is 1.343.

**Answer.** $32.6 \times 1.343 = 43.8$ — about **forty satellites above 25° elevation**, at 40° north.

**Sanity check.** At the equator the same formula gives a factor of 0.797, so 26 satellites, and above 53° latitude the density falls away again. The variation with latitude is a factor of under two, which is the right size: the constellation is designed to serve populated latitudes reasonably evenly.

**Uncertainty.** The constellation size dominates completely — it is a stated input, not an estimate, and everything else here is geometry good to a per cent. Say that, because it tells the interviewer exactly which number to hand you.
:::

::: example What launch cadence does a constellation need?
**Restate.** Launches per year to hold a constellation of 6000 satellites at steady state, once deployment is complete.

**Decompose.** At steady state, replacements per year equals the constellation size divided by the operational life; launches per year is that divided by the number of satellites per launch. Two factors to bound.

**Bound them.** Operational life 4 to 7 years — long enough to be worth launching, short enough that a low-orbit satellite with limited propellant deorbits — with geometric middle $\sqrt{4\times 7} = 5.29$ years. Satellites per launch 40 to 60, middle $\sqrt{40\times 60} = 49.0$; the bound comes from a medium launcher's payload mass divided by a few hundred kilograms per satellite.

**Multiply.** $6000/(5.29 \times 49.0) = 23.15$ launches per year.

**Uncertainty.** $f_{\text{life}} = \sqrt{7/4} = 1.323$ and $f_{\text{per launch}} = \sqrt{60/40} = 1.225$, so $0.2798^2 + 0.2027^2 = 0.1194$ and $\sqrt{0.1194} = 0.346$, giving a total factor of $e^{0.346} = 1.41$. The range is $23.15/1.41 = 16.4$ to $23.15 \times 1.41 = 32.6$.

**Answer.** About **23 launches a year, plausibly between 16 and 33**, with the operational life the larger of the two uncertainties.

**Sanity check.** Round numbers: $6000/5 = 1200$ replacements a year, and $1200/50 = 24$ launches. Two a month, roughly — which is a demanding but not impossible cadence, and it is the right conclusion: constellations of this size are only viable with reusable vehicles, and the arithmetic shows why in three lines.
:::

## Check yourself

::: check
Why is estimating a satellite's total radiated power easier than estimating its radio-frequency output?
:::

::: answer
Because total radiated power is fixed by conservation of energy and one well-known constant, while radio-frequency output depends on several poorly known efficiencies.

In steady state the satellite stores no energy, so everything it collects must leave — total radiated equals collected, and collected is the solar constant times area times efficiency. The solar constant is known to a fraction of a per cent and the area is bounded by the physical size of the spacecraft.

The radio-frequency fraction requires the payload's share of the bus power, the amplifier efficiency and the duty cycle, none of which follows from physics. Each is a factor of one and a half to two uncertain, and they multiply. Saying which of two questions is the easier one, and why, is itself a good answer — it shows you can see where the information actually is.
:::

::: check
An interviewer asks for the energy to reach geostationary orbit instead of low Earth orbit, per kilogram. Do it.
:::

::: answer
Same decomposition, different $a$. Geostationary radius is about $4.216\times 10^7\,\mathrm{m}$.

$$
\varepsilon_{\text{GEO}} = -3.986\times 10^{14}/(2 \times 4.216\times 10^7) = -4.727\times 10^6\,\mathrm{J/kg}.
$$

The surface value is unchanged at $-6.256\times 10^7\,\mathrm{J/kg}$, so the energy needed is $6.256\times 10^7 - 4.727\times 10^6 = 5.783\times 10^7\,\mathrm{J/kg}$, about **58 MJ/kg**.

That is 1.75 times the low-orbit figure, not ten times, which is the interesting part: geostationary orbit is far away but the energy penalty is modest, because most of the low-orbit cost is kinetic and a higher orbit is slower. Making that observation is worth more than the arithmetic.
:::

::: check
Your link-budget route and your solar-array route disagree by a factor of thirty. What do you do?
:::

::: answer
Say so immediately, then find the factor rather than picking a side.

The procedure: check units on both routes first, since a factor that large is often a unit slip. Then look at which route has the widest bracket — in this lesson that was the link budget, because decibel margins compound and 18 dB is a factor of 63. Then ask which route depends on quantities you actually know: the array route rests on the solar constant, the spacecraft's size and cell efficiency, all bounded within a factor of two; the link route rests on required margin, antenna gain and beam count, some of which span a factor of four each.

Conclude with the overlap, not the average. If the brackets overlap, the overlap is your answer and it is tighter than either. If they do not overlap at all, one of the models is wrong — and saying *"these do not overlap, so one of my assumptions is not merely imprecise but incorrect, and I would look at the antenna gain first"* is the strongest thing you can say in that moment.
:::

::: check
For the satellites-overhead estimate, what changes if the question asks for satellites above 10° elevation instead of 25°?
:::

::: answer
Only the geometry, and it changes a lot. With $E = 10^\circ$: $\cos E = 0.98481$, so $6371 \times 0.98481/6921 = 0.9065$, whose arcsine is $65.03^\circ$, and $\lambda = 90 - 10 - 65.03 = 14.97^\circ$.

The cap fraction becomes $(1 - 0.96606)/2 = 0.01697$, giving $6000 \times 0.01697 = 102$ satellites before the latitude correction, and about 137 after it at 40° north.

So dropping the elevation mask from 25° to 10° roughly triples the count. The reason is worth stating: the visible cap area grows roughly as $\lambda^2$ for small $\lambda$, and $\lambda$ nearly doubled. In practice low elevation angles are avoided because the slant range is longer, the atmosphere is thicker along the path and terrain obstructs — so the useful number is the one at the mask the system actually uses.
:::

::: check
The launch cadence estimate assumed a steady state. What would you change to estimate the cadence during initial deployment instead?
:::

::: answer
Deployment is a different problem: it is a stock to be built, not a flow to be maintained. The quantity becomes the constellation size divided by the target deployment time, plus the replacement flow for the satellites already in orbit and ageing.

For 6000 satellites deployed over 5 years at 49 per launch, the build rate alone is $6000/(5 \times 49.0) = 24.5$ launches a year. But by the end of that period the early satellites are being replaced, adding up to the steady-state 23 per year on top, so the peak cadence is roughly double the steady-state figure.

The insight to state: deployment cadence is set by how fast you want the service, while replacement cadence is set by physics and economics — the satellite's life. They coincide only by accident, and a constellation's launch demand therefore peaks during deployment and then falls.
:::

## Summary

| Estimate | Result | Dominant uncertainty |
| --- | --- | --- |
| Energy to low Earth orbit | 33.1 MJ/kg, of which 29.4 is kinetic | None — it is a constant-driven calculation |
| Comparison | About one litre of petrol per kilogram to orbit | Fuel energy density, a few per cent |
| Real vehicle efficiency | About 12 % | Propellant energy density and payload figure |
| Satellite total radiated power | About 2.2 kW orbit-average; radiator at 295 K | Array area |
| Satellite radio-frequency power | 110–430 W, middle about 220 W | Amplifier efficiency and link margin |
| Satellites above 25° at 40° N | About 40, from 6000 in a 53° shell at 550 km | The constellation size, which is an input |
| Steady-state launch cadence | About 23 per year, range 16–33 | Operational life |
| The structural move | Estimate from supply and from demand, then intersect | — |

The next lesson takes the case this one avoided: what to do when the number that comes out is absurd. It is the most informative moment in the round and the one candidates most often panic through.
