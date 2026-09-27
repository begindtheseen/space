---
id: l05-measurement-types-and-models
title: "Measurement types and models: range, range-rate, angles, GNSS, VLBI, ISL"
minutes: 22
covers:
  - "Measurement types and models: range, range-rate/Doppler, angles, GNSS, VLBI, inter-satellite links"
---

Close your eyes in a park while a friend rides a bike around you. You can still learn a lot about where they are. Shout and time the echo off their helmet, and you know **how far** away they are. Listen to the bell as they pass: its pitch drops, which tells you **how fast** they are moving toward or away from you. Point where the sound comes from, and you have **which way**. And because the sound reaches one ear a tiny moment before the other, your brain can point surprisingly well.

Every tracking measurement of a spacecraft is one of these clues, made with radio waves or light instead of sound. This lesson goes through the kinds an orbit determination system really uses: range, range-rate (Doppler), angles, GNSS pseudoranges, VLBI and inter-satellite links.

For each one you need two things. The first is the **measurement model** $y = h(\mathbf x)$: a formula that says what the instrument *should* read if the spacecraft's state were $\mathbf x$. The second is its partial derivatives with respect to the state — the rows of $\mathbf H$. Every $\mathbf H_i$ in the batch normal equations and in the sequential filter of the last lesson came from exactly this. Along the way, notice which measurements are the same physical quantity under a different name, and which measure something genuinely different.

## Range: how far

A **range** is the straight-line distance from a tracking site to the spacecraft. A radar, a laser, or a radio **[[transponder|transponder]]** on the spacecraft sends a signal out and back and times the trip. Half the round-trip time, multiplied by the speed of light $c$, is the distance. At $1193\,\mathrm{km}$ the round trip takes about $7.96\,\mathrm{ms}$.

Put the station at position $\mathbf R$ and the spacecraft at $\mathbf r$, both measured from Earth's center. The arrow from station to spacecraft is the **line of sight** $\boldsymbol\rho = \mathbf r - \mathbf R$ ("rho"). The range is its length, and the unit vector along it, $\hat{\boldsymbol\rho} = \boldsymbol\rho/\rho$ ("rho hat"), points from the station toward the spacecraft:

$$
\rho = \lVert \mathbf r - \mathbf R \rVert, \qquad \frac{\partial\rho}{\partial\mathbf r} = \frac{\mathbf r-\mathbf R}{\rho} = \hat{\boldsymbol\rho}, \qquad \frac{\partial\rho}{\partial\mathbf v}=\mathbf 0.
$$

Read the partial in plain words. Move the spacecraft $1\,\mathrm m$ straight along the line of sight, and the range grows by $1\,\mathrm m$. Move it $1\,\mathrm m$ sideways, and the range hardly changes. The dot product with $\hat{\boldsymbol\rho}$ picks out exactly the along-the-line part of any small move. And range does not care how fast the spacecraft is going, so its partial with respect to velocity $\mathbf v$ is zero.

This is not a new derivation. It is the same unit line-of-sight Jacobian the least-squares module used for its multi-station range fix. The only orbit-specific detail is that $\mathbf R$ is not fixed. A ground station rides around with the spinning Earth, so in the inertial frame $\mathbf R = \mathbf R(t)$ must be worked out at the exact time of the measurement — the same site-rotation construction the initial-orbit-determination lesson used to place stations in an inertial frame. The very best ranging comes from **[[laser ranging|laser-ranging]]**, which reaches millimetres.

## Range-rate (Doppler): how fast along the line

When an ambulance drives toward you its siren sounds higher, and after it passes it sounds lower. That is the **[[Doppler effect|doppler-siren]]**. A radio signal from a spacecraft does the same thing. If the range is shrinking, the waves arrive bunched up and the frequency goes up; if it is growing, the frequency goes down.

The rate of change of range is the **range-rate**, $\dot\rho$ ("rho dot"). For a one-way signal sent at frequency $f_0$, the frequency shift is

$$
f_d = -\frac{\dot\rho}{c}\,f_0 .
$$

The minus sign says an approaching spacecraft ($\dot\rho$ negative) gives a positive shift. For a two-way signal that goes up to a transponder and back, the shift doubles, because the motion stretches the waves on both legs. A coherent link can also measure $\dot\rho$ directly from how fast the phase of a ranging tone changes.

Range-rate is the part of the relative velocity that lies along the line of sight. Call the relative velocity $\dot{\boldsymbol\rho} = \mathbf v - \dot{\mathbf R}$, where $\dot{\mathbf R}$ is the station's own velocity as Earth turns. Then

$$
\dot\rho = \frac{(\mathbf r-\mathbf R)\cdot(\mathbf v-\dot{\mathbf R})}{\rho} = \hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}, \qquad
\frac{\partial\dot\rho}{\partial\mathbf v} = \hat{\boldsymbol\rho}, \qquad
\frac{\partial\dot\rho}{\partial\mathbf r} = \frac{\dot{\boldsymbol\rho}}{\rho} - \frac{\dot\rho}{\rho}\,\hat{\boldsymbol\rho}.
$$

The velocity partial is the easy one: nudge $\mathbf v$, and $\dot\rho$ changes by the along-the-line part of the nudge. The position partial is less obvious. Moving the spacecraft sideways does not change its speed, but it *swings the line of sight*, and a swung line picks out a different part of the same velocity. That is why range-rate is sensitive to position too.

::: note Why it has to be true: the position partial of range-rate
Write $\dot\rho = \hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$ and hold the velocities fixed. Only $\hat{\boldsymbol\rho}$ depends on $\mathbf r$. Its derivative is

$$
\frac{\partial\hat{\boldsymbol\rho}}{\partial\mathbf r} = \frac{\mathbf I-\hat{\boldsymbol\rho}\hat{\boldsymbol\rho}^\mathsf T}{\rho}.
$$

In words: a move along the line changes the length but not the direction, so the $\hat{\boldsymbol\rho}\hat{\boldsymbol\rho}^\mathsf T$ part is removed; a sideways move of size $s$ turns the unit vector by an angle of about $s/\rho$. Now multiply by $\dot{\boldsymbol\rho}$ (the matrix is symmetric, so the order does not matter):

$$
\frac{\partial\dot\rho}{\partial\mathbf r} = \frac{(\mathbf I-\hat{\boldsymbol\rho}\hat{\boldsymbol\rho}^\mathsf T)\,\dot{\boldsymbol\rho}}{\rho} = \frac{\dot{\boldsymbol\rho}}{\rho} - \frac{(\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho})\,\hat{\boldsymbol\rho}}{\rho} = \frac{\dot{\boldsymbol\rho}}{\rho} - \frac{\dot\rho}{\rho}\,\hat{\boldsymbol\rho}.
$$

It is the sideways part of the relative velocity, divided by the range.
:::

Stacking range and range-rate together gives a $2\times6$ block of $\mathbf H$ — first three columns for position, last three for velocity:

$$
\mathbf H=\begin{pmatrix}\hat{\boldsymbol\rho}^\mathsf T & \mathbf 0\\ (\dot{\boldsymbol\rho}/\rho-\dot\rho\hat{\boldsymbol\rho}/\rho)^\mathsf T & \hat{\boldsymbol\rho}^\mathsf T\end{pmatrix}.
$$

That is exactly what fed the batch and sequential estimators of the last three lessons.

::: example The Doppler shift of a low-orbit pass
A spacecraft in a $420\,\mathrm{km}$ orbit is $1193\,\mathrm{km}$ from a station and closing at $\dot\rho = -4.761\,\mathrm{km/s}$. It sends a one-way signal at $f_0 = 2.2\,\mathrm{GHz}$ (S-band). The speed of light is $c = 299\,792.458\,\mathrm{km/s}$.

**Shift.** Put the numbers into the formula:

$$
f_d = -\frac{-4.761}{299\,792.458} \times 2.2 \times 10^9 \approx 34\,900\,\mathrm{Hz}.
$$

So the station hears the signal about $34.9\,\mathrm{kHz}$ high. The sign is positive, as it must be for a spacecraft coming closer.

**Precision.** A range-rate noise of $1\,\mathrm{mm/s}$ is a frequency error of $\frac{10^{-6}}{299\,792.458} \times 2.2 \times 10^9 \approx 0.0073\,\mathrm{Hz}$. Tracking receivers really do hold a carrier to a few thousandths of a hertz, which is why Doppler is one of the most precise measurements in orbit determination.

Sanity check: $34.9\,\mathrm{kHz}$ out of $2.2\,\mathrm{GHz}$ is a shift of about $16$ parts per million, the same as $4.761$ out of $299\,792$. Tiny, as it should be for something moving at a few thousandths of a percent of light speed.
:::

::: example Checking the partials against a brute-force difference
Hand-derived partials are easy to get wrong, so engineers always test them. Nudge each state component a little both ways, recompute the measurement, and divide the change by the size of the nudge (a **central difference**). If the analytic $\mathbf H$ is right, the two tables match.

The state below is a spacecraft at $413\,\mathrm{km}$ altitude, seen by a station at $40^\circ$ N at an elevation of about $15^\circ$.

```python
import numpy as np

def range_rr(x, R, V):
    rho = x[:3] - R                  # line of sight, station to spacecraft
    rhod = x[3:] - V                 # relative velocity
    rn = np.linalg.norm(rho)
    return np.array([rn, rho @ rhod / rn])

def H_analytic(x, R, V):
    rho = x[:3] - R; rhod = x[3:] - V
    rn = np.linalg.norm(rho); rr = rho @ rhod / rn
    H = np.zeros((2, 6))
    H[0, :3] = rho / rn                          # d(range)/dr
    H[1, :3] = (rhod - rr * rho / rn) / rn       # d(range-rate)/dr
    H[1, 3:] = rho / rn                          # d(range-rate)/dv
    return H

# spacecraft state (km, km/s) and a station at 40 deg N on a round Earth
x = np.array([3149.693, 4949.506, 3421.126, -6.090, 0.695, 4.602])
R = np.array([2635.8, 4114.0, 4099.8]); V = np.array([-0.300, 0.192, 0.0])
print("range %.1f km, range-rate %.3f km/s" % tuple(range_rr(x, R, V)))

H = H_analytic(x, R, V)
h = 1e-3                                         # nudge each component by 1 m or 1 m/s
H_fd = np.column_stack([(range_rr(x + h*e, R, V) - range_rr(x - h*e, R, V)) / (2*h)
                        for e in np.eye(6)])
print("analytic and numerical agree:", np.allclose(H, H_fd, rtol=0, atol=1e-8))
# range 1192.8 km, range-rate -4.761 km/s
# analytic and numerical agree: True
```

The largest entries of $\mathbf H$ are about $0.7$, and the two versions agree to better than $10^{-8}$ — the leftover is round-off in the subtraction, not a flaw in the formulas. The station's velocity $\mathbf V$ is Earth's spin carried to $40^\circ$ N, about $0.36\,\mathrm{km/s}$.
:::

## Angles: which way

An optical telescope, or the pointing of a big dish, measures **direction** only. The usual pair is **right ascension** $\alpha$ ("alpha", an angle around the equator) and **declination** $\delta$ ("delta", an angle up from the equator). Azimuth and elevation, measured from the local horizon, carry the same information and are related to $\alpha, \delta$ by a fixed rotation. With $\boldsymbol\rho=\mathbf r-\mathbf R$ written as components $(\rho_x, \rho_y, \rho_z)$:

$$
\alpha=\operatorname{atan2}(\rho_y,\rho_x), \qquad \delta=\arcsin(\rho_z/\rho), \qquad \boldsymbol\rho=\mathbf r-\mathbf R,
$$

where **[[atan2|atan2]]** is the two-argument arctangent. The partials are

$$
\frac{\partial\alpha}{\partial\mathbf r} = \frac{(-\rho_y,\ \rho_x,\ 0)}{\rho_x^2+\rho_y^2}, \qquad
\frac{\partial\delta}{\partial\mathbf r} = \frac{(-\rho_x\rho_z,\ -\rho_y\rho_z,\ \rho_x^2+\rho_y^2)}{\rho^2\sqrt{\rho_x^2+\rho_y^2}},
$$

and both are zero with respect to velocity. Check one thing about them: dot each row with $\boldsymbol\rho$ itself and you get zero. A move straight along the line of sight does not change either angle.

These are the same partials the initial-orbit-determination lesson's Gauss method needed to build its line-of-sight vectors, now arranged as rows of $\mathbf H$ for a filter instead of inputs to a closed-form method. The point to carry forward: angles give two numbers per look and are blind to range. That is exactly why Gauss needed three separated looks (and the observer's own motion) to recover a full state from angles, where a single range-and-rate look already pins a lot down.

::: warning Angles alone never give a range, however many you take from one site
No amount of extra angular precision, and no number of repeated angle measurements from a *single*, non-moving vantage point, adds range information. Both angle partials are perpendicular to $\hat{\boldsymbol\rho}$: along the line of sight they are exactly zero. Range enters an angles-only solution only through the observer's own motion between looks (the Gauss method), or through a genuinely separate baseline (VLBI, or triangulation from two sites). Mistaking "more angle data" for "better range knowledge" is a common and completely avoidable error.
:::

## GNSS pseudorange: a range with a clock error

A GPS receiver works out distance from travel time: the satellite stamps each signal with the time it left, and the receiver notes when it arrived. But the receiver's own clock is cheap and not synchronized to GPS time. If it runs $1\,\mathrm{\mu s}$ fast, *every* distance comes out about $300\,\mathrm m$ too long. So the measured quantity is not quite a range. It is a **[[pseudorange|pseudorange]]**:

$$
\tilde\rho = \lVert\mathbf r-\mathbf r_{\text{GPS}}\rVert + c\,\delta t_{\text{clock}} + \text{(other errors)},
$$

with $\delta t_{\text{clock}}$ a fourth unknown solved for alongside position — exactly the receiver-clock-bias treatment the GNSS module built in full for the navigation solution itself.

For orbit determination of a spacecraft carrying a GPS receiver, the same pseudoranges become tracking data. $\mathbf H$ gains one more column, $\partial\tilde\rho/\partial(\delta t_{\text{clock}})=c$, a constant, next to the usual $\hat{\boldsymbol\rho}$ block for position. The clock bias can be solved for as an extra state, or removed by **differencing** — subtracting two measurements that share the same bias, as carrier-phase and differential techniques do. That is the same solve-for-or-eliminate choice that comes back with every nuisance parameter in this module.

## VLBI: two ears thousands of kilometres apart

Your two ears tell you which way a sound comes from, because a sound from your left reaches your left ear a fraction of a millisecond earlier. **Very-long-baseline interferometry**, or **VLBI**, does the same with two radio dishes. It does not measure range at all.

Put two antennas at $\mathbf R_1$ and $\mathbf R_2$. The arrow between them, $\mathbf b=\mathbf R_2-\mathbf R_1$, is the **baseline**, often thousands of kilometres long. Both receive the same signal. If the spacecraft is far enough away that the arriving wavefront is flat across the baseline — the **far-field**, or plane-wave, approximation — the far antenna hears it later by

$$
\Delta\tau \approx -\frac{\mathbf b\cdot\hat{\boldsymbol\rho}}{c},
$$

where $\hat{\boldsymbol\rho}$ is the direction from the first antenna to the spacecraft. This is the baseline projected onto the line of sight, divided by the speed of light. It depends on $\hat{\boldsymbol\rho}$ — direction only — and not on the distance $\rho$ at all. VLBI is an angle measurement.

::: example A VLBI delay: plane-wave formula against exact geometry
Two stations $8623\,\mathrm{km}$ apart (roughly the spacing of Goldstone in California and Effelsberg in Germany) look at a target in a fixed direction. Compare the exact delay (difference of the two true distances, divided by $c$) with the plane-wave formula, first at the Moon's distance and then at $0.2\,\mathrm{AU}$ ($3.0\times10^7\,\mathrm{km}$), a typical interplanetary distance.

```python
import numpy as np
C = 299792.458                                   # speed of light, km/s

def delay_exact(r, R1, R2):                      # extra time to reach station 2
    return (np.linalg.norm(r - R2) - np.linalg.norm(r - R1)) / C

def delay_planewave(r, R1, R2):                  # flat-wavefront formula
    rho_hat = (r - R1) / np.linalg.norm(r - R1)
    return -np.dot(R2 - R1, rho_hat) / C

R1 = np.array([-2355.0, -4645.0, 3628.0])        # km
R2 = np.array([3993.0, 1046.0, 4919.0])
u = np.array([0.4, 0.7, 0.3]); u /= np.linalg.norm(u)   # direction to target
print("baseline: %.0f km" % np.linalg.norm(R2 - R1))
for d in (3.844e5, 2.992e7):                     # Moon distance, then 0.2 AU
    r = R1 + d * u
    ex, pw = delay_exact(r, R1, R2), delay_planewave(r, R1, R2)
    print("d = %.3g km: exact %.6f ms, plane-wave %.6f ms, relative error %.1e"
          % (d, ex * 1e3, pw * 1e3, abs(ex - pw) / abs(ex)))
# baseline: 8623 km
# d = 3.84e+05 km: exact -26.751489 ms, plane-wave -26.795018 ms, relative error 1.6e-03
# d = 2.99e+07 km: exact -26.794470 ms, plane-wave -26.795018 ms, relative error 2.0e-05
```

**Reading the numbers.** The plane-wave delay is the same, $-26.795018\,\mathrm{ms}$, at both distances, because it depends only on direction. The exact delay creeps toward it as the target recedes. At the Moon the flat-wave formula is off by $1.6$ parts in a thousand (about $44\,\mathrm{\mu s}$), so real lunar VLBI uses the curved-wavefront model. At $0.2\,\mathrm{AU}$ it is good to $2$ parts in $100\,000$, about five significant figures. The error fell by a factor of about $79$ while the distance grew by a factor of about $78$: the curvature correction shrinks in proportion to distance.

**Range versus direction.** At $0.2\,\mathrm{AU}$, moving the target $1\,\mathrm{km}$ farther away along the same direction changes even the *exact* delay by only about $0.025\,\mathrm{ps}$. Moving it $1\,\mathrm{km}$ sideways changes it by about $300\,\mathrm{ps}$ — twelve thousand times more. That is what "VLBI measures angles" looks like in numbers.
:::

The payoff is precision. One big dish can tell directions apart only to about its **beamwidth**, the wavelength divided by the dish diameter: roughly $10^{-3}\,\mathrm{rad}$ for a $34\,\mathrm m$ dish at $8.4\,\mathrm{GHz}$. On an $8623\,\mathrm{km}$ baseline, a delay error of $1\,\mathrm{ns}$ is a path error of $30\,\mathrm{cm}$, which is an angle of about $3.5\times10^{-8}\,\mathrm{rad}$ — some thirty thousand times finer. Deep-space navigators pair range and Doppler, which pin down the line-of-sight direction superbly, with **[[delta-DOR|delta-dor]]**, a VLBI technique that fills in the sideways, plane-of-sky directions that range and Doppler see poorly. It is also used for geostationary satellites, where a single station's view changes very little.

## Inter-satellite links: ranging between spacecraft

Two spacecraft can range to each other over a radio or laser crosslink. The measurement is algebraically the same as a ground range, $\rho_{AB}=\lVert\mathbf r_A-\mathbf r_B\rVert$. The difference is structural. When both spacecraft are being estimated together, *both* ends are unknowns, so the partials appear twice, with opposite signs, in two different blocks of $\mathbf H$:

$$
\frac{\partial\rho_{AB}}{\partial\mathbf r_A} = \hat{\boldsymbol\rho}_{AB}, \qquad \frac{\partial\rho_{AB}}{\partial\mathbf r_B} = -\hat{\boldsymbol\rho}_{AB}.
$$

Here $\hat{\boldsymbol\rho}_{AB}$ is the unit vector from $B$ to $A$. Move $A$ a metre along it and the range grows a metre; move $B$ a metre the same way and the range shrinks a metre. Move both together and nothing changes. So a single **[[crosslink|crosslink]]** constrains the *relative* position of the two spacecraft along the link far better than it constrains either one's absolute position. That is a preview of why relative orbit determination for a constellation, built from many crosslinks, can reach much better relative accuracy than either spacecraft's absolute state — a theme the module returns to in its closing lesson.

::: key Six measurement types, two physical quantities
Range, GNSS pseudorange and inter-satellite range are all the same quantity — a line-of-sight distance — differing only in what sits at the far end (a fixed station, a GNSS satellite carrying its own clock error, or another spacecraft). Angles and VLBI delay are both direction-only measurements; VLBI reaches far higher angular precision by using a very long physical baseline instead of a single antenna's own resolution. Range-rate adds the time derivative of the first family. Every one of them reduces to a line-of-sight vector, or a baseline projected onto one, differentiated with respect to the state.
:::

## Check yourself

::: check
Explain why $\partial\dot\rho/\partial\mathbf v=\hat{\boldsymbol\rho}$ but $\partial\rho/\partial\mathbf v=\mathbf 0$, using the physical meaning of each measurement.
:::

::: answer
Range depends only on where the spacecraft *is* at the moment of the measurement, not on how fast it is moving, so it has no sensitivity to velocity at all.

Range-rate is literally the line-of-sight part of the relative velocity, $\dot\rho=\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$. A small change $\delta\mathbf v$ changes $\dot{\boldsymbol\rho}$ by exactly $\delta\mathbf v$, and (holding the position, and so $\hat{\boldsymbol\rho}$, fixed) its effect on $\dot\rho$ is $\hat{\boldsymbol\rho}\cdot\delta\mathbf v$. So the partial is $\hat{\boldsymbol\rho}$ itself.
:::

::: check
A spacecraft $800\,\mathrm{km}$ away is moving *away* from a station at $3.0\,\mathrm{km/s}$ along the line of sight, sending one-way at $f_0 = 8.4\,\mathrm{GHz}$. What Doppler shift does the station see, and what would it be for a two-way link?
:::

::: answer
Here $\dot\rho = +3.0\,\mathrm{km/s}$ (range growing). So $f_d = -\frac{3.0}{299\,792.458} \times 8.4 \times 10^9 \approx -84\,100\,\mathrm{Hz}$: the signal arrives about $84.1\,\mathrm{kHz}$ low, as expected for a receding source.

On a two-way link the motion stretches the waves on the way up and again on the way down, so the shift doubles to about $-168\,\mathrm{kHz}$. The $800\,\mathrm{km}$ does not enter: Doppler depends on $\dot\rho$, not on $\rho$.
:::

::: check
A GNSS-tracked spacecraft's receiver clock bias is added to the state as a solve-for parameter rather than removed by differencing. What does this cost in the size of the normal equations, and what does it buy?
:::

::: answer
It costs one extra row and column in $\boldsymbol\Lambda$ per clock state: one, if a single constant bias is assumed, or one per epoch if the bias is allowed to wander. The new column is simple, since $\partial\tilde\rho/\partial(\delta t)=c$ is the same for every pseudorange at that epoch.

It buys keeping every pseudorange in the fit as it is. Differencing cancels the bias by subtracting measurements from each other, which is simple to set up but uses up measurements, ties the differenced values together (they share terms, so their errors are correlated) and throws away any information about the clock itself. Solving for the bias avoids all three, at the price of one more parameter for the data to pin down.
:::

::: check
Why is the plane-wave VLBI formula's accuracy naturally quoted as a *relative* error rather than a fixed number of nanoseconds?
:::

::: answer
The plane-wave formula replaces the true, slightly curved wavefront with a flat one. How much they disagree depends on how much curvature the baseline "sees", and that shrinks as the target moves away. In the worked example, the error fell by a factor of about $79$ when the target went from the Moon's distance to $0.2\,\mathrm{AU}$, a distance ratio of about $78$.

The delay itself, $-\mathbf b\cdot\hat{\boldsymbol\rho}/c$, does not shrink with distance: it depends only on the baseline and the direction. So the same geometry gives a smaller and smaller *fraction* of error as the target recedes. Quoting the error as a fraction of the delay captures this in one number that depends on distance, instead of a nanosecond figure that would be wrong for every other target.
:::

::: check
Two spacecraft in a constellation are linked by a crosslink range, and only spacecraft $A$'s state is being estimated ($B$'s state is treated as known and fixed). How does $\mathbf H$ for this measurement differ from the case where both are estimated together?
:::

::: answer
With only $A$ solved for, $\mathbf H$ has a single $1\times 6$ (or $1\times n$) block, $\partial\rho_{AB}/\partial\mathbf r_A=\hat{\boldsymbol\rho}_{AB}$, exactly like a range to a fixed ground station. $B$'s position enters the predicted measurement, but not as a column of $\mathbf H$, because it is not an unknown.

With both estimated together, $\mathbf H$ has two blocks, $\hat{\boldsymbol\rho}_{AB}$ for $A$ and $-\hat{\boldsymbol\rho}_{AB}$ for $B$, and the measurement pins the difference $\mathbf r_A-\mathbf r_B$ far more tightly than either absolute position. Same measurement, very different observability, depending on which states are actually being solved for.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\rho=\lVert\mathbf r-\mathbf R\rVert$, $\partial\rho/\partial\mathbf r=\hat{\boldsymbol\rho}$ | Range; the least-squares module's line-of-sight Jacobian, reused; $\mathbf R(t)$ turns with Earth |
| $f_d=-(\dot\rho/c)f_0$ | One-way Doppler shift; doubles for two-way |
| $\dot\rho=\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$, $\partial\dot\rho/\partial\mathbf v=\hat{\boldsymbol\rho}$, $\partial\dot\rho/\partial\mathbf r=(\dot{\boldsymbol\rho}-\dot\rho\hat{\boldsymbol\rho})/\rho$ | Range-rate / Doppler |
| $\alpha,\delta$ partials, both zero in $\mathbf v$ and along $\hat{\boldsymbol\rho}$ | Angles: direction only, no range information |
| $\tilde\rho=\rho+c\,\delta t_{\text{clock}}$ | GNSS pseudorange; clock bias as an extra column of $\mathbf H$, or differenced away |
| $\Delta\tau\approx-\mathbf b\cdot\hat{\boldsymbol\rho}/c$ | VLBI delay; an angle measurement using a physical baseline as its aperture |
| $\partial\rho_{AB}/\partial\mathbf r_A=\hat{\boldsymbol\rho}_{AB}=-\partial\rho_{AB}/\partial\mathbf r_B$ | Inter-satellite range; constrains the relative state strongly |
| Central difference | Always test hand-derived partials against a brute-force numerical derivative |

Every measurement type here adds rows to the same $\mathbf H$ the batch and sequential estimators already use. Whether those rows actually pin the state down — one station or several, one geometry repeated or a changing one — is the subject of the next lesson.

::: context transponder A radio mirror that changes key
A transponder receives the ground's signal and sends it straight back, but at a slightly different frequency so the two do not drown each other out. The ratio is fixed exactly — for NASA's S-band links it is $240/221$ — and the returned wave keeps step with the incoming one. Because of that lock, the ground can compare the returning wave with the one it sent, count the cycles, and read both the round-trip time (range) and the frequency shift (Doppler) with its own very stable clock. The spacecraft needs no precise clock of its own.
:::

::: context laser-ranging Millimetres by bouncing light
Satellite laser ranging fires short laser pulses at a spacecraft carrying corner-cube reflectors — prisms that send light straight back where it came from, like a bicycle reflector. Timing the round trip gives the range to within millimetres. The LAGEOS satellites, launched in 1976 and 1992, are dense metal balls covered in these reflectors and do nothing else. Laser ranging needs clear skies and cooperative reflectors, so it is used to check and calibrate other tracking rather than for everyday operations.
:::

::: context doppler-siren Why the pitch changes
A moving source sends out each new wave from a little closer to you (if it is approaching), so the crests arrive bunched up: a higher frequency. Behind it, the crests are stretched out: a lower frequency. The fractional change is the speed along the line of sight divided by the wave speed — for radio, the speed of light.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="70" r="20" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="140" cy="70" r="40" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="130" cy="70" r="60" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="160" cy="70" r="5" fill="#b4232c"/>
  <line x1="170" y1="70" x2="200" y2="70" stroke="#b4232c" stroke-width="2"/>
  <polygon points="208,70 198,65 198,75" fill="#b4232c"/>
  <text x="160" y="92" font-size="11" fill="#b4232c" text-anchor="middle">moving</text>
  <circle cx="300" cy="70" r="6" fill="#1f2a44"/>
  <text x="300" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">listener</text>
  <text x="300" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">crests bunched: higher</text>
  <text x="40" y="145" font-size="11" fill="#1f2a44">behind: crests spread, lower</text>
</svg>
```

The circles are crests sent out at equal time steps; their centers drift right with the source.
:::

::: context atan2 Why a two-argument arctangent
An ordinary arctangent takes one number, $\rho_y/\rho_x$, and so cannot tell a direction from the one exactly opposite: $(1, 1)$ and $(-1, -1)$ give the same ratio. The function $\operatorname{atan2}(\rho_y, \rho_x)$ looks at the signs of both parts separately and returns the right angle anywhere in the full circle. Every programming language provides it, and using a plain arctangent for right ascension is a classic way to put a spacecraft on the wrong side of the sky.
:::

::: context pseudorange Why "pseudo"
"Pseudo" means "false" or "not quite". A pseudorange is a range with a clock error folded in. Because the same receiver clock error spoils every satellite's pseudorange by the same amount, it is one unknown, not many. That is why a GPS fix needs at least four satellites: three for position and one more for the receiver's clock.
:::

::: context delta-dor Delta-DOR and landing on Mars
In delta-DOR ("differential one-way ranging"), two widely separated Deep Space Network antennas record a spacecraft's signal, then quickly swing to a nearby quasar whose direction is known extremely well and record that too. Subtracting the two delays cancels most of the station clock and atmosphere errors. NASA and ESA have used it on Mars missions, including the approach of the Curiosity rover, to steer to the right entry corridor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="116" y1="2" x2="324" y2="158" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="146.4" y1="24.8" x2="156" y2="12" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="140" x2="354" y2="68" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="140" x2="146.4" y2="24.8" stroke="#b4232c" stroke-width="3"/>
  <line x1="60" y1="140" x2="300" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="140" r="6" fill="#1f2a44"/>
  <circle cx="300" cy="140" r="6" fill="#1f2a44"/>
  <text x="60" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">antenna 1</text>
  <text x="300" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">antenna 2</text>
  <text x="180" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">baseline b</text>
  <text x="14" y="70" font-size="11" fill="#b4232c">extra path</text>
  <text x="14" y="84" font-size="11" fill="#b4232c">= c Δτ</text>
  <text x="252" y="60" font-size="11" fill="#1d6fd1">flat wavefront</text>
  <text x="166" y="14" font-size="11" fill="#6c7a93">to spacecraft</text>
</svg>
```

The spacecraft is up and to the right, so the flat wavefront (dashed) reaches antenna 2 first. The red segment is how much farther it must travel to reach antenna 1: the baseline projected onto the line of sight.
:::

::: context crosslink Measuring the gap between two satellites
The GRACE mission (2002 to 2017) flew two satellites about $220\,\mathrm{km}$ apart in the same orbit, linked by a microwave ranging system that tracked changes in their separation to within a few micrometres. When the front satellite passed over a heavier region of Earth, it was pulled ahead slightly before the rear one, and the link saw the gap change. From those tiny changes scientists mapped Earth's gravity month by month, including melting ice sheets. It is an extreme example of how well a crosslink sees *relative* motion.
:::
