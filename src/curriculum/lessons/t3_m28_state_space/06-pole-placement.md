---
id: l06-pole-placement
title: Pole placement — Ackermann, Bass-Gura and robust eigenstructure
minutes: 18
covers:
  - "Pole placement: Ackermann, Bass-Gura, and robust (eigenstructure) pole placement"
---

State feedback is the simplest control law in this module and the most powerful: measure the whole state, multiply by a constant matrix, subtract. Write $\mathbf{u} = -\mathbf{K}\mathbf{x}$ and the plant $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ becomes

$$\dot{\mathbf{x}} = (\mathbf{A} - \mathbf{B}\mathbf{K})\,\mathbf{x}.$$

Whatever the closed-loop behaviour is going to be, it is decided entirely by the eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$, and Lesson 3 already told you how to read them: real parts set decay rates, imaginary parts set ringing frequencies, the slowest mode sets the settling time. The remarkable theorem of this lesson is that for a controllable pair you can put those eigenvalues **anywhere you like**, and there are closed-form expressions for the $\mathbf{K}$ that does it.

The theorem is also a trap, and this lesson spends as much space on the trap as on the formulas. "Anywhere you like" is a statement about arithmetic, not about hardware. The gain required grows with the distance you move the poles, and with it the control effort, the amplification of sensor noise, and the bandwidth at which the loop is relying on a model you do not have. Pole placement will return a beautifully conditioned answer for a design that saturates its wheels in the first second, and the arithmetic will not warn you.

This lesson proves the placement theorem, derives the Bass-Gura and Ackermann formulas for a single input, works out exactly what faster poles cost on a real spacecraft axis, and then handles the multi-input case, where $\mathbf{K}$ is not unique and the extra freedom buys robustness.

## Controllability is exactly the right condition

One direction is a two-line proof and it is the one worth knowing. Suppose mode $\lambda$ is uncontrollable, so by PBH there is a left eigenvector $\mathbf{w}$ with $\mathbf{w}^\mathsf{T}\mathbf{A} = \lambda\mathbf{w}^\mathsf{T}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}^\mathsf{T}$. Then for *any* gain matrix $\mathbf{K}$,

$$\mathbf{w}^\mathsf{T}(\mathbf{A} - \mathbf{B}\mathbf{K}) = \lambda\mathbf{w}^\mathsf{T} - (\mathbf{w}^\mathsf{T}\mathbf{B})\mathbf{K} = \lambda\mathbf{w}^\mathsf{T}.$$

So $\lambda$ is still an eigenvalue of the closed loop, with the same left eigenvector. No feedback of any size moves it. If $\lambda$ is unstable, no state feedback stabilises the plant — which is the theorem that makes stabilizability, not controllability, the minimum requirement.

The converse is the placement theorem: if $(\mathbf{A},\mathbf{B})$ is controllable, then for any self-conjugate set of $n$ desired eigenvalues there exists a real $\mathbf{K}$ placing them. "Self-conjugate" means complex values come in conjugate pairs, which is forced because $\mathbf{A} - \mathbf{B}\mathbf{K}$ is real. The constructive proof is the next section.

## Placement in controllable canonical form

Put the plant in the controllable canonical form of Lesson 1 and everything becomes arithmetic on one row. With

$$\mathbf{A}_c = \begin{pmatrix}0&1&\cdots&0\\ \vdots&&\ddots&\vdots\\ 0&0&\cdots&1\\ -a_0&-a_1&\cdots&-a_{n-1}\end{pmatrix}, \qquad \mathbf{B}_c = \begin{pmatrix}0\\\vdots\\0\\1\end{pmatrix},$$

the product $\mathbf{B}_c\mathbf{K}_c$ has non-zero entries only in its last row, so $\mathbf{A}_c - \mathbf{B}_c\mathbf{K}_c$ is again a companion matrix whose last row is $-(a_0 + k_1,\ a_1 + k_2,\ \dots,\ a_{n-1} + k_n)$. Its characteristic polynomial is therefore $s^n + (a_{n-1}+k_n)s^{n-1} + \cdots + (a_0 + k_1)$. Matching it to the desired polynomial $s^n + \alpha_{n-1}s^{n-1} + \cdots + \alpha_0$ gives

$$k_{i+1} = \alpha_i - a_i, \qquad i = 0,\dots,n-1.$$

The gain in canonical coordinates is the coefficient-by-coefficient difference between where the characteristic polynomial is and where you want it. That is the whole of single-input pole placement; the rest is bookkeeping to get back to physical coordinates.

### Bass-Gura

Lesson 2 gave the transform: $\mathbf{x} = \mathbf{T}\mathbf{z}$ with $\mathbf{T} = \mathbf{C}_m\left(\mathbf{C}_m^{(c)}\right)^{-1}$, so $\mathbf{u} = -\mathbf{K}_c\mathbf{z} = -\mathbf{K}_c\mathbf{T}^{-1}\mathbf{x}$ and $\mathbf{K} = \mathbf{K}_c\mathbf{T}^{-1}$. Writing $\mathbf{C}_m^{(c)} = \mathbf{W}$, where

$$\mathbf{W} = \begin{pmatrix} a_1 & a_2 & \cdots & a_{n-1} & 1 \\ a_2 & a_3 & \cdots & 1 & 0 \\ \vdots & & \reflectbox{$\ddots$} & & \vdots \\ a_{n-1} & 1 & \cdots & 0 & 0 \\ 1 & 0 & \cdots & 0 & 0\end{pmatrix}$$

is the Hankel matrix of the open-loop coefficients, the result is the **Bass-Gura formula**

$$\mathbf{K} = \left(\alpha_0 - a_0,\ \alpha_1 - a_1,\ \dots,\ \alpha_{n-1}-a_{n-1}\right)\left(\mathbf{C}_m\mathbf{W}\right)^{-1}.$$

### Ackermann

Ackermann's formula packages the same answer without building $\mathbf{W}$. Let $\alpha_d(s) = s^n + \alpha_{n-1}s^{n-1} + \cdots + \alpha_0$ be the desired polynomial and $\alpha_d(\mathbf{A})$ the matrix you get by substituting $\mathbf{A}$ for $s$.

::: key Ackermann formula
$\mathbf{K} = \begin{pmatrix}0 & \cdots & 0 & 1\end{pmatrix}\mathbf{C}_m^{-1}\,\alpha_d(\mathbf{A})$, where $\alpha_d$ is the desired characteristic polynomial. Elegant, single-input only, and numerically poor above about $n = 10$ — use a robust eigenstructure routine instead.
:::

The derivation is worth seeing once, because it explains where $\mathbf{C}_m^{-1}$ comes from. Write $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$ and expand its powers, keeping every $\mathbf{B}$ visible:

$$\mathbf{A}_{cl}^2 = \mathbf{A}^2 - \mathbf{A}\mathbf{B}\mathbf{K} - \mathbf{B}\mathbf{K}\mathbf{A}_{cl}, \qquad \mathbf{A}_{cl}^3 = \mathbf{A}^3 - \mathbf{A}^2\mathbf{B}\mathbf{K} - \mathbf{A}\mathbf{B}\mathbf{K}\mathbf{A}_{cl} - \mathbf{B}\mathbf{K}\mathbf{A}_{cl}^2,$$

and so on. Form $\alpha_d(\mathbf{A}_{cl})$ by taking the combination $\sum_j\alpha_j\mathbf{A}_{cl}^j$ (with $\alpha_n = 1$). Cayley–Hamilton says $\alpha_d(\mathbf{A}_{cl}) = \mathbf{0}$, because $\alpha_d$ is by construction the characteristic polynomial of $\mathbf{A}_{cl}$. Collecting the terms by which power of $\mathbf{A}$ multiplies $\mathbf{B}$ from the left,

$$\mathbf{0} = \alpha_d(\mathbf{A}) - \left[\mathbf{B},\ \mathbf{A}\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}\right]\begin{pmatrix}\ast\\\vdots\\\ast\\\mathbf{K}\end{pmatrix},$$

where the entries marked $\ast$ are messy combinations of $\mathbf{K}$ and $\mathbf{A}_{cl}$ that you never need — the last one is exactly $\mathbf{K}$, because only the $j$-th power contributes a bare $\mathbf{B}\mathbf{K}\mathbf{A}_{cl}^{j-1}$ term and the highest such is picked out by $\alpha_n = 1$. Multiplying on the left by the last row of $\mathbf{C}_m^{-1}$ annihilates everything above and leaves $\mathbf{K}$.

::: example Placing the gimbal's poles by hand, two ways
Take the antenna gimbal of Lesson 1: $\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}$, $\mathbf{B} = (0,0,50)^\mathsf{T}$, with open-loop polynomial $s^3 + 50.5s^2 + 25s$, so $a_0 = 0$, $a_1 = 25$, $a_2 = 50.5$. Ask for closed-loop poles at $-2\pm2i$ and $-20\ \mathrm{s^{-1}}$: a pointing loop with a $0.5\,\mathrm{s}$ envelope time constant and damping $\zeta = 1/\sqrt{2}$, plus a fast real pole that keeps the motor state from lagging. The desired polynomial is

$$(s^2 + 4s + 8)(s + 20) = s^3 + 24s^2 + 88s + 160,$$

so $\alpha_0 = 160$, $\alpha_1 = 88$, $\alpha_2 = 24$. In canonical coordinates,

$$\mathbf{K}_c = (\alpha_0 - a_0,\ \alpha_1 - a_1,\ \alpha_2 - a_2) = (160,\ 63,\ -26.5).$$

Lesson 2 computed $\mathbf{T}^{-1} = \begin{pmatrix}0.016&0&0\\0&0.016&0\\0&-0.008&0.02\end{pmatrix}$ for this plant, so

$$\mathbf{K} = \mathbf{K}_c\mathbf{T}^{-1} = \left(160(0.016),\ \ 63(0.016) + (-26.5)(-0.008),\ \ -26.5(0.02)\right) = (2.56,\ 1.22,\ -0.53).$$

Ackermann's formula on the physical model returns $(2.56,\ 1.22,\ -0.53)$ to every digit, and so does Bass-Gura; the eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ come back as $-2\pm2i$ and $-20$.

Read the gains. $k_1 = 2.56\,\mathrm{N\,m/rad}$ is a position stiffness — $0.045\,\mathrm{N\,m}$ per degree of error. $k_2 = 1.22\,\mathrm{N\,m\,s/rad}$ is rate damping, three times the natural bearing friction of $0.4$. And $k_3 = -0.53$ is **negative** feedback of the motor-torque state with a minus sign, which is positive feedback on $\tau$: the controller is partially cancelling the actuator's own lag so the loop can be faster than the $20\,\mathrm{ms}$ motor pole would otherwise allow. That is a legitimate and common trick, and it is also a warning sign — cancelling a pole you do not know accurately is how a design that works in simulation fails on hardware.
:::

## What faster poles cost

Take the single spacecraft axis: $J = 120\,\mathrm{kg\,m^2}$, $\mathbf{x} = (\theta,\omega)$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = (0,1/J)^\mathsf{T}$, and place the two poles at $-a(1\pm i)$ for a sweep of $a$. With $\mathbf{K} = (k_1, k_2)$,

$$\mathbf{A} - \mathbf{B}\mathbf{K} = \begin{pmatrix}0&1\\-k_1/J & -k_2/J\end{pmatrix}, \qquad \text{char poly } s^2 + \frac{k_2}{J}s + \frac{k_1}{J}.$$

The desired pair has sum $-2a$ and product $a^2 + a^2 = 2a^2$, so the desired polynomial is $s^2 + 2as + 2a^2$ and

$$k_1 = 2a^2J, \qquad k_2 = 2aJ.$$

Every pole location in this family has $\omega_n = |\lambda| = a\sqrt{2}$ and $\zeta = a/(a\sqrt{2}) = 1/\sqrt{2} = 0.707$, and for $\zeta = 0.707$ the closed-loop $-3\,\mathrm{dB}$ bandwidth is exactly $\omega_n$. So $a$ is a clean bandwidth knob, and the gain on position grows as $a^2$ while the gain on rate grows as $a$.

::: example Three walls that stop you going faster
Recovering from a $\theta_0 = 5^\circ = 0.08727\,\mathrm{rad}$ attitude error with $\mathbf{u} = -\mathbf{K}\mathbf{x}$, the torque is largest at $t = 0$ before any rate has built up, so the peak demand is

$$|u|_{\max} = k_1\theta_0 = 2a^2J\theta_0 \propto a^2.$$

At $a = 1\,\mathrm{rad/s}$ that is $2(1)(120)(0.08727) = 20.9\,\mathrm{N\,m}$. Fit a log-log line through a sweep of $a$ and the slope is exactly $2$: the price of speed is quadratic, not linear.

**Wall one, actuator saturation.** Four pyramid wheels supply about $0.2\,\mathrm{N\,m}$ about a single axis. Setting $2a^2J\theta_0 \le 0.2$ gives $a \le \sqrt{0.2/(2\times120\times0.08727)} = 0.098\,\mathrm{rad/s}$. Beyond that the wheels saturate on the first sample of a $5^\circ$ error, the loop stops being linear, every margin computed from $\mathbf{A}-\mathbf{B}\mathbf{K}$ becomes fiction, and the integrator you add in Lesson 9 winds up.

**Wall two, noise amplification.** A star tracker with $10'' = 4.85\times10^{-5}\,\mathrm{rad}$ of noise per axis is multiplied by $k_1$ straight into the torque command. Requiring $2a^2J\sigma_\theta \le 0.2\,\mathrm{N\,m}$ — that is, the wheels should not spend their whole authority chasing noise — gives $a \le 4.15\,\mathrm{rad/s}$. That wall is further out than the first one here, but it moves in fast when the sensor is poorer or the plant lighter, and long before saturation you are heating wheel bearings and injecting jitter into the payload.

**Wall three, model validity.** The design model has two states. The real vehicle has solar arrays whose first bending mode is near $0.35\,\mathrm{Hz} = 2.20\,\mathrm{rad/s}$, a control period, a filter, and a wheel torque lag. Keeping the closed-loop bandwidth $\omega_n = a\sqrt{2}$ a factor of three below the first flex mode gives $a \le 0.52\,\mathrm{rad/s}$. Push past it and the controller is commanding motion at frequencies where its model of the vehicle is wrong, which is the classic way to destabilise a flexible spacecraft.

The binding constraint here is the first: $a \approx 0.1\,\mathrm{rad/s}$, a closed-loop bandwidth of $0.14\,\mathrm{rad/s}$ and a settling time of around a minute. That is what a spacecraft attitude loop actually looks like, and no amount of pole placement changes it.
:::

::: warning Placing poles says nothing about margins
Pole placement fixes the closed-loop eigenvalues of the nominal model. It does not bound the sensitivity function, does not give you a gain or phase margin, and does not tell you what happens when $J$ is $20\,\%$ off. Two gain matrices can place identical poles and have wildly different robustness, as the next section shows. After any placement, compute the margins — or the peak of the sensitivity function — the way the classical control module does, and check the design against the parameter spread you expect.
:::

## Multi-input placement: the freedom and what to do with it

With $m > 1$ inputs, $\mathbf{K}$ has $mn$ entries and the $n$ eigenvalue conditions cannot pin them all down. The gain is not unique, and the surplus $n(m-1)$ degrees of freedom are a resource.

The clean way to use them is **eigenstructure assignment**, which chooses the closed-loop eigen*vectors* as well as the eigenvalues. Ask for $(\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{v}_i = \lambda_i\mathbf{v}_i$ and rearrange:

$$\mathbf{A}\mathbf{v}_i + \mathbf{B}\mathbf{g}_i = \lambda_i\mathbf{v}_i \iff \left[\mathbf{A}-\lambda_i\mathbf{I},\ \ \mathbf{B}\right]\begin{pmatrix}\mathbf{v}_i\\\mathbf{g}_i\end{pmatrix} = \mathbf{0}, \qquad \mathbf{g}_i = -\mathbf{K}\mathbf{v}_i.$$

The matrix $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]$ is $n\times(n+m)$, so its null space has dimension $m$ whenever the PBH condition holds — which is exactly the controllability requirement again, now visible as "there is somewhere to choose from". Pick one null vector per desired eigenvalue, taking conjugate vectors for conjugate eigenvalues so that the result is real, assemble $\mathbf{V} = [\mathbf{v}_1 \cdots \mathbf{v}_n]$ and $\mathbf{G} = [\mathbf{g}_1\cdots\mathbf{g}_n]$, and solve

$$\mathbf{K} = -\mathbf{G}\mathbf{V}^{-1}.$$

Every valid choice places the poles exactly. **Robust pole placement** picks the choice that makes $\mathbf{V}$ as well conditioned as possible, and the reason is the Bauer–Fike bound: for a diagonalisable closed loop, a perturbation $\Delta\mathbf{A}$ moves each eigenvalue by at most $\operatorname{cond}(\mathbf{V})\,\|\Delta\mathbf{A}\|$. A closed loop whose eigenvectors are nearly parallel is one whose poles fly apart under a small modelling error, whatever the nominal plot shows. The Kautsky–Nichols algorithm sweeps the $\mathbf{v}_i$ one at a time, replacing each with the vector in its allowed subspace that is most nearly orthogonal to the others.

::: example Six poles on the pyramid spacecraft, two ways
Place all six eigenvalues of the spacecraft model — $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$, $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$, four wheels — at $\zeta = 0.707$ with natural frequencies $0.04$, $0.05$ and $0.06\,\mathrm{rad/s}$. Six random admissible choices of the $\mathbf{v}_i$, and one Kautsky–Nichols sweep, all place the poles to within $10^{-15}$:

| choice | $\operatorname{cond}(\mathbf{V})$ | $\|\mathbf{K}\|_F$ |
| --- | --- | --- |
| random seed 0 | 72 | 179 |
| random seed 1 | 820 | 578 |
| random seed 3 | 1121 | 328 |
| random seed 4 | 953 | 1033 |
| conditioned sweep | 38 | 164 |

Now perturb the model the way reality does: increase $J_x$ by $20\,\%$, as would happen if a propellant mass were mis-estimated, and recompute the closed-loop eigenvalues with each gain unchanged. The conditioned design's poles move by at most $0.0048\,\mathrm{s^{-1}}$ and its worst damping ratio falls from $0.707$ to $0.654$. The worst random design's poles move by $0.0140\,\mathrm{s^{-1}}$ — three times as far — and its damping falls to $0.611$, with its slowest pole $16\,\%$ closer to the imaginary axis. Same nominal poles, same specification met on paper, measurably different vehicles.

The conditioned design is also the one with the smallest gain matrix, which is typical but not guaranteed: minimising $\operatorname{cond}(\mathbf{V})$ and minimising $\|\mathbf{K}\|$ are different objectives that usually point the same way.
:::

```python
import numpy as np

def ctrb(A, B):
    return np.hstack([np.linalg.matrix_power(A, j) @ B for j in range(A.shape[0])])

def ackermann(A, B, poles):
    n = A.shape[0]
    coeffs = np.poly(np.asarray(poles, complex)).real     # [1, a_{n-1}, ..., a_0]
    P = np.zeros((n, n))
    for c in coeffs:                                      # Horner on matrices
        P = P @ A + c * np.eye(n)
    e_n = np.zeros((1, n)); e_n[0, -1] = 1.0
    return e_n @ np.linalg.inv(ctrb(A, B)) @ P

A = np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]])
B = np.array([[0.0], [0], [50]])
K = ackermann(A, B, [-2 + 2j, -2 - 2j, -20])
print("K =", np.round(K, 6))
print("closed-loop eigenvalues:", np.sort_complex(np.linalg.eigvals(A - B @ K)))
# K = [[ 2.56  1.22 -0.53]]
# closed-loop eigenvalues: [-20.+0.j  -2.-2.j  -2.+2.j]
```

::: note Choosing the pole pattern
Three habits cover most designs. Pick a dominant pair with $\zeta$ between $0.6$ and $0.8$ — $0.707$ gives about $4\,\%$ overshoot — and set its $\omega_n$ from the settling time you need, roughly $4.6/(\zeta\omega_n)$ to one percent. Place the remaining poles three to five times faster, so they contribute a brief transient and nothing else, but no faster than the model supports. And check the result against the open-loop poles: a design that moves a pole by a factor of a hundred is asking for gains a hundred times larger than the plant's own dynamics, which is almost always a sign that the specification, the actuator, or the model needs revisiting rather than the gain.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \begin{pmatrix}0&1\\6&-1\end{pmatrix}$ and $\mathbf{B} = (0,1)^\mathsf{T}$ — an inverted-pendulum-like system with an unstable open-loop pole. Find $\mathbf{K}$ placing the closed-loop poles at $-3\pm3i$.
:::

::: answer
The open-loop polynomial is $\det(s\mathbf{I}-\mathbf{A}) = s^2 + s - 6 = (s+3)(s-2)$, so the open loop has a pole at $+2\,\mathrm{s^{-1}}$: unstable, doubling every $0.35\,\mathrm{s}$. The pair is already in controllable canonical form with $a_0 = -6$, $a_1 = 1$. Desired: $(s+3)^2 + 9 = s^2 + 6s + 18$, so $\alpha_0 = 18$, $\alpha_1 = 6$. Then $k_1 = \alpha_0 - a_0 = 18 + 6 = 24$ and $k_2 = \alpha_1 - a_1 = 6 - 1 = 5$, giving $\mathbf{K} = (24\ \ 5)$. Checking: $\mathbf{A}-\mathbf{B}\mathbf{K} = \begin{pmatrix}0&1\\-18&-6\end{pmatrix}$, trace $-6$ and determinant $18$, so the polynomial is $s^2+6s+18$ as required.
:::

::: check
Why can you not place the poles of a plant with $\mathbf{A} = \operatorname{diag}(-1, +0.5)$ and $\mathbf{B} = (1, 0)^\mathsf{T}$, and what is the consequence?
:::

::: answer
The second mode has no input path: $\mathbf{C}_m = [\mathbf{B}, \mathbf{A}\mathbf{B}] = \begin{pmatrix}1&-1\\0&0\end{pmatrix}$ has rank $1$. PBH at $\lambda = +0.5$ gives a left eigenvector $\mathbf{w} = (0,1)^\mathsf{T}$ with $\mathbf{w}^\mathsf{T}\mathbf{B} = 0$, so $\mathbf{w}^\mathsf{T}(\mathbf{A}-\mathbf{B}\mathbf{K}) = 0.5\,\mathbf{w}^\mathsf{T}$ for every $\mathbf{K}$: the pole stays at $+0.5$ no matter what. Since the uncontrollable mode is unstable, the plant is not stabilizable and no state feedback exists that works. The consequence is that this is a hardware problem, not a control problem — you need an actuator with a path into that mode.
:::

::: check
A design places the poles of the $J = 120\,\mathrm{kg\,m^2}$ axis at $-a(1\pm i)$ with $a = 0.3\,\mathrm{rad/s}$. Give $\mathbf{K}$, the closed-loop bandwidth, the peak torque for a $2^\circ$ initial error, and the torque produced by $10''$ of star tracker noise.
:::

::: answer
$k_1 = 2a^2J = 2(0.09)(120) = 21.6\,\mathrm{N\,m/rad}$ and $k_2 = 2aJ = 72\,\mathrm{N\,m\,s/rad}$. Bandwidth $\omega_n = a\sqrt{2} = 0.424\,\mathrm{rad/s}$, about $0.0675\,\mathrm{Hz}$; settling to $1\,\%$ takes about $4.6/(0.707\times0.424) = 15.3\,\mathrm{s}$. Peak torque for $\theta_0 = 2^\circ = 0.0349\,\mathrm{rad}$: $21.6\times0.0349 = 0.754\,\mathrm{N\,m}$, which still exceeds a $0.2\,\mathrm{N\,m}$ wheel set, so the recovery will be rate-limited rather than linear. Noise torque: $21.6\times4.85\times10^{-5} = 1.05\times10^{-3}\,\mathrm{N\,m}$, half a percent of authority, which is acceptable. Saturation is the binding problem, as it usually is at low bandwidth.
:::

::: check
Two multi-input designs place identical closed-loop poles. One has $\operatorname{cond}(\mathbf{V}) = 40$, the other $\operatorname{cond}(\mathbf{V}) = 1100$. What do you expect to differ, and how would you demonstrate it?
:::

::: answer
The nominal step responses will be similar, because the poles are the same; what differs is sensitivity. By Bauer–Fike, an unmodelled perturbation $\Delta\mathbf{A}$ moves the eigenvalues by at most $\operatorname{cond}(\mathbf{V})\|\Delta\mathbf{A}\|$, so the second design's poles can move roughly $27$ times further for the same error. The eigenvectors of the second are nearly parallel, which also means large transient overshoot in the state even when every eigenvalue is well damped. Demonstrate it by perturbing the plant the way reality will — inertia off by $20\,\%$, an actuator gain off by $10\,\%$, a misalignment — and plotting the closed-loop eigenvalues of both designs; then compute the gain and phase margins at each input, and the peak of the sensitivity function.
:::

::: check
Why is Ackermann's formula a poor choice for a 20-state flexible launch vehicle model, and what would you use instead?
:::

::: answer
Three reasons. It is single-input only, and a launch vehicle has at least pitch and yaw gimbal commands. It needs $\mathbf{C}_m^{-1}$, and for $n = 20$ the controllability matrix contains $\mathbf{A}^{19}$, so its condition number is effectively unbounded and the inverse is meaningless. And it goes through the characteristic polynomial, whose coefficients are an ill-conditioned representation of 20 roots spread over several decades of frequency — a change in the last digit of one coefficient can move a pole visibly. Use an eigenstructure-assignment routine that works directly with the null spaces of $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]$ and conditions $\mathbf{V}$, on a scaled model, or move to an optimal-control formulation where the gain comes from a Riccati equation instead of a polynomial.
:::

## Summary

| Item | Statement |
| --- | --- |
| State feedback | $\mathbf{u} = -\mathbf{K}\mathbf{x}$ gives $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x}$ |
| Placement theorem | $(\mathbf{A},\mathbf{B})$ controllable $\iff$ the eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ can be placed arbitrarily |
| Uncontrollable mode | $\mathbf{w}^\mathsf{T}\mathbf{B} = 0 \Rightarrow \mathbf{w}^\mathsf{T}(\mathbf{A}-\mathbf{B}\mathbf{K}) = \lambda\mathbf{w}^\mathsf{T}$: unmoved by any $\mathbf{K}$ |
| Canonical form | $k_{i+1} = \alpha_i - a_i$, desired coefficients minus open-loop coefficients |
| Bass-Gura | $\mathbf{K} = (\alpha_0-a_0,\dots,\alpha_{n-1}-a_{n-1})(\mathbf{C}_m\mathbf{W})^{-1}$, $\mathbf{W}$ Hankel in the $a_i$ |
| Ackermann | $\mathbf{K} = (0\cdots0\ 1)\mathbf{C}_m^{-1}\alpha_d(\mathbf{A})$; single input only |
| Double integrator | poles at $-a(1\pm i)$ give $\mathbf{K} = (2a^2J,\ 2aJ)$, $\omega_n = a\sqrt{2}$, $\zeta = 0.707$ |
| Price of speed | peak torque $2a^2J\theta_0 \propto a^2$; noise torque $\propto a^2$; bandwidth $\propto a$ |
| Three walls | actuator saturation, sensor-noise amplification, model validity above the flex modes |
| MIMO | $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]\begin{pmatrix}\mathbf{v}_i\\\mathbf{g}_i\end{pmatrix} = \mathbf{0}$, $\mathbf{K} = -\mathbf{G}\mathbf{V}^{-1}$; freedom is $n(m-1)$ |
| Robust placement | minimise $\operatorname{cond}(\mathbf{V})$; Bauer–Fike: $|\Delta\lambda| \le \operatorname{cond}(\mathbf{V})\|\Delta\mathbf{A}\|$ |

All of this assumed you can measure the entire state. On a real vehicle you measure attitude and perhaps rate, not wheel torque, not flex-mode amplitude, not gyro bias. The next lesson builds the machine that manufactures the missing states, and shows that its error dynamics are a placement problem in disguise.
