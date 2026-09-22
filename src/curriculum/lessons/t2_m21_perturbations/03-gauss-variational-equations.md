---
id: l03-gauss-variational-equations
title: The Gauss variational and Lagrange planetary equations
minutes: 18
covers:
  - Gauss variational equations and Lagrange planetary equations
---

The two-body module gave you six numbers — the classical orbital elements — that stay exactly constant along an unperturbed orbit. The moment you add a perturbing acceleration, they stop being constant, but they do not become useless: they become *slowly varying*, and the equations that describe how they vary are the single most useful piece of machinery in this module. Instead of asking "where is the spacecraft in three months", which needs a numerical integrator and a great deal of computation, the variational equations let you ask "which element does this force move, and how fast", which is a question you can often answer on paper.

This is the question behind every design decision in the lessons ahead. Why does $J_2$ rotate the node but not the semi-major axis? Why does drag shrink the orbit but barely touch its orientation? Why does solar radiation pressure change eccentricity but not inclination, for an equatorial orbit? Every one of these is a statement about which component of a perturbing acceleration — radial, transverse, or normal to the orbit plane — a given element's rate of change actually depends on, and the Gauss variational equations make that dependence explicit for any acceleration at all, whatever its source.

## Elements are invariant under two-body motion — and that is the whole trick

A classical orbital element — semi-major axis $a$, eccentricity $e$, inclination $i$, right ascension of the ascending node $\Omega$, argument of perigee $\omega$ — is a function of the instantaneous state, $\text{element}(\mathbf{r},\mathbf{v})$, that happens to be *constant* along any unperturbed two-body trajectory. Differentiate it along such a trajectory using the chain rule:

$$
\frac{d(\text{element})}{dt} = \frac{\partial(\text{element})}{\partial\mathbf{r}}\cdot\mathbf{v} + \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\left(-\frac{\mu\mathbf{r}}{r^3}\right) = 0 .
$$

This holds for *every* point $(\mathbf{r},\mathbf{v})$, not just along one trajectory, because every state lies on some two-body orbit and the element is constant along whichever one it lies on. It is therefore an algebraic identity in $(\mathbf{r},\mathbf{v})$, true everywhere, independent of what trajectory you are on.

Now perturb the motion: $\dot{\mathbf{v}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$. The same chain rule gives

$$
\frac{d(\text{element})}{dt} = \underbrace{\frac{\partial(\text{element})}{\partial\mathbf{r}}\cdot\mathbf{v} + \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\left(-\frac{\mu\mathbf{r}}{r^3}\right)}_{=\ 0\ \text{by the identity above}} + \ \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\mathbf{a}_p = \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\mathbf{a}_p .
$$

The two-body part vanishes identically, leaving an exact result: *the instantaneous rate of change of any orbital element under a perturbation depends only on $\mathbf{a}_p$, through the element's sensitivity to velocity.* No approximation has been made yet — this is exact for any $\mathbf{a}_p$, however large, however it depends on $\mathbf{r}$, $\mathbf{v}$, or time. What remains is bookkeeping: work out $\partial(\text{element})/\partial\mathbf{v}$ for each of the five orientation-and-shape elements, and express the answer in a frame attached to the orbit rather than to fixed inertial axes.

## The radial-transverse-normal frame

Define, at the spacecraft's instantaneous position, the orthonormal triad

$$
\hat{\mathbf{R}} = \hat{\mathbf{r}} = \frac{\mathbf{r}}{r}, \qquad \hat{\mathbf{W}} = \hat{\mathbf{h}} = \frac{\mathbf{r}\times\mathbf{v}}{h}, \qquad \hat{\mathbf{T}} = \hat{\mathbf{W}}\times\hat{\mathbf{R}} ,
$$

radial, normal (out of the orbit plane), and transverse (in the orbit plane, completing a right-handed set: $\hat{\mathbf{R}}\times\hat{\mathbf{T}}=\hat{\mathbf{W}}$, $\hat{\mathbf{T}}\times\hat{\mathbf{W}}=\hat{\mathbf{R}}$, $\hat{\mathbf{W}}\times\hat{\mathbf{R}}=\hat{\mathbf{T}}$). Resolve any perturbing acceleration as $\mathbf{a}_p = R\hat{\mathbf{R}} + T\hat{\mathbf{T}} + N\hat{\mathbf{W}}$. Because $\hat{\mathbf{W}}$ is built from $\mathbf{r}\times\mathbf{v}$, the velocity itself has no $\hat{\mathbf{W}}$ component: $\mathbf{v} = v_r\hat{\mathbf{R}} + v_t\hat{\mathbf{T}}$ identically, with (from the orbit equation, as in the two-body module) $v_r = (\mu/h)e\sin\nu$ and $v_t = h/r$.

## da/dt, by the energy route

The specific orbital energy is $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$. Differentiate the left side directly: $\dot\varepsilon = \mathbf{v}\cdot\dot{\mathbf{v}} - (-\mu\dot r/r^2)$; since $\dot r = \mathbf{v}\cdot\hat{\mathbf{r}} = v_r$ and $\mathbf{v}\cdot(-\mu\mathbf{r}/r^3) = -\mu v_r/r^2$, the two-body parts cancel exactly as the general argument predicted, leaving $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}_p = v_rR + v_tT$. Differentiate the right side: $\dot\varepsilon = \mu\dot a/(2a^2)$. Equate and substitute $v_r$, $v_t$, $h = \sqrt{\mu a(1-e^2)} = na^2\sqrt{1-e^2}$ (with $n=\sqrt{\mu/a^3}$):

$$
\frac{da}{dt} = \frac{2a^2}{\mu}(v_rR + v_tT) = \frac{2}{n\sqrt{1-e^2}}\left[e\sin\nu\,R + \frac{p}{r}T\right], \qquad p = a(1-e^2) .
$$

Only $R$ and $T$ appear — a perturbation entirely normal to the orbit plane cannot change the orbit's size, which makes sense, since it does no work along the velocity (recall $\mathbf{v}$ has no $\hat{\mathbf{W}}$ component, so $N\hat{\mathbf{W}}\cdot\mathbf{v} = 0$ always).

## dh/dt, and why only the normal component tips the plane

Differentiate the angular momentum directly: $\dot{\mathbf{h}} = \dot{\mathbf{r}}\times\mathbf{v} + \mathbf{r}\times\dot{\mathbf{v}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times(-\mu\mathbf{r}/r^3) + \mathbf{r}\times\mathbf{a}_p$. The first two terms vanish (a vector crossed with itself, and $\mathbf{r}$ crossed with something parallel to itself), leaving the clean exact result

$$
\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p .
$$

Expand $\mathbf{r} = r\hat{\mathbf{R}}$ and $\mathbf{a}_p = R\hat{\mathbf{R}}+T\hat{\mathbf{T}}+N\hat{\mathbf{W}}$, using $\hat{\mathbf{R}}\times\hat{\mathbf{R}}=\mathbf{0}$, $\hat{\mathbf{R}}\times\hat{\mathbf{T}}=\hat{\mathbf{W}}$, $\hat{\mathbf{R}}\times\hat{\mathbf{W}}=-\hat{\mathbf{T}}$:

$$
\dot{\mathbf{h}} = rT\hat{\mathbf{W}} - rN\hat{\mathbf{T}} .
$$

The $\hat{\mathbf{W}}$ part is *along* $\mathbf{h}$, so it changes only $h$'s magnitude — this is the transverse component doing work, consistent with $da/dt$ above (since $h^2 = \mu a(1-e^2)$ ties $h$'s size to $a$ and $e$ together). The $-rN\hat{\mathbf{T}}$ part is *perpendicular* to $\mathbf{h}$, so it changes only $\mathbf{h}$'s *direction* — it tips the orbital plane, without changing how much angular momentum there is. This is the single fact that organises the rest of this lesson: **only the normal component of a perturbing acceleration can rotate the orbital plane**; radial and transverse components move the spacecraft within whatever plane it is already in.

## di/dt and dΩ/dt, from tipping the orbit normal

The unit normal $\hat{\mathbf{W}}$, in terms of inclination and node, is $\hat{\mathbf{W}} = (\sin i\sin\Omega,\ -\sin i\cos\Omega,\ \cos i)$. Its rate of change, from the previous section (the $\hat{\mathbf{W}}$-magnitude part of $\dot{\mathbf{h}}$ does not rotate $\hat{\mathbf{W}}$, only the perpendicular part does): $\dot{\hat{\mathbf{W}}} = -(rN/h)\hat{\mathbf{T}}$.

Let $\hat{\mathbf{n}} = (\cos\Omega,\sin\Omega,0)$ be the unit vector toward the ascending node. Since $\hat{\mathbf{W}}$ and $\hat{\mathbf{n}}$ are always perpendicular (the node lies both in the equatorial plane and in the orbital plane, hence perpendicular to the orbit normal), $\hat{\mathbf{W}}\cdot\hat{\mathbf{n}} = 0$ identically; differentiating,

$$
\dot{\hat{\mathbf{W}}}\cdot\hat{\mathbf{n}} + \hat{\mathbf{W}}\cdot\dot{\hat{\mathbf{n}}} = 0 .
$$

With $\dot{\hat{\mathbf{n}}} = \dot\Omega(-\sin\Omega,\cos\Omega,0)$, direct substitution gives $\hat{\mathbf{W}}\cdot\dot{\hat{\mathbf{n}}} = -\dot\Omega\sin i$. For the first term, write the position in terms of the argument of latitude $u = \omega+\nu$ (the angle from the node to the spacecraft, measured in the orbital plane): $\hat{\mathbf{R}} = \cos u\,\hat{\mathbf{n}} + \sin u\,(\hat{\mathbf{W}}\times\hat{\mathbf{n}})$, from which $\hat{\mathbf{T}} = \hat{\mathbf{W}}\times\hat{\mathbf{R}} = \cos u\,(\hat{\mathbf{W}}\times\hat{\mathbf{n}}) - \sin u\,\hat{\mathbf{n}}$ (using $\hat{\mathbf{W}}\times(\hat{\mathbf{W}}\times\hat{\mathbf{n}}) = -\hat{\mathbf{n}}$). So $\hat{\mathbf{T}}\cdot\hat{\mathbf{n}} = -\sin u$, and

$$
\dot{\hat{\mathbf{W}}}\cdot\hat{\mathbf{n}} = -\frac{rN}{h}(\hat{\mathbf{T}}\cdot\hat{\mathbf{n}}) = \frac{rN\sin u}{h} .
$$

Substituting into the perpendicularity identity, $\dfrac{rN\sin u}{h} - \dot\Omega\sin i = 0$, gives

$$
\frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}\,N .
$$

For inclination, use the $z$-component of $\hat{\mathbf{W}}$: $\hat{W}_z = \cos i$, so $\dot{\hat{W}}_z = -\sin i\,\dot i$. From $\dot{\hat{\mathbf{W}}} = -(rN/h)\hat{\mathbf{T}}$, this component is $-(rN/h)\hat{T}_z$; working out $\hat{T}_z = \cos u\,(\hat{\mathbf{W}}\times\hat{\mathbf{n}})_z = \cos u\sin i$ (a short cross-product computation from the definitions of $\hat{\mathbf{W}}$ and $\hat{\mathbf{n}}$ above) gives $-\sin i\,\dot i = -(rN/h)\cos u\sin i$, and dividing through by $-\sin i$,

$$
\frac{di}{dt} = \frac{r\cos u}{h}\,N .
$$

Both rates depend on $N$ alone, exactly as the $\dot{\mathbf{h}}$ argument predicted — radial and transverse forces cannot move the orbital plane, only its normal component can, and $di/dt$, $d\Omega/dt$ are that same tipping, resolved into the two angles that describe a plane's orientation.

## de/dt and dω/dt

The eccentricity vector $\mathbf{e} = (\mathbf{v}\times\mathbf{h})/\mu - \hat{\mathbf{r}}$ points from focus to periapsis with magnitude $e$; it is constant under two-body motion by the same invariance argument as any other element. Differentiating it (using $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p$ from above and $\dot{\hat{\mathbf{r}}} = (h/r^2)\hat{\mathbf{T}}$) and projecting the result onto the periapsis direction $\hat{\mathbf{e}} = \mathbf{e}/e$ and onto $\hat{\mathbf{f}} = \hat{\mathbf{W}}\times\hat{\mathbf{e}}$ — exactly the same two-projection method used for $i$ and $\Omega$, but referenced to the (also moving) periapsis direction instead of the node — separates the change in $\mathbf{e}$'s magnitude from the change in its orientation within the plane. After the same kind of algebra as above, the results are

$$
\frac{de}{dt} = \frac{\sqrt{1-e^2}}{na}\left[\sin\nu\,R + \left(\cos\nu + \frac{e+\cos\nu}{1+e\cos\nu}\right)T\right],
$$

$$
\frac{d\omega}{dt} = \frac{1}{eh}\Big[-p\cos\nu\,R + (p+r)\sin\nu\,T\Big] - \cos i\,\frac{d\Omega}{dt} .
$$

The $-\cos i\,\dot\Omega$ term in $\dot\omega$ has a clean interpretation: $\omega$ is measured from the ascending node, and when the node itself regresses or advances, $\omega$ picks up an apparent rate of change purely from its reference direction moving, even if the periapsis direction within an instantaneously fixed plane had not moved at all. This is bookkeeping, not new physics, but it is exactly the kind of term that is easy to drop and hard to notice missing.

::: key The Gauss variational equations
With $\mathbf{a}_p = R\hat{\mathbf{R}} + T\hat{\mathbf{T}} + N\hat{\mathbf{W}}$, $p=a(1-e^2)$, $h=\sqrt{\mu p}$, $u=\omega+\nu$:
$$
\frac{da}{dt} = \frac{2}{n\sqrt{1-e^2}}\Big[e\sin\nu\,R + \frac{p}{r}T\Big], \qquad
\frac{de}{dt} = \frac{\sqrt{1-e^2}}{na}\Big[\sin\nu\,R + \Big(\cos\nu+\frac{e+\cos\nu}{1+e\cos\nu}\Big)T\Big],
$$
$$
\frac{di}{dt} = \frac{r\cos u}{h}N, \qquad \frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}N, \qquad
\frac{d\omega}{dt} = \frac{1}{eh}\big[-p\cos\nu\,R+(p+r)\sin\nu\,T\big] - \cos i\frac{d\Omega}{dt} .
$$
Only $N$ moves $i$ and $\Omega$; only $R,T$ move $a$ and (mostly) $e$; every rate is exact, for any $\mathbf{a}_p$, at every instant.
:::

::: note Gauss's form and Lagrange's form
Lagrange derived an earlier, more restrictive version of these equations using a *disturbing function* $\mathcal{R}$ — a potential such that $\mathbf{a}_p = \nabla\mathcal{R}$ — and Lagrange brackets relating pairs of elements. That approach is elegant and is exactly how the $J_2$ secular rates are traditionally derived (the geopotential of the previous lesson *is* a disturbing function), but it only works when $\mathbf{a}_p$ is conservative. Gauss's form, derived above directly from $R$, $T$, $N$, places no such restriction: it works identically for a conservative force like $J_2$ or third-body gravity and for a non-conservative one like atmospheric drag, which is why this module uses Gauss's form throughout and why it is the form implemented in every numerical propagator you will write.
:::

::: example Isolating each equation with a pure R, T, or N perturbation
Take an orbit with $a=8000\,\mathrm{km}$, $e=0.3$, $i=45^\circ$, at a point where $\nu = 110^\circ$, $u = \omega+\nu = 310^\circ$ (so $\Omega=70^\circ$, $\omega=200^\circ$), giving $h = 53\,868.46\,\mathrm{km^2/s}$, $r = 8112.379\,\mathrm{km}$, $n = \sqrt{\mu/a^3} = 8.8234\times10^{-4}\,\mathrm{rad/s}$. Apply a test acceleration of magnitude $\varepsilon = 10^{-6}\,\mathrm{km/s^2}$ purely along $\hat{\mathbf{W}}$ (out of plane):
$$
\frac{di}{dt} = \frac{r\cos u}{h}\,\varepsilon = \frac{8112.379\times\cos310^\circ}{53\,868.46}\times10^{-6} = 9.680\times10^{-8}\,\mathrm{rad/s},
$$
$$
\frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}\,\varepsilon = \frac{8112.379\times\sin310^\circ}{53\,868.46\times\sin45^\circ}\times10^{-6} = -1.631\times10^{-7}\,\mathrm{rad/s},
$$
while $da/dt$ and $de/dt$ both come out at the level of $10^{-13}$ to $10^{-17}$ — floating-point zero, not a small nonzero number, exactly as the theory predicts for a purely normal force. Swap to a purely transverse test acceleration of the same magnitude instead, and the pattern inverts: $da/dt = \big[2/(n\sqrt{1-e^2})\big](p/r)\,\varepsilon = 2.1324\times10^{-3}\,\mathrm{km/s}$ (using $R=0$, so only the $T$ term survives) and $de/dt = -5.255\times10^{-8}\,\mathrm{s^{-1}}$, both clearly nonzero, while $di/dt$ and $d\Omega/dt$ vanish to floating-point precision. These numbers were checked independently, by finite-differencing the classical elements with respect to $\mathbf{v}$ and dotting with the test acceleration, exactly as the derivation's opening argument describes — the two computations agree to nine significant figures.
:::

::: example Why J2 cannot secularly change a or e, in one line
$J_2$'s acceleration has no term that stays one-signed in both $R$ and $T$ averaged over a full revolution: the equatorial-bulge force is radial-dominated and symmetric between the ascending and descending halves of any orbit that is not exactly equatorial, so $\langle e\sin\nu\,R\rangle$ and the transverse terms in $da/dt$, $de/dt$ average to zero over one period even though they are nonzero at any instant. $J_2$'s $N$ component, by contrast, does *not* average to zero — it has the same sign pattern every time the spacecraft crosses a given latitude band — which is exactly why $di/dt$ and $d\Omega/dt$ (and, through the $-\cos i\,\dot\Omega$ term, $d\omega/dt$) survive orbit-averaging while $da/dt$ and $de/dt$ do not. The next lesson carries out that averaging explicitly.
:::

## Check yourself

::: check
Explain, without writing any formula, why a perturbing acceleration directed exactly along the spacecraft's radius vector cannot change the orbit's inclination.
:::

::: answer
A radial acceleration is parallel to $\mathbf{r}$, so $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p = \mathbf{0}$ identically: a force pointed straight along the radius vector produces no torque about the orbit's centre, so it cannot change $\mathbf{h}$ at all — neither its magnitude nor its direction. Since $di/dt$ and $d\Omega/dt$ depend only on $N$, the component of $\mathbf{a}_p$ along $\hat{\mathbf{W}}$, and a purely radial vector has $N=0$ by construction, both rates are exactly zero. (A radial force can still change $a$ and $e$, through the $R$ terms in their own equations — it cannot touch the plane's orientation.)
:::

::: check
A spacecraft is hit by a normal ($\hat{\mathbf{W}}$-direction) impulsive perturbation exactly at $u=0$ (the ascending node). What happens to $di/dt$ at that instant, and why does that make physical sense?
:::

::: answer
$di/dt = (r\cos u/h)N$ is maximised at $u=0$ (where $\cos u = 1$), while $d\Omega/dt = (r\sin u/(h\sin i))N$ is zero there (since $\sin 0 = 0$). Physically, a push exactly at the node — where the orbit crosses the reference plane — tips the plane about the node line itself, which is a pure inclination change with no rotation of where the node line sits; a push a quarter-orbit later, at $u=90^\circ$, does the opposite: it slides the node around with no immediate change in tilt.
:::

::: check
Why does the Gauss form of the variational equations, rather than Lagrange's original disturbing-function form, get used for atmospheric drag?
:::

::: answer
Lagrange's original derivation requires the perturbing acceleration to be conservative — derivable as the gradient of a disturbing potential $\mathcal{R}$ — because it works with Lagrange brackets built from that potential. Atmospheric drag depends on velocity (through $v_{\text{rel}}^2$) and always opposes the direction of motion, so it does negative work and cannot be written as the gradient of any potential function. Gauss's form, derived directly from resolving $\mathbf{a}_p$ into $R$, $T$, $N$ components with no reference to a potential, places no such restriction and applies unchanged to drag, to $J_2$, or to any other force.
:::

::: check
Using $da/dt = \big[2/(n\sqrt{1-e^2})\big]\big[e\sin\nu\,R + (p/r)T\big]$, explain why a transverse thrust at periapsis changes $a$ more efficiently, per unit $\Delta v$, than the same thrust at apoapsis.
:::

::: answer
The transverse coefficient is $p/r$, which is largest where $r$ is smallest — at periapsis. A given transverse acceleration therefore produces a larger $da/dt$ at periapsis than at apoapsis, which is the variational-equations version of the same fact the maneuvers module states as "burn at periapsis to raise apoapsis efficiently": periapsis is where the spacecraft is moving fastest and a fixed thrust duration corresponds to a smaller true-anomaly arc, so its effect on the orbit's energy (and hence $a$) per unit $\Delta v$ is largest there.
:::

::: check
A perturbation has been measured to produce $de/dt \ne 0$ but $di/dt = d\Omega/dt = 0$ at every point of the orbit. What can you conclude about its $R$, $T$, $N$ components?
:::

::: answer
Since $di/dt$ and $d\Omega/dt$ depend only on $N$ and both are identically zero everywhere, $N=0$ at every point — the perturbation has no out-of-plane component; it lies entirely in the orbital plane. Since $de/dt$ is nonzero, at least one of $R$, $T$ must be nonzero somewhere in a way that does not average to zero over the orbit (a purely in-plane force whose $R$, $T$ pattern is symmetric between ascending and descending halves would still leave $e$ unchanged on average, so a nonzero secular $de/dt$ requires an asymmetry in how $R$ and $T$ depend on true anomaly).
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $d(\text{element})/dt = (\partial\,\text{element}/\partial\mathbf{v})\cdot\mathbf{a}_p$ | Exact identity: two-body part of the chain rule vanishes |
| $\hat{\mathbf{R}},\hat{\mathbf{T}},\hat{\mathbf{W}}$ | Radial, transverse, normal unit vectors; $\mathbf{a}_p = R\hat{\mathbf{R}}+T\hat{\mathbf{T}}+N\hat{\mathbf{W}}$ |
| $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p = rT\hat{\mathbf{W}} - rN\hat{\mathbf{T}}$ | Only $N$ tips the orbital plane; only $T$ (and radial, via energy) changes its size |
| $da/dt$, $de/dt$ | Depend on $R,T$ only |
| $di/dt = (r\cos u/h)N$, $d\Omega/dt = (r\sin u/(h\sin i))N$ | Depend on $N$ only; $u=\omega+\nu$ |
| $d\omega/dt$ | Depends on $R,T$, plus $-\cos i\,d\Omega/dt$ from the moving node reference |
| Gauss's form vs Lagrange's form | Gauss (R,T,N) works for any force, including non-conservative drag; Lagrange's needs a disturbing potential |

The next lesson averages the $J_2$ acceleration's $N$ component over one full orbit using exactly these equations, producing the secular nodal regression and apsidal rotation rates that the rest of this module is built around.
