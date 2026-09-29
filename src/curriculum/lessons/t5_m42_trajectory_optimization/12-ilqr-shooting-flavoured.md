---
id: l12-ilqr-shooting-flavoured
title: iLQR and DDP as the shooting-flavored alternative
minutes: 22
covers:
  - Differential dynamic programming and iLQR as the shooting-flavored alternative
---

Think about learning a bike route by riding it. The first ride goes badly. At the finish you think *backward*: "At the last corner I should have leaned more. At the corner before, I should have come in slower — and if I had drifted wide there, I should have steered back this much." Then you ride again, following the improved plan but steering back whenever you drift off it. Ride, review backward, ride again with corrections. After a few rounds the route is smooth.

That loop is a real trajectory optimizer. Its name is **iLQR** — the **iterative linear quadratic regulator**, a method that improves a whole control history by repeating a backward review and a forward ride. Its older sibling is **DDP** — **[[differential dynamic programming|ilqr-name]]**, the same loop with a more careful review. The optimal control module derived both in full. This lesson places them on the map this module has been drawing.

Here is the surprise. Every iteration of iLQR simulates the real nonlinear dynamics forward, exactly as a shooting method does. Yet it does not inherit the brittleness that made indirect shooting (lesson four) so hard to start. This lesson shows why, solves a rocket ascent from a lazy guess, and says what collocation still does better.

## Where iLQR sits on the map

So far this module has met indirect shooting (guess the starting costates, integrate forward), direct shooting (a solver adjusts the controls), and collocation and pseudospectral methods (states *and* controls are unknowns, tied by defect constraints).

iLQR works in discrete time: $N$ steps of length $\Delta t$ (read "delta t"). The only unknowns are the controls $\mathbf{u}_0, \dots, \mathbf{u}_{N-1}$. The states are always computed by running the dynamics forward from the known start $\mathbf{x}_0$ — a **[[rollout|rollout]]**, the model run forward with a given control sequence.

So iLQR is a shooting method in spirit. Its problem has the shape

$$
\min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}}\; \ell_f(\mathbf{x}_N) + \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k)
\qquad\text{subject to}\qquad
\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k).
$$

The **stage cost** $\ell$ (read "ell") is the charge for each step. The **terminal cost** $\ell_f$ ("ell sub f") is the charge for where you end up. Here $\mathbf{f}$ is the one-step map: give it this step's state and control, and it returns the next state. This is a Bolza problem from lesson one, written in discrete time.

There are no defect constraints (every trajectory is simulated exactly) and no general-purpose solver: iLQR does its own linear algebra, step by step. And the end conditions are *soft* — a penalty in $\ell_f$ for missing — not hard equations.

## One iteration, in two sweeps

Start with a **nominal**: a current control sequence $\bar{\mathbf{u}}_k$ (read "u bar sub k") and the rollout $\bar{\mathbf{x}}_k$ it produces. The bar means "the plan we have now". One iteration makes the plan better in two sweeps, a backward one and then a forward one. A [[picture of the two sweeps|two-sweeps]] helps.

### The backward pass: carry the prices from the end to the start

Let $V_k(\mathbf{x})$ be the **cost-to-go**: the lowest cost you can still achieve if you are at state $\mathbf{x}$ at step $k$. At the last step it is the terminal cost itself, $V_N = \ell_f$. Its slope $V_x$ ("V sub x") and curvature $V_{xx}$ ("V sub x x") say how the remaining cost changes when the state is nudged. Notice the slope: it is a price per unit of state. That is exactly what a costate is.

At the end, the slope is known exactly. There is nothing to guess:

$$
V_x(N) = \frac{\partial \ell_f}{\partial \mathbf{x}}\bigg|_{\bar{\mathbf{x}}_N}.
$$

Now step backward. At step $k$, look at small changes $\delta\mathbf{x}$ and $\delta\mathbf{u}$ ("delta x, delta u") away from the nominal. Build a quadratic model $Q$ of "pay for this step, then act as well as possible from wherever you land". Its slopes and curvatures come from the chain rule. With $\mathbf{f}_x$ and $\mathbf{f}_u$ the **Jacobians** of the one-step map (its matrices of first derivatives), and $V'_x$, $V'_{xx}$ ("V prime") the value slope and curvature at step $k+1$:

$$
\begin{aligned}
\mathbf{Q}_x &= \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x, &
\mathbf{Q}_{xx} &= \boldsymbol{\ell}_{xx} + \mathbf{f}_x^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{xx}),\\
\mathbf{Q}_u &= \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x, &
\mathbf{Q}_{uu} &= \boldsymbol{\ell}_{uu} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_u \;(+\; V'_x\!\cdot\!\mathbf{f}_{uu}),\\
& & \mathbf{Q}_{ux} &= \boldsymbol{\ell}_{ux} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{ux}).
\end{aligned}
$$

Read $\mathbf{Q}_{uu}$ as "Q sub u u", the model's curvature in the control. The best change of control is where the model's slope in $\delta\mathbf{u}$ is zero:

$$
\delta\mathbf{u} = \mathbf{k} + \mathbf{K}\,\delta\mathbf{x},
\qquad
\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u,
\qquad
\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}.
$$

Little $\mathbf{k}$ is the **feedforward** correction: "change the plan by this much". Big $\mathbf{K}$ is the **feedback gain**: "if you find yourself off the plan by $\delta\mathbf{x}$, steer back by $\mathbf{K}\,\delta\mathbf{x}$". Then $V_x$ and $V_{xx}$ are updated for step $k$ — the discrete Riccati recursion of the LQR module, for a linearization about the nominal — and the sweep moves one step earlier, down to $k = 0$.

### DDP or iLQR: one choice

The terms in brackets combine the value slope with the *second* derivatives of the dynamics — how they curve. Those are **[[tensors|tensor-word]]**, arrays with three indices.

::: key DDP and iLQR differ by one choice
**DDP** keeps the second-derivative terms $V'_x\!\cdot\!\mathbf{f}_{xx}$, $V'_x\!\cdot\!\mathbf{f}_{uu}$, $V'_x\!\cdot\!\mathbf{f}_{ux}$: a true Newton method on the trajectory, fast near the answer but expensive per iteration and prone to a non-bowl-shaped $\mathbf{Q}_{uu}$ far from it. **iLQR** drops them: a **[[Gauss-Newton|gauss-newton]]** method, cheaper and steadier early. Both carry the value slope $V_x$ backward from the known terminal value $V_x(N) = \partial\ell_f/\partial\mathbf{x}$.
:::

### The forward pass: ride the new plan, with corrections

Now roll out again. At each step, apply

$$
\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\,\mathbf{k}_k + \mathbf{K}_k\big(\hat{\mathbf{x}}_k - \bar{\mathbf{x}}_k\big),
\qquad
\hat{\mathbf{x}}_{k+1} = \mathbf{f}(\hat{\mathbf{x}}_k, \hat{\mathbf{u}}_k).
$$

The hat marks the new candidate (read "x hat"). The number $\alpha$ ("alpha") between $0$ and $1$ is the **step length**: how much of the proposed change to take. Try $\alpha = 1$. If the new cost is not lower, halve $\alpha$ and try again. That loop is the **line search**. If the backward pass meets a $\mathbf{Q}_{uu}$ that is not positive definite — a saddle instead of a bowl — add a small number $\mu$ ("mu") to it before dividing. That is **regularization**.

Two details matter. The rollout uses the real nonlinear model, so every candidate is a trajectory the vehicle could fly. And the feedback term is never scaled by $\alpha$: its job is to keep the new ride close to the old one, where the quadratic model was built.

::: example An ascent from a lazy guess
**The vehicle.** A $1000\,\mathrm{kg}$ rocket starts at rest on flat ground under Earth gravity, $g = 9.80665\,\mathrm{m/s^2}$. Its engine gives a constant $T = 15\,000\,\mathrm{N}$ with $I_{sp} = 300\,\mathrm{s}$, so $c = 300 \times 9.80665 = 2942.0\,\mathrm{m/s}$. It burns for $50\,\mathrm{s}$, dropping $15\,000/2942.0 \times 50 = 254.93\,\mathrm{kg}$, so it burns out at $745.07\,\mathrm{kg}$.

**The control.** The only thing to choose is the **[[pitch angle|pitch-angle]]** $\theta$ ("theta"), measured from straight up. Thrust pushes $T\sin\theta$ sideways and $T\cos\theta$ upward. The state is $(x, h, v_x, v_h, m)$: downrange distance, altitude, horizontal and vertical speed, mass. There are $N = 50$ steps of $\Delta t = 1\,\mathrm{s}$, each advanced by one Runge-Kutta step.

**The cost.** The target at burnout is $h = 6000\,\mathrm{m}$, $v_x = 480\,\mathrm{m/s}$, $v_h = 170\,\mathrm{m/s}$. The terminal cost is **[[soft|soft-target]]**:

$$
\ell_f = \tfrac12\left[\left(\frac{h - 6000}{100}\right)^2 + \left(\frac{v_x - 480}{10}\right)^2 + \left(\frac{v_h - 170}{10}\right)^2\right],
\qquad
\ell = \tfrac12\,\theta_k^2\,\Delta t .
$$

In words: missing the altitude by $100\,\mathrm{m}$, or either speed by $10\,\mathrm{m/s}$, costs as much as holding one radian of pitch for one second.

**Step 1: the lazy guess.** Hold $\theta = 30^\circ$ the whole way. The rollout ends at $h = 5567.89\,\mathrm{m}$, $v_x = 432.88\,\mathrm{m/s}$, $v_h = 259.44\,\mathrm{m/s}$ — climbing too fast and not moving sideways fast enough. The terminal part costs $60.43$ and the steering costs $\tfrac12 \times 50 \times (0.5236)^2 = 6.85$, for a total of $67.29$.

**Step 2: iterate.** The costs after each accepted iteration are $67.29 \to 13.16 \to 11.75 \to 11.74 \to \dots$. After just two iterations the cost is within $0.11\,\%$ of its final value. The loop stops after $14$ iterations, when an iteration improves the cost by less than one part in $10^{12}$. The final cost is $11.7399$. No guessed costate, no retries, no second starting guess.

**Step 3: read the answer.** The pitch starts at $13.1^\circ$, reaches $29.2^\circ$ halfway, and ends at $72.7^\circ$: a smooth pitch-over, tipping steadily toward horizontal, which is what real ascents do. Burnout lands at $h = 5989.63\,\mathrm{m}$, $v_x = 478.70\,\mathrm{m/s}$, $v_h = 176.27\,\mathrm{m/s}$.

**Sanity check.** Every one of those $14$ iterates was a full rollout of the real dynamics, a trajectory you could plot and fly. The answer is close to the target but not on it — the soft cost at work.
:::

Here is the whole solver. It is short because iLQR does its own linear algebra: one scalar division per step, since the control is a single number.

```python
import numpy as np

T, c, g, N, dt = 15000.0, 2942.0, 9.80665, 50, 1.0
target = np.array([6000.0, 480.0, 170.0])       # h, vx, vh wanted at burnout
W = np.diag([1e-4, 1e-2, 1e-2])                  # 1/(100 m)^2, 1/(10 m/s)^2

def f(x, th):          # x = (downrange, h, vx, vh, m); th = pitch from vertical
    return np.array([x[2], x[3], T*np.sin(th)/x[4], T*np.cos(th)/x[4] - g, -T/c])

def step(x, th):       # one RK4 step of length dt
    k1 = f(x, th); k2 = f(x + dt/2*k1, th)
    k3 = f(x + dt/2*k2, th); k4 = f(x + dt*k3, th)
    return x + dt/6*(k1 + 2*k2 + 2*k3 + k4)

def rollout(x0, u):
    xs = [x0]
    for th in u:
        xs.append(step(xs[-1], th))
    return np.array(xs)

def cost(xs, u):
    e = xs[-1, 1:4] - target
    return 0.5*e @ W @ e + 0.5*dt*np.sum(u**2)

def jac(x, th, e=1e-6):  # A = df/dx, B = df/du by central differences
    A = np.column_stack([(step(x + e*d, th) - step(x - e*d, th))/(2*e) for d in np.eye(5)])
    return A, (step(x, th + e) - step(x, th - e))/(2*e)

def ilqr(x0, u, iters=100):
    xs = rollout(x0, u); J = cost(xs, u); history = [J]
    for _ in range(iters):
        Vx = np.zeros(5); Vxx = np.zeros((5, 5))          # backward pass
        Vx[1:4] = W @ (xs[-1, 1:4] - target); Vxx[1:4, 1:4] = W
        k = np.zeros(N); K = np.zeros((N, 5))
        for i in reversed(range(N)):
            A, B = jac(xs[i], u[i])
            Qx, Qu = A.T @ Vx, dt*u[i] + B @ Vx
            Qxx, Quu, Qux = A.T @ Vxx @ A, dt + B @ Vxx @ B, B @ Vxx @ A
            k[i], K[i] = -Qu/Quu, -Qux/Quu
            Vx, Vxx = Qx + K[i]*Qu, Qxx + np.outer(K[i], Qux)
        for a in 0.5**np.arange(20):                      # forward pass
            xn = [x0]; un = np.zeros(N)
            for i in range(N):
                un[i] = u[i] + a*k[i] + K[i] @ (xn[-1] - xs[i])
                xn.append(step(xn[-1], un[i]))
            xn = np.array(xn); Jn = cost(xn, un)
            if Jn < J:
                break
        if J - Jn < 1e-12*J:
            break
        xs, u, J = xn, un, Jn; history.append(J)
    return u, xs, history, Vx

x0 = np.array([0.0, 0.0, 0.0, 0.0, 1000.0])
u, xs, history, Vx0 = ilqr(x0, np.full(N, np.radians(30)))
print(np.round(history[:6], 2), len(history) - 1, round(history[-1], 4))
print(np.round(xs[-1], 2), np.round(np.degrees(u[[0, 25, 49]]), 1))
print(np.round(Vx0, 5))
# [67.29 13.16 11.75 11.74 11.74 11.74] 14 11.7399
# [8413.59 5989.63  478.7   176.27  745.07] [13.1 29.2 72.7]
# [ 0.      -0.00104 -0.01299  0.01086 -0.01937]
```

The last line prints $V_x$ at the start of the flight; it comes back soon.

What do DDP's extra terms change? Run the same ascent from the same guess with them kept. DDP creeps at first — $67.29 \to 50.01 \to 38.27 \to 33.34 \to 16.32 \to \dots$ — and needs $7$ iterations to get within $1\,\%$ of the answer, where iLQR needed $2$. Near the end it is quicker, meeting the tight stopping test $3$ iterations sooner, at the same cost, $11.7399$. That is the usual pattern, and why engineers usually pick iLQR: the early iterations are where the time goes.

## Why it is not brittle

Remember what made indirect shooting fragile. Lesson four guessed the costates at $t_0$ and integrated them *forward* with the states, and a tiny error in the guess grew along the way. For the orbit transfer the guess had to be right to about four significant figures, and a costate has no physical feel you could guess from. iLQR avoids every part of that trap.

- **It never guesses a price.** Its price, $V_x$, starts at the end, where the terminal cost gives it exactly.
- **It carries the price backward,** the direction in which a costate equation behaves well (see the note below).
- **Its forward pass steers.** The gains $\mathbf{K}_k$ pull each rollout back toward the nominal, so an error at step $k$ is corrected at step $k+1$ instead of being carried to the end.

::: key Why iLQR sidesteps the shooting brittleness of indirect methods
It is shooting: every iterate is a forward-simulated, dynamically feasible trajectory, exactly as in direct single shooting. It avoids shooting's ill-conditioning because the correction at every step comes from a **backward** recursion that starts from the known terminal value, and because the forward pass applies the feedback gains $\mathbf{K}_k$ at every step — rather than depending on a costate guessed once at $t_0$ and never corrected until the whole horizon has played out.
:::

The feedback is not decoration. Delete the $\mathbf{K}$ term from the code above and the very first iteration fails: not one of twenty halvings of $\alpha$ lowers the cost. The feedforward $\mathbf{k}$ was computed *assuming* the feedback would be applied; replayed open loop, it points uphill. (Its dot product with the true cost gradient is $+93.8$.)

The basin is wide too. From a constant pitch of $0^\circ$, $45^\circ$, $60^\circ$, $90^\circ$, $120^\circ$, even $180^\circ$ (engine pointing straight down), iLQR lands on the same $11.7399$ in $14$ to $33$ iterations.

::: note Why backward is the safe direction for a price
Take the simplest dynamics, $\dot{x} = a\,x$ with one state and no running cost. The costate equation from lesson two is $\dot{\lambda} = -\partial H/\partial x = -a\,\lambda$. Its solution is $\lambda(t) = \lambda(t_f)\,e^{a(t_f - t)}$.

Suppose the state is strongly damped, $a = -2\,\mathrm{s^{-1}}$. Forward in time, the state shrinks like $e^{-2t}$: well behaved. The costate is the mirror image. Integrated *forward* from a guessed $\lambda(0)$, it grows like $e^{+2t}$, so any error in the guess is multiplied by $e^{2t_f}$ — about $2.2\times10^{4}$ after $5\,\mathrm{s}$. Integrated *backward* from $t_f$, it shrinks like $e^{-2(t_f - t)}$, and errors shrink with it.

With many states the same happens mode by mode: a mode that decays forward for the state grows forward for the costate. Shooting runs both forward, so whichever is unstable blows up. iLQR runs each in its safe direction: states forward in the rollout, prices backward in the backward pass.
:::

## The value slope really is the costate

The optimal control module claimed that iLQR's value slope $V_x$ *is* the costate, satisfying Pontryagin's conditions at convergence. Lesson ten checked a direct method's multipliers against a costate; now check iLQR the same way.

::: note Why it has to be true
Write the discrete Hamiltonian at step $k$ as $H_k = \ell(\mathbf{x}_k,\mathbf{u}_k) + \boldsymbol{\lambda}_{k+1}^\top\mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$. The discrete version of lesson two's conditions is: $\boldsymbol{\lambda}_N = \partial\ell_f/\partial\mathbf{x}$, then $\boldsymbol{\lambda}_k = \boldsymbol{\ell}_x + \mathbf{f}_x^\top\boldsymbol{\lambda}_{k+1}$ going backward, and $\partial H_k/\partial\mathbf{u} = \boldsymbol{\ell}_u + \mathbf{f}_u^\top\boldsymbol{\lambda}_{k+1} = \mathbf{0}$ at every step.

Now look at the backward pass at convergence. The plan no longer changes, so $\mathbf{k} = \mathbf{0}$, which means $\mathbf{Q}_u = \mathbf{0}$. The value-slope update then reduces to $V_x = \mathbf{Q}_x = \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x$, starting from $V_x(N) = \partial\ell_f/\partial\mathbf{x}$. That is the costate recursion, line for line, with $V_x$ in the place of $\boldsymbol{\lambda}$. And $\mathbf{Q}_u = \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x = \mathbf{0}$ is the stationarity condition $\partial H_k/\partial\mathbf{u} = \mathbf{0}$. So a converged iLQR run has solved the discrete Pontryagin conditions without ever writing them down.
:::

::: example The value slope, checked two ways
The converged ascent printed $V_x(0) = (0,\ -0.00104,\ -0.01299,\ +0.01086,\ -0.01937)$, in the order $(x, h, v_x, v_h, m)$. Each entry is a shadow price: how much the best cost changes per unit of that starting state.

**Step 1: downrange.** The first entry is exactly $0$. Neither the cost nor the dynamics care where along the ground you start, so a price of zero is right.

**Step 2: altitude, by hand.** Starting $1\,\mathrm{m}$ higher changes nothing about the flight except that burnout is $1\,\mathrm{m}$ higher too. So the price is the slope of the terminal cost in $h$: the weight times the miss, $10^{-4}\times(5989.63 - 6000) = 10^{-4}\times(-10.37) = -0.001037$. That matches the printed $-0.00104$. Negative, because burnout is short of the target, so a head start helps.

**Step 3: vertical speed, by hand.** Starting with $1\,\mathrm{m/s}$ more upward speed adds $1\,\mathrm{m/s}$ to burnout $v_h$ and, over $50\,\mathrm{s}$, $50\,\mathrm{m}$ to burnout altitude. Its price is $0.01\times6.272 + 10^{-4}\times(-10.372)\times50 = 0.06272 - 0.05186 = 0.01086$. That matches the printed $+0.01086$. Positive: burnout is already $6.27\,\mathrm{m/s}$ too fast upward, and that outweighs the altitude help.

**Step 4: mass, by brute force.** Extra mass changes the acceleration all the way up, so no hand formula gives this price. Instead, run the complete iLQR solve from the lazy $30^\circ$ guess twice more, from $m_0 = 1000.01\,\mathrm{kg}$ and from $999.99\,\mathrm{kg}$, and take the central difference of the final costs:

$$
\frac{J^\star(1000.01) - J^\star(999.99)}{0.02} = -0.0193685
\qquad\text{against}\qquad
V_x(0)_{[m]} = -0.0193685 .
$$

They agree to about four parts in a million. One number came from bookkeeping inside a single solve; the other from two black-box re-solves that never looked at $V_x$. (The nudge must be small: $\pm1\,\mathrm{kg}$ gives $-0.01822$, six percent off, because the best cost bends as $m_0$ changes.)

**Sanity check.** A heavier rocket burns out slower. Burnout is too fast upward, so slower helps: a negative mass price fits.
:::

## What collocation still buys

None of this makes iLQR a replacement for direct transcription. Put the two side by side.

| | iLQR / DDP | Collocation NLP |
| --- | --- | --- |
| Unknowns | Controls only; states come from rollouts | States and controls at every node |
| Every iterate flyable? | Yes | No, until the defects reach zero |
| End conditions | Soft penalties in $\ell_f$ | Hard equality constraints |
| Path limits (throttle, glide slope, heating) | Bolted on: box-QP, augmented Lagrangian, or squashing | One inequality per node |
| Free final time | Awkward: $N\,\Delta t$ is fixed | $t_f$ is one more unknown |
| Work per iteration | Grows linearly with $N$ | Linear too, but only if a sparse solver finds the band |
| Returns a feedback policy? | Yes, the gains $\mathbf{K}_k$ | No, only the plan |

The biggest gap is hard constraints, such as a gimbal limit or a dynamic-pressure ceiling. Collocation adds one inequality per node; iLQR's backward pass has no place for one. The fixes — a small box-constrained quadratic program at every step (control-limited DDP), an **[[augmented Lagrangian|augmented-lagrangian]]** wrapper around the whole solve, or a squashing function that maps an unbounded variable into the allowed range — each add iterations or distort the answer near the bound. That is the concrete version of the argument this module's exercises ask for: in a direct method, constraints are added declaratively, not re-derived.

The advantages are real too. Each iteration costs work proportional to $N$ with no sparse matrix to factor. The gains $\mathbf{K}_k$ are a ready-made feedback law around the plan. And a warm start from the last solution is natural, which makes iLQR a standard engine for **[[model predictive control|mpc]]**, where the problem is re-solved many times a second on board. The **[[trajax|trajax]]** library on this module's tools list is built around it.

::: warning A converged iLQR solve is a local answer
The ascent converged from $30^\circ$ and from many other guesses, but not from every one. Start from $\theta = -30^\circ$ — leaning backward — and iLQR runs $59$ iterations, the cost falling at every one, and stops at $127.74$: eleven times worse than $11.7399$. The last eight pitch angles of that answer are $361^\circ, 363^\circ, 366^\circ, 83^\circ, 87^\circ, 382^\circ, 94^\circ, 397^\circ$. An angle of $361^\circ$ points the same way as $1^\circ$, but the penalty $\tfrac12\theta^2$ does not know that, and the plan is stuck between **[[wound-up angles|angle-wrap]]**. Start from $150^\circ$ and it stops at $749.70$ for the same reason.

Nothing in the convergence log flags either one. Like any gradient method on a nonconvex problem, iLQR gives no certificate and no global optimum, and its answer depends on the guess. Its basin is wide, but wide is not everywhere. Plot the answer and ask whether a vehicle would fly it.
:::

## Check yourself

::: check
Direct single shooting and iLQR both simulate the nonlinear dynamics forward from a control sequence. Why does only one of them inherit single shooting's ill-conditioning?
:::

::: answer
Direct single shooting measures how the end state depends on an early control by chaining that effect through the whole horizon, with no correction along the way. Whatever the forward dynamics do to a small change — including growing it — lands in the sensitivities the solver must use.

iLQR's rollout applies a feedback correction $\mathbf{K}_k(\hat{\mathbf{x}}_k - \bar{\mathbf{x}}_k)$ at every step, from a backward pass that has already worked out how the rest of the flight should respond. A deviation at step $k$ is pulled back at step $k+1$ instead of compounding. And the backward pass starts from the exactly known terminal price and runs in the direction where prices are well behaved. The forward simulation is the same in both; the stabilizing backward correction is the difference.
:::

::: check
The ascent's converged burnout altitude was $5989.63\,\mathrm{m}$, not the $6000\,\mathrm{m}$ target, and its vertical speed was $176.27\,\mathrm{m/s}$, not $170$. Did iLQR fail to converge?
:::

::: answer
No. The target was a soft penalty, not a hard equation. The converged answer is where getting closer would cost more in steering (the $\tfrac12\theta^2$ term) than it saves in terminal penalty. A $10.37\,\mathrm{m}$ altitude miss costs only $\tfrac12(10.37/100)^2 = 0.0054$, not worth bending the pitch program to close.

The evidence of convergence is elsewhere: the cost stopped changing to twelve digits, and the value slope passed independent checks. To land exactly on target, raise the terminal weights (the miss shrinks, but the problem gets stiffer and slower) or use a method with a hard terminal constraint, such as collocation or an augmented-Lagrangian iLQR.
:::

::: check
Suppose the ascent needs a hard limit $|\theta| \le \theta_{\max}$ from the engine's gimbal. Without redoing any algebra, say what changes in iLQR and what changes in a collocation transcription of the same problem.
:::

::: answer
In collocation, the change is one line: add $-\theta_{\max} \le \theta_k \le \theta_{\max}$ as a bound at every node, for the same NLP solver. The defects do not change.

In iLQR, the closed-form step $\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u$ is wrong whenever it would push $\theta$ past the bound. Control-limited DDP replaces it with a small box-constrained quadratic program at every step of every backward pass, and zeroes the feedback gain of a control sitting on its bound. The alternatives are an augmented-Lagrangian wrapper, or a squashed variable such as $\theta = \theta_{\max}\tanh(s)$. The constraint is native to one formulation and bolted onto the other.
:::

::: check
The mass price $V_x(0)_{[m]} = -0.0193685$ matched a re-solved finite difference to about four parts in a million. Why is that check more convincing than trusting the theory that says $V_x$ is the costate?
:::

::: answer
The theory is about the algorithm's own bookkeeping: at convergence $\mathbf{Q}_u = \mathbf{0}$ and the value-slope recursion becomes the costate recursion. A wrong Jacobian, a sign slip or an unconverged run would corrupt the bookkeeping, and nothing inside the solve would notice.

The finite difference treats the whole solve as a black box: it changes only the input ($m_0$), reads only the output (the best cost), and never sees $V_x$. Agreement means the real optimized cost responds exactly as $V_x$ predicted — a check against the problem itself, not the algorithm's opinion of itself.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Problem shape | $\min \ell_f(\mathbf{x}_N) + \sum_k \ell(\mathbf{x}_k,\mathbf{u}_k)$ subject to $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$; controls are the only unknowns |
| Backward pass | From $V_x(N) = \partial\ell_f/\partial\mathbf{x}$, build $\mathbf{Q}$ terms; $\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u$, $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ |
| Forward pass | $\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\mathbf{k}_k + \mathbf{K}_k(\hat{\mathbf{x}}_k - \bar{\mathbf{x}}_k)$ through the real dynamics; line search on $\alpha$, regularization $\mu$ |
| DDP vs iLQR | DDP keeps $V'_x\!\cdot\!\mathbf{f}_{xx}$-type terms (Newton); iLQR drops them (Gauss-Newton) |
| Shooting character | Every iterate is a flyable rollout, like direct single shooting |
| Why not brittle | No guessed price; prices carried backward (their stable direction); feedback in every rollout |
| Ascent example | $30^\circ$ guess: cost $67.29 \to 13.16 \to 11.75 \to \dots \to 11.7399$ in $14$ iterations; pitch $13.1^\circ \to 72.7^\circ$ |
| DDP on the same problem | $7$ iterations to within $1\,\%$ (iLQR: $2$), same final cost |
| Value slope = costate | $V_x(0) = (0, -0.00104, -0.01299, +0.01086, -0.01937)$; mass entry matches re-solves ($\pm0.01\,\mathrm{kg}$) to $4\times10^{-6}$ |
| Collocation wins at | Hard constraints, exact end conditions, free final time |
| iLQR wins at | Linear-in-$N$ work, feedback gains, warm starts for MPC |
| Caveat | Local answers: a $-30^\circ$ start gives $127.74$ |

Everything so far has assumed that a transcribed problem, once handed to a general solver, is easy for it to chew through. The next three lessons take that assumption apart: first the sparsity pattern that decides how long each solver iteration takes, then the scaling that decides whether it converges at all, then the warm starts that get it moving fast.

::: context ilqr-name Where the names come from
**Differential dynamic programming** was introduced by David Mayne in 1966 and developed in the 1970 book *Differential Dynamic Programming* by David Jacobson and Mayne. "Dynamic programming" is Richard Bellman's name for solving a problem backward, one stage at a time; "differential" says it works with small changes around a nominal. **iLQR** was named by Weiwei Li and Emanuel Todorov in 2004, who used it to model how the brain controls arm movements. Each iteration solves a linear quadratic regulator problem about the current plan, which is where "iterative LQR" comes from.
:::

::: context rollout A rollout is a simulation
To **roll out** a plan is to run the simulator forward with that control sequence and see what happens. Nothing is optimized during a rollout; it is the truth test. The word came into control from game-playing programs, where "rolling out" a position meant playing the game forward to the end to see who wins. In iLQR every candidate plan is judged only after a rollout of the full nonlinear model, which is why every iterate is a trajectory the vehicle could fly. Here, to scale, are three rollouts of this lesson's ascent: the $30^\circ$ guess, the plan after one iteration, and the final answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="31.5" x2="345" y2="31.5" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="56" y="26" font-size="11" fill="#b4232c">target altitude 6000 m</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="81.7">4 km</text><text x="45" y="127.8">2 km</text><text x="45" y="174">0</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="181.8" y="185">5 km</text><text x="313.6" y="185">10 km</text><text x="200" y="198">downrange</text>
  </g>
  <polyline points="50.0,170.0 51.6,169.4 56.4,167.5 64.5,164.3 76.0,159.5 91.0,153.2 109.4,145.1 131.5,135.2 157.2,123.3 186.8,109.3 220.2,93.0 257.6,74.4 299.0,53.1 321.3,41.5" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="50.0,170.0 50.8,169.1 53.4,166.4 58.1,161.9 65.0,155.4 74.7,147.0 87.5,136.7 104.0,124.6 124.7,110.8 150.3,95.5 181.0,78.9 217.6,61.1 260.6,42.7 285.0,33.7" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <polyline points="50.0,170.0 50.7,169.1 53.1,166.3 57.2,161.6 63.4,155.0 72.1,146.3 83.5,135.5 98.2,122.8 117.0,108.2 140.4,92.2 169.5,75.0 204.9,57.4 247.6,40.1 271.8,31.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="300" y="80" font-size="11" fill="#6c7a93">30° guess</text>
  <text x="235" y="110" font-size="11" fill="#1d6fd1">final</text>
  <text x="196" y="44" font-size="11" fill="#1f2a44">after 1 iteration</text>
</svg>
```
:::

::: context two-sweeps Backward for prices, forward for the plan
The backward pass starts at the last step, where the price of each state is known from the terminal cost, and works back to the first step, computing a correction $\mathbf{k}_k$ and a gain $\mathbf{K}_k$ at each step. The forward pass then starts from the known initial state and rolls out the corrected plan.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="85" x2="330" y2="85" stroke="#6c7a93" stroke-width="1.5"/>
  <g fill="#1f2a44">
    <circle cx="30" cy="85" r="4"/><circle cx="90" cy="85" r="4"/><circle cx="150" cy="85" r="4"/>
    <circle cx="210" cy="85" r="4"/><circle cx="270" cy="85" r="4"/><circle cx="330" cy="85" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="104">k = 0</text><text x="150" y="104">k</text><text x="330" y="104">k = N</text>
  </g>
  <path d="M320,55 L40,55" stroke="#b4232c" stroke-width="2.5" fill="none"/>
  <polygon points="32,55 44,49 44,61" fill="#b4232c"/>
  <text x="180" y="44" font-size="12" fill="#b4232c" text-anchor="middle">backward pass: V_x, V_xx, then k and K at each step</text>
  <text x="330" y="30" font-size="11" fill="#b4232c" text-anchor="end">starts from V_x(N) = dℓf/dx</text>
  <path d="M40,125 L320,125" stroke="#1d6fd1" stroke-width="2.5" fill="none"/>
  <polygon points="328,125 316,119 316,131" fill="#1d6fd1"/>
  <text x="180" y="148" font-size="12" fill="#1d6fd1" text-anchor="middle">forward pass: rollout with u = ū + αk + K(x − x̄)</text>
  <text x="30" y="165" font-size="11" fill="#1d6fd1">starts from the known x₀</text>
</svg>
```
:::

::: context tensor-word Three-index arrays
A vector has one index, a matrix two. The second derivatives of the dynamics have three: $\partial^2 f_i/\partial x_j\partial x_l$ needs $i$, $j$ and $l$. That is a **tensor** in the programmer's sense, a box of numbers rather than a sheet. For the five-state ascent, $\mathbf{f}_{xx}$ holds $5\times5\times5 = 125$ numbers at each of $50$ steps. DDP contracts it with the value slope, $V'_x\!\cdot\!\mathbf{f}_{xx}$, to get back an ordinary $5\times5$ matrix. Computing those boxes is most of DDP's extra cost.
:::

::: context gauss-newton Newton's method, minus one term
Newton's method minimizes a function using its exact slope and exact curvature. When the cost is "a sum of squares of some model's outputs", the exact curvature has two parts: one from the model's first derivatives and one from its second derivatives. **Gauss-Newton** keeps only the first part. It is cheaper, always gives a bowl rather than a saddle, and is nearly as good when the model is close to straight or the fit is close to perfect. iLQR is Gauss-Newton applied to a trajectory; DDP is the full Newton method.
:::

::: context pitch-angle Measuring pitch from vertical
Here $\theta = 0$ means the rocket points straight up and $\theta = 90^\circ$ means it points along the ground. Resolve the thrust into two pieces with the triangle: the sideways piece is $T\sin\theta$ and the upward piece is $T\cos\theta$. At the converged answer's final $72.7^\circ$, the upward piece is only $\cos 72.7^\circ \approx 0.30$ of the thrust.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="160" x2="120" y2="20" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="126" y="28" font-size="11" fill="#6c7a93">vertical</text>
  <line x1="120" y1="160" x2="206.0" y2="37.1" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="206.0,37.1 193.1,45.1 202.9,52.0" fill="#1f2a44"/>
  <text x="212" y="40" font-size="12" fill="#1f2a44">T</text>
  <line x1="120" y1="160" x2="206.0" y2="160" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="163" y="175" font-size="11" fill="#1d6fd1" text-anchor="middle">T sin θ (sideways)</text>
  <line x1="206.0" y1="160" x2="206.0" y2="37.1" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="212" y="105" font-size="11" fill="#b4232c">T cos θ (up)</text>
  <path d="M120,110 A50,50 0 0,1 148.7,119.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="100" font-size="12" fill="#1f2a44">θ</text>
  <text x="30" y="60" font-size="11" fill="#1f2a44">drawn at θ = 35°</text>
</svg>
```
:::

::: context soft-target Soft targets and how to pick weights
A **soft** target is a penalty for missing, not a rule that forbids missing. The weights were chosen with a common rule of thumb: weight each error by one over the square of the miss you would call "about one unit of bad". Here that is $100\,\mathrm{m}$ of altitude and $10\,\mathrm{m/s}$ of speed, so the weights are $1/100^2 = 10^{-4}$ and $1/10^2 = 10^{-2}$. Dividing each error by its tolerable size also puts all the terms on the same footing, the same scaling idea lesson fourteen develops for whole problems.
:::

::: context augmented-lagrangian Turning a constraint into an adjustable penalty
An **augmented Lagrangian** method handles a constraint $c = 0$ by adding both a multiplier term $\lambda c$ and a penalty $\tfrac{\rho}{2}c^2$ to the cost, solving the easier unconstrained problem, then updating $\lambda$ from how badly $c$ was missed and solving again. After a few outer rounds the constraint is met accurately without the penalty weight $\rho$ ("rho") having to go to infinity. Wrapped around iLQR, each outer round is a full iLQR solve, which is where the extra iterations come from.
:::

::: context mpc Re-planning many times a second
In **model predictive control** the vehicle solves a short optimal control problem from its current state, flies the first bit of the answer, measures where it really is, and solves again. Each solve starts from the previous answer shifted one step, so it is already nearly right and needs only an iteration or two. iLQR fits this job: its cost per iteration is predictable, and it hands back feedback gains that can steer between solves. Lesson fifteen returns to warm starting.
:::

::: context trajax A trajectory library in JAX
**trajax** is an open-source Python library from Google Research, built on JAX, a package that computes exact derivatives of Python code automatically. It provides iLQR and a constrained version based on an augmented Lagrangian, among other optimizers. Because JAX supplies the Jacobians $\mathbf{f}_x$ and $\mathbf{f}_u$ exactly, you do not need the finite-difference `jac` function from this lesson's code. Lesson sixteen surveys it with the other tools.
:::

::: context angle-wrap Angles that wind up
An angle of $361^\circ$ points in the same direction as $1^\circ$, but to the arithmetic they are different numbers: $6.30$ radians against $0.017$. A penalty like $\tfrac12\theta^2$ charges the first one about $130\,000$ times more.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="100" x2="120" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="120" cy="100" r="35" fill="none" stroke="#f2b880" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="120" y1="100" x2="143.9" y2="34.2" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="143.9,34.2 144.5,47.2 135.1,43.8" fill="#1d6fd1"/>
  <circle cx="120" cy="100" r="3" fill="#1f2a44"/>
  <text x="150" y="30" font-size="12" fill="#1d6fd1">thrust direction</text>
  <text x="120" y="152" font-size="11" fill="#f2b880" text-anchor="middle">one extra full turn</text>
  <g font-size="12" fill="#1f2a44">
    <text x="200" y="80">θ = 20°: ½θ² = 0.061</text>
    <text x="200" y="100">θ = 380°: ½θ² = 22.0</text>
    <text x="200" y="125" font-size="11" fill="#6c7a93">same arrow, 361× the charge</text>
  </g>
</svg>
```

 A gradient method moves the angle smoothly, so to get from $361^\circ$ down to $1^\circ$ it would have to pass through every angle in between, pointing the engine the wrong way. Common fixes are to penalize $1 - \cos\theta$ instead, which treats the two alike, or to steer with a unit thrust direction instead of an angle.
:::
