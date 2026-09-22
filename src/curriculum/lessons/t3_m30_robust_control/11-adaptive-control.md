---
id: l11-adaptive-control
title: Adaptive control and its use and abuse
minutes: 22
covers:
  - Adaptive control (MRAC, L1 adaptive) and its use and abuse in aerospace
---

Robust control buys safety by preparing for the worst plant in a set. When the set is large — a damaged airframe, an unknown payload, a vehicle whose aerodynamics were never measured at that Mach number — that purchase is expensive, and the temptation is obvious: let the controller *learn* the plant instead, adjusting itself in flight until the response matches what was wanted. Model reference adaptive control does exactly that, with an elegant Lyapunov proof that the tracking error goes to zero, and it has been a mainstay of the academic literature since the 1960s.

It has also killed people. The X-15's MH-96 self-adaptive flight control system was flying on 15 November 1967 when flight 3-65-97 broke up during re-entry, taking the life of its pilot, Michael Adams. The investigation traced the initiating events to an electrical disturbance and a drift in heading that put the aircraft into a hypersonic spin; during the recovery the adaptive gain changer drove a diverging pitch oscillation that exceeded the airframe's structural limits. The proof of convergence was never wrong. It did not apply to the aircraft that was flying.

This lesson derives the classical model reference adaptive law and its Lyapunov proof, then shows with numbers exactly what the proof does not deliver: parameter convergence without persistent excitation, and any robustness at all to unmodelled dynamics. It then covers the modifications that make adaptation usable, the L1 architecture that restructures the problem so that fast adaptation and robustness stop fighting each other, and the position adaptive control actually occupies in flight programmes.

## Model reference adaptive control

Take the simplest case that shows everything. The plant is first order with unknown parameters,

$$\dot{x} = a\,x + b\,u,$$

with $b \ne 0$ of known sign. The designer specifies a **reference model** — the response they want —

$$\dot{x}_m = a_m x_m + b_m r, \qquad a_m < 0,$$

and uses the control law $u = k_x x + k_r r$. If $a$ and $b$ were known, the **matching gains**

$$k_x^\star = \frac{a_m - a}{b}, \qquad k_r^\star = \frac{b_m}{b}$$

would make the closed loop identical to the reference model. They are not known, so $k_x$ and $k_r$ are adjusted online.

Write the tracking error $e = x - x_m$ and the parameter errors $\tilde{k}_x = k_x - k_x^\star$, $\tilde{k}_r = k_r - k_r^\star$. Substituting,

$$\dot{e} = a\,x + b(k_xx + k_rr) - a_mx_m - b_mr = a_me + b\,\tilde{k}_x\,x + b\,\tilde{k}_r\,r,$$

where the matching conditions were used to cancel the terms that do not involve parameter errors. Now propose

$$V = e^2 + \frac{\lvert b\rvert}{\gamma}\left(\tilde{k}_x^2 + \tilde{k}_r^2\right),$$

positive definite in the combined error. Differentiating, and noting $\dot{\tilde{k}} = \dot{k}$ because the ideal gains are constants,

$$\dot{V} = 2a_me^2 + 2b\,e\left(\tilde{k}_xx + \tilde{k}_rr\right) + \frac{2\lvert b\rvert}{\gamma}\left(\tilde{k}_x\dot{k}_x + \tilde{k}_r\dot{k}_r\right).$$

Choose the adaptation laws to cancel the cross terms:

$$\dot{k}_x = -\gamma\,\operatorname{sgn}(b)\,e\,x, \qquad \dot{k}_r = -\gamma\,\operatorname{sgn}(b)\,e\,r .$$

Then $2be\tilde{k}_xx + (2\lvert b\rvert/\gamma)\tilde{k}_x(-\gamma\operatorname{sgn}(b)ex) = 2be\tilde{k}_xx - 2be\tilde{k}_xx = 0$, and the same for the $r$ term, leaving

$$\dot{V} = 2a_m\,e^2 \le 0 .$$

So $V$ is non-increasing, which makes $e$ and both parameter errors bounded, and Barbalat's lemma gives $e(t)\to 0$. Only the *sign* of $b$ was needed; its magnitude and $a$ are unknown throughout. That is the attraction, and it is real.

::: key What the MRAC proof gives and does not give
It gives: boundedness of all signals and $e(t)\to 0$, using only $\operatorname{sgn}(b)$. It does **not** give parameter convergence — $\tilde{k}\to 0$ needs persistent excitation — nor any bound on the transient, nor any robustness to unmodelled dynamics, disturbances or time delay. The gain $\gamma$ sets the adaptation rate, and raising it to speed convergence makes the closed loop more oscillatory and less robust.
:::

::: example Tracking without learning
Simulate the law above with $a = -1$, $b = 2$ (so $k_x^\star = -1$, $k_r^\star = 1.5$), reference model $\dot{x}_m = -3x_m + 3r$, adaptation gain $\gamma = 1$, gains started at zero.

With a **constant** command $r = 1$, the tracking error falls to $7\times 10^{-14}$ after sixty seconds — the proof delivers exactly what it promised. The gains, however, settle at $k_x = -0.082$ and $k_r = 0.582$, nowhere near $(-1,\ 1.5)$. What they do satisfy is $k_x + k_r = 0.500$, and so does the ideal pair: $-1 + 1.5 = 0.5$. With a constant command and the state driven to a constant, the only quantity the data can identify is the sum. The adaptation has found *a* controller that tracks this command, not *the* controller that matches the model.

Now make the command rich, $r(t) = 1 + 0.7\sin 0.7t + 0.5\sin 2.3t$. After two hundred seconds the gains are $k_x = -0.967$ and $k_r = 1.474$, converging on the ideal pair. Persistent excitation — enough independent frequencies to separate the regressors — is what turns tracking into learning, and it is not something a vehicle in normal operation provides. A spacecraft holding attitude, or an aircraft in cruise, offers almost no excitation at all, so the parameter estimates wander along the unidentifiable subspace indefinitely. That wandering has a name, parameter drift, and it is the mechanism behind the next example.
:::

## The Rohrs counterexamples

In 1985 Rohrs, Valavani, Athans and Stein published a set of simulations that changed how the field was regarded. They took a textbook MRAC design, added dynamics the designer had not modelled — a modest, entirely realistic second-order lag — and a small reference signal, and watched it go unstable. No assumption of the proof was violated by anything unreasonable; the proof assumed the plant's relative degree and order were known exactly, and they were not.

::: example Unmodelled dynamics destroy the adaptive loop
Keep the design model $2/(s+1)$ that the adaptation was built for, but let the real plant be

$$P(s) = \frac{2}{s+1}\cdot\frac{229}{s^2 + 30s + 229},$$

a second-order factor at $\omega_n = \sqrt{229} = 15.13\,\mathrm{rad/s}$ with $\zeta = 0.991$ — heavily damped, unity DC gain, invisible below a few rad/s. Any frequency-response plot would show it as an innocuous high-frequency roll-off.

Drive the loop with $r(t) = 0.3 + 1.85\sin(16.1t)$. That frequency is chosen with care: at $16.1\,\mathrm{rad/s}$ the design model contributes $0.124$ of gain at $-86.45^\circ$ and the unmodelled factor contributes $0.473$ at $-93.58^\circ$, so the total phase is $-180.0^\circ$. The adaptation, which has no model of phase at all, keeps raising the loop gain in an attempt to track a signal the real plant inverts.

The simulation diverges at $t = 31.4\,\mathrm{s}$, with $k_x$ running off to large negative values and the output exceeding $10^6$. The result is unchanged when the integration step is reduced by a factor of four, so it is the dynamics and not the numerics. Before the divergence, nothing looks alarming: the output tracks tolerably, the error is small, and a monitor watching tracking error would see nothing for half a minute.

Now add **σ-modification** — a leakage term $-\sigma\gamma k$ in each adaptation law, which pulls the gains back toward zero whenever the data stop pushing them. With $\sigma = 0.2$ the same simulation runs for two hundred seconds with a peak output of $0.365$ and gains settling near $k_x = -0.024$, $k_r = 0.565$. Bounded, stable, and no longer converging to the ideal gains — which is the honest trade: leakage destroys the exact matching equilibrium in exchange for keeping the parameters in a bounded set.
:::

```python
import numpy as np

# Rohrs' plant: the design model 2/(s+1) plus unmodelled dynamics the designer never saw.
wn2, z2 = 229.0, 30.0                       # 229/(s^2 + 30 s + 229), wn = 15.13, zeta = 0.99
ref = lambda t: 0.3 + 1.85 * np.sin(16.1 * t)


def deriv(st, t, gamma, sigma):
    y, x1, x2, ym, kx, kr = st
    r, e = ref(t), st[0] - st[3]
    u = kx * y + kr * r
    v = x1                                   # plant input after the unmodelled second order
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

### The standard repairs

Four modifications appear in every serious implementation, and they all do the same job: keep the parameters from drifting into regions where the loop is no longer stable.

- **σ-modification**: add $-\sigma\gamma k$ to the adaptation law. Simple, always bounded, shifts the equilibrium away from the ideal gains.
- **e-modification**: add $-\sigma\gamma\lvert e\rvert k$, so the leakage switches off when tracking is perfect and the ideal equilibrium is preserved.
- **Projection**: constrain the parameters to a convex set known a priori to contain the true values. This is what most flight implementations use, because the bound is explicit and verifiable, and because it composes with the certification argument — the adaptive gains provably never leave a box that was analysed offline.
- **Dead zone**: stop adapting when the error is below a threshold, so noise and small unmodelled effects do not drive the estimates.

::: warning Adaptation does not add robustness; it consumes it
The intuition that a controller which adjusts itself must tolerate more uncertainty is wrong in exactly the way the Rohrs example shows. Adaptation is high-gain feedback on an estimator, and like any high-gain loop it is fragile to unmodelled phase. A fixed robust controller has a margin you can compute. An adaptive controller has a margin that changes as it adapts, and the frequency-domain machinery of this module — small gain, $\mu$, disk margins — does not apply to it at all without extra work.
:::

## L1 adaptive control

The classical dilemma is that the adaptation gain $\gamma$ controls two things at once: how fast the estimate converges, and how much high-frequency content the adaptation injects into the plant. Raising $\gamma$ helps the first and destroys the second.

L1 adaptive control breaks that coupling architecturally. It keeps the fast estimator — a *state predictor* whose parameters are adapted at a very high rate with projection — but it does **not** feed the estimate directly to the actuator. Instead the control signal is passed through a low-pass filter $C(s)$ chosen by the designer:

$$u(s) = -C(s)\left[\hat{\eta}(s) - k_g\,r(s)\right],$$

where $\hat{\eta}$ is the estimated total uncertainty. The estimator may run as fast as the processor allows, because whatever high-frequency garbage it produces is removed before it reaches the plant. What survives is the low-frequency part of the uncertainty estimate, which is the part worth cancelling.

::: key Why L1 is the variant that gets flown
MRAC can lose robustness to unmodelled dynamics and time delay, and its transient behaviour is hard to certify. L1 adaptive control decouples adaptation rate from robustness with a low-pass filter, which is why it is the variant that actually gets flown.
:::

Two properties follow. First, **uniform transient bounds**: the difference between the actual response and the response of a reference system is bounded by a constant over $\sqrt{\Gamma}$, where $\Gamma$ is the adaptation gain, so the transient can be made uniformly small by adapting faster — a guarantee MRAC cannot offer. Second, a **stability condition on the filter**: writing $G(s) = H(s)(1 - C(s))$ with $H(s)$ the reference-model transfer function, the design must satisfy

$$\lVert G(s)\rVert_{\mathcal{L}_1}\,L < 1,$$

where $\lVert\cdot\rVert_{\mathcal{L}_1}$ is the integral of the absolute impulse response and $L$ is the Lipschitz bound of the uncertainty.

::: example What the filter bandwidth buys and costs
Take $H(s) = 2/(s+3)$ and a first-order filter $C(s) = \omega_c/(s + \omega_c)$, so $G(s) = 2s/((s+3)(s+\omega_c))$. Computing the $\mathcal{L}_1$ norm of its impulse response:

| $\omega_c$ (rad/s) | $\lVert G\rVert_{\mathcal{L}_1}$ | tolerable $L$ | $\lvert C(j16.1)\rvert$ |
| --- | --- | --- | --- |
| 1 | 0.770 | 1.30 | 0.062 |
| 5 | 0.372 | 2.69 | 0.297 |
| 10 | 0.239 | 4.19 | 0.528 |
| 30 | 0.103 | 9.69 | 0.881 |

Widening the filter relaxes the $\mathcal{L}_1$ condition — a wider $C$ means more of the uncertainty is actually cancelled, so a larger nonlinearity is tolerable. But the last column is the Rohrs frequency: at $\omega_c = 1\,\mathrm{rad/s}$ only six percent of the adaptation's content at $16.1\,\mathrm{rad/s}$ reaches the plant, while at $\omega_c = 30\,\mathrm{rad/s}$ eighty-eight percent does, and the unmodelled dynamics are excited exactly as they were in the MRAC failure.

So the filter bandwidth is the single design knob and it trades performance against robustness in a quantified way: wide enough to cancel the uncertainty you care about, narrow enough to stay below the dynamics you did not model. That trade is visible, adjustable and reportable, which is precisely what the classical adaptation gain $\gamma$ was not.
:::

## Where adaptation sits in a flight programme

The practice that has emerged is narrower than the literature and worth stating plainly.

**Adaptive augmentation, not adaptive control.** The certified baseline is a fixed, analysed, margin-verified controller. The adaptive element is added in parallel with **limited authority** — a hard saturation on its contribution — and a monitor that disengages it on any of several triggers. The vehicle is therefore never flying on the adaptive law alone, and the failure mode is degradation to the baseline rather than divergence.

**Verification is by Monte Carlo, because nothing else applies.** An adaptive loop is nonlinear and time-varying, so the disk margins and $\mu$ analyses of this module cannot be computed for it. Programmes substitute very large dispersion campaigns on the nonlinear six-degree-of-freedom simulation, plus a time-delay margin evaluated by direct simulation, which is the single most informative robustness number available for an adaptive law.

**Flight experience exists and is instructive.** NASA flew neural-network adaptive augmentation on a modified F-15 in the Intelligent Flight Control System programme in the 2000s, demonstrating recovery of handling qualities after simulated control-surface failures. L1 adaptive control has been flight-tested on NASA's AirSTAR subscale transport and on Calspan's variable-stability Learjet, and its appeal to those programmes was specifically the predictable transient and the explicit filter-based robustness knob. The X-15 remains the cautionary case, and the lesson drawn from it inside the industry is not "never adapt" but "never let an adaptive element have unlimited authority over a structurally limited airframe".

::: warning Ask what happens when adaptation is wrong, not when it is right
Every adaptive scheme is presented with the case it handles: a failure occurs, the estimate converges, performance is restored. The question that decides certification is the other one — what the loop does when the estimate is wrong, when the excitation is absent, when the sensor that feeds the estimator fails, and when the true plant lies outside the projection set. If the answer is not "degrade to the baseline within a bounded envelope", the design is not flyable regardless of how good the demonstration looked.
:::

## Check yourself

::: check
The MRAC Lyapunov derivation gives $\dot{V} = 2a_me^2$. Why does that not prove the gains converge to $k_x^\star$ and $k_r^\star$?
:::

::: answer
$\dot{V}$ is negative *semi*-definite in the combined state $(e, \tilde{k}_x, \tilde{k}_r)$: it is zero whenever $e = 0$, whatever the parameter errors are. So $V$ stops decreasing on a whole surface, not at a point. Lyapunov's theorem then gives boundedness of everything and, with Barbalat's lemma, $e\to 0$, but the parameter errors can settle anywhere on that surface. The simulation showed this concretely: with a constant command the gains ended at $(-0.082,\ 0.582)$ rather than $(-1,\ 1.5)$, with only the combination $k_x + k_r = 0.5$ pinned down. Parameter convergence requires persistent excitation, meaning the regressor vector $(x, r)$ spans the parameter space over every time window, and a vehicle holding a steady condition provides nothing of the sort.
:::

::: check
In the Rohrs example, why is $16.1\,\mathrm{rad/s}$ the dangerous frequency rather than, say, $1$ or $100\,\mathrm{rad/s}$?
:::

::: answer
It is where the total phase of the true plant reaches $-180^\circ$. The design model $2/(s+1)$ contributes $-86.45^\circ$ there and the unmodelled factor $229/(s^2+30s+229)$ contributes a further $-93.58^\circ$, summing to $-180.0^\circ$. At $1\,\mathrm{rad/s}$ the unmodelled dynamics are essentially unity gain and zero phase, so the design model is accurate and the adaptation behaves as its proof assumes. At $100\,\mathrm{rad/s}$ the plant gain is so small that no realistic excitation reaches the loop. The danger sits exactly where the unmodelled phase has accumulated to inversion while the gain is still appreciable — which is also where the classical gain margin of a *fixed* controller would be evaluated. The adaptive law has no gain-margin concept, so it drives the gain up through that point without noticing.
:::

::: check
What does projection buy over σ-modification, and why do flight programmes prefer it?
:::

::: answer
σ-modification guarantees boundedness but gives no explicit bound: the parameters end up somewhere, and the somewhere depends on the trajectory, so an offline analysis cannot enumerate the closed loops that might occur. It also shifts the equilibrium away from the ideal gains even when the plant matches perfectly, so perfect tracking is lost. Projection instead constrains the parameters to a convex set fixed before flight. The bound is explicit and chosen by the engineer, the ideal gains are inside it so nominal performance is unharmed, and — decisively for certification — the set of closed-loop plants the adaptive controller can ever produce is a known, finite-dimensional family that can be analysed offline with the ordinary robust tools. The verification argument becomes "every controller in the reachable set has acceptable margins", which a review board can accept.
:::

::: check
An L1 design has $\lVert G\rVert_{\mathcal{L}_1} = 0.37$ and the uncertainty has Lipschitz bound $L = 2.0$. Is the condition met, and what happens if the true $L$ turns out to be $3$?
:::

::: answer
$\lVert G\rVert_{\mathcal{L}_1}L = 0.37\times 2.0 = 0.74 < 1$, so the condition is met with a margin factor of $1/0.74 = 1.35$ on the uncertainty. If the true Lipschitz bound is $3$, the product is $1.11 > 1$ and the guarantee is void — not proof of instability, since like the small gain theorem the condition is sufficient, but the certificate is gone. The remedies are the same shape as elsewhere in this module: widen $C(s)$ to reduce $\lVert G\rVert_{\mathcal{L}_1}$, which from the table takes it to $0.239$ at $\omega_c = 10\,\mathrm{rad/s}$ and restores the condition, at the cost of passing more than half the adaptation's content at $16\,\mathrm{rad/s}$ into the plant. Whether that is acceptable depends on what dynamics live up there, which returns the problem to an honest uncertainty model — where this module started.
:::

::: check
A programme proposes replacing its gain-scheduled launch vehicle controller with an adaptive one, arguing that adaptation removes the need for the schedule. Respond.
:::

::: answer
Three objections. First, the launch vehicle's parameter variation is known in advance and measurable — dynamic pressure, Mach, propellant mass are all available — so there is nothing to learn: a schedule, or better an LPV design with a rate-bounded guarantee, uses information the adaptive law would have to rediscover in flight. Adaptation is for uncertainty you cannot predict, not for variation you can. Second, the flight is a few hundred seconds with no persistent excitation and a hard requirement that the loop never open in the high dynamic pressure window; an adaptive transient during maximum dynamic pressure has no margin to spend. Third, the verification burden inverts: the scheduled design can be swept for frozen margins and certified with a rate-bound argument or a quadratic stability certificate, whereas the adaptive design has no computable margins and must be argued entirely on dispersion campaigns. Where adaptation genuinely earns its place on a launch vehicle is as bounded-authority augmentation for off-nominal cases the schedule cannot cover — an engine-out, a control surface jam — with a monitor that returns control to the baseline.
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
| Rohrs failure | $2/(s+1)$ with unmodelled $229/(s^2+30s+229)$ and $r = 0.3 + 1.85\sin 16.1t$ diverges at $t = 31.4\,\mathrm{s}$ |
| Why $16.1$ | design model $-86.45^\circ$ plus unmodelled $-93.58^\circ$ equals $-180.0^\circ$ |
| Repairs | σ-modification, e-modification, projection (preferred in flight), dead zone |
| L1 architecture | fast projected estimator, low-pass $C(s)$ in the control path; transient bound scales as $1/\sqrt{\Gamma}$ |
| L1 condition | $\lVert H(s)(1 - C(s))\rVert_{\mathcal{L}_1}L < 1$; wider $C$ relaxes it but passes more high-frequency content |
| Flight practice | bounded-authority augmentation of a certified baseline, monitors, Monte Carlo verification, measured time-delay margin |

The last lesson of the module asks what all of this has to satisfy before a vehicle flies: the margin requirements swept across an envelope, the discrete-time analysis the flight computer forces on you, and the handling-qualities criteria a pilot imposes.
