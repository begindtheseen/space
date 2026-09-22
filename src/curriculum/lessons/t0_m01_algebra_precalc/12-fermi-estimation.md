---
id: l12-fermi-estimation
title: Order-of-magnitude estimation
minutes: 18
covers:
  - order-of-magnitude (Fermi) estimation
---

At the first nuclear test in 1945, Enrico Fermi dropped scraps of paper as the blast wave passed and, from how far they were carried, estimated the yield at about ten kilotons. The instruments later said about twenty. He was within a factor of two, in seconds, with no equipment, and that is the standard an **order-of-magnitude estimate** — a **Fermi estimate** — aims at: not the right answer, but the right size of answer, with every assumption on the table. In GNC work you will do this daily. A simulation prints a stage propellant mass of $4100\,\mathrm{t}$; is that plausible, or did a unit slip? A colleague proposes a manoeuvre needing $3\,\mathrm{km/s}$; roughly what fraction of the spacecraft is that in propellant? Before you trust a computer, a spreadsheet or a vendor, you should be able to say what the number ought to be to within a factor of a few, from things you already know.

The technique is nothing new. It is scientific notation, units, exponents, logarithms and the discipline of writing assumptions down, all from earlier in this module, applied with a particular attitude: decompose the unknown into factors you can guess, guess each one honestly, multiply, and then ask which guess the answer depends on most. The mathematics is deliberately coarse. The rigour is in the bookkeeping.

This lesson gives the method, explains with logarithms why multiplying six rough guesses does not produce nonsense, works several aerospace estimates to a result and compares them with published values, and ends with the skill the module's Fermi exercise grades you on: naming the single assumption that dominates your error.

## The method

**State the quantity precisely, with its unit.** "How big is a first stage" is not a question; "what is the propellant mass of a first stage, in tonnes" is. The unit is not decoration — it tells you what dimensions the chain of factors must multiply out to, and dimensional homogeneity will police the decomposition.

**Decompose into factors you can estimate.** Rewrite the unknown as a product or quotient of quantities each of which you either know, can look up in your head, or can guess to within a factor of two or three. A mass is a volume times a density; a volume is a cross-section times a length; a rate times a time is an amount. Write the chain with units and check that they cancel to the unit you want. If they do not, the decomposition is wrong, however plausible the numbers.

**Estimate each factor.** Anchor on things you know: a person is about $70\,\mathrm{kg}$, water is $1000\,\mathrm{kg/m^3}$, low orbit is $7.7\,\mathrm{km/s}$, a year is $3.16 \times 10^{7}\,\mathrm{s}$ (near $\pi \times 10^7$, a useful mnemonic). When you cannot anchor, bracket: find a value you are sure is too low and one you are sure is too high, and take their **geometric mean**, $\sqrt{ab}$. Between $300$ and $3000$ the geometric mean is $950$, about $1000$ — not the arithmetic mean $1650$, which sits far too close to the upper bound on a logarithmic scale. Bracketing an ullage (empty-space) fraction between $2\%$ and $10\%$ gives $\sqrt{0.02 \times 0.10} = 4.5\%$. Round each factor to one significant figure, or to the grid $1, 3, 10$ when one figure is more than you know.

**Multiply with the exponents kept separate.** Scientific notation or $\log_{10}$ bookkeeping, as in the last lesson. Keep two figures through the arithmetic and report one or two at the end; a Fermi estimate reported to four figures is a contradiction.

**Check and criticise.** Compare with anything you know — a published value, a different decomposition, a limiting case. Then list the assumptions and ask, for each, how much the answer would move if that assumption were off by its plausible range. The one that moves the answer most is the **dominant assumption**, and the honest statement of the result is "about $X$, dominated by my guess of $Y$".

## Why rough factors give a usable product

Multiplying uncertain factors sounds like a recipe for garbage. Logarithms say otherwise. If a factor is uncertain by a multiplicative factor $f$ — you believe the true value lies between $x/f$ and $xf$ — then its logarithm is uncertain by $\pm\log_{10} f$. Multiplying $k$ factors *adds* their logarithms, so the log of the product is uncertain by at most $k \log_{10} f$: the worst case is that the product is off by $f^k$. With four factors each good to $\pm 30\%$ ($f = 1.3$), the worst case is $1.3^4 = 2.9$, a factor of three.

But the worst case requires every error to fall the same way, and independent guesses do not conspire. If the errors are as likely high as low, they partly cancel, and the typical error in the log grows like $\sqrt{k}$ rather than $k$ — the same square-root law that governs random walks and will reappear in the statistics module. Four factors each good to $1.3$ then give a product typically good to $1.3^{\sqrt{4}} = 1.3^2 = 1.7$. Six factors each uncertain by a factor of two give a product typically off by $2^{\sqrt 6} = 5.5$, not $2^6 = 64$: still within an order of magnitude. That is why Fermi estimates work — the logarithm turns a multiplicative mess into an additive one, and additive errors of random sign average down.

Two consequences shape the method. First, one badly known factor spoils the product no matter how well the others are known, so effort goes to the worst factor, not the easiest. Second, a factor you know to $\pm 5\%$ contributes almost nothing to the uncertainty; do not waste time refining it. The dominant-assumption question is the practical face of this.

::: key Fermi estimation
Decompose the quantity into factors you can estimate, each to a factor of two or three; bracket uncertain ones and take the geometric mean $\sqrt{ab}$; multiply with exponents kept separate; report one or two figures; state every assumption; name the single assumption whose plausible range moves the answer most. Errors add in $\log_{10}$: $k$ factors each uncertain by a factor $f$ give at worst $f^{k}$, typically about $f^{\sqrt{k}}$.
:::

## Constants worth carrying in your head

A Fermi estimate is only as fast as your anchors. Everything below has appeared in this module; commit them to memory at one or two figures.

| Quantity | Value |
| --- | --- |
| Earth radius $R$ | $6.37 \times 10^{6}\,\mathrm{m}$ |
| Surface gravity, $g_0$ | $9.8\,\mathrm{m/s^2}$ |
| Earth $\mu = GM$ | $4.0 \times 10^{14}\,\mathrm{m^3/s^2}$ |
| Gravitational constant $G$ | $6.67 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$ |
| Sea-level pressure, density | $1.0 \times 10^{5}\,\mathrm{Pa}$, $1.2\,\mathrm{kg/m^3}$ |
| Low-orbit speed, period | $7.7\,\mathrm{km/s}$, $90\,\mathrm{min}$ |
| Orbit $\Delta v$ with losses | $9.4\,\mathrm{km/s}$ |
| Seconds in a year | $3.16 \times 10^{7}$ |
| Water, kerosene, liquid oxygen | $1000$, $810$, $1140\,\mathrm{kg/m^3}$ |
| Kerosene heat of combustion | $43\,\mathrm{MJ/kg}$ of fuel |
| Kerosene–oxygen $I_{sp}$ | $300\,\mathrm{s}$, so $v_e \approx 3\,\mathrm{km/s}$ |

## Worked estimates

::: example The mass of Earth's atmosphere
The whole atmosphere rests on the surface, so sea-level pressure is its weight per unit area: $p_0 = m g / A$. Rearranging, $m = p_0 A / g$ with $A = 4\pi R^2$ the surface area. Units: $\mathrm{Pa \cdot m^2 / (m/s^2)} = \mathrm{(N/m^2) \cdot m^2 \cdot s^2/m} = \mathrm{kg}$. Good.

Factors: $p_0 = 1.01 \times 10^{5}\,\mathrm{Pa}$; $A = 4\pi (6.37 \times 10^{6})^2 = 4\pi \times 4.06 \times 10^{13} = 5.1 \times 10^{14}\,\mathrm{m^2}$; $g = 9.8\,\mathrm{m/s^2}$. Then

$$
m = \frac{1.01 \times 10^{5} \times 5.1 \times 10^{14}}{9.8} = \frac{5.15}{9.8} \times 10^{19} = 5.3 \times 10^{18}\,\mathrm{kg} .
$$

The accepted value is $5.15 \times 10^{18}\,\mathrm{kg}$; the estimate is $2\%$ high. Here every factor was known well, so the estimate is better than Fermi accuracy. The residual comes from an assumption I did not state: that the surface is at sea level everywhere. Land stands above the sea, the mean surface pressure is a few percent below $p_0$, and the atmosphere weighs correspondingly less. Notice that the *method* found the dominant assumption for us — the only guess in the chain was the one that turned out to be off.
:::

::: example Propellant of a first stage from thrust and burn time
A first stage produces $7.6\,\mathrm{MN}$ of thrust and burns for about $160\,\mathrm{s}$. How much propellant does it hold?

Thrust is mass flow rate times exhaust velocity, $F = \dot{m} v_e$ (the dynamics module derives this; dimensionally, $\mathrm{kg/s \times m/s = N}$). So $\dot{m} = F / v_e$ and the propellant is $m_p = \dot{m}\, t_b = F t_b / v_e$. Units: $\mathrm{N \cdot s / (m/s) = kg}$. Take $v_e = I_{sp} g_0$ with a kerosene–oxygen $I_{sp}$ of $310\,\mathrm{s}$, so $v_e = 3040\,\mathrm{m/s}$:

$$
m_p = \frac{7.6 \times 10^{6} \times 160}{3.04 \times 10^{3}} = \frac{1.22 \times 10^{9}}{3.04 \times 10^{3}} = 4.0 \times 10^{5}\,\mathrm{kg} = 400\,\mathrm{t} .
$$

The published propellant load for the vehicle these numbers describe is about $411\,\mathrm{t}$; the estimate is $3\%$ low. Now criticise it. The thrust and burn time are quoted values, good to a few percent. The $I_{sp}$ is the guess: a sea-level $I_{sp}$ for this engine is closer to $282\,\mathrm{s}$ ($v_e = 2770\,\mathrm{m/s}$), and using that gives $m_p = 7.6 \times 10^{6} \times 160 / 2770 = 440\,\mathrm{t}$, $7\%$ high; the vacuum value is about $311\,\mathrm{s}$. The truth is in between because both thrust and $I_{sp}$ rise as the vehicle climbs out of the atmosphere, and I used a fixed thrust with a compromise $I_{sp}$. The dominant assumption is the effective exhaust velocity, and its plausible range ($2.8$–$3.1\,\mathrm{km/s}$) moves the answer by about $\pm 5\%$. This is also an independent check on the geometric estimate the module's exercise asks you to make from the stage's dimensions: two decompositions that agree to ten percent are worth more than either alone.
:::

::: example Propellant of a stage from its dimensions
A large kerosene–oxygen first stage is $10.1\,\mathrm{m}$ in diameter and $42\,\mathrm{m}$ long. Estimate its propellant mass.

Decompose: $m_p = (\text{tank volume}) \times (\text{mean propellant density})$, and tank volume $= (\text{fraction of stage length that is tank}) \times (\text{cylinder volume})$. Units: $\mathrm{m^3 \times kg/m^3 = kg}$.

*Cylinder volume:* $\tfrac{\pi}{4} d^2 L = 0.785 \times 102 \times 42 = 3.35 \times 10^{3}\,\mathrm{m^3}$.

*Tank fraction:* engines, thrust structure, the intertank section and the forward skirt take up length that holds no propellant. Bracket between $0.6$ (a lot of structure) and $0.8$ (a very tank-dominated stage); geometric mean $\sqrt{0.48} = 0.69$, call it $0.7$. Tank volume $\approx 2.35 \times 10^{3}\,\mathrm{m^3}$.

*Mean density:* the tanks hold kerosene at $810\,\mathrm{kg/m^3}$ and oxygen at $1141\,\mathrm{kg/m^3}$ in a mixture ratio of $2.27{:}1$ by mass. For every $1\,\mathrm{kg}$ of fuel there are $2.27\,\mathrm{kg}$ of oxidizer, total mass $3.27\,\mathrm{kg}$, occupying $\frac{1}{810} + \frac{2.27}{1141} = 1.235 \times 10^{-3} + 1.990 \times 10^{-3} = 3.22 \times 10^{-3}\,\mathrm{m^3}$. The mean density is

$$
\rho_{\text{mix}} = \frac{1 + O/F}{\dfrac{1}{\rho_f} + \dfrac{O/F}{\rho_{ox}}} = \frac{3.27}{3.22 \times 10^{-3}} = 1.01 \times 10^{3}\,\mathrm{kg/m^3} ,
$$

almost exactly water. (The same formula with the module exercise's $2.3{:}1$ gives $1.02 \times 10^{3}$.)

*Product:* $m_p \approx 2.35 \times 10^{3} \times 1.01 \times 10^{3} = 2.4 \times 10^{6}\,\mathrm{kg} = 2400\,\mathrm{t}$.

The stage described is the Saturn V first stage, whose published propellant load is about $2150\,\mathrm{t}$. The estimate is $11\%$ high — well inside a factor of $1.5$. Dominant assumption: the tank fraction. At $0.6$ the estimate is $2040\,\mathrm{t}$; at $0.8$ it is $2720\,\mathrm{t}$; the whole plausible range of that one guess spans $\pm 15\%$, while the density is known to a percent and the cylinder volume to a few. If I wanted a better answer, I would spend all my effort on the tank fraction — looking at a photograph of the stage and measuring where the tanks end — and none on the density. That the estimate came out high says the true tank fraction is nearer $0.63$, and indeed the domed tank ends and the intertank on that stage take more length than a $0.7$ guess allows.
:::

::: warning Do not tune the estimate to the answer
Once you know the published value, it is tempting to adjust the tank fraction until the numbers match and then present the result as an estimate. That is not estimation; it is fitting one free parameter to one data point, and it teaches you nothing about the next stage you meet. Make the guesses first, write them down, compute, and only then compare. If the comparison shows a guess was poor, say which and why. The point of the module's Fermi exercise is the explanation of the residual, not the residual itself.
:::

## Sanity checks and limiting cases

Beyond comparing to a published number, three cheap checks catch most bad estimates.

**Dimensional check.** If the units of your factor chain do not multiply to the unit you asked for, stop. This catches a forgotten factor faster than any amount of staring at the numbers.

**Order-of-magnitude anchors.** A first stage of a few hundred tonnes, a satellite of a few tonnes, an atmosphere of $10^{18}\,\mathrm{kg}$ against an Earth of $6 \times 10^{24}\,\mathrm{kg}$ — one millionth. If a result lands far from every anchor you have, either you have learned something or you have made an error, and the second is far more likely.

**Limiting cases.** Push a guess to an extreme and see if the answer behaves. If the tank fraction went to $1$, the stage would be all propellant and the estimate should rise to $3400\,\mathrm{t}$, which it does; if the mixture ratio went to zero, the density should fall to that of pure kerosene, which the formula gives. A decomposition that misbehaves at the extremes is wrong in the middle too.

### Energy as a check on the rocket equation

Here is an estimate that uses no vehicle data at all and still tells you something about launch. Putting one kilogram in low orbit means giving it kinetic energy $\tfrac{1}{2}v^2 = \tfrac{1}{2} (7.7 \times 10^{3})^2 = 3.0 \times 10^{7}\,\mathrm{J}$ and lifting it $400\,\mathrm{km}$ against roughly $9.5\,\mathrm{m/s^2}$, $g h \approx 3.8 \times 10^{6}\,\mathrm{J}$ — about $33\,\mathrm{MJ/kg}$ in total, the kinetic part dominating eight to one. Burning kerosene releases $43\,\mathrm{MJ}$ per kilogram of *fuel*, but the fuel is only $1/3.3$ of the propellant mass at a $2.3{:}1$ mixture ratio, so the propellant yields about $13\,\mathrm{MJ/kg}$. Even at perfect efficiency, then, each kilogram to orbit needs $33/13 = 2.5\,\mathrm{kg}$ of propellant. A real vehicle that lifts $23\,\mathrm{t}$ to orbit on about $500\,\mathrm{t}$ of propellant is delivering $23 \times 33 = 760\,\mathrm{GJ}$ of orbital energy from $500 \times 13 = 6500\,\mathrm{GJ}$ of chemical energy: about $12\%$ efficient. The rocket equation's exponential is the reason the other $88\%$ goes into accelerating propellant that is itself later thrown away, lifting the vehicle through the atmosphere, and heat. When someone claims a chemical launcher delivers $40\%$ of its propellant mass to orbit, this three-line estimate says no.

## Check yourself

::: check
Estimate the number of seconds in a year from the day and the calendar, and compare with the mnemonic $\pi \times 10^{7}$.
:::

::: answer
$365.25\,\mathrm{d} \times 24\,\mathrm{h/d} \times 3600\,\mathrm{s/h} = 365.25 \times 86\,400 = 3.156 \times 10^{7}\,\mathrm{s}$. The mnemonic gives $3.142 \times 10^{7}$, half a percent low — more than good enough for any estimate, and easy to remember.
:::

::: check
A satellite in a $92$-minute orbit: about how many times does it circle Earth in a day? Is the answer sensitive to the period?
:::

::: answer
$24 \times 60 / 92 = 1440 / 92 = 15.7$, so between fifteen and sixteen orbits a day. The period of any low orbit is between about $88$ and $100$ minutes, giving $14.4$ to $16.4$ orbits; the answer is "about fifteen" for every low-orbit satellite, so no, it is not sensitive — which is why "fifteen sunrises a day" is a safe thing to say about a space station.
:::

::: check
Estimate Earth's mean density from $g_0$, $R$ and $G$ alone, and comment on what it implies about the interior.
:::

::: answer
$g = GM/R^2$ and $M = \tfrac{4}{3}\pi R^3 \rho$, so $g = \tfrac{4}{3}\pi G R \rho$ and $\rho = \dfrac{3g}{4\pi G R} = \dfrac{3 \times 9.8}{4\pi \times 6.67 \times 10^{-11} \times 6.37 \times 10^{6}} = \dfrac{29.4}{5.34 \times 10^{-3}} = 5.5 \times 10^{3}\,\mathrm{kg/m^3}$. Units: $\mathrm{(m/s^2)/(m^3\,kg^{-1}\,s^{-2} \cdot m) = kg/m^3}$. Surface rock is about $2.7$–$3.0 \times 10^{3}\,\mathrm{kg/m^3}$, so the average is nearly twice that of the crust: the interior must be much denser, which is the first evidence for an iron core. The accepted value is $5.51 \times 10^{3}$.
:::

::: check
You estimate a quantity as the product of five factors. Three are known to $\pm 10\%$, one to a factor of $1.5$, one to a factor of $3$. Roughly how uncertain is the product, and where should you spend an hour of effort?
:::

::: answer
In $\log_{10}$: the three good factors contribute $\pm 0.04$ each, the factor-of-$1.5$ one $\pm 0.18$, the factor-of-$3$ one $\pm 0.48$. Adding in quadrature (random signs), $\sqrt{3(0.04)^2 + 0.18^2 + 0.48^2} = \sqrt{0.005 + 0.032 + 0.230} = 0.52$, so the product is uncertain by a factor of $10^{0.52} = 3.3$ — essentially the factor of three from the worst input alone. The hour goes entirely to the factor-of-three guess; halving its uncertainty would nearly halve the total, while perfecting the three $10\%$ factors would change almost nothing.
:::

::: check
Bracket the mass of a small liquid-fuelled upper stage's engine between "obviously too light" and "obviously too heavy" and give a Fermi value. Then state what you would look for to tighten it.
:::

::: answer
An engine producing tens of kilonewtons cannot weigh less than a motorcycle, $100\,\mathrm{kg}$, and clearly weighs less than a small car, $1000\,\mathrm{kg}$. Geometric mean: $\sqrt{100 \times 1000} = 316$, so about $300\,\mathrm{kg}$. To tighten it, you would look for a thrust-to-weight ratio for engines of that class — around $50$–$100$ is typical for pump-fed engines — and multiply the thrust in newtons by $1/(70 \times 9.8)$; for a $100\,\mathrm{kN}$ engine that gives about $150\,\mathrm{kg}$, inside the bracket and nearer its lower end. The bracket was honest; the anchor improved it.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Goal | the right size of answer, within a factor of two or three, with assumptions stated |
| Steps | define with units → decompose into estimable factors → estimate each → multiply with exponents separate → check and criticise |
| Bracketing | geometric mean $\sqrt{ab}$ of a sure-low and a sure-high bound |
| Error growth | logs add: worst $f^{k}$, typical $f^{\sqrt{k}}$ for $k$ factors each uncertain by $f$ |
| Dominant assumption | the factor whose plausible range moves the answer most; spend effort there |
| Mixture density | $\rho_{\text{mix}} = (1 + O/F)\big/\left(1/\rho_f + (O/F)/\rho_{ox}\right) \approx 1.0 \times 10^{3}\,\mathrm{kg/m^3}$ for kerosene–oxygen |
| Propellant from thrust | $m_p = F t_b / v_e$ |
| Atmosphere | $m = p_0 \cdot 4\pi R^2 / g \approx 5 \times 10^{18}\,\mathrm{kg}$ |
| Orbital energy | $\approx 33\,\mathrm{MJ/kg}$; kerosene–oxygen propellant $\approx 13\,\mathrm{MJ/kg}$; launch efficiency $\sim 10\%$ |
| Checks | units cancel; order-of-magnitude anchors; limiting cases behave |
| Honesty | guess first, compare second, never tune to the answer |

This closes the module. Everything after it — trigonometry, vectors, calculus, dynamics — assumes you can rearrange a formula without error, keep units and figures honest, and say roughly what a number should be before you compute it. When a later derivation feels slippery, the fault is usually in one of these lessons, and the fix is to come back and redo the check-yourself questions until they are boring.
