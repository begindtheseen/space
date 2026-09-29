---
id: l06-football-orbits-and-circumnavigation
title: Football orbits and natural motion circumnavigation
minutes: 19
covers:
  - football and drifting relative orbits
  - natural motion circumnavigation
---

Imagine riding along inside the target spacecraft, looking out of the window at a chaser nearby. Neither vehicle fires an engine. If the chaser's orbit is a slightly different size from yours, you watch it slide steadily away and never come back — the drift of the last lesson. But if the two orbits are exactly the same size, something tidier happens. The chaser traces the same loop outside your window, over and over, once per orbit, forever.

This lesson is about that loop. It has a definite shape: an oval exactly twice as long as it is tall. It has a definite direction: it always goes round the "wrong" way. And you can place it wherever you like. Put it beside the target and it swings back to the target once an orbit. Center it on the target and the chaser circles the target at a safe distance, a **natural motion circumnavigation**, with no fuel spent after the one burn that starts it.

Both are standard tools for close inspection. A chaser can watch a tumbling satellite from every side without spending propellant on anything but the first burn.

## The shape of a closed relative orbit

Start from the drift-free condition of lesson 5, $\dot y_0 = -2nx_0$. Put it into the full CW solution. The secular terms cancel, as lesson 5 showed, and what is left is

$$
x(t) = x_0\cos nt + \frac{\dot x_0}{n}\sin nt, \qquad
y(t) - y_c = -2\left(x_0\sin nt - \frac{\dot x_0}{n}\cos nt\right), \qquad y_c \equiv y_0 - \frac{2\dot x_0}{n}.
$$

As before, $x$ is radial (up, away from Earth), $y$ is in-track (along the direction of flight), and $n$ is the reference orbit's mean motion. The new symbol $y_c$ is the in-track position of the loop's center; the sign $\equiv$ means "is defined as".

::: note Why it has to be true
Take the radial row of the CW solution from lesson 3 and replace $\dot y_0$ with $-2nx_0$:

$$
x(t) = (4-3\cos nt)x_0 + \frac{\sin nt}{n}\dot x_0 + \frac{2}{n}(1-\cos nt)(-2nx_0).
$$

The last term is $-4(1 - \cos nt)x_0 = -4x_0 + 4x_0\cos nt$. Add it to $(4 - 3\cos nt)x_0$: the $4x_0$ cancels and the cosines give $x_0\cos nt$. So $x(t) = x_0\cos nt + (\dot x_0/n)\sin nt$.

Now the in-track row, with the same swap:

$$
y(t) = 6(\sin nt - nt)x_0 + y_0 - \frac{2}{n}(1-\cos nt)\dot x_0 + \frac{1}{n}(4\sin nt - 3nt)(-2nx_0).
$$

The last term is $-8x_0\sin nt + 6nt\,x_0$. Its $+6nt\,x_0$ cancels the $-6nt\,x_0$ in the first term — the secular terms are gone. The sines combine as $6x_0\sin nt - 8x_0\sin nt = -2x_0\sin nt$. So

$$
y(t) = y_0 - \frac{2\dot x_0}{n} - 2x_0\sin nt + \frac{2\dot x_0}{n}\cos nt ,
$$

which is $y_c - 2\big(x_0\sin nt - (\dot x_0/n)\cos nt\big)$.
:::

Both $x(t)$ and $y(t) - y_c$ are mixtures of $\sin nt$ and $\cos nt$, so each one is a smooth wave that repeats once per orbit. The **amplitude** of a wave is how far it swings from its middle. For $x$ it is

$$
A = \sqrt{x_0^2 + \left(\frac{\dot x_0}{n}\right)^2}.
$$

Now look at $y(t) - y_c$. It is $-2$ times a mixture of the *same* two numbers, $x_0$ and $\dot x_0/n$. So its amplitude is exactly $2A$. The in-track swing is twice the radial swing.

To see the shape, write $x_0 = A\cos\varphi$ and $\dot x_0/n = A\sin\varphi$ for some angle $\varphi$ (read "phi"). Using the angle-difference formulas from trigonometry, the two lines become

$$
x = A\cos(nt - \varphi), \qquad y - y_c = -2A\sin(nt - \varphi).
$$

Divide the first by $A$ and the second by $2A$, square both and add. Since $\cos^2 + \sin^2 = 1$, time [[drops out|eliminating-time]]:

$$
\frac{x^2}{A^2} + \frac{(y-y_c)^2}{(2A)^2} = 1.
$$

That is the equation of an ellipse — an oval — twice as long in-track as it is tall radially.

::: key The football orbit
Any drift-free CW initial condition ($\dot y_0 = -2nx_0$) produces a closed ellipse in the $x$–$y$ plane, centered at $(0, y_c)$ with $y_c = y_0 - 2\dot x_0/n$, radial semi-axis $A = \sqrt{x_0^2+(\dot x_0/n)^2}$ and in-track semi-axis $2A$ — always exactly a 2:1 ratio, regardless of the specific $x_0$, $\dot x_0$, $y_0$ chosen. It is traversed once per orbit in the retrograde sense. The shape is nicknamed the **[["football"|football-name]]** for its elongated outline.
:::

### Why exactly two to one

The 2:1 ratio is not luck. It comes straight from the in-track CW equation, $\ddot y + 2n\dot x = 0$.

Add that up once over time and you get $\dot y + 2nx = \text{constant}$. At the start the constant is $\dot y_0 + 2nx_0$ — and the drift-free condition makes that zero. So on every closed orbit, at every moment,

$$
\dot y = -2nx .
$$

In words: the chaser's in-track speed is always $-2n$ times its height above the target. The height swings with amplitude $A$, so the in-track speed swings with amplitude $2nA$. A wave with speed amplitude $2nA$ repeating at rate $n$ travels $2nA/n = 2A$ from its middle. Height $A$ in, length $2A$ out, every time. Burn size and direction change $A$ and $y_c$, but never the ratio.

## Which way around

The same equation, $\dot y = -2nx$, tells you the direction.

- When the chaser is **above** the target ($x > 0$), $\dot y$ is negative: it moves **backward**, falling behind.
- When it is **below** ($x < 0$), $\dot y$ is positive: it moves **forward**, pulling ahead.

That matches lesson 5's physics. Higher means slower, lower means faster. So the loop goes: over the top moving backward, underneath moving forward.

Now picture it from the orbit's "north" side, the $+\hat{\mathbf{z}}$ direction that the cross-track axis points along. From there the target goes round Earth **counterclockwise**. Draw the chaser's loop with "up" as away from Earth and the direction of flight pointing *left*, which is what that view gives you. Over the top moving backward means moving right; underneath moving forward means moving left. That is **clockwise** — the opposite way to the orbit itself. Going round opposite to the orbital motion is called **[[retrograde|retrograde-word]]**.

::: key Direction of travel
The football orbit is always traversed in the retrograde sense — clockwise as viewed from the cross-track ($+\hat{\mathbf{z}}$, orbit-normal) direction — once per target orbital period, regardless of which drift-free initial condition produced it.
:::

Check it against the formulas. Start at $(x, y - y_c) = (A, 0)$, the top of the loop. A quarter orbit later, $x = A\cos(\pi/2) = 0$ and $y - y_c = -2A\sin(\pi/2) = -2A$: the chaser has moved to the back end. Then $(-A, 0)$ at the bottom, then $(0, 2A)$ at the front, then back to the top. Top, back, bottom, front: the same clockwise loop.

## Building one from a pure radial burn

The cleanest way to make a football orbit is also the most instructive. Start on top of the target and fire a single burn straight up, along $+\hat{\mathbf{x}}$.

Then $x_0 = y_0 = 0$, $\dot x_0 = \Delta v$ and $\dot y_0 = 0$. Check the drift-free condition: it wants $\dot y_0 = -2nx_0 = -2n \times 0 = 0$. It is already met, because $x_0$ was zero to begin with. **Any** purely radial kick from co-location is drift-free. No in-track correction is needed.

::: example A 0.1 m/s radial burn, closed and confirmed
Fire $\Delta v = 0.1\,\mathrm{m/s}$ radially outward from co-location on the reference orbit, $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$.

**Step 1: the size.** With $x_0 = 0$, the amplitude is $A = \dot x_0/n = 0.1 / 1.1282\times10^{-3} = 88.64\,\mathrm{m}$.

**Step 2: the center.** $y_c = y_0 - 2\dot x_0/n = 0 - 2 \times 88.64 = -177.28\,\mathrm{m}$. The loop sits behind the target.

**Step 3: the path.** With $x_0 = 0$ the formulas become $x = A\sin nt$ and $y = y_c + 2A\cos nt = -2A(1 - \cos nt)$. At one-eighth of an orbit, $nt = \pi/4$: $x = 88.64 \times 0.7071 = 62.68\,\mathrm{m}$ and $y = -177.28 \times (1 - 0.7071) = -51.92\,\mathrm{m}$. All the way round:

| Fraction of orbit | 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.75 | 1.0 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $x$ (m) | 0.0 | 62.68 | 88.64 | 62.68 | 0.0 | $-88.64$ | 0.0 |
| $y$ (m) | 0.0 | $-51.92$ | $-177.28$ | $-302.64$ | $-354.56$ | $-177.28$ | 0.0 |

**Step 4: read it.** The chaser rises, drifts back over the top, reaches $354.56\,\mathrm{m}$ behind at half an orbit, passes underneath, and returns *exactly* to the target after one orbit. The loop is $2A = 177.3\,\mathrm{m}$ tall and $4A = 354.6\,\mathrm{m}$ long: 2:1, as promised.

**Step 5: check against the truth.** Full nonlinear two-body propagation of the same burn agrees with every entry to about a centimeter. The gap is $7\,\mathrm{mm}$ at half an orbit and $11\,\mathrm{mm}$ after one orbit. After three orbits it is $3.3\,\mathrm{cm}$.

**Sanity check.** Lesson 4's rule, $1.39\,\mathrm{m/orbit} \times (d/1\,\mathrm{km})^2$ with $d = A = 0.0886\,\mathrm{km}$, gives $1.39 \times 0.00786 = 0.011\,\mathrm{m}$ per orbit — the 11 mm the truth model shows.
:::

Now compare with an in-track burn of the same size. Fired along $+\hat{\mathbf{y}}$, $0.1\,\mathrm{m/s}$ gives $\dot y_0 \ne 0$ with $x_0 = 0$, which breaks the drift-free condition. By lesson 5 it drifts back $3\Delta v\,T = 3 \times 0.1 \times 5569 = 1671\,\mathrm{m}$ every orbit, forever — twice the 835 m of lesson 5's 5 cm/s burn.

Same size of burn, same starting point, perpendicular directions. One gives a tidy 355 m loop that comes home every orbit; the other walks off by 1.7 km an orbit. The whole difference is which of $x_0$ and $\dot y_0$ ends up nonzero, and it traces back to one condition.

## Natural motion circumnavigation

The loop above touches the target once per orbit. That is not a comfortable way to inspect something up close. The fix is to move the loop's center, while keeping it drift-free.

The center is at $y_c = y_0 - 2\dot x_0/n$. You can put it anywhere by choosing the starting in-track position $y_0$. Choose $y_0 = 2\dot x_0/n$ and the center lands at $y_c = 0$: right on the target. Now the chaser [[circles the target at a stand-off distance|centred-loop]].

::: example A centered inspection loop
Use the same radial driver, $\dot x_0 = 0.1\,\mathrm{m/s}$, but start ahead of the target at $y_0 = 2\dot x_0/n = 177.28\,\mathrm{m}$ instead of on top of it. Still $x_0 = 0$ and $\dot y_0 = 0$, so still drift-free.

**Step 1: the path.** Now $y_c = 177.28 - 177.28 = 0$. The formulas give $x = A\sin nt$ and $y = 2A\cos nt$, with $A = 88.64\,\mathrm{m}$ as before.

**Step 2: the closest points.** The range to the target is $\sqrt{x^2 + y^2}$. It is smallest where the loop is narrowest: at the top and bottom, $x = \pm A$ and $y = 0$. The minimum range is $A = 88.64\,\mathrm{m}$.

**Step 3: the farthest points.** At the front and back ends, $x = 0$ and $y = \pm 2A$. The maximum range is $2A = 177.28\,\mathrm{m}$.

**Step 4: check it closes.** Propagating a full period with $\boldsymbol\Phi(T)$ returns the starting state to machine precision.

**Result.** On one burn, the chaser circles the target forever at a range between about 89 m and 177 m. That is the in-plane natural motion circumnavigation.
:::

The loop so far lies flat in the orbital plane. To see the target from above and below as well, add cross-track motion.

A cross-track starting position $z_0$, with $\dot z_0 = 0$, gives $z(t) = z_0\cos nt$ — the cross-track solution from lesson 3. It repeats at the same rate $n$ as the in-plane motion. And it lines up neatly: the radial motion is $x = A\sin nt$, so $z$ is at its biggest when $x$ passes through zero, and $x$ is at its biggest when $z$ passes through zero. Two waves at the same rate, a quarter cycle apart, are said to be **[[in quadrature|quadrature]]**. Plotted against each other they trace an ellipse; here, $x$ against $z$ traces a circle.

::: example Tilting the loop out of the orbital plane
Add $z_0 = 88.64\,\mathrm{m}$, equal to $A$, to the centered loop.

**Step 1: the path.** $x = A\sin nt$, $y = 2A\cos nt$, $z = A\cos nt$.

**Step 2: the closest points.** The in-plane closest points were where $\cos nt = 0$. There $z = A \times 0 = 0$ too. The cross-track motion adds nothing at those points, so the minimum range stays exactly $A = 88.64\,\mathrm{m}$.

**Step 3: the farthest points.** Where $\cos nt = \pm1$, $y = \pm 2A$ and $z = \pm A$ at the same time. The range is $\sqrt{(2A)^2 + A^2} = \sqrt{177.28^2 + 88.64^2} = \sqrt{31428 + 7857} = \sqrt{39285} = 198.2\,\mathrm{m}$.

**Step 4: the shape.** Every coordinate repeats at rate $n$, so the path still closes after exactly one orbit, with no propellant beyond the first burn. Since $z = y/2$ at every instant, the whole loop lies in one flat plane, tilted out of the orbital plane.

**Sanity check.** $198.2\,\mathrm{m} = \sqrt{5}\,A$, a bit more than the flat loop's $2A = 177.3\,\mathrm{m}$, as it should be when a sideways piece is added. The chaser now sees the target from either side of the orbital plane as well as from in front, behind, above and below: a full natural motion circumnavigation, and a first look at a [[safety ellipse|safety-ellipse]].
:::

::: warning Closed under CW is not closed forever
"Drift-free" and "closed" describe the CW model, not perfect reality. Lesson 4 showed that CW's error against true motion grows with separation, and far faster if the target's orbit is not really circular. A natural motion circumnavigation is fuel-free only until real-world effects — [[Earth's bulge|j2]] ($J_2$), drag, a target orbit that is not perfectly circular — nudge it off the drift-free condition. Then it slowly turns into the secular drift of lesson 5. In practice these loops are re-started or lightly trimmed from time to time. "Natural" describes the motion between corrections, not freedom from them.
:::

## Check yourself

::: check
A drift-free relative orbit has radial amplitude $A = 40\,\mathrm{m}$. What is its in-track amplitude, and what is the ratio between the two?
:::

::: answer
The in-track amplitude is $2A = 80\,\mathrm{m}$. The ratio, in-track to radial, is always exactly 2:1. It comes from the coupling in the CW equations, not from the particular starting state, so it holds for every drift-free orbit.
:::

::: check
Two drift-free loops use the same $0.1\,\mathrm{m/s}$ radial driver. One starts on top of the target ($y_0 = 0$); the other is centered on it ($y_0 = 177.28\,\mathrm{m}$). Do they have the same radial amplitude $A$? The same minimum range to the target?
:::

::: answer
Same amplitude: yes. With $x_0 = 0$, $A = \dot x_0/n$, which does not involve $y_0$. Both have $A = 88.64\,\mathrm{m}$.

Same minimum range: no. The first loop starts at the target, so its minimum range is $0$ — it touches the target once per orbit. The centered loop never comes closer than $A = 88.64\,\mathrm{m}$. Changing $y_0$ slides the same-shaped ellipse along the in-track axis. That slide is exactly what turns a touch-and-go loop into a stand-off loop.
:::

::: check
Explain why a football orbit's shape is fixed at 2:1, rather than depending on the burn's size or direction.
:::

::: answer
The in-track CW equation is $\ddot y + 2n\dot x = 0$. Adding it up once over time gives $\dot y + 2nx = \text{constant}$, and the drift-free condition makes that constant zero, so $\dot y = -2nx$ at every moment. The in-track speed is always tied to the height by the fixed factor $-2n$. A height swing of $A$ at rate $n$ therefore forces an in-track swing of $2nA/n = 2A$. Burn size and direction set $A$ (the scale) and $y_c$ (where the loop sits), but the ratio belongs to the equations themselves.
:::

::: check
Why does a cross-track *position* offset $z_0$ (rather than a cross-track velocity $\dot z_0$) automatically line up a quarter cycle from the radial motion of the centered loop, with no extra timing calculation?
:::

::: answer
The centered loop's radial motion comes from a pure velocity kick, so $x(t) = A\sin nt$: zero at the start. A pure position offset in cross-track gives $z(t) = z_0\cos nt$: biggest at the start. Sine and cosine of the same angle are always a quarter cycle apart. Using a velocity to drive $x$ and a position to drive $z$ is what pairs a sine with a cosine, with no delay to work out.
:::

::: check
A natural motion circumnavigation loop is started and then left alone, with no burns, for two weeks. What do you expect to see, and why?
:::

::: answer
At first the loop follows its predicted closed shape closely. Over time it stops closing exactly. Real effects that CW leaves out — the target's orbit not being exactly circular, $J_2$, drag — break the ideal drift-free condition and create a small effective $\delta a$ between chaser and target. By lesson 5, any nonzero $\delta a$ produces in-track drift that grows without limit. Two weeks is about 217 orbits, so the "closed" loop should be expected to smear out and walk away in-track, unless it is re-targeted or trimmed from time to time.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $x(t)=x_0\cos nt+(\dot x_0/n)\sin nt$ | Drift-free radial motion: a pure wave repeating once per orbit |
| $y(t)-y_c = -2\big(x_0\sin nt-(\dot x_0/n)\cos nt\big)$ | Drift-free in-track motion, centered at $y_c=y_0-2\dot x_0/n$ |
| $A=\sqrt{x_0^2+(\dot x_0/n)^2}$ | Radial semi-axis; the in-track semi-axis is always $2A$ |
| $\dot y = -2nx$ on a closed orbit | The reason for the 2:1 shape and the direction of travel |
| Football orbit | The 2:1 ellipse; traversed once per orbit in the retrograde (clockwise from $+\hat{\mathbf{z}}$) sense |
| Pure radial burn from co-location | Automatically drift-free ($x_0 = 0$ meets $\dot y_0=-2nx_0$); gives a football that touches the target |
| Centered natural motion circumnavigation | Same driver with $y_0=2\dot x_0/n$: a closed loop around the target, range between $A$ and $2A$ |
| Adding $z_0$ in quadrature with $x(t)$ | Tilts the loop out of the orbital plane for views from all sides; still closes once per orbit |
| Loops are fuel-free only ideally | Real perturbations slowly bring back lesson 5's secular drift |

Both this lesson and the last describe motion with no thrust after the first burn. The next lesson goes the other way: it designs the burns themselves, to move on purpose from one relative state to another in a chosen time — what a real rendezvous transfer needs.

::: context eliminating-time Getting rid of the clock
The two formulas tell you where the chaser is *at each time*. To see the *shape* of the path, you want one equation linking $x$ and $y$ with no $t$ in it.

The trick is the oldest identity in trigonometry. If $x/A = \cos\psi$ and $(y - y_c)/(2A) = -\sin\psi$ for the same angle $\psi = nt - \varphi$, then squaring and adding gives $\cos^2\psi + \sin^2\psi = 1$ whatever $\psi$ is. The time has vanished, and what remains is the ellipse. It is the same move that turns $x = \cos t$, $y = \sin t$ into the circle $x^2 + y^2 = 1$.
:::

::: context football-name Why "football"
An American football, seen from the side, is a long, pointed oval. This loop is a long oval too — exactly twice as long as it is tall. Here is the loop from this lesson's radial-burn example to scale, with the orbit's north side toward you: "up" is away from Earth and flight is to the left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="132.96" ry="66.48" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="190,33.5 178,27.5 178,39.5" fill="#1d6fd1"/>
  <polygon points="170,166.5 182,160.5 182,172.5" fill="#1d6fd1"/>
  <circle cx="47" cy="100" r="5" fill="#b4232c"/>
  <text x="40" y="122" font-size="12" fill="#b4232c" text-anchor="middle">target</text>
  <line x1="180" y1="33.5" x2="180" y2="166.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="47" y1="100" x2="312.9" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="186" y="80" font-size="12" fill="#1f2a44">2A = 177 m</text>
  <text x="250" y="116" font-size="12" fill="#1f2a44">4A = 355 m</text>
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">above: drifts back</text>
  <text x="180" y="192" font-size="12" fill="#1f2a44" text-anchor="middle">below: moves forward</text>
  <text x="10" y="205" font-size="11" fill="#1f2a44">← flight</text>
  <text x="352" y="205" font-size="11" fill="#1f2a44" text-anchor="end">clockwise = retrograde</text>
</svg>
```
:::

::: context retrograde-word Backward-stepping
**Retrograde** is Latin for "stepping backward"; **prograde** means "stepping forward". Astronomers first used retrograde for the way Mars seems to back up across the sky for a few weeks as Earth overtakes it.

In orbit work, prograde means "the same way the orbit goes round" and retrograde means "the opposite way". A retrograde *burn* points against the direction of flight. A retrograde *loop*, like the football, is traced round opposite to the way the target orbits Earth.
:::

::: context centred-loop Circling the target
The centered loop from the worked example, to scale and with the same view as before. The target sits at the middle. The closest approach, $A = 89\,\mathrm{m}$, is straight above and below; the farthest, $2A = 177\,\mathrm{m}$, is dead ahead and dead behind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="132.96" ry="66.48" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="190,33.5 178,27.5 178,39.5" fill="#1d6fd1"/>
  <polygon points="170,166.5 182,160.5 182,172.5" fill="#1d6fd1"/>
  <circle cx="180" cy="100" r="5" fill="#b4232c"/>
  <line x1="180" y1="100" x2="180" y2="36" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="100" x2="310" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="186" y="72" font-size="12" fill="#1f2a44">closest: A = 89 m</text>
  <text x="308" y="117" font-size="11" fill="#1f2a44" text-anchor="end">farthest: 2A = 177 m</text>
  <text x="172" y="118" font-size="12" fill="#b4232c" text-anchor="end">target</text>
  <text x="10" y="192" font-size="11" fill="#1f2a44">← flight</text>
  <text x="352" y="192" font-size="11" fill="#1f2a44" text-anchor="end">one lap per orbit</text>
</svg>
```

The chaser never comes nearer than 89 m, yet sees the target from front, top, back and bottom every orbit.
:::

::: context quadrature A quarter cycle apart
Two waves at the same rate, one starting at zero (the radial motion, blue: $x = A\sin nt$) and one starting at its peak (the cross-track motion, orange: $z = A\cos nt$). Wherever one crosses the middle line, the other is at a peak or a trough. Over one orbit, the gaps between the tick marks are quarter orbits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="335" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="40" y1="95" x2="40" y2="105"/><line x1="112.5" y1="95" x2="112.5" y2="105"/><line x1="185" y1="95" x2="185" y2="105"/><line x1="257.5" y1="95" x2="257.5" y2="105"/><line x1="330" y1="95" x2="330" y2="105"/></g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,100.0 46.0,94.8 52.1,89.6 58.1,84.7 64.2,80.0 70.2,75.6 76.2,71.7 82.3,68.3 88.3,65.4 94.4,63.0 100.4,61.4 106.5,60.3 112.5,60.0 118.5,60.3 124.6,61.4 130.6,63.0 136.7,65.4 142.7,68.3 148.8,71.7 154.8,75.6 160.8,80.0 166.9,84.7 172.9,89.6 179.0,94.8 185.0,100.0 191.0,105.2 197.1,110.4 203.1,115.3 209.2,120.0 215.2,124.4 221.2,128.3 227.3,131.7 233.3,134.6 239.4,137.0 245.4,138.6 251.5,139.7 257.5,140.0 263.5,139.7 269.6,138.6 275.6,137.0 281.7,134.6 287.7,131.7 293.8,128.3 299.8,124.4 305.8,120.0 311.9,115.3 317.9,110.4 324.0,105.2 330.0,100.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,60.0 46.0,60.3 52.1,61.4 58.1,63.0 64.2,65.4 70.2,68.3 76.2,71.7 82.3,75.6 88.3,80.0 94.4,84.7 100.4,89.6 106.5,94.8 112.5,100.0 118.5,105.2 124.6,110.4 130.6,115.3 136.7,120.0 142.7,124.4 148.8,128.3 154.8,131.7 160.8,134.6 166.9,137.0 172.9,138.6 179.0,139.7 185.0,140.0 191.0,139.7 197.1,138.6 203.1,137.0 209.2,134.6 215.2,131.7 221.2,128.3 227.3,124.4 233.3,120.0 239.4,115.3 245.4,110.4 251.5,105.2 257.5,100.0 263.5,94.8 269.6,89.6 275.6,84.7 281.7,80.0 287.7,75.6 293.8,71.7 299.8,68.3 305.8,65.4 311.9,63.0 317.9,61.4 324.0,60.3 330.0,60.0"/>
  <text x="112.5" y="50" font-size="12" fill="#1d6fd1" text-anchor="middle">radial x peaks</text>
  <text x="345" y="50" font-size="12" fill="#b4232c" text-anchor="end">cross-track z peaks</text>
  <text x="185" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">T/2</text>
  <text x="330" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">T</text>
  <text x="40" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="185" y="175" font-size="12" fill="#1f2a44" text-anchor="middle">blue: x = A sin nt · orange: z = A cos nt</text>
</svg>
```
:::

::: context safety-ellipse Why the tilt is also a safety feature
Look at the tilted loop from the front, along the in-track axis, and you see only $x$ and $z$: $x = A\sin nt$, $z = A\cos nt$. That is a circle of radius $A$ around the target, and it never passes through the center. Radial and cross-track are never both zero at once.

Now suppose some small drift sneaks in, as the warning describes. The chaser slides along in-track — but it slides past the target *around* it, never through it. That is the idea behind the **safety ellipse**, one of the main tools of passive safety in lesson 9.
:::

::: context j2 Earth's bulge
Earth is not a perfect ball. Its spin makes it about 21 km wider at the equator than pole to pole. **$J_2$** is the number that measures that bulge in the gravity field, about $1.083\times10^{-3}$.

The extra pull of the bulge slowly twists every orbit around Earth's axis. Two spacecraft on slightly different orbits get twisted by slightly different amounts. Over days, that difference is enough to break a perfectly set drift-free condition — one reason inspection loops need occasional trims.
:::
