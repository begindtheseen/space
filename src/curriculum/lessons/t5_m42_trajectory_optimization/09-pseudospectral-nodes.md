---
id: l09-pseudospectral-nodes
title: "Pseudospectral methods: node families and the differentiation matrix"
minutes: 15
covers:
  - "Pseudospectral methods: Legendre-Gauss, Legendre-Gauss-Radau and Legendre-Gauss-Lobatto nodes"
---

Trapezoidal and Hermite-Simpson collocation buy accuracy the same way every fixed-order numerical method does: add more segments. The polynomial degree on each segment never changes — linear, or cubic — so the only knob is $h$, and the previous lesson's order analysis, $O(h^2)$ or $O(h^4)$ globally, is the ceiling on how fast that knob can improve things. A **pseudospectral** method takes the opposite strategy: keep the whole trajectory as a *single* segment, and add accuracy by raising the *degree* of one global polynomial fit through it. Done carelessly this fails spectacularly; done with the right choice of node locations, it converges faster than any fixed power of $1/N$, for exactly the same nonlinear vehicle dynamics this module has been working throughout. This lesson builds the node families that make it possible; the next takes up the convergence rate itself.

## Why not just use more, equally-spaced points

A single high-degree polynomial through $N+1$ **equally spaced** points is a well-known numerical disaster — the interpolant oscillates wildly near the ends of the interval as $N$ grows, a phenomenon named for Carl Runge, who first analysed it.

::: example The Runge phenomenon, measured
Interpolate $g(x) = 1/(1+25x^2)$ on $[-1,1]$ — smooth, innocuous-looking, nothing pathological about it — with a degree-$N$ polynomial through equally spaced nodes, and separately through nodes clustered near the endpoints (the Legendre-Gauss-Lobatto family introduced below). Measuring the worst-case error against the true function over a fine grid:

| $N$ | equally spaced, max error | Legendre-Gauss-Lobatto, max error |
| --- | --- | --- |
| $10$ | $1.916$ | $0.1211$ |
| $20$ | $59.82$ | $0.0166$ |

The equally spaced interpolant's error is already larger than the function's entire range ($g\in[0,1]$) at $N=10$, and it gets **worse**, not better, by a factor of over $30$ as $N$ doubles — more points, fed to the wrong node locations, actively destroy the approximation near the edges of the interval. The clustered nodes do the opposite: error shrinks by more than a factor of $7$ over the same doubling, and this is before any of the special algebraic properties of the specific families below are even used — clustering near the ends is doing essentially all of the work.
:::

The fix has a name because it recurs everywhere polynomial interpolation is pushed to high degree: put more nodes near the ends of the interval, where an equally spaced grid is sparsest relative to how fast a high-degree polynomial wants to wiggle there. Three specific families do this by construction, all built from the roots of Legendre polynomials, each with its own trade-off about which endpoints are included.

## Three node families

Let $P_n$ denote the degree-$n$ Legendre polynomial on $[-1,1]$.

**Legendre-Gauss (LG).** The $N$ nodes are simply the roots of $P_N$ — no endpoints included at all. These are the classical Gauss quadrature nodes, exact for polynomials of degree up to $2N-1$ when used for integration, and they cluster toward $\pm1$ without ever touching them.

**Legendre-Gauss-Lobatto (LGL).** Both endpoints, $-1$ and $1$, are included by construction, and the $N-1$ interior nodes are the roots of $P_N'$ (the derivative of the Legendre polynomial) — the points where $P_N$ itself is stationary. Including both endpoints is convenient when both the initial and final states genuinely need to be collocation nodes.

**Legendre-Gauss-Radau (LGR).** Exactly *one* endpoint is included — by convention $-1$ — and the remaining $N-1$ nodes are the roots of $P_{N-1}+P_N$ (a polynomial that is guaranteed to vanish at $x=-1$, since $P_n(-1)=(-1)^n$ makes $P_{N-1}(-1)+P_N(-1)=(-1)^{N-1}+(-1)^N=0$ for every $N$). Computed directly for $N=3,4,5,6$: the nodes are $\{-1,\,-0.2899,\,0.6899\}$, $\{-1,\,-0.5753,\,0.1811,\,0.8228\}$, and so on — always starting exactly at $-1$, never touching $+1$.

::: key Why Radau is the usual choice for an initial-value-style problem
Mapping $-1$ to $t_0$, LGR gives a collocation node exactly at the known initial state — natural, since that state is data, not something to interpolate — while leaving $t_f$ **uncollocated**, free to be handled by the transversality conditions and the terminal cost without an extra collocation equation fighting them there. Reflecting the map (Radau at $t_f$ instead of $t_0$) is used just as often when the boundary structure favours anchoring the other end. LGL, anchoring both ends, is the natural choice when both the initial and terminal states are themselves free, unconstrained collocation unknowns rather than fixed data.
:::

## The differentiation matrix

A pseudospectral scheme never writes a defect built from a quadrature of $\mathbf{f}$. Instead, since the state is represented by a single polynomial $\mathbf{x}(t)$ interpolating the values $\mathbf{x}_0,\dots,\mathbf{x}_N$ at the chosen nodes, that polynomial can be **differentiated exactly** — its derivative is again a polynomial, of one lower degree, and its value at any node is a fixed *linear* combination of all the node values. Collecting those linear combinations into a matrix $\mathbf{D}$ (built once, from the node locations alone, via the standard barycentric-weight formula for a Lagrange-interpolant derivative), the dynamics are enforced as

$$
\sum_{j=0}^{N} D_{kj}\,\mathbf{x}_j = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k,t_k), \qquad k = 1,\dots,N,
$$

one algebraic equation per collocation node (the node tied to the known boundary data is excluded from this set and imposed directly instead). This is differentiate-the-interpolant, matched against the dynamics — the reverse of collocation's integrate-the-dynamics, matched against the interpolant's endpoints.

::: example The differentiation matrix, verified against a polynomial it must get exactly right
$\mathbf{D}$ built from $7$ Legendre-Gauss-Lobatto nodes reproduces the derivative of $p(t)=t^4-2t^3+t$ — a degree-$4$ polynomial, well within what $7$ nodes can represent exactly — to a maximum error of $8.9\times10^{-15}$ across every node: machine precision, not an approximation. This is not a coincidence of this particular polynomial; a differentiation matrix built from $N+1$ nodes reproduces the exact derivative of *any* polynomial of degree $N$ or less, because the interpolant itself is exactly that polynomial when the underlying function already is one — there is no modelling error left to accumulate, unlike a finite-difference or a fixed-order collocation defect, which are only ever approximations even when applied to their own best-case input.
:::

::: warning The differentiation matrix is dense, and that is the trade being made
Every entry $D_{kj}$ is generally nonzero — differentiating the interpolant at node $k$ genuinely depends on every other node's value, because the interpolating polynomial is a single global object, not a piecewise one. Trapezoidal and Hermite-Simpson defects, by contrast, only ever couple *adjacent* nodes, giving a banded, sparse Jacobian. A pseudospectral scheme trades that sparsity for the accuracy shown above — worthwhile when $N$ is modest and the solution is smooth (the subject of the next lesson), a liability when $N$ needs to be large, which is one honest reason collocation, not pseudospectral methods, dominates for trajectories with dozens of mesh-scale features to resolve.
:::

## Check yourself

::: check
Why does the Runge phenomenon get *worse* as $N$ increases for equally spaced nodes, rather than the interpolation simply failing to improve?
:::

::: answer
The interpolating polynomial through equally spaced nodes is forced to pass through every sampled value exactly, and as $N$ grows, the polynomial has more freedom to oscillate *between* the sparse effective spacing near the edges (where equally spaced nodes are relatively far apart compared to how fast a degree-$N$ polynomial wants to bend) while still hitting every node. Those oscillations grow in amplitude with $N$ for functions like the one in the worked example, so more data points, fed to a node placement that does not compensate for where a high-degree polynomial needs support, actively amplifies the problem rather than averaging it away — the measured jump from $1.92$ to $59.8$ is that amplification, not noise.
:::

::: check
A Legendre-Gauss-Lobatto scheme with $N=20$ segments has a dense $21\times21$ differentiation matrix, so an interior collocation equation touches all $21$ node values. Compare the number of nonzero entries touching a single defect to the Hermite-Simpson scheme of the previous lesson at the same node count.
:::

::: answer
A pseudospectral defect at one node involves all $21$ entries of that row of $\mathbf{D}$, so up to $21$ nonzero couplings per equation. A Hermite-Simpson defect touches only $\mathbf{x}_k$, $\mathbf{x}_{k+1}$, $\mathbf{u}_k$, $\mathbf{u}_{k+1}$ (and the midpoint values built from exactly those) — four node values, regardless of how many total segments the mesh has. The pseudospectral Jacobian block is therefore dense and grows with $N$; the collocation Jacobian block is a fixed, small size, banded across the whole mesh no matter how large $N$ gets — the trade-off named in the warning above, visible directly in the sparsity pattern rather than just asserted.
:::

::: check
Why is $P_{N-1}(x) + P_N(x)$, rather than $P_N(x)$ alone, the right polynomial to root for Legendre-Gauss-Radau nodes?
:::

::: answer
$P_N$ alone gives the Legendre-Gauss nodes, which include neither endpoint — the roots of a Legendre polynomial never land exactly on $\pm1$ except in the trivial low-degree cases. Radau needs a polynomial whose roots are guaranteed to include $x=-1$ specifically, and $P_{N-1}(-1)+P_N(-1) = (-1)^{N-1}+(-1)^N = 0$ for every $N$, because consecutive integers of opposite parity make consecutive Legendre polynomials take opposite signs at $-1$. That algebraic identity is what forces $x=-1$ to be a root of the sum for any $N$, while the remaining $N-1$ roots of that same polynomial fall strictly inside $(-1,1)$, clustered toward $+1$ exactly the way the other two families cluster toward both ends.
:::

::: check
A team collocates a rendezvous problem — both the chaser's initial state and its final docking state are genuine boundary data, fixed and known — using Legendre-Gauss-Radau nodes anchored at $t_0$ only. What goes wrong at $t_f$, and which node family avoids it?
:::

::: answer
LGR anchored at $t_0$ leaves $t_f$ uncollocated, which is exactly the right structure when the terminal state is *free*, governed by a transversality condition rather than fixed data — but here the terminal docking state is fixed data too, just like the initial one, and there is no collocation node sitting exactly at $t_f$ to pin it against. The practical fix is either a Radau scheme anchored at the *other* end, or — more directly, since both ends are genuinely fixed here — Legendre-Gauss-Lobatto, which includes both $-1$ and $1$ as nodes by construction and therefore gives a natural collocation point at both the known initial state and the known final one.
:::

## Summary

| Object | Statement |
| --- | --- |
| Pseudospectral idea | One global polynomial over the whole mesh; more accuracy from higher degree, not more segments |
| Legendre-Gauss (LG) | Roots of $P_N$; no endpoints |
| Legendre-Gauss-Lobatto (LGL) | $\pm1$ plus roots of $P_N'$; both endpoints |
| Legendre-Gauss-Radau (LGR) | $-1$ (or $+1$) plus roots of $P_{N-1}+P_N$; one endpoint |
| Why clustering matters | Runge phenomenon: equally spaced $N=20$ interpolation error $59.8$; LGL error $0.0166$ |
| Differentiation matrix | $\mathbf{D}$ from node locations; $\sum_jD_{kj}\mathbf{x}_j=\mathbf{f}_k$ replaces the quadrature-based defect |
| Exactness check | $7$-node LGL differentiation matrix reproduces a degree-$4$ polynomial's derivative to $8.9\times10^{-15}$ |
| Sparsity trade | Pseudospectral: dense $\mathbf{D}$, coupling every node. Collocation: banded, four-node-wide defects |
| LGR's typical role | Anchors the end with known, fixed boundary data; leaves the free end uncollocated for transversality |

Node placement alone explains why a pseudospectral scheme can be *accurate*; the next lesson proves how accurate — the spectral convergence rate that makes this family worth its dense Jacobian when the solution is smooth, and the precise way that advantage collapses the moment it is not.
