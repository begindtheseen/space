---
id: l12-lagrange-coefficients
title: The Lagrange f and g coefficients
minutes: 15
covers:
  - Lagrange f and g coefficients
---

A two-body orbit lies in a fixed plane, and the initial position and velocity vectors span that plane. It follows that the position at any later time is a linear combination of $\mathbf{r}_0$ and $\mathbf{v}_0$, and so is the velocity. The four scalar coefficients of those combinations – Lagrange's $f$, $g$, $\dot{f}$, $\dot{g}$ – are functions of the elapsed time (or of the change in true anomaly, or of the universal anomaly) and of nothing else, and they turn propagation into a single matrix multiplication. No orbital elements, no rotation matrices, no quadrant checks.

The coefficients are the working core of several algorithms you will meet: the universal-variable propagator of the module's exercise, the Lambert solvers of the targeting module, Gibbs and Herrick–Gibbs orbit determination from position fixes, and the two-body state transition matrix that a navigation filter linearises about. Wherever you see a state at one time expressed in terms of a state at another, the $f$ and $g$ functions are inside.

This lesson derives the coefficients twice – as functions of the true-anomaly change $\Delta\nu$ and as functions of the universal anomaly $\chi$ – proves the identity that binds the four together, and applies them to the GTO and the ISS-like state, closing the loop with the analytic and numerical propagations of earlier lessons.

## Why a linear combination works

Angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ is constant, so $\mathbf{r}(t)$ and $\mathbf{v}(t)$ remain perpendicular to $\mathbf{h}$ for all time. The initial vectors $\mathbf{r}_0$ and $\mathbf{v}_0$ are two non-parallel vectors in that same plane (non-parallel because $\mathbf{h} \neq \mathbf{0}$), so they form a basis for it. Therefore there exist scalars $f, g, \dot{f}, \dot{g}$ – functions of time – such that

$$
\mathbf{r}(t) = f\,\mathbf{r}_0 + g\,\mathbf{v}_0, \qquad \mathbf{v}(t) = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 .
$$

The dots are honest time derivatives: differentiating the first equation, with $\mathbf{r}_0$ and $\mathbf{v}_0$ constant, gives the second. At $t = t_0$, $f = 1$, $g = 0$, $\dot{f} = 0$, $\dot{g} = 1$. The units follow from the equations: $f$ and $\dot{g}$ are dimensionless, $g$ has units of time, $\dot{f}$ of inverse time.

### The identity fġ − ḟg = 1

Take the cross product of the two expansions:

$$
\mathbf{h} = \mathbf{r} \times \mathbf{v} = (f\mathbf{r}_0 + g\mathbf{v}_0) \times (\dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0) = f\dot{g}\,(\mathbf{r}_0 \times \mathbf{v}_0) + g\dot{f}\,(\mathbf{v}_0 \times \mathbf{r}_0) = (f\dot{g} - \dot{f}g)\,\mathbf{h}_0 .
$$

Since $\mathbf{h} = \mathbf{h}_0$,

$$
f\dot{g} - \dot{f}g = 1
$$

for all time. This is conservation of angular momentum in the language of the coefficients, and it means only three of the four are independent: given $f$, $g$ and $\dot{g}$, the fourth is $\dot{f} = (f\dot{g} - 1)/g$. It is also the first thing to check in any implementation.

::: key The Lagrange coefficients
$$
\mathbf{r}(t) = f\,\mathbf{r}_0 + g\,\mathbf{v}_0, \qquad \mathbf{v}(t) = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 ,
$$
the new state as a linear combination of the old position and velocity, valid because the motion stays in the plane they span. They satisfy $f\dot{g} - \dot{f}g = 1$.
:::

## Coefficients in terms of the true-anomaly change

Work in the perifocal frame, with $\mathbf{r}_0$ at true anomaly $\nu_0$ and $\mathbf{r}$ at $\nu = \nu_0 + \Delta\nu$. From the elements lesson,

$$
\mathbf{r}_0 = r_0\,(\cos\nu_0,\ \sin\nu_0), \quad
\mathbf{v}_0 = \frac{\mu}{h}\,(-\sin\nu_0,\ e + \cos\nu_0), \quad
\mathbf{r} = r\,(\cos\nu,\ \sin\nu).
$$

Write $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ in components:

$$
r\cos\nu = f\,r_0\cos\nu_0 - g\,\frac{\mu}{h}\sin\nu_0, \qquad
r\sin\nu = f\,r_0\sin\nu_0 + g\,\frac{\mu}{h}\,(e + \cos\nu_0).
$$

To isolate $g$, multiply the first by $\sin\nu_0$, the second by $\cos\nu_0$, and subtract the first from the second:

$$
r\,(\sin\nu\cos\nu_0 - \cos\nu\sin\nu_0) = g\,\frac{\mu}{h}\left(\sin^2\nu_0 + e\cos\nu_0 + \cos^2\nu_0\right) = g\,\frac{\mu}{h}\,(1 + e\cos\nu_0).
$$

The left side is $r\sin\Delta\nu$, and the orbit equation gives $1 + e\cos\nu_0 = h^2/(\mu r_0)$, so the right side is $g\,h/r_0$:

$$
g = \frac{r\,r_0}{h}\,\sin\Delta\nu .
$$

To isolate $f$, multiply the first equation by $(e + \cos\nu_0)$ and the second by $\sin\nu_0$ and add:

$$
r\left[\cos\nu\,(e + \cos\nu_0) + \sin\nu\sin\nu_0\right] = f\,r_0\left[\cos\nu_0\,(e + \cos\nu_0) + \sin^2\nu_0\right] = f\,r_0\,(1 + e\cos\nu_0) = f\,\frac{h^2}{\mu}.
$$

The left bracket is $e\cos\nu + \cos\Delta\nu$, and by the orbit equation $r\,e\cos\nu = h^2/\mu - r$. So the left side is $h^2/\mu - r + r\cos\Delta\nu = h^2/\mu - r(1 - \cos\Delta\nu)$, and

$$
f = 1 - \frac{\mu\,r}{h^2}\,(1 - \cos\Delta\nu).
$$

The remaining two come cheaply. The inverse relation $\mathbf{r}_0 = \dot{g}\,\mathbf{r} - g\,\mathbf{v}$ (solve the pair of expansions for $\mathbf{r}_0$, using the identity) has the same structure with the roles of the two epochs exchanged and $\Delta\nu \to -\Delta\nu$; matching it to the derivation of $f$ gives

$$
\dot{g} = 1 - \frac{\mu\,r_0}{h^2}\,(1 - \cos\Delta\nu),
$$

and the identity supplies $\dot{f} = (f\dot{g} - 1)/g$, which after algebra reads

$$
\dot{f} = \frac{\mu}{h}\,\frac{1 - \cos\Delta\nu}{\sin\Delta\nu}\left[\frac{\mu}{h^2}(1 - \cos\Delta\nu) - \frac{1}{r_0} - \frac{1}{r}\right].
$$

Notice the pleasing symmetry: $f$ contains the *new* radius $r$ and $\dot{g}$ the *old* radius $r_0$, and both are otherwise identical. To use these formulas you need $r$ at the new true anomaly before you know the new position – which sounds circular but is not, because the orbit equation gives $r$ from $\Delta\nu$ alone. Expanding $1 + e\cos(\nu_0 + \Delta\nu)$ and substituting $e\cos\nu_0 = h^2/(\mu r_0) - 1$ and $e\sin\nu_0 = h\,v_{r0}/\mu$ (from $v_r = (\mu/h)e\sin\nu$):

$$
r = \frac{h^2/\mu}{1 + \left(\dfrac{h^2}{\mu r_0} - 1\right)\cos\Delta\nu - \dfrac{h\,v_{r0}}{\mu}\sin\Delta\nu},
$$

with $v_{r0} = \mathbf{r}_0 \cdot \mathbf{v}_0/r_0$. Everything on the right is known from the initial state and $\Delta\nu$.

::: example Ninety degrees around a GTO
Start at perigee of the GTO: $\mathbf{r}_0 = (6628.137, 0, 0)\,\mathrm{km}$, $\mathbf{v}_0 = (0, 10.1949, 0)\,\mathrm{km/s}$, so $h = 67\,573.4\,\mathrm{km^2/s}$, $h^2/\mu = p = 11\,455.49\,\mathrm{km}$, $v_{r0} = 0$. For $\Delta\nu = 90^\circ$:
$$
r = \frac{11\,455.49}{1 + \left(\dfrac{11\,455.49}{6628.137} - 1\right)\cdot 0 - 0} = 11\,455.49\,\mathrm{km},
$$
as it should be at $\nu = 90^\circ$. Then
$$
f = 1 - \frac{r}{p}(1 - 0) = 1 - 1 = 0, \qquad g = \frac{r\,r_0}{h}\sin 90^\circ = \frac{11\,455.49 \times 6628.137}{67\,573.4} = 1123.65\,\mathrm{s},
$$
$$
\dot{g} = 1 - \frac{r_0}{p} = 1 - \frac{6628.137}{11\,455.49} = 0.42140, \qquad \dot{f} = \frac{f\dot{g} - 1}{g} = -\frac{1}{1123.65} = -8.8996 \times 10^{-4}\,\mathrm{s^{-1}} .
$$
$f = 0$ is not a coincidence: a quarter-turn from perigee, the new position is perpendicular to $\mathbf{r}_0$ and so has no component along it. The new state is
$$
\mathbf{r} = 0 \cdot \mathbf{r}_0 + 1123.65\,\mathbf{v}_0 = (0,\; 11\,455.5,\; 0)\,\mathrm{km}, \qquad
\mathbf{v} = -8.8996 \times 10^{-4}\,\mathbf{r}_0 + 0.42140\,\mathbf{v}_0 = (-5.8988,\; 4.2962,\; 0)\,\mathrm{km/s},
$$
exactly the perifocal velocity $(\mu/h)(-\sin\nu, e + \cos\nu)$ at $\nu = 90^\circ$ computed in the elements lesson, and $\lVert \mathbf{v} \rVert = 7.2974\,\mathrm{km/s}$ agrees with vis-viva at $r = p$. The time taken, $25.7\,\mathrm{min}$, is *not* $g$ – $g$ has units of seconds but is a coefficient, not an elapsed time.
:::

## Coefficients in terms of the universal anomaly

The $\Delta\nu$ form answers "where is the spacecraft after it has turned through this angle". Propagation asks "where is it after this much time", and for that you want the coefficients as functions of $\chi$, which the universal Kepler equation gives from $\Delta t$. Derive them first on an ellipse in terms of $\Delta E$, then translate.

In perifocal coordinates with the eccentric anomaly, $\mathbf{r} = \big(a(\cos E - e),\ b\sin E\big)$ with $b = a\sqrt{1 - e^2}$, and since $\dot{E} = na/r = \sqrt{\mu a}/r$,

$$
\mathbf{v} = \frac{\sqrt{\mu a}}{r}\,\big(-\sin E,\ \sqrt{1 - e^2}\cos E\big).
$$

Solving $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ by Cramer's rule, the determinant of the system is $x_0\dot{y}_0 - y_0\dot{x}_0 = h$ (it is the $z$-component of $\mathbf{r}_0 \times \mathbf{v}_0$), and

$$
f = \frac{x\,\dot{y}_0 - y\,\dot{x}_0}{h}
= \frac{1}{h}\,\frac{\sqrt{\mu a}}{r_0}\Big[a(\cos E - e)\sqrt{1 - e^2}\cos E_0 + b\sin E\sin E_0\Big]
= \frac{\sqrt{\mu a}\,b}{h\,r_0}\Big[(\cos E - e)\cos E_0 + \sin E\sin E_0\Big].
$$

Now $h = \sqrt{\mu a(1 - e^2)} = \sqrt{\mu a}\,b/a$, so the prefactor is $a/r_0$, and the bracket is $\cos\Delta E - e\cos E_0$. With $e\cos E_0 = 1 - r_0/a$,

$$
f = \frac{a}{r_0}\left[\cos\Delta E - 1 + \frac{r_0}{a}\right] = 1 - \frac{a}{r_0}\,(1 - \cos\Delta E).
$$

Similarly $g = (x_0 y - y_0 x)/h = (ab/h)\big[\sin E\cos E_0 - \cos E\sin E_0 - e(\sin E - \sin E_0)\big]$, and $ab/h = a^2/\sqrt{\mu a} = 1/n$. Kepler's equation between the two epochs, $n\Delta t = \Delta E - e(\sin E - \sin E_0)$, replaces the last term:

$$
g = \frac{1}{n}\big[\sin\Delta E - \Delta E + n\Delta t\big] = \Delta t - \sqrt{\frac{a^3}{\mu}}\,(\Delta E - \sin\Delta E).
$$

The same Cramer's-rule computation on $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$ gives $\dot{g} = 1 - (a/r)(1 - \cos\Delta E)$ – the $f$ formula with $r$ in place of $r_0$ – and $\dot{f} = -\big(\sqrt{\mu a}/(r r_0)\big)\sin\Delta E$.

Now translate with $\chi = \sqrt{a}\,\Delta E$, $z = \alpha\chi^2 = (\Delta E)^2$, $a = \chi^2/z$, and the Stumpff identities $1 - \cos\sqrt{z} = zC(z)$, $\sqrt{z} - \sin\sqrt{z} = z^{3/2}S(z)$:

$$
\frac{a}{r_0}(1 - \cos\Delta E) = \frac{\chi^2}{z\,r_0}\,z\,C(z) = \frac{\chi^2}{r_0}\,C(z), \qquad
\sqrt{\frac{a^3}{\mu}}(\Delta E - \sin\Delta E) = \frac{\chi^3}{z^{3/2}\sqrt{\mu}}\,z^{3/2}S(z) = \frac{\chi^3}{\sqrt{\mu}}\,S(z),
$$

and $\sqrt{\mu a}\sin\Delta E = \sqrt{\mu}\,\sqrt{a}\,\sqrt{z}\,(1 - zS) = \sqrt{\mu}\,\chi\,(1 - zS)$. Hence

$$
f = 1 - \frac{\chi^2}{r_0}\,C(z), \qquad
g = \Delta t - \frac{\chi^3}{\sqrt{\mu}}\,S(z), \qquad
\dot{f} = \frac{\sqrt{\mu}}{r\,r_0}\,\chi\,\big(z\,S(z) - 1\big), \qquad
\dot{g} = 1 - \frac{\chi^2}{r}\,C(z).
$$

The derivation used the ellipse, but every $a$, $\Delta E$, $\cos$ and $\sin$ has been absorbed into $\chi$, $C$ and $S$, and the hyperbolic derivation with $\cosh$ and $\sinh$ lands on the same four expressions. They therefore hold for every conic, and with $r = r(\chi)$ from the universal-variables lesson they complete a propagator with no branch on orbit type:

1. From $\mathbf{r}_0, \mathbf{v}_0$: $r_0$, $\alpha$, $\sigma_0$.
2. Solve the universal Kepler equation for $\chi$; compute $z$, $C$, $S$.
3. $f$ and $g$; then $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ and $r = \lVert \mathbf{r} \rVert$.
4. $\dot{f}$ and $\dot{g}$ (which need $r$); then $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$.
5. Check $f\dot{g} - \dot{f}g = 1$.

::: example The ISS-like state, one hour ahead, by f and g
From the universal-variables lesson: $r_0 = 6787.470\,\mathrm{km}$, $\chi = 334.6132$, $z = 16.4874$, $C = 0.097451$, $S = 0.072526$, $\sqrt{\mu} = 631.348$, $\Delta t = 3600\,\mathrm{s}$. Then $\chi^2 = 111\,966$ and $\chi^3 = 3.74618 \times 10^{7}$:
$$
f = 1 - \frac{111\,966 \times 0.097451}{6787.470} = -0.60754, \qquad
g = 3600 - \frac{3.74618 \times 10^{7} \times 0.072526}{631.348} = 3600 - 4303.8 = -703.83\,\mathrm{s}.
$$
Position: $\mathbf{r} = -0.60754\,\mathbf{r}_0 - 703.83\,\mathbf{v}_0 = (-2148.598,\; 6242.669,\; -1592.817)\,\mathrm{km}$, with $r = 6791.499\,\mathrm{km}$ – identical to the analytic (elements-based) propagation of two lessons ago, and within $10^{-8}\,\mathrm{km}$ of it numerically. Then
$$
\dot{f} = \frac{631.348}{6791.499 \times 6787.470}\,(16.4874 \times 0.072526 - 1) \times 334.6132 = 1.36956 \times 10^{-5} \times 0.19577 \times 334.6132 = 8.9720 \times 10^{-4}\,\mathrm{s^{-1}},
$$
$$
\dot{g} = 1 - \frac{111\,966 \times 0.097451}{6791.499} = -0.60659, \qquad
\mathbf{v} = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 = (-5.07304,\; -0.28820,\; 5.73305)\,\mathrm{km/s}.
$$
Identity: $f\dot{g} - \dot{f}g = 0.36853 + 0.63148 = 1.00001$, unity to the rounding of the printed digits (the code gives $1.0000000000$). Both $f$ and $\dot{g}$ are negative because the spacecraft has moved $233^\circ$ around, to the far side of the orbit; $g$ is negative because the new position projects backwards onto $\mathbf{v}_0$.
:::

## Running the relation backwards

Because the expansion is linear in $\mathbf{r}_0$ and $\mathbf{v}_0$, it can be solved for whichever vector is unknown. The most useful case has two positions and the time between them but no velocity – the orbit-determination setting, and Lambert's problem. From $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$,

$$
\mathbf{v}_0 = \frac{\mathbf{r} - f\,\mathbf{r}_0}{g}, \qquad \mathbf{v} = \dot{f}\,\mathbf{r}_0 + \dot{g}\,\mathbf{v}_0 = \frac{\dot{g}\,\mathbf{r} - \mathbf{r}_0}{g},
$$

the second form using the identity $f\dot{g} - \dot{f}g = 1$ to eliminate $\dot{f}$. So if the coefficients are known, both velocities follow from the two positions by vector arithmetic. The catch is that $f$ and $g$ depend on the orbit through $h$ (in the $\Delta\nu$ form) or through $\alpha$ and $\chi$ (in the universal form), and the orbit is what you are trying to find. Lambert's problem is the one-dimensional search that closes this loop: guess the orbit parameter, evaluate the time of flight the coefficients imply, compare with the required time, adjust. Everything in that loop is material from this module, and the targeting module assembles it.

The relation also runs backwards in time trivially: $\mathbf{r}_0 = \dot{g}\,\mathbf{r} - g\,\mathbf{v}$ and $\mathbf{v}_0 = -\dot{f}\,\mathbf{r} + f\,\mathbf{v}$, which you can verify by substituting the forward relations and using the identity. The inverse of the coefficient matrix is its adjugate, because its determinant is one – a compact restatement of $f\dot{g} - \dot{f}g = 1$.

## Which form to use when

The two forms of the coefficients are exact and equivalent, but they are conditioned differently. The $\Delta\nu$ form is the natural one when the geometry is given – a transfer through a specified angle, a position fix at a known true anomaly – and it costs no iteration at all. Its weakness is very small angles: $1 - \cos\Delta\nu$ and $\sin\Delta\nu$ both go to zero, $\dot{f}$ divides one by the other, and for $\Delta\nu$ of a few arcseconds the coefficients carry several fewer significant digits than the inputs. The universal form is the natural one when *time* is given, which is the propagation problem; it needs the Newton solution for $\chi$ but is uniformly well conditioned, including at $\Delta t \to 0$ where the series branches of $C$ and $S$ take over. In practice a propagator uses the universal form, a Lambert solver uses both (the $\Delta\nu$ form to relate positions to $p$, the universal form to relate $p$ to time), and orbit determination from angles uses the $\Delta\nu$ form.

There is also a conceptual payoff in seeing the coefficients as the two-body problem's answer to a question that a linear system answers with a matrix exponential. For a linear ODE $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ the state at time $t$ is $e^{\mathbf{A}t}\mathbf{x}_0$; the two-body problem is nonlinear, yet within one orbit plane the position and velocity at time $t$ are still *linear* in the initial position and velocity, with a $2 \times 2$ block matrix of coefficients $f, g, \dot{f}, \dot{g}$ that depends on the initial state only through $r_0$, $\sigma_0$ and $\alpha$. That is a strong statement about the structure of Keplerian motion, and it is why the state transition matrix of a Kepler orbit can be written in closed form.

## Where the coefficients appear next

In Lambert's problem you know $\mathbf{r}_0$ and $\mathbf{r}$ and the time between them but not $\mathbf{v}_0$; the $\Delta\nu$ forms of $f$ and $g$ give $\mathbf{v}_0 = (\mathbf{r} - f\mathbf{r}_0)/g$ once the transfer's $p$ or $\chi$ has been found, and the whole Lambert iteration is a search for the $\chi$ that makes the universal Kepler equation return the required time. In Gibbs's method three position vectors determine the orbit and $f$, $g$ deliver the velocity at the middle one. In a navigation filter the Jacobian of $(\mathbf{r}, \mathbf{v})$ with respect to $(\mathbf{r}_0, \mathbf{v}_0)$ – the state transition matrix – is built from $f$, $g$, $\dot{f}$, $\dot{g}$ and their partial derivatives; the block $g\,\mathbf{I}$ is the leading term that says a velocity error grows into a position error linearly in time.

```python
def propagate_fg(r0, v0, dt, mu=MU):
    chi, alpha = universal_anomaly(r0, v0, dt, mu)     # from the universal-variables lesson
    rn = np.linalg.norm(r0)
    z = alpha * chi**2
    C, S = stumpff_C(z), stumpff_S(z)
    f = 1 - chi**2 / rn * C
    g = dt - chi**3 / np.sqrt(mu) * S
    r = f * r0 + g * v0
    rmag = np.linalg.norm(r)
    fdot = np.sqrt(mu) / (rmag * rn) * (z * S - 1) * chi
    gdot = 1 - chi**2 / rmag * C
    v = fdot * r0 + gdot * v0
    assert abs(f * gdot - fdot * g - 1) < 1e-10
    return r, v
```

Run it on the $e = 0.0$, $0.7$, $1.0$ and $1.5$ cases of the exercise: the same eleven lines produce each, and the assertion on the identity is your built-in test.

::: warning g is a coefficient with units of time, not a time
$g$ multiplies $\mathbf{v}_0$ to give a length, so it must carry seconds, and for a short step $g \approx \Delta t$ (since $f \approx 1$ and $\mathbf{r} \approx \mathbf{r}_0 + \mathbf{v}_0\Delta t$). For longer steps it departs from $\Delta t$ and can be negative, as in the ISS example where $g = -704\,\mathrm{s}$ for a $3600\,\mathrm{s}$ step. Never read $g$ as an elapsed time.
:::

::: warning Compute r before ḟ and ġ
The velocity coefficients contain the new radius $r$, which is only known after $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$ has been formed (or from $r(\chi) = F'(\chi)$ of the universal Kepler equation, which is the same number). Using $r_0$ in their place is a common slip; the identity check $f\dot{g} - \dot{f}g = 1$ catches it immediately.
:::

## Check yourself

::: check
For a very short time step $\Delta t$, expand $f$, $g$, $\dot{f}$, $\dot{g}$ to first order and interpret.
:::

::: answer
For small $\Delta t$, $\chi \approx \sqrt{\mu}\,\Delta t/r_0$ (from $r_0\chi \approx \sqrt{\mu}\Delta t$) and $z \to 0$, $C \to \tfrac{1}{2}$, $S \to \tfrac{1}{6}$. Then $f \approx 1 - \tfrac{1}{2}(\mu/r_0^3)\Delta t^2$, $g \approx \Delta t$, $\dot{f} \approx -(\mu/r_0^3)\Delta t$, $\dot{g} \approx 1 - \tfrac{1}{2}(\mu/r_0^3)\Delta t^2$. So $\mathbf{r} \approx \mathbf{r}_0 + \mathbf{v}_0\Delta t - \tfrac{1}{2}(\mu/r_0^3)\mathbf{r}_0\Delta t^2$: uniform motion plus half the gravitational acceleration times $\Delta t^2$ – the Taylor expansion of the trajectory, as it must be.
:::

::: check
Prove that $f\dot{g} - \dot{f}g = 1$ using only the definitions and conservation of angular momentum.
:::

::: answer
$\mathbf{r} \times \mathbf{v} = (f\mathbf{r}_0 + g\mathbf{v}_0) \times (\dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0)$. The $\mathbf{r}_0 \times \mathbf{r}_0$ and $\mathbf{v}_0 \times \mathbf{v}_0$ terms vanish; the cross terms give $f\dot{g}\,\mathbf{r}_0 \times \mathbf{v}_0 + g\dot{f}\,\mathbf{v}_0 \times \mathbf{r}_0 = (f\dot{g} - g\dot{f})\,\mathbf{h}_0$. Since $\mathbf{h} = \mathbf{h}_0 \neq \mathbf{0}$, the scalar factor must be $1$.
:::

::: check
A spacecraft at $\mathbf{r}_0 = (7000, 0, 0)\,\mathrm{km}$ with $\mathbf{v}_0 = (0, 7.5461, 0)\,\mathrm{km/s}$ (circular) has moved through $\Delta\nu = 60^\circ$. Compute $f$, $g$, $\dot{f}$, $\dot{g}$ and the new state.
:::

::: answer
Circular, so $r = r_0 = 7000$, $h = 7000 \times 7.5461 = 52\,822.7$, $h^2/\mu = 7000$. $f = 1 - (7000/7000)(1 - \cos 60^\circ) = 0.5$; $g = (7000^2/52\,822.7)\sin 60^\circ = 927.60 \times 0.86603 = 803.3\,\mathrm{s}$; $\dot{g} = 1 - (1 - \cos 60^\circ) = 0.5$; $\dot{f} = (f\dot{g} - 1)/g = -0.75/803.3 = -9.337 \times 10^{-4}\,\mathrm{s^{-1}}$. New state: $\mathbf{r} = (3500,\; 6062.2,\; 0)\,\mathrm{km}$ (magnitude 7000, at $60^\circ$) and $\mathbf{v} = (-6.536,\; 3.773,\; 0)\,\mathrm{km/s}$ (magnitude $7.546$, perpendicular to $\mathbf{r}$). For a circle $f = \dot{g} = \cos\Delta\nu$ and $\dot{f} = -n\sin\Delta\nu$, as here.
:::

::: check
In the ISS example $g$ came out negative for a positive time step. Explain geometrically.
:::

::: answer
$g$ is the coefficient of $\mathbf{v}_0$ in $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$. After $233^\circ$ of travel the spacecraft is on the far side of the orbit; its position vector, decomposed in the (nearly orthogonal) basis $\mathbf{r}_0$, $\mathbf{v}_0$, points partly backwards along $-\mathbf{r}_0$ (hence $f < 0$) and partly backwards along $-\mathbf{v}_0$ (hence $g < 0$). For a circular orbit $g = (r^2/h)\sin\Delta\nu$, which is negative whenever $180^\circ < \Delta\nu < 360^\circ$.
:::

::: check
Why does the universal form of the Lagrange coefficients hold for hyperbolas when it was derived using an ellipse?
:::

::: answer
The elliptic derivation produced expressions in $a$, $\Delta E$, $\cos\Delta E$ and $\sin\Delta E$; each was then rewritten in terms of $\chi = \sqrt{a}\Delta E$ and the Stumpff functions of $z = (\Delta E)^2$. Repeating the derivation for a hyperbola with $a < 0$, $\Delta H$, $\cosh$ and $\sinh$ produces the same structure, and the hyperbolic Stumpff branches ($C = (\cosh\sqrt{-z} - 1)/(-z)$, etc.) turn those into the identical formulas with $z = -(\Delta H)^2 < 0$. Since $C(z)$ and $S(z)$ are single analytic functions across $z = 0$, the four expressions are one formula for all conics.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r} = f\mathbf{r}_0 + g\mathbf{v}_0$, $\mathbf{v} = \dot{f}\mathbf{r}_0 + \dot{g}\mathbf{v}_0$ | Propagated state as a combination of the initial state |
| $f\dot{g} - \dot{f}g = 1$ | Conservation of $\mathbf{h}$; the built-in check |
| $f = 1 - \dfrac{\mu r}{h^2}(1 - \cos\Delta\nu)$, $g = \dfrac{r r_0}{h}\sin\Delta\nu$ | True-anomaly form |
| $\dot{g} = 1 - \dfrac{\mu r_0}{h^2}(1 - \cos\Delta\nu)$, $\dot{f} = (f\dot{g} - 1)/g$ | True-anomaly form, velocity |
| $r = \dfrac{h^2/\mu}{1 + (h^2/(\mu r_0) - 1)\cos\Delta\nu - (h v_{r0}/\mu)\sin\Delta\nu}$ | New radius from $\Delta\nu$ |
| $f = 1 - \dfrac{\chi^2}{r_0}C$, $g = \Delta t - \dfrac{\chi^3}{\sqrt{\mu}}S$ | Universal form |
| $\dot{f} = \dfrac{\sqrt{\mu}}{r r_0}\chi(zS - 1)$, $\dot{g} = 1 - \dfrac{\chi^2}{r}C$ | Universal form, velocity |
| Elliptic special case | $f = 1 - \frac{a}{r_0}(1 - \cos\Delta E)$, $g = \Delta t - \sqrt{a^3/\mu}(\Delta E - \sin\Delta E)$ |

The final two lessons leave the abstract orbit for the real sky: what different orbits look like from the ground, the named orbit families of operational spaceflight, and the two-line element sets in which the world's satellite catalogue is published.
