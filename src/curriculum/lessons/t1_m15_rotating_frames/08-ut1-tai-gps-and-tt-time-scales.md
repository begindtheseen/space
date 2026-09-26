---
id: l08-ut1-tai-gps-and-tt-time-scales
title: UT1, TAI, GPS and TT time scales
minutes: 22
covers:
  - UT1, TAI, GPS and TT time scales
---

Picture two clocks. One is a perfect wristwatch that never gains or loses a tick. The other is a sundial, which really measures how far the Earth has turned. For centuries they agreed. Today we can tell they don't — the Earth's spin wobbles and slowly slows — so we must say which clock we mean.

Every Earth rotation matrix in this module takes an angle that depends on time. That angle grows at $15.041''$ (arcseconds) per second. So one second of error in "what time is it" moves a ground station by $465\,\mathrm{m}$ in inertial space, and shifts a low satellite by about $500\,\mathrm{m}$ over the ground. Yet a navigation system usually has several answers at once — the GNSS receiver's time, the computer's clock, a telemetry timestamp — differing by tens of seconds. None is wrong. They count different things.

A **time scale** is a rule for giving each event a number. It has a unit (nearly always the SI second), a starting instant (an **epoch**), and something it follows: a set of atomic clocks, the spin of the Earth, the motion of the planets, or a satellite system's master clock. For GNC the scales are TAI, UTC, GPS time, TT and UT1: what each follows, the offsets between them, and which each calculation needs.

Mixing GPS time and UTC is an $18\,\mathrm{s}$ error — $8.4\,\mathrm{km}$ at the equator through the Earth rotation angle. Using UTC where UT1 belongs is up to $0.9\,\mathrm{s}$, about $400\,\mathrm{m}$. Feeding a planet or Moon table UTC instead of TT is $69\,\mathrm{s}$, in which the Moon moves $70\,\mathrm{km}$. Each has happened, and each gave a believable answer.

## TAI: atomic time

**International Atomic Time**, TAI, is the perfect wristwatch. It is a steady count of SI seconds kept by the **[[BIPM|bipm]]** from a weighted average of several hundred atomic clocks in laboratories around the world. Its rate is set to match the SI second on the **geoid**, Earth's sea-level surface. It has no leap seconds, no adjustments and no jumps.

Its origin was set so that TAI agreed with Earth-rotation time (UT1) at the start of 1958. It has run ahead of the Earth ever since, because the Earth now takes slightly longer than $86\,400$ SI seconds to turn once relative to the Sun — the second was originally sized to an Earth that [[turned a little faster|earth-slows]].

TAI defines all the others. No real clock displays it: the average is computed afterward and published monthly, while laboratory clocks track it in real time to nanoseconds.

## UTC and leap seconds

**Coordinated Universal Time**, UTC, is civil time — what clocks and calendars show. It ticks at exactly the TAI rate. But it is kept within $0.9\,\mathrm{s}$ of Earth-rotation time by adding an occasional extra second, a **leap second**, at the end of 30 June or 31 December, whenever the IERS (International Earth Rotation and Reference Systems Service) decides one is needed:

$$
\mathrm{UTC} = \mathrm{TAI} - \Delta AT .
$$

$\Delta AT$ (read "delta A T") is the running total of leap seconds. When the system began in 1972 it was set to $10\,\mathrm{s}$. Twenty-seven leap seconds have been added since, the last at the end of 31 December 2016. So since 1 January 2017,

$$
\Delta AT = \mathrm{TAI} - \mathrm{UTC} = 37\,\mathrm{s} ,
$$

and it still stands. It is not a constant but a staircase in time, so code that needs it must carry an updatable table of leap-second dates. The IERS announces each leap second about six months ahead in **Bulletin C**. A system that cannot receive that update is one second wrong from the next leap second on.

A leap second is written $23{:}59{:}60$ UTC — a sixty-first second in the day's last minute. Most computer clocks cannot show that, so operating systems repeat $23{:}59{:}59$, pause, or "smear" the second over several hours. **Unix time**, the "seconds since 1970-01-01 00:00 UTC" most software uses, is defined as $86\,400 \times$ days plus seconds of the day. So it *cannot* count leap seconds: across one it repeats a value or jumps. Two events a leap second apart can have the same Unix timestamp. Anything that integrates motion across midnight on 30 June or 31 December must not use it as its time variable. That midnight has [[broken real systems|leap-trouble]].

Since about 2020 the Earth has spun slightly fast, so no leap second has been needed for nearly a decade, and a *negative* leap second — a 59-second minute — has been discussed for the first time. In 2022 the General Conference on Weights and Measures decided to widen the allowed gap between UTC and Earth rotation by or before 2035. That ends leap seconds in practice; UTC will then drift slowly away from the Earth, like TAI. Until then, the table stays.

## GPS time

**GPS time** is the Global Positioning System's own clock, kept by its ground control's master clocks and carried in every satellite's broadcast. Its epoch is midnight UTC at the start of 6 January 1980, the first Sunday of that year. At that instant $\Delta AT$ was $19\,\mathrm{s}$. GPS time was set equal to UTC and then *never* given a leap second. So it runs alongside TAI at a fixed offset:

$$
\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}, \qquad
\mathrm{GPS} - \mathrm{UTC} = \Delta AT - 19\,\mathrm{s} = 18\,\mathrm{s} \text{ (since 2017)} .
$$

Every leap second since 1980 widened the gap by one. The satellites broadcast the current GPS-minus-UTC offset and the next leap second's date, which is how receivers show UTC — and how much of the world learns about leap seconds at all. ([[All the offsets on one line|time-ladder]].)

GPS time is written as a **week number** plus **seconds of week**, which run from $0$ at midnight between Saturday and Sunday up to $604\,800$. The old navigation message sent the week number in 10 bits, so it could only count to $1023$. Like a car odometer, it rolled over to $0$ every $1024$ weeks: on the night of 21–22 August 1999, and again on 6–7 April 2019. (The rollover happens at a week boundary in GPS time, which in 2019 was $23{:}59{:}42$ UTC on the 6th, because of the $18\,\mathrm{s}$ offset.) Newer signals use 13 bits, but receivers that assume the old field, or guess the epoch from their software's date, have reported dates $19.6$ years wrong. A bare week number is ambiguous; say which rollover it counts from.

Other systems differ in constants: Galileo System Time matches GPS's offset from TAI to nanoseconds, BeiDou Time is $\mathrm{TAI} - 33\,\mathrm{s}$, and GLONASS alone follows UTC, so it jumps when UTC does.

One relativity detail is part of the definition. Seen from the ground, a GPS satellite clock at $26\,560\,\mathrm{km}$ from Earth's center runs fast by about $45.8\,\mathrm{\mu s}$ per day, because gravity is weaker up there. It runs slow by about $7.2\,\mathrm{\mu s}$ per day, because it is moving fast. The net gain is about $38.6\,\mathrm{\mu s}$ per day — at the speed of light, $11.6\,\mathrm{km}$ of range error per day. So the satellite clocks are [[built to run slow on the ground|gps-relativity]] by that fraction, $4.465 \times 10^{-10}$, so that in orbit they keep GPS time. A time scale is time on a stated surface: TAI's "SI second" is the second on the geoid.

## TT and the dynamical time scales

**Terrestrial Time**, TT, is the time that the equations of motion of the Sun, Moon and planets use, as seen from Earth. It is the time argument of planet and Moon tables (**ephemerides**), of the precession and nutation formulas of the next lesson, and of the epoch J2000.0. It runs at the TAI rate with a fixed offset:

$$
\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s} = \mathrm{UTC} + \Delta AT + 32.184\,\mathrm{s} .
$$

So today $\mathrm{TT} - \mathrm{UTC} = 37 + 32.184 = 69.184\,\mathrm{s}$, and $\mathrm{TT} - \mathrm{GPS} = 19 + 32.184 = 51.184\,\mathrm{s}$.

The odd constant is history. TT replaced Ephemeris Time, worked out from the Moon's motion, and when the atomic scale took over in 1977 the gap between the two was $32.184\,\mathrm{s}$. Keeping it made TT continue smoothly from centuries of astronomical records. It is exact and will never change.

The epoch **J2000.0** is defined in TT: 1 January 2000 at $12{:}00{:}00$ TT, which is $11{:}58{:}55.816$ UTC that day. As a Julian date (below) it is $\mathrm{JD}\;2\,451\,545.0\;\mathrm{TT}$. Every precession formula, star catalogue and "days since J2000" counts from this instant, in the scale the formula was written for. Feed it UTC and the argument is $69\,\mathrm{s}$ off. For precession, which moves $50''$ a year, that does not matter. For the Moon, moving about $1\,\mathrm{km/s}$, it is $70\,\mathrm{km}$.

Strictly, TT is the time a clock on the geoid keeps. **Barycentric Dynamical Time**, TDB, used by NASA JPL's planet tables, is time at the solar system's center of mass; it differs from TT by relativistic wiggles under $2\,\mathrm{ms}$. In this module, treat them as the same.

### Julian dates

Months of different lengths make calendars awkward for arithmetic, so astronomers use the **[[Julian date|julian-date]]**, a plain count of days (and fractions of a day) since noon on 1 January 4713 BC, counted in the old Julian calendar. That is early enough that no historical record has a negative date, and noon lets one night's observations share a day number. The **Modified Julian Date** is $\mathrm{MJD} = \mathrm{JD} - 2\,400\,000.5$: it starts at midnight and needs five digits instead of seven. A Julian date needs a time-scale label like any other time: $\mathrm{JD}_{\mathrm{UT1}}$ ("JD in UT1"), $\mathrm{JD}_{\mathrm{TT}}$.

A short formula works for 1900 to 2100. For year $Y$, month $M$, day $D$ and time $h{:}m{:}s$:

$$
\mathrm{JD} = 367Y - \left\lfloor \frac{7\left(Y + \left\lfloor \frac{M + 9}{12} \right\rfloor\right)}{4} \right\rfloor + \left\lfloor \frac{275 M}{9} \right\rfloor + D + 1\,721\,013.5 + \frac{h + m/60 + s/3600}{24} .
$$

The brackets $\lfloor\cdot\rfloor$ ("floor") mean "drop the fraction". Check it on 1 January 2000 at $12{:}00$. The pieces are $367 \times 2000 = 734\,000$; then $\lfloor 7 \times (2000 + 0)/4 \rfloor = 3\,500$; then $\lfloor 275/9 \rfloor = 30$; then $D = 1$; and the time adds $12/24 = 0.5$. Altogether $734\,000 - 3\,500 + 30 + 1 + 1\,721\,013.5 + 0.5 = 2\,451\,545.0$. Correct.

::: key Relating the time scales
TAI is continuous atomic time. $\mathrm{UTC} = \mathrm{TAI} - \Delta AT$ with $\Delta AT = 37\,\mathrm{s}$ since 2017 (leap seconds). $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}$, with no leap seconds, so $\mathrm{GPS} - \mathrm{UTC} = 18\,\mathrm{s}$ now. $\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s}$. UT1 tracks the actual rotation of the Earth and differs from UTC by $|\Delta\mathrm{UT1}| < 0.9\,\mathrm{s}$.
:::

## UT1: the rotation of the Earth

**Universal Time**, UT1, is the sundial. It is not atomic at all. It is the Earth's rotation angle, written in units of time. It is *defined* so that the **Earth rotation angle** (ERA) is a fixed straight-line function of it:

$$
\theta_{ERA} = 2\pi\left(0.7790572732640 + 1.00273781191135448\, T_u\right), \qquad T_u = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0 ,
$$

taken modulo $2\pi$ (keep only what is left after removing whole turns). This is the IAU 2000 formula. $T_u$ is the number of UT1 days since J2000. The coefficient $1.00273781191135448$ is the number of turns the Earth makes, relative to the stars, per UT1 day. Its flip, $86\,400 / 1.0027378119 = 86\,164.0989\,\mathrm{s}$, is the stellar day of lesson 05.

When the Earth slows, UT1 falls behind the atomic scales. So UT1 is *measured*, not kept. Radio telescopes watching quasars ([[VLBI|vlbi]]), plus GNSS and laser tracking of satellites, pin down the rotation angle to about ten microseconds of time. The IERS publishes the result as

$$
\Delta\mathrm{UT1} = \mathrm{UT1} - \mathrm{UTC}
$$

("delta U T one"): daily in **Bulletin A**, with predictions weeks ahead, and rounded to $0.1\,\mathrm{s}$ in Bulletin D, the GPS navigation message and radio time signals. Leap seconds exist to keep $|\Delta\mathrm{UT1}| < 0.9\,\mathrm{s}$. In the mid-2020s the value has stayed within about a tenth of a second of zero, with the Earth running slightly fast — which is why there has been no leap second since 2016.

Here is the point that matters for navigation. The ECI-to-ECEF rotation of lesson 05 is $\mathbf{R}_3(\theta)$, and $\theta$ is how far the planet has physically turned. That is a UT1 quantity, and *only* a UT1 quantity.

- Evaluate the ERA formula with a UTC Julian date and the angle is off by $\omega_E\,\Delta\mathrm{UT1}$. That is up to $0.9 \times 15.04'' = 13.5''$: $419\,\mathrm{m}$ east–west at the equator, $450\,\mathrm{m}$ for a satellite at $500\,\mathrm{km}$.
- Evaluate it with GPS time and the error is $18\,\mathrm{s}$: $8.4\,\mathrm{km}$.
- Evaluate it with TT and it is $69\,\mathrm{s}$: $32\,\mathrm{km}$.

The formula does not care what its input is called; it makes a rotation matrix from any number.

::: key Why UT1 and not UTC
A navigation system needs UT1, not UTC, for the ECI-to-ECEF rotation angle, because that angle is driven by the actual rotation of the Earth, which is what UT1 measures. Using UTC instead introduces up to $0.9\,\mathrm{s}$ of rotation error — about $400\,\mathrm{m}$ of position error at the equator. $\Delta\mathrm{UT1}$ comes from IERS Bulletin A.
:::

### Sidereal time and the equinox

Before the ERA, the rotation angle was given as **Greenwich Mean Sidereal Time**, GMST: the angle from the *mean equinox of date* (a moving reference direction in the sky) to the Greenwich meridian. The widely used formula is

$$
\theta_{GMST} = 280.46061837^\circ + 360.98564736629^\circ\, d + 0.000387933^\circ\, T^2 - \frac{T^3}{38\,710\,000}\,\text{deg}, \qquad d = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0, \quad T = \frac{d}{36\,525},
$$

taken modulo $360^\circ$. Here $d$ counts days since J2000 and $T$ counts centuries. The main rate is $360.98564736629^\circ$ per day, which divided by $24$ is $15.0410686^\circ$ per hour — the $15.041$ on the flashcard.

GMST and the ERA measure the *same* rotation from [[two different zero points|era-gmst]] on the equator. The ERA counts from the **celestial intermediate origin**, a point that does not slide along the equator. GMST counts from the equinox, which does slide, by the precession of the equinox in right ascension: about $46''$ a year since J2000, plus tiny quadratic terms. Which you need depends on the precession–nutation model beside it (next lesson). Both take UT1.

::: example One instant on five clocks
The instant is 22 September 2026 at $12{:}00{:}00$ UTC, with $\Delta AT = 37\,\mathrm{s}$.

**TAI.** Add $37\,\mathrm{s}$: $12{:}00{:}37$.

**GPS.** Subtract $19\,\mathrm{s}$ from TAI: $12{:}00{:}18$. From the GPS epoch (6 January 1980) to 22 September 2026 is $17\,061$ days. Dividing by $7$ gives $2\,437$ weeks and $2$ days left over. Weeks start on Sunday, so the date is a Tuesday in GPS week $2\,437$. Seconds of week: $2 \times 86\,400 + 12 \times 3\,600 + 18 = 216\,018$. A receiver still using the 10-bit field shows week $2\,437 \bmod 1024 = 389$ ("mod" is the remainder after dividing).

**TT.** Add $32.184\,\mathrm{s}$ to TAI: $12{:}01{:}09.184$. The Julian date is $\mathrm{JD}_{\mathrm{UTC}} = 2\,461\,306.0$ (noon lands on a whole number, as noon does), so $\mathrm{MJD} = 61\,305.5$. For TT, add $69.184\,\mathrm{s}$ as a fraction of a day: $\mathrm{JD}_{\mathrm{TT}} = 2\,461\,306.0 + 69.184/86\,400 = 2\,461\,306.000\,800\,7$.

**UT1.** $\mathrm{UT1} = \mathrm{UTC} + \Delta\mathrm{UT1}$, with $\Delta\mathrm{UT1}$ read from Bulletin A — a few tenths of a second at most. Nothing here can compute it, and that is the lesson.

```python
from datetime import datetime, timedelta, timezone

TAI_MINUS_UTC = 37          # s, since 2017-01-01; check IERS Bulletin C before trusting
GPS_MINUS_TAI = -19         # s, fixed by definition
TT_MINUS_TAI = 32.184       # s, fixed by definition
GPS_EPOCH = datetime(1980, 1, 6, tzinfo=timezone.utc)

def utc_to_gps_week_sow(t_utc):
    """GPS week and seconds-of-week for a UTC instant (no leap second inside the week)."""
    t_gps = t_utc + timedelta(seconds=TAI_MINUS_UTC + GPS_MINUS_TAI)
    elapsed = t_gps - GPS_EPOCH
    week, sow = divmod(elapsed.total_seconds(), 7 * 86400)
    return int(week), sow

t = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
week, sow = utc_to_gps_week_sow(t)
print(week, week % 1024, sow)
print("TAI", t + timedelta(seconds=TAI_MINUS_UTC))
print("TT ", t + timedelta(seconds=TAI_MINUS_UTC + TT_MINUS_TAI))
# 2437 389 216018.0
# TAI 2026-09-22 12:00:37+00:00
# TT  2026-09-22 12:01:09.184000+00:00
```

This works only because no leap second falls inside the week; `datetime` knows nothing about leap seconds. An `elapsed` from 1980 computed directly in UTC would be $18\,\mathrm{s}$ short, which is why the code converts to GPS time *first* and then subtracts.
:::

::: example The Earth rotation angle, and what a tenth of a second does
Same instant. Suppose for now $\Delta\mathrm{UT1} = 0$, so $T_u = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0 = 2\,461\,306.0 - 2\,451\,545.0 = 9\,761.0$ days. Then

$$
\frac{\theta_{ERA}}{2\pi} = 0.7790572732640 + 1.00273781191135448 \times 9\,761.0 = 9\,788.5028 .
$$

That is $9\,788$ whole turns plus $0.502839$ of a turn. Keeping only the part turn, $\theta_{ERA} = 0.502839 \times 360^\circ = 181.02^\circ$.

The GMST formula with $d = 9\,761.0$ and $T = 9\,761.0 / 36\,525 = 0.26724$ gives $\theta_{GMST} = 181.36^\circ$ after removing whole turns. The difference is $0.34^\circ = 1\,230''$. Check it against the precession of the equinox over the $26.7$ years since J2000: $46'' \times 26.7 = 1\,230''$. Same rotation, two zero points.

Now let the true $\Delta\mathrm{UT1}$ be $-0.10\,\mathrm{s}$, a plausible value. The rotation angle changes by $\omega_E \times 0.10\,\mathrm{s} = 7.292 \times 10^{-5} \times 0.10 = 7.29 \times 10^{-6}\,\mathrm{rad}$, which is $1.50''$. Multiply by a radius to get a distance:

- a ground station on the equator moves in ECI by $6\,378\,137 \times 7.29 \times 10^{-6} = 46.5\,\mathrm{m}$;
- a satellite at $500\,\mathrm{km}$ altitude, converted to ECEF with the wrong angle, lands $50\,\mathrm{m}$ from where it really is.

A laser-ranging station would miss its target, and a GNSS orbit product would be useless. One number from Bulletin A removes the error.
:::

::: warning GPS time is not UTC
A receiver's raw time of week is GPS time. The offset to UTC ($18\,\mathrm{s}$ today) is broadcast separately and changes at each leap second. Stamp a measurement in GPS time, treat it as UTC in the Earth rotation angle, and the frame is off by $18 \times 15.04'' = 271''$ — $8.4\,\mathrm{km}$ at the equator. Every timestamp in a navigation system should carry its scale in its name or type: `t_gps`, `t_utc`, `t_tt`.
:::

::: warning Unix time and datetime skip leap seconds
Unix time and `datetime` objects represent UTC without leap seconds. A difference of two of them across a leap second is one second wrong, and $23{:}59{:}60$ cannot be represented at all. To integrate motion or subtract timestamps, convert to a continuous scale first — TAI, GPS time or TT — and convert back only for display.
:::

## Check yourself

::: check
A telemetry packet is stamped GPS week $2\,300$, seconds of week $345\,600.000$. What UTC date and time is that? Assume $\Delta AT = 37\,\mathrm{s}$ throughout.
:::

::: answer
Week $2\,300$ began $2\,300 \times 7 = 16\,100$ days after 6 January 1980. Forty-four years later, 6 January 2024, is $44 \times 365 + 11 = 16\,071$ days after the epoch (eleven leap days, 1980 to 2020 inclusive). That leaves $16\,100 - 16\,071 = 29$ more days, landing on Sunday 4 February 2024 — a Sunday, as every GPS week start must be.

Next, $345\,600\,\mathrm{s} = 4 \times 86\,400$ is exactly four days. So the GPS time is $00{:}00{:}00$ on Thursday 8 February 2024. UTC is $18\,\mathrm{s}$ *behind* GPS time, so the UTC stamp is $23{:}59{:}42$ on Wednesday 7 February 2024.

The date changed: code that subtracts $18\,\mathrm{s}$ after making a calendar date must handle the day boundary, and code that forgets the offset files the packet under the wrong day.
:::

::: check
Why is the epoch J2000.0 defined in TT rather than UTC? What is it in UTC?
:::

::: answer
J2000.0 is the reference epoch for quantities that follow the laws of motion: the mean equator and equinox, star positions, precession and nutation. Those need a smooth time variable. UTC is not one: an epoch defined in UTC would shift against the physics at every leap second. TT is smooth and permanently offset from TAI, so the epoch is fixed once and for all.

At J2000.0, $\Delta AT$ was $32\,\mathrm{s}$. So $\mathrm{TT} - \mathrm{UTC} = 32 + 32.184 = 64.184\,\mathrm{s}$, and the epoch in UTC is 1 January 2000 at $12{:}00{:}00 - 64.184\,\mathrm{s} = 11{:}58{:}55.816$.
:::

::: check
A spacecraft's onboard clock follows GPS time. Ground software converts its timestamps to UTC with a hard-coded offset of $18\,\mathrm{s}$. A leap second is added on the next 31 December. What happens to the converted timestamps from then on, and what does it do to a ground track computed from them?
:::

::: answer
After the leap second $\Delta AT$ becomes $38\,\mathrm{s}$, so the true GPS-minus-UTC offset becomes $19\,\mathrm{s}$. The hard-coded $18\,\mathrm{s}$ is now one second short, so every converted UTC stamp is one second *late*. The onboard clock is fine; the error is all in the ground conversion.

If those UTC stamps are then used (with $\Delta\mathrm{UT1}$) to compute the Earth rotation angle, the angle is too large by $15.04''$. The code has turned the Earth too far under the satellite, so the computed longitude, right ascension minus rotation angle, comes out too small: the whole ground track shifts **west** by $\omega_E r \times 1\,\mathrm{s}$, about $500\,\mathrm{m}$ for a low satellite, from midnight on. The giveaway is a sudden step at one instant. Physical effects do not step.
:::

::: check
Show that $\mathrm{TT} - \mathrm{GPS}$ is a constant and find it. Why is that useful for an orbit propagator running on board?
:::

::: answer
$\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s}$ and $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}$. Both are fixed offsets from TAI, so subtracting,

$$
\mathrm{TT} - \mathrm{GPS} = 32.184 - (-19) = 51.184\,\mathrm{s},
$$

whatever the date, and untouched by leap seconds.

So a propagator on GPS time gets the TT argument for precession–nutation, planet tables and its J2000 day count by adding one constant, with no leap-second table on board. Only the rotation angle needs uploaded data ($\Delta\mathrm{UT1}$, and $\Delta AT$ for display); all the dynamics can run on GPS time plus $51.184\,\mathrm{s}$.
:::

::: check
The IERS predicts $\Delta\mathrm{UT1} = +0.32\,\mathrm{s}$ for a date. A propagator ignores it and uses UTC for the rotation angle. For a satellite at $500\,\mathrm{km}$ altitude in an equatorial orbit, how big is the error in its computed ECEF position, and which way?
:::

::: answer
The rotation angle is off by

$$
\omega_E \times 0.32\,\mathrm{s} = 7.292115 \times 10^{-5} \times 0.32 = 2.33 \times 10^{-5}\,\mathrm{rad} = 4.8'' .
$$

At radius $6\,878\,137\,\mathrm{m}$ that is $6\,878\,137 \times 2.33 \times 10^{-5} = 160\,\mathrm{m}$.

Direction: UT1 is *ahead* of UTC, so the Earth has really turned farther than the UTC-based angle says. The code has not turned the Earth enough under the satellite, so the computed ECEF longitude is too far **east** by $4.8''$. Put the other way, the true ECEF position is $160\,\mathrm{m}$ west of the computed one. The error is purely east–west, since $\mathbf{R}_3$ changes nothing along $z$ or in radius.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| TAI | Continuous atomic time, SI seconds on the geoid; no leap seconds |
| $\mathrm{UTC} = \mathrm{TAI} - \Delta AT$ | Civil time; $\Delta AT = 37\,\mathrm{s}$ since 1 January 2017; leap seconds announced in IERS Bulletin C |
| $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}$ | Epoch 6 January 1980; no leap seconds; $\mathrm{GPS} - \mathrm{UTC} = 18\,\mathrm{s}$ now |
| Week, seconds of week | GPS time format; 10-bit week rolls over every $1024$ weeks (1999, 2019) |
| $\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s}$ | Dynamical time; argument of ephemerides and precession–nutation; $\mathrm{TT} - \mathrm{GPS} = 51.184\,\mathrm{s}$ |
| J2000.0 | 1 January 2000, $12{:}00{:}00$ TT $= \mathrm{JD}\;2\,451\,545.0\;\mathrm{TT}$ |
| $\mathrm{JD}$, $\mathrm{MJD} = \mathrm{JD} - 2\,400\,000.5$ | Julian date (from noon) and modified Julian date (from midnight); always labelled with a scale |
| UT1 | Earth rotation angle in time units; measured, published as $\Delta\mathrm{UT1} = \mathrm{UT1} - \mathrm{UTC}$, $|\Delta\mathrm{UT1}| < 0.9\,\mathrm{s}$ |
| $\theta_{ERA} = 2\pi(0.7790572732640 + 1.00273781191135448\,T_u)$ | Earth rotation angle from $T_u = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0$ |
| $\theta_{GMST}$ | Same rotation measured from the mean equinox of date; $360.98564736629^\circ$ per day $= 15.041^\circ/\mathrm{h}$ |
| $\omega_E \times \Delta t$ | Rotation error from a time-scale mix-up: $1\,\mathrm{s} \to 465\,\mathrm{m}$, $18\,\mathrm{s} \to 8.4\,\mathrm{km}$ at the equator |

The final lesson builds the full rotation from GCRF to ITRF. The Earth rotation angle from UT1 sits in the middle, between the precession–nutation of the spin axis in inertial space and the polar motion of the axis relative to the crust.

::: context bipm Who keeps the world's time
The BIPM — the International Bureau of Weights and Measures, near Paris — is the same organization that looks after the definitions of the meter and the kilogram. Each month it collects comparisons from about 80 laboratories running several hundred atomic clocks, weights the steadiest ones most, and publishes how far each lab's clock was from TAI. So TAI is known exactly only after the fact; each lab's real-time version stays within a few nanoseconds of it.
:::

::: context earth-slows Why the Earth is slowing down
The Moon raises tides in Earth's oceans, and the oceans rub against the sea floor as the planet spins beneath them. That friction acts like a gentle brake. Over centuries the day lengthens by roughly $2$ milliseconds per century. The SI second was sized to match astronomical time as it was measured in the 1800s, so today's day runs a little over $86\,400$ SI seconds on average. The difference piles up: that is why TAI has pulled ahead of Earth-rotation time. On top of the slow braking, melting ice, the atmosphere, and the liquid core make the spin rate wander from year to year — which is why lately the Earth has actually run slightly fast.
:::

::: context leap-trouble When a leap second breaks things
The leap second at the end of 30 June 2012 exposed a bug in the Linux kernel that made some servers spin at full load. Websites including Reddit went down, and an airline booking system used by Qantas failed, delaying flights. Since then, big companies such as Google "smear" a leap second, running their clocks very slightly slow for many hours so no clock ever shows $23{:}59{:}60$. For flight software, the lesson is to keep dynamics on a continuous scale and treat UTC as a display format.
:::

::: context time-ladder The offsets on one line
One instant, read on four clocks. Later readings sit further right. The gaps never change except the one between UTC and the rest, which grows by one second at each leap second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="50.5" y1="52" x2="50.5" y2="68"/>
    <line x1="113.5" y1="52" x2="113.5" y2="68"/>
    <line x1="180" y1="52" x2="180" y2="68"/>
    <line x1="292.6" y1="52" x2="292.6" y2="68"/>
  </g>
  <g font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">
    <text x="50.5" y="44">UTC</text><text x="113.5" y="44">GPS</text><text x="180" y="44">TAI</text><text x="292.6" y="44">TT</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="50.5" y="22">12:00:00</text><text x="113.5" y="22">12:00:18</text><text x="180" y="22">12:00:37</text><text x="292.6" y="22">12:01:09.184</text>
  </g>
  <g font-size="12" text-anchor="middle">
    <text x="82" y="88" fill="#b4232c">18 s</text>
    <text x="146.7" y="88" fill="#1d6fd1">19 s</text>
    <text x="236.3" y="88" fill="#1d6fd1">32.184 s</text>
  </g>
  <path d="M 50.5,74 L 50.5,78 L 113.5,78 L 113.5,74" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 113.5,74 L 113.5,78 L 180,78 L 180,74" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M 180,74 L 180,78 L 292.6,78 L 292.6,74" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">blue gaps fixed forever · red gap grows at each leap second</text>
</svg>
```
:::

::: context gps-relativity Einstein in your phone
Two effects fight. Clocks higher up in a weaker gravity field tick faster (general relativity); fast-moving clocks tick slower (special relativity). For a GPS satellite the first wins, by about $38.6$ microseconds a day. That sounds tiny, but light travels about $300\,\mathrm{m}$ in a microsecond, so uncorrected clocks would put your position off by kilometers within a day. The fix is built in at the factory: the satellite's $10.23\,\mathrm{MHz}$ clock is set to $10.229\,999\,995\,43\,\mathrm{MHz}$ before launch, so that it reads right in orbit.
:::

::: context julian-date A day count with no months
In 1583 the scholar Joseph Scaliger proposed the "Julian Period", a cycle of $7\,980$ years ($28 \times 19 \times 15$, three old calendar cycles multiplied together), starting in 4713 BC. Astronomers later used its start as day zero for a simple running count of days. The big advantage: the time between two events is one subtraction, with no fuss about months, leap years, or calendar reforms. Spacecraft software uses the same trick, usually in the shorter MJD form.
:::

::: context vlbi Timing the Earth with quasars
Quasars are so far away that they barely move against the sky, which makes them perfect fixed markers. In Very Long Baseline Interferometry (VLBI), radio dishes on different continents record the same quasar. A wave front reaches one dish slightly before the other; the delay depends on how the line between the dishes points relative to the quasar. As the Earth turns, the delay changes, and timing it to trillionths of a second tells you exactly how far the Earth has turned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="2"/>
  <line x1="80" y1="160" x2="248.5" y2="18.6" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="280" y1="160" x2="348.9" y2="102.1" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="80" y1="160" x2="197.4" y2="61.5" stroke="#b4232c" stroke-width="3"/>
  <line x1="197.4" y1="61.5" x2="280" y2="160" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="200" y="118" font-size="11" fill="#1f2a44">wave front</text>
  <text x="95" y="96" font-size="12" fill="#b4232c">extra path</text>
  <path d="M 66,160 A 14,8 0 0,1 94,160 Z" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 266,160 A 14,8 0 0,1 294,160 Z" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="80" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">dish 1</text>
  <text x="280" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">dish 2</text>
  <text x="258" y="22" font-size="11" fill="#1d6fd1">to quasar</text>
</svg>
```
:::

::: context era-gmst Two zero points on the equator
Look down on the equator from above the North Pole. The Earth turns counterclockwise. The ERA is the angle from the celestial intermediate origin (CIO) to Greenwich. GMST is the angle from the equinox to Greenwich. The equinox lies slightly behind the CIO, so GMST is larger. In 2026 the gap is $0.34^\circ$; it is drawn here much wider so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="100" x2="180" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="110" y1="100" x2="178.5" y2="114.6" stroke="#b4232c" stroke-width="2"/>
  <line x1="110" y1="100" x2="40" y2="101.2" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="180" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="178.5" cy="114.6" r="4" fill="#b4232c"/>
  <circle cx="40" cy="101.2" r="4" fill="#1f2a44"/>
  <path d="M 155,100 A 45,45 0 1,0 65,100.8" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 139.3,106.2 A 30,30 0 1,0 80,100.5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="190" y="96" font-size="12" fill="#1d6fd1">CIO</text>
  <text x="188" y="126" font-size="12" fill="#b4232c">equinox</text>
  <text x="16" y="92" font-size="12" fill="#1f2a44">Greenwich</text>
  <text x="110" y="42" font-size="12" text-anchor="middle" fill="#1d6fd1">ERA</text>
  <text x="110" y="64" font-size="12" text-anchor="middle" fill="#b4232c">GMST</text>
  <text x="250" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">gap drawn wider</text>
  <text x="250" y="175" font-size="11" text-anchor="middle" fill="#6c7a93">than life (0.34°)</text>
</svg>
```
:::
