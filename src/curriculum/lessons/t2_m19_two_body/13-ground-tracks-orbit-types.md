---
id: l13-ground-tracks-orbit-types
title: Ground tracks and the named orbit types
minutes: 24
covers:
  - ground tracks and orbit types: LEO, MEO, GEO, GTO, SSO, Molniya, frozen
---

Picture a spinning playground merry-go-round, and a bird flying a steady circle high above it. The bird's circle does not care about the merry-go-round. But a kid riding it sees the bird trace a strange looping path across the sky, because the kid is turning too.

A satellite is the bird. Its orbit is fixed against the stars, but the people who use it live on a turning planet. The **ground track** — the path traced on the map by the point directly beneath the satellite — is where the orbit meets the mission. It decides which cities a communications satellite can see, how often a camera satellite flies over the same field, and when a ground station gets its pass. Drawing one needs only one new ingredient: how far Earth has turned at a given instant. Everything else is the two-body motion you already have.

Around the ground track sit the named orbit families that real spaceflight uses: LEO, MEO, GEO, GTO, sun-synchronous, Molniya and frozen. Each is chosen because Earth's spin, Earth's slightly squashed shape and the two-body geometry combine into something useful — a point that never moves, a plane that keeps pace with the Sun, a high point that stays over the north. Two of those families exist only because of Earth's squashed shape, so this lesson quotes the two rates it needs. Their derivation belongs to the perturbations module.

The plan: position to longitude and latitude, the shape of a track, then each orbit type by its numbers.

## From inertial position to a point on the ground

### Two frames that share an axis

The **ECI** frame (Earth-centred inertial) from the elements lesson has its $x$-axis, $\hat{\mathbf{I}}$, pointing toward the **[[vernal equinox|vernal-equinox]]**, a fixed direction among the stars. The **ECEF** frame (Earth-centred, Earth-fixed) shares the same $z$-axis through the North Pole. But its $x$-axis points at the Greenwich meridian — longitude zero — and it turns with the planet.

How fast does it turn? Relative to the stars, Earth spins eastward at

$$
\omega_E = 7.292\,115\,9 \times 10^{-5}\,\mathrm{rad/s},
$$

read "omega sub E". That is one full turn per **[[sidereal day|sidereal-day]]** — one turn measured against the stars — which lasts $86\,164.09\,\mathrm{s}$. That is about four minutes shorter than the $86\,400\,\mathrm{s}$ solar day on your clock.

### Longitude and latitude

The angle from $\hat{\mathbf{I}}$ eastward to the Greenwich meridian is called **Greenwich mean sidereal time**, $\theta_g$ ("theta sub g"). Think of it as the reading on a dial that tells you how far Earth has turned.

Now take an inertial position $\mathbf{r} = (x, y, z)$. The satellite's angle around the equator measured from $\hat{\mathbf{I}}$ is its **right ascension**, $\operatorname{atan2}(y, x)$. Its **longitude** is that angle minus the angle Greenwich has turned:

$$
\lambda = \operatorname{atan2}(y, x) - \theta_g, \qquad \text{wrapped to } (-180^\circ, 180^\circ],
$$

with east counted positive. Its **geocentric latitude** — the angle up from the equator, measured at Earth's centre — is

$$
\phi' = \arcsin\frac{z}{r}.
$$

Maps use a slightly different latitude. Earth is a little fatter at the equator than through the poles, so "straight down" at a spot on the ground does not point exactly at the centre. **[[Geodetic latitude|geodetic]]** $\phi$ is measured from that local "straight down" line, the normal to the reference ellipsoid. With flattening $f = 1/298.257\,223\,563$ (how much the ellipsoid is squashed), the two are related for a point on the surface by

$$
\tan\phi = \frac{\tan\phi'}{(1 - f)^2}.
$$

They differ by up to $0.19^\circ$ at mid-latitudes. For a satellite high above the surface the correction is a little smaller and depends on altitude. It is not negligible: $0.1^\circ$ of latitude is $11\,\mathrm{km}$ on the ground, which matters for pointing an antenna or a camera.

### Greenwich sidereal time

The dial $\theta_g$ advances at $\omega_E$. Astronomers give it as a formula in time. The standard version (IAU 1982) takes the **[[Julian date|julian-date]]** $\mathrm{JD}$ of the instant — a running count of days — and first forms $T$, the number of centuries of $36\,525$ days since the reference epoch J2000.0:

$$
T = \frac{\mathrm{JD} - 2\,451\,545.0}{36\,525}.
$$

(Strictly the formula wants the time scale UT1. UTC stays within $0.9\,\mathrm{s}$ of it, which is within $0.004^\circ$ of Earth's turn, so UTC is fine here.) Then, in seconds of time,

$$
\theta_g = 67\,310.548\,41 + \left(876\,600 \times 3600 + 8\,640\,184.812\,866\right)T + 0.093\,104\,T^2 - 6.2 \times 10^{-6}\,T^3 .
$$

Throw away whole days by taking the remainder after dividing by $86\,400$. Then divide by $240$ to get degrees, because $86\,400\,\mathrm{s}$ of sidereal time is $360^\circ$ and $86\,400/360 = 240$. The first constant is the sidereal time at J2000.0: $18^{\mathrm{h}}\,41^{\mathrm{m}}\,50.548^{\mathrm{s}}$, which is $280.4606^\circ$.

For the Julian date of a calendar instant — year $Y$, month $M$, day $D$, and time $h{:}m{:}s$ — a compact formula works from 1900 to 2100. The brackets $\lfloor\;\rfloor$ mean "round down to a whole number":

$$
\mathrm{JD} = 367Y - \left\lfloor\frac{7\left(Y + \lfloor (M + 9)/12 \rfloor\right)}{4}\right\rfloor + \left\lfloor\frac{275M}{9}\right\rfloor + D + 1\,721\,013.5 + \frac{h + m/60 + s/3600}{24}.
$$

For 2026 September 22 at 12:00:00 UTC it gives $\mathrm{JD} = 2\,461\,306.0$.

::: example The sub-satellite point of the ISS-like state
Take the ISS-like state from earlier lessons, $\mathbf{r} = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$, at 2026-09-22 12:00:00 UTC.

**Step 1: centuries since J2000.** $T = (2\,461\,306.0 - 2\,451\,545.0)/36\,525 = 9761/36\,525 = 0.267\,241\,6$.

**Step 2: sidereal time in seconds.** The big coefficient is $876\,600 \times 3600 + 8\,640\,184.81 = 3\,164\,400\,184.81$. So

$$
\theta_g = 67\,310.548 + 3\,164\,400\,184.81 \times 0.267\,241\,6 + 0.0066 = 845\,726\,727.5\,\mathrm{s}.
$$

**Step 3: keep the part of a day.** $845\,726\,727.5$ divided by $86\,400$ leaves a remainder of $43\,527.5\,\mathrm{s}$. Divide by $240$: $\theta_g = 181.365^\circ$, or $12.091$ hours.

**Sanity check.** At noon at Greenwich the Sun is overhead there. Near the September equinox the Sun sits at right ascension $180^\circ$. So Greenwich must be pointing close to $180^\circ$ — about $12$ hours of sidereal time — and the equinox is within a day of this date. It fits.

**Step 4: right ascension.** $\operatorname{atan2}(-3989.573, -2267.240) = 240.391^\circ$. Both $x$ and $y$ are negative, so the answer is in the third quadrant, between $180^\circ$ and $270^\circ$, as it should be.

**Step 5: longitude.** $240.391^\circ - 181.365^\circ = 59.03^\circ$ east.

**Step 6: latitude.** $r = 6787.470\,\mathrm{km}$, so $\phi' = \arcsin(5001.268/6787.470) = 47.46^\circ$ north. The surface formula turns this into a geodetic $47.65^\circ$; the exact calculation for a point $421\,\mathrm{km}$ up gives $47.64^\circ$ north.

The station is over western Kazakhstan, north-west of the Aral Sea. Its velocity from the earlier lessons, $(5.0098, -5.4258, -2.0540)\,\mathrm{km/s}$, has $\dot{z} < 0$, so it is heading south, and toward the east. Repeat this at every step of a propagation, plot each $(\lambda, \phi)$, and you have the ground track.
:::

## What a ground track looks like

### A wave between two latitudes

For a nearly circular inclined orbit, the track is a wave that swings between latitude $-i$ and $+i$. The reason is one short formula:

$$
\sin\phi' = \sin i\,\sin u,
$$

where $u$ is the **argument of latitude** — the angle travelled along the orbit from the ascending node. As $u$ runs from $0^\circ$ to $360^\circ$, $\sin u$ swings between $-1$ and $+1$, so $\sin\phi'$ swings between $\pm\sin i$. For a **retrograde** orbit ($i > 90^\circ$) the band is $\pm(180^\circ - i)$ instead.

::: note Why it has to be true
Put the satellite in its orbit plane at angle $u$ from the ascending node, on a circle of radius $r$. Along the node line it is $r\cos u$; across it, still in the plane, it is $r\sin u$. The plane is tilted by $i$ about the node line, so the across-part rises out of the equator by the factor $\sin i$: the height above the equatorial plane is $z = r\sin u\,\sin i$. Divide by $r$: $\sin\phi' = z/r = \sin i\,\sin u$.
:::

### Each pass lands farther west

The wave is not a pure sine in longitude, and it does not close on itself. While the satellite goes once around, Earth turns eastward underneath it by $\omega_E T$, where $T$ is the orbit period. So each new ascending-node crossing lands **[[farther west on the map|track-wave]]**. For the ISS, with $T = 5569.4\,\mathrm{s}$:

$$
\Delta\lambda = \omega_E\,T = 7.2921 \times 10^{-5} \times 5569.4 = 0.4061\,\mathrm{rad} = 23.27^\circ .
$$

Earth's squashed shape adds a slow backward drift of the orbit plane, $\dot{\Omega} = -4.96^\circ$ per day for the ISS (the formula is below). Over one $5569\,\mathrm{s}$ orbit that moves the node another $0.32^\circ$ west, for a total of $23.59^\circ$ per orbit.

The ISS makes $15.51$ revolutions a day, so after a day the pattern nearly repeats, drifting slowly. Changing $a$ by a few kilometres changes the period enough to make the repeat exact. That is how imaging satellites are placed on **repeating grids** of ground tracks.

### Tracks that stand still or loop

When the satellite moves east more slowly than the ground beneath it, the track runs backward — westward — near the equator. A **geostationary** satellite is the extreme case. Its angular rate equals $\omega_E$, so its longitude never changes and its whole track is a single point.

Small errors turn that point into recognisable shapes:

- **An inclination $i$** makes the point swing north and south by $\pm i$ once a day, and east and west by $\pm i^2/4$ (with $i$ in radians). Together these trace a figure eight. For $i = 3^\circ$ that is $\pm 3^\circ$ of latitude and $\pm 0.039^\circ$ of longitude.
- **An eccentricity $e$** makes the longitude rock back and forth by $\pm 2e$ radians once a day, as the satellite runs ahead of and then behind the steadily turning Earth. $e = 0.001$ gives $\pm 0.115^\circ$.
- **A semi-major axis error** changes the period. From $T \propto a^{3/2}$, a small change gives $\Delta T/T = \tfrac{3}{2}\Delta a/a$. Being $1\,\mathrm{km}$ too high lengthens the day-long period by $\tfrac{3}{2} \times 86\,164/42\,164 = 3.07\,\mathrm{s}$. The satellite then falls behind by $360^\circ \times 3.07/86\,164 = 0.0128^\circ$ per day — a slow drift west.

Holding those three numbers small is the job called **[[station-keeping|station-keeping]]**.

## The two oblateness rates you need

Earth is not a perfect ball. It has an **[[equatorial bulge|bulge]]** — a belt of extra mass around the middle. That bulge tugs a satellite slightly toward the equator. Like a push on the rim of a spinning top, the tug makes the orbit plane slowly swing around the pole. A related effect turns the long axis of the ellipse within the plane.

The size of the bulge enters through one number, the **oblateness coefficient** $J_2 = 1.082\,63 \times 10^{-3}$ ("J two"). To first order in $J_2$, the average (**secular**) rates are

$$
\dot{\Omega} = -\frac{3}{2}\,n\,J_2\left(\frac{R}{p}\right)^2\cos i, \qquad
\dot{\omega} = \frac{3}{4}\,n\,J_2\left(\frac{R}{p}\right)^2\left(5\cos^2 i - 1\right),
$$

with $n$ the mean motion, $R = 6378.137\,\mathrm{km}$ and $p = a(1 - e^2)$. $\dot{\Omega}$ ("Omega dot") is how fast the node moves; $\dot{\omega}$ ("omega dot") is how fast the periapsis turns within the plane.

These are quoted, not derived — the perturbations module does that. But you can read two facts straight off them:

- **The node drifts backward** — westward — for prograde orbits ($\cos i > 0$), and stands still for a polar orbit ($\cos i = 0$).
- **The periapsis stops turning** where $5\cos^2 i = 1$. That is at $i = \arccos(1/\sqrt{5}) = 63.435^\circ$, and also at $116.565^\circ$. This is the **critical inclination**.

Two orbit families are built entirely around these facts.

## The orbit types

### LEO — low Earth orbit

Roughly $200$ to $2000\,\mathrm{km}$ altitude, periods from $88$ to $127\,\mathrm{min}$, speeds near $7.7\,\mathrm{km/s}$. The ISS at about $413\,\mathrm{km}$ and $51.6^\circ$ is the classic example. Most Earth-observation satellites and many communications constellations live here.

Air drag matters below about $600\,\mathrm{km}$. The ISS loses tens of metres of altitude per day and fires its engines now and then to climb back up (a **reboost**). And for anything beyond rough planning, the two-body model needs $J_2$ added within a day.

### MEO — medium Earth orbit

Between LEO and GEO. The navigation constellations live here. GPS satellites fly at $a = 26\,560\,\mathrm{km}$ ($20\,180\,\mathrm{km}$ altitude) with a period of $11\,\mathrm{h}\,58\,\mathrm{min}$ — half a sidereal day, so each satellite's ground track repeats every day. They sit at $55^\circ$ inclination in six planes.

### GEO — geostationary orbit

Circular, equatorial, $a = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, period one sidereal day. The radius follows from $T = 2\pi\sqrt{a^3/\mu}$, as the Kepler's-laws lesson showed. The ground track is a point on the equator.

A **geosynchronous** orbit has the same period but a nonzero $i$ or $e$. It traces the figure eight or the east–west rocking described above.

From one GEO slot, about $42\,\%$ of Earth's surface is above the horizon — a bit over a third once you require the satellite to stand at least $10^\circ$ above the horizon. Three slots spaced around the equator cover everything except the polar caps.

### GTO — geostationary transfer orbit

The ellipse a launcher delivers a GEO satellite to. Its perigee is in LEO ($250\,\mathrm{km}$ in this module's example) and its apogee is at GEO radius. That gives $a = 24\,396\,\mathrm{km}$, $e = 0.728$ and a period of $10.5\,\mathrm{h}$.

Its inclination is inherited from the launch site: about $28.5^\circ$ from Cape Canaveral and about $6^\circ$ from Kourou. That tilt has to be removed at apogee, along with the $1.47\,\mathrm{km/s}$ needed to make the orbit circular. That is why **[[equatorial launch sites|launch-latitude]]** are prized for GEO missions.

The apogee burn is placed at a node, so one burn both circularises and removes the tilt. The perigee is therefore at the opposite node: $\omega = 180^\circ$ or $0^\circ$.

### SSO — sun-synchronous orbit

As Earth goes around the Sun, the Sun's direction creeps eastward around the sky by $360^\circ$ every $365.2422$ days. That is $0.9856^\circ$ per day, or $1.991 \times 10^{-7}\,\mathrm{rad/s}$.

Now suppose the node also moves eastward at exactly that rate. Then the orbit plane keeps the same angle to the Sun all year. The satellite crosses every latitude at the **[[same local solar time|local-time]]** on every pass.

Eastward node motion needs $\dot{\Omega} > 0$, so $\cos i < 0$: a retrograde orbit, tipped a little past polar. Set $\dot{\Omega} = +1.991 \times 10^{-7}\,\mathrm{rad/s}$ in the node formula and solve for $\cos i$:

$$
\cos i = -\frac{2\,\dot{\Omega}}{3\,n\,J_2\,(R/p)^2} .
$$

Steady lighting is what imaging and weather satellites want. Shadows are always the same length, so pictures from different days can be compared. Or a **dawn–dusk** orbit rides the line between day and night and keeps its solar arrays lit. So nearly every Earth-observation mission is sun-synchronous.

::: example The inclination of a 700 km sun-synchronous orbit
Take a circular orbit $700\,\mathrm{km}$ up.

**Step 1: size.** $a = p = 6378.137 + 700 = 7078.137\,\mathrm{km}$ (circular, so $p = a$).

**Step 2: mean motion.** $n = \sqrt{\mu/a^3} = \sqrt{398\,600.4418/7078.137^3} = 1.06021 \times 10^{-3}\,\mathrm{rad/s}$.

**Step 3: the bulge factor.** $(R/a)^2 = (6378.137/7078.137)^2 = 0.81199$.

**Step 4: solve for $\cos i$.**

$$
\cos i = -\frac{2 \times 1.9911 \times 10^{-7}}{3 \times 1.06021 \times 10^{-3} \times 1.08263 \times 10^{-3} \times 0.81199} = -\frac{3.9822 \times 10^{-7}}{2.7961 \times 10^{-6}} = -0.14242 .
$$

**Step 5: the angle.** $i = \arccos(-0.14242) = 98.19^\circ$. The period is $2\pi/n = 98.8\,\mathrm{min}$.

**Sanity check.** The answer is just past $90^\circ$ — retrograde by $8.2^\circ$ — as the argument above said it must be. The needed rate is small next to the largest rate $J_2$ could give, so $\cos i$ is only a little below zero.

Higher orbits need a bit more tilt, because $n(R/a)^2 \propto a^{-7/2}$ shrinks with height: $97.0^\circ$ at $400\,\mathrm{km}$, $97.8^\circ$ at $600$, $98.6^\circ$ at $800$ and $99.5^\circ$ at $1000\,\mathrm{km}$.
:::

### Molniya orbit

A **[[Molniya orbit|molniya]]** is a stretched, half-sidereal-day orbit at the critical inclination. It is designed so the satellite spends most of each orbit high over the northern hemisphere.

- The period $T = 43\,082\,\mathrm{s}$ gives $a = 26\,562\,\mathrm{km}$.
- A $500\,\mathrm{km}$ perigee gives $e = 0.741$ and an apogee altitude of $39\,870\,\mathrm{km}$.
- $i = 63.4^\circ$ makes $\dot{\omega} = 0$, so the apogee stays where it is put.
- It is put at $\omega = 270^\circ$. Then perigee is the southernmost point of the orbit and apogee is the northernmost, and it stays over the north indefinitely.

Because the period is half a day, successive apogees alternate between two longitudes $180^\circ$ apart — historically over Russia and North America. The ground track shows two tight loops at high northern latitude, where the satellite hangs almost still near apogee. A 24-hour version at the same inclination is called the **Tundra orbit**.

::: example How long a Molniya satellite spends near apogee
Take $e = 0.741$. Consider true anomaly from $90^\circ$ to $270^\circ$ — the half of the orbit, by angle, that contains apogee. With $\omega = 270^\circ$, that is $u$ from $0^\circ$ to $180^\circ$: exactly the part north of the equator.

**Step 1: the eccentric anomaly at $\nu = 90^\circ$.** Use $\cos E = (e + \cos\nu)/(1 + e\cos\nu)$. With $\cos 90^\circ = 0$ this is $\cos E = e$, so $E_1 = \arccos 0.741 = 42.18^\circ = 0.7362\,\mathrm{rad}$. By symmetry the other end is $360^\circ - E_1$.

**Step 2: the mean anomaly there.** Kepler's equation: $M_1 = E_1 - e\sin E_1 = 0.7362 - 0.741 \times 0.6716 = 0.2386\,\mathrm{rad}$. The other end is $2\pi - M_1$.

**Step 3: the fraction of time.** Mean anomaly grows evenly in time, so the fraction of the period is

$$
\frac{2\pi - 2M_1}{2\pi} = 1 - \frac{0.2386}{\pi} = 0.924 .
$$

The satellite is on the apogee half for $92.4\,\%$ of the time: $11.06$ of every $11.97$ hours.

**Step 4: time above $20\,000\,\mathrm{km}$.** First $p = a(1 - e^2) = 26\,562 \times 0.4509 = 11\,977\,\mathrm{km}$. The orbit equation solved for the angle gives $\cos\nu = (p/r - 1)/e$, so at $r = 20\,000\,\mathrm{km}$, $\nu = 122.8^\circ$. Running the same three steps from there gives $9.94\,\mathrm{h}$ per orbit above that radius.

**Sanity check.** Half the orbit by angle takes more than nine tenths of the time — the second law says a satellite dawdles far from the planet. Two or three satellites in such orbits give non-stop high-latitude coverage that GEO cannot.
:::

### Frozen orbit

The bulge also makes $e$ and $\omega$ wobble. The next coefficient, $J_3 = -2.533 \times 10^{-6}$, describes a slight **[[north–south lopsidedness|pear-shape]]** of Earth. It drives a slow, long-period swing of the eccentricity vector.

Choose $\omega = 90^\circ$ and one particular small eccentricity,

$$
e_f \approx -\frac{J_3}{2J_2}\,\frac{R}{a}\,\sin i ,
$$

and the $J_2$ and $J_3$ effects on $\dot{e}$ and $\dot{\omega}$ cancel on average. The eccentricity vector stays put. Perigee stays over the same latitude, and the altitude over each point on the ground repeats orbit after orbit.

For the $700\,\mathrm{km}$ SSO above: $-J_3/(2J_2) = 1.1697 \times 10^{-3}$, $R/a = 0.9011$ and $\sin 98.19^\circ = 0.9898$. Multiplying, $e_f = 1.1697 \times 10^{-3} \times 0.9011 \times 0.9898 = 0.00104$. That is a $2ae_f \approx 15\,\mathrm{km}$ difference between perigee and apogee, held fixed. Altimetry and repeat-imaging missions fly frozen orbits for this reason; when the orbit is also sun-synchronous they get constant lighting *and* constant altitude at each latitude.

::: key Orbit types by the numbers
LEO $200$–$2000\,\mathrm{km}$, $T \approx 90\,\mathrm{min}$. MEO: GPS at $a = 26\,560\,\mathrm{km}$, $T = 11\,\mathrm{h}\,58\,\mathrm{min}$. GEO: $a = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, $T = 86\,164\,\mathrm{s}$. GTO: $250 \times 35\,786\,\mathrm{km}$, $e = 0.73$, $T = 10.5\,\mathrm{h}$. SSO: $\dot{\Omega} = +0.9856^\circ/\mathrm{day}$, $i \approx 98^\circ$ at $700\,\mathrm{km}$. Molniya: $T = 12\,\mathrm{h}$, $e \approx 0.74$, $i = 63.4^\circ$ (critical, $\dot{\omega} = 0$), $\omega = 270^\circ$. Frozen: $\omega = 90^\circ$, $e_f \approx -(J_3/2J_2)(R/a)\sin i \approx 0.001$.
:::

## Computing a ground track

Here is the whole recipe in a few lines of Python. `gmst_deg` is the sidereal-time formula; `subpoint` turns an ECI position into longitude and latitude.

```python
import numpy as np

def gmst_deg(jd):
    T = (jd - 2451545.0) / 36525.0
    s = 67310.54841 + (876600 * 3600 + 8640184.812866) * T + 0.093104 * T**2 - 6.2e-6 * T**3
    return (s % 86400.0) / 240.0

def subpoint(r_eci, jd):
    lon = (np.degrees(np.arctan2(r_eci[1], r_eci[0])) - gmst_deg(jd) + 540.0) % 360.0 - 180.0
    lat = np.degrees(np.arcsin(r_eci[2] / np.linalg.norm(r_eci)))     # geocentric
    return lon, lat

r = np.array([-2267.240, -3989.573, 5001.268])
print(gmst_deg(2461306.0), subpoint(r, 2461306.0))   # 181.365  (59.03, 47.46)
```

The `+ 540.0) % 360.0 - 180.0` part does the wrapping: it lands every longitude between $-180^\circ$ and $+180^\circ$.

To draw a track, propagate the state (analytically, or with the $f$ and $g$ coefficients) in one-minute steps. Advance the Julian date by $60/86\,400$ each step and collect the sub-points. Break the line wherever the longitude jumps across $\pm 180^\circ$, or the plot gets crossed by long horizontal streaks.

::: warning Sidereal, not solar, and inertial, not Earth-fixed
The Earth-fixed frame turns $360^\circ$ in a sidereal day, not a solar day. Using $2\pi/86\,400$ for $\omega_E$ piles up $0.986^\circ$ of longitude error per day. And the two-body equation holds only in the inertial frame. Never integrate it in ECEF without the Coriolis and centrifugal terms from the rotating-frames module. Propagate in ECI, and rotate afterwards.
:::

::: warning Geocentric and geodetic latitude
$\arcsin(z/r)$ is geocentric latitude. Coordinates on maps, in ground-station databases and in image metadata are geodetic. The difference peaks at $0.19^\circ$ — about $21\,\mathrm{km}$ on the ground — near $45^\circ$ latitude, and vanishes at the equator and the poles. A ground track plotted with geocentric latitude looks fine and is wrong by the width of a city.
:::

## Check yourself

::: check
A satellite in a circular $800\,\mathrm{km}$ orbit at $i = 98.6^\circ$ crosses the equator northbound at $30^\circ\,\mathrm{E}$. Ignoring the node drift, at what longitude does it next cross northbound? What is the highest latitude its track reaches?
:::

::: answer
**Period.** $a = 6378.137 + 800 = 7178.137\,\mathrm{km}$, so $T = 2\pi\sqrt{a^3/\mu} = 6052\,\mathrm{s}$.

**Earth's turn.** In that time Earth turns $\omega_E T = 7.2921 \times 10^{-5} \times 6052 = 0.4413\,\mathrm{rad} = 25.3^\circ$ eastward. So the next northbound crossing is $25.3^\circ$ farther *west*: $30^\circ - 25.3^\circ = 4.7^\circ\,\mathrm{E}$.

(Including the sun-synchronous node drift of $+0.9856^\circ$ per day, which is eastward, shrinks the shift by $0.9856 \times 6052/86\,400 = 0.07^\circ$ per orbit.)

**Highest latitude.** The orbit is retrograde, so the band is $\pm(180^\circ - 98.6^\circ) = \pm 81.4^\circ$. The track reaches $81.4^\circ$ north and south.
:::

::: check
Why must a sun-synchronous orbit be retrograde?
:::

::: answer
The node has to move *eastward*, at $+0.9856^\circ$ per day, to keep up with the Sun's apparent motion around the sky.

The bulge gives $\dot{\Omega} = -\tfrac{3}{2}nJ_2(R/p)^2\cos i$. Everything in front of $\cos i$ is positive, and there is a minus sign. So $\dot{\Omega}$ is negative (westward) when $\cos i > 0$, and positive (eastward) only when $\cos i < 0$ — that is, when $i > 90^\circ$.

So the inclination must be above $90^\circ$. Only slightly above, because the needed rate is small compared with the largest rate, $\tfrac{3}{2}nJ_2(R/p)^2$, that an orbit in the equator plane would have.
:::

::: check
A GEO satellite is drifting east at $0.05^\circ$ per day. Is its semi-major axis too large or too small, and by how much?
:::

::: answer
**Direction.** Drifting east means the satellite is running ahead of Earth. Its period is shorter than a sidereal day, so $a$ is too *small*.

**Size.** Each kilometre of error gives $0.0128^\circ$ per day. So the error is $0.05/0.0128 = 3.9\,\mathrm{km}$ too low.

**The fix.** Raise the orbit by $3.9\,\mathrm{km}$. For a near-circular orbit a small tangential burn changes $a$ by $\Delta a/a \approx 2\Delta v/v_c$, so $\Delta v \approx \tfrac{1}{2}v_c\,\Delta a/a = 0.5 \times 3.075 \times 3.9/42\,164 = 1.4 \times 10^{-4}\,\mathrm{km/s}$ — about $0.14\,\mathrm{m/s}$. That stops the drift.
:::

::: check
Why is the Molniya inclination $63.4^\circ$ and not, say, $60^\circ$ or $70^\circ$?
:::

::: answer
The apsidal rate is $\dot{\omega} \propto 5\cos^2 i - 1$. It is zero only when $\cos i = 1/\sqrt{5}$, which is $i = 63.435^\circ$.

At $60^\circ$: $\cos^2 60^\circ = 0.25$, so $5 \times 0.25 - 1 = 0.25 > 0$ and the perigee would creep forward. At $70^\circ$: $\cos^2 70^\circ = 0.1170$, so $5 \times 0.1170 - 1 = -0.415$ and it would creep backward.

Either way the apogee would drift out of the northern sky within months, and the whole point of the orbit — long hangs over the intended hemisphere — would be lost. The critical inclination freezes the argument of perigee.
:::

::: check
Find the Greenwich sidereal time at 2026-09-22 18:00:00 UTC, starting from $181.365^\circ$ at 12:00:00 UTC.
:::

::: answer
Six hours is $21\,600\,\mathrm{s}$. In that time Greenwich turns through

$$
\omega_E \times 21\,600 = 7.2921 \times 10^{-5} \times 21\,600 = 1.5751\,\mathrm{rad} = 90.246^\circ .
$$

That is a little more than $90^\circ$, because a sidereal day is shorter than a solar day — Earth does a bit more than a quarter turn in a quarter of a solar day.

So $\theta_g = 181.365^\circ + 90.246^\circ = 271.61^\circ$, or $18.107$ hours. The full formula gives the same answer to the last digit; its $T^2$ and $T^3$ terms change by less than $10^{-5}$ degrees over six hours.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\omega_E = 7.2921159 \times 10^{-5}\,\mathrm{rad/s}$ | Earth's rotation rate, one turn per sidereal day of $86\,164.09\,\mathrm{s}$ |
| $\theta_g$ | Greenwich mean sidereal time; $280.4606^\circ$ at J2000.0, IAU 1982 formula in $T$ |
| $\lambda = \operatorname{atan2}(y, x) - \theta_g$, $\phi' = \arcsin(z/r)$ | Sub-satellite longitude and geocentric latitude |
| $\tan\phi = \tan\phi'/(1 - f)^2$ | Geodetic latitude, up to $0.19^\circ$ different |
| $\sin\phi' = \sin i\,\sin u$ | Why the track swings between $\pm i$ |
| Westward shift per orbit | $\omega_E T$ ($23.3^\circ$ for the ISS), plus $\lvert\dot{\Omega}\rvert T$ |
| $\dot{\Omega} = -\frac{3}{2}nJ_2(R/p)^2\cos i$ | Node drift (quoted); $-4.96^\circ/\mathrm{day}$ for the ISS |
| $\dot{\omega} = \frac{3}{4}nJ_2(R/p)^2(5\cos^2 i - 1)$ | Apsidal rotation (quoted); zero at $63.435^\circ$ |
| SSO condition | $\dot{\Omega} = 0.9856^\circ/\mathrm{day}$ eastward; $i = 98.19^\circ$ at $700\,\mathrm{km}$ |
| Molniya | $a = 26\,562\,\mathrm{km}$, $e = 0.74$, $i = 63.4^\circ$, $\omega = 270^\circ$; $92\,\%$ of the period on the apogee half |
| Frozen | $\omega = 90^\circ$, $e_f \approx -(J_3/2J_2)(R/a)\sin i$ |
| GEO drift | $0.0128^\circ/\mathrm{day}$ westward per km of extra $a$ |

The final lesson reads the elements of a real satellite from the two-line element format in which they are published. It explains why those are mean elements that need the SGP4 propagator, and it closes the module by reproducing a ground track from a TLE.

::: context vernal-equinox A direction pinned to the sky
The **vernal equinox** is the direction from Earth to the Sun on the March equinox, when the Sun crosses the equator heading north. Seen against the stars, that direction points into the constellation Pisces today.

It makes a good $x$-axis because it belongs to the sky, not the ground: Earth spins under it, but it barely moves. "Barely" is honest — Earth's axis wobbles like a slowing top, so the equinox slides about $50$ arcseconds a year. That is why frames carry a date, like "J2000".
:::

::: context sidereal-day Why the star day is four minutes short
In one day Earth also moves about $1^\circ$ along its path around the Sun. After one full turn against the stars, the Sun is not quite back overhead. Earth has to turn about $1^\circ$ more — roughly four minutes — to bring noon around again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="140" r="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="173" font-size="12" text-anchor="middle" fill="#1f2a44">Sun</text>
  <path d="M 200 140 A 140 140 0 0 0 181.2 70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="200" cy="140" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="188" y1="140" x2="120" y2="140" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="235" y="145" font-size="12" fill="#1f2a44">day 1, noon</text>
  <circle cx="181.2" cy="70" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="169.2" y1="70" x2="110" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="170.8" y1="76" x2="120" y2="105.3" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="200" y="45" font-size="12" fill="#1f2a44">one turn later</text>
  <text x="20" y="60" font-size="11" fill="#1d6fd1">same star direction</text>
  <text x="20" y="120" font-size="11" fill="#b4232c">Sun: turn a bit more</text>
</svg>
```

The step along the orbit is drawn about thirty times too big so you can see it. Over a year the extra degrees add up to one whole extra turn: $366.24$ star days fit in $365.24$ solar days.
:::

::: context geodetic Two ways to measure latitude
On a squashed Earth, the line pointing "straight down" at your feet — the direction a plumb line hangs, and the normal to the ellipsoid — does not pass through the centre. **Geocentric** latitude $\phi'$ uses the line to the centre. **Geodetic** latitude $\phi$ uses the local normal, and it is a little larger at every latitude between the equator and the poles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M 20 165 A 130 91 0 0 1 280 165" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="10" y1="165" x2="300" y2="165" stroke="#6c7a93" stroke-width="1.2"/>
  <circle cx="150" cy="165" r="3" fill="#1f2a44"/>
  <text x="150" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">centre</text>
  <line x1="150" y1="165" x2="233.6" y2="95.3" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="192.6" y1="165" x2="253.8" y2="60.8" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="233.6" cy="95.3" r="3.5" fill="#1f2a44"/>
  <text x="258" y="100" font-size="12" fill="#1f2a44">you</text>
  <text x="172" y="135" font-size="12" text-anchor="end" fill="#1d6fd1">φ′ = 40°</text>
  <text x="215" y="152" font-size="12" fill="#b4232c">φ = 60°</text>
  <text x="262" y="60" font-size="11" fill="#b4232c">local vertical</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">squashing hugely exaggerated</text>
</svg>
```

Real Earth is squashed by only $1$ part in $298$, so the two angles differ by at most $0.19^\circ$, at $45^\circ$ latitude.
:::

::: context julian-date Counting days without months
Months have different lengths and years have leap days, which makes "how many days between two dates" fiddly. Astronomers avoid it with the **Julian date**: one running count of days from a starting point far back in 4713 BC. The scheme comes from the scholar Joseph Scaliger in 1583.

Julian days start at noon, not midnight — handy for astronomers observing through the night. That is why midnight dates end in $.5$ and noon on 2026 September 22 is the whole number $2\,461\,306.0$.
:::

::: context track-wave One orbit of the ISS on a flat map
Here is one ISS-like orbit drawn on a flat map. The track rises to $51.6^\circ$ north, falls to $51.6^\circ$ south, and comes back to the equator $23.3^\circ$ west of where it started, because Earth turned underneath it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="180" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <line x1="10" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="10" y1="22.5" x2="350" y2="22.5" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="10" y1="177.5" x2="350" y2="177.5" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="85.6,100.0 88.2,94.1 90.8,88.3 93.6,82.4 96.4,76.7 99.3,71.0 102.3,65.4 105.6,59.9 109.1,54.6 112.9,49.5 117.0,44.6 121.4,40.1 126.3,35.8 131.7,32.1 137.6,28.8 143.9,26.1 150.7,24.2 157.8,23.0 165.1,22.5 172.3,23.0 179.4,24.2 186.2,26.1 192.5,28.8 198.4,32.1 203.8,35.8 208.7,40.1 213.2,44.6 217.3,49.5 221.0,54.6 224.5,59.9 227.8,65.4 230.9,71.0 233.8,76.7 236.6,82.4 239.3,88.3 241.9,94.1 244.6,100.0 247.2,105.9 249.9,111.7 252.6,117.6 255.4,123.3 258.3,129.0 261.4,134.6 264.6,140.1 268.1,145.4 271.9,150.5 276.0,155.4 280.5,159.9 285.4,164.2 290.7,167.9 296.6,171.2 302.9,173.9 309.7,175.8 316.8,177.0 324.1,177.5 331.3,177.0 338.4,175.8 345.2,173.9 350,171.8"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="10,171.8 11.6,171.2 17.4,167.9 22.8,164.2 27.7,159.9 32.2,155.4 36.3,150.5 40.0,145.4 43.5,140.1 46.8,134.6 49.9,129.0 52.8,123.3 55.6,117.6 58.3,111.7 60.9,105.9 63.6,100.0"/>
  <circle cx="85.6" cy="100" r="3.5" fill="#1f2a44"/>
  <circle cx="63.6" cy="100" r="3.5" fill="#b4232c"/>
  <text x="96" y="115" font-size="11" fill="#1f2a44">start</text>
  <text x="30" y="92" font-size="11" fill="#b4232c">next</text>
  <text x="74.6" y="204" font-size="11" text-anchor="middle" fill="#b4232c">23.3° west</text>
  <text x="14" y="36" font-size="11" fill="#1f2a44">51.6° N</text>
  <text x="190" y="172" font-size="11" fill="#1f2a44">51.6° S</text>
</svg>
```

The line leaves the right edge and comes back on the left: the map wraps at $180^\circ$ longitude. That wrap is the break the code must handle.
:::

::: context station-keeping Keeping a satellite in its box
A GEO operator is given a slot — a longitude — and must keep the satellite inside a small box around it, commonly about $\pm 0.05^\circ$ to $\pm 0.1^\circ$ in longitude and latitude. Neighbours sit a fraction of a degree away, and dish antennas on the ground point at a fixed spot.

The Sun and Moon keep pulling the inclination up, by close to $1^\circ$ a year, and Earth's lumpy gravity makes the longitude drift. So thrusters fire every week or two. The fuel for this usually decides how long a GEO satellite lives.
:::

::: context bulge How big the bulge is
Earth's equatorial radius is $6378.137\,\mathrm{km}$ and its polar radius is $6356.752\,\mathrm{km}$: a difference of $21.4\,\mathrm{km}$, caused by the planet's spin flinging the middle outward.

That sounds tiny — one part in $298$ — and it is. But a satellite goes around about fifteen times a day, and the small tug adds up orbit after orbit. That is why $J_2$ moves the ISS's orbit plane by about $5^\circ$ every day. $J_2$ is by far the biggest correction to the two-body model near Earth; the next terms are several hundred times smaller.
:::

::: context launch-latitude Why rockets like to launch near the equator
A rocket's orbit plane has to pass through the launch site, so the lowest inclination it can reach directly equals the site's latitude. Cape Canaveral sits at about $28.5^\circ$ north, so GTOs from there start tilted about $28.5^\circ$. Kourou in French Guiana sits at about $5^\circ$ north, and its GTOs are tilted about $6^\circ$.

Taking out a tilt is expensive, so a satellite launched from near the equator saves fuel it can spend on years of station-keeping instead. Launch sites nearer the equator also get a bigger free push from Earth's spin.
:::

::: context local-time Always mid-morning
"Same local solar time" means the satellite sees the ground with the Sun in the same place every pass. Many imaging satellites cross the equator in mid-morning: Landsat 8 at about 10:00 and Sentinel-2 at about 10:30 local time. That is late enough for good light and early enough to beat the clouds that build up in the afternoon over land.

The name of an SSO usually includes this time, such as "a 10:30 descending-node orbit".
:::

::: context molniya Lightning over the north
**Molniya** means "lightning" in Russian. It was the name of Soviet communications satellites first launched in 1965. Much of the Soviet Union lies far north, where a GEO satellite sits low on the horizon or below it, so engineers put the satellites on a stretched orbit that hangs high over the north instead.

Seen face-on, the orbit is lopsided: a close pass under the south, a long slow arc over the north. The dashed line is where the orbit plane cuts the equator plane; north of it the satellite spends $92\,\%$ of each orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="104.6" rx="63.8" ry="95" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="175" x2="300" y2="175" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 3"/>
  <circle cx="180" cy="175" r="22.8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="179" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="9.6" r="4" fill="#b4232c"/>
  <text x="192" y="14" font-size="12" fill="#b4232c">apogee, 39 870 km up</text>
  <circle cx="180" cy="199.6" r="3" fill="#1f2a44"/>
  <text x="192" y="204" font-size="11" fill="#1f2a44">perigee, 500 km</text>
  <text x="250" y="168" font-size="11" fill="#6c7a93">equator plane</text>
  <text x="12" y="110" font-size="11" fill="#1d6fd1">92% of the time</text>
  <text x="12" y="124" font-size="11" fill="#1d6fd1">up here</text>
</svg>
```
:::

::: context pear-shape Earth is slightly pear-shaped
$J_2$ describes the equatorial bulge, which is the same north and south. $J_3$ describes a tiny difference between the hemispheres: measured from a perfect ellipsoid, Earth is very slightly pear-shaped, with the stem at the north. The effect is only tens of metres, and it was first spotted in the tracking of the early satellite Vanguard 1, launched in 1958.

Although it is about $400$ times smaller than $J_2$, $J_3$ still matters for orbits where $J_2$'s biggest effects have been cancelled — which is exactly what a frozen orbit does.
:::
