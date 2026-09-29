---
id: l08-the-fermi-method
title: "The Fermi method: decompose, bound, multiply, check"
minutes: 24
covers:
  - Fermi estimation method: decompose, bound each factor, multiply, sanity check, state uncertainty
---

How many slices of pizza does your whole school eat in a year? Nobody has written that number down. But you can build it: the number of students, times the pizza days per month, times the slices each person eats, times the months in a school year. Each piece is something you can guess well. Multiply them and you have an answer that is probably within a factor of two or three of the truth.

That is a **[[Fermi question|fermi-trinity]]**: a question whose answer is not written anywhere you can reach, asked with no data at all. *How much does the atmosphere weigh? How many bolts are on a first stage? How much energy does it take to put a kilogram into orbit?* The expected answer is an **order of magnitude** — the right power of ten — built out loud, in about three minutes.

Interviewers use these because they isolate one skill completely. There is no formula to recall and no textbook result to repeat. What the interviewer sees is only the breakdown you chose, the limits you were willing to put on each piece, and whether you checked the result against something you already knew. This module says it plainly: **the decomposition is what is being graded, not the number.**

That is freeing once you believe it, and most candidates do not. The usual failure is not a wrong estimate. It is a candidate who will not commit to a piece because they do not know it, and so produces nothing. The method below makes committing safe, by replacing every guess with a range you can defend.

## The five moves

1. **Decompose** the quantity into factors you can bound. A **factor** is one of the numbers you multiply together. Aim for two to four; past five, the uncertainties pile up until the answer is useless.
2. **Bound each factor** with an explicit upper and lower estimate. Say both numbers out loud: *"between five and twenty square meters."*
3. **Multiply the geometric middles** to get the central estimate (the geometric middle is explained below).
4. **Sanity check** against something you know independently — a different route to the same number, a known quantity of the same kind, or a physical limit.
5. **State the uncertainty**: the range, and which factor is responsible for most of it.

::: key
The Fermi method: decompose into factors you can bound, bound each with an upper and a lower estimate, multiply the geometric middles, sanity check against something you know, and state the uncertainty. The decomposition is what is being graded, not the number.
:::

Move 1 is where the thinking happens. A good decomposition turns a question nobody can answer into a product of questions you can each answer within a factor of two or three. A bad one produces factors as unknowable as the original. That is how an estimate ends up spanning five powers of ten with no sensible middle.

Test a decomposition before you start multiplying: *can I state a defensible upper and lower bound for every factor?* If one factor fails, break it down further or choose a different route.

## Why a bracket beats a guess

A **bracket** is a pair of limits — a lowest and a highest value you would defend. "About ten square meters" and "between five and twenty, call it ten" take the same breath. They are not the same answer. The second one:

- **can be checked.** The interviewer can accept the middle, push back on a limit, or swap in a figure they know. The estimate survives the swap, because the structure is separate from the numbers.
- **carries its own error bar.** You can carry the limits through and end with a range, not a bare number — and a range is what an engineering estimate is.
- **makes you commit.** Naming a lower limit forces you to ask what would make the factor surprisingly small. That question is often where the real insight is.

Set the limits honestly. The upper bound is the largest value you would not be embarrassed to defend, not the largest you can imagine; the lower bound likewise. If your bracket spans three powers of ten, the factor is not bounded, and the decomposition needs work.

## Why the geometric middle

Fermi problems multiply, and for things that multiply, "equally wrong" means "wrong by the same *factor*", not by the same amount. Being off by a factor of 3 too high is as bad as being off by a factor of 3 too low.

So suppose a factor could be anywhere from 2 to 20. The fair middle is the number that is the same *factor* away from each end. That is the **[[geometric mean|geometric-mean]]**, the square root of the two limits multiplied together:

$$
\sqrt{2\times 20} = 6.325.
$$

Check it: $6.325/2 = 3.16$ and $20/6.325 = 3.16$. Same factor both ways. The everyday average, the **arithmetic mean**, is $(2+20)/2 = 11$. That is 5.5 times the low end but less than 2 times short of the high end — it leans toward the top.

That lean compounds. Using the arithmetic mean pushes every factor upward, and four factors each pushed high by a factor of 1.7 give an answer about eight times too large ($1.7^4 \approx 8.4$). The geometric mean has no such lean. It is no harder to take in your head for round brackets: the geometric mean of $a$ and $100a$ is $10a$, of $a$ and $10a$ is about $3a$, and of $a$ and $4a$ is $2a$.

::: warning A bracket is not a confidence interval
"Between five and twenty" says what you are willing to defend. It is not a carefully measured **[[95 percent confidence interval|confidence-interval]]**, so do not dress it up as one. The honest phrasing is *"I would be surprised if it were outside five to twenty."* If the interviewer says the real number is thirty, substitute it and redo the multiplication. Do not argue for your bound.
:::

## Combining the uncertainties

Write each factor's bracket as a middle value times some factor $f$ up or down. Since the middle is the geometric mean, $f$ is

$$
f = \sqrt{\frac{\text{upper}}{\text{lower}}}.
$$

For the bracket 2 to 20, $f = \sqrt{10} = 3.16$, matching the check above.

Now, how do several such uncertainties combine? A **[[logarithm|logarithm]]**, written $\ln$ ("natural log"), turns multiplying into adding: $\ln(ab) = \ln a + \ln b$. So in logarithms, the factors of a Fermi estimate *add*, and so do their errors. Independent errors that add combine by **[[root-sum-square|root-sum-square]]** — square each one, add the squares, take the square root:

$$
\ln F_{\text{total}} = \sqrt{\sum_i \left(\ln f_i\right)^2}.
$$

Here $F_{\text{total}}$ is the uncertainty factor of the whole answer, and $\sum_i$ ("sum over $i$") means add up the term for every factor.

Two things follow, and both are worth saying out loud in an interview.

**The total uncertainty is much smaller than the product of the individual ones,** because independent errors partly cancel. Three factors each uncertain by a factor of two give a total factor of about 3.3, not $2\times 2\times 2 = 8$.

**One factor usually dominates.** The pieces enter as squares of logarithms, so a factor uncertain by four ($\ln 4 = 1.386$, squared 1.92) contributes four times as much as one uncertain by two ($\ln 2 = 0.693$, squared 0.48). Find the largest $(\ln f)^2$ and you know, in numbers, where to spend your next thirty seconds. Saying so is the fifth move.

::: note Why independent errors partly cancel
Walk one step east and one step north. You end up $\sqrt{1^2 + 1^2} = 1.41$ steps from where you began, not 2, because the steps point in different directions. Independent errors behave the same way: one factor may be too high while another is too low, and on average they do not all line up. Root-sum-square is the typical distance you end up from the true answer. Only when every error points the same way does the total reach the simple product — the worst case.
:::

::: example How much does the atmosphere weigh?
**Restate.** The total mass of Earth's atmosphere, in kilograms.

**Decompose.** Gravity holds the air down, so the air's weight is what presses on the ground. Pressure is force per area, so force equals pressure times area. Weight is mass times $g$, so the mass is that force divided by $g$:

$$
M = \frac{p_0 A}{g}.
$$

Two factors, and both are well known — the mark of a good route. The other natural route, "density times volume", needs an effective thickness for the atmosphere. That is exactly the badly bounded quantity this route avoids.

**Bound each factor.** Sea-level pressure $p_0 = 101\,325\,\mathrm{Pa}$ ("p nought"), known to better than one percent as a global average. Earth's surface area is $4\pi R^2$ with $R = 6.371\times 10^6\,\mathrm{m}$, which gives $5.10\times 10^{14}\,\mathrm{m^2}$, known almost exactly. And $g = 9.80665\,\mathrm{m/s^2}$.

**Multiply.**

$$
M = \frac{101\,325 \times 5.10\times 10^{14}}{9.80665} = 5.27\times 10^{18}\,\mathrm{kg}.
$$

**Sanity check.** The accepted figure is about $5.15\times 10^{18}\,\mathrm{kg}$. The estimate is high by $5.27/5.15 = 1.023$ — two percent. Where do those two percent come from? Mostly mountains and high ground. The model puts the whole surface at sea level, but high ground has less air above it. That is a real reason you can name, not a fudge, and naming it is the strongest possible finish.

**A second check that costs nothing.** $p_0/g = 101\,325/9.80665 = 10\,332\,\mathrm{kg/m^2}$ — about ten metric tons of air above every square meter. That is the same statement in a form worth remembering: the mass of the whole atmosphere is that number times the planet's area.

**Uncertainty.** Under five percent. That is unusually tight for a Fermi problem, and it comes straight from a decomposition whose factors were all known quantities.
:::

::: example How many bolts are on a first stage?
Now the opposite case. Nothing here is known, and the whole answer is the bracketing.

**Restate and bound.** Threaded fasteners (bolts and screws) on the first stage of a medium launch vehicle, as flown, leaving out the payload and the second stage. Roughly 47 m long, 3.7 m across, nine engines.

**Decompose.** Fasteners bunch up at joints. So count the major joints, times the bolts per joint, then scale up for everything that is not a main structural joint:

$$
N \approx (\text{major joints}) \times (\text{bolts per joint}) \times (\text{secondary multiplier}).
$$

**Factor one: major joints.** Flanges between tank sections, the interstage at each end, the thrust structure, the engine section, the **[[octaweb|octaweb]]** or its equivalent, access panels. Lower bound 6, upper bound 12. Geometric middle $\sqrt{6\times 12} = 8.485$.

**Factor two: bolts per joint.** The stage's circumference is $\pi \times 3.7 = 11.6\,\mathrm{m}$. At a **[[bolt pitch|bolt-pitch]]** of 50 mm — close spacing, right for a flange that carries pressure — that is $11.6/0.050 = 232$ bolts. At 100 mm it would be half that. Lower bound 150, upper bound 350. Geometric middle $\sqrt{150\times 350} = 229$.

**Factor three: secondary multiplier.** Each engine has its own mount, brackets for the actuators that swivel it, pipe clamps and heat shields. There are avionics boxes, cable trays, valves, pressure bottles and landing hardware. The ratio of all fasteners to main-joint fasteners could be 2, and could be 8. Geometric middle $\sqrt{2\times 8} = 4$.

**Multiply.** $8.485 \times 229.1 \times 4 = 7780$.

**Sanity check.** Nine engines at perhaps a hundred fasteners each is 900. That should be a modest share of the total, and here it is $900/7780$, about twelve percent — plausible. And an aircraft of similar size carries hundreds of thousands of fasteners, so a launch vehicle at under ten thousand fits the fact that it is mostly two thin-walled tanks, welded rather than riveted. Both checks point the same way.

**Answer.** Of order ten thousand, with the range worked out in the next example.
:::

::: example Propagating the bolt estimate's uncertainty
Turn each bracket into its factor $f = \sqrt{\text{upper}/\text{lower}}$, then take logs.

| Factor | Bracket | Middle | $f$ | $\ln f$ | $(\ln f)^2$ |
| --- | --- | --- | --- | --- | --- |
| Major joints | 6–12 | 8.485 | 1.414 | 0.347 | 0.120 |
| Bolts per joint | 150–350 | 229 | 1.528 | 0.424 | 0.180 |
| Secondary multiplier | 2–8 | 4 | 2.000 | 0.693 | 0.480 |

**Combine.** Add the squares: $0.347^2 + 0.424^2 + 0.693^2 = 0.780$. Take the square root: $\sqrt{0.780} = 0.883$. Undo the log: the total factor is $e^{0.883} = 2.42$.

**The range.** Divide and multiply the middle by 2.42: $7780/2.42 = 3215$ at the bottom and $7780 \times 2.42 = 18\,800$ at the top. So: **about eight thousand fasteners, plausibly between three thousand and twenty thousand.**

**Which factor dominates.** The secondary multiplier contributes $0.480/0.780 = 0.615$ — over sixty percent of the total, more than the other two together. That gives you the sentence to say: *"the number is dominated by how much non-primary hardware there is, not by the joint count, so if you want a better estimate that is the one to attack."*

**What the combination bought.** Multiplying the individual factors would give $1.414 \times 1.528 \times 2.000 = 4.32$. Root-sum-square in logs gives 2.42 instead. Treating independent uncertainties as if they all went wrong in the same direction nearly doubles the stated range, and makes the estimate look far weaker than it is.
:::

## Anchors worth having in your head

The fourth move needs something to check against. These are the reference values this course uses most. Know them cold, and a sanity check becomes a sentence instead of a pause.

| Quantity | Value |
| --- | --- |
| Earth radius, surface area | $6.371\times 10^6\,\mathrm{m}$, $5.10\times 10^{14}\,\mathrm{m^2}$ |
| Earth gravitational parameter $\mu$ | $3.986\times 10^{14}\,\mathrm{m^3/s^2}$ |
| Low Earth orbit speed, period | About 7.7 km/s, about 90 minutes |
| Standard gravity $g_0$ | $9.80665\,\mathrm{m/s^2}$ |
| Sea-level air density, pressure | $1.225\,\mathrm{kg/m^3}$, $101325\,\mathrm{Pa}$ |
| Air column above one square meter | $10332\,\mathrm{kg/m^2}$ |
| Solar constant at 1 AU | $1361\,\mathrm{W/m^2}$ |
| Stefan–Boltzmann constant $\sigma$ | $5.670\times 10^{-8}\,\mathrm{W/(m^2K^4)}$ |
| Boltzmann constant $k$ | $1.381\times 10^{-23}\,\mathrm{J/K}$ |
| Hydrocarbon fuel energy density | About 43 MJ/kg |
| Seconds in a year | $3.156\times 10^7$, close to $\pi\times 10^7$ |
| Density of water | $1000\,\mathrm{kg/m^3}$ |

(1 AU, the "astronomical unit", is Earth's average distance from the Sun. The Stefan–Boltzmann constant sets how much heat a warm surface radiates; the Boltzmann constant links temperature to energy. Both come back in the next lesson.)

Two habits make this list go further. Convert everything to SI before multiplying, always. And when you quote an anchor, say how well you know it. "The solar constant is 1361, good to a fraction of a percent" is a different claim from "call the array ten square meters", and the interviewer should be able to hear which is which. There is a memory trick for one of them: [[a year is about pi times ten million seconds|pi-seconds]].

## Check yourself

::: check
A factor could plausibly be anywhere between 3 and 300. What central value do you use, and what does the width of that bracket tell you about your decomposition?
:::

::: answer
The geometric middle, $\sqrt{3 \times 300} = \sqrt{900} = 30$. The arithmetic mean would be 151.5 — five times larger, with no justification in a problem that multiplies.

The width matters more than the middle. A bracket spanning two powers of ten means the factor is not bounded in any useful sense, and every estimate built on it inherits that spread. Go back to move 1 and break that factor down further — split it into two pieces you can each bound within a factor of three — or find a route that does not need it.

Saying this out loud is a strong move: *"My bracket on this is two decades wide, which is too wide to be useful, so let me split it."* (A **decade** here means a factor of ten.)
:::

::: check
Estimate the mass of air in a hangar 100 m long, 80 m wide and 30 m high, and then state the largest source of error.
:::

::: answer
**Decompose.** Mass equals volume times density.

**Volume.** $100 \times 80 \times 30 = 240\,000\,\mathrm{m^3}$.

**Density.** $1.2\,\mathrm{kg/m^3}$ at ordinary indoor conditions, good to a few percent.

**Multiply.** $240\,000 \times 1.2 = 288\,000\,\mathrm{kg}$, about 290 metric tons.

**Sanity check.** That is similar to the lift-off mass of a small launch vehicle, sitting invisibly inside the building. Surprising — and consistent with the ten-metric tons-per-square-meter anchor. The floor is $100 \times 80 = 8000\,\mathrm{m^2}$, so the whole air column above it is about $8000 \times 10\,332 \approx 82\,700$ t. The hangar holds $290/82\,700$, about a third of a percent, of its own air column. That is right for a 30 m building under an atmosphere whose **[[scale height|scale-height]]** is roughly 8 km: $30/8400 \approx 0.36$ percent.

**Largest error.** The dimensions, if you paced them out — and above all the height, which is the hardest to judge by eye and the easiest to get wrong by fifty percent. The density is known far better.
:::

::: check
Why does the root-sum-square of logarithms give a smaller total uncertainty than multiplying the individual factors, and when would multiplying them be the right thing to do?
:::

::: answer
Root-sum-square assumes the factor errors are **independent** — one does not push another — so they partly cancel. It is unlikely that every factor sits at the top of its bracket at once. Multiplying the factors assumes they all go wrong together, in the same direction. That is a worst case, not an estimate.

For the bolt example, root-sum-square gave 2.42 against 4.32 for the product — nearly a factor of two difference in the stated range.

Multiplying is right in two situations. First, when the factors are genuinely linked. If you pictured a large vehicle when bounding both the joint count and the bolts per joint, being wrong about the size moves both the same way, and treating them as independent understates the spread. Second, when you were asked for a worst case rather than an estimate — sizing a safety margin, say — where the whole point is to assume things go wrong together.

Saying which of the two you are giving is part of the answer.
:::

::: check
An interviewer interrupts your estimate to say "actually that factor is closer to 40, not 10". What do you do, and what does this reveal about why the decomposition is what is graded?
:::

::: answer
Take the number, substitute it, and redo the multiplication out loud: *"Then the answer moves up by a factor of four, to about 32,000, and the range with it."* Do not defend the original bound, and do not restart.

It reveals that the numbers are separate from the structure. A decomposition written as a product of named factors can absorb a correction in five seconds, because only one term changes. A single number you intuited cannot absorb anything — there is nowhere to put the correction — so you have to start again. That is what the interruption is testing.

It also shows why stating bounds out loud is in your interest. An interviewer who knows a factor will often supply it. That is a gift: it removes the widest uncertainty in your estimate at no cost to you.
:::

::: check
You break a quantity into five factors, each bounded within a factor of two either way. What is the total uncertainty factor, and what does that tell you about how many factors to aim for?
:::

::: answer
Each factor has $f = 2$, so $\ln f = 0.693$ and $(\ln f)^2 = 0.480$. Five of them give $5 \times 0.480 = 2.40$. The square root is $\sqrt{2.40} = 1.549$, so the total factor is $e^{1.549} = 4.71$. The answer is good to about a factor of five either way — a total span, top to bottom, of nearly twenty-five.

With three such factors the total would be $\sqrt{3 \times 0.480} = 1.200$ and $e^{1.200} = 3.32$, about a factor of three.

So uncertainty grows only as the square root of the number of factors. Breaking things down further is cheap *if each new factor is better bounded than the one it replaced*. Splitting a factor you cannot bound into two you can is always worth it. Splitting one you already know well into two you know less well is not. Aim for two to four factors, and add a fifth only to escape a badly bounded one.
:::

## Summary

| Item | Statement |
| --- | --- |
| The five moves | Decompose, bound each factor, multiply the geometric middles, sanity check, state the uncertainty |
| What is graded | The decomposition, not the number |
| Test of a decomposition | Can you state a defensible upper and lower bound for every factor? |
| Central value | Geometric mean $\sqrt{\text{lo}\times\text{hi}}$, never the arithmetic mean |
| Per-factor uncertainty | $f = \sqrt{\text{upper}/\text{lower}}$ |
| Combining | $\ln F_{\text{total}} = \sqrt{\sum (\ln f_i)^2}$, for independent factors |
| Dominant factor | The largest $(\ln f)^2$; name it in the closing sentence |
| Atmosphere mass | $p_0 A/g = 5.27\times 10^{18}\,\mathrm{kg}$, two percent above the accepted value |
| Bolt estimate | About 8000, range 3000–19000, dominated by the secondary multiplier |

The next lesson applies all five moves to the space estimates this round actually asks: the energy cost of reaching orbit, the power a communications satellite radiates, how many satellites are overhead, and how many launches a constellation needs.

::: context fermi-trinity Fermi and the scraps of paper
Enrico Fermi, an Italian-American physicist, was famous for answering questions on the spot with rough, reasoned numbers. At the first atomic bomb test in July 1945, he dropped small scraps of paper as the blast wave passed, watched how far they were pushed, and estimated the explosion's size at around ten thousand metric tons of TNT. The official figure, worked out later with instruments, was roughly twice that — the right order of magnitude from a handful of paper. He also liked to ask students questions like how many piano tuners work in Chicago, which is why these puzzles carry his name.
:::

::: context geometric-mean The middle on a ruler that multiplies
On a normal ruler, each step adds the same amount. On a **log scale**, each step *multiplies* by the same amount, so 1, 10, 100 are evenly spaced. The geometric mean is the true halfway point on that ruler.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="50" x2="30" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="330" y1="50" x2="330" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="46" x2="180" y2="74" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="252.1" y1="50" x2="252.1" y2="70" stroke="#b4232c" stroke-width="3"/>
  <text x="30" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="330" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="180" y="92" font-size="12" text-anchor="middle" fill="#1d6fd1">6.3 geometric</text>
  <text x="252" y="40" font-size="12" text-anchor="middle" fill="#b4232c">11 arithmetic</text>
  <text x="105" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">×3.16</text>
  <text x="222" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">×3.16</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">log scale: equal distance = equal factor</text>
</svg>
```

On this ruler, 11 sits well past the middle — which is why the everyday average leans high.
:::

::: context confidence-interval What a real confidence interval is
In statistics, a **95 percent confidence interval** is a range worked out from measured data, using a method that, over many repeats, captures the true value 95 times in 100. It needs data and a model of the scatter. A Fermi bracket has neither: it is your honest judgment of the limits. Both are useful, but calling a guess-bracket "95 percent" claims a precision you have not earned — and an interviewer with a statistics background will notice.
:::

::: context logarithm Logs turn multiplying into adding
The natural logarithm $\ln x$ answers "what power of $e$ (about 2.718) gives $x$?" Its key property is $\ln(ab) = \ln a + \ln b$. A Fermi estimate is a product of factors, so its log is a sum of logs. Errors in sums are the well-understood kind, which is why working in logs makes combining uncertainties easy. To come back from logs, raise $e$ to the power: $e^{0.883} = 2.42$.
:::

::: context root-sum-square Errors at right angles
Treat each factor's log-error as an arrow. If the errors are independent, the arrows point in unrelated directions, and the total is the length of the diagonal, not the arrows laid end to end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="200" y2="140" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="206,140 196,135 196,145" fill="#1d6fd1"/>
  <line x1="206" y1="140" x2="206" y2="40" stroke="#f2b880" stroke-width="3"/>
  <polygon points="206,34 201,44 211,44" fill="#f2b880"/>
  <line x1="40" y1="140" x2="202" y2="37" stroke="#b4232c" stroke-width="2.5"/>
  <text x="120" y="160" font-size="12" text-anchor="middle" fill="#1d6fd1">ln f₁</text>
  <text x="216" y="92" font-size="12" fill="#1f2a44">ln f₂</text>
  <text x="14" y="40" font-size="11" fill="#b4232c">total =</text>
  <text x="14" y="56" font-size="11" fill="#b4232c">√((ln f₁)² + (ln f₂)²)</text>
  <text x="250" y="60" font-size="11" fill="#1f2a44">end to end:</text>
  <text x="250" y="76" font-size="11" fill="#1f2a44">ln f₁ + ln f₂</text>
  <text x="250" y="92" font-size="11" fill="#1f2a44">(worst case)</text>
</svg>
```
:::

::: context octaweb The octaweb
On a Falcon 9 first stage, the nine Merlin engines are arranged as eight in a ring around one in the center. The metal structure that holds them and carries their thrust into the tanks is called the **octaweb**, after its eight-sided shape. Every launch vehicle has an equivalent **thrust structure**: the part that takes the full push of the engines and spreads it into the rest of the rocket. It is one of the most bolt-dense places on the stage.
:::

::: context bolt-pitch Bolt pitch
**Pitch** is the spacing between neighboring bolts around a joint. Two rings of tank wall are joined at a **flange** — a lip that sticks out so bolts can pass through it. Closer pitch means more bolts and a tighter seal, which a pressurized tank needs. The count is the circumference divided by the pitch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="55" fill="none" stroke="#1f2a44" stroke-width="10"/>
  <g fill="#b4232c">
    <circle cx="145" cy="75" r="3"/><circle cx="128.9" cy="113.9" r="3"/><circle cx="90" cy="130" r="3"/><circle cx="51.1" cy="113.9" r="3"/>
    <circle cx="35" cy="75" r="3"/><circle cx="51.1" cy="36.1" r="3"/><circle cx="90" cy="20" r="3"/><circle cx="128.9" cy="36.1" r="3"/>
  </g>
  <text x="90" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">flange ring</text>
  <text x="170" y="50" font-size="12" fill="#1f2a44">circumference = π × 3.7 m ≈ 11.6 m</text>
  <text x="170" y="74" font-size="12" fill="#1f2a44">pitch 50 mm → 232 bolts</text>
  <text x="170" y="98" font-size="12" fill="#1f2a44">pitch 100 mm → 116 bolts</text>
  <text x="170" y="126" font-size="11" fill="#6c7a93">(8 bolts drawn; real ring has hundreds)</text>
</svg>
```
:::

::: context scale-height How fast the air thins
The atmosphere has no top edge; it fades. For every 8 km or so you climb, the air's density falls by a factor of about $e$, roughly 2.7. That distance is the **scale height**. A useful picture: if all the air were squeezed to sea-level density, it would form a layer about 8.4 km thick — which is why $10\,332\,\mathrm{kg/m^2} \div 1.225\,\mathrm{kg/m^3} \approx 8.4\,\mathrm{km}$. A 30 m hangar is a thin slice of that.
:::

::: context pi-seconds A year is about pi times ten million seconds
A year has $365.25 \times 24 \times 3600 = 31\,557\,600$ seconds, which is $3.156\times 10^7$. And $\pi \times 10^7 = 3.142\times 10^7$ — within half a percent. Physicists love this coincidence because it makes rates per year easy to convert in your head. It is a good example of an anchor: easy to remember, precise enough for any Fermi problem.
:::
