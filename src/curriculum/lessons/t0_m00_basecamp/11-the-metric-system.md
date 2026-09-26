---
id: l11-the-metric-system
title: The metric system and measuring
minutes: 23
covers:
  - the metric system and measurement
---

Long ago, people measured with their bodies. A "foot" was a foot. A "cubit" was the length from your elbow to your fingertips. That works fine until two people with different-sized feet try to build the same wall. Every town had its own units, and converting between them was a mess of odd numbers — twelve of these to one of those, three of those to one of the next.

In the 1790s, scientists in France designed a better system. Every unit would be tied to one agreed standard, and every bigger or smaller unit would be the standard times ten, a hundred, a thousand. That is the **metric system**. Its modern form, used by scientists and engineers all over the world, is called **SI**, from the French for "International System of Units".

Every number in this course comes with a unit: $7.7\,\mathrm{km/s}$, $411\,\mathrm{t}$, $162\,\mathrm{s}$. A number without its unit is half a message — "the tank holds $244$" could mean anything. This lesson teaches the units themselves, how to change from one size to another by moving a decimal point, and one distinction that trips up nearly everyone: mass versus weight.

## The base units

A **unit** is an agreed amount that we count in. Saying a rod is $3$ metres long means it is three of the agreed "metre" laid end to end. Almost everything in this course is built from three **base units**:

| Quantity | Unit | Symbol | Everyday feel |
| --- | --- | --- | --- |
| Length | [[metre|metre-history]] | m | one big step; a doorway is a bit less than one metre wide |
| Mass | [[kilogram|kilogram-history]] | kg | a one-litre bottle of water |
| Time | second | s | the time it takes to say "one-Mississippi" |

One more unit is so handy it is used everywhere alongside them:

| Quantity | Unit | Symbol | Everyday feel |
| --- | --- | --- | --- |
| Volume | litre | L | a large water bottle; a box $10\,\mathrm{cm}$ on each side |

The symbols are part of the language, and the capital letters matter. Metre is a small $\mathrm{m}$. Litre is a capital $\mathrm{L}$, because a small l looks too much like the number $1$. You write $3\,\mathrm{m}$, with a space, and you never add an "s" for plurals: $3\,\mathrm{m}$, not "3 ms" — which would mean three milliseconds!

Other units are built by combining these. Speed is metres per second, $\mathrm{m/s}$. Area is square metres, $\mathrm{m^2}$, and volume is cubic metres, $\mathrm{m^3}$ — you met both in the lesson on area and volume.

::: key Base units
Length in metres (m), mass in kilograms (kg), time in seconds (s). Volume is often given in litres (L).
:::

## Prefixes: bigger and smaller units

A metre is a good size for a rocket but a silly size for the distance to orbit or the thickness of a sheet of foil. Instead of inventing new units, the metric system sticks a **prefix** — a short word part — on the front of the unit. The prefix says how many times bigger or smaller.

| Prefix | Symbol | Means | As a number | Example |
| --- | --- | --- | --- | --- |
| giga- | G | a billion times | 1 000 000 000 | a gigabyte of memory |
| mega- | M | a million times | 1 000 000 | Falcon 9 lift-off thrust, about $7.6\,\mathrm{MN}$ (meganewtons) |
| kilo- | k | a thousand times | 1000 | $1\,\mathrm{km} = 1000\,\mathrm{m}$ |
| (none) | | one | 1 | $1\,\mathrm{m}$ |
| centi- | c | a hundredth of | 0.01 | $1\,\mathrm{cm} = 0.01\,\mathrm{m}$ |
| milli- | m | a thousandth of | 0.001 | $1\,\mathrm{mm} = 0.001\,\mathrm{m}$ |
| micro- | µ | a millionth of | 0.000 001 | a human hair is about $70\,\mu\mathrm{m}$ (micrometres) thick |
| nano- | n | a billionth of | 0.000 000 001 | light travels about $30\,\mathrm{cm}$ in a [[nanosecond|nanosecond-gps]] |

The same prefixes work on any unit. A kilometre is a thousand metres. A kilogram is a thousand grams. A millisecond is a thousandth of a second, and a milligram is a thousandth of a gram. Learn the prefix once and you know it everywhere.

The symbol µ is the Greek letter "mu", said "myoo". The **newton** (N) in the table is the unit of force — how hard something pushes or pulls. It shows up again below.

::: key Metric prefixes
kilo- = 1000 ×, centi- = 1/100, milli- = 1/1000. 1 km = 1000 m, 1 cm = 0.01 m, 1 kg = 1000 g, 1 L = 1000 mL.
:::

Two more names you will see on every rocket data sheet. The **gram** (g) is a thousandth of a kilogram — a paper clip is about a gram. (The kilogram is the one base unit whose name already has a prefix in it.) And the **[[tonne|tonne]]** (t) is a thousand kilograms. It is not an official prefix unit, but it is the natural size for rockets: the Falcon 9 first stage carries about $411\,\mathrm{t}$ of propellant.

::: warning Capital or small letter?
$\mathrm{m}$ is milli- (a thousandth) or metre, depending on where it sits; $\mathrm{M}$ is mega- (a million). So $1\,\mathrm{mm}$ is a millimetre and $1\,\mathrm{Mm}$ is a million metres — a billion times bigger than a millimetre. Likewise $\mathrm{mN}$ and $\mathrm{MN}$. Copy symbols exactly, capital letters and all.
:::

## Converting: move the decimal point

Because every step is ten, a hundred or a thousand, converting between metric units never needs long multiplication. It is multiplying or dividing by $10$, $100$ or $1000$ — and that only moves the decimal point, one place for every zero.

The rule has two halves:

- **Big unit to small unit: multiply.** Small units are tiny, so you need *more* of them. The number gets bigger; the decimal point moves right. $3.7\,\mathrm{m} = 3.7 \times 100 = 370\,\mathrm{cm}$.
- **Small unit to big unit: divide.** You need *fewer* big units. The number gets smaller; the point moves left. $2540\,\mathrm{mL} = 2540 \div 1000 = 2.54\,\mathrm{L}$.

How many places? Count the zeros in the step. Metres to centimetres is $\times 100$, two zeros, two places. Kilograms to grams is $\times 1000$, three places. Picture it as a [[staircase|prefix-staircase]]: stepping down to smaller units multiplies, stepping up divides.

::: example Falcon 9 in different units
Convert each measurement. Say which way the point moves before you move it.

**Diameter $3.7\,\mathrm{m}$ into millimetres.** Metres to millimetres: big to small, $\times 1000$, three places right. $3.7 \to 37 \to 370 \to 3700$. So $3.7\,\mathrm{m} = 3700\,\mathrm{mm}$.

**Propellant $411\,\mathrm{t}$ into kilograms.** Tonnes to kilograms: big to small, $\times 1000$. $411\,\mathrm{t} = 411\,000\,\mathrm{kg}$.

**A $35\,\mathrm{g}$ sensor into kilograms.** Grams to kilograms: small to big, $\div 1000$, three places left. $35 \to 3.5 \to 0.35 \to 0.035$. So $35\,\mathrm{g} = 0.035\,\mathrm{kg}$.

**An orbit $420\,\mathrm{km}$ up, in metres.** Big to small, $\times 1000$: $420\,000\,\mathrm{m}$.

**Sanity check every time.** A smaller unit must give a bigger number, and a bigger unit a smaller number. $3700$ millimetres, each tiny, makes sense for a rocket's width; $0.0037$ would not.
:::

::: warning Moving the point the wrong way
The most common slip is moving the decimal point in the wrong direction — getting $0.0037\,\mathrm{mm}$ for the rocket's width instead of $3700\,\mathrm{mm}$. The answers differ by a factor of a million. Always ask: "Is my new unit smaller? Then I need *more* of them."
:::

Sometimes you step across two prefixes. There are $1000$ millimetres in a metre and $1000$ metres in a kilometre, so there are $1000 \times 1000 = 1\,000\,000$ millimetres in a kilometre. Go through the base unit if in doubt: convert to metres first, then to the unit you want.

## Converting areas and volumes

Here is where people get caught. A metre is $100$ centimetres. But a *square* metre is not $100$ square centimetres.

Picture a square $1\,\mathrm{m}$ on each side, and cut it into little squares $1\,\mathrm{cm}$ on each side. Along the top there are $100$ of them. Down the side there are $100$ rows. So there are $100 \times 100 = 10\,000$ little squares in [[one square metre|square-metre-grid]]:

$$
1\,\mathrm{m^2} = 100\,\mathrm{cm} \times 100\,\mathrm{cm} = 10\,000\,\mathrm{cm^2}.
$$

For volume there are three directions, so the factor goes in three times:

$$
1\,\mathrm{m^3} = 100\,\mathrm{cm} \times 100\,\mathrm{cm} \times 100\,\mathrm{cm} = 1\,000\,000\,\mathrm{cm^3}.
$$

::: warning Square the factor for areas, cube it for volumes
Lengths convert by the plain factor. Areas convert by the factor squared. Volumes convert by the factor cubed. The circular end of a Falcon 9, $10.75\,\mathrm{m^2}$, is $10.75 \times 10\,000 = 107\,500\,\mathrm{cm^2}$ — not $1075\,\mathrm{cm^2}$.
:::

### Litres and cubic metres

A litre is the volume of a box $10\,\mathrm{cm}$ on every side: $10 \times 10 \times 10 = 1000\,\mathrm{cm^3}$. So a millilitre, a thousandth of a litre, is exactly one cubic centimetre: $1\,\mathrm{mL} = 1\,\mathrm{cm^3}$.

How many litres fit in a cubic metre? A cubic metre is $1\,000\,000\,\mathrm{cm^3}$, and each litre is $1000\,\mathrm{cm^3}$, so $1\,000\,000 \div 1000 = 1000$ litres. Or picture it: a cubic metre box is $100\,\mathrm{cm}$ each way, which is $10$ litre-boxes each way, and $10 \times 10 \times 10 = 1000$.

$$
1\,\mathrm{m^3} = 1000\,\mathrm{L}.
$$

And a very handy fact: a litre of water has a mass of about $1\,\mathrm{kg}$. The metric system was designed that way. So a cubic metre of water, $1000\,\mathrm{L}$, has a mass of about $1000\,\mathrm{kg}$ — one tonne.

::: example How much does the tank hold?
The liquid oxygen tank of a stage holds $244\,\mathrm{m^3}$. How many litres is that? Liquid oxygen has a mass of $1141\,\mathrm{kg}$ per cubic metre. Compare its mass with the same volume of water.

**Cubic metres to litres.** Each cubic metre is $1000\,\mathrm{L}$: $244 \times 1000 = 244\,000\,\mathrm{L}$. That would fill about a thousand bathtubs.

**Mass of the oxygen.** $244 \times 1141 \approx 278\,400\,\mathrm{kg}$. In tonnes, divide by $1000$: about $278\,\mathrm{t}$.

**Compare with water.** $244\,\mathrm{m^3}$ of water would be about $244\,\mathrm{t}$, since each cubic metre of water is one tonne. The oxygen is heavier, because $1141$ is bigger than $1000$: each litre of liquid oxygen has a mass of about $1.14\,\mathrm{kg}$.

**Sanity check.** Liquid oxygen is a bit denser than water, so its mass should be a bit more than $244\,\mathrm{t}$. It is.
:::

## Mass and weight

In everyday talk, "how heavy is it?" mixes up two different ideas. Engineers keep them apart.

**Mass** is how much stuff something is made of. It is measured in kilograms, and it does not change when you move the object. An $80\,\mathrm{kg}$ astronaut is $80\,\mathrm{kg}$ on Earth, on the Moon and floating in space.

**Weight** is how hard gravity pulls on that stuff. It is a force, so it is measured in **newtons** (N). Weight depends on where you are. On Earth, gravity pulls on each kilogram with about $9.8\,\mathrm{N}$ — engineers use the standard value $9.80665$. On the Moon, gravity is weaker: about $1.62\,\mathrm{N}$ per kilogram, roughly a sixth as much.

To get a weight, multiply the mass by the pull per kilogram:

$$
\text{weight} = \text{mass} \times \text{pull of gravity per kilogram}.
$$

A bathroom scale that shows kilograms is secretly measuring how hard you push down on it — your weight — and then dividing by Earth's gravity to show a mass. Take it to the Moon and it would read far too low.

::: example An astronaut on Earth and on the Moon
An astronaut with a mass of $80\,\mathrm{kg}$ stands on Earth, then on the Moon.

**On Earth.** $80 \times 9.80665 \approx 785\,\mathrm{N}$.

**On the Moon.** $80 \times 1.62 \approx 130\,\mathrm{N}$.

**Compare.** $785 \div 130 \approx 6$. The astronaut weighs about six times less on the Moon, which is why Apollo astronauts could bounce around in heavy suits. But the mass is $80\,\mathrm{kg}$ in both places: pushing them sideways, or stopping them once they are moving, is just as hard on the Moon as on Earth.
:::

For a rocket, this difference is everything. To leave the pad, the engines must push up harder than the rocket's **weight** pulls down. But how quickly it speeds up depends on its **mass**. Those are two different numbers, and the later lessons use both. Astronauts in orbit are not "beyond gravity", either — they [[float for another reason|weightless]].

::: warning Kilograms are not newtons
Mass goes in kilograms; weight goes in newtons. Writing "the rocket weighs $549\,000\,\mathrm{kg}$" is everyday speech, and fine in a newspaper. In a calculation, if you need a force, multiply by $9.80665$ first. A thrust in newtons compared with a mass in kilograms is comparing two different kinds of thing.
:::

## Time

Time is the one quantity that is *not* in tens. That is an [[ancient leftover|why-sixty]]:

$$
60\,\mathrm{s} = 1\,\mathrm{min}, \qquad 60\,\mathrm{min} = 1\,\mathrm{h}, \qquad 24\,\mathrm{h} = 1\,\mathrm{day}.
$$

So an hour is $60 \times 60 = 3600\,\mathrm{s}$, and a day is $24 \times 3600 = 86\,400\,\mathrm{s}$. Engineers almost always convert times to seconds before putting them in a formula, because the SI speed and flow units are "per second".

The prefixes still work on the small side: a **millisecond** (ms) is a thousandth of a second. Flight computers do their jobs many times per second, so their timing is measured in milliseconds.

::: example How long is an orbit?
A satellite in low orbit goes once around Earth in about $92$ minutes. Put that in seconds, and find how many orbits it makes in a day.

**Minutes to seconds.** Each minute is $60\,\mathrm{s}$: $92 \times 60 = 5520\,\mathrm{s}$.

**Orbits per day.** A day is $86\,400\,\mathrm{s}$. Divide: $86\,400 \div 5520 \approx 15.7$ orbits.

**Sanity check.** A day is $24$ hours, and an orbit is about an hour and a half. $24 \div 1.5 = 16$, close to $15.7$. So a crew in low orbit sees about $15$ or $16$ sunrises every day.
:::

::: warning Time decimals are not minutes
$2.7\,\mathrm{min}$ is **not** $2$ minutes $7$ seconds, and not $2$ minutes $70$ seconds. The $.7$ is seven tenths of a minute: $0.7 \times 60 = 42\,\mathrm{s}$. So $2.7\,\mathrm{min}$ is $2\,\mathrm{min}\ 42\,\mathrm{s}$, which is $162\,\mathrm{s}$ — the burn time of the Falcon 9 first stage. In the same way, $1.5\,\mathrm{h}$ is $1\,\mathrm{h}\ 30\,\mathrm{min}$, not $1\,\mathrm{h}\ 50\,\mathrm{min}$.
:::

## Measuring well

A **measurement** is always a number *and* a unit. Two habits make measurements useful.

**Pick a sensible unit.** Choose the unit that makes the number easy to read. The rocket's width is $3.7\,\mathrm{m}$, not $0.0037\,\mathrm{km}$ or $3\,700\,000\,\mu\mathrm{m}$. All three are correct; only one is kind to the reader.

**Keep a feel for sizes.** Carry a few benchmarks in your head, so you notice when an answer is silly:

| Amount | About the size of |
| --- | --- |
| $1\,\mathrm{mm}$ | the thickness of a credit card |
| $1\,\mathrm{cm}$ | the width of your little fingernail |
| $1\,\mathrm{m}$ | one big step |
| $1\,\mathrm{km}$ | a 12-minute walk |
| $1\,\mathrm{g}$ | a paper clip |
| $1\,\mathrm{kg}$ | a litre of water |
| $1\,\mathrm{t}$ | a small car; a cubic metre of water |

If a calculation says a satellite's solar panel is $4\,\mathrm{mm}$ wide, or a tank of propellant weighs $3\,\mathrm{g}$, a benchmark tells you straight away to go looking for the slip.

::: note The other system
The United States still uses **customary units** in daily life: inches, feet and miles for length, pounds for weight, gallons for volume. American aerospace companies often work in both, and you will meet thrust in pounds and altitudes in feet. The conversion factors are fixed by definition — one inch is exactly $2.54\,\mathrm{cm}$, one foot exactly $0.3048\,\mathrm{m}$ — but they are not powers of ten, so converting takes real multiplication. In 1999 a spacecraft was [[lost to exactly this|mars-climate-orbiter]]. The algebra module's lesson on units teaches a method that makes these conversions safe. In this course, everything is worked in SI.
:::

::: note Where this comes back
- [Exponents, radicals and scaling laws](#/module/t0_m01_algebra_precalc?lesson=l02-exponents-and-radicals) writes each prefix as a power of ten — kilo is $10^3$, micro is $10^{-6}$ — so that converting becomes adding exponents.
- [Units, conversions and dimensional analysis](#/module/t0_m01_algebra_precalc?lesson=l10-units-and-dimensional-analysis) handles pounds, feet and psi, and shows how to catch a wrong unit before it causes damage.
- [Scientific notation and significant figures](#/module/t0_m01_algebra_precalc?lesson=l11-scientific-notation-and-significant-figures) writes $7\,607\,000\,\mathrm{N}$ as $7.607\,\mathrm{MN}$, and decides how many digits a measurement deserves.
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) turns tonnes into kilograms and mass into weight to find whether a rocket's engines can lift it.
:::

## Check yourself

::: check
Convert: $45\,\mathrm{mm}$ into centimetres and into metres; $0.25\,\mathrm{kg}$ into grams; $3500\,\mathrm{mL}$ into litres.
:::

::: answer
$45\,\mathrm{mm}$: there are $10\,\mathrm{mm}$ in a centimetre, so small to big, $\div 10$: $4.5\,\mathrm{cm}$. There are $1000\,\mathrm{mm}$ in a metre, so $\div 1000$: $0.045\,\mathrm{m}$.

$0.25\,\mathrm{kg}$: big to small, $\times 1000$: $250\,\mathrm{g}$.

$3500\,\mathrm{mL}$: small to big, $\div 1000$: $3.5\,\mathrm{L}$.
:::

::: check
A satellite's solar panel has an area of $3\,\mathrm{m^2}$. How many square centimetres is that? Explain why the answer is not $300\,\mathrm{cm^2}$.
:::

::: answer
One square metre is $100 \times 100 = 10\,000\,\mathrm{cm^2}$, so $3\,\mathrm{m^2} = 30\,000\,\mathrm{cm^2}$.

$300$ comes from using the length factor, $100$, only once. An area has two directions, so the factor goes in twice.
:::

::: check
A small tank holds $2.5\,\mathrm{m^3}$. How many litres is that? If it were filled with water, about how many kilograms of water would that be?
:::

::: answer
$1\,\mathrm{m^3} = 1000\,\mathrm{L}$, so $2.5 \times 1000 = 2500\,\mathrm{L}$.

A litre of water is about $1\,\mathrm{kg}$, so about $2500\,\mathrm{kg}$, which is $2.5\,\mathrm{t}$.
:::

::: check
A rover has a mass of $1000\,\mathrm{kg}$. Gravity on Mars pulls with about $3.71\,\mathrm{N}$ per kilogram. What is the rover's mass on Mars, and what is its weight on Earth and on Mars?
:::

::: answer
Its mass is $1000\,\mathrm{kg}$ everywhere — mass does not depend on location.

Weight on Earth: $1000 \times 9.80665 \approx 9807\,\mathrm{N}$.

Weight on Mars: $1000 \times 3.71 = 3710\,\mathrm{N}$, a bit more than a third of its Earth weight.
:::

::: check
A test lasts $20\,000\,\mathrm{s}$. Write that in hours, minutes and seconds.
:::

::: answer
An hour is $3600\,\mathrm{s}$. $20\,000 \div 3600 = 5.55\ldots$, so $5$ whole hours, which is $5 \times 3600 = 18\,000\,\mathrm{s}$.

That leaves $20\,000 - 18\,000 = 2000\,\mathrm{s}$. A minute is $60\,\mathrm{s}$: $2000 \div 60 = 33.3\ldots$, so $33$ whole minutes, which is $1980\,\mathrm{s}$, leaving $20\,\mathrm{s}$.

Answer: $5\,\mathrm{h}\ 33\,\mathrm{min}\ 20\,\mathrm{s}$. (Check: $18\,000 + 1980 + 20 = 20\,000$.)
:::

::: check
A flight computer repeats its main job every $20\,\mathrm{ms}$. How many times does it do it each second?
:::

::: answer
$20\,\mathrm{ms}$ is $20$ thousandths of a second, $0.020\,\mathrm{s}$. In one second, which is $1000\,\mathrm{ms}$, it fits $1000 \div 20 = 50$ times.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Base units | metre (m), kilogram (kg), second (s); litre (L) for volume |
| Prefixes | giga $\times$1 000 000 000, mega $\times$1 000 000, kilo $\times$1000, centi 1/100, milli 1/1000, micro 1/1 000 000, nano 1/1 000 000 000 |
| Handy facts | 1 km = 1000 m, 1 cm = 0.01 m, 1 kg = 1000 g, 1 t = 1000 kg, 1 L = 1000 mL |
| Converting | big to small: multiply (point moves right); small to big: divide (point moves left) |
| Areas, volumes | $1\,\mathrm{m^2} = 10\,000\,\mathrm{cm^2}$; $1\,\mathrm{m^3} = 1\,000\,000\,\mathrm{cm^3} = 1000\,\mathrm{L}$; $1\,\mathrm{mL} = 1\,\mathrm{cm^3}$ |
| Water | 1 L of water is about 1 kg; 1 m³ of water is about 1 t |
| Mass vs weight | mass in kg, the same everywhere; weight is a force in N, mass × gravity (9.80665 on Earth) |
| Time | 60 s = 1 min, 60 min = 1 h = 3600 s, 1 day = 86 400 s |

Next, the last Basecamp lesson puts lengths and times together: speed, and the other "per" quantities — kilograms per second, litres per minute — along with how to average a set of measurements.

::: context metre-history A metre from the size of the Earth
The French scientists of the 1790s defined the metre as one ten-millionth of the distance from the North Pole to the equator, measured along a line through Paris. Two surveyors spent years measuring part of that line. It is why Earth's circumference comes out close to a round number: four quarters of $10\,000\,\mathrm{km}$, about $40\,000\,\mathrm{km}$. Since 1983 the metre has been defined by the speed of light instead: the distance light travels in a vacuum in $1/299\,792\,458$ of a second.
:::

::: context kilogram-history The kilogram in a vault
For 130 years, the kilogram was one particular metal cylinder, about the size of a golf ball, kept in a locked vault near Paris. Every scale in the world traced back to it. The trouble was that copies compared with it over the decades drifted apart by tiny amounts. In 2019 scientists redefined the kilogram using a fixed constant of nature, so it can now be reproduced in any well-equipped lab without the cylinder.
:::

::: context nanosecond-gps Why GPS cares about nanoseconds
Light, and radio, travels about $300\,000\,\mathrm{km}$ every second. That is about $30\,\mathrm{cm}$ in a nanosecond, a billionth of a second. A GPS receiver works out where it is by timing radio signals from satellites. If its timing were off by only one microsecond — a thousand nanoseconds — its position would be off by about $300\,\mathrm{m}$. That is why GPS satellites carry extremely accurate atomic clocks.
:::

::: context tonne Tonne, ton and ton
A metric **tonne** is $1000\,\mathrm{kg}$. The American "short ton" is $2000$ pounds, about $907\,\mathrm{kg}$, and the British "long ton" is about $1016\,\mathrm{kg}$. They are close, but not the same, which is why the metric one is often spelled "tonne" or called a "metric ton". In this course, $\mathrm{t}$ always means $1000\,\mathrm{kg}$.
:::

::: context prefix-staircase The conversion staircase
Going down the stairs to a smaller unit, multiply. Going up to a bigger unit, divide. Each factor tells you how many places the decimal point moves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="70" height="140"/>
    <rect x="100" y="70" width="70" height="100"/>
    <rect x="180" y="110" width="70" height="60"/>
    <rect x="260" y="140" width="70" height="30"/>
  </g>
  <g font-size="14" font-weight="700" text-anchor="middle" fill="#1f2a44">
    <text x="55" y="55">km</text><text x="135" y="95">m</text><text x="215" y="132">cm</text><text x="295" y="160">mm</text>
  </g>
  <g font-size="12" text-anchor="middle" fill="#b4232c">
    <text x="95" y="40">× 1000 ↘</text><text x="175" y="82">× 100 ↘</text><text x="255" y="122">× 10 ↘</text>
  </g>
  <text x="250" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">going up the stairs: divide</text>
  <text x="250" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">3 zeros = 3 places</text>
</svg>
```

So $1\,\mathrm{km} = 1000\,\mathrm{m} = 100\,000\,\mathrm{cm} = 1\,000\,000\,\mathrm{mm}$.
:::

::: context square-metre-grid A square metre, cut up
The big square is $1\,\mathrm{m}$ on each side. The grid cuts it into $10 \times 10 = 100$ squares, each $10\,\mathrm{cm}$ on a side and so $100\,\mathrm{cm^2}$ in area. That makes $100 \times 100 = 10\,000\,\mathrm{cm^2}$ in all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="150" height="150" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="30" y="20" width="15" height="15" fill="#f2b880"/>
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="45" y1="20" x2="45" y2="170"/><line x1="60" y1="20" x2="60" y2="170"/><line x1="75" y1="20" x2="75" y2="170"/>
    <line x1="90" y1="20" x2="90" y2="170"/><line x1="105" y1="20" x2="105" y2="170"/><line x1="120" y1="20" x2="120" y2="170"/>
    <line x1="135" y1="20" x2="135" y2="170"/><line x1="150" y1="20" x2="150" y2="170"/><line x1="165" y1="20" x2="165" y2="170"/>
    <line x1="30" y1="35" x2="180" y2="35"/><line x1="30" y1="50" x2="180" y2="50"/><line x1="30" y1="65" x2="180" y2="65"/>
    <line x1="30" y1="80" x2="180" y2="80"/><line x1="30" y1="95" x2="180" y2="95"/><line x1="30" y1="110" x2="180" y2="110"/>
    <line x1="30" y1="125" x2="180" y2="125"/><line x1="30" y1="140" x2="180" y2="140"/><line x1="30" y1="155" x2="180" y2="155"/>
  </g>
  <rect x="30" y="20" width="150" height="150" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="105" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">1 m = 100 cm</text>
  <text x="200" y="32" font-size="12" fill="#1f2a44">orange: 10 cm × 10 cm</text>
  <text x="200" y="50" font-size="12" fill="#1f2a44">= 100 cm²</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">100 of those</text>
  <text x="200" y="118" font-size="12" fill="#1d6fd1">= 10 000 cm²</text>
</svg>
```
:::

::: context weightless Why astronauts float
At the height of the Space Station, about $400\,\mathrm{km}$ up, gravity is still about $90\%$ as strong as on the ground. The crew float because they, the station and everything in it are all falling together, around the Earth — so fast sideways that they keep missing it. Nothing presses them against the floor, so they feel weightless, but their mass is exactly what it was on the ground. A drifting toolbox is still hard to stop.
:::

::: context why-sixty Why minutes have sixty seconds
Counting time and angles in sixties goes back thousands of years, to ancient Babylon, whose astronomers counted in groups of sixty. Sixty is a handy number to share out: it divides evenly by $2, 3, 4, 5, 6, 10, 12, 15, 20$ and $30$. When the metric system was built, France tried decimal time — ten-hour days, hundred-minute hours — but it never caught on and was dropped within a few years.
:::

::: context mars-climate-orbiter The spacecraft lost to a unit
Mars Climate Orbiter reached Mars in September 1999 and was never heard from again. One team's software reported thruster pushes in pound-force seconds; the navigation software that read them expected newton seconds. One pound-force is about $4.45\,\mathrm{N}$, and nobody applied the factor. Over months, the small errors added up until the spacecraft flew far too low and was destroyed in the Martian atmosphere. The algebra module's units lesson opens with this story.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="38" font-size="12" fill="#1f2a44">1 newton</text>
  <rect x="20" y="58" width="267" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="153" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">1 pound-force ≈ 4.45 N</text>
</svg>
```

The two bars are drawn to scale: mixing them up makes every push about four and a half times too big or too small.
:::
