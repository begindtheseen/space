---
id: l08-the-fermi-method
title: "The Fermi method: decompose, bound, multiply, check"
minutes: 22
covers:
  - Fermi estimation method: decompose, bound each factor, multiply, sanity check, state uncertainty
---

*How much does the atmosphere weigh. How many bolts are on a first stage. How much energy does it take to put a kilogram into orbit.* A Fermi question asks for a number that is not written down anywhere you could reach, and gives you no data at all. The expected answer is an order of magnitude, arrived at by construction, in about three minutes, out loud.

The reason this round uses them is that they isolate one skill completely. There is no formula to recall and no textbook result to reproduce, so what the interviewer sees is entirely the decomposition you chose, the bounds you were willing to put on each factor, and whether you checked the result against something you already knew. This module states the position directly: **the decomposition is what is being graded, not the number.**

That is liberating once you believe it, and most candidates do not. The characteristic failure is not a wrong estimate; it is a candidate who will not commit to a factor because they do not know it, and therefore produces nothing. The method below exists to make committing safe, by replacing every guess with a bracket you can defend.

## The five moves

1. **Decompose** the quantity into factors you can bound. Two to four factors is the target; more than five and the uncertainties compound past usefulness.
2. **Bound each factor** with an explicit upper and lower estimate. Say both numbers out loud. *"Between five and twenty square metres."*
3. **Multiply the geometric middles** to get the central estimate.
4. **Sanity check** against something you know independently — a different route to the same number, a known quantity of the same kind, or a physical limit.
5. **State the uncertainty**: the range, and which factor is responsible for most of it.

::: key
The Fermi method: decompose into factors you can bound, bound each with an upper and a lower estimate, multiply the geometric middles, sanity check against something you know, and state the uncertainty. The decomposition is what is being graded, not the number.
:::

Move 1 is where the thinking is. A good decomposition turns a question nobody knows the answer to into a product of questions you can each answer within a factor of two or three. A bad decomposition produces factors that are just as unknowable as the original quantity, which is how an estimate ends up with a spread of five orders of magnitude and no defensible middle.

The test of a decomposition, applied before you start multiplying: *can I state a defensible upper and lower bound for every factor?* If one factor fails that test, decompose it further or choose a different route entirely.

## Why a bracket beats a guess

Stating "about ten square metres" and stating "between five and twenty, call it ten" cost the same breath and are not the same answer. The second one:

- **is auditable.** The interviewer can accept the middle, push back on the bound, or replace it with a figure they know — and the estimate survives the substitution because the structure is separate from the numbers.
- **carries its own error bar.** You can propagate the bounds and end with a range rather than a bare number, which is what an engineering estimate is.
- **makes you commit.** Naming a lower bound forces you to ask what would make the factor implausibly small, which is often where the real insight about the problem is.

There is a discipline to setting the bounds honestly. The upper bound is the largest value you would not be embarrassed to defend, not the largest conceivable; the lower likewise. If your bracket spans three orders of magnitude, the factor is not bounded and the decomposition needs work.

## Why the geometric middle

Fermi problems multiply, and quantities that multiply are symmetric in their logarithms, not in their values. If a factor could plausibly be 2 or 20, being wrong by a factor of 3.2 in either direction is the symmetric statement — and the value that sits in the middle in that sense is the **geometric mean**, $\sqrt{2\times 20} = 6.325$, not the arithmetic mean $(2+20)/2 = 11$.

Using the arithmetic mean biases every factor upwards, and the bias compounds: four factors each biased high by a factor of 1.7 produce an answer eight times too large. The geometric mean has no such bias, and it is no harder to take — for round brackets you can usually do it in your head, because the geometric mean of $a$ and $100a$ is $10a$, of $a$ and $10a$ is about $3a$, and of $a$ and $4a$ is $2a$.

::: warning A bracket is not a confidence interval
Saying "between five and twenty" is a statement about what you are willing to defend, not a calibrated 95 per cent interval. Do not dress it up as one. The honest phrasing is *"I would be surprised if it were outside five to twenty"*, and if the interviewer says the real number is thirty, the correct response is to substitute it and re-run the multiplication, not to argue for your bound.
:::

## Combining the uncertainties

Each factor's bracket can be written as a central value times a factor $f$ up or down, where $f = \sqrt{\text{upper}/\text{lower}}$. Because the quantities multiply, the uncertainties add in the logarithm, and the usual root-sum-square applies to the logs:

$$
\ln F_{\text{total}} = \sqrt{\sum_i \left(\ln f_i\right)^2}.
$$

Two things follow, and both are worth saying out loud in an interview.

**The total uncertainty is much less than the product of the individual ones,** because independent errors partly cancel. Three factors each uncertain by a factor of two give a total factor of about 3.3, not 8.

**One factor usually dominates.** The contributions enter as squares of logarithms, so a factor uncertain by four contributes four times as much as one uncertain by two. Identifying the largest $(\ln f)^2$ tells you, quantitatively, where to spend your next thirty seconds — and stating it is the fifth move of the method.

::: example How much does the atmosphere weigh?
**Restate.** The total mass of Earth's atmosphere, in kilograms.

**Decompose.** The atmosphere is held down by gravity, so its weight is what produces the pressure at the surface. Pressure is force per unit area, so mass equals pressure times area divided by $g$:

$$
M = \frac{p_0 A}{g}.
$$

That is a two-factor decomposition in which both factors are known well — which is the mark of a good route. The alternative, "density times volume", needs an effective atmospheric thickness, which is exactly the badly bounded quantity this route avoids.

**Bound each factor.** Sea-level pressure $p_0 = 101325\,\mathrm{Pa}$, known to better than one per cent as a global average. Earth's surface area: $4\pi R^2$ with $R = 6.371\times 10^6\,\mathrm{m}$, giving $5.10\times 10^{14}\,\mathrm{m^2}$, known essentially exactly. And $g = 9.80665\,\mathrm{m/s^2}$.

**Multiply.** $101325 \times 5.10\times 10^{14}/9.80665 = 5.27\times 10^{18}\,\mathrm{kg}$.

**Sanity check.** The accepted figure is about $5.15\times 10^{18}\,\mathrm{kg}$, so the estimate is high by $5.27/5.15 = 1.023$ — two per cent. Where does the two per cent come from? Mostly terrain: the model assumes the whole surface is at sea level, and the parts that are not have less atmosphere above them. That is a real, nameable reason, not a fudge, and naming it is the strongest possible close.

**A second check that costs nothing.** $p_0/g = 101325/9.80665 = 10332\,\mathrm{kg/m^2}$ — ten tonnes of air above every square metre. That is a number worth keeping: it is the same statement, and it makes the mass of the whole atmosphere a one-step multiplication by the planet's area.

**Uncertainty.** Under five per cent, which is unusually tight for a Fermi problem and is the direct result of a decomposition whose factors were all known quantities.
:::

::: example How many bolts are on a first stage?
Now the opposite case: nothing here is known, and the entire answer is the bracketing.

**Restate and bound.** Threaded fasteners on the first stage of a medium launch vehicle, as flown, excluding the payload and the second stage. Roughly 47 m long, 3.7 m in diameter, nine engines.

**Decompose.** Fasteners cluster at joints, so count joints and bolts per joint, then scale up for everything that is not a primary structural joint:

$$
N \approx (\text{major joints}) \times (\text{bolts per joint}) \times (\text{secondary multiplier}).
$$

**Bound factor one: major joints.** Tank section flanges, the interstage at each end, the thrust structure, the engine section, the octaweb or equivalent, access panels. Lower bound 6, upper bound 12. Geometric middle $\sqrt{6\times 12} = 8.485$.

**Bound factor two: bolts per joint.** A 3.7 m circumference is $\pi \times 3.7 = 11.6\,\mathrm{m}$. At a bolt pitch of 50 mm — close spacing, appropriate for a pressure-carrying flange — that is $11.6/0.050 = 232$ bolts. At 100 mm pitch it would be half that. Lower bound 150, upper bound 350. Geometric middle $\sqrt{150\times 350} = 229$.

**Bound factor three: secondary multiplier.** Every engine has its own mount, gimbal actuator brackets, plumbing clamps and heat shielding; there are avionics boxes, cable trays, valves, pressurant bottles and landing hardware. The ratio of all fasteners to primary-joint fasteners could be 2 and could be 8. Geometric middle $\sqrt{2\times 8} = 4$.

**Multiply.** $8.485 \times 229.1 \times 4 = 7780$.

**Sanity check.** Nine engines with perhaps a hundred fasteners each is 900, which should be a modest fraction of the total — it is about twelve per cent here, which is plausible. And an aircraft of comparable size carries hundreds of thousands of fasteners, so a launch vehicle at under ten thousand is consistent with the fact that it is mostly two thin-walled tanks welded rather than riveted. Both checks point the same way.

**Answer.** Of order ten thousand, with the range computed in the next example.
:::

::: example Propagating the bolt estimate's uncertainty
Take the three brackets and turn each into a multiplicative factor $f = \sqrt{\text{upper}/\text{lower}}$.

| Factor | Bracket | Middle | $f$ | $\ln f$ | $(\ln f)^2$ |
| --- | --- | --- | --- | --- | --- |
| Major joints | 6–12 | 8.485 | 1.414 | 0.347 | 0.120 |
| Bolts per joint | 150–350 | 229 | 1.528 | 0.424 | 0.180 |
| Secondary multiplier | 2–8 | 4 | 2.000 | 0.693 | 0.480 |

**Combine.** $0.347^2 + 0.424^2 + 0.693^2 = 0.780$, and $\sqrt{0.780} = 0.883$, so the total factor is $e^{0.883} = 2.42$.

**The range.** $7780/2.42 = 3215$ at the bottom and $7780 \times 2.42 = 18830$ at the top. So: **about eight thousand fasteners, plausibly between three thousand and twenty thousand.**

**Which step dominates.** The secondary multiplier contributes $0.480/0.780 = 0.615$ — over sixty per cent of the total log-variance, more than the other two together. That is the sentence to say: *"the number is dominated by how much non-primary hardware there is, not by the joint count, so if you want a better estimate that is the one to attack."*

**Note what the combination bought.** Multiplying the individual factors would have given $1.414 \times 1.528 \times 2.000 = 4.32$; the root-sum-square in log space gives 2.42 instead. Treating independent uncertainties as if they all went wrong in the same direction nearly doubles the stated range and makes the estimate look far weaker than it is.
:::

## Anchors worth having in your head

The fourth move needs something to check against. These are the reference magnitudes this curriculum uses most; knowing them cold turns a sanity check from a pause into a sentence.

| Quantity | Value |
| --- | --- |
| Earth radius, surface area | $6.371\times 10^6\,\mathrm{m}$, $5.10\times 10^{14}\,\mathrm{m^2}$ |
| Earth gravitational parameter $\mu$ | $3.986\times 10^{14}\,\mathrm{m^3/s^2}$ |
| Low Earth orbit speed, period | About 7.7 km/s, about 90 minutes |
| Standard gravity $g_0$ | $9.80665\,\mathrm{m/s^2}$ |
| Sea-level air density, pressure | $1.225\,\mathrm{kg/m^3}$, $101325\,\mathrm{Pa}$ |
| Air column above one square metre | $10332\,\mathrm{kg/m^2}$ |
| Solar constant at 1 AU | $1361\,\mathrm{W/m^2}$ |
| Stefan–Boltzmann constant $\sigma$ | $5.670\times 10^{-8}\,\mathrm{W/(m^2K^4)}$ |
| Boltzmann constant $k$ | $1.381\times 10^{-23}\,\mathrm{J/K}$ |
| Hydrocarbon fuel energy density | About 43 MJ/kg |
| Seconds in a year | $3.156\times 10^7$, close to $\pi\times 10^7$ |
| Density of water | $1000\,\mathrm{kg/m^3}$ |

Two habits make this list go further. Convert everything to SI before multiplying, always. And when you quote one of these, say how well you know it — "the solar constant is 1361, good to a fraction of a per cent" is a different claim from "call the array ten square metres", and the interviewer should be able to hear which is which.

## Check yourself

::: check
A factor could plausibly be anywhere between 3 and 300. What central value do you use, and what does the width of that bracket tell you about your decomposition?
:::

::: answer
The geometric middle, $\sqrt{3 \times 300} = 30$. The arithmetic mean would be 151.5, which is five times larger and has no justification in a multiplicative problem.

What the width tells you is more important than the middle: a bracket spanning two orders of magnitude means the factor is not bounded in any useful sense, and any estimate built on it inherits that spread. The correct response is to go back to move 1 and decompose that factor further — split it into two sub-factors you can each bound to within a factor of three — or to find a route to the answer that does not need it.

Saying this out loud is a strong move. *"My bracket on this is two decades wide, which is too wide to be useful, so let me split it."*
:::

::: check
Estimate the mass of air in a hangar 100 m long, 80 m wide and 30 m high, and then state the largest source of error.
:::

::: answer
**Decompose.** Mass equals volume times density.

**Volume.** $100 \times 80 \times 30 = 240000\,\mathrm{m^3}$.

**Density.** $1.2\,\mathrm{kg/m^3}$ at ordinary indoor conditions, good to a few per cent.

**Multiply.** $240000 \times 1.2 = 288000\,\mathrm{kg}$, about 290 tonnes.

**Sanity check.** That is comparable to the liftoff mass of a small launch vehicle, sitting invisibly inside the building. Surprising, and consistent with the ten tonnes per square metre anchor: the hangar floor is $100 \times 80 = 8000\,\mathrm{m^2}$, and the air inside it is 290 t against the 82,000 t of atmosphere above that footprint — the hangar holds about a third of a per cent of its own air column, which is right for a 30 m building under a roughly 8 km scale height.

**Largest error.** The dimensions, if paced out, and specifically the height, which is the one hardest to judge by eye and easiest to be wrong about by fifty per cent. Density is known far better.
:::

::: check
Why does the root-sum-square of logarithms give a smaller total uncertainty than multiplying the individual factors, and when would multiplying them be the right thing to do?
:::

::: answer
Because root-sum-square assumes the factor errors are **independent**, so they partly cancel: it is unlikely that every one of them is simultaneously at the top of its bracket. Multiplying the factors assumes they all go wrong together and in the same direction, which is a worst case rather than an estimate.

For the bolt example, root-sum-square gave 2.42 against 4.32 for the product — nearly a factor of two difference in the stated range.

Multiplying is right in two situations. First, when the factors are genuinely correlated: if you assumed a large vehicle when bounding both the joint count and the bolts per joint, then being wrong about the vehicle size moves both in the same direction, and treating them as independent understates the spread. Second, when you have been asked for a worst case rather than an estimate — sizing a margin, say — where the whole point is to assume things go wrong together.

Saying which of the two you are giving is part of the answer.
:::

::: check
An interviewer interrupts your estimate to say "actually that factor is closer to 40, not 10". What do you do, and what does this reveal about why the decomposition is what is graded?
:::

::: answer
Take the number, substitute it, and re-run the multiplication out loud: *"Then the answer moves up by a factor of four, to about 32,000, and the range with it."* Do not defend the original bound, and do not restart.

What it reveals is that the numbers are separable from the structure. A decomposition written as an explicit product of named factors can absorb a correction in five seconds, because only one term changes. An estimate produced as a single intuited number cannot absorb anything — there is nowhere to put the correction — so the candidate has to start again, and that is what the interruption is testing.

It also reveals why stating bounds out loud is in your interest. An interviewer who knows a factor will often supply it, and that is a gift: it removes the widest uncertainty in your estimate at no cost to you.
:::

::: check
You decompose a quantity into five factors, each bounded to within a factor of two either way. What is the total uncertainty factor, and what does that tell you about the number of factors to aim for?
:::

::: answer
Each factor has $f = 2$, so $\ln f = 0.693$ and $(\ln f)^2 = 0.480$. Five of them give $5 \times 0.480 = 2.40$, and $\sqrt{2.40} = 1.549$, so the total factor is $e^{1.549} = 4.71$ — the answer is good to about a factor of five either way, a span of nearly twenty-five.

With three such factors the total would be $\sqrt{3 \times 0.480} = 1.200$ and $e^{1.200} = 3.32$, a factor of three.

The lesson is that uncertainty grows as the square root of the number of factors, so decomposing further is cheap in accuracy terms *provided each new factor is better bounded than the one it replaced*. Splitting a factor you cannot bound into two you can is always worth it; splitting a factor you already know well into two you know less well is not. Aim for two to four factors, and add a fifth only to escape a badly bounded one.
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
| Atmosphere mass | $p_0 A/g = 5.27\times 10^{18}\,\mathrm{kg}$, two per cent above the accepted value |
| Bolt estimate | About 8000, range 3000–19000, dominated by the secondary multiplier |

The next lesson applies all five moves to the space estimation problems this round actually asks: the energy cost of reaching orbit, the power a communications satellite radiates, how many satellites are overhead, and the launch cadence a constellation requires.
