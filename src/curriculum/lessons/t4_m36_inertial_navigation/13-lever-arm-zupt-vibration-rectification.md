---
id: l13-lever-arm-zupt-vibration-rectification
title: Lever arm compensation, zero-velocity updates, and vibration rectification
minutes: 16
covers:
  - "Lever arm compensation, zero-velocity updates, vibration rectification"
---

This module has built a strapdown navigator from the ground up: what the sensors measure, how their errors are named and characterized, how the mechanization turns their output into a trajectory, why that trajectory oscillates instead of diverging, how it is aligned and fused with GNSS. This last lesson closes three gaps a correct implementation cannot skip — where exactly on the vehicle "the position" is, how to exploit every stationary moment a mission actually offers rather than only the first one, and one error-model term the second lesson promised and deferred, the vibration-driven rectification a static bench test can never see.

## Lever arm compensation

An IMU and the sensor that aids it — a GNSS antenna, most often — are almost never at the same point on the vehicle, and a rigid body's points do not all move at the same velocity when the body rotates. For a vehicle rotating at $\boldsymbol\omega_{ib}^b$ with the antenna displaced from the IMU by a fixed vector $\mathbf r$ in body axes, the standard rigid-body velocity relationship gives the antenna's velocity as

$$
\mathbf v_{\text{antenna}} = \mathbf v_{\text{IMU}} + \mathbf C_b^n\big(\boldsymbol\omega_{ib}^b\times\mathbf r\big).
$$

Feed the antenna's GNSS-measured velocity into a filter that assumes it is measuring the IMU's own velocity, without subtracting this term, and the filter reads a rotation rate as if it were a genuine navigation error — a spurious, entirely geometric velocity that has nothing to do with how well the IMU is performing.

::: example What an uncompensated lever arm costs in a turn

A GNSS antenna sits $2\,\mathrm m$ forward of the IMU. The vehicle yaws at a modest $30^\circ/\mathrm s$ — an ordinary coordinated turn, nothing extreme.

```python
import numpy as np

r = np.array([2.0, 0.0, -0.5])            # m, IMU to antenna (2 m forward, 0.5 m up)
omega = np.array([0.0, 0.0, np.radians(30.0)])   # rad/s, yaw only
v_err = np.cross(omega, r)
print(v_err, np.linalg.norm(v_err))
# [-0.          1.04719755  0.        ] 1.0471975511965976
```

A $30^\circ/\mathrm s$ turn with a $2\,\mathrm m$ lever arm injects $1.05\,\mathrm{m/s}$ of spurious velocity — larger than this module's entire hour-long accelerometer-bias contribution to velocity error, from geometry alone, and it appears and disappears with every turn rather than growing steadily, which is exactly the signature that gives an uncompensated lever arm away in flight-test data: a velocity residual that tracks the vehicle's own turn rate has nothing to do with the IMU.
:::

The fix is the equation itself, applied as a correction rather than left as an error: measure $\mathbf r$ once, on the ground, and subtract $\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ from the aiding velocity before it reaches the filter, or equivalently add it to the predicted IMU-referenced velocity the filter compares against. Everything this correction needs — $\boldsymbol\omega_{ib}^b$, $\mathbf C_b^n$ — is already flowing through the mechanization loop this module built; the only new input is $\mathbf r$ itself, and getting it wrong by even a few centimetres re-introduces a fraction of the very error the term was meant to remove.

## Zero-velocity updates, used continuously

The alignment lesson introduced the zero-velocity update as a one-time procedure, run once before a mission starts. Nothing about the underlying measurement — $\mathbf z=\delta\mathbf v=\hat{\mathbf v}$ whenever the vehicle is genuinely at rest — is special to start-up, and a vehicle that stops repeatedly during its mission, a ground vehicle at traffic lights, a legged robot between steps, a ship alongside a pier, can apply it every single time, not only once.

::: example A ground vehicle that stops twice

Starting from the alignment lesson's own five-minute ZUPT session ($\sigma_{\text{tilt}}=6.87$ arcsec, $\sigma_b=0.0365^\circ/\mathrm h$), let the vehicle then drive for two minutes with no aiding — the tilt covariance can only grow, since the filter is running with no measurement at all — then stop again for one more minute of ZUPT:

```python
import numpy as np

g, Rn = 9.792092465091237, 6383003.276878938
F = np.array([[0.0, -1.0/Rn, 1.0], [g, 0.0, 0.0], [0.0, 0.0, 0.0]])
H = np.array([[0.0, 1.0, 0.0]])
dt = 10.0
Phi = np.eye(3) + F*dt + 0.5*(F@F)*dt**2 + (F@F@F)*dt**3/6.0
Rmeas = np.array([[0.05**2]])

def zupt(P, n):
    for _ in range(n):
        P = Phi @ P @ Phi.T
        S = H @ P @ H.T + Rmeas
        K = P @ H.T @ np.linalg.inv(S)
        P = (np.eye(3) - K @ H) @ P
    return P

def coast(P, n):
    for _ in range(n):
        P = Phi @ P @ Phi.T
    return P

P0 = np.diag([np.radians(1.0)**2, 1e-6, (np.radians(10.0)/3600.0)**2])
P1 = zupt(P0, 30)                    # 5 min stationary
P2 = coast(P1, 12)                   # 2 min driving, no update
P3 = zupt(P2, 6)                     # 1 min stopped again
P_never_stops = coast(P1, 18)        # same 3 extra minutes, but never stops again

for label, P in [("after 5 min ZUPT", P1), ("after 2 min driving", P2),
                  ("after 1 more min ZUPT", P3), ("if it never stopped again", P_never_stops)]:
    print(f"{label:28s} sigma_tilt={np.degrees(np.sqrt(P[0,0]))*3600:6.2f} arcsec")
# after 5 min ZUPT              sigma_tilt=  6.87 arcsec
# after 2 min driving            sigma_tilt= 11.05 arcsec
# after 1 more min ZUPT          sigma_tilt=  3.59 arcsec
# if it never stopped again      sigma_tilt= 13.06 arcsec
```

At the identical eight minutes of elapsed time, the vehicle that stopped a second time ends with a tilt uncertainty of $3.59$ arcseconds; the one that kept driving the whole time ends with $13.06$ — nearly four times worse, using the exact same total amount of aiding, concentrated at the start instead of spread across the mission. Every stationary moment a real mission offers is free information the Schuler loop is built to exploit, and treating alignment as something that happens only once leaves most of it on the table.
:::

::: warning
A zero-velocity update is only as good as the "zero" is true. The alignment lesson already flagged rocking, swell and engine vibration; a moving-mission ZUPT adds one more failure mode, applying the update while the vehicle is decelerating but not yet fully stopped. A velocity threshold and a short confirmation window before trusting a stop are standard, cheap insurance against feeding the filter a "zero" that is actually a fraction of a metre per second — an error the filter has no way to tell apart from a genuine tilt or bias.
:::

## Vibration rectification: the g-squared term

The error-model lesson wrote the accelerometer model through terms linear in specific force and flagged one it deferred: "a second-order term proportional to $f^2$, the anisoelastic or $g^2$ sensitivity, which rectifies vibration in the same way an asymmetric scale factor does." That mechanism, finally: an accelerometer with anisoelastic sensitivity $K$ (units $\mu g/g^2$) adds an error $\delta f = K f^2$ to its reading. Under vibration $f(t)=f_0\cos\omega t$ superimposed on whatever steady load the axis carries,

$$
\delta f(t) = K f_0^2\cos^2\omega t = \frac{Kf_0^2}{2}\big(1+\cos2\omega t\big),
$$

and the oscillating part averages to zero over any interval the mechanization integrates across, exactly as the random-walk lesson's white noise does — but the constant term, $Kf_0^2/2$, does not. It is a genuine bias, present for as long as the vibration lasts and invisible the instant the vibration stops, the identical signature scale-factor asymmetry produced in the error-model lesson, now from squaring rather than from unequal positive and negative slopes.

::: example How much vibration it takes to rival the sensor's own bias

Take a representative anisoelastic coefficient $K=20\,\mu g/g^2$ and this module's running accelerometer, bias instability $50\,\mu g$:

```python
K = 20e-6   # g per g^2
for f0 in [0.5, 1.0, 2.0]:
    rectified = K * f0**2 / 2
    print(f"{f0} g vibration -> {rectified*1e6:.2f} micro-g rectified bias")
# 0.5 g vibration -> 2.50 micro-g rectified bias
# 1.0 g vibration -> 10.00 micro-g rectified bias
# 2.0 g vibration -> 40.00 micro-g rectified bias
```

Half a $g$ of vibration, mild by launch-vehicle standards, rectifies to $2.5\,\mu g$, a small fraction of this accelerometer's own bias budget. Two full $g$ of vibration — an ordinary structural response near a running engine — rectifies to $40\,\mu g$, on its own within a whisker of the entire $50\,\mu g$ bias instability figure this module has quoted since the random-walk lesson, produced not by anything wrong with the sensor but purely by the environment it is bolted into. Because the effect scales with the *square* of vibration amplitude, halving it — a better isolator, a stiffer mount — cuts the rectified bias by a factor of four, the identical square-law leverage the coning lesson found for cone angle and for exactly the same underlying reason: both are second-order rectification of an oscillation that averages to zero in the raw signal and does not average to zero once it passes through a nonlinearity.
:::

::: key Vibration rectification, the family
Coning: two-axis angular vibration rectifies into a systematic attitude drift. Sculling: correlated angular and linear vibration rectifies into a systematic velocity error. Scale-factor asymmetry and $g^2$/anisoelastic sensitivity: vibration along a single axis rectifies into a systematic bias, through an odd or even nonlinearity respectively. All four are invisible at rest and all four scale as the square of some amplitude, which is why a vibration test, not a static bench test, is what a navigation-grade IMU's qualification program actually has to include.
:::

## Check yourself

::: check
A lever arm correction uses the vehicle's *current* angular rate, not a fixed number. Why can this term not be calibrated once and stored as a constant offset the way a sensor bias is?
:::

::: answer
The velocity error $\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ is proportional to the instantaneous angular rate, which changes constantly as the vehicle manoeuvres — zero in straight and level flight, over a metre per second in a moderate turn, as the worked example showed. A fixed offset calibrated at one turn rate would be wrong at every other turn rate, including zero, so the term has to be recomputed every cycle from the vehicle's own current $\boldsymbol\omega_{ib}^b$, which the mechanization already has on hand.
:::

::: check
In the two-stop ZUPT example, the bias uncertainty $\sigma_b$ does not change at all during the two minutes of driving between stops. Why not, given that the bias itself may genuinely be wandering during that time?
:::

::: answer
The covariance $\mathbf P$ only shrinks when a measurement updates it; with no ZUPT available while driving, the filter performs pure prediction, $\mathbf P\leftarrow\boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T}$, and in this illustration the bias is modelled with no process noise of its own, so nothing grows it either — the propagation leaves its variance untouched because nothing in $\mathbf P$'s equation touches the bias row except through the (unexercised) measurement. A more complete model would let $\sigma_b$ grow slightly between stops, via the bias's own Gauss-Markov process noise from the random-walk lesson, but that growth is far slower than what a ZUPT achieves in the other direction, which is why stopping to re-observe it is worth doing at all.
:::

::: check
Explain why halving the vibration amplitude cuts the $g^2$-rectified bias by a factor of four rather than a factor of two.
:::

::: answer
The rectified bias is $Kf_0^2/2$, proportional to the *square* of the vibration amplitude $f_0$, not to $f_0$ itself — exactly parallel to the coning lesson's finding that coning drift goes as the square of the cone angle. Halving $f_0$ therefore multiplies the rectified bias by $(1/2)^2=1/4$, not by $1/2$; any nonlinearity of even order in its input rectifies a zero-mean oscillation into a bias that scales with the square of the oscillation's size, whatever the specific physical mechanism.
:::

::: check
A flight-test engineer sees a velocity residual that appears only during turns and vanishes in straight flight, and separately a position drift that grows steadily whether the vehicle is turning or not. Which of this lesson's mechanisms explains each, and how would the engineer tell them apart from the data alone even without knowing the cause in advance?
:::

::: answer
The turn-correlated residual is a lever arm effect: it is proportional to angular rate, so it appears exactly when the vehicle turns and disappears exactly when it stops turning, with no dependence on how long the flight has lasted. The steady drift regardless of manoeuvring is ordinary uncorrected bias, growing by the free-inertial lesson's own time-dependent laws whether the vehicle is turning or flying straight. The two are distinguishable from the data alone because one correlates with the vehicle's angular rate record and the other correlates only with elapsed time — plotting either residual against $\boldsymbol\omega_{ib}^b$ instead of against $t$ is the standard diagnostic.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf v_{\text{antenna}}=\mathbf v_{\text{IMU}}+\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ | Lever arm compensation; error scales with angular rate, not with time |
| ZUPT, applied repeatedly | Every stationary moment in a mission is aiding the alignment lesson's filter can use, not only the first one |
| $\delta f=Kf^2$, rectified bias $Kf_0^2/2$ | Anisoelastic ($g^2$) sensitivity; invisible at rest, scales as vibration amplitude squared |
| Coning, sculling, scale-factor asymmetry, $g^2$-sensitivity | The four vibration-rectification mechanisms this module has named, all second-order, all invisible in a static test |

This closes the module. From what an accelerometer and a gyroscope physically sense, through their error models and the noise hierarchy that governs how those errors grow, through a full strapdown mechanization in three frames with coning and sculling correctly handled, through the Schuler oscillation and the complete free-inertial error budget it bounds, through alignment and INS/GNSS fusion and the error-state filter that ties them together, to the practical corrections in this final lesson — the whole chain from six raw numbers a second to a trusted position is now built, one honest derivation at a time.
