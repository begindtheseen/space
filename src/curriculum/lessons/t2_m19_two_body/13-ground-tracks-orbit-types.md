---
id: l13-ground-tracks-orbit-types
title: Ground tracks and the named orbit types
minutes: 18
covers:
  - ground tracks and orbit types: LEO, MEO, GEO, GTO, SSO, Molniya, frozen
---

An orbit is fixed in inertial space, but the customers of a satellite live on a rotating planet. The ground track – the path of the sub-satellite point over Earth's surface – is where the orbit meets the mission: which cities a communications satellite can see, how often an imager revisits a field, when a ground station gets its pass. Drawing a ground track requires one new ingredient, Earth's rotation angle at a given instant, and the two-body propagation you already have.

Around the ground track cluster the named orbit families of operational spaceflight – LEO, MEO, GEO, GTO, sun-synchronous, Molniya, frozen – each chosen because Earth's rotation, Earth's oblateness and the two-body geometry combine to give a track with a useful property: a point that never moves, a plane that keeps pace with the Sun, an apogee that stays over the north. Two of those families exist only because of the leading perturbation to two-body motion, so this lesson quotes the two oblateness rates it needs; their derivation belongs to the perturbations module.

The lesson builds the inertial-to-Earth-fixed transformation through Greenwich sidereal time, computes a sub-satellite point, explains the features of a ground track quantitatively, and then walks through each orbit type with the numbers that define it.

## From inertial position to a point on the ground

The ECI frame of the elements lesson has $\hat{\mathbf{I}}$ toward the vernal equinox. The Earth-fixed frame (ECEF) shares the same $z$-axis but its $x$-axis points to the Greenwich meridian, and it rotates eastward at

$$
\omega_E = 7.292\,115\,9 \times 10^{-5}\,\mathrm{rad/s}
$$

relative to the stars – one turn per sidereal day, $86\,164.09\,\mathrm{s}$. The angle from $\hat{\mathbf{I}}$ eastward to the Greenwich meridian is the Greenwich mean sidereal time $\theta_g$. Given an inertial position $\mathbf{r} = (x, y, z)$, the right ascension of the sub-satellite point is $\operatorname{atan2}(y, x)$, and its geographic longitude is that angle minus the angle Greenwich has turned:

$$
\lambda = \operatorname{atan2}(y, x) - \theta_g, \qquad \text{wrapped to } (-180^\circ, 180^\circ] ,
$$

positive east. The geocentric latitude is

$$
\phi' = \arcsin\frac{z}{r} .
$$

Maps use *geodetic* latitude, measured from the normal to the reference ellipsoid rather than from Earth's centre. With flattening $f = 1/298.257\,223\,563$ the two are related for a point on the surface by $\tan\phi = \tan\phi'/(1 - f)^2$, and they differ by up to $0.19^\circ$ at mid-latitudes; for a satellite the correction is smaller and altitude-dependent, but $0.1^\circ$ is $11\,\mathrm{km}$ on the ground, so it is not negligible for pointing.

### Greenwich sidereal time

$\theta_g$ increases at $\omega_E$ and is tabulated as a function of Universal Time. The standard expression (IAU 1982) takes the Julian date $\mathrm{JD}$ of the instant (strictly in UT1, but UTC is within $0.9\,\mathrm{s}$ and hence within $0.004^\circ$) and forms the Julian centuries from J2000.0, $T = (\mathrm{JD} - 2\,451\,545.0)/36\,525$; then, in seconds of time,

$$
\theta_g = 67\,310.548\,41 + \left(876\,600 \times 3600 + 8\,640\,184.812\,866\right)T + 0.093\,104\,T^2 - 6.2 \times 10^{-6}\,T^3 ,
$$

reduced modulo $86\,400$ and converted to degrees by dividing by $240$ (since $86\,400\,\mathrm{s}$ is $360^\circ$). The leading constant is the sidereal time at J2000.0, $18^{\mathrm{h}}\,41^{\mathrm{m}}\,50.548^{\mathrm{s}}$, or $280.4606^\circ$. The Julian date of a calendar instant $(Y, M, D, h, m, s)$ follows from the compact formula

$$
\mathrm{JD} = 367Y - \left\lfloor\frac{7\left(Y + \lfloor (M + 9)/12 \rfloor\right)}{4}\right\rfloor + \left\lfloor\frac{275M}{9}\right\rfloor + D + 1\,721\,013.5 + \frac{h + m/60 + s/3600}{24},
$$

valid from 1900 to 2100. For 2026 September 22 at 12:00:00 UTC it gives $\mathrm{JD} = 2\,461\,306.0$.

::: example The sub-satellite point of the ISS-like state
Take the ISS-like state $\mathbf{r} = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$ at 2026-09-22 12:00:00 UTC. Sidereal time: $T = (2\,461\,306.0 - 2\,451\,545.0)/36\,525 = 0.267\,241\,6$, so $\theta_g = 67\,310.548 + 3\,164\,400\,184.81 \times 0.267\,241\,6 + 0.0066 = 845\,726\,727.5\,\mathrm{s}$; modulo $86\,400$ that is $43\,527.5\,\mathrm{s}$, or $\theta_g = 181.365^\circ$ ($12.091^{\mathrm{h}}$). Sanity check: at noon UT on the September equinox the Sun is on the meridian of Greenwich and at right ascension $180^\circ$, so Greenwich sidereal time must be close to $12^{\mathrm{h}}$ – and the equinox falls within a day of this date.

Right ascension of the satellite: $\operatorname{atan2}(-3989.573, -2267.240) = 240.391^\circ$. Longitude: $240.391^\circ - 181.365^\circ = 59.03^\circ\,\mathrm{E}$. Geocentric latitude: $\arcsin(5001.268/6787.470) = 47.46^\circ\,\mathrm{N}$; geodetic, about $47.65^\circ\,\mathrm{N}$. The station is over the southern Urals, heading south-east (its velocity has $\dot{z} < 0$ and $\dot{y} < 0$). Repeating this at every step of a propagation and plotting $(\lambda, \phi)$ is the ground track.
:::

## What a ground track looks like

For a near-circular inclined orbit the track is a wave between latitudes $-i$ and $+i$ (or $\pm(180^\circ - i)$ for a retrograde orbit), because $\sin\phi' = \sin i\,\sin u$ with $u$ the argument of latitude. It is not a sinusoid in longitude, and it does not close on itself: while the satellite completes one revolution, Earth turns eastward beneath it by $\omega_E T$, so each successive ascending-node crossing is displaced *westward* on the map by

$$
\Delta\lambda = \omega_E\,T = 7.2921 \times 10^{-5} \times 5569.4 = 0.4061\,\mathrm{rad} = 23.27^\circ
$$

for the ISS. Earth's oblateness adds a slow regression of the node, $\dot{\Omega} = -4.96^\circ/\mathrm{day}$ for the ISS (quoted below), which shifts the track a further $0.32^\circ$ west per orbit, for a total of $23.59^\circ$. With $15.51$ revolutions per day the pattern nearly repeats after a day, drifting slowly; adjusting $a$ by a few kilometres tunes the repeat cycle exactly, which is how imaging satellites are placed on repeating grids.

The track is *retrograde in appearance* near the equator when the satellite's eastward ground speed is less than the ground's. A geostationary satellite is the extreme case: its angular rate equals $\omega_E$, its longitude is constant, and its track is a point. Perturbing that ideal produces recognisable figures. An inclination $i$ makes the point oscillate in latitude by $\pm i$ once a day and in longitude by $\pm i^2/4$ (in radians), tracing a figure of eight – for $i = 3^\circ$, $\pm 3^\circ$ of latitude and $\pm 0.039^\circ$ of longitude. An eccentricity $e$ makes the longitude librate by $\pm 2e$ radians once a day as the satellite runs ahead of and behind the uniformly turning Earth: $e = 0.001$ gives $\pm 0.115^\circ$. And a semi-major axis error changes the period: from $T \propto a^{3/2}$, $\Delta T/T = \tfrac{3}{2}\Delta a/a$, so $1\,\mathrm{km}$ too high lengthens the day-long period by $3.07\,\mathrm{s}$ and the satellite drifts west by $360^\circ \times 3.07/86\,164 = 0.0128^\circ$ per day. Station-keeping is the business of holding those three numbers.

## The two oblateness rates you need

Earth's equatorial bulge pulls a satellite slightly toward the equator, exerting a torque on its angular momentum vector that makes the orbit plane precess about the pole, and a related effect makes the line of apsides rotate within the plane. To first order in the oblateness coefficient $J_2 = 1.082\,63 \times 10^{-3}$, the secular (average) rates are

$$
\dot{\Omega} = -\frac{3}{2}\,n\,J_2\left(\frac{R}{p}\right)^2\cos i, \qquad
\dot{\omega} = \frac{3}{4}\,n\,J_2\left(\frac{R}{p}\right)^2\left(5\cos^2 i - 1\right),
$$

with $R = 6378.137\,\mathrm{km}$ and $p = a(1 - e^2)$. These are quoted, not derived – the perturbations module does that – but two features are visible immediately. The node regresses (westward for prograde orbits, $\cos i > 0$) and stands still for a polar orbit; and the apsidal rate vanishes where $5\cos^2 i = 1$, that is at $i = \arccos(1/\sqrt{5}) = 63.435^\circ$ (and $116.565^\circ$), the *critical inclination*. Two orbit families are designed entirely around these facts.

## The orbit types

**LEO – low Earth orbit**, roughly $200$ to $2000\,\mathrm{km}$ altitude, periods $88$ to $127\,\mathrm{min}$, speeds near $7.7\,\mathrm{km/s}$. The ISS at $413\,\mathrm{km}$ and $51.6^\circ$ is the archetype; most Earth-observation and many communications constellations are here. Drag is significant below about $600\,\mathrm{km}$ (the ISS loses tens of metres of altitude per day and reboosts periodically), and the two-body model needs $J_2$ within a day for anything beyond rough planning.

**MEO – medium Earth orbit**, between LEO and GEO. The navigation constellations live here: GPS at $a = 26\,560\,\mathrm{km}$ ($20\,180\,\mathrm{km}$ altitude), period $11\,\mathrm{h}\,58\,\mathrm{min}$ – half a sidereal day, so each satellite's ground track repeats daily – at $55^\circ$ inclination in six planes.

**GEO – geostationary orbit**: circular, equatorial, $a = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, period one sidereal day, from $T = 2\pi\sqrt{a^3/\mu}$ as the Kepler's-laws lesson showed. The ground track is a point on the equator. A *geosynchronous* orbit has the same period but nonzero $i$ or $e$ and traces the figure of eight or the libration described above. Roughly a third of Earth is visible from one GEO slot, and three slots cover everything but the poles.

**GTO – geostationary transfer orbit**: the ellipse a launcher delivers to, with perigee in LEO ($250\,\mathrm{km}$ in this module's example) and apogee at GEO radius: $a = 24\,396\,\mathrm{km}$, $e = 0.728$, period $10.5\,\mathrm{h}$. Its inclination is inherited from the launch site – about $28.5^\circ$ from Cape Canaveral, $6^\circ$ from Kourou – and must be removed at apogee along with the $1.47\,\mathrm{km/s}$ circularisation, which is why equatorial launch sites are prized for GEO missions. The apogee burn is placed at the node so that one manoeuvre does both jobs; the perigee is therefore put at the opposite node, $\omega = 180^\circ$ or $0^\circ$.

**SSO – sun-synchronous orbit**. If the node regresses eastward at exactly the rate the Sun's direction moves around the sky – $360^\circ$ per $365.2422$ days, or $0.9856^\circ/\mathrm{day} = 1.991 \times 10^{-7}\,\mathrm{rad/s}$ – the orbit plane keeps a fixed orientation relative to the Sun, and the satellite crosses every latitude at the same local solar time on every pass. Eastward regression requires $\cos i < 0$: a retrograde orbit just beyond polar. Setting $\dot{\Omega} = +1.991 \times 10^{-7}\,\mathrm{rad/s}$ in the node formula and solving,

$$
\cos i = -\frac{2\,\dot{\Omega}}{3\,n\,J_2\,(R/p)^2} .
$$

Constant lighting geometry is what imaging and weather satellites want (shadows always the same length, or a dawn–dusk orbit that keeps the solar arrays lit), so nearly every Earth-observation mission is sun-synchronous.

::: example The inclination of a 700 km sun-synchronous orbit
For a circular orbit at $700\,\mathrm{km}$, $a = p = 7078.137\,\mathrm{km}$, $n = \sqrt{\mu/a^3} = 1.06021 \times 10^{-3}\,\mathrm{rad/s}$, $(R/a)^2 = 0.81199$:
$$
\cos i = -\frac{2 \times 1.9911 \times 10^{-7}}{3 \times 1.06021 \times 10^{-3} \times 1.08263 \times 10^{-3} \times 0.81199} = -\frac{3.9822 \times 10^{-7}}{2.7961 \times 10^{-6}} = -0.14242 ,
$$
so $i = 98.19^\circ$. The period is $98.8\,\mathrm{min}$ and the orbit is retrograde by $8.2^\circ$. The required inclination rises with altitude because $n(R/a)^2 \propto a^{-7/2}$ shrinks: $97.0^\circ$ at $400\,\mathrm{km}$, $97.8^\circ$ at $600$, $98.6^\circ$ at $800$, $99.5^\circ$ at $1000\,\mathrm{km}$.
:::

**Molniya orbit**. A highly eccentric, half-sidereal-day orbit at the critical inclination, designed so that a satellite spends most of each orbit high over the northern hemisphere: $T = 43\,082\,\mathrm{s}$ gives $a = 26\,562\,\mathrm{km}$; a $500\,\mathrm{km}$ perigee gives $e = 0.741$ and an apogee altitude of $39\,870\,\mathrm{km}$; $i = 63.4^\circ$ makes $\dot{\omega} = 0$ so that the apogee, placed at $\omega = 270^\circ$ (the southernmost point of the orbit is perigee, so apogee is at the top), stays over the north indefinitely. Because the period is half a day, the apogee alternates between two longitudes $180^\circ$ apart – historically over Russia and North America – and the ground track shows two tight loops at high northern latitude where the satellite hangs almost stationary near apogee. A 24-hour version at the same inclination is the Tundra orbit.

::: example How long a Molniya satellite spends near apogee
With $e = 0.741$, the true anomaly range $90^\circ$ to $270^\circ$ – the half of the orbit by angle that contains apogee – corresponds by Kepler's equation to eccentric anomaly from $E_1 = \arccos e = 42.18^\circ$ (since $\cos E = (e + \cos\nu)/(1 + e\cos\nu) = e$ at $\nu = 90^\circ$) to $360^\circ - E_1$, and mean anomaly from $M_1 = E_1 - e\sin E_1 = 0.7362 - 0.741 \times 0.6716 = 0.2386\,\mathrm{rad}$ to $2\pi - M_1$. The fraction of the period is $(2\pi - 2M_1)/2\pi = 1 - 0.2386/\pi = 0.924$: the satellite is on the apogee half for $92.4\,\%$ of the time, $11.06$ of every $11.97$ hours. Above $20\,000\,\mathrm{km}$ radius – where $\cos\nu = (p/r - 1)/e$ with $p = a(1 - e^2) = 11\,975\,\mathrm{km}$ gives $\nu = 122.8^\circ$ – it spends $9.94\,\mathrm{h}$ per orbit. Two or three satellites in such orbits give continuous high-latitude coverage that GEO cannot provide.
:::

**Frozen orbit**. Oblateness also perturbs $e$ and $\omega$ periodically, and the next zonal coefficient $J_3 = -2.53 \times 10^{-6}$ (the north–south asymmetry, "pear shape") drives a long-period oscillation of the eccentricity vector. Choosing $\omega = 90^\circ$ and a particular small eccentricity,

$$
e_f \approx -\frac{J_3}{2J_2}\,\frac{R}{a}\,\sin i ,
$$

makes the $J_2$ and $J_3$ effects on $\dot{e}$ and $\dot{\omega}$ cancel on average, so the eccentricity vector stays put: perigee remains over the same latitude and the altitude profile over the ground repeats orbit after orbit. For the $700\,\mathrm{km}$ SSO above, $e_f = 1.1697 \times 10^{-3} \times 0.9011 \times \sin 98.19^\circ = 0.00104$, a $15\,\mathrm{km}$ perigee–apogee difference held fixed. Altimetry and repeat-imaging missions fly frozen sun-synchronous orbits for this reason: constant lighting *and* constant altitude at each latitude.

::: key Orbit types by the numbers
LEO $200$–$2000\,\mathrm{km}$, $T \approx 90\,\mathrm{min}$. MEO: GPS at $a = 26\,560\,\mathrm{km}$, $T = 11\,\mathrm{h}\,58\,\mathrm{min}$. GEO: $a = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, $T = 86\,164\,\mathrm{s}$. GTO: $250 \times 35\,786\,\mathrm{km}$, $e = 0.73$, $T = 10.5\,\mathrm{h}$. SSO: $\dot{\Omega} = +0.9856^\circ/\mathrm{day}$, $i \approx 98^\circ$ at $700\,\mathrm{km}$. Molniya: $T = 12\,\mathrm{h}$, $e \approx 0.74$, $i = 63.4^\circ$ (critical, $\dot{\omega} = 0$), $\omega = 270^\circ$. Frozen: $\omega = 90^\circ$, $e_f \approx -(J_3/2J_2)(R/a)\sin i \approx 0.001$.
:::

## Computing a ground track

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

To draw the track, propagate the state (analytically, or with the $f$ and $g$ coefficients) at one-minute steps, advance the Julian date by $60/86\,400$ each step, and collect the sub-points. Break the line where the longitude wraps across $\pm 180^\circ$, or the plot will be crossed by horizontal streaks.

::: warning Sidereal, not solar, and inertial, not Earth-fixed
The Earth-fixed frame turns through $360^\circ$ in a sidereal day, not a solar day; using $2\pi/86\,400$ for $\omega_E$ accumulates $0.986^\circ$ of longitude error per day. And the two-body equation holds in the inertial frame only – never integrate it in ECEF without the Coriolis and centrifugal terms of the rotating-frames module. Propagate in ECI, rotate afterwards.
:::

::: warning Geocentric and geodetic latitude
$\arcsin(z/r)$ is geocentric latitude. Coordinates on maps, in ground-station databases and in imagery metadata are geodetic. The difference peaks at $0.19^\circ$ (about $21\,\mathrm{km}$ on the ground) near $45^\circ$ latitude and vanishes at the equator and poles. A ground track plotted with geocentric latitude looks fine and is wrong by a city's width.
:::

## Check yourself

::: check
A satellite in a circular $800\,\mathrm{km}$ orbit at $i = 98.6^\circ$ crosses the equator northbound at $30^\circ\,\mathrm{E}$. Ignoring the node regression, at what longitude does it cross northbound next, and what is the maximum latitude of its track?
:::

::: answer
$a = 7178.137\,\mathrm{km}$, $T = 2\pi\sqrt{a^3/\mu} = 6052\,\mathrm{s}$. Earth turns $\omega_E T = 7.2921 \times 10^{-5} \times 6052 = 0.4413\,\mathrm{rad} = 25.3^\circ$ eastward, so the next northbound crossing is $25.3^\circ$ *west*, at $4.7^\circ\,\mathrm{E}$. (Including the sun-synchronous node regression of $+0.9856^\circ/\mathrm{day}$, eastward, the shift is reduced by $0.07^\circ$ per orbit.) The track reaches latitude $180^\circ - 98.6^\circ = 81.4^\circ$ north and south; a retrograde orbit's maximum latitude is the supplement of its inclination.
:::

::: check
Why must a sun-synchronous orbit be retrograde?
:::

::: answer
The node must move *eastward* to follow the Sun's apparent motion around the sky, at $+0.9856^\circ$ per day. The oblateness rate $\dot{\Omega} = -\tfrac{3}{2}nJ_2(R/p)^2\cos i$ is negative (westward) for $\cos i > 0$ and positive only for $\cos i < 0$, i.e. $i > 90^\circ$. Hence the inclination must exceed $90^\circ$ – slightly, because the required rate is small compared with the maximum $\tfrac{3}{2}nJ_2(R/p)^2$ that an equatorial orbit would have.
:::

::: check
A GEO satellite is found to be drifting east at $0.05^\circ$ per day. Is its semi-major axis too large or too small, and by how much?
:::

::: answer
Eastward drift means the satellite is running ahead of Earth's rotation: its period is shorter than a sidereal day, so $a$ is too *small*. From $0.0128^\circ/\mathrm{day}$ per kilometre, the error is $0.05/0.0128 = 3.9\,\mathrm{km}$ low. Raising the orbit by $3.9\,\mathrm{km}$ (a tangential $\Delta v$ of about $0.14\,\mathrm{m/s}$, from $\Delta v \approx \tfrac{1}{2}v_c\,\Delta a/a = 0.5 \times 3.075 \times 3.9/42\,164\,\mathrm{km/s}$) stops the drift.
:::

::: check
Why is the Molniya inclination $63.4^\circ$ and not, say, $60^\circ$ or $70^\circ$?
:::

::: answer
The apsidal rate $\dot{\omega} \propto 5\cos^2 i - 1$ is zero only at $\cos i = 1/\sqrt{5}$, $i = 63.435^\circ$. At $60^\circ$, $5\cos^2 i - 1 = 0.25 > 0$ and the perigee would advance; at $70^\circ$, $5 \times 0.1170 - 1 = -0.415$ and it would regress. Either way the apogee would drift out of the northern sky within months, and the whole point of the orbit – apogee dwell over the intended hemisphere – would be lost. The critical inclination freezes the argument of perigee.
:::

::: check
Compute the Greenwich sidereal time at 2026-09-22 18:00:00 UTC, using the value $181.365^\circ$ at 12:00:00 UTC.
:::

::: answer
Six hours later Greenwich has turned through $\omega_E \times 21\,600\,\mathrm{s} = 7.2921 \times 10^{-5} \times 21\,600 = 1.5751\,\mathrm{rad} = 90.25^\circ$ (six sidereal-rate hours, slightly more than $90^\circ$ because a sidereal day is shorter than a solar day). So $\theta_g = 181.365^\circ + 90.246^\circ = 271.61^\circ$, or $18.107^{\mathrm{h}}$. The full formula gives the same to the last digit; the polynomial terms change by less than $10^{-5}$ degrees over six hours.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\omega_E = 7.2921159 \times 10^{-5}\,\mathrm{rad/s}$ | Earth's rotation rate, one turn per sidereal day $86\,164.09\,\mathrm{s}$ |
| $\theta_g$ | Greenwich mean sidereal time; $280.4606^\circ$ at J2000.0, IAU 1982 polynomial in $T$ |
| $\lambda = \operatorname{atan2}(y, x) - \theta_g$, $\phi' = \arcsin(z/r)$ | Sub-satellite longitude and geocentric latitude |
| $\tan\phi = \tan\phi'/(1 - f)^2$ | Geodetic latitude, up to $0.19^\circ$ different |
| Westward shift per orbit | $\omega_E T$ ($23.3^\circ$ for the ISS), plus $\lvert\dot{\Omega}\rvert T$ |
| $\dot{\Omega} = -\frac{3}{2}nJ_2(R/p)^2\cos i$ | Node regression (quoted); $-4.96^\circ/\mathrm{day}$ for the ISS |
| $\dot{\omega} = \frac{3}{4}nJ_2(R/p)^2(5\cos^2 i - 1)$ | Apsidal rotation (quoted); zero at $63.435^\circ$ |
| SSO condition | $\dot{\Omega} = 0.9856^\circ/\mathrm{day}$ eastward; $i = 98.19^\circ$ at $700\,\mathrm{km}$ |
| Molniya | $a = 26\,562\,\mathrm{km}$, $e = 0.74$, $i = 63.4^\circ$, $\omega = 270^\circ$; $92\,\%$ of the period on the apogee half |
| Frozen | $\omega = 90^\circ$, $e_f \approx -(J_3/2J_2)(R/a)\sin i$ |
| GEO drift | $0.0128^\circ/\mathrm{day}$ westward per km of excess $a$ |

The final lesson reads the elements of a real satellite from the two-line element format in which they are published, explains why those are mean elements requiring the SGP4 propagator, and closes the module by reproducing a ground track from a TLE.
