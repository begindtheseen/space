---
id: l01-signed-numbers-and-fractions
title: Signed numbers, fractions and ratios
minutes: 16
covers:
  - arithmetic with signed numbers and fractions
---

Every quantity a guidance computer handles is a number with a sign and, usually, a fraction hiding inside it: a velocity error of $-0.42\,\mathrm{m/s}$, a propellant fraction of $0.917$, a mixture ratio of $2.3$ parts oxidizer to $1$ part fuel. The arithmetic of those numbers is the floor everything else in this track stands on. If it is shaky, every later derivation will wobble in the same places, and the slips will look like physics errors when they are only sign errors.

This lesson rebuilds that floor deliberately. It starts from the number line, derives the sign rules instead of asking you to memorise them, then does the same for fractions, ratios and percentages. Along the way it introduces the first genuinely aerospace quantities of the module: the **mass ratio** of a rocket stage and the **mixture ratio** of a bipropellant engine. Both are fractions, and both are misread constantly by people who would never admit to being weak at fractions.

Work through every arithmetic step with a pencil rather than a calculator the first time. The point is not the answers; it is noticing exactly where your hand hesitates.

## The number line and signed quantities

A signed number is a magnitude with a direction. On a number line, $+5$ sits five units to the right of zero and $-5$ five units to the left. In engineering the direction is a physical convention you choose: up is positive and down is negative, or prograde is positive and retrograde is negative. Once chosen, the sign carries that convention through every calculation, which is precisely why sign errors are dangerous — they silently reverse the physics.

**Adding** a signed number moves you along the line: adding $+3$ moves three units right, adding $-3$ moves three units left. **Subtracting** is defined as adding the opposite:

$$
a - b = a + (-b).
$$

That one definition explains the rule learners find strangest, subtracting a negative: $-5 - (-8) = -5 + 8 = 3$. You are removing a leftward step, which is the same as taking a rightward one.

**Multiplication** by a positive number scales a length; multiplication by $-1$ reflects it through zero. The rule "negative times negative is positive" is not a convention to memorise; it follows from insisting that the distributive law $a(b + c) = ab + ac$ keeps working for all numbers. Start from $(-1)\cdot 0 = 0$ and write the zero as $1 + (-1)$:

$$
0 = (-1)(1 + (-1)) = (-1)(1) + (-1)(-1) = -1 + (-1)(-1).
$$

The only number that added to $-1$ gives $0$ is $+1$, so $(-1)(-1) = 1$. Every other sign rule follows by pulling out factors of $-1$: $(-3)(-4) = (-1)(3)(-1)(4) = (+1)(12) = 12$, while $(-3)(4) = -12$. Division inherits the same rules because $a \div b$ is $a \cdot \frac{1}{b}$ and $\frac{1}{b}$ has the sign of $b$; so $(-12) \div (-3) = 4$.

The **absolute value** $|x|$ is the distance from zero, always non-negative: $|-7| = 7$. A velocity error of $-0.42\,\mathrm{m/s}$ has magnitude $0.42\,\mathrm{m/s}$; the sign says which way you are off, the absolute value says by how much.

### Order of operations

Expressions are evaluated in a fixed order: grouping symbols first, then exponents, then multiplication and division left to right, then addition and subtraction left to right. For example

$$
2 + 3 \cdot 4^2 - (-6) \div 3 = 2 + 3 \cdot 16 + 2 = 52.
$$

::: warning The minus sign in front of a power
$-3^2$ means $-(3^2) = -9$: the exponent binds before the minus. $(-3)^2$ means $(-3)(-3) = 9$. The two differ by $18$, and this exact slip shows up in energy calculations where a negative velocity is squared. When in doubt, write the parentheses.
:::

::: example Signed differences on a real vehicle
Liquid oxygen boils at about $-183\,^\circ\mathrm{C}$ and the kerosene in the neighbouring tank sits near $+20\,^\circ\mathrm{C}$. The temperature difference across the common bulkhead is

$$
20 - (-183) = 20 + 183 = 203\,\mathrm{K}.
$$

A spacecraft skin that cycles from $-65\,^\circ\mathrm{C}$ in eclipse to $+85\,^\circ\mathrm{C}$ in sunlight swings by $85 - (-65) = 150\,\mathrm{K}$ every orbit.

Now a velocity change. Take "up" as positive. A test article is moving upward at $v_i = +250\,\mathrm{m/s}$; later it is falling at $v_f = -50\,\mathrm{m/s}$. Its velocity change is

$$
\Delta v = v_f - v_i = -50 - 250 = -300\,\mathrm{m/s}.
$$

The magnitude is $300\,\mathrm{m/s}$ and the sign says the change was downward — larger than either speed alone, because the direction reversed. Finally a retrograde burn: a satellite at $7670\,\mathrm{m/s}$ fires against its motion for $\Delta v = -120\,\mathrm{m/s}$ and ends at $7670 + (-120) = 7550\,\mathrm{m/s}$.
:::

## Fractions are division

The fraction $\frac{a}{b}$ means $a \div b$: $a$ is the **numerator**, $b$ the **denominator**, and $b$ must not be zero because nothing times zero gives a non-zero $a$. Two fractions are **equivalent** when they represent the same number, and you move between equivalent forms by multiplying numerator and denominator by the same non-zero quantity:

$$
\frac{a}{b} = \frac{ka}{kb}, \qquad k \neq 0.
$$

Read backwards this is **simplifying**: cancel a factor common to top and bottom. You may cancel factors, never terms — $\frac{6 + 3}{3}$ is $3$, not $6 + 1 = 7$, and not $6$ either; write it as $\frac{6}{3} + \frac{3}{3} = 2 + 1 = 3$.

**Adding and subtracting** fractions requires a common denominator, because you can only count pieces of the same size:

$$
\frac{3}{4} + \frac{5}{6} = \frac{9}{12} + \frac{10}{12} = \frac{19}{12}, \qquad
\frac{5}{8} - \frac{7}{12} = \frac{15}{24} - \frac{14}{24} = \frac{1}{24}.
$$

The general form is $\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}$; the least common denominator ($12$ rather than $24$ in the first case) keeps the numbers small but any common denominator works.

**Multiplying** is straight across: $\frac{a}{b}\cdot\frac{c}{d} = \frac{ac}{bd}$. **Dividing** by a fraction is multiplying by its **reciprocal**, the fraction flipped over, because $\frac{c}{d}\cdot\frac{d}{c} = 1$:

$$
\frac{2}{3} \div \frac{4}{9} = \frac{2}{3}\cdot\frac{9}{4} = \frac{18}{12} = \frac{3}{2}.
$$

A **complex fraction** has fractions inside it; clear it from the inside out:

$$
\frac{\tfrac{1}{2} + \tfrac{1}{3}}{\tfrac{1}{4}} = \frac{\tfrac{5}{6}}{\tfrac{1}{4}} = \frac{5}{6}\cdot 4 = \frac{10}{3}.
$$

Every fraction is also a decimal, obtained by carrying out the division: $\frac{2}{7} = 0.285714\ldots$, repeating forever. Engineering keeps quantities as decimals in the end, but during a derivation exact fractions are safer, because $\frac{1}{3}$ carries no rounding error and $0.333$ does.

::: warning Adding denominators
$\frac{1}{2} + \frac{1}{3}$ is not $\frac{2}{5}$. Adding numerators and denominators separately is the most common fraction error in the world, and it survives into adult engineering as "average the two rates". Half a tank plus a third of a tank is five sixths of a tank, never two fifths.
:::

## Ratios, proportions and percentages

A **ratio** $a{:}b$ compares two quantities by division. It answers "how many of one per how many of the other", and it is scale-free: $3{:}5$ is the same ratio as $240{:}400$. The most useful move with a ratio is turning it into **fractions of the whole**. If a total of $640\,\mathrm{kg}$ is split $3{:}5$, there are $3 + 5 = 8$ shares, so the parts are $\frac{3}{8}\cdot 640 = 240\,\mathrm{kg}$ and $\frac{5}{8}\cdot 640 = 400\,\mathrm{kg}$.

A **proportion** states that two ratios are equal, $\frac{a}{b} = \frac{c}{d}$, and cross-multiplying gives $ad = bc$. Proportional reasoning is how you scale a design: if $411\,\mathrm{t}$ of propellant burns in $162\,\mathrm{s}$, the average mass flow is the unit rate $\frac{411\,000}{162} \approx 2540\,\mathrm{kg/s}$, and any other duration at the same rate scales in proportion.

A **percentage** is a fraction with denominator $100$: $7.5\% = \frac{7.5}{100} = 0.075$. A percent *change* is always relative to the starting value:

$$
\text{percent change} = \frac{\text{new} - \text{old}}{\text{old}} \times 100\%.
$$

Raising a propellant load from $400\,\mathrm{t}$ to $411\,\mathrm{t}$ is a change of $\frac{11}{400} \times 100\% = 2.75\%$. Ask "percent of what?" every time; a $5\%$ margin on thrust and a $5\%$ margin on mass are $5\%$ of different things and cannot be added.

## The mass ratio of a rocket stage

Here is the first fraction the whole curriculum will keep coming back to. A single rocket stage is built from three masses:

- the **dry mass** $m_d$: tanks, engines, structure, avionics — everything that is still there after the engines shut down;
- the **propellant mass** $m_p$: the fuel and oxidizer that get thrown out the back;
- the **payload mass** $m_L$: whatever the stage is carrying.

At ignition the stage weighs everything, the **initial** (or wet) mass $m_0 = m_d + m_p + m_L$. At burnout the propellant is gone, leaving the **final** mass $m_f = m_d + m_L$. The **mass ratio** compares them:

$$
MR = \frac{m_0}{m_f} = \frac{m_d + m_p + m_L}{m_d + m_L}.
$$

It is a pure number — tonnes over tonnes — and it is always greater than $1$, because the numerator is the denominator plus a positive $m_p$. Its reciprocal $\frac{1}{MR} = \frac{m_f}{m_0}$ is the fraction of lift-off mass that survives to burnout, and $1 - \frac{1}{MR} = \frac{m_0 - m_f}{m_0} = \frac{m_p}{m_0}$ is the fraction that was propellant. A separate quantity, the **propellant mass fraction** $\zeta = \frac{m_p}{m_p + m_d}$, measures how good the stage *structure* is: how much of the stage-without-payload is propellant. Keep the two apart; the same symbols $m_d$, $m_p$ and $m_L$ appear in the module's derivation exercise.

::: key Mass ratio
$MR = m_0 / m_f$ — initial (wet) mass over burnout mass, where $m_0 = m_d + m_p + m_L$ and $m_f = m_d + m_L$ (dry mass plus payload). It is dimensionless and always greater than $1$.
:::

::: example Mass ratio of a stage with payload
A stage has dry mass $m_d = 22\,\mathrm{t}$, carries $m_p = 410\,\mathrm{t}$ of propellant and lifts a payload $m_L = 15\,\mathrm{t}$.

$$
m_0 = 22 + 410 + 15 = 447\,\mathrm{t}, \qquad m_f = 22 + 15 = 37\,\mathrm{t}, \qquad MR = \frac{447}{37} \approx 12.1.
$$

The burnout fraction is $\frac{1}{MR} = \frac{37}{447} \approx 0.0828$; the propellant fraction is $1 - 0.0828 = 0.917$, so about $91.7\%$ of what left the pad was propellant. The structural quality is $\zeta = \frac{410}{410 + 22} = \frac{410}{432} \approx 0.949$. Notice that $\zeta$ ignores the payload entirely while $MR$ depends on it strongly: drop the payload to zero and $MR$ becomes $\frac{432}{22} \approx 19.6$.
:::

::: warning The dry mass is in the numerator too
The classic slip is $MR = m_p / m_d$, dividing propellant by dry mass. That ratio is $\frac{410}{22} \approx 18.6$ in the example above — wrong both because the dry mass also flies at lift-off (it belongs in $m_0$) and because the payload belongs in both $m_0$ and $m_f$. Write $m_0$ and $m_f$ out in full before dividing, every time.
:::

## Mixture ratio and bulk density

A bipropellant engine burns an oxidizer and a fuel in a fixed proportion called the **mixture ratio**, written $O/F$ and quoted by mass. A kerosene–oxygen engine running at $O/F = 2.3$ consumes $2.3\,\mathrm{kg}$ of liquid oxygen for every $1\,\mathrm{kg}$ of RP-1. That is a ratio $2.3{:}1$, so the fractions of the total propellant are

$$
f_{ox} = \frac{O/F}{1 + O/F} = \frac{2.3}{3.3} \approx 0.697, \qquad f_{fuel} = \frac{1}{1 + O/F} = \frac{1}{3.3} \approx 0.303.
$$

Those fractions sum to $1$, as fractions of a whole must. Volumes follow from densities: mass equals density times volume, $m = \rho V$, so $V = m/\rho$. The **bulk density** of the propellant combination is the total mass divided by the total volume, and because the two liquids have different densities it is *not* the average of the two densities. Derive it once:

$$
\rho_{bulk} = \frac{m_{ox} + m_{fuel}}{V_{ox} + V_{fuel}}
= \frac{m_{ox} + m_{fuel}}{\dfrac{m_{ox}}{\rho_{ox}} + \dfrac{m_{fuel}}{\rho_{fuel}}}
= \frac{1 + O/F}{\dfrac{O/F}{\rho_{ox}} + \dfrac{1}{\rho_{fuel}}},
$$

where the last step divides top and bottom by $m_{fuel}$ and uses $m_{ox}/m_{fuel} = O/F$. This is a complex fraction of exactly the kind you cleared above, and it is the number that sizes tanks.

::: example Splitting a propellant load and sizing its volume
A stage carries $400\,\mathrm{t}$ of propellant at $O/F = 2.3$, with $\rho_{ox} = 1141\,\mathrm{kg/m^3}$ for liquid oxygen and $\rho_{fuel} = 810\,\mathrm{kg/m^3}$ for RP-1.

Masses: $m_{ox} = 0.697 \times 400\,\mathrm{t} \approx 278.8\,\mathrm{t}$ and $m_{fuel} = 0.303 \times 400\,\mathrm{t} \approx 121.2\,\mathrm{t}$. Check: $278.8 + 121.2 = 400$.

Volumes: $V_{ox} = \dfrac{278\,800}{1141} \approx 244\,\mathrm{m^3}$ and $V_{fuel} = \dfrac{121\,200}{810} \approx 150\,\mathrm{m^3}$, a total of about $394\,\mathrm{m^3}$.

Bulk density: $\rho_{bulk} = \dfrac{400\,000}{394} \approx 1015\,\mathrm{kg/m^3}$. The formula gives the same thing directly: $\dfrac{3.3}{2.3/1141 + 1/810} = \dfrac{3.3}{0.002016 + 0.001235} \approx 1015\,\mathrm{kg/m^3}$. A plain average of the two densities would have been $975.5\,\mathrm{kg/m^3}$, about $4\%$ low, because most of the mass is the denser oxygen.
:::

::: note Why exact fractions beat decimals mid-derivation
In the example, $f_{ox} = \frac{23}{33}$ exactly. Carrying $0.697$ instead introduces a rounding error of about $0.03\%$ into every downstream number. That is harmless here, but a chain of twenty such roundings is not, and the habit of keeping fractions exact until the last line is one you want before the calculus modules.
:::

## Check yourself

::: check
Evaluate $-40 - 25 + (-15)$ and $(-2)^3 \cdot \left(-\tfrac{1}{4}\right)$, stating the sign rule you used at each step.
:::

::: answer
$-40 - 25 = -65$ (moving left twice), then $-65 + (-15) = -80$. For the second, $(-2)^3 = (-2)(-2)(-2) = 4 \cdot (-2) = -8$: an odd number of negative factors leaves a negative. Then $(-8)\cdot\left(-\tfrac{1}{4}\right) = +2$, since negative times negative is positive.
:::

::: check
Compute $\frac{5}{6} - \frac{3}{8}$ exactly, and explain why the least common denominator is $24$ rather than $48$.
:::

::: answer
$6 = 2 \cdot 3$ and $8 = 2^3$; the smallest number both divide is $2^3 \cdot 3 = 24$. So $\frac{5}{6} = \frac{20}{24}$ and $\frac{3}{8} = \frac{9}{24}$, giving $\frac{20 - 9}{24} = \frac{11}{24}$. The product $48$ also works as a common denominator, but it doubles every numerator and leaves a fraction that still needs simplifying.
:::

::: check
A hydrogen–oxygen upper stage runs at $O/F = 5.5$ by mass. Of $100\,\mathrm{t}$ of propellant, how much is liquid oxygen and how much liquid hydrogen? With $\rho_{ox} = 1141\,\mathrm{kg/m^3}$ and $\rho_{H_2} = 71\,\mathrm{kg/m^3}$, estimate the bulk density.
:::

::: answer
There are $5.5 + 1 = 6.5$ shares. Oxygen is $\frac{5.5}{6.5} \times 100 \approx 84.6\,\mathrm{t}$, hydrogen $\frac{1}{6.5} \times 100 \approx 15.4\,\mathrm{t}$. Bulk density: $\rho_{bulk} = \dfrac{6.5}{5.5/1141 + 1/71} = \dfrac{6.5}{0.00482 + 0.01408} \approx 344\,\mathrm{kg/m^3}$. Hydrogen is so light that although it is only $15\%$ of the mass, it takes about three quarters of the tank volume — which is why hydrogen stages are so fat.
:::

::: check
A stage has dry mass $12\,\mathrm{t}$, propellant $95\,\mathrm{t}$ and payload $5\,\mathrm{t}$. Find $m_0$, $m_f$, $MR$ and $\zeta$. Which of $MR$ and $\zeta$ would change if the payload were removed?
:::

::: answer
$m_0 = 12 + 95 + 5 = 112\,\mathrm{t}$; $m_f = 12 + 5 = 17\,\mathrm{t}$; $MR = \frac{112}{17} \approx 6.59$; $\zeta = \frac{95}{95 + 12} = \frac{95}{107} \approx 0.888$. Removing the payload changes $MR$ (to $\frac{107}{12} \approx 8.92$) but not $\zeta$, which never involved $m_L$.
:::

::: check
A thrust of $7607\,\mathrm{kN}$ lifts a vehicle of mass $549\,\mathrm{t}$. Weight is mass times $9.80665\,\mathrm{m/s^2}$ and $1\,\mathrm{kN} = 1000\,\mathrm{N}$, $1\,\mathrm{t} = 1000\,\mathrm{kg}$. What is the thrust-to-weight ratio, and why is it dimensionless?
:::

::: answer
Weight $= 549\,000 \times 9.80665 \approx 5.384 \times 10^6\,\mathrm{N}$. Thrust-to-weight $= \frac{7.607 \times 10^6}{5.384 \times 10^6} \approx 1.41$. Both numerator and denominator are forces in newtons, so the units cancel and the ratio is a pure number: the vehicle can accelerate upward at $0.41$ times $g$ at lift-off.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Subtraction | $a - b = a + (-b)$; subtracting a negative adds |
| Sign of a product | $(-1)(-1) = 1$, forced by the distributive law; odd count of negatives gives negative |
| Power before minus | $-3^2 = -9$ but $(-3)^2 = 9$ |
| Fraction sum | $\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}$, never add denominators |
| Division by a fraction | multiply by the reciprocal |
| Ratio $a{:}b$ | fractions of the whole are $\frac{a}{a+b}$ and $\frac{b}{a+b}$ |
| Percent change | $\frac{\text{new} - \text{old}}{\text{old}} \times 100\%$ |
| Stage masses | $m_0 = m_d + m_p + m_L$, $m_f = m_d + m_L$ |
| Mass ratio | $MR = m_0 / m_f > 1$, dimensionless; $\zeta = m_p/(m_p + m_d)$ |
| Mixture ratio | $f_{ox} = \frac{O/F}{1 + O/F}$, $f_{fuel} = \frac{1}{1 + O/F}$ |
| Bulk density | $\rho_{bulk} = \dfrac{1 + O/F}{O/F/\rho_{ox} + 1/\rho_{fuel}}$ |

The next lesson takes the multiplication you have been doing and stacks it: repeated multiplication becomes exponents, its inverse becomes roots, and the inverse-square law of gravity becomes a one-line calculation.
