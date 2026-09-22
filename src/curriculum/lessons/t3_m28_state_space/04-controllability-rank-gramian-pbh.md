---
id: l04-controllability-rank-gramian-pbh
title: Controllability — the rank test, the Gramian and PBH
minutes: 19
covers:
  - "Controllability: the Kalman rank test, the controllability Gramian, the PBH test"
---

Every design method in the rest of this module begins with an assumption that is almost never stated out loud: that the actuators you have can move the vehicle to where you want it. Pole placement will happily return a gain matrix for a plant whose third axis has no torque source at all — the arithmetic does not notice — and the resulting closed loop will be exactly as divergent as the open loop, in a direction the design report never mentions. Controllability is the test that catches this, and it is the reason a reaction-wheel failure review takes an afternoon rather than a week.

The question is sharper than it sounds. It is not "can my actuators produce torque" but "can the reachable set, built up over time by the coupling in $\mathbf{A}$, fill the whole state space". A spacecraft with wheels on only two axes cannot torque about the third, yet you might hope the coupling saves you. A launch vehicle with one gimbal actuator can control both pitch attitude and lateral drift, which looks like two things from one input, and does work — because the two states are chained through the dynamics. Only a rank test settles which case you are in.

This lesson defines controllability, derives the Kalman rank test, introduces the Gramian and the minimum-energy input it computes, states and proves the useful half of the PBH test, and then spends the rest of its length on the thing that matters in a review: reading a rank deficiency as a physical direction the vehicle has lost.

## What controllability means

> A system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ is **controllable** if for every pair of states $\mathbf{x}_0$ and $\mathbf{x}_f$ there is a finite time $T$ and an input $\mathbf{u}(t)$ on $[0, T]$ that drives the state from $\mathbf{x}_0$ to exactly $\mathbf{x}_f$.

Three things the definition does not say, each of which is a trap.

It says nothing about **how much** input. The definition allows $\mathbf{u}$ to be as large as it likes, and a controllable system with $0.2\,\mathrm{N\,m}$ wheels and a $2000\,\mathrm{kg\,m^2}$ axis is still going to take minutes. Controllability is a structural yes-or-no; the Gramian below is what turns it into a number.

It says nothing about **speed**. Any $T > 0$ will do, which is why the rank test is independent of the time horizon.

And it says nothing about the **output**. A controllable system may have states you cannot see; that is observability, and it is the next lesson.

## The Kalman rank test

Take $\mathbf{x}_0 = \mathbf{0}$ without loss of generality — the free response $e^{\mathbf{A}T}\mathbf{x}_0$ is fixed and only shifts the target. From Lesson 3 the reachable set at time $T$ is

$$\mathcal{R}(T) = \left\{\int_0^T e^{\mathbf{A}(T-\sigma)}\mathbf{B}\,\mathbf{u}(\sigma)\,d\sigma \ :\ \mathbf{u}(\cdot)\right\}.$$

Now apply the Cayley–Hamilton theorem: $\mathbf{A}$ satisfies its own characteristic polynomial, so $\mathbf{A}^n$ is a linear combination of $\mathbf{I}, \mathbf{A}, \dots, \mathbf{A}^{n-1}$, and by induction so is every higher power. The exponential series, being a sum of powers, therefore collapses to

$$e^{\mathbf{A}\tau} = \sum_{k=0}^{n-1}\alpha_k(\tau)\,\mathbf{A}^k$$

for some scalar functions $\alpha_k$. Substituting into the integral and pulling the constant matrices out,

$$\int_0^T e^{\mathbf{A}(T-\sigma)}\mathbf{B}\mathbf{u}(\sigma)\,d\sigma = \sum_{k=0}^{n-1}\mathbf{A}^k\mathbf{B}\underbrace{\int_0^T\alpha_k(T-\sigma)\mathbf{u}(\sigma)\,d\sigma}_{\boldsymbol{\beta}_k\ \in\ \mathbb{R}^m} = \left[\mathbf{B},\ \mathbf{A}\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}\right]\begin{pmatrix}\boldsymbol{\beta}_0\\\vdots\\\boldsymbol{\beta}_{n-1}\end{pmatrix}.$$

Whatever $\mathbf{u}$ you choose, the state you reach lies in the column space of that $n\times nm$ matrix. Conversely the $\boldsymbol{\beta}_k$ can be made to take any values you like by choosing $\mathbf{u}$ appropriately, so the reachable set is exactly that column space. The system is controllable when the column space is all of $\mathbb{R}^n$.

::: key Kalman controllability test
$\mathbf{C}_m = [\mathbf{B},\ \mathbf{A}\mathbf{B},\ \mathbf{A}^2\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}]$, an $n\times nm$ matrix. The pair $(\mathbf{A}, \mathbf{B})$ is controllable if and only if $\operatorname{rank}(\mathbf{C}_m) = n$. Numerically prefer the Gramian or PBH — the conditioning of $\mathbf{C}_m$ is terrible for large $n$.
:::

Two practical notes. Stopping at $\mathbf{A}^{n-1}\mathbf{B}$ is not a truncation: Cayley–Hamilton guarantees that further blocks add nothing to the column space. And the range of $\mathbf{C}_m$ is the **controllable subspace** even when the rank is short of $n$ — it tells you not only that you have a problem but which directions are still reachable.

## The controllability Gramian

The rank test is binary, and hardware is not. The **controllability Gramian** over a horizon $T$,

$$\mathbf{W}_c(T) = \int_0^T e^{\mathbf{A}\sigma}\,\mathbf{B}\mathbf{B}^\mathsf{T}\,e^{\mathbf{A}^\mathsf{T}\sigma}\,d\sigma,$$

is a symmetric positive semi-definite $n\times n$ matrix that is positive definite exactly when the system is controllable — and whose small eigenvalues measure how nearly it is not. Its value is that it answers a quantitative question. Among all inputs that take $\mathbf{x}_0$ to $\mathbf{x}_f$ in time $T$, the one of least energy $\int_0^T\|\mathbf{u}\|^2dt$ is

$$\mathbf{u}^\star(t) = \mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}(T-t)}\,\mathbf{W}_c(T)^{-1}\,\mathbf{d}, \qquad \mathbf{d} = \mathbf{x}_f - e^{\mathbf{A}T}\mathbf{x}_0,$$

and its energy is exactly $\mathbf{d}^\mathsf{T}\mathbf{W}_c(T)^{-1}\mathbf{d}$. (Verify the first claim by substituting $\mathbf{u}^\star$ into the reachability integral: the integral becomes $\mathbf{W}_c(T)\mathbf{W}_c(T)^{-1}\mathbf{d} = \mathbf{d}$, so it lands on target; minimality follows because any other input differs from $\mathbf{u}^\star$ by something orthogonal to it in the $L^2$ inner product.) So a direction in which $\mathbf{W}_c$ has a small eigenvalue is a direction that costs a great deal of control energy to reach, and a zero eigenvalue is a direction you cannot reach at all. The eigenvector tells you which direction.

When $\mathbf{A}$ is stable the infinite-horizon Gramian converges, and there is no need to integrate anything. Differentiating the integrand, $\frac{d}{d\sigma}\left(e^{\mathbf{A}\sigma}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}\sigma}\right) = \mathbf{A}\left(\cdot\right) + \left(\cdot\right)\mathbf{A}^\mathsf{T}$, and integrating both sides from $0$ to $\infty$ — where the integrand vanishes because $\mathbf{A}$ is stable — gives $-\mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{A}\mathbf{W}_c + \mathbf{W}_c\mathbf{A}^\mathsf{T}$.

::: key Controllability Gramian
$\mathbf{W}_c = \int_0^{\infty} e^{\mathbf{A}t}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\,dt$; for a stable $\mathbf{A}$ it is the solution of the Lyapunov equation $\mathbf{A}\mathbf{W}_c + \mathbf{W}_c\mathbf{A}^\mathsf{T} + \mathbf{B}\mathbf{B}^\mathsf{T} = \mathbf{0}$. Its small singular values are the expensive directions: reaching $\mathbf{d}$ costs $\mathbf{d}^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{d}$ of input energy.
:::

::: example What a 5-degree slew costs, and how it scales
Take one axis of a small satellite, $J = 120\,\mathrm{kg\,m^2}$, with $\mathbf{x} = (\theta, \omega)$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{B} = (0,\ 1/J)^\mathsf{T}$. Since $e^{\mathbf{A}\sigma} = \begin{pmatrix}1&\sigma\\0&1\end{pmatrix}$, the integrand is $\frac{1}{J^2}\begin{pmatrix}\sigma^2&\sigma\\\sigma&1\end{pmatrix}$ and

$$\mathbf{W}_c(T) = \frac{1}{J^2}\begin{pmatrix} T^3/3 & T^2/2 \\ T^2/2 & T\end{pmatrix}, \qquad \mathbf{W}_c(T)^{-1} = J^2\begin{pmatrix} 12/T^3 & -6/T^2 \\ -6/T^2 & 4/T\end{pmatrix},$$

using $\det\mathbf{W}_c = T^4/12J^4$. Rest-to-rest through $\theta_f = 5^\circ = 0.087266\,\mathrm{rad}$ means $\mathbf{d} = (\theta_f, 0)^\mathsf{T}$, so the minimum energy is the $(1,1)$ entry times $\theta_f^2$:

$$E_{\min} = \frac{12J^2\theta_f^2}{T^3}.$$

At $T = 10\,\mathrm{s}$ that is $12(120)^2(0.087266)^2/1000 = 1.316\ (\mathrm{N\,m})^2\mathrm{s}$. At $T = 5\,\mathrm{s}$ it is $10.53$, and at $T = 20\,\mathrm{s}$ it is $0.1645$: halving the manoeuvre time multiplies the energy by eight. That $1/T^3$ law is the first honest answer to "why not make the loop faster", and Lesson 6 meets its twin in the gain scaling.

The optimal input itself comes out of the formula as $u^\star(t) = J\theta_f\left[12(T-t)/T^3 - 6/T^2\right]$, a straight line running from $+6J\theta_f/T^2$ down through zero at mid-manoeuvre to $-6J\theta_f/T^2$: accelerate, then brake, with the switch exactly halfway. At $T = 10\,\mathrm{s}$ the peak is $6(120)(0.087266)/100 = 0.628\,\mathrm{N\,m}$, which four pyramid wheels of $0.2\,\mathrm{N\,m}$ each could supply and one could not. Notice that a minimum-*energy* profile is a ramp, not the bang-bang profile that minimises *time* — the cost function you pick decides the shape.
:::

## The PBH test

The rank test tells you the deficit. It does not tell you which mode is to blame, and in a review that is the only question anyone asks. The Popov–Belevitch–Hautus test fixes this.

::: key PBH (Popov–Belevitch–Hautus) test
$(\mathbf{A},\mathbf{B})$ is controllable if and only if $\operatorname{rank}\left[\mathbf{A} - \lambda\mathbf{I},\ \mathbf{B}\right] = n$ for **every** eigenvalue $\lambda$ of $\mathbf{A}$. Its value is that it names the offending mode, not only the rank deficit.
:::

Only eigenvalues need testing, because for any other $\lambda$ the block $\mathbf{A}-\lambda\mathbf{I}$ is already invertible and the rank is $n$ regardless of $\mathbf{B}$.

The direction you use most is easy to prove. Suppose the rank is short at some $\lambda$. Then the rows of $[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}]$ are dependent, so there is a non-zero $\mathbf{w}$ with $\mathbf{w}^\mathsf{T}(\mathbf{A}-\lambda\mathbf{I}) = \mathbf{0}^\mathsf{T}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}^\mathsf{T}$. The first says $\mathbf{w}$ is a **left eigenvector** of $\mathbf{A}$ for $\lambda$, that is $\mathbf{w}^\mathsf{T}\mathbf{A} = \lambda\mathbf{w}^\mathsf{T}$. Then

$$\mathbf{w}^\mathsf{T}\mathbf{C}_m = \left[\mathbf{w}^\mathsf{T}\mathbf{B},\ \mathbf{w}^\mathsf{T}\mathbf{A}\mathbf{B},\ \dots\right] = \left[\mathbf{0},\ \lambda\mathbf{w}^\mathsf{T}\mathbf{B},\ \lambda^2\mathbf{w}^\mathsf{T}\mathbf{B},\ \dots\right] = \mathbf{0}^\mathsf{T},$$

so $\mathbf{C}_m$ has a left null vector and cannot have rank $n$. The converse also holds and is the part that makes the test an equivalence. The left eigenvector $\mathbf{w}$ is the payoff: it is a direction in state space that no input can ever affect, expressed in the coordinates of your model, so you can read the physics straight off it.

The same statement in modal coordinates is worth holding in your head. If $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ with distinct eigenvalues, then $\bar{\mathbf{B}} = \mathbf{V}^{-1}\mathbf{B}$ and the rows of $\mathbf{V}^{-1}$ are precisely the left eigenvectors. Mode $i$ is uncontrollable exactly when row $i$ of $\bar{\mathbf{B}}$ is zero: the input has no path into that mode. Lesson 2's remark that $\bar{\mathbf{B}}$ tells you how hard each input drives each mode was this theorem in disguise.

::: warning "Uncontrollable" is a property of a model, at a rank tolerance
Rank is discontinuous, floating point is not, and no real matrix is ever exactly rank deficient. Never test controllability with an exact rank on $\mathbf{C}_m$ for anything beyond a small hand problem: the matrix contains powers of $\mathbf{A}$ up to $n-1$, so its condition number is roughly the condition number of $\mathbf{A}$ raised to the $n-1$, and for $n = 10$ that is meaningless. Use the singular values of $\mathbf{C}_m$ with a stated tolerance, or better the Gramian, which asks the physically meaningful question — how much energy does this direction cost — instead of the numerically fragile one. Scale the model first (Lesson 2), because otherwise you are measuring your choice of units.
:::

## Reading a deficiency as a physical direction

::: example Reaction-wheel failures on the pyramid
Return to the six-state spacecraft of Lesson 1: $\mathbf{x} = (\boldsymbol{\theta}, \boldsymbol{\omega})$, $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$, $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$, with the four pyramid wheel axes $(\pm1,\pm1,1)/\sqrt{3}$ as the columns of $\mathbf{A}_w$ and $\mathbf{J} = \operatorname{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$.

Because $\mathbf{A}^2 = \mathbf{0}$, the controllability matrix has only two non-zero blocks: $\mathbf{C}_m = [\mathbf{B},\ \mathbf{A}\mathbf{B},\ \mathbf{0},\ \dots]$ with $\mathbf{A}\mathbf{B} = \begin{pmatrix}\mathbf{J}^{-1}\mathbf{A}_w\\\mathbf{0}\end{pmatrix}$. So

$$\operatorname{rank}\mathbf{C}_m = 2\,\operatorname{rank}\left(\mathbf{J}^{-1}\mathbf{A}_w\right) = 2\,\operatorname{rank}(\mathbf{A}_w),$$

since $\mathbf{J}$ is invertible. Everything reduces to the rank of the $3\times4$ wheel geometry, which is exactly the result you would want: attitude controllability of a rigid body is a statement about torque directions, and the factor of two is the rate and the angle about each available axis.

**All four wheels healthy.** Any three of the cube diagonals are independent — the determinant of three of them is $4/(3\sqrt{3}) = 0.770$ — so $\operatorname{rank}\mathbf{A}_w = 3$ and $\operatorname{rank}\mathbf{C}_m = 6$. Controllable.

**Any one wheel failed.** Three columns remain and they are independent, so the rank is still $6$. All four single failures are survivable, which is the entire reason for the pyramid.

**Any two wheels failed.** Two columns remain, spanning a plane, so $\operatorname{rank}\mathbf{A}_w = 2$ and $\operatorname{rank}\mathbf{C}_m = 4$. The lost torque direction is the normal to that plane, $\hat{\mathbf{n}} \propto \mathbf{a}_i\times\mathbf{a}_j$ for the two survivors. Losing wheels 1 and 3 leaves $\mathbf{a}_2 = (-1,1,1)/\sqrt{3}$ and $\mathbf{a}_4 = (1,-1,1)/\sqrt{3}$, whose cross product is along $(1,1,0)/\sqrt{2}$: the body direction $45^\circ$ between $+x$ and $+y$. Losing 1 and 2 leaves the lost direction along $(0,1,1)/\sqrt{2}$, and so on for all six pairs. In every case you have lost one axis, and you can name it before you run anything.

Put the Gramian on the same three cases, over a $T = 100\,\mathrm{s}$ horizon and with the state in $\mathrm{rad}$ and $\mathrm{rad/s}$, by asking the one question that matters: what does it cost to rotate $1^\circ$ about $(1,1,0)/\sqrt{2}$ and stop?

| Wheel 1 and 3 authority | $\operatorname{rank}\mathbf{C}_m$ | $\sigma_{\min}(\mathbf{W}_c)$ | $E_{\min}$, $(\mathrm{N\,m})^2\mathrm{s}$ |
| --- | --- | --- | --- |
| full | 6 | $8.33\times10^{-6}$ | $5.06\times10^{-3}$ |
| $1\,\%$ | 6 | $1.81\times10^{-9}$ | $50.0$ |
| zero | 4 | $4\times10^{-19}$ (round-off) | unbounded |

The rank test calls the middle row controllable, which it is, and says nothing more. The Gramian says the manoeuvre costs ten thousand times more energy than it should — which is the answer a flight director needs.
:::

::: example A spacecraft with wheels on only two axes
Suppose the wheels are mounted on the body $x$ and $y$ axes and nothing acts about $z$: $\mathbf{A}_w = \begin{pmatrix}1&0\\0&1\\0&0\end{pmatrix}$. Then $\operatorname{rank}\mathbf{A}_w = 2$ and $\operatorname{rank}\mathbf{C}_m = 4$, so the six-state model is uncontrollable with a two-dimensional unreachable subspace: the attitude angle $\theta_z$ and the body rate $\omega_z$.

Now run PBH. All six eigenvalues of $\mathbf{A}$ are zero, so there is one matrix to test, $[\mathbf{A},\ \mathbf{B}]$, and its rank is $5$. The left null vector — computed, or read off by hand from $\mathbf{w}^\mathsf{T}\mathbf{A} = \mathbf{0}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}$ — is $\mathbf{w} = (0,0,0,\ 0,0,1)^\mathsf{T}$. It points along $\omega_z$. The reading is immediate: no combination of wheel torques can change the body rate about $z$, because no wheel has a component along $z$.

The two rank numbers differ, and the difference is instructive. PBH is short by one because there is a single blocked Jordan chain at $\lambda = 0$; the Kalman test is short by two because that chain is two states long, $\omega_z$ feeding $\theta_z$. Had you written the model with only the three body rates as states, the Kalman deficiency would also have been one. Both are describing the same missing axis.

What the linear model cannot see is the nonlinear term it threw away. The full Euler equation is $\mathbf{J}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} = \boldsymbol{\tau}$, and the gyroscopic cross term couples the axes whenever the body is already rotating. A two-axis-actuated rigid body genuinely is controllable in the nonlinear sense, by spinning up one axis and using the coupling to bleed momentum into the third — but the authority available that way is small, the manoeuvres are slow, and none of the linear design tools in this module apply to them. The honest statement in a review names both halves: uncontrollable in the linearisation about rest, with the missing direction being rotation about the unactuated axis; controllable in principle through the nonlinear coupling, with authority you should not plan a mission around.
:::

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

The last line reads oddly until you notice that all six eigenvalues of this $\mathbf{A}$ are the same number, zero, so PBH flags the repeated eigenvalue six times. For a plant with distinct eigenvalues the list names exactly the modes at fault.

::: note Controllable, stabilizable, and what you actually need
Full controllability is more than most designs require. If an uncontrollable mode is stable it decays on its own and does no harm; the weaker condition that every mode with $\operatorname{Re}\lambda \ge 0$ be controllable is called **stabilizability**, and it is the real requirement for a stabilizing state feedback to exist. The next lesson states it precisely alongside its observability twin, detectability, because the two are always checked together.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -2, -3)\,\mathrm{s^{-1}}$ and $\mathbf{B} = (1, 1, 0)^\mathsf{T}$. Is it controllable? Use both tests and say which mode is at fault.
:::

::: answer
$\mathbf{C}_m = [\mathbf{B}, \mathbf{A}\mathbf{B}, \mathbf{A}^2\mathbf{B}] = \begin{pmatrix}1&-1&1\\1&-2&4\\0&0&0\end{pmatrix}$, whose third row is zero, so the rank is $2$ and the system is uncontrollable. PBH: test each eigenvalue. At $\lambda = -3$, $[\mathbf{A}+3\mathbf{I},\ \mathbf{B}] = \begin{pmatrix}2&0&0&1\\0&1&0&1\\0&0&0&0\end{pmatrix}$ has rank $2 < 3$, with left null vector $\mathbf{w} = (0,0,1)^\mathsf{T}$. At $\lambda = -1$ and $\lambda = -2$ the rank is $3$. So the $-3$ mode is the one with no input path — as the modal form shows directly, since row 3 of $\mathbf{B}$ is zero. The system is nonetheless stabilizable, because the uncontrollable mode decays with a $0.33\,\mathrm{s}$ time constant on its own.
:::

::: check
Why does controllability of the six-state rigid-body spacecraft reduce to the rank of the $3\times4$ wheel geometry matrix, and what would change if the vehicle had a gravity-gradient restoring torque?
:::

::: answer
Because $\mathbf{A}$ is nilpotent with $\mathbf{A}^2 = \mathbf{0}$, so only $\mathbf{B}$ and $\mathbf{A}\mathbf{B}$ contribute; those two blocks are $\begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$ and $\begin{pmatrix}\mathbf{J}^{-1}\mathbf{A}_w\\\mathbf{0}\end{pmatrix}$, occupying disjoint blocks of rows, so the rank is twice $\operatorname{rank}(\mathbf{J}^{-1}\mathbf{A}_w) = \operatorname{rank}(\mathbf{A}_w)$. With a gravity-gradient term the top-right block of $\mathbf{A}$ is joined by a non-zero bottom-left block coupling attitude back into rate, $\mathbf{A}$ is no longer nilpotent, and $\mathbf{A}^2\mathbf{B}$ onwards can add new directions. A torque direction unreachable at first order might then become reachable through the restoring torque — at a rate set by the orbital frequency, which is to say very slowly. The rank test would have to be run in full rather than reduced by hand.
:::

::: check
The minimum energy to reach a state $\mathbf{d}$ is $\mathbf{d}^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{d}$. What does an eigenvalue of $\mathbf{W}_c$ equal to $10^{-9}$ mean, and why is the answer incomplete without more information?
:::

::: answer
It means that reaching a unit displacement along the corresponding eigenvector costs $10^{9}$ units of input energy — a billion times more than a direction whose eigenvalue is $1$. Operationally: that direction is effectively unreachable with real actuators, and any controller that tries will saturate. The answer is incomplete because the eigenvalues of $\mathbf{W}_c$ are not invariant under a change of state units; the Gramian transforms by congruence, $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$, so $10^{-9}$ in radians and $10^{-9}$ in arcseconds are different physical statements. You need the state definition and its units, and ideally a model scaled so one unit of each state is one unit of engineering significance.
:::

::: check
A rest-to-rest slew of $20^\circ$ on a $2000\,\mathrm{kg\,m^2}$ axis is to be done in $60\,\mathrm{s}$. Find the minimum energy and the peak torque of the minimum-energy profile. If the wheels can supply $0.2\,\mathrm{N\,m}$ about that axis, does it fit?
:::

::: answer
$\theta_f = 20^\circ = 0.34907\,\mathrm{rad}$, $J = 2000\,\mathrm{kg\,m^2}$, $T = 60\,\mathrm{s}$. Energy: $E = 12J^2\theta_f^2/T^3 = 12(4\times10^6)(0.12185)/216000 = 27.1\ (\mathrm{N\,m})^2\mathrm{s}$. Peak torque: $6J\theta_f/T^2 = 6(2000)(0.34907)/3600 = 1.164\,\mathrm{N\,m}$, at the two ends. That is nearly six times the available $0.2\,\mathrm{N\,m}$, so the manoeuvre does not fit. Scaling back, the peak torque falls as $1/T^2$, so you need $T \ge 60\sqrt{1.164/0.2} = 145\,\mathrm{s}$ — and in practice more, because the minimum-energy profile is not what a feedback controller produces and the wheels also have to reject disturbances while slewing.
:::

::: check
An engineer reports that a 14-state launch vehicle model is uncontrollable because `matrix_rank` on its controllability matrix returned 12. What would you ask before believing it?
:::

::: answer
First, what units the states are in and whether the model was scaled — an unscaled model mixing metres, radians and newtons can have a $\mathbf{C}_m$ whose singular values span the whole dynamic range for reasons that have nothing to do with the vehicle. Second, what tolerance the rank was computed at, and what the actual singular value spectrum looks like: a clean gap of ten orders of magnitude between $\sigma_{12}$ and $\sigma_{13}$ is evidence, and a smooth decay is not. Third, what PBH says, because it names the modes and a physical interpretation either exists or it does not. Fourth — and usually decisive — what the Gramian says about energy in the suspect directions. For $n = 14$, $\mathbf{C}_m$ contains $\mathbf{A}^{13}$ and its condition number is effectively unbounded; a rank computed from it is not evidence of anything on its own.
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

Everything here has a mirror image. Swap $\mathbf{A}$ for $\mathbf{A}^\mathsf{T}$ and $\mathbf{B}$ for $\mathbf{C}^\mathsf{T}$ and the rank test, the Gramian and PBH all become statements about what your sensors can see. The next lesson makes that duality exact and uses it to find an unobservable gyro bias.
