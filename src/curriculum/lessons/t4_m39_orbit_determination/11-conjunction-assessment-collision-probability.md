---
id: l11-conjunction-assessment-collision-probability
title: Conjunction assessment and collision probability
minutes: 21
covers:
  - Conjunction assessment and collision probability
---

Picture two people walking toward each other across a huge, dark parking lot. Each of them is holding a flashlight you can see from far away, but only roughly — you know where each one is to within a few steps. Will they bump into each other? You cannot say yes or no. What you can say is *how likely* it is. That depends on three things: how close their paths are predicted to pass, how big they are, and how blurry your knowledge of each one is.

Satellites and pieces of space debris are those two walkers. When two objects are predicted to pass close together, that event is called a **conjunction**. Deciding whether it is dangerous is **conjunction assessment**, and its answer is one number, the **collision probability** $P_c$ ("P sub c"). This is the reason an orbit determination team computes an RIC covariance day after day: the previous lesson gave each object's uncertainty a shape, and this lesson turns two of those shapes into $P_c$.

We will derive $P_c$ instead of quoting it. Along the way we meet a real surprise: a *less* certain orbit can report a *lower* risk than a more certain one — the **dilution paradox**. It is the most important thing in this lesson to understand, because misreading it can make a dangerous pass look safe.

## Squashing three dimensions into two: the conjunction plane

Two satellites that meet usually meet fast. In low orbit they typically close at several kilometers per second, often more than ten. The dangerous part of the pass, when they are within a few hundred meters, lasts well under a second. Over that tiny stretch neither orbit has time to curve. So near the **[[time of closest approach|tca]]** (TCA), we can treat the **relative velocity** — how fast and in which direction one object moves as seen from the other — as a constant straight line.

That makes the problem flat. Think of one object sweeping past the other like a thread passing through a window. Moving along the thread does not change whether it hits. Only *where it crosses the window* matters. So we look at the flat window perpendicular to the relative velocity at TCA. That is the **[[conjunction plane|conjunction-plane]]** (also called the encounter plane or B-plane). Inside it we need three things:

- the predicted **miss distance** $d$, the distance between the two objects in that plane at TCA;
- the **[[combined hard-body radius|hard-body]]** $R_{\text{hb}}$ ("R sub h b"), the sum of the two objects' physical radii — if their centers come within $R_{\text{hb}}$, they touch;
- how uncertain the miss vector is, in the plane.

### The combined covariance

A collision depends on where the two objects are *relative to each other*. If object A's position errors and object B's are **[[independent|independent-errors]]**, the uncertainty of their difference is the *sum* of their covariances:

$$
\mathbf P_{\text{comb}}=\mathbf P_A+\mathbf P_B.
$$

Both must be written in the same frame and at the same time (TCA) before you add them.

Then flatten it onto the plane. Let $\mathbf B$ be a $2\times3$ matrix whose two rows are unit vectors at right angles to each other, both perpendicular to the relative-velocity direction $\hat{\mathbf v}_{\text{rel}}$. The covariance in the plane is

$$
\mathbf P_{\text{plane}}=\mathbf B\,\mathbf P_{\text{comb}}\,\mathbf B^\mathsf T,
$$

a $2\times2$ matrix. It describes an uncertainty ellipse in the plane. Its **[[eigenvalues|eigen-axes]]** are the squares of the ellipse's half-widths, $\sigma_{\text{major}}^2$ and $\sigma_{\text{minor}}^2$. In real conjunctions this ellipse is usually long and thin, not round — the in-track cigar from the last lesson, seen from the side.

The exact answer integrates a two-dimensional bell-shaped **[[Gaussian|gaussian-2d]]** probability density, centered on the predicted miss point, over the disc of radius $R_{\text{hb}}$ around the other object. Operational software does exactly this against the full ellipse (the **[[Foster or Akella–Alfriend|foster-akella]]** methods). A common shortcut replaces the ellipse by a circle of the same area, with

$$
\sigma_{\text{eq}}=\sqrt{\sigma_{\text{major}}\,\sigma_{\text{minor}}},
$$

and uses the closed-form circular answer derived below. That formula is exact only when the ellipse really is a circle. The example shows how far off the shortcut can be.

::: key Collision probability
Project the relative position and combined covariance into the conjunction plane perpendicular to the relative velocity, then integrate the 2-D Gaussian over a disc of the combined hard-body radius. In symbols: $\mathbf P_{\text{comb}}=\mathbf P_A+\mathbf P_B$, $\mathbf P_{\text{plane}}=\mathbf B\,\mathbf P_{\text{comb}}\,\mathbf B^\mathsf T$, and $P_c=\iint_{\text{disc}} p(x,y)\,dA$.
:::

::: example Projecting two RIC covariances onto the plane
A well-tracked satellite has RIC position sigmas $(5,\ 40,\ 5)\,\mathrm m$. A poorly tracked piece of debris has $(50,\ 400,\ 30)\,\mathrm m$, in the same frame at TCA. Take all correlations as zero to keep the arithmetic visible.

**Step 1: add the variances.** Square each sigma and add:

- radial: $5^2 + 50^2 = 2525\,\mathrm{m^2}$, so the combined sigma is $50.2\,\mathrm m$;
- in-track: $40^2 + 400^2 = 161\,600\,\mathrm{m^2}$, so $402.0\,\mathrm m$;
- cross-track: $5^2 + 30^2 = 925\,\mathrm{m^2}$, so $30.4\,\mathrm m$.

**Step 2: pick the plane.** Suppose the relative velocity lies in the local horizontal, $60^\circ$ from in-track toward cross-track: $\hat{\mathbf v}_{\text{rel}} = (0,\ \cos60^\circ,\ \sin60^\circ)$ in RIC. Two perpendicular unit vectors across it are $\hat{\mathbf R} = (1,\ 0,\ 0)$ and $(0,\ -\sin60^\circ,\ \cos60^\circ)$. These are the rows of $\mathbf B$.

**Step 3: project.** Along $\hat{\mathbf R}$ the variance stays $2525\,\mathrm{m^2}$. Along the second direction, each variance is weighted by the square of how much of that axis the direction contains ($\sin^2 60^\circ = 0.75$, $\cos^2 60^\circ = 0.25$):

$$
0.75\times161\,600 + 0.25\times925 = 121\,431\,\mathrm{m^2},
$$

a sigma of $348.5\,\mathrm m$. So $\sigma_{\text{minor}} = 50.2\,\mathrm m$ and $\sigma_{\text{major}} = 348.5\,\mathrm m$. The ellipse is about $6.9$ times longer than it is wide, mostly because the in-track uncertainty was so large.

**Step 4: equivalent circle.** $\sigma_{\text{eq}} = \sqrt{50.2 \times 348.5} \approx 132\,\mathrm m$.

**Step 5: does the direction of the miss matter?** Take $d = 300\,\mathrm m$ and $R_{\text{hb}} = 20\,\mathrm m$. The equivalent-circle formula gives $P_c \approx 8.7\times10^{-4}$. A direct numerical integral over the true ellipse gives about $7.7\times10^{-3}$ if the $300\,\mathrm m$ miss lies along the long axis, and about $3.8\times10^{-10}$ if it lies along the short axis.

**Sanity check:** along the long axis, $300\,\mathrm m$ is less than one sigma away — easily reached. Along the short axis it is about six sigmas away — almost impossible. The equivalent circle cannot tell these apart, which is why operational tools integrate the full ellipse.
:::

## The circular collision probability, derived

Now the formula itself, for the round case. Suppose the uncertainty in the plane is a round bell with the same sigma $\sigma$ in every direction. Put the bell's peak at the origin. The other object's hard-body disc sits at distance $d$ from it. The chance of a collision is the amount of the bell that falls inside the disc:

$$
P_c = \int_{\text{disc}} \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{x^2+y^2}{2\sigma^2}\right) dA.
$$

The fraction in front, $\frac{1}{2\pi\sigma^2}$, makes the whole bell hold probability $1$. The exponential makes it fall off with distance from the peak. $dA$ is a tiny patch of area.

Usually the hard body is small compared with $\sigma$: a few meters against hundreds of meters or more. Then the bell is almost flat across the disc, like a hill that looks level over the area of a doormat. So you can use the height at the disc's center for the whole disc. The center is at distance $d$, where the height is $\frac{1}{2\pi\sigma^2}e^{-d^2/(2\sigma^2)}$. The disc's area is $\pi R_{\text{hb}}^2$. Multiply them, and the $\pi$ cancels:

$$
P_c \approx \pi R_{\text{hb}}^2 \times \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{d^2}{2\sigma^2}\right) = \frac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\frac{d^2}{2\sigma^2}\right).
$$

Read it in two pieces. $\frac{R_{\text{hb}}^2}{2\sigma^2}$ compares the target's size with the blur. The exponential is the penalty for how many sigmas away the miss is. Doubling $R_{\text{hb}}$ multiplies $P_c$ by four.

::: key The circular collision probability
$$
P_c \approx \frac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\frac{d^2}{2\sigma^2}\right),
$$
valid in the small-hard-body limit ($R_{\text{hb}}\ll\sigma$): the density at the miss distance, times the disc's area. $\sigma$ is the (round) conjunction-plane position uncertainty; $d$ is the predicted miss distance; $R_{\text{hb}}$ is the sum of the two objects' physical radii.
:::

::: example How good is the small-hard-body shortcut?
Keep the miss distance at $d = 500\,\mathrm m$ and compare the closed form with an exact numerical integral over the whole disc:

```python
# R_hb(m)  sigma(m)  R_hb/sigma   Pc closed form   Pc exact     relative error
#     1       300      0.003        1.385e-06     1.385e-06      1.1e-06
#     5       300      0.017        3.463e-05     3.463e-05      2.7e-05
#    20       300      0.067        5.541e-04     5.544e-04      4.3e-04
#    20       100      0.2          7.453e-08     8.338e-08      1.1e-01
#    50       100      0.5          4.658e-07     8.713e-07      4.7e-01
#    20        40      0.5          1.471e-35     3.318e-34      9.6e-01
```

**Step 1: the easy rows.** While $R_{\text{hb}}/\sigma$ stays below about $0.07$, the shortcut is within $0.05\%$ of the exact answer. That is the everyday case.

**Step 2: the hard rows.** At $R_{\text{hb}}/\sigma = 0.2$ it is $11\%$ low. At $R_{\text{hb}}/\sigma = 0.5$ it is low by a factor of about $1.9$ in one row and about $23$ in the other. The error depends on how far out on the bell the disc sits, too: at $\sigma = 40\,\mathrm m$ the miss is $12.5$ sigmas away, deep in the tail, where the bell's height changes enormously across a $20\,\mathrm m$ disc.

**Sanity check:** in every row the shortcut is *low*, never high. Here the disc sits far out on the bell's tail, where the side nearer the peak is much higher than the center. Using only the center's height misses that extra. So when the hard body is not small against $\sigma$ — a very tight orbit meeting a big object — do the exact integral.
:::

::: warning The shortcut is not always low
It understates $P_c$ only when the disc is far out on the bell, beyond $d = \sqrt2\,\sigma$ where the bell stops curving down and starts curving up. If the predicted miss is very close to the bell's peak ($d$ well under $\sigma$), the same shortcut *overstates* $P_c$ instead: at $d = 0$ the exact answer is $1 - e^{-R_{\text{hb}}^2/(2\sigma^2)}$, which is always a little less than $\frac{R_{\text{hb}}^2}{2\sigma^2}$. Check the regime before you trust the formula.
:::

## The dilution peak

Here is the surprise. Hold $d$ and $R_{\text{hb}}$ fixed and let $\sigma$ vary. Does $P_c$ always grow as we get less certain? No. It rises, reaches a peak, and then falls.

To find the peak, take the natural log of the formula. Logs turn the product into a sum and pull the exponent down:

$$
\ln P_c = 2\ln R_{\text{hb}} - \ln 2 - 2\ln\sigma - \frac{d^2}{2\sigma^2}.
$$

Now take the derivative with respect to $\sigma$. The first two terms are constants, so their derivative is zero. The derivative of $-2\ln\sigma$ is $-2/\sigma$. Write $-\frac{d^2}{2\sigma^2}$ as $-\frac{d^2}{2}\sigma^{-2}$; its derivative is $+\frac{d^2}{\sigma^3}$. At a peak the slope is zero:

$$
\frac{d\ln P_c}{d\sigma} = -\frac{2}{\sigma} + \frac{d^2}{\sigma^3} = 0.
$$

Multiply both sides by $\sigma^3$ to get $-2\sigma^2 + d^2 = 0$, so $\sigma^2 = d^2/2$:

$$
\sigma^{*} = \frac{d}{\sqrt2}.
$$

Read $\sigma^{*}$ as "sigma star". The hard-body radius has vanished. It only ever appeared in the constant $2\ln R_{\text{hb}}$, whose derivative is zero, so the peak's *location* depends on $d$ alone. The peak's *height* comes from putting $\sigma^{*}$ back in: $\frac{R_{\text{hb}}^2}{2\sigma^{*2}} = \frac{R_{\text{hb}}^2}{d^2}$ and $\frac{d^2}{2\sigma^{*2}} = 1$, so

$$
P_c^{\max} = \frac{R_{\text{hb}}^2}{d^2}\,e^{-1}.
$$

That is the largest $P_c$ this miss distance can ever report, however the covariance turns out.

::: example The peak, located and confirmed
Take $d = 500\,\mathrm m$ and $R_{\text{hb}} = 20\,\mathrm m$.

**Step 1: predict.** $\sigma^{*} = 500/\sqrt2 \approx 353.6\,\mathrm m$. The peak height is

$$
P_c^{\max} = \frac{20^2}{500^2}\,e^{-1} = 0.0016 \times 0.3679 \approx 5.89\times10^{-4}.
$$

**Step 2: confirm.** A fine numerical sweep of $\sigma$ finds the maximum at $353.553\,\mathrm m$, matching $500/\sqrt2$ to six figures. The same match holds at $d = 100\,\mathrm m$ ($\sigma^{*} = 70.711\,\mathrm m$) and $d = 2500\,\mathrm m$ ($\sigma^{*} = 1767.767\,\mathrm m$).

**Step 3: sweep widely.** At $d = 500\,\mathrm m$:

```python
# sigma (m)      Pc
#      10.0     about 3e-543 (too small for a computer's normal numbers)
#      31.6      1.03e-55
#     100.0      7.45e-08
#     316.2      5.73e-04
#     353.6      5.89e-04   <- the peak
#    1000.0      1.77e-04
#    3162.3      1.97e-05
#   10000.0      2.00e-06
```

$P_c$ climbs through more than fifty powers of ten on the way up to the peak, then falls steadily. At $\sigma = 10\,\mathrm km$ it has dropped by a factor of about $300$ from the peak.

**Sanity check:** far above the peak, the exponential is nearly $1$, so $P_c \approx R_{\text{hb}}^2/(2\sigma^2)$. For $\sigma = 10\,000\,\mathrm m$ that is $400/(2\times10^8) = 2.00\times10^{-6}$ — the table's last row.
:::

## What the dilution paradox means for a real decision

Why does a peak exist? Growing $\sigma$ does two things at once.

- **It spreads probability outward.** When $\sigma$ is much smaller than $d$, the miss point is many sigmas out, where the bell is almost zero. Widening the bell pushes some probability out to where the disc is. $P_c$ goes up.
- **It thins the probability out.** The bell always holds exactly $1$ in total. Spread it over a bigger area and its height everywhere drops. Past $\sigma^{*}=d/\sqrt2$, this thinning wins, and the height at the disc falls. That is **[[dilution|dilution-curve]]**.

Think of a spoonful of red dye in a glass of water. Right after it goes in, a spot one inch away is clear. Stir a little and that spot turns pink. Keep adding water until the glass is a swimming pool, and the same spot is clear again — not because the dye is gone, but because it is spread over everything.

So a very large $\sigma$ — a poorly known orbit — reports a small $P_c$, not because the pass is safe, but because the analysis does not know where the object is well enough to put much probability *anywhere*, including on the collision.

::: key Probability dilution
Pc is non-monotonic in covariance size: it peaks at an intermediate uncertainty and FALLS for very large covariance, because the probability mass spreads out. A small Pc from a poor solution is not reassurance — it is ignorance. For the circular formula the peak is at $\sigma^{*}=d/\sqrt2$, independent of $R_{\text{hb}}$.
:::

::: warning A small $P_c$ can mean two opposite things
A small $P_c$ comes from two very different situations. One is a precise orbit that confidently predicts a safe miss. The other is a poor orbit that cannot rule out a collision because it cannot rule out much of anything. Always read $\sigma$ next to $P_c$, and compare it with $\sigma^{*}=d/\sqrt2$.

There is a trap on the other side too. The last lesson showed how fast in-track uncertainty grows. A conjunction predicted days ahead, computed with a covariance that has *not* been grown honestly for that much elapsed time, has too *small* a $\sigma$. It sits below the peak, where shrinking $\sigma$ makes $P_c$ smaller, so it reports a dangerously optimistic $P_c$. Reading $P_c$ without reading $\sigma$ is reading half the answer.
:::

This is why operators treat a **[[maneuver threshold|maneuver-threshold]]** on $P_c$ as only a first filter. They also look at the miss distance, the size and shape of the covariance, and how much tracking data went into each orbit, before deciding whether to fire thrusters.

## Check yourself

::: check
Using the derivative $d(\ln P_c)/d\sigma$, explain why the peak location $\sigma^{*}=d/\sqrt2$ does not depend on the hard-body radius $R_{\text{hb}}$.
:::

::: answer
$R_{\text{hb}}$ enters $\ln P_c$ only through the constant term $2\ln R_{\text{hb}}$. That term does not change with $\sigma$, so its derivative with respect to $\sigma$ is zero. The two terms that do depend on $\sigma$, $-2\ln\sigma$ and $-d^2/(2\sigma^2)$, contain only $\sigma$ and $d$. Setting their derivative, $-2/\sigma + d^2/\sigma^3$, to zero and solving never involves $R_{\text{hb}}$. So the peak's location is set by $d$ alone, whatever the size of the objects. (The peak's *height*, $R_{\text{hb}}^2 e^{-1}/d^2$, does depend on $R_{\text{hb}}$.)
:::

::: check
Two conjunctions both have $d = 500\,\mathrm m$ and the same hard-body radius. Conjunction 1 has a combined $\sigma = 50\,\mathrm m$; conjunction 2 has $\sigma = 5000\,\mathrm m$. Without computing $P_c$, say which side of the peak ($\sigma^{*}\approx354\,\mathrm m$) each sits on, and what that means for trusting a low $P_c$ from each.
:::

::: answer
Conjunction 1 ($\sigma = 50\,\mathrm m$) sits well *below* the peak. The orbits are well known, and the miss is $10$ sigmas away. A low $P_c$ here is real good news: we know enough to say the objects will not be in the same small spot.

Conjunction 2 ($\sigma = 5000\,\mathrm m$) sits well *above* the peak — diluted. A low $P_c$ here is not reassuring in the same way. It says the uncertainty is spread so wide that no outcome, a collision included, gets much probability. It does not say a collision has been ruled out.
:::

::: check
Why does the conjunction-plane projection use the *combined* covariance $\mathbf P_A+\mathbf P_B$ rather than either object's covariance alone?
:::

::: answer
A collision depends on the *relative* position of the two objects, $\mathbf r_B - \mathbf r_A$. If each object's position error is an independent random vector, the covariance of their difference is the sum of the two covariances — the same rule as for the difference of any two independent random quantities. Neither covariance alone describes how uncertain the encounter geometry is. A perfectly known satellite meeting badly known debris still has an uncertain miss, and the sum captures that.
:::

::: check
In the small-hard-body example, the shortcut understated $P_c$ by a factor of about $1.9$ at $R_{\text{hb}}/\sigma=0.5$ with $\sigma = 100\,\mathrm m$. Explain, without numbers, why it *understates* rather than overstates there.
:::

::: answer
The shortcut takes the bell's height at the disc's *center* and treats it as constant over the whole disc. With $d = 500\,\mathrm m$ and $\sigma = 100\,\mathrm m$, the disc sits five sigmas out, on the bell's tail. There, the height rises steeply toward the peak and falls away from it, and it rises much faster on the near side than it falls on the far side (the tail curves upward, like the inside of a bowl). So the near side of the disc gains more than the far side loses, and the true average height over the disc is larger than the height at its center. Once the disc is not small, that extra is large, and the shortcut comes out low. (Close to the peak, inside $d = \sqrt2\,\sigma$, the bell curves the other way and the shortcut would come out high instead.)
:::

::: check
A conjunction has $d = 200\,\mathrm m$, $R_{\text{hb}} = 10\,\mathrm m$ and a round combined $\sigma = 100\,\mathrm m$. Compute $P_c$. Where is the dilution peak, and what is the largest $P_c$ this pass could ever report?
:::

::: answer
First the size factor: $\frac{R_{\text{hb}}^2}{2\sigma^2} = \frac{10^2}{2\times100^2} = 0.005$. Then the penalty: $\frac{d^2}{2\sigma^2} = \frac{200^2}{2\times100^2} = 2$, so the exponential is $e^{-2} \approx 0.13534$. Multiply:

$$
P_c \approx 0.005 \times 0.13534 \approx 6.77\times10^{-4}.
$$

The shortcut is safe here, since $R_{\text{hb}}/\sigma = 0.1$ is small.

The peak is at $\sigma^{*} = 200/\sqrt2 \approx 141\,\mathrm m$, so this solution sits a little below it. The largest possible value is

$$
P_c^{\max} = \frac{10^2}{200^2}\,e^{-1} = 0.0025 \times 0.3679 \approx 9.20\times10^{-4}.
$$

Sanity check: $6.77\times10^{-4}$ is less than $9.20\times10^{-4}$, as it must be.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Conjunction, TCA | A predicted close pass; the time of closest approach |
| $\mathbf P_{\text{plane}}=\mathbf B\,(\mathbf P_A+\mathbf P_B)\,\mathbf B^\mathsf T$ | Combined covariance flattened onto the plane perpendicular to the relative velocity at TCA |
| $R_{\text{hb}}$ | Combined hard-body radius, the sum of the two objects' radii |
| $P_c\approx\dfrac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\dfrac{d^2}{2\sigma^2}\right)$ | Round (isotropic) collision probability, small-hard-body limit |
| $R_{\text{hb}}/\sigma$ below about $0.1$ | Where the shortcut is trustworthy; beyond it, integrate exactly |
| $\sigma_{\text{eq}}=\sqrt{\sigma_{\text{major}}\sigma_{\text{minor}}}$ | Equal-area circle for a long ellipse; can be badly wrong, so real tools integrate the ellipse |
| $\sigma^{*}=d/\sqrt2$, $P_c^{\max}=R_{\text{hb}}^2e^{-1}/d^2$ | The dilution peak; its location does not depend on $R_{\text{hb}}$ |
| Dilution paradox | Very uncertain orbits report low $P_c$ for the wrong reason |

Everything here assumed both orbits and their covariances were right. The next lesson asks what happens to that assumption the moment one of the objects maneuvers — on purpose or not — partway through the tracking arc that was supposed to describe it.

::: context tca Finding the moment of closest approach
Screening software first propagates thousands of catalogued objects forward about a week and flags every pair that comes inside a safety box around a protected satellite. For each flagged pair it then searches for the instant when the distance between them stops shrinking and starts growing: there, the relative position is perpendicular to the relative velocity, so their dot product is zero. That instant is the **TCA**, and the distance at that instant is the predicted **miss distance**.
:::

::: context conjunction-plane The window the thread passes through
The relative velocity is a straight thread through the other object's position. The conjunction plane is the window it passes through at right angles. Everything that matters for a hit happens inside that window.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="110,20 290,20 250,150 70,150" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="180" cy="85" rx="75" ry="20" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="180" cy="85" r="3" fill="#1d6fd1"/>
  <circle cx="225" cy="100" r="10" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="180" y1="85" x2="225" y2="100" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="200" y="80" font-size="11" fill="#1f2a44">d</text>
  <line x1="20" y1="120" x2="172" y2="88" stroke="#b4232c" stroke-width="2"/>
  <line x1="188" y1="82" x2="330" y2="52" stroke="#b4232c" stroke-width="2"/>
  <polygon points="340,50 328,46 331,57" fill="#b4232c"/>
  <text x="300" y="42" font-size="11" fill="#b4232c" text-anchor="middle">relative velocity</text>
  <text x="120" y="140" font-size="11" fill="#1f2a44">conjunction plane</text>
  <text x="248" y="118" font-size="11" fill="#b4232c">hard body</text>
  <text x="100" y="60" font-size="11" fill="#1d6fd1">uncertainty ellipse</text>
</svg>
```

The name B-plane is borrowed from interplanetary navigation, where the same flat window is used to aim a spacecraft at a planet.
:::

::: context hard-body Why the radii add
Real satellites have odd shapes — solar panels, antennas. For safety each one is wrapped in an imaginary sphere big enough to hold all of it. Two spheres touch when their centers are closer than the sum of their radii. So you can shrink one object to a point and grow the other by the first one's radius: one disc of radius $R_{\text{hb}} = r_A + r_B$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="60" r="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="70" y1="60" x2="100" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">rA</text>
  <circle cx="115" cy="60" r="15" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="92" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">just touching</text>
  <text x="180" y="64" font-size="18" fill="#1f2a44" text-anchor="middle">=</text>
  <circle cx="270" cy="60" r="45" fill="#fff" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="270" y1="60" x2="315" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="292" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">rA + rB</text>
  <circle cx="315" cy="60" r="3" fill="#b4232c"/>
  <text x="270" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">point meets one bigger disc</text>
</svg>
```
:::

::: context independent-errors Why variances add
If you measure your height with one ruler and your friend's with another, the error in the *difference* of your heights collects both rulers' errors. They do not cancel on average, because they are unrelated. Squared errors — variances — add: $\sigma_{A-B}^2 = \sigma_A^2 + \sigma_B^2$. For vectors, whole covariance matrices add. The rule needs the errors to be independent. Two objects tracked by the same radar with the same bias would break it.
:::

::: context eigen-axes The ellipse hiding inside a 2 by 2 matrix
A $2\times2$ covariance with off-diagonal terms describes a tilted ellipse. Its **eigenvectors** are the directions of the ellipse's long and short axes, and its **eigenvalues** are the variances along them, so their square roots are the half-widths $\sigma_{\text{major}}$ and $\sigma_{\text{minor}}$. Finding them is the same as turning your head until the ellipse looks straight.
:::

::: context gaussian-2d A bell in two directions
The Gaussian, or normal distribution, is the familiar bell curve. In two directions it is a round hill. About $39\%$ of the probability lies within one sigma of the peak and about $86\%$ within two sigmas, which is why a miss many sigmas away is so unlikely. Nearly every orbit determination method in this module assumes errors of this shape, because many small independent errors added together tend to produce it.
:::

::: context foster-akella Who worked out the exact integral
The round formula here is the teaching version. Operational tools integrate the Gaussian over the disc against the full, tilted ellipse. A method by Foster and Estes at NASA's Johnson Space Center, published in the early 1990s, does this numerically. Akella and Alfriend (2000) set out the underlying assumptions — straight-line relative motion and fixed covariance during the brief encounter — and showed how the problem reduces to the two-dimensional integral. Both keep the conjunction-plane picture used in this lesson.
:::

::: context dilution-curve The shape of the paradox
Here is $P_c$ against $\sigma$ for $d = 500\,\mathrm m$, drawn on a log scale for $\sigma$ and as a fraction of the peak value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,140.0 52.0,139.5 64.0,135.5 76.0,120.3 88.0,91.1 100.0,58.3 112.0,35.9 124.0,30.2 136.0,38.2 148.0,53.8 160.0,71.4 172.0,87.7 184.0,101.3 196.0,112.0 208.0,120.0 220.0,125.8 232.0,130.1 244.0,133.0 256.0,135.2 268.0,136.6 280.0,137.7 292.0,138.4 304.0,138.9 316.0,139.2 328.0,139.5 340.0,139.6"/>
  <line x1="122.3" y1="30" x2="122.3" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="130" y="24" font-size="11" fill="#b4232c">peak at d/√2 ≈ 354 m</text>
  <text x="40" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">100 m</text>
  <text x="190" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">1 km</text>
  <text x="340" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">10 km</text>
  <text x="190" y="172" font-size="11" fill="#6c7a93" text-anchor="middle">sigma (log scale)</text>
  <text x="34" y="34" font-size="11" fill="#1f2a44" text-anchor="end">max</text>
  <text x="34" y="144" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="240" y="90" font-size="11" fill="#6c7a93">diluted: less known, less Pc</text>
</svg>
```

Left of the dashed line, knowing less *raises* $P_c$. Right of it, knowing less *lowers* it.
:::

::: context maneuver-threshold How real operators use the number
Many operators plan a collision-avoidance maneuver when $P_c$ rises above about 1 in 10,000 ($10^{-4}$); NASA uses that level for the International Space Station and many of its robotic missions, with extra attention from 1 in 100,000. Real collisions are the reason for the care. On 10 February 2009 the working satellite Iridium 33 and the dead Russian satellite Cosmos 2251 hit each other at about $790\,\mathrm{km}$ altitude, at roughly $11.7\,\mathrm{km/s}$, making thousands of trackable fragments.
:::
