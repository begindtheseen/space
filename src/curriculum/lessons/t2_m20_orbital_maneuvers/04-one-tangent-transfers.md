---
id: l04-one-tangent-transfers
title: One-tangent transfers
minutes: 18
covers:
  - one-tangent burns
---

Think about a city bus that runs once a day. It is the cheapest ticket in town, but it leaves when it leaves and arrives when it arrives. If you have to be across town by a certain time, the cheap bus may not get you there. You pay for a taxi instead: more money, and in exchange you choose when you arrive.

The Hohmann transfer from lesson 2 is that cheap bus. Pick the starting radius and the target radius, and everything else is decided for you: both burns, and the flight time. From low Earth orbit to geostationary orbit the flight takes 5.275 hours, no more and no less. Often that is fine. But real missions sometimes have a second requirement. You might need to [[meet another spacecraft|rendezvous-in-practice]] that will be at a certain spot at a certain time. Or a launch window might close before a five-hour coast could even get you there.

A **one-tangent transfer** is the taxi. It keeps the cheap, tangential departure burn from Hohmann, but gives up the tangential arrival. That costs extra Δv. In exchange you get a dial you can turn to set the arrival time. This lesson builds that transfer step by step, measures how fast the price rises as you turn the dial, and uses it to check lesson 2's claim that Hohmann is the cheapest two-burn transfer.

## What made Hohmann cheap, and what we give up

Recall why the Hohmann transfer is so cheap. At both burns, the transfer ellipse is moving in exactly the same direction as the circular orbit. It is **[[tangent|tangent-word]]** to both circles — it touches each circle at one point, the way a car tire touches the road. So each burn only changes speed. None of the Δv is spent turning the velocity.

A one-tangent transfer keeps the first of those two touches and lets go of the second. The departure is still tangent. The arrival is not: the spacecraft reaches the target orbit at an angle, cutting across it rather than touching it. That is where the name comes from — one tangent point instead of two.

## Building the one-tangent transfer

We will go from a circular orbit of radius $r_1$ out to a circular orbit of radius $r_2$. The whole design comes down to one choice.

### Step 1: choose an apoapsis past the target

In a Hohmann transfer, the far point of the transfer ellipse — its **apoapsis** — lands exactly on the target radius $r_2$. Here, we instead pick an apoapsis radius $r_a$ that is *bigger* than $r_2$. We **[[overshoot|overshoot-picture]]** on purpose.

Because the ellipse reaches farther out, the spacecraft passes the radius $r_2$ while it is still climbing, before it gets to apoapsis. It gets there sooner. That early crossing is where we will make the arrival burn.

Once $r_a$ is chosen, the transfer ellipse is completely fixed. The departure point $r_1$ is its periapsis (the near point) and $r_a$ is its apoapsis, so

$$
a_t = \frac{r_1+r_a}{2}, \qquad e = \frac{r_a-r_1}{r_a+r_1}, \qquad p = a_t(1-e^2).
$$

Here $a_t$ ("a sub t") is the **semi-major axis** of the transfer ellipse — half its longest width. The eccentricity $e$ says how stretched it is ($0$ is a circle, close to $1$ is a long thin ellipse). The **semi-latus rectum** $p$ is a length that sets the ellipse's size in the orbit equation you met in the last module.

### Step 2: the departure burn

The departure is exactly as in Hohmann. The burn points straight along the circular velocity and only raises the speed. The new speed is the speed at periapsis of the transfer ellipse, from the vis-viva equation:

$$
\Delta v_1 = \sqrt{\mu\left(\frac{2}{r_1}-\frac{1}{a_t}\right)} - \sqrt{\frac{\mu}{r_1}}.
$$

Read $\mu$ as "mu": Earth's gravitational parameter, $398\,600.4418\,\mathrm{km^3/s^2}$.

### Step 3: find where the ellipse crosses the target circle

The spacecraft reaches radius $r_2$ at some point along the ellipse. We describe that point by its **true anomaly** $\nu_2$ ("nu sub two") — the angle swept around Earth from periapsis. The orbit equation says

$$
r = \frac{p}{1+e\cos\nu}.
$$

Set $r = r_2$ and solve for the cosine:

$$
r_2 = \frac{p}{1+e\cos\nu_2} \quad\Longrightarrow\quad 1 + e\cos\nu_2 = \frac{p}{r_2} \quad\Longrightarrow\quad \cos\nu_2 = \frac{p/r_2 - 1}{e}.
$$

The inverse cosine gives an angle between $0^\circ$ and $180^\circ$. That is the crossing on the way *up*, before apoapsis, which is the one we want for arriving early.

### Step 4: the tilt at arrival

At the crossing, the speed on the transfer ellipse comes from vis-viva as always:

$$
v_2 = \sqrt{\mu\left(\frac{2}{r_2}-\frac{1}{a_t}\right)}.
$$

But the direction is new. Away from the apses, an orbit's velocity is not level. It tilts upward while the spacecraft climbs. That tilt, measured from the local horizontal, is the **[[flight-path angle|fpa-reminder]]** $\gamma$ ("gamma"). From the orbit-equation lesson of the last module,

$$
\gamma_2 = \arctan\!\left(\frac{e\sin\nu_2}{1+e\cos\nu_2}\right).
$$

The target orbit is a circle, and on a circle the velocity is always level. So the arrival burn has to do two jobs at once: change the speed from $v_2$ to the circular speed, and swing the direction down through the angle $\gamma_2$.

### Step 5: the arrival burn

A burn that changes both speed and direction is the combined burn from lesson 1. Draw the old velocity and the new velocity as two arrows from the same point, with the angle $\gamma_2$ between them. The burn is the third side of that triangle, and the law of cosines gives its length:

$$
\Delta v_2 = \sqrt{v_2^2 + v_{2,\text{circ}}^2 - 2\,v_2\,v_{2,\text{circ}}\cos\gamma_2}, \qquad v_{2,\text{circ}} = \sqrt{\frac{\mu}{r_2}}.
$$

Read $v_{2,\text{circ}}$ as "v two circ": the circular speed at the target radius.

### Step 6: the time of flight

The spacecraft does not sweep out true anomaly at a steady rate. It moves fast near periapsis and slowly far out. So to turn the angle $\nu_2$ into a time, we use the [[Kepler's-equation chain|kepler-chain]] from the last module. First find the **eccentric anomaly** $E_2$:

$$
\tan\frac{E_2}{2} = \sqrt{\frac{1-e}{1+e}}\,\tan\frac{\nu_2}{2}.
$$

Then the **mean anomaly** $M_2$, which *does* grow at a steady rate:

$$
M_2 = E_2 - e\sin E_2 \quad (\text{in radians}).
$$

The steady rate is the **mean motion** $n = \sqrt{\mu/a_t^3}$, in radians per second. The time from departure to arrival is

$$
t = \frac{M_2}{n}.
$$

::: key One-tangent transfer
Departure stays tangential at $r_1$; the transfer orbit's apoapsis $r_a > r_2$ is a free design parameter. Arrival is non-tangential, at flight-path angle $\gamma_2 = \arctan\!\big(e\sin\nu_2/(1+e\cos\nu_2)\big)$, costing $\Delta v_2 = \sqrt{v_2^2+v_{2,\text{circ}}^2-2v_2v_{2,\text{circ}}\cos\gamma_2}$. As $r_a \to r_2$, $\gamma_2 \to 0$ and the transfer reduces to Hohmann.
:::

::: example A modest one-tangent transfer, LEO to GEO
Go from $r_1 = 6678\,\mathrm{km}$ to $r_2 = 42\,164\,\mathrm{km}$. Choose $r_a = 1.05\,r_2 = 44\,272.2\,\mathrm{km}$ — an overshoot of only $5\%$.

**The ellipse.** $a_t = (6678 + 44\,272.2)/2 = 25\,475.1\,\mathrm{km}$. $e = (44\,272.2 - 6678)/(44\,272.2 + 6678) = 37\,594.2/50\,950.2 = 0.7379$. $p = 25\,475.1 \times (1 - 0.7379^2) = 11\,605.4\,\mathrm{km}$.

**Departure.** Vis-viva at periapsis:

$$
v_p = \sqrt{398\,600.4418 \times \left(\frac{2}{6678} - \frac{1}{25\,475.1}\right)} = \sqrt{103.73} = 10.1848\,\mathrm{km/s}.
$$

The circular speed at $6678\,\mathrm{km}$ is $7.7258\,\mathrm{km/s}$, so $\Delta v_1 = 10.1848 - 7.7258 = 2.4590\,\mathrm{km/s}$. That is barely more than Hohmann's $2.4258\,\mathrm{km/s}$ — a slightly bigger ellipse needs a slightly harder push.

**The crossing.** $p/r_2 = 11\,605.4/42\,164 = 0.27525$. So $\cos\nu_2 = (0.27525 - 1)/0.7379 = -0.98224$, and $\nu_2 = 169.18^\circ$. That is only about $11^\circ$ short of apoapsis at $180^\circ$ — sensible for such a small overshoot.

**The tilt.** $\sin\nu_2 = 0.18765$, so $e\sin\nu_2 = 0.13846$. The bottom, $1 + e\cos\nu_2$, is $p/r_2 = 0.27525$ from the step above. So $\tan\gamma_2 = 0.13846/0.27525 = 0.50303$ and $\gamma_2 = 26.70^\circ$.

**Arrival speeds.** On the ellipse, $v_2 = \sqrt{398\,600.4418 \times (2/42\,164 - 1/25\,475.1)} = 1.8057\,\mathrm{km/s}$. The circular speed at GEO is $3.0747\,\mathrm{km/s}$.

**Arrival burn.** Square the two speeds, using one more digit: $1.80568^2 = 3.2605$ and $3.07467^2 = 9.4536$. The cross term is $2 \times 1.8057 \times 3.0747 \times \cos 26.70^\circ = 9.9194$. So

$$
\Delta v_2 = \sqrt{3.2605 + 9.4536 - 9.9194} = \sqrt{2.7946} = 1.6717\,\mathrm{km/s}.
$$

Hohmann's arrival burn is $1.4668\,\mathrm{km/s}$. This one is noticeably bigger, because it also has to turn the velocity by almost $27^\circ$.

**Total.** $2.4590 + 1.6717 = 4.1307\,\mathrm{km/s}$, against Hohmann's $3.8926\,\mathrm{km/s}$: $6.1\%$ more.

**Time of flight.** $\sqrt{(1-e)/(1+e)} = 0.38838$ and $\tan(\nu_2/2) = 10.5637$, so $\tan(E_2/2) = 4.1027$ and $E_2 = 152.60^\circ = 2.6634\,\mathrm{rad}$. Then $M_2 = 2.6634 - 0.7379 \times \sin 152.60^\circ = 2.6634 - 0.7379 \times 0.46014 = 2.3239\,\mathrm{rad}$ ($133.15^\circ$). The mean motion is $n = \sqrt{398\,600.4418/25\,475.1^3} = 1.5527 \times 10^{-4}\,\mathrm{rad/s}$. So

$$
t = \frac{2.3239}{1.5527 \times 10^{-4}} = 14\,967\,\mathrm{s} = 4.157\,\mathrm{h}.
$$

**Sanity check.** Hohmann takes $5.275\,\mathrm{h}$. We arrive $1.12\,\mathrm{h}$ sooner — about 67 minutes — for $238\,\mathrm{m/s}$ extra. That is about $3.6\,\mathrm{m/s}$ for each minute saved, or about $213\,\mathrm{m/s}$ per hour.
:::

::: example A more aggressive one-tangent transfer
Now push the apoapsis out to $r_a = 1.30\,r_2 = 54\,813.2\,\mathrm{km}$.

**The ellipse.** $a_t = 30\,745.6\,\mathrm{km}$, $e = 48\,135.2/61\,491.2 = 0.7828$, $p = 11\,905.5\,\mathrm{km}$.

**Departure.** $v_p = 10.3157\,\mathrm{km/s}$, so $\Delta v_1 = 10.3157 - 7.7258 = 2.5898\,\mathrm{km/s}$.

**The crossing.** $p/r_2 = 0.28236$, so $\cos\nu_2 = (0.28236 - 1)/0.7828 = -0.91676$ and $\nu_2 = 156.46^\circ$. The crossing has moved farther back from apoapsis.

**The tilt.** $e\sin\nu_2 = 0.7828 \times 0.39944 = 0.31268$. Divide by $0.28236$: $\tan\gamma_2 = 1.10737$, so $\gamma_2 = 47.92^\circ$. Much steeper.

**Arrival burn.** $v_2 = 2.4378\,\mathrm{km/s}$. Then $v_2^2 = 5.9427$, the circular speed squared is still $9.4536$, and the cross term is $2 \times 2.4378 \times 3.0747 \times \cos 47.92^\circ = 10.0468$. So $\Delta v_2 = \sqrt{5.9427 + 9.4536 - 10.0468} = \sqrt{5.3494} = 2.3129\,\mathrm{km/s}$.

**Total.** $2.5898 + 2.3129 = 4.9027\,\mathrm{km/s}$ — $26.0\%$ more than Hohmann.

**Time of flight.** $E_2 = 118.32^\circ = 2.0651\,\mathrm{rad}$, so $M_2 = 2.0651 - 0.7828 \times 0.88029 = 1.3760\,\mathrm{rad}$ ($78.84^\circ$). With $n = 1.1711 \times 10^{-4}\,\mathrm{rad/s}$, $t = 11\,750\,\mathrm{s} = 3.264\,\mathrm{h}$, about $2.01\,\mathrm{h}$ faster than Hohmann.

**Compare the two.** Going from a $5\%$ overshoot to a $30\%$ overshoot saved less than one extra hour ($2.01 - 1.12 = 0.89\,\mathrm{h}$), but it multiplied the Δv penalty by more than four ($1010\,\mathrm{m/s}$ against $238\,\mathrm{m/s}$). The price of speed rises steeply, not in a straight line.
:::

## The price of time

Put the two examples side by side and think of them as a price list.

| Choice | Extra Δv over Hohmann | Time saved | Price per hour saved |
| --- | --- | --- | --- |
| $r_a = 1.05\,r_2$ | $238\,\mathrm{m/s}$ | $1.12\,\mathrm{h}$ | about $213\,\mathrm{m/s}$ |
| $r_a = 1.30\,r_2$ | $1010\,\mathrm{m/s}$ | $2.01\,\mathrm{h}$ | about $502\,\mathrm{m/s}$ |

The second hour is far more expensive than the first. If you plot the extra Δv against the time saved for every choice of $r_a$, you get a curve that starts nearly flat and then bends sharply upward — the **[[trade curve|trade-curve]]** of this transfer.

Why does it bend? Because of how the tilt grows. On a stretched ellipse, the orbit is **[[flat near apoapsis|flat-near-apoapsis]]**: the radius changes very little as you move a few degrees away from apoapsis. So to cross $r_2$ even a little early, the crossing has to slide a fair way back along the ellipse. And the flight-path angle climbs quickly as it does. Each extra bit of time you buy tilts the arrival more, and the law of cosines charges more and more for each degree of tilt.

## Confirming optimality, numerically

Lesson 2 claimed that Hohmann uses the least Δv of *every* two-burn transfer between two coplanar circles, and promised a numerical check here.

The one-tangent family gives a clean slice of that claim. Hold the departure tangential and turn the dial $r_a$. At $r_a = r_2$ you have Hohmann exactly. At $r_a = 1.05\,r_2$ the total is higher. At $1.30\,r_2$ it is higher still. Trying more values ($1.10\,r_2$, $1.5\,r_2$, $2\,r_2$) shows the same thing: the farther $r_a$ moves from $r_2$, the bigger the total, and no value ever comes in under Hohmann.

This is narrower than the full theorem, which also considers non-tangential departures and every pair of burn points. But it agrees with it. Within the family you reach by keeping the departure tangential, Hohmann sits at the bottom, and every step away from it costs more.

::: note Why the Hohmann end of the family must be the cheapest
Look at what happens as $r_a$ shrinks toward $r_2$. The crossing slides to $\nu_2 = 180^\circ$, where $\sin\nu_2 = 0$. Then $\gamma_2 = \arctan(0) = 0$, so the arrival is level after all, and the law of cosines collapses to a plain difference of speeds, $|v_{2,\text{circ}} - v_2|$.

Any $r_a > r_2$ pays twice. The departure burn is bigger, because a bigger ellipse needs more speed at periapsis. And the arrival burn has a nonzero $\gamma_2$, so it must spend part of its Δv turning the velocity rather than changing its size. Lesson 1 showed that turning is never free. Both terms grow as $r_a$ grows, so the total cannot dip below its value at $r_a = r_2$.
:::

## Arriving later instead of sooner

The ellipse crosses the target radius twice: once on the way up, at $\nu_2$, and once on the way down, at $360^\circ - \nu_2$, after passing apoapsis. The second crossing is a mirror image of the first. The speed is the same, and the flight-path angle has the same size but points downward. So the arrival burn costs exactly the same.

The time is very different. The spacecraft has to go out past apoapsis and come back. For the $r_a = 1.05\,r_2$ ellipse, whose full period is $11.24\,\mathrm{h}$, the later crossing comes at $11.24 - 4.157 = 7.08\,\mathrm{h}$ — about $1.81\,\mathrm{h}$ *later* than Hohmann. So the same dial, $r_a$, lets you arrive either early or late, for the same Δv.

::: warning The apoapsis must be past the target
With a tangential departure from $r_1$, the transfer ellipse's farthest point is $r_a$. If you chose $r_a < r_2$, the ellipse would never reach the target orbit at all, and $\cos\nu_2 = (p/r_2 - 1)/e$ would come out less than $-1$ — no angle has that cosine. So a one-tangent transfer of this kind always has $r_a \ge r_2$. To arrive earlier, use the crossing on the way up. To arrive later, use the crossing on the way down, where $\nu_2$ is more than $180^\circ$.
:::

::: warning Non-tangential arrival is a real burn, not a bookkeeping detail
It is tempting to compute the arrival burn as the speed gap alone, $v_{2,\text{circ}} - v_2$. In the first example that gives $3.0747 - 1.8057 = 1.269\,\mathrm{km/s}$, when the true burn is $1.672\,\mathrm{km/s}$ — a $400\,\mathrm{m/s}$ under-prediction. Whenever $\gamma_2$ is more than a few degrees, the turn is a big part of the burn, exactly as the vector-addition warning of lesson 1 first showed.
:::

## Check yourself

::: check
In one or two sentences, what does a one-tangent transfer give up, and what does it get in return?
:::

::: answer
It gives up tangency at arrival. The departure burn is still tangential and as cheap as it can be for the ellipse chosen. But the ellipse's apoapsis is placed beyond the target radius, so the spacecraft reaches the target radius while still climbing, with a nonzero flight-path angle.

The arrival burn must then turn the velocity as well as change its size. By the law of cosines that costs more than a purely tangential burn. In return, the time of flight is no longer pinned to the single value a Hohmann transfer gives: you can set it by choosing $r_a$.
:::

::: check
In the $r_a = 1.05\,r_2$ example, the apoapsis is only $5\%$ beyond the target radius. Why is the arrival tilt as large as $26.7^\circ$?
:::

::: answer
Because near apoapsis, a stretched ellipse's radius changes very slowly while its tilt changes quickly.

Call the angle back from apoapsis $\delta$ (so $\nu = 180^\circ - \delta$). For small $\delta$, the radius drops by a fraction of about $\dfrac{e\,\delta^2}{2(1-e)}$ — it depends on $\delta$ *squared*, so it starts off tiny. The tilt grows like $\tan\gamma \approx \dfrac{e}{1-e}\,\delta$ — in direct proportion to $\delta$.

With $e = 0.738$, $\dfrac{e}{1-e} \approx 2.8$. To drop the radius by $5\%$, you need $\delta \approx 0.19\,\mathrm{rad}$, about $11^\circ$ — which matches $\nu_2 = 169.2^\circ$. At that point $\tan\gamma \approx 2.8 \times 0.19 \approx 0.53$, a tilt of about $28^\circ$, close to the exact $26.7^\circ$. A small overshoot in radius does not mean a small tilt.
:::

::: check
You need to rendezvous with a target that will be at the arrival point at a specific time, and a Hohmann transfer's fixed flight time cannot hit it. Describe how you would use a one-tangent transfer.
:::

::: answer
First compute the Hohmann flight time and compare it with the time you actually have.

If you need to arrive *sooner* than Hohmann, choose $r_a > r_2$ and use the crossing on the way up. Increase $r_a$ until the flight time matches the time available.

If you need to arrive *later*, still choose $r_a > r_2$, but use the crossing on the way down, after apoapsis, where $\nu_2 > 180^\circ$. Adjust $r_a$ until that later crossing matches.

Either way, $r_a$ is the dial you turn until the time of flight matches the requirement. Once $r_a$ is fixed, the extra Δv follows from the formulas in this lesson.
:::

::: check
Between the two worked examples, $r_a = 1.05\,r_2$ saved about $1.12\,\mathrm{h}$ for about $238\,\mathrm{m/s}$ extra, and $r_a = 1.30\,r_2$ saved about $2.01\,\mathrm{h}$ for about $1010\,\mathrm{m/s}$ extra. What does this tell you about choosing $r_a$ in practice?
:::

::: answer
The exchange rate gets worse fast. The first choice costs about $213\,\mathrm{m/s}$ per hour saved. The second costs about $502\,\mathrm{m/s}$ per hour saved — more than twice as much per hour. And the step between them bought only $0.89\,\mathrm{h}$ more for $772\,\mathrm{m/s}$ more, about $870\,\mathrm{m/s}$ for that extra hour.

So push $r_a$ out only as far as the timeline really requires. Picking a much larger $r_a$ "just in case" spends Δv at a rapidly worsening rate for schedule margin you may not need.
:::

::: check
Someone proposes a one-tangent transfer with $r_a$ chosen so the arrival happens exactly at $\nu_2 = 180^\circ$. What transfer is this, and why?
:::

::: answer
$\nu_2 = 180^\circ$ is apoapsis itself, so the target radius must equal the apoapsis: $r_2 = r_a$. The transfer ellipse's far point lands exactly on the target orbit. That is the Hohmann transfer.

It checks out in the tilt formula too: $\sin 180^\circ = 0$, so $\gamma_2 = 0$ and the arrival is tangential after all. Hohmann is the $r_a \to r_2$ end of the one-tangent family.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r_a > r_2$ | Free parameter: the transfer ellipse's apoapsis, placed beyond the target radius |
| $\cos\nu_2 = (p/r_2-1)/e$ | True anomaly where the transfer ellipse crosses the target radius |
| $\gamma_2 = \arctan\!\big(e\sin\nu_2/(1+e\cos\nu_2)\big)$ | Flight-path angle at arrival; zero only in the Hohmann limit |
| $\Delta v_2 = \sqrt{v_2^2+v_{2,\text{circ}}^2-2v_2v_{2,\text{circ}}\cos\gamma_2}$ | Non-tangential arrival burn, law of cosines |
| $t = M_2/n$, $n = \sqrt{\mu/a_t^3}$ | Time of flight from the mean anomaly at the crossing |
| $r_a=1.05\,r_2$ example | $+6.1\%$ Δv, arrives $1.12\,\mathrm{h}$ sooner than Hohmann |
| $r_a=1.30\,r_2$ example | $+26.0\%$ Δv, arrives $2.01\,\mathrm{h}$ sooner than Hohmann |
| Later crossing, $\nu > 180^\circ$ | Same Δv, arrives later than Hohmann |
| Optimality check | Every $r_a \neq r_2$ tried costs more than Hohmann — consistent with lesson 2 |

Lessons 2 through 4 have all stayed in one flat plane. The next lesson leaves that plane and asks the most important cost question in this module: what does it take to tilt an orbit into a new plane, and where in the orbit should you pay for it?

::: context rendezvous-in-practice Where this trade shows up for real
The idea in this lesson — pay extra propellant to cut the travel time — is the same trade crews and cargo ships make on the way to the International Space Station. For years, Soyuz and Progress took about two days to reach the station. Since the 2010s they have flown "fast" profiles that arrive within a few hours of launch, using extra burns carefully timed from the moment of liftoff.

Those real profiles use several burns, not one clean one-tangent transfer. The general problem — "get from this point to that point in exactly this much time" — is called Lambert's problem, and solving it is a standard tool in mission design. The one-tangent transfer is the simplest case of it you can work by hand.
:::

::: context tangent-word Where "tangent" comes from
The word comes from the Latin *tangere*, "to touch" — the same root as "tangible", something you can touch. A tangent line touches a curve at one point and runs in the same direction as the curve there, without cutting across it. The "tangent" button on your calculator shares the name because of a line drawn touching a circle in the classic picture of the unit circle.
:::

::: context overshoot-picture What the overshoot looks like
Here is the $r_a = 1.30\,r_2$ transfer from the second example, drawn to scale. The spacecraft starts on the small inner circle, burns forward at the right-hand point, and climbs along the ellipse. It meets the big target circle at $\nu_2 = 156.5^\circ$, well before the ellipse's far end. The dashed part of the ellipse is never flown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="200" cy="105" r="88.54" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="200" cy="105" r="14.02" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="200" cy="105" r="4" fill="#1d6fd1"/>
  <ellipse cx="149.46" cy="105" rx="64.57" ry="40.18" fill="none" stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="4 4"/>
  <path d="M214.0,105.0 L214.0,104.1 L214.0,103.3 L213.9,102.4 L213.8,101.5 L213.6,100.6 L213.5,99.7 L213.3,98.8 L213.0,97.9 L212.7,97.0 L212.4,96.1 L212.1,95.2 L211.7,94.2 L211.2,93.3 L210.7,92.3 L210.2,91.3 L209.6,90.3 L208.9,89.3 L208.2,88.3 L207.3,87.2 L206.5,86.1 L205.5,85.0 L204.4,83.9 L203.2,82.7 L201.9,81.6 L200.5,80.4 L198.9,79.2 L197.1,77.9 L195.2,76.7 L193.1,75.4 L190.7,74.1 L188.1,72.8 L185.3,71.6 L182.1,70.3 L178.5,69.1 L174.6,68.0 L170.3,67.0 L165.5,66.1 L160.2,65.4 L154.4,64.9 L148.2,64.8 L141.4,65.1 L134.1,66.0 L126.6,67.4 L118.8,69.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="214.0" cy="105" r="4" fill="#1f2a44"/>
  <circle cx="118.8" cy="69.6" r="5" fill="#b4232c"/>
  <circle cx="84.9" cy="105" r="3" fill="#6c7a93"/>
  <text x="222" y="118" font-size="11" fill="#1f2a44">burn 1</text>
  <text x="96" y="58" font-size="11" fill="#b4232c">burn 2</text>
  <text x="8" y="108" font-size="11" fill="#6c7a93">apoapsis</text>
  <text x="8" y="136" font-size="11" fill="#6c7a93">(never reached)</text>
  <text x="250" y="24" font-size="11" fill="#1f2a44">target circle r₂</text>
  <text x="144" y="101" font-size="11" fill="#1f2a44">start r₁</text>
</svg>
```

The spacecraft cuts across the target circle rather than touching it. That cutting angle is what the arrival burn must remove.
:::

::: context fpa-reminder The flight-path angle, again
Stand on the spacecraft. "Level" is the direction at right angles to the line from Earth's center. The flight-path angle $\gamma$ is how far the velocity tips above level. At periapsis and apoapsis it is exactly zero. In between it is positive while the spacecraft climbs and negative while it falls.

Here is the arrival of the first example, drawn to scale: the transfer velocity $1.806\,\mathrm{km/s}$ tipped $26.7^\circ$ up, the level circular velocity $3.075\,\mathrm{km/s}$, and the burn that joins their tips.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 90 360 112" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="175" x2="291.3" y2="175" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="291.3,175 281.3,170 281.3,180" fill="#1d6fd1"/>
  <line x1="30" y1="175" x2="167.1" y2="106.0" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="167.1,106.0 158.6,115.9 154.1,106.9" fill="#1f2a44"/>
  <line x1="167.1" y1="106.0" x2="291.3" y2="175" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3"/>
  <polygon points="291.3,175 278.4,173.5 283.2,164.8" fill="#b4232c"/>
  <path d="M 90 175 A 60 60 0 0 0 83.6 148.0" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="96" y="165" font-size="12" fill="#1f2a44">γ₂ = 26.7°</text>
  <text x="60" y="118" font-size="12" fill="#1f2a44">v₂ = 1.806</text>
  <text x="150" y="193" font-size="12" fill="#1d6fd1">v₂,circ = 3.075 km/s</text>
  <text x="236" y="120" font-size="12" fill="#b4232c">Δv₂ = 1.672</text>
</svg>
```

The red side is longer than the plain speed gap, $1.269\,\mathrm{km/s}$, because it also has to swing the arrow down.
:::

::: context kepler-chain Why the time needs three steps
Kepler's second law says a line from Earth to the spacecraft sweeps equal areas in equal times. Near periapsis that line is short, so it has to swing through a big angle to cover its area. Far out it is long and swings slowly. So the true anomaly $\nu$ does not tick at a steady rate.

The mean anomaly $M$ is an invented angle that *does* tick steadily, at the mean motion $n$. The eccentric anomaly $E$ is the go-between that connects the two through Kepler's equation, $M = E - e\sin E$. Going from $\nu$ to $E$ to $M$ to time is the direction that needs no guessing. The opposite direction — time to position — needs Kepler's equation solved by iteration.
:::

::: context trade-curve The whole price list at once
Each dot on this curve is one choice of $r_a$, from $r_a = r_2$ (Hohmann, at the origin) up to $r_a = 2\,r_2$. Across is the time saved against Hohmann; up is the extra Δv.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="160" y1="170" x2="160" y2="175"/><line x1="270" y1="170" x2="270" y2="175"/><line x1="45" y1="95" x2="50" y2="95"/><line x1="45" y1="20" x2="50" y2="20"/></g>
  <g font-size="11" fill="#1f2a44"><text x="50" y="187" text-anchor="middle">0</text><text x="160" y="187" text-anchor="middle">1 h</text><text x="270" y="187" text-anchor="middle">2 h</text><text x="42" y="174" text-anchor="end">0</text><text x="42" y="99" text-anchor="end">1000</text><text x="42" y="24" text-anchor="end">2000</text></g>
  <text x="300" y="196" font-size="11" fill="#6c7a93">time saved</text>
  <text x="56" y="14" font-size="11" fill="#6c7a93">extra Δv (m/s)</text>
  <path d="M50.0,170.0 L50.7,170.0 L50.9,170.0 L51.1,170.0 L51.4,170.0 L51.7,170.0 L52.1,170.0 L52.7,170.0 L53.4,170.0 L54.2,170.0 L55.2,170.0 L56.6,170.0 L58.2,169.9 L60.2,169.9 L62.8,169.9 L65.9,169.8 L69.8,169.7 L74.6,169.5 L80.6,169.2 L87.8,168.7 L96.6,167.9 L107.3,166.8 L120.1,165.0 L135.2,162.3 L152.9,158.2 L172.9,152.1 L193.2,144.4 L208.5,137.2 L220.9,130.6 L231.3,124.4 L240.1,118.6 L247.9,113.1 L254.7,108.0 L260.8,103.2 L266.3,98.6 L271.2,94.2 L275.8,90.1 L279.9,86.2 L283.8,82.4 L287.3,78.8 L290.7,75.4 L293.7,72.1 L296.6,68.9 L299.3,65.9 L301.9,63.0 L304.3,60.2 L306.5,57.5 L308.7,54.9 L310.7,52.4 L312.6,50.0 L314.5,47.6 L316.2,45.4 L317.9,43.2 L319.5,41.1 L321.0,39.0 L322.4,37.1 L323.8,35.1 L325.2,33.3 L326.4,31.5 L327.7,29.7 L328.8,28.0 L330.0,26.3 L331.1,24.7 L332.1,23.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="172.9" cy="152.1" r="4" fill="#b4232c"/>
  <circle cx="271.2" cy="94.2" r="4" fill="#b4232c"/>
  <text x="176" y="168" font-size="11" fill="#b4232c">1.05 r₂</text>
  <text x="222" y="86" font-size="11" fill="#b4232c">1.30 r₂</text>
</svg>
```

The first few minutes are nearly free; after about two hours the curve is close to vertical. Even doubling $r_a$ saves only about $2.56\,\mathrm{h}$. Stretching the ellipse without limit, all the way to escape speed, would still save only about $3.1\,\mathrm{h}$: past a point, extra Δv buys almost no time.
:::

::: context flat-near-apoapsis Why the radius barely changes near apoapsis
At apoapsis the spacecraft is neither climbing nor falling — it is at the top of its arc, like a ball at the top of a throw. Near the top of a throw the height hardly changes for a while, even though the ball keeps moving sideways. The same is true here: the radius depends on the angle from apoapsis *squared*, so small angles barely move it.

The tilt is different. It grows in direct proportion to the angle, and on a stretched ellipse it grows fast — for $e = 0.738$, about $2.8$ times the angle in radians. That mismatch is why a tiny overshoot in radius can still mean a steep arrival.
:::
