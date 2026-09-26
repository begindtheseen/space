---
id: l12-speed-rates-and-averages
title: Speed, rates and averages
minutes: 20
covers:
  - speed, rates and averages
---

A car's speedometer says $90\,\mathrm{km/h}$. A gas pump shows dollars per gallon. A recipe says roast the meat for $20$ minutes per kilogram. Every one of these is a **rate**: how much of one thing goes with each single unit of another. The little word that gives a rate away is **per**.

Rockets run on rates. A satellite in low orbit moves at about $7.7$ kilometres *per second*. A first-stage engine gulps hundreds of kilograms of propellant *per second*. Gravity adds about $9.8$ metres per second to a falling object's speed, every second. And when a navigation computer gets five slightly different readings from a sensor, it has to decide on one number — usually by taking an **average**.

This is the last lesson of Basecamp. It pulls together what came before — formulas, rearranging, units, circles — and uses them on the three questions a flight engineer asks about anything that changes: how fast, how much per second, and what is the typical value.

## Speed: distance per time

A sprinter runs $100\,\mathrm{m}$ in $12.5\,\mathrm{s}$. How fast is that? Share the distance out over the seconds: $100 \div 12.5 = 8$. Each second, on average, the runner covers $8$ metres. We say the speed is $8$ **metres per second**, written $8\,\mathrm{m/s}$.

**Speed** is the distance travelled divided by the time it took. With $d$ for distance, $t$ for time and $v$ for speed (from "velocity"):

$$
v = \frac{d}{t}.
$$

The units divide the same way the numbers do. Metres divided by seconds gives metres per second. The slash in $\mathrm{m/s}$ is a fraction bar, and "per" [[means divide|per-means-divide]].

### Three ways to write one rule

Multiply both sides of $v = d/t$ by $t$, and the $t$ on the bottom cancels: $v \times t = d$. Now divide both sides of that by $v$: $t = d/v$. It is one relationship written three ways:

$$
d = v \times t, \qquad v = \frac{d}{t}, \qquad t = \frac{d}{v}.
$$

Use whichever one has the thing you want on the left. A [[memory triangle|formula-triangle]] helps some people keep them straight.

::: key Distance, speed and time
distance = speed × time ($d = v \cdot t$), so $v = d/t$ and $t = d/v$. Keep the units matched: m and s give m/s.
:::

::: example How long is one orbit?
The Space Station orbits about $400\,\mathrm{km}$ up, which puts it about $6771\,\mathrm{km}$ from Earth's center. It moves at about $7.67\,\mathrm{km/s}$. How long does one lap take?

**Distance.** One lap is the circumference of a circle with radius $6771\,\mathrm{km}$: $C = 2\pi r = 2 \times \pi \times 6771 \approx 42\,540\,\mathrm{km}$.

**Pick the right form.** We want time, so use $t = d/v$.

**Divide.** $t = 42\,540 \div 7.67 \approx 5547\,\mathrm{s}$.

**Check the units.** Kilometres divided by kilometres per second: the kilometres cancel and seconds are left, as a time should be.

**Convert to minutes.** $5547 \div 60 \approx 92.4\,\mathrm{min}$ — about an hour and a half, which matches the roughly $92$-minute orbit from the last lesson.
:::

### Changing speed units

Cars use kilometres per hour; engineers use metres per second. To switch, convert the top and the bottom separately. One kilometre per hour is $1000\,\mathrm{m}$ in $3600\,\mathrm{s}$:

$$
1\,\mathrm{km/h} = \frac{1000\,\mathrm{m}}{3600\,\mathrm{s}} = \frac{1}{3.6}\,\mathrm{m/s}.
$$

So divide by $3.6$ to go from km/h to m/s, and multiply by $3.6$ to go back. A car at $90\,\mathrm{km/h}$ is doing $90 \div 3.6 = 25\,\mathrm{m/s}$. Sound in air travels about $343\,\mathrm{m/s}$, or $343 \times 3.6 \approx 1235\,\mathrm{km/h}$ — a speed engineers call [[Mach 1|mach]].

And orbit? $7.7\,\mathrm{km/s}$ is $7700\,\mathrm{m/s}$. An hour has $3600$ seconds, so in an hour the station covers $7.7 \times 3600 = 27\,720\,\mathrm{km}$. That is $27\,720\,\mathrm{km/h}$.

::: warning Match the units before you multiply
$d = v \times t$ only works if the units agree. With $v$ in kilometres per *second*, $t$ must be in seconds. Put in minutes or hours and the answer is wrong by a factor of $60$ or $3600$. If a speed is in km/h and a time is in seconds, convert one of them first. Write the units next to every number, and check they cancel to the unit you expect.
:::

## Rates: "per" anything

Speed is only one kind of rate. A **unit rate** is how much of something goes with *one* unit of something else: one second, one kilogram, one litre. You always find it the same way — divide the amount by how many units it was spread over.

### Rates of flow

Fill a $10\,\mathrm{L}$ bucket from a garden hose and time it: $20\,\mathrm{s}$. The hose delivers $10 \div 20 = 0.5\,\mathrm{L}$ per second. That is a **flow rate**, $0.5\,\mathrm{L/s}$. It works exactly like speed: amount = rate × time, so a $12\,\mathrm{L}$ bucket takes $12 \div 0.5 = 24\,\mathrm{s}$.

A rocket engine is a very, very fast hose running backwards. Engineers measure its flow by mass, in kilograms per second. That is the **mass flow rate**, written $\dot{m}$ and read "[[m dot|m-dot]]". The Falcon 9 first stage burns about $411\,000\,\mathrm{kg}$ of propellant in about $162\,\mathrm{s}$. Its mass flow rate is

$$
\dot{m} = \frac{411\,000\,\mathrm{kg}}{162\,\mathrm{s}} \approx 2540\,\mathrm{kg/s}.
$$

Two and a half tonnes every second. Split among its nine engines, that is about $2540 \div 9 \approx 282\,\mathrm{kg/s}$ each.

The same three-way rule holds, with mass in place of distance: mass used $= \dot{m} \times t$, and **burn time** $t = m / \dot{m}$.

::: example Burn time of an upper stage
An upper stage has one engine that burns $300\,\mathrm{kg/s}$, and carries $90\,000\,\mathrm{kg}$ of propellant. How long can the engine run?

**Pick the form.** We want time: $t = m / \dot{m}$.

**Divide.** $t = 90\,000 \div 300 = 300\,\mathrm{s}$.

**Check the units.** Kilograms divided by kilograms per second leaves seconds.

**In minutes.** $300 \div 60 = 5\,\mathrm{min}$.

**Sanity check.** At $300\,\mathrm{kg}$ every second, one minute uses $18\,000\,\mathrm{kg}$. Five minutes uses $90\,000\,\mathrm{kg}$. It matches.
:::

### Per kilogram

Rates are also how engineers compare costs and designs fairly. Suppose a launch costs $\$60$ million and can carry $15\,000\,\mathrm{kg}$ to orbit. The cost per kilogram is $\$60\,000\,000 \div 15\,000 = \$4000$ per kilogram. Now a $2\,\mathrm{kg}$ camera costs $\$8000$ to launch, and you can compare this rocket with any other, whatever its size.

### A rate of a rate

Drop a stone. After one second it is falling at about $9.8\,\mathrm{m/s}$; after two, about $19.6\,\mathrm{m/s}$; after ten, about $98\,\mathrm{m/s}$ (if there were no air to slow it). Its speed grows by the same amount every second. That growth is a rate of change of speed, called **acceleration**. Its unit is metres per second, per second — written $\mathrm{m/s^2}$. The pull of Earth's gravity is [[standardized|standard-gravity]] as $9.80665\,\mathrm{m/s^2}$.

A change in speed gets its own symbol, $\Delta v$, read "delta v". The Greek letter $\Delta$ means "change in", and it is always the final value minus the starting value. A stone that goes from $0$ to $98\,\mathrm{m/s}$ has $\Delta v = 98 - 0 = 98\,\mathrm{m/s}$. You will hear "delta v" constantly: it is how mission planners measure the size of every rocket burn.

## Average speed and instantaneous speed

On a long car trip, the speedometer needle moves all the time: $0$ at a red light, $100\,\mathrm{km/h}$ on the highway. The reading at any one moment is the **instantaneous speed** — the speed right now.

The **average speed** for the whole trip is the total distance divided by the total time:

$$
\text{average speed} = \frac{\text{total distance}}{\text{total time}}.
$$

Drive $150\,\mathrm{km}$ in $1.5$ hours and your average speed is $150 \div 1.5 = 100\,\mathrm{km/h}$, even if you spent some of that time stopped and some going faster.

::: warning Don't average the speeds
You drive $60\,\mathrm{km}$ at $60\,\mathrm{km/h}$, then another $60\,\mathrm{km}$ at $30\,\mathrm{km/h}$ in traffic. The average speed is **not** $(60 + 30) \div 2 = 45\,\mathrm{km/h}$.

Work out the times. The first part takes $60 \div 60 = 1\,\mathrm{h}$. The second takes $60 \div 30 = 2\,\mathrm{h}$. Total: $120\,\mathrm{km}$ in $3\,\mathrm{h}$, so the average is $120 \div 3 = 40\,\mathrm{km/h}$. You spent *longer* at the slow speed, so it counts for more. Always go back to total distance over total time.
:::

When something speeds up **steadily** — gaining the same speed every second — there is a shortcut. The average speed is exactly halfway between the starting and final speeds. A rocket that went from $0$ to $2000\,\mathrm{m/s}$ at a perfectly steady rate over $160\,\mathrm{s}$ would average $(0 + 2000) \div 2 = 1000\,\mathrm{m/s}$, and so travel $1000 \times 160 = 160\,000\,\mathrm{m}$, or $160\,\mathrm{km}$. The [[speed–time graph|speed-time-graph]] makes this easy to see.

Real rockets do not speed up steadily. As they burn propellant they get lighter, so the same push speeds them up [[more and more each second|lighter-faster]]. For them the halfway shortcut is wrong, and finding the distance from a changing speed takes the calculus module's tools. The rule "total distance over total time" is never wrong.

## The mean, median and range

Measure the same thing five times and you will rarely get five identical numbers. A temperature sensor in a propellant tank might read, over five seconds:

$$
21.4, \quad 21.9, \quad 22.1, \quad 21.6, \quad 22.0 \ (^\circ\mathrm{C}).
$$

Which one is "the" temperature? None of them exactly. Three simple numbers describe a set like this.

The **mean** — what most people call the average — is the sum divided by how many numbers there are. It is the value each reading would have if they were all shared out equally. Here the sum is $21.4 + 21.9 + 22.1 + 21.6 + 22.0 = 109.0$, and there are $5$ readings, so the mean is $109.0 \div 5 = 21.8\,^\circ\mathrm{C}$.

The **median** is the middle value once the numbers are put in order. In order: $21.4, 21.6, 21.9, 22.0, 22.1$. The middle one (the third of five) is $21.9\,^\circ\mathrm{C}$. If there is an even count, there is no single middle, so take the mean of the two middle numbers: the median of $12, 15, 17, 20$ is $(15 + 17) \div 2 = 16$.

The **range** is the largest value minus the smallest. Here $22.1 - 21.4 = 0.7\,^\circ\mathrm{C}$. The range tells you how spread out the readings are, which the mean and median do not.

::: key The mean (average)
To find the mean of a list of numbers, add them all up and divide by how many there are. The mean of 4, 8 and 9 is 21 ÷ 3 = 7. The median is the middle value when the list is in order; the range is largest minus smallest.
:::

::: note Why the mean is a "sharing out"
Picture the readings as stacks of blocks of different heights. The mean is the height every stack would have if you moved blocks from the tall stacks to the short ones until they were all level. Nothing is added or taken away — the total stays the same — so the level height is the total divided by the number of stacks. That is also why the mean always lies somewhere between the smallest and the largest value. If yours does not, there is an arithmetic slip.
:::

## Reading a table of measurements

Engineers get most of their numbers in tables. Here is one from the first $40$ seconds of a test rocket's flight:

| Time (s) | 0 | 10 | 20 | 30 | 40 |
| --- | --- | --- | --- | --- | --- |
| Height (m) | 0 | 450 | 1800 | 4000 | 7100 |

The table does not list speed. But speed is distance over time, so you can find the average speed over each stretch between rows.

::: example Speeds from a table
Find the average speed in each $10\,\mathrm{s}$ stretch, and over the whole $40\,\mathrm{s}$.

**0 to 10 s.** Height gained: $450 - 0 = 450\,\mathrm{m}$. Average speed: $450 \div 10 = 45\,\mathrm{m/s}$.

**10 to 20 s.** $1800 - 450 = 1350\,\mathrm{m}$, so $1350 \div 10 = 135\,\mathrm{m/s}$.

**20 to 30 s.** $4000 - 1800 = 2200\,\mathrm{m}$, so $220\,\mathrm{m/s}$.

**30 to 40 s.** $7100 - 4000 = 3100\,\mathrm{m}$, so $310\,\mathrm{m/s}$.

**Whole flight.** Total height over total time: $7100 \div 40 = 177.5\,\mathrm{m/s}$.

**What the table says.** The speed grows in every stretch, so the rocket is speeding up the whole time. And it grows by about the same amount each time (by $90$, then $85$, then $90\,\mathrm{m/s}$), so the rocket is speeding up roughly steadily. Notice that the mean of the four stretch speeds, $(45 + 135 + 220 + 310) \div 4 = 177.5$, matches the whole-flight average. That works here only because every stretch is the same length of *time*.
:::

::: warning Always subtract before you divide
A table gives *positions*, not distances travelled. The distance in a stretch is the later reading minus the earlier one. Dividing $1800$ by $20$ gives $90\,\mathrm{m/s}$ — that is the average from the start, not the speed between $10$ and $20\,\mathrm{s}$.
:::

## When an average misleads

An average squeezes a whole list into one number. That is useful, but three things can make that one number misleading.

**One wild value.** Suppose the temperature sensor glitches and adds a sixth reading of $99.9\,^\circ\mathrm{C}$. The mean jumps to $(109.0 + 99.9) \div 6 \approx 34.8\,^\circ\mathrm{C}$ — hotter than *every* real reading. The median of the six is the mean of the two middle values, $21.9$ and $22.0$, which is $21.95\,^\circ\mathrm{C}$ — hardly moved. A value far from the rest is called an **[[outlier|outlier]]**. The median resists outliers; the mean does not. That is why flight software often takes the median of three sensors rather than their mean.

**Same mean, different spread.** Two engines each do four test burns. Engine A: $160, 160, 161, 159\,\mathrm{s}$. Engine B: $150, 170, 145, 175\,\mathrm{s}$. Both have a mean of $640 \div 4 = 160\,\mathrm{s}$. But A's range is $161 - 159 = 2\,\mathrm{s}$, and B's is $175 - 145 = 30\,\mathrm{s}$. You can plan a mission around engine A. Engine B might cut out $15\,\mathrm{s}$ early. The mean alone would never tell you. Always report the spread too — a mean on its own [[can hide danger|river-depth]].

**Averaging the wrong things.** As the car trip showed, averaging speeds over equal *distances* gives the wrong answer. Averages are safe when every value counts equally. When some values cover more time, or more kilograms, go back to totals: total distance over total time, total mass over total volume.

::: note Where this comes back
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) finds the same $2540\,\mathrm{kg/s}$ unit rate and uses proportion to scale any burn.
- [Units, conversions and dimensional analysis](#/module/t0_m01_algebra_precalc?lesson=l10-units-and-dimensional-analysis) checks a burn-time formula with units, and links thrust to mass flow rate with $F = \dot{m} v_e$.
- [The derivative from first principles](#/module/t0_m06_calculus_single?lesson=l02-the-derivative) makes "instantaneous speed" exact, as the average speed over a shorter and shorter stretch of time.
- [Expectation, variance and moments](#/module/t0_m09_probability_stats?lesson=l03-expectation-variance-moments) turns the mean and the spread of sensor readings into the numbers a navigation filter lives on.
:::

## Check yourself

::: check
A train covers $5\,\mathrm{km}$ in $4$ minutes at a steady speed. What is its speed in metres per second, and in kilometres per hour?
:::

::: answer
Put everything in metres and seconds first: $5\,\mathrm{km} = 5000\,\mathrm{m}$ and $4\,\mathrm{min} = 240\,\mathrm{s}$.

$v = d/t = 5000 \div 240 \approx 20.8\,\mathrm{m/s}$.

In km/h, multiply by $3.6$: $20.8 \times 3.6 = 75\,\mathrm{km/h}$. (Check another way: $5\,\mathrm{km}$ in $4$ minutes is $5 \times 15 = 75\,\mathrm{km}$ in $60$ minutes.)
:::

::: check
Radio signals travel at about $300\,000\,\mathrm{km/s}$. The Moon is about $384\,000\,\mathrm{km}$ away. How long does a radio message take to reach it?
:::

::: answer
We want time, so $t = d/v = 384\,000 \div 300\,000 = 1.28\,\mathrm{s}$.

Units: kilometres over kilometres per second leaves seconds. That is why the Apollo astronauts' replies had a pause of more than two and a half seconds — the question takes $1.28\,\mathrm{s}$ to get there and the answer $1.28\,\mathrm{s}$ to come back.
:::

::: check
An engine burns $280\,\mathrm{kg}$ of propellant per second for $3$ minutes. How much propellant does it use?
:::

::: answer
Match the units: $3\,\mathrm{min} = 3 \times 60 = 180\,\mathrm{s}$.

Mass used $= \dot{m} \times t = 280 \times 180 = 50\,400\,\mathrm{kg}$, about $50\,\mathrm{t}$.

If you had multiplied by $3$ instead of $180$, you would get $840\,\mathrm{kg}$ — far too little for three minutes of a big engine.
:::

::: check
A drone flies $3\,\mathrm{km}$ out against the wind at $30\,\mathrm{km/h}$, then $3\,\mathrm{km}$ back with the wind at $60\,\mathrm{km/h}$. What is its average speed for the round trip?
:::

::: answer
Times first. Out: $3 \div 30 = 0.1\,\mathrm{h}$. Back: $3 \div 60 = 0.05\,\mathrm{h}$. Total time $0.15\,\mathrm{h}$.

Total distance $6\,\mathrm{km}$. Average speed $= 6 \div 0.15 = 40\,\mathrm{km/h}$.

Not $45$: the drone spent twice as long on the slow leg, so the slow speed counts for more.
:::

::: check
Find the mean, median and range of $3, 5, 5, 6, 8, 9, 13$. Then suppose the $13$ was a typing error for $130$. Which of the three change, and by how much?
:::

::: answer
Sum: $3 + 5 + 5 + 6 + 8 + 9 + 13 = 49$. Mean: $49 \div 7 = 7$.

The list is already in order, and the middle (fourth of seven) is $6$, so the median is $6$. Range: $13 - 3 = 10$.

With $130$: the sum becomes $49 - 13 + 130 = 166$, so the mean is $166 \div 7 \approx 23.7$ — more than three times bigger. The median is still the fourth value, $6$. The range becomes $130 - 3 = 127$. One bad value wrecked the mean and the range but left the median alone.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Speed | $v = d/t$; also $d = v \cdot t$ and $t = d/v$; units must match |
| Speed units | $1\,\mathrm{km/h} = \tfrac{1}{3.6}\,\mathrm{m/s}$: divide km/h by 3.6 to get m/s |
| Unit rate | amount ÷ number of units, e.g. L/s, kg/s, dollars per kg |
| Mass flow rate | $\dot{m}$ in kg/s; mass used $= \dot{m} \cdot t$; burn time $t = m/\dot{m}$ |
| Acceleration | change of speed per second, in $\mathrm{m/s^2}$; $\Delta v$ = final − initial |
| Average speed | total distance ÷ total time — not the mean of the speeds |
| Mean | add them all up, divide by how many |
| Median | middle value in order (mean of the two middle ones for an even count) |
| Range | largest − smallest: how spread out the data are |
| Misleading averages | outliers pull the mean; the mean hides spread; average totals, not rates |

That is the end of Basecamp. You now have the arithmetic, geometry and measuring the rest of the course takes for granted. Next comes Algebra & Precalculus, which starts with signed numbers, fractions and ratios — and the first real rocket idea, the mass ratio of a stage.

::: context per-means-divide The little word "per"
"Per" comes from Latin, where it means "through" or "for each". Whenever you see it, you can swap in "divided by" or "for each one". So $8\,\mathrm{m/s}$ is "8 metres for each second", $\$4000$ per kilogram is "$\$4000$ for each kilogram", and "per cent" is "for each hundred". Reading a unit out loud this way often tells you which numbers to divide.
:::

::: context formula-triangle The distance–speed–time triangle
Put $d$ on top, $v$ and $t$ side by side underneath. Cover the one you want with a finger. What is left tells you what to do: two side by side means multiply, one above the other means divide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="100,20 20,170 180,170" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="57.3" y1="100" x2="142.7" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="100" y1="100" x2="100" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="20" font-weight="700" text-anchor="middle" fill="#1f2a44">
    <text x="100" y="82">d</text><text x="72" y="148">v</text><text x="128" y="148">t</text>
  </g>
  <g font-size="13" fill="#1f2a44">
    <text x="205" y="70">cover d:  d = v × t</text>
    <text x="205" y="100">cover v:  v = d ÷ t</text>
    <text x="205" y="130">cover t:  t = d ÷ v</text>
  </g>
</svg>
```

The triangle is a memory aid, not a reason. The reason is that all three come from one rule by rearranging, as the lesson showed.
:::

::: context mach Mach numbers
Engineers often give speeds as multiples of the speed of sound, called the **Mach number** after the Austrian scientist Ernst Mach. Mach 1 is the speed of sound, Mach 2 is twice it. The speed of sound itself changes with the air's temperature — about $343\,\mathrm{m/s}$ in warm air at ground level, less in the cold air higher up. Orbital speed, $7700\,\mathrm{m/s}$, is more than $22$ times the ground-level speed of sound.
:::

::: context m-dot Why a dot means "per second"
Isaac Newton wrote a dot over a letter to mean "how fast this is changing". So $\dot{m}$, "m dot", is how fast the mass is changing — kilograms per second. The notation stuck, especially in physics and engineering. In the calculus module you will see the same dot on position, $\dot{x}$, which is speed, and two dots, $\ddot{x}$, which is acceleration.
:::

::: context standard-gravity A defined number for gravity
Gravity is not exactly the same everywhere on Earth. It is about $9.78\,\mathrm{m/s^2}$ at the equator and $9.83\,\mathrm{m/s^2}$ at the poles, because Earth spins and bulges at the middle. To stop everyone using slightly different numbers, scientists agreed in 1901 on a standard value, $g_0 = 9.80665\,\mathrm{m/s^2}$, read "g nought". It is exact by definition, and it appears in the rocket formulas later in the course.
:::

::: context speed-time-graph Distance is the area under the graph
Plot speed going up and time going across. A steady speed-up is a straight sloping line. The distance travelled is the area of the shaded triangle underneath: $\tfrac{1}{2} \times 160\,\mathrm{s} \times 2000\,\mathrm{m/s} = 160\,000\,\mathrm{m}$ — the same as average speed times time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <polygon points="60,170 340,170 340,30" fill="#8fb8f0"/>
  <line x1="60" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="170" x2="60" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="170" x2="340" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="60" y1="100" x2="340" y2="100" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="174">0</text><text x="54" y="104">1000</text><text x="54" y="34">2000</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="186">0</text><text x="200" y="186">80</text><text x="340" y="186">160</text>
  </g>
  <text x="200" y="203" font-size="12" text-anchor="middle" fill="#1f2a44">time (s)</text>
  <text x="14" y="16" font-size="12" fill="#1f2a44">speed (m/s)</text>
  <text x="120" y="94" font-size="12" fill="#b4232c">average 1000 m/s</text>
  <text x="270" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">area = distance</text>
</svg>
```

The dashed line at the average speed cuts the triangle so that the corner above it exactly fills the gap below it.
:::

::: context lighter-faster Why rockets speed up faster and faster
Push a full shopping cart and an empty one equally hard: the empty one speeds up more. A rocket's engines push with roughly the same force all the way up, but the rocket is losing more than two tonnes of propellant every second. So each second the same push is shoving less mass, and the rocket gains more speed than it did the second before. Near the end of a stage's burn it can be speeding up several times faster than at lift-off.
:::

::: context outlier Wild readings in flight software
Sensors fail in odd ways — a loose wire, a flipped bit, a burst of electrical noise — and a single reading can come out absurd. Flight software guards against this. One common trick is to carry three identical sensors and, at each moment, use the middle one of the three readings, which is their median. If one sensor goes wild in either direction, it ends up as the highest or lowest and is ignored. Aircraft flight-control systems call this "mid-value select".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="335" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="88">20</text><text x="105" y="88">40</text><text x="180" y="88">60</text><text x="255" y="88">80</text><text x="330" y="88">100</text>
  </g>
  <g fill="#1d6fd1">
    <circle cx="35.3" cy="62" r="4"/><circle cx="36" cy="54" r="4"/><circle cx="37.1" cy="46" r="4"/><circle cx="37.5" cy="38" r="4"/><circle cx="37.9" cy="30" r="4"/>
  </g>
  <circle cx="329.6" cy="62" r="4" fill="#b4232c"/>
  <text x="329" y="48" font-size="11" text-anchor="end" fill="#b4232c">glitch 99.9</text>
  <line x1="85.6" y1="60" x2="85.6" y2="80" stroke="#f2b880" stroke-width="3"/>
  <text x="90" y="112" font-size="11" fill="#1f2a44">mean 34.8 — pulled away from every real reading</text>
  <text x="46" y="26" font-size="11" fill="#1d6fd1">median 21.95</text>
</svg>
```

The five good readings (blue) sit near $22$. The mean (orange mark) is dragged far off by one bad value; the median stays with the crowd.
:::

::: context river-depth The river that is "one metre deep on average"
There is an old warning: never try to wade across a river because it is one metre deep *on average*. It might be ankle-deep for most of the way and three metres deep in the middle. Engineers design for the worst case, not the average: a tank must hold the highest pressure it will ever see, and a burn plan must work with the shortest burn the engine might give. That is why the spread matters as much as the mean.
:::
