---
id: l01-the-receding-horizon-principle
title: The receding horizon principle
minutes: 21
covers:
  - The receding horizon principle
---

Think about how you play chess. You look a few moves ahead: "if I move here, she moves there, then I can take her knight." You pick the best line you can see. Then you play only the *first* move of that line. Your opponent answers, the board changes, and you think ahead all over again from the new position. You never play out your whole plan blind.

**Model predictive control**, or **MPC**, is exactly that habit, run by a computer many times a second. From the **state** it has measured right now — where the vehicle is, how fast it is moving, which way it points — it plans the best sequence of commands for the next few seconds. It sends only the first command. Then, at the next tick of the clock, it measures again and plans again. That is the whole idea. The rest of this module is about what that idea buys you, what it costs, and how to prove it works.

None of the parts are new. The planning is the **[[quadratic programming|qp-bridge]]** of the optimization module. The model is the discrete state-space model of the state-space module. The cost is the quadratic cost of the LQR module. What MPC adds is the decision to plan again every cycle.

## What re-planning buys, and what it costs

A fixed feedback **gain** — a matrix that multiplies the current error to get a command — only ever looks at the present. Re-planning over a window of future time gives two things a gain cannot.

- **It sees a limit coming.** A thruster that will hit its maximum in two seconds. A keep-out sphere that the current velocity points at. A turn-rate limit that a fast slew will reach. The planner notices these in its prediction and acts early, instead of arriving at the limit badly.
- **It can use preview.** Sometimes you know the future: a reference path, a wind profile measured by a weather balloon, the motion of a docking target, a scheduled staging event. The planner can plan against it. A gain cannot.

The price is specific: there is now an **optimizer** — a numerical search for the best plan — inside the control loop. Every cycle depends on that search finishing in time. A table of gains cannot fail that way. The rest of this module is about paying that price honestly.

## One cycle, step by step

We use a **discrete-time model**: the world is looked at once every $T_s$ seconds ($T_s$, read "T sub s", the **sample period**), and the model says how the state moves from one sample to the next:

$$
\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k .
$$

Here $\mathbf{x}_k$ is the **state** at sample $k$ (a list of $n$ numbers, such as position and velocity, so $\mathbf{x}_k \in \mathbb{R}^n$). $\mathbf{u}_k \in \mathbb{R}^m$ is the **input**, the command, held constant across the sample. $\mathbf{A}$ and $\mathbf{B}$ are the discretized dynamics. Each cycle, the controller does four things.

1. **Measure.** The **[[navigation filter|nav-filter]]** supplies $\hat{\mathbf{x}}_k$ ("x hat sub k"), its best estimate of the current state. In MPC this estimate is the *starting point* of a whole prediction, not one term in a product. That makes MPC more sensitive to navigation errors than a gain: a biased estimate tilts the entire predicted path.
2. **Solve.** Find the input sequence $\mathbf{U} = (\mathbf{u}_0, \mathbf{u}_1, \dots, \mathbf{u}_{N-1})$ that minimizes a cost over the next $N$ samples, while obeying the model and every limit the vehicle has. $N$ is the **prediction horizon**, the number of samples the plan looks ahead. $N T_s$ is that same horizon in seconds — and the seconds are what matter physically.
3. **Apply the first move.** Send $\mathbf{u}_0^\star$ ("u zero star"; the star marks the optimal answer), and *throw away* $\mathbf{u}_1^\star, \dots, \mathbf{u}_{N-1}^\star$.
4. **Wait for the next sample and repeat.** The planning window has slid one step into the future. That sliding is what the name **[[receding horizon|receding-window]]** means: like the horizon when you walk toward it, the end of the plan keeps moving away.

The thrown-away tail is not wasted. It is what made the first move right. The optimizer could only decide how hard to brake *now* by working out what braking now means for the next several seconds. But the tail is a prediction, and predictions are always a little wrong by the time they arrive.

::: key Receding horizon principle
At each step solve an $N$-step optimal control problem from the current state, apply only the FIRST input, then re-solve at the next step with fresh measurements. The re-solve is what provides feedback.
:::

### MPC is a feedback law in disguise

Suppose the model, the cost and the limits do not change with time. Then the best first move depends only on the state you start from. Give the planner the same $\mathbf{x}$ and it returns the same $\mathbf{u}_0^\star$. So the loop is a plain **state feedback law**:

$$
\boldsymbol{\kappa}_N(\mathbf{x}) = \mathbf{u}_0^\star(\mathbf{x}) .
$$

Read $\boldsymbol{\kappa}_N$ as "kappa sub N". It is a rule that turns a state into a command, like $-\mathbf{K}\mathbf{x}$ — except that you evaluate it by solving an optimization instead of multiplying by a matrix. We say it is defined **implicitly**. This is the right way to think about MPC. It is a feedback law. It has a region where it is defined, a closed-loop behavior you can analyze and, with the ingredients of later lessons, a stability proof. The optimization is how you compute it, not what it is.

MPC did not start in aerospace. It grew up in **[[oil refineries|refinery-origins]]**, and only reached vehicles once flight computers got fast enough.

## The re-solve is the feedback

Here is the running example for this whole module. A spacecraft is doing **proximity operations** — flying close to another spacecraft. Look at only one axis of its motion. The state has two parts: position $x_1$ in meters and velocity $x_2$ in meters per second. A thruster gives an acceleration $u$, limited to $|u| \le 1\,\mathrm{m/s^2}$.

Sample every $T_s = 0.1\,\mathrm{s}$ and hold the thrust constant over each sample (a **[[zero-order hold|zoh]]**). In one sample, the position gains $x_2 T_s + \tfrac{1}{2} u T_s^2$ and the velocity gains $u T_s$. Plugging in $T_s = 0.1$ gives the exact model

$$
\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1 \end{bmatrix}, \qquad
\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1 \end{bmatrix}.
$$

(Check: $\tfrac{1}{2}(0.1)^2 = 0.005$, the top of $\mathbf{B}$.) The cost uses weights $\mathbf{Q} = \mathbf{I}$ on the state and $R = 0.1$ on the input. So one meter of position error and one meter per second of velocity error cost the same, and a full-scale thrust costs a tenth of that.

::: example Plan once, or plan every cycle
The spacecraft starts $2\,\mathrm{m}$ off station, at rest, and must come back. There is also a steady push of $0.05\,\mathrm{m/s^2}$ that the model does not know about — a **[[plume impingement|plume]]**, a small thruster bias, or a gravity effect the model leaves out.

Use a horizon of $N = 40$ samples, which is four seconds. Give the plan the Riccati terminal cost from the LQR module (a price on the state left at the end; the next two lessons explain it).

**Plan once.** Solve from $\mathbf{x}_0 = (2, 0)$ one time. Run all forty commands **open loop** — without looking again — then send zero thrust. On the true plant, at $t = 4.0\,\mathrm{s}$ the state is $(0.475\,\mathrm{m},\ 0.121\,\mathrm{m/s})$. Nothing ever corrects the leftover velocity, so the spacecraft drifts. At $t = 6.0\,\mathrm{s}$ it is $0.816\,\mathrm{m}$ off station and moving away at $0.221\,\mathrm{m/s}$.

Is the unknown push to blame? Run the same plan on the model with no push: it ends at $(0.075, -0.079)$. So almost all of the miss comes from the push.

**Plan every cycle.** Now solve the same forty-step problem every $0.1\,\mathrm{s}$ and apply only the first command. At $t = 4.0\,\mathrm{s}$ the state is $(0.096, -0.081)$. At $t = 6.0\,\mathrm{s}$ it is $(0.028, -0.010)$.

Compare the positions at $6\,\mathrm{s}$: $0.816 / 0.028 \approx 29$. Re-planning ends up about $29$ times closer. Both runs use the same optimization, the same weights, the same horizon and the same thrust limit. The only difference is that one of them looks again.

Both runs hold the thruster at its limit for the first ten samples. That is the point of a constrained plan: the optimizer knows it only has $1\,\mathrm{m/s^2}$ and plans the braking around it, instead of asking for thrust it cannot have.
:::

::: warning The re-solve is not integral action
Run the re-planning loop above until it settles. The spacecraft stops at $x_1 = 0.0193\,\mathrm{m}$, not at zero, with $u = -0.0500\,\mathrm{m/s^2}$ exactly canceling the push. This is not a solver failure.

Near the target no limit is active, so $\boldsymbol{\kappa}_N$ acts like a plain linear gain, $\mathbf{u} = -\mathbf{K}\mathbf{x}$. A pure proportional law needs *some* error to produce the thrust that balances a steady push. The resting point is $(\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K})^{-1}\mathbf{B}w$ with $w = 0.05$, which gives $0.0193\,\mathrm{m}$ — matching the simulation.

Re-solving fights what shows up in the state. It does not estimate what it cannot see. To remove the offset you need a disturbance model: add an estimated disturbance to the state, estimate it from the prediction error, and let the optimizer plan against it. That is the same integral action any regulator needs, and it has to be designed in. The next lesson shows how.
:::

## The plan you keep and the plan you throw away

Suppose nothing goes wrong: no push, no model error, perfect navigation. At the next cycle, does the new plan equal the tail of the old one?

In general, no. The **[[principle of optimality|bellman]]** says the tail of a best $N$-step plan is the best plan for the *remaining* $N-1$ steps. But at the next cycle you do not solve an $(N-1)$-step problem. You solve an $N$-step problem again, which looks one sample further ahead than before. That extra sample can change the answer, and the change reaches all the way back to the first move.

There is one important exception. Suppose the price put on the final state — the **terminal cost** — is the exact best cost of everything after the horizon. Then the $N$-step and $(N-1)$-step problems agree, the tail is still exactly optimal, and the plan is **time consistent**: it never changes its mind. For a linear-quadratic problem with no limits, that exact cost is known. It is $\mathbf{x}^\top\mathbf{P}\mathbf{x}$, where $\mathbf{P}$ solves the discrete algebraic Riccati equation of the LQR module. This is your first sight of the terminal cost. The whole stability theory later in this module grows from this observation.

The code below checks it with a three-step horizon, once with $\mathbf{P}$ at the end and once with plain $\mathbf{Q}$.

```python
import numpy as np

A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
Q, R, N = np.eye(2), np.array([[0.1]]), 3

P = Q.copy()                                  # Riccati iteration for the LQR cost-to-go
for _ in range(500):
    K = np.linalg.solve(R + B.T @ P @ B, B.T @ P @ A)
    P = Q + A.T @ P @ A - A.T @ P @ B @ K

def condensed(P_term):
    """H, F for the cost J = 0.5 U' H U + (F x0)' U + const."""
    Sx = np.vstack([np.linalg.matrix_power(A, k + 1) for k in range(N)])
    Su = np.zeros((2 * N, N))
    for k in range(N):
        for j in range(k + 1):
            Su[2 * k:2 * k + 2, j] = (np.linalg.matrix_power(A, k - j) @ B).ravel()
    Qbar = np.kron(np.eye(N), Q)
    Qbar[2 * (N - 1):, 2 * (N - 1):] = P_term
    return 2 * (Su.T @ Qbar @ Su + np.kron(np.eye(N), R)), 2 * (Su.T @ Qbar @ Sx)

for name, P_term in (("terminal cost P (LQR)", P), ("terminal cost Q", Q)):
    H, F = condensed(P_term)
    x0 = np.array([0.2, 0.0])
    U0 = np.linalg.solve(H, -F @ x0)          # unconstrained minimizer
    x1 = A @ x0 + B.ravel() * U0[0]           # apply the first move only
    U1 = np.linalg.solve(H, -F @ x1)          # re-solve from where we landed
    print(f"{name:22s} plan {np.round(U0, 5)} tail {np.round(U0[1:], 5)} "
          f"re-solve {np.round(U1, 5)}")

# terminal cost P (LQR)  plan [-0.51714 -0.33238 -0.20026] tail [-0.33238 -0.20026] re-solve [-0.33238 -0.20026 -0.10675]
# terminal cost Q        plan [-0.06524 -0.02208 -0.00106] tail [-0.02208 -0.00106] re-solve [-0.05126 -0.01359  0.00291]
```

With the Riccati terminal cost, the new plan starts with exactly the thrown-away tail, to every digit printed. With $\mathbf{Q}$ at the end, the tail had planned $-0.0221$ for the next move, but the re-solve asks for $-0.0513$ — more than twice as much. A three-step plan with no proper terminal cost barely looks past its own nose, so one more step of lookahead changes its mind. Both loops are still feedback laws. One of them is a far better copy of the infinite-horizon answer.

::: example What a short horizon costs, in gains
Near the target no limit is active, so the receding-horizon law is a linear gain $\mathbf{u} = -\mathbf{K}_{\text{rh}}\mathbf{x}$ ("K sub r h", for receding horizon). Compare it with the infinite-horizon LQR gain for these weights, $\mathbf{K}_{\text{lqr}} = [\,2.586\ \ 3.443\,]$. Use the naive terminal cost $\mathbf{Q}$ and try several horizons. The last column is the **[[spectral radius|eigen-picture]]**: the size of the slowest closed-loop eigenvalue. Below $1$ means stable; closer to $1$ means slower.

| $N$ | horizon (s) | $\mathbf{K}_{\text{rh}}$ | closed-loop spectral radius |
| --- | --- | --- | --- |
| $1$ | $0.1$ | $[\,0.045\ \ 0.913\,]$ | $0.9947$ |
| $2$ | $0.2$ | $[\,0.164\ \ 1.628\,]$ | $0.9893$ |
| $5$ | $0.5$ | $[\,0.704\ \ 2.668\,]$ | $0.9708$ |
| $10$ | $1.0$ | $[\,1.603\ \ 3.117\,]$ | $0.9377$ |
| $20$ | $2.0$ | $[\,2.430\ \ 3.391\,]$ | $0.9053$ |
| $40$ | $4.0$ | $[\,2.583\ \ 3.443\,]$ | $0.8993$ |

Every gain here is stable, but the short ones are weak. Turn the slowest eigenvalue into a **[[time constant|time-constant]]** with $\tau = T_s / (-\ln \lambda)$. For $N = 1$, $\lambda = 0.99473$ gives $\tau = 0.1 / 0.00528 = 18.9\,\mathrm{s}$. For $N = 40$, $\lambda = 0.8993$ gives $\tau = 0.94\,\mathrm{s}$. The short horizon is twenty times slower.

Why? A one-step planner sees almost no gain from pushing the position error down, because position barely moves in $0.1\,\mathrm{s}$. So it does almost nothing about it: a position gain of $0.045$ against LQR's $2.586$.

By $N = 40$ the gain matches LQR to three decimals. That is the fact to remember: as the horizon grows, the receding-horizon law approaches the infinite-horizon answer. Stability at short horizons, though, is luck here, not law. Buying it back with a terminal cost instead of a long horizon is exactly what the terminal ingredients do.
:::

## Receding, or shrinking

Not every predictive controller recedes. Some tasks end at a fixed moment: docking at a scheduled time, touchdown at a planned landing time, separation at a staging event. Then the natural plan counts *down*. At sample $k$ the horizon is $N_k = N_{\text{total}} - k$, and the final condition is the real end condition of the mission. That is a **shrinking-horizon** MPC. It differs from the receding kind in two ways that matter.

- Its end condition is physical, not invented, so no terminal set has to be designed.
- Its feedback law changes with time. The stability arguments of later lessons assume the problem looks the same at every step, so they do not apply unchanged.

Receding horizons suit tasks with no natural end: station keeping, pointing, tracking a reference, holding a corridor. **[[Powered descent|shrinking-descent]]** is usually shrinking-horizon, with an outer search over the time of flight. Rendezvous can be either, depending on whether the docking time is fixed. Say which one you are building. Reviewers will ask, because the guarantees are different.

## When the command actually gets applied

Here is a detail that separates a simulation from flight software. The command computed from $\hat{\mathbf{x}}_k$ cannot go out at time $t_k$, because at $t_k$ the solver has not run yet.

Say guidance runs at $10\,\mathrm{Hz}$, so $T_s = 100\,\mathrm{ms}$, and the solve takes $12\,\mathrm{ms}$ in the worst case measured on the real flight computer. There are three common arrangements.

1. **Send the command as soon as it is ready.** This adds a delay of up to $12\,\mathrm{ms}$ that changes from cycle to cycle. It is the worst option: a varying delay is hard to model, and it eats into the **[[phase margin|delay-phase]]** unpredictably.
2. **Send it at the next frame boundary.** This accepts a fixed one-sample delay — and you *model* it. Since $\mathbf{u}_{k-1}$ is already committed, solve from the predicted state $\mathbf{A}\hat{\mathbf{x}}_k + \mathbf{B}\mathbf{u}_{k-1}$ instead of from $\hat{\mathbf{x}}_k$.
3. **Run the solver slower and fill in between.** This is what happens when guidance runs at $2\,\mathrm{Hz}$ inside a $50\,\mathrm{Hz}$ control loop.

The middle option is the standard one, and it costs one line of code: predict one sample ahead with the command already sent, and plan from there. It turns an unmodeled delay into a modeled one, using the model you already have.

## Check yourself

::: check
The optimizer returns a forty-step plan and you apply its first element. A colleague proposes applying the first *five* elements before re-solving, to cut the solver load by five. What have you given up, and when might it be acceptable?
:::

::: answer
You have given up feedback for five samples. Between re-solves the loop is open. A disturbance, a navigation update or a model error acts unopposed for $0.5\,\mathrm{s}$ at $T_s = 0.1\,\mathrm{s}$. In the example, running the whole plan open loop left the vehicle $0.816\,\mathrm{m}$ off station instead of $0.028\,\mathrm{m}$. Holding five steps is a milder version of the same thing, and the closed-loop bandwidth drops roughly in proportion to the effective sample rate.

The stability argument changes too, because it assumes each optimization starts from the true current state. It can be acceptable when the plant is slow compared with the re-solve interval, when disturbances are small and slow, or when the alternative is missing the deadline. The usual compromise is to keep a fast loop closed with a simple gain around the slower predictive plan. That is exactly the structure of the tube formulation later in this module.
:::

::: check
Explain why MPC is more sensitive to a navigation bias than a fixed-gain regulator with the same nominal gain.
:::

::: answer
A gain multiplies the current estimate, so a bias $\Delta\mathbf{x}$ changes the command by $\mathbf{K}\Delta\mathbf{x}$ and nothing more. MPC uses the estimate as the starting point of a prediction. The bias travels through $N$ steps of the model, shifting the whole predicted path, and it can change which limits the optimizer thinks will be hit. A biased velocity can make the optimizer predict a state-limit violation that will not happen and brake hard for it — or predict clearance where there is none.

Near the target, where no limit is active, the two controllers are the same law and equally sensitive. The extra sensitivity lives entirely in the limit decisions. That is why the margins in a flight formulation are sized using the navigation uncertainty, not the true state.
:::

::: check
For the $N = 1$ row of the gain table, the slowest closed-loop eigenvalue is $0.99473$ at $T_s = 0.1\,\mathrm{s}$. What continuous-time time constant is that, and why is such a short horizon so weak on position error?
:::

::: answer
A discrete eigenvalue $\lambda$ matches a continuous pole $s = \ln(\lambda)/T_s$. So $s = \ln(0.99473)/0.1 = -0.0528\,\mathrm{s^{-1}}$, and the time constant is $1/0.0528 = 18.9\,\mathrm{s}$.

The reason is what the one-step problem can see. In one $0.1\,\mathrm{s}$ sample, a thrust of $1\,\mathrm{m/s^2}$ moves the position by $\tfrac{1}{2}u T_s^2 = 0.005\,\mathrm{m}$ but the velocity by $0.1\,\mathrm{m/s}$. Position error is almost out of reach within the horizon, so spending thrust on it looks like waste to the optimizer. The position gain comes out near zero: $0.045$, against LQR's $2.586$. Horizon length is not a tuning detail. It decides which states the optimizer believes it can affect at all.
:::

::: check
When is the receding-horizon law $\boldsymbol{\kappa}_N$ time-invariant? Name one aerospace problem where it is not.
:::

::: answer
It is time-invariant when the optimization depends on nothing but the current state: constant $\mathbf{A}$ and $\mathbf{B}$, constant weights, constant limits, a fixed horizon $N$, and a reference that is constant or absent. Then the same $\mathbf{x}$ always gives the same $\mathbf{u}_0^\star$.

It changes with time whenever any of those do. Examples: a shrinking horizon toward a fixed docking time; an ascent vehicle whose mass, dynamic pressure and control authority change through the burn; a descent where the thrust-to-weight bound shifts as propellant burns off; any plan that previews a time-stamped reference. Time-varying is normal and fine. But the stability proofs of later lessons are stated for the time-invariant case and must be argued again when it does not hold.
:::

::: check
Your MPC uses a $4\,\mathrm{s}$ horizon at $10\,\mathrm{Hz}$, and the solver takes $12\,\mathrm{ms}$ worst case. The team proposes going to $20\,\mathrm{Hz}$ for better disturbance rejection, keeping $N = 40$. What happens to the horizon, and what would you do instead?
:::

::: answer
At $20\,\mathrm{Hz}$ a sample is $50\,\mathrm{ms}$, so $N = 40$ now covers only $2\,\mathrm{s}$. The controller has become faster and more short-sighted at once, even though nothing in the formulation looks different.

To keep $4\,\mathrm{s}$ of lookahead you need $N = 80$. That roughly doubles the solve time while the time available per frame halves — four times the required throughput. The usual answers: keep the horizon fixed in seconds and make the steps uneven (fine steps early, coarse steps late), or split the rates — run the predictive layer at $10\,\mathrm{Hz}$ or slower and close a fast inner loop with a fixed gain at $20\,\mathrm{Hz}$ or more. Choose the horizon in seconds first and the sample rate second, and you avoid this trap.
:::

## Summary

| Object | Statement |
| --- | --- |
| Receding horizon | Solve $N$ steps from $\mathbf{x}_k$, apply $\mathbf{u}_0^\star$ only, discard the tail, re-solve at $k+1$ |
| Implicit law | $\boldsymbol{\kappa}_N(\mathbf{x}) = \mathbf{u}_0^\star(\mathbf{x})$: a state feedback computed by optimization |
| Source of feedback | The re-solve. Between re-solves the loop is open |
| Running plant | $\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1\end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1\end{bmatrix}$, $T_s = 0.1\,\mathrm{s}$, $\lvert u\rvert \le 1\,\mathrm{m/s^2}$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$ |
| Open vs closed | Unknown $0.05\,\mathrm{m/s^2}$ push: plan-once ends $0.816\,\mathrm{m}$ off at $6\,\mathrm{s}$, re-planning $0.028\,\mathrm{m}$ |
| Offset | No integral action: resting error $0.0193\,\mathrm{m} = (\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K})^{-1}\mathbf{B}w$ |
| Time consistency | With the Riccati terminal cost the new plan equals the old tail; with a cut-off cost it does not |
| Horizon effect | $\mathbf{K}_{\text{rh}} \to \mathbf{K}_{\text{lqr}} = [\,2.586\ \ 3.443\,]$ as $N$ grows; $N = 1$ gives a $18.9\,\mathrm{s}$ time constant |
| Receding vs shrinking | Receding: fixed $N$, no natural end. Shrinking: $N_k = N_{\text{total}} - k$ toward a fixed time; time-varying law |
| Computation delay | Solve from $\mathbf{A}\hat{\mathbf{x}}_k + \mathbf{B}\mathbf{u}_{k-1}$ and apply at the next frame: a modeled delay |

The next lesson writes out the optimization that step 2 solves — the finite-horizon constrained optimal control problem — term by term, and says what each weight and each limit is for.

::: context qp-bridge The workhorse from the optimization module
A **quadratic program**, or QP, is a problem of the form "find the lowest point of a bowl-shaped cost, while staying on the allowed side of some straight walls". The cost is a quadratic, like $x^2 + 3xy + y^2$, and the walls are linear inequalities. You met it in the optimization module. It matters here because QPs with a positive definite bowl have exactly one lowest point, and fast, reliable solvers exist for them. Lesson 3 of this module shows how an MPC problem becomes one.
:::

::: context nav-filter Where the state estimate comes from
No spacecraft can read its state off a dial. It has sensors — star trackers, gyros, accelerometers, GPS, cameras, laser rangefinders — and each is noisy and measures only part of the state. A **navigation filter**, usually a Kalman filter, blends the sensor readings with a motion model to produce a best estimate $\hat{\mathbf{x}}$ and a measure of how uncertain it is. The controller only ever sees $\hat{\mathbf{x}}$. The estimation track of this course builds these filters.
:::

::: context receding-window The window that slides
Each cycle plans over a window of $N$ samples, uses only the first one (red), and throws the rest away. One sample later the window has slid forward by one step, and the planning starts over from a fresh measurement. The end of the plan is always $N$ samples ahead, however far you go — like the horizon, which retreats as you walk toward it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="116" x2="40" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="70" y1="116" x2="70" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="116" x2="100" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="130" y1="116" x2="130" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="160" y1="116" x2="160" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190" y1="116" x2="190" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="220" y1="116" x2="220" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="116" x2="250" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="116" x2="280" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="310" y1="116" x2="310" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="340" y1="116" x2="340" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">k</text>
  <text x="70" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">k+1</text>
  <text x="190" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">k+5</text>
  <text x="220" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">k+6</text>
  <rect x="40" y="28" width="150" height="26" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="40" y="28" width="30" height="26" fill="#b4232c" fill-opacity="0.85"/>
  <text x="55" y="45" font-size="11" fill="#ffffff" text-anchor="middle">use</text>
  <text x="130" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">plan, then discard</text>
  <text x="200" y="45" font-size="12" fill="#1f2a44">cycle k</text>
  <rect x="70" y="72" width="150" height="26" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="70" y="72" width="30" height="26" fill="#b4232c" fill-opacity="0.85"/>
  <text x="85" y="89" font-size="11" fill="#ffffff" text-anchor="middle">use</text>
  <text x="160" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">plan, then discard</text>
  <text x="230" y="89" font-size="12" fill="#1f2a44">cycle k+1</text>
</svg>
```
:::

::: context refinery-origins Born in oil refineries
MPC grew up in the process industries. Jacques Richalet and co-workers in France published "model predictive heuristic control" in 1978, and Charles Cutler and Brian Ramaker described Dynamic Matrix Control, developed at Shell Oil, around 1979–1980. Refineries have slow plants, many valves and sensors, hard limits on valve positions and product purity, and minutes available per decision — so re-solving an optimization each cycle was practical there decades before it was on a vehicle. The theory of stability and feasibility came mostly in the 1990s, and aerospace uses followed once flight processors could solve a QP inside one control frame.
:::

::: context zoh Holding the command steady
A digital computer cannot change its command continuously. It computes a number, sends it, and the actuator holds that value until the next number arrives. Plotted against time, the command looks like a staircase. This is called a **zero-order hold** — "zero order" because between samples the command is a constant, a polynomial of degree zero. Because the input is exactly constant over each step, the double integrator's discrete model is exact, not an approximation.
:::

::: context plume When your own exhaust pushes back
Close to another spacecraft, the exhaust plume of a thruster can hit the other vehicle's surfaces and bounce or press on them. That **plume impingement** creates small forces the simple model does not include. In a free-flying test it looks like a constant or slowly changing extra acceleration — exactly the kind of unknown push this example uses. Plume loads are a real design concern on space-station approaches, which is one reason approach corridors limit when and which thrusters may fire.
:::

::: context bellman Why the tail of a best plan is itself best
Richard Bellman stated the **principle of optimality** in the 1950s. The idea: if the fastest road from home to school passes the library, then the part from the library to school must be the fastest road from the library to school. If there were a faster one, you could splice it in and beat the "fastest" route. The same splicing argument says the tail of an optimal plan is optimal for the remaining steps. It does *not* say the tail is optimal for a longer problem — which is exactly why re-solving with the same $N$ can change the plan.
:::

::: context eigen-picture Where the eigenvalues sit
For a discrete-time loop, each eigenvalue $\lambda$ says how much a mode shrinks per sample. Inside the unit circle ($|\lambda| < 1$) it decays; the closer to $1$, the slower. Here both gains give real eigenvalues. The $N = 1$ pair (red) sits at $0.914$ and $0.995$, nearly touching the edge. The $N = 40$ pair (blue) sits at $0.744$ and $0.899$, well inside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="345" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30.0" y1="65" x2="30.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.70</text>
  <line x1="80.0" y1="65" x2="80.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.75</text>
  <line x1="130.0" y1="65" x2="130.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.80</text>
  <line x1="180.0" y1="65" x2="180.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.85</text>
  <line x1="230.0" y1="65" x2="230.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.90</text>
  <line x1="280.0" y1="65" x2="280.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">0.95</text>
  <line x1="330.0" y1="65" x2="330.0" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330.0" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">1.00</text>
  <line x1="330.00000000000006" y1="30" x2="330.00000000000006" y2="80" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="330.00000000000006" y="22" font-size="11" fill="#6c7a93" text-anchor="end">edge of unit circle</text>
  <circle cx="324.7" cy="70" r="5" fill="#b4232c"/>
  <circle cx="243.7" cy="70" r="5" fill="#b4232c"/>
  <circle cx="229.3" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="73.6" cy="70" r="5" fill="#1d6fd1"/>
  <text x="280.0" y="50" font-size="12" fill="#b4232c" text-anchor="middle">N = 1</text>
  <text x="150.0" y="50" font-size="12" fill="#1d6fd1" text-anchor="middle">N = 40</text>
  <text x="180" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">closed-loop eigenvalues (both real); closer to 1 = slower</text>
</svg>
```
:::

::: context time-constant From "per sample" to seconds
A mode with eigenvalue $\lambda$ gets multiplied by $\lambda$ every sample, so after $k$ samples it is $\lambda^k$ times its starting size. Write $\lambda^k = e^{k \ln \lambda}$ and put $t = k T_s$: the mode is $e^{t \ln(\lambda)/T_s}$. That is a continuous decay $e^{-t/\tau}$ with time constant $\tau = T_s/(-\ln \lambda)$. After one time constant the mode is down to $e^{-1}$, about $37\,\%$. For $\lambda$ close to $1$, $-\ln\lambda \approx 1 - \lambda$, so $0.99473$ loses about half a percent per sample.
:::

::: context shrinking-descent Landing on a clock
A powered descent must end at the ground with zero velocity at some time $t_f$. Guidance typically fixes $t_f$, solves for the whole remaining path, flies a little of it, and solves again with less time left — a shrinking horizon. Since the best $t_f$ is not known in advance, an outer loop searches over it, typically a one-dimensional search that tries a few landing times and keeps the one that uses the least propellant. Lesson 11 of this module comes back to powered descent as one of the main places MPC-style guidance flies.
:::

::: context delay-phase How a delay steals phase margin
A pure time delay $\tau$ does not change the size of a signal, but it shifts a sine wave of frequency $\omega$ back by the angle $\omega\tau$ radians. At the loop's crossover frequency, that lag comes straight out of the **phase margin** — the safety buffer before the loop oscillates. A delay that changes from cycle to cycle takes a changing bite, which is why a fixed, modeled delay is preferred.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30.0" y1="90" x2="330.0" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30.0" y1="40" x2="30.0" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30.0" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">frame k</text>
  <text x="30.0" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">0 ms</text>
  <line x1="150.0" y1="40" x2="150.0" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150.0" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">frame k+1</text>
  <text x="150.0" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">100 ms</text>
  <line x1="270.0" y1="40" x2="270.0" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270.0" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">frame k+2</text>
  <text x="270.0" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">200 ms</text>
  <rect x="30.0" y="68" width="14.4" height="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="150.0" y="68" width="14.4" height="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="50.0" y="80" font-size="11" fill="#1f2a44">solve, 12 ms</text>
  <path d="M 44.4 60 Q 97.2 30 147.0 44" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="150.0,46 141.0,45 146.0,38" fill="#1d6fd1"/>
  <text x="90.0" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">command held, applied here</text>
</svg>
```
:::
