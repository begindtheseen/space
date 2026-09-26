---
id: l04-j2-secular-effects
title: J2 secular effects — nodal regression and apsidal rotation
minutes: 25
covers:
  - "J2 secular effects: nodal regression and apsidal rotation"
---

Spin a top on a table and watch its tilted axis. It does not fall over. Instead, the axis slowly swings around in a circle. Gravity is trying to tip the top, and because the top is spinning, that tipping turns into a slow, steady turning.

An orbit around Earth does something very similar. Earth is not a perfect ball — it bulges at the equator, and the last two lessons described that bulge with one number, $J_2$ ("J two"). The extra mass in the bulge keeps tugging a tilted orbit toward the equator. The orbit is "spinning" (the satellite goes around and around), so instead of flattening onto the equator, the whole orbit plane slowly [[swings around Earth's axis|top-precession]], like the top.

This lesson works out two slow drifts that $J_2$ causes, orbit after orbit, and that never average away:

- the **node** — where the orbit crosses the equator going north — slides around the equator;
- the **perigee** — the orbit's closest point to Earth — slides around inside the orbit.

These are not tiny corrections. The International Space Station's orbit plane swings around by about $5^\circ$ every day. Sun-synchronous imaging satellites, like the Landsat and Sentinel-2 satellites, are designed *around* the node's drift. Molniya communication satellites are designed around making the perigee drift exactly zero. For these missions, the "perturbation" is the mission requirement.

We will derive both drift rates from the Gauss variational equations of the last lesson, then do the thing that makes a formula trustworthy: run a full simulation, measure the drift directly, and put the two numbers side by side.

## Two slow drifts: secular versus periodic

Recall the two angles we are tracking. The **[[right ascension of the ascending node|node-picture]]** $\Omega$ (capital omega) is the angle around the equator, measured from a fixed direction among the stars, to the point where the orbit crosses the equator heading north. The **argument of perigee** $\omega$ (little omega) is the angle inside the orbit plane from that crossing point to the perigee.

Under $J_2$, both angles change in two different ways at once:

- A **periodic** change goes up and down within each orbit and comes back. Think of the tide: up, down, up, down, with no long-term trend.
- A **[[secular|word-secular]]** change keeps going in the same direction, orbit after orbit, like sea level slowly rising under the tides.

A mission cares most about the secular part, because it piles up. A drift of $5^\circ$ per day is a full circle in a couple of months. So our job is to find the secular rates of $\Omega$ and $\omega$: the steady part left after the up-and-down wiggle is averaged away.

We write a rate with a dot on top. $\dot\Omega$, read "omega-dot" (capital), is how fast the node angle changes, in radians per second. $\dot\omega$ is the same for the perigee angle.

## The J2 push in the orbit's own directions

The last lesson resolved any small push $\mathbf{a}_p$ into three directions attached to the spacecraft:

- **radial**, $R$: straight away from Earth's center;
- **transverse**, $T$: sideways within the orbit plane, roughly along the direction of travel;
- **normal**, $N$: straight out of the orbit plane, along $\hat{\mathbf{W}}$.

Only $N$ can turn the orbit plane. Only $R$ and $T$ can reshape the orbit within its plane.

To resolve the $J_2$ acceleration of lesson 2 into these directions, we need to know how far north or south the spacecraft is, because the bulge pulls differently at different latitudes. A spacecraft at **argument of latitude** $u = \omega + \nu$ (the angle from the node to the spacecraft, measured in the orbit plane, where $\nu$ is the true anomaly) on an orbit tilted at inclination $i$ sits at latitude $\phi$ with

$$
\sin\phi = \sin i\,\sin u .
$$

Putting that into the Cartesian $J_2$ formula and projecting onto the three directions gives

$$
R = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\big(1-3\sin^2i\sin^2u\big), \qquad
T = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin^2i\sin2u, \qquad
N = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u .
$$

Here $\mu$ is Earth's gravitational parameter, $R_E = 6378.137\,\mathrm{km}$ is Earth's equatorial radius, and $r$ is the spacecraft's distance from Earth's center. These three formulas were checked against the Cartesian formula by computing the dot products $\mathbf{a}_{J_2}\cdot\hat{\mathbf{R}}$, $\mathbf{a}_{J_2}\cdot\hat{\mathbf{T}}$, $\mathbf{a}_{J_2}\cdot\hat{\mathbf{W}}$ at several random states. They agree to the last digit a computer can hold.

Look at $N$. It carries $\sin u$, so it points one way when the spacecraft is north of the equator ($\sin u > 0$) and the other way when it is south. In both halves it pulls the spacecraft toward the equatorial bulge. That steady pull toward the equator is the tug on the top.

## Averaging the node's rate over one orbit

### The instantaneous rate

The Gauss equation for the node, from the last lesson, is $d\Omega/dt = r\sin u\,N/(h\sin i)$, where $h$ is the specific angular momentum. Put in $N$:

$$
\frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}\left(-\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u\right) = -3\frac{J_2\mu R_E^2\cos i}{h\,r^3}\sin^2u .
$$

The simplification used the double-angle identity $\sin 2i = 2\sin i\cos i$, so $\sin2i/\sin i = 2\cos i$, and $\tfrac32 \times 2 = 3$.

Read what this says. The rate is never positive for a prograde orbit (where $\cos i > 0$): $\sin^2 u$ is never negative. So the node is always sliding the same way — backward, or westward. But the size of the push changes around the orbit: it is zero at the node ($u = 0$), biggest at the most northern and southern points ($u = 90^\circ$ and $270^\circ$), and stronger near perigee where $r$ is small.

### The average over one lap

We want the average rate over one full orbit. Written $\langle d\Omega/dt\rangle$ and read "the average of $d\Omega/dt$", it is the total change in one orbit divided by the orbit's period $T$:

$$
\left\langle\frac{d\Omega}{dt}\right\rangle = \frac{1}{T}\int_0^T \frac{d\Omega}{dt}\,dt .
$$

Integrating over time is awkward, because the spacecraft moves at different speeds around an ellipse. It is much easier to integrate over the true anomaly $\nu$. The switch uses [[Kepler's second law|equal-areas]] in the form $h\,dt = r^2\,d\nu$, so $dt = (r^2/h)\,d\nu$:

$$
\left\langle\frac{d\Omega}{dt}\right\rangle = \frac{1}{T}\int_0^{2\pi}\frac{d\Omega}{dt}\,\frac{r^2}{h}\,d\nu = -\frac{3J_2\mu R_E^2\cos i}{Th^2}\int_0^{2\pi}\frac{\sin^2u}{r}\,d\nu .
$$

Now use the orbit equation, $r = p/(1+e\cos\nu)$, where $p$ is the semi-latus rectum and $e$ the eccentricity. Then $1/r = (1+e\cos\nu)/p$, and the integral becomes

$$
\int_0^{2\pi}\frac{\sin^2u}{r}\,d\nu = \frac{1}{p}\int_0^{2\pi}\sin^2(\omega+\nu)\,(1+e\cos\nu)\,d\nu .
$$

### Which pieces survive

Rewrite the square with the identity $\sin^2x = \tfrac12\big(1-\cos 2x\big)$:

$$
\sin^2(\omega+\nu)\,(1+e\cos\nu) = \tfrac12 + \tfrac12 e\cos\nu - \tfrac12\cos(2\omega+2\nu) - \tfrac12 e\cos\nu\cos(2\omega+2\nu) .
$$

Now integrate each of the four pieces from $0$ to $2\pi$.

- The constant $\tfrac12$ gives $\tfrac12 \times 2\pi = \pi$.
- $\tfrac12 e\cos\nu$ is a cosine wave. Over a full lap, its hills and valleys have equal area, so it integrates to **[[zero|waves-cancel]]**.
- $\tfrac12\cos(2\omega+2\nu)$ is also a whole number of waves over the lap, so it also gives zero.
- The last piece is a product of two cosines. The product-to-sum identity turns it into $\cos(2\omega+3\nu)$ and $\cos(2\omega+\nu)$ terms, both whole waves, so it gives zero too.

Only $\pi$ survives. It contains no $\omega$ and no $e$. So the integral is $\pi/p$, and

$$
\left\langle\frac{d\Omega}{dt}\right\rangle = -\frac{3J_2\mu R_E^2\cos i}{Th^2}\cdot\frac{\pi}{p} = -\frac{3}{2}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2} .
$$

The last step tidies the constants. It uses $T = 2\pi/n$, where $n = \sqrt{\mu/a^3}$ is the **mean motion** (the average angular speed around the orbit), and $h^2 = \mu p$ with $p = a(1-e^2)$. This is the **secular nodal regression rate**. "Regression" means moving backward: for a prograde orbit the node slides west.

::: note Why the constants collapse the way they do
Start from $-\dfrac{3J_2\mu R_E^2\cos i\,\pi}{T h^2 p}$. Put in $T = 2\pi/n$: the $\pi$ cancels and a factor $n/2$ appears, giving $-\dfrac{3nJ_2\mu R_E^2\cos i}{2h^2p}$. Put in $h^2 = \mu p$: the $\mu$ cancels, giving $-\dfrac{3nJ_2R_E^2\cos i}{2p^2}$. Finally $p^2 = a^2(1-e^2)^2$, so $R_E^2/p^2 = (R_E/a)^2/(1-e^2)^2$. That is the result above.
:::

### What the sign says

Every factor in front of $\cos i$ is positive. So the sign of $\dot\Omega$ is the opposite of the sign of $\cos i$:

- **Prograde** orbits ($i < 90^\circ$, $\cos i > 0$) have $\dot\Omega < 0$. The node **regresses** — it moves west.
- **Retrograde** orbits ($i > 90^\circ$, $\cos i < 0$) have $\dot\Omega > 0$. The node **advances** — it moves east.
- **Polar** orbits ($i = 90^\circ$, $\cos i = 0$) have $\dot\Omega = 0$. The node stays put.

The polar case makes sense in the top picture. A polar orbit's plane contains Earth's axis. The bulge is symmetric about that plane, so it has nothing to twist.

## The perigee's rate: apsidal rotation

The **line of apsides** is the line through perigee and apogee. Its slow turning within the orbit plane is called **apsidal rotation**, and it is measured by $\dot\omega$.

The same averaging, applied to the Gauss equation

$$
\frac{d\omega}{dt} = \frac{1}{eh}\Big[-p\cos\nu\,R + (p+r)\sin\nu\,T\Big] - \cos i\,\frac{d\Omega}{dt},
$$

needs longer integrals, but they fall apart in exactly the same way: every term that is a whole number of waves over the lap vanishes, and a handful of constant terms survive. The result is

$$
\left\langle\frac{d\omega}{dt}\right\rangle = \frac{3}{4}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{5\cos^2i-1}{(1-e^2)^2} .
$$

::: note Why it has to be true: two pieces that add up
The rate $\dot\omega$ has two sources, and they can be checked separately. Write $f = nJ_2(R_E/a)^2/(1-e^2)^2$ for the shared factor.

The in-plane push ($R$ and $T$ terms) turns the ellipse inside its own plane. Averaged over a lap it gives $\tfrac34 f\,(2-3\sin^2i)$.

The second term, $-\cos i\,\dot\Omega$, is bookkeeping. $\omega$ is measured from the node, and the node itself is moving, so $\omega$ changes even if perigee does not. It gives $-\cos i \times \left(-\tfrac32 f\cos i\right) = \tfrac32 f\cos^2 i$.

Add them, using $\sin^2 i = 1-\cos^2 i$:

$$
\tfrac34 f\,(2-3+3\cos^2i) + \tfrac32 f\cos^2i = \tfrac34 f\,(3\cos^2 i - 1 + 2\cos^2 i) = \tfrac34 f\,(5\cos^2i-1).
$$

Both pieces, and the total, were also checked by averaging the Gauss equations numerically over one orbit with a fine grid of $200\,000$ points. They agree to about thirteen significant figures.
:::

### Same prefactor, different angle factor

Put the two rates side by side. Both carry the same prefactor, $n J_2 (R_E/a)^2/(1-e^2)^2$, because both come from the same acceleration averaged the same way. What differs is the part that depends on inclination:

- the node has $\cos i$ — a straight-line function of $\cos i$, zero only at $90^\circ$;
- the perigee has $5\cos^2 i - 1$ — a function of $\cos^2 i$, zero at a special tilt near $63.4^\circ$.

That difference is why the two design uses below — sun-synchronous orbits and frozen perigees — are genuinely different problems, not the same one twice.

::: key J2 secular rates
$$
\dot\Omega = -\frac{3}{2}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2}, \qquad
\dot\omega = \frac{3}{4}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{5\cos^2i-1}{(1-e^2)^2}, \qquad n=\sqrt{\mu/a^3}.
$$
Prograde orbits ($i<90^\circ$) regress ($\dot\Omega<0$); retrograde orbits advance; polar orbits do neither. $\dot\omega$ vanishes at $\cos^2i=1/5$, i.e. $i=63.435^\circ$ or $116.565^\circ$ — the critical inclination used by Molniya and Tundra orbits to freeze the apogee over one hemisphere.
:::

## Putting numbers in

Here is a concrete orbit we will use for the rest of this lesson and the next two: a $550\,\mathrm{km}$-high orbit with $a = 6928.137\,\mathrm{km}$, $e = 0.05$ and $i = 51.6^\circ$ (the same tilt as the Space Station). We take $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$ and $J_2 = 1.082\,626\,68\times10^{-3}$.

::: example The two drift rates for a 550 km orbit
**Step 1: mean motion.** $n = \sqrt{\mu/a^3} = \sqrt{398\,600.4418/6928.137^3} = 1.0948\times10^{-3}\,\mathrm{rad/s}$. (Sanity check: the period $2\pi/n$ is $95.6$ minutes, about right for a low orbit.)

**Step 2: the size factor.** $(R_E/a)^2 = (6378.137/6928.137)^2 = 0.84753$. It is a bit less than $1$, because the orbit is a bit farther out than the equator.

**Step 3: the shape factor.** $(1-e^2)^2 = (1-0.0025)^2 = 0.99501$. Almost $1$, because the orbit is almost circular.

**Step 4: the shared prefactor.** Multiply $n$ by $J_2$ and the size factor, and divide by the shape factor:
$$
f = \frac{1.0948\times10^{-3}\times1.0826\times10^{-3}\times0.84753}{0.99501} = 1.0096\times10^{-6}\,\mathrm{rad/s}.
$$

**Step 5: the node.** $\cos 51.6^\circ = 0.62115$, so
$$
\dot\Omega = -1.5\times1.0096\times10^{-6}\times0.62115 = -9.4067\times10^{-7}\,\mathrm{rad/s}.
$$

**Step 6: the perigee.** $5\cos^2 i - 1 = 5\times0.38583 - 1 = 0.92912$, so
$$
\dot\omega = 0.75\times1.0096\times10^{-6}\times0.92912 = 7.0354\times10^{-7}\,\mathrm{rad/s}.
$$

**Step 7: convert to degrees per day.** Multiply by $86\,400$ seconds per day and by $180/\pi$ degrees per radian, a factor of $4.9504\times10^6$:
$$
\dot\Omega = -4.6567^\circ/\mathrm{day}, \qquad \dot\omega = +3.4828^\circ/\mathrm{day}.
$$

**Does it make sense?** The node slides west (negative) because the orbit is prograde. At this rate it goes all the way around in $360/4.6567 \approx 77$ days. That matches the "about $5^\circ$ a day" known for the Space Station.
:::

Here is the same calculation as a short Python function, which you will want again in the next lesson:

```python
import numpy as np

MU, RE, J2 = 398600.4418, 6378.137, 1.08262668e-3   # km^3/s^2, km, -

def j2_rates(a, e, i_deg):
    """Secular J2 rates of the node and perigee, in degrees per day."""
    i = np.radians(i_deg)
    n = np.sqrt(MU / a**3)
    f = n * J2 * (RE / a)**2 / (1 - e**2)**2
    to_deg_per_day = 86400 * 180 / np.pi
    node = -1.5 * f * np.cos(i) * to_deg_per_day
    perigee = 0.75 * f * (5 * np.cos(i)**2 - 1) * to_deg_per_day
    return float(node), float(perigee)

print(j2_rates(6928.137, 0.05, 51.6))   # (-4.6566589..., 3.4827525...)
```

## Checking the formulas against a simulation

A formula derived on paper is a claim. The way to test it is to simulate the real motion — with no averaging and no shortcuts — and measure the drift.

::: example Measuring the drift in a full simulation
Start the $550\,\mathrm{km}$ orbit at perigee and integrate the full equation of motion,
$$
\ddot{\mathbf{r}} = -\frac{\mu\,\mathbf{r}}{r^3} + \mathbf{a}_{J_2}(\mathbf{r}),
$$
using the exact Cartesian $J_2$ acceleration of lesson 2. Run it for $200$ orbits, about $13.3$ days. Twenty times per orbit, convert the position and velocity into orbital elements. Then plot $\Omega$ and $\omega$ against time and fit a straight line to each. The slopes are the measured rates:
$$
\dot\Omega_{\text{measured}} = -4.6778^\circ/\mathrm{day}, \qquad \dot\omega_{\text{measured}} = +3.5043^\circ/\mathrm{day} .
$$

Compare with the formula's $-4.6567$ and $+3.4828$. The agreement is good but not perfect: the measured node rate is $0.45\%$ larger, and the perigee rate about $0.6\%$ larger.

**Is the gap real, or a flaw in the simulation?** Change everything about the numerics and see whether it moves. Tighten the integrator's error tolerance from $10^{-8}$ to $10^{-12}$. Sample twice as often, and half as often. Run $150$ orbits, then $400$. Swap the integrator for a different one (a fifth-order Runge–Kutta method in place of an eighth-order one). The node rate changes only in its fifth or sixth significant figure, and the perigee rate by less than $0.1\%$. The gap stays. It is real, and it has nothing to do with step size.
:::

So where does the gap come from? From what we fed the formula.

The formula was built by averaging over an orbit. Its $a$, $e$ and $i$ are meant to be **mean elements**: the smooth, slowly-changing values left after $J_2$'s once-per-orbit wobble is averaged out. But we started the simulation from $a$, $e$, $i$ taken at a single instant, at perigee. Those instant values are **osculating elements**, and under $J_2$ they wobble within every orbit. For this orbit, the instant semi-major axis swings between about $6915.3\,\mathrm{km}$ and $6928.1\,\mathrm{km}$ during one lap — a range of $12.8\,\mathrm{km}$. Our starting value sits at the top of that swing, not in the middle. Lesson 6 takes this idea apart properly.

::: example Closing the gap with mean elements
Average the instant values of $a$, $e$, $i$ over the first orbit of the simulation. That gives approximate mean elements:
$$
\bar a = 6921.256\,\mathrm{km}, \qquad \bar e = 0.049\,095, \qquad \bar i = 51.5795^\circ .
$$
(The bar on top, read "a-bar", marks an average.) All three are close to the starting values, but measurably different: $\bar a$ is about $7\,\mathrm{km}$ lower.

Put these averaged elements into the same formulas:
$$
\dot\Omega(\bar a,\bar e,\bar i) = -4.6742^\circ/\mathrm{day}, \qquad \dot\omega(\bar a,\bar e,\bar i) = +3.5008^\circ/\mathrm{day} .
$$

Now the formula and the simulation agree to about $0.08\%$ for the node and $0.10\%$ for the perigee — roughly six times better than before.

**Does it make sense?** A smaller $\bar a$ means a stronger $J_2$ effect (the spacecraft is closer to the bulge), so the predicted rates should grow — and they did, toward the measured values. The small leftover gap comes from [[effects of order $J_2^2$|second-order]], which a first-order theory leaves out.
:::

The lesson here is not "the formula is slightly wrong". It is that a formula built for mean elements must be fed mean elements. And the fact that the gap shrinks, in the direction we predicted, when we make that correction is strong evidence that the theory and the simulation are both right.

## The critical inclination: where perigee stops

The perigee rate contains the factor $5\cos^2 i - 1$. Set it to zero:

$$
5\cos^2 i = 1 \quad\Longrightarrow\quad \cos i = \pm\frac{1}{\sqrt5} \quad\Longrightarrow\quad i_{\text{crit}} = \arccos\frac{1}{\sqrt5} = 63.4349^\circ \ \text{ or } \ 116.565^\circ .
$$

This is the **[[critical inclination|why-critical]]**. At exactly this tilt, $J_2$'s perigee drift vanishes (to first order), whatever the size or shape of the orbit. An eccentric orbit keeps its perigee — and so its apogee — parked over the same band of latitude, instead of letting it wander around the orbit.

Below the critical inclination, $5\cos^2 i - 1 > 0$ and perigee moves forward. Above it (up to $116.6^\circ$), perigee moves backward. Past $116.6^\circ$ it moves forward again.

Why would anyone want that? A satellite moves slowly near apogee — it spends most of its time there. A **[[Molniya orbit|molniya]]** uses a very stretched orbit ($e \approx 0.74$) with apogee high over the far north, so a satellite hangs over Russia for hours at a time. That only works if apogee *stays* over the north for years. At $63.4^\circ$, it does. The Tundra family of orbits uses the same trick.

::: example Checking the critical inclination in a simulation
Take an orbit with $a = 7500\,\mathrm{km}$ and $e = 0.1$, and compare two tilts.

**At $i = 45^\circ$.** The formula gives $\dot\omega = +4.3245^\circ/\mathrm{day}$. A $400$-orbit simulation (about $30$ days), fitted the same way as before, measures $+4.349^\circ/\mathrm{day}$ — about $0.5\%$ higher, the same mean-versus-osculating offset we met above. Over the run, $\omega$ climbs steadily from about $0^\circ$ to about $130^\circ$. (Check: $4.35^\circ/\mathrm{day} \times 30\,\mathrm{days} \approx 130^\circ$.)

**At $i = 63.435^\circ$.** The formula gives $\dot\omega = 0$ (a computer returns about $10^{-22}\,\mathrm{rad/s}$, which is rounding noise). The simulation measures $+0.0027^\circ/\mathrm{day}$ — about $1600$ times smaller than at $45^\circ$. Over the whole $30$-day run, $\omega$ only wiggles between about $-0.6^\circ$ and $+0.7^\circ$ with no visible trend.

That tiny leftover rate survives the same tolerance, sampling and integrator tests as before. It is not numerical noise. It is the same small mean-versus-osculating and second-order effect, now far smaller than the signal it is compared with.
:::

The node has its own design use: choose $i$ so that $\dot\Omega$ equals a chosen target, not zero. That is the sun-synchronous orbit, and it gets the whole next lesson, because instead of one special angle it gives a curve linking inclination to altitude.

::: warning The critical inclination freezes ω, not the whole orbit
The critical inclination stops $\omega$ from drifting. It says nothing about $a$, $e$ or $i$ — and $J_2$ does not drift those anyway: their secular rates are zero at any inclination. A **[[frozen orbit|frozen-orbit]]** in the full working sense, used by some Earth-observation satellites to keep their altitude over each spot on the ground the same from pass to pass, needs more: a particular small eccentricity and a perigee held near $90^\circ$, chosen so that the $J_2$ and $J_3$ effects on eccentricity cancel. That is a separate design condition that depends on $J_3$. The critical inclination alone does not give it.
:::

## Check yourself

::: check
Without redoing the integral, explain why the averaged node rate $\langle d\Omega/dt\rangle$ does not depend on $\omega$, even though the instantaneous rate depends on $u = \omega + \nu$.
:::

::: answer
The average came down to $\int_0^{2\pi}\sin^2(\omega+\nu)(1+e\cos\nu)\,d\nu$. Writing $\sin^2(\omega+\nu) = \tfrac12 - \tfrac12\cos(2\omega+2\nu)$ splits it into a constant part and wave parts. Over a full lap, every wave part integrates to zero — the ones that contain $\omega$ and the ones that do not. Only the constant $\tfrac12$ survives, giving $\pi$. That surviving piece has no $\omega$ in it, so the averaged rate cannot depend on $\omega$, whatever value $\omega$ has.
:::

::: check
A satellite's node drift, measured over many orbits, is within $0.1\%$ of the formula when the formula is fed mean elements, but $0.5\%$ off when it is fed the elements read from a single state vector at the start. Which comparison validates the theory, and why?
:::

::: answer
The mean-element comparison, at $0.1\%$. The formula was derived by averaging over an orbit, so it predicts how the *mean* elements drift. The elements from one state vector are osculating: they include $J_2$'s within-orbit wobble at whatever point in the orbit the snapshot was taken. The $0.5\%$ gap is a mismatch between what the formula expects and what it was given — bookkeeping, not wrong physics.
:::

::: check
Why check that the $0.45\%$ node-rate gap does not change with step size and tolerance, instead of only reporting the two numbers?
:::

::: answer
A gap between a formula and a simulation can come from two places: a real physical effect, or a simulation that is not accurate enough (steps too big, tolerance too loose). If the gap stays the same across many tolerances, sampling rates, run lengths and even a different integrator, the second explanation is ruled out. Only then can you say the gap is telling you something true about the physics — here, the mean-versus-osculating difference — rather than something false about your numerics.
:::

::: check
An engineer wants perigee fixed over one hemisphere for a multi-year mission. She proposes $i = 63.4^\circ$ with $e = 0.01$. Will this work as well as a Molniya orbit with $e \approx 0.74$?
:::

::: answer
The freezing itself works: $5\cos^2i - 1 = 0$ makes $\dot\omega$ vanish for *any* eccentricity, including $0.01$. But freezing perigee is only useful if there is a real apogee to protect. At $e = 0.01$ the orbit is almost a circle, so the satellite moves at nearly the same speed everywhere and has no long, slow hang-time over one hemisphere. A Molniya orbit's large eccentricity is what creates the slow apogee arc worth freezing. The critical inclination is necessary for a useful frozen high-eccentricity orbit, but the high eccentricity is what makes it worth doing.
:::

::: check
Both rates share the factor $nJ_2(R_E/a)^2/(1-e^2)^2$. A mission wants to roughly halve both rates without changing $i$ or $e$. What single change does it, and by how much?
:::

::: answer
Raise the orbit. The mean motion is $n = \sqrt{\mu/a^3}$, so $n \propto a^{-3/2}$ ("is proportional to"). With the $(R_E/a)^2 \propto a^{-2}$ factor, the rates go as $a^{-3/2}\times a^{-2} = a^{-7/2}$. To halve them, $a^{7/2}$ must double, so $a$ must grow by a factor $2^{2/7} \approx 1.219$ — about $22\%$. For a low orbit near $a = 6900\,\mathrm{km}$, that is about $1500\,\mathrm{km}$ of extra altitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Secular vs periodic | Secular change keeps going the same way and piles up; periodic change comes back each orbit |
| $R,T,N$ for $J_2$ | $R=-\tfrac32\frac{J_2\mu R_E^2}{r^4}(1-3\sin^2i\sin^2u)$, $T=-\tfrac32\frac{J_2\mu R_E^2}{r^4}\sin^2i\sin2u$, $N=-\tfrac32\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u$ |
| $\dot\Omega = -\tfrac32 nJ_2(R_E/a)^2\cos i/(1-e^2)^2$ | Secular nodal regression: prograde regresses, retrograde advances, polar does neither |
| $\dot\omega = \tfrac34 nJ_2(R_E/a)^2(5\cos^2i-1)/(1-e^2)^2$ | Secular apsidal rotation |
| $i_{\text{crit}} = \arccos(1/\sqrt5) = 63.435^\circ$ | Critical inclination: $\dot\omega = 0$ for any $a$, $e$; used by Molniya and Tundra orbits |
| $550\,\mathrm{km}$, $51.6^\circ$, $e=0.05$ | $\dot\Omega = -4.66^\circ/\mathrm{day}$, $\dot\omega = +3.48^\circ/\mathrm{day}$ |
| Simulation check | A full simulation matches the formulas to about $0.1\%$ once mean elements are used; with the starting (osculating) elements a real $0.5\%$ gap remains, not caused by the numerics |

Next lesson turns the node formula around. Instead of asking how fast a given orbit's node drifts, it asks which inclination makes the drift match the Sun's yearly motion — the sun-synchronous orbit.

::: context top-precession Why a pull becomes a turn
A spinning object carries angular momentum, which points along its spin axis. For an orbit, that axis is the direction straight out of the orbit plane. A push that tries to tip the axis does not tip it: it nudges the angular momentum sideways, at right angles to where it already points. Nudge it sideways again and again and the axis walks around in a circle. That is **precession**. The bulge keeps trying to pull the tilted orbit flat onto the equator, and the orbit answers by swinging its plane slowly around Earth's axis instead.
:::

::: context node-picture Where the node is, seen from above
Look down on Earth from above the North Pole. The equator is a circle. The node is the point where the orbit crosses it going north, and $\Omega$ is its angle from a fixed direction among the stars. Eastward is counterclockwise in this view. For a prograde orbit, $J_2$ slides the node clockwise — westward — a few degrees a day.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="105" r="75" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="150" cy="105" r="3" fill="#1f2a44"/>
  <line x1="150" y1="105" x2="262" y2="105" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="268,105 258,100 258,110" fill="#6c7a93"/>
  <text x="268" y="124" font-size="11" text-anchor="middle" fill="#6c7a93">fixed direction</text>
  <line x1="92.5" y1="153.2" x2="207.5" y2="56.8" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="207.5" cy="56.8" r="5" fill="#1d6fd1"/>
  <text x="196" y="44" font-size="12" text-anchor="end" fill="#1d6fd1">ascending node</text>
  <path d="M180,105 A30,30 0 0,0 173.0,85.7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="186" y="94" font-size="12" fill="#1f2a44">Ω</text>
  <path d="M219.3,50.8 A88,88 0 0,1 233.7,77.8" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="236.2,85.4 229.0,79.4 238.4,76.2" fill="#b4232c"/>
  <text x="244" y="66" font-size="11" fill="#b4232c">westward drift</text>
  <text x="244" y="80" font-size="11" fill="#b4232c">(prograde orbit)</text>
  <text x="150" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">equator, seen from above the North Pole</text>
</svg>
```
:::

::: context word-secular An old word for "slow and steady"
"Secular" comes from the Latin *saeculum*, meaning an age or a lifetime. Astronomers borrowed it for changes so slow they only show up over ages — the slow turning of Earth's own axis, for example. In orbit work it means any change that keeps going in one direction and adds up, as opposed to a periodic change that swings back and forth and cancels out over each orbit.
:::

::: context equal-areas Why $h\,dt = r^2\,d\nu$
Kepler's second law says a line from Earth to the satellite sweeps out equal areas in equal times. A thin slice of that sweep, turning through a small angle $d\nu$ at distance $r$, is a skinny triangle of area $\tfrac12 r^2\,d\nu$. The rate of sweeping is $\tfrac12 h$, so in a time $dt$ the swept area is $\tfrac12 h\,dt$. Setting the two equal gives $h\,dt = r^2\,d\nu$. It turns "how long" into "how far around", which is the variable the orbit's shape is written in.
:::

::: context waves-cancel Why only the constant part survives
Over one full lap, a wave spends as long above its middle as below it, so its hills and valleys cancel. The picture shows $\sin^2 u$: it swings between $0$ and $1$ twice per lap, and its average is exactly the dashed line at $\tfrac12$. That $\tfrac12$ is the only piece that survives the averaging.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,130.0 45.8,128.5 51.7,124.0 57.5,116.8 63.3,107.5 69.2,96.6 75.0,85.0 80.8,73.4 86.7,62.5 92.5,53.2 98.3,46.0 104.2,41.5 110.0,40.0 115.8,41.5 121.7,46.0 127.5,53.2 133.3,62.5 139.2,73.4 145.0,85.0 150.8,96.6 156.7,107.5 162.5,116.8 168.3,124.0 174.2,128.5 180.0,130.0 185.8,128.5 191.7,124.0 197.5,116.8 203.3,107.5 209.2,96.6 215.0,85.0 220.8,73.4 226.7,62.5 232.5,53.2 238.3,46.0 244.2,41.5 250.0,40.0 255.8,41.5 261.7,46.0 267.5,53.2 273.3,62.5 279.2,73.4 285.0,85.0 290.8,96.6 296.7,107.5 302.5,116.8 308.3,124.0 314.2,128.5 320.0,130.0"/>
  <line x1="40" y1="85" x2="320" y2="85" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="34" y="134" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="89" font-size="11" text-anchor="end" fill="#b4232c">1/2</text>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="110" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">90°</text>
  <text x="180" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="250" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">270°</text>
  <text x="320" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">360°</text>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#1d6fd1">sin²u over one lap</text>
  <text x="180" y="165" font-size="11" text-anchor="middle" fill="#b4232c">average = 1/2</text>
</svg>
```
:::

::: context second-order What "first-order" leaves out
$J_2$ is about $0.001$. The formulas in this lesson keep every term proportional to $J_2$ and throw away terms proportional to $J_2^2$, which is about $10^{-6}$. Compared with the rates themselves, the dropped terms are roughly $J_2$ times smaller — about a tenth of a percent. That is the size of the gap left over once mean elements are used. Fuller theories, such as Brouwer's, keep the $J_2^2$ terms for exactly this reason.
:::

::: context why-critical Why "critical"?
The name comes from the mathematics, not the missions. In Dirk Brouwer's 1959 satellite theory, some of the long-period correction terms are divided by $1 - 5\cos^2 i$. At $63.4^\circ$ that divisor is zero and those terms blow up, so the theory breaks down there — the inclination is "critical" for the theory. Special methods were later worked out to handle orbits near it. The same factor, as $5\cos^2 i - 1$, is the one that stops perigee from drifting.
:::

::: context molniya Hanging over the north
Molniya ("lightning" in Russian) satellites were Soviet communication satellites first launched in the 1960s. Geostationary satellites sit over the equator and look very low in the sky from far-northern places, so the Soviet Union chose a stretched 12-hour orbit instead. With $e \approx 0.74$, a satellite spends nearly three quarters of each orbit in the apogee half of the ellipse, high over the north. At $63.4^\circ$ that apogee stays north for years.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="60.5" ry="90" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="166.6" r="21.6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="170.6" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="10" r="4" fill="#b4232c"/>
  <circle cx="180" cy="190" r="4" fill="#b4232c"/>
  <line x1="110" y1="100" x2="250" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="192" y="16" font-size="12" fill="#1f2a44">apogee: slow, long dwell</text>
  <text x="192" y="196" font-size="12" fill="#1f2a44">perigee: fast</text>
  <text x="256" y="104" font-size="11" fill="#6c7a93">center line</text>
  <text x="20" y="60" font-size="11" fill="#1f2a44">~74% of each</text>
  <text x="20" y="74" font-size="11" fill="#1f2a44">orbit up here</text>
</svg>
```

The drawing is to scale: an orbit with $a = 26\,554\,\mathrm{km}$ and $e = 0.74$ around an Earth of radius $6378\,\mathrm{km}$.
:::

::: context frozen-orbit Frozen orbits and J3
$J_3$ is the next zonal term after $J_2$. It describes a slight "pear shape": Earth's northern and southern halves are not quite mirror images. Unlike $J_2$, it slowly pushes eccentricity up or down depending on where perigee is. $J_2$, meanwhile, turns perigee. Choose a tiny eccentricity (around $0.001$ in low orbit) and a perigee near $90^\circ$, and the two effects balance: eccentricity and perigee both stay put. Satellites that need their height over each spot on the ground to repeat from pass to pass, such as those that measure the height of the sea, fly orbits like this.
:::
