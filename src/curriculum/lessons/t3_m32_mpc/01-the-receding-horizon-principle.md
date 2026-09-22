---
id: l01-the-receding-horizon-principle
title: The receding horizon principle
minutes: 20
covers:
  - The receding horizon principle
---

Model predictive control is one idea repeated forever: from the state you have measured right now, solve an optimal control problem over the next few seconds, apply the first control of the answer, throw the rest away, and solve it again at the next cycle with a fresh measurement. Nothing else about MPC is new. The optimisation is the quadratic programming of the optimization module, the model is the discrete state-space model of the state-space module, the cost is the quadratic cost of the LQR module. What MPC adds is the decision to re-solve, and the consequences of that decision are the subject of this whole module.

That decision buys two things no fixed feedback gain can offer. It lets the controller *see a constraint coming* — a thruster that will saturate in two seconds, a keep-out sphere the current velocity is pointed at, a rate limit that a fast slew will hit — and act now to avoid arriving at it badly. And it lets the controller use *preview*: a known future reference, a wind profile from a sounding balloon, the motion of a docking target, a scheduled staging event. A gain multiplies the present error and knows nothing about either.

It also costs something specific: an optimiser in the control loop. Every cycle now depends on a numerical algorithm returning an answer in time, which is a failure mode that a lookup table of gains does not have. The rest of this module is about making that trade honestly — first by understanding what the receding horizon guarantees and what it does not, then by making the guarantees provable, and finally by measuring the solve against a flight computer's frame budget.

## One cycle

Fix a discrete-time model, sampled at period $T_s$,

$$
\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k ,
$$

with $\mathbf{x}_k \in \mathbb{R}^n$ the state at sample $k$, $\mathbf{u}_k \in \mathbb{R}^m$ the input held constant across the sample, and $\mathbf{A}$, $\mathbf{B}$ the discretised dynamics. At each cycle the controller does four things.

1. **Measure.** The navigation filter supplies $\hat{\mathbf{x}}_k$, the current state estimate. In MPC this is the *initial condition* of an optimisation, not one term of a gain product, which is why MPC is more sensitive to navigation errors than a gain is: a biased estimate tilts a whole predicted trajectory.
2. **Solve.** Find the input sequence $\mathbf{U} = (\mathbf{u}_0, \mathbf{u}_1, \dots, \mathbf{u}_{N-1})$ minimising a cost over the next $N$ samples, subject to the model and to every constraint the vehicle has. $N$ is the **prediction horizon**; $N T_s$ is the horizon in seconds, and it is the seconds that matter physically.
3. **Apply the first move.** Command $\mathbf{u}_k = \mathbf{u}_0^\star$, the first element of the optimal sequence, and *discard $\mathbf{u}_1^\star \dots \mathbf{u}_{N-1}^\star$*.
4. **Wait for the next sample and repeat**, with the horizon window shifted one step into the future — which is what "receding horizon" names.

The discarded tail is not wasted. It is what made the first move correct: the optimiser could only decide how hard to brake now because it worked out what braking now implies for the next several seconds. But the tail is a prediction, and predictions are always wrong by the time they arrive.

::: key Receding horizon principle
At each step solve an $N$-step optimal control problem from the current state, apply only the FIRST input, then re-solve at the next step with fresh measurements. The re-solve is what provides feedback.
:::

Because the optimal $\mathbf{u}_0^\star$ depends only on the state you started from (when the cost, model and constraints do not change with time), the loop defines a static state feedback law

$$
\boldsymbol{\kappa}_N(\mathbf{x}) = \mathbf{u}_0^\star(\mathbf{x}) ,
$$

evaluated by solving an optimisation instead of by multiplying a matrix. That is the right way to think about MPC: it is a feedback law, defined implicitly. It has a region where it is defined, a closed-loop behaviour you can analyse, and — with the ingredients of the later lessons — a stability proof. The optimisation is the evaluation method, not the controller.

::: note Where MPC came from
MPC grew up in the process industries, not in aerospace. Richalet and co-workers described "model predictive heuristic control" in 1978, and Cutler and Ramaker's Dynamic Matrix Control followed at Shell around 1979. Oil refineries had slow plants, many inputs and outputs, hard constraints on valve positions and product purity, and minutes of computing time per decision — conditions under which re-solving an optimisation each cycle was practical decades before it was practical on a vehicle. The theory of stability and feasibility came later, largely in the 1990s, and the aerospace applications came later still, once flight processors could solve a quadratic program inside a control frame.
:::

## The re-solve is the feedback

Take the running plant of this module: a single translational axis of a spacecraft in proximity operations, with position $x_1$ in metres, velocity $x_2$ in metres per second, and a thruster giving an acceleration $u$ limited to $|u| \le 1\,\mathrm{m/s^2}$. Sampled at $T_s = 0.1\,\mathrm{s}$ with a zero-order hold, the double integrator discretises exactly to

$$
\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1 \end{bmatrix}, \qquad
\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1 \end{bmatrix},
$$

since over one sample the position gains $x_2 T_s + \tfrac{1}{2} u T_s^2$ and the velocity gains $u T_s$. Weight the cost with $\mathbf{Q} = \mathbf{I}$ and $R = 0.1$, so a metre of position error and a metre per second of velocity error cost the same, and a full-scale input costs a tenth of that.

::: example Plan once, or plan every cycle
The vehicle starts $2\,\mathrm{m}$ off station at rest and must null the offset. There is also an unmodelled constant acceleration of $0.05\,\mathrm{m/s^2}$ — a plume impingement, a small thruster bias, a gravity-gradient term the model omits — that the controller does not know about.

With $N = 40$ (four seconds of horizon), solve the constrained problem once from $\mathbf{x}_0 = (2, 0)$ and run the whole forty-step sequence open loop, then hold zero input. Against the true plant, at $t = 4.0\,\mathrm{s}$ the state is $(0.475\,\mathrm{m},\ 0.121\,\mathrm{m/s})$, and because the residual velocity is never corrected the vehicle then drifts: at $t = 6.0\,\mathrm{s}$ it is $0.816\,\mathrm{m}$ off station and moving away at $0.221\,\mathrm{m/s}$. On the nominal plant the same plan would have ended at $(0.075, -0.079)$, so almost all of that miss is the unmodelled acceleration.

Now re-solve the same forty-step problem every $0.1\,\mathrm{s}$ and apply only the first input. At $t = 4.0\,\mathrm{s}$ the state is $(0.096, -0.081)$, and at $t = 6.0\,\mathrm{s}$ it is $(0.028, -0.010)$ — a factor of $28$ closer than the open-loop run at the same instant. The two runs solve the same optimisation with the same weights, the same horizon and the same constraint; the only difference is that one of them looks again.

Both runs saturate the thruster for the first ten samples, which is the point of a constrained formulation: the optimiser knows the input is limited to $1\,\mathrm{m/s^2}$ and plans the braking accordingly instead of asking for what it cannot have.
:::

::: warning The re-solve is not integral action
Run the loop above to steady state and the vehicle settles at $x_1 = 0.0193\,\mathrm{m}$, not at zero, with $u = -0.0500\,\mathrm{m/s^2}$ exactly cancelling the disturbance. That is not a solver failure. Near the origin no constraint is active, so $\boldsymbol{\kappa}_N$ is a linear gain $\mathbf{u} = -\mathbf{K}\mathbf{x}$, and a linear proportional law needs a nonzero error to produce the force that balances a constant disturbance. The fixed point $(\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K})^{-1}\mathbf{B}w$ with $w = 0.05$ predicts $0.0193\,\mathrm{m}$, matching the simulation. Re-solving rejects what it can see in the state; it does not estimate what it cannot. Removing the offset takes a disturbance model — augment the state with an estimated disturbance, estimate it from the prediction error, and let the optimiser plan against it — which is the same integral action any regulator needs, and it has to be designed in.
:::

## The plan you keep and the plan you throw away

Suppose nothing goes wrong: no disturbance, no model error, perfect navigation. Does the re-solve return the tail of the previous plan?

Not in general, and the reason matters. The principle of optimality says the tail of an optimal $N$-step plan is optimal for the *remaining* $N-1$ steps. But at the next cycle you do not solve an $N-1$ step problem — you solve an $N$-step problem again, looking one sample further into the future than before. The extra sample changes the answer, and the change propagates back to the first move.

There is one important exception. If the terminal cost in the problem is the exact optimal cost-to-go from the horizon's end, then the $N$-step and $(N-1)$-step problems have the same solution, the tail is exactly optimal again, and the plan is **time consistent**. For an unconstrained linear-quadratic problem that exact cost-to-go is known in closed form: it is $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ with $\mathbf{P}$ the solution of the discrete algebraic Riccati equation from the LQR module. This is the first appearance of the terminal cost, and the whole stability theory later in this module is built on the same observation.

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
    U0 = np.linalg.solve(H, -F @ x0)          # unconstrained minimiser
    x1 = A @ x0 + B.ravel() * U0[0]           # apply the first move only
    U1 = np.linalg.solve(H, -F @ x1)          # re-solve from where we landed
    print(f"{name:22s} plan {np.round(U0, 5)} tail {np.round(U0[1:], 5)} "
          f"re-solve {np.round(U1, 5)}")

# terminal cost P (LQR)  plan [-0.51714 -0.33238 -0.20026] tail [-0.33238 -0.20026]
#                        re-solve [-0.33238 -0.20026 -0.10675]
# terminal cost Q        plan [-0.06524 -0.02208 -0.00106] tail [-0.02208 -0.00106]
#                        re-solve [-0.05126 -0.01359  0.00291]
```

With the Riccati terminal cost the re-solved plan starts with exactly the discarded tail, to every digit printed. With $\mathbf{Q}$ used as a terminal cost the re-solve disagrees with the tail in the first element by $0.029$, about $44\,\%$ of that element — a three-step horizon with no terminal cost barely looks past its own nose, so a step of extra lookahead changes its mind. Both loops are still feedback laws; one of them is a much better approximation to the infinite-horizon answer than the other.

::: example What a short horizon costs, in gains
Near the origin no constraint is active, so the receding-horizon law is a linear gain $\mathbf{u} = -\mathbf{K}_{\text{rh}}\mathbf{x}$, and it can be compared directly against the infinite-horizon LQR gain $\mathbf{K}_{\text{lqr}} = [\,2.586\ \ 3.443\,]$ for these weights. Take the terminal cost to be $\mathbf{Q}$ — the naive choice — and sweep the horizon:

| $N$ | horizon (s) | $\mathbf{K}_{\text{rh}}$ | closed-loop spectral radius |
| --- | --- | --- | --- |
| $1$ | $0.1$ | $[\,0.045\ \ 0.913\,]$ | $0.9947$ |
| $2$ | $0.2$ | $[\,0.164\ \ 1.628\,]$ | $0.9893$ |
| $5$ | $0.5$ | $[\,0.704\ \ 2.668\,]$ | $0.9708$ |
| $10$ | $1.0$ | $[\,1.603\ \ 3.117\,]$ | $0.9377$ |
| $20$ | $2.0$ | $[\,2.430\ \ 3.391\,]$ | $0.9053$ |
| $40$ | $4.0$ | $[\,2.583\ \ 3.443\,]$ | $0.8993$ |

The short-horizon gains are stabilising here but weak: at $N = 1$ the slowest closed-loop mode has magnitude $0.9947$ per sample, a time constant of $0.1/(-\ln 0.9947) = 18.9\,\mathrm{s}$, against $1.0\,\mathrm{s}$ for the $N = 40$ gain. A one-step-ahead optimiser sees almost no benefit in pushing the position error down, because the position barely moves in $0.1\,\mathrm{s}$; it therefore does almost nothing about it. By $N = 40$ the gain agrees with LQR to three decimals, which is the equivalence to remember: the receding horizon converges to the infinite-horizon answer as the horizon grows. Stability at short horizons, though, is luck here rather than law — and buying it back with a terminal cost instead of with horizon length is exactly what the terminal ingredients do.
:::

## Receding, or shrinking

Not every predictive controller recedes. If the task ends at a fixed epoch — docking at a scheduled contact time, touchdown at a planned landing time, separation at a staging event — the natural formulation counts *down*: at sample $k$ the horizon is $N_k = N_{\text{total}} - k$ and the terminal constraint is the real terminal condition of the mission. That is a **shrinking-horizon** MPC, and it differs in two ways that matter. Its terminal condition is physical rather than invented, so no terminal set has to be designed. And its feedback law is time-varying, so the stability argument of the later lessons, which relies on the problem looking the same at every step, does not apply unchanged.

Receding-horizon formulations suit tasks with no natural end: station keeping, attitude regulation, tracking a reference, holding a corridor. Powered descent is usually written as shrinking-horizon with an outer search over the time of flight; rendezvous can be either, depending on whether the docking epoch is fixed. Say which one you are building, because reviewers will ask, and the guarantees on offer are different.

## When the command actually gets applied

A subtlety that separates a simulation from flight software: the input the optimiser computes from $\hat{\mathbf{x}}_k$ cannot be applied at time $t_k$, because at $t_k$ the solver has not run yet.

Suppose guidance runs at $10\,\mathrm{Hz}$, so $T_s = 100\,\mathrm{ms}$, and the QP takes $12\,\mathrm{ms}$ in the worst case measured on the target. Three arrangements are common. Apply the command as soon as it is ready, accepting a $12\,\mathrm{ms}$ variable delay — the worst option, because a variable delay is difficult to model and erodes phase margin unpredictably. Apply it at the next frame boundary, accepting a fixed one-sample delay, and *model that delay* by solving from the predicted state $\mathbf{A}\hat{\mathbf{x}}_k + \mathbf{B}\mathbf{u}_{k-1}$ rather than from $\hat{\mathbf{x}}_k$, since $\mathbf{u}_{k-1}$ is already committed. Or run the solver at a submultiple of the control rate and interpolate, which is what happens when guidance runs at $2\,\mathrm{Hz}$ inside a $50\,\mathrm{Hz}$ control loop.

The middle option is the standard one and costs one line: predict one sample forward with the input already committed, and let the optimiser choose from there. The prediction uses the model you already have, and it turns an unmodelled delay into a modelled one.

## Check yourself

::: check
The optimiser returns a forty-step plan and you apply its first element. A colleague proposes applying the first *five* elements before re-solving, to cut the solver load by a factor of five. What have you given up, and when might it be acceptable?
:::

::: answer
You have given up feedback for five samples. Between re-solves the loop is open: a disturbance, a navigation correction or a model error acts unopposed for $0.5\,\mathrm{s}$ at $T_s = 0.1\,\mathrm{s}$. In the example above, running the whole plan open loop left the vehicle $0.816\,\mathrm{m}$ off station instead of $0.028\,\mathrm{m}$; holding five steps is a milder version of the same thing, and the closed-loop bandwidth drops roughly in proportion to the effective sample rate. The stability argument also changes, because it assumes the state that starts each optimisation is the true current state. It can be acceptable when the plant is slow relative to the re-solve interval, when disturbances are small and slow, or when the alternative is missing the deadline — and the usual compromise is to keep the fast loop closed with a simple gain around the slower predictive plan, which is exactly the structure of the tube formulation later in this module.
:::

::: check
Explain why MPC is more sensitive to a navigation bias than a fixed-gain regulator with the same nominal gain.
:::

::: answer
A gain multiplies the current estimate, so a bias $\Delta\mathbf{x}$ perturbs the command by $\mathbf{K}\Delta\mathbf{x}$ and nothing more. MPC uses the estimate as the initial condition of a prediction: the bias propagates through $N$ steps of the model, shifting the whole predicted trajectory, and can change which constraints the optimiser believes will be active. A biased velocity estimate can make the optimiser predict a state-constraint violation that will not happen, and brake hard for it, or predict clearance where there is none. Near the origin, where no constraint is active, the two controllers are the same law and the sensitivity is identical; the extra sensitivity lives entirely in the constraint decisions. This is why the constraint margins in a flight formulation are sized against the navigation covariance, not against the true state.
:::

::: check
For the $N = 1$ row of the gain table, confirm the settling time claim: the slowest closed-loop eigenvalue has magnitude $0.9947$ at $T_s = 0.1\,\mathrm{s}$. What continuous-time time constant does that correspond to, and why is such a short horizon so weak on position error?
:::

::: answer
A discrete eigenvalue $\lambda$ corresponds to a continuous pole $s = \ln(\lambda)/T_s$, so $s = \ln(0.9947)/0.1 = -0.0531\,\mathrm{s^{-1}}$ and the time constant is $1/0.0531 = 18.8\,\mathrm{s}$. The reason is the cost the one-step problem actually sees. In one sample of $0.1\,\mathrm{s}$, an input of $1\,\mathrm{m/s^2}$ moves the position by $\tfrac{1}{2}u T_s^2 = 0.005\,\mathrm{m}$ and the velocity by $0.1\,\mathrm{m/s}$. Position error is essentially unreachable within the horizon, so spending control effort on it looks like waste to the optimiser, and the position gain comes out near zero ($0.045$ against LQR's $2.586$). Horizon length is not a tuning nicety here; it is what determines which states the optimiser believes it can influence at all.
:::

::: check
Under what conditions is the receding-horizon law $\boldsymbol{\kappa}_N$ time-invariant, and name one aerospace problem where it is not.
:::

::: answer
It is time-invariant when the optimisation it solves depends on nothing but the current state: constant $\mathbf{A}$, $\mathbf{B}$, constant weights, constant constraints, a fixed horizon $N$, and a reference that is either constant or absent. Then the same $\mathbf{x}$ always produces the same $\mathbf{u}_0^\star$. It is time-varying whenever any of those changes with time: a shrinking horizon toward a fixed docking epoch; an ascent vehicle whose mass, dynamic pressure and control authority change through the burn; a descent problem where the thrust-to-weight bound tightens as propellant burns off; any formulation with a preview of a time-stamped reference. Time-varying is normal and fine, but the stability proofs of the later lessons are stated for the time-invariant case and have to be re-argued when it does not hold.
:::

::: check
Your MPC uses a $4\,\mathrm{s}$ horizon at $10\,\mathrm{Hz}$ and the solver takes $12\,\mathrm{ms}$ worst case. The team proposes going to $20\,\mathrm{Hz}$ for better disturbance rejection, keeping $N = 40$. What happens to the horizon, and what would you do instead?
:::

::: answer
At $20\,\mathrm{Hz}$ the sample becomes $50\,\mathrm{ms}$, so $N = 40$ is now only $2\,\mathrm{s}$ of lookahead. The controller has become faster and shorter-sighted at once, and the physics of what it can plan around has changed even though nothing in the formulation looks different. To keep $4\,\mathrm{s}$ of preview you need $N = 80$, which roughly doubles the solve while the available frame has halved — a factor of four in required throughput. The usual answers are to keep the prediction horizon in seconds and non-uniform in samples (fine steps early, coarse steps late), or to separate the rates: run the predictive layer at $10\,\mathrm{Hz}$ or slower and close a fast inner loop with a fixed gain at $20\,\mathrm{Hz}$ or more. Deciding the horizon in seconds first, and the sample rate second, avoids this trap.
:::

## Summary

| Object | Statement |
| --- | --- |
| Receding horizon | Solve $N$ steps from $\mathbf{x}_k$, apply $\mathbf{u}_0^\star$ only, discard the tail, re-solve at $k+1$ |
| Implicit law | $\boldsymbol{\kappa}_N(\mathbf{x}) = \mathbf{u}_0^\star(\mathbf{x})$: a static state feedback evaluated by optimisation |
| Feedback source | The re-solve. Between re-solves the loop is open |
| Running plant | $\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1\end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1\end{bmatrix}$, $T_s = 0.1\,\mathrm{s}$, $|u| \le 1\,\mathrm{m/s^2}$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$ |
| Open vs closed | Unmodelled $0.05\,\mathrm{m/s^2}$: open-loop plan ends $0.816\,\mathrm{m}$ off at $6\,\mathrm{s}$, re-solving ends $0.028\,\mathrm{m}$ off |
| Offset | No integral action: steady error $0.0193\,\mathrm{m}$, predicted by $(\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K})^{-1}\mathbf{B}w$ |
| Time consistency | With the Riccati terminal cost the re-solved plan equals the discarded tail; with a truncated cost it does not |
| Horizon effect | $\mathbf{K}_{\text{rh}} \to \mathbf{K}_{\text{lqr}} = [\,2.586\ \ 3.443\,]$ as $N$ grows; $N = 1$ gives a $18.8\,\mathrm{s}$ time constant |
| Receding vs shrinking | Receding: fixed $N$, no natural end. Shrinking: $N_k = N_{\text{total}} - k$ toward a fixed epoch, time-varying law |
| Computational delay | Solve from $\mathbf{A}\hat{\mathbf{x}}_k + \mathbf{B}\mathbf{u}_{k-1}$ and apply at the next frame: a modelled delay instead of an unmodelled one |

The next lesson writes down the optimisation that step 2 solves — the finite-horizon constrained optimal control problem — term by term, and says what each weight and each constraint is for.
