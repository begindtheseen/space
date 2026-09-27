---
id: l05-earth-and-horizon-sensors
title: Earth and horizon sensors
minutes: 18
covers:
  - Earth and horizon sensors
---

Stand on a beach and look out to sea. You can tell at once which way is level, because the horizon draws a sharp line between bright water and sky. Pilots flying without instruments do the same thing: as long as they can see the horizon, they know which way is down.

A spacecraft can do it too. From orbit, Earth is a huge round disk with a sharp edge against black space. Find that edge all the way around, and the center of the disk is straight down. The direction straight down is called **nadir**. An instrument that finds it from Earth's edge is an **Earth sensor**, or **horizon sensor**.

It needs no star catalog, no field model and no identification step. There is only one Earth, and nothing else in the sky looks like it. For decades, horizon sensors were the standard way to find down on **[[spin-stabilized|spin-stabilized]]** and **[[geostationary|geostationary]]** spacecraft, long before star trackers were cheap. This lesson builds the sensor's measurement model in two parts. First, how big Earth looks from orbit. Second, the trigonometry a spinning sensor solves to turn two timing marks into the direction of nadir.

## Why infrared, and what "the horizon" really is

A horizon sensor almost always looks in the **infrared**, light with wavelengths too long for eyes to see, which warm objects give off as heat. It usually picks a narrow band near $15\,\mathrm{\mu m}$ (micrometers, millionths of a meter), where **[[carbon dioxide glows|co2-band]]**.

Why not ordinary visible light? Because visible light from Earth is reflected sunlight. It is bright over clouds and ice, dark over the ocean, and missing entirely on the night side. That is the same albedo problem that corrupted the coarse sun sensor two lessons back. A visible-light horizon would jump around with the weather and vanish at night.

The carbon dioxide in Earth's atmosphere does something different. It *gives off* infrared light because it is warm, not because anything shines on it. Day or night, cloudy or clear, it glows at about the same brightness. The glow seems to come from a layer about $30\,\mathrm{km}$ above the surface. Against the cold black of space, that makes a sharp, steady edge. A simple detector can find it: a single heat-sensing element, or a short row of them, instead of a full camera.

It is not perfect. The glowing layer's height shifts a little with season and latitude. That wandering sets a floor on the sensor's accuracy. But it is far steadier than anything reflected sunlight can offer.

::: key The infrared horizon
Horizon sensors use thermal emission from atmospheric CO$_2$ near $15\,\mathrm{\mu m}$, not reflected sunlight. The edge sits at an effective height of about $30\,\mathrm{km}$ and is present day and night, so it avoids the albedo error of visible-light sensors.
:::

## How big Earth looks from orbit

Hold a coin at arm's length, then bring it close to your eye. Close up, it blocks much more of your view. Earth works the same way. How much of the sky it fills depends on how far away you are.

Draw a line from the spacecraft that just grazes Earth's edge. That line touches the edge at a right angle to Earth's radius, so it makes a **[[right triangle|tangent-triangle]]** with the line to Earth's center. In that triangle, the side opposite the angle $\rho$ is the effective radius $R_{\text{eff}} = R_\oplus + 30\,\mathrm{km}$, and the long side is the distance $r$ to Earth's center. So

$$
\sin\rho = \frac{R_{\text{eff}}}{r}, \qquad \rho = \arcsin\!\left(\frac{R_{\text{eff}}}{r}\right).
$$

Here $\rho$ (Greek "rho") is Earth's **angular radius**: the angle from nadir to the horizon. Twice $\rho$ is Earth's full angular width.

::: example How much of the sky Earth fills
Take $R_\oplus = 6378\,\mathrm{km}$, so $R_{\text{eff}} = 6408\,\mathrm{km}$. Find $\rho$ at several altitudes $h$, where $r = R_\oplus + h$.

```python
import numpy as np

Re = 6378.0
R_eff = Re + 30.0                     # km, top of the glowing CO2 layer

for h in (500.0, 800.0, 1500.0, 20200.0, 35786.0):
    rho = np.degrees(np.arcsin(R_eff / (Re + h)))
    sky = (1 - np.cos(np.radians(rho))) / 2          # fraction of the whole sky
    print(f"h = {h:8.1f} km   rho = {rho:6.2f} deg   fraction of sky = {sky:.3f}")
# h =    500.0 km   rho =  68.70 deg   fraction of sky = 0.318
# h =    800.0 km   rho =  63.22 deg   fraction of sky = 0.275
# h =   1500.0 km   rho =  54.43 deg   fraction of sky = 0.209
# h =  20200.0 km   rho =  13.95 deg   fraction of sky = 0.015
# h =  35786.0 km   rho =   8.74 deg   fraction of sky = 0.006
```

Check the first line by hand. At $500\,\mathrm{km}$, $r = 6878\,\mathrm{km}$ and $6408/6878 = 0.93167$. The angle whose sine is $0.93167$ is about $68.7^\circ$.

From low Earth orbit, Earth fills nearly a third of the whole sky. From geostationary orbit, $\rho$ is under $9^\circ$, so Earth is about $17.5^\circ$ across. That matches the figure engineers often quote: "Earth is about $17^\circ$ wide from GEO."

The two cases need different hardware. In low orbit the disk is enormous, and a sensor has to find an edge that could be anywhere across a huge field. In geostationary orbit the spacecraft stays over one spot on the ground, so the small disk sits still in its view. A few fixed detectors staring at the four edges of the disk can do the job with no moving parts.
:::

::: warning Earth's size is part of the measurement
A horizon sensor finds nadir from where the edge *is*, and the edge's position depends on $\rho$, which depends on altitude and on the height of the glowing layer. If the orbit is more elliptical than you assumed, or the layer sits higher than your model, the sensor reports a wrong answer with no sign that anything is off. Feed the sensor's software the current altitude, not a fixed number.
:::

## A spinning sensor: two timing marks give nadir

The classic horizon sensor rides on a spinning spacecraft. It does not aim at anything. Its line of sight, the **boresight**, is fixed at an angle $\eta$ (Greek "eta") from the spin axis. As the spacecraft spins, the boresight sweeps out a cone, and its tip draws a circle on the sky once per turn. That circle is the **[[scan cone|scan-cone]]**.

Somewhere on each turn, the boresight crosses onto Earth's disk. A little later it crosses off again. The electronics time both crossings against a reference mark that happens once per spin. Often that reference is a simple sun sensor that flashes each time the Sun passes. The **spin phase** $\phi$ ("phi") is the angle the spacecraft has turned since that mark.

From these two crossing times alone, the sensor can find nadir. Here is how.

### Setting up the geometry

Put the spin axis along $z$. Describe any direction by two angles. Its **[[colatitude|colatitude]]** is its angle away from the spin axis. Its **azimuth** is how far around the spin axis it sits.

- Nadir, $\hat{\mathbf{N}}$, has colatitude $\theta_E$ and azimuth $\phi_N$. These are what we want to find.
- The boresight, $\hat{\mathbf{S}}(\phi)$, has the fixed colatitude $\eta$ and azimuth equal to the spin phase $\phi$.

In components,

$$
\hat{\mathbf{N}} = (\sin\theta_E\cos\phi_N,\ \sin\theta_E\sin\phi_N,\ \cos\theta_E), \qquad
\hat{\mathbf{S}}(\phi) = (\sin\eta\cos\phi,\ \sin\eta\sin\phi,\ \cos\eta).
$$

The angle $\psi$ ("psi") between the boresight and nadir comes from their dot product:

$$
\cos\psi(\phi) = \hat{\mathbf{N}}\cdot\hat{\mathbf{S}}(\phi) = \cos\theta_E\cos\eta + \sin\theta_E\sin\eta\cos(\phi-\phi_N).
$$

::: note Why it has to be true
Multiply matching components and add. The $x$ parts give $\sin\theta_E\sin\eta\cos\phi_N\cos\phi$. The $y$ parts give $\sin\theta_E\sin\eta\sin\phi_N\sin\phi$. The $z$ parts give $\cos\theta_E\cos\eta$. The first two share the factor $\sin\theta_E\sin\eta$, so pull it out:
$$
\sin\theta_E\sin\eta\,(\cos\phi_N\cos\phi + \sin\phi_N\sin\phi) + \cos\theta_E\cos\eta.
$$
The bracket is the angle-difference formula from trigonometry, $\cos\phi_N\cos\phi+\sin\phi_N\sin\phi = \cos(\phi-\phi_N)$. Put it in, and you have the result.
:::

### Reading the crossings

The boresight is on Earth when it is within $\rho$ of nadir, that is, when $\psi \le \rho$. So the crossings happen where $\psi = \rho$.

Look at where $\phi$ appears in the formula: only inside $\cos(\phi - \phi_N)$. Cosine gives the same value for $+x$ and $-x$. So the two crossings sit evenly on either side of $\phi_N$, at $\phi_N - \Delta\phi$ and $\phi_N + \Delta\phi$, where $\Delta\phi$ ("delta phi") obeys

$$
\cos\rho = \cos\theta_E\cos\eta + \sin\theta_E\sin\eta\cos\Delta\phi.
$$

That hands us two results.

1. **Nadir's azimuth is the midpoint.** Average the two crossing phases and you have $\phi_N$. No other math needed.
2. **The Earth width gives the colatitude.** Half the gap between the crossings is $\Delta\phi$, the half **Earth width** that horizon-sensor data sheets quote. You know $\eta$ (it was built in) and $\rho$ (altitude fixes it). So the equation above has one unknown left, $\theta_E$, and you can solve for it.

::: key Scanning horizon sensor
Crossings at $\phi_N \pm \Delta\phi$. The midpoint gives nadir's azimuth $\phi_N$. The half-width $\Delta\phi$ gives nadir's colatitude $\theta_E$ through $\cos\rho=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos\Delta\phi$.
:::

::: example One spin: crossings in, nadir out
Invent a geometry so we can check the answer: nadir at colatitude $\theta_E = 40^\circ$ and azimuth $\phi_N = 200^\circ$. The scan cone has $\eta = 55^\circ$. Take $\rho = 20^\circ$, which is how big Earth looks from about $12{,}400\,\mathrm{km}$ up. Sweep the boresight around, record the crossings, then pretend we have forgotten nadir and recover it.

```python
import numpy as np
from scipy.optimize import brentq

def unit(colat_deg, az_deg):
    """Unit vector at a colatitude from the spin axis (z) and an azimuth about it."""
    t, p = np.radians(colat_deg), np.radians(az_deg)
    return np.array([np.sin(t) * np.cos(p), np.sin(t) * np.sin(p), np.cos(t)])

theta_E_true, phi_N_true = 40.0, 200.0   # deg: the nadir direction we pretend not to know
eta, rho = 55.0, 20.0                    # deg: scan-cone angle and Earth's half-angle, both known
n_hat = unit(theta_E_true, phi_N_true)

# Sweep the boresight once around the cone and find where it enters and leaves Earth.
phis = np.linspace(0.0, 360.0, 200000, endpoint=False)
psi = np.degrees(np.arccos(np.clip([unit(eta, p) @ n_hat for p in phis], -1, 1)))
inside = psi <= rho
edges = phis[np.where(np.diff(inside.astype(int)) != 0)[0]]
print("crossings (deg):", np.round(edges, 3))

phi_N = np.mean(edges)                   # middle of the two crossings
dphi = (edges[1] - edges[0]) / 2.0       # half the Earth width
print("nadir azimuth:", round(phi_N, 3), "  half Earth-width:", round(dphi, 3))

e, r, d = np.radians(eta), np.radians(rho), np.radians(dphi)
f = lambda t: np.cos(np.radians(t)) * np.cos(e) + np.sin(np.radians(t)) * np.sin(e) * np.cos(d) - np.cos(r)
print("root below eta:", round(brentq(f, 0.0, eta), 3))
print("root above eta:", round(brentq(f, eta, 90.0), 3))
# crossings (deg): [181.838 218.162]
# nadir azimuth: 200.0   half Earth-width: 18.162
# root below eta: 40.0
# root above eta: 67.225
```

Walk through it.

- **Azimuth.** The crossings are at $181.838^\circ$ and $218.162^\circ$. Their average is $(181.838 + 218.162)/2 = 200.0^\circ$. That is exactly $\phi_N$.
- **Half-width.** $(218.162 - 181.838)/2 = 18.162^\circ$.
- **Colatitude.** Solving the crossing equation gives $40.0^\circ$, the true answer, but also a second root at about $67.2^\circ$.

That second answer is not a bug. It is a real **[[two-way ambiguity|two-roots]]**. Nadir could sit *inside* the scan cone ($40^\circ$, less than $\eta = 55^\circ$) or *outside* it ($67.2^\circ$), and in both cases the scan circle cuts across Earth's disk for exactly the same length. The two crossing times cannot tell these apart.

A real spacecraft settles it with outside knowledge: a rough attitude from the previous spin, or a coarse sun-and-magnetometer solution, good enough to rule one root out. Many spinning spacecraft also carry two horizon scanners at different cone angles. The two see different Earth widths, and only one colatitude fits both.
:::

::: note Where this sensor sits today
A horizon sensor is typically good to a fraction of a degree. Timing noise at the crossings and the wandering height of the glowing layer set that limit. That is well behind a star tracker, and few new missions use one as their main attitude sensor. It stays useful where the others are overkill or unavailable: spin-stabilized spacecraft that never needed fine three-axis pointing, geostationary platforms where Earth barely moves, and safe modes on any vehicle that need a sturdy "which way is down" with no catalog to search.
:::

## Check yourself

::: check
Explain why a horizon sensor looking in the $15\,\mathrm{\mu m}$ carbon-dioxide band avoids the albedo error that hurt the coarse sun sensor. Use the words *emission* and *reflection*.
:::

::: answer
The sun sensor's albedo error comes from *reflected* sunlight. How much light Earth reflects depends on what is below: bright clouds and ice, dark ocean, and nothing at all on the night side. The $15\,\mathrm{\mu m}$ band is *emission*: the atmosphere's carbon dioxide glows because it is warm, with no outside light needed. So it is there day and night and changes little with the ground below. What remains is a much smaller error: the glowing layer's height shifts a little with season and latitude.
:::

::: check
Find Earth's angular radius $\rho$ at $h = 20{,}200\,\mathrm{km}$, the altitude of GPS satellites. Is it closer to the low-orbit case or the geostationary case?
:::

::: answer
The distance is $r = 6378 + 20200 = 26578\,\mathrm{km}$, and $R_{\text{eff}} = 6408\,\mathrm{km}$. So $\sin\rho = 6408/26578 = 0.2411$, and $\rho = 13.95^\circ$. That is far from the $68.7^\circ$ of low orbit and fairly close to the $8.74^\circ$ of geostationary orbit. Earth is a small target there, filling only about $1.5\%$ of the sky, so a sensor can use a narrow field of view.
:::

::: check
Why does nadir's azimuth $\phi_N$ come out as the plain average of the two crossing phases, without solving any equation?
:::

::: answer
The spin phase $\phi$ appears in $\cos\psi$ only through $\cos(\phi - \phi_N)$. Cosine is symmetric: $\cos(+x) = \cos(-x)$. So if the boresight crosses the edge at $\phi_N + \Delta\phi$, it must also cross at $\phi_N - \Delta\phi$. Two points placed evenly on either side of $\phi_N$ have $\phi_N$ as their average.
:::

::: check
A scanning sensor with $\eta = 55^\circ$ records crossings at spin phases $181.8^\circ$ and $218.2^\circ$. What are $\phi_N$ and $\Delta\phi$? Which of the two still needs trigonometry to become a nadir angle?
:::

::: answer
The azimuth is the average: $(181.8 + 218.2)/2 = 200.0^\circ$, and that is $\phi_N$ with no more work. The half-width is $(218.2 - 181.8)/2 = 18.2^\circ$. Only $\Delta\phi$ needs more math. Together with the known $\eta$ and $\rho$, it goes into $\cos\rho=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos\Delta\phi$, which you solve for $\theta_E$.
:::

::: check
The crossing equation gave two colatitudes, $40.0^\circ$ and $67.2^\circ$, for the same pair of crossing times. Explain in words why both are possible, and name two ways a spacecraft can decide between them.
:::

::: answer
The scan circle has colatitude $\eta = 55^\circ$. Earth's disk can sit on the inner side of that circle ($40^\circ$) or on the outer side ($67.2^\circ$), and in both positions the circle cuts through the disk along an arc of the same length. The timing only measures that arc length, so it cannot tell inside from outside. Ways to decide: use a rough attitude from an earlier spin or from a sun-and-magnetometer solution to rule one out; or fly a second scanner at a different cone angle, whose own Earth width is consistent with only one of the two.
:::

::: check
Why can a geostationary horizon sensor usually be simpler than a low-orbit one? Use this lesson's numbers.
:::

::: answer
From low orbit Earth has an angular radius of about $69^\circ$ and fills nearly a third of the sky, and the view changes quickly as the spacecraft circles every hour and a half. A sensor there must find an edge across a very wide field. From geostationary orbit Earth's angular radius is under $9^\circ$, and since the spacecraft stays over one point on the ground, the disk sits still. A few small, fixed detectors pointed at its edges keep it in view without any scanning.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| Nadir | The direction straight down, toward Earth's center |
| $15\,\mathrm{\mu m}$ CO$_2$ band | Thermal glow of the atmosphere, not reflected sunlight: day and night, no albedo error |
| $\rho=\arcsin(R_{\text{eff}}/r)$ | Earth's angular radius; $68.7^\circ$ at $500\,\mathrm{km}$, $8.74^\circ$ at geostationary altitude |
| $\eta$ | Fixed angle between the scanner's boresight and the spin axis |
| $\cos\psi=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos(\phi-\phi_N)$ | Angle from boresight to nadir as the spacecraft spins |
| Crossings at $\phi_N\pm\Delta\phi$ | Midpoint gives azimuth $\phi_N$; half-width $\Delta\phi$ gives colatitude $\theta_E$ |
| Two roots | Nadir inside or outside the scan cone; settled by a prior attitude or a second scanner |
| LEO versus GEO | Huge moving disk versus small still one; set by $\rho$ |

This lesson found the *direction* to the ground. The next one measures the *distance* to it, by timing a radar or laser pulse there and back: the key number during a landing.

::: context spin-stabilized Spinning to stay steady
A spinning top stays upright; a still one falls over. A spinning spacecraft is the same: its spin axis holds its direction in space with no fuel and no computer, the way a thrown football keeps its nose forward. Many early satellites, and many weather and communications satellites after them, were spinners. Their instruments sweep across the sky as they turn, which is exactly what a scanning horizon sensor needs.
:::

::: context geostationary Parked over one spot
A satellite about $35{,}786\,\mathrm{km}$ above the equator takes exactly one day to go around Earth, the same time Earth takes to turn once. So from the ground it seems to hang still in the sky, which is why satellite TV dishes never need to move. Because the satellite does not move relative to the ground, Earth looks the same to it all day: a disk about $17.5^\circ$ wide, sitting still.
:::

::: context co2-band Why carbon dioxide, and why 15 micrometers
Every warm object glows in infrared. Carbon dioxide molecules absorb and emit especially strongly at wavelengths near $15\,\mathrm{\mu m}$, because that is the energy of their bending vibration. The atmosphere is thick with such molecules, so looking at Earth in that band you see the glow of the carbon dioxide high in the atmosphere, not the ground beneath. The ground, clouds and oceans are hidden behind it. That is exactly what a horizon sensor wants: one steady glowing shell, the same all the way around.
:::

::: context tangent-triangle The triangle behind the formula
A line that just grazes a circle meets the radius at a right angle. So the spacecraft, Earth's center and the grazing point make a right triangle. The long side is $r$; the side opposite the angle at the spacecraft is $R_{\text{eff}}$. That is where $\sin\rho = R_{\text{eff}}/r$ comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="100" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="100" x2="96.36" y2="42.27" stroke="#b4232c" stroke-width="2"/>
  <line x1="80" y1="100" x2="96.36" y2="42.27" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="94.18,49.97 101.88,52.15 104.06,44.45" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="300" cy="100" r="5" fill="#1f2a44"/>
  <text x="290" y="124" font-size="12" fill="#1f2a44">spacecraft</text>
  <text x="66" y="70" font-size="12" fill="#1f2a44">R</text>
  <text x="180" y="118" font-size="12" fill="#1f2a44">r</text>
  <path d="M 250 100 A 50 50 0 0 1 251.9 86.4" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="230" y="92" font-size="13" fill="#b4232c">ρ</text>
  <text x="140" y="55" font-size="12" fill="#b4232c">line of sight to the horizon</text>
</svg>
```

Here $R$ is the effective radius $R_{\text{eff}}$. The farther away the spacecraft, the longer $r$ and the smaller $\rho$.
:::

::: context scan-cone The circle the boresight draws
Tie a flashlight to a spinning merry-go-round, tilted out at a fixed angle from the center pole. As it turns, its beam sweeps a cone, and the spot on a dome above draws a circle. The horizon sensor's boresight does the same on the sky. Earth is a disk somewhere on that dome. The part of the circle that passes over the disk is the "Earth chord", and its length, measured in spin angle, is the Earth width.
:::

::: context colatitude Latitude counted from the pole
On a globe, latitude is measured up from the equator. Colatitude is measured down from the north pole instead: $0^\circ$ at the pole, $90^\circ$ at the equator. Here the "pole" is the spin axis. So a boresight with colatitude $\eta = 55^\circ$ points $55^\circ$ away from the spin axis, and nadir at $\theta_E = 40^\circ$ lies $40^\circ$ from it. Colatitude makes the formulas tidy: the $z$ part of a unit vector is simply the cosine of its colatitude.
:::

::: context two-roots Two Earths, the same two crossings
Drawn flat on the sky, the scan circle (blue) cuts two different Earth positions (orange and grey) at the very same two points. One disk sits inside the circle, one outside. The sensor only sees those crossing points, so it cannot tell which Earth is real.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="95" r="77" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="130" cy="95" r="3" fill="#1f2a44"/>
  <text x="84" y="99" font-size="11" fill="#1f2a44">spin axis</text>
  <circle cx="186.05" cy="95" r="28" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="221.79" cy="95" r="28" fill="#6c7a93" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="203.92" cy="73.44" r="4" fill="#b4232c"/>
  <circle cx="203.92" cy="116.56" r="4" fill="#b4232c"/>
  <text x="258" y="70" font-size="12" fill="#b4232c">same crossings</text>
  <text x="258" y="128" font-size="12" fill="#1f2a44">grey: Earth outside</text>
  <text x="258" y="144" font-size="12" fill="#1f2a44">orange: Earth inside</text>
  <text x="20" y="184" font-size="11" fill="#6c7a93">flat sketch; the lesson's example is the same idea on the sphere</text>
</svg>
```
:::
