---
id: l05-variables-and-formulas
title: Variables, expressions and formulas
minutes: 17
covers:
  - variables, expressions and formulas
---

A recipe for pancakes might say: "for each person, use one egg and half a cup of flour." That one sentence works for two people or for twenty. You do not need a new recipe every time the number of guests changes. You keep the recipe, and you drop in the number.

A **formula** is exactly that kind of recipe, written in the short language of mathematics. The distance a car covers is its speed times the time it drives. The weight of anything is its mass times the pull of gravity. The push an engine needs is the mass it moves times how quickly it has to speed up. Each of these is one line, and each line works for every car, every rocket and every planet.

Almost every page of this course after Basecamp is formulas. An engineer's day is mostly putting the right numbers into the right formula, in the right order, with the right units — and noticing when the answer looks wrong. This lesson teaches the language: what the letters mean, how to put numbers in, how to write a formula from a sentence, and how to tidy one up.

## Letters that stand for numbers

In a formula, a letter is a label for a number. It is a box with a name on it, waiting for a value. Such a letter is called a **variable** — a quantity that can change from one problem to the next.

Here is the formula for distance:

$$
d = v \cdot t
$$

Read it aloud as "d equals v times t". The letters are chosen to help you remember them: $d$ for distance, $v$ for velocity (speed), $t$ for time. The dot $\cdot$ means multiply. Mathematicians are lazy about writing multiplication, so you will often see the dot left out altogether: $vt$ means $v \times t$, and $3x$ means $3 \times x$. When two letters, or a number and a letter, sit side by side with nothing between them, they are multiplied.

Not every letter changes. Some stand for a number that is always the same, like $g$, the [[pull of Earth's gravity|g-value]] at the surface, which is about $9.81\,\mathrm{m/s^2}$ (read "metres per second squared"). A letter like that is called a **constant**. It is still a letter, but its value is fixed.

Why write letters at all, instead of numbers? Because a formula with letters is a [[machine that works for any input|formula-machine]]. Write "$60 = 12 \times 5$" and you have described one trip. Write "$d = vt$" and you have described every trip there ever was.

Sometimes one letter is not enough. A rocket has a mass at lift-off and a different mass when its engines stop. Engineers keep the same letter and add a small label below it: $m_0$ is the starting mass, read "m nought" or "m zero", and $v_0$ is the starting speed. These small labels are called [[subscripts|subscript]]. They are names, not numbers you multiply by.

::: warning A subscript is not a multiplication
$v_0$ is one quantity — "the starting speed". It is not $v \times 0$, which would be zero. In the same way, $m_d$ is "the dry mass", not $m$ times $d$. When you see a small letter or number written low and to the right, read it as part of the name.
:::

## Expressions, equations and formulas

Three words get mixed up, so let us pin them down.

An **expression** is a piece of mathematics with no equals sign — a phrase, not a full sentence. $3x + 2$ is an expression. So is $v \cdot t$. An expression has a value once you know the letters, but it does not *say* anything.

An **equation** is a full sentence: two expressions joined by an equals sign, claiming they are the same amount. $3x + 2 = 14$ is an equation. It might be true or false depending on $x$. (It is true when $x = 4$, and the next lesson shows you how to find that.)

A **formula** is an equation that links real quantities, so that knowing some of them tells you another. $d = vt$ is a formula. So is the area of a rectangle,

$$
A = l \cdot w,
$$

where $A$ is the area, $l$ the length and $w$ the width.

| Word | What it is | Example |
| --- | --- | --- |
| expression | a phrase, no equals sign | $4t + 1$ |
| equation | two expressions said to be equal | $4t + 1 = 21$ |
| formula | an equation linking real quantities | $F = m \cdot a$ |

## Substituting: putting numbers in

To use a formula, you **substitute** — you swap each letter for its value, then work out the arithmetic. Here is the whole idea in one line. A cart rolls at $v = 12\,\mathrm{m/s}$ for $t = 5\,\mathrm{s}$. How far does it go?

$$
d = v \cdot t = 12\,\mathrm{m/s} \times 5\,\mathrm{s} = 60\,\mathrm{m}.
$$

::: key Substituting into a formula
Replace each letter with its value, then work it out in the right order. For $d = v \cdot t$ with $v = 12\,\mathrm{m/s}$ and $t = 5\,\mathrm{s}$: $d = 12 \times 5 = 60\,\mathrm{m}$.
:::

### The units come along for the ride

Notice what happened to the units. Metres per second, times seconds, left metres. The "per second" and the "seconds" cancelled, the same way $\frac{3}{5} \times 5$ leaves $3$. Units behave like letters: you can multiply them, divide them and cancel them.

This is not a side detail. It is one of the best mistake-catchers you will ever have. If you work out a distance and the units come out as seconds, something went wrong, even if you cannot yet see where. A famous spacecraft was [[lost because two teams used different units|mars-climate-orbiter]], so engineers take this seriously.

The same thing gives area its units. A solar panel $2.5\,\mathrm{m}$ long and $1.2\,\mathrm{m}$ wide has area

$$
A = l \cdot w = 2.5\,\mathrm{m} \times 1.2\,\mathrm{m} = 3\,\mathrm{m^2}.
$$

Metres times metres is **[[square metres|square-metres]]**, written $\mathrm{m^2}$: the number of one-metre squares that would tile the panel.

### Do things in the right order

Many formulas have more than one step, so you need the agreed order of operations. It is the [[same order everyone uses|order-agreement]]:

1. Brackets first.
2. Then powers (like $3^2$, "three squared", which is $3 \times 3 = 9$).
3. Then multiply and divide, left to right.
4. Then add and subtract, left to right.

So $5 + 2 \times 3 = 11$, not $21$: the multiplication happens before the addition. If you want the addition first, you must write brackets: $(5 + 2) \times 3 = 21$.

When you substitute a number, put it in brackets if there is any doubt. This matters most with negative numbers and powers. If $x = -3$, then $x^2$ means $(-3)^2 = 9$. Writing $-3^2$ without the brackets would mean $-(3^2) = -9$, which is a different number.

::: warning Substitute, then multiply
If $x = 3$, then $2x$ is $2 \times 3 = 6$. It is not "23". Writing the letter next to the number meant *multiply*, so once the letter becomes a number you have to put the $\times$ back in: $2x = 2 \times 3$.
:::

::: example Three rocket formulas
**Weight.** The **weight** of an object is how hard gravity pulls on it. It is found from the formula $W = m \cdot g$, where $m$ is the mass in kilograms and $g = 9.81\,\mathrm{m/s^2}$. For a $70\,\mathrm{kg}$ astronaut standing on the launch pad:

$$
W = m \cdot g = 70 \times 9.81 = 686.7\,\mathrm{N}.
$$

The unit is the **[[newton|newton]]** (N), the unit of force. Kilograms times metres per second squared *is* a newton — that is how the newton is defined.

**Force to speed up.** Newton's second law says the force needed to speed up a mass $m$ at a rate $a$ is $F = m \cdot a$. Here $a$ is the **acceleration**, how many metres per second the speed grows every second, measured in $\mathrm{m/s^2}$. A small upper stage has mass $m = 25\,000\,\mathrm{kg}$ and needs to speed up at $a = 33.8\,\mathrm{m/s^2}$:

$$
F = m \cdot a = 25\,000 \times 33.8 = 845\,000\,\mathrm{N}.
$$

That is $845$ kilonewtons ($1\,\mathrm{kN} = 1000\,\mathrm{N}$). Does it make sense? An acceleration of $33.8\,\mathrm{m/s^2}$ is a little under three and a half times $g$, so the engine must push a little under three and a half times the stage's own weight. The weight is $25\,000 \times 9.81 = 245\,250\,\mathrm{N}$, and three and a half of those is about $858\,000\,\mathrm{N}$. Our answer is a little under that, as it should be.

**Speed after a burn.** A rocket moving at $v_0 = 100\,\mathrm{m/s}$ speeds up at $a = 3.79\,\mathrm{m/s^2}$ for $t = 10\,\mathrm{s}$. Its new speed is given by $v = v_0 + a \cdot t$. Substitute, and do the multiplication first:

$$
v = 100 + 3.79 \times 10 = 100 + 37.9 = 137.9\,\mathrm{m/s}.
$$

If you had added first, you would get $(100 + 3.79) \times 10 = 1037.9\,\mathrm{m/s}$ — a rocket that gained over $900\,\mathrm{m/s}$ in ten seconds of gentle push. The order of operations is what stops that nonsense. Check the units too: $\mathrm{m/s^2} \times \mathrm{s}$ is $\mathrm{m/s}$, so we are adding a speed to a speed.
:::

## Writing a formula from words

Often nobody hands you the formula. You get a sentence, and you have to turn it into mathematics. The method is:

1. Pick a letter for each quantity, and say in words what it stands for and in what units.
2. Find the words that mean an operation: "plus", "total" and "more than" mean add; "less", "left" and "fewer" mean subtract; "times", "of" and "each" usually mean multiply; "per" and "shared between" mean divide.
3. Write it down, then test it on a case where you already know the answer.

Here is a rocket sentence. "At lift-off, a stage's total mass is its dry mass plus its propellant mass." Let $m_0$ be the total mass, $m_d$ the dry mass (the rocket itself: tanks, engines, frame) and $m_p$ the propellant mass (the fuel and oxygen it burns). All are in kilograms. The word "plus" gives

$$
m_0 = m_d + m_p.
$$

::: example A formula for fuel left in the tank
A first stage starts with $411\,000\,\mathrm{kg}$ of propellant and burns $2540\,\mathrm{kg}$ of it every second. Write a formula for the propellant $m$ left after $t$ seconds, and use it to find how much is left after $100\,\mathrm{s}$.

**Letters.** $m$ is the propellant left, in kilograms. $t$ is the time since the engines started, in seconds.

**Words to maths.** Each second takes away $2540\,\mathrm{kg}$. After $t$ seconds it has taken away $2540$ times $t$. "Starts with ... and takes away" means subtract:

$$
m = 411\,000 - 2540\,t.
$$

**Test it on an easy case.** At $t = 0$ the formula gives $411\,000 - 0 = 411\,000\,\mathrm{kg}$ — the full tank, as it should.

**Now substitute $t = 100$.** Multiply first, then subtract:

$$
m = 411\,000 - 2540 \times 100 = 411\,000 - 254\,000 = 157\,000\,\mathrm{kg}.
$$

**Does it make sense?** After $100$ seconds the stage has used $254\,000\,\mathrm{kg}$, a bit more than half its load. It still has some left. At this rate the full load lasts $411\,000 \div 2540 \approx 162$ seconds, a little under three minutes, so $100$ seconds in is past halfway through the burn.
:::

## Tidying up: like terms and brackets

Formulas can get long. Two tools make them shorter without changing what they mean.

### Collecting like terms

A **term** is one piece of an expression, separated from the others by $+$ or $-$ signs. In $4m + 2 + 3m$, the terms are $4m$, $2$ and $3m$. **Like terms** are terms with exactly the same letter part.

Think of apples. Three apples plus five apples is eight apples. In the same way,

$$
3x + 5x = 8x.
$$

You add the numbers in front (called **coefficients**) and keep the letter. But three apples plus five oranges is just "three apples and five oranges": you cannot squash them into one number. So $3x + 5y$ stays as it is, and $2m + 3$ stays as it is.

Here is a longer one. Gather the $m$ terms together and the plain numbers together:

$$
4m + 2 + 3m + 7 = (4m + 3m) + (2 + 7) = 7m + 9.
$$

Test it: with $m = 1$, the left side is $4 + 2 + 3 + 7 = 16$ and the right side is $7 + 9 = 16$. They match.

::: warning x and x squared are not like terms
$x$ and $x^2$ have different letter parts, so $x + x^2$ cannot be combined. Test it with $x = 3$: $x + x^2 = 3 + 9 = 12$, while "$2x^2$" would be $2 \times 9 = 18$ and "$2x$" would be $6$. Neither is $12$.
:::

### Multiplying out brackets

Try working out $7 \times 23$ in your head. Most people split it: seven twenties is $140$, seven threes is $21$, and $140 + 21 = 161$. You just used the **[[distributive law|distributive-area]]**: multiplying a bracket means multiplying *each thing inside it*.

$$
7 \times 23 = 7 \times (20 + 3) = 7 \times 20 + 7 \times 3 = 140 + 21 = 161.
$$

With letters it looks like this:

$$
a(b + c) = ab + ac, \qquad 3(x + 4) = 3x + 12.
$$

Test the second one with $x = 2$: the left side is $3 \times 6 = 18$, and the right side is $6 + 12 = 18$.

Here is where it earns its keep. Suppose a stage carries nine identical engines, each of mass $E$ kilograms, and each engine sits on a mount of $30\,\mathrm{kg}$. The total mass of engines and mounts is

$$
9(E + 30) = 9E + 270.
$$

The bracket says "nine lots of one engine plus one mount". The multiplied-out form says "nine engines, plus $270\,\mathrm{kg}$ of mounts". Same mass, two useful ways to see it.

::: warning Multiply every term inside
$3(x + 4)$ is $3x + 12$, not $3x + 4$. The $3$ multiplies *everything* in the bracket. Test with $x = 2$: $3(x + 4) = 18$, but $3x + 4$ would give $10$. A quick test with a small number catches this every time.
:::

::: note Where this comes back
- In [Linear and quadratic equations](#/module/t0_m01_algebra_precalc?lesson=l04-linear-and-quadratic-equations) you take formulas like $F = ma$ and $v = v_0 + at$ and pull out whichever letter you need.
- In [Polynomials, expanding and factoring](#/module/t0_m01_algebra_precalc?lesson=l03-polynomials-and-factoring) the distributive law grows into multiplying whole brackets together, and collecting like terms is how you tidy the result.
- In [Units, conversions and dimensional analysis](#/module/t0_m01_algebra_precalc?lesson=l10-units-and-dimensional-analysis) the habit of carrying units through a formula becomes a full method for checking any equation.
- In [Newton's laws and inertial frames](#/module/t1_m13_classical_mechanics?lesson=l01-newton-laws-inertial-frames) $F = ma$ and $W = mg$ are the first two formulas on the page.
:::

## Check yourself

::: check
Say whether each is an expression, an equation or a formula: (a) $4t + 1$; (b) $A = l \cdot w$; (c) $2(x - 3) = 10$.
:::

::: answer
(a) An expression: there is no equals sign, so it does not claim anything. (b) A formula: an equation that links real quantities (area, length, width). (c) An equation: two expressions said to be equal. It is true for one particular $x$, but it is not a general link between real quantities, so we do not call it a formula.
:::

::: check
Work out $5 + 2 \times 3^2$. Then find the value of $5 + 2x^2$ when $x = -3$.
:::

::: answer
Powers first: $3^2 = 9$. Then multiply: $2 \times 9 = 18$. Then add: $5 + 18 = 23$.

For the second, substitute with brackets: $5 + 2 \times (-3)^2$. The power first: $(-3)^2 = (-3) \times (-3) = 9$. Then $2 \times 9 = 18$, and $5 + 18 = 23$. The same answer, because squaring removes the minus sign.
:::

::: check
On Mars, gravity pulls with $g = 3.71\,\mathrm{m/s^2}$. What does an $80\,\mathrm{kg}$ rover weigh there? Would it weigh more or less on Earth?
:::

::: answer
$W = m \cdot g = 80 \times 3.71 = 296.8\,\mathrm{N}$. On Earth it would be $80 \times 9.81 = 784.8\,\mathrm{N}$, more than twice as much. Its *mass* is $80\,\mathrm{kg}$ on both planets; only the pull of gravity changes.
:::

::: check
A water tank on a test stand starts with $1200$ litres and drains at $15$ litres per minute. Write a formula for the water $W$ left after $t$ minutes, and use it to find how much is left after $40$ minutes.
:::

::: answer
Each minute takes away $15$ litres, so $t$ minutes take away $15t$. The formula is $W = 1200 - 15t$. Test: at $t = 0$ it gives $1200$ litres, the full tank.

After $40$ minutes: $W = 1200 - 15 \times 40 = 1200 - 600 = 600$ litres. Half the tank is gone after $40$ of the $80$ minutes it takes to empty, which makes sense.
:::

::: check
Simplify $4(2y + 5) + 3y$, and test your answer with $y = 1$.
:::

::: answer
Multiply out the bracket first: $4 \times 2y = 8y$ and $4 \times 5 = 20$, giving $8y + 20 + 3y$. Collect the like terms $8y$ and $3y$: $11y + 20$.

Test with $y = 1$. The original: $4(2 + 5) + 3 = 4 \times 7 + 3 = 31$. The simplified form: $11 + 20 = 31$. They match.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Variable | a letter standing for a number that can change, like $t$ for time |
| Constant | a letter for a fixed number, like $g \approx 9.81\,\mathrm{m/s^2}$ |
| Writing multiplication | $vt$ and $v \cdot t$ both mean $v \times t$ |
| Subscript | part of the name: $v_0$ is "the starting speed", not $v \times 0$ |
| Expression, equation, formula | a phrase; two sides said equal; an equation linking real quantities |
| Substituting | swap letters for values, keep the units, then work it out in order |
| Order of operations | brackets, powers, multiply and divide, add and subtract |
| Formulas used here | $d = v \cdot t$, $A = l \cdot w$, $W = m \cdot g$, $F = m \cdot a$, $v = v_0 + a \cdot t$ |
| Like terms | same letter part; add the coefficients: $3x + 5x = 8x$ |
| Distributive law | $a(b + c) = ab + ac$ — multiply every term in the bracket |

Next lesson turns formulas around. Substituting finds $d$ when you know $v$ and $t$; solving an equation finds $t$ when you know $d$ and $v$ — how long the burn must last, rather than how far it goes.

::: context g-value What g really is
$g$ is how fast anything speeds up when it falls near Earth's surface, if the air does not slow it down. Every second of falling adds about $9.81$ metres per second to its speed.

The real value changes a little from place to place — it is slightly stronger at the poles than at the equator, and weaker on a mountain top. So engineers agreed on one exact number to use in calculations, called **standard gravity**: $g_0 = 9.80665\,\mathrm{m/s^2}$. In Basecamp, $9.81$ is close enough.
:::

::: context formula-machine A formula is a machine
Think of a formula as a machine with slots. You drop a number into each slot, the machine does its fixed job, and one answer comes out. The machine never changes; only what you feed it does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="35" width="100" height="60" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="62" font-size="14" text-anchor="middle" fill="#1f2a44" font-weight="700">d = v · t</text>
  <text x="180" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">multiply</text>
  <line x1="40" y1="50" x2="126" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="130,50 120,45 120,55" fill="#1f2a44"/>
  <line x1="40" y1="80" x2="126" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="130,80 120,75 120,85" fill="#1f2a44"/>
  <text x="20" y="46" font-size="12" fill="#1d6fd1">v = 12 m/s</text>
  <text x="20" y="100" font-size="12" fill="#1d6fd1">t = 5 s</text>
  <line x1="230" y1="65" x2="296" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="300,65 290,60 290,70" fill="#1f2a44"/>
  <text x="330" y="70" font-size="13" text-anchor="middle" fill="#b4232c" font-weight="700">60 m</text>
</svg>
```

Feed it $v = 20\,\mathrm{m/s}$ and $t = 3\,\mathrm{s}$ instead and out comes $60\,\mathrm{m}$ again — a different trip, the same machine.
:::

::: context subscript Reading the little labels
A subscript is a name tag. $m_0$ is read "m nought" (nought is an old word for zero) or "m zero", and it means "the mass at time zero" — the starting mass. $m_f$, "m sub f", is the final mass. $v_e$ could be the exhaust speed.

Engineers use subscripts because the alphabet runs out fast. A rocket has many masses and many speeds, and giving each its own letter would be impossible to remember. Keeping $m$ for every mass and $v$ for every speed, with a tag to say which one, keeps the formulas readable.
:::

::: context mars-climate-orbiter The spacecraft lost to units
In 1999 NASA's Mars Climate Orbiter reached Mars and was lost. One team's software reported the push from its small thrusters in pound-force seconds, an American unit. The software that used those numbers expected newton-seconds, the metric unit. One pound-force is about $4.45$ newtons, so every number was off by that factor.

Nobody's arithmetic was wrong. The units were never written down and checked, so the spacecraft's path drifted, and it passed far too close to Mars. Writing units next to every number is the cheapest protection there is.
:::

::: context square-metres Why metres times metres is square metres
Picture a floor $4\,\mathrm{m}$ long and $3\,\mathrm{m}$ wide. Mark it off in squares one metre on each side. There are $4$ squares along and $3$ rows, so $4 \times 3 = 12$ squares in all. Each one is a "square metre", so the area is $12\,\mathrm{m^2}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="100" y="20" width="40" height="40"/><rect x="140" y="20" width="40" height="40"/><rect x="180" y="20" width="40" height="40"/><rect x="220" y="20" width="40" height="40"/>
    <rect x="100" y="60" width="40" height="40"/><rect x="140" y="60" width="40" height="40"/><rect x="180" y="60" width="40" height="40"/><rect x="220" y="60" width="40" height="40"/>
    <rect x="100" y="100" width="40" height="40"/><rect x="140" y="100" width="40" height="40"/><rect x="180" y="100" width="40" height="40"/><rect x="220" y="100" width="40" height="40"/>
  </g>
  <text x="180" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">4 m</text>
  <text x="85" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">3 m</text>
  <text x="310" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">12 m²</text>
</svg>
```

The small raised $2$ is the same "squared" as in $3^2$: the unit metre got multiplied by itself.
:::

::: context order-agreement Why there is an agreed order
The order of operations is a rule people agreed on, like driving on one side of the road. It is not a fact of nature. What matters is that everyone uses the same one, so that $5 + 2 \times 3$ means the same thing to you, your teacher, your calculator and a flight computer.

In the United States many people remember it as PEMDAS: parentheses, exponents, multiplication and division, addition and subtraction. Multiplication does not beat division, and addition does not beat subtraction — each pair is done left to right. When a formula might be misread, good engineers add brackets anyway.
:::

::: context newton What a newton feels like
A **newton** is the force that makes a $1\,\mathrm{kg}$ mass speed up by $1\,\mathrm{m/s}$ every second: $1\,\mathrm{N} = 1\,\mathrm{kg \cdot m/s^2}$. It is named after Isaac Newton.

To feel one, hold a small apple of about $100$ grams. Its weight is $0.1 \times 9.81 = 0.981\,\mathrm{N}$ — almost exactly one newton. A person weighs several hundred newtons. A big rocket engine pushes with close to a million.
:::

::: context distributive-area The distributive law as a picture
Draw $7 \times 23$ as a rectangle $7$ units tall and $23$ wide. Its area is the answer. Now cut it into a $7 \times 20$ piece and a $7 \times 3$ piece. The two pieces together are the same rectangle, so the areas add up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="25" width="240" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="270" y="25" width="36" height="70" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="150" y="65" font-size="14" text-anchor="middle" fill="#1f2a44">7 × 20 = 140</text>
  <text x="288" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">7 × 3</text>
  <text x="288" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">= 21</text>
  <text x="150" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="288" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="18" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">7</text>
  <text x="180" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">140 + 21 = 161</text>
</svg>
```

The same picture with letters is $a(b + c) = ab + ac$: a rectangle $a$ tall and $b + c$ wide, cut in two.
:::
