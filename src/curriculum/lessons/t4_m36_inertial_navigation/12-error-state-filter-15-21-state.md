---
id: l12-error-state-filter-15-21-state
title: The error-state filter for INS
minutes: 15
covers:
  - "Error-state filter formulation for INS: the 15-state and 21-state models"
---

Every filter this module has run so far was a small piece of a bigger picture drawn one axis at a time: the Schuler lesson's two states, tilt and velocity error, on a single horizontal channel; the alignment lesson's three, adding a gyro bias to that same pair. This lesson assembles the whole picture the INS/GNSS lesson's architectures are actually built on: a single filter carrying every error this module has characterized, in all three axes, at once — fifteen states in its standard form, twenty-one in its extended one — and shows that the pieces already built are not analogies for that filter's structure but literally its first five-state block, verified here on the same footing as everything else in this module.

## Why *error*-state, and not the state itself

A Kalman filter, in the form the Kalman filter module derived it, wants a state whose dynamics are linear, or close enough to linear that a single linearization holds for one step. The INS's own state — a position on a curved Earth, a unit quaternion, a velocity of possibly many hundred metres per second — is none of these things: the quaternion carries a norm constraint no linear update respects, and the mechanization's own dynamics, this module's fifth and sixth lessons, are frankly nonlinear over anything but the shortest interval. Estimating that state directly demands linearizing a fast-changing, constrained trajectory anew at every step, in the extended-Kalman-filter style.

The **error state** sidesteps the problem by construction. Let the mechanization loop keep running exactly as this module built it — the full nonlinear attitude, velocity and position update, open-loop, computing what this lesson calls the **nominal state** — and let the filter estimate only the *difference* between that nominal state and the truth: a position error of metres against a state of millions of metres, an attitude error of arcseconds against a rotation that itself may be tumbling, a velocity error of centimetres per second against a state of hundreds. That difference is small by construction, close to linear by construction — the entire content of the Schuler lesson's derivation was exactly this linearization, carried out for two of these fifteen states — and it evolves according to one time-invariant-ish linear system the Kalman filter module's ordinary machinery handles without modification.

## Fifteen states, five groups of three

$$
\delta\mathbf x = \begin{pmatrix}\delta\mathbf p \\ \delta\mathbf v \\ \boldsymbol\phi \\ \delta\mathbf b_a \\ \delta\mathbf b_g\end{pmatrix}, \qquad 3+3+3+3+3=15,
$$

position error, velocity error, and $\boldsymbol\phi$, a small rotation-vector attitude error (not a quaternion — the whole point of the error state is that it is small enough to represent this way), each in three axes, plus the accelerometer and gyro bias errors the error-model and random-walk lessons built as Gauss-Markov processes, $\dot{\delta\mathbf b}=-\delta\mathbf b/T+\mathbf w$, each carrying its own correlation time from a bench characterization.

The coupling between the first three groups is exactly the Schuler lesson's physics, generalized from one axis to three: an attitude error misprojects whatever specific force the vehicle actually feels — not only gravity, but thrust and manoeuvring acceleration too — into a velocity error, $\delta\dot{\mathbf v}\ni\boldsymbol\phi\times(\mathbf C_b^n\mathbf f^b)$, and a velocity error mistilts the platform through the same transport-rate mechanism the frames lesson derived, $\dot{\boldsymbol\phi}\ni-\delta\boldsymbol\omega_{en}$. The bias states feed in directly: an accelerometer bias adds straight into $\delta\dot{\mathbf v}$, a gyro bias straight into $\dot{\boldsymbol\phi}$, precisely as the Schuler lesson's driven examples already used them.

::: example The reduced single-axis block, verified against its own eigenvalues

Take one horizontal channel — north position and velocity, east tilt, the gyro bias driving that tilt, the accelerometer bias driving that velocity — five of the fifteen states, with every coefficient taken directly from the Schuler lesson's own equations:

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

Five eigenvalues, five recognizable pieces of this module: $-1/T_g=-0.01\,\mathrm s^{-1}$ and $-1/T_a=-0.00333\,\mathrm s^{-1}$, the two bias correlation times from the random-walk lesson; $\pm i\,\omega_s=\pm i\,1.2418\times10^{-3}\,\mathrm{rad/s}$, the Schuler frequency to six figures, the same $\sqrt{g/R_M}$ the Schuler lesson derived, falling straight out of this block's own characteristic equation; and a single exact zero, the position state's own free, undamped mode — position has nothing pulling it back to any particular value, only accumulating whatever velocity error passes through it, exactly as a plain integrator's eigenvalue structure always shows. Every one of the fifteen states in the full filter sits in a block that looks like a piece of this matrix, extended to three axes and, for the second horizontal channel, built from $R_N$ instead of $R_M$.
:::

::: example The vertical channel does not oscillate

The vertical channel is not a third copy of the horizontal pattern, and treating it as one is a standing trap. Gravity *decreases* with altitude, so a height error feeds back into the vertical velocity equation with the *opposite* sign the horizontal channels show: a computed height too large under-predicts the pull of gravity, which lets the platform "fall" further than it should, growing the height error further still. Build the two-state vertical block the same way as the horizontal one above, using the free-air gradient the mechanization lesson derived:

```python
import numpy as np
g0, a = 9.792092465091237, 6378137.0
dgdh = -2*g0/a
F_vert = np.array([[0.0, -1.0], [dgdh, 0.0]])
print(np.linalg.eigvals(F_vert))
# [ 0.00175229 -0.00175229]
```

One eigenvalue is strictly *positive*, $1.75\times10^{-3}\,\mathrm s^{-1}$ — an exponential instability with a $571\,\mathrm s$, under ten-minute, time constant, not an oscillation. An unaided INS's height estimate does not oscillate gently the way its horizontal position does; it runs away, and every real strapdown system aids the vertical channel with a barometric altimeter, a radar altimeter, or GNSS altitude specifically because the Schuler mechanism that rescues the horizontal channels has no counterpart here at all.
:::

::: warning
It is tempting to read the single zero eigenvalue in the five-state horizontal block and the exponential growth in the vertical block as the same kind of "unbounded" and stop worrying about the difference. They are not the same. The horizontal zero eigenvalue means position accumulates whatever velocity error passes through it, at a rate that is itself Schuler-bounded — the free-inertial lesson's secular-drift finding, gentle by comparison. The vertical instability compounds on itself with no such governor, so a height channel left unaided is qualitatively, not only quantitatively, more dangerous than a horizontal one over the same coast.
:::

## Injection and reset

The filter never touches the nominal trajectory directly while it runs; it only ever holds an estimate $\delta\hat{\mathbf x}$ and a covariance $\mathbf P$ describing how far the nominal state has probably drifted from the truth, propagated and updated by the Kalman filter module's ordinary predict-and-update recursion applied to the linear system above. Periodically — at every measurement, in most implementations — that estimate is **injected** back into the nominal state: position and velocity errors subtract off directly, biases subtract off directly, and the attitude error $\boldsymbol\phi$ composes into the nominal attitude as a small rotation, $\mathbf C_b^n\leftarrow\mathbf C_b^n(\mathbf I+[\hat{\boldsymbol\phi}\times])$ followed by the usual renormalization. Immediately after injection the error state is **reset** to zero — the nominal trajectory has absorbed the best estimate of where it was wrong, so there is nothing left for $\delta\hat{\mathbf x}$ to represent — while $\mathbf P$ carries forward unchanged in the fifteen-state model's linear approximation, since the reset here is an exact identity for every state except the small-angle attitude composition, which is linear to the order this filter already works in.

::: key The nominal/error split
The mechanization (this module's fifth through seventh lessons) runs the full nonlinear trajectory open-loop and never sees the filter. The error-state filter estimates only the small, near-linear deviation from that trajectory, using the Kalman filter module's own predict/update recursion on the linear system this lesson derives. Injection feeds the estimate back into the nominal state at every update; reset zeroes the error state immediately after, so the filter is always estimating a small quantity, never a large one.
:::

## From fifteen states to twenty-one

The error-model lesson closed with a promise: scale-factor and misalignment errors are calibrated once and stored as tables, "augmented with scale factors when the vehicle's dynamics are large enough for a residual scale-factor error to matter, which is what turns fifteen states into twenty-one." That promise is this lesson's last piece. Add three accelerometer scale-factor error states and three gyro scale-factor error states, each multiplying the sensor's own output rather than adding to it — $\delta\mathbf f\ni\operatorname{diag}(\delta\mathbf s_a)\,\mathbf f^b$, $\delta\boldsymbol\omega\ni\operatorname{diag}(\delta\mathbf s_g)\,\boldsymbol\omega_{ib}^b$ — and the filter can separate a residual scale-factor error from a plain bias by how it scales with the sensor's own reading, exactly the distinction the error-model lesson's worked example showed a static test cannot make but a manoeuvre can. A vehicle that spends its life under modest, roughly constant load has little for the extra six states to observe and gains little from carrying them; a vehicle that swings through a wide dynamic range — an aircraft's climb and cruise, a launch vehicle's staged acceleration profile — gives those states real signal to estimate against, and that is the entire criterion for choosing fifteen over twenty-one: not the platform's grade, but the spread of specific force and rate it actually experiences in flight.

## Check yourself

::: check
Explain why the error state $\boldsymbol\phi$ can be represented as a simple three-component rotation vector, while the nominal attitude cannot.
:::

::: answer
A rotation vector is only a faithful, singularity-free representation of an orientation for small angles; the attitude representations module built exactly this limitation into its treatment of axis-angle and related parameterizations. The nominal attitude can be any orientation at all — upside down, mid-tumble, anything — so it needs a representation like a quaternion or DCM that has no small-angle restriction. The error $\boldsymbol\phi$, by the entire premise of error-state estimation, is always small, so the representation that only works for small angles is not a limitation there at all; it is the natural, minimal, unconstrained choice.
:::

::: check
In the five-state worked example, why is the position eigenvalue exactly zero rather than some small negative number reflecting "eventually corrects itself"?
:::

::: answer
Nothing in the five-state block's dynamics feeds position error back into any other state's equation — the top row of $F$ has a $1$ in the velocity column and zeros everywhere else, and no other row references $\delta p_N$ at all. A state that influences nothing and is influenced by nothing but its own input integral has no restoring force whatsoever, which is exactly what a zero eigenvalue means: neither decay nor growth, only whatever the velocity error happens to integrate into, forever, until an external measurement (a GNSS position fix, most directly) observes it.
:::

::: check
A vertical channel with the eigenvalues this lesson computed is left unaided for twenty minutes. Roughly how much does a height error starting at $1\,\mathrm m$ grow, using the instability's own time constant?
:::

::: answer
The time constant is $1/1.75\times10^{-3}=571\,\mathrm s$, so twenty minutes ($1200\,\mathrm s$) is about $2.1$ time constants. An error growing as $e^{t/571}$ reaches $e^{2.1}\approx8.2$ times its starting value — a $1\,\mathrm m$ initial height error becomes roughly $8\,\mathrm m$, and unlike every horizontal error this module has computed, this growth does not slow down, bend over, or oscillate; left alone for another twenty minutes it grows by another factor of eight on top of that.
:::

::: check
A designer proposes dropping the six scale-factor states because "the fifteen-state filter already works fine in simulation." What single piece of information about the mission, not the sensor, should settle the question?
:::

::: answer
Whether the vehicle's actual specific force and angular rate span a wide enough range in flight for a residual scale-factor error to produce a materially different signature than a plain bias does — the error-model lesson's own worked example showed scale factor invisible at rest and dominant during a fast manoeuvre. A simulation that never exercises that range will show the fifteen-state filter performing fine regardless of whether the twenty-one-state model is needed, so the right test is the mission's own dynamic profile, not the simulation's current fidelity to it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\delta\mathbf x=(\delta\mathbf p,\delta\mathbf v,\boldsymbol\phi,\delta\mathbf b_a,\delta\mathbf b_g)$ | The 15-state error vector, three axes each |
| $\delta\dot{\mathbf v}\ni\boldsymbol\phi\times(\mathbf C_b^n\mathbf f^b)$ | Attitude error misprojects the *actual* specific force, not only gravity |
| $\dot{\boldsymbol\phi}\ni-\delta\boldsymbol\omega_{en}$ | Velocity error mistilts the platform, the Schuler loop generalized to 3D |
| Eigenvalues $\pm i\omega_s$, $-1/T_g$, $-1/T_a$, $0$ | Recovered exactly from the single-axis block: Schuler, two bias decays, free position |
| Vertical channel: one positive real eigenvalue | Unstable, not oscillatory; needs external height aiding, always |
| Injection / reset | Nominal state absorbs the estimate at each update; error state returns to zero |
| 21-state model | Add $3+3$ scale-factor states; worth it only when the mission's dynamic range justifies it |

The error-state filter this lesson built is the machinery every architecture in the previous lesson runs on top of. The module's last lesson turns to the smaller, practical corrections that separate a correct implementation from a good one: compensating for the physical separation between an IMU and whatever it aids, using a stationary constraint the way the alignment lesson did but continuously rather than only at start-up, and taming the vibration-driven errors the coning and sculling lesson first named.
