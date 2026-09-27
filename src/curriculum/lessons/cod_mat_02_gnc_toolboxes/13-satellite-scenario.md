---
id: l13-satellite-scenario
title: Orbits, ground tracks and access with satelliteScenario
minutes: 21
covers:
  - satelliteScenario for orbits, access and ground tracks
---

Stand in a field on a clear night, an hour after sunset, and wait. Sooner or later a steady dot of light slides across the sky, with no blinking lights. It climbs from one horizon, passes overhead or off to the side, and disappears a few minutes later. That is a satellite, and you have had an **access**: a stretch of time when you and it can see each other.

Every satellite team asks questions like this. When will our spacecraft pass over our ground antenna, and for how long? How much data can we download per day? Where on Earth is it right now, and where will it be in an hour? Answering them needs three pieces: the satellite's orbit, the spinning Earth underneath it, and the geometry of who can see whom.

The last two lessons built the environment around a vehicle in the air. This one goes to orbit. Aerospace Toolbox has a tool built for exactly these questions: **`satelliteScenario`**, a container that holds satellites, ground stations and the links between them over a stretch of time. Before using it, you need a few orbit ideas in plain words, because the tool expects you to speak its language.

## An orbit in plain words

Throw a ball sideways and it curves down to the ground. Throw it harder and it lands farther away. Now imagine throwing it so hard that, as it falls, the curved Earth drops away beneath it exactly as fast. It keeps falling and never lands. That is an **[[orbit|falling-around]]**: falling around the planet, forever missing it.

For a circular orbit of radius $a$ (measured from Earth's center, not from the ground), the speed that makes this work, and the time for one lap, are

$$
v = \sqrt{\frac{\mu}{a}}, \qquad T = 2\pi\sqrt{\frac{a^3}{\mu}},
$$

where $\mu$ (read "mu") $= 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's **[[gravitational parameter|mu]]**, and $T$ is the **orbital period**. The second formula is **[[Kepler's third law|kepler-third]]**, and it holds for oval orbits too, with $a$ the **semi-major axis**, half the long width of the oval.

::: example A 500 km orbit
**Problem.** A satellite circles 500 km above the equatorial radius, $R_E = 6\,378\,137\,\mathrm{m}$. Find its speed, period and laps per day.

**Step 1: the radius.** $a = 6\,378\,137 + 500\,000 = 6\,878\,137\,\mathrm{m}$.

**Step 2: speed.** $v = \sqrt{3.986 \times 10^{14}/6\,878\,137} = \sqrt{5.795 \times 10^{7}} = 7\,613\,\mathrm{m/s}$, about 7.6 km/s.

**Step 3: period.** $a^3 = 3.254 \times 10^{20}\,\mathrm{m^3}$. Divide by $\mu$: $8.163 \times 10^{5}\,\mathrm{s^2}$. Take the square root: $903.5\,\mathrm{s}$. Multiply by $2\pi$: $T = 5\,677\,\mathrm{s} = 94.6\,\mathrm{min}$.

**Step 4: laps per day.** $86\,400/5\,677 = 15.2$.

**Sanity check.** The International Space Station, about 80 km lower, takes about 93 minutes per lap and makes roughly 15.5 laps a day. A slightly higher orbit should be slightly slower. It is.
:::

### Six numbers for an orbit

A circle needs only its size. A general orbit needs six numbers, the **Keplerian elements**, and `satelliteScenario` takes them in this order:

1. **Semi-major axis** $a$: the size, in meters.
2. **Eccentricity** $e$: the shape. $0$ is a circle; closer to $1$ is a longer oval.
3. **Inclination** $i$: the tilt of the orbit plane against the equator, in degrees. $0^\circ$ circles the equator; $90^\circ$ passes over both poles; above $90^\circ$ the satellite travels westward, against Earth's spin.
4. **Right ascension of the ascending node** (**RAAN**): which way the tilted plane is swiveled. The **ascending node** is where the satellite crosses the equator heading north; RAAN is the angle from a fixed direction in space, the ECI $x$ axis from lesson 9, to that crossing.
5. **Argument of periapsis**: where in the plane the orbit's lowest point sits, measured from the ascending node.
6. **True anomaly**: where the satellite is along the orbit at the start time, measured from the lowest point.

For a circular orbit there is no lowest point, so the last two together only set the starting position. That is why it is fine to set both to zero and move the satellite with the true anomaly alone.

## Ground tracks: the Earth turns underneath

Draw the point on the ground directly under the satellite, moment by moment, and you get its **ground track**. The orbit itself stays nearly fixed in space, the way a hula hoop keeps its tilt while you turn inside it. But Earth spins underneath, once per **[[sidereal day|sidereal]]** of $86\,164\,\mathrm{s}$. So each lap's track lands farther west than the one before.

How much farther? During one period $T$, Earth turns through

$$
\Delta\lambda = 360^\circ \times \frac{T}{86\,164\,\mathrm{s}}.
$$

Read $\Delta\lambda$ as "delta lambda", the change in longitude from one lap to the next.

The track also has a height limit. A satellite with inclination $i$ can never be over a latitude higher than $i$ (or $180^\circ - i$ when $i$ is above $90^\circ$). A 51.6-degree orbit never passes over the North Pole or Antarctica.

::: example How far west each lap lands
**Problem.** For the 500 km orbit above, how far west does each lap's equator crossing move, and how far is that along the equator?

**Step 1: the angle.** $\Delta\lambda = 360^\circ \times 5\,677/86\,164 = 23.72^\circ$.

**Step 2: the distance.** One degree of longitude at the equator is $2\pi R_E/360 = 111.3\,\mathrm{km}$. So $23.72 \times 111.3 = 2\,640\,\mathrm{km}$.

**Step 3: coverage of a day.** $15.2$ laps times $23.72^\circ$ is $361^\circ$, a little more than a full circle. After one day the tracks have wrapped around the whole planet once, and the next day's tracks fall in between the first day's.

**Sanity check.** A satellite that goes around about 15 times a day should shift by about $360/15 = 24^\circ$ per lap. It does. An independent Python propagation of this orbit finds successive ascending nodes at $-29.16^\circ$, $-52.88^\circ$ and $-76.60^\circ$ longitude: exactly $23.72^\circ$ apart.
:::

::: warning Two-body orbits do not drift like real ones
The simplest orbit model, the **two-body** model, treats Earth as a perfect ball. Its orbit plane never moves. A real orbit plane swivels because of the equatorial bulge, the $J_2$ term from lesson 11: about 5 degrees a day for the Space Station. A two-body run is fine for a few orbits of access planning, but it cannot show a **[[sun-synchronous|sun-synchronous]]** orbit keeping its lighting, and after weeks its ground track is in the wrong place. Choose the propagator to match the question.
:::

## Access: who can see whom

A ground antenna cannot talk to a satellite through the Earth. It also works badly near the horizon, where buildings, trees and a long slant path through the air get in the way. So a ground station has a **minimum elevation angle**, or **[[elevation mask|elevation-mask]]**: the satellite counts as visible only when it is at least that many degrees above the horizon. Ten degrees is a common choice.

The geometry is a triangle: Earth's center, the station, and the satellite. From it you get the **Earth central angle** $\lambda$, the angle at Earth's center between the station and the satellite at the moment it rises above the mask angle $\varepsilon$ (read "epsilon"):

$$
\lambda = \arccos\left(\frac{R_E\cos\varepsilon}{a}\right) - \varepsilon.
$$

The satellite is visible whenever the point below it is within $\lambda$ of the station, a circle of radius $R_E\lambda$ on the ground (with $\lambda$ in radians). The longest possible pass goes straight overhead and crosses the whole circle, an arc of $2\lambda$. The satellite covers $360^\circ$ in one period, so that pass lasts about $T \times 2\lambda/360^\circ$. This ignores Earth's turning during the pass, which changes the answer by only a few percent.

::: example How long can a pass last?
**Problem.** For the 500 km orbit, with a 10 degree elevation mask, find the Earth central angle, the ground radius of the visibility circle, and the longest possible pass.

**Step 1: the arccos.** $R_E\cos 10^\circ/a = 6\,378\,137 \times 0.98481/6\,878\,137 = 0.91322$, and $\arccos(0.91322) = 24.05^\circ$.

**Step 2: subtract the mask.** $\lambda = 24.05^\circ - 10^\circ = 14.05^\circ$.

**Step 3: ground radius.** $14.05^\circ$ is $0.2452\,\mathrm{rad}$, so $R_E\lambda = 6\,378\,137 \times 0.2452 = 1\,564\,\mathrm{km}$.

**Step 4: longest pass.** $T \times 2\lambda/360^\circ = 94.6 \times 28.09/360 = 7.4\,\mathrm{min}$.

**Sanity check.** With a mask of $0^\circ$ the same steps give $\lambda = 21.98^\circ$ and a longest pass of 11.6 minutes. Lowering the mask should widen the circle and lengthen passes. It does, by a lot: the last 10 degrees near the horizon add more than four minutes. That is why a team argues hard about where to set the mask.
:::

::: note Where the central-angle formula comes from
Put Earth's center at $O$, the station at $G$ and the satellite at $S$. $OG = R_E$ and $OS = a$. At the moment of rising, the line of sight $GS$ is $\varepsilon$ above the local horizontal at $G$, so the angle $OGS$ is $90^\circ + \varepsilon$. By the law of sines, $\sin(\angle OSG)/R_E = \sin(90^\circ + \varepsilon)/a$, so the angle at the satellite is $\eta = \arcsin(R_E\cos\varepsilon/a)$. The three angles of the triangle add to $180^\circ$: $\lambda = 180^\circ - (90^\circ + \varepsilon) - \eta = 90^\circ - \varepsilon - \eta$. Since $90^\circ - \arcsin x = \arccos x$, this is the formula above.
:::

## Building the scenario

Now the tool. A `satelliteScenario` works in four steps: make the scenario, add things to it, ask for relationships, and look at the answers.

```matlab
startTime  = datetime(2026, 9, 27, 0, 0, 0, TimeZone="UTC");
stopTime   = startTime + days(1);
sampleTime = 30;                                    % seconds
sc = satelliteScenario(startTime, stopTime, sampleTime);

% 500 km circular, sun-synchronous inclination; SI lengths, angles in degrees
sat = satellite(sc, 6878137, 0, 97.4, 0, 0, 0, Name="EO-1");

gs  = groundStation(sc, 28.5729, -80.6490, Name="Cape", MinElevationAngle=10);

ac = access(sat, gs);
intervals = accessIntervals(ac)                     % a table, one row per pass

groundTrack(sat, LeadTime=3*3600);                  % draw 3 hours ahead
play(sc)                                            % open the 3-D viewer and animate
```

Step by step:

- **The scenario.** `satelliteScenario(startTime, stopTime, sampleTime)` sets the time window and how often, in seconds, positions are computed. Times are `datetime` values in UTC.
- **The satellite.** `satellite(sc, a, e, i, RAAN, argPeriapsis, trueAnomaly)` takes the six elements in the order listed earlier: semi-major axis in meters and the angles in degrees. Given elements like these, it uses the two-body propagator unless you pick another with the `OrbitPropagator` option. It can also read a **[[two-line element set|tle]]** file, `satellite(sc, "file.tle")`, in which case it uses **SGP4**, the standard model that goes with that format (or its deep-space partner, SDP4, for high orbits).
- **The ground station.** `groundStation(sc, lat, lon)` takes geodetic latitude and longitude in degrees. `MinElevationAngle` is the mask, in degrees.
- **The access.** `access(sat, gs)` creates an access object. `accessIntervals` returns a table with a row for each pass, including its start time, end time and duration in seconds. `accessStatus` gives a true or false for each sample time.
- **The pictures.** `groundTrack` draws the track on the globe, with `LeadTime` and `TrailTime` in seconds. `play` animates the whole scene.

Two more calls pull out numbers you can check. `[pos, vel] = states(sat)` returns the satellite's position and velocity at every sample time, as 3-row arrays in meters and meters per second, in the inertial GCRF frame by default (an ECI frame, lesson 9). `[az, el, r] = aer(gs, sat)` gives the azimuth, elevation and range from the station, which is how you see a pass rise, peak and set.

::: key
`sc = satelliteScenario(start, stop, sampleTime)` holds the time window. `satellite(sc, a, e, i, RAAN, argPeriapsis, trueAnomaly)` adds an orbit (meters and degrees) or `satellite(sc, tleFile)` adds one from a TLE. `groundStation(sc, lat, lon, MinElevationAngle=...)` adds a site. `accessIntervals(access(sat, gs))` lists the passes; `groundTrack(sat)` draws the ground track; `states` and `aer` return the numbers behind them.
:::

::: example Passes over the Cape in one day
**Problem.** For the scenario above, what should `accessIntervals` report, and how do you check it without the toolbox?

**Step 1: an independent propagation.** In Python, place the satellite on its circle, turn the orbit into ECEF by rotating through Earth's angle at each second, and compute the elevation seen from the Cape. This two-body model is the same one the scenario uses.

**Step 2: find the passes.** Mark every second the elevation is above 10 degrees and group the marks into passes. The check finds three passes in the day:

| Start (UTC) | Duration | Highest elevation |
|---|---|---|
| 04:47:41 | 7.3 min | 68.7° |
| 16:23:51 | 5.0 min | 17.3° |
| 17:57:15 | 5.2 min | 18.8° |

**Step 3: compare.** The scenario, sampling every 30 s, should list the same three passes. Its start and end times fall on the sample grid, and small differences in how each tool models Earth's rotation move the edges a little, so expect agreement within about half a minute, not to the second.

**Sanity check.** The best pass climbs to 68.7° and lasts 7.3 minutes, a little under the 7.4-minute limit for an overhead pass found earlier. The low passes are shorter because they only clip the edge of the visibility circle. Three passes a day, 17.5 minutes in all, is typical for one mid-latitude station and one low orbit, and it is why real missions use several stations.
:::

::: warning Sample time sets what you can see
The scenario computes positions at its sample times. A 60 s sample time cannot place the start of a pass better than to the nearest minute, and a short pass that grazes the mask can slip between two samples and vanish. Pick a sample time well below the shortest event you care about, then shorten it and check the answers do not change.
:::

## Check yourself

::: check
The Space Station orbits about 420 km up. Find its period and how far west its ground track moves per lap.
:::

::: answer
$a = 6\,378\,137 + 420\,000 = 6\,798\,137\,\mathrm{m}$. Then $T = 2\pi\sqrt{a^3/\mu} = 2\pi\sqrt{3.142 \times 10^{20}/3.986 \times 10^{14}} = 2\pi \times 887.8 = 5\,578\,\mathrm{s}$, about 93.0 minutes. The shift is $360^\circ \times 5\,578/86\,164 = 23.3^\circ$ per lap. That is a little less than the 500 km orbit's 23.7°, because the lower orbit is quicker, so Earth turns less during one lap.
:::

::: check
A satellite has inclination 97.4°. What is the highest latitude its ground track reaches, and which way does it travel?
:::

::: answer
An inclination above 90° means the orbit runs against Earth's spin, westward, a **retrograde** orbit. The highest latitude is $180^\circ - 97.4^\circ = 82.6^\circ$, north and south. So it passes close to both poles but never exactly over them.
:::

::: check
A teammate calls `satellite(sc, 500, 0, 97.4, 0, 0, 0)` meaning a 500 km orbit. What goes wrong?
:::

::: answer
The first element is the semi-major axis, measured from Earth's center, in meters. `500` means an orbit 500 m from the center, deep inside the planet. The correct number is $6\,378\,137 + 500\,000 = 6\,878\,137$. Two mistakes are stacked: kilometers instead of meters, and altitude instead of distance from the center.
:::

::: check
Explain why the longest pass drops from 11.6 minutes to 7.4 minutes when the elevation mask rises from 0° to 10°, even though 10° sounds small.
:::

::: answer
The mask shrinks the visibility circle on the ground: its central angle goes from $21.98^\circ$ to $14.05^\circ$. Near the horizon, a small change in elevation angle corresponds to a big change in ground distance, because you are looking along the curve of the Earth. Pass time is proportional to $2\lambda$, so the pass shrinks by the ratio $14.05/21.98 = 0.64$: $11.6 \times 0.64 = 7.4\,\mathrm{min}$.
:::

::: check
Your scenario uses a two-body satellite for a 60-day ground-track study of a sun-synchronous orbit. Is that a problem?
:::

::: answer
Yes. A sun-synchronous orbit depends on the $J_2$ swivel of the orbit plane, about $0.99^\circ$ per day. A two-body propagator leaves the plane fixed, so after 60 days the plane is off by about 59 degrees and the ground tracks and lighting are badly wrong. For long studies, use a propagator that includes Earth's oblateness, such as SGP4 with a TLE or a numerical propagator.
:::

## Summary

| Idea | Meaning | Formula or function |
|---|---|---|
| Circular orbit | speed and period | $v = \sqrt{\mu/a}$, $T = 2\pi\sqrt{a^3/\mu}$ |
| Keplerian elements | six numbers for an orbit | $a$ (m), $e$, $i$, RAAN, argument of periapsis, true anomaly (degrees) |
| Ground track shift | Earth turns under the orbit | $\Delta\lambda = 360^\circ\,T/86\,164\,\mathrm{s}$ westward per lap |
| Access geometry | visibility circle | $\lambda = \arccos(R_E\cos\varepsilon/a) - \varepsilon$ |
| Longest pass | overhead pass | about $T \times 2\lambda/360^\circ$ |
| Scenario | time window and sample time | `satelliteScenario(start, stop, dt)` |
| Objects | satellites and sites | `satellite`, `groundStation` |
| Relationships | when they see each other | `access`, `accessIntervals`, `accessStatus`, `aer` |
| Tracks and states | where it is | `groundTrack`, `states`, `play` |

This lesson ends the module. The next module, `cod_slk_01_models`, moves from MATLAB scripts to Simulink block diagrams, where the transfer functions, frames and environment models you have met become blocks wired together into a simulation that runs through time.

::: context falling-around Newton's cannon
Isaac Newton drew this idea in the late 1600s: a cannon on a very tall mountain firing faster and faster. Slow shots land nearby, faster ones farther away, and one fast enough falls around the whole Earth. At 500 km the needed speed is about 7.6 km/s, some 22 times the speed of sound at sea level.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="28" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="180" cy="110" r="84" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M180,28 Q215,30 228,58" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M180,28 Q250,32 250,110" fill="none" stroke="#f2b880" stroke-width="2"/>
  <text x="232" y="54" font-size="11" fill="#b4232c">too slow</text>
  <text x="256" y="112" font-size="11" fill="#1f2a44">faster</text>
  <text x="20" y="40" font-size="11" fill="#1d6fd1">fast enough:</text>
  <text x="20" y="54" font-size="11" fill="#1d6fd1">it never lands</text>
  <text x="180" y="115" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
</svg>
```
:::

::: context mu One number instead of two
Gravity's pull depends on the gravitational constant $G$ times Earth's mass $M$. Each is hard to measure on its own, but their product $\mu = GM$ is known very precisely from tracking satellites: $3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. So orbit formulas use $\mu$ directly. Every planet has its own; the Moon's is about 81 times smaller than Earth's.
:::

::: context kepler-third Three laws from old observations
Johannes Kepler found in 1619, from Tycho Brahe's careful records of Mars and the other planets, that the square of a planet's period is proportional to the cube of its orbit's size. Newton later showed why, from his law of gravity, and supplied the constant: $T^2 = 4\pi^2 a^3/\mu$. The same law sets the period of a CubeSat and of Jupiter.
:::

::: context sidereal Why 86,164 seconds and not 86,400
A solar day, noon to noon, is 86,400 s. But while Earth spins, it also moves along its path around the Sun, so it has to turn a little more than once to bring the Sun back overhead. Measured against the distant stars, one true turn takes about 86,164 s, the sidereal day. Satellite orbits are fixed against the stars, not the Sun, so the sidereal day is the one that sets ground-track shifts. The picture shows two laps of a 500 km, 51.6 degree orbit on a flat map: the second (dashed) crosses the equator 23.7 degrees west of the first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="150" fill="#ffffff" stroke="#1f2a44" stroke-width="1"/>
  <line x1="20" y1="95" x2="340" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <text x="24" y="91" font-size="11" fill="#6c7a93">equator</text>
  <polyline points="126.7,95 130.4,90.1 134.2,85.2 138.2,80.5 142.4,75.8 147.1,71.3 152.3,67 158.2,63 165,59.4 172.8,56.3 181.5,54 191.2,52.5 201.4,52 211.6,52.5 221.3,54 230,56.3 237.8,59.4 244.5,63 250.5,67 255.7,71.3 260.3,75.8 264.6,80.5 268.6,85.2 272.4,90.1 276.1,95 279.8,99.9 283.6,104.8 287.6,109.5 291.9,114.2 296.6,118.7 301.8,123 307.7,127 314.5,130.6 322.2,133.7 331,136" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="20.7,137.5 30.9,138 41.1,137.5 50.7,136 59.5,133.7 67.2,130.6 74,127 79.9,123 85.1,118.7 89.8,114.2 94.1,109.5 98.1,104.8 101.9,99.9 105.6,95" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="105.6,95 109.3,90.1 113.1,85.2 117.1,80.5 121.4,75.8 126,71.3 131.3,67 137.2,63 143.9,59.4 151.7,56.3 160.4,54 170.1,52.5 180.3,52 190.5,52.5 200.2,54 208.9,56.3 216.7,59.4 223.5,63 229.4,67 234.6,71.3 239.3,75.8 243.5,80.5 247.5,85.2 251.3,90.1 255,95 258.8,99.9 262.6,104.8 266.5,109.5 270.8,114.2 275.5,118.7 280.7,123 286.6,127 293.4,130.6 301.1,133.7 309.9,136 319.6,137.5 329.8,138 340,137.5" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="29.6,136 38.4,133.7 46.2,130.6 52.9,127 58.8,123 64,118.7 68.7,114.2 73,109.5 77,104.8 80.8,99.9 84.5,95" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="105.6" y1="100" x2="126.7" y2="100" stroke="#1f2a44" stroke-width="1"/>
  <text x="116" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">23.7°</text>
</svg>
```
:::

::: context sun-synchronous Using the bulge on purpose
Tilt an orbit slightly past the pole, near 97 to 98 degrees for low orbits, and Earth's bulge swivels its plane eastward by about 0.99 degrees a day, once around per year. The plane then keeps the same angle to the Sun all year, so the satellite crosses each latitude at the same local solar time every day. Earth-imaging satellites love this: every picture has similar lighting. At 500 km the needed inclination works out to 97.4 degrees.
:::

::: context elevation-mask Why not track to the horizon?
Near the horizon the radio path runs through much more air, the signal is weaker, and hills, trees and buildings block the view. So each antenna has a mask, sometimes a single number like 10 degrees, sometimes a full profile that is higher in the directions of nearby obstacles. The picture shows the geometry: the satellite counts as visible only above the mask line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M10,150 Q180,120 350,150" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="135" r="4" fill="#1f2a44"/>
  <text x="180" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">ground station</text>
  <line x1="180" y1="135" x2="340" y2="135" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="300" y="130" font-size="11" fill="#6c7a93">horizon</text>
  <line x1="180" y1="135" x2="337.6" y2="107.2" stroke="#b4232c" stroke-width="1.5"/>
  <text x="250" y="108" font-size="11" fill="#b4232c">10° mask</text>
  <path d="M40,60 Q180,15 320,60" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="110" cy="40" r="5" fill="#1d6fd1"/>
  <text x="120" y="30" font-size="11" fill="#1d6fd1">satellite path</text>
  <line x1="180" y1="135" x2="110" y2="40" stroke="#1d6fd1" stroke-width="1"/>
</svg>
```
:::

::: context tle The orbit in two lines of text
A two-line element set, or TLE, is a fixed-width text format: two 69-character lines holding an object's orbit at one epoch. The U.S. Space Force publishes TLEs for tracked objects, and sites such as CelesTrak redistribute them. The numbers in a TLE are not plain Keplerian elements; they are tuned for the SGP4 model, which includes Earth's bulge and a simple drag term. So a TLE should always be propagated with SGP4, which is what `satellite` does when you hand it one.
:::
