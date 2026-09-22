---
id: l07-q-alpha-and-load-relief
title: The q-alpha load indicator and load relief
minutes: 18
covers:
  - the q-alpha load indicator and load relief control
---

Ask a launch-vehicle structures engineer what the control team can do to break the vehicle and the answer is one symbol: $\bar{q}\alpha$. Dynamic pressure times angle of attack is the quantity a bending load tracks, it is quoted in the odd unit of kilopascal-degrees, and it is certified as a hard envelope that ascent guidance and control must stay inside while the wind does everything it can to push the vehicle out of it. The controller's tool for staying inside is load relief: deliberately steering into the wind, accepting an attitude and trajectory error to keep the airframe's angle of attack small.

This lesson explains why $\bar{q}\alpha$ is the right load indicator, puts numbers on the loads a jet-stream wind produces, and then derives the load-relief trade with the rigid-body model from the last lesson. The result is a straight line in a plane whose axes are structural load and trajectory drift: attitude hold sits at one end, zero angle of attack at the other, and every load-relief design is a point in between. The max-Q exercise asks you to find your own point on that line and state what it bought and what it cost.

## From normal force to bending moment

A launch vehicle at angle of attack is a long beam loaded sideways. The aerodynamic normal force is distributed along it but concentrated near the nose and fairing, where the cross-section changes; the engine's lateral thrust component acts at the tail; and the vehicle's own lateral acceleration $a_{\text{lat}}$ loads every kilogram of structure and propellant with an inertial force $-\,dm\; a_{\text{lat}}$, which partly relieves the bending. The bending moment at a station $x$ along the body is the integral of all these loads times their lever arms on one side of the station, and it peaks somewhere around the middle of the vehicle.

The detail is the structures team's job. What matters to control is that every term scales with the normal force. The aerodynamic load is $N = \bar{q} S C_{N\alpha}\alpha$; the trim gimbal force is $N\ell_\alpha/\ell_T$, proportional to $N$; the inertial relief is $m a_{\text{lat}}$, and $a_{\text{lat}}$ is set by the same two forces divided by $m$. For a given vehicle at a given Mach number, therefore,

$$
M_{\text{bend}} \;\propto\; N \;\propto\; \bar{q}\,\alpha .
$$

That is why the product $\bar{q}\alpha$, and not $\alpha$ alone or $\bar{q}$ alone, is the **load indicator**. A 4° angle of attack at 5 kPa early in flight is harmless; the same 4° at 31 kPa is a structural emergency. The indicator is conventionally quoted in **kPa·deg** (older American documents use psf·deg; $1\ \mathrm{kPa\cdot deg} = 20.9\ \mathrm{psf\cdot deg}$). A launch vehicle's structure is certified to some envelope of $\bar{q}\alpha_T$, using the total angle of attack because the body is axisymmetric — of order 100 kPa·deg for a large launcher, though every vehicle certifies its own number and applies its own safety factors.

::: example The load from a 4° angle of attack
At $\bar{q} = 31.3\ \mathrm{kPa}$ with $N_\alpha = 1.317\ \mathrm{MN/rad}$ from the previous lessons, a $4^\circ$ angle of attack is a load indicator of $31.3 \times 4 = 125\ \mathrm{kPa\cdot deg}$ and a normal force of $N = 1.317 \times 10^6 \times 0.0698 = 92\ \mathrm{kN}$. Acting on the fairing some 20 m forward of the mid-body, and only partly relieved by the vehicle's lateral acceleration, that is a bending moment of order $1.5$–$2\ \mathrm{MN\cdot m}$ at mid-body. A 3.66 m tank wall 4 mm thick has a section modulus of about $\pi r^2 t = \pi \times 1.83^2 \times 0.004 = 0.042\ \mathrm{m^3}$, so the bending stress is of order 40 MPa — modest against the material's strength, but it is added to axial compression from thrust and drag, to tank pressure loads and to the dynamic loads of a gusty ride, and thin pressurised shells fail by buckling well before the material yields. The envelope is set by that combination, and 125 kPa·deg would exceed it on many vehicles.
:::

::: key
$\bar{q}\alpha$ is the product of dynamic pressure and angle of attack. It is proportional to the aerodynamic normal force $N = \bar{q} S C_{N\alpha}\alpha$ and therefore to the bending moment on the airframe, which makes it a hard structural constraint during ascent, typically quoted in kPa·deg.
:::

Where does the angle of attack come from? The trajectory itself is designed for $\alpha \approx 0$ — that is what a gravity turn is. The mean wind measured a few hours before launch is designed *out*: the pitch and yaw steering programs are recomputed so that the vehicle flies nose-into the measured wind and the mean angle of attack is nearly zero (**wind biasing**, or day-of-launch steering update). What remains is the difference between the measured and actual wind, the wind shear and gusts the controller cannot anticipate, and the controller's own attitude errors. Those are what load relief handles.

## The rigid model in a wind

Restore the terms the short-period approximation dropped. With $z$ the lateral displacement from the reference trajectory, measured in the direction the normal force acts, the pitch-plane equations are

$$
I\ddot\theta = N_\alpha\ell_\alpha\alpha + T\ell_T\delta, \qquad
m\ddot z = N_\alpha\alpha - T\delta + T\theta, \qquad
\alpha = \theta + \alpha_w - \frac{\dot z}{V}.
$$

The new piece in the force equation is $T\theta$: when the attitude departs from the reference by $\theta$, the entire thrust vector tilts by $\theta$ and acquires a lateral component. This term is much larger per radian than the aerodynamic one — $T/m = 20\ \mathrm{m/s^2}$ against $N_\alpha/m = 3.5\ \mathrm{m/s^2}$ for the example booster — and it is the mechanism by which load relief costs trajectory.

Consider a steady wind $\alpha_w$ and ask what the vehicle settles to once the attitude loop has done its work (the **quasi-static** picture, valid for wind features slower than the loop). Moment balance requires $\ddot\theta = 0$, so the gimbal trims the aerodynamic moment:

$$
\delta = -\frac{N_\alpha\ell_\alpha}{T\ell_T}\,\alpha = -\frac{\mu_\alpha}{\mu_\delta}\,\alpha .
$$

Put this into the force equation. The gimbal's lateral force, $-T\delta = N_\alpha(\ell_\alpha/\ell_T)\alpha$, points the *same* way as the normal force — to trim a nose-away-from-wind moment the tail must be pushed downwind too — so the aerodynamic part of the lateral acceleration is

$$
a_{\text{aero}} = \frac{N_\alpha}{m}\left(1 + \frac{\ell_\alpha}{\ell_T}\right)\alpha \equiv c\,\alpha,
$$

directed downwind. For the example booster, with $\ell_\alpha = \ell_T = 26\ \mathrm{m}$, $c = 2 \times 3.47 = 6.93\ \mathrm{m/s^2}$ per radian, or $0.121\ \mathrm{m/s^2}$ per degree. The total lateral acceleration is this plus the thrust tilt:

$$
a_{\text{lat}} = c\,\alpha + \frac{T}{m}\,\theta, \qquad \theta = \alpha - \alpha_w .
$$

## Attitude hold, load minimum and drift minimum

Two limiting controllers bracket the possibilities.

**Attitude hold.** A perfect attitude loop keeps $\theta = 0$, so the whole wind becomes angle of attack: $\alpha = \alpha_w$. The load is $\bar{q}\alpha_w$ and the vehicle is pushed downwind at $a_{\text{lat}} = c\,\alpha_w$. For a 4° wind angle at max-Q: 125 kPa·deg and 0.48 m/s² downwind, which over a 20 s wind layer is 9.7 m/s of lateral velocity and about 100 m of displacement. The trajectory error is modest; the load is not.

**Load minimum.** Turn the nose fully into the wind, $\theta = -\alpha_w$, so that $\alpha = 0$. The load vanishes, but now the thrust points $\alpha_w$ off the reference direction and $a_{\text{lat}} = -(T/m)\alpha_w$: for 4°, $20 \times 0.0698 = 1.40\ \mathrm{m/s^2}$ *upwind*, three times the attitude-hold drift in the opposite direction — 28 m/s over 20 s. Zero load buys a large trajectory error, and it is unachievable anyway because gusts arrive faster than the loop.

Between them lies every practical load-relief law, and one point deserves a name. Setting $a_{\text{lat}} = 0$ — the vehicle stays on its reference trajectory while the wind blows — requires $c\,\alpha = (T/m)(\alpha_w - \alpha)$, that is

$$
\frac{\alpha}{\alpha_w}\bigg|_{\text{drift min}} = \frac{1}{1 + \dfrac{N_\alpha}{T}\left(1 + \dfrac{\ell_\alpha}{\ell_T}\right)} .
$$

This is the **drift-minimum** condition, worked out for the Saturn vehicles in the 1960s. For the example booster $N_\alpha/T = 1.317/7.6 = 0.173$, so $\alpha/\alpha_w = 1/1.347 = 0.743$: turn the nose $1.0^\circ$ into a $4^\circ$ wind, carry $3.0^\circ$ of angle of attack (93 kPa·deg), and the aerodynamic push downwind exactly cancels the thrust component upwind. Below this point you are trading trajectory for load; above it you are paying in both.

## Load relief with an accelerometer

The practical implementation feeds back a body-mounted lateral accelerometer. It measures the specific force perpendicular to the body axis, which in trim is the aerodynamic-plus-gimbal acceleration $c\,\alpha$ — a direct, if noisy, proxy for the angle of attack that needs no wind estimate. The control law becomes

$$
\delta = -K_p\,\theta - K_d\,\dot\theta - K_a\,a_{\text{meas}},
$$

with $K_a$ in radians of gimbal per m/s². In the quasi-static limit $\dot\theta = 0$ and $a_{\text{meas}} = c\,\alpha$; substitute the trim gimbal $\delta = -(\mu_\alpha/\mu_\delta)\alpha$ and $\theta = \alpha - \alpha_w$:

$$
-\frac{\mu_\alpha}{\mu_\delta}\alpha = -K_p(\alpha - \alpha_w) - K_a c\,\alpha
\quad\Longrightarrow\quad
\frac{\alpha}{\alpha_w} = \frac{K_p}{K_p + K_a c - \mu_\alpha/\mu_\delta} .
$$

Read this formula carefully. With $K_a = 0$ the ratio is $K_p/(K_p - \mu_\alpha/\mu_\delta)$, *greater than one*: a finite-gain attitude loop on an unstable vehicle lets the wind angle through slightly amplified — for $K_p = 1.88$ and $\mu_\alpha/\mu_\delta = 0.173$, $\alpha = 1.10\,\alpha_w$ — because the aerodynamic moment pushes the nose away from the wind and the loop holds it only with a residual error. Increasing $K_a$ drives the ratio down toward zero. The attitude error is $\theta = \alpha - \alpha_w$, negative: the nose turns into the wind by exactly the angle of attack that was removed.

::: example Choosing a load-relief gain
For the example booster ($K_p = 1.88$, $\mu_\alpha/\mu_\delta = 0.173$, $c = 6.93\ \mathrm{m/s^2}$ per radian, $T/m = 20\ \mathrm{m/s^2}$) in a 4° wind, target $\alpha/\alpha_w = 0.5$. The formula requires $K_a c = K_p/0.5 - K_p + 0.173 = 2.05$, so $K_a = 2.05/6.93 = 0.30$ rad per m/s² (17° of gimbal per m/s² of measured lateral acceleration). The results:

- Angle of attack $2.0^\circ$, load indicator $31.3 \times 2 = 63\ \mathrm{kPa\cdot deg}$ — down from 125.
- Attitude error $\theta = -2.0^\circ$: the nose points two degrees into the wind.
- Lateral acceleration $a_{\text{lat}} = c\alpha + (T/m)\theta = 0.121 \times 2 - 20 \times 0.0349 = 0.24 - 0.70 = -0.46\ \mathrm{m/s^2}$, upwind.
- Over a 20 s wind layer: 9.1 m/s of lateral velocity and about 90 m of displacement away from the reference trajectory, in the upwind direction, plus a steering loss of $(T/m)(1 - \cos\theta) = 0.012\ \mathrm{m/s^2}$, negligible.

The drift-minimum gain, $\alpha/\alpha_w = 0.743$, needs $K_a c = 0.82$, $K_a = 0.12$, and gives 93 kPa·deg with zero drift. So: the first 32 kPa·deg of relief is free; the next 30 costs 9 m/s of lateral velocity that guidance must later remove. That is the trade the exercise asks you to state.
:::

::: key
Load relief: the controller partially steers into the wind, accepting attitude and trajectory error to reduce $\alpha$ and hence $\bar{q}\alpha$. The cost is insertion accuracy and extra $\Delta v$; the benefit is not breaking the vehicle. It is active only through the high-$\bar{q}$ region.
:::

## What the trade costs downstream

The lateral velocity error accumulated during load relief does not vanish when $\bar{q}$ does. Ascent guidance is open-loop through the atmosphere — a stored pitch program, wind-biased — and the closed-loop guidance that steers to the target orbit takes over only when the vehicle is clear of significant dynamic pressure, typically two to three minutes into flight. Whatever lateral velocity and position error load relief has produced must then be steered out with thrust that would otherwise have gone into the orbit: a few metres per second of $\Delta v$ for a typical wind, tens for a severe one, and a dispersion in the staging state that the upper stage must absorb. That is the "insertion accuracy and extra $\Delta v$" in the key statement above.

Because the cost is real and the benefit exists only when $\bar{q}$ is large, the acceleration feedback gain is **scheduled**: zero at lift-off, ramped up entering the high-$\bar{q}$ window (roughly 40 to 100 s for the vehicle of Lesson 2), and ramped back to zero as dynamic pressure collapses. Outside the window an accelerometer loop would only add drift and noise.

Two dynamic caveats. First, the quasi-static analysis assumes the loop has settled; a gust that rises in one second hits a loop with a 0.36 Hz crossover at nearly full strength, so the *transient* $\bar{q}\alpha$ exceeds the steady value and the design gust allowances are built for that. Second, the accelerometer also senses the gimbal's own force $-T\delta/m$ and, if mounted away from the centre of gravity, the angular acceleration $\ell_{\text{acc}}\ddot\theta$; both feed through the actuator and reshape the loop, and too large a $K_a$ erodes the attitude loop's phase margin. Load relief is a stability design as much as a load design.

::: warning
Load relief does not mean flying at zero angle of attack. Zero $\alpha$ is the load-minimum extreme, and it steers the vehicle upwind at $T\alpha_w/m$ — three times faster than the wind pushes an attitude-holding vehicle downwind. Every practical design carries part of the wind as angle of attack, and the drift-minimum point, where the two pushes cancel, still carries three quarters of it.
:::

::: warning
Watch the units of the load indicator. $\bar{q}\alpha$ in kPa·deg uses $\alpha$ in degrees; the normal force formula uses $\alpha$ in radians. $125\ \mathrm{kPa\cdot deg}$ is $2.18\ \mathrm{kPa\cdot rad}$, and a certified envelope stated in psf·deg must be converted before you compare.
:::

## Check yourself

::: check
A vehicle at $\bar{q} = 28\ \mathrm{kPa}$ has a certified load-indicator limit of 90 kPa·deg. What total angle of attack does that allow? If the mean wind has been biased out and the residual wind produces $\alpha_w = 2.5^\circ$, is the attitude-hold response inside the envelope?
:::

::: answer
The allowed total angle of attack is $90/28 = 3.2^\circ$. Attitude hold gives $\alpha \approx \alpha_w$, or slightly more with a finite-gain loop — say $2.7^\circ$ with the 10 % amplification of the example — and $28 \times 2.7 = 76\ \mathrm{kPa\cdot deg}$, inside the envelope but with only 14 kPa·deg to spare for gusts. A 1 m/s² gust-induced transient would use it up; load relief provides the margin.
:::

::: check
Explain in physical terms why the gimbal's trim force adds to the aerodynamic side force rather than cancelling it, and what that does to the drift of an attitude-holding vehicle.
:::

::: answer
The centre of pressure is forward of the centre of gravity, so the normal force rotates the nose away from the wind. To hold attitude the engine must produce a moment toward the wind, and since the engine is at the tail that means pushing the tail away from the wind — in the same direction the normal force is pushing the nose. Both forces point downwind, so the net lateral force is $N(1 + \ell_\alpha/\ell_T)$, roughly twice $N$ for the example booster, and an attitude-holding vehicle drifts downwind faster than the aerodynamics alone would carry it.
:::

::: check
For the example booster, what accelerometer gain $K_a$ makes $\alpha/\alpha_w = 0.25$, and what lateral acceleration results in a 4° wind? Compare with the $\alpha/\alpha_w = 0.5$ design.
:::

::: answer
$K_a c = K_p/0.25 - K_p + 0.173 = 7.52 - 1.88 + 0.173 = 5.81$, so $K_a = 5.81/6.93 = 0.84\ \mathrm{rad}$ per m/s². The angle of attack is $1^\circ$ (31 kPa·deg), the attitude error $-3^\circ$, and $a_{\text{lat}} = 0.121 \times 1 - 20 \times 0.0524 = 0.12 - 1.05 = -0.93\ \mathrm{m/s^2}$ upwind — twice the drift of the 0.5 design for another 32 kPa·deg of relief. The gain is also almost three times larger, with the corresponding erosion of the attitude loop's margins.
:::

::: check
Why is load relief switched off outside the high-dynamic-pressure window, rather than left on throughout the ascent?
:::

::: answer
The benefit of load relief is a reduction in $\bar{q}\alpha$, which is only worth having when $\bar{q}$ is large enough for $\alpha$ to threaten the structure. Its cost — lateral drift from tilting the thrust vector, and the noise and phase loss of the accelerometer loop — is paid whenever the gain is non-zero. Above 40–60 km the dynamic pressure is a few kilopascals or less, so even large angles of attack are harmless while every degree of attitude error steers the trajectory. The gain is therefore scheduled to zero outside the window.
:::

::: check
A 30 m/s wind shear over one kilometre of altitude is crossed in three seconds. Using the quasi-static formula, what does the load-relief loop of the worked example do to the resulting $\alpha$, and why will the actual peak $\bar{q}\alpha$ be higher than the quasi-static value?
:::

::: answer
At 420 m/s the shear produces $\alpha_w = \arctan(30/420) = 4.1^\circ$. Quasi-statically the $\alpha/\alpha_w = 0.5$ design would hold $\alpha$ at $2.0^\circ$, or 63 kPa·deg at 31.3 kPa. But the shear arrives in three seconds while the attitude loop's crossover is 0.36 Hz — a response time of the order of a second or two — so for the first second or so the vehicle sees close to the full $4.1^\circ$ before the nose has turned into the wind. The transient peak lies between the two values, and the design must budget for it; the exercise's shear injection is meant to show exactly this spike.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\bar{q}\alpha$ | load indicator, kPa·deg; $\propto N \propto$ bending moment |
| $N = \bar{q} S C_{N\alpha}\alpha$ | normal force; 92 kN at 4°, 31.3 kPa for the example booster |
| $m\ddot z = N_\alpha\alpha - T\delta + T\theta$ | lateral equation with the thrust-tilt term |
| $\delta_{\text{trim}} = -(\mu_\alpha/\mu_\delta)\alpha$ | quasi-static trim gimbal |
| $c = (N_\alpha/m)(1 + \ell_\alpha/\ell_T)$ | aerodynamic plus trim-gimbal lateral acceleration per radian of $\alpha$ |
| $a_{\text{lat}} = c\alpha + (T/m)\theta$ | total lateral acceleration; $\theta = \alpha - \alpha_w$ |
| Attitude hold | $\alpha = \alpha_w$: full load, downwind drift $c\alpha_w$ |
| Drift minimum | $\alpha/\alpha_w = 1/[1 + (N_\alpha/T)(1 + \ell_\alpha/\ell_T)]$ = 0.743 for the example |
| Accelerometer law | $\alpha/\alpha_w = K_p/(K_p + K_a c - \mu_\alpha/\mu_\delta)$ |
| Cost of relief | lateral velocity and position error, extra $\Delta v$ at guidance takeover; active only through high $\bar{q}$ |

The wind has so far been a number, $\alpha_w$. The next lesson describes the real thing: mean profiles, shear, discrete gusts and the Dryden and von Kármán turbulence spectra that a simulation uses to generate them.
