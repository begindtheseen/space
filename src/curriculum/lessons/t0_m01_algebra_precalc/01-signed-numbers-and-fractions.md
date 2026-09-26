---
id: l01-signed-numbers-and-fractions
title: Signed numbers, fractions and ratios
minutes: 18
covers:
  - arithmetic with signed numbers and fractions
---

This lesson is about three kinds of number you already use every day, even if nobody ever called them by these names.

- **Numbers with a direction.** It is $-5$ degrees outside. The elevator goes down three floors. You owe your friend two dollars. The minus sign says which way.
- **Numbers in pieces.** Half a pizza. Three quarters of a tank of fuel. These are **fractions**.
- **Numbers that compare.** Two scoops of powder for every one cup of water. That is a **ratio**.

A rocket is full of exactly these numbers. Its speed has a direction — up is plus, down is minus. Its fuel tank is some fraction full. Its engine mixes two liquids in a fixed ratio, the way a recipe mixes flour and sugar. So before anything that looks like rocket science, we make sure these three are rock solid. Nearly every mistake engineers make later is not a hard physics mistake; it is a minus sign dropped or a fraction added the wrong way.

Go slowly, and do the arithmetic with a pencil the first time, not a calculator. The goal is to notice exactly where you hesitate. That spot is what this lesson is for.

## Numbers with a direction

Picture a thermometer, or a long street with house number $0$ in the middle. Walk right and the numbers go up: $1, 2, 3$. Walk left and they go below zero: $-1, -2, -3$. That street is the **number line**. A **signed number** tells you two things at once: how far from zero (the **size**, or magnitude) and which side (the **sign**).

Here is the part people forget: *you* decide which way is plus. On a rocket you might say "up is positive, down is negative". Once you have decided, stick to it. The sign then carries that choice through every calculation. That is why a sign mistake is dangerous: it does not give you a slightly wrong answer, it gives you the right size pointing the wrong way — a rocket that thinks it is climbing when it is falling.

### Adding and subtracting

**Adding** is walking. Adding $+3$ means take three steps right. Adding $-3$ means take three steps left.

**Subtracting** is adding the opposite. Instead of learning a new rule, flip the sign of the second number and add:

$$
a - b = a + (-b).
$$

This one idea explains the rule everyone finds weird, subtracting a negative:

$$
-5 - (-8) = -5 + 8 = 3.
$$

Think of it with money. You are $5$ dollars in debt. Then someone *takes away* an $8$ dollar debt you owed. Taking away a debt makes you richer — you end up $3$ dollars ahead. Removing a step to the left is the same as taking a step to the right.

### Multiplying and dividing

Multiplying by a positive number stretches: $3 \times 4$ is four steps of three. Multiplying by $-1$ does something new — it **turns you around** to face the other way on the number line.

So negative times negative is positive: turn around twice and you are facing forward again. A good way to get the sign of any product is to count the minus signs. An even number of them gives a positive answer; an odd number gives a negative one.

$$
(-3)(-4) = 12, \qquad (-3)(4) = -12, \qquad (-2)(-2)(-2) = -8.
$$

Division follows exactly the same sign rules, because dividing by a number is multiplying by its flip ($a \div b = a \cdot \frac{1}{b}$), and $\frac{1}{b}$ has the same sign as $b$. So $(-12) \div (-3) = 4$.

::: note Why negative times negative has to be positive
It is not a rule someone made up. It is forced on us if we want ordinary maths to keep working. We know $a(b + c) = ab + ac$ (that is the "distributive law" — multiplying a bracket means multiplying each thing inside). Start from $(-1) \cdot 0 = 0$ and write the zero as $1 + (-1)$:

$$
0 = (-1)(1 + (-1)) = (-1)(1) + (-1)(-1) = -1 + (-1)(-1).
$$

The only number you can add to $-1$ to get $0$ is $+1$. So $(-1)(-1)$ must be $1$. Any other answer would break the distributive law.
:::

### Size without direction

Sometimes you only care how far, not which way. The **absolute value** $|x|$ is the distance from zero, and a distance is never negative: $|-7| = 7$ and $|7| = 7$.

If a rocket's speed is off by $-0.42\,\mathrm{m/s}$, the sign tells you which way it is off (too slow, say) and the absolute value, $0.42\,\mathrm{m/s}$, tells you by how much.

### Doing things in the right order

When a calculation has several steps, everyone agrees on the same order, so that everyone gets the same answer:

1. Brackets first.
2. Then powers (like $4^2$, "four squared", which is $4 \times 4$).
3. Then multiply and divide, going left to right.
4. Then add and subtract, going left to right.

$$
2 + 3 \cdot 4^2 - (-6) \div 3 = 2 + 3 \cdot 16 + 2 = 52.
$$

(The dot $\cdot$ means multiply. The power went first, then $3 \cdot 16 = 48$ and $(-6) \div 3 = -2$, and subtracting $-2$ is adding $2$.)

::: warning The minus sign in front of a power
$-3^2$ means "the negative of three squared": $-(3 \times 3) = -9$. The power happens before the minus. But $(-3)^2$ means $(-3) \times (-3) = 9$. Those are $18$ apart! This exact slip shows up when a negative speed gets squared in an energy calculation. If you are not sure, write the brackets.
:::

::: example Signed numbers on a real rocket
**Temperatures.** Liquid oxygen boils at about $-183\,^\circ\mathrm{C}$. The kerosene in the tank next to it sits at about $+20\,^\circ\mathrm{C}$. How big is the difference across the wall between them?

$$
20 - (-183) = 20 + 183 = 203\,\mathrm{K}.
$$

(A temperature *difference* of one degree Celsius is the same size as one kelvin, K, so engineers write differences in kelvin.) A spacecraft's skin goes from $-65\,^\circ\mathrm{C}$ in Earth's shadow to $+85\,^\circ\mathrm{C}$ in sunlight, a swing of $85 - (-65) = 150\,\mathrm{K}$ every orbit.

**A change in speed.** Call up positive. A test rocket is climbing at $v_i = +250\,\mathrm{m/s}$ ("$v_i$" is just a label: the initial velocity). Later it is falling at $v_f = -50\,\mathrm{m/s}$ (the final velocity). The change is final minus initial, written $\Delta v$ ("delta v"; $\Delta$ means "change in"):

$$
\Delta v = v_f - v_i = -50 - 250 = -300\,\mathrm{m/s}.
$$

The size, $300\,\mathrm{m/s}$, is bigger than either speed on its own — because it had to stop climbing *and* start falling. The minus sign says the change was downward.

**Slowing down in orbit.** A satellite is moving at $7670\,\mathrm{m/s}$ and fires its engine backwards, a change of $\Delta v = -120\,\mathrm{m/s}$. Its new speed is $7670 + (-120) = 7550\,\mathrm{m/s}$.
:::

## Fractions are sharing

A fraction is a division waiting to happen. $\frac{3}{4}$ means "$3$ divided by $4$" — cut something into $4$ equal pieces and take $3$ of them. The bottom number, the **denominator**, says how many pieces the whole was cut into. The top number, the **numerator**, says how many pieces you have.

The bottom can never be zero. Sharing a pizza among zero people makes no sense, and in maths it has no answer at all.

### Same amount, different pieces

$\frac{1}{2}$ of a pizza and $\frac{2}{4}$ of a pizza are the same amount of pizza — the second one was just cut into smaller slices. These are **equivalent fractions**. You can always multiply the top and the bottom by the same number (not zero) without changing the amount:

$$
\frac{a}{b} = \frac{ka}{kb}, \qquad k \neq 0.
$$

Going the other way is **simplifying**: if the top and bottom share a factor, divide it out of both. $\frac{6}{8} = \frac{3}{4}$.

You may only cancel things that *multiply* the whole top and the whole bottom. You may never cancel pieces that are *added*. For example, $\frac{6 + 3}{3}$ is not $6 + 1$. Split it into two fractions first: $\frac{6}{3} + \frac{3}{3} = 2 + 1 = 3$. (Check: $6 + 3 = 9$, and $9 \div 3 = 3$.)

### Adding and subtracting: make the slices the same size

You can only add pieces of the same size. A half and a third are different-sized slices, so first re-cut both pizzas into slices that match:

$$
\frac{3}{4} + \frac{5}{6} = \frac{9}{12} + \frac{10}{12} = \frac{19}{12}, \qquad
\frac{5}{8} - \frac{7}{12} = \frac{15}{24} - \frac{14}{24} = \frac{1}{24}.
$$

The shared bottom number is called the **common denominator**. The smallest one that works (the **least common denominator**) keeps the numbers small, but any common denominator gives the right answer. The general recipe is

$$
\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}.
$$

::: warning Never add the bottoms
$\frac{1}{2} + \frac{1}{3}$ is **not** $\frac{2}{5}$. Adding tops to tops and bottoms to bottoms is the most common fraction mistake in the world. Half a tank of fuel plus a third of a tank is five sixths of a tank ($\frac{3}{6} + \frac{2}{6} = \frac{5}{6}$) — more than half, as it should be. Two fifths is *less* than half, which cannot be right after adding more fuel.
:::

### Multiplying: a fraction of a fraction

"Half of three quarters" is $\frac{1}{2} \cdot \frac{3}{4} = \frac{3}{8}$. Multiplying fractions is the easy one: multiply straight across, top times top and bottom times bottom:

$$
\frac{a}{b}\cdot\frac{c}{d} = \frac{ac}{bd}.
$$

### Dividing: how many fit?

$\frac{2}{3} \div \frac{4}{9}$ asks: how many pieces of size $\frac{4}{9}$ fit into $\frac{2}{3}$? The quick way is to flip the second fraction upside down (that flipped fraction is called the **reciprocal**) and multiply:

$$
\frac{2}{3} \div \frac{4}{9} = \frac{2}{3}\cdot\frac{9}{4} = \frac{18}{12} = \frac{3}{2}.
$$

It works because a fraction times its own flip is always $1$: $\frac{4}{9} \cdot \frac{9}{4} = 1$. One and a half pieces of size $\frac{4}{9}$ fit into $\frac{2}{3}$.

A fraction with more fractions inside it is called a **complex fraction**. Tidy it up from the inside out:

$$
\frac{\tfrac{1}{2} + \tfrac{1}{3}}{\tfrac{1}{4}} = \frac{\tfrac{5}{6}}{\tfrac{1}{4}} = \frac{5}{6}\cdot 4 = \frac{10}{3}.
$$

### Fractions and decimals

Every fraction is also a decimal — do the division. $\frac{1}{4} = 0.25$ and $\frac{2}{7} = 0.285714\ldots$, with the digits repeating forever. Engineers write final answers as decimals, but while working things out, exact fractions are safer: $\frac{1}{3}$ is exactly one third, while $0.333$ is already slightly wrong.

## Ratios: comparing two amounts

A **ratio** compares two amounts. "Two scoops of lemonade powder for every three cups of water" is the ratio $2{:}3$. Ratios do not care about size: a small jug at $2{:}3$ and a giant barrel at $200{:}300$ taste the same.

The most useful trick with a ratio is turning it into **fractions of the whole**. Add up the parts of the ratio to get the number of equal **shares**. If $640\,\mathrm{kg}$ of something is split $3{:}5$, there are $3 + 5 = 8$ shares, so

$$
\frac{3}{8} \cdot 640 = 240\,\mathrm{kg} \quad\text{and}\quad \frac{5}{8} \cdot 640 = 400\,\mathrm{kg}.
$$

Check: $240 + 400 = 640$. The parts always add back up to the whole.

### Proportions: scaling up

A **proportion** says two ratios are equal, $\frac{a}{b} = \frac{c}{d}$. Multiplying both sides by $b$ and by $d$ gives the handy shortcut $ad = bc$, called **cross-multiplying**. Proportions are how you scale a recipe up or down — and how you scale a rocket. If a stage burns $411\,\mathrm{t}$ of propellant ($1\,\mathrm{t}$, a tonne, is $1000\,\mathrm{kg}$) in $162\,\mathrm{s}$, it burns

$$
\frac{411\,000\,\mathrm{kg}}{162\,\mathrm{s}} \approx 2540\,\mathrm{kg}
$$

every second. That per-second amount is a **unit rate**, and at the same rate any other burn time scales in proportion.

### Percentages: out of a hundred

"Percent" means "out of a hundred". $7.5\%$ is the fraction $\frac{7.5}{100} = 0.075$.

A **percent change** always compares the change to where you *started*:

$$
\text{percent change} = \frac{\text{new} - \text{old}}{\text{old}} \times 100\%.
$$

Adding fuel so the load goes from $400\,\mathrm{t}$ to $411\,\mathrm{t}$ is a change of $\frac{11}{400} \times 100\% = 2.75\%$.

Every time you see a percentage, ask "percent **of what**?" A $5\%$ margin on the engine's push and a $5\%$ margin on the rocket's weight are $5\%$ of two completely different things, so you cannot simply add them together.

## The mass ratio of a rocket stage

Here is the first rocket idea in the course, and it is just a fraction.

Imagine setting off on a hike with a backpack full of water bottles. At the start it is heavy. As you drink, it gets lighter. By the end only the empty bag and whatever else you packed are left. A rocket is the same: most of what it carries is propellant (fuel plus the oxygen it burns with), and it throws all of that out of the back as it flies.

A single rocket **stage** has three kinds of mass:

- the **dry mass** $m_d$ — the rocket itself: tanks, engines, frame, computers. Still there after the engines stop.
- the **propellant mass** $m_p$ — the fuel and oxidizer that get burned and thrown out.
- the **payload mass** $m_L$ — whatever it is carrying, like a satellite.

(The little letters are labels, not powers: $m_d$ is read "m sub d", meaning "the mass we call d, for dry".)

At lift-off it has everything on board. That is the **initial** (or "wet") mass, $m_0 = m_d + m_p + m_L$. When the engines stop, the propellant is gone, leaving the **final** (burnout) mass $m_f = m_d + m_L$. The **mass ratio** compares the two:

$$
MR = \frac{m_0}{m_f} = \frac{m_d + m_p + m_L}{m_d + m_L}.
$$

Tonnes divided by tonnes: the units cancel, so the mass ratio is a plain number with no units — engineers call that **dimensionless**. It is always bigger than $1$, because the top is the bottom *plus* some propellant.

Two related fractions come straight out of it. Its flip, $\frac{1}{MR} = \frac{m_f}{m_0}$, is the fraction of the lift-off mass still there at burnout. And $1 - \frac{1}{MR} = \frac{m_p}{m_0}$ is the fraction that was propellant.

A different fraction, the **propellant mass fraction**, measures how well the rocket itself is built — how much of the stage (leaving out the payload) is propellant rather than metal:

$$
\zeta = \frac{m_p}{m_p + m_d}.
$$

($\zeta$ is the Greek letter "zeta".) A lighter, better-built stage has a $\zeta$ closer to $1$. Keep $MR$ and $\zeta$ separate: they answer different questions.

::: key Mass ratio
$MR = m_0 / m_f$ — initial (wet) mass over burnout mass, where $m_0 = m_d + m_p + m_L$ and $m_f = m_d + m_L$ (dry mass plus payload). It is dimensionless and always greater than $1$.
:::

::: example Mass ratio of a stage with payload
A stage has dry mass $m_d = 22\,\mathrm{t}$, carries $m_p = 410\,\mathrm{t}$ of propellant and lifts a payload of $m_L = 15\,\mathrm{t}$.

$$
m_0 = 22 + 410 + 15 = 447\,\mathrm{t}, \qquad m_f = 22 + 15 = 37\,\mathrm{t}, \qquad MR = \frac{447}{37} \approx 12.1.
$$

So the stage weighs about twelve times more at lift-off than at burnout. The fraction left at burnout is $\frac{1}{MR} = \frac{37}{447} \approx 0.0828$, so the propellant fraction is $1 - 0.0828 = 0.917$: about $91.7\%$ of what left the launch pad was propellant.

How well built is it? $\zeta = \frac{410}{410 + 22} = \frac{410}{432} \approx 0.949$. Notice that $\zeta$ never looked at the payload, but $MR$ depends on it a lot: with no payload at all, $MR$ would be $\frac{432}{22} \approx 19.6$.
:::

::: warning The dry mass goes on top too
The classic slip is dividing propellant by dry mass, $m_p / m_d$. In the example that gives $\frac{410}{22} \approx 18.6$ — wrong, because the rocket's own dry mass is also on board at lift-off (so it belongs in $m_0$), and the payload belongs in both $m_0$ and $m_f$. Write out $m_0$ and $m_f$ in full before you divide, every single time.
:::

## Mixture ratio and bulk density

A rocket engine that burns two liquids — a fuel and an **oxidizer**, the oxygen the fuel burns with — mixes them in a fixed ratio, like a recipe. That ratio is the **mixture ratio**, written $O/F$ ("oxidizer over fuel") and measured by mass.

A kerosene-and-oxygen engine running at $O/F = 2.3$ uses $2.3\,\mathrm{kg}$ of liquid oxygen for every $1\,\mathrm{kg}$ of kerosene (rocket kerosene is called RP-1). That is the ratio $2.3{:}1$, so there are $2.3 + 1 = 3.3$ shares, and

$$
f_{ox} = \frac{O/F}{1 + O/F} = \frac{2.3}{3.3} \approx 0.697, \qquad f_{fuel} = \frac{1}{1 + O/F} = \frac{1}{3.3} \approx 0.303.
$$

These fractions add up to $1$, as fractions of a whole always do.

### How much room does it take?

To build the tanks you need volume, not mass. **Density** tells you how heavy a fixed amount of stuff is: a litre of liquid oxygen weighs more than a litre of kerosene. Mass is density times volume, $m = \rho V$ ($\rho$ is the Greek letter "rho", used for density), so the volume is $V = m / \rho$.

The **bulk density** of the propellant is the total mass divided by the total volume. Here is the surprise: it is *not* the average of the two densities. Think of a bag holding a kilogram of marbles and a kilogram of ping-pong balls. The ping-pong balls take up far more room, so the mix is much lighter for its size than "halfway between marbles and ping-pong balls" would suggest.

Here is the calculation, one step at a time:

$$
\rho_{bulk} = \frac{m_{ox} + m_{fuel}}{V_{ox} + V_{fuel}}
= \frac{m_{ox} + m_{fuel}}{\dfrac{m_{ox}}{\rho_{ox}} + \dfrac{m_{fuel}}{\rho_{fuel}}}
= \frac{1 + O/F}{\dfrac{O/F}{\rho_{ox}} + \dfrac{1}{\rho_{fuel}}}.
$$

The first step writes each volume as mass over density. The last step divides the top and the bottom by $m_{fuel}$ and uses $m_{ox} / m_{fuel} = O/F$. It is a complex fraction, exactly like the ones you tidied up earlier — and it is the number that decides how big the tanks must be.

::: example Splitting a propellant load and sizing the tanks
A stage carries $400\,\mathrm{t}$ of propellant at $O/F = 2.3$. Liquid oxygen has density $\rho_{ox} = 1141\,\mathrm{kg/m^3}$ and kerosene $\rho_{fuel} = 810\,\mathrm{kg/m^3}$ (a cubic metre, $\mathrm{m^3}$, is a box one metre on each side).

**Masses:** $m_{ox} = 0.697 \times 400\,\mathrm{t} \approx 278.8\,\mathrm{t}$ and $m_{fuel} = 0.303 \times 400\,\mathrm{t} \approx 121.2\,\mathrm{t}$. Check: $278.8 + 121.2 = 400$.

**Volumes:** $V_{ox} = \dfrac{278\,800}{1141} \approx 244\,\mathrm{m^3}$ and $V_{fuel} = \dfrac{121\,200}{810} \approx 150\,\mathrm{m^3}$, about $394\,\mathrm{m^3}$ in all.

**Bulk density:** $\rho_{bulk} = \dfrac{400\,000}{394} \approx 1015\,\mathrm{kg/m^3}$. The formula gives the same thing directly: $\dfrac{3.3}{2.3/1141 + 1/810} = \dfrac{3.3}{0.002016 + 0.001235} \approx 1015\,\mathrm{kg/m^3}$.

A plain average of the two densities would have given $975.5\,\mathrm{kg/m^3}$ — about $4\%$ too low, because most of the mass is the heavier oxygen.
:::

::: note Why exact fractions beat decimals while you work
In that example, $f_{ox}$ is exactly $\frac{23}{33}$. Using $0.697$ instead adds a tiny rounding error (about $0.03\%$) to every number after it. One tiny error is harmless. Twenty of them in a row are not. Keeping fractions exact until the last line is a habit worth building now.
:::

## Check yourself

::: check
Work out $-40 - 25 + (-15)$ and $(-2)^3 \cdot \left(-\tfrac{1}{4}\right)$. Say which sign rule you used at each step.
:::

::: answer
$-40 - 25 = -65$ (two walks to the left), then $-65 + (-15) = -80$.

For the second: $(-2)^3 = (-2)(-2)(-2) = 4 \cdot (-2) = -8$ — three minus signs is an odd number, so the answer is negative. Then $(-8) \cdot \left(-\tfrac{1}{4}\right) = +2$, because negative times negative is positive.
:::

::: check
Work out $\frac{5}{6} - \frac{3}{8}$ exactly. Why is the smallest common denominator $24$ and not $48$?
:::

::: answer
$6 = 2 \cdot 3$ and $8 = 2 \cdot 2 \cdot 2$. The smallest number both divide into is $2 \cdot 2 \cdot 2 \cdot 3 = 24$. So $\frac{5}{6} = \frac{20}{24}$ and $\frac{3}{8} = \frac{9}{24}$, giving $\frac{20 - 9}{24} = \frac{11}{24}$.

$48$ (which is $6 \times 8$) also works, but every number doubles and you have to simplify at the end.
:::

::: check
A hydrogen-and-oxygen engine runs at $O/F = 5.5$ by mass. Of $100\,\mathrm{t}$ of propellant, how much is liquid oxygen and how much is liquid hydrogen? With $\rho_{ox} = 1141\,\mathrm{kg/m^3}$ and $\rho_{H_2} = 71\,\mathrm{kg/m^3}$, estimate the bulk density.
:::

::: answer
There are $5.5 + 1 = 6.5$ shares. Oxygen is $\frac{5.5}{6.5} \times 100 \approx 84.6\,\mathrm{t}$ and hydrogen is $\frac{1}{6.5} \times 100 \approx 15.4\,\mathrm{t}$.

Bulk density: $\rho_{bulk} = \dfrac{6.5}{5.5/1141 + 1/71} = \dfrac{6.5}{0.00482 + 0.01408} \approx 344\,\mathrm{kg/m^3}$.

Hydrogen is so light that although it is only about $15\%$ of the mass, it fills about three quarters of the tank space. That is why hydrogen rocket stages look so fat.
:::

::: check
A stage has dry mass $12\,\mathrm{t}$, propellant $95\,\mathrm{t}$ and payload $5\,\mathrm{t}$. Find $m_0$, $m_f$, $MR$ and $\zeta$. If the payload were taken off, which of $MR$ and $\zeta$ would change?
:::

::: answer
$m_0 = 12 + 95 + 5 = 112\,\mathrm{t}$ and $m_f = 12 + 5 = 17\,\mathrm{t}$, so $MR = \frac{112}{17} \approx 6.59$. And $\zeta = \frac{95}{95 + 12} = \frac{95}{107} \approx 0.888$.

Taking the payload off changes $MR$ (it becomes $\frac{107}{12} \approx 8.92$) but not $\zeta$, which never included the payload.
:::

::: check
An engine pushes with a force (thrust) of $7607\,\mathrm{kN}$ on a rocket of mass $549\,\mathrm{t}$. The rocket's weight is its mass times $9.80665\,\mathrm{m/s^2}$. Using $1\,\mathrm{kN} = 1000\,\mathrm{N}$ and $1\,\mathrm{t} = 1000\,\mathrm{kg}$, find the thrust-to-weight ratio. Why does it have no units?
:::

::: answer
Weight $= 549\,000 \times 9.80665 \approx 5.384 \times 10^6\,\mathrm{N}$. Thrust-to-weight $= \frac{7.607 \times 10^6}{5.384 \times 10^6} \approx 1.41$.

Both the top and the bottom are forces measured in newtons, so the units cancel and the ratio is a plain number. It means the engine pushes up $1.41$ times harder than gravity pulls down, so the rocket can climb.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Subtracting | $a - b = a + (-b)$; taking away a negative adds |
| Sign of a product | count the minus signs: even gives $+$, odd gives $-$; $(-1)(-1) = 1$ |
| Power before minus | $-3^2 = -9$ but $(-3)^2 = 9$ |
| Adding fractions | same-size pieces first: $\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}$; never add the bottoms |
| Dividing by a fraction | flip it (the reciprocal) and multiply |
| Ratio $a{:}b$ | fractions of the whole are $\frac{a}{a+b}$ and $\frac{b}{a+b}$ |
| Percent change | $\frac{\text{new} - \text{old}}{\text{old}} \times 100\%$ — always ask "of what?" |
| Stage masses | $m_0 = m_d + m_p + m_L$, $m_f = m_d + m_L$ |
| Mass ratio | $MR = m_0 / m_f > 1$, no units; $\zeta = m_p/(m_p + m_d)$ |
| Mixture ratio | $f_{ox} = \frac{O/F}{1 + O/F}$, $f_{fuel} = \frac{1}{1 + O/F}$ |
| Bulk density | $\rho_{bulk} = \dfrac{1 + O/F}{O/F/\rho_{ox} + 1/\rho_{fuel}}$ — not the average |

Next lesson: multiplying the same number again and again gets its own short way of writing — **exponents** — and undoing it gives **roots**. With those, the way gravity weakens as you move away from Earth becomes a one-line calculation.
