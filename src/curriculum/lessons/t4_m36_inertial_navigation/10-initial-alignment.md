---
id: l10-initial-alignment
title: Initial alignment
minutes: 22
covers:
  - "Initial alignment: coarse leveling, gyrocompassing, fine alignment via Kalman filter, transfer and in-flight alignment"
---

Every mechanization equation this module has built assumes the loop already has somewhere to start: an initial $\mathbf C_b^n$, an initial velocity, an initial position. None of that arrives for free. A strapdown system knows none of its own orientation at power-up — unlike a gimbaled platform, there is no mechanical gyroscope holding a reference the electronics can simply read off — and the entire attitude, from level to heading, has to be built from the same six numbers this module opened with: three accelerometer readings and three gyro readings, taken while the vehicle does whatever it is doing at the moment it is told to start navigating.

This lesson works through how that happens, in the order accuracy demands it: **coarse leveling** finds roll and pitch directly from gravity in a few seconds; **gyrocompassing** finds heading from the Earth's own rotation, at a cost in time and latitude this lesson prices exactly; **fine alignment** refines both with a Kalman filter built on the same Schuler-loop dynamics the last two lessons derived; and **transfer** and **in-flight alignment** cover the cases where the vehicle cannot simply sit still and wait.

## Coarse leveling: gravity finds the horizon

At rest, the accelerometer triad reads specific force $\mathbf f^b=-\mathbf C_n^b\mathbf g^n$ — the first lesson of this module's equation, evaluated with $\mathbf a=0$. In NED, $\mathbf g^n=(0,0,g)$, so the body-axis reading depends only on roll and pitch, not heading, because gravity has no horizontal direction to reveal one. Inverting the standard $3$-$2$-$1$ rotation for the two angles gravity can see,

$$
\hat\phi_{\text{roll}} = \operatorname{atan2}(-f_y,\,-f_z), \qquad \hat\theta_{\text{pitch}} = \operatorname{atan2}\!\left(f_x,\ \sqrt{f_y^2+f_z^2}\right),
$$

recovers both from a single accelerometer snapshot, or better, from an average over several seconds to beat down noise.

::: example Recovering roll and pitch, and what limits them

A vehicle sits at $5^\circ$ roll, $-3^\circ$ pitch, unknown heading. Building $\mathbf f^b$ from the exact geometry and inverting:

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

Roll and pitch come back exact, and the recovery needs no knowledge of heading at all — a direct confirmation that gravity alone constrains only two of the three attitude angles. What limits coarse leveling in practice is not the formula but the accelerometer: an accelerometer bias $\delta f$ is, by the bias-tilt equivalence the error-model lesson established, indistinguishable from a real tilt of $\delta f/g$. This module's running accelerometer, bias instability $50\,\mu g$, limits a single-snapshot level to $50\times10^{-6}\,\mathrm{rad}=10.3$ arcseconds — and averaging longer barely helps past the first few seconds, because averaged white noise falls as $1/\sqrt\tau$ while the bias instability floor does not: at $\tau=1\,\mathrm s$ the averaged noise is $9.8\times10^{-4}\,\mathrm{m/s^2}$, four times the bias floor, but by $\tau=10\,\mathrm s$ it has already fallen to $3.1\times10^{-4}\,\mathrm{m/s^2}$, below the $4.9\times10^{-4}\,\mathrm{m/s^2}$ bias instability — the same Allan-deviation floor the module's fourth lesson characterized, now setting a practical limit on how well gravity alone can level a platform.
:::

## Gyrocompassing: Earth rate finds north

Heading is different in kind, because gravity has no opinion about it — the only physical signal that distinguishes north from any other horizontal direction is the Earth's own rotation, exactly the vector this module's first lesson introduced: $\boldsymbol\omega_{ie}^n=\omega_{ie}(\cos\varphi,\,0,\,-\sin\varphi)$, whose horizontal component points true north by construction and has magnitude $\omega_{ie}\cos\varphi$. Once level, a gyro triad senses this vector in body axes, and any heading error $\psi$ between the computed and true north rotates the sensed horizontal component, producing a spurious east-axis reading of approximately $\omega_{ie}\cos\varphi\cdot\sin\psi\approx\omega_{ie}\cos\varphi\cdot\psi$ for small $\psi$. **Gyrocompassing** finds heading by driving this spurious component to zero — nulling the apparent east-axis rate — and the residual heading uncertainty once that null is as good as the gyro allows is set by comparing the gyro's own bias to the signal being nulled:

$$
\psi \approx \frac{b}{\omega_{ie}\cos\varphi}.
$$

::: key Gyrocompassing accuracy
$\psi\approx b/(\omega_{ie}\cos\varphi)$: the achievable heading accuracy is the gyro bias divided by the horizontal component of Earth rate. It degrades as $1/\cos\varphi$ toward the poles, where the horizontal component vanishes and no amount of gyro quality recovers a heading from Earth rate alone.
:::

::: example Three grades, one latitude, one enormous spread

At $28.5^\circ$, $\omega_{ie}\cos\varphi=6.408\times10^{-5}\,\mathrm{rad/s}=13.22^\circ/\mathrm h$.

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

This module's running tactical gyro, $3^\circ/\mathrm h$, gyrocompasses to only $13^\circ$ of heading — worthless, which is exactly why tactical-grade systems never attempt it and instead take heading from a magnetometer, a GNSS course-over-ground solution, or a known launch azimuth. A navigation-grade gyro at $0.01^\circ/\mathrm h$ reaches $2.6$ arcminutes, good enough for most aircraft and marine navigation, and this is precisely the capability that separates "navigation grade" from "tactical grade" as a practical matter, not just a datasheet distinction. A strategic-grade submarine gyro pushes below half an arcminute — the accuracy a submarine's inertial navigator actually needs, since it may run for weeks with no other heading reference at all.
:::

## Fine alignment: a Kalman filter on the Schuler loop

Coarse leveling and gyrocompassing hand off a level, roughly-north-pointing platform with error still at the arcminute-to-degree level. **Fine alignment** refines it, and it does so with exactly the physics the Schuler lesson derived: while the vehicle sits still, true velocity is known to be zero, so every velocity the mechanization computes is pure error, $\delta v$, and $\delta v$ is coupled to the tilt error $\varepsilon$ and the gyro bias $b$ by the same equations that produced the $84.4$-minute oscillation. A **zero-velocity update** — feeding the Kalman filter module's own predict-and-update recursion a measurement $z=\delta v$ with small assumed noise — observes that coupling directly, and because $\varepsilon$, $\delta v$ and $b$ are dynamically linked, observing $\delta v$ over time lets the filter separate all three, exactly the estimation problem the Kalman filter module built the machinery for.

::: example Watching a Kalman filter untangle tilt from bias

Three states, $(\varepsilon,\delta v,b)$, propagate under the Schuler lesson's own $\dot\varepsilon=b-\delta v/R$, $\dot{\delta v}=g\varepsilon$, with a zero-velocity measurement every $10\,\mathrm s$ at $5\,\mathrm{cm/s}$ assumed noise, starting from a $1^\circ$ coarse-level uncertainty and a $10^\circ/\mathrm h$ turn-on bias uncertainty:

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
# t=   300s  sigma_tilt=    6.87 arcsec  sigma_bias= 0.0365 deg/h
# t=   600s  sigma_tilt=    2.44 arcsec  sigma_bias= 0.0065 deg/h
# t=  1500s  sigma_tilt=    0.55 arcsec  sigma_bias= 0.0006 deg/h
```

In twenty-five minutes the tilt uncertainty falls from a coarse-level-scale $117$ arcseconds to half an arcsecond, and the bias uncertainty from $10^\circ/\mathrm h$ to six ten-thousandths of a degree per hour — fine alignment does not just sharpen the attitude, it simultaneously calibrates the gyro bias for free, using nothing but the vehicle sitting still and the same dynamics that make the Schuler oscillation what it is. This is also why fine alignment takes minutes rather than seconds: the filter needs the $\varepsilon$-$\delta v$ coupling to actually swing through enough of its dynamics to separate a bias (which keeps pushing) from a tilt (whose free response only oscillates), and that separation improves with time on the same schedule the Schuler period sets.
:::

::: warning
The zero-velocity constraint only exists while the vehicle is actually motionless. A platform that rocks on its suspension, a ship at a pier that surges with the swell, or an aircraft with an engine running that induces genuine micro-vibration all corrupt the $\delta v=0$ assumption with real, physical velocity the filter has no way to distinguish from velocity error — feeding it in anyway biases the alignment rather than improving it. Real alignment procedures gate on measured vibration level and extend the alignment time rather than trust a ZUPT taken during a rough environment.
:::

## Transfer and in-flight alignment

Not every IMU gets to sit still. **Transfer alignment** aligns a second, usually cheaper, IMU — on a missile rail, a gimbaled sensor, a weapon station — using an already-aligned master INS elsewhere on the same vehicle as the reference, matching attitude rates or velocity differences between the two over a short manoeuvre rather than waiting for a ZUPT-based fine alignment that a missile in flight cannot perform. The complication unique to transfer alignment is the physical separation between the two units: any **lever arm** between them turns the vehicle's own angular rate into an apparent velocity difference the filter must model rather than mistake for misalignment, and structural flexure between the master and slave locations corrupts the reference itself if the airframe is not as rigid as the alignment assumes — the lever arm compensation this module's final lesson develops is precisely the correction transfer alignment depends on.

**In-flight alignment** relaxes the zero-velocity assumption entirely, replacing it with GNSS-derived position and velocity as the aiding measurement — the same Kalman filter structure as fine alignment, with $\delta v$ measured against a GNSS solution instead of against zero. It shares fine alignment's central strength, using the Schuler dynamics to separate tilt from bias, and adds a real limitation: some error combinations are only observable if the vehicle manoeuvres, because a straight, unaccelerating flight path leaves certain states — most notably an east-axis tilt and a north accelerometer bias moving together — producing an identical velocity signature no amount of waiting resolves. A turn or an acceleration changes the geometry linking the states to the measurement and breaks the ambiguity, which is why in-flight alignment procedures for aircraft routinely call for a specific manoeuvre, an S-turn or a series of banks, rather than trusting straight and level flight to align a system that straight and level flight cannot fully observe.

## Check yourself

::: check
Why can coarse leveling recover roll and pitch from a single accelerometer reading but never heading, no matter how good the accelerometer is?
:::

::: answer
Gravity is a vertical vector with no horizontal component, so its direction in body axes constrains only the two angles that describe how the body's own vertical is tilted away from true vertical — roll and pitch. Heading is a rotation about the vertical axis itself, and rotating the body about that axis does not change how gravity projects onto the body axes at all, so the accelerometer reading is completely insensitive to it; no accelerometer, however precise, contains any information a heading solution could be extracted from.
:::

::: check
A ship's navigation-grade gyrocompass ($0.01^\circ/\mathrm h$) works fine in port but is disabled automatically above $85^\circ$ latitude. Explain why, using this lesson's formula.
:::

::: answer
$\psi\approx b/(\omega_{ie}\cos\varphi)$, and $\cos85^\circ=0.0872$, a ninth of $\cos28.5^\circ$, so the achievable heading accuracy is roughly nine times worse near the pole for the same gyro. Push further, toward $\varphi=90^\circ$, and $\cos\varphi\to0$ while $\psi\to\infty$: the horizontal component of Earth rate that gyrocompassing depends on vanishes at the pole entirely, so there is no signal left to null regardless of gyro quality, and a system correctly refuses to trust a "solution" that is really just amplified noise.
:::

::: check
In the fine-alignment worked example, why does the tilt uncertainty fall by roughly a factor of seventeen (from $117$ to $6.9$ arcseconds) over the first five minutes, but only by about another factor of twelve (to $0.55$ arcseconds) over the next twenty?
:::

::: answer
Early measurements are working against a very poor prior (the $1^\circ$ coarse-level uncertainty), so each zero-velocity update removes a large fraction of a large uncertainty, and the reduction looks dramatic. As the filter converges, it is working against an already-small uncertainty, and further updates continue to help — the physics has not changed — but the absolute size of each improvement shrinks along with the uncertainty itself, the same diminishing-returns shape any convergent estimation process shows once it is no longer dominated by its prior.
:::

::: check
Why is a lever arm a bigger practical problem for transfer alignment than for fine alignment performed on a single IMU sitting still?
:::

::: answer
Fine alignment on a single IMU has no second sensor location to separate from, so there is no lever arm term in its equations at all. Transfer alignment explicitly reconciles two IMUs at two different physical locations on the vehicle, and any angular rate the vehicle experiences during the transfer — which real transfer alignments rely on, since a fast manoeuvre is often what makes the states observable in the first place — turns the physical separation between the two locations into a velocity difference that has nothing to do with misalignment; unless that term is modelled and removed, the filter mistakes a geometric artefact of the two sensors' placement for a genuine alignment error.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat\phi=\operatorname{atan2}(-f_y,-f_z)$, $\hat\theta=\operatorname{atan2}(f_x,\sqrt{f_y^2+f_z^2})$ | Coarse leveling: roll and pitch from specific force alone |
| Leveling error $\approx\delta f/g$ | Limited by accelerometer bias instability, not by averaging time past a few seconds |
| $\psi\approx b/(\omega_{ie}\cos\varphi)$ | Gyrocompassing heading accuracy; degrades as $1/\cos\varphi$, fails at the poles |
| ZUPT: $z=\delta v=0$ while stationary | Fine alignment's measurement, observing the Schuler loop's own $\varepsilon$-$\delta v$-$b$ coupling |
| Transfer alignment | Matches a slave IMU to an already-aligned master; needs lever arm and flexure compensation |
| In-flight alignment | Same filter structure, GNSS in place of ZUPT; some states need a manoeuvre to become observable |

Alignment gets a system started; the next two lessons cover what keeps it accurate afterward — how an INS is fused with GNSS once it is airborne or underway, in the architecture this lesson's in-flight case already previewed, and the full error-state filter formulation, 15-state and 21-state, that makes that fusion precise.
