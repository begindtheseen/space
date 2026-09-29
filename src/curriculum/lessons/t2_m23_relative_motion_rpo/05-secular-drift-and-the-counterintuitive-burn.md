---
id: l05-secular-drift-and-the-counterintuitive-burn
title: Secular drift and the counterintuitive burn
minutes: 17
covers:
  - secular in-track drift and why it dominates
---

Set two kitchen clocks side by side. One runs one second a day fast. After a day you can hardly tell. After a year they are six minutes apart, and the gap never closes by itself. A tiny difference in *rate* becomes a large difference in *position*, because it keeps adding up.

Two spacecraft in nearly the same orbit behave the same way. Of everything the CW equations predict, one behavior matters more to a real rendezvous than all the others: some starting states give a relative orbit that stays put, and others give one that walks steadily away, forever. The difference between the two is one short condition. Missing it is not a rounding error. It is the difference between a stable formation and a chaser kilometers off course by the next orbit.

This lesson finds that condition, explains what it means physically, and uses it to explain a result that looks wrong the first time you see it: fire your engine forward, in the direction you are traveling, and you end up *behind*.

## Finding the term that grows forever

Picture a ball bouncing on a moving walkway. The bounce goes up and down, always within the same height — it is **bounded**, meaning it stays within fixed limits. The walkway carries the ball steadily along, farther every second. After a minute the bounce is still small, but the ball is far away. The steady slide wins.

The CW in-track solution from lesson 3 has exactly this shape. Here it is again, with $y$ the in-track position (along the direction of flight), $x$ the radial position (up, away from Earth), a subscript $0$ meaning "at the start", and $n$ the reference orbit's mean motion:

$$
y(t) = 6(\sin nt - nt)\,x_0 + y_0 - \frac{2}{n}(1-\cos nt)\,\dot x_0 + \frac{1}{n}(4\sin nt - 3nt)\,\dot y_0.
$$

Go through it term by term and ask: does this stay bounded as time $t$ grows?

- $\sin nt$ and $\cos nt$ always stay between $-1$ and $1$. Every piece built only from them is a bounce.
- $y_0$ is a constant. It never changes.
- But two pieces contain a bare $nt$, which grows without limit: $-6nt\,x_0$, hiding inside $6(\sin nt - nt)\,x_0$, and $-3t\,\dot y_0$, hiding inside $\tfrac{1}{n}(4\sin nt - 3nt)\,\dot y_0$.

Those two are the walkway. Terms that grow steadily with time, instead of repeating, are called **[[secular|secular-word]]**.

::: key The secular terms
In the CW solution, the secular (steadily growing) terms are $6(\sin nt - nt)\,x_0$ and $-(3t)\,\dot y_0$ in the in-track coordinate $y(t)$ — more exactly, their parts $-6nt\,x_0$ and $-3t\,\dot y_0$. Both grow linearly in time. A radial offset or an in-track velocity offset produces unbounded along-track drift, because it is really a semi-major axis (and therefore period) mismatch.
:::

Collect the two growing pieces into one:

$$
y_{\text{secular}}(t) = -\big(6n x_0 + 3\dot y_0\big)\,t = -3\big(\dot y_0 + 2n x_0\big)\,t.
$$

The second form pulls out the common factor of 3. That one line holds the whole story of long-term relative motion.

- If $\dot y_0 + 2nx_0 = 0$, the bracket is zero. The secular part vanishes, $y(t)$ only bounces, and the relative orbit closes on itself forever with no further thrust.
- If the bracket is not zero, the in-track separation grows in a straight line with time, without limit. Its rate is fixed the moment the starting state is set, and it never shrinks by itself.

::: key The drift-free condition
$$
\dot y_0 = -2n x_0
$$
is necessary and sufficient for a closed (non-drifting) relative orbit under CW. Radial position and in-track velocity trade off exactly: any $x_0$ can be made drift-free by choosing the matching $\dot y_0$. It is exactly the statement that the two vehicles have the same semi-major axis and therefore the same period.
:::

"Necessary and sufficient" means both directions hold: every closed orbit satisfies it, and everything that satisfies it is closed.

## Why: two orbits of different size

The bracket $\dot y_0 + 2nx_0$ is not a random combination. It measures the difference in size between the chaser's orbit and the target's.

The size of an orbit is its **[[semi-major axis|semi-major-axis]]**, written $a$ — half the orbit's longest width, which for a circle is the radius. Write $\delta a$ (read "delta a") for the chaser's semi-major axis minus the target's. Turning a CW starting state into the chaser's real orbit and working out its energy gives

$$
\delta a \approx 4x_0 + \frac{2\dot y_0}{n}.
$$

This matches the exact two-body answer to five significant figures for offsets up to hundreds of meters.

::: note Why it has to be true
Seen from outside, the chaser moves along-track at the target's speed $v_0$, plus its own relative speed $\dot y_0$, plus $nx_0$ — the extra speed it gets from being carried around by the turning frame at a radius $x_0$ farther out. Its distance from Earth is $r_0 + x_0$.

An orbit's energy per kilogram is $\mathcal{E} = v^2/2 - \mu/r$. Change $v$ and $r$ by small amounts and keep only first-order terms:

$$
\delta\mathcal{E} \approx v_0(\dot y_0 + nx_0) + \frac{\mu}{r_0^2}\,x_0 .
$$

On the circular reference orbit, $v_0 = nr_0$ and $\mu/r_0^2 = n^2r_0$. Substitute:

$$
\delta\mathcal{E} \approx nr_0(\dot y_0 + nx_0) + n^2r_0x_0 = nr_0(\dot y_0 + 2nx_0).
$$

Energy and size are tied by $\mathcal{E} = -\mu/(2a)$, so a small change obeys $\delta\mathcal{E} = \mu\,\delta a/(2a^2)$, which gives $\delta a = 2a^2\,\delta\mathcal{E}/\mu$. Put in $a = r_0$ and $\mu = n^2 r_0^3$:

$$
\delta a = \frac{2r_0^2 \cdot nr_0(\dot y_0 + 2nx_0)}{n^2r_0^3} = \frac{2(\dot y_0 + 2nx_0)}{n} = 4x_0 + \frac{2\dot y_0}{n}.
$$

A radial velocity $\dot x_0$ does not appear: it is at right angles to the orbital velocity, so it changes $v^2$ only by the tiny amount $\dot x_0^2$.
:::

Now put $\delta a$ into the secular rate. From the note, $\dot y_0 + 2nx_0 = \tfrac{n}{2}\,\delta a$. So the drift rate is

$$
\dot y_{\text{secular}} = -3(\dot y_0 + 2nx_0) = -\frac{3n}{2}\,\delta a .
$$

One orbit of the target takes $T = 2\pi/n$. Multiply rate by time to get the drift per orbit:

$$
\Delta y_{\text{orbit}} = -\frac{3n}{2}\,\delta a \cdot \frac{2\pi}{n} = -3\pi\,\delta a .
$$

The $n$ cancels. The drift per orbit depends only on the size mismatch.

::: key Drift per orbit from a semi-major axis mismatch
$$
\Delta y \approx -3\pi\,\delta a \ \text{per orbit.}
$$
A $1\,\mathrm{km}$ difference in semi-major axis between chaser and target drifts the chaser nearly $10\,\mathrm{km}$ — $3\pi = 9.4\,\mathrm{km}$ — along-track every single revolution, with no bound and no tendency to self-correct.
:::

This is why the drift-free condition reads the way it does. $\delta a = 0$ means only this: chaser and target orbits are the same size. By **[[Kepler's third law|keplers-third-law]]**, two orbits of the same size have exactly the same period. Equal periods mean the two vehicles go around at the same average rate. Whatever gap they start with, it neither grows nor shrinks on average. What is left is a bounded bounce, from where in the shared orbit each one sits.

Unequal sizes mean unequal periods — two clocks at different rates. The gap between them grows for as long as you let them run, because nothing in the physics pulls the periods back together.

::: example Sizing a drift-free error
A chaser starts $50\,\mathrm{m}$ above the target, $x_0 = 0.050\,\mathrm{km}$. By mistake its in-track velocity is set to zero instead of the drift-free value. Use $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$.

**Step 1: the velocity it should have had.** $\dot y_0 = -2nx_0 = -2 \times 1.1282\times10^{-3} \times 0.050 = -1.128\times10^{-4}\,\mathrm{km/s}$, which is $-0.1128\,\mathrm{m/s}$. Setting it to zero leaves an in-track velocity error of $0.1128\,\mathrm{m/s}$.

**Step 2: the size mismatch.** $\delta a \approx 4x_0 + 2\dot y_0/n = 4 \times 0.050 + 0 = 0.200\,\mathrm{km}$. The chaser's orbit is 200 m bigger than the target's.

**Step 3: the drift.** $\Delta y \approx -3\pi \times 0.200 = -1.885\,\mathrm{km}$ per orbit. The minus sign means backward, behind the target.

**Step 4: in time.** One orbit is $5569\,\mathrm{s}$, about 93 minutes.

**Sanity check.** The chaser sits higher, in a bigger orbit, with a longer period — so it should fall behind. It does. A 50 m mistake, which looked small and purely radial, walks the chaser nearly two kilometers away every 93 minutes. That is a **[[station-keeping|station-keeping]]**-sized error hiding in a small slip.
:::

## The counterintuitive burn

Now test your intuition. Start the chaser exactly on top of the target: $x_0 = y_0 = z_0 = 0$. Fire a small burn **prograde** — in the $+\hat{\mathbf{y}}$ direction, the way both vehicles are traveling. Surely speeding up moves you ahead?

CW says the opposite. The burn gives $\dot y_0 = \Delta v > 0$ with $x_0 = \dot x_0 = 0$. The drift-free condition wants $\dot y_0 = -2nx_0 = 0$, and $\Delta v$ is not zero, so this burn drifts. The secular rate is

$$
-3(\dot y_0 + 2nx_0) = -3\Delta v .
$$

Negative: the chaser slides back in $-y$, *behind* the target, at an average rate three times the size of the burn. Notice there is no $n$ in it. The drift rate does not depend on the orbit's altitude, only on how hard you pushed.

::: example A 5 cm/s forward burn, three ways
Fire $\Delta v = 0.05\,\mathrm{m/s}$ prograde from co-location on the reference orbit.

**Way 1: the CW closed form.** Put $x_0 = y_0 = \dot x_0 = 0$ and $\dot y_0 = 0.05\,\mathrm{m/s}$ into the solution. Only the $\dot y_0$ terms survive:

$$
x(t) = \frac{2}{n}(1 - \cos nt)\,\Delta v, \qquad y(t) = \frac{1}{n}(4\sin nt - 3nt)\,\Delta v .
$$

Here $\Delta v/n = 0.05 / 1.1282\times10^{-3} = 44.32\,\mathrm{m}$. At a quarter orbit, $nt = \pi/2$: $x = 2 \times 44.32 \times 1 = 88.6\,\mathrm{m}$ and $y = 44.32 \times (4 - 3\pi/2) = 44.32 \times (-0.712) = -31.6\,\mathrm{m}$. The same working at the other times gives:

| Orbits elapsed | 0.25 | 0.5 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- | --- |
| $x$ (m) | 88.6 | 177.3 | 0.0 | 0.0 | 0.0 |
| $y$ (m) | $-31.6$ | $-417.7$ | $-835.4$ | $-1670.8$ | $-2506.2$ |

After one orbit the chaser is $835\,\mathrm{m}$ *behind* the target, not ahead. It keeps sliding back at an average $-3\Delta v = -0.15\,\mathrm{m/s}$. On top of the slide rides a bounded bounce, which is why $x$ comes back to zero once per orbit while $y$ keeps going. The path [[hops up and backward, orbit after orbit|hopping-backward]].

**Way 2: full nonlinear truth.** Propagating the chaser's real orbit with exact two-body gravity gives $y = -835.4$, $-1670.9$ and $-2506.3\,\mathrm{m}$ at one, two and three orbits. That is indistinguishable from CW, as lesson 4 predicts for separations under a kilometer.

**Way 3: Kepler alone, no CW at all.** Before the burn the speed is $v_0 = \sqrt{\mu/r_0} = 7.661292\,\mathrm{km/s}$. After it, $v_0 + \Delta v$. The **[[vis-viva equation|vis-viva]]**, $v^2 = \mu(2/r - 1/a)$, turns the new speed into a new semi-major axis: $a_1 = 6791.0886\,\mathrm{km}$. That is $88.6\,\mathrm{m}$ *higher* than the target's. The burn really did raise the orbit.

But a bigger orbit has a longer period. For small changes, $\delta T/T = \tfrac{3}{2}\,\delta a/a = 1.5 \times 0.0886/6791 = 1.958\times10^{-5}$. So the chaser's orbit takes $1.958\times10^{-5} \times 5569.4 = 0.109\,\mathrm{s}$ longer. In one target period the chaser falls short of a full turn by the angle $\delta\theta = -2\pi \times 1.958\times10^{-5} = -1.230\times10^{-4}\,\mathrm{rad}$. As a distance along the orbit, that is $r_0\,\delta\theta = 6791\,\mathrm{km} \times (-1.230\times10^{-4}) = -835.4\,\mathrm{m}$.

**Sanity check.** Three completely different methods give the same $-835.4\,\mathrm{m}$. And $\delta a = 88.6\,\mathrm{m}$ with the key rule gives $-3\pi \times 88.6 = -835\,\mathrm{m}$ too.
:::

Here is the physical story. A prograde burn *does* raise the orbit, exactly as intuition says. What intuition misses is the price of a higher orbit: by Kepler's third law, a longer period, so a slower average turning rate. The target keeps circling at its old rate. The chaser, now on a slightly [[bigger, slower orbit|bigger-slower-orbit]], falls behind a little more every lap.

"Forward" was never in question. The mistake was assuming that a faster *speed* means a faster *turning rate* around Earth. On a higher orbit it means the opposite.

::: warning Prograde does not mean "ahead"
Any burn that raises the semi-major axis — prograde, roughly, though not exactly along $+\hat{\mathbf{y}}$ in general — eventually leaves you behind. Any burn that lowers it eventually leaves you ahead. A retrograde burn drops your orbit, shortens your period, and you gain on the target, ending up ahead of where a "braking means falling back" guess would put you. Before predicting where a burn leaves you after more than an orbit, check the sign of $\delta a$, not the direction of the burn. This exact surprise caught out the [[first astronauts to try it|gemini-4]].
:::

## Why this dominates

Every other effect in this module — sensor noise, small navigation errors, imperfect burns — eventually shows up as some nonzero $\delta a$ between chaser and target. And every nonzero $\delta a$ produces this unbounded drift, at a rate that does not shrink with time or with distance already covered.

Compare two kinds of mistake. A one-off error in position is a fixed, bounded nuisance. A one-off error in velocity that breaks the drift-free condition is a growing one.

This is the whole reason station-keeping exists for anything meant to stay near a target for more than a few orbits. Relative orbits are not unstable the way a pencil balanced on its tip is. Instead, the unpowered motion has exactly one direction with no restoring force at all — in-track drift from a size mismatch — and every real burn has some small execution error that pushes you into it sooner or later.

## Check yourself

::: check
A chaser is $0.2\,\mathrm{km}$ *below* the target ($x_0 = -0.2\,\mathrm{km}$) with $\dot y_0 = 0$. Is this drift-free? If not, what $\dot y_0$ would make it so? Use $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$.
:::

::: answer
Drift-free requires $\dot y_0 = -2nx_0 = -2 \times 1.1282\times10^{-3} \times (-0.2) = +4.513\times10^{-4}\,\mathrm{km/s}$, which is $0.4513\,\mathrm{m/s}$. The actual $\dot y_0$ is $0$, not $0.4513\,\mathrm{m/s}$, so the state is not drift-free. It needs a prograde in-track velocity of $0.4513\,\mathrm{m/s}$ to close the relative orbit. That makes sense: a lower orbit is faster, so the chaser must already be moving forward relative to the target to stay in step.
:::

::: check
For the same state ($x_0 = -0.2\,\mathrm{km}$, $\dot y_0 = 0$), find the sign and size of the secular drift rate. Does the chaser end up ahead of or behind the target?
:::

::: answer
Secular rate $= -3(\dot y_0 + 2nx_0) = -3\big(0 + 2 \times 1.1282\times10^{-3} \times (-0.2)\big) = -3 \times (-4.513\times10^{-4}) = +1.354\times10^{-3}\,\mathrm{km/s}$, which is $+1.354\,\mathrm{m/s}$. Positive: the chaser drifts in $+y$, ahead of the target, without bound. Check with $\delta a$: $4x_0 = -0.8\,\mathrm{km}$, a smaller orbit, so a shorter period, so it pulls ahead. The signs agree.
:::

::: check
Fire a *retrograde* ($-y$) burn of $0.05\,\mathrm{m/s}$ from co-location instead of the prograde one in the worked example. Where is the chaser after one orbit?
:::

::: answer
The secular rate $-3\dot y_0$ is proportional to $\dot y_0$, and so is every other term that survives. Flipping the sign of the burn flips the sign of the whole motion: $y(T) \approx +835\,\mathrm{m}$. The chaser ends up *ahead* by the same distance the prograde burn left it behind. That fits the physics: a retrograde burn lowers the orbit, shortens the period, and lets the chaser out-pace the target.
:::

::: check
The drift rate from a pure in-track velocity error, $-3\dot y_0$, has no $n$ in it. The drift rate from a pure radial offset, $-6nx_0$, does. Explain why, using $\delta a$.
:::

::: answer
Both come from $\dot y_{\text{secular}} = -\tfrac{3n}{2}\,\delta a$, so a bigger $n$ (a lower, faster orbit) turns a given size mismatch into faster drift.

For an in-track velocity error, $\delta a = 2\dot y_0/n$. The same speed kick changes the orbit's size *more* on a slow, high orbit (small $n$). Multiply: $-\tfrac{3n}{2} \times \tfrac{2\dot y_0}{n} = -3\dot y_0$. The two effects of $n$ cancel exactly.

For a radial offset, $\delta a = 4x_0$, with no $n$ in it — sitting 50 m higher makes your orbit 200 m bigger on any orbit. Nothing cancels the $n$: $-\tfrac{3n}{2} \times 4x_0 = -6nx_0$.
:::

::: check
Two chasers each have $\delta a = +0.5\,\mathrm{km}$ relative to their own targets. One target is on this module's reference orbit ($r_0 = 6791\,\mathrm{km}$, period 92.8 min). The other orbit has a radius four times as large. Which chaser drifts away faster in meters per *hour*?
:::

::: answer
Drift per orbit is $-3\pi\,\delta a$, which depends only on $\delta a$. Both drift $-3\pi \times 0.5 = -4.712\,\mathrm{km}$ per orbit.

But periods differ. By Kepler's third law $T \propto a^{3/2}$, so four times the radius gives $4^{3/2} = 8$ times the period: $8 \times 1.547\,\mathrm{h} = 12.38\,\mathrm{h}$.

Per hour: the reference-orbit chaser drifts $4.712 / 1.547 = 3.05\,\mathrm{km/h}$; the high one drifts $4.712 / 12.38 = 0.381\,\mathrm{km/h}$. The low-orbit chaser drifts away eight times faster in time, while losing the same distance per lap.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Secular terms $6(\sin nt - nt)x_0$ and $-(3t)\dot y_0$ | The parts of $y(t)$ that grow linearly in time without bound |
| $y_{\text{secular}}(t) = -3(\dot y_0+2nx_0)\,t$ | The two growing pieces combined |
| $\dot y_0=-2nx_0$ | Drift-free condition: closed relative orbit, same semi-major axis, same period |
| $\delta a \approx 4x_0+2\dot y_0/n$ | Semi-major axis mismatch implied by a CW starting state |
| $\Delta y \approx -3\pi\,\delta a$ | Drift per orbit; $1\,\mathrm{km}$ of $\delta a$ gives about $9.4\,\mathrm{km}$ per orbit |
| Prograde burn from co-location | Raises $a$ (confirmed by vis-viva), lengthens the period; chaser ends up **behind** |
| Retrograde burn from co-location | Lowers $a$, shortens the period; chaser ends up **ahead** |
| Drift rate from $\dot y_0$ alone | $-3\dot y_0$, independent of $n$ |
| Drift rate from $x_0$ alone | $-6nx_0$, proportional to $n$ |

The next lesson uses the drift-free condition on purpose. Instead of avoiding drift, it builds closed relative orbits deliberately — the football orbit and its three-dimensional cousin, natural motion circumnavigation — and shows exactly which burn gives a closed loop and which gives the drift explained here.

::: context secular-word An astronomer's word for "slow and steady"
**Secular** comes from the Latin *saeculum*, an age or a century. Astronomers used it for changes in the sky so slow that they only showed up over centuries — like the slow turning of Earth's axis — as opposed to **periodic** changes that repeat, like the seasons.

The word stuck in orbital mechanics for any effect that keeps growing instead of repeating. Here the "century" is only an orbit or two, but the idea is the same: a small steady trend beats a big wobble in the long run.
:::

::: context semi-major-axis Half the long way across
An ellipse has a long axis and a short one. Half the long one is the **semi-major axis**, $a$ — "semi" means half, "major" means bigger. For a circle both axes are the same, and $a$ is the radius.

It is the single number that sets an orbit's energy and period. It is also the average of the orbit's highest and lowest distances from Earth's center. That is why "same semi-major axis" is the right way to say "same size of orbit", even when one orbit is a circle and the other is a slightly stretched oval.
:::

::: context keplers-third-law Bigger orbits take longer
Johannes Kepler found in 1619 that a planet's period squared is proportional to its orbit size cubed. Newton later explained why. For an orbit around Earth:

$$
T = 2\pi\sqrt{\frac{a^3}{\mu}} .
$$

A small change in size gives $\delta T/T = \tfrac{3}{2}\,\delta a/a$: make the orbit 1% bigger and the lap takes 1.5% longer. The extra distance around is only part of it. A higher orbit also moves *slower*, because gravity there is weaker and needs less speed to balance.
:::

::: context station-keeping Staying put costs fuel
**Station-keeping** means small, regular burns to hold a spacecraft at a chosen spot — here, a chosen place relative to the target. The word comes from ships holding their place in a convoy.

A vehicle parked 250 m behind a space station on the station's own orbit sits there for free in the ideal CW world. In the real one, small differences in drag and burn errors keep creating a tiny $\delta a$. Left alone, the drift in this lesson would carry it off, so the guidance system watches the drift and trims it with small burns.
:::

::: context hopping-backward The path of a forward burn
The path of the 5 cm/s prograde burn over three orbits, as seen from the target. Flight direction is to the left, "up" is away from Earth. The chaser first creeps forward a little, rises, then falls back: one hop per orbit, each 835 m farther behind. The vertical is stretched about five times to show the hop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="345" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,150.0 39.0,148.9 38.1,145.7 37.6,140.5 37.6,133.5 38.3,125.0 39.8,115.5 42.2,105.2 45.4,94.8 49.5,84.6 54.5,75.0 60.2,66.6 66.6,59.6 73.5,54.3 80.8,51.1 88.3,50.0 95.8,51.1 103.1,54.3 110.1,59.6 116.5,66.6 122.2,75.0 127.2,84.6 131.3,94.8 134.5,105.2 136.8,115.5 138.3,125.0 139.0,133.5 139.1,140.5 138.6,145.7 137.7,148.9 136.7,150.0 135.6,148.9 134.8,145.7 134.3,140.5 134.3,133.5 135.0,125.0 136.5,115.5 138.8,105.2 142.0,94.8 146.2,84.6 151.1,75.0 156.9,66.6 163.3,59.6 170.2,54.3 177.5,51.1 185.0,50.0 192.5,51.1 199.8,54.3 206.7,59.6 213.1,66.6 218.9,75.0 223.8,84.6 228.0,94.8 231.2,105.2 233.5,115.5 235.0,125.0 235.7,133.5 235.7,140.5 235.2,145.7 234.4,148.9 233.3,150.0 232.3,148.9 231.4,145.7 230.9,140.5 231.0,133.5 231.7,125.0 233.2,115.5 235.5,105.2 238.7,94.8 242.8,84.6 247.8,75.0 253.5,66.6 259.9,59.6 266.9,54.3 274.2,51.1 281.7,50.0 289.1,51.1 296.4,54.3 303.4,59.6 309.8,66.6 315.5,75.0 320.5,84.6 324.6,94.8 327.8,105.2 330.2,115.5 331.6,125.0 332.3,133.5 332.4,140.5 331.9,145.7 331.0,148.9 330.0,150.0"/>
  <circle cx="40" cy="150" r="5" fill="#b4232c"/>
  <text x="40" y="170" font-size="12" fill="#b4232c" text-anchor="middle">target</text>
  <text x="136.7" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">835 m</text>
  <text x="233.3" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">1671 m</text>
  <text x="330" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">2506 m</text>
  <text x="185" y="42" font-size="11" fill="#1f2a44" text-anchor="middle">177 m up</text>
  <text x="20" y="22" font-size="12" fill="#1f2a44">← direction of flight</text>
  <text x="190" y="192" font-size="12" fill="#1f2a44" text-anchor="middle">distance behind the target after 1, 2, 3 orbits</text>
</svg>
```
:::

::: context vis-viva The "living force" equation
**Vis viva** is Latin for "living force", an old name, from the late 1600s, for what we now call (twice) kinetic energy. The vis-viva equation is energy conservation for an orbit, rearranged:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right).
$$

Give it your distance $r$ and speed $v$ and it hands back the orbit's size $a$. That is why it is the quickest way to see what a burn does: a burn changes $v$ in an instant while $r$ stays the same, so $a$ must change.
:::

::: context bigger-slower-orbit Higher, bigger, slower
The prograde burn, hugely exaggerated. The target stays on its circle (gray). The chaser burns at the top and moves onto a bigger oval (blue) whose lowest point is the burn point. The bigger oval takes longer to go round, so each time the chaser comes back to the top, the target has already passed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="105" r="70" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <ellipse cx="180" cy="114.55" rx="78.97" ry="79.55" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="180" cy="105" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="109" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <circle cx="180" cy="35" r="4.5" fill="#b4232c"/>
  <line x1="176" y1="35" x2="140" y2="35" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="134,35 144,30 144,40" fill="#b4232c"/>
  <text x="130" y="22" font-size="12" fill="#b4232c" text-anchor="end">prograde burn here</text>
  <text x="12" y="62" font-size="12" fill="#6c7a93">target's circle</text>
  <text x="12" y="77" font-size="12" fill="#6c7a93">period T</text>
  <text x="266" y="150" font-size="12" fill="#1d6fd1">chaser's bigger</text>
  <text x="266" y="165" font-size="12" fill="#1d6fd1">orbit: longer</text>
  <text x="266" y="180" font-size="12" fill="#1d6fd1">period</text>
</svg>
```

The real difference in this lesson's example is 88.6 m on a 6791 km orbit — about a thousandth of a pixel here.
:::

::: context gemini-4 The rendezvous that went backwards
In June 1965, Gemini 4 tried to fly alongside the spent upper stage of its own Titan II rocket. Pilot Jim McDivitt did the natural thing: pointed at the stage and thrusted toward it. The stage drifted away and below instead. After using a large share of the maneuvering propellant, the attempt was called off.

The fix was theory, not better piloting: later crews flew rendezvous with procedures and onboard calculations built on orbital mechanics. Gemini 6A met Gemini 7 in December 1965, the first rendezvous in orbit. Buzz Aldrin, whose 1963 MIT doctoral thesis was on guidance for manned orbital rendezvous, earned the nickname "Dr. Rendezvous".
:::
