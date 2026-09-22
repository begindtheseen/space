---
id: l10-the-error-state-kalman-filter
title: The error-state (indirect) Kalman filter
minutes: 19
covers:
  - 'The error-state (indirect) Kalman filter: why the error state is small and nearly linear, injection and reset, the Jacobian of the reset'
---

Every filter this module has built so far estimates the state **directly**: $\hat{\mathbf x}_k^+$ is the filter's best guess at the vehicle's actual position, attitude, or bias, updated cycle by cycle. There is a second architecture, used throughout inertial navigation and attitude determination, that estimates something different: a large, precisely-integrated **nominal** trajectory that the filter itself barely touches, and a small **error** relative to that nominal, which is all the Kalman machinery actually estimates. This is the **error-state**, or **indirect**, Kalman filter (ESKF), and the reason it exists is the same reason the first lesson in this module cared so much about truncation error: a small quantity linearizes far better than a large one, and the error-state architecture is a deliberate, structural way to keep the thing being linearized small, cycle after cycle, no matter how large or how nonlinear the vehicle's actual motion is.

## Two states, two very different jobs

Split the true state into a **nominal** part $\bar{\mathbf x}$ and an **error** part $\delta\mathbf x$, related by some composition rule appropriate to the state — addition for an ordinary vector, something more careful for a state that lives on a manifold, which the next lesson takes up in full. The nominal is propagated by integrating the true, full nonlinear dynamics, with **no covariance attached to it at all**. The error is propagated by an ordinary (extended) Kalman filter, using dynamics *linearized about the nominal trajectory*, exactly the linearization the EKF fundamentals lesson described — except here it is linearizing the *error's* dynamics, not the full state's.

::: key The error-state split
$$
\mathbf x_k = \bar{\mathbf x}_k \oplus \delta\mathbf x_k, \qquad \dot{\bar{\mathbf x}}=\mathbf f(\bar{\mathbf x}), \qquad \delta\dot{\mathbf x} \approx \mathbf F(\bar{\mathbf x})\,\delta\mathbf x + \text{noise},
$$
with $\oplus$ the appropriate composition (ordinary addition for a vector state). The nominal $\bar{\mathbf x}$ carries all of the large-scale, genuinely nonlinear motion and needs no linear approximation anywhere; the Kalman filter estimates only $\delta\mathbf x$, which — provided the filter keeps doing its job — stays small.
:::

Why would this ever be better than just running an ordinary EKF on the full state directly? Because "provided the filter keeps doing its job, $\delta\mathbf x$ stays small" is not an accident — it is the entire point of the architecture, and it buys exactly the thing the first lesson in this module identified as the EKF's central weakness: the size of the quantity a linearization has to describe. An ordinary EKF's Jacobian has to be a good local description of $\mathbf f$ across whatever spread the *full state's* uncertainty has — which can be large if the vehicle itself has moved a long way, turned sharply, or is otherwise doing something genuinely nonlinear. An error-state filter's Jacobian only has to describe the dynamics of a *perturbation*, which — because the nominal is doing all the large-scale, exactly-integrated work — stays small regardless of how far or how sharply the vehicle itself has actually moved.

::: example A small error state tracks well; an uncorrected one does not
Take the pendulum from earlier in this module as a stand-in for "genuinely nonlinear vehicle motion," and run two identical error-state filters side by side for twenty half-second cycles: propagate the nominal exactly (numerical integration of the true nonlinear ODE), propagate a $2\times2$ error covariance via the linearized $\mathbf F(\bar\theta)$ each cycle, and update from a noisy angle measurement every cycle. The **only** difference between the two filters: one folds its estimated correction back into the nominal and resets the error state to zero every cycle (**with reset**); the other never folds the correction back in, letting the error state itself carry the correction forward, uncorrected, cycle after cycle (**without reset**).

| cycle | true tracking error, with reset | error-state $|\delta\theta|$, with reset | true tracking error, without reset | error-state $|\delta\theta|$, without reset |
| --- | --- | --- | --- | --- |
| $0$ | $0.233^\circ$ | $0.000^\circ$ | $0.233^\circ$ | $1.287^\circ$ |
| $4$ | $-1.936^\circ$ | $0.000^\circ$ | $-1.859^\circ$ | $8.728^\circ$ |
| $8$ | $1.296^\circ$ | $0.000^\circ$ | $0.453^\circ$ | $15.294^\circ$ |
| $12$ | $-1.178^\circ$ | $0.000^\circ$ | $-2.334^\circ$ | $13.218^\circ$ |
| $16$ | $-0.192^\circ$ | $0.000^\circ$ | $-2.023^\circ$ | $16.240^\circ$ |
| $19$ | $0.490^\circ$ | $0.000^\circ$ | $3.646^\circ$ | $33.672^\circ$ |

With reset, the error state is exactly zero at the start of every single cycle by construction, and the true tracking error stays bounded, wandering between roughly $0.2^\circ$ and $2^\circ$ across all twenty cycles — never growing, never trending. Without reset, the error state itself — the very quantity the linearized $\mathbf F$ is supposed to describe accurately *because it is small* — grows from $1.29^\circ$ to $33.67^\circ$ over the same twenty cycles, and the true tracking error grows along with it, ending nearly $7.4$ times worse than the reset filter's. Nothing about the measurements, the noise, or the dynamics differs between the two runs; the only difference is whether the architecture's core promise — keep $\delta\mathbf x$ small by folding it back in — was actually honored.
:::

```python
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import expm

G0, L, q = 9.80665, 1.0, 0.05

def f(x):
    theta, omega = x
    return np.array([omega, -(G0/L)*np.sin(theta)])

def Fjac(x):
    theta, omega = x
    return np.array([[0.0, 1.0], [-(G0/L)*np.cos(theta), 0.0]])

Qc = np.array([[0.0, 0.0], [0.0, q]])

def integrate_nonlinear(x0, dt):
    sol = solve_ivp(lambda t, x: f(x), [0, dt], x0, method='DOP853', rtol=1e-11, atol=1e-12)
    return sol.y[:, -1]

def van_loan(F, Qc, dt):
    n = F.shape[0]
    M = np.zeros((2*n, 2*n)); M[:n,:n] = -F; M[:n,n:] = Qc; M[n:,n:] = F.T
    eM = expm(M*dt); Phi = eM[n:,n:].T
    return Phi, Phi @ eM[:n,n:]

def run(seed, ncycles, dt, do_reset, sigma_meas=np.radians(1.0)):
    rng = np.random.default_rng(seed)
    x_true = np.array([np.radians(50.0), 0.0])
    x_nom = np.array([np.radians(45.0), 0.0])
    P = np.diag([np.radians(5.0)**2, np.radians(2.0)**2])
    dx = np.zeros(2)
    rows = []
    for c in range(ncycles):
        if not do_reset:
            Phi, _ = van_loan(Fjac(x_nom), Qc, dt)
            dx = Phi @ dx
        x_true = integrate_nonlinear(x_true, dt) + rng.multivariate_normal([0, 0], Qc*dt)
        x_nom_pred = integrate_nonlinear(x_nom, dt)
        Phi, Qd = van_loan(Fjac(x_nom), Qc, dt)
        P = Phi @ P @ Phi.T + Qd
        z = x_true[0] + rng.normal(0, sigma_meas)
        H = np.array([1.0, 0.0])
        S = H@P@H.T + sigma_meas**2
        K = P@H.T/S
        dx_new = K*(z - x_nom_pred[0])
        P = (np.eye(2)-np.outer(K, H))@P
        if do_reset:
            x_nom, dx = x_nom_pred + dx_new, np.zeros(2)
        else:
            x_nom, dx = x_nom_pred, dx_new
        est = x_nom + dx
        rows.append((c, np.degrees(est[0]-x_true[0]), np.degrees(abs(dx[0]))))
    return rows

for c, err, dth in run(seed=3, ncycles=20, dt=0.5, do_reset=True):
    if c in (0, 4, 8, 12, 16, 19): print('reset  ', c, round(err, 3), round(dth, 3))
for c, err, dth in run(seed=3, ncycles=20, dt=0.5, do_reset=False):
    if c in (0, 4, 8, 12, 16, 19): print('noreset', c, round(err, 3), round(dth, 3))
```

## Injection and reset

The mechanism that makes the "with reset" column behave is worth naming precisely, because it is the piece the next lesson has to generalize to a state that is not an ordinary vector.

::: key Injection and reset
**Injection**: fold the filter's estimated error correction into the nominal, $\bar{\mathbf x}\leftarrow\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$. **Reset**: having moved the nominal, set the error state back to zero, $\delta\hat{\mathbf x}\leftarrow\mathbf 0$, so the *next* cycle's linearization is taken about the *new*, corrected nominal rather than the old one. For an additive state, injection is ordinary vector addition and the reset carries the covariance forward unchanged, $\mathbf P\leftarrow\mathbf P$ — the coordinates the error is measured in do not change when the nominal moves.
:::

That last clause — "for an additive state" — is doing real work, and it is exactly where this lesson's pendulum example is simpler than the module's actual target application. Moving the nominal by ordinary addition and re-zeroing the error costs nothing extra, because the tangent space of an ordinary vector space looks identical everywhere: a small perturbation near one nominal value is described in exactly the same coordinates as a small perturbation near any other. Nothing about the *reset* itself changes when the nominal moves, because there is nothing about the coordinate system that changes either.

::: example Injection and reset, one cycle, in full
Take the first cycle of the "with reset" run above. Before this cycle, $\bar\theta=45.000^\circ$. Propagating the nominal through the true nonlinear pendulum dynamics for $\Delta t=0.5\,\mathrm s$ gives $\bar\theta_{\text{pred}}=2.971^\circ$, $\bar\omega_{\text{pred}}=-137.010^\circ/\mathrm s$ (the pendulum has swung through a large angle — exactly the kind of large, genuinely nonlinear motion the nominal is supposed to absorb without needing any linear approximation). The noisy angle measurement is $z=4.444^\circ$; the gain, computed from the freshly-propagated $\mathbf P$, is $\mathbf K=(0.874,\,-0.574)$; the estimated error correction is $\delta\hat{\mathbf x}=(1.287^\circ,\,-0.846^\circ/\mathrm s)$.

**Injection**: $\bar{\mathbf x}\leftarrow\bar{\mathbf x}_{\text{pred}}+\delta\hat{\mathbf x} = (2.971+1.287,\ -137.010-0.846) = (4.258^\circ,\,-137.856^\circ/\mathrm s)$.

**Reset**: $\delta\hat{\mathbf x}\leftarrow(0,0)$; the covariance, additive state, passes through unchanged, $\operatorname{tr}\mathbf P=0.0638\,\mathrm{rad^2}$ both immediately before and immediately after this step. The next cycle's Jacobian $\mathbf F(\bar{\mathbf x})$ will be evaluated at $\bar\theta=4.258^\circ$ — the corrected value — not at the $2.971^\circ$ the nominal actually predicted before this measurement arrived.
:::

::: warning An additive reset's simplicity is the exception, not the rule
The reason this lesson could get away with $\mathbf P\leftarrow\mathbf P$ unchanged through the reset is specific to an additive state living in an ordinary vector space. A state that lives on a curved space — the set of unit quaternions describing an attitude, most importantly for this module — does not have this property: the tangent space at one attitude is not the same coordinate system as the tangent space at a different attitude, so moving the nominal by injecting a correction genuinely does change what the error's coordinates *mean*, and carrying $\mathbf P$ through unchanged would be wrong. The next lesson makes this precise, with a reset Jacobian that is not simply the identity.
:::

::: warning The error state's smallness is a consequence, not an assumption to rely on blindly
Nothing forces $\delta\mathbf x$ to stay small automatically — the without-reset column of this lesson's example shows exactly what happens when the architecture's own upkeep (injecting and resetting every cycle) is skipped: the error state grows without bound, and the linearization it depends on degrades right along with it, precisely the truncation-error mechanism the first lesson in this module quantified. An error-state filter that goes for an unusually long stretch without a measurement update — a GNSS outage, a star-tracker occlusion — can accumulate a large error state through dead reckoning alone even with injection and reset both implemented correctly, and the same degradation applies once the accumulated error stops being small.
:::

## Check yourself

::: check
Explain, in terms of what each part of the state is used for, why the nominal $\bar{\mathbf x}$ needs no covariance attached to it at all.
:::

::: answer
The nominal is propagated by direct numerical integration of the true nonlinear dynamics — it is a deterministic (given its inputs) trajectory, not a random variable the filter is estimating uncertainty about. All of the filter's actual uncertainty — everything a covariance matrix is meant to describe — lives entirely in the error state $\delta\mathbf x$, which is what the Kalman recursion propagates and updates; the nominal only needs to be recomputed accurately each cycle; whether it is uncertain is not a question the ESKF architecture asks of it directly.
:::

::: check
In the worked example, why does skipping the reset degrade the true tracking error, given that the *total* estimate $\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$ is mathematically the same sum either way at the instant just after an update?
:::

::: answer
The two architectures do differ at the instant right after a single update — that part of the reasoning is correct in isolation. Where they diverge is at the *next* cycle's linearization: with reset, $\mathbf F$ is evaluated at the newly corrected nominal, close to the truth; without reset, $\mathbf F$ is evaluated at the old, uncorrected nominal, which is exactly as far from the truth as it was before that cycle's correction was computed, and the growing $\delta\mathbf x$ has to be propagated through a linearization taken at an increasingly stale point — compounding exactly the truncation-error mechanism the EKF fundamentals lesson quantified, cycle after cycle.
:::

::: check
A colleague implements an ESKF but forgets to zero $\delta\hat{\mathbf x}$ after injecting it into the nominal — the injection line is correct, only the reset line is missing. Based on this lesson's example, what specific symptom would you expect to see in flight telemetry?
:::

::: answer
A slowly growing discrepancy between the filter's reported error-state magnitude and how well the filter is actually tracking — exactly the without-reset column's pattern, where $|\delta\theta|$ climbed from about $1.3^\circ$ to nearly $34^\circ$ over twenty cycles while the true tracking error degraded in step with it. Since the injection line is still correct, the *total* estimate right after each update is not immediately wrong; the symptom would show up as a filter that seems to work adequately for a while and then degrades progressively, rather than failing outright from the first cycle.
:::

::: check
Why is $\mathbf P\leftarrow\mathbf P$ (unchanged) the correct reset rule for the additive pendulum example, when the next lesson will show it is *not* correct for an attitude state?
:::

::: answer
For an ordinary vector state, the tangent space — the coordinates a small perturbation is measured in — is identical everywhere in the space; a $1^\circ$ error near $\bar\theta=10^\circ$ is described by exactly the same number, in exactly the same sense, as a $1^\circ$ error near $\bar\theta=80^\circ$, so moving the nominal changes nothing about what the error's own coordinates mean, and the covariance describing those coordinates needs no adjustment. An attitude represented as a unit quaternion does not have this property — its tangent space genuinely depends on which attitude it is attached to — so the same "just move the nominal" reset has to carry the covariance through a coordinate change as well, which is precisely the reset Jacobian the next lesson derives.
:::

::: check
Suppose the pendulum example were re-run with a much shorter cycle time, $\Delta t=0.05\,\mathrm s$ instead of $0.5\,\mathrm s$, everything else unchanged. Would you expect the gap between the with-reset and without-reset columns, measured after the same total elapsed time, to be larger, smaller, or roughly the same?
:::

::: answer
Smaller. With ten times as many, ten times shorter cycles, the without-reset filter's error state still never gets folded back in, but each individual cycle's linearization is taken over a much smaller interval of nominal motion, so the mismatch between "linearize at the old nominal" and "linearize at the corrected one" accumulates more slowly per unit of elapsed time — the gap would still exist and would still grow over a long enough run, but the twenty-cycle snapshot in this lesson's table, covering only ten seconds at $\Delta t=0.5\,\mathrm s$, would correspond to a much shorter elapsed time at $\Delta t=0.05\,\mathrm s$, where the without-reset degradation would not yet have accumulated as far.
:::

## Summary

| Item | Statement |
| --- | --- |
| Error-state split | $\mathbf x=\bar{\mathbf x}\oplus\delta\mathbf x$; nominal integrated exactly through the true nonlinear dynamics, no covariance attached; error estimated by an ordinary (extended) Kalman filter linearized about the nominal |
| Why it helps | Keeps the quantity being linearized — the error, not the full state — small, which is exactly the condition under which the first lesson's truncation-error argument is at its most favorable |
| Injection | Fold the estimated error into the nominal, $\bar{\mathbf x}\leftarrow\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$ |
| Reset | Zero the error state so the next cycle linearizes about the corrected nominal; for an additive state, $\mathbf P$ carries through unchanged |
| Demonstrated | With reset: true error bounded within about $0.2^\circ$–$2^\circ$ over twenty cycles. Without reset: error state grew $1.29^\circ\to33.67^\circ$; true tracking error nearly $7.4\times$ worse by the final cycle |
| What's next | An additive state's reset needs no Jacobian at all — a rotational state's does, and that Jacobian is this module's centerpiece |

Every number in this lesson came from a state that adds like an ordinary vector, which let the reset step off easily. The next lesson takes the identical architecture — nominal, error, injection, reset — and applies it to the one state in this curriculum that categorically does not add like a vector: a spacecraft's attitude.
