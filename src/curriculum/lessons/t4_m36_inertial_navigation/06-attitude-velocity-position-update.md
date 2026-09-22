---
id: l06-attitude-velocity-position-update
title: The mechanization loop: attitude, velocity, and position update
minutes: 13
covers:
  - "Attitude update, velocity update with Coriolis and gravity, position update"
---

The previous lesson wrote down what rotates a navigation frame relative to inertial space in each of the three frame choices, and left the velocity equation's gravity term as a bare symbol. This lesson fills in every remaining piece and assembles the three equations into the loop a real strapdown navigator runs: update the attitude from the bias-corrected gyro, use the new attitude to rotate specific force into the navigation frame, add Coriolis and gravity to get the velocity rate, integrate velocity and then position, and feed the new position and velocity back into the next attitude update through the frame rotation rates the previous lesson derived. This lesson works in the local-level NED frame throughout, since it is the frame that needs every term — ECI and ECEF mechanizations are the same loop with terms dropped, not added.

## Attitude update: what the gyro output is missing

The gyro measures $\boldsymbol\omega_{ib}^b$, body rate relative to inertial space, in body axes — the quantity the sensor-physics lesson defined. The attitude kinematics module's direction cosine kinematics, $\dot{\mathbf C}_b^n = \mathbf C_b^n[\boldsymbol\omega_{nb}^b\times]$, needs a different rate: body relative to the **navigation** frame, because that is the frame whose orientation $\mathbf C_b^n$ actually tracks. The two are related by simple addition of angular rates across nested frames, inertial to navigation to body:

$$
\boldsymbol\omega_{ib}^b = \boldsymbol\omega_{in}^b + \boldsymbol\omega_{nb}^b \qquad\Longrightarrow\qquad \boldsymbol\omega_{nb}^b = \boldsymbol\omega_{ib}^b - \mathbf C_n^b\big(\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n\big),
$$

using $\boldsymbol\omega_{in}^n=\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n$ from the previous lesson and $\mathbf C_n^b=(\mathbf C_b^n)^{\mathsf T}$ to resolve it into body axes. This subtraction is not optional bookkeeping: a stationary IMU's gyro reads Earth rate, about $15^\circ/\mathrm h$, and integrating that raw would spin the computed attitude a full turn every sidereal day even though the vehicle never moved relative to the ground. Subtracting $\boldsymbol\omega_{ie}^n$ (and $\boldsymbol\omega_{en}^n$, whenever the vehicle is moving) before integrating is what makes $\mathbf C_b^n$ track orientation relative to the *Earth*, which is what every other term in the mechanization needs it for.

With $\boldsymbol\omega_{nb}^b$ in hand, the attitude kinematics module's own machinery takes over: integrate the quaternion or DCM kinematic differential equation over one sample interval $\Delta t$, using $\Delta\boldsymbol\theta = \boldsymbol\omega_{nb}^b\,\Delta t$ as the incremental rotation and any of that module's integration schemes to apply it, then renormalize. The simplest form, adequate while the vehicle is not vibrating or turning fast, updates the DCM directly:

$$
\mathbf C_b^n(t+\Delta t) \approx \mathbf C_b^n(t)\,\big(\mathbf I + [\Delta\boldsymbol\theta\times]\big),
$$

followed by the renormalization the attitude kinematics module described. This first-order form is exactly what breaks down under rapid, out-of-phase rotation — coning motion — which the next lesson corrects.

## Velocity update: gravity, finally supplied

The specific force $\mathbf f^b$ the accelerometer reports rotates into the navigation frame through the newly updated attitude, $\mathbf f^n=\mathbf C_b^n\mathbf f^b$, and the previous lesson's velocity equation needs one more piece: $\mathbf g^n$, the gravity the sensor-physics lesson insisted must be supplied analytically because no accelerometer senses it. WGS84 gives it as **normal gravity**, the gravitational plus centrifugal acceleration of a reference ellipsoid with the Earth's mass and rotation rate, by the closed-form Somigliana equation

$$
g_0(\varphi) = g_e\,\frac{1+k\sin^2\varphi}{\sqrt{1-e^2\sin^2\varphi}}, \qquad g_e = 9.780\,325\,3359\,\mathrm{m/s^2},\ \ k=0.001\,931\,853,
$$

with $e^2$ the same WGS84 eccentricity squared the radii of curvature used. This is gravity *at the ellipsoid surface*; height enters through the free-air correction, gravity weakening with altitude as the inverse-square law and the reference ellipsoid both predict, and to first order in $h/a$,

$$
g(\varphi,h) \approx g_0(\varphi)\left(1-\frac{2h}{a}\right).
$$

::: example Gravity from the equator to the pole, and the cost of ignoring height

Evaluating $g_0$ gives $9.7803\,\mathrm{m/s^2}$ at the equator, $9.7921\,\mathrm{m/s^2}$ at $28.5^\circ$, $9.8062\,\mathrm{m/s^2}$ at $45^\circ$, and $9.8322\,\mathrm{m/s^2}$ at the pole — a $0.53\%$ swing from equator to pole, entirely from the combination of the Earth's flattening and the weaker centrifugal relief at high latitude. The height gradient $2g_0/a$ evaluates to $3.075\times10^{-6}\,\mathrm{s^{-2}}$ per metre near $45^\circ$ — commonly quoted in geodesy as about $3.086\times10^{-6}\,\mathrm{s^{-2}}$ per metre once the flattening terms this first-order formula dropped are restored, close enough for every purpose this module has. Flying at $10\,\mathrm{km}$ without the height correction overstates gravity by $3.075\times10^{-6}\times10\,000 = 0.0308\,\mathrm{m/s^2}$, about $3.1$ milli-$g$ — more than thirty times a whole navigation-grade accelerometer's bias budget from the error-model lesson, misread as vertical acceleration and, through the coupling every INS has between its vertical channel and its horizontal one, eventually as horizontal error too.
:::

::: key The velocity update, assembled
$\dot{\mathbf v}^n = \mathbf C_b^n\mathbf f^b - (2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n + \mathbf g^n$, with $\mathbf g^n=(0,0,g(\varphi,h))^{\mathsf T}$ in NED and $g(\varphi,h)$ from the Somigliana formula and the height correction above. Integrate over $\Delta t$ the same way the attitude update did: $\mathbf v^n(t+\Delta t)\approx\mathbf v^n(t)+\dot{\mathbf v}^n\Delta t$.
:::

## Position update

The previous lesson's geodesy runs directly: $\dot\varphi = v_N/(R_M+h)$, $\dot\lambda = v_E/[(R_N+h)\cos\varphi]$, $\dot h = -v_D$, each integrated over $\Delta t$ using the new velocity and the radii of curvature evaluated at the *previous* latitude and height — close enough over one short step that re-evaluating them after rather than before makes no practical difference, though a careful implementation splits the step and evaluates at the midpoint. This closes the loop: the new $\varphi$, $\lambda$, $h$ feed $R_M$, $R_N$, $g$, $\boldsymbol\omega_{ie}^n$ and $\boldsymbol\omega_{en}^n$ for the next attitude and velocity update.

::: example A perfect stationary IMU, and a biased one, over ten minutes

Mechanize a level, north-aligned IMU at $28.5^\circ$ latitude at rest, first with a perfect gyro, then with a $1^\circ/\mathrm h$ bias about the north axis, both at $\Delta t=0.05\,\mathrm s$.

```python
import numpy as np

WGS84_A, WGS84_E2, OMEGA_IE = 6378137.0, 6.69437999014e-3, 7.292115e-5
GE, K_SOM = 9.7803253359, 0.001931853

def radii_of_curvature(lat):
    s = np.sin(lat)
    return (WGS84_A*(1-WGS84_E2)/(1-WGS84_E2*s**2)**1.5,
            WGS84_A/np.sqrt(1-WGS84_E2*s**2))

def gravity(lat, h=0.0):
    s = np.sin(lat)
    return GE*(1+K_SOM*s**2)/np.sqrt(1-WGS84_E2*s**2) * (1-2*h/WGS84_A)

def earth_rate_ned(lat):
    return OMEGA_IE*np.array([np.cos(lat), 0.0, -np.sin(lat)])

def transport_rate_ned(v, lat, h):
    Rm, Rn = radii_of_curvature(lat)
    return np.array([v[1]/(Rn+h), -v[0]/(Rm+h), -v[1]*np.tan(lat)/(Rn+h)])

def skew(w):
    return np.array([[0,-w[2],w[1]],[w[2],0,-w[0]],[-w[1],w[0],0]])

def mechanize(C, v, lat, lon, h, f_b, w_ib_b, dt):
    w_in_n = earth_rate_ned(lat) + transport_rate_ned(v, lat, h)
    w_nb_b = w_ib_b - C.T @ w_in_n
    C_new = C @ (np.eye(3) + skew(w_nb_b*dt))
    U, _, Vt = np.linalg.svd(C_new); C_new = U @ Vt        # renormalize
    v_dot = C @ f_b - np.cross(2*earth_rate_ned(lat)+transport_rate_ned(v,lat,h), v) \
            + np.array([0,0,gravity(lat,h)])
    v_new = v + v_dot*dt
    Rm, Rn = radii_of_curvature(lat)
    lat_new = lat + (v[0]/(Rm+h))*dt
    lon_new = lon + (v[1]/((Rn+h)*np.cos(lat)))*dt
    return C_new, v_new, lat_new, lon_new, h - v[2]*dt

lat0, dt = np.radians(28.5), 0.05
g = gravity(lat0)
f_b = np.array([0.0, 0.0, -g])

for bias_deg_h, label in [(0.0, "perfect"), (1.0, "1 deg/h north bias")]:
    C, v, lat, lon, h = np.eye(3), np.zeros(3), lat0, 0.0, 0.0
    bias = np.array([bias_deg_h*np.pi/180/3600, 0.0, 0.0])
    for k in range(int(600/dt)):
        w_ib_b = C.T @ earth_rate_ned(lat) + bias
        C, v, lat, lon, h = mechanize(C, v, lat, lon, h, f_b, w_ib_b, dt)
    print(label, "-> |v| after 600 s:", np.linalg.norm(v), "m/s")
# perfect -> |v| after 600 s: 0.0 m/s
# 1 deg/h north bias -> |v| after 600 s: 8.157008012245978 m/s
```

The perfect gyro produces exactly zero velocity after ten minutes at rest, to floating-point precision — the mechanization equations are self-consistent, and nothing here injects numerical drift on its own. The biased gyro produces a velocity magnitude, almost entirely eastward, that reaches $8.16\,\mathrm{m/s}$ by $t=600\,\mathrm s$ (up from $|\mathbf v|=0.00236\,\mathrm{m/s}$ at $t=10\,\mathrm s$ and $0.0853\,\mathrm{m/s}$ at $t=60\,\mathrm s$), and its growth is instructive: from $t=10\,\mathrm s$ to $t=60\,\mathrm s$, a six-fold increase in time, the velocity grows $36.1$-fold, matching $6^2=36$ almost exactly — a north-axis tilt rate, uncorrected, leaks gravity into the horizontal channel at a rate proportional to $t$, and integrating that once gives a velocity error growing as $t^2$. But push on to $t=600\,\mathrm s$: a further ten-fold increase in time from $t=60\,\mathrm s$ produces only a $95.6$-fold increase in velocity, short of the $100$-fold a clean $t^2$ law would give. Something is already bending this curve away from the runaway growth the quadratic law predicts, within the first ten minutes of a one-degree-per-hour bias — the first visible hint of a mechanism a later lesson of this module names and explains in full.
:::

::: warning
The attitude update in this lesson is first-order and uses one gyro sample per step. Read literally, that invites sampling the gyro once per attitude-update interval, however long that interval is — and doing so under any rotational vibration produces the systematic coning error the error-model lesson already named and the next lesson quantifies. The fix is not a better integrator for this equation; it is sub-sampling the gyro within each interval and combining the sub-samples with the coning correction before this update ever runs.
:::

## Check yourself

::: check
A gyro triad measures $\boldsymbol\omega_{ib}^b$. Why does the attitude update need $\boldsymbol\omega_{nb}^b$ instead, and what would go wrong if the mechanization integrated the raw gyro output directly?
:::

::: answer
The direction cosine matrix $\mathbf C_b^n$ tracks orientation relative to the navigation frame, so its kinematic equation is driven by the body's rate relative to *that* frame, not relative to inertial space. Integrating $\boldsymbol\omega_{ib}^b$ directly would make $\mathbf C_b^n$ track orientation relative to inertial space instead, so a vehicle sitting still on the ground would appear, in the computed attitude, to rotate once per sidereal day — the mechanization would report the vehicle turning when it is Earth's rotation the gyro is actually sensing.
:::

::: check
Estimate, without a calculator, roughly how much a $2\%$ error in the WGS84 flattening-driven gravity variation (the $0.53\%$ pole-to-equator swing this lesson computed) would cost a navigation-grade accelerometer budget of $50\,\mu g$.
:::

::: answer
A $2\%$ error in a $0.53\%$ effect is about $0.0106\%$ of $g$, or roughly $1.0\times10^{-4}\times9.8\approx1\,\mathrm{mg}$ — twenty times the $50\,\mu g$ accelerometer budget. Getting the latitude dependence of gravity only approximately right can dwarf the sensor's own bias, which is exactly why the Somigliana formula, not a single constant $9.81\,\mathrm{m/s^2}$, belongs in any mechanization that claims navigation-grade performance.
:::

::: check
Why does the position update evaluate $R_M$ and $R_N$ at the *previous* latitude rather than the new one, and why is this an acceptable approximation?
:::

::: answer
The new latitude is not known until the position update itself has run, so evaluating $R_M$ and $R_N$ at it would require solving for latitude and its own input simultaneously. Using the previous step's latitude is a one-step-lagged approximation, and it is acceptable because $R_M$ and $R_N$ change by at most a few kilometres over tens of degrees of latitude, so over one integration step of a fraction of a second the radii are, to an excellent approximation, constant — the error this introduces is far below the error from truncating the integration to first order in $\Delta t$ in the first place.
:::

::: check
In the biased-gyro example, the north-axis bias produced velocity growth mostly in the *east* channel rather than the north channel. Explain why a rotation about north does not produce a north velocity error.
:::

::: answer
A rotation about the north axis tilts the platform's sensed vertical toward or away from east, not toward or away from north — the axis you rotate about is the one whose own horizontal direction is left unaffected to first order, exactly as rotating a wheel about its own axle does not move points on the axle. The tilt this bias produces therefore leaks gravity into the east-down plane, which is why $v_E$ grows while $v_N$ stays orders of magnitude smaller, limited only by second-order coupling through the Coriolis and transport-rate terms once $v_E$ itself becomes non-negligible.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\boldsymbol\omega_{nb}^b=\boldsymbol\omega_{ib}^b-\mathbf C_n^b(\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)$ | What the attitude update integrates: gyro output minus Earth and transport rate |
| $\mathbf C_b^n(t+\Delta t)\approx\mathbf C_b^n(t)(\mathbf I+[\Delta\boldsymbol\theta\times])$ | First-order attitude update; renormalize after |
| $g_0(\varphi)=g_e(1+k\sin^2\varphi)/\sqrt{1-e^2\sin^2\varphi}$ | Somigliana normal gravity, $g_e=9.7803253359\,\mathrm{m/s^2}$ |
| $g(\varphi,h)\approx g_0(\varphi)(1-2h/a)$ | Free-air height correction; gradient $\approx3.08\times10^{-6}\,\mathrm{s^{-2}}$ per metre |
| $\dot{\mathbf v}^n=\mathbf C_b^n\mathbf f^b-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ | Velocity update, fully assembled |
| $\dot\varphi=v_N/(R_M+h)$, $\dot\lambda=v_E/[(R_N+h)\cos\varphi]$, $\dot h=-v_D$ | Position update |

The mechanization now runs end to end, and the worked example already showed its growth bending away from a clean power law within minutes. The next lesson fixes the attitude update's first-order weakness under vibration — coning and sculling — before two later lessons of this module explain that bend precisely: the Schuler oscillation, and the complete free-inertial error budget it bounds.
