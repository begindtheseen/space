---
id: l03-gauss-variational-equations
title: The Gauss variational and Lagrange planetary equations
minutes: 20
covers:
  - Gauss variational equations and Lagrange planetary equations
---

Imagine you are on a highway at night and someone asks where you are. You could give your exact spot every second. Or you could say which road you are on — "Route 66, heading west". The road is a much more useful answer. It barely changes from one minute to the next, and it tells you where you are going.

Orbits work the same way. The two-body module gave you six numbers — the classical orbital elements — that describe which ellipse a spacecraft is on. Without perturbations they never change. Add a perturbing acceleration and they start to change, but slowly, like a car drifting gradually from one lane to the next. The equations for *how fast each element changes* are the most useful machinery in this module.

With them you stop asking "where is the spacecraft in three months?", which needs a numerical integrator and a great deal of computing. You ask "which element does this force move, and how fast?" — a question you can often answer on paper.

That is the question behind every design choice ahead. Why does $J_2$ swing the orbit's node around but leave its size alone? Why does drag shrink an orbit but barely change its tilt? Why does a thruster firing straight out of the orbit plane change the tilt but never the size? Each answer is about which *direction* of push — outward, forward, or sideways out of the orbit plane — an element responds to. The **Gauss variational equations** make that explicit for any acceleration at all.

## The ellipse you would follow if the nudges stopped

At any instant, a spacecraft has a position $\mathbf{r}$ and a velocity $\mathbf{v}$. Switch off every perturbation at that instant, and it would follow one exact two-body ellipse from then on. The elements of that ellipse are the **[[osculating elements|osculating-kiss]]** — the orbit that touches the real path at this moment.

Each element is therefore a function of the current state: $\text{element}(\mathbf{r},\mathbf{v})$. You already know the recipes from the two-body module: energy gives $a$, the angular momentum vector gives $i$ and $\Omega$, the eccentricity vector gives $e$ and $\omega$. As the perturbations act, the state changes in a way two-body motion would not, and the osculating elements drift.

## Only the nudge moves the elements

Here is the key idea, first in words. Along an unperturbed orbit, every element stays constant. That is true for *every* possible state, because every state sits on some two-body orbit. So the part of the motion that is pure two-body gravity can never change an element. Only the extra nudge can.

Now in symbols. Differentiate an element along an unperturbed path using the **[[chain rule|chain-rule]]**. The position changes at rate $\mathbf{v}$, and the velocity changes at rate $-\mu\mathbf{r}/r^3$:

$$
\frac{d(\text{element})}{dt} = \frac{\partial(\text{element})}{\partial\mathbf{r}}\cdot\mathbf{v} + \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\left(-\frac{\mu\mathbf{r}}{r^3}\right) = 0 .
$$

Because this holds at every $(\mathbf{r},\mathbf{v})$, not only along one path, it is an identity: true everywhere, whatever trajectory you are on.

Now add the nudge, so $\dot{\mathbf{v}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$. The same chain rule gives

$$
\frac{d(\text{element})}{dt} = \underbrace{\frac{\partial(\text{element})}{\partial\mathbf{r}}\cdot\mathbf{v} + \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\left(-\frac{\mu\mathbf{r}}{r^3}\right)}_{=\ 0\ \text{by the identity above}} + \ \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\mathbf{a}_p = \frac{\partial(\text{element})}{\partial\mathbf{v}}\cdot\mathbf{a}_p .
$$

The two-body part drops out completely. What is left is exact: *the rate of change of any orbital element depends only on $\mathbf{a}_p$, through how sensitive that element is to velocity.* No approximation yet — it holds for any $\mathbf{a}_p$, however large, however it depends on position, velocity or time.

What remains is bookkeeping: work out that sensitivity for each element, and express it in directions attached to the orbit instead of fixed axes in space.

## The radial–transverse–normal frame

At the spacecraft's current position, set up three **[[unit vectors that ride along with it|rtn-picture]]**:

$$
\hat{\mathbf{R}} = \hat{\mathbf{r}} = \frac{\mathbf{r}}{r}, \qquad \hat{\mathbf{W}} = \hat{\mathbf{h}} = \frac{\mathbf{r}\times\mathbf{v}}{h}, \qquad \hat{\mathbf{T}} = \hat{\mathbf{W}}\times\hat{\mathbf{R}} .
$$

- $\hat{\mathbf{R}}$, **radial**: straight out from Earth's center through the spacecraft.
- $\hat{\mathbf{W}}$, **normal**: at right angles to the orbit plane, along the angular momentum $\mathbf{h}$ (length $h$).
- $\hat{\mathbf{T}}$, **transverse**: in the orbit plane, at right angles to $\hat{\mathbf{R}}$, pointing roughly the way the spacecraft moves.

They form a right-handed set: $\hat{\mathbf{R}}\times\hat{\mathbf{T}}=\hat{\mathbf{W}}$, $\hat{\mathbf{T}}\times\hat{\mathbf{W}}=\hat{\mathbf{R}}$, $\hat{\mathbf{W}}\times\hat{\mathbf{R}}=\hat{\mathbf{T}}$.

Split any perturbing acceleration into these three directions:

$$
\mathbf{a}_p = R\hat{\mathbf{R}} + T\hat{\mathbf{T}} + N\hat{\mathbf{W}} .
$$

The plain letters $R$, $T$, $N$ are the sizes of the radial, transverse and normal pushes, in $\mathrm{km/s^2}$.

One fact makes everything below work. Since $\hat{\mathbf{W}}$ is built from $\mathbf{r}\times\mathbf{v}$, it is at right angles to $\mathbf{v}$. So the velocity has no normal part:

$$
\mathbf{v} = v_r\hat{\mathbf{R}} + v_t\hat{\mathbf{T}}, \qquad v_r = \frac{\mu}{h}e\sin\nu, \qquad v_t = \frac{h}{r},
$$

with $\nu$ ("nu") the true anomaly, as in the two-body module.

## How fast the size changes: da/dt

Use energy. The specific orbital energy is $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$ (here $\varepsilon$ means energy, not the smallness ratio of lesson 1).

**Differentiate the middle form.** The derivative of $v^2/2$ is $\mathbf{v}\cdot\dot{\mathbf{v}}$. The derivative of $-\mu/r$ is $+\mu\dot r/r^2$, and $\dot r = v_r$. So

$$
\dot\varepsilon = \mathbf{v}\cdot\left(-\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p\right) + \frac{\mu v_r}{r^2} .
$$

Since $\mathbf{v}\cdot\mathbf{r} = r v_r$, the gravity part is $-\mu v_r/r^2$, which cancels the last term exactly — as the general argument promised. What is left is the rate at which the nudge does work:

$$
\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}_p = v_rR + v_tT .
$$

**Differentiate the last form.** $\dot\varepsilon = \mu\dot a/(2a^2)$.

**Set them equal and solve for $\dot a$.** Substitute $v_r$ and $v_t$, and use $h = na^2\sqrt{1-e^2}$ with $n = \sqrt{\mu/a^3}$ the mean motion and $p = a(1-e^2)$ the semi-latus rectum:

$$
\frac{da}{dt} = \frac{2a^2}{\mu}(v_rR + v_tT) = \frac{2}{n\sqrt{1-e^2}}\left[e\sin\nu\,R + \frac{p}{r}T\right] .
$$

Only $R$ and $T$ appear. A push straight out of the orbit plane cannot change the orbit's size. That makes sense: $\mathbf{v}$ has no normal part, so a normal push does no work.

## How the plane tips: dh/dt

Differentiate the angular momentum $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ with the product rule:

$$
\dot{\mathbf{h}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times\left(-\frac{\mu\mathbf{r}}{r^3}\right) + \mathbf{r}\times\mathbf{a}_p .
$$

A vector crossed with itself, or with anything parallel to it, is zero. So the first two terms vanish, leaving

$$
\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p .
$$

This is a **[[torque|torque-lever]]** — a twist — per unit mass. Expand it with $\mathbf{r} = r\hat{\mathbf{R}}$, using $\hat{\mathbf{R}}\times\hat{\mathbf{R}}=\mathbf{0}$, $\hat{\mathbf{R}}\times\hat{\mathbf{T}}=\hat{\mathbf{W}}$ and $\hat{\mathbf{R}}\times\hat{\mathbf{W}}=-\hat{\mathbf{T}}$:

$$
\dot{\mathbf{h}} = rT\hat{\mathbf{W}} - rN\hat{\mathbf{T}} .
$$

Read the two pieces separately.

- $rT\hat{\mathbf{W}}$ points *along* $\mathbf{h}$. It changes only how much angular momentum there is. That is the transverse push doing work, tied to $a$ and $e$ through $h^2 = \mu a(1-e^2)$.
- $-rN\hat{\mathbf{T}}$ points *across* $\mathbf{h}$. It changes only $\mathbf{h}$'s direction. It tips the orbit plane without changing how much angular momentum there is.

This single fact organizes the rest of the lesson: **only the normal component of a perturbing acceleration can rotate the orbit plane.** Radial and transverse pushes move the spacecraft around within whatever plane it is already in.

## Tilt and node: di/dt and dΩ/dt

The orientation of a plane takes two angles: the inclination $i$ (how steeply it is tilted) and the right ascension of the ascending node $\Omega$ (which way the tilt faces). Both depend only on $N$:

$$
\frac{di}{dt} = \frac{r\cos u}{h}\,N, \qquad \frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}\,N .
$$

Here $u = \omega + \nu$ is the **[[argument of latitude|argument-of-latitude]]**: the angle from the ascending node to the spacecraft, measured in the orbit plane.

Picture what this says. A sideways push *at the node* ($u = 0$) gives the biggest $di/dt$ and zero $d\Omega/dt$: it tips the plane about the node line, like opening a hinged lid, without moving the hinge. A push a quarter-orbit later ($u = 90^\circ$) does the opposite: no change in tilt, but the node line slides around. That is why a plane-change burn is done at a node.

::: note Why it has to be true: deriving di/dt and dΩ/dt
**The orbit normal in terms of $i$ and $\Omega$.** $\hat{\mathbf{W}} = (\sin i\sin\Omega,\ -\sin i\cos\Omega,\ \cos i)$. From $\dot{\mathbf{h}}$, only the part across $\mathbf{h}$ turns the unit vector, so $\dot{\hat{\mathbf{W}}} = -(rN/h)\hat{\mathbf{T}}$.

**The node.** Let $\hat{\mathbf{n}} = (\cos\Omega,\sin\Omega,0)$ point to the ascending node. The node lies in both the equator and the orbit plane, so $\hat{\mathbf{W}}\cdot\hat{\mathbf{n}} = 0$ always. Differentiate:

$$
\dot{\hat{\mathbf{W}}}\cdot\hat{\mathbf{n}} + \hat{\mathbf{W}}\cdot\dot{\hat{\mathbf{n}}} = 0 .
$$

With $\dot{\hat{\mathbf{n}}} = \dot\Omega(-\sin\Omega,\cos\Omega,0)$, the second term is $\hat{\mathbf{W}}\cdot\dot{\hat{\mathbf{n}}} = -\dot\Omega\sin i$.

For the first term, write the position direction in the plane as $\hat{\mathbf{R}} = \cos u\,\hat{\mathbf{n}} + \sin u\,(\hat{\mathbf{W}}\times\hat{\mathbf{n}})$. Then $\hat{\mathbf{T}} = \hat{\mathbf{W}}\times\hat{\mathbf{R}} = \cos u\,(\hat{\mathbf{W}}\times\hat{\mathbf{n}}) - \sin u\,\hat{\mathbf{n}}$, using $\hat{\mathbf{W}}\times(\hat{\mathbf{W}}\times\hat{\mathbf{n}}) = -\hat{\mathbf{n}}$. So $\hat{\mathbf{T}}\cdot\hat{\mathbf{n}} = -\sin u$, and

$$
\dot{\hat{\mathbf{W}}}\cdot\hat{\mathbf{n}} = -\frac{rN}{h}(\hat{\mathbf{T}}\cdot\hat{\mathbf{n}}) = \frac{rN\sin u}{h} .
$$

Put both into the identity: $rN\sin u/h - \dot\Omega\sin i = 0$, which gives the $d\Omega/dt$ formula.

**The tilt.** The $z$ part of $\hat{\mathbf{W}}$ is $\cos i$, so $\dot{\hat{W}}_z = -\sin i\,\dot i$. From $\dot{\hat{\mathbf{W}}} = -(rN/h)\hat{\mathbf{T}}$, this is also $-(rN/h)\hat{T}_z$. Working out the cross product, $(\hat{\mathbf{W}}\times\hat{\mathbf{n}})_z = \sin i$, and $\hat n_z = 0$, so $\hat{T}_z = \cos u\sin i$. Then $-\sin i\,\dot i = -(rN/h)\cos u\sin i$. Divide by $-\sin i$ to get the $di/dt$ formula.
:::

## Shape and orientation in the plane: de/dt and dω/dt

The remaining two elements live inside the plane: how stretched the ellipse is ($e$), and where its closest point, periapsis, sits ($\omega$, measured from the node). Their rates are

$$
\frac{de}{dt} = \frac{\sqrt{1-e^2}}{na}\left[\sin\nu\,R + \left(\cos\nu + \frac{e+\cos\nu}{1+e\cos\nu}\right)T\right],
$$

$$
\frac{d\omega}{dt} = \frac{1}{eh}\Big[-p\cos\nu\,R + (p+r)\sin\nu\,T\Big] - \cos i\,\frac{d\Omega}{dt} .
$$

$de/dt$ has no $N$ at all: a push out of the plane cannot stretch the ellipse.

The last term of $d\omega/dt$ needs a word. $\omega$ is measured *from the ascending node*. If the node itself moves, $\omega$ changes on paper even if periapsis did not move within the plane — the way your "distance from the gas station" changes if someone moves the gas station. It is bookkeeping, not new physics, but it is easy to drop and hard to notice missing.

::: note Why it has to be true: deriving de/dt and dω/dt
Start from the eccentricity vector $\mathbf{e} = (\mathbf{v}\times\mathbf{h})/\mu - \hat{\mathbf{r}}$, which points to periapsis with length $e$. By the general argument, only $\mathbf{a}_p$ changes it:

$$
\mu\,\dot{\mathbf{e}} = \mathbf{a}_p\times\mathbf{h} + \mathbf{v}\times(\mathbf{r}\times\mathbf{a}_p) .
$$

**First term.** With $\mathbf{h} = h\hat{\mathbf{W}}$: $\mathbf{a}_p\times\mathbf{h} = hT\hat{\mathbf{R}} - hR\hat{\mathbf{T}}$.

**Second term.** With $\mathbf{r}\times\mathbf{a}_p = rT\hat{\mathbf{W}} - rN\hat{\mathbf{T}}$ and $\mathbf{v} = v_r\hat{\mathbf{R}} + v_t\hat{\mathbf{T}}$, it is $v_trT\hat{\mathbf{R}} - v_rrT\hat{\mathbf{T}} - v_rrN\hat{\mathbf{W}}$. Since $rv_t = h$:

$$
\mu\,\dot{\mathbf{e}} = 2hT\,\hat{\mathbf{R}} - (hR + rv_rT)\,\hat{\mathbf{T}} - rv_rN\,\hat{\mathbf{W}} .
$$

**Length.** Periapsis is at angle $\nu$ behind the spacecraft, so $\hat{\mathbf{e}} = \cos\nu\,\hat{\mathbf{R}} - \sin\nu\,\hat{\mathbf{T}}$. Dotting, and using $rv_r = \mu re\sin\nu/h$ and $h/\mu = \sqrt{1-e^2}/(na)$,

$$
\frac{de}{dt} = \frac{h}{\mu}\Big[\sin\nu\,R + \Big(2\cos\nu + \frac{r}{p}e\sin^2\nu\Big)T\Big].
$$

With $r/p = 1/(1+e\cos\nu)$, the $T$ bracket equals $(2\cos\nu + e\cos^2\nu + e)/(1+e\cos\nu)$, which is the same as $\cos\nu + (e+\cos\nu)/(1+e\cos\nu)$.

**Direction.** The in-plane turning rate of $\mathbf{e}$ is $\hat{\mathbf{f}}\cdot\dot{\mathbf{e}}/e$, with $\hat{\mathbf{f}} = \hat{\mathbf{W}}\times\hat{\mathbf{e}} = \sin\nu\,\hat{\mathbf{R}} + \cos\nu\,\hat{\mathbf{T}}$. That gives $(h/\mu e)[-\cos\nu\,R + (2 - re\cos\nu/p)\sin\nu\,T]$, and $2 - re\cos\nu/p = 1 + r/p = (p+r)/p$. Using $h/\mu = p/h$ turns it into the bracket in $d\omega/dt$. Finally, the node line itself turns within the plane at rate $\cos i\,\dot\Omega$, and $\omega$ is measured from it, so subtract that.
:::

::: key The Gauss variational equations
They give the time derivatives of the orbital elements directly in terms of the perturbing acceleration resolved into radial, transverse and normal components — so you can see which element each force actually moves.

With $\mathbf{a}_p = R\hat{\mathbf{R}} + T\hat{\mathbf{T}} + N\hat{\mathbf{W}}$, $p=a(1-e^2)$, $h=\sqrt{\mu p}$, $u=\omega+\nu$:
$$
\frac{da}{dt} = \frac{2}{n\sqrt{1-e^2}}\Big[e\sin\nu\,R + \frac{p}{r}T\Big], \qquad
\frac{de}{dt} = \frac{\sqrt{1-e^2}}{na}\Big[\sin\nu\,R + \Big(\cos\nu+\frac{e+\cos\nu}{1+e\cos\nu}\Big)T\Big],
$$
$$
\frac{di}{dt} = \frac{r\cos u}{h}N, \qquad \frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}N, \qquad
\frac{d\omega}{dt} = \frac{1}{eh}\big[-p\cos\nu\,R+(p+r)\sin\nu\,T\big] - \cos i\frac{d\Omega}{dt} .
$$
Only $N$ moves $i$ and $\Omega$. Only $R$ and $T$ move $a$ and $e$. Every rate is exact, for any $\mathbf{a}_p$, at every instant.
:::

::: example Isolating each equation with a pure R, T or N push
Take an orbit with $a = 8000\,\mathrm{km}$, $e = 0.3$, $i = 45^\circ$, $\Omega = 70^\circ$, $\omega = 200^\circ$, at the point where $\nu = 110^\circ$. So $u = 200^\circ + 110^\circ = 310^\circ$.

**The orbit's numbers.** $p = 8000(1 - 0.09) = 7280\,\mathrm{km}$. Then $1 + e\cos\nu = 1 + 0.3(-0.34202) = 0.89739$, so $r = 7280/0.89739 = 8112.379\,\mathrm{km}$. Also $h = \sqrt{\mu p} = 53\,868.46\,\mathrm{km^2/s}$ and $n = \sqrt{\mu/a^3} = 8.8234\times10^{-4}\,\mathrm{rad/s}$.

**A pure normal push**, $N = 10^{-6}\,\mathrm{km/s^2}$, $R = T = 0$. With $\cos310^\circ = 0.64279$ and $\sin310^\circ = -0.76604$:

$$
\frac{di}{dt} = \frac{8112.379\times0.64279}{53\,868.46}\times10^{-6} = 9.680\times10^{-8}\,\mathrm{rad/s},
$$

$$
\frac{d\Omega}{dt} = \frac{8112.379\times(-0.76604)}{53\,868.46\times0.70711}\times10^{-6} = -1.631\times10^{-7}\,\mathrm{rad/s}.
$$

$da/dt$ and $de/dt$ are exactly zero: their formulas contain no $N$. And $d\omega/dt = -\cos45^\circ\times(-1.631\times10^{-7}) = 1.153\times10^{-7}\,\mathrm{rad/s}$, entirely from the moving node.

**A pure transverse push**, $T = 10^{-6}\,\mathrm{km/s^2}$, $R = N = 0$. The pattern flips. For $a$, the front factor is $2/(n\sqrt{1-e^2}) = 2376.16\,\mathrm{s}$ and $p/r = 0.89739$:

$$
\frac{da}{dt} = 2376.16\times0.89739\times10^{-6} = 2.1324\times10^{-3}\,\mathrm{km/s}.
$$

For $e$, the front factor is $\sqrt{1-e^2}/(na) = 0.13514\,\mathrm{s/km}$ and the $T$ bracket is $-0.34202 + (0.3 - 0.34202)/0.89739 = -0.38884$:

$$
\frac{de}{dt} = 0.13514\times(-0.38884)\times10^{-6} = -5.255\times10^{-8}\,\mathrm{s^{-1}}.
$$

Both are plainly nonzero, while $di/dt$ and $d\Omega/dt$ are exactly zero.

**Checking the formulas themselves.** The same rates can be found with no formula at all, by **[[finite differences|finite-difference]]**: nudge the velocity a tiny bit along the push, recompute all the elements with the two-body recipes, and divide the change by the time. Done for this orbit, it matches every number above to eight or nine significant figures. Where the formulas say zero, the finite differences give only rounding noise, at the level of $10^{-14}$ or below.
:::

## Lagrange's form: the planetary equations

Long before Gauss's form was in wide use, **[[Lagrange|lagrange-history]]** wrote the element rates a different way. He assumed the perturbation comes from a potential. Call it the **disturbing function** $\mathcal{R}$ (a curly R), so that $\mathbf{a}_p = \nabla\mathcal{R}$. The geopotential of the last lesson, minus its point-mass part, is exactly such a function:

$$
\mathcal{R} = -\frac{\mu}{r}\sum_{n\ge2}J_n\left(\frac{R_E}{r}\right)^nP_n(\sin\phi) .
$$

Write $\mathcal{R}$ in terms of the elements, including the **mean anomaly** $M$ (the angle that grows steadily at rate $n$). Then the **Lagrange planetary equations** give each rate from a slope of $\mathcal{R}$:

$$
\frac{da}{dt} = \frac{2}{na}\frac{\partial\mathcal{R}}{\partial M}, \qquad
\frac{de}{dt} = \frac{1-e^2}{na^2e}\frac{\partial\mathcal{R}}{\partial M} - \frac{\sqrt{1-e^2}}{na^2e}\frac{\partial\mathcal{R}}{\partial\omega},
$$

$$
\frac{di}{dt} = \frac{1}{na^2\sqrt{1-e^2}\sin i}\left(\cos i\frac{\partial\mathcal{R}}{\partial\omega} - \frac{\partial\mathcal{R}}{\partial\Omega}\right), \qquad
\frac{d\Omega}{dt} = \frac{1}{na^2\sqrt{1-e^2}\sin i}\frac{\partial\mathcal{R}}{\partial i},
$$

$$
\frac{d\omega}{dt} = \frac{\sqrt{1-e^2}}{na^2e}\frac{\partial\mathcal{R}}{\partial e} - \frac{\cos i}{na^2\sqrt{1-e^2}\sin i}\frac{\partial\mathcal{R}}{\partial i}, \qquad
\frac{dM}{dt} = n - \frac{2}{na}\frac{\partial\mathcal{R}}{\partial a} - \frac{1-e^2}{na^2e}\frac{\partial\mathcal{R}}{\partial e} .
$$

These are elegant, and they are the traditional way to get the $J_2$ drift rates. Their power shows up after averaging: if the orbit-averaged $\mathcal{R}$ does not depend on some angle, the element paired with that slope cannot drift steadily.

Their limit is the assumption itself. The force must be **[[conservative|conservative]]** — derivable from a potential. Gravity of any kind qualifies. Atmospheric drag does not: it depends on velocity and always takes energy away, so no potential produces it. Gauss's form, built directly from $R$, $T$ and $N$, has no such limit. It works the same for $J_2$, third bodies, sunlight pressure and drag. That is why this module uses Gauss's form throughout, and why it is the form behind the propagators you will write.

::: example Why J2 swings the node but not the size
**Step 1: $J_2$'s normal push.** From the compact form in the last lesson, $\mathbf{a}_{J_2} = K\big[(5\sin^2\phi - 1)\hat{\mathbf{r}} - 2\sin\phi\,\hat{\mathbf{z}}\big]$ with $K = \tfrac32J_2\mu R_E^2/r^4$. Dot it with $\hat{\mathbf{W}}$. The $\hat{\mathbf{r}}$ part gives zero, since $\hat{\mathbf{r}}$ lies in the plane. The $\hat{\mathbf{z}}$ part gives $\hat{\mathbf{z}}\cdot\hat{\mathbf{W}} = \cos i$. On the orbit, $\sin\phi = \sin i\sin u$. So

$$
N = -2K\sin i\cos i\sin u = -K\sin2i\sin u .
$$

**Step 2: into the node equation.** Using $\sin2i/\sin i = 2\cos i$:

$$
\frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}N = -\frac{3J_2\mu R_E^2\cos i}{h\,r^3}\sin^2u .
$$

$\sin^2u$ is never negative, so for a prograde orbit ($\cos i > 0$) the node moves backward on every part of every orbit. It cannot average away.

**Step 3: average over a circular orbit.** Now $r = a$ and $h = \sqrt{\mu a}$ are constant, and $\sin^2u$ averages to $\tfrac12$. So the steady rate is

$$
\dot\Omega = -\frac{3}{2}\frac{J_2\mu R_E^2\cos i}{\sqrt{\mu a}\,a^3} = -\frac{3}{2}nJ_2\left(\frac{R_E}{a}\right)^2\cos i .
$$

**Step 4: numbers.** For $a = 6778.137\,\mathrm{km}$ and $i = 51.6^\circ$: $n = 1.13137\times10^{-3}\,\mathrm{rad/s}$, $(R_E/a)^2 = 0.88546$, $\cos i = 0.62115$. So

$$
\dot\Omega = -1.5\times1.13137\times10^{-3}\times1.082\,626\,68\times10^{-3}\times0.88546\times0.62115 = -1.0105\times10^{-6}\,\mathrm{rad/s},
$$

which is about $-5.00^\circ$ per day. The orbit plane swings west by five degrees every day.

**Step 5: why not $a$ or $e$?** Compare the tilt: $di/dt \propto \cos u\sin u = \tfrac12\sin2u$, which is positive for half the orbit and negative for the other half, and averages to zero. For $a$ and $e$, use Lagrange. Averaged over an orbit, the $J_2$ disturbing function depends only on $a$, $e$ and $i$ — not on $M$, $\omega$ or $\Omega$. Every slope with respect to $M$, $\omega$ or $\Omega$ is zero, so $a$, $e$ and $i$ have no steady drift. They wobble within each orbit and come back.

**Check the answer by the Lagrange route.** For a circular orbit, $P_2 = \tfrac12(3\sin^2i\sin^2u - 1)$ averages to $\tfrac12(\tfrac32\sin^2i - 1)$, so $\bar{\mathcal{R}} = \tfrac14n^2J_2R_E^2(2 - 3\sin^2i)$. Its slope is $\partial\bar{\mathcal{R}}/\partial i = -\tfrac32n^2J_2R_E^2\sin i\cos i$. Dividing by $na^2\sin i$ gives $-\tfrac32nJ_2(R_E/a)^2\cos i$ — the same formula as Step 3.

The next lesson does this averaging for elliptical orbits and adds the rotation of periapsis.
:::

## Check yourself

::: check
Without writing a formula, explain why a perturbing acceleration pointing exactly along the spacecraft's radius vector cannot change the orbit's inclination.
:::

::: answer
A radial push is parallel to $\mathbf{r}$, so $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p = \mathbf{0}$. A push aimed straight through Earth's center has no lever arm and makes no twist, so it cannot change $\mathbf{h}$ at all — neither its size nor its direction.

In the Gauss equations, $di/dt$ and $d\Omega/dt$ depend only on $N$, and a purely radial push has $N = 0$. So both rates are exactly zero.

A radial push can still change $a$ and $e$, through the $R$ terms in their equations. It cannot touch the plane.
:::

::: check
A spacecraft gets a short push in the normal ($\hat{\mathbf{W}}$) direction exactly at $u = 0$, the ascending node. What happens to $di/dt$ and $d\Omega/dt$ at that instant, and why does it make physical sense?
:::

::: answer
$di/dt = (r\cos u/h)N$ is at its largest at $u = 0$, where $\cos u = 1$. $d\Omega/dt = (r\sin u/(h\sin i))N$ is zero there, because $\sin 0 = 0$.

Physically, a push at the node — where the orbit crosses the equatorial plane — tips the plane about the node line itself, like lifting a lid on its hinge. That changes the tilt and leaves the hinge where it was. A push a quarter-orbit later, at $u = 90^\circ$, does the opposite: it slides the node around with no immediate change in tilt.
:::

::: check
Why is Gauss's form of the variational equations, not Lagrange's disturbing-function form, the one used for atmospheric drag?
:::

::: answer
Lagrange's form needs the perturbing acceleration to be conservative — the gradient of a disturbing potential $\mathcal{R}$ — because every rate is a slope of $\mathcal{R}$.

Drag depends on velocity, through $v_{\text{rel}}^2$, and always opposes the motion, so it steadily takes energy away. No potential can produce a force like that.

Gauss's form is built directly from the $R$, $T$, $N$ components, with no potential needed. It applies unchanged to drag, to $J_2$, or to any other force.
:::

::: check
Using $da/dt = \big[2/(n\sqrt{1-e^2})\big]\big[e\sin\nu\,R + (p/r)T\big]$, explain why a transverse push at periapsis changes $a$ more, per unit of velocity change, than the same push at apoapsis.
:::

::: answer
The transverse coefficient is $p/r$, which is largest where $r$ is smallest — at periapsis. In the example orbit with $e = 0.3$, it is $1.3$ at periapsis and $0.7$ at apoapsis, nearly twice as big.

The energy view says the same thing. The push adds energy at the rate $\mathbf{v}\cdot\mathbf{a}_p = v_tT$, and $v_t = h/r$ is largest at periapsis, where the spacecraft moves fastest. The same push does more work there, so it changes the energy, and therefore $a$, the most. This is the **[[same fact as the maneuvers rule|periapsis-burn]]** "burn at periapsis to raise apoapsis efficiently".
:::

::: check
A perturbation is measured to give $de/dt \ne 0$ but $di/dt = d\Omega/dt = 0$ at every point of the orbit. What can you conclude about its $R$, $T$ and $N$ components?
:::

::: answer
$di/dt$ and $d\Omega/dt$ depend only on $N$. If both are zero everywhere, then $N = 0$ everywhere: the perturbation has no out-of-plane part and lies entirely in the orbit plane.

$de/dt$ depends only on $R$ and $T$. Since it is not zero, at least one of $R$ or $T$ is nonzero.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $d(\text{element})/dt = (\partial\,\text{element}/\partial\mathbf{v})\cdot\mathbf{a}_p$ | Exact: the two-body part of the chain rule vanishes |
| $\hat{\mathbf{R}},\hat{\mathbf{T}},\hat{\mathbf{W}}$ | Radial, transverse, normal unit vectors; $\mathbf{a}_p = R\hat{\mathbf{R}}+T\hat{\mathbf{T}}+N\hat{\mathbf{W}}$ |
| $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}_p = v_rR + v_tT$ | Rate of work; why $N$ cannot change $a$ |
| $\dot{\mathbf{h}} = \mathbf{r}\times\mathbf{a}_p = rT\hat{\mathbf{W}} - rN\hat{\mathbf{T}}$ | Only $N$ tips the orbit plane |
| $da/dt$, $de/dt$ | Depend on $R$ and $T$ only |
| $di/dt = (r\cos u/h)N$, $d\Omega/dt = (r\sin u/(h\sin i))N$ | Depend on $N$ only; $u=\omega+\nu$ |
| $d\omega/dt$ | Depends on $R$ and $T$, plus $-\cos i\,d\Omega/dt$ from the moving node |
| Lagrange planetary equations | Rates as slopes of a disturbing function $\mathcal{R}$; conservative forces only |
| Gauss's form vs Lagrange's form | Gauss ($R,T,N$) works for any force, including drag |

Next lesson: you will average $J_2$'s pushes over a full elliptical orbit with these equations, producing the nodal regression and apsidal rotation rates that the rest of this module is built around.

::: context osculating-kiss The kissing orbit
"Osculating" comes from the Latin *osculari*, "to kiss". The osculating ellipse touches the real, nudged path at one point and matches its direction and speed there — the way two curves "kiss" instead of crossing. A moment later the real path has bent a little differently, and a slightly different ellipse kisses it.

Lesson 6 of this module takes this further. Osculating elements wobble within every orbit, while **mean elements** smooth the wobble out, and mixing the two up is a classic, expensive mistake.
:::

::: context chain-rule The chain rule, one more time
If a quantity depends on things that are changing, its rate of change is the sum of "how sensitive it is to each thing" times "how fast that thing changes".

Here an element depends on the six numbers in $\mathbf{r}$ and $\mathbf{v}$. The dot products in the formula are that sum written compactly: $\partial(\text{element})/\partial\mathbf{r}\cdot\mathbf{v}$ is three terms, one per position component, each "sensitivity times rate".

A familiar case: the cost of a road trip depends on distance and fuel price. If both change, the cost changes by (sensitivity to distance × change in distance) plus (sensitivity to price × change in price).
:::

::: context rtn-picture The frame that rides along
Looking down on the orbit plane: $\hat{\mathbf{R}}$ points straight out from Earth through the spacecraft, $\hat{\mathbf{T}}$ points along the orbit at right angles to it, and $\hat{\mathbf{W}}$ points straight up out of the page. On a circular orbit the velocity lies exactly along $\hat{\mathbf{T}}$. On an elliptical one it also has a small $\hat{\mathbf{R}}$ part, except at periapsis and apoapsis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="110" r="80" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="120" cy="110" r="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="120" y1="110" x2="192.5" y2="76.19" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <line x1="192.5" y1="76.19" x2="235.1" y2="56.33" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="242.35,52.95 232.2,51.3 236.4,60.3" fill="#b4232c"/>
  <line x1="192.5" y1="76.19" x2="172.6" y2="33.6" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="169.26,26.34 167.9,36.5 176.9,32.3" fill="#1d6fd1"/>
  <circle cx="192.5" cy="76.19" r="7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="192.5" cy="76.19" r="2" fill="#1f2a44"/>
  <text x="250" y="52" font-size="13" fill="#b4232c">R (radial)</text>
  <text x="162" y="30" font-size="13" fill="#1d6fd1" text-anchor="end">T (transverse)</text>
  <text x="206" y="98" font-size="13" fill="#1f2a44">W (out of page)</text>
  <text x="206" y="172" font-size="11" fill="#6c7a93">orbit (counterclockwise)</text>
</svg>
```

Different books use different letters for the same frame: RSW, RIC (radial, in-track, cross-track), RTN, or LVLH with the axes reordered.
:::

::: context torque-lever Why a push through the center cannot twist
Push a door right at its edge, at right angles, and it swings easily. Push the same edge straight toward the hinges and nothing turns, however hard you push. The twist, or **torque**, is the lever arm times the part of the force across it: $\mathbf{r}\times\mathbf{F}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="64" width="220" height="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="40" cy="70" r="6" fill="#1f2a44"/>
  <text x="40" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">hinge</text>
  <line x1="250" y1="120" x2="250" y2="88" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="250,79 245,90 255,90" fill="#1d6fd1"/>
  <text x="262" y="112" font-size="12" fill="#1d6fd1">turns the door</text>
  <line x1="340" y1="70" x2="282" y2="70" stroke="#b4232c" stroke-width="3"/>
  <polygon points="272,70 283,65 283,75" fill="#b4232c"/>
  <text x="300" y="56" font-size="12" fill="#b4232c" text-anchor="middle">no turn</text>
</svg>
```

For an orbit, Earth's center is the hinge and $\mathbf{r}$ is the door. A push along $\mathbf{r}$ gives no twist, so the angular momentum stays exactly as it was.
:::

::: context argument-of-latitude Three angles in the orbit plane
All three are measured in the orbit plane, looking down on it. The argument of periapsis $\omega$ runs from the ascending node to periapsis. The true anomaly $\nu$ runs from periapsis to the spacecraft. Their sum, the argument of latitude $u = \omega + \nu$, runs straight from the node to the spacecraft. Here $\omega = 60^\circ$ and $\nu = 70^\circ$, so $u = 130^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="125" x2="270" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="125" x2="210" y2="21.08" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="125" x2="72.87" y2="33.07" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="150" cy="125" r="4" fill="#1f2a44"/>
  <circle cx="72.87" cy="33.07" r="5" fill="#b4232c"/>
  <path d="M185.00,125.00 A35,35 0 0,0 167.50,94.69" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M175.00,81.70 A50,50 0 0,0 117.86,86.70" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M230.00,125.00 A80,80 0 0,0 98.58,63.72" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="189" y="112" font-size="13" fill="#1d6fd1">ω</text>
  <text x="140" y="72" font-size="13" fill="#b4232c">ν</text>
  <text x="130" y="36" font-size="13" fill="#6c7a93">u</text>
  <text x="274" y="129" font-size="11" fill="#1f2a44">node</text>
  <text x="214" y="22" font-size="11" fill="#1f2a44">periapsis</text>
  <text x="14" y="18" font-size="11" fill="#b4232c">spacecraft</text>
</svg>
```

The node-based angle $u$ is handy because it stays well defined even for a circular orbit, where periapsis — and so $\omega$ and $\nu$ separately — has no clear meaning.
:::

::: context finite-difference Testing an equation without trusting it
A **finite difference** estimates a rate by trying it: change the input by a tiny amount, see how much the output changes, and divide. It needs no formula, only a way to compute the output.

That makes it the standard test for hand-derived equations. The Gauss equations are long, and one wrong sign could hide for years. Comparing them against finite differences of the plain two-body element recipes, at a few random orbits, catches that kind of mistake in seconds. Engineers do exactly this before trusting new flight software.
:::

::: context lagrange-history Lagrange and the wandering planets
Joseph-Louis Lagrange worked out his method, often called "variation of constants", around 1808–1810 to study how the planets slowly disturb one another's orbits. His idea was the one this lesson uses: keep the ellipse, but let its constants drift.

For the solar system that was a perfect fit, because the planets' pulls on one another are pure gravity — always derivable from a potential. Nobody then needed a formula for air drag on a satellite. When that need arrived in the space age, the form built from $R$, $T$ and $N$, which is attributed to Gauss, became the workhorse.
:::

::: context conservative What "conservative" means
A force is **conservative** when the work it does depends only on where you start and where you end, not on the path between. Gravity is like this. A ball rolled up a hill and back down gets all its speed back, because gravity stores the energy and returns it. That is what lets you describe the force with a potential.

Friction and drag are not like this. Slide a box around a room and back to where it started, and you have still lost energy to heat. Drag on a satellite turns orbital energy into heated air, and it never gives it back — which is why orbits decay.
:::

::: context periapsis-burn The same rule, seen from the maneuvers module
The maneuvers module told you to burn at periapsis to raise apoapsis efficiently. The Gauss equation for $a$ is the same rule written as a rate. The deeper reason is sometimes called the **Oberth effect**, after the rocket pioneer Hermann Oberth: a given change in speed adds the most energy where you are already moving fastest. For an orbit, that is the lowest point.
:::
