---
id: l02-ballistic-entry-and-the-allen-eggers-solution
title: Ballistic entry and the Allen-Eggers solution
minutes: 19
covers:
  - ballistic entry and the Allen-Eggers solution
---

Drop a marble and a ping-pong ball out of a high window. The ping-pong ball quickly hits a gentle top speed and drifts down. The marble barely notices the air and keeps speeding up. How strongly the air slows something down depends on how heavy it is compared with how much air it has to shove aside. Now imagine throwing both at thousands of meters per second, into air that starts almost empty and gets thicker the lower you go. That is atmospheric entry, and this lesson finds out exactly how the speed falls away.

In the early 1950s, H. Julian **[[Allen and Alfred Eggers|allen-eggers-history]]** at NACA's Ames laboratory were working on a question with real urgency behind it. A ballistic-missile warhead coming back into the atmosphere at several kilometers per second was going to get extremely hot, and nobody had a clean way to say how hot, where, or whether the answer depended on how the vehicle was built. Allen and Eggers stripped the problem down to the smallest set of physics that still captures what matters most:

- no lift, only drag;
- a nearly straight-line path at a fixed angle;
- an atmosphere that thins out exponentially with height;
- gravity too weak to matter next to the huge drag of a fast, steep entry.

With those assumptions, the entry problem becomes a single differential equation you can solve by hand, with an exponential answer. And its maximum has a property that still surprises people the first time they see it: the peak deceleration of a ballistic entry does not depend on how heavy the vehicle is, how streamlined it is, or what it is made of. It depends only on how fast it arrived and at what angle.

This lesson derives that result from the ground up: the equation of motion, the change of variable that makes it solvable, the closed-form velocity history, and the peak-deceleration formula that falls out of it. The next lesson tests it against a trajectory computed step by step on a computer and finds exactly where the idealization stops holding.

## The ballistic entry model

**[["Ballistic"|ballistic-word]]** here means the vehicle makes no lift. Every aerodynamic force on it is **drag**, pushing exactly backward along its velocity. That is the right model for a sphere, a tumbling rocket stage, or a capsule flown so its lift cancels out on average. It is also the starting point that every lifting-entry treatment in this module (lesson 7) builds on.

Start with Newton's second law along the direction of motion. The vehicle has mass $m$, drag coefficient $C_D$ (read "C sub D", a number that says how draggy its shape is) and reference area $A$. It moves at relative speed $v$ through air of density $\rho$. Drag is dynamic pressure times $C_D A$, so

$$
m\,\dot v = -\tfrac{1}{2}\rho v^2 C_D A.
$$

The dot over $v$ means "rate of change with time", so $\dot v$ ("v dot") is the acceleration along the path. The minus sign says drag slows the vehicle down.

Divide both sides by $m$. The vehicle's properties now appear only as the group $m/(C_D A)$, which gets its own name, the **ballistic coefficient**:

$$
\beta \equiv \frac{m}{C_D A}, \qquad [\beta] = \mathrm{kg/m^2}.
$$

($\beta$ is "beta". The symbol $\equiv$ means "is defined as", and $[\beta]$ means "the units of $\beta$".) With it, the equation becomes

$$
\dot v = -\frac{\rho v^2}{2\beta}.
$$

Think of $\beta$ as **[[mass per unit of drag area|beta-scale]]**. A heavy, slender, low-drag body has a large $\beta$ and resists slowing down, like the marble. A light, blunt one has a small $\beta$ and slows down readily, like the ping-pong ball. Lesson 5 explores in detail what $\beta$ does to a trajectory. For now, notice that it is the *only* vehicle property left in the equation.

### The two big assumptions

The flight-path angle $\gamma$ (negative while descending, from lesson 1) links how fast the vehicle loses height to its speed:

$$
\dot h = v \sin\gamma.
$$

If the vehicle moves at $v$ tilted $\gamma$ below the horizon, the downward part of its velocity is $v \sin\gamma$.

Allen and Eggers' central assumption is that, for a steep enough and fast enough entry, $\gamma$ stays close to its entry value $\gamma_E$ (read "gamma sub E") the whole way through the slowdown. The path is close enough to a straight line that treating $\gamma$ as a constant is a good approximation.

The second assumption is equally important: gravity's direct effect on $\dot v$ is small compared with drag. That is reasonable once the deceleration reaches tens of $g_0$ (where $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity). It is badly wrong right at the top of the atmosphere, where drag has barely started. The next lesson measures both assumptions carefully. Here, take them as the price of a closed-form answer.

## The exponential atmosphere

The model needs to know how density changes with height. Allen-Eggers uses the exponential atmosphere from t1_m18:

$$
\rho(h) = \rho_0\, e^{-h/H}, \qquad \rho_0 = 1.225\ \mathrm{kg/m^3},\ \ H = 7200\ \mathrm{m}.
$$

Every time you climb one **scale height** $H$, the density shrinks by a factor of $e \approx 2.718$. This module uses $H = 7200\,\mathrm{m}$ for every Earth ballistic-entry calculation. It is the value t1_m18 settled on as the best single compromise over roughly $20$ to $60\,\mathrm{km}$, where most of an entry's slowing and heating happen.

Real air does not have one scale height. t1_m18 found local values from $6.3$ to over $10\,\mathrm{km}$, depending on the layer. That mismatch is one more simplification this model accepts in exchange for a closed form.

## Separating the equation

Here is the plan in plain words. The equation $\dot v = -\rho v^2/(2\beta)$ talks about time. But density depends on *altitude*, not time. So we switch the independent variable from time to altitude. Then speed and altitude can be pulled to opposite sides of the equation and integrated separately.

**Step 1: switch from time to altitude.** By the **[[chain rule|chain-rule-switch]]**, the change of speed per meter of altitude is the change per second divided by the meters per second:

$$
\frac{dv}{dh} = \frac{\dot v}{\dot h} = \frac{-\rho v^2/(2\beta)}{v \sin\gamma_E} = -\frac{\rho(h)\,v}{2\beta \sin\gamma_E}.
$$

One factor of $v$ canceled between top and bottom, and $\gamma$ has been frozen at $\gamma_E$.

**Step 2: tidy the signs.** $\gamma_E$ is negative for a descending entry, so $\sin\gamma_E$ is negative. Write $s \equiv |\sin\gamma_E|$, a positive number, so $\sin\gamma_E = -s$. The two minus signs cancel:

$$
\frac{dv}{dh} = \frac{\rho(h)\,v}{2\beta s}.
$$

This says speed *grows* with altitude, which makes sense: higher up, the vehicle has not been slowed yet.

**Step 3: separate.** Divide both sides by $v$ and multiply by $dh$. Now $v$ appears only on the left and $h$ only on the right. That is what makes the equation **[[separable|separable-equation]]**:

$$
\frac{dv}{v} = \frac{\rho_0\, e^{-h/H}}{2\beta s}\, dh.
$$

**Step 4: integrate.** Integrate from the top of the atmosphere down to some altitude $h$. At the top, density is negligible (lesson 1 showed how tiny it is at $120\,\mathrm{km}$) and the speed is still the entry speed $v_E$. For a clean answer we put the top at $h \to \infty$, where the density is exactly zero. The left side integrates to a logarithm. The right side is an exponential, which integrates to another exponential:

$$
\ln\frac{v}{v_E} = \int_{\infty}^{h} \frac{\rho_0\,e^{-h'/H}}{2\beta s}\,dh'
= \left[-\frac{\rho_0 H}{2\beta s}\,e^{-h'/H}\right]_{\infty}^{h}
= -\frac{H}{2\beta s}\,\rho_0\, e^{-h/H} = -\frac{\rho(h)\,H}{2\beta s}.
$$

The prime on $h'$ only marks it as the variable being integrated over. The term at $h' = \infty$ vanishes, because $\rho_0 e^{-h'/H} \to 0$ there.

**Step 5: undo the logarithm.** Raise $e$ to the power of each side. That gives the **Allen-Eggers velocity solution**:

$$
v(h) = v_E \exp\!\left[-\frac{\rho(h)\,H}{2\beta\,|\sin\gamma_E|}\right].
$$

($\exp[x]$ is another way to write $e^x$, handy when the exponent is long.) Every symbol here has been defined: $v_E$ and $\gamma_E$ from the entry state of lesson 1, $\rho(h)$ and $H$ from the atmosphere, $\beta$ from the vehicle. Mass, area and drag coefficient do not appear separately — only their combination $\beta$.

Read the formula like a story. High up, $\rho$ is almost zero, the exponent is almost zero, and $v \approx v_E$: nothing has happened yet. Lower down, $\rho$ grows, the exponent becomes a big negative number, and $v$ drops toward zero.

::: key The Allen-Eggers velocity solution
$$
v(h) = v_E \exp\!\left[-\frac{\rho(h)\,H}{2\beta\,|\sin\gamma_E|}\right], \qquad \rho(h) = \rho_0\,e^{-h/H}.
$$
Valid for a ballistic (no-lift), constant-$\gamma_E$ entry through an exponential atmosphere, with gravity neglected against drag. $v \to v_E$ where $\rho \to 0$ (high altitude) and $v \to 0$ as $\rho$ grows large (deep, dense atmosphere).
:::

::: example Velocity history for a steep entry
A vehicle with $\beta = 200\ \mathrm{kg/m^2}$ enters at $v_E = 7800\ \mathrm{m/s}$ and $\gamma_E = -20^\circ$, so $s = \sin 20^\circ = 0.34202$. Find its speed at $40\,\mathrm{km}$ and at $30\,\mathrm{km}$.

**At 40 km.** First the density:

$$
\rho(40{,}000) = 1.225\, e^{-40{,}000/7200} = 1.225\, e^{-5.556} = 4.736 \times 10^{-3}\ \mathrm{kg/m^3}.
$$

Next the exponent. The top is $4.736\times10^{-3}\times7200 = 34.10$ and the bottom is $2\times200\times0.34202 = 136.8$, so the exponent is $-34.10/136.8 = -0.2492$:

$$
v(40\ \mathrm{km}) = 7800 \exp\!\left[-\frac{4.736\times10^{-3}\times7200}{2\times200\times0.34202}\right]
= 7800\, e^{-0.2492} = 6079\ \mathrm{m/s}.
$$

**At 30 km.** The density is $\rho = 1.225\,e^{-30{,}000/7200} = 0.01899\ \mathrm{kg/m^3}$, four times higher. The exponent grows in proportion:

$$
v(30\ \mathrm{km}) = 7800\, \exp\!\left[-\frac{0.01899\times7200}{2\times200\times0.34202}\right] = 7800\, e^{-0.9994} = 2871\ \mathrm{m/s}.
$$

**What it means.** From $120$ down to $40\,\mathrm{km}$ the vehicle lost only about a fifth of its speed. Then, between $40$ and $30\,\mathrm{km}$ — about $1.4$ scale heights — it sheds more than half of what was left: $(6079 - 2871)/6079 = 0.53$. That is the signature of ballistic entry: almost nothing happens, and then, over a few kilometers of altitude, **[[most of it happens at once|velocity-profile]]**.

**Sanity check.** Both speeds are below $7800$, and the lower altitude gives the lower speed, as they must.
:::

## Peak deceleration

Speed falls slowly at first and then fast. So the *rate* of slowing — the deceleration — must start near zero, climb to a peak, and die away again as the vehicle runs out of speed. Where is that peak, and how big is it?

The deceleration size is $a = \rho v^2/(2\beta)$. Substitute the velocity solution. Squaring $v$ doubles the exponent, so the $2$ in its denominator goes away:

$$
a(h) = \frac{\rho(h)}{2\beta}\, v_E^2 \exp\!\left[-\frac{\rho(h)\, H}{\beta s}\right].
$$

Everything that changes with altitude does so through $\rho(h)$ alone. So we can treat $a$ as a function of $\rho$ and forget about $h$ for a moment. To keep things short, write $c \equiv H/(\beta s)$:

$$
a(\rho) = \frac{v_E^2}{2\beta}\,\rho\, e^{-c\rho}.
$$

This has the classic **[[rise-and-fall shape|rho-e-shape]]** $\rho\,e^{-c\rho}$. It is zero at $\rho = 0$ (no air, no drag). It goes to zero again as $\rho \to \infty$ (the vehicle has already stopped). In between it has exactly one peak.

**Find the peak.** At a peak the slope is zero. Differentiate with the product rule and set the result to zero:

$$
\frac{da}{d\rho} = \frac{v_E^2}{2\beta}\left(e^{-c\rho} - c\rho\, e^{-c\rho}\right) = \frac{v_E^2}{2\beta}\, e^{-c\rho}\,(1 - c\rho) = 0
\quad\Longrightarrow\quad c\rho^* = 1.
$$

An exponential is never zero, so the bracket $(1 - c\rho)$ must be. The star marks "the value at the peak". So the peak happens at $\rho^* = 1/c = \beta s / H$.

**Find the peak value.** Put $\rho^*$ back into $a(\rho)$. The exponential becomes $e^{-1}$:

$$
a_{\max} = \frac{v_E^2}{2\beta}\cdot\frac{\beta s}{H}\cdot e^{-1} = \frac{v_E^2\, s}{2 e H}.
$$

Write out $s = |\sin\gamma_E|$ in full:

$$
a_{\max} = \frac{v_E^2\,|\sin\gamma_E|}{2eH}.
$$

### What is missing is the point

Look at what is, and is not, in this formula. It has the entry speed, the entry angle, the atmosphere's scale height, and Euler's number $e$. It has **nothing about the vehicle at all**. $\beta$ canceled exactly: the $1/\beta$ in front met the $\beta$ inside $\rho^*$. A dense tungsten ball and a hollow aluminum shell, entering at the same speed and angle, pull exactly the same peak deceleration.

Why? The shell slows down in thin air, high up. The heavy ball has to **[[punch deeper|why-beta-cancels]]**, into thicker air, before drag grabs it as hard. The two effects balance perfectly.

What $\beta$ *does* control is **where** the peak happens. Turn $\rho^*$ into an altitude with $\rho = \rho_0 e^{-h/H}$, which gives $h = -H\ln(\rho/\rho_0)$:

$$
h^* = -H\ln\frac{\rho^*}{\rho_0} = H\ln\frac{\rho_0 H}{\beta s}.
$$

A larger $\beta$ makes $\rho^* = \beta s/H$ larger, and a larger density is found lower down. So a higher ballistic coefficient pushes the peak deeper into the atmosphere. For two vehicles with the same $\gamma_E$, the logarithm rule gives the gap directly: $H\ln(\beta_2/\beta_1)$. The lunar-return example below confirms this with numbers.

### The speed at the peak

One more result needs a moment of care, because speed and deceleration fade at different rates. The deceleration carries $e^{-c\rho}$ because it goes as $v^2$. The speed itself carries only half that exponent. Substituting $c = H/(\beta s)$ into the solution at the top of this lesson gives

$$
v = v_E e^{-c\rho/2}.
$$

At the peak, $c\rho^* = 1$, so

$$
v^* = v_E\, e^{-c\rho^*/2} = v_E\, e^{-1/2} = 0.6065\, v_E.
$$

This is a fixed fraction of entry speed, whatever $\beta$ or $\gamma_E$ is. Every ballistic entry in this model reaches its worst deceleration with about $61$ percent of its speed left.

::: key Peak deceleration: independent of the vehicle
$$
a_{\max} = \frac{v_E^2\, |\sin\gamma_E|}{2eH}, \qquad
\rho^* = \frac{\beta\,|\sin\gamma_E|}{H}, \qquad
h^* = H\ln\frac{\rho_0 H}{\beta\,|\sin\gamma_E|}, \qquad
v^* = v_E/\sqrt{e} = 0.607\,v_E.
$$
$a_{\max}$ depends only on entry speed and entry angle. $\beta$ sets *where* (altitude) the peak occurs, not *how large* it is. The speed at the peak is always $1/\sqrt{e}$ of entry speed, for every ballistic entry in this model — the square root is there because the deceleration goes as $v^2$, so it peaks when the velocity has fallen by **[[half an e-folding|e-folding]]**, not a whole one.
:::

::: example Peak deceleration for the lunar-return case
Use the lunar-return speed from lesson 1, $v_E = 11.0\ \mathrm{km/s}$, at a representative entry angle $\gamma_E = -6.5^\circ$, so $s = \sin 6.5^\circ = 0.11320$.

**Peak deceleration.** The top of the formula is $(11{,}000)^2 \times 0.11320 = 1.3697\times10^7$. The bottom is $2 \times 2.71828 \times 7200 = 39{,}144$. So

$$
a_{\max} = \frac{(11{,}000)^2 \times 0.11320}{2 \times 2.71828 \times 7200} = \frac{1.3697\times10^7}{39{,}144} = 349.9\ \mathrm{m/s^2} = 35.68\, g_0.
$$

The last step divided by $g_0 = 9.80665\,\mathrm{m/s^2}$. That is a crushing **[[load for a crew|g-load-crew]]**.

**Where it happens for $\beta = 200\ \mathrm{kg/m^2}$.** Inside the logarithm, $1.225\times7200 = 8820$ and $200\times0.11320 = 22.64$, and $8820/22.64 = 389.6$:

$$
h^* = 7200\,\ln\!\left(\frac{1.225\times7200}{200\times0.11320}\right) = 7200\ln(389.6) = 42{,}948\ \mathrm{m} \approx 42.9\ \mathrm{km}.
$$

**Double $\beta$ to $400\ \mathrm{kg/m^2}$** — a denser or more slender vehicle with the identical entry state. $a_{\max}$ does not contain $\beta$, so it stays at $35.68\,g_0$. The altitude drops by $H\ln 2 = 7200 \times 0.6931 = 4991\ \mathrm{m}$, to $42.95 - 4.99 = 37.96\ \mathrm{km}$.

**Sanity check.** The same peak load is reached nearly $5\ \mathrm{km}$ lower. The air there is exactly twice as dense, since $\rho^* \propto \beta$. The heavier vehicle needed twice the air to get the same grip, as the "punch deeper" picture says.
:::

::: warning $\beta$-independence is a property of this model, not of nature
The result that $a_{\max}$ does not depend on $\beta$ is exact *within* the Allen-Eggers assumptions: no lift, constant $\gamma$, gravity negligible against drag, and a single-scale-height exponential atmosphere. Real vehicles break at least the first two to some degree, and the next lesson measures how much that costs. And it does not mean "peak g does not matter for the vehicle". It matters a great deal, through *where* and in how dense air the load arrives. Only its *size*, in this idealization, is fixed by the entry geometry alone.
:::

## Check yourself

::: check
Starting from $m\dot v = -\tfrac{1}{2}\rho v^2 C_D A$ and $\dot h = v\sin\gamma$, show the two steps that turn this into the separable equation $dv/v = [\rho_0 e^{-h/H}/(2\beta s)]\,dh$.
:::

::: answer
**First**, divide by $m$ and write $\beta = m/(C_D A)$. That gives $\dot v = -\rho v^2/(2\beta)$.

**Second**, change the independent variable from $t$ to $h$, freezing $\gamma$ at $\gamma_E$:

$$
\frac{dv}{dh} = \frac{\dot v}{\dot h} = \frac{-\rho v^2/(2\beta)}{v\sin\gamma_E} = -\frac{\rho v}{2\beta \sin\gamma_E}.
$$

Since $\sin\gamma_E$ is negative, write $\sin\gamma_E = -s$ with $s = |\sin\gamma_E|$. The signs cancel and $dv/dh = \rho(h)v/(2\beta s)$. Dividing through by $v$ and writing $\rho(h) = \rho_0 e^{-h/H}$ separates the variables.
:::

::: check
Two vehicles enter at identical $v_E$ and $\gamma_E$, one with $\beta = 100\ \mathrm{kg/m^2}$ and one with $\beta = 300\ \mathrm{kg/m^2}$. Compare their peak decelerations and the altitudes at which those peaks occur.
:::

::: answer
Peak deceleration, $a_{\max} = v_E^2 s/(2eH)$, contains no $\beta$. So both vehicles feel exactly the same peak, in the same number of $g$.

The altitude of the peak, $h^* = H\ln[\rho_0 H/(\beta s)]$, is lower for the larger-$\beta$ vehicle by

$$
H\ln(300/100) = 7200 \times 1.0986 = 7910\ \mathrm{m}.
$$

The $\beta = 300$ vehicle reaches the identical peak load nearly $8\ \mathrm{km}$ deeper, in air $e^{7910/7200} = 3$ times denser — the same factor of $3$ as the ratio of the $\beta$ values, as $\rho^* \propto \beta$ requires.
:::

::: check
Why does the Allen-Eggers derivation integrate from $h \to \infty$ (with $v \to v_E$ there) rather than from the actual entry interface altitude of $120\ \mathrm{km}$?
:::

::: answer
At $120\ \mathrm{km}$ the exponential-atmosphere density is already about $7\times10^{-8}\ \mathrm{kg/m^3}$ (lesson 1). That is so close to zero that integrating from the true finite altitude or from infinity gives the same answer to many significant figures.

Using $\infty$ as the limit is a convenience: it makes the boundary term vanish cleanly. It costs essentially nothing in accuracy, because the air above $120\ \mathrm{km}$ has done nothing measurable to the speed.
:::

::: check
At the altitude of peak deceleration, what fraction of the entry speed remains? Does that fraction depend on $\beta$ or $\gamma_E$?
:::

::: answer
$v^* = v_E/\sqrt{e} = 0.607\,v_E$, independent of both $\beta$ and $\gamma_E$.

It comes from putting the peak condition $c\rho^* = 1$ into the velocity solution $v = v_E e^{-c\rho/2}$. The speed carries half the exponent the deceleration does, because $a \propto v^2$. So every ballistic entry in this model, whatever the vehicle or angle, has lost $39.3$ percent of its entry speed at the moment of peak deceleration, and still carries about three fifths of it.
:::

::: check
A student says that because $a_{\max}$ does not depend on $\beta$, the ballistic coefficient "does not matter" for entry vehicle design. Give one reason this is wrong, even inside the Allen-Eggers model.
:::

::: answer
$\beta$ fixes the altitude $h^*$ where the (identical) peak load arrives, and altitude sets air density. Density drives the peak *heating* rate, through a relation that does *not* cancel $\beta$ the way peak deceleration does (the next two lessons show this).

A low-$\beta$ vehicle meets its peak g high up, in thin air, with a comparatively gentle heating environment. A high-$\beta$ vehicle meets the same peak g much deeper, in denser air, with a much harsher one. $\beta$ also sets how long the entry lasts, how far downrange it travels, and the total heat load, all explored in lesson 5. "Same peak g" is far from "same design problem".
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
| $v^* = v_E/\sqrt{e} = 0.607\,v_E$ | Speed remaining at the peak — the same fraction for every $\beta$ and $\gamma_E$ |

Every result here rests on assumptions that were stated but not tested: constant $\gamma$, negligible gravity, a single-scale-height atmosphere. The next lesson builds a computer-integrated entry that keeps the physics those assumptions drop, compares it point by point against the formulas above, and finds exactly which assumption breaks first as the entry gets shallower.

::: context allen-eggers-history The blunt-body idea
Allen and Eggers' 1953 analysis did more than predict deceleration. It showed that a vehicle meant to survive entry should be *blunt*, not pointed. A blunt nose builds a strong shock wave standing off in front of it, and that shock dumps most of the heat into the passing air instead of into the vehicle. Pointed shapes, which looked like the obvious choice for going fast, soaked up far more heat. Every crewed capsule since Mercury has been built on this idea, which is why they look like upside-down bowls rather than darts. The work was kept secret at first and only published openly several years later.
:::

::: context ballistic-word Where "ballistic" comes from
"Ballistic" comes from the Greek word for "to throw", the same root as the *ballista*, an ancient siege catapult. A ballistic object is one that is thrown and then left alone: no wings, no engine, nothing steering it, only gravity and drag. A thrown baseball is ballistic; a paper airplane, which makes lift, is not. In entry, "ballistic" means "zero lift", and it is the simplest case there is.
:::

::: context beta-scale What β feels like
$\beta$ is mass divided by drag area. Stack the vehicle's mass over its effective frontal area, and $\beta$ is how many kilograms sit behind each square meter pushing through the air. A beach ball is a few kilograms per square meter at most; it stops almost at once. A bowling ball is in the hundreds; it barely notices air at walking speeds. Entry capsules are typically a few hundred $\mathrm{kg/m^2}$, while slender warheads can run to many thousands — which is exactly why warheads plunge deep before slowing, and capsules slow high up.
:::

::: context chain-rule-switch Swapping time for altitude
If you know how fast your speed changes per second, and how many meters you drop per second, then the change in speed per meter is the first divided by the second. That is all $dv/dh = \dot v / \dot h$ says: "per second" cancels out, like converting miles per hour and gallons per hour into miles per gallon. The trick works because altitude changes steadily in one direction during entry — it never goes back up in this model — so altitude can serve as a clock.
:::

::: context separable-equation Why "separable" is the magic word
Most differential equations cannot be solved with pencil and paper. A separable one can: every piece involving $v$ can be moved to one side and every piece involving $h$ to the other. Then each side is an ordinary integral you already know how to do. The ODE module (t0_m08) covers this method; here it turns a problem about a spacecraft into two textbook integrals, $\int dv/v = \ln v$ and $\int e^{-h/H}\,dh = -H e^{-h/H}$.
:::

::: context velocity-profile Nothing, then everything
Here is the speed for the worked example ($\beta = 200\,\mathrm{kg/m^2}$, $\gamma_E = -20^\circ$) plotted against altitude. Above about $60\,\mathrm{km}$ the line is nearly vertical: the speed has hardly changed. Then it swings sharply left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="184">0</text><text x="55" y="144">20</text><text x="55" y="104">40</text><text x="55" y="64">60</text><text x="55" y="24">80</text>
  </g>
  <text x="14" y="104" font-size="11" fill="#1f2a44" transform="rotate(-90 14 104)" text-anchor="middle">altitude, km</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="196">0</text><text x="195" y="196">0.5</text><text x="330" y="196">1</text>
  </g>
  <text x="262" y="206" font-size="11" fill="#1f2a44" text-anchor="middle">v / v_E</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="60.2,148.0 60.6,146.0 61.4,144.0 62.7,142.0 64.9,140.0 68.2,138.0 73.0,136.0 79.2,134.0 87.1,132.0 96.5,130.0 107.3,128.0 119.3,126.0 132.2,124.0 145.6,122.0 159.4,120.0 173.1,118.0 186.6,116.0 199.7,114.0 212.2,112.0 223.9,110.0 234.9,108.0 245.0,106.0 254.3,104.0 262.8,102.0 270.4,100.0 277.3,98.0 283.5,96.0 289.1,94.0 294.0,92.0 298.4,90.0 302.3,88.0 305.7,86.0 308.7,84.0 311.4,82.0 313.7,80.0 315.8,78.0 317.6,76.0 319.2,74.0 320.5,72.0 321.7,70.0 322.8,68.0 323.7,66.0 324.5,64.0 325.2,62.0 325.8,60.0 326.4,58.0 326.8,56.0 327.3,54.0 327.6,52.0 327.9,50.0 328.2,48.0 328.4,46.0 328.6,44.0 328.8,42.0 329.0,40.0 329.1,38.0 329.2,36.0 329.3,34.0 329.4,32.0 329.5,30.0 329.5,28.0 329.6,26.0 329.7,24.0 329.7,22.0 329.7,20.0"/>
  <circle cx="223.8" cy="110" r="5" fill="#b4232c"/>
  <text x="215" y="140" font-size="11" fill="#b4232c" text-anchor="start">peak deceleration:</text>
  <text x="215" y="154" font-size="11" fill="#b4232c" text-anchor="start">35.0 km, v = 0.61 v_E</text>
</svg>
```

The red dot marks peak deceleration, where the curve bends hardest.
:::

::: context rho-e-shape Why ρ times e to the minus ρ must peak
The deceleration is a tug-of-war. The factor $\rho$ says "more air, more drag". The factor $e^{-c\rho}$ says "by the time you reach this much air, you have already lost most of your speed". Early on the first factor wins; later the second one does. The curve $x e^{-x}$ tops out at exactly $x = 1$, at a height of $1/e \approx 0.368$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 45.8,138.0 51.6,112.1 57.4,91.5 63.2,75.2 69.0,62.8 74.8,53.6 80.6,47.2 86.4,43.0 92.2,40.7 98.0,40.0 103.8,40.6 109.6,42.3 115.4,44.8 121.2,48.0 127.0,51.7 132.8,55.8 138.6,60.3 144.4,64.9 150.2,69.6 156.0,74.4 161.8,79.1 167.6,83.9 173.4,88.5 179.2,93.1 185.0,97.5 190.8,101.8 196.6,105.9 202.4,109.8 208.2,113.6 214.0,117.2 219.8,120.7 225.6,123.9 231.4,127.0 237.2,129.9 243.0,132.7 248.8,135.2 254.6,137.7 260.4,140.0 266.2,142.1 272.0,144.1 277.8,146.0 283.6,147.7 289.4,149.4 295.2,150.9 301.0,152.3 306.8,153.7 312.6,154.9 318.4,156.0 324.2,157.1 330.0,158.1"/>
  <line x1="98" y1="40" x2="98" y2="170" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="98" y="186">1</text><text x="156" y="186">2</text><text x="214" y="186">3</text><text x="272" y="186">4</text><text x="330" y="186">5</text>
  </g>
  <text x="330" y="160" font-size="11" fill="#1f2a44" text-anchor="end">x = cρ</text>
  <text x="108" y="34" font-size="12" fill="#b4232c">peak at cρ = 1, height 1/e</text>
  <text x="200" y="70" font-size="12" fill="#1d6fd1">x·e^(−x)</text>
</svg>
```
:::

::: context why-beta-cancels Heavy goes deep, light stops high
Picture two vehicles side by side at the same speed and angle. The light, blunt one starts feeling strong drag while the air is still thin. The heavy one feels almost nothing there, and keeps falling until the air is thick enough to grab it equally hard *per kilogram*. Because both lose speed in exactly the same pattern — measured against "how much air per unit of $\beta$ they have met" — both peak at the same fraction of their speed, with the same deceleration. The heavy one does it lower down, where the air is denser.
:::

::: context e-folding What an "e-folding" is
When something shrinks exponentially, one **e-folding** is the stretch over which it falls by a factor of $e \approx 2.718$. Half an e-folding shrinks it by $\sqrt{e} \approx 1.649$, so $1/\sqrt{e} \approx 0.607$ is left. Deceleration goes as $v^2$, so when $v^2$ has fallen by one e-folding, $v$ itself has fallen by only half of one. The scale height $H$ of the atmosphere is the same idea: climb one $H$ and the density drops by one e-folding.
:::

::: context g-load-crew Why real capsules do not fly this
Nobody designs a crewed entry around anything like $36\,g$. Crews are normally kept to single digits, lying on their backs so the load pushes them into their seats. That is why Apollo command modules came home on a *lifting* entry, using a small offset center of mass to fly at an angle and hold the peak to about $6$ to $7\,g$. Lesson 7 shows how lift does that.
:::
