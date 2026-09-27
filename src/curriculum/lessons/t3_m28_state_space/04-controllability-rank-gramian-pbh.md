---
id: l04-controllability-rank-gramian-pbh
title: Controllability — the rank test, the Gramian and PBH
minutes: 23
covers:
  - "Controllability: the Kalman rank test, the controllability Gramian, the PBH test"
---

Think about parallel parking. A car cannot slide sideways — no wheel pushes that way. Yet you can still end up exactly beside the curb, because driving forward and backward while the wheels are turned moves you sideways a little at a time. The sideways direction is not pushed directly. It is reached *through the way the car moves*.

A spacecraft or a rocket raises the same question. Every design method in the rest of this module quietly assumes that your actuators can move the vehicle wherever you want. The arithmetic of pole placement will hand you a gain matrix even for a spacecraft with no torque source about one axis — and the "controlled" vehicle will drift about that axis exactly as it did before, in a direction the design report never mentions. **Controllability** is the test that catches this. It is why a reaction-wheel failure review takes an afternoon rather than a week.

The question is sharper than "can my actuators push?". It is: can pushing, combined with the way the dynamics carry one state into another, reach *every* combination of states? A launch vehicle with one gimbaled engine controls both its pitch angle and its sideways drift — two things from one input — because the two are chained together by the dynamics. A spacecraft with wheels on only two axes cannot. Only a test settles which case you are in, and this lesson gives you three: the Kalman rank test, the Gramian, and the PBH test. Then it spends the rest of its time on what matters in a review — reading a failed test as a physical direction the vehicle has lost.

## What controllability means

Here is the precise definition.

> A system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ is **controllable** if for every pair of states $\mathbf{x}_0$ and $\mathbf{x}_f$ there is a finite time $T$ and an input $\mathbf{u}(t)$ on $[0, T]$ that drives the state from $\mathbf{x}_0$ to exactly $\mathbf{x}_f$.

In words: pick any starting state and any target. If some input, applied for some finite time, gets you there exactly, the system is controllable. Three things the definition does *not* say, and each one is a trap.

It says nothing about **how much** input. The input may be as large as it likes. A controllable spacecraft with $0.2\,\mathrm{N\,m}$ wheels and a $2000\,\mathrm{kg\,m^2}$ axis still needs minutes to turn. Controllability is a yes-or-no fact about structure. The Gramian, later in this lesson, turns it into a number.

It says nothing about **speed**. Any $T > 0$ will do. That is why the rank test below never mentions a time.

It says nothing about the **output**. A controllable system can still have states your sensors cannot see. That is observability, the next lesson.

## The Kalman rank test

Start with the everyday picture. Take one axis of a spacecraft, with the state made of the angle $\theta$ and the rate $\omega$. A wheel torque changes $\omega$ directly — that is the direction $\mathbf{B}$ points. It cannot change $\theta$ directly. But a moment later, the rate you created has turned into angle. The dynamics $\mathbf{A}$ have carried the push from the $\omega$ direction into the $\theta$ direction, and that new direction is $\mathbf{A}\mathbf{B}$. Push, wait, push again, and you can reach any angle and any rate — the two directions $\mathbf{B}$ and $\mathbf{A}\mathbf{B}$ together cover the whole [[plane of states|reach-picture]].

The rule generalizes this: list the directions the input reaches directly, then the directions the dynamics carry them into, and so on. If together they point every which way, you are controllable.

::: key Kalman controllability test
$\mathbf{C}_m = [\mathbf{B},\ \mathbf{A}\mathbf{B},\ \mathbf{A}^2\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}]$, an $n\times nm$ matrix. The pair $(\mathbf{A}, \mathbf{B})$ is controllable if and only if $\operatorname{rank}(\mathbf{C}_m) = n$. Numerically prefer the Gramian or PBH — the conditioning of $\mathbf{C}_m$ is terrible for large $n$.
:::

Here $n$ is the number of states and $m$ the number of inputs. $\mathbf{C}_m$ is read "C sub m", the **controllability matrix**. Its **rank** is the number of truly independent directions among its columns.

Two practical points. Stopping at $\mathbf{A}^{n-1}\mathbf{B}$ is not a shortcut that loses anything — the argument below shows further blocks add no new directions. And even when the rank falls short of $n$, the columns of $\mathbf{C}_m$ still span the **controllable subspace**: the set of states you *can* reach. So the test tells you not only that you have a problem, but which directions still work.

::: note Why it has to be true
Take $\mathbf{x}_0 = \mathbf{0}$. That loses nothing: the free motion $e^{\mathbf{A}T}\mathbf{x}_0$ is fixed, and only shifts the target. From Lesson 3 the set of states reachable at time $T$ is

$$\mathcal{R}(T) = \left\{\int_0^T e^{\mathbf{A}(T-\sigma)}\mathbf{B}\,\mathbf{u}(\sigma)\,d\sigma \ :\ \mathbf{u}(\cdot)\right\}.$$

Now use the **[[Cayley–Hamilton theorem|cayley-hamilton]]**: $\mathbf{A}$ satisfies its own characteristic polynomial. So $\mathbf{A}^n$ is a combination of $\mathbf{I}, \mathbf{A}, \dots, \mathbf{A}^{n-1}$, and, repeating the argument, so is every higher power. The exponential series is a sum of powers, so it collapses to

$$e^{\mathbf{A}\tau} = \sum_{k=0}^{n-1}\alpha_k(\tau)\,\mathbf{A}^k$$

for some ordinary functions $\alpha_k$. Put this in the integral and pull the constant matrices outside:

$$\int_0^T e^{\mathbf{A}(T-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma = \sum_{k=0}^{n-1}\mathbf{A}^k\mathbf{B}\underbrace{\int_0^T\alpha_k(T-\sigma)\mathbf{u}(\sigma)\,d\sigma}_{\boldsymbol{\beta}_k\ \in\ \mathbb{R}^m} = \left[\mathbf{B},\ \mathbf{A}\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}\right]\begin{pmatrix}\boldsymbol{\beta}_0\\\vdots\\\boldsymbol{\beta}_{n-1}\end{pmatrix}.$$

Whatever input you choose, the state you reach is a combination of the columns of $\mathbf{C}_m$. In the other direction, a suitable input can make the $\boldsymbol{\beta}_k$ take any values you like, so the reachable set is exactly the column space of $\mathbf{C}_m$. The system is controllable when that column space is all of $\mathbb{R}^n$ — when the rank is $n$.
:::

## The controllability Gramian

The rank test answers yes or no. Hardware does not work in yes or no: a direction can be reachable and still ruinously expensive. The **controllability [[Gramian|gramian-name]]** measures the cost. Over a horizon $T$ it is

$$\mathbf{W}_c(T) = \int_0^T e^{\mathbf{A}\sigma}\,\mathbf{B}\mathbf{B}^\mathsf{T}\,e^{\mathbf{A}^\mathsf{T}\sigma}\,d\sigma,$$

an $n\times n$ symmetric matrix that is **positive semi-definite** (it never makes a negative "energy"). It is **positive definite** — every direction gets a strictly positive number — exactly when the system is controllable. Its small eigenvalues measure how nearly it is not.

Why is it a cost? Among all inputs that take $\mathbf{x}_0$ to $\mathbf{x}_f$ in time $T$, the one using the least energy $\int_0^T\|\mathbf{u}\|^2dt$ is

$$\mathbf{u}^\star(t) = \mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}(T-t)}\,\mathbf{W}_c(T)^{-1}\,\mathbf{d}, \qquad \mathbf{d} = \mathbf{x}_f - e^{\mathbf{A}T}\mathbf{x}_0,$$

and its energy is exactly $\mathbf{d}^\mathsf{T}\mathbf{W}_c(T)^{-1}\mathbf{d}$. Here $\mathbf{d}$ is the distance the input has to cover beyond where the state would drift anyway. A direction where $\mathbf{W}_c$ has a small eigenvalue has a large $\mathbf{W}_c^{-1}$, so it costs a great deal of energy to reach. A zero eigenvalue means you cannot reach it at all. The matching eigenvector tells you which direction it is.

::: note Why it has to be true
Put $\mathbf{u}^\star$ into the reachability integral. The integral becomes $\mathbf{W}_c(T)\mathbf{W}_c(T)^{-1}\mathbf{d} = \mathbf{d}$, so it lands on target. Any other input that lands on target differs from $\mathbf{u}^\star$ by a signal that is orthogonal to $\mathbf{u}^\star$ (their product integrates to zero), so its energy is $\mathbf{u}^\star$'s energy plus something non-negative. Nothing does better.

When $\mathbf{A}$ is stable, the infinite-horizon Gramian converges, and you do not have to integrate anything. Differentiate the integrand: $\frac{d}{d\sigma}\left(e^{\mathbf{A}\sigma}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}\sigma}\right) = \mathbf{A}\left(\cdot\right) + \left(\cdot\right)\mathbf{A}^\mathsf{T}$. Integrate both sides from $0$ to $\infty$. The left side gives the integrand at infinity (zero, because $\mathbf{A}$ is stable) minus its value at zero, $\mathbf{B}\mathbf{B}^\mathsf{T}$. So $-\mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{A}\mathbf{W}_c + \mathbf{W}_c\mathbf{A}^\mathsf{T}$.
:::

That last equation is a **[[Lyapunov equation|lyapunov-equation]]**, and every numerical library solves it directly.

::: key Controllability Gramian
$\mathbf{W}_c = \int_0^{\infty} e^{\mathbf{A}t}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\,dt$; for a stable $\mathbf{A}$ it is the solution of the Lyapunov equation $\mathbf{A}\mathbf{W}_c + \mathbf{W}_c\mathbf{A}^\mathsf{T} + \mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{0}$. Its small singular values are the expensive directions: reaching $\mathbf{d}$ costs $\mathbf{d}^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{d}$ of input energy.
:::

::: example What a 5-degree slew costs, and how it scales
Take one axis of a small satellite, with inertia $J = 120\,\mathrm{kg\,m^2}$, state $\mathbf{x} = (\theta, \omega)$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{B} = (0,\ 1/J)^\mathsf{T}$.

**Step 1, the exponential.** Because $\mathbf{A}^2 = \mathbf{0}$, $e^{\mathbf{A}\sigma} = \mathbf{I} + \mathbf{A}\sigma = \begin{pmatrix}1&\sigma\\0&1\end{pmatrix}$.

**Step 2, the integrand.** $e^{\mathbf{A}\sigma}\mathbf{B} = (\sigma/J,\ 1/J)^\mathsf{T}$, so the integrand is $\frac{1}{J^2}\begin{pmatrix}\sigma^2&\sigma\\\sigma&1\end{pmatrix}$.

**Step 3, integrate and invert.** Using $\det\mathbf{W}_c = T^4/12J^4$,

$$\mathbf{W}_c(T) = \frac{1}{J^2}\begin{pmatrix} T^3/3 & T^2/2 \\ T^2/2 & T\end{pmatrix}, \qquad \mathbf{W}_c(T)^{-1} = J^2\begin{pmatrix} 12/T^3 & -6/T^2 \\ -6/T^2 & 4/T\end{pmatrix}.$$

**Step 4, the cost.** A rest-to-rest turn through $\theta_f = 5^\circ = 0.087266\,\mathrm{rad}$ means $\mathbf{d} = (\theta_f, 0)^\mathsf{T}$. Only the top-left entry of $\mathbf{W}_c^{-1}$ survives:

$$E_{\min} = \frac{12J^2\theta_f^2}{T^3}.$$

At $T = 10\,\mathrm{s}$: $12(120)^2(0.087266)^2/1000 = 1.316\ (\mathrm{N\,m})^2\mathrm{s}$. At $T = 5\,\mathrm{s}$ it is $10.53$, and at $T = 20\,\mathrm{s}$ it is $0.1645$. Halving the time multiplies the energy by eight, as $1/T^3$ says it should ($1.316 \times 8 = 10.53$). That law is the first honest answer to "why not make the loop faster?", and Lesson 6 meets its twin in how gains grow.

**Step 5, the input itself.** The formula gives

$$u^\star(t) = J\theta_f\left[\frac{12(T-t)}{T^3} - \frac{6}{T^2}\right],$$

a **[[straight line|min-energy-ramp]]** from $+6J\theta_f/T^2$ down through zero at the halfway point to $-6J\theta_f/T^2$: speed up, then brake, switching exactly halfway. At $T = 10\,\mathrm{s}$ the peak is $6(120)(0.087266)/100 = 0.628\,\mathrm{N\,m}$. A wheel set that can deliver $0.2\,\mathrm{N\,m}$ about this axis cannot do it. Since the peak falls as $1/T^2$, it needs $T \ge 10\sqrt{0.628/0.2} \approx 17.7\,\mathrm{s}$.

Sanity check: the input is positive for the first half and negative for the second, with equal areas, so the satellite ends at rest — as asked. Notice too that a minimum-*energy* profile is a ramp, not the full-on, full-off profile that minimizes *time*. The cost you choose decides the shape.
:::

## The PBH test

The rank test tells you how many directions are missing. It does not say which **mode** — which natural motion of the system — is to blame, and in a review that is the only question anyone asks. The **[[PBH test|pbh-names]]** answers it.

::: key PBH (Popov–Belevitch–Hautus) test
$(\mathbf{A},\mathbf{B})$ is controllable if and only if $\operatorname{rank}\left[\mathbf{A} - \lambda\mathbf{I},\ \mathbf{B}\right] = n$ for **every** eigenvalue $\lambda$ of $\mathbf{A}$. Its value is that it names the offending mode, not only the rank deficit.
:::

Here $\lambda$ (read "lambda") is an eigenvalue, and $[\mathbf{A} - \lambda\mathbf{I},\ \mathbf{B}]$ is the $n\times(n+m)$ matrix made by setting the two side by side. You only test eigenvalues: for any other $\lambda$, the block $\mathbf{A}-\lambda\mathbf{I}$ is already invertible, so the rank is $n$ whatever $\mathbf{B}$ is.

The picture: a mode is a way the system likes to move on its own. The test asks whether the input has any grip on that mode. If some mode is completely out of the input's reach, the test fails at that mode's eigenvalue.

::: note Why it has to be true (the half you use)
Suppose the rank is short at some $\lambda$. Then the rows of $[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}]$ are dependent, so there is a nonzero $\mathbf{w}$ with $\mathbf{w}^\mathsf{T}(\mathbf{A}-\lambda\mathbf{I}) = \mathbf{0}^\mathsf{T}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}^\mathsf{T}$. The first says $\mathbf{w}$ is a **[[left eigenvector|left-eigenvector]]** of $\mathbf{A}$: $\mathbf{w}^\mathsf{T}\mathbf{A} = \lambda\mathbf{w}^\mathsf{T}$. Then

$$\mathbf{w}^\mathsf{T}\mathbf{C}_m = \left[\mathbf{w}^\mathsf{T}\mathbf{B},\ \mathbf{w}^\mathsf{T}\mathbf{A}\mathbf{B},\ \dots\right] = \left[\mathbf{0},\ \lambda\mathbf{w}^\mathsf{T}\mathbf{B},\ \lambda^2\mathbf{w}^\mathsf{T}\mathbf{B},\ \dots\right] = \mathbf{0}^\mathsf{T},$$

so $\mathbf{C}_m$ has a left null vector and cannot have rank $n$. The converse also holds, and it is what makes the test an "if and only if".
:::

The vector $\mathbf{w}$ is the prize. It is a direction in state space that no input can ever affect, written in the coordinates of your model, so you can read the physics straight off it.

The same statement in **modal coordinates** (Lesson 2) is worth keeping in your head. If $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ with distinct eigenvalues, then $\bar{\mathbf{B}} = \mathbf{V}^{-1}\mathbf{B}$, and the rows of $\mathbf{V}^{-1}$ are exactly the left eigenvectors. Mode $i$ is uncontrollable exactly when row $i$ of $\bar{\mathbf{B}}$ is zero: the input has no path into that mode. Lesson 2's remark that $\bar{\mathbf{B}}$ shows how hard each input drives each mode was this theorem in disguise.

::: warning "Uncontrollable" is a property of a model, at a rank tolerance
Rank jumps; floating-point numbers do not. No real matrix is ever exactly rank deficient. So never test controllability with an exact rank on $\mathbf{C}_m$ beyond a small hand problem. The matrix holds powers of $\mathbf{A}$ up to $n-1$, so its **[[condition number|condition-number]]** is roughly that of $\mathbf{A}$ raised to the $n-1$ — for $n = 10$, meaningless. Use the singular values of $\mathbf{C}_m$ with a stated tolerance, or better the Gramian, which asks the physical question ("how much energy does this direction cost?") instead of the fragile one. And scale the model first (Lesson 2), or you are measuring your choice of units.
:::

## Reading a deficiency as a physical direction

::: example Reaction-wheel failures on the pyramid
Return to the six-state spacecraft of Lesson 1: $\mathbf{x} = (\boldsymbol{\theta}, \boldsymbol{\omega})$ (three angles, three rates), $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$, $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$, with inertia $\mathbf{J} = \operatorname{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$. The columns of $\mathbf{A}_w$ are the four **[[pyramid|pyramid]]** wheel axes $(\pm1,\pm1,1)/\sqrt{3}$: $\mathbf{a}_1 \propto (1,1,1)$, $\mathbf{a}_2 \propto (-1,1,1)$, $\mathbf{a}_3 \propto (-1,-1,1)$, $\mathbf{a}_4 \propto (1,-1,1)$.

**The shortcut.** Because $\mathbf{A}^2 = \mathbf{0}$, only two blocks of $\mathbf{C}_m$ are nonzero: $\mathbf{C}_m = [\mathbf{B},\ \mathbf{A}\mathbf{B},\ \mathbf{0},\ \dots]$ with $\mathbf{A}\mathbf{B} = \begin{pmatrix}\mathbf{J}^{-1}\mathbf{A}_w\\\mathbf{0}\end{pmatrix}$. The two blocks sit in different rows, so

$$\operatorname{rank}\mathbf{C}_m = 2\,\operatorname{rank}\left(\mathbf{J}^{-1}\mathbf{A}_w\right) = 2\,\operatorname{rank}(\mathbf{A}_w),$$

since $\mathbf{J}$ is invertible. Everything comes down to the rank of the $3\times4$ wheel geometry. That is what you would hope: attitude controllability of a rigid body is a statement about torque directions, and the factor of two is the rate and the angle about each available axis.

**All four wheels healthy.** Any three of the four axes are independent — the determinant of any three of them, taken in order, is $4/(3\sqrt{3}) = 0.770$, never zero — so $\operatorname{rank}\mathbf{A}_w = 3$ and $\operatorname{rank}\mathbf{C}_m = 6$. Controllable.

**Any one wheel failed.** Three independent columns remain, so the rank is still $6$. All four single failures are survivable. That is the whole reason for the pyramid.

**Any two wheels failed.** Two columns remain, spanning a plane, so $\operatorname{rank}\mathbf{A}_w = 2$ and $\operatorname{rank}\mathbf{C}_m = 4$. The lost torque direction is the normal to that plane, along $\mathbf{a}_i\times\mathbf{a}_j$ for the two survivors. Losing wheels 1 and 3 leaves $\mathbf{a}_2$ and $\mathbf{a}_4$, and $(-1,1,1)\times(1,-1,1) = (2,2,0)$: the lost direction is $(1,1,0)/\sqrt{2}$, halfway between $+x$ and $+y$. Losing 1 and 2 loses $(0,1,1)/\sqrt{2}$, and so on for all six pairs. In every case you have lost one axis, and you can name it before running anything.

**Now ask the Gramian.** Over $T = 100\,\mathrm{s}$, with states in $\mathrm{rad}$ and $\mathrm{rad/s}$, what does it cost to turn $1^\circ$ about $(1,1,0)/\sqrt{2}$ and stop?

| Wheel 1 and 3 authority | $\operatorname{rank}\mathbf{C}_m$ | $\sigma_{\min}(\mathbf{W}_c)$ | $E_{\min}$, $(\mathrm{N\,m})^2\mathrm{s}$ |
| --- | --- | --- | --- |
| full | 6 | $8.33\times10^{-6}$ | $5.06\times10^{-3}$ |
| $1\,\%$ | 6 | $1.81\times10^{-9}$ | $50.0$ |
| zero | 4 | $\approx 0$ (round-off) | unbounded |

The rank test calls the middle row controllable — true — and says nothing more. The Gramian says the turn costs ten thousand times more energy than it should ($50.0 / 0.00506 \approx 9900$). That is the answer a flight director needs.
:::

::: example A spacecraft with wheels on only two axes
Put wheels on the body $x$ and $y$ axes and nothing about $z$: $\mathbf{A}_w = \begin{pmatrix}1&0\\0&1\\0&0\end{pmatrix}$. Then $\operatorname{rank}\mathbf{A}_w = 2$ and $\operatorname{rank}\mathbf{C}_m = 4$. The six-state model is uncontrollable, and two dimensions are unreachable: the angle $\theta_z$ and the rate $\omega_z$.

**Run PBH.** All six eigenvalues of $\mathbf{A}$ are zero, so there is one matrix to test, $[\mathbf{A},\ \mathbf{B}]$. Its rank is $5$. The left null vector — solve $\mathbf{w}^\mathsf{T}\mathbf{A} = \mathbf{0}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}$ — is $\mathbf{w} = (0,0,0,\ 0,0,1)^\mathsf{T}$. It points along $\omega_z$. Read it aloud: no combination of wheel torques can change the rate about $z$, because no wheel has a component along $z$.

**Why the two counts differ.** PBH is short by one; Kalman is short by two. The blocked motion is a single chain at $\lambda = 0$ that is two states long — $\omega_z$ feeding $\theta_z$. PBH counts the chain once; Kalman counts both states in it. Had you modeled only the three rates, the Kalman shortfall would also be one. Both describe the same missing axis.

**What the linear model cannot see.** The full rigid-body equation is $\mathbf{J}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} = \boldsymbol{\tau}$ ($\boldsymbol{\tau}$, "tau", is torque). Linearizing about rest threw away the **[[gyroscopic cross term|gyroscopic-coupling]]** $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$, which couples the axes whenever the body is already turning. Through it, a rigid body with two actuated axes can be controllable in the nonlinear sense — spin up one axis and use the coupling to move the third. But the authority that way is small, the maneuvers are slow, and none of this module's linear tools apply. The honest review answer names both halves: uncontrollable in the linearization about rest, with rotation about the unactuated axis as the missing direction; controllable in principle through the nonlinear coupling, with authority you should not plan a mission around.
:::

Here are the tests in code, run on the pyramid.

```python
import numpy as np

def ctrb(A, B):
    n = A.shape[0]
    cols, blk = [B], B
    for _ in range(n - 1):
        blk = A @ blk
        cols.append(blk)
    return np.hstack(cols)

def pbh_uncontrollable(A, B, tol=1e-9):
    n = A.shape[0]
    bad = []
    for lam in np.linalg.eigvals(A):
        M = np.hstack([A - lam * np.eye(n), B.astype(complex)])
        if np.linalg.matrix_rank(M, tol=tol) < n:
            bad.append(lam)
    return bad

J = np.diag([1200.0, 1500.0, 2000.0])
A = np.zeros((6, 6)); A[0:3, 3:6] = np.eye(3)
axes = np.array([[1, -1, -1, 1], [1, 1, -1, -1], [1, 1, 1, 1]]) / np.sqrt(3)   # pyramid
for keep, label in [([0, 1, 2, 3], "all four"), ([1, 2, 3], "wheel 1 failed"),
                    ([1, 3], "wheels 1 and 3 failed")]:
    B = np.vstack([np.zeros((3, len(keep))), np.linalg.inv(J) @ axes[:, keep]])
    print(f"{label:22s} rank = {np.linalg.matrix_rank(ctrb(A, B))}  "
          f"uncontrollable eigenvalues: {len(pbh_uncontrollable(A, B))}")
# all four               rank = 6  uncontrollable eigenvalues: 0
# wheel 1 failed         rank = 6  uncontrollable eigenvalues: 0
# wheels 1 and 3 failed  rank = 4  uncontrollable eigenvalues: 6
```

The last line looks odd until you notice that all six eigenvalues of this $\mathbf{A}$ are the same number, zero, so PBH flags that repeated eigenvalue six times. For a plant with distinct eigenvalues, the list names exactly the modes at fault.

::: note Controllable, stabilizable, and what you actually need
Full controllability is more than most designs need. An uncontrollable mode that is stable dies away on its own and does no harm. The weaker condition — every mode with $\operatorname{Re}\lambda \ge 0$ is controllable — is called **stabilizability**, and it is the real requirement for a stabilizing state feedback to exist. The next lesson states it precisely, alongside its observability twin, detectability, because the two are always checked together.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -2, -3)\,\mathrm{s^{-1}}$ and $\mathbf{B} = (1, 1, 0)^\mathsf{T}$. Is it controllable? Use both tests and say which mode is at fault.
:::

::: answer
**Kalman:** $\mathbf{C}_m = [\mathbf{B}, \mathbf{A}\mathbf{B}, \mathbf{A}^2\mathbf{B}] = \begin{pmatrix}1&-1&1\\1&-2&4\\0&0&0\end{pmatrix}$. The third row is zero, so the rank is $2$: uncontrollable.

**PBH:** test each eigenvalue. At $\lambda = -3$, $[\mathbf{A}+3\mathbf{I},\ \mathbf{B}] = \begin{pmatrix}2&0&0&1\\0&1&0&1\\0&0&0&0\end{pmatrix}$ has rank $2 < 3$, with left null vector $\mathbf{w} = (0,0,1)^\mathsf{T}$. At $\lambda = -1$ and $\lambda = -2$ the rank is $3$. So the $-3$ mode has no input path — which the modal form shows directly, since row 3 of $\mathbf{B}$ is zero.

The system is still stabilizable: the uncontrollable mode decays on its own with a time constant of $1/3 \approx 0.33\,\mathrm{s}$.
:::

::: check
Why does controllability of the six-state rigid-body spacecraft reduce to the rank of the $3\times4$ wheel geometry matrix, and what would change if the vehicle had a gravity-gradient restoring torque?
:::

::: answer
Because $\mathbf{A}^2 = \mathbf{0}$ (a matrix with some power equal to zero is called nilpotent), only $\mathbf{B}$ and $\mathbf{A}\mathbf{B}$ contribute. Those blocks are $\begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$ and $\begin{pmatrix}\mathbf{J}^{-1}\mathbf{A}_w\\\mathbf{0}\end{pmatrix}$. They occupy different rows, so the rank is twice $\operatorname{rank}(\mathbf{J}^{-1}\mathbf{A}_w) = \operatorname{rank}(\mathbf{A}_w)$.

A gravity-gradient torque adds a nonzero bottom-left block to $\mathbf{A}$, coupling attitude back into rate. Then $\mathbf{A}$ is no longer nilpotent, and $\mathbf{A}^2\mathbf{B}$ onward can add new directions. A torque direction unreachable at first order might become reachable through the restoring torque — at a rate set by the orbital frequency, which is to say very slowly. You would have to run the full rank test instead of reducing it by hand.
:::

::: check
The minimum energy to reach a state $\mathbf{d}$ is $\mathbf{d}^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{d}$. What does an eigenvalue of $\mathbf{W}_c$ equal to $10^{-9}$ mean, and why is the answer incomplete without more information?
:::

::: answer
Reaching a unit step along the matching eigenvector costs $10^{9}$ units of input energy — a billion times more than a direction whose eigenvalue is $1$. In practice that direction is unreachable with real actuators, and a controller that tries will saturate.

The answer is incomplete because the eigenvalues of $\mathbf{W}_c$ change when you change the state's units. The Gramian transforms as $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ (a **congruence**), so $10^{-9}$ in radians and $10^{-9}$ in arcseconds are different physical statements. You need the state definition and its units — ideally a model scaled so that one unit of each state is one unit of engineering importance.
:::

::: check
A rest-to-rest slew of $20^\circ$ on a $2000\,\mathrm{kg\,m^2}$ axis is to be done in $60\,\mathrm{s}$. Find the minimum energy and the peak torque of the minimum-energy profile. If the wheels can supply $0.2\,\mathrm{N\,m}$ about that axis, does it fit?
:::

::: answer
$\theta_f = 20^\circ = 0.34907\,\mathrm{rad}$, $J = 2000\,\mathrm{kg\,m^2}$, $T = 60\,\mathrm{s}$.

Energy: $E = 12J^2\theta_f^2/T^3 = 12(4\times10^6)(0.12185)/216000 = 27.1\ (\mathrm{N\,m})^2\mathrm{s}$.

Peak torque, at the two ends: $6J\theta_f/T^2 = 6(2000)(0.34907)/3600 = 1.164\,\mathrm{N\,m}$.

That is nearly six times the available $0.2\,\mathrm{N\,m}$, so it does not fit. The peak falls as $1/T^2$, so you need $T \ge 60\sqrt{1.164/0.2} = 145\,\mathrm{s}$ — and in practice more, because a feedback controller does not produce the minimum-energy profile and the wheels must also fight disturbances while slewing.
:::

::: check
An engineer reports that a 14-state launch vehicle model is uncontrollable because `matrix_rank` on its controllability matrix returned 12. What would you ask before believing it?
:::

::: answer
Four questions.

1. What units are the states in, and was the model scaled? An unscaled model mixing meters, radians and newtons can have singular values spread over a huge range for reasons that have nothing to do with the vehicle.
2. What tolerance was the rank computed at, and what does the singular value spectrum look like? A clean gap of ten orders of magnitude between $\sigma_{12}$ and $\sigma_{13}$ is evidence. A smooth decay is not.
3. What does PBH say? It names the modes, and either a physical interpretation exists or it does not.
4. Usually decisive: what does the Gramian say about the energy needed in the suspect directions?

For $n = 14$, $\mathbf{C}_m$ contains $\mathbf{A}^{13}$ and its condition number is effectively unbounded. A rank computed from it is not evidence of anything on its own.
:::

## Summary

| Item | Statement |
| --- | --- |
| Controllable | for any $\mathbf{x}_0,\mathbf{x}_f$ there is a finite $T$ and an input driving one to the other |
| Kalman test | $\mathbf{C}_m = [\mathbf{B},\mathbf{A}\mathbf{B},\dots,\mathbf{A}^{n-1}\mathbf{B}]$; controllable iff $\operatorname{rank} = n$; $\operatorname{range}\mathbf{C}_m$ is the reachable subspace |
| Why $n-1$ | Cayley–Hamilton: higher powers add no new columns |
| Gramian | $\mathbf{W}_c(T) = \int_0^Te^{\mathbf{A}\sigma}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}\sigma}d\sigma$; controllable iff $\mathbf{W}_c \succ 0$ |
| Lyapunov form | stable $\mathbf{A}$: $\mathbf{A}\mathbf{W}_c + \mathbf{W}_c\mathbf{A}^\mathsf{T} + \mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{0}$ |
| Minimum energy | $\mathbf{u}^\star = \mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}(T-t)}\mathbf{W}_c(T)^{-1}\mathbf{d}$, energy $\mathbf{d}^\mathsf{T}\mathbf{W}_c(T)^{-1}\mathbf{d}$ |
| Double integrator | $E_{\min} = 12J^2\theta_f^2/T^3$, peak torque $6J\theta_f/T^2$ |
| PBH | controllable iff $\operatorname{rank}[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}] = n$ for every eigenvalue; left null vector $\mathbf{w}$ names the lost direction |
| Modal reading | mode $i$ uncontrollable iff row $i$ of $\mathbf{V}^{-1}\mathbf{B}$ is zero |
| Rigid body | $\operatorname{rank}\mathbf{C}_m = 2\operatorname{rank}(\mathbf{A}_w)$; pyramid survives any one wheel, loses one axis on any two |
| Numerics | $\operatorname{cond}(\mathbf{C}_m)\sim\operatorname{cond}(\mathbf{A})^{n-1}$; scale first, then use singular values or the Gramian |

Everything here has a mirror image. Swap $\mathbf{A}$ for $\mathbf{A}^\mathsf{T}$ and $\mathbf{B}$ for $\mathbf{C}^\mathsf{T}$, and the rank test, the Gramian and PBH all become statements about what your sensors can see. The next lesson makes that duality exact and uses it to find a gyro bias you cannot see.

::: context reach-picture Two directions from one push
For one spacecraft axis, the state is a point in a flat plane: angle across, rate up. A wheel torque pushes the point straight up (the direction $\mathbf{B}$). The dynamics then slide it sideways, because rate turns into angle (the direction $\mathbf{A}\mathbf{B}$). Two independent arrows cover the whole plane, so every angle-and-rate pair is reachable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="155" x2="60" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="322" y="148" font-size="13" fill="#1f2a44">θ</text>
  <text x="68" y="22" font-size="13" fill="#1f2a44">ω</text>
  <line x1="60" y1="130" x2="60" y2="52" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="60,40 53,55 67,55" fill="#1d6fd1"/>
  <text x="74" y="70" font-size="12" fill="#1d6fd1">B: torque changes rate</text>
  <line x1="60" y1="130" x2="228" y2="130" stroke="#b4232c" stroke-width="4"/>
  <polygon points="240,130 225,123 225,137" fill="#b4232c"/>
  <text x="120" y="118" font-size="12" fill="#b4232c">AB: rate becomes angle</text>
  <circle cx="250" cy="60" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="262" y="64" font-size="12" fill="#1f2a44">any target</text>
</svg>
```
:::

::: context cayley-hamilton A matrix obeys its own polynomial
The characteristic polynomial of $\mathbf{A}$ is the one whose roots are its eigenvalues. The theorem says that if you substitute the matrix itself for $s$, you get the zero matrix. For $\mathbf{A} = \begin{pmatrix}0&1\\-2&-3\end{pmatrix}$, the polynomial is $s^2 + 3s + 2$, and indeed $\mathbf{A}^2 + 3\mathbf{A} + 2\mathbf{I} = \mathbf{0}$. So $\mathbf{A}^2 = -3\mathbf{A} - 2\mathbf{I}$: the square is built from lower powers, and so is every power after it. That is why the list $\mathbf{B}, \mathbf{A}\mathbf{B}, \dots$ can stop at $\mathbf{A}^{n-1}\mathbf{B}$.
:::

::: context gramian-name Where the name comes from
The Gramian is named after Jørgen Pedersen Gram, a Danish mathematician (the same Gram as in the Gram–Schmidt process). A Gram matrix collects the inner products of a set of vectors with each other; it is singular exactly when the vectors are dependent. The controllability Gramian is the same idea for a continuous family of vectors — the columns of $e^{\mathbf{A}\sigma}\mathbf{B}$ for every moment $\sigma$ — which is why it is singular exactly when the system is uncontrollable.
:::

::: context lyapunov-equation Lyapunov's equation
Aleksandr Lyapunov, a Russian mathematician, wrote his doctoral thesis on the stability of motion in 1892. The matrix equation $\mathbf{A}\mathbf{X} + \mathbf{X}\mathbf{A}^\mathsf{T} + \mathbf{Q} = \mathbf{0}$ carries his name because it is how you build a quadratic "energy" that proves a linear system stable. It is linear in $\mathbf{X}$, so it is fast to solve: `scipy.linalg.solve_continuous_lyapunov` does it in one line. You will meet it again in the LQR and Kalman filter modules, where its nonlinear cousin, the Riccati equation, takes over.
:::

::: context min-energy-ramp The shape of the cheapest slew
The minimum-energy torque for a rest-to-rest turn is a straight line: strongest push at the start, zero at the halfway point, strongest brake at the end. The two triangles have equal area, so the rate the first half builds up is exactly removed by the second half.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="85" x2="330" y2="85" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="15" x2="60" y2="155" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="60,25 180,85 60,85" fill="#8fb8f0"/>
  <polygon points="180,85 300,145 300,85" fill="#f2b880"/>
  <line x1="60" y1="25" x2="300" y2="145" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="300" y1="85" x2="300" y2="145" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="66" y="20" font-size="12" fill="#1f2a44">+6Jθf/T²</text>
  <text x="230" y="160" font-size="12" fill="#1f2a44">−6Jθf/T²</text>
  <text x="180" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">T/2</text>
  <text x="306" y="80" font-size="12" fill="#1f2a44">T</text>
  <text x="80" y="76" font-size="12" fill="#1d6fd1">speed up</text>
  <text x="228" y="108" font-size="12" fill="#1f2a44">brake</text>
  <text x="325" y="100" font-size="12" fill="#1f2a44">t</text>
  <text x="38" y="30" font-size="12" fill="#1f2a44">u</text>
</svg>
```
:::

::: context pbh-names Three names on one test
The test is named after three researchers who reached it independently in the 1960s: Vasile Mihai Popov in Romania, Vitold Belevitch in Belgium, and Malo Hautus in the Netherlands. You will also see it called the Hautus test or the Hautus lemma. Its advantage over the Kalman test is practical: it works one eigenvalue at a time, so it points at the guilty mode instead of reporting a count.
:::

::: context left-eigenvector Left and right eigenvectors
An ordinary (right) eigenvector satisfies $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$: a column that $\mathbf{A}$ only stretches. A left eigenvector is a row that $\mathbf{A}$ only stretches when it multiplies from the left, $\mathbf{w}^\mathsf{T}\mathbf{A} = \lambda\mathbf{w}^\mathsf{T}$ — equivalently, an ordinary eigenvector of $\mathbf{A}^\mathsf{T}$. Right eigenvectors describe what a mode *looks like*. Left eigenvectors *measure how much* of each mode a state contains: the number $\mathbf{w}^\mathsf{T}\mathbf{x}$ evolves as $e^{\lambda t}$ on its own. If $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}$, no input ever changes that number.
:::

::: context condition-number Condition number, in one sentence
The condition number of a matrix is the ratio of its largest to its smallest singular value — how much more it stretches its most-favored direction than its least. It also tells you how many digits you lose solving with it: a condition number of $10^{k}$ costs about $k$ of the roughly 16 significant digits a double-precision number carries. A controllability matrix built from $\mathbf{A}^{13}$ can easily lose all 16.
:::

::: context pyramid The pyramid, seen from above
Four wheels tilt out along the edges of a pyramid, each leaning toward $+z$. With wheels 1 and 3 dead, the survivors 2 and 4 lie in one vertical plane. Any torque they make stays in that plane, so the direction perpendicular to it — $(1,1,0)/\sqrt{2}$ — is lost.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="190" x2="180" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <text x="304" y="104" font-size="12" fill="#6c7a93">x</text>
  <text x="185" y="18" font-size="12" fill="#6c7a93">y</text>
  <line x1="180" y1="100" x2="264" y2="16" stroke="#b4232c" stroke-width="5" stroke-opacity="0.55"/>
  <polygon points="270,10 255,16 264,25" fill="#b4232c"/>
  <text x="272" y="24" font-size="12" fill="#b4232c">lost</text>
  <line x1="180" y1="100" x2="220" y2="60" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="180" y1="100" x2="140" y2="140" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="226" y="76" font-size="12" fill="#6c7a93">1 (failed)</text>
  <text x="72" y="152" font-size="12" fill="#6c7a93">3 (failed)</text>
  <line x1="180" y1="100" x2="125" y2="45" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="120,40 136,46 126,56" fill="#1d6fd1"/>
  <line x1="180" y1="100" x2="235" y2="155" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="240,160 224,154 234,144" fill="#1d6fd1"/>
  <text x="106" y="42" font-size="12" fill="#1d6fd1">2</text>
  <text x="248" y="170" font-size="12" fill="#1d6fd1">4</text>
  <text x="14" y="195" font-size="11" fill="#1f2a44">top view, z out of page</text>
</svg>
```
:::

::: context gyroscopic-coupling The term the linear model drops
$\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is the reason a spinning top does not fall straight over: when a body already rotates, a torque about one axis turns into motion about another. It is a product of rates, so near rest it is tiny — linearizing about zero rate discards it entirely. The rank test is exact for the linear model, so "uncontrollable" here means "uncontrollable to first order". Underactuated spacecraft control, which exploits the dropped term, is a real research field, but its maneuvers are slow and its controllers are nonlinear.
:::
