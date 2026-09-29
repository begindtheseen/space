---
id: l08-gain-scheduling
title: Gain scheduling across a flight envelope
minutes: 24
covers:
  - Gain scheduling across a flight envelope; arrays of LTI models
---

Think about steering a car. In a parking lot at walking speed, you turn the wheel a long way to make a gentle turn. On the highway, the same turn of the wheel would put you in the next lane, so you move it only a little. The car did not change. Its speed did, and speed changes how strongly the car answers the wheel. A good driver adjusts without thinking: big motions slow, small motions fast.

A rocket's autopilot has the same problem, only far worse. In the first seconds after lift-off, the air barely pushes on the vehicle. A minute later, at **[[max-q|dynamic-pressure]]**, the air pushes on it harder than at any other moment of the flight. A couple of minutes after that, the air is almost gone again, the vehicle has burned most of its propellant, and it is several times lighter. The same nozzle swing gives a very different turning effect at each of those moments.

**Gain scheduling** is how an autopilot copes: design a set of controller gains at several chosen flight conditions, store them in a table, and during flight look up (and blend) the gains for the condition the vehicle is in now. The last lesson tuned one controller for one model. This lesson designs five at once, using MATLAB's **arrays of LTI models**, and then checks that the blending between them behaves.

## Why one set of gains is not enough

Everything in lessons 01 to 07 assumed a **linear time-invariant** (LTI) plant: a model whose numbers never change. A launch vehicle is not like that. Its numbers drift all through the climb. What we can do is freeze the flight at a chosen instant, called a **design point** or **flight condition**, and write the LTI model that holds near that instant. The whole ascent becomes a string of these frozen snapshots.

Here is the simplest honest pitch model of a rocket at one design point. Let $\theta$ (read "theta") be the pitch angle and $\delta$ (read "delta") the angle the engine nozzle is swung, both in radians. Then

$$
\ddot{\theta} = M_\alpha\,\theta + M_\delta\,\delta
$$

Read $\ddot{\theta}$ as "theta double dot": the pitch acceleration. The two coefficients carry the physics:

- $M_\alpha$ ("M sub alpha"), in $1/\mathrm{s^2}$, is the pitch acceleration the air causes per radian of **angle of attack** (the angle between the vehicle's nose and the oncoming air). For a rocket it is usually positive, because the vehicle is **[[aerodynamically unstable|aero-unstable]]**: the air tends to turn it further sideways. We treat the angle of attack as equal to $\theta$ here, which is fine for a short look at the attitude loop. $M_\alpha$ grows with dynamic pressure, so it is near zero at lift-off and largest near max-q.
- $M_\delta$ ("M sub delta"), also in $1/\mathrm{s^2}$, is the pitch acceleration per radian of nozzle swing. It is thrust times lever arm divided by the moment of inertia. As propellant burns, the inertia falls and $M_\delta$ grows.

Taking the Laplace transform, the plant from nozzle to pitch angle is

$$
G(s) = \frac{M_\delta}{s^2 - M_\alpha}
$$

with one pole at $+\sqrt{M_\alpha}$ in the right half plane when $M_\alpha > 0$. An unstable plant: the autopilot is what keeps the rocket pointed.

Our illustrative vehicle has these five design points, spread from subsonic flight to well past max-q. The **Mach number** is the speed divided by the local speed of sound, and $\bar{q}$ ("q bar") is dynamic pressure.

| Point | Mach | $\bar{q}$ (kPa) | $M_\alpha$ ($1/\mathrm{s^2}$) | $M_\delta$ ($1/\mathrm{s^2}$) |
|---|---|---|---|---|
| 1 | 0.5 | 8 | 0.4 | 1.6 |
| 2 | 0.9 | 22 | 1.5 | 2.0 |
| 3 | 1.3 | 32 | 3.2 | 2.5 |
| 4 | 2.0 | 20 | 1.8 | 3.2 |
| 5 | 3.5 | 6 | 0.3 | 4.5 |

Across just these five points, $M_\alpha$ changes by a factor of about eleven ($3.2 / 0.3 \approx 10.7$) and $M_\delta$ by a factor of about three ($4.5 / 1.6 \approx 2.8$). Include the moment of lift-off, where $\bar{q}$ is zero, and $M_\alpha$ spans from nothing to its peak. Real vehicles also shift their center of gravity as tanks drain.

::: key
Dynamic pressure, mass, center of gravity and aerodynamic moments change by orders of magnitude between lift-off and **[[MECO|meco]]**, so a single fixed gain set cannot hold margins across the trajectory. Gains are scheduled on a measurable variable such as Mach or time from lift-off.
:::

## Designing at each point

We use a PD controller, $\delta = -K_p\,\theta - K_d\,\dot{\theta}$ (steering toward $\theta = 0$), with the pitch rate $\dot{\theta}$ measured by a rate gyro. Put it into the plant:

$$
\ddot{\theta} = M_\alpha\theta - M_\delta K_p\theta - M_\delta K_d\dot{\theta}
\quad\Longrightarrow\quad
\ddot{\theta} + M_\delta K_d\,\dot{\theta} + (M_\delta K_p - M_\alpha)\,\theta = 0
$$

Compare that with the standard second-order form from lessons 02 and 03, $\ddot{\theta} + 2\zeta\omega_n\dot{\theta} + \omega_n^2\theta = 0$, where $\omega_n$ ("omega sub n") is the natural frequency and $\zeta$ ("zeta") the damping ratio. Matching the two terms gives the gains:

$$
K_p = \frac{\omega_n^2 + M_\alpha}{M_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{M_\delta}
$$

Read what these say. A bigger $M_\delta$ (more control power) means smaller gains. A bigger $M_\alpha$ (a more unstable vehicle) means a bigger $K_p$, because part of the proportional gain is spent canceling the air's push before any is left to steer. So we pick the *same* closed-loop behavior everywhere, $\omega_n = 3\,\mathrm{rad/s}$ and $\zeta = 0.7$, and let the gains change to deliver it. That is the heart of scheduling: hold the behavior fixed and let the gains move.

To make the loop realistic we add a nozzle actuator, $\frac{25}{s + 25}$, which the gain formulas ignore. Then we check the margins with the real actuator in place.

::: example Gains and margins at max-q
Point 3 has $M_\alpha = 3.2\,\mathrm{s^{-2}}$ and $M_\delta = 2.5\,\mathrm{s^{-2}}$.

**Proportional gain.** $K_p = \frac{3^2 + 3.2}{2.5} = \frac{12.2}{2.5} = 4.88$ radians of nozzle per radian of pitch error.

**Derivative gain.** $K_d = \frac{2 \times 0.7 \times 3}{2.5} = \frac{4.2}{2.5} = 1.68$ seconds.

**Check the closed loop without the actuator.** $M_\delta K_d = 2.5 \times 1.68 = 4.2 = 2\zeta\omega_n$, and $M_\delta K_p - M_\alpha = 12.2 - 3.2 = 9 = \omega_n^2$. Both match the target.

**With the actuator.** The loop, broken at the nozzle command, is $L(s) = \frac{25}{s+25}\,(K_p + K_d s)\,\frac{M_\delta}{s^2 - M_\alpha}$. Computed with `margin`: phase margin about $46.0^\circ$ at crossover $4.26\,\mathrm{rad/s}$. Without the actuator the same loop would have about $56^\circ$; the actuator's lag has eaten about ten degrees.

**The gain-reduction margin.** Because the plant is unstable, the loop also fails if its gain *drops* too far. The constant term $M_\delta K_p - M_\alpha$ goes negative if the gain is multiplied by less than $\frac{M_\alpha}{M_\delta K_p} = \frac{3.2}{12.2} \approx 0.262$. That is a margin of $20\log_{10}(0.262) \approx -11.6\,\mathrm{dB}$: the gain can fall to about a quarter before the vehicle diverges.

**Sanity check.** Max-q is the hardest point, with the largest $M_\alpha$, and it has the smallest margins of the five: the other four points have phase margins between about $50^\circ$ and $54^\circ$ and gain-reduction margins from $-15.6$ to $-29.8\,\mathrm{dB}$. That pattern is what you would expect.
:::

::: warning Unstable plants have a lower gain margin too
For a stable plant, "gain margin" means how much the gain can *grow*. For an aerodynamically unstable rocket there is also a limit on how far it can *shrink*, because the controller needs enough authority to overpower the air. Flight teams report both. In MATLAB, `allmargin(L)` lists every gain-margin crossing, while `margin(L)` returns one number, so for an unstable plant read `allmargin` or compute the low-frequency limit yourself, as above.
:::

## Arrays of LTI models

Doing that by hand five times is tedious. MATLAB lets one variable hold a whole family of models. A **[[model array|array-pages]]** (or LTI array) is a stack of models with the same number of inputs and outputs, indexed like the pages of a book. The first two indices pick outputs and inputs, as always. The indices after that pick which model in the stack.

The standard way to build one is to make an empty array of the right size and fill it:

```matlab
Mach = [0.5 0.9 1.3 2.0 3.5];
Ma   = [0.4 1.5 3.2 1.8 0.3];     % 1/s^2
Md   = [1.6 2.0 2.5 3.2 4.5];     % 1/s^2

s = tf('s');
G = tf(zeros(1,1,5));             % five 1-input, 1-output models, all zero for now
for k = 1:5
    G(:,:,k) = Md(k)/(s^2 - Ma(k));
end
G.SamplingGrid = struct('Mach', Mach(:));   % label each model with its Mach
```

Read `G(:,:,k)` aloud as "all outputs, all inputs, model k". The optional `SamplingGrid` line tags each model with its flight condition.

If you already have separate models, `stack` glues them along an array dimension: `G = stack(1, G1, G2, G3, G4, G5)` puts five models into a 5-by-1 array. Pull models back out by indexing: `G(:,:,3)` is the max-q model, and `G(:,:,[1 5])` is a smaller array of the first and last. `size(G)` reports both the input-output size and the array size.

The payoff is that almost everything you already know works on the whole array at once. Build the controllers the same way, then:

```matlab
wn = 3;  zeta = 0.7;
Kp = (wn^2 + Ma)./Md;             % 5.875  5.250  4.880  3.375  2.067
Kd = 2*zeta*wn./Md;               % 2.625  2.100  1.680  1.312  0.933

C   = pid(Kp(:), 0, Kd(:));       % a 5x1 array of PD controllers
act = 25/(s + 25);                % one actuator model, shared by all
L   = act*C*G;                    % five loops: model k times controller k

[~, Pm, ~, Wcp] = margin(L);      % Pm and Wcp come back as arrays, one per model
gmLow = 20*log10(1./abs(squeeze(dcgain(L))));   % gain-reduction margins, dB

bode(L), grid on                  % all five Bode curves on one plot
step(feedback(L, 1))              % all five closed-loop step responses
```

Two rules make this work. When two arrays of the same size are combined, model $k$ of one meets model $k$ of the other. When a single model is combined with an array, as `act` is here, it is reused for every model. The results line up with what we found by hand:

| Mach | 0.5 | 0.9 | 1.3 | 2.0 | 3.5 |
|---|---|---|---|---|---|
| $K_p$ | 5.875 | 5.250 | 4.880 | 3.375 | 2.067 |
| $K_d$ (s) | 2.625 | 2.100 | 1.680 | 1.312 | 0.933 |
| Phase margin | 53.4° | 50.5° | 46.0° | 49.7° | 53.7° |
| Crossover (rad/s) | 4.52 | 4.41 | 4.26 | 4.39 | 4.53 |
| Gain-reduction margin (dB) | −27.4 | −16.9 | −11.6 | −15.6 | −29.8 |

The design did what it set out to do. The gains change by almost a factor of three, yet the crossover stays between $4.26$ and $4.53\,\mathrm{rad/s}$ and the phase margin between $46^\circ$ and $54^\circ$.

::: key
A model array holds many LTI models of the same input-output size. Build it by preallocating, `G = tf(zeros(1,1,N))`, and filling `G(:,:,k)`, or with `stack(1, G1, ..., GN)`. Index with `G(:,:,k)`. Arithmetic, `feedback`, `margin`, `bode` and `step` act model by model; a single model combined with an array is reused for every element.
:::

::: warning Arrays need matching shapes
Every model in an array must have the same number of inputs and outputs, though the orders may differ. And when two arrays meet, their array sizes must match exactly: a 5-by-1 array times a 1-by-5 array is an error, not a broadcast. That is why the code above writes `Kp(:)` to make a column: `pid(Kp, 0, Kd)` with row vectors would build a 1-by-5 array that does not match the 5-by-1 plant array.
:::

## What happens without a schedule

Why go to all this trouble? Try flying one fixed set of gains through the whole envelope. Take the gains designed for Mach 3.5, where the air is thin and control power is high, and use them at max-q:

::: example One gain set flown at max-q
The Mach 3.5 gains are $K_p = 2.067$ and $K_d = 0.933\,\mathrm{s}$. At max-q, $M_\alpha = 3.2$ and $M_\delta = 2.5$.

**Stiffness left over.** $M_\delta K_p - M_\alpha = 2.5 \times 2.067 - 3.2 \approx 5.17 - 3.2 = 1.97$. Compare the $9$ the schedule delivers. The air is using up most of the proportional gain.

**Gain-reduction margin.** $\frac{M_\alpha}{M_\delta K_p} = \frac{3.2}{5.17} \approx 0.62$, which is $20\log_{10}(0.62) \approx -4.2\,\mathrm{dB}$. Losing 38 percent of control power (a weak engine, a thrust dispersion, an aerodynamic estimate that was optimistic) would let the vehicle diverge. A typical requirement is at least $6\,\mathrm{dB}$, a factor of $2$.

**Phase margin and speed.** Computed with the actuator: phase margin about $36^\circ$ at crossover $1.89\,\mathrm{rad/s}$, less than half the designed crossover. The rocket would respond sluggishly to wind gusts at exactly the moment they matter most.

**The other direction.** Flying the Mach 0.5 gains at Mach 3.5 goes wrong the other way. The loop crosses over at about $11.0\,\mathrm{rad/s}$, two and a half times faster than designed. That is a nervous autopilot, working the actuator hard and reaching toward the frequencies of the bending modes from lessons 04 and 07.

**Sanity check.** Both failures match the physics: gains built for thin air are too timid in thick air, and gains built for a heavy vehicle are too aggressive for a light one.
:::

## Choosing what to schedule on

A schedule needs a **scheduling variable**: the number the flight software reads to decide where it is in the table. There are three common families of choice.

- **Time since lift-off.** The simplest. The clock is always available and never noisy.
- **Mach number** or **dynamic pressure**, estimated from the navigation system's velocity and altitude and an atmosphere model.
- **Mass or propellant used**, from engine flow measurements or navigation.

The deciding question is what actually makes the plant change. $M_\alpha$ is set by the air: by $\bar{q}$ and by how the aerodynamic coefficients vary with Mach. $M_\delta$ is set by thrust and inertia. The clock only stands in for those things, and it stands in well only when the vehicle flies exactly the planned trajectory.

Real flights do not fly exactly the plan. Engines run a percent or two hot or cold, the vehicle is a little heavier than predicted, the air is warmer than the standard day. Engineers test this with **[[Monte Carlo|monte-carlo]]** simulation: thousands of runs, each with the uncertain quantities drawn at random. A hot-engine run reaches max-q early. If the gains follow the clock, that vehicle is still using pre-max-q gains while it sits in the thickest air. A gain table indexed by Mach or $\bar{q}$ follows the vehicle wherever it actually is.

One more property matters for a one-dimensional table: the variable should move in **one direction** along the trajectory. Mach rises steadily through the whole ascent, so each Mach value names exactly one moment. Dynamic pressure rises to max-q and then falls, so $\bar{q} = 20\,\mathrm{kPa}$ happens twice, once before max-q and once after, and our table shows those two moments need different gains (point 4 against a point between 1 and 2). Scheduling on $\bar{q}$ alone would blur them. Teams that want $\bar{q}$ usually add a second variable, such as Mach, and build a two-dimensional table.

::: warning The frozen-point assumption
Every design point is a snapshot of a flight that is really changing. The snapshots are trustworthy only if the scheduling variable changes slowly compared with how fast the loop settles. Our loop settles in a second or two, and through the dense part of a typical ascent Mach climbs by only a few hundredths per second, so the frozen models are fine. If the plant changed as fast as the loop, a gain schedule could be stable at every frozen point and still unstable in flight. The final check is always a time simulation with the real, changing plant.
:::

## Blending between points, and checking the blend

Between two design points, the flight software must invent gains. The usual rule is **linear interpolation**: draw a straight line between the two nearest table values. In MATLAB that is `interp1`:

```matlab
KpNow = interp1(Mach, Kp, 1.1)    % 5.065
KdNow = interp1(Mach, Kd, 1.1)    % 1.890
```

Mach $1.1$ is halfway between $0.9$ and $1.3$, so $K_p$ is halfway between $5.25$ and $4.88$: $\frac{5.25 + 4.88}{2} = 5.065$. The same logic gives $K_d = \frac{2.1 + 1.68}{2} = 1.89$.

::: warning interp1 returns NaN outside the table
Ask `interp1(Mach, Kp, 4.0)` for a Mach number past the last breakpoint and MATLAB returns `NaN`, not the end value. A `NaN` gain in flight software means a `NaN` nozzle command. Clamp the input first, `m = min(max(MachNow, Mach(1)), Mach(end))`, so the table holds its end values. Flight **[[lookup tables|lookup-tables]]** do the same.
:::

::: example Checking the interpolated gains between design points
Interpolated gains are only sane if they still control the plant that actually exists between the points. So take four check points halfway between design points, with their own plant numbers from the aerodynamic database, and test the blended gains on them.

| Mach | $M_\alpha$ | $M_\delta$ | $K_p$ interpolated | $K_p$ if designed there |
|---|---|---|---|---|
| 0.7 | 0.9 | 1.8 | 5.562 | 5.500 |
| 1.1 | 2.4 | 2.25 | 5.065 | 5.067 |
| 1.65 | 2.6 | 2.85 | 4.128 | 4.070 |
| 2.75 | 0.9 | 3.8 | 2.721 | 2.605 |

**Mach 1.1 by hand.** Designed directly: $K_p = \frac{9 + 2.4}{2.25} \approx 5.067$. The interpolated value, $5.065$, is within $0.05\%$ of it.

**Margins with the blended gains.** Computed with the actuator: phase margins of $52.2^\circ$, $48.6^\circ$, $47.8^\circ$ and $51.7^\circ$; gain-reduction margins of $-20.9$, $-13.5$, $-13.1$ and $-21.2\,\mathrm{dB}$. Every one sits inside the range of the five design points ($46^\circ$ to $54^\circ$, and never thinner than $-11.6\,\mathrm{dB}$).

**Sanity check.** The worst interpolation error is at Mach 2.75, where the design points are far apart ($2.0$ to $3.5$). The blended $K_p$ is about $4\%$ higher than a direct design ($2.721 / 2.605 \approx 1.045$), and the margins barely notice. If a gap had shown a real drop in margin, the fix would be to add a design point there.
:::

In MATLAB the check is a loop over a fine grid of Mach values, or a second model array of check-point plants. A reviewer will ask:

1. Do the interpolated gains reproduce the design gains at the breakpoints?
2. Between breakpoints, do the gains stay between their neighbors, with no bumps?
3. Do margins at in-between plants stay inside the band of the design points?
4. What happens past the ends of the table?
5. Does a time simulation, with the plant changing continuously, agree?

::: warning Smooth-looking curves can overshoot
It is tempting to use `interp1(Mach, Kp, m, 'spline')` because the curve looks smoother. A **[[cubic spline|spline-overshoot]]** can swing past the data. For this table it dips to $K_p \approx 1.51$ near Mach 3.06, about $27\%$ below the smallest designed value of $2.067$. That is a gain nobody designed or checked. Linear interpolation can never leave the range of its neighbors. If you need smoothness, `'pchip'` also stays within the range of neighboring points.
:::

## Check yourself

::: check
A design point has $M_\alpha = 2.0\,\mathrm{s^{-2}}$ and $M_\delta = 4.0\,\mathrm{s^{-2}}$. Using $\omega_n = 3\,\mathrm{rad/s}$ and $\zeta = 0.7$, find $K_p$ and $K_d$, and the gain-reduction margin in dB (ignore the actuator).
:::

::: answer
$K_p = \frac{9 + 2}{4} = 2.75$ and $K_d = \frac{4.2}{4} = 1.05\,\mathrm{s}$. The loop goes unstable if the gain is scaled below $\frac{M_\alpha}{M_\delta K_p} = \frac{2}{11} \approx 0.182$. In decibels that is $20\log_{10}(0.182) \approx -14.8\,\mathrm{dB}$. The gain can fall to under a fifth of nominal before the vehicle diverges.
:::

::: check
You have five controllers `C1` to `C5` as separate variables and a 5-by-1 plant array `G`. Write the lines that put the controllers in an array and compute all five phase margins. What error would you get from `pid(Kp, 0, Kd)` with row vectors instead?
:::

::: answer
`C = stack(1, C1, C2, C3, C4, C5);` makes a 5-by-1 array. Then `[~, Pm] = margin(C*G);` gives a 5-element array of phase margins, model $k$ of `C` paired with model $k$ of `G`. With row vectors, `pid(Kp, 0, Kd)` builds a 1-by-5 array, and combining it with the 5-by-1 `G` fails because the array sizes do not match. Use `Kp(:)` and `Kd(:)`.
:::

::: check
The flight software looks up gains with `interp1(Mach, Kp, m)`. During a test the navigation estimate briefly reads Mach 0.45, below the first breakpoint of 0.5. What happens, and how do you prevent it?
:::

::: answer
`interp1` returns `NaN` for any query outside the breakpoints, so $K_p$ becomes `NaN`, and so does every nozzle command computed from it. Clamp the query first: `m = min(max(m, Mach(1)), Mach(end))`. At Mach 0.45 that uses the Mach 0.5 gains, which are the right ones to hold at the edge of the table.
:::

::: check
A colleague schedules the gains on $\bar{q}$ with a one-dimensional table. Using this lesson's table, explain what goes wrong at $\bar{q} = 20\,\mathrm{kPa}$.
:::

::: answer
Dynamic pressure is $20\,\mathrm{kPa}$ twice: on the way up to max-q (between points 1 and 2, around Mach 0.85) and on the way down (point 4, Mach 2.0). The plants differ: after max-q, $M_\delta$ is larger because the vehicle is lighter ($3.2$ against roughly $2.0$), so the right $K_p$ is much smaller. A one-dimensional $\bar{q}$ table can store only one answer per value, so it must be wrong at one of the two moments. Mach is monotonic on ascent, so it has no such ambiguity; a two-dimensional table over $\bar{q}$ and Mach also fixes it.
:::

::: check
All five design points have healthy margins. Name two further things you must check before calling the schedule sane.
:::

::: answer
Any two of these. Check the margins at plants *between* the design points with the interpolated gains, since that is where the vehicle spends almost all its time. Check that the interpolation does not overshoot (linear cannot; splines can). Check what happens outside the table, and clamp the input. Check the frozen-point assumption with a time simulation in which the plant and the gains change continuously. And check dispersed cases, such as a Monte Carlo run, since the real vehicle will not fly the nominal trajectory.
:::

## Summary

| Idea | Meaning | Formula or command |
|---|---|---|
| Design point | a frozen flight condition with its own LTI model | $G(s) = \frac{M_\delta}{s^2 - M_\alpha}$ |
| Scheduled PD gains | hold $\omega_n$, $\zeta$ fixed; gains move | $K_p = \frac{\omega_n^2 + M_\alpha}{M_\delta}$, $K_d = \frac{2\zeta\omega_n}{M_\delta}$ |
| Gain-reduction margin | how far gain may drop on an unstable plant | $20\log_{10}\frac{M_\alpha}{M_\delta K_p}$ dB |
| Model array | a stack of LTI models, same I/O size | `tf(zeros(1,1,N))`, `G(:,:,k)`, `stack` |
| Array arithmetic | element by element; one model is reused | `act*C*G`, `margin`, `bode`, `step` |
| Scheduling variable | what the table is indexed by | follows the physics; monotonic |
| Interpolation | linear between breakpoints | `interp1`, clamp the input, avoid `'spline'` |

Next lesson: the scheduling variable, the navigation estimate and every force on the vehicle live in some coordinate frame. Lesson 09 names the frames a GNC engineer uses, from Earth-centered inertial to the local north-east-down, and converts a real position between them.

::: context dynamic-pressure The moment of maximum squeeze
Dynamic pressure is $\bar{q} = \tfrac{1}{2}\rho V^2$, where $\rho$ is air density and $V$ is speed. It measures how hard the oncoming air pushes on the vehicle. Just after lift-off $V$ is small; high up, $\rho$ is tiny. In between, the product peaks, and that peak is called max-q. For large launchers it is typically a few tens of kilopascals, reached about a minute into flight. Many vehicles throttle their engines down through max-q to keep the aerodynamic loads within what the structure can carry.
:::

::: context aero-unstable Why the air tries to flip a rocket
The air's sideways push on a vehicle acts at a point called the center of pressure. Its weight and inertia act at the center of gravity. An arrow has feathers at the back, so its center of pressure sits behind its center of gravity, and any tilt makes the air swing the nose back into line. Most large rockets have no big fins, and the long body ahead of the center of gravity catches much of the air, so the center of pressure sits in front. Then a tilt makes the air swing the nose further off. The engine's gimbal has to fight that all the way up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="58" width="220" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="280,58 320,70 280,82" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="160" cy="70" r="7" fill="#1f2a44"/>
  <text x="140" y="104" font-size="12" fill="#1f2a44">CG</text>
  <circle cx="230" cy="70" r="7" fill="#b4232c"/>
  <text x="222" y="104" font-size="12" fill="#b4232c">CP</text>
  <line x1="230" y1="20" x2="230" y2="56" stroke="#b4232c" stroke-width="3"/>
  <polygon points="230,60 224,48 236,48" fill="#b4232c"/>
  <text x="238" y="30" font-size="11" fill="#b4232c">air push</text>
  <text x="325" y="74" font-size="11" fill="#1f2a44">nose</text>
  <text x="60" y="130" font-size="11" fill="#6c7a93">CP ahead of CG: the push turns the nose further away</text>
</svg>
```
:::

::: context meco When the main engines stop
MECO stands for main engine cutoff: the moment the first stage (or core stage) engines shut down, a couple of minutes to several minutes after lift-off depending on the vehicle. By then the stage has burned most of its propellant, so its mass may be a small fraction of what it was on the pad, and it is far above the thick part of the atmosphere. Between lift-off and MECO the autopilot sees nearly every combination of mass and air it will ever meet.
:::

::: context array-pages A stack of models like pages in a binder
Picture a binder. Every page has the same layout, a one-input, one-output box, but the numbers on each page are for a different Mach. The first two indices of `G(:,:,k)` say where on the page to look; the third says which page. MATLAB stores the whole binder in one variable, so a single command can run down every page.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="14" width="150" height="70" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="108" y="26" width="150" height="70" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="96" y="38" width="150" height="70" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="84" y="50" width="150" height="70" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="72" y="62" width="150" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="84" y="86" font-size="12" fill="#1f2a44">G(:,:,1)  Mach 0.5</text>
  <text x="84" y="112" font-size="12" fill="#1f2a44">1.6 / (s² − 0.4)</text>
  <text x="280" y="30" font-size="11" fill="#1f2a44">k = 5, Mach 3.5</text>
  <text x="240" y="140" font-size="11" fill="#6c7a93">five pages, one variable</text>
</svg>
```
:::

::: context monte-carlo Rolling the dice thousands of times
A Monte Carlo simulation runs the same flight many times, each time drawing the uncertain inputs at random from their expected spread: engine thrust, vehicle mass, aerodynamic coefficients, winds, sensor errors. The name comes from the casino in Monaco, a code name used by Los Alamos scientists in the 1940s for this style of computing by random sampling. The spread of the results shows how often the design meets its requirements, which is the number a flight review wants to see.
:::

::: context lookup-tables Where the gain table lives in flight
On the vehicle, the schedule is a table of breakpoints and values compiled into the flight software, usually built in Simulink with a lookup-table block that interpolates and clamps at the ends. The Simulink module comes back to these blocks in its lesson on lookup tables for aerodynamic and engine data. Keeping the table as data, separate from the code, lets the guidance and control team update gains for a new mission without touching the logic that uses them.
:::

::: context spline-overshoot A smooth curve that invents gains
A cubic spline threads a smooth curve through every data point, with matching slope and curvature where the pieces meet. To keep that smoothness it may bulge above or dip below the data between points. Here the spline through the five $K_p$ values dips well below the last design value before climbing back to it. The straight-line interpolation (dashed) never leaves the range of its two neighbors.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,28 79,42 117,50 185,85 330,115" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline points="40,28 50,33 59,37 69,40 79,42 88,44 98,46 108,48 117,50 127,54 137,58 146,63 156,68 166,73 175,79 185,85 195,91 204,97 214,103 224,108 233,113 243,118 253,122 262,125 272,127 282,128 291,128 301,127 311,125 320,121 330,115" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="40" cy="28" r="4"/><circle cx="79" cy="42" r="4"/><circle cx="117" cy="50" r="4"/><circle cx="185" cy="85" r="4"/><circle cx="330" cy="115" r="4"/></g>
  <line x1="40" y1="115" x2="340" y2="115" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="200" y="152" font-size="11" fill="#1f2a44">Mach 0.5 to 3.5 →</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">Kp</text>
  <text x="200" y="40" font-size="11" fill="#b4232c">spline</text>
  <text x="200" y="56" font-size="11" fill="#6c7a93">linear (dashed)</text>
  <text x="222" y="136" font-size="11" fill="#b4232c">dips to 1.51</text>
  <text x="44" y="110" font-size="11" fill="#1d6fd1">lowest design value 2.07</text>
</svg>
```
:::
