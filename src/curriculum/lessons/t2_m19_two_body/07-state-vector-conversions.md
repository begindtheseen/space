---
id: l07-state-vector-conversions
title: State vector to orbital elements and back
minutes: 21
covers:
  - state vector to orbital element conversion, both directions
---

Two routines sit at the heart of every astrodynamics library: one that takes an inertial position and velocity and returns the six classical elements, and one that does the reverse. They look trivial – a dozen lines each – and they are where a startling fraction of orbit software bugs live. The angles have quadrants that must be resolved from vector signs, the arccosine misbehaves at $\pm 1$, and three families of perfectly ordinary orbits make one or more of the angles undefined. A conversion that returns `NaN` for a near-circular orbit has failed on the most common orbit there is.

This lesson builds both algorithms step by step from the definitions of the last lesson. Every angle is computed with a two-argument arctangent whose numerator and denominator are spelled out, every quadrant decision is explained geometrically, and every degenerate case is handled by returning the well-defined replacement angle rather than dividing by zero. Then it works one general example with the quadrant flips actually firing, one fully degenerate example, and the round trip back to the state vector. The module's coding exercise asks you to implement exactly this.

Throughout, $\mathbf{r}$ and $\mathbf{v}$ are inertial (ECI) components, $\hat{\mathbf{K}} = (0, 0, 1)$, and angles are in radians inside the code and degrees when printed.

## From state vector to elements

### Step 1 – the three vectors

Compute the magnitudes $r = \lVert \mathbf{r} \rVert$ and $v = \lVert \mathbf{v} \rVert$, then

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v}, \qquad
\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h} = (-h_y,\; h_x,\; 0), \qquad
\mathbf{e} = \frac{\left(v^2 - \mu/r\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu},
$$

with magnitudes $h$, $n$ and $e$. Keep $\mathbf{r} \cdot \mathbf{v}$; its sign is needed later. Also form the unit normal $\hat{\mathbf{h}} = \mathbf{h}/h$, which is used to give the in-plane angles a sign.

### Step 2 – size and shape

The energy gives the semi-major axis:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad a = -\frac{\mu}{2\varepsilon} = \frac{1}{2/r - v^2/\mu}.
$$

The second form avoids computing $\varepsilon$ and dividing by it, but both fail for a parabola, where $\varepsilon = 0$ and $a$ is infinite. Test for $\lvert 1 - e \rvert$ below a tolerance and report $p = h^2/\mu$ in that case; $p$ is finite for every conic and should be returned alongside $a$ regardless.

### Step 3 – inclination

$$
i = \arccos\!\left(\frac{h_z}{h}\right).
$$

Since $0 \le i \le \pi$ and the arccosine returns exactly that range, no quadrant check is needed. Retrograde orbits have $h_z < 0$ and come out with $i > 90^\circ$ automatically – as long as you do not accidentally take the absolute value of $h_z$ somewhere. Clamp the argument to $[-1, 1]$ before the arccosine; round-off in the cross product can push $h_z/h$ to $1.0000000000000002$ for an equatorial orbit, and the arccosine of that is `NaN`.

### Step 4 – right ascension of the ascending node

$\Omega$ is the angle from $\hat{\mathbf{I}}$ to $\mathbf{n}$ in the equatorial plane, measured counter-clockwise from above. The components of $\mathbf{n}$ *are* its cosine and sine times $n$:

$$
\Omega = \operatorname{atan2}(n_y,\; n_x) = \operatorname{atan2}(h_x,\; -h_y), \qquad \text{wrapped to } [0, 2\pi).
$$

The older recipe – $\Omega = \arccos(n_x/n)$, then $\Omega \to 2\pi - \Omega$ if $n_y < 0$ – gives the same answer, because a node vector with negative $y$-component lies in the lower half of the equatorial plane where the angle from $\hat{\mathbf{I}}$ exceeds $180^\circ$. The two-argument arctangent does the same decision without the branch and without the clamping problem.

### Step 5 – argument of periapsis

$\omega$ is the angle from $\mathbf{n}$ to $\mathbf{e}$, in the orbit plane, positive in the direction of motion. The direction of motion is the direction in which a rotation about $+\hat{\mathbf{h}}$ carries $\mathbf{n}$, so the signed sine is $(\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}}$ and the cosine is $\mathbf{n} \cdot \mathbf{e}$:

$$
\omega = \operatorname{atan2}\!\big((\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}},\; \mathbf{n} \cdot \mathbf{e}\big).
$$

The arccosine recipe is $\omega = \arccos\!\big(\mathbf{n} \cdot \mathbf{e}/(n e)\big)$, flipped to $2\pi - \omega$ when $e_z < 0$. The geometric reason for the flip: from the ascending node the spacecraft moves into the northern hemisphere, so periapsis with $e_z > 0$ is less than half an orbit past the node, and periapsis with $e_z < 0$ is more than half an orbit past it. You can verify that $(\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}}$ has the sign of $e_z$ – both say the same thing.

### Step 6 – true anomaly

$\nu$ is the angle from $\mathbf{e}$ to $\mathbf{r}$, in the orbit plane, in the direction of motion:

$$
\nu = \operatorname{atan2}\!\big((\mathbf{e} \times \mathbf{r}) \cdot \hat{\mathbf{h}},\; \mathbf{e} \cdot \mathbf{r}\big).
$$

The arccosine recipe flips when $\mathbf{r} \cdot \mathbf{v} < 0$: a spacecraft moving toward the centre is on the inbound half of the orbit, between apoapsis and periapsis, so its true anomaly exceeds $180^\circ$. Again $(\mathbf{e} \times \mathbf{r}) \cdot \hat{\mathbf{h}}$ carries the same sign as $\mathbf{r} \cdot \mathbf{v}$, because $\mathbf{r} \cdot \mathbf{v} = r\dot{r}$ and $\dot{r} = (\mu/h)e\sin\nu$.

### Step 7 – the degenerate cases

Decide with a tolerance $\epsilon_{\text{tol}}$ (around $10^{-8}$ for double precision and kilometre units – smaller and round-off triggers false alarms, larger and you throw away real information):

- **Circular inclined** ($e < \epsilon_{\text{tol}}$, $n \ge \epsilon_{\text{tol}}$): $\mathbf{e}$ has no direction, so $\omega$ and $\nu$ are meaningless. Set $\omega = 0$ and return the argument of latitude in the slot for $\nu$:
$$
u = \operatorname{atan2}\!\big((\mathbf{n} \times \mathbf{r}) \cdot \hat{\mathbf{h}},\; \mathbf{n} \cdot \mathbf{r}\big).
$$
- **Elliptical equatorial** ($n < \epsilon_{\text{tol}}$, $e \ge \epsilon_{\text{tol}}$): $\mathbf{n}$ has no direction, so $\Omega$ and $\omega$ are meaningless. Set $\Omega = 0$ and return the longitude of periapsis, measured from $\hat{\mathbf{I}}$ directly, in the slot for $\omega$:
$$
\varpi = \operatorname{atan2}(e_y,\; e_x), \qquad \varpi \to 2\pi - \varpi \ \text{ if } h_z < 0.
$$
The flip for retrograde equatorial orbits is needed because the angle must be measured in the direction of motion, which for $h_z < 0$ is clockwise seen from the north.
- **Circular equatorial** (both small): return the true longitude, from $\hat{\mathbf{I}}$ to $\mathbf{r}$, in the slot for $\nu$, with the same retrograde flip:
$$
l = \operatorname{atan2}(r_y,\; r_x), \qquad l \to 2\pi - l \ \text{ if } h_z < 0.
$$

Document which angle you returned. A function that silently puts $u$ where the caller expects $\nu$ is as dangerous as one that returns `NaN`.

::: example A general orbit, with both quadrant flips firing
Given, in ECI, $\mathbf{r} = (7408.900,\; 3378.656,\; -1279.858)\,\mathrm{km}$ and $\mathbf{v} = (-3.0312,\; 1.9918,\; -5.8080)\,\mathrm{km/s}$.

Step 1. $r = 8242.885\,\mathrm{km}$, $v = 6.84750\,\mathrm{km/s}$, $\mathbf{r} \cdot \mathbf{v} = -8294.84\,\mathrm{km^2/s}$ (descending). $\mathbf{h} = (-17\,074.01,\; 46\,910.40,\; 24\,998.43)\,\mathrm{km^2/s}$, $h = 55\,830.36$. $\mathbf{n} = (-46\,910.40,\; -17\,074.01,\; 0)$, $n = 49\,921.01$. With $v^2 - \mu/r = 46.8883 - 48.3569 = -1.4686$,
$$
\mathbf{e} = \frac{-1.4686\,\mathbf{r} + 8294.84\,\mathbf{v}}{398\,600.4418} = (-0.090376,\; 0.029001,\; -0.116148), \qquad e = 0.15000 .
$$

Step 2. $\varepsilon = 23.4442 - 48.3569 = -24.9128\,\mathrm{km^2/s^2}$, $a = 398\,600.4418/49.8255 = 7999.93\,\mathrm{km}$; $p = h^2/\mu = 7819.93\,\mathrm{km}$.

Step 3. $i = \arccos(24\,998.43/55\,830.36) = \arccos(0.44775) = 63.400^\circ$.

Step 4. $\Omega = \operatorname{atan2}(-17\,074.01,\; -46\,910.40) = 200.000^\circ$. By the arccosine route: $\arccos(-46\,910.40/49\,921.01) = 160.000^\circ$, and $n_y < 0$ flips it to $200.000^\circ$.

Step 5. $\mathbf{n} \cdot \mathbf{e} = 4239.6 - 495.2 = 3744.4$, $n e = 7488.1$, cosine $0.50005$, arccosine $59.996^\circ$. Since $e_z = -0.116 < 0$, $\omega = 360^\circ - 59.996^\circ = 300.004^\circ$. The atan2 form gives $300.004^\circ$ directly.

Step 6. $\mathbf{e} \cdot \mathbf{r} = -669.59 + 97.98 + 148.66 = -422.95$, $e r = 1236.4$, cosine $-0.34208$, arccosine $110.004^\circ$. Since $\mathbf{r} \cdot \mathbf{v} < 0$, $\nu = 360^\circ - 110.004^\circ = 249.996^\circ$.

Result: $a = 7999.93\,\mathrm{km}$, $e = 0.1500$, $i = 63.400^\circ$, $\Omega = 200.000^\circ$, $\omega = 300.004^\circ$, $\nu = 249.996^\circ$. The state was generated from $(8000, 0.15, 63.4^\circ, 200^\circ, 300^\circ, 250^\circ)$ and rounded to the digits shown, which accounts for the last-place differences. Without the two flips you would have reported $\omega = 60^\circ$ and $\nu = 110^\circ$ – a perigee in the wrong hemisphere and a spacecraft on the wrong half of its orbit.
:::

::: example A circular, equatorial, retrograde orbit
$\mathbf{r} = (7000,\; 0,\; 0)\,\mathrm{km}$, $\mathbf{v} = (0,\; -7.5461,\; 0)\,\mathrm{km/s}$, where $7.5461 = \sqrt{\mu/7000}$ is the circular speed.

$\mathbf{h} = (0,\; 0,\; -52\,822.4)$: $h_z < 0$, so $i = \arccos(-1) = 180^\circ$, retrograde. $\mathbf{n} = (-h_y, h_x, 0) = (0, 0, 0)$: equatorial, $\Omega$ undefined. $v^2 - \mu/r = 56.943 - 56.943 = 0$ and $\mathbf{r} \cdot \mathbf{v} = 0$, so $\mathbf{e} = \mathbf{0}$ to round-off ($10^{-16}$): circular, $\omega$ and $\nu$ undefined. $a = 1/(2/7000 - 56.943/398\,600.4418) = 7000.0\,\mathrm{km}$ is perfectly well defined.

Both tests fire, so return the true longitude: $l = \operatorname{atan2}(0, 7000) = 0$, and the retrograde flip $2\pi - 0$ wraps to $0$. The function returns $(7000.0,\; 0,\; 180^\circ,\; 0,\; 0,\; l = 0)$ with no `NaN` anywhere – which is what the exercise's test demands. A naive implementation would have divided by $n = 0$ and $e = 0$ twice.
:::

## From elements to state vector

The reverse direction has no quadrant problems, because it builds vectors from angles rather than angles from vectors. From the last lesson, in the perifocal frame,

$$
r = \frac{p}{1 + e\cos\nu}, \qquad
\mathbf{r}_{PQW} = \begin{pmatrix} r\cos\nu \\ r\sin\nu \\ 0 \end{pmatrix}, \qquad
\mathbf{v}_{PQW} = \sqrt{\frac{\mu}{p}}\begin{pmatrix} -\sin\nu \\ e + \cos\nu \\ 0 \end{pmatrix},
$$

with $p = a(1 - e^2)$ for any non-parabolic orbit (accept $p$ directly if you want to support the parabola). Then rotate with $\mathbf{Q} = \mathbf{R}_3(-\Omega)\,\mathbf{R}_1(-i)\,\mathbf{R}_3(-\omega)$:

$$
\mathbf{r}_{IJK} = \mathbf{Q}\,\mathbf{r}_{PQW}, \qquad \mathbf{v}_{IJK} = \mathbf{Q}\,\mathbf{v}_{PQW}.
$$

For the degenerate cases the same formula works if you feed it consistent inputs: for a circular orbit set $\omega = 0$ and put $u$ in place of $\nu$; for an equatorial orbit set $\Omega = 0$ and put $\varpi$ in place of $\omega$; for circular equatorial set both to zero and put $l$ in place of $\nu$. This is why the forward conversion returns the replacement angle *in the slot* of the undefined one: the pair of functions then round-trips without special cases in the inverse.

::: example The round trip
Feed the elements from the first example back in: $p = 7999.93\,(1 - 0.15^2) = 7819.93\,\mathrm{km}$, $r = 7819.93/(1 + 0.15\cos 249.996^\circ) = 7819.93/0.94869 = 8242.88\,\mathrm{km}$, $\sqrt{\mu/p} = 7.1395\,\mathrm{km/s}$,
$$
\mathbf{r}_{PQW} = (-2819.2,\; -7745.6,\; 0)\,\mathrm{km}, \qquad
\mathbf{v}_{PQW} = 7.1395\,(0.93970,\; -0.19212,\; 0) = (6.7090,\; -1.3716,\; 0)\,\mathrm{km/s},
$$
and after rotating by $\mathbf{Q}(200^\circ, 63.4^\circ, 300.004^\circ)$ the inertial state is $(7408.900,\; 3378.656,\; -1279.858)\,\mathrm{km}$ and $(-3.0312,\; 1.9918,\; -5.8080)\,\mathrm{km/s}$ – the input, to $10^{-12}\,\mathrm{km}$ in position and $10^{-15}\,\mathrm{km/s}$ in velocity in double precision. A round-trip test at this level, on a handful of orbits including the degenerate ones and a retrograde one, is the minimum acceptance test for the pair of routines.
:::

## The code

The general path, with two-argument arctangents throughout:

```python
import numpy as np

MU = 398600.4418  # km^3/s^2
K_HAT = np.array([0.0, 0.0, 1.0])

def rv2coe_general(r, v, mu=MU):
    rn, vn = np.linalg.norm(r), np.linalg.norm(v)
    h = np.cross(r, v)
    hn = np.linalg.norm(h)
    h_hat = h / hn
    n = np.cross(K_HAT, h)
    e_vec = ((vn**2 - mu / rn) * r - np.dot(r, v) * v) / mu
    e = np.linalg.norm(e_vec)
    a = 1.0 / (2.0 / rn - vn**2 / mu)
    i = np.arccos(np.clip(h[2] / hn, -1.0, 1.0))
    raan = np.arctan2(n[1], n[0]) % (2 * np.pi)
    argp = np.arctan2(np.dot(np.cross(n, e_vec), h_hat), np.dot(n, e_vec)) % (2 * np.pi)
    nu = np.arctan2(np.dot(np.cross(e_vec, r), h_hat), np.dot(e_vec, r)) % (2 * np.pi)
    return a, e, i, raan, argp, nu

def R1(t):
    c, s = np.cos(t), np.sin(t)
    return np.array([[1, 0, 0], [0, c, s], [0, -s, c]])

def R3(t):
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]])

def coe2rv(a, e, i, raan, argp, nu, mu=MU):
    p = a * (1 - e**2)
    r = p / (1 + e * np.cos(nu))
    r_pqw = np.array([r * np.cos(nu), r * np.sin(nu), 0.0])
    v_pqw = np.sqrt(mu / p) * np.array([-np.sin(nu), e + np.cos(nu), 0.0])
    Q = R3(-raan) @ R1(-i) @ R3(-argp)
    return Q @ r_pqw, Q @ v_pqw

r = np.array([7408.900, 3378.656, -1279.858])
v = np.array([-3.0312, 1.9918, -5.8080])
els = rv2coe_general(r, v)
print(els[0], els[1], np.degrees(els[2:]))  # 7999.93 0.15000 [63.400 200.000 300.004 249.996]
```

The degenerate branches of Step 7 go in front of the `argp` and `nu` lines, keyed on `e < tol` and `np.linalg.norm(n) < tol`; writing them is the exercise. The module's exercise also checks your implementation against a textbook state vector with a retrograde inclination near $153^\circ$, which exercises the sign of $h_z$ – if your inclination comes out near $27^\circ$ instead, you have lost a sign in the cross product or taken an absolute value you should not have.

::: warning NaN from a near-circular orbit
When $e \approx 0$ the argument of periapsis is computed from a vector whose direction is pure round-off, and the arccosine form divides by $e$: the result is `NaN` or garbage. The angular momentum is *not* the problem – it is largest, not smallest, for a circular orbit – and clamping the arccosine argument does not help, because the failure is in the geometry, not the round-off. The fix is to detect $e < \epsilon_{\text{tol}}$ and return the argument of latitude $u = \omega + \nu$, or to switch to equinoctial elements altogether.
:::

::: warning atan2 argument order
`atan2(y, x)` takes the sine-like quantity first and the cosine-like quantity second. $\Omega = \operatorname{atan2}(n_y, n_x)$, not the other way round; swapping them returns the complementary angle and passes every test on a $45^\circ$ orbit. Test with asymmetric numbers.
:::

::: warning Radians in, degrees out
Every trigonometric call works in radians. Convert to degrees only when printing, and never store elements in degrees and feed them back into `np.cos`. A mean motion in revolutions per day, an inclination in degrees and a mean anomaly in radians can all appear in one line of a two-line element set, which is why parsing those is its own lesson.
:::

## Check yourself

::: check
A state vector gives $\mathbf{n} = (-2000,\; 3464,\; 0)\,\mathrm{km^2/s}$ and $\mathbf{e} = (0.05,\; -0.03,\; -0.08)$. In which quadrant is $\Omega$, and is $\omega$ above or below $180^\circ$?
:::

::: answer
$\Omega = \operatorname{atan2}(3464, -2000)$: negative cosine, positive sine, so the second quadrant – numerically $120.0^\circ$. For $\omega$, $e_z = -0.08 < 0$ means periapsis lies south of the equator, so $\omega > 180^\circ$. Equivalently the arccosine of $\mathbf{n} \cdot \mathbf{e}/(ne)$ must be flipped to $2\pi$ minus itself.
:::

::: check
Your conversion returns $i = 27^\circ$ for an orbit that the tracking report says is retrograde at $153^\circ$. What went wrong?
:::

::: answer
$\cos 153^\circ = -\cos 27^\circ$: the sign of $h_z$ has been lost. Either the cross product was computed as $\mathbf{v} \times \mathbf{r}$ (which negates every component of $\mathbf{h}$, and would also corrupt $\Omega$), or $\lvert h_z \rvert$ was used, or the inclination was computed from $\arcsin$ of the in-plane part of $\mathbf{h}$, which cannot distinguish $i$ from $180^\circ - i$. Compute $i = \arccos(h_z/h)$ with the signed $h_z$.
:::

::: check
Why does the flip condition for $\nu$ use the sign of $\mathbf{r} \cdot \mathbf{v}$ rather than, say, the sign of $r_z$?
:::

::: answer
The true anomaly is measured from periapsis in the direction of motion. On the half-orbit from periapsis to apoapsis the radius is increasing, $\dot{r} > 0$, so $\mathbf{r} \cdot \mathbf{v} = r\dot{r} > 0$; on the return half it is decreasing. The sign of $\mathbf{r} \cdot \mathbf{v}$ therefore says which half of the orbit the spacecraft is on, which is exactly what the arccosine cannot tell you. The sign of $r_z$ says which hemisphere the spacecraft is in, which depends on $\omega$ and has nothing to do with $\nu$.
:::

::: check
An equatorial orbit has $\mathbf{e} = (0.3, -0.4, 0)$ and $h_z > 0$. What is its longitude of periapsis? What if $h_z < 0$?
:::

::: answer
$\varpi = \operatorname{atan2}(-0.4, 0.3) = -53.13^\circ \equiv 306.87^\circ$ for the prograde case: measured counter-clockwise from $\hat{\mathbf{I}}$, in the direction of motion. If $h_z < 0$ the motion is clockwise, angles in the direction of motion run the other way, and $\varpi = 360^\circ - 306.87^\circ = 53.13^\circ$. Same perigee direction in space; different number, because the convention follows the motion.
:::

::: check
Describe an acceptance test for a pair of conversion routines that would catch (a) a quadrant error, (b) a degenerate-case crash, and (c) an inconsistency between the two directions.
:::

::: answer
(a) Convert a state generated from elements with $\Omega$, $\omega$ and $\nu$ all above $180^\circ$ and check that each angle is recovered to $10^{-6}$ degrees, not its supplement or complement. (b) Convert exactly circular equatorial, circular inclined and elliptical equatorial states, both prograde and retrograde, and assert that every returned value is finite and that $a$ and $e$ are correct. (c) For each test orbit, run state → elements → state and assert the state is reproduced to near machine precision, and run elements → state → elements for the well-defined cases.
:::

## Summary

| Step | Formula |
| --- | --- |
| Vectors | $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, $\mathbf{n} = (-h_y, h_x, 0)$, $\mathbf{e} = [(v^2 - \mu/r)\mathbf{r} - (\mathbf{r}\cdot\mathbf{v})\mathbf{v}]/\mu$ |
| Size | $a = 1/(2/r - v^2/\mu)$; $p = h^2/\mu$ (use $p$ if $e \approx 1$) |
| Inclination | $i = \arccos(h_z/h)$, clamped; retrograde if $h_z < 0$ |
| Node | $\Omega = \operatorname{atan2}(n_y, n_x)$ |
| Periapsis | $\omega = \operatorname{atan2}((\mathbf{n}\times\mathbf{e})\cdot\hat{\mathbf{h}},\ \mathbf{n}\cdot\mathbf{e})$; arccos form flips if $e_z < 0$ |
| Anomaly | $\nu = \operatorname{atan2}((\mathbf{e}\times\mathbf{r})\cdot\hat{\mathbf{h}},\ \mathbf{e}\cdot\mathbf{r})$; arccos form flips if $\mathbf{r}\cdot\mathbf{v} < 0$ |
| $e \approx 0$ | Return $u = \operatorname{atan2}((\mathbf{n}\times\mathbf{r})\cdot\hat{\mathbf{h}},\ \mathbf{n}\cdot\mathbf{r})$ |
| $n \approx 0$ | Return $\varpi = \operatorname{atan2}(e_y, e_x)$, flipped if $h_z < 0$ |
| Both | Return $l = \operatorname{atan2}(r_y, r_x)$, flipped if $h_z < 0$ |
| Inverse | $\mathbf{r}_{PQW}, \mathbf{v}_{PQW}$ from $p, e, \nu$; rotate by $\mathbf{Q} = \mathbf{R}_3(-\Omega)\mathbf{R}_1(-i)\mathbf{R}_3(-\omega)$ |

With the geometry of an orbit fully in hand, the next lesson adds time: the eccentric and mean anomalies, and Kepler's equation that connects them to the true anomaly.
