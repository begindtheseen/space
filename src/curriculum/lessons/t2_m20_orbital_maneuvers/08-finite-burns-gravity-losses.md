---
id: l08-finite-burns-gravity-losses
title: Finite burns and gravity losses
minutes: 19
covers:
  - finite-burn and gravity losses
---

Ride a bike up a gentle hill while pedaling steadily. You push as hard as on the flat, yet the bike slows down. The push has not vanished. Some of it is going into lifting you up the hill instead of into speed.

A rocket burn that lasts minutes instead of an instant has the same problem. Lesson 1 treated every burn as a single kick at one point, and gave a rough test for when that is fair: compare the burn time with the orbital period. This lesson replaces the rough test with a real simulation. It takes the first burn of the LEO-to-GEO Hohmann transfer from lesson 2, flies it with a real engine at a stated thrust-to-weight, and measures exactly what the instant-burn picture gets wrong — in speed, in propellant, and in the orbit you actually end up on.

There is a neat surprise inside the physics. You might expect a long burn to "waste" energy fighting gravity. It does not, at least not directly: the energy of the orbit grows at exactly the rate the thrust supplies. What falls short is the *speed*. Seeing why both statements are true — and which one costs you propellant — is most of the lesson.

## A burn that takes time

Model a real engine. It pushes with a constant **thrust** $T$ (a force, in newtons) and burns propellant at a constant rate. The rate is set by the **specific impulse** $I_{sp}$, a measure of how efficiently the engine uses propellant:

$$
\dot m = -\frac{T}{I_{sp}\,g_0},
$$

where $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. The **thrust acceleration** is $a_T = T/m$. As the mass $m$ drops, $a_T$ grows.

We point the thrust along the velocity at every instant — forward along the direction of motion. That is the efficient choice, and this lesson uses it throughout. Write $\hat{\mathbf{v}}$ (read "v-hat") for the unit vector along the velocity.

Two more quantities describe where the vehicle is heading:

- The **specific energy** $\varepsilon = v^2/2 - \mu/r$ ("epsilon") is the orbit's **[[energy per kilogram|specific-energy]]**: kinetic energy per kilogram plus gravitational potential energy per kilogram. It fixes the orbit's size through $\varepsilon = -\mu/(2a)$, where $a$ is the semi-major axis.
- The **[[flight-path angle|flight-path-angle]]** $\gamma$ ("gamma") is the angle between the velocity and the local horizontal. It is zero at periapsis and apoapsis, positive while the vehicle climbs.

## Energy grows at exactly the thrust's rate

Start with the energy. The vehicle's acceleration is gravity plus thrust:

$$
\mathbf{a} = -\frac{\mu\,\mathbf{r}}{r^3} + a_T\,\hat{\mathbf{v}}.
$$

Differentiate $\varepsilon = v^2/2 - \mu/r$ with respect to time. The first term gives $\mathbf{v}\cdot\mathbf{a}$. The second gives $+\mu\dot r/r^2$, where $\dot r$ is how fast the distance from Earth's center is changing:

$$
\dot\varepsilon = \mathbf{v}\cdot\mathbf{a} + \frac{\mu\,\dot r}{r^2}.
$$

Now put in $\mathbf{a}$. The gravity part of $\mathbf{v}\cdot\mathbf{a}$ is $-\mu(\mathbf{v}\cdot\hat{\mathbf{r}})/r^2$. Since $\mathbf{v}\cdot\hat{\mathbf{r}} = \dot r$ (the part of the velocity pointing straight out), that is $-\mu\dot r/r^2$. It cancels the second term exactly. The thrust part is $a_T\,\hat{\mathbf{v}}\cdot\mathbf{v} = a_T v$. What is left is

$$
\dot\varepsilon = a_T\,v .
$$

This holds at every point of the orbit. Thrust along the velocity turns all of its power into orbital energy. Gravity takes nothing from the energy, anywhere.

## Speed does not

Now look at speed alone. For any vector, $v\,\dot v = \mathbf{v}\cdot\mathbf{a}$ (the rate of change of a vector's length). Using $\mathbf{v}\cdot\hat{\mathbf{r}} = v\sin\gamma$, the gravity term becomes $-(\mu/r^2)\sin\gamma$, and the thrust term becomes $a_T$:

$$
\dot v = a_T - \frac{\mu}{r^2}\sin\gamma .
$$

At an apsis, $\gamma = 0$ and speed grows at the full $a_T$. Anywhere else, while the vehicle is climbing ($\gamma > 0$), part of gravity points backward along the path and slows the speed gain. That is the bike on the hill.

This is the same **gravity loss** you met for rocket ascent in the classical mechanics module, $\int g\sin\gamma\,dt$. The only changes: the fixed surface gravity $g$ becomes $\mu/r^2$, which weakens with height, and the angle is the orbital flight-path angle.

::: key Energy is exact, speed is not
For thrust aligned with the velocity vector, $\dot\varepsilon = a_T v$ exactly, at every point of the burn. But $\dot v = a_T - (\mu/r^2)\sin\gamma$, so speed — and therefore the delivered Δv — falls short of the "ideal" $\int a_T\,dt$ by $\int(\mu/r^2)\sin\gamma\,dt$ wherever the burn spends time away from an apsis. This is the finite-burn gravity loss.
:::

## How much of the lost speed is really lost?

Here is the catch in the speed bookkeeping. Speed that goes into height is not destroyed. When the bike reaches the top of the hill it is slower, but it can coast down the other side and get the speed back. A vehicle that ends its burn higher up and slower has *stored* some of its "lost" speed as height, and the orbit keeps it.

So what actually costs propellant? Look at $\dot\varepsilon = a_T v$ again. The energy gained per second is thrust times *current speed*. During a finite burn the vehicle climbs and slows compared with an instant kick, so each second of thrust is applied at a lower speed and buys less energy. That is the **[[Oberth effect|lost-oberth]]** from lesson 3, working against you: part of the burn happens away from the deepest, fastest point.

The energy the orbit ends up short, compared with an instant burn of the same ideal Δv, is the **true cost** of the finite burn. We can express it as the extra Δv an instant burn would need to make up that energy.

::: note Why the energy shortfall is the running speed loss, added up
Let $u(t) = \int_0^t a_T\,dt'$ be the ideal Δv spent so far, and $L(t) = \int_0^t (\mu/r^2)\sin\gamma\,dt'$ the speed lost so far. Then $v = v_1 + u - L$.

An instant burn gains energy at speed $v_1 + u$ all the way: $\Delta\varepsilon_{\text{instant}} = \int a_T (v_1 + u)\,dt$. The real burn gains $\int a_T v\,dt = \int a_T(v_1 + u - L)\,dt$. Subtract:

$$
\Delta\varepsilon_{\text{instant}} - \Delta\varepsilon_{\text{real}} = \int_0^{t_b} a_T\,L\,dt .
$$

So the energy is short only because thrust is applied while some speed has already been traded for height. The simulation below checks this identity to many digits.
:::

## The experiment

Take the LEO departure burn from lesson 2. The vehicle starts on a circular orbit at $r_1 = 6678\,\mathrm{km}$ with $v_1 = 7.7258\,\mathrm{km/s}$. The instant-burn plan is $\Delta v_1 = 2.4258\,\mathrm{km/s}$, onto a transfer ellipse reaching up to GEO at $42\,164\,\mathrm{km}$.

The engine has constant thrust and a constant $I_{sp} = 320\,\mathrm{s}$, typical of a **[[storable bipropellant|storable-bipropellant]]** engine. Every run spends the same propellant: enough to give an ideal $I_{sp}\,g_0\ln(m_0/m_f) = 2.4258\,\mathrm{km/s}$, which is $53.84\%$ of the starting mass. Runs differ only in how fast they spend it, set by the starting **thrust-to-weight ratio** $T/W_0 = a_{T,0}/g_0$.

The equations of motion — position, velocity and mass, with thrust always along $\hat{\mathbf{v}}$ — are stepped forward in time by an **[[adaptive high-order integrator|adaptive-integrator]]**. Each run was repeated at a much tighter error tolerance. The results agree to far better than the digits quoted, so what follows is physics, not rounding noise.

::: example A modest engine, $T/W_0 = 0.3$
**How long, how far round.** The burn lasts $574.3\,\mathrm{s}$ ($9.57\,\mathrm{min}$), which is $10.6\%$ of the $90.5\,\mathrm{min}$ orbital period. The vehicle [[sweeps|swept-arc]] $42.4^\circ$ of the orbit while burning — well beyond lesson 1's comfort zone of about $15^\circ$.

**Speed.** The vehicle ends $2.1688\,\mathrm{km/s}$ faster than it started, against the ideal $2.4258\,\mathrm{km/s}$. The gravity loss is $2.4258 - 2.1688 = 0.2570\,\mathrm{km/s} = 257.0\,\mathrm{m/s}$, or $10.6\%$ of the planned Δv.

**Where it ends up.** At engine cut-off the vehicle is at $6955\,\mathrm{km}$ — $277\,\mathrm{km}$ above where it started — and still climbing at $\gamma = 9.2^\circ$. Much of the "lost" speed is sitting there as height.

**The orbit.** The new orbit's periapsis is $6743\,\mathrm{km}$, $65\,\mathrm{km}$ above the planned $6678\,\mathrm{km}$. Its apoapsis is $40\,956\,\mathrm{km}$, short of GEO by $1208\,\mathrm{km}$ ($2.9\%$).

**True cost.** The energy shortfall equals $19.3\,\mathrm{m/s}$ of extra instant Δv — $0.79\%$ of the plan. That is the propellant really wasted. It is thirteen times smaller than the speed shortfall, because most of the lost speed was traded for height.

**Sanity check.** Energy $\varepsilon = -\mu/(2a)$ decides the apoapsis. A $0.8\%$ energy-equivalent shortfall in a burn that more than triples the orbit's semi-major axis should move the apoapsis by a few percent, and it does.
:::

::: example A stronger stage, $T/W_0 = 1.0$
**How long, how far round.** The burn lasts $172.3\,\mathrm{s}$ ($2.87\,\mathrm{min}$), $3.2\%$ of the period, sweeping $13.0^\circ$.

**Speed.** The vehicle gains $2.4012\,\mathrm{km/s}$. The gravity loss is $2.4258 - 2.4012 = 0.0246\,\mathrm{km/s} = 24.6\,\mathrm{m/s}$, which is $1.01\%$.

**The orbit.** Cut-off is at $6704\,\mathrm{km}$, $26\,\mathrm{km}$ up. The periapsis is within $6\,\mathrm{km}$ of the planned $6678\,\mathrm{km}$. The apoapsis is $42\,049\,\mathrm{km}$, short by $115\,\mathrm{km}$ ($0.27\%$).

**True cost.** Only $1.8\,\mathrm{m/s}$ ($0.07\%$).

A mission designer can treat this burn as instant with a clear conscience. Getting there took three times the thrust-to-weight of the first example.
:::

## The trend, and where to draw the line

The same experiment across a range of engines:

| $T/W_0$ | burn time | share of period | swept arc | gravity loss (speed) | true cost (energy) | apoapsis error |
| --- | --- | --- | --- | --- | --- | --- |
| 0.10 | 28.7 min | 31.7 % | $113.4^\circ$ | 64.5 % | 5.5 % | 17.7 % |
| 0.20 | 14.4 min | 15.9 % | $62.2^\circ$ | 22.1 % | 1.7 % | 6.0 % |
| 0.30 | 9.57 min | 10.6 % | $42.4^\circ$ | 10.6 % | 0.79 % | 2.9 % |
| 0.50 | 5.74 min | 6.3 % | $25.8^\circ$ | 4.0 % | 0.29 % | 1.1 % |
| 0.75 | 3.83 min | 4.2 % | $17.3^\circ$ | 1.8 % | 0.13 % | 0.48 % |
| 1.00 | 2.87 min | 3.2 % | $13.0^\circ$ | 1.01 % | 0.07 % | 0.27 % |
| 2.00 | 1.44 min | 1.6 % | $6.5^\circ$ | 0.25 % | 0.02 % | 0.07 % |
| 5.00 | 0.57 min | 0.63 % | $2.6^\circ$ | 0.04 % | 0.003 % | 0.01 % |

Every loss is a percentage of the planned $2.4258\,\mathrm{km/s}$. The apoapsis error is a percentage of $42\,164\,\mathrm{km}$.

Three things stand out.

**There is [[no cliff|loss-chart]].** Every column changes smoothly. So "the burn is too long to treat as instant" is a line you choose, not one nature hands you.

**The losses grow fast.** For the shorter burns ($T/W_0$ of $0.5$ and up), halving $T/W_0$ doubles the burn time but multiplies every loss by about four: the losses grow with roughly the *square* of the burn time. At the long end the growth slows a little, but by then the losses are already large.

**The orbit error matters as much as the propellant.** Even when the true propellant cost is under $1\%$, the vehicle can miss its planned apoapsis by more than a thousand kilometers. In flight, guidance fixes this by steering and burning a little longer, which costs about the true-cost column.

A reasonable line: once the gravity loss (speed) is under about $1\%$, it is no bigger than the other uncertainties in a real Δv budget — navigation errors, burn errors, not knowing the mass exactly — and calling the burn instant is defensible. Solving for that crossing gives $T/W_0 \approx 1.01$: a $171\,\mathrm{s}$ burn sweeping $12.9^\circ$, about $3.2\%$ of the $90.5\,\mathrm{min}$ period. A $2\%$ line moves the requirement down to $T/W_0 \approx 0.71$, an $18^\circ$ arc.

Either way, lesson 1's rule of thumb was about right, and now you have the numbers behind it.

::: key A practical threshold
For this burn, gravity loss reaches 1 % of the target Δv at about $T/W_0\approx1.0$ (burn $\approx3\,\%$ of the local orbital period, arc $\approx13^\circ$), and 2 % at about $T/W_0\approx0.7$ (arc $\approx18^\circ$). Below that, losses grow quickly; above it, they are a small, controllable correction.
:::

::: key Finite-burn loss
A real burn takes time, during which the vehicle moves and the thrust direction is not always optimal, so the realised Δv falls short of the impulsive calculation. The impulsive approximation degrades when the burn arc becomes a significant fraction of the orbit — roughly when the burn time exceeds a few percent of the period.
:::

Real spacecraft meet this every day. A geostationary satellite's own **[[apogee engine|apogee-engine]]** is far too weak to finish its big burn in one short firing, so operators split it up.

## Where the instant picture breaks down entirely

Push $T/W_0$ much lower — $0.05$, say — and the burn no longer loses a mere percentage. It lasts $3446\,\mathrm{s}$ ($0.96\,\mathrm{h}$), $63\%$ of the starting orbit's period, and sweeps $191^\circ$, more than halfway round. All that time the thrust follows the velocity, which keeps turning as the vehicle goes round.

The results look broken at first. The vehicle's final *speed* is $6.965\,\mathrm{km/s}$ — *lower* than the $7.726\,\mathrm{km/s}$ it started with. By the speed bookkeeping, it delivered a Δv of $-760\,\mathrm{m/s}$. Yet its semi-major axis grew from $6678$ to $17\,416\,\mathrm{km}$, and $\dot\varepsilon = a_T v$ held exactly the whole time.

Nothing is wrong with the physics or the integrator. The vehicle ended at $11\,165\,\mathrm{km}$ from Earth's center, far above where it started. A slower speed at a much larger radius can carry more energy than a faster speed low down. What has failed is the idea of quoting one before-and-after speed change for this burn at all. The true cost is still meaningful — $329\,\mathrm{m/s}$, or $13.5\%$ — but there is no single point, apsis or flight-path angle left to reason about. The orbit is changing underneath the vehicle as it burns. That regime needs a different tool, which the next lesson builds.

::: warning A percentage loss needs a stated reference
"$10.6\%$ gravity loss" in the first example means $10.6\%$ of the *instant Δv this burn was trying to deliver* — not of the mission's whole Δv budget, and not of the vehicle's total capability. And say which loss: the speed shortfall ($10.6\%$) and the true energy cost ($0.79\%$) of the same burn differ by more than ten times. Always state what the percentage is of, and what it measures.
:::

::: warning Convergence is not optional
Every number in this lesson was checked against a second run at a much tighter integrator tolerance before being written down. A single run at default settings, through a burn that changes the vehicle's speed by a third in a few minutes, is not something to trust without that check. An integrator can settle on a plausible-looking wrong answer as easily as a plainly wrong one.
:::

## Check yourself

::: check
Without the full derivation, explain why a velocity-aligned finite burn loses no energy to gravity but can still deliver less speed than the rocket equation promises.
:::

::: answer
**Energy.** Its rate of change is $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}+\mu\dot r/r^2$. Gravity's share of $\mathbf{v}\cdot\mathbf{a}$ is $-\mu\dot r/r^2$, and it cancels exactly against the $+\mu\dot r/r^2$ that comes from differentiating $-\mu/r$. That leaves $\dot\varepsilon=a_Tv$, wherever the vehicle is.

**Speed.** Its rate of change has no such cancellation: $\dot v = a_T-(\mu/r^2)\sin\gamma$. Differentiating $v$ alone brings in nothing to offset gravity's pull. Away from an apsis, part of gravity points along the path. While the vehicle climbs, that part works against the speed gain, even though it takes nothing from the energy gain — the speed it removes becomes height.
:::

::: check
In the $T/W_0=0.3$ example the burn started exactly at the planned $6678\,\mathrm{km}$ periapsis, yet the engine cut off at $6955\,\mathrm{km}$ and the new orbit's periapsis ended up at $6743\,\mathrm{km}$, $65\,\mathrm{km}$ high. Explain physically why.
:::

::: answer
At ignition the flight-path angle is zero. But as soon as thrust pushes the speed above the local circular speed, the orbit stops being circular and the vehicle starts to climb. Its flight-path angle turns positive, and its radius keeps growing for the rest of the burn.

The burn lasts over nine minutes and sweeps more than $40^\circ$. By cut-off the vehicle is $277\,\mathrm{km}$ higher and still climbing at about $9^\circ$. Energy was added all along that climbing arc, not at one low point. So the orbit that results has its lowest point above the starting radius, and its periapsis is no longer where the burn began.
:::

::: check
A different mission plans a burn with $T/W_0=2.0$. From the table, is the instant approximation good enough if the mission can tolerate at most $0.5\%$ apoapsis error, and by how much margin?
:::

::: answer
At $T/W_0=2.0$ the apoapsis error is about $0.07\%$ ($0.0686\%$ unrounded), well under the $0.5\%$ tolerance — about seven times better than required.

There is plenty of margin. The table shows $T/W_0=0.75$ still inside the tolerance at $0.48\%$, so a weaker engine could be used if it were better for other reasons.
:::

::: check
Why does the very-low-thrust case ($T/W_0=0.05$) deliver a *negative* net speed change, even though the orbit plainly grew (semi-major axis from $6678$ to over $17\,000\,\mathrm{km}$)?
:::

::: answer
The vehicle's energy rose the whole time, exactly as $\dot\varepsilon=a_Tv$ requires — that is what raised the semi-major axis.

But energy is $v^2/2-\mu/r$. Once the vehicle has climbed to a much larger $r$, the $-\mu/r$ term is much less negative. So a lower $v$ at a much larger $r$ can carry more energy than a higher $v$ at the original small $r$.

Over a burn lasting about an hour and sweeping more than half the orbit, the weak thrust spends long stretches climbing against gravity. The speed-loss integral $\int(\mu/r^2)\sin\gamma\,dt$ ends up bigger than the whole ideal gain $\int a_T\,dt$, so the net speed change goes negative while the energy keeps rising.
:::

::: check
A systems engineer proposes budgeting a flat $2\%$ margin on every instant Δv in a mission, whatever engine performs each burn. Using this lesson, when is that reasonable and when is it not?
:::

::: answer
**Reasonable** when every burn is flown at a similar, healthy thrust-to-weight. From the table, the true propellant cost stays under $2\%$ down to about $T/W_0 = 0.2$ ($1.7\%$), and the speed shortfall stays under $2\%$ above about $T/W_0 = 0.7$.

**Not reasonable** when the mission mixes very different burns. Loss is a steep, nonlinear function of thrust-to-weight. A burn at $T/W_0 = 0.1$ has a true cost of $5.5\%$, nearly three times the flat margin, and its apoapsis misses by $18\%$. Meanwhile a burn at $T/W_0 = 2$ needs almost none of the margin ($0.02\%$ true cost). One flat number either strands the weak burn or wastes margin on the strong one. Each burn's loss should be estimated from its own burn time and arc.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot m = -T/(I_{sp}g_0)$, $a_T = T/m$ | Mass flow and thrust acceleration of a real engine |
| $\varepsilon = v^2/2-\mu/r$ | Specific energy: sets the orbit's size |
| $\dot\varepsilon = a_T v$ | Energy grows at the full thrust power for velocity-aligned thrust — no direct gravity loss |
| $\dot v = a_T - (\mu/r^2)\sin\gamma$ | Speed grows more slowly than $a_T$ while climbing; the integral is the gravity loss |
| True cost $= \int a_T L\,dt$ | Energy shortfall: thrust applied after speed was traded for height (lost Oberth benefit) |
| $T/W_0=0.3$ example | 10.6 % speed loss, 0.79 % true cost, 2.9 % apoapsis error, $42^\circ$ arc |
| $T/W_0=1.0$ example | 1.01 % speed loss, 0.07 % true cost, 0.27 % apoapsis error, $13^\circ$ arc |
| 1 % loss threshold | $T/W_0\approx1.0$: burn $\approx3\,\%$ of the local period |
| 2 % loss threshold | $T/W_0\approx0.7$ |
| Breakdown regime | $T/W_0\lesssim0.05$: burn lasts about an hour or more, sweeps most of an orbit, net speed change can go negative |
| Practice | Check results against a tighter integrator tolerance before trusting a loss number |

The breakdown case at the end is not a curiosity. It is the everyday life of electric propulsion, and it is where the next lesson picks up: a way of thinking built for burns that last many orbits, where "instant Δv" is not even the right question.

::: context specific-energy Why orbit energy is negative
"Specific" means "per kilogram", so the same number works for a cubesat or a space station. The kinetic part, $v^2/2$, is always positive. The potential part, $-\mu/r$, is negative, because we choose zero to be "infinitely far from Earth" and every closer point sits below that.

A bound orbit has more negative potential than positive kinetic, so its total is negative. Raising an orbit means making $\varepsilon$ less negative. At $\varepsilon = 0$ the vehicle barely escapes.
:::

::: context flight-path-angle The angle that decides the loss
The flight-path angle measures how steeply the vehicle is climbing compared with the local horizontal. Gravity always points at Earth's center, so when the path tilts up by $\gamma$, a slice of gravity, $(\mu/r^2)\sin\gamma$, points backward along the path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="20.0" y1="105.0" x2="320.0" y2="105.0" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5,4"/>
<text x="330" y="121" font-size="11" text-anchor="end" fill="#6c7a93">local horizontal</text>
<line x1="150.0" y1="105.0" x2="279.9" y2="30.0" stroke="#1d6fd1" stroke-width="2.5"/><polygon points="279.9,30.0 274.1,38.0 270.1,31.0" fill="#1d6fd1"/>
<text x="271.9" y="22.0" font-size="12" text-anchor="end" fill="#1d6fd1">v (and thrust)</text>
<line x1="150.0" y1="105.0" x2="150.0" y2="175.0" stroke="#b4232c" stroke-width="2.5"/><polygon points="150.0,175.0 145.9,166.0 154.1,166.0" fill="#b4232c"/>
<text x="158.0" y="171.0" font-size="12" fill="#b4232c">gravity μ/r²</text>
<line x1="150.0" y1="105.0" x2="119.7" y2="122.5" stroke="#b4232c" stroke-width="2"/><polygon points="119.7,122.5 125.5,114.5 129.5,121.5" fill="#b4232c"/>
<text x="113.7" y="136.5" font-size="11" text-anchor="end" fill="#b4232c">(μ/r²) sin γ:</text>
<text x="113.7" y="150.5" font-size="11" text-anchor="end" fill="#b4232c">pulls back on speed</text>
<path d="M200.0,105 A50,50 0 0,0 193.3,80.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
<text x="206.0" y="100.0" font-size="12" fill="#1f2a44">γ</text>
<circle cx="150" cy="105" r="5" fill="#f2b880" stroke="#1f2a44"/>
<text x="150" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">toward Earth’s center</text>
</svg>```

At periapsis and apoapsis the path is level, $\gamma = 0$, and that backward slice vanishes. That is why short burns centered on an apsis lose almost nothing.
:::

::: context lost-oberth Burning where you are fastest
Lesson 3 showed that a speed change $\Delta v$ added at speed $v$ raises the energy by $v\,\Delta v + \Delta v^2/2$. The faster you are already going, the more energy each meter per second buys.

At periapsis a spacecraft is at its fastest. An instant burn gets the full benefit. A long burn spreads its thrust along an arc where the vehicle has climbed and slowed, so the later part of the burn buys less energy per unit of propellant. The finite-burn true cost is exactly that missing benefit.
:::

::: context storable-bipropellant Propellants that wait for years
"Bipropellant" means two liquids: a fuel and an oxidizer. "Storable" means both stay liquid at ordinary temperatures, so they can sit in a spacecraft's tanks for fifteen years without boiling away, unlike liquid oxygen or hydrogen.

The usual pair is a hydrazine-family fuel with nitrogen tetroxide. They ignite on contact, with no spark needed, which makes the engine simple and able to restart many times. The price is a lower specific impulse, around $300$–$325\,\mathrm{s}$, and the fact that both are highly toxic.
:::

::: context adaptive-integrator Letting the computer choose its steps
A numerical integrator moves a simulation forward in small time steps. "Adaptive" means it estimates its own error at every step. Where things change quickly it takes smaller steps; where they are calm it takes bigger ones. "High-order" means the error shrinks very fast as the step gets smaller.

The runs here used an eighth-order method from the Dormand–Prince family. The numerical methods module shows how such methods work and why checking at a tighter tolerance is the honest test.
:::

::: context swept-arc How much of the orbit a burn covers
Both burns start at the bottom of the circle and move counterclockwise. The red arc is the stretch of orbit the vehicle covers while the engine runs, drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<circle cx="95" cy="105" r="62" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<circle cx="95" cy="105" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
<path d="M95,105 L95.0,167.0 A62,62 0 0,0 136.8,150.8 Z" fill="#f2b880" fill-opacity="0.6" stroke="none"/>
<path d="M95.0,167.0 A62,62 0 0,0 136.8,150.8" fill="none" stroke="#b4232c" stroke-width="5"/>
<text x="95" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">T/W₀ = 0.3</text>
<text x="95" y="194" font-size="11" text-anchor="middle" fill="#b4232c">burn: 42° of arc</text>
<circle cx="265" cy="105" r="62" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<circle cx="265" cy="105" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
<path d="M265,105 L265.0,167.0 A62,62 0 0,0 278.9,165.4 Z" fill="#f2b880" fill-opacity="0.6" stroke="none"/>
<path d="M265.0,167.0 A62,62 0 0,0 278.9,165.4" fill="none" stroke="#b4232c" stroke-width="5"/>
<text x="265" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">T/W₀ = 1.0</text>
<text x="265" y="194" font-size="11" text-anchor="middle" fill="#b4232c">burn: 13° of arc</text>
</svg>```

The weaker engine smears its push over $42^\circ$ — nearly an eighth of the orbit. The stronger one stays within $13^\circ$, close enough to one point that the instant picture works well.
:::

::: context loss-chart Two measures, one trend
The same simulations (all but the $T/W_0 = 5$ row), with the two loss measures on a scale where each gridline is ten times the one below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="60" y1="160.0" x2="320" y2="160.0" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
<text x="55" y="164.0" font-size="11" text-anchor="end" fill="#1f2a44">0.01%</text>
<line x1="60" y1="125.0" x2="320" y2="125.0" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
<text x="55" y="129.0" font-size="11" text-anchor="end" fill="#1f2a44">0.1%</text>
<line x1="60" y1="90.0" x2="320" y2="90.0" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
<text x="55" y="94.0" font-size="11" text-anchor="end" fill="#1f2a44">1%</text>
<line x1="60" y1="55.0" x2="320" y2="55.0" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
<text x="55" y="59.0" font-size="11" text-anchor="end" fill="#1f2a44">10%</text>
<line x1="60" y1="20.0" x2="320" y2="20.0" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
<text x="55" y="24.0" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
<line x1="60" y1="160" x2="320" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="60.0" y1="160" x2="60.0" y2="165" stroke="#1f2a44"/><text x="60.0" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
<line x1="125.0" y1="160" x2="125.0" y2="165" stroke="#1f2a44"/><text x="125.0" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text>
<line x1="190.0" y1="160" x2="190.0" y2="165" stroke="#1f2a44"/><text x="190.0" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
<line x1="255.0" y1="160" x2="255.0" y2="165" stroke="#1f2a44"/><text x="255.0" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1.5</text>
<line x1="320.0" y1="160" x2="320.0" y2="165" stroke="#1f2a44"/><text x="320.0" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
<text x="190" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">thrust-to-weight T/W₀</text>
<polyline fill="none" stroke="#b4232c" stroke-width="2" points="73.0,26.7 86.0,43.0 99.0,54.1 125.0,69.0 157.5,81.1 190.0,89.8 320.0,110.8"/>
<polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="73.0,64.0 86.0,81.9 99.0,93.5 125.0,108.6 157.5,120.8 190.0,129.5 320.0,150.6"/>
<circle cx="73.0" cy="26.7" r="3" fill="#b4232c"/>
<circle cx="86.0" cy="43.0" r="3" fill="#b4232c"/>
<circle cx="99.0" cy="54.1" r="3" fill="#b4232c"/>
<circle cx="125.0" cy="69.0" r="3" fill="#b4232c"/>
<circle cx="157.5" cy="81.1" r="3" fill="#b4232c"/>
<circle cx="190.0" cy="89.8" r="3" fill="#b4232c"/>
<circle cx="320.0" cy="110.8" r="3" fill="#b4232c"/>
<circle cx="73.0" cy="64.0" r="3" fill="#1d6fd1"/>
<circle cx="86.0" cy="81.9" r="3" fill="#1d6fd1"/>
<circle cx="99.0" cy="93.5" r="3" fill="#1d6fd1"/>
<circle cx="125.0" cy="108.6" r="3" fill="#1d6fd1"/>
<circle cx="157.5" cy="120.8" r="3" fill="#1d6fd1"/>
<circle cx="190.0" cy="129.5" r="3" fill="#1d6fd1"/>
<circle cx="320.0" cy="150.6" r="3" fill="#1d6fd1"/>
<text x="160" y="52.2" font-size="11" fill="#b4232c">speed shortfall</text>
<text x="150" y="148.0" font-size="11" fill="#1d6fd1">true cost (energy)</text>
</svg>```

Both curves fall steadily as thrust-to-weight rises, with no sudden drop. The true propellant cost (blue) is always about twelve to fourteen times smaller than the speed shortfall (red), because most of the lost speed turns into height the orbit keeps.
:::

::: context apogee-engine Why GEO satellites burn in pieces
A typical geostationary satellite reaches a transfer orbit and then uses its own engine to finish the job. That engine often pushes with only about $400$–$500\,\mathrm{N}$. On a $3000\,\mathrm{kg}$ satellite, $440\,\mathrm{N}$ is a thrust-to-weight of about $0.015$.

To add the roughly $1.5\,\mathrm{km/s}$ needed at apoapsis, it must fire for over two hours in total. Done in one go, that burn would smear across a long arc and lose heavily. So operators split it into several firings, each centered on a pass through apoapsis, raising the orbit step by step over a few days.
:::
