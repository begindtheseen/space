---
id: l11-adaptive-control
title: Adaptive control and its use and abuse
minutes: 23
covers:
  - Adaptive control (MRAC, L1 adaptive) and its use and abuse in aerospace
---

Picture adjusting a shower you have never used. You turn the knob, feel the water, turn it again. You never read a manual on the plumbing. You learn the knob by using it. That is the dream of **adaptive control**: a controller that learns the vehicle while it flies, adjusting itself until the response matches what you wanted.

Robust control, the subject of this module so far, buys safety another way. It prepares for the worst plant in a set. When the set is large — a damaged airframe, an unknown payload, a Mach number where the aerodynamics were never measured — that preparation is expensive, and learning looks tempting. **Model reference adaptive control** (MRAC) does exactly that learning, with an elegant proof that the tracking error goes to zero. It has been a mainstay of research since the 1960s.

It has also killed people. On 15 November 1967, X-15 flight 3-65-97 broke up during re-entry, and its pilot, Michael Adams, died. The aircraft carried the **[[MH-96 self-adaptive flight control system|x15-mh96]]**. An electrical disturbance and a drift in heading sent it into a hypersonic spin. During the recovery the adaptive system drove a growing pitch oscillation that exceeded the airframe's structural limits. The proof of convergence was never wrong. It did not apply to the aircraft that was flying.

This lesson derives the classic adaptive law and its proof, then shows with numbers what the proof does not deliver. It covers the fixes that make adaptation usable, the L1 design that stops fast learning from fighting robustness, and the place adaptation actually holds in flight programs.

## Model reference adaptive control

Take the simplest case that shows everything. The plant is first order with unknown numbers $a$ and $b$:

$$\dot{x} = a\,x + b\,u,$$

where $b \ne 0$ and we know its sign (we know which way the control pushes) but not its size.

You write down the response you want as a **[[reference model|reference-model]]** — a small, well-behaved system the real one should copy:

$$\dot{x}_m = a_m x_m + b_m r, \qquad a_m < 0.$$

Here $r$ is the command and $x_m$ ("x sub m") is the model's ideal response. The control law is $u = k_x x + k_r r$, with two adjustable gains.

If $a$ and $b$ were known, the **matching gains**

$$k_x^\star = \frac{a_m - a}{b}, \qquad k_r^\star = \frac{b_m}{b}$$

(read "k x star", "k r star") would make the closed loop identical to the reference model. Check: substituting gives $\dot{x} = (a + bk_x^\star)x + bk_r^\star r = a_m x + b_m r$. But $a$ and $b$ are not known, so $k_x$ and $k_r$ are adjusted while flying.

### The adaptive law and its proof

Define the **tracking error** $e = x - x_m$ and the **parameter errors** $\tilde{k}_x = k_x - k_x^\star$ and $\tilde{k}_r = k_r - k_r^\star$ (read "k x tilde": how far the gain is from ideal). Subtract the model from the plant:

$$\dot{e} = a\,x + b(k_xx + k_rr) - a_mx_m - b_mr = a_me + b\,\tilde{k}_x\,x + b\,\tilde{k}_r\,r.$$

The matching conditions canceled every term that does not involve a parameter error.

Now pick an energy-like quantity that is positive whenever anything is wrong:

$$V = e^2 + \frac{\lvert b\rvert}{\gamma}\left(\tilde{k}_x^2 + \tilde{k}_r^2\right),$$

where $\gamma > 0$ ("gamma") is the **adaptation gain** — how fast the gains are allowed to move. The ideal gains are constants, so $\dot{\tilde{k}} = \dot{k}$. Differentiate:

$$\dot{V} = 2a_me^2 + 2b\,e\left(\tilde{k}_xx + \tilde{k}_rr\right) + \frac{2\lvert b\rvert}{\gamma}\left(\tilde{k}_x\dot{k}_x + \tilde{k}_r\dot{k}_r\right).$$

The middle term contains the unknown errors, and its sign could be anything. So choose the gain updates to cancel it:

$$\dot{k}_x = -\gamma\,\operatorname{sgn}(b)\,e\,x, \qquad \dot{k}_r = -\gamma\,\operatorname{sgn}(b)\,e\,r .$$

($\operatorname{sgn}(b)$ is the sign of $b$: $+1$ or $-1$.) Check the $x$ term: $2be\tilde{k}_xx + (2\lvert b\rvert/\gamma)\tilde{k}_x(-\gamma\operatorname{sgn}(b)ex) = 2be\tilde{k}_xx - 2be\tilde{k}_xx = 0$, because $\lvert b\rvert\operatorname{sgn}(b) = b$. The $r$ term cancels the same way, leaving

$$\dot{V} = 2a_m\,e^2 \le 0 .$$

So $V$ never increases. That keeps $e$ and both parameter errors bounded, and a result called **[[Barbalat's lemma|barbalat]]** then gives $e(t)\to 0$. Only the *sign* of $b$ was needed. Its size, and $a$, stayed unknown throughout. That is the attraction, and it is real.

::: key What the MRAC proof gives and does not give
It gives: boundedness of all signals and $e(t)\to 0$, using only $\operatorname{sgn}(b)$. It does **not** give parameter convergence — $\tilde{k}\to 0$ needs persistent excitation — nor any bound on the transient, nor any robustness to unmodeled dynamics, disturbances or time delay. The gain $\gamma$ sets the adaptation rate, and raising it to speed convergence makes the closed loop more oscillatory and less robust.
:::

::: example Tracking without learning
Simulate the law with $a = -1$, $b = 2$, reference model $\dot{x}_m = -3x_m + 3r$, adaptation gain $\gamma = 1$, and both gains starting at zero.

**The ideal gains.** $k_x^\star = (-3 - (-1))/2 = -1$ and $k_r^\star = 3/2 = 1.5$.

**Constant command, $r = 1$.** After sixty seconds the tracking error is $7\times 10^{-14}$ — the proof delivers exactly what it promised. But the gains settle at $k_x = -0.082$ and $k_r = 0.582$, nowhere near $(-1,\ 1.5)$.

What they do get right is the sum: $-0.082 + 0.582 = 0.500$, and the ideal pair also gives $-1 + 1.5 = 0.5$. Why only the sum? At steady state $x = 1$ and $r = 1$, so the plant only ever sees $u = (k_x + k_r)\cdot 1$. It needs $\dot{x} = 0$, so $-1 + 2(k_x + k_r) = 0$, giving $k_x + k_r = 0.5$. The data cannot tell the two gains apart. The adaptation has found *a* controller that tracks this command, not *the* controller that matches the model.

**Rich command, $r(t) = 1 + 0.7\sin 0.7t + 0.5\sin 2.3t$.** After two hundred seconds the gains are $k_x = -0.967$ and $k_r = 1.474$, closing in on the ideal pair.

**[[Persistent excitation|persistent-excitation]]** — enough different frequencies in the signals to pull the gains apart — is what turns tracking into learning. A vehicle in normal operation does not provide it. A spacecraft holding attitude, or an airliner in cruise, offers almost no excitation. So the estimates wander along the line the data cannot pin down, with nothing to stop them. That wandering is called **parameter drift**, and it drives the next example.
:::

## The Rohrs counterexamples

In 1985 **[[Rohrs, Valavani, Athans and Stein|rohrs-1985]]** published a set of simulations that changed how the field saw itself. They took a textbook MRAC design and added dynamics the designer had not modeled — a modest, entirely realistic second-order lag — plus a small command signal. It went unstable. Nothing unreasonable had been done. The proof assumed the plant's order and relative degree were known exactly, and they were not.

::: example Unmodeled dynamics destroy the adaptive loop
Keep the design model $2/(s+1)$ that the adaptation was built for, but let the real plant be

$$P(s) = \frac{2}{s+1}\cdot\frac{229}{s^2 + 30s + 229}.$$

**The hidden factor.** It is second order with natural frequency $\omega_n = \sqrt{229} = 15.13\,\mathrm{rad/s}$ and damping $\zeta = 30/(2 \times 15.13) = 0.991$ — heavily damped, gain exactly $1$ at zero frequency, invisible below a few rad/s. On a frequency-response plot it looks like a harmless high-frequency roll-off.

**The command.** Drive the loop with $r(t) = 0.3 + 1.85\sin(16.1t)$. That frequency is chosen with care. At $16.1\,\mathrm{rad/s}$ the design model contributes a gain of $0.124$ at $-86.45^\circ$, and the hidden factor contributes $0.473$ at $-93.58^\circ$. The total phase is $-86.45 - 93.58 = -180.0^\circ$: the **[[real plant turns the signal upside down|phase-crossover]]**. The adaptation, which has no idea of phase at all, keeps raising the loop gain to track a signal the plant inverts.

**The result.** The simulation diverges at $t = 31.4\,\mathrm{s}$, with $k_x$ running off to large negative values and the output passing $10^6$. Cutting the time step by four gives the same answer, so it is the dynamics, not the numerics. And before the blow-up nothing looks alarming. The output tracks tolerably and the error is small. A monitor watching tracking error would see nothing for half a minute.

**The repair.** Now add **σ-modification** ("sigma modification"): a **[[leakage term|leakage]]** $-\sigma\gamma k$ in each adaptation law, which pulls the gains back toward zero whenever the data stop pushing them. With $\sigma = 0.2$ the same simulation runs for two hundred seconds with a peak output of $0.365$, and the gains hover near $k_x = -0.025$, $k_r = 0.565$. Bounded and stable — and no longer heading for the ideal gains. That is the honest trade: leakage gives up the exact matching point in exchange for keeping the parameters in a bounded set.
:::

```python
import numpy as np

# Rohrs' plant: the design model 2/(s+1) plus unmodeled dynamics the designer never saw.
wn2, z2 = 229.0, 30.0                       # 229/(s^2 + 30 s + 229), wn = 15.13, zeta = 0.99
ref = lambda t: 0.3 + 1.85 * np.sin(16.1 * t)


def deriv(st, t, gamma, sigma):
    y, x1, x2, ym, kx, kr = st
    r, e = ref(t), st[0] - st[3]
    u = kx * y + kr * r
    v = x1                                   # plant input after the unmodeled second order
    return np.array([-y + 2 * v,
                     x2,
                     -wn2 * x1 - z2 * x2 + wn2 * u,
                     -3 * ym + 3 * r,
                     -gamma * e * y - sigma * gamma * kx,
                     -gamma * e * r - sigma * gamma * kr])


def run(T=40.0, dt=2e-4, gamma=1.0, sigma=0.0):
    st, t, peak = np.zeros(6), 0.0, 0.0
    for _ in range(int(T / dt)):
        k1 = deriv(st, t, gamma, sigma)
        k2 = deriv(st + dt / 2 * k1, t + dt / 2, gamma, sigma)
        k3 = deriv(st + dt / 2 * k2, t + dt / 2, gamma, sigma)
        k4 = deriv(st + dt * k3, t + dt, gamma, sigma)
        st, t = st + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4), t + dt
        peak = max(peak, abs(st[0]))
        if abs(st[0]) > 1e6:
            return t, peak, st
    return None, peak, st


t_fail, peak, st = run()
print(f"plain MRAC:        diverges at t = {t_fail:.1f} s")
t_fail, peak, st = run(sigma=0.2)
print(f"sigma-modification: diverges at {t_fail}, peak |y| = {peak:.4f}, gains = {st[4]:.4f}, {st[5]:.4f}")
# plain MRAC:        diverges at t = 31.4 s
# sigma-modification: diverges at None, peak |y| = 0.3647, gains = -0.0239, 0.5648
```

(The script runs forty seconds, so its final gains differ slightly from the two-hundred-second values quoted above.)

### The standard repairs

Four fixes appear in every serious implementation. They all do one job: stop the parameters drifting into regions where the loop is no longer stable.

- **σ-modification**: add $-\sigma\gamma k$ to the adaptation law. Simple and always bounded, but it shifts the resting point away from the ideal gains.
- **e-modification**: add $-\sigma\gamma\lvert e\rvert k$ instead. The leak switches off when tracking is perfect, so the ideal resting point survives.
- **Projection**: keep the parameters inside a box (a convex set) known before flight to contain the true values. Most flight implementations use this. The bound is explicit and checkable, and it fits the certification argument: the adaptive gains provably never leave a box that was analyzed offline.
- **Dead zone**: stop adapting when the error is below a threshold, so noise and small unmodeled effects do not push the estimates around.

::: warning Adaptation does not add robustness; it consumes it
It feels as if a controller that adjusts itself must tolerate more uncertainty. The Rohrs example shows exactly why that is wrong. Adaptation is high-gain feedback on an estimator, and like any high-gain loop it is fragile to unmodeled phase. A fixed robust controller has a margin you can compute. An adaptive controller has a margin that changes as it adapts, and the frequency-domain tools of this module — small gain, $\mu$, disk margins — do not apply to it at all without extra work.
:::

## L1 adaptive control

The classic dilemma is that one knob, $\gamma$, sets two things at once: how fast the estimate converges, and how much high-frequency jitter the adaptation pushes into the plant. Turn it up and the first improves while the second gets worse.

Think of a nervous backseat driver shouting corrections many times a second. You can still listen to them — if you only act on the *average* of what they say over the last second. That is the idea of **L1 adaptive control**. It keeps a fast estimator: a **state predictor** whose parameters adapt at a very high rate, with projection. But it does **not** send the estimate straight to the actuator. The control signal first passes through a **[[low-pass filter|l1-architecture]]** $C(s)$ chosen by the designer — a filter that lets slow changes through and blocks fast ones:

$$u(s) = -C(s)\left[\hat{\eta}(s) - k_g\,r(s)\right],$$

where $\hat{\eta}$ ("eta hat") is the estimated total uncertainty and $k_g$ a feedforward gain on the command. The estimator may run as fast as the processor allows, because its high-frequency noise is removed before it reaches the plant. What survives is the low-frequency part of the estimate, which is the part worth canceling.

::: key Why L1 is the variant that gets flown
MRAC can lose robustness to unmodelled dynamics and time delay, and its transient behavior is hard to certify. L1 adaptive control decouples adaptation rate from robustness with a low-pass filter, which is why it is the variant that actually gets flown.
:::

Two properties follow.

**Uniform transient bounds.** The gap between the actual response and that of an ideal reference system is bounded by a constant over $\sqrt{\Gamma}$, where $\Gamma$ is the adaptation gain. So adapting faster makes the transient uniformly smaller — a guarantee MRAC cannot offer.

**A stability condition on the filter.** Write $G(s) = H(s)(1 - C(s))$, where $H(s)$ is the reference-model transfer function. The design must satisfy

$$\lVert G(s)\rVert_{\mathcal{L}_1}\,L < 1,$$

where $\lVert\cdot\rVert_{\mathcal{L}_1}$ is the **[[L1 norm|l1-norm]]** — the integral of the absolute value of the impulse response — and $L$ is the **[[Lipschitz bound|lipschitz]]** of the uncertainty, a limit on how steeply it can change with the state. Notice the shape: a gain times a gain below one. It is a small gain test.

::: example What the filter bandwidth buys and costs
Take $H(s) = 2/(s+3)$ and a first-order filter $C(s) = \omega_c/(s + \omega_c)$ with bandwidth $\omega_c$. Then $1 - C(s) = s/(s+\omega_c)$, so

$$G(s) = \frac{2s}{(s+3)(s+\omega_c)}.$$

Computing the $\mathcal{L}_1$ norm of its impulse response, and the tolerable $L = 1/\lVert G\rVert_{\mathcal{L}_1}$:

| $\omega_c$ (rad/s) | $\lVert G\rVert_{\mathcal{L}_1}$ | tolerable $L$ | $\lvert C(j16.1)\rvert$ |
| --- | --- | --- | --- |
| 1 | 0.770 | 1.30 | 0.062 |
| 5 | 0.372 | 2.69 | 0.297 |
| 10 | 0.239 | 4.19 | 0.528 |
| 30 | 0.103 | 9.69 | 0.881 |

Read down the first columns. Widening the filter relaxes the condition: a wider $C$ cancels more of the uncertainty, so a larger nonlinearity is tolerable. Sanity check on the top row: $1/0.770 = 1.30$.

Now read the last column. It is the Rohrs frequency. At $\omega_c = 1\,\mathrm{rad/s}$ only six percent of the adaptation's content at $16.1\,\mathrm{rad/s}$ reaches the plant. At $\omega_c = 30\,\mathrm{rad/s}$, eighty-eight percent does, and the unmodeled dynamics are excited exactly as in the MRAC failure.

So the filter bandwidth is the one design knob, and it trades performance against robustness in a measurable way: wide enough to cancel the uncertainty you care about, narrow enough to stay below the dynamics you did not model. That trade is visible, adjustable and reportable — which is exactly what the classic adaptation gain $\gamma$ was not.
:::

## Where adaptation sits in a flight program

What industry actually does is narrower than the research papers, and worth stating plainly.

**Adaptive augmentation, not adaptive control.** The certified baseline is a fixed, analyzed controller with verified margins. The adaptive part is added alongside it with **limited authority** — a hard cap on how much it can command — and a monitor that switches it off on any of several triggers. So the vehicle never flies on the adaptive law alone, and the failure mode is falling back to the baseline, not diverging.

**Verification is by Monte Carlo, because nothing else applies.** An adaptive loop is nonlinear and time-varying, so this module's disk margins and $\mu$ analyses cannot be computed for it. Programs use very large dispersion campaigns on the nonlinear six-degree-of-freedom simulation instead, plus a **time-delay margin** found by direct simulation: add delay until the loop fails. That is the single most informative robustness number for an adaptive law.

**Flight experience exists and is instructive.** NASA flew neural-network adaptive augmentation on a modified F-15 in the **[[Intelligent Flight Control System|ifcs-airstar]]** program in the 2000s, showing recovery of handling qualities after simulated control-surface failures. L1 adaptive control has been flight-tested on NASA's AirSTAR subscale transport and on Calspan's variable-stability Learjet. Those programs chose it for the predictable transient and the explicit filter knob. The X-15 remains the cautionary case, and the lesson drawn inside the industry is not "never adapt" but "never let an adaptive element have unlimited authority over a structurally limited airframe".

::: warning Ask what happens when adaptation is wrong, not when it is right
Every adaptive scheme is shown off with the case it handles: a failure occurs, the estimate converges, performance returns. The question that decides certification is the other one — what the loop does when the estimate is wrong, when there is no excitation, when the sensor feeding the estimator fails, and when the true plant lies outside the projection set. If the answer is not "fall back to the baseline within a bounded envelope", the design is not flyable, however good the demonstration looked.
:::

## Check yourself

::: check
The MRAC Lyapunov derivation gives $\dot{V} = 2a_me^2$. Why does that not prove the gains converge to $k_x^\star$ and $k_r^\star$?
:::

::: answer
$\dot{V}$ is only negative *semi*-definite in the combined state $(e, \tilde{k}_x, \tilde{k}_r)$. It is zero whenever $e = 0$, whatever the parameter errors are. So $V$ stops decreasing on a whole surface, not at a single point.

Lyapunov's theorem then gives boundedness of everything, and with Barbalat's lemma, $e\to 0$. But the parameter errors can settle anywhere on that surface.

The simulation showed this concretely: with a constant command the gains ended at $(-0.082,\ 0.582)$ rather than $(-1,\ 1.5)$, with only the combination $k_x + k_r = 0.5$ pinned down. Parameter convergence needs persistent excitation — the regressor vector $(x, r)$ — the signals the gains multiply — must span the parameter space over every time window — and a vehicle holding a steady condition provides nothing of the sort.
:::

::: check
In the Rohrs example, why is $16.1\,\mathrm{rad/s}$ the dangerous frequency rather than, say, $1$ or $100\,\mathrm{rad/s}$?
:::

::: answer
It is where the total phase of the true plant reaches $-180^\circ$. The design model $2/(s+1)$ contributes $-86.45^\circ$ there and the unmodeled factor $229/(s^2+30s+229)$ adds $-93.58^\circ$, summing to $-180.0^\circ$.

At $1\,\mathrm{rad/s}$ the unmodeled dynamics have gain close to one and almost no phase, so the design model is accurate and the adaptation behaves as its proof assumes. At $100\,\mathrm{rad/s}$ the plant gain is so small that no realistic excitation gets through the loop.

The danger sits exactly where the unmodeled phase has piled up to inversion while the gain is still noticeable. That is also where the classic gain margin of a *fixed* controller would be measured. The adaptive law has no concept of gain margin, so it drives the gain up through that point without noticing.
:::

::: check
What does projection buy over σ-modification, and why do flight programs prefer it?
:::

::: answer
σ-modification guarantees boundedness but gives no explicit bound. The parameters end up somewhere, and where depends on the trajectory, so an offline analysis cannot list the closed loops that might occur. It also shifts the resting point away from the ideal gains even when the plant matches perfectly, so perfect tracking is lost.

Projection keeps the parameters inside a convex set fixed before flight. The bound is explicit and chosen by the engineer, and the ideal gains are inside it, so nominal performance is unharmed. Decisively for certification, the set of closed loops the adaptive controller can ever produce is a known, finite-dimensional family that can be analyzed offline with the ordinary robust tools. The verification argument becomes "every controller in the reachable set has acceptable margins", which a review board can accept.
:::

::: check
An L1 design has $\lVert G\rVert_{\mathcal{L}_1} = 0.37$ and the uncertainty has Lipschitz bound $L = 2.0$. Is the condition met, and what happens if the true $L$ turns out to be $3$?
:::

::: answer
$\lVert G\rVert_{\mathcal{L}_1}L = 0.37\times 2.0 = 0.74 < 1$. The condition is met, with a margin factor of $1/0.74 = 1.35$ on the uncertainty.

If the true Lipschitz bound is $3$, the product is $0.37 \times 3 = 1.11 > 1$ and the guarantee is void. That is not proof of instability — like the small gain theorem, the condition is sufficient only — but the certificate is gone.

The remedies have the same shape as elsewhere in this module. Widen $C(s)$ to reduce $\lVert G\rVert_{\mathcal{L}_1}$: from the table, $\omega_c = 10\,\mathrm{rad/s}$ takes it to $0.239$ and restores the condition ($0.239 \times 3 = 0.72$). The cost is passing more than half the adaptation's content at $16\,\mathrm{rad/s}$ into the plant. Whether that is acceptable depends on what dynamics live up there — which brings the problem back to an honest uncertainty model, where this module started.
:::

::: check
A program proposes replacing its gain-scheduled launch vehicle controller with an adaptive one, arguing that adaptation removes the need for the schedule. Respond.
:::

::: answer
Three objections.

First, the launch vehicle's parameter changes are known in advance and measurable — dynamic pressure, Mach number and propellant mass are all available. There is nothing to learn. A schedule, or better an LPV design with a rate-bounded guarantee, uses information the adaptive law would have to rediscover in flight. Adaptation is for uncertainty you cannot predict, not for variation you can.

Second, the flight lasts a few hundred seconds with no persistent excitation, and the loop must never misbehave in the high dynamic pressure window. An adaptive transient at maximum dynamic pressure has no margin to spend.

Third, the verification burden flips. The scheduled design can be swept for frozen margins and certified with a rate-bound argument or a quadratic stability certificate. The adaptive design has no computable margins and must be argued entirely on dispersion campaigns.

Where adaptation earns its place on a launch vehicle is as bounded-authority augmentation for off-nominal cases the schedule cannot cover — an engine out, a stuck control surface — with a monitor that hands control back to the baseline.
:::

## Summary

| Item | Statement |
| --- | --- |
| MRAC setup | plant $\dot x = ax + bu$, model $\dot x_m = a_mx_m + b_mr$, law $u = k_xx + k_rr$ |
| Matching gains | $k_x^\star = (a_m - a)/b$, $k_r^\star = b_m/b$ |
| Error dynamics | $\dot e = a_me + b\tilde k_xx + b\tilde k_rr$ |
| Adaptation law | $\dot k_x = -\gamma\operatorname{sgn}(b)\,ex$, $\dot k_r = -\gamma\operatorname{sgn}(b)\,er$, giving $\dot V = 2a_me^2 \le 0$ |
| What it proves | bounded signals and $e\to 0$; not parameter convergence, not transient bounds, not robustness |
| Persistent excitation | constant command gives only $k_x + k_r = 0.5$; three-frequency command gives $(-0.967,\ 1.474)$ toward $(-1,\ 1.5)$ |
| Rohrs failure | $2/(s+1)$ with unmodeled $229/(s^2+30s+229)$ and $r = 0.3 + 1.85\sin 16.1t$ diverges at $t = 31.4\,\mathrm{s}$ |
| Why $16.1$ | design model $-86.45^\circ$ plus unmodeled $-93.58^\circ$ equals $-180.0^\circ$ |
| Repairs | σ-modification, e-modification, projection (preferred in flight), dead zone |
| L1 architecture | fast projected estimator, low-pass $C(s)$ in the control path; transient bound scales as $1/\sqrt{\Gamma}$ |
| L1 condition | $\lVert H(s)(1 - C(s))\rVert_{\mathcal{L}_1}L < 1$; wider $C$ relaxes it but passes more high-frequency content |
| Flight practice | bounded-authority augmentation of a certified baseline, monitors, Monte Carlo verification, measured time-delay margin |

The last lesson of the module asks what all of this has to satisfy before a vehicle flies: margin requirements swept across an envelope, the discrete-time analysis the flight computer forces on you, and the handling-qualities criteria a pilot imposes.

::: context x15-mh96 The X-15's adaptive autopilot
The X-15 was a rocket plane dropped from a B-52 that flew to the edge of space in the 1960s. Its third airframe carried the Minneapolis-Honeywell MH-96, which raised its own gains until the aircraft's response began to oscillate slightly, then backed off — a way of keeping the gains high as the air thinned. On flight 3-65-97 the gains stayed near their limit while the aircraft dived back into thicker air, and the loop fell into a sustained pitch oscillation (a **limit cycle**). The growing air loads broke the aircraft apart. The accident is still taught as the textbook case of adaptive control outside its assumptions.
:::

::: context reference-model Writing the answer down first
A reference model is the behavior you *wish* the vehicle had, written as a small equation. With $\dot{x}_m = -3x_m + 3r$, a step command makes $x_m$ rise smoothly to the command with a time constant of $1/3\,\mathrm{s}$ — no overshoot, no wobble. The adaptive controller's only job is to make the real $x$ copy $x_m$. It is like a tracing: the model draws the line, and the controller learns to follow it.
:::

::: context barbalat Why the error must go to zero
$V$ never increases and never goes below zero, so it settles to some final value. Integrating $\dot{V} = 2a_me^2$ then shows that the total $\int_0^\infty e^2\,dt$ is finite. A function with finite total squared area *could* still have sharp spikes forever — unless its rate of change is bounded, which it is here, since every signal is bounded. **Barbalat's lemma**, published by the Romanian mathematician Ioan Barbălat in 1959, makes that argument precise: a smooth enough function whose integral converges must itself go to zero.
:::

::: context persistent-excitation Tracking is not learning
The gain plane: the dashed line is $k_x + k_r = 0.5$, every point of which tracks a constant command perfectly. With $r = 1$ the gains (blue) run from the start at $(0, 0)$ onto the line and stop at $(-0.082, 0.582)$. With the rich command (orange) they wander toward the ideal pair $(-1, 1.5)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="200" x2="340" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="14" x2="40" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <text x="330" y="214" font-size="11" fill="#6c7a93">k_x</text>
  <text x="8" y="22" font-size="11" fill="#6c7a93">k_r</text>
  <line x1="40" y1="21.5" x2="320" y2="168.5" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5,4"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="1.5" points="280.0,200.0 163.0,143.9 184.0,113.0 172.4,113.2 184.6,103.7 181.0,96.5 179.0,93.1 165.2,97.2 169.1,89.4 174.5,83.5 174.0,81.0 157.7,87.8 148.6,85.9 155.6,79.9 163.5,73.0 146.5,80.7 134.8,82.6 139.6,77.9 144.8,72.5 134.2,75.8 128.3,76.4 133.8,72.0 133.2,70.6 130.0,70.2 125.1,71.2 131.1,67.0 125.2,67.6 126.7,65.5 123.2,66.3 126.9,63.5 115.1,66.9 118.9,64.1 122.9,60.4 121.0,60.3 108.9,65.0 113.5,62.0 118.7,57.5 114.8,58.7 106.6,62.0 111.2,59.0 112.2,57.0 110.5,57.5 105.1,59.5 108.5,57.2 105.7,57.1 106.7,56.3 103.1,57.2 105.6,55.5 100.2,57.0 102.2,55.6 102.6,54.2 103.4,53.3 97.8,55.5 100.1,53.7 102.1,52.0 102.0,51.5 97.0,53.8 97.9,52.5 99.5,51.2 100.1,50.4 95.8,52.5 95.2,52.1 95.7,51.2 96.7,50.3 94.0,51.3 93.4,51.1 93.4,50.7 93.7,50.3 93.1,49.9 92.5,49.9 92.7,49.5 92.5,49.3 92.8,48.7 92.2,48.8 92.1,48.6 90.6,48.8 91.4,48.2 92.1,47.5 91.0,47.9 88.6,48.7 89.6,48.0 91.0,46.8 89.5,47.4 87.6,48.0 88.8,47.3 89.1,46.8 88.5,47.0 87.3,47.4 88.4,46.7 87.8,46.6 87.9,46.5 86.9,46.8 87.8,46.2 86.2,46.6 86.8,46.3 86.8,46.0 87.2,45.7 85.2,46.4 85.9,45.9 86.7,45.3 86.6,45.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="280.0,200.0 281.3,175.8 295.2,140.5 315.9,121.2 307.3,124.7 267.5,140.8 246.0,150.1 249.4,148.2 260.6,141.4 269.4,136.3 271.0,135.3 266.9,137.4 262.3,139.7 260.8,140.5 262.0,139.8 263.9,138.9 263.7,138.9"/>
  <circle cx="280" cy="200" r="4" fill="#1f2a44"/>
  <text x="284" y="194" font-size="11" fill="#1f2a44">start</text>
  <circle cx="263.7" cy="138.9" r="4" fill="#1d6fd1"/>
  <line x1="56" y1="168" x2="76" y2="168" stroke="#1d6fd1" stroke-width="2"/>
  <text x="82" y="172" font-size="11" fill="#1d6fd1">r = 1: stops on the line</text>
  <line x1="56" y1="186" x2="76" y2="186" stroke="#f2b880" stroke-width="2"/>
  <text x="82" y="190" font-size="11" fill="#1f2a44">rich command</text>
  <circle cx="80" cy="42.5" r="5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="96" y="30" font-size="11" fill="#b4232c">ideal (−1, 1.5)</text>
</svg>
```
:::

::: context rohrs-1985 The paper that sobered a field
Charles Rohrs, Lena Valavani, Michael Athans and Gunter Stein published "Robustness of continuous-time adaptive control algorithms in the presence of unmodeled dynamics" in the *IEEE Transactions on Automatic Control* in 1985. Its examples were deliberately ordinary: a first-order plant, a mild extra lag, a sinusoidal command. That ordinariness was the point. It launched a decade of work on "robust adaptive control" — the leakage, projection and dead-zone fixes in this lesson all come from that period.
:::

::: context phase-crossover Where the phase runs out
Phase of the design model (blue), the hidden factor (orange) and the true plant (red), from $1$ to $100\,\mathrm{rad/s}$ on a log scale. The red curve crosses $-180^\circ$ at $16.1\,\mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="190" x2="320" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="133.3" x2="320" y2="133.3" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="209" y1="20" x2="209" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <g font-size="11" fill="#6c7a93">
    <text x="34" y="24" text-anchor="end">0°</text><text x="34" y="80" text-anchor="end">−90°</text>
    <text x="34" y="137" text-anchor="end">−180°</text><text x="34" y="194" text-anchor="end">−270°</text>
    <text x="40" y="206" text-anchor="middle">1</text><text x="180" y="206" text-anchor="middle">10</text><text x="320" y="206" text-anchor="middle">100</text>
    <text x="209" y="216" text-anchor="middle">16.1 rad/s</text>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,48.3 54.0,52.5 68.0,56.4 82.0,59.9 96.0,63.0 110.0,65.6 124.0,67.8 138.0,69.6 152.0,71.0 166.0,72.1 180.0,73.1 194.0,73.8 208.0,74.4 222.0,74.9 236.0,75.2 250.0,75.5 264.0,75.8 278.0,75.9 292.0,76.1 306.0,76.2 320.0,76.3"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2" points="40.0,24.7 54.0,25.9 68.0,27.5 82.0,29.4 96.0,31.8 110.0,34.7 124.0,38.4 138.0,42.9 152.0,48.3 166.0,54.7 180.0,62.0 194.0,70.0 208.0,78.3 222.0,86.6 236.0,94.3 250.0,101.3 264.0,107.3 278.0,112.3 292.0,116.5 306.0,119.9 320.0,122.6"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,53.1 54.0,58.4 68.0,63.8 82.0,69.3 96.0,74.8 110.0,80.4 124.0,86.2 138.0,92.5 152.0,99.3 166.0,106.9 180.0,115.1 194.0,123.8 208.0,132.7 222.0,141.5 236.0,149.6 250.0,156.8 264.0,163.0 278.0,168.3 292.0,172.6 306.0,176.1 320.0,178.9"/>
</svg>
```

Below about $3\,\mathrm{rad/s}$ the orange curve hardly moves — which is why nobody worries about it until an adaptive loop pushes gain up there.
:::

::: context leakage Why it is called leakage
Picture the gain as water in a bucket with a small hole. The adaptation law pours water in or scoops it out, following the error. The $-\sigma\gamma k$ term is the hole: it always drains the bucket a little toward empty. If the data keep pouring, the level holds. If the data go quiet — no excitation — the level sinks back toward zero instead of drifting off. The price is that the level never quite reaches the ideal value, because the leak is always running.
:::

::: context l1-architecture Where the filter sits
The estimator runs fast and noisy. The filter $C(s)$ lets only its slow part reach the plant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="90" height="40" rx="4"/>
    <rect x="150" y="30" width="70" height="40" rx="4"/>
    <rect x="260" y="30" width="80" height="40" rx="4"/>
    <rect x="130" y="100" width="110" height="36" rx="4"/>
  </g>
  <rect x="150" y="30" width="70" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="47">fast</text><text x="65" y="61">estimate η̂</text>
    <text x="185" y="47">filter</text><text x="185" y="61">C(s)</text>
    <text x="300" y="54">plant</text>
    <text x="185" y="116">state predictor</text><text x="185" y="130">+ projection</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="110" y1="50" x2="146" y2="50"/><line x1="220" y1="50" x2="256" y2="50"/>
    <polyline points="300,70 300,118 244,118"/><polyline points="130,118 65,118 65,74"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="150,50 142,46 142,54"/><polygon points="260,50 252,46 252,54"/>
    <polygon points="240,118 248,114 248,122"/><polygon points="65,70 61,78 69,78"/>
  </g>
  <text x="238" y="44" font-size="11" fill="#1d6fd1" text-anchor="middle">u</text>
  <text x="128" y="22" font-size="11" fill="#b4232c" text-anchor="middle">jittery</text>
  <text x="238" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">smooth</text>
</svg>
```

In MRAC the estimate goes straight to the plant, so the adaptation gain sets both learning speed and jitter. Here they are separate knobs.
:::

::: context l1-norm Two different "norms"
The $\mathcal{L}_1$ norm of a system is the total area under the absolute value of its impulse response, $\int_0^\infty \lvert g(t)\rvert\,dt$. It answers a peak question: if the input never exceeds $1$ in size, how big can the output ever get? The H-infinity norm from earlier in the module answers an energy question instead. The "L1" in the controller's name refers to this peak norm, because its stability condition is written with it.
:::

::: context lipschitz A speed limit on steepness
A function $f$ has **Lipschitz bound** $L$ if $\lvert f(x_1) - f(x_2)\rvert \le L\lvert x_1 - x_2\rvert$ for every pair of points: its graph is never steeper than slope $L$. For an uncertain force that depends on the state, $L$ says how fast that force can change as the state moves. The larger $L$, the more the uncertainty can "fight back" as the controller moves the state, and the harder it is to guarantee stability.
:::

::: context ifcs-airstar Adaptive control that has actually flown
NASA's Intelligent Flight Control System project flew a heavily modified F-15 (tail number 837) at Dryden Flight Research Center, with a neural-network adaptive layer on top of a conventional control law. AirSTAR was a dynamically scaled, remotely piloted model of a generic transport aircraft flown by NASA Langley, used to test control laws near loss-of-control conditions that would be too dangerous in a full-size aircraft. Both programs kept a conventional baseline flying underneath the adaptive element.
:::
