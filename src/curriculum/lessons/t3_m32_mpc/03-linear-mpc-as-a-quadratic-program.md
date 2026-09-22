---
id: l03-linear-mpc-as-a-quadratic-program
title: Linear MPC as a quadratic program
minutes: 18
covers:
  - Linear MPC as a quadratic program; condensed vs sparse formulations
---

The problem of the previous lesson has to reach a solver, and solvers do not accept "minimise a quadratic subject to some dynamics". They accept a matrix and a vector. This lesson does the algebra that turns the finite-horizon problem into the standard quadratic program of the optimization module, in the two ways it is done, and shows what the choice between them costs.

The choice is not cosmetic. One form gives a small dense problem whose size does not grow with the state dimension; the other gives a large sparse problem whose solve time grows linearly rather than cubically in the horizon. Both give the same answer to machine precision — verified below — and the difference between them is the difference between a controller that runs at $N = 10$ and one that runs at $N = 100$ on the same processor.

This is also where the connection to the LQR module closes. The sparse form's linear algebra, done in the right order, *is* the Riccati recursion. MPC is not a different theory from LQR; it is the same problem with inequality constraints bolted on, and the same recursion buried one level down inside the solver.

## The standard form

Both formulations produce

$$
\min_{\mathbf{z}} \ \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}
\quad\text{subject to}\quad
\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}, \quad \mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}} ,
$$

with $\mathbf{z}$ the vector of decision variables, $\mathbf{H} = \mathbf{H}^\top \succeq 0$ the Hessian, and the inequality read component-wise. They differ in what goes into $\mathbf{z}$.

::: key Linear MPC as a QP
Quadratic cost plus linear dynamics and polytopic constraints gives $\min \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}$ subject to $\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}$ and $\mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}}$. $\mathbf{H}$ is positive definite when $\mathbf{R}$ is, so the problem is convex with a unique minimiser.
:::

## Condensing: eliminate the states

The dynamics determine the states from the inputs, so the states need not be unknowns at all. Iterate $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k$ from $\mathbf{x}_0 = \mathbf{x}$:

$$
\mathbf{x}_k = \mathbf{A}^k\mathbf{x} + \sum_{j=0}^{k-1}\mathbf{A}^{k-1-j}\mathbf{B}\mathbf{u}_j .
$$

Stack the predicted states $\mathbf{X} = (\mathbf{x}_1, \dots, \mathbf{x}_N) \in \mathbb{R}^{Nn}$ and the inputs $\mathbf{U} = (\mathbf{u}_0, \dots, \mathbf{u}_{N-1}) \in \mathbb{R}^{Nm}$, and the relation above is linear:

$$
\mathbf{X} = \mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U},
\qquad
\mathbf{S}_x = \begin{bmatrix}\mathbf{A} \\ \mathbf{A}^2 \\ \vdots \\ \mathbf{A}^N\end{bmatrix},
\qquad
\mathbf{S}_u = \begin{bmatrix}
\mathbf{B} & & & \\
\mathbf{A}\mathbf{B} & \mathbf{B} & & \\
\vdots & & \ddots & \\
\mathbf{A}^{N-1}\mathbf{B} & \mathbf{A}^{N-2}\mathbf{B} & \cdots & \mathbf{B}
\end{bmatrix} .
$$

$\mathbf{S}_u$ is block lower triangular because an input cannot affect the past — it is the discrete impulse-response (Toeplitz) matrix of the plant, and in the process-control literature it is called the dynamic matrix, which is where Dynamic Matrix Control got its name.

Write $\bar{\mathbf{Q}} = \mathrm{blkdiag}(\mathbf{Q}, \dots, \mathbf{Q}, \mathbf{P})$ with $N-1$ copies of $\mathbf{Q}$ and the terminal $\mathbf{P}$ last, and $\bar{\mathbf{R}} = \mathrm{blkdiag}(\mathbf{R},\dots,\mathbf{R})$. The cost becomes

$$
J = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{X}^\top\bar{\mathbf{Q}}\mathbf{X} + \mathbf{U}^\top\bar{\mathbf{R}}\mathbf{U}
= \tfrac{1}{2}\mathbf{U}^\top\mathbf{H}\mathbf{U} + (\mathbf{F}\mathbf{x})^\top\mathbf{U} + \text{const},
$$

with

$$
\mathbf{H} = 2\left(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}}\right), \qquad
\mathbf{F} = 2\,\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_x ,
$$

obtained by expanding $(\mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U})^\top\bar{\mathbf{Q}}(\mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U})$ and collecting the terms quadratic and linear in $\mathbf{U}$. The constant $\mathbf{x}^\top(\mathbf{Q} + \mathbf{S}_x^\top\bar{\mathbf{Q}}\mathbf{S}_x)\mathbf{x}$ does not affect the minimiser and is dropped by most implementations — keep it if you want $V_N^0$ itself, for example to monitor the Lyapunov decrease.

Constraints map the same way. Input bounds are already in the variables: $|u_k| \le u_{\max}$ becomes $\pm\mathbf{U} \le u_{\max}\mathbf{1}$. State constraints $\mathbf{G}_x\mathbf{x}_k \le \mathbf{h}_x$ become, after substitution,

$$
\mathbf{G}_x\mathbf{S}_u\mathbf{U} \le \mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x} ,
$$

so the state-constraint rows have a *state-dependent right-hand side*, rebuilt every cycle, while the matrix on the left is constant. That is the pattern to remember for code generation: for a time-invariant problem $\mathbf{H}$, $\mathbf{F}$, $\mathbf{S}_u$ and the constraint matrix are all build-time constants, and only two vectors change per cycle.

```python
import numpy as np

A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
Q, R = np.eye(2), np.array([[0.1]])
P = np.array([[13.317224, 3.201562], [3.201562, 4.603514]])   # LQR cost-to-go

def build_condensed(A, B, Q, R, P, N):
    """X = Sx x0 + Su U for X = [x_1 ... x_N];  J = 0.5 U'HU + (F x0)'U + const."""
    n, m = B.shape
    Sx = np.vstack([np.linalg.matrix_power(A, k + 1) for k in range(N)])
    Su = np.zeros((N * n, N * m))
    for k in range(N):
        for j in range(k + 1):
            Su[k * n:(k + 1) * n, j * m:(j + 1) * m] = np.linalg.matrix_power(A, k - j) @ B
    Qbar = np.kron(np.eye(N), Q)
    Qbar[(N - 1) * n:, (N - 1) * n:] = P
    Rbar = np.kron(np.eye(N), R)
    H = 2 * (Su.T @ Qbar @ Su + Rbar)
    F = 2 * (Su.T @ Qbar @ Sx)
    return H, F, Sx, Su, Qbar

N = 5
H, F, Sx, Su, Qbar = build_condensed(A, B, Q, R, P, N)
rng = np.random.default_rng(0)
x0, U = rng.standard_normal(2), rng.standard_normal(N)

X = (Sx @ x0 + Su @ U).reshape(N, 2)                     # predicted states
explicit = (x0 @ Q @ x0 + sum(X[k] @ Q @ X[k] for k in range(N - 1))
            + X[N - 1] @ P @ X[N - 1] + float(R[0, 0]) * (U @ U))
condensed = 0.5 * U @ H @ U + (F @ x0) @ U + x0 @ (Q + Sx.T @ Qbar @ Sx) @ x0
print(f"explicit {explicit:.10f}   condensed {condensed:.10f}   difference {abs(explicit-condensed):.2e}")
print("H is dense:", np.count_nonzero(np.abs(H) > 1e-14), "of", H.size, "entries")

# explicit 0.5130213391   condensed 0.5130213391   difference 0.00e+00
# H is dense: 25 of 25 entries
```

Always write this check before trusting a condensed build. Rolling the dynamics out explicitly for a random input sequence and comparing the two cost evaluations catches a transposed block, an off-by-one in the terminal weight or a misplaced factor of two in one line, and all three of those are common.

## The sparse form: keep the states

The other choice is to leave the states as decision variables and let the dynamics be equality constraints:

$$
\mathbf{z} = (\mathbf{x}_1, \dots, \mathbf{x}_N, \mathbf{u}_0, \dots, \mathbf{u}_{N-1}) \in \mathbb{R}^{N(n+m)} ,
$$

with $\mathbf{A}_{\text{eq}}$ built from the $N$ blocks

$$
\mathbf{x}_{k+1} - \mathbf{A}\mathbf{x}_k - \mathbf{B}\mathbf{u}_k = \mathbf{0}, \qquad k = 0,\dots,N-1,
$$

the $k = 0$ block moving $\mathbf{A}\mathbf{x}$ to the right-hand side since $\mathbf{x}_0$ is data. The Hessian is block diagonal — $\mathbf{Q}$ for each state block, $\mathbf{P}$ for the last, $\mathbf{R}$ for each input block — and there is no cross term at all, so $\mathbf{f} = \mathbf{0}$ for a regulation problem. Every constraint is on a single variable block, so state constraints do not mix with input constraints the way they do after condensing.

The problem is much larger and almost entirely empty. Its virtue is *structure*: order the variables by time step, $(\mathbf{x}_1, \mathbf{u}_1, \mathbf{x}_2, \mathbf{u}_2, \dots)$, and the KKT matrix of the optimization module becomes block tridiagonal with blocks of size $n+m$. A banded factorisation then costs work proportional to $N$, not $N^3$. Done in exactly the right order, that banded factorisation is the backward Riccati recursion from the LQR module with the active inequality constraints folded in — which is why a sparse MPC solve and an LQR solve cost about the same per horizon step.

::: key Condensed vs sparse formulation
Condensed: eliminate the states, leaving a small dense QP in the inputs only — good for short horizons. Sparse: keep states as variables with dynamics as equality constraints — larger but banded, so cost grows linearly rather than cubically in $N$.
:::

::: example The same problem, both ways
The proximity-ops axis again, with the velocity limit $|x_2| \le 0.5\,\mathrm{m/s}$ added, $N = 20$, terminal cost $\mathbf{P}$ from the Riccati equation, starting from $\mathbf{x} = (2, 0)$.

| | condensed | sparse |
| --- | --- | --- |
| decision variables | $Nm = 20$ | $N(n+m) = 60$ |
| equality constraints | none | $Nn = 40$ |
| inequality rows | $80$ | $80$ |
| Hessian nonzeros | $400$ of $400$ (fully dense) | $62$ of $3600$ |
| equality-matrix nonzeros | — | $137$ of $2400$ |

Solved with the same primal-dual interior-point code, both take $15$ iterations and return $u_0^\star = -1.0000000000$; the two optimal input sequences agree to $8.5 \times 10^{-16}$, which is the arithmetic noise of double precision and not a tolerance anyone had to choose. That agreement is the check to run whenever a formulation is changed: the two forms have completely different bug surfaces, and a disagreement larger than $10^{-9}$ means one of them is wrong.

The density figures are the whole story in miniature. The condensed Hessian has no zeros, because every input affects every later state; the sparse one has $1.7\,\%$ of its entries filled, because the cost couples nothing across time. Condensing trades sparsity for size.
:::

## Which form, and when

Count the arithmetic. Assume an interior-point solver, so the dominant cost per iteration is one factorisation of a matrix of the same shape every time.

- **Condensed**: a dense $Nm \times Nm$ system, factorised at about $\tfrac{1}{3}(Nm)^3$ flops. Growth is *cubic in the horizon* and depends on the input dimension, not on the state dimension.
- **Sparse**: a block-tridiagonal system with blocks of size $n+m$, factorised at about $N(n+m)^3$ flops. Growth is *linear in the horizon*.

::: example Where the crossover falls
Applying the two counts, with the double integrator ($n = 2$, $m = 1$) and a three-axis rendezvous model ($n = 6$, $m = 3$):

| $N$ | condensed flops, $n{=}2$, $m{=}1$ | sparse flops | condensed flops, $n{=}6$, $m{=}3$ | sparse flops |
| --- | --- | --- | --- | --- |
| $5$ | $42$ | $135$ | $1{,}125$ | $3{,}645$ |
| $10$ | $333$ | $270$ | $9{,}000$ | $7{,}290$ |
| $20$ | $2{,}667$ | $540$ | $72{,}000$ | $14{,}580$ |
| $40$ | $21{,}333$ | $1{,}080$ | $576{,}000$ | $29{,}160$ |
| $80$ | $170{,}667$ | $2{,}160$ | $4{,}608{,}000$ | $58{,}320$ |

Setting $\tfrac{1}{3}(Nm)^3 = N(n+m)^3$ gives the crossover horizon

$$
N^\star = \sqrt{3}\left(\frac{n+m}{m}\right)^{3/2},
$$

which is $9$ for both systems above (they share the ratio $(n+m)/m = 3$), and $19$ for a twelve-state flexible vehicle with three inputs. At $N = 80$ the condensed form does $79$ times the arithmetic of the sparse one on the double integrator.

Treat these as scaling laws with the constants stripped out, not as measurements. A dense factorisation of a $20 \times 20$ matrix runs at near-peak throughput on a cached processor, while a banded solver pays indexing overhead per block, so the real crossover on real hardware sits higher than the flop count suggests — commonly in the range $N = 10$ to $30$. What the counts do tell you reliably is the *slope*: past the crossover the condensed form loses ground as $N^2$, and no amount of implementation care recovers that.
:::

Two more considerations decide real designs. Condensing is insensitive to the state dimension, so a plant with fifty states and two inputs condenses to a tiny QP; that is why dense active-set solvers remain popular for attitude control. And condensing produces a problem with no equality constraints at all, which some embedded solvers prefer.

## The conditioning trap

Condensing has a numerical cost that the flop count does not show. $\mathbf{S}_u$ contains $\mathbf{A}^{N-1}\mathbf{B}$, so if the plant has an open-loop eigenvalue $\lambda$ with $|\lambda| > 1$, entries of $\mathbf{S}_u$ grow like $|\lambda|^N$ and the condensed Hessian, being built from $\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u$, has a condition number growing like $|\lambda|^{2N}$.

::: warning The condensed Hessian of an unstable plant loses digits exponentially
Take a launch-vehicle pitch axis with aerodynamic instability, $\ddot{\theta} = \omega^2\theta + u$ with $\omega^2 = 4\,\mathrm{s^{-2}}$ (time to double $\ln 2 / 2 = 0.347\,\mathrm{s}$), sampled at $T_s = 0.05\,\mathrm{s}$, so the unstable discrete eigenvalue is $\lambda = e^{0.1} = 1.10517$. Computed condition numbers of the condensed Hessian, alongside the marginally stable double integrator:

| $N$ | double integrator | unstable pitch axis |
| --- | --- | --- |
| $10$ | $1.65\times10^{1}$ | $1.04\times10^{1}$ |
| $20$ | $8.13\times10^{1}$ | $8.22\times10^{1}$ |
| $40$ | $5.89\times10^{2}$ | $4.51\times10^{3}$ |
| $80$ | $5.79\times10^{3}$ | $1.34\times10^{7}$ |
| $160$ | $7.02\times10^{4}$ | $1.23\times10^{14}$ |

The unstable column multiplies by $2979$ between $N = 80$ and $N = 40$, against the predicted $\lambda^{2\times 40} = e^{8} = 2981$ — the growth law is exactly $|\lambda|^{2N}$. At $N = 160$, four seconds of horizon at this sample rate, the condensed Hessian has a condition number of $10^{14}$: of the roughly $16$ significant digits in double precision, two remain. The solver will still return something, and it will be wrong in ways that look like noise on the command.

The sparse form does not have this problem. Its Hessian is $\mathrm{blkdiag}(\mathbf{Q},\dots,\mathbf{P},\mathbf{R},\dots)$, whose conditioning is that of the weights alone and does not depend on $N$ or on $\mathbf{A}$ at all; the dynamics live in the equality constraints, where a power of $\mathbf{A}$ never appears. For an open-loop unstable vehicle — a launcher in the transonic region, a lifting body, a rocket standing on its engine — the sparse form is not an optimisation, it is a requirement. The alternative is to pre-stabilise: condense the dynamics of $\mathbf{A} - \mathbf{B}\mathbf{K}$ for some stabilising $\mathbf{K}$ and let the optimiser choose the correction $\mathbf{v}_k$ in $\mathbf{u}_k = -\mathbf{K}\mathbf{x}_k + \mathbf{v}_k$, which keeps the small dense problem while removing the unstable powers.
:::

## Check yourself

::: check
For a plant with $n = 30$ states and $m = 2$ inputs and a horizon $N = 15$, how many decision variables does each formulation have, and which would you choose?
:::

::: answer
Condensed: $Nm = 30$ variables, no equality constraints, a dense $30 \times 30$ Hessian. Sparse: $N(n+m) = 480$ variables with $Nn = 450$ equality constraints. The crossover estimate is $N^\star = \sqrt{3}((n+m)/m)^{3/2} = \sqrt{3}\cdot 16^{3/2} = 111$, far above $15$, so the condensed form wins decisively — its cost does not care that there are thirty states. This is the normal situation in attitude control, where a flexible-mode model has many states and three or four torque inputs. The answer flips if the plant is open-loop unstable, in which case either use the sparse form or pre-stabilise before condensing.
:::

::: check
Why does the state-constraint right-hand side $\mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$ have to be rebuilt every cycle in the condensed form, while the corresponding sparse constraint does not?
:::

::: answer
After condensing, a predicted state is $\mathbf{x}_k = \mathbf{A}^k\mathbf{x} + (\text{terms in }\mathbf{U})$, so the constraint on it becomes a constraint on $\mathbf{U}$ whose slack depends on where the vehicle is right now. The free-response part $\mathbf{A}^k\mathbf{x}$ moves to the right-hand side and changes every cycle. In the sparse form $\mathbf{x}_k$ is a decision variable and the constraint is written directly on it, so the row is a constant; the current state enters only through the first equality constraint's right-hand side, $\mathbf{A}\mathbf{x}$. In both cases the *matrices* are constant and only vectors change, which is what code generation needs, but the condensed form has more vector to rebuild — one matrix-vector product with $\mathbf{G}_x\mathbf{S}_x$ per cycle.
:::

::: check
The condensed and sparse solutions of the same problem differ by $3\times10^{-4}$ in the first input. Is that acceptable?
:::

::: answer
No — treat it as a bug until proved otherwise. The two formulations are algebraically identical problems, so at a solver tolerance of $10^{-8}$ or so they should agree to near machine precision, as the worked example did at $8.5\times10^{-16}$. A discrepancy of $3\times10^{-4}$ has three likely causes: a genuine formulation error, most often the terminal weight applied to the wrong stage or a state constraint imposed at $k = 0$ in one form and $k = 1$ in the other; a solver stopping far from optimality, which shows up as a difference that shrinks when the tolerance is tightened; or a badly conditioned condensed Hessian, which shows up as a difference that grows with $N$ and with the plant's instability. Check the third by printing the condition number, the second by tightening the tolerance, and the first by the random-input cost comparison in the code above.
:::

::: check
The condensed Hessian $\mathbf{H} = 2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$ is constant for a time-invariant problem. Which parts of the QP actually change from cycle to cycle, and what does that buy an embedded implementation?
:::

::: answer
Only two vectors: the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$, and the right-hand side of the state-constraint rows, $\mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$. Input bounds, the Hessian and every constraint matrix are build-time constants. An embedded implementation exploits this in three ways: the matrices are baked into read-only memory with no runtime assembly; a Cholesky factor of $\mathbf{H}$ can be computed offline for use inside an active-set method; and the sparsity pattern, elimination ordering and workspace size are known before the vehicle flies, which is what the certification argument in the real-time lesson needs. The same is true of the sparse form, where $\mathbf{H}$ and $\mathbf{A}_{\text{eq}}$ are constant and only $\mathbf{b}_{\text{eq}}$'s first block changes.
:::

::: check
Explain why the sparse KKT system is block tridiagonal when the variables are ordered by time step, and what recursion solves it.
:::

::: answer
Two structural facts. The cost couples nothing across time — the stage cost at $k$ involves only $\mathbf{x}_k$ and $\mathbf{u}_k$ — so the Hessian is block diagonal. And each dynamics constraint couples only consecutive time steps, $\mathbf{x}_{k+1}$ to $(\mathbf{x}_k, \mathbf{u}_k)$, so the equality-constraint Jacobian has nonzeros only on the diagonal and one block off it. Assembling the KKT matrix from those two pieces with the variables and multipliers interleaved by time gives a block tridiagonal matrix with blocks of size $n+m$. Factorising it by eliminating from the last stage backwards produces, at each step, the same "solve a small system, fold the result into the previous stage" operation as the backward Riccati recursion of the LQR module; with no active inequality constraints it *is* that recursion. This is why the sparse form scales linearly in $N$, and why the HPIPM-style solvers advertise a Riccati-based interior-point method.
:::

## Summary

| Object | Statement |
| --- | --- |
| Standard QP | $\min \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}$ s.t. $\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}$, $\mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}}$ |
| Prediction | $\mathbf{X} = \mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U}$, $\mathbf{S}_u$ block lower triangular (the dynamic matrix) |
| Condensed cost | $\mathbf{H} = 2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$, $\mathbf{F} = 2\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_x$, $\mathbf{f} = \mathbf{F}\mathbf{x}$ |
| Condensed constraints | $\mathbf{G}_x\mathbf{S}_u\mathbf{U} \le \mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$: constant matrix, state-dependent right-hand side |
| Sparse variables | $\mathbf{z} = (\mathbf{x}_1..\mathbf{x}_N, \mathbf{u}_0..\mathbf{u}_{N-1})$, dynamics as $Nn$ equalities, block-diagonal $\mathbf{H}$ |
| Sizes at $N = 20$ | Condensed $20$ variables, dense $\mathbf{H}$ ($400/400$); sparse $60$ variables, $40$ equalities, $\mathbf{H}$ $62/3600$ |
| Agreement | Same solver, $15$ iterations each, optimal sequences equal to $8.5\times10^{-16}$ |
| Flop scaling | Condensed $\tfrac{1}{3}(Nm)^3$ per factorisation; sparse $\approx N(n+m)^3$ |
| Crossover | $N^\star = \sqrt{3}\,((n+m)/m)^{3/2}$: $9$ for $n{=}2,m{=}1$ and $n{=}6,m{=}3$; $19$ for $n{=}12,m{=}3$ |
| Conditioning | $\mathrm{cond}(\mathbf{H}) \sim |\lambda|^{2N}$ for an unstable $\lambda$: $1.23\times10^{14}$ at $N = 160$ for $\lambda = 1.105$ |
| Fix | Use the sparse form, or pre-stabilise with $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ and condense $\mathbf{A} - \mathbf{B}\mathbf{K}$ |

The next lesson fills in the constraint sets properly: what belongs in $\mathbb{U}$ and $\mathbb{X}$, why hard state constraints are dangerous in flight, and how slack variables and an exact penalty make the QP always solvable.
