---
id: l07-phasing-rendezvous
title: Phasing manoeuvres and rendezvous phasing
minutes: 18
covers:
  - phasing manoeuvres and rendezvous phasing
---

Picture two runners on a round track, jogging at exactly the same pace. One is a quarter lap behind the other. However long they run, the gap stays a quarter lap. To close it, the runner behind has to change something — run faster for a while, or cut to a shorter lane — and then go back to the old pace at the moment she draws level.

Every maneuver so far in this module changed *where* an orbit is: its size, its shape, its plane, the direction its long axis points. This lesson changes *when* a spacecraft is somewhere along an orbit it already has. That is the runner's problem. A cargo ship chasing the International Space Station, a servicing spacecraft closing on a client satellite, and a new constellation satellite sliding into its assigned slot all start in roughly the right orbit but at the wrong point along it.

The trick is one you have already met in this module without a name: change the orbital period a little, wait, and change it back. A shorter period means more laps per day, so you gain angle on anything still going round at the old rate. A longer period means you lose angle. Get the timing right and you arrive back on the original orbit at the moment the target gets there too.

## Same orbit, wrong place

Put a **chaser** (the spacecraft doing the maneuvering) and a **target** (the one it wants to meet) in the *same* circular orbit of radius $r$. The **period** — the time for one lap — is

$$
T = 2\pi\sqrt{\frac{r^3}{\mu}},
$$

where $\mu$ ("mu") is Earth's gravitational parameter, $3.986 \times 10^5\,\mathrm{km^3/s^2}$.

The target is ahead of the chaser by an angle $\alpha$ ("alpha"), measured around the orbit in the direction of motion. That angle is the **[[phase angle|phase-angle]]** — how far round the circle one spacecraft is from the other.

Both spacecraft sweep round at the same **angular rate** $n = 2\pi/T$, the number of radians covered per second. Same rate, same gap, forever. A single burn cannot fix this without also wrecking the orbit, because any burn changes the orbit's size or shape. So the fix takes several burns.

## Lower is faster

Here is the fact the whole lesson hangs on. By **[[Kepler's third law|lower-is-faster]]**, $T$ grows with $r^{3/2}$. A lower circular orbit has a shorter period. A spacecraft on it laps the Earth more often than one higher up.

So a chaser that drops a little lower starts to *gain* on a target left on the original orbit. A chaser that climbs a little higher starts to *fall behind*.

To get lower, the chaser fires its engine *backward*, against its motion. That feels wrong: you slow down in order to catch up. It is right, and it has **[[fooled real astronauts|slow-down-to-catch-up]]**. Slowing down drops you into a lower orbit, and on a lower orbit you end up both moving faster and running a shorter lap.

## The phasing recipe

The standard way to close a gap has four burns, done as two small Hohmann transfers — the same two-burn transfer from lesson 2, only with a much smaller change of radius. Call each one a **mini-Hohmann**.

1. **Drop (or climb).** A mini-Hohmann moves the chaser from radius $r$ to a nearby circular **phasing orbit** of radius $r_2 = r + \delta r$. Here $\delta r$ ("delta r") is the offset: negative for a lower orbit, positive for a higher one.
2. **Wait.** The chaser coasts on the phasing orbit while the period difference closes the gap.
3. **Return.** A second mini-Hohmann, the first one run backward, brings the chaser back to radius $r$.
4. **Arrive.** Timed right, the chaser reaches the meeting point at the same moment as the target.

The phasing orbit's period, from the same law, is $T_2 = 2\pi\sqrt{r_2^3/\mu}$. Each second, the chaser sweeps $2\pi/T_2$ radians and the target sweeps $2\pi/T$. The difference is the rate at which the gap closes:

$$
\dot{\alpha}_{\text{closed}} = 2\pi\left(\frac{1}{T_2}-\frac{1}{T}\right).
$$

Read $\dot{\alpha}_{\text{closed}}$ as "alpha-dot closed". The dot means "rate of change". It is positive when $r_2 < r$ (the chaser gains) and negative when $r_2 > r$ (the chaser falls behind).

The time needed on the phasing orbit is the gap divided by the rate:

$$
t_{\text{wait}} = \frac{\alpha}{\dot{\alpha}_{\text{closed}}}.
$$

The Δv is twice the cost of one mini-Hohmann. If the first mini-Hohmann has burns $\Delta v_1$ and $\Delta v_2$, the return trip has the same two burns in reverse order and with opposite direction, so

$$
\Delta v_{\text{total}} = 2\big(|\Delta v_1| + |\Delta v_2|\big).
$$

The bars $|\;|$ mean "size of", ignoring the sign. Every burn costs propellant whichever way it points.

::: key Co-orbital phasing
Drop (or raise) to a nearby circular phasing orbit via a small mini-Hohmann, wait for the period difference to close the phase gap $\alpha$ at rate $\dot{\alpha}_{\text{closed}} = 2\pi(1/T_2-1/T)$, then return with the reverse burns. Smaller $|\delta r|$ costs less Δv but takes longer to close the same gap.
:::

::: key How a phasing maneuver works
Change the period so the chaser drifts relative to the target, then restore the original orbit once the phase angle is right. Cost trades against time: a smaller Δv means a slower drift and more revolutions.
:::

::: example Closing a 30° gap in low orbit
Chaser and target share a $6678\,\mathrm{km}$ circular orbit (about $300\,\mathrm{km}$ up). The target leads by $\alpha = 30^\circ$. The chaser drops to a phasing orbit $25\,\mathrm{km}$ lower, $r_2 = 6653\,\mathrm{km}$.

**Step 1: the starting orbit.** Circular speed $v = \sqrt{\mu/r} = \sqrt{398\,600.4/6678} = 7.7258\,\mathrm{km/s}$. Period $T = 2\pi\sqrt{6678^3/398\,600.4} = 5431.0\,\mathrm{s}$, which is $90.52\,\mathrm{min}$.

**Step 2: the mini-Hohmann.** The transfer ellipse has semi-major axis $a_t = (6678 + 6653)/2 = 6665.5\,\mathrm{km}$. By vis-viva, its speed at $6678\,\mathrm{km}$ is $7.7186\,\mathrm{km/s}$ and at $6653\,\mathrm{km}$ it is $7.7476\,\mathrm{km/s}$. The circular speed at $6653\,\mathrm{km}$ is $7.7403\,\mathrm{km/s}$. So

$$
\Delta v_1 = 7.7186 - 7.7258 = -7.248\,\mathrm{m/s}, \qquad \Delta v_2 = 7.7403 - 7.7476 = -7.254\,\mathrm{m/s}.
$$

Both are negative — both burns point backward, as any pair of burns that lowers an orbit must. (The digits shown are rounded; the $\mathrm{m/s}$ values come from the unrounded speeds.)

**Step 3: the drift rate.** The phasing orbit's period is $T_2 = 5400.5\,\mathrm{s}$, about $30.5\,\mathrm{s}$ shorter than $T$. Each lap, the chaser gains $360^\circ \times (1 - T_2/T) = 2.02^\circ$. Per day that is

$$
\dot{\alpha}_{\text{closed}} = 360^\circ \left(\frac{1}{5400.5} - \frac{1}{5431.0}\right) \times 86\,400 = 32.31^\circ/\mathrm{day}.
$$

**Step 4: the wait.** $t_{\text{wait}} = 30/32.31 = 0.929\,\mathrm{days} = 22.3\,\mathrm{h}$ — about $15$ laps of the phasing orbit, since $30/2.02 \approx 15$.

**Step 5: the bill.** $\Delta v_{\text{total}} = 2(7.248 + 7.254) = 29.00\,\mathrm{m/s}$.

**Sanity check.** A $25\,\mathrm{km}$ drop is under half a percent of the radius, so the burns should be tiny next to $7.7\,\mathrm{km/s}$ — and they are. About $29\,\mathrm{m/s}$ for a same-day meeting is a modest, realistic phasing budget.
:::

::: example The same gap, closed twice as fast
Double the offset: $\delta r = -50\,\mathrm{km}$, so $r_2 = 6628\,\mathrm{km}$.

**The burns.** The same steps as before give $\Delta v_1 = -14.529\,\mathrm{m/s}$ and $\Delta v_2 = -14.557\,\mathrm{m/s}$.

**The drift.** $T_2 = 5370.1\,\mathrm{s}$, so the chaser gains $4.04^\circ$ per lap and $\dot{\alpha}_{\text{closed}} = 64.93^\circ/\mathrm{day}$.

**The wait.** $t_{\text{wait}} = 30/64.93 = 0.462\,\mathrm{days} = 11.1\,\mathrm{h}$ — almost exactly half the previous wait.

**The bill.** $\Delta v_{\text{total}} = 2(14.529 + 14.557) = 58.17\,\mathrm{m/s}$ — almost exactly double.

Halving the time doubled the Δv. You have met this exchange twice already: the bi-elliptic transfer (lesson 3) gives up time to save Δv, and the one-tangent transfer (lesson 4) spends Δv to buy time back. Phasing is the same **[[trade between Δv and time|dv-time-trade]]** a third time. Here the knob that sets it is how far you offset the phasing orbit.
:::

::: note Why Δv times wait time stays about the same
For a small offset, both effects are close to straight lines in $\delta r$.

The period: since $T$ grows in proportion to $r^{3/2}$, a small change of radius changes the period by $\frac{\delta T}{T} \approx \frac{3}{2}\frac{\delta r}{r}$. So the drift rate is about $\dot{\alpha}_{\text{closed}} \approx \frac{3}{2}\frac{|\delta r|}{r}\,n$.

The burns: each of the four burns is about $v\,|\delta r|/(4r)$, so all four together cost about $\Delta v_{\text{total}} \approx v\,|\delta r|/r$. (For $\delta r = -25\,\mathrm{km}$ this gives $28.9\,\mathrm{m/s}$, against the exact $29.00$.)

Multiply the bill by the wait, and $\delta r$ cancels:

$$
\Delta v_{\text{total}} \cdot t_{\text{wait}} \approx \frac{v\,|\delta r|}{r} \cdot \frac{\alpha}{\tfrac{3}{2}(|\delta r|/r)\,n} = \frac{2}{3}\,\alpha\,\frac{v}{n} = \frac{2}{3}\,\alpha\,r,
$$

using $v = n r$ for a circular orbit. For $\alpha = 30^\circ = 0.524\,\mathrm{rad}$ and $r = 6678\,\mathrm{km}$ the product is about $2330\,\mathrm{km}$. Check: $0.0290\,\mathrm{km/s} \times 80\,200\,\mathrm{s} = 2330\,\mathrm{km}$, and $0.0582 \times 39\,900 = 2320\,\mathrm{km}$. Double one and you halve the other.

One small correction the simple recipe leaves out: the chaser also gains a little angle during the two transfer half-orbits, about $45$ minutes each. Real mission planning counts that too, and trims the wait to match.
:::

## Choosing which way to phase

The sign of $\delta r$ is not a free choice. It follows from which way the gap runs. If the target is ahead, the chaser must catch up: go lower and faster. If the target is behind, the chaser must wait for it: go higher and slower.

Going the wrong way does not fail gently. It opens the gap wider. Before any burn, check that the sign of $\dot{\alpha}_{\text{closed}}$ matches the sign of the gap you need to close.

Angles also **[[wrap around|long-way-short-way]]** at $360^\circ$. A target "$350^\circ$ ahead" is in the same place as a target "$10^\circ$ behind". So there are always two ways to meet: catch up the long way, or fall back the short way. Compare their Δv and their wait times before assuming that "catch up" has to mean "go lower".

## Keep an eye on the low point

The four-burn recipe is not the only way to phase. Another common version uses only two burns. One burn at the starting point turns the circle into a slightly smaller ellipse with a shorter period. The chaser coasts round that ellipse for several laps, returning to the same point each lap, and a second burn there turns it back into the original circle.

To first order the two versions cost the same for the same drift rate. For the $25\,\mathrm{km}$ case, the two-burn version needs an ellipse with the same semi-major axis, $6653\,\mathrm{km}$, and costs $2 \times 14.53 = 29.06\,\mathrm{m/s}$ against $29.00\,\mathrm{m/s}$.

What differs is the lowest point. The ellipse's low point sits at $2a - r = 6628\,\mathrm{km}$, twice as far down ($50\,\mathrm{km}$) as the circular phasing orbit ($25\,\mathrm{km}$). Close to the atmosphere, that matters. A big offset, or a phasing scheme that tries to close the whole gap in a single lap, can push the low point deep enough for air drag to spoil the plan. So whichever version you fly, check how low the whole path goes, not only the orbit you meant to phase on.

::: warning Phasing gets you to the same point at the same time, not docked
Closing a phase angle brings the chaser and target to the same orbit, at the same place, at the same time — together in the two-body sense this module uses. It says nothing about the final few hundred meters: controlling the closing speed, avoiding a collision, lining up the docking ports. Those need the **[[relative-motion equations|after-phasing]]** of a later module. Phasing is the first, coarse step of a rendezvous, not the whole of it.
:::

::: warning A phasing orbit is still a full orbit
It is tempting to think of the phasing orbit as a brief detour. But the chaser really coasts on it for the whole wait — sometimes dozens of laps for a small $|\delta r|$ and a large gap. Tracking, navigation updates and every other operational task continue the whole time, not only during the four short burns.
:::

In practice, crewed and cargo flights to the ISS now meet the station in **[[a few hours|iss-fast-rendezvous]]** rather than days, by being launched at exactly the right moment and then running a carefully planned series of phasing burns.

## Check yourself

::: check
A target leads a chaser by $10^\circ$ in a shared circular orbit. Which way should the chaser's phasing orbit be offset, and why?
:::

::: answer
Lower, so that it is faster with a shorter period.

The chaser needs to gain $10^\circ$ on the target. That means going round at a higher angular rate than the target for a while. By Kepler's third law, a lower circular orbit has a shorter period, which is a higher angular rate. So the chaser closes the gap while it sits on the lower orbit.
:::

::: check
In this lesson's two worked examples, doubling the size of the offset roughly halved the wait but roughly doubled the total Δv. Explain why both changed, instead of one staying the same.
:::

::: answer
**The wait.** The drift rate $\dot\alpha_{\text{closed}} = 2\pi(1/T_2-1/T)$ grows roughly in proportion to $|\delta r|$ for small offsets, because a bigger radius difference means a bigger period difference. The wait $t_{\text{wait}} = \alpha/\dot\alpha_{\text{closed}}$ is the gap divided by that rate. So doubling the offset roughly halves the wait.

**The Δv.** Each mini-Hohmann burn also grows roughly in proportion to $|\delta r|$ for a small change of radius. Vis-viva is a smooth formula, so a small change of radius gives a proportionally small change of speed. Doubling the offset roughly doubles each burn, and so the total.

Both effects come from the same knob, the offset. They move in opposite directions, and that is exactly the Δv-for-time trade.
:::

::: check
A chaser must close a $45^\circ$ gap within 12 hours. The second worked example ($\delta r = -50\,\mathrm{km}$ on a $6678\,\mathrm{km}$ orbit) had a drift rate of $64.93^\circ/\mathrm{day}$. Is a $-50\,\mathrm{km}$ offset enough? If not, what has to change?
:::

::: answer
At $64.93^\circ/\mathrm{day}$, closing $45^\circ$ takes $45/64.93 = 0.693\,\mathrm{days} = 16.6\,\mathrm{h}$. That is more than the 12 hours allowed, so $-50\,\mathrm{km}$ is not enough.

The offset must grow to raise the drift rate. Closing $45^\circ$ in 12 hours ($0.5\,\mathrm{day}$) needs $45/0.5 = 90^\circ/\mathrm{day}$. The drift rate grows roughly in proportion to the offset, so estimate $50 \times 90/64.93 \approx 69\,\mathrm{km}$. Recomputing the periods exactly gives $\delta r = -69.1\,\mathrm{km}$.

The price is a larger Δv: the exact recomputation gives about $80.5\,\mathrm{m/s}$, against the $58\,\mathrm{m/s}$ of the $-50\,\mathrm{km}$ case.
:::

::: check
Why does the total Δv for a phasing maneuver come from *two* mini-Hohmann transfers rather than one?
:::

::: answer
The chaser has to leave the original orbit (burn down or up onto the phasing orbit) *and* come back to it. It must end up on the same orbit as the target, moving together with it — not crossing the target's radius at some other speed.

Each of those two moves is a small Hohmann-style transfer with two burns, so there are four burns in total. The phasing orbit is circular and the trip back is the trip out in reverse, so the "there" pair and the "back" pair have the same sizes. That is why the total is written $2(|\Delta v_1|+|\Delta v_2|)$ instead of as four separate numbers.
:::

::: check
A mission designer proposes raising the chaser's orbit, even though the target is ahead and the chaser "needs to catch up". When could that be the right call?
:::

::: answer
When the target is almost a full lap ahead. Say it leads by $350^\circ$. Angles wrap around at $360^\circ$, so that is the same as the target being $10^\circ$ *behind*.

Catching up means gaining the full $350^\circ$ by going lower. Raising the orbit instead lets the chaser fall back only $10^\circ$ and meet the target at the same place. Both reach the same meeting point, but falling back $10^\circ$ takes far less time for the same offset, or far less Δv for the same time.

The lesson: compare the Δv and wait time of both directions, instead of assuming that "catch up" always means "go lower".
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\alpha$ | Phase angle: how far the target leads the chaser round a shared circular orbit |
| $T = 2\pi\sqrt{r^3/\mu}$ | Period; lower orbits have shorter periods and gain on higher ones |
| $r_2 = r+\delta r$ | Phasing orbit radius: lower to gain phase, higher to lose it |
| $\dot\alpha_{\text{closed}} = 2\pi(1/T_2-1/T)$ | Rate the gap closes while on the phasing orbit |
| $t_{\text{wait}} = \alpha/\dot\alpha_{\text{closed}}$ | Time needed on the phasing orbit |
| $\Delta v_{\text{total}} = 2(\lvert\Delta v_1\rvert+\lvert\Delta v_2\rvert)$ | Two mini-Hohmanns: onto the phasing orbit and back |
| $\Delta v_{\text{total}}\, t_{\text{wait}} \approx \tfrac{2}{3}\alpha r$ | Small offsets: halve the time, double the Δv |
| $\delta r=-25\,\mathrm{km}$ example | $29.0\,\mathrm{m/s}$ total, closes $30^\circ$ in $22.3\,\mathrm{h}$ |
| $\delta r=-50\,\mathrm{km}$ example | $58.2\,\mathrm{m/s}$ total, closes $30^\circ$ in $11.1\,\mathrm{h}$ — same trade as bi-elliptic and one-tangent |
| Wrap-around | $350^\circ$ ahead is $10^\circ$ behind: check both directions |
| Scope | Brings chaser and target to the same point at the same time; the final approach needs relative-motion methods |

Lessons 1 through 7 treated every burn as instantaneous. The next lesson asks what a burn really costs when it takes minutes, not an instant — the finite-burn losses this module has been setting aside since lesson 1's first rough estimate.

::: context phase-angle Measuring the gap as an angle
On a circle, the natural way to say "how far apart" is an angle measured from Earth's center. The gap is the angle between the line to the chaser and the line to the target, counted in the direction both are moving.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<circle cx="120" cy="100" r="78" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
<circle cx="120" cy="100" r="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
<text x="120" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
<line x1="101.2" y1="106.8" x2="46.7" y2="126.7" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
<line x1="107.1" y1="115.3" x2="69.9" y2="159.8" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
<path d="M74.9,116.4 A48,48 0 0,0 89.1,136.8" fill="none" stroke="#b4232c" stroke-width="2"/>
<text x="68.5" y="137.3" font-size="12" fill="#b4232c" text-anchor="end">α</text>
<circle cx="46.7" cy="126.7" r="6" fill="#f2b880" stroke="#1f2a44"/>
<circle cx="69.9" cy="159.8" r="6" fill="#1d6fd1" stroke="#1f2a44"/>
<text x="36.7" y="120.7" font-size="12" text-anchor="end" fill="#1f2a44">chaser</text>
<text x="59.9" y="173.8" font-size="12" text-anchor="end" fill="#1f2a44">target</text>
<polygon points="179.8,150.1 177.2,161.0 169.5,154.6" fill="#1f2a44"/>
<text x="189.8" y="164.1" font-size="11" fill="#1f2a44">motion</text>
<text x="222" y="70" font-size="12" fill="#1f2a44">Both move round at the</text>
<text x="222" y="86" font-size="12" fill="#1f2a44">same rate, so the gap α</text>
<text x="222" y="102" font-size="12" fill="#1f2a44">never changes by itself.</text>
<text x="222" y="130" font-size="12" fill="#b4232c">α measured in the</text>
<text x="222" y="146" font-size="12" fill="#b4232c">direction of motion</text>
</svg>```

An angle works at any altitude. $30^\circ$ is one twelfth of a lap whether the orbit is $300\,\mathrm{km}$ up or at geostationary height, and the phasing formulas work with angles directly.
:::

::: context lower-is-faster Two reasons a lower lap is shorter
Johannes Kepler found in 1619 that the square of a planet's period grows with the cube of its orbit size. For circles that is $T = 2\pi\sqrt{r^3/\mu}$.

A lower circle wins twice. The lap itself is shorter: dropping $25\,\mathrm{km}$ cuts the circumference by $2\pi \times 25 \approx 157\,\mathrm{km}$. And the spacecraft moves faster, since circular speed $\sqrt{\mu/r}$ rises as $r$ falls — by $14.5\,\mathrm{m/s}$ for that same drop. Shorter path, higher speed: the period falls by $30.5\,\mathrm{s}$ per lap.
:::

::: context slow-down-to-catch-up The puzzle that stumped Gemini 4
In June 1965, the Gemini 4 crew tried to fly close to the spent upper stage of their own rocket. The pilot did what feels natural: he pointed the capsule at it and thrust toward it. Thrusting forward raised their orbit, which slowed their progress round the Earth, and the stage drifted away. After using a lot of fuel, they gave up.

Buzz Aldrin had written his 1963 MIT doctoral thesis on orbital rendezvous. Missions after Gemini 4 flew the counter-intuitive rules, and in December 1965 Gemini 6A met Gemini 7 — the first crewed rendezvous. To catch up, burn backward and drop.
:::

::: context dv-time-trade The whole trade on one curve
Every point on this curve closes the same $30^\circ$ gap from the same $6678\,\mathrm{km}$ orbit. Moving left (faster) climbs the curve (more Δv).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="50.0" y1="170" x2="50.0" y2="175" stroke="#1f2a44"/><text x="50.0" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
<line x1="143.3" y1="170" x2="143.3" y2="175" stroke="#1f2a44"/><text x="143.3" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
<line x1="236.7" y1="170" x2="236.7" y2="175" stroke="#1f2a44"/><text x="236.7" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">40</text>
<line x1="330.0" y1="170" x2="330.0" y2="175" stroke="#1f2a44"/><text x="330.0" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">60</text>
<line x1="45" y1="170.0" x2="50" y2="170.0" stroke="#1f2a44"/><text x="42" y="174.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<line x1="45" y1="123.3" x2="50" y2="123.3" stroke="#1f2a44"/><text x="42" y="127.3" font-size="11" text-anchor="end" fill="#1f2a44">20</text>
<line x1="45" y1="76.7" x2="50" y2="76.7" stroke="#1f2a44"/><text x="42" y="80.7" font-size="11" text-anchor="end" fill="#1f2a44">40</text>
<line x1="45" y1="30.0" x2="50" y2="30.0" stroke="#1f2a44"/><text x="42" y="34.0" font-size="11" text-anchor="end" fill="#1f2a44">60</text>
<text x="192" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">wait time to close 30° (hours)</text>
<text x="14" y="100" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 14 100)">total Δv (m/s)</text>
<polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="329.9,144.8 311.4,143.0 295.2,141.3 280.8,139.5 268.1,137.7 256.7,135.9 246.4,134.1 237.1,132.4 228.6,130.6 220.9,128.8 213.8,127.0 207.3,125.2 201.2,123.4 195.6,121.7 190.5,119.9 185.6,118.1 181.1,116.3 176.9,114.5 172.9,112.7 169.2,110.9 165.7,109.2 162.4,107.4 159.3,105.6 156.3,103.8 153.5,102.0 150.9,100.2 148.3,98.4 145.9,96.7 143.6,94.9 141.5,93.1 139.4,91.3 137.4,89.5 135.5,87.7 133.7,85.9 131.9,84.1 130.2,82.3 128.6,80.6 127.1,78.8 125.6,77.0 124.2,75.2 122.8,73.4 121.5,71.6 120.2,69.8 118.9,68.0 117.7,66.2 116.6,64.4 115.5,62.6 114.4,60.8 113.4,59.1 112.3,57.3 111.4,55.5 110.4,53.7 109.5,51.9 108.6,50.1 107.7,48.3 106.9,46.5 106.1,44.7 105.3,42.9 104.5,41.1 103.8,39.3 103.0,37.5 102.3,35.7 101.6,33.9 100.9,32.1 100.3,30.3 99.6,28.5 99.0,26.7"/>
<circle cx="310.7" cy="143.0" r="4" fill="#b4232c"/>
<text x="318.7" y="137.0" font-size="11" fill="#b4232c">−10 km</text>
<circle cx="154.0" cy="102.3" r="4" fill="#b4232c"/>
<text x="162.0" y="96.3" font-size="11" fill="#b4232c">−25 km</text>
<circle cx="101.7" cy="34.3" r="4" fill="#b4232c"/>
<text x="109.7" y="28.3" font-size="11" fill="#b4232c">−50 km</text>
</svg>```

The curve is close to a hyperbola, Δv × time ≈ constant, which is why halving the time doubles the bill. Mission planners pick a point on it from the fuel they can spare and the deadline they must meet.
:::

::: context long-way-short-way Two ways round the same circle
Angles repeat every $360^\circ$, so any gap can be closed in two directions. Here the target is drawn $30^\circ$ behind the chaser — which is the same as $330^\circ$ ahead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<circle cx="110" cy="100" r="72" fill="none" stroke="#6c7a93" stroke-width="1"/>
<circle cx="110" cy="100" r="18" fill="#8fb8f0" stroke="#1f2a44"/>
<path d="M88.8,20.8 A82,82 0 1,0 131.2,20.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<polygon points="131.9,21.0 141.8,19.0 139.4,27.7" fill="#1d6fd1"/>
<path d="M125.5,42.0 A60,60 0 0,0 94.5,42.0" fill="none" stroke="#b4232c" stroke-width="3"/>
<circle cx="91.4" cy="30.5" r="6" fill="#f2b880" stroke="#1f2a44"/>
<circle cx="128.6" cy="30.5" r="6" fill="#1d6fd1" stroke="#1f2a44"/>
<text x="81.4" y="16.5" font-size="11" text-anchor="end" fill="#1f2a44">chaser</text>
<text x="138.6" y="16.5" font-size="11" fill="#1f2a44">target</text>
<text x="110.0" y="60.0" font-size="11" text-anchor="middle" fill="#b4232c">30°</text>
<text x="215" y="60" font-size="12" fill="#1d6fd1">Catch up 330°:</text>
<text x="215" y="76" font-size="12" fill="#1d6fd1">go lower, a long wait</text>
<text x="215" y="112" font-size="12" fill="#b4232c">Fall back 30°:</text>
<text x="215" y="128" font-size="12" fill="#b4232c">go higher, a short wait</text>
<text x="215" y="164" font-size="12" fill="#1f2a44">Same meeting point.</text>
</svg>```

With the same offset size, the short way takes $30/330$, about one eleventh, of the time. Always ask which way round is cheaper.
:::

::: context after-phasing What comes after phasing
Phasing brings the chaser to within a few kilometers of the target. From there, engineers switch to describing the chaser's motion *relative* to the target, using the Clohessy–Wiltshire equations. You will meet them in the module on relative motion, rendezvous and proximity operations.

The ISS surrounds itself with nested safety zones: a 200-meter "keep-out sphere", inside a larger ellipsoid-shaped zone reaching two kilometers ahead of and behind the station. A visiting vehicle may enter each zone only after ground controllers give the go-ahead.
:::

::: context iss-fast-rendezvous From two days to three hours
For decades, Russian Soyuz and Progress ships took about two days to reach a space station, phasing slowly over dozens of orbits. From 2012, Progress cargo ships began flying a four-orbit plan of about six hours. In October 2020, the Soyuz MS-17 crew docked about three hours after launch.

The secret is mostly the launch time. Launching at the right moment puts the chaser at close to the right phase angle from the start, leaving only a small gap for the phasing burns. SpaceX's Crew Dragon usually takes about a day, because it phases more gently.
:::
