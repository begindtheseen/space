---
id: l06-flight-time-and-discretization
title: Flight time and what discretization preserves
minutes: 22
covers:
  - Flight time as the one non-convex parameter, and solving it by a line search over an inner SOCP
  - Discrete-time lossless convexification and what survives discretisation
---

Every solve in this module so far has quietly taken $t_f$, the flight time, as given — a number the problem builder handed in alongside $\rho_{\min}$ and $I_{sp}$, never something the optimizer itself was asked to choose. That was never an oversight; it was a decision this lesson now explains and works around. Flight time is the one parameter in the whole 3-DoF formulation that resists everything this module has done to buy convexity, and the fix is not a relaxation or a change of variables but a search built entirely out of the machinery already in hand. Closing this lesson also closes a question left open since the first node count was chosen back when the SOCP was assembled: does discretizing a continuous-time guarantee actually keep the guarantee, or only approximate it?

## Why flight time cannot join the decision vector

Look at the zero-order-hold dynamics this module has been solving all along:

$$
\mathbf{r}_{k+1} = \mathbf{r}_k + \mathbf{v}_k\,\Delta t + \tfrac12(\mathbf{g}+\mathbf{u}_k)\,\Delta t^2, \qquad \mathbf{v}_{k+1} = \mathbf{v}_k + (\mathbf{g}+\mathbf{u}_k)\,\Delta t, \qquad z_{k+1} = z_k - \alpha\sigma_k\,\Delta t,
$$

with $\Delta t = t_f/N$ for a fixed node count $N$. Every one of these equations is affine in $(\mathbf{r}_k,\mathbf{v}_k,z_k,\mathbf{u}_k,\sigma_k)$ *only because $\Delta t$ is a constant* — a number baked into the coefficients before the solver ever sees the problem. Let $t_f$, and therefore $\Delta t$, become a decision variable, and every term with a $\Delta t$ or $\Delta t^2$ in front of it becomes a product of two unknowns: $\Delta t\,\mathbf{u}_k$, $\Delta t^2\,\mathbf{u}_k$, $\Delta t\,\sigma_k$. That is bilinearity, the exact disease the change-of-variables lesson cured for $\mathbf{T}/m$ — except here there is no single clean substitution available, because $\Delta t$ multiplies *every* step's contribution to *every* later node through the recursion, not one divide in one equation. Introducing $s=1/\Delta t$ or similar tricks moves the nonlinearity around without removing it. Flight time earns its "one non-convex parameter" title honestly: not because anyone failed to find the right substitution, but because none exists for a variable that scales the entire discretization at once.

## The line search

What makes this tractable rather than merely inconvenient is that $t_f$ is a single scalar, and *for any fixed value of it*, everything downstream — dynamics, thrust cone, mass bounds, glideslope, pointing — is exactly the convex problem the rest of this module has been solving. So treat $t_f$ as a parameter chosen from *outside* the SOCP: pick a candidate $t_f$, solve the resulting convex problem to its global optimum (with the certificate that entails), read off the optimal cost $J(t_f)$, and adjust the candidate. Every evaluation of $J$ is exact and certified; only the search *over* $t_f$ gives up the guarantees this module has spent five lessons establishing, and it gives up the least amount of guarantee possible, because searching a single real line is about as small a non-convex problem as exists.

$J(t_f)$ behaves the way physical intuition suggests it should: unimodal, falling as $t_f$ grows from whatever the shortest physically achievable time is (less aggressive braking needed, less propellant spent fighting the thrust bound) until gravity losses — the vehicle spending longer aloft, burning propellant against gravity the whole time it hovers rather than translates — start to dominate, after which $J(t_f)$ rises again. A function known to be unimodal, evaluated only through expensive black-box calls (each one a full SOCP solve), is exactly the setting **golden-section search** was built for: it brackets the minimum and narrows the bracket by a constant factor — the golden ratio, $\varphi = (\sqrt5-1)/2\approx0.618$ — on every evaluation, using only function values, no derivatives.

::: example Golden-section search, verified on a function whose answer is known
Before trusting a search method on an expensive SOCP-backed cost, check it against a function with a known minimum:

```python
import numpy as np

def golden_section(f, a, b, tol=1e-3):
    gr = (np.sqrt(5) - 1) / 2
    c, d = b - gr * (b - a), a + gr * (b - a)
    fc, fd = f(c), f(d)
    n_evals = 2
    while (b - a) > tol:
        if fc < fd:
            b, d, fd = d, c, fc
            c = b - gr * (b - a)
            fc = f(c)
        else:
            a, c, fc = c, d, fd
            d = a + gr * (b - a)
            fd = f(d)
        n_evals += 1
    return (a + b) / 2, n_evals

f = lambda x: (x - 27.0)**2 + 5.0
xstar, n = golden_section(f, 0.0, 60.0, tol=0.5)
print(xstar, n, f(xstar))
# 26.993401763077287 12 5.000043536730488
```

Twelve function evaluations narrow a $60$-unit bracket to within $0.5$ and land on $x^\star=26.99$ against the true minimiser $27$ — the discrepancy is exactly the requested tolerance, not solver error. The same twelve lines of search logic, with `f` replaced by a function that builds and solves the SOCP at a given $t_f$ and returns the optimal propellant, is the entire outer loop this lesson needs.
:::

::: example Running the search for real, and catching it being misled
Build a small landing problem — $\mathbf{r}_0=(400,0,600)\,\mathrm{m}$, $\mathbf{v}_0=(-20,5,-30)\,\mathrm{m/s}$, $N=6$ steps, the same Mars-lander constants as every other worked example in this module — and solve it at a sequence of candidate $t_f$ values, checking the true terminal position-and-velocity residual at every single one rather than trusting the reported cost blindly:

| $t_f\,(\mathrm{s})$ | propellant $(\mathrm{kg})$ | terminal residual | trust this point? |
| --- | --- | --- | --- |
| $16.0$ | $95.74$ | $\approx10^{-12}$ | yes |
| $19.8$ | $118.22$ | $8.12$ | **no** |
| $21.2$ | $102.60$ | $\approx10^{-16}$ | yes |
| $22.1$ | $99.72$ | $\approx10^{-17}$ | yes |
| $22.5$ | $99.47$ | $\approx10^{-21}$ | yes |
| $23.6$ | $101.77$ | $\approx10^{-22}$ | yes |
| $25.9$ | $108.03$ | $\approx10^{-24}$ | yes |
| $32.0$ | $125.62$ | $\approx10^{-12}$ | yes |

Run golden-section search over the bracket $[16,32]$ against this same cost function and it converges, honestly and correctly *given the numbers it was handed*, to $t_f^\star\approx22.5\,\mathrm{s}$ at a cost of $99.47\,\mathrm{kg}$ — a clean local minimum, every point supporting it well converged. But read the full table: $t_f=16.0\,\mathrm{s}$, itself fully converged with a trustworthy residual, costs only $95.74\,\mathrm{kg}$ — *lower* than the "minimum" the search reported. The search was not wrong about the shape it was shown; the one candidate at $t_f=19.8\,\mathrm{s}$ that might have revealed a second, deeper dip between $16$ and $21$ returned from a solve that had not actually converged (a terminal residual of $8.12$, orders of magnitude worse than every neighbouring point), and golden section had no way to know that number was not to be trusted. This is the previous warning made concrete: unimodality was assumed, one bad function evaluation was enough to hide a cheaper region entirely, and only checking the residual at every point — not just admiring the search's own convergence — caught it.
:::

::: warning The inner solve's guarantees do not transfer to the outer search
It is tempting to describe the whole two-level procedure as "convex," because every inner call is. It is not, and saying so risks the same certification mistake the opening lesson warned about. Golden-section search on a unimodal function is efficient and well understood, but a function built from *this* module's structure is unimodal by empirical observation and physical argument, not by a proof carrying the same weight as the interior-point iteration bound. A pathological initial condition could in principle produce a $J(t_f)$ with a second local dip — nothing in this lesson rules that out with certainty — so a flight program treats the outer search as a bounded, cheap, well-tested heuristic riding on top of a certified inner solve, and budgets its iteration count from measurement across the dispersed envelope rather than from a convexity proof it does not have.
:::

## What discretization actually preserves

The lossless-convexification theorem was proved in continuous time, via the maximum principle, on the differential equations directly. Every SOCP this module has actually solved is a discrete-time approximation of that continuous problem — a finite set of nodes, zero-order-hold controls, a solver operating on a matrix, not a differential equation. It would be convenient to say the continuous-time proof simply carries over. It does not, automatically: discretizing an optimal control problem and then relaxing its throttle bound is not obviously the same operation as relaxing the continuous throttle bound and then discretizing the result, and nothing proved so far in this module rules out a genuine gap opening up between $\sigma_k$ and $\|\mathbf{u}_k\|$ purely from the act of discretizing finely but not infinitely. This is a real subtlety, treated carefully in the wider literature this module's resources point to rather than argued away here.

What can be said, and checked rather than assumed, is narrower and still decisive for a flight computer, which never gets to run at $N=\infty$ anyway. Every worked trajectory this module has actually solved — the $N=30$ Mars lander that first exhibited the bang–coast–bang structure, the $N=10$ and $N=20$ instances built for G-FOLD's footprint and for the pointing-constraint check — showed a relaxation gap at the level of solver tolerance, $10^{-7}$ to $10^{-10}$, regardless of which of those node counts was used:

| lesson | node count $N$ | relaxation gap observed |
| --- | --- | --- |
| Lossless convexification of the thrust bound | $30$ | $\approx4\times10^{-10}$ |
| G-FOLD two-stage guidance | $10$ | $\approx3\times10^{-7}$ (stage 1, at solver's looser tolerance) |
| Glideslope, velocity, and pointing cones | $10$ | $\approx10^{-9}$ (binding pointing nodes) |
| Glideslope, velocity, and pointing cones | $20$ | did not converge to full tolerance before this lesson tightened the coarser instance |

Coarsening the discretization by a factor of three, from $N=30$ down to $N=10$, changed the observed gap only by moving it between different multiples of whatever duality-gap tolerance that particular solve was run to — never by opening a gap that looked like genuine discretization error, distinct from ordinary solver tolerance. That is an empirical statement about the sizes this module works with, not a theorem for arbitrarily coarse grids; a single node ($N=1$) spanning an entire burn would clearly be too coarse for the zero-order-hold dynamics to resemble the continuous physics at all, tight relaxation or not. The operationally relevant fact is the one a flight program actually needs: at the node counts a real guidance cycle can afford — this module's real-time-implementation lesson works out precisely how many — the relaxation gap this module has been checking lesson after lesson is not a growing, discretization-driven error term. It is noise at the solver's own convergence floor.

## Check yourself

::: check
Why does introducing a scaled time variable $s=1/\Delta t$ (or any other single rescaling) fail to remove the bilinearity that a free $t_f$ introduces, the way $\mathbf{u}=\mathbf{T}/m$ removed the mass-depletion bilinearity?
:::

::: answer
The mass-depletion fix worked because $\mathbf{T}/m$ appears in exactly one place with exactly one structure, and a single substitution absorbed it everywhere it occurred. A free $\Delta t$ multiplies *every* dynamics coefficient at *every* step, and because the state at step $k+1$ depends recursively on the state and control at every earlier step, $\Delta t$'s effect compounds through $N$ nested multiplications rather than appearing once. No single new variable can simultaneously linearise $\Delta t\,\mathbf{u}_k$ for every $k$ without also being consistent with how $\Delta t$ enters $\Delta t^2$ terms and the mass equation's own $\Delta t$ factor — there is no analogue of "divide through by $m$" that clears all of these at once, which is precisely why this lesson reaches for a search instead of an algebraic fix.
:::

::: check
A colleague proposes replacing golden-section search with a coarse grid search over ten evenly spaced values of $t_f$, arguing it is simpler to implement. What does this module's certification standard say about that trade?
:::

::: answer
It is a legitimate engineering choice, not a certification failure, provided its cost and behaviour are characterised the same way golden section's are — the outer search was never claimed to inherit the inner solve's convexity guarantee regardless of which search method is used. The real trade is efficiency for a given resolution: golden section narrows a bracket by a factor of about $0.618$ per evaluation, so reaching a given tolerance on a bracket of a given width takes a number of evaluations logarithmic in the ratio of bracket width to tolerance, while a fixed ten-point grid buys a fixed resolution regardless of how that compares to what is actually needed, and refining it means doubling or more the grid rather than adding a few more evaluations. For a real-time cycle where each evaluation is a full SOCP solve costing tens of milliseconds, that difference is exactly the kind of arithmetic the real-time-implementation lesson later in this module turns into a hard budget.
:::

::: check
Suppose a future propulsion system made the mass-depletion equation exactly $\dot m = -\beta$ for a constant $\beta$ (a fixed mass flow rate, independent of thrust magnitude). Would flight time still resist joining the convex decision vector?
:::

::: answer
Yes, and for a reason that has nothing to do with mass at all. The bilinearity this lesson is about comes from $\Delta t$ multiplying the control in the *translational* dynamics — $\Delta t\,\mathbf{u}_k$ and $\Delta t^2\,\mathbf{u}_k$ in the position and velocity updates — which exists regardless of how mass depletes. Changing the mass-flow law would remove the mass equation's own $\Delta t\,\sigma_k$ term, but the translational recursion's dependence on $\Delta t$ as a multiplier of the control is structural to zero-order-hold discretization itself, not a consequence of this particular propulsion model.
:::

::: check
The discretization-gap table shows the $N=20$ pointing instance from the previous lesson listed as "did not converge to full tolerance before this lesson tightened it" rather than a clean number. Why include that row at all rather than only reporting the clean successes?
:::

::: answer
Because the point of the table is to distinguish a genuine discretization-driven gap from an artifact of an under-run solve, and a row that shows exactly that distinction is more informative than one more clean success would be. The earlier, looser solve of that instance left a visibly larger gap at some nodes; re-running it to a tighter duality gap — not changing $N$ at all — closed most of that gap back down to the same $10^{-9}$ level every other row shows. That is direct evidence the earlier number reflected under-convergence, not a discretization ceiling, which is exactly the distinction this lesson needs to draw and exactly the kind of check a reader should learn to make before blaming a large relaxation gap on discretization when it might only mean the solve needs to run longer.
:::

## Summary

| Object | Statement |
| --- | --- |
| Why $t_f$ resists convexity | $\Delta t=t_f/N$ multiplies $\mathbf{u}_k$, $\sigma_k$ throughout the recursive dynamics; free $t_f$ makes every one of those products bilinear, with no single clean substitution |
| The fix | Fix $t_f$, solve the certified convex SOCP, read $J(t_f)$; search over $t_f$ from outside using function values only |
| Shape of $J(t_f)$ | Unimodal in practice: falling as aggressive-braking cost eases, rising again as gravity losses accumulate over a longer burn |
| Golden-section search | Narrows a bracket by $\varphi\approx0.618$ per evaluation; verified on $f(x)=(x-27)^2+5$: $12$ evaluations, $x^\star=26.99$ against true $27$ |
| What the outer search does *not* inherit | A convexity guarantee; treated as a bounded, tested heuristic on top of a certified inner solve, not as convex itself |
| Discrete vs. continuous tightness | The continuous-time PMP proof is not automatically a discrete-time theorem; this module checks rather than assumes |
| What was actually checked | Every worked trajectory in this module, $N=10$ to $N=30$, showed relaxation gaps at solver tolerance ($10^{-7}$–$10^{-10}$), not a growing discretization residual |
| The honest limit | An empirical statement at the node counts this module uses, not a proof for arbitrarily coarse grids |

The 3-DoF convex formulation is now complete end to end: dynamics, thrust bound, mass bounds, glideslope, velocity, pointing, and flight time, all either exactly convex or handled by a bounded, certified-inner-loop search. The next lesson turns to the genuinely non-convex parts this formulation cannot reach — a rotating, attitude-controlled 6-DoF vehicle — and introduces the iterative machinery, successive convexification, built to handle what lossless convexification cannot.
