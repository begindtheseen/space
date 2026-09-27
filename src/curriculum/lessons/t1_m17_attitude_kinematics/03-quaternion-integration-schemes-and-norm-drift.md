---
id: l03-quaternion-integration-schemes-and-norm-drift
title: Quaternion integration schemes and norm drift
minutes: 25
covers:
  - quaternion integration schemes and norm drift
---

Four people walk a circular track in the dark. The first takes straight strides and drifts outward. The second takes a stride, looks at where it landed, and corrects. The third takes four careful looks per stride. The fourth has a map of the curve and simply walks along it. They all end up somewhere near the finish — but how far off the track, and how far along it?

The previous lesson split every numerical step's error into two parts: a part that moves the attitude (along the track) and a part that leaves the constraint (off the track). Re-normalisation removes only the second. This lesson picks four real schemes, works out exactly how much of each error they make, measures both, and then shows an update that has no norm drift at all — because it never leaves the sphere in the first place.

These four are the ones that actually appear in attitude code:

- **forward Euler**, because someone always writes it first;
- **Heun**, a **[[predictor–corrector|predictor-corrector]]**, because it is the cheapest thing that is not embarrassing;
- **classical RK4**, the workhorse;
- the **exponential map**, which **[[strapdown inertial navigation|strapdown-history]]** has used since the 1970s.

By the end you will be able to look at a norm reading and say which scheme produced it, in what precision, and whether the number is a problem.

One reminder of notation before the arithmetic. All four step forward the scalar-first quaternion $\mathbf{q}$ under $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$, with $\boldsymbol{\omega}$ the body rate in body axes. Write $\mathbf{A} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})$. For a constant rate, the **step parameter** is

$$
\theta = \frac{\lVert\boldsymbol{\omega}\rVert\,\Delta t}{2},
$$

half the rotation angle per step. Every result below is written in $\theta$.

## The four updates

**Forward Euler.** Take the slope where you stand and step along it. One derivative, one add:

$$
\mathbf{q}_{k+1} = \mathbf{q}_k + \Delta t\,\mathbf{A}\mathbf{q}_k = (\mathbf{I} + \Delta t\,\mathbf{A})\,\mathbf{q}_k .
$$

**Heun, the trapezoidal predictor–corrector.** First *predict* with an Euler step, landing at $\tilde{\mathbf{q}}$ (read "q tilde"). Then *correct*: go back and step with the average of the slope at the start and the slope at the predicted point:

$$
\tilde{\mathbf{q}} = \mathbf{q}_k + \Delta t\,\mathbf{A}\mathbf{q}_k, \qquad
\mathbf{q}_{k+1} = \mathbf{q}_k + \tfrac{\Delta t}{2}\bigl(\mathbf{A}\mathbf{q}_k + \mathbf{A}\tilde{\mathbf{q}}\bigr).
$$

**Classical RK4.** Four slope samples per step, blended with the familiar weights $\tfrac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$.

**The exponential map.** Instead of approximating the slope, use the *exact* answer for one step at constant rate, and chain it on with the quaternion product:

$$
\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp\!\left(\tfrac{1}{2}\boldsymbol{\omega}\,\Delta t\right),
\qquad
\exp\!\left(\tfrac{1}{2}\boldsymbol{\phi}\right) = \begin{bmatrix}\cos(\phi/2)\\[2pt] \dfrac{\boldsymbol{\phi}}{\phi}\sin(\phi/2)\end{bmatrix},
\quad \boldsymbol{\phi} = \boldsymbol{\omega}\Delta t,\ \ \phi = \lVert\boldsymbol{\phi}\rVert .
$$

Here $\boldsymbol{\phi}$ ("phi") is the **rotation vector** for one step: its direction is the spin axis and its length $\phi$ is the angle turned. The quaternion on the right is exactly the quaternion for "turn by $\phi$ about that axis".

Two things make this update special. First, the step quaternion has length one for any $\boldsymbol{\phi}$, because $\cos^2 + \sin^2 = 1$, and the product of two unit quaternions is a unit quaternion. So the update *cannot* leave the sphere. Second, it is **exact** when $\boldsymbol{\omega}$ is constant over the step, for any step size. There is no truncation error to make small.

::: key The norm-preserving update
$\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$, with $\exp(\tfrac{1}{2}\boldsymbol{\phi}) = [\cos(\phi/2),\, \hat{\boldsymbol{\phi}}\sin(\phi/2)]$. Unit norm by construction, exact for constant $\boldsymbol{\omega}$ at any step size, and one of the two standard answers when a quaternion norm has drifted — the other being to re-normalise every step.
:::

Guard the tiny-angle case. When $\phi \to 0$, the factor $\sin(\phi/2)/\phi$ becomes **[[0/0|zero-over-zero]]**, so a direct implementation divides by zero on a vehicle sitting still. Below a threshold of about $10^{-8}\,\mathrm{rad}$, use the small-angle series instead:

$$
\cos\frac{\phi}{2} \approx 1 - \frac{\phi^2}{8}, \qquad
\frac{\sin(\phi/2)}{\phi} \approx \frac{1}{2}\left(1 - \frac{\phi^2}{24}\right).
$$

## How much each one drifts

For constant $\boldsymbol{\omega}$, all three Runge–Kutta methods multiply $\mathbf{q}$ by the same polynomial in $\mathbf{A}\Delta t$ every step. The matrix $\mathbf{A}$ has eigenvalues $\pm i\lVert\boldsymbol{\omega}\rVert/2$, so in effect each step multiplies a complex number by $P(i\theta)$, and the norm by $\lvert P(i\theta)\rvert$. The exact answer would multiply by $e^{i\theta}$, which has size exactly $1$.

Work out each size. Recall $\lvert a + ib\rvert = \sqrt{a^2 + b^2}$, and collect the real parts and the $i$ parts:

$$
\begin{aligned}
\lvert 1 + i\theta\rvert &= \sqrt{1 + \theta^2} = 1 + \tfrac{1}{2}\theta^2 + O(\theta^4), \\
\lvert 1 + i\theta - \tfrac{1}{2}\theta^2 \rvert &= \sqrt{1 + \tfrac{1}{4}\theta^4} = 1 + \tfrac{1}{8}\theta^4 + O(\theta^8), \\
\lvert 1 + i\theta - \tfrac{1}{2}\theta^2 - \tfrac{i}{6}\theta^3 + \tfrac{1}{24}\theta^4 \rvert &= \sqrt{1 - \tfrac{1}{72}\theta^6 + \tfrac{1}{576}\theta^8} = 1 - \tfrac{1}{144}\theta^6 + O(\theta^8).
\end{aligned}
$$

(The $O(\theta^4)$, read "order theta to the fourth", stands for leftover terms that small or smaller. The last step on each line uses $\sqrt{1 + x} \approx 1 + x/2$ for small $x$.)

The Heun line is worth doing by hand, because the cancellation is neat. Its real part is $1 - \theta^2/2$ and its $i$ part is $\theta$. The squared size is

$$
\left(1 - \tfrac{\theta^2}{2}\right)^2 + \theta^2 = 1 - \theta^2 + \tfrac{\theta^4}{4} + \theta^2 = 1 + \tfrac{\theta^4}{4}.
$$

The $\theta^2$ terms cancel exactly. The RK4 line works the same way one step further along, and its $\theta^6$ coefficient comes out *negative*. That is why RK4 shrinks the norm while the other two grow it.

::: key Per-step norm factor for constant rate
With $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2$: forward Euler multiplies the norm by $1 + \theta^2/2$, Heun by $1 + \theta^4/8$, RK4 by $1 - \theta^6/144$, and the exponential map by exactly 1. Over $N$ steps these compound as $\exp(N\theta^2/2)$, $\exp(N\theta^4/8)$ and $\exp(-N\theta^6/144)$. The sign identifies the scheme: a norm that grows is not classical RK4.
:::

::: example Four schemes, 10 000 seconds at 10 Hz
A three-axis spacecraft drifts at $\boldsymbol{\omega} = (0.02,\, -0.01,\, 0.05)\,\mathrm{rad/s}$, a size of $0.0548\,\mathrm{rad/s} = 3.14^\circ/\mathrm{s}$. The attitude computer runs at $10\,\mathrm{Hz}$, so $\Delta t = 0.1\,\mathrm{s}$ and $\theta = 0.0548 \times 0.1/2 = 2.739\times 10^{-3}$. Step forward for $10^4\,\mathrm{s}$ — 100 000 steps, about 87 turns — and compare each result with the exact answer: one turn of $\lVert\boldsymbol{\omega}\rVert t$ about $\boldsymbol{\omega}/\lVert\boldsymbol{\omega}\rVert$.

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

The error line multiplies the result by the conjugate of the exact quaternion; what is left is the error rotation, and its angle is the error.

Every norm figure matches the formulas.

- **Euler:** $N\theta^2/2 = 100\,000 \times 3.75\times 10^{-6} = 0.375$, and $e^{0.375} - 1 = 0.455$.
- **Heun:** $N\theta^4/8 = 7.03\times 10^{-7}$.
- **RK4:** $-N\theta^6/144 = -2.93\times 10^{-13}$, close to the printed $-2.86\times 10^{-13}$.
- **Exponential map:** $-3.8\times 10^{-12}$ is not truncation at all. It is **[[round-off|round-off]]** from a hundred thousand quaternion products, a fraction of the smallest possible error each, leaning in the same direction.
:::

## The norm is not the accuracy, and here is the proof

Now look at the error column instead of the norm column, and something strange appears. Euler's norm is out by $45\,\%$ and Heun's by $7\times 10^{-7}$ — a factor of about $6\times 10^5$ between them. Yet their attitude errors differ by a factor of exactly **two**.

Here is why. Think of each step as multiplying by a complex number, which rotates *and* stretches. The stretch is the norm error. The rotation angle is the attitude step. The exact step would rotate by exactly $\theta$ with no stretch. See how the **[[three schemes compare|step-arrows]]**:

- Forward Euler multiplies by $1 + i\theta$. Its angle is $\arctan\theta = \theta - \theta^3/3 + \cdots$, so each step turns **short** by $\theta^3/3$.
- Heun multiplies by $1 - \theta^2/2 + i\theta$. Its angle is $\arctan\bigl(\theta/(1 - \theta^2/2)\bigr) = \theta + \theta^3/6 + \cdots$, so each step turns **long** by $\theta^3/6$.

Euler dumps its big first-order mistake entirely into the stretch, where re-normalisation throws it away. What is left in the angle is small.

The attitude angle is twice the quaternion's angle, so after $N$ steps the attitude errors are

$$
\Delta\Phi_{\text{Euler}} = \frac{2N\theta^3}{3}, \qquad \Delta\Phi_{\text{Heun}} = \frac{2N\theta^3}{6},
$$

opposite in sign and a factor of two apart. Put in the numbers: $2 \times 10^5 \times (2.739\times 10^{-3})^3/3 = 1.369\times 10^{-3}\,\mathrm{rad} = 0.0785^\circ$. That matches the Euler measurement to three figures. Half of it, $0.0392^\circ$, matches Heun.

Both are therefore **second order in attitude**. Since $N = T/\Delta t$ and $\theta \propto \Delta t$, the error $N\theta^3$ grows like $\Delta t^2$. Halving the step quarters the error for both. The measured Euler errors at $\Delta t = 0.8,\, 0.4,\, 0.2,\, 0.1\,\mathrm{s}$ are $5.020^\circ,\, 1.255^\circ,\, 0.3138^\circ,\, 0.07846^\circ$ — ratios of $4.000$.

::: warning Never rank schemes by norm drift
Forward Euler looks catastrophic on the norm and merely poor on the attitude. RK4 looks perfect on the norm and is genuinely excellent. The link is an accident of which error each scheme happens to favour. To know how accurate a propagator is, compare it with a case whose exact answer you know, or with itself at half the step, and measure the *angle* of the error rotation. The norm tells you about the constraint and the health of the arithmetic, and nothing else.
:::

Two caveats keep this from being a defence of forward Euler.

First, the second-order behaviour only holds when the rate is constant. If $\boldsymbol{\omega}$ changes over time and Euler samples it once at the start of each step, Euler drops back to first order. Try a rate vector that itself swings around: $\boldsymbol{\omega}(t) = (0.1\sin 2t,\, 0.1\cos 2t,\, 0.3)\,\mathrm{rad/s}$, over 20 s. Forward Euler (re-normalised) gives errors of $0.2609^\circ$, $0.1304^\circ$ and $0.0652^\circ$ at $\Delta t = 0.04,\, 0.02,\, 0.01\,\mathrm{s}$. The ratios are 2 — first order — and that is a tenth of a degree at a perfectly ordinary step size.

Second, a norm that has grown by $45\,\%$ has to be re-normalised anyway, or the state overflows.

## The exponential map is not exempt

"Unit norm by construction" is a promise about perfect arithmetic. A real computer breaks it in two ways, and the step's exactness has a third catch.

**The multiplier's own error compounds.** For constant $\boldsymbol{\omega}$, the code computes $\exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$ once and reuses it every step. Suppose that stored quaternion has norm $1 + \delta$ (read "delta", a tiny error). After $N$ products the state's norm is $(1 + \delta)^N \approx 1 + N\delta$. That grows in a straight line with $N$ — a steady **bias** — not like $\sqrt{N}$ as random errors do. In double precision, the quaternion above rounds to unit norm exactly and nothing happens. Rounded to single precision it has $\delta = -5.09\times 10^{-9}$. Over $10^6$ steps the state's norm reaches $1 - 5.37\times 10^{-3}$: half a per cent low, from a multiplier correct to seven digits.

**Round-off in each product adds up.** Every quaternion product makes a few rounding errors. Over $10^6$ double-precision steps, the run above ends at $1 - 3.8\times 10^{-11}$.

**The step is exact only if $\boldsymbol{\omega}$ really is constant across it.** It never is. Sampling $\boldsymbol{\omega}$ at the *middle* of the step recovers second-order accuracy. On the swinging-rate case above, the exponential map with midpoint sampling gives $2.17\times 10^{-3}$, $5.43\times 10^{-4}$ and $1.36\times 10^{-4}$ degrees at $\Delta t = 0.04,\, 0.02,\, 0.01\,\mathrm{s}$ — ratios of 4. But what remains is a real, one-way attitude error, and its source is that finite rotations do not commute. That error has a name, **[[coning|coning-bridge]]**, and the last lesson of this module shows how strapdown algorithms remove most of it.

::: example A single-precision flight computer
Same spacecraft, same 10 Hz loop, but now run for $10^6$ steps — $10^5\,\mathrm{s}$, about 28 hours — on a processor doing the attitude maths in 32-bit floating point.

**In double precision**, RK4 ends at a norm of $1 - 2.9\times 10^{-12}$ with an attitude error of $1.5\times 10^{-7}$ degrees. The exponential map ends at $1 - 3.8\times 10^{-11}$ with $5.4\times 10^{-11}$ degrees.

**In single precision**, RK4 ends at $1 + 1.30\times 10^{-5}$ with an attitude error of $0.020^\circ$. The exponential map ends at $1 - 5.37\times 10^{-3}$ with $0.068^\circ$.

Look at the sign on the RK4 line: it is *positive*, although RK4's truncation error shrinks the norm. What you are seeing is the **[[random walk|random-walk]]** of round-off. Its typical size is about $\sqrt{N}$ times the **unit round-off**, the largest relative rounding error of one operation, which is $5.96\times 10^{-8}$ in single precision. So $\sqrt{10^6} \times 5.96\times 10^{-8} = 1000 \times 5.96\times 10^{-8} = 6\times 10^{-5}$, and the measured value is one run of that walk.

And the exponential map — the scheme that cannot drift — drifts $5.37\times 10^{-3}/1.3\times 10^{-5} \approx 400$ times further than RK4, because its error is the compounding bias.

The practical lesson is the same for both: carry the attitude in double precision if you possibly can, and re-normalise every cycle whichever scheme you chose.
:::

::: example Reading a norm of 1.0003
A flight-software report says the quaternion norm reached $1.0003$ after $10^6$ RK4 steps. What has happened, what does it cost, and what do you do?

**What it costs.** The DCM is built from products of quaternion components, so the matrix that comes out is $\lVert\mathbf{q}\rVert^2$ times a true rotation: $1.0003^2 = 1.00060009$. Every vector sent through it is $0.060\,\%$ too long. And $\mathbf{C}^\top\mathbf{C} = 1.0006^2\,\mathbf{I} = 1.0012\,\mathbf{I}$ instead of $\mathbf{I}$, so it is not an orthonormal matrix at all. For a $7.7\,\mathrm{km/s}$ velocity turned into body axes, that is $7.7 \times 0.0006 = 0.0046\,\mathrm{km/s} = 4.6\,\mathrm{m/s}$ of pure fiction, and a navigation filter will absorb it as a sensor scale factor. This is a scale error, not a pointing error: the attitude itself may be perfectly good.

**What has happened.** Classical RK4 on the exact kinematic equation *shrinks* the norm for any $\theta$ below its stability limit of $2\sqrt{2}$. So growth to $1.0003$ is not RK4 truncation error. The realistic causes are single-precision arithmetic (a $10^6$-step random walk at 32-bit round-off lands in the $10^{-5}$ to $10^{-3}$ range, as the last example showed), a lower-order update hiding somewhere in the loop, or a corrupted $\boldsymbol{\omega}$ that makes the effective $\boldsymbol{\Omega}$ no longer skew.

**The two fixes.** Re-normalise every step, $\mathbf{q} \leftarrow \mathbf{q}/\lVert\mathbf{q}\rVert$ or its Newton form — cheap and standard. Or switch to the norm-preserving update $\mathbf{q}_{k+1} = \mathbf{q}_k \otimes \exp(\tfrac{1}{2}\boldsymbol{\omega}\Delta t)$, which has no norm error to remove by construction. Then find out which of the three causes it was, because the fix hides the symptom and the cause may be damaging something else.
:::

::: note Cost, for the record
Per step: forward Euler is one $4\times 4$ matrix times a 4-vector, 16 multiplies. Heun is two of those. RK4 is four, plus the weighted sum. The exponential map is one quaternion product — also 16 multiplies — plus one sine and one cosine, a few tens of cycles on a modern chip and maybe a table lookup on an older flight processor. For constant or slowly changing rates, the exponential map is both cheaper than RK4 and more accurate. That is why strapdown navigators use it, and spend their Runge–Kutta effort on the *rate* instead.
:::

## Check yourself

::: check
A vehicle rotates at a steady $200^\circ/\mathrm{s}$ and the attitude loop runs at 50 Hz. Compute $\theta$, then the norm drift after one hour for forward Euler, Heun and RK4.
:::

::: answer
$\lVert\boldsymbol{\omega}\rVert = 200^\circ/\mathrm{s} = 3.4907\,\mathrm{rad/s}$ and $\Delta t = 1/50 = 0.02\,\mathrm{s}$. So $\theta = 3.4907 \times 0.02/2 = 0.034907$. One hour at 50 Hz is $N = 3600 \times 50 = 180\,000$ steps.

**Forward Euler:** per-step factor $1 + \theta^2/2 = 1 + 6.093\times 10^{-4}$. The norm reaches $\exp(180\,000 \times 6.093\times 10^{-4}) = e^{109.7} \approx 4\times 10^{47}$. Unusable without re-normalisation; it would overflow single precision within a minute.

**Heun:** $1 + \theta^4/8 = 1 + 1.856\times 10^{-7}$, giving $\exp(180\,000 \times 1.856\times 10^{-7}) = e^{0.0334} = 1.034$. Three per cent, which becomes a seven per cent scale factor in the DCM ($1.034^2 = 1.069$) — bad, but slow enough that re-normalising once per cycle handles it.

**RK4:** $1 - \theta^6/144 = 1 - 1.256\times 10^{-11}$, giving $\exp(-180\,000 \times 1.256\times 10^{-11}) = 1 - 2.26\times 10^{-6}$. Small, but two parts per million of DCM scale error is already bigger than most star trackers' noise, so re-normalise anyway.
:::

::: check
Show that the exponential-map update matches the forward Euler update to first order in $\Delta t$, and state the first term where they differ.
:::

::: answer
Expand the step quaternion for small $\phi = \lVert\boldsymbol{\omega}\rVert\Delta t$, using the series from the guard:

$$
\exp\!\left(\tfrac{1}{2}\boldsymbol{\omega}\Delta t\right) = \begin{bmatrix}\cos(\phi/2)\\ \hat{\boldsymbol{\phi}}\sin(\phi/2)\end{bmatrix} = \begin{bmatrix}1 - \phi^2/8 + \cdots\\ \tfrac{1}{2}\boldsymbol{\omega}\Delta t\,(1 - \phi^2/24 + \cdots)\end{bmatrix}.
$$

To first order this is $[1,\ \tfrac{1}{2}\boldsymbol{\omega}\Delta t]$. Multiplying, $\mathbf{q}\otimes[1, \tfrac{1}{2}\boldsymbol{\omega}\Delta t] = \mathbf{q} + \tfrac{\Delta t}{2}\,\mathbf{q}\otimes[0,\boldsymbol{\omega}] = \mathbf{q} + \Delta t\,\mathbf{A}\mathbf{q}$ — exactly the forward Euler step.

The first difference is the $-\phi^2/8$ in the scalar part, second order in $\Delta t$. In norm language: Euler's factor is $1 + \theta^2/2$ where the exact factor is 1, and $\theta^2/2 = \phi^2/8$ since $\theta = \phi/2$ — the same term. Forward Euler *is* the exponential map with the norm correction deleted.
:::

::: check
Your propagator's norm drifts upward by $2\times 10^{-9}$ per step. You halve the step and the per-step drift falls to $5\times 10^{-10}$. What order is the leading norm error, and which of the four schemes fits?
:::

::: answer
Halving $\Delta t$ halves $\theta$. The drift fell by $2\times 10^{-9}/5\times 10^{-10} = 4 = 2^2$, so the per-step norm error scales as $\theta^2$. That is the forward Euler signature, $\theta^2/2$. Heun would have fallen by 16 and RK4 by 64, and the exponential map has no truncation part at all.

The sign agrees: upward growth rules out RK4, which shrinks the norm. So either the integrator really is a first-order Euler step, or — the more common bug — a higher-order scheme is fed a right-hand side that is only first-order correct, which leaves the same signature. Check whether $\boldsymbol{\omega}$ is re-evaluated at the in-between stage times or held at its start-of-step value.
:::

::: check
Explain why a single-precision exponential-map propagator drifted to $1 - 5.4\times 10^{-3}$ over $10^6$ steps while single-precision RK4 only reached $1 + 1.3\times 10^{-5}$, although the exponential map is the norm-preserving scheme.
:::

::: answer
For a constant rate, the exponential map multiplies by the *same* stored quaternion every step. In single precision that quaternion's norm is off by $\delta = -5.09\times 10^{-9}$, and the errors compound the same way every time: $(1 + \delta)^N \approx 1 + N\delta = 1 + 10^6 \times (-5.09\times 10^{-9}) = 1 - 5.09\times 10^{-3}$. That is close to the measured $-5.37\times 10^{-3}$; the rest is the extra rounding in each product.

RK4's round-off is a fresh rounding of a different number each step, with no fixed lean, so it adds up as a random walk: about $\sqrt{N}$ times the unit round-off, $1000 \times 5.96\times 10^{-8} = 6.0\times 10^{-5}$. The measured $1.3\times 10^{-5}$ is one run of that walk.

A steady bias beats a random walk by a factor of about $\sqrt{N}$, here a thousand. "Cannot drift in perfect arithmetic" says nothing about a fixed multiplier reused a million times. Re-normalise, or compute the multiplier in double precision.
:::

::: check
For constant $\boldsymbol{\omega}$, forward Euler with per-step re-normalisation is second-order accurate in attitude. Why does that not make it a reasonable choice for a real vehicle?
:::

::: answer
Because real vehicles do not have constant rates. The second-order result came from a cancellation special to the constant-rate case: Euler's first-order error points straight off the sphere, and re-normalisation throws it away. Once $\boldsymbol{\omega}$ varies across the step, sampling it only at the start adds an error of order $\dot{\boldsymbol{\omega}}\Delta t^2/2$ per step that points *along* the sphere, and re-normalisation cannot remove that. The swinging-rate case above shows the ratios falling from 4 to 2 — first order — and an error of $0.065^\circ$ after only 20 s at $\Delta t = 0.01\,\mathrm{s}$, which is enormous for an attitude propagator.

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
| Norm drift vs accuracy | Unrelated; measure accuracy as the angle of the error rotation |

The next lesson stops treating $\boldsymbol{\omega}$ as given. It attaches Euler's rotational equations to the kinematics, making a coupled seven-number state — quaternion plus body rate — whose conserved quantities give you checks this lesson had to borrow from an exact solution.

::: context predictor-corrector Guess, then fix the guess
A predictor–corrector method works like estimating a road trip. First guess where you will be using today's speed. Then look at the speed you would have *there*, and redo the trip with the average of the two speeds. The method is named after Karl Heun, a German mathematician who studied such schemes around 1900. It uses two slope evaluations per step and is second-order accurate: halve the step and the error falls by four.
:::

::: context strapdown-history Where the exponential map came from
Strapdown inertial navigators — gyros bolted to the vehicle rather than floating on gimbals — need to turn fast, jittery gyro samples into an attitude, many times a second. In 1971 John Bortz published a formulation built on the rotation vector: integrate the small turning vector over a short interval, then apply it as one exact rotation with the exponential map. Versions of that idea still run in aircraft, missile and launch-vehicle navigation systems today.
:::

::: context zero-over-zero When the formula divides nothing by nothing
With $\phi = 0$, both $\sin(\phi/2)$ and $\phi$ are zero, and a computer asked for $0/0$ returns "not a number", which then spreads through every later step. The true limit is fine: for tiny angles $\sin(\phi/2) \approx \phi/2$, so the ratio is $\tfrac{1}{2}$. The series in the guard gives that limit, and the next term, without ever dividing. A spacecraft sitting perfectly still on the launch pad, with a gyro reading of exactly zero, is precisely the case that triggers it.
:::

::: context round-off Numbers that cannot be stored exactly
A computer keeps only a fixed number of binary digits, so most results are rounded to the nearest number it can store. Around $1$, double-precision numbers are spaced about $2.2\times 10^{-16}$ apart, and single-precision numbers about $1.2\times 10^{-7}$ apart. Each rounding is tiny, but a simulation performs millions of them, and they add up.
:::

::: context step-arrows Short, long and exact
Each scheme's step as an arrow from the centre (angle exaggerated to $\theta = 0.6$). Euler's arrow is long but turns too little. Heun's is nearly the right length but turns a little too far. The exponential map lands exactly on the circle at angle $\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M 180 160 A 120 120 0 0 0 124.8 59.0" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <line x1="60" y1="160" x2="200" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="60" cy="160" r="3" fill="#1f2a44"/>
  <line x1="180" y1="160" x2="180" y2="88" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="60" y1="160" x2="180" y2="88" stroke="#b4232c" stroke-width="2"/>
  <line x1="60" y1="160" x2="159.0" y2="92.2" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="160" x2="158.4" y2="88" stroke="#f2b880" stroke-width="2"/>
  <circle cx="180" cy="88" r="4" fill="#b4232c"/>
  <circle cx="159.0" cy="92.2" r="4" fill="#1d6fd1"/>
  <circle cx="158.4" cy="88" r="3" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="190" y="92" font-size="12" fill="#b4232c">Euler (31.0°)</text>
  <text x="160" y="72" font-size="12" fill="#1f2a44">Heun (36.2°)</text>
  <text x="190" y="120" font-size="12" fill="#1d6fd1">exact: e^(iθ) (34.4°)</text>
  <text x="200" y="175" font-size="12" fill="#1f2a44">start, angle 0</text>
</svg>
```
:::

::: context random-walk Straight lines beat staggering
A **random walk** is what you get when each step goes a random way: after $N$ steps you are typically only about $\sqrt{N}$ steps from the start, because many steps cancel. A **bias** — the same small push every time — never cancels, so it grows like $N$. After a million steps, $N$ is a thousand times bigger than $\sqrt{N}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="330" y2="30" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="50,150 61.2,145.2 94.8,140.4 150.8,135.6 229.2,130.8 330,126" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="230" y="60" font-size="12" fill="#b4232c">bias: grows like N</text>
  <text x="230" y="118" font-size="12" fill="#1d6fd1">random walk: √N</text>
  <text x="190" y="170" font-size="12" text-anchor="middle" fill="#1f2a44">number of steps N (0 to 25)</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">25</text>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
</svg>
```
:::

::: context coning-bridge A preview of coning
When the spin axis itself wobbles around in a cone — a rocket's rate vector during vibration, say — even a perfect per-step rotation built from one rate sample misses a small extra turn each step, because rotations about different axes do not commute. That leftover always adds in the same direction, so it grows steadily. Lesson 10 derives it and shows the multi-sample corrections that recover it.
:::
