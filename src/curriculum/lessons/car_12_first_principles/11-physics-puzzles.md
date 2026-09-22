---
id: l11-physics-puzzles
title: "Attacking an unfamiliar physics puzzle"
minutes: 22
covers:
  - physics puzzles and how to attack an unfamiliar one
---

The third kind of problem this round asks is a physics puzzle: a question about a situation, with no equation attached and often no number required. *Why is the sky blue. Why does atmospheric drag make a satellite speed up. Why does a rocket's exhaust plume spread out as it climbs.*

These feel different from the other two because the difficulty has moved. In a derivation you know the physics and the work is algebra; in a Fermi problem you know the mechanism and the work is bounding factors. In a puzzle the work is **deciding what the mechanism is**, and once that decision is made correctly the rest is usually three lines. A candidate who starts calculating before making that decision is calculating the wrong thing, and no amount of algebraic fluency recovers it.

So the method for a puzzle front-loads the mechanism question and does it out loud. That is also what makes puzzles good interview problems: the part that is hard is the part that is audible.

## The method

Six steps, mapping onto the same skeleton the module has used throughout.

1. **Restate, and name the observable.** What exactly is to be explained? *"Why is the sky blue"* is really *"why does light reaching my eye from a direction away from the Sun have more short-wavelength content than sunlight does?"* Making the observable precise often eliminates half the candidate explanations immediately.
2. **List the candidate mechanisms out loud, then choose.** Two to four candidates, named, before you pick. This is the decomposition step of the Fermi method applied to hypotheses rather than to factors, and it is the highest-value thirty seconds in the answer.
3. **Find the scale that decides the regime.** Almost every puzzle turns on a comparison: particle size against wavelength, mean free path against body size, a frequency against a natural frequency, a speed against the speed of sound. Name the comparison and say which side of it you are on.
4. **Build the simplest model that could produce the effect.** Simplest means it retains the mechanism and nothing else.
5. **Test it at the limits.** Send a parameter to zero or infinity and check that the model predicts what must happen. This catches wrong mechanisms faster than anything else.
6. **Close with a prediction.** *"If that is the mechanism, then this other thing should also be true"* — and ideally a thing the interviewer can confirm from ordinary experience.

::: key
Attacking an unfamiliar physics puzzle: name the observable precisely, list the candidate mechanisms out loud before choosing one, identify the scale comparison that decides the regime, build the simplest model that retains the mechanism, test it at the limits, and close with a prediction the mechanism implies. The mechanism choice is the hard part and the part being graded.
:::

## Why listing candidates first is worth the time

A candidate who says "it is scattering" and is right has demonstrated recall. A candidate who says *"this could be scattering, absorption and re-emission, refraction, or fluorescence — and here is how I tell them apart"* has demonstrated something that transfers to a problem nobody has solved.

It is also insurance. If your first choice is wrong, you have already told the interviewer what the alternatives are, so the recovery is *"then it must be the second one, and here is why"* rather than a restart. Interviewers respond to that visibly.

The discipline is to keep the list short and the discrimination concrete. For each candidate, name the observation that would distinguish it. *"If it were absorption, the sky would look the same in every direction. It does not, so it is scattering."*

::: warning A scaling law is not an explanation
Producing $\lambda^{-4}$ and stopping is a half-answer, because the observed colour also depends on the source spectrum and on the detector. The same trap appears elsewhere: a dependence recovered from dimensions tells you how a quantity scales, not what sets its size or what else modifies it. Say which part of the answer is the mechanism and which part is everything the mechanism is multiplied by.
:::

## The limit test

The single most useful tool in a puzzle, because it is fast, it requires no numbers, and it kills wrong mechanisms outright.

Take your model and push a parameter to an extreme where you already know the answer. If the model does not reproduce the known answer, the model is wrong and you have found out in ten seconds rather than ten minutes.

- Set the atmosphere's density to zero: the sky should be black, as it is on the Moon. Any explanation of sky colour that survives a vacuum is wrong.
- Make the scattering particles much larger than the wavelength: the scattering should become wavelength-independent, which is why clouds are white and not blue. An explanation that predicts blue clouds is wrong.
- Take the drag to zero: the orbit should not change at all.

::: example Why is the sky blue?
**Name the observable.** Light arriving from directions away from the Sun is enriched in short wavelengths relative to direct sunlight. Direct sunlight, meanwhile, is *depleted* in short wavelengths — and that second half is a clue most answers miss.

**Candidates.** Scattering by air molecules; scattering by aerosols and dust; absorption and re-emission by a molecular species; refraction. Discriminate: refraction separates colours by direction, which would give a rainbow-banded sky rather than a uniform blue. Absorption and re-emission would not depend on viewing direction the way the sky does, and would leave the direct beam looking different in a way it does not. Aerosol scattering happens but aerosol particles are comparable to or larger than the wavelength, and that regime is nearly wavelength-independent — it is why haze is white. That leaves scattering by molecules much smaller than the wavelength.

**The scale comparison.** An air molecule is about $0.3\,\mathrm{nm}$ across and visible light is 400 to 700 nm, so the scatterer is about a thousand times smaller than the wavelength. That is the Rayleigh regime, and the regime is what fixes the wavelength dependence.

**The simplest model.** A molecule in an oscillating electric field acquires an induced dipole moment $p = \alpha E$, with $\alpha$ the polarisability, which is a property of the molecule and not of the wavelength. An oscillating dipole radiates power proportional to $\omega^4 p^2$. So the scattered power goes as $\omega^4$, and since $\omega = 2\pi c/\lambda$,

$$
\text{scattered power} \propto \frac{1}{\lambda^4}.
$$

**Check it dimensionally.** The cross-section must have units of area. It is built from $k^4\alpha^2$, where $k = 2\pi/\lambda$ has units $\mathrm{m^{-1}}$ and the polarisability volume has units $\mathrm{m^3}$: $\mathrm{m^{-4}} \times \mathrm{m^6} = \mathrm{m^2}$. ✓

**Put a number on it.** Blue at 450 nm against red at 650 nm: $(650/450)^4 = 4.35$. Blue is scattered about four and a half times as strongly, which is enough to dominate the sky's appearance and not so much that the sky is monochromatic.

**Limit tests.** Remove the air: black sky, as on the Moon. ✓ Make the particles large, as in a cloud: the wavelength dependence disappears and the cloud is white. ✓ Look through a long path of air, as at sunset: the blue has been scattered out of the direct beam, leaving red — the same mechanism seen from the other end, and the path through the atmosphere at the horizon is roughly forty times the overhead path. ✓

**The honest loose end.** Violet at 400 nm scatters even more strongly, $(650/400)^4 = 6.97$, so why is the sky not violet? Because the mechanism is only half the answer: the Sun emits less power at 400 nm than at 450, some violet is absorbed high in the atmosphere, and human colour vision is far less sensitive there. The perceived colour is the scattering spectrum multiplied by the solar spectrum and by the eye's response. Saying that — rather than pretending $\lambda^{-4}$ settles it — is the difference between a recited answer and an understood one.
:::

::: example Why does atmospheric drag make a satellite go faster?
**Name the observable.** A satellite in low orbit experiences a force opposing its motion, and its speed *increases*. That looks like a violation of work-energy and is not.

**Candidates.** A measurement artefact; an error in the sign of the drag; a real effect in which the orbit's shape change dominates the direct deceleration. Discriminate by asking what drag actually changes: it removes energy, and in a bound orbit the speed is not a free variable — it is set by the radius.

**The scale comparison.** Here it is not a length scale but a timescale: the drag deceleration acts over many orbits, so the orbit stays very nearly circular and adjusts its radius quasi-statically. That is what licenses the simple model. If the drag were strong enough to change the orbit within one revolution, the argument would not hold and the satellite would simply be decelerating into re-entry.

**The simplest model.** For a circular orbit, $v = \sqrt{\mu/r}$ and the specific energy is $\varepsilon = -\mu/(2r)$. Drag removes energy, so $\varepsilon$ falls, so $r$ falls — and because $v$ goes as $r^{-1/2}$, $v$ rises.

**Numbers.** Dropping from 6771 km to 6770 km of radius, one kilometre:

$$
\sqrt{3.986\times 10^{14}/6.771\times 10^6} = 7672.6\,\mathrm{m/s}, \qquad
\sqrt{3.986\times 10^{14}/6.770\times 10^6} = 7673.2\,\mathrm{m/s}.
$$

So the speed rises by 0.57 m/s for each kilometre of altitude lost, while the specific energy falls: $-\mu/(2r)$ goes from $-2.94344\times 10^7$ to $-2.94387\times 10^7\,\mathrm{J/kg}$, a loss of 4348 J/kg.

**Where the energy went.** Potential energy fell by 8696 J/kg and kinetic energy rose by 4348 J/kg, so the total fell by 4348 J/kg. The potential energy drops by exactly twice what the kinetic energy gains — the virial relation for an inverse-square force — and drag pockets the difference as heat in the atmosphere.

**Limit test.** Set the drag to zero: $r$ is constant, $v$ is constant, nothing happens. ✓ Make the drag enormous: the orbit is no longer quasi-circular, the assumption fails, and the satellite decelerates and re-enters, which is what actually happens at the end. ✓

**Close with a prediction.** If this is right, the orbital *period* must also shorten, since a smaller orbit is a faster one: $2\pi\sqrt{r^3/\mu}$ falls by 1.23 s per kilometre of altitude lost. Anyone tracking a decaying satellite sees exactly that — the period shortening is how orbital decay is measured in practice. A prediction the interviewer can check is the strongest possible close.
:::

::: example Why does a rocket's exhaust plume spread out as it climbs?
**Name the observable.** At liftoff the plume is a narrow column, barely wider than the nozzle. By the time the vehicle is high in the atmosphere the plume is a broad, translucent cone many times the vehicle's diameter.

**Candidates.** The engine is throttling up; the exhaust is cooling and expanding; the ambient air no longer confines the jet; the camera perspective has changed. Discriminate: throttle and camera are testable against footage and do not correlate with altitude the way the effect does. Cooling would narrow the jet, not widen it. That leaves confinement.

**The scale comparison.** The governing ratio is the nozzle exit pressure to the ambient pressure, $p_e/p_a$ — the same quantity that produced the pressure term in the thrust equation of lesson 2.

**The simplest model.** A nozzle has a fixed exit pressure set by its chamber conditions and its expansion ratio; it knows nothing about the outside. When $p_e < p_a$ the surrounding air squeezes the jet inward and it stays narrow. When $p_e > p_a$ the jet is at higher pressure than its surroundings and expands laterally as soon as it leaves the nozzle, and the more it exceeds the ambient the harder it pushes outward.

**Numbers.** With the lesson 2 engine, $p_e = 60\,\mathrm{kPa}$. At sea level, $60/101.3 = 0.5923$: over-expanded, and the jet is squeezed. At 40 km, where the standard atmosphere gives about $0.287\,\mathrm{kPa}$, the ratio is $60/0.287 = 209$: massively under-expanded. The ratio has changed by a factor of $209/0.5923 = 353$ over the ascent, and it is monotonic, so the widening is progressive rather than sudden.

**Limit test.** Take the ambient pressure to zero — vacuum. The plume should expand without limit, bounded only by the gas's own maximum turning angle. That is exactly what an upper-stage plume looks like: a vast, faint cone. ✓ Take the ambient pressure to equal $p_e$: the jet should leave the nozzle parallel-sided, which is the definition of perfect expansion and happens near 4 km for this engine. ✓

**Close with a prediction.** If confinement is the mechanism, then a vacuum-optimised engine — high expansion ratio, low $p_e$ — should show the effect at *lower* altitude than a sea-level engine, because its exit pressure is smaller and the crossover happens earlier. It should also perform badly at sea level, which is the same statement seen from the thrust equation.
:::

## Check yourself

::: check
What is the first thing you do when handed a physics puzzle you have never seen, and why is it not "start calculating"?
:::

::: answer
Name the observable precisely, then list the candidate mechanisms out loud before choosing one.

It is not calculating because in a puzzle the calculation is downstream of a decision, and the decision is where the error lives. If you have chosen the wrong mechanism, every subsequent line is correct algebra applied to the wrong physics — which is worse than no algebra, because it is confident and long.

It is also the part the interviewer can see. Choosing between scattering and absorption, and saying which observation discriminates them, is visible reasoning. Three lines of correct algebra afterwards is not; anyone can do those.
:::

::: check
A limit test kills a proposed mechanism for sky colour in ten seconds. Which test, and which mechanisms does it kill?
:::

::: answer
Remove the atmosphere. On the Moon, with no air, the sky is black in every direction even with the Sun fully up.

That kills any mechanism that does not require air: light "spreading out" on its own, an intrinsic colour of space, scattering from the Earth's surface reaching the eye from above, and anything to do with the human visual system alone.

It also constrains the surviving explanations quantitatively: the effect must scale with the amount of air along the line of sight. That is a testable consequence, and it is confirmed by the fact that the sky is paler near the horizon, where the path is longer and the light has been scattered many times, and deepest overhead where the path is shortest.
:::

::: check
An interviewer asks whether drag makes *every* satellite speed up. What is the right answer?
:::

::: answer
No — the argument depends on an assumption that should be stated, which is that the orbit remains quasi-circular while the drag acts slowly over many revolutions.

Two cases break it. A highly elliptical orbit experiences drag mostly near perigee, which lowers apogee and circularises the orbit; the speed history is then much more complicated, and near apogee the satellite is slower than before. And in the final revolutions of a decay, the drag is strong enough to change the orbit within a single pass, the quasi-circular assumption fails, and the vehicle decelerates hard — which is the entire basis of atmospheric entry.

So the honest statement is: for a nearly circular orbit under weak drag, the speed increases as the altitude falls; when drag becomes comparable to the orbital dynamics themselves, it does what a drag force ordinarily does. Naming the assumption and naming where it fails is a better answer than the effect on its own.
:::

::: check
Clouds are made of water droplets and the sky is made of air molecules, both scattering the same sunlight. Why is one white and the other blue?
:::

::: answer
The size of the scatterer relative to the wavelength — the scale comparison that step 3 of the method asks for.

An air molecule is about 0.3 nm, roughly a thousand times smaller than visible light's 400 to 700 nm. In that regime the induced-dipole argument applies and the cross-section goes as $\lambda^{-4}$, so short wavelengths dominate and the scattered light is blue.

A cloud droplet is 10 to 20 micrometres, twenty to fifty times *larger* than the wavelength. In that regime the scattering is essentially geometric and nearly wavelength-independent, so all colours scatter alike and the result is white. The transition between the two behaviours happens where the particle size is comparable to the wavelength, which is where the mathematics stops being simple.

The prediction that closes it: haze and smoke, whose particles sit near the wavelength in size, should look whitish rather than blue — and they do, which is why a polluted sky is pale.
:::

::: check
Give the general structure of a good puzzle answer in five phrases, and say which phrase carries the most credit.
:::

::: answer
*"Here is exactly what is being asked. Here are the mechanisms it could be, and here is what distinguishes them. Here is the scale comparison that puts us in a particular regime. Here is the simplest model, and here is what it predicts at the limits. And here is a further prediction you could check."*

The most credit is in the second phrase — the candidate list with a discriminating observation for each. Everything else is either restatement, which is cheap, or consequence, which follows once the mechanism is right. The second phrase is the only one where a decision is made under uncertainty, and it is therefore the only one that shows how you decide.

It is also the phrase that protects you. Having named the alternatives, being wrong about your first choice costs you one sentence rather than the round.
:::

## Summary

| Item | Statement |
| --- | --- |
| The puzzle's difficulty | Choosing the mechanism, not the algebra |
| The method | Name the observable, list candidates, find the scale comparison, build the simplest model, test the limits, close with a prediction |
| Highest-value step | Listing candidates with a discriminating observation for each |
| Limit test | Push a parameter to an extreme where the answer is known; wrong mechanisms die immediately |
| Rayleigh scattering | Induced dipole radiates as $\omega^4$, so cross-section $\propto \lambda^{-4}$; blue over red is $(650/450)^4 = 4.35$ |
| Why not violet | Solar spectrum and eye response, not the scattering law alone |
| Drag paradox | $v = \sqrt{\mu/r}$ with $\varepsilon = -\mu/(2r)$: energy falls, radius falls, speed rises by 0.57 m/s per km |
| Virial relation | Potential energy falls by twice what kinetic energy gains |
| Plume spreading | $p_e/p_a$ rises from 0.59 at sea level to about 209 at 40 km |

The last two lessons of the module turn to the other two rounds that sit alongside this one and are graded on the same axis: the coding rounds, and the systems and architecture round.
