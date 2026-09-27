---
id: l13-lever-arm-zupt-vibration-rectification
title: Lever arm compensation, zero-velocity updates, and vibration rectification
minutes: 26
covers:
  - "Lever arm compensation, zero-velocity updates, vibration rectification"
---

Stand in the middle of a spinning merry-go-round, and you barely move. Your friend on the outer edge whips around fast. You are both on the same ride, turning at the same rate, yet your speeds are completely different. Where you stand on a turning thing decides how fast you go.

Now think of waiting at a red light. For those few seconds you know one thing for certain: the car is not moving. And think of a washing machine on its spin cycle, shaking so hard it walks across the floor, although every single shake goes back and forth.

Those three everyday facts are this lesson. They close three gaps that a correct navigator cannot skip. Where exactly on the vehicle is "the position"? How do you use every moment the vehicle stands still, not only the first one? And how does a shake that averages to zero still leave a steady error behind? That last one is the error-model lesson's promised $g^2$ term, the vibration error a quiet bench test never sees.

## Lever arm compensation

An IMU and the sensor that aids it are almost never in the same place. The GNSS antenna sits on the roof or the nose; the IMU sits in an equipment bay. The arrow from the IMU to the antenna is the **lever arm**, written $\mathbf r$ and measured in body axes.

The vehicle is a **[[rigid body|rigid-body]]**: all its parts turn together, at one rate. But, as on the merry-go-round, points away from the center of turning move at different speeds. A point at offset $\mathbf r$ from the IMU picks up an extra velocity $\boldsymbol\omega\times\mathbf r$, where $\boldsymbol\omega$ is the body's turn rate. The cross product gives the right direction — at right angles to both the axis and the arm — and the right size, rate times the arm's length across the axis. In the navigation frame,

$$
\mathbf v_{\text{antenna}} = \mathbf v_{\text{IMU}} + \mathbf C_b^n\big(\boldsymbol\omega_{ib}^b\times\mathbf r\big).
$$

Read $\boldsymbol\omega_{ib}^b$ as "omega i b in b": the body's rate against inertial space, as the gyros measure it, in body axes. The matrix $\mathbf C_b^n$ turns the result from body axes into north-east-down. (Strictly, the Earth's own turning should be taken out of $\boldsymbol\omega_{ib}^b$ here; over a lever arm of a few metres it changes the answer by well under a millimetre per second.)

Position has a lever arm too, and it needs no turning at all: $\mathbf p_{\text{antenna}}=\mathbf p_{\text{IMU}}+\mathbf C_b^n\mathbf r$. The GNSS receiver really measures the antenna's **[[phase center|phase-center]]**, not the IMU. Leave that out and every fix is off by the length of the arm.

::: key Lever arm compensation
An aiding sensor displaced from the IMU by $\mathbf r$ measures $\mathbf v_{\text{sensor}}=\mathbf v_{\text{imu}}+\boldsymbol\omega\times\mathbf r$. Omitting the term injects an error proportional to angular rate — significant on a rotating or tumbling vehicle.
:::

Feed the antenna's velocity into a filter that thinks it is measuring the IMU's own velocity, and the filter reads the turn as a navigation error. It then "corrects" tilt and biases that were fine. The IMU did nothing wrong; the geometry fooled the filter.

::: example What an uncompensated lever arm costs in a turn
A GNSS antenna sits $2\,\mathrm m$ forward of the IMU and $0.5\,\mathrm m$ above it. The vehicle yaws at $30^\circ/\mathrm s$ — an ordinary turn, nothing extreme.

```python
import numpy as np

r = np.array([2.0, 0.0, -0.5])            # m, IMU to antenna (2 m forward, 0.5 m up)
omega = np.array([0.0, 0.0, np.radians(30.0)])   # rad/s, yaw only
v_err = np.cross(omega, r)
print(v_err, np.linalg.norm(v_err))
# [-0.          1.04719755  0.        ] 1.0471975511965976
```

Step by step. The body axes are forward, right, down, so "up" is $-0.5$ in the third place. The rate is $30^\circ/\mathrm s=0.5236\,\mathrm{rad/s}$ about the down axis. The cross product keeps only the part of $\mathbf r$ across the axis, the $2\,\mathrm m$ forward part, and gives $0.5236\times2=1.047\,\mathrm{m/s}$, pointing sideways. The $0.5\,\mathrm m$ up part lies along the yaw axis, so it adds nothing.

So a gentle turn creates about $1.05\,\mathrm{m/s}$ of false velocity from geometry alone. For comparison, the Schuler loop holds the velocity error from this module's $50\,\mu g$ accelerometer bias to at most about $0.39\,\mathrm{m/s}$. The lever arm is more than twice as big, and it has nothing to do with sensor quality.

It also has a telltale shape. It appears the moment the turn starts and vanishes when it stops, instead of growing steadily. A velocity residual that follows the turn rate is a lever arm, not a sensor.
:::

The fix is the equation itself, used as a correction. Measure $\mathbf r$ once, on the ground. Then, every cycle, subtract $\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ from the GNSS velocity before it reaches the filter — or, the same thing, add it to the IMU velocity the filter compares against. Everything this needs, $\boldsymbol\omega_{ib}^b$ and $\mathbf C_b^n$, already flows through the mechanization. The only new number is $\mathbf r$.

::: warning Measure the arm carefully
An error in $\mathbf r$ comes straight back as an error in velocity. Get the $2\,\mathrm m$ arm wrong by $5\,\mathrm{cm}$, and the same $30^\circ/\mathrm s$ turn leaves $0.5236\times0.05=0.026\,\mathrm{m/s}$ of false velocity — small, but it switches on in every turn. Measure the arm from the IMU's own reference mark to the antenna's phase center, in the IMU's axes, and write down which way each axis points. Arms measured in the vehicle's axes and applied in the IMU's are a common slip.
:::

## Zero-velocity updates, at every stop

The alignment lesson used a **zero-velocity update**, or **ZUPT**, once, before the mission started: while the vehicle sits still, its true velocity is zero, so any velocity the navigator computes is pure error. Nothing about that is special to start-up. A car stops at traffic lights. A robot stands between steps. A ship lies alongside a pier. And **[[a walker's foot|foot-mounted]]** is flat on the ground for a moment in every single step. Each stop is a free measurement.

The measurement is as plain as it gets. True velocity is zero, so the computed velocity is the error:

$$
\mathbf z=\hat{\mathbf v}-\mathbf 0=\delta\mathbf v+\boldsymbol\nu,\qquad \mathbf H=\begin{pmatrix}\mathbf 0 & \mathbf I & \mathbf 0 & \mathbf 0 & \mathbf 0\end{pmatrix}
$$

in the fifteen-state filter of the last lesson, where $\boldsymbol\nu$ is a small noise allowing for the vehicle not being perfectly still.

::: key Zero-velocity update (ZUPT)
When the vehicle is known to be stationary, inject a pseudo-measurement $\mathbf v=\mathbf 0$. It observes the tilt and accelerometer biases very effectively and is the cheapest accuracy improvement in pedestrian and ground-vehicle navigation.
:::

What a stop can see, and what it cannot:

- **Velocity error**, directly.
- **Tilt and horizontal accelerometer bias.** At rest, a tilt leaks $g$ into horizontal velocity and a horizontal accelerometer bias adds straight in, so a single stop sees their sum. That sum is exactly what makes velocity drift, so fixing it is what matters most. The two come apart when the vehicle turns between stops: the bias turns with the body, but the tilt stays put in the navigation frame.
- **Vertical accelerometer bias**, directly: at rest the vertical channel should show no acceleration at all.
- **Gyro bias** about the horizontal axes, through the way it makes the tilt keep growing — the alignment lesson's trick.
- **Not [[heading|heading]]**, or only very weakly. Turning the vehicle about the vertical changes nothing about a velocity of zero.

::: example A ground vehicle that stops twice
Start from the alignment lesson's five-minute stationary session: tilt uncertainty $6.87$ arcseconds, gyro bias uncertainty $0.0365^\circ/\mathrm h$. The vehicle then drives for two minutes with no aiding, and stops again for one more minute. Compare it with a vehicle that drives the same three minutes and never stops. The model is the alignment lesson's three states — tilt, velocity error, gyro bias — with one measurement every $10\,\mathrm s$.

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
P_never_stops = coast(P1, 18)        # same 3 extra minutes, never stops again

for label, P in [("after 5 min ZUPT", P1), ("after 2 min driving", P2),
                 ("after 1 more min ZUPT", P3), ("if it never stopped again", P_never_stops)]:
    print(f"{label:26s} sigma_tilt={np.degrees(np.sqrt(P[0,0]))*3600:6.2f} arcsec"
          f"  sigma_b={np.degrees(np.sqrt(P[2,2]))*3600:.4f} deg/h")
# after 5 min ZUPT           sigma_tilt=  6.87 arcsec  sigma_b=0.0365 deg/h
# after 2 min driving        sigma_tilt= 11.05 arcsec  sigma_b=0.0365 deg/h
# after 1 more min ZUPT      sigma_tilt=  3.59 arcsec  sigma_b=0.0117 deg/h
# if it never stopped again  sigma_tilt= 13.06 arcsec  sigma_b=0.0365 deg/h
```

Step by step. `zupt` runs predict then update, once per $10\,\mathrm s$. `coast` runs predict only: while driving there is no measurement, so the uncertainty can only grow. The tilt uncertainty rises from $6.87$ to $11.05$ arcseconds during the drive, as the uncertain gyro bias keeps tilting the frame.

At the same eight-minute mark, the vehicle that stopped a second time has a tilt uncertainty of $3.59$ arcseconds. The one that kept driving has $13.06$ — about $3.6$ times worse. And the second stop did more than undo the drive: it also cut the gyro bias uncertainty to about a third, $0.0117^\circ/\mathrm h$, because a second look, minutes after the first, shows how much the tilt grew in between.

Sanity check on fairness: the stopping vehicle got six minutes of ZUPT in all, the other five. One extra minute, taken late, bought a factor of $3.6$. That is why real ground-vehicle and pedestrian navigators take every stop they are offered.
:::

::: warning A ZUPT is only as good as its zero
The alignment lesson flagged rocking, swell and engine vibration. Using ZUPTs during a mission adds one more trap: applying the update while the vehicle is still slowing down. The filter cannot tell a real $0.2\,\mathrm{m/s}$ crawl from a velocity error, so it "corrects" tilt and bias to explain it — and makes them worse. Every real **[[stop detector|stop-detection]]** uses a threshold on measured motion and a short confirmation window before it trusts a stop.
:::

## Vibration rectification: the $g^2$ term

Here is the washing machine. Take any number that swings back and forth, plus and minus, so that it averages to zero. Now square it. A square is never negative, so the squared swing cannot average to zero. It averages to something positive. Any sensor error that depends on the *square* of the input therefore turns a shake into a steady offset. That is **rectification** — turning back-and-forth into one-way.

The error-model lesson wrote the accelerometer model with terms in $f$ and set one aside: "a second-order term, proportional to $f^2$, called anisoelastic or $g^2$ sensitivity." Here it is. An accelerometer with **[[anisoelastic|anisoelastic]]** sensitivity $K$ adds an error

$$
\delta f = K f^2 .
$$

$K$ is quoted in $\mu g/g^2$: micro-$g$ of error per $g$ of input, squared. Now shake the axis with vibration $f(t)=f_0\cos\omega t$, where $f_0$ is the vibration amplitude and $\omega$ its frequency. Square it and use the double-angle identity $\cos^2 x=\tfrac12(1+\cos2x)$:

$$
\delta f(t) = K f_0^2\cos^2\omega t = \frac{Kf_0^2}{2}\big(1+\cos2\omega t\big).
$$

The error splits into two parts. The part with $\cos2\omega t$ swings at twice the vibration frequency and averages to zero over any interval the mechanization integrates across, like the random-walk lesson's white noise. The constant part, $Kf_0^2/2$, does not average away. It is a genuine bias. It is there as long as the vibration lasts and gone the instant it stops — the same signature the error-model lesson found for scale-factor asymmetry, now from **[[squaring|cos-squared]]** instead of from unequal slopes.

There is a tidy way to say it. The **root-mean-square** (rms) size of a sine wave is $f_0/\sqrt2$, so $f_0^2/2$ is just $f_{\text{rms}}^2$, and the rectified bias is $K f_{\text{rms}}^2$. That is why MEMS datasheets quote this error as a "vibration rectification error" in $\mu g/g_{\text{rms}}^2$.

::: example How much vibration it takes to rival the sensor's own bias
Take a typical anisoelastic coefficient $K=20\,\mu g/g^2$ and this module's running accelerometer, with bias instability $50\,\mu g$.

```python
K = 20e-6   # g per g^2
for f0 in [0.5, 1.0, 2.0]:
    rectified = K * f0**2 / 2
    print(f"{f0} g vibration -> {rectified*1e6:.2f} micro-g rectified bias")
# 0.5 g vibration -> 2.50 micro-g rectified bias
# 1.0 g vibration -> 10.00 micro-g rectified bias
# 2.0 g vibration -> 40.00 micro-g rectified bias
```

For $f_0=2$: $K f_0^2/2=20\times4/2=40\,\mu g$.

Half a $g$ of vibration, mild by launch-vehicle standards, rectifies to $2.5\,\mu g$, a small slice of the bias budget. Two $g$ — an ordinary level near a running engine — rectifies to $40\,\mu g$. That is $80\%$ of the whole $50\,\mu g$ bias instability this module has quoted since the random-walk lesson, created not by any fault in the sensor but by the place it is bolted.

Because the bias goes as the *square* of the amplitude, halving the vibration — a better **[[isolator|isolator]]**, a stiffer mount — cuts it by four. The coning lesson found the same square law for cone angle, for the same reason: an oscillation that averages to zero in the raw signal stops averaging to zero once it passes through a squaring effect.
:::

::: note Why the square always leaves an average behind
Average $\cos^2\omega t$ over one period $P=2\pi/\omega$. The identity gives $\tfrac12+\tfrac12\cos2\omega t$. The first half is constant, so its average is $\tfrac12$. The second half goes through exactly two full cycles in one period, with as much above zero as below, so its average is $0$. The total average is therefore $\tfrac12$. The same holds for any shape of vibration: the average of $f^2$ is the mean square, which is zero only if $f$ is zero all the time. So any real vibration, of any shape, rectifies through a squared term.
:::

::: key Vibration rectification, the family
Coning: two-axis angular vibration rectifies into a systematic attitude drift, growing as the square of the cone angle. Sculling: correlated angular and linear vibration rectifies into a systematic velocity error, growing as the product of the two amplitudes. Scale-factor asymmetry: vibration along one axis rectifies into a bias through $|f|$, growing in proportion to the amplitude. $g^2$ (anisoelastic) sensitivity: vibration along one axis rectifies into a bias $Kf_0^2/2$, growing as the amplitude squared. All four are invisible at rest, which is why a **[[vibration test|shaker-table]]**, not a static bench test, is what a navigation-grade IMU's qualification has to include.
:::

## Check yourself

::: check
A lever arm correction uses the vehicle's *current* turn rate. Why can it not be calibrated once and stored as a constant offset, the way a sensor bias can?
:::

::: answer
The error $\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ is proportional to the turn rate right now, and the turn rate keeps changing. It is zero in straight flight and over a metre per second in a moderate turn, as the worked example showed. Its direction also changes as $\mathbf C_b^n$ changes. A fixed offset tuned at one turn rate would be wrong at every other rate, including zero. So the term is recomputed every cycle from the current $\boldsymbol\omega_{ib}^b$ and $\mathbf C_b^n$, which the mechanization already has. Only $\mathbf r$ is a constant.
:::

::: check
In the two-stop example, the gyro bias uncertainty $\sigma_b$ does not change during the two minutes of driving. Why not, when the real bias may be wandering?
:::

::: answer
With no ZUPT while driving, the filter only predicts: $\mathbf P\leftarrow\boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T}$. In this model the bias has no noise of its own, and its row of $\boldsymbol\Phi$ is $(0,0,1)$: the bias is carried forward unchanged, and nothing feeds any other state back into it. So its variance cannot grow. It could only shrink through a measurement, and there was none. A fuller model would give the bias its own Gauss-Markov noise from the random-walk lesson, and then $\sigma_b$ would creep up between stops — but far more slowly than a ZUPT brings it down, which is why stopping to look again is worth it.
:::

::: check
Why does halving the vibration amplitude cut the $g^2$-rectified bias by a factor of four, not two?
:::

::: answer
The rectified bias is $Kf_0^2/2$, proportional to the *square* of the amplitude $f_0$. Halving $f_0$ multiplies the bias by $(1/2)^2=1/4$. This is the same as the coning lesson's finding that coning drift goes as the square of the cone angle. Any squared (even) error term turns a zero-average shake into a bias that grows as the square of the shake's size, whatever the physical cause.
:::

::: check
A walker wears an IMU on the shoe and uses a ZUPT at every step. After ten minutes the track has the right shape and the right distance, but the whole path is slowly rotated away from the true one. Which error did the ZUPTs fail to control, and why?
:::

::: answer
Heading, driven by the vertical gyro's bias. Each ZUPT says "velocity is zero", and a velocity of zero looks the same whichever way the foot points. So the ZUPTs keep velocity, tilt and the accelerometer biases in check — which is why the distance and shape are right — but give almost no information about rotation about the vertical. A small uncorrected yaw drift turns the whole track slowly, like a compass that creeps. Foot-mounted systems add a magnetometer, map matching or occasional GNSS to fix heading.
:::

::: check
A flight-test engineer sees a velocity residual that appears only during turns and vanishes in straight flight. Separately, the position drifts steadily whether the aircraft turns or not. Which mechanism explains each, and how could you tell them apart from the data alone?
:::

::: answer
The turn-only residual is a lever arm. It is proportional to turn rate, so it appears exactly when the aircraft turns and disappears exactly when it stops, no matter how long the flight has lasted. The steady drift is ordinary uncorrected bias, growing by the free-inertial lesson's time laws whether the aircraft turns or not. To tell them apart, plot each residual twice: once against the turn rate $\boldsymbol\omega_{ib}^b$, and once against time $t$. The lever arm lines up with turn rate; the bias drift lines up with time.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf v_{\text{antenna}}=\mathbf v_{\text{IMU}}+\mathbf C_b^n(\boldsymbol\omega_{ib}^b\times\mathbf r)$ | Velocity lever arm; the error scales with turn rate, not with time |
| $\mathbf p_{\text{antenna}}=\mathbf p_{\text{IMU}}+\mathbf C_b^n\mathbf r$ | Position lever arm; a fixed offset rotated with the body |
| ZUPT: $\mathbf z=\hat{\mathbf v}=\delta\mathbf v$ when stationary | A free measurement at every stop; sees velocity, tilt and accelerometer bias, not heading |
| $\delta f=Kf^2$, rectified bias $Kf_0^2/2=Kf_{\text{rms}}^2$ | Anisoelastic ($g^2$) sensitivity; invisible at rest, grows as amplitude squared |
| Coning, sculling, scale-factor asymmetry, $g^2$ sensitivity | The four vibration-rectification mechanisms; all invisible in a static test |

This closes the module. You have gone from what an accelerometer and a gyro physically sense, through their error models and noise, a full strapdown mechanization with coning and sculling, the Schuler oscillation and the free-inertial error budget, alignment, INS/GNSS fusion and the error-state filter, to the practical corrections of this lesson. The whole chain from six raw numbers to a trusted position is now built. The next module opens up the other half of that fusion, **[[the GNSS receiver|gnss-next]]** itself.

::: context rigid-body Same turn, different speeds
On a rigid body every point turns at the same rate, but a point's speed grows with its distance from the axis: speed equals turn rate times distance. On a record turning at $0.5\,\mathrm{rad/s}$, a point $2\,\mathrm m$ out would move at $1\,\mathrm{m/s}$, and a point $1\,\mathrm m$ out at half that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="95" r="80" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="120" cy="95" r="4" fill="#1f2a44"/>
  <line x1="120" y1="95" x2="200" y2="95" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="160" cy="95" r="4" fill="#1d6fd1"/>
  <circle cx="200" cy="95" r="4" fill="#b4232c"/>
  <line x1="160" y1="95" x2="160" y2="70" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="160,62 155,72 165,72" fill="#1d6fd1"/>
  <line x1="200" y1="95" x2="200" y2="45" stroke="#b4232c" stroke-width="3"/>
  <polygon points="200,37 195,47 205,47" fill="#b4232c"/>
  <path d="M60,40 A80,80 0 0 1 100,17" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="104,16 94,12 96,23" fill="#1f2a44"/>
  <text x="120" y="118" font-size="12" fill="#1f2a44" text-anchor="middle">IMU</text>
  <text x="222" y="60" font-size="12" fill="#b4232c">antenna: 2 m out,</text>
  <text x="222" y="75" font-size="12" fill="#b4232c">twice as fast</text>
  <text x="222" y="110" font-size="12" fill="#1d6fd1">1 m out</text>
</svg>
```

The arrows point along the direction of travel, at right angles to the arm — the direction $\boldsymbol\omega\times\mathbf r$ gives.
:::

::: context phase-center Where an antenna "is"
A GNSS antenna is a flat patch or a small dome, several centimetres across. The point whose position the receiver actually computes is the antenna's electrical **phase center**, which sits somewhere inside it and shifts slightly with the direction of each satellite. Survey-grade antennas come with calibration tables for this shift. For a vehicle navigator, the phase center printed on the antenna's drawing is the end point of the lever arm.
:::

::: context foot-mounted One stop per step
When you walk, each foot spends part of every step flat on the ground, not moving at all, for a few tenths of a second. An IMU strapped to a shoe can apply a ZUPT in every one of those moments, a few hundred times a minute. Between them the IMU coasts for well under a second, far too short for errors to grow much. This is why a shoe-mounted IMU can track a walker through a building with no GNSS at all, with errors often under a few percent of the distance walked — first shown convincingly by Eric Foxlin in 2005 for firefighter tracking.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="260" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <path d="M60,60 Q80,25 100,60 M140,60 Q160,25 180,60 M220,60 Q240,25 260,60 M300,60 Q320,25 340,60" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="40" y="95" font-size="12" fill="#1d6fd1" text-anchor="middle">foot flat</text>
  <text x="120" y="95" font-size="12" fill="#1d6fd1" text-anchor="middle">ZUPT</text>
  <text x="80" y="22" font-size="12" fill="#b4232c" text-anchor="middle">swing</text>
  <text x="180" y="105" font-size="11" fill="#6c7a93" text-anchor="middle">time</text>
</svg>
```
:::

::: context heading Why a stop cannot find north
A velocity of zero is zero whichever way the vehicle faces, so a ZUPT holds no heading information at all on its own. The only heading clue at rest is the Earth's rotation, which the alignment lesson used for gyrocompassing — and that needs a gyro good enough to sense $15^\circ/\mathrm h$ clearly. With a low-cost MEMS gyro, heading slowly drifts no matter how many stops you make, which is why phones and shoe-mounted trackers lean on magnetometers, maps or GNSS for direction.
:::

::: context stop-detection Deciding that the vehicle has stopped
A stop detector watches the raw IMU. When the vehicle is truly still, the accelerometers read only gravity — the size of the specific force stays close to $g$ — and the gyros read almost nothing. A typical detector requires both to stay inside small thresholds for a short window, say a tenth of a second for a foot or a second or two for a car, before it declares a stop. Cars can also use wheel-speed sensors. Too loose, and it feeds the filter false zeros; too strict, and it throws away good stops.
:::

::: context anisoelastic Not equally springy
The word comes from Greek roots: *an-* "not", *iso-* "equal", and "elastic". A proof mass on its flexures is anisoelastic when it gives way more easily in one direction than another. Push it at an angle and it moves off to one side, by an amount that depends on the product of the push's two components. For vibration along one line that product is a square, so the error goes as $f^2$. Gyros with spinning or vibrating parts show the same effect as a drift proportional to $g^2$.
:::

::: context cos-squared A square never goes negative
The blue curve swings evenly above and below zero, so it averages to zero. Square it (red) and every part is above zero, averaging to one half of the peak squared.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20,30 40,34 60,45 80,62 100,80 120,98 140,115 160,126 180,130 200,126 220,115 240,98 260,80 280,62 300,45 320,34 340,30"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="20,30 40,33 60,40 80,51 100,65 120,80 140,94 160,105 180,112 200,115 220,112 240,105 260,94 280,80 300,65 320,51 340,30" transform="translate(0,0)"/>
  <line x1="20" y1="55" x2="340" y2="55" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="344" y="84" font-size="11" fill="#6c7a93">0</text>
  <text x="200" y="50" font-size="12" fill="#b4232c">average of the square = 1/2</text>
  <text x="180" y="148" font-size="12" fill="#1d6fd1" text-anchor="middle">cos: average 0</text>
</svg>
```
:::

::: context isolator Rubber between the IMU and the rocket
An **isolator** is a soft mount — rubber pads or coils of steel wire rope — between the IMU and the structure. It lets the vehicle shake while the IMU moves much less, above the mount's own resonant frequency. It has costs. Near that resonance it amplifies vibration instead of reducing it. And a soft mount lets the IMU tilt slightly relative to the vehicle, which changes the lever arm and can create coning motion. Designers tune the resonance to sit away from the vehicle's strongest vibration.
:::

::: context shaker-table The shaker table
In a vibration test the IMU is bolted to an electrodynamic **shaker**, a giant loudspeaker coil that drives a metal table. The table follows a random-vibration profile copied from the real vehicle's measured environment, often several $g$ rms across hundreds or thousands of hertz. Engineers record the IMU's output during shaking and compare its average with the average at rest. The difference is the rectified error — exactly the thing a static bench test cannot see.
:::

::: context gnss-next Where this goes next
This module treated GNSS as a box that hands over position, velocity or pseudoranges. The GNSS module opens the box: how a satellite's signal carries its clock and orbit, how a receiver measures the signal's travel time, and where its errors come from — the ionosphere, the clocks, reflections. With both halves, you can design the whole INS/GNSS navigator yourself.
:::
