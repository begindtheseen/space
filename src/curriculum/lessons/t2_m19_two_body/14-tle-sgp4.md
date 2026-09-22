---
id: l14-tle-sgp4
title: The TLE format and SGP4
minutes: 19
covers:
  - TLE format and SGP4
---

Every object tracked in Earth orbit – some thirty thousand of them – has its orbit published in the same 138 characters: two lines of fixed-column text called a two-line element set, or TLE. The format dates from punched cards and shows it, with implied decimal points and exponents written without the letter E. It is also the only freely available orbit data for most satellites, so every conjunction screen, pass predictor and ground-track plot starts by parsing one.

The trap is that a TLE does not contain the classical elements of this module. It contains *mean* elements, in the specific sense of a particular analytical perturbation theory, and they are only meaningful when fed to that theory's propagator, SGP4. Read them as osculating elements and convert to a state vector with the routines of the conversions lesson and you will be a few kilometres off at the epoch and drifting from there. This lesson teaches the format field by field, decodes a set into physical quantities, explains what "mean" means here and why it matters, and then assembles the pipeline that reproduces a satellite's ground track from its TLE – the module's final objective.

## The format

Here is a TLE in the format used for the International Space Station, with representative values for an epoch of 2026 September 22, 12:00 UTC:

```text
1 25544U 98067A   26265.50000000  .00012345  00000+0  22345-3 0  9999
2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.49000000123450
```

Each line is exactly 69 characters, and every field lives in fixed columns (numbered from 1).

**Line 1**

| Columns | Content | In the example |
| --- | --- | --- |
| 1 | Line number | 1 |
| 3–7 | Satellite catalogue number | 25544 |
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

Three conventions need care. The two-digit epoch year maps $57$–$99$ to $1957$–$1999$ and $00$–$56$ to $2000$–$2056$. Fields with "implied decimal and exponent" such as `22345-3` mean $0.22345 \times 10^{-3}$ – the leading decimal point is assumed and the trailing signed digit is a power of ten; a leading minus sign may appear. And the first-derivative field is $\dot{n}/2$, not $\dot{n}$, a relic of its use as a coefficient in a Taylor series.

The checksum is the sum of all digits in columns 1–68, counting each minus sign as 1 and ignoring everything else, modulo 10. For line 1 above the digits sum to $139$, so the checksum is $9$; for line 2 they sum to $160$, checksum $0$. Verify it on every set you parse; corrupted TLEs are common enough in downloaded catalogues that the check is worth its two lines of code.

::: example Decoding the example set
Epoch: year $26 \to 2026$, day $265.5$. Day $265$ of a non-leap year is September 22 (January through August contribute $31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 = 243$ days, so day $265$ is September 22), and $0.5$ day is 12:00:00 UTC. The Julian date is $2\,461\,306.0$.

Mean motion: $n = 15.49\,\mathrm{rev/day} = 15.49 \times 2\pi/86\,400 = 1.12646 \times 10^{-3}\,\mathrm{rad/s}$, period $1440/15.49 = 92.96\,\mathrm{min}$. Kepler's third law gives the corresponding semi-major axis,
$$
a = \left(\frac{\mu}{n^2}\right)^{1/3} = \left(\frac{398\,600.4418}{1.26892 \times 10^{-6}}\right)^{1/3} = 6797.8\,\mathrm{km},
$$
altitude about $420\,\mathrm{km}$. With $e = 0.0006$: perigee altitude $6797.8 \times 0.9994 - 6378.1 = 415.6\,\mathrm{km}$, apogee $423.7\,\mathrm{km}$.

Drag: $\dot{n}/2 = 1.2345 \times 10^{-4}\,\mathrm{rev/day^2}$, so $\dot{n} = 2.469 \times 10^{-4}\,\mathrm{rev/day^2}$. Differentiating $n^2 a^3 = \mu$, $\dot{a}/a = -\tfrac{2}{3}\dot{n}/n$, so
$$
\dot{a} = -\frac{2}{3}\,\frac{a}{n}\,\dot{n} = -\frac{2}{3}\,\frac{6797.8}{15.49}\,2.469 \times 10^{-4} = -0.072\,\mathrm{km/day} :
$$
the station is descending about $72\,\mathrm{m}$ per day, in line with the tens-of-metres-per-day decay that motivates its periodic reboosts. $B^{*} = 2.2345 \times 10^{-4}$ per Earth radius is the drag-model coefficient SGP4 uses to reproduce that decay; it is a fitted parameter of the theory, not a physical ballistic coefficient, and it is adjusted with every new element set.

Position on the orbit: $M = 314.3211^\circ$; solving Kepler's equation with $e = 0.0006$ gives $E = 314.2965^\circ$ and $\nu = 314.2719^\circ$. The argument of latitude is $u = \omega + \nu = 45.6789^\circ + 314.2719^\circ = 359.95^\circ$: at the epoch the station is a fraction of a degree short of its ascending node, so its latitude is essentially zero and it is about to cross the equator northbound.
:::

## Mean elements, and why they are not the elements of this module

The classical elements of an orbit perturbed by $J_2$ are not constant. On top of the secular drifts of $\Omega$ and $\omega$ quoted in the previous lesson, every element oscillates with the orbital period (short-period terms) and, for some, with the period of the perigee's rotation (long-period terms). The instantaneous – *osculating* – elements are those you get by converting the true state vector at one instant; they wobble by up to about $10\,\mathrm{km}$ in $a$ around a low orbit. A *mean* element set has those oscillations removed analytically: it describes the average orbit, and the perturbation theory adds the oscillations back when it computes a position.

TLEs carry mean elements in the Brouwer–Lyddane sense, with the specific conventions of SGP4 – including that the mean motion in the set is the *Kozai* mean motion, which SGP4 converts to the Brouwer mean motion as its first step. That conversion is worth seeing, because it shows how far from osculating the printed $a$ is. With the WGS-72 constants SGP4 uses ($k_e = 0.074\,366\,916\,1\,\mathrm{ER^{3/2}/min}$, $k_2 = \tfrac{1}{2}J_2 = 5.413\,08 \times 10^{-4}\,\mathrm{ER^2}$, $R = 6378.135\,\mathrm{km}$) and the TLE's $n_0$ in radians per minute,

$$
a_1 = \left(\frac{k_e}{n_0}\right)^{2/3}, \qquad
\delta_1 = \frac{3}{2}\,\frac{k_2}{a_1^2}\,\frac{3\cos^2 i_0 - 1}{(1 - e_0^2)^{3/2}}, \qquad
a_0 = a_1\left(1 - \tfrac{1}{3}\delta_1 - \delta_1^2 - \tfrac{134}{81}\delta_1^3\right),
$$

then $\delta_0$ is recomputed with $a_0$ in place of $a_1$, and the Brouwer mean motion and semi-major axis are

$$
n_0'' = \frac{n_0}{1 + \delta_0}, \qquad a_0'' = \frac{a_0}{1 - \delta_0} .
$$

::: example Kozai to Brouwer for the example set
$n_0 = 15.49 \times 2\pi/1440 = 0.067588\,\mathrm{rad/min}$, so $a_1 = (0.074\,366\,916\,1/0.067588)^{2/3} = 1.065796\,\mathrm{ER} = 6797.79\,\mathrm{km}$ – the two-body value from Kepler's third law. With $i_0 = 51.64^\circ$, $3\cos^2 i_0 - 1 = 0.15543$, and $\delta_1 = 1.5 \times 5.41308 \times 10^{-4} \times 0.15543/1.065796^2 = 1.1111 \times 10^{-4}$. Then $a_0 = 1.065796\,(1 - 3.704 \times 10^{-5} - 1.2 \times 10^{-8}) = 1.065756\,\mathrm{ER}$, $\delta_0 = 1.1111 \times 10^{-4}$ again to this precision, and
$$
n_0'' = \frac{15.49}{1.00011111} = 15.4883\,\mathrm{rev/day}, \qquad a_0'' = \frac{6797.54}{0.99988889} = 6798.29\,\mathrm{km}.
$$
The Brouwer semi-major axis is $0.50\,\mathrm{km}$ larger than the value a two-body reading of the mean motion gives. Half a kilometre is not much – but it is a systematic offset before any propagation has happened, and the short-period terms SGP4 then adds move the position by several more kilometres around each orbit. That is the scale of error you commit by treating the printed elements as osculating.
:::

## SGP4 and SDP4

SGP4 (Simplified General Perturbations 4) is the analytical theory the mean elements belong to. It includes the secular and periodic effects of $J_2$, $J_3$ and $J_4$; atmospheric drag through $B^{*}$ and a power-law density profile; and, for objects with periods of $225\,\mathrm{min}$ or longer, the deep-space extension SDP4 adds lunar and solar gravitational perturbations and the resonance terms that matter for 12-hour and 24-hour orbits. It is fast – microseconds per evaluation – and accurate to about a kilometre at the epoch for low orbits, degrading by one to a few kilometres per day, which is why catalogue TLEs are refreshed daily for active satellites. Its output is a position and velocity in the TEME frame – true equator, mean equinox of date – an inertial frame that differs from J2000 by the precession and nutation accumulated since 2000, about a third of a degree by 2026. For a ground track the distinction between TEME and J2000 is invisible; for a conjunction assessment it is not, and TEME must be rotated to the frame of the other object.

Do not write your own SGP4. The theory is defined by a reference implementation (Vallado's, distributed in several languages, and wrapped for Python as the `sgp4` package), and "SGP4-compatible" means agreeing with it to the metre, including its quirks and its WGS-72 constants. The mean elements were fitted by an orbit-determination process that used that exact code; any other propagator, however physically superior, is inconsistent with the data.

::: key TLEs and SGP4
A TLE holds two lines of *mean* elements in the Brouwer–Lyddane sense used by SGP4, plus the drag term $B^{*}$. They must be propagated with SGP4/SDP4. Feeding them to a Cowell integrator mixes theories and produces kilometre-level errors immediately.
:::

::: warning Kilometres wrong at the epoch
The most common misuse of a TLE is to convert its six numbers with the two-body element-to-state routine and integrate the result numerically with a $J_2$ or high-fidelity force model. The mean elements omit the short-period $J_2$ oscillations, so the state you build is kilometres from where the satellite is *at the epoch itself*, before you have propagated at all; the numerical integrator then faithfully propagates the wrong orbit. And $B^{*}$ is a fit parameter of SGP4's density model, not a $C_D A/m$ you can put into a drag force. If you need a state vector for a high-fidelity integrator, run SGP4 to the epoch and take its output, accepting SGP4's kilometre-level accuracy as the initial uncertainty.
:::

## Reproducing a ground track from a TLE

The pipeline is short, and every piece of it has been built in this module:

1. Parse the two lines and verify the checksums.
2. Convert the epoch to a Julian date.
3. For each time step, call SGP4 to obtain $\mathbf{r}$ in TEME (kilometres).
4. Compute the Greenwich sidereal time at that instant (TEME is referred to the true equator of date, and the sidereal-time rotation about the $z$-axis is the right one to bring it into Earth-fixed coordinates to well within a kilometre; the sub-kilometre polar-motion correction is irrelevant for a plot).
5. Form longitude and latitude with the sub-point formulas of the previous lesson.

```python
import numpy as np
from sgp4.api import Satrec, jday

line1 = "1 25544U 98067A   26265.50000000  .00012345  00000+0  22345-3 0  9999"
line2 = "2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.49000000123450"

def checksum_ok(line):
    total = sum(int(c) if c.isdigit() else 1 if c == "-" else 0 for c in line[:68])
    return total % 10 == int(line[68])

assert checksum_ok(line1) and checksum_ok(line2)
sat = Satrec.twoline2rv(line1, line2)

jd0, fr0 = jday(2026, 9, 22, 12, 0, 0.0)         # epoch of the set
lons, lats = [], []
for k in range(0, 1440):                           # one day at one-minute steps
    fr = fr0 + k / 1440.0
    err, r, v = sat.sgp4(jd0, fr)                  # r in km, TEME frame
    assert err == 0
    theta = gmst_deg(jd0 + fr)                     # from the ground-track lesson
    lon = (np.degrees(np.arctan2(r[1], r[0])) - theta + 540.0) % 360.0 - 180.0
    lat = np.degrees(np.arcsin(r[2] / np.linalg.norm(r)))
    lons.append(lon); lats.append(lat)
```

Plot `lons` against `lats` on a world map, breaking the line where longitude jumps across $\pm 180^\circ$. What you should see for this set: fifteen and a half sinuous passes in the day, each bounded by latitude $\pm 51.64^\circ$, each displaced $23.6^\circ$ west of the previous one, the first pass starting at the ascending node near longitude $-58^\circ$ (the two-body sub-point of the epoch elements, computed as in the last lesson, is $57.9^\circ\,\mathrm{W}$, $0.04^\circ\,\mathrm{S}$; SGP4's differs by a few kilometres because of the short-period terms the mean elements omit). If your track has the right shape but is shifted uniformly in longitude, your sidereal time is wrong – the classic symptom of using the solar day, or of a Julian-date error of a fraction of a day. If the latitude band is wrong, you have misread the inclination field. If the track drifts west by $23.3^\circ$ per pass instead of $23.6^\circ$, you have propagated with two-body motion and lost the node regression – SGP4 includes it.

::: example Checking the checksum by hand
Line 2 of the example: `2 25544  51.6400 123.4567 0006000  45.6789 314.3211 15.4900000012345`. Sum the digits: $2$; then $2 + 5 + 5 + 4 + 4 = 20$; $5 + 1 + 6 + 4 + 0 + 0 = 16$; $1 + 2 + 3 + 4 + 5 + 6 + 7 = 28$; $0 + 0 + 0 + 6 + 0 + 0 + 0 = 6$; $4 + 5 + 6 + 7 + 8 + 9 = 39$; $3 + 1 + 4 + 3 + 2 + 1 + 1 = 15$; $1 + 5 + 4 + 9 + 0 + 0 + 0 + 0 + 0 + 0 + 0 = 19$; $1 + 2 + 3 + 4 + 5 = 15$. Total $2 + 20 + 16 + 28 + 6 + 39 + 15 + 19 + 15 = 160$, and $160 \bmod 10 = 0$, matching the final character. There are no minus signs on this line. On line 1 the `-3` exponent of $B^{*}$ contributes $1 + 3$ to the sum.
:::

::: warning Fields that are not what they look like
The eccentricity `0006000` is $0.0006$, not $6000$. The drag term `22345-3` is $0.22345 \times 10^{-3}$, not $22\,342$. The first-derivative field is half of $\dot{n}$. The mean motion is in revolutions per day, the angles in degrees, and the epoch's day-of-year starts at $1$, not $0$ (day $1.0$ is January 1 at 00:00). Every one of these has produced a wrong ground track in someone's first parser.
:::

::: warning A TLE ages
The elements describe the orbit at the epoch and SGP4's drag model extrapolates it. For the ISS, whose altitude is actively maintained and whose drag varies with solar activity, a set more than a few days old can be tens of kilometres off along-track – and a reboost since the epoch invalidates it entirely. Always check the epoch against the time you are propagating to, and use the newest set available.
:::

## Check yourself

::: check
A TLE's line 1 contains the epoch field `24366.25000000`. What instant is that?
:::

::: answer
Year $24 \to 2024$, a leap year with $366$ days, so day $366$ is December 31. The fraction $0.25$ is $6$ hours: 2024 December 31, 06:00:00 UTC. (In a non-leap year `366` would be invalid – day numbers run from $1$ to $365$ – which is a useful sanity check on a parser.)
:::

::: check
A TLE gives a mean motion of $2.00560000\,\mathrm{rev/day}$. What kind of orbit is this, and which propagator variant applies?
:::

::: answer
The period is $1440/2.0056 = 718.0\,\mathrm{min}$, about $11\,\mathrm{h}\,58\,\mathrm{min}$ – half a sidereal day, a GPS-type MEO orbit with $a = (\mu/n^2)^{1/3} = 26\,560\,\mathrm{km}$. Since the period exceeds $225\,\mathrm{min}$, this object is propagated with the deep-space variant SDP4, which includes lunisolar perturbations and the 12-hour resonance terms; a plain SGP4 would be wrong by many kilometres.
:::

::: check
Explain in two sentences why mean elements from a TLE should not be converted to a state vector and numerically integrated.
:::

::: answer
The mean elements have had the periodic perturbations averaged out, so converting them with two-body formulas gives a state that is kilometres from the satellite's true position even at the epoch, before any propagation. A numerical integrator then propagates that wrong initial state with a different force model from the one the elements were fitted to, so the two theories are mixed and their errors add rather than cancel.
:::

::: check
The line-1 fields for two consecutive daily TLEs of the same satellite show $\dot{n}/2$ rising from $0.00012$ to $0.00030\,\mathrm{rev/day^2}$. What has physically changed, and what would you expect $B^{*}$ to do?
:::

::: answer
The orbit is decaying two and a half times faster: atmospheric density at the satellite's altitude has increased, typically because of a geomagnetic storm or a rise in solar activity, or the satellite has changed attitude and presents more area. Since SGP4 reproduces the observed decay through $B^{*}$ and its fixed density model, the fitted $B^{*}$ will have risen in roughly the same proportion – it absorbs the density change because the model has nowhere else to put it. This is why $B^{*}$ must not be read as a physical ballistic coefficient.
:::

::: check
Your reproduced ISS ground track has the right shape and the right latitude band but every pass is shifted $0.99^\circ$ further west than the reference each day. What is the bug?
:::

::: answer
The sidereal-time computation is using the solar day: $360^\circ$ per $86\,400\,\mathrm{s}$ instead of per $86\,164.09\,\mathrm{s}$ (or an $\omega_E$ of $2\pi/86\,400$). The difference is $0.9856^\circ$ per day, accumulating linearly – exactly the observed drift. Replace it with the sidereal rate, or use the GMST polynomial, which has the correct rate built in.
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
| Mean elements | Brouwer–Lyddane averaged elements; osculating elements oscillate by up to $\sim 10\,\mathrm{km}$ in $a$ |
| SGP4 / SDP4 | The only correct propagator for TLEs; SDP4 for periods $\ge 225\,\mathrm{min}$; output in TEME, km and km/s |
| Accuracy | About $1\,\mathrm{km}$ at epoch, growing $1$–$3\,\mathrm{km/day}$ in LEO |
| Ground track from a TLE | Parse, SGP4 to TEME, GMST rotation, $\lambda = \operatorname{atan2}(y, x) - \theta_g$, $\phi = \arcsin(z/r)$ |

This closes the module. You can now derive the two-body motion from Newton's law, read any orbit's geometry from its constants of motion, convert between state vectors and elements without singularities, solve Kepler's equation for any eccentricity, propagate analytically on every conic and check it numerically, and turn a published element set into a track on a map. The manoeuvres module builds directly on vis-viva and the orbit equation to change one orbit into another.
