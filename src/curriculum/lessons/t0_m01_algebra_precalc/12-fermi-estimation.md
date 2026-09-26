---
id: l12-fermi-estimation
title: Order-of-magnitude estimation
minutes: 27
covers:
  - order-of-magnitude (Fermi) estimation
---

In 1945, at the first test of an atomic bomb, the physicist [[Enrico Fermi|who-fermi]] dropped scraps of paper as the blast wave passed. From how far they blew, he estimated the bomb's energy at about ten kilotons (as much as ten thousand tonnes of TNT explosive). The instruments later said about twenty. He was within a factor of two, in seconds, with no equipment. That is the standard an **order-of-magnitude estimate** — also called a **[[Fermi estimate|piano-tuners]]** — aims at. Not the exact answer, but the right *size* of answer, with every assumption written down.

In guidance and navigation work you will do this daily. A simulation prints a stage propellant mass of $4100\,\mathrm{t}$. Is that believable, or did a unit slip? A colleague proposes a manoeuvre needing $3\,\mathrm{km/s}$ of speed change. Roughly how much of the spacecraft would be propellant? Before trusting a computer, a spreadsheet or a supplier, you should be able to say what the number ought to be, within a factor of a few, from things you already know.

There is no new maths here — only scientific notation, units, exponents, logarithms and the habit of writing assumptions down. What is new is the attitude: break the unknown into pieces you can guess, guess each honestly, multiply, and ask which guess the answer depends on most. The maths is deliberately rough; the care goes into the bookkeeping. This lesson ends with the skill the module's Fermi exercise grades you on: naming the one assumption that dominates your error.

## The method

Here is a problem you might meet before a school party: how many pizzas should you order? You do not know the answer, but you can guess the pieces. About $90$ kids are coming. Each eats about $3$ slices. A pizza has $8$ slices. So you need about $90 \times 3 / 8 \approx 34$ pizzas. No guess is exact, but the answer is clearly "a few dozen", not "five" or "five hundred". That is a Fermi estimate. Engineers do it in five steps.

**1. State the quantity precisely, with its unit.** "How big is a first stage?" is not a question. "What is the propellant mass of a first stage, in tonnes?" is. The unit tells you what your chain of factors must multiply out to. **Dimensional homogeneity** — every term in an equation must have the same units — will then police your working.

**2. [[Break it into factors|estimate-tree]] you can estimate.** Rewrite the unknown as numbers multiplied or divided together, each one something you know or can guess to within a factor of two or three. A mass is a volume times a density. A volume is a cross-section times a length. A rate times a time is an amount. Write the chain with units, and check the units cancel down to the one you want. If they do not, the breakdown is wrong, however sensible the numbers look.

**3. Estimate each factor.** Anchor on things you know: a person is about $70\,\mathrm{kg}$, water is $1000\,\mathrm{kg/m^3}$, low orbit is $7.7\,\mathrm{km/s}$, a year is $3.16 \times 10^{7}\,\mathrm{s}$ (close to $\pi \times 10^7$, an easy way to remember it).

When you cannot anchor, **bracket**. Find a value you are sure is too low and one you are sure is too high. Then take their **[[geometric mean|geo-mean]]**, $\sqrt{ab}$ — multiply the two and take the square root. Between $300$ and $3000$ the geometric mean is $\sqrt{300 \times 3000} = \sqrt{900\,000} \approx 950$, about $1000$.

Why not the ordinary average, $1650$? When you are unsure by a big factor, what matters is "how many *times* too big or small", not "how much". The geometric mean is as many times above the low guess as below the high one: $950$ is about three times $300$, and $3000$ is about three times $950$. The average is five and a half times the low guess but under twice below the high one, so it leans too far up.

Another: the **[[ullage|ullage-word]]** of a tank is the empty space left above the liquid (tanks are never filled to the brim). Bracketing an ullage fraction between $2\%$ and $10\%$ gives $\sqrt{0.02 \times 0.10} = 4.5\%$. Round each factor to one significant figure, or to the steps $1, 3, 10$ when even one figure is more than you know.

**4. Multiply, keeping the exponents separate.** Use scientific notation, or add $\log_{10}$ values, as in the last lesson. Keep two figures while you work and report one or two at the end. A Fermi estimate reported to four figures contradicts itself.

**5. Check and criticise.** Compare with anything you know: a published value, a different breakdown, an extreme case. Then list your assumptions. For each, ask: if this guess were off by as much as it plausibly could be, how much would the answer move? The one that moves the answer most is the **dominant assumption**. The honest way to state a result is "about $X$, dominated by my guess of $Y$".

::: example Heartbeats in a lifetime
How many times does a heart beat in a lifetime? The unit is plain "beats", a count.

**Break it down:** beats $=$ (beats per minute) $\times$ (minutes per year) $\times$ (years). Units: $\mathrm{beats/min} \times \mathrm{min/year} \times \mathrm{years} = \mathrm{beats}$.

**Estimate:** a resting heart beats about $70$ times a minute. A year has $60 \times 24 \times 365.25 = 525\,960$ minutes, about $5.3 \times 10^{5}$. A lifetime is about $80$ years.

**Multiply:** $70 \times 5.3 \times 10^{5} \times 80$. The plain numbers give $70 \times 80 = 5600$, and $5600 \times 5.3 = 29\,680$. Put the powers of ten back and the total is about $2.97 \times 10^{9}$: roughly three billion beats.

**Criticise:** the minutes per year is exact, so it adds no error. The lifespan might be $70$ to $90$ years — about $\pm 12\%$. The heart rate might average anywhere from $60$ to $100$ over a life that includes sleep and sport — about $-14\%$ to $+43\%$. The heart rate is the dominant assumption. If you wanted a better answer, that is the one guess worth improving.
:::

## Why rough factors give a usable product

Multiplying a pile of rough guesses sounds like a recipe for garbage. It is not, and logarithms show why.

Flip six coins and all heads is rare; usually heads and tails partly balance out. Errors in **independent** guesses — guesses that do not affect each other — behave the same way: some guesses come out too high, some too low, and they partly cancel.

Now the precise version. Say a factor is uncertain by a multiplying factor $f$: you believe the true value lies somewhere between $x/f$ and $xf$. (For example, $f = 2$ means "somewhere between half and double my guess".) Then its logarithm is uncertain by $\pm\log_{10} f$. Multiplying $k$ factors *adds* their logarithms. So in the worst case the logarithm of the product is off by $k \log_{10} f$, which means the product is off by a factor of $f^k$. With four factors each good to $\pm 30\%$ ($f = 1.3$), the worst case is $1.3^4 = 2.9$, a factor of three.

But the worst case needs every error to go the same way, and independent guesses do not team up. When errors are as likely high as low, the typical error in the logarithm grows like $\sqrt{k}$ instead of $k$. This is the same square-root law that governs [[random walks|random-walk]], and it comes back in the statistics module.

- Four factors each good to $1.3$ give a product typically good to $1.3^{\sqrt{4}} = 1.3^2 = 1.7$.
- Six factors each uncertain by a factor of two give a product typically off by $2^{\sqrt 6} = 5.5$ — not $2^6 = 64$. Still within an order of magnitude.

That is why Fermi estimates work. The logarithm turns a multiplying mess into an adding one, and added errors of random sign average down.

::: note Why the square root?
Suppose each factor's log-error has size $s$, equally likely to be $+s$ or $-s$, independently. The total error is the sum of $k$ such errors. Square that sum and average over many tries. Each error times itself gives $s^2$, and there are $k$ of those. Each error times a *different* one, like $(+s)(-s)$, is as often negative as positive, so those average to zero. That leaves $k s^2$. The typical total error is the square root of that, $s\sqrt{k}$. Adding errors this way — square, add, take the root — is called adding **in quadrature**.
:::

Two lessons follow. First, one badly known factor spoils the product no matter how well you know the others, so work on the worst factor, not the easiest. Second, a factor you already know to $\pm 5\%$ adds almost nothing to the uncertainty, so do not waste time polishing it. The dominant-assumption question is the practical side of this.

::: key Fermi estimation
Decompose the quantity into factors you can estimate, each to a factor of two or three; bracket uncertain ones and take the geometric mean $\sqrt{ab}$; multiply with exponents kept separate; report one or two figures; state every assumption; name the single assumption whose plausible range moves the answer most. Errors add in $\log_{10}$: $k$ factors each uncertain by a factor $f$ give at worst $f^{k}$, typically about $f^{\sqrt{k}}$.
:::

## Constants worth carrying in your head

A Fermi estimate is only as fast as your anchors. Everything below has appeared in this module; learn each to one or two figures.

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

(The last row uses $v_e = I_{sp}\, g_0$ from the logarithms lesson: specific impulse times standard gravity gives the exhaust speed.)

## Worked estimates

::: example The mass of Earth's atmosphere
Air pressure is the weight of all the air above you, pressing down on each square metre. So sea-level pressure is the atmosphere's weight divided by Earth's surface area: $p_0 = m g / A$. Here $m$ is the atmosphere's mass, $g$ is gravity, and $A = 4\pi R^2$ is the area of a sphere of radius $R$.

**Rearrange** to get the mass: multiply both sides by $A$ and divide by $g$, giving $m = p_0 A / g$.

**Units:** $\mathrm{Pa \cdot m^2 / (m/s^2)} = \mathrm{(N/m^2) \cdot m^2 \cdot s^2/m} = \mathrm{kg}$, because a newton is a $\mathrm{kg \cdot m/s^2}$. Good.

**Factors:** $p_0 = 1.01 \times 10^{5}\,\mathrm{Pa}$. The area is $A = 4\pi (6.37 \times 10^{6})^2 = 4\pi \times 4.06 \times 10^{13} = 5.1 \times 10^{14}\,\mathrm{m^2}$. And $g = 9.8\,\mathrm{m/s^2}$. Then

$$
m = \frac{1.01 \times 10^{5} \times 5.1 \times 10^{14}}{9.8} = \frac{5.15}{9.8} \times 10^{19} = 5.3 \times 10^{18}\,\mathrm{kg} .
$$

**Compare:** the accepted value is $5.15 \times 10^{18}\,\mathrm{kg}$, so the estimate is $2\%$ high — better than Fermi accuracy, because every factor was well known.

**Criticise:** the leftover $2\%$ comes from an assumption I did not state — that the ground is at sea level everywhere. Land stands above the sea, so the average pressure at the ground is a few percent below $p_0$, and the atmosphere weighs a little less. The *method* found the dominant assumption for us: the only guess in the chain was the one that turned out to be off.
:::

::: example Propellant of a first stage from thrust and burn time
A first stage pushes with a **thrust** of $7.6\,\mathrm{MN}$ (meganewtons) and burns for about $160\,\mathrm{s}$ — its **burn time**. How much propellant does it hold?

**The idea.** An engine pushes by throwing mass out of the back fast. Thrust is the **mass flow rate** $\dot{m}$ (read "m dot": kilograms thrown out per second) times the **exhaust velocity** $v_e$ (how fast it leaves): $F = \dot{m} v_e$. The dynamics module derives this. For now, check the units: $\mathrm{kg/s \times m/s} = \mathrm{kg \cdot m/s^2} = \mathrm{N}$.

**Rearrange.** The flow rate is $\dot{m} = F / v_e$. Over the whole burn, the propellant used is flow rate times time:

$$
m_p = \dot{m}\, t_b = \frac{F\, t_b}{v_e}.
$$

Units: $\mathrm{N \cdot s / (m/s)} = \mathrm{kg}$.

**Estimate $v_e$.** Take $v_e = I_{sp}\, g_0$ with a kerosene–oxygen **specific impulse** $I_{sp}$ (the engine-efficiency number from the logarithms lesson, in seconds) of $310\,\mathrm{s}$, so $v_e = 310 \times 9.80665 \approx 3040\,\mathrm{m/s}$.

**Multiply:**

$$
m_p = \frac{7.6 \times 10^{6} \times 160}{3.04 \times 10^{3}} = \frac{1.22 \times 10^{9}}{3.04 \times 10^{3}} = 4.0 \times 10^{5}\,\mathrm{kg} = 400\,\mathrm{t} .
$$

**Compare:** the published propellant load for the vehicle these numbers describe is about $411\,\mathrm{t}$. The estimate is $3\%$ low.

**Criticise.** The thrust and burn time are published figures, good to a few percent. The $I_{sp}$ is the guess. At sea level this engine's $I_{sp}$ is closer to $282\,\mathrm{s}$ ($v_e = 2770\,\mathrm{m/s}$), which gives $m_p = 7.6 \times 10^{6} \times 160 / 2770 = 440\,\mathrm{t}$, $7\%$ high. In vacuum it is about $311\,\mathrm{s}$. The truth is in between, because both thrust and $I_{sp}$ rise as the rocket climbs out of the air, and I used a fixed thrust with an in-between $I_{sp}$.

So the dominant assumption is the effective exhaust velocity: its plausible range, $2.8$–$3.1\,\mathrm{km/s}$, moves the answer by about $\pm 5\%$. This is also an independent check on the size-based estimate the module's exercise asks for. Two different breakdowns that agree to ten percent are worth more than either alone.
:::

First, [[the parts of a liquid-fuelled stage|stage-anatomy]]. It is mostly two tall **tanks**, one of fuel and one of oxidizer, stacked end to end. Each tank is a cylinder closed by rounded **domes** at top and bottom, and the curve of a dome wastes some length. Between the two tanks there is often an **intertank** — a short empty section of hull joining them. Some stages avoid it with a **[[common bulkhead|common-bulkhead]]**: one shared dome that is the bottom of one tank and the top of the other, which saves length and mass. Below the tanks sit the engines and the **thrust structure** that carries their push into the stage. And each tank keeps some ullage, the empty space above the liquid.

::: example Propellant of a stage from its dimensions
A large kerosene–oxygen first stage is $10.1\,\mathrm{m}$ across and $42\,\mathrm{m}$ long. Estimate its propellant mass.

**Break it down:** $m_p = (\text{tank volume}) \times (\text{mean propellant density})$, and tank volume $= (\text{fraction of the stage's length that is tank}) \times (\text{cylinder volume})$. Units: $\mathrm{m^3 \times kg/m^3 = kg}$.

**Cylinder volume.** A cylinder's volume is its end area times its length. The end is a circle of diameter $d$, with area $\tfrac{\pi}{4} d^2$. So the volume is $\tfrac{\pi}{4} d^2 L = 0.785 \times 102 \times 42 = 3.37 \times 10^{3}\,\mathrm{m^3}$ (using $10.1^2 \approx 102$).

**Tank fraction.** Engines, thrust structure, intertank, domes and the forward skirt (the short hull section on top that joins the next stage) take up length that holds no propellant. Bracket between $0.6$ (a lot of structure) and $0.8$ (almost all tank). The geometric mean is $\sqrt{0.6 \times 0.8} = \sqrt{0.48} = 0.69$; call it $0.7$. Tank volume $\approx 0.7 \times 3370 \approx 2.36 \times 10^{3}\,\mathrm{m^3}$.

**Mean density.** The tanks hold kerosene at $810\,\mathrm{kg/m^3}$ and oxygen at $1141\,\mathrm{kg/m^3}$, in a mixture ratio of $2.27{:}1$ by mass. Take $1\,\mathrm{kg}$ of fuel. With it go $2.27\,\mathrm{kg}$ of oxidizer, $3.27\,\mathrm{kg}$ in all. Each liquid's volume is its mass divided by its density:

$$
\frac{1}{810} + \frac{2.27}{1141} = 1.235 \times 10^{-3} + 1.990 \times 10^{-3} = 3.22 \times 10^{-3}\,\mathrm{m^3}.
$$

The mean density is total mass over total volume — the bulk density from the first lesson:

$$
\rho_{\text{mix}} = \frac{1 + O/F}{\dfrac{1}{\rho_f} + \dfrac{O/F}{\rho_{ox}}} = \frac{3.27}{3.22 \times 10^{-3}} = 1.01 \times 10^{3}\,\mathrm{kg/m^3} ,
$$

almost exactly the density of water. (The same formula with the module exercise's $2.3{:}1$ gives $1.02 \times 10^{3}$.)

**Multiply:** $m_p \approx 2.36 \times 10^{3} \times 1.01 \times 10^{3} = 2.4 \times 10^{6}\,\mathrm{kg} = 2400\,\mathrm{t}$.

**Compare:** the stage described is [[the Saturn V first stage|s-ic]], whose published propellant load is about $2150\,\mathrm{t}$. The estimate is $11\%$ high — well inside a factor of $1.5$.

**Criticise.** The dominant assumption is the tank fraction. At $0.6$ the estimate is $2050\,\mathrm{t}$; at $0.8$ it is $2730\,\mathrm{t}$. That one guess swings the answer by about $\pm 15\%$, while the density is known to a percent and the cylinder volume to a few. To do better, I would spend all my effort on the tank fraction — measuring where the tanks end on a photograph of the stage — and none on the density. The estimate came out high, which says the true tank fraction is nearer $0.63$. Indeed, that stage's domed tank ends and intertank take up more length than a $0.7$ guess allows.
:::

::: warning Do not tune the estimate to the answer
Once you know the published value, it is tempting to nudge the tank fraction until the numbers match and call the result an estimate. That is fitting one adjustable number to one data point, and it teaches you nothing about the next stage you meet. Make the guesses first, write them down, compute, and only then compare. If a guess turns out poor, say which one and why. The point of the module's Fermi exercise is the explanation of the error, not the error itself.
:::

## Sanity checks and extreme cases

Besides comparing with a published number, three cheap checks catch most bad estimates:

**Units check.** If the units of your chain do not multiply out to the unit you asked for, stop. This catches a forgotten factor faster than staring at the numbers.

**Order-of-magnitude anchors.** A first stage of a few hundred tonnes. A satellite of a few tonnes. An atmosphere of $10^{18}\,\mathrm{kg}$ against an Earth of $6 \times 10^{24}\,\mathrm{kg}$ — one millionth. If a result lands far from every anchor, either you have learned something or made a mistake — and the mistake is far more likely.

**Limiting cases.** Push a guess to an extreme and see whether the answer behaves. If the tank fraction went to $1$, the stage would be all propellant, and the estimate should rise to $3400\,\mathrm{t}$ — which it does. If the mixture ratio went to zero, the density should fall to that of pure kerosene, and the formula gives exactly that. A breakdown that misbehaves at the extremes is wrong in the middle too.

### Energy as a check on launch

This estimate uses no rocket data at all and still tells you something about launch.

**Energy to reach orbit.** Putting one kilogram in low orbit means giving it **kinetic energy** (energy of motion) of $\tfrac{1}{2}v^2 = \tfrac{1}{2} (7.7 \times 10^{3})^2 = 3.0 \times 10^{7}\,\mathrm{J}$. (The joule, J, is the unit of energy; an MJ is a million joules and a GJ a billion.) It also means lifting it $400\,\mathrm{km}$ against gravity of roughly $9.5\,\mathrm{m/s^2}$ (a little weaker up high), which costs $g h \approx 3.8 \times 10^{6}\,\mathrm{J}$. Together that is about $33\,\mathrm{MJ}$ per kilogram, with the motion part winning eight to one.

**Energy in the propellant.** Burning kerosene releases $43\,\mathrm{MJ}$ per kilogram of *fuel*. But at a $2.3{:}1$ mixture ratio the fuel is only $1/3.3$ of the propellant mass, so the propellant yields about $43 / 3.3 \approx 13\,\mathrm{MJ/kg}$.

**Compare.** Even at perfect efficiency, each kilogram put in orbit needs $33 / 13 \approx 2.5\,\mathrm{kg}$ of propellant. A real vehicle that lifts $23\,\mathrm{t}$ to orbit on about $500\,\mathrm{t}$ of propellant delivers $23 \times 33 \approx 760\,\mathrm{GJ}$ of orbital energy from $500 \times 13 = 6500\,\mathrm{GJ}$ of chemical energy. That is about $12\%$ efficient.

The other $88\%$ goes into speeding up propellant that is itself thrown away later — the exponential in the rocket equation — plus pushing through the air, and heat. So when someone claims a chemical rocket puts $40\%$ of its propellant mass into orbit, this three-line estimate says no.

## Check yourself

::: check
Estimate the number of seconds in a year from the length of a day and the calendar, and compare with the memory aid $\pi \times 10^{7}$.
:::

::: answer
$365.25\,\mathrm{d} \times 24\,\mathrm{h/d} \times 3600\,\mathrm{s/h}$. First, $24 \times 3600 = 86\,400$ seconds in a day. Then $365.25 \times 86\,400 = 3.156 \times 10^{7}\,\mathrm{s}$.

The memory aid gives $3.142 \times 10^{7}$, half a percent low — good enough for any estimate.
:::

::: check
A satellite is in a $92$-minute orbit. About how many times does it circle Earth in a day? Does the answer depend much on the exact period?
:::

::: answer
A day has $24 \times 60 = 1440$ minutes, and $1440 / 92 = 15.7$, so between fifteen and sixteen orbits a day.

Every low orbit has a period between about $88$ and $100$ minutes, giving $14.4$ to $16.4$ orbits. So "about fifteen" fits every low-orbit satellite; the answer barely depends on the period. That is why "fifteen sunrises a day" is a safe thing to say about a space station.
:::

::: check
Estimate Earth's average density from $g_0$, $R$ and $G$ alone. What does the answer tell you about Earth's inside?
:::

::: answer
Gravity at the surface is $g = GM/R^2$. Earth's mass is its volume times its density, $M = \tfrac{4}{3}\pi R^3 \rho$. Substitute this $M$ into the first formula and cancel $R^2$ against $R^3$, leaving one $R$: $g = \tfrac{4}{3}\pi G R \rho$. Solve for the density by multiplying both sides by $3$ and dividing by $4\pi G R$:

$$
\rho = \dfrac{3g}{4\pi G R} = \dfrac{3 \times 9.8}{4\pi \times 6.67 \times 10^{-11} \times 6.37 \times 10^{6}} = \dfrac{29.4}{5.34 \times 10^{-3}} = 5.5 \times 10^{3}\,\mathrm{kg/m^3}.
$$

Units: $\mathrm{(m/s^2)/(m^3\,kg^{-1}\,s^{-2} \cdot m) = kg/m^3}$.

Surface rock is about $2.7$–$3.0 \times 10^{3}\,\mathrm{kg/m^3}$, so the average is nearly twice that of the crust. The inside must be much denser — the first evidence for an iron core. The accepted value is $5.51 \times 10^{3}$.
:::

::: check
You estimate a quantity as the product of five factors. Three are known to $\pm 10\%$, one to a factor of $1.5$, and one to a factor of $3$. Roughly how uncertain is the product, and where should you spend an hour of effort?
:::

::: answer
Work in $\log_{10}$. The three good factors contribute $\log_{10} 1.1 \approx 0.04$ each, the factor-of-$1.5$ one $\log_{10} 1.5 \approx 0.18$, and the factor-of-$3$ one $\log_{10} 3 \approx 0.48$.

Adding in quadrature (random signs):

$$
\sqrt{3(0.04)^2 + 0.18^2 + 0.48^2} = \sqrt{0.005 + 0.032 + 0.230} = 0.52.
$$

So the product is uncertain by a factor of $10^{0.52} = 3.3$ — almost exactly the factor of three from the worst input alone. The hour goes entirely to the factor-of-three guess. Halving its uncertainty would nearly halve the total, while perfecting the three $10\%$ factors would change almost nothing.
:::

::: check
Bracket the mass of the engine on a small liquid-fuelled upper stage between "certainly too light" and "certainly too heavy", and give a Fermi value. Then say what you would look for to tighten it.
:::

::: answer
An engine producing tens of kilonewtons of thrust cannot weigh less than a motorcycle, $100\,\mathrm{kg}$, and clearly weighs less than a small car, $1000\,\mathrm{kg}$. Geometric mean: $\sqrt{100 \times 1000} = 316$, so about $300\,\mathrm{kg}$.

To tighten it, look for the thrust-to-weight ratio of engines in that class — around $50$–$100$ is typical for pump-fed engines. Taking $70$, the engine's weight is its thrust divided by $70$, and its mass is that weight divided by $9.8$. For a $100\,\mathrm{kN}$ engine, $100\,000 / (70 \times 9.8) \approx 150\,\mathrm{kg}$: inside the bracket, nearer its low end. The bracket was honest; the anchor improved it.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Goal | the right size of answer, within a factor of two or three, with assumptions stated |
| Steps | define with units → break into estimable factors → estimate each → multiply with exponents separate → check and criticise |
| Bracketing | geometric mean $\sqrt{ab}$ of a sure-low and a sure-high bound |
| Error growth | logs add: worst $f^{k}$, typical $f^{\sqrt{k}}$ for $k$ factors each uncertain by $f$ |
| Dominant assumption | the factor whose plausible range moves the answer most; spend effort there |
| Mixture density | $\rho_{\text{mix}} = (1 + O/F)\big/\left(1/\rho_f + (O/F)/\rho_{ox}\right) \approx 1.0 \times 10^{3}\,\mathrm{kg/m^3}$ for kerosene–oxygen |
| Propellant from thrust | $m_p = F t_b / v_e$ |
| Atmosphere | $m = p_0 \cdot 4\pi R^2 / g \approx 5 \times 10^{18}\,\mathrm{kg}$ |
| Orbital energy | $\approx 33\,\mathrm{MJ/kg}$; kerosene–oxygen propellant $\approx 13\,\mathrm{MJ/kg}$; launch efficiency $\sim 10\%$ |
| Checks | units cancel; order-of-magnitude anchors; extreme cases behave |
| Honesty | guess first, compare second, never tune to the answer |

This closes the module. The next module, trigonometry, and everything after it — vectors, calculus, dynamics — assumes you can rearrange a formula without slips, keep units and figures honest, and say roughly what a number should be before you compute it. When a later derivation feels slippery, the fault is usually in one of these lessons. The fix is to come back and redo the check-yourself questions until they are boring.

::: context who-fermi Who Fermi was
Enrico Fermi (1901–1954) was an Italian physicist who won the Nobel Prize in 1938 and then moved to the United States. In 1942, in a squash court under the stands of a football field in Chicago, his team started the world's first nuclear reactor. He was famous for being equally strong at theory and at experiment — rare in physics — and for quick, rough calculations on scraps of paper. The element fermium is named after him.
:::

::: context piano-tuners How many piano tuners in Chicago?
Fermi liked to ask students questions like "How many piano tuners are there in Chicago?" Nobody knows offhand, but you can guess the pieces: about three million people in about a million households; perhaps one household in five with a piano, each tuned about once a year; a tuner managing about four a day, a thousand a year. That gives $200\,000 / 1000 = 200$ tuners. The exact answer is not the point. The point is that an impossible-sounding question falls apart into pieces that are each easy to guess.
:::

::: context estimate-tree An estimate is a tree
Put the unknown at the top and the pieces you can guess underneath, with the operation on each branch. Here is the pizza estimate drawn that way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
<g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="45" x2="60" y2="92"/><line x1="180" y1="45" x2="180" y2="92"/><line x1="180" y1="45" x2="300" y2="92"/>
  </g>
  <rect x="105.0" y="15.0" width="150" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="180" y="34">pizzas ≈ 34</text></g>
  <rect x="10.0" y="92.0" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="60" y="108">kids</text><text x="60" y="124">90</text></g>
  <rect x="130.0" y="92.0" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="180" y="108">slices per kid</text><text x="180" y="124">3</text></g>
  <rect x="250.0" y="92.0" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="300" y="108">slices per pizza</text><text x="300" y="124">8</text></g>
  <g font-size="16" fill="#b4232c" text-anchor="middle"><text x="120" y="117">×</text><text x="240" y="117">÷</text></g>
  <text x="180" y="152" font-size="12" fill="#1f2a44" text-anchor="middle">90 × 3 ÷ 8 = 33.75, about 34</text>
</svg>
```

Bigger estimates just grow deeper trees. Any branch you cannot guess gets broken down again, until every leaf is something you know or can bracket.
:::

::: context geo-mean Halfway in times, not in steps
On a log scale the geometric mean sits exactly in the middle of the bracket, while the ordinary average sits well to the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 168" font-family="Inter, Arial, sans-serif">
<text x="180" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">log scale: equal widths are equal factors</text>
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.2"><line x1="30.0" y1="94" x2="30.0" y2="106"/><line x1="75.2" y1="98" x2="75.2" y2="102"/><line x1="101.6" y1="98" x2="101.6" y2="102"/><line x1="120.3" y1="98" x2="120.3" y2="102"/><line x1="134.8" y1="98" x2="134.8" y2="102"/><line x1="146.7" y1="98" x2="146.7" y2="102"/><line x1="156.8" y1="98" x2="156.8" y2="102"/><line x1="165.5" y1="98" x2="165.5" y2="102"/><line x1="173.1" y1="98" x2="173.1" y2="102"/><line x1="180.0" y1="94" x2="180.0" y2="106"/><line x1="225.2" y1="98" x2="225.2" y2="102"/><line x1="251.6" y1="98" x2="251.6" y2="102"/><line x1="270.3" y1="98" x2="270.3" y2="102"/><line x1="284.8" y1="98" x2="284.8" y2="102"/><line x1="296.7" y1="98" x2="296.7" y2="102"/><line x1="306.8" y1="98" x2="306.8" y2="102"/><line x1="315.5" y1="98" x2="315.5" y2="102"/><line x1="323.1" y1="98" x2="323.1" y2="102"/><line x1="330.0" y1="94" x2="330.0" y2="106"/></g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="30.0" y="120">100</text><text x="180.0" y="120">1000</text><text x="330.0" y="120">10 000</text>
  </g>
  <g fill="#1f2a44"><circle cx="101.6" cy="100" r="5"/><circle cx="251.6" cy="100" r="5"/></g>
  <circle cx="176.6" cy="100" r="5" fill="#1d6fd1"/>
  <circle cx="212.6" cy="100" r="5" fill="#b4232c"/>
  <g font-size="12" text-anchor="middle">
    <text x="101.6" y="140" fill="#1f2a44">low 300</text>
    <text x="251.6" y="140" fill="#1f2a44">high 3000</text>
    <text x="164.6" y="140" fill="#1d6fd1">√ab ≈ 950</text>
    <text x="220.6" y="160" fill="#b4232c">average 1650</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <path d="M101.6,88 Q139.1,58 176.6,88"/>
    <path d="M176.6,88 Q214.1,58 251.6,88"/>
  </g>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="139.1" y="62">×3.16</text><text x="214.1" y="62">×3.16</text>
  </g>
</svg>
```

When you are unsure even of the first digit, "how many times off" is the fair way to measure a miss — so the middle in times is the fair guess.
:::

::: context ullage-word A word from the wine cellar
Ullage is an old wine-trade word: it meant how far a cask falls short of full, from an Old French word for topping a cask up to the brim. Rockets care about it for two reasons. Liquids expand as they warm, so tanks need room to spare. And in weightlessness the propellant floats about inside the tank, so some upper stages first fire small **ullage motors**, nudging the stage forward so the liquid settles over the engine's inlet before the main engine lights.
:::

::: context random-walk The random walk
Stand on a line and flip a coin: heads, one step right; tails, one step left. After $100$ flips, how far from the start are you? Not $100$ steps — that needs every flip to agree — and usually not zero either. Typically about $\sqrt{100} = 10$ steps. The steps partly cancel, just like independent guessing errors. The same law describes a drop of ink spreading through water, and the slow drift of a spacecraft's navigation when its sensor errors are random.
:::

::: context stage-anatomy Inside a stage
A liquid-fuelled first stage, drawn lying on its side. In many kerosene stages, including the Saturn V's first stage and Falcon 9's, the oxidizer tank sits on top.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 152" font-family="Inter, Arial, sans-serif">
<text x="180" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">a first stage on its side, nose to the left</text>
  <rect x="20" y="55" width="285" height="50" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M59,57 L161,57 Q174,57 174,80.0 Q174,103 161,103 L59,103 Q46,103 46,80.0 Q46,57 59,57 Z" fill="#8fb8f0"/>
  <path d="M59,57 Q46,57 46,80.0 Q46,103 59,103 L66,103 L66,57 Z" fill="#fff"/>
  <path d="M59,57 L161,57 Q174,57 174,80.0 Q174,103 161,103 L59,103 Q46,103 46,80.0 Q46,57 59,57 Z" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M219,57 L265,57 Q278,57 278,80.0 Q278,103 265,103 L219,103 Q206,103 206,80.0 Q206,57 219,57 Z" fill="#8fb8f0"/>
  <path d="M219,57 Q206,57 206,80.0 Q206,103 219,103 L220,103 L220,57 Z" fill="#fff"/>
  <path d="M219,57 L265,57 Q278,57 278,80.0 Q278,103 265,103 L219,103 Q206,103 206,80.0 Q206,57 219,57 Z" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="55" x2="45" y2="105" stroke="#1f2a44" stroke-width="1"/>
  <line x1="175" y1="55" x2="175" y2="105" stroke="#1f2a44" stroke-width="1"/>
  <line x1="205" y1="55" x2="205" y2="105" stroke="#1f2a44" stroke-width="1"/>
  <rect x="280" y="55" width="25" height="50" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="305,70 342,56 342,104 305,90" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="44">oxidizer tank</text>
    <text x="242" y="44">fuel tank</text>
    <text x="323" y="44">engines</text>
    <text x="32" y="124">skirt</text>
    <text x="190" y="124">intertank</text>
    <text x="292" y="124">thrust structure</text>
  </g>
  <line x1="58" y1="80" x2="70" y2="134" stroke="#6c7a93" stroke-width="1"/>
  <text x="74" y="142" font-size="11" fill="#6c7a93">ullage (empty space)</text>
</svg>
```

Only the blue holds propellant. The skirt, intertank, thrust structure, engines, the ullage and the corners around the rounded domes are the length your tank-fraction guess has to leave out.
:::

::: context common-bulkhead One wall for two tanks
A common bulkhead is harder to build than it sounds. The liquids on either side can be at very different temperatures: liquid oxygen at about $-183\,^\circ\mathrm{C}$ and, in hydrogen stages, liquid hydrogen at about $-253\,^\circ\mathrm{C}$. The shared wall has to stop heat flowing across, or the hydrogen boils and the oxygen freezes. The Saturn V's second and third stages used insulated common bulkheads between their hydrogen and oxygen, saving the length and mass of an intertank.
:::

::: context s-ic Meet the S-IC
The Saturn V's first stage was called the S-IC, and Boeing built it. Its five F-1 engines together gave about $7.5$ million pounds-force of thrust at lift-off — about $33\,\mathrm{MN}$, more than four times the stage in the previous example. It burned for about two and a half minutes, lifting the Apollo crews to roughly $65\,\mathrm{km}$, then dropped away and fell into the Atlantic Ocean.
:::
