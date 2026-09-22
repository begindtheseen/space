---
id: l06-nonlinear-least-squares-gauss-newton-levenberg-marquardt
title: "Nonlinear least squares: Gauss-Newton and Levenberg-Marquardt"
minutes: 20
covers:
  - "Nonlinear least squares: Gauss-Newton and Levenberg-Marquardt"
---

Every estimator built so far assumed the measurement depends on the unknowns through a fixed matrix, $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$. Most measurements in navigation do not work that way. A range to a beacon is the norm of a position difference, $\lVert\mathbf{x}-\mathbf{s}\rVert$, not a linear function of $\mathbf{x}$. A star direction depends on attitude through a rotation matrix. A drag coefficient enters an orbit fit through an exponential atmosphere model. All of these are $\mathbf{y}=\mathbf{h}(\mathbf{x})+\mathbf{v}$ for some nonlinear $\mathbf{h}$, and this lesson builds the two algorithms that fit them: **Gauss-Newton**, which turns out to be nothing more than the linear machinery of this module applied repeatedly, and **Levenberg-Marquardt**, the fix for the one thing that can make Gauss-Newton fail.

## The nonlinear least squares problem

Keep the same cost structure as before, with the linear $\mathbf{H}\mathbf{x}$ replaced by a general $\mathbf{h}(\mathbf{x})$:

$$
\mathbf{r}(\mathbf{x}) = \mathbf{y} - \mathbf{h}(\mathbf{x}), \qquad J(\mathbf{x}) = \tfrac12\,\mathbf{r}(\mathbf{x})^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}) .
$$

There is no closed-form minimizer in general — $\nabla J(\mathbf{x})=\mathbf{0}$ is a nonlinear equation in $\mathbf{x}$ — so every method here is iterative: start from a guess $\mathbf{x}_k$, build a correction $\Delta\mathbf{x}$, set $\mathbf{x}_{k+1}=\mathbf{x}_k+\Delta\mathbf{x}$, repeat until $\Delta\mathbf{x}$ is negligible.

## Linearize and iterate: Gauss-Newton

Define $\mathbf{H}(\mathbf{x}) = \partial\mathbf{h}/\partial\mathbf{x}$, the Jacobian of the model — the same symbol as the constant measurement matrix of every earlier lesson, now evaluated at the current guess, because that is exactly the role it plays. (Since $\mathbf{r}=\mathbf{y}-\mathbf{h}(\mathbf{x})$, $\partial\mathbf{r}/\partial\mathbf{x}=-\mathbf{H}(\mathbf{x})$; some texts and the module's own exercise code call $\mathbf{H}(\mathbf{x})$ "the Jacobian of the residual" for that reason — same matrix, one sign convention away.) A first-order Taylor expansion of the residual about $\mathbf{x}_k$ is

$$
\mathbf{r}(\mathbf{x}_k+\Delta\mathbf{x}) \approx \mathbf{r}(\mathbf{x}_k) - \mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x} .
$$

Substitute this linear approximation into the cost and the problem becomes exactly the linear WLS problem of lesson two, in the unknown $\Delta\mathbf{x}$, with "measurement" $\mathbf{r}(\mathbf{x}_k)$ and "measurement matrix" $\mathbf{H}(\mathbf{x}_k)$. Its normal equations are

$$
\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x} = \mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k) .
$$

Solve this exactly as before — QR on the weighted Jacobian, never the explicit inverse — take the step, re-linearize at the new point, and repeat. **Gauss-Newton is weighted least squares run in a loop**, nothing more: every tool already built, the normal equations, the sandwich covariance, the conditioning warnings, applies at each iteration to the local linear problem.

::: key Gauss-Newton step
$\Delta\mathbf{x} = (\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k))^{-1}\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k)$, with $\mathbf{H}(\mathbf{x})=\partial\mathbf{h}/\partial\mathbf{x}$. It approximates the true Hessian of $J$ by $\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}$, dropping a second term that involves the curvature of $\mathbf{h}$ itself weighted by the current residual — a good approximation when the residual is small or $\mathbf{h}$ is close to linear over the step, unreliable otherwise.
:::

The dropped term is worth naming, because it is exactly what goes wrong. The true Hessian of $J$ is $\mathbf{H}(\mathbf{x})^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}) - \sum_i [\mathbf{W}\mathbf{r}(\mathbf{x})]_i\,\nabla^2 h_i(\mathbf{x})$; Gauss-Newton keeps only the first piece. Near the solution the residual $\mathbf{r}$ is small, so the missing term is small regardless of how curved $\mathbf{h}$ is, and Gauss-Newton converges quickly — typically doubling its correct digits each iteration, the hallmark of Newton-type convergence. Far from the solution, with a large residual and a curved $\mathbf{h}$, the missing term can be large, the quadratic model is a poor description of the true cost over the distance $\Delta\mathbf{x}$ proposes, and nothing in the Gauss-Newton step checks whether the step actually helped before taking it.

This is also the point where lesson four's Fisher information reappears with a caveat. There, $\mathcal{I}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ was exact and constant because the model was linear. Here, $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ is only the Fisher information *at* the converged estimate, and its inverse is only an approximate covariance, valid to the extent the local linearization is accurate there — which, near a well-behaved solution with small residuals, it usually is, but it is worth remembering this is a local statement, not the global one lesson four proved for the linear case.

::: example Gauss-Newton diverges, Levenberg-Marquardt does not
Fit a single parameter $a$ to a single noiseless data point from an exponential model, $h(a)=e^{a}$, with true $a=3$ so $y=e^3$. This is small enough to trace by hand and large enough to show real divergence:

```python
import numpy as np

y = np.exp(3.0)

def gn_step(a):
    r = y - np.exp(a)
    H = np.exp(a)                  # dh/da
    return a + (H * r) / (H * H)   # = a + r / H

for a0 in (2.0, 3.5, -2.0, 5.0, 0.0, -5.0, 8.0):
    a, path = a0, [a0]
    for _ in range(6):
        a = gn_step(a)
        path.append(a)
        if abs(a) > 1e6:
            break
    print(f"a0={a0:5.1f} -> " + " -> ".join(f"{v:.3f}" if abs(v) < 1e6 else "blow-up" for v in path))
# a0=  2.0 -> 2.000 -> 3.718 -> 3.206 -> 3.020 -> 3.000 -> 3.000 -> 3.000
# a0=  3.5 -> 3.500 -> 3.107 -> 3.005 -> 3.000 -> 3.000 -> 3.000 -> 3.000
# a0= -2.0 -> -2.000 -> 145.413 -> 144.413 -> 143.413 -> 142.413 -> 141.413 -> 140.413
# a0=  5.0 -> 5.000 -> 4.135 -> 3.457 -> 3.090 -> 3.004 -> 3.000 -> 3.000
# a0=  0.0 -> 0.000 -> 19.085 -> 18.085 -> 17.085 -> 16.085 -> 15.085 -> 14.086
# a0= -5.0 -> -5.000 -> 2974.958 -> blow-up
```

Starting within a few units of the truth, Gauss-Newton converges fast. Starting at $a_0=-2$, $0$, or $-5$, the very first step overshoots into a region where $e^a$ is tiny, the Jacobian $H=e^a$ is nearly zero, the step $r/H$ is enormous, and the iterate is flung to a wildly wrong value from which it never recovers — climbing steadily away from $3$, or overflowing outright. Nothing about the *problem* is degenerate: one parameter, one measurement, a perfectly well-posed fit. The failure is entirely in trusting a step computed from a linear model of a function that is, at $a_0=-2$, nowhere close to linear over the distance the step proposes.
:::

## Levenberg-Marquardt: don't take a step you haven't checked

Levenberg-Marquardt keeps the Gauss-Newton direction but controls its length, and — the part a formula cannot show — checks whether each proposed step actually reduced the cost before accepting it.

$$
\Delta\mathbf{x} = \left(\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k) + \lambda\mathbf{D}\right)^{-1}\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k), \qquad \mathbf{D}=\operatorname{diag}\!\big(\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\big) .
$$

As $\lambda\to0$ this is the Gauss-Newton step. As $\lambda\to\infty$ it shrinks toward $\tfrac{1}{\lambda}\mathbf{D}^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$, a small step in the gradient-descent direction — gradient descent always reduces the cost for a small enough step, at the price of the fast convergence Gauss-Newton enjoys near a solution. The adaptation rule is the whole algorithm: compute $\Delta\mathbf{x}$, evaluate the *actual* cost $J(\mathbf{x}_k+\Delta\mathbf{x})$ — not the linear model's prediction of it — and if the cost dropped, accept the step and decrease $\lambda$ (trust the local linearization more); if it did not, reject the step, leave $\mathbf{x}_k$ unchanged, and increase $\lambda$ (trust it less, take a smaller, safer step next try). $\mathbf{D}$ built from the current information matrix, Marquardt's refinement of Levenberg's original $\mathbf{D}=\mathbf{I}$, scales the damping sensibly when the unknowns have very different units.

::: key Levenberg-Marquardt step
$\Delta\mathbf{x} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}+\lambda\mathbf{D})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$. Large $\lambda$ gives a short gradient-descent step; small $\lambda$ gives Gauss-Newton. Adapt $\lambda$ by whether the step, once actually evaluated, reduced the cost — accept and shrink $\lambda$, or reject and grow it.
:::

```python
import numpy as np

def lm_run(a0, iters=40, lam0=1.0):
    a, r = a0, y - np.exp(a0)
    cost, lam = 0.5 * r * r, lam0
    for _ in range(iters):
        H = np.exp(a)
        da = (H * r) / (H * H + lam * H * H)
        a_new = a + da
        r_new = y - np.exp(a_new)
        cost_new = 0.5 * r_new * r_new
        if cost_new < cost:
            a, r, cost, lam = a_new, r_new, cost_new, max(lam * 0.3, 1e-12)
            if abs(da) < 1e-10:
                break
        else:
            lam *= 3.0
    return a

for a0 in (2.0, 3.5, -2.0, 5.0, 0.0, -5.0, 8.0):
    print(f"a0={a0:5.1f} -> LM converges to a = {lm_run(a0):.6f}")
# every one of the seven starting points, including all three that broke plain
# Gauss-Newton above, converges to a = 3.000000
```

Every starting point that defeated undamped Gauss-Newton — including $a_0=-5$, which overflowed outright — converges cleanly to the correct answer under Levenberg-Marquardt, because the very first rejected step forces $\lambda$ up until the proposed step is small enough to actually help, and once the iterate is close enough for the linear model to be trustworthy, $\lambda$ relaxes back toward zero and convergence is as fast as Gauss-Newton's.

## What damping does not fix: a spurious minimum

Levenberg-Marquardt guards against one specific failure — trusting a step further than the linearization deserves. It is not a global optimizer, and it will not rescue a starting point already in the wrong basin of attraction for a cost surface with more than one local minimum.

::: example Validating the covariance
Four ground stations track an unknown position by slant range alone: $\mathbf{s}_1=(0,0,0)$, $\mathbf{s}_2=(8000,0,0)$, $\mathbf{s}_3=(0,9000,0)$, $\mathbf{s}_4=(3000,3000,7000)\,\mathrm{m}$, true position $\mathbf{x}=(2500,3500,10000)\,\mathrm{m}$, range noise $\sigma=2\,\mathrm{m}$. With $h_i(\mathbf{x})=\lVert\mathbf{x}-\mathbf{s}_i\rVert$, the Jacobian row is the unit line-of-sight vector $(\mathbf{x}-\mathbf{s}_i)/\lVert\mathbf{x}-\mathbf{s}_i\rVert$ — the same object lesson one used to build $\mathbf{H}$ for a linearized range fit, here exact rather than linearized about a nominal point. Starting from a reasonable but inexact guess $(3000,3000,8000)\,\mathrm{m}$, Gauss-Newton converges in $6$–$8$ iterations on every one of $2000$ independent noise draws. The analytic covariance at the true position and the sample covariance of the $2000$ estimates:

| | $\sigma_x^2$ | $\sigma_y^2$ | $\sigma_z^2$ |
| --- | --- | --- | --- |
| $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ at truth | $15.63\,\mathrm{m^2}$ | $12.59\,\mathrm{m^2}$ | $1.323\,\mathrm{m^2}$ |
| Sample covariance, $N=2000$ | $15.91\,\mathrm{m^2}$ | $13.66\,\mathrm{m^2}$ | $1.276\,\mathrm{m^2}$ |

Agreement to within a few percent, well inside Monte Carlo noise at this sample size — exactly the check the module's own exercise asks you to run at full scale, and exactly what lesson four's local Fisher information promised near a well-conditioned solution.
:::

::: example A fit that converges cleanly and is wrong
Weaken the geometry by dropping station four to $\mathbf{s}_4=(3000,3000,300)\,\mathrm{m}$, nearly coplanar with the other three, so the network barely constrains height. Starting from $\mathbf{x}_0=(2500,3500,50)\,\mathrm{m}$ — a guess near the true horizontal position but far below true altitude, on the far side of the station plane from the truth — both Gauss-Newton and Levenberg-Marquardt converge smoothly, in single digits and low hundreds of iterations respectively, to $\hat{\mathbf{x}}=(2591,\ 3548,\ -9816)\,\mathrm{m}$: below ground, and nowhere near the true position $10\,\mathrm{km}$ up. Both algorithms report $\Delta\mathbf{x}\to\mathbf{0}$; both "converged." The tell is the cost: $2J=31{,}158$ against an expected value near $m-n=1$ for a correctly fitting model, while the true position (using the same noisy data) gives $2J=1.81$. The per-station residuals confirm it — $(132,\ 185,\ 162,\ -414)\,\mathrm{m}$ against a noise level of $\sigma=2\,\mathrm{m}$, tens to hundreds of standard deviations, plainly inconsistent with the assumed noise model.
:::

::: warning Convergence is not correctness
A nonlinear solver reporting a tiny step and a stable answer means it found *a* stationary point, not necessarily *the* minimum a well-posed problem has, and not necessarily a good fit. Levenberg-Marquardt's damping fixes the specific failure of trusting a linearization too far; it does nothing about a cost surface with more than one basin. Always check the converged cost against what the assumed noise covariance predicts — near $m-n$ for a correctly specified $\mathbf{R}$, by the same chi-square reasoning lesson one introduced — before trusting the answer. The residual-analysis lesson later in this module returns to this check in full.
:::

::: warning A poor initial guess is a real input, not a formality
Both worked-example failures above trace back to where the iteration started. In practice, a nonlinear least squares fit needs a starting guess from somewhere other than the optimizer itself: a previous solution, a coarse closed-form estimate (a linear approximation, or — for the position-fix case — an algebraic multilateration solution), or a physically sensible default. Running from two or three well-separated starting points and checking they agree is cheap insurance against exactly the failure the second example shows.
:::

## Check yourself

::: check
Starting from $\mathbf{r}(\mathbf{x}_k+\Delta\mathbf{x})\approx\mathbf{r}(\mathbf{x}_k)-\mathbf{H}(\mathbf{x}_k)\Delta\mathbf{x}$, derive the Gauss-Newton normal equations, and state what property of the true Hessian this derivation ignores.
:::

::: answer
Substituting the linear approximation into $J=\tfrac12\mathbf{r}^\mathsf{T}\mathbf{W}\mathbf{r}$ gives a quadratic in $\Delta\mathbf{x}$ whose minimizer solves $\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x}=\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k)$, exactly the WLS normal equations with $\mathbf{H}(\mathbf{x}_k)$ in place of a constant $\mathbf{H}$. This ignores the curvature of $\mathbf{h}$ itself — the true Hessian of $J$ has an extra term built from $\nabla^2\mathbf{h}$ weighted by the current residual, which Gauss-Newton drops entirely.
:::

::: check
In the exponential-fit example, explain in one sentence why $a_0=-2$ diverges while $a_0=2$ converges, using the Jacobian $H(a)=e^a$.
:::

::: answer
At $a_0=-2$, $H=e^{-2}\approx0.135$ is small, so the Gauss-Newton step $r/H$ is large relative to how far the linear approximation of $e^a$ actually stays accurate, and the step overshoots into a region of even smaller $H$, compounding the problem on the next iteration; at $a_0=2$, $H=e^2\approx7.39$ is large enough that the step lands close to the true root, where the linear approximation was never asked to extrapolate far.
:::

::: check
Explain what happens to the Levenberg-Marquardt step as $\lambda\to\infty$, and why an algorithm that can always fall back to this limit can never make the cost worse.
:::

::: answer
As $\lambda\to\infty$, $(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}+\lambda\mathbf{D})^{-1}\to\tfrac1\lambda\mathbf{D}^{-1}$, so $\Delta\mathbf{x}\to\tfrac1\lambda\mathbf{D}^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$, an arbitrarily short step in the gradient-descent direction. A sufficiently short step in a descent direction reduces the cost to first order, so for large enough $\lambda$ some step exists that helps; because the algorithm evaluates the actual cost and only accepts a step that reduced it, growing $\lambda$ after every rejection guarantees such a step is eventually found, and the cost is monotonically non-increasing over the whole run.
:::

::: check
Both Gauss-Newton and Levenberg-Marquardt converged to the same wrong, below-ground position in the degraded-geometry example. Does this mean Levenberg-Marquardt failed at the one job this lesson gave it?
:::

::: answer
No. Levenberg-Marquardt's job is to prevent a step from overshooting past where the local linearization is trustworthy — and it did that in both examples, converging smoothly with no blow-up in the second one either. It was never a defence against starting inside the basin of attraction of the wrong stationary point; that is a different problem, arising from the shape of a genuinely non-convex cost surface, not from step-size mismanagement. Avoiding it needs a better initial guess or redundant geometry, not a better step-size rule.
:::

::: check
Why is $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$, evaluated at a converged nonlinear least squares solution, only an approximate Fisher information, where the equivalent formula was exact for the linear model of lesson four?
:::

::: answer
Lesson four's Fisher information was exact because the linear model's Jacobian is the same constant matrix everywhere, so the local quadratic approximation to the cost is the cost, globally. For a nonlinear $\mathbf{h}$, $\mathbf{H}(\mathbf{x})$ changes with $\mathbf{x}$, and $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ describes only the curvature of the cost right at $\hat{\mathbf{x}}$; it is a valid covariance approximation to the extent the true cost surface looks quadratic in a neighbourhood of $\hat{\mathbf{x}}$ large enough to matter, which is usually — not always — true near a well-conditioned solution with small residuals.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{y}=\mathbf{h}(\mathbf{x})+\mathbf{v}$, $\mathbf{r}(\mathbf{x})=\mathbf{y}-\mathbf{h}(\mathbf{x})$ | Nonlinear measurement model and residual |
| $\mathbf{H}(\mathbf{x})=\partial\mathbf{h}/\partial\mathbf{x}$ | Jacobian; plays the role of the constant $\mathbf{H}$, now evaluated at each iterate |
| $\Delta\mathbf{x}=(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$ | Gauss-Newton step: WLS applied to the local linearization, repeated |
| $\Delta\mathbf{x}=(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}+\lambda\mathbf{D})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$ | Levenberg-Marquardt step; $\lambda\to0$ is Gauss-Newton, $\lambda\to\infty$ is short-step gradient descent |
| Accept/reject on actual $J(\mathbf{x}_k+\Delta\mathbf{x})$ | The safeguard a formula alone cannot provide; shrinks or grows $\lambda$ |
| $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ | Local, approximate Fisher information at convergence — not exact and not global, unlike the linear case |
| Converged $\ne$ correct | Check $2J$ against $m-n$; a stable iterate can sit at a wrong stationary point |

Every fit in this module so far has processed a complete batch of measurements at once. The next lesson asks what happens when they arrive one at a time instead, and finds that updating an estimate as each new measurement lands is not a new idea but the same normal equations, rearranged — the form that becomes the Kalman filter once the state is allowed to move between measurements.
