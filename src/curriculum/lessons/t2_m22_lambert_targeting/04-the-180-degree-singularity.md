---
id: l04-the-180-degree-singularity
title: The 180-degree singularity
minutes: 18
covers:
  - convergence and singular geometries near a 180 degree transfer
---

Put a sheet of cardboard on three pushpins that are not in a row. It sits still. Three points that do not line up fix one flat sheet, and only one. Now line the three pins up in a straight row. The sheet can tip forward, tip back, or stand straight up — it swings around the row like a door on its hinges. Three points in a line do not fix a sheet at all.

Every Lambert solver in this module leans on that first picture. The three "pins" are the **focus** (the center of the planet or the Sun), the start point $\mathbf{r}_1$ and the end point $\mathbf{r}_2$. They fix the flat sheet the orbit lies in, the **orbital plane**. The solver finds that plane with one line of code: the cross product $\mathbf{r}_1\times\mathbf{r}_2$ points straight out of it.

This lesson is about the one geometry where the pins line up. That happens when $\mathbf{r}_1$ and $\mathbf{r}_2$ point in exactly opposite directions — a **transfer angle** $\Delta\nu$ ("delta nu") of exactly $180°$. There, the plane is not fixed at all. Close to $180°$ something sneakier happens: the plane *is* fixed, but so weakly that a tiny error in a position moves it a lot. You will see both effects with real numbers, learn why no solver can make them go away, and learn what real mission teams do about it.

## Three points in a row: why $180°$ is truly singular

Recall how the solver picks the plane. The unit vector straight out of the orbital plane is

$$
\hat{\mathbf{h}} = \frac{\mathbf{r}_1\times\mathbf{r}_2}{\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert} .
$$

Read $\hat{\mathbf{h}}$ as "h hat": a **unit vector**, an arrow of length one that only carries a direction. The double bars $\lVert\cdot\rVert$ mean "length of". The same cross product is how every solver in this module decides prograde from retrograde and short way from long way.

The length of a cross product is $\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert = r_1 r_2 \sin\Delta\nu$. At $\Delta\nu = 180°$, $\sin 180° = 0$, so

$$
\mathbf{r}_1\times\mathbf{r}_2 = \mathbf{0} .
$$

This zero is exact, not merely very small. Two arrows on one line have no part that sticks out sideways from each other, and the cross product is built entirely from that sideways part. So the formula for $\hat{\mathbf{h}}$ asks you to divide zero by zero.

The picture says the same thing. When $\mathbf{r}_1$ and $\mathbf{r}_2$ point in opposite directions, the focus and both points sit on **one straight line**. Any plane that contains that line contains all three points. There are **[[infinitely many such planes|door-hinge]]**, each one the last turned a little around the line, like the pages of an open book around its spine.

What is still fixed? The *size* of the transfer. In the first lesson you met the geometry number $A$ and the fact that $A^2 = 2s(s-c)$, where $c$ is the **chord** (the straight-line distance from $\mathbf{r}_1$ to $\mathbf{r}_2$) and $s$ is the **semiperimeter** (half the distance around the triangle). These are lengths only. At $180°$ the chord runs straight through the focus, so $c = r_1 + r_2$, $s = r_1 + r_2$, and $A = 0$. Lambert's theorem says the flight time depends only on $a$, $c$ and $r_1 + r_2$, so the semi-major axis $a$ and the speeds at both ends are still pinned down.

What is missing is the *orientation*: which of the infinitely many planes the spacecraft flies in. That means the sideways part of $\mathbf{v}_1$ — the part across the $\mathbf{r}_1$–$\mathbf{r}_2$ line — could point anywhere around a full circle.

::: key The $180°$ degeneracy
At $\Delta\nu=180°$ exactly, $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ and the transfer plane is undefined: infinitely many planes contain both the focus and the (collinear) endpoints. The transfer's size and speed are still determined, but its orientation — and hence the direction of $\mathbf{v}_1$ transverse to the $\mathbf{r}_1$–$\mathbf{r}_2$ line — is not, without extra information from outside the two position vectors themselves (a specified inclination, a specified out-of-plane velocity component, or some other constraint).
:::

### The algebra says it too

The solver from lesson 2 reports the same problem in its own language. Its geometry number is

$$
A = \sin\Delta\nu\sqrt{\frac{r_1r_2}{1-\cos\Delta\nu}} ,
$$

and $\sin 180° = 0$, so $A \to 0$. The Lagrange coefficient $g = A\sqrt{y/\mu}$ goes to zero with it. But the departure velocity is

$$
\mathbf{v}_1 = \frac{\mathbf{r}_2-f\mathbf{r}_1}{g} ,
$$

so the solver divides by something that is going to zero. At exactly $180°$ the top goes to zero as well. With $A = 0$ the solver's $y$ equals $r_1 + r_2$, so $f = 1 - y/r_1 = -r_2/r_1$. And since $\mathbf{r}_2$ points exactly opposite $\mathbf{r}_1$, $\mathbf{r}_2 = -(r_2/r_1)\,\mathbf{r}_1$. The top becomes $-(r_2/r_1)\mathbf{r}_1 + (r_2/r_1)\mathbf{r}_1 = \mathbf{0}$.

So the formula becomes $\mathbf{0}/0$ — an **[[indeterminate form|zero-over-zero]]**, algebra's way of saying "this formula alone cannot tell you the answer". That is not a bug to patch. It is the algebra faithfully reporting the geometry back to you.

## Near $180°$: a real answer that wobbles

Now back off a little, to $179.9°$. The three points are no longer exactly in a row. The plane is defined, $A$ is not zero, and the solver returns an answer with no error and no warning.

The trouble is how much that answer moves when the input moves a little. Real position vectors come from **[[orbit determination|orbit-determination]]** — working out where a spacecraft or planet is from tracking data — or from predicted planet positions or onboard navigation. They always carry some error, from metres to kilometres even for well-tracked objects. Near $180°$, that ordinary error gets magnified into a big error in $\mathbf{v}_1$. The error lands in one particular direction: out of the plane, the exact direction the last section said becomes undefined at $180°$.

Two words make this precise.

- A problem is **well-posed** when an answer exists, there is only one, and it changes smoothly when the inputs change.
- A well-posed problem is **[[ill-conditioned|ill-conditioned-word]]** when that smooth change is very steep: a small change in the input makes a large change in the output. The ratio "output change per input change" is the **sensitivity**.

Lambert's problem near $180°$ is well-posed but ill-conditioned. Here are the numbers.

::: example Sweeping the transfer angle toward $180°$
**Set-up.** Fix the start point $\mathbf{r}_1=(7000,0,0)\,\mathrm{km}$, the end distance $r_2=10\,000\,\mathrm{km}$ and the flight time $\Delta t=5000\,\mathrm{s}$, around Earth. Put $\mathbf{r}_2$ at transfer angle $\Delta\nu$ in the $xy$-plane:

$$
\mathbf{r}_2 = 10\,000\,(\cos\Delta\nu,\ \sin\Delta\nu,\ 0)\,\mathrm{km} .
$$

**Step 1.** Solve Lambert for $\mathbf{v}_1$.

**Step 2.** Nudge $\mathbf{r}_2$ sideways, straight out of the transfer plane, by $\delta\mathbf{r}_2 = (0,0,1)\,\mathrm{km}$. (Read $\delta$, "delta", as "a small change in".) That is a $1\,\mathrm{km}$ error on a $10\,000\,\mathrm{km}$ vector — one part in ten thousand, smaller than the typical uncertainty in a well-tracked body's predicted position.

**Step 3.** Solve Lambert again and measure how far $\mathbf{v}_1$ moved, $\lVert\delta\mathbf{v}_1\rVert$. Divide by the $1\,\mathrm{km}$ nudge. That is the sensitivity:

| $\Delta\nu$ | Sensitivity, $\lVert\delta\mathbf{v}_1\rVert/\lVert\delta\mathbf{r}_2\rVert$ |
| --- | --- |
| $150°$ | $1.57\times10^{-3}\,\mathrm{(km/s)/km}$ |
| $170°$ | $4.67\times10^{-3}$ |
| $175°$ | $9.35\times10^{-3}$ |
| $178°$ | $2.34\times10^{-2}$ |
| $179°$ | $4.69\times10^{-2}$ |
| $179.5°$ | $9.38\times10^{-2}$ |
| $179.9°$ | $4.68\times10^{-1}$ |
| $179.99°$ | $4.21$ |

**Reading the table.** From $150°$ to $179.99°$ the sensitivity climbs by a factor of about $2700$ — more than three powers of ten — and it is not leveling off. Look at the pattern: from $179°$ to $179.9°$ the gap to $180°$ shrinks ten times and the sensitivity grows ten times ($0.0469 \to 0.468$). That is growth like $1/(180°-\Delta\nu)$.

**Sanity check.** That is exactly what a division by $g$ predicts. $g$ is proportional to $A$, and $A$ is proportional to $\sin\Delta\nu$. Near $180°$, $\sin\Delta\nu$ is almost exactly the gap $180° - \Delta\nu$ measured in radians (a **[[small-angle|small-angle-sine]]** fact). Anything divided by $g$ therefore blows up at the same rate the gap shrinks.

The last step, $179.9° \to 179.99°$, grows a bit less than ten times ($0.468 \to 4.21$, a factor of $9.0$). At that point a $1\,\mathrm{km}$ nudge is no longer small compared with the geometry, as the next example shows.
:::

::: example Where the error actually goes
**The clean answer.** At $\Delta\nu=179.9°$ the solver gives

$$
\mathbf{v}_1 = (1.2101,\ 8.1842,\ 0)\,\mathrm{km/s} .
$$

The $z$ part is zero, as it must be: $\mathbf{r}_1$ and the un-nudged $\mathbf{r}_2$ both lie in the $xy$-plane, so the orbit does too.

**The nudged answer.** Add the $1\,\mathrm{km}$ out-of-plane nudge to $\mathbf{r}_2$ and solve again:

$$
\mathbf{v}_1' = (1.2101,\ 8.1708,\ 0.4682)\,\mathrm{km/s} .
$$

**The difference.** Subtract, piece by piece:

$$
\mathbf{v}_1' - \mathbf{v}_1 = (0.0000069,\ -0.0134,\ 0.4682)\,\mathrm{km/s} .
$$

Almost all of it is in the new $z$ part. A $1\,\mathrm{km}$ wobble — $0.01\%$ of $\lVert\mathbf{r}_2\rVert$ — has created nearly half a kilometre per second of out-of-plane velocity. That is as big as a whole orbit-raising burn, caused by a position error that would be harmless anywhere else on the sweep.

**What happened.** The nudge chose a new plane. The solver, doing exactly its job, swung the whole sideways velocity into that plane. The next note shows how big the swing is with nothing but a right triangle.
:::

::: note Why it grows like $1/(180° - \Delta\nu)$: the hinge
Look straight down the $\mathbf{r}_1$ line, so it shrinks to a dot. At $\Delta\nu = 179.9°$, $\mathbf{r}_2$ sits only a little way off that line:

$$
r_2 \sin(0.1°) = 10\,000 \times 0.0017453 = 17.45\,\mathrm{km} .
$$

The plane is the flat sheet from the $\mathbf{r}_1$ line out to $\mathbf{r}_2$. Lift $\mathbf{r}_2$ by $1\,\mathrm{km}$ and the sheet [[tips around the line|tilt-picture]] by the angle

$$
\theta = \arctan\frac{1}{17.45} = 3.28° .
$$

The sideways part of $\mathbf{v}_1$ (across the $\mathbf{r}_1$ line, the $8.1842\,\mathrm{km/s}$ $y$ part) tips with the sheet. Its new $z$ part is $8.1842 \times \sin 3.28° = 0.468\,\mathrm{km/s}$, and its $y$ part shrinks by $8.1842\,(1 - \cos 3.28°) = 0.0134\,\mathrm{km/s}$. Those are exactly the numbers the solver produced.

Halve the gap to $180°$ and the lever arm $17.45\,\mathrm{km}$ halves, so the same nudge tips the sheet twice as far. That is the $1/(180°-\Delta\nu)$ law. At $179.99°$ the lever arm is only $1.745\,\mathrm{km}$, and the $1\,\mathrm{km}$ nudge tips the sheet by $29.8°$ — no longer a small tilt. That is why the last row of the table grows a little less than ten times.
:::

::: warning The problem is well-posed; only the sensitivity is bad
"Ill-conditioned" is not the same complaint as "singular". For any $\Delta\nu$ below $180°$, Lambert's problem has one answer, and a good solver finds it: the solver used for these examples converged cleanly at $179.99°$, and flying its answer forward with an accurate integrator landed within a metre of $\mathbf{r}_2$ — a $10\,000\,\mathrm{km}$ target. The whole issue is *sensitivity*. The map from the inputs ($\mathbf{r}_1$, $\mathbf{r}_2$) to the output ($\mathbf{v}_1$) gets steeper without limit as $\Delta\nu\to180°$, so an input error that is harmless elsewhere becomes a large output error here. In a rushed test, a problem with huge sensitivity and a truly singular problem can look alike. They are not the same, and they need different fixes.
:::

## Why no solver can fix it

The steepness belongs to the geometry, not to any piece of code. Switch methods — universal variables, Izzo's method, anything else in this module — and every correct implementation shows the same sensitivity near $180°$, because they all solve the same problem. A better solver can avoid *crashing* at $180°$. It cannot make the answer less sensitive, because the answer itself is sensitive.

## What a real targeting system does

Since the algebra cannot be patched, real practice works around it. The idea: never depend on precision in the one direction that gets magnified.

**First, stay away from the ridge when you have a choice.** Later in this module you will build **porkchop plots** — maps of launch cost over a grid of departure and arrival dates. The two good regions on those maps, the **[[Type I and Type II|type-one-two]]** lobes, are transfers below and above $180°$. They are separated by exactly this ridge. A mission designer reads the whole map before picking a date, so the chosen date sits well inside a lobe rather than on the ridge between them.

**Second, if you cannot avoid it, bring in the missing information.** Sometimes a fixed launch window or a timing constraint lands the transfer near $180°$. Then treat the sideways, out-of-plane part of the target as *not pinned down by the position data alone*. Supply it from somewhere else:

- a required inclination for the transfer orbit;
- a required approach plane, for example for a planetary flyby;
- more weight on velocity or plane-direction measurements in the orbit determination that feeds the targeting.

What you must not do is trust two position vectors to fix a direction they cannot resolve.

**Third, budget more fuel for corrections.** The sensitivity comes from the transfer geometry, not from any one burn, so it does not vanish after the first correction. A small **[[trajectory correction manoeuvre|tcm-bridge]]** (TCM) removes accumulated error on the way. A trip near the ridge needs a bigger TCM allowance than one well inside a lobe, because even a well-executed first burn leaves an out-of-plane error that ordinary navigation uncertainty has made large.

## Check yourself

::: check
Explain why $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ at $\Delta\nu=180°$ is an exact statement, not an approximation that happens to be very small.
:::

::: answer
The cross product of two vectors is exactly zero if and only if they are parallel or antiparallel — lying along one common line through the origin. Its length is $r_1 r_2\sin\Delta\nu$, and $\sin 180° = 0$ exactly. At $\Delta\nu=180°$, $\mathbf{r}_1$ and $\mathbf{r}_2$ point in exactly opposite directions along the same line by definition, so $\mathbf{r}_1\times\mathbf{r}_2$ is zero for any lengths $r_1$ and $r_2$ — not only in the limit as $\Delta\nu$ approaches $180°$.
:::

::: check
A colleague says "Lambert's problem has no solution at exactly $180°$." Is this accurate? Correct the statement if not.
:::

::: answer
Not quite. The size of the transfer — the semi-major axis and the speeds at each end — is still determined at $\Delta\nu=180°$, because $A^2=2s(s-c)$ and Lambert's theorem depend only on lengths, and those are still well defined. What is missing is not a solution but a *unique* one. The orbital plane is undetermined, so there is a whole one-parameter family of equally valid transfer planes (each one turned a little further around the $\mathbf{r}_1$–$\mathbf{r}_2$ line), with a matching circle of possible directions for the sideways part of $\mathbf{v}_1$. Infinitely many solutions, not zero, and not one.
:::

::: check
Why does adding a small perpendicular (out-of-plane) perturbation to $\mathbf{r}_2$, rather than an in-plane one, expose the ill-conditioning most dramatically near $\Delta\nu=180°$?
:::

::: answer
Near $180°$ the plane is only weakly fixed by $\mathbf{r}_1$ and $\mathbf{r}_2$: their cross product is small, so any change to the part of $\mathbf{r}_2$ that feeds that cross product has an outsized effect on which plane they define. A nudge that stays in the original plane does not, to first order, change which plane the two vectors define. A perpendicular nudge directly creates a new cross-product direction out of something that was nearly zero. In the hinge picture, it lifts the end of a very short lever arm ($17.45\,\mathrm{km}$ at $179.9°$), so the sheet tips a lot. The solver responds by rotating the whole sideways velocity into the new plane — a plane that is now well defined, but chosen essentially by the error.
:::

::: check
The sensitivity table shows roughly a ten-fold increase in $\lVert\delta\mathbf{v}_1\rVert/\lVert\delta\mathbf{r}_2\rVert$ for each ten-fold decrease in $180°-\Delta\nu$ (for example, from $179°$ to $179.9°$ to $179.99°$). What functional form does this suggest, and why is it consistent with $A=\sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ appearing in the denominator of $\mathbf{v}_1=(\mathbf{r}_2-f\mathbf{r}_1)/g$ with $g\propto A$?
:::

::: answer
It suggests sensitivity growing like $1/(180°-\Delta\nu)$. Equivalently, like $1/\sin\Delta\nu$ near $\Delta\nu=\pi$, because $\sin\Delta\nu \approx \pi-\Delta\nu$ (in radians) when $\Delta\nu$ is close to $\pi$.

Now follow the chain. $g=A\sqrt{y/\mu}$, and $A$ is proportional to $\sin\Delta\nu$. The solver gets $\mathbf{v}_1$ by dividing by $g$. So any fixed-size error in the top of that fraction is multiplied by a factor that grows like $1/\sin\Delta\nu$ — which is exactly a $1/(180°-\Delta\nu)$ blow-up as the transfer angle approaches $180°$.
:::

::: check
A mission's launch window forces a transfer angle of $179.6°$ with no flexibility. What would you recommend to the targeting team, given this lesson's findings?
:::

::: answer
Do not rely on the two position vectors alone to fix the transfer plane. Near this geometry, ordinary-sized position uncertainty turns into a large, effectively unconstrained out-of-plane velocity error. (By the hinge picture, the lever arm is only $r_2\sin 0.4°$, about $70\,\mathrm{km}$ for a $10\,000\,\mathrm{km}$ orbit.)

Instead, bring in independent information to pin down the plane: a required inclination or approach-plane constraint from the mission design, or extra velocity or plane-direction information from orbit determination. Do not take the Lambert solve's sideways direction at face value.

Also budget a larger trajectory-correction-manoeuvre allowance than for a transfer safely inside a Type I or Type II lobe. The first burn is likely to leave a larger-than-usual out-of-plane miss that must be removed later.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ at $\Delta\nu=180°$ | Exact degeneracy: infinitely many planes contain the collinear endpoints |
| $c = r_1 + r_2$, $A = 0$ at $180°$ | Size of the transfer still fixed; only the orientation is lost |
| $A\propto\sin\Delta\nu \to 0$ | The algebraic symptom; $g=A\sqrt{y/\mu}\to0$ sits in the denominator of $\mathbf{v}_1$, which becomes $\mathbf{0}/0$ |
| Well-posed but ill-conditioned near $180°$ | One answer exists and the solver converges; small input errors make large output errors |
| Sensitivity $\sim 1/(180°-\Delta\nu)$ | From $1.6\times10^{-3}$ to $4.2\,\mathrm{(km/s)/km}$ over $150°\to179.99°$; the hinge's lever arm is $r_2\sin(180°-\Delta\nu)$ |
| Out-of-plane nudge | The direction the near-degenerate plane cannot resolve; where the magnified error lands |
| What teams do | Avoid the ridge (read the whole porkchop map); otherwise supply plane information from outside the position data, and budget more correction margin |

The next two lessons build the tools every targeting system uses, ridge or no ridge, to remove whatever error a Lambert solve leaves once the vehicle is flying: first the **state transition matrix**, which measures how a small change now becomes a change later, then **differential correction**, which uses it to steer onto the target.

::: context door-hinge A door on a hinge
Look along the line through the focus, $\mathbf{r}_1$ and $\mathbf{r}_2$ so that it shrinks to a single dot. Every plane containing that line now looks like a straight line through the dot — a fan of possible orbit planes, all equally good. Nothing in the two positions picks one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="95" x2="150" y2="95" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="85" y1="95" x2="140" y2="95" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="146,95 136,90 136,100" fill="#1d6fd1"/>
  <line x1="85" y1="95" x2="30" y2="95" stroke="#b4232c" stroke-width="3"/>
  <polygon points="24,95 34,90 34,100" fill="#b4232c"/>
  <circle cx="85" cy="95" r="5" fill="#1f2a44"/>
  <text x="85" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">focus</text>
  <text x="130" y="84" font-size="13" fill="#1d6fd1">r₁</text>
  <text x="30" y="84" font-size="13" fill="#b4232c">r₂</text>
  <text x="85" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">side view: one line</text>
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="208" y1="80" x2="312" y2="140"/>
    <line x1="230" y1="58" x2="290" y2="162"/>
    <line x1="260" y1="50" x2="260" y2="170"/>
    <line x1="290" y1="58" x2="230" y2="162"/>
    <line x1="312" y1="80" x2="208" y2="140"/>
  </g>
  <line x1="200" y1="110" x2="320" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="260" cy="110" r="5" fill="#1f2a44"/>
  <text x="260" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">end-on view: every plane fits</text>
</svg>
```

This is why the $180°$ transfer needs a piece of outside information, such as the inclination, to choose one plane from the fan.
:::

::: context zero-over-zero What 0/0 means
A fraction like $6/0$ has no value at all: no number times zero gives six. But $0/0$ is different. *Every* number times zero gives zero, so "the number that times zero gives zero" could be anything. Mathematicians call this an **indeterminate form**: the formula alone cannot say which value is right.

That is precisely the $180°$ situation. The solver's formula for $\mathbf{v}_1$ becomes $\mathbf{0}/0$ because many different velocities — one for each plane in the fan — are equally correct. To pick one you need extra information, not better arithmetic.
:::

::: context orbit-determination Where position vectors come from
Nobody hands a mission a perfect $\mathbf{r}_1$ and $\mathbf{r}_2$. **Orbit determination** is the job of turning tracking data — radar ranges, radio Doppler shifts, star-camera sightings, GPS fixes — into the best estimate of where something is and where it is going. Later modules in this course build the tools that do it: the Kalman filter and orbit determination.

Every estimate comes with an uncertainty. For a spacecraft in low Earth orbit with onboard GPS it may be metres. For a planet's predicted position, or a spacecraft in deep space tracked by radio, it can be kilometres. This lesson is about what happens when that ordinary, unavoidable fuzz meets a geometry that magnifies it.
:::

::: context ill-conditioned-word A wobbly ladder
Think of a very tall ladder with its feet close together. It is standing, and it is standing in exactly one spot — but brush it and the top swings a long way. That is **ill-conditioning**: an answer exists and is unique, yet it moves a lot for a small push.

Engineers put a number on it called the **condition number**: roughly, "how many times bigger is the relative change in the output than the relative change in the input". A condition number near $1$ is a sturdy stepladder. A condition number of a million means you lose about six digits of accuracy — your input's error, blown up a million times. Near $180°$, Lambert's condition number climbs without limit.
:::

::: context small-angle-sine Why sin of a tiny gap equals the gap
Near $180°$, $\sin\Delta\nu = \sin(180° - \Delta\nu)$ — the sine of a nearly straight angle equals the sine of the small gap left over. And for a small angle measured in **radians**, the sine is almost exactly the angle itself.

Check it at $179.9°$. The gap is $0.1° = 0.0017453\,\mathrm{rad}$, and $\sin(0.1°) = 0.0017453$. They agree to five significant figures.

So near $180°$, "$\sin\Delta\nu$" and "how far short of $180°$ you are" are the same number. Dividing by one is dividing by the other, which is where the $1/(180° - \Delta\nu)$ law comes from.
:::

::: context tilt-picture The tilt, drawn to scale
Here is the hinge at $\Delta\nu = 179.9°$, looking straight down the $\mathbf{r}_1$ line. The end point $\mathbf{r}_2$ is $17.45\,\mathrm{km}$ off that line. A $1\,\mathrm{km}$ lift tips the plane by $3.28°$ — and the sideways velocity of about $8.18\,\mathrm{km/s}$ tips with it, gaining a $0.468\,\mathrm{km/s}$ out-of-plane part.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="340" y2="80" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="80" x2="340" y2="62.8" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="40" cy="80" r="5" fill="#1f2a44"/>
  <circle cx="320" cy="80" r="4" fill="#1f2a44"/>
  <circle cx="320" cy="64" r="4" fill="#b4232c"/>
  <line x1="320" y1="80" x2="320" y2="64" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="95" x2="40" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="320" y1="95" x2="320" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">17.45 km from the r₁ line to r₂</text>
  <text x="326" y="54" font-size="12" fill="#b4232c" text-anchor="end">1 km lift</text>
  <text x="48" y="60" font-size="12" fill="#1f2a44">r₁ line (end-on)</text>
  <text x="200" y="60" font-size="12" fill="#b4232c">tipped plane, 3.28°</text>
  <text x="170" y="94" font-size="12" fill="#1d6fd1">original plane</text>
</svg>
```

The height and length are drawn at the same scale ($16\,\mathrm{px}$ per km), so the angle you see is the real one.
:::

::: context type-one-two Type I, Type II, and the Hohmann transfer
Interplanetary designers name transfers by how far they swing around the Sun. **Type I** sweeps less than $180°$; **Type II** sweeps more than $180°$ but less than $360°$. On a porkchop plot they appear as two separate islands of low cost, with a thin ridge between them — this lesson's singularity.

A classic Hohmann transfer is exactly $180°$, which seems to contradict all this. It works on paper because the Hohmann picture assumes both orbits already lie in one plane, so the plane is supplied from outside. Real planets' orbits are tilted slightly against each other (Mars's by about $1.85°$ to Earth's), so a near-$180°$ trip to Mars would need a steep, costly plane change. Designers avoid the ridge, or split the plane change off into a separate mid-course burn.
:::

::: context tcm-bridge Small burns on the way
A **trajectory correction manoeuvre**, or TCM, is a small burn during the cruise that nudges the spacecraft back onto its planned path. Interplanetary missions plan several. The last lesson of this module works out when each one is cheapest, and how big a fuel allowance the whole set needs.

The link to this lesson: the error a TCM must remove grows with the sensitivity of the transfer. A transfer near $180°$ turns small navigation errors into big out-of-plane misses, so it needs a bigger TCM budget.
:::
