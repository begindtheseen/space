---
id: l01-two-body-equation
title: Newton's gravitation and the two-body equation
minutes: 21
covers:
  - Newton law of gravitation and the restricted two-body equation
---

Throw a ball and it curves back down. Throw it harder and it lands farther away. Now imagine throwing it so hard that, by the time it has dropped a little, the round Earth has curved away underneath it by the same amount. The ball keeps falling and never lands. That is an orbit. A satellite is a ball that is **[[falling around the Earth|falling-around]]** instead of into it.

This whole module is about that falling, and it all starts from one line of mathematics: *the acceleration of a spacecraft is the pull of one central body, and nothing else*. That line is called the **restricted two-body equation**. Kepler's laws, orbital elements, transfer orbits, rendezvous — every one of them is either a consequence of this equation or a small correction to it.

A guidance, navigation and control (GNC) engineer meets the equation in three places. In **mission design** it gives the first estimate of every period, speed and transfer time. In **flight software** it is the reference motion a navigation filter carries forward between measurements, with smaller effects added on top. In **analysis** it is the yardstick: if a detailed simulation disagrees with the two-body answer by more than the known small effects can explain, the simulation has a bug. Newton does not.

This lesson builds the equation from Newton's law of gravitation, says out loud what it assumes, gives you the numbers you need to use it, and measures how wrong it is on a real satellite, so you know when to trust it.

## Newton's law of gravitation

Every object pulls on every other object. The pull gets stronger when the masses are bigger, and weaker — much weaker — when they are farther apart. Double the distance and the pull drops to a quarter. Triple it and the pull drops to a ninth. This is the **[[inverse-square law|inverse-square]]**: the force goes as one over the distance squared.

Now the precise rule. Put a mass $m_1$ at position $\mathbf{R}_1$ and a mass $m_2$ at position $\mathbf{R}_2$, both measured in an **inertial frame** — a set of axes that is not accelerating or spinning. The arrow from the first body to the second is the **separation vector**

$$
\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1,
$$

and its length is $r = \lVert \mathbf{r} \rVert$ (read "the norm of r", which means the length of the arrow). The force on $m_2$ is

$$
\mathbf{F}_{2} = -\,\frac{G m_1 m_2}{r^2}\,\frac{\mathbf{r}}{r} = -\,\frac{G m_1 m_2}{r^3}\,\mathbf{r},
$$

and the force on $m_1$ is the exact opposite, $\mathbf{F}_1 = -\mathbf{F}_2$.

Read the pieces one at a time:

- $G = 6.674\,30 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$ is the **gravitational constant**, the same everywhere in the universe.
- $\frac{G m_1 m_2}{r^2}$ is the size of the pull.
- $\frac{\mathbf{r}}{r}$ is the **unit vector** $\hat{\mathbf{r}}$ (read "r hat") — an arrow of length one pointing from body 1 to body 2. It carries the direction.
- The minus sign flips that direction. So the force on $m_2$ points back toward $m_1$. Gravity pulls; it never pushes.

The two ways of writing the formula say the same thing. Dividing by $r^2$ and multiplying by the unit vector $\mathbf{r}/r$ is the same as dividing by $r^3$ and multiplying by $\mathbf{r}$ itself. The second form is the one you type into code, because it needs no separate step to make a unit vector.

Two more facts make this law usable for real planets, not only for points.

**Forces add.** The pull on a body from several others is the vector sum of the separate pulls. This is called **superposition**.

**A round body acts like a point.** The **[[shell theorem|shell-theorem]]** says a body whose mass is spread out with perfect spherical symmetry pulls on anything outside it exactly as if all its mass sat at its center. Earth is not a perfect sphere — it bulges at the equator — but it is close enough that treating it as a point is the right first model. The bulge becomes the first correction.

## From two bodies to one equation

Picture two bodies alone in the universe, pulled only by each other. Each one obeys Newton's second law, force equals mass times acceleration. Write the acceleration of body 1 as $\ddot{\mathbf{R}}_1$ (read "R one double-dot"; each dot is one time derivative, so two dots is acceleration):

$$
m_1 \ddot{\mathbf{R}}_1 = \frac{G m_1 m_2}{r^3}\,\mathbf{r}, \qquad
m_2 \ddot{\mathbf{R}}_2 = -\,\frac{G m_1 m_2}{r^3}\,\mathbf{r}.
$$

The first equation has a plus sign because the force on body 1 points along $+\mathbf{r}$, toward body 2.

**Step 1: divide each equation by its own mass.** That leaves each acceleration standing alone:

$$
\ddot{\mathbf{R}}_1 = \frac{G m_2}{r^3}\,\mathbf{r}, \qquad
\ddot{\mathbf{R}}_2 = -\,\frac{G m_1}{r^3}\,\mathbf{r}.
$$

Something neat happened. Each body's own mass cancelled. A body's acceleration depends only on the *other* body's mass. That is why a feather and a hammer fall together on the Moon.

**Step 2: subtract the first equation from the second.** On the left, $\ddot{\mathbf{R}}_2 - \ddot{\mathbf{R}}_1$ is the second derivative of $\mathbf{R}_2 - \mathbf{R}_1$, which is $\ddot{\mathbf{r}}$ — the acceleration of the separation arrow. On the right, the two terms have the same $\mathbf{r}/r^3$, so their coefficients combine:

$$
\ddot{\mathbf{r}} = -\,\frac{G\,(m_1 + m_2)}{r^3}\,\mathbf{r}.
$$

Pause on two things.

First, this equation is about **relative motion** — how body 2 moves as seen from body 1. It does not say where either body is in the universe, only how the gap between them changes.

Second, it contains the *sum* of the masses. Each body accelerates toward the other, so the gap closes at the combined rate. The masses add.

What about the motion of the pair as a whole? Go back to the equations before Step 1 and *add* them instead. The right sides cancel, leaving $m_1 \ddot{\mathbf{R}}_1 + m_2 \ddot{\mathbf{R}}_2 = \mathbf{0}$. That says the **[[center of mass|barycenter]]** of the pair — the balance point — moves in a straight line at constant speed. A frame riding along with the center of mass is therefore inertial too. So the two-body problem splits cleanly into two parts: the boring straight-line motion of the center of mass, and the interesting relative motion above.

Now give the combination of constants a name. The **gravitational parameter** of the pair, written $\mu$ (read "mew"), is

$$
\mu = G\,(m_1 + m_2),
$$

with units of $\mathrm{m^3/s^2}$. With it, the relative equation of motion is

$$
\ddot{\mathbf{r}} = -\,\frac{\mu}{r^3}\,\mathbf{r}.
$$

This is a **differential equation**: it relates a quantity to its own derivatives. It is second order (two dots), it is a vector equation (three coupled equations, one each for $x$, $y$ and $z$), and it is **[[nonlinear|nonlinear]]**, because the $r^3$ in the bottom depends on the very position you are solving for. There is no trick that makes it linear. And yet it can be solved exactly, with pencil and paper. The next several lessons do that.

## The restricted problem

When one body is a spacecraft and the other is Earth, the spacecraft's mass $m$ is tiny next to Earth's mass $M$. Adding it changes nothing you could ever measure. So

$$
\mu = G\,(M + m) \approx GM .
$$

Dropping the satellite's mass like this is what makes the problem **restricted**. It also removes the difference between "the satellite's position from Earth's center" and "the satellite's position from the pair's center of mass" — they are the same point to any precision that matters.

From here on, $\mathbf{r}$ is the position of the spacecraft measured from the center of the central body, $\mathbf{v} = \dot{\mathbf{r}}$ is its velocity, and $\mu$ is the central body's gravitational parameter.

Say the assumptions out loud, because a real vehicle breaks every one of them a little:

- **Both bodies are point masses** (or perfect spheres). Earth's [[equatorial bulge|j2-bulge]] breaks this. The bulge is described by a number called $J_2$, and its effect is about one part in a thousand.
- **No other bodies pull.** The Moon and Sun do pull on the spacecraft. In low orbit their effect is tiny. At geostationary altitude it rivals the bulge.
- **No forces except gravity.** Air drag below about $1000\,\mathrm{km}$, the push of sunlight (called solar radiation pressure), and the spacecraft's own thrusters all add accelerations the equation does not know about.
- **The satellite's mass is negligible**, so $\mu = GM$ of the central body.

Inside these assumptions the equation is exact. The motion it describes — a curve called a conic section, traced out according to Kepler's laws — is the reference against which everything else is measured.

::: key The restricted two-body equation
$$
\ddot{\mathbf{r}} = -\,\frac{\mu}{r^3}\,\mathbf{r}, \qquad \mu = G\,(M + m) \approx GM .
$$
It assumes point masses (or spherically symmetric bodies), no other bodies and no non-gravitational forces. $\mathbf{r}$ is the position of the satellite from the center of the central body and $r$ is its magnitude.
:::

## Gravitational parameters and radii

You will use $\mu$ far more often than $G$ or $M$ on their own, and there is a good reason. Think of weighing a sack of flour on a kitchen scale that only reports "flour times a constant". You can know that product very precisely even if you are unsure of each factor.

Orbits are that kind of scale. Track a satellite, measure the size of its orbit and how long it takes to go around, and you get $\mu$ directly — to about ten significant figures for Earth. The constant $G$, measured separately in laboratories, is known to only about five figures. And the mass $M$ can only be worked out as $\mu/G$, so it carries the same uncertainty as $G$. The constant $G$ is [[hard to measure|measuring-mu]]. So the rule is: **never compute $\mu$ as $G$ times a tabulated mass** when a tabulated $\mu$ exists.

| Body | $\mu$ ($\mathrm{km^3/s^2}$) | Mean or equatorial radius (km) |
| --- | --- | --- |
| Earth | $398\,600.4418$ | $6378.137$ (equatorial) |
| Sun | $1.327\,124 \times 10^{11}$ | $695\,700$ |
| Moon | $4902.8$ | $1737.4$ |
| Mars | $42\,828$ | $3396.2$ |

In SI units, Earth's value is $\mu = 3.986\,004\,418 \times 10^{14}\,\mathrm{m^3/s^2}$. Most astrodynamics code carries the kilometer form, $398\,600.4418\,\mathrm{km^3/s^2}$, because positions in kilometers and speeds in kilometers per second give numbers of a comfortable size.

Pick one unit system per program and stick to it. A kilometer is $10^3$ meters, so a cubic kilometer is $10^9$ cubic meters. Mixing $\mu$ in $\mathrm{m^3/s^2}$ with positions in kilometers gives accelerations wrong by enormous factors. This is one of the most common bugs in student orbit programs, and [[unit mix-ups have lost real spacecraft|unit-bug]].

::: key Gravitational parameters and radii to know cold
Earth $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $R = 6378.137\,\mathrm{km}$. Sun $\mu = 1.327\,124 \times 10^{11}\,\mathrm{km^3/s^2}$. Moon $\mu = 4902.8\,\mathrm{km^3/s^2}$. Mars $\mu = 42\,828\,\mathrm{km^3/s^2}$.
:::

::: example How much does the satellite's mass matter?
**Checking $GM$ against the table.** Earth's mass is $M = 5.9722 \times 10^{24}\,\mathrm{kg}$. Multiply by $G$:

$$
GM = 6.674\,30 \times 10^{-11} \times 5.9722 \times 10^{24} = 3.98603 \times 10^{14}\,\mathrm{m^3/s^2}.
$$

The table says $3.986\,004\,418 \times 10^{14}$. The two differ by about 5 parts per million. That gap is the uncertainty in $G$ and $M$ showing through — which is exactly why you use the tabulated $\mu$.

**The ISS.** The International Space Station has a mass of about $4.2 \times 10^{5}\,\mathrm{kg}$. Divide by Earth's mass:

$$
\frac{m}{M} = \frac{4.2 \times 10^{5}}{5.9722 \times 10^{24}} = 7.0 \times 10^{-20}.
$$

Including the ISS mass in $G(M + m)$ changes $\mu$ around the twentieth significant figure. For any practical purpose the restricted approximation is exact.

**The Moon.** Now make the second body the Moon, with mass $7.342 \times 10^{22}\,\mathrm{kg}$:

$$
\frac{m_{\text{Moon}}}{M} = \frac{7.342 \times 10^{22}}{5.9722 \times 10^{24}} = 0.0123.
$$

That is not negligible. The gravitational parameter for the Moon's motion around Earth is the sum of the two bodies' values:

$$
G(M + m) = 398\,600.4 + 4902.8 = 403\,503.2\,\mathrm{km^3/s^2},
$$

which is 1.2 % larger than Earth's alone. An orbit's period goes as $1/\sqrt{\mu}$ (you will see why in the Kepler's-laws lesson), so using Earth's $\mu$ alone would make the Moon's computed period about 0.6 % too long — about four hours in a month. **Sanity check:** 0.6 % of 27.3 days is 0.16 days, which is 4 hours. The Moon is not a restricted two-body satellite of Earth.
:::

## Reading the equation

Before solving the equation, look at what it says.

The acceleration always points toward the center, because of the minus sign in front of $\mathbf{r}$. Its size is $\mu r/r^3 = \mu/r^2$.

Try it at Earth's surface, $r = R = 6.378137 \times 10^6\,\mathrm{m}$:

$$
\frac{\mu}{R^2} = \frac{3.986 \times 10^{14}}{(6.378137 \times 10^{6})^2} = 9.798\,\mathrm{m/s^2}.
$$

That is within 0.1 % of the **standard gravity** $g_0 = 9.80665\,\mathrm{m/s^2}$ printed in every physics book. The small difference comes from the bulge and Earth's spin, which are folded into the standard value.

Because gravity fades as $1/r^2$ instead of switching off, a spacecraft in low orbit is not **weightless** in the sense of "no gravity". Gravity there is almost as strong as on the ground. The spacecraft is falling the whole time. It misses the ground only because it is moving sideways fast enough.

::: example Gravitational acceleration in orbit
**The ISS.** The station flies about $413\,\mathrm{km}$ up. Its distance from Earth's center is the radius plus the altitude:

$$
r = 6378.137 + 413 = 6791\,\mathrm{km} = 6.791 \times 10^{6}\,\mathrm{m}.
$$

Put that into $\mu/r^2$:

$$
a = \frac{\mu}{r^2} = \frac{3.986 \times 10^{14}}{(6.791 \times 10^{6})^2} = 8.64\,\mathrm{m/s^2}.
$$

Divide by $g_0$: $8.64/9.80665 = 0.88$. The pull is 88 % of what you feel on the ground. Astronauts float because the station falls with them, not because gravity is weak.

**Geostationary orbit.** At the geostationary radius, $r = 42\,164\,\mathrm{km} = 4.2164 \times 10^{7}\,\mathrm{m}$:

$$
a = \frac{3.986 \times 10^{14}}{(4.2164 \times 10^{7})^2} = 0.224\,\mathrm{m/s^2}.
$$

That is 2.3 % of $g_0$. **Sanity check:** the GEO radius is $42\,164/6791 = 6.21$ times the ISS radius, and $6.21^2 = 38.6$, so the pull should be about 39 times weaker — and indeed $8.64/0.224 = 38.6$. A GEO satellite feels roughly forty times less pull than the ISS. That weaker pull is why it moves more slowly (about $3.07\,\mathrm{km/s}$ against $7.66\,\mathrm{km/s}$) and takes about fifteen times longer to go around, as the Kepler's-laws lesson works out.
:::

### The equation as a computer sees it

Computers integrate first-order equations — equations with one dot. So engineers bundle position and velocity into one six-number list, the **state** $\mathbf{x} = (\mathbf{r}, \mathbf{v})$, and write

$$
\dot{\mathbf{x}} =
\begin{pmatrix} \dot{\mathbf{r}} \\ \dot{\mathbf{v}} \end{pmatrix} =
\begin{pmatrix} \mathbf{v} \\ -\,\mu\,\mathbf{r}/r^3 \end{pmatrix}.
$$

Read the top line as "position changes at the rate given by the velocity". Read the bottom line as "velocity changes at the rate given by gravity".

Six starting numbers — three of position, three of velocity — fix the motion forever. That count is why **[[an orbit is described by six numbers|six-numbers]]**, whether you use this Cartesian state or the six orbital elements of later lessons.

In Python the right-hand side is short:

```python
import numpy as np

MU = 398600.4418  # km^3/s^2

def two_body(t, x):
    r = x[:3]
    rn = np.linalg.norm(r)
    return np.concatenate([x[3:], -MU * r / rn**3])

x0 = np.array([6791.0, 0.0, 0.0, 0.0, 7.661, 0.0])
print(two_body(0.0, x0))
# [ 0.  7.661  0.  -0.00864312  -0.  -0. ]   (km/s for the first three, km/s^2 for the last three)
```

The fourth number checks against the example: $8.643 \times 10^{-3}\,\mathrm{km/s^2}$ is $8.64\,\mathrm{m/s^2}$, pointing in the $-x$ direction, back toward Earth. (The "$-0.$" entries are zero with a minus sign attached — harmless.)

::: note Canonical units
Some textbooks and a lot of older code use **canonical units**. The distance unit, $\mathrm{DU}$, is the central body's radius. The time unit, $\mathrm{TU}$, is chosen so that $\mu = 1\,\mathrm{DU^3/TU^2}$. For Earth,

$$
\mathrm{TU} = \sqrt{\frac{R^3}{\mu}} = \sqrt{\frac{(6378.137)^3}{398\,600.4418}} = 806.8\,\mathrm{s},
$$

and the speed unit $\mathrm{DU/TU} = 6378.137/806.8 = 7.905\,\mathrm{km/s}$, which is the speed of a circular orbit skimming the surface. The equation becomes $\ddot{\mathbf{r}} = -\mathbf{r}/r^3$. Nothing changes physically. The point is to keep all the numbers near 1, which computers handle well. You will meet these units in Bate, Mueller and White.
:::

## How good is the model?

The equation is exact for two point masses and approximate for everything else. To decide when to trust it, compare each acceleration it leaves out with the one it keeps, $\mu/r^2$. For an Earth satellite the biggest omissions are:

- **The equatorial bulge**, of size about $\tfrac{3}{2} J_2 \mu R^2 / r^4$, with $J_2 = 1.0826 \times 10^{-3}$.
- **The Moon and Sun.** What matters is not their whole pull — Earth feels almost the same pull and falls along with the satellite — but the *difference* in pull between the satellite and Earth's center. This leftover is called the **tidal** acceleration, and for a body with parameter $\mu_{\text{body}}$ at distance $d$ it is about $2\mu_{\text{body}}\, r / d^3$.
- **Drag** from the thin upper atmosphere.

Divide each by $\mu/r^2$ to see its relative size:

| Perturbation | Ratio to $\mu/r^2$ at ISS altitude | Ratio at GEO |
| --- | --- | --- |
| Earth oblateness $J_2$ | $1.4 \times 10^{-3}$ | $3.7 \times 10^{-5}$ |
| Moon (tidal) | $1.4 \times 10^{-7}$ | $3.2 \times 10^{-5}$ |
| Sun (tidal) | $6 \times 10^{-8}$ | $1.5 \times 10^{-5}$ |
| Drag | $10^{-7}$ to $10^{-6}$, strongly variable | negligible |

Here is how to read the table.

**In low orbit**, the two-body model gets the acceleration right to about one part in a thousand at any instant. But the bulge's push acts the same way orbit after orbit, so its effect on the *orientation* of the orbit piles up — to several degrees per day, as the ground-track lesson shows.

**At GEO**, all three gravitational extras are about the same size, and each is roughly forty to a hundred times smaller than the bulge's effect at the ISS. But a GEO satellite must hold its slot for fifteen years, so even $10^{-5}$ matters.

So the two-body solution is the **reference orbit**. The later perturbation modules teach the corrections, always as small departures from what you learn here.

::: warning Relative position, not inertial position
The two-body equation governs $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$, the position of one body *relative to the other*. For a satellite around Earth this is the same as the position from Earth's center, because $m \ll M$ (read "m is much less than M"). For two bodies of comparable mass — Earth and Moon, a double asteroid, a spacecraft landing on a tiny asteroid — the relative equation still holds exactly with $\mu = G(m_1 + m_2)$. But then each body's own motion through space is only a mass-weighted share of the relative motion. Do not write $GM$ when the second mass is not negligible.
:::

::: warning Units
Positions in kilometers demand $\mu$ in $\mathrm{km^3/s^2}$. Positions in meters demand $\mathrm{m^3/s^2}$. The two forms of $\mu$ differ by a factor of $10^9$. An acceleration that is wrong by a huge factor makes an integrator either fling the satellite off to infinity or grind to a halt. When an orbit program misbehaves on its very first step, check units before anything else.
:::

## Check yourself

::: check
Start from Newton's second law for each of two isolated point masses. Show why the equation for their relative motion contains $m_1 + m_2$ rather than either mass alone.
:::

::: answer
Newton's law gives $\ddot{\mathbf{R}}_1 = G m_2 \mathbf{r}/r^3$ and $\ddot{\mathbf{R}}_2 = -G m_1 \mathbf{r}/r^3$, with $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$. Each body's acceleration is proportional to the *other* body's mass, because its own mass cancels between the force and the inertia. Subtract: $\ddot{\mathbf{r}} = \ddot{\mathbf{R}}_2 - \ddot{\mathbf{R}}_1 = -G(m_1 + m_2)\mathbf{r}/r^3$. The relative acceleration is the sum of the two separate accelerations, each one working to close the gap, so the masses add.
:::

::: check
An orbit program written in SI units is handed a position in kilometers by mistake, while $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is left unchanged. By what factor is the computed acceleration wrong, and is it too big or too small?
:::

::: answer
The acceleration's size is $\mu/r^2$. The position number is $10^3$ times too small (6791 instead of 6 791 000), so $r^2$ is $10^6$ times too small and the acceleration is $10^6$ times too *large*. The satellite seems to be pulled a million times harder than it should, and the integrator produces nonsense within one step. The fix is to use $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$. The numbers are consistent: the $10^9$ between the two forms of $\mu$ divided by the $10^6$ in $r^2$ leaves the $10^3$ that converts $\mathrm{km/s^2}$ to $\mathrm{m/s^2}$.
:::

::: check
What is the gravitational acceleration at the Moon's mean distance of $384\,400\,\mathrm{km}$ from Earth's center, and how does it compare with $g_0$?
:::

::: answer
Convert to meters, $r = 3.844 \times 10^{8}\,\mathrm{m}$, then $a = \mu/r^2 = 3.986 \times 10^{14} / (3.844 \times 10^{8})^2 = 2.70 \times 10^{-3}\,\mathrm{m/s^2}$. Divided by $g_0$, that is about $2.75 \times 10^{-4}$ — roughly one part in 3600. That comparison was [[Newton's own check|moon-test]] of the inverse-square law: the Moon is about 60 Earth radii away, and $60^2 = 3600$.
:::

::: check
List the four assumptions behind the restricted two-body equation. For each, name a real effect on an Earth satellite that breaks it.
:::

::: answer
Point masses — broken by Earth's equatorial bulge ($J_2$). No other bodies — broken by the Moon and Sun, whose tidal pull matters most at high altitude. No non-gravitational forces — broken by air drag at low altitude, solar radiation pressure, and thrusting. Negligible satellite mass, so that $\mu = GM$ — broken only for comparable bodies such as the Earth–Moon pair, never for an artificial satellite.
:::

::: check
Why do engineers use a tabulated $\mu$ for each body instead of computing it from $G$ and the body's mass?
:::

::: answer
Because $\mu$ is what orbits actually measure. From the size and period of any satellite's orbit, $\mu$ comes out to about ten significant figures. $G$ is known on its own only to about five figures, and the mass $M$ can only be found as $\mu/G$, so it carries the same uncertainty. Multiplying an uncertain $G$ by an uncertain $M$ throws away precision you already had.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{F} = -\dfrac{G m_1 m_2}{r^3}\,\mathbf{r}$ | Newton's law of gravitation, force on $m_2$ from $m_1$, $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$ |
| $\ddot{\mathbf{r}} = -\dfrac{\mu}{r^3}\,\mathbf{r}$ | Two-body equation for the relative motion |
| $\mu = G(M + m) \approx GM$ | Gravitational parameter; dropping $m$ is the restricted problem |
| Earth $\mu$ | $398\,600.4418\,\mathrm{km^3/s^2} = 3.986\,004\,418 \times 10^{14}\,\mathrm{m^3/s^2}$ |
| Earth $R$ | $6378.137\,\mathrm{km}$ |
| Sun, Moon, Mars $\mu$ | $1.327\,124 \times 10^{11}$, $4902.8$, $42\,828\,\mathrm{km^3/s^2}$ |
| $\mu/r^2$ | Gravitational acceleration: $9.80\,\mathrm{m/s^2}$ at the surface, $8.64$ at the ISS, $0.224$ at GEO |
| Assumptions | Point masses, no third bodies, no non-gravitational forces, $m \ll M$ |
| State form | $\dot{\mathbf{x}} = (\mathbf{v},\; -\mu\mathbf{r}/r^3)$ with six initial conditions |

The next lesson digs three quantities out of this equation that never change along an orbit — angular momentum, energy and the eccentricity vector. Those constants are what turn a hard nonlinear equation into geometry you can draw.

::: context falling-around Newton's cannon on a mountain
Newton drew this picture himself, in a draft written for his *Principia* and later published as *A Treatise of the System of the World*. Put a cannon on an impossibly tall mountain and fire it sideways. A slow ball lands nearby. A faster one lands farther around the curve of the Earth. Fire fast enough and the ground curves away as fast as the ball falls, so it never lands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="210" r="145" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 5"/>
  <circle cx="180" cy="210" r="130" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="168,82 180,62 192,82" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M180,65 Q215,62 234.9,92.2" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M180,65 Q265,58 286.5,135.4" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <circle cx="234.9" cy="92.2" r="3" fill="#b4232c"/>
  <circle cx="286.5" cy="135.4" r="3" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="212" y="112" font-size="12" fill="#b4232c">slow</text>
  <text x="250" y="150" font-size="12" fill="#1f2a44">faster</text>
  <text x="20" y="40" font-size="12" fill="#1d6fd1">fast enough: keeps</text>
  <text x="20" y="55" font-size="12" fill="#1d6fd1">falling, never lands</text>
  <text x="180" y="200" font-size="13" text-anchor="middle" fill="#1f2a44">Earth</text>
</svg>
```

The dashed circle is an orbit. Every satellite is a cannonball that is fast enough.
:::

::: context inverse-square Why one over distance squared
Picture gravity's pull spreading out from Earth the way light spreads from a bulb. At distance $r$ the pull is shared over some patch of area. At distance $2r$ the same pull has spread over a patch twice as wide and twice as tall — four times the area — so each piece gets a quarter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="230" y2="60" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="30" y1="100" x2="230" y2="140" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="30" cy="100" r="7" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="80" width="40" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="60" width="80" height="80" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="60" x2="270" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="100" x2="310" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="60" width="40" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">distance r</text>
  <text x="150" y="155" font-size="12" text-anchor="middle" fill="#1f2a44">1 square</text>
  <text x="270" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">distance 2r</text>
  <text x="270" y="175" font-size="12" text-anchor="middle" fill="#1f2a44">4 squares, each gets 1/4</text>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">twice as far → 4× the area → 1/4 the pull</text>
</svg>
```

This picture is a way to remember the rule, not a proof. The inverse-square law was found by matching it to the motion of the Moon and planets.
:::

::: context shell-theorem A hollow ball pulls like a point
Newton proved that a thin, even shell of mass pulls on anything outside it exactly as if all the shell's mass sat at its center. Every piece of the shell pulls in a slightly different direction and with a slightly different strength, but when you add up all the pieces, the total comes out exactly equal to one point mass at the middle. A solid planet is a stack of such shells, like an onion, so it pulls like a point too — as long as each shell is even all the way round. Earth's layers are close to that, which is why the point-mass model works so well.
:::

::: context barycenter The Earth and Moon share a balance point
Two bodies orbit their common **barycenter**, the balance point of a seesaw with Earth on one end and the Moon on the other. Because Earth is about 81 times heavier, the balance point sits about $4670\,\mathrm{km}$ from Earth's center — still inside Earth, about three quarters of the way out to the surface.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="75" r="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="310" cy="75" r="11" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="80" y1="75" x2="310" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="103.3" y1="69" x2="115.3" y2="81" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="103.3" y1="81" x2="115.3" y2="69" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="80" cy="75" r="2.5" fill="#1f2a44"/>
  <text x="80" y="135" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="310" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">Moon</text>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#b4232c">barycenter: 0.73 of an Earth radius from the center</text>
  <text x="210" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">(distance not to scale)</text>
</svg>
```

Each month, Earth's center swings around this point in a small circle. For a spacecraft and Earth the balance point is at Earth's center to any precision you can measure.
:::

::: context nonlinear What "nonlinear" means here
An equation is **linear** when doubling the cause doubles the effect. A spring is like that: pull twice as far, get twice the force. Gravity is not. Move a satellite to twice the distance and the pull does not halve — it drops to a quarter. Because the unknown position sits inside $r^3$ in the bottom of a fraction, you cannot add two solutions to get a third. Most nonlinear equations can only be solved by a computer stepping forward in time. The two-body equation is a rare lucky exception, thanks to the constants in the next lesson.
:::

::: context j2-bulge The bulge called J2
Earth spins once a day, and the spin makes it fatter at the equator. Its equatorial radius is $6378.137\,\mathrm{km}$ and its polar radius is about $6356.752\,\mathrm{km}$ — a difference of about $21\,\mathrm{km}$. Geodesists describe Earth's shape with a list of numbers, and the biggest one after the round part is $J_2 \approx 1.0826 \times 10^{-3}$, which measures this flattening. Its effect on satellites is so useful that engineers design orbits around it: sun-synchronous orbits use the bulge to swing the orbit plane around once a year, as a later lesson shows.
:::

::: context measuring-mu Why G is so hard to measure
$G$ is measured in a laboratory by watching two lead or tungsten balls attract a small hanging pair — Henry Cavendish did the first version of this experiment in 1798. The pull between lab-sized masses is fantastically weak — less than a millionth of a newton — so every stray vibration or air current matters. Different careful experiments still disagree in the fourth or fifth digit. Orbits have no such trouble: a satellite's period can be timed very precisely, and that pins down the product $GM$ directly.
:::

::: context unit-bug A spacecraft lost to units
In 1999 NASA's Mars Climate Orbiter was lost as it arrived at Mars. One piece of ground software reported thruster impulses in pound-force seconds; the software that used them expected newton-seconds, a factor of about 4.45 different. The small errors piled up over months of cruise, and the spacecraft reached Mars far lower than planned and was destroyed. The fix in your own code is cheap: pick one unit system, write it next to every constant, and check it first when something goes wrong.
:::

::: context six-numbers Six numbers pin an orbit
Why six? A point in space needs three numbers ($x$, $y$, $z$). Its velocity needs three more. Know those six at one instant and the two-body equation tells you everything that happens afterward, the way knowing where a thrown ball is and how it is moving tells you where it will land. Later in this module you will trade these six for six *orbital elements* — size, shape, tilt and so on — which describe the same orbit in a way that is easier to picture.
:::

::: context moon-test Newton's Moon test
Newton asked whether the force that drops an apple is the same force that holds the Moon. If gravity weakens as $1/r^2$, then at 60 Earth radii it should be $3600$ times weaker than at the surface. He worked out that the Moon, bending away from a straight line on its curved path, falls toward Earth about as far in one *minute* as an apple falls in its first *second*. Distance fallen grows as time squared, and a minute is 60 seconds, so that is exactly the $1/3600$ ratio — strong evidence that one law rules the sky and the ground.
:::
