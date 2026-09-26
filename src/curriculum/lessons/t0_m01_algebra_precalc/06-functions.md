---
id: l06-functions
title: Functions, domain, range, composition and inverses
minutes: 24
covers:
  - "functions: domain, range, composition, inverses"
---

Think of a vending machine. You press B4 and out drops a bag of pretzels. Press B4 tomorrow and you get pretzels again — never "sometimes pretzels, sometimes gum". That is exactly what mathematicians mean by a **function**: a rule that takes an input and gives back one definite output.

Every formula in the last four lessons was secretly a function. $g(r) = \mu/r^2$ takes a distance in and gives gravity out. $h(t) = 100 + 20t - 4.903t^2$ takes a time in and gives a height out. On a rocket, a pressure sensor takes a pressure in and gives a current out; a guidance program takes position and speed in and gives a steering command out.

This lesson is about four words. The **domain** is what a formula is allowed to take in. The **range** is what it can give out. **Composition** is how formulas chain together, one feeding the next. The **inverse** is running a formula backwards — from the answer to the question.

Running backwards matters most. Half your equation-solving so far was really that: given the orbit's period, find its radius; given the sensor's current, find the pressure. It only works when no two inputs give the same output, and you will learn the test. Chaining matters too. A vehicle model is a long chain — altitude to distance from Earth's centre, distance to gravity, gravity to acceleration — and calculus will later take such chains apart link by link. The physics is the same as before. What changes is how carefully you say what each formula is allowed to do.

## What a function is

A function is a rule that gives each allowed input exactly one output. We write $f(x)$, read "f of x", for the output that the rule $f$ produces from the input $x$.

The letter inside the brackets is called the **argument**. It is a placeholder, like a blank on a form. $f(t)$, $f(u)$ and $f(\text{anything})$ all describe the same rule. What matters is that the rule is *definite*: same input, same output, every time. Test data with two different thrust readings at the same moment is not a function of time until someone decides which reading to keep.

To **evaluate** a function, put the input in place of every copy of the argument. For $f(x) = x^2 + 1$:

$$
f(3) = 3^2 + 1 = 10, \qquad f(-3) = (-3)^2 + 1 = 10, \qquad f(a + b) = (a + b)^2 + 1 = a^2 + 2ab + b^2 + 1 .
$$

Two inputs, $3$ and $-3$, gave the same output, $10$. That is allowed — two buttons can both hold pretzels — but it will stop $f$ being run backwards later.

::: warning The brackets in $f(x)$ are not multiplication
$f(a + b)$ is not $f(a) + f(b)$. Above, the left side came out as $a^2 + 2ab + b^2 + 1$, while $f(a) + f(b) = (a^2 + 1) + (b^2 + 1) = a^2 + b^2 + 2$. Different. A function does not "distribute" over a sum. The only functions that do satisfy $f(a + b) = f(a) + f(b)$ are the straight lines through zero, $f(x) = kx$ for a fixed number $k$ — and the whole of linear algebra is built on how special they are.
:::

A function can be given as a formula, a table, a graph or a computer program. In Python:

```python
mu = 3.986e14  # m^3/s^2

def g(r):
    """Gravitational acceleration at distance r (m) from Earth's centre."""
    return mu / r**2

print(g(6.371e6))  # 9.820239602513361
```

The `def` line names the function and its argument. The `return` line is the rule. Calling `g(6.371e6)` is evaluating it.

### Graphs

The **graph** of $f$ is every point $(x, f(x))$ drawn on graph paper: input along the bottom, output going up. The height of the graph above $x$ *is* $f(x)$.

Because each input has only one output, no vertical line can cross the graph twice. This is the **vertical line test**. A circle fails it — a vertical line through the middle hits top and bottom — so $x^2 + y^2 = R^2$ is an equation but not a function of $x$. Solving it gives $y = \pm\sqrt{R^2 - x^2}$ (the $\pm$ is read "plus or minus"), which is really two functions — the top half of the circle and the bottom half.

## Domain: what goes in

The **domain** of a function is the set of inputs it accepts — the buttons that actually work. It has two layers.

### What the formula allows

The **natural domain** of a formula is every number for which the formula makes sense. Three things break a formula, and you have met all of them:

1. **Dividing by zero.**
2. **An even root of a negative number** — there is no ordinary number whose square is $-9$.
3. **The logarithm of zero or a negative number** — you will meet logarithms in the next lesson.

So the natural domain of $g(r) = \mu / r^2$ is every $r$ except $0$. That of $\sqrt{9 - x^2}$ is wherever $9 - x^2 \geq 0$ ("is at least zero"), which is $-3 \leq x \leq 3$. And that of $\dfrac{1}{x^2 - 4}$ leaves out $x = 2$ and $x = -2$, because both make the bottom zero.

### What the physics allows

The **physical domain** is usually smaller. A bathroom scale works up to maybe $150\,\mathrm{kg}$. Park a car on it and whatever the display shows means nothing.

$g(r)$ describes gravity *outside* Earth, so it only means something for $r \geq R = 6371\,\mathrm{km}$, the planet's radius. Below the surface the inverse-square law is wrong, and the formula would happily give you an enormous answer at $r = 1\,\mathrm{m}$.

The height $h(t) = 100 + 20t - 4.903t^2$ models a ball thrown up from a $100\,\mathrm{m}$ tower. It is only a model from launch, $t = 0$, until the ball hits the ground at $t \approx 6.99\,\mathrm{s}$. The formula still exists at $t = 100\,\mathrm{s}$, where it says the ball is about $47$ kilometres underground. Writing the domain down tells your reader where the model stops being a model.

### Interval notation

There is a short way to write a stretch of numbers. Square brackets mean "including this end". Round brackets mean "not including it".

- $[0, 6.99]$ is every $t$ with $0 \leq t \leq 6.99$ — both ends included.
- $(0, \infty)$ is every positive number. The symbol $\infty$ is "infinity": the stretch never ends.
- $[R, \infty)$ is every $r$ at or above the surface.

Infinity always gets a round bracket, because it is not a number you can reach. To join two stretches, use $\cup$, read "union" or "together with": $[2, 5) \cup (5, \infty)$ is everything from $2$ upward except $5$.

### Piecewise functions

A function does not need a single formula. A first-stage engine's thrust might be

$$
F(t) =
\begin{cases}
0 & t < 0, \\
7600\,\mathrm{kN} & 0 \leq t < 160, \\
0 & t \geq 160,
\end{cases}
$$

read as "zero before ignition, $7600\,\mathrm{kN}$ for $160$ seconds, zero after" — like a parking garage that is free for an hour and then charges. Three rules on three pieces of the domain, and still a perfectly good function: every $t$ gets exactly one output.

The piecewise function you will meet most is the absolute value: $|x| = x$ when $x \geq 0$, and $|x| = -x$ when $x < 0$. A guidance program that switches between a "coast" rule and a "burn" rule is another. To evaluate one, first find which piece your input belongs to.

## Range: what comes out

The **range** is the set of outputs the function actually produces as the input runs over the domain — the snacks actually inside the machine. It is harder to find than the domain, because you need to know how the function behaves.

**Lines.** For a straight line $f(x) = mx + b$ with $m \neq 0$ on all numbers, the range is every number: any target $y$ is hit by $x = (y - b)/m$. Shrink the domain and the range shrinks with it. A pressure sensor might send out a current $I(P) = 4 + 0.016P$ (in milliamps, mA, for a pressure $P$ in psi, pounds per square inch) on the domain $[0, 1000]\,\mathrm{psi}$. At the two ends, $I(0) = 4$ and $I(1000) = 4 + 16 = 20$. A line has no bumps in between, so everything from $4$ to $20$ is covered: the range is $[4, 20]\,\mathrm{mA}$.

**Quadratics.** A parabola turns around at its **vertex**, the top or bottom of the curve, and the vertex sets the range. Completing the square (equations lesson) shows that $ax^2 + bx + c$ has its vertex at $x = -\frac{b}{2a}$. It is a lowest point if $a > 0$ and a highest point if $a < 0$.

The height $h(t) = 100 + 20t - 4.903t^2$ has $a = -4.903 < 0$, so it peaks, at

$$
t = \frac{20}{2 \times 4.903} = 2.04\,\mathrm{s}, \qquad h = 100 + 20(2.04) - 4.903(2.04)^2 = 120.4\,\mathrm{m} .
$$

On its physical domain $[0, 6.99]$ the range is therefore $[0, 120.4]\,\mathrm{m}$: never higher than $120.4\,\mathrm{m}$, and the model stops at the ground. "Does it reach $150\,\mathrm{m}$?" No — $150$ is not in the range, and you did not have to solve anything.

**Gravity.** For $g(r) = \mu / r^2$ on the physical domain $[R, \infty)$, the function is biggest at the smallest $r$: $g(R) = 9.82\,\mathrm{m/s^2}$. As $r$ grows it heads towards zero without ever reaching it. So the range is $(0, 9.82]$. The round bracket at zero matters: there is no distance at which Earth's gravity is exactly zero. That is what "gravity has infinite reach" means in mathematics.

::: example Domain and range of the circular-speed function
The formula $v(r) = \sqrt{\mu / r}$ gives the speed a satellite needs to circle Earth at distance $r$ from its centre.

**Natural domain.** The square root needs $\mu / r \geq 0$, and the division forbids $r = 0$. Since $\mu$ is positive, that means $r > 0$.

**Physical domain.** The orbit cannot be inside the planet, so $r \geq R$. For a real satellite it must be higher still, above most of the air — say at least $200\,\mathrm{km}$ up, so $r \geq 6371 + 200 = 6571\,\mathrm{km}$.

**Range.** A bigger $r$ means a bigger number on the bottom, so a smaller speed: $v$ goes down as $r$ goes up. Its largest value is at the smallest allowed $r$:

$$
v(6.571 \times 10^6) = \sqrt{\frac{3.986 \times 10^{14}}{6.571 \times 10^6}} = \sqrt{6.066 \times 10^7} \approx 7788\,\mathrm{m/s} .
$$

As $r$ grows without limit ("$r \to \infty$", read "r goes to infinity"), $v$ heads to $0$. So the range over this physical domain is $(0, 7788]\,\mathrm{m/s}$.

In words: no circular orbit above $200\,\mathrm{km}$ is faster than about $7.8\,\mathrm{km/s}$ (the familiar low-orbit speed, a good sign), and one can be as slow as you like if it is far enough away. Both facts came from the *shape* of the function, not from solving an equation.
:::

::: warning The range is what the function produces, not what you would like
It is tempting to call the range "all positive numbers" whenever the answers are positive. But the range is the set of values *actually produced*. $g(r)$ on $r \geq R$ never produces $12\,\mathrm{m/s^2}$. Twelve is positive, but it is not in the range. If a later calculation asks for $g = 12$, do not solve for $r$ (you would land below the surface, outside the domain). Say the request is impossible.
:::

## Composition: chaining functions

Getting dressed is a chain: socks first, then shoes. What comes out of step one (a foot in a sock) goes into step two. And order matters — shoes first, then socks, looks very different.

**Composition** is doing one function to the output of another. If $u = g(x)$ and then $y = f(u)$, then $y$ depends on $x$ directly. We write

$$
(f \circ g)(x) = f(g(x)),
$$

read "f after g", or "f of g of x". The little circle $\circ$ means "composed with". The **inner** function, $g$, acts first — it is the socks. The **outer** function, $f$, acts on what comes out.

Order matters here too. Take $f(x) = x^2 + 1$ and $g(x) = 2x - 3$. Work from the inside out:

$$
f(g(2)) = f(2 \cdot 2 - 3) = f(1) = 1^2 + 1 = 2, \qquad g(f(2)) = g(2^2 + 1) = g(5) = 2 \cdot 5 - 3 = 7 .
$$

With letters, $f(g(x)) = (2x - 3)^2 + 1 = 4x^2 - 12x + 10$, while $g(f(x)) = 2(x^2 + 1) - 3 = 2x^2 - 1$. Two different functions.

The domain of $f \circ g$ is every $x$ that $g$ accepts *and* whose output $g(x)$ is something $f$ accepts. A chain can fail at either link: the inner function can refuse the input, or the outer one can refuse what the inner one handed it.

### Chains on a vehicle

Vehicle models are built from compositions. The altitude $h$ above the ground gives the distance from Earth's centre through $r(h) = R + h$. The distance gives gravity through $g(r) = \mu / r^2$. So gravity as a function of altitude is the composition

$$
g(r(h)) = \frac{\mu}{(R + h)^2} .
$$

At $h = 1000\,\mathrm{km}$: first $r = 6371 + 1000 = 7371\,\mathrm{km}$, then $g = 3.986 \times 10^{14} / (7.371 \times 10^6)^2 = 7.34\,\mathrm{m/s^2}$. About three quarters of the surface value — less, as it should be.

You could squash the chain into one formula, but usually you should not. Visible links let you change one — a different planet's $R$ — without redoing the rest, and they are what calculus's **chain rule** works on, link by link.

### Seeing the chain inside a formula

The reverse skill is **decomposition**: seeing three nested functions in $\sqrt{\mu / (R + h)}$ — add $R$, divide that into $\mu$, take the square root.

The trick is to ask "what is done *last*?" The last step is the outer function. In $(2x - 3)^2 + 1$, the last step is adding $1$. Before that comes squaring, and before that the inner $2x - 3$. In $\dfrac{1}{\sqrt{1 - v^2/c^2}}$, the last step is "one over", then the square root, then "one minus something", and innermost the square of $v/c$. Calculus will peel such expressions in exactly that order, like layers of an onion.

### Shifts and scalings

Two chains are so common they have names.

- **Shift.** Feeding in $t - t_0$ instead of $t$ moves the graph along. $f(t - t_0)$ is the graph of $f$ moved so that what used to happen at $t = 0$ now happens at $t = t_0$. If a burn follows the profile $F(t)$ from ignition, but ignition is at $t_0 = 150\,\mathrm{s}$, the burn is $F(t - 150)$.
- **Scale.** Feeding in $kt$ runs the clock faster: $f(2t)$ plays the same story at double speed, like a video on fast-forward. Multiplying the output instead, $A\,f(t)$, stretches the graph up and down.

::: example Chaining a sensor and a computer
A pressure sensor sends out a current $I(P) = 4 + 0.016P$ milliamps for a pressure $P$ in psi. The flight computer turns the current into a whole-number reading, a **count**, with $N(I) = 204.7\,(I - 4)$. So $4\,\mathrm{mA}$ reads $0$, and $20\,\mathrm{mA}$ reads $204.7 \times 16 = 3275$.

The count as a function of pressure is the chain "sensor, then computer":

$$
N(I(P)) = 204.7\,\big((4 + 0.016P) - 4\big) = 204.7 \times 0.016\,P = 3.275\,P .
$$

The two $4$'s cancelled — the $4\,\mathrm{mA}$ offset was designed so they would.

**Check at $P = 550\,\mathrm{psi}$, link by link.** Sensor: $I = 4 + 0.016 \times 550 = 4 + 8.8 = 12.8\,\mathrm{mA}$. Computer: $N = 204.7 \times (12.8 - 4) = 204.7 \times 8.8 = 1801$. The single formula agrees: $3.275 \times 550 = 1801$.

**Check the chain's domain.** $P$ in $[0, 1000]$ gives $I$ in $[4, 20]$, exactly what the computer accepts. But a pressure of $1200\,\mathrm{psi}$ would ask for $4 + 0.016 \times 1200 = 23.2\,\mathrm{mA}$, outside the second link's domain. In hardware, that is a maxed-out ("saturated") reading. In the model, it is an input the chain must refuse.
:::

## Inverses: running a function backwards

You put on socks, then shoes. To undo it, shoes come off first, then socks. Undoing reverses the order — keep that picture.

To **invert** a function is to run it backwards: given the output, recover the input. The inverse of $f$ is written $f^{-1}$, read "f inverse". It is defined by two promises:

$$
f^{-1}(f(x)) = x \quad\text{and}\quad f(f^{-1}(y)) = y .
$$

Because the inverse swaps input and output, the **domain of $f^{-1}$ is the range of $f$**, and the range of $f^{-1}$ is the domain of $f$. The inverse accepts exactly the outputs the original could produce.

::: warning The $-1$ is not a power
$f^{-1}(x)$ means the inverse function. It does *not* mean $\dfrac{1}{f(x)}$. For $f(x) = 2x$, the inverse is $f^{-1}(x) = x/2$ ("halve it undoes double it"), while $1/f(x) = 1/(2x)$. The notation is confusing, and permanent. For "one over", write $(f(x))^{-1}$ or $1/f(x)$. The same trap waits for you with $\sin^{-1}$ in the trigonometry module.
:::

### When can you run it backwards?

Picture a coat check. You hand over your coat and get ticket 17; later, ticket 17 gets your coat back. That works only because each ticket belongs to one coat. If two coats shared ticket 17, the attendant could not know which to return.

A function can be inverted only if no two inputs share an output. Such a function is called **one-to-one**. On a graph, it means no horizontal line crosses the graph twice — the **horizontal line test**.

A function that only ever goes up (**strictly increasing**) or only ever goes down (**strictly decreasing**) always passes. That is why $g(r)$, $v(r)$ and $r(h)$ can all be inverted on their physical domains. But $f(x) = x^2$ on all numbers cannot: $f(3) = f(-3) = 9$, so handed the output $9$, you cannot tell whether the input was $3$ or $-3$.

The fix for a function that fails is to **restrict the domain** — use only part of it — until it passes. $x^2$ on $[0, \infty)$ is one-to-one, and its inverse is $\sqrt{y}$. That is why the square root symbol was defined in the exponents lesson to give the non-negative root.

The height $h(t)$ fails on $[0, 6.99]$, because the ball passes each height below the peak twice — once going up, once coming down. Restrict to the way down, $[2.04, 6.99]$, and "at what time was it at $110\,\mathrm{m}$?" has one answer.

### Finding an inverse

The recipe: write $y = f(x)$, then solve for $x$ using the legal moves from the equations lesson. The result is $x = f^{-1}(y)$. Engineers usually keep the physical letter names rather than swapping them.

**The pressure sensor.** Start from $I = 4 + 0.016P$. Take $4$ from both sides, then divide by $0.016$:

$$
P = \frac{I - 4}{0.016} = 62.5\,(I - 4) .
$$

A reading of $12.8\,\mathrm{mA}$ means $P = 62.5 \times 8.8 = 550\,\mathrm{psi}$ — matching the forward calculation above. The domain of this inverse is $[4, 20]\,\mathrm{mA}$, the range of the original.

**Circular speed.** Start from $v = \sqrt{\mu/r}$. Square both sides to get $v^2 = \mu/r$. Multiply both sides by $r$ and divide by $v^2$:

$$
r = \frac{\mu}{v^2} .
$$

A circular orbit at $3075\,\mathrm{m/s}$ has $r = 3.986 \times 10^{14} / 3075^2 = 4.215 \times 10^7\,\mathrm{m} = 42\,150\,\mathrm{km}$ from Earth's centre. Take away Earth's radius: about $35\,780\,\mathrm{km}$ up: the **geostationary** belt, where a satellite goes round once a day and seems to hang still over one spot. In the exponents lesson you turned the period formula $T = 2\pi\sqrt{r^3/\mu}$ into $r = (\mu T^2 / 4\pi^2)^{1/3}$. That was this same recipe.

**On a graph**, $f^{-1}$ is the graph of $f$ flipped in a mirror along the diagonal line $y = x$. That flip swaps the two axes — input for output — which is what inverting is.

::: example Inverting a temperature scale
The Fahrenheit temperature of something at $C$ degrees Celsius is

$$
F(C) = \tfrac{9}{5}C + 32 .
$$

A tilted straight line is one-to-one everywhere, so it can be run backwards. The forward recipe is "multiply by $\tfrac{9}{5}$, *then* add $32$". Undo in reverse order — like shoes before socks. First take away $32$, then multiply by $\tfrac{5}{9}$ (which undoes multiplying by $\tfrac{9}{5}$):

$$
C = \tfrac{5}{9}\,(F - 32) .
$$

**Forward.** Liquid oxygen boils at $-183\,^\circ\mathrm{C}$. In Fahrenheit that is $\tfrac{9}{5}(-183) + 32 = -329.4 + 32 = -297.4\,^\circ\mathrm{F}$.

**Backward, as a check.** $C = \tfrac{5}{9}(-297.4 - 32) = \tfrac{5}{9}(-329.4) = -183\,^\circ\mathrm{C}$. Back where we started, as an inverse must be.

**A spec sheet.** A storage temperature of $70\,^\circ\mathrm{F}$ means $\tfrac{5}{9}(70 - 32) = \tfrac{5}{9}(38) = 21.1\,^\circ\mathrm{C}$ — room temperature, which makes sense.

Note that the inverse is *not* $\tfrac{5}{9}F - 32$. The $32$ was added last, so it has to be removed first.
:::

::: key Functions
A function assigns one output $f(x)$ to each input $x$ in its **domain**; the set of outputs is its **range**. Write physical domains in interval notation and check them. $f(a+b) \neq f(a) + f(b)$ in general. Composition $(f \circ g)(x) = f(g(x))$ applies $g$ first; order matters. A function has an inverse $f^{-1}$, with $f^{-1}(f(x)) = x$, exactly when it is one-to-one (passes the horizontal line test); find it by solving $y = f(x)$ for $x$; its domain is the range of $f$. $f^{-1}$ is not $1/f$.
:::

::: note Functions of several inputs
Nothing here needs a single input. A rocket engine's thrust depends on the pressure inside its chamber *and* the air pressure outside, $F(p_c, p_a)$. Gravity on another planet is $g(\mu, r)$. Domain, range and composition mean the same things with more inputs, and inverting becomes "solve for one input, given the output and the others". When a formula has several symbols, decide which are inputs and which are fixed settings (**parameters**) before you call it a function.
:::

## Check yourself

::: check
Give the natural domain of $f(x) = \dfrac{\sqrt{x - 2}}{x - 5}$, in interval notation.
:::

::: answer
The square root needs $x - 2 \geq 0$, so $x \geq 2$. The bottom cannot be zero, so $x \neq 5$. The domain is $[2, 5) \cup (5, \infty)$ — every number from $2$ upward, except $5$. The square bracket says $2$ itself is allowed ($\sqrt{0} = 0$ is fine); the round ones leave out $5$.
:::

::: check
With $f(x) = 3x - 1$ and $g(x) = x^2$, compute $f(g(2))$, $g(f(2))$, and a formula for $(g \circ f)(x)$.
:::

::: answer
Inside out. $g(2) = 4$, so $f(g(2)) = f(4) = 3 \cdot 4 - 1 = 11$. And $f(2) = 5$, so $g(f(2)) = g(5) = 25$. Different, because the order is different.

In general $(g \circ f)(x) = g(3x - 1) = (3x - 1)^2 = 9x^2 - 6x + 1$. Check at $x = 2$: $36 - 12 + 1 = 25$, matching.
:::

::: check
A stage's remaining propellant is $m_p(t) = 400 - 2.5t$ tonnes, with $t$ in seconds after ignition. State its physical domain and range, then find the inverse function and say what it is for.
:::

::: answer
The propellant runs out when $400 - 2.5t = 0$, which is at $t = 400 / 2.5 = 160\,\mathrm{s}$. So the domain is $[0, 160]\,\mathrm{s}$. It is a line going down, so evaluate at the ends: $m_p(0) = 400$ and $m_p(160) = 0$. The range is $[0, 400]\,\mathrm{t}$.

A line that only goes down is one-to-one. Solve $m_p = 400 - 2.5t$ for $t$: add $2.5t$ and take away $m_p$ to get $2.5t = 400 - m_p$, then divide by $2.5$: $t = (400 - m_p)/2.5 = 160 - 0.4\,m_p$. Its domain is $[0, 400]\,\mathrm{t}$. It tells you *when* a given amount of propellant is left — for example, $100\,\mathrm{t}$ are left at $t = 160 - 0.4 \times 100 = 120\,\mathrm{s}$.
:::

::: check
Why does $g(r) = \mu / r^2$ have an inverse on $[R, \infty)$, but $h(t) = 100 + 20t - 4.903t^2$ has none on $[0, 6.99]$? Find the inverse of $g$ and evaluate it at $2.455\,\mathrm{m/s^2}$.
:::

::: answer
$g$ only goes down on $[R, \infty)$, so each value of $g$ comes from one $r$: it passes the horizontal line test. $h$ goes up and then comes down, so every height below the peak is reached twice — once rising, once falling. A horizontal line at $h = 110$ crosses the graph twice, and there is no single "time at which the height was $110$".

To invert $g$: from $g = \mu / r^2$, multiply by $r^2$ and divide by $g$ to get $r^2 = \mu / g$. Take the square root, keeping the positive one since a distance is positive: $r = \sqrt{\mu / g}$.

At $g = 2.455$: $r = \sqrt{3.986 \times 10^{14} / 2.455} = \sqrt{1.624 \times 10^{14}} = 1.274 \times 10^7\,\mathrm{m}$. That is $2R$, twice Earth's radius. It makes sense: the inverse-square law says doubling the distance divides gravity by $2^2 = 4$, and $9.82 / 4 = 2.455$.
:::

::: check
Break $y = \dfrac{1}{\sqrt{R^2 + h^2}}$ into a chain of one-step functions, innermost first.
:::

::: answer
Start with $h$. Square it: $u_1 = h^2$. Add $R^2$: $u_2 = u_1 + R^2$. Take the square root: $u_3 = \sqrt{u_2}$. Take "one over": $y = 1/u_3$.

Four links; the outermost — done last — is "one over". The chain rule will later handle one link at a time, so seeing the four links is the whole of the setup.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Function | one output $f(x)$ per input; $f(a+b) \neq f(a)+f(b)$ except for $f(x) = kx$ |
| Vertical line test | no vertical line crosses a function's graph twice |
| Domain | inputs accepted; natural (formula makes sense) vs physical (model applies) |
| Breakers of the natural domain | division by zero, even root of a negative, log of a non-positive |
| Interval notation | $[a, b]$ includes endpoints, $(a, b)$ excludes them; $\infty$ always gets $($ or $)$ |
| Range | outputs produced; lines: evaluate endpoints; quadratics: vertex at $x = -b/2a$ |
| Piecewise | different rules on different parts of the domain; find the piece first |
| Composition | $(f \circ g)(x) = f(g(x))$, $g$ first; order matters |
| Decomposition | ask "what is done last?" — that is the outer function |
| Shift and scale | $f(t - t_0)$ delays by $t_0$; $f(kt)$ runs $k$ times faster |
| Inverse | exists exactly when one-to-one (horizontal line test); solve $y = f(x)$ for $x$; undo steps in reverse order |
| Inverse domain | domain of $f^{-1}$ is the range of $f$; $f^{-1} \neq 1/f$ |
| Examples | $r = \mu / v^2$ inverts $v = \sqrt{\mu/r}$; $C = \tfrac{5}{9}(F - 32)$ inverts $F = \tfrac{9}{5}C + 32$ |

Next lesson: the one family of functions this module has not handled yet — $a^x$, where the variable sits up in the exponent — and its inverse, the **logarithm**. Together they turn the rocket equation from a mystery into one line of algebra.
