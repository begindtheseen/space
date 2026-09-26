---
id: l10-units-and-dimensional-analysis
title: Units, conversions and dimensional analysis
minutes: 21
covers:
  - units and dimensional analysis
---

In September 1999 a spacecraft called the Mars Climate Orbiter reached Mars and was never heard from again. It had flown too low and burned up in the Martian air. The cause was not a hard physics mistake. One piece of software reported the push from the thrusters in American units (pound-force seconds). The software that read those numbers expected metric units (newton seconds). Every number was calculated correctly. But one pound-force is about $4.45$ newtons, and nobody applied that factor. Over months of small course corrections the path drifted by more than a hundred kilometres. The mission had cost hundreds of millions of dollars. That is why this lesson exists, and why the module's coding exercise asks you to build a converter that *refuses* to turn a force into a mass.

Aerospace lives in two unit systems at once — a bit like a kitchen where half the recipes use cups and half use grams. Engine thrust is given in pounds-force in one document and kilonewtons in the next. Tank pressures come in psi. Ranges come in nautical miles, altitudes in feet. You cannot avoid the second system, so you need to move between them mechanically, and to notice when a number is in the wrong one. The method is the algebra you have been doing all module — units are symbols that multiply, divide and cancel — plus a short table of exact factors.

The second half of the lesson is about **dimensions**, the idea underneath units. A length is a length whether you measure it in metres or feet. An equation that adds a length to a time is wrong in every unit system. Checking that every piece of an equation has the same dimensions takes thirty seconds and catches a surprising number of algebra mistakes before any number is worked out. It is the cheapest error check you own.

## Dimensions and units

Ask someone how far away school is and they say "two". Two what? Miles? Kilometres? Minutes on the bus? A number without its unit is half a message.

Two words sort this out.

- A **dimension** is the *kind* of thing being measured: length, mass or time. We write them with the letters $\mathsf{L}$, $\mathsf{M}$ and $\mathsf{T}$. Those three are all that mechanics (the physics of motion) needs. Temperature, electric current and a few others cover the rest of physics.
- A **unit** is an agreed-upon amount of that kind, used to put a number on it. Metres, feet and nautical miles are all units of length.

Change the unit and the number changes: $1\,\mathrm{m}$ is about $3.28\,\mathrm{ft}$. The dimension stays the same: both are lengths.

Other quantities get their dimensions from their formulas, using ordinary algebra. Speed is distance divided by time, so its dimension is $\mathsf{L}/\mathsf{T}$, written $\mathsf{L}\mathsf{T}^{-1}$ (a negative power means "divided by"). Then:

- acceleration (speed per time) is $\mathsf{L}\mathsf{T}^{-2}$;
- force is mass times acceleration, $\mathsf{M}\mathsf{L}\mathsf{T}^{-2}$;
- pressure is force per area, $\mathsf{M}\mathsf{L}^{-1}\mathsf{T}^{-2}$;
- energy is force times distance, $\mathsf{M}\mathsf{L}^{2}\mathsf{T}^{-2}$;
- Earth's gravitational parameter $\mu$ ("mu") has dimensions $\mathsf{L}^{3}\mathsf{T}^{-2}$, which you can read straight off its unit, $\mathrm{m^3/s^2}$.

A **dimensionless** quantity has no dimensions at all — every power is zero. Examples: a length divided by a length, a mass ratio, a count, or an angle in radians (which is arc length divided by radius).

### The SI system

The **SI** (the international metric system) has three base units for mechanics: the metre ($\mathrm{m}$), the kilogram ($\mathrm{kg}$) and the second ($\mathrm{s}$). Every other unit is built from these, and the ones with their own names are shorthand:

| Quantity | Unit | In base units |
| --- | --- | --- |
| force | newton, $\mathrm{N}$ | $\mathrm{kg\,m/s^2}$ |
| pressure | pascal, $\mathrm{Pa}$ | $\mathrm{N/m^2} = \mathrm{kg/(m\,s^2)}$ |
| energy | joule, $\mathrm{J}$ | $\mathrm{N\,m} = \mathrm{kg\,m^2/s^2}$ |
| power | watt, $\mathrm{W}$ | $\mathrm{J/s} = \mathrm{kg\,m^2/s^3}$ |
| impulse | $\mathrm{N\,s}$ | $\mathrm{kg\,m/s}$ (same as momentum) |

A **newton** is the force that makes one kilogram speed up by one metre per second, every second: $F = ma$ with $m = 1\,\mathrm{kg}$ and $a = 1\,\mathrm{m/s^2}$. Because every SI unit is defined this way, no stray conversion numbers ever appear inside SI formulas. The factor is always one. That property is called being **coherent**.

The SI prefixes from the exponents lesson scale any unit by a power of ten: $\mathrm{kN} = 10^3\,\mathrm{N}$, $\mathrm{MPa} = 10^6\,\mathrm{Pa}$, $\mathrm{km} = 10^3\,\mathrm{m}$. Two extra units are used alongside SI. The **tonne**, $\mathrm{t} = 1000\,\mathrm{kg}$, is the natural size for rocket masses. The **bar**, $10^5\,\mathrm{Pa}$, is common for tank pressures and is almost one atmosphere ($1\,\mathrm{atm} = 101\,325\,\mathrm{Pa}$).

## Units are algebraic symbols

The whole method of converting units rests on one idea: a unit is a factor that multiplies the number, and it follows the same rules as any letter in algebra.

- $5\,\mathrm{m} \times 3\,\mathrm{m} = 15\,\mathrm{m^2}$ (metres times metres is square metres).
- $\dfrac{100\,\mathrm{m}}{20\,\mathrm{s}} = 5\,\mathrm{m/s}$.
- $\dfrac{\mathrm{m^3/s^2}}{\mathrm{m^2}} = \mathrm{m/s^2}$ — the unit check on $g = \mu/r^2$ from the exponents lesson.

Units on the top and bottom of a fraction cancel, exactly as the $x$ does in $\frac{3x}{x}$.

### Multiplying by one

Twelve eggs and one dozen eggs are the same amount of eggs. So the fraction $\frac{12\,\text{eggs}}{1\,\text{dozen}}$ equals one. A **conversion factor** is a fraction like that: the top and bottom are the same physical amount written in two different units. For example, a nautical mile is exactly $1852$ metres, so

$$
\frac{1852\,\mathrm{m}}{1\,\mathrm{nmi}} = 1 .
$$

Multiplying anything by one does not change it. So you may multiply by as many conversion factors as you like. Arrange each one so the unit you want to get rid of cancels and the unit you want appears. Here is a range of $400\,\mathrm{km}$ in nautical miles:

$$
400\,\mathrm{km} \times \frac{1000\,\mathrm{m}}{1\,\mathrm{km}} \times \frac{1\,\mathrm{nmi}}{1852\,\mathrm{m}} = \frac{400 \times 1000}{1852}\,\mathrm{nmi} = 216\,\mathrm{nmi} .
$$

The kilometres cancelled against the kilometres. The metres cancelled against the metres. Only nautical miles survived. Sanity check: a nautical mile is a bit under two kilometres, so the number of nautical miles should be a bit more than half of $400$, and $216$ is.

If you had written the second factor upside down, the units would have come out as $\mathrm{m^2/nmi}$, which is not a length at all, and the mistake would have announced itself. Always write the units in the chain. The whole point of the method is that the units tell you when the chain is wrong.

### Squares and cubes

Powers of a unit convert with the same power of the factor. One foot is exactly $0.3048\,\mathrm{m}$. A square foot is a square $0.3048\,\mathrm{m}$ on each side, so it is $0.3048^2 = 0.0929\,\mathrm{m^2}$. A cubic foot is $0.3048^3 = 0.02832\,\mathrm{m^3}$. Turn that around and a cubic metre is $35.3\,\mathrm{ft^3}$ — not $3.28$. A box one metre on each side holds about $3.28 \times 3.28 \times 3.28$ boxes one foot on each side.

A density of $810\,\mathrm{kg/m^3}$ (kerosene) in pounds-mass per cubic foot needs the mass factor once and the length factor cubed:

$$
810\,\frac{\mathrm{kg}}{\mathrm{m^3}} \times \frac{1\,\mathrm{lbm}}{0.45359\,\mathrm{kg}} \times \left(\frac{0.3048\,\mathrm{m}}{1\,\mathrm{ft}}\right)^3 = 810 \times \frac{0.02832}{0.45359}\,\frac{\mathrm{lbm}}{\mathrm{ft^3}} = 50.6\,\frac{\mathrm{lbm}}{\mathrm{ft^3}} .
$$

The cubed factor has $\mathrm{m^3}$ on top to cancel the $\mathrm{m^3}$ on the bottom of the density, and leaves $\mathrm{ft^3}$ on the bottom.

::: warning Temperature is the exception
Every conversion above is a pure multiplication, because every unit starts from the same zero: zero metres is zero feet. Temperature scales have different zeros. $0\,^\circ\mathrm{C}$ is $32\,^\circ\mathrm{F}$, and $F = \tfrac{9}{5}C + 32$ has an added $32$. So you cannot convert $^\circ\mathrm{C}$ to $^\circ\mathrm{F}$ with a single factor. And a temperature *difference* converts differently (times $\tfrac{9}{5}$, no $32$) from a temperature *reading*. Kelvin and Rankine are the scales that start at absolute zero, $K = C + 273.15$ and $R = F + 459.67$, and the gas laws need them. Everything else in this lesson is multiply-only.
:::

## US customary units

The **US customary** system — also called foot–pound–second, or "English" units — is what much American aerospace paperwork and flight-test data still use. Every one of its units is now *defined* as an exact multiple of an SI unit. So the factors below are not measurements that might be slightly off. They are definitions, and you can keep as many digits as you like.

### Length

The foot is exactly $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$. The inch is $\tfrac{1}{12}$ of a foot, exactly $25.4\,\mathrm{mm}$. The ordinary (statute) mile is $5280\,\mathrm{ft} = 1609.344\,\mathrm{m}$.

The **nautical mile** is a separate unit, used at sea and in the air: $1\,\mathrm{nmi} = 1852\,\mathrm{m}$ exactly. It started life as one minute of latitude — one sixtieth of a degree, measured north–south along the Earth's surface — which is why navigation charts use it. The modern definition fixes it at a round number of metres. Speeds in navigation are in **knots**, nautical miles per hour: $1\,\mathrm{kn} = 1852/3600 = 0.5144\,\mathrm{m/s}$.

### Mass and force: two different "pounds"

Here is the trap. There are two units both called "pound".

- The **pound-mass**, $\mathrm{lbm}$, measures *mass* — how much stuff. $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$ exactly.
- The **pound-force**, $\mathrm{lbf}$, measures *force*. It is the weight of one pound-mass under **standard gravity**, $g_0 = 9.80665\,\mathrm{m/s^2}$ ("g nought") — a defined constant, not the actual gravity at any particular place:

$$
1\,\mathrm{lbf} = 0.45359237\,\mathrm{kg} \times 9.80665\,\mathrm{m/s^2} = 4.4482216\,\mathrm{N} .
$$

People mix these up all the time. A spec that says a tank "weighs $500$ pounds" means $500\,\mathrm{lbf}$ of weight. That is $500\,\mathrm{lbm}$ of mass only where gravity is exactly standard.

Because both kinds of pound are in use, $F = ma$ does *not* work out neatly with them. One $\mathrm{lbf}$ pushes one $\mathrm{lbm}$ to an acceleration of $32.174\,\mathrm{ft/s^2}$ (that is $g_0$ in feet), not $1\,\mathrm{ft/s^2}$. The US mass unit that *does* make $F = ma$ work with no stray factor is the **slug**: the mass that $1\,\mathrm{lbf}$ accelerates at $1\,\mathrm{ft/s^2}$. Its SI value follows from that definition:

$$
1\,\mathrm{slug} = \frac{1\,\mathrm{lbf}}{1\,\mathrm{ft/s^2}} = \frac{4.4482216\,\mathrm{N}}{0.3048\,\mathrm{m/s^2}} = 14.5939\,\mathrm{kg} .
$$

So a slug is $32.174\,\mathrm{lbm}$. US aerodynamics tables give air density in slugs — $0.002377\,\mathrm{slug/ft^3}$ at sea level — so that formulas like $\tfrac{1}{2}\rho v^2$ come out directly in $\mathrm{lbf/ft^2}$ with no correction.

### Pressure

Pressure in US units is pounds-force per square inch, $\mathrm{psi}$. Since an inch is $0.0254\,\mathrm{m}$, a square inch is $0.0254^2 = 6.4516 \times 10^{-4}\,\mathrm{m^2}$, and

$$
1\,\mathrm{psi} = \frac{4.4482216\,\mathrm{N}}{(0.0254\,\mathrm{m})^2} = \frac{4.4482216}{6.4516 \times 10^{-4}}\,\mathrm{Pa} = 6894.76\,\mathrm{Pa} .
$$

So one atmosphere is $101\,325 / 6894.76 = 14.70\,\mathrm{psi}$. Pressure gauges often read **gauge pressure** ("psig"), measured above the surrounding air. **Absolute pressure** ("psia") is measured above empty space (vacuum). A tank at $50\,\mathrm{psig}$ at sea level holds $50 + 14.7 = 64.7\,\mathrm{psia}$.

::: key Conversion factors
$1\,\mathrm{lbf} = 4.4482216\,\mathrm{N}$ ($\approx 4.45\,\mathrm{N}$; $10^6\,\mathrm{lbf} \approx 4.45\,\mathrm{MN}$). $1\,\mathrm{psi} = 6894.76\,\mathrm{Pa} \approx 6.895\,\mathrm{kPa}$; $1\,\mathrm{atm} \approx 14.7\,\mathrm{psi} \approx 101.325\,\mathrm{kPa}$. $1\,\mathrm{nmi} = 1.852\,\mathrm{km}$ exactly (originally one minute of latitude). $1\,\mathrm{slug} = 14.5939\,\mathrm{kg}$, the mass that $1\,\mathrm{lbf}$ accelerates at $1\,\mathrm{ft/s^2}$. $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$ and $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$, both exact. Standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$ is a defined constant.
:::

::: example A thrust figure in two systems
A first stage is quoted at $1\,710\,000\,\mathrm{lbf}$ of thrust at sea level. What is that in SI, and what is the thrust-to-weight ratio?

**Convert the thrust.** Multiply by the factor with $\mathrm{lbf}$ on the bottom so it cancels:

$$
1.71 \times 10^6\,\mathrm{lbf} \times \frac{4.4482216\,\mathrm{N}}{1\,\mathrm{lbf}} = 7.606 \times 10^6\,\mathrm{N} = 7.61\,\mathrm{MN} .
$$

Sanity check: a pound-force is a bit under $4.5$ newtons, and $1.71 \times 4.45 \approx 7.6$.

**Thrust-to-weight in SI.** The lift-off mass is $549\,\mathrm{t} = 5.49 \times 10^5\,\mathrm{kg}$. Its weight is $5.49 \times 10^5 \times 9.80665 = 5.384 \times 10^6\,\mathrm{N}$. So the ratio is $7.606 / 5.384 = 1.41$, as the first lesson found.

**The same thing in US units**, to see the slug earn its place. The mass is $549\,000 / 14.5939 = 37\,600\,\mathrm{slug}$. Standard gravity in feet is $9.80665 / 0.3048 = 32.174\,\mathrm{ft/s^2}$. The weight is $37\,600 \times 32.174 = 1.210 \times 10^6\,\mathrm{lbf}$. Thrust over weight: $1.71 / 1.21 = 1.41$.

The ratio has no units — force over force — so it had to come out the same in both systems. That agreement is the check.

**The classic slip.** Had you used the mass in pounds-mass ($549\,000 / 0.45359 = 1.21 \times 10^6\,\mathrm{lbm}$) and multiplied by $32.174$, the "weight" would have come out $32$ times too big. That is the $\mathrm{lbm}$–$\mathrm{lbf}$ mistake in its most common form.
:::

## Dimensional homogeneity

"Three apples plus two hours" is not a sensible amount of anything. In the same way, $3\,\mathrm{m} + 2\,\mathrm{s}$ is not a quantity. You can only add or compare things of the same kind.

So an equation between physical quantities can only be true if both sides — and every term added or subtracted on either side — have the same dimensions. This rule is called **dimensional homogeneity** ("homogeneous" means "all of the same kind").

There is a second part that is less obvious and equally strict. Whatever goes *inside* an exponential, a logarithm, a sine or a cosine must be dimensionless. That is why:

- $e^{-h/H}$ divides an altitude by a scale height (length over length);
- $\ln(m_0/m_f)$ takes the log of a ratio of masses;
- $\sin(\omega t)$ multiplies a frequency $\omega$ ("omega", per second) by a time (seconds).

::: note Why the inside of $e^x$ must have no units
Later in the course you will see that $e^x = 1 + x + \frac{x^2}{2} + \frac{x^3}{6} + \cdots$, a sum of powers of $x$. If $x$ were a length, that sum would add a plain number to a length to an area to a volume — "three apples plus two hours" again. The only way every term is the same kind of thing is if $x$ has no dimensions. The same holds for $\ln$, $\sin$ and $\cos$.
:::

### Running the check

Try it on formulas from this module. In each one, replace every quantity with its dimensions and simplify.

- **Orbital period**, $T = 2\pi\sqrt{r^3/\mu}$. Inside the root: $\mathsf{L}^3 / (\mathsf{L}^3\mathsf{T}^{-2}) = \mathsf{T}^2$. The square root of $\mathsf{T}^2$ is $\mathsf{T}$. A time — correct.
- **Rocket equation**, $\Delta v = v_e \ln(m_0/m_f)$. The log's inside is $\mathsf{M}/\mathsf{M}$, dimensionless as required. The answer has the dimensions of $v_e$, a speed. Correct.
- **Exhaust velocity**, $v_e = I_{sp}\, g_0$. Specific impulse $I_{sp}$ is measured in seconds, so this is $\mathrm{s} \times \mathrm{m/s^2} = \mathrm{m/s}$, a speed. An $I_{sp}$ of $311\,\mathrm{s}$ gives $311 \times 9.80665 \approx 3050\,\mathrm{m/s}$.
- **Dynamic pressure**, $q = \tfrac{1}{2}\rho v^2$. $\mathsf{M}\mathsf{L}^{-3} \times \mathsf{L}^2\mathsf{T}^{-2} = \mathsf{M}\mathsf{L}^{-1}\mathsf{T}^{-2}$, a pressure. That is why dynamic pressure is quoted in pascals.
- **Height of a thrown object**, $h = 100 + 20t - 4.903t^2$. This works only because the $20$ secretly carries $\mathrm{m/s}$ and the $4.903$ carries $\mathrm{m/s^2}$. Written with bare numbers it is a formula with hidden units — legal, but risky. At least write the units in a comment.

Now watch the check catch a mistake. Suppose a derivation ends with "the distance fallen is $d = g t$". Dimensions: $\mathsf{L}\mathsf{T}^{-2} \times \mathsf{T} = \mathsf{L}\mathsf{T}^{-1}$. That is a speed, not a distance. The formula is wrong before you put in a single number. The check even hints at the fix: one more factor of $\mathsf{T}$ is missing, and the correct $\tfrac{1}{2}gt^2$ supplies it.

What the check cannot catch is a wrong plain number. $gt^2$ and $\tfrac{1}{2}gt^2$ have exactly the same dimensions. So homogeneity is *necessary* but not *sufficient*: a formula that fails it is certainly wrong, but a formula that passes it might still be wrong. It rules out whole families of mistakes for free. It does not prove a formula right.

::: key Dimensional homogeneity
Every additive term in an equation must carry identical dimensions, and the arguments of $\exp$, $\ln$, $\sin$ and $\cos$ must be dimensionless. Check it on every formula you derive: it is the cheapest error check you own. It cannot catch a wrong dimensionless factor such as a missing $\tfrac{1}{2}$.
:::

### Dimensional analysis: getting the shape of a law for free

You can also run the check forwards, to *find* a formula. If you know which quantities a result depends on, making the dimensions balance often fixes the shape of the formula, up to a plain-number constant.

How long does a circular orbit take? The period $T$ can only depend on the orbit radius $r$ and the gravitational parameter $\mu$ — nothing else is in the problem. So guess $T = C\, r^a \mu^b$, where $C$ is a plain number and the powers $a$ and $b$ are unknown. The dimensions must balance:

$$
\mathsf{T} = \mathsf{L}^a\,(\mathsf{L}^3\mathsf{T}^{-2})^b = \mathsf{L}^{a + 3b}\,\mathsf{T}^{-2b} .
$$

The left side has $\mathsf{T}$ to the power $1$ and no $\mathsf{L}$ at all. Match the powers:

- For $\mathsf{T}$: $-2b = 1$, so $b = -\tfrac{1}{2}$.
- For $\mathsf{L}$: $a + 3b = 0$, so $a = -3b = \tfrac{3}{2}$.

So $T = C\, r^{3/2} \mu^{-1/2} = C\sqrt{r^3/\mu}$. That is Kepler's third law, with only the number $C = 2\pi$ left for the physics to supply. The same trick gives a pendulum's swing time as $C\sqrt{L/g}$, and says the drag force on a body must go as $\rho v^2 A$ times some plain number — which is where the drag coefficient $C_D$ comes from. When you cannot remember a formula, its dimensions often can.

::: example Reading a pressure spec
A helium bottle is rated to $3000\,\mathrm{psi}$. The regulator after it is set to $700\,\mathrm{psi}$. The tank it feeds is designed for at most $5\,\mathrm{MPa}$. Is the regulator setting safe for the tank, and what fraction of the bottle's rating is it?

**The regulator in SI.** $700\,\mathrm{psi} \times 6894.76\,\mathrm{Pa/psi} = 4.826 \times 10^6\,\mathrm{Pa} = 4.83\,\mathrm{MPa}$. That is below $5\,\mathrm{MPa}$, so it is safe — but only by $3.5\%$ (the gap, $5 - 4.826 = 0.174\,\mathrm{MPa}$, divided by $5$). That is thin, and a reviewer would ask how accurate the regulator is.

**The bottle.** $3000\,\mathrm{psi} \times 6894.76 = 2.068 \times 10^7\,\mathrm{Pa} = 20.7\,\mathrm{MPa}$. The regulator sits at $700/3000 = 23\%$ of the bottle's rating.

**Sanity checks.** $700\,\mathrm{psi}$ is about $700/14.7 = 48$ atmospheres. And $4.83\,\mathrm{MPa}$ is $48.3\,\mathrm{bar}$, and a bar is almost an atmosphere. The two routes agree, and both say "about fifty atmospheres", a normal tank pressure. Had you divided by the factor instead of multiplying, you would have got about $0.1\,\mathrm{Pa}$ — a millionth of an atmosphere, absurd for a pressurised tank. The sanity check would have caught what the arithmetic did not.
:::

## Units in code

A program does not carry units. It carries plain numbers, and the units live in the programmer's head — which is exactly where the Mars Climate Orbiter's factor of $4.45$ lived. There are three defences, from weakest to strongest.

1. **Put the unit in the name**: `thrust_N`, `pressure_Pa`, `range_nmi`. Then a line like `total = thrust_N + weight_lbf` looks wrong at a glance.
2. **Convert at the door.** Turn everything into SI base units the moment data enters the program, do all the work in SI, and convert back only for display. Then the inside of the program has one unit system and no factors.
3. **Convert through the dimension.** This is what the module's exercise builds. For each unit, store its dimension and its size in the SI base unit. Convert by multiplying into SI and dividing back out. If the two units have different dimensions, raise an error.

```python
FACTORS = {
    "N":    ("force",    1.0),
    "lbf":  ("force",    4.4482216152605),
    "Pa":   ("pressure", 1.0),
    "psi":  ("pressure", 6894.757293168),
    "kg":   ("mass",     1.0),
    "slug": ("mass",     14.5939029372),
    "m":    ("length",   1.0),
    "ft":   ("length",   0.3048),
    "km":   ("length",   1000.0),
    "nmi":  ("length",   1852.0),
}

def convert(value, frm, to):
    dim_from, k_from = FACTORS[frm]
    dim_to, k_to = FACTORS[to]
    if dim_from != dim_to:
        raise ValueError(f"cannot convert {frm} ({dim_from}) to {to} ({dim_to})")
    return value * k_from / k_to

print(convert(1.0, "nmi", "km"))     # 1.852
print(convert(50.0, "psi", "Pa"))    # 344737.86
```

Each entry of `FACTORS` pairs a unit name with its dimension and its value in SI base units. The multiply-then-divide is the multiply-by-one method in disguise: `value * k_from` is the quantity in SI, and dividing by `k_to` re-expresses it in the new unit. For $1\,\mathrm{nmi}$ to $\mathrm{km}$ that is $1 \times 1852 / 1000 = 1.852$. The dimension check is homogeneity, enforced by the machine instead of by hope. A converter built this way cannot turn $\mathrm{lbf}$ into $\mathrm{kg}$ however the call is written — the property that would have saved the orbiter.

## Check yourself

::: check
Convert a speed of $250\,\mathrm{kn}$ to $\mathrm{m/s}$ and to $\mathrm{km/h}$, showing the unit chain.
:::

::: answer
A knot is a nautical mile per hour, so

$$
250\,\frac{\mathrm{nmi}}{\mathrm{h}} \times \frac{1852\,\mathrm{m}}{1\,\mathrm{nmi}} \times \frac{1\,\mathrm{h}}{3600\,\mathrm{s}} = \frac{250 \times 1852}{3600}\,\mathrm{m/s} = 128.6\,\mathrm{m/s} .
$$

The nautical miles cancel and the hours cancel. In $\mathrm{km/h}$: $250 \times 1.852 = 463\,\mathrm{km/h}$. Check the other way: $128.6 \times 3.6 = 463$, since $1\,\mathrm{m/s} = 3.6\,\mathrm{km/h}$.
:::

::: check
Sea-level air density is $1.225\,\mathrm{kg/m^3}$. Express it in $\mathrm{slug/ft^3}$.
:::

::: answer
$$
1.225\,\frac{\mathrm{kg}}{\mathrm{m^3}} \times \frac{1\,\mathrm{slug}}{14.5939\,\mathrm{kg}} \times \left(\frac{0.3048\,\mathrm{m}}{1\,\mathrm{ft}}\right)^3 = 1.225 \times \frac{0.028317}{14.5939} = 2.377 \times 10^{-3}\,\mathrm{slug/ft^3} .
$$

That is the value in US aerodynamics tables. The length factor is cubed because the unit is $\mathrm{m^3}$.
:::

::: check
Check the dimensions of $v = \sqrt{\mu / r}$ and of $E = \tfrac{1}{2}mv^2 - \mu m / r$. Is the second expression homogeneous?
:::

::: answer
$\mu / r$ has dimensions $\mathsf{L}^3\mathsf{T}^{-2} / \mathsf{L} = \mathsf{L}^2\mathsf{T}^{-2}$. Its square root is $\mathsf{L}\mathsf{T}^{-1}$, a speed.

For $E$: $\tfrac{1}{2}mv^2$ is $\mathsf{M} \times (\mathsf{L}\mathsf{T}^{-1})^2 = \mathsf{M}\mathsf{L}^2\mathsf{T}^{-2}$, and $\mu m / r$ is $\mathsf{L}^3\mathsf{T}^{-2} \cdot \mathsf{M} / \mathsf{L} = \mathsf{M}\mathsf{L}^2\mathsf{T}^{-2}$. Both terms are energies, so the difference is homogeneous. (It is the orbital energy of the spacecraft, and it will matter in the astrodynamics modules.)
:::

::: check
A colleague works out the burn time of a stage as $t_b = m_p\, v_e / F$, where $m_p$ is propellant mass, $v_e$ exhaust velocity and $F$ thrust. Does it pass the dimension check? If so, work it out for $m_p = 400\,\mathrm{t}$, $v_e = 3050\,\mathrm{m/s}$, $F = 7.6\,\mathrm{MN}$.
:::

::: answer
Dimensions: $\mathsf{M} \cdot \mathsf{L}\mathsf{T}^{-1} / (\mathsf{M}\mathsf{L}\mathsf{T}^{-2}) = \mathsf{T}$. A time, so it passes. Physically, $F / v_e$ is the mass of propellant used per second ($\mathrm{kg/s}$), so $m_p v_e / F$ is "total mass divided by mass per second" — a time.

Numbers, in SI: $\frac{4 \times 10^5 \times 3050}{7.6 \times 10^6} = \frac{1.22 \times 10^9}{7.6 \times 10^6} = 161\,\mathrm{s}$, a bit under three minutes. The check confirmed the shape of the formula. Only the physics of $F = \dot{m} v_e$ (thrust equals mass flow rate $\dot{m}$, read "m dot", times exhaust speed) confirms it is right.
:::

::: check
Why is a pound-mass not the same as a slug, and how many pounds-mass are in a slug? Which is the coherent unit for $F = ma$ in $\mathrm{lbf}$ and $\mathrm{ft/s^2}$?
:::

::: answer
Both are masses, but only the slug is defined so that $1\,\mathrm{lbf} = 1\,\mathrm{slug} \times 1\,\mathrm{ft/s^2}$. A pound-mass is defined by its SI value, $0.45359237\,\mathrm{kg}$, and $1\,\mathrm{lbf}$ accelerates it at $g_0$ measured in feet per second squared, $32.174\,\mathrm{ft/s^2}$.

So $1\,\mathrm{slug} = 32.174\,\mathrm{lbm}$. Check: $14.5939 / 0.45359 = 32.17$. The slug is the coherent unit. Using $\mathrm{lbm}$ in $F = ma$ means you must divide by $32.174$, and forgetting to is the classic factor-of-thirty-two mistake.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Dimension vs unit | dimension is the kind ($\mathsf{L}$, $\mathsf{M}$, $\mathsf{T}$); unit is the agreed amount (m, ft, nmi) |
| SI derived | $\mathrm{N} = \mathrm{kg\,m/s^2}$, $\mathrm{Pa} = \mathrm{N/m^2}$, $\mathrm{J} = \mathrm{N\,m}$, $\mathrm{W} = \mathrm{J/s}$; $\mathrm{t} = 1000\,\mathrm{kg}$, $\mathrm{bar} = 10^5\,\mathrm{Pa}$ |
| Conversion | multiply by fractions equal to one, arranged so unwanted units cancel; powers of a unit take powers of the factor |
| Length | $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$, $1\,\mathrm{in} = 25.4\,\mathrm{mm}$, $1\,\mathrm{nmi} = 1852\,\mathrm{m}$, $1\,\mathrm{kn} = 0.5144\,\mathrm{m/s}$ |
| Force | $1\,\mathrm{lbf} = 4.4482216\,\mathrm{N}$, the weight of $1\,\mathrm{lbm}$ at $g_0 = 9.80665\,\mathrm{m/s^2}$ |
| Mass | $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$; $1\,\mathrm{slug} = 14.5939\,\mathrm{kg} = 32.174\,\mathrm{lbm}$ |
| Pressure | $1\,\mathrm{psi} = 6894.76\,\mathrm{Pa}$; $1\,\mathrm{atm} = 101.325\,\mathrm{kPa} = 14.70\,\mathrm{psi}$; psia = psig + ambient |
| Temperature | offsets, not factors: $K = C + 273.15$, $F = \tfrac{9}{5}C + 32$ |
| Homogeneity | all additive terms same dimensions; arguments of $\exp$, $\ln$, $\sin$, $\cos$ dimensionless; necessary, not sufficient |
| Dimensional analysis | match exponents of $\mathsf{L}$, $\mathsf{M}$, $\mathsf{T}$ to get a law's form: $T = C\sqrt{r^3/\mu}$ |
| Code | convert through the SI base unit; refuse mismatched dimensions |

Next lesson: the numbers attached to these units. You will learn to write very large and very small numbers in **scientific notation** without losing track of the power of ten, and to judge how many of their digits — **significant figures** — you are actually entitled to keep.
