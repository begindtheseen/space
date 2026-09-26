---
id: l07-atmospheric-drag
title: Atmospheric drag, ballistic coefficient, and density uncertainty
minutes: 26
covers:
  - "atmospheric drag, ballistic coefficient and density model uncertainty"
---

Stick your hand out of a moving car's window. The air shoves it backward, and the faster the car goes, the harder it shoves. That shove is **drag**: the push air gives anything moving through it, always against the motion.

At $400\,\mathrm{km}$ the gas is between thirty billion and a trillion times thinner than at sea level. But a satellite there moves at nearly $8\,\mathrm{km/s}$, for months on end, and a tiny shove applied every second adds up.

The last lesson showed that $J_2$ wobbles a low orbit's shape every lap but, averaged over a lap, leaves its size and roundness alone. Drag is the opposite kind of nudge. It never averages away. It takes energy out of the orbit on every lap, and that is why most low orbits are not permanent. An uncontrolled satellite at $400\,\mathrm{km}$ falls back within a few years at most, and the International Space Station has to be pushed back up every so often. Sizing propellant to hold an orbit, or predicting when a dead satellite will come down, is a drag calculation.

This lesson builds the drag acceleration, derives how fast a circular orbit shrinks, explains why drag makes a satellite speed *up* and an oval orbit rounder, and ends on the most honest point in the module: nobody knows the air density up there very well.

## The drag force

Back to the hand out of the window. Three things decide how hard the air pushes:

- how thick the air is — its **density** $\rho$ ("rho"), the mass of air in each cubic meter;
- how fast you move through it — and the push grows with the *square* of that speed;
- how big a face you show the wind — the **cross-sectional area** $A$ facing the flow.

Put together, the push per square meter of face is the **dynamic pressure**, $\tfrac12\rho v^2$. Multiply by the area and by a shape factor called the **drag coefficient** $C_D$, and you have the drag force: $F = \tfrac12\rho v^2 C_D A$.

For a satellite, $C_D$ is about $2.2$, the standard starting value. It is higher than for a car because up there the molecules strike the spacecraft one at a time and bounce off, a regime called **[[free-molecular flow|free-molecular]]**.

### From force to acceleration: the ballistic coefficient

A propagator needs acceleration, not force, so divide by the mass $m$:

$$
a_D = \frac{F}{m} = \frac{1}{2}\rho v^2\,\frac{C_D A}{m} .
$$

The spacecraft's own properties appear only in the combination $C_D A/m$. Flip it over and it gets a name, the **ballistic coefficient**:

$$
B = \frac{m}{C_D A} ,
$$

read "B equals m over C D A". Its units are $\mathrm{kg/m^2}$: [[mass per unit of effective frontal area|km-units]].

Think of a bowling ball and a beach ball of the same size, dropped from a balcony. The beach ball drifts; the bowling ball plows straight down. Same area, very different mass: the bowling ball has the large $B$. Likewise a dense, compact satellite (large $B$) shrugs off drag, while a light one with big solar panels (small $B$) feels it strongly. **[[The name|ballistic-word]]** comes from artillery.

In terms of $B$, the size of the drag acceleration is

$$
a_D = \frac{1}{2}\frac{\rho v^2}{B} .
$$

Check the units: $\mathrm{kg/m^3}$ times $\mathrm{m^2/s^2}$ gives $\mathrm{kg/(m\,s^2)}$; dividing by $\mathrm{kg/m^2}$ leaves $\mathrm{m/s^2}$, an acceleration.

### Which velocity? The air turns with Earth

Earth's atmosphere is not standing still. It turns with the planet, once a day, like the air inside a spinning room. So the speed that matters is the satellite's speed *through the air*, the **relative velocity**:

$$
\mathbf{v}_{\text{rel}} = \mathbf{v} - \boldsymbol\omega_E\times\mathbf{r} .
$$

Read it as "v rel equals v minus omega E cross r". Here $\mathbf{v}$ is the inertial velocity, $\mathbf{r}$ the position from Earth's center, and $\boldsymbol\omega_E$ is Earth's spin vector, pointing along the north pole axis with size $\omega_E = 7.292\,115\times10^{-5}\,\mathrm{rad/s}$ (one turn per sidereal day). The cross product $\boldsymbol\omega_E\times\mathbf{r}$ is the velocity of the air at the satellite's position: it points east, with speed $\omega_E$ times the distance from Earth's spin axis.

At the equator's surface that air speed is $\omega_E R_E \approx 465\,\mathrm{m/s}$. At $400\,\mathrm{km}$ over the equator it is about $494\,\mathrm{m/s}$. That is small next to an orbital speed of $7.7\,\mathrm{km/s}$, but not tiny: it is about $6\%$, and it is **[[in the same direction|corotation-picture]]** as an eastbound satellite, so it takes that much off the speed through the air.

Drag always points exactly against $\mathbf{v}_{\text{rel}}$. Write $\hat{\mathbf{v}}_{\text{rel}} = \mathbf{v}_{\text{rel}}/v_{\text{rel}}$ for the unit vector along it (the hat means "length one, direction only"). Then the full drag acceleration, as a vector, is

$$
\mathbf{a}_D = -\frac{1}{2}\rho\,\frac{v_{\text{rel}}^2}{B}\,\hat{\mathbf{v}}_{\text{rel}} = -\frac{1}{2}\frac{\rho\,v_{\text{rel}}}{B}\,\mathbf{v}_{\text{rel}} .
$$

The two forms agree because $v_{\text{rel}}^2\,\hat{\mathbf{v}}_{\text{rel}} = v_{\text{rel}}\,\mathbf{v}_{\text{rel}}$. The second is the one to code, since it needs no division.

::: key Drag acceleration and ballistic coefficient
$$
\mathbf{a}_D = -\frac{1}{2}\rho\left(\frac{v_{\text{rel}}^2}{B}\right)\hat{\mathbf{v}}_{\text{rel}}, \qquad B = \frac{m}{C_D A}\ \ (\mathrm{kg/m^2}), \qquad \mathbf{v}_{\text{rel}} = \mathbf{v} - \boldsymbol\omega_E\times\mathbf{r} .
$$
$\mathbf{v}_{\text{rel}}$ must be measured against the co-rotating atmosphere. Large $B$ (dense, compact) feels drag weakly; small $B$ (light, large area) feels it strongly. $C_D \approx 2.2$ is the usual starting value.
:::

::: example Drag on a small satellite at 400 km
A $150\,\mathrm{kg}$ satellite shows $1.2\,\mathrm{m^2}$ to the flow, with $C_D = 2.2$. It flies a circular orbit at $400\,\mathrm{km}$.

**Ballistic coefficient.** $B = \dfrac{150}{2.2 \times 1.2} = \dfrac{150}{2.64} \approx 56.8\,\mathrm{kg/m^2}$.

**Speed.** The circular speed is $v = \sqrt{\mu/r}$ with $r = 6378 + 400 = 6778\,\mathrm{km}$, which gives $v \approx 7669\,\mathrm{m/s}$. (We ignore the air's rotation here to keep the numbers clean; it would trim the drag by up to about $13\%$.) So $v^2 \approx 5.881\times10^{7}\,\mathrm{m^2/s^2}$.

**Acceleration, active Sun** ($\rho = 4\times10^{-11}\,\mathrm{kg/m^3}$):
$$
a_D = \frac{1}{2}\cdot\frac{(4\times10^{-11})(5.881\times10^{7})}{56.8} \approx 2.07\times10^{-5}\,\mathrm{m/s^2} .
$$

**Acceleration, quiet Sun** ($\rho = 1\times10^{-12}\,\mathrm{kg/m^3}$, forty times thinner): forty times smaller, $5.17\times10^{-7}\,\mathrm{m/s^2}$.

**What that means per day.** Multiply by the $86\,400$ seconds in a day. The active-Sun drag takes away about $1.79\,\mathrm{m/s}$ of velocity change (a $\Delta v$, "delta v") every day; the quiet-Sun drag about $0.045\,\mathrm{m/s}$. A satellite that wants to hold its altitude has to put that back with its thrusters.

**Sanity check.** The force is $a_D m \approx 0.0031\,\mathrm{N}$, the weight of a third of a gram. Tiny, as it should be; it matters only because it never stops.
:::

## Why drag never averages away

$J_2$'s pushes change direction as the satellite goes around. Over one lap, the forward pushes and the backward pushes cancel. That is why $J_2$ leaves $a$ and $e$ with no steady drift.

Drag cannot. Walking over hills, what you lose climbing you get back coming down. Walking through mud, every step costs you and nothing gives it back. Drag is mud: $\mathbf{a}_D$ always points against the motion through the air, so there is nothing to cancel against.

A force like that, which only ever removes energy, is called **dissipative**. That one property is what lets drag cause real, one-way, **secular** change — a steady drift that builds up lap after lap — where $J_2$ alone cannot.

## How fast a circular orbit shrinks

We want $da/dt$, how fast the semi-major axis $a$ shrinks. The cleanest route is through energy, the same route used in the Gauss variational equations lesson.

The orbit's **specific energy** (energy per kilogram) is $\varepsilon = -\mu/(2a)$, and a perturbing acceleration changes it at the rate

$$
\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}_p ,
$$

force times velocity, the "power" of any physics class. Ignore the air's rotation for now, so $\mathbf{v}_{\text{rel}} = \mathbf{v}$.

**Step 1: the power drag takes out.** Drag points straight against $\mathbf{v}$ with size $\tfrac12\rho v^2/B$. The dot product of two opposite vectors is minus the product of their lengths:
$$
\dot\varepsilon = -v\cdot\frac{1}{2}\frac{\rho v^2}{B} = -\frac{1}{2}\frac{\rho v^3}{B} .
$$

**Step 2: the same energy change, written through $a$.** Differentiate $\varepsilon = -\mu/(2a)$ with respect to time:
$$
\dot\varepsilon = \frac{\mu}{2a^2}\,\dot a .
$$

**Step 3: set them equal**, and use the circular speed $v = na$ (mean motion $n$ times radius):
$$
\frac{\mu\dot a}{2a^2} = -\frac{1}{2}\frac{\rho(na)^3}{B} .
$$

**Step 4: tidy up.** Multiply both sides by $2a^2/\mu$, then use $\mu = n^2a^3$ (Kepler's third law) to swap out $\mu$:
$$
\dot a = -\frac{\rho\,n^3a^5}{B\,\mu} = -\frac{\rho\,n^3a^5}{B\,n^2a^3} ,
$$
which leaves

$$
\frac{da}{dt} = -\frac{\rho\,n\,a^2}{B} .
$$

Read it as a sentence: the orbit shrinks faster where the air is thicker ($\rho$), where the satellite goes around faster ($n$), and for a lighter, draggier vehicle (small $B$).

A direct numerical integration of the drag-only equation of motion (no $J_2$, no Earth rotation, to match the derivation) over $20$ orbits at $400\,\mathrm{km}$, with $B = 100\,\mathrm{kg/m^2}$ and a fixed density, agrees with this formula to $0.009\%$.

::: example How fast does a 400 km orbit sink?
Take $B = 100\,\mathrm{kg/m^2}$, active-Sun density $\rho = 4\times10^{-11}\,\mathrm{kg/m^3}$, and $a = 6778\,\mathrm{km} = 6.778\times10^{6}\,\mathrm{m}$.

**Mean motion.** $n = \sqrt{\mu/a^3} = \sqrt{3.986\times10^{14}/(6.778\times10^{6})^3} \approx 1.131\times10^{-3}\,\mathrm{rad/s}$. One orbit takes $2\pi/n \approx 5554\,\mathrm{s}$, about $92.6$ minutes.

**Decay rate.**
$$
\frac{da}{dt} = -\frac{(4\times10^{-11})(1.131\times10^{-3})(6.778\times10^{6})^2}{100} \approx -2.08\times10^{-2}\,\mathrm{m/s} .
$$

**Per day.** Times $86\,400\,\mathrm{s}$: about $-1.80\,\mathrm{km}$ per day. **Per orbit**: times $5554\,\mathrm{s}$, about $-115\,\mathrm{m}$.

**Quiet Sun.** Forty times less dense, so forty times slower: about $-45\,\mathrm{m}$ per day.

**Sanity check.** Nearly two kilometers a day would bring the orbit down within weeks; forty times slower, within years. That matches the picture that low orbits live weeks to years depending on the Sun.
:::

::: warning Earth's rotation is not a rounding error
Repeat the $0.009\%$ check with the air's rotation included, at $i = 51.6^\circ$. The measured decay rate drops to about $92\%$ of the formula's value — an $8\%$ correction. At other inclinations the same integration gives: about $87.5\%$ for an equatorial orbit, $100\%$ for a polar one, and $108.5\%$ for a retrograde orbit at $130^\circ$.

The pattern follows the approximate factor $1 - 2(\omega_E/n)\cos i$. For an eastbound (prograde) orbit the air moves the same way as the satellite, so the satellite goes through it more slowly and drag is weaker. For a polar orbit the air moves sideways to the track and the first-order effect vanishes. For a retrograde orbit the satellite flies *into* the air's motion, and drag grows. Leave out $\boldsymbol\omega_E\times\mathbf{r}$ and a prograde lifetime comes out up to about twelve percent too short (and a retrograde one too long).
:::

::: note Why the factor is 1 − 2(ω_E/n) cos i
For a circular orbit, the air's velocity $\boldsymbol\omega_E\times\mathbf{r}$ has an along-track part of size $\omega_E r\cos i$ at every point of the orbit. (Dot it with the unit velocity: $(\boldsymbol\omega_E\times\mathbf{r})\cdot\hat{\mathbf{v}} = \boldsymbol\omega_E\cdot(\mathbf{r}\times\hat{\mathbf{v}}) = \omega_E r\cos i$, because $\mathbf{r}\times\hat{\mathbf{v}}$ has length $r$ and points along the orbit normal, which makes angle $i$ with the spin axis.) Its other part is sideways, and only changes $v_{\text{rel}}$ to second order.

So $v_{\text{rel}} \approx v - \omega_E r\cos i = v(1 - k)$ with $k = (\omega_E/n)\cos i$, since $v = nr$. The power drag removes is $\mathbf{v}\cdot\mathbf{a}_D$, which carries one factor of $v_{\text{rel}}$ from the size of $\mathbf{a}_D$ and another from $\mathbf{v}\cdot\mathbf{v}_{\text{rel}} \approx v^2(1-k)$. Two factors of $(1-k)$ give $(1-k)^2 \approx 1 - 2k$ when $k$ is small. At $400\,\mathrm{km}$, $\omega_E/n \approx 0.0645$, so the factor is $1 - 0.129\cos i$: $0.920$ at $51.6^\circ$, $0.871$ at the equator. The integration's $0.922$ and $0.875$ match to within half a percent.
:::

## The drag paradox: losing energy, gaining speed

Drag pushes backward on a satellite, and the satellite ends up going *faster*.

For a circular orbit, $v = \sqrt{\mu/a}$. Drag lowers $a$, and because $a$ sits in the bottom of that fraction, a smaller $a$ means a larger $v$. So as the orbit sinks, the satellite speeds up. It then sits in thicker air, feels more drag, sinks faster, and speeds up more. This runaway ends in re-entry, not in a new balance. This is the **drag paradox**.

It does not break energy conservation. Split the energy into its two parts. For a circular orbit the kinetic energy per kilogram is $\tfrac12 v^2 = \mu/(2a)$ and the potential energy is $-\mu/a$. Their sum is $\varepsilon = -\mu/(2a)$. Now lower the orbit. The kinetic part goes up by some amount. The potential part goes down by *twice* that amount. The total still goes down, which is what drag demands.

A ball rolling down a bumpy hill does the same: friction takes energy out, yet the ball speeds up, because the hill hands it more. For a satellite, "downhill" is toward Earth.

With numbers: dropping a circular orbit from $400\,\mathrm{km}$ to $300\,\mathrm{km}$ raises the speed from $7669$ to $7726\,\mathrm{m/s}$ and shortens the period from $92.6$ to $90.5$ minutes. The kinetic energy rises by $0.44\,\mathrm{MJ/kg}$ and the potential energy falls by $0.88\,\mathrm{MJ/kg}$, a net loss of $0.44\,\mathrm{MJ/kg}$ — exactly what drag removed.

So a decaying satellite's period keeps *shrinking* right up to re-entry. It only truly slows down in the last steep plunge through the thick lower atmosphere.

## Drag makes an oval orbit rounder

Air density falls off exponentially with height. Each **[[scale height|scale-height]]** $H$ you climb — tens of kilometers up here — the density drops by a factor of $e \approx 2.72$. So in an oval orbit, the drag near the low point, the perigee, is enormously larger than near the high point, the apogee. Almost all the drag of the whole orbit happens in a short arc around **[[perigee|drag-around-orbit]]**.

A backward push at perigee is a small **retro-burn** (a burn pointing against the motion) at perigee. The maneuvers module showed what that does: it lowers the *opposite* side of the orbit, the apogee, and leaves perigee nearly where it was. Drag does this a little on every pass. The apogee comes down, the perigee barely moves, and the orbit becomes rounder.

::: example Drag rounds out an eccentric orbit
Start with an orbit of $300\,\mathrm{km}$ by $900\,\mathrm{km}$ altitude. That is $a_0 = 6978.137\,\mathrm{km}$ and $e_0 = 0.04299$. Take $i = 51.6^\circ$, $B = 100\,\mathrm{kg/m^2}$, and a density of $4\times10^{-11}\,\mathrm{kg/m^3}$ at $400\,\mathrm{km}$ with an $80\,\mathrm{km}$ scale height.

**How lopsided is the drag?** Perigee and apogee are $600\,\mathrm{km}$ apart in height, which is $600/80 = 7.5$ scale heights. So the air at perigee is $e^{7.5} \approx 1808$ times denser than at apogee.

**Integrate.** Propagating the full equations of motion (two-body plus drag with Earth rotation, no $J_2$) for $300$ orbits gives the following. The answer does not change when the integrator's tolerance is tightened a hundredfold.

| | Start | After $300$ orbits | Change |
| --- | --- | --- | --- |
| Eccentricity | $0.04299$ | $0.03964$ | down |
| Perigee altitude | $300.0\,\mathrm{km}$ | $296.0\,\mathrm{km}$ | $-4.0\,\mathrm{km}$ |
| Apogee altitude | $900.0\,\mathrm{km}$ | $847.0\,\mathrm{km}$ | $-53.0\,\mathrm{km}$ |

**Read the result.** Apogee lost $53.0/4.0 \approx 13$ times as much height as perigee, and eccentricity fell steadily: the orbit is getting rounder, as predicted.

**Sanity check.** Perigee did drop a little, since the drag is spread over an arc, not a single point. But the lopsided drop is the signature of a push concentrated near perigee.
:::

::: key The drag paradox and circularization
Drag removes energy, lowering the semi-major axis, and $v = \sqrt{\mu/a}$ rises as $a$ falls: the satellite ends up faster in a lower orbit — the **drag paradox**. Drag also circularizes, because it bites hardest at perigee: apogee comes down while perigee barely moves.
$$
\frac{da}{dt}\Big|_{\text{circular}} = -\frac{\rho\,n\,a^2}{B} .
$$
:::

## The number nobody knows well: air density

Every formula above has $\rho$ in it, and $\rho$ is the least certain number in this module.

The top layer of the atmosphere, the **thermosphere**, is heated by ultraviolet light from the Sun. When the Sun is active, the gas warms and swells upward, and a satellite at a fixed height finds itself in thicker air. The Sun's activity rises and falls over a roughly **eleven-year solar cycle**. On top of that, bursts from the Sun trigger **geomagnetic storms** that can double the density at a given height within hours. Time of day and season matter too. Real **[[density models|density-models]]** take a dozen or more inputs and are still routinely off by tens of percent.

For rough design work, an exponential fit with two settings brackets the solar cycle honestly:

$$
\rho(h) = \rho_{400}\,\exp\!\left[-\frac{h - 400\,\mathrm{km}}{H}\right] .
$$

- **quiet Sun:** $\rho_{400} = 1\times10^{-12}\,\mathrm{kg/m^3}$, $H = 50\,\mathrm{km}$;
- **active Sun:** $\rho_{400} = 4\times10^{-11}\,\mathrm{kg/m^3}$, $H = 80\,\mathrm{km}$.

At $400\,\mathrm{km}$ the two differ by a factor of $40$. Because the active-Sun curve also falls off more slowly (a bigger $H$), the gap *widens* with height: about $180$ at $600\,\mathrm{km}$ and about $800$ at $800\,\mathrm{km}$.

::: example Lifetime from 400 km, and what dominates the uncertainty
Integrate $da/dt = -\rho(a)\,n\,a^2/B$ from $400\,\mathrm{km}$ down to $120\,\mathrm{km}$, where re-entry is effectively certain, using each density curve. The orbit shrinks slowly enough that treating it as circular all the way down is fair.

| $B\ (\mathrm{kg/m^2})$ | Lifetime, active Sun | Lifetime, quiet Sun | Ratio |
| --- | --- | --- | --- |
| $50$ | $21.7$ days | $556.6$ days | $25.6\times$ |
| $100$ | $43.4$ days | $1113.3$ days | $25.6\times$ |
| $200$ | $86.8$ days | $2226.6$ days | $25.6\times$ |

**Read down a column.** Lifetime is exactly proportional to $B$: doubling $B$ doubles the lifetime. That follows from $B$ sitting alone in the denominator of $da/dt$.

**Read across a row.** The density assumption alone swings the answer by a factor of about $25$, however well $B$ is known.

**What it means.** Knowing $B$ to $10\%$ does not make a re-entry date good to the day; the air, not the spacecraft, is the big unknown. That is why [[real re-entry forecasts|skylab-reentry]] carry wide windows until the last few days, when the actual density can be worked out from how fast the satellite is actually sinking.

**Sanity check.** Why is the ratio $25.6$ and not $40$, when the starting densities differ by $40$? Most of the lifetime is spent sinking the first scale height or so, where the air is thinnest. A rough estimate is therefore "time to sink one scale height at the starting rate", $T \approx H B/(\rho_{400}\,n a^2)$. For $B = 100$ that gives $44.5$ days (active) and $1113$ days (quiet), close to the table. The ratio is $40 \times \tfrac{50}{80} = 25$: the quiet Sun's air is forty times thinner, but its shorter scale height makes the fall steepen sooner.
:::

$B$ is not perfectly known either. A spacecraft that **[[tumbles|tumbling]]** shows the air a different face from moment to moment, so its average area, and therefore its $B$, is uncertain. A stable one pointing a known face forward is better pinned down. But these are percent-to-tens-of-percent effects. Density is the leading term.

::: key What dominates lifetime uncertainty
Thermospheric density, which varies by a factor of several over the solar cycle and responds to geomagnetic storms within hours. Ballistic-coefficient uncertainty and attitude (tumbling vs stable) matter too, but density is the leading term — which is why re-entry predictions are quoted with wide windows until the final orbits.
:::

::: warning A precise-looking lifetime is not a precise lifetime
It is easy to carry four significant figures through and quote "$1113.3$ days". The same satellite could last $43$ days or $1113$ depending on the Sun. Quote a lifetime as a range tied to an assumption about solar activity.
:::

## Check yourself

::: check
Two spacecraft share the same orbit and drag coefficient $C_D$. One has twice the mass of the other but the same cross-sectional area. Which one decays faster, and by roughly what factor?
:::

::: answer
The lighter one decays faster. Its ballistic coefficient $B = m/(C_DA)$ is half that of the heavier one, because only $m$ differs.

The decay rate is $da/dt = -\rho n a^2/B$, so it goes as $1/B$. Half the $B$ means twice the decay rate: the lighter spacecraft loses height about twice as fast, all else equal.
:::

::: check
A satellite with no thrusters is observed to speed up over several months. Is this evidence against drag, or exactly what drag predicts?
:::

::: answer
It is exactly what drag predicts: the drag paradox.

Drag removes energy, which lowers $a$, and $v = \sqrt{\mu/a}$ then rises. The potential energy falls by twice what the kinetic energy gains, so the total still drops. Speeding up while sinking, with no maneuvers, is the signature of drag.
:::

::: check
Explain why drag makes an eccentric orbit rounder, rather than more eccentric or unchanged. Use the way density depends on altitude.
:::

::: answer
Density falls off exponentially with altitude, so in an eccentric orbit almost all the drag happens in the short arc near perigee. In the example, the air at apogee was about $1800$ times thinner than at perigee.

A backward push concentrated at perigee acts like a retro-burn at perigee. Such a burn lowers the *opposite* side of the orbit, the apogee, while leaving perigee nearly unchanged. So apogee drops much faster than perigee, and the orbit becomes rounder over time.
:::

::: check
Why does leaving the atmosphere's rotation out of $\mathbf{v}_{\text{rel}}$ matter more for a low-inclination orbit than for a polar one?
:::

::: answer
The correction goes as $\cos i$. Near the equator, a prograde satellite and the eastward-moving air travel nearly the same way, so the speed through the air drops noticeably — about a $12\%$ change in the decay rate at $400\,\mathrm{km}$.

For a polar orbit ($i = 90^\circ$, $\cos i = 0$), the orbit plane contains the spin axis. The air's velocity $\boldsymbol\omega_E\times\mathbf{r}$ is then perpendicular to the orbit plane at every point, so it has no along-track part at all. It only changes the speed through the air to second order, and the first-order correction vanishes.
:::

::: check
A mission must guarantee re-entry within 90 days of end of life using drag alone, starting at $400\,\mathrm{km}$. Based on the lifetime table, is specifying a small ballistic coefficient enough to guarantee this, whatever the Sun is doing?
:::

::: answer
No. Even $B = 50\,\mathrm{kg/m^2}$ gives anywhere from about $22$ days (active Sun) to about $557$ days, over $18$ months (quiet Sun). That factor of about $25$ comes from density, which nobody can control or reliably predict years ahead.

A real guarantee needs a lower starting altitude, a deorbit burn, a drag device that lowers $B$ a great deal, or acceptance that the guarantee depends on where the solar cycle is at end of life.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_D = -\tfrac12\rho\,(v_{\text{rel}}^2/B)\,\hat{\mathbf{v}}_{\text{rel}}$ | Drag acceleration, always against motion through the air |
| $B = m/(C_DA)$ | Ballistic coefficient, $\mathrm{kg/m^2}$; large $B$ feels drag weakly |
| $C_D \approx 2.2$ | Usual drag coefficient in free-molecular flow |
| $\mathbf{v}_{\text{rel}} = \mathbf{v}-\boldsymbol\omega_E\times\mathbf{r}$ | Velocity through the co-rotating air; about an $8\%$ effect at $51.6^\circ$, $12\%$ at the equator |
| $da/dt = -\rho n a^2/B$ | Decay rate of a circular orbit; checked to $0.009\%$ against integration |
| Dissipative | Drag only removes energy, so it causes secular decay, unlike $J_2$ |
| Drag paradox | $a$ falls, so $v = \sqrt{\mu/a}$ rises; the satellite speeds up as it sinks |
| Circularization | Drag is concentrated at perigee, so apogee drops much faster than perigee |
| Density bracket | Solar-cycle spread $\times40$ at $400\,\mathrm{km}$, $\times180$ at $600\,\mathrm{km}$, $\times800$ at $800\,\mathrm{km}$ |
| Lifetime | Proportional to $B$; density uncertainty (about $\times25$ from $400\,\mathrm{km}$) dominates |

The next lesson leaves the air behind for nudges that reach every altitude with no cutoff at all: the gravity of the Moon and the Sun, the tides they raise in Earth itself, and the small corrections from relativity.

::: context free-molecular When air stops acting like a fluid
Near the ground, air molecules bump into each other billions of times a second, so air flows around a car as one smooth fluid. At $400\,\mathrm{km}$ the molecules are so sparse that one travels kilometers before meeting another — far more than the size of any spacecraft.

So each molecule flies straight in, hits the surface, and bounces off on its own, never meeting the others. That is **free-molecular flow**. Molecules that bounce back add a second kick on top of the one from stopping, which is part of why $C_D$ comes out near $2.2$ rather than the $0.3$ or so of a car.
:::

::: context km-units A units trap for the lifetime exercise
Many orbit programs work in kilometers and kilometers per second. Drag then needs every quantity converted to match:

- a density of $4\times10^{-11}\,\mathrm{kg/m^3}$ becomes $4\times10^{-2}\,\mathrm{kg/km^3}$, since a cubic kilometer holds $10^{9}$ cubic meters;
- a ballistic coefficient of $100\,\mathrm{kg/m^2}$ becomes $10^{8}\,\mathrm{kg/km^2}$, since a square kilometer holds $10^{6}$ square meters.

Forget one of them and the drag comes out wrong by a factor of a million or a billion, and your satellite either never decays or falls out of the sky in one orbit. That is the best clue: an absurd lifetime is almost always a units slip.
:::

::: context ballistic-word Which way up?
"Ballistic" comes from the old study of shells and bullets flying through air. There, a projectile with a big ballistic coefficient keeps its speed well and flies true.

A warning for when you read other sources: not everyone defines it the same way up. This course uses $B = m/(C_DA)$, so a big $B$ means *little* drag. Some books and programs use the flip, $C_DA/m$, where a big number means *lots* of drag. The two-line element sets of a later lesson use yet another drag term, called B-star. Always check the units: $\mathrm{kg/m^2}$ is this course's version, $\mathrm{m^2/kg}$ the flipped one.
:::

::: context corotation-picture The air's share of the speed
Seen from space, a satellite heading east over the equator at $400\,\mathrm{km}$ moves at $7.67\,\mathrm{km/s}$. The air there is also moving east, at $0.49\,\mathrm{km/s}$, carried around by Earth's spin. The satellite only has to push through the difference.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="262" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="270,40 260,35 260,45" fill="#1d6fd1"/>
  <text x="40" y="28" font-size="12" fill="#1f2a44">satellite, inertial: 7.67 km/s</text>
  <line x1="40" y1="90" x2="47" y2="90" stroke="#6c7a93" stroke-width="3"/>
  <polygon points="55,90 45,85 45,95" fill="#6c7a93"/>
  <text x="40" y="78" font-size="12" fill="#1f2a44">air, turning with Earth: 0.49 km/s</text>
  <line x1="40" y1="140" x2="247" y2="140" stroke="#b4232c" stroke-width="3"/>
  <polygon points="255,140 245,135 245,145" fill="#b4232c"/>
  <text x="40" y="128" font-size="12" fill="#1f2a44">through the air: 7.17 km/s</text>
  <text x="340" y="162" font-size="11" fill="#6c7a93" text-anchor="end">arrows to scale; east is to the right</text>
</svg>
```

Drag goes as the square of that speed, so $(7.17/7.67)^2 \approx 0.87$: about $13\%$ less drag than the inertial speed suggests.
:::

::: context scale-height What a scale height is
A **scale height** is the climb over which the air thins by a factor of $e \approx 2.72$. Near the ground it is about $8.5\,\mathrm{km}$. In the hot, thin thermosphere it is much larger — tens of kilometers — because hot gas spreads upward further, and it grows when the Sun heats the gas more.

On a plot with density on a logarithmic scale, an exponential is a straight line. The two brackets used in this lesson are two straight lines with different slopes, which is why the gap between them widens with height.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="60" y1="20" x2="60" y2="170" stroke="#1f2a44" stroke-width="1.5"/><line x1="60" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="56" y1="41.4" x2="60" y2="41.4" stroke="#1f2a44"/><text x="52" y="45.4" font-size="11" fill="#1f2a44" text-anchor="end">10⁻¹⁰</text>
<line x1="56" y1="84.3" x2="60" y2="84.3" stroke="#1f2a44"/><text x="52" y="88.3" font-size="11" fill="#1f2a44" text-anchor="end">10⁻¹²</text>
<line x1="56" y1="127.1" x2="60" y2="127.1" stroke="#1f2a44"/><text x="52" y="131.1" font-size="11" fill="#1f2a44" text-anchor="end">10⁻¹⁴</text>
<line x1="56" y1="170.0" x2="60" y2="170.0" stroke="#1f2a44"/><text x="52" y="174.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻¹⁶</text>
<line x1="60.0" y1="170" x2="60.0" y2="174" stroke="#1f2a44"/><text x="60.0" y="187" font-size="11" fill="#1f2a44" text-anchor="middle">200</text>
<line x1="150.0" y1="170" x2="150.0" y2="174" stroke="#1f2a44"/><text x="150.0" y="187" font-size="11" fill="#1f2a44" text-anchor="middle">400</text>
<line x1="240.0" y1="170" x2="240.0" y2="174" stroke="#1f2a44"/><text x="240.0" y="187" font-size="11" fill="#1f2a44" text-anchor="middle">600</text>
<line x1="330.0" y1="170" x2="330.0" y2="174" stroke="#1f2a44"/><text x="330.0" y="187" font-size="11" fill="#1f2a44" text-anchor="middle">800</text>
<text x="195" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">altitude (km)</text>
<text x="14" y="95" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 14 95)">density (kg/m³)</text>
<line x1="60.0" y1="26.7" x2="330.0" y2="96.5" stroke="#b4232c" stroke-width="2.5"/>
<line x1="60.0" y1="47.1" x2="330.0" y2="158.7" stroke="#1d6fd1" stroke-width="2.5"/>
<line x1="150.0" y1="50.0" x2="150.0" y2="84.3" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/><text x="155.0" y="71.1" font-size="12" fill="#1f2a44">×40</text>
<line x1="330.0" y1="96.5" x2="330.0" y2="158.7" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/><text x="324" y="131.6" font-size="12" fill="#1f2a44" text-anchor="end">×800</text>
<text x="222.0" y="60.6" font-size="12" fill="#b4232c">active Sun</text>
<text x="200" y="128" font-size="12" fill="#1d6fd1">quiet Sun</text>
</svg>
```

A single sea-level scale height, the kind used in a quick starter model, badly underestimates density at $400\,\mathrm{km}$. Real work uses a table of scale heights, one per altitude band.
:::

::: context drag-around-orbit Where on the orbit the drag happens
This curve shows the drag on the $300 \times 900\,\mathrm{km}$ orbit of the example, all the way around, as a fraction of its value at perigee. It uses the lesson's active-Sun density with its $80\,\mathrm{km}$ scale height.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="30" x2="40" y2="160" stroke="#1f2a44" stroke-width="1.5"/><line x1="40" y1="160" x2="330" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
<text x="35" y="164.0" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
<text x="35" y="99.0" font-size="11" fill="#1f2a44" text-anchor="end">0.5</text>
<text x="35" y="34.0" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
<line x1="40.0" y1="160" x2="40.0" y2="164" stroke="#1f2a44"/><text x="40.0" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">apogee</text>
<line x1="185.0" y1="160" x2="185.0" y2="164" stroke="#1f2a44"/><text x="185.0" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">perigee</text>
<line x1="330.0" y1="160" x2="330.0" y2="164" stroke="#1f2a44"/><text x="330.0" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">apogee</text>
<polyline points="40.0,159.9 41.6,159.9 43.2,159.9 44.8,159.9 46.4,159.9 48.1,159.9 49.7,159.9 51.3,159.9 52.9,159.9 54.5,159.9 56.1,159.9 57.7,159.9 59.3,159.9 60.9,159.9 62.6,159.9 64.2,159.9 65.8,159.9 67.4,159.9 69.0,159.9 70.6,159.9 72.2,159.8 73.8,159.8 75.4,159.8 77.1,159.8 78.7,159.8 80.3,159.7 81.9,159.7 83.5,159.7 85.1,159.6 86.7,159.6 88.3,159.5 89.9,159.5 91.6,159.4 93.2,159.3 94.8,159.2 96.4,159.1 98.0,159.0 99.6,158.9 101.2,158.7 102.8,158.5 104.4,158.3 106.1,158.1 107.7,157.8 109.3,157.5 110.9,157.1 112.5,156.7 114.1,156.2 115.7,155.7 117.3,155.1 118.9,154.4 120.6,153.6 122.2,152.7 123.8,151.7 125.4,150.6 127.0,149.4 128.6,148.0 130.2,146.4 131.8,144.7 133.4,142.8 135.1,140.7 136.7,138.4 138.3,135.9 139.9,133.2 141.5,130.3 143.1,127.1 144.7,123.7 146.3,120.1 147.9,116.2 149.6,112.1 151.2,107.9 152.8,103.4 154.4,98.8 156.0,94.0 157.6,89.1 159.2,84.1 160.8,79.1 162.4,74.1 164.1,69.1 165.7,64.2 167.3,59.5 168.9,54.9 170.5,50.6 172.1,46.6 173.7,42.9 175.3,39.6 176.9,36.8 178.6,34.4 180.2,32.5 181.8,31.1 183.4,30.3 185.0,30.0 186.6,30.3 188.2,31.1 189.8,32.5 191.4,34.4 193.1,36.8 194.7,39.6 196.3,42.9 197.9,46.6 199.5,50.6 201.1,54.9 202.7,59.5 204.3,64.2 205.9,69.1 207.6,74.1 209.2,79.1 210.8,84.1 212.4,89.1 214.0,94.0 215.6,98.8 217.2,103.4 218.8,107.9 220.4,112.1 222.1,116.2 223.7,120.1 225.3,123.7 226.9,127.1 228.5,130.3 230.1,133.2 231.7,135.9 233.3,138.4 234.9,140.7 236.6,142.8 238.2,144.7 239.8,146.4 241.4,148.0 243.0,149.4 244.6,150.6 246.2,151.7 247.8,152.7 249.4,153.6 251.1,154.4 252.7,155.1 254.3,155.7 255.9,156.2 257.5,156.7 259.1,157.1 260.7,157.5 262.3,157.8 263.9,158.1 265.6,158.3 267.2,158.5 268.8,158.7 270.4,158.9 272.0,159.0 273.6,159.1 275.2,159.2 276.8,159.3 278.4,159.4 280.1,159.5 281.7,159.5 283.3,159.6 284.9,159.6 286.5,159.7 288.1,159.7 289.7,159.7 291.3,159.8 292.9,159.8 294.6,159.8 296.2,159.8 297.8,159.8 299.4,159.9 301.0,159.9 302.6,159.9 304.2,159.9 305.8,159.9 307.4,159.9 309.1,159.9 310.7,159.9 312.3,159.9 313.9,159.9 315.5,159.9 317.1,159.9 318.7,159.9 320.3,159.9 321.9,159.9 323.6,159.9 325.2,159.9 326.8,159.9 328.4,159.9 330.0,159.9" fill="none" stroke="#b4232c" stroke-width="2.5"/>
<text x="185" y="194" font-size="11" fill="#1f2a44" text-anchor="middle">position around the orbit (true anomaly)</text>
<text x="190" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">drag, as a fraction of its perigee value</text>
</svg>
```

The drag is above half its peak only within $36^\circ$ either side of perigee. A quarter of the way around it is down to $2.5\%$, and at apogee to $0.05\%$. For all practical purposes, drag is a brief backward shove delivered once per orbit at perigee.
:::

::: context density-models The models behind the density
Operational software does not use a single exponential. It uses empirical models fitted to decades of satellite drag and instrument data. Two widely used ones are **NRLMSISE-00**, from the US Naval Research Laboratory, and **JB2008** (Jacchia–Bowman 2008).

Their main inputs are an index of the Sun's ultraviolet output (the **F10.7** radio flux, measured daily from the ground at a wavelength of $10.7\,\mathrm{cm}$) and an index of geomagnetic activity (**Ap** or **Kp**). The catch is that a lifetime prediction needs those inputs *in the future*, and nobody can forecast the Sun's weather years ahead. That, more than any flaw in the models, is where the uncertainty comes from.
:::

::: context skylab-reentry Skylab came down early
NASA's Skylab space station, launched in 1973, was expected to stay up until the early 1980s. The plan was for an early Space Shuttle flight to boost it higher.

But the solar cycle that peaked around 1979 turned out stronger than forecast. The heated thermosphere swelled, drag rose, and Skylab sank faster than predicted. The Shuttle was not ready in time, and Skylab re-entered in July 1979, scattering debris over the Indian Ocean and Western Australia. It is a classic case of density, not the spacecraft, deciding a lifetime.
:::

::: context tumbling Tumbling spacecraft
A dead satellite usually loses its attitude control and slowly **tumbles**, turning end over end. The area it shows the air then changes every few seconds or minutes, and what matters for drag is the average.

For a box-shaped satellite that average can be quite different from the area of the face it used to hold forward. So the same spacecraft can have a well-known $B$ while it is working and a much fuzzier one after it dies — exactly when a re-entry prediction is needed.
:::
