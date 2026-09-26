---
id: l06-solving-simple-equations
title: Solving simple equations
minutes: 17
covers:
  - solving simple equations
---

Last lesson you fed numbers into formulas and got answers out. Put in the speed and the time, and out comes the distance. But real questions often come the other way round. You know how far the spacecraft has to go and how fast it moves. How *long* will it take? You know how hard the engine pushes and how heavy the stage is. How quickly will it speed up?

To answer those, you have to run a formula backwards. That is what **solving an equation** means: finding the value of an unknown letter that makes the equation true. It sounds like a new skill, but it rests on a single rule you can hold in one hand.

This lesson teaches that rule with a picture — a balance scale — and then uses it on one-step equations, two-step equations, equations with the unknown on both sides, and finally on whole formulas, so that $d = vt$ can be turned into "time equals distance divided by speed". Every answer ends with a check. By the end, checking should feel as natural as closing a door behind you.

## The balance

Picture an old-fashioned balance scale with two pans. When both pans hold the same weight, the beam sits level. That level beam is what an [[equals sign|equals-sign]] means: the left side and the right side are the same amount.

Now suppose the left pan holds a mystery box, $x$, plus a $7\,\mathrm{kg}$ weight, and the right pan holds $12\,\mathrm{kg}$. The beam is level, so

$$
x + 7 = 12.
$$

How heavy is the box? Take the $7\,\mathrm{kg}$ weight off the left pan. The beam tips — unless you also take $7\,\mathrm{kg}$ off the right pan. Do both, and it stays level with the box alone on the left and $5\,\mathrm{kg}$ on the right. So $x = 5$.

That is the whole method, and it is worth saying slowly. You may do anything you like to one side, as long as you do exactly the same to the other side. The beam stays level, the equation stays true, and step by step the unknown ends up alone. This picture is the **[[balance|balance-picture]]**, and it is the only rule of solving.

::: key The one rule for solving an equation
Do the same thing to both sides, so they stay equal, until the unknown is alone. Then check by putting the answer back in.
:::

Why check? Because it costs a few seconds and catches almost every slip. For $x + 7 = 12$, put $x = 5$ back into the left side: $5 + 7 = 12$. That matches the right side, so $x = 5$ is right.

## Undoing: inverse operations

To get the unknown alone, you undo whatever was done to it. Every operation has a partner that undoes it, called its **inverse operation**:

| If the unknown was ... | undo it by ... |
| --- | --- |
| added to ($x + 7$) | subtracting ($-7$) |
| subtracted from ($x - 4$) | adding ($+4$) |
| multiplied ($5x$) | dividing ($\div 5$) |
| divided ($x/4$) | multiplying ($\times 4$) |

Adding $7$ and then taking away $7$ leaves you where you started. Multiplying by $5$ and then dividing by $5$ does too. That is what "inverse" means: one step exactly cancels the other.

### One-step equations

Each of these needs one undo, done to both sides.

$$
\begin{aligned}
x - 4 &= 9 &&\text{add 4 to both sides:} & x &= 13 \\
5x &= 35 &&\text{divide both sides by 5:} & x &= 7 \\
\frac{x}{4} &= 6 &&\text{multiply both sides by 4:} & x &= 24
\end{aligned}
$$

Check each one. $13 - 4 = 9$. $5 \times 7 = 35$. $24 \div 4 = 6$. All three match.

::: warning Dividing by zero is the one forbidden move
You may add, subtract or multiply both sides by any number. You may divide both sides by any number **except zero**. Dividing by zero has [[no answer at all|divide-by-zero]], so it breaks the balance instead of keeping it level. With plain numbers this never comes up. With letters it can — dividing by $a$ quietly assumes $a$ is not zero — and later in the course that assumption hides real bugs.
:::

## Two-step equations

Most equations have more than one thing done to the unknown. Take

$$
4x - 3 = 29.
$$

Read it as a recipe: start with $x$, multiply by $4$, then subtract $3$, and you get $29$. To get back to $x$, undo the steps **in reverse order**, like taking off your shoes before your socks. The last thing done was "subtract $3$", so undo that first. Then undo "multiply by $4$".

$$
\begin{aligned}
4x - 3 &= 29 \\
4x &= 32 &&\text{add 3 to both sides} \\
x &= 8 &&\text{divide both sides by 4}
\end{aligned}
$$

Check: $4 \times 8 - 3 = 32 - 3 = 29$. It matches.

Why undo the adding and subtracting first? Because the order of operations did the multiplying first when the equation was built. Solving runs the film backwards.

::: warning Do it to the whole side, not one piece
Say you want to divide $2x + 6 = 10$ by $2$. You must divide **every** term: $x + 3 = 5$, so $x = 2$. Dividing only the $2x$ gives $x + 6 = 5$ and the wrong answer $x = -1$. Check it: $2 \times (-1) + 6 = 4$, not $10$. When in doubt, move the plain number first (subtract $6$ to get $2x = 4$), then divide.
:::

::: example How long until the rocket reaches 300 m/s?
A rocket is climbing at $v_0 = 100\,\mathrm{m/s}$ and speeds up by $a = 4\,\mathrm{m/s^2}$ — it gains $4$ metres per second of speed every second. Its speed after $t$ seconds is $v = v_0 + a \cdot t$. When will it reach $300\,\mathrm{m/s}$?

**Substitute what you know.** Put in $v = 300$, $v_0 = 100$ and $a = 4$:

$$
300 = 100 + 4t.
$$

**Undo the adding.** The $100$ is added to $4t$, so subtract $100$ from both sides:

$$
200 = 4t.
$$

**Undo the multiplying.** $t$ is multiplied by $4$, so divide both sides by $4$:

$$
t = 50\,\mathrm{s}.
$$

**Check.** $100 + 4 \times 50 = 100 + 200 = 300$. It matches.

**Does it make sense?** The rocket needs $200\,\mathrm{m/s}$ more speed, gaining $4$ each second. That is $200 \div 4 = 50$ seconds. The units work too: $\mathrm{m/s}$ divided by $\mathrm{m/s^2}$ leaves seconds.
:::

::: example When is 157 000 kg of propellant left?
Last lesson we built the formula $m = 411\,000 - 2540\,t$ for the propellant left in a stage, in kilograms, $t$ seconds after the engines start. At what time is exactly $157\,000\,\mathrm{kg}$ left?

**Set up the equation.** Put $m = 157\,000$:

$$
157\,000 = 411\,000 - 2540\,t.
$$

The unknown has a minus sign in front of it. A tidy way to deal with that is to add $2540\,t$ to both sides, so the $t$ term becomes positive:

$$
157\,000 + 2540\,t = 411\,000.
$$

**Undo the adding.** Subtract $157\,000$ from both sides:

$$
2540\,t = 254\,000.
$$

**Undo the multiplying.** Divide both sides by $2540$:

$$
t = \frac{254000}{2540} = 100\,\mathrm{s}.
$$

**Check.** $411\,000 - 2540 \times 100 = 411\,000 - 254\,000 = 157\,000$. It matches — and it is exactly the number we got last lesson, run the other way.
:::

## The unknown on both sides

Sometimes the unknown shows up on both sides of the equals sign. The plan is to gather all the unknowns on one side and all the plain numbers on the other. Take

$$
5x + 2 = 3x + 10.
$$

Subtract $3x$ from both sides, so the unknowns are only on the left. Then subtract $2$ from both sides, so the plain numbers are only on the right. Then divide:

$$
\begin{aligned}
2x + 2 &= 10 &&\text{subtract } 3x \text{ from both sides} \\
2x &= 8 &&\text{subtract 2 from both sides} \\
x &= 4 &&\text{divide both sides by 2}
\end{aligned}
$$

Check both sides separately: the left is $5 \times 4 + 2 = 22$ and the right is $3 \times 4 + 10 = 22$. Equal, so $x = 4$ is right.

Here is a real question of this kind. On a test stand, tank A holds $500$ litres of water and drains at $12$ litres a minute. Tank B holds $200$ litres and is being filled at $8$ litres a minute. After how many minutes do they hold the same amount?

After $t$ minutes, tank A holds $500 - 12t$ and tank B holds $200 + 8t$. "The same amount" is an equals sign:

$$
500 - 12t = 200 + 8t.
$$

Add $12t$ to both sides to get $500 = 200 + 20t$. Subtract $200$ to get $300 = 20t$. Divide by $20$: $t = 15$ minutes. Check: tank A holds $500 - 12 \times 15 = 320$ litres and tank B holds $200 + 8 \times 15 = 320$ litres. The same. If you drew both tanks on a graph, the two lines would [[cross at exactly that moment|tanks-crossing]].

::: warning "Move it across and change the sign" is a shortcut, not a rule
People often say "move the $3x$ to the other side and flip its sign". That works, but only because it is short for "subtract $3x$ from both sides". If you forget where the shortcut comes from, it is easy to flip a sign that should not flip, or to "move" something that was multiplying. Say the real step to yourself: *what am I doing to both sides?*
:::

## Rearranging a formula

The most common kind of solving an engineer does is not finding a mystery $x$. It is taking a formula and getting a *different* letter on its own. You use exactly the same rule. The only new thing is that the other letters stay as letters. Treat them as if they were numbers you have not been told yet.

Start with $d = vt$. Suppose you want $t$ on its own. In $d = vt$, $t$ is multiplied by $v$. Undo that by dividing both sides by $v$:

$$
d = vt \quad\Rightarrow\quad \frac{d}{v} = t \quad\Rightarrow\quad t = \frac{d}{v}.
$$

(The arrow $\Rightarrow$ is read "which gives".) To get $v$ instead, divide both sides of $d = vt$ by $t$: $v = \dfrac{d}{t}$.

One formula has become three, and each answers a different question:

::: key One formula, three ways round
$d = v \cdot t$ (distance), $v = \dfrac{d}{t}$ (speed) and $t = \dfrac{d}{v}$ (time) are the same fact rearranged. Keep the units matched: metres and seconds give metres per second.
:::

A handy picture for three-letter formulas like this is the [[formula triangle|formula-triangle]]. But the balance rule is what makes it work, and the balance rule works on any formula, not only the triangle kind.

Newton's second law, $F = ma$, rearranges the same way. To find the acceleration, divide both sides by $m$: $a = \dfrac{F}{m}$. An engine pushing with $F = 845\,000\,\mathrm{N}$ on a stage of mass $m = 25\,000\,\mathrm{kg}$ gives

$$
a = \frac{845000}{25000} = 33.8\,\mathrm{m/s^2}.
$$

That is the same stage as in the last lesson, run backwards: there we put in $a$ and got $F$.

::: example How long is one lap of the Earth?
The International Space Station travels about $42\,600\,\mathrm{km}$ to go once around the Earth, at a speed of about $7.67\,\mathrm{km/s}$. How long does one lap take?

**Choose the right form.** We want time, and we know distance and speed. From $d = vt$, divide both sides by $v$:

$$
t = \frac{d}{v}.
$$

**Substitute, with units.** Kilometres over kilometres per second leaves seconds:

$$
t = \frac{42600\,\mathrm{km}}{7.67\,\mathrm{km/s}} \approx 5554\,\mathrm{s}.
$$

**Make it easier to picture.** There are $60$ seconds in a minute, so $5554 \div 60 \approx 92.6$ minutes. That is about an hour and a half — and indeed the real station [[goes round in about an hour and a half|iss-laps]].

**Check.** Put the answer back into $d = vt$: $7.67 \times 5554 \approx 42\,600\,\mathrm{km}$. It matches.
:::

Weight works the same way. $W = mg$ gives $m = \dfrac{W}{g}$: divide the weight by $g$ to get the mass. A rocket that pushes down on its launch pad with a weight of $5\,480\,000\,\mathrm{N}$ has a mass of about $5\,480\,000 \div 9.81 \approx 559\,000\,\mathrm{kg}$.

::: note Where this comes back
- In [Linear and quadratic equations](#/module/t0_m01_algebra_precalc?lesson=l04-linear-and-quadratic-equations) the balance rule solves longer equations, and "literal equations" is the name for rearranging formulas like $v = v_0 + at$ into $t = (v - v_0)/a$.
- In [Systems of equations](#/module/t0_m01_algebra_precalc?lesson=l05-systems-of-equations) two unknowns are found from two equations at once — the two-tank problem is a small taste.
- In [Newton's laws and inertial frames](#/module/t1_m13_classical_mechanics?lesson=l01-newton-laws-inertial-frames) a rocket's lift-off acceleration comes from rearranging $F = ma$ with thrust and weight both on the page.
:::

## Check yourself

::: check
Solve $\dfrac{x}{5} - 2 = 6$ and check your answer.
:::

::: answer
The last thing done to $x$ was "subtract $2$", so undo that first: add $2$ to both sides to get $\frac{x}{5} = 8$. Then undo "divide by $5$" by multiplying both sides by $5$: $x = 40$.

Check: $40 \div 5 - 2 = 8 - 2 = 6$. It matches.
:::

::: check
Solve $7x - 5 = 3x + 23$.
:::

::: answer
Subtract $3x$ from both sides: $4x - 5 = 23$. Add $5$ to both sides: $4x = 28$. Divide both sides by $4$: $x = 7$.

Check each side: left $7 \times 7 - 5 = 44$, right $3 \times 7 + 23 = 44$. Equal.
:::

::: check
A friend solves $2x + 6 = 10$ like this: "divide by 2, so $x + 6 = 5$, so $x = -1$." Find the mistake and give the right answer.
:::

::: answer
Dividing a side by $2$ means dividing **every** term on it, including the $6$. The right step gives $x + 3 = 5$, so $x = 2$. Check: $2 \times 2 + 6 = 10$. Their answer fails the check: $2 \times (-1) + 6 = 4$, which is not $10$ — the check would have caught it.
:::

::: check
Rearrange $A = l \cdot w$ to give $w$ on its own. A solar panel has area $6\,\mathrm{m^2}$ and length $4\,\mathrm{m}$. How wide is it?
:::

::: answer
$w$ is multiplied by $l$, so divide both sides by $l$: $w = \dfrac{A}{l}$. Then $w = \dfrac{6\,\mathrm{m^2}}{4\,\mathrm{m}} = 1.5\,\mathrm{m}$. Square metres divided by metres leaves metres, as a width should. Check: $4 \times 1.5 = 6$.
:::

::: check
On the Moon, $g = 1.62\,\mathrm{m/s^2}$. A lander weighs $2430\,\mathrm{N}$ there. What is its mass?
:::

::: answer
From $W = mg$, divide both sides by $g$: $m = \dfrac{W}{g} = \dfrac{2430}{1.62} = 1500\,\mathrm{kg}$. Check: $1500 \times 1.62 = 2430$. On Earth the same $1500\,\mathrm{kg}$ would weigh about $1500 \times 9.81 = 14\,715\,\mathrm{N}$, six times more.
:::

::: check
A weather balloon rises at a steady $5\,\mathrm{m/s}$. How long does it take to reach $30\,\mathrm{km}$? Watch the units.
:::

::: answer
Use $t = \dfrac{d}{v}$. First make the units match: $30\,\mathrm{km} = 30\,000\,\mathrm{m}$. Then $t = \dfrac{30000}{5} = 6000\,\mathrm{s}$, and $6000 \div 60 = 100$ minutes. Dividing $30$ by $5$ without converting would give "$6$", which is neither seconds nor minutes of anything.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Solving | finding the value of the unknown that makes the equation true |
| The one rule | do the same thing to both sides until the unknown is alone |
| Checking | put the answer back into the original equation; both sides must match |
| Inverse operations | $+$ undoes $-$, $\times$ undoes $\div$, and the other way round |
| Two steps | undo in reverse order: adding and subtracting first, then multiplying and dividing |
| Unknown on both sides | gather the unknowns on one side, the plain numbers on the other |
| Never | divide both sides by zero |
| Rearranging | $d = vt$ gives $t = d/v$ and $v = d/t$; $F = ma$ gives $a = F/m$; $W = mg$ gives $m = W/g$ |

Next lesson draws pictures of formulas. Plot the pairs of numbers a formula makes and you get a graph — and a straight-line graph turns out to be a picture of an equation like the ones you solved here.

::: context equals-sign Who invented the equals sign
The sign $=$ was invented by the Welsh mathematician Robert Recorde, in a book printed in 1557. He was tired of writing "is equal to" over and over, so he drew two parallel lines of the same length, because, as he put it, no two things can be more equal.

Before that, people wrote equations out in words. The word **algebra** itself comes from the title of a book written in Baghdad around the year 820 by al-Khwarizmi. Its "al-jabr" meant restoring — moving a subtracted quantity to the other side so it becomes an added one.
:::

::: context balance-picture The balance in a picture
Here is $x + 7 = 12$ as a scale. Lifting the $7$ off the left pan and $7$ off the right leaves the box against $5$, and the beam never tips.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="180,50 160,150 200,150" fill="#6c7a93"/>
  <line x1="60" y1="50" x2="300" y2="50" stroke="#1f2a44" stroke-width="4"/>
  <line x1="80" y1="50" x2="80" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="50" x2="280" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="100" x2="120" y2="100" stroke="#1f2a44" stroke-width="3"/>
  <line x1="240" y1="100" x2="320" y2="100" stroke="#1f2a44" stroke-width="3"/>
  <rect x="46" y="68" width="32" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="89" font-size="14" text-anchor="middle" fill="#1f2a44" font-weight="700">x</text>
  <rect x="84" y="76" width="30" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="99" y="93" font-size="13" text-anchor="middle" fill="#1f2a44">7</text>
  <rect x="256" y="62" width="48" height="38" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="86" font-size="13" text-anchor="middle" fill="#1f2a44">12</text>
  <text x="180" y="28" font-size="14" text-anchor="middle" fill="#1f2a44">x + 7 = 12</text>
  <text x="180" y="166" font-size="12" text-anchor="middle" fill="#1d6fd1">level beam = equals sign</text>
</svg>
```

Whatever you add to or take off one pan, you add to or take off the other.
:::

::: context divide-by-zero Why dividing by zero has no answer
Division asks "what times this gives that?" $12 \div 3 = 4$ because $4 \times 3 = 12$. So $12 \div 0$ asks: what number times $0$ gives $12$? Anything times $0$ is $0$, so no number works. There is no answer to give.

That is why dividing both sides by zero is forbidden: it does not produce a new, equal pair of sides. A computer asked to divide by zero either stops with an error or returns a special "infinity" or "not a number" value. In flight software, either one arriving where a steering command should be is a very bad day.
:::

::: context tanks-crossing Where the two tanks meet
Draw each tank's water against time. Tank A starts high and slopes down; tank B starts low and slopes up. The equation $500 - 12t = 200 + 8t$ asks where the two lines meet — and they cross at $t = 15$ minutes, $320$ litres.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="45" x2="290" y2="117" stroke="#b4232c" stroke-width="3"/>
  <line x1="50" y1="120" x2="290" y2="72" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="200" cy="90" r="5" fill="#1f2a44"/>
  <line x1="200" y1="90" x2="200" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="200" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">15</text>
  <text x="50" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="290" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">24</text>
  <text x="320" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">t (min)</text>
  <text x="44" y="49" font-size="11" text-anchor="end" fill="#1f2a44">500</text>
  <text x="44" y="124" font-size="11" text-anchor="end" fill="#1f2a44">200</text>
  <text x="44" y="94" font-size="11" text-anchor="end" fill="#1f2a44">320</text>
  <text x="100" y="54" font-size="12" fill="#b4232c">tank A: 500 − 12t</text>
  <text x="228" y="66" font-size="12" fill="#1d6fd1">tank B: 200 + 8t</text>
</svg>
```

Solving an equation and finding where two graphs cross are the same question asked two ways. The next lesson is about graphs.
:::

::: context formula-triangle The formula triangle
For a formula of the form "one thing equals two things multiplied", like $d = vt$, write the answer on top and the two factors side by side underneath. Cover the letter you want with your finger. What is left tells you the formula: side by side means multiply, one above the other means divide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="180,15 90,135 270,135" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="95" x2="240" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="95" x2="180" y2="135" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="78" font-size="20" text-anchor="middle" fill="#b4232c" font-weight="700">d</text>
  <text x="150" y="124" font-size="20" text-anchor="middle" fill="#1d6fd1" font-weight="700">v</text>
  <text x="210" y="124" font-size="20" text-anchor="middle" fill="#1d6fd1" font-weight="700">t</text>
</svg>
```

Cover $t$ and you see $d$ over $v$: $t = d/v$. It only works for this one shape of formula, so learn the balance rule too.
:::

::: context iss-laps Fifteen or sixteen sunrises a day
At about $92.6$ minutes a lap, the space station goes round the Earth $24 \times 60 \div 92.6 \approx 15.6$ times every day. Each lap brings one sunrise and one sunset, so the crew sees roughly fifteen or sixteen of each in every 24 hours.

The lap distance and speed in the example depend on how high the station flies. It sits around $400\,\mathrm{km}$ up; lower orbits are a little shorter and faster, higher ones longer and slower. You will see exactly why in the orbital mechanics modules.
:::
