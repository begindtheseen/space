---
id: l11-sgp4-tle
title: SGP4/SDP4 and why TLEs are theory-specific
minutes: 21
covers:
  - SGP4/SDP4 and why TLEs are theory-specific
---

Almost every public piece of information about where a satellite is comes in one shape: a **two-line element set**, or **TLE** — two short lines of text full of numbers. The U.S. Space Force publishes them for tens of thousands of objects. Amateur trackers use them to predict when the space station will pass overhead. Conjunction-screening services feed them in by the thousand to look for possible collisions.

Every TLE is meant to be run through one particular piece of math: an analytic theory called **SGP4**. This module has spent ten lessons on the physics of single perturbations and on two numerical special-perturbation methods, Cowell and Encke. SGP4 is neither of those. It is a **general-perturbations** theory, in the sense of the first lesson — a formula, not a simulation — built for exactly one job: take a TLE and a time, and return a position and velocity in microseconds, without integrating anything.

It can do that job only because the numbers in a TLE are defined *by SGP4 itself*. This lesson explains what that means, and why it makes TLEs incompatible with your own Cowell or Encke propagator unless you go through SGP4 first.

## A timetable, not a simulation

Think of a bus timetable. It does not simulate the bus's engine, the traffic or the driver. It is a compact formula — "every 12 minutes from 6:05" — that is good enough to find the bus. And it is written in its own code: "6:05" means the stop *on that timetable's route*, not any stop in the city.

SGP4 is a timetable for satellites. The name stands for **Simplified General Perturbations, version 4**. It predicts a satellite's position from a compact set of **mean orbital elements** plus an **epoch** (the moment those elements describe), using closed-form formulas for the steady drifts and the wobbles instead of numerical integration.

It descends from the mean-element theories that **[[Dirk Brouwer and Yoshihide Kozai|sgp4-history]]** published in 1959. Its force model includes:

- $J_2$'s secular drift of the node and perigee — essentially the formulas derived earlier in this module;
- $J_3$ and $J_4$ terms;
- an empirical drag model driven by a single fitted number, $B^*$ (read "B star"), rather than a physical density model with an independently known ballistic coefficient.

**SDP4** (Simplified Deep-space Perturbations) is the companion theory for slow, high orbits. Any modern implementation switches to it automatically for orbits with a period of $225\,\mathrm{minutes}$ or more. It adds lunar and solar gravity and Earth's gravity **resonances** for $12$-hour and $24$-hour orbits — repeated nudges that line up with the orbit, like pushing a swing at the right moment each time. Those matter for slow orbits such as geostationary and Molniya, but are negligible for a low orbit that goes around every hour and a half. In practice people say "SGP4" for both, since the switch happens inside the code.

::: example Where the near-Earth / deep-space boundary sits in altitude
Kepler's third law turns the $225$-minute period into a semi-major axis. First convert the period to seconds: $T = 225 \times 60 = 13\,500\,\mathrm{s}$. Then

$$
a = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} = \left(\frac{398\,600.4418\times13\,500^2}{4\pi^2}\right)^{1/3} = 12\,254.1\,\mathrm{km}.
$$

Subtract Earth's equatorial radius, $6378.137\,\mathrm{km}$, to get an altitude of about $5876\,\mathrm{km}$.

**Sanity check against real orbits.** A low orbit at a few hundred kilometers is far below this line, so it uses SGP4. GPS satellites orbit at about $20\,200\,\mathrm{km}$ altitude, with a period of about $719$ minutes — well past the boundary, so SDP4. Geostationary satellites, at $35\,786\,\mathrm{km}$ and $1436$ minutes, are far past it too, and Molniya orbits, with a $12$-hour period, likewise. So GPS, Molniya and geostationary satellites all need the deep-space terms, while anything circling below about $5900\,\mathrm{km}$ does not.
:::

## Reading a two-line element set

Here is a real TLE for the International Space Station, from December 2019:

```text
1 25544U 98067A   19343.69339541  .00001764  00000-0  38792-4 0  9991
2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.50103472202482
```

Each line is exactly $69$ characters, in fixed columns. The main fields are:

| Field | In this TLE | Meaning |
| --- | --- | --- |
| Catalog number | `25544` | The object's **[[NORAD catalog|norad-catalog]]** number |
| Epoch | `19343.69339541` | Year 2019, day $343.693\ldots$ of the year |
| $B^*$ | `38792-4` | $0.38792\times10^{-4} = 3.8792\times10^{-5}$ per Earth radius |
| Inclination | `51.6439` | degrees |
| Right ascension of the ascending node | `211.2001` | degrees |
| Eccentricity | `0007417` | a leading decimal point is assumed: $0.0007417$ |
| Argument of perigee | `17.6667` | degrees |
| Mean anomaly | `85.6398` | degrees |
| Mean motion | `15.50103472` | revolutions per day |

Line 1 also carries two **[[derivatives of the mean motion|mean-motion-derivatives]]**, and each line ends with a one-digit **checksum** — a quick test that no digit was garbled in transmission.

You never need to memorize the column layout. Every SGP4 library parses it for you. What matters is what the six orbital numbers *are*. They are not the classical, instantaneous, **osculating** elements this module has computed from a state vector in every earlier lesson. They are elements defined by, and meaningful only within, SGP4's own theory.

::: example Sanity-checking a TLE's mean motion
A typical ISS TLE reports a mean motion of about $15.50$ revolutions per day. Turn that into a semi-major axis.

**Step 1: revolutions per day to radians per second.** One revolution is $2\pi$ radians and one day is $86\,400\,\mathrm{s}$:

$$
n = 15.50\times\frac{2\pi}{86\,400\,\mathrm{s}} = 1.1272\times10^{-3}\,\mathrm{rad/s}.
$$

**Step 2: Kepler's third law.** $n^2 a^3 = \mu$, so

$$
a = \left(\frac{\mu}{n^2}\right)^{1/3} = \left(\frac{398\,600.4418}{(1.1272\times10^{-3})^2}\right)^{1/3} = 6794.9\,\mathrm{km}.
$$

**Step 3: altitude.** $6794.86 - 6378.14 = 416.72\,\mathrm{km}$, about $416.7\,\mathrm{km}$ — squarely in the ISS's real operating range.

This is the kind of check worth running on any element set before trusting it. A nonsense mean motion — one implying an orbit below Earth's surface, or absurdly high — is usually a parsing bug, not an exotic orbit.
:::

## "Mean" here means "SGP4's mean"

Recall the mean-versus-osculating lesson. **Osculating elements** describe the two-body ellipse that exactly touches the true path at one instant, and under $J_2$ they wobble twice every revolution. **Mean elements** are whatever a particular theory leaves after it removes the periodic terms it chooses to remove, to the order it carries the approximation. Different theories disagree with each other at the level of the short-period $J_2$ wobble itself — several to tens of kilometers.

SGP4's mean elements are one specific case of that warning, not an exception to it. They are defined by SGP4's own choice of which periodic terms to strip out, using its own force model. That model is not quite the $J_2$–$J_4$ treatment this module derived, and its drag is fitted rather than computed from physics. The elements are then fitted to real tracking data by a least-squares process that sits outside the theory, so that SGP4 run on them reproduces the observed positions as well as it can.

You can see the gap directly. Run SGP4 on the ISS TLE at its own epoch and compute the osculating semi-major axis from the position and velocity it returns:

```python
import numpy as np
from sgp4.api import Satrec   # pip install sgp4

line1 = '1 25544U 98067A   19343.69339541  .00001764  00000-0  38792-4 0  9991'
line2 = '2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.50103472202482'
sat = Satrec.twoline2rv(line1, line2)

# SGP4's own state at the TLE epoch (km and km/s, in the TEME frame)
err, r, v = sat.sgp4(sat.jdsatepoch, sat.jdsatepochF)
r, v = np.array(r), np.array(v)

mu = 398600.8                  # the value SGP4 itself uses (WGS-72)
a_osc = 1 / (2 / np.linalg.norm(r) - v @ v / mu)   # vis-viva
a_mean = sat.a * 6378.135      # SGP4's mean semi-major axis, Earth radii -> km
print(f"mean a = {a_mean:.2f} km, osculating a = {a_osc:.2f} km")
# mean a = 6795.07 km, osculating a = 6789.73 km
```

The TLE's mean semi-major axis and the true osculating one **[[at the very same instant|theory-mismatch-picture]]** differ by $5.3\,\mathrm{km}$. Neither is wrong. They are two different quantities that share a name. (The state comes out in a frame called **[[TEME|teme-frame]]**, which you rotate into your own frame before using it.) Two mistakes follow from mixing them up.

### Mistake one: a TLE fed to your own propagator

Every other propagator in this module expects an initial *state*. So the natural move is to take the TLE's six numbers, treat them as osculating elements, convert them to a position and velocity, and hand that to Cowell. This skips the periodic corrections SGP4 would have applied, and reintroduces exactly the short-period error of the mean-vs-osculating lesson — at epoch, before any propagation error exists.

A velocity error does not stay put the way a position offset might. A wrong velocity means a wrong orbit — here, most importantly, a wrong period — so the trajectory drifts farther from the truth every revolution. The error starts at kilometers and grows.

::: example How big the mix-up is for the ISS
Using the ISS TLE above, compare two ways of starting a Cowell propagator (with $J_2$), and check both against SGP4's own prediction.

**At epoch.** Treating the TLE's elements as osculating puts the spacecraft $7.6\,\mathrm{km}$ from where SGP4 says it is, with a velocity off by $5.0\,\mathrm{m/s}$. Starting from SGP4's *output* state instead puts it exactly where SGP4 says, by construction.

**[[How the error grows|error-growth-picture]].**

| Time after epoch | From SGP4's output state | From raw TLE fields |
| --- | --- | --- |
| $1.5$ hours (about one orbit) | $0.025\,\mathrm{km}$ | $46\,\mathrm{km}$ |
| $1$ day | $0.26\,\mathrm{km}$ | $699\,\mathrm{km}$ |
| $3$ days | $5.1\,\mathrm{km}$ | $2108\,\mathrm{km}$ |

**Why it grows so fast.** The raw-fields start has the wrong semi-major axis by about $5\,\mathrm{km}$, so its period is wrong. For a near-circular orbit, an error $\Delta a$ in semi-major axis makes the spacecraft slip along its track by about $3\pi\,\Delta a$ per revolution. With $\Delta a \approx 5\,\mathrm{km}$ that is $3\pi\times5 \approx 47\,\mathrm{km}$ per orbit — matching the $46\,\mathrm{km}$ after one orbit. After a day, about $15.5$ orbits, the slip is hundreds of kilometers.

**The small numbers in the first column** are honest disagreement between two different force models: a Cowell run with $J_2$ only, and SGP4 with its $J_3$, $J_4$ and drag terms. They stay small because both started from the same state.
:::

### Mistake two: the reverse

The opposite mistake is equally real. Take a Cowell trajectory's osculating elements — or even a carefully built mean-element set from a different theory, such as Brouwer's — and write them into a TLE's fields for someone else's SGP4 to use. SGP4 will apply *its own* periodic corrections on top of elements that were never averaged the way SGP4 expects. The same mismatch comes back from the other direction.

The only combination guaranteed to be self-consistent is a TLE's own numbers, run through SGP4.

::: key TLEs are theory-specific mean elements
TLE elements are mean elements defined *within* the SGP4 theory, with its particular analytic removal of periodic terms and its own $B^*$ drag model — not osculating elements, and not interchangeable with any other theory's mean elements. Treating them as osculating elements introduces kilometer-level error at epoch, and it grows from there.

Propagate a TLE with SGP4. If another propagator needs a starting point, run SGP4 first and convert the resulting state — which is an ordinary osculating state, like any position and velocity — into what that propagator needs. Never feed the TLE's raw element fields to a different theory.
:::

## B*: a drag number, but not this module's B

$B^*$ looks a lot like the inverse of the ballistic coefficient $B = m/(C_D A)$ from the drag lesson, and people often call it "the drag term". But it is a different quantity.

- It is tied to SGP4's own fixed, built-in atmosphere — a simple density formula written into the theory, which does not change with the Sun.
- It is measured in units of inverse Earth radii, not $\mathrm{m^2/kg}$.
- It is re-estimated from tracking data at every new TLE epoch, not computed from a physical $C_D$, area and mass.

Because it is fitted, $B^*$ absorbs more than drag. It soaks up whatever the fit needed to make SGP4's simplified force model match the real tracking data, including some of the error from every *other* simplification SGP4 makes. A $B^*$ can even come out negative, which no physical drag could do.

So using $B^*$ as a drop-in for $1/B$ in the drag lesson's decay formula, or expecting it to follow a real, changing atmosphere the way that lesson's solar-minimum and solar-maximum curves did, mixes two definitions of "drag parameter". That is the same kind of error as mixing mean and osculating elements: two different definitions of "orbit".

## Why TLEs go stale

A TLE's $B^*$ and mean elements are fitted to tracking observations *up to* its epoch. SGP4 then extrapolates forward using that one frozen snapshot of the satellite's recent drag.

It has no way to know that a **[[geomagnetic storm|geomagnetic-storm]]** three days after epoch is about to change the real air density several times over. That is the same uncertainty the drag lesson identified as the dominant term in any lifetime prediction.

This is why TLEs for actively tracked low-orbit objects are reissued every few days, not trusted for weeks. The SGP4 formulas do not wear out with time on their own. The real atmosphere keeps drifting away from whatever it looked like at the fitted epoch, and SGP4 — by design, to stay fast — has no way to update that picture by itself.

::: warning A TLE's epoch is not "now"
A TLE you download today may have an epoch several days old. Propagating it "to now" with SGP4 is routine and expected. Propagating it weeks past its epoch, especially for a low, drag-affected orbit, piles the drag lesson's density uncertainty on top of $B^*$'s nature as a fitted, not physical, number. For anything precision-sensitive, use the freshest TLE available rather than a long propagation from an old one — and check the epoch field before you trust any prediction.
:::

## Check yourself

::: check
A colleague writes the six numbers from a TLE directly into a Cowell propagator's initial state, treating the right ascension, inclination and the rest as ordinary osculating elements. What is wrong with this, and roughly how large is the resulting error at epoch?
:::

::: answer
TLE elements are mean elements defined inside SGP4's own theory, not osculating elements. Treating them as osculating skips the periodic corrections SGP4 would apply, and reintroduces an error the size of the short-period $J_2$ wobble: several to a few tens of kilometers in position at epoch. For the ISS TLE in this lesson it was $7.6\,\mathrm{km}$, with a $5.0\,\mathrm{m/s}$ velocity error.

The velocity error means a wrong orbit — in particular a wrong period — so the error keeps growing as the already-wrong trajectory is propagated: about $46\,\mathrm{km}$ after one orbit and hundreds of kilometers after a day in the ISS example. The fix is to run SGP4 at epoch and start Cowell from SGP4's output state.
:::

::: check
Why does SDP4 add lunar, solar and Earth-resonance terms that SGP4 leaves out, rather than both theories using one identical force model?
:::

::: answer
Those effects matter on the timescale that a slow, high orbit actually experiences — geostationary, Molniya, or anything with a period of $225$ minutes or more. There the Moon and Sun are comparatively strong, and resonances line up with the orbit again and again.

A fast low-Earth-orbit satellite goes around many times before such slow effects build up to anything significant, so for it they would add computing cost without meaningfully improving accuracy. SGP4 leaves them out for the orbits it targets, and SDP4 adds them back exactly where they matter.
:::

::: check
Explain why $B^*$ cannot be plugged into the drag lesson's ballistic-coefficient formula as $1/B$.
:::

::: answer
$B^*$ is fitted against SGP4's own fixed, built-in atmosphere, in units of inverse Earth radii, and it absorbs whatever else the fit needed to make SGP4's simplified force model match real tracking data. It is not a physically defined $m/(C_D A)$ tied to an independent density model, which is how the drag lesson uses $B$.

The two describe similar-sounding physics but are calibrated against different, non-interchangeable atmospheres and force models. Treating them as the same number silently mixes two incompatible theories.
:::

::: check
A satellite operator has a very precise numerically integrated (Cowell) ephemeris for their own spacecraft and wants to publish it as a TLE for public trackers to use with their own SGP4. Is copying the Cowell osculating elements into the TLE fields a sound approach?
:::

::: answer
No. SGP4 applies its own periodic corrections to whatever elements it is given, assuming they are already SGP4 mean elements. Feeding it osculating elements from a different theory brings back the same theory-mismatch error this lesson describes, only from the opposite direction to the TLE-into-Cowell mistake.

A usable TLE has to be *fitted*: choose the SGP4 mean elements and $B^*$ so that SGP4's output matches the precise trajectory (or observations of it) over a span of time. Relabeling a different theory's elements does not do that.
:::

::: check
Why might a TLE that is two weeks old give noticeably worse predictions for a $400\,\mathrm{km}$ satellite than for a geostationary one, even though SGP4 runs the same way for both?
:::

::: answer
The main source of staleness is not the algorithm but the atmosphere. A $400\,\mathrm{km}$ orbit decays through drag, and the density behind that drag can change several times over within days around a geomagnetic storm, while $B^*$ reflects only the drag seen up to the TLE's epoch.

A geostationary satellite feels essentially no drag. The same two-week-old element set is not fighting an unpredictable, fast-changing force, so its predictions degrade far more slowly with age.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| SGP4 / SDP4 | Analytic general-perturbations theory; SDP4 adds lunar, solar and resonance terms for periods $\ge 225\,\mathrm{min}$ (above about $5876\,\mathrm{km}$ altitude for a circular orbit) |
| TLE | Epoch, six mean elements and $B^*$ in fixed-width text; the elements are SGP4-theory mean elements, not osculating |
| $n = 15.50$ rev/day $\Rightarrow a \approx 6794.9\,\mathrm{km}$ | Kepler's third law as a quick TLE sanity check |
| Mean vs osculating at epoch | ISS example: SGP4 mean $a = 6795.07\,\mathrm{km}$, osculating $a = 6789.73\,\mathrm{km}$ |
| Mixing theories | Raw TLE fields into another propagator, or another theory's elements into a TLE: kilometer-level error at epoch that then grows |
| $B^*$ | Fitted drag-like parameter tied to SGP4's own fixed atmosphere, in inverse Earth radii — not $B = m/(C_D A)$ |
| TLE staleness | Mainly the real atmosphere drifting from the epoch's fitted $B^*$; worst for low, drag-affected orbits |
| Correct workflow | Propagate a TLE only with SGP4; use its output *state* (osculating) to start any other propagator |

The final lesson of this module puts every perturbation together to answer a practical question: how long does an orbit last, and how does the uncertainty in each perturbation feed into that answer?

::: context sgp4-history Where SGP4 came from
In 1959, the first years of the space age, Dirk Brouwer and Yoshihide Kozai each published analytic theories for a satellite around an oblate Earth. Both split the motion into slowly drifting mean elements plus periodic wobbles. Drag terms were added in the 1960s.

The U.S. military's tracking network needed to predict thousands of orbits on the computers of the day, so it built compact versions of these theories. SGP4 and SDP4 were written up for the public in *Spacetrack Report No. 3* by Felix Hoots and Ronald Roehrich in 1980. In 2006, David Vallado and colleagues published a corrected, consolidated version, "Revisiting Spacetrack Report #3", which is the basis of most SGP4 code in use today, including the Python `sgp4` package used in this lesson.
:::

::: context norad-catalog Who publishes TLEs
The catalog number is assigned when an object is first tracked; the ISS is number $25544$. The name comes from NORAD, the North American Aerospace Defense Command, which ran the catalog for decades. Today the U.S. Space Force maintains it and publishes TLEs on the Space-Track website. Sites such as CelesTrak redistribute them.

The field `98067A` on line 1 is the international designator: launched in 1998, the 67th launch of that year, piece A.
:::

::: context mean-motion-derivatives Fields SGP4 does not use
Line 1 of a TLE carries half the first derivative of the mean motion ($\dot n/2$, here `.00001764` revolutions per day squared) and one sixth of the second derivative ($\ddot n/6$, here `00000-0`, which is zero).

These fields served the older, simpler SGP theory, which modeled drag as a steady change in mean motion. SGP4 ignores them and uses $B^*$ instead. They are still printed, and they give a quick human-readable hint of how fast an orbit is decaying.
:::

::: context theory-mismatch-picture Why the raw elements are off: a picture
Run SGP4 on the ISS TLE and compute the osculating semi-major axis from its output every few minutes for two orbits. It swings between about $6789\,\mathrm{km}$ and $6801\,\mathrm{km}$, twice per orbit. The TLE's mean value, $6795.07\,\mathrm{km}$, runs through the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="149">6788</text><text x="36" y="120">6792</text><text x="36" y="91">6796</text><text x="36" y="62">6800</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.8">
    <line x1="40" y1="145.6" x2="345" y2="145.6"/><line x1="40" y1="116.7" x2="345" y2="116.7"/><line x1="40" y1="87.8" x2="345" y2="87.8"/><line x1="40" y1="58.9" x2="345" y2="58.9"/>
  </g>
  <polyline points="40.0,133.1 45.0,121.8 50.0,105.7 55.0,87.8 60.0,71.0 65.0,58.3 70.0,51.9 75.0,52.8 80.0,61.0 85.0,74.9 90.0,92.2 95.0,109.8 100.0,124.9 105.0,134.7 110.0,137.6 115.0,133.1 120.0,121.9 125.0,106.0 130.0,88.1 135.0,71.3 140.0,58.4 145.0,51.8 150.0,52.7 155.0,60.8 160.0,74.8 165.0,92.2 170.0,110.0 175.0,125.2 180.0,134.9 185.0,137.7 190.0,132.9 195.0,121.5 200.0,105.4 205.0,87.4 210.0,70.7 215.0,58.1 220.0,51.8 225.0,52.9 230.0,61.2 235.0,75.2 240.0,92.5 245.0,110.2 250.0,125.1 255.0,134.8 260.0,137.6 265.0,132.9 270.0,121.6 275.0,105.7 280.0,87.8 285.0,71.0 290.0,58.2 295.0,51.8 300.0,52.8 305.0,61.0 310.0,75.1 315.0,92.6 320.0,110.4 325.0,125.4 330.0,135.1 335.0,137.6 340.0,132.7" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="94.5" x2="345" y2="94.5" stroke="#b4232c" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="345" y="20" font-size="11" fill="#1d6fd1" text-anchor="end">osculating a (km)</text>
  <text x="345" y="176" font-size="11" fill="#b4232c" text-anchor="end">TLE mean a = 6795.07</text>
  <text x="40" y="176" font-size="11" fill="#1f2a44">0</text>
  <text x="190" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">1 orbit</text>
</svg>
```

The epoch happens to fall near a low point of the wiggle, at $6789.73\,\mathrm{km}$. Read the TLE's $6795.07$ as if it were osculating, and you start about $5\,\mathrm{km}$ too high.
:::

::: context teme-frame The frame SGP4 answers in
SGP4 returns position and velocity in a frame called TEME, for "True Equator, Mean Equinox". It is an Earth-centered inertial-like frame, but its axes are defined in a slightly unusual way that belongs to the theory's history. The difference from the common frames used elsewhere in this course is small — well under a degree of rotation — but at orbital distances it amounts to kilometers.

So "use SGP4's output state" really means: run SGP4, then rotate the state from TEME into your propagator's frame. Libraries such as Astropy and Skyfield do that rotation for you.
:::

::: context error-growth-picture The two starts, on a log scale
The bars show the distance from SGP4's own prediction, on a scale where each tick is a hundred times the last. Blue starts Cowell from SGP4's output state; red starts it from the raw TLE fields.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="92" y="52" text-anchor="end">1.5 hours</text>
    <text x="92" y="102" text-anchor="end">1 day</text>
    <text x="92" y="152" text-anchor="end">3 days</text>
  </g>
  <rect x="100" y="36" width="15.9" height="10" fill="#1d6fd1"/>
  <rect x="100" y="49" width="146.7" height="10" fill="#b4232c"/>
  <rect x="100" y="86" width="56.9" height="10" fill="#1d6fd1"/>
  <rect x="100" y="99" width="193.8" height="10" fill="#b4232c"/>
  <rect x="100" y="136" width="108.2" height="10" fill="#1d6fd1"/>
  <rect x="100" y="149" width="213.0" height="10" fill="#b4232c"/>
  <line x1="100" y1="28" x2="100" y2="166" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="166" x2="340" y2="166" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="182">0.01</text><text x="180" y="182">1</text><text x="260" y="182">100</text><text x="340" y="182">10000</text>
  </g>
  <text x="220" y="197" font-size="11" fill="#1f2a44" text-anchor="middle">km from SGP4 (log scale)</text>
  <text x="340" y="20" font-size="11" fill="#1d6fd1" text-anchor="end">from SGP4 state</text>
  <text x="220" y="20" font-size="11" fill="#b4232c" text-anchor="end">raw TLE fields</text>
</svg>
```

The gap between blue and red is roughly a factor of a thousand at every time — the price of one misread definition.
:::

::: context geomagnetic-storm What a geomagnetic storm does to the air
When the Sun throws out a burst of charged particles, it can shake Earth's magnetic field for a day or two. That dumps energy into the upper atmosphere, which heats up and swells outward. At a fixed altitude of a few hundred kilometers, the density can rise several times within hours.

In February 2022, SpaceX launched 49 Starlink satellites into a very low parking orbit right as a storm arrived. The extra drag was so large that about 40 of them re-entered before they could climb away. No TLE fitted before the storm could have predicted that.
:::
