---
id: l04-magnetometers-igrf-wmm-hard-soft-iron-calibration
title: 'Magnetometers: the IGRF/WMM field model and hard- and soft-iron calibration'
minutes: 24
covers:
  - 'Magnetometers, the IGRF and WMM field models, residual dipole, hard-iron and soft-iron calibration'
---

Hold a compass flat in your hand and turn around. The needle keeps pointing the same way while you spin under it. That needle is feeling Earth's magnetic field, an invisible arrow that fills all the space around you. Now bring the compass close to a steel table leg or a speaker. The needle swings off. The metal nearby has its own magnetism, and the compass cannot tell which part of the pull is Earth and which part is the table.

A spacecraft **magnetometer** is an electronic compass that measures the field as a full 3-D arrow, with both a direction and a strength. It is the one attitude sensor that never loses its target. The field is there in sunlight and in Earth's shadow. Nothing can blind it, and there is no bright object to keep it away from. That is why nearly every satellite in low Earth orbit carries one, often as the first sensor switched on after launch.

It pays for that reliability with the weakest accuracy in this module, for two reasons. The magnetometer must compare its reading against a *model* of Earth's field, and the model is wrong by a few hundred nanotesla. And the spacecraft is itself a magnet, like the table leg next to your compass. This lesson covers both, and how to calibrate the spacecraft's own magnetism out of the data.

## What a magnetometer measures, and what one reading tells you

Most spacecraft magnetometers are **[[fluxgates|fluxgate]]**. A fluxgate is a small core of easily magnetized metal wrapped in two coils. One coil drives the core into and out of full magnetization thousands of times a second. The other coil picks up how an outside field along the core upsets that rhythm. Its signal is proportional to the field component along the core. There are no moving parts and no optics. Three cores at right angles give the full vector reading $\mathbf{m}$ (bold m, "the measurement vector"), tens to hundreds of times per second. Small satellites often use cheaper magnetoresistive chips instead.

The unit is the **[[nanotesla|nanotesla]]** (nT), a billionth of a tesla. In low Earth orbit the field is about $20{,}000$ to $50{,}000\,\mathrm{nT}$.

What does one reading tell you about attitude? Turn the reading into a direction in the body frame, $\hat{\mathbf{b}} = \mathbf{m}/\lVert\mathbf{m}\rVert$. (The hat, read "b hat", means a unit vector, length one. The double bars mean the length of a vector.) The field model tells you the same direction in the reference frame, $\hat{\mathbf{r}}$, at the spacecraft's current position. Matching the two is the same job as matching a star or the Sun.

Here is the catch. Picture the spacecraft skewered on a rod that points along the field. Spin it around that rod. The field still points along the rod, so the magnetometer reads exactly the same thing at every angle of the spin. The reading cannot see that rotation.

The least-squares module put this in matrix form. One unit-vector observation adds $a(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})$ to the information matrix for the attitude error, where $a$ is the measurement's weight. That matrix has **rank two**: it carries information about two directions of rotation and none about the third. The blind direction is $\hat{\mathbf{b}}$ itself.

::: key What one vector measurement gives you
Two of three attitude degrees of freedom. Rotation about the measured vector is unobservable instantaneously; you need a second non-parallel vector, or time plus dynamics in a filter.
:::

::: note Why it has to be true
Multiply the information matrix by the blind direction:
$$
(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})\,\hat{\mathbf{b}} = \hat{\mathbf{b}} - \hat{\mathbf{b}}\,(\hat{\mathbf{b}}^\mathsf{T}\hat{\mathbf{b}}) = \hat{\mathbf{b}} - \hat{\mathbf{b}} = \mathbf{0}.
$$
The middle step uses $\hat{\mathbf{b}}^\mathsf{T}\hat{\mathbf{b}} = 1$, because $\hat{\mathbf{b}}$ has length one. So $\hat{\mathbf{b}}$ is a direction the matrix sends to zero: zero information about rotation about it. Any direction $\mathbf{u}$ at right angles to $\hat{\mathbf{b}}$ has $\hat{\mathbf{b}}^\mathsf{T}\mathbf{u} = 0$, so the matrix returns $\mathbf{u}$ unchanged: full information. Two good directions, one blind one.
:::

A second, non-parallel vector, from a sun sensor or star tracker, fills in the missing axis. Without one, the field's slow turning along the orbit helps, but only over many minutes, with a gyro and filter in between.

## The IGRF and WMM: a model standing in for a catalog

A star tracker compares its stars against a catalog of measured positions. A magnetometer has no catalog. Instead it uses a model, a formula that predicts the field at any place and time. Two are standard.

- The **International Geomagnetic Reference Field (IGRF)**, published by an international association of geomagnetism scientists.
- The **World Magnetic Model (WMM)**, published by the United States and United Kingdom geological agencies, used in navigation systems and phones.

Both build the field out of **[[spherical harmonics|spherical-harmonics]]**, a set of standard patterns on a sphere, each with a fitted size called a coefficient. They are fitted to decades of observatory measurements and to satellites built to map the field. Each model is valid for a five-year period, and comes with **[[secular variation|secular-variation]]** terms: the rate at which each coefficient is changing, so the flight computer can move the model forward in time between updates.

::: key IGRF / WMM
Spherical harmonic models of the geomagnetic field, updated roughly every five years with secular variation terms. Model error of a few hundred nT sets the floor on magnetometer-based attitude.
:::

Even a fresh model is wrong, for three reasons:

1. **Truncation.** The series stops at a finite number of patterns, so fine detail is missing.
2. **Crustal anomalies.** Magnetized rocks in Earth's crust make small local bumps that no smooth global model can hold.
3. **Drift.** The real field does not change at a perfectly steady rate, so the secular-variation terms slowly go stale. This error keeps growing until the next update.

No onboard processing removes this error. It is not noise on the measurement; it is error in what you compare the measurement to.

How big is that as an angle? An error $\delta B$ at right angles to a field of strength $B$ tilts the predicted direction by about $\delta B/B$ radians. For $200\,\mathrm{nT}$ in a $30{,}000\,\mathrm{nT}$ field that is about $0.0067\,\mathrm{rad}$, or $0.38^\circ$. Add the spacecraft's own magnetism and calibration leftovers, and magnetometer attitude typically ends up around one to a few degrees. That is good enough for safe modes and for steering magnetic torquers, not for fine pointing.

### The dipole: the big picture in one formula

The first and largest pattern in the series is a **dipole**, the field of a single bar magnet at Earth's center. Its axis is tilted about $10^\circ$ from Earth's spin axis. The dipole alone captures most of the field's shape. Write $\hat{\mathbf{m}}$ for the direction of the dipole's magnetic moment, $\hat{\mathbf{r}}$ for the spacecraft's direction from Earth's center, $r$ for its distance and $R_\oplus$ ("R earth") for Earth's radius. Then

$$
\mathbf{B}(\mathbf{r}) = \frac{B_0 R_\oplus^3}{r^3}\Big[3(\hat{\mathbf{m}}\cdot\hat{\mathbf{r}})\hat{\mathbf{r}} - \hat{\mathbf{m}}\Big],
$$

where $B_0 \approx 3\times10^4\,\mathrm{nT}$ is the field strength at the surface on the magnetic equator. (Earth's moment points roughly toward the geographic *south* pole, which is why the north end of a compass needle points north.)

Read the formula in two places. Over the magnetic equator, $\hat{\mathbf{m}}\cdot\hat{\mathbf{r}} = 0$, so the bracket is $-\hat{\mathbf{m}}$, length $1$. Over a magnetic pole, $\hat{\mathbf{m}}\cdot\hat{\mathbf{r}} = \pm 1$, so the bracket is $3\hat{\mathbf{r}} - \hat{\mathbf{r}}$ or its negative, length $2$. So at a fixed height, **the field is twice as strong over the poles as over the equator**. And the $1/r^3$ out front means the field weakens fast with height. At geostationary altitude it is only about $100\,\mathrm{nT}$.

Flight software carries the full model. The dipole is for understanding.

::: example A tilted dipole along a polar orbit
A spacecraft flies a circular polar orbit at $500\,\mathrm{km}$. The Sun's direction makes an angle of $20^\circ$ with the orbit plane. That angle is called the **[[beta angle|beta-angle]]**. How strong is the field over one orbit, and how far apart are the field and Sun directions?

```python
import numpy as np

Re, B0 = 6378.0, 30000.0                     # km, nT

def dipole_field(r_vec, m_hat):
    r = np.linalg.norm(r_vec)
    r_hat = r_vec / r
    return (B0 * Re**3 / r**3) * (3 * np.dot(m_hat, r_hat) * r_hat - m_hat)

tilt = np.radians(10.0)
m_hat = -np.array([np.sin(tilt), 0.0, np.cos(tilt)])   # moment points roughly south
r_orbit = Re + 500.0

beta = np.radians(20.0)
s_hat = np.array([np.cos(beta), np.sin(beta), 0.0])    # Sun, 20 deg out of the orbit plane

Bmag, ang = [], []
for u in np.linspace(0, 2 * np.pi, 720, endpoint=False):
    r_vec = r_orbit * np.array([np.cos(u), 0.0, np.sin(u)])   # orbit in the x-z plane
    B = dipole_field(r_vec, m_hat)
    Bmag.append(np.linalg.norm(B))
    ang.append(np.degrees(np.arccos(np.clip(B @ s_hat / np.linalg.norm(B), -1, 1))))
print(f"field strength: {min(Bmag):.0f} to {max(Bmag):.0f} nT")
print(f"field-to-Sun angle: {min(ang):.1f} to {max(ang):.1f} deg")
# field strength: 23921 to 47843 nT
# field-to-Sun angle: 20.0 to 160.0 deg
```

**Strength.** The weakest field is at the magnetic equator crossing. Check it by hand: $6378/6878$ cubed is $0.79738$, and $30{,}000 \times 0.79738 \approx 23{,}921\,\mathrm{nT}$. The strongest, over the magnetic pole, is twice that. The factor of two from the formula shows up along a real orbit.

**Direction.** The field-to-Sun angle sweeps from $20^\circ$ to $160^\circ$ every orbit. The smallest value is exactly the beta angle. Here is why: both the magnetic axis and the orbit lie in the same plane, so the field arrow stays in the orbit plane. The Sun sits $20^\circ$ out of that plane, and an arrow in the plane can come no closer to the Sun than that.

So a magnetometer-plus-sun-sensor pair changes its geometry every few minutes. The least-squares module found that for two equally good vectors at angle $\theta$, the worst attitude uncertainty is $\sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$. At $90^\circ$ that factor is $1$. At $20^\circ$ it is about $4.1$. On a day when the beta angle is $5^\circ$, the same sweep reaches $5^\circ$, and the factor grows to about $16$.
:::

::: warning Two vectors that line up
When the field and Sun directions come close to parallel, every two-vector method degrades: the data no longer holds the rotation about their shared direction. TRIAD, which trusts one vector completely, does worst. The fixes: QUEST, weighting each vector by its real accuracy; a gyro-driven filter to coast through the bad window; and a covariance that honestly grows meanwhile.
:::

## The spacecraft is a magnet too: the residual dipole

Everything on board that is magnetized, and every loop of wire that carries current, adds a little field. Add them all up and, from far away, the spacecraft looks like one small bar magnet. Its strength is the **[[residual dipole|residual-dipole]]**, measured in ampere-square-meters ($\mathrm{A\,m^2}$).

It causes two problems.

- **It corrupts the reading.** The magnetometer measures Earth's field plus the spacecraft's own.
- **It makes a torque.** A magnet in a field is twisted toward alignment, like a compass needle. The torque is $\boldsymbol{\tau} = \mathbf{m}_{\text{sc}}\times\mathbf{B}$, where $\mathbf{m}_{\text{sc}}$ is the residual dipole. A $1\,\mathrm{A\,m^2}$ dipole in a $30{,}000\,\mathrm{nT}$ field feels up to $3\times10^{-5}\,\mathrm{N\,m}$. That is tiny, but it never stops, and the attitude controller has to fight it.

The field of a small dipole falls off like $1/d^3$ with distance $d$. So the standard fix for the first problem is distance. Mount the magnetometer at the end of a **boom**, away from the electronics, and keep the spacecraft magnetically "clean" by design: cancel current loops by running wires in twisted pairs, and avoid magnetic materials near the sensor.

::: example How long should the boom be?
A spacecraft has a residual dipole of $1\,\mathrm{A\,m^2}$. Along the dipole's axis, its field at distance $d$ is $2 \times (\mu_0/4\pi)\,m_{\text{sc}}/d^3$, where $\mu_0/4\pi = 10^{-7}\,\mathrm{T\,m/A}$. How big is that at $0.5$, $1$ and $2\,\mathrm{m}$?

At $d = 1\,\mathrm{m}$: $2 \times 10^{-7} \times 1 / 1^3 = 2\times10^{-7}\,\mathrm{T}$, which is $200\,\mathrm{nT}$.

Halve the distance and the cube makes it $2^3 = 8$ times bigger: $1600\,\mathrm{nT}$ at $0.5\,\mathrm{m}$. Double it and it is $8$ times smaller: $25\,\mathrm{nT}$ at $2\,\mathrm{m}$.

Sanity check: at $1\,\mathrm{m}$ the spacecraft's own field already equals the model error, and at $0.5\,\mathrm{m}$ it would swamp it. A two-meter boom pushes it well below, which is why booms of a meter or more are common.
:::

## Hard iron and soft iron

The spacecraft's field at the sensor comes in two kinds, from different physics.

**Hard iron** is an *added* offset. Permanent magnets (a latching valve, a motor) and steady currents make a field at the sensor that is fixed in the body frame. It does not care which way the spacecraft points. It is the near-field face of the residual dipole.

**Soft iron** is a *multiplied* distortion. Some metals are not magnets on their own, but become magnetized by whatever field they sit in, the way a paper clip becomes a weak magnet when it touches a magnet. Earth's field magnetizes them, so their extra field depends on which way Earth's field points in the body. It changes as the spacecraft turns, though the metal never moves. The same matrix also absorbs the sensor's own scale-factor errors and axes that are not quite at right angles.

Together, in body-frame components,

$$
\mathbf{m} = \mathbf{A}\,\mathbf{B}_{\text{body}} + \mathbf{b},
$$

with $\mathbf{b}$ the hard-iron offset (a vector) and $\mathbf{A}$ the soft-iron matrix, a $3\times3$ invertible matrix. For a perfectly clean spacecraft, $\mathbf{A}$ would be the identity and $\mathbf{b}$ would be zero.

Now the trick that separates them. Let the spacecraft tumble for a few minutes. It barely moves along its orbit in that time, so the field's *strength* stays nearly constant, while its *direction* in the body sweeps over every direction. A perfect magnetometer would trace a sphere of that fixed radius. Hard iron shifts the sphere's center to $\mathbf{b}$. Soft iron stretches and tilts the sphere into an **[[ellipsoid|ellipsoid-picture]]**, a squashed or stretched sphere, like a rugby ball. So calibration is a shape-fitting problem. Fit the ellipsoid, and read off the distortion.

::: key Hard-iron and soft-iron
Hard iron is an additive offset from the spacecraft own permanent dipole; soft iron is a multiplicative distortion from induced magnetisation. Calibration fits an ellipsoid: centre gives hard iron, the shape matrix gives soft iron. In symbols, $\mathbf{m}=\mathbf{A}\mathbf{B}_{\text{body}}+\mathbf{b}$.
:::

## Calibrating by fitting an ellipsoid

Every point on an ellipsoid centered at $\mathbf{b}$ obeys

$$
(\mathbf{m}-\mathbf{b})^\mathsf{T}\mathbf{Q}\,(\mathbf{m}-\mathbf{b}) = k,
$$

for some symmetric matrix $\mathbf{Q}$ (one that equals its own transpose) and a positive number $k$. For a sphere, $\mathbf{Q}$ is the identity and $k$ is the radius squared.

This looks hard to fit, because $\mathbf{b}$ sits inside a product. The way out is to multiply it out. Expanding gives

$$
\mathbf{m}^\mathsf{T}\mathbf{Q}\,\mathbf{m} + \mathbf{p}^\mathsf{T}\mathbf{m} = k - \mathbf{b}^\mathsf{T}\mathbf{Q}\,\mathbf{b}, \qquad \mathbf{p} = -2\mathbf{Q}\,\mathbf{b}.
$$

Write $\mathbf{m} = (x, y, z)$. The left side is $Q_{xx}x^2 + Q_{yy}y^2 + Q_{zz}z^2 + 2Q_{xy}xy + 2Q_{xz}xz + 2Q_{yz}yz + p_x x + p_y y + p_z z$. Every term is a known number from the data times one unknown. So it is **linear** in nine unknowns: six entries of $\mathbf{Q}$ and three of $\mathbf{p}$. Scale the whole equation so the right side is $1$. (Any ellipsoid can be scaled that way.) Then each sample gives one row

$$
\big(x^2,\ y^2,\ z^2,\ 2xy,\ 2xz,\ 2yz,\ x,\ y,\ z\big)\cdot(\text{nine unknowns}) = 1,
$$

and stacking hundreds of rows is ordinary linear least squares, the first lesson of the least-squares module.

Then undo the expansion in three steps.

1. **The center.** From $\mathbf{p} = -2\mathbf{Q}\mathbf{b}$, solve for $\mathbf{b} = -\tfrac12\mathbf{Q}^{-1}\mathbf{p}$. That is the hard-iron bias.
2. **The right side.** With the right side scaled to $1$, the original constant is $k = 1 + \mathbf{b}^\mathsf{T}\mathbf{Q}\,\mathbf{b}$.
3. **The shape.** Take the **[[matrix square root|matrix-square-root]]** of $\mathbf{Q}/k$, the symmetric matrix $\mathbf{A}$ with $\mathbf{A}\mathbf{A} = \mathbf{Q}/k$. Then $\lVert\mathbf{A}(\mathbf{m}-\mathbf{b})\rVert^2 = (\mathbf{m}-\mathbf{b})^\mathsf{T}(\mathbf{Q}/k)(\mathbf{m}-\mathbf{b}) = 1$. The corrected readings $\mathbf{A}(\mathbf{m}-\mathbf{b})$ lie on a sphere of radius one.

::: example Recovering hard and soft iron from a tumble
Make fake data: $800$ random directions in a $42{,}000\,\mathrm{nT}$ field, a known soft-iron matrix, a known hard-iron offset, and $40\,\mathrm{nT}$ of sensor noise. Then see if the fit finds them.

```python
import numpy as np

def fit_ellipsoid(m):
    """Fit the ellipsoid that N x 3 samples m lie on.
    Returns (A, b): A @ (m - b) lies on a sphere of radius 1."""
    x, y, z = m[:, 0], m[:, 1], m[:, 2]
    D = np.column_stack([x*x, y*y, z*z, 2*x*y, 2*x*z, 2*y*z, x, y, z])
    c, *_ = np.linalg.lstsq(D, np.ones(len(m)), rcond=None)
    Q = np.array([[c[0], c[3], c[4]],
                  [c[3], c[1], c[5]],
                  [c[4], c[5], c[2]]])
    p = c[6:9]
    b = -0.5 * np.linalg.solve(Q, p)       # centre: the hard-iron bias
    k = 1.0 + b @ Q @ b                    # right-hand side after completing the square
    w, V = np.linalg.eigh(Q / k)           # symmetric square root of Q/k
    A = V @ np.diag(np.sqrt(w)) @ V.T
    return A, b

rng = np.random.default_rng(3)
B_true = 42000.0                                   # local field strength, nT
bias_true = np.array([900.0, -650.0, 1100.0])      # hard iron, nT
S_true = np.array([[1.05, 0.03, -0.01],
                   [0.03, 0.97, 0.02],
                   [-0.01, 0.02, 1.04]])           # soft iron
v = rng.standard_normal((800, 3))
v /= np.linalg.norm(v, axis=1, keepdims=True)      # 800 random directions: a tumble
m = (S_true @ (B_true * v).T).T + bias_true + rng.normal(0, 40.0, (800, 3))

r_raw = np.linalg.norm(m, axis=1)
print("raw spread:", round(np.std(r_raw) / np.mean(r_raw), 4))
A, b = fit_ellipsoid(m)
print("bias found:", np.round(b, 1), " error:", round(np.linalg.norm(b - bias_true), 1), "nT")
cal = (A @ (m - b).T).T                            # unit sphere
r_cal = np.linalg.norm(cal, axis=1)
print("calibrated spread:", round(np.std(r_cal) / np.mean(r_cal), 5))
cal_nT = B_true * cal                              # scale by the model's field strength
print("mean |B| after scaling:", round(np.mean(np.linalg.norm(cal_nT, axis=1))), "nT")
# raw spread: 0.0368
# bias found: [ 900.  -650.8 1097.8]  error: 2.3 nT
# calibrated spread: 0.00099
# mean |B| after scaling: 42000 nT
```

Read the output line by line.

- **Raw data.** The length of the raw readings wanders by $3.7\%$ of the average length (standard deviation over mean). A true sphere would give zero. This is the ellipsoid.
- **Bias.** The fit finds the hard-iron offset to within $2.3\,\mathrm{nT}$. The offset itself is about $1563\,\mathrm{nT}$ long, so that is better than $0.2\%$.
- **After calibration.** The spread drops to about $0.1\%$. Sanity check: the noise was $40\,\mathrm{nT}$ in a $42{,}000\,\mathrm{nT}$ field, and $40/42{,}000 \approx 0.00095$. What is left is the sensor noise and nothing else. The soft iron is gone too.
:::

Notice one thing the fit never used: the true field strength, $42{,}000\,\mathrm{nT}$. The fit only ever sees the *shape*. Double every true field value and halve $\mathbf{A}$, and you get exactly the same data. So a tumble can never tell you the absolute size of the field, however long you collect. That is why the fit returns a sphere of radius one. The last line of the code does the final step: multiply by the field strength the IGRF or WMM predicts at that place and time. Only the model can supply that number in nanotesla.

::: warning Calibrate in flight, not only on the ground
A ground test before launch cannot see every source. Torquer rods driven hard during **[[detumble|detumble]]**, batteries under flight currents and deployed panels all change the magnetic picture. So magnetometers are calibrated again on orbit with this same ellipsoid fit, and again whenever a mode change alters which currents flow.
:::

## Check yourself

::: check
Using the information matrix $a(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})$, explain why one magnetometer reading fixes only two of the three attitude degrees of freedom. Which rotation is it blind to?
:::

::: answer
Multiply the matrix by $\hat{\mathbf{b}}$: $(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})\hat{\mathbf{b}} = \hat{\mathbf{b}}-\hat{\mathbf{b}}(\hat{\mathbf{b}}^\mathsf{T}\hat{\mathbf{b}}) = \mathbf{0}$, because $\hat{\mathbf{b}}^\mathsf{T}\hat{\mathbf{b}}=1$. So $\hat{\mathbf{b}}$ is a direction with eigenvalue zero: no information. Any direction at right angles to $\hat{\mathbf{b}}$ comes back unchanged, with full information. The blind rotation is the one about the measured field direction itself. Spinning the spacecraft about the field line leaves the reading unchanged, however precise the sensor.
:::

::: check
A spacecraft has a permanently magnetized latch valve and a large radiator panel made of a mildly magnetic metal, both near the magnetometer. Which is hard iron and which is soft iron? How does each show up in a tumble's raw data?
:::

::: answer
The latch valve is hard iron. Its magnetization is permanent, so its field at the sensor is the same at every attitude: it shifts the center of the whole data cloud away from the origin. The radiator panel is soft iron. Earth's field magnetizes it, by an amount that depends on which way that field points relative to the panel. As the spacecraft tumbles that changes, so the panel stretches and tilts the data cloud into an ellipsoid.
:::

::: check
Using $B_{\text{eq}} = B_0(R_\oplus/r)^3$, find the field strength over the magnetic equator at $800\,\mathrm{km}$ altitude. Compare it with the $23{,}921\,\mathrm{nT}$ at $500\,\mathrm{km}$.
:::

::: answer
The distance from Earth's center is $r = 6378 + 800 = 7178\,\mathrm{km}$. The ratio cubed is $(6378/7178)^3 = 0.70153$. So $B_{\text{eq}} = 30000 \times 0.70153 = 21{,}046\,\mathrm{nT}$. That is about $12\%$ weaker than at $500\,\mathrm{km}$, from only $300\,\mathrm{km}$ more height, because the dipole falls off as $1/r^3$. A weaker field means the same few-hundred-nanotesla model error is a bigger angle.
:::

::: check
A magnetometer is calibrated from a tumble alone, without ever using the IGRF or WMM. What can that calibration find, and what can it never find, however much data is collected?
:::

::: answer
It finds the hard-iron offset $\mathbf{b}$ (the ellipsoid's center) and the *shape* of the soft-iron distortion: $\mathbf{A}$ up to one overall scale factor. It never finds that scale. Multiplying $\mathbf{A}$ by any constant and dividing the true field strength by the same constant gives identical data. Only an outside number, the model's field strength at that place and time, fixes the scale in nanotesla.
:::

::: check
Name the three sources of the IGRF and WMM model error. Which one keeps growing between the five-year updates?
:::

::: answer
Truncation: the series stops at a finite number of patterns. Crustal anomalies: magnetized rocks make local bumps no smooth global model can hold. Drift: the secular-variation terms assume a steady rate of change, and the real field is not steady. Drift is the one that keeps growing until the next model replaces it.
:::

::: check
A satellite in a polar orbit uses a sun sensor and a magnetometer for coarse attitude. Today its beta angle is $8^\circ$. Using this lesson's dipole picture, what is the smallest field-to-Sun angle you should expect over an orbit? How much worse is the worst-direction uncertainty there than at $90^\circ$, and what should the software do?
:::

::: answer
With the magnetic axis roughly in the orbit plane, the field arrow stays close to that plane, so the smallest field-to-Sun angle is about the beta angle, $8^\circ$. The worst-direction factor is $1/(\sqrt2\sin(\theta/2))$. At $90^\circ$ it is $1$. At $8^\circ$ it is $1/(\sqrt2\sin 4^\circ)$, about $10.1$, so roughly ten times worse. Use QUEST rather than TRIAD, coast that part of the orbit on a gyro-propagated filter, and report the larger covariance honestly.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| One vector measurement | Rank-two information $a(\mathbf{I}-\hat{\mathbf{b}}\hat{\mathbf{b}}^\mathsf{T})$: two of three axes; blind to rotation about $\hat{\mathbf{b}}$ |
| IGRF / WMM | Spherical-harmonic field models, new every five years, with secular-variation rates; error of a few hundred nT from truncation, crustal anomalies and drift |
| $\mathbf{B}=\dfrac{B_0R_\oplus^3}{r^3}\big[3(\hat{\mathbf{m}}\cdot\hat{\mathbf{r}})\hat{\mathbf{r}}-\hat{\mathbf{m}}\big]$ | Tilted dipole, the biggest term; twice as strong over the poles; falls as $1/r^3$ |
| Beta angle | Smallest field-to-Sun angle in a polar orbit; small beta means near-parallel vectors |
| Residual dipole | The spacecraft's own magnet: corrupts the reading, makes torque $\mathbf{m}_{\text{sc}}\times\mathbf{B}$; fixed with booms and clean design |
| $\mathbf{m}=\mathbf{A}\mathbf{B}_{\text{body}}+\mathbf{b}$ | Hard iron $\mathbf{b}$ (added, fixed in body), soft iron $\mathbf{A}$ (multiplied, depends on field direction) |
| Ellipsoid fit | Linear least squares on nine unknowns; $\mathbf{b}=-\tfrac12\mathbf{Q}^{-1}\mathbf{p}$, $\mathbf{A}=(\mathbf{Q}/k)^{1/2}$ |
| Scale | A tumble fixes center and shape, never the size in nT; the field model supplies that |

The magnetometer completes this module's direction sensors: stars, the Sun, and a modeled field. The next lesson looks at Earth's own edge, to answer the simplest attitude question of all: which way is down.

::: context fluxgate How a fluxgate feels a field
The core is made of a metal that magnetizes very easily and then "fills up", or saturates. The drive coil pushes it to full magnetization one way, then the other, over and over. With no outside field, the two halves of each cycle are mirror images. An outside field along the core helps one half and hinders the other, so the core fills up a little earlier in one direction than the other. That lopsidedness shows up in the pickup coil at twice the drive frequency, and its size is proportional to the outside field. Fluxgates were developed in the 1930s and 1940s, and wartime versions were used to hunt submarines from aircraft.
:::

::: context nanotesla How small is a nanotesla?
The tesla measures magnetic field strength. A fridge magnet is a few thousandths of a tesla near its surface. Earth's field at the ground is only about $25{,}000$ to $65{,}000$ nanotesla, which is $0.000025$ to $0.000065$ tesla, weakest near the equator and strongest near the poles. So a spacecraft magnetometer is measuring something roughly a hundred times weaker than a fridge magnet, and trying to get its direction right to a fraction of a percent. That is why the spacecraft's own tiny currents matter so much.
:::

::: context spherical-harmonics Building a field out of patterns
A musical note can be built from a basic tone plus overtones. Spherical harmonics do the same for a quantity spread over a sphere. The first pattern, degree one, is the dipole: one north, one south. Degree two adds a four-lobed pattern, degree three a finer one, and so on. Each pattern has a coefficient saying how much of it is present. The IGRF runs up to degree 13 and the WMM up to degree 12. Higher degrees describe smaller features, and they also shrink faster with height, so in orbit the first few degrees matter most.
:::

::: context secular-variation The field is always on the move
"Secular" here means slow and long-term, from the Latin for "age". Earth's field is made by molten iron churning in the outer core, and it changes year by year. The north magnetic pole has drifted from northern Canada toward Siberia, at times by more than $50\,\mathrm{km}$ a year. In 2019 the change ran ahead of the forecast so much that the WMM got an unscheduled early update. A flight computer holding stale coefficients is comparing its readings with last decade's field.
:::

::: context beta-angle The Sun's angle to the orbit plane
Picture the orbit as a hoop around Earth. The beta angle is how far the Sun sits above or below the plane of the hoop. At beta $0^\circ$ the Sun lies in the plane, and the spacecraft passes through Earth's shadow every orbit. At high beta the Sun shines from the side, and the orbit may never enter shadow. Beta changes slowly over weeks as Earth goes around the Sun and the orbit plane turns. It comes back in thermal design and power planning, not only attitude.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="80" r="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="80" x2="210" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="98" font-size="12" fill="#1f2a44">orbit plane (edge-on)</text>
  <line x1="120" y1="80" x2="310" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="120" y1="80" x2="298.6" y2="15" stroke="#f2b880" stroke-width="3"/>
  <circle cx="310" cy="11" r="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="300" y="38" font-size="12" fill="#1f2a44">Sun</text>
  <path d="M 220 80 A 100 100 0 0 0 214 45.8" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="228" y="68" font-size="13" fill="#b4232c">β = 20°</text>
</svg>
```
:::

::: context residual-dipole Why magnetometers ride on booms
A dipole's field shrinks as the cube of distance, so moving the sensor away from the electronics pays off enormously: twice as far is eight times weaker. Voyager's magnetometers sit on a $13\,\mathrm{m}$ boom for this reason. The same residual dipole also shapes attitude control. Its steady torque is one of the disturbances you will budget for in the attitude-control module, and a spacecraft built to be magnetically clean has less of it to fight.
:::

::: context ellipsoid-picture What the calibration sees
Here is the idea in two dimensions. Without distortion, readings from a tumble fall on a circle centered on the origin. Hard iron slides the whole curve off center. Soft iron stretches and tilts it into an ellipse. The fit finds the ellipse, then undoes both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="20" x2="110" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="110" cy="100" r="50" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="44" y="165" font-size="12" fill="#1d6fd1">true field: circle</text>
  <ellipse cx="220" cy="80" rx="68" ry="42" transform="rotate(-25 220 80)" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="220" cy="80" r="3" fill="#b4232c"/>
  <line x1="110" y1="100" x2="220" y2="80" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="150" y="104" font-size="12" fill="#1f2a44">b</text>
  <text x="232" y="146" font-size="12" fill="#b4232c">raw readings: ellipse</text>
</svg>
```

The dashed arrow from the origin to the ellipse's center is the hard-iron offset $\mathbf{b}$. The stretch and tilt are the soft iron.
:::

::: context matrix-square-root Square roots of a matrix
For a number, the square root of $9$ is the $3$ with $3 \times 3 = 9$. For a symmetric matrix with positive eigenvalues, the symmetric square root is found by turning to the matrix's eigenvectors, taking the square root of each eigenvalue, and turning back. That is the `eigh` line in the code. But many matrices $\mathbf{A}$ satisfy $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{Q}/k$: any rotation of a solution works too. The fit cannot see that rotation, because rotating a sphere leaves a sphere. Choosing the symmetric one is a convention. Any leftover rotation is a misalignment between the magnetometer and the body, which lesson 12 estimates in flight.
:::

::: context detumble The first job after launch
When a satellite separates from its rocket it is usually tumbling. A detumble controller slows it down using only a magnetometer and magnetic torquer rods. The classic law, called B-dot, drives the torquers against the rate of change of the measured field: a changing reading means the spacecraft is turning, and pushing against that change drains the spin. It needs no attitude solution at all, which is why the magnetometer is often the first sensor put to work.
:::
