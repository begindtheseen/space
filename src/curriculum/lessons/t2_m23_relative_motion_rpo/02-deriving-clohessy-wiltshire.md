---
id: l02-deriving-clohessy-wiltshire
title: Deriving the Clohessy-Wiltshire equations
minutes: 18
covers:
  - derivation of the Clohessy-Wiltshire equations
---

Sit on a spinning merry-go-round and [[roll a ball straight toward a friend|merry-go-round-ball]] across from you. From where you sit, the ball curves away and misses. Someone standing on the ground sees the ball roll in a perfectly straight line — it is your friend who moved. Nothing pushed the ball sideways. The curve appeared only because you watched from a spinning platform.

The LVLH frame from the previous lesson is that merry-go-round. It turns once per orbit, so it is not inertial, and Newton's second law does not apply to the relative position $\boldsymbol\rho$ as written. Any equation for the chaser's motion in that frame must carry extra terms for the frame's spin. It must also carry a second effect: the target and chaser sit at slightly different distances from Earth, so gravity pulls on them by slightly different amounts.

Untangle both effects and you get one of the most useful equations in orbital mechanics: the **Clohessy-Wiltshire equations**, published in 1960 by [[W. H. Clohessy and R. S. Wiltshire|cw-1960]], a few years before the first crewed rendezvous flights. Every rendezvous guidance system since has used them or their descendants.

This lesson derives them from nothing but Newton's law of gravity and the rules for a turning frame. It goes in two stages. First comes an *exact* equation for relative motion around any orbit. Then comes an *approximation* that assumes a circular reference orbit and a small separation. Keep the two stages apart in your head. Later lessons spend real time on exactly where the second stage stops being good enough.

## Differentiating a vector in a rotating frame

Let $\boldsymbol\rho$ be a vector written with components $(x, y, z)$ along the LVLH axes, which turn with angular velocity $\boldsymbol\omega$.

Two observers watch it change. An observer riding in the frame sees only the three numbers change. Write that rate as $\delta\boldsymbol\rho/\delta t = (\dot x, \dot y, \dot z)$; the curly $\delta$ is a reminder that this is the rate *as seen in the turning frame*. An observer outside, in an inertial frame, sees that too — plus the axes themselves swinging around, carrying the vector with them. That extra piece is $\boldsymbol\omega\times\boldsymbol\rho$, the spin-made velocity you met on the merry-go-round last lesson:

$$
\left(\frac{d\boldsymbol\rho}{dt}\right)_{\!I} = \frac{\delta\boldsymbol\rho}{\delta t} + \boldsymbol\omega\times\boldsymbol\rho.
$$

The little $I$ means "as seen in the inertial frame". This rule works for *any* vector described in a turning frame.

Apply the rule a second time to get the inertial acceleration. The result has four terms:

$$
\left(\frac{d^2\boldsymbol\rho}{dt^2}\right)_{\!I} = \frac{\delta^2\boldsymbol\rho}{\delta t^2} + 2\boldsymbol\omega\times\frac{\delta\boldsymbol\rho}{\delta t} + \dot{\boldsymbol\omega}\times\boldsymbol\rho + \boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho).
$$

Here is what each one means:

- $\delta^2\boldsymbol\rho/\delta t^2 = (\ddot x, \ddot y, \ddot z)$ — the acceleration an observer *in* the turning frame measures. This is the one we want to find.
- $2\boldsymbol\omega\times\delta\boldsymbol\rho/\delta t$ — the **Coriolis** term. It depends on how fast the chaser moves in the frame. It is what curved the ball on the merry-go-round.
- $\dot{\boldsymbol\omega}\times\boldsymbol\rho$ — the **Euler** term. It appears only when the spin rate itself changes.
- $\boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho)$ — the **centrifugal** term. It depends only on position, and points outward from the spin axis.

None of these is a real force. Push on the chaser and nothing pushes back. They are **[[fictitious forces|fictitious-forces]]**: the bookkeeping cost of describing motion from inside a turning frame.

::: note Why it has to be true: the second derivative
Start from the first-derivative rule, $(d\boldsymbol\rho/dt)_I = \delta\boldsymbol\rho/\delta t + \boldsymbol\omega\times\boldsymbol\rho$, and take the inertial rate of change of both terms on the right.

**First term.** $\delta\boldsymbol\rho/\delta t$ is itself a vector written in the turning frame, so the same rule applies to it:

$$
\left(\frac{d}{dt}\frac{\delta\boldsymbol\rho}{\delta t}\right)_{\!I} = \frac{\delta^2\boldsymbol\rho}{\delta t^2} + \boldsymbol\omega\times\frac{\delta\boldsymbol\rho}{\delta t}.
$$

**Second term.** Use the product rule on $\boldsymbol\omega\times\boldsymbol\rho$. The rate of $\boldsymbol\omega$ is $\dot{\boldsymbol\omega}$. The inertial rate of $\boldsymbol\rho$ is the first-derivative rule again:

$$
\left(\frac{d}{dt}(\boldsymbol\omega\times\boldsymbol\rho)\right)_{\!I} = \dot{\boldsymbol\omega}\times\boldsymbol\rho + \boldsymbol\omega\times\left(\frac{\delta\boldsymbol\rho}{\delta t} + \boldsymbol\omega\times\boldsymbol\rho\right).
$$

**Add them.** The term $\boldsymbol\omega\times\delta\boldsymbol\rho/\delta t$ shows up once in each line, which is where the factor of $2$ in the Coriolis term comes from. Everything else appears once, giving the four-term formula above.
:::

## The exact relative equation of motion

Now apply this to $\boldsymbol\rho = \mathbf{r}_c - \mathbf{r}_t$, the chaser's position minus the target's, both measured from Earth's center.

### The left side: what gravity does

In the inertial frame, the relative acceleration is the chaser's acceleration minus the target's. Each one comes from the two-body equation, gravity pulling toward Earth's center:

$$
\ddot{\mathbf{r}}_c - \ddot{\mathbf{r}}_t = -\frac{\mu\,\mathbf{r}_c}{r_c^3} + \frac{\mu\,\mathbf{r}_t}{r_t^3}.
$$

Write this along the LVLH axes. The target is always at $\mathbf{r}_t = r_t\,\hat{\mathbf{x}}$, because that is how $\hat{\mathbf{x}}$ was defined. The chaser is at $\mathbf{r}_c = (r_t+x)\hat{\mathbf{x}} + y\,\hat{\mathbf{y}} + z\,\hat{\mathbf{z}}$. Its distance from Earth's center is

$$
r_c = \lVert\mathbf{r}_c\rVert = \sqrt{(r_t+x)^2+y^2+z^2}.
$$

Put those in, one axis at a time, and the gravity difference becomes

$$
\left(-\frac{\mu(r_t+x)}{r_c^3} + \frac{\mu}{r_t^2},\ \ -\frac{\mu y}{r_c^3},\ \ -\frac{\mu z}{r_c^3}\right).
$$

### The right side: the frame's spin

From the previous lesson, the frame spins about $\hat{\mathbf{z}}$ at the target's true-anomaly rate: $\boldsymbol\omega = \dot\theta\,\hat{\mathbf{z}}$, with $\dot\theta = h_t/r_t^2$.

How fast does that spin rate change? The angular momentum $h_t = r_t^2\dot\theta$ [[never changes|equal-areas]]. Take the rate of change of both sides, using the product rule:

$$
0 = 2r_t\dot r_t\dot\theta + r_t^2\ddot\theta \quad\Longrightarrow\quad \ddot\theta = -\frac{2\dot r_t}{r_t}\,\dot\theta.
$$

Here $\dot r_t$ is how fast the target's distance from Earth changes, and $\ddot\theta$ ("theta double-dot") is how fast the spin rate changes. On a circular orbit $\dot r_t = 0$, so $\ddot\theta = 0$. On an oval orbit it is not zero.

Now work out the three cross products. Every one has $\hat{\mathbf{z}}$ on the left, and crossing $\hat{\mathbf{z}}$ with any vector follows one pattern:

$$
\hat{\mathbf{z}}\times(a,\ b,\ c) = (-b,\ a,\ 0).
$$

Use it three times:

- **Coriolis:** $2\dot\theta\,\hat{\mathbf{z}}\times(\dot x, \dot y, \dot z) = (-2\dot\theta\dot y,\ 2\dot\theta\dot x,\ 0)$.
- **Euler:** $\ddot\theta\,\hat{\mathbf{z}}\times(x, y, z) = (-\ddot\theta y,\ \ddot\theta x,\ 0)$.
- **Centrifugal:** first $\dot\theta\,\hat{\mathbf{z}}\times(x,y,z) = \dot\theta(-y, x, 0)$, then again $\dot\theta\,\hat{\mathbf{z}}\times\dot\theta(-y,x,0) = (-\dot\theta^2 x,\ -\dot\theta^2 y,\ 0)$.

Notice that none of them has anything in the third slot, and none uses $z$. The spin is *about* the $z$ axis, so it swings $x$ and $y$ into each other but never touches $z$.

### Putting the two sides together

Set the four-term acceleration equal to the gravity difference, one axis at a time:

$$
\begin{aligned}
\ddot x - 2\dot\theta\,\dot y - \ddot\theta\,y - \dot\theta^2 x &= -\frac{\mu(r_t+x)}{r_c^3} + \frac{\mu}{r_t^2}, \\
\ddot y + 2\dot\theta\,\dot x + \ddot\theta\,x - \dot\theta^2 y &= -\frac{\mu y}{r_c^3}, \\
\ddot z &= -\frac{\mu z}{r_c^3}.
\end{aligned}
$$

This is **exact**. No approximation has been made. It holds for a chaser at any distance from a target on any two-body orbit, circular or oval. A computer could integrate it directly to follow relative motion without ever converting to absolute positions. It is also the equation the later lesson on eccentric reference orbits comes back to.

::: example Checking the exact equation against truth
**The setup.** A target flies an oval orbit with semi-major axis $a = 7200\,\mathrm{km}$ and eccentricity $e = 0.08$. We look at it $3000\,\mathrm{s}$ after its lowest point. A chaser sits at $\boldsymbol\rho = (0.5,\ -1.2,\ 0.3)\,\mathrm{km}$ — $1.33\,\mathrm{km}$ away — moving at $\dot{\boldsymbol\rho} = (0.5,\ -0.8,\ 0.2)\,\mathrm{m/s}$ in LVLH.

**Truth.** Convert both vehicles to absolute states (as in lesson 1), propagate both orbits with a very accurate integrator a second forward and a second back, convert back to LVLH at each time, and take the second difference. That gives the true relative acceleration in the turning frame:

$$
(\ddot x,\ \ddot y,\ \ddot z)_{\text{truth}} = (-1.6931,\ -7.9969,\ -2.5432)\times10^{-7}\,\mathrm{km/s^2}.
$$

**The target's numbers.** At that moment $r_t = 7775.58\,\mathrm{km}$ and $\dot\theta = 8.8323\times10^{-4}\,\mathrm{rad/s}$. The target is between its low and high points, so it is climbing: $\dot r_t = 0.02111\,\mathrm{km/s}$. Then

$$
\ddot\theta = -\frac{2(0.02111)(8.8323\times10^{-4})}{7775.58} = -4.797\times10^{-9}\,\mathrm{rad/s^2}.
$$

**The formula, radial line.** Move the frame terms to the right: $\ddot x = (\text{gravity}) + 2\dot\theta\dot y + \ddot\theta y + \dot\theta^2 x$. With $r_c = 7776.08\,\mathrm{km}$, the pieces are, in units of $10^{-7}\,\mathrm{km/s^2}$:

- gravity difference: $+8.4806$;
- Coriolis, $2\dot\theta\dot y$: $-14.1317$;
- Euler, $\ddot\theta y$: $+0.0576$;
- centrifugal, $\dot\theta^2 x$: $+3.9005$.

The sum is $-1.6931$.

**The formula, in-track line.** $\ddot y = (\text{gravity}) - 2\dot\theta\dot x - \ddot\theta x + \dot\theta^2 y$. Watch the Euler sign: $\ddot\theta$ is negative, so $-\ddot\theta x = -(-4.797\times10^{-9})(0.5) = +0.0240\times10^{-7}$. The pieces are gravity $+10.1727$, Coriolis $-8.8323$, Euler $+0.0240$ and centrifugal $-9.3612$. The sum is $-7.9969$.

**The formula, cross-track line.** $\ddot z = -\mu z/r_c^3 = -2.5432$.

**Result.** The formula gives $(-1.6931,\ -7.9969,\ -2.5432)\times10^{-7}\,\mathrm{km/s^2}$, matching the truth to five significant figures on every axis. The exact equation is exact. Notice too that the Euler term, though small, was needed: dropping it would change the fourth figure of $\ddot x$.
:::

## Specializing to a circular reference orbit

Now make the first CW assumption: the target's orbit is **circular**. Three things follow at once:

- $r_t$ never changes, so call it $r_0$;
- $\dot\theta$ becomes the constant mean motion $n = \sqrt{\mu/r_0^3}$;
- $\dot r_t = 0$, so $\ddot\theta = 0$ and the Euler terms vanish.

The exact equations become

$$
\begin{aligned}
\ddot x - 2n\dot y - n^2 x &= -\frac{\mu(r_0+x)}{r_c^3} + \frac{\mu}{r_0^2}, \\
\ddot y + 2n\dot x - n^2 y &= -\frac{\mu y}{r_c^3}, \\
\ddot z &= -\frac{\mu z}{r_c^3}.
\end{aligned}
$$

This is *still exact* — nothing about the separation has been assumed yet. What changed is that the left side now has constant numbers in front of every term. That is what will make a clean formula for the solution possible, once the right side is simplified too.

## Linearizing for small separation

The second CW assumption is that the chaser stays **close**: $x$, $y$ and $z$ are all tiny compared with $r_0$. For the ISS, $r_0$ is about $6800\,\mathrm{km}$, and a chaser a kilometer away is a fraction of about $0.00015$.

**Linearizing** means keeping only the terms that are proportional to $x$, $y$ or $z$ themselves, and throwing away anything with two small things multiplied together, like $x^2$ or $xy$. A small number squared is *much* smaller: $0.00015^2$ is about $0.00000002$.

The tool for this is the [[binomial approximation|binomial-approximation]]: for a small number $\varepsilon$ ("epsilon"), $(1 + \varepsilon)^k \approx 1 + k\varepsilon$.

**Step 1: the distance cubed.** Expand the inside first: $(r_0+x)^2 + y^2 + z^2 = r_0^2 + 2r_0 x + x^2 + y^2 + z^2$. The last three terms are second order, so drop them: this is about $r_0^2(1 + 2x/r_0)$. Raise to the power $3/2$ and use the binomial approximation with $k = 3/2$:

$$
r_c^3 \approx r_0^3\left(1+\frac{2x}{r_0}\right)^{3/2} \approx r_0^3\left(1+\frac{3x}{r_0}\right), \qquad \frac{1}{r_c^3}\approx\frac{1}{r_0^3}\left(1-\frac{3x}{r_0}\right).
$$

The last step used the approximation again, with $k = -1$.

**Step 2: the radial gravity term.** Substitute and multiply out:

$$
-\frac{\mu(r_0+x)}{r_c^3}+\frac{\mu}{r_0^2} \approx -\frac{\mu}{r_0^3}(r_0+x)\left(1-\frac{3x}{r_0}\right)+\frac{\mu}{r_0^2}.
$$

The product $(r_0+x)(1-3x/r_0)$ is $r_0 + x - 3x - 3x^2/r_0$. Drop the $x^2$ piece: it is $r_0 - 2x$. So the whole thing is

$$
-\frac{\mu}{r_0^2}+\frac{2\mu x}{r_0^3}+\frac{\mu}{r_0^2} = 2n^2 x,
$$

using $n^2 = \mu/r_0^3$. The two big $\mu/r_0^2$ terms cancel, leaving only the small difference.

**Step 3: the other two gravity terms.** $-\mu y/r_c^3 \approx -n^2 y(1 - 3x/r_0)$. The correction $3x/r_0$ multiplies $y$, so it is two small things multiplied — drop it. That leaves $-n^2 y$. In the same way, $-\mu z/r_c^3 \approx -n^2 z$.

**Step 4: put them back.** Substitute into the circular-orbit equations and collect terms:

$$
\ddot x - 2n\dot y - n^2 x = 2n^2 x \ \Longrightarrow\ \ddot x - 2n\dot y - 3n^2 x = 0,
$$
$$
\ddot y + 2n\dot x - n^2 y = -n^2 y \ \Longrightarrow\ \ddot y + 2n\dot x = 0,
$$
$$
\ddot z = -n^2 z \ \Longrightarrow\ \ddot z + n^2 z = 0.
$$

In the in-track line, the centrifugal $-n^2 y$ and the gravity $-n^2 y$ cancel exactly. That is why $y$ itself does not appear in the CW equations at all — only its rate $\dot y$.

::: key The Clohessy-Wiltshire equations
$$
\ddot x - 3n^2 x - 2n\dot y = 0, \qquad \ddot y + 2n\dot x = 0, \qquad \ddot z + n^2 z = 0,
$$
with $x$ radial (outward), $y$ in-track, $z$ cross-track, and $n = \sqrt{\mu/r_0^3}$ the reference orbit's mean motion. They assume a **circular** reference orbit, separation **small** compared with $r_0$, **two-body** gravity only, and no differential drag or $J_2$ between the two vehicles.
:::

The last assumption needs a word. **Differential drag** is the difference in air drag on the two vehicles; a light, wide chaser feels more drag than a heavy, compact station. **$J_2$** (read "J-two") is the effect of Earth's bulge at the equator on gravity. CW leaves both out.

### Where the 3 comes from

Look at the $3n^2x$ term. It has two sources:

- one $n^2 x$ is the **centrifugal** term, already there before gravity was touched;
- the other $2n^2 x$ comes from linearizing gravity itself.

That second piece is the **[[tidal|tidal-stretch]]**, or **[[gravity-gradient|gravity-gradient-satellites]]**, effect. Gravity is a little weaker farther out and a little stronger closer in. To first order, that difference is *twice* the size of the centrifugal term, not equal to it.

Picture a chaser sitting straight above the target. It feels weaker gravity than the target does. But the frame forces it to go around at the target's turning rate, and holding a bigger circle at the same rate needs *more* pull toward Earth, not less. The mismatch pushes it outward, and $3n^2x$ is the size of that push.

::: warning Do not drop the 3
Writing $n^2x$ instead of $3n^2x$ — keeping only the centrifugal term — is one of the most common slips in a first CW program. It does not produce a slightly wrong answer. It produces a different system. With the correct $3n^2x$, the radial motion swings back and forth exactly once per orbit, as the next lesson shows. With $n^2x$, it swings at $\sqrt{3}$ times the orbit rate, so the relative motion no longer repeats once per orbit and every prediction drifts away from the truth.
:::

::: example Sizing the linearization error
Put the chaser straight above the target, $y = z = 0$, on the reference orbit $r_0 = 6791\,\mathrm{km}$. Compare the exact radial gravity difference with its [[linear version|linear-vs-exact]] $2n^2x$.

**At $x = 1\,\mathrm{km}$.** Exact: $2.5449\times10^{-6}\,\mathrm{km/s^2}$. Linear: $2.5455\times10^{-6}\,\mathrm{km/s^2}$. The difference is $5.62\times10^{-10}\,\mathrm{km/s^2}$, about $0.02\%$ of the term itself.

**At $x = 10\,\mathrm{km}$.** The difference grows to $5.61\times10^{-8}\,\mathrm{km/s^2}$, about $0.22\%$. Ten times the distance, ten times the *percentage* error.

**At $x = 100\,\mathrm{m}$.** About $0.002\%$ — smaller again by ten.

So the percentage error grows in step with $x/r_0$. A closer look gives the exact pattern: it is about $1.5\,x/r_0$. For $1\,\mathrm{km}$: $1.5 \times 1/6791 = 0.00022$, which is $0.022\%$. That matches.

This is the seed of the position errors a later lesson measures directly. A small, steady mismatch in acceleration, added up over time — twice, once to get velocity and once to get position — becomes a position error that grows the longer you wait and the farther out you start.
:::

::: warning Sign convention on the coupling terms
With this module's axes the coupling terms are $-2n\dot y$ in the $\ddot x$ equation and $+2n\dot x$ in the $\ddot y$ equation — opposite signs. Coriolis terms always come in a pair like this, because they turn the velocity sideways rather than speeding it up.

If you write the same sign in both, the system changes character completely. For example, with $\ddot y = +2n\dot x$ the radial equation turns into $\ddot x = 7n^2 x + \text{constant}$, and $x$ grows exponentially — by a factor of about $1.7\times10^{7}$ every orbit. Be aware that the determinant check of the next lesson does *not* catch this: any exact solution of equations shaped like these has determinant $1$. What catches it is comparing against an accurate simulation of the two real orbits, where a runaway like that is impossible to miss.
:::

## Check yourself

::: check
Which of the four terms in the rotating-frame acceleration formula vanishes for a circular reference orbit, and why?
:::

::: answer
Only the Euler term, $\dot{\boldsymbol\omega}\times\boldsymbol\rho$. On a circular orbit $\dot r_t = 0$, so $\ddot\theta = -2\dot r_t\dot\theta/r_t = 0$. The spin $\boldsymbol\omega = n\hat{\mathbf{z}}$ never changes, and a spin that does not change has $\dot{\boldsymbol\omega} = \mathbf{0}$.

The other three — the rotating-frame acceleration itself, Coriolis and centrifugal — all stay.
:::

::: check
Explain, without looking back, why the linearized cross-track equation is $\ddot z + n^2 z = 0$ with no coupling to $x$ or $y$, when the radial equation couples to $\dot y$ and the in-track equation couples to $\dot x$.
:::

::: answer
The Coriolis, Euler and centrifugal terms all come from crossing $\boldsymbol\omega = n\hat{\mathbf{z}}$ with some vector. Crossing $\hat{\mathbf{z}}$ with anything gives a result with no $\hat{\mathbf{z}}$ part, and the $z$ part of the other vector drops out too ($\hat{\mathbf{z}}\times\hat{\mathbf{z}} = \mathbf{0}$). So the frame terms never reach the $z$ equation and never use $z$.

That leaves only gravity, which linearizes to $-n^2 z$. The result is a plain, uncoupled oscillator that swings at the orbit rate.
:::

::: check
A student writes the radial equation as $\ddot x - n^2 x - 2n\dot y = 0$, missing the factor of 3. Physically, what has been left out?
:::

::: answer
The centrifugal piece (one $n^2 x$) is there, but the tidal, or gravity-gradient, piece is missing. That is the fact that gravity itself is weaker above the target ($x > 0$) and stronger below it ($x < 0$).

The tidal piece is $2n^2x$ — twice the centrifugal piece — so the student's coefficient is only one third of the true one. Two thirds of the effect is gone. As the warning above says, this changes the radial swing from once per orbit to $\sqrt{3}$ times per orbit.
:::

::: check
At $x = 5\,\mathrm{km}$, $y = z = 0$, $r_0 = 6791\,\mathrm{km}$, roughly what percentage error would you expect in the linearized radial gravity term $2n^2x$, using the pattern from the worked example?
:::

::: answer
The worked example showed the percentage error is about $1.5\,x/r_0$. Check: at $1\,\mathrm{km}$ that gives $0.022\%$, and at $10\,\mathrm{km}$ it gives $0.22\%$, matching both.

At $5\,\mathrm{km}$: $x/r_0 = 5/6791 = 7.36\times10^{-4}$, so the error is about $1.5 \times 7.36\times10^{-4} = 1.1\times10^{-3}$, or $0.11\%$. That is half the $10\,\mathrm{km}$ value and five times the $1\,\mathrm{km}$ value, as it should be if the error grows in step with $x$.
:::

::: check
Explain why the exact relative-motion equation from this lesson holds for an eccentric reference orbit, even though the Clohessy-Wiltshire equations do not.
:::

::: answer
The exact equation assumed nothing about the target's orbit shape. $r_t$, $\dot\theta$ and $\ddot\theta$ were left free to change with time. The only thing used was that $h_t = r_t^2\dot\theta$ stays constant, which is true for every two-body orbit.

Only the *specializing* step set $r_t = r_0$ and $\dot\theta = n$ as constants. That is true for a circular orbit and false for an oval one. So the physics still holds for an eccentric target; it is the constant-coefficient shortcut that needs a circle.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\delta\boldsymbol\rho/\delta t$ vs $(d\boldsymbol\rho/dt)_I$ | Rate seen in the turning frame vs rate seen from outside; they differ by $\boldsymbol\omega\times\boldsymbol\rho$ |
| Coriolis, Euler, centrifugal | $2\boldsymbol\omega\times\dot{\boldsymbol\rho}$, $\dot{\boldsymbol\omega}\times\boldsymbol\rho$, $\boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho)$ — fictitious terms from the frame's turning |
| $\ddot\theta = -2(\dot r_t/r_t)\dot\theta$ | From $h_t = r_t^2\dot\theta$ staying constant; zero only for a circular reference orbit |
| Exact relative equations | Hold for any two-body reference orbit and any separation |
| Circular specialization | $r_t = r_0$, $\dot\theta = n = \sqrt{\mu/r_0^3}$, $\ddot\theta = 0$ — still exact |
| Linearization | $x, y, z \ll r_0$; $1/r_c^3 \approx (1/r_0^3)(1 - 3x/r_0)$ |
| CW equations | $\ddot x - 3n^2x - 2n\dot y = 0$, $\ddot y + 2n\dot x = 0$, $\ddot z + n^2 z = 0$ |
| CW assumptions | Circular reference, small separation, two-body gravity only, no differential drag or $J_2$ |
| $3n^2x$ | $n^2x$ centrifugal $+$ $2n^2x$ tidal (gravity-gradient) |
| Linearization error | About $1.5\,x/r_0$ of the term: roughly $0.02\%$ at $1\,\mathrm{km}$, $0.22\%$ at $10\,\mathrm{km}$ |

The next lesson solves these three equations exactly and packs the answer into a single $6\times6$ matrix — the state transition matrix — that every later lesson in this module uses to move a relative state forward in time.

::: context merry-go-round-ball The ball that curves without being pushed
Seen from the ground, a ball rolled across a spinning platform goes straight. Seen from the platform, it curves — to the right, when the platform spins counterclockwise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="90" r="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="160" x2="90" y2="20" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="90,20 85,31 95,31" fill="#1d6fd1"/>
  <text x="90" y="176" font-size="11" text-anchor="middle" fill="#1d6fd1">from the ground: straight</text>
  <circle cx="270" cy="90" r="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M270,160 Q272,90 315,35" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="318.1,31.1 315.8,42.1 308.0,35.9" fill="#b4232c"/>
  <text x="180" y="12" font-size="11" text-anchor="middle" fill="#1f2a44">both platforms spin counterclockwise</text>
  <circle cx="270" cy="20" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="236" y="24" font-size="11" fill="#1f2a44">friend</text>
  <text x="270" y="176" font-size="11" text-anchor="middle" fill="#b4232c">from the platform: curves away</text>
</svg>
```

The curve is the Coriolis effect. It is a sketch, not a calculation: how much the path bends depends on how fast the platform spins and how fast the ball rolls.
:::

::: context cw-1960 The paper behind the equations
W. H. Clohessy and R. S. Wiltshire published "Terminal Guidance System for Satellite Rendezvous" in the *Journal of the Aerospace Sciences* in 1960. They wanted simple rules a guidance computer could use in the last stretch of a rendezvous, when the two vehicles are close. The same equations had appeared about eighty years earlier in G. W. Hill's work on the Moon, which is why they are also called Hill's equations. The first crewed rendezvous — Gemini 6A meeting Gemini 7 — came in December 1965.
:::

::: context fictitious-forces Forces you feel but nobody applies
When a car turns sharply, you feel thrown toward the outside door. No one is pushing you. Your body is trying to keep going straight, and the car turns underneath you. From inside the car, it *feels* like a force — that is the centrifugal effect. Engineers call these fictitious (or inertial) forces. They are real enough to spill your drink, but they come from the choice of frame, not from anything touching you. Change to an inertial frame and they disappear.
:::

::: context equal-areas An old law in new clothes
The statement that $r^2\dot\theta$ stays constant is Kepler's second law, found from planet data around 1609: a line from the Sun to a planet sweeps out equal areas in equal times. The area swept per second is $\tfrac12 r^2\dot\theta$. If that stays fixed, then close to the Sun (small $r$) the planet must swing around fast, and far away it must swing slowly. That is exactly why the LVLH frame turns at an uneven rate on an oval orbit.
:::

::: context binomial-approximation Why the shortcut works
For a small $\varepsilon$, $(1+\varepsilon)^k \approx 1 + k\varepsilon$. Try it with numbers: $(1.001)^{1.5} = 1.0015004$, and the shortcut gives $1 + 1.5 \times 0.001 = 1.0015$. The leftover is about $0.0000004$ — roughly the size of $\varepsilon^2$. That is why dropping "two small things multiplied" is safe: each one is a thousand or more times smaller than the terms you keep.
:::

::: context tidal-stretch Why gravity stretches a pair apart
Gravity gets weaker with distance, so three objects stacked above Earth feel different pulls. Seen from the middle one, the top one is pulled up and away and the bottom one is pulled down and away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="198" width="160" height="12" fill="#8fb8f0"/>
  <text x="180" y="208" font-size="11" fill="#1f2a44">toward Earth</text>
  <circle cx="90" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="90" cy="100" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="90" cy="150" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="98" y1="50" x2="98" y2="66" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="98,72 94,64 102,64" fill="#1d6fd1"/>
  <line x1="98" y1="100" x2="98" y2="124" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="98,130 94,122 102,122" fill="#1d6fd1"/>
  <line x1="98" y1="150" x2="98" y2="187" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="98,193 94,185 102,185" fill="#1d6fd1"/>
  <text x="20" y="36" font-size="11" fill="#1d6fd1">pull of gravity</text>
  <circle cx="250" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="250" cy="100" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="250" cy="150" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="250" y1="44" x2="250" y2="34" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="250,28 246,36 254,36" fill="#b4232c"/>
  <line x1="250" y1="156" x2="250" y2="176" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="250,182.4 246,174 254,174" fill="#b4232c"/>
  <text x="262" y="104" font-size="11" fill="#1f2a44">seen from the middle</text>
  <text x="262" y="40" font-size="11" fill="#b4232c">away</text>
  <text x="262" y="180" font-size="11" fill="#b4232c">away</text>
</svg>
```

The blue pulls are drawn for distances of 350, 300 and 250 units from Earth's center (far below the picture), with gravity going as one over distance squared. The red differences on the right are drawn at twice the scale of the blue arrows. The same stretching raises the ocean tides, which is where the name comes from.
:::

::: context gravity-gradient-satellites Satellites that point themselves
The same $3n^2$ tidal stretch acts on a single long spacecraft: its top end is pulled outward and its bottom end inward, relative to its middle. Many early satellites used this on purpose. They carried a long boom with a weight on the end, and the tidal stretch held the boom pointing straight up and down, so the satellite always faced Earth with no fuel spent. It is called **gravity-gradient stabilization**, and the term you just derived is the one doing the work.
:::

::: context linear-vs-exact How good is the straight line?
The solid curve is the exact radial gravity difference; the dashed line is the linear version $2n^2x$. Here $x$ runs out to $\pm 30\%$ of $r_0$ — about $\pm 2040\,\mathrm{km}$, far beyond any rendezvous — so the gap is big enough to see.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="86.1" x2="335" y2="86.1" stroke="#6c7a93" stroke-width="1"/>
  <line x1="185" y1="15" x2="185" y2="192" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="142.8" x2="330" y2="29.4" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6,4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,184.4 52.1,171.3 64.2,159.6 76.2,148.9 88.3,139.2 100.4,130.4 112.5,122.4 124.6,115.0 136.7,108.3 148.8,102.0 160.8,96.3 172.9,91.0 185.0,86.1 197.1,81.6 209.2,77.3 221.2,73.4 233.3,69.7 245.4,66.3 257.5,63.1 269.6,60.1 281.7,57.3 293.8,54.6 305.8,52.1 317.9,49.8 330.0,47.6"/>
  <text x="300" y="100" font-size="11" fill="#1f2a44">x = +0.3 r₀</text>
  <text x="42" y="100" font-size="11" fill="#1f2a44">x = −0.3 r₀</text>
  <text x="196" y="24" font-size="11" fill="#1d6fd1">linear: 2n²x</text>
  <text x="104" y="170" font-size="11" fill="#b4232c">exact</text>
</svg>
```

Near the middle, where rendezvous happens, the two are indistinguishable. At a few kilometers the gap is a small fraction of a percent.
:::
