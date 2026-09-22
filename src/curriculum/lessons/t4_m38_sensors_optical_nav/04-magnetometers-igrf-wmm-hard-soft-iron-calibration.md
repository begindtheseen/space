---
id: l04-magnetometers-igrf-wmm-hard-soft-iron-calibration
title: 'Magnetometers: the IGRF/WMM field model and hard- and soft-iron calibration'
minutes: 20
covers:
  - 'Magnetometers, the IGRF and WMM field models, residual dipole, hard-iron and soft-iron calibration'
---

Every sensor so far in this module has looked outward at light: photons from a star, photons from the Sun, sometimes photons that should not be there at all. A magnetometer looks at nothing external — it measures a field that already fills the space the spacecraft occupies, in every direction, all the time, whether or not anything is illuminated. That makes it the one attitude sensor that never loses its target: no eclipse silences it, no exclusion cone blinds it, no false detection confuses it with something else. It buys that reliability with by far the weakest signal and by far the worst accuracy of any sensor this module covers.

The weakness has two causes, and they demand two different fixes. Earth's field itself is a moving target: too weak to measure with the ease of a star's fixed catalog position, known only through a model — the IGRF or the WMM — that is refit every five years and is still wrong by hundreds of nanotesla the day it is published. And the spacecraft carrying the magnetometer is itself a source of magnetic field, from permanent magnets and current loops that add a roughly constant offset and from nearby ferromagnetic structure that twists the reading depending on which way the ambient field happens to point. Neither problem is solved by a better sensor; both are solved by better modelling — of Earth's field and of the spacecraft's own.

This lesson builds both halves. It derives what a single magnetometer reading can and cannot tell you about attitude, introduces the field models real missions fly, and then works through the calibration problem in full: why a tumbling spacecraft's raw magnetometer data traces an ellipsoid instead of a sphere, how to fit that ellipsoid and recover the distortion, and what a tumble alone can never tell you no matter how well it is fit.

## What a magnetometer measures, and what one reading tells you about attitude

A magnetometer suitable for spacecraft use is almost always a fluxgate: a small core of high-permeability material driven into and out of magnetic saturation by an AC coil, with a second, pickup coil sensing the distortion that an external field along the core's axis imposes on that saturation cycle. The pickup signal's second-harmonic amplitude is proportional to the ambient field component along the core, with none of the moving parts or elaborate optics the rest of this module depends on. Three cores at right angles give a full vector reading $\mathbf{m}$, typically at tens to hundreds of hertz — far faster than any sensor already in this module, since there is no photon-starved exposure to wait for.

A single reading of a known field constrains attitude exactly the way a single star or sun-sensor vector does. Compare the measured body-frame direction $\hat{\mathbf{b}}=\mathbf{m}/\lVert\mathbf{m}\rVert$ against the known reference-frame direction $\hat{\mathbf{r}}$ the field model predicts at the spacecraft's current position, and the least-squares module's attitude information matrix applies without modification: a single vector observation contributes $a(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})$ to the Fisher information for the attitude error, a rank-two matrix that is exactly blind along $\hat{\mathbf{b}}$ itself. Rotation about the locally measured field direction leaves the reading completely unchanged, so one magnetometer vector determines two of the three attitude degrees of freedom and says nothing whatsoever about the third.

::: key What one magnetometer vector gives you
Two of three attitude degrees of freedom. Rotation about the measured field direction is unobservable instantaneously — the same rank-two, blind-along-its-own-axis information this module has used for every vector sensor so far. A second, non-parallel vector (a sun sensor, a star tracker) fixes the missing axis at that instant; without one, only the field's own slow change of direction along the orbit, combined with gyro propagation through a filter, recovers it over time.
:::

## The IGRF and WMM: a model standing in for a catalog

A star tracker compares against a catalog of measured positions, fixed to a few milliarcseconds. A magnetometer has no equivalent catalog — nobody has measured Earth's field at every point in space — so it compares against a *model*: the International Geomagnetic Reference Field (IGRF) or, for the near-Earth environment specifically, the World Magnetic Model (WMM), both spherical-harmonic expansions of the field's scalar potential, fit from decades of ground observatory data and, in recent generations, dedicated field-mapping satellites. Each model is published with coefficients good for a five-year epoch and a set of *secular-variation* terms — the coefficients' own linear rate of change — so a flight computer can extrapolate a few years past the last official update without needing a fresh upload. Even freshly fit, the model is wrong: truncating the harmonic expansion at a finite degree misses fine structure, secular variation drifts nonlinearly between updates in ways the linear terms only approximate, and localized crustal magnetic anomalies are not global phenomena a smooth model can represent at all. The result is a floor of a few hundred nanotesla of model error that no amount of onboard processing removes, because the error is not noise on a measurement — it is uncertainty in the reference the measurement is compared against.

The leading term of that harmonic expansion — degree one — is an ordinary tilted magnetic dipole, and it alone captures most of the field's large-scale shape. Writing $\hat{\mathbf{m}}$ for the dipole axis (tilted roughly $11^\circ$ from Earth's rotation axis) and $\hat{\mathbf{r}}$ for the spacecraft's position direction from Earth's centre,

$$
\mathbf{B}(\mathbf{r}) = \frac{B_0 R_\oplus^3}{r^3}\Big[3(\hat{\mathbf{m}}\cdot\hat{\mathbf{r}})\hat{\mathbf{r}} - \hat{\mathbf{m}}\Big],
$$

with $B_0\approx 3\times10^4\,\mathrm{nT}$ the field magnitude at Earth's surface on the magnetic equator. This dipole term is a genuine simplification of the full IGRF/WMM expansion, not a replacement for it — real flight software carries the full set of coefficients — but it already shows the two facts a mission planner needs: field strength roughly doubles from the magnetic equator to the poles at fixed altitude, and field *direction*, unlike a star's, changes continuously as the spacecraft moves.

::: example A tilted dipole along a polar low-Earth orbit
```python
import numpy as np

Re, B0 = 6378.0, 30000.0          # km, nT

def dipole_field(r_vec, m_hat, B0=B0, Re=Re):
    r = np.linalg.norm(r_vec)
    r_hat = r_vec / r
    return (B0 * Re**3 / r**3) * (3 * np.dot(m_hat, r_hat) * r_hat - m_hat)

tilt = np.radians(11.0)
m_hat = np.array([np.sin(tilt), 0.0, np.cos(tilt)])

h_alt, r_mag = 500.0, 6378.0 + 500.0
s_hat = np.array([np.cos(np.radians(20)), np.sin(np.radians(20)), 0.0])   # a fixed sun direction

us = np.linspace(0, 2 * np.pi, 720, endpoint=False)
Bmag, ang = [], []
for u in us:
    r_vec = r_mag * np.array([np.cos(u), 0.0, np.sin(u)])                # a near-polar orbit
    B = dipole_field(r_vec, m_hat)
    Bmag.append(np.linalg.norm(B))
    ang.append(np.degrees(np.arccos(np.clip((B / np.linalg.norm(B)) @ s_hat, -1, 1))))
Bmag, ang = np.array(Bmag), np.array(ang)
print("field magnitude range over orbit (nT):", Bmag.min(), "to", Bmag.max())
print("field-to-sun angle range (deg):", ang.min(), "to", ang.max())
# field magnitude range over orbit (nT): 23921.49 to 47842.99
# field-to-sun angle range (deg): 20.00 to 159.9997
```

Field magnitude swings by almost exactly a factor of two over one orbit, from $23{,}921\,\mathrm{nT}$ at the magnetic equator crossing to $47{,}843\,\mathrm{nT}$ near the pole — matching $B_0(R_\oplus/r)^3=23{,}921\,\mathrm{nT}$ and twice that, the dipole's own equator-to-pole ratio, computed once and confirmed here along a real orbit. More consequential for attitude determination, the field's *direction* relative to a fixed sun vector sweeps across nearly the whole range from $20^\circ$ to $160^\circ$ over a single orbit. A star tracker's boresight is fixed in the body frame and its accuracy asymmetry, from the previous lesson, never changes; a magnetometer-and-sun-sensor pair's relative geometry changes every few minutes, and somewhere in that sweep it passes through whatever separation the exact orbit and season produce that day — including, on the wrong day, an angle close enough to zero to trigger the same $1/\sin(\theta/2)$ degradation the least-squares module derived and the previous lesson measured for two nearly parallel vectors. The remedy is the one already established: prefer QUEST's proper weighting over TRIAD's all-or-nothing choice, coast the degraded window on gyro propagation, and flag the epoch's covariance honestly rather than trust a solution the geometry cannot support.
:::

## Hard iron and soft iron: why a "clean" reading is never clean

Mount a magnetometer on a real spacecraft and it never reads the ambient field alone. Two distinct distortions corrupt every measurement, and they are worth keeping separate because they come from different physics and correct differently.

**Hard iron** is an additive offset: permanently magnetized material anywhere on the vehicle — a latching valve, a magnetic torquer left partially energized, a battery's internal structure — and any steady current loop, produces its own field at the sensor, constant in the *body* frame regardless of the spacecraft's attitude or the ambient field's direction. **Soft iron** is a multiplicative distortion: nearby ferromagnetic or high-permeability structure becomes induced-magnetized by whatever the ambient field happens to be, so the distortion it adds depends on the ambient field's direction, changing as the spacecraft tumbles even though the structure itself never moves. A magnetometer's measurement, in body-frame components, is

$$
\mathbf{m} = \mathbf{A}\,\mathbf{B}_{\text{body}} + \mathbf{b},
$$

with $\mathbf{b}$ the hard-iron offset and $\mathbf{A}$ an invertible $3\times3$ soft-iron matrix — the identity matrix for a spacecraft with no induced distortion at all, something else for every real one.

The two distortions leave different fingerprints in the data, and that difference is exactly what makes them separable. Let the spacecraft tumble — through a slew, a detumble, or its ordinary attitude motion over an orbit — while $\lVert\mathbf{B}_{\text{body}}\rVert$ stays essentially constant (the ambient field's *magnitude* depends on position, which barely changes on a tumble's timescale, even though its body-frame *direction* sweeps over the whole sphere). Without hard or soft iron, $\mathbf{m}$ would trace a perfect sphere of that fixed radius. Hard iron shifts the whole sphere's centre by $\mathbf{b}$; soft iron stretches and shears it into an ellipsoid. Together, a tumbling magnetometer's raw output traces an ellipsoid, off-centre and tilted, and the calibration problem is exactly the inverse one: recover $\mathbf{A}$ and $\mathbf{b}$ from that ellipsoid's shape.

::: key Hard iron and soft iron
$\mathbf{m}=\mathbf{A}\mathbf{B}_{\text{body}}+\mathbf{b}$. Hard iron ($\mathbf{b}$) is an additive offset from the spacecraft's own permanent dipole and currents; soft iron ($\mathbf{A}$) is a multiplicative distortion from induced magnetization in nearby structure. Calibration fits the ellipsoid a tumble traces: its centre gives the hard-iron bias, its shape gives the soft-iron correction.
:::

## Calibrating by ellipsoid fit

Every point of a general ellipsoid centred at $\mathbf{b}$ satisfies $(\mathbf{m}-\mathbf{b})^\mathsf{T}\mathbf{Q}(\mathbf{m}-\mathbf{b})=k$ for some symmetric positive-definite $\mathbf{Q}$ and constant $k$, which expands into a quadratic in the raw components of $\mathbf{m}$ — and every term of that expansion is *linear* in the six independent entries of $\mathbf{Q}$, the three entries of a vector $\mathbf{p}=-2\mathbf{Q}\mathbf{b}$, and a constant. Fixing that constant at $1$ (an arbitrary but harmless normalization — any ellipsoid can be scaled to satisfy it) turns the fit into an ordinary linear least-squares problem, exactly the least-squares module's opening lesson again: stack one row per sample, $(x^2,\,y^2,\,z^2,\,2xy,\,2xz,\,2yz,\,x,\,y,\,z)$, against the constant vector of ones, and solve by normal equations or SVD for the nine unknowns. Recovering $\mathbf{b}$ and the shape matrix from the fit is then pure algebra: complete the square to get $\mathbf{b}=-\tfrac12\mathbf{Q}^{-1}\mathbf{p}$, and take the symmetric matrix square root of $\mathbf{Q}$ (via its eigendecomposition, since $\mathbf{Q}$ is symmetric) as the calibration matrix that maps a raw, distorted reading onto a sphere.

::: example Recovering hard and soft iron from a synthetic tumble
```python
import numpy as np

def fit_ellipsoid(m):
    """Shape-and-centre fit: returns (A, b) with A @ (m - b) lying on a sphere,
    in whatever radius the fit's own normalisation happens to produce."""
    x, y, z = m[:, 0], m[:, 1], m[:, 2]
    D = np.column_stack([x*x, y*y, z*z, 2*x*y, 2*x*z, 2*y*z, x, y, z])
    coef, *_ = np.linalg.lstsq(D, np.ones(len(m)), rcond=None)
    Qxx, Qyy, Qzz, Qxy, Qxz, Qyz, px, py, pz = coef
    Q = np.array([[Qxx, Qxy, Qxz], [Qxy, Qyy, Qyz], [Qxz, Qyz, Qzz]])
    p = np.array([px, py, pz])
    b = -0.5 * np.linalg.solve(Q, p)
    w, V = np.linalg.eigh(Q)
    A = V @ np.diag(np.sqrt(w)) @ V.T
    return A, b

rng = np.random.default_rng(3)
B_true = 42000.0                                          # local field, nT
bias_true = np.array([900.0, -650.0, 1100.0])             # hard iron, nT
S_true = np.array([[1.05, 0.03, -0.01], [0.03, 0.97, 0.02], [-0.01, 0.02, 1.04]])   # soft iron

v = rng.standard_normal((800, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)   # a tumble
m = (S_true @ (B_true * v).T).T + bias_true + rng.normal(0, 40.0, (800, 3))        # + 40 nT noise

r_raw = np.linalg.norm(m, axis=1)
print("raw radius spread, std/mean:", np.std(r_raw) / np.mean(r_raw))

A, b = fit_ellipsoid(m)
print("recovered bias:", np.round(b, 1), " true:", bias_true, " error (nT):", round(np.linalg.norm(b - bias_true), 2))
cal = (A @ (m - b).T).T
r_cal = np.linalg.norm(cal, axis=1)
print("calibrated radius spread, std/mean:", np.std(r_cal) / np.mean(r_cal))
# raw radius spread, std/mean: 0.0368
# recovered bias: [ 900.  -650.8 1097.8]  true: [ 900. -650. 1100.]  error (nT): 2.3
# calibrated radius spread, std/mean: 0.000986
```

The raw data spreads over nearly $3.7\%$ of its own radius — visibly not a sphere. The fit recovers the hard-iron bias to within about $2\,\mathrm{nT}$ of its true value out of a $1442\,\mathrm{nT}$ offset, and the calibrated radius spread collapses to a tenth of a percent, essentially the injected sensor noise and nothing else: the soft-iron distortion has been undone along with the offset.

One thing the fit did *not* do: nothing above used $B_{\text{true}}=42{,}000\,\mathrm{nT}$. The calibrated data lies on a sphere, but the radius of that sphere is set by the arbitrary "$=1$" normalization chosen to make the fit linear, not by the true local field strength — a magnetometer tumbling in place measures only the *shape* of its own distortion, never an absolute scale, because multiplying $\mathbf{A}$ by any constant and dividing the true field magnitude by the same constant produces identical data. Closing that gap needs one external number: the local field magnitude the IGRF or WMM predicts for the calibration site and epoch.

```python
B_field = np.mean(r_cal)                              # the fit's own, arbitrarily-scaled radius
cal_true_units = cal * (B_true / B_field)              # rescale using the model, not the tumble
print("mean calibrated |B| after rescale to IGRF-known magnitude:",
      round(np.mean(np.linalg.norm(cal_true_units, axis=1)), 1), " target:", B_true)
# mean calibrated |B| after rescale to IGRF-known magnitude: 42000.0  target: 42000.0
```

A tumble alone fixes the direction of every future reading and the relative shape of the distortion; only the field model closes the last degree of freedom, in nanotesla, which is why a magnetometer calibration campaign is never purely a data-collection exercise — it is a data-collection exercise married to the same model this lesson opened with.
:::

::: warning Calibrate where you will fly, not on the ground alone
A ground calibration performed before launch cannot see distortion that only appears once torquers, batteries, and deployed structure are in their flight configuration and flight currents are actually flowing — a magnetic torquer bar, driven hard during detumble, is itself a strong, transient hard-iron-like source that a static ground test never exercises. Flight magnetometer calibration is normally repeated on orbit, using exactly the ellipsoid-fit procedure above on telemetry from an early tumble or detumble, and revisited if a payload or mode change alters the spacecraft's magnetic environment.
:::

## Check yourself

::: check
Explain, using the rank-two information matrix from the least-squares module, why a single magnetometer reading determines only two of the three attitude degrees of freedom, and identify the one rotation it is completely blind to.
:::

::: answer
A single vector observation $\hat{\mathbf{b}}$ contributes $a(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})$ to the attitude information matrix, and $(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})\hat{\mathbf{b}}=\mathbf{0}$ exactly, so $\hat{\mathbf{b}}$ is an eigenvector of that contribution with eigenvalue zero. The blind rotation is about the measured field direction itself: rotating the spacecraft about the axis the magnetometer currently points its field vector along changes nothing the sensor reads, so that one degree of freedom carries no information from a single instantaneous reading, however precise.
:::

::: check
A spacecraft has a permanently magnetized latch valve and a large flat radiator panel of mildly ferromagnetic material near the magnetometer. Which of the two is a hard-iron source and which is soft-iron, and how would each show up differently in a tumble's raw data?
:::

::: answer
The latch valve is hard iron: its magnetization is permanent and produces a field at the sensor that does not depend on the ambient field's direction, so it shows up as a constant additive offset — a shift of the whole data cloud's centre away from the origin, regardless of attitude. The radiator panel is soft iron: it has no permanent magnetization of its own, but the ambient field induces a magnetization in it that depends on which way the ambient field currently points relative to the panel, so its distortion changes as the spacecraft tumbles and shows up as a stretching or shearing of the data cloud into an ellipsoid rather than a uniform offset.
:::

::: check
Using $B_{\text{eq}}=B_0(R_\oplus/r)^3$ for the dipole field magnitude at the magnetic equator, compute the field strength at $800\,\mathrm{km}$ altitude and compare it to the $500\,\mathrm{km}$ value of $23{,}921\,\mathrm{nT}$ found in this lesson.
:::

::: answer
With $r=6378+800=7178\,\mathrm{km}$, $B_{\text{eq}}=30000\times(6378/7178)^3=30000\times0.7015=21{,}046\,\mathrm{nT}$, noticeably weaker than the $23{,}921\,\mathrm{nT}$ at $500\,\mathrm{km}$: the dipole field falls off as $1/r^3$, so even a modest altitude increase measurably weakens the already-weak signal a magnetometer has to work with, on top of the accuracy penalty every sensor in this module pays for less signal.
:::

::: check
A magnetometer is calibrated in flight from a tumble alone, with no reference to the IGRF or WMM at any point. What, precisely, can that calibration determine, and what can it never determine no matter how much tumble data is collected?
:::

::: answer
A tumble alone determines the hard-iron offset $\mathbf{b}$ (the ellipsoid's centre) and the *shape* of the soft-iron distortion — the relative scaling and skew the calibration matrix $\mathbf{A}$ must undo, up to an arbitrary overall multiplicative constant. It can never determine the absolute scale on its own: rescaling $\mathbf{A}$ by any constant and rescaling the true field magnitude by the inverse of that constant produces exactly the same measured ellipsoid, so no amount of additional tumble data resolves the ambiguity. Only an external reference — the field magnitude the IGRF or WMM predicts for the calibration location and time — fixes that last degree of freedom in physical units.
:::

::: check
List the three distinct sources of the "few hundred nanotesla" model error the IGRF and WMM carry, and state which one keeps growing between scheduled model updates.
:::

::: answer
Truncating the spherical harmonic expansion at a finite degree misses fine-scale field structure the true field has and the model does not; localized crustal magnetic anomalies are not represented by a smooth global model at all, at any degree; and the coefficients' secular-variation terms only approximate the field's true rate of change, so the model's error relative to the real field grows through the years between the scheduled five-year updates rather than staying fixed — of the three, secular-variation drift is the one that keeps growing until the next epoch's coefficients are published.
:::

::: check
A vehicle in the polar orbit of this lesson's dipole example carries a sun sensor and a magnetometer and relies on TRIAD for coarse attitude. Using this lesson's finding that the field-to-sun angle swings from about $20^\circ$ to $160^\circ$ over one orbit, explain what happens to that coarse solution near the low end of the swing and what the previous lesson's module already tells you to do about it.
:::

::: answer
Near a $20^\circ$ separation the two vectors are far from parallel enough to be catastrophic, but the same mechanism the least-squares module derived still applies in degree: TRIAD's accuracy degrades as $1/\sin(\theta/2)$ relative to the optimal solution, worsening as the orbital phase carries the separation lower still on days when the geometry is less favourable than this example's. The remedy already established is to prefer QUEST, which weights the two vectors by their actual accuracy rather than trusting one of them completely, to let a gyro-propagated filter coast through the worst part of the swing, and to treat the resulting covariance as genuinely degraded during that window rather than as business as usual.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| One magnetometer vector: rank-two info, blind about its own direction | Same fact as every other vector sensor in this module; needs a second vector or time |
| IGRF / WMM | Spherical-harmonic field models, refit every 5 years with secular-variation terms; error a few hundred nT from truncation, crustal anomalies, and drift |
| $\mathbf{B}(\mathbf{r})=\dfrac{B_0R_\oplus^3}{r^3}\big[3(\hat{\mathbf{m}}\cdot\hat{\mathbf{r}})\hat{\mathbf{r}}-\hat{\mathbf{m}}\big]$ | Tilted-dipole approximation, degree-1 term of IGRF/WMM; field magnitude roughly doubles equator to pole |
| $\mathbf{m}=\mathbf{A}\mathbf{B}_{\text{body}}+\mathbf{b}$ | Hard iron ($\mathbf{b}$, additive, constant) and soft iron ($\mathbf{A}$, multiplicative, tumble-dependent) |
| $(\mathbf{m}-\mathbf{b})^\mathsf{T}\mathbf{Q}(\mathbf{m}-\mathbf{b})=k$ | Ellipsoid a tumble traces; linear least squares recovers $\mathbf{Q},\mathbf{p}$, then $\mathbf{b}=-\tfrac12\mathbf{Q}^{-1}\mathbf{p}$ and $\mathbf{A}=\mathbf{Q}^{1/2}$ |
| Scale ambiguity | A tumble alone fixes direction and relative shape, never absolute nT scale; only the field model supplies that |
| Field-to-sun angle sweeps widely along an orbit | Unlike a fixed star-tracker boresight; can pass through near-parallel geometry on some days |

The magnetometer closes out this module's vector-attitude sensors: star tracker, sun sensor, and now a field measured against an imperfect model, each with its own accuracy floor and its own failure mode. The next lesson turns to a different kind of instrument again — one that looks not at a source of light or field, but at Earth's own edge, to answer a simpler question none of these three can: which way is down.
