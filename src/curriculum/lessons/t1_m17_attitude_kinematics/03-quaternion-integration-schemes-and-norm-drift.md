---
id: l03-quaternion-integration-schemes-and-norm-drift
title: Quaternion integration schemes and norm drift
minutes: 21
covers:
  - quaternion integration schemes and norm drift
---

The previous lesson established that a numerical step splits its error into a part that moves the attitude and a part that leaves the constraint manifold, and that re-normalisation removes only the second. This lesson picks four specific schemes, works out exactly how much of each error they produce, measures both, and then shows an update that has no norm drift at all — because it never leaves the sphere in the first place.

This is not a survey. The four are the ones that actually appear in attitude code: forward Euler, because someone always writes it first; Heun, the trapezoidal predictor–corrector, because it is the cheapest thing that is not embarrassing; classical RK4, the workhorse; and the exponential-map update, which is what strapdown inertial navigation has used since the 1970s. You will end the lesson able to look at a norm reading and say what scheme produced it, in what precision, and whether the number is a problem.

One convention reminder before the arithmetic. All four propagate the scalar-first attitude quaternion $\mathbf{q}$ under $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ with $\boldsymbol{\omega}$ the body rate in body axes. Write $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$, and for a constant rate define the step parameter

$$
\theta = \frac{\lVert\boldsymbol{\omega}\rVert\,\Delta t}{2},
$$

half the rotation angle per step, which is the number every result below is written in.

## The four updates

**Forward Euler.** One derivative evaluation, one add:

$$
\mathbf{q}_{k+1} = \mathbf{q}_k + \Delta t\,\mathbf{A}\mathbf{q}_k = (\mathbf{I} + \Delta t\,\mathbf{A})\,\mathbf{q}_k .
$$

**Heun, the trapezoidal predictor–corrector.** Predict with Euler, then average the two slopes:

$$
\tilde{\mathbf{q}} = \mathbf{q}_k + \Delta t\,\mathbf{A}\mathbf{q}_k, \qquad
\mathbf{q}_{k+1} = \mathbf{q}_k + \tfrac{\Delta t}{2}\bigl(\mathbf{A}\mathbf{q}_k + \mathbf{A}\tilde{\mathbf{q}}\bigr).
$$

**Classical RK4.** Four evaluations, the familiar weights $\tfrac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$.

**The exponential map.** Instead of approximating the derivative, take the exact solution of the constant-rate equation over one step and compose it:

$$
\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp\!\left(\tfrac{1}{2}\boldsymbol{\omega}\,\Delta t\right),
\qquad
\exp\!\left(\tfrac{1}{2}\boldsymbol{\phi}\right) = \begin{bmatrix}\cos(\phi/2)\\[2pt] \dfrac{\boldsymbol{\phi}}{\phi}\sin(\phi/2)\end{bmatrix},
\quad \boldsymbol{\phi} = \boldsymbol{\omega}\Delta t,\ \ \phi = \lVert\boldsymbol{\phi}\rVert .
$$

The quaternion on the right is a unit quaternion for any $\boldsymbol{\phi}$, since $\cos^2 + \sin^2 = 1$, and the product of two unit quaternions is a unit quaternion. The update therefore cannot leave the sphere. It is also *exact* when $\boldsymbol{\omega}$ is constant over the step, for any step size: there is no truncation error to make small.

::: key The norm-preserving update
$\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$, with $\exp(\tfrac{1}{2}\boldsymbol{\phi}) = [\cos(\phi/2),\, \hat{\boldsymbol{\phi}}\sin(\phi/2)]$. Unit norm by construction, exact for constant $\boldsymbol{\omega}$ at any step size, and one of the two standard answers when a quaternion norm has drifted — the other being to re-normalise every step.
:::

Guard the small-angle case. When $\phi \to 0$ the factor $\sin(\phi/2)/\phi$ is $0/0$, so a direct implementation divides by zero on a stationary vehicle. Use the series below a threshold of about $10^{-8}\,\mathrm{rad}$:

$$
\cos\frac{\phi}{2} \approx 1 - \frac{\phi^2}{8}, \qquad
\frac{\sin(\phi/2)}{\phi} \approx \frac{1}{2}\left(1 - \frac{\phi^2}{24}\right).
$$

## How much each one drifts

For constant $\boldsymbol{\omega}$ all three Runge–Kutta methods reduce to multiplying by the same polynomial in $\mathbf{A}\Delta t$ every step, and $\mathbf{A}$ has eigenvalues $\pm i\lVert\boldsymbol{\omega}\rVert/2$. So the norm is multiplied by $\lvert P(i\theta)\rvert$ each step. Evaluate each:

$$
\begin{aligned}
\lvert 1 + i\theta\rvert &= \sqrt{1 + \theta^2} = 1 + \tfrac{1}{2}\theta^2 + O(\theta^4), \\
\lvert 1 + i\theta - \tfrac{1}{2}\theta^2 \rvert &= \sqrt{1 + \tfrac{1}{4}\theta^4} = 1 + \tfrac{1}{8}\theta^4 + O(\theta^8), \\
\lvert 1 + i\theta - \tfrac{1}{2}\theta^2 - \tfrac{i}{6}\theta^3 + \tfrac{1}{24}\theta^4 \rvert &= \sqrt{1 - \tfrac{1}{72}\theta^6 + \tfrac{1}{576}\theta^8} = 1 - \tfrac{1}{144}\theta^6 + O(\theta^8).
\end{aligned}
$$

The Heun line is worth doing by hand because the cancellation is neat: the squared modulus is $(1 - \theta^2/2)^2 + \theta^2 = 1 - \theta^2 + \theta^4/4 + \theta^2$, and the $\theta^2$ terms cancel exactly, leaving $1 + \theta^4/4$. The RK4 line works the same way one order further along, and the $\theta^6$ coefficient comes out negative — which is why RK4 shrinks the norm while the other two grow it.

::: key Per-step norm factor for constant rate
With $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2$: forward Euler multiplies the norm by $1 + \theta^2/2$, Heun by $1 + \theta^4/8$, RK4 by $1 - \theta^6/144$, and the exponential map by exactly 1. Over $N$ steps these compound as $\exp(N\theta^2/2)$, $\exp(N\theta^4/8)$ and $\exp(-N\theta^6/144)$. The sign identifies the scheme: a norm that grows is not classical RK4.
:::

::: example Four schemes, 10 000 seconds at 10 Hz
A three-axis spacecraft drifts at $\boldsymbol{\omega} = (0.02,\, -0.01,\, 0.05)\,\mathrm{rad/s}$, a magnitude of $0.0548\,\mathrm{rad/s} = 3.14^\circ/\mathrm{s}$. The attitude control computer runs at $10\,\mathrm{Hz}$, so $\Delta t = 0.1\,\mathrm{s}$ and $\theta = 2.739\times 10^{-3}$. Propagate for $10^4\,\mathrm{s}$ — 100 000 steps, about 87 revolutions — and compare each result against the exact single rotation of $\lVert\boldsymbol{\omega}\rVert t$ about $\boldsymbol{\omega}/\lVert\boldsymbol{\omega}\rVert$.

```python
import numpy as np

def qmul(a, b):
    return np.concatenate([[a[0] * b[0] - a[1:] @ b[1:]],
                           a[0] * b[1:] + b[0] * a[1:] + np.cross(a[1:], b[1:])])

def qexp_half(v):
    """Unit quaternion exp(v/2) for a rotation vector v, with a small-angle guard."""
    phi = np.linalg.norm(v)
    if phi < 1e-8:
        return np.concatenate([[1.0 - phi * phi / 8.0], 0.5 * v * (1.0 - phi * phi / 24.0)])
    return np.concatenate([[np.cos(phi / 2)], np.sin(phi / 2) * v / phi])

def omega_matrix(w):
    wx, wy, wz = w
    return np.array([[0.0, -wx, -wy, -wz],
                     [wx, 0.0, wz, -wy],
                     [wy, -wz, 0.0, wx],
                     [wz, wy, -wx, 0.0]])

w = np.array([0.02, -0.01, 0.05])          # rad/s, constant
dt, n = 0.1, 100000                        # 10 Hz for 10 000 s
A = 0.5 * omega_matrix(w)
u = qexp_half(w * dt)                      # the exact one-step rotation
exact = qexp_half(w * (n * dt))

for name in ("euler", "heun", "rk4", "exp"):
    q = np.array([1.0, 0.0, 0.0, 0.0])
    for _ in range(n):
        if name == "euler":
            q = q + dt * (A @ q)
        elif name == "heun":
            k1 = A @ q
            q = q + 0.5 * dt * (k1 + A @ (q + dt * k1))
        elif name == "rk4":
            k1 = A @ q
            k2 = A @ (q + 0.5 * dt * k1)
            k3 = A @ (q + 0.5 * dt * k2)
            k4 = A @ (q + dt * k3)
            q = q + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)
        else:
            q = qmul(q, u)
    d = qmul(q / np.linalg.norm(q), np.concatenate([[exact[0]], -exact[1:]]))
    err = np.degrees(2 * np.arctan2(np.linalg.norm(d[1:]), abs(d[0])))
    print(f"{name:5s} norm-1 = {np.linalg.norm(q) - 1: .3e}   error = {err: .3e} deg")
# euler norm-1 =  4.550e-01   error =  7.846e-02 deg
# heun  norm-1 =  7.031e-07   error =  3.923e-02 deg
# rk4   norm-1 = -2.862e-13   error =  1.471e-08 deg
# exp   norm-1 = -3.798e-12   error =  5.814e-12 deg
```

Every norm figure matches the formula. Euler: $N\theta^2/2 = 100000 \times 3.75\times 10^{-6} = 0.375$, and $e^{0.375} - 1 = 0.455$. Heun: $N\theta^4/8 = 7.03\times 10^{-7}$. RK4: $-N\theta^6/144 = -2.93\times 10^{-13}$. The exponential map's $-3.8\times 10^{-12}$ is not truncation at all — it is accumulated floating-point rounding in a hundred thousand quaternion products, a fraction of a machine epsilon each, all in the same direction.
:::

## The norm is not the accuracy, and here is the proof

Look at the error column, not the norm column, and something strange appears. Euler's norm is out by $45\,\%$ and Heun's by $7\times 10^{-7}$ — a factor of $6\times 10^5$ between them — yet their attitude errors differ by a factor of exactly **two**.

The reason is that for this problem the two schemes make the same *kind* of error, and Euler dumps its first-order part entirely into the norm, where re-normalisation throws it away. Write each step as multiplication by a complex number in the plane spanned by the eigenvectors. Forward Euler multiplies by $1 + i\theta$, whose argument is $\arctan\theta = \theta - \theta^3/3 + \cdots$, so the phase advanced per step falls short by $\theta^3/3$. Heun multiplies by $1 + i\theta - \theta^2/2$, whose argument is $\arctan\bigl(\theta/(1 - \theta^2/2)\bigr) = \theta + \theta^3/6 + \cdots$, overshooting by $\theta^3/6$. Since the attitude angle is twice the quaternion phase angle, after $N$ steps the attitude errors are

$$
\Delta\Phi_{\text{Euler}} = \frac{2N\theta^3}{3}, \qquad \Delta\Phi_{\text{Heun}} = \frac{2N\theta^3}{6},
$$

opposite in sign and a factor of two apart in size. Put the numbers in: $2 \times 10^5 \times (2.739\times 10^{-3})^3/3 = 1.369\times 10^{-3}\,\mathrm{rad} = 0.0785^\circ$, matching the Euler measurement to four figures, and half of it, $0.0392^\circ$, matching Heun.

Both are therefore **second order in attitude**, since $N \propto 1/\Delta t$ makes $N\theta^3 \propto \Delta t^2$. Halving the step quarters the error for both: the measured sequence for Euler at $\Delta t = 0.8,\, 0.4,\, 0.2,\, 0.1\,\mathrm{s}$ is $5.020^\circ,\, 1.255^\circ,\, 0.3138^\circ,\, 0.07846^\circ$, ratios of exactly 4.000.

::: warning Never rank schemes by norm drift
Forward Euler looks catastrophic on the norm and merely poor on the attitude; RK4 looks perfect on the norm and is genuinely excellent. The correlation is an accident of which error component each scheme happens to favour. If you want to know how accurate a propagator is, compare it against a closed-form case or against itself at half the step, and measure the *angle* of the error rotation. The norm tells you about the constraint, the health of the arithmetic, and nothing else.
:::

Two caveats keep this from being a defence of forward Euler. First, the second-order behaviour is a property of the constant-rate case; with a time-varying $\boldsymbol{\omega}$ sampled once per step, Euler reverts to first order. Running the same comparison on a rate vector that itself rotates — $\boldsymbol{\omega}(t) = (0.1\sin 2t,\, 0.1\cos 2t,\, 0.3)\,\mathrm{rad/s}$ over 20 s — forward Euler with $\boldsymbol{\omega}$ sampled at the step start gives $0.2609^\circ$, $0.1304^\circ$, $0.0652^\circ$ at $\Delta t = 0.04,\, 0.02,\, 0.01\,\mathrm{s}$: ratios of 2, first order, and a tenth of a degree at a perfectly ordinary step size. Second, a norm that has grown by $45\,\%$ has to be re-normalised or the state overflows.

## The exponential map is not exempt

"Unit norm by construction" is a statement about exact arithmetic. Two things go wrong in a real machine, and both are worth knowing before you write the update into flight software.

**The multiplier's own error compounds linearly.** For constant $\boldsymbol{\omega}$ the code computes $\exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$ once and reuses it. If that stored quaternion has a norm of $1 + \delta$, then after $N$ products the state norm is $(1+\delta)^N$ — a *linear* accumulation of $N\delta$, not a random walk of $\sqrt{N}\,\delta$. In double precision the quaternion above rounds to unit norm exactly and nothing happens. Rounded to single precision it has $\delta = -5.09\times 10^{-9}$, and over $10^6$ steps the state norm reaches $1 - 5.37\times 10^{-3}$: half a per cent low, from a multiplier that was correct to seven digits.

**Round-off in the product accumulates.** Each quaternion product commits a few rounding errors. Over $10^6$ double-precision steps the run above ends at $1 - 3.8\times 10^{-11}$.

**And the step is only exact if $\boldsymbol{\omega}$ really is constant across it.** It never is. Sampling $\boldsymbol{\omega}$ at the midpoint of the step recovers second-order accuracy in the time variation — on the rotating-rate case above, the exponential map with midpoint sampling gives $2.17\times 10^{-3}$, $5.43\times 10^{-4}$, $1.36\times 10^{-4}$ degrees at $\Delta t = 0.04,\, 0.02,\, 0.01\,\mathrm{s}$, ratios of 4 — but the residual is a real, one-way attitude error whose source is that finite rotations do not commute. That error has a name, coning, and the last lesson of this module shows how strapdown algorithms remove most of it with multi-sample corrections.

::: example A single-precision flight computer
The same spacecraft, the same 10 Hz loop, but now run for $10^6$ steps — $10^5\,\mathrm{s}$, about 28 hours — on a processor doing the attitude integration in 32-bit floating point.

In double precision, RK4 ends at a norm of $1 - 2.9\times 10^{-12}$ with an attitude error of $1.5\times 10^{-7}$ degrees, and the exponential map at $1 - 3.8\times 10^{-11}$ with $5.4\times 10^{-11}$ degrees.

In single precision, RK4 ends at $1 + 1.30\times 10^{-5}$ with an attitude error of $0.020^\circ$, and the exponential map at $1 - 5.37\times 10^{-3}$ with $0.068^\circ$. Note the sign on the RK4 line: it is *positive*, although RK4's truncation error shrinks the norm. What you are watching is the random walk of round-off, roughly $\sqrt{N}$ times the unit round-off of $5.96\times 10^{-8}$, which is $6\times 10^{-5}$, and the measured value is one realisation of that walk. And note that the exponential map, the scheme that cannot drift, drifts four hundred times further than RK4, because its error is the compounding one.

The practical conclusion is the same for both: carry the attitude state in double precision if you possibly can, and re-normalise every cycle regardless of which scheme you chose.
:::

::: example Reading a norm of 1.0003
A flight-software report says the quaternion norm reached $1.0003$ after $10^6$ RK4 steps. What has happened, what does it cost, and what do you do?

**What it costs.** The DCM built from a quaternion is quadratic in its components, so the matrix that comes out is $\lVert\mathbf{q}\rVert^2$ times a true rotation: $1.0003^2 = 1.00060009$. Every vector transformed through it is $0.060\,\%$ too long, and $\mathbf{C}^\top\mathbf{C} = 1.0006\,\mathbf{I}$ rather than $\mathbf{I}$ — no longer an orthonormal matrix at all. For a $7.7\,\mathrm{km/s}$ velocity rotated into body axes that is $4.6\,\mathrm{m/s}$ of pure fiction, and a navigation filter will absorb it as a sensor scale factor. This is a systematic error, not a rotation offset: the attitude itself may be perfectly good.

**What has happened.** Classical RK4 on the exact kinematic equation *contracts* the norm for any $\theta$ below its stability limit of $2\sqrt{2}$, so a growth to $1.0003$ is not RK4 truncation error. The realistic causes are single-precision arithmetic — a $10^6$-step random walk at 32-bit round-off lands squarely in the $10^{-5}$ to $10^{-3}$ range, as the previous example showed — or a lower-order update hiding somewhere in the loop, or a corrupted $\boldsymbol{\omega}$ making the effective generator non-skew.

**The two fixes.** Re-normalise every step, $\mathbf{q} \leftarrow \mathbf{q}/\lVert\mathbf{q}\rVert$ or its Newton form, which is cheap and standard; or switch to the norm-preserving update $\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$, which has no norm error to remove by construction. Then find out which of the three causes it was, because the fix hides the symptom and the cause may be corrupting something else.
:::

::: note Cost, for the record
Per step: forward Euler is one $4\times 4$ matrix–vector product, 16 multiplies. Heun is two. RK4 is four, plus the weighted sum. The exponential map is one quaternion product — also 16 multiplies — plus one sine and one cosine, which on a modern core is a few tens of cycles and on an older flight processor may be a table lookup. For constant or slowly varying rates the exponential map is both cheaper than RK4 and more accurate, which is why strapdown navigators use it and integrate the *rate* with the Runge–Kutta effort instead.
:::

## Check yourself

::: check
A vehicle rotates at a steady $200^\circ/\mathrm{s}$ and the attitude loop runs at 50 Hz. Compute $\theta$, then the norm drift after one hour for forward Euler, Heun and RK4.
:::

::: answer
$\lVert\boldsymbol{\omega}\rVert = 200^\circ/\mathrm{s} = 3.4907\,\mathrm{rad/s}$ and $\Delta t = 0.02\,\mathrm{s}$, so $\theta = 3.4907 \times 0.02/2 = 0.034907$. One hour at 50 Hz is $N = 180\,000$ steps.

Forward Euler: per-step factor $1 + \theta^2/2 = 1 + 6.093\times 10^{-4}$, so the norm reaches $\exp(180000 \times 6.093\times 10^{-4}) = e^{109.7} \approx 4\times 10^{47}$. Unusable without re-normalisation, and the state would overflow single precision within a minute.

Heun: $1 + \theta^4/8 = 1 + 1.856\times 10^{-7}$, giving $\exp(180000 \times 1.856\times 10^{-7}) = e^{0.0334} = 1.034$. Three per cent, which becomes a seven per cent scale factor in the DCM — bad, but slow enough that a once-per-cycle re-normalisation handles it.

RK4: $1 - \theta^6/144 = 1 - 1.256\times 10^{-11}$, giving $\exp(-180000 \times 1.256\times 10^{-11}) = 1 - 2.26\times 10^{-6}$. Small, but two parts per million of DCM scale error is already larger than most star trackers' noise, so re-normalise anyway.
:::

::: check
Show that the exponential-map update reduces to the forward Euler update to first order in $\Delta t$, and state the first term where they differ.
:::

::: answer
Expand the update quaternion for small $\phi = \lVert\boldsymbol{\omega}\rVert\Delta t$:

$$
\exp\!\left(\tfrac{1}{2}\boldsymbol{\omega}\Delta t\right) = \begin{bmatrix}\cos(\phi/2)\\ \hat{\boldsymbol{\phi}}\sin(\phi/2)\end{bmatrix} = \begin{bmatrix}1 - \phi^2/8 + \cdots\\ \tfrac{1}{2}\boldsymbol{\omega}\Delta t\,(1 - \phi^2/24 + \cdots)\end{bmatrix}.
$$

To first order this is $[1,\ \tfrac{1}{2}\boldsymbol{\omega}\Delta t]$, and $\mathbf{q}\otimes[1, \tfrac{1}{2}\boldsymbol{\omega}\Delta t] = \mathbf{q} + \tfrac{\Delta t}{2}\,\mathbf{q}\otimes[0,\boldsymbol{\omega}] = \mathbf{q} + \Delta t\,\mathbf{A}\mathbf{q}$, which is exactly the forward Euler step.

The first difference is the $-\phi^2/8$ in the scalar part, second order in $\Delta t$. In the language of the norm, $\lvert 1 + i\theta\rvert = 1 + \theta^2/2$ where the exact factor is 1, and $\theta^2/2 = \phi^2/8$ — the same term. Forward Euler *is* the exponential map with the norm correction deleted.
:::

::: check
Your propagator's norm drifts upward by $2\times 10^{-9}$ per step. You halve the step size and the per-step drift falls to $5\times 10^{-10}$. What order is the leading norm error, and which of the four schemes is consistent with that?
:::

::: answer
Halving $\Delta t$ halves $\theta$, and the drift fell by a factor of 4, so the per-step norm error scales as $\theta^2$. That is the forward Euler signature, $\theta^2/2$. Heun would have fallen by 16 and RK4 by 64, and the exponential map has no truncation contribution at all.

The sign confirms it: upward growth rules out RK4, whose $-\theta^6/144$ contracts. So either the integrator is a first-order Euler step, or — the more common bug in practice — a nominally higher-order scheme is being fed a right-hand side that is only first-order correct, which produces the same signature. Check whether $\boldsymbol{\omega}$ is re-evaluated at the intermediate stage times or held at its start-of-step value.
:::

::: check
Explain why a single-precision exponential-map propagator drifted to $1 - 5.4\times 10^{-3}$ over $10^6$ steps while the single-precision RK4 propagator only reached $1 + 1.3\times 10^{-5}$, although the exponential map is the norm-preserving scheme.
:::

::: answer
The exponential map for a constant rate multiplies by the *same* stored quaternion every step. In single precision that quaternion's own norm is off by $\delta = -5.09\times 10^{-9}$, and the errors therefore compound deterministically: $(1 + \delta)^N = 1 + N\delta$ for small $N\delta$, giving $10^6 \times (-5.09\times 10^{-9}) = -5.09\times 10^{-3}$, close to the measured $-5.37\times 10^{-3}$; the remainder is the extra rounding of each product.

RK4's round-off, by contrast, is a fresh rounding of a different quantity each step, with no fixed bias, so it accumulates as a random walk: roughly $\sqrt{N}$ times the unit round-off, $1000 \times 5.96\times 10^{-8} = 6.0\times 10^{-5}$, of which the measured $1.3\times 10^{-5}$ is one realisation. Systematic bias beats random walk by $\sqrt{N}$, here a factor of a thousand. The lesson is that "cannot drift in exact arithmetic" says nothing about a fixed multiplier reused a million times — re-normalise, or recompute the multiplier in double precision.
:::

::: check
For constant $\boldsymbol{\omega}$, forward Euler with per-step re-normalisation is second-order accurate in attitude. Why does that not make it a reasonable choice for a real vehicle?
:::

::: answer
Because real vehicles do not have constant rates. The second-order behaviour came from a cancellation specific to the autonomous linear case: Euler's first-order error is entirely radial, and re-normalisation discards it. As soon as $\boldsymbol{\omega}$ varies across the step, a single sample of $\boldsymbol{\omega}$ at the step start introduces an error of order $\dot{\boldsymbol{\omega}}\Delta t^2/2$ per step that is *tangential*, not radial, and re-normalisation cannot remove it. The measured rotating-rate case above shows the ratios dropping from 4 to 2 — first order — and the error rising to $0.065^\circ$ after 20 s at $\Delta t = 0.01\,\mathrm{s}$, which is enormous for an attitude propagator.

There is also no reason to accept it. RK4 costs four derivative evaluations for eight orders of magnitude of improvement, and the exponential map costs one product and a sine for even better accuracy on smooth rates.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2$ | Step parameter; half the rotation angle per step |
| Euler: $\mathbf{q} + \Delta t\,\mathbf{A}\mathbf{q}$ | Norm factor $1 + \theta^2/2$; attitude error $2N\theta^3/3$ |
| Heun: two-stage trapezoid | Norm factor $1 + \theta^4/8$; attitude error $2N\theta^3/6$ |
| RK4: four stages | Norm factor $1 - \theta^6/144$; attitude error fourth order |
| $\mathbf{q}_{k+1} = \mathbf{q}_k\otimes\exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$ | Unit by construction; exact for constant $\boldsymbol{\omega}$ at any step |
| $\exp(\tfrac{1}{2}\boldsymbol{\phi}) = [\cos(\phi/2),\ \hat{\boldsymbol{\phi}}\sin(\phi/2)]$ | Guard with $\cos \approx 1 - \phi^2/8$, $\sin(\phi/2)/\phi \approx \tfrac{1}{2}(1 - \phi^2/24)$ |
| Norm $1.0003$ | DCM scale factor $1.0006$; fix by re-normalising or by the exponential map |
| Single precision, $10^6$ steps | RK4 drifts $1.3\times 10^{-5}$ (random walk); exponential map $-5.4\times 10^{-3}$ (compounding bias) |
| Norm drift vs accuracy | Uncorrelated; measure accuracy as the angle of the error rotation |

The next lesson stops treating $\boldsymbol{\omega}$ as given. It attaches Euler's rotational equations to the kinematics, making a coupled seven-number state — quaternion plus body rate — whose conserved quantities give you the validation tools this lesson had to import from a closed-form solution.
