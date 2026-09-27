---
id: l02-time-responses
title: Watching a system respond with step, impulse, lsim, initial and stepinfo
minutes: 19
covers:
  - step, impulse, lsim, initial, stepinfo
---

Picture a car with cruise control. You are doing 50 km/h and you set it to 80. What happens next tells you everything about the controller. Does the car creep up slowly? Does it leap forward, shoot past 80 to 85, then sag back? How long before the needle sits still? A good controller gets there quickly, overshoots a little or not at all, and settles fast.

Engineers ask those same questions of every control loop, and they ask them with the same kind of test: change the command suddenly, then watch. The last lesson built models as MATLAB objects, ending with an antenna pointing loop,

$$
T(s) = \frac{4}{s^2 + 2s + 4}.
$$

This lesson feeds that model, and others, a set of standard test signals. `step` flips the command to a new value and holds it. `impulse` gives one sharp kick. `lsim` plays any input you like. `initial` starts the system away from rest and lets it recover. Then `stepinfo` turns a response curve into the handful of numbers that go into a requirements document. On a launch-vehicle or spacecraft team, "overshoot under 20 percent, settling under 5 seconds" is exactly the kind of line those numbers are checked against.

## The step response

A **[[step input|test-signals]]** jumps from 0 to 1 at time zero and stays there. It is the cruise-control button, the "point at that star" command, the new attitude target. The output it produces is the **step response**.

```matlab
s = tf('s');
T = 4/(s^2 + 2*s + 4);
step(T)            % no outputs: draws the plot
[y, t] = step(T);  % with outputs: returns the numbers, no plot
step(T, 8)         % choose the final time: 0 to 8 s
```

With no output arguments, `step` draws the curve. With outputs, it returns the samples as column vectors, and `y(k)` is the response at time `t(k)`. MATLAB picks the time grid for you unless you give a final time or a vector of times. Octave's `step` works the same way but chooses a coarser grid, so its sampled peak can be off in the second decimal place; ask for a fine time vector if that matters.

### The simplest response: a first-order lag

Start with the simplest system that takes time to respond:

$$
G(s) = \frac{1}{\tau s + 1}
$$

Here $\tau$ (read "tau") is the **[[time constant|time-constant]]**, in seconds. Its step response is $y(t) = 1 - e^{-t/\tau}$. It never overshoots. It climbs quickly at first, then more and more slowly, like a cup of hot tea cooling toward room temperature in reverse. After one time constant it has covered $1 - e^{-1} \approx 63.2\%$ of the way.

Two standard ways to say "how fast":

- **Rise time**: the time to go from 10% to 90% of the final value.
- **Settling time**: the time after which the response stays [[within 2%|settling-band]] of the final value for good.

For the first-order lag you can work both out by hand. Reaching a fraction $f$ of the way takes $t = -\tau \ln(1 - f)$. So 10% is reached at $0.105\tau$ and 90% at $2.303\tau$, and the rise time is $\tau \ln 9 \approx 2.20\,\tau$. Staying within 2% means $e^{-t/\tau} \le 0.02$, which gives $t = \tau \ln 50 \approx 3.91\,\tau$.

::: example A fin actuator with a 50 ms lag
A rocket's fin actuator is told to move $1^\circ$ and behaves like a first-order lag with $\tau = 0.05\,\mathrm{s}$.

```matlab
Act = tf(1, [0.05 1]);
[y, t] = step(Act, 0.3);
interp1(t, y, 0.05)       % response at one time constant
% ans = 0.6320
```

**Step 1: one time constant.** At $t = 0.05\,\mathrm{s}$ the fin has reached $1 - e^{-1} = 0.632$ of a degree. Octave reports $0.6320$ from its samples.

**Step 2: rise time.** $2.20\,\tau = 2.197 \times 0.05 = 0.110\,\mathrm{s}$.

**Step 3: settling time.** $3.91\,\tau = 3.912 \times 0.05 = 0.196\,\mathrm{s}$.

**Sanity check.** The fin is essentially where it was told within about a fifth of a second. A launch vehicle's attitude motion takes seconds, so this actuator is roughly ten times faster than what it steers. That is the kind of speed gap designers want, so the actuator's lag only nibbles at the loop's margins.
:::

### Second-order systems: natural frequency and damping

The antenna loop has $s^2$ in its denominator, so it is **second order**. Second-order systems can wobble. Think of a car's suspension: a spring that bounces and a shock absorber that calms the bounce. Every second-order system like $T$ can be written in a standard form with two numbers:

$$
T(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}
$$

- $\omega_n$, read "omega n", is the **natural frequency** in rad/s: how fast it would oscillate with no damping. It is the spring's stiffness.
- $\zeta$, read "zeta", is the **[[damping ratio|damping-ratio]]**, a pure number: the shock absorber. $\zeta = 0$ oscillates forever; $\zeta = 1$ is the fastest response with no overshoot; between 0 and 1 the response overshoots and rings down.

Match $T$ to the pattern. The last coefficient gives $\omega_n^2 = 4$, so $\omega_n = 2\,\mathrm{rad/s}$. The middle one gives $2\zeta\omega_n = 2$, so $\zeta = 2/(2 \times 2) = 0.5$.

For $0 < \zeta < 1$, three formulas predict the step response's shape:

$$
M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}, \qquad
t_p = \frac{\pi}{\omega_n\sqrt{1-\zeta^2}}, \qquad
t_s \approx \frac{4}{\zeta\omega_n}
$$

$M_p$ is the **overshoot** as a fraction of the final value: how far past the target the response swings. $t_p$ is the **peak time**, when the biggest value happens. $t_s$ is an estimate of the 2% settling time. For the antenna, $\sqrt{1 - 0.25} = 0.866$, so $M_p = e^{-\pi \times 0.5/0.866} = e^{-1.814} = 0.163$, about 16%. The peak comes at $t_p = \pi/(2 \times 0.866) = 1.81\,\mathrm{s}$. And $t_s \approx 4/(0.5 \times 2) = 4\,\mathrm{s}$.

::: warning The settling-time formula is an estimate
$4/(\zeta\omega_n)$ comes from the envelope $e^{-\zeta\omega_n t}$ falling to about 2%. The real response wiggles inside that envelope, so the true settling time can be a bit more or a bit less, and the formula knows nothing about zeros or extra poles. Use it for a first guess, then measure with `stepinfo`.
:::

## stepinfo: from a curve to numbers

A plot is good for eyes. A requirement needs numbers. `stepinfo` computes the standard ones from a step response and hands them back in a **struct**, the MATLAB record type from the core module, with one named field per number.

```matlab
S = stepinfo(T);
S.RiseTime        % about 0.819 s
S.SettlingTime    % about 4.04 s
S.Overshoot       % about 16.3 (percent)
S.Undershoot      % 0 (percent)
S.Peak            % about 1.163
S.PeakTime        % about 1.81 s
```

::: key
stepinfo gives rise time, settling time, overshoot, undershoot, peak and peak time from a step response, in one struct. It is how you turn a plot into a requirement check you can assert in a test.
:::

The struct also carries `SettlingMin` and `SettlingMax`, the lowest and highest values once the response has risen, and recent releases add a `TransientTime` field. `Overshoot` and `Undershoot` are in percent of the final value. **Undershoot** is how far the response first goes the *wrong way*, below zero, before heading for the target; most systems have none, and lesson 3 shows which ones do.

The defaults are the definitions from earlier: rise from 10% to 90%, settling within 2%. You can change them with name-value options, such as `stepinfo(T, 'SettlingTimeThreshold', 0.05)` for a 5% band or `stepinfo(T, 'RiseTimeLimits', [0.05 0.95])`.

`stepinfo` also accepts sampled data instead of a model. Give it the response and its times: `[y, t] = step(T); S = stepinfo(y, t);`. That form is how you check a response that came out of a nonlinear simulation or a flight log, where there is no transfer function at all.

A note on tools: Octave's control package has no `stepinfo`. The numbers above come from an independent calculation of the same definitions (Python with SciPy), rounded to three figures; MATLAB prints four digits and may differ slightly in the last one.

::: example Checking the antenna loop against a requirement
The pointing requirement says: overshoot at most 20%, settling time (2%) at most 5 s.

```matlab
S = stepinfo(T);
assert(S.Overshoot <= 20, 'overshoot requirement failed')
assert(S.SettlingTime <= 5, 'settling requirement failed')
```

**Step 1: predict.** From $\zeta = 0.5$ and $\omega_n = 2$, the formulas gave overshoot 16.3% and settling about 4 s.

**Step 2: measure.** `stepinfo` gives 16.3% and about 4.04 s. The overshoot formula is exact for this pure second-order system; the settling estimate was 1% low.

**Step 3: check.** $16.3 \le 20$ and $4.04 \le 5$, so both `assert` lines pass silently. If a later design change raised the overshoot to 25%, the first `assert` would stop the script with its message.

**Sanity check.** The peak value is $1 + 0.163 = 1.163$, which matches `S.Peak`. A pointing error that swings 16% past the target and settles in about 4 s is a lively but acceptable antenna.
:::

That `assert` pattern is the real reason `stepinfo` exists. A plot needs a person to look at it. Two `assert` lines can run in an **[[automated test|requirement-tests]]** every night, on every design change, and fail loudly the day someone breaks the loop.

::: warning Overshoot of a response that does not start at zero
`stepinfo(T)` assumes the step starts from rest at zero. With sampled data from a response that starts at some other value, pass the starting and final values too, as `stepinfo(y, t, yfinal, yinit)`, or the percentages are measured from the wrong baseline and come out wrong.
:::

## impulse: one sharp kick

An **impulse** is a very short, very strong push whose total "size" (strength times duration) is 1. Think of a single hammer tap on a bell, or a thruster firing for a few milliseconds. `impulse(T)` shows how the system answers that tap and then rings down.

```matlab
[h, t] = impulse(T, 5);
[hmax, k] = max(h);
% hmax = 1.0925, t(k) = 0.6000   (Octave's grid)
```

For the antenna loop the impulse response is $h(t) = \frac{4}{\sqrt{3}}\,e^{-t}\sin(\sqrt{3}\,t)$. It jumps up, peaks at $t = \frac{\pi}{3\sqrt{3}} = 0.605\,\mathrm{s}$ with height $1.093$, dips below zero to about $-0.18$, and dies away. The impulse response is the slope of the step response, since a step is an impulse that has been added up over time. A real **[[thruster pulse|thruster-pulse]]** is not infinitely short, but when it is much shorter than the system's response, the impulse response is an excellent model of its effect.

## lsim: any input you like

Real commands are not only steps. `lsim` ("linear simulation") takes a model, an input sampled at a vector of times, and those times:

```matlab
y = lsim(sys, u, t);
```

`u` must have one value per entry of `t`. The time vector should be evenly spaced; `lsim` uses the spacing to step the model forward.

::: example Tracking a satellite across the sky
A ground antenna follows a satellite whose direction sweeps at a steady $2^\circ/\mathrm{s}$. The command is a **ramp**: $r(t) = 2t$ degrees. How far behind does the antenna trail?

```matlab
t = 0:0.01:20;              % s, evenly spaced
r = 2*t;                    % deg, the ramp command
y = lsim(T, r, t);
r(end) - y(end)             % tracking error after 20 s
% ans = 1.0000
```

**Step 1: build the input.** `t` has 2001 samples from 0 to 20 s; `r` has one command angle per sample.

**Step 2: simulate.** `lsim` returns the pointing angle at each sample.

**Step 3: read the lag.** After the start-up wiggle dies away, the antenna trails the target by a constant $1.00^\circ$.

**Sanity check.** A loop like this, with one pure integrator in the plant, follows a ramp with a steady error equal to the ramp rate divided by the **[[velocity constant|ramp-lag]]** $K_v$, a number that measures how strongly the loop pushes back against a steadily growing error. Here the loop is $\frac{4}{s(s+2)}$; drop the lone $s$ and set $s = 0$ in the rest, which gives $K_v = 4/2 = 2\,\mathrm{s^{-1}}$. The error is $2 / 2 = 1^\circ$. The simulation and the hand rule agree.
:::

## initial: starting away from rest

Sometimes nothing is commanded at all. A spacecraft has just [[separated|separation-tumble]] from its rocket, spinning slowly; an antenna was bumped by the wind. The question is how the system recovers from where it starts. That is `initial`, and it needs a state-space model, because "where it starts" means a starting state vector $\mathbf{x}_0$.

Write the antenna loop with states angle $\theta$ and rate $\omega$. The plant $\frac{1}{s(s+2)}$ means $\dot\theta = \omega$ and $\dot\omega = -2\omega + u$, and the controller sets $u = 4(r - \theta)$. With no command, $r = 0$:

```matlab
A = [0 1; -4 -2];  B = [0; 4];  C = [1 0];  D = 0;
cl = ss(A, B, C, D);        % tf(cl) is 4/(s^2 + 2 s + 4) again
[y, t] = initial(cl, [1; 0], 6);   % start 1 deg off, at rest
% minimum of y: about -0.163 at t = 1.81 s
```

The second row of `A` came from $\dot\omega = -2\omega + 4(r - \theta) = -4\theta - 2\omega + 4r$. The antenna starts $1^\circ$ off, swings through zero to $-0.163^\circ$ at $1.81\,\mathrm{s}$, and settles back. Those numbers should look familiar: starting $1^\circ$ off with no command is the mirror image of a $1^\circ$ step, so the response is $1 - y_{\text{step}}(t)$, and the 16.3% overshoot shows up as a 0.163 swing past zero.

::: warning initial needs ss, and the state order matters
`initial` wants a state-space model and a starting vector with one entry per state, in the model's own order. If you built the model with `ss(G)` from a transfer function, the states are whatever MATLAB chose, not necessarily "angle, rate", and `[1; 0]` may not mean "1 degree off". Build the state-space model yourself when the starting state has a physical meaning.
:::

## Check yourself

::: check
A heater is modeled as $\frac{1}{20s + 1}$ (time in seconds). Without MATLAB, give its rise time and 2% settling time, and say what fraction of the final value it reaches at $t = 20\,\mathrm{s}$.
:::

::: answer
Here $\tau = 20\,\mathrm{s}$. Rise time $= \tau\ln 9 = 20 \times 2.197 = 43.9\,\mathrm{s}$. Settling time $= \tau\ln 50 = 20 \times 3.912 = 78.2\,\mathrm{s}$. At $t = \tau = 20\,\mathrm{s}$ it has reached $1 - e^{-1} = 0.632$, about 63% of the way.
:::

::: check
Find $\omega_n$, $\zeta$ and the percent overshoot of $\frac{25}{s^2 + 6s + 25}$.
:::

::: answer
$\omega_n^2 = 25$, so $\omega_n = 5\,\mathrm{rad/s}$. $2\zeta\omega_n = 6$, so $\zeta = 6/10 = 0.6$. Then $\sqrt{1 - 0.36} = 0.8$ and $M_p = e^{-\pi \times 0.6/0.8} = e^{-2.356} = 0.0948$, about 9.5% overshoot. The settling estimate is $4/(0.6 \times 5) = 1.33\,\mathrm{s}$.
:::

::: check
You have a vector `theta` of pitch angles logged every 0.01 s from a nonlinear six-degree-of-freedom simulation after a step command, and a matching time vector `tt`. Write the line that gets the overshoot, and say why `stepinfo(T)` is not an option here.
:::

::: answer
`S = stepinfo(theta, tt); S.Overshoot`. `stepinfo(T)` needs an LTI model, and a nonlinear simulation has none; the sampled-data form works on any response. If the log does not start at zero, add the start and final values: `stepinfo(theta, tt, yfinal, yinit)`.
:::

::: check
Which command would you use for each: (a) the response to a 5 ms thruster firing; (b) the response to a recorded wind-gust profile; (c) recovery from a 3 degree per second tumble at separation; (d) the time to reach 90% of a new attitude target?
:::

::: answer
(a) `impulse`, because the firing is much shorter than the response. (b) `lsim`, which plays any sampled input. (c) `initial`, on a state-space model whose rate state starts at 3 deg/s. (d) `step` to get the response, then `stepinfo` for the rise time (or read where it crosses 90%).
:::

::: check
A loop $\frac{10}{s(s+5)}$ with unity feedback must follow a ramp of $0.5^\circ/\mathrm{s}$ with at most $0.2^\circ$ steady error. Does it pass? Describe how you would confirm it with `lsim`.
:::

::: answer
$K_v$: drop the lone $s$ and set $s = 0$ in $\frac{10}{s+5}$, giving $10/5 = 2\,\mathrm{s^{-1}}$. Steady ramp error $= 0.5/2 = 0.25^\circ$, which is more than $0.2^\circ$, so it fails. To confirm: `T = feedback(tf(10,[1 5 0]),1); t = 0:0.01:20; r = 0.5*t; y = lsim(T, r, t); r(end) - y(end)` should come out near 0.25.
:::

## Summary

| Idea | Meaning | MATLAB or formula |
|---|---|---|
| Step response | output after a sudden, held change | `step(sys)`, `[y,t] = step(sys,tf)` |
| First-order lag | $\frac{1}{\tau s + 1}$ | 63.2% at $\tau$; rise $2.20\tau$; settle $3.91\tau$ |
| Second-order form | $\frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ | $\omega_n$ natural frequency, $\zeta$ damping ratio |
| Overshoot, peak time | $M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}$, $t_p = \frac{\pi}{\omega_n\sqrt{1-\zeta^2}}$ | exact for pure second order |
| Settling estimate | $t_s \approx \frac{4}{\zeta\omega_n}$ | 2% band, rough |
| stepinfo | rise, settling, overshoot, undershoot, peak, peak time | `S = stepinfo(sys)` or `stepinfo(y,t)` |
| impulse | response to a short kick | `impulse(sys)` |
| lsim | response to any sampled input | `lsim(sys, u, t)` |
| initial | recovery from a starting state | `initial(ss_sys, x0)` |

Next, lesson 3 explains *why* these responses look the way they do: the poles and zeros behind every curve, how `damp` reads $\zeta$ and $\omega_n$ straight off them, and how `rlocus` shows them moving as you turn up the gain — including the right-half-plane zero that makes a response start off the wrong way.

::: context test-signals Three standard test inputs
A step is a switch flipped and left on. An impulse is a single, very brief kick. A ramp climbs steadily forever. Engineers use them because they are simple, repeatable and each exposes something different: the step shows speed and overshoot, the impulse shows the system's natural ringing, and the ramp shows how well it follows a moving target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="10" y1="90" x2="110" y2="90"/><line x1="20" y1="20" x2="20" y2="95"/>
    <line x1="130" y1="90" x2="230" y2="90"/><line x1="140" y1="20" x2="140" y2="95"/>
    <line x1="250" y1="90" x2="350" y2="90"/><line x1="260" y1="20" x2="260" y2="95"/>
  </g>
  <polyline points="10,90 40,90 40,45 105,45" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="130,90 170,90 170,25 174,25 174,90 225,90" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="250,90 280,90 345,35" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="60" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">step</text>
  <text x="180" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">impulse</text>
  <text x="300" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">ramp</text>
</svg>
```
:::

::: context time-constant Where 63.2 percent comes from
After a time $t$, a first-order lag still has a fraction $e^{-t/\tau}$ of the distance left to go. At $t = \tau$ that fraction is $e^{-1} = 0.368$, so it has covered $1 - 0.368 = 0.632$. After $2\tau$ it has covered 86.5%, after $3\tau$ 95.0%, after $4\tau$ 98.2%, and after $5\tau$ 99.3%. That is why engineers often say a first-order system is "done" after four or five time constants. A thermometer dipped in hot water, a capacitor charging and a fin actuator all follow this same curve.
:::

::: context settling-band The 2 percent band
Settling time is when the response enters a thin band around its final value and never leaves it again. Here the band is $1 \pm 0.02$, drawn zoomed in so it is visible. The antenna loop's response pokes above the band at its peak, dips below it once, and finally stays inside from about 4.04 s on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="74" width="300" height="12" fill="#8fb8f0" opacity="0.5"/>
  <line x1="40" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="20" x2="40" y2="145" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="34" y="84" font-size="11" fill="#6c7a93" text-anchor="end">1.00</text>
  <text x="34" y="35" font-size="11" fill="#6c7a93" text-anchor="end">1.16</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="87.5,138.1 90.0,125.2 92.5,113.0 95.0,101.7 97.5,91.2 100.0,81.7 102.5,73.0 105.0,65.2 107.5,58.3 110.0,52.3 112.5,47.1 115.0,42.7 117.5,39.1 120.0,36.2 122.5,34.0 125.0,32.5 127.5,31.5 130.0,31.1 132.5,31.2 135.0,31.8 137.5,32.7 140.0,34.1 142.5,35.7 145.0,37.6 147.5,39.7 150.0,42.0 152.5,44.5 155.0,47.0 157.5,49.6 160.0,52.3 162.5,55.0 165.0,57.6 167.5,60.2 170.0,62.8 172.5,65.3 175.0,67.6 177.5,69.9 180.0,72.1 182.5,74.1 185.0,76.0 187.5,77.7 190.0,79.3 192.5,80.8 195.0,82.1 197.5,83.2 200.0,84.3 202.5,85.1 205.0,85.9 207.5,86.5 210.0,87.0 212.5,87.4 215.0,87.7 217.5,87.9 220.0,88.0 222.5,88.0 225.0,87.9 227.5,87.8 230.0,87.6 232.5,87.3 235.0,87.0 237.5,86.7 240.0,86.3 242.5,85.9 245.0,85.5 247.5,85.1 250.0,84.6 252.5,84.2 255.0,83.8 257.5,83.3 260.0,82.9 262.5,82.5 265.0,82.1 267.5,81.7 270.0,81.4 272.5,81.1 275.0,80.7 277.5,80.4 280.0,80.2 282.5,79.9 285.0,79.7 287.5,79.5 290.0,79.3 292.5,79.2 295.0,79.1 297.5,79.0 300.0,78.9 302.5,78.8 305.0,78.8 307.5,78.7 310.0,78.7 312.5,78.7 315.0,78.7 317.5,78.7 320.0,78.8 322.5,78.8 325.0,78.8 327.5,78.9 330.0,79.0 332.5,79.0 335.0,79.1 337.5,79.2 340.0,79.2"/>
  <line x1="242" y1="20" x2="242" y2="145" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="248" y="138" font-size="11" fill="#b4232c">settled, 4.04 s</text>
  <text x="140" y="24" font-size="11" fill="#1f2a44">peak at 1.81 s</text>
  <text x="250" y="68" font-size="11" fill="#1d6fd1">2% band</text>
</svg>
```
:::

::: context damping-ratio Three amounts of damping
The same natural frequency, $\omega_n = 2\,\mathrm{rad/s}$, with three damping ratios. At $\zeta = 0.2$ the response overshoots by about 53% and rings for a long time. At $\zeta = 0.5$ it overshoots by 16% and settles in about 4 s. At $\zeta = 1$ it creeps up with no overshoot at all. Flight control designers often aim for $\zeta$ between about 0.5 and 0.7: quick, with a modest overshoot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="345" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="15" x2="40" y2="135" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="32" y="64" font-size="11" fill="#6c7a93" text-anchor="end">1</text>
  <text x="32" y="134" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <text x="340" y="148" font-size="11" fill="#6c7a93" text-anchor="end">t = 8 s</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,130.0 47.5,124.8 55.0,110.8 62.5,91.6 70.0,70.5 77.5,51.1 85.0,35.8 92.5,26.3 100.0,23.1 107.5,25.8 115.0,33.1 122.5,43.2 130.0,54.3 137.5,64.6 145.0,72.6 152.5,77.7 160.0,79.4 167.5,78.0 175.0,74.3 182.5,68.9 190.0,63.1 197.5,57.7 205.0,53.4 212.5,50.7 220.0,49.8 227.5,50.5 235.0,52.5 242.5,55.2 250.0,58.3 257.5,61.2 265.0,63.4 272.5,64.9 280.0,65.4 287.5,65.0 295.0,64.0 302.5,62.5 310.0,60.9 317.5,59.4 325.0,58.2 332.5,57.4 340.0,57.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,130.0 47.5,125.1 55.0,113.4 62.5,98.6 70.0,83.6 77.5,70.5 85.0,60.4 92.5,53.5 100.0,49.8 107.5,48.6 115.0,49.3 122.5,51.1 130.0,53.5 137.5,56.0 145.0,58.1 152.5,59.8 160.0,61.0 167.5,61.6 175.0,61.9 182.5,61.8 190.0,61.5 197.5,61.1 205.0,60.7 212.5,60.3 220.0,60.0 227.5,59.8 235.0,59.7 242.5,59.7 250.0,59.7 257.5,59.8 265.0,59.8 272.5,59.9 280.0,59.9 287.5,60.0 295.0,60.0 302.5,60.0 310.0,60.0 317.5,60.0 325.0,60.0 332.5,60.0 340.0,60.0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,130.0 47.5,125.7 55.0,116.6 62.5,106.4 70.0,96.7 77.5,88.4 85.0,81.6 92.5,76.2 100.0,72.0 107.5,68.8 115.0,66.4 122.5,64.6 130.0,63.3 137.5,62.4 145.0,61.7 152.5,61.2 160.0,60.9 167.5,60.6 175.0,60.4 182.5,60.3 190.0,60.2 197.5,60.1 205.0,60.1 212.5,60.1 220.0,60.1 227.5,60.0 235.0,60.0 242.5,60.0 250.0,60.0 257.5,60.0 265.0,60.0 272.5,60.0 280.0,60.0 287.5,60.0 295.0,60.0 302.5,60.0 310.0,60.0 317.5,60.0 325.0,60.0 332.5,60.0 340.0,60.0"/>
  <text x="104" y="16" font-size="11" fill="#b4232c">zeta 0.2</text>
  <text x="112" y="44" font-size="11" fill="#1d6fd1">zeta 0.5</text>
  <text x="112" y="88" font-size="11" fill="#1f2a44">zeta 1</text>
</svg>
```
:::

::: context requirement-tests Requirements that run every night
Flight software and GNC teams keep their analysis scripts under version control and run them automatically on every change, the way software teams run unit tests. MATLAB has a built-in unit test framework (`matlab.unittest`), and a script full of `assert` lines is the simplest version of the same idea. The requirement "overshoot at most 20%" becomes a line of code with a pass or fail answer, so nobody has to remember to look at a plot. When a change to a filter or a mass model breaks the loop, the test that fails names the requirement it broke.
:::

::: context thruster-pulse Why a short burn looks like an impulse
A spacecraft's small thrusters can fire in pulses of tens of milliseconds. If the attitude motion they cause plays out over seconds, the thruster has finished pushing long before the spacecraft has moved much. What matters is the total push, the torque multiplied by the firing time, called the **angular impulse**. The system cannot tell a 20 ms pulse from a 10 ms pulse of twice the torque. That is exactly the situation the ideal impulse describes, and why `impulse` is a useful model of a pulse.
:::

::: context ramp-lag Why a ramp leaves a steady lag
To keep turning at a steady rate, the antenna's motor has to push steadily against friction. With a proportional controller, the only way to get a steady push is a steady error, since the command to the motor is the gain times the error. So the antenna must trail the target by exactly enough error to produce that push. A bigger gain needs less error, which is why $K_v$ grows with the gain. Adding an integrator to the controller would drive this lag to zero; that idea comes back in the PID lessons.
:::

::: context separation-tumble The first job after separation
When a satellite is released from its launcher, springs push it away and it usually leaves with a small, unwanted spin, often a few degrees per second or less. Its first attitude-control job is **detumbling**: bringing those rates close to zero, often with magnetic torquers or thrusters, before it can point its solar arrays at the Sun. That recovery from a starting rate, with no attitude command at all, is exactly the question `initial` answers for a linear model.
:::
