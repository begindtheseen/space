---
id: l10-initial-alignment
title: Initial alignment
minutes: 24
covers:
  - "Initial alignment: coarse leveling, gyrocompassing, fine alignment via Kalman filter, transfer and in-flight alignment"
---

Imagine someone sits you, blindfolded, in a swivel chair in a strange room. Can you tell which way is down? Easily. You feel your weight pressing into the seat, and if the chair leans a little you feel that too. Can you tell which way you are facing? No. Turn the chair slowly and nothing about your weight changes. To find your heading you would need some other clue — and it would have to be something that turns with the world, not something that pulls straight down.

An inertial navigation system wakes up in exactly that chair. Every equation this module has built so far — the attitude, velocity and position updates, the Schuler loop, the error growth laws — assumes the loop already has somewhere to start: an initial attitude $\mathbf C_b^n$ (read "C, b to n", the matrix that turns body-axis vectors into north-east-down ones), an initial velocity, an initial position. A **[[strapdown|strapdown-start]]** system, with its sensors bolted straight to the vehicle, knows none of its own orientation at power-up. It has to build its whole attitude — how level it is, and which way it points — from the same six numbers this module opened with: three accelerometer readings and three gyro readings.

That job is called **initial alignment**: finding the starting attitude (and calibrating what can be calibrated) before, or while, the vehicle starts to navigate. This lesson walks through it in the order accuracy demands:

- **coarse leveling** finds roll and pitch from gravity in a few seconds;
- **gyrocompassing** finds heading from the Earth's own spin, at a cost in time and latitude this lesson prices exactly;
- **fine alignment** sharpens both with a Kalman filter built on the Schuler loop;
- **transfer alignment** and **in-flight alignment** handle vehicles that never get to sit still.

## Coarse leveling: gravity finds the horizon

Hang a key on a string. The string points straight down, whatever the room is doing. An accelerometer triad sitting still does the same job in numbers: it reads gravity, and from which body axes that reading lands on, you can tell how the body is tilted.

The precise statement comes from the sensor-physics lesson. An accelerometer measures **specific force** $\mathbf f^b$ — the push the vehicle feels, per kilogram, in body axes. At rest the true acceleration is zero, so

$$
\mathbf f^b = -\mathbf C_n^b\,\mathbf g^n ,
$$

where $\mathbf C_n^b$ is the matrix that turns north-east-down (NED) vectors into body axes, and $\mathbf g^n = (0,\,0,\,g)$ is gravity in NED: all of it along "down". The minus sign is the bench pushing up on the sensor. Level and at rest, the reading is $(0,\,0,\,-g)$: a push of size $g$ pointing up.

Here is the key fact. Gravity has no horizontal part. So the body-axis reading depends only on how the body's own "down" is tipped away from true down — that is, on **roll** (lean left or right) and **pitch** (nose up or down). It does not depend on **heading** at all. Turning about the vertical changes nothing the accelerometers can feel, just like the swivel chair.

Undoing the standard yaw-pitch-roll rotation for the two angles gravity can see gives

$$
\hat\phi_{\text{roll}} = \operatorname{atan2}(-f_y,\,-f_z), \qquad \hat\theta_{\text{pitch}} = \operatorname{atan2}\!\left(f_x,\ \sqrt{f_y^2+f_z^2}\right).
$$

The hat on $\hat\phi$ ("phi hat") marks an estimate. The function **[[atan2|atan2-why]]** is the two-argument arctangent from the trigonometry module: it finds an angle from its sine-like and cosine-like parts and keeps track of which quadrant it is in. One accelerometer snapshot is enough. An average over a few seconds is better, because it beats down the noise.

::: note Why it has to be true
Write the body-axis reading out in full. With roll $\phi$ and pitch $\theta$, the third column of the yaw-pitch-roll rotation (the part that multiplies the "down" component of gravity) is $(-\sin\theta,\ \sin\phi\cos\theta,\ \cos\phi\cos\theta)$, and heading does not appear in it. So

$$
f_x = g\sin\theta, \qquad f_y = -g\sin\phi\cos\theta, \qquad f_z = -g\cos\phi\cos\theta .
$$

Then $-f_y$ and $-f_z$ are $g\cos\theta$ times $\sin\phi$ and $\cos\phi$. As long as the pitch is not straight up or down, $g\cos\theta$ is positive, and $\operatorname{atan2}(-f_y,-f_z) = \phi$. For pitch, $\sqrt{f_y^2+f_z^2} = g\cos\theta$ (because $\sin^2\phi+\cos^2\phi = 1$), and $f_x = g\sin\theta$, so $\operatorname{atan2}(f_x, \sqrt{f_y^2+f_z^2}) = \theta$. The size of $g$ cancels out of both, which is why a slightly wrong gravity value does not spoil the angles.
:::

::: example Recovering roll and pitch, and what limits them
A vehicle sits at $5^\circ$ roll, $-3^\circ$ pitch and a heading of $40^\circ$ that the leveling will not be told. Build the exact accelerometer reading from the geometry, then invert it:

```python
import numpy as np

def dcm_from_rpy(roll, pitch, yaw):
    cr, sr, cp, sp, cy, sy = np.cos(roll), np.sin(roll), np.cos(pitch), np.sin(pitch), np.cos(yaw), np.sin(yaw)
    Rz = np.array([[cy,-sy,0],[sy,cy,0],[0,0,1]])
    Ry = np.array([[cp,0,sp],[0,1,0],[-sp,0,cp]])
    Rx = np.array([[1,0,0],[0,cr,-sr],[0,sr,cr]])
    return Rz @ Ry @ Rx     # C_b^n

g = 9.80665
true_roll, true_pitch, true_yaw = np.radians(5.0), np.radians(-3.0), np.radians(40.0)
C_bn = dcm_from_rpy(true_roll, true_pitch, true_yaw)
f_b = C_bn.T @ np.array([0, 0, -g])
roll_est = np.arctan2(-f_b[1], -f_b[2])
pitch_est = np.arctan2(f_b[0], np.hypot(f_b[1], f_b[2]))
print(np.degrees(roll_est), np.degrees(pitch_est))
# 4.999999999999999 -3.0000000000000004
```

Roll and pitch come back exact (the tiny tails are computer rounding), and the $40^\circ$ heading was never needed: gravity pins down only two of the three angles.

What limits coarse leveling in practice is not the formula. It is the accelerometer. By the **[[bias-tilt equivalence|bias-tilt]]** from the error-model lesson, an accelerometer bias $\delta f$ looks exactly like a real tilt of $\delta f/g$ radians. This module's running accelerometer has a bias instability of $50\,\mu g$, which is $4.90\times10^{-4}\,\mathrm{m/s^2}$. Divide by $g$:

$$
\frac{4.90\times10^{-4}}{9.81} = 5.0\times10^{-5}\ \mathrm{rad},
$$

about $10.3$ arcseconds. That is the best level this accelerometer can give.

Averaging longer helps only for a few seconds. Averaged white noise falls as $1/\sqrt\tau$ (with $\tau$, "tau", the averaging time); the bias does not fall at all. This accelerometer's noise density is $100\,\mu g/\sqrt{\mathrm{Hz}}$, so averaged over $\tau = 1\,\mathrm s$ the noise is $9.81\times10^{-4}\,\mathrm{m/s^2}$ — twice the bias floor. Over $\tau = 10\,\mathrm s$ it is

$$
\frac{9.81\times10^{-4}}{\sqrt{10}} = 3.10\times10^{-4}\ \mathrm{m/s^2},
$$

already below the $4.90\times10^{-4}\,\mathrm{m/s^2}$ bias. The two cross at about $4\,\mathrm s$, the same crossover the random-walk lesson found. After that, more averaging buys almost nothing: this is the Allan-deviation floor, now limiting the level.
:::

## Gyrocompassing: the Earth's spin finds north

Back to the swivel chair. You cannot feel your heading from your weight. But suppose the whole room were slowly turning, like a merry-go-round. If you were sensitive enough, you could feel which way the turning axis tilts relative to you, and that would tell you which way you face. The Earth is that merry-go-round, and a good gyro is sensitive enough.

The Earth turns once per **[[sidereal day|sidereal-day]]** — once relative to the stars — at the **Earth rate**:

::: key Earth rate
$\omega_{ie} = 7.292115\times10^{-5}\,\mathrm{rad/s}$, about $15.041^\circ/\mathrm h$. Any gyro whose bias instability is below this can, in principle, gyrocompass; any gyro whose bias is a large fraction of it cannot find north.
:::

Read $\omega_{ie}$ as "omega sub i-e": the rate of the Earth frame ($e$) relative to inertial space ($i$). In NED at **latitude** $\varphi$ (read "var-phi"; a different letter from roll's $\phi$), the Earth-rate vector is

$$
\boldsymbol\omega_{ie}^n = \omega_{ie}\,(\cos\varphi,\ 0,\ -\sin\varphi).
$$

It has a north part and a vertical part, and no east part. The **[[horizontal part|earth-rate-split]]**, $\omega_{ie}\cos\varphi$, points exactly to true north. So once the system is level, the horizontal Earth rate its gyros sense *is* an arrow pointing north.

### Nulling the east gyro

How do you read that arrow? Suppose the computer's idea of north is off by a small heading error $\psi$ (read "psi"). Then the horizontal Earth rate, seen in the computer's axes, is turned by $\psi$. Part of it lands on the axis the computer thinks is east:

$$
\omega_{\text{east, sensed}} \approx \omega_{ie}\cos\varphi\,\sin\psi \approx \omega_{ie}\cos\varphi\ \psi \quad \text{for small } \psi .
$$

True east should sense no Earth rate at all. So **gyrocompassing** finds heading by turning the computed axes until the apparent east-axis rate is zero. At $28.5^\circ$ latitude, $\omega_{ie}\cos\varphi = 6.408\times10^{-5}\,\mathrm{rad/s}$, which is $13.22^\circ/\mathrm h$. A heading error of $1^\circ$ shows up as an east rate of only about $0.23^\circ/\mathrm h$. That is a tiny signal.

### What limits it

The gyro's own bias $b$ adds a fake rate to that east axis. The filter cannot tell a fake rate from a real one, so it turns the heading until the *total* east reading is zero — which leaves a heading error just big enough to cancel the bias: $\omega_{ie}\cos\varphi\ \psi = b$. So

$$
\psi \approx \frac{b}{\omega_{ie}\cos\varphi}.
$$

::: key Gyrocompassing accuracy
Gyrocompassing finds north from the horizontal component of the sensed Earth rate, $\omega_{ie}\cos\varphi$. The achievable heading accuracy is $\psi\approx b/(\omega_{ie}\cos\varphi)$: gyro bias over the horizontal Earth rate. It degrades as $1/\cos\varphi$ toward the poles, where the horizontal component vanishes, so it is impossible at the poles and needs a low-bias gyro everywhere.
:::

This formula also explains the Earth-rate rule in the key above. If $b$ is bigger than $\omega_{ie}\cos\varphi$, then $\psi$ comes out bigger than one radian: no heading at all. Below that, you get *a* heading, but a useful one needs a bias hundreds of times smaller than Earth rate.

::: example Three gyro grades at one latitude
At Cape Canaveral's latitude, $28.5^\circ$, the horizontal Earth rate is $13.22^\circ/\mathrm h$. Feed in a tactical, a navigation-grade and a strategic-grade gyro bias:

```python
import numpy as np
wie, lat = 7.292115e-5, np.radians(28.5)
horiz = wie*np.cos(lat)
for label, sigma in [("tactical", 3.0), ("navigation", 0.01), ("strategic", 0.001)]:
    b = np.radians(sigma)/3600.0
    psi = b/horiz
    print(f"{label:10s} b={sigma:6.3f} deg/h -> psi={np.degrees(psi):.4f} deg = {np.degrees(psi)*60:.2f} arcmin")
# tactical   b= 3.000 deg/h -> psi=13.0037 deg = 780.22 arcmin
# navigation b= 0.010 deg/h -> psi=0.0433 deg = 2.60 arcmin
# strategic  b= 0.001 deg/h -> psi=0.0043 deg = 0.26 arcmin
```

Check the tactical line by hand. Both rates are in degrees per hour, so the units cancel and the answer is in radians:

$$
\psi \approx \frac{3}{13.22} = 0.227\ \mathrm{rad},
$$

which is $13.0^\circ$. That matches.

What it means:

- The tactical gyro, $3^\circ/\mathrm h$, is below Earth rate, so in principle it can gyrocompass — but only to $13^\circ$. That is worthless. So tactical-grade systems never try. They take heading from a magnetometer, from the direction of travel a satellite receiver measures, or from a known launch direction.
- The navigation-grade gyro, $0.01^\circ/\mathrm h$, reaches $2.6$ arcminutes. That is good enough for most aircraft and ships. Finding its own north is, in practice, the capability that separates **navigation grade** from tactical grade — not only a line on a datasheet.
- The **[[strategic-grade|strategic-grade]]** gyro gets below half an arcminute, the accuracy a submarine's navigator needs, since it may run for weeks with no other heading reference.

Sanity check: a gyro a hundred times better gives a heading a hundred times better. The formula is a straight division, so it should, and the three lines show exactly that.
:::

::: warning Latitude is part of the answer
The same gyro that gyrocompasses to $2.6$ arcminutes at $28.5^\circ$ gives about $26$ arcminutes at $85^\circ$ and over $2^\circ$ at $89^\circ$. A heading-accuracy spec with no latitude attached is incomplete. And near the pole, no gyro, however good, rescues gyrocompassing: the signal itself goes to zero.
:::

## Fine alignment: a Kalman filter on the Schuler loop

After coarse leveling and gyrocompassing, the platform is level and pointing roughly north, with errors somewhere between arcminutes and degrees. **Fine alignment** sharpens that. It uses the physics of the Schuler lesson and the tools of the Kalman filter module together.

The idea: the vehicle is not moving. So any velocity the navigation computer calculates is pure error. And velocity error does not appear from nowhere: a tilt $\varepsilon$ ("epsilon") leaks gravity into the horizontal and makes velocity error grow, and a gyro bias $b$ makes the tilt grow. Watch the fake velocity for a while, and you can work backward to the tilt and the bias that caused it.

A **[[zero-velocity update|zupt-name]]** (ZUPT) feeds the Kalman filter the computed velocity as a measurement of velocity error, $z = \delta v$, because the true velocity is known to be zero. Its assumed noise is small, a few centimeters per second. The filter runs its usual predict-and-update recursion. Because tilt, velocity error and bias are linked by the Schuler dynamics, watching $\delta v$ over time lets it separate all three.

The dynamics are the Schuler lesson's driven loop, for the north-tilt and east-velocity pair:

$$
\dot\varepsilon = b - \frac{\delta v}{R}, \qquad \dot{\delta v} = g\,\varepsilon, \qquad \dot b = 0 .
$$

Read $\dot\varepsilon$ as "epsilon dot", the rate of change of the tilt. $R$ is the Earth's radius of curvature, and the bias is modeled as a constant.

::: example Watching a Kalman filter untangle tilt from bias
Three states, $(\varepsilon, \delta v, b)$. A zero-velocity measurement arrives every $10\,\mathrm s$ with $5\,\mathrm{cm/s}$ assumed noise. The filter starts from a $1^\circ$ tilt uncertainty and a $10^\circ/\mathrm h$ uncertainty in the turn-on gyro bias:

```python
import numpy as np

g, Rn = 9.792092465091237, 6383003.276878938
F = np.array([[0.0, -1.0/Rn, 1.0], [g, 0.0, 0.0], [0.0, 0.0, 0.0]])
H = np.array([[0.0, 1.0, 0.0]])
dt = 10.0
Phi = np.eye(3) + F*dt + 0.5*(F@F)*dt**2 + (F@F@F)*dt**3/6.0
P = np.diag([np.radians(1.0)**2, 1e-6, (np.radians(10.0)/3600.0)**2])
Rmeas = np.array([[0.05**2]])

for n_updates in [1, 6, 30, 60, 150]:
    Pk = P.copy()
    for _ in range(n_updates):
        Pk = Phi @ Pk @ Phi.T
        S = H @ Pk @ H.T + Rmeas
        K = Pk @ H.T @ np.linalg.inv(S)
        Pk = (np.eye(3) - K@H) @ Pk
    s = np.sqrt(np.diag(Pk))
    print(f"t={n_updates*dt:6.0f}s  sigma_tilt={np.degrees(s[0])*3600:8.2f} arcsec  "
          f"sigma_bias={np.degrees(s[2])*3600:7.4f} deg/h")
# t=    10s  sigma_tilt=  116.58 arcsec  sigma_bias= 9.9990 deg/h
# t=    60s  sigma_tilt=   64.11 arcsec  sigma_bias= 1.7656 deg/h
# t=   300s  sigma_tilt=    6.87 arcsec  sigma_bias= 0.0365 deg/h
# t=   600s  sigma_tilt=    2.44 arcsec  sigma_bias= 0.0065 deg/h
# t=  1500s  sigma_tilt=    0.55 arcsec  sigma_bias= 0.0006 deg/h
```

Here `Phi` is the state-transition matrix for one $10\,\mathrm s$ step (a few terms of the matrix exponential), `P` the covariance, `H` picks out $\delta v$, and `K` is the Kalman gain.

Read the output line by line:

- **After one update (10 s)** the tilt uncertainty has already dropped from $1^\circ$ (3600 arcseconds) to about 117 arcseconds. A tilt of $1^\circ$ would build up about $1.7\,\mathrm{m/s}$ of fake velocity in ten seconds, far above the $5\,\mathrm{cm/s}$ noise, so it is seen at once. The bias has barely moved: in ten seconds it has hardly had time to do anything.
- **By 5 minutes** the tilt is down to $6.87$ arcseconds and the bias to $0.0365^\circ/\mathrm h$.
- **By 25 minutes** the tilt is at half an arcsecond, and the bias uncertainty is six ten-thousandths of a degree per hour.

So fine alignment does two jobs at once. It sharpens the attitude, and it measures the gyro bias for free, using nothing but a vehicle sitting still.

Why minutes and not seconds? A bias keeps pushing the tilt in one direction. A tilt on its own only swings back and forth in the Schuler loop. Telling "keeps pushing" apart from "swings" takes time — enough for the loop to move through a good part of its dynamics — and that is set by the same $84.4$-minute Schuler period.
:::

::: warning This toy model is more optimistic than the real problem
The three-state example has no accelerometer bias and no heading error, and that flatters it. In the full stationary problem, two pairs of errors cannot be told apart by any amount of sitting still. A horizontal accelerometer bias looks exactly like a tilt (the bias-tilt equivalence again). And an east gyro bias looks exactly like a heading error (the gyrocompassing equation). So a real alignment levels only to about $\delta f/g$ — about $10$ arcseconds for this module's accelerometer, not the toy's half arcsecond — and finds north only to $b/(\omega_{ie}\cos\varphi)$. Fine alignment reaches those floors smoothly and calibrates what *can* be seen, such as the north gyro bias. It cannot beat them.
:::

::: warning The zero has to be real
The zero-velocity measurement is only true while the vehicle is truly still. A vehicle rocking on its suspension, a ship at a pier heaving in the swell, or an aircraft with engines running all move a little, for real. The filter cannot tell that real motion from velocity error, so feeding it in *spoils* the alignment instead of improving it. Real procedures check the vibration level and stretch the alignment time instead.
:::

## Transfer and in-flight alignment

Not every IMU gets to sit still for twenty minutes.

### Transfer alignment

Think of a smartphone copying the time from a trusted clock. **Transfer alignment** does that with attitude. A second, usually cheaper IMU — in a missile on a wing rail, a pointing sensor, a weapon bay — copies its alignment from an already-aligned master INS elsewhere on the same vehicle. The filter compares what the two units measure (their angular rates, or their velocities) during a short maneuver, and solves for the difference in their orientations. A missile cannot wait for a ZUPT-based fine alignment in flight, so this is how it starts.

The difficulty unique to transfer alignment is that the two units are in different places. A **[[lever arm|lever-arm-transfer]]** $\mathbf r$ — the vector from master to slave — turns the vehicle's rotation into a real velocity difference between them:

$$
\mathbf v_{\text{slave}} = \mathbf v_{\text{master}} + \boldsymbol\omega\times\mathbf r .
$$

Read $\boldsymbol\omega\times\mathbf r$ as "omega cross r". A missile $5\,\mathrm m$ out along the wing, on an aircraft rolling at $30^\circ/\mathrm s$ ($0.524\,\mathrm{rad/s}$), moves at

$$
0.524\times 5 = 2.62\ \mathrm{m/s}
$$

relative to the master. If the filter does not model that, it blames the $2.62\,\mathrm{m/s}$ on misalignment. A second trouble is **flexure**: a wing bends under load, so the angle between master and slave is not truly fixed. The lever-arm compensation developed in this module's last lesson is exactly the correction transfer alignment depends on.

### In-flight alignment

**In-flight alignment** drops the "sitting still" requirement completely. Instead of comparing the computed velocity with zero, it compares it with a velocity and position from a satellite receiver (GNSS). It is the same Kalman filter as fine alignment, with $\delta v$ measured against GNSS instead of against zero. It keeps fine alignment's great strength — using the Schuler dynamics to separate tilt from bias.

It also brings a real limit. Some combinations of errors can only be seen if the vehicle **[[maneuvers|observability-turn]]**. In straight, steady flight, an east-axis tilt and a north accelerometer bias make exactly the same velocity signature — the bias-tilt equivalence once more — and no amount of waiting separates them. A turn or an acceleration changes how the errors reach the measurement, and breaks the tie. That is why aircraft in-flight alignment procedures call for a specific maneuver, an S-turn or a series of banks.

## Check yourself

::: check
Why can coarse leveling recover roll and pitch from a single accelerometer reading but never heading, no matter how good the accelerometer is?
:::

::: answer
Gravity is a vertical vector with no horizontal part. Its direction in body axes says only how the body's own "down" is tipped away from true down, and that tipping is exactly roll and pitch. Heading is a turn about the vertical axis itself. Turning the body about that axis does not change how gravity projects onto the body axes at all. So the accelerometer reading carries no information about heading, and no accelerometer, however precise, can extract some.
:::

::: check
A ship's navigation-grade gyrocompass ($0.01^\circ/\mathrm h$) works well in port at $28.5^\circ$ but is switched off automatically above $85^\circ$ latitude. Explain why, using this lesson's formula.
:::

::: answer
The heading accuracy is $\psi\approx b/(\omega_{ie}\cos\varphi)$. Compare the cosines: $\cos 85^\circ = 0.0872$ and $\cos 28.5^\circ = 0.879$, and

$$
\frac{0.879}{0.0872} \approx 10.1 ,
$$

so the same gyro gives a heading error about ten times worse: roughly $26$ arcminutes instead of $2.6$. Go further toward $\varphi = 90^\circ$ and $\cos\varphi \to 0$, so $\psi \to \infty$. The horizontal Earth rate that gyrocompassing depends on vanishes at the pole, so there is no signal left to null, whatever the gyro quality. A well-designed system refuses to trust a "solution" that is really amplified noise.
:::

::: check
A cheap MEMS gyro has a bias of $20^\circ/\mathrm h$. Can it gyrocompass anywhere on Earth?
:::

::: answer
No. The largest horizontal Earth rate anywhere is at the equator, where $\cos\varphi = 1$ and it equals the full $15.041^\circ/\mathrm h$. A $20^\circ/\mathrm h$ bias is bigger than that, so $b/(\omega_{ie}\cos\varphi)$ is more than one radian even at the equator: the bias swamps the whole signal. This is the Earth-rate rule: a gyro whose bias is not well below $15^\circ/\mathrm h$ cannot find north.
:::

::: check
In the fine-alignment example, the tilt uncertainty falls by a factor of about seventeen (from $117$ to $6.87$ arcseconds) in the first five minutes, but only by about another twelve (to $0.55$ arcseconds) over the next twenty. Why the slowdown?
:::

::: answer
The early updates work against a very poor starting guess (the $1^\circ$ prior). Each zero-velocity update removes a large fraction of a large uncertainty, and the drop looks dramatic. As the filter converges it works against an uncertainty that is already small. Further updates still help — the physics has not changed — but the absolute size of each improvement shrinks with the uncertainty itself. (In a real system the drop would stop entirely at the accelerometer-bias floor of about $10$ arcseconds, as the warning explains.)
:::

::: check
Why is a lever arm a bigger practical problem for transfer alignment than for fine alignment of a single IMU sitting still?
:::

::: answer
Fine alignment of a single IMU has no second sensor location, so there is no lever-arm term at all, and a still vehicle has no rotation to multiply one anyway. Transfer alignment compares two IMUs at two different places on the vehicle. It usually relies on a maneuver, because rotation is what makes the misalignment visible in the first place. That same rotation, through $\boldsymbol\omega\times\mathbf r$, turns the distance between the two units into a real velocity difference — $2.62\,\mathrm{m/s}$ for $5\,\mathrm m$ at $30^\circ/\mathrm s$. Unless that term is modeled and removed, the filter mistakes where the sensors are mounted for how they are misaligned.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat\phi=\operatorname{atan2}(-f_y,-f_z)$, $\hat\theta=\operatorname{atan2}(f_x,\sqrt{f_y^2+f_z^2})$ | Coarse leveling: roll and pitch from specific force alone; heading is invisible to gravity |
| Leveling error $\approx\delta f/g$ | Set by accelerometer bias; averaging past a few seconds barely helps |
| $\omega_{ie} = 7.292115\times10^{-5}\,\mathrm{rad/s} \approx 15.041^\circ/\mathrm h$ | Earth rate; its horizontal part $\omega_{ie}\cos\varphi$ points north |
| $\psi\approx b/(\omega_{ie}\cos\varphi)$ | Gyrocompassing heading accuracy; degrades as $1/\cos\varphi$, fails at the poles |
| ZUPT: $z=\delta v$ with true $v = 0$ | Fine alignment's measurement; the Schuler coupling of $\varepsilon$, $\delta v$ and $b$ lets a Kalman filter separate them |
| $\mathbf v_{\text{slave}} = \mathbf v_{\text{master}} + \boldsymbol\omega\times\mathbf r$ | Transfer alignment from a master INS; needs lever-arm and flexure compensation |
| In-flight alignment | Same filter, GNSS in place of ZUPT; some errors need a maneuver to become observable |

Alignment gets the system started. The next two lessons cover what keeps it accurate afterward: how an INS is fused with GNSS once it is moving, in the architectures this lesson's in-flight case previewed, and the full 15-state and 21-state error-state filter that makes that fusion precise.

::: context strapdown-start Why a strapdown system starts blind
Older inertial navigators kept their sensors on a platform held level and pointed by motorized gimbal rings. Before a flight, the platform itself was physically turned until it was level and aimed north, and the orientation could be read off the rings. A strapdown system has no rings: the sensors are bolted to the vehicle, and the orientation exists only as numbers in the computer. So at power-up those numbers must be built from scratch, and alignment is entirely a computation.
:::

::: context atan2-why Why two arguments and not one
A plain arctangent takes one ratio, $y/x$, and cannot tell $(1, 1)$ from $(-1, -1)$: both give $45^\circ$. The two-argument $\operatorname{atan2}(y, x)$ looks at both signs and returns the right one of the four quadrants, from $-180^\circ$ to $+180^\circ$. For roll that matters: a vehicle lying on its side, or upside down on a test stand, must not be reported as upright. The trigonometry module's atan2 lesson covers the quadrant rules in full.
:::

::: context bias-tilt Why a bias and a tilt look identical
Tilt a perfect accelerometer by a small angle $\varepsilon$ and it picks up a sideways share of gravity, $g\sin\varepsilon \approx g\varepsilon$. Leave it level but give it a bias $\delta f$ and it reads $\delta f$ sideways. If $\delta f = g\varepsilon$, the two readings are the same number, and nothing in a still sensor can separate them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,40)">
    <line x1="0" y1="0" x2="0" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
    <line x1="0" y1="0" x2="20.8" y2="97.8" stroke="#1d6fd1" stroke-width="3"/>
    <polygon points="20.8,97.8 14.2,86.1 24.0,84.0" fill="#1d6fd1"/>
    <path d="M0,40 A40,40 0 0,0 8.3,39.1" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="8" y="58" font-size="12" fill="#1f2a44">ε</text>
    <text x="28" y="110" font-size="12" fill="#1d6fd1">sensor axis</text>
    <text x="-60" y="-12" font-size="12" fill="#1f2a44">tilted by ε: reads g·sin ε</text>
  </g>
  <g transform="translate(270,40)">
    <line x1="0" y1="0" x2="0" y2="100" stroke="#1d6fd1" stroke-width="3"/>
    <polygon points="0,100 -5,88 5,88" fill="#1d6fd1"/>
    <line x1="0" y1="50" x2="21" y2="50" stroke="#b4232c" stroke-width="3"/>
    <polygon points="24,50 14,45 14,55" fill="#b4232c"/>
    <text x="30" y="54" font-size="12" fill="#b4232c">δf</text>
    <text x="-60" y="-12" font-size="12" fill="#1f2a44">level, bias δf: reads δf</text>
  </g>
  <text x="180" y="165" font-size="12" text-anchor="middle" fill="#1f2a44">same reading when δf = g·ε</text>
</svg>
```
:::

::: context sidereal-day Why not 24 hours
The Earth turns once relative to the stars in about $86\,164\,\mathrm s$, not $86\,400$. A solar day is longer because the Earth also moves along its orbit, so it must turn a little extra, about one degree, to bring the Sun back overhead. A gyro measures rotation against inertial space, so it senses the sidereal rate: $2\pi$ radians over $86\,164\,\mathrm s$ gives $7.2921\times10^{-5}\,\mathrm{rad/s}$, the $\omega_{ie}$ of this lesson.
:::

::: context earth-rate-split The spin split into north and up
Stand at latitude $\varphi$. The Earth's spin axis points at the pole star, which sits $\varphi$ above your northern horizon. Split the spin arrow into a flat part along the ground and an upright part. The flat part, $\omega_{ie}\cos\varphi$, points due north; the upright part is $\omega_{ie}\sin\varphi$. At the equator it is all flat; at the pole it is all upright, which is why gyrocompassing fails there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="320" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <text x="320" y="132" font-size="12" text-anchor="end" fill="#1f2a44">north →</text>
  <line x1="120" y1="140" x2="233" y2="140" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="241.2,140 229,134 229,146" fill="#1d6fd1"/>
  <line x1="120" y1="140" x2="241.2" y2="70" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="246.4,67 233.1,68.5 239.1,78.9" fill="#1f2a44"/>
  <line x1="241.2" y1="70" x2="241.2" y2="140" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <path d="M160,140 A40,40 0 0,0 154.6,120" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="166" y="132" font-size="12" fill="#1f2a44">φ</text>
  <text x="150" y="86" font-size="12" fill="#1f2a44">spin axis ω_ie</text>
  <text x="248" y="108" font-size="12" fill="#b4232c">ω_ie sin φ (up)</text>
  <text x="120" y="162" font-size="12" fill="#1d6fd1">ω_ie cos φ (north)</text>
</svg>
```
:::

::: context strategic-grade What "strategic grade" means
Gyro grades are rough bands of bias: about $100^\circ/\mathrm h$ for consumer parts, $1^\circ/\mathrm h$ tactical, $0.01^\circ/\mathrm h$ navigation, $0.001^\circ/\mathrm h$ and better strategic. The name comes from the systems that need the best: ballistic-missile submarines and long-range strategic weapons, which must know their heading precisely after days or weeks with no outside help.
:::

::: context zupt-name Where the ZUPT comes back
The zero-velocity update is not only for start-up. Anything that stops often — a car at traffic lights, a walker's boot at each step, a ship alongside a pier — can apply it again every time it stands still. The last lesson of this module picks it up there, and shows how much a few short stops during a mission hold down the error growth between them.
:::

::: context lever-arm-transfer A rolling wing carries its tip along
When an aircraft rolls, the fuselage turns in place, but the wingtip travels in a circle around it. Its speed is the roll rate times the distance out: $\boldsymbol\omega\times\mathbf r$. The master INS in the fuselage and the slave IMU on the wing therefore disagree about velocity even when both are perfect.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="320" y2="80" stroke="#1f2a44" stroke-width="4"/>
  <circle cx="180" cy="80" r="18" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="172" y="72" width="16" height="16" fill="#1d6fd1"/>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">master INS</text>
  <rect x="282" y="66" width="18" height="14" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="291" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">slave IMU</text>
  <line x1="180" y1="96" x2="291" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="236" y="92" font-size="12" text-anchor="middle" fill="#6c7a93">r = 5 m</text>
  <line x1="291" y1="62" x2="291" y2="24" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="291,18 285,30 297,30" fill="#b4232c"/>
  <text x="300" y="34" font-size="12" fill="#b4232c">ω × r</text>
  <path d="M160,52 A30,30 0 0,1 200,52" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="204,56 196,48 202,46" fill="#1f2a44"/>
  <text x="180" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">roll ω</text>
</svg>
```
:::

::: context observability-turn Why a turn breaks the tie
In straight flight, a north accelerometer bias and an east-axis tilt both push the same fake acceleration into the same north channel, forever, so the filter sees one number made of two unknowns. Turn the aircraft $90^\circ$ and the accelerometer, fixed to the body, now points east: its bias moves to the east channel, while the tilt, fixed to the local level frame, keeps acting on north. The two now leave different fingerprints, and the filter can solve for each. This is **observability**: whether the measurements, over time, contain enough to pin down every state.
:::
