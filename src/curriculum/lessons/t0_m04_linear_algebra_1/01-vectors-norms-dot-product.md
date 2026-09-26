---
id: l01-vectors-norms-dot-product
title: Vectors, norms and the dot product
minutes: 23
covers:
  - vectors, dot and cross products, norms, projections
---

Ask someone for directions and you get two things at once: how far, and which way. "Walk three blocks east, then four blocks north." A number alone — "seven blocks" — is not enough to find the bakery. You need the size *and* the direction. A quantity that carries both is called a **[[vector|vector-word]]**.

A spacecraft's navigation state is, at its simplest, two vectors: where the vehicle is, and how fast it is moving and in which direction. Nearly everything else in guidance, navigation and control is built from vectors too — thrust directions, the direction a sensor is looking, spin rates, pointing errors — and from a small set of rules for combining them. This lesson sets down those rules. It then answers the first two questions you can ask of any vector: *how long is it*, and *how much of it points along some other direction*?

Both questions come up on every vehicle, many times a second. A safety monitor asks whether the length of a position error has crossed a limit. A sun sensor reports the cosine of the angle between its face and the Sun, which is a dot product. A star tracker must keep the Sun a safe angle away from where it looks, and that angle comes from a dot product of two unit vectors. A reaction-wheel check asks for the largest single part of a torque command, which is also a length, measured with a different rule.

One more idea is planted here, and you will lean on it for the rest of the module. A vector is a physical arrow. Its components are numbers, and those numbers depend on the set of axes you chose to write them in. Change the axes and the numbers change. The arrow does not.

## Vectors and their components

Picture a vector as an arrow. It has a length and a direction, and nothing else. Two arrows of the same length pointing the same way are the same vector, wherever you draw them. A step of 10 m north is the same vector whether it starts at the launch pad or at the top of the tower.

To calculate with arrows you need numbers, and numbers need a **frame** — a set of axes to measure against. Choose three unit-length arrows at right angles to each other: $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$ and $\hat{\mathbf{z}}$, read "x hat", "y hat" and "z hat". They meet at a point called the origin. They are arranged by the **[[right-hand rule|right-hand-rule]]**, which fixes which way $\hat{\mathbf{z}}$ points once $\hat{\mathbf{x}}$ and $\hat{\mathbf{y}}$ are chosen. Any vector can then be built from stretched copies of the three axes:

$$
\mathbf{r} = x\,\hat{\mathbf{x}} + y\,\hat{\mathbf{y}} + z\,\hat{\mathbf{z}} = \begin{pmatrix} x \\ y \\ z \end{pmatrix}.
$$

Read it as: to get to the tip of $\mathbf{r}$, go $x$ along the first axis, $y$ along the second and $z$ along the third. The three numbers $x, y, z$ are the **components** of $\mathbf{r}$ in that frame — how far along each axis the arrow reaches.

Some notation, used all through ORBIT:

- Vectors are written as columns, standing up.
- Bold lowercase letters name vectors: $\mathbf{r}$, $\mathbf{v}$. Read $\mathbf{r}$ as "r" or "vector r".
- Plain italic letters name ordinary numbers, called **scalars**: $x$, $t$, $m$.
- A hat marks a vector of length one: $\hat{\mathbf{x}}$, $\hat{\mathbf{u}}$.
- When components are numbered instead of named, we write $\mathbf{a} = (a_1, a_2, a_3)^T$, with $a_1$ read "a one" or "a sub one". The little $T$ turns a row written across the page into the column it stands for. It saves space, and you will meet it properly in the next lesson as the **transpose**.

### Adding and stretching

Two operations define everything else.

**Addition** works one component at a time:

$$
\mathbf{a} + \mathbf{b} = (a_1 + b_1,\ a_2 + b_2,\ a_3 + b_3)^T.
$$

In the picture it is **[[tip to tail|tip-to-tail]]**: walk along $\mathbf{a}$, then along $\mathbf{b}$, and the sum is the arrow from where you started to where you ended up. Three blocks east plus four blocks north is one arrow pointing north-east-ish, five blocks long.

**Scalar multiplication** stretches: $c\,\mathbf{a} = (c a_1, c a_2, c a_3)^T$. The result is $|c|$ times as long as $\mathbf{a}$. It points the same way if $c$ is positive and the opposite way if $c$ is negative. The **zero vector** $\mathbf{0}$ has every component zero, no length and no direction.

Put the two together and you get a **linear combination** — a sum of stretched vectors, $\alpha\,\mathbf{a} + \beta\,\mathbf{b}$ (read "alpha a plus beta b"). It is the single most important expression in this module. A position after coasting for a time $t$ is $\mathbf{r} + t\,\mathbf{v}$: a linear combination of position and velocity. A thrust vector is a linear combination of the vehicle's axes. And a matrix, which you meet in the next lesson, is nothing but a rule for forming linear combinations.

### Beyond three dimensions

Nothing in the algebra needs there to be exactly three components. The navigation state of a vehicle is

$$
\mathbf{x} = \begin{pmatrix} x \\ y \\ z \\ v_x \\ v_y \\ v_z \end{pmatrix},
$$

three position components and three velocity components stacked in one column. It is a vector in $\mathbb{R}^6$, read "R six": the set of all columns of six real numbers. You cannot draw it as an arrow. But you can add two of them, stretch one, form linear combinations and measure lengths, and every rule in this module works unchanged. When a statement holds for any number of components we write $\mathbf{a} \in \mathbb{R}^n$ ("a is in R n") and number the components $a_1, \dots, a_n$. This bigger [[state vector|state-vector]] is what a navigation filter carries from one moment to the next.

### The same arrow, different numbers

Here is the idea that makes linear algebra matter to a GNC engineer. Take the vehicle's velocity — one physical arrow. Written in an **[[Earth-centered inertial frame|eci-frame]]**, its components might be $(-6.8, -1.2, -3.2)^T$ km/s. Written in the vehicle's own **body frame**, whose first axis runs out through the nose, the very same arrow might be $(7.61, 0.02, -0.05)^T$ km/s — nearly all "straight ahead".

Neither set of numbers is "the velocity". Each is the velocity's shadow on one particular set of axes. Two later lessons are about converting between such shadows. For now the rule is: never add, dot or compare components unless they are written in the same frame.

## Norms: how long is a vector?

### The 2-norm

Start in two dimensions. The arrow $(3, 4)^T$ goes 3 along and 4 up. Its length is the long side of a right triangle, so Pythagoras gives $\sqrt{3^2 + 4^2} = \sqrt{25} = 5$. In general the length of $(x, y)^T$ is $\sqrt{x^2 + y^2}$.

In three dimensions, [[use Pythagoras twice|pythagoras-twice]]. First, the arrow's shadow on the floor — the $xy$-plane — has length $\sqrt{x^2 + y^2}$. That shadow and the height $z$ are the two short sides of a second right triangle, standing up, whose long side is the arrow itself. So the full length is $\sqrt{(x^2 + y^2) + z^2}$. With $n$ components the pattern continues:

$$
\|\mathbf{x}\|_2 = \sqrt{\sum_{i} x_i^2} = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2}.
$$

The double bars mean "size of", and $\|\mathbf{x}\|_2$ is read "the two-norm of x". The $\sum_i$ (a capital Greek sigma, read "sum over i") means add up the terms for every $i$. This is the **2-norm**, also called the Euclidean norm: the ordinary straight-line length. When nothing else could be meant it is written $|\mathbf{x}|$, and the two notations mean the same thing.

It is the norm of distance and of energy. The distance between two points is $\|\mathbf{r}_1 - \mathbf{r}_2\|_2$. The kinetic energy per kilogram of a moving vehicle is $\tfrac{1}{2}\|\mathbf{v}\|_2^2$. Squaring a 2-norm removes the square root, $\|\mathbf{x}\|_2^2 = \sum_i x_i^2$, which is why the 2-norm turns up wherever a sum of squares does — including the method of least squares you will meet later.

A **unit vector** is a vector whose 2-norm is one. Divide any nonzero vector by its own length and you get one:

$$
\hat{\mathbf{a}} = \frac{\mathbf{a}}{\|\mathbf{a}\|_2}.
$$

What is left carries only the direction of $\mathbf{a}$. For $\mathbf{a} = (3, -4, 12)^T$, the length is $\sqrt{9 + 16 + 144} = \sqrt{169} = 13$. Dividing each component by 13 gives $\hat{\mathbf{a}} = (0.231, -0.308, 0.923)^T$. Sensor directions, lines of sight and thrust directions are always stored as unit vectors. When a computed direction misbehaves, the first thing to check is whether its norm is still one.

### The infinity-norm and the 1-norm

Straight-line length is not the only sensible idea of size. Think of three kids carrying grocery bags, each able to carry at most 10 kg. The question "can they manage?" is not about the total weight. It is about whether *any one kid* is handed more than 10 kg.

That is the **infinity-norm**: the largest component, ignoring signs,

$$
\|\mathbf{x}\|_\infty = \max_i |x_i| ,
$$

read "the infinity-norm of x is the largest of the absolute values of its components". It is the right measure whenever a limit applies to each channel separately. Three **[[reaction wheels|reaction-wheel]]** each rated to a torque — a twisting push — of 0.25 N·m (newton-meters) are not in trouble when the 2-norm of the command goes past 0.25. They are in trouble when any single wheel is asked for more than 0.25 — exactly what the infinity-norm reports.

The **1-norm**, $\|\mathbf{x}\|_1 = \sum_i |x_i|$, adds up the sizes of all the components. It measures total effort, such as the total propellant a set of thrusters would burn if each channel fired on its own.

The norms are tied together. The largest component is part of the sum of squares, so it can be no bigger than the 2-norm. And each of the $n$ squared components is at most the largest one squared, so the sum of squares is at most $n$ times that. Taking square roots:

$$
\|\mathbf{x}\|_\infty \le \|\mathbf{x}\|_2 \le \sqrt{n}\,\|\mathbf{x}\|_\infty .
$$

### What every norm satisfies

Any rule that deserves the name "norm" obeys three laws.

- **It is never negative:** $\|\mathbf{x}\| \ge 0$, and it is zero only for the zero vector.
- **It scales:** $\|c\,\mathbf{x}\| = |c|\,\|\mathbf{x}\|$. Double the arrow, double its size.
- **The triangle inequality:** $\|\mathbf{x} + \mathbf{y}\| \le \|\mathbf{x}\| + \|\mathbf{y}\|$. A detour is never shorter than the direct path.

Try the last one. Take $\mathbf{p} = (1, 2, 2)^T$ and $\mathbf{q} = (2, -1, 0)^T$. Then $\|\mathbf{p}\|_2 = \sqrt{1 + 4 + 4} = 3$ and $\|\mathbf{q}\|_2 = \sqrt{4 + 1} = 2.24$. The sum is $(3, 1, 2)^T$, with length $\sqrt{9 + 1 + 4} = \sqrt{14} = 3.74$. That is less than $3 + 2.24 = 5.24$, as the inequality promises.

Some sizes to keep in your head: a low-Earth-orbit position vector has a 2-norm of about $6.8 \times 10^6$ m, an orbital velocity about $7.7 \times 10^3$ m/s, and a good GPS position fix has an error vector whose norm is a few meters.

::: key Norms
$\|\mathbf{x}\|_2 = \sqrt{\sum_i x_i^2}$ measures energy or distance; it is the default meaning of "length". $\|\mathbf{x}\|_\infty = \max_i |x_i|$ measures the worst single channel, and is the norm to use for actuator limits. A unit vector is $\hat{\mathbf{a}} = \mathbf{a} / \|\mathbf{a}\|_2$.
:::

::: example Which norm catches a saturating wheel?
A reaction-wheel array receives the torque command $\boldsymbol{\tau} = (0.05, 0.28, 0.04)^T$ N·m ($\boldsymbol{\tau}$ is the Greek letter "tau", used for torque). The array as a whole is budgeted for a 2-norm of 0.30 N·m, and each wheel is rated to 0.25 N·m.

**The 2-norm.** Square each component, add, and take the root:

$$
\sqrt{0.05^2 + 0.28^2 + 0.04^2} = \sqrt{0.0025 + 0.0784 + 0.0016} = \sqrt{0.0825} = 0.287\ \mathrm{N\,m}.
$$

That is under the 0.30 N·m budget. The array-level check passes.

**The infinity-norm.** Pick the largest size: $\max(0.05, 0.28, 0.04) = 0.28$ N·m. That is over the 0.25 N·m rating of a single wheel.

So the second wheel **saturates** — it is asked for more than it can give — even though the array-level check passed. Does this make sense? The 2-norm blends all three wheels together, and two of them are nearly idle, so the blend looks comfortable. A limit that applies to each channel must be checked with the infinity-norm.
:::

## The dot product

### Two definitions

Here is the everyday picture. You buy 3 apples at 2 dollars each and 4 pears at 1 dollar each. The bill is $3 \times 2 + 4 \times 1 = 10$ dollars: multiply matching numbers, then add. That "multiply matching entries and add" operation is the dot product.

The **dot product** of two vectors with the same number of components is the sum of the products of matching components:

$$
\mathbf{a} \cdot \mathbf{b} = \sum_i a_i b_i = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n .
$$

Read $\mathbf{a} \cdot \mathbf{b}$ as "a dot b". The answer is a scalar — one number — not a vector. Three facts follow straight from the definition:

- **Order does not matter:** $\mathbf{a} \cdot \mathbf{b} = \mathbf{b} \cdot \mathbf{a}$, because $a_i b_i = b_i a_i$.
- **It passes through linear combinations:** $(\alpha\mathbf{a} + \beta\mathbf{b}) \cdot \mathbf{c} = \alpha\,(\mathbf{a}\cdot\mathbf{c}) + \beta\,(\mathbf{b}\cdot\mathbf{c})$. Each term of the left side is $(\alpha a_i + \beta b_i) c_i$, and that sum splits into two sums.
- **Dotting a vector with itself gives its squared length:** $\mathbf{a} \cdot \mathbf{a} = \sum_i a_i^2 = \|\mathbf{a}\|_2^2$.

The second definition is about the picture. Put the two arrows tail to tail and call the angle between them $\theta$ ("theta"). Then

$$
\mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

The first formula is what a computer evaluates. The second is what you picture. That the two always give the same number is what makes the dot product so useful, so it deserves a reason rather than a promise.

::: note Why it has to be true
Put $\mathbf{a}$ and $\mathbf{b}$ tail to tail. The arrow from the tip of $\mathbf{b}$ to the tip of $\mathbf{a}$ is $\mathbf{a} - \mathbf{b}$. The three arrows make a triangle with sides $\|\mathbf{a}\|$, $\|\mathbf{b}\|$ and $\|\mathbf{a} - \mathbf{b}\|$, and the angle $\theta$ sits opposite the third side. The **law of cosines** from the trigonometry module says

$$
\|\mathbf{a} - \mathbf{b}\|^2 = \|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\,\|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

Now work out the same left side with the component definition. Use the three facts above — order does not matter, and the dot product passes through sums:

$$
\|\mathbf{a} - \mathbf{b}\|^2 = (\mathbf{a} - \mathbf{b}) \cdot (\mathbf{a} - \mathbf{b})
= \mathbf{a}\cdot\mathbf{a} - 2\,\mathbf{a}\cdot\mathbf{b} + \mathbf{b}\cdot\mathbf{b}
= \|\mathbf{a}\|^2 - 2\,\mathbf{a}\cdot\mathbf{b} + \|\mathbf{b}\|^2 .
$$

Both right-hand sides describe the same number. Cross off $\|\mathbf{a}\|^2 + \|\mathbf{b}\|^2$ from both, then divide by $-2$:

$$
\mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\|\,\|\mathbf{b}\| \cos\theta .
$$

So the component formula always equals the geometric one.
:::

### What the dot product tells you

Lengths are never negative, so the sign of $\mathbf{a}\cdot\mathbf{b}$ is the sign of $\cos\theta$. That gives a quick reading:

- **Positive:** the arrows lean the same way ($\theta$ less than $90°$).
- **Negative:** they lean apart ($\theta$ more than $90°$).
- **Zero:** they are **orthogonal** — at right angles, perpendicular. The zero vector has a zero dot product with everything, and counts as orthogonal to everything.

Solving the geometric formula for the angle gives

$$
\cos\theta = \frac{\mathbf{a}\cdot\mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|}, \qquad 0 \le \theta \le \pi .
$$

One trap in code. [[Round-off|arccos-roundoff]] can push that quotient to $1.0000000002$, and the inverse cosine of a number above one does not exist. Either clamp the quotient into $[-1, 1]$ before taking the inverse cosine, or — better — compute the angle with the two-argument arctangent once you have the cross product, which Lesson 8 defines.

### The component along a direction

Dotting with a *unit* vector has a special meaning. Since $\|\hat{\mathbf{u}}\| = 1$,

$$
\mathbf{a} \cdot \hat{\mathbf{u}} = \|\mathbf{a}\| \cos\theta ,
$$

which is the **component of $\mathbf{a}$ along $\hat{\mathbf{u}}$**. Picture a flashlight shining straight down onto the line through $\hat{\mathbf{u}}$: this is the length of the **[[shadow|shadow-picture]]** that $\mathbf{a}$ casts on that line, with a minus sign if the shadow points backward.

This is what a single-axis instrument measures. An accelerometer whose sensitive axis is $\hat{\mathbf{u}}$ reads $\mathbf{f} \cdot \hat{\mathbf{u}}$, where $\mathbf{f}$ is the **specific force** on it — the push per kilogram from everything except gravity. A **[[cosine sun sensor|cosine-sun-sensor]]** puts out a current proportional to $\hat{\mathbf{s}} \cdot \hat{\mathbf{n}}$, the cosine of the angle between the Sun direction $\hat{\mathbf{s}}$ and the direction $\hat{\mathbf{n}}$ its cell faces. Three such instruments along three perpendicular axes recover the whole vector, one component each.

::: key The dot product two ways
$\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$. A zero dot product means the vectors are orthogonal. Dotting with a unit vector gives the component along it.
:::

### Flight-path angle: a dot product you will use constantly

Think of a hiker on a hill. "Straight up" is away from the center of the Earth. "Level" is the flat ground at her feet. Whether she is climbing or descending depends on the angle between her motion and level.

For a spacecraft, the **flight-path angle** $\gamma$ ("gamma") is the angle between the velocity vector and the **[[local horizontal|flight-path-picture]]** — the flat plane at right angles to the position vector $\mathbf{r}$. It is positive when the vehicle is climbing.

Because the horizontal is at right angles to $\mathbf{r}$, the angle between $\mathbf{r}$ and $\mathbf{v}$ is $90° - \gamma$. And $\cos(90° - \gamma) = \sin\gamma$. Put that into the angle formula:

$$
\sin\gamma = \frac{\mathbf{r}\cdot\mathbf{v}}{\|\mathbf{r}\|\,\|\mathbf{v}\|} .
$$

A positive $\mathbf{r}\cdot\mathbf{v}$ means the distance from Earth's center is growing: the vehicle is moving outward. On a perfectly circular orbit, $\mathbf{r}\cdot\mathbf{v} = 0$ at every instant — the motion is always exactly level.

::: example A low-Earth-orbit state vector
In an Earth-centered inertial frame a spacecraft has position and velocity

$$
\mathbf{r} = \begin{pmatrix} -2690 \\ 5320 \\ 3470 \end{pmatrix}\,\mathrm{km}, \qquad
\mathbf{v} = \begin{pmatrix} -6.8 \\ -1.2 \\ -3.2 \end{pmatrix}\,\mathrm{km/s}.
$$

**How far from Earth's center?** Square, add, take the root:

$$
\|\mathbf{r}\|_2 = \sqrt{2690^2 + 5320^2 + 3470^2} = \sqrt{47\,579\,400} = 6897.8\ \mathrm{km}.
$$

Subtract Earth's equatorial radius, 6378.1 km, and the spacecraft is 519.7 km up. That is a normal low-orbit height.

**How fast?** $\|\mathbf{v}\|_2 = \sqrt{46.24 + 1.44 + 10.24} = \sqrt{57.92} = 7.611$ km/s — the familiar low-orbit speed.

**The dot product.** Multiply matching components and add:

$$
\mathbf{r}\cdot\mathbf{v} = (-2690)(-6.8) + (5320)(-1.2) + (3470)(-3.2) = 18\,292 - 6384 - 11\,104 = 804\ \mathrm{km^2/s} .
$$

It is positive, so the vehicle is climbing. It is also small next to $\|\mathbf{r}\|\,\|\mathbf{v}\| = 6897.8 \times 7.611 = 52\,496$ km²/s, so it is climbing only gently:

$$
\sin\gamma = \frac{804}{52\,496} = 0.01532, \qquad \gamma = 0.878° .
$$

**Sanity check.** A circular orbit at this radius needs a speed of $\sqrt{\mu / r}$, where $\mu = 3.986 \times 10^5$ km³/s² is Earth's gravity constant: $\sqrt{3.986 \times 10^5 / 6897.8} = 7.602$ km/s. The vehicle is a little faster than that, so its orbit is slightly stretched and it is heading gently upward toward its highest point. A small positive $\gamma$ fits.

The unit position vector, which the later lessons reuse, is $\hat{\mathbf{r}} = \mathbf{r} / 6897.8 = (-0.3900, 0.7713, 0.5031)^T$.
:::

::: example A star-tracker keep-out check
A **[[star tracker|star-tracker]]** looks along the unit vector $\hat{\mathbf{b}} = (0, 0.6, 0.8)^T$ in the body frame — its **boresight**, the direction it points. It must keep the Sun at least $30°$ away from that axis. The Sun direction, also in the body frame, is $\hat{\mathbf{s}} = (0.5, 0.5, 0.7071)^T$.

**Are both really unit vectors?** $0.6^2 + 0.8^2 = 0.36 + 0.64 = 1$, and $0.25 + 0.25 + 0.5 = 1$. Yes.

**Dot them:**

$$
\hat{\mathbf{b}}\cdot\hat{\mathbf{s}} = 0 \times 0.5 + 0.6 \times 0.5 + 0.8 \times 0.7071 = 0 + 0.3 + 0.5657 = 0.8657 .
$$

Both lengths are one, so this *is* $\cos\theta$, and $\theta = \arccos(0.8657) = 30.04°$.

The Sun is $0.04°$ outside the forbidden cone — legal, but only barely. A guidance engineer would want more margin. Does the number make sense? $\cos 30° = 0.8660$, and our $0.8657$ is a hair smaller, so the angle is a hair bigger than $30°$. Notice the dot product needed no square roots and no trigonometry beyond one inverse cosine at the end.
:::

::: warning Components from different frames
$\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i$ is only the geometric dot product when both sets of components are written in the same frame. Dotting a body-frame boresight with an inertial-frame Sun vector gives a number with no meaning, and the code will not complain. Rotate one into the other's frame first.
:::

::: warning Norms of differences
$\|\mathbf{a} - \mathbf{b}\|$ is the distance between two points. $\|\mathbf{a}\| - \|\mathbf{b}\|$ is the difference of two distances from the origin. They are different numbers, and the first is never smaller than the size of the second (the triangle inequality in disguise). A position-error requirement means the first.
:::

## Check yourself

::: check
Find the unit vector in the direction of $\mathbf{a} = (2, -3, 6)^T$, and state its infinity-norm.
:::

::: answer
First the length: $\|\mathbf{a}\|_2 = \sqrt{4 + 9 + 36} = \sqrt{49} = 7$. Divide each component by 7: $\hat{\mathbf{a}} = (2/7, -3/7, 6/7)^T = (0.286, -0.429, 0.857)^T$.

Its infinity-norm is the largest component ignoring sign, $6/7 = 0.857$. That is less than its 2-norm of $1$, as the inequality $\|\mathbf{x}\|_\infty \le \|\mathbf{x}\|_2$ requires.
:::

::: check
For what value of $k$ are $\mathbf{u} = (2, k, -1)^T$ and $\mathbf{w} = (4, 3, 2)^T$ orthogonal?
:::

::: answer
Orthogonal means the dot product is zero. Multiply matching components and add: $\mathbf{u}\cdot\mathbf{w} = 2 \times 4 + k \times 3 + (-1) \times 2 = 8 + 3k - 2 = 3k + 6$. Setting $3k + 6 = 0$ gives $k = -2$.

Check: $(2, -2, -1)\cdot(4, 3, 2) = 8 - 6 - 2 = 0$.
:::

::: check
A spacecraft has $\mathbf{r}\cdot\mathbf{v} = -1.24 \times 10^{3}$ km²/s with $\|\mathbf{r}\| = 7100$ km and $\|\mathbf{v}\| = 7.45$ km/s. Is it climbing or descending, and at what flight-path angle?
:::

::: answer
$\sin\gamma = -1240 / (7100 \times 7.45) = -1240 / 52\,895 = -0.02344$, so $\gamma = -1.34°$.

The minus sign means the distance from Earth's center is shrinking: the vehicle is descending toward its lowest point, the periapsis.
:::

::: check
Without computing any norms, explain why $\|\mathbf{a} + \mathbf{b}\|_2^2 = \|\mathbf{a}\|_2^2 + \|\mathbf{b}\|_2^2$ exactly when $\mathbf{a}$ and $\mathbf{b}$ are orthogonal.
:::

::: answer
Write the squared length as a dot product and multiply out, the way you would multiply out $(a + b)^2$:

$\|\mathbf{a} + \mathbf{b}\|^2 = (\mathbf{a} + \mathbf{b})\cdot(\mathbf{a} + \mathbf{b}) = \|\mathbf{a}\|^2 + 2\,\mathbf{a}\cdot\mathbf{b} + \|\mathbf{b}\|^2$.

The middle term $2\,\mathbf{a}\cdot\mathbf{b}$ is zero exactly when the dot product is zero — which is what orthogonal means. This is Pythagoras written in dot-product language.
:::

::: check
An accelerometer with sensitive axis $\hat{\mathbf{u}} = (0.6, 0, 0.8)^T$ feels the specific force $\mathbf{f} = (0.5, -0.2, 9.7)^T$ m/s². What does it read, and what angle does $\mathbf{f}$ make with the axis?
:::

::: answer
The reading is the component along the axis: $\mathbf{f}\cdot\hat{\mathbf{u}} = 0.5 \times 0.6 + (-0.2) \times 0 + 9.7 \times 0.8 = 0.3 + 0 + 7.76 = 8.06$ m/s².

The size of $\mathbf{f}$ is $\sqrt{0.25 + 0.04 + 94.09} = \sqrt{94.38} = 9.715$ m/s². So $\cos\theta = 8.06 / 9.715 = 0.8296$ and $\theta = 33.9°$.

The instrument sees $\cos 33.9°$ of the force — about 83 percent of it. Less than all of it, as it should be for an axis that is tilted away.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{r} = (x, y, z)^T$ | A vector as a column of components in a chosen frame |
| $\alpha\mathbf{a} + \beta\mathbf{b}$ | Linear combination: the basic operation of the module |
| $\lVert\mathbf{x}\rVert_2 = \sqrt{\sum_i x_i^2}$ | 2-norm: distance, energy, root-sum-square |
| $\lVert\mathbf{x}\rVert_\infty = \max_i \lvert x_i \rvert$ | Infinity-norm: worst single channel, actuator limits |
| $\lVert\mathbf{x}\rVert_1 = \sum_i \lvert x_i \rvert$ | 1-norm: total effort |
| $\hat{\mathbf{a}} = \mathbf{a}/\lVert\mathbf{a}\rVert_2$ | Unit vector: direction only |
| $\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i = \lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert\cos\theta$ | Dot product; zero means orthogonal |
| $\mathbf{a}\cdot\hat{\mathbf{u}}$ | Component of $\mathbf{a}$ along $\hat{\mathbf{u}}$: what a single-axis sensor reads |
| $\sin\gamma = \mathbf{r}\cdot\mathbf{v} / (\lVert\mathbf{r}\rVert\,\lVert\mathbf{v}\rVert)$ | Flight-path angle from a state vector |

The next lesson turns from vectors to the matrices that act on them — machines that take a vector in and put a vector out. Two loose ends from this lesson are picked up later in the module: Lesson 6 uses the dot product to split a vector into the part along a direction and the part across it, called the projection; and Lesson 8 introduces the cross product, which builds the direction perpendicular to two given vectors and underlies angular momentum, torque and rotation.

::: context vector-word A word that means "carrier"
"Vector" is Latin for "carrier" — someone or something that carries a thing from one place to another. A vector carries a point from where it starts to where it ends: "go from here to there". Biologists use the same word for a mosquito that carries a disease, for the same reason.

In this course, anything with a size *and* a direction is a vector: a displacement, a velocity, a force, a spin rate.
:::

::: context right-hand-rule Which way does z point?
Once you choose $\hat{\mathbf{x}}$ and $\hat{\mathbf{y}}$, there are still two choices for $\hat{\mathbf{z}}$: up or down. The **right-hand rule** picks one. Curl the fingers of your right hand from $\hat{\mathbf{x}}$ toward $\hat{\mathbf{y}}$; your thumb points along $\hat{\mathbf{z}}$.

The other choice gives a mirror-image, "left-handed" frame. Mixing the two is a classic source of flipped signs, so every frame in ORBIT is right-handed. Lesson 8 makes the rule precise with the cross product.
:::

::: context tip-to-tail Adding arrows
Walk along $\mathbf{a} = (3, 1)$, then along $\mathbf{b} = (1, 2)$ starting from where you stopped. The sum is the direct arrow to where you ended, $(4, 3)$. Walking $\mathbf{b}$ first and then $\mathbf{a}$ (dashed) ends at the same spot, which is why $\mathbf{a} + \mathbf{b} = \mathbf{b} + \mathbf{a}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="tt-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="tt-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#f2b880"/></marker>
    <marker id="tt-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="tt-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6c7a93"/></marker>
  </defs>
  <line x1="95" y1="85" x2="230" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#tt-g)"/>
  <line x1="50" y1="175" x2="95" y2="85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#tt-g)"/>
  <line x1="50" y1="175" x2="185" y2="130" stroke="#1d6fd1" stroke-width="3" marker-end="url(#tt-b)"/>
  <line x1="185" y1="130" x2="230" y2="40" stroke="#f2b880" stroke-width="3" marker-end="url(#tt-o)"/>
  <line x1="50" y1="175" x2="230" y2="40" stroke="#1f2a44" stroke-width="3" marker-end="url(#tt-k)"/>
  <circle cx="50" cy="175" r="3.5" fill="#1f2a44"/>
  <text x="130" y="168" font-size="13" fill="#1d6fd1">a = (3, 1)</text>
  <text x="214" y="96" font-size="13" fill="#b4232c">b = (1, 2)</text>
  <text x="240" y="38" font-size="13" fill="#1f2a44">a + b = (4, 3)</text>
  <text x="44" y="192" font-size="12" fill="#1f2a44">start</text>
</svg>
```
:::

::: context state-vector Six numbers that say everything
Knowing where a spacecraft is and how it is moving, right now, is enough to predict where it will be later — gravity does the rest. So navigation software keeps those six numbers together in one column, the **state vector**, and updates the whole column every cycle.

Real filters often carry more: clock errors, sensor biases, attitude. A 15-component state is common. The rules of this module do not care how long the column is.
:::

::: context eci-frame A frame that does not spin
An **inertial frame** is one that is not spinning or speeding up, so Newton's laws work in it without extra correction terms. The **Earth-centered inertial** frame, ECI for short, has its origin at Earth's center, its $z$ axis through the North Pole, and its $x$ and $y$ axes in the equator's plane, pointing at fixed directions among the distant stars.

The Earth turns underneath it once a day. That is why orbits are computed in ECI: a spacecraft's path is a clean ellipse there, not a spiral.
:::

::: context pythagoras-twice A diagonal through a box
Think of a shoebox $3$ long, $4$ wide and $12$ tall. The diagonal across the floor is $\sqrt{3^2 + 4^2} = 5$. That floor diagonal and the $12$ of height make a right triangle standing on its edge, so the diagonal from one bottom corner to the opposite top corner is $\sqrt{5^2 + 12^2} = \sqrt{169} = 13$.

Put the two steps together and the $5$ disappears: $\sqrt{3^2 + 4^2 + 12^2} = 13$. That is the 2-norm of $(3, 4, 12)^T$. Each extra dimension is one more right triangle, and one more square under the root.
:::

::: context reaction-wheel Spinning wheels that steer a spacecraft
A **reaction wheel** is a heavy disk driven by an electric motor. Speed the wheel up one way and the spacecraft turns slowly the other way — the same reason an office chair twists when you spin a heavy book in your hands. Three or four wheels on different axes can point a spacecraft anywhere without burning propellant.

Each motor can only push so hard, and each wheel can only spin so fast. Asking a wheel for more than its limit is called **saturation**. The Hubble Space Telescope points this way, using four wheels.
:::

::: context arccos-roundoff Why 1.0000000002 happens
A computer stores numbers to about 16 significant digits and rounds after every step. Dot two unit vectors that point almost the same way, divide by two lengths that are each "one, give or take the last digit", and the quotient can land a hair above $1$.

The inverse cosine only accepts numbers from $-1$ to $1$. In Python, `math.acos(1.0000000002)` stops the program with an error, and NumPy's `np.arccos` returns `nan`, "not a number", which then spreads silently through every calculation after it. Clamping first with `np.clip(c, -1.0, 1.0)` costs nothing.
:::

::: context shadow-picture The shadow on the line
Shine a light straight down onto the line through $\hat{\mathbf{u}}$. The shadow of $\mathbf{a}$ is $\|\mathbf{a}\|\cos\theta$ long. Here $\|\mathbf{a}\| = 4$ and $\theta = 50°$, so the shadow is $4\cos 50° = 2.57$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="sh-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="sh-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="40" y1="160" x2="155.7" y2="160" stroke="#f2b880" stroke-width="7"/>
  <line x1="155.7" y1="22.1" x2="155.7" y2="160" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="40" y1="160" x2="155.7" y2="22.1" stroke="#1f2a44" stroke-width="3" marker-end="url(#sh-k)"/>
  <line x1="40" y1="160" x2="85" y2="160" stroke="#1d6fd1" stroke-width="3.5" marker-end="url(#sh-b)"/>
  <path d="M80,160 A40,40 0 0,0 65.7,129.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="84" y="144" font-size="12" fill="#b4232c">θ</text>
  <text x="104" y="70" font-size="13" fill="#1f2a44" text-anchor="end">a</text>
  <text x="58" y="180" font-size="12" fill="#1d6fd1">û</text>
  <text x="112" y="180" font-size="12" fill="#1f2a44">shadow = a · û = |a| cos θ</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">light from above</text>
</svg>
```
:::

::: context cosine-sun-sensor A solar cell as a compass
A solar cell facing the Sun catches the most light. Tilt it by an angle $\theta$ and it presents a smaller patch to the Sun's rays — the patch shrinks by the factor $\cos\theta$ — so its current drops by that factor too. Measure the current, divide by the face-on value, and you have $\hat{\mathbf{s}}\cdot\hat{\mathbf{n}}$.

Such "coarse sun sensors" are cheap and tough. Many spacecraft carry several, facing different ways, to find the Sun after a fault.
:::

::: context flight-path-picture Climbing, level or falling
The position vector $\mathbf{r}$ points straight up from Earth's center. The local horizontal is at right angles to it. The flight-path angle $\gamma$ is measured from the horizontal up to $\mathbf{v}$, so the angle from $\mathbf{r}$ to $\mathbf{v}$ is $90° - \gamma$. Here $\gamma$ is drawn as $15°$ so you can see it; the example's $0.878°$ would look flat.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="fp-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
    <marker id="fp-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <path d="M20,205 Q180,160 340,205" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="200" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="180" y1="183" x2="180" y2="123" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#fp-k)"/>
  <line x1="180" y1="120" x2="180" y2="25" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="50" y1="120" x2="320" y2="120" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="120" x2="305.6" y2="86.4" stroke="#1d6fd1" stroke-width="3" marker-end="url(#fp-b)"/>
  <circle cx="180" cy="120" r="4" fill="#1f2a44"/>
  <path d="M240,120 A60,60 0 0,0 238.0,104.5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M180,85 A35,35 0 0,1 213.8,110.9" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="246" y="116" font-size="12" fill="#b4232c">γ</text>
  <text x="200" y="80" font-size="12" fill="#1f2a44">90° − γ</text>
  <text x="310" y="82" font-size="13" fill="#1d6fd1">v</text>
  <text x="170" y="160" font-size="13" fill="#1f2a44" text-anchor="end">r</text>
  <text x="186" y="36" font-size="11" fill="#1f2a44">local vertical</text>
  <text x="54" y="112" font-size="11" fill="#1f2a44">local horizontal</text>
</svg>
```
:::

::: context star-tracker A camera that reads the stars
A **star tracker** is a small camera that photographs the sky, matches the pattern of stars against a catalog, and works out which way the spacecraft is pointing — often to a few thousandths of a degree.

It is sensitive to faint starlight, so the Sun anywhere near its view floods the picture with glare and it cannot see any stars. Each tracker therefore has a **keep-out cone** around its boresight where the Sun (and often the bright Earth and Moon) must never be. Checking that cone is one dot product per body per cycle.
:::
