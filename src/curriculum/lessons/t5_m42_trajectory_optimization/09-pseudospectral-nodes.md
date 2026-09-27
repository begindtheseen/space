---
id: l09-pseudospectral-nodes
title: "Pseudospectral methods: node families and the differentiation matrix"
minutes: 23
covers:
  - "Pseudospectral methods: Legendre-Gauss, Legendre-Gauss-Radau and Legendre-Gauss-Lobatto nodes"
---

Think about drawing a smooth hill with a flexible plastic ruler, the kind that bends. You pin it down at a few points and let it curve between them. With a few pins, the ruler follows the hill nicely. Now suppose you try to force it through many pins, all equally spaced. In the middle of the hill it behaves. But near the two ends, where it has the least support, it starts to whip up and down between the pins, and the more pins you add, the wilder it gets. The fix is not fewer pins. It is to put more of them near the ends, where the ruler needs the most holding down.

That is this lesson in one picture. Trapezoidal and Hermite-Simpson collocation, from the previous lesson, improve accuracy the way every fixed-order method does: add more segments. The polynomial on each segment never changes — a straight line, or a cubic — so the only knob is the step size $h$, and the global orders $h^2$ and $h^4$ are a ceiling on how fast that knob helps. A **pseudospectral method** does the opposite. It treats the whole flight as a *single* segment and gains accuracy by raising the *degree* of one polynomial that covers all of it.

Done carelessly, that fails badly, exactly like the whipping ruler. Done with the right node locations, it converges faster than any fixed power of $1/N$, on the same nonlinear vehicle dynamics this module has been working with all along. This lesson builds the three families of node locations that make it possible, and the **differentiation matrix** that turns the dynamics into equations. The next lesson measures how fast it converges. Real tools depend on this: GPOPS-II and the Radau transcription in NASA's Dymos are pseudospectral, and pseudospectral optimal control was used to plan the zero-propellant maneuvers that turned the International Space Station in 2006 and 2007.

## Why more, equally spaced points are not enough

Fitting one polynomial through a set of points is called **interpolation**: the polynomial must pass exactly through every sampled value. With $N+1$ points you can always find exactly one polynomial of degree $N$ that does it.

The obvious choice is equally spaced points. For a high degree it is a well-known disaster. The polynomial swings wildly near the ends of the interval, and the swings grow as $N$ grows. This is the **[[Runge phenomenon|runge]]**, named for Carl Runge, who described it in 1901.

::: example The Runge phenomenon, measured
Interpolate $g(\tau) = 1/(1+25\tau^2)$ on $-1 \le \tau \le 1$. It is a smooth, harmless-looking bump: $1$ in the middle, falling to $1/26 = 0.038$ at the ends. Fit it with a degree-$N$ polynomial two ways — through equally spaced nodes, and through nodes crowded toward the ends (the Legendre-Gauss-Lobatto family, defined below). Then measure the worst error against the true function on a fine grid.

| $N$ | equally spaced, max error | Legendre-Gauss-Lobatto, max error |
| --- | --- | --- |
| $10$ | $1.916$ | $0.1211$ |
| $20$ | $59.82$ | $0.0166$ |

**Step 1: read the equally spaced column.** At $N = 10$ the worst error, $1.916$, is already bigger than the whole height of the function, which only runs from $0$ to $1$. At $N = 20$ it is $59.82$, over $30$ times *worse*. More points, in the wrong places, actively destroy the fit near the edges.

**Step 2: read the clustered column.** The error falls from $0.1211$ to $0.0166$, a factor of over $7$, over the same doubling.

**Sanity check.** Same function, same number of points, same kind of polynomial. The only difference is where the points sit. Crowding them toward the ends is doing all of the work.
:::

So the fix is to put more nodes near the ends of the interval, where equally spaced nodes are too sparse for a high-degree polynomial. With $21$ Legendre-Gauss-Lobatto nodes, the first gap next to $\tau = -1$ is only $0.0174$ wide, while the gaps in the middle are about $0.153$. Equal spacing would make every gap $0.1$. Three standard families of nodes do this crowding by construction, all built from the roots of **[[Legendre polynomials|legendre]]**.

## Legendre polynomials

The Legendre polynomials $P_0, P_1, P_2, \dots$ are a fixed list of polynomials on $-1 \le \tau \le 1$, one of each degree. Read $P_n$ as "P sub n", the one of degree $n$. The first few are

$$
P_0 = 1, \qquad P_1 = \tau, \qquad P_2 = \tfrac12(3\tau^2 - 1), \qquad P_3 = \tfrac12(5\tau^3 - 3\tau).
$$

Each next one comes from the two before it by a fixed recipe:

$$
(n+1)P_{n+1} = (2n+1)\,\tau\,P_n - n\,P_{n-1}.
$$

Check it once: with $n = 1$, $2P_2 = 3\tau \cdot \tau - 1 = 3\tau^2 - 1$, so $P_2 = \tfrac12(3\tau^2-1)$. It matches.

Two facts about them matter here. First, every $P_n$ equals $1$ at $\tau = 1$, and equals $(-1)^n$ at $\tau = -1$: plus one for even $n$, minus one for odd $n$. Second, the $n$ roots of $P_n$ all lie strictly inside $(-1, 1)$, and they crowd toward the ends — exactly the pattern the Runge example asked for.

Why $\tau$ from $-1$ to $1$, when a flight runs from $t_0$ to $t_f$? Because any flight can be stretched onto that standard interval by a straight-line map:

$$
t = t_0 + \frac{t_f - t_0}{2}(\tau + 1).
$$

At $\tau = -1$ this gives $t_0$; at $\tau = 1$ it gives $t_f$. The nodes are computed once on $[-1, 1]$ and reused for any flight.

## Three node families

Each family answers one question differently: which ends of the interval are themselves nodes?

**Legendre-Gauss (LG).** The $N$ nodes are the roots of $P_N$. Neither endpoint is included. These are the classical **[[Gauss quadrature|gauss]]** nodes, which integrate every polynomial of degree up to $2N - 1$ exactly. They crowd toward $\pm 1$ without ever touching them. For $N = 3$ the roots of $P_3 = \tfrac12\tau(5\tau^2 - 3)$ are $0$ and $\pm\sqrt{3/5} = \pm 0.7746$.

**Legendre-Gauss-Lobatto (LGL).** Both endpoints, $-1$ and $+1$, are nodes by construction. The $N-1$ nodes in between are the roots of $P_N'$ ("P N prime", the derivative of $P_N$): the places where $P_N$ is momentarily flat. That makes $N+1$ nodes in all. For $N = 3$, $P_3' = \tfrac12(15\tau^2 - 3)$ is zero at $\tau = \pm 1/\sqrt5 = \pm 0.4472$, so the nodes are $\{-1, -0.4472, 0.4472, 1\}$.

**Legendre-Gauss-Radau (LGR).** Exactly *one* endpoint is a node — by convention $-1$. The $N$ nodes are the roots of $P_{N-1} + P_N$. That sum is guaranteed to vanish at $\tau = -1$ for every $N$:

$$
P_{N-1}(-1) + P_N(-1) = (-1)^{N-1} + (-1)^N = 0,
$$

because two neighboring whole numbers always have opposite parity, so one term is $+1$ and the other is $-1$. The other $N-1$ roots lie inside $(-1, 1)$, and $+1$ is never a root. The names honor three mathematicians: **[[Gauss, Radau and Lobatto|names]]**.

::: example Radau nodes by hand, for N = 3
**Step 1: add the polynomials.** $P_2 + P_3 = \tfrac12(3\tau^2 - 1) + \tfrac12(5\tau^3 - 3\tau) = \tfrac12(5\tau^3 + 3\tau^2 - 3\tau - 1)$.

**Step 2: pull out the root we know.** We know $\tau = -1$ is a root, so $(\tau + 1)$ divides the cubic. Dividing gives $5\tau^3 + 3\tau^2 - 3\tau - 1 = (\tau + 1)(5\tau^2 - 2\tau - 1)$. Check by multiplying back: $5\tau^3 - 2\tau^2 - \tau + 5\tau^2 - 2\tau - 1 = 5\tau^3 + 3\tau^2 - 3\tau - 1$. It matches.

**Step 3: solve the quadratic.** $5\tau^2 - 2\tau - 1 = 0$ gives $\tau = \dfrac{2 \pm \sqrt{4 + 20}}{10} = \dfrac{1 \pm \sqrt6}{5}$, which is $-0.2899$ and $0.6899$.

**Answer.** The LGR nodes for $N = 3$ are $\{-1, -0.2899, 0.6899\}$. For $N = 4$ the same recipe gives $\{-1, -0.5753, 0.1811, 0.8228\}$.

**Sanity check.** Both sets start exactly at $-1$ and never reach $+1$, as promised. They are also lopsided. For $N = 4$, the last node $0.8228$ sits only $0.18$ from the end at $+1$, while the second node $-0.5753$ sits $0.42$ from $-1$. The Radau nodes crowd hardest toward the end they leave out, as if making up for the missing node.
:::

::: key Pseudospectral node families
Legendre-Gauss (no endpoints), Legendre-Gauss-Radau (one endpoint — the usual choice for initial-value-style problems), Legendre-Gauss-Lobatto (both endpoints). Nodes cluster at the ends, which is what kills the Runge phenomenon.
:::

Why is Radau the usual choice? Map its node at $-1$ to $t_0$. Then there is a node exactly at the start, where the state is known data, and the scheme works forward from it much as an ordinary simulator does. In fact LGR collocation is mathematically the same as a family of **[[implicit Runge-Kutta|radau-iia]]** methods that are prized for stiff initial value problems. The end at $t_f$ is not a collocation node. The state there is still an unknown in the polynomial, so terminal conditions — fixed, or free with a transversality condition — are imposed on it directly, with no dynamics equation at $t_f$ competing with them. Flip the map (put the Radau endpoint at $t_f$) when the structure favors anchoring the other end. LGL, which collocates at both ends, is the natural pick when you want a node sitting exactly on both boundaries.

## The differentiation matrix

Collocation, in the previous lesson, *integrated* the dynamics over each step with a quadrature rule and compared the result to the change in state. A pseudospectral scheme turns this around: it *differentiates* the state polynomial and compares the result to the dynamics.

Here is the idea. The state is represented by one polynomial that passes through the node values $\mathbf{x}_0, \dots, \mathbf{x}_N$. A polynomial can be differentiated exactly, and its derivative at any node is a fixed *weighted sum* of all the node values. The weights depend only on where the nodes are, not on the values. Collect them in a table $\mathbf{D}$, the **differentiation matrix**: entry $D_{kj}$ ("D sub k j") says how much node value $j$ contributes to the slope at node $k$. It is built once, from the node locations alone. Where do the weights come from? Write the polynomial as a sum of **[[Lagrange basis polynomials|lagrange-basis]]** $\ell_j(\tau)$, each equal to $1$ at node $j$ and $0$ at every other node. Then $D_{kj} = \ell_j'(\tau_k)$, the slope of basis polynomial $j$ at node $k$.

::: example A three-node differentiation matrix by hand
Take the three LGL nodes $-1$, $0$, $1$. The differentiation matrix is

$$
\mathbf{D} = \begin{pmatrix} -1.5 & 2 & -0.5 \\ -0.5 & 0 & 0.5 \\ 0.5 & -2 & 1.5 \end{pmatrix}.
$$

**Test it on $p(\tau) = \tau^2$.** The node values are $p(-1) = 1$, $p(0) = 0$, $p(1) = 1$. Multiply each row of $\mathbf{D}$ by the column $(1, 0, 1)$:

- Row 1: $-1.5 \times 1 + 2 \times 0 - 0.5 \times 1 = -2$.
- Row 2: $-0.5 \times 1 + 0 + 0.5 \times 1 = 0$.
- Row 3: $0.5 \times 1 - 2 \times 0 + 1.5 \times 1 = 2$.

The true derivative is $p'(\tau) = 2\tau$, which is $-2$, $0$ and $2$ at the three nodes. Every one matches exactly.

**Sanity check.** Row 2 is $(-0.5, 0, 0.5)$: the slope at the middle node is (right value minus left value) divided by $2$, the familiar central difference. And each row adds up to $0$, as it must: a constant function has zero slope everywhere.
:::

With $\mathbf{D}$ in hand, the dynamics become algebra. At each collocation node $k$, require the polynomial's slope to equal what the dynamics say:

$$
\sum_{j} D_{kj}\,\mathbf{x}_j = \frac{t_f - t_0}{2}\,\mathbf{f}(\mathbf{x}_k,\mathbf{u}_k,t_k).
$$

The factor $(t_f - t_0)/2$ is the stretch from the time map: the matrix measures slopes per unit of $\tau$, and the dynamics give them per second, so one side has to be converted. This is differentiate-the-polynomial, matched against the dynamics — the reverse of collocation's integrate-the-dynamics, matched against the change in state.

Which nodes get an equation depends on the family. In the common Radau setup, the polynomial passes through the $N$ Radau nodes *plus* the uncollocated end $\tau = +1$, so there are $N+1$ state values but only $N$ collocation equations, and $\mathbf{D}$ has $N$ rows and $N+1$ columns. The known initial state fills one of the $N+1$ unknowns; the collocation equations then pin down the other $N$ once the controls are chosen.

::: example Radau collocation on a problem with a known answer
Solve $\dot x = -x$ from $x(0) = 1$ over $0 \le t \le 2$, whose exact answer is $x(t) = e^{-t}$. Here $(t_f - t_0)/2 = 1$, so the equations are $\sum_j D_{kj}x_j = -x_k$ at each of the $N$ Radau nodes, with $x_0 = 1$ given. That is $N$ linear equations for $N$ unknowns. Solve them and compare with $e^{-t}$ at the nodes:

- $N = 3$: largest error $8.5\times10^{-3}$.
- $N = 5$: largest error $5.3\times10^{-5}$.
- $N = 10$: largest error $2.5\times10^{-11}$.

**Sanity check.** Going from $3$ to $5$ nodes cut the error by a factor of about $160$; going from $5$ to $10$ cut it by about two million. No fixed power of $N$ behaves like that. This is the **[[spectral convergence|spectral-bridge]]** the next lesson is about.
:::

Here is a short, runnable check of the differentiation matrix, built for $7$ LGL nodes and tested on a degree-$4$ polynomial:

```python
import numpy as np
from numpy.polynomial import legendre as leg

def P(n):                      # coefficients of the Legendre polynomial P_n
    c = np.zeros(n + 1); c[n] = 1.0
    return c

def lgl_nodes(N):              # N+1 nodes: -1, roots of P_N', +1
    inner = np.sort(leg.legroots(leg.legder(P(N))))
    return np.concatenate(([-1.0], inner, [1.0]))

def diff_matrix(x):            # D[k, j] = slope of basis polynomial j at node k
    n = len(x)
    w = np.array([1 / np.prod([x[j] - x[i] for i in range(n) if i != j])
                  for j in range(n)])
    D = np.zeros((n, n))
    for k in range(n):
        for j in range(n):
            if k != j:
                D[k, j] = (w[j] / w[k]) / (x[k] - x[j])
        D[k, k] = -D[k].sum()  # each row must give slope 0 for a constant
    return D

x = lgl_nodes(6)               # 7 nodes
D = diff_matrix(x)
p = x**4 - 2 * x**3 + x        # a degree-4 test polynomial
dp = 4 * x**3 - 6 * x**2 + 1   # its exact derivative
print(np.round(x, 4) + 0.0)
print(f"max error {np.max(np.abs(D @ p - dp)):.1e}")
# [-1.     -0.8302 -0.4688  0.      0.4688  0.8302  1.    ]
# max error 8.9e-15
```

The error, $8.9\times10^{-15}$, is machine precision — rounding error, not approximation. That is not luck with this polynomial. A differentiation matrix built from $N+1$ nodes reproduces the derivative of *any* polynomial of degree $N$ or less exactly, because the interpolating polynomial through its node values *is* that polynomial. There is no modeling error left. A finite difference, or a fixed-order collocation defect, is only ever an approximation, even on its own best-case input.

::: note Why it has to be true: exactness for polynomials
Through $N+1$ distinct points there is exactly one polynomial of degree at most $N$. Suppose two different ones, $p$ and $q$, both passed through all the points. Their difference $p - q$ would be a polynomial of degree at most $N$ with $N+1$ roots. But a nonzero polynomial of degree $N$ has at most $N$ roots. So $p - q$ is zero everywhere, and $p = q$. Now take a polynomial $p$ of degree $N$ or less and sample it at the nodes. The interpolant through those samples is a polynomial of degree at most $N$ through the same points, so it is $p$ itself. Differentiating the interpolant is then differentiating $p$, and $\mathbf{D}$ does that exactly.
:::

::: warning The differentiation matrix is dense, and that is the trade being made
Almost every entry $D_{kj}$ is nonzero. The slope at node $k$ really depends on every other node's value, because the polynomial is one global object, not a chain of local pieces. (In the $7$-node example, $46$ of the $49$ entries are nonzero; the three zeros are accidents of symmetry.) Trapezoidal and Hermite-Simpson defects only couple *neighboring* nodes, which gives a banded, **[[sparse Jacobian|sparsity-bridge]]**. A pseudospectral scheme trades that sparsity for accuracy. The trade pays when $N$ is modest and the solution is smooth. It becomes a burden when $N$ must be large, which is one honest reason local collocation, not a single global polynomial, dominates for trajectories with dozens of sharp features to resolve.
:::

## Check yourself

::: check
Why does the Runge phenomenon get *worse* as $N$ grows for equally spaced nodes, instead of the fit merely failing to improve?
:::

::: answer
The polynomial must pass exactly through every sampled value. As $N$ grows, a degree-$N$ polynomial can bend more and more sharply, and near the ends, where equally spaced nodes give it the least support compared to how fast it wants to bend, it uses that freedom to swing between the nodes while still hitting each one. For functions like the bump in the example, those swings grow with $N$. More data, fed to node placement that does not give support where a high-degree polynomial needs it, amplifies the problem instead of averaging it away. The jump from $1.92$ to $59.8$ is that amplification, not noise.
:::

::: check
A Legendre-Gauss-Lobatto scheme with $21$ nodes has a dense $21\times21$ differentiation matrix, so one collocation equation touches all $21$ node values. How many node values does one Hermite-Simpson defect touch, and why does the difference matter as $N$ grows?
:::

::: answer
A pseudospectral equation at one node uses a whole row of $\mathbf{D}$: up to $21$ state values. A Hermite-Simpson defect touches only $\mathbf{x}_k$, $\mathbf{x}_{k+1}$, $\mathbf{u}_k$ and $\mathbf{u}_{k+1}$ — the midpoint values are built from exactly those four — no matter how many segments the mesh has. So the pseudospectral Jacobian is dense, and each row gets longer as $N$ grows, while the collocation Jacobian is made of small fixed-size blocks banded along the diagonal. That is the trade named in the warning, visible directly in the pattern of nonzero entries.
:::

::: check
Why is $P_{N-1}(\tau) + P_N(\tau)$, rather than $P_N(\tau)$ alone, the right polynomial to find the roots of for Legendre-Gauss-Radau nodes?
:::

::: answer
The roots of $P_N$ alone are the Legendre-Gauss nodes, and they never include either endpoint: $P_N(1) = 1$ and $P_N(-1) = \pm 1$, never zero. Radau needs a polynomial with $\tau = -1$ guaranteed to be a root. Since $P_n(-1) = (-1)^n$, the sum gives $P_{N-1}(-1) + P_N(-1) = (-1)^{N-1} + (-1)^N = 0$ for every $N$, because neighboring whole numbers have opposite parity and the two terms cancel. At $\tau = +1$ the sum is $1 + 1 = 2$, so $+1$ is never a root. The remaining $N - 1$ roots lie strictly inside $(-1, 1)$, crowding toward the ends like the other families.
:::

::: check
A team is setting up a rendezvous problem. Both the chaser's initial state and its final docking state are fixed, known data. One engineer says Radau collocation anchored at $t_0$ cannot work, because there is no collocation node at $t_f$ to pin the docking state to. Is that right? Which family puts a node exactly on both ends?
:::

::: answer
The objection is wrong. In the standard Radau setup the polynomial passes through the Radau nodes *and* the uncollocated end at $t_f$, so the final state is still an unknown of the problem. The fixed docking state is imposed on it as an ordinary boundary constraint. What Radau leaves out at $t_f$ is only a *dynamics* equation, not the state itself. That is the same structure it uses when the final state is free, and it handles fixed and free terminal conditions equally well. If the team specifically wants a collocation node sitting on both boundaries, Legendre-Gauss-Lobatto provides one, since it includes both $-1$ and $+1$ by construction.
:::

::: check
The differentiation-matrix equation carries a factor $(t_f - t_0)/2$. A student leaves it out when solving a $400\,\mathrm{s}$ descent on LGR nodes. What goes wrong?
:::

::: answer
The matrix $\mathbf{D}$ gives slopes per unit of $\tau$, and $\tau$ runs over a width of $2$ while the flight lasts $400\,\mathrm{s}$. So one unit of $\tau$ is $200\,\mathrm{s}$, and the correct equation is $\sum_j D_{kj}\mathbf{x}_j = 200\,\mathbf{f}$. Without the factor, the student is asking the state to change $200$ times more slowly than the physics says — in effect solving a flight squeezed into $2\,\mathrm{s}$. The solver may even converge, but to a trajectory for the wrong problem. When $t_f$ is free the mistake is worse still, because $t_f$ is meant to enter the equations only through that factor.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Pseudospectral idea | One global polynomial over the whole flight; more accuracy from higher degree, not more segments |
| Time map | $t = t_0 + \frac{t_f - t_0}{2}(\tau + 1)$, with $-1 \le \tau \le 1$ |
| Legendre polynomials | $P_0 = 1$, $P_1 = \tau$, $(n+1)P_{n+1} = (2n+1)\tau P_n - nP_{n-1}$; $P_n(1) = 1$, $P_n(-1) = (-1)^n$ |
| Legendre-Gauss (LG) | Roots of $P_N$; no endpoints |
| Legendre-Gauss-Lobatto (LGL) | $\pm 1$ plus the roots of $P_N'$; both endpoints |
| Legendre-Gauss-Radau (LGR) | Roots of $P_{N-1} + P_N$: includes $-1$, never $+1$; one endpoint; usual choice for initial-value-style problems |
| Why clustering matters | Runge: equally spaced $N = 20$ error $59.8$; LGL error $0.0166$ |
| Differentiation matrix | $D_{kj} = \ell_j'(\tau_k)$; dynamics enforced as $\sum_j D_{kj}\mathbf{x}_j = \frac{t_f - t_0}{2}\mathbf{f}_k$ |
| Exactness | $N+1$ nodes differentiate any polynomial of degree $\le N$ exactly; $7$-node LGL check error $8.9\times10^{-15}$ |
| Sparsity trade | Pseudospectral: dense $\mathbf{D}$, every node coupled. Collocation: banded, neighbors only |

Node placement explains why a pseudospectral scheme *can* be accurate. The next lesson shows how accurate: the spectral convergence rate that makes this family worth its dense matrix when the solution is smooth, and the precise way that advantage collapses the moment it is not.

::: context runge The whipping ruler, drawn to scale
Carl Runge (1856–1927) was a German mathematician; the "Runge" in Runge-Kutta is the same person. Below, the blue curve is the bump $1/(1+25\tau^2)$ and the red curve is the degree-$10$ polynomial through $11$ equally spaced samples of it (red dots), both plotted to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="80" x2="330" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="26" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="26" y="84" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <path d="M30.0,137.7 L37.5,137.5 L45.0,137.2 L52.5,136.9 L60.0,136.5 L67.5,136.0 L75.0,135.5 L82.5,134.8 L90.0,134.0 L97.5,133.0 L105.0,131.7 L112.5,130.1 L120.0,128.0 L127.5,125.2 L135.0,121.5 L142.5,116.6 L150.0,110.0 L157.5,101.6 L165.0,92.0 L172.5,83.5 L180.0,80.0 L187.5,83.5 L195.0,92.0 L202.5,101.6 L210.0,110.0 L217.5,116.6 L225.0,121.5 L232.5,125.2 L240.0,128.0 L247.5,130.1 L255.0,131.7 L262.5,133.0 L270.0,134.0 L277.5,134.8 L285.0,135.5 L292.5,136.0 L300.0,136.5 L307.5,136.9 L315.0,137.2 L322.5,137.5 L330.0,137.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M30.0,137.7 L31.9,87.9 L33.8,54.6 L35.6,34.5 L37.5,24.6 L39.4,22.6 L41.2,26.5 L43.1,34.5 L45.0,45.3 L46.9,57.7 L48.8,70.9 L50.6,84.1 L52.5,96.8 L54.4,108.7 L56.3,119.3 L58.1,128.6 L60.0,136.5 L61.9,142.9 L63.8,147.9 L65.6,151.5 L67.5,153.9 L69.4,155.1 L71.2,155.4 L73.1,154.8 L75.0,153.6 L76.9,151.8 L78.8,149.5 L80.6,147.0 L82.5,144.4 L84.4,141.6 L86.2,139.0 L88.1,136.4 L90.0,134.0 L93.8,130.0 L97.5,127.1 L101.3,125.4 L105.0,124.8 L108.8,125.1 L112.5,125.9 L116.3,127.0 L120.0,128.0 L123.8,128.6 L127.5,128.6 L131.2,127.7 L135.0,125.9 L138.8,123.1 L142.5,119.4 L146.2,115.0 L150.0,110.0 L153.8,104.7 L157.5,99.3 L161.2,94.1 L165.0,89.4 L168.8,85.5 L172.5,82.5 L176.2,80.6 L180.0,80.0 L183.8,80.6 L187.5,82.5 L191.2,85.5 L195.0,89.4 L198.8,94.1 L202.5,99.3 L206.2,104.7 L210.0,110.0 L213.8,115.0 L217.5,119.4 L221.3,123.1 L225.0,125.9 L228.8,127.7 L232.5,128.6 L236.2,128.6 L240.0,128.0 L243.8,127.0 L247.5,125.9 L251.2,125.1 L255.0,124.8 L258.8,125.4 L262.5,127.1 L266.2,130.0 L270.0,134.0 L271.9,136.4 L273.8,139.0 L275.6,141.6 L277.5,144.4 L279.4,147.0 L281.2,149.5 L283.1,151.8 L285.0,153.6 L286.9,154.8 L288.8,155.4 L290.6,155.1 L292.5,153.9 L294.4,151.5 L296.2,147.9 L298.1,142.9 L300.0,136.5 L301.9,128.6 L303.8,119.3 L305.6,108.7 L307.5,96.8 L309.4,84.1 L311.2,70.9 L313.1,57.7 L315.0,45.3 L316.9,34.5 L318.8,26.5 L320.6,22.6 L322.5,24.6 L324.4,34.5 L326.2,54.6 L328.1,87.9 L330.0,137.7" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="30" cy="137.7" r="3" fill="#b4232c"/>
  <circle cx="60" cy="136.5" r="3" fill="#b4232c"/>
  <circle cx="90" cy="134" r="3" fill="#b4232c"/>
  <circle cx="120" cy="128" r="3" fill="#b4232c"/>
  <circle cx="150" cy="110" r="3" fill="#b4232c"/>
  <circle cx="180" cy="80" r="3" fill="#b4232c"/>
  <circle cx="210" cy="110" r="3" fill="#b4232c"/>
  <circle cx="240" cy="128" r="3" fill="#b4232c"/>
  <circle cx="270" cy="134" r="3" fill="#b4232c"/>
  <circle cx="300" cy="136.5" r="3" fill="#b4232c"/>
  <circle cx="330" cy="137.7" r="3" fill="#b4232c"/>
  <text x="30" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">-1</text>
  <text x="330" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="180" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
</svg>
```

Near each end the red curve shoots up to almost $2$, nearly twice the bump's peak, while the true function there is under $0.1$.
:::

::: context legendre Where Legendre polynomials come from
Adrien-Marie Legendre (1752–1833), a French mathematician, met these polynomials while calculating the gravitational pull of a planet that is not a perfect sphere. They are still used for exactly that: Earth's gravity models are written as sums built from Legendre polynomials and their close relatives. Their special property here is that each $P_n$ is "perpendicular" to every lower-degree polynomial, in the sense that the integral of their product over $[-1, 1]$ is zero. That property is what makes their roots such good places to sample. Here are $P_2$ (blue) and $P_3$ (red), to scale, with the roots of $P_3$ — the three Gauss nodes $0$ and $\pm 0.7746$ — marked:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="320" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="30" x2="40" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="320" y1="30" x2="320" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M40.0,35.0 L54.0,52.1 L68.0,67.4 L82.0,80.9 L96.0,92.6 L110.0,102.5 L124.0,110.6 L138.0,116.9 L152.0,121.4 L166.0,124.1 L180.0,125.0 L194.0,124.1 L208.0,121.4 L222.0,116.9 L236.0,110.6 L250.0,102.5 L264.0,92.6 L278.0,80.9 L292.0,67.4 L306.0,52.1 L320.0,35.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40.0,155.0 L47.0,138.1 L54.0,123.4 L61.0,110.6 L68.0,99.8 L75.0,90.8 L82.0,83.5 L89.0,77.7 L96.0,73.4 L103.0,70.5 L110.0,68.8 L117.0,68.2 L124.0,68.6 L131.0,69.9 L138.0,72.1 L145.0,74.8 L152.0,78.2 L159.0,82.0 L166.0,86.2 L173.0,90.5 L180.0,95.0 L187.0,99.5 L194.0,103.9 L201.0,108.0 L208.0,111.8 L215.0,115.2 L222.0,118.0 L229.0,120.1 L236.0,121.4 L243.0,121.8 L250.0,121.2 L257.0,119.5 L264.0,116.6 L271.0,112.3 L278.0,106.5 L285.0,99.2 L292.0,90.2 L299.0,79.4 L306.0,66.6 L313.0,51.9 L320.0,35.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="71.6" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="288.4" cy="95" r="4" fill="#1f2a44"/>
  <text x="34" y="39" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="159" font-size="11" text-anchor="end" fill="#1f2a44">-1</text>
  <text x="40" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">-1</text>
  <text x="320" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">+1</text>
  <text x="120" y="140" font-size="12" text-anchor="middle" fill="#1d6fd1">P2</text>
  <text x="120" y="58" font-size="12" text-anchor="middle" fill="#b4232c">P3</text>
</svg>
```

Both end at $1$ on the right; on the left $P_2$ ends at $+1$ and $P_3$ at $-1$, the $(-1)^n$ rule.
:::

::: context gauss Twice the accuracy for free
With $N$ sample points you would normally expect to integrate polynomials up to degree $N - 1$ exactly: $N$ points fix a polynomial of degree $N - 1$. Carl Friedrich Gauss showed in 1814 that if you also choose *where* the points go, you can do nearly twice as well — up to degree $2N - 1$. The best places turn out to be the roots of the Legendre polynomial $P_N$. Each endpoint you force into the node set spends one of those free choices, which is why Radau is exact to degree $2N - 2$ and Lobatto to degree $2N - 3$ with $N$ nodes.
:::

::: context names Three names on the nodes
Carl Friedrich Gauss (1777–1855), German, found the no-endpoint rule. Rodolphe Radau (1835–1911), a German-born astronomer and mathematician who worked in France, studied the version with one endpoint fixed. Rehuel Lobatto (1797–1866), a Dutch mathematician, studied the version with both endpoints fixed. Here is where each family puts its nodes on $[-1, 1]$, drawn to scale for $N = 5$ (five Gauss and five Radau nodes, and six Lobatto nodes):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="35" x2="340" y2="35" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="115" x2="340" y2="115" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="50" y="39" font-size="12" text-anchor="end" fill="#1f2a44">LG</text>
  <text x="50" y="79" font-size="12" text-anchor="end" fill="#1f2a44">LGR</text>
  <text x="50" y="119" font-size="12" text-anchor="end" fill="#1f2a44">LGL</text>
  <circle cx="73.1" cy="35" r="4.5" fill="#1d6fd1"/>
  <circle cx="124.6" cy="35" r="4.5" fill="#1d6fd1"/>
  <circle cx="200" cy="35" r="4.5" fill="#1d6fd1"/>
  <circle cx="275.4" cy="35" r="4.5" fill="#1d6fd1"/>
  <circle cx="326.9" cy="35" r="4.5" fill="#1d6fd1"/>
  <circle cx="60" cy="75" r="4.5" fill="#b4232c"/>
  <circle cx="99.1" cy="75" r="4.5" fill="#b4232c"/>
  <circle cx="176.6" cy="75" r="4.5" fill="#b4232c"/>
  <circle cx="262.5" cy="75" r="4.5" fill="#b4232c"/>
  <circle cx="324" cy="75" r="4.5" fill="#b4232c"/>
  <circle cx="340" cy="75" r="4" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="60" cy="115" r="4.5" fill="#1f2a44"/>
  <circle cx="92.9" cy="115" r="4.5" fill="#1f2a44"/>
  <circle cx="160.1" cy="115" r="4.5" fill="#1f2a44"/>
  <circle cx="239.9" cy="115" r="4.5" fill="#1f2a44"/>
  <circle cx="307.1" cy="115" r="4.5" fill="#1f2a44"/>
  <circle cx="340" cy="115" r="4.5" fill="#1f2a44"/>
  <text x="60" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">-1</text>
  <text x="340" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">+1</text>
</svg>
```

The hollow circle marks the Radau end that is not a collocation node but still carries a state value.
:::

::: context lagrange-basis Building a polynomial from on-off switches
A **Lagrange basis polynomial** $\ell_j(\tau)$ is built to be $1$ at node $j$ and $0$ at every other node, like a switch that is on at one place only. Any interpolating polynomial is then a sum: $p(\tau) = \sum_j x_j\,\ell_j(\tau)$, because at node $k$ every term vanishes except $x_k \cdot 1$. Differentiate the sum and evaluate at node $k$: $p'(\tau_k) = \sum_j \ell_j'(\tau_k)\,x_j$. The numbers $\ell_j'(\tau_k)$ are the entries of $\mathbf{D}$. Joseph-Louis Lagrange, the same one as in the first lesson, published this form in 1795.
:::

::: context radau-iia The stiff-solver connection
A **stiff** differential equation has some parts that change very fast and others very slowly, like a spacecraft's slow orbit combined with a fast-settling thruster valve. Ordinary explicit simulators need tiny steps to stay stable on such problems. **Implicit Runge-Kutta** methods solve an equation at each step instead, and stay stable with big steps. The Radau IIA family, used in the well-known RADAU5 solver by Ernst Hairer and Gerhard Wanner, samples each step at Radau nodes (flipped so the included end is the step's finish). Collocating at Radau nodes is exactly that construction, which is why LGR behaves so well when marching from a known start.
:::

::: context spectral-bridge Faster than any power
An error that falls like $1/N^4$ is fast: double $N$ and it drops by $16$. An error that falls like $e^{-cN}$ is faster still: each extra node multiplies it by the same factor below one, so doubling $N$ roughly squares the error: $10^{-3}$ becomes about $10^{-6}$. Eventually it beats $1/N^p$ for every $p$ you pick. That is **spectral convergence**. The next lesson shows it holds only when the solution is smooth, and what a single corner, like the Mars descent's engine switch at $1.8546\,\mathrm{s}$, does to it.
:::

::: context sparsity-bridge Why zeros are worth money
A later lesson on NLP sparsity counts the cost. A solver working with a table of $n$ unknowns that is mostly zeros, with the nonzeros in narrow bands, can factor it with work roughly proportional to $n$. A table that is full needs work proportional to $n^3$. For a few dozen pseudospectral nodes that is fine; for thousands it is not. This is why pseudospectral tools split long flights into several pieces, each with its own modest polynomial.
:::
