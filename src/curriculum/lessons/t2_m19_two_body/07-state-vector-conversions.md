---
id: l07-state-vector-conversions
title: State vector to orbital elements and back
minutes: 21
covers:
  - state vector to orbital element conversion, both directions
---

There are two ways to describe where a spacecraft is and where it is going.

The first is a snapshot. At one instant, write down its position and its velocity – three numbers for where it is, three for how fast and which way it moves. That is the **[[state vector|state-vector]]**: six numbers, $\mathbf{r}$ and $\mathbf{v}$. It is what a GPS receiver or a navigation filter hands you.

The second is a description of the whole path. How big is the orbit, how stretched, how tilted, which way it points, and where on it the spacecraft sits right now. Those are the six **classical orbital elements** from the last lesson: $a$, $e$, $i$, $\Omega$, $\omega$ and $\nu$. They are what a human reads, and what an orbit designer writes down.

Think of a car on a highway. The snapshot says "at this mile marker, doing 100 km/h north". The description says "on Route 66, heading to Chicago, now at mile 212". Same car, same moment, two languages.

Every astrodynamics library has two small translators between these languages. One takes $\mathbf{r}$ and $\mathbf{v}$ and returns the elements. The other goes back. Each is about a dozen lines of code, and a startling share of orbit-software bugs lives in them. Angles land in the wrong quadrant. The arccosine misbehaves right at $\pm 1$. And three families of perfectly ordinary orbits make one or more angles undefined. A converter that returns `NaN` ("not a number", the computer's way of saying the math broke) for a near-circular orbit has failed on the most common orbit there is.

This lesson builds both translators step by step, from the definitions of the last lesson. The module's coding exercise asks you to write exactly these.

Throughout, $\mathbf{r}$ and $\mathbf{v}$ have inertial (ECI – Earth-centred inertial) components. $\hat{\mathbf{K}} = (0, 0, 1)$, read "K-hat", is the unit vector toward the North Pole, and $\hat{\mathbf{I}}$ points toward the vernal equinox. Angles are in radians inside the code and degrees when printed.

## The tool for angles: atan2

Before the steps, one tool, because almost every bug here is an angle bug.

Suppose you know a point's $x$ and $y$ and want its angle around a circle. The arccosine, $\arccos$, only ever returns angles between $0^\circ$ and $180^\circ$. It sees $x$ but not $y$. A point at $60^\circ$ and a point at $300^\circ$ have the same $x$, so the arccosine calls both $60^\circ$. It cannot [[tell above from below|atan2-quadrants]].

The **two-argument arctangent**, written $\operatorname{atan2}(y, x)$ and read "a-tan-two of y comma x", looks at both. It returns the full angle, anywhere around the circle, with the quadrant decided by the signs of $y$ and $x$. The sine-like quantity goes first and the cosine-like quantity second.

So the plan for every angle in this lesson is the same. Find a quantity proportional to the angle's cosine and one proportional to its sine, then hand both to $\operatorname{atan2}$. The older textbook recipe uses $\arccos$ and then a separate "flip" test to fix the quadrant. We will show both, because you will meet both in other people's code.

## From state vector to elements

### Step 1 – the three vectors

Compute the lengths $r = \lVert \mathbf{r} \rVert$ and $v = \lVert \mathbf{v} \rVert$. Then build three vectors:

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v}, \qquad
\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h} = (-h_y,\; h_x,\; 0), \qquad
\mathbf{e} = \frac{\left(v^2 - \mu/r\right)\mathbf{r} - (\mathbf{r} \cdot \mathbf{v})\,\mathbf{v}}{\mu}.
$$

- $\mathbf{h}$ is the specific angular momentum. It sticks straight out of the orbit plane, following the [[right-hand rule|right-hand-rule]].
- $\mathbf{n}$ is the **node vector**. It lies along the line where the orbit plane cuts the equator, pointing at the ascending node – where the spacecraft crosses the equator heading north.
- $\mathbf{e}$ is the eccentricity vector. It points from Earth's centre toward periapsis, and its length is the eccentricity.

Their lengths are $h$, $n$ and $e$. Keep the dot product $\mathbf{r} \cdot \mathbf{v}$ – its sign is needed later. Also form the unit normal $\hat{\mathbf{h}} = \mathbf{h}/h$, which will give the in-plane angles their sign.

### Step 2 – size and shape

The energy gives the semi-major axis:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad a = -\frac{\mu}{2\varepsilon} = \frac{1}{2/r - v^2/\mu}.
$$

The second form skips computing $\varepsilon$ and dividing by it. Both fail for a parabola, where $\varepsilon = 0$ and $a$ is infinite. So test whether $\lvert 1 - e \rvert$ is below a tolerance, and in that case report the semi-latus rectum $p = h^2/\mu$ instead. $p$ is finite for every conic, so it is worth returning alongside $a$ every time.

### Step 3 – inclination

$$
i = \arccos\!\left(\frac{h_z}{h}\right).
$$

Here the arccosine is exactly right. Inclination lives between $0$ and $\pi$ ($0^\circ$ to $180^\circ$), which is the arccosine's own range, so there is no quadrant to decide.

**[[Retrograde|retrograde]]** orbits – ones that go around the "wrong" way, against Earth's spin – have $h_z < 0$. They come out with $i > 90^\circ$ automatically, as long as you never take the absolute value of $h_z$ somewhere along the way.

One trap: clamp the argument to $[-1, 1]$ before calling $\arccos$. For an equatorial orbit, [[round-off|round-off]] in the cross product can push $h_z/h$ to $1.0000000000000002$, and the arccosine of that is `NaN`.

### Step 4 – right ascension of the ascending node

$\Omega$ (capital omega) is the angle from $\hat{\mathbf{I}}$ to $\mathbf{n}$ in the equatorial plane, measured counter-clockwise seen from above the North Pole. The components of $\mathbf{n}$ *are* its cosine and sine, each times $n$. So:

$$
\Omega = \operatorname{atan2}(n_y,\; n_x) = \operatorname{atan2}(h_x,\; -h_y), \qquad \text{wrapped to } [0, 2\pi).
$$

The older recipe is $\Omega = \arccos(n_x/n)$, then replace $\Omega$ by $2\pi - \Omega$ if $n_y < 0$. It gives the same answer. A node vector with a negative $y$-component lies in the lower half of the equatorial plane, where the angle from $\hat{\mathbf{I}}$ is more than $180^\circ$. The $\operatorname{atan2}$ version makes that decision without the branch and without the clamping problem.

### Step 5 – argument of periapsis

$\omega$ (little omega) is the angle from $\mathbf{n}$ to $\mathbf{e}$, inside the orbit plane, counted positive in the direction the spacecraft moves.

"The direction it moves" is the way a rotation about $+\hat{\mathbf{h}}$ carries $\mathbf{n}$ around. So the cosine-like quantity is $\mathbf{n} \cdot \mathbf{e}$, and the signed sine-like quantity is $(\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}}$:

$$
\omega = \operatorname{atan2}\!\big((\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}},\; \mathbf{n} \cdot \mathbf{e}\big).
$$

The arccosine recipe is $\omega = \arccos\!\big(\mathbf{n} \cdot \mathbf{e}/(n e)\big)$, flipped to $2\pi - \omega$ when $e_z < 0$.

Here is why the flip works. Leaving the ascending node, the spacecraft heads into the northern hemisphere and stays there for half an orbit. So a periapsis north of the equator ($e_z > 0$) is less than half an orbit past the node. A periapsis south of the equator ($e_z < 0$) is more than half an orbit past it. The quantity $(\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}}$ always has the same sign as $e_z$ – the two tests say the same thing.

### Step 6 – true anomaly

$\nu$ (nu) is the angle from $\mathbf{e}$ to $\mathbf{r}$, in the orbit plane, in the direction of motion:

$$
\nu = \operatorname{atan2}\!\big((\mathbf{e} \times \mathbf{r}) \cdot \hat{\mathbf{h}},\; \mathbf{e} \cdot \mathbf{r}\big).
$$

The arccosine recipe flips when $\mathbf{r} \cdot \mathbf{v} < 0$. Picture it: a spacecraft moving *toward* Earth is on the [[inbound half|inbound-outbound]] of its orbit, coming back from apoapsis to periapsis. On that half the true anomaly is more than $180^\circ$.

::: note Why the two sign tests agree
The dot product $\mathbf{r} \cdot \mathbf{v}$ equals $r\dot{r}$, where $\dot{r}$ (read "r-dot") is how fast the distance is changing. From the orbit equation, $\dot{r} = (\mu/h)\,e\sin\nu$. So $\mathbf{r} \cdot \mathbf{v}$ has the sign of $\sin\nu$ – positive from $0^\circ$ to $180^\circ$, negative from $180^\circ$ to $360^\circ$. And $(\mathbf{e} \times \mathbf{r}) \cdot \hat{\mathbf{h}} = e\,r\sin\nu$, which has the same sign. The same argument with $\mathbf{n}$ in place of $\mathbf{e}$ gives $(\mathbf{n} \times \mathbf{e}) \cdot \hat{\mathbf{h}} = n\,e\sin\omega$, and $e_z = e\sin\omega\sin i$ with $\sin i > 0$, so it has the sign of $e_z$.
:::

### Step 7 – the degenerate cases

Some orbits make an angle meaningless, the way "which way is the front of a ball?" has no answer. Decide with a tolerance $\epsilon_{\text{tol}}$ (around $10^{-8}$ for double precision and kilometre units – smaller and round-off triggers false alarms, larger and you throw away real information):

- **Circular inclined** ($e < \epsilon_{\text{tol}}$, orbit tilted): $\mathbf{e}$ has no direction, so $\omega$ and $\nu$ are meaningless. Set $\omega = 0$ and return the **argument of latitude** – the angle from the node to the spacecraft – in the slot for $\nu$:
$$
u = \operatorname{atan2}\!\big((\mathbf{n} \times \mathbf{r}) \cdot \hat{\mathbf{h}},\; \mathbf{n} \cdot \mathbf{r}\big).
$$
- **Elliptical equatorial** (orbit flat in the equator, $e \ge \epsilon_{\text{tol}}$): $\mathbf{n}$ has no direction, so $\Omega$ and $\omega$ are meaningless. Set $\Omega = 0$ and return the **longitude of periapsis** $\varpi$ (read "var-pi"), measured from $\hat{\mathbf{I}}$ directly, in the slot for $\omega$:
$$
\varpi = \operatorname{atan2}(e_y,\; e_x), \qquad \varpi \to 2\pi - \varpi \ \text{ if } h_z < 0.
$$
The flip for retrograde equatorial orbits is needed because the angle must be measured in the direction of motion. For $h_z < 0$ that is clockwise, seen from the north.
- **Circular equatorial** (both): return the **true longitude**, from $\hat{\mathbf{I}}$ to $\mathbf{r}$, in the slot for $\nu$, with the same retrograde flip:
$$
l = \operatorname{atan2}(r_y,\; r_x), \qquad l \to 2\pi - l \ \text{ if } h_z < 0.
$$

Write down which angle you returned. A function that silently puts $u$ where the caller expects $\nu$ is as dangerous as one that returns `NaN`.

Now the tolerance itself. **Test quantities with no units.** The eccentricity already has none. But $n = \lVert \mathbf{n} \rVert$ is in $\mathrm{km^2/s}$, and its size depends on the orbit and on the units you chose. Since $\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h}$ has length $h\sin i$, the natural test is

$$
\frac{n}{h} = \sin i < \epsilon_{\text{tol}},
$$

which asks "is the inclination below about $\epsilon_{\text{tol}}$ radians?" – the same question for LEO or GEO, in [[metres or kilometres|units-in-tolerance]]. With $\epsilon_{\text{tol}} = 10^{-8}$ an orbit counts as equatorial only below about $6 \times 10^{-7}$ degrees of inclination. That is tighter than any real orbit determination can resolve, so in practice the branch fires for the synthetic test cases it was written for. Some libraries deliberately use a looser threshold such as $10^{-6}$, so that near-degenerate orbits from noisy data get the stable replacement angles. Either is defensible, as long as it is written down.

::: key The conversion in one breath
From $\mathbf{r}, \mathbf{v}$: form $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, $\mathbf{n} = \hat{\mathbf{K}} \times \mathbf{h}$ and $\mathbf{e}$; then $a = 1/(2/r - v^2/\mu)$, $i = \arccos(h_z/h)$, $\Omega = \operatorname{atan2}(n_y, n_x)$, $\omega$ from $\mathbf{n}$ to $\mathbf{e}$ (flip if $e_z < 0$), $\nu$ from $\mathbf{e}$ to $\mathbf{r}$ (flip if $\mathbf{r} \cdot \mathbf{v} < 0$). If $e \approx 0$ return $u = \omega + \nu$; if $\sin i \approx 0$ return $\varpi = \Omega + \omega$; if both, return $l = \Omega + \omega + \nu$. Back: build $\mathbf{r}_{PQW}, \mathbf{v}_{PQW}$ and rotate by $\mathbf{R}_3(-\Omega)\mathbf{R}_1(-i)\mathbf{R}_3(-\omega)$.
:::

::: example A general orbit, with both quadrant flips firing
Given, in ECI, $\mathbf{r} = (7408.900,\; 3378.656,\; -1279.858)\,\mathrm{km}$ and $\mathbf{v} = (-3.0312,\; 1.9918,\; -5.8080)\,\mathrm{km/s}$, with $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$.

**Step 1.** The lengths are $r = 8242.885\,\mathrm{km}$ and $v = 6.84750\,\mathrm{km/s}$. The dot product is $\mathbf{r} \cdot \mathbf{v} = -8294.84\,\mathrm{km^2/s}$ – negative, so the spacecraft is moving inward. The cross product gives $\mathbf{h} = (-17\,074.01,\; 46\,910.40,\; 24\,998.43)\,\mathrm{km^2/s}$, with $h = 55\,830.36$. The node vector is $\mathbf{n} = (-h_y, h_x, 0) = (-46\,910.40,\; -17\,074.01,\; 0)$, with $n = 49\,921.01$.

For $\mathbf{e}$, first the bracket: $v^2 - \mu/r = 46.8883 - 48.3569 = -1.4686$. Then

$$
\mathbf{e} = \frac{-1.4686\,\mathbf{r} + 8294.84\,\mathbf{v}}{398\,600.4418} = (-0.090376,\; 0.029001,\; -0.116148), \qquad e = 0.15000 .
$$

**Step 2.** $\varepsilon = 23.4442 - 48.3569 = -24.9128\,\mathrm{km^2/s^2}$. Negative, so it is an ellipse. Then $a = 398\,600.4418/49.8255 = 7999.93\,\mathrm{km}$, and $p = h^2/\mu = 7819.93\,\mathrm{km}$.

**Step 3.** $h_z/h = 24\,998.43/55\,830.36 = 0.44775$, so $i = \arccos(0.44775) = 63.400^\circ$. Below $90^\circ$: prograde.

**Step 4.** $\Omega = \operatorname{atan2}(-17\,074.01,\; -46\,910.40)$. Both arguments are negative, so the angle is in the third quadrant: $200.000^\circ$. The arccosine route gives $\arccos(-46\,910.40/49\,921.01) = 160.000^\circ$, and since $n_y < 0$ it flips to $360^\circ - 160^\circ = 200.000^\circ$. Same answer.

**Step 5.** $\mathbf{n} \cdot \mathbf{e} = 4239.6 - 495.2 + 0 = 3744.4$ and $n e = 7488.0$. The cosine is $3744.4/7488.0 = 0.50005$, whose arccosine is $59.996^\circ$. But $e_z = -0.116 < 0$: periapsis is south of the equator. So $\omega = 360^\circ - 59.996^\circ = 300.004^\circ$. The $\operatorname{atan2}$ form gives $300.004^\circ$ directly.

**Step 6.** $\mathbf{e} \cdot \mathbf{r} = -669.59 + 97.98 + 148.66 = -422.95$ and $e r = 1236.4$. The cosine is $-0.34208$, whose arccosine is $110.004^\circ$. But $\mathbf{r} \cdot \mathbf{v} < 0$: inbound. So $\nu = 360^\circ - 110.004^\circ = 249.996^\circ$.

**Result:** $a = 7999.93\,\mathrm{km}$, $e = 0.1500$, $i = 63.400^\circ$, $\Omega = 200.000^\circ$, $\omega = 300.004^\circ$, $\nu = 249.996^\circ$.

Does it make sense? The state was generated from $(8000\,\mathrm{km}, 0.15, 63.4^\circ, 200^\circ, 300^\circ, 250^\circ)$ and then rounded to the digits shown, which explains the last-place differences. Without the two flips you would have reported $\omega = 60^\circ$ and $\nu = 110^\circ$ – a periapsis in the wrong hemisphere and a spacecraft on the wrong half of its orbit.
:::

::: example A circular, equatorial, retrograde orbit
Take $\mathbf{r} = (7000,\; 0,\; 0)\,\mathrm{km}$ and $\mathbf{v} = (0,\; -7.5461,\; 0)\,\mathrm{km/s}$, where $7.5461 = \sqrt{\mu/7000}$ is the circular speed. The velocity points in $-y$, so the spacecraft goes clockwise seen from the north.

**The vectors.** $\mathbf{h} = (0,\; 0,\; -52\,822.4)$. Since $h_z < 0$, $i = \arccos(-1) = 180^\circ$: retrograde, as expected. The node vector is $\mathbf{n} = (-h_y, h_x, 0) = (0, 0, 0)$: equatorial, so $\Omega$ is undefined.

**The eccentricity.** $v^2 - \mu/r = 56.943 - 56.943 = 0$ and $\mathbf{r} \cdot \mathbf{v} = 0$, so $\mathbf{e} = \mathbf{0}$ to round-off (about $10^{-16}$): circular, so $\omega$ and $\nu$ are undefined too.

**The size.** $a = 1/(2/7000 - 56.943/398\,600.4418) = 7000.0\,\mathrm{km}$ – perfectly well defined.

Both tests fire, so return the true longitude: $l = \operatorname{atan2}(0, 7000) = 0$, and the retrograde flip $2\pi - 0$ wraps back to $0$. The function returns $(7000.0,\; 0,\; 180^\circ,\; 0,\; 0,\; l = 0)$ with no `NaN` anywhere – which is what the exercise's test demands. A naive version would have divided by $n = 0$ and by $e = 0$.
:::

## From elements to state vector

The reverse direction has no quadrant problems. It builds vectors *from* angles, and sine and cosine never have to guess a quadrant.

First, build the state in the **perifocal frame** (PQW) from the last lesson: $\hat{\mathbf{P}}$ toward periapsis, $\hat{\mathbf{Q}}$ a quarter-turn ahead in the orbit plane, $\hat{\mathbf{W}}$ along $\mathbf{h}$.

$$
r = \frac{p}{1 + e\cos\nu}, \qquad
\mathbf{r}_{PQW} = \begin{pmatrix} r\cos\nu \\ r\sin\nu \\ 0 \end{pmatrix}, \qquad
\mathbf{v}_{PQW} = \sqrt{\frac{\mu}{p}}\begin{pmatrix} -\sin\nu \\ e + \cos\nu \\ 0 \end{pmatrix},
$$

with $p = a(1 - e^2)$ for any non-parabolic orbit. (Accept $p$ directly if you want to support the parabola.)

Then turn the orbit into place with three rotations, $\mathbf{Q} = \mathbf{R}_3(-\Omega)\,\mathbf{R}_1(-i)\,\mathbf{R}_3(-\omega)$:

$$
\mathbf{r}_{IJK} = \mathbf{Q}\,\mathbf{r}_{PQW}, \qquad \mathbf{v}_{IJK} = \mathbf{Q}\,\mathbf{v}_{PQW}.
$$

Read the product right to left: spin the ellipse by $\omega$ within its plane, tilt the plane by $i$, then swing the whole thing around the pole by $\Omega$.

The degenerate cases need no special code here, if the inputs are consistent. For a circular orbit set $\omega = 0$ and put $u$ in place of $\nu$. For an equatorial orbit set $\Omega = 0$ and put $\varpi$ in place of $\omega$. For circular equatorial set both to zero and put $l$ in place of $\nu$. This is *why* the forward conversion returns the replacement angle in the slot of the undefined one: the pair of functions then round-trips with no special cases in the inverse.

::: example The round trip
Feed the elements from the first example back in.

**The size.** $p = 7999.93\,(1 - 0.15^2) = 7999.93 \times 0.9775 = 7819.93\,\mathrm{km}$.

**The radius.** $1 + 0.15\cos 249.996^\circ = 1 - 0.051312 = 0.948688$, so $r = 7819.93/0.948688 = 8242.89\,\mathrm{km}$ – matching the $8242.885\,\mathrm{km}$ we started from.

**The speed factor.** $\sqrt{\mu/p} = \sqrt{398\,600.4418/7819.93} = 7.1395\,\mathrm{km/s}$.

**Perifocal state.** With $\cos\nu = -0.34208$ and $\sin\nu = -0.93967$:

$$
\mathbf{r}_{PQW} = (-2819.7,\; -7745.6,\; 0)\,\mathrm{km}, \qquad
\mathbf{v}_{PQW} = 7.1395\,(0.93967,\; -0.19208,\; 0) = (6.7088,\; -1.3714,\; 0)\,\mathrm{km/s}.
$$

**Rotate.** After multiplying by $\mathbf{Q}(200^\circ, 63.4^\circ, 300.004^\circ)$ the inertial state is $(7408.900,\; 3378.656,\; -1279.858)\,\mathrm{km}$ and $(-3.0312,\; 1.9918,\; -5.8080)\,\mathrm{km/s}$ – the input. With the elements kept at full double precision the match is about $10^{-12}\,\mathrm{km}$ in position and $10^{-15}\,\mathrm{km/s}$ in velocity.

A [[round-trip test|round-trip-test]] at this level, on a handful of orbits including the degenerate ones and a retrograde one, is the minimum acceptance test for the pair.
:::

## The code

Here is the general path, with two-argument arctangents throughout, and the inverse.

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
print(els[0], els[1], np.degrees(els[2:]))
# about 7999.93 0.15000 [63.400 200.000 300.004 249.996]
r2, v2 = coe2rv(*els)
print(np.abs(r2 - r).max(), np.abs(v2 - v).max())  # about 1e-12 and 1e-16
```

The degenerate branches of Step 7 go in front of the `argp` and `nu` lines, keyed on `e < tol` and on the unit-free test `np.linalg.norm(n) / hn < tol`. Writing them is the exercise.

The exercise also checks your code against a textbook state vector with a retrograde inclination near $153^\circ$, which tests the sign of $h_z$. If your inclination comes out near $27^\circ$ instead, you have lost a sign in the cross product or taken an absolute value you should not have.

::: warning NaN from a near-circular orbit
When $e \approx 0$, the argument of periapsis is computed from a vector whose direction is pure round-off, and the arccosine form divides by $e$. The result is `NaN` or garbage. This is a failure of geometry, not of arithmetic – there is no periapsis for $\omega$ to point at – so extra precision cannot cure it. Detect $e < \epsilon_{\text{tol}}$ and return the argument of latitude $u = \omega + \nu$, or switch to equinoctial elements altogether.
:::

::: warning atan2 argument order
`atan2(y, x)` takes the sine-like quantity first and the cosine-like quantity second. $\Omega = \operatorname{atan2}(n_y, n_x)$, not the other way round. Swapping them returns the complementary angle ($90^\circ$ minus the right one) – and passes every test on a $45^\circ$ orbit, where the two agree. Test with lopsided numbers.
:::

::: warning Radians in, degrees out
Every trigonometric call works in radians. Convert to degrees only when printing, and never store elements in degrees and then feed them back into `np.cos`. A mean motion in revolutions per day, an inclination in degrees and a mean anomaly in radians can all turn up around one two-line element set, which is why parsing those gets its own lesson.
:::

## Check yourself

::: check
A state vector gives $\mathbf{n} = (-2000,\; 3464,\; 0)\,\mathrm{km^2/s}$ and $\mathbf{e} = (0.05,\; -0.03,\; -0.08)$. In which quadrant is $\Omega$, and is $\omega$ above or below $180^\circ$?
:::

::: answer
$\Omega = \operatorname{atan2}(3464, -2000)$. The cosine-like part is negative and the sine-like part positive, so $\Omega$ is in the second quadrant – numerically $120.0^\circ$.

For $\omega$: $e_z = -0.08 < 0$ means periapsis is south of the equator, so $\omega > 180^\circ$. Said the other way, the arccosine of $\mathbf{n} \cdot \mathbf{e}/(ne)$ must be flipped to $360^\circ$ minus itself.
:::

::: check
Your conversion returns $i = 27^\circ$ for an orbit that the tracking report says is retrograde at $153^\circ$. What went wrong?
:::

::: answer
$\cos 153^\circ = -\cos 27^\circ$, so the sign of $h_z$ has been lost. Three likely culprits:

- the cross product was computed as $\mathbf{v} \times \mathbf{r}$, which flips every component of $\mathbf{h}$ (and would also corrupt $\Omega$);
- $\lvert h_z \rvert$ was used somewhere;
- the inclination came from the $\arcsin$ of the in-plane part of $\mathbf{h}$, which cannot tell $i$ from $180^\circ - i$.

The fix: $i = \arccos(h_z/h)$ with the signed $h_z$.
:::

::: check
Why does the flip for $\nu$ use the sign of $\mathbf{r} \cdot \mathbf{v}$ rather than, say, the sign of $r_z$?
:::

::: answer
The true anomaly is measured from periapsis in the direction of motion. On the half-orbit from periapsis to apoapsis the distance is growing, $\dot{r} > 0$, so $\mathbf{r} \cdot \mathbf{v} = r\dot{r} > 0$. On the return half it is shrinking and $\mathbf{r} \cdot \mathbf{v} < 0$. So the sign says which *half of the orbit* the spacecraft is on – exactly what the arccosine cannot tell.

The sign of $r_z$ says which *hemisphere* the spacecraft is in. That depends on $\omega$ and has nothing to do with $\nu$.
:::

::: check
An equatorial orbit has $\mathbf{e} = (0.3, -0.4, 0)$ and $h_z > 0$. What is its longitude of periapsis? What if $h_z < 0$?
:::

::: answer
Prograde: $\varpi = \operatorname{atan2}(-0.4, 0.3) = -53.13^\circ$, which wraps to $306.87^\circ$, measured counter-clockwise from $\hat{\mathbf{I}}$ – the direction of motion.

Retrograde ($h_z < 0$): the motion is clockwise, so angles "in the direction of motion" run the other way, and $\varpi = 360^\circ - 306.87^\circ = 53.13^\circ$. Same periapsis direction in space, different number, because the convention follows the motion.
:::

::: check
Describe an acceptance test for a pair of conversion routines that would catch (a) a quadrant error, (b) a degenerate-case crash, and (c) an inconsistency between the two directions.
:::

::: answer
(a) Convert a state built from elements with $\Omega$, $\omega$ and $\nu$ all above $180^\circ$, and check that each angle comes back to within $10^{-6}$ degrees – not its supplement or complement.

(b) Convert exactly circular equatorial, circular inclined and elliptical equatorial states, both prograde and retrograde. Assert that every returned value is finite and that $a$ and $e$ are right.

(c) For each test orbit, run state → elements → state and assert the state comes back to near machine precision. Also run elements → state → elements for the well-defined cases.
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
| $n/h \approx 0$ | Return $\varpi = \operatorname{atan2}(e_y, e_x)$, flipped if $h_z < 0$ |
| Both | Return $l = \operatorname{atan2}(r_y, r_x)$, flipped if $h_z < 0$ |
| Inverse | $\mathbf{r}_{PQW}, \mathbf{v}_{PQW}$ from $p, e, \nu$; rotate by $\mathbf{Q} = \mathbf{R}_3(-\Omega)\mathbf{R}_1(-i)\mathbf{R}_3(-\omega)$ |

With the geometry of an orbit fully in hand, the next lesson adds time: the eccentric and mean anomalies, and Kepler's equation, which ties them to the true anomaly and to the clock.

::: context state-vector Six numbers, one instant
A **vector** is a quantity with a size and a direction, written as a list of components. Position needs three ($x$, $y$, $z$), and so does velocity. Stack them and you have six numbers that pin down a spacecraft's motion completely – under gravity alone, those six numbers at one instant determine its entire future.

That is why "state" is the word: it is everything you need to know about the present to predict the rest. A navigation filter on a real vehicle carries exactly this vector (often plus a few extra entries such as clock error), updating it every time a GPS fix or star-tracker measurement arrives.
:::

::: context atan2-quadrants Why arccos cannot see the quadrant
Two points on a circle, one at $60^\circ$ and one at $300^\circ$, sit directly above each other. They share the same $x$, so they share the same cosine, $0.5$. The arccosine sees only that $0.5$ and answers $60^\circ$ for both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="200" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="20" x2="110" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="110" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="100" x2="145" y2="39.38" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="110" y1="100" x2="145" y2="160.62" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="145" y1="39.38" x2="145" y2="160.62" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="145" cy="39.38" r="5" fill="#1d6fd1"/>
  <circle cx="145" cy="160.62" r="5" fill="#b4232c"/>
  <text x="152" y="34" font-size="12" fill="#1d6fd1">60°</text>
  <text x="152" y="176" font-size="12" fill="#b4232c">300°</text>
  <text x="150" y="114" font-size="11" fill="#1f2a44">same x</text>
  <text x="215" y="70" font-size="12" fill="#1f2a44">arccos(0.5) = 60°</text>
  <text x="215" y="86" font-size="12" fill="#1f2a44">for both points</text>
  <text x="215" y="120" font-size="12" fill="#1f2a44">atan2 also sees y,</text>
  <text x="215" y="136" font-size="12" fill="#1f2a44">so it tells them apart</text>
</svg>
```

Knowing $y$ as well – positive for the blue point, negative for the red one – settles it. That is all $\operatorname{atan2}$ does.
:::

::: context right-hand-rule Which way the cross product points
Curl the fingers of your right hand from the first vector toward the second; your thumb points along the cross product. For $\mathbf{r} \times \mathbf{v}$, curl from position toward velocity – the way the spacecraft is turning – and the thumb gives $\mathbf{h}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="140" y2="130" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="148,130 136,124 136,136" fill="#1d6fd1"/>
  <line x1="30" y1="130" x2="80" y2="55" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="84.4,48.3 72.7,55.0 82.7,61.6" fill="#b4232c"/>
  <text x="120" y="150" font-size="12" fill="#1d6fd1">r</text>
  <text x="58" y="52" font-size="12" fill="#b4232c">v</text>
  <circle cx="30" cy="130" r="9" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="130" r="2.5" fill="#1f2a44"/>
  <text x="20" y="22" font-size="12" fill="#1f2a44">r × v: out of the page</text>
  <line x1="210" y1="130" x2="320" y2="130" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="328,130 316,124 316,136" fill="#1d6fd1"/>
  <line x1="210" y1="130" x2="260" y2="55" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="264.4,48.3 252.7,55.0 262.7,61.6" fill="#b4232c"/>
  <text x="300" y="150" font-size="12" fill="#1d6fd1">r</text>
  <text x="238" y="52" font-size="12" fill="#b4232c">v</text>
  <circle cx="210" cy="130" r="9" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="204" y1="124" x2="216" y2="136" stroke="#1f2a44" stroke-width="2"/>
  <line x1="216" y1="124" x2="204" y2="136" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="22" font-size="12" fill="#1f2a44">v × r: into the page</text>
</svg>
```

Swap the order and the thumb flips. That single swap turns a $27^\circ$ orbit into a $153^\circ$ one.
:::

::: context retrograde Orbits that go the wrong way
Nearly every rocket launches eastward, because Earth's spin gives it a free push of up to about $465\,\mathrm{m/s}$ at the equator. Those orbits are **prograde**, $i < 90^\circ$.

Some missions pay to go the other way. Sun-synchronous Earth-observation satellites fly at about $97^\circ$ to $98^\circ$, slightly retrograde, because that tilt makes Earth's bulge turn the orbit plane once a year, in step with the Sun. Nature has retrograde orbits too: Neptune's big moon Triton circles its planet backwards.
:::

::: context round-off Why 1 can come out as 1.0000000000000002
Computers store numbers with about 16 significant digits. The gap between $1$ and the next number the computer can store is about $2.2 \times 10^{-16}$. So after a cross product, a square root and a division, $h_z/h$ for a perfectly equatorial orbit can land one step above $1$ – and $\arccos$ of anything above $1$ has no real answer. Clamping with `np.clip(x, -1.0, 1.0)` costs nothing and removes the trap.
:::

::: context inbound-outbound The two halves of an orbit
On the upper half of this ellipse the spacecraft is climbing away from Earth; on the lower half it is falling back. The sign of $\mathbf{r} \cdot \mathbf{v}$ says which half you are on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <path d="M250,115 A100,70 0 0,0 50,115" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M50,115 A100,70 0 0,0 250,115" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="140,45 152,39 152,51" fill="#1d6fd1"/>
  <polygon points="160,185 148,179 148,191" fill="#b4232c"/>
  <circle cx="221.4" cy="115" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="206" y="138" font-size="11" fill="#1f2a44">Earth</text>
  <circle cx="250" cy="115" r="3" fill="#1f2a44"/>
  <circle cx="50" cy="115" r="3" fill="#1f2a44"/>
  <text x="258" y="112" font-size="11" fill="#1f2a44">periapsis</text>
  <text x="258" y="126" font-size="11" fill="#1f2a44">ν = 0°</text>
  <text x="44" y="100" font-size="11" fill="#1f2a44" text-anchor="end">apoapsis</text>
  <text x="44" y="114" font-size="11" fill="#1f2a44" text-anchor="end">ν = 180°</text>
  <text x="150" y="20" font-size="12" fill="#1d6fd1" text-anchor="middle">outbound: r · v &gt; 0, ν from 0° to 180°</text>
  <text x="150" y="210" font-size="12" fill="#b4232c" text-anchor="middle">inbound: r · v &lt; 0, ν from 180° to 360°</text>
</svg>
```

The arccosine only ever answers between $0^\circ$ and $180^\circ$, so on the red half its answer must be flipped to $360^\circ$ minus itself.
:::

::: context units-in-tolerance Why a tolerance needs no units
The first example has $n = 49\,921\,\mathrm{km^2/s}$. Redo it in metres and the same orbit has $n \approx 5 \times 10^{10}\,\mathrm{m^2/s}$ – a million times bigger, because $\mathrm{km^2}$ to $\mathrm{m^2}$ is a factor of $10^6$. A test like "$n < 10^{-8}$" would therefore mean something different depending on the units somebody picked. Dividing by $h$, which carries the same units, cancels them and leaves $\sin i$ – a pure number that means the same thing everywhere.
:::

::: context round-trip-test Round trips catch what single tests miss
A round-trip test runs data through a conversion and its inverse and checks you get back what you started with. Its power is that you do not need to know the right answer in advance – only that the two routines must agree. Real flight-software teams run such tests over thousands of random orbits, deliberately including the awkward ones (circular, equatorial, retrograde, nearly parabolic), because a bug in one direction almost never has a matching bug in the other.
:::
