---
id: l11-physics-puzzles
title: "Attacking an unfamiliar physics puzzle"
minutes: 24
covers:
  - physics puzzles and how to attack an unfamiliar one
---

A friend hands you a riddle: *why does ice float?* There is no formula to plug into and no number to find. The whole job is to figure out *what is going on* — and once you have, the explanation takes three sentences.

That is a **physics puzzle**: a question about a situation, with no equation attached and often no number required. It is the third kind of problem in the first-principles round. *Why is the sky blue? Why does air drag make a satellite speed up? Why does a rocket's exhaust plume spread out as it climbs?*

Here the hard part has moved. In a derivation the work is algebra; in a Fermi problem it is bounding the pieces. In a puzzle, the work is **deciding what the mechanism is** — the **mechanism** being the actual physical cause. Once that choice is right, the rest is usually three lines. A candidate who starts calculating before choosing is calculating the wrong thing, and no amount of algebra skill rescues that.

So the method puts the mechanism question first, out loud — which is also why puzzles make good interview questions: the hard part is the part the interviewer can hear.

## The method

Six steps, on the same skeleton the module has used all along.

1. **Restate, and name the observable.** The **observable** is the thing you can actually see or measure that needs explaining. *"Why is the sky blue"* really means *"why does light reaching my eye from directions away from the Sun have more short-wavelength light in it than sunlight does?"* Making the observable exact often knocks out half the possible explanations at once.
2. **List the candidate mechanisms out loud, then choose.** Name two to four possible causes before you pick one. This is the Fermi method's breakdown step, applied to ideas instead of factors. It is the most valuable thirty seconds of the answer.
3. **Find the scale that decides the regime.** A **regime** is a range of conditions where one kind of behavior wins. Almost every puzzle turns on a comparison: particle size against **[[wavelength|wavelength]]**, the distance a molecule travels between bumps against the size of the object, one frequency against another, a speed against the speed of sound. Name the comparison and say which side you are on.
4. **Build the simplest model that could produce the effect.** Simplest means it keeps the mechanism and nothing else.
5. **Test it at the limits.** Push a setting to zero or to infinity and check that the model predicts what must happen. This catches wrong mechanisms faster than anything else.
6. **Close with a prediction.** *"If that is the mechanism, then this other thing should also be true"* — ideally something the interviewer can confirm from everyday life.

::: key
Attacking an unfamiliar physics puzzle: name the observable precisely, list the candidate mechanisms out loud before choosing one, identify the scale comparison that decides the regime, build the simplest model that retains the mechanism, test it at the limits, and close with a prediction the mechanism implies. The mechanism choice is the hard part and the part being graded.
:::

## Why listing candidates first is worth the time

Picture two students. One says "it is scattering" and is right. That shows she remembered. The other says *"this could be scattering, absorption and re-emission, refraction, or fluorescence — and here is how I tell them apart."* That shows a skill that works on a problem nobody has solved yet.

Listing is also insurance. If your first choice is wrong, your recovery is *"then it must be the second one, and here is why"*, not a restart.

Keep the list short, and for each candidate name the observation that would tell it apart. *"If it were absorption, the sky would look the same in every direction. It does not, so it is scattering."*

::: warning A scaling law is not an explanation
Producing $\lambda^{-4}$ and stopping is half an answer. The color you actually see also depends on the light source and on the eye. The same trap appears everywhere: a dependence you found from units or scaling tells you how a quantity *grows or shrinks*, not what sets its size or what else changes it. Say which part of the answer is the mechanism, and which part is everything the mechanism gets multiplied by.
:::

## The limit test

Someone says a recipe scales to any number of guests. You ask: "What about zero guests?" If it still calls for a cup of flour, something is wrong. That is a **limit test**.

It is the most useful tool in a puzzle: fast, no numbers needed, and it kills wrong mechanisms outright. Push a setting in your model to an extreme where you already know the answer. If the model does not give that answer, it is wrong — found in ten seconds, not ten minutes.

- Set the air's density to zero. The sky should be black, as it is on the Moon. Any explanation of sky color that still works in a vacuum is wrong.
- Make the scattering particles much larger than the wavelength. The scattering should stop depending on color. That is why clouds are white, not blue. An explanation that predicts blue clouds is wrong.
- Take the drag to zero. The orbit should not change at all.

::: example Why is the sky blue?
**Name the observable.** Light arriving from directions away from the Sun has extra short-wavelength (blue) light compared with direct sunlight. And direct sunlight has *lost* some of its short wavelengths. That second half is a clue most answers miss.

**Candidates.** Scattering by air molecules. Scattering by dust and droplets. Absorption and re-emission by some gas. Refraction — the bending that makes a rainbow. Now tell them apart. Refraction sorts colors by direction, which would give a rainbow-striped sky, not an even blue. Absorption and re-emission would not depend on viewing direction the way the sky does, and would change the direct beam in a way we do not see. Dust scattering happens, but dust and droplets are about as big as the wavelength or bigger, and there scattering hardly depends on color — that is why haze is white. What is left is scattering by molecules much smaller than the wavelength.

**The scale comparison.** An air molecule is about $0.3\,\mathrm{nm}$ across (a nanometer is a billionth of a meter). Visible light has wavelengths from 400 to 700 nm. So the scatterer is more than a thousand times smaller than the wavelength. That is the **[[Rayleigh regime|rayleigh]]**, and the regime is what fixes how scattering depends on color.

**The simplest model.** Light is a wave of electric field, wiggling back and forth. It pushes a molecule's electrons one way and its nucleus the other, making an **[[induced dipole|induced-dipole]]** — a tiny separated pair of charges. Its strength is $p = \alpha E$. Here $p$ is the dipole moment, $E$ is the electric field, and $\alpha$ (read "alpha") is the **polarizability**, a property of the molecule that barely depends on wavelength. A wiggling dipole is a tiny antenna. It radiates power proportional to $\omega^4 p^2$, where $\omega$ (read "omega") is the angular frequency of the wiggle — see **[[why the fourth power|omega-four]]**. So the scattered power goes as $\omega^4$. Since $\omega = 2\pi c/\lambda$, with $\lambda$ (read "lambda") the wavelength,

$$
\text{scattered power} \propto \frac{1}{\lambda^4}.
$$

The symbol $\propto$ reads "is proportional to".

**Check it with units.** The scattering **cross-section** — the effective target area a molecule presents to light — must have units of area. It is built from $k^4\alpha^2$, where $k = 2\pi/\lambda$ has units $\mathrm{m^{-1}}$ and the polarizability, written as a volume, has units $\mathrm{m^3}$. So $\mathrm{m^{-4}} \times \mathrm{m^6} = \mathrm{m^2}$. ✓

**Put a number on it.** Blue at 450 nm against red at 650 nm: $(650/450)^4 = 4.35$. Blue scatters about four and a half times as strongly — enough to dominate the sky, not enough to make it one pure color.

**Limit tests.** Remove the air: black sky, as on the Moon. ✓ Make the particles large, as in a cloud: the color dependence disappears and the cloud is white. ✓ Look through a very long path of air, as at sunset: the blue has been scattered out of the direct beam, leaving red. That is the same mechanism seen from the other end. At the horizon, the path through the air is roughly forty times the straight-up path. ✓

**The honest loose end.** Violet at 400 nm scatters even more: $(650/400)^4 = 6.97$. So why is the sky not violet? Because the mechanism is only half the answer. The Sun gives out less power at 400 nm than at 450 nm, some violet is absorbed high in the atmosphere, and human eyes are much less sensitive there. The color you see is the scattering pattern multiplied by the Sun's spectrum and by the eye's response. Saying so, instead of pretending $\lambda^{-4}$ settles it, is what separates an understood answer from a recited one.
:::

::: example Why does atmospheric drag make a satellite go faster?
**Name the observable.** A satellite in low orbit feels a force against its motion, and its speed *increases*. That looks impossible. It is not.

**Candidates.** A measurement mistake. A wrong sign on the drag. A real effect, in which the orbit's change of size matters more than the direct slowing. Ask what drag really changes: it removes energy. And in an orbit, speed is not free — the radius sets it.

**The scale comparison.** Here the comparison is not of lengths but of times. The drag is weak and acts over many orbits. So the orbit stays very nearly a circle and shrinks slowly and smoothly — a **[[quasi-static|quasi-static]]** change. That is what allows the simple model. If drag were strong enough to change the orbit within one lap, the argument would fail, and the satellite would slow down and fall in.

**The simplest model.** For a circular orbit of radius $r$, the speed is $v = \sqrt{\mu/r}$. The **specific energy** — energy per kilogram — is $\varepsilon = -\mu/(2r)$. (It is negative because the satellite is trapped by gravity.) Drag removes energy, so $\varepsilon$ falls. For $\varepsilon$ to fall, $r$ must fall. And since $v$ goes as $r^{-1/2}$ — one over the square root of $r$ — a smaller $r$ means a larger $v$.

**Numbers.** Drop the radius by one kilometer, from 6771 km to 6770 km:

$$
\sqrt{3.986\times 10^{14}/6.771\times 10^6} = 7672.6\,\mathrm{m/s}, \qquad
\sqrt{3.986\times 10^{14}/6.770\times 10^6} = 7673.2\,\mathrm{m/s}.
$$

So the speed rises by 0.57 m/s for each kilometer of altitude lost. Meanwhile the specific energy falls: $-\mu/(2r)$ goes from $-2.94344\times 10^7$ to $-2.94387\times 10^7\,\mathrm{J/kg}$, a loss of 4348 J/kg.

**Where the energy went.** Potential energy (the $-\mu/r$ part) fell by 8696 J/kg. Kinetic energy ($\tfrac12 v^2$) rose by 4348 J/kg. So the total fell by $8696 - 4348 = 4348$ J/kg. The potential energy drops by exactly twice what the kinetic energy gains. That is the **[[virial relation|virial]]** for an inverse-square force, and drag keeps the difference, turning it into heat in the air.

**Limit test.** Set drag to zero: $r$ stays put, $v$ stays put, nothing happens. ✓ Make drag enormous: the orbit is no longer nearly circular, the assumption fails, and the satellite slows and re-enters — which is what really happens at the end. ✓

**Close with a prediction.** If this is right, the orbit's *period* — the time for one lap — must shrink too, since a smaller orbit is a faster one. From $P = 2\pi\sqrt{r^3/\mu}$, it falls by 1.23 s per kilometer of altitude lost. Anyone **[[tracking a decaying satellite|decay-tracking]]** sees exactly that; the shrinking period is how orbital decay is measured in practice. A prediction the interviewer can check is the strongest possible close.
:::

::: note Why potential energy falls by exactly twice the kinetic gain
For a circular orbit, $\tfrac12 v^2 = \mu/(2r)$, so kinetic energy per kilogram is $K = \mu/(2r)$. Potential energy per kilogram is $U = -\mu/r = -2K$. The total is $\varepsilon = K + U = -K$. So whenever the orbit changes size, $\Delta U = -2\,\Delta K$ and $\Delta\varepsilon = -\Delta K$. Losing energy ($\Delta\varepsilon < 0$) forces $\Delta K > 0$: the satellite speeds up by exactly as much energy as drag took away, and gravity supplies both.
:::

::: example Why does a rocket's exhaust plume spread out as it climbs?
**Name the observable.** At liftoff the plume is a narrow column. High up, it is a broad, see-through cone many times wider than the rocket.

**Candidates.** The engine is throttling up. The exhaust is cooling and expanding. The outside air no longer squeezes the jet. The camera angle has changed. Tell them apart: throttle and camera can be checked against the footage, and they do not track altitude the way the effect does. Cooling on its own would shrink the gas, not widen the jet. That leaves squeezing by the air — confinement.

**The scale comparison.** The ratio that decides it is the nozzle exit pressure to the outside pressure, $p_e/p_a$ (read "p sub e over p sub a"). It is the same pair that gave the pressure term in the thrust equation of lesson 2.

**The simplest model.** A nozzle has a fixed exit pressure, set by the engine's chamber and the nozzle's **[[expansion ratio|expansion-ratio]]**. The nozzle knows nothing about the outside. When $p_e < p_a$ the surrounding air squeezes the jet inward, and it stays narrow. When $p_e > p_a$ the jet is at higher pressure than its surroundings, so it pushes outward as soon as it leaves the nozzle. The more it exceeds the outside pressure, the harder it spreads.

**Numbers.** The lesson 2 engine has $p_e = 60\,\mathrm{kPa}$. At sea level, $60/101.3 = 0.5923$: the jet is **over-expanded** (below outside pressure) and gets squeezed. At 40 km the standard atmosphere gives about $0.287\,\mathrm{kPa}$, so the ratio is $60/0.287 = 209$: massively **under-expanded**. The ratio changes by a factor of $209/0.5923 = 353$ during the climb. It rises steadily, so the widening is gradual, not sudden.

**Limit test.** Take the outside pressure to zero — a vacuum. The plume should spread without limit, held back only by how sharply the gas itself can turn. That is exactly what an upper-stage plume looks like: a vast, faint cone. ✓ Make the outside pressure equal $p_e$: the jet should leave the nozzle with straight, parallel sides. That is the definition of perfect expansion, and for this engine it happens near 4 km. ✓

**Close with a prediction.** If confinement is the mechanism, a **[[vacuum-optimized engine|vacuum-engine]]** — big expansion ratio, low $p_e$ — should show the spreading at a *lower* altitude than a sea-level engine, because its exit pressure is smaller and the crossover comes earlier. It should also perform badly at sea level, which is the same statement seen through the thrust equation.
:::

## Check yourself

::: check
What is the first thing you do when handed a physics puzzle you have never seen, and why is it not "start calculating"?
:::

::: answer
Name the observable precisely. Then list the candidate mechanisms out loud before choosing one.

In a puzzle the calculation comes after a decision, and the decision is where the error lives. Choose the wrong mechanism and every later line is correct algebra on the wrong physics — worse than none, because it is confident and long.

It is also the part the interviewer can see. Choosing between scattering and absorption, and saying which observation tells them apart, is visible reasoning. Three lines of algebra afterwards are not.
:::

::: check
One limit test kills many proposed mechanisms for sky color in ten seconds. Which test, and which mechanisms does it kill?
:::

::: answer
Remove the atmosphere. On the Moon, with no air, the sky is black in every direction even with the Sun fully up.

That kills every mechanism that does not need air: light "spreading out" on its own, space having a color, light bounced off the ground reaching the eye from above, and anything about the eye alone.

It also sets a rule for the explanations that survive: the effect must grow with the amount of air along the line of sight. That is testable. The sky is paler near the horizon, where the path is longer and light has been scattered many times, and deepest blue straight overhead, where the path is shortest.
:::

::: check
An interviewer asks whether drag makes *every* satellite speed up. What is the right answer?
:::

::: answer
No. The argument rests on an assumption you should state: the orbit stays nearly circular while weak drag acts slowly over many laps.

Two cases break it. A very **elliptical** (stretched) orbit feels drag mostly near **perigee**, its lowest point. That lowers the **apogee**, its highest point, and makes the orbit rounder. The speed history is then more complicated: the satellite passes perigee, where the drag acts, more slowly than before, while at the lowered apogee it is actually faster. And in the last few laps of a decay, drag is strong enough to change the orbit within one pass. The nearly-circular assumption fails and the vehicle slows hard — the whole basis of atmospheric entry.

So: for a nearly circular orbit under weak drag, speed rises as altitude falls; when drag rivals the orbital motion itself, it does what drag usually does. Naming the assumption and where it fails beats stating the effect alone.
:::

::: check
Clouds are water droplets, and the sky is air molecules. Both scatter the same sunlight. Why is one white and the other blue?
:::

::: answer
The size of the scatterer compared with the wavelength — the scale comparison from step 3.

An air molecule is about 0.3 nm, more than a thousand times smaller than visible light's 400 to 700 nm. There the induced-dipole argument applies and the cross-section goes as $\lambda^{-4}$. Short wavelengths win, and the scattered light is blue.

A cloud droplet is 10 to 20 micrometers (millionths of a meter) — tens of times *larger* than the wavelength. There the scattering acts almost like light bouncing off tiny balls, and it hardly depends on color. All colors scatter alike, and the result is white. The switch between the two happens where particle size is close to the wavelength, which is where the mathematics stops being simple.

The closing prediction: haze and smoke, with particles near the wavelength in size, should look whitish. They do — which is why a polluted sky looks pale.
:::

::: check
Give the general structure of a good puzzle answer in five phrases, and say which phrase earns the most credit.
:::

::: answer
*"Here is exactly what is being asked. Here are the mechanisms it could be, and here is what tells them apart. Here is the scale comparison that puts us in a particular regime. Here is the simplest model, and here is what it predicts at the limits. And here is a further prediction you could check."*

The most credit goes to the second phrase — the candidates, each with a telling-apart observation. The rest is restating, which is cheap, or consequence, which follows once the mechanism is right. Only the second phrase decides something under uncertainty, so only it shows how you decide. It also protects you: with the alternatives named, a wrong first choice costs one sentence, not the round.
:::

## Summary

| Item | Statement |
| --- | --- |
| The puzzle's difficulty | Choosing the mechanism, not the algebra |
| The method | Name the observable, list candidates, find the scale comparison, build the simplest model, test the limits, close with a prediction |
| Most valuable step | Listing candidates with a telling-apart observation for each |
| Limit test | Push a setting to an extreme where the answer is known; wrong mechanisms die at once |
| Rayleigh scattering | Induced dipole radiates as $\omega^4$, so cross-section $\propto \lambda^{-4}$; blue over red is $(650/450)^4 = 4.35$ |
| Why not violet | The Sun's spectrum and the eye's response, not the scattering law alone |
| Drag paradox | $v = \sqrt{\mu/r}$ with $\varepsilon = -\mu/(2r)$: energy falls, radius falls, speed rises by 0.57 m/s per km |
| Virial relation | Potential energy falls by twice what kinetic energy gains |
| Plume spreading | $p_e/p_a$ rises from 0.59 at sea level to about 209 at 40 km |

The last two lessons of the module turn to the other two rounds that sit beside this one and are graded the same way: the coding rounds, and the systems and architecture round.

::: context wavelength The length of one wave
Light travels as a wave, and the **wavelength** is the distance from one crest to the next. Our eyes read wavelength as color: about 400 nanometers looks violet, 450 blue, 650 red. A nanometer is a billionth of a meter, so these waves are far smaller than anything you can see — but still more than a thousand times bigger than an air molecule.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,45 Q42.5,15 65,45 T110,45 T155,45 T200,45 T245,45 T290,45 T335,45" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="42.5" y1="12" x2="132.5" y2="12" stroke="#1f2a44" stroke-width="1"/>
  <text x="140" y="16" font-size="11" fill="#1f2a44">one wavelength</text>
  <text x="20" y="80" font-size="12" fill="#1d6fd1">blue, 450 nm</text>
  <path d="M20,115 Q52.5,85 85,115 T150,115 T215,115 T280,115 T345,115" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="20" y="145" font-size="12" fill="#b4232c">red, 650 nm: longer waves</text>
</svg>
```

The two waves are drawn to scale: the red crest spacing is 130 units against blue's 90, the same 650 to 450 ratio.
:::

::: context rayleigh Named for a lord who explained the sky
The small-particle scattering rule is named after Lord Rayleigh, the British physicist John William Strutt, who worked it out in 1871. He later shared in discovering the gas argon. "Rayleigh scattering" is now everyday vocabulary for anyone who works on optical sensors, star trackers or Earth-observing cameras, because the blue glow of the air is a background they must correct for.
:::

::: context induced-dipole A molecule stretched by light
A molecule is a cloud of negative electrons around positive nuclei. When the electric field of a light wave pushes, the electrons shift one way and the nuclei the other. The molecule now has a plus end and a minus end — a **dipole**. "Induced" means the light made it; it was not there before. As the light's field swings back and forth, the dipole flips back and forth with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="60" r="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="60" r="5" fill="#b4232c"/>
  <text x="80" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">no field</text>
  <line x1="150" y1="60" x2="200" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="210,60 198,54 198,66" fill="#1f2a44"/>
  <text x="178" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">field E</text>
  <circle cx="272" cy="60" r="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="286" cy="60" r="5" fill="#b4232c"/>
  <text x="258" y="65" font-size="16" text-anchor="middle" fill="#1f2a44">−</text>
  <text x="300" y="65" font-size="14" text-anchor="middle" fill="#b4232c">+</text>
  <text x="272" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">electrons pulled back</text>
</svg>
```
:::

::: context omega-four Where the fourth power comes from
A charge radiates only when it accelerates, and the power it sends out grows as its acceleration squared. A charge wiggling back and forth with a fixed size of swing, at angular frequency $\omega$, has an acceleration proportional to $\omega^2$. Squaring that gives $\omega^4$. So doubling the frequency — halving the wavelength — makes a molecule scatter sixteen times as much.
:::

::: context quasi-static Slow enough to stay in balance
"Quasi" is Latin for "as if", so **quasi-static** means "as if standing still". A change is quasi-static when it happens so slowly that the system stays in balance the whole way. Letting air out of a balloon a tiny bit at a time is one example. For a satellite, drag nibbles away a little energy on each of thousands of laps, so at every moment the orbit is still, very nearly, a perfect circle — just a slightly smaller one.
:::

::: context virial An old word for a neat rule
"Virial" comes from the Latin *vis*, meaning force; the German physicist Rudolf Clausius named the idea in 1870 while studying gases. For anything held in orbit by an inverse-square force, it says the potential energy is minus twice the kinetic energy, on average. The same rule lets astronomers weigh galaxy clusters from how fast their galaxies move.
:::

::: context decay-tracking How engineers watch orbits shrink
Tracking networks, such as the one run by the US Space Force, publish orbit data for thousands of objects in a standard format called a two-line element set. One of the numbers in it is the **mean motion** — laps per day — and another is how fast that is changing. A satellite that is steadily completing laps faster is sinking. The International Space Station feels this drag too, and has to be boosted back up from time to time using the thrusters of docked spacecraft.
:::

::: context expansion-ratio How wide the nozzle's mouth is
The **expansion ratio** is the nozzle's exit area divided by its narrowest area, the throat. A bigger ratio lets the gas expand more inside the nozzle, so it leaves faster and at lower pressure. The three plume shapes below come from the same comparison of exit pressure with outside pressure.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g fill="#6c7a93">
    <polygon points="45,20 75,20 80,50 40,50"/>
    <polygon points="165,20 195,20 200,50 160,50"/>
    <polygon points="285,20 315,20 320,50 280,50"/>
  </g>
  <polygon points="40,50 80,50 72,120 48,120" fill="#f2b880"/>
  <polygon points="160,50 200,50 200,120 160,120" fill="#f2b880"/>
  <polygon points="280,50 320,50 350,120 250,120" fill="#f2b880"/>
  <text x="60" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">p_e below p_a</text>
  <text x="60" y="158" font-size="11" text-anchor="middle" fill="#1d6fd1">squeezed</text>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">p_e equals p_a</text>
  <text x="180" y="158" font-size="11" text-anchor="middle" fill="#1d6fd1">straight sides</text>
  <text x="300" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">p_e above p_a</text>
  <text x="300" y="158" font-size="11" text-anchor="middle" fill="#1d6fd1">spreads out</text>
</svg>
```
:::

::: context vacuum-engine Two versions of the same engine
Rocket makers often build one engine in two versions. The sea-level version has a short nozzle, so its exhaust is not squeezed too hard by the thick air at launch. The vacuum version, used on the upper stage, has a much larger nozzle bell to squeeze more push out of the gas where there is no air. SpaceX's Merlin and Merlin Vacuum are a well-known pair: the vacuum nozzle is far wider than the sea-level one.
:::
