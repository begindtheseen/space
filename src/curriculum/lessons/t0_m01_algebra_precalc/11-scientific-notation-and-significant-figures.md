---
id: l11-scientific-notation-and-significant-figures
title: Scientific notation and significant figures
minutes: 24
covers:
  - scientific notation and significant figures
---

Try reading this out loud: $398\,600\,000\,000\,000\,\mathrm{m^3/s^2}$. It is Earth's **gravitational parameter** — how strongly Earth pulls. Now this: $0.000\,000\,000\,066\,74$, the **[[gravitational constant|g-vs-mu]]**, the strength of gravity itself. Nobody can count those zeros reliably, or multiply the two in their head.

**Scientific notation** fixes this. It writes the first as $3.986 \times 10^{14}$ and the second as $6.674 \times 10^{-11}$. Each number is split into its *digits* (a small number between one and ten) and its *size* (a power of ten), and the two parts are handled separately: the powers of ten by adding whole numbers, the digits by ordinary arithmetic. You have been reading this notation all module. This lesson spells out the rules.

Then comes a harder question: how many of those digits are you allowed to write? That is the idea of **significant figures**. A stage mass written as $25.00\,\mathrm{t}$ claims to know it to within ten kilograms. If it came from a rough scale, that is a lie — and the fake precision flows into every later number. The last section introduces the **order of magnitude**, the roughest honest statement of a number's size, which the module's final lesson uses for estimating.

## Writing huge and tiny numbers

Start with money. "Three thousand dollars" is $3 \times 1000$; "three million" is $3 \times 1\,000\,000$. The $3$ is the digits and the "thousand" or "million" is the size. Scientific notation writes the size as a [[power of ten|powers-ladder]]: $1000 = 10^3$ ("ten to the third", three tens multiplied together) and $1\,000\,000 = 10^6$.

Tiny numbers use negative powers. From the exponents lesson, $10^{-1} = \tfrac{1}{10} = 0.1$, $10^{-2} = 0.01$, $10^{-3} = 0.001$. A negative exponent means "divide by ten that many times".

A number in **scientific notation** is written

$$
a \times 10^{n}, \qquad 1 \leq |a| < 10, \qquad n \text{ a whole number}.
$$

The front number $a$ is the **[[mantissa|mantissa-word]]** (also called the coefficient). It must be at least $1$ and less than $10$ in size. The power $n$ is the **exponent**. Read $3.986 \times 10^{14}$ aloud as "three point nine eight six times ten to the fourteenth".

### Moving the decimal point

The exponent counts how many places the decimal point moved:

- $7673 = 7.673 \times 10^3$. The point moved three places left, so the exponent is $+3$.
- $0.000\,457 = 4.57 \times 10^{-4}$. The point moved four places right, so the exponent is $-4$.
- $9.82 = 9.82 \times 10^0$. It is already between one and ten, so the exponent is zero ($10^0 = 1$).
- A negative number keeps its sign on the mantissa: $-420 = -4.2 \times 10^{2}$.

Big numbers get positive exponents; numbers smaller than one get negative ones.

Why keep the mantissa between one and ten? So every number has exactly *one* way to be written. But nothing breaks if you write $39.86 \times 10^{13}$ halfway through a calculation. You tidy it up at the end, which is called **normalising**.

### In code and with SI prefixes

Computers write the same thing as `3.986e14` and `6.674e-11`, the `e` meaning "times ten to the". Python reads and prints this form, and this course's code uses it throughout.

**Engineering notation** is a cousin. It only allows exponents that are multiples of three, so they match the SI prefixes: **kilo** (k) is $10^3$, **mega** (M) is $10^6$, **giga** (G) is $10^9$. So $7.607 \times 10^6\,\mathrm{N}$ is $7.607\,\mathrm{MN}$ (meganewtons), and $344.7 \times 10^3\,\mathrm{Pa}$ is $344.7\,\mathrm{kPa}$ (kilopascals). Either style is fine; stay consistent within a calculation.

## Arithmetic in scientific notation

### Multiplying and dividing

What is three thousand times two million? Multiply the digits, $3 \times 2 = 6$, and count up the zeros: three plus six is nine. So the answer is $6 \times 10^9$, six billion. That is the whole rule. The exponent laws from the exponents lesson do the work:

- To **multiply**, multiply the mantissas and **add** the exponents.
- To **divide**, divide the mantissas and **subtract** the exponents.
- Then normalise.

::: example Gravity at Earth's surface
Gravity at the surface is Earth's gravitational parameter divided by Earth's radius squared. With $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and radius $6.371 \times 10^{6}\,\mathrm{m}$:

$$
\frac{3.986 \times 10^{14}}{(6.371 \times 10^{6})^2} = \frac{3.986 \times 10^{14}}{40.59 \times 10^{12}} = \frac{3.986}{40.59} \times 10^{14 - 12} = 0.09820 \times 10^{2} = 9.820\,\mathrm{m/s^2} .
$$

Step by step:

1. **Square the bottom.** Square the mantissa, $6.371^2 = 40.59$, and double the exponent, $6 \times 2 = 12$.
2. **Divide.** Divide the mantissas, $3.986 \div 40.59 = 0.09820$, and subtract the exponents, $14 - 12 = 2$.
3. **Normalise.** $0.09820$ is less than one, so move its decimal point two places right to get $9.820$. That uses up the two powers of ten, and $10^0 = 1$.

Sanity check: surface gravity is "about ten". The whole job was two small divisions plus some counting — the point of the notation.
:::

### Adding and subtracting

You cannot add $3$ dollars and $5$ cents and get $8$ of anything. First put both in the same unit: $300$ cents plus $5$ cents is $305$ cents. Powers of ten are the same. To add or subtract, first make the exponents equal:

$$
3.986 \times 10^{14} + 4.903 \times 10^{12} = 3.986 \times 10^{14} + 0.04903 \times 10^{14} = 4.035 \times 10^{14}.
$$

(That is Earth's gravitational parameter plus the Moon's, used for the Moon's orbit.) The smaller number only nudged the third decimal. When exponents are far apart, the smaller number can vanish completely at the precision you keep — and seeing that ahead of time saves computing it.

### Roots

A **square root** asks "what number times itself gives this?" In scientific notation, a square root halves the exponent — but only when the exponent is even. $\sqrt{5.887 \times 10^7}$ has an odd exponent, so first shift one power of ten into the mantissa:

$$
\sqrt{5.887 \times 10^7} = \sqrt{58.87 \times 10^{6}} = \sqrt{58.87} \times 10^{3} = 7.673 \times 10^3 .
$$

That is the low-orbit speed in metres per second again. A **cube root** ("what number times itself three times gives this?") wants an exponent divisible by three:

$$
\sqrt[3]{2.944 \times 10^{20}} = \sqrt[3]{294.4 \times 10^{18}} = 6.65 \times 10^{6},
$$

as in the check of orbit radius from orbit period in the exponents lesson.

::: warning Keep the exponent with the number
Three slips cause most wrong answers. First, getting the mantissas right but forgetting the exponents, so the answer is a thousand or a million times off. Second, normalising the wrong way: $0.0982 \times 10^2$ is $9.82 \times 10^0$, not $9.82 \times 10^4$ — making the mantissa bigger means making the exponent *smaller*. Third, squaring the mantissa but not doubling the exponent: $(6.371 \times 10^6)^2 \neq 40.59 \times 10^6$. Against all three, check the rough size: surface gravity is "about ten", so $9.82 \times 10^4$ is wrong before you look for the mistake.
:::

## Precision, accuracy and significant figures

A bathroom scale says your backpack weighs $6\,\mathrm{kg}$. A kitchen scale says $6.35\,\mathrm{kg}$, because it can tell smaller differences apart. Every measurement has some uncertainty, and the digits you write should tell the reader how much.

Two words get mixed up here:

- **Accuracy** is how close a value is to the truth.
- **Precision** is how finely it is stated, or how well it repeats.

[[Darts|darts]] clumped tightly but far from the bullseye are precise and inaccurate; darts scattered loosely around it are accurate and imprecise. A pressure gauge reading $300.0\,\mathrm{psi}$ (pounds per square inch) that is miscalibrated by $20\,\mathrm{psi}$ is precise and inaccurate. One that reads "about $300$" and is right is accurate and imprecise.

**Significant figures** are about precision. They are the digits in a number that carry real information.

### Counting significant figures

- Every non-zero digit counts: $7673$ has four.
- Zeros *between* non-zero digits count: $6.071$ has four.
- Leading zeros do not count: $0.00457$ has three. They only mark where the decimal point goes, which is why scientific notation ($4.57 \times 10^{-3}$) never shows them.
- Trailing zeros after a decimal point count: $25.00$ has four, and promises hundredths.
- Trailing zeros in a whole number are ambiguous: $400\,\mathrm{km}$ might mean one, two or three figures. Scientific notation removes the doubt — $4 \times 10^2$, $4.0 \times 10^2$, $4.00 \times 10^2$ — and that is the reason to use it whenever precision matters.

### Exact numbers

Some numbers are not measured at all. These **[[exact numbers|defined-exact]]** have unlimited significant figures and never limit a result: the $2$ in $\tfrac{1}{2}mv^2$, the $4\pi$ in a sphere's area, the defined standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$, the defined $1852\,\mathrm{m}$ in a nautical mile. Only measured or estimated inputs bring uncertainty in.

### Rounding

**Rounding** to $n$ significant figures keeps the first $n$ digits and adjusts the last one by looking at the digit after it (5 or more rounds up):

- $7672.59$ to four figures is $7673$.
- $9.8202$ to three figures is $9.82$.
- $0.0004567$ to two figures is $0.00046 = 4.6 \times 10^{-4}$.

A final $5$ with nothing after it is usually rounded up ($2.345 \to 2.35$). But Python's `round` and many libraries [[round halves|bankers-rounding]] to the nearest *even* digit — `round(2.5)` is `2`, `round(3.5)` is `4` — so that millions of roundings do not all push upward. Neither choice matters at the third figure of an engineering estimate. Both matter in accounting.

## How precision passes through arithmetic

Rather than memorise rules, see where they come from. Being off by one dollar matters a lot on a \$10 lunch and hardly at all on a \$1000 bike. The **relative error** compares the error to the size of the thing. Write an uncertain quantity as $x(1 + \varepsilon_x)$, where $\varepsilon_x$ (the Greek letter "epsilon", read "epsilon sub x") is its relative error — the uncertainty as a fraction of the value.

A number given to three significant figures is uncertain by about half a unit in the third place: between $0.05\%$ and $0.5\%$, depending on its first digit. Four figures is ten times better.

### Multiplication and division: relative errors add

Measure a rectangle of floor $1\%$ too long and $2\%$ too wide, and its area comes out about $3\%$ too big. Check: $(1.01)(1.02) = 1.0302$, an error of $3.02\%$ — essentially $3\%$.

In symbols, **relative errors add under multiplication**:

$$
\varepsilon_{xy} \approx \varepsilon_x + \varepsilon_y .
$$

The same holds for division (in the worst case the errors still add, since an error on the bottom can push either way). So the result's relative error is at least as big as the worst input's, and the result cannot be more precise than its least precise input. That is the rule: **through a chain of multiplications and divisions, the result carries no more significant figures than the least-precise input.**

::: note Why relative errors add
Multiply the two uncertain numbers and expand the brackets:

$$
x(1 + \varepsilon_x) \cdot y(1 + \varepsilon_y) = xy\,(1 + \varepsilon_x + \varepsilon_y + \varepsilon_x\varepsilon_y).
$$

The last term is one small number times another, which is tiny: $0.01 \times 0.02 = 0.0002$. Drop it, and what is left says the product $xy$ is off by the fraction $\varepsilon_x + \varepsilon_y$.
:::

At work: an engine's thrust (its push) of $7607\,\mathrm{kN}$ (four figures) divided by weight $5384\,\mathrm{kN}$ (four figures) is $1.4129$ on a calculator. Four figures, $1.413$, is all the inputs support. If the thrust had been given as $7.6\,\mathrm{MN}$, two figures, the ratio would be $1.4$ and no more.

### Addition and subtraction: absolute errors add

Adding works differently. Weigh a suitcase on a bathroom scale (good to about half a kilogram) and a toothbrush on a kitchen scale (good to a few grams). The total is still only good to about half a kilogram. The toothbrush's extra decimals are wasted.

When adding, the **absolute** errors add — the actual amounts, not the fractions. If $x$ is known to $\pm 0.5$ (read "plus or minus", meaning it could be that much either way) and $y$ to $\pm 0.05$, then $x + y$ is known to about $\pm 0.55$. So the rule is about decimal *places*, not figures: **a sum or difference is precise to the coarsest decimal place among its inputs.**

Stage masses $22.4 + 410.7 + 15.25$ add to $448.35$ on the calculator. But $410.7$ is only good to tenths, so the sum is $448.4\,\mathrm{t}$. That happens to be four figures, but the count of figures is a *result*, not the rule. If the propellant were quoted as $410\,\mathrm{t}$ to the nearest tonne, the sum would be $448\,\mathrm{t}$, whatever decimals the smaller terms had.

### The sting in subtraction

The orbit radius $6771\,\mathrm{km}$ and Earth's radius $6371\,\mathrm{km}$ each have four figures, about one part in seven thousand. Their difference, the altitude $400\,\mathrm{km}$, inherits about a kilometre of uncertainty from each: $400 \pm 1$, one part in four hundred, barely three figures.

Subtracting nearly equal numbers *destroys* relative precision: the leading digits cancel, and only the uncertain trailing ones survive. This is the **catastrophic cancellation** that hurt the quadratic formula in the equations lesson. It is also why altitude should be measured or stored as altitude, not as one radius minus another, when precision matters.

::: key Significant figures through arithmetic
Multiplication and division: the result carries no more significant figures than the least-precise input (relative errors add). Addition and subtraction: the result is precise to the coarsest decimal place among the inputs, not the fewest sig figs (absolute errors add), so the count of significant figures can go up or down — and subtracting nearly equal numbers can destroy most of it. Exact and defined constants never limit precision.
:::

### Carry extra digits, round once

The rules say how many figures to *report*, not how many to *carry* while you work. Rounding at every step adds a fresh error each time, and [[the errors pile up|patriot]]: round $9.82$ to $10$, use it in three more steps, and the answer can move several percent.

So carry one or two extra **guard digits** through the whole calculation, and round once, at the end. A computer does this automatically: a standard (double-precision) number carries about sixteen significant figures. But the reporting rule still applies. A printout of `7672.594396313682` is not a claim to sixteen figures of orbital speed; cut it back to what the inputs deserve.

::: example Orbital speed with the figures accounted for
The speed of a circular orbit is $v = \sqrt{\mu / r}$. Here $\mu$ (the Greek letter "mu") is Earth's gravitational parameter, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (four figures), and $r$ is the distance from Earth's centre, $6771\,\mathrm{km}$ (four figures, from $6371 + 400$ with the altitude taken as exact).

**Divide, keeping guard digits.** Convert $r$ to metres, $6.771 \times 10^{6}\,\mathrm{m}$. Then

$$
\frac{\mu}{r} = \frac{3.986 \times 10^{14}}{6.771 \times 10^{6}} = 0.58869 \times 10^{8} = 5.8869 \times 10^{7}\,\mathrm{m^2/s^2}.
$$

**Take the root.** The exponent is odd, so shift one power of ten first: $\sqrt{58.869 \times 10^{6}} = 7.6726 \times 10^{3}\,\mathrm{m/s}$.

**Round once.** The inputs have four figures, so report $v = 7673\,\mathrm{m/s}$, or $7.673\,\mathrm{km/s}$. Sanity check: low-orbit speed is "about $7.7\,\mathrm{km/s}$".

Did the fourth figure of $\mu$ matter? The more precise $3.986\,004 \times 10^{14}$ gives $7672.60$, a change of four millimetres per second. The four-figure $\mu$ was already good enough.

But if the altitude were known only as "about $400\,\mathrm{km}$", to one figure, $r$ would be uncertain by tens of kilometres, $\mu/r$ by a percent or so, and $v$ by half a percent. Then $7.67\,\mathrm{km/s}$ would be honest, and $7673$ would not. The number of figures you report is a statement about the *worst* input, not the best.
:::

::: example Adding up a mass budget
A stage's parts: structure $18.4\,\mathrm{t}$, engines $4.2\,\mathrm{t}$, avionics (the electronics) and leftover fluids $0.65\,\mathrm{t}$, and propellant $410\,\mathrm{t}$, quoted to the nearest tonne.

**Add.** The calculator total is $433.25\,\mathrm{t}$. The propellant is the coarsest input, good only to $\pm 0.5\,\mathrm{t}$, so the total is $433\,\mathrm{t}$. The $0.25$ is noise; the avionics figure's second decimal never had a chance.

**Mass ratio.** Add a payload of $15\,\mathrm{t}$, so the lift-off mass is $m_0 = 448\,\mathrm{t}$. The burnout mass is what is left after the propellant is gone: $m_f = 448 - 410 = 38\,\mathrm{t}$. That subtraction left $m_f$ good only to about a tonne, roughly $\pm 2.6\%$ (because $1 \div 38 \approx 0.026$). So the mass ratio from the first lesson, $MR = 448 / 38 = 11.79$ on the calculator, is really $11.8$ — three figures, and even the third is soft.

Notice which step cost the precision: not the division, but subtracting two similar-sized numbers to get the small burnout mass. Real design work tracks the dry mass directly, to the kilogram, for exactly this reason.
:::

## Orders of magnitude

Sometimes you only need to know roughly how big something is. About ten? A thousand? A million? The **order of magnitude** of a number is the power of ten closest to it.

"Closest" needs care, because powers of ten are spaced by multiplying, not adding. [[Halfway|log-halfway]] between $1$ and $10$ in this sense is $\sqrt{10} \approx 3.16$: about three times $1$, and about three times smaller than $10$. So the careful definition uses the **common logarithm** $\log_{10}$ (from the logarithms lesson: $\log_{10} x$ is the power you raise $10$ to in order to get $x$). Round $\log_{10}$ of the number to the nearest whole number, and that is its order.

So numbers from $3.16$ to $31.6$ — from $10^{0.5}$ to $10^{1.5}$ — are "of order ten", $10^1$. A more casual usage reads the exponent straight off the scientific notation: anything from $1 \times 10^{n}$ to $9.99 \times 10^{n}$ is of order $10^{n}$. Both usages are common, and they differ by at most one power of ten — the fuzziness of the idea anyway. Two numbers "differ by an order of magnitude" when one is about ten times the other, and by three orders when it is about a thousand times.

- Low-orbit speed, $7673\,\mathrm{m/s}$, has $\log_{10} = 3.88$, which rounds up to $4$. It is of order $10^4\,\mathrm{m/s}$.
- Surface gravity is of order $10^1\,\mathrm{m/s^2}$.
- The Earth–Moon distance, $3.84 \times 10^8\,\mathrm{m}$, has $\log_{10} = 8.58$. That is order $10^9$ by the careful rule and $10^8$ by the casual one — the ambiguity in action.

### Why it works: logs turn multiplying into adding

Multiplying numbers *adds* their logarithms, so it adds their orders. A product of six factors, each known only to an order of magnitude, is itself known to within a few orders of magnitude — and often better, because errors in opposite directions cancel. The estimation lesson makes that argument carefully.

Logarithms to a couple of decimals are the tool. Here is a [[multiplication done by adding|slide-rule]]:

$$
\log_{10}(1.013 \times 10^5) = 5.006, \qquad \log_{10}(5.1 \times 10^{14}) = 14.708, \qquad \log_{10} 9.81 = 0.992.
$$

So $\dfrac{1.013 \times 10^5 \times 5.1 \times 10^{14}}{9.81}$ has a logarithm of $5.006 + 14.708 - 0.992 = 18.72$ — multiplying became adding, dividing became subtracting. The answer is $10^{18.72} = 10^{0.72} \times 10^{18} = 5.2 \times 10^{18}$. That is the mass of Earth's atmosphere in kilograms, as the next lesson explains, and it is within one percent of the $5.27 \times 10^{18}$ that long multiplication gives.

::: note Floating point is not exact either
A double-precision computer number (a "float") stores about $15$–$16$ significant decimal figures, with an exponent from roughly $10^{-308}$ to $10^{308}$. Plenty, but finite: in Python, `0.1 + 0.2` prints as `0.30000000000000004`, because numbers are stored in binary (base two), where neither $0.1$ nor $0.2$ is exact. The rules of this lesson apply to floats as to pencil work — subtracting nearly equal values loses figures, products pile up relative error — only at the sixteenth figure instead of the fourth. The numerical-methods module is about chaining a million such operations.
:::

## Check yourself

::: check
How many significant figures do $0.0300$, $1.200 \times 10^{3}$ and $1200$ have?
:::

::: answer
$0.0300$ has three: the leading zeros only place the point, but the trailing zeros after it are promises. $1.200 \times 10^{3}$ has four; scientific notation shows exactly the digits that count. $1200$ is ambiguous — two, three or four figures — the very problem scientific notation solves.
:::

::: check
Write $0.000\,000\,066\,74$ and $5\,972\,000\,000\,000\,000\,000\,000\,000$ in scientific notation, say how many significant figures each has, and multiply them.
:::

::: answer
$6.674 \times 10^{-11}$ (four figures; the leading zeros do not count) and $5.972 \times 10^{24}$ (four figures; the trailing zeros are placeholders, which the notation makes plain).

Product: multiply the mantissas, $6.674 \times 5.972 = 39.86$. Add the exponents, $-11 + 24 = 13$. So the product is $39.86 \times 10^{13}$, which normalises to $3.986 \times 10^{14}$. This is $G M_\oplus$, the gravitational constant times Earth's mass (the symbol $\oplus$ means Earth) — which is $\mu$. The result has four figures, like its inputs.
:::

::: check
Compute $\dfrac{(2.0 \times 10^{-3})(6.1 \times 10^{8})}{4.00 \times 10^{2}}$ and report it with the correct number of significant figures.
:::

::: answer
Mantissas: $2.0 \times 6.1 = 12.2$, and $12.2 \div 4.00 = 3.05$. Exponents: $-3 + 8 - 2 = 3$. Raw result $3.05 \times 10^3$.

The least-precise inputs ($2.0$ and $6.1$) have two figures, so the answer is $3.0 \times 10^3$ — or $3.1 \times 10^3$ if you round $3.05$ up; either is defensible, and the second figure is soft. Writing $3050$ claims precision the inputs lack.
:::

::: check
One rangefinder (a distance-measuring device) gives $12\,483.7\,\mathrm{m}$ to one point. A second, less precise one gives $12\,480\,\mathrm{m}$ to another point on the same line. How far apart are the points, and how many significant figures does the answer have? Why so few?
:::

::: answer
The calculator says $12\,483.7 - 12\,480 = 3.7\,\mathrm{m}$. But the second reading is only good to the nearest ten metres ($\pm 5\,\mathrm{m}$), so the difference is only good to the tens place. It is effectively $0 \pm 5\,\mathrm{m}$ — no significant figures at all.

Subtracting nearly equal numbers cancelled all the leading digits and left only the uncertainty. To measure a short separation, measure it directly.
:::

::: check
The nautical mile is exactly $1852\,\mathrm{m}$. A distance is measured as $37.2\,\mathrm{nmi}$. Convert it to kilometres with the right number of figures. Does the $1852$ limit the precision?
:::

::: answer
$1852\,\mathrm{m}$ is $1.852\,\mathrm{km}$, so the distance is $37.2 \times 1.852 = 68.8944$ on the calculator. The measurement has three figures, so the answer is $68.9\,\mathrm{km}$.

The $1852$ is a defined constant with unlimited precision, so it never limits the result. Only the $37.2$ does.
:::

::: check
What is the order of magnitude of a Falcon 9's lift-off mass, $5.49 \times 10^{5}\,\mathrm{kg}$, and of a $1\,\mathrm{kg}$ CubeSat (a small shoebox-sized satellite)? By how many orders of magnitude do they differ, and what does that say about their ratio?
:::

::: answer
$\log_{10}(5.49 \times 10^5) = 5.74$, which rounds to $6$. So the rocket is of order $10^6\,\mathrm{kg}$ — a thousand tonnes, to the nearest power of ten. The CubeSat is $10^0\,\mathrm{kg}$.

They differ by about six orders of magnitude, so the ratio is about a million. The exact ratio, $5.49 \times 10^5$, is within a factor of two of that — as good as orders of magnitude promise.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Scientific notation | $a \times 10^{n}$, $1 \leq \lvert a \rvert < 10$; `3.986e14` in code; engineering notation uses exponents in multiples of $3$ (k, M, G) |
| Multiply / divide | multiply or divide mantissas, add or subtract exponents, normalise |
| Add / subtract | make the exponents equal first |
| Roots | make the exponent divisible by 2 (square root) or 3 (cube root), then root each part |
| Accuracy vs precision | how close to the truth vs how finely stated |
| Significant figures | non-zero digits, zeros between them, trailing zeros after a point; not leading zeros; trailing zeros in whole numbers are ambiguous |
| Exact numbers | defined constants ($g_0$, $1852$) and pure counting numbers never limit precision |
| Multiply / divide rule | result has the figures of the least-precise input (relative errors add) |
| Add / subtract rule | result is good to the coarsest decimal place (absolute errors add) |
| Cancellation | subtracting nearly equal numbers destroys relative precision |
| Guard digits | carry extra figures through, round once at the end |
| Order of magnitude | nearest power of ten; multiplying adds orders; $\log_{10}$ to a couple of decimals is the tool |
| Floats | about $16$ decimal figures; same rules, smaller scale |

Next lesson, the last of the module, puts everything together. With orders of magnitude, units, a few remembered constants and the nerve to guess a number and say so, you will estimate rocket-sized quantities to within a factor of two — and know which guess to blame when the estimate misses.

::: context g-vs-mu Why engineers use μ, not G
Henry Cavendish first measured $G$ in 1798, with a delicate twisting balance and lead balls — an experiment often called "weighing the Earth". Even today $G$ is known to only about five significant figures, because gravity between lab-sized objects is so feeble. But Earth's $\mu = GM$ is known to about ten, from tracking satellites, whose orbits depend only on the product. So navigators use $\mu$ directly and almost never multiply $G$ by Earth's mass. It is a significant-figures lesson hiding in the first paragraph.
:::

::: context powers-ladder One step per power of ten
On this ruler every step is ten times the one before, so an ant and the distance to the Moon fit on the same line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 172" font-family="Inter, Arial, sans-serif">
<text x="20" y="22" font-size="12" fill="#1f2a44">lengths in metres: each tick is ×10</text>
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="30" y1="110" x2="30" y2="130"/><line x1="55" y1="116" x2="55" y2="124"/><line x1="80" y1="116" x2="80" y2="124"/><line x1="105" y1="110" x2="105" y2="130"/><line x1="130" y1="116" x2="130" y2="124"/><line x1="155" y1="116" x2="155" y2="124"/><line x1="180" y1="110" x2="180" y2="130"/><line x1="205" y1="116" x2="205" y2="124"/><line x1="230" y1="116" x2="230" y2="124"/><line x1="255" y1="110" x2="255" y2="130"/><line x1="280" y1="116" x2="280" y2="124"/><line x1="305" y1="116" x2="305" y2="124"/><line x1="330" y1="110" x2="330" y2="130"/></g>
  <g font-size="11" fill="#1f2a44"><line x1="41.9" y1="96" x2="41.9" y2="120" stroke="#6c7a93" stroke-width="1"/><circle cx="41.9" cy="120" r="4" fill="#b4232c"/><text x="35.9" y="92" text-anchor="start">ant, 3 mm</text><line x1="110.8" y1="74" x2="110.8" y2="120" stroke="#6c7a93" stroke-width="1"/><circle cx="110.8" cy="120" r="4" fill="#b4232c"/><text x="110.8" y="70" text-anchor="middle">person, 1.7 m</text><line x1="203.7" y1="96" x2="203.7" y2="120" stroke="#6c7a93" stroke-width="1"/><circle cx="203.7" cy="120" r="4" fill="#b4232c"/><text x="203.7" y="92" text-anchor="middle">Everest, 8.8 km</text><line x1="275.1" y1="74" x2="275.1" y2="120" stroke="#6c7a93" stroke-width="1"/><circle cx="275.1" cy="120" r="4" fill="#b4232c"/><text x="275.1" y="70" text-anchor="middle">Earth radius</text><line x1="319.6" y1="52" x2="319.6" y2="120" stroke="#6c7a93" stroke-width="1"/><circle cx="319.6" cy="120" r="4" fill="#b4232c"/><text x="325.6" y="48" text-anchor="end">Moon, 384 000 km</text></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="30" y="146">10⁻³</text><text x="30" y="162" fill="#6c7a93">milli</text><text x="105" y="146">10⁰</text><text x="105" y="162" fill="#6c7a93"></text><text x="180" y="146">10³</text><text x="180" y="162" fill="#6c7a93">kilo</text><text x="255" y="146">10⁶</text><text x="255" y="162" fill="#6c7a93">mega</text><text x="330" y="146">10⁹</text><text x="330" y="162" fill="#6c7a93">giga</text></g>
</svg>
```

The prefixes sit every three steps. Kilo comes from the Greek for "thousand", mega from "great" and giga from "giant"; milli, going down, is from the Latin for "thousand". That spacing of three is why engineering notation only uses exponents that are multiples of three.
:::

::: context mantissa-word A word borrowed from log tables
*Mantissa* is an old Latin word for a small extra — a makeweight added to top up a purchase. Early makers of logarithm tables used it for the part of a logarithm after the decimal point, which is the part their tables listed. Later it drifted to mean the digits part of a number in scientific notation. Some people prefer **significand** or **coefficient** for that, because in the log-table sense $\log_{10}(3.986 \times 10^{14}) = 14.6005$ has mantissa $0.6005$, not $3.986$.
:::

::: context darts Two dartboards
Precision is how tightly the darts cluster. Accuracy is how close the middle of the cluster lands to the bullseye.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 168" font-family="Inter, Arial, sans-serif">
<circle cx="95" cy="75" r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="95" cy="75" r="40" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="95" cy="75" r="20" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="95" cy="75" r="6" fill="#b4232c"/><circle cx="125" cy="47" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="130" cy="51" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="122" cy="53" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="128" cy="44" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="133" cy="48" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="126" cy="55" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><text x="95" y="155" font-size="12" fill="#1f2a44" text-anchor="middle">precise, not accurate</text><circle cx="265" cy="75" r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="265" cy="75" r="40" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="265" cy="75" r="20" fill="#fff" stroke="#1f2a44" stroke-width="1.2"/><circle cx="265" cy="75" r="6" fill="#b4232c"/><circle cx="295" cy="65" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="240" cy="95" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="270" cy="40" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="235" cy="60" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="285" cy="105" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><circle cx="265" cy="80" r="4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="0.8"/><text x="265" y="155" font-size="12" fill="#1f2a44" text-anchor="middle">accurate, not precise</text>
</svg>
```

A badly calibrated sensor is the left board: very repeatable, and wrong the same way every time. Engineers call that steady error a **bias**, and a good part of navigation is estimating biases and taking them out.
:::

::: context defined-exact Numbers fixed by agreement
Some of the most famous constants are now exact by definition. Since 1983 the metre has been defined as the distance light travels in $1/299\,792\,458$ of a second, so the speed of light is exactly $299\,792\,458\,\mathrm{m/s}$, with no uncertainty at all. Since 2019 the kilogram has been defined by fixing the Planck constant in the same way. A constant that is exact can never be the weakest link in your significant figures.
:::

::: context bankers-rounding Banker's rounding
Round $0.5$, $1.5$, $2.5$ and $3.5$ the schoolbook way and you get $1 + 2 + 3 + 4 = 10$, though the true total is $8$. Every half went up, so the error only grows. Round halves to even instead and you get $0 + 2 + 2 + 4 = 8$: half the halves go up and half go down, and over many numbers the errors cancel. This is often called **banker's rounding**, and it is the default in IEEE 754, the standard for computer arithmetic.
:::

::: context patriot When tiny errors piled up
In February 1991 a Patriot air-defence battery in Dhahran, Saudi Arabia, failed to stop an incoming Scud missile, which hit a US Army barracks and killed 28 soldiers. The battery's computer counted time in tenths of a second, and $0.1$ cannot be stored exactly in binary, so every tick was chopped very slightly short. After about $100$ hours of running, the clock was off by about a third of a second. A Scud travels more than half a kilometre in that time, so the system looked for it in the wrong place.
:::

::: context log-halfway The middle of a power of ten
On a log scale the middle of $1$ and $10$ is not $5.5$ but $\sqrt{10} \approx 3.16$: the same number of *times* away from each end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 156" font-family="Inter, Arial, sans-serif">
<rect x="105.0" y="60" width="150.0" height="28" fill="#8fb8f0"/>
  <text x="180" y="52" font-size="12" fill="#1d6fd1" text-anchor="middle">everything here rounds to 10¹</text>
  <line x1="20" y1="74" x2="340" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.2"><line x1="30.0" y1="62" x2="30.0" y2="86"/><line x1="75.2" y1="68" x2="75.2" y2="80"/><line x1="101.6" y1="68" x2="101.6" y2="80"/><line x1="120.3" y1="68" x2="120.3" y2="80"/><line x1="134.8" y1="68" x2="134.8" y2="80"/><line x1="146.7" y1="68" x2="146.7" y2="80"/><line x1="156.8" y1="68" x2="156.8" y2="80"/><line x1="165.5" y1="68" x2="165.5" y2="80"/><line x1="173.1" y1="68" x2="173.1" y2="80"/><line x1="180.0" y1="62" x2="180.0" y2="86"/><line x1="225.2" y1="68" x2="225.2" y2="80"/><line x1="251.6" y1="68" x2="251.6" y2="80"/><line x1="270.3" y1="68" x2="270.3" y2="80"/><line x1="284.8" y1="68" x2="284.8" y2="80"/><line x1="296.7" y1="68" x2="296.7" y2="80"/><line x1="306.8" y1="68" x2="306.8" y2="80"/><line x1="315.5" y1="68" x2="315.5" y2="80"/><line x1="323.1" y1="68" x2="323.1" y2="80"/><line x1="330.0" y1="62" x2="330.0" y2="86"/></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30.0" y="104">1</text><text x="180.0" y="104">10</text><text x="330.0" y="104">100</text>
  </g>
  <g font-size="12" fill="#b4232c" text-anchor="middle">
    <text x="105.0" y="122">3.16</text><text x="255.0" y="122">31.6</text>
  </g>
  <text x="180" y="146" font-size="11" fill="#6c7a93" text-anchor="middle">3.16 is 3.16 times 1, and 10 is 3.16 times 3.16</text>
</svg>
```

Everything in the shaded stretch is "of order ten". On this scale any doubling takes the same width, about $30\%$ of a power of ten, because $\log_{10} 2 = 0.30$.
:::

::: context slide-rule A computer made of two rulers
A **slide rule** does exactly this, with no batteries. Two rulers carry log scales; sliding one along the other adds lengths, and adding logarithms multiplies numbers. The English clergyman William Oughtred invented it around 1622, a few years after Napier's logarithms. For more than three centuries engineers designed bridges, aircraft and rockets with slide rules, good to about three significant figures. Apollo astronauts carried one to the Moon as a backup.
:::
