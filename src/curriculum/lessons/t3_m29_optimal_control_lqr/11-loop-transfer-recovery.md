---
id: l11-loop-transfer-recovery
title: Loop transfer recovery and what it costs
minutes: 18
covers:
  - Loop transfer recovery and what it actually costs
---

Two lessons ago the margins of full-state-feedback LQR were shown to be excellent and guaranteed. One lesson ago the estimator that makes the controller implementable was shown to destroy that guarantee. Loop transfer recovery is the standard repair, and it works by doing something that sounds wrong: deliberately designing the Kalman filter for a disturbance model you know to be false.

The reasoning is worth stating plainly before any algebra. The LQR margins come from the shape of the loop transfer function $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ at the plant input. The LQG loop at that same point has the estimator dynamics inserted into it and is a different shape. If the estimator could be made so fast and so trusting of its measurements that it contributed no dynamics of its own over the frequency range that matters, the LQG loop shape would approach the LQR loop shape, and the margins would come back with it. Loop transfer recovery is the systematic way to force that limit, using the one knob the Kalman design exposes: the assumed process noise.

It is a real technique, used on real vehicles, and it is also a trade rather than a fix. The lesson puts numbers on both halves.

## The recipe

Design the regulator first, in the ordinary way, to whatever performance the requirements demand: $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ from the control Riccati equation. That is the loop shape you are trying to recover.

Then design the filter with an inflated process noise, added in the direction of the control input:

$$
\mathbf{W}_q = \mathbf{W}_0 + q\,\mathbf{B}\mathbf{B}^\top,
$$

solve the filter Riccati equation for $\boldsymbol{\Sigma}_q$ and $\mathbf{L}_q = \boldsymbol{\Sigma}_q\mathbf{C}^\top\mathbf{V}^{-1}$, and increase $q$ until the margins of the compensated loop are acceptable.

::: key Loop transfer recovery
Deliberately inflate the assumed process noise, $\mathbf{W}_q = \mathbf{W}_0 + q\,\mathbf{B}\mathbf{B}^\top$ with $q$ large, so that the Kalman loop shape approaches the LQR loop shape and the margins come back. The cost is a noisier, more aggressive estimator.
:::

Why that particular direction? Because $\mathbf{B}\mathbf{B}^\top$ is the direction the *control* enters, so a filter designed with it is being told "the largest uncertainty in this plant is an unknown signal added at the actuator". A filter that believes that will track the measurement hard enough to catch such a signal, which is exactly the behaviour that makes its dynamics transparent to the loop. As $q \to \infty$ the filter gain grows without bound and, for a square minimum-phase plant, the compensated loop transfer function converges pointwise to the state-feedback one:

$$
\mathbf{L}_{\text{LQG}}(j\omega) \;\longrightarrow\; \mathbf{K}(j\omega\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} \qquad\text{as } q \to \infty .
$$

The mechanism is that the estimator's own transfer path, $(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_q\mathbf{C})^{-1}\mathbf{L}_q\mathbf{C}$, tends to a left inverse of the plant's measurement path, and the two cancel. That cancellation is the whole trick, and it is also where the technique's limitation lives, because cancelling the plant requires inverting it.

::: example Recovering Doyle's counterexample
The two-state plant $\mathbf{A} = \begin{bmatrix}1&1\\0&1\end{bmatrix}$, $\mathbf{B} = (0,1)^\top$, $\mathbf{C} = [1\ \ 0]$, with the regulator from $\mathbf{Q} = 100\,\mathbf{1}\mathbf{1}^\top$, $R = 1$, giving $\mathbf{K} = (12.198,\ 12.198)$. Its transfer function is $1/(s-1)^2$: square, and with no finite zeros, so minimum phase. Starting from the original Kalman design ($q = 0$, $\mathbf{W}_0 = \mathbf{1}\mathbf{1}^\top$, $V = 1$) and increasing $q$:

| $q$ | $\mathbf{L}_q$ | estimator poles $(\mathrm{s^{-1}})$ | $\min_\omega\lvert 1+L\rvert$ | phase margin | stable gain range |
| --- | --- | --- | --- | --- | --- |
| $0$ | $(4.236,\ 4.236)$ | $-1.618,\ -0.618$ | $0.0190$ | $1.9^\circ$ | $(0.908,\ 1.019)$ |
| $10$ | $(5.104,\ 7.420)$ | $-1.552\pm0.953j$ | $0.0506$ | $5.6^\circ$ | $(0.797,\ 1.053)$ |
| $10^{2}$ | $(6.806,\ 15.86)$ | $-2.403\pm2.068j$ | $0.1080$ | $12.2^\circ$ | $(0.648,\ 1.121)$ |
| $10^{4}$ | $(16.25,\ 115.3)$ | $-7.124\pm7.018j$ | $0.3354$ | $33.7^\circ$ | $(0.369,\ 1.505)$ |
| $10^{6}$ | $(46.76,\ 1045.8)$ | $-22.38\pm22.34j$ | $0.6368$ | $56.5^\circ$ | $(0.236,\ 2.753)$ |
| target (LQR) | — | — | $1.0000$ | $80.6^\circ$ | $(0.164,\ \infty)$ |

Recovery is real and it is slow. Six decades of $q$ take the phase margin from an unflyable $1.9^\circ$ to a respectable $56.5^\circ$, still short of the state-feedback $80.6^\circ$, and take $\min_\omega|1+L|$ from $0.019$ to $0.637$ against a target of $1$. The estimator bandwidth is the price: its poles move from $|{\mu}| = 1$ to $|\mu| = 31.6$, which is $q^{1/4}$ exactly, since the relative degree is two. Each factor of ten in recovery effort costs a factor $10^{1/4} = 1.78$ in estimator bandwidth, and that bandwidth has to be supported by real sensors and a real sample rate.
:::

## What it actually costs

Three things, and only the first is visible in a Bode plot.

**The estimate is no longer optimal.** The filter is being designed against a process noise that does not exist. Its error covariance against the *true* noise is larger than the optimal filter's, and the separation theorem no longer says anything useful, because one of its two halves is deliberately wrong.

**The control gets noisy.** The filter gain $\mathbf{L}_q$ grows like $\sqrt{q}$, and every bit of measurement noise is multiplied by it before reaching the regulator. The control signal picks that up directly.

**The bandwidth leaves the model.** A recovered estimator with poles ten or a hundred times faster than the regulator is looking at frequencies where the rigid-body model is fiction — flexible modes, sensor dynamics, aliasing above the Nyquist frequency of the actual sampling. Recovering margin against a modelling error by extending the loop into a region where the model is worse is a bargain that can go the wrong way.

::: example LTR on the attitude loop, in physical units
The reaction-wheel axis of the previous lesson: $\mathbf{K} = (91.673,\ 150.089)$ at $\omega_n = 0.874\,\mathrm{rad/s}$, true disturbance torque intensity $\mathbf{W}_0 = 4\times10^{-6}\,\mathrm{(N\,m)^2 s}$ entering through $\mathbf{G} = \mathbf{B}$, star tracker at $1$ arcsecond and $10\,\mathrm{Hz}$. Inflating the assumed torque intensity to $(1+q)\mathbf{W}_0$ — which is $\mathbf{W}_0 + q\mathbf{B}\mathbf{B}^\top$ scaled, since the disturbance already enters along $\mathbf{B}$ — and evaluating both the margins and the achieved statistics against the *true* noise:

| $q$ | $\mathbf{L}_q$ | $\omega_e$ (rad/s) | $\min_\omega\lvert1+L\rvert$ | phase margin | upper gain limit | $\sigma_\theta$ | $\sigma_u$ | true cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $(4.66,\ 10.9)$ | $3.30$ | $0.659$ | $44.5^\circ$ | $5.03$ | $3.99''$ | $2.28\,\mathrm{mN\,m}$ | $1.325\times10^{-5}$ |
| $1$ | $(5.55,\ 15.4)$ | $3.92$ | $0.694$ | $46.7^\circ$ | $5.70$ | $3.74''$ | $2.41\,\mathrm{mN\,m}$ | $1.354\times10^{-5}$ |
| $10^{2}$ | $(14.8,\ 109)$ | $10.5$ | $0.854$ | $56.9^\circ$ | $12.9$ | $2.94''$ | $5.39\,\mathrm{mN\,m}$ | $4.813\times10^{-5}$ |
| $10^{4}$ | $(46.6,\ 1087)$ | $33.0$ | $0.949$ | $62.8^\circ$ | $38.4$ | $2.64''$ | $26.7\,\mathrm{mN\,m}$ | $1.113\times10^{-3}$ |
| $10^{6}$ | $(147,\ 10871)$ | $104$ | $0.983$ | $64.9^\circ$ | $119$ | $2.55''$ | $147\,\mathrm{mN\,m}$ | $3.372\times10^{-2}$ |
| perfect state | — | — | $1.000$ | — | $\infty$ | $2.49''$ | $1.93\,\mathrm{mN\,m}$ | $7.817\times10^{-6}$ |

Read the two halves of the table against each other. The margins recover convincingly: $\min_\omega|1+L|$ from $0.659$ to $0.983$, phase margin from $44.5^\circ$ to $64.9^\circ$, and the tolerable actuator over-gain from $5$ to $119$. The pointing even improves slightly, from $3.99$ to $2.55$ arcseconds, approaching the perfect-state floor of $2.49$, because a faster estimator tracks the disturbance better.

And the control effort explodes. $\sigma_u$ rises from $2.28$ to $147\,\mathrm{mN\,m}$ — a factor of $64$ — because the star-tracker noise is being multiplied by an estimator gain that has grown by the same factor. The true average cost, evaluated against the noise that actually exists, rises from $1.325\times10^{-5}$ to $3.372\times10^{-2}$: **$2500$ times worse than the optimal LQG design**, which is exactly what the separation theorem predicts must happen when you deliberately use the wrong filter.

$q = 10^2$ is where a real design would probably sit: phase margin up to $56.9^\circ$, tolerable gain error up by a factor of $2.6$, at the price of a $2.4\times$ increase in control RMS and a factor of $3.6$ in cost. That is a trade an engineer can defend. $q = 10^6$ is not.
:::

## Where recovery fails

The asymptotic argument needs the estimator to approach an inverse of the plant, and a plant with right-half-plane zeros has no stable inverse. Recovery for a non-minimum-phase plant is therefore **partial**: the loop shape converges to the LQR shape multiplied by an all-pass factor built from the reflected zeros, and no amount of $q$ removes it.

::: example Recovery stalls on a plant with a right-half-plane zero
Two second-order plants with the same $\mathbf{A} = \begin{bmatrix}0&1\\-2&-3\end{bmatrix}$ and $\mathbf{B} = (0,1)^\top$, differing only in the output. With $\mathbf{C} = [1\ \ 0]$ the transfer function is $1/(s^2+3s+2)$, minimum phase; with $\mathbf{C} = [1\ \ -1]$ it is $(1-s)/(s^2+3s+2)$, with a zero at $+1$. Each has its own LQR design with $\min_\omega|1+L| = 1$ by construction.

| $q$ | $\min_\omega\lvert1+L\rvert$, minimum phase | $\min_\omega\lvert1+L\rvert$, zero at $+1$ |
| --- | --- | --- |
| $10^{2}$ | $0.768$ | $0.800$ |
| $10^{4}$ | $0.664$ | $0.766$ |
| $10^{6}$ | $0.815$ | $0.762$ |
| $10^{8}$ | $0.930$ | $0.762$ |
| $10^{10}$ | $0.977$ | $0.762$ |

The minimum-phase loop climbs towards $1$ and would get there. The non-minimum-phase loop stops at $0.762$ and stays there through four further decades of $q$: it is not converging slowly, it has converged, to something short of the target. Pushing $q$ beyond that point buys nothing at all and costs everything the previous example listed.
:::

## The dual: recovery at the output

Everything above recovers the loop shape at the plant **input**, which is where actuator errors live. The dual problem — recovering the loop shape at the plant **output**, where sensor and measurement errors live — has the dual recipe: keep the Kalman filter as designed and inflate the *state* weight of the regulator instead,

$$
\mathbf{Q}_\rho = \mathbf{Q}_0 + \rho\,\mathbf{C}^\top\mathbf{C}, \qquad \rho \to \infty,
$$

so that the regulator loop shape approaches the filter's. The conditions and the costs mirror exactly: it needs a square minimum-phase plant, the regulator gain grows without bound, and the closed loop becomes aggressive enough to leave the validity of the model. Which one to use is decided by where the uncertainty is: input recovery for actuator gain, alignment and delay errors; output recovery for sensor errors and for uncertainty seen at the measurement.

::: warning LTR is a knob, not a design method
Three failure modes worth naming. Treating $q$ as "as large as the solver tolerates" produces the last row of the table above — beautiful margins, a controller that amplifies sensor noise by a factor of sixty, and a wheel duty cycle nobody budgeted for. Reporting recovered margins without also reporting the degraded estimator statistics hides half the trade. And using LTR on a non-minimum-phase plant, or on a non-square one, can consume a great deal of tuning effort in pursuit of a limit that does not exist. Before turning the knob, check that the plant is square and minimum phase, decide what margin is actually required, and stop as soon as it is met.
:::

## Check yourself

::: check
Explain why the process-noise inflation is put in the direction $\mathbf{B}\mathbf{B}^\top$ specifically, rather than scaling $\mathbf{W}_0$ uniformly.
:::

::: answer
The goal is to make the loop shape at the plant *input* match the state-feedback loop shape, and the plant input is the $\mathbf{B}$ direction. Telling the filter that a large unknown signal enters at the actuator makes it behave, over the recovery bandwidth, like an inverse of the path from the actuator to the measurement — which is precisely the path that must be cancelled for the estimator to become transparent to that loop. Inflating $\mathbf{W}_0$ uniformly makes the filter fast in every direction, which speeds it up but does not produce the specific cancellation, and for a general $\mathbf{W}_0$ the limit is not the LQR loop. Doyle's counterexample is the sharpest illustration: its process noise $\sigma\mathbf{1}\mathbf{1}^\top$ is *not* in the $\mathbf{B}\mathbf{B}^\top$ direction, and making $\sigma$ large drives the margins to zero rather than recovering them. The same plant with $q\mathbf{B}\mathbf{B}^\top$ recovers, as the first table shows.
:::

::: check
The estimator poles in the Doyle example moved as $q^{1/4}$. Where does the exponent come from, and what would it be for a relative-degree-three plant?
:::

::: answer
The filter is the dual of the regulator, so the estimator poles follow the symmetric root locus of the dual problem with the noise ratio playing the part of $1/\rho$. For a plant of relative degree $n-m$ the runaway poles lie on a circle of radius proportional to (noise ratio)$^{1/(2(n-m))}$, and here the noise ratio is $q/V$, giving $q^{1/(2(n-m))}$. With relative degree two that is $q^{1/4}$, which the table confirms: $q = 10^6$ gives $|\mu| = 31.6 = (10^6)^{1/4}$. For relative degree three it would be $q^{1/6}$, so recovery would be even slower in $q$ but each decade would cost less bandwidth. The poles also arrange themselves in the Butterworth pattern of that order, which is why the recovered estimator in the example sits at damping $0.707$.
:::

::: check
Your LTR design recovers a $60^\circ$ phase margin at $q = 10^{5}$. What three numbers would you put next to that claim in a review?
:::

::: answer
The control signal RMS, the estimator bandwidth, and the cost evaluated against the true noise. In the worked attitude example, the recovered margin at large $q$ came with $\sigma_u$ up by a factor of $64$, an estimator bandwidth of $104\,\mathrm{rad/s}$ against a regulator at $0.874\,\mathrm{rad/s}$, and a true average cost $2500$ times the optimal LQG value. Any one of those can be the thing that kills the design: the control RMS against wheel duty cycle and bearing life, the bandwidth against the first flexible mode and the sample rate, the cost against the pointing budget. A review that sees only the Nyquist plot is being shown the half of the trade that improved.
:::

::: check
A colleague proposes LTR on a lander's altitude loop, whose sensor is a radar with a $200\,\mathrm{ms}$ transport delay. What do you say?
:::

::: answer
That the delay is the problem LTR will make worse. A transport delay is an infinite-dimensional all-pass element, and in any finite-dimensional model it appears as a Padé approximation whose right-half-plane zeros sit near $1/\tau$ — here around $5\,\mathrm{rad/s}$ and up. The plant is therefore non-minimum phase, recovery is partial and will stall, exactly as the second table shows. Worse, LTR works by pushing the estimator bandwidth up, and the delay imposes a hard ceiling on usable bandwidth of roughly $1/\tau$; driving the estimator past it adds phase lag around the loop faster than the recovery removes it, so the margins can get worse rather than better beyond some $q$. The right moves are to model the delay explicitly in the estimator, which a Kalman filter handles cleanly by augmenting the state, to predict forward over the known delay, and to set the loop bandwidth against $1/\tau$ from the start.
:::

::: check
If the true cost gets worse with every increase in $q$, in what sense is LTR an improvement?
:::

::: answer
It improves a quantity the quadratic cost never contained. The LQG cost measures expected performance *against the model you wrote down*: the assumed noise intensities, the assumed plant. LTR trades that away for tolerance to the model being wrong — actuator gain errors, unmodelled lag, misalignment — which the cost functional does not price at all. That is not a contradiction; it is the reason robust control exists as a separate subject. The honest framing for a review is that LQG minimises a nominal performance index, LTR buys robustness by giving some of that index back, and the exchange rate is what the tables in this lesson measure: at $q = 10^2$ on the attitude loop, $12^\circ$ of phase margin for a factor of $3.6$ in nominal cost. If the uncertainty is real, that is a good trade; if the model is genuinely accurate, it is pure loss.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | The observer destroys the LQR return-difference identity and the guaranteed margins |
| Recipe | Design $\mathbf{K}$ normally; design the filter with $\mathbf{W}_q = \mathbf{W}_0 + q\mathbf{B}\mathbf{B}^\top$ and increase $q$ |
| Limit | $\mathbf{L}_{\text{LQG}}(j\omega) \to \mathbf{K}(j\omega\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ for square, minimum-phase plants |
| Mechanism | The estimator path tends to a left inverse of the plant and cancels it |
| Estimator bandwidth | Grows as $q^{1/(2(n-m))}$; $q^{1/4}$ for relative degree two |
| Cost 1 | The estimate is no longer optimal; the true cost rises monotonically with $q$ |
| Cost 2 | $\mathbf{L}_q \sim \sqrt{q}$, so measurement noise reaches the control multiplied by it |
| Cost 3 | The loop extends into frequencies where the model is not valid |
| Doyle example | PM $1.9^\circ \to 56.5^\circ$ over six decades of $q$; estimator poles $1 \to 31.6$ |
| Attitude example | PM $44.5^\circ \to 64.9^\circ$; $\sigma_u \times 64$; true cost $\times 2500$ |
| Non-minimum phase | Recovery is partial: $\min_\omega\lvert1+L\rvert$ stalls at $0.762$ and never improves |
| Dual | Output recovery uses $\mathbf{Q}_\rho = \mathbf{Q}_0 + \rho\mathbf{C}^\top\mathbf{C}$, $\rho \to \infty$ |
| Practice | Check square and minimum phase, set a margin target, stop when it is met |

The next lesson moves the whole subject onto the computer it runs on: sampled measurements, a fixed control cycle, and the discrete Riccati equation.
