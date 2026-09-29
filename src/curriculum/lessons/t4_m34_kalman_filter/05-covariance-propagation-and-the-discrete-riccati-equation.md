---
id: l05-covariance-propagation-and-the-discrete-riccati-equation
title: Covariance propagation and the discrete Riccati equation
minutes: 18
covers:
  - Covariance propagation and the discrete Riccati equation
---

Go back to the dark field from the last lesson. You are counting steps, and every step adds a little doubt: your stride is not exactly one meter, so after a hundred steps you could be several meters off. Now and then a friend with a flashlight calls out where you are, and your doubt shrinks. Here is the surprising part. You could work out, *before you start walking*, how unsure you will be at step fifty — as long as you know how sloppy your stride is, how good your friend's calls are, and when they will come. You do not need to know *what* your friend will shout. How far off you are depends on the shouts. How far off you *expect* to be does not.

A Kalman filter has exactly this split. The state estimate $\hat{\mathbf{x}}_k$ ("x hat sub k") needs the measurement $\mathbf{z}_k$ at every step. But the covariance $\mathbf{P}_k$ — the filter's own record of how unsure it is — never reads the *value* of a measurement. It uses only $\mathbf{H}$ (what the sensor looks at) and $\mathbf{R}$ (how noisy the sensor is). Those are fixed facts about the sensor, not numbers that come off it each cycle.

That split has a sharp consequence. Chain the predict formula and the update formula for $\mathbf{P}$ together, and you get a rule that steps $\mathbf{P}$ forward all on its own. You can run it to the end of the mission before a single measurement exists. This lesson writes that rule down and gives it its name — it is a **discrete matrix Riccati equation**, an update rule for the covariance alone — and shows what having it buys you. It is why a flight computer can carry a ready-made table of gains instead of inverting a matrix in real time. It is why engineers can argue about a navigation system's accuracy before it flies. And it is what lets the next lesson ask a question that would make no sense otherwise: where does this rule end up if you run it forever?

## Uncertainty while coasting

Start with the simpler case: no updates at all, only predict steps, one after another. The filter is **coasting** — running on its model alone. This happens all the time on real vehicles: a missed measurement, a GPS signal blocked for a few seconds, or the gap between two star-tracker readings on a spacecraft.

Recall the pieces. $\mathbf{F}$ is the **state transition matrix**: it carries the state one step forward in time. $\mathbf{Q}$ is the **process noise covariance**: the extra uncertainty each step adds because the model is not perfect. The predict step for the covariance is

$$
\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$

In words: carry the old uncertainty forward through the dynamics, then add the new doubt. Now do it twice in a row, starting from $\mathbf{P}_0$:

$$
\mathbf{P}_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}, \qquad
\mathbf{P}_2 = \mathbf{F}\mathbf{P}_1\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$

The second line put the whole first line in place of $\mathbf{P}_1$ and multiplied out. ($\mathbf{F}^2$, read "F squared", means $\mathbf{F}\mathbf{F}$: two steps of the dynamics.) Keep going and a pattern appears. The starting uncertainty is carried through all $N$ steps. Each step's fresh noise $\mathbf{Q}$ is carried through however many steps are left after it.

::: key N-step covariance propagation with no updates
$$
\mathbf{P}_N = \mathbf{F}^N\mathbf{P}_0(\mathbf{F}^N)^{\mathsf{T}} + \sum_{j=0}^{N-1}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}}.
$$
The first term is the probability module's rule for pushing a covariance through a linear map, applied to the $N$-step transition $\mathbf{F}^N$. The sum is every step's process noise, each carried forward through the steps that remain until step $N$.
:::

The big $\Sigma$ ("sigma", the summation sign) means "add up this expression for $j = 0, 1, \ldots, N-1$". The term with $j = 0$ is plain $\mathbf{Q}$ — the newest noise, added in the very last step, which has had no time to spread. The term with $j = N-1$ is the oldest noise, carried through the most dynamics.

::: note Why it has to be true
This is a proof by **[[induction|induction]]**. The formula is true for $N = 1$: the sum has one term, $\mathbf{F}^0\mathbf{Q}(\mathbf{F}^0)^{\mathsf{T}} = \mathbf{Q}$, so it reads $\mathbf{P}_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Now suppose it is true for some $N$, and apply one more predict step:

$$
\mathbf{P}_{N+1} = \mathbf{F}\mathbf{P}_N\mathbf{F}^{\mathsf{T}} + \mathbf{Q}
= \mathbf{F}^{N+1}\mathbf{P}_0(\mathbf{F}^{N+1})^{\mathsf{T}} + \sum_{j=0}^{N-1}\mathbf{F}^{j+1}\mathbf{Q}(\mathbf{F}^{j+1})^{\mathsf{T}} + \mathbf{Q}.
$$

The outer $\mathbf{F}$ joined each $\mathbf{F}^j$ on the left to make $\mathbf{F}^{j+1}$. On the right, the outer $\mathbf{F}^{\mathsf{T}}$ joined each transpose, using the rule $(\mathbf{F}^j)^{\mathsf{T}}\mathbf{F}^{\mathsf{T}} = (\mathbf{F}\mathbf{F}^j)^{\mathsf{T}} = (\mathbf{F}^{j+1})^{\mathsf{T}}$. The sum now runs over powers $1$ to $N$, and the lone $\mathbf{Q}$ is the power-$0$ term. Together that is the formula for $N + 1$. True for $1$, and true for the next number whenever true for one, so true for all.
:::

::: example A five-step coast, done two ways
Use the descending-booster model from the last two lessons. The state is position and velocity, the time step is $0.1\,\mathrm{s}$, and

$$
\mathbf{F} = \begin{pmatrix}1 & 0.1\\0&1\end{pmatrix}, \qquad
\mathbf{Q} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 0.05\end{pmatrix}, \qquad
\mathbf{P}_0 = \operatorname{diag}(100,\ 25).
$$

**Way one: step it five times.** Running the predict step five times in a row gives

$$
\mathbf{P}_5 = \begin{pmatrix}106.271 & 12.563\\ 12.563 & 25.250\end{pmatrix}.
$$

**Way two: the closed form.** Five steps of $0.1\,\mathrm{s}$ are one step of $0.5\,\mathrm{s}$, so $\mathbf{F}^5 = \begin{pmatrix}1 & 0.5\\0&1\end{pmatrix}$. Carrying $\mathbf{P}_0$ through it:

$$
\mathbf{F}^5\mathbf{P}_0(\mathbf{F}^5)^{\mathsf{T}} = \begin{pmatrix}100 + 0.5^2 \times 25 & 0.5 \times 25\\ 0.5 \times 25 & 25\end{pmatrix} = \begin{pmatrix}106.25 & 12.5\\ 12.5 & 25\end{pmatrix}.
$$

The five-term noise sum comes out as

$$
\sum_{j=0}^{4}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}} = \begin{pmatrix}0.02083 & 0.0625\\ 0.0625 & 0.25\end{pmatrix}.
$$

Add the two: $106.25 + 0.02083 = 106.271$, $12.5 + 0.0625 = 12.563$ (rounded), and $25 + 0.25 = 25.25$. That is the same matrix. A computer doing both ways agrees to within about $3\times10^{-14}$ — pure **[[round-off|round-off]]**.

**Sense check.** Position uncertainty grew only a little, from $100$ to about $106\,\mathrm{m^2}$. That is right: velocity doubt of $5\,\mathrm{m/s}$ over half a second adds about $2.5\,\mathrm{m}$ of position doubt, and $2.5^2 = 6.25\,\mathrm{m^2}$. Notice too the new off-diagonal entry, $12.563$. Coasting links position error to velocity error: go too fast, and you end up too far.
:::

The noise sum is the same fact the stochastic-model lesson noticed in passing — a hundred $0.1\,\mathrm{s}$ steps compose into one $10\,\mathrm{s}$ step. Here it is written as a rule for *any* linear model. For this constant-velocity model the sum even equals the one-step $\mathbf{Q}$ for a $0.5\,\mathrm{s}$ step, because that $\mathbf{Q}$ was built exactly for the model.

## Two steps, one recursion

Now put the updates back in. Each cycle has two moves for the covariance:

1. **Update**, when measurement $k$ arrives: $\mathbf{P}_k^+ = \mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R})^{-1}\mathbf{H}\mathbf{P}_k^-$. This is the update from the predict-and-update lesson, with the gain written out in full.
2. **Predict**, to the next step: $\mathbf{P}_{k+1}^- = \mathbf{F}\mathbf{P}_k^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$.

Put the first line into the second, in place of $\mathbf{P}_k^+$. The in-between covariance disappears, and one formula carries $\mathbf{P}_k^-$ straight to $\mathbf{P}_{k+1}^-$.

::: key The discrete-time Riccati equation
$$
\mathbf{P}_{k+1}^- = \mathbf{F}\Big(\mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\big(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\big)^{-1}\mathbf{H}\mathbf{P}_k^-\Big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$
One step of this equation is exactly one update followed by one predict, with $\mathbf{P}_k^+$ eliminated. It maps a covariance to the next one using only $\mathbf{F}$, $\mathbf{H}$, $\mathbf{Q}$ and $\mathbf{R}$ — never $\mathbf{z}$.
:::

### Where the name comes from

Look at the shape of the right side. There is a part that is linear in $\mathbf{P}_k^-$ (the first $\mathbf{P}_k^-$ inside the big brackets). There is a part where $\mathbf{P}_k^-$ appears *twice*, multiplied by itself — the subtracted piece. And there is a constant, $\mathbf{Q}$. An equation built from "linear plus squared plus constant" is called a **[[Riccati equation|riccati-name]]**, after an eighteenth-century mathematician who studied the one-number version.

The one-number version makes the shape easy to see. With $F = 1$ and $H = 1$, the equation becomes

$$
P_{k+1}^- = P_k^- - \frac{(P_k^-)^2}{P_k^- + R} + Q.
$$

The squared term, divided by $P_k^- + R$, is the amount the update takes away.

### The same equation in optimal control

The same shape shows up in a second place. The optimal-control module designs the best feedback controller, the **linear-quadratic regulator** or LQR, by solving a Riccati equation too. In control notation the dynamics matrix is $\mathbf{A}$ (our $\mathbf{F}$), the sensor matrix is $\mathbf{C}$ (our $\mathbf{H}$), and the input matrix is $\mathbf{B}$. Take the LQR equation, put $\mathbf{A}^{\mathsf{T}}$ where $\mathbf{A}$ was and $\mathbf{C}^{\mathsf{T}}$ where $\mathbf{B}$ was, and let the noise covariances $\mathbf{Q}$ and $\mathbf{R}$ take the places of the cost weights on state and control. You get the filter's equation.

::: key The covariance recursion is a Riccati equation
$\mathbf{P}_{k+1}^- = \mathbf{F}\big(\mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}\mathbf{H}\mathbf{P}_k^-\big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Its steady state is the **[[dual|duality]]** of the LQR discrete algebraic Riccati equation (DARE) — the same equation with $\mathbf{A}^{\mathsf{T}}$, $\mathbf{C}^{\mathsf{T}}$, $\mathbf{Q}$ and $\mathbf{R}$ exchanged.
:::

This lesson does not need the control side to be complete. It is a fact worth keeping in your pocket: estimation looks backward, from data to state; control looks forward, from state to action. The identical equation behind both is the cleanest evidence that they are, in structure, the same problem run in opposite directions.

### What the equation never looks at

Nothing in the Riccati equation mentions $\hat{\mathbf{x}}$ or $\mathbf{z}$. That is the whole point of writing it on its own. The list $\mathbf{P}_1^-, \mathbf{P}_2^-, \mathbf{P}_3^-, \ldots$ is a fixed sequence of matrices. It is set completely by $\mathbf{F}$, $\mathbf{Q}$, $\mathbf{H}$, $\mathbf{R}$ and the starting $\mathbf{P}_0$. So is the list of gains $\mathbf{K}_1, \mathbf{K}_2, \ldots$, because each gain is built from $\mathbf{P}_k^-$ alone. Two vehicles with the same model, flying through completely different measurements, carry the identical sequence of gains.

::: example The gain does not know what you are about to measure
Run the descending-booster filter twice. Both runs start from the same $\mathbf{P}_0^+ = \operatorname{diag}(100, 25)$. But each uses a different **[[random seed|random-seed]]**, so the two simulated flights differ, and so do the noisy altimeter readings. After four steps:

| Quantity | Seed 1 | Seed 2 |
| --- | --- | --- |
| $\hat{x}_4^+$ (position, m) | $2473.77$ | $2473.24$ |
| $\mathbf{K}_4$ | $(0.35735,\ 0.72104)^{\mathsf{T}}$ | $(0.35735,\ 0.72104)^{\mathsf{T}}$ |
| $\operatorname{diag}(\mathbf{P}_4^-)$ | $(2.22427,\ 22.2070)$ | $(2.22427,\ 22.2070)$ |

**The estimates differ,** by about half a meter, as they must — different data should give different answers.

**The gains and covariances agree to every digit.** Run the comparison in full double precision and the largest difference in any gain over six steps is exactly $0.0$ — not small, zero. Both runs compute the identical numbers by identical arithmetic, because neither the Riccati equation nor the gain built from it ever looks at $\mathbf{z}$.

**Sense check.** This is why the last two lessons could quote $\mathbf{P}_k^-$ and $\mathbf{K}_k$ for this model as *the* answer, not one random sample among many. They are not samples.
:::

```python
import numpy as np

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])

def fly(seed, steps=6):
    """Simulate one flight and filter it. Return estimates, gains, P-minus."""
    rng = np.random.default_rng(seed)
    x_true = np.array([2500.0, -70.0])
    x, P = np.array([2400.0, -60.0]), np.diag([100.0, 25.0])
    xs, Ks, Ps = [], [], []
    for _ in range(steps):
        x_true = F @ x_true + rng.multivariate_normal([0.0, 0.0], Q)
        z = H @ x_true + rng.normal(0.0, 2.0)
        x, P = F @ x, F @ P @ F.T + Q                   # predict
        Ps.append(P.copy())
        K = P @ H.T @ np.linalg.inv(H @ P @ H.T + R)    # gain
        x = x + K @ (z - H @ x)                         # update
        P = P - K @ H @ P
        xs.append(x[0]); Ks.append(K.ravel())
    return np.array(xs), np.array(Ks), np.array(Ps)

xa, Ka, Pa = fly(seed=1)
xb, Kb, Pb = fly(seed=2)
print("x4+ :", xa[3].round(2), xb[3].round(2))
print("K4  :", Ka[3].round(5), Kb[3].round(5))
print("P4- diag:", np.diag(Pa[3]).round(4))
print("largest gain difference:", np.abs(Ka - Kb).max())
# x4+ : 2473.77 2473.24
# K4  : [0.35735 0.72104] [0.35735 0.72104]
# P4- diag: [ 2.2243 22.207 ]
# largest gain difference: 0.0
```

## What the data-independence buys you

Three payoffs follow, and each is ordinary GNC practice, not a mathematical curiosity.

**A gain table instead of a matrix inverse.** Solve the Riccati equation once, on the ground, for as many steps as the mission needs. Store $\mathbf{K}_1, \mathbf{K}_2, \ldots$ as a **[[gain schedule|gain-schedule]]** — a table indexed by step. The flight software then looks up a gain instead of inverting $\mathbf{S}_k$ every cycle. That matters on a small flight computer, where an inverse is expensive, and where the inverse itself is a source of numerical trouble (the numerically-stable-forms lesson later in this module deals with that directly).

**Knowing the accuracy before flight.** Because $\mathbf{P}_k^-$ is known in advance, so is the filter's expected accuracy at every point in the mission. This is how a navigation **[[error budget|error-budget]]** is built and defended before a vehicle flies: a covariance analysis, run entirely in a script, against the planned sensors and trajectory.

**Asking where it ends up.** The sequence $\mathbf{P}_1^-, \mathbf{P}_2^-, \ldots$ is completely fixed. So it makes sense to ask what it *converges to* — settles down to — and whether it settles at all. That is a question about one fixed recursion, not about a crowd of random outcomes, and it is the subject of the steady-state lesson.

::: warning Data-independent is not the same as correct
$\mathbf{P}_k^-$ ignoring $\mathbf{z}_k$ is a mathematical fact about the linear-Gaussian model. It is *not* a promise that the reported $\mathbf{P}_k^-$ is right. A filter with a wrong $\mathbf{Q}$ or $\mathbf{R}$ still produces a perfectly well-defined, perfectly data-independent sequence of covariances. It is the wrong sequence, computed with complete internal consistency from wrong assumptions.

A gain table made on the ground tells you only what the filter will *believe*. Whether the belief matches reality is what the consistency-testing lesson later in this module checks — and that check needs real data.
:::

## Check yourself

::: check
Explain, without further calculation, why $\mathbf{P}_k^-$ can be computed in full before a mission flies, while $\hat{\mathbf{x}}_k^-$ cannot.
:::

::: answer
$\mathbf{P}_k^-$ comes entirely from the Riccati equation. Its inputs are $\mathbf{F}$, $\mathbf{Q}$, $\mathbf{H}$, $\mathbf{R}$ and $\mathbf{P}_0$ — facts about the model and the sensors, all fixed and known before flight.

$\hat{\mathbf{x}}_k^-$ also needs every innovation $\boldsymbol{\nu}_1, \ldots, \boldsymbol{\nu}_{k-1}$ (read "nu"). An innovation is $\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$, the gap between a reading and its prediction, and it needs the actual reading $\mathbf{z}$ — a number that does not exist until the sensor produces it in flight. The covariance update and the estimate update share the same gain $\mathbf{K}_k$, but only the estimate update consumes data.
:::

::: check
After a flight, you discover the filter's $\mathbf{Q}$ was off by a factor of two from the true process noise. What happens to the precomputed table of $\mathbf{P}_k^-$ values, and what does not happen to it?
:::

::: answer
**What does not happen:** the table does not become "wrong arithmetic". It still reports exactly what the Riccati equation produces for the $\mathbf{Q}$ that was used. The equation is deterministic given its inputs, and a wrong input does not break that.

**What does happen:** the table no longer describes reality. The true error covariance of the estimate is something else, because the table was never a measurement of the filter's actual performance — only a forward calculation from assumed statistics. Closing that gap is the job of the process-noise-tuning lesson and the consistency-testing lesson later in this module.
:::

::: check
Derive the two-step coasting formula, $\mathbf{P}_2 = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, from the one-step predict formula. Which term is the noise added during step $1$, and which during step $2$?
:::

::: answer
Apply the predict step twice. First $\mathbf{P}_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Then put that into the second step:

$$
\mathbf{P}_2 = \mathbf{F}\mathbf{P}_1\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}(\mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q})\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$

The last term, plain $\mathbf{Q}$, is the noise added during step $2$. It has had no time to pass through any more dynamics. The middle term, $\mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}}$, is the noise added during step $1$, carried forward through one more $\mathbf{F}$. Older noise has had more time to spread through the state — exactly the pattern the $N$-step sum generalizes.
:::

::: check
Two different sensors, with different $\mathbf{H}$ and $\mathbf{R}$, are proposed for the same vehicle and the same dynamics model. Without running either filter on real data, how would you compare them? What would the comparison *not* tell you?
:::

::: answer
Run the Riccati equation for each candidate $(\mathbf{H}, \mathbf{R})$ with the same $\mathbf{F}$, $\mathbf{Q}$ and $\mathbf{P}_0$, and compare the two $\mathbf{P}_k^-$ sequences. The smaller covariance — measured by its trace (the sum of its diagonal), or along whichever direction matters for the mission — marks the better sensor for this model. No flight data and no simulated noise are needed, only the recursion.

What it cannot tell you: whether either sensor will really perform as its $\mathbf{R}$ claims, whether $\mathbf{Q}$ correctly captures the true unmodelled dynamics, and whether the geometry stays observable all mission long. Those are all questions about whether the model matches reality. A covariance-only analysis assumes them; it does not test them.
:::

::: check
A one-number filter has $F = 1$, $H = 1$, $Q = 0.2$ and $R = 1$, and its first predicted variance is $P_1^- = 25.2$. Use the one-number Riccati equation to find $P_2^-$. Then say what the update did and what the predict did.
:::

::: answer
The one-number equation is $P_{k+1}^- = P_k^- - (P_k^-)^2/(P_k^- + R) + Q$. Put in the numbers:

$$
P_2^- = 25.2 - \frac{25.2^2}{25.2 + 1} + 0.2 = 25.2 - \frac{635.04}{26.2} + 0.2 \approx 25.2 - 24.238 + 0.2 \approx 1.162.
$$

The update took the variance from $25.2$ down to about $0.962$ — the gain was $25.2/26.2 \approx 0.962$, so only $1 - 0.962$ of the doubt survived. The predict then added $Q = 0.2$, giving about $1.162$. These match the sawtooth example in the predict-and-update lesson, found there one step at a time and here in one formula.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Coasting | $\mathbf{P}_N = \mathbf{F}^N\mathbf{P}_0(\mathbf{F}^N)^{\mathsf{T}} + \sum_{j=0}^{N-1}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}}$ with no updates; uncertainty only grows |
| Discrete Riccati equation | $\mathbf{P}_{k+1}^- = \mathbf{F}\big(\mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R})^{-1}\mathbf{H}\mathbf{P}_k^-\big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$: update and predict in one map |
| Data independence | $\mathbf{P}_k^-$ and $\mathbf{K}_k$ depend only on $\mathbf{F}$, $\mathbf{Q}$, $\mathbf{H}$, $\mathbf{R}$, $\mathbf{P}_0$ — never on $\mathbf{z}$ |
| Uses | gain tables; pre-flight covariance analysis and error budgets; asking whether the sequence converges |
| Duality | steady state is the dual of the LQR DARE: same equation with $\mathbf{A}^{\mathsf{T}}$, $\mathbf{C}^{\mathsf{T}}$, and $\mathbf{Q}$, $\mathbf{R}$ exchanged |
| Caution | data-independent does not mean correct: a wrong $\mathbf{Q}$ or $\mathbf{R}$ gives a confident, wrong table |

Two things are worth carrying forward. Left alone with no updates, the covariance only grows — the five-step coast climbed from $\operatorname{diag}(100, 25)$ and would keep climbing as long as it coasted. Fed a steady stream of updates, the Riccati run instead *fell*, sharply at first and then more slowly. Does that slowdown mean it has nearly arrived, or only that it is still falling, more gently? That deserves its own lesson — and it comes right after a detour through the one quantity this lesson treated as fixed scenery, $\mathbf{Q}$, and what happens when it is wrong.

::: context induction Climbing a ladder, one rung at a time
**Proof by induction** shows something is true for every whole number without checking them all. You show two things. First, it is true for the first case — you can stand on the bottom rung. Second, whenever it is true for one case, it is also true for the next — from any rung you can reach the one above. Put together, you can reach every rung. The coasting formula uses exactly this: true for one step, and one more predict step always turns the $N$-step formula into the $N+1$-step one.
:::

::: context round-off Why a computer is off by a hair
A computer stores most numbers in **floating point**, with about 16 significant digits. A number like $0.1$ cannot be stored exactly in binary, in the same way that $1/3$ cannot be written exactly in decimal. Each multiplication or addition rounds the result to the nearest number the computer can hold. Two different routes to the same answer round at different places, so they can disagree in the last digit or two. A gap of $3\times10^{-14}$ on numbers near $100$ is about that size: the two answers are equal as far as a computer can tell.
:::

::: context riccati-name Who Riccati was
Jacopo Riccati was an Italian mathematician of the early 1700s. He studied equations in which the rate of change of a quantity depends on the quantity, its square, and a constant — like $\dot{p} = a + bp + cp^2$. Equations of that shape now carry his name. The continuous-time Kalman filter (the Kalman–Bucy filter) has a covariance that obeys a matrix version of exactly that differential equation. The discrete filter in this lesson steps from one sample to the next instead, but it keeps the family resemblance: a linear part, a part with $\mathbf{P}$ times $\mathbf{P}$, and a constant.
:::

::: context duality One equation, two problems
The filter's covariance equation and the LQR controller's cost equation are mirror images. Swap each matrix for its partner and one turns into the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="140" height="30" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="210" y="10" width="140" height="30" rx="6" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="80" y="30" font-size="13" fill="#1f2a44" text-anchor="middle">Kalman filter</text>
  <text x="280" y="30" font-size="13" fill="#1f2a44" text-anchor="middle">LQR controller</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="68">F</text><text x="280" y="68">Aᵀ</text>
    <text x="80" y="94">H</text><text x="280" y="94">Bᵀ</text>
    <text x="80" y="120">Q: process noise</text><text x="280" y="120">Q: state cost</text>
    <text x="80" y="146">R: sensor noise</text><text x="280" y="146">R: control cost</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="150" y1="64" x2="210" y2="64"/><line x1="150" y1="90" x2="210" y2="90"/>
    <line x1="150" y1="116" x2="210" y2="116"/><line x1="150" y1="142" x2="210" y2="142"/>
  </g>
</svg>
```

The filter's version runs forward in time from the first measurement. The controller's runs backward from the end of the mission. The steady-state lesson solves the filter's version with the same software routine control engineers use for LQR.
:::

::: context random-seed Why two runs with different seeds differ
A computer's "random" numbers come from a formula that starts from a number called the **seed**. The same seed always gives the same list of "random" numbers, which makes a simulation repeatable. A different seed gives a different list: a different simulated flight, different sensor noise, different estimates.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,30 C100,58 180,62 340,64 L340,106 C180,104 100,108 20,130 Z" fill="#8fb8f0" opacity="0.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20,70 60,86 100,80 140,90 180,82 220,88 260,80 300,86 340,84"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="20,92 60,76 100,90 140,78 180,92 220,80 260,90 300,82 340,90"/>
  <text x="20" y="18" font-size="11" fill="#1f2a44">shared ±σ band from the Riccati equation</text>
  <text x="20" y="146" font-size="11" fill="#1d6fd1">seed 1 estimate</text>
  <text x="200" y="146" font-size="11" fill="#b4232c">seed 2 estimate</text>
</svg>
```

The two estimate tracks wander differently, but the uncertainty band around them — narrowing as measurements come in — is identical, because it is computed without the readings.
:::

::: context gain-schedule Constant gains in real trackers
A stored gain table is common in small embedded filters. The extreme case is a single constant gain, used once the table has settled. Radar trackers have long used the **alpha-beta filter**: it corrects position by a fixed fraction $\alpha$ of each surprise and velocity by a fixed fraction $\beta$ divided by the time step. For the constant-velocity model of this lesson, that is a Kalman filter frozen at its steady-state gain — a lookup table with one row.
:::

::: context error-budget Adding up where the error comes from
An **error budget** lists every source of navigation error — sensor noise, sensor bias, model error, timing — and how much each adds to the final uncertainty, like a household budget lists where the money goes. Because the Riccati equation needs no data, engineers can switch sources on and off in a script and see each one's share. Mission designers run this kind of covariance analysis long before launch to decide which sensors to buy and whether a landing or orbit-insertion accuracy target can be met at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="20" width="120" height="150" fill="#8fb8f0" opacity="0.4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,133.1 72,101.9 72,150.6 104,119.5 104,156.9 136,125.7 136,159.3 168,128.2 200,97.1 232,65.9 264,34.8 264,132.8 296,101.7 296,150.6 328,119.4 328,156.8"/>
  <text x="200" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">no measurements</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">variance P</text>
  <text x="336" y="186" font-size="11" fill="#1f2a44" text-anchor="end">time step</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="158">0.4</text><text x="36" y="96">0.8</text><text x="36" y="34">1.2</text>
  </g>
</svg>
```

The picture is the one-number filter from the last check question ($Q = 0.2$, $R = 1$), steps $2$ to $11$, with the measurements at steps $6$, $7$ and $8$ missing. Each predict adds $0.2$; each update cuts the variance down. During the gap it climbs in a straight staircase — exactly the kind of thing an error budget is built to show before flight.
:::
