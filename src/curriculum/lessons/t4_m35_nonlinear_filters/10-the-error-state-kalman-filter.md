---
id: l10-the-error-state-kalman-filter
title: The error-state (indirect) Kalman filter
minutes: 26
covers:
  - 'The error-state (indirect) Kalman filter: why the error state is small and nearly linear, injection and reset, the Jacobian of the reset'
---

Picture a ship's navigator before satellites. She keeps a pencil line on the chart: from the ship's speed, heading and the time, she works out where the ship should be, hour by hour. That is **[[dead reckoning|dead-reckoning]]**. Then a lighthouse comes into view. She takes a bearing to it and finds the ship is really $300\,\mathrm m$ north of the pencil mark. She does not throw the chart away and redo the voyage. She writes down one small number — "300 m north" — moves the pencil mark to the corrected spot, and carries on reckoning from there.

Notice what she kept track of. The big, curving voyage lives in the pencil line. The thing she *estimated* from the lighthouse was only a small offset from that line. And once she used the offset, she moved the line and started the offset again from zero.

Every filter so far in this module estimated the vehicle's state **directly**: $\hat{\mathbf x}_k^+$ was the filter's best guess at the actual position, attitude or bias. The navigator's way is the second big design, and it runs inside nearly every inertial navigator and spacecraft attitude filter. It is called the **error-state**, or **indirect**, Kalman filter — **ESKF** for short. It keeps a large, carefully integrated **[[nominal|nominal-word]]** trajectory (the pencil line) and uses the Kalman machinery only on a small **error** relative to it (the offset). This lesson shows why that is such a good idea, and the two bookkeeping steps — **injection** and **reset** — that keep it working.

## Two states, two very different jobs

Split the true state $\mathbf x$ into two parts:

- the **nominal** $\bar{\mathbf x}$ (read "x bar"): the pencil line. It is pushed forward in time by integrating the full, true, nonlinear dynamics $\mathbf f$, with **no covariance attached to it at all**;
- the **error** $\delta\mathbf x$ (read "delta x"): how far the truth sits from the nominal. This is the only thing the Kalman filter estimates.

The two are glued together by a **composition rule**, written $\oplus$ (read "o-plus"). For an ordinary vector, $\oplus$ is plain addition. For a state that lives on a curved space, like an attitude, it is something more careful. The next lesson takes that case up in full.

The error gets its own dynamics, found by **[[linearizing about the nominal|nominal-picture]]** — the same Jacobian idea as the first lesson of this module, but applied to the *error's* motion, not the whole state's.

::: key The error-state split
$$
\mathbf x_k = \bar{\mathbf x}_k \oplus \delta\mathbf x_k, \qquad \dot{\bar{\mathbf x}}=\mathbf f(\bar{\mathbf x}), \qquad \delta\dot{\mathbf x} \approx \mathbf F(\bar{\mathbf x})\,\delta\mathbf x + \text{noise},
$$
with $\oplus$ the right composition (ordinary addition for a vector state) and $\mathbf F(\bar{\mathbf x})$ the Jacobian of $\mathbf f$ at the nominal. The nominal carries all the large, truly nonlinear motion and needs no linear approximation anywhere. The Kalman filter estimates only $\delta\mathbf x$, which — as long as the filter keeps doing its job — stays small.
:::

::: note Why the error obeys a linear equation
Write the truth as nominal plus error, $\mathbf x = \bar{\mathbf x} + \delta\mathbf x$, for a vector state. The truth obeys $\dot{\mathbf x} = \mathbf f(\mathbf x)$. Expand $\mathbf f$ in a Taylor series about the nominal:

$$
\dot{\bar{\mathbf x}} + \delta\dot{\mathbf x} = \mathbf f(\bar{\mathbf x}) + \mathbf F(\bar{\mathbf x})\,\delta\mathbf x + O(\|\delta\mathbf x\|^2).
$$

The nominal obeys $\dot{\bar{\mathbf x}} = \mathbf f(\bar{\mathbf x})$ exactly, because that is how we integrate it. Subtract that from both sides. What is left is

$$
\delta\dot{\mathbf x} = \mathbf F(\bar{\mathbf x})\,\delta\mathbf x + O(\|\delta\mathbf x\|^2).
$$

The only thing thrown away is the $O(\|\delta\mathbf x\|^2)$ part ("order delta x squared"): the part that grows like the *square* of the error. If the error is small, its square is tiny, and the linear equation is nearly exact.
:::

### Why small means nearly linear

Here is the whole argument in one number. The pendulum from earlier in this module has the force term $\sin\theta$. Stand at $\bar\theta = 45^\circ$ and use the straight-line (tangent) guess for $\sin(45^\circ + \delta)$. How wrong is the straight line, as a share of the true change?

- for $\delta = 1^\circ$: about $0.9\%$ wrong;
- for $\delta = 10^\circ$: about $10\%$ wrong;
- for $\delta = 30^\circ$: about $43\%$ wrong.

The straight line is excellent for a small step and poor for a big one. An ordinary EKF must linearize across the whole spread of the *full state's* uncertainty, which can be large when the vehicle is turning hard or has flown a long way. An error-state filter only linearizes a *perturbation* — and because the nominal does all the big, exact work, that perturbation stays small no matter how far or how sharply the vehicle itself moves.

There is a second gift. The error changes **slowly**. A spacecraft may spin through $90^\circ$ in a few seconds, but its attitude *error* drifts by a fraction of a degree over the same time. So the nominal can be integrated at the fast **[[sensor rate of the IMU|imu-rates]]**, while the filter's heavier matrix work runs at the slower rate of the aiding measurements.

::: key Error-state (indirect) Kalman filter
Split the state into a large nominal part integrated nonlinearly and a small error estimated by the filter. The error stays near zero, so its linearization is excellent and its dynamics are slow and well conditioned.
:::

"Well conditioned" means the numbers in the error's covariance stay a sensible size and do not swing across many powers of ten, so the matrix arithmetic stays accurate on a flight computer.

## A pendulum test: with reset and without

The promise "the error stays small" is not automatic. It is kept by the bookkeeping at the end of every cycle. To see that, run two filters that differ in only that one step.

::: example Keeping the error small, and letting it grow
A $1\,\mathrm m$ pendulum starts at $50^\circ$. The filter's nominal starts at $45^\circ$, so it begins $5^\circ$ wrong. Every $\Delta t = 0.5\,\mathrm s$ an angle sensor with $3^\circ$ noise takes a reading. Both filters integrate the nominal with the full nonlinear pendulum equation, propagate the $2\times 2$ error covariance with $\mathbf F(\bar{\mathbf x})$, and update from each reading. They differ in one step only:

- **with reset**: after each update, the estimated error is folded into the nominal, and the error is set back to zero;
- **without reset**: the nominal is never corrected. It swings on by itself, and the error state carries all the corrections, pushed forward by the linear $\mathbf F$. (This design has its own name, the **[[linearized Kalman filter|linearized-kf]]**.)

Angle tracking error of each filter, and the size of the no-reset filter's error state:

| cycle | error, with reset | error, without reset | $|\delta\theta|$ without reset |
| --- | --- | --- | --- |
| $0$ | $0.24^\circ$ | $0.24^\circ$ | $1.3^\circ$ |
| $10$ | $2.71^\circ$ | $3.62^\circ$ | $26.5^\circ$ |
| $20$ | $2.34^\circ$ | $0.64^\circ$ | $0.7^\circ$ |
| $30$ | $-1.57^\circ$ | $-8.16^\circ$ | $75.6^\circ$ |
| $40$ | $-0.94^\circ$ | $-0.44^\circ$ | $74.4^\circ$ |
| $50$ | $-1.58^\circ$ | $-3.07^\circ$ | $6.7^\circ$ |
| $59$ | $-1.26^\circ$ | $-8.49^\circ$ | $58.5^\circ$ |

With reset, the error state is exactly zero at the start of every cycle, and the tracking error stays around $1^\circ$ to $3^\circ$ — about the sensor's own noise.

Without reset, the uncorrected nominal slowly drifts out of step with the real pendulum, because a **[[pendulum's period depends on how far it swings|pendulum-drift]]**. The error state has to describe that whole gap, and it swells to $75^\circ$. A linear model of a $75^\circ$ error is the "43% wrong" end of the list above, and the tracking error follows: over the last $20$ cycles its root-mean-square is $5.47^\circ$ against $2.53^\circ$ with reset. Across $200$ runs with different random noise, the same comparison gives $4.41^\circ$ against $2.53^\circ$.

Sanity check: nothing about the measurements, the noise or the true motion differs between the two filters. The only difference is whether the error was kept small.
:::

```python
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import expm

G0, L, q = 9.80665, 1.0, 0.05           # gravity, pendulum length (m), process noise
Qc = np.array([[0.0, 0.0], [0.0, q]])   # noise enters the angular rate only

def f(x):                               # true nonlinear pendulum: x = (theta, omega)
    return np.array([x[1], -(G0/L)*np.sin(x[0])])

def Fjac(x):                            # Jacobian of f, evaluated at x
    return np.array([[0.0, 1.0], [-(G0/L)*np.cos(x[0]), 0.0]])

def integrate(x0, dt):                  # accurate numerical integration of f
    sol = solve_ivp(lambda t, x: f(x), [0, dt], x0, method='DOP853', rtol=1e-11, atol=1e-12)
    return sol.y[:, -1]

def van_loan(F, dt):                    # discrete Phi and Qd from F and Qc
    n = F.shape[0]
    M = np.zeros((2*n, 2*n)); M[:n, :n] = -F; M[:n, n:] = Qc; M[n:, n:] = F.T
    eM = expm(M*dt); Phi = eM[n:, n:].T
    return Phi, Phi @ eM[:n, n:]

def run(seed, ncycles, dt, do_reset, sigma=np.radians(1.0)):
    rng = np.random.default_rng(seed)
    x_true = np.array([np.radians(50.0), 0.0])
    x_nom = np.array([np.radians(45.0), 0.0])   # nominal starts 5 degrees off
    P = np.diag([np.radians(5.0)**2, np.radians(2.0)**2])
    dx = np.zeros(2)                            # error-state estimate
    H = np.array([1.0, 0.0])                    # we measure the angle only
    rows = []
    for c in range(ncycles):
        x_true = integrate(x_true, dt) + rng.multivariate_normal([0, 0], Qc*dt)
        Phi, Qd = van_loan(Fjac(x_nom), dt)     # linearize about the nominal
        x_nom = integrate(x_nom, dt)            # nominal: full nonlinear model
        dx = Phi @ dx                           # error: linear model
        P = Phi @ P @ Phi.T + Qd
        z = x_true[0] + rng.normal(0, sigma)
        K = P @ H / (H @ P @ H + sigma**2)
        dx = dx + K*(z - (x_nom[0] + dx[0]))    # update the error state
        P = (np.eye(2) - np.outer(K, H)) @ P
        if do_reset:                            # inject, then reset
            x_nom, dx = x_nom + dx, np.zeros(2)
        est = x_nom + dx
        rows.append((c, np.degrees(est[0] - x_true[0]), np.degrees(abs(dx[0]))))
    return rows

sigma = np.radians(3.0)                 # a 3-degree angle sensor
with_reset = run(0, 60, 0.5, True, sigma)
no_reset = run(0, 60, 0.5, False, sigma)
for c in (0, 10, 20, 30, 40, 50, 59):
    print(c, round(with_reset[c][1], 2), round(no_reset[c][1], 2), round(no_reset[c][2], 1))
rms = lambda rows: np.sqrt(np.mean([r[1]**2 for r in rows[40:]]))
print(round(rms(with_reset), 2), round(rms(no_reset), 2))
# 0 0.24 0.24 1.3
# 10 2.71 3.62 26.5
# ...
# 59 -1.26 -8.49 58.5
# 2.53 5.47
```

## Injection and reset

The step that made the "with reset" column behave has two parts. They are worth naming exactly, because the next lesson has to generalize them to a state that is not an ordinary vector.

**Injection** is the navigator moving her pencil mark: fold the filter's estimated error into the nominal, $\bar{\mathbf x}\leftarrow\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$. (The arrow $\leftarrow$ reads "is replaced by".) Position, velocity and bias are injected by addition. Attitude is injected by quaternion multiplication.

**Reset** is starting the offset again from zero: $\delta\hat{\mathbf x}\leftarrow\mathbf 0$. The next cycle then linearizes about the *new*, corrected nominal instead of the old one.

But the reset also has to deal with the covariance. $\mathbf P$ describes how uncertain the error is, *measured from the old nominal*. After injection the error is measured from a new nominal. So the true error in the new coordinates is some function of the old error:

$$
\delta\mathbf x^{\text{new}} = \mathbf g(\delta\mathbf x), \qquad \mathbf G = \frac{\partial \mathbf g}{\partial\,\delta\mathbf x}\bigg|_{\delta\mathbf x=\delta\hat{\mathbf x}}.
$$

$\mathbf G$ is the **[[Jacobian of the reset|reset-jacobian]]**: how a small wiggle in the old error coordinates shows up in the new ones. Pushing a covariance through a linear map always gives $\mathbf G\mathbf P\mathbf G^{\mathsf T}$.

::: key Injection and reset
Inject: fold the estimated error into the nominal (multiplicatively for attitude, additively for position and bias). Reset: zero the error state and transform the covariance by the reset Jacobian G, $\mathbf P \leftarrow \mathbf G\mathbf P\mathbf G^{\mathsf T}$.
:::

For an additive state, the reset Jacobian is easy. The truth is $\bar{\mathbf x} + \delta\mathbf x$. After injection the new nominal is $\bar{\mathbf x} + \delta\hat{\mathbf x}$, so the new error is

$$
\delta\mathbf x^{\text{new}} = (\bar{\mathbf x} + \delta\mathbf x) - (\bar{\mathbf x} + \delta\hat{\mathbf x}) = \delta\mathbf x - \delta\hat{\mathbf x}.
$$

Subtracting a fixed number does not stretch or turn anything, so $\mathbf G = \mathbf I$ (the identity matrix) and $\mathbf P \leftarrow \mathbf P$: the covariance passes through unchanged. The reason is that a flat vector space looks the same everywhere. A $1^\circ$ error near $\bar\theta = 10^\circ$ is described in exactly the same way as a $1^\circ$ error near $\bar\theta = 80^\circ$. Moving the nominal changes nothing about what the error's coordinates mean.

::: example Injection and reset, one cycle in full
Take the first cycle of the "with reset" run above. Before the cycle, $\bar\theta = 45.000^\circ$ and $\bar\omega = 0$.

**Propagate.** Integrating the nonlinear pendulum for $0.5\,\mathrm s$ gives $\bar\theta_{\text{pred}} = 2.971^\circ$ and $\bar\omega_{\text{pred}} = -137.010^\circ/\mathrm s$. The pendulum has swung almost to the bottom — a big, truly nonlinear motion that the nominal absorbs with no linear approximation at all.

**Update.** The sensor reads $z = 5.947^\circ$. The **innovation** (reading minus prediction) is $5.947 - 2.971 = 2.975^\circ$. The gain, from the freshly propagated $\mathbf P$, is $\mathbf K = (0.436,\ -0.286\,\mathrm{s^{-1}})$. So the estimated error is

$$
\delta\hat{\mathbf x} = \mathbf K \times 2.975^\circ = (0.436 \times 2.975,\ -0.286 \times 2.975) = (1.296^\circ,\ -0.851^\circ/\mathrm s).
$$

**Inject.** Add it to the nominal:

$$
\bar{\mathbf x} \leftarrow (2.971 + 1.296,\ -137.010 - 0.851) = (4.267^\circ,\ -137.862^\circ/\mathrm s).
$$

The true angle at that moment was $4.025^\circ$, so the angle error dropped from $1.05^\circ$ to $0.24^\circ$.

**Reset.** $\delta\hat{\mathbf x} \leftarrow (0, 0)$. The state is additive, so $\mathbf G = \mathbf I$ and $\operatorname{tr}\mathbf P = 0.0652\,\mathrm{rad^2}$ both just before and just after the reset. ($\operatorname{tr}$, the **trace**, adds up the diagonal variances.) Next cycle's Jacobian $\mathbf F(\bar{\mathbf x})$ is worked out at $4.267^\circ$, the corrected angle — not at the $2.971^\circ$ the nominal predicted before the reading arrived.

Sanity check: the correction moved the angle toward the reading but not all the way ($1.296^\circ$ of the $2.975^\circ$ gap), because the gain $0.436$ is less than $1$. The filter trusted its prediction about as much as the $3^\circ$ sensor.
:::

::: warning The additive reset's simplicity is the exception, not the rule
$\mathbf P \leftarrow \mathbf P$ worked here only because the pendulum's state lives in an ordinary flat vector space. An attitude does not. The set of unit quaternions is a curved surface, and the flat **[[tangent space|tangent-space]]** at one attitude is not the same set of coordinates as the tangent space at another. Moving the nominal really does change what the error's coordinates mean, so carrying $\mathbf P$ through unchanged would be wrong. The next lesson works out that reset Jacobian, and it is not the identity.
:::

::: warning The error's smallness is earned, not guaranteed
Nothing forces $\delta\mathbf x$ to stay small by magic. The "without reset" column shows what happens when the upkeep is skipped: the error grows, and the linearization that depends on it goes bad — the truncation-error story from the first lesson of this module. Even a correct ESKF can get into this state. During a long stretch with no aiding measurement — a **[[GNSS outage|gnss-outage]]**, a star tracker blinded by the Sun — the error grows by dead reckoning alone. Once it stops being small, the same damage applies. Watch the filter's own $\mathbf P$ during outages, and be suspicious of the first update after a long one.
:::

## Check yourself

::: check
Explain, using what each part of the state is for, why the nominal $\bar{\mathbf x}$ needs no covariance attached to it.
:::

::: answer
The nominal is computed, not estimated. It is produced by integrating the true nonlinear dynamics from known inputs, so for given inputs it is a definite trajectory, not a random quantity. All of the filter's uncertainty — everything a covariance describes — is about how far the truth sits from that trajectory, and that is the error $\delta\mathbf x$. The Kalman recursion propagates and updates the covariance of $\delta\mathbf x$ only. The nominal just has to be integrated accurately each cycle.
:::

::: check
Right after one update, starting from the same prior, the total estimate $\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$ is the same number whether you reset or not. So why did skipping the reset hurt the tracking error in the example?
:::

::: answer
The two filters differ in what happens *next*. With reset, the corrected state becomes the nominal, and it is pushed forward by the full nonlinear dynamics, with the next Jacobian worked out at a point close to the truth. Without reset, the correction stays in $\delta\hat{\mathbf x}$ and is pushed forward by the *linear* map $\boldsymbol\Phi$, worked out at the old, uncorrected nominal. Cycle after cycle that nominal drifts further from the truth, the error it must describe grows (to $75^\circ$ in the example), and the linear map describes a large error badly. The mistakes pile up — the first lesson's truncation error, compounded — so the tracking error ends up about twice as large.
:::

::: check
A colleague's ESKF injects the correction correctly but forgets the reset line: after $\bar{\mathbf x}\leftarrow\bar{\mathbf x}+\delta\hat{\mathbf x}$, the error $\delta\hat{\mathbf x}$ is left as it was. The next cycle propagates that stale $\delta\hat{\mathbf x}$ and adds it to the estimate again. What goes wrong?
:::

::: answer
The same correction is counted twice — and then again every cycle. Each cycle the leftover $\delta\hat{\mathbf x}$ is propagated and still treated as "error not yet applied", so it keeps getting added to a nominal that already contains it. The estimate is pushed further and further past the truth in the direction of the old corrections, while $\mathbf P$ (which knows nothing about the double counting) keeps claiming the filter is accurate. In telemetry you would see innovations that stay stubbornly one-sided and grow, instead of looking like zero-mean noise. The fix is the reset line itself: after injection the error estimate must be exactly zero.
:::

::: check
Why is $\mathbf P\leftarrow\mathbf P$ the correct reset rule for the pendulum, when the next lesson says it is not correct for an attitude?
:::

::: answer
For an ordinary vector state, the new error is the old error minus a fixed number, $\delta\mathbf x^{\text{new}} = \delta\mathbf x - \delta\hat{\mathbf x}$. Its Jacobian is $\mathbf G = \mathbf I$, so $\mathbf G\mathbf P\mathbf G^{\mathsf T} = \mathbf P$. Put another way, the flat space looks identical everywhere: an error near one nominal is measured in the same coordinates as an error near any other. An attitude lives on a curved space. Its error coordinates are attached to the nominal attitude, and moving the nominal turns those coordinates slightly. The covariance has to be turned with them, by a reset Jacobian that is not the identity.
:::

::: check
Would running the pendulum example with a much shorter cycle, $\Delta t = 0.05\,\mathrm s$ instead of $0.5\,\mathrm s$ (and ten times as many cycles, so the same $30\,\mathrm s$), rescue the no-reset filter?
:::

::: answer
No. The error state without reset has to describe the gap between the free-running nominal and the real pendulum, and that gap depends on elapsed *time* — how far the two swings have drifted out of step — not on how often you update. Running the same code with $\Delta t = 0.05\,\mathrm s$ over $20$ random runs, the no-reset error state still peaks at about $64^\circ$ on average, the same as with $\Delta t = 0.5\,\mathrm s$. Both filters get more accurate because they now see ten times as many readings ($1.45^\circ$ and $2.40^\circ$ RMS over the last third of the run), but the no-reset filter is still about $1.7$ times worse. Only injection and reset keep the error small.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Error-state split | Truth = nominal composed with a small error | $\mathbf x = \bar{\mathbf x}\oplus\delta\mathbf x$ |
| Nominal | Integrated with the full nonlinear dynamics, no covariance | $\dot{\bar{\mathbf x}} = \mathbf f(\bar{\mathbf x})$ |
| Error | Estimated by the Kalman filter, linearized about the nominal | $\delta\dot{\mathbf x}\approx\mathbf F(\bar{\mathbf x})\,\delta\mathbf x$ + noise |
| Why it helps | Linearization error grows like the error squared | $0.9\%$ at $1^\circ$, $43\%$ at $30^\circ$ for $\sin\theta$ |
| Injection | Fold the estimated error into the nominal | $\bar{\mathbf x}\leftarrow\bar{\mathbf x}\oplus\delta\hat{\mathbf x}$ |
| Reset | Zero the error, transform the covariance | $\delta\hat{\mathbf x}\leftarrow\mathbf 0$, $\mathbf P\leftarrow\mathbf G\mathbf P\mathbf G^{\mathsf T}$ |
| Additive reset | Flat space: nothing to turn | $\mathbf G = \mathbf I$ |
| Pendulum test | Last $20$ cycles, RMS angle error | $2.53^\circ$ with reset, $5.47^\circ$ without |

Every number here came from a state that adds like an ordinary vector, which made the reset free. The next lesson uses the identical design — nominal, error, injection, reset — on the one state in this course that does not add like a vector: a spacecraft's attitude.

::: context dead-reckoning Navigating by arithmetic
Dead reckoning means working out where you are from where you started, how fast you went, which way, and for how long — with no outside fix. Sailors did it for centuries with a log line, a compass and a clock. An aircraft's or spacecraft's **inertial navigator** does exactly the same thing, only with accelerometers and gyros sampled hundreds of times a second. Its weakness is the navigator's weakness: small errors pile up, so every inertial system needs an occasional "lighthouse" — GNSS, a star tracker, a radar altimeter — to pull it back.
:::

::: context nominal-word What "nominal" means
"Nominal" comes from the Latin *nomen*, "name". A nominal value is the one you name as the reference: the planned or best-guess value, before the small corrections. Engineers use it everywhere — a "nominal" trajectory is the planned one, a "nominal" thrust is the rated one. In an ESKF the nominal is the reference the filter measures its error from. It is not "the truth" and it is not "the estimate's uncertainty"; it is the pencil line on the chart.
:::

::: context nominal-picture The nominal and the error, drawn
The blue curve is the nominal: the big, curving path integrated from the dynamics. The dashed red curve is the truth. The short arrows between them are the error $\delta\mathbf x$ — the only thing the Kalman filter estimates. The picture's point is the scale: the path bends a lot, but the arrows stay short, so a straight-line model of how the *arrows* change is good even where the *path* is strongly curved.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20,140 C90,140 120,30 190,30 C260,30 290,110 340,110" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M20,130 C92,128 124,20 192,18 C262,18 292,96 340,98" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="60" y1="134" x2="60" y2="124"/><line x1="110" y1="85" x2="112" y2="75"/>
    <line x1="190" y1="30" x2="191" y2="18"/><line x1="262" y1="55" x2="264" y2="43"/><line x1="320" y1="107" x2="321" y2="96"/>
  </g>
  <text x="200" y="60" font-size="12" fill="#1d6fd1">nominal (integrated exactly)</text>
  <text x="30" y="160" font-size="12" fill="#b4232c">truth</text>
  <text x="235" y="150" font-size="12" fill="#1f2a44">short lines: the error</text>
</svg>
```
:::

::: context imu-rates Two clocks in one navigator
An **IMU** (inertial measurement unit) is the box of three gyros and three accelerometers. Typical units deliver readings at a few hundred to a thousand times per second, and the nominal is integrated at that rate so no fast motion is missed. Aiding measurements come much more slowly: GNSS fixes usually at 1 to 10 per second, star tracker attitudes at a few per second. Because the error changes slowly, the ESKF can run its covariance propagation and updates at the slow rate. The Inertial Navigation module builds exactly this kind of filter.
:::

::: context linearized-kf The filter that never moves its reference
A Kalman filter that linearizes about a fixed reference trajectory, and never corrects that reference, is called a **linearized Kalman filter**. It is the "without reset" column. It makes sense when a very good reference is known in advance — a launch vehicle's planned ascent, say — and the true path is guaranteed to stay close. It fails exactly as the example shows once the truth wanders away from the reference. Correcting the reference every cycle turns it into an extended Kalman filter, and doing that in error-state form is the ESKF.
:::

::: context pendulum-drift Why the uncorrected nominal drifts away
A pendulum swinging through a big arc takes a little longer per swing than one swinging through a small arc. For a $1\,\mathrm m$ pendulum the period is about $2.087\,\mathrm s$ from $45^\circ$ and $2.106\,\mathrm s$ from $50^\circ$ — only $0.02\,\mathrm s$ apart. But that gap adds up every swing. After $30\,\mathrm s$, about $14$ swings, the two are roughly an eighth of a period out of step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="345" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,30 C33,30 40,120 55,120 C70,120 77,30 90,30 C103,30 110,120 125,120 C140,120 147,30 160,30 C173,30 180,120 195,120 C210,120 217,30 230,30 C243,30 250,120 265,120 C280,120 287,30 300,30 C313,30 320,120 335,120" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M20,26 C34,26 41,124 57,124 C73,124 80,26 94,26 C108,26 115,124 131,124 C147,124 154,26 168,26 C182,26 189,124 205,124 C221,124 228,26 242,26 C256,26 263,124 279,124 C295,124 302,26 316,26 C330,26 337,90 340,100" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="22" y="18" font-size="11" fill="#1d6fd1">nominal, 45° swing</text>
  <text x="180" y="18" font-size="11" fill="#b4232c">truth, 50° swing: slower</text>
  <text x="140" y="143" font-size="11" fill="#1f2a44">the peaks slide apart over time</text>
</svg>
```

Near the bottom of a swing the angle changes fast, so even a small time gap becomes a large angle gap — which is how the error state reached $75^\circ$.
:::

::: context reset-jacobian Why the covariance goes through G twice
If a random vector $\mathbf e$ has covariance $\mathbf P$ and you make a new vector $\mathbf G\mathbf e$, its covariance is $\mathbb E[\mathbf G\mathbf e\mathbf e^{\mathsf T}\mathbf G^{\mathsf T}] = \mathbf G\mathbf P\mathbf G^{\mathsf T}$. The matrix appears on both sides because a covariance is built from the vector *times itself*. It is the same rule as $\boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T}$ in the Kalman predict step. The reset Jacobian is the only place in an ESKF where this rule is applied to a change of *coordinates* rather than a step forward in *time*.
:::

::: context gnss-outage When the lighthouse goes dark
GNSS signals are weak and easy to lose: in tunnels, between tall buildings, under heavy jamming, or on a rocket during some phases of flight. During an outage the navigator coasts on its IMU alone, and the error grows. With a consumer MEMS IMU, position error can reach tens of meters within a minute; with a navigation-grade unit it stays far smaller for far longer. Designers size the IMU largely by how long the vehicle must survive an outage.
:::

::: context tangent-space A flat sheet touching a ball
Lay a flat sheet of paper on a basketball. Near the touching point, the sheet is a good map of the ball's surface: small moves on the ball are nearly moves on the sheet. That sheet is the **tangent space** at that point. Move to a different point on the ball, and the sheet there is tilted differently. That tilt is why the attitude reset needs a real Jacobian.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="40" x2="240" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="180" cy="40" r="4" fill="#1d6fd1"/>
  <line x1="197" y1="17.4" x2="282.6" y2="102.9" stroke="#b4232c" stroke-width="3"/>
  <circle cx="222.4" cy="57.6" r="4" fill="#b4232c"/>
  <text x="96" y="30" font-size="12" fill="#1d6fd1">tangent sheet here</text>
  <text x="256" y="72" font-size="12" fill="#b4232c">and here:</text>
  <text x="256" y="88" font-size="12" fill="#b4232c">tilted</text>
  <text x="150" y="160" font-size="12" fill="#1f2a44">curved space</text>
</svg>
```
:::
