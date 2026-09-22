---
id: l08-sliding-mode-control
title: Sliding mode control, chattering and boundary layers
minutes: 24
covers:
  - 'Sliding mode control: sliding surface design, reaching phase, chattering, boundary layers, higher-order sliding modes'
---

Feedback linearization needs the model to be right. Sliding mode control is built on the opposite premise: assume the model is wrong by a bounded amount, and design a law that does not care. It achieves that by giving up on a smooth control and switching hard, so that the state is driven onto a surface of your choosing and then *held* there by the switching, regardless of what the plant is doing underneath — provided the disturbance enters through the same channel as the control.

The design splits into two independent problems, which is what makes it teachable in one lesson. First choose a **sliding surface** $s(\mathbf{x}) = 0$ so that motion constrained to the surface has the behaviour you want; this is a low-order, often first-order, pole-placement problem. Then design a control that drives $s$ to zero in finite time and keeps it there; this is a one-line Lyapunov argument on $V = \tfrac{1}{2}s^2$.

What you pay is chattering. The ideal law switches infinitely fast, and a real one cannot, so the trajectory crosses and recrosses the surface at whatever frequency the sample rate and actuator bandwidth allow. On a spacecraft that means a reaction wheel reversing torque a hundred times a second, or a thruster valve cycling until it fails. This lesson quantifies the chattering, quantifies what a boundary layer costs to remove it, and shows the modern answer — a second-order sliding mode whose control is continuous and whose accuracy beats the switching law it replaces.

## Choosing the surface

For a tracking error $e = y - y_d$ in a system of relative degree two, the standard surface is

$$
s = \dot{e} + \Lambda e, \qquad \Lambda > 0 .
$$

Setting $s = 0$ gives $\dot{e} = -\Lambda e$, so on the surface the error decays exponentially with time constant $1/\Lambda$, independent of the plant. The surface is where you specify performance; the switching law is where you specify robustness. Note the order reduction: the surface is one dimension lower than the state, and the motion on it is governed by a first-order equation you wrote down.

For attitude, the surface used throughout this module is

$$
\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v ,
$$

with $\mathbf{q}_v$ the vector part of the error quaternion and $\boldsymbol{\omega}$ the body rate. The constrained motion is exact rather than approximate: substituting $\boldsymbol{\omega} = -\Lambda\mathbf{q}_v$ into the quaternion kinematics $\dot{\mathbf{q}}_v = \tfrac{1}{2}(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$, the cross-product term vanishes because $\mathbf{q}_v\times\mathbf{q}_v = \mathbf{0}$, leaving

$$
\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\,\mathbf{q}_v .
$$

So on the surface the attitude error decays with time constant $2/(\Lambda q_0)$, approaching $2/\Lambda$ as the error closes. The equilibrium reached is $\mathbf{q}_v = \mathbf{0}$ and $\boldsymbol{\omega} = \mathbf{0}$, which is what you wanted.

## Reaching the surface in finite time

Take the single-axis rigid body $J\ddot{\theta} = u + d$, where $d$ is any disturbance or model error entering through the torque channel, with $|d| \le D$. With $s = \omega + \Lambda\theta$ and $\omega = \dot{\theta}$,

$$
\dot{s} = \dot{\omega} + \Lambda\omega = \frac{u + d}{J} + \Lambda\omega .
$$

Split the control into the part that cancels what you know — the **equivalent control** — and the part that does the switching:

$$
u = \underbrace{-J\Lambda\omega}_{u_{\text{eq}}} \;-\; J\eta\,\mathrm{sign}(s) .
$$

Then $\dot{s} = -\eta\,\mathrm{sign}(s) + d/J$. Take $V = \tfrac{1}{2}s^2$:

$$
\dot{V} = s\dot{s} = -\eta|s| + \frac{sd}{J} \le -\left(\eta - \frac{D}{J}\right)|s| .
$$

Provided the switching gain beats the disturbance, $\eta > D/J$, this is the reaching condition, and it is stronger than exponential: $\frac{d}{dt}|s| \le -(\eta - D/J)$, so $|s|$ falls linearly and reaches zero in **finite time**

$$
t_r \le \frac{|s(0)|}{\eta - D/J} .
$$

::: key Sliding surface and reaching condition
Choose $s(\mathbf{x}) = 0$ so that the constrained motion is stable — for attitude, $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$, on which $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$. The reaching condition is

$$
\tfrac{1}{2}\frac{d}{dt}\left(\mathbf{s}^\mathsf{T}\mathbf{s}\right) \le -\eta\lVert\mathbf{s}\rVert ,
$$

which drives $\mathbf{s}$ to zero in a time no greater than $\lVert\mathbf{s}(0)\rVert/\eta$ and holds it there afterwards. Once on the surface the closed-loop behaviour is set by $\Lambda$ alone, independent of the plant parameters.
:::

The robustness is now visible. The disturbance $d$ never appears in the sliding dynamics — it is absorbed by the switching term, which flips sign as often as needed to keep $s$ at zero. This is **invariance to matched uncertainty**: any uncertainty entering through the same channel as the control is rejected completely, up to the size of $\eta$. Uncertainty entering elsewhere (unmatched) is not, and has to be handled by the surface design or by an ISS argument.

::: example Reaching, then sliding, on a spacecraft axis
Take $J = 120\,\mathrm{kg\,m^2}$, $\Lambda = 0.8\,\mathrm{s^{-1}}$, $\eta = 0.5\,\mathrm{rad/s^2}$, an initial error $\theta(0) = 0.2\,\mathrm{rad}$ at rest, a control rate of $500\,\mathrm{Hz}$, and a first-order actuator with a $5\,\mathrm{ms}$ lag. Then $s(0) = 0 + 0.8(0.2) = 0.160\,\mathrm{rad/s}$ and the predicted reaching time is $0.160/0.5 = 0.320\,\mathrm{s}$.

Simulating the plant at $\Delta t = 10\,\mu\mathrm{s}$, $s$ first crosses zero at $0.3237\,\mathrm{s}$ — the extra $3.7\,\mathrm{ms}$ is the actuator lag. At that instant $\theta = 0.17705\,\mathrm{rad}$, because the vehicle moved during the reaching phase. Afterwards the theory says $\theta$ decays as $0.17705\,e^{-0.8(t - 0.3237)}$:

| $t$ | Simulated $\theta$ | $0.17705\,e^{-0.8(t-0.324)}$ |
| --- | --- | --- |
| $1\,\mathrm{s}$ | $0.102761$ | $0.10262$ |
| $2\,\mathrm{s}$ | $0.046095$ | $0.04625$ |
| $4\,\mathrm{s}$ | $0.009235$ | $0.00933$ |

Agreement to about one per cent, the residual being the chattering about the surface. The switching gain corresponds to $J\eta = 60\,\mathrm{N\,m}$ of authority set aside purely for rejecting disturbance, and the total demand never exceeds $J(\Lambda|\omega| + \eta) = 79.2\,\mathrm{N\,m}$ over the manoeuvre.
:::

## Chattering, measured

The ideal law requires $\mathrm{sign}(s)$ to be evaluated and applied continuously. Three things in any real loop prevent that: the control runs at a finite rate, so the sign is held for one sample; the actuator has finite bandwidth, so the commanded reversal arrives late; and there are unmodelled fast dynamics — structure, slosh, valve response — that the switching excites. The result is that the trajectory overshoots the surface, the sign flips, it overshoots the other way, and the loop settles into a high-frequency limit cycle around $s = 0$ instead of on it.

::: example What chattering costs, and what a boundary layer buys
Same vehicle, now with a matched disturbance torque $d(t) = 3 + 2\sin(0.5t)\,\mathrm{N\,m}$, peak $5\,\mathrm{N\,m}$ — well inside the $J\eta = 60\,\mathrm{N\,m}$ of switching authority. Statistics are taken over the last ten seconds of a $60\,\mathrm{s}$ run.

| Law | Peak $\lvert\theta\rvert$ | Command reversals per second | Actuator swing (peak to peak) |
| --- | --- | --- | --- |
| $\mathrm{sign}(s)$ | $5.10\,\mathrm{mdeg}$ | $134.5$ | $92.3\,\mathrm{N\,m}$ |
| $\mathrm{sat}(s/\phi)$, $\phi = 0.01$ | $56.1\,\mathrm{mdeg}$ | $0$ | $4.02\,\mathrm{N\,m}$ |
| $\mathrm{sat}(s/\phi)$, $\phi = 0.05$ | $280.2\,\mathrm{mdeg}$ | $0$ | $4.09\,\mathrm{N\,m}$ |
| Super-twisting | $0.099\,\mathrm{mdeg}$ | $0$ | $5.06\,\mathrm{N\,m}$ |

The switching law's pointing is excellent and its actuator behaviour is unflyable: $134$ full torque reversals every second, with the wheel torque swinging across $92\,\mathrm{N\,m}$ forever, on a vehicle whose disturbance is $5\,\mathrm{N\,m}$. That is bearing wear, thermal load and structural excitation bought for nothing.

Replacing $\mathrm{sign}(s)$ with $\mathrm{sat}(s/\phi)$ stops it outright — zero reversals, a $4\,\mathrm{N\,m}$ actuator swing that is no more than the disturbance being cancelled — and costs a factor of eleven in pointing at $\phi = 0.01$. The error scales linearly with $\phi$: $56.1$ against $280.2\,\mathrm{mdeg}$ for a fivefold increase in $\phi$, a ratio of $4.998$.

The knee of this trade is at the smallest $\phi$ that removes the chattering, which here is between $\phi = 0$ and $\phi = 0.01$; the appropriate design rule is to set $\phi$ so that the boundary layer is wider than the excursion the sample rate and actuator lag produce, and no wider.
:::

## Sizing the boundary layer

Inside the layer the control is continuous and the system is no longer being forced onto the surface, so $s$ is merely kept small rather than driven to zero. The guaranteed statement is therefore **ultimate boundedness**, not asymptotic stability: $|s| \le \phi$ eventually, and since at rest $s = \Lambda\theta$,

$$
|\theta|_\infty \le \frac{\phi}{\Lambda} .
$$

::: key Boundary layer
Replacing $\mathrm{sign}(s)$ by $\mathrm{sat}(s/\phi)$ removes chattering and replaces asymptotic stability by ultimate boundedness, with steady error scaling like $\phi/\Lambda$. Inside the layer the law is linear, with effective gains $k_p = J\eta\Lambda/\phi$ and $k_d = J(\Lambda + \eta/\phi)$, so a thin layer is a high-gain controller with its demand clipped at $J(\Lambda|\omega| + \eta)$.
:::

That bound is worst-case. The realised error is smaller when the switching gain comfortably exceeds the disturbance, because inside the layer $\dot{s} = -(\eta/\phi)s + d/J$, giving a steady $|s| = (|d|/J)(\phi/\eta)$ and hence

$$
|\theta|_\infty \approx \frac{|d|\,\phi}{J\eta\Lambda} .
$$

With $|d| = 5\,\mathrm{N\,m}$ and $\phi = 0.01$ this predicts $5(0.01)/(120\times0.5\times0.8) = 1.04\times10^{-3}\,\mathrm{rad} = 59.7\,\mathrm{mdeg}$, against the measured $56.1\,\mathrm{mdeg}$ and a design bound $\phi/\Lambda = 1.25\times10^{-2}\,\mathrm{rad} = 716\,\mathrm{mdeg}$. Use $\phi/\Lambda$ for the guarantee and the second expression for the expectation.

The effective gains explain why boundary-layer sliding mode is worth the trouble. At $\phi = 0.01$ the law inside the layer is a PD with $k_p = 4800\,\mathrm{N\,m/rad}$ and $k_d = 6096\,\mathrm{N\,m\,s}$, and a simulation of that linear PD reproduces the sliding-mode error exactly: $0.0561^\circ$. But that PD demands $k_p \times 0.2 = 960\,\mathrm{N\,m}$ at the start of a $0.2\,\mathrm{rad}$ manoeuvre, while the sliding-mode law demands $79.2\,\mathrm{N\,m}$, because the saturation clips it. A conventional PD sized for that torque limit, $k_p = k_d = 96$, leaves a peak error of $3.20^\circ$ under the same disturbance — fifty-seven times worse. Sliding mode is how you get high-gain disturbance rejection out of a bounded actuator.

## Higher-order sliding modes

The boundary layer removes chattering by giving up the sliding mode. A second-order sliding mode removes it by moving the discontinuity into the *derivative* of the control, so that the applied torque is continuous while $s$ and $\dot{s}$ both reach zero in finite time. The standard law is **super-twisting**:

$$
u_{\text{st}} = -k_1\sqrt{|s|}\,\mathrm{sign}(s) + w, \qquad \dot{w} = -k_2\,\mathrm{sign}(s) ,
$$

used in place of the $-\eta\,\mathrm{sign}(s)$ term. The switching now happens inside an integrator, so $w$ is continuous, and the $\sqrt{|s|}$ term supplies the finite-time convergence that a linear term could not. The gains must satisfy $k_1 \gtrsim 1.5\sqrt{\rho}$ and $k_2 \gtrsim 1.1\rho$ where $\rho$ bounds the disturbance derivative.

In the table above, super-twisting with $k_1 = 1.0$ and $k_2 = 0.5$ gives $0.099\,\mathrm{mdeg}$ of pointing error — fifty times better than the pure switching law and five hundred times better than the $\phi = 0.01$ boundary layer — with a smooth $5.06\,\mathrm{N\,m}$ actuator command and no reversals. It needs only $s$, not $\dot{s}$, which is why it is the variant that gets used. That combination of exact convergence and a continuous command is the reason super-twisting has displaced the classical boundary layer in new designs.

::: warning
The switching gain must exceed the *matched* uncertainty, and only the matched part. A disturbance entering through a different channel — an unmodelled flexible mode's contribution to the measured rate, say — is not cancelled by the switching, and raising $\eta$ makes chattering worse without improving it. Classify your uncertainty before choosing $\eta$.
:::

::: warning
Do not chase a small $\phi$. As $\phi \to 0$ the effective gains $J\eta\Lambda/\phi$ and $J\eta/\phi$ grow without bound, and long before the ideal sliding mode is recovered the loop will be exciting whatever fast dynamics the model left out. If a thin layer is needed to meet a pointing requirement, that is a signal to change $\Lambda$ or to move to a second-order sliding mode, not to keep shrinking $\phi$.
:::

::: note
The order reduction is worth naming. The full attitude problem has six states; the surface $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ is three constraints, and the motion on it is the three-state first-order system $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$ whose behaviour you chose with one number. The inertia matrix does not appear in it. That is the whole appeal: the designed behaviour is a property of the surface, not of the vehicle.
:::

## Check yourself

::: check
A vehicle has $J = 250\,\mathrm{kg\,m^2}$ and an unmodelled disturbance torque bounded by $12\,\mathrm{N\,m}$. You want the sliding-mode error to decay with a $4\,\mathrm{s}$ time constant using $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$. Choose $\Lambda$ and a minimum $\eta$, and find the reaching time from $\lVert\mathbf{s}(0)\rVert = 0.3\,\mathrm{rad/s}$.
:::

::: answer
On the surface the attitude decays with time constant $2/\Lambda$, so $2/\Lambda = 4\,\mathrm{s}$ gives $\Lambda = 0.5\,\mathrm{s^{-1}}$. The switching gain must exceed $D/J = 12/250 = 0.048\,\mathrm{rad/s^2}$; take a margin, $\eta = 0.15\,\mathrm{rad/s^2}$, costing $J\eta = 37.5\,\mathrm{N\,m}$ of reserved authority. The reaching time is at most $\lVert\mathbf{s}(0)\rVert/(\eta - D/J) = 0.3/(0.15 - 0.048) = 2.94\,\mathrm{s}$, and with no disturbance it would be $0.3/0.15 = 2.0\,\mathrm{s}$.
:::

::: check
Why is the convergence to the surface in finite time rather than asymptotic, when $\dot{V} \le -\eta|s|$ looks like an ordinary Lyapunov decrease?
:::

::: answer
Because the decrease is not proportional to $V$. With $V = \tfrac{1}{2}s^2$, $|s| = \sqrt{2V}$, so $\dot{V} \le -\eta\sqrt{2V}$, and separating variables gives $\sqrt{V(t)} \le \sqrt{V(0)} - \eta t/\sqrt{2}$, which reaches zero at a finite $t$. Equivalently $\frac{d}{dt}|s| \le -\eta$: the surface variable falls at a constant rate rather than a rate proportional to itself. An ordinary asymptotic bound would read $\dot{V} \le -cV$ and give exponential decay, which never arrives. Finite-time convergence is a hallmark of discontinuous control, and it is exactly what the indirect method could never certify.
:::

::: check
The measured pointing error at $\phi = 0.01$ was $56.1\,\mathrm{mdeg}$ and the design bound $\phi/\Lambda$ was $716\,\mathrm{mdeg}$. Which would you put in a requirements document, and why is the gap so large?
:::

::: answer
Put $\phi/\Lambda = 716\,\mathrm{mdeg}$ in the requirement, because it is the bound that holds for *any* matched disturbance up to the design limit $J\eta = 60\,\mathrm{N\,m}$, and requirements must survive the worst case. The gap is large because the actual disturbance is $5\,\mathrm{N\,m}$, only $8.3$ per cent of what the switching gain is sized for, and the realised error scales with the ratio: $|\theta|_\infty \approx |d|\phi/(J\eta\Lambda)$ carries the factor $|d|/(J\eta) = 0.083$. Report both — the bound as the guarantee and the predicted value as the expectation — with the disturbance assumption attached to each.
:::

::: check
An engineer removes the $u_{\text{eq}} = -J\Lambda\omega$ term, arguing that the switching term alone will keep $s$ at zero. What happens?
:::

::: answer
The surface is still reached, provided $\eta$ is large enough to dominate the uncancelled term as well as the disturbance: $\dot{s} = -\eta\,\mathrm{sign}(s) + \Lambda\omega + d/J$ now needs $\eta > \Lambda|\omega|_{\max} + D/J$. So the design still works, at the price of a larger switching gain and correspondingly worse chattering, and the required gain now depends on the rate envelope. The equivalent-control term is what lets $\eta$ be sized against the *uncertainty* rather than against the whole dynamics — the known part is cancelled openly, the unknown part is switched against. Cancelling more of what you know always buys a smaller $\eta$.
:::

::: check
Why does super-twisting achieve better pointing than the pure switching law in the table, when switching is supposed to be the ideal?
:::

::: answer
Because the pure switching law is not being realised. The ideal $\mathrm{sign}(s)$ mode would hold $s$ exactly at zero, but at $500\,\mathrm{Hz}$ with a $5\,\mathrm{ms}$ actuator the command is held for one sample and arrives late, so the state overshoots by an amount set by the sample period and the lag — producing the $5.10\,\mathrm{mdeg}$ limit cycle and $134$ reversals a second. Super-twisting applies a *continuous* torque whose discontinuity lives in the integrator, so the actuator lag no longer converts a sign flip into an overshoot, and the loop settles far closer to the surface. The lesson generalises: with a bandwidth-limited actuator, a continuous law that is exact in the limit beats a discontinuous law that the hardware cannot execute.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $s = \dot{e} + \Lambda e$ | Sliding surface; on it, $\dot{e} = -\Lambda e$, time constant $1/\Lambda$ |
| $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ | Attitude surface; on it, $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$, time constant $2/\Lambda$ |
| $u = -J\Lambda\omega - J\eta\,\mathrm{sign}(s)$ | Equivalent control plus switching term |
| $\tfrac{1}{2}\frac{d}{dt}(\mathbf{s}^\mathsf{T}\mathbf{s}) \le -\eta\lVert\mathbf{s}\rVert$ | Reaching condition; finite time $t_r \le \lVert\mathbf{s}(0)\rVert/(\eta - D/J)$ |
| $\eta > D/J$ | Switching gain must beat the matched disturbance bound |
| Matched uncertainty | Rejected completely on the surface; unmatched is not |
| $J = 120$, $\Lambda = 0.8$, $\eta = 0.5$, $\theta_0 = 0.2$ | $t_r = 0.320\,\mathrm{s}$ predicted, $0.324\,\mathrm{s}$ measured |
| $\mathrm{sign}(s)$ at $500\,\mathrm{Hz}$, $5\,\mathrm{ms}$ lag | $134.5$ reversals per second, $92.3\,\mathrm{N\,m}$ actuator swing |
| $\mathrm{sat}(s/\phi)$ | No chattering; ultimate bound $\lvert\theta\rvert_\infty \le \phi/\Lambda$ |
| $\lvert\theta\rvert_\infty \approx \lvert d\rvert\phi/(J\eta\Lambda)$ | Realised error when $\eta$ exceeds the disturbance with margin |
| $\phi = 0.01$ | Bound $716\,\mathrm{mdeg}$, prediction $59.7$, measured $56.1\,\mathrm{mdeg}$ |
| $k_p = J\eta\Lambda/\phi$, $k_d = J(\Lambda + \eta/\phi)$ | Equivalent linear gains inside the layer: $4800$ and $6096$ at $\phi = 0.01$ |
| $u_{\text{st}} = -k_1\sqrt{\lvert s\rvert}\,\mathrm{sign}(s) + w$, $\dot{w} = -k_2\,\mathrm{sign}(s)$ | Super-twisting; continuous control, $0.099\,\mathrm{mdeg}$ measured |

Sliding mode handles the matched part of the uncertainty by switching against it. The next method handles a different problem — a system where the control does not act directly on the state you care about, but two or three integrators away — by building the Lyapunov function one state at a time.
