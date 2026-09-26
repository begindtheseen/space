---
id: l07-tolerance-stack-up
title: Tolerance stack-up — worst case and root-sum-square
minutes: 23
covers:
  - 'Tolerance stack-up: worst case versus root-sum-square'
---

Stack five books on a shelf. Each book is "about 3 cm" thick, but no two are exactly the same. Some are a millimeter fat, some a millimeter thin. Now ask: will the stack fit under a shelf that is 15.5 cm high? If every book happens to be fat, the stack is 15.5 cm and it only just fits. If they are a mix, it fits easily. The small differences in each book add up into one bigger difference in the whole stack.

Engineers call this a **[[tolerance stack-up|stack-up-word]]** — working out how the small allowed errors of several parts add up along a chain of parts. Last lesson you met the **tolerance** on a single dimension: the amount a measured size may differ from its **nominal** (the ideal size written on the drawing) and still pass inspection. This lesson asks what happens when parts with tolerances are bolted together. There are two standard ways to add them up. One assumes the worst. The other assumes the statistics of real factories. Knowing which to quote, and when, is a judgment a good engineer has to be able to defend.

For a guidance, navigation and control (GNC) engineer this is not a mechanical side issue. A star tracker — a camera that works out which way a spacecraft points by recognising star patterns — sits on a bracket, on a panel, on the spacecraft structure. Every one of those parts adds a little tilt. The sum of those tilts is how wrong the spacecraft's idea of its own direction can be, before any software runs at all.

## Adding up errors along a chain

Picture the chain as a line of parts, each with a nominal size and a tolerance written as $\pm t$ (read "plus or minus t"). The nominal sizes add up the ordinary way. The question is what to do with the $t$ values.

Take a small box whose inside length is $50.0 \pm 0.10\,\mathrm{mm}$. Three parts sit inside, end to end: $15.0 \pm 0.05$, $20.0 \pm 0.08$ and $14.5 \pm 0.06\,\mathrm{mm}$. The thing we care about is the **gap** left over at the end, because the design needs some room there so the lid closes.

The nominal gap is

$$
50.0 - 15.0 - 20.0 - 14.5 = 0.5\,\mathrm{mm}.
$$

Now the errors. Notice that the box and the parts pull the gap in opposite directions: a bigger box makes the gap bigger, while a bigger part makes it smaller. It does not matter for the size of the spread, because each tolerance can push the gap either way by its full amount. So all four tolerances, $0.10$, $0.05$, $0.08$ and $0.06$, feed into the gap. What we need is a rule for combining them.

## Worst case: assume everything goes wrong at once

The cautious rule says: suppose every part lands at the extreme of its band, all in the same unlucky direction, at the same time. Then the errors add up in full:

$$
T_{\mathrm{WC}} = t_1 + t_2 + t_3 + \dots + t_n .
$$

Read $T_{\mathrm{WC}}$ as "T worst case". For the box,

$$
T_{\mathrm{WC}} = 0.10 + 0.05 + 0.08 + 0.06 = 0.29\,\mathrm{mm}.
$$

So the gap is $0.5 \pm 0.29\,\mathrm{mm}$: at least $0.21\,\mathrm{mm}$ and at most $0.79\,\mathrm{mm}$. The gap never closes, so the lid always fits. That is a guarantee. If every part passes inspection, every assembly works, with no exceptions.

The price is that the guarantee is expensive. Suppose the design really needed the gap to stay within $\pm 0.15\,\mathrm{mm}$. Worst case would force you to shrink every part's tolerance roughly in half. Tighter tolerances mean slower machining, more scrapped parts and more inspection. With many parts in the chain, worst case can demand tolerances that nobody can build at a sensible price.

## Root-sum-square: assume real factories

Think about the books again. For every book to be fat on the same day, you would need very bad luck. Most books are near the middle of their range. Some fat books and some thin books cancel each other out.

Real machined parts behave the same way. Most land near nominal, fewer land near the edges, and the size of one part has nothing to do with the size of the next. The shape that describes "most in the middle, fewer at the edges" is the **[[bell curve|bell-curve]]**, also called the **normal distribution**. And "has nothing to do with" has a name too: the parts are **[[independent|independent]]** — knowing one part's error tells you nothing about another's.

When both of those are true, the errors do not add up in full. They add like the sides of a right triangle: you square each one, add the squares, and take the **square root** of the total (the number that, multiplied by itself, gives the total). That is the **root-sum-square** or **RSS** rule, named after its three steps read backwards: square, sum, root.

$$
T_{\mathrm{RSS}} = \sqrt{t_1^2 + t_2^2 + t_3^2 + \dots + t_n^2}.
$$

For the box, square each tolerance, add, and take the root:

$$
T_{\mathrm{RSS}} = \sqrt{0.10^2 + 0.05^2 + 0.08^2 + 0.06^2} = \sqrt{0.0100 + 0.0025 + 0.0064 + 0.0036} = \sqrt{0.0225} = 0.15\,\mathrm{mm}.
$$

So RSS says the gap will be $0.5 \pm 0.15\,\mathrm{mm}$ — about half the worst-case spread. The worst case can still happen. RSS just says it is rare. If each part's tolerance band covers its own maker's natural spread (engineers call that its **[[three-sigma|three-sigma]]** band), then about 997 assemblies in every 1,000 land inside the RSS number.

::: key Worst case versus root-sum-square
Worst case adds all tolerances assuming every part is at its extreme simultaneously: safe but often unbuildably tight, $T_{\mathrm{WC}} = \sum t_i$. RSS takes the square root of the sum of squares, $T_{\mathrm{RSS}} = \sqrt{\sum t_i^2}$, assuming independent, roughly normal variation: realistic for many parts, optimistic for few. Quote worst case for safety-critical interfaces.
:::

::: note Why the squares add
Call the error of part one $a$ and of part two $b$, each averaging zero. The **variance** of an error is the average of its square; it measures spread. The total error is $a + b$, and its square is

$$
(a + b)^2 = a^2 + 2ab + b^2 .
$$

Average both sides. The average of $a^2$ is the variance of $a$, and likewise for $b$. The middle term is the interesting one. If $a$ and $b$ are independent, a positive $a$ is as likely to meet a negative $b$ as a positive one, so the products $ab$ average out to zero. What is left is

$$
\text{variance of } (a+b) = \text{variance of } a + \text{variance of } b .
$$

Spreads measured as standard deviations are the square roots of variances, and a three-sigma tolerance is three standard deviations. So squares of tolerances add, and the stack's tolerance is the square root of that sum. The whole argument rests on the cross term vanishing. When parts are not independent, it does not vanish, and RSS is wrong.
:::

::: example A gap budget with both methods
A reaction-wheel housing has an inside depth of $62.0 \pm 0.12\,\mathrm{mm}$. Stacked inside along the same axis are a bearing spacer $8.0 \pm 0.03$, the wheel hub $45.0 \pm 0.05$ and a retaining ring $8.4 \pm 0.04\,\mathrm{mm}$. What gap is left, and what is its tolerance?

**Nominal gap.** Subtract the parts from the housing: $62.0 - 8.0 - 45.0 - 8.4 = 0.6\,\mathrm{mm}$.

**Worst case.** Add all four tolerances: $0.12 + 0.03 + 0.05 + 0.04 = 0.24\,\mathrm{mm}$. The gap is $0.6 \pm 0.24$, so it runs from $0.36$ to $0.84\,\mathrm{mm}$.

**RSS.** Square each: $0.0144$, $0.0009$, $0.0025$, $0.0016$. They add to $0.0194$. The square root is about $0.139\,\mathrm{mm}$. The gap is $0.6 \pm 0.14$, from $0.46$ to $0.74\,\mathrm{mm}$.

**Sanity check.** RSS came out smaller than worst case, as it always must, and bigger than the single largest tolerance ($0.12$), as it always must too. Notice that the housing's $0.12$ alone makes up most of the RSS answer. When one tolerance dominates, RSS is close to that one tolerance, and tightening the small ones buys almost nothing.
:::

## How much does RSS save?

If $n$ parts all have the same tolerance $t$, worst case gives $n\,t$ and RSS gives $\sqrt{n\,t^2} = \sqrt{n}\,t$. The ratio of RSS to worst case is $\sqrt{n}/n = 1/\sqrt{n}$:

| Parts in the chain | RSS as a fraction of worst case |
| --- | --- |
| 2 | 0.71 |
| 3 | 0.58 |
| 4 | 0.50 |
| 10 | 0.32 |
| 25 | 0.20 |

With many parts, RSS saves a lot. With two parts, it saves little, and — as the next section shows — that little is not even trustworthy.

You can watch RSS come true by building thousands of imaginary boxes on a computer. This is a **[[Monte Carlo|monte-carlo]]** simulation: pick random part sizes, add them, repeat, and count.

```python
import random

random.seed(1)
tols = [0.10, 0.05, 0.08, 0.06]   # the four +/- tolerances, mm
N = 200_000                       # build 200,000 boxes on the computer

stacks = []
for _ in range(N):
    # each part lands somewhere in its band: a bell curve with 3 sigma = tolerance
    stacks.append(sum(random.gauss(0.0, t / 3) for t in tols))

worst = max(abs(s) for s in stacks)
beyond = sum(abs(s) > 0.15 for s in stacks) / N * 100
print(round(worst, 3))    # the worst box of all 200,000
print(round(beyond, 2))   # percent of boxes beyond +/-0.15 mm
# 0.248
# 0.28
```

Out of 200,000 boxes, only about $0.28\%$ fell outside the RSS number of $\pm 0.15\,\mathrm{mm}$, and even the worst box of all ($0.248$) stayed inside the worst-case $0.29$. That is RSS doing exactly what it promises — when its assumptions hold.

## When to quote which

RSS rests on three assumptions: many contributors, each roughly bell-shaped, all independent. Each one can fail.

**Few contributors.** The bell shape of the total only appears when many errors are added. With two or three parts, the total keeps the shape of the parts. Suppose a supplier's parts are spread evenly across the whole band instead of bunching in the middle — this happens when a machinist sorts parts or when the process drifts. Two such parts at $\pm 0.1\,\mathrm{mm}$ each give an RSS of $\sqrt{2} \times 0.1 \approx 0.141\,\mathrm{mm}$. A quick calculation (and a simulation agrees) shows about $8.6\%$ of assemblies land outside that number, not the $0.3\%$ you were promised. That is roughly thirty times worse.

**Correlated tolerances.** Parts made on the same machine, from the same bar of metal, in the same batch, tend to err the same way. If the cutting tool wears, every part comes out a little fat. Now the cross term in the note above does not vanish, the errors line up, and the stack behaves like worst case. Two parts from one thermal treatment, or two holes drilled in one setup, are often correlated.

**Safety-critical interfaces.** Even if RSS is honest, it still admits that a small fraction of builds fall outside. For a lid on a box, that means a rework. For a pyrotechnic separation joint, a propellant valve seat or a load path that keeps people alive, "rare" is not acceptable. There you quote worst case, and you pay for the tighter parts.

::: key When to quote worst case
Quote worst case when the interface is safety-critical, when the number of contributors is small, or when the tolerances are not independent. RSS earns its extra margin only from many independent, roughly normal contributors.
:::

::: warning RSS is a bet, not a discount
People reach for RSS because the number is smaller and the drawings get easier. That is backwards. RSS is a bet that the factory behaves like the bell curve. If you quote RSS, write down why the bet is safe: how many contributors, why they are independent, and what happens to the few assemblies that fall outside. Some teams also multiply the RSS answer by a safety factor such as 1.5 to cover parts that are not centred in their bands.
:::

## From millimeters to angles

So far every error was a length. A GNC engineer usually cares about an angle: which way a sensor points, which way a thruster pushes. The bridge between the two is a thin triangle.

Put a sensor on two feet that are $80\,\mathrm{mm}$ apart. If one foot is $0.04\,\mathrm{mm}$ taller than the other, the sensor leans. The distance between the feet is the **baseline**, and the height difference is the **offset**. For small tilts, the **[[small-angle rule|small-angle]]** says

$$
\theta \approx \frac{\text{offset}}{\text{baseline}},
$$

where $\theta$ (the Greek letter "theta") comes out in **radians**. A radian is the angle at which the curved arc equals the radius. One radian is about $57.3^\circ$, and one degree splits into $3600$ **[[arcseconds|arcsecond]]**, tiny angle units that star trackers are measured in. So:

$$
\theta \approx \frac{0.04}{80} = 0.0005\,\mathrm{rad} \approx 0.0286^\circ \approx 103\,\mathrm{arcsec}.
$$

A good star tracker can measure direction to within a few arcseconds. Four hundredths of a millimeter — thinner than a sheet of paper — under one foot of its bracket makes an error around a hundred arcseconds. The mechanical tolerance, not the camera, sets how well the spacecraft knows where it points.

::: warning Keep the offset and baseline in the same units
$0.04\,\mathrm{mm}$ over $0.08\,\mathrm{m}$ is not $0.5$. Convert first: $80\,\mathrm{mm}$ and $0.04\,\mathrm{mm}$ give $0.0005$. And the small-angle rule gives radians, never degrees. Multiply by $57.3$ to get degrees, then by $3600$ for arcseconds.
:::

::: example Tilt of a star tracker through four parts
A star tracker's line of sight, its **boresight**, passes through four stacked mounting parts. Each part's drawing allows a small tilt: the structure panel $\pm 30$, the bracket base $\pm 20$, the bracket arm $\pm 40$ and the tracker's own mounting face $\pm 10$ arcseconds.

**Worst case.** Add them: $30 + 20 + 40 + 10 = 100\,\mathrm{arcsec}$.

**RSS.** Square: $900$, $400$, $1600$, $100$. Sum: $3000$. Root: $\sqrt{3000} \approx 54.8\,\mathrm{arcsec}$.

**Which to quote.** Four contributors is few, and the bracket base and arm are machined from one block in one setup, so their errors are likely correlated. A careful engineer would not trust the RSS number here. She would carry about $100\,\mathrm{arcsec}$ into the attitude error budget — or, better, ask for the tracker's real alignment to be measured after assembly.

**Sanity check.** $100\,\mathrm{arcsec}$ is about $0.028^\circ$, close to the single-foot example above. Small numbers, but dozens of times a good tracker's own error.
:::

## Why a GNC engineer cares

Every error in this lesson ends up in a GNC **[[error budget|error-budget]]** — the table that lists every source of pointing or knowledge error and adds them up against a requirement. Mechanical alignment feeds it in two very different ways.

### Knowledge error: the lie no filter can see

The spacecraft's navigation software, its **filter**, blends sensor readings into a best estimate of attitude (which way the body points). It assumes it knows how the star tracker sits on the body. If the tracker is really tilted $100\,\mathrm{arcsec}$ from where the drawing says, every tracker reading is off by that same fixed amount. The filter has nothing to compare against that would reveal it: the tracker is its most accurate sensor. So the filter reports the wrong attitude, confidently, forever. This is **attitude-knowledge error** — the gap between where the spacecraft thinks it points and where it really points.

This is why teams measure alignments on the ground with optical instruments after assembly, and why a camera or antenna mounted elsewhere on the body must have its own alignment known relative to the tracker.

### Control error: torques you did not ask for

A thruster is meant to push straight through the **center of mass**, the balance point of the spacecraft. Tilt it slightly and part of its push goes sideways, around the balance point. That sideways push, times the distance to the balance point, is a **disturbance torque** — a twist the control system never commanded and now has to fight. Some of the thruster's effort is also wasted, which is a loss of **control authority**.

::: example Torque from a tilted main engine
A spacecraft's main engine makes $440\,\mathrm{N}$ of thrust. It sits $1.5\,\mathrm{m}$ from the center of mass, and the stack-up allows its line of thrust to tilt $0.25^\circ$.

**Sideways force.** The part of the thrust that goes sideways is $F \sin\theta$. With a calculator, $\sin 0.25^\circ \approx 0.00436$, so the side force is $440 \times 0.00436 \approx 1.92\,\mathrm{N}$.

**Torque.** Force times lever arm: $1.92 \times 1.5 \approx 2.88\,\mathrm{N\,m}$.

**Sanity check.** A small reaction wheel can typically push back with only a fraction of a newton-meter. Nearly $3\,\mathrm{N\,m}$ is far beyond that, which is why spacecraft usually hold attitude during a main-engine burn with thrusters, and why engine alignment is a tightly controlled dimension on the drawing.
:::

A **gimbal** — a pivot that swings an engine to steer — has the same problem: if its zero position is off, the controller starts every burn fighting a torque. A **reaction wheel** — a spinning flywheel the spacecraft turns against to rotate itself — mounted with a tilt of $0.5^\circ$ puts about $0.0087$ of its torque (that is $\sin 0.5^\circ$) onto the wrong axis. Command $0.1\,\mathrm{N\,m}$ about one axis, and about $0.00087\,\mathrm{N\,m}$ leaks onto another. That leak is **cross-coupling**: moving one axis disturbs another. The controller's model of which wheel pushes which axis, and of how the wheels' spin adds to the body's resistance to turning (its **effective inertia**), is now slightly wrong.

::: key Why a GNC engineer cares about tolerance stack-up
It sets alignment error budgets: thruster and gimbal misalignment becomes a disturbance torque and a control-authority loss, and star-tracker to body misalignment becomes attitude-knowledge error that no filter can remove. Reaction-wheel misalignment turns wheel torque into an off-axis disturbance and changes the effective inertia matrix the controller uses.
:::

::: warning Control errors can be fought; knowledge errors cannot
A disturbance torque shows up in the motion, so a feedback loop sees it and pushes back. A knowledge error does not show up anywhere the software can see. Do not assume a clever filter will clean up a mounting error. For knowledge, the only fixes are tighter tolerances, measuring the real alignment, or calibrating against a second, independent reference.
:::

## Check yourself

::: check
Five spacers sit end to end, with tolerances $\pm 0.02$, $\pm 0.02$, $\pm 0.03$, $\pm 0.04$ and $\pm 0.06\,\mathrm{mm}$. Find the worst-case and RSS stack-ups.
:::

::: answer
Worst case adds them: $0.02 + 0.02 + 0.03 + 0.04 + 0.06 = 0.17\,\mathrm{mm}$. RSS squares them: $0.0004 + 0.0004 + 0.0009 + 0.0016 + 0.0036 = 0.0069$, and $\sqrt{0.0069} \approx 0.083\,\mathrm{mm}$. RSS is about half of worst case, and it is bigger than the largest single tolerance ($0.06$), as it must be.
:::

::: check
A bracket's two mounting pads are $120\,\mathrm{mm}$ apart. One pad may sit $0.03\,\mathrm{mm}$ higher than the other. What tilt, in radians and arcseconds, can that cause?
:::

::: answer
Small angle: $\theta \approx 0.03 / 120 = 0.00025\,\mathrm{rad}$. In degrees, $0.00025 \times 57.3 \approx 0.0143^\circ$. In arcseconds, multiply the unrounded degrees by $3600$ to get about $51.6\,\mathrm{arcsec}$ (with the rounded $0.0143$ you would get $51.5$, close enough). The wider the baseline, the smaller the tilt from the same offset — which is why sensor feet are spread apart.
:::

::: check
Two parts come from one lathe, cut one after the other with the same tool. Why is RSS a poor choice for their stack-up?
:::

::: answer
RSS needs the parts' errors to be independent, so that a fat part is as likely to meet a thin one as a fat one. Parts from the same tool in the same run tend to err the same way (a worn tool makes both fat). Their errors are correlated, the cross terms do not average out, and they add nearly in full. Also, two parts is too few for the bell-curve shape to appear. Use worst case.
:::

::: check
A star tracker is mounted $80\,\mathrm{arcsec}$ away from where the flight software believes. Explain why the navigation filter cannot fix this, and name two things that can.
:::

::: answer
The filter trusts the tracker as its best attitude sensor. A fixed mounting tilt shifts every reading by the same amount, so there is no inconsistency for the filter to notice; it reports an attitude $80\,\mathrm{arcsec}$ wrong. This is attitude-knowledge error. It can be reduced by tightening the tolerances in the mounting stack, by measuring the tracker's real alignment after assembly and loading that into the software, or by calibrating against a second independent reference.
:::

::: check
A thruster making $22\,\mathrm{N}$ is tilted $0.5^\circ$ and sits $0.8\,\mathrm{m}$ from the center of mass. What disturbance torque does the tilt create? ($\sin 0.5^\circ \approx 0.00873$.)
:::

::: answer
Side force: $22 \times 0.00873 \approx 0.192\,\mathrm{N}$. Torque: $0.192 \times 0.8 \approx 0.154\,\mathrm{N\,m}$. The controller must supply that much counter-torque, every second the thruster fires, just to stand still.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Stack-up | How part tolerances add along a chain | Nominals add as usual |
| Worst case | Every part at its extreme at once | $T_{\mathrm{WC}} = \sum t_i$; a guarantee |
| RSS | Independent, bell-shaped errors partly cancel | $T_{\mathrm{RSS}} = \sqrt{\sum t_i^2}$ |
| RSS saving | Equal tolerances, $n$ parts | RSS / worst case $= 1/\sqrt{n}$ |
| Quote worst case | Safety-critical, few parts, or correlated | RSS is optimistic there |
| Small angle | Tilt from a height offset | $\theta \approx$ offset / baseline, in radians |
| Knowledge error | Tracker to body misalignment | No filter can remove it |
| Control error | Thruster, gimbal or wheel misalignment | Disturbance torque, cross-coupling |

Next lesson leaves numbers for symbols: surface finish marks, weld symbols and the callouts that tell a supplier exactly which thread, fastener and material to use.

::: context stack-up-word A chain of parts with a loop
Engineers draw a stack-up as a **loop**: start at one surface, walk across each part in turn, and end at the surface you care about. Each step is an arrow with a size and a tolerance. Arrows going one way count plus; arrows coming back count minus.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="320" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="24" y="40" width="90" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="114" y="40" width="120" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="234" y="40" width="88" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="69" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">15.0</text>
  <text x="174" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">20.0</text>
  <text x="278" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">14.5</text>
  <text x="330" y="64" font-size="11" text-anchor="middle" fill="#b4232c">gap</text>
  <line x1="24" y1="110" x2="336" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="336,110 326,105 326,115" fill="#1f2a44"/>
  <text x="180" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">box inside 50.0 ± 0.10</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">gap = box − parts = 0.5 nominal</text>
</svg>
```

The drawing is not to scale: the gap is enlarged so you can see it.
:::

::: context bell-curve The shape of a factory
Measure a thousand parts and draw how many landed at each size. Most pile up near nominal and fewer sit near the edges. The pile has a bell shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30,119 C90,119 120,20 180,20 C240,20 270,119 330,119" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="20" x2="180" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="45" y1="30" x2="45" y2="120" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="315" y1="30" x2="315" y2="120" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">nominal</text>
  <text x="45" y="138" font-size="12" text-anchor="middle" fill="#b4232c">−t</text>
  <text x="315" y="138" font-size="12" text-anchor="middle" fill="#b4232c">+t</text>
</svg>
```

It appears in nature whenever many small, unrelated causes add up: a little tool vibration, a little heat, a little material variation. That is also why the total of many parts is bell-shaped even when the parts are not quite.
:::

::: context independent What independent means
Two things are **independent** when knowing one tells you nothing about the other. Two dice are independent: a six on the first does not make a six on the second more likely. Two parts cut by different machinists in different shops are close to independent. Two holes drilled in one setup by one worn drill are not: if one is oversize, the other probably is too. RSS needs the dice kind.
:::

::: context three-sigma What three sigma means
The Greek letter $\sigma$ ("sigma") is the **standard deviation**, a measure of how spread out a bell curve is. About 68 in 100 parts land within one sigma of the middle, and about 997 in 1,000 land within three sigma. Factories often set a tolerance so that it matches three sigma of their process. Then the RSS of three-sigma tolerances is itself a three-sigma band for the stack.
:::

::: context monte-carlo Why it is called Monte Carlo
Monte Carlo is a city in Monaco famous for its casino. Scientists working on early computers in the 1940s borrowed the name for methods that answer a question by rolling dice many times, since the answer comes from chance. Stack-up engineers use the same idea today, often with the real measured shape of each supplier's parts instead of a perfect bell curve.
:::

::: context small-angle A thin triangle
Lay the sensor as the long side of a thin right triangle. The baseline is the long side, the offset is the short one, and the tilt is the small angle between.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="320" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="100" x2="320" y2="50" stroke="#b4232c" stroke-width="2"/>
  <line x1="30" y1="100" x2="320" y2="50" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M90,100 A60,60 0 0,0 89.1,89.8" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="94" font-size="12" fill="#1f2a44">θ</text>
  <text x="175" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">baseline</text>
  <text x="328" y="80" font-size="12" fill="#b4232c">offset</text>
  <text x="160" y="62" font-size="12" text-anchor="middle" fill="#1d6fd1">sensor</text>
</svg>
```

The offset is drawn huge. When the angle is truly small, the tangent, the sine and the angle in radians are almost the same number, so offset over baseline is the angle.
:::

::: context arcsecond How small an arcsecond is
One arcsecond is $1/3600$ of a degree, about $4.85 \times 10^{-6}$ radians. A coin about $25\,\mathrm{mm}$ across, seen from roughly $5\,\mathrm{km}$ away, fills about one arcsecond. Star trackers, telescopes and laser links talk in arcseconds because degrees are far too coarse for them.
:::

::: context error-budget A shopping list for error
An error budget works like a household budget. The requirement is the income: "pointing known to within, say, 20 arcseconds". Each error source is an expense: sensor noise, mounting tilt, thermal bending, timing. The GNC engineer adds the expenses — often by RSS for independent random terms and in full for fixed biases — and checks there is money left over. In the GD&T module you will turn one line of such a budget into a tolerance on a drawing.
:::
