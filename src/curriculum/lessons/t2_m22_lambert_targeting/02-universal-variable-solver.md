---
id: l02-universal-variable-solver
title: "Solving Lambert's problem: Gauss, universal variables, and Izzo"
minutes: 18
covers:
  - "solution methods: Gauss, universal variables / Battin, Izzo"
---

Think about getting a shower to the right temperature. There is one knob and one thing you care about. You turn the knob, feel the water, and turn again — a bit hotter, a bit cooler — until it is right. You never need a formula for "knob angle as a function of temperature". You only need to know which way to turn.

Lambert's problem works the same way. The last lesson showed that once $\mathbf{r}_1$, $\mathbf{r}_2$ and the direction of travel are fixed, the flight time depends on a single number: the size of the orbit. But nobody has ever written the orbit's size as a formula of the flight time. So every solver is a knob-turner. It picks a value of one variable, works out the flight time that value gives, compares with the time you asked for, and adjusts. The methods differ in which knob they turn and how cleverly they turn it.

This lesson builds the method most textbooks and much flight software use, the **universal-variable** method, from pieces you already have. It places that method between the first solution, Gauss's, and the modern one, Izzo's. And it ends the way every solver in this module must end — by flying the answer forward and checking that it really lands on $\mathbf{r}_2$.

## Gauss's method: the first solution, and its limits

Carl Friedrich Gauss worked out the first practical method while **[[recovering the lost dwarf planet Ceres|gauss-ceres]]** in 1801, and published it in 1809. Its knob is a **[[ratio of two areas|gauss-areas]]**. One area is the slice of the ellipse swept out by the line from the focus to the spacecraft, like a slice of pizza with a curved crust. The other is the flat triangle with straight sides joining the focus, $\mathbf{r}_1$ and $\mathbf{r}_2$. The curved slice is always a bit bigger, and how much bigger depends on the orbit.

Gauss's loop goes: guess the ratio, work out the orbit's **semi-latus rectum** $p$ from it, work out the flight time, adjust the ratio, repeat. This kind of loop, where each answer is fed straight back in as the next guess, is called **[[successive substitution|successive-substitution]]**. It needs no derivatives, which mattered when every step was done by hand.

Its weakness is convergence. Successive substitution has no guaranteed speed. It can stall or bounce back and forth on very stretched orbits, and it gets worse and worse as the transfer angle grows, failing near $180°$ — exactly where lesson 4 shows the problem itself turns delicate. You would not write it today. But keep the shape of its loop — guess, compute the time, compare, adjust — because the universal-variable method is that same loop with a much better knob.

## What you already have

Two results from the last module do all the work. First, the Lagrange coefficients $f$ and $g$ written with the transfer angle (from the Lagrange-coefficients lesson). With $h = \sqrt{\mu p}$ the angular momentum per kilogram:

$$
f = 1 - \frac{\mu r_2}{h^2}(1-\cos\Delta\nu) = 1 - \frac{r_2}{p}(1-\cos\Delta\nu), \qquad g = \frac{r_1 r_2 \sin\Delta\nu}{h} .
$$

The second form of $f$ uses $\mu/h^2 = 1/p$.

Second, the same coefficients written with the **universal anomaly** $\chi$ ("chi", said "kye") from the universal-variables lesson:

$$
f = 1 - \frac{\chi^2}{r_1}C(z), \qquad g = \Delta t - \frac{\chi^3}{\sqrt{\mu}}S(z), \qquad z = \alpha\chi^2 ,
$$

where $\alpha = 1/a$. On an ellipse $z = (\Delta E)^2$, the square of the change in eccentric anomaly. On a hyperbola $z$ is negative, and on a parabola it is zero. So the sign of $z$ tells you the shape of the orbit.

$C$ and $S$ are the **Stumpff functions**. They are worth restating, because the solver lives or dies by them.

::: key The Stumpff functions
$$
C(z) = \frac{1-\cos\sqrt{z}}{z}, \qquad S(z) = \frac{\sqrt{z}-\sin\sqrt{z}}{z^{3/2}} \qquad (z > 0),
$$
with the hyperbolic analogs ($\cosh$ and $\sinh$ of $\sqrt{-z}$) for $z < 0$, and $C(0) = \tfrac{1}{2}$, $S(0) = \tfrac{1}{6}$. Near $z = 0$ use the **[[series|stumpff-series]]** $C = \tfrac{1}{2} - \tfrac{z}{24} + \tfrac{z^2}{720} - \cdots$ and $S = \tfrac{1}{6} - \tfrac{z}{120} + \tfrac{z^2}{5040} - \cdots$ to avoid cancellation.
:::

## Joining the two descriptions

Both pairs of formulas describe the *same* orbit between the *same* two moments. So the two $f$'s must be equal, and the two $g$'s must be equal. Setting them equal is the whole derivation. First, one piece of shorthand:

$$
y \equiv \chi^2 C(z) .
$$

$y$ is a length, in kilometers. It is only a name for now. With it, the universal $f$ reads $f = 1 - y/r_1$.

### Step 1: the two $f$'s give $p$

Set $1 - y/r_1$ equal to $1 - (r_2/p)(1-\cos\Delta\nu)$. The ones cancel. Multiply both sides by $r_1$ and solve for $p$:

$$
\frac{y}{r_1} = \frac{r_2(1-\cos\Delta\nu)}{p} \quad\Longrightarrow\quad p = \frac{r_1 r_2(1-\cos\Delta\nu)}{y} .
$$

So once you know $y$, you know the orbit's **[[semi-latus rectum|semi-latus-rectum]]**.

### Step 2: the two $g$'s give the flight time

Put that $p$ into the transfer-angle $g$, using $h = \sqrt{\mu p}$:

$$
g = \frac{r_1 r_2\sin\Delta\nu}{\sqrt{\mu}\,\sqrt{r_1 r_2 (1-\cos\Delta\nu)/y}} = \sin\Delta\nu\sqrt{\frac{r_1r_2}{1-\cos\Delta\nu}}\;\sqrt{\frac{y}{\mu}} = A\sqrt{\frac{y}{\mu}} .
$$

The first step flipped the square root of the fraction into the top. The second step spotted last lesson's $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ sitting there.

Now set this equal to the universal $g$, $\Delta t - \chi^3S/\sqrt{\mu}$. Move the $\chi^3$ term across and multiply through by $\sqrt{\mu}$:

$$
\sqrt{\mu}\,\Delta t = \chi^3 S(z) + A\sqrt{y} .
$$

Because $\sqrt{y} = \chi\sqrt{C(z)}$, this is the equation in its usual form.

::: key The Lambert time-of-flight equation
$$
\sqrt{\mu}\,\Delta t = \chi^3 S(z) + A\chi\sqrt{C(z)}, \qquad \chi = \sqrt{\frac{y}{C(z)}}, \qquad A = \sin\Delta\nu\sqrt{\frac{r_1r_2}{1-\cos\Delta\nu}} .
$$
Given $z$, this equation and $y(z)$ below determine $\Delta t$; Lambert's problem asks for the $z$ that reproduces the required $\Delta t$.
:::

### Step 3: $y$ as a function of $z$ alone

One piece is missing. The equation still contains $y$, and we want everything in terms of the knob $z$. Matching one more pair of Lagrange coefficients — the rates $\dot f$ — supplies it:

$$
y(z) = r_1 + r_2 + A\,\frac{zS(z)-1}{\sqrt{C(z)}} .
$$

Now pick any $z$. The Stumpff functions give $C$ and $S$. Then $y$, then $\chi = \sqrt{y/C}$, then the flight time. One number in, one flight time out — a knob and a reading.

::: note Why it has to be true: the formula for $y(z)$
The last module gave $\dot f$ both ways. In universal variables, $\dot f = \dfrac{\sqrt{\mu}}{r_1 r_2}\,\chi\,(zS - 1)$. With the transfer angle,

$$
\dot f = \sqrt{\frac{\mu}{p}}\;\frac{1-\cos\Delta\nu}{\sin\Delta\nu}\left[\frac{1-\cos\Delta\nu}{p} - \frac{1}{r_1} - \frac{1}{r_2}\right] .
$$

Step 1 gave $(1-\cos\Delta\nu)/p = y/(r_1r_2)$. So the bracket is $\dfrac{y}{r_1r_2} - \dfrac{r_1 + r_2}{r_1r_2} = \dfrac{y - r_1 - r_2}{r_1 r_2}$.

The factor in front is $\sqrt{\mu}\,\sqrt{\dfrac{y}{r_1r_2(1-\cos\Delta\nu)}}\,\dfrac{1-\cos\Delta\nu}{\sin\Delta\nu} = \dfrac{\sqrt{\mu}\,\sqrt{y}\,\sqrt{1-\cos\Delta\nu}}{\sqrt{r_1r_2}\,\sin\Delta\nu} = \dfrac{\sqrt{\mu}\,\sqrt{y}}{A}$, using the definition of $A$ in the last step.

Setting the two $\dot f$'s equal and canceling $\sqrt{\mu}/(r_1r_2)$ from both sides:

$$
\chi\,(zS-1) = \frac{\sqrt{y}}{A}\,(y - r_1 - r_2) .
$$

Put in $\chi = \sqrt{y}/\sqrt{C}$, cancel $\sqrt{y}$, multiply by $A$, and add $r_1 + r_2$:

$$
y = r_1 + r_2 + A\,\frac{zS - 1}{\sqrt{C}} .
$$
:::

This module does not take a formula on trust, even one it has derived. So test it on a case whose answer is known. Pick a starting position and velocity, fly them forward with the last module's propagator to get $\mathbf{r}_2$, and note the true $\chi$ and $z$ the propagator used. Then compute $y_{\text{true}} = \chi^2 C(z)$ directly, and compare it with $y(z)$ from the formula, which uses only $z$, $r_1$, $r_2$ and $A$. Done for a $122°$ transfer and separately for a $254°$ transfer (where $A < 0$), the two agree to about one part in $10^{15}$ — the limit of the computer's arithmetic.

One more link closes the circle with last lesson. The semi-major axis is $a = \chi^2/z = y/\big(z\,C(z)\big)$. Both $a$ and $\Delta t$ are now formulas in $z$, $r_1 + r_2$ and $A$ only — and since $A^2 = 2s(s-c)$, only in $z$, $s$ and $c$. That is Lambert's theorem, now visible in the solver's own equations.

## Solving $F(z) = 0$

Turn the time equation into "something equals zero" so a root-finder can chase it:

$$
F(z) = \chi(z)^3 S(z) + A\,\chi(z)\sqrt{C(z)} - \sqrt{\mu}\,\Delta t, \qquad \chi(z) = \sqrt{y(z)/C(z)} .
$$

Which values of $z$ are allowed for a single arc with no extra loops?

- **Upper end.** On an ellipse $z = (\Delta E)^2$, and one whole lap is $\Delta E = 2\pi$. So the single-arc family stops at $z = (2\pi)^2 \approx 39.48$. As $z$ approaches it, $C(z)$ goes to zero, $\chi$ blows up, and the flight time runs off to infinity. Past it you are in the one-lap family, next lesson's subject.
- **Lower end.** Going down through negative $z$ means ever faster hyperbolas. When $A > 0$, $y(z)$ eventually turns negative and $\chi$ stops being a real number; that is the lower edge. When $A < 0$ (the long way), $y$ never turns negative, and very negative $z$ is allowed.

Across that whole range the flight time **[[rises steadily|tof-curve]]**, from nearly zero up to infinity. So $F$ goes from negative to positive exactly once: there is exactly one single-arc solution for each direction of travel.

That shape makes the search easy. A **bracketing** method keeps two values of $z$, one where $F < 0$ and one where $F > 0$, and shrinks the gap between them. The simplest, **bisection**, tests the midpoint and keeps the half where the sign still changes. Brent's method is a faster relative. Neither needs a derivative or a clever first guess. **Newton's method** also works and closes in faster near the root. It needs $F'(z)$, which the Stumpff derivative rules from the universal-variables lesson supply. The choice is about speed and safety, not correctness. The numbers in this module come from a bracketing solve, for its reliability.

Once $z$ is found, the orbit follows directly, without ever computing an orbital element:

$$
y = y(z), \qquad f = 1-\frac{y}{r_1}, \qquad g = A\sqrt{\frac{y}{\mu}}, \qquad \dot{g} = 1-\frac{y}{r_2},
$$

$$
\mathbf{v}_1 = \frac{\mathbf{r}_2 - f\mathbf{r}_1}{g}, \qquad \mathbf{v}_2 = \frac{\dot{g}\,\mathbf{r}_2 - \mathbf{r}_1}{g} .
$$

The first velocity formula is $\mathbf{r}_2 = f\mathbf{r}_1 + g\mathbf{v}_1$, solved for $\mathbf{v}_1$. The second is the reverse relation $\mathbf{r}_1 = \dot g\,\mathbf{r}_2 - g\,\mathbf{v}_2$ from the Lagrange-coefficients lesson, solved for $\mathbf{v}_2$. You never need $\dot f$.

## Izzo's reformulation

The universal-variable method is what most textbooks teach and what much flight software ran for decades. It has soft spots. Near $z = 0$ the Stumpff functions need their series. The lower end of the $z$ range moves around from one geometry to the next and must be found each time. And the extra-lap searches of the next lesson need careful hand-holding.

In 2015 Dario Izzo published a reformulation, building on earlier work by Lancaster, Blanchard and Gooding. It searches along a different variable, $x$. For every geometry, ellipses fill the range $-1 < x < 1$, the parabola sits at exactly $x = 1$, and hyperbolas have $x > 1$. Fixed landmarks like these make the search well scaled whatever the two points are. Izzo also writes the first three derivatives of the flight time with respect to $x$ exactly. That lets him use **[[Householder's method|householder]]**, a higher-order cousin of Newton's method, which typically lands on the answer in two or three steps from a fitted first guess, with no bracket search at all. The same framework handles the extra-lap branches cleanly.

Nothing in Izzo's method changes what Lambert's problem *is*. The physics, the theorem and the answer are identical. What improves is speed and robustness at the edges: near-parabolic trips, angles near $180°$, and many-lap searches. That is why modern tools use it — and why you should build the universal-variable version first. Read Izzo's paper once you have your own working solver, so you have something to check the faster one against.

## Solve it, then prove it

::: example Curtis's benchmark transfer, solved
Take $\mathbf{r}_1 = (5000,\ 10\,000,\ 2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,\ 2500,\ 7000)\,\mathrm{km}$, $\Delta t = 3600\,\mathrm{s}$, prograde (counterclockwise seen from above the $xy$-plane), no extra laps. From last lesson, $r_1 = 11\,375.852\,\mathrm{km}$ and $r_2 = 16\,383.223\,\mathrm{km}$.

**Step 1 — the transfer angle.** The dot product is $\mathbf{r}_1\cdot\mathbf{r}_2 = -73\,000\,000 + 25\,000\,000 + 14\,700\,000 = -3.33\times 10^7\,\mathrm{km^2}$. Divide by $r_1 r_2 = 1.86373\times10^8\,\mathrm{km^2}$ to get $\cos\Delta\nu = -0.178674$, so the angle between the vectors is $100.293°$. The $z$-component of $\mathbf{r}_1\times\mathbf{r}_2$ is $1.585\times10^8$, positive, so counterclockwise travel takes the short way: $\Delta\nu = 100.293°$.

**Step 2 — $A$.** $\sin\Delta\nu = 0.983908$ and $1-\cos\Delta\nu = 1.178674$, so
$$
A = 0.983908\times\sqrt{\frac{1.86373\times10^8}{1.178674}} = 0.983908 \times 12\,574.62 = 12\,372.272\,\mathrm{km} .
$$

**Step 3 — bracket the root.** At $z = 0$ (a parabola) the flight time comes out $2761\,\mathrm{s}$, short of $3600\,\mathrm{s}$, so $F(0) < 0$. Near $z = 39.47$ the time is enormous, so $F > 0$. The root lies between, at positive $z$: the answer is an ellipse.

**Step 4 — solve.** The bracketing search converges to $z = 1.53986$. There $C = 0.439044$ and $S = 0.154295$, so
$$
y = 27\,759.075 + 12\,372.272\times\frac{-0.762408}{0.662604} = 13\,523.243\,\mathrm{km}, \qquad \chi = \sqrt{\frac{13\,523.243}{0.439044}} = 175.504 .
$$
Check the time: $\chi^3 S = 834\,088$ and $A\sqrt{y} = 1\,438\,765$; their sum divided by $\sqrt{\mu} = 631.348$ is $3600.0\,\mathrm{s}$. Correct.

**Step 5 — the coefficients.**
$$
f = 1 - \frac{13\,523.243}{11\,375.852} = -0.188768, \qquad g = 12\,372.272\sqrt{\frac{13\,523.243}{398\,600.4418}} = 2278.878\,\mathrm{s}, \qquad \dot g = 1 - \frac{13\,523.243}{16\,383.223} = 0.174568 .
$$

**Step 6 — the velocities.** $\mathbf{r}_2 - f\mathbf{r}_1 = (-13\,656.16,\ 4387.68,\ 7396.41)\,\mathrm{km}$; divide by $g$:
$$
\mathbf{v}_1 = (-5.99250,\ 1.92537,\ 3.24564)\,\mathrm{km/s} .
$$
And $\dot g\,\mathbf{r}_2 - \mathbf{r}_1 = (-7548.69,\ -9563.58,\ -878.03)\,\mathrm{km}$; divide by $g$:
$$
\mathbf{v}_2 = (-3.31246,\ -4.19662,\ -0.38529)\,\mathrm{km/s} .
$$

**Sanity check.** Curtis publishes $(-5.9925,\ 1.9254,\ 3.2456)$ and $(-3.3125,\ -4.1966,\ -0.38529)\,\mathrm{km/s}$. They match. The orbit has $a = y/(zC) = 20\,003\,\mathrm{km}$, well above last lesson's $a_{\min} = 12\,327\,\mathrm{km}$, as a fast one-hour trip should be.
:::

Matching a textbook's rounded answer is a good sign, but it is not proof. A coding error and a lucky rounding can look the same in four printed digits. The proof is to take $\mathbf{v}_1$ and check, independently, that it gets you to $\mathbf{r}_2$.

::: example Closing the loop: fly the answer forward
**Step 1.** Take $\mathbf{r}_1$ and $\mathbf{v}_1 = (-5.99250,\ 1.92537,\ 3.24564)\,\mathrm{km/s}$ from above.

**Step 2.** Propagate them forward $3600\,\mathrm{s}$ with the last module's universal Kepler solver and Lagrange coefficients — the same propagator you already trust, no new code. It returns
$$
\mathbf{r}(3600\,\mathrm{s}) = (-14\,600.000000,\ 2500.000000,\ 7000.000000)\,\mathrm{km} .
$$

**Step 3.** Subtract the target. The miss, $\lVert\mathbf{r}(3600\,\mathrm{s})-\mathbf{r}_2\rVert$, is about $1\times10^{-11}\,\mathrm{km}$ — around ten nanometers.

**Sanity check.** Is ten nanometers "zero"? A computer stores about 16 significant digits, and the coordinates are around $10^4\,\mathrm{km}$. So the smallest step it can even represent there is about $10^4 \times 2\times10^{-16} \approx 2\times10^{-12}\,\mathrm{km}$. A miss a few times that is **[[as close as the arithmetic allows|double-precision]]**. The solver is right.
:::

The tiny miss comes from solving $F(z) = 0$ very tightly. Loosen that, and the miss grows in step. An error of $10^{-8}$ in $z$ misses $\mathbf{r}_2$ by about $3\,\mathrm{cm}$. An error of $10^{-4}$ misses by about $300\,\mathrm{m}$. Three centimeters is excellent for any real mission. The point is the link itself: how precisely you solve for $z$ sets how precisely you land. That link, not a textbook match, is what tells you the solver is built right.

::: warning $A$ is positive only on the short way
$A$ takes the sign of $\sin\Delta\nu$: positive for $\Delta\nu < 180°$, negative for $\Delta\nu > 180°$. The formulas above work with either sign, and the next lesson uses a long-way transfer with negative $A$. But a solver that quietly assumes $A > 0$ — say, by computing it as $\sqrt{2s(s-c)}$ and dropping the sign — returns the wrong orbit, or fails, the moment someone asks for the long way round.
:::

## Check yourself

::: check
In one or two sentences: why is Gauss's method, though first and correct, not what you would write today?
:::

::: answer
It iterates by successive substitution on the area ratio, which has no guaranteed speed of convergence and breaks down for very stretched orbits and for transfer angles near $180°$. Modern methods — universal variables with a bracketing or Newton search, or Izzo's Householder iteration — converge reliably and much faster, including at those edge cases.
:::

::: check
In $\sqrt{\mu}\,\Delta t = \chi^3 S(z) + A\chi\sqrt{C(z)}$, which quantities are known before the search starts, and which depend on $z$?
:::

::: answer
Known before the search: $\mu$, $\Delta t$, and $A$. $A$ depends only on $r_1$, $r_2$ and $\Delta\nu$, which the problem statement and the chosen direction fix.

Depending on $z$: the Stumpff functions $C(z)$ and $S(z)$, then $y(z)$ built from them and $A$, then $\chi(z) = \sqrt{y(z)/C(z)}$. So the whole right-hand side is a function of $z$ alone, and the search looks for the $z$ that makes it equal the known left-hand side.
:::

::: check
Why can a bracketing method (bisection or Brent's method) solve the single-arc case without $F'(z)$, while Newton's method needs it?
:::

::: answer
On the single-arc range, $F(z)$ only ever increases, from negative to positive. So it changes sign exactly once, and a bracketing method that keeps one point on each side of the sign change is guaranteed to close in on that one root using only values of $F$.

Newton's method uses the slope $F'(z)$ to decide how far to step. It is faster near the root, but it needs that derivative at every step, and from a poor first guess it can step outside the allowed range, where $y(z) < 0$. Bracketing avoids both problems at the cost of a few more evaluations.
:::

::: check
A colleague's solver returns a $\mathbf{v}_1$ that, flown forward by the requested $\Delta t$ with a trusted propagator, lands $40\,\mathrm{km}$ from $\mathbf{r}_2$. Is that acceptable? What would you check first?
:::

::: answer
No. A correct universal-variable solver misses by an amount set by its tolerance on $z$ — centimeters or less is normal. $40\,\mathrm{km}$ means a real bug, not rounding.

Check first: the transfer angle (is $\Delta\nu$ worked out with the right prograde/retrograde logic, so short way and long way are not swapped?), the sign of $A$ (does it match $\sin\Delta\nu$?), and the Stumpff functions near $z \approx 0$ (are they using the series there, rather than the cosine formula that loses its digits?).
:::

::: check
Without redoing the derivation, explain why $A^2 = 2s(s-c)$ from last lesson is what makes $g = A\chi\sqrt{C(z)}/\sqrt{\mu}$ agree with Lambert's theorem.
:::

::: answer
$g$ is built from $A$, and so are $y(z)$ and the time equation. If $A$ depended on $r_1$ and $r_2$ separately, the flight time would too, and the theorem would be false. Because $A^2 = 2s(s-c)$ depends only on $s$ and $c$, everything built from $A$ — $g$, $y(z)$ and finally $\Delta t(z)$ — depends on the geometry only through $s$ and $c$. That is the theorem, carried into the solver's own equations.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $C(z)$, $S(z)$ | Stumpff functions; $C(0)=\tfrac12$, $S(0)=\tfrac16$; use the series near $z=0$ |
| $y = \chi^2C(z)$ | Shorthand; $p = r_1r_2(1-\cos\Delta\nu)/y$ |
| $y(z) = r_1+r_2+A(zS(z)-1)/\sqrt{C(z)}$ | Closes the system; from matching $\dot f$ |
| $F(z) = \chi^3S(z)+A\chi\sqrt{C(z)}-\sqrt{\mu}\Delta t$ | The equation to solve; rises steadily on the single-arc range |
| Single-arc range | From where $y$ turns negative (or $-\infty$ if $A<0$) up to $z=(2\pi)^2$ |
| $f=1-y/r_1$, $g=A\sqrt{y/\mu}$, $\dot g=1-y/r_2$ | Lagrange coefficients at the solution |
| $\mathbf{v}_1=(\mathbf{r}_2-f\mathbf{r}_1)/g$, $\mathbf{v}_2=(\dot g\,\mathbf{r}_2-\mathbf{r}_1)/g$ | The answer |
| Gauss (1809) | Area ratio, successive substitution; slow, fails near $180°$ |
| Universal variables / Battin | One smooth equation in $z$ for every conic |
| Izzo (2015) | Variable $x$: ellipses in $(-1,1)$, parabola at $1$; Householder steps, exact derivatives |
| Proof of correctness | Fly $\mathbf{v}_1$ forward by $\Delta t$; the miss should match the solver's tolerance |

The next lesson uses this same $F(z)$, unchanged, to explore the rest of its range: the long way round for the same two points, and the pairs of solutions that appear once the flight time is long enough to loop around the focus one or more extra times.

::: context gauss-ceres The planet that got lost
On 1 January 1801 Giuseppe Piazzi spotted a new object, Ceres, and tracked it for about six weeks before it slipped into the Sun's glare. Nobody knew where it would reappear. The 24-year-old Gauss worked out its orbit from those few sightings, and astronomers found it again at the end of 1801 very close to where he said. His method, published in 1809 in *Theoria Motus*, contains the two-position, one-time problem at its core — the one this lesson solves.
:::

::: context gauss-areas Slice versus triangle
Gauss compared two areas for the same pair of points. The shaded slice runs from the focus out to the curved orbit; the triangle has a straight side, the chord, instead. For the one-hour Curtis transfer drawn here the slice is $1.58$ times the triangle. A different orbit through the same two points bulges out a different amount, so the ratio labels the orbit — and that label was the knob Gauss turned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="96.6,108.0 97.6,120.5 100.4,132.6 105.0,144.2 111.2,154.9 118.8,164.5 127.4,173.0 136.8,180.2 146.8,186.2 157.2,190.8 167.6,194.3 178.0,196.5 188.2,197.8 198.0,198.1 207.4,197.6 216.3,196.4 224.7,194.5 232.6,192.1 240.0,189.2 246.8,186.0 253.1,182.4 258.9,178.5 264.2,174.5 269.0,170.2 273.4,165.8 277.3,161.3 280.8,156.7 284.0,152.0 286.7,147.2 289.1,142.4 291.1,137.5 292.8,132.6 294.2,127.7 295.3,122.8 296.1,117.9 296.5,112.9 296.7,108.0 296.5,103.1 296.1,98.1 295.3,93.2 294.2,88.3 292.8,83.4 291.1,78.5 289.1,73.6 286.7,68.8 284.0,64.0 280.8,59.3 277.3,54.7 273.4,50.2 269.0,45.8 264.2,41.5 258.9,37.5 253.1,33.6 246.8,30.0 240.0,26.8 232.6,23.9 224.7,21.5 216.3,19.6 207.4,18.4 198.0,17.9 188.2,18.2 178.0,19.5 167.6,21.7 157.2,25.2 146.8,29.8 136.8,35.8 127.4,43.0 118.8,51.5 111.2,61.1 105.0,71.8 100.4,83.4 97.6,95.5 96.6,108.0"/>
  <path d="M 240 108 L 296.2 117.1 L 296.6 110.5 L 296.6 103.8 L 295.9 97.2 L 294.8 90.6 L 293.1 84.1 L 290.8 77.6 L 287.9 71.1 L 284.4 64.7 L 280.2 58.4 L 275.2 52.3 L 269.6 46.3 L 263.1 40.6 L 255.8 35.3 L 247.6 30.4 L 238.4 26.1 Z" fill="#f2b880" stroke="none"/>
  <polygon points="240,108 296.2,117.1 238.4,26.1" fill="#8fb8f0" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="240" cy="108" r="5" fill="#1f2a44"/>
  <circle cx="296.2" cy="117.1" r="4" fill="#1f2a44"/>
  <circle cx="238.4" cy="26.1" r="4" fill="#1f2a44"/>
  <text x="232" y="124" font-size="12" fill="#1f2a44" text-anchor="end">focus</text>
  <text x="304" y="130" font-size="12" fill="#1f2a44">r₁</text>
  <text x="232" y="20" font-size="12" fill="#1f2a44" text-anchor="end">r₂</text>
  <text x="12" y="30" font-size="12" fill="#1f2a44">orange + blue: slice</text>
  <text x="12" y="48" font-size="12" fill="#1f2a44">blue: triangle</text>
  <text x="12" y="66" font-size="12" fill="#1f2a44">ratio 1.58</text>
</svg>
```
:::

::: context successive-substitution Feeding the answer back in
**Successive substitution** means: plug a guess into a formula, take what comes out as your next guess, and repeat. For $x = \cos x$, start at $x = 1$: you get $0.540$, then $0.858$, then $0.654$, and after a few dozen rounds the numbers settle near $0.739$. It is simple and needs no slopes. But the numbers may settle slowly, bounce around, or run away, depending on the formula — and there is no built-in promise which.
:::

::: context stumpff-series Why the series near zero
At tiny $z$, $\cos\sqrt{z}$ is extremely close to $1$, and $1 - \cos\sqrt{z}$ subtracts two nearly equal numbers. The digits they share cancel and only rounding noise is left. With $z = 10^{-12}$, a computer's $(1-\cos\sqrt{z})/z$ gives $0.50004$ instead of $0.5$ — wrong in the fifth digit. For $z$ around $10^{-16}$ and smaller, $\cos\sqrt{z}$ rounds to exactly $1$ and the formula returns zero. The series $\tfrac12 - z/24 + \cdots$ has no subtraction of near-equal numbers and stays accurate.
:::

::: context semi-latus-rectum The width at the focus
The **semi-latus rectum** $p$ ("half the straight side", from Latin) is how far the orbit is from the focus when you look straight across, at right angles to the long axis. It sets the orbit's angular momentum, $h = \sqrt{\mu p}$. Drawn here for the one-hour Curtis transfer: $p = 16\,244\,\mathrm{km}$, $a = 20\,003\,\mathrm{km}$, $e = 0.433$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2.5" points="96.6,108.0 97.6,120.5 100.4,132.6 105.0,144.2 111.2,154.9 118.8,164.5 127.4,173.0 136.8,180.2 146.8,186.2 157.2,190.8 167.6,194.3 178.0,196.5 188.2,197.8 198.0,198.1 207.4,197.6 216.3,196.4 224.7,194.5 232.6,192.1 240.0,189.2 246.8,186.0 253.1,182.4 258.9,178.5 264.2,174.5 269.0,170.2 273.4,165.8 277.3,161.3 280.8,156.7 284.0,152.0 286.7,147.2 289.1,142.4 291.1,137.5 292.8,132.6 294.2,127.7 295.3,122.8 296.1,117.9 296.5,112.9 296.7,108.0 296.5,103.1 296.1,98.1 295.3,93.2 294.2,88.3 292.8,83.4 291.1,78.5 289.1,73.6 286.7,68.8 284.0,64.0 280.8,59.3 277.3,54.7 273.4,50.2 269.0,45.8 264.2,41.5 258.9,37.5 253.1,33.6 246.8,30.0 240.0,26.8 232.6,23.9 224.7,21.5 216.3,19.6 207.4,18.4 198.0,17.9 188.2,18.2 178.0,19.5 167.6,21.7 157.2,25.2 146.8,29.8 136.8,35.8 127.4,43.0 118.8,51.5 111.2,61.1 105.0,71.8 100.4,83.4 97.6,95.5 96.6,108.0"/>
  <line x1="96.6" y1="108" x2="296.7" y2="108" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="240" y1="108" x2="240" y2="26.8" stroke="#b4232c" stroke-width="3"/>
  <circle cx="240" cy="108" r="5" fill="#1f2a44"/>
  <text x="248" y="72" font-size="13" fill="#b4232c">p</text>
  <text x="240" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">focus</text>
  <text x="150" y="100" font-size="12" fill="#6c7a93" text-anchor="middle">long axis</text>
</svg>
```
:::

::: context tof-curve The knob and the reading
Flight time against $z$ for the Curtis pair, going the short way. The curve climbs steadily, so the flat line at $3600\,\mathrm{s}$ crosses it exactly once, at $z = 1.54$. The parabola ($z = 0$) takes $2761\,\mathrm{s}$; slower trips need $z > 0$, ellipses. Off the right edge the curve keeps climbing, to infinity at $z = 4\pi^2 \approx 39.5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="125" x2="340" y2="125" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="135.3" y1="170" x2="135.3" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="62.0,170.0 66.3,163.7 70.5,160.9 74.7,158.7 78.9,156.8 83.1,155.0 87.3,153.3 91.5,151.6 95.7,150.0 99.9,148.5 104.2,146.9 108.4,145.4 112.6,143.9 116.8,142.3 121.0,140.8 125.2,139.3 129.4,137.7 133.6,136.1 137.8,134.5 142.1,132.9 146.3,131.2 150.5,129.6 154.7,127.9 158.9,126.1 163.1,124.3 167.3,122.5 171.5,120.7 175.7,118.8 180.0,116.9 184.2,114.9 188.4,112.9 192.6,110.8 196.8,108.6 201.0,106.5 205.2,104.2 209.4,101.9 213.6,99.5 217.8,97.1 222.1,94.6 226.3,92.0 230.5,89.4 234.7,86.7 238.9,83.9 243.1,81.0 247.3,78.0 251.5,74.9 255.7,71.8 260.0,68.5 264.2,65.1 268.4,61.6 272.6,58.0 276.8,54.3 281.0,50.5 285.2,46.5 289.4,42.4 293.6,38.2 297.9,33.8 302.1,29.2 306.3,24.5 310.5,19.7"/>
  <circle cx="161.6" cy="125" r="5" fill="#b4232c"/>
  <text x="165" y="146" font-size="12" fill="#b4232c">root z = 1.54</text>
  <text x="338" y="119" font-size="12" fill="#6c7a93" text-anchor="end">Δt = 3600 s</text>
  <text x="46" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44" text-anchor="end">12k</text>
  <text x="50" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">−5</text>
  <text x="135.3" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="220.6" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="305.9" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="195" y="201" font-size="12" fill="#1f2a44" text-anchor="middle">z</text>
  <text x="58" y="34" font-size="12" fill="#1f2a44">Δt (s)</text>
</svg>
```
:::

::: context householder Newton's method with more gears
Newton's method fits a straight line to the function where you stand and jumps to where the line hits zero. Each step roughly doubles the number of correct digits. Alston Householder's family of methods fits curves that also match the function's bend (second derivative) and more. The third-order version Izzo uses roughly triples the correct digits per step. That only pays off when the derivatives are cheap, which is exactly what Izzo's exact formulas make them.
:::

::: context double-precision How precise a computer can be
Ordinary computer arithmetic, called double precision, keeps about 16 significant digits. So a number near $15\,000\,\mathrm{km}$ can only be pinned down to within about $2\times10^{-12}\,\mathrm{km}$, a couple of nanometers. Every step of a calculation can add an error that size. When a check lands within a few of those steps of perfect, it has hit the floor: there is nothing more to gain, and nothing is wrong.
:::
