---
id: l08-definite-integral-fundamental-theorem
title: The definite integral and the fundamental theorem of calculus
minutes: 24
covers:
  - the definite integral and the fundamental theorem of calculus
---

Think of a car's odometer. Nobody measures the distance to your grandmother's house with a tape. The car counts wheel turns, a little at a time, and adds them up. By the end of the trip the total is on the dashboard. Adding up a rate, bit by bit, to get a total: that is what this lesson is about. It is called **integration**.

A spacecraft does the same thing. An **[[inertial navigation system|ins]]** (INS) cannot see where it is. It has accelerometers, which report acceleration a few hundred times a second, and gyroscopes, which report how fast the vehicle is turning. Everything else — velocity, position, which way it points — comes from adding up those rates over time. An INS is the purest example of integration in engineering: a running total kept by flight software, tick by tick, where every error in each reading piles up in the result.

Integration also defines the totals that guidance cares about. The $\Delta v$ ("delta-v", the change in speed) that a burn delivers is the integral of thrust acceleration over the burn. Gravity loss is the integral of $g\sin\gamma$ over the climb. Total impulse is the integral of thrust. Propellant used is the integral of mass flow. Each of these is an area under a curve. And when the curve has a formula, each can be found without adding up anything at all — because of the theorem that gives this lesson its name. The **fundamental theorem of calculus** says that integration and differentiation undo each other.

## Adding up a rate: the Riemann sum

Suppose a vehicle's speed along its path is $v(t)$, and you want the distance covered between time $t = a$ and $t = b$. If the speed were constant, the answer would be speed times time, $v\,(b - a)$. It is not constant. So chop the time into $n$ short pieces, each of width

$$
\Delta t = \frac{b - a}{n}.
$$

Call the edges $t_0 = a, t_1, \dots, t_n = b$. On one short piece the speed hardly changes. So the distance covered in the $i$-th piece is close to $v(t_i^*)\,\Delta t$, where $t_i^*$ ("t i star") is any sample time you like inside that piece. Add up all the pieces:

$$
S_n = \sum_{i=1}^{n} v(t_i^*)\,\Delta t.
$$

This is a **[[Riemann sum|riemann]]**: a stack of thin rectangles, each as tall as the speed and as wide as the time slice. [[The picture|rectangles-picture]] shows five of them.

Now let the pieces get thinner and thinner. "The speed hardly changes" becomes exactly true in the limit. If the sums settle down to one number — the same number whatever sample times you picked — that number is the **definite integral**:

$$
\int_a^b v(t)\,dt = \lim_{n \to \infty} \sum_{i=1}^{n} v(t_i^*)\,\Delta t.
$$

Read it aloud as "the integral from $a$ to $b$ of $v$ of $t$, d t". The notation is a fossil of the sum. The **[[integral sign|long-s]]** $\int$ is a stretched letter S, for "sum". $v(t)\,dt$ is "height times a very thin width". The numbers $a$ and $b$ are the **limits of integration**: where you start adding and where you stop.

The letter $t$ inside is a placeholder. $\int_a^b v(t)\,dt$ and $\int_a^b v(\tau)\,d\tau$ are the same number, the way "for each student" and "for each pupil" describe the same count.

### Signed area

In a picture, the integral is the area between the graph and the horizontal axis — with a sign. Area above the axis counts as positive. Area below counts as negative.

For a velocity, that means the integral gives the **displacement** — how far you ended up from where you started — not the total distance traveled. Walk $10$ meters forward and $10$ meters back: your displacement is zero, but your feet covered $20$ meters. For the distance you add up the speed without its sign, $\int_a^b |v|\,dt$. ($|v|$, "the absolute value of $v$", is its size without its sign.)

### Which functions can you integrate?

Every **continuous** function on $[a, b]$ — one whose graph you can draw without lifting your pencil — has an integral. So does every function that stays bounded and has only a few jumps. That covers every thrust profile, which jumps up at ignition and down at cutoff.

The choice of sample point gives three common ways to compute a sum:

- the **left sum** uses the start of each piece, $t_i^* = t_{i-1}$;
- the **right sum** uses the end, $t_i^* = t_i$;
- the **midpoint sum** uses the middle of each piece.

An INS that multiplies each accelerometer reading by the time between samples and adds it to its velocity is computing a left Riemann sum.

::: example Displacement from a velocity profile
Lesson 2's rocket climbed with altitude $h(t) = 3t^2 + 0.02t^3$ meters, so its vertical velocity is $v(t) = 6t + 0.06t^2$ in $\mathrm{m/s}$. Estimate $\displaystyle\int_0^{10} v\,dt$ with Riemann sums and compare with the truth.

**The truth.** Altitude is what velocity adds up to, so the answer is the change in altitude: $h(10) - h(0) = 300 + 20 - 0 = 320\,\mathrm{m}$.

**Ten pieces.** With $n = 10$, each piece is $\Delta t = 1\,\mathrm{s}$ wide.

- Left sum: $\sum_{i=0}^{9} v(i) \times 1 = 287.1\,\mathrm{m}$.
- Right sum: $\sum_{i=1}^{10} v(i) \times 1 = 353.1\,\mathrm{m}$.
- Midpoint sum: $\sum_{i=0}^{9} v(i + 0.5) \times 1 = 319.95\,\mathrm{m}$.

**More pieces.**

| $n$ | Left | Right | Midpoint |
| --- | --- | --- | --- |
| $10$ | $287.10$ | $353.10$ | $319.950$ |
| $100$ | $316.70$ | $323.30$ | $319.9995$ |
| $1000$ | $319.67$ | $320.33$ | $320.0000$ |

**Why each is off.** The speed is rising. So the left sum, which uses the smallest speed in each piece, comes up short. The right sum, using the largest, overshoots. Both errors shrink in step with $1/n$ — ten times the pieces, a tenth of the error. The midpoint error shrinks like $1/n^2$ — ten times the pieces, a hundredth of the error. Within each piece, the midpoint's overshoot on one half and undershoot on the other nearly cancel, the same way the central difference gained an order in the last lesson.

**On a vehicle.** An INS running a left sum at $100\,\mathrm{Hz}$ on a smoothly changing acceleration $a$ loses about $\tfrac12\dot a\,\Delta t^2$ of velocity on every step. Over a whole maneuver that adds up to about $\tfrac12\Delta t$ times the total change in acceleration. Real systems use higher-order update rules to avoid it.
:::

## Rules you will use without thinking

Each rule is true for ordinary sums of rectangles, so it stays true in the limit.

- **Linearity.** Constants pull out and sums split: $\displaystyle\int_a^b \big(\alpha f + \beta g\big)\,dx = \alpha\int_a^b f\,dx + \beta\int_a^b g\,dx$. ($\alpha$ and $\beta$, "alpha" and "beta", are any constants.)
- **Adding intervals.** $\displaystyle\int_a^c f\,dx = \int_a^b f\,dx + \int_b^c f\,dx$. A burn added up in two parts gives the same $\Delta v$ as in one.
- **Direction.** $\displaystyle\int_b^a f\,dx = -\int_a^b f\,dx$, and $\displaystyle\int_a^a f\,dx = 0$. Adding up backward in time flips the sign. A **smoother** — a filter that runs back through old data to improve past estimates — does exactly this.
- **Comparison.** If $m \le f(x) \le M$ on $[a, b]$, then $m(b - a) \le \displaystyle\int_a^b f\,dx \le M(b - a)$. And $\left|\displaystyle\int_a^b f\,dx\right| \le \displaystyle\int_a^b |f|\,dx$.

### The average value

Suppose you drive $120$ kilometers in $2$ hours. Your average speed is $60$ km/h. Somewhere along the way your speedometer must have read exactly $60$ — you cannot go from below to above without passing through it.

The integral version: the **average value** of $f$ on $[a, b]$ is

$$
\frac{1}{b - a}\int_a^b f\,dx.
$$

The **mean value theorem for integrals** says a continuous function hits its average somewhere. There is a point $c$ in $[a, b]$ with

$$
\int_a^b f(x)\,dx = f(c)\,(b - a).
$$

It follows from the comparison rule plus the intermediate value theorem of lesson 1: the average lies between the smallest and largest values of $f$, and a continuous function passes through every value in between. On a vehicle: the average thrust acceleration over a burn is $\Delta v$ divided by the burn time, and at some instant the vehicle feels exactly that acceleration.

## The fundamental theorem, part one

Picture filling a bathtub. How fast is the amount of water growing right now? At exactly the rate water is coming out of the tap. The rate of change of a running total *is* the rate you are adding to it. That everyday fact is part one of the theorem.

Now the precise version. Fix a starting point $a$, and let the end point $x$ move. For a continuous $f$, define the **accumulation function**

$$
F(x) = \int_a^x f(t)\,dt,
$$

the area swept out from $a$ to $x$ — the water in the tub so far. As $x$ moves right, how fast does the area grow?

Form the difference quotient from lesson 2. By the rule for adding intervals,

$$
F(x + h) - F(x) = \int_a^{x+h} f(t)\,dt - \int_a^x f(t)\,dt = \int_x^{x+h} f(t)\,dt.
$$

That is a thin strip of area between $x$ and $x + h$. By the mean value theorem for integrals, the strip equals $f(c_h)\,h$ for some $c_h$ between $x$ and $x + h$. Divide by $h$:

$$
\frac{F(x + h) - F(x)}{h} = f(c_h).
$$

Now let $h \to 0$. The point $c_h$ is trapped between $x$ and $x + h$, so it is squeezed to $x$. Because $f$ is continuous, $f(c_h) \to f(x)$. Therefore

$$
\frac{d}{dx}\int_a^x f(t)\,dt = f(x).
$$

Differentiating the accumulated area gives back the function you were adding up. [[The strip picture|strip-picture]] shows the idea.

**When the end point is itself a function.** If the upper limit is $u(x)$ instead of $x$, the chain rule of lesson 3 adds a factor:

$$
\frac{d}{dx}\int_a^{u(x)} f(t)\,dt = f\big(u(x)\big)\,u'(x).
$$

With both ends moving, write the integral as the difference of two accumulation functions and differentiate each:

$$
\frac{d}{dx}\int_{\ell(x)}^{u(x)} f(t)\,dt = f(u)\,u' - f(\ell)\,\ell'.
$$

## The fundamental theorem, part two

Part one says the accumulation function $F$ is *an* **antiderivative** of $f$ — a function whose derivative is $f$. Suppose you already know some other antiderivative, $G$, with $G' = f$. How are $F$ and $G$ related?

Their difference has derivative $(F - G)' = f - f = 0$. The maxima and minima lesson showed that a function with zero derivative everywhere on an interval is constant. So $F(x) = G(x) + C$ for some number $C$.

Find $C$ by looking at $x = a$. There $F(a) = \int_a^a f\,dt = 0$, so $0 = G(a) + C$ and $C = -G(a)$. Now look at $x = b$:

$$
\int_a^b f(x)\,dx = F(b) = G(b) - G(a).
$$

Any antiderivative works, because the constant cancels in the subtraction. Writing $f = G'$ shows how neatly this pairs with part one:

$$
\int_a^b G'(x)\,dx = G(b) - G(a).
$$

In words: add up a rate of change, and you get the net change. Add up velocity, get the change in position. Add up acceleration, get the change in velocity. Add up mass flow, get the propellant used. The right-hand side is often written $\big[G(x)\big]_a^b$, read "G of x, evaluated from a to b".

::: note Why it has to be true, without part one
Here is a second proof that shows *why* the sums collapse. Chop $[a, b]$ into $n$ pieces with edges $x_0, x_1, \ldots, x_n$. The total change in $G$ is the sum of the changes across the pieces:

$$
G(b) - G(a) = \big[G(x_1) - G(x_0)\big] + \big[G(x_2) - G(x_1)\big] + \cdots + \big[G(x_n) - G(x_{n-1})\big].
$$

Every middle value appears once with a plus and once with a minus, so it cancels. This is a **[[telescoping sum|telescoping]]**. Now apply the mean value theorem of the maxima and minima lesson to each bracket: $G(x_i) - G(x_{i-1}) = G'(\xi_i)\,\Delta x$ for some point $\xi_i$ in the $i$-th piece. So

$$
G(b) - G(a) = \sum_{i=1}^{n} G'(\xi_i)\,\Delta x.
$$

The right side is a Riemann sum of $G'$ — with cleverly chosen sample points — and it equals $G(b) - G(a)$ *exactly*, for every $n$. Let $n \to \infty$. The Riemann sum becomes the integral, and the equality survives.
:::

::: key Fundamental theorem of calculus
$\displaystyle\int_a^b f'(x)\,dx = f(b) - f(a)$, and $\dfrac{d}{dx}\displaystyle\int_a^x f(t)\,dt = f(x)$. Integration and differentiation undo each other: the integral of a rate is the net change, and the rate of change of an accumulated total is the integrand.
:::

## Antiderivatives

The theorem turns every definite integral into a hunt for an antiderivative. So the table of derivatives from earlier lessons, read backward, becomes a table of integrals.

The **indefinite integral** $\int f(x)\,dx$ — no limits — means the whole family of antiderivatives. They differ only by a constant, written $+ C$, because adding a constant does not change a derivative.

| $f(x)$ | $\int f(x)\,dx$ | Because |
| --- | --- | --- |
| $x^n$, $n \ne -1$ | $\dfrac{x^{n+1}}{n+1} + C$ | $\frac{d}{dx}x^{n+1} = (n+1)x^n$ |
| $\dfrac{1}{x}$ | $\ln\lvert x\rvert + C$ | $\frac{d}{dx}\ln x = 1/x$ |
| $e^{kx}$ | $\dfrac{1}{k}e^{kx} + C$ | chain rule |
| $\sin x$, $\cos x$ | $-\cos x + C$, $\sin x + C$ | $\frac{d}{dx}\cos x = -\sin x$ |
| $\sec^2 x$ | $\tan x + C$ | $\frac{d}{dx}\tan x = \sec^2 x$ |
| $\dfrac{1}{1 + x^2}$ | $\arctan x + C$ | implicit differentiation lesson |
| $\dfrac{1}{\sqrt{1 - x^2}}$ | $\arcsin x + C$ | implicit differentiation lesson |

The case $n = -1$ is the one the power rule cannot handle, and it produces a logarithm. It is also the case that runs the rocket equation: $\int dm/m = \ln m$. The absolute value in $\ln|x|$ lets the formula work for negative $x$ too.

Always check an antiderivative by differentiating it. That is the only test that matters.

::: example Delta-v of a constant-thrust burn
A first stage makes constant thrust $T = 7600\,\mathrm{kN}$ and burns propellant at a steady $\dot m_p = 2600\,\mathrm{kg/s}$ ("m dot sub p", the mass flow). It starts at $m_0 = 550\,000\,\mathrm{kg}$ and burns for $t_b = 162\,\mathrm{s}$. Ignoring gravity and air drag, what $\Delta v$ does it deliver?

**Set up the integral.** The mass at time $t$ is $m(t) = m_0 - \dot m_p t$. The thrust acceleration is force over mass:

$$
a(t) = \frac{T}{m_0 - \dot m_p t}, \qquad \Delta v = \int_0^{t_b} a(t)\,dt.
$$

**Guess an antiderivative.** Try $G(t) = -\dfrac{T}{\dot m_p}\ln(m_0 - \dot m_p t)$. Check it with the chain rule: the derivative of $\ln(m_0 - \dot m_p t)$ is $\dfrac{-\dot m_p}{m_0 - \dot m_p t}$, so

$$
G'(t) = -\frac{T}{\dot m_p}\cdot\frac{-\dot m_p}{m_0 - \dot m_p t} = \frac{T}{m_0 - \dot m_p t}.
$$

That is $a(t)$, as required.

**Apply part two.** Writing $m_f = m_0 - \dot m_p t_b$ for the final mass,

$$
\Delta v = G(t_b) - G(0) = \frac{T}{\dot m_p}\Big[\ln m_0 - \ln(m_0 - \dot m_p t_b)\Big] = \frac{T}{\dot m_p}\ln\frac{m_0}{m_f}.
$$

**Numbers.** $T/\dot m_p = 7.6 \times 10^6/2600 = 2923\,\mathrm{m/s}$. This ratio is the **effective exhaust velocity** $v_e$, which is the same as a **[[specific impulse|isp]]** of $I_{sp} = v_e/g_0 = 298\,\mathrm{s}$. The final mass is $m_f = 550\,000 - 2600 \times 162 = 128\,800\,\mathrm{kg}$, so $m_0/m_f = 4.270$ and

$$
\Delta v = 2923 \ln 4.270 = 4243\,\mathrm{m/s}.
$$

**Check.** A midpoint Riemann sum with a thousand pieces gives $4243.3\,\mathrm{m/s}$, confirming the antiderivative.

**Sanity check.** Suppose you had assumed the starting acceleration, $T/m_0 = 13.8\,\mathrm{m/s^2}$, held for the whole burn. You would get $13.8 \times 162 \approx 2240\,\mathrm{m/s}$ — barely half the truth. The rocket gets lighter, so its acceleration climbs to $T/m_f = 59.0\,\mathrm{m/s^2}$ at cutoff. The average is $\Delta v/t_b = 26.2\,\mathrm{m/s^2}$, which sits between the two, as it must.

You have derived the ideal rocket equation, $\Delta v = v_e\ln(m_0/m_f)$, by integrating the thrust acceleration. The last lesson of this module derives it again from momentum and adds gravity.
:::

::: example Gravity loss during a pitch-over
While a rocket climbs, gravity pulls straight down. Only the part of gravity that points along the direction of travel slows the rocket down. That part is $g\sin\gamma$, where $\gamma$ ("gamma") is the **flight-path angle** — how steeply the rocket is climbing, measured up from the local horizontal. ([[This picture|gravity-split]] shows the split.) The speed it takes away is the **gravity loss**, $\displaystyle\int_0^{t_b} g\sin\gamma\,dt$.

Take $g = g_0 = 9.80665\,\mathrm{m/s^2}$, and a **pitch program** — the planned tilt over time — in which $\gamma$ falls steadily from $90^\circ$ (straight up) at liftoff to $30^\circ$ at cutoff, $t_b = 162\,\mathrm{s}$ — the same burn as the last example.

**Write $\gamma$ as a formula.** In radians, $\gamma$ falls by $60^\circ = \pi/3$ over $162\,\mathrm{s}$:

$$
\gamma(t) = \frac{\pi}{2} - kt, \qquad k = \frac{\pi/3}{162} = 6.464 \times 10^{-3}\,\mathrm{rad/s}.
$$

**Find an antiderivative.** Try $\dfrac{1}{k}\cos(\pi/2 - kt)$. Differentiate with the chain rule: $\dfrac{1}{k}\cdot\big(-\sin(\pi/2 - kt)\big)\cdot(-k) = \sin(\pi/2 - kt)$. It works.

**Evaluate.**

$$
\int_0^{162}\sin\gamma\,dt = \frac{1}{k}\Big[\cos\gamma(162) - \cos\gamma(0)\Big] = \frac{\cos 30^\circ - \cos 90^\circ}{k} = \frac{0.8660}{6.464 \times 10^{-3}} = 134.0\,\mathrm{s}.
$$

So the gravity loss is $g_0 \times 134.0 = 1314\,\mathrm{m/s}$.

**Compare.** Flying straight up the whole time would lose $g_0 t_b = 1589\,\mathrm{m/s}$. Tilting over saved $275\,\mathrm{m/s}$. Tilting sooner would save more, which is why a **[[gravity turn|gravity-turn]]** starts as early as the air loads allow. Against the $4243\,\mathrm{m/s}$ of the last example, a loss of about $1.3\,\mathrm{km/s}$ is typical for a first stage. It is why the $\Delta v$ a real climb achieves always falls well short of the rocket equation's figure.
:::

::: example Work against gravity to orbital altitude
How much energy does it take to lift one kilogram from Earth's surface ($R_E = 6371\,\mathrm{km}$) to $400\,\mathrm{km}$ altitude? Gravity weakens with distance $r$ from Earth's center as $\mu/r^2$, with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. The **work** — force times distance, added up — is

$$
W = \int_{R_E}^{R_E + h}\frac{\mu}{r^2}\,dr.
$$

**Antiderivative.** $\mu r^{-2}$ has antiderivative $-\mu r^{-1}$ (power rule with $n = -2$: raise the power to $-1$ and divide by $-1$).

**Evaluate.**

$$
W = \Big[-\frac{\mu}{r}\Big]_{R_E}^{R_E + h} = \mu\left(\frac{1}{R_E} - \frac{1}{R_E + h}\right) = 3.986 \times 10^{14}\left(\frac{1}{6.371 \times 10^6} - \frac{1}{6.771 \times 10^6}\right) = 3.70\,\mathrm{MJ/kg}.
$$

**Sanity check.** Pretending gravity stays at its surface value gives $g_0 h = 3.92\,\mathrm{MJ/kg}$, about $6\%$ too much — because gravity weakens with height, the same $2h/R_E$ effect the linearization lesson measured.

**The bigger picture.** The **kinetic energy** (energy of motion) of orbital speed there is $\tfrac12(7673)^2 = 29.4\,\mathrm{MJ/kg}$. Getting *up* to low orbit is only an eighth of the energy problem. Getting *fast* is the rest.

Let $h \to \infty$ and the work tends to $\mu/R_E$, a finite number. That limit is an improper integral, the subject of lesson 10, and it is where **[[escape velocity|escape]]** comes from.
:::

::: warning Displacement is not distance
The integral of a velocity is displacement, with a sign. If the velocity changes sign during the interval, $\int_a^b v\,dt$ is the positive area minus the negative area — not the distance traveled. For the distance, split the interval where $v = 0$ and add up $|v|$ on each part. The same goes for net impulse from a thruster that fires both ways.
:::

::: warning A number versus a family
$\displaystyle\int_a^b f(x)\,dx$ is a number. $\displaystyle\int f(x)\,dx$ is a family of functions. A classic slip is to write $\int_0^\pi \sin x\,dx = -\cos x$ and stop, or to carry a $+C$ into a definite integral, where it cancels anyway. Evaluate the antiderivative at both limits and subtract. And if the function blows up inside the interval — $1/x$ across zero — the theorem does not apply at all, because no antiderivative stretches across the gap.
:::

::: note Integrals with no formula
Not every function has an antiderivative you can write down. $\int e^{-x^2}\,dx$ has none built from the usual functions. That is why the bell-curve probability tables list the **[[error function|erf]]** instead of a formula. The definite integral still exists. Part one still defines a perfectly good $F(x)$. And a Riemann sum still computes it. Only the shortcut of part two is missing. The probability module lives with this every day.
:::

## Check yourself

::: check
Evaluate $\displaystyle\int_0^\pi \sin x\,dx$, and find the average value of $\sin x$ on $[0, \pi]$.
:::

::: answer
An antiderivative of $\sin x$ is $-\cos x$. So

$$
\int_0^\pi \sin x\,dx = \big[-\cos x\big]_0^\pi = -\cos\pi + \cos 0 = 1 + 1 = 2.
$$

The average value is the integral divided by the length of the interval: $\dfrac{2}{\pi} = 0.637$. So a half-wave of a sine with peak $1$ has average $0.637$. The mean value theorem for integrals says $\sin c = 2/\pi$ somewhere in $[0, \pi]$: at $c = 0.690$ and at $c = 2.45$.
:::

::: check
Compute $\dfrac{d}{dx}\displaystyle\int_0^{x^2}\cos t\,dt$ in two ways: with the fundamental theorem and the chain rule, and by working out the integral first.
:::

::: answer
**First way.** Let $u = x^2$, so $u' = 2x$. Part one with a moving limit gives $\cos(u)\,u' = 2x\cos(x^2)$.

**Second way.** $\displaystyle\int_0^{x^2}\cos t\,dt = \big[\sin t\big]_0^{x^2} = \sin(x^2)$. Its derivative, by the chain rule, is $2x\cos(x^2)$.

Both agree, as part one promises.
:::

::: check
A vehicle moves along a line with velocity $v(t) = t^2 - 4$ in $\mathrm{m/s}$, for $0 \le t \le 3\,\mathrm{s}$. Find its displacement and the distance it traveled.
:::

::: answer
**Displacement.**

$$
\int_0^3 (t^2 - 4)\,dt = \Big[\tfrac{t^3}{3} - 4t\Big]_0^3 = 9 - 12 = -3\,\mathrm{m}.
$$

It ends $3$ meters behind where it started.

**Distance.** The velocity is negative before $t = 2$ (where $t^2 = 4$) and positive after. So split there and add up the speed on each part:

$$
\int_0^2 (4 - t^2)\,dt = \Big[4t - \tfrac{t^3}{3}\Big]_0^2 = 8 - \tfrac83 = \tfrac{16}{3},
$$

$$
\int_2^3 (t^2 - 4)\,dt = \Big[\tfrac{t^3}{3} - 4t\Big]_2^3 = (9 - 12) - \left(\tfrac83 - 8\right) = -3 + \tfrac{16}{3} = \tfrac73.
$$

Total distance: $\tfrac{16}{3} + \tfrac73 = \tfrac{23}{3} = 7.67\,\mathrm{m}$. Check: $\tfrac{16}{3}$ backward and $\tfrac{7}{3}$ forward leaves you $3$ meters back, matching the displacement.
:::

::: check
Estimate $\displaystyle\int_0^1 e^{-x^2}\,dx$ with a midpoint sum of $n = 4$ pieces, then $n = 8$. The true value is $0.746824$. How does the error shrink?
:::

::: answer
With $n = 4$, $\Delta x = 0.25$ and the midpoints are $0.125, 0.375, 0.625, 0.875$:

$$
0.25\,(0.98450 + 0.86882 + 0.67663 + 0.46504) = 0.74875,
$$

an error of $1.93 \times 10^{-3}$. With $n = 8$ the midpoint sum is $0.747304$, an error of $4.8 \times 10^{-4}$.

Doubling $n$ divided the error by four. The midpoint rule is second order, $O(\Delta x^2)$, as the last lesson's Taylor analysis predicts. There is no ordinary antiderivative to check against. The true value is $\tfrac{\sqrt\pi}{2}\,\mathrm{erf}(1)$, where $\mathrm{erf}$ is itself defined by this integral.
:::

::: check
A thruster pushes with $20\,\mathrm{kN}$ for $2\,\mathrm{s}$, then its thrust ramps down steadily to zero over the next $1\,\mathrm{s}$. What is the total impulse $\displaystyle\int T\,dt$? What $\Delta v$ does it give a $500\,\mathrm{kg}$ spacecraft, if you ignore the change in mass?
:::

::: answer
Split the time at $t = 2$, using the rule for adding intervals.

**Steady part.** $20 \times 2 = 40\,\mathrm{kN\,s}$.

**Ramp.** On $[2, 3]$ the thrust is $T(t) = 20(3 - t)\,\mathrm{kN}$ (it is $20$ at $t = 2$ and $0$ at $t = 3$):

$$
\int_2^3 20(3 - t)\,dt = 20\Big[3t - \tfrac{t^2}{2}\Big]_2^3 = 20\big[(9 - 4.5) - (6 - 2)\big] = 10\,\mathrm{kN\,s}.
$$

That is the area of the triangle, $\tfrac12 \times 1 \times 20$. Total impulse: $50\,\mathrm{kN\,s}$.

**Delta-v.** With constant mass, $m\,dv = T\,dt$, so $\Delta v = 50\,000/500 = 100\,\mathrm{m/s}$.
:::

::: check
Explain, without using part one of the theorem, why $\displaystyle\int_a^b G'(x)\,dx = G(b) - G(a)$.
:::

::: answer
Chop $[a, b]$ into $n$ pieces. The total change telescopes: $G(b) - G(a) = \sum_{i=1}^{n}\big[G(x_i) - G(x_{i-1})\big]$. By the mean value theorem, each bracket equals $G'(\xi_i)\,\Delta x$ for some $\xi_i$ in the $i$-th piece. So $G(b) - G(a) = \sum_i G'(\xi_i)\,\Delta x$.

That is a Riemann sum for $G'$, and it equals $G(b) - G(a)$ exactly, for every $n$. As $n \to \infty$, every Riemann sum of an integrable $G'$ tends to $\displaystyle\int_a^b G'\,dx$. So the integral equals $G(b) - G(a)$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Definite integral | $\displaystyle\int_a^b f\,dx = \lim_{n\to\infty}\sum_{i=1}^n f(x_i^*)\,\Delta x$, signed area |
| Rules | Linear; adds over intervals; $\int_b^a = -\int_a^b$; $m(b-a) \le \int_a^b f \le M(b-a)$ |
| Mean value theorem for integrals | $\displaystyle\int_a^b f\,dx = f(c)(b - a)$; average value $\frac{1}{b-a}\int_a^b f\,dx$ |
| FTC part one | $\dfrac{d}{dx}\displaystyle\int_a^x f(t)\,dt = f(x)$; with a moving limit, $\frac{d}{dx}\int_a^{u(x)} f = f(u)\,u'$ |
| FTC part two | $\displaystyle\int_a^b f'(x)\,dx = f(b) - f(a)$ |
| Riemann-sum errors | Left/right $O(\Delta x)$; midpoint $O(\Delta x^2)$ |
| Burn $\Delta v$ | $\displaystyle\int_0^{t_b}\frac{T}{m_0 - \dot m_p t}\,dt = \frac{T}{\dot m_p}\ln\frac{m_0}{m_f}$ |
| Gravity loss | $\displaystyle\int g\sin\gamma\,dt$; $1314\,\mathrm{m/s}$ for a steady $90^\circ \to 30^\circ$ pitch over $162\,\mathrm{s}$ |
| Work against gravity | $\displaystyle\int_{R_E}^{R_E+h}\frac{\mu}{r^2}\,dr = \mu\Big(\frac{1}{R_E} - \frac{1}{R_E + h}\Big)$ |

The theorem makes every integral a hunt for an antiderivative. The next lesson gives you the two main tools for that hunt when the table runs out: substitution, which is the chain rule run backward, and integration by parts, which is the product rule run backward.

::: context ins How an inertial navigator works
Picture riding in a car with your eyes closed, feeling every push and turn, and trying to say where you are. That is an INS. Three accelerometers measure pushes along three axes, and three gyroscopes measure turning. Software adds up turning to track which way the vehicle faces, rotates each push into a fixed frame, adds gravity back in, then adds up acceleration to get velocity and velocity to get position. Because it only adds, tiny sensor errors grow without limit — so real systems regularly correct the INS with GPS or star sightings.
:::

::: context riemann Who Riemann was
Bernhard Riemann was a German mathematician of the 1800s. In 1854 he gave the careful definition of the integral as a limit of sums, the one used here, which settles exactly which functions can be integrated. Area under a curve had been computed long before him — Archimedes found areas with thin slices over two thousand years ago — but Riemann made the idea precise enough to trust for any function.
:::

::: context rectangles-picture Five rectangles under a rising curve
The blue curve is the rocket's velocity $v(t) = 6t + 0.06t^2$ from $t = 0$ to $10\,\mathrm{s}$. Each rectangle is $2\,\mathrm{s}$ wide and as tall as the speed at its *left* edge — a left sum with $n = 5$. Every rectangle sits below the curve, because the speed is rising, so the left sum comes up short. Thinner rectangles leave smaller gaps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="96" y="152.0" width="56" height="28.0"/>
    <rect x="152" y="122.9" width="56" height="57.1"/>
    <rect x="208" y="92.8" width="56" height="87.2"/>
    <rect x="264" y="61.5" width="56" height="118.5"/>
  </g>
  <line x1="40" y1="180" x2="335" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,180.0 54.0,173.1 68.0,166.1 82.0,159.1 96.0,152.0 110.0,144.9 124.0,137.6 138.0,130.3 152.0,122.9 166.0,115.5 180.0,108.0 194.0,100.4 208.0,92.8 222.0,85.1 236.0,77.3 250.0,69.4 264.0,61.5 278.0,53.5 292.0,45.5 306.0,37.3 320.0,29.1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="195">0</text><text x="96" y="195">2</text><text x="152" y="195">4</text><text x="208" y="195">6</text><text x="264" y="195">8</text><text x="320" y="195">10 s</text>
  </g>
  <text x="34" y="138" font-size="11" fill="#1f2a44" text-anchor="end">20</text>
  <text x="34" y="92" font-size="11" fill="#1f2a44" text-anchor="end">40</text>
  <text x="34" y="46" font-size="11" fill="#1f2a44" text-anchor="end">60</text>
  <text x="60" y="40" font-size="12" fill="#1d6fd1">v(t), m/s</text>
</svg>
```
:::

::: context long-s The long S
Gottfried Wilhelm Leibniz started writing $\int$ in his notes in 1675. It is an old-style long letter s, standing for the Latin *summa*, "sum". He wrote $dx$ for a vanishingly thin slice of width. So $\int f\,dx$ was, to him, a sum of thin strips of height $f$ and width $dx$ — which is exactly how to read it today.
:::

::: context strip-picture The growing area and its newest strip
The blue shaded region is $F(x)$, the area from $a$ to $x$. Move $x$ a little to the right, by $h$, and the area gains the thin orange strip. Its height is about $f(x)$ and its width is $h$, so the area grows at the rate $f(x)$ per unit of $x$. That is part one of the theorem.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 195" font-family="Inter, Arial, sans-serif">
  <polygon points="75.0,170 75.0,74.5 79.7,71.6 84.3,68.9 89.0,66.2 93.7,63.6 98.3,61.2 103.0,58.9 107.7,56.7 112.3,54.7 117.0,52.9 121.7,51.2 126.3,49.6 131.0,48.3 135.7,47.1 140.3,46.1 145.0,45.3 149.7,44.7 154.3,44.3 159.0,44.0 163.7,44.0 168.3,44.2 173.0,44.5 177.7,45.1 182.3,45.8 187.0,46.7 191.7,47.8 196.3,49.1 201.0,50.6 205.7,52.2 210.3,54.0 215.0,56.0 215.0,170" fill="#8fb8f0"/>
  <polygon points="215.0,170 215.0,56.0 218.5,57.6 222.0,59.2 225.5,60.9 229.0,62.7 232.5,64.6 236.0,66.6 236.0,170" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="30" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,98.0 54.0,88.3 68.0,79.0 82.0,70.2 96.0,62.4 110.0,55.7 124.0,50.4 138.0,46.6 152.0,44.5 166.0,44.1 180.0,45.4 194.0,48.5 208.0,53.1 222.0,59.2 236.0,66.6 250.0,74.9 264.0,84.0 278.0,93.6 292.0,103.3 306.0,112.8 320.0,121.9"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="75" y="186">a</text><text x="213" y="186">x</text><text x="244" y="186">x + h</text>
  </g>
  <text x="145" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">F(x)</text>
  <text x="258" y="40" font-size="12" fill="#1f2a44">y = f(t)</text>
</svg>
```
:::

::: context telescoping Why "telescoping"
An old brass telescope is a set of tubes that slide inside each other, so a long instrument collapses into a short one. A telescoping sum collapses the same way: $(G_1 - G_0) + (G_2 - G_1) + (G_3 - G_2)$ looks long, but every inner term cancels its neighbor and only $G_3 - G_0$ is left. Your bank balance works like this: add up every day's change and you get the last balance minus the first.
:::

::: context isp Specific impulse
Specific impulse, $I_{sp}$, is how rocket engineers grade an engine's fuel economy. It is the exhaust velocity divided by $g_0 = 9.80665\,\mathrm{m/s^2}$, which leaves units of seconds. A kerosene engine at sea level manages roughly $280$ to $310\,\mathrm{s}$; a hydrogen engine in vacuum reaches about $450\,\mathrm{s}$. Dividing by $g_0$ was chosen so the number comes out the same whether a team works in SI or in US customary units.
:::

::: context gravity-split Only part of gravity slows you down
Gravity $g$ points straight down. Split it into two pieces: one along the direction of travel, $g\sin\gamma$, and one across it, $g\cos\gamma$. Only the first piece works against your speed. The second bends the path downward instead. Flying straight up ($\gamma = 90^\circ$) puts all of gravity against you; flying level ($\gamma = 0$) puts none of it against you.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="250" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="65.7" y1="137.2" x2="110.0" y2="190.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="154.3" y1="152.8" x2="110.0" y2="190.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="110.0" y1="100.0" x2="201.9" y2="22.9" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="209.6,16.4 205.1,26.7 198.7,19.0" fill="#1d6fd1"/>
  <line x1="110.0" y1="100.0" x2="110.0" y2="180.0" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="110.0,190.0 105.0,180.0 115.0,180.0" fill="#1f2a44"/>
  <line x1="110.0" y1="100.0" x2="73.3" y2="130.8" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="65.7,137.2 70.1,126.9 76.6,134.6" fill="#b4232c"/>
  <line x1="110.0" y1="100.0" x2="147.9" y2="145.2" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="154.3,152.8 144.1,148.4 151.7,141.9" fill="#f2b880"/>
  <path d="M150,100 A40,40 0 0,0 140.6,74.3" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="156" y="92" font-size="12" fill="#1f2a44">γ</text>
  <text x="216" y="20" font-size="12" fill="#1d6fd1">velocity</text>
  <text x="118" y="190" font-size="12" fill="#1f2a44">g</text>
  <text x="58" y="141" font-size="12" fill="#b4232c" text-anchor="end">g sin γ</text>
  <text x="162" y="157" font-size="12" fill="#1f2a44">g cos γ</text>
  <text x="200" y="116" font-size="11" fill="#6c7a93">local horizontal</text>
</svg>
```

The picture is drawn at $\gamma = 40^\circ$.
:::

::: context gravity-turn The gravity turn
In a gravity turn, the rocket rises straight up for a few seconds, is nudged a small angle off vertical, and then lets gravity do the rest of the tilting: gravity bends the path over, and the rocket keeps its nose pointed along its velocity. Pointing along the velocity keeps the sideways air load on the vehicle small while it passes through the thick lower atmosphere. The tilting lowers $\gamma$, which cuts the gravity loss.
:::

::: context escape Escape velocity, coming up
To leave Earth for good, a kilogram needs energy $\mu/R_E$ — the work integral with its upper limit sent to infinity. Set kinetic energy equal to that, $\tfrac12 v^2 = \mu/R_E$, and you get $v = \sqrt{2\mu/R_E} \approx 11.2\,\mathrm{km/s}$ from the surface, ignoring air. Lesson 10 shows why an integral over an infinite range can still give a finite number.
:::

::: context erf The error function
The error function is defined by an integral: $\mathrm{erf}(x) = \dfrac{2}{\sqrt\pi}\displaystyle\int_0^x e^{-t^2}\,dt$. Since no formula exists, computers evaluate it with carefully tuned approximations, and older books printed tables of it. It tells you the chance that a bell-curve measurement lands within a given distance of its average. Naming the integral and treating it as a new standard function is a common way mathematics deals with integrals that have no formula.
:::
