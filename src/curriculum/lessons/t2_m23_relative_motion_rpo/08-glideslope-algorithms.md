---
id: l08-glideslope-algorithms
title: Glideslope algorithms
minutes: 16
covers:
  - glideslope algorithms
---

Think about parking a car in a garage. You do not work out one perfect push on the gas pedal at the street and then close your eyes. You look at how far the wall is, and you creep in slower and slower as it gets closer. At every moment the rule in your head is the same: "this far away, this fast". That rule keeps working even if you started a bit crooked or a bit fast, because it always reacts to where you are *now*.

The two-impulse targeting of the last lesson is the opposite kind of plan. It computes exactly the right burn for exactly one planned trip. That is powerful but brittle. If a burn fires a little late, or a little weak, the whole plan has to be worked out again. And even a perfect burn missed by $38.5\,\mathrm{cm}$ in the last lesson's reality check, because the CW model is not quite the real physics.

A final approach needs something more forgiving: a rule that says, continuously, "given how far away you are right now, here is how fast you should be closing". That rule is a **glideslope** — a guidance law that sets the closing speed from the range that is left. The name comes from the **[[radio beam that guides airliners down to a runway|aircraft-glideslope]]** at a steady, predictable angle. On a real vehicle it is the rule that brings a spacecraft the last few hundred metres to a space station.

## The glideslope law

First, two symbols. The **range** $r$ is the straight-line distance from the chaser to the target. It is always positive and shrinks toward zero as the chaser closes. Its rate of change is $\dot r$, read "**[[r-dot|newton-dot]]**" — how many metres per second the range is changing. When the chaser is closing, $r$ is shrinking, so $\dot r$ is negative. The **closing rate** is the size of $\dot r$: how fast the gap shrinks.

The standard glideslope sets the closing rate as a straight-line function of range:

$$
\dot r = -(a+br), \qquad a,b \ge 0.
$$

Read it as "closing rate equals $a$ plus $b$ times the range". The two numbers you choose mean:

- $b$, in $\mathrm{s^{-1}}$ (per second): how much closing rate you get per metre of range. With $b = 0.001\,\mathrm{s^{-1}}$, you close at $1\,\mathrm{m/s}$ when $1000\,\mathrm{m}$ away, and at $0.01\,\mathrm{m/s}$ when $10\,\mathrm{m}$ away.
- $a$, in $\mathrm{m/s}$: a **floor** — a small closing rate you keep even when the range is almost zero.

The minus sign is there because closing makes $r$ smaller.

## Solving the law

The law is a **first-order linear ODE** — an equation that ties a quantity to its own rate of change, of the kind you solved in the ODE module. Here is a quick way to crack it. Define a shifted range $u = r + a/b$. Adding a constant does not change the rate, so $\dot u = \dot r$. And $a + br = b(r + a/b) = bu$. So the law becomes

$$
\dot u = -b\,u.
$$

That is the plain **[[exponential decay|time-constant]]** you have seen many times: something that shrinks at a rate proportional to itself. Its solution is $u(t) = u_0 e^{-bt}$. Shift back by $a/b$ and use $u_0 = r_0 + a/b$, where $r_0$ is the starting range:

$$
r(t) = \left(r_0+\frac{a}{b}\right)e^{-bt} - \frac{a}{b}.
$$

::: note Why it has to be true
Check it by putting the answer back into the law. Differentiating,

$$
\dot r(t) = -b\left(r_0+\frac{a}{b}\right)e^{-bt}.
$$

And from the solution, $\left(r_0+\frac{a}{b}\right)e^{-bt} = r(t) + \frac{a}{b}$. So

$$
\dot r(t) = -b\left(r(t)+\frac{a}{b}\right) = -\big(a + b\,r(t)\big),
$$

which is the law. At $t = 0$, $e^{0} = 1$ and $r(0) = r_0 + a/b - a/b = r_0$, the right start. The same answer comes from separating variables, $\frac{dr}{a+br} = -dt$, and integrating both sides, or from an integrating factor. All three routes agree.
:::

Two cases behave very differently.

### Pure proportional: $a = 0$

With no floor, the law is $\dot r = -br$ and the solution is a clean exponential:

$$
r(t) = r_0 e^{-bt}.
$$

The closing rate is always exactly $b$ times the range. So the approach slows itself down as it gets close: ten times closer means ten times slower. The catch is that $e^{-bt}$ is never zero for any finite time. The chaser gets as close as you like, but in principle it **never quite arrives**. Each last centimetre takes as long as the one before.

### With a floor: $a > 0$

Add a floor, and the range *does* reach zero. Set $r(t) = 0$ in the solution and solve for $t$:

$$
\left(r_0+\frac{a}{b}\right)e^{-bt} = \frac{a}{b}
\ \Longrightarrow\
e^{-bt} = \frac{a}{a + br_0}
\ \Longrightarrow\
t_{\text{close}} = \frac{1}{b}\ln\!\left(1+\frac{br_0}{a}\right).
$$

(The first step moved $a/b$ across. The second divided both sides by $r_0 + a/b$ and multiplied top and bottom by $b$. The third took the natural log of both sides and used $-\ln\frac{a}{a+br_0} = \ln\frac{a+br_0}{a}$.)

At that moment $r = 0$, so the law gives $\dot r = -(a + b\cdot 0) = -a$. The chaser arrives at closing rate exactly $a$ — a deliberate, gentle, non-zero contact speed, instead of an endless crawl.

::: key The glideslope law
$$
\dot r = -(a+br), \qquad r(t) = \left(r_0+\frac{a}{b}\right)e^{-bt}-\frac{a}{b}.
$$
$a=0$: pure exponential decay, approaching zero range ever more slowly and never reaching it. $a>0$: reaches $r=0$ in finite time $t_{\text{close}}=(1/b)\ln(1+br_0/a)$, arriving at closing rate exactly $a$ — a deliberate, non-zero contact rate instead of an endless crawl.
:::

## The time constant

Either way, $1/b$ is the approach's **time constant**. It is the time for the exponential part of the range to shrink by a factor of $e \approx 2.718$. With $b = 0.001\,\mathrm{s^{-1}}$ the time constant is $1000\,\mathrm{s}$, about $17$ minutes.

A larger $b$ means a more aggressive glideslope. It closes faster at every range. But at any given range it is also moving faster, and a faster chaser needs more propellant to stop if the approach has to be broken off there.

## Why this rule is forgiving

Notice what the glideslope does *not* need. It never mentions a planned transfer time $T$. It never uses a state transition matrix. It asks only "how far am I right now?". That makes it a **[[feedback law|feedback]]**.

So if the chaser is a little ahead of or behind where a plan said it would be, the law does not care. It reads the true range and commands the right closing rate for that range. This is exactly the robustness a final approach needs, after the last lesson showed a CW-targeted transfer arriving close to, but not exactly at, its planned point.

::: example A pure proportional glideslope between hold points
Take $b = 0.001\,\mathrm{s^{-1}}$ and $a = 0$. That gives $1\,\mathrm{m/s}$ of closing rate at $1000\,\mathrm{m}$ — a reasonable choice. How long does the chaser take between the hold points at $250\,\mathrm{m}$, $30\,\mathrm{m}$ and $10\,\mathrm{m}$?

**The formula between two ranges.** With $a = 0$, $r(t) = r_0e^{-bt}$. To go from range $r_a$ to range $r_b$, solve $r_b = r_a e^{-bt}$:

$$
e^{-bt} = \frac{r_b}{r_a} \ \Longrightarrow\ t = \frac{1}{b}\ln\frac{r_a}{r_b}.
$$

**250 m to 30 m.** $t = 1000 \times \ln(250/30) = 1000 \times \ln(8.333) = 1000 \times 2.1203 = 2120.3\,\mathrm{s}$, about $35.3$ minutes. The closing rate starts at $0.001 \times 250 = 0.250\,\mathrm{m/s}$ and ends at $0.001 \times 30 = 0.030\,\mathrm{m/s}$.

**30 m to 10 m.** $t = 1000 \times \ln 3 = 1000 \times 1.0986 = 1098.6\,\mathrm{s}$, about $18.3$ minutes. The rate goes from $0.030$ to $0.010\,\mathrm{m/s}$.

**250 m to 10 m in one go.** $t = 1000 \times \ln 25 = 1000 \times 3.2189 = 3218.9\,\mathrm{s}$, about $53.6$ minutes.

| Segment | Time | Rate at start | Rate at end |
| --- | --- | --- | --- |
| 250 m $\to$ 30 m | 2120.3 s (35.3 min) | 0.250 m/s | 0.030 m/s |
| 30 m $\to$ 10 m | 1098.6 s (18.3 min) | 0.030 m/s | 0.010 m/s |
| 250 m $\to$ 10 m | 3218.9 s (53.6 min) | 0.250 m/s | 0.010 m/s |

**Does it make sense?** The two short segments [[add up to the long one|log-segments]]: $2120.3 + 1098.6 = 3218.9\,\mathrm{s}$. And the closing rate always drops by the same factor as the range. A chaser ten times closer is closing ten times more slowly — exactly the self-calming behaviour a final approach wants.
:::

::: example A floored glideslope arriving at a set contact rate
Now fly the last $30\,\mathrm{m}$ to contact with the same $b = 0.001\,\mathrm{s^{-1}}$ and a small floor $a = 0.005\,\mathrm{m/s}$ (that is $5\,\mathrm{mm/s}$). First note $a/b = 0.005/0.001 = 5\,\mathrm{m}$.

**Time to contact.**

$$
t_{\text{close}} = \frac{1}{0.001}\ln\!\left(1 + \frac{0.001 \times 30}{0.005}\right) = 1000\ln(1 + 6) = 1000\ln 7 = 1000 \times 1.9459 = 1945.9\,\mathrm{s},
$$

about $32.4$ minutes. The chaser touches at exactly $a = 5\,\mathrm{mm/s}$.

**A snapshot partway.** At $t = 1000\,\mathrm{s}$:

$$
r = (30 + 5)e^{-1} - 5 = 35 \times 0.36788 - 5 = 12.876 - 5 = 7.876\,\mathrm{m}.
$$

The commanded closing rate there is $a + br = 0.005 + 0.001 \times 7.876 = 0.012876\,\mathrm{m/s}$, about $12.88\,\mathrm{mm/s}$. Differentiating $r(t)$ directly gives the same number, as the check in the note promised.

**Does it make sense?** The rate starts at $0.005 + 0.001 \times 30 = 0.035\,\mathrm{m/s}$, is $0.0129\,\mathrm{m/s}$ partway, and ends at $0.005\,\mathrm{m/s}$ — always shrinking, never below the floor. A pure $a = 0$ law could bring this vehicle very close, but it would never command it to touch. The floor is what turns "approach forever" into "arrive".
:::

## Flying a smooth law with on-off thrusters

A real chaser cannot follow $\dot r = -(a+br)$ perfectly smoothly. Its small thrusters are on-off devices, like a light switch rather than a dimmer. Firing them nonstop would also waste far more propellant than a few well-timed pulses.

So a glideslope is flown as a series of small braking pulses:

1. Measure the range $r$ and the range rate $\dot r$ with the relative-navigation sensors.
2. Work out the commanded rate $-(a+br)$ for that range.
3. If the real rate and the commanded rate differ by more than a set tolerance, called the **[[deadband|deadband]]**, fire a short pulse to bring them back together.
4. Otherwise, coast and measure again.

The smooth curve is the target that the pulses chase. It is not a literal firing schedule. Between pulses the chaser coasts, and each pulse nudges it back onto the curve.

## Hold points

A real approach is not one unbroken glideslope from far away to contact. It pauses at **hold points** — set ranges, such as $250\,\mathrm{m}$, $30\,\mathrm{m}$ and $10\,\mathrm{m}$ in the example, where the chaser is commanded to stop closing (commanded rate zero) and wait.

Hold points are not arbitrary waypoints. They are planned checkpoints. At each one, controllers on the ground or software on board check the chaser's position and velocity. They confirm that every system needed for the next leg is healthy. Then they make an explicit **[[go/no-go|go-no-go]]** decision before closing resumes. A single continuous glideslope would give no natural place to stop and check. The hold points are where that checking happens, by design. Real vehicles use them: [[Crew Dragon, for example|dragon-holds]], pauses on its way in to the ISS.

::: warning Choosing $b$ is a real trade, not a free choice
A large $b$ closes fast, but at any given range it is carrying a higher closing rate. To abort, the chaser must at least cancel that rate, which costs about that much $\Delta v$ — and it needs a bigger safety margin. A small $b$ is gentle and cheap to abort from, but it takes longer at every segment, using up more of a limited approach window and more sensor tracking time. Neither is right in general. The choice is set by the propellant budget, the range at which the sensors work well, and how long the mission can spend close to the target. It is worth choosing again for each segment between hold points instead of using one $b$ for the whole approach.
:::

::: warning Mind the sign of $\dot r$
Range can only shrink or grow, and $\dot r$ says which. Closing means $\dot r < 0$. A common slip in code is to compare the *size* of the measured rate against the *signed* command, or the other way around. Then the controller fires to speed up a chaser that is already closing too fast. Pick one convention — signed $\dot r$ everywhere, or positive closing rate everywhere — and check it with a test case.
:::

## Check yourself

::: check
A pure proportional glideslope ($a = 0$) has $b = 0.002\,\mathrm{s^{-1}}$. How long does it take to close from $400\,\mathrm{m}$ to $50\,\mathrm{m}$?
:::

::: answer
Between two ranges, $t = \frac{1}{b}\ln\frac{r_0}{r_1}$. So

$$
t = \frac{1}{0.002}\ln\frac{400}{50} = 500\ln 8 = 500 \times 2.0794 = 1039.7\,\mathrm{s},
$$

about $17.3$ minutes. Sanity check: the time constant is $500\,\mathrm{s}$, and shrinking by a factor of $8$ takes a little over two time constants ($e^2 \approx 7.4$), so a bit more than $1000\,\mathrm{s}$ is right.
:::

::: check
Using the closed-form solution, not only intuition, explain why the $a = 0$ glideslope never reaches $r = 0$ in finite time.
:::

::: answer
With $a = 0$, $r(t) = r_0e^{-bt}$. The factor $e^{-bt}$ is positive for every finite $t$. It only approaches zero as $t$ grows without limit. So the equation $r(t) = 0$ has no finite solution.

In words: the closing rate is always exactly proportional to the range, so the rate shrinks right along with the range. The last few centimetres are covered ever more slowly and, in principle, take forever.
:::

::: check
Two glideslopes have the same $b$ and start from the same $r_0$. One has a floor $a_1$ that is twice the other's floor $a_2$. Which reaches $r = 0$ sooner? Does it arrive more gently or more abruptly than the other?
:::

::: answer
Look at $t_{\text{close}} = \frac{1}{b}\ln\left(1 + \frac{br_0}{a}\right)$. A larger $a$ makes $\frac{br_0}{a}$ smaller, which makes the logarithm smaller. So the larger floor, $a_1$, arrives sooner.

It also arrives less gently. The arrival rate is exactly $a$, so the faster trajectory touches at $a_1$, twice the contact rate of the other.
:::

::: check
Why are hold points placed at set ranges (such as $250\,\mathrm{m}$, $30\,\mathrm{m}$ and $10\,\mathrm{m}$), instead of flying one continuous glideslope from far away straight to contact?
:::

::: answer
A continuous glideslope has no natural, planned moment to pause. Hold points are added on purpose to create those moments: places to stop, check the vehicle and its sensors, and get an explicit go-ahead before closing again. Each one is a deliberate zero-rate pause. It is not part of the $\dot r = -(a+br)$ law itself — it is an operational layer on top of it.
:::

::: check
A mission wants the final approach to touch with a closing rate of no more than $3\,\mathrm{cm/s}$. It uses the floored law with $b = 0.0015\,\mathrm{s^{-1}}$, starting from $r_0 = 10\,\mathrm{m}$. What is the largest floor $a$ allowed, and about how long does that segment take?
:::

::: answer
The arrival rate is exactly $a$, so the rule is $a \le 0.03\,\mathrm{m/s}$. Take the limit, $a = 0.03\,\mathrm{m/s}$.

Time to close:

$$
t_{\text{close}} = \frac{1}{0.0015}\ln\left(1 + \frac{0.0015 \times 10}{0.03}\right) = 666.7\ln(1.5) = 666.7 \times 0.4055 = 270.3\,\mathrm{s},
$$

about $4.5$ minutes for this last segment. Sanity check: the rate starts at $0.03 + 0.015 = 0.045\,\mathrm{m/s}$ and ends at $0.03\,\mathrm{m/s}$. Covering $10\,\mathrm{m}$ at somewhere between those speeds takes between $222$ and $333\,\mathrm{s}$, and $270\,\mathrm{s}$ sits inside that range.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r$, $\dot r$ | Range to the target, and its rate of change ("r-dot"); $\dot r < 0$ while closing |
| $\dot r=-(a+br)$ | Glideslope law: closing rate is a straight-line function of range |
| $r(t)=(r_0+a/b)e^{-bt}-a/b$ | The closed-form solution |
| $a=0$ | Pure exponential decay; never reaches $r=0$ in finite time |
| $a>0$ | Reaches $r=0$ at $t_{\text{close}}=(1/b)\ln(1+br_0/a)$, arriving at rate exactly $a$ |
| $1/b$ | Time constant; larger $b$ closes faster but costs more to abort |
| Worked $a=0$, $b=0.001\,\mathrm{s^{-1}}$ | 250→30 m: 35.3 min; 30→10 m: 18.3 min; 250→10 m: 53.6 min |
| Hold points | Deliberate zero-rate pauses for checks and a go/no-go, not part of the law itself |
| Real execution | On-off thrusters fly the curve as small pulses, fired when the rate leaves a deadband |

A glideslope says *how fast* to close along a line. The next lesson asks *which line* — straight in along the direction of flight, or straight up from below — and shows why that choice is one of the biggest safety decisions in the whole rendezvous.

::: context aircraft-glideslope Borrowed from airliners
At a big airport, a radio transmitter beside the runway sends out a beam tilted up at a set angle — usually $3^\circ$. An airliner coming in to land follows that beam down, so it descends at a steady, predictable slope all the way to the runway. Pilots call the beam the **glideslope**. Rendezvous engineers borrowed the name for any rule that ties closing speed to distance, so the approach is equally steady and predictable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="350" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <rect x="250" y="96" width="95" height="8" fill="#6c7a93"/>
  <line x1="30" y1="30" x2="260" y2="100" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6,4"/>
  <polygon points="60,35 90,39 88,44 60,44" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="46" font-size="11" fill="#1d6fd1">glideslope beam</text>
  <text x="297" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">runway</text>
  <text x="10" y="116" font-size="11" fill="#6c7a93">angle drawn steeper than the real 3°</text>
</svg>
```
:::

::: context newton-dot The dot on top
A dot over a letter means "rate of change with time". So $\dot r$, said "r-dot", is how fast $r$ is changing, and $\ddot x$, "x-double-dot", is how fast the rate of $x$ is changing. Isaac Newton used dots this way when he invented calculus, and physicists and engineers still use them for time rates. Here $\dot r$ has units of metres per second, because $r$ is in metres and time is in seconds.
:::

::: context time-constant What the time constant means
In exponential decay, a quantity shrinks at a rate proportional to its own size. Hot cocoa cooling toward room temperature does this: the hotter it is, the faster it cools. Every **time constant** — here $1/b$ — the quantity shrinks to about $37\%$ of what it was ($1/e \approx 0.368$). After two time constants it is down to about $14\%$, after three to about $5\%$.

The plot shows $30\,\mathrm{m}$ of range closing with $b = 0.001\,\mathrm{s^{-1}}$: with no floor (blue) the range keeps shrinking but never reaches zero; with a floor of $a = 0.005\,\mathrm{m/s}$ (red) it reaches zero at $1946\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="25" x2="45" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="45.0,30.0 54.7,43.3 64.3,55.4 74.0,66.3 83.7,76.2 93.3,85.1 103.0,93.2 112.7,100.5 122.3,107.1 132.0,113.1 141.7,118.5 151.3,123.4 161.0,127.8 170.7,131.8 180.3,135.5 190.0,138.8 199.7,141.7 209.3,144.4 219.0,146.9 228.7,149.1 238.3,151.1 248.0,152.9 257.7,154.5 267.3,156.0 277.0,157.3 286.7,158.5 296.3,159.6 306.0,160.6 315.7,161.5 325.3,162.3 335.0,163.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="45.0,30.0 51.3,40.3 57.5,49.9 63.8,58.9 70.1,67.3 76.4,75.2 82.6,82.7 88.9,89.6 95.2,96.1 101.4,102.2 107.7,107.9 114.0,113.3 120.2,118.3 126.5,123.0 132.8,127.5 139.1,131.6 145.3,135.5 151.6,139.1 157.9,142.5 164.1,145.7 170.4,148.7 176.7,151.5 182.9,154.1 189.2,156.6 195.5,158.9 201.8,161.1 208.0,163.1 214.3,165.0 220.6,166.8 226.8,168.4 233.1,170.0"/>
  <circle cx="233.1" cy="170" r="4" fill="#b4232c"/>
  <text x="40" y="34" font-size="11" text-anchor="end" fill="#1f2a44">30 m</text>
  <text x="40" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="233" y="186" font-size="11" text-anchor="middle" fill="#b4232c">1946 s</text>
  <text x="335" y="186" font-size="11" text-anchor="end" fill="#1f2a44">3000 s</text>
  <text x="250" y="140" font-size="11" fill="#1d6fd1">a = 0</text>
  <text x="120" y="145" font-size="11" fill="#b4232c">a = 5 mm/s</text>
</svg>
```
:::

::: context feedback Feedback: measure, compare, correct
A **feedback law** decides what to do from a measurement of the present, not from a plan made earlier. A thermostat is the everyday example: it reads the room temperature, compares it with the setting, and switches the heat on or off. Because it always looks again, it corrects for things nobody predicted — an open window, a crowd of people. The glideslope does the same with range: whatever went slightly wrong earlier, the next command is based on where the chaser really is.
:::

::: context log-segments Why the times add up
With $a = 0$, the time between two ranges is $\frac{1}{b}\ln\frac{r_a}{r_b}$. Logarithms turn division into subtraction, so

$$
\ln\frac{250}{30} + \ln\frac{30}{10} = \ln\frac{250}{10}.
$$

The $30$s cancel, and the segment times add up to the whole. It also means every *halving* of the range takes the same time, $\frac{\ln 2}{b}$ — about $693\,\mathrm{s}$ for $b = 0.001\,\mathrm{s^{-1}}$ — whether it is from $200\,\mathrm{m}$ to $100\,\mathrm{m}$ or from $2\,\mathrm{m}$ to $1\,\mathrm{m}$.
:::

::: context deadband A zone where nothing happens
A **deadband** is a small band of error the controller deliberately ignores. A home thermostat set to $20^\circ$ might not start the heater until the room falls to $19.5^\circ$; without that gap it would click on and off every few seconds. For a thruster, every firing costs propellant and wears the valve, so a deadband saves both.

Here the commanded closing speed is $b\,r$, a straight line through zero. The chaser coasts at a steady speed (flat steps) until it is $0.002\,\mathrm{m/s}$ faster than the line, then a pulse drops it onto the line ($b = 0.001\,\mathrm{s^{-1}}$, $30\,\mathrm{m}$ to $10\,\mathrm{m}$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="25" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="30" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6,4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="321.2,38.8 302.5,38.8 302.5,47.5 283.8,47.5 283.8,56.2 265.0,56.2 265.0,65.0 246.2,65.0 246.2,73.8 227.5,73.8 227.5,82.5 208.8,82.5 208.8,91.2 190.0,91.2 190.0,100.0 171.2,100.0 171.2,108.8 152.5,108.8 152.5,117.5 133.8,117.5 133.8,126.2"/>
  <text x="133.8" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10 m</text>
  <text x="227.5" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">20 m</text>
  <text x="321.2" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">30 m</text>
  <text x="36" y="42" font-size="11" text-anchor="end" fill="#1f2a44">0.03</text>
  <text x="36" y="129" font-size="11" text-anchor="end" fill="#1f2a44">0.01</text>
  <text x="50" y="22" font-size="11" fill="#1f2a44">closing speed (m/s) against range</text>
  <text x="200" y="150" font-size="11" fill="#1d6fd1">command b·r</text>
  <text x="150" y="80" font-size="11" fill="#b4232c">coast, then pulse</text>
</svg>
```
:::

::: context go-no-go Go or no go
**Go/no-go** is mission-control language for a yes-or-no decision to continue. Before a rocket launches, each console is polled in turn and answers "go" or "no go". Rendezvous uses the same habit at each hold point: the flight team, and on newer vehicles the onboard software, confirms that navigation, propulsion and the target's own systems are all healthy before the chaser is allowed any closer. A single "no go" keeps the chaser holding or sends it back out.
:::

::: context dragon-holds Real hold points
SpaceX's Crew Dragon approaches the ISS in stages, pausing at hold points along the way — publicly described ones sit at about $220\,\mathrm{m}$ and $20\,\mathrm{m}$ from the docking port — where the crew and flight controllers in Houston and Hawthorne check the vehicle before it moves in. The exact ranges vary between vehicles and missions; the $250\,\mathrm{m}$, $30\,\mathrm{m}$ and $10\,\mathrm{m}$ gates in this lesson are round numbers of the same kind, and they are the ones used in this module's approach-design exercise.
:::
