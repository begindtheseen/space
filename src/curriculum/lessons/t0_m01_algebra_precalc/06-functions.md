---
id: l06-functions
title: Functions, domain, range, composition and inverses
minutes: 21
covers:
  - "functions: domain, range, composition, inverses"
---

Every formula in the last four lessons was secretly a function. $g(r) = \mu/r^2$ takes a distance in and gives an acceleration out. $h(t) = 100 + 20t - 4.903t^2$ takes a time in and gives a height out. A pressure transducer takes a pressure in and gives a current out; a guidance law takes a state in and gives a steering command out. The word **function** names the pattern — one input, one definite output — and the vocabulary around it (domain, range, composition, inverse) is how engineers say precisely what a formula accepts, what it can produce, how formulas chain together, and when a formula can be run backwards.

That last question is the practical one. Half of the equation-solving in the previous lessons was really inverting a function: given the period, find the radius; given the current, find the pressure; given the mass ratio, find the propellant. Inversion is only possible when the function does not map two different inputs to the same output, and this lesson gives you the test for that and the procedure for doing it. Composition is the other half of the story: real vehicle models are long chains of functions — altitude to radius, radius to gravity, gravity to acceleration — and the calculus modules will differentiate those chains with the chain rule, which is unreadable unless you can see the chain.

The lesson uses the same aerospace functions you already know. Nothing new is asserted about the physics; what changes is how carefully you say what each formula is allowed to do.

## What a function is

A function is a rule that assigns to each allowed input exactly one output. We write $f(x)$, read "f of x", for the output that the rule $f$ produces from the input $x$. The letter inside the brackets is the **argument**; it is a placeholder, and $f(t)$, $f(u)$ and $f(\text{anything})$ describe the same rule. What matters is that the rule is *definite*: if you feed the same input twice, you get the same output twice. A table of test-stand data with two different thrust readings at the same time stamp is not a function of time — and the first job of the data engineer is to decide which reading to keep.

To **evaluate** a function, substitute the input for every occurrence of the argument. For $f(x) = x^2 + 1$: $f(3) = 10$, $f(-3) = 10$, $f(a + b) = (a + b)^2 + 1 = a^2 + 2ab + b^2 + 1$. Two different inputs gave the same output $10$; that is allowed, and it is exactly what will make $f$ non-invertible later. Notice also that $f(a + b) \neq f(a) + f(b)$: the left side is $a^2 + 2ab + b^2 + 1$ and the right side is $a^2 + b^2 + 2$. The brackets in $f(x)$ are *not* multiplication and $f$ does not distribute. The only functions that do satisfy $f(a + b) = f(a) + f(b)$ are the lines through the origin, $f(x) = kx$, and the whole of linear algebra is built on how special they are.

A function can be given as a formula, as a table, as a graph, or as a program. In Python:

```python
mu = 3.986e14  # m^3/s^2

def g(r):
    """Gravitational acceleration at distance r (m) from Earth's centre."""
    return mu / r**2

print(g(6.371e6))  # 9.820239602513361
```

The `def` line names the function and its argument; the `return` line is the rule. Calling `g(6.371e6)` is evaluation. When a physical model is a hundred such definitions calling one another, the ideas of this lesson are what keep the hundred straight.

### Graphs

The **graph** of $f$ is the set of points $(x, f(x))$. Because each input has one output, no vertical line crosses the graph twice — the **vertical line test**. A circle fails it, which is why $x^2 + y^2 = R^2$ is an equation and not a function of $x$: solving gives $y = \pm\sqrt{R^2 - x^2}$, two functions, the upper and lower half-circles. Reading a graph, the input runs along the horizontal axis and the output up the vertical axis; the height of the graph above $x$ *is* $f(x)$.

## Domain

The **domain** of a function is the set of inputs it accepts. There are two layers to it.

The **natural domain** of a formula is every real number for which the formula makes sense. Three things break a formula over the reals, and you have met all of them: division by zero, an even root of a negative number, and (from the next lesson) the logarithm of a number that is not positive. So the natural domain of $g(r) = \mu / r^2$ is every $r \neq 0$; the natural domain of $\sqrt{9 - x^2}$ is where $9 - x^2 \geq 0$, that is $-3 \leq x \leq 3$; and the natural domain of $\dfrac{1}{x^2 - 4}$ excludes $x = \pm 2$.

The **physical domain** is usually smaller. $g(r)$ describes gravity outside Earth, so the model is only meaningful for $r \geq R = 6371\,\mathrm{km}$; below the surface the inverse-square law is wrong, and the algebra would happily give you an enormous answer at $r = 1\,\mathrm{m}$. The height $h(t) = 100 + 20t - 4.903t^2$ is a model of a thrown object only from launch, $t = 0$, until it hits the ground at $t \approx 6.99\,\mathrm{s}$; the formula continues to exist for $t = 100\,\mathrm{s}$, when it says the object is $48$ kilometres underground. Writing the domain down is how you tell the reader — and yourself, six months later — where the model stops being a model.

Interval notation is the compact way to write domains. Square brackets include the endpoint, round ones exclude it: $[0, 6.99]$ is all $t$ with $0 \leq t \leq 6.99$; $(0, \infty)$ is all positive numbers; $[R, \infty)$ is every $r$ at or above the surface. Infinity always gets a round bracket, because it is not a number you can reach.

### Piecewise functions

A function does not need one formula. A first-stage thrust profile might be

$$
F(t) =
\begin{cases}
0 & t < 0, \\
7600\,\mathrm{kN} & 0 \leq t < 160, \\
0 & t \geq 160,
\end{cases}
$$

three rules on three pieces of the domain, and it is a perfectly good function: every $t$ still gets exactly one output. Absolute value is the piecewise function you will meet most, $|x| = x$ for $x \geq 0$ and $|x| = -x$ for $x < 0$; a guidance law that switches between a coast rule and a burn rule is another. When you evaluate a piecewise function, the first step is always to find which piece the input belongs to.

## Range

The **range** is the set of outputs the function actually produces as the input runs over the domain. It is harder to find than the domain, because you have to know how the function behaves, not only where it is defined.

For a linear function $f(x) = mx + b$ with $m \neq 0$ on the whole real line, the range is every real number: any target $y$ is hit by $x = (y - b)/m$. Restrict the domain and the range shrinks with it: a $4$–$20\,\mathrm{mA}$ transducer with $I(P) = 4 + 0.016P$ (current in milliamps, pressure in psi) on the domain $[0, 1000]\,\mathrm{psi}$ has the range $[4, 20]\,\mathrm{mA}$ — evaluate at the two endpoints, and since a line has no bumps in between, everything between is covered.

For a quadratic, the range is set by the vertex. Completing the square as in the equations lesson, $ax^2 + bx + c$ has its vertex at $x = -\frac{b}{2a}$, a minimum if $a > 0$ and a maximum if $a < 0$. The height function $h(t) = 100 + 20t - 4.903t^2$ has $a < 0$, so it peaks at $t = \frac{20}{2 \times 4.903} = 2.04\,\mathrm{s}$, where $h = 100 + 20(2.04) - 4.903(2.04)^2 = 120.4\,\mathrm{m}$. On its physical domain $[0, 6.99]$ the range is therefore $[0, 120.4]\,\mathrm{m}$: the object never gets higher than $120.4\,\mathrm{m}$ and the model stops at the ground. Asked "does it reach $150\,\mathrm{m}$?", you now answer without solving anything — $150$ is not in the range.

For $g(r) = \mu / r^2$ on the physical domain $[R, \infty)$, the function is largest at the smallest $r$, $g(R) = 9.82\,\mathrm{m/s^2}$, and decreases towards zero without ever reaching it. The range is $(0, 9.82]$. The round bracket at zero matters: there is no finite distance at which Earth's gravity is exactly zero, which is the mathematical content of "gravity has infinite reach".

::: example Domain and range of the circular-speed function
$v(r) = \sqrt{\mu / r}$ gives the speed of a circular orbit of radius $r$. Its natural domain is $r > 0$ (the root needs $\mu/r \geq 0$ and the division forbids $r = 0$). Its physical domain begins at the surface, $r \geq R$, and for a real satellite begins higher still, where the atmosphere is thin enough to orbit through — say $r \geq 6371 + 200 = 6571\,\mathrm{km}$.

The function decreases as $r$ grows (a bigger denominator under the root), so its largest value is at the smallest allowed $r$: $v(6.571 \times 10^6) = \sqrt{3.986 \times 10^{14} / 6.571 \times 10^6} = \sqrt{6.066 \times 10^7} \approx 7789\,\mathrm{m/s}$. As $r \to \infty$, $v \to 0$. The range over that physical domain is $(0, 7789]\,\mathrm{m/s}$: no circular orbit around Earth above $200\,\mathrm{km}$ is faster than about $7.8\,\mathrm{km/s}$, and no circular orbit is arbitrarily slow only in the sense that a very slow one is a very distant one. Both statements came from the shape of the function, not from solving an equation.
:::

::: warning Range is not the same as the set of allowed outputs you would like
Learners often write the range as "all positive numbers" for any function that gives positive values. The range is the set of values *actually produced*. $g(r)$ on $r \geq R$ never produces $12\,\mathrm{m/s^2}$; $12$ is a positive number, but it is not in the range. When a downstream calculation asks for $g = 12$, the right response is not to solve for $r$ (you would get $r$ below the surface, outside the domain) but to say the request is impossible.
:::

## Composition

**Composition** is applying one function to the output of another. If $u = g(x)$ and $y = f(u)$, then $y$ is a function of $x$ directly, written

$$
(f \circ g)(x) = f(g(x)),
$$

read "f after g" or "f of g of x". The inner function $g$ acts first. Order matters: with $f(x) = x^2 + 1$ and $g(x) = 2x - 3$,

$$
f(g(2)) = f(1) = 2, \qquad g(f(2)) = g(5) = 7 .
$$

Symbolically, $f(g(x)) = (2x - 3)^2 + 1 = 4x^2 - 12x + 10$ while $g(f(x)) = 2(x^2 + 1) - 3 = 2x^2 - 1$. Different functions. The domain of $f \circ g$ is the set of $x$ in the domain of $g$ for which $g(x)$ lands in the domain of $f$; a composition can fail either because the inner function refuses the input or because the outer one refuses the intermediate value.

Compositions are the natural language of a vehicle model. Altitude $h$ above the surface gives the radius through $r(h) = R + h$; the radius gives gravity through $g(r) = \mu / r^2$; so gravity as a function of altitude is the composition

$$
g(r(h)) = \frac{\mu}{(R + h)^2} .
$$

At $h = 1000\,\mathrm{km}$: $r = 7371\,\mathrm{km}$, and $g = 3.986 \times 10^{14} / (7.371 \times 10^6)^2 = 7.34\,\mathrm{m/s^2}$. You could substitute and simplify into a single formula, but usually you should not: keeping the chain visible is what lets you change one link (a different planet's $R$) without rederiving the rest, and it is what the chain rule of calculus will differentiate link by link.

### Seeing the chain in a formula

The reverse skill is **decomposition**: looking at $\sqrt{\mu / (R + h)}$ and seeing three nested functions — add $R$, divide into $\mu$, take the square root. Practise by asking "what is done last?" The last operation is the outer function. In $(2x - 3)^2 + 1$ the last operation is adding $1$, before that squaring, before that the inner $2x - 3$. In $\dfrac{1}{\sqrt{1 - v^2/c^2}}$ the outermost is the reciprocal, then the root, then $1 - (\text{something})$, and innermost the square of $v/c$. Every step of a derivative you will ever take on such an expression follows that peeling order.

### Shifts and scalings

Two compositions are so common they have names. Composing with $x - a$ **shifts** a graph: $f(t - t_0)$ is the graph of $f$ moved so that what happened at $t = 0$ now happens at $t = t_0$. A burn that starts at $t_0 = 150\,\mathrm{s}$ and follows the profile $F(t)$ from ignition is $F(t - 150)$. Composing with $kx$ **scales**: $f(2t)$ runs twice as fast. Multiplying the output, $A f(t)$, stretches the graph vertically. Recognising these saves re-deriving a function every time the clock or the units change.

::: example Chaining a sensor and a calibration
A pressure transducer produces current $I(P) = 4 + 0.016P$ milliamps for pressure $P$ in psi, and the flight computer's analogue input converts current to a raw count $N(I) = 204.7\,(I - 4)$, so that $4\,\mathrm{mA}$ reads $0$ and $20\,\mathrm{mA}$ reads $3275$. The count as a function of pressure is the composition

$$
N(I(P)) = 204.7\,\big((4 + 0.016P) - 4\big) = 204.7 \times 0.016\,P = 3.275\,P .
$$

The $4$'s cancelled, as the offset was designed to make them. At $P = 550\,\mathrm{psi}$: $I = 4 + 8.8 = 12.8\,\mathrm{mA}$, $N = 204.7 \times 8.8 = 1801$; the single formula gives $3.275 \times 550 = 1801$. Check the domain of the chain: $P$ in $[0, 1000]$ gives $I$ in $[4, 20]$, which is exactly what the input stage accepts. A pressure of $1200\,\mathrm{psi}$ would ask for $23.2\,\mathrm{mA}$, outside the second function's domain — in hardware, a saturated reading, and in the model, an input the composition must refuse.
:::

## Inverses

To **invert** a function is to run it backwards: given the output, recover the input. The inverse of $f$ is written $f^{-1}$, and it is defined by

$$
f^{-1}(f(x)) = x \quad\text{and}\quad f(f^{-1}(y)) = y .
$$

The domain of $f^{-1}$ is the range of $f$, and the range of $f^{-1}$ is the domain of $f$: the inverse accepts exactly the outputs the original could produce, and gives back exactly the inputs the original accepted.

::: warning The $-1$ is not an exponent
$f^{-1}(x)$ means the inverse function, not $\dfrac{1}{f(x)}$. For $f(x) = 2x$, the inverse is $f^{-1}(x) = x/2$, while $1/f(x) = 1/(2x)$. The notation is unfortunate and permanent; when the reciprocal is meant, write $(f(x))^{-1}$ or $1/f(x)$. The same trap awaits with $\sin^{-1}$ in the trigonometry module.
:::

### When an inverse exists

A function can be inverted only if no two inputs share an output — otherwise, handed that output, you would not know which input to return. Such a function is **one-to-one**. On a graph, no horizontal line crosses it twice: the **horizontal line test**. Every strictly increasing or strictly decreasing function passes, which is why $g(r)$, $v(r)$ and $r(h)$ are all invertible on their physical domains, and why $f(x) = x^2$ on the whole real line is not: $f(3) = f(-3) = 9$.

The fix for a function that fails is to **restrict the domain** until it passes. $x^2$ on $[0, \infty)$ is one-to-one, and its inverse is $\sqrt{y}$ — which is precisely why the square root symbol was defined to return the non-negative root in the exponents lesson. The height function $h(t)$ fails on $[0, 6.99]$ because the object passes each height twice, going up and coming down; restrict to the descent, $[2.04, 6.99]$, and "at what time was it at $110\,\mathrm{m}$?" has one answer.

### Finding an inverse

Write $y = f(x)$, solve for $x$ in terms of $y$ using the legal moves from the equations lesson, and the result is $x = f^{-1}(y)$. Whether you then rename the letters is a matter of taste; engineers usually keep the physical names. For the transducer, $I = 4 + 0.016P$ gives

$$
P = \frac{I - 4}{0.016} = 62.5\,(I - 4),
$$

so a reading of $12.8\,\mathrm{mA}$ means $P = 62.5 \times 8.8 = 550\,\mathrm{psi}$, and the domain of this inverse is $[4, 20]\,\mathrm{mA}$, the range of the original. For the circular-speed function, $v = \sqrt{\mu/r}$ squares to $v^2 = \mu/r$, so $r = \mu/v^2$. A satellite in a circular orbit moving at $3075\,\mathrm{m/s}$ has $r = 3.986 \times 10^{14} / 3075^2 = 4.215 \times 10^7\,\mathrm{m} = 42\,150\,\mathrm{km}$, an altitude of about $35\,780\,\mathrm{km}$: the geostationary belt. The period formula $T = 2\pi\sqrt{r^3/\mu}$ inverted to $r = (\mu T^2 / 4\pi^2)^{1/3}$ in the exponents lesson was the same procedure.

Graphically, the graph of $f^{-1}$ is the graph of $f$ reflected across the line $y = x$, because reflecting swaps the roles of the two axes — swaps input for output — and that is what inversion is.

::: example Inverting a temperature scale
The Fahrenheit temperature of something at $C$ degrees Celsius is $F(C) = \tfrac{9}{5}C + 32$. It is a line with non-zero slope, so it is one-to-one on all of $\mathbb{R}$ and invertible everywhere. Solve $F = \tfrac{9}{5}C + 32$: subtract $32$, then multiply by $\tfrac{5}{9}$,

$$
C = \tfrac{5}{9}\,(F - 32) .
$$

Liquid oxygen boils at $-183\,^\circ\mathrm{C}$; forward, $F = \tfrac{9}{5}(-183) + 32 = -329.4 + 32 = -297.4\,^\circ\mathrm{F}$. Backward as a check, $C = \tfrac{5}{9}(-297.4 - 32) = \tfrac{5}{9}(-329.4) = -183\,^\circ\mathrm{C}$. A spec sheet quoting a $70\,^\circ\mathrm{F}$ storage temperature means $\tfrac{5}{9}(38) = 21.1\,^\circ\mathrm{C}$. Note that this inverse is *not* $\tfrac{5}{9}F - 32$: the operations have to be undone in reverse order — the $32$ was added last, so it is removed first.
:::

::: key Functions
A function assigns one output $f(x)$ to each input $x$ in its **domain**; the set of outputs is its **range**. Write physical domains in interval notation and check them. $f(a+b) \neq f(a) + f(b)$ in general. Composition $(f \circ g)(x) = f(g(x))$ applies $g$ first; order matters. A function has an inverse $f^{-1}$, with $f^{-1}(f(x)) = x$, exactly when it is one-to-one (passes the horizontal line test); find it by solving $y = f(x)$ for $x$; its domain is the range of $f$. $f^{-1}$ is not $1/f$.
:::

::: note Functions of several variables
Nothing here requires one input. Thrust depends on chamber pressure *and* ambient pressure, $F(p_c, p_a)$; the gravitational acceleration on another planet is $g(\mu, r)$. Domain, range and composition mean the same things with more arguments, and inversion becomes "solve for one input given the output and the others". The multivariable calculus module makes this precise; for now, when a formula has several symbols, decide which are inputs and which are fixed parameters before you call it a function.
:::

## Check yourself

::: check
Give the natural domain of $f(x) = \dfrac{\sqrt{x - 2}}{x - 5}$, in interval notation.
:::

::: answer
The root needs $x - 2 \geq 0$, so $x \geq 2$; the denominator forbids $x = 5$. The domain is $[2, 5) \cup (5, \infty)$ — every number from $2$ upward except $5$.
:::

::: check
With $f(x) = 3x - 1$ and $g(x) = x^2$, compute $f(g(2))$, $g(f(2))$, and a formula for $(g \circ f)(x)$.
:::

::: answer
$g(2) = 4$, so $f(g(2)) = 11$. $f(2) = 5$, so $g(f(2)) = 25$. In general $(g \circ f)(x) = g(3x - 1) = (3x - 1)^2 = 9x^2 - 6x + 1$; check at $x = 2$: $36 - 12 + 1 = 25$.
:::

::: check
A stage's remaining propellant is $m_p(t) = 400 - 2.5t$ tonnes, with $t$ in seconds from ignition. State its physical domain and range, and find the inverse function and what it is for.
:::

::: answer
The propellant runs out when $400 - 2.5t = 0$, at $t = 160\,\mathrm{s}$, so the domain is $[0, 160]\,\mathrm{s}$ and the range is $[0, 400]\,\mathrm{t}$ (a decreasing line, so evaluate at the endpoints). The function is one-to-one (strictly decreasing). Solving $m_p = 400 - 2.5t$ gives $t = (400 - m_p)/2.5 = 160 - 0.4\,m_p$, defined on $[0, 400]\,\mathrm{t}$: it tells you the time at which a given amount of propellant remains — for example, $100\,\mathrm{t}$ remain at $t = 160 - 40 = 120\,\mathrm{s}$.
:::

::: check
Why does $g(r) = \mu / r^2$ have an inverse on $[R, \infty)$ but $h(t) = 100 + 20t - 4.903t^2$ have none on $[0, 6.99]$? Find the inverse of $g$ and evaluate it at $2.455\,\mathrm{m/s^2}$.
:::

::: answer
$g$ is strictly decreasing on $[R, \infty)$, so each value of $g$ comes from one $r$: it passes the horizontal line test. $h$ rises then falls, so every height below the peak is reached twice, once ascending and once descending; a horizontal line at $h = 110$ crosses the graph twice, and there is no single "time at which the height was $110$". Inverting $g$: $g = \mu / r^2$ gives $r^2 = \mu / g$, and taking the positive root (since $r > 0$), $r = \sqrt{\mu / g}$. At $g = 2.455$: $r = \sqrt{3.986 \times 10^{14} / 2.455} = \sqrt{1.624 \times 10^{14}} = 1.274 \times 10^7\,\mathrm{m}$, which is $2R$ — consistent with the inverse-square law giving $9.82 / 4 = 2.455$ at twice the radius.
:::

::: check
Decompose $y = \dfrac{1}{\sqrt{R^2 + h^2}}$ into a chain of single-operation functions, innermost first.
:::

::: answer
Start with $h$. Square it: $u_1 = h^2$. Add $R^2$: $u_2 = u_1 + R^2$. Take the square root: $u_3 = \sqrt{u_2}$. Take the reciprocal: $y = 1/u_3$. Four links; the outermost (last applied) is the reciprocal. The chain rule will differentiate this by multiplying the derivative of each link, so seeing the four links is the whole of the setup.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Function | one output $f(x)$ per input; $f(a+b) \neq f(a)+f(b)$ except for $f(x) = kx$ |
| Domain | inputs accepted; natural (formula makes sense) vs physical (model applies) |
| Breakers of the natural domain | division by zero, even root of a negative, log of a non-positive |
| Interval notation | $[a, b]$ includes endpoints, $(a, b)$ excludes them; $\infty$ always gets $($ or $)$ |
| Range | outputs produced; lines: evaluate endpoints; quadratics: vertex at $x = -b/2a$ |
| Piecewise | different rules on different parts of the domain; find the piece first |
| Composition | $(f \circ g)(x) = f(g(x))$, $g$ first; order matters |
| Decomposition | ask "what is done last?" — that is the outer function |
| Shift and scale | $f(t - t_0)$ delays by $t_0$; $f(kt)$ runs $k$ times faster |
| Inverse | exists iff one-to-one (horizontal line test); solve $y = f(x)$ for $x$ |
| Inverse domain | domain of $f^{-1}$ is the range of $f$; $f^{-1} \neq 1/f$ |
| Examples | $r = \mu / v^2$ inverts $v = \sqrt{\mu/r}$; $C = \tfrac{5}{9}(F - 32)$ inverts $F = \tfrac{9}{5}C + 32$ |

The next lesson takes the one family of functions this module has not yet handled — $a^x$, where the variable is in the exponent — and its inverse, the logarithm, which is what turns the rocket equation from a mystery into one line of algebra.
