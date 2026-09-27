---
id: l03-linear-mpc-as-a-quadratic-program
title: Linear MPC as a quadratic program
minutes: 19
covers:
  - Linear MPC as a quadratic program; condensed vs sparse formulations
---

A calculator will not accept "find the cheapest plan that obeys the rules". It wants numbers in the right boxes. A solver is the same. It does not take "minimize a quadratic subject to some dynamics". It takes a matrix and a vector, in one fixed standard form. This lesson does the algebra that turns the problem of the previous lesson into that standard quadratic program, in the two ways it is done, and shows what the choice costs.

The choice is not cosmetic. One way gives a small, dense problem whose size does not grow with the number of states. The other gives a large, mostly-empty problem whose solve time grows only in step with the horizon, instead of with its cube. Both give the same answer to machine precision — you will see that checked below. The difference between them can be the difference between a controller that runs at $N = 10$ and one that runs at $N = 100$ on the same processor.

This is also where MPC and LQR meet again. The second form's linear algebra, done in the right order, *is* the Riccati recursion from the LQR module. MPC is not a separate theory from LQR. It is the same problem with inequality limits added, and the same recursion is buried one level down inside the solver.

## The standard form

Both ways end in

$$
\min_{\mathbf{z}} \ \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}
\quad\text{subject to}\quad
\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}, \quad \mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}} .
$$

Here $\mathbf{z}$ is the list of **decision variables** — the unknowns the solver chooses. $\mathbf{H} = \mathbf{H}^\top \succeq 0$ is the **[[Hessian|hessian]]**, the matrix of the quadratic part; it sets the shape of the cost bowl. $\mathbf{f}$ is the linear part; it tilts the bowl. The inequality $\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}$ is read row by row: each row is one limit. The two ways differ only in what goes into $\mathbf{z}$.

::: key Linear MPC as a QP
Quadratic cost plus linear dynamics and polytopic constraints gives $\min \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}$ subject to $\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}$ and $\mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}}$. $\mathbf{H}$ is positive definite when $\mathbf{R}$ is, so the problem is convex with a unique minimizer.
:::

## Condensing: eliminate the states

Think of a row of dominoes. Once you know how you pushed each one, you know where every domino ends up — you do not need to list the positions separately. The states are like that. The dynamics fix every state once the inputs are chosen. So the states do not have to be unknowns at all.

Step the model $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k$ forward from $\mathbf{x}_0 = \mathbf{x}$ and watch the pattern:

$$
\begin{aligned}
\mathbf{x}_1 &= \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}_0, \\
\mathbf{x}_2 &= \mathbf{A}\mathbf{x}_1 + \mathbf{B}\mathbf{u}_1 = \mathbf{A}^2\mathbf{x} + \mathbf{A}\mathbf{B}\mathbf{u}_0 + \mathbf{B}\mathbf{u}_1 .
\end{aligned}
$$

Each step multiplies everything already there by $\mathbf{A}$ and adds the newest input. In general,

$$
\mathbf{x}_k = \mathbf{A}^k\mathbf{x} + \sum_{j=0}^{k-1}\mathbf{A}^{k-1-j}\mathbf{B}\mathbf{u}_j .
$$

The first term is where the vehicle would coast with no thrust. The sum is what each past push adds, after being carried forward by the dynamics.

Now stack all the predicted states into one long vector $\mathbf{X} = (\mathbf{x}_1, \dots, \mathbf{x}_N)$, with $Nn$ numbers, and all the inputs into $\mathbf{U} = (\mathbf{u}_0, \dots, \mathbf{u}_{N-1})$, with $Nm$ numbers. The relation is linear:

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

$\mathbf{S}_u$ is **block lower triangular** — everything above the diagonal is zero — because an input cannot change the past. Each column is the plant's response to one push over time, and the same block repeats down each diagonal. That makes it a **[[Toeplitz|toeplitz]]** matrix: the discrete impulse response of the plant. In process control it is called the **[[dynamic matrix|dmc-name]]**.

Next, the cost. Build the big weight matrices $\bar{\mathbf{Q}} = \mathrm{blkdiag}(\mathbf{Q}, \dots, \mathbf{Q}, \mathbf{P})$ — $N-1$ copies of $\mathbf{Q}$ down the diagonal, then the terminal $\mathbf{P}$ last — and $\bar{\mathbf{R}} = \mathrm{blkdiag}(\mathbf{R},\dots,\mathbf{R})$. ("blkdiag" means "put these blocks down the diagonal, zeros elsewhere".) The total cost is

$$
J = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{X}^\top\bar{\mathbf{Q}}\mathbf{X} + \mathbf{U}^\top\bar{\mathbf{R}}\mathbf{U}
= \tfrac{1}{2}\mathbf{U}^\top\mathbf{H}\mathbf{U} + (\mathbf{F}\mathbf{x})^\top\mathbf{U} + \text{const},
$$

with

$$
\mathbf{H} = 2\left(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}}\right), \qquad
\mathbf{F} = 2\,\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_x .
$$

::: note Where H and F come from
Put $\mathbf{X} = \mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U}$ into $\mathbf{X}^\top\bar{\mathbf{Q}}\mathbf{X}$ and multiply out, the way you expand $(a + b)^2 = a^2 + 2ab + b^2$:

$$
\mathbf{X}^\top\bar{\mathbf{Q}}\mathbf{X} = \mathbf{x}^\top\mathbf{S}_x^\top\bar{\mathbf{Q}}\mathbf{S}_x\mathbf{x} + 2\,\mathbf{x}^\top\mathbf{S}_x^\top\bar{\mathbf{Q}}\mathbf{S}_u\mathbf{U} + \mathbf{U}^\top\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u\mathbf{U}.
$$

The two cross terms are equal (each is a single number, and a number equals its own transpose, using $\bar{\mathbf{Q}} = \bar{\mathbf{Q}}^\top$), which is where the $2$ comes from. Collect the pieces. Quadratic in $\mathbf{U}$: $\mathbf{U}^\top(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})\mathbf{U}$, which is $\tfrac{1}{2}\mathbf{U}^\top\mathbf{H}\mathbf{U}$ with the $\mathbf{H}$ above. Linear in $\mathbf{U}$: $2\,\mathbf{x}^\top\mathbf{S}_x^\top\bar{\mathbf{Q}}\mathbf{S}_u\mathbf{U} = (\mathbf{F}\mathbf{x})^\top\mathbf{U}$. Everything left has no $\mathbf{U}$ in it.
:::

That leftover constant is $\mathbf{x}^\top(\mathbf{Q} + \mathbf{S}_x^\top\bar{\mathbf{Q}}\mathbf{S}_x)\mathbf{x}$. It does not move the minimizer, so most implementations drop it. Keep it if you want the value $V_N^0$ itself — for example, to watch it decrease as a Lyapunov function.

**Limits** map the same way. Input bounds are already on the unknowns: $|u_k| \le u_{\max}$ becomes $\pm\mathbf{U} \le u_{\max}\mathbf{1}$ (where $\mathbf{1}$ is a vector of ones). A state limit $\mathbf{G}_x\mathbf{x}_k \le \mathbf{h}_x$ becomes, after substituting for $\mathbf{x}_k$,

$$
\mathbf{G}_x\mathbf{S}_u\mathbf{U} \le \mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x} .
$$

So the state-limit rows have a **right-hand side that depends on the current state**, rebuilt every cycle, while the matrix on the left never changes. That pattern is worth remembering for code generation. For a problem that does not change with time, $\mathbf{H}$, $\mathbf{F}$, $\mathbf{S}_u$ and the limit matrix are all constants you can compute before flight. Only two vectors change per cycle.

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

Always write this check before trusting a condensed build. Pick a random input sequence, roll the dynamics forward step by step, and compare that cost with the condensed formula. It catches a transposed block, an off-by-one in the terminal weight, or a misplaced factor of two — all three are common.

## The sparse form: keep the states

The other choice is to keep the states as unknowns and make the dynamics into equality rules:

$$
\mathbf{z} = (\mathbf{x}_1, \dots, \mathbf{x}_N, \mathbf{u}_0, \dots, \mathbf{u}_{N-1}) \in \mathbb{R}^{N(n+m)} ,
$$

with $\mathbf{A}_{\text{eq}}$ built from the $N$ blocks

$$
\mathbf{x}_{k+1} - \mathbf{A}\mathbf{x}_k - \mathbf{B}\mathbf{u}_k = \mathbf{0}, \qquad k = 0,\dots,N-1.
$$

In the $k = 0$ block, $\mathbf{x}_0$ is known data, so $\mathbf{A}\mathbf{x}$ moves to the right-hand side.

The Hessian is now **block diagonal**: $\mathbf{Q}$ for each state block, $\mathbf{P}$ for the last one, $\mathbf{R}$ for each input block, and nothing linking different times. For a regulation problem there is no linear term at all, $\mathbf{f} = \mathbf{0}$. Every limit sits on a single block of unknowns, so state limits do not get tangled up with input limits the way they do after condensing.

The problem is much bigger and almost entirely empty — **sparse**, meaning mostly zeros. Its strength is its *structure*. Order the unknowns by time step — $\mathbf{u}_0, \mathbf{x}_1, \mathbf{u}_1, \mathbf{x}_2, \dots$ — and the **[[KKT matrix|kkt]]** of the optimization module becomes **block tridiagonal**: nonzero blocks only on the diagonal and right next to it, each of size about $n+m$. A solver that exploits that band does work in proportion to $N$, not $N^3$. Done in exactly the right order, that banded solve is the backward Riccati recursion of the LQR module, with the active limits folded in. That is why a sparse MPC solve and an LQR solve cost about the same per horizon step.

::: key Condensed vs sparse formulation
Condensed: eliminate the states, leaving a small dense QP in the inputs only — good for short horizons. Sparse: keep states as variables with dynamics as equality constraints — larger but banded, so cost grows linearly rather than cubically in $N$.
:::

::: example The same problem, both ways
Take the proximity-ops axis again. Add a speed limit $|x_2| \le 0.5\,\mathrm{m/s}$. Use $N = 20$, the Riccati terminal cost $\mathbf{P}$, and start from $\mathbf{x} = (2, 0)$.

| | condensed | sparse |
| --- | --- | --- |
| decision variables | $Nm = 20$ | $N(n+m) = 60$ |
| equality constraints | none | $Nn = 40$ |
| inequality rows | $80$ | $80$ |
| Hessian nonzeros | $400$ of $400$ (fully dense) | $62$ of $3600$ |
| equality-matrix nonzeros | — | $137$ of $2400$ |

Where do the counts come from? Inequality rows: $2 \times 20$ for the thrust limit (upper and lower) plus $2 \times 20$ for the speed limit, so $80$. Sparse Hessian: $\mathbf{Q} = \mathbf{I}$ puts $2$ nonzeros in each of $19$ state blocks ($38$), the full $2 \times 2$ matrix $\mathbf{P}$ adds $4$, and $\mathbf{R}$ adds $20$: total $62$. Equality matrix: $40$ ones from the $\mathbf{x}_{k+1}$ terms, $3$ nonzeros in each of $19$ copies of $-\mathbf{A}$ ($57$), and $2$ in each of $20$ copies of $-\mathbf{B}$ ($40$): total $137$.

Solve both with the same **[[interior-point|interior-point]]** solver (the open-source CVXOPT package). Each converges in six iterations, and each returns $u_0^\star = -1$, the thrust limit. The two optimal input sequences agree to about $5 \times 10^{-16}$. That is the rounding noise of double-precision arithmetic, not a tolerance anyone chose.

Run this comparison whenever you change a formulation. The two forms have completely different ways of being buggy. If they disagree by more than about $10^{-9}$, one of them is wrong.

The density numbers tell the whole story in miniature. The condensed Hessian has no zeros, because every input affects every later state. The sparse one is $1.7\,\%$ filled ($62/3600$), because the cost links nothing across time. Condensing trades emptiness for size.
:::

## Which form, and when

Count the arithmetic. With an interior-point solver, the main cost of each iteration is one **factorization** — splitting a matrix into simpler pieces so a linear system can be solved — of a matrix with the same shape every time. Work is measured in **[[flops|flops]]**, single arithmetic operations.

- **Condensed:** a dense $Nm \times Nm$ system, factored in about $\tfrac{1}{3}(Nm)^3$ flops. The cost grows with the *cube* of the horizon. It depends on the number of inputs, not the number of states.
- **Sparse:** a block-tridiagonal system with blocks of size $n+m$, factored in about $N(n+m)^3$ flops. The cost grows *in step with* the horizon.

::: example Where the crossover falls
Apply the two counts to the double integrator ($n = 2$, $m = 1$) and to a three-axis rendezvous model ($n = 6$, $m = 3$). For example, at $N = 20$ with $n = 2$, $m = 1$: condensed $\tfrac{1}{3}(20)^3 = 2{,}667$, sparse $20 \times 3^3 = 540$.

| $N$ | condensed flops, $n{=}2$, $m{=}1$ | sparse flops | condensed flops, $n{=}6$, $m{=}3$ | sparse flops |
| --- | --- | --- | --- | --- |
| $5$ | $42$ | $135$ | $1{,}125$ | $3{,}645$ |
| $10$ | $333$ | $270$ | $9{,}000$ | $7{,}290$ |
| $20$ | $2{,}667$ | $540$ | $72{,}000$ | $14{,}580$ |
| $40$ | $21{,}333$ | $1{,}080$ | $576{,}000$ | $29{,}160$ |
| $80$ | $170{,}667$ | $2{,}160$ | $4{,}608{,}000$ | $58{,}320$ |

Where do the two meet? Set them equal and solve for $N$:

$$
\tfrac{1}{3}N^3m^3 = N(n+m)^3
\;\Rightarrow\;
N^2 = \frac{3(n+m)^3}{m^3}
\;\Rightarrow\;
N^\star = \sqrt{3}\left(\frac{n+m}{m}\right)^{3/2}.
$$

Both systems above have $(n+m)/m = 3$, so $N^\star = \sqrt{3} \cdot 3^{3/2} = 9$ for both — and the table agrees: condensed is cheaper at $N = 5$, sparse is cheaper from $N = 10$. A twelve-state flexible vehicle with three inputs gives $N^\star = \sqrt{3}\cdot 5^{3/2} = 19$. At $N = 80$ the condensed form does $170{,}667 / 2{,}160 = 79$ times the arithmetic of the sparse one on the double integrator.

Treat these as scaling laws with the constants stripped out, not as measurements. A dense factorization of a $20 \times 20$ matrix runs near the processor's top speed on data that fits in its fast memory. A banded solver pays bookkeeping overhead on every block. So on real hardware the crossover sits higher than the flop count says — commonly somewhere from $N = 10$ to $30$. What the counts tell you reliably is the *slope*: past the crossover, the condensed form falls further behind as $N^2$, and no amount of careful coding wins that back.
:::

Two more things decide real designs. First, condensing does not care how many states there are. A plant with fifty states and two inputs condenses to a tiny QP. That is why dense **[[active-set|active-set]]** solvers remain popular for attitude control. Second, condensing leaves no equality constraints at all, which some embedded solvers prefer.

## The conditioning trap

Condensing has a numerical cost that the flop count hides. $\mathbf{S}_u$ contains $\mathbf{A}^{N-1}\mathbf{B}$. Suppose the plant is unstable on its own, with an eigenvalue $\lambda$ where $|\lambda| > 1$. Then the entries of $\mathbf{S}_u$ grow like $|\lambda|^N$. The condensed Hessian is built from $\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u$, so its **[[condition number|condition-number]]** — roughly, how much it magnifies small rounding errors — grows like $|\lambda|^{2N}$.

::: warning The condensed Hessian of an unstable plant loses digits exponentially
Take a launch vehicle's pitch axis that is aerodynamically unstable: $\ddot{\theta} = \omega^2\theta + u$ with $\omega^2 = 4\,\mathrm{s^{-2}}$, so a small tilt doubles in $\ln 2 / 2 = 0.347\,\mathrm{s}$. Sample at $T_s = 0.05\,\mathrm{s}$. The unstable discrete eigenvalue is $\lambda = e^{\omega T_s} = e^{0.1} = 1.10517$. Use $\mathbf{Q} = \mathbf{I}$, $R = 0.1$ and its own Riccati terminal cost. Here are the condition numbers of the condensed Hessian, next to the double integrator (whose eigenvalues sit exactly at $1$):

| $N$ | double integrator | unstable pitch axis |
| --- | --- | --- |
| $10$ | $1.65\times10^{1}$ | $1.04\times10^{1}$ |
| $20$ | $8.13\times10^{1}$ | $8.22\times10^{1}$ |
| $40$ | $5.89\times10^{2}$ | $4.51\times10^{3}$ |
| $80$ | $5.79\times10^{3}$ | $1.34\times10^{7}$ |
| $160$ | $7.02\times10^{4}$ | $1.2\times10^{14}$ |

Check the growth law. From $N = 40$ to $N = 80$ the unstable column grows by $2979$. The prediction is $\lambda^{2\times 40} = e^{8} = 2981$. The law is $|\lambda|^{2N}$, almost exactly.

At $N = 160$ — eight seconds of horizon at this sample rate — the condition number is about $10^{14}$. Double precision carries about $16$ significant digits, so roughly two are left. The solver will still return an answer, and it will be wrong in ways that look like noise on the command.

The sparse form does not have this problem. Its Hessian is $\mathrm{blkdiag}(\mathbf{Q},\dots,\mathbf{P},\mathbf{R},\dots)$. Its conditioning comes from the weights alone and does not depend on $N$ or on $\mathbf{A}$. The dynamics live in the equality rows, where no power of $\mathbf{A}$ ever appears. For a vehicle that is unstable on its own — a launcher going through the transonic region, a lifting body, a rocket balancing on its engine — the sparse form is not an optimization. It is a requirement.

The other way out is to **[[pre-stabilize|pre-stabilize]]**. Write $\mathbf{u}_k = -\mathbf{K}\mathbf{x}_k + \mathbf{v}_k$ for some stabilizing gain $\mathbf{K}$, condense the stable dynamics $\mathbf{A} - \mathbf{B}\mathbf{K}$, and let the optimizer choose the correction $\mathbf{v}_k$. You keep the small dense problem, and the unstable powers are gone.
:::

## Check yourself

::: check
For a plant with $n = 30$ states, $m = 2$ inputs and a horizon $N = 15$, how many decision variables does each form have, and which would you choose?
:::

::: answer
Condensed: $Nm = 15 \times 2 = 30$ variables, no equality constraints, a dense $30 \times 30$ Hessian. Sparse: $N(n+m) = 15 \times 32 = 480$ variables with $Nn = 450$ equality constraints.

The crossover estimate is $N^\star = \sqrt{3}\,((n+m)/m)^{3/2} = \sqrt{3}\cdot 16^{3/2} = \sqrt{3} \cdot 64 = 111$, far above $15$. So condensed wins by a wide margin — its cost does not care that there are thirty states. This is the normal situation in attitude control, where a model with flexible modes has many states and only three or four torque inputs. The answer flips if the plant is unstable on its own. Then use the sparse form, or pre-stabilize before condensing.
:::

::: check
Why does the state-limit right-hand side $\mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$ have to be rebuilt every cycle in the condensed form, while the matching sparse limit does not?
:::

::: answer
After condensing, a predicted state is $\mathbf{x}_k = \mathbf{A}^k\mathbf{x} + (\text{terms in }\mathbf{U})$. So a limit on $\mathbf{x}_k$ becomes a limit on $\mathbf{U}$ whose room depends on where the vehicle is right now. The coasting part $\mathbf{A}^k\mathbf{x}$ moves to the right-hand side and changes every cycle.

In the sparse form, $\mathbf{x}_k$ is itself an unknown and the limit is written directly on it, so that row never changes. The current state enters only through the first equality block's right-hand side, $\mathbf{A}\mathbf{x}$. In both forms the *matrices* are constant and only vectors change, which is what code generation needs. The condensed form only has more vector to rebuild — one matrix-vector product with $\mathbf{G}_x\mathbf{S}_x$ per cycle.
:::

::: check
The condensed and sparse solutions of the same problem differ by $3\times10^{-4}$ in the first input. Is that acceptable?
:::

::: answer
No — treat it as a bug until proved otherwise. The two forms are the same problem written two ways, so at a solver tolerance around $10^{-8}$ they should agree to near machine precision, as the worked example did at about $5\times10^{-16}$. A gap of $3\times10^{-4}$ has three likely causes:

- a real formulation error — most often the terminal weight on the wrong stage, or a state limit imposed at $k = 0$ in one form and $k = 1$ in the other;
- a solver stopping far from the optimum, which shows up as a gap that shrinks when you tighten the tolerance;
- a badly conditioned condensed Hessian, which shows up as a gap that grows with $N$ and with how unstable the plant is.

Check the third by printing the condition number, the second by tightening the tolerance, and the first with the random-input cost comparison from the code above.
:::

::: check
The condensed Hessian $\mathbf{H} = 2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$ is constant for a time-invariant problem. Which parts of the QP actually change from cycle to cycle, and what does that buy an embedded implementation?
:::

::: answer
Only two vectors: the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$, and the right-hand side of the state-limit rows, $\mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$. The input bounds, the Hessian and every limit matrix are constants fixed when the software is built.

An embedded implementation uses this three ways. The matrices are stored in read-only memory with no assembly at run time. A **Cholesky factor** of $\mathbf{H}$ (a triangular "square root" of it) can be computed before flight for use inside an active-set method. And the sparsity pattern, elimination order and memory size are all known before the vehicle flies, which the certification argument in the real-time lesson needs. The same holds for the sparse form, where $\mathbf{H}$ and $\mathbf{A}_{\text{eq}}$ are constant and only the first block of $\mathbf{b}_{\text{eq}}$ changes.
:::

::: check
Explain why the sparse KKT system is block tridiagonal when the unknowns are ordered by time step, and what recursion solves it.
:::

::: answer
Two structural facts. The cost links nothing across time — the stage cost at $k$ involves only $\mathbf{x}_k$ and $\mathbf{u}_k$ — so the Hessian is block diagonal. And each dynamics rule links only neighboring time steps, $\mathbf{x}_{k+1}$ to $(\mathbf{x}_k, \mathbf{u}_k)$, so the equality matrix has nonzeros only on its diagonal and one block beside it. Build the KKT matrix from these two pieces, with the unknowns and multipliers interleaved by time, and you get a block tridiagonal matrix with blocks of size about $n+m$.

Factor it by eliminating from the last stage backward. Each step does the same thing: solve a small system and fold the result into the stage before. That is the backward Riccati recursion of the LQR module; with no active inequality limits it *is* that recursion. This is why the sparse form scales in step with $N$, and why **[[HPIPM-style solvers|hpipm]]** advertise a Riccati-based interior-point method.
:::

## Summary

| Object | Statement |
| --- | --- |
| Standard QP | $\min \tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}$ s.t. $\mathbf{A}_{\text{in}}\mathbf{z} \le \mathbf{b}_{\text{in}}$, $\mathbf{A}_{\text{eq}}\mathbf{z} = \mathbf{b}_{\text{eq}}$ |
| Prediction | $\mathbf{X} = \mathbf{S}_x\mathbf{x} + \mathbf{S}_u\mathbf{U}$, $\mathbf{S}_u$ block lower triangular (the dynamic matrix) |
| Condensed cost | $\mathbf{H} = 2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$, $\mathbf{F} = 2\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_x$, $\mathbf{f} = \mathbf{F}\mathbf{x}$ |
| Condensed limits | $\mathbf{G}_x\mathbf{S}_u\mathbf{U} \le \mathbf{h}_x - \mathbf{G}_x\mathbf{S}_x\mathbf{x}$: constant matrix, state-dependent right-hand side |
| Sparse unknowns | $\mathbf{z} = (\mathbf{x}_1..\mathbf{x}_N, \mathbf{u}_0..\mathbf{u}_{N-1})$, dynamics as $Nn$ equalities, block-diagonal $\mathbf{H}$ |
| Sizes at $N = 20$ | Condensed $20$ unknowns, dense $\mathbf{H}$ ($400/400$); sparse $60$ unknowns, $40$ equalities, $\mathbf{H}$ $62/3600$ |
| Agreement | Same solver, six iterations each, optimal sequences equal to about $5\times10^{-16}$ |
| Flop scaling | Condensed $\tfrac{1}{3}(Nm)^3$ per factorization; sparse $\approx N(n+m)^3$ |
| Crossover | $N^\star = \sqrt{3}\,((n+m)/m)^{3/2}$: $9$ for $n{=}2,m{=}1$ and $n{=}6,m{=}3$; $19$ for $n{=}12,m{=}3$ |
| Conditioning | $\mathrm{cond}(\mathbf{H}) \sim \lvert\lambda\rvert^{2N}$ for an unstable $\lambda$: about $1.2\times10^{14}$ at $N = 160$ for $\lambda = 1.105$ |
| Fix | Use the sparse form, or pre-stabilize with $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ and condense $\mathbf{A} - \mathbf{B}\mathbf{K}$ |

The next lesson fills in the limit sets properly: what belongs in $\mathbb{U}$ and $\mathbb{X}$, why hard state limits are dangerous in flight, and how slack variables and an exact penalty make the QP always solvable.

::: context hessian The matrix of second derivatives
The **Hessian** of a function is the table of all its second derivatives: entry $(i, j)$ is $\partial^2 J / \partial z_i \partial z_j$. For the quadratic $\tfrac{1}{2}\mathbf{z}^\top\mathbf{H}\mathbf{z} + \mathbf{f}^\top\mathbf{z}$ it is exactly $\mathbf{H}$ — the $\tfrac{1}{2}$ is there so the matrix comes out clean. It describes how the bowl curves in every direction. It is named after the German mathematician Otto Hesse, who worked with these determinants in the nineteenth century.
:::

::: context toeplitz The same block down every diagonal
A **Toeplitz** matrix (after Otto Toeplitz) is constant along each diagonal. $\mathbf{S}_u$ has that shape in blocks: the main diagonal is all $\mathbf{B}$ (a push shows up one step later), the next is all $\mathbf{A}\mathbf{B}$ (two steps later), and so on. The reason is that the plant responds the same way to a push whenever it happens. Above the diagonal it is all zeros: a push cannot move the past.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="14" width="36" height="36" fill="#8fb8f0" fill-opacity="0.25" stroke="#1f2a44"/>
  <text x="128.0" y="36.0" font-size="12" fill="#1f2a44" text-anchor="middle">B</text>
  <rect x="146" y="14" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="164.0" y="36.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <rect x="182" y="14" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="200.0" y="36.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <rect x="218" y="14" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="236.0" y="36.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <text x="102" y="36.0" font-size="11" fill="#1f2a44" text-anchor="end">x₁</text>
  <text x="128.0" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">u₀</text>
  <rect x="110" y="50" width="36" height="36" fill="#8fb8f0" fill-opacity="0.45" stroke="#1f2a44"/>
  <text x="128.0" y="72.0" font-size="12" fill="#1f2a44" text-anchor="middle">AB</text>
  <rect x="146" y="50" width="36" height="36" fill="#8fb8f0" fill-opacity="0.25" stroke="#1f2a44"/>
  <text x="164.0" y="72.0" font-size="12" fill="#1f2a44" text-anchor="middle">B</text>
  <rect x="182" y="50" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="200.0" y="72.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <rect x="218" y="50" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="236.0" y="72.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <text x="102" y="72.0" font-size="11" fill="#1f2a44" text-anchor="end">x₂</text>
  <text x="164.0" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">u₁</text>
  <rect x="110" y="86" width="36" height="36" fill="#8fb8f0" fill-opacity="0.65" stroke="#1f2a44"/>
  <text x="128.0" y="108.0" font-size="12" fill="#1f2a44" text-anchor="middle">A²B</text>
  <rect x="146" y="86" width="36" height="36" fill="#8fb8f0" fill-opacity="0.45" stroke="#1f2a44"/>
  <text x="164.0" y="108.0" font-size="12" fill="#1f2a44" text-anchor="middle">AB</text>
  <rect x="182" y="86" width="36" height="36" fill="#8fb8f0" fill-opacity="0.25" stroke="#1f2a44"/>
  <text x="200.0" y="108.0" font-size="12" fill="#1f2a44" text-anchor="middle">B</text>
  <rect x="218" y="86" width="36" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="236.0" y="108.0" font-size="12" fill="#6c7a93" text-anchor="middle">0</text>
  <text x="102" y="108.0" font-size="11" fill="#1f2a44" text-anchor="end">x₃</text>
  <text x="200.0" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">u₂</text>
  <rect x="110" y="122" width="36" height="36" fill="#8fb8f0" fill-opacity="0.8500000000000001" stroke="#1f2a44"/>
  <text x="128.0" y="144.0" font-size="12" fill="#1f2a44" text-anchor="middle">A³B</text>
  <rect x="146" y="122" width="36" height="36" fill="#8fb8f0" fill-opacity="0.65" stroke="#1f2a44"/>
  <text x="164.0" y="144.0" font-size="12" fill="#1f2a44" text-anchor="middle">A²B</text>
  <rect x="182" y="122" width="36" height="36" fill="#8fb8f0" fill-opacity="0.45" stroke="#1f2a44"/>
  <text x="200.0" y="144.0" font-size="12" fill="#1f2a44" text-anchor="middle">AB</text>
  <rect x="218" y="122" width="36" height="36" fill="#8fb8f0" fill-opacity="0.25" stroke="#1f2a44"/>
  <text x="236.0" y="144.0" font-size="12" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="102" y="144.0" font-size="11" fill="#1f2a44" text-anchor="end">x₄</text>
  <text x="236.0" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">u₃</text>
  <text x="320" y="60" font-size="11" fill="#6c7a93" text-anchor="middle">same block</text>
  <text x="320" y="74" font-size="11" fill="#6c7a93" text-anchor="middle">down each</text>
  <text x="320" y="88" font-size="11" fill="#6c7a93" text-anchor="middle">diagonal</text>
</svg>
```
:::

::: context dmc-name Where Dynamic Matrix Control got its name
Dynamic Matrix Control, the Shell refinery method from the first lesson, built its predictions from measured step responses of the plant, stacked into exactly this kind of lower-triangular matrix. The engineers called it the **dynamic matrix**, and the method took its name from it. Many industrial MPC packages still predict this way, from step-response tests, instead of from a state-space model.
:::

::: context kkt The system every QP solver ends up solving
The **KKT conditions** — after William Karush, Harold Kuhn and Albert Tucker — are the equations a constrained optimum must satisfy: the slope of the cost is balanced by the push of the active limits, through multipliers $\boldsymbol{\lambda}$. For equality limits they form one linear system. Here is its pattern for $N = 3$ with the unknowns ordered by time step: each blue square is a nonzero, and everything clusters near the diagonal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="12" width="135" height="135" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="40" y="12" width="8" height="8" fill="#1d6fd1"/>
  <rect x="49" y="12" width="8" height="8" fill="#1d6fd1"/>
  <rect x="58" y="12" width="8" height="8" fill="#1d6fd1"/>
  <rect x="40" y="21" width="8" height="8" fill="#1d6fd1"/>
  <rect x="67" y="21" width="8" height="8" fill="#1d6fd1"/>
  <rect x="40" y="30" width="8" height="8" fill="#1d6fd1"/>
  <rect x="76" y="30" width="8" height="8" fill="#1d6fd1"/>
  <rect x="49" y="39" width="8" height="8" fill="#1d6fd1"/>
  <rect x="67" y="39" width="8" height="8" fill="#1d6fd1"/>
  <rect x="94" y="39" width="8" height="8" fill="#1d6fd1"/>
  <rect x="58" y="48" width="8" height="8" fill="#1d6fd1"/>
  <rect x="76" y="48" width="8" height="8" fill="#1d6fd1"/>
  <rect x="94" y="48" width="8" height="8" fill="#1d6fd1"/>
  <rect x="103" y="48" width="8" height="8" fill="#1d6fd1"/>
  <rect x="85" y="57" width="8" height="8" fill="#1d6fd1"/>
  <rect x="94" y="57" width="8" height="8" fill="#1d6fd1"/>
  <rect x="103" y="57" width="8" height="8" fill="#1d6fd1"/>
  <rect x="67" y="66" width="8" height="8" fill="#1d6fd1"/>
  <rect x="76" y="66" width="8" height="8" fill="#1d6fd1"/>
  <rect x="85" y="66" width="8" height="8" fill="#1d6fd1"/>
  <rect x="112" y="66" width="8" height="8" fill="#1d6fd1"/>
  <rect x="76" y="75" width="8" height="8" fill="#1d6fd1"/>
  <rect x="85" y="75" width="8" height="8" fill="#1d6fd1"/>
  <rect x="121" y="75" width="8" height="8" fill="#1d6fd1"/>
  <rect x="94" y="84" width="8" height="8" fill="#1d6fd1"/>
  <rect x="112" y="84" width="8" height="8" fill="#1d6fd1"/>
  <rect x="139" y="84" width="8" height="8" fill="#1d6fd1"/>
  <rect x="103" y="93" width="8" height="8" fill="#1d6fd1"/>
  <rect x="121" y="93" width="8" height="8" fill="#1d6fd1"/>
  <rect x="139" y="93" width="8" height="8" fill="#1d6fd1"/>
  <rect x="148" y="93" width="8" height="8" fill="#1d6fd1"/>
  <rect x="130" y="102" width="8" height="8" fill="#1d6fd1"/>
  <rect x="139" y="102" width="8" height="8" fill="#1d6fd1"/>
  <rect x="148" y="102" width="8" height="8" fill="#1d6fd1"/>
  <rect x="112" y="111" width="8" height="8" fill="#1d6fd1"/>
  <rect x="121" y="111" width="8" height="8" fill="#1d6fd1"/>
  <rect x="130" y="111" width="8" height="8" fill="#1d6fd1"/>
  <rect x="157" y="111" width="8" height="8" fill="#1d6fd1"/>
  <rect x="121" y="120" width="8" height="8" fill="#1d6fd1"/>
  <rect x="130" y="120" width="8" height="8" fill="#1d6fd1"/>
  <rect x="166" y="120" width="8" height="8" fill="#1d6fd1"/>
  <rect x="139" y="129" width="8" height="8" fill="#1d6fd1"/>
  <rect x="157" y="129" width="8" height="8" fill="#1d6fd1"/>
  <rect x="166" y="129" width="8" height="8" fill="#1d6fd1"/>
  <rect x="148" y="138" width="8" height="8" fill="#1d6fd1"/>
  <rect x="157" y="138" width="8" height="8" fill="#1d6fd1"/>
  <rect x="166" y="138" width="8" height="8" fill="#1d6fd1"/>
  <line x1="85" y1="12" x2="85" y2="147" stroke="#6c7a93" stroke-dasharray="2 2"/>
  <line x1="40" y1="57" x2="175" y2="57" stroke="#6c7a93" stroke-dasharray="2 2"/>
  <line x1="130" y1="12" x2="130" y2="147" stroke="#6c7a93" stroke-dasharray="2 2"/>
  <line x1="40" y1="102" x2="175" y2="102" stroke="#6c7a93" stroke-dasharray="2 2"/>
  <text x="189" y="40" font-size="11" fill="#1f2a44">sparse KKT matrix,</text>
  <text x="189" y="56" font-size="11" fill="#1f2a44">N = 3, ordered by</text>
  <text x="189" y="72" font-size="11" fill="#1f2a44">time step: nonzeros</text>
  <text x="189" y="88" font-size="11" fill="#1f2a44">(blue) stay near</text>
  <text x="189" y="104" font-size="11" fill="#1f2a44">the diagonal</text>
  <text x="189" y="130" font-size="11" fill="#6c7a93">47 of 225 entries</text>
</svg>
```
:::

::: context interior-point Walking through the middle
An **interior-point** method does not crawl along the walls of the allowed region. It replaces each inequality with a "fence" term that grows huge near the wall, solves that softened problem, then weakens the fences step by step until the answer settles on the true optimum. Each iteration is one big linear solve, which is why the flop count per factorization is what matters. It typically needs a few tens of iterations, almost regardless of problem size.
:::

::: context flops Counting the arithmetic
A **flop** is one floating-point operation: an add, a subtract, a multiply or a divide on a decimal number. Counting flops is a quick way to compare algorithms before writing them. The $\tfrac{1}{3}p^3$ for factoring a dense $p \times p$ matrix is the classic count for a Cholesky factorization. On a log-log plot the two formulas become straight lines of slope $3$ and $1$, and they cross at $N^\star$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="180" x2="50.0" y2="185" stroke="#1f2a44"/>
  <text x="50.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <line x1="122.5" y1="180" x2="122.5" y2="185" stroke="#1f2a44"/>
  <text x="122.5" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <line x1="195.0" y1="180" x2="195.0" y2="185" stroke="#1f2a44"/>
  <text x="195.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">20</text>
  <line x1="267.5" y1="180" x2="267.5" y2="185" stroke="#1f2a44"/>
  <text x="267.5" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">40</text>
  <line x1="340.0" y1="180" x2="340.0" y2="185" stroke="#1f2a44"/>
  <text x="340.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">80</text>
  <line x1="45" y1="180.0" x2="50" y2="180.0" stroke="#1f2a44"/>
  <text x="42" y="184.0" font-size="11" fill="#1f2a44" text-anchor="end">10¹</text>
  <line x1="45" y1="148.0" x2="50" y2="148.0" stroke="#1f2a44"/>
  <text x="42" y="152.0" font-size="11" fill="#1f2a44" text-anchor="end">10²</text>
  <line x1="45" y1="116.0" x2="50" y2="116.0" stroke="#1f2a44"/>
  <text x="42" y="120.0" font-size="11" fill="#1f2a44" text-anchor="end">10³</text>
  <line x1="45" y1="84.0" x2="50" y2="84.0" stroke="#1f2a44"/>
  <text x="42" y="88.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁴</text>
  <line x1="45" y1="52.0" x2="50" y2="52.0" stroke="#1f2a44"/>
  <text x="42" y="56.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁵</text>
  <line x1="45" y1="20.0" x2="50" y2="20.0" stroke="#1f2a44"/>
  <text x="42" y="24.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁶</text>
  <polyline points="50.0,160.2 69.1,152.6 85.2,146.1 99.2,140.6 111.5,135.7 122.5,131.3 132.5,127.3 141.6,123.7 149.9,120.3 157.7,117.2 164.9,114.4 171.7,111.7 178.0,109.1 184.0,106.8 189.6,104.5 195.0,102.4 200.1,100.3 205.0,98.4 209.6,96.5 214.1,94.8 218.3,93.1 222.4,91.4 226.4,89.9 230.2,88.3 233.9,86.9 237.4,85.5 240.8,84.1 244.2,82.8 247.4,81.5 250.5,80.2 253.5,79.0 256.5,77.9 259.3,76.7 262.1,75.6 264.9,74.5 267.5,73.5 270.1,72.4 272.6,71.4 275.1,70.5 277.5,69.5 279.8,68.6 282.1,67.6 284.4,66.7 286.6,65.9 288.7,65.0 290.8,64.2 292.9,63.3 294.9,62.5 296.9,61.7 298.9,61.0 300.8,60.2 302.7,59.4 304.5,58.7 306.4,58.0 308.2,57.3 309.9,56.6 311.6,55.9 313.3,55.2 315.0,54.5 316.7,53.9 318.3,53.2 319.9,52.6 321.5,52.0 323.0,51.3 324.5,50.7 326.0,50.1 327.5,49.5 329.0,49.0 330.4,48.4 331.8,47.8 333.2,47.3 334.6,46.7 336.0,46.2 337.4,45.6 338.7,45.1 340.0,44.6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="50.0,143.8 69.1,141.3 85.2,139.2 99.2,137.3 111.5,135.7 122.5,134.2 132.5,132.9 141.6,131.7 149.9,130.6 157.7,129.5 164.9,128.6 171.7,127.7 178.0,126.8 184.0,126.0 189.6,125.3 195.0,124.6 200.1,123.9 205.0,123.2 209.6,122.6 214.1,122.0 218.3,121.5 222.4,120.9 226.4,120.4 230.2,119.9 233.9,119.4 237.4,118.9 240.8,118.5 244.2,118.0 247.4,117.6 250.5,117.2 253.5,116.8 256.5,116.4 259.3,116.0 262.1,115.6 264.9,115.3 267.5,114.9 270.1,114.6 272.6,114.3 275.1,113.9 277.5,113.6 279.8,113.3 282.1,113.0 284.4,112.7 286.6,112.4 288.7,112.1 290.8,111.8 292.9,111.6 294.9,111.3 296.9,111.0 298.9,110.8 300.8,110.5 302.7,110.3 304.5,110.0 306.4,109.8 308.2,109.5 309.9,109.3 311.6,109.1 313.3,108.8 315.0,108.6 316.7,108.4 318.3,108.2 319.9,108.0 321.5,107.8 323.0,107.6 324.5,107.4 326.0,107.2 327.5,107.0 329.0,106.8 330.4,106.6 331.8,106.4 333.2,106.2 334.6,106.0 336.0,105.8 337.4,105.6 338.7,105.5 340.0,105.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="111.5" cy="135.7" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="111.5" y="125.7" font-size="11" fill="#1f2a44" text-anchor="middle">N* = 9</text>
  <text x="267.5" y="61.5" font-size="12" fill="#b4232c" text-anchor="end">condensed, N³/3</text>
  <text x="267.5" y="132.9" font-size="12" fill="#1d6fd1" text-anchor="middle">sparse, 27N</text>
  <text x="197" y="212" font-size="11" fill="#1f2a44" text-anchor="middle">horizon N (log scale), n = 2, m = 1</text>
</svg>
```
:::

::: context active-set Guessing which walls you touch
An **active-set** method guesses which limits are pressing at the optimum — the "active set" — and treats only those as equalities. It solves that smaller problem, checks whether the guess was right, and adds or drops one limit at a time until it is. With a good starting guess, such as last cycle's answer, it can finish in one or two steps and returns an exact solution. Its weakness is the worst case, which the real-time lesson deals with.
:::

::: context condition-number How many digits you lose
The **condition number** of a matrix is the ratio of its largest to its smallest stretching factor. A useful rule: solving a linear system with condition number $10^k$ can lose about $k$ decimal digits to rounding. Double precision stores about $16$ digits, so $10^{14}$ leaves about two you can trust. It is a property of the problem as written, not of the solver, so no solver can fix it.
:::

::: context pre-stabilize Taming the plant before planning
Pre-stabilizing splits the command into two parts: a fixed gain $-\mathbf{K}\mathbf{x}$ that keeps the plant from running away, and a correction $\mathbf{v}$ that the optimizer chooses. The predictions now use $\mathbf{A} - \mathbf{B}\mathbf{K}$, whose powers shrink instead of grow. The limits are rewritten in terms of $\mathbf{v}$ — for example $|{-\mathbf{K}\mathbf{x}_k} + \mathbf{v}_k| \le u_{\max}$ — and the optimum is the same plan, described in better-behaved coordinates.
:::

::: context hpipm A solver built around Riccati
HPIPM, the "High-Performance Interior-Point Method" library written by Gianluca Frison with Moritz Diehl's group, solves exactly the sparse, stage-by-stage QPs that MPC produces. Inside each interior-point iteration it uses a Riccati-style backward sweep instead of a general sparse factorization, and it is paired with hand-tuned linear-algebra routines for small matrices. The real-time lesson compares it with OSQP and qpOASES.
:::
