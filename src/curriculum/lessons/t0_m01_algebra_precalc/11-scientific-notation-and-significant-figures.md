---
id: l11-scientific-notation-and-significant-figures
title: Scientific notation and significant figures
minutes: 19
covers:
  - scientific notation and significant figures
---

Earth's gravitational parameter is $398\,600\,000\,000\,000\,\mathrm{m^3/s^2}$. The gravitational constant is $0.000\,000\,000\,066\,74\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$. Nobody can read either number, count its zeros reliably, or multiply the two in their head. **Scientific notation** — $3.986 \times 10^{14}$ and $6.674 \times 10^{-11}$ — separates the *size* of a number (the power of ten) from its *digits* (the part between one and ten), so that the two can be handled separately: the powers by adding exponents, the digits by ordinary arithmetic on small numbers. You have been reading it all module. This lesson makes the rules explicit and then turns to the question the notation raises: how many of those digits are you actually entitled to write?

That question is about **significant figures**. A stage mass quoted as $25\,\mathrm{t}$ is not the same claim as one quoted as $25.00\,\mathrm{t}$; the second promises to know the mass to ten kilograms, and if it came from a spring scale it is a lie. Carrying too few figures throws away information; carrying too many claims information you do not have, and the false precision propagates into every downstream number, where a reviewer will eventually ask where the fourth decimal came from. The rules for how precision passes through multiplication, division, addition and subtraction are derived here from how errors actually combine, so that you know when to apply them and when they are only a rule of thumb.

The last section defines the order of magnitude of a number, which is the coarsest possible statement about its size and the currency of the estimation lesson that closes the module.

## Scientific notation

A number in **scientific notation** is written $a \times 10^{n}$ with the **mantissa** (or coefficient) $a$ satisfying $1 \leq |a| < 10$ and the **exponent** $n$ an integer. The exponent counts how many places the decimal point moved: $7673 = 7.673 \times 10^3$ (three places left), $0.000\,457 = 4.57 \times 10^{-4}$ (four places right). A number already between one and ten has exponent zero, $9.82 = 9.82 \times 10^0$. Negative numbers keep their sign on the mantissa, $-4.2 \times 10^{2}$. The reason for the $1 \leq |a| < 10$ convention is uniqueness — every number then has exactly one representation — but nothing breaks if you write $39.86 \times 10^{13}$ in the middle of a calculation; you **normalise** at the end.

Computers and calculators write the same thing as `3.986e14` and `6.674e-11`, the `e` standing for "times ten to the". Python reads and prints this form, and every constant in the track's code is written in it. **Engineering notation** restricts the exponent to multiples of three so that it matches the SI prefixes: $7.607 \times 10^6\,\mathrm{N}$ is $7.607\,\mathrm{MN}$, and $344.7 \times 10^3\,\mathrm{Pa}$ is $344.7\,\mathrm{kPa}$. Either is fine; be consistent within a calculation.

### Arithmetic in scientific notation

The exponent laws from the exponents lesson do the work. To **multiply**, multiply the mantissas and add the exponents; to **divide**, divide the mantissas and subtract the exponents; then normalise. Gravity at the surface:

$$
\frac{3.986 \times 10^{14}}{(6.371 \times 10^{6})^2} = \frac{3.986 \times 10^{14}}{40.59 \times 10^{12}} = \frac{3.986}{40.59} \times 10^{14 - 12} = 0.09820 \times 10^{2} = 9.820\,\mathrm{m/s^2} .
$$

Squaring squared the mantissa and doubled the exponent; dividing subtracted; the mantissa $0.0982$ was renormalised by moving one power of ten across. The whole calculation is two small divisions and some bookkeeping of integers, which is the point.

To **add or subtract**, the exponents must first be made equal, because you can only add like quantities: $3.986 \times 10^{14} + 4.903 \times 10^{12}$ is $3.986 \times 10^{14} + 0.04903 \times 10^{14} = 4.035 \times 10^{14}$. (That is Earth's gravitational parameter plus the Moon's, the combined $\mu$ used for the Moon's orbit.) Notice that the smaller number contributed only to the third decimal of the larger; when exponents differ by many, the smaller term may vanish entirely at the precision you keep, and knowing that in advance saves computing it.

**Roots** halve the exponent — when the exponent is even. $\sqrt{5.887 \times 10^7}$ has an odd exponent, so shift first: $\sqrt{58.87 \times 10^{6}} = \sqrt{58.87} \times 10^{3} = 7.673 \times 10^3$, the low-orbit speed again. A cube root wants an exponent divisible by three, $\sqrt[3]{2.944 \times 10^{20}} = \sqrt[3]{294.4 \times 10^{18}} = 6.65 \times 10^{6}$, as in the period-to-radius check of the exponents lesson.

::: warning Keep the exponent with the number
The classic slip is to compute the mantissas correctly, forget to combine the exponents, and report an answer a thousand or a million times off. A second slip is normalising in the wrong direction: $0.0982 \times 10^2$ is $9.82 \times 10^0$, not $9.82 \times 10^4$ — moving the decimal point right *lowers* the exponent. A third is squaring the mantissa and forgetting to double the exponent, $(6.371 \times 10^6)^2 \neq 40.59 \times 10^6$. Against all three, do a rough order-of-magnitude check on the final answer: surface gravity is "about ten", so $9.82 \times 10^4$ is wrong before you look for the mistake.
:::

## Precision, accuracy and significant figures

A measurement or a computed value carries an uncertainty, and its digits should say so. **Accuracy** is how close a value is to the truth; **precision** is how finely it is stated or how reproducible it is. A pressure gauge reading $300.0\,\mathrm{psi}$ that is miscalibrated by $20\,\mathrm{psi}$ is precise and inaccurate; one reading "about $300$" that is right is accurate and imprecise. Significant figures are about precision: they are the digits in a number that carry information.

The rules for counting them:

- Every non-zero digit is significant: $7673$ has four.
- Zeros *between* non-zero digits are significant: $6.071$ has four.
- Leading zeros are not: $0.00457$ has three. They only place the decimal point, which is why scientific notation ($4.57 \times 10^{-3}$) never shows them.
- Trailing zeros after a decimal point are significant: $25.00$ has four and promises hundredths.
- Trailing zeros in a whole number are ambiguous: $400\,\mathrm{km}$ might mean one, two or three figures. Scientific notation removes the ambiguity — $4 \times 10^2$, $4.0 \times 10^2$, $4.00 \times 10^2$ — and is the reason to use it whenever precision matters.

Exact numbers have unlimited significant figures and never limit a result. The $2$ in $\tfrac{1}{2}mv^2$, the $4\pi$ in a sphere's area, the defined $g_0 = 9.80665$, the defined $1852\,\mathrm{m}$ in a nautical mile: none of these introduces uncertainty. Only measured or estimated inputs do.

**Rounding** to $n$ significant figures keeps the first $n$ and rounds the last by the digit after it: $7672.59$ to four is $7673$; $9.8202$ to three is $9.82$; $0.0004567$ to two is $0.00046 = 4.6 \times 10^{-4}$. A trailing $5$ with nothing after it is conventionally rounded up ($2.345 \to 2.35$), though be aware that Python's `round` and many numerical libraries round halves to the nearest *even* digit (`round(2.5)` is `2`, `round(3.5)` is `4`) to avoid a systematic upward bias over many operations. Neither convention matters at the third figure of an engineering estimate; both matter in accounting.

## How precision passes through arithmetic

Rather than memorise the rules, derive them from how errors combine. Write an uncertain quantity as $x(1 + \varepsilon_x)$, where $\varepsilon_x$ is its **relative error** — the uncertainty as a fraction of the value. A number quoted to three significant figures has a relative error of roughly half a unit in the third place, somewhere between $0.05\%$ and $0.5\%$ depending on its leading digit; to four figures, ten times smaller.

### Multiplication and division

The product of two uncertain numbers is $x(1 + \varepsilon_x) \cdot y(1 + \varepsilon_y) = xy\,(1 + \varepsilon_x + \varepsilon_y + \varepsilon_x\varepsilon_y)$. The last term is the product of two small numbers and negligible, so

$$
\varepsilon_{xy} \approx \varepsilon_x + \varepsilon_y :
$$

**relative errors add under multiplication**, and the same holds for division (with the errors still adding in the worst case, since an error in the denominator can go either way). The relative error of the result is therefore at least as large as the larger input error, and the result cannot be more precise than the least precise input. That is the rule: **through a chain of multiplications and divisions, the result carries no more significant figures than the least-precise input.** Check it: $1\%$ and $2\%$ errors combine to $(1.01)(1.02) - 1 = 3.02\%$, essentially $3\%$.

Thrust $7607\,\mathrm{kN}$ (four figures) divided by weight $5384\,\mathrm{kN}$ (four figures) is $1.4129$ on a calculator; four figures, $1.413$, is all the inputs support. Had the thrust been quoted as $7.6\,\mathrm{MN}$, two figures, the ratio would be $1.4$ and no more.

### Addition and subtraction

Adding is different, because the *absolute* errors add, not the relative ones. If $x$ is known to $\pm 0.5$ and $y$ to $\pm 0.05$, then $x + y$ is known to about $\pm 0.55$: the coarser input's uncertainty dominates and the finer one's decimal places are meaningless in the sum. So the rule is about decimal *places*, not figures: **a sum or difference is precise to the coarsest decimal place among its inputs.** Stage masses $22.4 + 410.7 + 15.25 = 448.35$ on the calculator, but $410.7$ is only good to tenths, so the sum is $448.4\,\mathrm{t}$ (four figures, as it happens — the number of figures is a consequence, not the rule). If the propellant were quoted as $410\,\mathrm{t}$ to the nearest tonne, the sum would be $448\,\mathrm{t}$ regardless of the decimals on the smaller terms.

Subtraction has a sting. The orbital radius $6771\,\mathrm{km}$ and Earth's radius $6371\,\mathrm{km}$ are each four figures, one part in seven thousand. Their difference, the altitude $400\,\mathrm{km}$, inherits an absolute uncertainty of about a kilometre from each — so it is $400 \pm 1$, one part in four hundred, barely three figures. Subtracting nearly equal numbers *destroys* relative precision, because the leading digits cancel and only the uncertain trailing ones survive. This is the catastrophic cancellation that the quadratic formula suffered in the equations lesson, and it is why altitude should be measured or stored as altitude rather than as a difference of two radii when the precision matters.

::: key Significant figures through arithmetic
Multiplication and division: the result carries no more significant figures than the least-precise input (relative errors add). Addition and subtraction: the result is precise to the coarsest decimal place among the inputs (absolute errors add), so the count of significant figures can go up or down — and subtracting nearly equal numbers can destroy most of it. Exact and defined constants never limit precision.
:::

### Intermediate results

The rules say how many figures to *report*. They do not say how many to *carry*. Rounding at every intermediate step introduces a fresh error each time, and those errors accumulate; rounding $9.82$ to $10$ and then using it in three more steps can move the answer by several percent. Carry one or two **guard digits** beyond what the inputs justify through the whole calculation, and round once, at the end. On a computer this is automatic — a double-precision float carries about sixteen significant figures, far more than any measurement — but the reporting rule still applies: `7672.594396313682` in a printout is not a claim to sixteen figures of orbital speed, and a written result should be cut back to what the inputs deserve.

::: example Orbital speed with the figures accounted for
$v = \sqrt{\mu / r}$ with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (four figures) and $r = 6771\,\mathrm{km}$ (four figures, from $6371 + 400$ with the altitude taken as exact). Compute with guard digits: $\mu / r = 3.986 \times 10^{14} / 6.771 \times 10^{6} = 0.58869 \times 10^{8} = 5.8869 \times 10^{7}\,\mathrm{m^2/s^2}$; then $\sqrt{58.869 \times 10^{6}} = 7.6726 \times 10^{3}\,\mathrm{m/s}$. The inputs have four figures, so report $v = 7673\,\mathrm{m/s}$ — or $7.673\,\mathrm{km/s}$, which says the same thing more legibly.

How much did the fourth figure of $\mu$ matter? The more precise value $3.986\,004 \times 10^{14}$ changes $v$ to $7672.60$, a difference of four millimetres per second. The four-figure $\mu$ was already better than the four-figure result required; had the altitude been known only as "about $400\,\mathrm{km}$", to one figure, then $r$ would be uncertain by tens of kilometres, $\mu/r$ by a percent or so, and $v$ by half a percent — three figures, $7.67\,\mathrm{km/s}$, would be honest and $7673$ would not. The number of figures you report is a statement about the *worst* input, not the best.
:::

::: example Adding up a mass budget
A stage's components are listed as: structure $18.4\,\mathrm{t}$, engines $4.2\,\mathrm{t}$, avionics and residuals $0.65\,\mathrm{t}$, and propellant $410\,\mathrm{t}$ (quoted to the nearest tonne). The calculator total is $433.25\,\mathrm{t}$. The propellant is the coarsest input, good to $\pm 0.5\,\mathrm{t}$, so the total is $433\,\mathrm{t}$: the $0.25$ is noise, and the avionics figure's second decimal was never going to survive the sum.

Now the mass ratio with payload $15\,\mathrm{t}$: $m_0 = 448\,\mathrm{t}$, $m_f = 448 - 410 = 38\,\mathrm{t}$. The subtraction has left $m_f$ good to about a tonne, roughly $\pm 2.6\%$, so $MR = 448 / 38 = 11.79$ is really $11.8$ — three figures, and even the third is soft. Notice which step cost the precision: not the multiplication, but the subtraction of two numbers of similar size to get the small burnout mass. In a real design the dry mass is tracked directly and to the kilogram for exactly this reason.
:::

## Orders of magnitude

The **order of magnitude** of a positive number is the power of ten nearest to it, in the logarithmic sense: the integer part of $\log_{10}$ after rounding the mantissa. Numbers from $3.16$ to $31.6$ — that is, $10^{0.5}$ to $10^{1.5}$ — are "of order ten", $10^1$. A more casual usage takes the exponent in scientific notation directly, so that anything from $1 \times 10^{n}$ to $9.99 \times 10^{n}$ is of order $10^{n}$; both usages are common, and the difference is at most one power of ten, which is the resolution of the concept anyway. Two numbers "differ by an order of magnitude" when their ratio is about ten; by three orders when it is about a thousand.

This is the coarsest honest statement about a quantity's size and it is remarkably useful. Low-orbit speed is of order $10^4\,\mathrm{m/s}$ (since $7673 = 10^{3.88}$ rounds up); surface gravity is of order $10^1\,\mathrm{m/s^2}$; the Earth–Moon distance is of order $10^8\,\mathrm{m}$ ($3.84 \times 10^8$, $\log_{10} = 8.58$, so order $10^9$ by the strict rule and $10^8$ by the casual one — the ambiguity in action). What makes orders of magnitude work is the logarithm: multiplying numbers *adds* their orders, so a product of six factors each known to an order of magnitude is itself known to within a few orders of magnitude, and often to better, because errors in opposite directions cancel. The estimation lesson makes that argument carefully.

Common logarithms to one decimal are the tool. $\log_{10}(1.013 \times 10^5) = 5.006$, $\log_{10}(5.1 \times 10^{14}) = 14.708$, $\log_{10} 9.81 = 0.992$; so $\dfrac{1.013 \times 10^5 \times 5.1 \times 10^{14}}{9.81}$ has $\log_{10} = 5.006 + 14.708 - 0.992 = 18.72$, and the result is $10^{0.72} \times 10^{18} = 5.2 \times 10^{18}$. You have multiplied and divided three awkward numbers by adding three easy ones, and the answer — the mass of Earth's atmosphere in kilograms, as the next lesson will explain — lands within one percent of the $5.27 \times 10^{18}$ that grinding through the long multiplication gives.

::: note Floating point is not exact either
A double-precision float stores about $15$–$16$ significant decimal figures and an exponent from roughly $10^{-308}$ to $10^{308}$. That is more than enough for any physical quantity, but it is finite: `0.1 + 0.2` prints as `0.30000000000000004`, because neither $0.1$ nor $0.2$ has an exact binary representation. The rules of this lesson apply to floats as to pencil work — subtraction of nearly equal values loses figures, products accumulate relative error — only at the sixteenth figure instead of the fourth. The numerical-methods module is about what happens when a million such operations are chained.
:::

## Check yourself

::: check
Write $0.000\,000\,066\,74$ and $5\,972\,000\,000\,000\,000\,000\,000\,000$ in scientific notation, state how many significant figures each has, and multiply them.
:::

::: answer
$6.674 \times 10^{-11}$ (four figures; the leading zeros do not count) and $5.972 \times 10^{24}$ (four figures; the trailing zeros are placeholders, which the notation makes explicit). Product: $6.674 \times 5.972 = 39.86$, exponents $-11 + 24 = 13$, so $39.86 \times 10^{13} = 3.986 \times 10^{14}$. This is $G M_\oplus = \mu$, and the result has four figures like its inputs.
:::

::: check
Compute $\dfrac{(2.0 \times 10^{-3})(6.1 \times 10^{8})}{4.00 \times 10^{2}}$ and report it with the correct number of significant figures.
:::

::: answer
Mantissas: $2.0 \times 6.1 / 4.00 = 12.2 / 4.00 = 3.05$. Exponents: $-3 + 8 - 2 = 3$. Raw result $3.05 \times 10^3$. The least-precise inputs ($2.0$ and $6.1$) have two figures, so the answer is $3.0 \times 10^3$ — or $3.1 \times 10^3$ if you round the $3.05$ up; either is defensible and the second figure is soft. Reporting $3050$ would claim a precision the inputs lack.
:::

::: check
A rangefinder gives $12\,483.7\,\mathrm{m}$ and a second one, less precise, gives $12\,480\,\mathrm{m}$ for a second point on the same line. How far apart are the points, and how many significant figures does the answer have? Why so few?
:::

::: answer
$12\,483.7 - 12\,480 = 3.7\,\mathrm{m}$ on the calculator, but the second reading is only good to the nearest ten metres ($\pm 5\,\mathrm{m}$), so the difference is precise only to the tens place: it is $0 \pm 5\,\mathrm{m}$, effectively — no significant figures at all. The two inputs had six and four figures; subtracting nearly equal numbers cancelled all the leading digits and left only the uncertainty. To measure a short separation, measure it directly.
:::

::: check
The nautical mile is exactly $1852\,\mathrm{m}$. A distance is measured as $37.2\,\mathrm{nmi}$. Convert to kilometres with the right number of figures. Does the $1852$ limit the precision?
:::

::: answer
$37.2 \times 1.852 = 68.8944$, and the measurement has three figures, so $68.9\,\mathrm{km}$. The $1852$ is a defined constant with unlimited precision; it never limits the result. Only the $37.2$ does.
:::

::: check
What is the order of magnitude of a Falcon 9 lift-off mass, $5.49 \times 10^{5}\,\mathrm{kg}$, and of a $1\,\mathrm{kg}$ CubeSat? By how many orders of magnitude do they differ, and what does that mean for the ratio?
:::

::: answer
$\log_{10}(5.49 \times 10^5) = 5.74$, which rounds to $6$: the vehicle is of order $10^6\,\mathrm{kg}$ (a thousand tonnes, to the nearest power of ten). The CubeSat is $10^0\,\mathrm{kg}$. They differ by about six orders of magnitude, so the ratio is about a million; the exact ratio, $5.49 \times 10^5$, is within a factor of two of that, which is as good as orders of magnitude promise.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Scientific notation | $a \times 10^{n}$, $1 \leq \lvert a \rvert < 10$; `3.986e14` in code; engineering notation uses exponents in multiples of $3$ |
| Multiply / divide | multiply or divide mantissas, add or subtract exponents, normalise |
| Add / subtract | equalise exponents first |
| Roots | make the exponent divisible by the root's index, then take the root of each part |
| Significant figures | non-zero digits, interior zeros, trailing zeros after a point; not leading zeros; trailing zeros in whole numbers are ambiguous |
| Exact numbers | defined constants ($g_0$, $1852$) and pure integers never limit precision |
| Multiply / divide rule | result has the figures of the least-precise input (relative errors add) |
| Add / subtract rule | result is good to the coarsest decimal place (absolute errors add) |
| Cancellation | subtracting nearly equal numbers destroys relative precision |
| Guard digits | carry extra figures through, round once at the end |
| Order of magnitude | nearest power of ten; multiplying adds orders; $\log_{10}$ to one decimal is the tool |
| Floats | about $16$ decimal figures; same rules, smaller scale |

The final lesson of the module puts everything together: with orders of magnitude, units, a few remembered constants and the courage to guess a factor and say so, you will estimate rocket-sized quantities to within a factor of two and know which assumption to blame when the estimate misses.
