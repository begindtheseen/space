---
id: l10-controls-estimation-dynamics-questions
title: "Controls, estimation and dynamics rounds: the questions that recur"
minutes: 24
covers:
  - "Controls, estimation and dynamics rounds: the questions that recur, and the follow-ups that separate memorization from understanding"
---

Think of a driving test. The examiner asks, "What does a red light mean?" Everybody gets that right, so it tells the examiner nothing. The useful question comes next: "The light turns yellow as you reach the line, and there's a truck close behind you. What do you do?" Now you have to *understand* the rule, not recite it.

Technical rounds work the same way. The first question is a door. "What's an EKF?" has a short answer anyone who studied can say. The real test is the **[[follow-up|follow-up]]**: where does the idea stop working, what does it cost, why not the alternative? Plenty of people can say "the EKF linearizes about the current estimate." Far fewer can say exactly when that linearization stops being good enough, and why.

This lesson is a catalog of questions that recur in controls, estimation and dynamics rounds, each with a full answer and the follow-up that does the sorting. Derivations done in full earlier in this module — the rocket equation, the Kalman gain, Euler's equations, Clohessy-Wiltshire — are not repeated.

## Controls

### Right-half-plane zeros

Ride a bike fast and turn left. Without noticing, you first nudge the handlebars to the *right*: the wheels step out from under you to the right, you lean left, and only then do you swing left. The path starts off the wrong way, then turns around.

That wrong-way start is called an **inverse response**. In control language it comes from a **right-half-plane zero**, or **RHP zero**: a zero of the transfer function with a positive real part. (A **zero** is a value of $s$ that makes the transfer function zero; "right half" means its real part is positive.) Such systems are called **non-minimum-phase**.

The classic aircraft example: a pilot pulls back to climb. To start the nose rising, the tail must push *down*. That downward tail force briefly cuts total lift, so the plane first **[[sinks a little|inverse-response]]** before the bigger angle of attack takes over and it climbs.

**The question:** "What does an RHP zero do to achievable bandwidth?"

**The answer:** it sets a hard ceiling. An ordinary left-half-plane zero adds phase *lead*. An RHP zero adds phase *lag*, like a time delay, and cannot be canceled without an unstable pole. So as you push crossover up toward the zero, the loop piles up lag faster than you can recover it. Phase margin shrinks to zero, then goes negative: the loop goes unstable.

The common rule of thumb keeps usable bandwidth below about **half the zero's frequency**. The exact factor depends on how much margin the design needs, so treat it as an order-of-magnitude guide, not a law. Saying that boundary out loud is part of a strong answer.

**The follow-up:** "Where do they come from on a spacecraft?" A common source is a **[[non-collocated|non-collocated]]** sensor and actuator. When the attitude sensor and the torque source sit on opposite sides of a vibration node of a flexible structure, the transfer function between them picks up exactly this non-minimum-phase behavior. That is why sensor placement relative to a flexible mode's shape is a real design decision, not an afterthought.

::: example Right-half-plane zero, worked
A flexible spacecraft's attitude loop has a non-collocated sensor and actuator. The resulting RHP zero sits at $z = 8\,\mathrm{rad/s}$.

**Step 1 — apply the rule of thumb.** Usable bandwidth is about half the zero's frequency:

$$
\omega_{bw} \lesssim \frac{z}{2} = \frac{8}{2} = 4\,\mathrm{rad/s}.
$$

(Read $\lesssim$ as "less than about".)

**Step 2 — compare with the need.** The pointing settle-time requirement needs a bandwidth of $6\,\mathrm{rad/s}$ with a conventional design. That is $1.5$ times the ceiling.

**Step 3 — draw the conclusion.** No tuning fixes a physical limit. The real conversation moves to relocating the sensor, adding a second sensor near the actuator, or relaxing the settle-time requirement.

**Sanity check:** a better controller cannot remove phase lag the plant itself adds, so $6 > 4$ means the requirement fails as the hardware stands.
:::

### Gain scheduling

A clever cruise control would push differently on a flat road and on a steep hill. That is the idea.

A **gain schedule** changes the controller's gains as a function of a measured or estimated operating condition. You need one when the plant's linearized dynamics change so much across the flight that one fixed set of gains cannot serve all of it.

A launch vehicle climbing to orbit is the standard case. **[[Dynamic pressure|dynamic-pressure]]** and the mass properties both change by large factors between liftoff and staging, so the controller is regulating a different plant at different moments. Gains are scheduled on a variable that tracks the dynamics — dynamic pressure or Mach number — not flight time, because the link between time and dynamic pressure itself varies from flight to flight.

**The follow-up** nearly every interviewer asks: "How do you know it is stable across the *whole* schedule, not only at the few points you tuned?" The minimum answer is **dense gridding**: check margins at many points across the envelope, not only the tuning points. The stronger answer names **linear parameter-varying (LPV) analysis**, covered in the robust-control track, which can prove stability across a continuous range of operating points instead of a finite grid.

### Going digital

A flight computer does not see a smooth signal. It takes a snapshot every $T_s$ seconds ($T_s$, "T sub s", the **sample interval**), then holds its output fixed until the next snapshot. That hold is called a **[[zero-order hold|zero-order-hold]]**.

**The question:** "What changes when you implement a continuous design digitally?"

**First, extra phase lag.** The zero-order hold acts, on average, like a delay of half a sample. At frequency $\omega$ (omega, in rad/s) that adds about

$$
\Delta\phi \approx \frac{\omega T_s}{2}\ \text{radians}
$$

of phase lag, a good approximation while $\omega$ is well below the **Nyquist frequency**, half the sample rate. A continuous analysis never counted this lag. It eats phase margin, and can turn a healthy continuous design into a marginal or unstable digital one unless sampling is comfortably faster than crossover.

Try numbers. Crossover at $\omega = 10\,\mathrm{rad/s}$, sampled at $100\,\mathrm{Hz}$ so $T_s = 0.01\,\mathrm{s}$: the lag is $10 \times 0.01 / 2 = 0.05\,\mathrm{rad}$, about $2.9°$. Harmless. Sample at $20\,\mathrm{Hz}$ instead ($T_s = 0.05\,\mathrm{s}$): the lag is $0.25\,\mathrm{rad}$, about $14.3°$. That can eat a third of a $45°$ margin.

**Second, [[aliasing|aliasing]].** Any signal above the Nyquist frequency — often a structural bending mode the continuous design never had to think about — folds down into the controlled band and looks like a slow, real motion. The fix is an anti-aliasing filter *before* the sampler. After sampling, it is too late: the folded signal is indistinguishable from real low-frequency content.

## Estimation

### EKF versus UKF

Imagine tracing a curved road on a map with a ruler. Over a short stretch, the ruler fits the road well. Over a long stretch, it misses the bend badly.

The **extended Kalman filter (EKF)** is the ruler. It **linearizes** the nonlinear dynamics or measurement function about the current estimate — a first-order Taylor expansion at one point — and pushes the covariance through that straight-line approximation.

The **unscented Kalman filter (UKF)** instead pushes a small, fixed set of sample points, called **[[sigma points|sigma-points]]**, through the *true* nonlinear function, then rebuilds the mean and covariance from where they landed. That captures curvature the linearization misses, and needs no **Jacobian** (the matrix of partial derivatives).

**When the difference is negligible:** when the nonlinearity is mild compared with the uncertainty ellipse. Any smooth curve looks straight over a small piece, so for small covariance the EKF is essentially exact.

**When it matters:** when uncertainty is large compared with the function's curvature. Bearings-only tracking, strongly nonlinear coordinate transforms, and a large initial uncertainty before the filter has converged are the usual cases. There, the EKF's linearization error becomes a real bias in the propagated mean and covariance.

**The cost side:** the UKF needs $2n+1$ function evaluations per update for an $n$-dimensional state, against one Jacobian evaluation for the EKF. On constrained flight hardware, that cost is real.

### Filter consistency

A weather forecaster says "70% chance of rain" on a hundred days. If it rains on about seventy of them, the forecaster is honest about their uncertainty. If it rains on thirty, they were too sure of themselves.

A filter is **consistent** when its *reported* covariance matches its *actual* error. If it claims one meter at one standard deviation, the true error should fall within one meter about 68% of the time over many trials.

**How to test it.** The standard test is the **normalized estimation error squared (NEES)**:

$$
\epsilon = \mathbf{e}^T \mathbf{P}^{-1} \mathbf{e},
$$

where $\mathbf{e}$ is the true error and $\mathbf{P}$ the reported covariance. In words: the squared error, measured in units of the filter's own claimed uncertainty. For a consistent filter, NEES follows a **[[chi-square distribution|chi-square]]** with degrees of freedom equal to the state dimension, so its expected value is the state dimension. Averaged over a Monte Carlo ensemble, it should land inside a chi-square confidence band around that value.

- Mean NEES **well above** the band: the filter is **overconfident**. Its true error is bigger than it admits.
- Mean NEES **well below** the band: the filter is **underconfident**. It reports needlessly pessimistic covariance and wastes information.

With no ground truth, as in real flight, apply the same idea to the **innovation** (measurement minus prediction): the **normalized innovation squared (NIS)**, computable online.

::: example Filter consistency, worked and verified
Take a one-dimensional state whose true error variance is $P_{\text{true}} = 4.0$. Run $20{,}000$ trials.

**An honest filter** reports $\hat P = 4.0$ ("P hat", its claimed variance), so each NEES is $e^2 / 4.0$. Chi-square with one degree of freedom has mean $1$; the simulation below gives $0.99$.

Is $0.99$ close enough? The chi-square(1) has variance $2$, so the mean of $20{,}000$ samples has standard deviation $\sqrt{2/20000} = 0.01$. The 95% band is about $1 \pm 2(0.01)$, that is, $[0.98, 1.02]$. And $0.99$ sits inside it. Consistent.

**An overconfident filter** reports $\hat P = 1.0$ against the same true error. Now each NEES is $e^2/1.0$, four times bigger. Predicted mean: $P_{\text{true}}/\hat P = 4.0/1.0 = 4$. The simulation gives $3.95$.

```python
import numpy as np

rng = np.random.default_rng(1)
P_true = 4.0                                     # true error variance
e = rng.normal(0.0, np.sqrt(P_true), 20_000)     # 20,000 true errors

for P_hat in (4.0, 1.0):                         # honest filter, overconfident filter
    nees = e**2 / P_hat                          # e^T P^-1 e for a 1-D state
    print(P_hat, round(nees.mean(), 2))
# 4.0 0.99
# 1.0 3.95
```

**Why it matters:** the second filter claims a quarter of its real variance, so its Kalman gain, which scales with $\hat P$, is too small. It under-trusts its measurements and lets the true error drift.
:::

## Dynamics

### Quaternion kinematics, and why filters do not update the quaternion directly

A globe spinning on your desk can point any way you like, and it takes exactly three numbers to say how it is turned. A **quaternion** $\mathbf{q}$ uses four, paid for with a rule: the four numbers must always have length one, $\|\mathbf{q}\| = 1$. Picture a point that must stay on the skin of a ball — in four dimensions, a **[[unit hypersphere|hypersphere]]**.

**The question:** "Write down quaternion kinematics." The rate of change of the quaternion is

$$
\dot{\mathbf{q}} = \tfrac12\,\mathbf{q} \otimes \boldsymbol\omega_{\text{body}},
$$

read "q dot equals one half q times omega body". Here $\otimes$ is quaternion multiplication, $\boldsymbol\omega_{\text{body}}$ is the angular rate measured in the body frame (treated as a quaternion with zero scalar part), and the convention is Hamilton's.

::: key
Quaternion kinematics: $\dot{\mathbf{q}} = \tfrac12\,\mathbf{q} \otimes \boldsymbol\omega_{\text{body}}$ (Hamilton convention, body rate). Four parameters, three degrees of freedom, no singularity, and a unit-norm constraint — which is why filters estimate a three-parameter error multiplicatively instead.
:::

**The follow-up:** "Why doesn't an attitude filter update the quaternion directly?" Two reasons.

1. A linear Kalman update on all four components adds a correction vector, and the result generally drifts off the unit sphere.
2. The covariance of four numbers with three real freedoms is **singular** in the constrained direction — there is nothing there to be uncertain about — so the update is ill-posed.

The standard fix is a **multiplicative error-state filter**. Estimate a small three-parameter error, such as a small-angle rotation, about a reference quaternion. Run the ordinary linear update on that unconstrained error. Then fold the correction into the reference by *quaternion multiplication*, not addition, and renormalize. The constraint is respected by construction.

### Environmental torques

**The question:** "What environmental torques act on a spacecraft, and roughly how big are they?" Four make the standard list:

- **[[Gravity-gradient torque|gravity-gradient]]**: gravity pulls harder on the nearer part of a body of finite size. With unequal moments of inertia, that makes a torque that tends to line up the axis of *least* inertia with the local vertical.
- **Aerodynamic torque**: in low orbits, thin leftover atmosphere pushes on a vehicle whose center of pressure is offset from its center of mass.
- **Solar radiation pressure torque**: sunlight carries momentum, and it pushes on surfaces with the same kind of offset.
- **Magnetic torque**: any leftover, unintended magnetic dipole on board twists against Earth's magnetic field, like a compass needle.

For a satellite of a few hundred kilograms in low orbit, each is typically somewhere around $10^{-6}$ to $10^{-4}\,\mathrm{N\,m}$, small next to the roughly $0.1\,\mathrm{N\,m}$ a reaction wheel of that class can produce. They matter because they are **secular** — steady and persistent — so the control system rejects them continuously. Gravity-gradient torque is sometimes used on purpose, for passive attitude stabilization.

### Variable mass

**The question:** "How does the rocket's equation of motion differ from a fixed rigid body's?" An earlier lesson in this module derives it in full. The correct translational equation is

$$
m\,\frac{d\mathbf{v}}{dt} = \mathbf{T} + \mathbf{F}_{\text{ext}}, \qquad \mathbf{T} = -\mathbf{v}_e\,\frac{dm}{dt},
$$

from momentum conservation on the vehicle plus the propellant it ejects, not from naively differentiating the vehicle's momentum. The rotational form adds a thrust-vector-control moment from any offset between thrust line and center of mass, on top of the rigid-body Euler equation.

### Two orbit questions answered in one line

**Vis-viva.** A satellite's speed $v$ at distance $r$ from Earth's center depends only on $r$ and the orbit's size:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right),
$$

where $\mu$ ("mew") is Earth's gravity constant, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, and $a$ is the semi-major axis. The **specific orbital energy** — energy per kilogram — is $-\mu/(2a)$. So energy depends only on $a$, not on how stretched the orbit is. For a circular orbit $r = a$, and vis-viva gives $v = \sqrt{\mu/r}$: at $r = 6778\,\mathrm{km}$ (about $400\,\mathrm{km}$ up), $7.67\,\mathrm{km/s}$.

::: key
Vis-viva: $v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right)$. Specific orbital energy is $-\mu/(2a)$, so energy depends only on the semi-major axis.
:::

**Hohmann transfer.** To move between two circular orbits in one plane, burn forward onto an ellipse that touches the inner orbit at its low point and the outer orbit at its high point, coast half of it, then burn forward again to circularize. Both burns are **tangential**, along the direction of motion.

::: key
Hohmann transfer: two tangential burns via an ellipse touching both circular orbits. It is the cheapest two-burn transfer, and the cheapest transfer of all while the ratio of radii is below about $11.94$. Above that, a three-burn **[[bi-elliptic transfer|bi-elliptic]]** can be cheaper, at the cost of a far longer transfer time.
:::

::: example Hohmann transfer from low orbit to geostationary
Move from a circular orbit at $r_1 = 6778\,\mathrm{km}$ to geostationary radius $r_2 = 42{,}164\,\mathrm{km}$, with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

**Step 1 — circular speeds.** $v_1 = \sqrt{\mu/r_1} = 7668.6\,\mathrm{m/s}$ and $v_2 = \sqrt{\mu/r_2} = 3074.7\,\mathrm{m/s}$.

**Step 2 — the transfer ellipse.** Its semi-major axis is the average of the two radii: $a = (6778 + 42{,}164)/2 = 24{,}471\,\mathrm{km}$.

**Step 3 — ellipse speeds from vis-viva.** At the low point, $v_p = \sqrt{\mu(2/r_1 - 1/a)} = 10{,}066.1\,\mathrm{m/s}$. At the high point, $v_a = \sqrt{\mu(2/r_2 - 1/a)} = 1618.2\,\mathrm{m/s}$.

**Step 4 — the two burns.** First burn: $10{,}066.1 - 7668.6 = 2397.5\,\mathrm{m/s}$. Second burn: $3074.7 - 1618.2 = 1456.5\,\mathrm{m/s}$. Total: about $3854\,\mathrm{m/s}$, or $3.85\,\mathrm{km/s}$.

**Sanity check:** the radius ratio is $42{,}164/6778 \approx 6.2$, below $11.94$, so Hohmann is the cheapest option here. The coast is half an ellipse, about $5.3$ hours — close to the familiar figure for a geostationary transfer.
:::

::: warning
Every question here has a follow-up waiting behind it. Do not stop at the door answer, even when it is correct. Volunteer the boundary — "this matters more when uncertainty is large relative to the curvature", "the exact bound depends on how much margin you need" — before anyone asks.
:::

## Check yourself

::: check
Why is the first question in this kind of round rarely the one that sorts candidates, and what does that mean for how you should answer it?
:::

::: answer
A door question like "what's an EKF?" has a short correct answer many candidates can memorize, so it says little about depth. The sorting happens in the follow-up, which probes the edges: when the idea breaks down, what it costs, why not the alternative. So a strong door answer gets ahead of the follow-up by stating the boundary condition unprompted — the "volunteer the limitation" instinct this module has built from its first lesson.
:::

::: check
A filter reports covariance $\hat P = 2.0$ for a state whose true error variance is $8.0$. Predict the mean NEES over a large Monte Carlo ensemble, and say whether the filter is overconfident or underconfident.
:::

::: answer
Each NEES is $e^2/\hat P$, and $e^2$ averages to the true variance, so the mean NEES is close to $P_{\text{true}}/\hat P = 8.0/2.0 = 4.0$ — far above the $1.0$ of a consistent filter. The filter is **overconfident**: it reports less uncertainty than it has. In flight, its Kalman gain is too small, because the gain scales with the too-small reported covariance.
:::

::: check
When does the choice between an EKF and a UKF stop mattering in practice, and when does it matter a great deal?
:::

::: answer
It stops mattering when the filter's uncertainty is small compared with the function's curvature: over a small enough neighborhood any smooth function looks nearly linear, which is what the EKF assumes. It matters a great deal when uncertainty is large compared with that curvature — a large initial covariance before convergence, or a strongly curved function such as a bearings-only measurement. There the EKF's linearization error becomes a real bias in the propagated mean and covariance, not an error that averages out. The UKF handles it better, at $2n+1$ function evaluations per update.
:::

::: check
Why can't a standard linear Kalman update be applied directly to all four components of a quaternion, and what does the multiplicative error-state approach do instead?
:::

::: answer
A quaternion has four numbers but only three real degrees of freedom, because it must stay on the unit sphere. A linear update adds a correction vector with no way to keep unit length, so the result drifts off the sphere, and the four-number covariance is singular in the constrained direction, which makes the update ill-posed. The multiplicative approach estimates an unconstrained three-parameter small-angle error about a reference quaternion, runs the ordinary linear update on it, then composes the correction onto the reference by quaternion multiplication and renormalizes. The structure respects the constraint.
:::

::: check
In one sentence a follow-up would accept: why does pushing bandwidth up toward a right-half-plane zero drive the loop toward instability?
:::

::: answer
An RHP zero adds phase lag, like a time delay, instead of the phase lead an ordinary left-half-plane zero gives, and it cannot be canceled without an unstable pole — so as crossover approaches the zero, the loop piles up lag faster than any compensator can recover it, driving phase margin to zero and then past it, which is why the zero's location is a real ceiling on bandwidth rather than merely a tuning difficulty.
:::

::: check
A gain-scheduled controller is checked at five design points across the flight envelope and shows healthy margins at each. Why is that not enough evidence that it is safe everywhere?
:::

::: answer
The five points say nothing about behavior *between* them. Gains are interpolated, and the plant may change nonlinearly with the scheduling variable in between, so a region of poor margins or even instability can hide there. The checks also assume "frozen time" — a slowly changing scheduling variable — which weakens if it changes fast. A fuller verification grids the whole envelope densely, or uses linear parameter-varying analysis, which proves stability across the full range.
:::

## Summary

| Question | Core answer |
| --- | --- |
| RHP zero and bandwidth | Inverse response; phase lag like a delay; keeps crossover below roughly half the zero's frequency |
| Gain scheduling | Needed when linearized dynamics change a lot across the envelope; schedule on dynamic pressure or Mach; verify by dense gridding or LPV, not only design points |
| Going digital | Zero-order hold adds about $\omega T_s/2$ of phase lag; content above Nyquist aliases unless filtered before sampling |
| EKF vs UKF | Agree when uncertainty is small next to curvature; differ (UKF better, $2n+1$ evaluations) when it is not |
| Filter consistency | Reported covariance should match actual error; NEES $\mathbf{e}^T\mathbf{P}^{-1}\mathbf{e}$ has mean equal to state dimension; NIS for online use |
| Quaternion filtering | $\dot{\mathbf{q}} = \tfrac12\,\mathbf{q}\otimes\boldsymbol\omega_{\text{body}}$; estimate a three-parameter error multiplicatively |
| Environmental torques | Gravity gradient, aerodynamic, solar radiation pressure, magnetic: small but steady |
| Vis-viva and energy | $v^2 = \mu(2/r - 1/a)$; energy $-\mu/(2a)$ |
| Hohmann | Two tangential burns; cheapest below a radius ratio of about $11.94$; bi-elliptic can win above it |

The next lesson turns from technical content to stating your own results believably: numbers instead of adjectives, in project talks, on a resume, and in a portfolio a stranger can read.

::: context follow-up Why the second question does the work
Interviewers have a limited hour and want to learn as much as possible about you in it. A question everyone answers correctly carries no information — it cannot tell two candidates apart. So experienced interviewers use the first question only to find the topic, then push on it until the answers start to differ. Expect the push. A good habit is to end every door answer with one sentence about where the idea stops working. That both shows depth and steers the follow-up toward ground you have prepared.
:::

::: context inverse-response The dip before the rise
Here is the step response of a system with a right-half-plane zero. Command a step up, and the output first goes *down* — by about 21% of the final value in this example — before turning around and settling at the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="110" x2="350" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="350" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#6c7a93">1</text>
  <text x="34" y="114" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="340" y="126" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,110.0 47.6,121.7 55.2,126.5 62.8,126.6 70.4,123.5 78.0,118.3 85.6,111.9 93.2,105.0 100.8,97.8 108.4,90.8 116.0,84.1 123.6,77.9 131.2,72.1 138.8,66.8 146.4,62.1 154.0,57.9 161.6,54.1 169.2,50.8 176.8,47.9 184.4,45.4 192.0,43.2 199.6,41.3 207.2,39.6 214.8,38.2 222.4,37.0 230.0,35.9 237.6,35.0 245.2,34.3 252.8,33.6 260.4,33.1 268.0,32.6 275.6,32.2 283.2,31.8 290.8,31.5 298.4,31.3 306.0,31.1 313.6,30.9 321.2,30.8 328.8,30.6 336.4,30.5 344.0,30.5"/>
  <text x="70" y="148" font-size="11" fill="#b4232c">wrong way first</text>
  <text x="200" y="24" font-size="11" fill="#6c7a93">target</text>
</svg>
```

The curve is $y = 1 - e^{-t}(1 + 2t)$, the step response of $(1 - s)/(s+1)^2$, which has its zero at $s = +1$.
:::

::: context non-collocated Sensor here, motor there
**Collocated** means the sensor and the actuator sit at the same spot on the structure; **non-collocated** means they do not. Think of pushing one end of a long, springy diving board while watching the other end. When the board bends in its first vibration shape, the far end can move the opposite way from where you push. A controller reading that far end sees its own push arrive, at first, backwards — the inverse response of an RHP zero. With collocated hardware, the sign always agrees, which is why collocated loops on flexible structures are much easier to stabilize.
:::

::: context dynamic-pressure The number that says how hard the air pushes
Dynamic pressure is $q = \tfrac12 \rho v^2$, where $\rho$ ("rho") is air density and $v$ is speed. At liftoff $v$ is small; high up, $\rho$ is tiny. In between, $q$ peaks at a point called **max-Q**, typically around one minute into flight for a large launcher, and aerodynamic forces on the vehicle are largest there. Because the aerodynamic part of the dynamics scales with $q$, scheduling gains on $q$ tracks the plant directly, while scheduling on clock time only tracks it on the nominal trajectory.
:::

::: context zero-order-hold Holding the last value
Between samples, the computer's output does not follow the smooth command. It holds the last value flat, making a staircase. On average the staircase trails the smooth curve by half a step — which is where the half-sample delay, and the $\omega T_s/2$ phase lag, come from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2.5" points="30.0,70.0 35.0,64.8 40.0,59.6 45.0,54.5 50.0,49.7 55.0,45.0 60.0,40.6 65.0,36.5 70.0,32.8 75.0,29.5 80.0,26.7 85.0,24.3 90.0,22.4 95.0,21.1 100.0,20.3 105.0,20.0 110.0,20.3 115.0,21.1 120.0,22.4 125.0,24.3 130.0,26.7 135.0,29.5 140.0,32.8 145.0,36.5 150.0,40.6 155.0,45.0 160.0,49.7 165.0,54.5 170.0,59.6 175.0,64.8 180.0,70.0 185.0,75.2 190.0,80.4 195.0,85.5 200.0,90.3 205.0,95.0 210.0,99.4 215.0,103.5 220.0,107.2 225.0,110.5 230.0,113.3 235.0,115.7 240.0,117.6 245.0,118.9 250.0,119.7 255.0,120.0 260.0,119.7 265.0,118.9 270.0,117.6 275.0,115.7 280.0,113.3 285.0,110.5 290.0,107.2 295.0,103.5 300.0,99.4 305.0,95.0 310.0,90.3 315.0,85.5 320.0,80.4 325.0,75.2 330.0,70.0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="30.0,70.0 55.0,70.0 55.0,45.0 80.0,45.0 80.0,26.7 105.0,26.7 105.0,20.0 130.0,20.0 130.0,26.7 155.0,26.7 155.0,45.0 180.0,45.0 180.0,70.0 205.0,70.0 205.0,95.0 230.0,95.0 230.0,113.3 255.0,113.3 255.0,120.0 280.0,120.0 280.0,113.3 305.0,113.3 305.0,95.0 330.0,95.0"/>
  <text x="200" y="30" font-size="11" fill="#1d6fd1">smooth command</text>
  <text x="40" y="132" font-size="11" fill="#1f2a44">held output: 12 samples per cycle</text>
</svg>
```
:::

::: context aliasing A fast wiggle that looks slow
Sample a $9\,\mathrm{Hz}$ vibration at $10\,\mathrm{Hz}$. Each snapshot lands a little further back in the cycle, and the dots trace out a slow $1\,\mathrm{Hz}$ wave instead — a signal that is not really there. This is the same trick that makes a car's wheels look like they turn backward on video.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#6c7a93" stroke-width="1" points="30.0,70.0 31.7,56.1 33.3,43.5 35.0,33.6 36.7,27.2 38.3,25.0 40.0,27.2 41.7,33.6 43.3,43.5 45.0,56.1 46.7,70.0 48.3,83.9 50.0,96.5 51.7,106.4 53.3,112.8 55.0,115.0 56.7,112.8 58.3,106.4 60.0,96.5 61.7,83.9 63.3,70.0 65.0,56.1 66.7,43.5 68.3,33.6 70.0,27.2 71.7,25.0 73.3,27.2 75.0,33.6 76.7,43.5 78.3,56.1 80.0,70.0 81.7,83.9 83.3,96.5 85.0,106.4 86.7,112.8 88.3,115.0 90.0,112.8 91.7,106.4 93.3,96.5 95.0,83.9 96.7,70.0 98.3,56.1 100.0,43.5 101.7,33.6 103.3,27.2 105.0,25.0 106.7,27.2 108.3,33.6 110.0,43.5 111.7,56.1 113.3,70.0 115.0,83.9 116.7,96.5 118.3,106.4 120.0,112.8 121.7,115.0 123.3,112.8 125.0,106.4 126.7,96.5 128.3,83.9 130.0,70.0 131.7,56.1 133.3,43.5 135.0,33.6 136.7,27.2 138.3,25.0 140.0,27.2 141.7,33.6 143.3,43.5 145.0,56.1 146.7,70.0 148.3,83.9 150.0,96.5 151.7,106.4 153.3,112.8 155.0,115.0 156.7,112.8 158.3,106.4 160.0,96.5 161.7,83.9 163.3,70.0 165.0,56.1 166.7,43.5 168.3,33.6 170.0,27.2 171.7,25.0 173.3,27.2 175.0,33.6 176.7,43.5 178.3,56.1 180.0,70.0 181.7,83.9 183.3,96.5 185.0,106.4 186.7,112.8 188.3,115.0 190.0,112.8 191.7,106.4 193.3,96.5 195.0,83.9 196.7,70.0 198.3,56.1 200.0,43.5 201.7,33.6 203.3,27.2 205.0,25.0 206.7,27.2 208.3,33.6 210.0,43.5 211.7,56.1 213.3,70.0 215.0,83.9 216.7,96.5 218.3,106.4 220.0,112.8 221.7,115.0 223.3,112.8 225.0,106.4 226.7,96.5 228.3,83.9 230.0,70.0 231.7,56.1 233.3,43.5 235.0,33.6 236.7,27.2 238.3,25.0 240.0,27.2 241.7,33.6 243.3,43.5 245.0,56.1 246.7,70.0 248.3,83.9 250.0,96.5 251.7,106.4 253.3,112.8 255.0,115.0 256.7,112.8 258.3,106.4 260.0,96.5 261.7,83.9 263.3,70.0 265.0,56.1 266.7,43.5 268.3,33.6 270.0,27.2 271.7,25.0 273.3,27.2 275.0,33.6 276.7,43.5 278.3,56.1 280.0,70.0 281.7,83.9 283.3,96.5 285.0,106.4 286.7,112.8 288.3,115.0 290.0,112.8 291.7,106.4 293.3,96.5 295.0,83.9 296.7,70.0 298.3,56.1 300.0,43.5 301.7,33.6 303.3,27.2 305.0,25.0 306.7,27.2 308.3,33.6 310.0,43.5 311.7,56.1 313.3,70.0 315.0,83.9 316.7,96.5 318.3,106.4 320.0,112.8 321.7,115.0 323.3,112.8 325.0,106.4 326.7,96.5 328.3,83.9 330.0,70.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,70.0 37.5,77.0 45.0,83.9 52.5,90.4 60.0,96.5 67.5,101.8 75.0,106.4 82.5,110.1 90.0,112.8 97.5,114.4 105.0,115.0 112.5,114.4 120.0,112.8 127.5,110.1 135.0,106.4 142.5,101.8 150.0,96.5 157.5,90.4 165.0,83.9 172.5,77.0 180.0,70.0 187.5,63.0 195.0,56.1 202.5,49.6 210.0,43.5 217.5,38.2 225.0,33.6 232.5,29.9 240.0,27.2 247.5,25.6 255.0,25.0 262.5,25.6 270.0,27.2 277.5,29.9 285.0,33.6 292.5,38.2 300.0,43.5 307.5,49.6 315.0,56.1 322.5,63.0 330.0,70.0"/>
  <g fill="#b4232c">
    <circle cx="30.0" cy="70.0" r="4"/><circle cx="60.0" cy="96.5" r="4"/><circle cx="90.0" cy="112.8" r="4"/>
    <circle cx="120.0" cy="112.8" r="4"/><circle cx="150.0" cy="96.5" r="4"/><circle cx="180.0" cy="70.0" r="4"/>
    <circle cx="210.0" cy="43.5" r="4"/><circle cx="240.0" cy="27.2" r="4"/><circle cx="270.0" cy="27.2" r="4"/>
    <circle cx="300.0" cy="43.5" r="4"/><circle cx="330.0" cy="70.0" r="4"/>
  </g>
  <text x="30" y="140" font-size="11" fill="#1f2a44">grey: real 9 Hz · red: samples at 10 Hz · blue: the 1 Hz ghost</text>
</svg>
```

The picture shows one second. Once sampled, no software can tell the ghost from a real slow motion — which is why the filter goes before the sampler.
:::

::: context sigma-points A handful of test travelers
Instead of bending a straight line to fit a curve, the UKF sends a small group of carefully placed points through the real function and watches where they land. For an $n$-dimensional state it uses $2n+1$ of them: one at the mean, and a pair on each side of it along each of the $n$ main directions of the uncertainty. Their spread is chosen so that, before transformation, they have exactly the filter's mean and covariance. After transformation, a weighted average of where they landed gives the new mean and covariance — curvature included, with no derivatives needed.
:::

::: context chi-square Adding up squared bell curves
Take a number drawn from a standard bell curve (mean $0$, standard deviation $1$) and square it. Do that for $k$ independent numbers and add the squares. The total follows a **chi-square distribution with $k$ degrees of freedom** — "chi" is the Greek letter $\chi$, said "kai". Its mean is $k$ and its variance is $2k$. NEES is exactly this construction: $\mathbf{P}^{-1}$ rescales each error into "standard deviations", so a consistent filter's NEES is a sum of $n$ squared standard bell-curve numbers, and averages $n$.
:::

::: context hypersphere The skin of a four-dimensional ball
On a regular ball, the surface is every point at distance one from the center: $x^2 + y^2 + z^2 = 1$. Two numbers are enough to say where you are on it (latitude and longitude), even though a point has three coordinates. The unit hypersphere is the same idea one dimension up: $q_0^2 + q_1^2 + q_2^2 + q_3^2 = 1$. Four coordinates, three real freedoms. Every unit quaternion lives on that skin, and adding an arbitrary vector to it pushes it off — which is the whole problem with a linear update.
:::

::: context gravity-gradient A pencil that hangs straight down
Hold a pencil by its middle in orbit. The end nearer Earth feels slightly stronger gravity than the far end, and the difference tugs the pencil into pointing straight at Earth. The torque's size scales as $3\mu/r^3$ times a difference of moments of inertia, so it falls off quickly with altitude. Long, thin satellites have used this on purpose, often with a deployable boom, to keep one face toward Earth with no fuel and no moving control parts.
:::

::: context bi-elliptic Going the long way to save fuel
A **bi-elliptic transfer** uses three burns. The first sends the spacecraft far *beyond* the target orbit. At that far point, where it is moving very slowly, a small burn raises its low point to the target radius. It falls back and a third burn — a backward one, to slow down — circularizes. For a radius ratio above about $11.94$, a bi-elliptic with a high enough middle point beats Hohmann on fuel; above about $15.58$, it wins for any middle point beyond the target. The price is time: the trip can take many times longer.
:::
