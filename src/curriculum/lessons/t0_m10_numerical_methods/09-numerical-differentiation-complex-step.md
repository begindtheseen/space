---
id: l09-numerical-differentiation-complex-step
title: Numerical differentiation and complex-step derivatives
minutes: 28
covers:
  - numerical differentiation and complex-step derivatives
---

A Jacobian is the price of admission to almost everything a GNC engineer does numerically. The extended Kalman filter needs $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ to propagate its covariance and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ to form its gain. Newton's method for a targeting or trim problem needs $\mathbf{J}$ to take a step. The implicit ODE solvers of the stiffness lesson need $\partial\mathbf{f}/\partial\mathbf{y}$ to build $\mathbf{I} - h\beta\mathbf{J}$. A trajectory optimiser needs the gradient of the cost and the Jacobian of the constraints, and it needs them to enough accuracy that its convergence test means something.

Sometimes you can differentiate by hand. Often you cannot, or should not: the drag acceleration of a satellite depends on position through an atmospheric density model, through the Earth-rotation term in the relative velocity, and through the speed in a quadratic law, and the analytic Jacobian runs to a page of algebra that will be wrong the first time and will stay wrong until something else fails. The code changes, the hand derivative does not get updated, and the filter degrades in a way nobody traces for six months.

So you differentiate numerically. The standard way — a finite difference — has a defect that no amount of care removes: it subtracts two nearly equal numbers, and the floating-point lesson showed what that does. The result is that a finite-difference derivative loses about a third of your digits *at best*, and the step size that achieves that best is problem-dependent and impossible to choose in advance. The complex-step derivative has no subtraction anywhere and is accurate to the last bit. This lesson derives both, quantifies the loss, and sets out the restrictions that make the complex-step trick work — because they are real, and code that violates them returns a plausible, smooth, wrong answer rather than an error.

## Forward and central differences

Start from Taylor. For a smooth $f$,

$$
f(x + h) = f(x) + h f'(x) + \frac{h^2}{2}f''(x) + \frac{h^3}{6}f'''(x) + \cdots
$$

Rearranging gives the **forward difference**

$$
f'(x) \approx \frac{f(x+h) - f(x)}{h}, \qquad \text{truncation error} = -\frac{h}{2}f''(x) + O(h^2) .
$$

First order in $h$. Subtract the expansion of $f(x-h)$ from that of $f(x+h)$ instead: the even-order terms cancel, and

$$
f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}, \qquad \text{truncation error} = -\frac{h^2}{6}f'''(x) + O(h^4),
$$

the **central difference**, second order. Both say the same thing about truncation: make $h$ small and the error goes away.

That is where the trouble starts.

## The second error, and why the step cannot be made small

$f(x+h)$ and $f(x)$ are each computed with a relative error of about $\varepsilon$, so each carries an absolute error of about $\varepsilon|f|$. Their difference carries up to $2\varepsilon|f|$, and dividing by $h$ multiplies that by $1/h$. The total error of a forward difference is therefore

$$
E(h) \approx \underbrace{\frac{h}{2}|f''|}_{\text{truncation}} + \underbrace{\frac{2\varepsilon|f|}{h}}_{\text{round-off}} .
$$

The two terms pull in opposite directions. Differentiating and setting to zero gives the optimum:

$$
h^{*} = 2\sqrt{\frac{\varepsilon |f|}{|f''|}} \approx 2\sqrt{\varepsilon} = 3.0\times10^{-8},
\qquad E(h^{*}) \approx 2\sqrt{\varepsilon|f||f''|} \approx 3\times10^{-8}
$$

for a function whose value and second derivative are of order 1. Half your digits, gone. For the central difference the truncation term is $\frac{h^2}{6}|f'''|$ and the round-off term is $\varepsilon|f|/h$, giving

$$
h^{*} = \left(\frac{3\varepsilon|f|}{|f'''|}\right)^{1/3} \approx \varepsilon^{1/3} = 6.1\times10^{-6},
\qquad E(h^{*}) \approx \varepsilon^{2/3} = 3.7\times10^{-11} .
$$

A third of your digits, gone — about eleven significant figures out of sixteen, and that is the *best case*, achieved only if you happen to pick the right $h$.

::: key
A finite difference has two errors: truncation, which falls with $h$, and round-off from subtractive cancellation, which grows as $1/h$. For a central difference the optimum is $h \approx \varepsilon^{1/3} \approx 6\times10^{-6}$ in `float64`, giving about $\varepsilon^{2/3} \approx 4\times10^{-11}$ relative accuracy — you lose a third of your digits no matter what. A forward difference is worse: $h \approx \sqrt{\varepsilon} \approx 1.5\times10^{-8}$ and about $\sqrt{\varepsilon}$ accuracy, half the digits.
:::

::: example The V-shaped curve
Differentiate $f(x) = e^{x}$ at $x = 1$, where $f'(1) = 2.718281828459045$. Relative error against the step:

| $h$ | forward difference | central difference | complex step |
| --- | --- | --- | --- |
| $10^{-2}$ | $5.017\times10^{-3}$ | $1.667\times10^{-5}$ | $1.667\times10^{-5}$ |
| $10^{-4}$ | $5.000\times10^{-5}$ | $1.667\times10^{-9}$ | $1.667\times10^{-9}$ |
| $10^{-5}$ | $5.000\times10^{-6}$ | $2.155\times10^{-11}$ | $1.667\times10^{-11}$ |
| $10^{-6}$ | $4.999\times10^{-7}$ | $6.013\times10^{-11}$ | $1.666\times10^{-13}$ |
| $10^{-8}$ | $2.429\times10^{-9}$ | $2.429\times10^{-9}$ | $0$ |
| $10^{-10}$ | $5.694\times10^{-7}$ | $2.475\times10^{-7}$ | $1.634\times10^{-16}$ |
| $10^{-12}$ | $1.590\times10^{-4}$ | $7.735\times10^{-5}$ | $0$ |
| $10^{-14}$ | $3.435\times10^{-3}$ | $3.435\times10^{-3}$ | $0$ |
| $10^{-16}$ | $1$ | $1$ | $0$ |

The finite-difference columns come *down* the truncation branch, reach a minimum, and go back *up* the round-off branch — the V. The forward difference bottoms out near $h = 10^{-8}$ at $2.4\times10^{-9}$; the central difference bottoms out near $h = 10^{-5}$ to $10^{-6}$, with a best of about $6\times10^{-12}$ at $h = 3\times10^{-6}$ and typical values of $10^{-11}$ in that neighbourhood — the jitter is round-off, not a smooth curve. At $h = 10^{-16}$ both return exactly zero, because $x + h$ rounds back to $x$ and the numerator is an exact zero.

The last column does not have a V. It falls as $h^2$ until it hits machine precision at $h \approx 10^{-7}$, and then stays there — at $h = 10^{-200}$ the answer is still correctly rounded. That column is what the rest of this lesson is about.
:::

::: warning
Choosing the finite-difference step by the rule of thumb $h = \varepsilon^{1/3}$ assumes $|f|$ and $|f'''|$ are of order 1 *and* that $x$ is of order 1. Neither holds for a state vector. On an Earth-centred position of $7\times10^{6}\,\mathrm{m}$, an $h$ of $6\times10^{-6}\,\mathrm{m}$ is below the ulp of the coordinate, so $x + h$ rounds back to $x$ and the derivative comes out as zero. The correct scaling is relative: $h_j = \varepsilon^{1/3}\max(|x_j|, x_{j,\text{typ}})$, computed per component, with a typical magnitude supplied for components that can pass through zero. Even then, the optimum differs per component — position in metres and velocity in metres per second want different steps — and any single choice is a compromise.
:::

## The complex-step derivative

Take the step in an imaginary direction instead. If $f$ is analytic near $x$ and real-valued for real arguments, its Taylor series holds for a complex increment:

$$
f(x + ih) = f(x) + ih\,f'(x) + \frac{(ih)^2}{2}f''(x) + \frac{(ih)^3}{6}f'''(x) + \frac{(ih)^4}{24}f^{(4)}(x) + \cdots
$$

Use $i^2 = -1$, $i^3 = -i$, $i^4 = 1$ and separate real from imaginary:

$$
\begin{aligned}
\mathrm{Re}\,f(x+ih) &= f(x) - \frac{h^2}{2}f''(x) + \frac{h^4}{24}f^{(4)}(x) - \cdots, \\
\mathrm{Im}\,f(x+ih) &= h\,f'(x) - \frac{h^3}{6}f'''(x) + \cdots .
\end{aligned}
$$

Divide the second line by $h$:

$$
f'(x) = \frac{\mathrm{Im}\,f(x + ih)}{h} + \frac{h^2}{6}f'''(x) + O(h^4) .
$$

The truncation error is $O(h^2)$, the same as a central difference. The difference is everything else: **there is no subtraction**. $\mathrm{Im}\,f(x+ih)$ is a single computed quantity, carrying a relative error of about $\varepsilon$ *of itself*, and dividing by the exactly representable $h$ does not change that relative error. There is no cancellation to amplify anything, so there is no round-off branch and no lower limit on $h$.

Which means you take $h$ absurdly small. With $h = 10^{-200}$ the truncation term is $10^{-400}$ — it underflows to exactly zero — and what is left is the derivative to the last bit. In the table above, the complex-step column is exactly correct for every $h$ from $10^{-8}$ down to $10^{-300}$.

::: key
The complex-step derivative is $f'(x) \approx \mathrm{Im}\,f(x + ih)/h$. There is no subtraction, so no cancellation: $h$ can be $10^{-200}$ and the result is accurate to machine precision. It requires $f$ to be analytic and implemented in complex-safe code, with no `abs`, `max`, `min` or `conj`. As a bonus, $\mathrm{Re}\,f(x+ih) = f(x)$ to the same precision, so one complex evaluation returns both the value and the derivative.
:::

In code it is one line, and the function must accept complex input:

```python
def complex_step(f, x, h=1e-200):
    """f'(x) by the complex-step method. f must be analytic and complex-safe."""
    return f(complex(x, h)).imag / h


def central_diff(f, x, h):
    """Central finite difference: O(h^2) truncation plus O(eps/h) round-off."""
    return (f(x + h) - f(x - h)) / (2 * h)


if __name__ == "__main__":
    import cmath
    g = lambda z: cmath.exp(z) / cmath.sqrt(cmath.sin(z) ** 3 + cmath.cos(z) ** 3)
    print(complex_step(g, 1.5))          # 4.053427893898621
    print(g(complex(1.5, 1e-200)).real)  # 4.497780053946162  -- the value, free
```

That test function is deliberately awkward — an exponential over the square root of a sum of cubes of trigonometric functions — and its hand derivative is a mess. The complex step returns $4.05342789389862$; the best a central difference achieves over a sweep of every step from $10^{-16}$ to $10^{-2}$ is a relative error of $7.2\times10^{-12}$, at $h = 3\times10^{-6}$, and you would have to run the sweep to know that.

The choice of $h$ is not critical. Anything from about $10^{-10}$ to $10^{-250}$ gives a correctly rounded answer for a well-scaled function; $10^{-200}$ is the convention because it leaves enormous margin in both directions. The only way to get it wrong is to make $h$ so small that $h \cdot f'$ underflows to zero for a function whose derivative is itself tiny, or so large that the $h^2 f'''/6$ term matters.

## What "analytic" costs you

The derivation needs $f$ to be complex-differentiable — analytic — in a neighbourhood of $x$, and it needs the *code* to be the analytic continuation of the mathematical function. Most numerical code is, because it is built from arithmetic and the standard transcendental functions, all of which are analytic. But four constructs break it, and they are common:

- **`abs`**. In a complex language `abs(z)` returns the modulus $\sqrt{a^2+b^2}$, a real number, and the imaginary part is destroyed. Replace it with a branch on the real part: `z if z.real >= 0 else -z`.
- **`max`, `min`**. Same problem: they compare complex numbers, which most languages refuse to do or do on the modulus. Compare real parts and return the original complex value.
- **Norms**. This is the one that bites. A vector magnitude must be computed as $\sqrt{\sum v_k^2}$ using the complex square root, *not* as `abs(v)` or `hypot`. The distinction is invisible for real input and fatal for complex.
- **`conj`, and anything defined piecewise on the complex plane**. Conjugation is not analytic. Neither is a function selected by `if z.imag > 0`.

Comparisons and branch conditions on the *real* part are fine, as long as the branch taken with a tiny imaginary perturbation is the same one taken without it — which it is, since the perturbation is $10^{-200}$.

::: warning
A complex-step derivative through code that uses `abs` for a norm does not crash and does not return a NaN. It returns a smooth, plausible number that is wrong. In the drag Jacobian below, taking the speed as `abs(v_rel·v_rel)**0.5` instead of `sqrt(v_rel·v_rel)` gives $\partial a_y/\partial v_y = -7.2388\times10^{-10}$ against the correct $-1.4478\times10^{-9}$: exactly half, because the term coming from the derivative of the speed has been silently deleted. A filter built on it would run, converge and be wrong by a factor of two in its drag sensitivity. Always validate a complex-step Jacobian against a central difference once, at a loose tolerance: agreement to five or six digits proves the code is complex-safe, and the complex step then supplies the remaining ten.
:::

## A Jacobian you would not want to differentiate by hand

The drag acceleration on a low satellite, in an inertial frame:

$$
\mathbf{a}_{\text{drag}} = -\frac{1}{2}\,\rho(h)\,\frac{C_D A}{m}\,\lVert\mathbf{v}_{\text{rel}}\rVert\,\mathbf{v}_{\text{rel}},
\qquad
\mathbf{v}_{\text{rel}} = \mathbf{v} - \boldsymbol{\omega}_\oplus \times \mathbf{r},
\qquad
h = \lVert\mathbf{r}\rVert - R_\oplus .
$$

Position enters three times: through the altitude in the density model, through the Earth-rotation term in the relative velocity, and through the speed. This is the term in an orbit-determination filter's state Jacobian that is always wrong.

::: example The drag Jacobian three ways
Take a circular 300 km orbit: $\mathbf{r} = (6{,}678{,}137, 0, 0)\,\mathrm{m}$, $\mathbf{v} = (0, 7{,}725.76, 0)\,\mathrm{m/s}$, $\omega_\oplus = 7.2921159\times10^{-5}\,\mathrm{rad/s}$ about $\hat{\mathbf{z}}$, an exponential atmosphere $\rho = \rho_0 e^{-(h - h_0)/H}$ with $\rho_0 = 2.0\times10^{-11}\,\mathrm{kg/m^3}$ at $h_0 = 300\,\mathrm{km}$ and $H = 50\,\mathrm{km}$, and $C_D A/m = 0.01\,\mathrm{m^2/kg}$.

The co-rotating atmosphere removes $\omega_\oplus r = 486.98\,\mathrm{m/s}$ from the speed, leaving $\lVert\mathbf{v}_{\text{rel}}\rVert = 7{,}238.78\,\mathrm{m/s}$ and $\lVert\mathbf{a}_{\text{drag}}\rVert = 5.2400\times10^{-6}\,\mathrm{m/s^2}$. The analytic Jacobian, worked out by hand, has the row

$$
\frac{\partial a_y}{\partial(\mathbf{r},\mathbf{v})} =
\left(1.049055\times10^{-10},\ 0,\ 0,\ 0,\ -1.447757\times10^{-9},\ 0\right),
$$

in $\mathrm{s^{-2}}$ for the position columns and $\mathrm{s^{-1}}$ for the velocity columns. Compare the whole $3\times6$ matrix, worst element against the largest analytic element:

| Method | evaluations | worst relative error |
| --- | --- | --- |
| Complex step, $h = 10^{-200}$ | 6 complex | $1.4\times10^{-16}$ |
| Central difference, $h = 0.1$ | 12 real | $2.7\times10^{-10}$ |
| Central difference, $h = 1$ | 12 real | $4.8\times10^{-9}$ |
| Central difference, $h = 10$ | 12 real | $4.8\times10^{-7}$ |
| Central difference, $h = 10^{3}$ | 12 real | $4.7\times10^{-3}$ |
| Central difference, $h = 10^{-3}$ | 12 real | $1.1\times10^{-8}$ |

The complex step reproduces the hand-derived Jacobian to the last bit, with no step to choose. The central difference has an optimum near $h = 0.1$ — a tenth of a metre for the position columns and a tenth of a metre per second for the velocity columns, which happen to be near each other only by luck — and the error rises by four orders of magnitude if you guess $h$ two decades too large or three too small.
:::

The cost argument is better than people expect. For an $n$-state model, a forward difference needs $n+1$ evaluations, a central difference $2n$, and the complex step $n$ — one per column, each perturbing one component. Complex arithmetic costs more per evaluation: in the Python implementation above, a complex call to $\mathbf{a}_{\text{drag}}$ takes 1.39 times a real one, so the six complex evaluations cost about 8.3 real-equivalents against the central difference's 12. In compiled code the ratio is typically 2 to 3 for transcendental-heavy functions, which puts the complex step at roughly the cost of a central difference and ten orders of magnitude ahead on accuracy. You are not trading speed for precision; you are getting both.

## Where the trick stops

**Second derivatives.** $\mathrm{Re}\,f(x+ih) = f(x) - \frac{h^2}{2}f''$, so $f''$ can in principle be recovered as $2(f(x) - \mathrm{Re}\,f(x+ih))/h^2$ — but that is a subtraction of nearly equal numbers divided by $h^2$, which is cancellation again, worse than before. The complex step gives first derivatives only. For Hessians, use a second-order method built for it, or automatic differentiation.

**Non-analytic code.** Table lookups with interpolation are analytic within a cell but not across a knot, so the derivative of a linearly interpolated density is piecewise constant and the complex step will faithfully report the piecewise-constant value. A cubic spline is $C^2$ and differentiates cleanly, which is another reason the previous lesson's spline is preferable to linear interpolation in a model that will be linearised. Code with genuine discontinuities — a saturation limit, a mode switch, an `if thrust_on` branch — has no derivative at the switch, and no method invents one.

**Automatic differentiation.** Complex-step differentiation is forward-mode AD in disguise: the complex number $x + ih$ is a dual number $x + \varepsilon\, \dot{x}$ carried through the computation, with $i^2 = -1$ contributing the $O(h^2)$ error that a true dual number ($\varepsilon^2 = 0$) does not have. Proper AD is exact, gives second derivatives, and in reverse mode gives a whole gradient for the cost of one function evaluation — which is what a trajectory optimiser with thousands of variables needs. The complex step's advantage is that it needs no library, no operator overloading and no build changes: every serious language already has a complex type, and a Fortran or C++ propagator can often be made complex-safe by changing a type alias and fixing three `abs` calls.

**Flight software.** Most flight code ships an analytic Jacobian, because it is the fastest thing at run time and because complex arithmetic in a real-time loop is an unwelcome dependency. The complex step's job there is on the ground: it is the reference against which the hand-derived Jacobian is checked, element by element, every time the dynamics change. That test is cheap, it is exact to machine precision, and it catches the sign error that a central-difference comparison at $10^{-7}$ tolerance would let through as noise.

## Check yourself

::: check
A filter computes $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ by central differences with a fixed $h = 10^{-6}$ on a state whose position components are about $7\times10^{6}\,\mathrm{m}$. What goes wrong, and what is the fix?
:::

::: answer
At $7\times10^{6}$ the `float64` ulp is $2^{22-52} = 9.3\times10^{-10}\,\mathrm{m}$, so $h = 10^{-6}\,\mathrm{m}$ is only about a thousand ulps. The perturbation survives, but the relative perturbation is $1.4\times10^{-13}$, far below the $\varepsilon^{1/3}$ relative step of $6\times10^{-6}$ that the analysis calls for, so the difference is deep in the round-off branch: the numerator is dominated by rounding and the resulting $\mathbf{H}$ is noise at the level of a few percent. It is worse for tighter states — if the code were `float32`, the ulp at $7\times10^{6}$ is $0.5\,\mathrm{m}$ and $x+h$ rounds back to $x$, giving exactly zero. The fix is a relative step, $h_j = \varepsilon^{1/3}\max(|x_j|, x_{j,\text{typ}})$ per component, which for a position of $7\times10^{6}\,\mathrm{m}$ is about $42\,\mathrm{m}$; or, better, the complex step, which needs no scaling at all.
:::

::: check
The complex step's truncation error is $\frac{h^2}{6}|f'''|$, the same order as a central difference's. Why is only one of them limited to $\varepsilon^{2/3}$?
:::

::: answer
Because the limit is not truncation, it is round-off. A central difference subtracts $f(x+h)$ from $f(x-h)$, two numbers that agree to about $\log_{10}(|f|/h|f'|)$ digits; the subtraction is exact but it exposes the $\varepsilon|f|$ rounding already in each operand, and dividing by $2h$ scales that to $\varepsilon|f|/h$. Driving $h$ down to kill the truncation term drives the round-off term up, and the best compromise is $\varepsilon^{2/3}$. The complex step's numerator, $\mathrm{Im}\,f(x+ih)$, is not a difference of two things — it is one computed quantity with relative error $\varepsilon$ — so shrinking $h$ costs nothing, and the truncation term can be driven to $10^{-400}$ and vanish. Same truncation, no cancellation.
:::

::: check
You convert a drag model to complex-safe code and validate the complex-step Jacobian against a central difference at $h = 1$. The velocity columns agree to eight digits and the position columns agree to two. Is the code complex-safe?
:::

::: answer
Probably yes, and the discrepancy is the central difference, not the complex step. The position columns of this Jacobian are of order $10^{-10}\,\mathrm{s^{-2}}$ while the velocity columns are of order $10^{-9}\,\mathrm{s^{-1}}$, and a step of $1\,\mathrm{m}$ in position produces a change in acceleration of order $10^{-10}\,\mathrm{m/s^2}$ against an acceleration of $5\times10^{-6}$ — a relative change of $2\times10^{-5}$, so a central difference there has only about eleven digits to work with before cancellation, and the truncation term at $h=1\,\mathrm{m}$ is not small either. Re-run the check with a step chosen per column — the table in this lesson shows $h = 0.1$ is near the optimum here — and expect agreement to seven or eight digits. If the position columns are wrong by a clean factor such as exactly 2 or exactly 0, suspect an `abs` or a `hypot` in the altitude or norm computation instead.
:::

::: check
Complex-step differentiation of $f(x) = x^3$ at $x = 2$ with $h = 10^{-200}$: work the arithmetic through and say why the answer is exact.
:::

::: answer
$(2 + ih)^3 = 8 + 3\cdot4\cdot ih + 3\cdot2\cdot(ih)^2 + (ih)^3 = 8 - 6h^2 + i(12h - h^3)$. With $h = 10^{-200}$, $h^2 = 10^{-400}$ and $h^3 = 10^{-600}$ both underflow to exactly zero in `float64`, so the computed value is $8 + 12h\,i$ exactly. The imaginary part divided by $h$ is exactly 12, which is $f'(2) = 3x^2 = 12$. The underflow is not a nuisance here, it is the mechanism: it removes the truncation term completely rather than merely making it small. A central difference on the same function at any $h$ carries either a truncation term $h^2 f'''/6 = h^2$ or a round-off term, and cannot return exactly 12.
:::

::: check
A trajectory optimiser needs the gradient of a scalar cost with respect to 5,000 design variables. Would you use complex-step differentiation? What would you use?
:::

::: answer
No. The complex step, like any forward-mode method, costs one evaluation per *input*, so a 5,000-variable gradient costs 5,000 complex evaluations of the whole trajectory — prohibitive. Its cost scales with the number of columns of the Jacobian, which is fine for a $6\times6$ filter Jacobian and hopeless for a large gradient. What you want is reverse-mode automatic differentiation (or the equivalent adjoint method), which computes the gradient of one scalar with respect to all inputs for a small constant multiple — typically two to four — of the cost of a single function evaluation, independent of the number of variables. The complex step remains useful in that setting as a spot-check: pick a few components, verify the adjoint gradient against a complex-step value, and you have validated the adjoint implementation to machine precision.
:::

## Summary

| Item | Statement |
| --- | --- |
| Forward difference | $\dfrac{f(x+h)-f(x)}{h}$, truncation $-\frac{h}{2}f''$, order 1 |
| Central difference | $\dfrac{f(x+h)-f(x-h)}{2h}$, truncation $-\frac{h^2}{6}f'''$, order 2 |
| Total error | truncation $+$ round-off $\approx \frac{h^2}{6}\lvert f'''\rvert + \frac{\varepsilon\lvert f\rvert}{h}$ for the central difference |
| Optimal step | Central: $h \approx \varepsilon^{1/3} \approx 6\times10^{-6}$, accuracy $\approx \varepsilon^{2/3} \approx 4\times10^{-11}$. Forward: $h \approx \sqrt{\varepsilon}$, accuracy $\approx \sqrt{\varepsilon}$ |
| Scaling | Use $h_j = \varepsilon^{1/3}\max(\lvert x_j\rvert, x_{j,\text{typ}})$ per component; a fixed absolute $h$ fails on large states |
| Complex step | $f'(x) \approx \mathrm{Im}\,f(x+ih)/h$; truncation $O(h^2)$ but **no subtraction**, so no round-off floor |
| Step choice | $h = 10^{-200}$ is standard; anything from $10^{-10}$ down works |
| Bonus | $\mathrm{Re}\,f(x+ih) = f(x)$: one evaluation gives value and derivative |
| Restrictions | $f$ analytic and complex-safe: no `abs`, `max`, `min`, `conj`; norms as $\sqrt{\sum v_k^2}$, never `abs` or `hypot` |
| Failure mode | Non-complex-safe code returns a smooth wrong number, not an error — an `abs` norm halved a drag Jacobian element |
| Cost | $n$ complex evaluations for an $n$-column Jacobian, about the cost of a central difference's $2n$ real ones |
| Not for | Second derivatives (cancellation returns), genuinely discontinuous code, or large gradients (use reverse-mode AD) |
| In practice | Flight code ships an analytic Jacobian; the complex step is the ground-side reference that proves it correct to the last bit |

The next lesson takes the other side of calculus — the integral. Impulse from a thrust profile, heat load from a re-entry trajectory, and the expectation integrals inside a filter all reduce to evaluating $\int_a^b f\,dx$ from samples of $f$, and choosing where to place those samples is worth two extra orders of accuracy.
