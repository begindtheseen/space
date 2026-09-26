---
id: l11-patched-conics-launch-windows
title: Patched conics and interplanetary trajectory design
minutes: 25
covers:
  - patched conics, sphere of influence, C3, gravity assists
  - porkchop plots and launch windows
---

Think about a phone call in a moving car. Your phone talks to one cell tower at a time — whichever one is strongest nearby. As you drive out of one tower's patch and into the next, the call is handed over. At no moment is the phone really talking to "all towers at once", even though every tower's signal reaches it a little.

Interplanetary mission design works the same way. Every maneuver in this module so far stayed near one body: Earth. A trip to Mars, or a swing past Jupiter toward the outer planets, passes through two or three regions where a different body's gravity is in charge — first Earth's, then the Sun's, then the target planet's. You *could* compute the pull of every body at every instant, all the way from launch to arrival. Computers do that at the end. But for designing the mission, it is far more useful to hand the spacecraft from one body to the next, like the phone between towers.

That handoff method is called **[[patched conics|what-conic]]**. Each stretch of the trip is an ordinary two-body orbit — an ellipse or hyperbola, one of the **conic sections** from the last module — around whichever body dominates there. The stretches are stitched ("patched") together at the boundaries. This lesson builds that method: the boundary (the **sphere of influence**), the number launch providers sell against (**C3**), the free speed change from a flyby (**gravity assist**), and the calendar that says when you can go (**launch windows** and **porkchop plots**).

## The sphere of influence

Near a planet, you can describe a spacecraft's motion in two ways:

- as an orbit around the **planet**, slightly disturbed by the Sun; or
- as an orbit around the **Sun**, slightly disturbed by the planet.

Each description is good close to its own central body and gets worse farther away. The **sphere of influence** (SOI) is the boundary where the two descriptions are equally good. Patched conics switches from one to the other right there.

### Compare disturbance to main pull, in each frame

The trick is not to compare the two raw pulls. Near a planet, the planet's pull always wins by a lot. Instead, for each description, ask: how big is the **disturbance** compared with that description's **main pull**? A two-body orbit is a good model exactly when its disturbance is small next to its own central pull.

Set up the symbols. The spacecraft is a distance $r$ from a planet of mass $m$. The planet is a distance $D$ from the Sun, of mass $M$. $G$ is the gravitational constant.

**Planet-centered view.** The main pull is the planet's, about $Gm/r^2$. The Sun pulls on both the spacecraft *and* the planet, so both fall toward the Sun together. Only the *difference* between the Sun's pull on the spacecraft and on the planet disturbs the spacecraft's motion around the planet. That difference is called a **[[tidal|tidal]]** acceleration, and when $r$ is much smaller than $D$ it is about $GMr/D^3$. So the ratio is

$$
\frac{\text{disturbance}}{\text{main pull}} \sim \frac{GMr/D^3}{Gm/r^2} = \frac{M r^3}{m D^3}.
$$

(The symbol $\sim$, read "is about", means "roughly the size of".)

**Sun-centered view.** The main pull is the Sun's, about $GM/D^2$ (the spacecraft is near the planet, so its distance from the Sun is about $D$). The disturbance is the planet's pull, $Gm/r^2$. This one is not a tidal difference — the Sun does not feel the planet in this view — so

$$
\frac{\text{disturbance}}{\text{main pull}} \sim \frac{Gm/r^2}{GM/D^2} = \frac{mD^2}{Mr^2}.
$$

**Where they are equal.** Set the two ratios equal and solve for $r$:

$$
\frac{Mr^3}{mD^3} = \frac{mD^2}{Mr^2} \quad\Longrightarrow\quad M^2r^5 = m^2D^5 \quad\Longrightarrow\quad r_{\text{SOI}} = D\left(\frac{m}{M}\right)^{2/5}.
$$

The middle step cross-multiplies: $Mr^3 \cdot Mr^2 = mD^2 \cdot mD^3$. The last step takes the fifth root of both sides, which turns $r^5$ into $r$, $D^5$ into $D$, and $(m/M)^2$ into $(m/M)^{2/5}$.

::: key Sphere of influence
$$
r_{\text{SOI}} = a\left(\frac{m}{M}\right)^{2/5},
$$
where $a$ (written $D$ in the derivation above) is the planet's distance from the Sun — its orbit's semi-major axis — $m$ is the planet's mass and $M$ the Sun's. For Earth it is about $924\,000\,\mathrm{km}$. Inside it, patch to a planet-centered conic, with the Sun as a disturbance; outside, patch to a heliocentric (Sun-centered) one, with the planet as the disturbance.

The boundary is only roughly a sphere. The tidal pull is about twice as strong along the Sun–planet line as across it, so the true "equally good" surface is lopsided. A sphere is the [[handy idealization|hill-sphere]].
:::

::: example Earth's sphere of influence
You need $D$, $m$ and $M$. Masses enter only as the ratio $m/M$, and $G$ cancels in that ratio, so you can use the gravitational parameters $\mu = GM$ instead:

- $D = 1\,\mathrm{AU} = 1.495\,978\,707 \times 10^{8}\,\mathrm{km}$ (an **AU**, astronomical unit, is Earth's average distance from the Sun);
- $\mu_{\text{Earth}} = 398\,600.4418\,\mathrm{km^3/s^2}$;
- $\mu_{\text{Sun}} = 1.327\,124 \times 10^{11}\,\mathrm{km^3/s^2}$.

**Step 1: the mass ratio.** $398\,600.4418 / (1.327\,124 \times 10^{11}) = 3.0035 \times 10^{-6}$.

**Step 2: raise it to the $2/5$ power.** $(3.0035 \times 10^{-6})^{0.4} = 6.181 \times 10^{-3}$.

**Step 3: multiply by the distance.**

$$
r_{\text{SOI}} = 1.495\,978\,707 \times 10^{8} \times 6.181 \times 10^{-3} \approx 924\,600\,\mathrm{km}.
$$

**Sanity check.** That is about 145 Earth radii, and about $2.4$ times the Moon's distance, so the Moon is well inside. But it is tiny next to the $1.5 \times 10^8\,\mathrm{km}$ Earth–Sun distance — about $0.6\%$ of it. That is why the picture "coast almost the whole way under the Sun, with short planet-dominated legs at each end" works so well.
:::

::: note Why a smaller planet's sphere can be smaller even if it is farther out
Distance enters $r_{\text{SOI}}$ in a straight line, but mass enters through the $2/5$ power. Mass differences between planets are huge — a factor of nine between Earth and Mars, three hundred between Earth and Jupiter — so mass usually wins. You will see this in the Check yourself section with Mars.
:::

## C3: the currency of departure

Once a spacecraft leaves Earth's sphere of influence on an escape hyperbola, its speed relative to Earth settles to a constant. That leftover speed is the **hyperbolic excess speed** $v_\infty$ ("v infinity"), which you met in the last module's orbit-families lesson. There you found $\varepsilon = v_\infty^2/2 = -\mu/(2a)$ for an escaping hyperbola, where $\varepsilon$ ("epsilon") is the energy per kilogram.

Mission designers square $v_\infty$ and call the result the **characteristic energy**:

$$
C_3 = v_\infty^2 = -\frac{\mu}{a}.
$$

It is exactly twice the energy per kilogram. Why square it? Because it is the number a **[[launch vehicle's performance curve|payload-curve]]** is quoted against: how much payload mass the rocket can throw onto a departure with a given $C_3$. It does not care which way $v_\infty$ points or how far away the destination is.

Read the sign carefully. A hyperbola has a *negative* semi-major axis, so $C_3 = -\mu/a$ comes out positive. $C_3 = 0$ is exactly escape, with nothing to spare — a parabola. A bound orbit (an ellipse) has a *positive* $a$, so its $C_3$ is negative. A trip to the Moon, which never fully leaves Earth, flies at a slightly negative $C_3$.

::: key C3
$C_3 = v_\infty^2 = -\mu/a$, the characteristic energy of a hyperbolic departure, in $\mathrm{km^2/s^2}$. $C_3 = 0$ is exactly escape; a bound orbit has $C_3 < 0$. A porkchop plot contours $C_3$ against departure date and arrival date.
:::

::: example C3 for two departure speeds
**Case 1:** $v_\infty = 2.0\,\mathrm{km/s}$.

$C_3 = 2.0^2 = 4.0\,\mathrm{km^2/s^2}$. The hyperbola's semi-major axis is $a = -\mu/C_3 = -398\,600.4418 / 4.0 = -99\,650.1\,\mathrm{km}$.

**Case 2:** $v_\infty = 3.0\,\mathrm{km/s}$.

$C_3 = 3.0^2 = 9.0\,\mathrm{km^2/s^2}$, and $a = -398\,600.4418 / 9.0 = -44\,288.9\,\mathrm{km}$.

**Sanity check.** Both $a$ values are negative, as a hyperbola's must be. The faster departure has the smaller $|a|$: a sharper, straighter hyperbola. Both are realistic for leaving Earth toward Mars.
:::

The burn that puts a spacecraft on that hyperbola is fired low, at the bottom of a parking orbit, where the spacecraft is already moving fast. That is the **[[Oberth effect|oberth-departure]]** from lesson 3 at work: the same Δv added at high speed buys more energy. It is why raising $C_3$ from $9$ to $16\,\mathrm{km^2/s^2}$ — a whole extra kilometre per second of $v_\infty$ — costs only about $0.30\,\mathrm{km/s}$ more at a $300\,\mathrm{km}$ perigee.

## Gravity assists

Picture a tennis ball thrown at the front of a moving train. Seen from the train, the ball comes in and bounces back at the same speed. Seen from the platform, it leaves much faster than it arrived, because the train's speed got added on. A **gravity assist** is that bounce, with gravity instead of a bumper.

### Inside the planet's sphere: only the direction changes

Inside a flyby planet's sphere of influence, the pass is an ordinary two-body hyperbola, exactly as the orbit-families lesson worked out. The spacecraft arrives with excess speed $v_\infty$ and swings past at closest distance $r_p$ (the **periapsis**). The hyperbola's eccentricity is

$$
e = 1 + \frac{r_p v_\infty^2}{\mu},
$$

and its path bends through a **turning angle** $\delta$ ("delta") given by

$$
\sin\frac{\delta}{2} = \frac{1}{e} = \frac{1}{1 + r_p v_\infty^2/\mu}.
$$

No engine fires during the flyby. So in the planet-centered frame, energy is conserved: $v_\infty$ leaves with exactly the same size it arrived with. It is only turned, by $\delta$. That turn is the whole story of a gravity assist — and on its own it seems to change nothing about the speed.

### Back in the Sun's frame: the speed changes

The payoff shows up when you switch back to the Sun-centered frame. The spacecraft's velocity around the Sun is a **vector sum** — two arrows placed tip to tail:

$$
\mathbf{v}_{\text{helio}} = \mathbf{V}_{\text{planet}} + \mathbf{v}_\infty.
$$

Here $\mathbf{V}_{\text{planet}}$ is the planet's own velocity around the Sun (bold letters are vectors: arrows with a size and a direction). The flyby does not change $\mathbf{V}_{\text{planet}}$. It does change the *direction* of $\mathbf{v}_\infty$. So the length of the sum, $|\mathbf{v}_{\text{helio}}|$, is generally different before and after. The spacecraft gains or loses speed around the Sun without burning any propellant. The planet pays for it with a tiny, unmeasurable change in its own orbit.

::: key What a gravity assist changes
A flyby rotates $\mathbf{v}_\infty$ in the planet-centered frame without changing its magnitude. Adding the planet's heliocentric velocity back in, $\mathbf{v}_{\text{helio}} = \mathbf{V}_{\text{planet}} + \mathbf{v}_\infty$, changes the spacecraft's heliocentric speed. The maximum turn is $\sin(\delta/2) = 1/(1 + r_p v_\infty^2/\mu)$, so a close pass at a massive body turns the most.
:::

::: example A Jupiter flyby that raises heliocentric speed
**Jupiter's speed.** Jupiter orbits at about $5.2\,\mathrm{AU}$. Its circular speed around the Sun is

$$
V_J = \sqrt{\frac{\mu_\odot}{5.2\,\mathrm{AU}}} = \sqrt{\frac{1.327\,124 \times 10^{11}}{5.2 \times 1.495\,978\,707 \times 10^8}} = 13.06\,\mathrm{km/s}.
$$

($\odot$ is the astronomers' symbol for the Sun, so $\mu_\odot$ is the Sun's $\mu$.)

**The arrival.** The spacecraft arrives with $v_\infty = 8.0\,\mathrm{km/s}$, at right angles to Jupiter's velocity. It passes $500\,\mathrm{km}$ above the cloud tops, at $r_p = 71\,992\,\mathrm{km}$ from Jupiter's center. Jupiter's $\mu$ is $1.266\,865 \times 10^8\,\mathrm{km^3/s^2}$.

**Step 1: eccentricity.**

$$
e = 1 + \frac{71\,992 \times 8.0^2}{1.266\,865 \times 10^8} = 1 + \frac{4\,607\,488}{126\,686\,500} = 1.0364.
$$

**Step 2: turning angle.** $\sin(\delta/2) = 1/1.0364 = 0.9649$, so $\delta/2 = 74.78^\circ$ and $\delta = 149.55^\circ$. That is an enormous bend. It is possible only because $e$ is barely above $1$: a slow approach, relative to Jupiter's deep gravity well.

**Step 3: before.** Put Jupiter's velocity along $+x$ and the arriving $\mathbf{v}_\infty$ along $+y$. Then

$$
\mathbf{v}_{\text{helio, in}} = (13.06,\ 8.0)\,\mathrm{km/s}, \qquad |\mathbf{v}_{\text{helio, in}}| = \sqrt{13.06^2 + 8.0^2} = 15.32\,\mathrm{km/s}.
$$

**Step 4: after.** Choose the side of the pass so the turn swings $\mathbf{v}_\infty$ toward $+x$, lining it up better with Jupiter's motion. Rotating the $8.0\,\mathrm{km/s}$ arrow by $149.55^\circ$ from $+y$ leaves it pointing $59.55^\circ$ below $+x$, so it becomes $(8.0\cos 59.55^\circ,\ -8.0\sin 59.55^\circ) = (4.055,\ -6.897)\,\mathrm{km/s}$. Adding Jupiter's velocity:

$$
\mathbf{v}_{\text{helio, out}} = (13.061 + 4.055,\ -6.897) = (17.116,\ -6.897)\,\mathrm{km/s}, \qquad |\mathbf{v}_{\text{helio, out}}| = 18.45\,\mathrm{km/s}.
$$

**Step 5: the gain.** Carrying one more digit, $18.453 - 15.316 = 3.137$, so about $3.14\,\mathrm{km/s}$ of heliocentric speed, with no propellant.

**Sanity check.** The excess speed was $8.0\,\mathrm{km/s}$ in and $8.0\,\mathrm{km/s}$ out: $\sqrt{4.055^2 + 6.897^2} = 8.00$. Only its direction changed. The gain is also less than the most you could ever get, $13.06 + 8.0 = 21.06\,\mathrm{km/s}$, which would need the outgoing $\mathbf{v}_\infty$ to point exactly along $+x$.

This is how missions to the outer solar system — and **[[Voyager|voyager]]**, now in interstellar space — reach speeds far beyond what their rockets alone could give.
:::

::: warning A gravity assist can as easily slow a spacecraft down
Nothing in the geometry forces the turn to help. Aim the flyby so $\mathbf{v}_\infty$ swings *away* from lining up with $\mathbf{V}_{\text{planet}}$, and heliocentric speed drops instead. Missions heading inward toward the Sun do this on purpose — **[[a Venus flyby to shed energy on the way to Mercury|mercury]]**, for instance.
:::

## Launch windows and the synodic period

Look at a clock. The minute hand and the hour hand line up at 12:00. When do they line up again? Not at 1:00 — by then the hour hand has moved on. The minute hand has to go a bit more than one full lap to catch it, and the next line-up is at about 1:05. The two hands keep lining up at a steady rhythm, set by the *difference* between their speeds.

Planets do the same. A cheap transfer from Earth to Mars needs the two planets in one particular arrangement — Mars a certain angle ahead of Earth at launch — so that Mars arrives at the meeting point at the same moment as the spacecraft. A **launch window** is the stretch of dates when that arrangement holds, or nearly holds.

Both planets keep moving, so the arrangement comes back at a steady rhythm: the **synodic period** $T_{\text{syn}}$, the time for the faster (inner) planet to gain exactly one full lap, $360^\circ$, on the slower one.

Here is where it comes from. Let the two **sidereal periods** — the times to go once around the Sun, measured against the stars — be $T_1 < T_2$. Their turning rates are $n_1 = 2\pi/T_1$ and $n_2 = 2\pi/T_2$ (radians per unit time). The angle between them grows at the difference, $n_1 - n_2$. A full lap is $2\pi$, so it takes

$$
T_{\text{syn}} = \frac{2\pi}{n_1 - n_2} = \frac{2\pi}{2\pi/T_1 - 2\pi/T_2} = \frac{1}{\dfrac{1}{T_1} - \dfrac{1}{T_2}}.
$$

::: example The Earth–Mars synodic period
$T_{\text{Earth}} = 365.256\,\mathrm{days}$ and $T_{\text{Mars}} = 686.980\,\mathrm{days}$.

**Step 1: the rates.** $1/365.256 = 0.002\,737\,8$ laps per day and $1/686.980 = 0.001\,455\,6$ laps per day.

**Step 2: the difference.** $0.002\,737\,8 - 0.001\,455\,6 = 0.001\,282\,2$ laps per day. That is how fast Earth gains on Mars.

**Step 3: flip it.**

$$
T_{\text{syn}} = \frac{1}{0.001\,282\,2} = 779.9\,\mathrm{days} \approx 2.14\,\mathrm{years}.
$$

**Sanity check.** That is about 26 months, and longer than either planet's own year, as it has to be: Earth needs more than one lap to catch up. This is why Earth-to-Mars launches bunch up roughly every 26 months instead of being possible any time. Missing a window does not mean waiting a Mars year. It means waiting a synodic period.
:::

::: key Synodic period
$T_{\text{syn}} = 1/(1/T_1 - 1/T_2)$ sets how often a launch window's geometry comes back. For Earth and Mars it is about $780$ days, roughly 26 months.
:::

## The porkchop plot

The synodic period says roughly *when* a window opens. A **[[porkchop plot|porkchop]]** is what a mission designer reads to pick the actual day.

It is a contour map, like the height lines on a hiking map. Along one axis is the **launch date**. Along the other is the **arrival date** (or, equally, the time of flight). At every point on that grid, a computer finds the transfer orbit that leaves Earth on that day and reaches Mars on that day, and records its departure $C_3$ — or the $v_\infty$ at arrival. The contour lines join points of equal $C_3$.

Finding that one transfer orbit between two given positions in a given time is called **Lambert's problem**. It gets its own module two steps on in this track (Lambert targeting), where you will build a porkchop plot yourself.

What you see is usually two low-$C_3$ "sweet spots", separated by a ridge where the cost shoots up. One sweet spot holds shorter trips, which go less than halfway around the Sun. The other holds longer trips, which go more than halfway around. The ridge sits where the trip is almost exactly halfway around — a geometry that turns out to be very expensive. The whole pattern repeats every synodic period.

This module has now given you every piece needed to read the plot and say why its features sit where they do. Building one from a Lambert solver is the later module's job.

::: warning Patched conics is a design tool, not the final answer
Patched conics treats the trip as a chain of exact two-body arcs, handed off sharply at a spherical boundary. It ignores the disturbances the sphere-of-influence derivation already called approximate. In a full computer simulation, the arcs on either side of the boundary do not match perfectly. Patched conics is accurate enough for mission design, launch-vehicle sizing and picking a launch window. The real trajectory is later checked and refined with a full numerical simulation of every body's pull.
:::

## Check yourself

::: check
In your own words: why is the sphere-of-influence boundary found by comparing *ratios* of accelerations, rather than the accelerations themselves?
:::

::: answer
Near a planet, the raw pulls from the Sun and the planet are wildly different in size, and the planet's pull always wins at short range. Comparing raw pulls would not tell you which *description* to trust.

What matters is how big each description's *disturbance* is next to its own *main pull*, because a two-body model is good exactly when its disturbance is small. Setting the two ratios equal finds the place where both descriptions are equally good (or equally imperfect). That is the sensible place to switch from one to the other.
:::

::: check
Mars has $\mu_{\text{Mars}} = 42\,828\,\mathrm{km^3/s^2}$ and orbits at $D = 1.524\,\mathrm{AU}$. Estimate its sphere of influence.
:::

::: answer
$r_{\text{SOI}} = D(\mu_{\text{Mars}}/\mu_\odot)^{2/5}$.

**The mass ratio:** $42\,828 / (1.327\,124 \times 10^{11}) = 3.227 \times 10^{-7}$.

**To the $2/5$ power:** $(3.227 \times 10^{-7})^{0.4} \approx 2.532 \times 10^{-3}$.

**The distance:** $1.524 \times 1.495\,978\,707 \times 10^8 = 2.280 \times 10^8\,\mathrm{km}$.

**Multiply:** $r_{\text{SOI}} \approx 2.280 \times 10^8 \times 2.532 \times 10^{-3} \approx 577\,300\,\mathrm{km}$.

That is *smaller* than Earth's $924\,600\,\mathrm{km}$, even though Mars is farther from the Sun. Distance enters in a straight line, but the mass ratio enters to the $2/5$ power, and Mars's $\mu$ is only about a ninth of Earth's. The small mass outweighs the $1.524$ times larger distance.
:::

::: check
Two spacecraft leave Earth, one with $v_\infty = 4.0\,\mathrm{km/s}$ and one with $v_\infty = 5.0\,\mathrm{km/s}$. Find both $C_3$ values. Which mission needed more from its launch vehicle?
:::

::: answer
$C_3 = v_\infty^2$, so $4.0^2 = 16.0\,\mathrm{km^2/s^2}$ and $5.0^2 = 25.0\,\mathrm{km^2/s^2}$.

The second mission needed more. Launch-vehicle performance is plotted as payload mass against $C_3$, and a higher $C_3$ means less payload on the same rocket — or a bigger rocket for the same payload. Note that a $25\%$ increase in $v_\infty$ is a $56\%$ increase in $C_3$, because $C_3$ goes as the square.
:::

::: check
The size of $\mathbf{v}_\infty$ is the same before and after a flyby. Why, then, does the *direction* of the turn decide whether heliocentric speed goes up or down?
:::

::: answer
Heliocentric velocity is the vector sum $\mathbf{V}_{\text{planet}} + \mathbf{v}_\infty$, not the plain number $V_{\text{planet}} + v_\infty$. Swing $\mathbf{v}_\infty$ to point more nearly along $\mathbf{V}_{\text{planet}}$, and the two arrows add more strongly, so the sum gets longer. Swing it toward the opposite direction, and they partly cancel, so the sum gets shorter.

Since the length of $\mathbf{v}_\infty$ never changes, the whole effect comes from which way that fixed-length arrow points after the turn. The flyby's aim point controls that: it sets $r_p$ (and so $\delta$) and which side of the planet the spacecraft passes.
:::

::: check
A mission misses its Earth–Mars launch window. Roughly how long until the next comparable chance, and why is the answer not "one Mars year"?
:::

::: answer
About $780$ days ($\approx 2.14$ years), the Earth–Mars synodic period — not the Mars year of $687$ days.

The window depends on the *relative* arrangement of Earth and Mars around the Sun coming back, not on Mars alone finishing a lap. Earth keeps moving too. The two rates combine as $1/T_{\text{syn}} = 1/T_{\text{Earth}} - 1/T_{\text{Mars}}$, and the same arrangement returns only after Earth has gained one full lap on Mars, which takes longer than either planet's own year.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Patched conics | a trip is a chain of two-body arcs, each around the locally dominant body, stitched at the boundaries |
| $r_{\text{SOI}} = a(m/M)^{2/5}$ | sphere of influence: where to switch central bodies ($a$ is the planet's distance from the Sun) |
| Earth $r_{\text{SOI}}$ | about $924\,600\,\mathrm{km}$, roughly $145$ Earth radii |
| $C_3 = v_\infty^2 = -\mu/a$ | characteristic energy; the launch-performance currency; $0$ is exactly escape, negative is bound |
| $e = 1 + r_p v_\infty^2/\mu$, $\sin(\delta/2) = 1/e$ | flyby eccentricity and turning angle (from the orbit-families lesson) |
| $\mathbf{v}_{\text{helio}} = \mathbf{V}_{\text{planet}} + \mathbf{v}_\infty$ | a gravity assist changes heliocentric speed by turning $\mathbf{v}_\infty$, not by changing its size |
| Jupiter flyby example | $149.6^\circ$ turn, $v_\infty = 8.0\,\mathrm{km/s}$, gains $3.14\,\mathrm{km/s}$ of heliocentric speed |
| $T_{\text{syn}} = 1/(1/T_1 - 1/T_2)$ | synodic period; how often a launch window's geometry returns |
| Earth–Mars $T_{\text{syn}}$ | about $780$ days, roughly 26 months |
| Porkchop plot | $C_3$ (or arrival $v_\infty$) contoured over launch date and arrival date |

This lesson closes the module's tour of maneuvers. Every one of them — Hohmann and bi-elliptic transfers, plane changes and apsidal rotation, phasing, finite and low-thrust burns, station-keeping, and now patched-conic departures and gravity assists — comes back to a handful of ideas from lesson 1: a Δv is a vector, speeding up along your path is cheap while turning is not, and every trade in this subject swaps propellant for time one way or the other. The next module puts the real disturbances — Earth's shape, the Moon and Sun, air drag, sunlight — back into the two-body picture this whole module assumed.

::: context what-conic Conics, and why "patched"
A **conic section** is the shape you get by slicing a cone: a circle, an ellipse, a parabola or a hyperbola. The last module showed that every two-body orbit is one of these four. "Patched conics" means the whole trip is built from pieces of these shapes: a hyperbola leaving Earth, an ellipse around the Sun, a hyperbola arriving at Mars. At each boundary, the position and velocity at the end of one piece become the starting point of the next, converted from one body's frame to the other's.
:::

::: context tidal Why only the difference counts
The Sun pulls the planet and a nearby spacecraft almost equally, so they fall toward the Sun together — like two people in a falling elevator, who do not move relative to each other. Only the small *difference* in pull disturbs the spacecraft's orbit around the planet. On the Sun side the spacecraft is pulled a bit harder than the planet; on the far side, a bit less. Both differences point away from the planet, stretching the orbit along the Sun line. The same stretching raises two ocean tides a day on Earth, which is where the name comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="0" cy="100" r="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="8" y="152" font-size="12" fill="#1f2a44">Sun</text>
  <circle cx="150" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="220" cy="100" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="290" cy="100" r="4" fill="#1d6fd1"/>
  <text x="220" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">planet</text>
  <text x="150" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">craft</text>
  <text x="290" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">craft</text>
  <text x="190" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">Sun's pull on each (black)</text>
  <line x1="150" y1="60" x2="89" y2="60" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="80,60 89,55.5 89,64.5" fill="#1f2a44"/>
  <line x1="220" y1="60" x2="169" y2="60" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="160,60 169,55.5 169,64.5" fill="#1f2a44"/>
  <line x1="290" y1="60" x2="247" y2="60" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="238,60 247,55.5 247,64.5" fill="#1f2a44"/>
  <line x1="150" y1="138" x2="128" y2="138" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="120,138 128,133.5 128,142.5" fill="#b4232c"/>
  <line x1="290" y1="138" x2="306" y2="138" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="314,138 306,142.5 306,133.5" fill="#b4232c"/>
  <text x="220" y="162" font-size="11" text-anchor="middle" fill="#b4232c">red: pull minus the planet's share (×3)</text>
</svg>
```
:::

::: context hill-sphere A different "sphere" you may hear about
Books also talk about the **Hill sphere**, $r_H \approx a\,(m/3M)^{1/3}$, which for Earth is about $1.5$ million km. It answers a different question: out to what distance can a moon stay in a long-lasting orbit around the planet at all? The sphere of influence answers "which body should be the center of my two-body model?" Both are rough boundaries, and they are not the same size, so check which one a source means.
:::

::: context payload-curve How rockets are sold for deep space
A launch provider publishes a curve of payload mass against $C_3$. It falls steeply: the more energy per kilogram you ask for, the fewer kilograms the rocket can deliver. A mission's trajectory team hands over a required $C_3$ and a departure direction; the launch team works out the parking orbit and burn. Typical values are slightly negative for the Moon (it never fully leaves Earth), about $8$ to $16\,\mathrm{km^2/s^2}$ for Mars, and $80$ or more for a direct trip to Jupiter with no gravity assists.
:::

::: context oberth-departure The Oberth effect pays for departure
Lesson 3 showed that a burn changes energy per kilogram by $\Delta\varepsilon = v\,\Delta v + \Delta v^2/2$, so the same Δv is worth more where you are moving fast. From a $300\,\mathrm{km}$ parking orbit, perigee speed on the departure hyperbola is $\sqrt{C_3 + 2\mu/r}$: $11.330\,\mathrm{km/s}$ for $C_3 = 9$ and $11.635\,\mathrm{km/s}$ for $C_3 = 16$. So going from $v_\infty = 3$ to $4\,\mathrm{km/s}$ — a full kilometre per second far from Earth — takes only $0.305\,\mathrm{km/s}$ more at perigee. That is why departure burns are fired low and fast.
:::

::: context voyager The Voyager grand tour
In the late 1970s, Jupiter, Saturn, Uranus and Neptune were lined up so that one spacecraft could visit all four, each flyby bending it on to the next. That arrangement comes around only about once every 175 years. Voyager 2, launched in 1977, used it to become the only spacecraft to fly past Uranus and Neptune. Both Voyagers left the solar system fast enough, thanks largely to gravity assists, that the Sun will never pull them back.

This picture is the Jupiter example drawn to scale. The black arrow is Jupiter's velocity. The blue arrows are $\mathbf{v}_\infty$ in and out, both $8.0\,\mathrm{km/s}$ long. The grey and red arrows are the spacecraft's speed around the Sun before ($15.3$) and after ($18.5\,\mathrm{km/s}$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="124.5" cy="100" r="64" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
  <line x1="20" y1="100" x2="115.5" y2="100" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="124.5,100 115.5,104.5 115.5,95.5" fill="#1f2a44"/>
  <line x1="124.5" y1="100" x2="124.5" y2="45" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="124.5,36 129,45 120,45" fill="#1d6fd1"/>
  <line x1="124.5" y1="100" x2="152.3" y2="147.4" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="156.9,155.2 148.5,149.7 156.2,145.2" fill="#1d6fd1"/>
  <line x1="20" y1="100" x2="116.8" y2="40.7" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="124.5,36 119.2,44.5 114.5,36.9" fill="#6c7a93"/>
  <line x1="20" y1="100" x2="148.6" y2="151.8" stroke="#b4232c" stroke-width="2"/>
  <polygon points="156.9,155.2 146.9,156 150.2,147.7" fill="#b4232c"/>
  <text x="68" y="95" font-size="11" fill="#1f2a44">Jupiter 13.1</text>
  <text x="132" y="30" font-size="11" fill="#1d6fd1">v∞ in 8.0</text>
  <text x="164" y="160" font-size="11" fill="#1d6fd1">v∞ out 8.0</text>
  <text x="20" y="45" font-size="11" fill="#6c7a93">before 15.3</text>
  <text x="40" y="160" font-size="11" fill="#b4232c">after 18.5</text>
  <text x="200" y="92" font-size="11" fill="#1f2a44">dashed circle: v∞ keeps</text>
  <text x="200" y="106" font-size="11" fill="#1f2a44">its length, only turns</text>
  <text x="200" y="190" font-size="11" fill="#6c7a93">km/s · 8 px per km/s</text>
</svg>
```
:::

::: context mercury Braking with flybys
Reaching Mercury is hard not because it is far, but because falling toward the Sun makes a spacecraft *faster*, and it must shed that speed to be captured. NASA's MESSENGER used one Earth flyby, two Venus flybys and three Mercury flybys to slow down before entering Mercury orbit in 2011. Each pass was aimed so the turn pointed $\mathbf{v}_\infty$ partly against the planet's motion, trimming heliocentric speed for free.
:::

::: context porkchop Why "porkchop"
Draw the contours of $C_3$ and the two sweet spots often form a lopsided, rounded blob with a narrow tail — the shape of a pork chop. The name stuck.

Real example: in July 2020, three Mars missions left Earth within about eleven days of each other — the UAE's Hope, China's Tianwen-1 and NASA's Perseverance. They were not racing. They were all using the same low-$C_3$ region of the same porkchop plot, in a window that would not open again for about 26 months.

This picture shows why the window matters, drawn to scale for a Hohmann transfer. The trip takes about $259$ days. In that time Mars moves about $136^\circ$, so at launch it must already be about $44^\circ$ ahead of Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="105" r="50" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="180" cy="105" r="76.2" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="180" cy="105" r="9" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <path d="M 130,105 A 63.1,61.7 0 0,0 256.2,105" fill="none" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="130" cy="105" r="5" fill="#1d6fd1"/>
  <circle cx="125.5" cy="158.2" r="5" fill="#b4232c"/>
  <circle cx="256.2" cy="105" r="5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="122" y="100" font-size="11" text-anchor="end" fill="#1d6fd1">Earth at launch</text>
  <text x="118" y="176" font-size="11" text-anchor="end" fill="#b4232c">Mars at launch</text>
  <text x="264" y="100" font-size="11" fill="#b4232c">Mars at arrival</text>
  <text x="180" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">transfer (dashed) · Mars leads by 44°</text>
</svg>
```
:::
