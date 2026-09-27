---
id: l12-error-state-filter-15-21-state
title: The error-state filter for INS
minutes: 24
covers:
  - "Error-state filter formulation for INS: the 15-state and 21-state models"
---

Think about a cheap wristwatch that runs a little fast. You do not take it apart every morning and rebuild it. You let it keep ticking, and you carry a small note in your head: "my watch is about two minutes fast, and it gains about ten seconds a day." Whenever you pass the clock on the town hall, you compare, fix up your note, and nudge the hands. The watch does the hard, fast work of counting every second. Your note only keeps track of how wrong the watch probably is.

An inertial navigator is built the same way. The mechanization from the frames and update lessons is the watch: it turns six streams of sensor numbers into attitude, velocity and position, hundreds of times a second, and it never stops. The Kalman filter is the note. It does not try to track the whole trajectory. It tracks only the **error state** — how far the mechanization has probably drifted from the truth — and it fixes that note up whenever an outside measurement, usually GNSS, comes in.

This lesson builds that filter in full. Every earlier filter in this module — the Schuler lesson's tilt and velocity pair, the alignment lesson's three states — was one axis of it. Here they come together in three axes: **fifteen states** in the standard form, **twenty-one** in the extended one.

## Why estimate the error, not the state itself

The Kalman filter module built its machinery for systems that are **[[linear|linear-meaning]]** — where doubling a cause doubles its effect — or close enough to linear that one straight-line approximation holds for one step. The navigator's own state is none of that.

- Its position sits on a curved Earth, millions of metres from the center.
- Its attitude is a **[[quaternion|quaternion-norm]]**, four numbers that must always have length exactly one — a rule no plain linear update respects.
- Its velocity can be hundreds of metres per second, and the update equations that move it are strongly nonlinear over anything but a very short time.

Estimating this state directly means re-linearizing a fast, curved, constrained trajectory at every step, the fragile **extended Kalman filter** approach.

The error-state idea sidesteps the problem. Let the mechanization keep running exactly as this module built it, with no filter inside its loop. What it computes is called the **nominal state**: the navigator's best guess before any correction. Let the filter estimate only the difference between the nominal state and the truth. That difference is small:

- a position error of metres, against a position of millions of metres;
- an attitude error of seconds of arc, against an attitude that may be tumbling;
- a velocity error of centimetres per second, against hundreds of metres per second.

Because it is small, it behaves almost exactly linearly — the Schuler lesson's derivation was this linearization for two of the fifteen states. The error state follows a **linear time-varying** system: linear in the errors, with coefficients that change as the vehicle's own acceleration and attitude change. The Kalman filter module's ordinary predict-and-update steps handle it with no changes.

We write the error as "computed minus true". Read $\delta\mathbf v$ as "delta v", the velocity error: $\delta\mathbf v=\hat{\mathbf v}-\mathbf v$, where the hat marks the computed value.

## Fifteen states, five groups of three

Here is the whole error state, stacked into one column:

$$
\delta\mathbf x = \begin{pmatrix}\delta\mathbf p \\ \delta\mathbf v \\ \boldsymbol\phi \\ \delta\mathbf b_a \\ \delta\mathbf b_g\end{pmatrix}, \qquad 3+3+3+3+3=15.
$$

Each group has three components, one per axis:

- $\delta\mathbf p$, the **position error**, here in metres north, east and down;
- $\delta\mathbf v$, the **velocity error**;
- $\boldsymbol\phi$ ("phi"), the **attitude error**, a small **[[rotation vector|rotation-vector]]**: an arrow along the axis of the small wrong turn, whose length is the angle in radians;
- $\delta\mathbf b_a$, the **accelerometer bias error** ("delta b sub a");
- $\delta\mathbf b_g$, the **gyro bias error**.

The attitude error is not a quaternion. The whole point of the error state is that it is small, and a small turn is described perfectly well by three numbers with no length rule to obey. Precisely, we define $\boldsymbol\phi$ by how the computed attitude matrix differs from the true one:

$$
\hat{\mathbf C}_b^n = (\mathbf I + [\boldsymbol\phi\times])\,\mathbf C_b^n .
$$

Here $\mathbf C_b^n$ ("C b to n") turns body-axis vectors into the north-east-down frame, and $[\boldsymbol\phi\times]$ is the matrix that performs "cross with $\boldsymbol\phi$". In words: the computed frame is the true frame turned by the small extra rotation $\boldsymbol\phi$.

The two bias groups are the ones the error-model and random-walk lessons built as **[[Gauss-Markov processes|gauss-markov]]**:

$$
\dot{\delta\mathbf b} = -\frac{\delta\mathbf b}{T} + \mathbf w .
$$

Read it as: the bias slowly relaxes back toward zero with a **correlation time** $T$, while white noise $\mathbf w$ keeps kicking it. Each sensor gets its own $T$ from its bench characterization.

### How the groups push on each other

The filter needs the rule $\dot{\delta\mathbf x}=\mathbf F\,\delta\mathbf x+\mathbf w$. The matrix $\mathbf F$ is built from five couplings, all physics you have met.

1. **Velocity error moves position error.** $\dot{\delta\mathbf p}=\delta\mathbf v$. A wrong speed carries you to a wrong place.
2. **Attitude error leaks specific force into velocity.** If the navigator thinks the body is turned by $\boldsymbol\phi$, it rotates the measured specific force the wrong way, and the leftover shows up as a false acceleration. Put the definition of $\boldsymbol\phi$ into the velocity update: the computed specific force in the navigation frame is $(\mathbf I+[\boldsymbol\phi\times])\mathbf C_b^n\mathbf f^b$, which is the true one plus $\boldsymbol\phi\times(\mathbf C_b^n\mathbf f^b)$. So

   $$
   \dot{\delta\mathbf v}\ni\boldsymbol\phi\times(\mathbf C_b^n\mathbf f^b).
   $$

   The symbol $\ni$ reads "contains the term". This is the Schuler lesson's gravity leak, made general: it misprojects *whatever* specific force the vehicle feels — the $1\,g$ of holding up against gravity, but also thrust and turning loads.
3. **Velocity error tilts the frame.** The local-level frame is steered by the transport rate $\boldsymbol\omega_{en}$, which the frames lesson computed from velocity. A wrong velocity steers the frame wrongly: $\dot{\boldsymbol\phi}\ni-\delta\boldsymbol\omega_{en}$. For a north velocity error on a sphere-like Earth, the tilt about east grows at $\delta v_N/R_M$, where $R_M$ is the meridian radius of curvature from the frames lesson. This is the other half of the Schuler loop.
4. **Accelerometer bias adds into velocity.** $\dot{\delta\mathbf v}\ni\mathbf C_b^n\,\delta\mathbf b_a$.
5. **Gyro bias adds into attitude.** $\dot{\boldsymbol\phi}\ni\mathbf C_b^n\,\delta\mathbf b_g$.

Stacked together, with the smaller Earth-rate and Coriolis terms kept only as named blocks, the whole system reads

$$
\frac{d}{dt}\begin{pmatrix}\delta\mathbf p\\ \delta\mathbf v\\ \boldsymbol\phi\\ \delta\mathbf b_a\\ \delta\mathbf b_g\end{pmatrix}
=\begin{pmatrix}
\mathbf 0 & \mathbf I & \mathbf 0 & \mathbf 0 & \mathbf 0\\
\mathbf F_{vp} & \mathbf F_{vv} & -[\mathbf f^n\times] & \mathbf C_b^n & \mathbf 0\\
\mathbf F_{\phi p} & \mathbf F_{\phi v} & \mathbf F_{\phi\phi} & \mathbf 0 & \mathbf C_b^n\\
\mathbf 0 & \mathbf 0 & \mathbf 0 & -\mathbf I/T_a & \mathbf 0\\
\mathbf 0 & \mathbf 0 & \mathbf 0 & \mathbf 0 & -\mathbf I/T_g
\end{pmatrix}
\begin{pmatrix}\delta\mathbf p\\ \delta\mathbf v\\ \boldsymbol\phi\\ \delta\mathbf b_a\\ \delta\mathbf b_g\end{pmatrix}+\mathbf w .
$$

Here $\mathbf f^n=\mathbf C_b^n\mathbf f^b$, and $-[\mathbf f^n\times]\boldsymbol\phi$ is the same thing as $\boldsymbol\phi\times\mathbf f^n$, written as a matrix times the state. $\mathbf F_{\phi v}$ holds the $1/R$ Schuler terms. $\mathbf F_{vv}$ holds the Coriolis terms from the velocity update. $\mathbf F_{vp}$ holds the change of gravity with height. $\mathbf F_{\phi p}$ and $\mathbf F_{\phi\phi}$ hold small Earth-rate terms. Every entry comes from an equation this module already derived.

::: example The single-axis block, checked by its eigenvalues
Take one horizontal channel: north position and velocity error, the tilt about east, the east gyro bias that drives that tilt, and the north accelerometer bias that drives that velocity. That is five of the fifteen states. Every number comes from the Schuler lesson, at $28.5^\circ$ latitude. The bias correlation times are $T_g=100\,\mathrm s$ and $T_a=300\,\mathrm s$.

```python
import numpy as np

g, Rm, Tg, Ta = 9.792092465091237, 6349951.494413983, 100.0, 300.0

# state: [dp_N, dv_N, phi_E, dbg_E, dba_N]
F = np.array([
    [0.0,    1.0,     0.0,     0.0,     0.0],
    [0.0,    0.0,     -g,      0.0,     1.0],
    [0.0,  1.0/Rm,     0.0,    1.0,     0.0],
    [0.0,    0.0,      0.0,  -1.0/Tg,   0.0],
    [0.0,    0.0,      0.0,    0.0,   -1.0/Ta],
])
for e in sorted(np.linalg.eigvals(F), key=lambda z: (round(z.real, 6), z.imag)):
    print(f"{e.real:+.6e} {e.imag:+.6e}j")
# -1.000000e-02 +0.000000e+00j
# -3.333333e-03 +0.000000e+00j
# +0.000000e+00 -1.241803e-03j
# +0.000000e+00 +0.000000e+00j
# +0.000000e+00 +1.241803e-03j
```

Row 2 is coupling 2 at rest: $\mathbf f^n$ points up with size $g$, and $\boldsymbol\phi\times\mathbf f^n$ gives $-g\,\phi_E$ in the north velocity. Row 3 is couplings 3 and 5.

Now read the five **[[eigenvalues|eigenvalue]]**, each a way the block can move on its own.

- $-1/T_g=-0.01\,\mathrm s^{-1}$ and $-1/T_a=-0.00333\,\mathrm s^{-1}$: the two biases relaxing with their correlation times, from the random-walk lesson.
- $\pm i\,\omega_s$ with $\omega_s=1.2418\times10^{-3}\,\mathrm{rad/s}$: a pure oscillation. This is the Schuler frequency $\sqrt{g/R_M}$ to five figures, falling out of the block's own characteristic equation.
- One exact zero: the position error. Nothing pulls it back toward any value. It only piles up whatever velocity error flows through it, the way a plain running total does.

Sanity check: the Schuler period $2\pi/\omega_s$ is about $5060\,\mathrm s$, or $84.3$ minutes, as it should be. The full filter is blocks like this one in each axis ($R_N$ in place of $R_M$ for the east channel), plus the couplings between them.
:::

::: example The vertical channel does not oscillate
The vertical channel is not a third copy of the horizontal pattern. Treating it as one is a standing trap.

Gravity gets weaker as you go up, by about $2g/a$ per metre (the **[[free-air gradient|free-air]]** from the update lesson, with $a$ the Earth's equatorial radius). Suppose the computed height is too high. The navigator then computes gravity slightly too weak, so it computes an upward drift that is not there. The computed height rises further, gravity gets weaker still, and the error feeds itself. In the horizontal channels the feedback has the opposite sign and pulls the error back.

Build the two-state block for height error and down-velocity error:

```python
import numpy as np
g0, a = 9.792092465091237, 6378137.0
dgdh = -2*g0/a
F_vert = np.array([[0.0, -1.0], [dgdh, 0.0]])
print(np.linalg.eigvals(F_vert))
# [ 0.00175229 -0.00175229]
```

One eigenvalue is positive, $\lambda=1.752\times10^{-3}\,\mathrm s^{-1}$. A positive real eigenvalue means exponential growth, not oscillation. Its time constant is $1/\lambda=571\,\mathrm s$, under ten minutes: every $571$ seconds, the height error is multiplied by $e\approx2.72$.

So an unaided INS height does not swing gently the way its horizontal position does. It runs away. Every real strapdown system aids the vertical channel — with a **[[barometric altimeter|baro]]**, a radar altimeter or GNSS height — because the Schuler mechanism that rescues the horizontal channels has no counterpart here.
:::

::: warning Two kinds of "unbounded"
The zero eigenvalue of the horizontal block and the positive eigenvalue of the vertical block both mean "no bound", and it is tempting to treat them alike. They are not alike. The horizontal zero means position adds up whatever velocity error passes through it, and that velocity error is itself Schuler-bounded — the free-inertial lesson's gentle, steady drift. The vertical instability multiplies itself with nothing to hold it back. An unaided height channel is a different kind of danger, not only a bigger one.
:::

## What the filter measures

A filter also needs a **measurement model**: a rule saying how each outside measurement relates to the error state. In the loosely coupled architecture of the last lesson, GNSS hands over a position and a velocity. Subtract them from the navigator's own nominal position and velocity. The truth cancels out, and what is left is the error plus the GNSS noise:

$$
\mathbf z=\begin{pmatrix}\hat{\mathbf p}-\mathbf p_{\text{GNSS}}\\ \hat{\mathbf v}-\mathbf v_{\text{GNSS}}\end{pmatrix}
=\begin{pmatrix}\mathbf I & \mathbf 0 & \mathbf 0 & \mathbf 0 & \mathbf 0\\ \mathbf 0 & \mathbf I & \mathbf 0 & \mathbf 0 & \mathbf 0\end{pmatrix}\delta\mathbf x+\boldsymbol\nu .
$$

That big matrix is $\mathbf H$, and $\boldsymbol\nu$ ("nu") is the GNSS noise. $\mathbf H$ touches only position and velocity. The filter learns attitude and biases through $\mathbf F$: a tilt shows up later as a velocity error, a bias as a tilt or a drift, and over many updates the filter works backward to the cause — the alignment lesson's trick, now with GNSS.

Between measurements the filter runs its **predict** step, $\mathbf P\leftarrow\boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T}+\mathbf Q_d$. Here $\mathbf P$ is the **[[covariance|covariance]]**, the filter's own record of how unsure it is about each state, $\boldsymbol\Phi$ is the one-step transition matrix built from $\mathbf F$, and $\mathbf Q_d$ is the noise added over one step. When a measurement arrives, the **update** step shrinks $\mathbf P$.

::: example Watching a GNSS outage in the covariance
Run the five-state block with the module's tactical IMU: angle random walk $0.3^\circ/\sqrt{\mathrm h}$, velocity random walk $0.0588\,\mathrm{m/s}/\sqrt{\mathrm h}$, gyro bias $3^\circ/\mathrm h$ and accelerometer bias $50\,\mu g$. GNSS gives position to $2\,\mathrm m$ and velocity to $0.1\,\mathrm{m/s}$, once a second. Then, from $300$ to $360\,\mathrm s$, the vehicle drives through a tunnel and GNSS is lost — a **[[GNSS outage|outage]]**.

```python
import numpy as np
from scipy.linalg import expm

g, Rm, Tg, Ta = 9.792092465091237, 6349951.494413983, 100.0, 300.0
deg = np.pi / 180
# state: [dp_N, dv_N, phi_E, dbg_E, dba_N]
F = np.array([[0, 1, 0, 0, 0],
              [0, 0, -g, 0, 1],
              [0, 1 / Rm, 0, 1, 0],
              [0, 0, 0, -1 / Tg, 0],
              [0, 0, 0, 0, -1 / Ta]])
sg, sa = 3 * deg / 3600, 50e-6 * 9.80665     # bias sizes, 1 sigma
Qc = np.diag([0, (0.0588 / 60)**2, (0.3 * deg / 60)**2,
              2 * sg**2 / Tg, 2 * sa**2 / Ta])
dt = 1.0
M = expm(np.block([[-F, Qc], [np.zeros((5, 5)), F.T]]) * dt)
Phi = M[5:, 5:].T                              # transition matrix
Qd = Phi @ M[:5, 5:]                           # process noise per step
H = np.array([[1.0, 0, 0, 0, 0], [0, 1.0, 0, 0, 0]])
R = np.diag([2.0**2, 0.1**2])                  # GNSS: 2 m and 0.1 m/s

P = np.diag([10.0**2, 1.0**2, (1 * deg)**2, sg**2, sa**2])
for t in range(1, 421):
    P = Phi @ P @ Phi.T + Qd                   # predict one second
    if not (300 < t <= 360):                   # GNSS lost from 300 s to 360 s
        K = P @ H.T @ np.linalg.inv(H @ P @ H.T + R)
        P = (np.eye(5) - K @ H) @ P            # update
    if t in (300, 330, 360, 361, 420):
        print(f"t={t:3d} s  sigma_p={np.sqrt(P[0, 0]):5.2f} m  "
              f"sigma_v={np.sqrt(P[1, 1]):.3f} m/s  "
              f"sigma_tilt={np.sqrt(P[2, 2]) / deg * 3600:5.1f} arcsec")
# t=300 s  sigma_p= 0.44 m  sigma_v=0.036 m/s  sigma_tilt= 76.7 arcsec
# t=330 s  sigma_p= 3.05 m  sigma_v=0.182 m/s  sigma_tilt=157.4 arcsec
# t=360 s  sigma_p=11.72 m  sigma_v=0.432 m/s  sigma_tilt=229.4 arcsec
# t=361 s  sigma_p= 1.78 m  sigma_v=0.078 m/s  sigma_tilt=103.6 arcsec
# t=420 s  sigma_p= 0.44 m  sigma_v=0.036 m/s  sigma_tilt= 76.8 arcsec
```

The `expm` line is Van Loan's method: one matrix exponential turns the continuous $\mathbf F$ and noise strengths into the one-second $\boldsymbol\Phi$ and $\mathbf Q_d$. The noise strengths are datasheet numbers per root second: $0.3^\circ/\sqrt{\mathrm h}$ is $0.3^\circ/60$ per $\sqrt{\mathrm s}$, because $\sqrt{3600}=60$. The bias noise $2\sigma^2/T$ holds each bias at its datasheet size.

Now read the output. With GNSS, the position uncertainty settles near $0.44\,\mathrm m$, smaller than one $2\,\mathrm m$ fix, because the filter blends hundreds of fixes through its motion model. In the tunnel it grows: $3.05\,\mathrm m$ after $30\,\mathrm s$, then $11.72\,\mathrm m$ after $60\,\mathrm s$. That is almost four times more for twice the time, the faster-than-linear growth the free-inertial lesson predicted from tilt and gyro bias. One fix after the tunnel pulls it back to $1.78\,\mathrm m$; a minute later it is back where it started.

Sanity check: in $60\,\mathrm s$ a $0.036\,\mathrm{m/s}$ velocity error alone moves you about $2.2\,\mathrm m$, and a $76.7$ arcsecond tilt leaks $g$ into a further $6.5\,\mathrm m$ or so. Add the gyro bias and the total near $12\,\mathrm m$ is the right size.
:::

## Injection and reset

The filter itself holds only an estimate $\delta\hat{\mathbf x}$ and a covariance $\mathbf P$. Every so often — at every measurement, in most systems — the estimate is **[[injected|injection-reset]]** into the nominal state, the way you nudge the watch's hands:

- position, velocity and the two biases: subtract the estimated error, because error means "computed minus true": $\hat{\mathbf v}\leftarrow\hat{\mathbf v}-\delta\hat{\mathbf v}$, and the same for the others;
- attitude: turn the computed frame back by the estimated small rotation, $\hat{\mathbf C}_b^n\leftarrow(\mathbf I-[\hat{\boldsymbol\phi}\times])\,\hat{\mathbf C}_b^n$, then renormalize so it stays a proper rotation.

Right after injection, the error state is **reset** to zero. The nominal state has absorbed the best guess of where it was wrong, so there is nothing left for $\delta\hat{\mathbf x}$ to describe. The covariance $\mathbf P$ carries on unchanged, to the accuracy this filter works at: the reset is exactly an identity for every state except the attitude, and there it differs from the identity only by terms of second order in a small angle. The whole nominal-and-error design, with every step written out for a quaternion navigator, is the subject of a well-known [[free paper by Joan Solà|sola]].

::: key The nominal/error split
The mechanization (the frames, update and coning/sculling lessons, together) runs the full nonlinear trajectory open-loop and never sees the filter. The error-state filter estimates only the small, near-linear deviation from that trajectory, using the Kalman filter module's own predict/update recursion on the linear system this lesson derives. Injection feeds the estimate back into the nominal state at every update; reset zeroes the error state immediately after, so the filter is always estimating a small quantity, never a large one.
:::

::: warning Signs of the attitude correction
Left-multiplying by $(\mathbf I-[\hat{\boldsymbol\phi}\times])$ is right only for this lesson's definition: $\boldsymbol\phi$ in the navigation frame, error as "computed minus true". A body-frame or "true minus computed" definition changes the side or the sign. Pick one definition, derive $\mathbf F$ and the injection from it, and write it at the top of the code. A sign mixed between the two is the classic error-state bug: the filter converges in a quiet test and then pushes attitude the wrong way in the first turn.
:::

## From fifteen states to twenty-one

The error-model lesson promised this last piece. Scale factors are calibrated once and stored as tables, and the residual scale-factor error is added to the filter when it matters. That turns fifteen states into twenty-one.

A scale-factor error is a small percentage error in the sensor's own gain. It multiplies the reading instead of adding to it. So add three accelerometer and three gyro scale-factor error states:

$$
\delta\mathbf f\ni\operatorname{diag}(\delta\mathbf s_a)\,\mathbf f^b,\qquad \delta\boldsymbol\omega\ni\operatorname{diag}(\delta\mathbf s_g)\,\boldsymbol\omega_{ib}^b .
$$

Here $\operatorname{diag}(\delta\mathbf s_a)$ is the matrix with the three scale-factor errors on its diagonal, so each axis's reading gets multiplied by its own error. The filter tells a scale-factor error apart from a bias by how it grows with the reading: a bias stays the same size whatever the sensor sees, while a scale-factor error grows as the reading grows. The error-model lesson's worked example showed exactly this — a static test cannot separate the two, and a maneuver can.

::: key The 15-state INS error state
Position (3), velocity (3), attitude (3), accelerometer bias (3), gyro bias (3). Extend to 21 or more with scale factors and misalignments when the IMU grade and the mission justify it.
:::

Two things decide it. The **IMU grade** decides how big the leftover scale-factor error is: a navigation-grade unit may keep it to a few parts per million after calibration, while a low-cost MEMS unit may leave hundreds or thousands. The **mission** decides whether the filter can see it. A vehicle under a steady, modest load gives the six extra states almost nothing to observe; one that swings through a wide range — an aircraft's climb and cruise, a launch vehicle's staged thrust — gives them real signal. A large leftover error *and* a wide dynamic range is when twenty-one pays. Add misalignment states as well and the count climbs to twenty-seven and beyond — the "or more" of the rule.

## Check yourself

::: check
Why can the attitude error $\boldsymbol\phi$ be three plain numbers, while the nominal attitude needs a quaternion or a direction cosine matrix?
:::

::: answer
A rotation vector describes an orientation faithfully and without trouble only for small angles, as the attitude representations module showed. The nominal attitude can be anything — upside down, mid-tumble — so it needs a representation with no small-angle limit, such as a quaternion or a direction cosine matrix. The error $\boldsymbol\phi$ is small by the premise of the error state, so the limit costs nothing, and three numbers with no length rule drop straight into a linear filter.
:::

::: check
In the five-state example, why is the position eigenvalue exactly zero, and not a small negative number meaning "it corrects itself eventually"?
:::

::: answer
Nothing in the block feeds position error back into any equation. The first row of $\mathbf F$ has a $1$ in the velocity column and zeros everywhere else, and no other row has anything in the $\delta p_N$ column. A state that is fed only by the integral of its input, and that feeds nothing, has no restoring force at all. That is what a zero eigenvalue means: no decay and no growth of its own, only whatever the velocity error adds up to — until an outside measurement, most directly a GNSS position fix, observes it.
:::

::: check
The vertical channel of this lesson is left unaided for twenty minutes. Roughly how much does a $1\,\mathrm m$ height error grow?
:::

::: answer
The time constant is $1/\lambda=571\,\mathrm s$. Twenty minutes is $1200\,\mathrm s$, which is $1200/571\approx2.1$ time constants. The error grows as $e^{t/571}$, so it is multiplied by about $e^{2.1}\approx8.2$. A $1\,\mathrm m$ error becomes roughly $8\,\mathrm m$. Unlike every horizontal error in this module, this growth does not slow down, bend over or oscillate: another twenty minutes multiplies it by about eight again, to roughly $67\,\mathrm m$.
:::

::: check
In the GNSS measurement model, $\mathbf H$ has zeros in every attitude and bias column. How can the filter still estimate a gyro bias?
:::

::: answer
Through $\mathbf F$. A gyro bias makes the tilt grow ($\dot{\boldsymbol\phi}\ni\mathbf C_b^n\delta\mathbf b_g$), the tilt leaks specific force into velocity ($\dot{\delta\mathbf v}\ni\boldsymbol\phi\times\mathbf f^n$), and the velocity error is measured. The predict step spreads uncertainty from the bias into velocity through exactly these couplings, so the covariance links them. When a velocity residual keeps growing in the pattern a bias would cause, the update step assigns part of it to the bias. A state never measured directly can still become well known, as long as a chain of couplings links it to a measured one.
:::

::: check
A designer wants to drop the six scale-factor states because "the fifteen-state filter already works fine in simulation." What should settle the question?
:::

::: answer
Two facts, neither of which the simulation supplies unless it was built to. First, the IMU grade: how large the residual scale-factor error is after calibration. Second, the mission's dynamic profile: whether the specific force and turn rate span a wide enough range for a scale-factor error to look different from a bias (the error-model lesson showed scale factor invisible at rest and dominant in a fast maneuver). A simulation that never flies that range, or injects no scale-factor error, will show fifteen states doing fine either way. The right test is a simulation of the real flight profile with the real sensor's residual errors.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\delta\mathbf x=(\delta\mathbf p,\delta\mathbf v,\boldsymbol\phi,\delta\mathbf b_a,\delta\mathbf b_g)$ | The 15-state error vector, three axes each |
| $\hat{\mathbf C}_b^n=(\mathbf I+[\boldsymbol\phi\times])\mathbf C_b^n$ | Definition of the small attitude error, in the navigation frame |
| $\dot{\delta\mathbf v}\ni\boldsymbol\phi\times(\mathbf C_b^n\mathbf f^b)$ | Attitude error misprojects the actual specific force, not only gravity |
| $\dot{\boldsymbol\phi}\ni-\delta\boldsymbol\omega_{en}$ | Velocity error tilts the frame: the Schuler loop in 3D |
| $\dot{\delta\mathbf b}=-\delta\mathbf b/T+\mathbf w$ | Bias states as Gauss-Markov processes |
| Eigenvalues $\pm i\omega_s$, $-1/T_g$, $-1/T_a$, $0$ | The single-axis block: Schuler, two bias decays, free position |
| Vertical channel: one positive real eigenvalue | Unstable, not oscillatory; always needs height aiding |
| $\mathbf H=[\mathbf I\ \mathbf 0\ \mathbf 0\ \mathbf 0\ \mathbf 0]$ for position | GNSS sees position and velocity; the rest is learned through $\mathbf F$ |
| Injection and reset | Nominal state absorbs the estimate at each update; error state returns to zero |
| 21-state model | Add $3+3$ scale-factor states when the IMU grade and the mission's dynamic range justify it |

This filter is the machinery under every architecture of the previous lesson. The last lesson closes the module with the practical corrections that separate a correct implementation from a good one: the lever arm between the IMU and the antenna, zero-velocity updates used at every stop, and the vibration errors a quiet bench never shows.

::: context linear-meaning What "linear" buys you
A rule is **linear** when causes add and scale cleanly: twice the tilt gives twice the velocity error, and two small errors together give the sum of their separate effects. That is what lets a Kalman filter carry a whole cloud of possibilities as one average and one covariance, and push both through the same matrix. Nonlinear rules bend the cloud into shapes a single average and covariance cannot describe. Small errors are the trick: almost any smooth rule looks straight if you zoom in far enough, the way the curved Earth looks flat from a parking lot.
:::

::: context quaternion-norm Four numbers on a leash
A quaternion stores an orientation as four numbers, $(q_0,q_1,q_2,q_3)$, and only those with $q_0^2+q_1^2+q_2^2+q_3^2=1$ are rotations. A Kalman update adds a correction to each number separately, and nothing about that addition keeps the sum of squares at one. After the update the "quaternion" is slightly too long or too short, and it now stretches vectors as well as turning them. Filters that estimate a quaternion directly have to patch this by renormalizing and by fudging the covariance. The error-state filter avoids the whole problem by never putting the quaternion in the filter at all.
:::

::: context rotation-vector One arrow for one small turn
Point your thumb along the axis you turn about, and make the arrow as long as the angle turned, in radians. That arrow is the rotation vector. For a small attitude error of $10$ arcseconds about east, it is an arrow pointing east, $4.85\times10^{-5}$ long.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="150" cy="95" rx="70" ry="22" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="150" y1="150" x2="150" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="150" y1="95" x2="150" y2="42" stroke="#b4232c" stroke-width="4"/>
  <polygon points="150,30 143,44 157,44" fill="#b4232c"/>
  <path d="M95,111 A70,22 0 0 0 205,110" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="208,109 196,103 197,116" fill="#1d6fd1"/>
  <text x="162" y="50" font-size="12" fill="#b4232c">arrow along the axis</text>
  <text x="162" y="66" font-size="12" fill="#b4232c">length = angle (rad)</text>
  <text x="150" y="140" font-size="12" fill="#1d6fd1" text-anchor="middle">the turn</text>
  <text x="235" y="100" font-size="12" fill="#1f2a44">axis</text>
</svg>
```

For big turns this arrow has trouble: at $\pi$ radians two opposite arrows describe the same turn. For small errors it is perfect.
:::

::: context gauss-markov A bias on a rubber band
A first-order Gauss-Markov process wanders, but a rubber band pulls it back toward zero. The $-\delta\mathbf b/T$ term is the rubber band; the white noise $\mathbf w$ is the random kicks. Over times much shorter than $T$ the bias looks nearly constant, which is why the filter can learn it. Over times much longer than $T$ it forgets its old value. Choosing $T$ too long makes the filter trust an old bias estimate that has gone stale; too short, and the filter gives up on a bias it could have learned.
:::

::: context eigenvalue What an eigenvalue tells you
For a linear system, each eigenvalue $\lambda$ is one "natural motion" the system can make on its own, shaped like $e^{\lambda t}$. A negative real $\lambda$ dies away. A purely imaginary pair swings forever at a steady size. A positive real $\lambda$ grows without end. Zero just holds still, or adds up whatever you feed it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="80" x2="110" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <path d="M10,30 C35,60 60,72 110,78" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="60" y="110" font-size="12" fill="#1f2a44" text-anchor="middle">negative: decays</text>
  <line x1="130" y1="80" x2="230" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <path d="M130,80 C142,40 155,40 167,80 C179,120 192,120 205,80 C213,55 222,50 230,60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="180" y="138" font-size="12" fill="#1f2a44" text-anchor="middle">imaginary: swings</text>
  <line x1="250" y1="80" x2="350" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <path d="M250,76 C300,74 325,62 350,20" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="300" y="110" font-size="12" fill="#b4232c" text-anchor="middle">positive: grows</text>
</svg>
```

The horizontal INS channel has the middle kind (Schuler). The vertical channel has the right-hand kind.
:::

::: context free-air How fast gravity fades with height
Gravity falls off with distance from Earth's center, as $1/r^2$. Near the surface that is a loss of about $2g/a$ per metre climbed: $2\times9.79/6\,378\,137$, about $3.07\times10^{-6}\,\mathrm{m/s^2}$ per metre. It is called "free-air" because it ignores the pull of any rock you climb over. It looks tiny, but it acts like a spring pushed the wrong way: a height error of $100\,\mathrm m$ creates a false vertical acceleration of about $3\times10^{-4}\,\mathrm{m/s^2}$, roughly $31\,\mu g$ — already most of a good accelerometer's bias budget, and it keeps growing with the error.
:::

::: context baro Measuring height with air pressure
Air pressure drops as you climb, about $12\,\mathrm{Pa}$ per metre near sea level. A barometric altimeter reads pressure and converts it to height. It drifts with the weather, but it never runs away the way an inertial height does, so the two complement each other perfectly. Aircraft have blended "baro" with inertial height since long before GPS; the combination is called a baro-inertial loop. Drones and phones do the same with a tiny chip pressure sensor.
:::

::: context covariance The filter's own doubt
The covariance $\mathbf P$ is a table of how unsure the filter is. Its diagonal holds the variance of each state (the square of its $1\sigma$ uncertainty). Its off-diagonal entries record which errors tend to go together — for example, "if the tilt is off this way, the velocity is probably off that way." Those links are what let a velocity measurement correct the tilt. A filter whose $\mathbf P$ is too small is overconfident and ignores good measurements; one whose $\mathbf P$ is too large chases noise.
:::

::: context outage Where GNSS goes missing
GNSS signals arrive from satellites about $20\,000\,\mathrm{km}$ away, weaker than the background noise. Tunnels, parking garages and dense city streets block or bounce them. Jammers drown them. During an outage the error-state filter keeps running its predict step, and the INS carries the navigation alone. The quality of the whole system is often judged by one number: how far the position has drifted after an outage of a stated length, such as $60$ seconds. Your filter design is what sets that number.
:::

::: context injection-reset Correct the watch, clear the note
The filter keeps a note, $\delta\hat{\mathbf x}$. At each update the note is used to nudge the nominal state, and then the note is wiped clean.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M20,120 C90,112 150,100 200,86" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M20,120 C90,118 150,112 200,108" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="200" cy="86" r="4" fill="#1f2a44"/>
  <circle cx="200" cy="108" r="4" fill="#1d6fd1"/>
  <line x1="200" y1="90" x2="200" y2="102" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="200,106 195,97 205,97" fill="#b4232c"/>
  <path d="M200,108 C250,106 290,103 340,98" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M200,108 C250,107 290,105 340,103" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="120" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">nominal (computed)</text>
  <text x="110" y="140" font-size="12" fill="#1d6fd1" text-anchor="middle">truth</text>
  <text x="210" y="60" font-size="12" fill="#b4232c">inject: subtract the</text>
  <text x="210" y="74" font-size="12" fill="#b4232c">estimated error, then reset</text>
</svg>
```

After the jump the nominal path starts again right beside the truth, and the error to estimate is small once more.
:::

::: context sola Further reading
Joan Solà's free paper "Quaternion kinematics for the error-state Kalman filter" works through this whole design — nominal state, error state, injection and reset — for a quaternion-based navigator, with every Jacobian written out. Paul Groves's book *Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems* gives the full fifteen-state $\mathbf F$ matrix in each frame. Both are listed in this module's resources.
:::
