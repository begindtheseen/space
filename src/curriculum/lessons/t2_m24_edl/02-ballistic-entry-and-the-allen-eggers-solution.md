---
id: l02-ballistic-entry-and-the-allen-eggers-solution
title: Ballistic entry and the Allen-Eggers solution
minutes: 14
covers:
  - ballistic entry and the Allen-Eggers solution
---

In 1953, H. Julian Allen and Alfred Eggers at NACA Ames were trying to answer a question with real urgency behind it: an intercontinental ballistic warhead re-entering the atmosphere at several kilometres per second was going to get hot, and nobody yet had a clean way to say how hot, or where, or whether the answer depended on how the vehicle was built. Allen and Eggers found a closed-form answer by stripping the entry problem down to the smallest set of physics that still captures the dominant behaviour: no lift, a straight-line-ish trajectory, an atmosphere that thins out exponentially, and gravity too weak to matter next to the drag a fast, steep entry generates. Solved under those assumptions, the entry problem becomes a single separable differential equation with an exponential solution, and its maximum has a property that is still startling the first time you see it: the peak deceleration a ballistic entry vehicle experiences does not depend on how heavy it is, how streamlined it is, or what it is made of. It depends only on how fast it arrived and at what angle.

This lesson derives that result from the ground up: the equation of motion, the substitution that makes it solvable, the closed-form velocity history, and the peak-deceleration formula that falls out of it. The next lesson puts it to the test against a numerically integrated trajectory and asks exactly where the idealisation stops holding.

## The ballistic entry model

"Ballistic" here means the vehicle produces no lift — every aerodynamic force on it is drag, acting exactly opposite its velocity. This is the right model for a spherical or near-spherical body, a tumbling stage, or a capsule flown at zero net lift, and it is the starting point every lifting-entry treatment in this module (lesson 7) builds on. Newton's second law along the velocity direction, for a vehicle of mass $m$, drag coefficient $C_D$ and reference area $A$ moving at relative speed $v$ through air of density $\rho$, reads

$$
m\,\dot v = -\tfrac{1}{2}\rho v^2 C_D A.
$$

Collect the vehicle properties into the **ballistic coefficient**,

$$
\beta \equiv \frac{m}{C_D A}, \qquad [\beta] = \mathrm{kg/m^2},
$$

so that

$$
\dot v = -\frac{\rho v^2}{2\beta}.
$$

A heavy, slender, low-drag body has large $\beta$ and resists deceleration; a light, blunt one has small $\beta$ and decelerates readily. This module returns to what $\beta$ does to a trajectory in detail in lesson 5 — for now it is the one vehicle parameter this equation contains.

The flight-path angle $\gamma$ (negative while descending, per lesson 1's convention) relates the rate of altitude loss to speed through $\dot h = v \sin\gamma$. Allen and Eggers' central simplifying assumption is that, for a sufficiently steep, sufficiently fast entry, $\gamma$ stays close to its entry value $\gamma_E$ throughout the deceleration pulse — the trajectory is close enough to a straight line at fixed angle that treating $\gamma$ as a constant is a good approximation. A second assumption, equally important, is that gravity's direct contribution to $\dot v$ is small next to the drag term above — reasonable when the deceleration reaches tens or hundreds of $g_0$, utterly unreasonable right at the top of the atmosphere where drag has barely begun. Both assumptions are examined quantitatively in the next lesson; here, take them as the price of admission for a closed form.

## The exponential atmosphere

The model needs a density profile, and Allen-Eggers uses the exponential atmosphere already built in t1_m18:

$$
\rho(h) = \rho_0\, e^{-h/H}, \qquad \rho_0 = 1.225\ \mathrm{kg/m^3},\ \ H = 7200\ \mathrm{m}.
$$

This module uses $H = 7200\ \mathrm{m}$ consistently for every Earth ballistic-entry calculation, matching the value t1_m18 settled on as the best single-scale-height compromise across the altitudes — roughly $20$–$60\ \mathrm{km}$ — where most of an entry's deceleration and heating happen. Real air does not have one scale height (t1_m18 derived local values from $6.3$ to over $10\ \mathrm{km}$ depending on layer), and that mismatch is one more idealisation this model accepts in exchange for a closed form.

## Separating the equation

With $\dot h = v \sin\gamma$ and $\gamma$ frozen at $\gamma_E$, convert the independent variable from time to altitude:

$$
\frac{dv}{dh} = \frac{\dot v}{\dot h} = \frac{-\rho v^2/(2\beta)}{v \sin\gamma_E} = -\frac{\rho(h)\,v}{2\beta \sin\gamma_E}.
$$

Because $\gamma_E$ is negative for a descending entry, write $s \equiv |\sin\gamma_E|$ and flip the sign so every quantity in sight is positive:

$$
\frac{dv}{dh} = \frac{\rho(h)\,v}{2\beta s}.
$$

This is separable — $v$ appears only on the left, $h$ only on the right (through $\rho(h)$):

$$
\frac{dv}{v} = \frac{\rho_0\, e^{-h/H}}{2\beta s}\, dh.
$$

Integrate both sides from the entry interface, where $h \to \infty$ in the idealised infinite atmosphere and $v \to v_E$ (density there is negligible, per lesson 1), down to an arbitrary altitude $h$:

$$
\ln\frac{v}{v_E} = \int_{\infty}^{h} \frac{\rho_0\,e^{-h'/H}}{2\beta s}\,dh'
= \left[-\frac{\rho_0 H}{2\beta s}\,e^{-h'/H}\right]_{\infty}^{h}
= -\frac{H}{2\beta s}\,\rho_0\, e^{-h/H} = -\frac{\rho(h)\,H}{2\beta s}.
$$

The upper-limit term vanishes because $\rho_0 e^{-h'/H} \to 0$ as $h' \to \infty$. Exponentiating gives the **Allen-Eggers velocity solution**:

$$
v(h) = v_E \exp\!\left[-\frac{\rho(h)\,H}{2\beta\,|\sin\gamma_E|}\right].
$$

Every symbol here was defined above: $v_E$ and $\gamma_E$ from the entry state (lesson 1), $\rho(h)$ and $H$ from the atmosphere model, $\beta$ from the vehicle. No mass, area, or drag coefficient survives individually — only their ratio $\beta$.

::: key The Allen-Eggers velocity solution
$$
v(h) = v_E \exp\!\left[-\frac{\rho(h)\,H}{2\beta\,|\sin\gamma_E|}\right], \qquad \rho(h) = \rho_0\,e^{-h/H}.
$$
Valid for a ballistic (no-lift), constant-$\gamma_E$ entry through an exponential atmosphere, with gravity neglected against drag. $v \to v_E$ where $\rho \to 0$ (high altitude) and $v \to 0$ as $\rho$ grows large (deep, dense atmosphere).
:::

::: example Velocity history for a steep entry
A vehicle with $\beta = 200\ \mathrm{kg/m^2}$ enters at $v_E = 7800\ \mathrm{m/s}$, $\gamma_E = -20^\circ$ (so $s = \sin 20^\circ = 0.34202$). At $h = 40\ \mathrm{km}$, $\rho(40{,}000) = 1.225\, e^{-40{,}000/7200} = 4.736 \times 10^{-3}\ \mathrm{kg/m^3}$, so

$$
v(40\ \mathrm{km}) = 7800 \exp\!\left[-\frac{4.736\times10^{-3}\times7200}{2\times200\times0.34202}\right]
= 7800\, e^{-0.2492} = 6079\ \mathrm{m/s}.
$$

At $h = 30\ \mathrm{km}$, $\rho = 1.225\,e^{-30{,}000/7200} = 0.01899\ \mathrm{kg/m^3}$, and

$$
v(30\ \mathrm{km}) = 7800\, \exp\!\left[-\frac{0.01899\times7200}{2\times200\times0.34202}\right] = 7800\, e^{-0.9994} = 2871\ \mathrm{m/s}.
$$

Between $40$ and $30\ \mathrm{km}$ — one atmospheric scale height and a bit — the vehicle sheds nearly two-thirds of its remaining speed. That is the signature of ballistic entry: almost nothing happens until suddenly, over a few kilometres of altitude, most of it does.
:::

## Peak deceleration

The deceleration magnitude is $a = \rho v^2/(2\beta)$. Substitute the velocity solution:

$$
a(h) = \frac{\rho(h)}{2\beta}\, v_E^2 \exp\!\left[-\frac{\rho(h)\, H}{\beta s}\right].
$$

Every altitude dependence runs through $\rho(h)$ alone, so treat $a$ as a function of $\rho$ directly. Write $c \equiv H/(\beta s)$ for brevity:

$$
a(\rho) = \frac{v_E^2}{2\beta}\,\rho\, e^{-c\rho}.
$$

This is the classic shape $\rho\,e^{-c\rho}$: zero at $\rho = 0$, zero again as $\rho \to \infty$, with a single maximum in between. Differentiate with respect to $\rho$ and set the result to zero:

$$
\frac{da}{d\rho} = \frac{v_E^2}{2\beta}\left(e^{-c\rho} - c\rho\, e^{-c\rho}\right) = \frac{v_E^2}{2\beta}\, e^{-c\rho}\,(1 - c\rho) = 0
\quad\Longrightarrow\quad c\rho^* = 1.
$$

So the peak occurs at $\rho^* = 1/c = \beta s / H$. Substituting back,

$$
a_{\max} = \frac{v_E^2}{2\beta}\cdot\frac{\beta s}{H}\cdot e^{-1} = \frac{v_E^2\, s}{2 e H}.
$$

Write out $s = |\sin\gamma_E|$ in full:

$$
a_{\max} = \frac{v_E^2\,|\sin\gamma_E|}{2eH}.
$$

Look at what is, and is not, in this expression. It contains the entry speed, the entry angle, the scale height of the atmosphere, and Euler's number — and nothing about the vehicle at all. $\beta$ cancelled exactly between the $1/\beta$ in front and the $\beta$ inside $\rho^*$. A dense tungsten sphere and a hollow aluminium shell, entering at the same speed and angle, pull precisely the same peak deceleration. What $\beta$ does control is *where* that peak happens:

$$
h^* = -H\ln\frac{\rho^*}{\rho_0} = H\ln\frac{\rho_0 H}{\beta s}.
$$

A larger $\beta$ makes $\rho^* = \beta s/H$ larger, and a larger required density is reached lower in the atmosphere, where $\rho(h)$ is bigger. So a higher ballistic coefficient pushes the peak deeper into the atmosphere, by $H\ln(\beta_2/\beta_1)$ for two vehicles compared at the same $\gamma_E$ — exactly the direction the worked example below confirms numerically. The velocity at the peak, read directly off $v(h) = v_E e^{-c\rho}$ at the condition $c\rho^* = 1$ that defines the peak, is a fixed fraction of entry speed regardless of $\beta$ or $\gamma_E$:

$$
v^* = v_E\, e^{-c\rho^*} = v_E\, e^{-1} = 0.3679\, v_E.
$$

::: key Peak deceleration: independent of the vehicle
$$
a_{\max} = \frac{v_E^2\, |\sin\gamma_E|}{2eH}, \qquad
\rho^* = \frac{\beta\,|\sin\gamma_E|}{H}, \qquad
h^* = H\ln\frac{\rho_0 H}{\beta\,|\sin\gamma_E|}, \qquad
v^* = v_E/e = 0.368\,v_E.
$$
$a_{\max}$ depends only on entry speed and entry angle. $\beta$ sets *where* (altitude) the peak occurs, not *how large* it is. The speed at the peak is always $1/e$ of entry speed, for every ballistic entry in this model.
:::

::: example Peak deceleration for the lunar-return case
Using the $v_E = 11.0\ \mathrm{km/s}$ lunar-return speed from lesson 1 at a representative entry angle $\gamma_E = -6.5^\circ$ ($s = \sin 6.5^\circ = 0.11320$):

$$
a_{\max} = \frac{(11{,}000)^2 \times 0.11320}{2 \times 2.71828 \times 7200} = \frac{1.3697\times10^7}{39{,}144} = 349.9\ \mathrm{m/s^2} = 35.68\, g_0.
$$

Take $\beta = 200\ \mathrm{kg/m^2}$: the peak altitude is $h^* = 7200\,\ln\!\left(\dfrac{1.225\times7200}{200\times0.11320}\right) = 7200\ln(389.6) = 42{,}948\ \mathrm{m} \approx 42.9\ \mathrm{km}$. Double $\beta$ to $400\ \mathrm{kg/m^2}$ — a denser or more slender vehicle carrying the identical entry state — and $a_{\max}$ is unchanged at $35.68\,g_0$, while $h^*$ drops by $H\ln 2 = 4991\ \mathrm{m}$, to $37.96\ \mathrm{km}$: the same peak load, reached nearly $5\ \mathrm{km}$ lower, in air roughly twice as dense.
:::

::: warning $\beta$-independence is a property of this model, not of nature
The result that $a_{\max}$ does not depend on $\beta$ is exact within the Allen-Eggers assumptions: no lift, constant $\gamma$, gravity negligible against drag, a single-scale-height exponential atmosphere. Real vehicles violate at least the first two to some degree, and the next lesson shows precisely how much that costs. The result is not "peak g does not matter for the vehicle" — it emphatically does, through where and how densely the load is applied — only that its *magnitude*, in this idealisation, is fixed by the entry geometry alone.
:::

## Check yourself

::: check
Starting from $m\dot v = -\tfrac{1}{2}\rho v^2 C_D A$ and $\dot h = v\sin\gamma$, show the two steps that turn this into the separable equation $dv/v = [\rho_0 e^{-h/H}/(2\beta s)]\,dh$.
:::

::: answer
First, divide by $m$ and write $\beta = m/(C_D A)$ to get $\dot v = -\rho v^2/(2\beta)$. Second, change the independent variable from $t$ to $h$ using $dv/dh = \dot v/\dot h = [-\rho v^2/(2\beta)]/(v\sin\gamma_E) = -\rho v/(2\beta \sin\gamma_E)$; writing $s = |\sin\gamma_E|$ and flipping the sign (since $\sin\gamma_E$ is negative) gives $dv/dh = \rho(h)v/(2\beta s)$, and dividing through by $v$ separates the variables.
:::

::: check
Two vehicles enter at identical $v_E$ and $\gamma_E$, one with $\beta = 100\ \mathrm{kg/m^2}$ and one with $\beta = 300\ \mathrm{kg/m^2}$. Compare their peak decelerations and the altitudes at which those peaks occur.
:::

::: answer
Peak deceleration $a_{\max} = v_E^2 s/(2eH)$ contains no $\beta$, so both vehicles feel exactly the same peak, in the same units of $g$. The altitude of the peak, $h^* = H\ln[\rho_0 H/(\beta s)]$, is lower for the heavier-$\beta$ vehicle by $H\ln(300/100) = 7200 \times 1.0986 = 7910\ \mathrm{m}$ — the $\beta=300$ vehicle reaches the identical peak load nearly $8\ \mathrm{km}$ deeper in the atmosphere, in air about $e^{7910/7200} = 3$ times denser.
:::

::: check
Why does the Allen-Eggers derivation integrate from $h \to \infty$ (with $v \to v_E$ there) rather than from the actual entry interface altitude of $120\ \mathrm{km}$?
:::

::: answer
Because at $120\ \mathrm{km}$ the exponential-atmosphere density is already about $7\times10^{-8}\ \mathrm{kg/m^3}$ (lesson 1) — close enough to zero that integrating from the true finite altitude or from infinity gives the same answer to many significant figures. Using $\infty$ as the upper limit is a convenience that makes the integral's boundary term vanish cleanly, and it costs essentially nothing in accuracy because the real atmosphere has already done nothing measurable by $120\ \mathrm{km}$.
:::

::: check
At the altitude of peak deceleration, what fraction of the entry speed remains, and does that fraction depend on $\beta$ or $\gamma_E$?
:::

::: answer
$v^* = v_E/e = 0.368\,v_E$, independent of both $\beta$ and $\gamma_E$. This falls directly out of the condition $c\rho^*=1$ that defines the peak, substituted back into $v(h)=v_Ee^{-c\rho}$: every ballistic entry in this model, regardless of vehicle or angle, has shed exactly $63.2\ \mathrm{percent}$ of its entry speed by the moment of peak deceleration.
:::

::: check
A student claims that because $a_{\max}$ does not depend on $\beta$, ballistic coefficient "does not matter" for entry vehicle design. Give one reason this conclusion is wrong even within the Allen-Eggers model itself.
:::

::: answer
$\beta$ fixes the altitude $h^*$ at which the (identical) peak load is reached, and altitude sets air density — which, as the next two lessons show, drives peak heating rate through a relation that does *not* cancel $\beta$ the way peak deceleration does. A low-$\beta$ vehicle meets its peak g high in thin air with a comparatively gentle thermal environment; a high-$\beta$ vehicle meets the same peak g much deeper, in denser air, with a substantially harsher one. $\beta$ also fixes duration, downrange distance, and total heat load, all explored in lesson 5. "Same peak g" is far from "same design problem."
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\beta = m/(C_D A)$ | Ballistic coefficient, $\mathrm{kg/m^2}$ — the only vehicle property in the model |
| $\rho(h) = \rho_0 e^{-h/H}$ | Exponential atmosphere; $\rho_0 = 1.225\ \mathrm{kg/m^3}$, $H = 7200\ \mathrm{m}$ (Earth, this module) |
| $v(h) = v_E\exp[-\rho(h)H/(2\beta s)]$ | Allen-Eggers velocity solution, $s = \lvert\sin\gamma_E\rvert$ |
| $a_{\max} = v_E^2 s/(2eH)$ | Peak deceleration — depends only on entry speed and angle, not on $\beta$ |
| $\rho^* = \beta s/H$ | Density at which the peak occurs |
| $h^* = H\ln[\rho_0 H/(\beta s)]$ | Altitude of peak deceleration — depends on $\beta$; higher $\beta$ gives lower $h^*$ |
| $v^* = v_E/e = 0.368\,v_E$ | Speed remaining at the peak — universal fraction, independent of $\beta$ and $\gamma_E$ |

Every result here rests on assumptions stated but not tested: constant $\gamma$, negligible gravity, an idealised single-scale-height atmosphere. The next lesson builds a numerically integrated entry that keeps the physics those assumptions drop, compares it point by point against the formulas above, and identifies exactly which assumption breaks first as the entry gets shallower.
