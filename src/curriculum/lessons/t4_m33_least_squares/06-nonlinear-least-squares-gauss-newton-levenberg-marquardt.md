---
id: l06-nonlinear-least-squares-gauss-newton-levenberg-marquardt
title: "Nonlinear least squares: Gauss-Newton and Levenberg-Marquardt"
minutes: 24
covers:
  - "Nonlinear least squares: Gauss-Newton and Levenberg-Marquardt"
---

Stand in a dark, hilly field, and try to reach the lowest point. You cannot see the whole landscape. You can only feel the ground under your feet: which way it slopes, and how the slope is changing. So you guess where the bottom is from what you feel, walk there, feel again, and repeat. Most of the time you get closer with every stride. But if the ground curves in ways your feet could not sense, one confident stride can land you halfway up the next hill.

Every estimator so far in this module assumed the measurements depend on the unknowns through a fixed matrix, $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$. For those problems the bowl is a perfect bowl, and one step from anywhere lands at the bottom. Most measurements in navigation are not like that. A range to a beacon is the length of a position difference, $\lVert\mathbf{x}-\mathbf{s}\rVert$ — not a fixed matrix times $\mathbf{x}$. A star direction depends on attitude through a rotation matrix. A drag coefficient enters an orbit fit through an exponential model of the atmosphere. All of these have the form

$$
\mathbf{y}=\mathbf{h}(\mathbf{x})+\mathbf{v}
$$

for some **nonlinear** function $\mathbf{h}$, one whose graph is not a straight line or flat plane. Every GNSS position fix solves exactly this kind of problem, many times a second.

This lesson builds the two algorithms that fit such models. **Gauss-Newton** is the linear machinery of this module applied again and again — the "feel the ground and stride" method. **Levenberg-Marquardt** is the fix for the one thing that makes Gauss-Newton fail: the over-confident stride.

## The nonlinear least squares problem

Keep the same cost as before, with the linear $\mathbf{H}\mathbf{x}$ replaced by a general $\mathbf{h}(\mathbf{x})$. The **residual** — the part of the data the model fails to explain — and the cost are

$$
\mathbf{r}(\mathbf{x}) = \mathbf{y} - \mathbf{h}(\mathbf{x}), \qquad J(\mathbf{x}) = \tfrac12\,\mathbf{r}(\mathbf{x})^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}) .
$$

Here $\mathbf{W}$ is the weight matrix, usually $\mathbf{R}^{-1}$ as in lesson two. In general there is no formula for the lowest point. Setting the slope $\nabla J(\mathbf{x})$ to zero gives a nonlinear equation in $\mathbf{x}$, with no algebra to untangle it. So every method here is **iterative**: it repeats the same recipe.

1. Start from a guess $\mathbf{x}_k$ (read "x sub k", the guess after $k$ rounds).
2. Work out a correction $\Delta\mathbf{x}$ ("delta x", a small change).
3. Set $\mathbf{x}_{k+1}=\mathbf{x}_k+\Delta\mathbf{x}$.
4. Stop when $\Delta\mathbf{x}$ is too small to matter; otherwise go back to step 2.

The whole question is how to choose $\Delta\mathbf{x}$.

## Gauss-Newton: pretend it is linear, then repeat

The idea is to replace the curved function with its best straight-line imitation near the current guess — its **tangent**. For that you need the **[[Jacobian|jacobian]]**, the matrix of first derivatives of the model:

$$
\mathbf{H}(\mathbf{x}) = \frac{\partial\mathbf{h}}{\partial\mathbf{x}} .
$$

Row $i$, column $j$ says how much measurement $i$ changes when unknown $j$ is nudged. It uses the same letter as the constant measurement matrix of every earlier lesson, now evaluated at the current guess, because it plays exactly that role. For a linear model the Jacobian is just $\mathbf{H}$ everywhere.

A first-order **[[Taylor expansion|tangent-step]]** — the tangent-line approximation — of the residual about $\mathbf{x}_k$ is

$$
\mathbf{r}(\mathbf{x}_k+\Delta\mathbf{x}) \approx \mathbf{r}(\mathbf{x}_k) - \mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x} .
$$

The minus sign is there because $\mathbf{r}=\mathbf{y}-\mathbf{h}$: when $\mathbf{h}$ grows, the residual shrinks.

Now put this straight-line approximation into the cost. It becomes exactly the linear WLS problem of lesson two, in a new unknown $\Delta\mathbf{x}$. The "measurement" is the current residual $\mathbf{r}(\mathbf{x}_k)$, and the "measurement matrix" is the Jacobian $\mathbf{H}(\mathbf{x}_k)$. Its normal equations are

$$
\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x} = \mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k) .
$$

Solve them the way lesson one taught — QR on the weighted Jacobian, never an explicit inverse. Take the step. Work out the Jacobian again at the new point, and repeat. **Gauss-Newton is weighted least squares run in a loop**, nothing more. Every tool already built — the normal equations, the sandwich covariance, the warnings about conditioning — applies at each round to the local straight-line problem.

::: key Gauss-Newton step
$\Delta\mathbf{x} = (\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{r}$, where $\mathbf{r}=\mathbf{y}-\mathbf{h}(\mathbf{x}_k)$ and the bold $\mathbf{J} = \mathbf{H}(\mathbf{x}_k) = \partial\mathbf{h}/\partial\mathbf{x}$ is the Jacobian at the current guess (not the cost $J$). It approximates the Hessian of the cost by $\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{J}$, dropping the second-derivative term — fine near the solution, unreliable far from it.
:::

::: warning Mind the sign of the Jacobian
Some books and codes call $\mathbf{J}$ "the Jacobian of the residual". Since $\mathbf{r}=\mathbf{y}-\mathbf{h}$, that derivative is $-\mathbf{H}$, and plugging it into the step formula above flips the step backwards. Two consistent pairs work: $\mathbf{J}=\partial\mathbf{h}/\partial\mathbf{x}$ with $\mathbf{r}=\mathbf{y}-\mathbf{h}$, as here; or $\mathbf{J}=\partial\mathbf{r}/\partial\mathbf{x}$ with the step $-(\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{r}$. If your iteration marches steadily *away* from a good starting guess, check this sign first.
:::

### What Gauss-Newton leaves out

The "second-derivative term" in the key deserves a name, because it is exactly what goes wrong. The **[[Hessian|hessian]]** is the matrix of second derivatives of the cost — it describes the true shape of the bowl. The true Hessian of $J$ is

$$
\nabla^2 J(\mathbf{x}) = \mathbf{H}(\mathbf{x})^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}) - \sum_i [\mathbf{W}\mathbf{r}(\mathbf{x})]_i\,\nabla^2 h_i(\mathbf{x}),
$$

where $\nabla^2 h_i$ is the curvature of the $i$-th measurement function. Gauss-Newton keeps only the first piece.

Near the solution, the residual $\mathbf{r}$ is small, so the missing piece is small however curved $\mathbf{h}$ is. There Gauss-Newton converges fast — roughly doubling its number of correct digits every round, the mark of **[[Newton-type convergence|quadratic]]**. Far from the solution, with a large residual and a curved $\mathbf{h}$, the missing piece can be large. The bowl Gauss-Newton imagines is then a poor match for the real one over the distance of the step. And nothing in the step checks whether it actually helped before taking it.

::: note Why it has to be true
Write the cost as a sum, $J = \tfrac12\sum_{i,j} r_i W_{ij} r_j$, with $\mathbf{W}$ symmetric. Its gradient is $\nabla J = -\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$, because each $\partial r_i/\partial\mathbf{x} = -\nabla h_i$. Differentiate once more with the product rule. Differentiating the $\mathbf{H}^\mathsf{T}$ factor gives the curvature of each $h_i$, multiplied by the matching entry of $\mathbf{W}\mathbf{r}$, with a minus sign. Differentiating the $\mathbf{r}$ factor gives $-\mathbf{H}$, which turns $-\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$ into $+\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}$. So the Hessian is $\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H} - \sum_i[\mathbf{W}\mathbf{r}]_i\nabla^2h_i$. A full Newton step would solve $\nabla^2 J\,\Delta\mathbf{x} = -\nabla J$. Drop the second term and that is exactly the Gauss-Newton normal equation. The payoff: Gauss-Newton needs only first derivatives, which are far cheaper to write and compute than the second derivatives of every measurement.
:::

### The Fisher information returns, with a caveat

Lesson four found the Fisher information $\mathcal{I}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ exactly, and it did not depend on $\mathbf{x}$, because the model was linear. Here $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ is only the Fisher information *at* the final estimate. Its inverse is only an approximate covariance. It is good to the extent that the straight-line approximation is good near $\hat{\mathbf{x}}$. Near a well-behaved solution with small residuals it usually is. But it is a local statement, not the global one lesson four proved for the linear case.

::: example Gauss-Newton overshoots
Fit one unknown $a$ to one noiseless reading from the model $h(a)=e^{a}$. The true value is $a=3$, so the reading is $y=e^3 \approx 20.09$. This is small enough to follow by hand, and big enough to show real failure.

With one unknown and $W=1$, everything is a number. The residual is $r = y - e^a$, the Jacobian is $H = e^a$, and the Gauss-Newton step is $\Delta a = Hr/H^2 = r/H$.

**By hand from $a_0 = 2$.** $e^2 = 7.389$, so $r = 20.086 - 7.389 = 12.697$ and $\Delta a = 12.697/7.389 = 1.718$. The next guess is $3.718$ — past the answer, but not far. From there the tangent is steeper and the steps shrink toward $3$.

**By computer, from seven starting points:**

```python
import numpy as np

y = np.exp(3.0)                      # one noiseless reading; the true a is 3

def gn_step(a):
    r = y - np.exp(a)                # residual
    H = np.exp(a)                    # Jacobian dh/da
    return a + (H * r) / (H * H)     # the Gauss-Newton step, = a + r / H

for a0 in (2.0, 3.5, 5.0, 8.0, -2.0, 0.0, -5.0):
    a, path = a0, [f"{a0:.3f}"]
    for _ in range(6):
        if a > 700:                  # exp(a) would overflow a float
            path.append("overflow")
            break
        a = gn_step(a)
        path.append(f"{a:.3f}")
    print(f"a0={a0:5.1f}: " + " -> ".join(path))
# a0=  2.0: 2.000 -> 3.718 -> 3.206 -> 3.020 -> 3.000 -> 3.000 -> 3.000
# a0=  3.5: 3.500 -> 3.107 -> 3.005 -> 3.000 -> 3.000 -> 3.000 -> 3.000
# a0=  5.0: 5.000 -> 4.135 -> 3.457 -> 3.090 -> 3.004 -> 3.000 -> 3.000
# a0=  8.0: 8.000 -> 7.007 -> 6.025 -> 5.073 -> 4.199 -> 3.501 -> 3.107
# a0= -2.0: -2.000 -> 145.413 -> 144.413 -> 143.413 -> 142.413 -> 141.413 -> 140.413
# a0=  0.0: 0.000 -> 19.086 -> 18.086 -> 17.086 -> 16.086 -> 15.086 -> 14.086
# a0= -5.0: -5.000 -> 2974.958 -> overflow
```

**Good starts.** From $2$, $3.5$, $5$ or $8$, Gauss-Newton reaches $3.000$ in a handful of rounds.

**Bad starts.** From $-2$, $e^{-2} = 0.135$ is tiny, so the tangent is nearly flat. Following a nearly flat line up to $20.09$ takes a stride of $147$, and the guess lands at $145.4$. Up there $e^a$ is astronomically large, each step is almost exactly $-1$, and the guess crawls back one unit per round: it needs $147$ rounds in all. From $-5$ the stride lands at $2975$, where $e^a$ overflows a computer's numbers entirely.

**What went wrong.** Nothing about the *problem* is broken: one unknown, one clean reading, a perfectly sensible fit. The failure is in trusting a step computed from a straight-line model of a function that, at $a_0=-2$, is nowhere near straight over the distance the step proposes.
:::

## Levenberg-Marquardt: check the step before you take it

Levenberg-Marquardt keeps Gauss-Newton's direction but controls how far to go. And — the part no formula can show — it checks whether each proposed step really lowered the cost before accepting it. The step is

$$
\Delta\mathbf{x} = \left(\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k) + \lambda\mathbf{D}\right)^{-1}\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k), \qquad \mathbf{D}=\operatorname{diag}\!\big(\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\big) .
$$

The new number $\lambda$ ("lambda") is the **damping**: a knob for how cautious to be. The matrix $\mathbf{D}$ keeps only the diagonal of the information matrix.

Turn the knob to each end to see what it does.

- **$\lambda\to0$.** The extra term vanishes and this is the Gauss-Newton step: bold and fast.
- **$\lambda\to\infty$.** The $\lambda\mathbf{D}$ term swamps everything else, and the step shrinks toward $\tfrac{1}{\lambda}\mathbf{D}^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$. That is a short step straight downhill — **[[gradient descent|downhill]]**, with each unknown scaled by its own information. A short enough downhill step always lowers the cost, at the price of the speed Gauss-Newton has near the answer.

The rule for turning the knob is the whole algorithm.

1. Compute $\Delta\mathbf{x}$ with the current $\lambda$.
2. Evaluate the *actual* cost $J(\mathbf{x}_k+\Delta\mathbf{x})$ — not the straight-line model's prediction of it.
3. If the cost dropped, accept the step and decrease $\lambda$: trust the straight-line model more next time.
4. If it did not, reject the step, keep $\mathbf{x}_k$, and increase $\lambda$: trust it less and try a shorter, safer step.

Using $\mathbf{D}$ built from the information matrix was Marquardt's improvement on Levenberg's original choice, $\mathbf{D}=\mathbf{I}$. It scales the damping sensibly when the unknowns have very different units — meters and meters per second in one state, say.

::: key Levenberg-Marquardt step
$\Delta\mathbf{x} = (\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{J}+\lambda\mathbf{D})^{-1}\mathbf{J}^\mathsf{T}\mathbf{W}\mathbf{r}$, with $\mathbf{J}=\partial\mathbf{h}/\partial\mathbf{x}$ as before. Large $\lambda$ gives a short gradient-descent step; small $\lambda$ gives Gauss-Newton. Adapt $\lambda$ by whether the step, once actually evaluated, reduced the cost — accept and shrink $\lambda$, or reject and grow it.
:::

::: example Levenberg-Marquardt rescues the bad starts
Same problem, $h(a)=e^a$, $y=e^3$. Here $D = H^2$, so the damped step is $\Delta a = \dfrac{r}{H(1+\lambda)}$.

**By hand from $a_0=-2$, starting at $\lambda = 1$.** The starting cost is $\tfrac12 r^2 = \tfrac12(19.950)^2 = 199.0$, and the plain Gauss-Newton stride would be $r/H = 147.4$.

- $\lambda=1$: step $147.4/2 = 73.7$. The cost there is about $10^{62}$. Reject; $\lambda \to 3$.
- $\lambda=3$: step $147.4/4 = 36.9$. Cost about $10^{30}$. Reject; $\lambda \to 9$.
- $\lambda=9$: step $147.4/10 = 14.7$. Cost about $6\times10^{10}$. Reject; $\lambda \to 27$.
- $\lambda=27$: step $147.4/28 = 5.26$, landing at $a = 3.26$. Cost $18.5$, below $199.0$. Accept, and relax $\lambda$ to $8.1$.

From $3.26$ the straight-line model is trustworthy, $\lambda$ keeps shrinking, and the steps become Gauss-Newton steps.

**By computer:**

```python
import numpy as np

y = np.exp(3.0)

def cost(a):
    with np.errstate(over="ignore"):     # a huge trial step gives cost = inf
        r = y - np.exp(a)
    return 0.5 * r * r

def lm_run(a0, iters=100, lam=1.0):
    a = a0
    for _ in range(iters):
        H = np.exp(a)
        r = y - H
        da = (H * r) / (H * H + lam * H * H)   # D = H^T W H = H*H here
        if cost(a + da) < cost(a):             # did the step really help?
            a, lam = a + da, max(lam * 0.3, 1e-12)   # accept, trust more
            if abs(da) < 1e-10:
                break
        else:
            lam *= 3.0                         # reject, trust less
    return a

for a0 in (2.0, 3.5, 5.0, 8.0, -2.0, 0.0, -5.0):
    print(f"a0={a0:5.1f}: LM ends at a = {lm_run(a0):.6f}")
# every one of the seven starts ends at a = 3.000000
```

**Result.** Every start that defeated plain Gauss-Newton — including $a_0=-5$, which overflowed — reaches $3.000000$, in about ten to twenty rounds counting rejected tries. The first rejections force $\lambda$ up until the step is short enough to help. Once the guess is close enough for the straight line to be trusted, $\lambda$ relaxes toward zero and convergence is as fast as Gauss-Newton's.
:::

## Checking the covariance on a real fit

::: example Validating the covariance
Four ground stations measure slant range to an unknown point. The stations are at $\mathbf{s}_1=(0,0,0)$, $\mathbf{s}_2=(8000,0,0)$, $\mathbf{s}_3=(0,9000,0)$ and $\mathbf{s}_4=(3000,3000,7000)\,\mathrm{m}$. The true position is $\mathbf{x}=(2500,3500,10000)\,\mathrm{m}$, and the range noise is $\sigma=2\,\mathrm{m}$.

**The Jacobian.** With $h_i(\mathbf{x})=\lVert\mathbf{x}-\mathbf{s}_i\rVert$, row $i$ of the Jacobian is the unit line-of-sight vector $(\mathbf{x}-\mathbf{s}_i)/\lVert\mathbf{x}-\mathbf{s}_i\rVert$. It is the same object lesson one used for a range fit linearized about a fixed nominal point. Here it is recomputed at every round.

**The test.** Starting from a reasonable but inexact guess, $(3000,3000,8000)\,\mathrm{m}$, Gauss-Newton converges in five or six rounds on every one of $2000$ independent noise draws. Compare the covariance formula at the true position with the actual spread of the $2000$ estimates:

| | $\sigma_x^2$ | $\sigma_y^2$ | $\sigma_z^2$ |
| --- | --- | --- | --- |
| $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ at truth | $15.63\,\mathrm{m^2}$ | $12.59\,\mathrm{m^2}$ | $1.323\,\mathrm{m^2}$ |
| Sample covariance, $N=2000$ | $15.75\,\mathrm{m^2}$ | $12.78\,\mathrm{m^2}$ | $1.341\,\mathrm{m^2}$ |

**Sanity check.** They agree to within about $1.5\%$, well inside the random wobble of a $2000$-sample estimate (about $3\%$). That is the check the module's exercise asks you to run, and it is what lesson four's Fisher information promised near a well-conditioned solution. Height is the best-known coordinate here, because station four sits $7\,\mathrm{km}$ up and looks at the point from a very different angle.
:::

## What damping does not fix: the wrong valley

Levenberg-Marquardt guards against one failure: trusting a step further than the straight-line model deserves. It is not a search of the whole landscape. If the cost has more than one valley and you start in the wrong one, it will walk you smoothly to the bottom of the wrong valley. Each valley is a **[[basin of attraction|mirror]]**: the set of starting points that roll down into it.

::: example A fit that converges cleanly and is wrong
Move station four down to $\mathbf{s}_4=(3000,3000,300)\,\mathrm{m}$, nearly level with the other three. The first three stations all sit in the plane $z=0$. Any point and its mirror image through that plane are the same distance from all three. Only station four, just $300\,\mathrm{m}$ above the plane, can tell "above" from "below" — and only weakly.

Draw one set of noisy ranges and start from $\mathbf{x}_0=(2500,3500,50)\,\mathrm{m}$: near the true horizontal position, but almost on the plane, below the truth. Both methods converge smoothly — Gauss-Newton in $9$ rounds, Levenberg-Marquardt in $8$ — to

$$
\hat{\mathbf{x}}=(2595,\ 3549,\ -9815)\,\mathrm{m}.
$$

That is nearly $10\,\mathrm{km}$ *underground*, the mirror image of the truth. Both report $\Delta\mathbf{x}\to\mathbf{0}$; both "converged".

**The tell is the cost.** For a correct fit, $2J = \mathbf{r}^\mathsf{T}\mathbf{R}^{-1}\mathbf{r}$ should be about $m-n = 4-3 = 1$. Here it is about $61{,}700$. The true position, with the same noisy data, gives $2J = 0.45$. The residuals at the wrong answer are $(131,\ 184,\ 162,\ -412)\,\mathrm{m}$, against a noise level of $2\,\mathrm{m}$: tens to hundreds of sigmas, impossible under the assumed noise. Restart from $(2500, 3500, 5000)\,\mathrm{m}$ or $(0, 0, 20000)\,\mathrm{m}$, and Gauss-Newton lands on the right answer, $(2501, 3499, 10000)\,\mathrm{m}$, with $2J = 0.01$.
:::

::: warning Convergence is not correctness
A solver reporting a tiny step and a steady answer has found *a* flat spot, not necessarily the lowest one, and not necessarily a good fit. Levenberg-Marquardt's damping fixes over-trusting the straight-line model. It does nothing about a cost with more than one valley. Always compare the final cost with what the assumed noise predicts — $2J$ near $m-n$ for a correct $\mathbf{R}$, by the **[[chi-square|chi-square]]** reasoning lesson one introduced — before trusting the answer. The residual-analysis lesson later in this module returns to this check in full.
:::

::: warning A starting guess is a real input, not a formality
Both failures in this lesson trace back to where the iteration started. In practice a nonlinear fit needs a starting guess from somewhere other than the optimizer: a previous solution, a rough closed-form estimate (a linear approximation, or, for a position fix, an algebraic solution of the range equations), or a physically sensible default. Running from two or three well-separated starts and checking that they agree is cheap insurance against the wrong valley.
:::

## Check yourself

::: check
Starting from $\mathbf{r}(\mathbf{x}_k+\Delta\mathbf{x})\approx\mathbf{r}(\mathbf{x}_k)-\mathbf{H}(\mathbf{x}_k)\Delta\mathbf{x}$, derive the Gauss-Newton normal equations, and say what part of the true Hessian this ignores.
:::

::: answer
Put the approximation into $J=\tfrac12\mathbf{r}^\mathsf{T}\mathbf{W}\mathbf{r}$. The cost becomes $\tfrac12(\mathbf{r}_k-\mathbf{H}_k\Delta\mathbf{x})^\mathsf{T}\mathbf{W}(\mathbf{r}_k-\mathbf{H}_k\Delta\mathbf{x})$, a quadratic in $\Delta\mathbf{x}$ with the same shape as the WLS cost. Its gradient is $-\mathbf{H}_k^\mathsf{T}\mathbf{W}(\mathbf{r}_k-\mathbf{H}_k\Delta\mathbf{x})$. Setting it to zero gives $\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{H}(\mathbf{x}_k)\,\Delta\mathbf{x}=\mathbf{H}(\mathbf{x}_k)^\mathsf{T}\mathbf{W}\mathbf{r}(\mathbf{x}_k)$: the WLS normal equations with $\mathbf{H}(\mathbf{x}_k)$ in place of a constant $\mathbf{H}$.

It ignores the curvature of $\mathbf{h}$ itself. The true Hessian has an extra term, $-\sum_i[\mathbf{W}\mathbf{r}]_i\nabla^2 h_i$, built from the second derivatives of $\mathbf{h}$ weighted by the current residual. Gauss-Newton drops it entirely.
:::

::: check
In the exponential fit, explain why $a_0=-2$ goes wrong while $a_0=2$ works, using the Jacobian $H(a)=e^a$.
:::

::: answer
At $a_0=-2$, $H=e^{-2}\approx0.135$ is tiny, so the step $r/H$ is huge — $147$ — far beyond the range over which the tangent line imitates $e^a$ well. The guess is flung to $145$ and must crawl back one unit per round.

At $a_0=2$, $H=e^2\approx7.39$ is large enough that the step, $1.72$, lands close to the true answer. The tangent line was never asked to stretch far.
:::

::: check
What happens to the Levenberg-Marquardt step as $\lambda\to\infty$? Why does an algorithm that can always fall back on this limit never make the cost worse?
:::

::: answer
As $\lambda$ grows, $(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}+\lambda\mathbf{D})^{-1}$ behaves like $\tfrac1\lambda\mathbf{D}^{-1}$. So $\Delta\mathbf{x}\to\tfrac1\lambda\mathbf{D}^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$: a very short step in a downhill direction. (It is downhill because $\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r} = -\nabla J$, and $\mathbf{D}^{-1}$ has positive entries.)

A short enough step downhill always lowers the cost. The algorithm evaluates the actual cost and accepts only steps that lowered it, and it grows $\lambda$ after each rejection. So a helpful step is always found eventually, and the cost never goes up over the whole run.
:::

::: check
A slant range is measured from a station at $\mathbf{s}=(0,0,0)$ to a point guessed to be at $\mathbf{x}_k=(3000, 4000, 0)\,\mathrm{m}$. Write the Jacobian row for this measurement. If the measured range is $5010\,\mathrm{m}$, what single Gauss-Newton step does this one measurement suggest along its line of sight?
:::

::: answer
The predicted range is $\lVert(3000,4000,0)\rVert = \sqrt{3000^2+4000^2} = 5000\,\mathrm{m}$. The Jacobian row is the unit line-of-sight vector, $(3000, 4000, 0)/5000 = (0.6,\ 0.8,\ 0)$.

The residual is $r = 5010 - 5000 = 10\,\mathrm{m}$. With one measurement the full normal matrix cannot be inverted (one equation, three unknowns), but along the line of sight the step is $r$ divided by the length of the Jacobian row, which is $1$. So it suggests moving $10\,\mathrm{m}$ outward along $(0.6, 0.8, 0)$: to $(3006, 4008, 0)\,\mathrm{m}$. The other two directions need the other stations.
:::

::: check
Both methods converged to the same underground position in the low-station example. Does that mean Levenberg-Marquardt failed at its one job?
:::

::: answer
No. Its job is to stop a step from overshooting past where the straight-line model is trustworthy. It did that: it converged smoothly, with no blow-up. It was never a defense against starting in the valley of the wrong solution. That comes from the shape of a cost with more than one valley — here created by the near-mirror symmetry of the station layout — not from step-size trouble. The fix is a better starting guess or better station geometry, not a better damping rule.
:::

::: check
Why is $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$, evaluated at a converged nonlinear solution, only an approximate Fisher information, when the same formula was exact in lesson four?
:::

::: answer
In lesson four the Jacobian was the same constant matrix everywhere, so the quadratic bowl *was* the cost, everywhere. For a nonlinear $\mathbf{h}$, $\mathbf{H}(\mathbf{x})$ changes with $\mathbf{x}$, and $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ describes only the curvature right at $\hat{\mathbf{x}}$. It is a good covariance to the extent the true cost looks like a bowl over a region as wide as the estimate's scatter. Near a well-conditioned solution with small residuals that is usually — not always — true.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{y}=\mathbf{h}(\mathbf{x})+\mathbf{v}$, $\mathbf{r}(\mathbf{x})=\mathbf{y}-\mathbf{h}(\mathbf{x})$ | Nonlinear measurement model and residual |
| $\mathbf{H}(\mathbf{x})=\partial\mathbf{h}/\partial\mathbf{x}$ (the flashcards' $\mathbf{J}$) | Jacobian; plays the role of the constant $\mathbf{H}$, recomputed at each guess |
| $\Delta\mathbf{x}=(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$ | Gauss-Newton step: WLS on the straight-line approximation, repeated |
| $\nabla^2 J = \mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H} - \sum_i[\mathbf{W}\mathbf{r}]_i\nabla^2 h_i$ | True Hessian; Gauss-Newton drops the second term |
| $\Delta\mathbf{x}=(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}+\lambda\mathbf{D})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{r}$ | Levenberg-Marquardt step; $\lambda\to0$ is Gauss-Newton, $\lambda\to\infty$ is a short downhill step |
| Accept or reject on the actual $J(\mathbf{x}_k+\Delta\mathbf{x})$ | The safeguard: shrink $\lambda$ after a good step, grow it after a bad one |
| $\mathbf{H}(\hat{\mathbf{x}})^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}(\hat{\mathbf{x}})$ | Local, approximate Fisher information at the answer |
| Converged $\ne$ correct | Check $2J$ against $m-n$; a steady answer can sit in the wrong valley |

Every fit in this module so far has processed a whole batch of measurements at once. The next lesson asks what happens when they arrive one at a time, and finds that updating an estimate as each measurement lands is the same normal equations, rearranged — the form that becomes the Kalman filter once the state is allowed to move.

::: context jacobian A table of nudges
The Jacobian is named after Carl Gustav Jacobi, a German mathematician of the early 1800s. Think of it as a table. Each row is one measurement, each column one unknown, and each entry answers: "if I nudge this unknown a little, how much does this measurement move?" For a range, the row is the unit vector pointing from the station to the point: move sideways and the range barely changes; move straight away and it changes one-for-one. Engineers either derive Jacobians by hand or let software compute them, and a wrong Jacobian is one of the most common reasons a fit refuses to converge.
:::

::: context tangent-step Following the tangent line
Gauss-Newton replaces the curve with its tangent line at the current guess and jumps to where that line meets the target. Below, the curve is $h(a)=e^a$ and the target is $e^3 \approx 20.1$. From the guess $a = 2$ the tangent reaches the target at $3.72$ — past the truth at $3$, but close. From $a = -2$ the tangent is almost flat, and the same rule would jump all the way to $145$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polyline points="40.0,153.8 42.8,153.3 45.7,152.8 48.5,152.3 51.4,151.8 54.2,151.3 57.1,150.7 59.9,150.2 62.8,149.6 65.6,149.0 68.5,148.4 71.3,147.8 74.2,147.1 77.0,146.5 79.9,145.8 82.7,145.1 85.6,144.4 88.4,143.6 91.3,142.9 94.1,142.1 97.0,141.3 99.8,140.5 102.7,139.6 105.5,138.7 108.4,137.8 111.2,136.9 114.1,135.9 116.9,135.0 119.7,133.9 122.6,132.9 125.4,131.8 128.3,130.7 131.1,129.6 134.0,128.4 136.8,127.2 139.7,126.0 142.5,124.7 145.4,123.4 148.2,122.1 151.1,120.7 153.9,119.3 156.8,117.8 159.6,116.3 162.5,114.7 165.3,113.1 168.2,111.5 171.0,109.8 173.9,108.1 176.7,106.3 179.6,104.4 182.4,102.5 185.3,100.6 188.1,98.6 190.9,96.5 193.8,94.4 196.6,92.2 199.5,90.0 202.3,87.7 205.2,85.3 208.0,82.8 210.9,80.3 213.7,77.7 216.6,75.1 219.4,72.3 222.3,69.5 225.1,66.6 228.0,63.6 230.8,60.5 233.7,57.4 236.5,54.1 239.4,50.8 242.2,47.3 245.1,43.8 247.9,40.1 250.8,36.4 253.6,32.5 256.5,28.5 259.3,24.4 262.2,20.2 265.0,15.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40.0" y1="170.0" x2="340.0" y2="170.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40.0" y1="170.0" x2="40.0" y2="20.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40.0" y1="50.0" x2="340.0" y2="50.0" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <text x="44.0" y="45.0" font-size="11" fill="#6c7a93" text-anchor="start">target y = e³ ≈ 20.1</text>
  <line x1="80.0" y1="152.3" x2="311.8" y2="50.0" stroke="#b4232c" stroke-width="2"/>
  <circle cx="140.0" cy="125.9" r="4" fill="#b4232c"/>
  <circle cx="311.8" cy="50.0" r="4" fill="#b4232c"/>
  <circle cx="240.0" cy="50.0" r="4" fill="#1d6fd1"/>
  <line x1="40.0" y1="170.0" x2="40.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40.0" y="188.0" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <line x1="140.0" y1="170.0" x2="140.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140.0" y="188.0" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <line x1="240.0" y1="170.0" x2="240.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="240.0" y="188.0" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <line x1="340.0" y1="170.0" x2="340.0" y2="175.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340.0" y="188.0" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="146.0" y="141.9" font-size="11" fill="#b4232c" text-anchor="start">guess a = 2</text>
  <text x="348.0" y="40.0" font-size="11" fill="#b4232c" text-anchor="end">next guess 3.72</text>
  <text x="226.0" y="40.0" font-size="11" fill="#1d6fd1" text-anchor="end">truth 3</text>
</svg>
```
:::

::: context hessian The shape of the bowl
The Hessian, named after the German mathematician Otto Hesse, is the table of second derivatives: how the slope itself changes as you move. For a cost it describes the bowl's shape — steep sides, gentle sides, or a saddle. Newton's method uses the full Hessian to jump straight to the bottom of the imagined bowl. Gauss-Newton builds its bowl from first derivatives only, $\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}$, which is always bowl-shaped and never a saddle. That is a real advantage, bought by ignoring curvature.
:::

::: context quadratic Digits that double
Near the answer, Gauss-Newton's error each round is roughly proportional to the *square* of the previous error. Suppose the error is $0.01$; next round it is around $0.0001$, then $0.00000001$. The number of correct digits roughly doubles each time. You can see it in the run from $a_0 = 3.5$: the errors go $0.5$, $0.107$, $0.005$, then too small to show. This fast finish holds for small-residual problems like these; when the fit leaves large residuals, the convergence slows to a steady, one-digit-at-a-time pace.
:::

::: context downhill Walking straight downhill
Gradient descent means stepping in the direction the ground slopes down most steeply. It is safe but slow: along a long, narrow valley it zigzags from wall to wall. Kenneth Levenberg proposed blending it with Gauss-Newton in 1944, and Donald Marquardt refined the blend in 1963. Their method is now built into nearly every curve-fitting tool, including the least-squares routines in SciPy and MATLAB, and into orbit-determination software.
:::

::: context mirror Two points the stations cannot tell apart
Three stations sitting in one flat plane measure exactly the same ranges to a point above the plane and to its mirror image below it. A fourth station lifted only $300\,\mathrm{m}$ breaks the tie, but weakly, so the cost has two valleys: a deep one at the truth and a shallow one at the mirror point. Start near the plane on the wrong side and the solver rolls into the shallow valley. GNSS has a milder version of the same trap, which is why receivers use satellites spread across the whole sky.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="105.0" x2="340.0" y2="105.0" stroke="#1f2a44" stroke-width="2"/>
  <text x="336.0" y="122.0" font-size="11" fill="#1f2a44" text-anchor="end">plane of stations 1–3</text>
  <line x1="60.0" y1="105.0" x2="126.7" y2="25.0" stroke="#8fb8f0" stroke-width="1.5"/>
  <line x1="60.0" y1="105.0" x2="126.7" y2="183.5" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="273.3" y1="105.0" x2="126.7" y2="25.0" stroke="#8fb8f0" stroke-width="1.5"/>
  <line x1="273.3" y1="105.0" x2="126.7" y2="183.5" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <rect x="55.0" y="100" width="10" height="10" fill="#1f2a44"/>
  <rect x="268.3" y="100" width="10" height="10" fill="#1f2a44"/>
  <rect x="135.0" y="97.6" width="10" height="10" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="126.7" cy="25.0" r="6" fill="#1d6fd1"/>
  <circle cx="126.7" cy="183.5" r="6" fill="#b4232c"/>
  <text x="138.7" y="29.0" font-size="11" fill="#1d6fd1" text-anchor="start">true point, 10 km up</text>
  <text x="138.7" y="187.5" font-size="11" fill="#b4232c" text-anchor="start">mirror point, about 9.8 km down</text>
  <text x="150.0" y="94.6" font-size="11" fill="#1f2a44" text-anchor="start">station 4, 300 m up</text>
  <text x="20.0" y="200.0" font-size="11" fill="#6c7a93" text-anchor="start">side view</text>
</svg>
```
:::

::: context chi-square How big should the cost be?
If the model is right and $\mathbf{R}$ is right, each weighted residual behaves like a standard bell-curve number, and the sum of their squares follows a chi-square distribution. After fitting $n$ unknowns to $m$ measurements, $2J$ averages about $m-n$ and rarely strays more than a few times $\sqrt{2(m-n)}$ above it. With $m - n = 1$, a value of $61{,}700$ is not bad luck. It is a wrong answer, a wrong model, or a wrong $\mathbf{R}$.
:::
