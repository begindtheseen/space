---
id: l09-inequalities
title: Inequalities and design constraints
minutes: 24
covers:
  - inequalities
---

"You must be at least $48$ inches tall to ride." "Speed limit $65$." "Carry-on bags must weigh no more than $10\,\mathrm{kg}$." None of these rules gives an exact number. Each gives an allowed *range*. An equation says what a quantity *is*. These rules say what it *must not go over* or *must at least reach*. Statements like that are **inequalities**.

Most of what an engineer has to say about a vehicle is an inequality. Thrust must be more than weight, or the rocket sits on the pad. The air pushing on the nose cone (the dynamic pressure) must stay below what the structure can take, or the cone breaks. The navigation error must stay inside the landing zone. A design is a set of inequalities that are all true at the same time. A launch vehicle's requirements document is really a long list of "at most" and "at least".

You solve inequalities with almost the same moves as equations: add the same thing to both sides, multiply both sides by the same thing. There is one difference, and it causes nearly every mistake: multiplying or dividing by a negative number flips the direction of the sign. This lesson shows *why* it flips, then works through the kinds of inequality you will actually meet — straight-line ones, tolerances with absolute values, curved (quadratic) ones, and ones with exponentials inside. The answer to an inequality is usually a range, not a single number — as most real answers are.

## What an inequality says

Four symbols compare two numbers by where they sit on the number line:

- $a < b$, "a is less than b": $a$ is to the left of $b$.
- $a \leq b$, "a is less than or equal to b", or "a is at most b": left of $b$, or on it.
- $a > b$, "a is greater than b": $a$ is to the right.
- $a \geq b$, "a is greater than or equal to b", or "a is at least b".

A handy memory trick: the pointy end of $<$ points at the smaller number.

Any two numbers fit exactly one of $a < b$, $a = b$ or $a > b$. An inequality with an unknown in it, such as $3x - 7 < 5$, is true for some values of $x$ and false for others. To **solve** it means to find every value that makes it true. That collection of values is the **solution set**.

A **compound inequality** joins two conditions. An "and" is written as a chain: $2 < x \leq 5$ means $x$ is more than $2$ *and* at most $5$. In the interval notation from the functions lesson this is $(2, 5]$ — a round bracket means the end is left out, a square bracket means it is included. An "or" uses the word "or", or the **union** sign $\cup$ (read "union", meaning "either piece"): "$x < -1$ or $x > 3$" is $(-\infty, -1) \cup (3, \infty)$, where $\infty$ ("infinity") means the piece runs on forever in that direction. A chain always has both signs pointing the same way. $2 < x > 5$ is not a statement at all.

## The legal moves

Two inequalities are **equivalent** if they have exactly the same solution set. The legal moves are the ones that keep the solution set the same.

**Adding the same number to both sides.** You are shorter than your friend. You both step onto the same $20\,\mathrm{cm}$ box. You are still shorter. On the number line, adding $c$ slides both points the same distance the same way, so the one on the left stays on the left: if $a < b$, then $a + c < b + c$, for any $c$, positive or negative. Subtracting is adding a negative. So terms move across an inequality sign exactly as they move across an equals sign.

**Multiplying both sides by a positive number.** You have $2$ dollars and your friend has $5$. Both of you triple your money. You still have less: $6 < 15$. Multiplying by a positive $k$ stretches the number line away from zero (or squeezes it towards zero) without turning it around, so $ka < kb$. Dividing by a positive number is multiplying by its flip, so it is allowed too.

**Multiplying both sides by a negative number.** Now the surprise. You have $2$ dollars and your friend has $5$, so $2 < 5$. Turn both amounts into *debts* — multiply by $-1$. Now you owe $2$ and your friend owes $5$. Who is better off? You are: $-2 > -5$, because $-2$ is to the right of $-5$ on the number line. Multiplying by a negative number mirrors the number line through zero, and what was on the left ends up on the right. In general:

$$
a < b \;\text{ and }\; k < 0 \quad\Rightarrow\quad ka > kb .
$$

(The arrow $\Rightarrow$ is read "implies" or "so".)

Try it. Solve $-3x + 7 > 1$.

1. Subtract $7$ from both sides: $-3x > -6$.
2. Divide both sides by $-3$ — a negative number — and *flip the sign*: $x < 2$.

The solution set is $(-\infty, 2)$. Now test it. Inside, $x = 0$: $-3(0) + 7 = 7$, and $7 > 1$ is true. Outside, $x = 3$: $-9 + 7 = -2$, and $-2 > 1$ is false. Testing one point on each side of the boundary is the cheapest check there is. Do it every time.

**Multiplying by an unknown** is the trap. Take $\frac{1}{x} < 2$. If you multiply both sides by $x$, you do not know whether to flip the sign, because you do not know whether $x$ is positive or negative. One safe way is to split into cases:

- If $x > 0$, multiplying keeps the sign: $1 < 2x$, so $x > \tfrac{1}{2}$.
- If $x < 0$, multiplying flips it: $1 > 2x$, so $x < \tfrac{1}{2}$. Every negative $x$ is less than $\tfrac{1}{2}$, so this case gives all negative $x$.

The solution is $x < 0$ or $x > \tfrac{1}{2}$. (Check $x = -1$: $\frac{1}{-1} = -1 < 2$, true.) The careless move — "$1 < 2x$, so $x > \tfrac{1}{2}$" — quietly threw away every negative solution. The sign chart, later on, is a second safe way.

::: warning Flip the sign when you multiply or divide by a negative
$-2x \leq 8$ becomes $x \geq -4$, not $x \leq -4$. Test a number: $x = 0$ makes $-2x \leq 8$ true ($0 \leq 8$). And $0 \geq -4$ is true, while $0 \leq -4$ is false — so $x \geq -4$ is the right answer.

If you would rather never need the rule, move the negative term to the other side first, so the unknown ends up with a positive number in front: $-2x \leq 8$ becomes $0 \leq 8 + 2x$, then $-8 \leq 2x$, then $-4 \leq x$. Both routes agree, and the second one never uses a rule you can forget.
:::

::: note Why the sign has to flip
Saying $a < b$ is the same as saying $b - a$ is positive. Multiply that positive number by a negative $k$ and you get a negative number: $k(b - a) < 0$, so $kb - ka < 0$, which means $kb < ka$. The order has reversed. Multiplying by a positive $k$ keeps $k(b - a)$ positive, so the order stays.
:::

### Doing the same thing to both sides

You can do other things to both sides of an inequality too — take a square root, take a logarithm — as long as you know how that operation treats order. An **increasing** function (bigger input, bigger output — like a slide that only goes up) keeps the inequality the same way round. A **decreasing** function (bigger input, smaller output) flips it. A function that goes up in some places and down in others cannot be applied without splitting into cases.

- Adding a constant, and multiplying by a positive constant, are increasing. Those are the first two rules above.
- $\sqrt{x}$, $x^3$, $e^x$ and $\ln x$ are increasing wherever they are defined. So $a < b$ gives $\sqrt{a} < \sqrt{b}$ (for $a, b \geq 0$), $e^a < e^b$, and $\ln a < \ln b$ (for $a, b > 0$).
- $1/x$ is decreasing on the positive numbers: if $0 < a < b$ then $\frac{1}{a} > \frac{1}{b}$. Two is less than five, but a half is more than a fifth — split a pizza among fewer people and each slice is bigger. Across zero the rule breaks: $-1 < 2$, but $\frac{1}{-1} = -1$ is *less* than $\tfrac{1}{2}$, not more. Never take reciprocals of both sides unless both sides are known to have the same sign.
- $x^2$ is increasing only for $x \geq 0$. For non-negative $a$ and $b$, $a < b$ exactly when $a^2 < b^2$ (the symbol $\Leftrightarrow$, "if and only if", says both directions hold). With a negative side, squaring can flip or wreck the inequality: $-3 < 2$, but $9 > 4$. Speeds, masses and distances are never negative, so for them $v^2 < 2\mu/r$ and $v < \sqrt{2\mu/r}$ say the same thing. That is how the escape-speed limit is read in either direction.

Here is a clean case from the logarithms lesson. Air density falls off with height $h$ as $e^{-h/H}$ times its sea-level value, with scale height $H = 8.5\,\mathrm{km}$. Where is the air thinner than a thousandth of sea level? We need

$$
e^{-h/H} < 10^{-3} .
$$

1. Take $\ln$ of both sides. That is allowed: $\ln$ is increasing and both sides are positive. This gives $-h/H < \ln 10^{-3} = -\ln 1000$.
2. Multiply both sides by $-H$, a negative number, and flip: $h > H \ln 1000$.
3. Put in the numbers: $h > 8.5 \times 6.908 = 58.7\,\mathrm{km}$.

The answer is the half-line $(58.7, \infty)\,\mathrm{km}$. Every altitude above $58.7\,\mathrm{km}$ meets the requirement. The higher you go past it, the more easily it is met — that is what engineers mean by meeting a constraint "with margin". Sanity check: higher means thinner air, so the answer should be "above some height", and it is.

## Absolute values and tolerances

"Be there within $5$ minutes of $3$ o'clock" means anywhere from $2{:}55$ to $3{:}05$. That is an absolute-value inequality. The absolute value $|x|$ is the distance from $x$ to zero, and $|x - a|$ is the distance from $x$ to $a$. So:

$$
|x - a| < \delta \quad\Leftrightarrow\quad a - \delta < x < a + \delta .
$$

Read it as "$x$ is within $\delta$ of $a$" ($\delta$ is the Greek letter "delta", the allowed distance). The solution is an interval centred on $a$. The opposite statement,

$$
|x - a| > \delta \quad\Leftrightarrow\quad x < a - \delta \;\text{ or }\; x > a + \delta ,
$$

means "$x$ is *more* than $\delta$ away from $a$": everything *outside* that interval. That is two separate pieces joined by "or", never a chain. The $\leq$ and $\geq$ versions include the end points.

Every engineering tolerance is one of these. "$300 \pm 5\,\mathrm{psi}$" (the symbol $\pm$ is read "plus or minus") means $|p - 300| \leq 5$, that is $295 \leq p \leq 305$. A rule that a rocket must touch down within $10\,\mathrm{m}$ of the pad centre in each direction is $|x| \leq 10$ and $|y| \leq 10$. A guidance loop that declares itself "done when $|\text{error}| < 0.01\,\mathrm{m/s}$" is testing exactly this.

Solve $|2x - 3| \leq 7$:

1. Rewrite as a chain: $-7 \leq 2x - 3 \leq 7$.
2. Add $3$ to all three parts: $-4 \leq 2x \leq 10$.
3. Divide all three parts by $2$ (positive, so no flip): $-2 \leq x \leq 5$.

The solution is $[-2, 5]$. Check the end points: $x = -2$ gives $|{-4} - 3| = 7$, and $x = 5$ gives $|10 - 3| = 7$. Both equal $7$, so both are included.

One inequality about absolute values has its own name. Walk $3$ blocks one way, then $4$ blocks some other way. How far from the start can you end up? At most $7$ blocks, if you kept walking in the same direction. Less, if you turned. That is the **triangle inequality**:

$$
|a + b| \leq |a| + |b| .
$$

The size of a sum is never more than the sum of the sizes. It is equal exactly when $a$ and $b$ have the same sign. This is how engineers add up errors safely: if one error source contributes at most $3\,\mathrm{m}$ and another at most $4\,\mathrm{m}$, the total is at most $7\,\mathrm{m}$. Later it becomes a statement about vectors and about the sides of a triangle, hence the name.

::: example A propellant-temperature window
A kerosene load must be kept between $3$ and $8\,^\circ\mathrm{C}$, end points included. But the tank farm's sensors read in Fahrenheit. The conversion from the functions lesson is $C = \tfrac{5}{9}(F - 32)$, so the rule becomes a chain:

$$
3 \leq \tfrac{5}{9}(F - 32) \leq 8 .
$$

**Step 1.** Multiply all three parts by $\tfrac{9}{5}$. That is positive, so the signs stay: $3 \times \tfrac{9}{5} = 5.4$ and $8 \times \tfrac{9}{5} = 14.4$, giving $5.4 \leq F - 32 \leq 14.4$.

**Step 2.** Add $32$ to all three parts: $37.4 \leq F \leq 46.4$.

The operator's limits are $[37.4, 46.4]\,^\circ\mathrm{F}$. Written as a tolerance, the centre is halfway, $\frac{37.4 + 46.4}{2} = 41.9$, and the half-width is $46.4 - 41.9 = 4.5$, so $|F - 41.9| \leq 4.5$.

**Check** by converting an end point back: $\tfrac{5}{9}(46.4 - 32) = \tfrac{5}{9} \times 14.4 = 8.0\,^\circ\mathrm{C}$. That is the top of the window, as it should be.
:::

## Curved inequalities: the sign chart

When the unknown is squared, or sits in the bottom of a fraction, the moves above cannot get it on its own. You need a different idea.

Picture a road that rises and dips across a landscape, and ask: where is the road above sea level? The road can only switch from above to below sea level at a point where it is exactly *at* sea level. Between those crossing points it stays on one side. So you only need to find the crossing points and check one spot in each stretch.

That is the **sign chart** method:

1. Move every term to one side, so the inequality reads $f(x) > 0$ (or $<$, $\geq$, $\leq$).
2. Find the points where $f$ is zero, and any points where it is undefined (a zero on the bottom of a fraction).
3. Those points cut the number line into intervals. On each interval $f$ is all positive or all negative, so test one number from each.
4. Read off which intervals satisfy the inequality.

Take $x^2 - 5x + 6 < 0$. Factor it: $(x - 2)(x - 3) < 0$. The zeros are at $x = 2$ and $x = 3$. Test one number in each stretch:

- $x = 0$: $(-2)(-3) = 6$, positive.
- $x = 2.5$: $(0.5)(-0.5) = -0.25$, negative.
- $x = 4$: $(2)(1) = 2$, positive.

The product is negative only between the zeros, so the solution is $(2, 3)$. The parabola opens upward, like a smile, and dips below the axis between its zeros. If the question had been $> 0$, the answer would be the two outer pieces, $(-\infty, 2) \cup (3, \infty)$.

A fraction works the same way. For $\dfrac{x - 1}{x + 2} \geq 0$, the top is zero at $x = 1$ and the bottom is zero at $x = -2$, where the fraction is undefined. Test:

- $x = -3$: $\frac{-4}{-1} = 4$, positive.
- $x = 0$: $\frac{-1}{2}$, negative.
- $x = 2$: $\frac{1}{4}$, positive.

The solution is $(-\infty, -2) \cup [1, \infty)$. The zero at $x = 1$ is included because of the "or equal to" in $\geq$. The undefined point $x = -2$ is never included — the fraction has no value there at all. Notice you never multiplied through by $x + 2$, whose sign you did not know.

::: example When is the thrown object above 110 m?
From the equations lesson: an object thrown upward from a tower has height $h(t) = 100 + 20t - 4.903t^2$ metres, $t$ seconds after the throw. When is it above $110\,\mathrm{m}$?

**Step 1: everything on one side.** $100 + 20t - 4.903t^2 - 110 > 0$, which tidies to $-4.903t^2 + 20t - 10 > 0$.

**Step 2: make the $t^2$ term positive.** Multiply by $-1$ and flip: $4.903t^2 - 20t + 10 < 0$.

**Step 3: find the zeros** with the quadratic formula. The discriminant (the part under the square root) is $20^2 - 4(4.903)(10) = 400 - 196.1 = 203.9$, and $\sqrt{203.9} = 14.28$. The bottom is $2 \times 4.903 = 9.806$. So

$$
t = \frac{20 \pm 14.28}{9.806} = 0.583\,\mathrm{s} \quad\text{or}\quad 3.496\,\mathrm{s} .
$$

**Step 4: read the chart.** The parabola $4.903t^2 - 20t + 10$ opens upward, so it is negative between its zeros. The object is above $110\,\mathrm{m}$ for $t$ in $(0.583, 3.496)\,\mathrm{s}$, about $2.9$ seconds.

**Check.** At $t = 2$: $h = 100 + 40 - 19.6 = 120.4$, which is above $110$ — and it is the highest point, as the functions lesson found. At $t = 5$: $h = 100 + 100 - 122.6 = 77.4$, below. Both agree with the answer.

Had the threshold been $130\,\mathrm{m}$, higher than the peak, the discriminant would have come out negative and the solution set empty. That is the algebra saying "never" — the right answer.
:::

## Inequalities as design constraints

A requirement is an inequality with a design choice on one side. Solving it tells you the **feasible region**: every design that meets the requirement.

**Lift-off.** A rocket leaves the pad only if its thrust $T$ beats its weight: $T > m_0 g_0$, where $m_0$ is the lift-off mass and $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. Designers want margin, usually a thrust-to-weight ratio of at least $1.2$:

$$
T \geq 1.2\,m_0 g_0 .
$$

For $m_0 = 549\,\mathrm{t} = 549\,000\,\mathrm{kg}$ this gives $T \geq 1.2 \times 549\,000 \times 9.80665 = 6.46 \times 10^6\,\mathrm{N}$, which is $6.46\,\mathrm{MN}$ (meganewtons, millions of newtons). Read the other way round, a fixed thrust of $7.6\,\mathrm{MN}$ limits the mass. Divide both sides by the positive number $1.2\,g_0$: $m_0 \leq \dfrac{7.6 \times 10^6}{1.2 \times 9.80665} = 646\,000\,\mathrm{kg} = 646\,\mathrm{t}$.

**Payload fraction.** The rocket equation from the logarithms lesson says the fraction of lift-off mass left at burnout is $m_f/m_0 = e^{-\Delta v / v_e}$, where $\Delta v$ is the speed change and $v_e$ the exhaust speed. Suppose a mission needs at least $5\%$ of the lift-off mass to arrive:

1. The requirement is $e^{-\Delta v/v_e} \geq 0.05$.
2. Take $\ln$ (increasing, so no flip): $-\Delta v / v_e \geq \ln 0.05 = -\ln 20$.
3. Multiply by $-v_e$ (negative, so flip): $\Delta v \leq v_e \ln 20$.

With $v_e = 3050\,\mathrm{m/s}$: $\Delta v \leq 3050 \times 2.996 = 9137\,\mathrm{m/s}$. So any single-stage mission that needs more than about $9.1\,\mathrm{km/s}$ from this engine cannot keep five percent of its mass — and that five percent has to include the rocket's own structure. This is the inequality that kills single-stage-to-orbit rockets, and it is only two legal moves long.

**Hovering.** A returning booster of mass $28\,\mathrm{t}$ can hover in place only if its engine can throttle down to exactly its weight: $T = m g_0 = 28\,000 \times 9.80665 = 275\,\mathrm{kN}$. But suppose the engine's *lowest* thrust is about $480\,\mathrm{kN}$. Then $T_{\min} > m g_0$ — the inequality points the wrong way — and the booster cannot hover. Even at its lowest setting it keeps slowing down, at

$$
\frac{T}{m} - g_0 = \frac{480\,000}{28\,000} - 9.81 = 17.1 - 9.81 = 7.3\,\mathrm{m/s^2} .
$$

So the landing burn must be timed to reach zero speed exactly at zero height, with no chance to pause and correct. An inequality that cannot be made into an equality is a design fact. Here it is the reason this kind of landing is flown the way it is.

::: example Fixed mass ratio: more payload needs more propellant
The module's derivation exercise asks you to show that, if the mass ratio stays fixed, adding payload forces you to add propellant *in the same proportion*. Here is how.

**The masses.** A stage has dry mass $m_d$, propellant $m_p$ and payload $m_L$. The mass ratio is $MR = m_0/m_f$, with $m_0 = m_d + m_p + m_L$ and $m_f = m_d + m_L$. The polynomials lesson showed that

$$
MR - 1 = \frac{m_0}{m_f} - \frac{m_f}{m_f} = \frac{m_0 - m_f}{m_f} = \frac{m_p}{m_f} ,
$$

because $m_0 - m_f$ is exactly the propellant. Multiply both sides by $m_f = m_d + m_L$:

$$
m_p = (MR - 1)(m_d + m_L) .
$$

**Two payloads.** Now compare a bigger payload $m_L'$ (read "m L prime") with the original $m_L$, keeping $MR$ and $m_d$ fixed. Write the identity for each and subtract: $m_p' - m_p = (MR - 1)(m_L' - m_L)$.

**The inequality step.** The first lesson showed $MR > 1$, because $m_0$ is $m_f$ plus a positive amount of propellant. So $MR - 1$ is positive. Multiplying the true statement $m_L' - m_L > 0$ by a positive number keeps its direction, so $m_p' - m_p > 0$. More payload means more propellant. And the ratio of the increases, $\frac{m_p' - m_p}{m_L' - m_L} = MR - 1$, is a constant. That one step — "multiplying by the positive number $MR - 1$ keeps the inequality" — is the one-line justification the exercise asks for.

**With numbers.** Take $MR = 12.08$ and $m_d = 22\,\mathrm{t}$. A payload of $15\,\mathrm{t}$ needs $11.08 \times (22 + 15) = 11.08 \times 37 = 410\,\mathrm{t}$ of propellant. A payload of $20\,\mathrm{t}$ needs $11.08 \times 42 = 465\,\mathrm{t}$. Five extra tonnes of payload cost $11.08 \times 5 = 55.4$ tonnes of extra propellant — eleven times as much, which is $MR - 1$.
:::

::: key Solving inequalities
Add or subtract anything on both sides; multiply or divide by a positive number and keep the sign; multiply or divide by a negative number and **reverse** it; never multiply by an unknown whose sign you do not know. Increasing functions ($\sqrt{\ }$, $e^x$, $\ln$, $x^3$) preserve an inequality; decreasing ones ($1/x$ on positives) reverse it; $x^2$ preserves it only for non-negative sides. $|x - a| < \delta$ means $a - \delta < x < a + \delta$; $|x - a| > \delta$ means $x < a - \delta$ or $x > a + \delta$. For quadratics and quotients: move everything to one side, find zeros and undefined points, test each interval.
:::

::: note Inequalities in code
`if abs(v_err) < 0.01:` is $|v_{\text{err}}| < 0.01$. `if 3 <= T <= 8:` is a Python chain and reads exactly like the mathematics. Testing two decimal numbers for *exact equality* almost never works in a computer — two calculations of the "same" value can differ in the very last digit — so real code tests closeness with an absolute-value inequality and a tolerance. The tolerance you pick is a design decision about how wrong you are willing to be.
:::

## Check yourself

::: check
Solve $5 - 2x \geq 3x + 20$ and write the solution in interval notation. Test one value inside and one outside.
:::

::: answer
Subtract $3x$ from both sides: $5 - 5x \geq 20$. Subtract $5$: $-5x \geq 15$. Divide by $-5$ and flip: $x \leq -3$, that is $(-\infty, -3]$.

Test $x = -4$ (inside): $5 + 8 = 13$ and $-12 + 20 = 8$, and $13 \geq 8$ is true. Test $x = 0$ (outside): $5 \geq 20$ is false.

Or avoid the flip: move the $x$ terms right and the numbers left, $5 - 20 \geq 3x + 2x$, so $-15 \geq 5x$, so $-3 \geq x$.
:::

::: check
A tank's pressure must satisfy $|p - 300| < 12$, in psi. Write this as a chain, give the interval, and say which pressures are allowed.
:::

::: answer
$300 - 12 < p < 300 + 12$, that is $288 < p < 312$, the open interval $(288, 312)\,\mathrm{psi}$. Every pressure strictly between $288$ and $312$ is allowed. The end points $288$ and $312$ themselves are not, because the inequality is strict ($<$, not $\leq$).
:::

::: check
Solve $x^2 + 2x - 8 \geq 0$.
:::

::: answer
Factor: $(x + 4)(x - 2) \geq 0$, with zeros at $-4$ and $2$. Test $x = -5$: $(-1)(-7) = 7$, positive. Test $x = 0$: $(4)(-2) = -8$, negative. Test $x = 3$: $(7)(1) = 7$, positive.

The solution is $(-\infty, -4] \cup [2, \infty)$, with the end points included because of $\geq$. The parabola opens upward and is on or above the axis outside its zeros.
:::

::: check
For which orbit radii is the circular orbit speed $v = \sqrt{\mu/r}$ less than $5\,\mathrm{km/s}$? Use Earth's $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.
:::

::: answer
We need $\sqrt{\mu/r} < 5000$.

1. Both sides are non-negative, so squaring keeps the direction: $\mu/r < 2.5 \times 10^7$.
2. Both sides are positive, so taking reciprocals flips it: $r/\mu > 4 \times 10^{-8}$.
3. Multiply by the positive $\mu$: $r > 3.986 \times 10^{14} \times 4 \times 10^{-8} = 1.594 \times 10^7\,\mathrm{m} = 15\,940\,\mathrm{km}$.

Circular orbits slower than $5\,\mathrm{km/s}$ have radius above about $15\,900\,\mathrm{km}$ — an altitude above about $9\,600\,\mathrm{km}$, after subtracting Earth's radius. Sanity check: the speed gets smaller as $r$ gets bigger, so "slower" must mean "further out", and it does.
:::

::: check
Why can you not solve $\dfrac{x + 3}{x - 1} < 2$ by multiplying both sides by $x - 1$? Solve it correctly.
:::

::: answer
You do not know the sign of $x - 1$, so you would not know whether to flip the inequality.

Instead, subtract $2$ from both sides and combine into one fraction:

$$
\frac{x + 3}{x - 1} - 2 = \frac{x + 3 - 2(x - 1)}{x - 1} = \frac{5 - x}{x - 1} < 0 .
$$

The top is zero at $x = 5$; the bottom is zero (undefined) at $x = 1$. Test $x = 0$: $\frac{5}{-1} = -5 < 0$, works. Test $x = 2$: $\frac{3}{1} = 3$, fails. Test $x = 6$: $\frac{-1}{5} < 0$, works. The solution is $(-\infty, 1) \cup (5, \infty)$.

The careless multiplication would have given $x + 3 < 2x - 2$, so $x > 5$ only — losing every $x < 1$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Solution set | every value that makes the statement true; usually an interval or a union of intervals |
| Compound | "and" is a chain $a < x \leq b$; "or" is a union $(\cdot) \cup (\cdot)$ |
| Add/subtract | keeps the direction, whatever the sign |
| Multiply/divide | positive: keeps; negative: **reverses**; unknown sign: do not |
| Functions | increasing ($\sqrt{\ }$, $e^x$, $\ln$) keep; decreasing ($1/x$ on positives) reverse; $x^2$ only on non-negatives |
| Absolute value | $\lvert x - a \rvert < \delta \Leftrightarrow a - \delta < x < a + \delta$; $\lvert x - a \rvert > \delta \Leftrightarrow x < a - \delta$ or $x > a + \delta$ |
| Triangle inequality | $\lvert a + b \rvert \leq \lvert a \rvert + \lvert b \rvert$ |
| Sign chart | one side zero; find zeros and undefined points; test each interval; include zeros for $\leq$, $\geq$; never include undefined points |
| Constraints | $T \geq 1.2\, m_0 g_0$; $e^{-\Delta v/v_e} \geq 0.05 \Leftrightarrow \Delta v \leq v_e \ln 20$; $\rho < \rho_0/1000 \Leftrightarrow h > H\ln 1000$ |
| Fixed $MR$ | $m_p = (MR - 1)(m_d + m_L)$, so more payload needs $(MR - 1)$ times as much more propellant |

Next lesson: the numbers themselves. Every number an engineer writes carries a **unit**. You will learn to convert between metric and US units without losing a spacecraft, and to use the rule that every term in an equation must have the same kind of units to catch mistakes before they fly.
