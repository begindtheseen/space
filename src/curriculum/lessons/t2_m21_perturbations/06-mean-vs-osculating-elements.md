---
id: l06-mean-vs-osculating-elements
title: Mean vs osculating elements
minutes: 18
covers:
  - mean vs osculating elements
---

Think about the temperature outside. Every day it rises in the afternoon and falls at night. Underneath that daily swing there is a slow trend: the seasons. If you want to know whether spring is coming, one reading at 3 p.m. on Monday and one at 6 a.m. on Tuesday tell you almost nothing — the daily swing swamps the trend. You need the daily *average*.

Orbital elements behave the same way under $J_2$. Take a spacecraft's position and velocity at one instant and compute its six orbital elements. Wait exactly one orbit and do it again. Several of them will not match — even though nothing happened: no engine burn, no drag, nothing you would call a real change in the orbit. The elements you computed are **osculating** elements, and they wobble every orbit, like the daily temperature, on top of whatever slow drift is going on underneath.

The last two lessons already ran into this twice. Both times, a formula and a simulation disagreed by about half a percent, and both times the fix was to use averaged elements. This lesson names the idea properly, measures the wobble, and shows why it is an everyday working fact about how orbit data is made, plotted and shared — not a mathematical nicety.

## The kissing ellipse

Picture a car on a winding road at night. At any instant its headlights point straight ahead, along a line that touches the road at the car's position. If the road suddenly ended and the driver kept the wheel still, the car would follow that line. The line matches the road at one point, then the two go their separate ways.

An orbit works the same way, but with an ellipse instead of a straight line. At any instant, a spacecraft has a position $\mathbf{r}$ and a velocity $\mathbf{v}$. The **osculating elements** at that instant are the orbital elements of the two-body orbit that has exactly this $\mathbf{r}$ and $\mathbf{v}$. That is the ellipse the spacecraft *would* follow from this moment on if every perturbation switched off right now.

"Osculating" comes from the Latin for **[[kissing|osculate-word]]**. The osculating ellipse touches the true path at one point, matching it in both position and velocity, and then the two drift apart, because the real spacecraft keeps being pushed and the ellipse does not.

You already know how to compute osculating elements: they are what the two-body module's position-and-velocity-to-elements conversion gives you. Nothing about the formulas changes. What changes is that the answer now depends on *when* you ask. Under any perturbation, $a(t)$, $e(t)$, $i(t)$ and the rest are functions of time, because the $(\mathbf{r},\mathbf{v})$ you feed in is following a **[[perturbed path|kissing-picture]]**, not a fixed ellipse.

## Why osculating elements wobble

The Gauss variational equations from lesson 3 show the cause. $J_2$'s radial and transverse pushes, $R$ and $T$, depend on the spacecraft's argument of latitude $u$ through $\sin^2 u$ and $\sin 2u$. They are not zero at most points of the orbit. So $da/dt$ and $de/dt$ are not zero at most instants either.

Why, then, does $J_2$ cause no *secular* change in $a$ and $e$? Because the pattern of $R$ and $T$ around one full orbit adds up to zero — the averaging argument of lesson 4. A push forward on one part of the orbit is undone by an equal push backward on another part.

Picture a child on a swing. The swing goes up and down all the time, but over many swings its average position does not move. "Adds up to zero over one orbit" does not mean "is zero at every instant". It means the instant value of $a(t)$ really does rise and fall within each orbit, tracing a loop that comes back to (very nearly) where it started, orbit after orbit, without drifting away.

::: example Measuring the wobble for a 550 km orbit
Use lesson 4's orbit: $a_0 = 6928.137\,\mathrm{km}$, $e_0 = 0.05$, $i_0 = 51.6^\circ$, starting at perigee. Simulate it with the full $J_2$ acceleration for one orbit, and compute the osculating elements at $2000$ points along the way.

**Semi-major axis.** It ranges over
$$
a(t) \in [6915.33,\ 6928.14]\,\mathrm{km},
$$
a peak-to-trough swing of $6928.14 - 6915.33 = 12.81\,\mathrm{km}$. The starting value sits at the very top of the swing.

**Inclination.** It ranges over
$$
i(t) \in [51.560^\circ,\ 51.600^\circ],
$$
a swing of $0.040^\circ$.

**Eccentricity.** It ranges from about $0.0484$ to $0.0500$.

**How often?** Count the peaks and troughs. Over two full orbits, $a$ and $i$ each pass through **eight** turning points — two peaks and two troughs per orbit. So each wobbles **twice per revolution**. That is exactly what the $\sin 2u$ and $\sin^2 u$ in $R$, $T$ and $N$ predict: $\sin 2u$ goes through a full cycle every half orbit.

**Is any of this drift?** No. Run the simulation for many more orbits and the band that $a(t)$ wobbles in stays the same size and in the same place, cycle after cycle. Meanwhile the secular rates $\dot\Omega$ and $\dot\omega$ keep turning the orbit's orientation underneath.

**Sanity check on size.** $J_2 \approx 0.001$, and $0.001 \times 6928\,\mathrm{km} \approx 7\,\mathrm{km}$. A wobble of order ten kilometers in $a$ is exactly what a one-part-in-a-thousand push should produce.
:::

## What mean elements are

**Mean elements** are what is left when the periodic wobble is removed. The short-period part (twice per orbit) goes first. A fuller theory also removes slower long-period swings. What remains changes smoothly and slowly. In the simplest picture, mean elements would stay exactly constant if the only thing acting were the secular drift.

Here is the catch: there is **no single recipe** for "the" mean elements. Different theories remove the periodic terms in different ways and to different accuracies. Their mean elements can disagree with one another by meters to kilometers. That is why, later in this module, the SGP4 lesson insists that the mean elements in a **[[two-line element set|tle]]** belong to the SGP4 theory and cannot be mixed with some other propagator's idea of "mean".

For this module, the simplest honest way to get approximate mean elements is to **average over one orbit** numerically: simulate one full period, compute the osculating elements all the way round, and take their average. That is how the numbers above were made.

This is crude next to a real analytic theory. The classic one is **[[Brouwer's|brouwer]]** 1959 theory, which uses a clever change of variables (a *canonical transformation*) to peel off the short- and long-period terms step by step in powers of $J_2$. SGP4 has its own internal mean elements, related to Brouwer's but not identical. Orbit-averaging captures the key idea with nothing more than the integrator you already have.

::: key Osculating vs mean elements
**Osculating elements** describe the instantaneous two-body orbit tangent to the true trajectory — computed from the current $(\mathbf{r},\mathbf{v})$ with the ordinary two-body formulas — and they wobble every revolution under $J_2$ (twice per revolution for its main terms).

**Mean elements** have the short-period variations analytically removed (and, in fuller theories, the long-period ones too), so they evolve smoothly. Secular-rate formulas such as $\dot\Omega$ and $\dot\omega$ predict the drift of mean elements, not osculating ones. Different mean-element theories are not interchangeable.

The two can differ by tens of kilometers in semi-major axis: about $10$ to $20\,\mathrm{km}$ of wobble each orbit in low Earth orbit, and [[much more for eccentric orbits|big-difference]].
:::

::: example The formula predicts mean elements, not osculating ones
This pulls lesson 4's results together.

**Step 1: feed the formula osculating elements.** Put the starting (osculating) values $a_0 = 6928.137\,\mathrm{km}$, $e_0 = 0.05$, $i_0 = 51.6^\circ$ into the node-rate formula. It predicts $\dot\Omega = -4.6567^\circ/\mathrm{day}$.

**Step 2: measure.** A $200$-orbit simulation from the same state measures $-4.6778^\circ/\mathrm{day}$. That is $0.45\%$ larger, and the gap does not change with step size or tolerance.

**Step 3: average.** Average the osculating elements over the first orbit: $\bar a = 6921.256\,\mathrm{km}$, $\bar e = 0.049\,095$, $\bar i = 51.5795^\circ$.

**Step 4: feed the formula mean elements.** The same formula now predicts $-4.6742^\circ/\mathrm{day}$, within $0.08\%$ of the measurement.

**What it means.** The formula was never wrong. It computes the rate for mean elements. The starting osculating values were never the mean elements, because the simulation started at perigee — one particular point in the wobble, the top of it, not its middle. The averaged $\bar a$ is about $7\,\mathrm{km}$ lower, as the wobble's range said it would be.
:::

## Where the difference changes what you do

Here are three places where this idea changes what an engineer actually does, not only how she thinks.

### Plotting trends

Suppose a ground system records osculating eccentricity once per pass over a station and plots it for a month. The plot contains the real twice-per-orbit wobble, measured at whatever point of the orbit each pass happens to catch. The passes do not land at the same orbital phase each time. The result can look like a slow rise or fall in eccentricity that is not really there.

This trap is called **[[aliasing|aliasing]]**: a fast wiggle, sampled too slowly or unevenly, masquerading as a slow change. The fix is not a nicer plot. It is to trend mean elements instead, or at least to sample at a **fixed phase** — always at perigee, say, or always at the ascending node — so the wobble is the same in every sample and cancels out.

### Comparing theory with data

Every comparison in the last two lessons needed this idea. A secular-rate formula predicts how mean elements drift. If it disagrees with raw osculating data by half a percent, do not declare the formula wrong yet. First average the data, or feed the formula mean elements, as the example above did.

### Handing an orbit from one tool to another

A **[[navigation filter's|nav-filter]]** output is osculating by definition: it is the actual position and velocity right now, or the osculating elements that go with them. A published two-line element set (TLE) is the opposite: a set of mean elements defined *inside* one analytic theory, SGP4.

Treat one as the other — for example, feed a TLE's numbers into your own simulation as if they were osculating elements — and you make an error of the same kind as the $12.8\,\mathrm{km}$ wobble above. You make it immediately, at the starting instant, before your simulation has had any chance to build up errors of its own. The SGP4 lesson later in this module comes back to this in full.

::: warning A navigation filter's output is osculating, not mean
It is tempting to think of "the best estimate of the orbit" from a Kalman filter or a batch least-squares fit as already clean and averaged, because it came out of a careful statistical process. It is not. The filter averaged away *measurement noise*. It did not remove any wobble — it estimated the real instant state, wobble included. Put that state straight into a secular-rate formula, or difference two such states a few orbits apart to estimate a drift rate, and the full osculating wobble rides along as apparent noise on top of the real signal — the same aliasing trap as above.
:::

## Check yourself

::: check
A spacecraft's osculating semi-major axis is $6928.1\,\mathrm{km}$ at one instant and $6915.3\,\mathrm{km}$ half an orbit later. Has the orbit lost energy for good?
:::

::: answer
Not necessarily — and for this lesson's example orbit, no. A drop of about $12.8\,\mathrm{km}$ is exactly the normal size of $J_2$'s wobble in osculating $a$, which repeats twice per orbit and comes back to (very nearly) its starting value by the end of each orbit. Two snapshots half an orbit apart cannot tell that wobble from a real, lasting decay (such as drag causes). To tell them apart, track $a$ over many orbits, or compare mean elements at two times far apart.
:::

::: check
Lesson 4's averaging argument says $J_2$ gives no secular change in $a$. Why doesn't that contradict the fact that osculating $a(t)$ visibly swings up and down within one orbit?
:::

::: answer
The averaging argument says that $da/dt$, added up over one full orbit, comes to zero: the *net* change per orbit is zero, so there is no secular drift. It says nothing about $da/dt$ at any single instant. The Gauss equations show that the instant rate depends on $R$ and $T$ at the spacecraft's current position, and those are usually not zero. A quantity can swing a lot within an orbit and still come back to its starting value at the end. "No net change per orbit" and "wobbles within each orbit" are two true statements that fit together.
:::

::: check
An analyst wants to confirm that a satellite's inclination is holding steady over a six-month mission. Should she plot osculating inclination sampled once a day, or something else?
:::

::: answer
Something else. Osculating inclination sampled once a day contains the real twice-per-orbit wobble (hundredths of a degree for a typical low orbit), caught at a different point of the orbit each day. That can look like noise or like a slow false trend, depending on how the sample times fall. Better: average the inclination over each day's orbits before plotting, or always sample at the same orbital phase (for example, every time the satellite crosses the ascending node) so the wobble is the same in every sample. What is left is the real secular and long-period behavior.
:::

::: check
Why is "mean elements" not one single well-defined thing, the way "osculating elements" is?
:::

::: answer
Osculating elements have one clear definition: the elements of the exact two-body orbit that touches the current state. Mean elements depend on *which* periodic terms a theory chooses to remove, and how accurately. Averaging over one orbit, Brouwer's theory, and SGP4's own theory all give numbers that are close but not the same, because each makes different choices about what counts as periodic and what counts as secular, and carries its corrections to a different accuracy. "Mean" always means "mean according to a particular theory".
:::

::: check
A colleague says that since mean elements are "more correct" than osculating ones, every navigation filter should be rebuilt to estimate mean elements instead of the instant state. What is wrong with insisting on that everywhere?
:::

::: answer
Mean elements are not more correct. They answer a different question. A navigation filter's job is usually to know where the spacecraft really is *right now* — for pointing an antenna, aiming a burn or dodging debris. That is exactly the instant, osculating state. Averaging it would throw away real motion the mission may need. Mean elements are the right tool for other questions: predicting long-term drift, comparing with an analytic theory, or plotting trends. They complement the osculating state; they do not replace it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Osculating elements | Elements of the two-body orbit that exactly touches the current $(\mathbf{r},\mathbf{v})$; change with time under any perturbation |
| Mean elements | The slow, smooth part left after periodic terms are removed; depend on the theory used |
| $J_2$ short-period wobble | Twice per orbit, from the $\sin2u$ and $\sin^2u$ in $R$, $T$, $N$; about $10$–$20\,\mathrm{km}$ peak to trough in $a$ in low orbit ($12.8\,\mathrm{km}$ for the running example) |
| Secular-rate formulas | Predict how mean elements drift; fed osculating elements they leave a real, explainable gap |
| Aliasing | A fast wobble sampled slowly or unevenly can look like a false slow drift; trend mean elements or sample at a fixed phase |
| Filter output | Osculating (instant), not mean — do not treat it as already averaged |

The next lesson turns to a very different kind of push: atmospheric drag. Drag depends on speed, always works against the motion, and — unlike $J_2$ — causes a real, lasting decay in $a$ and $e$, not a wobble that comes back.

::: context osculate-word A word borrowed from kissing
*Osculari* is Latin for "to kiss". Mathematicians use "osculating" for a curve that touches another as closely as possible at one point — same position, same direction. An osculating circle hugs a curve at a point better than any other circle. In orbits, the osculating ellipse hugs the true path at the current instant, then peels away.
:::

::: context kissing-picture The ellipse that touches the real path
The blue ellipse is the osculating orbit at the instant the spacecraft is at the red dot. The dark curve is the real, perturbed path. They share the red dot and the direction of motion there, then separate. A moment later the spacecraft has a new osculating ellipse, slightly different from this one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <ellipse cx="146.25" cy="112" rx="95" ry="92" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="253.0,135.7 252.9,129.1 252.4,122.6 251.6,116.3 250.5,110.3 249.1,104.3 247.4,98.6 245.5,93.0 243.3,87.6 240.8,82.3 238.2,77.2 235.3,72.3 232.1,67.5 228.7,62.9 225.1,58.4 221.3,54.0 217.1,49.9 212.8,45.9 208.1,42.0 203.2,38.4 198.1,34.9 192.6,31.7 186.8,28.6 180.7,25.9 174.4,23.4 167.6,21.3 160.6,19.4 153.3,18.0 145.7,17.0 137.7,16.5 129.5,16.5 121.1,17.1 112.4,18.3 103.6,20.2 94.7,22.8 85.8,26.2 76.8,30.3 68.0,35.3 59.4,41.2 51.1,47.9 43.3,55.4"/>
  <circle cx="170" cy="112" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="198.1" cy="34.9" r="5" fill="#b4232c"/>
  <text x="206" y="28" font-size="11" fill="#b4232c">spacecraft now</text>
  <text x="258" y="100" font-size="11" fill="#1f2a44">real path</text>
  <text x="200" y="196" font-size="11" fill="#1d6fd1">osculating ellipse</text>
  <text x="200" y="210" font-size="11" fill="#1d6fd1">(this instant only)</text>
</svg>
```

The drawing exaggerates the difference hugely so you can see it.
:::

::: context tle The two-line element set
A TLE is a compact text format for an orbit: two lines of $69$ characters each, holding an ID number, an epoch (the instant the elements refer to), mean motion, eccentricity, inclination, node, argument of perigee, mean anomaly and a drag term called B*. The United States military tracks tens of thousands of objects and publishes TLEs for most of them. They are the most widely used orbit data in the world, and every one of them is meant to be run through SGP4.
:::

::: context brouwer Brouwer's theory
Dirk Brouwer, an astronomer at Yale, published his theory of an artificial satellite's motion under Earth's oblateness in 1959, two years after Sputnik. Instead of chasing the wobble directly, he changed variables step by step until the new variables — the mean elements — changed only slowly and smoothly. The formulas that convert between his mean elements and osculating ones are long but exact to the order he kept. Much of later satellite theory, including SGP4, builds on his.
:::

::: context big-difference When the gap gets big
For a nearly circular low orbit the osculating and mean semi-major axes differ by up to about ten kilometers. For a very stretched orbit the gap is much larger, because $J_2$'s push is fiercest at a low perigee. For a Molniya orbit ($a \approx 26\,550\,\mathrm{km}$, $e = 0.74$), a simulation shows the osculating $a$ at perigee sitting about $95\,\mathrm{km}$ above its orbit average, and swinging through about $130\,\mathrm{km}$ as the satellite sweeps past perigee.
:::

::: context aliasing When fast wiggles look slow
The blue wave is a fast wobble. The red dots sample it a little less often than once per wiggle. Joined up, the dots trace a slow wave that is not really there. This is the same effect that makes wagon wheels seem to turn backward in films.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#8fb8f0" stroke-width="1.5" points="30.0,45.0 31.6,47.0 33.1,52.6 34.6,61.5 36.2,72.6 37.8,85.0 39.3,97.4 40.9,108.5 42.4,117.4 44.0,123.0 45.5,125.0 47.0,123.0 48.6,117.4 50.2,108.5 51.7,97.4 53.2,85.0 54.8,72.6 56.4,61.5 57.9,52.6 59.5,47.0 61.0,45.0 62.6,47.0 64.1,52.6 65.7,61.5 67.2,72.6 68.8,85.0 70.3,97.4 71.8,108.5 73.4,117.4 75.0,123.0 76.5,125.0 78.0,123.0 79.6,117.4 81.2,108.5 82.7,97.4 84.2,85.0 85.8,72.6 87.3,61.5 88.9,52.6 90.5,47.0 92.0,45.0 93.6,47.0 95.1,52.6 96.7,61.5 98.2,72.6 99.8,85.0 101.3,97.4 102.9,108.5 104.4,117.4 106.0,123.0 107.5,125.0 109.0,123.0 110.6,117.4 112.2,108.5 113.7,97.4 115.2,85.0 116.8,72.6 118.4,61.5 119.9,52.6 121.5,47.0 123.0,45.0 124.6,47.0 126.1,52.6 127.7,61.5 129.2,72.6 130.8,85.0 132.3,97.4 133.9,108.5 135.4,117.4 136.9,123.0 138.5,125.0 140.1,123.0 141.6,117.4 143.2,108.5 144.7,97.4 146.2,85.0 147.8,72.6 149.4,61.5 150.9,52.6 152.4,47.0 154.0,45.0 155.6,47.0 157.1,52.6 158.7,61.5 160.2,72.6 161.8,85.0 163.3,97.4 164.9,108.5 166.4,117.4 167.9,123.0 169.5,125.0 171.0,123.0 172.6,117.4 174.2,108.5 175.7,97.4 177.2,85.0 178.8,72.6 180.4,61.5 181.9,52.6 183.4,47.0 185.0,45.0 186.6,47.0 188.1,52.6 189.7,61.5 191.2,72.6 192.8,85.0 194.3,97.4 195.9,108.5 197.4,117.4 199.0,123.0 200.5,125.0 202.1,123.0 203.6,117.4 205.2,108.5 206.7,97.4 208.2,85.0 209.8,72.6 211.4,61.5 212.9,52.6 214.4,47.0 216.0,45.0 217.6,47.0 219.1,52.6 220.7,61.5 222.2,72.6 223.8,85.0 225.3,97.4 226.8,108.5 228.4,117.4 230.0,123.0 231.5,125.0 233.1,123.0 234.6,117.4 236.2,108.5 237.7,97.4 239.2,85.0 240.8,72.6 242.4,61.5 243.9,52.6 245.5,47.0 247.0,45.0 248.6,47.0 250.1,52.6 251.7,61.5 253.2,72.6 254.8,85.0 256.3,97.4 257.9,108.5 259.4,117.4 260.9,123.0 262.5,125.0 264.1,123.0 265.6,117.4 267.1,108.5 268.7,97.4 270.2,85.0 271.8,72.6 273.4,61.5 274.9,52.6 276.5,47.0 278.0,45.0 279.6,47.0 281.1,52.6 282.6,61.5 284.2,72.6 285.8,85.0 287.3,97.4 288.8,108.5 290.4,117.4 292.0,123.0 293.5,125.0 295.1,123.0 296.6,117.4 298.1,108.5 299.7,97.4 301.2,85.0 302.8,72.6 304.4,61.5 305.9,52.6 307.5,47.0 309.0,45.0 310.6,47.0 312.1,52.6 313.7,61.5 315.2,72.6 316.8,85.0 318.3,97.4 319.8,108.5 321.4,117.4 323.0,123.0 324.5,125.0 326.1,123.0 327.6,117.4 329.2,108.5 330.7,97.4 332.2,85.0 333.8,72.6 335.4,61.5 336.9,52.6 338.5,47.0 340.0,45.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4" points="30.0,45.0 64.1,52.6 98.2,72.6 132.3,97.4 166.4,117.4 200.5,125.0 234.6,117.4 268.7,97.4 302.8,72.6 336.9,52.6"/>
  <g fill="#b4232c">
    <circle cx="30.0" cy="45.0" r="4"/><circle cx="64.1" cy="52.6" r="4"/><circle cx="98.2" cy="72.6" r="4"/>
    <circle cx="132.3" cy="97.4" r="4"/><circle cx="166.4" cy="117.4" r="4"/><circle cx="200.5" cy="125.0" r="4"/>
    <circle cx="234.6" cy="117.4" r="4"/><circle cx="268.7" cy="97.4" r="4"/><circle cx="302.8" cy="72.6" r="4"/>
    <circle cx="336.9" cy="52.6" r="4"/>
  </g>
  <text x="30" y="24" font-size="11" fill="#1d6fd1">real fast wobble (10 cycles)</text>
  <text x="30" y="150" font-size="11" fill="#b4232c">samples every 1.1 cycles: a false slow wave</text>
</svg>
```
:::

::: context nav-filter Where the osculating state comes from
A navigation filter takes a stream of measurements — GPS fixes, radar ranges, star-tracker angles — and blends them with a model of the motion to produce the best guess of the spacecraft's state. The most famous kind is the Kalman filter, which a later module builds from scratch. Its output is a position and velocity at a given instant: an osculating state. Everything downstream, from pointing antennas to planning burns, starts from it.
:::

