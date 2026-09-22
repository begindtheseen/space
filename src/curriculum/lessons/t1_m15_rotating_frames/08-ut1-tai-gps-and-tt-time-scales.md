---
id: l08-ut1-tai-gps-and-tt-time-scales
title: UT1, TAI, GPS and TT time scales
minutes: 22
covers:
  - UT1, TAI, GPS and TT time scales
---

Every rotation matrix in this module that involves the Earth takes an angle that depends on time. The angle grows at $15.041''$ per second, so an error of one second in "what time is it" is an error of $465\,\mathrm{m}$ in where a ground station is in inertial space, and of $500\,\mathrm{m}$ in where a low satellite is over the ground. Yet a navigation system typically has four or five different answers to "what time is it" available at once — the GNSS receiver's time, the operating system's clock, the timestamp in a telemetry packet, the epoch of an ephemeris — and they differ from one another by tens of seconds. None of them is wrong. They are counting different things.

A time scale is a rule for assigning a number to an event: a unit (nearly always the SI second), an origin (an epoch), and a specification of *what the count follows* — a set of atomic clocks, the rotation of the Earth, the orbit of the Earth, or a satellite constellation's master clock. The time scales that matter for GNC are TAI, UTC, GPS time, TT and UT1, and the whole content of this lesson is what each one follows, the fixed or tabulated offsets between them, and which one each computation in the module needs.

The stakes are not theoretical. Mixing GPS time and UTC is an $18\,\mathrm{s}$ error, which through the Earth rotation angle is $8.4\,\mathrm{km}$ at the equator. Using UTC where UT1 belongs is up to $0.9\,\mathrm{s}$, $400\,\mathrm{m}$. Feeding a planetary ephemeris UTC instead of TT is $69\,\mathrm{s}$, during which the Moon moves $70\,\mathrm{km}$. Each of these has happened in a real system, and each produced a plausible-looking answer.

## TAI: atomic time

International Atomic Time, TAI, is the continuous count of SI seconds maintained by the BIPM from a weighted ensemble of several hundred atomic clocks in national laboratories, steered so that its rate matches the SI second as realised on the rotating geoid. It has no leap seconds, no adjustments, no discontinuities. Its origin was set so that TAI agreed with UT1 (Earth-rotation time) at the start of 1958, and it has drifted ahead of Earth rotation ever since, because the Earth's rotation is slower than the $86\,400$ SI seconds per day that the second was originally defined to match.

TAI is the reference against which all the others are defined. It is not what any clock actually displays — the ensemble average is computed in retrospect and published monthly — but real-time laboratory approximations track it to nanoseconds, which is irrelevant for flight purposes.

## UTC and leap seconds

Coordinated Universal Time, UTC, is the civil time scale, the one clocks and calendars display. It runs at exactly the TAI rate — its seconds are SI seconds — but it is kept within $0.9\,\mathrm{s}$ of Earth-rotation time by inserting an occasional extra second, a *leap second*, at the end of 30 June or 31 December when the IERS decides one is needed:

$$
\mathrm{UTC} = \mathrm{TAI} - \Delta AT ,
$$

where $\Delta AT$ is the accumulated count of leap seconds. When the system began in 1972, $\Delta AT$ was set to $10\,\mathrm{s}$. Twenty-seven leap seconds have been inserted since, the most recent at the end of 31 December 2016, so since 1 January 2017,

$$
\Delta AT = \mathrm{TAI} - \mathrm{UTC} = 37\,\mathrm{s} ,
$$

and at the time of writing this value still stands. It is not a constant: it is a step function of date, and any code that needs it must carry a table of leap-second dates with a provision for updating it. The IERS announces each leap second about six months ahead in Bulletin C; a system that cannot receive that update will be wrong by one second from the next insertion onward.

A leap second is inserted as the time $23{:}59{:}60$ UTC, a sixty-first second in the last minute of the day. Most computer clocks cannot represent that, so operating systems either repeat $23{:}59{:}59$, stop the clock for a second, or smear the extra second over several hours at a slightly slowed rate. Unix time, the count "seconds since 1970-01-01 00:00 UTC" that most software uses, is defined as $86\,400 \times$ days $+$ seconds of day and therefore *cannot* count leap seconds: across a leap second it either repeats a value or jumps. It is a representation of UTC, not a continuous count of SI seconds, and two events one leap second apart can have Unix timestamps that differ by zero. Anything that integrates dynamics across midnight on 30 June or 31 December must not use it as its time variable.

Because the Earth has run slightly fast since about 2020, no leap second has been needed for nearly a decade, and a *negative* leap second — a minute of 59 seconds — has been discussed for the first time. Meanwhile, the 2022 General Conference on Weights and Measures resolved that the tolerance between UTC and Earth rotation will be increased by or before 2035, which in practice ends leap seconds; UTC will then drift slowly away from Earth rotation like TAI does. Until that happens, the table stays.

## GPS time

GPS time is the internal time scale of the Global Positioning System, kept by the ground segment's master clock ensemble and carried by every satellite's broadcast. Its epoch is midnight UTC at the start of 6 January 1980, the first Sunday of that year. At that instant $\Delta AT$ was $19\,\mathrm{s}$, and GPS time was set equal to UTC and then *never leap-adjusted*. So GPS time runs parallel to TAI with a fixed offset:

$$
\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}, \qquad
\mathrm{GPS} - \mathrm{UTC} = \Delta AT - 19\,\mathrm{s} = 18\,\mathrm{s} \text{ (since 2017)} .
$$

Every leap second since 1980 has widened the gap between GPS time and UTC by one second. The navigation message broadcast by the satellites includes the current GPS-minus-UTC offset and the date of the next scheduled leap second, which is how a GPS receiver displays UTC and how most of the world's infrastructure learns about leap seconds at all.

GPS time is expressed as a *week number* and *seconds of week*, the latter running from $0$ at midnight Saturday–Sunday to $604\,800$. The week number was transmitted in 10 bits in the legacy navigation message, so it rolled over from $1023$ to $0$ every $1024$ weeks — on the night of 21–22 August 1999 and again on 6–7 April 2019 (the rollover is at week boundary in GPS time, which was $23{:}59{:}42$ UTC on the 6th, because of the $18\,\mathrm{s}$ offset). The modernised signals carry 13 bits, but receivers that still assume the old field, or that guess the epoch from their firmware date, have misreported dates by $19.6$ years. A GPS timestamp handed to another system must say which rollover epoch it counts from; a bare week number is ambiguous.

Other constellations follow the same pattern with different constants: Galileo System Time shares the GPS offset from TAI to within nanoseconds, BeiDou Time is $\mathrm{TAI} - 33\,\mathrm{s}$, and GLONASS alone follows UTC with leap seconds, so it jumps when UTC does.

One relativistic detail belongs here because it is a time-scale definition. GPS satellite clocks at $26\,560\,\mathrm{km}$ radius run fast relative to clocks on the geoid by $45.7\,\mathrm{\mu s}$ per day (weaker gravity) and slow by $7.2\,\mathrm{\mu s}$ per day (orbital speed), a net gain of $38.4\,\mathrm{\mu s}$ per day — which at the speed of light is $11.5\,\mathrm{km}$ of range error per day. The satellite clocks are therefore built to run slow on the ground by that fraction, $4.465 \times 10^{-10}$, so that in orbit they keep GPS time. Time scales are proper times on a specified surface, and "the SI second" in the definition of TAI means the second on the geoid.

## TT and the dynamical time scales

Terrestrial Time, TT, is the independent variable of the equations of motion for bodies in the solar system as seen from the Earth's surface — the time argument of planetary and lunar ephemerides, of the precession and nutation series, and of the epoch J2000.0. It runs at the TAI rate with a fixed offset,

$$
\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s} = \mathrm{UTC} + \Delta AT + 32.184\,\mathrm{s} ,
$$

so that today $\mathrm{TT} - \mathrm{UTC} = 69.184\,\mathrm{s}$ and $\mathrm{TT} - \mathrm{GPS} = 51.184\,\mathrm{s}$. The odd constant is historical: TT replaced Ephemeris Time, which had been derived from the Moon's motion, and $32.184\,\mathrm{s}$ was the offset between ET and TAI when the atomic scale was introduced in 1977. Keeping it preserved continuity with two centuries of astronomical observations. The constant is exact and will not change.

The epoch J2000.0 is defined in TT: 1 January 2000 at $12{:}00{:}00$ TT, which is $11{:}58{:}55.816$ UTC that day. In Julian date form it is $\mathrm{JD}\;2\,451\,545.0\;\mathrm{TT}$. Every precession formula, every star catalogue epoch, every "days since J2000" in an Earth-orientation routine counts from this instant, and the count must be in the time scale the formula was written for. Feeding it UTC is a $69\,\mathrm{s}$ error in the argument; for precession, whose rate is $50''$ per year, that is negligible, but for the Moon's position, moving at $1\,\mathrm{km/s}$, it is $70\,\mathrm{km}$.

Strictly, TT is the proper time of a clock on the geoid. The solar-system barycentre uses Barycentric Dynamical Time, TDB, which differs from TT by periodic relativistic terms below $2\,\mathrm{ms}$ in amplitude; the JPL ephemerides are tabulated in TDB. For everything in this module, TDB and TT may be treated as the same scale.

### Julian dates

Astronomical formulas take time as a Julian date, the continuous count of days (and fractions) since noon on 1 January 4713 BC in the proleptic Julian calendar, chosen so that no historical observation has a negative date. Noon, not midnight, so that a night's observations share one integer day. The Modified Julian Date is $\mathrm{MJD} = \mathrm{JD} - 2\,400\,000.5$, which starts at midnight and has five digits instead of seven. A Julian date carries a time-scale label like any other time: $\mathrm{JD}_{\mathrm{UT1}}$, $\mathrm{JD}_{\mathrm{TT}}$.

A compact algorithm valid for the years 1900 to 2100, for calendar year $Y$, month $M$, day $D$ and time $h{:}m{:}s$:

$$
\mathrm{JD} = 367Y - \left\lfloor \frac{7\left(Y + \left\lfloor \frac{M + 9}{12} \right\rfloor\right)}{4} \right\rfloor + \left\lfloor \frac{275 M}{9} \right\rfloor + D + 1\,721\,013.5 + \frac{h + m/60 + s/3600}{24} ,
$$

with $\lfloor\cdot\rfloor$ the integer part. Check: 1 January 2000 at $12{:}00$ gives $734\,000 - 3\,500 + 30 + 1 + 1\,721\,013.5 + 0.5 = 2\,451\,545.0$. Correct.

::: key
Relating the scales: TAI is continuous atomic time. $\mathrm{UTC} = \mathrm{TAI} - \Delta AT$ with $\Delta AT = 37\,\mathrm{s}$ since 2017 (leap seconds). $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}$, with no leap seconds, so $\mathrm{GPS} - \mathrm{UTC} = 18\,\mathrm{s}$ now. $\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s}$. UT1 tracks the actual rotation of the Earth and differs from UTC by $|\Delta\mathrm{UT1}| < 0.9\,\mathrm{s}$.
:::

## UT1: the rotation of the Earth

Universal Time UT1 is not an atomic scale at all. It is a measure of the Earth's rotation angle, expressed in time units: it is *defined* so that the Earth rotation angle is a fixed linear function of it,

$$
\theta_{ERA} = 2\pi\left(0.7790572732640 + 1.00273781191135448\, T_u\right), \qquad T_u = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0 ,
$$

the IAU 2000 expression, with the result taken modulo $2\pi$. The coefficient $1.00273781191135448$ is the number of rotations per UT1 day relative to the celestial frame; its reciprocal, $86\,400 / 1.0027378119 = 86\,164.0989\,\mathrm{s}$, is the stellar day of lesson 05. When the Earth rotates, UT1 advances; when the Earth slows, UT1 falls behind the atomic scales. UT1 is measured, not kept: VLBI observations of quasars and GNSS and laser tracking of satellites determine the rotation angle to about ten microseconds of time, and the IERS publishes the result as

$$
\Delta\mathrm{UT1} = \mathrm{UT1} - \mathrm{UTC} ,
$$

daily in Bulletin A (with predictions weeks ahead) and, rounded to $0.1\,\mathrm{s}$, in Bulletin D and in the GPS navigation message and radio time signals. Leap seconds exist precisely to keep $|\Delta\mathrm{UT1}| < 0.9\,\mathrm{s}$. In the mid-2020s the value has hovered within about a tenth of a second of zero with the Earth running slightly fast, which is why no leap second has been called since 2016.

Here is the point that matters for navigation. The ECI-to-ECEF rotation of lesson 05 is $\mathbf{R}_3(\theta)$, and $\theta$ is the physical rotation of the planet. That is a UT1 quantity, and *only* a UT1 quantity. Evaluate the ERA formula with a UTC Julian date and the angle is wrong by $\omega_E\,\Delta\mathrm{UT1}$, up to $0.9 \times 15.04'' = 13.5''$, which is $419\,\mathrm{m}$ of east–west position at the equator and $450\,\mathrm{m}$ for a satellite at $500\,\mathrm{km}$. Evaluate it with GPS time and the error is $18\,\mathrm{s}$, $8.4\,\mathrm{km}$. Evaluate it with TT and it is $69\,\mathrm{s}$, $32\,\mathrm{km}$. The angle does not care what the input is called; it will produce a rotation matrix for any number you hand it.

::: key
A navigation system needs UT1, not UTC, for the ECI-to-ECEF rotation angle, because that angle is driven by the actual rotation of the Earth, which is what UT1 measures. Using UTC instead introduces up to $0.9\,\mathrm{s}$ of rotation error — about $400\,\mathrm{m}$ of position error at the equator. $\Delta\mathrm{UT1}$ comes from IERS Bulletin A.
:::

### Sidereal time and the equinox

Before the ERA was adopted, the rotation angle was expressed as Greenwich Mean Sidereal Time, GMST, the hour angle of the *mean equinox of date*. The widely used expression is

$$
\theta_{GMST} = 280.46061837^\circ + 360.98564736629^\circ\, d + 0.000387933^\circ\, T^2 - \frac{T^3}{38\,710\,000}\,\text{deg}, \qquad d = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0, \quad T = \frac{d}{36\,525},
$$

modulo $360^\circ$. The linear coefficient is $360.98564736629^\circ$ per day, which is $15.0410686^\circ$ per hour — the $15.041$ of the flashcard. GMST differs from the ERA by the accumulated precession of the equinox in right ascension, about $46''$ per year since J2000, plus the tiny quadratic terms. The two angles are the Earth rotation angle measured from two different zero points on the equator: the ERA from the celestial intermediate origin, a point that does not move along the equator; GMST from the equinox, which does. Which one you need depends on which precession–nutation model sits next to it in the chain, the subject of the final lesson. Both take UT1.

::: example One instant on five clocks
The instant is 22 September 2026 at $12{:}00{:}00$ UTC. With $\Delta AT = 37\,\mathrm{s}$:

- $\mathrm{TAI} = 12{:}00{:}37$.
- $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s} = 12{:}00{:}18$. Days from the GPS epoch (6 January 1980) to 22 September 2026 are $17\,061$, which is $2\,437$ weeks and $2$ days, so 22 September 2026 is a Tuesday and the GPS week is $2\,437$. Seconds of week: $2 \times 86\,400 + 12 \times 3\,600 + 18 = 216\,018$. In a receiver still using the 10-bit field, the week reads $2\,437 \bmod 1024 = 389$.
- $\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s} = 12{:}01{:}09.184$. The Julian date is $\mathrm{JD}_{\mathrm{UTC}} = 2\,461\,306.0$ (12:00 UTC lands on an integer, as noon does), $\mathrm{MJD} = 61\,305.5$, and $\mathrm{JD}_{\mathrm{TT}} = 2\,461\,306.0 + 69.184/86\,400 = 2\,461\,306.000\,800\,7$.
- $\mathrm{UT1} = \mathrm{UTC} + \Delta\mathrm{UT1}$, where $\Delta\mathrm{UT1}$ for that date must be read from Bulletin A; it will be a few tenths of a second at most. Nothing in this lesson can compute it, and that is the lesson.

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

The `datetime` arithmetic works here only because no leap second falls inside the interval being differenced within a week; `datetime` does not know about leap seconds at all, and `elapsed` from 1980 would be $18\,\mathrm{s}$ short if computed directly in UTC — which is why the code converts to GPS time first and then differences.
:::

::: example The Earth rotation angle, and what a tenth of a second does to it
For the same instant, suppose $\Delta\mathrm{UT1} = 0$ for the moment, so $T_u = \mathrm{JD}_{\mathrm{UT1}} - 2\,451\,545.0 = 9\,761.0$ days. Then

$$
\frac{\theta_{ERA}}{2\pi} = 0.7790572732640 + 1.00273781191135448 \times 9\,761.0 = 9\,788.5028 ,
$$

and keeping the fractional part, $\theta_{ERA} = 0.502839 \times 360^\circ = 181.02^\circ$. The GMST formula with $d = 9\,761.0$ and $T = 0.26724$ gives $\theta_{GMST} = 181.36^\circ$ after reducing modulo $360^\circ$. The difference, $0.34^\circ = 1\,230''$, is the precession of the equinox in right ascension over the $26.7$ years since J2000: $46'' \times 26.7 = 1\,230''$. Same rotation, two zero points.

Now let the true $\Delta\mathrm{UT1}$ be $-0.10\,\mathrm{s}$, a typical value. The rotation angle changes by $\omega_E \times 0.10 = 7.29 \times 10^{-6}\,\mathrm{rad} = 1.50''$. A ground station at the equator is displaced in ECI by $6\,378\,137 \times 7.29 \times 10^{-6} = 46.5\,\mathrm{m}$; a satellite at $500\,\mathrm{km}$ altitude, converted to ECEF with the wrong angle, lands $50\,\mathrm{m}$ from where it is. A laser ranging station cannot acquire a target with that error; a GNSS orbit product would be unusable. Reading one number from Bulletin A removes it entirely.
:::

::: warning
GPS time is not UTC. A receiver's raw time-of-week is GPS time; the offset to UTC ($18\,\mathrm{s}$ today) is broadcast separately and changes at each leap second. Timestamp a measurement in GPS time, treat it as UTC in the Earth rotation angle, and the frame is wrong by $18 \times 15.04'' = 271''$ — $8.4\,\mathrm{km}$ at the equator. Every timestamp in a navigation system should carry its scale in its name or type: `t_gps`, `t_utc`, `t_tt`.
:::

::: warning
Unix time and `datetime` objects represent UTC without leap seconds. A difference of two such values across a leap second is wrong by one second, and the instant $23{:}59{:}60$ cannot be represented at all. For integrating dynamics or differencing timestamps, convert to a continuous scale first — TAI, GPS time or TT — and convert back only for display.
:::

## Check yourself

::: check
A telemetry packet is stamped GPS week $2\,300$, seconds of week $345\,600.000$. What UTC date and time does it correspond to? Assume $\Delta AT = 37\,\mathrm{s}$ throughout.
:::

::: answer
Week $2\,300$ began $2\,300 \times 7 = 16\,100$ days after 6 January 1980. Forty-four years from the epoch, 6 January 2024, is $44 \times 365 + 11 = 16\,071$ days later (eleven leap days, 1980 to 2020 inclusive), leaving $29$ more days, which lands on Sunday 4 February 2024 — a Sunday, as every GPS week start must be. Then $345\,600\,\mathrm{s} = 4 \times 86\,400$ is exactly four days, so the GPS time is $00{:}00{:}00$ on Thursday 8 February 2024. UTC is $18\,\mathrm{s}$ *behind* GPS time, so the UTC stamp is $23{:}59{:}42$ on Wednesday 7 February 2024. Note the date changed: a system that converts week and seconds to a calendar date and only then subtracts $18\,\mathrm{s}$ must handle the day boundary, and one that forgets the offset altogether files the packet under the wrong day.
:::

::: check
Explain why the epoch J2000.0 is defined in TT rather than UTC, and give its UTC equivalent.
:::

::: answer
J2000.0 is the reference epoch for dynamical quantities — the orientation of the mean equator and equinox, the star catalogue positions, the arguments of precession and nutation. Those are functions of a uniform, continuous time variable, which UTC, with its leap seconds, is not: a definition in UTC would move the epoch relative to the dynamics every time a leap second was inserted. TT is uniform and permanently offset from TAI, so the epoch is fixed once and for all. At J2000.0, $\Delta AT$ was $32\,\mathrm{s}$, so $\mathrm{TT} - \mathrm{UTC} = 32 + 32.184 = 64.184\,\mathrm{s}$ and the epoch in UTC is 1 January 2000 at $11{:}58{:}55.816$.
:::

::: check
A spacecraft's onboard clock is disciplined to GPS time. Ground software converts its telemetry timestamps to UTC using a hard-coded offset of $18\,\mathrm{s}$. A leap second is inserted on the next 31 December. What happens to the converted timestamps from that instant on, and what is the frame consequence for a ground track computed from them?
:::

::: answer
After the leap second $\Delta AT$ becomes $38\,\mathrm{s}$ and the true GPS-minus-UTC offset becomes $19\,\mathrm{s}$; the hard-coded $18\,\mathrm{s}$ is now wrong by one second, so every converted UTC stamp is one second *late*. The onboard clock itself is fine — GPS time is continuous — the error is entirely in the ground conversion. If those UTC stamps are then used, via $\Delta\mathrm{UT1}$, to compute the Earth rotation angle for a ground track, the angle is too large by $15.04''$ and the whole ground track shifts east by $\omega_E r \times 1\,\mathrm{s}$, about $500\,\mathrm{m}$ for a low satellite, from midnight onward. The symptom is a step change at a specific instant, which is diagnostic: physical effects do not step.
:::

::: check
Show that $\mathrm{TT} - \mathrm{GPS}$ is a constant and give its value. Why is this useful for an onboard orbit propagator?
:::

::: answer
$\mathrm{TT} = \mathrm{TAI} + 32.184\,\mathrm{s}$ and $\mathrm{GPS} = \mathrm{TAI} - 19\,\mathrm{s}$, both fixed offsets from TAI, so $\mathrm{TT} - \mathrm{GPS} = 32.184 + 19 = 51.184\,\mathrm{s}$, independent of date and unaffected by leap seconds. A propagator running on GPS time from the receiver can therefore compute the TT argument for its precession–nutation model, its planetary ephemeris and its J2000 day count by adding a compile-time constant, with no leap-second table on board. Only the conversion to UT1 for the rotation angle needs uploaded data ($\Delta\mathrm{UT1}$ and, for display, $\Delta AT$); everything dynamical can be done in GPS time plus $51.184\,\mathrm{s}$.
:::

::: check
The IERS predicts $\Delta\mathrm{UT1} = +0.32\,\mathrm{s}$ for a date. A propagator ignores it and uses UTC for the rotation angle. For a satellite at $500\,\mathrm{km}$ altitude in an equatorial orbit, what is the error in its computed ECEF position, and in which direction?
:::

::: answer
The rotation angle is in error by $\omega_E \times 0.32 = 7.292115 \times 10^{-5} \times 0.32 = 2.33 \times 10^{-5}\,\mathrm{rad} = 4.8''$. At radius $6\,878\,137\,\mathrm{m}$ the displacement is $6\,878\,137 \times 2.33 \times 10^{-5} = 160\,\mathrm{m}$. As for the sign: UT1 is ahead of UTC, so the Earth has actually turned *farther* than the UTC-based angle says; the computed ECEF longitude of the satellite is therefore too far east by $4.8''$ — the code has not rotated the Earth enough under the satellite. Equivalently, the true ECEF position is $160\,\mathrm{m}$ west of the computed one. The error is purely east–west, since $\mathbf{R}_3$ changes nothing along $z$ or in radius.
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

The final lesson assembles the full rotation from GCRF to ITRF: the Earth rotation angle from UT1, sitting between the precession–nutation of the spin axis in inertial space and the polar motion of the axis relative to the crust.
