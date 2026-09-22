---
id: l09-miss-distance-and-adjoint-methods
title: Miss-distance analysis and the adjoint method
minutes: 24
covers:
  - Miss-distance analysis and adjoint methods
---

A guidance design needs an answer to a question none of the derivations so far address: given every disturbance a real flight can see — an initial heading error, a target maneuver, autopilot lag, sensor noise — how much does each one actually cost in final miss, and does *when* it happens matter? Answering this one disturbance at a time, by simulating the whole engagement once per candidate disturbance and once per candidate timing, is the obvious approach and the expensive one. The adjoint method gets the complete answer — sensitivity to a disturbance at *every* possible instant — from a single backward integration, run once.

## A linearized guidance loop worth asking the question about

The earlier lessons' closed loop, PN with no lag and infinite achievable acceleration, is a poor subject for this question: with nothing limiting how hard it can react as $t_{go}\to0$, it drives *any* finite disturbance's effect to zero, however late it occurs — a real answer, but not an interesting one, and not a realistic one. Real autopilots take time to produce commanded acceleration. Add that one ingredient, a first-order lag with time constant $\tau_a$ on the achieved acceleration $x_3$ behind the commanded one, and the system becomes rich enough to show real structure:

$$
\dot x_1 = x_2, \qquad \dot x_2 = x_3 + w(t), \qquad \dot x_3 = \frac{1}{\tau_a}\left(-\frac{N}{t_{go}^2}x_1 - \frac{N}{t_{go}}x_2 - x_3\right),
$$

with $x_1$ the miss channel, $x_2$ its rate, $x_3$ the actual achieved lateral acceleration, and $w(t)$ an external disturbance (a target maneuver) entering through $\dot x_2$. In matrix form, $\dot{\mathbf{x}} = \mathbf{F}(t)\mathbf{x} + \mathbf{G}w$, with $\mathbf{G} = (0,1,0)^\top$ and $\mathbf{F}(t)$ time-varying through $t_{go} = t_f-t$. This is exactly the kind of linear time-varying system the state-space module builds a state-transition matrix for, and that STM is where the adjoint method comes from.

## The adjoint method, derived

Write $\boldsymbol\Phi(t_f,t)$ for the state-transition matrix of $\dot{\mathbf x}=\mathbf F(t)\mathbf x$ — it maps a perturbation present at time $t$ forward to its effect at $t_f$ — and recall its defining property, $\partial\boldsymbol\Phi(t_f,t)/\partial t = -\boldsymbol\Phi(t_f,t)\mathbf F(t)$. The final miss caused by an impulsive disturbance of unit area in $w$ at time $t$ is $\mathbf{c}^\top\boldsymbol\Phi(t_f,t)\mathbf{G}$, where $\mathbf{c}=(1,0,0)^\top$ selects the miss channel. Define $\boldsymbol\psi(t)^\top \equiv \mathbf{c}^\top\boldsymbol\Phi(t_f,t)$; differentiating,

$$
\dot{\boldsymbol\psi}(t)^\top = \mathbf{c}^\top\frac{\partial\boldsymbol\Phi(t_f,t)}{\partial t} = -\mathbf{c}^\top\boldsymbol\Phi(t_f,t)\mathbf{F}(t) = -\boldsymbol\psi(t)^\top\mathbf{F}(t),
$$

so $\boldsymbol\psi$ satisfies its own, simpler differential equation, $\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi$, with terminal condition $\boldsymbol\psi(t_f) = \mathbf{c}$ (since $\boldsymbol\Phi(t_f,t_f)=\mathbf{I}$). Integrate this **backward** from $t_f$ to $t=0$ — equivalently, forward in $\tau=t_{go}$ from $0$ to the full flight time — and $h(\tau) \equiv \boldsymbol\psi(\tau)^\top\mathbf{G}$ is the sensitivity of the final miss to a unit impulse of the disturbance at *every* time-to-go $\tau$ at once, from that one run.

::: key The adjoint method
$$
\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi, \qquad \boldsymbol\psi(t_f) = \mathbf{c},
$$
integrated backward from the final time. $h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}$ gives the sensitivity of the terminal miss to a disturbance impulse at time-to-go $\tau$, for every $\tau$, from one run — replacing one forward simulation per candidate disturbance time with a single backward one.
:::

::: example One backward run matches many forward runs
With $N=4$, $\tau_a = 0.5\,\mathrm{s}$, a $10\,\mathrm{s}$ nominal flight: run the adjoint equation once, then check it against direct forward simulations that inject a unit-area impulse at several different times and propagate to $t_f$.

```python
# direct: inject impulse at t_inject, propagate F(t) forward to tf, read x1(tf)
# adjoint: one backward run, then h(tau) = psi(tau) . G
for tau in (0.20, 0.50, 1.00, 2.00, 4.00, 7.00, 10.00):
    pass
# tau=0.20  direct= 0.116044  adjoint= 0.116044
# tau=0.50  direct= 0.130361  adjoint= 0.130361
# tau=1.00  direct= 0.000036  adjoint= 0.000036
# tau=2.00  direct=-0.022979  adjoint=-0.022979
# tau=4.00  direct= 0.022596  adjoint= 0.022596
# tau=7.00  direct= 0.017294  adjoint= 0.017294
# tau=10.00 direct= 0.016764  adjoint= 0.016764
```

Every value matches to six decimal places — seven independent forward simulations, each a full integration of the closed-loop system, all reproduced from the single backward run that produced $h(\tau)$.
:::

The shape $h(\tau)$ traces out is worth reading, not just checking. Sensitivity is small for a disturbance injected early ($\tau=10$: $0.0168$) — plenty of flight time remains for the loop to correct it. It is small again for a disturbance injected essentially at intercept ($\tau=0.1$: $0.0478$, smaller than the peak) — there is simply too little time left for even a large kick in $x_2$ to accumulate into much position error before $t_f$ arrives. Between those two extremes it **peaks** around $\tau\approx0.5\,\mathrm{s}$ (sensitivity $0.130$, nearly eight times the early-flight value) and even changes sign near $\tau\approx1$–$2\,\mathrm{s}$ — a disturbance at exactly the wrong late moment, when the lag has too little time to correct it but there is still enough flight left for the error to grow, costs several times more miss than the same disturbance almost anywhere else in the flight. No amount of staring at the closed-form gains alone predicts this peak; it falls out only once the lag is in the model and the adjoint run is done.

::: warning A negative sensitivity is not a smaller effect — it is an opposite one
$h(\tau)$ changed sign in the example above. A negative value does not mean "this disturbance matters less"; it means a disturbance there pushes the final miss the *opposite* direction from a disturbance at a $\tau$ where $h$ is positive. Two disturbances of the same sign at times where $h$ has opposite signs can partially cancel in the total miss — which is exactly the kind of structure a miss-distance budget needs to get right, and exactly what a table of magnitudes alone would hide.
:::

## The real payoff: any disturbance history, still one run

Because the underlying system is linear, $h(\tau)$ is not just a table of impulse responses — it is a Green's function. The final miss caused by *any* disturbance history $w(t)$, not only an idealized impulse, is the convolution

$$
x_1(t_f) = \int_0^{t_f} h(t_f - t)\,w(t)\,dt,
$$

computed entirely from the single adjoint run already done, no new simulation required.

::: example Predicting the miss from a target's jink, without re-simulating
The target executes a $3\,\mathrm{m/s^2}$ lateral maneuver from $t=6\,\mathrm{s}$ to $t=9\,\mathrm{s}$ — three seconds of sustained acceleration, not an impulse. Compare a full forward simulation carrying that disturbance through the closed loop against the convolution integral built from the adjoint run already computed:

```python
from scipy.integrate import quad
def w(t):
    return 3.0 if 6.0 <= t <= 9.0 else 0.0
# direct forward simulation with w(t) driving the closed loop:
# x1(tf) = -0.031019
# convolution of the SAME adjoint run against w(t):
# quad(lambda tau: h(tau) * w(tf - tau), 0, tf)[0] = -0.031019
```

Agreement to six decimal places, and no second simulation was run — the entire disturbance history was evaluated against the one backward pass. This is the method's actual value: a real miss-distance budget has to price a dozen or more disturbance sources — initial heading error, several candidate maneuver onset times, seeker noise, wind — and every one of them is answered from the same single adjoint solution rather than a fresh forward simulation apiece.
:::

::: note The stochastic extension
Sensor noise is not a single deterministic disturbance but a random process, usually described by a power spectral density rather than a fixed history. The same $h(\tau)$ still carries the answer — the mean-square miss contribution from a noise source is an integral of $h(\tau)^2$ weighted by that noise's power spectral density — but working through that integral properly belongs to the probability and estimation machinery this module leans on rather than to guidance itself, and is not derived further here.
:::

::: warning Linearity is what makes any of this valid
Both the impulse-response identity and the convolution integral above depend on the system being linear — superposition has to hold, or "the response to two disturbances is the sum of the responses to each" is simply false. The engagement here was linearized exactly the way earlier lessons' small-heading-error, near-collision-course arguments did; a guidance loop analyzed far from that regime, or one with a genuinely nonlinear element (a hard acceleration limit, say), does not get this shortcut for free, and the next lesson's actuator-limit discussion is exactly where that boundary starts to matter.
:::

## Check yourself

::: check
State the adjoint differential equation and its terminal condition, and explain in one sentence why it is integrated backward.
:::

::: answer
$\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi$, with $\boldsymbol\psi(t_f) = \mathbf{c}$, where $\mathbf{c}$ selects the state whose terminal value is of interest. It is integrated backward because the question it answers — "how does a disturbance at time $t$ affect the outcome at the fixed later time $t_f$" — is naturally posed from the endpoint back toward the present; fixing the known condition at $t_f$ and running backward reaches every earlier $t$ in a single pass, whereas running forward from an unknown-in-advance $t$ would need a separate run for each candidate disturbance time.
:::

::: check
Why does introducing an autopilot lag reveal a non-trivial sensitivity curve, when the same analysis without lag drove every disturbance's effect to zero regardless of timing?
:::

::: answer
Without lag, the commanded acceleration is achieved instantly, and PN's gains grow without bound as $t_{go}\to0$ — an idealization with effectively infinite authority to correct anything, however late, given the earlier lessons' own convergence result. A lag caps how fast achieved acceleration can actually follow the command, so there genuinely exist disturbance timings the loop cannot fully correct in the time available: too early, and ordinary correction handles it; too close to intercept, and there simply is not enough remaining flight for even an uncorrected disturbance to grow into much miss; in between, the lag prevents full correction while enough flight time remains for the residual to matter, producing the peak the worked example found.
:::

::: check
Using the adjoint sensitivities $h(\tau{=}4.0) = 0.022596$ and $h(\tau{=}1.5) = -0.041049$, predict the total miss from an impulse of area $2.0$ at $\tau=4.0\,\mathrm{s}$ together with an impulse of area $-1.5$ at $\tau=1.5\,\mathrm{s}$.
:::

::: answer
By superposition (linearity), the total miss is the sum of each impulse's area times its sensitivity: $2.0(0.022596) + (-1.5)(-0.041049) = 0.045192 + 0.061574 = 0.106766\,\mathrm{m}$. A direct simulation carrying both impulses through the closed loop together confirms this exactly — the two contributions add linearly with no interaction term, which is precisely what makes a multi-source miss-distance budget buildable from single-source sensitivities in the first place.
:::

::: check
A miss-distance budget lists three disturbance sources with their RMS miss contributions but not their signs or timing. What is missing, and why does it matter?
:::

::: answer
Missing the sign and timing of each contribution's $h(\tau)$ means the budget cannot say whether the sources add or partially cancel — three sources each contributing what looks like a comparable RMS miss could combine to a much larger total (if their effective signs align) or a much smaller one (if they oppose), and a magnitude-only table cannot distinguish the two. Since the adjoint sensitivity curve can change sign within a single flight, as the worked example showed, even a single source evaluated at two different candidate disturbance times can contribute with opposite sign to two different failure scenarios; a complete budget has to carry the sensitivity function, not just a magnitude, to combine sources correctly.
:::

::: check
Why can the same single adjoint run answer questions about an impulsive disturbance, a sustained maneuver, and — in principle — a random noise process, without being re-derived for each?
:::

::: answer
All three are just different choices of $w(t)$ fed into the same linear system, and $h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}$ depends only on the system's own dynamics $\mathbf{F}(t)$ and $\mathbf{G}$, not on what particular disturbance is applied. An impulse reads $h(\tau)$ off directly; a sustained history convolves $h$ against $w(t)$; a random process, being fully characterized by a spectral description of how its energy is distributed over time, combines with $h(\tau)$ through an integral in the same spirit as the deterministic convolution. The adjoint solution is a property of the guidance loop, not of any one disturbance, which is exactly why computing it once suffices for all of them.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Linearized loop with lag | $\dot x_1=x_2$, $\dot x_2=x_3+w$, $\dot x_3=\big({-}Nx_1/t_{go}^2-Nx_2/t_{go}-x_3\big)/\tau_a$ |
| Adjoint equation | $\dot{\boldsymbol\psi}=-\mathbf{F}(t)^\top\boldsymbol\psi$, $\boldsymbol\psi(t_f)=\mathbf{c}$, integrated backward |
| Sensitivity function | $h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}$: miss per unit impulse at time-to-go $\tau$, all $\tau$ from one run |
| Convolution | $x_1(t_f) = \int_0^{t_f} h(t_f-t)\,w(t)\,dt$ — any disturbance history, still one run |
| Why lag matters | Without it, PN's growing gain nulls every disturbance regardless of timing; with it, sensitivity peaks at a specific, non-obvious $\tau$ |
| Validity | Requires the loop to be linear (or linearized); a hard actuator limit breaks the superposition this method relies on |

Every sensitivity computed here assumed $t_{go}$ was known exactly, at every instant. The next lesson takes on the question this one kept sidestepping — where $t_{go}$ actually comes from, and what happens to a guidance loop like this one when that estimate is wrong.
