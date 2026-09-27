---
id: l05-lqr-margins-and-why-lqg-loses-them
title: The guaranteed margins of LQR, and why LQG loses them
minutes: 22
covers:
  - The guaranteed margins of full-state-feedback LQR and why LQG loses them
---

Picture a bridge rated for ten trucks. You do not plan to drive ten trucks over it. You want to know that if the engineers got the weight of the trucks a bit wrong, the bridge still stands. That extra room is a **margin**. A control loop needs the same thing: the plant model is never exactly right, so you want to know how wrong it can be before the loop goes unstable.

LQR comes with a surprise gift here. Feed back the full state through the LQR gain and — for any positive definite $\mathbf{R}$ and any allowed $\mathbf{Q}$ — the loop keeps working if the actuator is half as strong as modeled, or any amount stronger, or lags by up to sixty degrees. You never asked for that. It falls out of the optimization. It is the single strongest argument for LQR over hand-placed poles, because pole placement promises nothing of the kind.

Then there is the catch. Real flight computers do not have the full state. They have an estimate of it, from sensors and a filter. The moment you feed back the estimate instead — the combination called **LQG**, LQR plus a Kalman filter — the guarantee disappears completely. In 1978 **[[John Doyle|doyle]]** published a paper titled "Guaranteed Margins for LQG Regulators". Its abstract is three words long: "There are none."

This is one of the most common questions in a GNC controls interview: *state the LQR margins, prove them, and say when they do not apply.* The first two parts are a whiteboard exercise. The third is the one that separates candidates. By the end of this lesson you can do all three.

## Where to cut the loop

A margin belongs to a loop, and to measure it you have to cut the loop somewhere. For full state feedback the natural cut is at the **plant input** — the wire between the controller's command and the actuator. Open it, inject a test signal, and follow it all the way round: through the actuator, the plant, the state, the gain, and back to the cut.

The plant is $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ and the controller is $\mathbf{u} = -\mathbf{K}\mathbf{x}$. The trip around the loop from the cut back to the cut is the **[[loop transfer function|loop-cut]]**

$$
\mathbf{L}(s) = \mathbf{K}\,\boldsymbol{\Phi}(s)\,\mathbf{B}, \qquad \boldsymbol{\Phi}(s) = (s\mathbf{I} - \mathbf{A})^{-1}.
$$

Read $\boldsymbol{\Phi}(s)$ as "capital phi of s". It is the transfer function from a push on the state equation to the state. $\mathbf{L}(s)$ is an $m \times m$ matrix of transfer functions — a single transfer function when there is one actuator.

The quantity $\mathbf{I} + \mathbf{L}(s)$ is called the **[[return difference|return-difference-name]]**. It compares what comes back around the loop with what was injected. The **[[Nyquist criterion|nyquist]]** — the classical test for closed-loop stability — is a statement about where $\det(\mathbf{I} + \mathbf{L})$ travels relative to zero. So everything below is about one thing: how far $\mathbf{I} + \mathbf{L}$ stays from being singular (from having determinant zero).

Why cut at the input? Because that is where real errors live. A thruster that delivers $0.8$ of its modeled force, or a gimbal whose effectiveness dropped when chamber pressure dipped, is a multiplier $m$ inserted exactly there, turning $\mathbf{L}$ into $m\mathbf{L}$. A lag — computing delay, actuator dynamics left out of the model — is a factor $e^{-j\omega\tau}$ at the same spot.

## The Kalman return-difference identity

Here is the key fact, in words first. For an LQR loop, the return difference is never smaller than one in size, at any frequency. Now the algebra that proves it. It is a chain of small moves, so take it one step at a time.

**Step 1: rearrange the CARE.** The continuous algebraic Riccati equation says $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}$. Add and subtract $s\mathbf{P}$ on the left to create the factors $(s\mathbf{I} - \mathbf{A})$ we want:

$$
(-s\mathbf{I} - \mathbf{A}^\top)\mathbf{P} + \mathbf{P}(s\mathbf{I} - \mathbf{A}) = -\big(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A}\big) = \mathbf{Q} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}.
$$

The $+s\mathbf{P}$ and $-s\mathbf{P}$ cancel, and the last equality is the CARE.

**Step 2: wrap it.** Multiply on the left by $\mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top$ and on the right by $\boldsymbol{\Phi}(s)\mathbf{B}$, where $\boldsymbol{\Phi}(-s)^\top = (-s\mathbf{I} - \mathbf{A}^\top)^{-1}$. Each factor on the left side meets its own inverse and disappears:

$$
\mathbf{B}^\top\mathbf{P}\boldsymbol{\Phi}(s)\mathbf{B} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{P}\mathbf{B}
= \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B} - \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\boldsymbol{\Phi}(s)\mathbf{B}.
$$

**Step 3: spot the loop.** The LQR gain is $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, so $\mathbf{B}^\top\mathbf{P} = \mathbf{R}\mathbf{K}$. With $\mathbf{L}(s) = \mathbf{K}\boldsymbol{\Phi}(s)\mathbf{B}$:

- the first term is $\mathbf{R}\mathbf{L}(s)$;
- the second is $\mathbf{L}(-s)^\top\mathbf{R}$;
- the last is $\mathbf{L}(-s)^\top\mathbf{R}\mathbf{L}(s)$.

**Step 4: complete the square.** Move the last term to the left and add $\mathbf{R}$ to both sides:

$$
\mathbf{R} + \mathbf{R}\mathbf{L}(s) + \mathbf{L}(-s)^\top\mathbf{R} + \mathbf{L}(-s)^\top\mathbf{R}\mathbf{L}(s)
= \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B}.
$$

The left side factors neatly. This is the **Kalman return-difference identity**:

$$
\big[\mathbf{I} + \mathbf{L}(-s)\big]^\top\mathbf{R}\big[\mathbf{I} + \mathbf{L}(s)\big]
= \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\,\boldsymbol{\Phi}(s)\mathbf{B}.
$$

**Step 5: go to real frequencies.** Set $s = j\omega$, where $\omega$ is a frequency in radians per second. Because $\mathbf{A}$ is real, $\boldsymbol{\Phi}(-j\omega)^\top = \boldsymbol{\Phi}(j\omega)^{*}$, where the star means "transpose and take complex conjugates". Write $\mathbf{G}(j\omega) = \mathbf{Q}^{1/2}\boldsymbol{\Phi}(j\omega)\mathbf{B}$. Then

$$
\big[\mathbf{I} + \mathbf{L}(j\omega)\big]^{*}\mathbf{R}\big[\mathbf{I} + \mathbf{L}(j\omega)\big] = \mathbf{R} + \mathbf{G}(j\omega)^{*}\mathbf{G}(j\omega) \;\succeq\; \mathbf{R}.
$$

The right side is $\mathbf{R}$ plus something that is never negative. For one input, with $\mathbf{R} = r > 0$, it is a statement about a single complex number:

$$
r\,\big|1 + L(j\omega)\big|^2 = r + \big|\mathbf{G}(j\omega)\big|^2 \;\ge\; r
\qquad\Longrightarrow\qquad
\big|1 + L(j\omega)\big| \;\ge\; 1 \quad\text{for every }\omega.
$$

That is the whole result. Everything else is geometry.

## The forbidden disk

$|1 + L(j\omega)|$ is the distance from the point $L(j\omega)$ to the point $-1$. So $|1 + L(j\omega)| \ge 1$ says: the Nyquist plot of $L$ never enters the open **[[disk of radius one centered at −1|forbidden-disk]]**. Three results follow from that picture.

### Gain: from half to infinity

Suppose the actuator is off by a real factor $m > 0$, so $L$ becomes $mL$. Split $1 + mL$ cleverly: $1 + mL = (1-m) + m(1+L)$. The **[[triangle inequality|triangle]]** says the size of a sum is at least the size of one piece minus the size of the other:

$$
|1 + mL| \;\ge\; m\,|1+L| - |1-m| \;\ge\; m - |1-m| = \begin{cases} 2m - 1, & m \le 1\\ 1, & m > 1.\end{cases}
$$

For every $m > \tfrac12$ the right side is positive. So as $m$ slides smoothly away from $1$, the curve $1 + mL(j\omega)$ never passes through zero. The number of Nyquist encirclements cannot change, and the loop stays stable for all $m \in (\tfrac12, \infty)$. In **[[decibels|decibels]]**: **$-6\,\mathrm{dB}$ of gain reduction and unlimited gain increase.**

### Phase: at least sixty degrees

A phase margin is read at a **gain crossover** — a frequency $\omega_c$ where $|L(j\omega_c)| = 1$. There, $L(j\omega_c)$ sits on the unit circle around the origin. It must also stay outside the unit circle around $-1$. Those two circles cross at $L = e^{\pm j2\pi/3}$, which is a phase of $\pm 120^\circ$. So any crossover has $|\angle L(j\omega_c)| \le 120^\circ$, and the phase margin, $180^\circ - |\angle L(j\omega_c)|$, is at least $60^\circ$. **Phase margin $\ge 60^\circ$.**

### A general disk margin

Any loop, LQR or not, can be summed up by one number: its closest approach to $-1$,

$$
\eta = \min_\omega|1 + L(j\omega)| .
$$

Read $\eta$ as "eta". The same two arguments give a safe gain range of $\big(1/(1+\eta),\ 1/(1-\eta)\big)$ and a phase margin of at least $2\arcsin(\eta/2)$. LQR is the case $\eta = 1$, which returns $(1/2,\ \infty)$ and $2\arcsin(0.5) = 60^\circ$. Keep $\eta$ in mind: it is a single number that sums up a loop's robustness, and it is what collapses later in this lesson.

::: key LQR guaranteed margins
Loop broken at the plant input: gain margin from $-6\,\mathrm{dB}$ to $+\infty$, phase margin at least $60^\circ$. It follows from the return-difference identity $|1 + L(j\omega)| \ge 1$.
:::

::: note Why the triangle-inequality step is enough
Stability changes only if a closed-loop pole crosses the imaginary axis. A pole on the axis at $s = j\omega$ means $1 + mL(j\omega) = 0$ for that $m$. The bound shows $|1 + mL(j\omega)| > 0$ at every frequency for every $m > \tfrac12$. So no pole can cross while $m$ moves through that range, and the loop that was stable at $m = 1$ stays stable. The same idea — "you cannot cross a line without touching it" — is behind every margin argument in this course.
:::

::: example Measuring the margins on two vehicles
**Reaction-wheel axis.** $J = 120\,\mathrm{kg\,m^2}$, Bryson weights from the last lesson, $\mathbf{K} = (916.73,\ 522.05)$. Sweep $\omega$ from $10^{-4}$ to $10^{5}\,\mathrm{rad/s}$:

- $\min_\omega|1+L(j\omega)| = 1.000000$, reached in the limit $\omega \to \infty$, where $L \to 0$. The identity is tight at high frequency and has room to spare in the middle — the usual picture, shown in the **[[Nyquist plot for this axis|wheel-nyquist]]**.
- Gain crossover is at $4.650\,\mathrm{rad/s}$, where $\angle L = -110.7^\circ$. So the phase margin is $180 - 110.7 = 69.3^\circ$, comfortably above the guaranteed $60^\circ$.

The gain margin beats the guarantee too. With an input gain $m$, the closed-loop polynomial is $s^2 + (mk_2/J)s + mk_1/J$. Both coefficients are positive for every $m > 0$, so this loop is stable for *any* positive actuator gain, however small. The guarantee is a floor, not a prediction.

**Launch vehicle pitch plane at maximum dynamic pressure.** This is the unstable plant from the first lesson, with open-loop poles at $-0.700$ and $+0.693\,\mathrm{s^{-1}}$, weighted with a $3^\circ$ angle-of-attack budget, a $4^\circ/\mathrm{s}$ rate budget and a $5^\circ$ gimbal budget. The Riccati solution gives $\mathbf{K} = (-1.7314,\ -1.4414)$ and closed-loop poles $-1.343$ and $-8.354\,\mathrm{s^{-1}}$.

- Again $\min_\omega|1+L| = 1.000000$.
- Gain crossover is at $9.715\,\mathrm{rad/s}$ with phase margin $83.0^\circ$.
- Sweeping the input gain numerically finds the loop stable for every $m \in (0.04146,\ \infty)$: $20\log_{10}(0.04146) = -27.6\,\mathrm{dB}$ to $+\infty$.

Notice the lower limit exists here and not on the wheel axis. The rocket is unstable on its own, so it needs *some* minimum amount of control to stay upright.

Both designs beat the guarantee by a wide margin, which is typical. What the guarantee buys you is the right to skip the check in a trade study and still know the answer is not a disaster — worth a great deal when you are sweeping a hundred flight conditions.
:::

## The fine print

The guarantee is precise, and precision cuts both ways.

- **It is at the plant input.** Break the loop at the plant *output* instead and the identity says nothing. With one input and one output the two cuts give the same loop, so the difference bites only on vehicles with several actuators — which is most of them.
- **It assumes the full state is fed back**, measured exactly, with nothing in between $\mathbf{K}$ and $\mathbf{B}$. Every part of that sentence is false on a real vehicle.
- **The multi-input version needs care.** With $\mathbf{R} = \rho\mathbf{I}$ the identity gives $\big[\mathbf{I}+\mathbf{L}\big]^{*}\big[\mathbf{I}+\mathbf{L}\big] \succeq \mathbf{I}$, so $\underline{\sigma}(\mathbf{I}+\mathbf{L}) \ge 1$ — read $\underline{\sigma}$ as "the smallest **[[singular value|singular-value]]**". With a diagonal $\mathbf{R}$, the clean $-6\,\mathrm{dB}$ and $60^\circ$ numbers hold for errors applied **independently in each input channel**. They do not promise the same margins against an arbitrary error that couples the channels together. A per-axis margin claim on a three-axis vehicle with cross-coupling is worth much less than it sounds.
- **It says nothing about dynamics left out of the model.** A flexible mode at $18\,\mathrm{Hz}$ that is not in $\mathbf{A}$ is not covered by any statement about an $\mathbf{L}$ built from $\mathbf{A}$. The margins are margins against errors in the modeled loop.
- **It says nothing about the actuator saturating**, a nonlinear effect the identity cannot see.

## Adding an estimator destroys the identity

Now build what actually flies. Measure $\mathbf{y} = \mathbf{C}\mathbf{x}$, run an **observer** — a model of the plant, running in the computer and corrected by the measurements — and feed back its estimate $\hat{\mathbf{x}}$ ("x hat"):

$$
\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}_f(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}), \qquad \mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}.
$$

Here $\mathbf{L}_f$ is the filter gain — how hard the observer pulls its estimate toward the measurement. (The subscript $f$ keeps it apart from the loop transfer function $\mathbf{L}$.)

Cut at the plant input again and follow the signal. It now passes through the plant, the sensor, the estimator's own dynamics, and only then the gain. The loop transfer function becomes

$$
\mathbf{L}_{\text{LQG}}(s) = \mathbf{K}\big(s\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K} + \mathbf{L}_f\mathbf{C}\big)^{-1}\mathbf{L}_f\,\mathbf{C}\,(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}.
$$

That is not $\mathbf{K}\boldsymbol{\Phi}(s)\mathbf{B}$, and it obeys no identity built from the CARE. The estimator has slipped its own dynamics — its own phase lag — between the measurement and the command.

Notice what has *not* changed. The closed-loop poles are still the regulator poles plus the estimator poles, exactly as the **[[separation principle|separation]]** says. The nominal design is untouched. Only the robustness is gone, and nothing in the nominal analysis shows it.

::: example Doyle's counterexample, computed
Doyle's 1978 plant is the smallest one that makes the point:

$$
\mathbf{A} = \begin{bmatrix}1 & 1\\ 0 & 1\end{bmatrix},\quad
\mathbf{B} = \begin{bmatrix}0\\1\end{bmatrix},\quad
\mathbf{C} = \begin{bmatrix}1 & 0\end{bmatrix},\quad
\mathbf{Q} = q\begin{bmatrix}1&1\\1&1\end{bmatrix},\quad R = 1.
$$

The estimator is a Kalman filter designed for process noise $\mathbf{W} = \sigma\,\mathbf{1}\mathbf{1}^\top$ (with $\mathbf{1} = (1, 1)^\top$, so noise enters along the same direction as the weight) and unit measurement noise. Read $\sigma$ as "sigma". Both Riccati equations have closed-form answers:

$$
\mathbf{K} = (k,\ k),\ \ k = 2 + \sqrt{4+q}; \qquad \mathbf{L}_f = (f,\ f)^\top,\ \ f = 2 + \sqrt{4+\sigma}.
$$

Now insert a scalar gain $m$ at the plant input and find the range of $m$ for which the closed loop stays stable.

**Full state feedback.** $\mathbf{A} - m\mathbf{B}\mathbf{K}$ has determinant $1$ and trace $2 - mk$. A $2\times2$ matrix is stable when its determinant is positive and its trace negative, so the loop is stable exactly for $m > 2/k$, with no upper limit.

**With the estimator** (a four-state closed loop: two plant states, two estimator states), with $q = \sigma$:

| $q = \sigma$ | $k = f$ | full-state stable range | LQG stable range | LQG in dB | $\min_\omega\lvert 1+L_{\text{LQG}}\rvert$ |
| --- | --- | --- | --- | --- | --- |
| $1$ | $4.236$ | $(0.4721,\ \infty)$ | $(0.9208,\ 1.0557)$ | $(-0.72,\ +0.47)$ | $5.28\times10^{-2}$ |
| $10^{2}$ | $12.198$ | $(0.1640,\ \infty)$ | $(0.9381,\ 1.0067)$ | $(-0.56,\ +0.06)$ | $6.68\times10^{-3}$ |
| $10^{4}$ | $102.02$ | $(0.0196,\ \infty)$ | $(0.9905,\ 1.00010)$ | $(-0.083,\ +0.0008)$ | $9.61\times10^{-5}$ |
| $10^{6}$ | $1002.0$ | $(0.0020,\ \infty)$ | $(0.9990,\ 1.000001)$ | $(-0.0086,\ +0.000009)$ | $9.96\times10^{-7}$ |

**Read the last row.** At $q = \sigma = 10^{6}$ the LQG loop tolerates an actuator gain error of about **one part in a thousand** on the weak side, and one part in a million on the strong side, before going unstable. The phase margin at its lower crossover is about $0.0001^\circ$. The very same $\mathbf{K}$, fed the true state, tolerates the actuator being $500$ times too weak ($1/0.0020$) and any amount too strong. The difference is entirely the estimator.

**Read the first row.** Even at $q = \sigma = 1$, with no attempt to make things bad, the LQG margins are $-0.72\,\mathrm{dB}$ and $+0.47\,\mathrm{dB}$ — already unflyable, on a plant where full state feedback gives $20\log_{10}(0.4721) = -6.5\,\mathrm{dB}$ to infinity. The collapse is not a quirk of extreme weights. Extreme weights only make it arbitrarily bad.

**Sanity check.** Every LQG range contains $m = 1$, as it must: the nominal loop is stable, exactly as the separation principle promised.
:::

::: key Guaranteed margins for LQG regulators
There are none. Doyle, *IEEE Transactions on Automatic Control*, 1978. The observer destroys the LQR return-difference identity, so LQG margins can be made arbitrarily small. Always check LQG margins explicitly.
:::

::: warning The separation principle separates the design, not the robustness
The stochastic separation theorem is true and useful: design $\mathbf{K}$ ignoring the estimator, design $\mathbf{L}_f$ ignoring the regulator, and the combination minimizes the expected cost. It is routinely over-read as "the two designs do not interact". That is false for everything except the nominal cost and the nominal pole locations. The loop shape at the plant input depends on both designs together, and so does every margin. A design review that reports the LQR margins of an LQG controller is reporting a number that does not describe the system that flies.
:::

## What you do instead

Three responses, from least effort to most.

**Check.** Compute $\min_\omega|1+\mathbf{L}_{\text{LQG}}(j\omega)|$ — one frequency sweep — and sweep a real gain and a real delay at the plant input across the flight envelope. This takes an afternoon and catches the Doyle failure at once.

**Recover.** **[[Loop transfer recovery|ltr-bridge]]** deliberately detunes the estimator. It inflates the assumed process noise as $\mathbf{W} = \mathbf{W}_0 + \varrho\,\mathbf{B}\mathbf{B}^\top$ with $\varrho$ ("varrho") large, which makes the estimator fast in exactly the right direction, so the LQG loop shape at the input approaches the LQR loop shape. The margins come back as $\varrho$ grows. It is not free, and a later lesson is about exactly what it costs.

**Design for robustness.** If robustness is the requirement, optimize for it directly. The $\mathcal{H}_\infty$ and structured-singular-value methods of the robust control module take a model of the uncertainty as an input, rather than hoping a quadratic cost produces robustness as a side effect.

## Check yourself

::: check
Derive the $60^\circ$ phase margin from $|1+L(j\omega)| \ge 1$, and explain why the bound is exactly $60$ and not some other number.
:::

::: answer
A phase margin is read at a gain crossover, where $|L(j\omega_c)| = 1$. So $L(j\omega_c) = e^{j\phi}$ for some angle $\phi$. The constraint is $|1 + e^{j\phi}| \ge 1$.

Square both sides: $(1+\cos\phi)^2 + \sin^2\phi = 2 + 2\cos\phi \ge 1$. So $\cos\phi \ge -\tfrac12$, which means $|\phi| \le 120^\circ$. The phase margin is $180^\circ - |\phi| \ge 60^\circ$.

Why exactly $60$? The unit circle around the origin and the unit circle around $-1$ have centers one unit apart and radii of one. The two centers and either crossing point form an equilateral triangle — all sides one — so every angle in it is $60^\circ$. That puts the crossings at $\pm120^\circ$, and the margin at $180 - 120 = 60$. The $60^\circ$ comes from the forbidden region having radius exactly one, which in turn comes from the $\mathbf{R}$ on both sides of the identity canceling.
:::

::: check
An LQR design has $\min_\omega|1+L| = 1$. A colleague adds a first-order actuator lag with time constant $0.02\,\mathrm{s}$ that was not in the model, at a loop with gain crossover at $4.65\,\mathrm{rad/s}$. Is the guarantee still good?
:::

::: answer
Start with what the guarantee covers: a pure gain change in $(\tfrac12, \infty)$, *or* a pure phase shift of up to $60^\circ$. A lag $1/(1 + 0.02s)$ is neither — it changes gain and phase together, by an amount that depends on frequency. So the guarantee does not settle the question on its own. It does tell you where to look.

At crossover the lag adds a phase of $\arctan(0.02 \times 4.65) = \arctan(0.093) = 5.3^\circ$ and scales the magnitude by $1/\sqrt{1 + 0.093^2} = 0.996$. Both are tiny compared with the $60^\circ$ and factor-of-two allowances, so you expect the design to survive.

Then confirm it. Adding the lag to the wheel-axis loop ($\mathbf{K} = (916.73,\ 522.05)$) and recomputing gives crossover at $4.63\,\mathrm{rad/s}$, a phase margin of $63.9^\circ$ (down from $69.3^\circ$), and $\min_\omega|1+L| = 0.925$ — no longer exactly one, but still large. The design is fine.

If instead the unmodeled element were a $50\,\mathrm{ms}$ transport delay, the phase at crossover would be $4.65 \times 0.05 = 0.233\,\mathrm{rad} = 13.3^\circ$ — still inside. But a delay keeps adding phase as frequency rises and eventually breaks any loop. So the check must be done at the frequency where the loop gain is actually near one, not at the bandwidth you meant to design.
:::

::: check
Why does the return-difference identity fail for LQG, given that the separation principle says the closed-loop poles are the union of the two designs?
:::

::: answer
Because closed-loop poles and loop shape are different things.

The identity is about $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$, and its proof used the CARE for the *same* $\mathbf{A}$, $\mathbf{B}$ and $\mathbf{K}$ that appear in $\mathbf{L}$. In LQG, the trip around the loop at the plant input also passes through the estimator's dynamics, $\big(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C}\big)^{-1}$, and the measurement matrix. That transfer function satisfies no CARE, so nothing keeps $|1 + L_{\text{LQG}}|$ outside the unit disk — the table in this lesson shows it falling to about $10^{-6}$.

The separation principle is a statement about where the poles are *when the model is exact*. A margin is a statement about what happens *when the model is wrong*. The two questions are unrelated. Every root of the nominal characteristic polynomial can sit exactly where you designed it while the Nyquist plot passes within a millionth of $-1$.
:::

::: check
Doyle's example gets worse as $q$ and $\sigma$ grow together. What are $q$ and $\sigma$ doing physically, and would fixing one of them be enough?
:::

::: answer
Large $q$ makes the regulator aggressive. The state weight $q\,\mathbf{1}\mathbf{1}^\top$ grows, the gain $k = 2 + \sqrt{4+q}$ grows without bound, and the regulator's bandwidth grows with it. Large $\sigma$ makes the estimator aggressive: the assumed process noise $\sigma\mathbf{1}\mathbf{1}^\top$ tells the filter to distrust its model and chase the measurements.

Fixing only one is not enough. The margin is eaten by the mismatch between the regulator's loop shape and the estimator's, and either one alone can create it. For example, with $q = 10^{6}$ and $\sigma$ held at $1$, the loop is stable only for $m$ between about $0.904$ and $1.0002$ — the upside margin is still gone. A fast regulator behind a slow estimator is the classic recipe for phase lag at crossover.

The structured fix is loop transfer recovery. It drives the assumed noise large in one *particular* direction — along $\mathbf{B}$ — so that the estimator's loop shape moves toward the regulator's instead of away from it. Arbitrary large $\sigma$ does not do that. That is exactly why Doyle's choice $\mathbf{W} = \sigma\mathbf{1}\mathbf{1}^\top$, rather than $\sigma\mathbf{B}\mathbf{B}^\top$, makes the counterexample work.
:::

::: check
Your three-axis attitude controller reports $6\,\mathrm{dB}$ and $60^\circ$ margins on each axis from a single-axis analysis. What have you not shown?
:::

::: answer
That the axes do not interact. A per-channel margin is computed by disturbing one input at a time with the others at nominal. For LQR with diagonal $\mathbf{R}$, the guarantee covers independent errors in each channel. But the vehicle can present an error that couples the channels: a misaligned thruster, a wrong inertia cross-product, a gimbal whose two axes are not quite perpendicular.

The right quantity for a coupled error is $\underline{\sigma}(\mathbf{I}+\mathbf{L}(j\omega))$, the smallest singular value. For a general controller it can be far below one at some frequency while each single-axis loop looks healthy.

The other thing not shown is that the margins belong to the *system that flies*. If the controller runs on estimated states, the single-axis analysis of the state-feedback loop is the wrong loop entirely — and Doyle's example is why that matters.
:::

## Summary

| Result | Statement |
| --- | --- |
| Loop at the plant input | $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ |
| Return-difference identity | $[\mathbf{I}+\mathbf{L}(-s)]^\top\mathbf{R}[\mathbf{I}+\mathbf{L}(s)] = \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B}$ |
| Consequence | $\lvert 1 + L(j\omega)\rvert \ge 1$ for all $\omega$; the Nyquist plot avoids the unit disk about $-1$ |
| Gain margin | Stable for every input gain $m \in (1/2, \infty)$: $-6\,\mathrm{dB}$ to $+\infty$ |
| Phase margin | At least $60^\circ$, from $|1+e^{j\phi}| \ge 1 \Rightarrow |\phi| \le 120^\circ$ |
| Disk margin | $\min_\omega|1+L| = \eta$ gives gain range $(1/(1+\eta), 1/(1-\eta))$ and phase $\ge 2\arcsin(\eta/2)$ |
| Scope | Input only; full state feedback only; per channel for diagonal $\mathbf{R}$; nothing about unmodeled dynamics or saturation |
| Measured, wheel axis | $\eta = 1.000$, PM $69.3^\circ$ at $4.65\,\mathrm{rad/s}$, stable for every $m > 0$ |
| Measured, launch vehicle | $\eta = 1.000$, PM $83.0^\circ$ at $9.72\,\mathrm{rad/s}$, gain range $(0.0415, \infty)$ |
| LQG | $\mathbf{L}_{\text{LQG}} = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C})^{-1}\mathbf{L}_f\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$; no identity, no guarantee |
| Doyle 1978 | $q = \sigma = 10^{6}$: LQG stable only for $m \in (0.9990, 1.000001)$, $\eta \approx 10^{-6}$ |
| Practice | Check the margins of the loop that flies; recover them with LTR; or design for robustness |

The margins belong to the infinite-horizon, full-state design. The next lesson goes back to the design itself and asks what changes when the job has a deadline — when the horizon is finite.

::: context doyle A short paper with a long shadow
John C. Doyle was in his twenties when the paper appeared in *IEEE Transactions on Automatic Control* in 1978; he went on to become a professor at Caltech. The paper is barely two pages, and its entire abstract really is "There are none." At the time, many people assumed LQG inherited LQR's comfortable margins. The paper's simple counterexample ended that belief and helped launch the field of **robust control**, which designs for uncertainty on purpose. You will meet that field in the next module.
:::

::: context loop-cut Cutting the loop, drawn
Imagine snipping the wire from the controller to the actuator. A test signal goes in on one side of the cut, travels all the way around, and comes out on the other side. The loop transfer function $\mathbf{L}(s)$ is the ratio between what comes back and what went in (with the loop's minus sign taken out).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="30" width="80" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">plant (A, B)</text>
  <rect x="150" y="100" width="80" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">gain −K</text>
  <line x1="230" y1="48" x2="300" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="48" x2="300" y2="117" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="117" x2="236" y2="117" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,117 238,113 238,121" fill="#1f2a44"/>
  <text x="306" y="86" font-size="12" fill="#1f2a44">state x</text>
  <line x1="150" y1="117" x2="60" y2="117" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="117" x2="60" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="48" x2="92" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="112" y1="48" x2="144" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="150,48 142,44 142,52" fill="#1f2a44"/>
  <line x1="96" y1="36" x2="108" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <text x="102" y="28" font-size="12" text-anchor="middle" fill="#b4232c">cut here</text>
  <text x="128" y="66" font-size="11" text-anchor="middle" fill="#1d6fd1">in</text>
  <text x="76" y="66" font-size="11" text-anchor="middle" fill="#1d6fd1">back</text>
  <text x="102" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">command u</text>
</svg>
```

An actuator that is too weak or too slow is an extra box right at the red cut — which is why the margins are measured there.
:::

::: context return-difference-name Where "return difference" comes from
Inject a signal $\mathbf{d}$ at the cut. What comes back around the loop is $-\mathbf{L}\mathbf{d}$. The *difference* between what you sent and what returned is $\mathbf{d} - (-\mathbf{L}\mathbf{d}) = (\mathbf{I} + \mathbf{L})\mathbf{d}$. That is the return difference, a name from the vacuum-tube amplifier designers at Bell Labs in the 1930s and 1940s, who first studied feedback this way. If it ever becomes zero, the loop can sustain a signal with no input at all — which is what instability is.
:::

::: context nyquist The Nyquist test in one breath
Plot $L(j\omega)$ in the complex plane as $\omega$ runs over all frequencies. The resulting curve is the Nyquist plot. Count how many times it circles the point $-1$. Harry Nyquist showed in 1932 that this count, together with the number of unstable open-loop poles, tells you exactly how many unstable closed-loop poles there are. So the point $-1$ is the danger point: a loop whose curve stays far from it is hard to push into instability.
:::

::: context forbidden-disk Why the crossings are at 120 degrees
The red disk is the region the LQR Nyquist plot can never enter. The grey dashed circle is where $|L| = 1$, so every gain crossover lies on it. The two circles cross where they form an equilateral triangle with the two centers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="220" y1="12" x2="220" y2="208" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="130" cy="110" r="90" fill="#b4232c" fill-opacity="0.12" stroke="#b4232c" stroke-width="2"/>
  <circle cx="220" cy="110" r="90" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="130" cy="110" r="3" fill="#1f2a44"/>
  <circle cx="220" cy="110" r="3" fill="#1f2a44"/>
  <text x="130" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="232" y="128" font-size="12" fill="#1f2a44">0</text>
  <line x1="220" y1="110" x2="175" y2="187.9" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="130" y1="110" x2="175" y2="187.9" stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="3 3"/>
  <circle cx="175" cy="187.9" r="4" fill="#1d6fd1"/>
  <circle cx="175" cy="32.1" r="4" fill="#1d6fd1"/>
  <path d="M190,110 A30,30 0 0,0 205,136" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="150" font-size="12" fill="#1d6fd1">60°</text>
  <text x="60" y="205" font-size="11" fill="#b4232c">forbidden: |1 + L| &lt; 1</text>
  <text x="262" y="44" font-size="11" fill="#6c7a93">|L| = 1</text>
  <text x="120" y="28" font-size="11" fill="#1d6fd1">phase +120°</text>
</svg>
```

At the lower blue dot, $L$ has phase $-120^\circ$: exactly $60^\circ$ away from the negative real axis. Any crossover must lie on the dashed circle outside the red disk, so it is at least that far away.
:::

::: context triangle The triangle inequality
For any two complex numbers, $|a + b| \le |a| + |b|$: going straight is never longer than a detour. Rearranged, it also says $|a + b| \ge |a| - |b|$ — a sum cannot be smaller than one piece minus the other. The lesson uses the second form with $a = m(1+L)$ and $b = 1-m$.
:::

::: context decibels Decibels for gain
Control engineers measure gain ratios in decibels: a gain factor $m$ is $20\log_{10} m$ dB. A factor of $2$ is about $+6\,\mathrm{dB}$, and a factor of $\tfrac12$ is about $-6\,\mathrm{dB}$ ($20\log_{10}0.5 = -6.02$). So "$-6\,\mathrm{dB}$ to $+\infty$" means "the actuator can be anywhere from half as strong to infinitely strong". Aerospace programs typically require at least $6\,\mathrm{dB}$ of gain margin and $30^\circ$ to $45^\circ$ of phase margin, so LQR's guarantee clears common requirements with room to spare.
:::

::: context wheel-nyquist The wheel axis, plotted
Here is $L(j\omega)$ for the reaction-wheel axis for positive frequencies, drawn to scale. It comes in from far away at low frequency, swings around the red disk, and ends at the origin. The blue dot is the gain crossover at $4.65\,\mathrm{rad/s}$, where it meets the dashed circle $|L| = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="62" x2="345" y2="62" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="250" y1="10" x2="250" y2="215" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="205" cy="62" r="45" fill="#b4232c" fill-opacity="0.12" stroke="#b4232c" stroke-width="1.8"/>
  <circle cx="250" cy="62" r="45" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 4"/>
  <polyline points="52.4,210.4 86.4,197.1 114.6,184.9 137.9,173.8 157.2,163.7 173.2,154.6 186.4,146.2 197.3,138.6 206.4,131.7 213.9,125.4 220.1,119.7 225.3,114.5 229.5,109.8 233.1,105.5 236.0,101.5 238.4,98.0 240.4,94.7 242.0,91.8 243.4,89.1 244.5,86.7 245.5,84.4 246.9,80.6 247.9,77.4 248.5,74.7 249.0,72.5 249.3,70.7 249.5,69.2 249.7,68.0 249.8,66.9 249.9,65.7 250.0,64.3 250.0,62.6" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="234.1" cy="102.1" r="4" fill="#1d6fd1"/>
  <circle cx="205" cy="62" r="3" fill="#1f2a44"/>
  <text x="205" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="256" y="56" font-size="11" fill="#1f2a44">0</text>
  <text x="262" y="112" font-size="11" fill="#1d6fd1">crossover, PM 69.3°</text>
  <text x="30" y="180" font-size="11" fill="#1f2a44">low ω</text>
  <text x="262" y="200" font-size="11" fill="#1f2a44">scale: 45 px = 1</text>
</svg>
```

The curve comes closest to the disk only as $\omega \to \infty$, where $L$ shrinks to zero and $|1 + L| \to 1$.
:::

::: context singular-value Singular values in one line
For a matrix, the singular values measure how much it can stretch a vector: the largest is the most stretch in any direction, the smallest is the least. A matrix is singular exactly when its smallest singular value is zero. So $\underline{\sigma}(\mathbf{I}+\mathbf{L}) \ge 1$ says the return difference cannot shrink any input direction below its original size — the multi-input version of "stay out of the disk".
:::

::: context separation A bridge to the LQG lesson
The separation principle says you can design the regulator and the estimator separately, and the closed-loop poles are the two sets of poles side by side. It is a genuinely useful result — it is why LQG can be designed at all in a reasonable afternoon. Lesson 10 of this module works through it. This lesson's job is to make sure you never read more into it than it says.
:::

::: context ltr-bridge Recovery, previewed
Loop transfer recovery is lesson 11 of this module. The short version: the estimator's lag is what eats the margin, so you make the estimator lean hard on measurements in the direction the actuator pushes. As $\varrho$ grows, the LQG loop at the plant input approaches the LQR loop and the margins come back. The price is an estimator that passes more sensor noise through to the actuator.
:::
