---
id: l03-h2-and-hinf-norms
title: The H2 and H-infinity norms
minutes: 17
covers:
  - The H2 and H-infinity norms and what each one measures
---

Two numbers summarise a whole transfer matrix, and almost every modern control method is the minimisation of one of them. LQG minimises an H2 norm. Robust synthesis minimises an H-infinity norm. The small gain theorem of the last lesson is an H-infinity statement, and the weight-covering of the lesson before that is an H-infinity statement in disguise. Knowing which norm a design method optimises tells you immediately what it is protecting you from and what it is ignoring.

The distinction is the difference between *average* and *worst case*. The H2 norm is a root-mean-square: the size of the output when the input is broadband noise that never stops — sensor noise, aerodynamic turbulence, reaction-wheel imbalance, the daily grind of a vehicle in service. The H-infinity norm is a supremum: the largest amplification of any single input signal of bounded energy — one gust, one thruster misfire, one unknown perturbation deliberately shaped by an adversary to hurt you. A design optimal in the first sense can be terrible in the second, and that single fact is why the loop-transfer-recovery patches and the "LQG has no guaranteed margins" result of the optimal control module exist.

This lesson defines both norms for single-input and multivariable systems, shows what each one physically measures with units attached, gives the closed forms for the systems you meet most, and shows how to compute both from a state-space model with nothing but linear algebra — a Lyapunov equation for one and a Hamiltonian eigenvalue test for the other.

## Signal norms first

A system norm is an induced signal norm or an average, so the signals come first. For a vector signal $y(t)$ defined for $t \ge 0$, the **energy** or 2-norm is

$$\lVert y\rVert_2 = \left(\int_0^\infty y(t)^\mathsf{T}y(t)\,dt\right)^{1/2},$$

finite only for signals that decay. A step or a persistent sinusoid has infinite energy; a gust, an impulse, a transient manoeuvre does not. For signals that persist, the right measure is **power**, the mean square $\lim_{T\to\infty}\frac{1}{T}\int_0^T y^\mathsf{T}y\,dt$, and its square root is the RMS value. Parseval's theorem connects the time and frequency pictures: $\lVert y\rVert_2^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}y(j\omega)^\mathsf{H}y(j\omega)\,d\omega$, with $(\cdot)^\mathsf{H}$ the conjugate transpose.

## The H-infinity norm

::: key H-infinity norm
For a stable transfer matrix $\mathbf{G}(s)$,

$$\lVert\mathbf{G}\rVert_\infty = \sup_\omega\ \bar{\sigma}\big(\mathbf{G}(j\omega)\big),$$

the peak over frequency of the largest singular value. For a SISO system this is the peak of $\lvert G(j\omega)\rvert$ — the highest point of the Bode magnitude plot. It equals the induced 2-norm, the worst-case energy gain: $\lVert\mathbf{G}\rVert_\infty = \sup_{u \ne 0}\lVert y\rVert_2/\lVert u\rVert_2$.
:::

The singular values here are exactly those of the linear algebra module, applied to the complex matrix $\mathbf{G}(j\omega)$ one frequency at a time. Write the decomposition $\mathbf{G}(j\omega) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$ with $\mathbf{U}, \mathbf{V}$ unitary; then $\bar{\sigma} = \sigma_1$ is the gain in the best input direction $\mathbf{v}_1$ and $\underline{\sigma} = \sigma_m$ the gain in the worst direction. The H-infinity norm asks for the largest gain over *both* frequency and direction.

That the supremum of $\bar{\sigma}$ really is the induced energy gain follows from Parseval in two steps. Upper bound: for any input,

$$\lVert y\rVert_2^2 = \frac{1}{2\pi}\int u^\mathsf{H}\mathbf{G}^\mathsf{H}\mathbf{G}u\,d\omega \le \frac{1}{2\pi}\int\bar{\sigma}(\mathbf{G})^2\,u^\mathsf{H}u\,d\omega \le \Big(\sup_\omega\bar{\sigma}\Big)^2\lVert u\rVert_2^2 .$$

Lower bound: concentrate the input's energy in a narrow band around the maximising frequency $\omega_0$ and align it with $\mathbf{v}_1(j\omega_0)$; the ratio approaches $\bar{\sigma}(\mathbf{G}(j\omega_0))$ as the band narrows. So the supremum is attained in the limit, and the norm is genuinely induced.

Two consequences follow at once and both get used constantly. Being an induced norm, it is **submultiplicative**: $\lVert\mathbf{G}\mathbf{H}\rVert_\infty \le \lVert\mathbf{G}\rVert_\infty\lVert\mathbf{H}\rVert_\infty$ — the step the small gain proof needed. And a constant matrix is a legitimate stable system, with $\lVert\mathbf{A}\rVert_\infty = \bar{\sigma}(\mathbf{A})$, so a feedthrough term $\mathbf{D}$ contributes to the norm rather than breaking it.

Some standard peaks worth knowing. For a first-order lag $a/(s+a)$ the peak is at DC and $\lVert G\rVert_\infty = 1$, regardless of $a$. For a second-order system $\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ with $\zeta < 1/\sqrt{2}$,

$$\lVert G\rVert_\infty = \frac{1}{2\zeta\sqrt{1 - \zeta^2}},$$

so $\zeta = 0.005$ gives exactly $100.0$ and $\zeta = 0.002$ gives $250.0$. For the sensitivity function, $\lVert S\rVert_\infty$ is the reciprocal of the shortest distance from the Nyquist plot of the loop gain to the critical point $-1$, which is why it reappears as the central quantity in the disk margin lesson.

## The H2 norm

::: key H2 norm
For a stable, strictly proper $\mathbf{G}(s)$,

$$\lVert\mathbf{G}\rVert_2 = \left(\frac{1}{2\pi}\int_{-\infty}^{\infty}\operatorname{tr}\big(\mathbf{G}(j\omega)^\mathsf{H}\mathbf{G}(j\omega)\big)\,d\omega\right)^{1/2} = \left(\int_0^\infty\operatorname{tr}\big(\mathbf{g}(t)^\mathsf{T}\mathbf{g}(t)\big)\,dt\right)^{1/2},$$

with $\mathbf{g}(t)$ the impulse-response matrix. It is the RMS value of the output when the input is white noise of unit intensity, and it is what LQG minimises.
:::

The three readings of this one number are worth separating.

**Impulse-response energy.** The time-domain form says $\lVert\mathbf{G}\rVert_2^2$ is the total energy in the outputs when each input in turn is hit with a unit impulse and the results are summed. It is a measure of how much a system rings.

**Stochastic RMS.** Drive the system with white noise $w$ of intensity $\mathbf{Q}$, meaning $\mathbb{E}[w(t)w(t+\tau)^\mathsf{T}] = \mathbf{Q}\,\delta(\tau)$. The steady-state output covariance is $\mathbb{E}[yy^\mathsf{T}] = \frac{1}{2\pi}\int\mathbf{G}\mathbf{Q}\mathbf{G}^\mathsf{H}d\omega$, so for scalar intensity $\mathbf{Q} = q\mathbf{I}$ the output RMS is exactly $\sqrt{q}\,\lVert\mathbf{G}\rVert_2$. This is the reading that gives it units: if $\mathbf{G}$ maps newton-metres to radians, $\lVert\mathbf{G}\rVert_2$ carries $\mathrm{rad}/(\mathrm{N\,m})$ times $\sqrt{\mathrm{rad/s}}$, and multiplying by the square root of a torque intensity in $(\mathrm{N\,m})^2\mathrm{s}$ returns radians.

**What it is not.** The H2 norm is *not* an induced norm: there is no signal norm pair for which it is the worst-case gain. It is therefore not submultiplicative — $\lVert\mathbf{G}\mathbf{H}\rVert_2 \le \lVert\mathbf{G}\rVert_2\lVert\mathbf{H}\rVert_2$ is false in general — and it cannot appear in a small gain argument. It is also infinite for any system with $\mathbf{D} \ne 0$, because $\operatorname{tr}(\mathbf{D}^\mathsf{T}\mathbf{D})$ integrated over all frequency diverges. That is not a technicality: it means you can never write an H2 cost on the sensitivity function $\mathbf{S}$, which tends to $\mathbf{I}$ at high frequency, and it is the reason LQG problems are always posed with a strictly proper weighted output.

## Computing them from state space

Both norms come out of $(\mathbf{A}, \mathbf{B}, \mathbf{C})$ with standard linear algebra and no frequency grid.

The H2 norm uses a Lyapunov equation. Solve $\mathbf{A}\mathbf{P} + \mathbf{P}\mathbf{A}^\mathsf{T} + \mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{0}$ for the controllability gramian $\mathbf{P}$ — a linear system in the entries of $\mathbf{P}$, solvable with a Kronecker product — and then

$$\lVert\mathbf{G}\rVert_2^2 = \operatorname{tr}(\mathbf{C}\mathbf{P}\mathbf{C}^\mathsf{T}).$$

The dual form $\operatorname{tr}(\mathbf{B}^\mathsf{T}\mathbf{Q}\mathbf{B})$ with $\mathbf{A}^\mathsf{T}\mathbf{Q} + \mathbf{Q}\mathbf{A} + \mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{0}$ gives the same number.

The H-infinity norm has no closed form, but it has an exact test. For a strictly proper system, $\lVert\mathbf{G}\rVert_\infty < \gamma$ if and only if the Hamiltonian matrix

$$\mathbf{H}_\gamma = \begin{pmatrix}\mathbf{A} & \gamma^{-2}\mathbf{B}\mathbf{B}^\mathsf{T} \\ -\mathbf{C}^\mathsf{T}\mathbf{C} & -\mathbf{A}^\mathsf{T}\end{pmatrix}$$

has no eigenvalues on the imaginary axis. An imaginary eigenvalue at $j\omega_0$ says $\bar{\sigma}(\mathbf{G}(j\omega_0)) = \gamma$ exactly. Bisecting on $\gamma$ therefore computes the norm to machine precision in a few dozen eigenvalue decompositions, and the same structure — a Hamiltonian whose eigenvalues must stay off the axis — is what the H-infinity synthesis Riccati equations are built from.

```python
import numpy as np

def h2_norm(A, B, C):
    """||C(sI-A)^-1 B||_2 from the controllability gramian A P + P A^T + B B^T = 0."""
    n = A.shape[0]
    K = np.kron(np.eye(n), A) + np.kron(A, np.eye(n))     # vec form of the equation
    P = np.linalg.solve(K, -(B @ B.T).reshape(-1, order='F')).reshape((n, n), order='F')
    return float(np.sqrt(np.trace(C @ P @ C.T)))

def hinf_norm(A, B, C, lo=1e-6, hi=1e6):
    """Bisection: ||G||inf < gamma iff the Hamiltonian has no imaginary eigenvalue."""
    for _ in range(200):
        g = np.sqrt(lo * hi)
        H = np.block([[A, B @ B.T / g**2], [-C.T @ C, -A.T]])
        ev = np.linalg.eigvals(H)
        clean = np.all(np.abs(ev.real) > 1e-9 * max(1.0, np.abs(ev).max()))
        lo, hi = (lo, g) if clean else (g, hi)
        if hi / lo < 1 + 1e-12:
            break
    return hi

J, kp, kd = 120.0, 40.0, 90.0                 # kg m^2, N m/rad, N m s/rad
A = np.array([[0.0, 1.0], [-kp / J, -kd / J]])
B = np.array([[0.0], [1.0 / J]])
C = np.array([[1.0, 0.0]])                    # disturbance torque -> attitude
print(f"H2   = {h2_norm(A, B, C):.6f} rad/(N m) sqrt(rad/s)")
print(f"Hinf = {hinf_norm(A, B, C):.6f} rad/(N m)")
# H2   = 0.011785 rad/(N m) sqrt(rad/s)
# Hinf = 0.025311 rad/(N m)
```

::: example Pointing error two ways
The classical proportional-derivative loop on one spacecraft axis, $J = 120\,\mathrm{kg\,m^2}$, $k_p = 40\,\mathrm{N\,m/rad}$, $k_d = 90\,\mathrm{N\,m\,s/rad}$, has a disturbance-torque-to-attitude map

$$S(s)G(s) = \frac{1}{Js^2 + k_d s + k_p} = \frac{1}{120s^2 + 90s + 40},$$

with $\omega_n = \sqrt{40/120} = 0.577\,\mathrm{rad/s}$ and $\zeta = 90/(2\sqrt{40\times 120}) = 0.6495$. Both norms are available in closed form for a second-order system: $\lVert SG\rVert_2 = \sqrt{J/(2k_pk_dJ)} = \sqrt{1/(2\times 40\times 90)} = 0.011785$ and $\lVert SG\rVert_\infty = (1/k_p)/(2\zeta\sqrt{1-\zeta^2}) = 0.025311$, the latter peaking at $0.228\,\mathrm{rad/s}$. The Lyapunov and Hamiltonian computations above return exactly these.

Now attach physics. Reaction-wheel imbalance is a broadband torque disturbance; model it as white noise of intensity $q = 1\times 10^{-6}\,(\mathrm{N\,m})^2\mathrm{s}$, which if filtered to a $100\,\mathrm{rad/s}$ band would have an RMS of $\sqrt{q\omega_{\max}/\pi} = 5.6\,\mathrm{mN\,m}$ — a realistic wheel. The **H2** norm answers the question the pointing-budget engineer asks: the steady-state RMS attitude error is $\sqrt{q}\,\lVert SG\rVert_2 = 10^{-3}\times 0.011785 = 1.18\times 10^{-5}\,\mathrm{rad} = 11.8\,\mathrm{\mu rad} = 2.43\,\mathrm{arcsec}$.

The **H-infinity** norm answers a different question: what is the worst a bounded disturbance can do? A sinusoidal torque of amplitude $0.1\,\mathrm{N\,m}$ at the worst frequency, $0.228\,\mathrm{rad/s}$, produces a steady attitude oscillation of amplitude $0.1\times 0.025311 = 2.53\,\mathrm{mrad} = 522\,\mathrm{arcsec}$ — two hundred times the RMS figure, from a disturbance that a noise model would average away. Which number belongs in the requirement depends on whether your payload cares about jitter or about excursions, and the honest answer is usually both.
:::

::: example Why a bending mode terrifies H-infinity and not H2
Take a plant with a well-behaved rigid part and one lightly damped array mode added on top,

$$G(s) = \frac{1}{s+1} + \varepsilon\,\frac{\omega_1^2}{s^2 + 2\zeta_1\omega_1 s + \omega_1^2}, \qquad \omega_1 = 12\,\mathrm{rad/s},\ \zeta_1 = 0.002 .$$

With $\varepsilon = 0$ the norms are $\lVert G\rVert_2 = 0.7071$ and $\lVert G\rVert_\infty = 1.000$. Now set $\varepsilon = 0.02$ — a mode whose DC contribution is two percent of the rigid gain, the sort of thing a finite-element model reports and a schedule-pressed engineer rounds off. The computed norms become

$$\lVert G\rVert_2 = 1.068\ (\times\,1.51), \qquad \lVert G\rVert_\infty = 5.083\ (\times\,5.08).$$

The mode alone has $\lVert\cdot\rVert_\infty = 1/(2\zeta_1) = 250$ and $\lVert\cdot\rVert_2 = \sqrt{\omega_1/(4\zeta_1)} = 38.7$; scaled by $\varepsilon$ these are $5.0$ and $0.77$, and they combine with the rigid part accordingly. With $\zeta_1 = 0.005$ instead, the same $\varepsilon$ gives $\lVert G\rVert_\infty = 2.08$ and $\lVert G\rVert_2 = 0.883$.

The structural point survives every choice of numbers. The H-infinity norm scales as $1/\zeta$ and the H2 norm as $1/\sqrt{\zeta}$, so halving the damping doubles one and multiplies the other by $1.41$. An optimiser minimising an H2 cost sees a lightly damped mode as a modest contribution to a broadband average and will happily leave it undamped near the crossover of the loop; the same mode is the entire H-infinity norm. That is the mechanism behind the LQG margin problem, and it is why a flexible-structure design is posed in H-infinity.
:::

::: warning An H2 norm needs a strictly proper system
$\lVert\mathbf{S}\rVert_2$, $\lVert\mathbf{T}\rVert_2$ for a biproper $\mathbf{T}$, and $\lVert\mathbf{K}\rVert_2$ for a proportional-derivative controller are all infinite. Any H2 problem statement must therefore weight the outputs with strictly proper weights or include a measurement-noise channel that rolls the cost off. If a numerical routine returns a finite H2 norm for a system with $\mathbf{D} \ne 0$, it has silently dropped $\mathbf{D}$, and the number is wrong.
:::

::: warning Neither norm is defined for an unstable system
Both integrals and the supremum assume $\mathbf{G}$ has no poles in the closed right half plane. A frequency grid will nonetheless return a finite peak for an unstable system, because it never looks off the imaginary axis. Always check the poles before reporting a norm — this is exactly the trap the small gain lesson warned about for $\mathbf{M}$.
:::

## Check yourself

::: check
A first-order lag $G(s) = a/(s+a)$ models a sensor filter. Give $\lVert G\rVert_\infty$ and $\lVert G\rVert_2$, and explain why one depends on $a$ and the other does not.
:::

::: answer
$\lvert G(j\omega)\rvert = a/\sqrt{\omega^2 + a^2}$ is largest at $\omega = 0$, where it is $1$, so $\lVert G\rVert_\infty = 1$ for every $a$: a low-pass filter passes DC with unity gain whatever its corner. For the H2 norm, $\lVert G\rVert_2^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}\frac{a^2}{\omega^2 + a^2}d\omega = \frac{a^2}{2\pi}\cdot\frac{\pi}{a} = \frac{a}{2}$, so $\lVert G\rVert_2 = \sqrt{a/2}$; at $a = 10\,\mathrm{rad/s}$ it is $2.236$. The H2 norm grows with bandwidth because it integrates over frequency — a wider filter lets through more noise power. This is the noise-bandwidth idea: the H2 norm of a filter is the square root of the noise bandwidth it presents to white input.
:::

::: check
Show that $\lVert\mathbf{G}\rVert_\infty$ of a constant matrix $\mathbf{A}$ is $\bar{\sigma}(\mathbf{A})$, and use that to state the H-infinity norm of the rigid spacecraft plant $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$ at a fixed frequency of $1\,\mathrm{rad/s}$.
:::

::: answer
A constant matrix has $\mathbf{G}(j\omega) = \mathbf{A}$ at every frequency, so the supremum over $\omega$ of $\bar{\sigma}(\mathbf{G}(j\omega))$ is $\bar{\sigma}(\mathbf{A})$ trivially. For $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$ the frequency response is $\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$, so $\bar{\sigma}(\mathbf{G}(j\omega)) = \bar{\sigma}(\mathbf{J}^{-1})/\omega^2$. With the module's inertia, the singular values of $\mathbf{J}^{-1}$ are $0.01119$, $0.008354$ and $0.006624\ \mathrm{(kg\,m^2)^{-1}}$, so at $1\,\mathrm{rad/s}$ the largest gain is $0.01119\,\mathrm{rad/(N\,m)}$ and the smallest $0.006624$. The H-infinity norm of the open-loop plant itself is infinite, because the double integrator blows up as $\omega\to 0$; only the closed-loop maps have finite norms.
:::

::: check
Why can the H2 norm not be used in the small gain theorem, even though it is a perfectly good measure of system size?
:::

::: answer
The small gain proof needs $\lVert\mathbf{M}\boldsymbol{\Delta}\rVert \le \lVert\mathbf{M}\rVert\lVert\boldsymbol{\Delta}\rVert$ to bound the terms of the Neumann series. Submultiplicativity is a property of induced norms, and the H2 norm is not induced — there is no pair of signal norms whose worst-case ratio it computes. Concretely, take $G = H = a/(s+a)$: $\lVert GH\rVert_2$ is the H2 norm of $a^2/(s+a)^2$, which is $\sqrt{a/4}$, while $\lVert G\rVert_2\lVert H\rVert_2 = a/2$. For $a < 1$ the product norm exceeds the product of the norms, so the inequality fails outright and the series argument collapses. Robust stability is inherently a worst-case question, and it needs a worst-case norm.
:::

::: check
A design review reports "the LQG controller achieves an H2 cost of $0.42$, a twenty percent improvement on the previous design". What questions should you ask?
:::

::: answer
Three. First, twenty percent of what physical quantity — an H2 cost is a weighted sum of state and control variances, and without the weights the number has no units and no meaning. Second, what happened to $\lVert S\rVert_\infty$ and $\lVert T\rVert_\infty$: an H2 optimiser trades broadband variance for peak, and a small improvement in the average is routinely bought with a much worse worst case, which is where margins live. Third, what does the loop look like near any lightly damped mode: as the flexible example shows, a mode can be nearly invisible in H2 while dominating H-infinity, so the H2 number can improve while the design becomes fragile. The fix is not to abandon H2 — it is the right norm for a pointing budget — but to report the H-infinity norms alongside it.
:::

::: check
For the second-order system $\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ the H2 norm is $\sqrt{\omega_n/(4\zeta)}$. A structural engineer offers to raise the damping of a $12\,\mathrm{rad/s}$ array mode from $\zeta = 0.002$ to $\zeta = 0.01$ by adding a constrained-layer damper. By what factors do the two norms improve?
:::

::: answer
The H-infinity norm is $1/(2\zeta\sqrt{1-\zeta^2})$, so it falls from $250.0$ to $50.0$, a factor of $5$ — the ratio of the dampings. The H2 norm is $\sqrt{\omega_n/(4\zeta)}$, falling from $\sqrt{12/0.008} = 38.7$ to $\sqrt{12/0.04} = 17.3$, a factor of $\sqrt{5} = 2.24$. Damping is five times more valuable to a worst-case specification than to a variance specification, which is the quantitative reason structural damping treatments are argued for on stability-margin grounds rather than on jitter grounds. It is also why the achievable gamma in an H-infinity design is so sensitive to the damping value assumed in the model, and why that value — usually the least well known number in the whole finite-element report — deserves an uncertainty description of its own.
:::

## Summary

| Item | Statement |
| --- | --- |
| Signal energy | $\lVert y\rVert_2^2 = \int_0^\infty y^\mathsf{T}y\,dt = \frac{1}{2\pi}\int y^\mathsf{H}y\,d\omega$ |
| H-infinity norm | $\lVert\mathbf{G}\rVert_\infty = \sup_\omega\bar{\sigma}(\mathbf{G}(j\omega))$; SISO: peak of $\lvert G(j\omega)\rvert$ |
| What it measures | worst-case energy gain, $\sup\lVert y\rVert_2/\lVert u\rVert_2$; induced, hence submultiplicative |
| H2 norm | $\lVert\mathbf{G}\rVert_2^2 = \frac{1}{2\pi}\int\operatorname{tr}(\mathbf{G}^\mathsf{H}\mathbf{G})d\omega = \int_0^\infty\operatorname{tr}(\mathbf{g}^\mathsf{T}\mathbf{g})dt$ |
| What it measures | RMS output for unit-intensity white noise; output RMS $=\sqrt{q}\lVert\mathbf{G}\rVert_2$; LQG minimises it |
| H2 caveats | infinite unless strictly proper; not induced, not submultiplicative |
| Closed forms | $a/(s+a)$: $\lVert\cdot\rVert_\infty = 1$, $\lVert\cdot\rVert_2 = \sqrt{a/2}$. Second order: $\lVert\cdot\rVert_\infty = 1/(2\zeta\sqrt{1-\zeta^2})$, $\lVert\cdot\rVert_2 = \sqrt{\omega_n/(4\zeta)}$ |
| Computing H2 | $\mathbf{A}\mathbf{P}+\mathbf{P}\mathbf{A}^\mathsf{T}+\mathbf{B}\mathbf{B}^\mathsf{T}=\mathbf{0}$, then $\lVert\mathbf{G}\rVert_2^2 = \operatorname{tr}(\mathbf{C}\mathbf{P}\mathbf{C}^\mathsf{T})$ |
| Computing H-infinity | bisect $\gamma$; $\lVert\mathbf{G}\rVert_\infty < \gamma$ iff $\mathbf{H}_\gamma$ has no imaginary eigenvalue |
| Worked spacecraft | $SG = 1/(120s^2+90s+40)$: $\lVert\cdot\rVert_2 = 0.01179$, $\lVert\cdot\rVert_\infty = 0.02531$; $2.43\,\mathrm{arcsec}$ RMS versus $522\,\mathrm{arcsec}$ worst case |
| Damping sensitivity | $\lVert\cdot\rVert_\infty \propto 1/\zeta$ but $\lVert\cdot\rVert_2 \propto 1/\sqrt{\zeta}$ |

The next lesson uses the H-infinity norm as an objective rather than a diagnostic: stack weighted copies of $\mathbf{S}$, $\mathbf{K}\mathbf{S}$ and $\mathbf{T}$, minimise the norm of the stack, and read the achieved value as a scorecard for every specification at once.
