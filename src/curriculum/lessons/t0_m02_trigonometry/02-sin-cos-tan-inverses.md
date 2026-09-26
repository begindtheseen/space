---
id: l02-sin-cos-tan-inverses
title: Sine, cosine, tangent and their inverses
minutes: 22
covers:
  - sin, cos, tan and their inverses
---

A ladder leans against a wall. You know how long the ladder is and how high up the wall it reaches. How steep is it — what angle does it make with the ground? That question runs the unit circle backwards. Last lesson turned an angle into a pair of numbers. Most of an engineer's working day goes the other way: you have measurements — a distance and a height, two velocity components, a sideways force and a total thrust — and you want the angle they imply.

That step, from numbers back to an angle, is what the **inverse** trig functions do. It is also the first place in this module where a careless answer can be quietly wrong by a whole quadrant.

This lesson connects the unit circle to the right-triangle ratios you may have met first, adds the tangent and three "flipped" functions, looks at sine and cosine as waves (the shape of every wobble and spin you will ever plot), and then builds the inverses carefully: what they return, what they refuse to accept, and how to get *every* answer to an equation rather than the one your calculator offers. On a real vehicle these functions sit in the climb-angle calculation, in turning a line-of-sight measurement into an elevation angle, in every antenna and solar-panel pointing routine, and — through the inverse cosine — in the angle between any two directions.

## Right triangles are scaled unit circles

A right triangle has one square corner ($90^\circ$). Pick one of its other two corners and call its angle $\theta$. The three sides get names from where they sit compared with $\theta$:

- the **[[hypotenuse|hypotenuse]]** $H$ — the longest side, across from the square corner;
- the **opposite** side $O$ — the one across from $\theta$;
- the **adjacent** side $A$ — the one next to $\theta$ that is not the hypotenuse.

Now slide the triangle onto the $xy$ grid with the corner $\theta$ at the origin and the adjacent side lying along the $+x$ axis. The far end of the hypotenuse is a point at distance $H$ from the origin, in direction $\theta$. By the last lesson, a point at distance $H$ in direction $\theta$ is $(H\cos\theta,\ H\sin\theta)$. But you can also read that point straight off the triangle: it is $A$ along and $O$ up, so it is $(A, O)$. The two descriptions are the same point, so $A = H\cos\theta$ and $O = H\sin\theta$. Divide through by $H$:

$$
\sin\theta = \frac{O}{H}, \qquad \cos\theta = \frac{A}{H}, \qquad \tan\theta = \frac{O}{A} = \frac{\sin\theta}{\cos\theta}.
$$

(Many people remember these as **[[SOH CAH TOA|soh-cah-toa]]**.) So the right-triangle ratios are not a separate definition. They are the unit circle, scaled up by $H$. The scaling also explains why the ratios depend only on the angle and not on the size of the triangle: all right triangles with the same sharp angle are **[[similar|similar-triangles]]** — the same shape, just bigger or smaller — so their sides keep the same proportions.

Back to the ladder. A $5$ m ladder reaches $4$ m up the wall, and its foot is $3$ m out from the wall (check with Pythagoras: $3^2 + 4^2 = 25 = 5^2$). For the angle $\theta$ between the ladder and the ground, the wall is opposite and the ground is adjacent, so $\sin\theta = 4/5 = 0.8$, $\cos\theta = 3/5 = 0.6$ and $\tan\theta = 4/3$.

This is the workhorse for measurements. A rocket climbing at speed $v$ with **[[flight-path angle|flight-path-angle]]** $\gamma$ (the Greek letter "gamma": the angle of its velocity above the local horizontal) has upward speed $v\sin\gamma$ and horizontal (level) speed $v\cos\gamma$. A target at straight-line distance $R$ and **elevation angle** $\varepsilon$ ("epsilon") above the horizon is at height $R\sin\varepsilon$ and horizontal distance $R\cos\varepsilon$.

::: example Velocity components at a flight-path angle
**Forwards.** Two minutes into a launch, the rocket's guidance reports a speed of $2400$ m/s at a flight-path angle of $35^\circ$.

- Upward part: $2400 \sin 35^\circ = 2400 \times 0.5736 \approx 1377$ m/s.
- Horizontal part: $2400 \cos 35^\circ = 2400 \times 0.8192 \approx 1966$ m/s.

Check with Pythagoras: $\sqrt{1377^2 + 1966^2} \approx 2400$ m/s, the speed we started with.

**Backwards.** Later in the flight, the navigation system reports $1200$ m/s upward and $3000$ m/s horizontal. The speed is $\sqrt{1200^2 + 3000^2} \approx 3231$ m/s. The flight-path angle has opposite side $1200$ and adjacent side $3000$, so $\tan\gamma = 1200/3000 = 0.4$. The angle whose tangent is $0.4$ is written $\arctan 0.4$, and a calculator gives $\gamma \approx 21.8^\circ$ ($0.3805$ rad).

Does it make sense? The angle has dropped from $35^\circ$ to about $22^\circ$: the rocket is tipping over toward level flight, as it should to build up orbital speed.
:::

## The tangent and the reciprocal functions

Picture a road sign that says "6% grade". It means the road climbs $6$ m for every $100$ m you travel along the flat: rise over run, $0.06$. That rise-over-run number is the tangent of the road's angle. The angle itself is small: about $3.43^\circ$.

On the unit circle, the **tangent** is the ratio of the two coordinates,

$$
\tan\theta = \frac{\sin\theta}{\cos\theta} = \frac{y}{x},
$$

which is the **slope** (steepness, rise over run) of the line from the origin through the point at angle $\theta$. It exists wherever $\cos\theta \ne 0$, which is everywhere except the odd multiples of $\pi/2$ ($90^\circ$, $270^\circ$, and so on). Near those angles the line is almost straight up and the tangent grows without limit: $\tan 89^\circ \approx 57.3$, $\tan 89.9^\circ \approx 573$, $\tan 89.99^\circ \approx 5730$. In code, the tangent of a nearly vertical direction is a huge number, and the tangent of an exactly vertical one is an error or an infinity.

The tangent has two features that sine and cosine do not.

- **Its period is $\pi$, not $2\pi$.** A half turn flips the sign of both $x$ and $y$, and their ratio stays the same: $\tan(\theta + \pi) = \tan\theta$. So the tangent cannot tell a direction from its exact opposite. Keep that in mind — it is the weakness the next lesson repairs.
- **Its signs.** It is positive in quadrants I and III, where $x$ and $y$ have the same sign, and negative in II and IV.

The special values come from last lesson's table: $\tan 30^\circ = (1/2)/(\sqrt{3}/2) = 1/\sqrt{3} \approx 0.577$, $\tan 45^\circ = 1$, and $\tan 60^\circ = \sqrt{3} \approx 1.732$.

Three more functions are the **reciprocals** — the "one over" — of the first three:

$$
\sec\theta = \frac{1}{\cos\theta}, \qquad \csc\theta = \frac{1}{\sin\theta}, \qquad \cot\theta = \frac{1}{\tan\theta} = \frac{\cos\theta}{\sin\theta}.
$$

They are read **secant**, **cosecant** and **cotangent**. They show up mainly inside identities and calculus. You rarely compute them directly, and most programming libraries do not even provide them. But you must recognize them: lesson 4's identity $1 + \tan^2\theta = \sec^2\theta$ is written in this language, and so is a lot of the flight-mechanics literature. Two values to anchor them: $\sec 60^\circ = 1/\cos 60^\circ = 2$, and $\csc 30^\circ = 1/\sin 30^\circ = 2$.

## The functions as waves

Ride last lesson's Ferris wheel and watch how high your seat is as time passes. It starts level with the hub, rises to the top, comes back down past the hub, sinks to the bottom, and returns — over and over. Plot that height against the angle turned and you get a smooth **[[wave|ferris-wave]]**. That wave is the graph of [[sine|sine-name]].

In numbers, $\sin\theta$ is $0$ at $\theta = 0$, rises to $1$ at $\pi/2$, comes back through $0$ at $\pi$, falls to $-1$ at $3\pi/2$, returns to $0$ at $2\pi$, and then repeats forever in both directions. The cosine graph is the same wave slid a quarter turn to the left, because $\cos\theta = \sin(\theta + \pi/2)$. It starts at $1$, reaches $0$ at $\pi/2$, $-1$ at $\pi$, and so on. The tangent graph is a different kind of thing. It climbs from very negative to very positive between each pair of neighboring odd multiples of $\pi/2$, shooting off to infinity at those points — lines it never touches, called **[[asymptotes|asymptote]]** — and it repeats every $\pi$.

Anything that swings back and forth steadily in time can be written as

$$
y(t) = A\sin(\omega t + \phi),
$$

where:

- $A$ is the **amplitude**, the peak value;
- $\omega$ is the **angular frequency** in rad/s — how fast the angle inside the sine grows;
- $\phi$ (the Greek letter "phi", said "fie") is the **phase** in radians — where in its cycle the wave starts.

Because sine repeats when its angle grows by $2\pi$, the motion repeats after a time called the **period**, $T = 2\pi/\omega$. The **frequency**, in cycles per second or **[[hertz|hertz]]** (Hz), is $f = 1/T = \omega/2\pi$. The phase slides the wave along the time axis: the first peak comes when $\omega t + \phi = \pi/2$, which is at $t = (\pi/2 - \phi)/\omega$. All of this assumes $\omega$ in rad/s and $\phi$ in radians. A period formula with $360$ in it is a sign that degrees have crept in.

::: example A sun sensor on a spinning spacecraft
A small spacecraft spins about its long axis at $3$ revolutions per minute. A sun sensor on its side gives a voltage that follows the cosine of the angle between the sensor's face and the Sun. While the Sun is in view, the output is

$$
V(t) = 0.80\cos(\omega t + \phi)\ \mathrm{volts},
$$

with phase $\phi = 0.50$ rad, set by where the sensor happened to point at $t = 0$.

**Spin rate.** Each revolution is $2\pi$ rad and a minute is $60$ s, so $3\ \mathrm{rpm} = 3 \times 2\pi/60 \approx 0.3142$ rad/s.

**Period.** $T = 2\pi/0.3142 \approx 20.0$ s. That is right: $3$ turns a minute is one turn every $20$ seconds.

**Amplitude.** $0.80$ V is the reading when the sensor points straight at the Sun.

**First zero.** Cosine first hits zero when its angle reaches $\pi/2$. Solve $0.3142\,t + 0.50 = 1.5708$: take $0.50$ from both sides to get $0.3142\,t = 1.0708$, then divide both sides by $0.3142$ to get $t \approx 3.41$ s.

From the zero crossings, the spacecraft's software can recover both the spin rate and the phase — the spacecraft's rotation angle at any moment — from one wire's signal.
:::

## Inverse functions and their principal values

Back to the ladder: $\sin\theta = 0.8$, so what is $\theta$? A calculator's inverse sine answers $53.13^\circ$. But be careful what question you are asking.

Suppose you know $\sin\theta = 0.3$ and want $\theta$. On the Ferris wheel, sine is the seat's height, and at any height between the top and bottom there are *[[two seats|principal-picture]]* — one on the right side, rising (quadrant I), and one on the left side, falling (quadrant II). Adding any number of whole turns to either gives yet another angle that works. So "the angle whose sine is $0.3$" is not one number. But a function must give back one number. The inverse functions manage this by always answering from one fixed stretch of angles, called the **principal range**:

- $\arcsin c$ (read "arc sine of c"; also written $\sin^{-1}c$, or `asin` in code) returns the angle in $[-\pi/2,\ \pi/2]$ whose sine is $c$. It only accepts $-1 \le c \le 1$.
- $\arccos c$ (`acos`) returns the angle in $[0,\ \pi]$ whose cosine is $c$. It only accepts $-1 \le c \le 1$.
- $\arctan c$ (`atan`) returns the angle in $(-\pi/2,\ \pi/2)$ whose tangent is $c$. It accepts every number $c$.

(Remember the brackets from last lesson: square means the end is included, round means it is not. Arctan's range has round brackets because the angles $\pm\pi/2$ themselves have no tangent.)

::: key Principal values of the inverse functions
$\arcsin$ returns an angle in $[-\pi/2, \pi/2]$, $\arccos$ in $[0, \pi]$, $\arctan$ in $(-\pi/2, \pi/2)$. Every other angle with the same sine, cosine or tangent comes from the principal value by the circle's symmetries: $\pi - \theta$ for sine, $-\theta$ for cosine, $\theta + \pi$ for tangent, plus whole turns.
:::

The ranges are not random. Each is the stretch, starting from a natural place, where the function hits every possible value exactly once. Sine climbs from $-1$ to $1$ exactly once as $\theta$ goes from $-\pi/2$ to $\pi/2$ — the right-hand half of the wheel, bottom to top. Cosine falls from $1$ to $-1$ exactly once between $0$ and $\pi$ — the top half, right to left. Sine's range would not work for cosine: cosine is even, so it repeats each value on both sides of zero. Tangent runs through every number once between its asymptotes at $\pm\pi/2$.

Two habits follow.

1. **The inverse only undoes the function inside the principal range.** $\arcsin(\sin 150^\circ) = \arcsin(0.5) = 30^\circ$, not $150^\circ$. And $\arccos(\cos(-40^\circ)) = 40^\circ$.
2. **Know what each can never return.** An arcsine or arctangent can never return an obtuse angle (one bigger than $90^\circ$), and an arccosine can never return a negative one. If the real answer could be obtuse, the arcsine will hand you the sharp impostor with the same sine.

::: warning Notation
$\sin^{-1}x$ means $\arcsin x$, the inverse function. It does *not* mean $1/\sin x$ — that is $\csc x$. But $\sin^{2}x$ *does* mean $(\sin x)^2$. This mix-up is traditional and permanent. In code use `asin`, and in your own writing prefer $\arcsin$ so no one can misread it.
:::

### Domain and the clamping bug

$\arcsin$ and $\arccos$ only accept numbers from $-1$ to $1$ — their **domain** — because no angle has a sine or cosine outside that range. In pure math this never causes trouble: a ratio that really is a sine cannot be bigger than $1$.

In computers it causes trouble all the time. The angle between two direction arrows of length $1$ is found by feeding a number called their dot product to an arccosine (you will meet it with vectors). Two arrows that should be exactly parallel may, after a few [[rounding errors|floating-point]], give the arccosine the number $1.0000000002$. Feed that to Python's `math.acos` and it stops with a `ValueError`. Feed it to `numpy.arccos` and you get **[[nan|nan]]**, which then spreads silently through every calculation after it. Attitude software (which works out which way a spacecraft points), star-tracker matching and pointing-error monitors have all failed this way.

The defense is to **clamp** the number — force it back inside $[-1, 1]$ — before inverting:

```python
import math

def safe_acos(c: float) -> float:
    return math.acos(max(-1.0, min(1.0, c)))

print(safe_acos(1.0000000002))   # 0.0
print(math.degrees(safe_acos(0.9998)))  # 1.1459...
```

An input of $0.9998$ means an angle of $1.15^\circ$. An input slightly above $1$ is treated as exactly parallel, which is the right reading of a rounding error.

### Compositions you can read off a triangle

Expressions like $\cos(\arcsin x)$ — "the cosine of the angle whose sine is $x$" — turn up whenever you know one trig value and need another. Draw the right triangle. $\arcsin x$ is an angle whose opposite side is $x$ and whose hypotenuse is $1$. Pythagoras makes the adjacent side $\sqrt{1 - x^2}$, so

$$
\cos(\arcsin x) = \sqrt{1 - x^2}, \qquad \tan(\arcsin x) = \frac{x}{\sqrt{1 - x^2}}.
$$

Likewise $\arctan x$ is an angle with opposite side $x$ and adjacent side $1$. The hypotenuse is $\sqrt{1 + x^2}$, so

$$
\sin(\arctan x) = \frac{x}{\sqrt{1 + x^2}}, \qquad \cos(\arctan x) = \frac{1}{\sqrt{1 + x^2}}.
$$

The square roots come out positive, and that is correct: $\arcsin x$ and $\arctan x$ both land in $[-\pi/2, \pi/2]$, the right half of the circle, where cosine is never negative. With numbers: $\cos(\arcsin 0.6) = \sqrt{1 - 0.36} = 0.8$, and $\tan(\arcsin 0.28) = 0.28/\sqrt{1 - 0.0784} \approx 0.2917$.

## Solving trigonometric equations completely

The inverse function gives you one answer. The circle's mirrors give you the rest. Below, $k$ stands for any whole number — positive, negative or zero — which mathematicians write $k \in \mathbb{Z}$ (read "k in Z", where $\mathbb{Z}$ is the set of all whole numbers).

**Sine.** $\sin\theta = c$ has the principal answer $\theta_0 = \arcsin c$ ($\theta_0$ is read "theta nought", meaning "the first theta"). The mirror $\theta \to \pi - \theta$ keeps the sine the same, so it gives a second family:

$$
\theta = \arcsin c + 2\pi k \quad\text{or}\quad \theta = \pi - \arcsin c + 2\pi k, \qquad k \in \mathbb{Z}.
$$

**Cosine.** $\cos\theta = c$ has the principal answer $\arccos c$. Cosine is even, so the mirror image $-\arccos c$ also works:

$$
\theta = \pm\arccos c + 2\pi k .
$$

**Tangent.** Tangent repeats every $\pi$, so one answer makes all the rest by half turns:

$$
\theta = \arctan c + \pi k .
$$

To list the answers between $0$ and $2\pi$, write out a few members of each family and keep the ones in range.

::: example Every solution in one turn
Solve $\sin\theta = 0.3$, $\cos\theta = -0.4$ and $\tan\theta = 2$ for $\theta$ in $[0, 2\pi)$.

**Sine.** $\arcsin 0.3 = 0.3047$ rad ($17.46^\circ$). The mirror gives $\pi - 0.3047 = 2.8369$ rad ($162.54^\circ$). Both have positive sine: one in quadrant I, one in quadrant II.

**Cosine.** $\arccos(-0.4) = 1.9823$ rad ($113.58^\circ$) — in quadrant II, as a negative cosine requires. The mirror image $-1.9823$ is below zero, so add a whole turn: $2\pi - 1.9823 = 4.3009$ rad ($246.42^\circ$), in quadrant III.

**Tangent.** $\arctan 2 = 1.1071$ rad ($63.43^\circ$). A half turn gives $1.1071 + \pi = 4.2487$ rad ($243.43^\circ$). That second answer is in quadrant III, where both coordinates are negative and their ratio is again $+2$.

This is the tangent's blind spot in action. A tangent of $2$ fits two opposite directions, and only extra information — the sign of one coordinate — can decide between them.
:::

## Python summary

All of this maps straight onto Python's standard library. Arguments and results are in radians:

```python
import math

math.sin(math.radians(35.0))          # 0.5736
math.degrees(math.asin(2.0 / 5.5))    # 21.32  (in [-90, 90])
math.degrees(math.acos(-0.4))         # 113.58 (in [0, 180])
math.degrees(math.atan(1200 / 3000))  # 21.80  (in (-90, 90))
```

NumPy has the same functions for whole arrays of numbers at once (`np.sin`, `np.arcsin`, `np.arccos`, `np.arctan`) and, importantly, `np.arctan2`, which the next lesson is about.

## Check yourself

::: check
An aircraft comes in to land on a $3^\circ$ glideslope (its path slopes down at $3^\circ$) at a ground speed of $70$ m/s. How fast is it descending?
:::

::: answer
Ground speed is the horizontal part of the velocity: the adjacent side. The descent rate is the vertical part: the opposite side. Opposite over adjacent is the tangent, so the descent rate is $70\tan 3^\circ = 70 \times 0.05241 \approx 3.67$ m/s.

(If $70$ m/s had been the speed *along* the slope — the hypotenuse — you would use $70\sin 3^\circ \approx 3.66$ m/s. At this small angle the two barely differ, a fact lesson 6 explains.)
:::

::: check
Your calculator says $\arcsin 0.5 = 30^\circ$. A friend insists that a certain angle with sine $0.5$ is $150^\circ$. Who is right? What are all the angles from $0^\circ$ up to (not including) $360^\circ$ with sine $0.5$?
:::

::: answer
Both. $\arcsin$ only returns the principal value, between $-90^\circ$ and $90^\circ$, so it reports $30^\circ$. But $\sin 150^\circ = \sin(180^\circ - 30^\circ) = \sin 30^\circ = 0.5$ as well. In one turn the answers are $30^\circ$ and $150^\circ$. Which one applies depends on information the sine alone does not carry, such as the sign of the cosine.
:::

::: check
Without a calculator, find $\cos(\arctan 0.75)$.
:::

::: answer
$0.75 = 3/4$, so $\arctan 0.75$ is the angle of a right triangle with opposite side $3$ and adjacent side $4$. Its hypotenuse is $5$ (the 3–4–5 triangle). Cosine is adjacent over hypotenuse: $4/5 = 0.8$.

The general formula agrees: $\cos(\arctan x) = 1/\sqrt{1 + x^2} = 1/\sqrt{1.5625} = 0.8$.
:::

::: check
A pointing monitor finds the angle between where a telescope was told to point and where it actually points using `math.acos(dot)`, where `dot` is the number fed to the arccosine. In testing it sometimes crashes with `ValueError: math domain error`. Explain why, and fix it.
:::

::: answer
When the two directions are nearly the same, rounding can make `dot` a hair bigger than $1$ (or a hair less than $-1$ when they are nearly opposite). That is outside the domain of $\arccos$.

Clamp before inverting: `math.acos(max(-1.0, min(1.0, dot)))`. An input of $1 + 10^{-10}$ then reads as an angle of $0$, the correct reading of a rounding error. With NumPy the failure is quieter — `np.arccos` returns `nan` — so the clamp matters even more there.
:::

::: check
Find all $\theta$ in $[0, 2\pi)$ with $\sin\theta = -0.25$, in radians and degrees.
:::

::: answer
$\arcsin(-0.25) = -0.2527$ rad, which is below zero. Add a whole turn: $-0.2527 + 2\pi = 6.0305$ rad ($345.52^\circ$), in quadrant IV.

The mirror answer is $\pi - (-0.2527) = 3.3943$ rad ($194.48^\circ$), in quadrant III.

Both quadrants have negative sine, as required.
:::

::: check
An engine pushing with $920$ kN of thrust is gimballed so that the sideways part of its push is $41.2$ kN. What is the gimbal angle, in degrees and radians?
:::

::: answer
The sideways part is the opposite side and the thrust is the hypotenuse, so it equals $F\sin\delta$, where $\delta$ ("delta") is the gimbal angle. So $\sin\delta = 41.2/920 \approx 0.04478$ and $\delta = \arcsin 0.04478 \approx 0.04480$ rad $\approx 2.57^\circ$.

Notice how close the angle in radians is to its sine. That is the small-angle behavior lesson 6 makes precise.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\sin\theta = O/H$, $\cos\theta = A/H$, $\tan\theta = O/A$ | Right-triangle ratios; a scaled unit circle |
| $\tan\theta = \sin\theta/\cos\theta$ | Slope of the direction; undefined at odd multiples of $\pi/2$; period $\pi$ |
| $\sec = 1/\cos$, $\csc = 1/\sin$, $\cot = 1/\tan$ | Reciprocal functions |
| $A\sin(\omega t + \phi)$ | Amplitude $A$, angular frequency $\omega$, phase $\phi$, period $T = 2\pi/\omega$ |
| $\arcsin c \in [-\pi/2, \pi/2]$ | Principal value; needs $-1 \le c \le 1$ |
| $\arccos c \in [0, \pi]$ | Principal value; needs $-1 \le c \le 1$ |
| $\arctan c \in (-\pi/2, \pi/2)$ | Principal value; any real $c$ |
| $\cos(\arcsin x) = \sqrt{1 - x^2}$, $\cos(\arctan x) = 1/\sqrt{1 + x^2}$ | Read off a right triangle |
| $\sin\theta = c \Rightarrow \theta = \arcsin c + 2\pi k$ or $\pi - \arcsin c + 2\pi k$ | Complete solution |
| $\cos\theta = c \Rightarrow \theta = \pm\arccos c + 2\pi k$ | Complete solution |
| $\tan\theta = c \Rightarrow \theta = \arctan c + \pi k$ | Complete solution |
| Clamp before $\arcsin$/$\arccos$ | Rounding can push a ratio outside $[-1, 1]$ |

Next lesson: we take the tangent's blind spot seriously. When a direction is given by two components rather than one ratio, there is a function that returns the correct angle in every quadrant — and using anything else in flight code is a bug.

::: context hypotenuse A word for the long side
**Hypotenuse** comes from an ancient Greek phrase meaning "stretching under" — the side that stretches across, under the right angle, from one end of the triangle to the other. It is always the longest side, and it is always the one across from the square corner.

"Opposite" and "adjacent" are ordinary English: adjacent means "next to". Which side is which depends on the angle you picked. Switch to the other sharp corner, and the opposite and adjacent sides trade places while the hypotenuse stays the hypotenuse.
:::

::: context soh-cah-toa A memory trick
Read it as three little words:

- **SOH**: **S**ine is **O**pposite over **H**ypotenuse.
- **CAH**: **C**osine is **A**djacent over **H**ypotenuse.
- **TOA**: **T**angent is **O**pposite over **A**djacent.

It is a crutch for triangles only. For angles past $90^\circ$ there is no triangle to read, and you go back to the unit circle: cosine is the $x$ coordinate, sine is the $y$ coordinate.
:::

::: context similar-triangles Same shape, different size
These two right triangles have the same angle $\theta$. The big one is the small one doubled, so every side is twice as long — and every ratio of sides is unchanged.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="20,150 100,150 100,90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="170,150 330,150 330,30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="92" y="142" width="8" height="8" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="322" y="142" width="8" height="8" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <path d="M38,150 A18,18 0 0,0 34.4,139.2" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M192,150 A22,22 0 0,0 187.6,136.8" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="42" y="146" font-size="11" fill="#b4232c">θ</text>
  <text x="197" y="145" font-size="11" fill="#b4232c">θ</text>
  <text x="60" y="166" font-size="12" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="106" y="124" font-size="12" fill="#1f2a44">3</text>
  <text x="54" y="112" font-size="12" fill="#1f2a44" text-anchor="end">5</text>
  <text x="250" y="166" font-size="12" fill="#1f2a44" text-anchor="middle">8</text>
  <text x="336" y="94" font-size="12" fill="#1f2a44">6</text>
  <text x="240" y="82" font-size="12" fill="#1f2a44" text-anchor="end">10</text>
  <text x="20" y="30" font-size="12" fill="#1f2a44">sin θ = 3/5 = 6/10 = 0.6</text>
  <text x="20" y="48" font-size="12" fill="#1f2a44">tan θ = 3/4 = 6/8 = 0.75</text>
</svg>
```

That is why a sine is a property of the angle alone. Draw the triangle any size you like; the ratio comes out the same.
:::

::: context flight-path-angle The flight-path angle, drawn
The arrow is the rocket's velocity. Its angle above the local horizon is the flight-path angle $\gamma$. The horizontal and vertical parts are the adjacent and opposite sides of a right triangle whose hypotenuse is the speed $v$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs><marker id="vh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <line x1="20" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="340" y="168" font-size="11" fill="#6c7a93" text-anchor="end">local horizontal</text>
  <line x1="60" y1="150" x2="182.87" y2="150" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="182.87" y1="150" x2="182.87" y2="63.96" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="60" y1="150" x2="182.87" y2="63.96" stroke="#1d6fd1" stroke-width="3" marker-end="url(#vh)"/>
  <path d="M90,150 A30,30 0 0,0 84.57,132.79" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="96" y="143" font-size="13" fill="#1f2a44">γ</text>
  <text x="108" y="96" font-size="13" fill="#1d6fd1" text-anchor="end">v</text>
  <text x="121" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">v cos γ</text>
  <text x="190" y="112" font-size="12" fill="#b4232c">v sin γ</text>
</svg>
```

Early in a launch $\gamma$ is close to $90^\circ$ (straight up). By the time the rocket reaches orbit it is close to $0^\circ$ (flying level).
:::

::: context ferris-wave The Ferris wheel draws a wave
Track the seat's height (red, the sine) and its sideways position (blue, the cosine) as the wheel turns once. Both trace the same wave shape; cosine is a quarter turn ahead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="40" y1="25" x2="40" y2="155" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="36" y1="35" x2="44" y2="35" stroke="#6c7a93"/><line x1="36" y1="145" x2="44" y2="145" stroke="#6c7a93"/>
  <text x="32" y="39" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="32" y="149" font-size="11" fill="#1f2a44" text-anchor="end">−1</text>
  <polyline points="40.0,90.0 45.0,83.8 50.0,77.8 55.0,71.8 60.0,66.1 65.0,60.7 70.0,55.7 75.0,51.1 80.0,47.0 85.0,43.4 90.0,40.4 95.0,38.1 100.0,36.4 105.0,35.3 110.0,35.0 115.0,35.3 120.0,36.4 125.0,38.1 130.0,40.4 135.0,43.4 140.0,47.0 145.0,51.1 150.0,55.7 155.0,60.7 160.0,66.1 165.0,71.8 170.0,77.8 175.0,83.8 180.0,90.0 185.0,96.2 190.0,102.2 195.0,108.2 200.0,113.9 205.0,119.3 210.0,124.3 215.0,128.9 220.0,133.0 225.0,136.6 230.0,139.6 235.0,141.9 240.0,143.6 245.0,144.7 250.0,145.0 255.0,144.7 260.0,143.6 265.0,141.9 270.0,139.6 275.0,136.6 280.0,133.0 285.0,128.9 290.0,124.3 295.0,119.3 300.0,113.9 305.0,108.2 310.0,102.2 315.0,96.2 320.0,90.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="40.0,35.0 45.0,35.3 50.0,36.4 55.0,38.1 60.0,40.4 65.0,43.4 70.0,47.0 75.0,51.1 80.0,55.7 85.0,60.7 90.0,66.1 95.0,71.8 100.0,77.8 105.0,83.8 110.0,90.0 115.0,96.2 120.0,102.2 125.0,108.2 130.0,113.9 135.0,119.3 140.0,124.3 145.0,128.9 150.0,133.0 155.0,136.6 160.0,139.6 165.0,141.9 170.0,143.6 175.0,144.7 180.0,145.0 185.0,144.7 190.0,143.6 195.0,141.9 200.0,139.6 205.0,136.6 210.0,133.0 215.0,128.9 220.0,124.3 225.0,119.3 230.0,113.9 235.0,108.2 240.0,102.2 245.0,96.2 250.0,90.0 255.0,83.8 260.0,77.8 265.0,71.8 270.0,66.1 275.0,60.7 280.0,55.7 285.0,51.1 290.0,47.0 295.0,43.4 300.0,40.4 305.0,38.1 310.0,36.4 315.0,35.3 320.0,35.0" fill="none" stroke="#1d6fd1" stroke-width="2.5" stroke-dasharray="7 4"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="170">π/2</text><text x="180" y="170">π</text><text x="250" y="170">3π/2</text><text x="320" y="170">2π</text>
  </g>
  <g stroke="#6c7a93"><line x1="110" y1="86" x2="110" y2="94"/><line x1="180" y1="86" x2="180" y2="94"/><line x1="250" y1="86" x2="250" y2="94"/><line x1="320" y1="86" x2="320" y2="94"/></g>
  <text x="118" y="28" font-size="12" fill="#b4232c">sin θ</text>
  <text x="48" y="24" font-size="12" fill="#1d6fd1">cos θ</text>
</svg>
```

Waves like this are everywhere on a spacecraft: a spinning sensor's output, a wobbling solar panel, the swing of a pendulum-like sloshing fuel load.
:::

::: context sine-name Where "sine" comes from
The word has a strange history. A line straight across a circle looks like the string of an archer's bow, and mathematicians in India called half of it *ardha-jya*, "half bowstring", soon shortened to *jya* or *jiva*. Arabic scholars borrowed the word as *jiba*. Arabic is often written without vowels, and later readers took it for a similar-looking word meaning a fold or pocket. When it was translated into Latin, that became *sinus*, "fold" — and *sinus* became our "sine".

"Cosine" came later, short for "sine of the complement": the sine of the angle that makes a right angle when added to yours.
:::

::: context asymptote Lines a graph never touches
An **asymptote** is a line that a graph gets closer and closer to but never reaches. The tangent graph has upright asymptotes at $90^\circ$, $270^\circ$ and every other odd multiple of $90^\circ$.

The reason is the division: $\tan\theta = \sin\theta / \cos\theta$, and as $\theta$ nears $90^\circ$ the cosine on the bottom shrinks toward $0$ while the sine on top stays near $1$. Dividing by a smaller and smaller number gives a bigger and bigger answer. At exactly $90^\circ$ you would be dividing by zero, which has no answer at all.
:::

::: context hertz Cycles per second
One **hertz** (Hz) is one full cycle per second. It is named after Heinrich Hertz, the German physicist who first made and detected radio waves in the 1880s.

Be careful with the two kinds of "frequency". The frequency $f$ counts cycles per second. The angular frequency $\omega$ counts radians per second. One cycle is $2\pi$ radians, so $\omega = 2\pi f$. A spacecraft spinning once every $20$ s has $f = 0.05$ Hz and $\omega \approx 0.314$ rad/s — the same spin, two ways of counting it.
:::

::: context principal-picture Why arcsin picks one answer
Two points on the unit circle have height $0.3$. The arcsine only looks at the right-hand half of the circle (blue), from $-\pi/2$ at the bottom to $\pi/2$ at the top, so it returns the one on the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="105" x2="280" y2="105" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="20" x2="180" y2="195" stroke="#6c7a93" stroke-width="1.2"/>
  <circle cx="180" cy="105" r="75" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M180,180 A75,75 0 0,0 180,30" fill="none" stroke="#1d6fd1" stroke-width="5"/>
  <line x1="90" y1="82.5" x2="270" y2="82.5" stroke="#f2b880" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="180" y1="105" x2="251.55" y2="82.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="105" x2="108.45" y2="82.5" stroke="#b4232c" stroke-width="2"/>
  <circle cx="251.55" cy="82.5" r="4.5" fill="#1d6fd1"/>
  <circle cx="108.45" cy="82.5" r="4.5" fill="#b4232c"/>
  <text x="274" y="78" font-size="12" fill="#1d6fd1">17.5° (arcsin)</text>
  <text x="86" y="72" font-size="12" fill="#b4232c" text-anchor="end">162.5°</text>
  <text x="274" y="96" font-size="11" fill="#1f2a44">height 0.3</text>
  <text x="186" y="26" font-size="11" fill="#1d6fd1">π/2</text>
  <text x="186" y="194" font-size="11" fill="#1d6fd1">−π/2</text>
</svg>
```

The red answer, $\pi$ minus the blue one, is just as correct. Only you know which one the problem needs.
:::

::: context floating-point Why a computer gets 1.0000000002
Computers store ordinary decimal numbers in a format called **floating point**, which keeps about $16$ significant digits. Most numbers — even simple ones like $0.1$ — cannot be stored exactly in the binary code computers use, so each is rounded a tiny bit. Every calculation adds another tiny rounding.

Usually nobody notices. But when a result should be exactly $1$ and lands a hair above it, a function like arccosine that refuses anything over $1$ suddenly fails. Try it in Python: `0.1 + 0.2` prints `0.30000000000000004`.
:::

::: context nan Not a number
**nan** stands for "not a number". It is the value a computer gives when a calculation has no sensible answer, such as the arccosine of $1.0000000002$ or zero divided by zero.

The danger is that nan spreads. Any calculation that touches a nan gives nan — add it, multiply it, take its sine. One bad input can quietly turn a whole navigation solution into nan, and code that compares numbers can behave strangely, because nan is not even equal to itself. That is why engineers clamp inputs *before* the arccosine rather than checking for trouble after.
:::
