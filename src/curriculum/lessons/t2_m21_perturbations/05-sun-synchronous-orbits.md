---
id: l05-sun-synchronous-orbits
title: Designing a sun-synchronous orbit
minutes: 16
covers:
  - sun-synchronous orbits
---

Imagine taking a photo of your street every day at exactly 10:30 in the morning. The shadows fall the same way in every picture. If a tree disappears or a new roof goes up, you can see it at once, because nothing else has changed. Now imagine taking the photos at random times. The shadows swing around from picture to picture, and spotting real changes gets much harder.

Earth-imaging satellites want the first kind of photo. Landsat, Sentinel-2, most weather satellites and most spy satellites fly at an inclination near $98^\circ$ — a few degrees past polar — at heights between about $400$ and $800\,\mathrm{km}$. That tilt is no accident. At each height there is exactly one inclination that makes last lesson's node drift keep pace with Earth's trip around the Sun. The result is a **sun-synchronous orbit**: the satellite crosses the equator at the same local time of day on every pass, all year round, with the same lighting and the same shadows.

This lesson turns the node-drift formula around. Instead of asking "how fast does this orbit's node drift?", it asks "what inclination makes the drift equal the rate I need?" Then it checks the answer with a full simulation.

## The Sun's slow walk around the sky

Earth goes around the Sun once a year. Seen from Earth, that means the direction to the Sun turns all the way around — $360^\circ$ — once a year, moving eastward against the stars.

Now think about an orbit plane that stays fixed in space. In January it might face the Sun edge-on, so the satellite crosses the equator at dawn and dusk. Three months later Earth has moved a quarter of the way around the Sun, but the plane has not turned. Now the plane points straight at the Sun, and the equator crossings happen at noon and midnight. The lighting in the pictures has **[[changed completely|fixed-plane]]**.

The fix is to make the orbit plane turn too — eastward, at the same rate as the Sun's direction. The node has to advance by $360^\circ$ in one **[[tropical year|tropical-year]]** of $365.2421897$ days:

$$
\dot\Omega_{\text{target}} = \frac{360^\circ}{365.2421897\ \text{days}} = 0.985\,647^\circ/\mathrm{day} .
$$

In radians per second, divide $2\pi$ by the number of seconds in that year, $365.2421897 \times 86\,400 = 3.1557\times10^7\,\mathrm{s}$:

$$
\dot\Omega_{\text{target}} = \frac{2\pi}{365.2421897\times86\,400\,\mathrm{s}} = 1.991\,06\times10^{-7}\,\mathrm{rad/s} .
$$

Notice the sign: the target is **positive**. The node must move *east*, the same way the Sun appears to move. Keep that in mind; it is about to matter a great deal.

### Local time of the ascending node

Because the plane keeps a fixed angle to the Earth–Sun line, the satellite crosses the equator going north at the same local **[[mean solar time|mean-solar-time]]** every day. That time is called the **local time of the ascending node**, or **LTAN** (say it "L-tan"). The LTAN tells you what time of day it is on the ground under the satellite as it crosses the equator heading north.

A mission can pick any LTAN it likes. A 10:30 crossing gives morning light with good shadows for optical cameras. A **[[dawn–dusk orbit|dawn-dusk]]** (LTAN of 6:00 or 18:00) rides along the line between day and night, so its solar panels are almost always in sunlight. But every sun-synchronous orbit, whatever its LTAN, needs the same $\dot\Omega_{\text{target}}$.

## Solving for the inclination

Last lesson's secular node rate is

$$
\dot\Omega = -\frac{3}{2}nJ_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2}, \qquad n = \sqrt{\mu/a^3} .
$$

Set it equal to the target, and solve for $\cos i$ by dividing both sides by everything in front of $\cos i$:

$$
-\frac{3}{2}nJ_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2} = \dot\Omega_{\text{target}} \quad\Longrightarrow\quad
\cos i = -\frac{2\,\dot\Omega_{\text{target}}\,(1-e^2)^2}{3nJ_2(R_E/a)^2} .
$$

Almost every sun-synchronous satellite flies a nearly circular orbit, so set $e = 0$. Then put in $n = \sqrt{\mu}\,a^{-3/2}$ and $(R_E/a)^2 = R_E^2\,a^{-2}$. The two powers of $a$ in the bottom move to the top as $a^{3/2}\times a^{2} = a^{7/2}$:

$$
\cos i = -\frac{2\,\dot\Omega_{\text{target}}}{3J_2R_E^2\sqrt{\mu}}\;a^{7/2} .
$$

Everything in front of $a^{7/2}$ is a fixed number. So once you choose a height, the inclination is decided. That is why sun-synchronous design is usually said as "pick an altitude, then compute the inclination."

::: key Sun-synchronous condition
$\dot\Omega$ must equal $+1.99106\times10^{-7}\,\mathrm{rad/s}$ ($+0.9856^\circ/\mathrm{day}$): $360^\circ$ per tropical year, eastward, matching Earth's motion around the Sun. Setting the $J_2$ nodal rate equal to it gives
$$
\cos i = -\frac{2\,\dot\Omega_{\text{target}}\,(1-e^2)^2}{3nJ_2(R_E/a)^2} .
$$
The required inclination is retrograde: $\approx 97.0^\circ$ at $400\,\mathrm{km}$, $97.6^\circ$ at $550\,\mathrm{km}$, $98.6^\circ$ at $800\,\mathrm{km}$ (circular orbits).
:::

## Why it must be retrograde

Look at the signs. $n$, $J_2$, $(R_E/a)^2$ and $(1-e^2)^2$ are all positive. With the minus sign in front, the sign of $\dot\Omega$ is always the *opposite* of the sign of $\cos i$.

- A prograde orbit ($i < 90^\circ$) has $\cos i > 0$, so $\dot\Omega < 0$. Its node can only move west.
- The target is eastward, $\dot\Omega_{\text{target}} > 0$.
- So we need $\cos i < 0$, which means $i > 90^\circ$: a **retrograde** orbit, one that travels slightly against Earth's spin.

This is not a design choice. It is forced by the signs in the $J_2$ formula. No prograde orbit, at any height, can be sun-synchronous. It also means sun-synchronous launches head a little west of due south or due north, and **[[give up Earth's free push|retrograde-cost]]**.

::: key Why a sun-synchronous orbit is retrograde
The required nodal drift is positive (eastward), but the $J_2$ rate carries a factor of $\cos i$ with a leading minus sign. Positive $\dot\Omega$ therefore demands $\cos i < 0$, i.e. $i > 90^\circ$.
:::

::: example The inclination for a 550 km orbit, step by step
Use $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $J_2 = 1.082\,626\,68\times10^{-3}$, $R_E = 6378.137\,\mathrm{km}$ and $e = 0$. At $550\,\mathrm{km}$ altitude, $a = 6378.137 + 550 = 6928.137\,\mathrm{km}$.

**Step 1: mean motion.** $n = \sqrt{398\,600.4418/6928.137^3} = 1.094\,82\times10^{-3}\,\mathrm{rad/s}$.

**Step 2: size factor.** $(R_E/a)^2 = (6378.137/6928.137)^2 = 0.847\,53$.

**Step 3: the bottom of the fraction.** $3nJ_2(R_E/a)^2 = 3 \times 1.094\,82\times10^{-3} \times 1.082\,63\times10^{-3} \times 0.847\,53 = 3.0137\times10^{-6}\,\mathrm{rad/s}$.

**Step 4: the top.** $2\dot\Omega_{\text{target}} = 2 \times 1.991\,06\times10^{-7} = 3.982\,13\times10^{-7}\,\mathrm{rad/s}$.

**Step 5: divide, keeping the minus sign.** $\cos i = -\dfrac{3.982\,13\times10^{-7}}{3.0137\times10^{-6}} = -0.132\,13$. The units cancel, as they must for a cosine.

**Step 6: take the arccosine.** $i = \arccos(-0.132\,13) = 97.593^\circ$.

**Does it make sense?** $\cos i$ is negative and small, so $i$ is a little more than $90^\circ$ — retrograde and nearly polar, matching the real satellites.

Doing the same for three more heights gives this table:

| Altitude | $a$ (km) | $\cos i$ | $i$ |
| --- | --- | --- | --- |
| $400\,\mathrm{km}$ | $6778.137$ | $-0.12239$ | $97.030^\circ$ |
| $550\,\mathrm{km}$ | $6928.137$ | $-0.13214$ | $97.593^\circ$ |
| $700\,\mathrm{km}$ | $7078.137$ | $-0.14242$ | $98.188^\circ$ |
| $800\,\mathrm{km}$ | $7178.137$ | $-0.14959$ | $98.603^\circ$ |

Put any of these back into the node-rate formula and you get $0.985\,647^\circ/\mathrm{day}$ to at least five significant figures — as you should, since that is the equation we solved. Landsat 8 is a real check: it flies at about $705\,\mathrm{km}$ and $98.2^\circ$.

The inclination **[[grows with altitude|curve]]**. Higher up, both $n$ and $(R_E/a)^2$ are smaller, so $J_2$ has a weaker grip on the node. To still reach the same fixed target rate, $\cos i$ must be bigger in size, which means tilting farther past $90^\circ$.
:::

## Checking the design in a simulation

::: example Confirming the 550 km design by direct simulation
Take the circular $550\,\mathrm{km}$, $i = 97.593^\circ$ orbit from the table. Integrate the full $J_2$ equation of motion for $150$ orbits, exactly as last lesson did, and fit a straight line to $\Omega$ against time.

**Result.** The measured node rate is $0.9902^\circ/\mathrm{day}$. The target, which the formula matches by design, is $0.9856^\circ/\mathrm{day}$. The simulation runs $0.45\%$ fast, and the gap does not change when the integrator tolerance goes from $10^{-9}$ to $10^{-12}$.

**Why?** It is last lesson's mean-versus-osculating effect again. We started the simulation with $a = 6928.137\,\mathrm{km}$ at one instant. Averaged over one orbit, the semi-major axis is lower, about $6918.8\,\mathrm{km}$. Putting the averaged elements into the formula predicts $0.9910^\circ/\mathrm{day}$, within $0.08\%$ of the simulation.

**How big is the leftover drift?** The node runs ahead of the Sun by $0.99016 - 0.98565 = 0.00451^\circ/\mathrm{day}$. Over a year that adds up to about $0.00451 \times 365.25 \approx 1.65^\circ$. Since $15^\circ$ of node is one hour of local time, that is about $7$ minutes of LTAN drift per year.

**What an engineer does about it.** A first design pass, like the table, uses the formula directly and accepts an error of this size. A mission that needs the drift right to the last digit designs with mean elements, or adjusts the launch inclination slightly using a precise simulation of its own.
:::

::: warning Sun-synchronous is not the same as polar
At low altitude every sun-synchronous orbit is close to polar — within about $12^\circ$ of it for heights below $1500\,\mathrm{km}$. But the two ideas are different, and they only overlap by coincidence.

A truly polar orbit ($i = 90^\circ$ exactly) has $\cos i = 0$, so its node does not drift at all. That makes polar the one inclination that is guaranteed *not* to be sun-synchronous.

Going the other way, the required tilt keeps growing with height: about $99.5^\circ$ at $1000\,\mathrm{km}$ and about $102^\circ$ at $1500\,\mathrm{km}$. Above about $5970\,\mathrm{km}$ altitude there is no solution at all, because $\cos i$ would have to be less than $-1$, which no angle can do. Sun-synchronous orbits are a low-orbit trick, limited by how fast $J_2$'s grip fades with distance.
:::

## LTAN, and what J2 does not control

The inclination formula sets how *fast* the node turns. It says nothing about *where* the node starts. That starting point — the LTAN — is a separate choice, set by the time of day you launch and the node you aim for.

Two satellites can have the same height and the same inclination, both perfectly sun-synchronous, and cross the equator at completely different local times. One might cross at 10:30 for crisp, shadowed pictures. Another might fly dawn–dusk to stay in sunlight. A constellation that wants several looks a day at the same local time, or a formation that must share one orbit plane, has to match both things at once: the inclination (the drift rate) and the node (the drift's starting point).

Two more limits are worth knowing. First, the formula only gives the *secular* rate. It says nothing about the node's small wobble within each orbit — that is the next lesson. Second, $J_2$ is the biggest effect on the node but not the only one. Over a multi-year mission, the **[[Sun's own pull|inclination-drift]]** slowly changes the inclination, so the node rate slowly drifts off target. Real sun-synchronous missions carry propellant for occasional inclination trims for exactly this reason.

## Check yourself

::: check
Using only the sign of $\dot\Omega_{\text{target}}$ and the signs in the node-rate formula, explain why no prograde orbit can ever be sun-synchronous.
:::

::: answer
$\dot\Omega_{\text{target}}$ is positive: the node must advance eastward, like the Sun's yearly motion. In $\dot\Omega = -\tfrac32 nJ_2(R_E/a)^2\cos i/(1-e^2)^2$, every factor in front of $\cos i$ is positive, and there is a minus sign. So $\dot\Omega$ always has the opposite sign to $\cos i$. A prograde orbit has $i < 90^\circ$ and $\cos i > 0$, so $\dot\Omega < 0$: its node can only move west. To get a positive rate you need $\cos i < 0$, which means $i > 90^\circ$ — retrograde.
:::

::: check
Two sun-synchronous missions fly at $400\,\mathrm{km}$ and $800\,\mathrm{km}$. Without recomputing, which one needs the bigger departure from a polar inclination, and why?
:::

::: answer
The $800\,\mathrm{km}$ mission ($98.603^\circ$, against $97.030^\circ$ at $400\,\mathrm{km}$). Higher up, both the mean motion $n$ and the factor $(R_E/a)^2$ are smaller, so $J_2$'s grip on the node is weaker. To still produce the same fixed target rate, the $\cos i$ factor must do more of the work, so it must be bigger in size — which means tilting farther from $90^\circ$.
:::

::: check
A simulation of a sun-synchronous design shows a node rate $0.45\%$ faster than the target. Is this evidence that the orbit was designed with the wrong inclination?
:::

::: answer
No. Last lesson showed that a gap of this size and sign appears whenever a formula built for mean elements is fed the osculating elements of a single instant, and that the gap does not depend on step size or tolerance. It is a real, explainable bookkeeping effect, not a design error. Feeding the formula the orbit's averaged (mean) elements instead closes most of the gap, which confirms the inclination itself is right.
:::

::: check
A mission wants two satellites in the same sun-synchronous plane, $180^\circ$ apart around the orbit, to see each spot twice as often. Does the second satellite need a different inclination?
:::

::: answer
No. The node-rate formula depends only on $a$, $e$ and $i$. Where the satellite is around the orbit (its true anomaly) does not appear at all. Both satellites share $a$, $e$ and $i$, so they have exactly the same $\dot\Omega$, whatever their spacing. Placing them $180^\circ$ apart is a separate choice about phasing within the shared plane. It neither needs nor allows a different inclination.
:::

::: check
Describe in words what happens to the required inclination as the altitude climbs toward the limit of about $5970\,\mathrm{km}$ from the warning above.
:::

::: answer
As the orbit gets higher, the prefactor $nJ_2(R_E/a)^2$ shrinks, so $\cos i$ must get more and more negative to make up for it. The inclination climbs from about $98^\circ$ through $100^\circ$ and on toward $180^\circ$ — an equatorial orbit going backward. At the limit $\cos i = -1$, the most negative value a cosine can reach, and no higher orbit can be made sun-synchronous at all. In practice no mission goes anywhere near this. Real sun-synchronous satellites sit between about $96^\circ$ and $102^\circ$, below about $1500\,\mathrm{km}$, where the design trade is about temperature, camera resolution and how long drag lets the satellite stay up — not about whether a solution exists.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot\Omega_{\text{target}} = 2\pi/(365.2421897\times86\,400\,\mathrm{s}) = 1.99106\times10^{-7}\,\mathrm{rad/s}$ | Required node rate, $+0.9856^\circ/\mathrm{day}$ eastward; matches Earth's motion around the Sun |
| $\cos i = -2\dot\Omega_{\text{target}}(1-e^2)^2/\big[3nJ_2(R_E/a)^2\big]$ | Sun-synchronous inclination, from the $J_2$ node-rate formula |
| $\cos i \propto -a^{7/2}$ (circular) | The inclination is fixed once the altitude is chosen, and grows with altitude |
| Always retrograde | Positive target rate, but $\dot\Omega$ has the opposite sign to $\cos i$ |
| $97.03^\circ$, $97.59^\circ$, $98.19^\circ$, $98.60^\circ$ | Required inclination at $400$, $550$, $700$, $800\,\mathrm{km}$, circular |
| LTAN | Local mean solar time at the ascending node; set by launch time and target node, not by the inclination |
| No solution above about $5970\,\mathrm{km}$ | $\cos i$ would have to be less than $-1$ |
| Simulation check | $0.45\%$ fast using the starting (osculating) elements; $0.08\%$ using mean elements |

The next lesson makes the mean-versus-osculating idea precise. It measures how big the within-orbit wobble is, and explains why a secular rate must be measured from a trend line, never from a single state vector.

::: context fixed-plane A plane that stays put, and one that turns
Look down on Earth's path around the Sun from above. An orbit plane fixed in space (grey) keeps pointing the same way. In January it is side-on to the Sun: a dawn–dusk orbit. Three months later the same plane points straight at the Sun: a noon–midnight orbit. A sun-synchronous plane (blue) turns a quarter circle in those three months, so it stays side-on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <text x="8" y="14" font-size="11" fill="#1f2a44">April:</text>
  <text x="8" y="28" font-size="11" fill="#6c7a93">fixed plane is</text>
  <text x="8" y="42" font-size="11" fill="#6c7a93">noon–midnight</text>
  <g transform="translate(22,0)">
    <circle cx="120" cy="120" r="95" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
    <circle cx="120" cy="120" r="13" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="120" y="147" font-size="11" text-anchor="middle" fill="#1f2a44">Sun</text>
    <circle cx="215" cy="120" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <line x1="215" y1="92" x2="215" y2="148" stroke="#6c7a93" stroke-width="3"/>
    <text x="228" y="116" font-size="11" fill="#1f2a44">January:</text>
    <text x="228" y="130" font-size="11" fill="#1f2a44">dawn–dusk</text>
    <circle cx="120" cy="25" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <line x1="120" y1="4" x2="120" y2="46" stroke="#6c7a93" stroke-width="3"/>
    <line x1="94" y1="25" x2="146" y2="25" stroke="#1d6fd1" stroke-width="3"/>
    <text x="156" y="16" font-size="11" fill="#1d6fd1">sun-synchronous plane</text>
    <text x="156" y="30" font-size="11" fill="#1d6fd1">is still dawn–dusk</text>
    <path d="M208.1,84.4 A95,95 0 0,0 181.1,47.2" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="174.2,41.4 178.2,50.7 184.0,43.8" fill="#1f2a44"/>
    <text x="222" y="64" font-size="11" fill="#1f2a44">Earth moves 90°</text>
  </g>
</svg>
```
:::

::: context tropical-year Which year?
There is more than one kind of year. The **tropical year**, $365.2422$ days, is the time from one spring equinox to the next — the cycle of the seasons. The **sidereal year**, about $365.2564$ days, is one lap measured against the distant stars. They differ by about $20$ minutes because Earth's spin axis slowly wobbles. Node angles are measured from the equinox direction, which moves with that wobble, and the goal is to stay in step with the seasons' Sun, so the tropical year is the one used.
:::

::: context mean-solar-time Why "mean" solar time?
The real Sun is not a perfect clock. Because Earth's orbit is an ellipse and its axis is tilted, true noon (the Sun highest in the sky) drifts up to about $16$ minutes early or late over the year. Clocks and LTANs use an imaginary "mean Sun" that moves at a perfectly steady rate. A sun-synchronous orbit tracks that mean Sun, so its crossing time as read on a sundial wanders by a few minutes through the year even though its LTAN is fixed.
:::

::: context dawn-dusk Riding the line between day and night
Look at Earth from the Sun and you see only daytime. The line where day meets night is called the terminator. A dawn–dusk orbit flies right above it, with its plane side-on to the Sun, so the satellite looks down on sunrise on one side of its orbit and sunset on the other. Its solar panels are lit almost all the time. That suits radar satellites, which make their own light and do not need the Sun on the ground, but do need a lot of power.
:::

::: context retrograde-cost The price of going backward
Earth's surface spins eastward, about $465\,\mathrm{m/s}$ at the equator. A rocket launched east gets that speed for free. A rocket going to a $98^\circ$ orbit heads slightly west of south (or north), so instead of getting a boost it has to cancel a little of Earth's spin. That is why sun-synchronous launches carry somewhat less mass to orbit than an eastward launch to the same height, and why they usually leave from sites with open ocean to the south, such as Vandenberg in California.
:::

::: context curve Inclination against altitude
The required inclination rises smoothly with height. The dots are the four heights in the table.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#e3e7ee" stroke-width="1">
    <line x1="40" y1="146.7" x2="330" y2="146.7"/><line x1="40" y1="123.3" x2="330" y2="123.3"/>
    <line x1="40" y1="100" x2="330" y2="100"/><line x1="40" y1="76.7" x2="330" y2="76.7"/>
    <line x1="40" y1="53.3" x2="330" y2="53.3"/><line x1="40" y1="30" x2="330" y2="30"/>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,162.4 62.3,154.3 84.6,146.0 106.9,137.3 129.2,128.3 151.5,118.9 173.8,109.3 196.2,99.2 218.5,88.8 240.8,78.0 263.1,66.9 285.4,55.3 307.7,43.4 330.0,31.0"/>
  <g fill="#b4232c">
    <circle cx="84.6" cy="146.0" r="4"/><circle cx="118.1" cy="132.8" r="4"/>
    <circle cx="151.5" cy="118.9" r="4"/><circle cx="173.8" cy="109.3" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="174">96°</text><text x="35" y="127">98°</text><text x="35" y="80">100°</text><text x="35" y="34">102°</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">200</text><text x="129.2" y="186">600</text><text x="218.5" y="186">1000</text><text x="330" y="186">1500</text>
  </g>
  <text x="185" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">altitude (km), circular orbit</text>
  <text x="60" y="40" font-size="11" fill="#1d6fd1">required inclination</text>
</svg>
```

It follows $\cos i \propto -a^{7/2}$: a small rise in $a$ makes a noticeably bigger change in $\cos i$.
:::

::: context inclination-drift The Sun nudges the tilt
The Sun's gravity, which a later lesson treats as a third-body effect, slowly changes a sun-synchronous orbit's inclination — by a few hundredths of a degree per year, depending on the LTAN. A changed inclination means a changed node rate, so the LTAN slowly wanders away from its design value, and the wander grows over time. Operators fire the engine now and then, sideways to the orbit plane, to put the inclination back.
:::
