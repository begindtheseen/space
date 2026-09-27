---
id: l03-peak-deceleration-and-peak-heating
title: Peak deceleration and peak heating, derived and then measured
minutes: 20
covers:
  - peak deceleration and peak heating relations
---

A weather app that says "70 degrees" is making a prediction from a simplified model of the sky. You trust it more once you have seen how often it is right — and you learn which days it tends to be wrong. This lesson does the same for the Allen-Eggers formulas.

The previous lesson produced a striking, exact result: the peak deceleration of a ballistic entry depends only on entry speed and entry angle, never on the vehicle. That is a strong claim to hang a heat-shield or structural margin on. And it rests on two assumptions nobody has tested yet: a frozen flight-path angle, and gravity too small to matter next to drag. An engineer who ships a number without checking the assumptions behind it is trusting arithmetic more than physics deserves.

So here you will build a computer-integrated entry that keeps the two pieces of physics Allen-Eggers drops. You will compare it point by point with the closed form across a range of entry angles, and find exactly which assumption fails first as the entry gets shallower. Then the same machinery goes to work on peak *heating*. You will derive where the heating maximum sits relative to the deceleration maximum, and see that — unlike peak deceleration — the peak heating rate does depend on the vehicle.

## Building the numerical truth model

Allen-Eggers drops two things from the full equations of motion:

1. gravity's direct pull along the flight path, which changes the speed;
2. any change in the flight-path angle itself.

Put both back. The result is a **[[truth model|truth-model]]** — the most complete model you are willing to compute, used as the yardstick for simpler ones. Ours is the standard set of planar, point-mass entry equations over a round, non-spinning planet. Write $r = R_\oplus + h$ for the distance from Earth's center and $g(r) = \mu/r^2$ for gravity at that distance. Then

$$
\dot v = -\frac{\rho(h)\,v^2}{2\beta} - g(r)\sin\gamma, \qquad
\dot\gamma = \cos\gamma\left(\frac{v}{r} - \frac{g(r)}{v}\right), \qquad
\dot r = v\sin\gamma.
$$

Take the three equations one at a time.

**The speed equation, $\dot v$.** The drag term is the same as in lesson 2. The new term, $-g\sin\gamma$, is the part of gravity that points along the velocity. During descent $\sin\gamma$ is negative, so this term is *positive*: gravity speeds up the fall, exactly as it should.

**The angle equation, $\dot\gamma$.** It says two things compete to turn the path. The $-g/v$ piece is gravity bending the path downward, the way a thrown ball's path curves toward the ground. The $+v/r$ piece is the vehicle's own speed carrying it around the curve of the planet. That piece is called **[[centrifugal relief|centrifugal-relief]]**. It is what lets a fast, shallow entry skim along — or even skip back out of the atmosphere instead of diving in. Lesson 6 leans on this mechanism directly.

**The height equation, $\dot r$.** The same as $\dot h = v\sin\gamma$ from lesson 2.

There is no lift and no planetary rotation. Every assumption of lesson 2 is kept *except* the two under test.

This system has no closed-form solution — that is the whole point. So we solve it numerically, stepping forward in time from the $120\,\mathrm{km}$ entry interface with an explicit **[[Runge-Kutta|runge-kutta]]** method. This module uses `scipy.integrate.solve_ivp` with the eighth-order `DOP853` method. The peak deceleration and peak heating are then found by searching along the computed trajectory for the largest value.

Here is a short version you can run. It uses the same equations and prints peak deceleration for two entry angles:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU, RE = 3.986004418e14, 6378137.0     # m^3/s^2, m
RHO0, H, G0 = 1.225, 7200.0, 9.80665


def entry(t, y, beta):
    v, gam, r = y
    rho = RHO0 * np.exp(-(r - RE) / H)
    g = MU / r**2
    return [-rho * v**2 / (2 * beta) - g * np.sin(gam),
            np.cos(gam) * (v / r - g / v),
            v * np.sin(gam)]


def peak_g(gamma_deg, v_e=7800.0, beta=200.0):
    ground = lambda t, y, beta: y[2] - RE
    ground.terminal = True
    sol = solve_ivp(entry, [0, 3000], [v_e, np.radians(gamma_deg), RE + 120e3],
                    args=(beta,), method="DOP853", rtol=1e-10, atol=1e-9,
                    events=ground, max_step=0.05)
    v, r = sol.y[0], sol.y[2]
    a = RHO0 * np.exp(-(r - RE) / H) * v**2 / (2 * beta)
    return a.max() / G0


for gam in (-20.0, -6.5):
    closed = 7800.0**2 * abs(np.sin(np.radians(gam))) / (2 * np.e * H) / G0
    print(f"{gam:6.1f} deg  closed form {closed:5.1f} g   numerical {peak_g(gam):5.1f} g")
# -20.0 deg  closed form  54.2 g   numerical  56.1 g
#  -6.5 deg  closed form  17.9 g   numerical  19.4 g
```

### Can we trust the computer?

A numerical answer is only worth something if it does not depend on how hard the integrator was asked to work. So test that. Tightening the relative tolerance from $10^{-8}$ to $10^{-11}$, or switching from `DOP853` to the unrelated `RK45` method, changes a computed peak deceleration of $19.445013\,g_0$ by less than $2\times10^{-6}\,g_0$, and the peak altitude by less than a millimeter. The numbers below are independent of step size to at least six significant figures. This is a **[[converged|convergence]]** solution of the equations above, not an accident of one particular solver call.

## Where the closed form holds up

Take $v_E = 7800\ \mathrm{m/s}$ and $\beta = 200\ \mathrm{kg/m^2}$, and sweep the entry angle from straight down to nearly flat:

| $\gamma_E$ | $a_{\max}$, closed form ($g_0$) | $a_{\max}$, numerical ($g_0$) | error |
| --- | --- | --- | --- |
| $-90^\circ$ | $158.5$ | $163.6$ | $3.2\%$ |
| $-45^\circ$ | $112.1$ | $115.7$ | $3.2\%$ |
| $-20^\circ$ | $54.2$ | $56.1$ | $3.5\%$ |
| $-10^\circ$ | $27.5$ | $28.9$ | $5.2\%$ |
| $-6.5^\circ$ | $17.9$ | $19.4$ | $8.4\%$ |
| $-2^\circ$ | $5.5$ | $9.0$ | $63\%$ |
| $-1^\circ$ | $2.8$ | $8.2$ | $196\%$ |

For steep entries the closed form is genuinely good: a few percent. And notice the trend from $-90^\circ$ to $-20^\circ$. The error barely moves, sitting at a nearly constant floor of about $3$ percent. This is the regime Allen and Eggers had in mind. A warhead or probe diving at $20^\circ$ or steeper loses so little to gravity, compared with what drag removes, that ignoring gravity costs only a few percent. And its path really is close enough to a straight line that freezing $\gamma$ barely matters.

Below $-20^\circ$ the error starts to climb: $5$ percent at $-10^\circ$, $8$ percent at $-6.5^\circ$. By $-1^\circ$ the closed form is not merely inaccurate — it is useless. It predicts a peak under $3\,g_0$ where the real number is over $8\,g_0$, wrong by a factor of about three. Something has changed in kind, not only in size. The next section finds out what.

## Which assumption fails first

Two assumptions went into the closed form. To see which one causes the blow-up, test them **[[one at a time|ablation-word]]**:

- **Gravity alone:** put gravity back into $\dot v$, but keep $\gamma$ frozen.
- **Curvature alone:** leave gravity out of $\dot v$, but let $\gamma$ change under its full equation (curvature included).

Compare each partial model's peak deceleration with the same closed form:

| $\gamma_E$ | error, gravity-in-$\dot v$ alone | error, flight-path curvature alone |
| --- | --- | --- |
| $-90^\circ$ | $3.22\%$ | $0.00\%$ |
| $-45^\circ$ | $3.14\%$ | $0.09\%$ |
| $-20^\circ$ | $2.98\%$ | $0.65\%$ |
| $-10^\circ$ | $2.82\%$ | $2.72\%$ |
| $-6.5^\circ$ | $2.73\%$ | $6.46\%$ |
| $-2^\circ$ | $2.46\%$ | $64.6\%$ |
| $-1^\circ$ | $2.31\%$ | $197.3\%$ |

**The gravity column is nearly flat:** about $2.3$ to $3.2$ percent at every angle, rising only slowly as the entry steepens. That is the "always there, always small" part. At $-90^\circ$ it is *all* of the total error. There the path cannot bend at all: $\cos(-90^\circ) = 0$ wipes out the $\dot\gamma$ equation, so $\gamma$ truly never changes. The closed form's only remaining sin, on a purely vertical drop, is ignoring gravity's pull.

**The curvature column tells the real story.** At $-90^\circ$ it contributes nothing, because there is nothing to bend. It grows slowly at first. It overtakes the gravity term somewhere between $-10^\circ$ and $-6.5^\circ$. Then it explodes: $65$ percent at $-2^\circ$, nearly $200$ percent at $-1^\circ$. At the shallow end it accounts for almost the whole error in the first table.

So the frozen-angle assumption is the one that fails first, and it fails by a widening margin as the entry gets shallower. Why? A shallow entry spends a very long time high up, where the air is thin and drag is weak. That gives gravity time to keep steepening the path — or, near the edge of the entry corridor, gives the vehicle's own speed time to hold the path up and let it skim instead of dive. Either way, the angle changes by an amount that is no longer small compared with $\gamma_E$ itself. Freezing $\gamma$ at its entry value stops being an approximation and becomes plain wrong.

::: key Which assumption fails first
Across every entry angle tested, neglecting gravity's direct contribution to deceleration costs a small, nearly constant $2$–$3$ percent. Freezing the flight-path angle costs nothing at all for a vertical entry and *hundreds of percent* for a shallow one. The constant-$\gamma$ assumption is what breaks the Allen-Eggers closed form, and it breaks first — and worst — exactly in the shallow-entry regime where the entry corridor (lesson 6) and skip trajectories (lesson 7) live.
:::

::: example Reading the error budget at a real entry angle
A capsule enters at $\gamma_E = -6.5^\circ$ — about the angle later lessons use for a lunar-return corridor case — with $v_E = 7800\ \mathrm{m/s}$ and $\beta = 200\ \mathrm{kg/m^2}$.

**Closed form.** $s = \sin 6.5^\circ = 0.1132$, so

$$
a_{\max} = \frac{7800^2 \times 0.1132}{2 \times 2.71828 \times 7200} = 175.9\ \mathrm{m/s^2} = 17.9\,g_0.
$$

**Truth model.** The converged integration gives $19.4\,g_0$. Keeping more digits, the error is $(19.445 - 17.944)/17.944 = 0.084$, about $8.4$ percent.

**Split the blame.** From the second table: about $2.7$ percent from neglected gravity, and about $6.5$ percent from the frozen flight path. The two effects overlap a little, so the pieces do not add exactly to $8.4$, but the picture is clear. They are comparable in size, and curvature is already the larger piece, even at an angle most engineers would not call "shallow".

**What that means for margins.** Suppose you added a flat $10$ percent to the closed-form peak g as a blanket **[[safety factor|safety-factor]]**. It happens to cover this case. But the first table shows the same rule would be badly wrong elsewhere on the same axis — too generous at $-45^\circ$ (needed: $3$ percent), and not nearly enough at $-2^\circ$ (needed: $63$ percent).
:::

## Peak heating: a related but different maximum

Deceleration is not the only thing that peaks during entry. The heat pouring into the vehicle's nose peaks too — but somewhere else.

Picture rubbing your hands together. Rub harder and they warm; rub *faster* and they warm much more. Entry heating is like that, and very sensitive to speed. The heating rate at the **[[stagnation point|stagnation-point]]** — the spot on the nose where the oncoming air comes to a stop — follows a steeper rule than deceleration does. The next lesson derives the full Sutton-Graves correlation. Its essential shape, which comes from the theory of the thin layer of air hugging the nose, is

$$
\dot q \propto \sqrt{\rho}\; v^3.
$$

Here $\dot q$ ("q dot") is the heating rate, in watts per square meter, and $\propto$ means "is proportional to". Density enters to the one-half power and speed to the third, compared with deceleration's $\rho v^2$. That extra power of speed, and the weaker pull of density, move the heating peak to **[[a different place|heat-vs-decel]]** along the trajectory.

### Where the heating peaks

Repeat lesson 2's maximization on this new shape. Use the Allen-Eggers speed, $v = v_E e^{-c\rho/2}$ with $c = H/(\beta s)$ as before. Cubing it triples the exponent:

$$
v^3 = v_E^3\, e^{-3c\rho/2}.
$$

So the heating rate, as a function of density, is proportional to

$$
f(\rho) = \sqrt\rho\; e^{-3c\rho/2}.
$$

**Differentiate** with the product rule. The derivative of $\sqrt\rho$ is $\tfrac{1}{2}\rho^{-1/2}$, and the derivative of the exponential brings down $-3c/2$:

$$
\frac{df}{d\rho} = \left(\tfrac{1}{2}\rho^{-1/2} - \tfrac{3c}{2}\rho^{1/2}\right) e^{-3c\rho/2} = \tfrac{1}{2}\rho^{-1/2}\left(1 - 3c\rho\right) e^{-3c\rho/2}.
$$

**Set it to zero.** Neither $\rho^{-1/2}$ nor the exponential can be zero, so the bracket must be:

$$
1 - 3c\rho^*_q = 0 \quad\Longrightarrow\quad \rho^*_q = \frac{1}{3c} = \frac{\beta s}{3H}.
$$

Compare with lesson 2's peak-deceleration density, $\rho^*_a = 1/c = \beta s/H$. The heating maximum occurs at exactly **one third** the density of the deceleration maximum — for every $\beta$, every $\gamma_E$, every $v_E$.

**Turn it into altitude.** Density falls steadily with height, so a lower density means higher up. With $\rho = \rho_0 e^{-h/H}$, a density ratio of $3$ is a fixed height gap:

$$
h^*_q - h^*_a = H\ln\frac{\rho^*_a}{\rho^*_q} = H\ln 3 = 7200 \times 1.0986 = 7910\ \mathrm{m}.
$$

Peak heating occurs $7.91\,\mathrm{km}$ *above* peak deceleration — always, whatever the vehicle or entry geometry, within this model. The vehicle is still descending and slowing at that point, so the heating peak also comes *earlier* in time and at *higher* speed. The speed there is $v_E e^{-c\rho^*_q/2} = v_E e^{-1/6} = 0.846\,v_E$, compared with $0.607\,v_E$ at peak deceleration. This matches the working engineer's rule of thumb: a heat shield's worst moment arrives before the crew or payload feels the worst g.

::: key Peak heating happens higher, and earlier, than peak deceleration
$$
\rho^*_q = \frac{\beta\,|\sin\gamma_E|}{3H}, \qquad h^*_q - h^*_a = H\ln 3 = 7.91\ \mathrm{km}\ \text{(Earth, this module's }H\text{)}.
$$
The altitude gap is exact and independent of $\beta$, $\gamma_E$, and $v_E$ within the Allen-Eggers model. Peak heating always precedes peak deceleration in time. Heating scales as $\sqrt\rho\,v^3$ while deceleration scales as $\rho v^2$, so the heating maximum sits at a lower density — higher up and faster.
:::

### How big the heating peak is

Now put $\rho^*_q$ back into the heating rate to see what survives in the *size* of the peak. Here the story is the opposite of peak deceleration's. At the peak, $\sqrt{\rho^*_q} = \sqrt{\beta s/(3H)}$ and $v^3 = v_E^3 e^{-1/2}$, so

$$
\dot q_{\max} \propto \sqrt{\frac{\beta\,|\sin\gamma_E|}{3H}}\; v_E^3\, e^{-1/2}.
$$

The next lesson supplies the constant in front, from the real Sutton-Graves correlation. For now, look at $\beta$:

$$
\dot q_{\max} \propto \sqrt{\beta}\,,
$$

*not* independent of $\beta$. Here is why the two peaks behave differently:

- **Peak deceleration** has a $1/\beta$ in front. It meets a $\beta$ (to the first power) inside $\rho^*_a$, and they cancel exactly.
- **Peak heating** has *no* $\beta$ in front — $\sqrt\rho\,v^3$ contains no mass or area. So the $\sqrt{\rho^*_q} \propto \sqrt\beta$ from the substitution has nothing to cancel against, and it survives.

So a heavier or more slender vehicle (higher $\beta$) meets a *higher* peak heating rate than a lighter, blunter one at the same entry speed and angle. This difference between the two "peak" results is one of the most important, least obvious facts in entry design. Lesson 4 puts real numbers behind it.

::: example Checking the altitude gap numerically
Use the truth model at $v_E = 7800\ \mathrm{m/s}$, $\gamma_E = -20^\circ$, $\beta = 200\ \mathrm{kg/m^2}$, tracking $\sqrt\rho\,v^3$ as well as $\rho v^2$ along the trajectory.

**Where the peaks land.** Peak deceleration comes at $h = 34.86\ \mathrm{km}$, $t = 33.2\ \mathrm{s}$ after entry. Peak heating comes at $h = 42.81\ \mathrm{km}$, $t = 29.2\ \mathrm{s}$.

**The gap.** $42.81 - 34.86 = 7.95\ \mathrm{km}$. The closed form says $7.91\ \mathrm{km}$. The difference is $0.04\,\mathrm{km}$, about half a percent. And the heating peak comes $4.0\,\mathrm{s}$ *earlier*, as predicted.

**Compare with the closed form's altitudes.** Lesson 2's formula gives $h^*_a = 7200\ln(1.225\times7200/(200\times0.3420)) = 34.99\ \mathrm{km}$, and adding $7.91$ gives $h^*_q = 42.90\,\mathrm{km}$. Both are within about $0.1\,\mathrm{km}$ of the truth model — a steep entry, where the closed form works well.

**At a shallower angle.** At $\gamma_E = -6.5^\circ$, where the closed-form peak deceleration was already off by $8.4$ percent, the numerical gap widens to $8.47\ \mathrm{km}$. That is a small but real drift. It tracks the same constant-$\gamma$ breakdown found above, since both peaks sit on the same bending flight path.
:::

::: warning The $H\ln 3$ offset is a property of the $\sqrt\rho\,v^3$ scaling, not a universal constant
Change the heating law's powers — a different correlation, a different flow regime — and the factor of three, and the $\ln 3$ that comes from it, change too. What carries over to any power-law heating correlation is the *method*. Write the peak quantity's dependence on density as $\rho^p e^{-qc\rho}$, for whatever powers $p$ and $q$ the correlation gives. Maximize it the same way (the peak is at $\rho = p/(qc)$). Then read off a new, still exact, still $\beta$-independent altitude offset from peak deceleration.
:::

## Check yourself

::: check
For entries steeper than about $-20^\circ$, the error between the Allen-Eggers closed form and the numerical peak deceleration stays near $3$ percent, however much steeper the entry gets. Which single dropped term causes essentially all of that error, and why does it stop changing?
:::

::: answer
Gravity's direct contribution to deceleration along the flight path, $-g\sin\gamma$, which Allen-Eggers drops by assuming drag alone.

Tested on its own, it causes $2.3$–$3.2$ percent error at every angle, reaching its largest value, $3.22$ percent, at $-90^\circ$. There the flight path is vertical, and the *other* dropped assumption — a changing $\gamma$ — contributes exactly zero, because $\cos(-90^\circ) = 0$ wipes out the curvature equation. With no curvature error left, the gravity term alone sets the error.

It stays roughly constant because $g\sin\gamma$ is a similarly small fraction of the peak drag deceleration (tens to hundreds of $g_0$) at all these steep angles: steepening the entry raises both the gravity component along the path and the peak drag together.
:::

::: check
Explain, physically, why the frozen-flight-path-angle assumption fails so much worse for a shallow entry than for a steep one.
:::

::: answer
A shallow entry spends far longer near the top of the atmosphere, where density and drag are small, before drag gets strong enough to matter.

During that long, weakly braked stretch, gravity has time to change the flight-path angle — and, near the edge of the entry corridor, so does the vehicle's own orbital speed, pushing back against gravity through the centrifugal-relief term. The change is no longer small compared with the shallow $\gamma_E$ itself.

A steep entry reaches strong drag almost at once. There is no time for $\gamma$ to drift before the trajectory is essentially decided.
:::

::: check
Why can you trust a peak-deceleration number when two different numerical methods (say `DOP853` and `RK45`) agree to six significant figures, even though neither gives an exact answer?
:::

::: answer
Two independent methods with different error behavior, both run at tight tolerance, are very unlikely to agree to six significant figures by coincidence if either one had a large, uncorrected error. Agreement to that precision is strong evidence that both have converged to the same underlying solution of the equations of motion — exact for those equations, even if it has no closed form.

This is the standard way to build confidence in a number that has no independent formula to check against: not proving it exact, but showing it does not care how it was computed.
:::

::: check
Derive the density ratio $\rho^*_q/\rho^*_a$ at which peak heating (scaling as $\sqrt\rho\,v^3$) occurs relative to peak deceleration (scaling as $\rho v^2$), and state the resulting altitude gap in terms of $H$.
:::

::: answer
With $v = v_E e^{-c\rho/2}$ and $c = H/(\beta s)$:

- Peak deceleration maximizes $\rho\,e^{-c\rho}$ (from $v^2$). The slope is $(1 - c\rho)e^{-c\rho}$, zero at $\rho^*_a = 1/c$.
- Peak heating maximizes $\sqrt\rho\,e^{-3c\rho/2}$ (from $v^3$, which triples the speed's exponent). The slope is $\tfrac{1}{2}\rho^{-1/2}(1 - 3c\rho)e^{-3c\rho/2}$, zero at $\rho^*_q = 1/(3c)$.

So $\rho^*_q/\rho^*_a = 1/3$. From $\rho = \rho_0 e^{-h/H}$, the altitude gap is

$$
h^*_q - h^*_a = H\ln(\rho^*_a/\rho^*_q) = H\ln 3,
$$

which is $7.91\ \mathrm{km}$ for this module's $H = 7200\ \mathrm{m}$, independent of $\beta$, $\gamma_E$ and $v_E$. The heating peak is the higher one.
:::

::: check
A colleague argues that because peak deceleration does not depend on $\beta$, peak heating rate cannot either, "by the same logic". Is this correct?
:::

::: answer
No. Whether $\beta$ cancels depends on what sits in front of each formula.

Peak deceleration's formula has $1/\beta$ in front. Substituting the maximizing density brings in $\beta^1$ from $\rho^*_a$, and the two cancel completely.

Peak heating's formula, $\dot q \propto \sqrt\rho\,v^3$, has no $\beta$ in front at all — no mass or area appears. So the $\sqrt{\rho^*_q} \propto \sqrt\beta$ that comes from substituting its own maximizing density has nothing to cancel against. Peak heating rate scales as $\sqrt\beta$: it rises, rather than staying fixed, as the ballistic coefficient rises.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Truth model | Round, non-spinning planet, no lift: $\dot v = -\rho v^2/(2\beta) - g\sin\gamma$, $\dot\gamma = \cos\gamma(v/r - g/v)$, $\dot r = v\sin\gamma$ |
| Closed-form error, steep ($\lvert\gamma_E\rvert \gtrsim 20^\circ$) | $3$–$4$ percent, dominated by the neglected gravity term in $\dot v$ |
| Closed-form error, shallow ($\lvert\gamma_E\rvert \lesssim 6^\circ$) | Tens to hundreds of percent, dominated by the frozen-$\gamma$ assumption |
| Which assumption fails first | Constant flight-path angle — no contribution at $-90^\circ$, dominant and explosive by $-1^\circ$ |
| $\dot q \propto \sqrt\rho\,v^3$ | Convective heating rate scaling (Sutton-Graves shape; full correlation in lesson 4) |
| $\rho^*_q = \beta s/(3H)$ | Density at peak heating — one third of the peak-deceleration density |
| $h^*_q - h^*_a = H\ln 3 = 7.91\ \mathrm{km}$ | Peak heating occurs this far above, and earlier than, peak deceleration — exact, $\beta$-independent |
| $v$ at peak heating | $v_E e^{-1/6} = 0.846\,v_E$ (versus $0.607\,v_E$ at peak deceleration) |
| $\dot q_{\max} \propto \sqrt\beta$ | Peak heating rate rises with ballistic coefficient, unlike peak deceleration |

The next lesson puts real units and a real constant behind $\dot q \propto \sqrt\rho\,v^3$ — the Sutton-Graves correlation — and works out what peak heating rate and total heat load actually cost a thermal protection system, for vehicles at several ballistic coefficients.

::: context truth-model What engineers mean by "truth model"
No model is the real world, so "truth" here is a job title, not a claim. The truth model is the most faithful simulation you are prepared to run, and simpler models — formulas you can do by hand, or code light enough to fly on a flight computer — are graded against it. Guidance teams at NASA and SpaceX keep exactly this ladder: a heavy, detailed simulation on the ground, and lighter models on board that must agree with it closely enough. Later lessons add rotation, lift and real atmospheres to this truth model, one rung at a time.
:::

::: context centrifugal-relief Why speed holds the path up
A satellite in a circular orbit is falling all the time — it is moving sideways so fast that the ground curves away beneath it as quickly as it drops. That is the $v/r$ term. When $v^2/r$ equals $g$, the two terms in $\dot\gamma$ cancel and the path stays level: that is orbital speed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M10,160 Q180,90 350,160" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <text x="300" y="165" font-size="11" fill="#6c7a93">planet surface</text>
  <circle cx="60" cy="40" r="6" fill="#1f2a44"/>
  <path d="M60,40 Q140,50 170,130" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="125" y="95" font-size="11" fill="#b4232c" text-anchor="end">slow: gravity wins,</text>
  <text x="125" y="109" font-size="11" fill="#b4232c" text-anchor="end">path bends down</text>
  <path d="M60,40 Q180,10 300,40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="300" y="62" font-size="11" fill="#1d6fd1" text-anchor="end">fast: path follows the curve</text>
</svg>
```

A shallow entry near orbital speed feels strong relief, so its path steepens only slowly — which is exactly why freezing $\gamma$ fails there.
:::

::: context runge-kutta Stepping through time
A computer cannot solve these equations in one go. Instead it takes small steps: given the speed, angle and height now, it estimates them a moment later, and repeats thousands of times. Runge-Kutta methods, named after the German mathematicians Carl Runge and Martin Kutta, make each step smarter by sampling the slope several times inside it and blending the samples. `DOP853` (after Dormand and Prince) is an eighth-order version: halve the step and its error shrinks by roughly $2^8 = 256$ times.
:::

::: context convergence How to know the answer has settled
A converged answer is one that stops changing when you make the computation more careful. Ask for smaller steps, tighter tolerances, or a different method altogether — if the digits you care about stay put, the computer is telling you about the equations, not about its own shortcuts. If they drift, you are looking at numerical error. Checking this before believing a simulation is one of the most important habits in GNC work.
:::

::: context ablation-word Taking one piece out at a time
Testing a model by removing one ingredient at a time, and seeing how much the answer changes, is called an **ablation study**. The word comes from surgery and biology, where "ablation" means removing tissue. Do not confuse it with the other ablation you will meet in the next lesson: heat-shield material that deliberately chars and wears away, carrying heat off with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="25" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0%</text><text x="45" y="139">2%</text><text x="45" y="104">4%</text><text x="45" y="69">6%</text><text x="45" y="34">8%</text>
  </g>
  <rect x="71" y="113.7" width="18" height="56.4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="126" y="115.0" width="18" height="55.0" fill="#8fb8f0" stroke="#1f2a44"/><rect x="146" y="168.4" width="18" height="1.6" fill="#b4232c"/>
  <rect x="181" y="117.8" width="18" height="52.1" fill="#8fb8f0" stroke="#1f2a44"/><rect x="201" y="158.6" width="18" height="11.4" fill="#b4232c"/>
  <rect x="236" y="120.7" width="18" height="49.3" fill="#8fb8f0" stroke="#1f2a44"/><rect x="256" y="122.4" width="18" height="47.6" fill="#b4232c"/>
  <rect x="291" y="122.4" width="18" height="47.6" fill="#8fb8f0" stroke="#1f2a44"/><rect x="311" y="57.0" width="18" height="113.0" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="186">−90°</text><text x="145" y="186">−45°</text><text x="200" y="186">−20°</text><text x="255" y="186">−10°</text><text x="310" y="186">−6.5°</text>
  </g>
  <rect x="60" y="30" width="12" height="12" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="78" y="40" font-size="11" fill="#1f2a44">gravity alone</text>
  <rect x="60" y="48" width="12" height="12" fill="#b4232c"/>
  <text x="78" y="58" font-size="11" fill="#1f2a44">curvature alone</text>
  <text x="195" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">entry angle (at −2° curvature reaches 65%)</text>
</svg>
```
:::

::: context safety-factor Why a flat margin is not enough
A safety factor is an extra allowance on top of the predicted load, so small errors do not break the vehicle. Aerospace structures are commonly designed with factors around $1.4$ on ultimate load for crewed vehicles. But a flat factor only works when the prediction's error is roughly the same everywhere. This lesson's table shows it is not: the closed form's error depends strongly on entry angle. The fix is to replace the formula with a better model where it is weak, not to pad it more.
:::

::: context stagnation-point The hottest spot on the nose
Hold your hand flat out of a car window. Air hits the middle of your palm and stops there before spilling around the edges. That stopping point is the stagnation point. On an entry vehicle it sits at the front of the heat shield, and it is where the air is squeezed hardest and heats the surface most. That is why heating rates in this module are quoted "at the stagnation point": it is the worst case on the vehicle, and the number the heat shield's thickest part is sized for.
:::

::: context heat-vs-decel Two peaks, two altitudes
Here is how the two peaks line up, from the Allen-Eggers formulas for the $-20^\circ$ example (each curve scaled so its peak is 1):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="25" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,170.0 55.1,170.0 60.2,170.0 65.3,169.9 70.4,169.6 75.5,169.0 80.5,167.5 85.6,164.7 90.7,159.8 95.8,152.4 100.9,142.2 106.0,129.3 111.1,114.4 116.2,98.3 121.3,82.1 126.4,66.9 131.5,53.8 136.5,43.2 141.6,35.7 146.7,31.4 151.8,30.0 156.9,31.3 162.0,34.9 167.1,40.3 172.2,47.1 177.3,54.8 182.4,63.0 187.5,71.5 192.5,80.0 197.6,88.2 202.7,96.1 207.8,103.6 212.9,110.6 218.0,117.0 223.1,122.9 228.2,128.2 233.3,133.1 238.4,137.4 243.5,141.3 248.5,144.7 253.6,147.8 258.7,150.5 263.8,152.9 268.9,155.1 274.0,156.9 279.1,158.6 284.2,160.0 289.3,161.3 294.4,162.4 299.5,163.4 304.5,164.2 309.6,164.9 314.7,165.6 319.8,166.2 324.9,166.7 330.0,167.1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,170.0 60.2,170.0 70.4,170.0 80.5,170.0 90.7,169.7 100.9,168.0 106.0,166.0 111.1,162.6 116.2,157.6 121.3,150.7 126.4,141.8 131.5,131.2 136.5,119.2 141.6,106.4 146.7,93.4 151.8,80.6 156.9,68.8 162.0,58.2 167.1,49.1 172.2,41.9 177.3,36.4 182.4,32.6 187.5,30.6 192.5,30.0 197.6,30.8 202.7,32.7 207.8,35.5 212.9,39.2 218.0,43.4 223.1,48.0 228.2,53.0 233.3,58.2 238.4,63.5 243.5,68.8 248.5,74.1 253.6,79.3 258.7,84.3 263.8,89.2 268.9,93.9 274.0,98.5 279.1,102.8 284.2,106.9 289.3,110.9 294.4,114.6 299.5,118.1 304.5,121.4 309.6,124.5 314.7,127.5 319.8,130.2 324.9,132.8 330.0,135.3"/>
  <line x1="151.8" y1="30" x2="151.8" y2="170" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="192.0" y1="30" x2="192.0" y2="170" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="147" y="22" font-size="11" fill="#b4232c" text-anchor="end">deceleration 35.0 km</text>
  <text x="197" y="22" font-size="11" fill="#1d6fd1">heating 42.9 km</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="75.5" y="186">20</text><text x="126.4" y="186">30</text><text x="177.3" y="186">40</text><text x="228.2" y="186">50</text><text x="279.1" y="186">60</text><text x="330" y="186">70</text>
  </g>
  <text x="195" y="201" font-size="11" fill="#1f2a44" text-anchor="middle">altitude, km (vehicle moves right to left)</text>
</svg>
```

The vehicle comes in from the right. It meets the heating peak first, $7.9\,\mathrm{km}$ higher, then the deceleration peak.
:::
