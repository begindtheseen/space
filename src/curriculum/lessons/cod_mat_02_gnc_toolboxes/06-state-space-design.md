---
id: l06-state-space-design
title: 'State-space design: place, lqr and kalman'
minutes: 20
covers:
  - ctrb, obsv, gram; place, acker; lqr, dlqr, lqi; kalman, lqg
---

Try balancing a broom upright on the palm of your hand. Two things happen at once. Your eyes watch the top of the broom and your brain guesses where it is heading, even though you cannot see its speed directly. And your hand moves to push the broom back under itself, harder when it leans more and when it is falling faster. Seeing and pushing are two different jobs, and you do both without thinking.

A rocket's attitude control does the same two jobs with matrices. The **controller** decides the push from the **state** — every number needed to predict the motion, such as the pitch angle and the pitch rate. The **[[estimator|estimator-word]]** works out the state from noisy sensors, including the parts no sensor measures directly.

Lessons 3 and 4 shaped a loop one transfer function at a time. This lesson works straight from the state-space model of lesson 1, $\dot{x} = Ax + Bu$, $y = Cx + Du$, and lets MATLAB compute gains for every state at once. First you ask two yes-or-no questions (`ctrb`, `obsv`, `gram`). Then you place the closed-loop poles by hand (`place`, `acker`), or let a cost function choose them (`lqr`, `dlqr`, `lqi`). Last, you build the estimator (`kalman`) and join the two (`lqg`).

All the examples use the rigid pitch plant from lesson 4 in state form. The state is $x = [\theta;\ q]$, the pitch angle $\theta$ ("theta") and the pitch rate $q$, and the input $u$ is the control torque divided by the moment of inertia, an angular acceleration in $\mathrm{rad/s^2}$:

$$
A = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}, \qquad B = \begin{bmatrix} 0 \\ 1 \end{bmatrix}.
$$

The first row says "angle changes at the rate $q$". The second says "rate changes at the rate $u$".

## Can you steer it? Can you see it?

Before designing anything, ask whether the job is possible.

A system is **controllable** if the inputs can drive the state from anywhere to anywhere. Picture a shopping cart with one stuck wheel: you can push it forward, but no push moves it sideways. That sideways direction is **uncontrollable**, and no gain can fix it.

The test builds the **controllability matrix** from $B$ and repeated products with $A$:

$$
\mathcal{C} = \begin{bmatrix} B & AB & A^2B & \cdots & A^{n-1}B \end{bmatrix}.
$$

Here $n$ is the number of states. The system is controllable when $\mathcal{C}$ has **[[rank|rank-word]]** $n$ — when its columns point in $n$ genuinely different directions. $B$ is where a push goes right away; $AB$ is where the dynamics carry that push a moment later; and so on.

A system is **observable** if you can work out the whole state from the outputs, given enough time. The test is the same idea turned on its side:

$$
\mathcal{O} = \begin{bmatrix} C \\ CA \\ \vdots \\ CA^{n-1} \end{bmatrix}, \qquad \text{observable when } \operatorname{rank}\mathcal{O} = n.
$$

```matlab
A = [0 1; 0 0];  B = [0; 1];
Co = ctrb(A, B)          % [B, A*B]
% Co =
%      0     1
%      1     0
rank(Co)                 % 2: controllable
rank(obsv(A, [0 1]))     % rate gyro only
% ans = 1                (not observable)
rank(obsv(A, [1 0]))     % angle sensor
% ans = 2                (observable)
```

The rate gyro result makes physical sense. A gyro measures only $q$. Integrating it gives how much the angle **changed**, never where it **started**, so the angle itself stays unknown. Measure the angle, and its rate of change reveals $q$.

### gram: how controllable?

A rank is a yes-or-no answer, and real systems are rarely that clean. A push might reach a direction, but only weakly, so reaching it takes enormous effort. The **controllability Gramian** $W_c$ measures that. For a stable system,

$$
W_c = \int_0^\infty e^{At}BB^{\mathsf T}e^{A^{\mathsf T}t}\,dt,
$$

and `gram(sys, 'c')` computes it (`gram(sys, 'o')` gives the observability Gramian). The **[[transpose|transpose-word]]** $B^{\mathsf T}$, read "B transpose", flips rows and columns. You do not need to evaluate the integral by hand. What matters is how to read the answer: the energy needed to push the state a unit distance in some direction goes like $1/\lambda$, where $\lambda$ is the Gramian's eigenvalue for that direction. A tiny eigenvalue means a direction that is nearly out of reach.

::: example A system that passes the rank test but barely
Take two stable modes, $A = \begin{bmatrix} -1 & 0 \\ 0 & -2 \end{bmatrix}$, and an input that reaches the second mode only weakly, $B = \begin{bmatrix} 1 \\ 0.01 \end{bmatrix}$.

**Step 1, the rank test.** $AB = \begin{bmatrix} -1 \\ -0.02 \end{bmatrix}$, so $\mathcal{C} = \begin{bmatrix} 1 & -1 \\ 0.01 & -0.02 \end{bmatrix}$. Its determinant is $1 \times (-0.02) - (-1)(0.01) = -0.01$, not zero, so the rank is 2. Controllable, says the test.

**Step 2, the Gramian.** `Wc = gram(ss(A,B,eye(2),0), 'c')` gives

$$
W_c = \begin{bmatrix} 0.5 & 0.00333 \\ 0.00333 & 0.000025 \end{bmatrix}, \qquad \text{eigenvalues } 0.500 \text{ and } 2.78 \times 10^{-6}.
$$

**Step 3, read it.** The ratio of the eigenvalues is $0.500 / (2.78 \times 10^{-6}) \approx 180{,}000$. Moving the state a unit distance along the weak direction costs about 180,000 times the energy of moving it along the strong one. In practice that direction is uncontrollable, whatever the rank says.

**Sanity check.** The diagonal alone predicts $0.5/0.000025 = 20{,}000$: the second mode gets 1 percent of the input, energy goes as the square ($100^2 = 10{,}000$), and that mode also decays twice as fast (another factor of 2). The eigenvalue ratio is larger still, because one input drives both modes, so moving one without the other is even harder.
:::

::: warning rank is fragile on big models
`rank(ctrb(A,B))` is fine for a few states. For a structural model with dozens of states, the powers $A^{n-1}$ grow so large that rounding errors decide the answer. Use the Gramian's eigenvalues, or a balanced realization (lesson 7), to judge how controllable a big model really is. Note also that `gram` needs a stable $A$; the integral never settles otherwise.
:::

## Placing poles by hand: place and acker

With every state available, the simplest controller multiplies the state by a row of gains and pushes back: $u = -Kx$. Substitute into $\dot{x} = Ax + Bu$:

$$
\dot{x} = (A - BK)\,x.
$$

The closed-loop poles are the eigenvalues of $A - BK$. If the system is controllable, a $K$ exists that puts those poles **anywhere you like**. `place(A, B, p)` finds it for a list of desired poles `p`.

For the pitch plant, $K = [k_1\ \ k_2]$ gives

$$
A - BK = \begin{bmatrix} 0 & 1 \\ -k_1 & -k_2 \end{bmatrix},
$$

whose characteristic polynomial is $s^2 + k_2 s + k_1$. So $k_1$ acts like a spring on the angle and $k_2$ like a damper on the rate — the same job as the P and D of a PD controller.

::: example Placing the pitch poles at −2 ± 2j
You want poles at $s = -2 \pm 2j$: a natural frequency of $\sqrt{2^2 + 2^2} = 2.83\,\mathrm{rad/s}$ and damping ratio $2/2.83 = 0.707$.

**Step 1, the polynomial you want.** $(s + 2 - 2j)(s + 2 + 2j) = (s + 2)^2 + 4 = s^2 + 4s + 8$.

**Step 2, match coefficients.** $s^2 + k_2 s + k_1 = s^2 + 4s + 8$, so $k_2 = 4$ and $k_1 = 8$.

**Step 3, let MATLAB do it.**

```matlab
K  = place(A, B, [-2+2i, -2-2i])
% K =
%      8     4
eig(A - B*K)
% ans =
%   -2.0000 + 2.0000i
%   -2.0000 - 2.0000i
```

**Sanity check.** The units work: $k_1$ turns radians of angle into $\mathrm{rad/s^2}$ of acceleration, so it has units of $1/\mathrm{s^2}$, and $8\,\mathrm{s^{-2}}$ is $\omega_n^2 = 2.83^2$. The poles came out exactly where asked.
:::

`acker(A, B, p)` does the same job with a closed formula, Ackermann's. It works only with a single input and gets numerically unreliable beyond a handful of states, so use it for small hand-checkable problems. `place` handles several inputs and is numerically robust, but it cannot place the same pole more times than there are independent inputs.

Pole placement has a weakness. It tells you where the poles go, but not what that costs. Ask for poles twice as fast and the angle gain quadruples, and nothing warns you that the actuator cannot deliver.

## LQR: let a cost choose the poles

The **linear-quadratic regulator** (LQR) turns the question around. Instead of saying where the poles go, you say what you care about, as a price, and MATLAB finds the gain that makes the total price as small as possible. The price is

$$
J = \int_0^\infty \left( x^{\mathsf T}Qx + u^{\mathsf T}Ru \right) dt.
$$

Read $x^{\mathsf T}Qx$ as "x transpose Q x". With a diagonal $Q$ it is a weighted sum of squares, $Q_{11}\theta^2 + Q_{22}q^2$: every bit of state error adds to the bill, and big errors cost much more than small ones. $u^{\mathsf T}Ru$ does the same for the control effort. $Q$ and $R$ are **weighting matrices**; you choose them.

::: key
lqr: when you pick Q and R you are choosing the relative price of state error versus control effort. Larger Q entries buy tighter regulation of those states at the cost of more actuator activity; larger R entries buy quieter actuators and slower response. It is a design dial, not a tuning accident.
:::

`[K, S, P] = lqr(A, B, Q, R)` returns the gain $K$, the solution $S$ of the **[[Riccati equation|riccati]]** that the math solves along the way, and the closed-loop poles $P$. The control law is again $u = -Kx$. (`lqr(sys, Q, R)` accepts a state-space model instead of the matrices.)

```matlab
K1 = lqr(A, B, diag([1 0]), 1)
% K1 =
%     1.0000    1.4142
K2 = lqr(A, B, diag([100 0]), 1)
% K2 =
%    10.0000    4.4721
K3 = lqr(A, B, diag([1 0]), 0.01)
% K3 =
%    10.0000    4.4721
```

Three lessons hide in those lines. Raising the angle's price from 1 to 100 made the angle gain ten times bigger and the closed loop faster: its poles move from $-0.707 \pm 0.707j$ to $-2.24 \pm 2.24j$. Making the effort 100 times cheaper did **exactly** the same thing, because only the ratio of $Q$ to $R$ matters. And both designs have damping ratio 0.707, since for this plant LQR always lands on that damping when only the angle is weighted.

::: example Choosing Q and R from the requirements
A common starting point is **[[Bryson's rule|bryson]]**: set each diagonal weight to one over the square of the largest value you can accept. Say the pitch error should stay within 0.05 rad (about $2.9^\circ$) and the actuator can deliver 2 rad/s² of angular acceleration.

**Step 1, the weights.** $Q_{11} = 1/0.05^2 = 400$. Leave the rate unweighted, $Q_{22} = 0$. $R = 1/2^2 = 0.25$.

**Step 2, the gain.** `K = lqr(A, B, diag([400 0]), 0.25)` gives $K = [40\ \ 8.944]$, with closed-loop poles at $-4.47 \pm 4.47j$.

**Step 3, check the effort.** An angle error of 0.05 rad asks for $40 \times 0.05 = 2.0\,\mathrm{rad/s^2}$ from the angle gain — exactly the actuator's limit, which is what Bryson's rule aims for.

**Step 4, go digital.** At 50 Hz, `sysd = c2d(ss(A,B,eye(2),0), 0.02, 'zoh')` then `Kd = dlqr(sysd.A, sysd.B, diag([400 0]), 0.25)` gives $K_d = [36.6\ \ 8.55]$ and discrete poles $0.9108 \pm 0.0817j$.

**Sanity check.** Map the continuous poles with $z = e^{sT_s}$ from lesson 5: $e^{(-4.47 + 4.47j) \times 0.02}$ has size $e^{-0.0894} = 0.914$ and angle $0.0894$ rad, which is $0.914(\cos 0.0894 + j \sin 0.0894) = 0.911 + 0.082j$. The digital design landed almost exactly where the continuous one would, with slightly smaller gains to allow for the hold.
:::

**`dlqr`** is LQR for a discrete model, $x[k+1] = A_d x[k] + B_d u[k]$. Its price is a sum over ticks instead of an integral, and its gain goes straight into flight code that runs at $T_s$.

**`lqi`** adds integral action. With $u = -Kx$ alone, a steady disturbance — a small thrust misalignment pushing the nose one way for the whole flight — leaves a steady error, because some error is needed to produce the torque that fights it. `lqi(sys, Q, R)` adds a new state, the running integral of the tracking error $x_i = \int (r - y)\,dt$, and designs one gain $K = [K_x\ \ K_i]$ for the enlarged state, so $Q$ must be sized for the states plus one integrator per output. The integrator keeps growing until the error is truly zero.

## Estimating the state: kalman

$u = -Kx$ needs the whole state, and sensors never give it cleanly. Rate gyros drift, star trackers are slow, everything is noisy. So you build an **observer**: a copy of the model running in the flight computer, nudged toward the measurements.

$$
\dot{\hat{x}} = A\hat{x} + Bu + L\,(y - C\hat{x}).
$$

Read $\hat{x}$ as "x hat", the estimate. The model predicts; $y - C\hat{x}$ is the surprise, the gap between what the sensor says and what the model expected; $L$ decides how hard to correct. Subtract this from the true dynamics and the error $e = x - \hat{x}$ obeys $\dot{e} = (A - LC)\,e$. You could pick $L$ with `place(A', C', p)'`, which is pole placement on the transposed problem.

A **[[Kalman filter|kalman-apollo]]** picks $L$ from how noisy things are. You state two **noise intensities**: $Q_n$ for **process noise** — the unknown pushes on the vehicle, like gusts — and $R_n$ for **measurement noise** on the sensors. If the sensor is noisy (big $R_n$), trust the model and correct gently: small $L$. If the vehicle is being shoved around (big $Q_n$), trust the sensor: big $L$. `kalman` finds the $L$ that gives the smallest average estimation error for those noise levels.

MATLAB needs to know which inputs are commands and which are noise, so you build the plant with both:

```matlab
G   = B;                               % gusts enter like the torque
sys = ss(A, [B G], [1 0], [0 0]);      % inputs: [u, w]; output: angle
[kest, L, P] = kalman(sys, 0.01, 1e-4, 0, 1, 1);
L
% L =
%     4.4721
%    10.0000
```

The last two arguments name the measured outputs (output 1) and the known inputs (input 1, the command); every other input is treated as noise. `kest` is the estimator as a state-space model: it takes $u$ and $y$ and puts out the estimates. `P` is the covariance of the estimation error, a measure of how uncertain the estimate stays. The estimator poles, `eig(A - L*[1 0])`, are $-2.24 \pm 2.24j$.

::: warning Qn and Rn are dials too
Real noise levels are rarely known to better than a factor of a few, so $Q_n$ and $R_n$ are tuning knobs, the same as $Q$ and $R$. Check the result, not only the call: run the estimator on simulated noisy data and confirm its errors stay inside the $\pm$ bounds that `P` predicts. And keep the noise inputs out of the known-input list; if a noise input is marked known, `kalman` assumes you can measure it.
:::

## LQG: joining the two, and what it does not promise

**LQG** (linear-quadratic-Gaussian) control puts the pieces together: the Kalman filter estimates $\hat{x}$, and the LQR gain acts on it, $u = -K\hat{x}$. A remarkable fact, the **separation principle**, says you may design the two halves separately. The closed-loop poles are exactly the controller poles, the eigenvalues of $A - BK$, together with the estimator poles, the eigenvalues of $A - LC$.

In MATLAB, `lqg(sys, QXU, QWV)` does both designs in one call, with `QXU = blkdiag(Q, R)` for the cost and `QWV` holding the noise covariances; `lqgreg(kest, K)` instead joins a Kalman estimator and an LQR gain you designed yourself.

::: warning LQG has no guaranteed margins
LQR with the full state measured comes with strong built-in robustness: for each input channel, at least $60^\circ$ of phase margin and a gain that can drop to half or grow without limit. Once a Kalman filter sits in the loop, **[[those guarantees vanish|no-guarantees]]**. So after any LQG design, break the loop at the plant input and check gain and phase margins with the lesson 4 tools, `margin` and `allmargin`, like any other controller.
:::

## Check yourself

::: check
A spacecraft has two states, angle and rate, and a single reaction wheel. You measure only the angle with a star tracker. Using the double-integrator model, is the system controllable and observable? What would change if you had only a rate gyro?
:::

::: answer
With $A = [0\ 1;\ 0\ 0]$ and $B = [0;\ 1]$, $\mathcal{C} = [B\ \ AB] = [0\ 1;\ 1\ 0]$ has rank 2: controllable. With $C = [1\ 0]$, $\mathcal{O} = [C;\ CA] = [1\ 0;\ 0\ 1]$ has rank 2: observable. With only a gyro, $C = [0\ 1]$ and $\mathcal{O} = [0\ 1;\ 0\ 0]$, rank 1: the angle is unobservable, because integrating a rate gives only changes in angle, never the starting value.
:::

::: check
For the pitch plant, find by hand the gain $K$ that puts both closed-loop poles at $s = -3$.
:::

::: answer
The desired polynomial is $(s + 3)^2 = s^2 + 6s + 9$. The closed loop has $s^2 + k_2 s + k_1$, so $k_1 = 9$ and $k_2 = 6$: $K = [9\ \ 6]$. (Note that `place` refuses this request for a single-input system, because a repeated pole exceeds the rank of $B$; `acker` handles it.)
:::

::: check
An LQR design with $Q = \operatorname{diag}(50, 0)$ and $R = 2$ gives gain $K$. A colleague reruns it with $Q = \operatorname{diag}(500, 0)$ and $R = 20$ and expects a faster response. What does she get, and why?
:::

::: answer
She gets exactly the same $K$. Multiplying both $Q$ and $R$ by 10 multiplies the whole cost $J$ by 10, and the gain that minimizes $J$ does not change when you scale it. Only the ratio of state price to effort price matters. For a faster response she must raise $Q$ relative to $R$.
:::

::: check
Your Kalman filter follows the sensor noise too closely: the estimated angle jitters. Which of $Q_n$ or $R_n$ would you raise, and what happens to $L$?
:::

::: answer
Raise $R_n$, telling the filter the sensor is noisier than it thought. The filter then trusts its model more and corrects less per measurement, so the entries of $L$ get smaller and the estimate becomes smoother. The price is a slower reaction to real disturbances. (Lowering $Q_n$ pushes the same way.)
:::

::: check
Why might an LQG controller that looks perfect in simulation still need its margins checked with `allmargin`?
:::

::: answer
The optimal gains assume the model and the noise levels are exactly right. LQR with full state feedback has guaranteed margins, but adding the Kalman filter removes those guarantees, so the combined controller can be fragile against modelling errors such as a shifted bending mode or an extra delay. Checking gain and phase margins at the plant input shows how much error it can really tolerate.
:::

## Summary

| Idea | Meaning | Formula or command |
|---|---|---|
| Controllability | inputs can steer every state | `rank(ctrb(A,B)) == n` |
| Observability | outputs reveal every state | `rank(obsv(A,C)) == n` |
| Gramian | how controllable, direction by direction | `gram(sys,'c')`, `gram(sys,'o')`; small eigenvalue = hard |
| State feedback | push back on every state | $u = -Kx$, poles of $A - BK$ |
| Pole placement | put the poles where you choose | `place(A,B,p)`, `acker` (single input) |
| LQR | price state error against effort | $J = \int (x^{\mathsf T}Qx + u^{\mathsf T}Ru)\,dt$, `lqr(A,B,Q,R)` |
| Bryson's rule | first guess at weights | $Q_{ii} = 1/x_{i,\max}^2$, $R = 1/u_{\max}^2$ |
| Discrete and integral LQR | sampled models; zero steady error | `dlqr`, `lqi` |
| Observer | model plus correction | $\dot{\hat{x}} = A\hat{x} + Bu + L(y - C\hat{x})$ |
| Kalman filter | $L$ from noise levels | `kalman(sys,Qn,Rn,Nn,sensors,known)` |
| LQG | Kalman estimate plus LQR gain | `lqg`, `lqgreg`; check margins afterwards |

The next lesson takes the big models these designs work on and makes them smaller — `minreal`, `balred` and `modred` — and then tunes PID loops with `pidtune`, the form many flight loops actually take.

::: context estimator-word Estimator, observer, filter
These three words mean nearly the same thing in GNC: software that works out the state from sensor data and a model. "Observer" usually means one designed by placing its poles. "Filter" usually means one designed from noise statistics, as in "Kalman filter" — the word comes from signal processing, where filtering means separating a signal from noise. On a spacecraft the navigation filter might blend a star tracker, gyros and GPS into one best estimate of attitude and position.
:::

::: context rank-word What rank counts
The rank of a matrix is the number of truly different directions its columns point in. Two columns $[1;\ 0]$ and $[0;\ 1]$ point in different directions: rank 2. Two columns $[1;\ 2]$ and $[2;\ 4]$ point the same way, since the second is twice the first: rank 1. A controllability matrix of rank $n$ means the pushes, and where the dynamics carry them, reach every direction of the $n$-dimensional state space.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="150" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="100" x2="30" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="100" x2="100" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="30" y1="100" x2="30" y2="30" stroke="#b4232c" stroke-width="3"/>
  <text x="90" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">two directions: rank 2</text>
  <line x1="210" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="210" y1="100" x2="210" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <line x1="210" y1="100" x2="270" y2="20" stroke="#b4232c" stroke-width="5"/>
  <line x1="210" y1="100" x2="240" y2="60" stroke="#1d6fd1" stroke-width="3"/>
  <text x="270" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">same direction: rank 1</text>
</svg>
```
:::

::: context transpose-word Flipping a matrix
The transpose turns rows into columns. If $B = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$ is a column, then $B^{\mathsf T} = [0\ \ 1]$ is a row. In MATLAB it is written with an apostrophe, `B'`. Expressions like $x^{\mathsf T}Qx$ use it to turn a column of states into a single number: a row times a matrix times a column is one value, the weighted sum of squares that LQR adds up.
:::

::: context riccati An old equation doing new work
The algebraic Riccati equation, $A^{\mathsf T}S + SA - SBR^{-1}B^{\mathsf T}S + Q = 0$, is named after Jacopo Riccati, an Italian mathematician of the early 1700s who studied a related differential equation. `lqr` solves it for the matrix $S$, and the gain follows as $K = R^{-1}B^{\mathsf T}S$. $S$ has a meaning of its own: starting from state $x_0$, the smallest possible total cost is $x_0^{\mathsf T}Sx_0$. The Kalman filter solves a matching equation with $A$ and $C$ transposed, which is why the two designs mirror each other.
:::

::: context bryson Where Bryson's rule comes from
Arthur E. Bryson Jr., a Stanford professor, wrote the classic textbook *Applied Optimal Control* with Yu-Chi Ho in 1969. The rule that carries his name is a way to make $Q$ and $R$ fair: dividing by the square of each variable's allowed size makes every term in the cost a pure number near 1 when that variable reaches its limit. It is only a first guess; you still simulate, check margins and adjust.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="320" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="110" x2="180" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <path d="M60,20 Q180,200 300,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="270" y1="15" x2="270" y2="110" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="90" y1="15" x2="90" y2="110" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="270" y="126" font-size="11" text-anchor="middle" fill="#b4232c">+x max</text>
  <text x="90" y="126" font-size="11" text-anchor="middle" fill="#b4232c">-x max</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="240" y="30" font-size="11" text-anchor="end" fill="#1d6fd1">cost grows as x squared</text>
</svg>
```
:::

::: context kalman-apollo From a 1960 paper to the Moon
Rudolf E. Kálmán published the filter in 1960 in a paper titled "A New Approach to Linear Filtering and Prediction Problems". Within a few years Stanley F. Schmidt and his team at NASA Ames Research Center had adapted it, in an extended form for nonlinear motion, to the problem of navigating to the Moon, and it flew in the Apollo guidance computer. Today a Kalman filter or one of its cousins sits in nearly every navigation system, from launch vehicles to phones.
:::

::: context no-guarantees Guaranteed margins: there are none
In 1978 John Doyle published a paper in the IEEE Transactions on Automatic Control with one of the most famous titles in the field, "Guaranteed margins for LQG regulators", and an abstract of three words: "There are none." He showed an LQG design whose margins could be made as small as you like. It changed practice: engineers now check the robustness of every model-based design, and it helped launch the field of robust control.
:::
