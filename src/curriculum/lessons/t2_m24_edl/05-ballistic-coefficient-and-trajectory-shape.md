---
id: l05-ballistic-coefficient-and-trajectory-shape
title: Ballistic coefficient and the shape of the trajectory
minutes: 16
covers:
  - ballistic coefficient and its effect on the trajectory
---

Drop a badminton shuttlecock and a golf ball from a high balcony. They are about the same size, but the shuttlecock weighs a few grams and the golf ball about ten times more. The shuttlecock slows almost at once and drifts down gently. The golf ball barely notices the air and hits the ground hard. What separates them is not size and not mass alone. It is mass compared with how much drag the shape makes.

That comparison has a name you already know from lesson 2: the **[[ballistic coefficient|what-beta-means]]**,

$$
\beta = \frac{m}{C_D A},
$$

read "beta", in $\mathrm{kg/m^2}$. Here $m$ is the mass, $A$ the frontal area, and $C_D$ the drag coefficient, a number that says how draggy the shape is. A high $\beta$ is the golf ball: hard to slow down. A low $\beta$ is the shuttlecock: easy to slow down.

Lessons 2 through 4 kept finding the same pattern. Peak deceleration ignores $\beta$ completely. Peak heating rate and total heat load both grow as $\sqrt\beta$. That leaves a real question. If $\beta$ does not even touch the number every structural margin is built from, what is it *for*? Why would a mission choose one ballistic coefficient over another? This lesson answers by holding entry speed and angle fixed, sweeping $\beta$ alone through the numerical model lesson 3 checked, and tracking what the peak formulas leave out: how deep the vehicle gets, how long the entry takes, how far it travels, and how fast it is still going near the ground.

## Two new measurements: downrange and duration

Two quantities have not been defined yet in this module.

**Downrange distance** is how far the vehicle travels horizontally during entry. At each instant, the **[[horizontal part of the velocity|horizontal-part]]** is $v\cos\gamma$, where $\gamma$ ("gamma") is the flight-path angle. Add that up over the whole entry:

$$
s_{\mathrm{downrange}} = \int_0^{t_f} v\cos\gamma\, dt.
$$

Read the integral sign as "add up, moment by moment". This is the same idea as finding the distance a car drives by adding up its speed over each second.

**Entry duration**, $t_f$ ("t sub f", the final time), is the time from the $120\,\mathrm{km}$ entry interface down to ground level, $h = 0$.

Both are read straight off the **[[numerically integrated|numerical-integration]]** trajectory from lesson 3. The closed-form Allen-Eggers solution does not turn the downrange integral into anything as neat as the heat-load formula of lesson 4. In the heat-load integral, the powers of $\rho$ and $v$ lined up so that one substitution finished it. Here the $\cos\gamma$ and the time-to-altitude conversion leave nothing to pair with, so this module answers it numerically instead of forcing out an ugly formula.

## The sweep

Fix the entry state at $v_E = 7800\,\mathrm{m/s}$ and $\gamma_E = -6.5^\circ$, a typical shallow angle for a return from low Earth orbit. Then sweep $\beta$ from $50$ to $1600\,\mathrm{kg/m^2}$. That is a $32$-fold range, from a light capsule to a dense, slender reentry body. Peak heat rate uses the Sutton-Graves formula of lesson 4 with a $0.5\,\mathrm{m}$ nose radius.

| $\beta$ ($\mathrm{kg/m^2}$) | peak $a$ ($g_0$) | $h^*$ (km) | peak $\dot q$ ($\mathrm{W/cm^2}$) | duration (s) | downrange (km) | speed at ground (m/s) |
| --- | --- | --- | --- | --- | --- | --- |
| $50$ | $19.39$ | $52.06$ | $119.2$ | $591.9$ | $683.4$ | $28.4$ |
| $100$ | $19.42$ | $47.07$ | $168.9$ | $448.6$ | $727.1$ | $40.2$ |
| $200$ | $19.44$ | $42.08$ | $239.4$ | $349.4$ | $770.8$ | $57.2$ |
| $400$ | $19.47$ | $37.09$ | $339.4$ | $281.5$ | $814.5$ | $82.0$ |
| $800$ | $19.50$ | $32.10$ | $481.0$ | $236.1$ | $858.2$ | $119.4$ |
| $1600$ | $19.52$ | $27.11$ | $681.8$ | $206.9$ | $901.6$ | $177.3$ |

Here $h^*$ is the altitude of peak deceleration and $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. Four trends sit in this table. All four are what lessons 2 through 4 predict, once you know where to look.

### Trend 1: peak deceleration barely moves

Across a $32$-fold range of $\beta$, peak deceleration goes from $19.39$ to $19.52\,g_0$. That is a change of under one percent. This is lesson 2's result that peak deceleration does not depend on $\beta$, now seen in the full numerical model instead of the formula.

It is not *exactly* flat. The small drift comes from the same source as lesson 3's error at this angle: the real flight path bends as the vehicle descends, while the formula freezes it. How much it bends depends a little on how long the vehicle lingers up high, which depends weakly on $\beta$. But the main, $\beta$-free physics is plain to see in this column.

### Trend 2: the peak moves down in steady steps

Every time $\beta$ doubles, the peak **[[drops by about 5 km|doubling-ladder]]**. From $\beta = 50$ to $\beta = 1600$ it drops

$$
52.06 - 27.11 = 24.95\ \mathrm{km}.
$$

Lesson 2's formula predicts the spacing between two ballistic coefficients:

$$
h^*_1 - h^*_2 = H\ln\frac{\beta_2}{\beta_1} = 7200 \times \ln\frac{1600}{50} = 7200 \times \ln 32 = 7200 \times 3.466 = 24{,}950\ \mathrm{m}.
$$

That matches to four significant figures. Yet the *individual* altitudes do not match the formula that well. The formula puts each peak about $0.87\,\mathrm{km}$ higher than the numerical model does — $52.93\,\mathrm{km}$ instead of $52.06$ at $\beta = 50$, for example.

Why is the spacing right when each altitude is off? Because the error is almost the same in every row. It depends mainly on the entry angle, which is fixed here, not on $\beta$. When you subtract two altitudes at the same angle, the shared error cancels, like two clocks that are both five minutes fast still agreeing on how long a movie lasted.

### Trend 3: higher β, shorter entry

From the lightest vehicle to the heaviest, the entry gets shorter by a factor of $591.9/206.9 = 2.86$, nearly three. This can look backwards. Shouldn't a vehicle that resists slowing down take *longer* to come down?

No. Most of an entry's time is spent high up, in thin air, where drag is weak and little happens. A low-$\beta$ vehicle starts slowing up there. As it slows, its *descent rate* drops too, and the whole event stretches out. A high-$\beta$ vehicle passes through that thin-air stretch almost untouched, still fast, still descending quickly. It reaches the dense air — and its short, violent slowdown — sooner.

### Trend 4: higher β, farther and faster

Downrange distance grows by about a third across the table, from $683.4$ to $901.6\,\mathrm{km}$ (a factor of $1.32$). And the **[[speed at the ground|terminal-speed]]** grows sharply, from under $30\,\mathrm{m/s}$ to nearly $180\,\mathrm{m/s}$, in this idealized model where the exponential atmosphere runs all the way down.

Both say the same thing in two different units. A high-$\beta$ vehicle is hard to slow down. So it keeps more of its horizontal speed, covering more ground, and more of its total speed, arriving faster, than a low-$\beta$ vehicle given the very same entry state.

::: key What β actually controls
Holding entry speed and angle fixed, raising $\beta$:

- leaves peak deceleration essentially unchanged;
- pushes the peak (of both deceleration and heating) deeper into the atmosphere, by $H\ln(\beta_2/\beta_1)$;
- shortens the total entry duration;
- lengthens the downrange distance;
- raises the speed still left when the trajectory reaches low altitude.

None of this shows up in the peak-$g$ number alone. That is why $\beta$ is chosen on purpose, not minimized or maximized on reflex.
:::

::: example Two real vehicle classes, same entry state
**A crewed capsule.** A capsule with a $4\,\mathrm{m}$ heat shield and a mass near $9.5\,\mathrm{t}$ has $\beta \approx 540\,\mathrm{kg/m^2}$ (the worked figure from t1_m18). Check it: the frontal area is $\pi \times 2^2 = 12.57\,\mathrm{m^2}$, and with $C_D \approx 1.4$,

$$
\beta = \frac{9500}{1.4 \times 12.57} = \frac{9500}{17.6} \approx 540\ \mathrm{kg/m^2}.
$$

**A dense, slender body.** A reentry test body of similar mass but a small fraction of the frontal area might carry $\beta \approx 4000$–$8000\,\mathrm{kg/m^2}$.

**An iron meteoroid.** For a solid sphere, $\beta = \frac{4}{3}\rho_{\text{iron}}\,r / C_D$, so $\beta$ grows with size. A solid iron meteoroid a few meters across, with $C_D \approx 1$ and iron at $7870\,\mathrm{kg/m^3}$, reaches $\beta$ of about $20{,}000\,\mathrm{kg/m^2}$ ($r = 2\,\mathrm{m}$ gives $\frac{4}{3}\times7870\times2 \approx 21{,}000$).

**Same entry, different stories.** The capsule slows high and fairly gently, over hundreds of kilometers downrange and several minutes. That is exactly the profile a parachute system needs time to work with. The dense body plunges through with little slowing until very low altitude, and reaches the ground fast after a short, violent pulse deep in the atmosphere. This deep-diving case is what the analysis was first built for: **[[ballistic-missile warheads|warhead-origins]]**. All three can see similar peak $g$. Nothing else about their entries looks alike.
:::

::: example Sizing a landing footprint from downrange sensitivity
An entry team wants to know how much a small error in $\beta$ moves the landing point. Its vehicle has a nominal $\beta = 200\,\mathrm{kg/m^2}$, and manufacturing tolerances on mass and drag area give a $\pm5\%$ uncertainty: $\beta = 200 \pm 10\,\mathrm{kg/m^2}$.

**Step 1: read the slope off the table.** Look at the two rows either side of $200$. From $\beta = 100$ to $\beta = 400$, a factor of $4$, downrange grows from $727.1$ to $814.5\,\mathrm{km}$:

$$
814.5 - 727.1 = 87.4\ \mathrm{km}.
$$

**Step 2: turn it into "km per unit change of β".** The table's steps are doublings, so the natural slope is per unit of $\ln\beta$. A factor of $4$ is $\ln 4 = 1.386$ in $\ln\beta$:

$$
\frac{d(\text{downrange})}{d\ln\beta} \approx \frac{87.4}{1.386} = 63.0\ \mathrm{km}.
$$

At $\beta = 200$ that is $63.0/200 = 0.315\,\mathrm{km}$ for every $1\,\mathrm{kg/m^2}$.

**Step 3: apply the uncertainty.** A $\pm10\,\mathrm{kg/m^2}$ error moves the landing point by

$$
\pm 10 \times 0.315 = \pm 3.2\ \mathrm{km}.
$$

(The same thing from the other route: a $5\%$ error is $0.05$ in $\ln\beta$, and $0.05 \times 63.0 = 3.2\,\mathrm{km}$.)

**Does it make sense?** $3.2\,\mathrm{km}$ is tiny next to the $771\,\mathrm{km}$ total. It is not tiny next to a **[[landing ellipse|landing-ellipse]]** that a guided vehicle is trying to hit within a few kilometers of the aim point. An unguided ballistic vehicle has to accept this spread. The guided vehicles of lessons 8 and 10 exist largely to correct for it as they fly.
:::

## Check yourself

::: check
Why does a high-$\beta$ vehicle reach the ground *sooner* than a low-$\beta$ vehicle, even though it goes deeper into denser air before slowing?
:::

::: answer
Most of a ballistic entry's time is spent high up, in thin air, where drag is weak and little slowing happens, whatever $\beta$ is.

A high-$\beta$ vehicle passes through that slow stretch almost unaffected — it is "hard to slow down" by definition. It only slows sharply once it reaches dense air, deep in the atmosphere, and it gets there sooner precisely because nothing slowed it on the way.

A low-$\beta$ vehicle starts slowing much higher up. Slowing also cuts its descent rate, which stretches the whole event out.
:::

::: check
Two vehicles share an entry state. One has a $\beta$ four times the other's. Using lesson 2's result, how far apart are their peak-deceleration altitudes, in kilometers?
:::

::: answer
$$
h^*_1 - h^*_2 = H\ln\frac{\beta_2}{\beta_1} = H\ln 4 = 7200 \times 1.3863 = 9982\ \mathrm{m} \approx 10.0\ \mathrm{km}.
$$

The higher-$\beta$ vehicle peaks lower in the atmosphere by that amount, whatever entry angle or speed the two share. (In the table, four times $\beta$ is two doublings of about $5\,\mathrm{km}$ each — consistent.)
:::

::: check
The table shows peak deceleration changing by under one percent across a $32$-fold range of $\beta$ — but not by *exactly* zero, as the closed form predicts. Where does the small leftover change come from?
:::

::: answer
The table comes from the numerically integrated model of lesson 3, not the Allen-Eggers closed form. Lesson 3 showed that at this angle, most of the closed form's error comes from freezing the flight-path angle.

In the real trajectory, $\gamma$ changes as the vehicle descends. How much it changes depends on how the trajectory plays out, including how long the vehicle lingers high up — and that shifts slightly with $\beta$, even at a fixed entry angle.

So the formula's exact $\beta$-independence survives in the full model only approximately: a dominant effect, with a small, explainable leftover on top.
:::

::: check
Why does the *spacing* between peak altitudes for two ballistic coefficients match $H\ln(\beta_2/\beta_1)$ so closely in the numerical results, even though each individual altitude is off from the closed form?
:::

::: answer
The error between the closed form and the numerical model comes mainly from the entry angle $\gamma_E$, not from $\beta$. Lesson 3 showed the frozen-angle error is a function of how shallow the entry is, largely independent of the vehicle.

Here every row shares the same $\gamma_E$, and the closed form sits about $0.87\,\mathrm{km}$ above the numerical answer in every row. Subtracting two altitudes cancels that shared offset, leaving the spacing close to the pure closed-form value even where the individual altitudes are not.
:::

::: check
A mission wants to keep landing-point spread from a given *percentage* uncertainty in $\beta$ small, for an unguided ballistic vehicle. Does choosing a higher or a lower nominal $\beta$ help? How would you check?
:::

::: answer
Look at how much downrange each doubling of $\beta$ adds: $683.4 \to 727.1 \to 770.8 \to 814.5 \to 858.2 \to 901.6\,\mathrm{km}$. The steps are $43.7$, $43.7$, $43.7$, $43.7$ and $43.4\,\mathrm{km}$ — almost exactly the same.

Equal steps per doubling mean downrange grows by a fixed amount per unit of $\ln\beta$, about $43.7/\ln 2 = 63\,\mathrm{km}$. A given *percentage* error in $\beta$ is a fixed change in $\ln\beta$. So in this range, a $5\%$ error moves the landing point by about $0.05 \times 63 \approx 3\,\mathrm{km}$ whichever nominal $\beta$ you pick. Choosing a higher or lower $\beta$ barely helps.

To check properly, compute the slope $d(\text{downrange})/d\ln\beta$ at several candidate $\beta$ values with the numerical model, as the second worked example did at one point. This is the kind of question the module's numerical tools, not a memorized rule, are built to settle.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\beta = m/(C_D A)$ | Ballistic coefficient: mass per unit drag area, $\mathrm{kg/m^2}$ |
| $s_{\mathrm{downrange}} = \int v\cos\gamma\,dt$ | Horizontal distance traveled during entry; no clean closed form here, evaluated numerically |
| $t_f$ | Entry duration, interface to ground |
| Peak deceleration versus $\beta$ | Nearly flat — lesson 2's result, confirmed to under $1\%$ across a $32$-fold range |
| $h^*_1 - h^*_2 = H\ln(\beta_2/\beta_1)$ | Peak-altitude spacing, about $5\,\mathrm{km}$ per doubling; holds closely in the numerical model because the shared angle error cancels |
| Duration versus $\beta$ | Falls as $\beta$ rises — a high-$\beta$ vehicle reaches its deeper slowdown sooner |
| Downrange and ground speed versus $\beta$ | Both rise with $\beta$ — a high-$\beta$ vehicle keeps more of its speed all the way down |
| Downrange sensitivity | About $63\,\mathrm{km}$ per unit of $\ln\beta$ here, so $\pm5\%$ in $\beta$ gives about $\pm3\,\mathrm{km}$ |
| Typical $\beta$ | Capsule $\approx 540\,\mathrm{kg/m^2}$; dense reentry body several thousand; iron meteoroid a few meters across about $20{,}000$ |

The next lesson puts a deceleration limit and a heat-rate limit on top of this same numerical model and asks, for the first time in this module, a question with a hard numerical answer: over what range of entry angles can a vehicle actually fly?

::: context what-beta-means Mass per unit of drag
Think of $\beta$ as how many kilograms each square meter of "effective drag area" has to push through the air. Drag grabs area; inertia comes from mass. Pile more mass behind the same area and each square meter has more to haul, so the air slows it less. Some books define the inverse, $C_D A/m$, and call that the ballistic coefficient too — always check which one a source means before comparing numbers.
:::

::: context horizontal-part Splitting the velocity
The velocity arrow points along the path, tipped below the horizon by the flight-path angle. Split it into a flat part and a downward part, like the two short sides of a right triangle. The flat part is $v\cos\gamma$; it carries the vehicle downrange. The downward part is $v\sin\gamma$; it brings the vehicle lower. The angle here is exaggerated — real entries are only a few degrees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M30,30 Q220,40 320,160" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="20" y1="165" x2="340" y2="165" stroke="#1f2a44" stroke-width="2"/>
  <line x1="167.6" y1="55.6" x2="233.7" y2="78.8" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="241.2,81.4 229.0,82.8 232.6,72.4" fill="#1d6fd1"/>
  <line x1="167.6" y1="55.6" x2="233.7" y2="55.6" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="233.7" y1="55.6" x2="233.7" y2="78.8" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 3"/>
  <circle cx="167.6" cy="55.6" r="5" fill="#1f2a44"/>
  <text x="250" y="88" font-size="12" fill="#1d6fd1">v</text>
  <text x="200" y="47" font-size="12" text-anchor="middle" fill="#b4232c">v cos γ</text>
  <text x="240" y="70" font-size="11" fill="#1f2a44">v sin γ</text>
  <text x="30" y="20" font-size="11" fill="#6c7a93">path</text>
  <text x="180" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">ground</text>
</svg>
```
:::

::: context numerical-integration Adding up small steps
"Integrating numerically" means letting a computer march the equations of motion forward in tiny time steps. At each step it asks: given the current speed, angle and height, how fast is each changing? It then nudges all three forward by a small amount and repeats, thousands of times, until the vehicle reaches the ground. Good methods, like the one lesson 3 uses, adjust the step size on their own and are checked by making the steps smaller until the answer stops changing.
:::

::: context doubling-ladder Equal steps for each doubling
Because $h^*$ depends on $\ln\beta$, every doubling of $\beta$ moves the peak down by the same amount, $H\ln 2 = 7200 \times 0.693 = 4.99\,\mathrm{km}$. On an altitude scale the six vehicles sit like evenly spaced rungs of a ladder, even though their $\beta$ values run $50, 100, 200, \dots, 1600$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="20" x2="120" y2="185" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="114" y1="20" x2="120" y2="20"/><line x1="114" y1="75" x2="120" y2="75"/>
    <line x1="114" y1="130" x2="120" y2="130"/><line x1="114" y1="185" x2="120" y2="185"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="110" y="24">55 km</text><text x="110" y="79">45 km</text><text x="110" y="134">35 km</text><text x="110" y="189">25 km</text>
  </g>
  <g fill="#1d6fd1">
    <circle cx="120" cy="36.2" r="5"/><circle cx="120" cy="63.6" r="5"/><circle cx="120" cy="91.1" r="5"/>
    <circle cx="120" cy="118.5" r="5"/><circle cx="120" cy="145.9" r="5"/><circle cx="120" cy="173.4" r="5"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="132" y="40">β = 50: 52.1 km</text><text x="132" y="67.6">β = 100: 47.1 km</text>
    <text x="132" y="95.1">β = 200: 42.1 km</text><text x="132" y="122.5">β = 400: 37.1 km</text>
    <text x="132" y="149.9">β = 800: 32.1 km</text><text x="132" y="177.4">β = 1600: 27.1 km</text>
  </g>
  <path d="M268,36.2 L276,36.2 L276,63.6 L268,63.6" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="282" y="47" font-size="11" fill="#b4232c">5.0 km</text>
  <text x="282" y="61" font-size="11" fill="#b4232c">per doubling</text>
</svg>
```
:::

::: context terminal-speed Why the light vehicles land so slowly
When drag grows until it equals weight, a falling object stops speeding up. That speed is its **terminal speed**. At sea level, setting drag per unit mass $\rho_0 v^2/(2\beta)$ equal to $g$ gives $v = \sqrt{2\beta g/\rho_0}$. For $\beta = 50$ that is $\sqrt{2\times50\times9.81/1.225} = 28.3\,\mathrm{m/s}$ — almost exactly the $28.4\,\mathrm{m/s}$ in the table. The light vehicles have slowed all the way to terminal speed. At $\beta = 1600$ the terminal speed would be $160\,\mathrm{m/s}$, but the table shows $177\,\mathrm{m/s}$: the heaviest vehicle has not finished slowing when it reaches the ground.
:::

::: context warhead-origins Built for missiles first
Allen and Eggers did their entry analysis at NACA in the early 1950s to understand how ballistic-missile warheads would survive coming back through the atmosphere. The work was kept secret at first and published openly in 1958. Warheads want a high $\beta$: they must plunge fast and hard to be accurate. Crewed capsules want the opposite, which is why the same equations led designers in two very different directions.
:::

::: context landing-ellipse Aiming at an oval
Because a landing point can never be predicted exactly, mission planners draw an oval on the map — the landing ellipse — that the vehicle should land inside with high probability. Each source of uncertainty stretches it: errors in the entry state, in $\beta$, in the winds, in the atmosphere's density. The ellipse is long in the downrange direction, because that is where small errors pile up most, as this example shows. Lesson 12 comes back to how a landing vehicle shrinks it by steering.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="70" rx="140" ry="36" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="70" r="5" fill="#b4232c"/>
  <text x="180" y="60" font-size="11" text-anchor="middle" fill="#b4232c">aim point</text>
  <line x1="40" y1="122" x2="320" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="320,122 310,117 310,127" fill="#1f2a44"/>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">downrange direction (long axis)</text>
  <line x1="340" y1="34" x2="340" y2="106" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="334" y="24" font-size="11" text-anchor="end" fill="#1f2a44">crossrange (short axis)</text>
</svg>
```
:::
