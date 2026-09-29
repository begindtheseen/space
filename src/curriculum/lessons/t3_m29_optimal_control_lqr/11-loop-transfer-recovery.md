---
id: l11-loop-transfer-recovery
title: Loop transfer recovery and what it costs
minutes: 20
covers:
  - Loop transfer recovery and what it actually costs
---

Imagine a bike with a trainer who runs alongside and holds the seat. While she holds on, the ride is steady even when you wobble. Now put a delay between your wobble and her reaction — she sees it half a second late. The same trainer, the same bike, and suddenly the ride is shaky. The fix is not a new trainer. It is making her reaction so quick that the delay stops mattering.

Lesson 5 showed that full-state-feedback LQR has excellent margins, and guaranteed ones. Lesson 10 showed that the estimator we need in order to fly it destroys that guarantee. **Loop transfer recovery** — **LTR** — is the standard repair. It works by doing something that sounds wrong: designing the Kalman filter on purpose for a disturbance you know is false.

Here is the reasoning before any algebra. The LQR margins come from the shape of the **[[loop transfer function|loop-shape]]** at the plant input, $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$. The LQG loop at the same point has the estimator's dynamics inside it, so its shape is different. Suppose the estimator could be made so fast, and so trusting of its measurements, that it added no dynamics of its own over the frequencies that matter. Then the LQG loop shape would approach the LQR loop shape, and the margins would come back with it. LTR is the systematic way to push toward that limit, using the one knob the Kalman design offers: the assumed process noise.

It is a real technique, used on real vehicles. It is also a trade, not a fix. This lesson puts numbers on both sides.

## The recipe

First, design the regulator the ordinary way, to whatever performance the requirements demand: $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ from the control Riccati equation. That is the loop shape you are trying to get back.

Then design the filter with an inflated process noise, added in the direction the control enters:

$$
\mathbf{W}_q = \mathbf{W}_0 + q\,\mathbf{B}\mathbf{B}^\top.
$$

Here $\mathbf{W}_0$ is the honest noise model and $q$ is a tuning number you turn up. Solve the filter Riccati equation for $\boldsymbol{\Sigma}_q$, form $\mathbf{L}_q = \boldsymbol{\Sigma}_q\mathbf{C}^\top\mathbf{V}^{-1}$, and raise $q$ until the margins of the compensated loop are good enough.

::: key Loop transfer recovery
Deliberately inflate the assumed process noise, $\mathbf{Q}_{\text{filter}} = \mathbf{Q}_0 + q\,\mathbf{B}\mathbf{B}^\top$ with $q$ large (in this lesson's letters, $\mathbf{W}_q = \mathbf{W}_0 + q\,\mathbf{B}\mathbf{B}^\top$), so that the Kalman loop shape approaches the LQR loop shape and the margins come back. The cost is a noisier, more aggressive estimator.
:::

Why that particular direction? Because $\mathbf{B}\mathbf{B}^\top$ is where the *control* enters. A filter designed with it has been told, "the biggest uncertainty in this plant is an unknown signal added at the actuator." A filter that believes this tracks the measurement hard enough to catch such a signal. That is exactly the behavior that makes its own dynamics invisible to the loop.

As $q \to \infty$ the filter gain grows without limit. For a **square** plant (as many measurements as inputs) that is **[[minimum phase|minimum-phase]]** (no zeros in the right half plane), the compensated loop converges, frequency by frequency, to the state-feedback one:

$$
\mathbf{L}_{\text{LQG}}(j\omega) \;\longrightarrow\; \mathbf{K}(j\omega\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} \qquad\text{as } q \to \infty .
$$

The mechanism: the estimator's own path, $(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_q\mathbf{C})^{-1}\mathbf{L}_q\mathbf{C}$, tends to a **[[left inverse|left-inverse]]** of the plant's path from actuator to measurement, and the two cancel. That cancellation is the whole trick. It is also where the limit lives, because canceling the plant means inverting it.

::: example Recovering Doyle's counterexample
Take lesson 5's plant: $\mathbf{A} = \begin{bmatrix}1&1\\0&1\end{bmatrix}$, $\mathbf{B} = (0,1)^\top$, $\mathbf{C} = [1\ \ 0]$. The regulator comes from $\mathbf{Q} = 100\,\mathbf{1}\mathbf{1}^\top$ and $R = 1$, where $\mathbf{1}$ is the vector of ones. That gives $\mathbf{K} = (12.198,\ 12.198)$. The transfer function is $1/(s-1)^2$: square, and with no finite zeros, so minimum phase.

Start from the original Kalman design ($q = 0$, $\mathbf{W}_0 = \mathbf{1}\mathbf{1}^\top$, $V = 1$) and turn $q$ up. The column $\min_\omega\lvert 1+L\rvert$ is the closest the loop's Nyquist curve comes to the critical point $-1$; LQR guarantees at least $1$. The last column is the range of actuator gain multipliers the loop survives.

| $q$ | $\mathbf{L}_q$ | estimator poles $(\mathrm{s^{-1}})$ | $\min_\omega\lvert 1+L\rvert$ | phase margin | stable gain range |
| --- | --- | --- | --- | --- | --- |
| $0$ | $(4.236,\ 4.236)$ | $-1.618,\ -0.618$ | $0.0190$ | $1.9^\circ$ | $(0.908,\ 1.019)$ |
| $10$ | $(5.104,\ 7.420)$ | $-1.552\pm0.953j$ | $0.0506$ | $5.6^\circ$ | $(0.797,\ 1.053)$ |
| $10^{2}$ | $(6.806,\ 15.86)$ | $-2.403\pm2.068j$ | $0.1080$ | $12.2^\circ$ | $(0.648,\ 1.121)$ |
| $10^{4}$ | $(16.25,\ 115.3)$ | $-7.124\pm7.018j$ | $0.3354$ | $33.7^\circ$ | $(0.369,\ 1.505)$ |
| $10^{6}$ | $(46.76,\ 1045.8)$ | $-22.38\pm22.34j$ | $0.6368$ | $56.5^\circ$ | $(0.235,\ 2.753)$ |
| target (LQR) | — | — | $1.0000$ | $80.6^\circ$ | $(0.164,\ \infty)$ |

Recovery is real, and it is **[[slow|recovery-chart]]**. Six decades of $q$ — a factor of a million — take the phase margin from an unflyable $1.9^\circ$ to a respectable $56.5^\circ$. That is still short of the state-feedback $80.6^\circ$. Meanwhile $\min_\omega|1+L|$ climbs from $0.019$ to $0.637$, against a target of $1$.

The price is estimator speed. The poles' distance from the origin, $|\mu|$, grows from $1$ to $31.6$. That is $q^{1/4}$ exactly: $(10^6)^{1/4} = 31.6$, because the plant's relative degree is two. So each factor of ten in recovery effort costs a factor of $10^{1/4} = 1.78$ in estimator bandwidth — and real sensors and a real sample rate have to support that bandwidth.
:::

## What it actually costs

Three things. Only the first shows up on a Bode plot.

**The estimate is no longer optimal.** The filter is designed against a process noise that does not exist. Measured against the *true* noise, its error covariance is bigger than the optimal filter's. The separation theorem no longer promises anything useful, because one of its two halves is wrong on purpose.

**The control gets noisy.** The filter gain grows with $q$ — its largest entry like $\sqrt{q}$. Every bit of measurement noise is multiplied by that gain before it reaches the regulator, and the control signal picks it up directly.

**The bandwidth leaves the model.** A recovered estimator with poles ten or a hundred times faster than the regulator is looking at frequencies where the rigid-body model is fiction: **[[flexible modes|flexible-modes]]**, sensor dynamics, aliasing above the Nyquist frequency of the real sampling. Recovering margin against modeling error by pushing the loop into a region where the model is *worse* is a bargain that can go the wrong way.

::: example LTR on the attitude loop, in physical units
Use the reaction-wheel axis of lesson 10: $\mathbf{K} = (91.673,\ 150.089)$ at $\omega_n = 0.874\,\mathrm{rad/s}$. The true disturbance torque intensity is $\mathbf{W}_0 = 4\times10^{-6}\,\mathrm{(N\,m)^2 s}$ entering through $\mathbf{G} = \mathbf{B}$. The star tracker gives $1$ arcsecond at $10\,\mathrm{Hz}$.

Because the disturbance already enters along $\mathbf{B}$, inflating along $\mathbf{B}\mathbf{B}^\top$ is the same as scaling the assumed torque intensity up to $(1+q)\mathbf{W}_0$. For each $q$, compute the margins, and then the statistics the loop actually achieves against the *true* noise:

| $q$ | $\mathbf{L}_q$ | $\omega_e$ (rad/s) | $\min_\omega\lvert1+L\rvert$ | phase margin | upper gain limit | $\sigma_\theta$ | $\sigma_u$ | true cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $(4.66,\ 10.9)$ | $3.30$ | $0.659$ | $44.5^\circ$ | $5.03$ | $3.99''$ | $2.28\,\mathrm{mN\,m}$ | $1.325\times10^{-5}$ |
| $1$ | $(5.55,\ 15.4)$ | $3.92$ | $0.694$ | $46.7^\circ$ | $5.70$ | $3.74''$ | $2.41\,\mathrm{mN\,m}$ | $1.354\times10^{-5}$ |
| $10^{2}$ | $(14.8,\ 109)$ | $10.5$ | $0.854$ | $56.8^\circ$ | $12.9$ | $2.94''$ | $5.39\,\mathrm{mN\,m}$ | $4.813\times10^{-5}$ |
| $10^{4}$ | $(46.6,\ 1087)$ | $33.0$ | $0.949$ | $62.7^\circ$ | $38.4$ | $2.64''$ | $26.7\,\mathrm{mN\,m}$ | $1.113\times10^{-3}$ |
| $10^{6}$ | $(147,\ 10871)$ | $104$ | $0.983$ | $64.9^\circ$ | $119$ | $2.55''$ | $147\,\mathrm{mN\,m}$ | $3.371\times10^{-2}$ |
| perfect state | — | — | $1.000$ | — | $\infty$ | $2.49''$ | $1.93\,\mathrm{mN\,m}$ | $7.817\times10^{-6}$ |

(The mark $''$ means arcseconds.) Read the two halves of the table against each other.

**The good half.** The margins recover convincingly. $\min_\omega|1+L|$ goes from $0.659$ to $0.983$. Phase margin goes from $44.5^\circ$ to $64.9^\circ$. The actuator can be too strong by a factor of $119$ instead of $5$. Pointing even improves a little, from $3.99$ to $2.55$ arcseconds, close to the perfect-state floor of $2.49$, because a faster estimator tracks the disturbance better.

**The bad half.** The control effort explodes. $\sigma_u$ rises from $2.28$ to $147\,\mathrm{mN\,m}$ — about $64$ times — because star-tracker noise now reaches the wheel through a much larger filter gain. The true average cost rises from $1.325\times10^{-5}$ to $3.371\times10^{-2}$. That is **about $2500$ times worse than the optimal LQG design**, which is exactly what the separation theorem says must happen when you deliberately use the wrong filter.

Sanity check on the middle row. At $q = 10^2$ the phase margin rises to $56.8^\circ$, about $12^\circ$ more. The tolerable gain error grows by $12.9/5.03 = 2.6$. The price is $5.39/2.28 = 2.4$ times the control RMS and $4.813/1.325 = 3.6$ times the cost. That is a trade an engineer can defend, and it is where a real design would probably sit. $q = 10^6$ is not.
:::

## Where recovery fails

The argument above needs the estimator to approach an *inverse* of the plant. A plant with right-half-plane zeros has no stable inverse — inverting it would turn those zeros into unstable poles. So for a non-minimum-phase plant, recovery is only **partial**. The loop shape converges to the LQR shape multiplied by an **all-pass factor** (a term with magnitude one at every frequency that only adds phase) built from the mirrored zeros. No amount of $q$ removes it.

::: example Recovery stalls on a plant with a right-half-plane zero
Take two second-order plants with the same $\mathbf{A} = \begin{bmatrix}0&1\\-2&-3\end{bmatrix}$ and $\mathbf{B} = (0,1)^\top$. They differ only in the output.

- With $\mathbf{C} = [1\ \ 0]$ the transfer function is $1/(s^2+3s+2)$: minimum phase.
- With $\mathbf{C} = [1\ \ -1]$ it is $(1-s)/(s^2+3s+2)$: a zero at $s = +1$, in the right half plane.

Each gets its own LQR design, with $\mathbf{Q} = 1000\,\mathbf{C}^\top\mathbf{C}$ and $R = 1$, so $\min_\omega|1+L| = 1$ by construction. Each filter starts from $\mathbf{W}_0 = \mathbf{B}\mathbf{B}^\top$ and $V = 1$. Now turn up $q$:

| $q$ | $\min_\omega\lvert1+L\rvert$, minimum phase | $\min_\omega\lvert1+L\rvert$, zero at $+1$ |
| --- | --- | --- |
| $10^{2}$ | $0.766$ | $0.799$ |
| $10^{4}$ | $0.663$ | $0.766$ |
| $10^{6}$ | $0.815$ | $0.762$ |
| $10^{8}$ | $0.931$ | $0.762$ |
| $10^{10}$ | $0.977$ | $0.762$ |

The minimum-phase loop dips first, then climbs toward $1$ and would get there. The non-minimum-phase loop **[[stops at 0.762|stall-chart]]** and stays there through four more decades of $q$. It is not converging slowly. It has converged — to something short of the target. Pushing $q$ past that point buys nothing and costs everything the previous example listed.
:::

## The mirror image: recovery at the output

Everything above recovers the loop shape at the plant **input**, where actuator errors live. The mirror-image problem recovers the loop shape at the plant **output**, where sensor and measurement errors live. Its recipe is the dual one. Keep the Kalman filter as designed, and inflate the *state* weight of the regulator instead:

$$
\mathbf{Q}_\rho = \mathbf{Q}_0 + \rho\,\mathbf{C}^\top\mathbf{C}, \qquad \rho \to \infty,
$$

so the regulator's loop shape approaches the filter's. ($\rho$ is "rho".) The conditions and costs mirror exactly. It needs a square minimum-phase plant. The regulator gain grows without limit. The closed loop becomes aggressive enough to leave the region where the model holds.

Which one to use depends on where the uncertainty is. Use input recovery for actuator gain, alignment and delay errors. Use output recovery for sensor errors and uncertainty seen at the measurement.

::: warning LTR is a knob, not a design method
Three ways it goes wrong.

- Treating $q$ as "as large as the solver allows" gives the last row of the attitude table: beautiful margins, a controller that amplifies sensor noise about sixty-fold, and a wheel **[[duty cycle|wheel-duty]]** nobody budgeted for.
- Reporting recovered margins without the degraded estimator statistics hides half the trade.
- Using LTR on a non-minimum-phase plant, or a non-square one, can burn a lot of tuning effort chasing a limit that does not exist.

Before turning the knob, check that the plant is square and minimum phase. Decide what margin you actually need. Stop as soon as you have it.
:::

## Check yourself

::: check
Explain why the process-noise inflation goes in the direction $\mathbf{B}\mathbf{B}^\top$ specifically, instead of scaling $\mathbf{W}_0$ up evenly.
:::

::: answer
The goal is to make the loop shape at the plant *input* match the state-feedback loop shape, and the plant input is the $\mathbf{B}$ direction. Telling the filter that a large unknown signal enters at the actuator makes it act, over the recovery bandwidth, like an inverse of the path from actuator to measurement. That is exactly the path that must be canceled for the estimator to become invisible to the loop.

Scaling $\mathbf{W}_0$ up evenly makes the filter fast in every direction. That speeds it up but does not produce this particular cancellation, and for a general $\mathbf{W}_0$ the limit is not the LQR loop.

Doyle's counterexample shows it sharply. His process noise, $\sigma\mathbf{1}\mathbf{1}^\top$, is *not* along $\mathbf{B}\mathbf{B}^\top$, and making $\sigma$ large drives the margins to zero instead of recovering them. The same plant with $q\mathbf{B}\mathbf{B}^\top$ recovers, as the first table shows.
:::

::: check
The estimator poles in the Doyle example moved as $q^{1/4}$. Where does the exponent come from, and what would it be for a relative-degree-three plant?
:::

::: answer
The filter is the dual of the regulator, so its poles follow the symmetric root locus of the dual problem, with the noise ratio playing the part of $1/\rho$. For a plant of relative degree $n-m$, the poles that run away lie on a circle whose radius grows like (noise ratio)$^{1/(2(n-m))}$. Here the noise ratio is $q/V$, so the radius grows like $q^{1/(2(n-m))}$.

With relative degree two that is $q^{1/4}$, and the table confirms it: $q = 10^6$ gives $|\mu| = 31.6 = (10^6)^{1/4}$. For relative degree three it would be $q^{1/6}$. Recovery would then be even slower in $q$, but each decade would cost less bandwidth. The poles also arrange themselves in the Butterworth pattern of that order, which is why the recovered estimator in the example sits at damping $0.707$.
:::

::: check
Your LTR design recovers a $60^\circ$ phase margin at $q = 10^{5}$. What three numbers would you put next to that claim in a review?
:::

::: answer
The control signal RMS, the estimator bandwidth, and the cost measured against the true noise.

In the attitude example, the recovered margin at large $q$ came with $\sigma_u$ up about $64$ times, an estimator bandwidth of $104\,\mathrm{rad/s}$ against a regulator at $0.874\,\mathrm{rad/s}$, and a true average cost about $2500$ times the optimal LQG value. Any one of these can kill the design. Check the control RMS against wheel duty cycle and bearing life. Check the bandwidth against the first flexible mode and the sample rate. Check the cost against the pointing budget. A review that sees only the Nyquist plot is being shown the half of the trade that got better.
:::

::: check
A colleague proposes LTR on a lander's altitude loop. Its sensor is a radar with a $200\,\mathrm{ms}$ transport delay. What do you say?
:::

::: answer
That the delay is exactly the problem LTR will make worse.

A transport delay is an all-pass element with infinitely many states. In any finite model it appears as a **[[Padé approximation|pade]]**, and that approximation has right-half-plane zeros at a few times $1/\tau$. With $\tau = 0.2\,\mathrm{s}$, the first-order version puts its zero at $2/\tau = 10\,\mathrm{rad/s}$. So the plant is non-minimum phase, and recovery will be partial and will stall, exactly as the second table shows.

Worse, LTR works by pushing the estimator bandwidth up, and the delay caps useful bandwidth at roughly $1/\tau = 5\,\mathrm{rad/s}$. Push the estimator past that, and it adds phase lag around the loop faster than recovery removes it. Beyond some $q$ the margins can get *worse*.

The right moves: model the delay explicitly in the estimator (a Kalman filter handles this cleanly by adding states), predict forward over the known delay, and set the loop bandwidth against $1/\tau$ from the start.
:::

::: check
If the true cost gets worse with every increase in $q$, in what sense is LTR an improvement?
:::

::: answer
It improves something the quadratic cost never measured. The LQG cost measures average performance *against the model you wrote down*: the assumed noise strengths and the assumed plant. LTR gives some of that up in exchange for tolerance to the model being wrong — actuator gain errors, lag you left out, misalignment. The cost functional does not price any of that.

That is not a contradiction. It is the reason **[[robust control|robust-control]]** exists as its own subject. The honest framing for a review is: LQG minimizes a nominal performance number, LTR buys robustness by handing some of that number back, and the exchange rate is what this lesson's tables measure. At $q = 10^2$ on the attitude loop, you get $12^\circ$ of phase margin for a factor of $3.6$ in nominal cost. If the uncertainty is real, that is a good trade. If the model really is accurate, it is pure loss.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | The observer destroys the LQR return-difference identity and the guaranteed margins |
| Recipe | Design $\mathbf{K}$ normally; design the filter with $\mathbf{W}_q = \mathbf{W}_0 + q\mathbf{B}\mathbf{B}^\top$ and increase $q$ |
| Limit | $\mathbf{L}_{\text{LQG}}(j\omega) \to \mathbf{K}(j\omega\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ for square, minimum-phase plants |
| Mechanism | The estimator path tends to a left inverse of the plant and cancels it |
| Estimator bandwidth | Grows as $q^{1/(2(n-m))}$; $q^{1/4}$ for relative degree two |
| Cost 1 | The estimate is no longer optimal; the true cost rises steadily with $q$ |
| Cost 2 | The filter gain grows (largest entry like $\sqrt{q}$), so measurement noise reaches the control multiplied by it |
| Cost 3 | The loop extends into frequencies where the model is not valid |
| Doyle example | PM $1.9^\circ \to 56.5^\circ$ over six decades of $q$; estimator poles $1 \to 31.6$ |
| Attitude example | PM $44.5^\circ \to 64.9^\circ$; $\sigma_u$ up about $64$ times; true cost up about $2500$ times |
| Non-minimum phase | Recovery is partial: $\min_\omega\lvert1+L\rvert$ stalls at $0.762$ and never improves |
| Dual | Output recovery uses $\mathbf{Q}_\rho = \mathbf{Q}_0 + \rho\mathbf{C}^\top\mathbf{C}$, $\rho \to \infty$ |
| Practice | Check square and minimum phase, set a margin target, stop when it is met |

The next lesson moves the whole subject onto the computer it runs on: sampled measurements, a fixed control cycle, and the discrete Riccati equation.

::: context loop-shape Cutting the loop to test it
To measure a margin, imagine cutting the wire between the controller and the actuator. Inject a wiggle at one frequency, follow it through the plant, the sensor, the filter and the gain, and see what comes back. The ratio — its size and its delay, at every frequency — is the loop transfer function. Its plot is the "loop shape". Two controllers with the same loop shape at the cut have the same margins there, whatever is inside them.
:::

::: context minimum-phase The plant that starts the wrong way
A zero in the right half plane makes a system first move the *wrong* way. Below is the step response of $(1-s)/(s^2+3s+2)$, the plant from the stall example: it dips to $-1/6$ at $t = \ln 1.5 \approx 0.41\,\mathrm{s}$ before rising to its final value of $0.5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="345" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="345" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,110.0 46.2,125.5 52.5,133.6 58.8,136.6 65.0,135.8 71.2,132.5 77.5,127.6 83.8,121.7 90.0,115.2 96.2,108.6 102.5,102.0 108.8,95.6 115.0,89.5 121.2,83.7 127.5,78.4 133.8,73.4 140.0,68.9 146.2,64.8 152.5,61.1 158.8,57.7 165.0,54.7 171.2,51.9 177.5,49.5 183.8,47.3 190.0,45.3 196.2,43.6 202.5,42.0 208.8,40.7 215.0,39.4 221.2,38.4 227.5,37.4 233.8,36.5 240.0,35.8 246.2,35.1 252.5,34.5 258.8,34.0 265.0,33.5 271.2,33.1 277.5,32.8 283.8,32.4 290.0,32.1 296.2,31.9 302.5,31.7 308.8,31.5 315.0,31.3 321.2,31.2 327.5,31.0 333.8,30.9 340.0,30.8"/>
  <text x="34" y="114" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="90" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">1 s</text>
  <text x="190" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">3 s</text>
  <text x="340" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">6 s</text>
  <line x1="90" y1="110" x2="90" y2="115" stroke="#1f2a44"/><line x1="190" y1="110" x2="190" y2="115" stroke="#1f2a44"/>
  <text x="80" y="150" font-size="11" fill="#b4232c">dips first</text>
</svg>
```

No controller can undo that dip without an unstable inverse, which is why recovery stalls.
:::

::: context left-inverse Undoing a machine
A left inverse is a second machine that, placed after the first, gives you back exactly what you put in. If the plant turns a torque into a measured angle, its inverse turns the angle back into the torque. LTR's fast filter learns to act like that inverse, so plant followed by filter is nearly a straight wire — and a straight wire adds no dynamics to the loop.
:::

::: context recovery-chart Phase margin against effort
The Doyle example's phase margin plotted against $\log_{10} q$. Each step right is ten times more inflation; the dashed line is the LQR target of $80.6^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="41" x2="340" y2="41" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="335" y="35" font-size="11" text-anchor="end" fill="#1d6fd1">LQR 80.6°</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="95,161 140,150.5 230,116.1 320,79.6"/>
  <g fill="#b4232c"><circle cx="95" cy="161" r="3.5"/><circle cx="140" cy="150.5" r="3.5"/><circle cx="230" cy="116.1" r="3.5"/><circle cx="320" cy="79.6" r="3.5"/></g>
  <text x="95" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="140" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10²</text>
  <text x="230" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10⁴</text>
  <text x="320" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10⁶</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0°</text>
  <text x="44" y="126" font-size="11" text-anchor="end" fill="#1f2a44">30°</text>
  <text x="44" y="78" font-size="11" text-anchor="end" fill="#1f2a44">60°</text>
  <text x="320" y="72" font-size="11" text-anchor="end" fill="#b4232c">56.5°</text>
  <text x="96" y="152" font-size="11" fill="#b4232c">5.6°</text>
</svg>
```

A million times more assumed noise, and the gap to the target is still $24^\circ$.
:::

::: context flexible-modes When the spacecraft is not rigid
Solar arrays, antennas and long booms bend and wobble like diving boards. Each way of wobbling is a flexible mode with its own frequency, often only a fraction of a hertz to a few hertz on a big spacecraft. The rigid-body model used here ignores them. A controller whose bandwidth reaches up to one of those frequencies can pump energy into the wobble instead of damping it.
:::

::: context stall-chart Two loops, one stuck
The minimum-phase loop (blue) dips and then climbs toward $1$. The loop with the right-half-plane zero (red) flattens at $0.762$ and never moves again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="15" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="340" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">1.0</text>
  <text x="44" y="104" font-size="11" text-anchor="end" fill="#1f2a44">0.8</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0.6</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,113.6 120,154.8 190,94 260,47.6 330,29.2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50,100.4 120,113.6 190,115.2 260,115.2 330,115.2"/>
  <g fill="#1d6fd1"><circle cx="50" cy="113.6" r="3.5"/><circle cx="120" cy="154.8" r="3.5"/><circle cx="190" cy="94" r="3.5"/><circle cx="260" cy="47.6" r="3.5"/><circle cx="330" cy="29.2" r="3.5"/></g>
  <g fill="#b4232c"><circle cx="50" cy="100.4" r="3.5"/><circle cx="120" cy="113.6" r="3.5"/><circle cx="190" cy="115.2" r="3.5"/><circle cx="260" cy="115.2" r="3.5"/><circle cx="330" cy="115.2" r="3.5"/></g>
  <text x="50" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">10²</text>
  <text x="120" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">10⁴</text>
  <text x="190" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">10⁶</text>
  <text x="260" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">10⁸</text>
  <text x="330" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">10¹⁰</text>
  <text x="255" y="135" font-size="11" text-anchor="middle" fill="#b4232c">zero at +1: stuck at 0.762</text>
  <text x="240" y="42" font-size="11" text-anchor="end" fill="#1d6fd1">minimum phase</text>
</svg>
```

Vertical axis is $\min_\omega|1+L|$; horizontal is $q$, one step per hundredfold.
:::

::: context wheel-duty What noisy commands do to a wheel
A reaction wheel is a heavy flywheel on bearings, driven by a motor. Every jittery torque command speeds it up or slows it down a little, heating the motor, drawing power and wearing the bearings. Wheels are rated for a lifetime of such work, and wheel failures from bearing wear have ended or crippled real missions. A controller that feeds sensor noise straight into the wheel spends that lifetime for nothing.
:::

::: context pade Replacing a delay with a fraction
A pure delay, $e^{-s\tau}$, is not a ratio of polynomials, so state-space tools cannot hold it directly. The Padé approximation swaps in a ratio that matches it at low frequency. The simplest is $e^{-s\tau} \approx \dfrac{1 - s\tau/2}{1 + s\tau/2}$. Its zero sits at $s = +2/\tau$ — in the right half plane. That is the model's way of saying a delayed system cannot react until the delay has passed.
:::

::: context robust-control Where this goes next
The next module, on robust and multivariable control, replaces "tune until the margins look good" with methods that design for a stated set of plant errors from the start. John Doyle himself went on to help build two of its main tools, $\mu$-analysis and the state-space solution of $H_\infty$ synthesis.
:::
