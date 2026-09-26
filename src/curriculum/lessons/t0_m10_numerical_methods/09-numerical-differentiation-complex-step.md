---
id: l09-numerical-differentiation-complex-step
title: Numerical differentiation and complex-step derivatives
minutes: 22
covers:
  - numerical differentiation and complex-step derivatives
---

How steep is a hill? Stand at one spot, walk a few steps, and see how much you climbed. Climb divided by distance is the slope. That is a **derivative** measured the simple way — and this lesson is about what goes wrong when a computer does exactly that, and a strange, beautiful trick that fixes it.

A GNC engineer needs derivatives constantly, usually packed into a **[[Jacobian|jacobian]]**: the table of how every output changes when every input changes. The **[[extended Kalman filter|ekf]]** needs $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ to carry its uncertainty forward and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ to weigh a measurement. Newton's method for targeting needs $\mathbf{J}$ to take a step. The stiff solvers of two lessons ago need $\partial\mathbf{f}/\partial\mathbf{y}$ to build $\mathbf{I} - h\beta\mathbf{J}$. A trajectory optimizer needs gradients accurate enough that its "converged" test means something.

Sometimes you can differentiate by hand. Often you should not. A satellite's drag depends on position through the density model, through Earth's rotation in the relative velocity, and through the speed. The hand Jacobian runs a page, is wrong the first time, and stays wrong once the code changes and nobody updates it. So you differentiate numerically. The usual way, a finite difference, subtracts two nearly equal numbers, and the floating-point lesson showed what that does: at best you lose about a third of your digits. The complex-step derivative has no subtraction at all and is accurate to the last bit — provided the code obeys some rules, because code that breaks them returns a smooth, plausible, *wrong* answer rather than an error.

## Forward and central differences

Start from the **[[Taylor series|taylor]]**. For a smooth $f$ and a small step $h$,

$$
f(x + h) = f(x) + h f'(x) + \frac{h^2}{2}f''(x) + \frac{h^3}{6}f'''(x) + \cdots
$$

Subtract $f(x)$ and divide by $h$. That gives the **forward difference** — the walk-a-few-steps slope — and the first term left over is its **truncation error**, the error from chopping off the series:

$$
f'(x) \approx \frac{f(x+h) - f(x)}{h}, \qquad \text{truncation error} = -\frac{h}{2}f''(x) + O(h^2) .
$$

It is first order in $h$. Now write the same series for $f(x-h)$, where the odd powers of $h$ flip sign, and subtract it from the one for $f(x+h)$. The $f(x)$ and $f''$ terms cancel, and dividing by $2h$ gives the **central difference**, which looks a step each way:

$$
f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}, \qquad \text{truncation error} = -\frac{h^2}{6}f'''(x) + O(h^4) .
$$

That is second order. Both formulas say the same thing about truncation: shrink $h$ and the error goes away.

That is where the trouble starts.

## The second error, and why the step cannot be tiny

Measure a hill's slope over one millimeter with a tape measure marked in centimeters and you get nonsense: the measuring error swamps the climb. A computer has the same problem. Every stored number carries a relative error of about **machine epsilon**, $\varepsilon = 2.2\times10^{-16}$ in `float64` ("epsilon", from the floating-point lesson).

So $f(x+h)$ and $f(x)$ each carry an absolute error of about $\varepsilon|f|$. Their difference can be off by up to $2\varepsilon|f|$, and dividing by $h$ scales that by $1/h$. The forward difference's total error is therefore

$$
E(h) \approx \underbrace{\frac{h}{2}|f''|}_{\text{truncation}} + \underbrace{\frac{2\varepsilon|f|}{h}}_{\text{round-off}} .
$$

The two pull opposite ways. Shrinking $h$ cuts truncation and inflates round-off. The best $h$ is where the slope of $E$ is zero: $\frac12|f''| = 2\varepsilon|f|/h^2$. That gives

$$
h^{*} = 2\sqrt{\frac{\varepsilon |f|}{|f''|}} \approx 2\sqrt{\varepsilon} = 3.0\times10^{-8},
\qquad E(h^{*}) \approx 2\sqrt{\varepsilon|f||f''|} \approx 3\times10^{-8}
$$

for a function whose value and second derivative are about 1. Half your sixteen digits, gone.

For the central difference, truncation is $\frac{h^2}{6}|f'''|$ and round-off is $2\varepsilon|f|/(2h) = \varepsilon|f|/h$. Setting the slope to zero, $\frac{h}{3}|f'''| = \varepsilon|f|/h^2$, gives

$$
h^{*} = \left(\frac{3\varepsilon|f|}{|f'''|}\right)^{1/3} \approx \varepsilon^{1/3} = 6.1\times10^{-6},
\qquad E(h^{*}) \approx \varepsilon^{2/3} = 3.7\times10^{-11} .
$$

A third of your digits gone: about eleven good figures out of sixteen. And that is the *best* case, reached only if you happen to pick the right $h$.

::: key Finite differences
A finite difference has two errors: truncation, which falls with $h$, and round-off from subtractive cancellation, which grows as $1/h$. For a central difference the optimum is $h \approx \varepsilon^{1/3} \approx 6\times10^{-6}$ in `float64`, giving about $\varepsilon^{2/3} \approx 4\times10^{-11}$ relative accuracy — you lose a third of your digits no matter what. A forward difference is worse: $h \approx \sqrt{\varepsilon} \approx 1.5\times10^{-8}$ and about $\sqrt{\varepsilon}$ accuracy, half the digits.
:::

::: example The V-shaped curve
Differentiate $f(x) = e^{x}$ at $x = 1$, where the exact answer is $f'(1) = e = 2.718281828459045$. Relative error against the step:

| $h$ | forward difference | central difference | complex step |
| --- | --- | --- | --- |
| $10^{-2}$ | $5.017\times10^{-3}$ | $1.667\times10^{-5}$ | $1.667\times10^{-5}$ |
| $10^{-4}$ | $5.000\times10^{-5}$ | $1.667\times10^{-9}$ | $1.667\times10^{-9}$ |
| $10^{-5}$ | $5.000\times10^{-6}$ | $2.155\times10^{-11}$ | $1.667\times10^{-11}$ |
| $10^{-6}$ | $4.999\times10^{-7}$ | $6.013\times10^{-11}$ | $1.666\times10^{-13}$ |
| $10^{-8}$ | $2.429\times10^{-9}$ | $2.429\times10^{-9}$ | $0$ |
| $10^{-10}$ | $5.694\times10^{-7}$ | $2.475\times10^{-7}$ | $1.1\times10^{-16}$ |
| $10^{-12}$ | $1.590\times10^{-4}$ | $7.735\times10^{-5}$ | $0$ |
| $10^{-14}$ | $3.435\times10^{-3}$ | $3.435\times10^{-3}$ | $0$ |
| $10^{-16}$ | $1$ | $1$ | $0$ |

Read the finite-difference columns top to bottom. They come *down* the truncation side, reach a lowest point, and climb back *up* the round-off side: the **[[V|v-curve]]**. The forward difference bottoms out near $h = 10^{-8}$ at $2.4\times10^{-9}$. The central difference bottoms out between $h = 10^{-6}$ and $10^{-5}$, around $10^{-11}$, jumping about from one $h$ to the next because round-off is not smooth. At $h = 10^{-16}$ both return exactly zero: $x + h$ rounds back to $x$, so the top is exactly zero and the relative error is 1.

The last column has no V. It falls as $h^2$ until it reaches machine precision near $h = 10^{-7}$, then stays there. At $h = 10^{-200}$ the answer is still correctly rounded. That column is what the rest of this lesson is about.
:::

::: warning Scale the step to the variable
The rule $h = \varepsilon^{1/3}$ assumes $|f|$, $|f'''|$ *and* $x$ are all about 1. None holds for a state vector. On an Earth-centered position of $7\times10^{6}\,\mathrm{m}$, a step of $6\times10^{-6}\,\mathrm{m}$ is only a few **[[ulps|ulp]]** of the coordinate — the perturbation is mostly rounding. Use a relative step, $h_j = \varepsilon^{1/3}\max(|x_j|, x_{j,\text{typ}})$, for each component $j$, where $x_{j,\text{typ}}$ is a typical size you supply for components that can pass through zero. Even then, position in meters and velocity in meters per second want different steps, and any single choice is a compromise.
:::

## The complex-step derivative

Here is the trick. Instead of stepping *along* the number line, step *sideways*, into the imaginary direction. Recall that $i$ is the number with $i^2 = -1$, and a **complex number** $a + ib$ has a real part $a$ and an imaginary part $b$. If $f$ is **[[analytic|analytic]]** near $x$ — smooth in the complex sense, so its Taylor series works for complex steps too — and gives real answers for real inputs, then

$$
f(x + ih) = f(x) + ih\,f'(x) + \frac{(ih)^2}{2}f''(x) + \frac{(ih)^3}{6}f'''(x) + \frac{(ih)^4}{24}f^{(4)}(x) + \cdots
$$

Use $i^2 = -1$, $i^3 = -i$, $i^4 = 1$, and sort the terms into real and imaginary:

$$
\begin{aligned}
\mathrm{Re}\,f(x+ih) &= f(x) - \frac{h^2}{2}f''(x) + \frac{h^4}{24}f^{(4)}(x) - \cdots, \\
\mathrm{Im}\,f(x+ih) &= h\,f'(x) - \frac{h^3}{6}f'''(x) + \cdots .
\end{aligned}
$$

($\mathrm{Re}$ and $\mathrm{Im}$ mean "real part of" and "imaginary part of".) The derivative sits alone in the imaginary part. Divide the second line by $h$:

$$
f'(x) = \frac{\mathrm{Im}\,f(x + ih)}{h} + \frac{h^2}{6}f'''(x) + O(h^4) .
$$

The truncation error is $O(h^2)$, the same as a central difference. Everything else is different, because **there is no subtraction**. $\mathrm{Im}\,f(x+ih)$ is one computed number with a relative error of about $\varepsilon$ of *itself*. Dividing by $h$ does not change that. With no cancellation there is no round-off side of the V, and no lower limit on $h$.

So take $h$ absurdly small. With $h = 10^{-200}$ the truncation term is about $10^{-400}$, which **[[underflows|underflow]]** to exactly zero, and what is left is the derivative to the last bit. In the table above, the complex-step column is correct to within one rounding for every $h$ from $10^{-8}$ down to $10^{-300}$.

::: key Complex step
The complex-step derivative is $f'(x) \approx \mathrm{Im}\,f(x + ih)/h$. There is no subtraction, so no cancellation: $h$ can be $10^{-200}$ and the result is accurate to machine precision. It requires $f$ to be analytic and implemented in complex-safe code, with no `abs`, `max`, `min` or `conj`. As a bonus, $\mathrm{Re}\,f(x+ih) = f(x)$ to the same precision, so one complex evaluation returns both the value and the derivative.
:::

In code it is one line, and the function must accept complex input:

```python
import cmath


def complex_step(f, x, h=1e-200):
    """f'(x) by the complex-step method. f must be analytic and complex-safe."""
    return f(complex(x, h)).imag / h


def central_diff(f, x, h):
    """Central finite difference: O(h^2) truncation plus O(eps/h) round-off."""
    return (f(x + h) - f(x - h)) / (2 * h)


if __name__ == "__main__":
    g = lambda z: cmath.exp(z) / cmath.sqrt(cmath.sin(z) ** 3 + cmath.cos(z) ** 3)
    print(complex_step(g, 1.5))          # 4.053427893898621
    print(g(complex(1.5, 1e-200)).real)  # 4.497780053946162  (the value, free)
    print(complex_step(lambda z: z ** 3, 2.0))  # 12.0
```

That test function is deliberately nasty — an exponential over the square root of a sum of cubes of sines and cosines — and its hand derivative is a mess. The complex step returns $4.05342789389862$. A central difference, swept over steps from $10^{-16}$ to $10^{-2}$ at ten per decade, does best near $h = 3\times10^{-6}$, with a relative error of about $6\times10^{-12}$ — and you would have to run the sweep to find that.

The choice of $h$ is not delicate. Anything from about $10^{-8}$ down to $10^{-300}$ gives a correctly rounded answer for a well-scaled function; $10^{-200}$ is the custom because it leaves huge margin both ways. You can only get it wrong by making $h$ so small that $h \cdot f'$ underflows for a function whose derivative is itself tiny, or so large that the $h^2 f'''/6$ term matters.

## What "analytic" costs you

The derivation needs $f$ to be analytic near $x$, and it needs the *code* to compute the same analytic function when fed a complex number. Most numerical code does, because it is built from arithmetic and the standard functions (`exp`, `sin`, `sqrt`, …), all analytic. Four common constructs break it:

- **`abs`.** On a complex number, `abs(z)` returns the size $\sqrt{a^2+b^2}$, a real number, and the imaginary part is destroyed. Replace it with a branch on the real part: `z if z.real >= 0 else -z`.
- **`max`, `min`.** Same problem: they compare complex numbers, which most languages refuse to do or do by size. Compare real parts and return the original complex value.
- **Norms.** This is the one that bites. A vector's length must be computed as $\sqrt{\sum v_k^2}$ with the complex square root, *not* with `abs(v)`, `hypot` or a library norm. The difference is invisible for real input and fatal for complex.
- **`conj`, and anything defined piece by piece on the complex plane.** Conjugation (flipping the sign of the imaginary part) is not analytic. Neither is a function chosen by `if z.imag > 0`.

Comparisons and branches on the *real* part are fine, as long as the tiny imaginary nudge does not change which branch is taken — and at $10^{-200}$, it will not.

::: warning A wrong answer that looks right
A complex-step derivative through code that uses `abs` in a norm does not crash and does not return NaN. It returns a smooth, believable number that is wrong. In the drag Jacobian below, computing the speed as `abs(v_rel·v_rel)**0.5` instead of `sqrt(v_rel·v_rel)` gives $\partial a_y/\partial v_y = -7.2388\times10^{-10}$ against the correct $-1.4478\times10^{-9}$ — exactly half, because the part coming from the derivative of the speed was silently deleted. A filter built on it would run, converge, and be wrong by a factor of two in its drag sensitivity. Always check a complex-step Jacobian once against a central difference at a loose tolerance. Agreement to five or six digits proves the code is complex-safe; the complex step then supplies the other ten.
:::

## A Jacobian you would not want to do by hand

The drag acceleration on a low satellite, in an inertial frame, is

$$
\mathbf{a}_{\text{drag}} = -\frac{1}{2}\,\rho(h)\,\frac{C_D A}{m}\,\lVert\mathbf{v}_{\text{rel}}\rVert\,\mathbf{v}_{\text{rel}},
\qquad
\mathbf{v}_{\text{rel}} = \mathbf{v} - \boldsymbol{\omega}_\oplus \times \mathbf{r},
\qquad
h = \lVert\mathbf{r}\rVert - R_\oplus .
$$

Here $\rho$ is air density, $C_D A/m$ the drag coefficient times area over mass, $\boldsymbol{\omega}_\oplus$ Earth's spin rate ($\oplus$ is the symbol for Earth), $R_\oplus$ Earth's radius, and $h$ (in this formula only) the altitude. $\mathbf{v}_{\text{rel}}$ is the velocity relative to the air, which **[[turns with the Earth|corotating-air]]**. Position enters three times: through altitude, through the Earth-rotation term, and through the speed. This is the term in an orbit-determination filter's Jacobian that is always wrong.

::: example The drag Jacobian three ways
Take a circular 300 km orbit: $\mathbf{r} = (6{,}678{,}137, 0, 0)\,\mathrm{m}$, $\mathbf{v} = (0, 7{,}725.76, 0)\,\mathrm{m/s}$, $\omega_\oplus = 7.2921159\times10^{-5}\,\mathrm{rad/s}$ about $\hat{\mathbf{z}}$. Use an exponential atmosphere $\rho = \rho_0 e^{-(h - h_0)/H}$ with $\rho_0 = 2.0\times10^{-11}\,\mathrm{kg/m^3}$ at $h_0 = 300\,\mathrm{km}$ and $H = 50\,\mathrm{km}$, and $C_D A/m = 0.01\,\mathrm{m^2/kg}$.

The turning air takes $\omega_\oplus r = 7.2921159\times10^{-5} \times 6{,}678{,}137 = 486.98\,\mathrm{m/s}$ off the speed, leaving $\lVert\mathbf{v}_{\text{rel}}\rVert = 7{,}238.78\,\mathrm{m/s}$ and $\lVert\mathbf{a}_{\text{drag}}\rVert = 5.2400\times10^{-6}\,\mathrm{m/s^2}$. The hand-derived Jacobian has the row

$$
\frac{\partial a_y}{\partial(\mathbf{r},\mathbf{v})} =
\left(1.049055\times10^{-10},\ 0,\ 0,\ 0,\ -1.447757\times10^{-9},\ 0\right),
$$

in $\mathrm{s^{-2}}$ for the position columns and $\mathrm{s^{-1}}$ for the velocity columns. Compare the whole $3\times6$ matrix, worst element error divided by the largest analytic element:

| Method | evaluations | worst relative error |
| --- | --- | --- |
| Complex step, $h = 10^{-200}$ | 6 complex | $1.4\times10^{-16}$ |
| Central difference, $h = 0.1$ | 12 real | $2.7\times10^{-10}$ |
| Central difference, $h = 1$ | 12 real | $4.8\times10^{-9}$ |
| Central difference, $h = 10$ | 12 real | $4.8\times10^{-7}$ |
| Central difference, $h = 10^{3}$ | 12 real | $4.7\times10^{-3}$ |
| Central difference, $h = 10^{-3}$ | 12 real | $1.1\times10^{-8}$ |

The complex step matches the hand-derived Jacobian to the last bit, with no step to choose. The central difference is best near $h = 0.1$ — a tenth of a meter for position and a tenth of a meter per second for velocity, which happen to suit each other only by luck. Guess $h$ two decades too big and the error grows ten-thousandfold.
:::

The cost is better than people expect. For an $n$-state model, a forward difference needs $n+1$ evaluations, a central difference $2n$, and the complex step $n$ — one per column, nudging one component each time. Complex arithmetic costs more per call. In the NumPy version of the drag function, a complex call costs about 1.0 to 1.4 times a real one, depending on the machine, so the six complex calls cost at most about 8.4 real ones against the central difference's 12. In compiled code the ratio is typically 2 to 3 for functions heavy in `exp` and `sin`, which puts the complex step at about a central difference's cost and ten orders of magnitude ahead on accuracy. You do not trade speed for precision; you get both.

## Where the trick stops

**Second derivatives.** Since $\mathrm{Re}\,f(x+ih) = f(x) - \frac{h^2}{2}f''$, you could get $f'' = 2(f(x) - \mathrm{Re}\,f(x+ih))/h^2$. But that subtracts two nearly equal numbers and divides by $h^2$: cancellation again, worse than before. The complex step gives first derivatives only. For second derivatives, use a method built for them, or automatic differentiation.

**Code that is not smooth.** A linearly interpolated table is analytic inside each cell but has a kink at each knot, so its derivative is a staircase, and the complex step faithfully reports the staircase. A cubic spline is $C^2$ and differentiates cleanly — another reason the previous lesson's spline beats linear interpolation in a model that will be linearized. Code with real jumps — a saturation limit, a mode switch, an `if thrust_on` branch — has no derivative at the jump, and no method invents one.

**Automatic differentiation.** The complex step is a cousin of forward-mode **[[automatic differentiation|autodiff]]** (AD). The number $x + ih$ carries a derivative along through the whole calculation, and $i^2 = -1$ adds the tiny $O(h^2)$ error that true AD does not have. Proper AD is exact, gives second derivatives, and in *reverse mode* gives a whole gradient for the cost of a few function evaluations — what an optimizer with thousands of variables needs. The complex step's edge is that it needs no library and no build changes: every serious language has a complex type, and a C++ or Fortran propagator can often be made complex-safe by changing one type name and fixing three `abs` calls.

**Flight software.** Most flight code ships a hand-derived Jacobian, because it is fastest at run time and complex arithmetic in a real-time loop is an unwelcome dependency. The complex step's job is on the ground: it is the reference that checks the hand Jacobian, element by element, every time the dynamics change. That check is cheap and exact to machine precision, and it catches the sign error that a central-difference comparison at $10^{-7}$ tolerance would wave through as noise.

## Check yourself

::: check
A filter computes $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ by central differences with a fixed $h = 10^{-6}$ on a state whose position components are about $7\times10^{6}\,\mathrm{m}$. What goes wrong, and what is the fix?
:::

::: answer
Near $7\times10^{6}$, one `float64` ulp is $2^{22-52} = 9.3\times10^{-10}\,\mathrm{m}$, so $h = 10^{-6}\,\mathrm{m}$ is about a thousand ulps. The nudge survives, but the relative step is $10^{-6}/(7\times10^6) = 1.4\times10^{-13}$, far below the $\varepsilon^{1/3} = 6\times10^{-6}$ the analysis asks for. The difference sits deep on the round-off side of the V. For a range measurement, whose derivative entries are at most 1, the errors come out at a few parts in ten thousand: you keep only three or four digits.

In `float32` it is worse: the ulp at $7\times10^{6}$ is $0.5\,\mathrm{m}$, so $x+h$ rounds back to $x$ and the derivative comes out exactly zero.

The fix is a relative step, $h_j = \varepsilon^{1/3}\max(|x_j|, x_{j,\text{typ}})$, which for $7\times10^{6}\,\mathrm{m}$ is about $42\,\mathrm{m}$. Better still, the complex step, which needs no scaling at all.
:::

::: check
The complex step's truncation error is $\frac{h^2}{6}|f'''|$, the same order as a central difference's. Why is only one of them limited to $\varepsilon^{2/3}$?
:::

::: answer
Because the limit is set by round-off, not truncation. A central difference subtracts two numbers that agree in most of their leading digits. The subtraction itself is exact, but it exposes the $\varepsilon|f|$ rounding already in each one, and dividing by $2h$ scales that to $\varepsilon|f|/h$. Shrinking $h$ to kill truncation inflates round-off; the best compromise is $\varepsilon^{2/3}$.

The complex step's numerator, $\mathrm{Im}\,f(x+ih)$, is not a difference of two things. It is one computed number with relative error $\varepsilon$. So shrinking $h$ costs nothing, and truncation can be driven to $10^{-400}$, which is zero. Same truncation, no cancellation.
:::

::: check
You convert a drag model to complex-safe code and check its complex-step Jacobian against a central difference at $h = 1$. The velocity columns agree to eight digits, but the position entry $\partial a_y/\partial x$ comes out as $1.06\times10^{-13}\,\mathrm{s^{-2}}$ from the complex step and $1.049\times10^{-10}$ from the central difference. Which do you believe, and where is the bug?
:::

::: answer
Believe the central difference. Density changes over a 50 km scale height, so a 1 m step is tiny on that scale, and on this function a central difference at $h = 1$ is good to about ten digits in that entry. A thousandfold disagreement is a real bug, not step-size trouble.

The velocity columns are right, so the speed and the rotation term are complex-safe. What is missing is the density's dependence on altitude — the biggest part of $\partial a_y/\partial x$. The small $1.06\times10^{-13}$ left over is only the Earth-rotation part. So the altitude, $\lVert\mathbf{r}\rVert - R_\oplus$, is being computed with `abs`, `hypot` or a library norm, which returns a real number and throws away the imaginary part. Compute it as $\sqrt{x^2 + y^2 + z^2}$ with the complex square root and the entry becomes $1.049055\times10^{-10}$.
:::

::: check
Complex-step differentiation of $f(x) = x^3$ at $x = 2$ with $h = 10^{-200}$: work the arithmetic through and say why the answer is exact.
:::

::: answer
Expand: $(2 + ih)^3 = 8 + 3\cdot4\cdot ih + 3\cdot2\cdot(ih)^2 + (ih)^3 = 8 - 6h^2 + i(12h - h^3)$.

With $h = 10^{-200}$, $h^2 = 10^{-400}$ and $h^3 = 10^{-600}$ both underflow to exactly zero in `float64`. So the computed value is exactly $8 + 12h\,i$. The imaginary part divided by $h$ is exactly 12, and $f'(2) = 3 \cdot 2^2 = 12$.

The underflow is not a nuisance here; it is how the method works. It removes the truncation term completely rather than making it small. A central difference cannot return exactly 12: it always carries some truncation ($h^2 f'''/6 = h^2$ here) or some round-off.
:::

::: check
A trajectory optimizer needs the gradient of a scalar cost with respect to 5,000 design variables. Would you use complex-step differentiation? What would you use?
:::

::: answer
No. The complex step, like any forward-mode method, costs one evaluation per *input*. A 5,000-variable gradient would take 5,000 complex runs of the whole trajectory — far too slow. Its cost grows with the number of Jacobian columns: fine for a $6\times6$ filter Jacobian, hopeless for a big gradient.

Use reverse-mode automatic differentiation, or the equivalent adjoint method. It computes the gradient of one scalar with respect to every input for a small multiple — typically two to four — of one function evaluation, however many inputs there are. The complex step still helps as a spot-check: verify a few gradient components against complex-step values and you have checked the adjoint code to machine precision.
:::

## Summary

| Item | Statement |
| --- | --- |
| Forward difference | $\dfrac{f(x+h)-f(x)}{h}$, truncation $-\frac{h}{2}f''$, order 1 |
| Central difference | $\dfrac{f(x+h)-f(x-h)}{2h}$, truncation $-\frac{h^2}{6}f'''$, order 2 |
| Total error | truncation $+$ round-off $\approx \frac{h^2}{6}\lvert f'''\rvert + \frac{\varepsilon\lvert f\rvert}{h}$ for the central difference: the V |
| Optimal step | Central: $h \approx \varepsilon^{1/3} \approx 6\times10^{-6}$, accuracy $\approx \varepsilon^{2/3} \approx 4\times10^{-11}$. Forward: $h \approx \sqrt{\varepsilon}$, accuracy $\approx \sqrt{\varepsilon}$ |
| Scaling | $h_j = \varepsilon^{1/3}\max(\lvert x_j\rvert, x_{j,\text{typ}})$ per component; a fixed absolute $h$ fails on large states |
| Complex step | $f'(x) \approx \mathrm{Im}\,f(x+ih)/h$; truncation $O(h^2)$ but **no subtraction**, so no round-off floor |
| Step choice | $h = 10^{-200}$ is standard; anything from about $10^{-8}$ down works |
| Bonus | $\mathrm{Re}\,f(x+ih) = f(x)$: one evaluation gives value and derivative |
| Restrictions | $f$ analytic and complex-safe: no `abs`, `max`, `min`, `conj`; norms as $\sqrt{\sum v_k^2}$, never `abs` or `hypot` |
| Failure mode | Unsafe code returns a smooth wrong number, not an error — an `abs` norm halved a drag Jacobian entry |
| Cost | $n$ complex evaluations for an $n$-column Jacobian, about the cost of a central difference's $2n$ real ones |
| Not for | Second derivatives (cancellation returns), code with jumps, or large gradients (use reverse-mode AD) |
| In practice | Flight code ships a hand Jacobian; the complex step is the ground reference that proves it right to the last bit |

The next lesson turns to the other half of calculus, the integral. Impulse from a thrust curve, heat load along a re-entry, and the expectation integrals inside a filter all come down to computing $\int_a^b f\,dx$ from samples of $f$ — and choosing *where* to take those samples is worth two extra orders of accuracy.

::: context jacobian The table of slopes
A function with several inputs and several outputs has a slope for every pair: how much output 2 moves when input 5 is nudged, and so on. Laid out as a grid — one row per output, one column per input — that is the **Jacobian** matrix, named after the 19th-century German mathematician Carl Gustav Jacobi. For a satellite state of 3 position and 3 velocity components, the drag Jacobian in this lesson has 3 rows (acceleration components) and 6 columns.
:::

::: context ekf Where the Jacobian goes in a Kalman filter
A Kalman filter blends a prediction with a measurement, weighing each by how uncertain it is. The plain version only works for straight-line (linear) systems. The *extended* version handles curved ones by using, at each step, the Jacobian as a local straight-line stand-in. If the Jacobian is wrong, the filter's idea of its own uncertainty is wrong, and it trusts the wrong source. You will build one in the estimation module.
:::

::: context taylor The Taylor series in one breath
Near a point, a smooth function looks like its value, plus its slope times the step, plus half its curvature times the step squared, and so on, each term smaller than the last when the step is small. Brook Taylor published the general form in 1715. Every error formula in this lesson comes from writing out a few terms and seeing which ones are left over.
:::

::: context v-curve The V on a log-log plot
Plot the error against the step, both on logarithmic scales, and the finite difference traces a V. On the right the truncation branch falls with slope 2 (the error goes as $h^2$). On the left the round-off branch rises roughly as $1/h$, ragged because rounding is irregular. The bottom sits near $h \approx 6\times10^{-6}$ at about $4\times10^{-11}$. The complex step (blue) follows the same right-hand branch down, then stays flat at machine precision.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="174">1e-16</text><text x="120" y="174">1e-12</text><text x="200" y="174">1e-8</text><text x="280" y="174">1e-4</text></g>
  <text x="190" y="187" font-size="11" text-anchor="middle" fill="#1f2a44">step h</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="36" y="24">1</text><text x="36" y="88">1e-8</text><text x="36" y="152">1e-16</text></g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,20.0 45.0,23.4 50.0,31.8 55.0,34.2 60.0,29.7 65.0,35.8 70.0,33.9 75.0,35.3 80.0,39.7 85.0,40.0 90.0,40.3 95.0,45.7 100.0,50.2 105.0,60.1 110.0,53.2 115.0,51.5 120.0,52.9 125.0,60.1 130.0,61.8 135.0,59.2 140.0,63.3 145.0,62.4 150.0,69.0 155.0,71.8 160.0,72.9 165.0,79.3 170.0,72.4 175.0,78.6 180.0,88.9 185.0,79.3 190.0,81.4 195.0,83.6 200.0,88.9 205.0,88.4 210.0,96.5 215.0,92.4 220.0,105.3 225.0,104.4 230.0,106.9 235.0,98.0 240.0,101.8 245.0,106.0 250.0,107.3 255.0,106.4 260.0,105.3 265.0,102.3 270.0,98.2 275.0,94.2 280.0,90.2 285.0,86.2 290.0,82.2 295.0,78.2 300.0,74.2 305.0,70.2 310.0,66.2 315.0,62.2 320.0,58.2 325.0,54.2 330.0,50.2 335.0,46.2 340.0,42.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5,3" points="40,148 210,148 215.0,143.8 220.0,138.2 225.0,134.1 230.0,130.2 235.0,126.2 240.0,122.2 245.0,118.2 250.0,114.2 255.0,110.2 260.0,106.2 265.0,102.2 270.0,98.2"/>
  <text x="60" y="84" font-size="11" fill="#b4232c">round-off</text>
  <text x="300" y="100" font-size="11" fill="#b4232c">truncation</text>
  <text x="80" y="140" font-size="11" fill="#1d6fd1">complex step: flat</text>
</svg>
```
:::

::: context ulp Units in the last place
An **ulp** ("unit in the last place") is the gap between a floating-point number and the next one up. It grows with the number: near 1 it is about $2.2\times10^{-16}$, but near $7\times10^{6}$ it is about $9.3\times10^{-10}$. A step smaller than half an ulp vanishes completely when added, and a step of a few ulps is mostly rounding. The floating-point lesson built this from the bits.
:::

::: context analytic What "analytic" means here
A function is **analytic** at a point if its Taylor series converges to it nearby — for complex inputs as well as real ones. Polynomials, `exp`, `sin`, `cos`, `log` and `sqrt` (away from zero and the negative axis) all are. The real function $|x|$ is not analytic at $0$, and the complex `abs` is not analytic anywhere, because it ignores the direction of the input. That is the whole reason for this lesson's list of forbidden functions. The picture shows the two ways to nudge $x$: along the real line (a finite difference) or straight up, into the imaginary direction (the complex step).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="130" x2="120" y2="15" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="336" y="128" font-size="11" text-anchor="end" fill="#1f2a44">real</text>
  <text x="126" y="24" font-size="11" fill="#6c7a93">imaginary</text>
  <circle cx="120" cy="110" r="4" fill="#1f2a44"/>
  <text x="120" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">x</text>
  <line x1="120" y1="110" x2="224" y2="110" stroke="#b4232c" stroke-width="3"/>
  <polygon points="232,110 222,105 222,115" fill="#b4232c"/>
  <text x="236" y="102" font-size="12" fill="#b4232c">x + h</text>
  <line x1="120" y1="110" x2="120" y2="48" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="120,40 115,50 125,50" fill="#1d6fd1"/>
  <text x="128" y="48" font-size="12" fill="#1d6fd1">x + ih</text>
</svg>
```
:::

::: context underflow When a number is too small to store
`float64` cannot hold numbers smaller than about $10^{-308}$ (or about $5\times10^{-324}$ with some lost precision). Anything smaller becomes exactly zero: it **underflows**. Usually that is a nuisance. Here it is a gift: $h^2 = 10^{-400}$ becomes zero, so the complex step's truncation term disappears completely instead of merely being small.
:::

::: context corotating-air Why the air seems slower
The atmosphere spins with the Earth. A satellite moving east at $7{,}725.76\,\mathrm{m/s}$ meets air already moving east at $\omega_\oplus r = 486.98\,\mathrm{m/s}$ at that radius, so it plows through it at only $7{,}238.78\,\mathrm{m/s}$. Drag goes as speed squared, so ignoring this overstates drag by about 14% here. The bars are drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="300" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="46" y="36" font-size="11" fill="#1f2a44">satellite velocity v: 7,725.76 m/s</text>
  <rect x="40" y="62" width="281.1" height="22" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <rect x="321.1" y="62" width="18.9" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="46" y="78" font-size="11" fill="#ffffff">relative to the air: 7,238.78 m/s</text>
  <text x="340" y="104" font-size="11" text-anchor="end" fill="#1f2a44">air moving with Earth: 486.98 m/s</text>
  <line x1="330" y1="94" x2="330" y2="86" stroke="#1f2a44" stroke-width="1"/>
</svg>
```
:::

::: context autodiff Automatic differentiation, and the history
Automatic differentiation runs a program on numbers that carry a value *and* a derivative, applying the chain rule at every operation. Using complex numbers for derivatives goes back to James Lyness and Cleve Moler in 1967; William Squire and George Trapp turned it into the one-line complex step in 1998. Joaquim Martins and colleagues later showed how closely it matches forward-mode AD, and it became a standard check in aerospace design codes.
:::
