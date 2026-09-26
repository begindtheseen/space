---
id: l10-stationkeeping-constellations-deorbit
title: Station-keeping, constellations and deorbit
minutes: 28
covers:
  - station-keeping for GEO and LEO
  - constellation management, drift orbits and deorbit
---

Think about a boat anchored in a river. Dropping anchor gets it to the right spot. But the current never stops pushing, so every so often someone has to run the motor for a moment and nudge it back. Nobody thinks of that as a trip. It is upkeep, and it goes on for as long as the boat stays there.

Every maneuver so far in this module has been a trip: it got a spacecraft *to* somewhere. This lesson is about the upkeep that follows, for years. A working orbit does not stay put once you reach it. Small forces — Earth's slightly squashed shape, the pull of the Moon and Sun, the thin air at low altitude, even the push of sunlight — keep nudging it away from where the mission needs it. Each nudge has to be undone, and each undoing is paid for in Δv, with the same tools you built in the last nine lessons.

**Station-keeping** — the small, regular burns that hold a satellite in its assigned orbit — is that ongoing bill. **Drift orbits** use the same small burns on purpose, to move a satellite to a new slot. And **deorbit** is the last burn of a mission, the one that retires the satellite responsibly.

This lesson does not work out the physics of those small forces. That is the whole job of the next module, which builds Earth's shape, the Moon and Sun's pull, and air density models from scratch. What this lesson shows is simpler and very useful: once you know roughly *how fast* an orbit drifts, turning that into a Δv budget needs nothing more than the plane-change formula and the small two-burn raise you already have.

## GEO north-south station-keeping

A **geostationary** satellite — one in a circular orbit over the equator, $42\,164\,\mathrm{km}$ from Earth's center, that goes around once per day and so seems to hang still over one spot — must keep its orbit flat in the equator's plane. Its tilt, the inclination $i$, is supposed to be zero.

It does not stay zero on its own. The Moon and Sun sit well off the equator's plane, so their pull keeps tugging the satellite's orbit plane out of it. Engineers call this **lunisolar perturbation** — "luni" for Moon, "solar" for Sun, and a **perturbation** is any small force beyond the plain two-body pull of Earth.

How fast does the tilt grow? The rate depends on where the Moon's own orbit is tilted at the time, which swings back and forth over the **[[18.6-year lunar cycle|lunar-nodal-cycle]]**. A typical figure, if nobody corrects it, is about $0.85^\circ$ per year. Left alone for ten years, a GEO satellite would be several degrees out of the equator's plane. Seen from the ground, it would slide north and south every day. A **[[fixed dish antenna|fixed-dish]]** pointed at it would lose it.

Fixing this is a pure plane change. Lesson 5 gave you the tool: turning a velocity of size $v$ through an angle $\Delta i$ costs

$$
\Delta v = 2v\sin\!\left(\frac{\Delta i}{2}\right).
$$

At GEO the circular speed is $v = \sqrt{\mu/r} = 3.0747\,\mathrm{km/s}$.

::: example Turning an inclination drift rate into a yearly Δv budget
Suppose the tilt grows at $0.85^\circ$ per year and you correct it once a year.

**Step 1: half the angle.** $\Delta i/2 = 0.85^\circ/2 = 0.425^\circ$.

**Step 2: its sine.** $\sin 0.425^\circ = 0.007\,417$.

**Step 3: the cost.**

$$
\Delta v = 2 \times 3.0747 \times 0.007\,417 = 0.045\,61\,\mathrm{km/s} = 45.6\,\mathrm{m/s} \text{ per year}.
$$

**Step 4: the range.** The drift rate quoted for GEO runs from about $0.75^\circ$ to $0.95^\circ$ per year, depending on where we are in the 18.6-year cycle. The same formula gives $40.2$ to $51.0\,\mathrm{m/s}$ per year.

**Sanity check.** Real GEO operators budget about $45$–$55\,\mathrm{m/s}$ per year for this. Our number lands right in that band.

That makes it by far the biggest single item in a GEO satellite's lifetime propellant budget. A satellite built for fifteen years of service needs about $15 \times 45.6 \approx 684\,\mathrm{m/s}$ — call it $700\,\mathrm{m/s}$ — for north-south correction alone.
:::

The other direction, east-west, is much cheaper. Earth's equator is not a perfect circle. It is very slightly oval, a shape called **[[triaxiality|triaxiality]]** (Earth has three different axis lengths instead of two). That oval pulls a GEO satellite slowly east or west along the equator, toward one of two stable resting longitudes. Holding the satellite's assigned longitude against this pull costs only a few metres per second a year, because the oval is a far weaker effect than the Moon and Sun's pull out of the plane.

::: key GEO station-keeping is dominated by north-south
North-south (inclination) correction, driven by lunisolar perturbation, costs roughly $45$–$55\,\mathrm{m/s}$ per year and dominates. You get it from the plane-change formula $\Delta v = 2v\sin(\Delta i/2)$ applied to the yearly drift. East-west (longitude drift from Earth's triaxiality) costs only about $2$–$4\,\mathrm{m/s}$ per year, because the perturbing pull behind it is much weaker.
:::

## LEO station-keeping: making up for drag

In low Earth orbit the enemy is air. At $500\,\mathrm{km}$ the atmosphere is incredibly thin, but a satellite plows through it at about $7.6\,\mathrm{km/s}$, and that thin air is enough to act like a very gentle brake. **Drag** — the force of air resisting motion — takes a little energy every orbit, so the orbit's size, its semi-major axis $a$, slowly shrinks.

How fast it shrinks depends on the air density, the satellite's size and mass, and its shape. The next module packages those into one number, the **ballistic coefficient**. Air density is also wildly variable. It swings with the **[[solar cycle|solar-cycle]]**, the Sun's roughly eleven-year rhythm of activity.

Whatever the decay rate is, the fix is the same small two-burn raise this module has used again and again — a **mini-Hohmann** reboost. Burn once to raise the far side of the orbit back up, then burn again half an orbit later to make it circular.

::: example An illustrative reboost budget
A satellite flies at $500\,\mathrm{km}$ altitude, so $r = 6378.137 + 500 = 6878.137\,\mathrm{km}$ from Earth's center. Suppose it has sunk by $2\,\mathrm{km}$ over some period. (That $2\,\mathrm{km}$ is made up for the example. The real number depends on the Sun's activity, and you should not guess it without a density model.)

**The transfer.** Go from a circle at $6876.137\,\mathrm{km}$ back to a circle at $6878.137\,\mathrm{km}$ with a Hohmann transfer. The lesson 2 formulas give

$$
\Delta v_1 = 0.5535\,\mathrm{m/s}, \qquad \Delta v_2 = 0.5535\,\mathrm{m/s}, \qquad \text{total } 1.107\,\mathrm{m/s}.
$$

**How it scales.** Repeat for other amounts of sinking. A $1\,\mathrm{km}$ loss costs $0.553\,\mathrm{m/s}$ to restore. A $4\,\mathrm{km}$ loss costs $2.215\,\mathrm{m/s}$. Double the loss, double the cost: for small changes the cost is **[[proportional to the lost height|why-linear]]**.

**Sanity check.** About half a metre per second per kilometre. That is tiny next to the $7.6\,\mathrm{km/s}$ orbital speed, as it should be for such a small change.
:::

That proportionality is handy. An operator can measure how many kilometres a satellite loses per year, multiply by about $0.55\,\mathrm{m/s}$ per kilometre, and have a yearly reboost budget without working the maneuver out again each time.

The catch is the decay rate itself. At a given altitude it can change by a factor of ten or more between the quiet and busy phases of the solar cycle. That is why LEO station-keeping budgets are far less certain than GEO's. The Moon and Sun follow a slow, well-known schedule; the Sun's weather does not.

::: warning A yearly LEO reboost budget hides a lot of variability
GEO's north-south budget is driven by a slow, well-modelled lunisolar cycle. LEO drag is driven by solar activity, which can change the air density at your altitude by ten times or more within one solar cycle. A reboost budget sized for typical conditions can be badly wrong at solar maximum. Real missions carry extra margin on this line in particular, and the next module treats uncertainty in density models as a subject of its own.
:::

## Drift orbits: moving on purpose

Picture two runners on a circular track. If one moves to a slightly larger lane, each lap is a little longer, and she slowly falls behind. Move her back to the original lane later and she keeps pace again, now at a new spot in the pack.

That is exactly the phasing trick from lesson 7. A chaser changes its period a little, waits while it drifts, and changes back. The same trick is how a GEO satellite moves to a new longitude slot, and how a new constellation spreads its satellites around their orbit.

For GEO there is one twist. The "target" is the ground. A GEO satellite's period matches one turn of the Earth, so it stays over one longitude. Raise it a little and its period gets longer than a day, so it falls behind the turning Earth. Seen from the ground it **[[drifts west|drift-west]]**. Lower it a little and it drifts east.

Lesson 7 gave the drift rate for small offsets: a change $\delta a$ in the orbit's size changes the period by about $\frac{3}{2}\frac{\delta a}{a}$ of itself, so the drift rate is about

$$
\dot\lambda \approx \frac{3}{2}\,\frac{|\delta a|}{a}\,n,
$$

where $\dot\lambda$ ("lambda dot") is the rate of change of longitude and $n$ is the orbit's **mean motion**, its average turning rate — for GEO about $361^\circ$ per day.

::: example Moving a GEO satellite 5° west
**Step 1: the raise.** Raise the orbit from $a = 42\,164\,\mathrm{km}$ by $\delta a = 25\,\mathrm{km}$ with a mini-Hohmann. The two burns are $\Delta v_1 = \Delta v_2 = 0.456\,\mathrm{m/s}$, so the raise costs $0.911\,\mathrm{m/s}$.

**Step 2: the drift rate.** The new period is $86\,240\,\mathrm{s}$, about $77\,\mathrm{s}$ longer than GEO's $86\,164\,\mathrm{s}$. The satellite falls behind the ground by $0.321^\circ$ per day. The shortcut agrees: $\frac{3}{2} \times \frac{25}{42\,164} \times 361 = 0.321^\circ$ per day.

**Step 3: the wait.** To drift $5^\circ$ takes $5 / 0.321 = 15.6$ days.

**Step 4: stopping.** A matching pair of burns lowers the satellite back to GEO height at its new slot, another $0.911\,\mathrm{m/s}$.

**Total:** $2 \times 0.911 = 1.82\,\mathrm{m/s}$ for the whole move.

**Sanity check.** That is tiny next to the $45$–$55\,\mathrm{m/s}$ a year spent on north-south correction. But the move takes over two weeks. It is the same trade this module keeps showing: less Δv costs more time.
:::

A new constellation uses the same idea, often without a separate waiting phase. Satellites released from one rocket at slightly different times, or raised to their working altitude on slightly different schedules, spend different amounts of time at different heights. So each one drifts a different amount along the orbit before it settles at the final altitude. Planned carefully, that spreads them around the plane at whatever spacing the mission needs.

This is the "slow raise doubles as phasing" point from lesson 9 about **[[Starlink-style deployment|low-deploy]]**, now seen as one case of the general drift-orbit technique. It is also why operators raise these satellites with electric thrusters over weeks instead of a quick chemical burn: the slow raise saves propellant *and* spaces out the constellation for free, and a satellite that dies in its low starting orbit re-enters on its own.

## A lifetime budget with margin

With station-keeping, relocation and disposal priced, you can add them up the way a real program does. A **Δv budget** is a list of every maneuver the mission will fly and what each one costs. **Margin** is extra Δv kept on top of the list, for the things you cannot predict: a worse drift year, a burn that comes out a little short, an unplanned move.

::: example A fifteen-year GEO operations budget
Add up the on-orbit life of a GEO satellite, using this lesson's numbers.

| Line | How it is worked out | Δv |
| --- | --- | --- |
| North-south | $15 \times 45.6\,\mathrm{m/s}$ | $684.2\,\mathrm{m/s}$ |
| East-west | $15 \times 3\,\mathrm{m/s}$ (middle of $2$–$4$) | $45.0\,\mathrm{m/s}$ |
| Two $5^\circ$ relocations | $2 \times 1.82\,\mathrm{m/s}$ | $3.6\,\mathrm{m/s}$ |
| Graveyard disposal | worked out below | $10.9\,\mathrm{m/s}$ |
| **Sum** | | $743.7\,\mathrm{m/s}$ |

Suppose the program's rules call for $10\%$ **[[margin|budget-margin]]** on top. That is $0.10 \times 743.7 = 74.4\,\mathrm{m/s}$, for a total of $743.7 + 74.4 = 818.1\,\mathrm{m/s}$.

**Sanity check.** North-south is about $92\%$ of the sum ($684.2 / 743.7$). If you want to save propellant on a GEO satellite, that is the line to attack — which is why some operators let old satellites drift in inclination late in life, trading some ground-antenna convenience for years of extra service.
:::

## End of life: deorbit and graveyard disposal

A mission's last maneuver gets rid of the spacecraft. How much that costs depends hugely on where it lives.

In LEO, disposal usually means lowering the low point of the orbit — the **perigee** — down into the atmosphere, and letting drag finish the job. Only one burn is needed. The satellite is not trying to be circular again; it only has to make sure the air catches it.

::: example Deorbiting from a 700 km orbit
**Step 1: the starting orbit.** $r = 6378.137 + 700 = 7078.137\,\mathrm{km}$, so the circular speed is $v_c = \sqrt{\mu/r} = 7.5043\,\mathrm{km/s}$.

**Step 2: the new ellipse.** Burn backward (a **retrograde** burn, against the direction of motion) to drop the perigee to $100\,\mathrm{km}$ altitude, $r_p = 6478.137\,\mathrm{km}$. The burn point becomes the high point of an ellipse with

$$
a = \frac{7078.137 + 6478.137}{2} = 6778.137\,\mathrm{km}.
$$

**Step 3: speed needed at the high point.** Vis-viva gives

$$
v = \sqrt{\mu\left(\frac{2}{r} - \frac{1}{a}\right)} = \sqrt{398\,600.4418\left(\frac{2}{7078.137} - \frac{1}{6778.137}\right)} = 7.3363\,\mathrm{km/s}.
$$

**Step 4: the burn.** $\Delta v = 7.5043 - 7.3363 = 0.16795\,\mathrm{km/s} = 167.95\,\mathrm{m/s}$.

**Sanity check.** About $2\%$ of the orbital speed. A small slow-down, but many times any single station-keeping burn.
:::

GEO is different. It is too high to drop into the atmosphere at any sensible cost. Instead, international guidelines ask operators to raise a dead satellite into a **[[graveyard orbit|graveyard]]** — a "supersynchronous" orbit a few hundred kilometres *above* GEO, out of the way of working satellites.

::: example Retiring a GEO satellite instead
Raise the orbit by $300\,\mathrm{km}$, from $42\,164\,\mathrm{km}$ to $42\,464\,\mathrm{km}$, with a Hohmann transfer:

$$
\Delta v_1 = 5.445\,\mathrm{m/s}, \qquad \Delta v_2 = 5.435\,\mathrm{m/s}, \qquad \text{total } 10.88\,\mathrm{m/s}.
$$

**Compare with LEO.** The LEO deorbit cost $167.95\,\mathrm{m/s}$. The ratio is $167.95 / 10.88 = 15.4$, so GEO disposal costs about a fifteenth as much.

**Why so cheap?** GEO disposal only has to nudge the satellite clear of a narrow belt. It does not have to fall down the gravity well into the air. For comparison, dropping a GEO satellite's perigee to $100\,\mathrm{km}$ altitude would take about $1.49\,\mathrm{km/s}$ — some 140 times the graveyard cost.
:::

Keep the contrast as a rule of thumb. LEO disposal is expensive next to one station-keeping burn but cheap next to reaching orbit. GEO disposal is nearly free by comparison, because "clear of the belt" is a far smaller ask than "back into the atmosphere".

::: warning Deorbit Δv is not the same question as deorbit time
Dropping perigee to $100\,\mathrm{km}$ makes re-entry certain, but not instant: drag has to finish the job over the next passes through the thin upper air. A lower target perigee brings the satellite down sooner and more predictably — which matters when you want the pieces that survive to fall in an empty stretch of ocean — but it costs more. Aiming at $50\,\mathrm{km}$ instead of $100\,\mathrm{km}$ from the same $700\,\mathrm{km}$ orbit costs $182.8\,\mathrm{m/s}$ instead of $167.95\,\mathrm{m/s}$. It is this module's Δv-for-time trade once more.
:::

## Check yourself

::: check
A GEO operator measures an inclination drift of $0.90^\circ$ per year this year, instead of the typical $0.85^\circ$. What is the yearly north-south correction Δv?
:::

::: answer
Half the angle is $0.45^\circ$, and $\sin 0.45^\circ = 0.007\,854$. So

$$
\Delta v = 2 \times 3.0747 \times 0.007\,854 = 0.048\,30\,\mathrm{km/s} = 48.3\,\mathrm{m/s} \text{ per year}.
$$

That is still inside the $45$–$55\,\mathrm{m/s}$ per year band, as you would expect for a small change in drift rate. (For angles this small, the cost is almost exactly proportional to the angle: $45.6 \times 0.90/0.85 = 48.3$.)
:::

::: check
Explain why GEO east-west station-keeping costs so much less than north-south, in terms of what drives each one.
:::

::: answer
North-south correction fights the Moon and Sun pulling the orbit plane out of the equator. That is a fairly strong perturbation, and the plane-change formula turns its drift into tens of metres per second each year.

East-west drift comes from Earth's equator being very slightly oval (triaxiality). That is a much weaker pull, so it causes a much slower drift and needs a much smaller correction — a few metres per second a year.

The method is the same for both: take the drift rate and turn it into Δv with the right burn formula. The difference is the strength of the physical cause, roughly ten times apart.
:::

::: check
The LEO reboost example gives a precise Δv per kilometre, but refuses to give a precise yearly budget. Why?
:::

::: answer
The per-kilometre figure is pure orbital mechanics. A $2\,\mathrm{km}$ mini-Hohmann at $500\,\mathrm{km}$ has one exact Δv, whatever the air is doing.

The yearly budget also needs the decay rate — how many kilometres are lost per year. That depends on air density, which can change by ten times or more with solar activity. This module has not modelled density; the next one does. Stating a confident yearly number without that model would claim a precision the physics does not support.
:::

::: check
A GEO satellite must move $8^\circ$ **east**. Using this lesson's $25\,\mathrm{km}$ drift orbit as a starting point, what do you do, how long does it take, and what changes if the move must be done in half the time?
:::

::: answer
East means the satellite must get *ahead* of the turning Earth, so it needs a *shorter* period. **Lower** the orbit by $25\,\mathrm{km}$ instead of raising it. The drift rate is the same size, about $0.321^\circ$ per day, now eastward.

**Time:** $8 / 0.321 = 24.9$ days. **Cost:** about $1.82\,\mathrm{m/s}$ for the lowering and the matching raise back, the same as before. The offset only sets the *rate*; a bigger angle only takes longer.

**Half the time** (about $12.5$ days) needs about twice the drift rate. Drift rate grows in proportion to the offset, so lower by about $50\,\mathrm{km}$. The mini-Hohmann cost also grows in proportion to the offset, so the total roughly doubles, to about $3.65\,\mathrm{m/s}$.
:::

::: check
Why does GEO disposal raise the satellite into a graveyard orbit, instead of lowering it until it re-enters the way a LEO satellite does?
:::

::: answer
Lowering a GEO satellite until its perigee touches the atmosphere would cost about $1.49\,\mathrm{km/s}$ — far more than any satellite keeps in reserve at the end of its life.

Raising it a few hundred kilometres into a graveyard orbit costs only about $11\,\mathrm{m/s}$. The goal is only to clear the narrow, valuable GEO belt, not to fall all the way down the gravity well into the air.
:::

## Summary

| Idea | In one line |
| --- | --- |
| GEO north-south | $\Delta v = 2v\sin(\Delta i/2)$ on the yearly lunisolar drift; about $45$–$55\,\mathrm{m/s}$ per year at $v_{\text{GEO}} = 3.0747\,\mathrm{km/s}$ |
| GEO east-west | about $2$–$4\,\mathrm{m/s}$ per year; driven by triaxiality, much weaker than lunisolar |
| LEO reboost | mini-Hohmann; Δv grows in proportion to the lost height (about $0.55\,\mathrm{m/s}$ per km at $500\,\mathrm{km}$); yearly total depends on drag |
| Drift orbit | same change-period-and-wait as phasing (lesson 7); raise to drift west, lower to drift east |
| GEO relocation | $\delta a = 25\,\mathrm{km}$ gives $0.321^\circ$ per day for $1.82\,\mathrm{m/s}$ in all |
| Δv budget | list every maneuver, add them, then add margin on top |
| LEO deorbit ($700\,\mathrm{km}$ to $100\,\mathrm{km}$ perigee) | one retrograde burn, $167.95\,\mathrm{m/s}$ |
| GEO graveyard ($+300\,\mathrm{km}$) | two-burn raise, $10.88\,\mathrm{m/s}$ — about a fifteenth of the LEO deorbit |

The last lesson of the module leaves Earth orbit behind and takes this Δv toolkit between the planets: how a spacecraft leaves one planet's pull and enters another's, how a flyby can speed it up for free, and how mission designers scan a whole launch season for the cheapest day to go.

::: context lunar-nodal-cycle Why the drift rate changes over 18.6 years
The Moon's orbit is tilted about $5.14^\circ$ to the plane of Earth's orbit around the Sun, and Earth's equator is tilted $23.44^\circ$ to that same plane. The Moon's tilted orbit slowly wobbles around, once every 18.6 years. When its tilt lines up with Earth's, the Moon's orbit sits about $23.44 + 5.14 \approx 28.6^\circ$ from the equator. Half a cycle later it sits only about $23.44 - 5.14 \approx 18.3^\circ$ from it.

The farther the Moon strays from the equator's plane, the harder it tugs a GEO orbit out of that plane. That is why the drift rate runs from about $0.75^\circ$ to $0.95^\circ$ a year depending on the year.
:::

::: context fixed-dish Why a satellite TV dish can stay still
A home satellite dish is bolted in place. It has no motor to follow anything. That only works because a geostationary satellite stays over the same spot, so the dish can point at one fixed patch of sky forever.

If the orbit tilts by $i$, the satellite swings north and south by about $i$ degrees every day, as seen from Earth's center. A small dish has a beam only a few degrees wide, so a tilt of a few degrees is enough to lose the signal for part of every day. That is what north-south station-keeping protects.
:::

::: context triaxiality Earth's slightly oval equator
Earth is fat at the equator — that is its big, well-known bulge. But the equator itself is also very slightly oval rather than a perfect circle. So Earth has three different "radii": pole to pole, and two across the equator. That is what **triaxial** means: three unequal axes.

The difference across the equator is tiny — tens of metres out of $6378\,\mathrm{km}$ — but a GEO satellite feels it over months. It gets pulled along the equator toward one of two stable longitudes, near $75^\circ$ east (over the Indian Ocean) and near $105^\circ$ west (over the eastern Pacific). A satellite parked anywhere else drifts toward the nearer one unless small east-west burns hold it in place.
:::

::: context solar-cycle The Sun's eleven-year weather
The Sun's activity rises and falls on a cycle of about eleven years. At solar maximum it sends out more ultraviolet light and more storms of charged particles. These heat Earth's upper atmosphere, which swells upward. At a fixed height, such as $500\,\mathrm{km}$, the air becomes much denser, so drag gets much stronger.

A sudden storm can do this within days. In February 2022, a geomagnetic storm thickened the air right as SpaceX released 49 Starlink satellites into a very low starting orbit, and about 40 of them re-entered before they could climb away. That is the kind of variability a LEO budget has to survive.
:::

::: context why-linear Why the reboost cost grows in proportion
For a small raise, you can see the proportion directly. The circular orbit at radius $a$ has speed $v$, and the transfer ellipse is only $\delta a/2$ bigger. Put that into vis-viva and keep only the first-order change in the square root: each of the two burns costs about $\frac{v}{4}\frac{\delta a}{a}$, so together

$$
\Delta v_{\text{total}} \approx \frac{v}{2}\,\frac{\delta a}{a}.
$$

At $500\,\mathrm{km}$: $\frac{7612.6}{2} \times \frac{2}{6878.1} = 1.107\,\mathrm{m/s}$, matching the exact answer. The exact points below sit on a straight line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="120" y1="170" x2="120" y2="175"/><line x1="190" y1="170" x2="190" y2="175"/>
    <line x1="260" y1="170" x2="260" y2="175"/><line x1="330" y1="170" x2="330" y2="175"/>
    <line x1="45" y1="114" x2="50" y2="114"/><line x1="45" y1="58" x2="50" y2="58"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="188">0</text><text x="120" y="188">1</text><text x="190" y="188">2</text>
    <text x="260" y="188">3</text><text x="330" y="188">4</text>
    <text x="195" y="204">height lost (km)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="42" y="174">0</text><text x="42" y="118">1</text><text x="42" y="62">2</text>
  </g>
  <text x="56" y="16" font-size="11" fill="#1f2a44">total Δv (m/s)</text>
  <line x1="50" y1="170" x2="330" y2="46" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="120" cy="139" r="4" fill="#1d6fd1"/>
  <circle cx="190" cy="108" r="4" fill="#1d6fd1"/>
  <circle cx="330" cy="46" r="4" fill="#1d6fd1"/>
  <g font-size="11" fill="#1d6fd1">
    <text x="128" y="152">0.553</text><text x="198" y="121">1.107</text><text x="286" y="38">2.215</text>
  </g>
</svg>
```
:::

::: context drift-west Higher is slower, so it falls behind
Seen from above the North Pole, Earth and the GEO slot turn counterclockwise, toward the east. A satellite raised a little (dashed ring, gap exaggerated) takes slightly longer than a day per lap, so it falls behind its slot and drifts west over the ground. Lower it, and it laps faster and drifts east. This is the same "speed up by going lower" puzzle that tripped up the Gemini 4 crew in lesson 7.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="110" r="70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="110" r="84" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="215" cy="49.4" r="5" fill="#1d6fd1"/>
  <text x="222" y="40" font-size="11" fill="#1d6fd1">slot</text>
  <circle cx="244.3" cy="56" r="5" fill="#b4232c"/>
  <text x="256" y="64" font-size="11" fill="#b4232c">raised satellite:</text>
  <text x="256" y="78" font-size="11" fill="#b4232c">lags, drifts west</text>
  <path d="M 145,49.4 A 70,70 0 0,0 112.4,91.9" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="110.3,99.6 107.6,90.6 117.2,93.2" fill="#1f2a44"/>
  <text x="40" y="36" font-size="11" fill="#1f2a44">turning east</text>
  <text x="180" y="212" font-size="11" text-anchor="middle" fill="#6c7a93">seen from above the North Pole · gap not to scale</text>
</svg>
```
:::

::: context low-deploy Deploy low, climb slowly
Starlink satellites are released well below their working altitude and climb for weeks on their own electric thrusters. Lesson 9 gave the reasons: the thrusters' high specific impulse saves propellant even though a spiral needs more Δv; a satellite that fails early is left in a low orbit that drag clears within a few years or less; and satellites that start climbing on different days end up spread around the plane. The drift orbit in this lesson is the same spreading, done on purpose with two small burns.
:::

::: context budget-margin Why engineers carry margin
Margin is not padding for sloppy work. It covers what cannot be known at design time: a stormy solar cycle, a thruster that performs a percent below spec, a relocation a customer asks for in year nine. Programs usually set margin by rule and shrink it as the design firms up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="250.9" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="280.9" y="40" width="16.5" height="30" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <rect x="297.4" y="40" width="1.3" height="30" fill="#6c7a93"/>
  <rect x="298.7" y="40" width="4.0" height="30" fill="#1f2a44"/>
  <rect x="302.7" y="40" width="27.3" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="30" y="18" font-size="11" fill="#1f2a44">15-year GEO budget, m/s · total 818</text>
  <text x="155" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">north-south 684</text>
  <text x="289" y="34" font-size="11" text-anchor="middle" fill="#1d6fd1">E-W 45</text>
  <text x="316" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">margin 74</text>
  <text x="350" y="108" font-size="11" text-anchor="end" fill="#1f2a44">moves 4 + disposal 11: thin slivers</text>
</svg>
```

Here the bar is drawn to scale: north-south correction swamps everything else.
:::

::: context graveyard How high is high enough
The international debris guidelines give a formula for how far above GEO a retired satellite's lowest point should be: at least $235\,\mathrm{km}$, plus an extra amount that grows with how much sunlight pressure can push the satellite around (large, light satellites get pushed more). For most satellites that works out to a few hundred kilometres, which is why the example used $300\,\mathrm{km}$. The $235\,\mathrm{km}$ itself is GEO's protected band ($200\,\mathrm{km}$) plus $35\,\mathrm{km}$ of room for the Moon, the Sun and Earth's lumpy gravity to disturb the old orbit without letting it wander back in.
:::
