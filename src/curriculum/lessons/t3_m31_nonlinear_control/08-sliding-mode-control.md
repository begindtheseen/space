---
id: l08-sliding-mode-control
title: Sliding mode control, chattering and boundary layers
minutes: 19
covers:
  - 'Sliding mode control: sliding surface design, reaching phase, chattering, boundary layers, higher-order sliding modes'
---

Picture a rain gutter shaped like a V, tilted gently toward a drain. Drop a marble anywhere on either sloping wall and it rolls down to the bottom crease. Once it reaches the crease it cannot leave: whichever way it wobbles, a wall pushes it back. So it rolls along the crease, at a pace set by the tilt of the gutter, and ends at the drain. It does not matter how heavy the marble is or whether someone flicks it a little on the way. The walls keep it in the crease, and the crease decides where it goes.

**Sliding mode control** builds that gutter out of a control law. Feedback linearization needed the model to be right. Sliding mode starts from the opposite assumption: the model is wrong by some bounded amount, so design a law that does not care. It gives up on a smooth control and switches hard, so that the state is driven onto a surface you chose and then *held* there by the switching — whatever the plant is doing underneath, as long as the disturbance enters through the same channel as the control.

The design splits into two separate problems, which is why it fits in one lesson. First, choose a **sliding surface** $s(\mathbf{x}) = 0$ — the crease — so that motion along it does what you want. That is a small, often first-order, pole-placement problem. Second, design a control that drives $s$ to zero in finite time and keeps it there — the walls. That is a one-line Lyapunov argument. The price is **chattering**. A real controller cannot switch infinitely fast, so the state rattles back and forth across the surface. On a spacecraft that means a reaction wheel reversing its torque a hundred times a second, or a thruster valve cycling until it wears out. This lesson measures the chattering, measures what a **boundary layer** costs to remove it, and shows the modern answer: a second-order sliding mode whose control is continuous and whose pointing beats the switching law it replaces.

## Choosing the surface

For a tracking error $e = y - y_d$ (output minus desired output) in a system of relative degree two, the standard surface is

$$
s = \dot{e} + \Lambda e, \qquad \Lambda > 0 .
$$

($\Lambda$ is capital "lambda"; its units are $\mathrm{s^{-1}}$.) Setting $s = 0$ gives $\dot{e} = -\Lambda e$. So once the state is on the surface, the error decays exponentially with time constant $1/\Lambda$, no matter what the plant is. That is the division of labor: the **[[surface|phase-plane-surface]]** is where you specify performance, and the switching law is where you specify robustness.

Notice the **order reduction**. The state has two numbers, $e$ and $\dot{e}$. The surface is one equation, and the motion on it obeys a first-order equation you wrote down yourself.

For spacecraft attitude, the surface used throughout this module is

$$
\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v ,
$$

where $\mathbf{q}_v$ is the vector part of the error quaternion (three numbers, roughly half the error angle about each axis for small errors) and $\boldsymbol{\omega}$ is the body rate. On this surface the motion is not approximately first-order — it is exactly first-order:

$$
\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\,\mathbf{q}_v .
$$

Here $q_0$ is the scalar part of the quaternion, which is $\cos$ of half the error angle and approaches $1$ as the error closes. So on the surface the attitude error decays with time constant $2/(\Lambda q_0)$, approaching $2/\Lambda$ near the target. It ends at $\mathbf{q}_v = \mathbf{0}$ and $\boldsymbol{\omega} = \mathbf{0}$: pointed, and still.

::: note Why the motion on the attitude surface is exactly first-order
The quaternion kinematics are $\dot{\mathbf{q}}_v = \tfrac{1}{2}(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$. On the surface, $\boldsymbol{\omega} = -\Lambda\mathbf{q}_v$. Substitute:

$$
\dot{\mathbf{q}}_v = \tfrac{1}{2}\left(-\Lambda q_0\mathbf{q}_v - \Lambda\,\mathbf{q}_v\times\mathbf{q}_v\right) .
$$

Any vector crossed with itself is zero, $\mathbf{q}_v\times\mathbf{q}_v = \mathbf{0}$, so the second term vanishes. What remains is $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$, with no approximation made anywhere.
:::

## Reaching the surface in finite time

Now build the walls. Take a single axis of a rigid body:

$$
J\ddot{\theta} = u + d .
$$

$J$ is the moment of inertia ($\mathrm{kg\,m^2}$), $\theta$ the angle error, $u$ the control torque, and $d$ any disturbance or model error that enters through the torque channel. All you know about $d$ is a bound, $|d| \le D$. With $\omega = \dot{\theta}$ and $s = \omega + \Lambda\theta$,

$$
\dot{s} = \dot{\omega} + \Lambda\omega = \frac{u + d}{J} + \Lambda\omega .
$$

Split the control into two parts. The **equivalent control** cancels what you know. The **switching term** fights what you do not:

$$
u = \underbrace{-J\Lambda\omega}_{u_{\text{eq}}} \;-\; J\eta\,\mathrm{sign}(s) .
$$

Here $\mathrm{sign}(s)$ is $+1$ when $s$ is positive and $-1$ when it is negative, and $\eta$ ("eta") is the **switching gain**, in $\mathrm{rad/s^2}$. Substituting, the $\Lambda\omega$ terms cancel and

$$
\dot{s} = -\eta\,\mathrm{sign}(s) + \frac{d}{J} .
$$

To prove the surface is reached, take the Lyapunov candidate $V = \tfrac{1}{2}s^2$ — half the squared distance from the surface. Then

$$
\dot{V} = s\dot{s} = -\eta|s| + \frac{sd}{J} \le -\left(\eta - \frac{D}{J}\right)|s| .
$$

(The step used $s\,\mathrm{sign}(s) = |s|$ and $sd \le |s|D$.) As long as the switching gain beats the disturbance, $\eta > D/J$, the right side is negative whenever $s \ne 0$. Better still, since $\dot{V} = |s|\,\frac{d}{dt}|s|$, dividing by $|s|$ gives $\frac{d}{dt}|s| \le -(\eta - D/J)$: the distance to the surface falls at a *constant* rate, so it hits zero in **[[finite time|finite-vs-exponential]]**:

$$
t_r \le \frac{|s(0)|}{\eta - D/J} .
$$

::: key Sliding surface and reaching condition
Choose $s(\mathbf{x}) = 0$ so that the constrained motion is stable — for attitude, $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$, on which $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$. The reaching condition is

$$
\tfrac{1}{2}\frac{d}{dt}\left(\mathbf{s}^\mathsf{T}\mathbf{s}\right) \le -\eta\lVert\mathbf{s}\rVert ,
$$

which guarantees the surface is reached in finite time — no later than $\lVert\mathbf{s}(0)\rVert/\eta$ — and held afterwards. Once on the surface, the closed-loop behavior is set by $\Lambda$ alone, independent of the plant parameters.
:::

Now the robustness is visible. The disturbance $d$ never appears in the motion on the surface. The switching term absorbs it, flipping sign as often as needed to keep $s$ at zero. This is **invariance to [[matched uncertainty|matched-meaning]]**: any uncertainty that enters through the same channel as the control is rejected completely, up to the size of $\eta$. Uncertainty that enters somewhere else (**unmatched**) is not rejected. It has to be handled by the surface design or by an input-to-state stability argument.

::: example Reaching, then sliding, on a spacecraft axis
**Setup.** $J = 120\,\mathrm{kg\,m^2}$, $\Lambda = 0.8\,\mathrm{s^{-1}}$, $\eta = 0.5\,\mathrm{rad/s^2}$, initial error $\theta(0) = 0.2\,\mathrm{rad}$ at rest, no disturbance. The controller runs at $500\,\mathrm{Hz}$ (a new command every $2\,\mathrm{ms}$), and the actuator is a first-order lag with a $5\,\mathrm{ms}$ time constant.

**Prediction.** $s(0) = \omega(0) + \Lambda\theta(0) = 0 + 0.8 \times 0.2 = 0.160\,\mathrm{rad/s}$. With no disturbance, the reaching time is $t_r = 0.160/0.5 = 0.320\,\mathrm{s}$.

**Simulation.** Integrating the plant in $10\,\mu\mathrm{s}$ steps, $s$ first crosses zero at $0.3237\,\mathrm{s}$. The extra $3.7\,\mathrm{ms}$ is the actuator lag — close to its $5\,\mathrm{ms}$ time constant, as it should be. At that instant $\theta = 0.1765\,\mathrm{rad}$, not $0.2$, because the vehicle was already turning during the reaching phase.

**Sliding.** After that, theory says $\theta$ decays as $0.17653\,e^{-0.8(t - 0.3237)}$:

| $t$ | Simulated $\theta$ | $0.17653\,e^{-0.8(t-0.3237)}$ |
| --- | --- | --- |
| $1\,\mathrm{s}$ | $0.102761$ | $0.10276$ |
| $2\,\mathrm{s}$ | $0.046095$ | $0.04618$ |
| $4\,\mathrm{s}$ | $0.009235$ | $0.00932$ |

The two columns agree to within about one percent; the small gap is the chattering about the surface. The switching term reserves $J\eta = 120 \times 0.5 = 60\,\mathrm{N\,m}$ of torque purely for rejecting disturbances, and the total demand never exceeds $J(\Lambda|\omega| + \eta) = 73.6\,\mathrm{N\,m}$ over the maneuver.
:::

## Chattering, measured

The ideal law needs $\mathrm{sign}(s)$ to be evaluated and applied continuously, the instant $s$ changes sign. Three things in any real loop prevent that:

- The controller runs at a finite rate, so each sign is held for a whole sample.
- The actuator has finite bandwidth, so a commanded reversal arrives late.
- There are fast dynamics the model left out — structural bending, fuel slosh, valve response — and the switching shakes them.

So the state overshoots the surface, the sign flips, it overshoots the other way, and the loop settles into a fast **limit cycle** around $s = 0$ instead of sitting on it. That rattle is **[[chattering|chattering-word]]**.

The standard cure is to soften the switch. Replace $\mathrm{sign}(s)$ by the **[[saturation function|sign-and-sat]]**

$$
\mathrm{sat}(s/\phi) = \begin{cases} s/\phi, & |s| \le \phi \\ \mathrm{sign}(s), & |s| \gt \phi \end{cases}
$$

— that is, $s/\phi$ clipped to the range $[-1, 1]$. Outside a band of half-width $\phi$ ("phi") around the surface it acts exactly like the switch. Inside the band, the **boundary layer**, it is a smooth straight line. As $\phi \to 0$ it becomes $\mathrm{sign}(s)$ again.

::: example What chattering costs, and what a boundary layer buys
**Setup.** The same vehicle, now with a matched disturbance torque $d(t) = 3 + 2\sin(0.5t)\,\mathrm{N\,m}$. Its peak is $5\,\mathrm{N\,m}$, well inside the $60\,\mathrm{N\,m}$ of switching authority. Each run lasts $60\,\mathrm{s}$, and the statistics come from the last ten seconds.

| Law | Peak $\lvert\theta\rvert$ | Command reversals per second | Actuator swing (peak to peak) |
| --- | --- | --- | --- |
| $\mathrm{sign}(s)$ | $5.10\,\mathrm{mdeg}$ | $134.5$ | $92.3\,\mathrm{N\,m}$ |
| $\mathrm{sat}(s/\phi)$, $\phi = 0.01$ | $56.1\,\mathrm{mdeg}$ | $0$ | $4.02\,\mathrm{N\,m}$ |
| $\mathrm{sat}(s/\phi)$, $\phi = 0.05$ | $280.2\,\mathrm{mdeg}$ | $0$ | $4.09\,\mathrm{N\,m}$ |
| Super-twisting | $0.099\,\mathrm{mdeg}$ | $0$ | $5.06\,\mathrm{N\,m}$ |

(An mdeg, a millidegree, is a thousandth of a degree.)

**The switching law.** Its pointing is excellent, and its actuator behavior is unflyable: $134$ full torque reversals every second, with the wheel torque swinging across $92\,\mathrm{N\,m}$ forever — on a vehicle whose disturbance is only $5\,\mathrm{N\,m}$. That is bearing wear, heat and structural shaking bought for nothing.

**The boundary layer.** Replacing $\mathrm{sign}(s)$ with $\mathrm{sat}(s/\phi)$ stops it outright: zero reversals, and a $4\,\mathrm{N\,m}$ swing that is no more than the disturbance being cancelled. The cost is pointing — about eleven times worse at $\phi = 0.01$. The error grows in proportion to $\phi$: five times the $\phi$ gives $280.2/56.1 \approx 4.99$ times the error.

**The design rule.** The knee of this trade sits at the smallest $\phi$ that removes the chattering, which here lies between $\phi = 0$ and $\phi = 0.01$. Set $\phi$ so the layer is a bit wider than the excursion that the sample rate and actuator lag produce, and no wider.
:::

## Sizing the boundary layer

Inside the layer the control is smooth, so the state is no longer *forced* onto the surface. The switch is gone, and $s$ is only kept small rather than driven to zero. The honest guarantee is therefore **[[ultimate boundedness|ultimate-bound-word]]**, not asymptotic stability: eventually $|s| \le \phi$ and stays there. When the vehicle is at rest, $\omega = 0$, so $s = \Lambda\theta$ and

$$
|\theta|_\infty \le \frac{\phi}{\Lambda} .
$$

(Read $|\theta|_\infty$ as "the size of $\theta$ in the long run".)

::: key Boundary layer
Replace $\mathrm{sign}(s)$ by $\mathrm{sat}(s/\phi)$. Chattering disappears; asymptotic stability is replaced by ultimate boundedness, with steady error scaling like $\phi/\Lambda$. Inside the layer the law is linear, with effective gains $k_p = J\eta\Lambda/\phi$ and $k_d = J(\Lambda + \eta/\phi)$, so a thin layer is a high-gain controller whose demand is clipped at $J(\Lambda|\omega| + \eta)$. Higher-order (super-twisting) sliding modes keep the robustness with a continuous control.
:::

::: note Where the effective gains come from
Inside the layer, $\mathrm{sat}(s/\phi) = s/\phi$, so the law reads

$$
u = -J\Lambda\omega - \frac{J\eta}{\phi}(\omega + \Lambda\theta) = -\frac{J\eta\Lambda}{\phi}\,\theta - J\left(\Lambda + \frac{\eta}{\phi}\right)\omega .
$$

That is a proportional-derivative (PD) law: $k_p = J\eta\Lambda/\phi$ on angle and $k_d = J(\Lambda + \eta/\phi)$ on rate. Outside the layer, the saturation caps the switching part at $J\eta$, so the demand can never exceed $J(\Lambda|\omega| + \eta)$.
:::

The bound $\phi/\Lambda$ is the worst case. The actual error is smaller when the switching gain comfortably exceeds the disturbance. Inside the layer $\dot{s} = -(\eta/\phi)s + d/J$, which settles at $|s| = (|d|/J)(\phi/\eta)$, and so

$$
|\theta|_\infty \approx \frac{|d|\,\phi}{J\eta\Lambda} .
$$

With $|d| = 5\,\mathrm{N\,m}$ and $\phi = 0.01$, this predicts $\frac{5 \times 0.01}{120 \times 0.5 \times 0.8} = 1.04\times10^{-3}\,\mathrm{rad} = 59.7\,\mathrm{mdeg}$. The simulation measured $56.1\,\mathrm{mdeg}$. The worst-case bound is $\phi/\Lambda = 0.01/0.8 = 1.25\times10^{-2}\,\mathrm{rad} = 716\,\mathrm{mdeg}$. Use $\phi/\Lambda$ for the guarantee and the second formula for the expectation.

The effective gains explain why boundary-layer sliding mode is worth the trouble. At $\phi = 0.01$ the law inside the layer is a PD with

$$
k_p = \frac{120 \times 0.5 \times 0.8}{0.01} = 4800\,\mathrm{N\,m/rad}, \qquad k_d = 120\left(0.8 + \frac{0.5}{0.01}\right) = 6096\,\mathrm{N\,m\,s} .
$$

A simulation of that plain linear PD reproduces the sliding-mode error exactly: $0.0561^\circ$. But that PD would demand $k_p \times 0.2 = 960\,\mathrm{N\,m}$ at the start of a $0.2\,\mathrm{rad}$ maneuver, while the sliding-mode law demands only $73.6\,\mathrm{N\,m}$, because the saturation clips it. A conventional PD sized to fit that torque limit, $k_p = k_d = 96$, leaves a peak error of $3.19^\circ$ under the same disturbance — about fifty-seven times worse. Sliding mode is how you get high-gain disturbance rejection out of a bounded actuator.

## Higher-order sliding modes

The boundary layer removes chattering by giving up the sliding mode. A **second-order sliding mode** removes it a different way: it moves the switch into the *rate of change* of the control, so the torque itself is continuous while $s$ and $\dot{s}$ both reach zero in finite time. The standard law is **[[super-twisting|super-twisting-origin]]**:

$$
u_{\text{st}} = -k_1\sqrt{|s|}\,\mathrm{sign}(s) + w, \qquad \dot{w} = -k_2\,\mathrm{sign}(s) ,
$$

used in place of the $-\eta\,\mathrm{sign}(s)$ term. The switching now happens inside an integrator, so $w$ changes smoothly, and the $\sqrt{|s|}$ term supplies finite-time convergence that a plain linear term could not. A common gain rule is $k_1 \gtrsim 1.5\sqrt{\rho}$ and $k_2 \gtrsim 1.1\rho$, where $\rho$ ("rho") bounds how fast the disturbance can change.

In the table above, super-twisting with $k_1 = 1.0$ and $k_2 = 0.5$ gives $0.099\,\mathrm{mdeg}$ of pointing error. That is about fifty times better than the pure switching law and more than five hundred times better than the $\phi = 0.01$ boundary layer — with a smooth $5.06\,\mathrm{N\,m}$ actuator command and no reversals. It needs only $s$, not $\dot{s}$, which is a large part of why it is the variant engineers reach for. Exact convergence plus a continuous command is why super-twisting is now often chosen over the classical boundary layer in new designs.

::: warning Size the switching gain against the matched part only
The switching gain must exceed the *matched* uncertainty, and only the matched part. A disturbance entering through a different channel — say an unmodeled flexible mode's contribution to the measured rate — is not cancelled by the switching. Raising $\eta$ against it makes chattering worse without helping. Sort your uncertainty into matched and unmatched before choosing $\eta$.
:::

::: warning Do not chase a small boundary layer
As $\phi \to 0$, the effective gains $J\eta\Lambda/\phi$ and $J\eta/\phi$ grow without limit. Long before the ideal sliding mode comes back, the loop will be shaking whatever fast dynamics the model left out. If you need a thin layer to meet a pointing requirement, treat that as a signal to change $\Lambda$ or move to a second-order sliding mode, not to keep shrinking $\phi$.
:::

::: note The order reduction, counted
The full attitude problem has six states: three for attitude, three for rate. The surface $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ is three constraints, and the motion on it is the three-state first-order system $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$, whose behavior you chose with one number. The inertia matrix does not appear in it. That is the whole appeal: the designed behavior belongs to the surface, not to the vehicle.
:::

## Check yourself

::: check
A vehicle has $J = 250\,\mathrm{kg\,m^2}$ and an unmodeled disturbance torque bounded by $12\,\mathrm{N\,m}$. You want the sliding-mode attitude error to decay with a $4\,\mathrm{s}$ time constant, using $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$. Choose $\Lambda$ and a minimum $\eta$, and find the reaching time from $\lVert\mathbf{s}(0)\rVert = 0.3\,\mathrm{rad/s}$.
:::

::: answer
On the surface the attitude decays with time constant $2/\Lambda$ (with $q_0 \approx 1$), so $2/\Lambda = 4\,\mathrm{s}$ gives $\Lambda = 0.5\,\mathrm{s^{-1}}$.

The switching gain must exceed $D/J = 12/250 = 0.048\,\mathrm{rad/s^2}$. Leave margin: take $\eta = 0.15\,\mathrm{rad/s^2}$, which reserves $J\eta = 250 \times 0.15 = 37.5\,\mathrm{N\,m}$ of authority.

The reaching time is at most $\lVert\mathbf{s}(0)\rVert/(\eta - D/J) = 0.3/(0.15 - 0.048) = 0.3/0.102 \approx 2.94\,\mathrm{s}$. With no disturbance it would be $0.3/0.15 = 2.0\,\mathrm{s}$ — shorter, as it should be.
:::

::: check
Why is the convergence to the surface in finite time rather than only asymptotic, when $\dot{V} \le -\eta|s|$ looks like an ordinary Lyapunov decrease?
:::

::: answer
Because the decrease is not proportional to $V$. With $V = \tfrac{1}{2}s^2$ we have $|s| = \sqrt{2V}$, so $\dot{V} \le -\eta\sqrt{2V}$. Separating variables gives $\sqrt{V(t)} \le \sqrt{V(0)} - \eta t/\sqrt{2}$, which reaches zero at a finite time.

Put another way, $\frac{d}{dt}|s| \le -\eta$: the surface variable falls at a constant rate rather than a rate proportional to itself. An ordinary asymptotic bound reads $\dot{V} \le -cV$ and gives exponential decay, which never quite arrives. Finite-time convergence is a hallmark of discontinuous control, and it is something the linearization (indirect) method could never certify.
:::

::: check
The measured pointing error at $\phi = 0.01$ was $56.1\,\mathrm{mdeg}$, and the design bound $\phi/\Lambda$ was $716\,\mathrm{mdeg}$. Which would you put in a requirements document, and why is the gap so large?
:::

::: answer
Put $\phi/\Lambda = 716\,\mathrm{mdeg}$ in the requirement. It is the bound that holds for *any* matched disturbance up to the design limit $J\eta = 60\,\mathrm{N\,m}$, and requirements must survive the worst case.

The gap is large because the actual disturbance is $5\,\mathrm{N\,m}$, only $5/60$, about $8.3$ percent, of what the switching gain is sized for. The realized error carries exactly that factor: $|\theta|_\infty \approx |d|\phi/(J\eta\Lambda)$ contains $|d|/(J\eta) \approx 0.083$. Report both — the bound as the guarantee and the prediction as the expectation — each with its disturbance assumption attached.
:::

::: check
An engineer removes the $u_{\text{eq}} = -J\Lambda\omega$ term, arguing that the switching term alone will keep $s$ at zero. What happens?
:::

::: answer
Without it, $\dot{s} = -\eta\,\mathrm{sign}(s) + \Lambda\omega + d/J$. The surface is still reached, but only if $\eta$ is big enough to beat the uncancelled term *and* the disturbance: $\eta > \Lambda|\omega|_{\max} + D/J$.

So the design still works, at the price of a larger switching gain and worse chattering, and the gain you need now depends on how fast the vehicle turns. The equivalent-control term is what lets you size $\eta$ against the *uncertainty* instead of against the whole dynamics: the known part is cancelled openly, the unknown part is switched against. Cancelling more of what you know always buys a smaller $\eta$.
:::

::: check
Why does super-twisting achieve better pointing than the pure switching law in the table, when switching is supposed to be the ideal?
:::

::: answer
Because the pure switching law is not being realized. The ideal $\mathrm{sign}(s)$ mode would hold $s$ exactly at zero. But at $500\,\mathrm{Hz}$ with a $5\,\mathrm{ms}$ actuator, each command is held for a whole sample and arrives late, so the state overshoots by an amount set by the sample period and the lag. That produces the $5.10\,\mathrm{mdeg}$ limit cycle and $134$ reversals a second.

Super-twisting applies a *continuous* torque; its discontinuity lives inside the integrator. The actuator lag no longer turns a sign flip into an overshoot, and the loop settles much closer to the surface. The general lesson: with a bandwidth-limited actuator, a continuous law that is exact in the limit beats a discontinuous law the hardware cannot carry out.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $s = \dot{e} + \Lambda e$ | Sliding surface; on it $\dot{e} = -\Lambda e$, time constant $1/\Lambda$ |
| $\mathbf{s} = \boldsymbol{\omega} + \Lambda\mathbf{q}_v$ | Attitude surface; on it $\dot{\mathbf{q}}_v = -\tfrac{1}{2}\Lambda q_0\mathbf{q}_v$, time constant about $2/\Lambda$ |
| $u = -J\Lambda\omega - J\eta\,\mathrm{sign}(s)$ | Equivalent control plus switching term |
| $\tfrac{1}{2}\frac{d}{dt}(\mathbf{s}^\mathsf{T}\mathbf{s}) \le -\eta\lVert\mathbf{s}\rVert$ | Reaching condition; finite time, $t_r \le \lvert s(0)\rvert/(\eta - D/J)$ |
| $\eta > D/J$ | Switching gain must beat the matched disturbance bound |
| Matched uncertainty | Rejected completely on the surface; unmatched is not |
| $J = 120$, $\Lambda = 0.8$, $\eta = 0.5$, $\theta_0 = 0.2$ | $t_r = 0.320\,\mathrm{s}$ predicted, $0.324\,\mathrm{s}$ simulated |
| $\mathrm{sign}(s)$ at $500\,\mathrm{Hz}$, $5\,\mathrm{ms}$ lag | $134.5$ reversals per second, $92.3\,\mathrm{N\,m}$ actuator swing |
| $\mathrm{sat}(s/\phi)$ | No chattering; ultimate bound $\lvert\theta\rvert_\infty \le \phi/\Lambda$ |
| $\lvert\theta\rvert_\infty \approx \lvert d\rvert\phi/(J\eta\Lambda)$ | Expected error when $\eta$ beats the disturbance with margin |
| $\phi = 0.01$ | Bound $716\,\mathrm{mdeg}$, prediction $59.7$, measured $56.1\,\mathrm{mdeg}$ |
| $k_p = J\eta\Lambda/\phi$, $k_d = J(\Lambda + \eta/\phi)$ | Linear gains inside the layer: $4800$ and $6096$ at $\phi = 0.01$ |
| $u_{\text{st}} = -k_1\sqrt{\lvert s\rvert}\,\mathrm{sign}(s) + w$, $\dot{w} = -k_2\,\mathrm{sign}(s)$ | Super-twisting; continuous control, $0.099\,\mathrm{mdeg}$ measured |

Sliding mode handles the matched part of the uncertainty by switching against it. The next method takes on a different problem — a system where the control does not act on the state you care about directly, but two or three integrators away — by building the Lyapunov function one state at a time.

::: context phase-plane-surface The surface in the phase plane
Plot the error $e$ across and its rate $\dot{e}$ up. The surface $s = 0$ is the straight line $\dot{e} = -\Lambda e$ through the origin, sloping down to the right. Off the line, the switching pushes the state toward it from both sides (reaching). On the line, the state slides toward the origin (sliding). Steeper $\Lambda$ means a faster slide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="15" x2="180" y2="190" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="332" y="116" font-size="12" fill="#1f2a44">e</text>
  <text x="188" y="24" font-size="12" fill="#1f2a44">ė</text>
  <line x1="80" y1="25" x2="290" y2="182" stroke="#1d6fd1" stroke-width="3"/>
  <text x="84" y="46" font-size="12" fill="#1d6fd1">s = 0 (slope −Λ)</text>
  <path d="M290,80 C305,105 290,140 262,161" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <line x1="262" y1="161" x2="196" y2="112" stroke="#b4232c" stroke-width="2.2"/>
  <polygon points="190,108 203,110 197,119" fill="#b4232c"/>
  <circle cx="290" cy="80" r="4" fill="#b4232c"/>
  <text x="274" y="72" font-size="11" fill="#1f2a44">start</text>
  <text x="296" y="140" font-size="11" fill="#b4232c">reaching</text>
  <text x="212" y="152" font-size="11" fill="#b4232c">sliding</text>
  <g stroke="#f2b880" stroke-width="2">
    <line x1="120" y1="120" x2="140" y2="96"/><line x1="220" y1="60" x2="200" y2="84"/>
  </g>
  <g fill="#f2b880">
    <polygon points="143,92 132,97 140,103"/><polygon points="197,88 208,83 200,77"/>
  </g>
</svg>
```
:::

::: context finite-vs-exponential Finite time versus "forever"
An exponential decay halves, then halves again, and never quite reaches zero. The reaching law is different: the distance to the surface falls at a steady rate, like water draining from a tank through a fixed-size hole, and hits zero at a definite moment. The picture uses the example's numbers: $|s(0)| = 0.16$, $\eta = 0.5$, so the red line lands at $0.32\,\mathrm{s}$. The blue curve is an exponential with the same starting slope.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="30" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,42.0 64.0,60.5 78.0,76.4 92.0,89.9 106.0,101.5 120.0,111.4 134.0,119.9 148.0,127.1 162.0,133.3 176.0,138.6 190.0,143.2 204.0,147.1 218.0,150.4 232.0,153.2 246.0,155.6 260.0,157.7 274.0,159.5 288.0,161.0 302.0,162.3 316.0,163.4 330.0,164.4"/>
  <line x1="50" y1="42" x2="139.6" y2="170" stroke="#b4232c" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="188">0</text><text x="139.6" y="188">0.32</text><text x="330" y="188">1 s</text>
  </g>
  <text x="44" y="46" font-size="11" fill="#1f2a44" text-anchor="end">0.16</text>
  <text x="150" y="80" font-size="12" fill="#1d6fd1">exponential</text>
  <text x="96" y="160" font-size="12" fill="#b4232c">|s| reaching law</text>
</svg>
```
:::

::: context matched-meaning What "matched" means
A disturbance is matched when it pushes on the system through the same door as the control. A wind gust torque on a spacecraft axis is matched to the reaction wheel torque on that axis: both add to $J\ddot{\theta}$. Anything the control can push against directly, it can cancel. A disturbance that enters somewhere else — a sensor error on the rate, or a force on a state the control reaches only through other states — is unmatched, and no amount of switching at the control's door can cancel it exactly.
:::

::: context chattering-word Why it is called chattering
Engineers use "chatter" for any fast back-and-forth rattle: a relay contact buzzing open and shut, a machine tool vibrating against the metal it cuts. In sliding mode, the control rattles between its two extreme values. On a reaction wheel, each reversal loads the bearings and warms the motor; on a thruster, each cycle wears the valve seat. That is why chattering is a hardware problem, not only a plot that looks ugly.
:::

::: context sign-and-sat The switch and its softened version
On the left, $\mathrm{sign}(s)$ jumps from $-1$ to $+1$ at $s = 0$ — an infinitely steep wall. On the right, $\mathrm{sat}(s/\phi)$ climbs along a straight ramp from $-\phi$ to $+\phi$ and is flat outside. The ramp is the boundary layer; its slope $1/\phi$ is what makes a thin layer a high-gain law.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="15" y1="70" x2="165" y2="70"/><line x1="90" y1="15" x2="90" y2="125"/>
    <line x1="195" y1="70" x2="345" y2="70"/><line x1="270" y1="15" x2="270" y2="125"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="3" fill="none">
    <polyline points="20,105 90,105"/><polyline points="90,35 160,35"/>
    <polyline points="200,105 245,105 295,35 340,35"/>
  </g>
  <line x1="90" y1="105" x2="90" y2="35" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4,3"/>
  <g font-size="11" fill="#1f2a44">
    <text x="96" y="30">+1</text><text x="58" y="120">−1</text>
    <text x="232" y="86">−φ</text><text x="291" y="86">+φ</text>
    <text x="276" y="30">+1</text><text x="200" y="120">−1</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="138">sign(s)</text><text x="270" y="138">sat(s/φ)</text>
  </g>
</svg>
```
:::

::: context ultimate-bound-word What "ultimately bounded" promises
Asymptotic stability promises that the error goes to zero. Ultimate boundedness promises less: after some time, the error enters a box of a known size and never leaves it. For the boundary layer, the box is $|s| \le \phi$, which gives $|\theta| \le \phi/\Lambda$ at rest. It is the honest promise for a smooth law facing an unknown push that keeps changing: the push never stops, so neither does a small leftover error.
:::

::: context super-twisting-origin Where super-twisting came from
Sliding mode control grew out of Soviet work on "variable structure systems" in the 1950s and 1960s, and Vadim Utkin's survey in 1977 brought it to a wide Western audience. The chattering problem followed it from the start. In the early 1990s Arie Levant introduced higher-order sliding modes, including the super-twisting algorithm, which keeps the finite-time convergence while making the control itself continuous. It is now a standard tool in spacecraft, aircraft and motor control.
:::
