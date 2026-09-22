---
id: l10-units-and-dimensional-analysis
title: Units, conversions and dimensional analysis
minutes: 17
covers:
  - units and dimensional analysis
---

In September 1999 the Mars Climate Orbiter flew into the Martian atmosphere and was lost because one piece of software reported thruster impulse in pound-force seconds and the piece that consumed it expected newton seconds. Every number was computed correctly. The factor of $4.45$ between the two units was simply never applied, and over months of small corrections the trajectory drifted by more than a hundred kilometres. The mission had cost hundreds of millions of dollars. That is the reason this lesson exists, and it is why the module's coding exercise asks for a converter that *refuses* to convert a force into a mass.

Aerospace lives in two unit systems at once. Engine thrust is quoted in pounds-force in one document and kilonewtons in the next; tank pressures come in psi; ranges in nautical miles; altitudes in feet; densities in slugs per cubic foot when the aerodynamics reference is American and in kilograms per cubic metre when it is not. You cannot avoid the second system, so you must be able to move between them mechanically and to notice when a number is in the wrong one. The method is the same algebra you have been doing all module — units are symbols that multiply, divide and cancel — plus a small table of exactly defined factors.

The second half of the lesson is about **dimensions**, the deeper idea underneath units. A length is a length whether in metres or feet, and an equation that adds a length to a time is wrong in every unit system. Checking that every term of an equation carries the same dimensions costs thirty seconds and catches a startling fraction of algebra errors before any number is computed. It is the cheapest error check you own, and you should run it on every formula you derive.

## Dimensions and units

A **dimension** is the kind of quantity: length $\mathsf{L}$, mass $\mathsf{M}$, time $\mathsf{T}$ are the three mechanics needs, with temperature, electric current and a few others for the rest of physics. A **unit** is an agreed amount of that kind, used to give the quantity a number: metres, feet and nautical miles are all units of length. Change the unit and the number changes; the dimension does not.

Derived quantities have dimensions built from the base ones by the same algebra as their formulas. Speed is length per time, $\mathsf{L}\mathsf{T}^{-1}$. Acceleration is $\mathsf{L}\mathsf{T}^{-2}$. Force is mass times acceleration, $\mathsf{M}\mathsf{L}\mathsf{T}^{-2}$. Pressure is force per area, $\mathsf{M}\mathsf{L}^{-1}\mathsf{T}^{-2}$. Energy is force times distance, $\mathsf{M}\mathsf{L}^{2}\mathsf{T}^{-2}$. The gravitational parameter $\mu$ has dimensions $\mathsf{L}^{3}\mathsf{T}^{-2}$, which you can read straight off its unit $\mathrm{m^3/s^2}$. A **dimensionless** quantity has all exponents zero: a ratio of two lengths, a mass ratio, an angle in radians (arc length over radius), a count.

### The SI system

The **SI** base units for mechanics are the metre ($\mathrm{m}$), kilogram ($\mathrm{kg}$) and second ($\mathrm{s}$). Derived units are products of powers of these, and the ones with names are shorthand:

| Quantity | Unit | In base units |
| --- | --- | --- |
| force | newton, $\mathrm{N}$ | $\mathrm{kg\,m/s^2}$ |
| pressure | pascal, $\mathrm{Pa}$ | $\mathrm{N/m^2} = \mathrm{kg/(m\,s^2)}$ |
| energy | joule, $\mathrm{J}$ | $\mathrm{N\,m} = \mathrm{kg\,m^2/s^2}$ |
| power | watt, $\mathrm{W}$ | $\mathrm{J/s} = \mathrm{kg\,m^2/s^3}$ |
| impulse | $\mathrm{N\,s}$ | $\mathrm{kg\,m/s}$ (same as momentum) |

A newton is the force that accelerates one kilogram at one metre per second squared: $F = ma$ with $m = 1\,\mathrm{kg}$ and $a = 1\,\mathrm{m/s^2}$. That definition is what makes SI coherent — no conversion factors appear inside formulas, because every derived unit is defined so that the factor is one. The SI prefixes from the exponents lesson scale any unit by a power of ten: $\mathrm{kN} = 10^3\,\mathrm{N}$, $\mathrm{MPa} = 10^6\,\mathrm{Pa}$, $\mathrm{km} = 10^3\,\mathrm{m}$. The **tonne**, $\mathrm{t} = 1000\,\mathrm{kg}$, is accepted alongside SI and is the natural unit for vehicle masses. The **bar**, $10^5\,\mathrm{Pa}$, is common for tank pressures and is almost an atmosphere ($1\,\mathrm{atm} = 101\,325\,\mathrm{Pa}$).

## Units are algebraic symbols

The whole technique of conversion rests on one idea: a unit is a factor that multiplies the number, and it obeys the same laws as any other symbol. $5\,\mathrm{m} \times 3\,\mathrm{m} = 15\,\mathrm{m^2}$. $\dfrac{100\,\mathrm{m}}{20\,\mathrm{s}} = 5\,\mathrm{m/s}$. $\dfrac{\mathrm{m^3/s^2}}{\mathrm{m^2}} = \mathrm{m/s^2}$, which is the unit check on $g = \mu/r^2$ that the exponents lesson did. Units in a numerator and denominator cancel exactly as $x$ does in $\frac{3x}{x}$.

A **conversion factor** is a fraction that equals one, because its numerator and denominator are the same physical amount written in two units: $\dfrac{1852\,\mathrm{m}}{1\,\mathrm{nmi}} = 1$. Multiplying any quantity by one leaves it unchanged, so you may multiply by as many such fractions as you need, arranging each so that the unit you want to remove cancels and the unit you want appears. A range of $400\,\mathrm{km}$ in nautical miles:

$$
400\,\mathrm{km} \times \frac{1000\,\mathrm{m}}{1\,\mathrm{km}} \times \frac{1\,\mathrm{nmi}}{1852\,\mathrm{m}} = \frac{400 \times 1000}{1852}\,\mathrm{nmi} = 216\,\mathrm{nmi} .
$$

The kilometres cancelled against the kilometres, the metres against the metres, and only nautical miles survived. If you had written the second factor upside down, the units would have come out as $\mathrm{m^2/nmi}$, which is not a length, and the error would have announced itself. Always write the units in the chain; the point of the method is that the units tell you when the chain is wrong.

Powers of a unit convert with the power of the factor. One foot is $0.3048\,\mathrm{m}$ exactly, so one square foot is $0.3048^2 = 0.0929\,\mathrm{m^2}$ and one cubic foot is $0.3048^3 = 0.02832\,\mathrm{m^3}$; a cubic metre is $35.3\,\mathrm{ft^3}$, not $3.28$. A density of $810\,\mathrm{kg/m^3}$ in pounds-mass per cubic foot needs the mass factor once and the length factor cubed:

$$
810\,\frac{\mathrm{kg}}{\mathrm{m^3}} \times \frac{1\,\mathrm{lbm}}{0.45359\,\mathrm{kg}} \times \left(\frac{0.3048\,\mathrm{m}}{1\,\mathrm{ft}}\right)^3 = 810 \times \frac{0.02832}{0.45359}\,\frac{\mathrm{lbm}}{\mathrm{ft^3}} = 50.6\,\frac{\mathrm{lbm}}{\mathrm{ft^3}} .
$$

::: warning Temperature is the exception
Every conversion above is a pure multiplication because every unit is a multiple of the base unit with the same zero. Temperature scales have different zeros: $F = \tfrac{9}{5}C + 32$ has an offset, so you cannot convert $^\circ\mathrm{C}$ to $^\circ\mathrm{F}$ by a single factor, and a temperature *difference* converts differently ($\tfrac{9}{5}$, no offset) from a temperature *value*. Kelvin and Rankine are the absolute scales, $K = C + 273.15$ and $R = F + 459.67$, and the gas laws need them. Everything else in this lesson is multiplicative.
:::

## US customary units

The **US customary** system (also called foot–pound–second, or "English" units) is what most American aerospace documentation and much flight-test data still use. Every one of its units is now *defined* as an exact multiple of an SI unit, so the factors below are not measurements; they are definitions, and you can carry as many figures as you like.

**Length.** The international foot is $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$ exactly; the inch is $\tfrac{1}{12}$ of it, $25.4\,\mathrm{mm}$ exactly; the statute mile is $5280\,\mathrm{ft} = 1609.344\,\mathrm{m}$. The **nautical mile** is separate: $1\,\mathrm{nmi} = 1852\,\mathrm{m}$ exactly. It began as one minute of latitude, a sixtieth of a degree along a meridian, which is why ranges and charts in navigation use it; the modern definition rounds that to a fixed number. Speeds in navigation are **knots**, nautical miles per hour: $1\,\mathrm{kn} = 1852/3600 = 0.5144\,\mathrm{m/s}$.

**Mass and force.** Here is the trap. The **pound-mass**, $\mathrm{lbm}$, is a unit of mass, $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$ exactly. The **pound-force**, $\mathrm{lbf}$, is a unit of force: the weight of one pound-mass under standard gravity,

$$
1\,\mathrm{lbf} = 0.45359237\,\mathrm{kg} \times 9.80665\,\mathrm{m/s^2} = 4.4482216\,\mathrm{N} .
$$

The two are called "pounds" and confused constantly; a spec that says a tank "weighs $500$ pounds" means $500\,\mathrm{lbf}$ of weight, which is $500\,\mathrm{lbm}$ of mass only at standard gravity. Because $\mathrm{lbf}$ and $\mathrm{lbm}$ are both in use, $F = ma$ does *not* come out coherent with them: one $\mathrm{lbf}$ accelerates one $\mathrm{lbm}$ at $32.174\,\mathrm{ft/s^2}$, not at $1\,\mathrm{ft/s^2}$. The coherent unit of mass, the one for which $F = ma$ has no stray factor, is the **slug**: the mass that $1\,\mathrm{lbf}$ accelerates at $1\,\mathrm{ft/s^2}$. Its SI value follows from that definition,

$$
1\,\mathrm{slug} = \frac{1\,\mathrm{lbf}}{1\,\mathrm{ft/s^2}} = \frac{4.4482216\,\mathrm{N}}{0.3048\,\mathrm{m/s^2}} = 14.5939\,\mathrm{kg} ,
$$

so a slug is $32.174\,\mathrm{lbm}$. Aerodynamic data in US units — air density $0.002377\,\mathrm{slug/ft^3}$ at sea level — uses slugs precisely so that $\tfrac{1}{2}\rho v^2$ comes out in $\mathrm{lbf/ft^2}$ with no correction.

**Pressure.** Pounds-force per square inch, $\mathrm{psi}$:

$$
1\,\mathrm{psi} = \frac{4.4482216\,\mathrm{N}}{(0.0254\,\mathrm{m})^2} = \frac{4.4482216}{6.4516 \times 10^{-4}}\,\mathrm{Pa} = 6894.76\,\mathrm{Pa} .
$$

So $1\,\mathrm{atm} = 101\,325 / 6894.76 = 14.70\,\mathrm{psi}$. Gauge pressure ("psig") is measured above ambient; absolute pressure ("psia") above vacuum; a tank at $50\,\mathrm{psig}$ at sea level holds $64.7\,\mathrm{psia}$.

::: key Conversion factors
$1\,\mathrm{lbf} = 4.4482216\,\mathrm{N}$ ($\approx 4.45\,\mathrm{N}$; $10^6\,\mathrm{lbf} \approx 4.45\,\mathrm{MN}$). $1\,\mathrm{psi} = 6894.76\,\mathrm{Pa} \approx 6.895\,\mathrm{kPa}$; $1\,\mathrm{atm} \approx 14.7\,\mathrm{psi} \approx 101.325\,\mathrm{kPa}$. $1\,\mathrm{nmi} = 1.852\,\mathrm{km}$ exactly (originally one minute of latitude). $1\,\mathrm{slug} = 14.5939\,\mathrm{kg}$, the mass that $1\,\mathrm{lbf}$ accelerates at $1\,\mathrm{ft/s^2}$. $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$ and $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$, both exact.
:::

::: example A thrust figure in two systems
A first stage is quoted at $1\,710\,000\,\mathrm{lbf}$ of sea-level thrust. In SI:

$$
1.71 \times 10^6\,\mathrm{lbf} \times \frac{4.4482216\,\mathrm{N}}{1\,\mathrm{lbf}} = 7.606 \times 10^6\,\mathrm{N} = 7.61\,\mathrm{MN} .
$$

The vehicle's lift-off mass is $549\,\mathrm{t} = 5.49 \times 10^5\,\mathrm{kg}$. Its weight is $5.49 \times 10^5 \times 9.80665 = 5.384 \times 10^6\,\mathrm{N}$, so the thrust-to-weight ratio is $7.606 / 5.384 = 1.41$, as the first lesson found. Do the same calculation in US units to see the slug earn its place: the mass is $549\,000 / 14.5939 = 37\,600\,\mathrm{slug}$, standard gravity is $9.80665 / 0.3048 = 32.174\,\mathrm{ft/s^2}$, and the weight is $37\,600 \times 32.174 = 1.210 \times 10^6\,\mathrm{lbf}$. Thrust over weight: $1.71 / 1.21 = 1.41$. The ratio is dimensionless, so it had to agree; that agreement is the check. Had you used the mass in $\mathrm{lbm}$ ($1.21 \times 10^6\,\mathrm{lbm}$) and multiplied by $32.174$, the "weight" would have come out $32$ times too big, which is the $\mathrm{lbm}$–$\mathrm{lbf}$ error in its most common form.
:::

## Dimensional homogeneity

An equation relates physical quantities, and it can be true only if both sides — and every term added or subtracted within a side — have the same dimensions. You cannot add a length to a time, and $3\,\mathrm{m} + 2\,\mathrm{s}$ is not a quantity. This requirement is **dimensional homogeneity**, and it has a second part that is less obvious and just as strict: the argument of an exponential, logarithm, sine or cosine must be dimensionless. $e^{x}$ is $1 + x + x^2/2 + \cdots$, a sum of powers of $x$, which is homogeneous only if $x$ has no dimensions; the same holds for $\ln$, $\sin$ and $\cos$. That is why $e^{-h/H}$ divides an altitude by a scale height (length over length), why $\ln(m_0/m_f)$ is a ratio of masses, and why a frequency multiplies a time inside $\sin(\omega t)$.

Run the check on the formulas of this module. $T = 2\pi\sqrt{r^3/\mu}$: inside the root, $\mathsf{L}^3 / (\mathsf{L}^3\mathsf{T}^{-2}) = \mathsf{T}^2$, whose root is $\mathsf{T}$. A time — correct. $\Delta v = v_e \ln(m_0/m_f)$: the logarithm's argument is $\mathsf{M}/\mathsf{M}$, dimensionless as required, and the result has the dimensions of $v_e$, a speed. $q = \tfrac{1}{2}\rho v^2$: $\mathsf{M}\mathsf{L}^{-3} \times \mathsf{L}^2\mathsf{T}^{-2} = \mathsf{M}\mathsf{L}^{-1}\mathsf{T}^{-2}$, a pressure, which is why dynamic pressure is quoted in pascals. $h = 100 + 20t - 4.903t^2$ works only because the $20$ carries $\mathrm{m/s}$ and the $4.903$ carries $\mathrm{m/s^2}$; written with bare numbers it is a formula with hidden units, which is legal but dangerous, and you should at least write the units in a comment.

Now the check catching an error. Suppose a derivation ends with "the distance fallen is $d = g t$". Dimensions: $\mathsf{L}\mathsf{T}^{-2} \times \mathsf{T} = \mathsf{L}\mathsf{T}^{-1}$, a speed, not a length. The formula is wrong before you substitute a single number, and the check even hints at the fix — another factor of $\mathsf{T}$ is missing, and $\tfrac{1}{2}gt^2$ supplies it. What the check cannot catch is a dimensionless factor: $gt^2$ and $\tfrac{1}{2}gt^2$ are dimensionally identical. Homogeneity is necessary, not sufficient. It rules out whole classes of mistakes at no cost; it does not prove a formula right.

::: key Dimensional homogeneity
Every additive term in an equation must carry identical dimensions, and the arguments of $\exp$, $\ln$, $\sin$ and $\cos$ must be dimensionless. Check it on every formula you derive: it is the cheapest error check you own. It cannot catch a wrong dimensionless factor such as a missing $\tfrac{1}{2}$.
:::

### Dimensional analysis: getting the form of a law for free

Homogeneity can be run forwards. If you know which quantities a result depends on, the requirement that the dimensions balance often fixes the *form* of the dependence up to a dimensionless constant. Ask how the period $T$ of a circular orbit can depend on the radius $r$ and the gravitational parameter $\mu$ — the only quantities in the problem. Try $T = C\, r^a \mu^b$ with $C$ a pure number. The dimensions must satisfy

$$
\mathsf{T} = \mathsf{L}^a\,(\mathsf{L}^3\mathsf{T}^{-2})^b = \mathsf{L}^{a + 3b}\,\mathsf{T}^{-2b} .
$$

Matching exponents: for $\mathsf{T}$, $-2b = 1$, so $b = -\tfrac{1}{2}$; for $\mathsf{L}$, $a + 3b = 0$, so $a = \tfrac{3}{2}$. Hence $T = C\, r^{3/2} \mu^{-1/2} = C\sqrt{r^3/\mu}$ — Kepler's third law, with only the constant $C = 2\pi$ left for the physics to supply. The same argument gives the pendulum's period as $C\sqrt{L/g}$ and says the drag force on a body must go as $\rho v^2 A$ times a dimensionless coefficient, which is where the drag coefficient $C_D$ comes from. It is a powerful habit for estimation: when you cannot remember a formula, its dimensions usually can.

::: example Reading a pressure spec
A helium bottle is rated to $3000\,\mathrm{psi}$ and the regulator downstream is set to $700\,\mathrm{psi}$; the tank it feeds is designed for $5\,\mathrm{MPa}$ maximum. Is the regulator setting safe, and what fraction of the bottle's rating is it?

$700\,\mathrm{psi} \times 6894.76\,\mathrm{Pa/psi} = 4.826 \times 10^6\,\mathrm{Pa} = 4.83\,\mathrm{MPa}$, which is below $5\,\mathrm{MPa}$ with $3.5\%$ margin — thin, and a reviewer would ask about regulator tolerance. The bottle: $3000\,\mathrm{psi} = 2.068 \times 10^7\,\mathrm{Pa} = 20.7\,\mathrm{MPa}$, so the regulator sits at $700/3000 = 23\%$ of it. Sanity checks: $700\,\mathrm{psi}$ is about $48$ atmospheres ($700/14.7$), and $4.83\,\mathrm{MPa}$ is $48.3\,\mathrm{bar}$; the two routes agree, and both say "about fifty atmospheres", which is a normal tank pressure. Had the conversion accidentally been divided rather than multiplied, the answer $0.1\,\mathrm{Pa}$ would have been a millionth of an atmosphere, absurd for a pressurised tank — the sanity check would have caught what the arithmetic did not.
:::

## Units in code

A program does not carry units; it carries floats, and the units live in the programmer's head, which is where the Mars Climate Orbiter's factor of $4.45$ lived. Three defences, in increasing order of strength. First, name variables with their units — `thrust_N`, `pressure_Pa`, `range_nmi` — so a line like `total = thrust_N + weight_lbf` looks wrong. Second, convert everything to SI base units at the boundary where data enters, compute in SI, and convert back only for display; then the interior of the program has one unit system and no factors. Third, and this is what the module's exercise builds, make conversion go *through the dimension*: store for each unit its dimension and its size in the SI base unit, convert by multiplying into SI and dividing out, and raise an error if the two units' dimensions differ.

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
print(convert(300.0, "psi", "Pa"))   # 2068427.19
```

The multiply-then-divide is exactly the fraction-equal-to-one method: `value * k_from` is the quantity in SI, and dividing by `k_to` re-expresses it. The dimension check is homogeneity, enforced by the machine instead of by hope. A converter built this way cannot turn $\mathrm{lbf}$ into $\mathrm{kg}$ no matter how the call is written, which is the property that would have saved the orbiter.

## Check yourself

::: check
Convert a speed of $250\,\mathrm{kn}$ to $\mathrm{m/s}$ and to $\mathrm{km/h}$, showing the unit chain.
:::

::: answer
$250\,\dfrac{\mathrm{nmi}}{\mathrm{h}} \times \dfrac{1852\,\mathrm{m}}{1\,\mathrm{nmi}} \times \dfrac{1\,\mathrm{h}}{3600\,\mathrm{s}} = \dfrac{250 \times 1852}{3600}\,\mathrm{m/s} = 128.6\,\mathrm{m/s}$. In $\mathrm{km/h}$: $250 \times 1.852 = 463\,\mathrm{km/h}$, or $128.6 \times 3.6 = 463$.
:::

::: check
Sea-level air density is $1.225\,\mathrm{kg/m^3}$. Express it in $\mathrm{slug/ft^3}$.
:::

::: answer
$1.225\,\dfrac{\mathrm{kg}}{\mathrm{m^3}} \times \dfrac{1\,\mathrm{slug}}{14.5939\,\mathrm{kg}} \times \left(\dfrac{0.3048\,\mathrm{m}}{1\,\mathrm{ft}}\right)^3 = 1.225 \times \dfrac{0.028317}{14.5939} = 2.377 \times 10^{-3}\,\mathrm{slug/ft^3}$, the value quoted in US aerodynamics tables. Note the length factor is cubed because the unit is.
:::

::: check
Check the dimensions of $v = \sqrt{\mu / r}$ and of $E = \tfrac{1}{2}mv^2 - \mu m / r$. Is the second expression homogeneous?
:::

::: answer
$\mu / r$ has $\mathsf{L}^3\mathsf{T}^{-2} / \mathsf{L} = \mathsf{L}^2\mathsf{T}^{-2}$, whose root is $\mathsf{L}\mathsf{T}^{-1}$, a speed. For $E$: $\tfrac{1}{2}mv^2$ is $\mathsf{M}\mathsf{L}^2\mathsf{T}^{-2}$ and $\mu m / r$ is $\mathsf{L}^3\mathsf{T}^{-2} \cdot \mathsf{M} / \mathsf{L} = \mathsf{M}\mathsf{L}^2\mathsf{T}^{-2}$. Both terms are energies, so the difference is homogeneous — this is the specific orbital energy times mass, and it will matter in the astrodynamics modules.
:::

::: check
A colleague derives the burn time of a stage as $t_b = m_p\, v_e / F$, where $m_p$ is propellant mass, $v_e$ exhaust velocity and $F$ thrust. Does it pass the dimension check? If so, evaluate it for $m_p = 400\,\mathrm{t}$, $v_e = 3050\,\mathrm{m/s}$, $F = 7.6\,\mathrm{MN}$.
:::

::: answer
$\mathsf{M} \cdot \mathsf{L}\mathsf{T}^{-1} / (\mathsf{M}\mathsf{L}\mathsf{T}^{-2}) = \mathsf{T}$. It passes. Physically, $F / v_e$ is the mass flow rate ($\mathrm{kg/s}$), so $m_p v_e / F$ is mass over mass flow rate, a time. Numerically: $4 \times 10^5 \times 3050 / 7.6 \times 10^6 = 1.22 \times 10^9 / 7.6 \times 10^6 = 161\,\mathrm{s}$. The check confirmed the form; only the physics of $F = \dot{m} v_e$ confirms it is right.
:::

::: check
Why is a pound-mass not the same as a slug, and how many pounds-mass are in a slug? Which is the coherent unit for $F = ma$ in $\mathrm{lbf}$ and $\mathrm{ft/s^2}$?
:::

::: answer
Both are masses, but only the slug is defined so that $1\,\mathrm{lbf} = 1\,\mathrm{slug} \times 1\,\mathrm{ft/s^2}$. A pound-mass is defined by its SI value, $0.45359237\,\mathrm{kg}$, and $1\,\mathrm{lbf}$ accelerates it at $g_0$ in feet per second squared, $32.174\,\mathrm{ft/s^2}$. So $1\,\mathrm{slug} = 32.174\,\mathrm{lbm}$ (check: $14.5939 / 0.45359 = 32.17$). The slug is the coherent unit; using $\mathrm{lbm}$ in $F = ma$ requires dividing by $32.174$, and forgetting to is the classic factor-of-thirty-two error.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Dimension vs unit | dimension is the kind ($\mathsf{L}$, $\mathsf{M}$, $\mathsf{T}$); unit is the agreed amount (m, ft, nmi) |
| SI derived | $\mathrm{N} = \mathrm{kg\,m/s^2}$, $\mathrm{Pa} = \mathrm{N/m^2}$, $\mathrm{J} = \mathrm{N\,m}$, $\mathrm{W} = \mathrm{J/s}$; $\mathrm{t} = 1000\,\mathrm{kg}$, $\mathrm{bar} = 10^5\,\mathrm{Pa}$ |
| Conversion | multiply by fractions equal to one, arranged so unwanted units cancel; powers of a unit take powers of the factor |
| Length | $1\,\mathrm{ft} = 0.3048\,\mathrm{m}$, $1\,\mathrm{in} = 25.4\,\mathrm{mm}$, $1\,\mathrm{nmi} = 1852\,\mathrm{m}$, $1\,\mathrm{kn} = 0.5144\,\mathrm{m/s}$ |
| Force | $1\,\mathrm{lbf} = 4.4482216\,\mathrm{N}$ |
| Mass | $1\,\mathrm{lbm} = 0.45359237\,\mathrm{kg}$; $1\,\mathrm{slug} = 14.5939\,\mathrm{kg} = 32.174\,\mathrm{lbm}$ |
| Pressure | $1\,\mathrm{psi} = 6894.76\,\mathrm{Pa}$; $1\,\mathrm{atm} = 101.325\,\mathrm{kPa} = 14.70\,\mathrm{psi}$ |
| Temperature | offsets, not factors: $K = C + 273.15$, $F = \tfrac{9}{5}C + 32$ |
| Homogeneity | all additive terms same dimensions; arguments of $\exp$, $\ln$, $\sin$, $\cos$ dimensionless; necessary, not sufficient |
| Dimensional analysis | match exponents of $\mathsf{L}$, $\mathsf{M}$, $\mathsf{T}$ to get a law's form: $T = C\sqrt{r^3/\mu}$ |
| Code | convert through the SI base unit; refuse mismatched dimensions |

The next lesson is about the numbers attached to these units: how to write very large and very small ones without losing track of the exponent, and how many of their digits you are actually entitled to keep.
