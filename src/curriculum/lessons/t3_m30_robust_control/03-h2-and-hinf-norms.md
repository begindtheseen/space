---
id: l03-h2-and-hinf-norms
title: The H2 and H-infinity norms
minutes: 18
covers:
  - The H2 and H-infinity norms and what each one measures
---

How loud is a rock concert? You could answer two ways. You could give the *average* loudness over the whole evening. Or you could give the *loudest single moment* — the one crash of the drums that made your ears ring. Both are honest. They answer different questions. The average tells you how tired your ears will be tomorrow. The loudest moment tells you whether something broke.

A control engineer measures the "size" of a transfer function in the same two ways, and almost every modern control method is the minimization of one of them. The **H2 norm** is the average kind: a **[[root-mean-square|rms]]** size, the typical output when the input is broadband noise that never stops — sensor noise, turbulence, the steady buzz of a reaction wheel. The **H-infinity norm** is the loudest-moment kind: the largest amplification of any single input of limited energy — one gust, one thruster misfire, one unknown perturbation shaped as if by an enemy to do the most harm.

LQG minimizes an H2 norm. Robust synthesis minimizes an H-infinity norm. The small gain theorem of the last lesson is an H-infinity statement, and the weight-covering of the lesson before is an H-infinity statement in disguise. Knowing which norm a method optimizes tells you at once what it protects you from and what it ignores. A design that is best on average can be terrible in the worst case. That one fact is why the "LQG has no guaranteed margins" result, and the loop-transfer-recovery patch for it, exist in the optimal control module.

This lesson defines both norms, says what each one physically measures with units attached, gives closed forms for the systems you meet most, and shows how to compute both from a state-space model with only linear algebra.

## Signal norms first

A system norm is built from a way of measuring signals, so signals come first.

Picture a signal as sound through a speaker. Its **energy** is the total "push" delivered over all time. For a vector signal $y(t)$ defined for $t \ge 0$, the energy, or **2-norm**, is

$$\lVert y\rVert_2 = \left(\int_0^\infty y(t)^\mathsf{T}y(t)\,dt\right)^{1/2}.$$

Here $y^\mathsf{T}y$ is the sum of the squares of the components. The integral is finite only for signals that die away. A gust, an impulse or a maneuver has finite energy. A step or a sinusoid that never stops has infinite energy.

For signals that go on forever, the right measure is **power**: the average of $y^\mathsf{T}y$ over a long time, $\lim_{T\to\infty}\frac{1}{T}\int_0^T y^\mathsf{T}y\,dt$. Its square root is the RMS value.

**[[Parseval's theorem|parseval]]** connects the time picture and the frequency picture. The energy is the same whether you add it up over time or over frequency:

$$\lVert y\rVert_2^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}y(j\omega)^\mathsf{H}y(j\omega)\,d\omega ,$$

where $(\cdot)^\mathsf{H}$, read "H" or "conjugate transpose", flips a complex vector on its side and changes the sign of every imaginary part.

## The H-infinity norm

Think of a transfer function as an amplifier with a knob for frequency. For each frequency it has a gain. The H-infinity norm asks: turn the knob through every frequency — what is the biggest gain you ever see?

For a multivariable system there is a second knob: the *direction* of the input. At one frequency, $\mathbf{G}(j\omega)$ is a complex matrix, and it stretches some input directions more than others. The biggest stretch is its **[[largest singular value|singular-ellipse]]**, $\bar{\sigma}$ ("sigma bar"); the smallest is $\underline{\sigma}$ ("sigma underbar"). The H-infinity norm takes the biggest stretch over *both* knobs.

::: key H-infinity norm
For a stable transfer matrix $\mathbf{G}(s)$,

$$\lVert\mathbf{G}\rVert_\infty = \sup_\omega\ \bar{\sigma}\big(\mathbf{G}(j\omega)\big),$$

the peak over frequency of the largest singular value. For a SISO system this is the peak of $\lvert G(j\omega)\rvert$ — the highest point of the Bode magnitude plot. It equals the induced 2-norm, the worst-case energy gain from input to output: $\lVert\mathbf{G}\rVert_\infty = \sup_{u \ne 0}\lVert y\rVert_2/\lVert u\rVert_2$.
:::

Read $\lVert\mathbf{G}\rVert_\infty$ as "the H-infinity norm of G", and $\sup$ as "**[[supremum|supremum]]**", the least upper bound. The singular values are those of the linear algebra module, applied to the complex matrix $\mathbf{G}(j\omega)$ one frequency at a time. Write $\mathbf{G}(j\omega) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$ with $\mathbf{U}$ and $\mathbf{V}$ unitary (pure rotations, in the complex sense). Then $\bar{\sigma} = \sigma_1$ is the gain in the most amplified input direction $\mathbf{v}_1$, and $\underline{\sigma} = \sigma_m$ the gain in the least amplified direction.

::: note Why the peak is the worst-case energy gain
**Upper bound.** For any input $u$, use Parseval, then the fact that no direction is stretched more than $\bar{\sigma}$, then the peak over frequency:

$$\lVert y\rVert_2^2 = \frac{1}{2\pi}\int u^\mathsf{H}\mathbf{G}^\mathsf{H}\mathbf{G}u\,d\omega \le \frac{1}{2\pi}\int\bar{\sigma}(\mathbf{G})^2\,u^\mathsf{H}u\,d\omega \le \Big(\sup_\omega\bar{\sigma}\Big)^2\lVert u\rVert_2^2 .$$

So the energy gain is never more than the peak.

**Lower bound.** Now build an input that nearly achieves it. Put almost all of its energy in a narrow band around the worst frequency $\omega_0$, pointing along the worst direction $\mathbf{v}_1(j\omega_0)$. As the band narrows, the ratio $\lVert y\rVert_2/\lVert u\rVert_2$ approaches $\bar{\sigma}(\mathbf{G}(j\omega_0))$. So the peak is reached in the limit, and the norm really is the worst-case energy gain.
:::

Two consequences get used constantly.

- Being a worst-case gain, it is **submultiplicative**: $\lVert\mathbf{G}\mathbf{H}\rVert_\infty \le \lVert\mathbf{G}\rVert_\infty\lVert\mathbf{H}\rVert_\infty$. Two amplifiers in a row cannot amplify more than the product of their worst gains. This is the step the small gain proof needed.
- A constant matrix is a legitimate stable system, with $\lVert\mathbf{A}\rVert_\infty = \bar{\sigma}(\mathbf{A})$. So a feedthrough term $\mathbf{D}$ adds to the norm rather than breaking it.

Some standard peaks worth knowing:

- A first-order lag $a/(s+a)$ has its peak at DC, so $\lVert G\rVert_\infty = 1$ whatever $a$ is.
- A second-order system $\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ with $\zeta < 1/\sqrt{2}$ has a resonant peak:

$$\lVert G\rVert_\infty = \frac{1}{2\zeta\sqrt{1 - \zeta^2}} .$$

So $\zeta = 0.005$ gives about $100.0$ and $\zeta = 0.002$ about $250.0$. For light damping, the peak is close to $1/(2\zeta)$.

- For the sensitivity function, $\lVert S\rVert_\infty$ is one over **[[the shortest distance from the Nyquist plot to −1|nyquist-distance]]**. That is why it comes back as the central quantity in the disk margin lesson.

## The H2 norm

Now the average kind. Hit the system with an impulse — one sharp tap — and watch how long and how hard it rings. Add up the energy of all that ringing. That total is the square of the H2 norm.

::: key H2 norm
For a stable, strictly proper $\mathbf{G}(s)$,

$$\lVert\mathbf{G}\rVert_2 = \left(\frac{1}{2\pi}\int_{-\infty}^{\infty}\operatorname{tr}\big(\mathbf{G}(j\omega)^\mathsf{H}\mathbf{G}(j\omega)\big)\,d\omega\right)^{1/2} = \left(\int_0^\infty\operatorname{tr}\big(\mathbf{g}(t)^\mathsf{T}\mathbf{g}(t)\big)\,dt\right)^{1/2},$$

with $\mathbf{g}(t)$ the impulse-response matrix. It is the root-mean-square output when the input is white noise of unit intensity, and LQG minimizes it.
:::

The **trace**, $\operatorname{tr}$, is the sum of the diagonal entries of a matrix. Here it adds up the squared gains from every input to every output. **Strictly proper** means the gain falls to zero at very high frequency (no direct feedthrough, $\mathbf{D} = \mathbf{0}$).

This one number has three readings, worth keeping apart.

**Impulse-response energy.** The time-domain form says $\lVert\mathbf{G}\rVert_2^2$ is the total output energy when each input in turn is hit with a unit impulse, summed over the inputs. It measures how much a system rings. In the frequency domain, it is the **[[area under the squared gain curve|area-vs-peak]]**, where the H-infinity norm is only the height of the tallest point.

**Stochastic RMS.** Drive the system with **[[white noise|white-noise]]** $w$ of intensity $\mathbf{Q}$, meaning $\mathbb{E}[w(t)w(t+\tau)^\mathsf{T}] = \mathbf{Q}\,\delta(\tau)$. Here $\mathbb{E}$ is the average ("expected value") and $\delta$ is the impulse. The steady output covariance is $\mathbb{E}[yy^\mathsf{T}] = \frac{1}{2\pi}\int\mathbf{G}\mathbf{Q}\mathbf{G}^\mathsf{H}d\omega$. For $\mathbf{Q} = q\mathbf{I}$, the output RMS is exactly $\sqrt{q}\,\lVert\mathbf{G}\rVert_2$.

This reading gives the norm units. If $\mathbf{G}$ maps newton-meters to radians, $\lVert\mathbf{G}\rVert_2$ carries $\mathrm{rad}/(\mathrm{N\,m})$ times $\sqrt{\mathrm{rad/s}}$. Multiply by the square root of a torque intensity in $(\mathrm{N\,m})^2\mathrm{s}$ and you get radians.

**What it is not.** The H2 norm is *not* a worst-case gain. There is no pair of signal norms for which it is the worst-case ratio. So it is not submultiplicative — $\lVert\mathbf{G}\mathbf{H}\rVert_2 \le \lVert\mathbf{G}\rVert_2\lVert\mathbf{H}\rVert_2$ is false in general — and it cannot appear in a small gain argument.

It is also infinite for any system with $\mathbf{D} \ne \mathbf{0}$. The integrand $\operatorname{tr}(\mathbf{D}^\mathsf{T}\mathbf{D})$ never dies away, so its integral over all frequency diverges. That is not a technicality. It means you can never put an H2 cost on the sensitivity $\mathbf{S}$, which tends to $\mathbf{I}$ at high frequency. It is why LQG problems are always posed with a strictly proper weighted output.

## Computing them from state space

Both norms come straight out of a state-space model $(\mathbf{A}, \mathbf{B}, \mathbf{C})$, with no frequency grid.

**The H2 norm** uses a **[[Lyapunov equation|lyapunov]]**. Solve

$$\mathbf{A}\mathbf{P} + \mathbf{P}\mathbf{A}^\mathsf{T} + \mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{0}$$

for the controllability gramian $\mathbf{P}$. This is a linear system in the entries of $\mathbf{P}$, solvable with a Kronecker product. Then

$$\lVert\mathbf{G}\rVert_2^2 = \operatorname{tr}(\mathbf{C}\mathbf{P}\mathbf{C}^\mathsf{T}).$$

The dual form, $\operatorname{tr}(\mathbf{B}^\mathsf{T}\mathbf{Q}\mathbf{B})$ with $\mathbf{A}^\mathsf{T}\mathbf{Q} + \mathbf{Q}\mathbf{A} + \mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{0}$, gives the same number.

**The H-infinity norm** has no closed form, but it has an exact yes-or-no test. For a stable, strictly proper system, $\lVert\mathbf{G}\rVert_\infty < \gamma$ if and only if the **Hamiltonian matrix**

$$\mathbf{H}_\gamma = \begin{pmatrix}\mathbf{A} & \gamma^{-2}\mathbf{B}\mathbf{B}^\mathsf{T} \\ -\mathbf{C}^\mathsf{T}\mathbf{C} & -\mathbf{A}^\mathsf{T}\end{pmatrix}$$

has no eigenvalues on the imaginary axis. An imaginary eigenvalue at $j\omega_0$ says $\bar{\sigma}(\mathbf{G}(j\omega_0)) = \gamma$ exactly. You can **[[watch the eigenvalues land on the axis|hamiltonian-picture]]** as $\gamma$ drops below the norm.

So you can find the norm by **bisection**, the guessing game "higher or lower". Guess $\gamma$. If the test passes, the norm is below it: guess lower. If not, guess higher. Each round halves the gap, so a few dozen eigenvalue computations give the norm to machine precision. The same structure — a Hamiltonian whose eigenvalues must stay off the axis — is what the H-infinity synthesis Riccati equations are built from.

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
Take the classical proportional-derivative loop on one spacecraft axis: $J = 120\,\mathrm{kg\,m^2}$, $k_p = 40\,\mathrm{N\,m/rad}$, $k_d = 90\,\mathrm{N\,m\,s/rad}$. The map from disturbance torque to attitude is

$$S(s)G(s) = \frac{1}{Js^2 + k_d s + k_p} = \frac{1}{120s^2 + 90s + 40},$$

with $\omega_n = \sqrt{40/120} = 0.577\,\mathrm{rad/s}$ and $\zeta = 90/(2\sqrt{40\times 120}) = 0.6495$.

**The two norms in closed form.** For $1/(Js^2 + k_d s + k_p)$ the H2 norm is $\sqrt{1/(2k_pk_d)}$:

$$\lVert SG\rVert_2 = \sqrt{\frac{1}{2\times 40\times 90}} = \sqrt{\frac{1}{7200}} = 0.011785 .$$

The H-infinity norm is the DC gain $1/k_p$ times the resonant factor:

$$\lVert SG\rVert_\infty = \frac{1/k_p}{2\zeta\sqrt{1-\zeta^2}} = \frac{0.025}{2\times 0.6495\times 0.7604} = 0.025311,$$

peaking at $0.228\,\mathrm{rad/s}$. The Lyapunov and Hamiltonian code above returns exactly these. Sanity check: the peak is only a little above the DC gain $0.025$, as it should be for $\zeta = 0.65$, which barely resonates.

**The average question.** **[[Reaction-wheel imbalance|wheel-imbalance]]** is a broadband torque disturbance. Model it as white noise of intensity $q = 1\times 10^{-6}\,(\mathrm{N\,m})^2\mathrm{s}$. Filtered to a $100\,\mathrm{rad/s}$ band, that would have an RMS of $\sqrt{q\,\omega_{\max}/\pi} = \sqrt{10^{-6}\times 100/\pi} = 5.6\,\mathrm{mN\,m}$ — a realistic wheel. The **H2** norm answers the pointing-budget engineer's question. The steady RMS attitude error is

$$\sqrt{q}\,\lVert SG\rVert_2 = 10^{-3}\times 0.011785 = 1.18\times 10^{-5}\,\mathrm{rad} = 11.8\,\mathrm{\mu rad} = 2.43\,\mathrm{arcsec}.$$

(An **[[arcsecond|arcsecond]]** is $1/3600$ of a degree.)

**The worst-case question.** The **H-infinity** norm asks what the worst bounded disturbance can do. A sinusoidal torque of amplitude $0.1\,\mathrm{N\,m}$ at the worst frequency, $0.228\,\mathrm{rad/s}$, gives a steady attitude swing of amplitude $0.1\times 0.025311 = 2.53\,\mathrm{mrad} = 522\,\mathrm{arcsec}$.

That is about two hundred times the RMS figure, from a disturbance that a noise model would average away. Which number belongs in the requirement depends on whether your payload cares about jitter or about large excursions — and the honest answer is usually both.
:::

::: example Why a bending mode terrifies H-infinity and not H2
Take a plant with a well-behaved rigid part plus one lightly damped solar-array mode:

$$G(s) = \frac{1}{s+1} + \varepsilon\,\frac{\omega_1^2}{s^2 + 2\zeta_1\omega_1 s + \omega_1^2}, \qquad \omega_1 = 12\,\mathrm{rad/s},\ \zeta_1 = 0.002 .$$

**Without the mode** ($\varepsilon = 0$): $\lVert G\rVert_2 = \sqrt{1/2} = 0.7071$ and $\lVert G\rVert_\infty = 1.000$.

**With a small mode**, $\varepsilon = 0.02$ — a mode whose DC contribution is two percent of the rigid gain, the kind of thing a finite-element model reports and a hurried engineer rounds off. The computed norms become

$$\lVert G\rVert_2 = 1.068\ (\times\,1.51), \qquad \lVert G\rVert_\infty = 5.083\ (\times\,5.08).$$

**Where that comes from.** The mode on its own has $\lVert\cdot\rVert_\infty \approx 1/(2\zeta_1) = 1/0.004 = 250$ and $\lVert\cdot\rVert_2 = \sqrt{\omega_1/(4\zeta_1)} = \sqrt{12/0.008} = 38.7$. Scaled by $\varepsilon = 0.02$, these are $5.0$ and $0.77$. The peak adds almost directly to the rigid part's small gain at $12\,\mathrm{rad/s}$; the H2 parts add roughly as squares, $\sqrt{0.707^2 + 0.77^2} \approx 1.05$, close to the computed $1.068$. With $\zeta_1 = 0.005$ instead, the same $\varepsilon$ gives $\lVert G\rVert_\infty = 2.08$ and $\lVert G\rVert_2 = 0.883$.

The lesson survives any choice of numbers. The H-infinity norm scales as $1/\zeta$ and the H2 norm as $1/\sqrt{\zeta}$. Halving the damping doubles one and multiplies the other by only $1.41$. An optimizer minimizing an H2 cost sees a lightly damped mode as a modest part of a broadband average, and will happily leave it undamped near crossover. To H-infinity the same mode is the whole norm. That is the mechanism behind the LQG margin problem, and it is why flexible-structure designs are posed in H-infinity.
:::

::: warning An H2 norm needs a strictly proper system
$\lVert\mathbf{S}\rVert_2$, $\lVert\mathbf{T}\rVert_2$ for a biproper $\mathbf{T}$, and $\lVert\mathbf{K}\rVert_2$ for a proportional-derivative controller are all infinite. Any H2 problem must therefore weight the outputs with strictly proper weights, or include a measurement-noise channel that rolls the cost off. If a routine returns a finite H2 norm for a system with $\mathbf{D} \ne \mathbf{0}$, it has quietly dropped $\mathbf{D}$, and the number is wrong.
:::

::: warning Neither norm is defined for an unstable system
Both integrals and the supremum assume $\mathbf{G}$ has no poles in the closed right half plane. A frequency grid will still return a finite peak for an unstable system, because it never looks off the imaginary axis. Always check the poles before reporting a norm — the same trap the small gain lesson warned about for $\mathbf{M}$.
:::

## Check yourself

::: check
A first-order lag $G(s) = a/(s+a)$ models a sensor filter. Give $\lVert G\rVert_\infty$ and $\lVert G\rVert_2$, and explain why one depends on $a$ and the other does not.
:::

::: answer
The gain is $\lvert G(j\omega)\rvert = a/\sqrt{\omega^2 + a^2}$. It is largest at $\omega = 0$, where it equals $1$. So $\lVert G\rVert_\infty = 1$ for every $a$: a low-pass filter passes DC at unity gain whatever its corner.

For the H2 norm, use $\int_{-\infty}^{\infty}\frac{d\omega}{\omega^2 + a^2} = \frac{\pi}{a}$:

$$\lVert G\rVert_2^2 = \frac{1}{2\pi}\int_{-\infty}^{\infty}\frac{a^2}{\omega^2 + a^2}\,d\omega = \frac{a^2}{2\pi}\cdot\frac{\pi}{a} = \frac{a}{2},$$

so $\lVert G\rVert_2 = \sqrt{a/2}$. At $a = 10\,\mathrm{rad/s}$ it is $\sqrt{5} = 2.236$.

The H2 norm grows with bandwidth because it adds up over frequency: a wider filter lets through more noise power. The H-infinity norm only looks at the tallest point, which is $1$ for every corner.
:::

::: check
Show that $\lVert\mathbf{G}\rVert_\infty$ of a constant matrix $\mathbf{A}$ is $\bar{\sigma}(\mathbf{A})$. Then give the largest and smallest gains of the rigid spacecraft plant $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$ at $1\,\mathrm{rad/s}$, and its H-infinity norm.
:::

::: answer
A constant matrix has $\mathbf{G}(j\omega) = \mathbf{A}$ at every frequency. So the peak over $\omega$ of $\bar{\sigma}(\mathbf{G}(j\omega))$ is $\bar{\sigma}(\mathbf{A})$ — there is only one value to take the peak of.

For $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$, putting $s = j\omega$ gives $\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$, so $\bar{\sigma}(\mathbf{G}(j\omega)) = \bar{\sigma}(\mathbf{J}^{-1})/\omega^2$. With the module's inertia, the singular values of $\mathbf{J}^{-1}$ are $0.01119$, $0.008354$ and $0.006624\ \mathrm{(kg\,m^2)^{-1}}$. At $1\,\mathrm{rad/s}$ the largest gain is $0.01119\,\mathrm{rad/(N\,m)}$ and the smallest $0.006624$.

The H-infinity norm of the open-loop plant is infinite, because the double integrator's gain blows up as $\omega\to 0$ (and the plant is not stable). Only the closed-loop maps have finite norms.
:::

::: check
Why can the H2 norm not be used in the small gain theorem, even though it is a perfectly good measure of system size?
:::

::: answer
The small gain proof needs $\lVert\mathbf{M}\boldsymbol{\Delta}\rVert \le \lVert\mathbf{M}\rVert\lVert\boldsymbol{\Delta}\rVert$ to bound the terms of the Neumann series. That property belongs to worst-case (induced) norms, and the H2 norm is not one.

Concretely, take $G = H = a/(s+a)$. Then $GH = a^2/(s+a)^2$, whose H2 norm is $\sqrt{a/4}$, while $\lVert G\rVert_2\lVert H\rVert_2 = \sqrt{a/2}\cdot\sqrt{a/2} = a/2$. For $a = 0.5$: $\sqrt{0.125} = 0.354$ against $0.25$. The norm of the product is bigger than the product of the norms, so the inequality fails and the series argument collapses. (It fails whenever $a < 1$.) Robust stability is a worst-case question, and it needs a worst-case norm.
:::

::: check
A design review reports "the LQG controller achieves an H2 cost of $0.42$, a twenty percent improvement on the previous design". What questions should you ask?
:::

::: answer
Three.

First: twenty percent of *what*? An H2 cost is a weighted sum of state and control variances. Without the weights, the number has no units and no meaning.

Second: what happened to $\lVert S\rVert_\infty$ and $\lVert T\rVert_\infty$? An H2 optimizer trades broadband average for peak, and a small gain in the average is routinely bought with a much worse worst case — which is where the margins live.

Third: what does the loop look like near any lightly damped mode? As the flexible example shows, a mode can be nearly invisible in H2 while dominating H-infinity, so the H2 number can improve while the design becomes fragile.

The fix is not to drop H2 — it is the right norm for a pointing budget — but to report the H-infinity norms beside it.
:::

::: check
For the second-order system $\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ the H2 norm is $\sqrt{\omega_n/(4\zeta)}$. A structural engineer offers to raise the damping of a $12\,\mathrm{rad/s}$ array mode from $\zeta = 0.002$ to $\zeta = 0.01$ by adding a constrained-layer damper. By what factor does each norm improve?
:::

::: answer
**H-infinity:** $1/(2\zeta\sqrt{1-\zeta^2})$ falls from about $250.0$ to about $50.0$ — a factor of $5$, the ratio of the dampings.

**H2:** $\sqrt{\omega_n/(4\zeta)}$ falls from $\sqrt{12/0.008} = 38.7$ to $\sqrt{12/0.04} = 17.3$ — a factor of $\sqrt{5} = 2.24$.

Damping is worth five times more to a worst-case specification than it is worth $\sqrt{5}$ to a variance specification. Those are the numbers behind arguing for structural damping treatments on stability-margin grounds rather than jitter grounds. It is also why the achievable $\gamma$ in an H-infinity design is so sensitive to the damping assumed in the model. That value — usually the least well known number in the whole finite-element report — deserves an uncertainty description of its own.
:::

## Summary

| Item | Statement |
| --- | --- |
| Signal energy | $\lVert y\rVert_2^2 = \int_0^\infty y^\mathsf{T}y\,dt = \frac{1}{2\pi}\int y^\mathsf{H}y\,d\omega$ |
| H-infinity norm | $\lVert\mathbf{G}\rVert_\infty = \sup_\omega\bar{\sigma}(\mathbf{G}(j\omega))$; SISO: peak of $\lvert G(j\omega)\rvert$ |
| What it measures | worst-case energy gain, $\sup\lVert y\rVert_2/\lVert u\rVert_2$; induced, hence submultiplicative |
| H2 norm | $\lVert\mathbf{G}\rVert_2^2 = \frac{1}{2\pi}\int\operatorname{tr}(\mathbf{G}^\mathsf{H}\mathbf{G})d\omega = \int_0^\infty\operatorname{tr}(\mathbf{g}^\mathsf{T}\mathbf{g})dt$ |
| What it measures | RMS output for unit-intensity white noise; output RMS $=\sqrt{q}\lVert\mathbf{G}\rVert_2$; LQG minimizes it |
| H2 caveats | infinite unless strictly proper; not induced, not submultiplicative |
| Closed forms | $a/(s+a)$: $\lVert\cdot\rVert_\infty = 1$, $\lVert\cdot\rVert_2 = \sqrt{a/2}$. Second order: $\lVert\cdot\rVert_\infty = 1/(2\zeta\sqrt{1-\zeta^2})$, $\lVert\cdot\rVert_2 = \sqrt{\omega_n/(4\zeta)}$ |
| Computing H2 | $\mathbf{A}\mathbf{P}+\mathbf{P}\mathbf{A}^\mathsf{T}+\mathbf{B}\mathbf{B}^\mathsf{T}=\mathbf{0}$, then $\lVert\mathbf{G}\rVert_2^2 = \operatorname{tr}(\mathbf{C}\mathbf{P}\mathbf{C}^\mathsf{T})$ |
| Computing H-infinity | bisect $\gamma$; $\lVert\mathbf{G}\rVert_\infty < \gamma$ iff $\mathbf{H}_\gamma$ has no imaginary eigenvalue |
| Worked spacecraft | $SG = 1/(120s^2+90s+40)$: $\lVert\cdot\rVert_2 = 0.01179$, $\lVert\cdot\rVert_\infty = 0.02531$; $2.43\,\mathrm{arcsec}$ RMS versus $522\,\mathrm{arcsec}$ worst case |
| Damping sensitivity | $\lVert\cdot\rVert_\infty \propto 1/\zeta$ but $\lVert\cdot\rVert_2 \propto 1/\sqrt{\zeta}$ |

The next lesson uses the H-infinity norm as a goal rather than a diagnosis: stack weighted copies of $\mathbf{S}$, $\mathbf{K}\mathbf{S}$ and $\mathbf{T}$, minimize the norm of the stack, and read the achieved value as a scorecard for every specification at once.

::: context rms Root, mean, square — read backwards
**RMS** is a recipe you do in reverse order of its name: **square** every value, take the **mean** (average) of the squares, then take the square **root**. Squaring first stops the positive and negative swings from canceling, so a signal that wiggles around zero still gets an honest size.

Wall power in the United States is "$120\,\mathrm{V}$" — that is its RMS value. The voltage actually swings between about $+170$ and $-170\,\mathrm{V}$, since for a sine wave the peak is $\sqrt{2}$ times the RMS. Same signal, two sizes: an average one and a peak one. That is the H2 and H-infinity story in miniature.
:::

::: context parseval Energy counted two ways
Imagine counting the money in a jar coin by coin, or sorting it into piles by coin type first and adding the piles. You get the same total either way. **Parseval's theorem** says the same for a signal's energy: add $y^\mathsf{T}y$ up over time, or break the signal into frequencies and add up the energy at each frequency — same answer.

It is named after the French mathematician Marc-Antoine Parseval, who stated a version for series around 1800. It is what lets this lesson move freely between impulse responses in time and Bode plots in frequency.
:::

::: context singular-ellipse A matrix turns a circle into an ellipse
Feed the matrix $\begin{pmatrix}1.2 & 0.6\\0.2 & 0.7\end{pmatrix}$ every input of length one. The inputs form a circle; the outputs form an ellipse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polyline points="125.0,100.0 124.8,96.1 124.3,92.2 123.5,88.4 122.3,84.6 120.8,81.0 119.0,77.5 116.9,74.2 114.5,71.1 111.8,68.2 108.9,65.5 105.8,63.1 102.5,61.0 99.0,59.2 95.4,57.7 91.6,56.5 87.8,55.7 83.9,55.2 80.0,55.0 76.1,55.2 72.2,55.7 68.4,56.5 64.6,57.7 61.0,59.2 57.5,61.0 54.2,63.1 51.1,65.5 48.2,68.2 45.5,71.1 43.1,74.2 41.0,77.5 39.2,81.0 37.7,84.6 36.5,88.4 35.7,92.2 35.2,96.1 35.0,100.0 35.2,103.9 35.7,107.8 36.5,111.6 37.7,115.4 39.2,119.0 41.0,122.5 43.1,125.8 45.5,128.9 48.2,131.8 51.1,134.5 54.2,136.9 57.5,139.0 61.0,140.8 64.6,142.3 68.4,143.5 72.2,144.3 76.1,144.8 80.0,145.0 83.9,144.8 87.8,144.3 91.6,143.5 95.4,142.3 99.0,140.8 102.5,139.0 105.8,136.9 108.9,134.5 111.8,131.8 114.5,128.9 116.9,125.8 119.0,122.5 120.8,119.0 122.3,115.4 123.5,111.6 124.3,107.8 124.8,103.9 125.0,100.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="100" x2="116.9" y2="74.2" stroke="#b4232c" stroke-width="2.5"/><line x1="80" y1="100" x2="54.2" y2="63.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="80" y="172" font-size="12" fill="#1f2a44" text-anchor="middle">inputs of length 1</text>
  <text x="165" y="96" font-size="18" fill="#1f2a44" text-anchor="middle">→</text>
  <text x="165" y="118" font-size="12" fill="#1f2a44" text-anchor="middle">matrix</text>
  <polyline points="304.0,91.0 306.1,88.3 307.9,85.7 309.1,83.2 310.0,80.8 310.4,78.5 310.3,76.5 309.7,74.6 308.7,72.9 307.3,71.4 305.4,70.1 303.1,69.0 300.4,68.2 297.3,67.6 293.8,67.3 290.1,67.2 286.0,67.4 281.6,67.8 277.0,68.5 272.2,69.4 267.2,70.5 262.1,71.9 256.9,73.5 251.6,75.3 246.4,77.2 241.1,79.4 236.0,81.7 230.9,84.1 226.0,86.6 221.3,89.3 216.7,92.0 212.5,94.8 208.5,97.7 204.8,100.5 201.5,103.4 198.6,106.2 196.0,109.0 193.9,111.7 192.1,114.3 190.9,116.8 190.0,119.2 189.6,121.5 189.7,123.5 190.3,125.4 191.3,127.1 192.7,128.6 194.6,129.9 196.9,131.0 199.6,131.8 202.7,132.4 206.2,132.7 209.9,132.8 214.0,132.6 218.4,132.2 223.0,131.5 227.8,130.6 232.8,129.5 237.9,128.1 243.1,126.5 248.4,124.7 253.6,122.8 258.9,120.6 264.0,118.3 269.1,115.9 274.0,113.4 278.7,110.7 283.3,108.0 287.5,105.2 291.5,102.3 295.2,99.5 298.5,96.6 301.4,93.8 304.0,91.0" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="100" x2="309.7" y2="74.6" stroke="#b4232c" stroke-width="2.5"/><line x1="250" y1="100" x2="241.2" y2="79.3" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="190" y="22" font-size="12" fill="#b4232c">red: largest stretch 1.44</text>
  <text x="190" y="38" font-size="12" fill="#1d6fd1">blue: smallest stretch 0.50</text>
  <text x="250" y="172" font-size="12" fill="#1f2a44" text-anchor="middle">outputs: an ellipse</text>
</svg>
```

The long half-axis of the ellipse is the largest singular value, $\bar{\sigma} = 1.44$: the most any input is stretched. The short half-axis is the smallest, $\underline{\sigma} = 0.50$. The red and blue lines on the circle are the input directions that get stretched most and least. For $\mathbf{G}(j\omega)$ the same picture holds, but with complex vectors, and a different ellipse at every frequency.
:::

::: context supremum Why "sup" and not "max"
The numbers $0.9, 0.99, 0.999, \dots$ get as close to $1$ as you like but never reach it. They have no largest member — no maximum — but they do have a smallest ceiling, $1$. That ceiling is the **supremum**.

A frequency response can behave the same way. The gain of $(s+1)/(s+2)$ creeps up towards $1$ as $\omega\to\infty$ but never gets there. Its "peak" is not reached at any frequency, yet the H-infinity norm is plainly $1$. Writing $\sup$ instead of $\max$ covers that case.
:::

::: context nyquist-distance How close the loop comes to −1
On a Nyquist plot, the point $L(j\omega)$ traces a curve. The number $1 + L(j\omega)$ is the arrow from $-1$ to that point, so $\lvert 1 + L\rvert$ is the distance from the curve to $-1$. Since $S = 1/(1 + L)$:

$$\lVert S\rVert_\infty = \frac{1}{\min_\omega \lvert 1 + L(j\omega)\rvert} .$$

A sensitivity peak of $2$ means the Nyquist curve passes within $0.5$ of the critical point. Engineers often ask for $\lVert S\rVert_\infty$ below about $2$ ($6\,\mathrm{dB}$) for exactly this reason.
:::

::: context area-vs-peak Height versus area
Here is the squared gain $\lvert G(j\omega)\rvert^2$ of the lesson's spacecraft example, $1/(120s^2 + 90s + 40)$, on ordinary (not logarithmic) axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="50.0,165 50.0,40.0 51.8,40.0 53.6,40.0 55.5,39.9 57.3,39.8 59.1,39.7 60.9,39.6 62.8,39.5 64.6,39.4 66.4,39.2 68.2,39.0 70.1,38.9 71.9,38.7 73.7,38.5 75.5,38.3 77.4,38.1 79.2,37.9 81.0,37.7 82.8,37.5 84.7,37.3 86.5,37.2 88.3,37.1 90.1,37.0 91.9,36.9 93.8,36.9 95.6,36.9 97.4,36.9 99.2,37.1 101.1,37.2 102.9,37.5 104.7,37.8 106.5,38.2 108.4,38.6 110.2,39.2 112.0,39.9 113.8,40.6 115.7,41.4 117.5,42.4 119.3,43.4 121.1,44.6 123.0,45.8 124.8,47.2 126.6,48.7 128.4,50.3 130.3,51.9 132.1,53.7 133.9,55.6 135.7,57.6 137.5,59.6 139.4,61.7 141.2,63.9 143.0,66.2 144.8,68.5 146.7,70.9 148.5,73.3 150.3,75.7 152.1,78.2 154.0,80.6 155.8,83.1 157.6,85.6 159.4,88.0 161.3,90.4 163.1,92.9 164.9,95.2 166.7,97.6 168.6,99.9 170.4,102.2 172.2,104.4 174.0,106.5 175.8,108.7 177.7,110.7 179.5,112.7 181.3,114.7 183.1,116.5 185.0,118.4 186.8,120.1 188.6,121.8 190.4,123.5 192.3,125.1 194.1,126.6 195.9,128.1 197.7,129.5 199.6,130.9 201.4,132.2 203.2,133.4 205.0,134.6 206.9,135.8 208.7,136.9 210.5,138.0 212.3,139.0 214.2,140.0 216.0,141.0 217.8,141.9 219.6,142.7 221.4,143.6 223.3,144.4 225.1,145.1 226.9,145.8 228.7,146.5 230.6,147.2 232.4,147.9 234.2,148.5 236.0,149.1 237.9,149.6 239.7,150.2 241.5,150.7 243.3,151.2 245.2,151.7 247.0,152.1 248.8,152.6 250.6,153.0 252.5,153.4 254.3,153.8 256.1,154.2 257.9,154.5 259.7,154.9 261.6,155.2 263.4,155.5 265.2,155.8 267.0,156.1 268.9,156.4 270.7,156.7 272.5,157.0 274.3,157.2 276.2,157.5 278.0,157.7 279.8,157.9 281.6,158.1 283.5,158.3 285.3,158.5 287.1,158.7 288.9,158.9 290.8,159.1 292.6,159.3 294.4,159.4 296.2,159.6 298.1,159.8 299.9,159.9 301.7,160.1 303.5,160.2 305.3,160.3 307.2,160.5 309.0,160.6 310.8,160.7 312.6,160.8 314.5,160.9 316.3,161.0 318.1,161.2 319.9,161.3 321.8,161.4 323.6,161.5 325.4,161.5 327.2,161.6 329.1,161.7 330.9,161.8 332.7,161.9 334.5,162.0 336.4,162.0 338.2,162.1 340.0,162.2 340.0,165" fill="#8fb8f0" fill-opacity="0.6" stroke="none"/>
  <polyline points="50.0,40.0 51.8,40.0 53.6,40.0 55.5,39.9 57.3,39.8 59.1,39.7 60.9,39.6 62.8,39.5 64.6,39.4 66.4,39.2 68.2,39.0 70.1,38.9 71.9,38.7 73.7,38.5 75.5,38.3 77.4,38.1 79.2,37.9 81.0,37.7 82.8,37.5 84.7,37.3 86.5,37.2 88.3,37.1 90.1,37.0 91.9,36.9 93.8,36.9 95.6,36.9 97.4,36.9 99.2,37.1 101.1,37.2 102.9,37.5 104.7,37.8 106.5,38.2 108.4,38.6 110.2,39.2 112.0,39.9 113.8,40.6 115.7,41.4 117.5,42.4 119.3,43.4 121.1,44.6 123.0,45.8 124.8,47.2 126.6,48.7 128.4,50.3 130.3,51.9 132.1,53.7 133.9,55.6 135.7,57.6 137.5,59.6 139.4,61.7 141.2,63.9 143.0,66.2 144.8,68.5 146.7,70.9 148.5,73.3 150.3,75.7 152.1,78.2 154.0,80.6 155.8,83.1 157.6,85.6 159.4,88.0 161.3,90.4 163.1,92.9 164.9,95.2 166.7,97.6 168.6,99.9 170.4,102.2 172.2,104.4 174.0,106.5 175.8,108.7 177.7,110.7 179.5,112.7 181.3,114.7 183.1,116.5 185.0,118.4 186.8,120.1 188.6,121.8 190.4,123.5 192.3,125.1 194.1,126.6 195.9,128.1 197.7,129.5 199.6,130.9 201.4,132.2 203.2,133.4 205.0,134.6 206.9,135.8 208.7,136.9 210.5,138.0 212.3,139.0 214.2,140.0 216.0,141.0 217.8,141.9 219.6,142.7 221.4,143.6 223.3,144.4 225.1,145.1 226.9,145.8 228.7,146.5 230.6,147.2 232.4,147.9 234.2,148.5 236.0,149.1 237.9,149.6 239.7,150.2 241.5,150.7 243.3,151.2 245.2,151.7 247.0,152.1 248.8,152.6 250.6,153.0 252.5,153.4 254.3,153.8 256.1,154.2 257.9,154.5 259.7,154.9 261.6,155.2 263.4,155.5 265.2,155.8 267.0,156.1 268.9,156.4 270.7,156.7 272.5,157.0 274.3,157.2 276.2,157.5 278.0,157.7 279.8,157.9 281.6,158.1 283.5,158.3 285.3,158.5 287.1,158.7 288.9,158.9 290.8,159.1 292.6,159.3 294.4,159.4 296.2,159.6 298.1,159.8 299.9,159.9 301.7,160.1 303.5,160.2 305.3,160.3 307.2,160.5 309.0,160.6 310.8,160.7 312.6,160.8 314.5,160.9 316.3,161.0 318.1,161.2 319.9,161.3 321.8,161.4 323.6,161.5 325.4,161.5 327.2,161.6 329.1,161.7 330.9,161.8 332.7,161.9 334.5,162.0 336.4,162.0 338.2,162.1 340.0,162.2" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="50" y1="165" x2="340" y2="165" stroke="#1f2a44"/>
  <line x1="50" y1="165" x2="50" y2="20" stroke="#1f2a44"/>
  <line x1="50.0" y1="165" x2="50.0" y2="169" stroke="#1f2a44"/><text x="50.0" y="181" font-size="11" fill="#1f2a44" text-anchor="middle">0</text><line x1="146.7" y1="165" x2="146.7" y2="169" stroke="#1f2a44"/><text x="146.7" y="181" font-size="11" fill="#1f2a44" text-anchor="middle">0.5</text><line x1="243.3" y1="165" x2="243.3" y2="169" stroke="#1f2a44"/><text x="243.3" y="181" font-size="11" fill="#1f2a44" text-anchor="middle">1</text><line x1="340.0" y1="165" x2="340.0" y2="169" stroke="#1f2a44"/><text x="340.0" y="181" font-size="11" fill="#1f2a44" text-anchor="middle">1.5</text>
  <line x1="50" y1="36.9" x2="93.8" y2="36.9" stroke="#b4232c" stroke-dasharray="4 3" stroke-width="1.5"/>
  <circle cx="93.8" cy="36.9" r="4" fill="#b4232c"/>
  <text x="103.8" y="32.9" font-size="12" fill="#b4232c">peak height = (H∞ norm)²</text>
  <text x="189.2" y="77.0" font-size="12" fill="#1d6fd1">shaded area under curve</text>
  <text x="189.2" y="92.0" font-size="12" fill="#1d6fd1">≈ π × (H2 norm)²</text>
  <text x="44" y="29" font-size="11" fill="#1f2a44" text-anchor="end">|G|²</text>
  <text x="195.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">frequency ω (rad/s)</text>
</svg>
```

The H-infinity norm squared is the height of the tallest point, $6.41\times 10^{-4}$ at $0.228\,\mathrm{rad/s}$. The H2 norm squared is the *area* under the curve over all positive frequencies, divided by $\pi$. The shading stops at $1.5\,\mathrm{rad/s}$, which already holds about $98\,\%$ of the area. A tall, thin spike — a lightly damped mode — changes the height enormously and the area only a little.
:::

::: context white-noise Why it is called white
White light is a mix of every color at equal strength. **White noise** is a signal with every frequency at equal strength: its power spectrum is flat. Sampled in time, it looks like a jagged hiss in which each instant has nothing to do with the last.

True white noise would carry infinite power, so it is an idealization. It works because every real system rolls off at high frequency: as long as the noise is flat over the band where the system responds, the system cannot tell the difference.
:::

::: context lyapunov The equation that adds up a whole response
The gramian $\mathbf{P}$ is really an integral, $\mathbf{P} = \int_0^\infty e^{\mathbf{A}t}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\,dt$: the impulse response, squared and added up over all time. Then $\operatorname{tr}(\mathbf{C}\mathbf{P}\mathbf{C}^\mathsf{T})$ is exactly the time-domain H2 formula.

The Lyapunov equation is a way of doing that infinite integral with finite algebra. It is named after the Russian mathematician Aleksandr Lyapunov, whose 1892 thesis on the stability of motion introduced this style of equation. It comes back in state-space stability tests and in the Kalman filter's covariance.
:::

::: context hamiltonian-picture Watching eigenvalues hit the axis
These are the four eigenvalues of $\mathbf{H}_\gamma$ for the spacecraft example, whose true norm is $0.02531$. They always come in mirror-image sets, reflected across both axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="100" x2="336" y2="100" stroke="#6c7a93"/>
  <line x1="230" y1="12" x2="230" y2="188" stroke="#6c7a93"/>
  <text x="338" y="94" font-size="11" fill="#6c7a93">Re</text>
  <text x="234" y="22" font-size="11" fill="#6c7a93">Im</text>
  <circle cx="284.0" cy="27.8" r="5" fill="#1d6fd1"/><circle cx="284.0" cy="172.2" r="5" fill="#1d6fd1"/><circle cx="176.0" cy="27.8" r="5" fill="#1d6fd1"/><circle cx="176.0" cy="172.2" r="5" fill="#1d6fd1"/><g stroke="#b4232c" stroke-width="2.5"><line x1="225.0" y1="34.5" x2="235.0" y2="44.5"/><line x1="225.0" y1="44.5" x2="235.0" y2="34.5"/></g><g stroke="#b4232c" stroke-width="2.5"><line x1="225.0" y1="155.5" x2="235.0" y2="165.5"/><line x1="225.0" y1="165.5" x2="235.0" y2="155.5"/></g><g stroke="#b4232c" stroke-width="2.5"><line x1="225.0" y1="64.4" x2="235.0" y2="74.4"/><line x1="225.0" y1="74.4" x2="235.0" y2="64.4"/></g><g stroke="#b4232c" stroke-width="2.5"><line x1="225.0" y1="125.6" x2="235.0" y2="135.6"/><line x1="225.0" y1="135.6" x2="235.0" y2="125.6"/></g>
  <text x="220" y="43.5" font-size="11" fill="#b4232c" text-anchor="end">j0.288</text>
  <text x="220" y="73.4" font-size="11" fill="#b4232c" text-anchor="end">j0.145</text>
  <text x="10" y="30" font-size="12" fill="#1d6fd1">● γ = 0.030</text>
  <text x="10" y="46" font-size="12" fill="#1d6fd1">off the axis, so</text>
  <text x="10" y="62" font-size="12" fill="#1d6fd1">‖G‖∞ &lt; 0.030</text>
  <text x="10" y="150" font-size="12" fill="#b4232c">× γ = 0.0252</text>
  <text x="10" y="166" font-size="12" fill="#b4232c">on the axis, so</text>
  <text x="10" y="182" font-size="12" fill="#b4232c">‖G‖∞ ≥ 0.0252</text>
</svg>
```

With $\gamma = 0.030$, above the norm, all four sit off the imaginary axis (blue dots): the test passes. With $\gamma = 0.0252$, slightly below the norm, they have landed on the axis at $\pm j0.288$ and $\pm j0.145$ (red crosses). Those are the two frequencies where $\lvert G(j\omega)\rvert = 0.0252$ — on either side of the peak at $0.228$. Bisection squeezes $\gamma$ between these two behaviors.
:::

::: context wheel-imbalance Where the wheel's buzz comes from
A reaction wheel spins at thousands of revolutions per minute. No wheel is perfectly balanced, so a tiny off-center mass pulls the spacecraft around once per revolution, and the bearings add smaller tones at other multiples of the spin rate. As the controller speeds the wheel up and down, those tones sweep across the frequency range.

Modeling all that as white noise is an averaging trick. It is fine for an RMS budget, but it hides the moment a sweeping tone lines up with a structural mode — which is a worst-case question, and an H-infinity one.
:::

::: context arcsecond How small an arcsecond is
Cut a degree into $60$ arcminutes, and each arcminute into $60$ arcseconds. One arcsecond is $1/3600$ of a degree, or $4.85\,\mathrm{\mu rad}$. That is the angle across a human hair about $0.1\,\mathrm{mm}$ thick seen from about $20\,\mathrm{m}$ away.

An RMS error of $2.43\,\mathrm{arcsec}$ is fine for most Earth-observing satellites. Space telescopes need far better: the Hubble Space Telescope holds its aim steady to about $0.007\,\mathrm{arcsec}$.
:::
