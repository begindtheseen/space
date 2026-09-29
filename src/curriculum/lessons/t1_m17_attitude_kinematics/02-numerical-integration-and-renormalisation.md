---
id: l02-numerical-integration-and-renormalisation
title: Integrating attitude numerically, and re-normalization
minutes: 26
covers:
  - numerical integration of attitude with re-normalization
---

Imagine walking around a circular running track in the dark, taking one straight stride at a time. Each stride points along the track where you stand, but the track curves away beneath you. So every stride lands you a little outside the line. After a hundred strides you are well off the track, even though every stride pointed the right way.

A computer stepping an attitude forward in time has exactly this problem. The equations of the previous lesson are exact, and each keeps its own rule exactly: the DCM stays a rotation, the quaternion stays at length one. A **numerical integrator** — a recipe that steps a differential equation forward in small time steps — keeps neither. It follows a polynomial approximation of the true motion, and polynomials do not know about circles or spheres.

So every attitude program ever flown has a standing chore. Each cycle, the integrator steps the attitude forward. The state drifts a little off its rule. Something has to push it back. That push is **re-normalization**: dividing a quaternion by its length, or straightening up a DCM so it is a true rotation again. It costs a few microseconds per cycle on a flight processor.

This lesson covers what the drift looks like, how big it gets at real rates and step sizes, how to fix it cheaply — and the one thing re-normalization does *not* do, which is make the answer more accurate. Get it wrong and you can spend a week chasing a 0.06 per cent scale error that everyone assumes is a sensor problem.

## Where the error goes

Write the attitude state as a vector $\mathbf{x}$ that must live on a **[[manifold|manifold]]** $\mathcal{M}$ — the curved surface of allowed values. For a quaternion that is the unit sphere $S^3$ (all 4-vectors of length one). For a DCM it is the set of rotation matrices. The exact solution keeps $\mathbf{x}$ on $\mathcal{M}$.

One numerical step lands at $\mathbf{x}_{k+1}$ with a small error, and that error has two parts. Think of a train on a circular track. It can be early or late *along* the track, or it can come *off* the track.

- The **tangent** part runs along $\mathcal{M}$. It is a wrong attitude — the train in the wrong place on the track. This is ordinary **truncation error**, the price of taking finite steps. For a method of **order** $p$ it shrinks like $\Delta t^{\,p}$ over a fixed time, so the only cures are a smaller step or a better method. Re-normalization cannot touch it.
- The **normal** part points straight off $\mathcal{M}$. It is not an attitude at all — the train off the rails. This is the **constraint violation**. You can see it for free by computing $\lVert\mathbf{q}\rVert$ or $\mathbf{C}^\top\mathbf{C}$, and you can remove it at any time by pushing the state back onto $\mathcal{M}$.

That split is the whole picture. The constraint violation is a *symptom* you can watch and a *defect* you can repair. Repairing it tells you nothing about the error you care about.

## How large is the drift, really

For the quaternion there is an exact answer when $\boldsymbol{\omega}$ is constant. Then $\dot{\mathbf{q}} = \mathbf{A}\mathbf{q}$, where $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$ is a constant skew matrix.

Any explicit **[[Runge–Kutta|runge-kutta]]** method of order $p$ — the family of step-forward recipes that includes forward Euler and RK4 — then does the same thing every step. It multiplies $\mathbf{q}$ by a fixed polynomial in $\mathbf{A}\Delta t$:

$$
\mathbf{q}_{k+1} = P(\mathbf{A}\Delta t)\,\mathbf{q}_k, \qquad P(z) = \sum_{j=0}^{p}\frac{z^j}{j!}\ \ \text{for the classical methods}.
$$

That is the first $p + 1$ terms of the series for $e^z$, the exact answer. The matrix $\mathbf{A}$ has **[[eigenvalues|eigen-spin]]** $\pm i\lambda$, with $\lambda = \lVert\boldsymbol{\omega}\rVert/2$. So each step multiplies the norm by $\lvert P(i\theta)\rvert$, where

$$
\theta = \lambda\Delta t = \frac{\lVert\boldsymbol{\omega}\rVert\,\Delta t}{2}
$$

is the **step parameter** — half the angle turned in one step. Working out the two most common cases:

$$
\lvert P_{\text{Euler}}(i\theta)\rvert = \sqrt{1 + \theta^2} \approx 1 + \tfrac{1}{2}\theta^2,
\qquad
\lvert P_{\text{RK4}}(i\theta)\rvert \approx 1 - \frac{\theta^6}{144}.
$$

The Euler line is the running track in numbers. A straight stride of length $\theta$ from a point on a circle of radius $1$ lands at distance $\sqrt{1 + \theta^2}$ from the center, by Pythagoras — **[[always outside|tangent-step]]**. The RK4 line comes from the same kind of calculation, carried further, which the next lesson does in full.

Two facts to carry away.

- **Forward Euler grows the norm**, by an amount second order in the step. This is the runaway growth everyone has seen.
- **RK4 shrinks the norm**, by an amount sixth order per step, which is fifth order over a fixed time.

The sign helps with diagnosis. A norm creeping *upward* says something in your integration is worse than second-order accurate — usually a first-order scheme hiding somewhere, not round-off.

::: example Ten minutes of a spinning upper stage at 100 Hz
A solid-motor upper stage spins at 60 rpm about its body $z$ axis during a coast, with a small wobble on the other axes. So $\boldsymbol{\omega} = (0.4,\, -0.3,\, 6.2832)\,\mathrm{rad/s}$, and its size is $\lVert\boldsymbol{\omega}\rVert = 6.303\,\mathrm{rad/s} = 361^\circ/\mathrm{s}$. The **inertial measurement unit** (the box of gyros and accelerometers) steps the quaternion at $100\,\mathrm{Hz}$, so $\Delta t = 0.01\,\mathrm{s}$ and $\theta = 6.303 \times 0.01 / 2 = 0.0315$. Ten minutes of coast is $600 / 0.01 = 60\,000$ steps.

```python
import numpy as np

def omega_matrix(w):
    wx, wy, wz = w
    return np.array([[0.0, -wx, -wy, -wz],
                     [wx, 0.0, wz, -wy],
                     [wy, -wz, 0.0, wx],
                     [wz, wy, -wx, 0.0]])

def propagate(w, dt, n, scheme, renorm):
    """Integrate qdot = 0.5 Omega(w) q from the identity, constant w."""
    A = 0.5 * omega_matrix(w)
    q = np.array([1.0, 0.0, 0.0, 0.0])
    for _ in range(n):
        if scheme == "euler":
            q = q + dt * (A @ q)
        else:
            k1 = A @ q
            k2 = A @ (q + 0.5 * dt * k1)
            k3 = A @ (q + 0.5 * dt * k2)
            k4 = A @ (q + dt * k3)
            q = q + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)
        if renorm:
            q = q / np.linalg.norm(q)
    return q

w = np.array([0.4, -0.3, 6.2832])              # 60 rpm spin plus a transverse rate
for scheme in ("euler", "rk4"):
    for renorm in (False, True):
        q = propagate(w, 0.01, 60000, scheme, renorm)   # 600 s at 100 Hz
        print(f"{scheme:5s} renorm={str(renorm):5s}  norm-1 = {np.linalg.norm(q) - 1: .3e}")
# euler renorm=False  norm-1 =  8.590e+12
# euler renorm=True   norm-1 = -1.110e-16
# rk4   renorm=False  norm-1 = -4.082e-07
# rk4   renorm=True   norm-1 =  0.000e+00
```

Check the Euler number against the formula. Each step multiplies the norm by $1 + \tfrac{1}{2}\theta^2 = 1 + 4.97\times 10^{-4}$. Over 60 000 steps that compounds to $(1 + 4.97\times 10^{-4})^{60000} = e^{29.8} = 8.6\times 10^{12}$. The quaternion has not drifted off the sphere; it has left the building.

For RK4, each step shrinks the norm by $\theta^6/144 = 6.80\times 10^{-12}$. Over 60 000 steps that is $60\,000 \times 6.80\times 10^{-12} = 4.08\times 10^{-7}$ — matching the printed $-4.082\times 10^{-7}$ to three figures.

Now the part that matters. For constant $\boldsymbol{\omega}$, the exact answer is a steady turn of $\lVert\boldsymbol{\omega}\rVert t$ about the fixed axis $\boldsymbol{\omega}/\lVert\boldsymbol{\omega}\rVert$. Compare each result with it and measure the angle of the leftover error rotation. RK4 is off by $1.78\times 10^{-3}$ degrees — $6.4$ arcseconds (an **arcsecond** is $1/3600$ of a degree) after ten minutes and 600 turns. Forward Euler is off by $71.7$ degrees. And both numbers are **identical whether or not the code re-normalized** — to every digit shown, whether it re-normalized every step, every 1000 steps, or never.
:::

That is not luck. Here is why.

## Re-normalization changes length, not direction

Think of a rubber arrow. Stretching it makes it longer but leaves it pointing the same way. For a quaternion, the *direction* is the attitude. The length is only bookkeeping.

The kinematic equation has a special property. Its right-hand side, $\tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$, depends on the state only through that one factor of $\mathbf{q}$, and $\boldsymbol{\omega}$ comes from the gyros or the dynamics, not from $\mathbf{q}$. Mathematicians call this **linear and homogeneous**: double $\mathbf{q}$ and the rate doubles too. So every stage of a Runge–Kutta step is linear in $\mathbf{q}_k$, and the whole step is one matrix acting on $\mathbf{q}_k$.

Scale $\mathbf{q}_k$ by any number $c$ and $\mathbf{q}_{k+1}$ comes out scaled by exactly the same $c$. Re-normalization is a rescaling. So it can be done at any step, or never, and the *direction* of the quaternion — the attitude — comes out the same.

::: key What re-normalization does and does not do
Dividing by the norm removes the constraint violation and nothing else. For the linear quaternion kinematic equation it does not change the attitude by one bit, at any cadence. It is there to stop the state diverging in magnitude, to keep the derived DCM a true rotation, and to give you a cheap health monitor — not to improve accuracy. Accuracy comes from the order of the method and the size of the step.
:::

Why bother, then? Three concrete reasons from flight software.

1. **The DCM built from $\mathbf{q}$ carries a scale factor of $\lVert\mathbf{q}\rVert^2$.** The rotation matrix is made of *products* of quaternion components, so a norm of $1.0003$ makes every transformed vector $0.06\,\%$ too long, and the matrix is no longer orthonormal. A star-tracker residual, a wheel-torque command, a thrust direction — all come out scaled. Downstream estimators read that as a real signal.
2. **The size really does run away.** The Euler run above reached $10^{13}$. A **[[single-precision|single-precision]]** number would have overflowed. Even a good scheme, left alone for a long mission, wanders far enough to matter.
3. **It is the cheapest health check you own.** One subtraction per cycle says whether the integration is behaving. A norm that suddenly jumps means corrupted gyro data, a missed cycle or a bad step.

::: key The cost of a drifted norm, and the two fixes
A quaternion whose norm has drifted to $1.0003$ builds a DCM scaled by $\lVert\mathbf{q}\rVert^2 \approx 1.0006$: every rotated vector is $0.06\,\%$ too long, and the matrix is no longer orthonormal. Fix it by re-normalizing every step (cheap, standard), or by using a norm-preserving update $\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$, which the next lesson builds.
:::

::: note Why it has to be true
The DCM (inertial to body) built from a scalar-first quaternion is

$$
\mathbf{C}(\mathbf{q}) = (q_0^2 - \mathbf{q}_v^\top\mathbf{q}_v)\,\mathbf{I}_3 + 2\,\mathbf{q}_v\mathbf{q}_v^\top - 2\,q_0\,[\mathbf{q}_v\times].
$$

Every term is a product of two quaternion components. Replace $\mathbf{q}$ by $s\,\mathbf{q}$ and every term picks up $s^2$, so $\mathbf{C}(s\mathbf{q}) = s^2\,\mathbf{C}(\mathbf{q})$. A quaternion of length $s = 1.0003$ is $s$ times a unit quaternion, so the matrix you get is $s^2 = 1.00060009$ times a true rotation. Then $\mathbf{C}^\top\mathbf{C} = s^4\,\mathbf{I} = 1.0012\,\mathbf{I}$ instead of $\mathbf{I}$, and $\det\mathbf{C} = s^6 = 1.0018$ instead of $1$.
:::

::: example What one cheap Newton step buys
Exact re-normalization needs a square root and four divisions. On processors where that hurts, the standard trick is one **[[Newton step|newton-step]]** on the constraint. With $\varepsilon = \mathbf{q}^\top\mathbf{q} - 1$ (read "epsilon", the amount the squared norm is off),

$$
\mathbf{q} \leftarrow \tfrac{1}{2}\,(3 - \mathbf{q}^\top\mathbf{q})\,\mathbf{q}.
$$

That is four multiplies and three adds for $\mathbf{q}^\top\mathbf{q}$, then a scale — no square root, no division.

How good is it? Before the step the norm is $\sqrt{1 + \varepsilon}$. The step multiplies by $\tfrac{1}{2}(3 - (1 + \varepsilon)) = 1 - \varepsilon/2$. So the new norm is

$$
\sqrt{1 + \varepsilon}\,\left(1 - \tfrac{\varepsilon}{2}\right) = 1 - \tfrac{3}{8}\varepsilon^2 + \cdots
$$

The first-order error canceled. What is left is **second order**: square a small number and it gets much smaller.

Try it. With $\varepsilon = 10^{-3}$ — a huge violation — the corrected norm is off by $\tfrac{3}{8}(10^{-3})^2 = 3.75\times 10^{-7}$, exactly as measured. With $\varepsilon = 10^{-6}$ it is off by $3.75\times 10^{-13}$. With $\varepsilon = 10^{-9}$ the leftover is smaller than double precision can see, and the result is unit to the last bit.

For the RK4 run above, the norm was $1 - 4.08\times 10^{-7}$, so $\varepsilon \approx 2 \times 4.08\times 10^{-7} = 8.2\times 10^{-7}$ (squaring doubles a small relative error). One Newton step leaves $\tfrac{3}{8}(8.2\times 10^{-7})^2 = 2.5\times 10^{-13}$ — over three million times smaller than the violation it was handed.

So when the violation is already small, one Newton step cannot be told apart from an exact normalization.
:::

## Orthonormalising a DCM

A DCM has six constraints, so the repair takes more work. Three options, from cheapest to best.

**Gram–Schmidt.** Make row 1 unit length. Subtract from row 2 the part that leans along row 1, then make it unit length. Take the cross product of the two for row 3. Cheap and always available — but it trusts row 1 completely and pushes all the error onto rows 2 and 3, rather than sharing it.

**One Newton step, the symmetric version.** With $\mathbf{C}$ nearly orthonormal,

$$
\mathbf{C} \leftarrow \tfrac{3}{2}\mathbf{C} - \tfrac{1}{2}\,\mathbf{C}\,\mathbf{C}^\top\mathbf{C}.
$$

This is the matrix version of the quaternion Newton step, and it shares the error evenly among the rows. It converges **quadratically**: each pass roughly squares the error. Take the unrepaired matrix from the next example, whose defect $\max\lvert\mathbf{C}\mathbf{C}^\top - \mathbf{I}\rvert$ is $5.21\times 10^{-5}$. One pass brings it to $2.04\times 10^{-9}$. A second brings it to $2.2\times 10^{-16}$, the limit of double precision.

**Polar decomposition.** $\mathbf{C} \leftarrow \mathbf{C}(\mathbf{C}^\top\mathbf{C})^{-1/2}$, computed from a **singular value decomposition** (SVD, a standard factorization that splits any matrix into rotate–stretch–rotate). It gives the closest true rotation to $\mathbf{C}$. It is the right answer, and far too expensive for a 400 Hz loop. Keep it for ground tools and for rescuing a badly corrupted matrix.

::: example DCM against quaternion at the same step size
Run the same spinning stage for the same 600 s, now stepping $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$ with RK4 at $\Delta t = 0.01\,\mathrm{s}$.

**Without repair.** The defect $\max\lvert\mathbf{C}\mathbf{C}^\top - \mathbf{I}\rvert$ reaches $5.21\times 10^{-5}$, and $\det\mathbf{C} - 1 = -5.22\times 10^{-5}$. The **singular values** — how much the matrix stretches along its three main directions — are $1$, $0.999974$ and $0.999974$. So the matrix now shrinks vectors by up to 26 parts per million in two directions as well as rotating them.

**With the symmetric Newton step every cycle.** The defect sits at $2.2\times 10^{-16}$, machine precision, for the price of two $3\times 3$ matrix products.

**The attitude error**, though, is $2.85\times 10^{-2}$ degrees either way — sixteen times worse than the quaternion's $1.78\times 10^{-3}$ degrees at the same step. The reason is in the eigenvalues. The DCM equation has eigenvalues $\pm i\lVert\boldsymbol{\omega}\rVert$ and $0$. The quaternion equation has $\pm i\lVert\boldsymbol{\omega}\rVert/2$. Because of the half-angle, the quaternion swings at half the frequency, so its $\theta$ is half as big. A fourth-order method's error goes like $\theta^4$, so halving $\theta$ makes it $2^4 = 16$ times smaller. Add the cost — four states against nine, and a $4\times 4$ by $4\times 1$ product against a $3\times 3$ by $3\times 3$ — and the case for propagating the quaternion is not close.

**Confirming the order.** Halve the step again and again. The quaternion RK4 attitude error goes $0.4534^\circ \to 0.02846^\circ \to 1.781\times 10^{-3}\,^\circ \to 1.113\times 10^{-4}\,^\circ$ for $\Delta t = 0.04, 0.02, 0.01, 0.005\,\mathrm{s}$. The ratios are $15.93$, $15.98$ and $16.00$ — the $2^4$ of a **[[fourth-order method|order-plot]]**. The norm drift over the same steps goes $-4.171\times 10^{-4} \to -1.306\times 10^{-5} \to -4.082\times 10^{-7}$, ratios of about 32, or $2^5$ — the fifth-order behavior the polynomial predicted.
:::

## MRPs: switching, not normalizing

Modified Rodrigues parameters have no constraint to break, so there is nothing to re-normalize. What they need instead is the shadow-set switch. Whenever $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} > 1$, replace

$$
\boldsymbol{\sigma} \leftarrow -\frac{\boldsymbol{\sigma}}{\boldsymbol{\sigma}^\top\boldsymbol{\sigma}} .
$$

This is not optional. Without it the state runs to infinity at the first full turn.

Propagate the spinning stage with MRPs at $\Delta t = 0.001\,\mathrm{s}$ for 3 s. That is $6.303 \times 3 = 18.91\,\mathrm{rad}$, about three full turns. The switched version makes exactly three switches, one per turn as it passes $\Phi = 180^\circ$. It ends at $\lVert\boldsymbol{\sigma}\rVert = 0.01491$. Check: the leftover rotation after three turns is $18.909 - 6\pi = 0.0596\,\mathrm{rad}$, and $\tan(0.0596/4) = 0.01491$ — a match to four figures. The unswitched version blows up to infinity, and then to not-a-number, before the run ends.

Notice that the switch *is* a jump in the state, unlike a re-normalization. Anything that reads the state — a filter's uncertainty matrix, a numerical derivative, a controller with memory — has to be told it happened.

::: warning Do not fix the constraint inside the derivative function
Re-normalize, or switch shadow sets, between complete integration steps, on the state. Doing it inside the routine that computes the derivative, or between the stages of a Runge–Kutta step, secretly changes the equation into a different, jumpy one. An **[[adaptive step controller|adaptive-step]]** then sees a jump in its error estimate and either refuses to grow the step or thrashes. It also breaks the conditions the method was built on, so your fourth-order integrator quietly stops being fourth order.
:::

::: warning A unit quaternion is not a correct quaternion
The most expensive attitude bug is the one where the norm is a perfect $1.000000000$ and the vehicle points somewhere else. Re-normalization guarantees the first and says nothing about the second. Check accuracy separately: run a constant-rate case against the exact answer $\exp(-[\boldsymbol{\omega}\times]t)$, halve the step and confirm the error falls by the factor your method promises, and — once the dynamics are attached — check the conserved quantities.
:::

::: note What flight software actually does
A common setup: integrate the quaternion with RK4 or a fourth-order predictor–corrector at the gyro rate, re-normalize once per cycle with the Newton step, and flag the cycle if $\lvert\mathbf{q}^\top\mathbf{q} - 1\rvert$ passes a threshold several orders of magnitude above the expected drift — say $10^{-6}$ when RK4 at that rate produces $10^{-11}$ per cycle. The threshold catches corruption, not drift. Strapdown navigators for fast-spinning vehicles go further and use the exponential-map update of the next lesson, which has no drift to remove at all.
:::

## Check yourself

::: check
A quaternion propagator runs at 200 Hz on a vehicle whose peak rate is $30^\circ/\mathrm{s}$. Estimate the per-step norm drift for forward Euler and for RK4, and say how long each takes to reach a norm error of $10^{-6}$.
:::

::: answer
Convert first: $30^\circ/\mathrm{s} = 0.5236\,\mathrm{rad/s}$, and $\Delta t = 1/200 = 0.005\,\mathrm{s}$. So $\theta = 0.5236 \times 0.005/2 = 1.309\times 10^{-3}$.

**Forward Euler** grows the norm by $\tfrac{1}{2}\theta^2 = 8.57\times 10^{-7}$ per step. Reaching $10^{-6}$ takes $10^{-6} / 8.57\times 10^{-7} \approx 1.2$ steps — about 6 milliseconds. Forward Euler is unusable here without re-normalizing every cycle, and even then its attitude error is only second order.

**RK4** shrinks the norm by $\theta^6/144 = (1.309\times 10^{-3})^6/144 = 3.5\times 10^{-20}$ per step. Reaching $10^{-6}$ would take $10^{-6}/3.5\times 10^{-20} = 2.9\times 10^{13}$ steps — about 4500 years at 200 Hz. In practice RK4's norm drift here is pure round-off, a random wander of order $10^{-16}$ per step, and re-normalization exists to stop that wander adding up, not to fight truncation.
:::

::: check
Your propagator's quaternion norm is $1.0003$. What does that do to a $7.7\,\mathrm{km/s}$ velocity vector transformed from inertial to body axes, and to the orthonormality of the matrix?
:::

::: answer
The DCM is built from products of quaternion components, so a non-unit quaternion gives $\lVert\mathbf{q}\rVert^2\,\mathbf{R}$, where $\mathbf{R}$ is the true rotation. Here $\lVert\mathbf{q}\rVert^2 = 1.0003^2 = 1.00060009$.

So every transformed vector is $0.060\,\%$ too long. The velocity comes out as $7.7 \times 1.0006 = 7.7046\,\mathrm{km/s}$, an error of $4.6\,\mathrm{m/s}$.

The matrix satisfies $\mathbf{C}^\top\mathbf{C} = 1.0006^2\,\mathbf{I} = 1.0012\,\mathbf{I}$ rather than $\mathbf{I}$. It is a rotation combined with a uniform stretch — still invertible, no longer a rotation — with a determinant of $1.0006^3 = 1.0018$ rather than 1. A navigation filter fed this will blame an accelerometer or gyro scale factor, and calibrate a real sensor to make up for a software bug.
:::

::: check
Prove that re-normalizing a quaternion between RK4 steps cannot change the attitude the propagation produces, when $\boldsymbol{\omega}$ does not depend on $\mathbf{q}$.
:::

::: answer
With $\boldsymbol{\omega}$ independent of $\mathbf{q}$, the right-hand side is $f(\mathbf{q}) = \mathbf{A}\mathbf{q}$ with $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$ — a linear, homogeneous map.

Each RK4 stage evaluates $\mathbf{A}$ on a combination of $\mathbf{q}_k$ and earlier stages. The first stage, $\mathbf{A}\mathbf{q}_k$, is linear in $\mathbf{q}_k$. Each later stage is $\mathbf{A}$ times a sum of things already linear in $\mathbf{q}_k$, so it is linear too. Hence $\mathbf{q}_{k+1} = \mathbf{P}\,\mathbf{q}_k$ for a matrix $\mathbf{P}$ that depends on $\mathbf{A}$ and $\Delta t$ but not on $\mathbf{q}_k$.

Now replace $\mathbf{q}_k$ by $c\,\mathbf{q}_k$ for a number $c$. The next state is $c\,\mathbf{P}\mathbf{q}_k = c\,\mathbf{q}_{k+1}$. A rescaling at any step travels forward as an overall scale and never rotates the state. The attitude is the direction of $\mathbf{q}$, so it is unchanged.

The argument fails when $\boldsymbol{\omega}$ depends on $\mathbf{q}$ — an attitude feedback law, for instance. But then the norm error is also feeding the controller, which is a reason to re-normalize, not a reason to doubt the result.
:::

::: check
You halve the step size in an attitude propagator and the attitude error falls by a factor of 4, not 16, although the code calls a fourth-order integrator. Name two explanations and how to tell them apart.
:::

::: answer
**Something in the loop is lower order.** A common case: $\boldsymbol{\omega}$ is held at its value at $t_k$ for the whole step, instead of being re-evaluated at the RK4 stage times $t_k$, $t_k + \Delta t/2$ and $t_k + \Delta t$. That **zero-order hold** makes the whole scheme first or second order, whatever the recipe. Test it with a constant-$\boldsymbol{\omega}$ case, where the hold is exact. If the ratio returns to 16, that was it.

**The error has stopped being truncation.** At small steps, round-off adds up roughly like $\sqrt{N}$ and eventually wins, so the error curve flattens and then rises again. Test by plotting error against step size on log axes and looking for the bottom of the curve, or by repeating in higher precision: a truncation-dominated run does not change, a round-off-dominated one improves.

A third possibility worth checking: a constraint fix applied inside the stages, which breaks the order conditions as the warning above describes.
:::

::: check
For the MRP propagation of a vehicle tumbling at $6.3\,\mathrm{rad/s}$, how often does a shadow-set switch happen, and why is that number not twice as large?
:::

::: answer
The switch fires when $\lVert\boldsymbol{\sigma}\rVert$ crosses 1. Since $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$, that is at $\Phi = 180^\circ$. At $6.3\,\mathrm{rad/s}$ one full turn takes $2\pi/6.3 = 0.997\,\mathrm{s}$, so switches come about once a second.

Once per turn, not twice. On the way up through $\Phi = 180^\circ$, $\lVert\boldsymbol{\sigma}\rVert$ crosses 1 from below and the switch swaps in the shadow, whose length is $1/\lVert\boldsymbol{\sigma}\rVert$. The shadow describes the same attitude as a turn of $360^\circ - \Phi$ the other way, and that angle is *shrinking* as $\Phi$ runs on towards $360^\circ$. So the shadow's length falls back towards zero. Each turn has exactly one crossing, and the state stays inside the unit ball with $\Phi \le 180^\circ$ the whole time.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Tangent vs normal error | Truncation (a wrong attitude) vs constraint violation (not an attitude) |
| $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2$ | The quaternion step parameter; half the DCM value |
| $\lvert P_{\text{Euler}}\rvert \approx 1 + \theta^2/2$ | Forward Euler grows the norm; $8.6\times 10^{12}$ after 60 000 steps at $\theta = 0.0315$ |
| $\lvert P_{\text{RK4}}\rvert \approx 1 - \theta^6/144$ | RK4 shrinks it; $-4.1\times 10^{-7}$ over the same run |
| $\mathbf{q} \leftarrow \mathbf{q}/\lVert\mathbf{q}\rVert$ | Exact re-normalization; changes length only, never attitude |
| $\mathbf{q} \leftarrow \tfrac{1}{2}(3 - \mathbf{q}^\top\mathbf{q})\mathbf{q}$ | Newton step; leftover $-\tfrac{3}{8}\varepsilon^2$, no square root |
| $\mathbf{C} \leftarrow \tfrac{3}{2}\mathbf{C} - \tfrac{1}{2}\mathbf{C}\mathbf{C}^\top\mathbf{C}$ | DCM orthonormalisation, quadratically convergent |
| $\lVert\mathbf{q}\rVert^2$ scale factor | Norm $1.0003$ stretches every rotated vector by $0.06\,\%$ |
| $\boldsymbol{\sigma} \leftarrow -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | MRP shadow switch at $\lVert\boldsymbol{\sigma}\rVert > 1$, once per turn |
| Quaternion RK4 at 100 Hz, $361^\circ/\mathrm{s}$ | $6.4$ arcseconds of attitude error after 10 minutes |

The next lesson stays with the quaternion and takes the integration schemes one by one — Euler, Heun, RK4 and the exponential map — measuring the drift each produces, and building the update that has no norm drift at all.

::: context manifold A surface you must stay on
A **manifold** is a curved space that looks flat if you zoom in close enough — like the surface of the Earth, which looks flat from your backyard. Unit quaternions live on a 3-dimensional "sphere" sitting inside 4-dimensional space. You cannot picture it directly, but it behaves like the ordinary globe: every allowed attitude is a point on the surface, and any point off the surface is not an attitude at all.
:::

::: context runge-kutta Two German mathematicians
The methods are named after Carl Runge, who published the idea around 1895, and Martin Kutta, who worked out the classical fourth-order recipe in 1901. The trick is to sample the slope at a few points inside the step and blend them with carefully chosen weights, so that the result matches the true solution's series to high order. RK4 has been the default workhorse for simulation ever since.
:::

::: context eigen-spin What an imaginary eigenvalue means
An eigenvalue of $\pm i\lambda$ says the motion is pure spinning at rate $\lambda$, with no growing or shrinking. In complex-number language, each step should multiply by $e^{i\theta}$, a point on the unit circle. A numerical method multiplies by $P(i\theta)$ instead, which is a point *near* the circle. Its distance from the center, $\lvert P(i\theta)\rvert$, is how much the norm stretches or shrinks each step.
:::

::: context tangent-step Why Euler always lands outside
A forward Euler step moves along the tangent — straight ahead, at right angles to the radius. The radius was $1$ and the step is $\theta$, so by Pythagoras the new distance from the center is $\sqrt{1 + \theta^2}$, which is always more than $1$. Re-normalizing slides the point back along the radius onto the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M 24.7 95 A 110 110 0 0 1 215.3 95" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="120" cy="150" r="3" fill="#1f2a44"/>
  <line x1="120" y1="150" x2="120" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="150" x2="180.5" y2="40" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="120" y1="40" x2="180.5" y2="40" stroke="#b4232c" stroke-width="3"/>
  <circle cx="120" cy="40" r="4" fill="#1d6fd1"/>
  <circle cx="180.5" cy="40" r="4" fill="#b4232c"/>
  <circle cx="173.0" cy="53.6" r="4" fill="#1d6fd1"/>
  <text x="110" y="100" font-size="12" text-anchor="end" fill="#1d6fd1">1</text>
  <text x="150" y="32" font-size="12" text-anchor="middle" fill="#b4232c">θ</text>
  <text x="188" y="36" font-size="12" fill="#b4232c">Euler lands at √(1+θ²)</text>
  <text x="182" y="66" font-size="12" fill="#1d6fd1">re-normalised</text>
  <text x="60" y="170" font-size="12" fill="#1f2a44">unit circle (the constraint)</text>
</svg>
```
:::

::: context single-precision Seven digits or sixteen
Computers store most numbers in **floating point**, a kind of scientific notation. **Single precision** (32 bits) keeps about 7 significant digits, and its largest number is about $3.4\times 10^{38}$. **Double precision** (64 bits) keeps about 16 digits and reaches about $1.8\times 10^{308}$. Older and smaller flight processors often work in single precision to save time and memory, which makes drift and round-off far more visible — the next lesson measures exactly how much.
:::

::: context newton-step Newton's method, in one line
Newton's method finds where a function crosses zero by sliding down its tangent line. The scale factor you want is $1/\sqrt{x}$, with $x = \mathbf{q}^\top\mathbf{q}$. One Newton step towards $1/\sqrt{x}$, starting from the guess $1$, gives $\tfrac{1}{2}(3 - x)$ — exactly the factor in the formula. Each step roughly squares the error, which is why one is enough when you start close. The same idea, one Newton step for $1/\sqrt{x}$, powered the famous "fast inverse square root" in the 1999 video game *Quake III Arena*, used to normalize vectors for 3-D lighting.
:::

::: context order-plot Reading the order off a graph
Plot error against step size with both axes logarithmic, and a method of order $p$ draws a straight line with slope $p$. Here each halving of $\Delta t$ drops the error by about 16, a slope of 4.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="70" y1="150" x2="70" y2="18" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="93.4" y="165">0.005</text><text x="164.5" y="165">0.01</text><text x="235.7" y="165">0.02</text><text x="306.9" y="165">0.04</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="64" y="28">1°</text><text x="64" y="58">0.1°</text><text x="64" y="88">0.01°</text><text x="64" y="118">0.001°</text><text x="64" y="148">0.0001°</text>
  </g>
  <polyline points="93.4,142.6 164.5,106.5 235.7,70.4 306.9,34.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1d6fd1"><circle cx="93.4" cy="142.6" r="4"/><circle cx="164.5" cy="106.5" r="4"/><circle cx="235.7" cy="70.4" r="4"/><circle cx="306.9" cy="34.3" r="4"/></g>
  <text x="200" y="178" font-size="12" text-anchor="middle" fill="#1f2a44">step size Δt (s), log scale</text>
  <text x="120" y="60" font-size="12" fill="#b4232c">×16 per halving</text>
</svg>
```

A slope that bends flat at small steps is round-off taking over.
:::

::: context adaptive-step Integrators that choose their own step
An **adaptive** integrator estimates its own error each step, usually by comparing two methods of different order. If the error is small it lengthens the next step; if large, it shortens it and tries again. This relies on the equation being smooth. A sudden jump planted inside the stages — like a re-normalization mid-step — looks to it like a huge error, so it keeps shrinking the step for no real reason.
:::
