---
id: l14-tle-sgp4
title: The TLE format and SGP4
minutes: 24
covers:
  - TLE format and SGP4
---

Think of a bus timetable. It does not tell you where the bus is right now; it tells you the plan, and you work out the rest. It is also written in a squeezed shorthand — columns, abbreviations, little codes — that only makes sense once someone shows you how to read it.

A **two-line element set**, or **TLE**, is the timetable of a satellite. Most of the tens of thousands of objects tracked in Earth orbit have their orbits published in this one format: two lines of fixed-column text, $138$ characters in all. It comes from the days of **[[punched cards|punched-cards]]**, and it shows — decimal points are left out, and exponents are written without the letter E. It is also the only freely available orbit data for most satellites. So every pass predictor, collision check and ground-track plot starts by reading one.

Here is the trap. A TLE does *not* hold the classical elements of this module. It holds **mean elements**, in the special sense of one particular perturbation theory, and they only mean something when fed to that theory's own propagator, **SGP4**. Treat them as ordinary elements, turn them into a state vector with the conversions lesson's routines, and you start a few kilometres off at the epoch — and drift from there.

This lesson reads the format field by field, decodes a set into physical numbers, explains what "mean" means here and why it matters, and then builds the pipeline that turns a TLE into a ground track — the module's final objective.

## The format

Here is a TLE in the format used for the International Space Station, with made-up but realistic values for an epoch of 2026 September 22, 12:00 UTC:

```text
1 25544U 98067A   26265.50000000  .00012345  00000+0  22345-3 0  9999
2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.49000000123450
```

Each line is exactly $69$ characters. Every field lives in fixed **columns**, counted from $1$ at the left. Spaces matter: a field is found by its column numbers, not by splitting on spaces.

**Line 1**

| Columns | Content | In the example |
| --- | --- | --- |
| 1 | Line number | 1 |
| 3–7 | Satellite **[[catalogue number|catalog-number]]** | 25544 |
| 8 | Classification (U unclassified) | U |
| 10–17 | International designator: launch year, launch number of that year, piece | 98067A – 1998, 67th launch, piece A |
| 19–32 | Epoch: two-digit year, then day of year with fraction | 26265.50000000 |
| 34–43 | First time derivative of mean motion, divided by two, rev/day² | .00012345 |
| 45–52 | Second derivative of mean motion divided by six, rev/day³, implied decimal and exponent | 00000+0 = 0 |
| 54–61 | $B^{*}$ drag term, inverse Earth radii, implied decimal and exponent | 22345-3 = 0.22345e-3 |
| 63 | Ephemeris type (0 for distributed data) | 0 |
| 65–68 | Element set number | 999 |
| 69 | Checksum | 9 |

**Line 2**

| Columns | Content | In the example |
| --- | --- | --- |
| 1 | Line number | 2 |
| 3–7 | Catalogue number | 25544 |
| 9–16 | Inclination, degrees | 51.6400 |
| 18–25 | Right ascension of the ascending node, degrees | 123.4567 |
| 27–33 | Eccentricity, implied leading decimal point | 0006000 = 0.0006000 |
| 35–42 | Argument of perigee, degrees | 45.6789 |
| 44–51 | Mean anomaly, degrees | 314.3211 |
| 53–63 | Mean motion, revolutions per day | 15.49000000 |
| 64–68 | Revolution number at epoch | 12345 |
| 69 | Checksum | 0 |

Line 2 is the one that holds the orbit. Its six numbers are the six elements you know, except that size is given as **mean motion** $n$ — revolutions per day — instead of $a$.

### Three conventions that trip people up

**The year has two digits.** $57$–$99$ mean $1957$–$1999$, and $00$–$56$ mean $2000$–$2056$. (The first satellite flew in 1957, so no TLE is older.)

**Some numbers hide their decimal point and exponent.** A field like `22345-3` means $0.22345 \times 10^{-3}$. Read it as: put a decimal point in front, and treat the last signed digit as a power of ten. A minus sign may also appear at the very front, for a negative number.

**The first-derivative field is $\dot{n}/2$**, half the rate of change of mean motion, not $\dot{n}$ itself. ($\dot{n}$ is read "n dot".) It is a leftover from the field's use as a coefficient in a Taylor series, where the $\tfrac{1}{2}$ appears naturally.

### The checksum

The last character of each line is a **[[checksum|checksum]]**, a one-digit guard against typing and transmission errors. The rule: add up every digit in columns 1–68, count each minus sign as $1$, ignore everything else (letters, spaces, dots, plus signs), and keep only the last digit of the total — the remainder after dividing by $10$.

For line 1 above the digits add up to $139$, so the checksum is $9$. For line 2 they add up to $160$, so it is $0$. Check it on every set you read. Damaged TLEs turn up in downloaded catalogues often enough that the two lines of code are worth it.

::: example Decoding the example set
**Epoch.** Year $26 \to 2026$. Day $265.5$. January through August hold $31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 = 243$ days in a non-leap year, so day $265$ is day $265 - 243 = 22$ of September: September 22. The $0.5$ is half a day: 12:00:00 UTC. The Julian date is $2\,461\,306.0$.

**Mean motion and period.** Convert revolutions per day to radians per second:

$$
n = 15.49 \times \frac{2\pi}{86\,400} = 1.12646 \times 10^{-3}\,\mathrm{rad/s}.
$$

The period is $1440/15.49 = 92.96\,\mathrm{min}$ (a day has $1440$ minutes).

**Size.** Kepler's third law, $n^2 a^3 = \mu$, solved for $a$:

$$
a = \left(\frac{\mu}{n^2}\right)^{1/3} = \left(\frac{398\,600.4418}{1.26892 \times 10^{-6}}\right)^{1/3} = 6797.8\,\mathrm{km},
$$

an altitude of about $420\,\mathrm{km}$. With $e = 0.0006$: perigee altitude $6797.79 \times 0.9994 - 6378.137 = 415.6\,\mathrm{km}$, apogee altitude $6797.79 \times 1.0006 - 6378.137 = 423.7\,\mathrm{km}$.

**Drag.** The field says $\dot{n}/2 = 1.2345 \times 10^{-4}\,\mathrm{rev/day^2}$, so $\dot{n} = 2.469 \times 10^{-4}\,\mathrm{rev/day^2}$. To turn that into a height change, differentiate $n^2 a^3 = \mu$: $2n\dot{n}a^3 + 3n^2a^2\dot{a} = 0$, so $\dot{a}/a = -\tfrac{2}{3}\dot{n}/n$ and

$$
\dot{a} = -\frac{2}{3}\,\frac{a}{n}\,\dot{n} = -\frac{2}{3} \times \frac{6797.8}{15.49} \times 2.469 \times 10^{-4} = -0.072\,\mathrm{km/day} .
$$

The station sinks about $72\,\mathrm{m}$ per day. That matches the tens-of-metres-per-day decay that makes the ISS need regular reboosts. The minus sign makes sense too: mean motion going *up* means the orbit is getting *smaller*.

**The $B^{*}$ term.** $B^{*} = 2.2345 \times 10^{-4}$ per Earth radius is the **[[drag coefficient SGP4 uses|bstar]]** to reproduce that decay. It is a fitted number belonging to the theory, not a physical ballistic coefficient, and it is re-fitted with every new element set.

**Where on the orbit.** $M = 314.3211^\circ$. Solving Kepler's equation with $e = 0.0006$ gives $E = 314.2965^\circ$, then $\nu = 314.2719^\circ$. The argument of latitude is

$$
u = \omega + \nu = 45.6789^\circ + 314.2719^\circ = 359.95^\circ .
$$

So at the epoch the station is a twentieth of a degree short of its ascending node. Its latitude is essentially zero, and it is about to cross the equator heading north.
:::

## Mean elements, and why they are not the elements of this module

### A bumpy road and a smooth one

Picture a car on a bumpy road, seen from a helicopter. The car bobs up and down over every bump, but its overall route is smooth. If you wanted to describe the route, you would draw the smooth average line, not every bob.

An orbit around a real, slightly squashed Earth is the bumpy road. With $J_2$ included, the classical elements are no longer constant. On top of the steady drifts of $\Omega$ and $\omega$ from the previous lesson, every element wobbles once per orbit (**short-period** terms), and some also wobble with the slow turning of the perigee (**long-period** terms).

- The **[[osculating|osculating]]** elements are the instantaneous ones: convert the true state vector at one instant, and these are what you get. They bob with every bump — by up to about $10\,\mathrm{km}$ in $a$ for a low orbit.
- **Mean** elements have those wobbles taken out mathematically. They describe the smooth average orbit. The perturbation theory then adds the wobbles back when it computes a position.

### Which mean elements

TLEs carry mean elements in the **[[Brouwer–Lyddane|brouwer-kozai]]** sense, with SGP4's own conventions. One of those conventions is that the mean motion printed in the set is the **Kozai** mean motion, which SGP4 converts to a **Brouwer** mean motion as its very first step. The conversion is worth seeing, because it shows how far the printed $a$ is from the two-body value.

SGP4 uses the older **[[WGS-72|wgs72]]** constants, and works in Earth radii (ER) and minutes:

- $k_e = 0.074\,366\,916\,1\,\mathrm{ER^{3/2}/min}$, which is $\sqrt{\mu}$ in those units;
- $k_2 = \tfrac{1}{2}J_2 = 5.413\,08 \times 10^{-4}\,\mathrm{ER^2}$;
- $R = 6378.135\,\mathrm{km}$ per Earth radius.

With the TLE's $n_0$ in radians per minute, $i_0$ its inclination and $e_0$ its eccentricity, compute in order:

$$
a_1 = \left(\frac{k_e}{n_0}\right)^{2/3}, \qquad
\delta_1 = \frac{3}{2}\,\frac{k_2}{a_1^2}\,\frac{3\cos^2 i_0 - 1}{(1 - e_0^2)^{3/2}}, \qquad
a_0 = a_1\left(1 - \tfrac{1}{3}\delta_1 - \delta_1^2 - \tfrac{134}{81}\delta_1^3\right).
$$

$a_1$ is plain Kepler's third law. $\delta_1$ ("delta one") is a small correction for the bulge. Then $\delta_0$ is computed by the same formula with $a_0$ in place of $a_1$, and the Brouwer mean motion and semi-major axis are

$$
n_0'' = \frac{n_0}{1 + \delta_0}, \qquad a_0'' = \frac{a_0}{1 - \delta_0} .
$$

(The double prime, read "n double-prime", is the traditional mark for a Brouwer mean element.)

::: example Kozai to Brouwer for the example set
**Step 1: mean motion per minute.** $n_0 = 15.49 \times 2\pi/1440 = 0.067588\,\mathrm{rad/min}$.

**Step 2: the two-body size.** $a_1 = (0.074\,366\,916\,1/0.067588)^{2/3} = 1.065796\,\mathrm{ER}$. Times $6378.135$, that is $6797.79\,\mathrm{km}$ — the same value Kepler's third law gave in the last example, as it should be.

**Step 3: the inclination factor.** $\cos 51.64^\circ = 0.62055$, so $3\cos^2 i_0 - 1 = 3 \times 0.38508 - 1 = 0.15543$.

**Step 4: the first correction.** $(1 - e_0^2)^{3/2}$ is $1$ to seven digits for $e_0 = 0.0006$, so

$$
\delta_1 = 1.5 \times \frac{5.41308 \times 10^{-4}}{1.065796^2} \times 0.15543 = 1.1111 \times 10^{-4}.
$$

**Step 5: correct the size.** $\tfrac{1}{3}\delta_1 = 3.704 \times 10^{-5}$ and $\delta_1^2 = 1.2 \times 10^{-8}$; the cube term is far smaller still. So $a_0 = 1.065796 \times (1 - 3.704 \times 10^{-5} - 1.2 \times 10^{-8}) = 1.065756\,\mathrm{ER}$, which is $6797.54\,\mathrm{km}$.

**Step 6: recompute and finish.** With $a_0$ in place of $a_1$, $\delta_0 = 1.1111 \times 10^{-4}$ again to this precision. Then

$$
n_0'' = \frac{15.49}{1.00011111} = 15.4883\,\mathrm{rev/day}, \qquad a_0'' = \frac{6797.54}{0.99988889} = 6798.29\,\mathrm{km}.
$$

**What it means.** The Brouwer semi-major axis is $0.50\,\mathrm{km}$ larger than the two-body reading of the mean motion. Half a kilometre is not much. But it is a built-in offset before any propagation has happened, and the short-period terms SGP4 then adds shift the position by several more kilometres around each orbit. That is the size of error you make by treating the printed elements as osculating.
:::

## SGP4 and SDP4

**SGP4** — Simplified General Perturbations 4 — is the analytical theory the mean elements belong to. "Analytical" means it uses formulas, not step-by-step integration, to jump straight to any time. It includes:

- the steady and wobbling effects of $J_2$, $J_3$ and $J_4$;
- air drag, through $B^{*}$ and a simple power-law model of air density;
- for objects with periods of $225\,\mathrm{min}$ or longer, a deep-space extension, **SDP4**, which adds the pulls of the Moon and Sun and the **[[resonance|resonance]]** terms that matter for 12-hour and 24-hour orbits.

It is fast — microseconds per position. For low orbits it is accurate to about a kilometre at the epoch, and the error grows by one to a few kilometres per day. That is why the catalogue refreshes TLEs of active satellites about daily.

Its output is a position and velocity in the **[[TEME|teme]]** frame — true equator, mean equinox of date. TEME is an inertial frame, but it differs from J2000 by the slow wobble of Earth's axis since 2000, about a third of a degree by 2026. For a ground track that difference is invisible. For a collision check it is not, and TEME must be rotated into the frame of the other object.

Do not write your own SGP4. The theory is defined by a reference implementation — Vallado's, published in several languages and wrapped for Python as the `sgp4` package. "SGP4-compatible" means agreeing with it to the metre, quirks and WGS-72 constants included. The mean elements were fitted by an orbit-determination process that used exactly that code. Any other propagator, however better its physics, is inconsistent with the data.

::: key TLEs and SGP4
A TLE holds two lines of *mean* elements in the Brouwer–Lyddane sense used by SGP4, plus the drag term $B^{*}$. They must be propagated with SGP4/SDP4. Feeding them to a **[[Cowell integrator|cowell]]** mixes theories and produces kilometre-level errors immediately.
:::

::: warning Kilometres wrong at the epoch
The most common misuse of a TLE is to convert its six numbers with the two-body element-to-state routine, then integrate the result numerically with a $J_2$ or high-fidelity force model. The mean elements leave out the short-period $J_2$ wobbles, so the state you build is kilometres from where the satellite is *at the epoch itself*, before you have propagated at all. The integrator then faithfully propagates the wrong orbit.

And $B^{*}$ is a fit parameter of SGP4's density model, not a $C_D A/m$ you can put into a drag force. If you need a state vector for a high-fidelity integrator, run SGP4 to the epoch and take its output. Accept SGP4's kilometre-level accuracy as your starting uncertainty.
:::

## Reproducing a ground track from a TLE

Every piece of this pipeline has already been built in this module:

1. Read the two lines and check both checksums.
2. Turn the epoch into a Julian date.
3. At each time step, call SGP4 to get $\mathbf{r}$ in TEME, in kilometres.
4. Compute the Greenwich sidereal time at that instant. TEME uses the true equator of date, so a rotation about $z$ by the sidereal time brings it into Earth-fixed coordinates to well within a kilometre. (The remaining correction, for the wander of the pole, is far below a kilometre and irrelevant for a plot.)
5. Form longitude and latitude with the sub-point formulas of the previous lesson.

```python
import numpy as np
from sgp4.api import Satrec, jday

def gmst_deg(jd):                                  # from the ground-track lesson
    T = (jd - 2451545.0) / 36525.0
    s = 67310.54841 + (876600 * 3600 + 8640184.812866) * T + 0.093104 * T**2 - 6.2e-6 * T**3
    return (s % 86400.0) / 240.0

line1 = "1 25544U 98067A   26265.50000000  .00012345  00000+0  22345-3 0  9999"
line2 = "2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.49000000123450"

def checksum_ok(line):
    total = sum(int(c) if c.isdigit() else 1 if c == "-" else 0 for c in line[:68])
    return total % 10 == int(line[68])

assert checksum_ok(line1) and checksum_ok(line2)
sat = Satrec.twoline2rv(line1, line2)

jd0, fr0 = jday(2026, 9, 22, 12, 0, 0.0)          # epoch of the set
lons, lats = [], []
for k in range(0, 1440):                           # one day at one-minute steps
    fr = fr0 + k / 1440.0
    err, r, v = sat.sgp4(jd0, fr)                  # r in km, TEME frame
    assert err == 0
    theta = gmst_deg(jd0 + fr)
    lon = (np.degrees(np.arctan2(r[1], r[0])) - theta + 540.0) % 360.0 - 180.0
    lat = np.degrees(np.arcsin(r[2] / np.linalg.norm(r)))
    lons.append(lon); lats.append(lat)

print(round(lons[0], 2), round(lats[0], 2), round(max(lats), 2))   # -58.0 -0.12 51.62
```

Note that `jday` returns the Julian date in two parts, a whole-ish day `jd0` and a fraction `fr0`. Keeping them apart saves digits, for the same reason the time-of-flight lesson kept the elapsed time separate.

### What you should see

Plot `lons` against `lats` on a world map, breaking the line where longitude jumps across $\pm 180^\circ$. For this set:

- about fifteen and a half wavy passes in the day;
- each one staying between latitudes $\pm 51.6^\circ$;
- each one $23.6^\circ$ west of the one before;
- the first pass starting at the ascending node near longitude $-58^\circ$.

The two-body sub-point of the epoch elements, worked out as in the last lesson, is $57.9^\circ\,\mathrm{W}$, $0.04^\circ\,\mathrm{S}$. SGP4's first point is about ten kilometres away from it, because of the short-period terms the mean elements leave out.

### Reading the bugs from the picture

- **Right shape, but shifted sideways by the same amount everywhere?** Your sidereal time is wrong. The classic causes are using the solar day, or a Julian date that is off by a fraction of a day.
- **The latitude band is wrong?** You misread the inclination field.
- **Each pass $23.3^\circ$ west instead of $23.6^\circ$?** You propagated with pure two-body motion and lost the node drift. SGP4 includes it.

::: example Checking the checksum by hand
Take columns 1–68 of line 2 — everything except the final checksum digit:

`2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.4900000012345`

Add the digits field by field:

- line number: $2$;
- `25544`: $2 + 5 + 5 + 4 + 4 = 20$;
- `51.6400`: $5 + 1 + 6 + 4 + 0 + 0 = 16$;
- `123.4567`: $1 + 2 + 3 + 4 + 5 + 6 + 7 = 28$;
- `0006000`: $6$;
- `45.6789`: $4 + 5 + 6 + 7 + 8 + 9 = 39$;
- `314.3211`: $3 + 1 + 4 + 3 + 2 + 1 + 1 = 15$;
- `15.49000000`: $1 + 5 + 4 + 9 = 19$;
- `12345`: $1 + 2 + 3 + 4 + 5 = 15$.

Total: $2 + 20 + 16 + 28 + 6 + 39 + 15 + 19 + 15 = 160$. The last digit of $160$ is $0$, which matches the final character.

This line has no minus signs. On line 1, the `-3` exponent of $B^{*}$ adds $1$ for the minus and $3$ for the digit.
:::

::: warning Fields that are not what they look like
The eccentricity `0006000` is $0.0006$, not $6000$. The drag term `22345-3` is $0.22345 \times 10^{-3}$, not $22\,345$. The first-derivative field is half of $\dot{n}$. The mean motion is in revolutions per day, and the angles are in degrees. The epoch's day of year starts at $1$, not $0$: day $1.0$ is January 1 at 00:00. Every one of these has produced a wrong ground track in someone's first parser.
:::

::: warning A TLE ages
The elements describe the orbit at the epoch, and SGP4's drag model guesses forward from there. For the ISS — whose altitude is actively maintained, and whose drag changes with solar activity — a set more than a few days old can be tens of kilometres off along the track. A reboost since the epoch makes it useless. Always check the epoch against the time you are propagating to, and use the newest set available.
:::

## Check yourself

::: check
A TLE's line 1 has the epoch field `24366.25000000`. What instant is that?
:::

::: answer
**Year.** $24 \to 2024$. That is a leap year, with $366$ days, so day $366$ is December 31.

**Time of day.** The fraction $0.25$ of a day is $0.25 \times 24 = 6$ hours.

So the epoch is 2024 December 31, 06:00:00 UTC. (In a non-leap year, `366` would be impossible — days run from $1$ to $365$ — which makes a handy sanity check inside a parser.)
:::

::: check
A TLE gives a mean motion of $2.00560000\,\mathrm{rev/day}$. What kind of orbit is this, and which version of the propagator applies?
:::

::: answer
**Period.** $1440/2.0056 = 718.0\,\mathrm{min}$, about $11\,\mathrm{h}\,58\,\mathrm{min}$ — half a sidereal day.

**Size.** Convert $n$ to radians per second and use $a = (\mu/n^2)^{1/3}$: $a = 26\,560\,\mathrm{km}$. This is a GPS-type MEO orbit.

**Propagator.** The period is well above $225\,\mathrm{min}$, so the deep-space version, SDP4, applies. It includes the pulls of the Moon and Sun and the 12-hour resonance terms. Plain near-Earth SGP4 would be wrong by many kilometres.
:::

::: check
In two sentences, explain why mean elements from a TLE should not be converted to a state vector and integrated numerically.
:::

::: answer
The mean elements have the periodic wobbles averaged out, so turning them into a state with two-body formulas gives a position kilometres from the satellite's true one even at the epoch, before any propagation. A numerical integrator then carries that wrong starting state forward with a different force model from the one the elements were fitted to, so the two theories are mixed and their errors add up instead of cancelling.
:::

::: check
Two TLEs of the same satellite, one day apart, show $\dot{n}/2$ rising from $0.00012$ to $0.00030\,\mathrm{rev/day^2}$. What has physically changed, and what would you expect $B^{*}$ to do?
:::

::: answer
**What changed.** $0.00030/0.00012 = 2.5$, so the orbit is decaying two and a half times faster. The air at the satellite's height has become denser — usually because of a geomagnetic storm or a rise in solar activity heating and puffing up the upper atmosphere — or the satellite has turned and now shows more area to the flow.

**What $B^{*}$ does.** SGP4 reproduces the observed decay through $B^{*}$ and a fixed density model. The model's density cannot change, so the fitted $B^{*}$ rises in roughly the same proportion — it soaks up the density change because the model has nowhere else to put it. That is why $B^{*}$ must not be read as a physical ballistic coefficient.
:::

::: check
Your reproduced ISS ground track has the right shape and the right latitude band, but every day each pass lands $0.99^\circ$ further west than the reference. What is the bug?
:::

::: answer
Your sidereal time is using the solar day: $360^\circ$ per $86\,400\,\mathrm{s}$ instead of per $86\,164.09\,\mathrm{s}$ (or an $\omega_E$ of $2\pi/86\,400$).

The difference is $360 \times 86\,400/86\,164.09 - 360 = 0.9856^\circ$ per day, growing steadily — exactly the drift you see. Use the sidereal rate, or the GMST formula, which has the correct rate built in.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| TLE | Two 69-character lines of mean elements; fixed columns; checksum = digit sum (minus counts 1) mod 10 |
| Epoch `YYDDD.DDDDDDDD` | Two-digit year (57–99 → 19xx, 00–56 → 20xx), day of year from 1, fractional day |
| `.00012345` | $\dot{n}/2$ in rev/day²; $\dot{a} = -\tfrac{2}{3}(a/n)\dot{n}$ |
| `22345-3` | $B^{*} = 0.22345 \times 10^{-3}\,\mathrm{ER^{-1}}$, SGP4's fitted drag term |
| `0006000` | $e = 0.0006$, implied leading decimal |
| $n$ in rev/day | $a = (\mu/n^2)^{1/3}$ gives the two-body (Kozai) semi-major axis; Brouwer $a_0''$ differs by $\sim 0.5\,\mathrm{km}$ |
| Mean elements | Brouwer–Lyddane averaged elements; osculating elements wobble by up to $\sim 10\,\mathrm{km}$ in $a$ |
| SGP4 / SDP4 | The only correct propagator for TLEs; SDP4 for periods $\ge 225\,\mathrm{min}$; output in TEME, km and km/s |
| Accuracy | About $1\,\mathrm{km}$ at epoch, growing $1$–$3\,\mathrm{km/day}$ in LEO |
| Ground track from a TLE | Parse, SGP4 to TEME, GMST rotation, $\lambda = \operatorname{atan2}(y, x) - \theta_g$, $\phi = \arcsin(z/r)$ |

This closes the module. You can now derive two-body motion from Newton's law, read an orbit's shape from its constants of motion, convert between state vectors and elements without singularities, solve Kepler's equation for any eccentricity, propagate on every conic and check it numerically, and turn a published element set into a track on a map. The manoeuvres module builds directly on vis-viva and the orbit equation to change one orbit into another.

::: context punched-cards Where the fixed columns come from
Early computers read data from stiff paper cards with holes punched in them, one character per column — usually $80$ columns to a card. A program found each number by its column position, so every field had a fixed place and no room was wasted on decimal points or the letter E.

Here is where line 2's fields sit across its $69$ columns:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="340" height="26" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="40" width="4.9" height="26" fill="#6c7a93"/>
  <rect x="19.9" y="40" width="24.6" height="26" fill="#8fb8f0"/>
  <rect x="49.4" y="40" width="39.4" height="26" fill="#f2b880"/>
  <rect x="93.8" y="40" width="39.4" height="26" fill="#8fb8f0"/>
  <rect x="138.1" y="40" width="34.5" height="26" fill="#f2b880"/>
  <rect x="177.5" y="40" width="39.4" height="26" fill="#8fb8f0"/>
  <rect x="221.9" y="40" width="39.4" height="26" fill="#f2b880"/>
  <rect x="266.2" y="40" width="54.2" height="26" fill="#8fb8f0"/>
  <rect x="320.4" y="40" width="24.6" height="26" fill="#f2b880"/>
  <rect x="345.1" y="40" width="4.9" height="26" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="69.1" y="58">i</text><text x="113.5" y="58">Ω</text><text x="155.4" y="58">e</text>
    <text x="197.2" y="58">ω</text><text x="241.6" y="58">M</text><text x="293.3" y="58">n</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="32.2" y="30">cat no.</text><text x="332.8" y="30">rev</text>
    <text x="12.5" y="84">1</text><text x="347.5" y="84">69</text>
    <text x="180" y="100">columns 1 to 69; the red box is the checksum</text>
  </g>
</svg>
```
:::

::: context catalog-number Satellite number 25544
Every tracked object gets a number when it is first catalogued, in order. Number $1$ is the rocket body that carried Sputnik 1 in 1957, and Sputnik 1 itself is number $2$. The ISS's first module, Zarya, launched in 1998 and became $25544$; the whole station still carries that number.

The numbers are assigned by the US military's space-tracking network, which publishes the TLEs on its Space-Track website. CelesTrak, run for decades by T. S. Kelso, repackages them for everyone else.
:::

::: context checksum Why adding digits catches mistakes
Change any single digit in a line and the digit sum changes by somewhere between $1$ and $9$. Its last digit then changes too, so the checksum no longer matches. That catches every single-digit error.

It is not perfect. Swap two neighbouring digits — `45` for `54` — and the sum stays the same, so the error slips through. It is a cheap first guard, not proof that the data are right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44">
    <rect x="20" y="12" width="22" height="24" fill="#fff" stroke="#1f2a44"/><rect x="42" y="12" width="22" height="24" fill="#fff" stroke="#1f2a44"/>
    <text x="31" y="29" text-anchor="middle">4</text><text x="53" y="29" text-anchor="middle">5</text>
    <text x="80" y="29">4 + 5 = 9</text><text x="185" y="29">the original</text>
    <rect x="20" y="48" width="22" height="24" fill="#fff" stroke="#1f2a44"/><rect x="42" y="48" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/>
    <text x="31" y="65" text-anchor="middle">4</text><text x="53" y="65" text-anchor="middle">6</text>
    <text x="80" y="65">4 + 6 = 10</text><text x="185" y="65" fill="#1d6fd1">one digit wrong: caught</text>
    <rect x="20" y="84" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/><rect x="42" y="84" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/>
    <text x="31" y="101" text-anchor="middle">5</text><text x="53" y="101" text-anchor="middle">4</text>
    <text x="80" y="101">5 + 4 = 9</text><text x="185" y="101" fill="#b4232c">swapped: missed</text>
  </g>
</svg>
```
:::

::: context bstar What B-star is supposed to be
On paper, $B^{*}$ is built from a **ballistic coefficient** — how much drag a satellite feels for its mass, set by its drag coefficient $C_D$, area $A$ and mass $m$ — multiplied by a reference air density. That combination is why its unit is the odd "per Earth radius".

In practice the orbit-fitting process adjusts $B^{*}$ until SGP4's predicted decay matches what the radars see. It can even come out negative for objects pushed by sunlight or by their own thrusters.
:::

::: context osculating The orbit that kisses the path
**Osculate** comes from the Latin for "to kiss". The osculating orbit is the perfect two-body orbit that touches the real path at one instant, with the same position and the same velocity — and then goes its own way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20,100.0 25,105.4 30,109.9 35,112.9 40,114.0 45,112.9 50,109.9 55,105.4 60,100.0 65,94.6 70,90.1 75,87.1 80,86.0 85,87.1 90,90.1 95,94.6 100,100.0 105,105.4 110,109.9 115,112.9 120,114.0 125,112.9 130,109.9 135,105.4 140,100.0 145,94.6 150,90.1 155,87.1 160,86.0 165,87.1 170,90.1 175,94.6 180,100.0 185,105.4 190,109.9 195,112.9 200,114.0 205,112.9 210,109.9 215,105.4 220,100.0 225,94.6 230,90.1 235,87.1 240,86.0 245,87.1 250,90.1 255,94.6 260,100.0 265,105.4 270,109.9 275,112.9 280,114.0 285,112.9 290,109.9 295,105.4 300,100.0 305,94.6 310,90.1 315,87.1 320,86.0 325,87.1 330,90.1 335,94.6 340,100.0"/>
  <line x1="110" y1="121.2" x2="190" y2="59" stroke="#b4232c" stroke-width="2"/>
  <circle cx="150" cy="90.1" r="3.5" fill="#1f2a44"/>
  <text x="196" y="52" font-size="11" fill="#b4232c">osculating orbit:</text>
  <text x="196" y="66" font-size="11" fill="#b4232c">fits only here</text>
  <text x="20" y="140" font-size="11" fill="#1d6fd1">true path (wobbles)</text>
  <text x="340" y="140" font-size="11" text-anchor="end" fill="#6c7a93">mean path (smooth)</text>
</svg>
```

The wobbles here are hugely exaggerated. Around a real low orbit they are kilometres on a path about $43\,000\,\mathrm{km}$ long.
:::

::: context brouwer-kozai Two theories from 1959
In 1959, two years after Sputnik, Dirk Brouwer in the United States and Yoshihide Kozai in Japan each published a theory of how Earth's bulge changes a satellite's orbit. They defined their "mean" elements slightly differently, which is why the TLE's Kozai mean motion must be converted before Brouwer-style formulas can use it.

Brouwer's theory broke down for nearly circular or nearly equatorial orbits. R. H. Lyddane fixed that in 1963 by rewriting it in better-behaved variables — the same idea behind the equinoctial elements earlier in this module.
:::

::: context wgs72 Why an old Earth model
WGS-72 and WGS-84 are two versions of the World Geodetic System, a standard set of numbers for Earth's size, shape and gravity. The newer one is better. But the TLEs were fitted using SGP4 with the 1972 numbers, so the elements quietly carry those numbers inside them. Propagate with different constants and you get small but real errors — so SGP4 keeps the old ones on purpose.
:::

::: context resonance Pushing a swing in time
Earth's gravity has lumps: mass is not spread evenly around the equator. A satellite whose period is a simple fraction of a day — 12 hours, 24 hours — passes over the same lumps at the same point in its orbit, again and again. Each small tug lands in step with the last, like pushing a swing at the top of every swing. The effects build up instead of averaging out. SDP4 includes those resonance terms; near-Earth SGP4 does not.
:::

::: context teme A frame halfway between two
Earth's axis wobbles, so "the equator" and "the equinox" move slowly. **True** means "where it really is on that date, wobbles included". **Mean** means "with the short wobbles averaged out". TEME uses the true equator but the mean equinox — an unusual mix that almost nothing except SGP4 uses.

It stays because the theory is defined by its code. Libraries such as the Python `astropy` package convert TEME to other frames for you.
:::

::: context cowell Integrating the force directly
**Cowell's method** means writing down every force on the satellite and integrating Newton's second law step by step — exactly what you did with the two-body equation earlier in this module, with more forces added. It is named after Philip Cowell, who used it with Andrew Crommelin to predict the 1910 return of Halley's comet.

It is the most accurate way to propagate, given a good starting state. The trouble with TLEs is the starting state, not the method.
:::
