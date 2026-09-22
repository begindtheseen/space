---
id: l05-earth-and-horizon-sensors
title: Earth and horizon sensors
minutes: 14
covers:
  - Earth and horizon sensors
---

Every sensor so far in this module answers a question phrased in the sky: which star, which sun-vector, which magnetic field direction. An Earth or horizon sensor answers a different question, phrased at the vehicle itself — which way is down. It does not need a catalog, a field model, or an identification algorithm, because it looks at the one object in the sky no attitude sensor can mistake for anything else: a bright, sharp-edged disk that fills a large, entirely predictable fraction of the field of view. That simplicity made it, for decades, the standard nadir reference for spin-stabilized and geostationary spacecraft, well before star trackers were cheap or fast enough to fly everywhere.

This lesson builds the horizon sensor's measurement model in two pieces. The first is almost pure geometry: Earth's angular size, seen from orbit, is a direct and computable function of altitude, and that single number sets how a horizon sensor has to be designed at all. The second is the trigonometry a scanning sensor actually solves in flight — from two horizon-crossing angles measured once per spin, working out both where nadir is and how far the sensor is from directly under the spacecraft.

## Why infrared, and what "the horizon" actually is

A horizon sensor almost always looks in the infrared, near the $15\,\mathrm{\mu m}$ carbon-dioxide absorption band, rather than at reflected visible light. The reason is the previous lesson's own problem, sidestepped rather than solved: a visible-light view of Earth is a view of reflected sunlight, bright over cloud and ice, dark over ocean, entirely absent on the night side — exactly the albedo variation that corrupted a sun sensor's cosine-law reading. Earth's CO$_2$ layer, by contrast, *emits* in that infrared band because it is warm, not because anything is reflecting off it, and it does so at a fairly repeatable effective altitude — call it $30\,\mathrm{km}$ above the surface — essentially independent of whether the ground beneath is in daylight or darkness, cloud or clear sky. The result is a sharp, high-contrast edge between "Earth" and "space" in that one narrow infrared band that a much simpler sensor than a star tracker or a fine sun sensor can detect reliably: a single bolometer or a small array, not an imaging focal plane. It is not perfectly uniform — the effective emitting altitude shifts a little with season and latitude, a real limitation on the sensor's ultimate accuracy — but it is far steadier than anything reflected sunlight offers.

## Earth's angular radius, and what it says about altitude

From a distance $r$ from Earth's centre, Earth (plus its effective infrared-emitting layer, radius $R_{\text{eff}}=R_\oplus+30\,\mathrm{km}$) subtends a half-angle

$$
\rho = \arcsin\!\left(\frac{R_{\text{eff}}}{r}\right),
$$

the same right-triangle relation a tangent line from a point outside a circle makes with the line to the circle's centre. This one number governs how a horizon sensor has to be built.

::: example How much of the sky Earth actually fills
```python
import numpy as np

Re, atm_layer = 6378.0, 30.0
R_eff = Re + atm_layer

def earth_half_angle(r_mag):
    return np.degrees(np.arcsin(R_eff / r_mag))

for h in (500.0, 800.0, 1500.0, 20200.0, 35786.0):
    print(f"h={h:8.1f} km   rho = {earth_half_angle(Re + h):7.3f} deg")
# h=   500.0 km   rho =  68.696 deg
# h=   800.0 km   rho =  63.218 deg
# h=  1500.0 km   rho =  54.430 deg
# h= 20200.0 km   rho =  13.952 deg
# h= 35786.0 km   rho =   8.742 deg
```

At a typical low-Earth-orbit altitude, Earth fills nearly $70^\circ$ of half-angle — more than a third of the entire sky — and that disk sweeps across a wide arc of the field of view every orbit as the spacecraft moves. At geostationary altitude, Earth has shrunk to a disk under $9^\circ$ across (matching the commonly quoted "Earth spans about $17^\circ$ from geostationary orbit," twice this half-angle), and because a geostationary vehicle stays fixed relative to the ground, that disk barely moves at all. The two regimes call for different hardware: a LEO horizon sensor has to sweep or stare across a wide, fast-moving target, while a GEO horizon sensor can often get away with a small, fixed set of static detectors watching a disk that never goes anywhere.
:::

## Scanning-sensor geometry: from two crossings to a nadir direction

A classic scanning horizon sensor, flown on a spin-stabilized spacecraft, does not point anywhere in particular — it rides along for the ride, its boresight fixed at a constant angle $\eta$ from the spin axis $\hat{\mathbf{Z}}$, sweeping out a full circle on the sky once per spin. Somewhere in that circle the boresight crosses into Earth's disk and, a fraction of a spin later, crosses back out; the electronics timestamp both crossings relative to a spin-phase reference — often a simple sun-pulse sensor, the coarse cousin from two lessons back, marking $\phi=0$ once per spin. From those two numbers alone, the sensor recovers where nadir is.

Set up the geometry directly. With $\hat{\mathbf{Z}}=(0,0,1)$, the nadir direction $\hat{\mathbf{N}}$ at colatitude $\theta_E$ from the spin axis and azimuth $\phi_N$, and the boresight $\hat{\mathbf{S}}(\phi)$ at its fixed colatitude $\eta$ and spin phase $\phi$, both are

$$
\hat{\mathbf{N}} = (\sin\theta_E\cos\phi_N,\ \sin\theta_E\sin\phi_N,\ \cos\theta_E), \qquad
\hat{\mathbf{S}}(\phi) = (\sin\eta\cos\phi,\ \sin\eta\sin\phi,\ \cos\eta),
$$

and their dot product, using $\cos\phi_N\cos\phi+\sin\phi_N\sin\phi=\cos(\phi-\phi_N)$, is

$$
\cos\psi(\phi) = \hat{\mathbf{N}}\cdot\hat{\mathbf{S}}(\phi) = \cos\theta_E\cos\eta + \sin\theta_E\sin\eta\cos(\phi-\phi_N),
$$

the angle $\psi(\phi)$ between the boresight and nadir at spin phase $\phi$. The boresight is inside Earth's disk exactly when $\psi(\phi)\le\rho$, so the two crossings occur where $\psi(\phi)=\rho$ — two values of $\phi$, symmetric about $\phi_N$ by the $\cos(\phi-\phi_N)$ symmetry of the formula above, at $\phi=\phi_N\pm\Delta\phi$ for

$$
\cos\rho = \cos\theta_E\cos\eta + \sin\theta_E\sin\eta\cos(\Delta\phi).
$$

Measuring the two crossing phases hands the sensor both quantities it needs directly: their average is $\phi_N$, the nadir azimuth about the spin axis, read straight off the data; their half-difference is $\Delta\phi$, the "Earth width" every horizon-sensor data sheet quotes, which the equation above inverts — given the known, fixed $\eta$ and the $\rho$ that altitude already fixes — for $\theta_E$, the one angle that is not read off directly.

::: example A full spin: crossings in, geometry out
```python
import numpy as np
from scipy.optimize import brentq

def boresight(phi, eta, spin_axis=np.array([0., 0., 1.]), ref=np.array([1., 0., 0.])):
    p1 = ref - np.dot(ref, spin_axis) * spin_axis; p1 /= np.linalg.norm(p1)
    p2 = np.cross(spin_axis, p1)
    return np.cos(eta) * spin_axis + np.sin(eta) * (np.cos(phi) * p1 + np.sin(phi) * p2)

theta_E_true, phi_N_true, eta, rho = 40.0, 200.0, 55.0, 20.0   # deg; eta, rho known/fixed
n_hat = boresight(np.radians(phi_N_true), np.radians(theta_E_true))

phis = np.linspace(0, 2*np.pi, 200000, endpoint=False)
psi = np.degrees(np.arccos(np.clip([boresight(p, np.radians(eta)) @ n_hat for p in phis], -1, 1)))
inside = psi <= rho
edges = np.sort(np.degrees(phis[np.where(np.diff(inside.astype(int)) != 0)[0]]))
print("crossing phases (deg):", np.round(edges, 3))

phi_N_meas = np.mean(edges)
dphi_meas = (edges[1] - edges[0]) / 2.0
print("measured nadir azimuth phi_N:", round(phi_N_meas, 3), " (true:", phi_N_true, ")")
print("measured half Earth-width dphi:", round(dphi_meas, 3))

eta_r, rho_r, dphi_r = np.radians(eta), np.radians(rho), np.radians(dphi_meas)
f = lambda t: np.cos(np.radians(t))*np.cos(eta_r) + np.sin(np.radians(t))*np.sin(eta_r)*np.cos(dphi_r) - np.cos(rho_r)
theta_E_est = brentq(f, 20.0, 60.0)
print("recovered theta_E:", round(theta_E_est, 4), " true:", theta_E_true)
# crossing phases (deg): [181.838 218.162]
# measured nadir azimuth phi_N: 200.0  (true: 200.0)
# measured half Earth-width dphi: 18.162
# recovered theta_E: 39.9999  true: 40.0
```

Two timestamps per spin, a known scan-cone angle, and Earth's known angular radius are enough to recover the full nadir direction to four decimal places on noiseless data. Solving that last equation for $\theta_E$ needs some care, though: the same $(\eta,\rho,\Delta\phi)$ can satisfy it at more than one value of $\theta_E$ — a genuine geometric ambiguity, not a numerical artifact, since the function $\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos\Delta\phi$ is not monotonic over the full range of plausible $\theta_E$. A real sensor resolves it the way most such ambiguities in this module are resolved: with a coarse prior attitude, from a previous spin or a coarse sun-and-magnetometer solution, that is good enough to say which of the candidate roots is physically the right one.
:::

::: note Where this sensor sits in a modern suite
A horizon sensor's accuracy — typically a fraction of a degree, set by crossing-timing noise and by how much the true infrared horizon wanders from the fixed-altitude model above — is well behind a star tracker's, and few new missions choose it as a primary attitude reference. It remains attractive precisely where this module's other sensors are overkill or unavailable: spin-stabilized spacecraft that never needed 3-axis pointing in the first place, geostationary platforms where the target barely moves, and safe modes on any vehicle that need a robust, always-available local-vertical reference with no moving optics and no catalog to search.
:::

## Check yourself

::: check
Explain why a horizon sensor looking in the $15\,\mathrm{\mu m}$ CO$_2$ band avoids the specific failure mode that corrupted the previous lesson's coarse sun sensor, in terms of emission versus reflection.
:::

::: answer
A coarse sun sensor's albedo error comes from *reflected* sunlight, which depends on whatever is on the ground below — bright over cloud and ice, dark over ocean, entirely absent at night — because reflection needs an external light source that itself varies. The CO$_2$ band a horizon sensor uses is thermal *emission* from the atmosphere itself, driven by the atmosphere's own temperature rather than by reflected sunlight, so it persists in darkness and varies far less with what the ground beneath happens to look like. The horizon sensor trades reflected light's large day/night, terrain-dependent error for a much smaller residual variation in the emitting layer's effective altitude.
:::

::: check
Using $\rho=\arcsin(R_{\text{eff}}/r)$, find Earth's angular half-angle at $h=20{,}200\,\mathrm{km}$ (a GPS-like medium-Earth orbit) and state whether a horizon sensor there needs to scan a wide arc or can stare at a nearly fixed target, compared to the low-Earth-orbit and geostationary cases in this lesson.
:::

::: answer
With $r=6378+20200=26578\,\mathrm{km}$ and $R_{\text{eff}}=6408\,\mathrm{km}$, $\rho=\arcsin(6408/26578)=13.95^\circ$ — between the low-Earth-orbit value of about $69^\circ$ and the geostationary value of about $8.7^\circ$. Earth is a small, slowly moving target from this altitude, much closer in character to the geostationary case than to low Earth orbit, so a medium-Earth-orbit horizon sensor can lean toward a simpler, narrower-field design rather than the wide, fast scan a low-Earth-orbit sensor needs.
:::

::: check
Starting from $\hat{\mathbf{N}}=(\sin\theta_E\cos\phi_N,\sin\theta_E\sin\phi_N,\cos\theta_E)$ and $\hat{\mathbf{S}}(\phi)=(\sin\eta\cos\phi,\sin\eta\sin\phi,\cos\eta)$, show the steps that turn $\hat{\mathbf{N}}\cdot\hat{\mathbf{S}}(\phi)$ into $\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos(\phi-\phi_N)$.
:::

::: answer
Expanding the dot product term by term gives $\sin\theta_E\sin\eta\cos\phi_N\cos\phi+\sin\theta_E\sin\eta\sin\phi_N\sin\phi+\cos\theta_E\cos\eta$. The first two terms share the factor $\sin\theta_E\sin\eta$ and combine as $\sin\theta_E\sin\eta(\cos\phi_N\cos\phi+\sin\phi_N\sin\phi)$; the cosine angle-difference identity $\cos\phi_N\cos\phi+\sin\phi_N\sin\phi=\cos(\phi-\phi_N)$ collapses that bracket to $\cos(\phi-\phi_N)$, leaving $\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos(\phi-\phi_N)$ exactly.
:::

::: check
A scanning horizon sensor with $\eta=55^\circ$ records crossings at spin phases $181.8^\circ$ and $218.2^\circ$. State the nadir azimuth $\phi_N$ and the half Earth-width $\Delta\phi$ these two numbers give directly, without solving for $\theta_E$.
:::

::: answer
$\phi_N$ is the average of the two crossings, $(181.8+218.2)/2=200.0^\circ$, read directly off the data with no further computation. $\Delta\phi$ is half their difference, $(218.2-181.8)/2=18.2^\circ$; only this second number, combined with the known $\eta$ and $\rho$, needs the trigonometric inversion to yield $\theta_E$.
:::

::: check
Explain why the equation $\cos\rho=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos\Delta\phi$ can have two valid solutions for $\theta_E$ given the same measured $\Delta\phi$, and how a real spacecraft resolves the ambiguity.
:::

::: answer
The right-hand side, as a function of $\theta_E$ for fixed $\eta$ and $\Delta\phi$, is not monotonic over the full range of physically possible colatitudes — it can rise and then fall (or vice versa) as $\theta_E$ increases, so the same target value $\cos\rho$ can be crossed at two different $\theta_E$, corresponding to two geometrically distinct nadir directions consistent with the identical pair of crossing timestamps. A real spacecraft resolves this the way this module resolves every such ambiguity: with outside information — a coarse prior attitude from a previous spin, or a sun-and-magnetometer solution — good enough to discard the candidate that does not match where the vehicle is actually expected to be pointed.
:::

::: check
Why can a geostationary horizon sensor typically use a simpler, static design than a low-Earth-orbit one, in terms of this lesson's own numbers?
:::

::: answer
From low Earth orbit Earth subtends roughly $69^\circ$ of half-angle and that huge disk sweeps across a large arc of sky every orbit as the spacecraft moves rapidly around Earth, so a low-Earth-orbit sensor needs to scan or stare across a wide, fast-changing field of view to keep the horizon in view at all. From geostationary altitude Earth has shrunk to under $9^\circ$ of half-angle and, because the spacecraft stays fixed relative to the ground, that small disk barely moves at all — a fixed, narrow-field detector arrangement can keep it in view indefinitely without any scanning mechanism.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $15\,\mathrm{\mu m}$ CO$_2$ band | Thermal emission, not reflected sunlight — avoids the albedo problem the previous lesson quantified |
| $\rho=\arcsin(R_{\text{eff}}/r)$ | Earth's angular half-angle from orbit; $69^\circ$ at $500\,\mathrm{km}$, $8.7^\circ$ at geostationary altitude |
| $\hat{\mathbf{N}}\cdot\hat{\mathbf{S}}(\phi)=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos(\phi-\phi_N)$ | Angle between a fixed-cone-angle boresight and nadir, as a spin-stabilized sensor scans |
| Crossings at $\phi_N\pm\Delta\phi$ | Mid-scan phase gives nadir azimuth directly; Earth-width gives $\theta_E$ by inverting $\cos\rho=\cos\theta_E\cos\eta+\sin\theta_E\sin\eta\cos\Delta\phi$ |
| Two-root ambiguity | The same measured Earth-width can correspond to two colatitudes; resolved with a coarse prior attitude |
| LEO vs GEO horizon sensor | Wide, fast-scanning design versus a small, nearly static one — set entirely by $\rho$ and how fast it changes |

Where this lesson found nadir from Earth's own edge, the next turns to instruments that measure distance to that same surface directly — a radar or laser pulse timed there and back — and to what changes when the target is close enough, during a landing or a rendezvous, that range and range-rate matter as much as direction ever did.
