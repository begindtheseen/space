---
id: l06-attitude-velocity-position-update
title: The mechanization loop: attitude, velocity, and position update
minutes: 15
covers:
  - "Attitude update, velocity update with Coriolis and gravity, position update"
---

Before satellites, a ship's navigator kept a log. Every hour she wrote down the heading from the compass and the speed through the water. Heading and speed for one hour gave a distance and a direction; add that to the last position and you have the new one. Then do it again next hour. This is **dead reckoning**, and it works as long as every step is done carefully and nothing is left out.

A strapdown navigator keeps the same log, a hundred or more times a second. Its "compass" is the gyro triad, its "speedometer" the accelerometer triad, and every step has three parts: update the attitude, update the velocity, update the position. The previous lesson worked out what makes each navigation frame turn and left gravity as a bare symbol. This lesson fills in every remaining piece and puts the three updates together into the loop a real navigator runs.

We work in the local-level NED frame throughout, because it is the frame that needs every term. ECI and ECEF mechanizations are the same loop with terms taken out, not added.

## Attitude update: what the gyro reading is missing

The vehicle's attitude is stored as a **[[direction cosine matrix|dcm]]** $\mathbf C_b^n$, read "C b to n": the $3\times3$ rotation matrix that turns a vector written in body axes into the same vector written in NED axes. Its transpose, $\mathbf C_n^b = (\mathbf C_b^n)^{\mathsf T}$, does the reverse.

The gyro measures $\boldsymbol\omega_{ib}^b$ — the body's rate relative to *inertial space*, in body axes. But $\mathbf C_b^n$ tracks the body relative to the *navigation frame*, so its kinematic equation, from the attitude kinematics module, needs the body's rate relative to NED:

$$
\dot{\mathbf C}_b^n = \mathbf C_b^n\,[\boldsymbol\omega_{nb}^b\times].
$$

Here $[\mathbf x\times]$ is the **[[skew-symmetric matrix|skew]]** that does a cross product: $[\mathbf x\times]\,\mathbf y = \mathbf x\times\mathbf y$.

How do you get $\boldsymbol\omega_{nb}^b$ from the gyro? Angular rates across nested frames add, like speeds on a moving walkway: your speed relative to the ground is the walkway's speed plus your speed on it. Inertial to navigation to body:

$$
\boldsymbol\omega_{ib}^b = \boldsymbol\omega_{in}^b + \boldsymbol\omega_{nb}^b \qquad\Longrightarrow\qquad \boldsymbol\omega_{nb}^b = \boldsymbol\omega_{ib}^b - \mathbf C_n^b\big(\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n\big).
$$

The second step rearranges, uses $\boldsymbol\omega_{in}^n = \boldsymbol\omega_{ie}^n + \boldsymbol\omega_{en}^n$ from the previous lesson, and multiplies by $\mathbf C_n^b$ to write that rate in body axes.

This subtraction is not optional bookkeeping. A gyro sitting still on a desk reads Earth rate, about $15^\circ/\mathrm h$. Integrate that raw and the computed attitude would spin a full turn every **[[sidereal day|sidereal-day]]**, though the desk never moved. Taking away $\boldsymbol\omega_{ie}^n$ — and $\boldsymbol\omega_{en}^n$ whenever the vehicle moves — is what makes $\mathbf C_b^n$ track orientation relative to the *Earth's* north, east and down, which is what every other step needs.

With $\boldsymbol\omega_{nb}^b$ in hand, the attitude kinematics module takes over. Over one sample interval $\Delta t$ the body turns through the small **incremental rotation** $\Delta\boldsymbol\theta = \boldsymbol\omega_{nb}^b\,\Delta t$. The simplest update, good enough while the vehicle is not vibrating or turning fast, is

$$
\mathbf C_b^n(t+\Delta t) \approx \mathbf C_b^n(t)\,\big(\mathbf I + [\Delta\boldsymbol\theta\times]\big),
$$

followed by **[[renormalization|renormalize]]**, which nudges the result back into an exact rotation matrix. This first-order form is exactly what breaks down under fast, out-of-phase wobbling — coning motion — which the next lesson fixes.

::: key The attitude update
The gyro measures $\boldsymbol\omega_{ib}^b$; the attitude update integrates $\boldsymbol\omega_{nb}^b=\boldsymbol\omega_{ib}^b-\mathbf C_n^b(\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)$, the bias-corrected gyro minus Earth rate and transport rate. First order: $\mathbf C_b^n(t+\Delta t)\approx\mathbf C_b^n(t)(\mathbf I+[\Delta\boldsymbol\theta\times])$, then renormalize.
:::

## Velocity update: gravity, finally supplied

Turn the accelerometer's specific force into NED with the freshly updated attitude: $\mathbf f^n = \mathbf C_b^n\mathbf f^b$. The previous lesson's velocity equation then needs one last piece, the gravity $\mathbf g^n$. The first lesson of this module insisted it be supplied from a model, because no accelerometer can feel it.

Gravity is not the same everywhere. It is stronger at the poles than at the equator, for two reasons: the poles are closer to Earth's center (the planet is squashed), and at the equator Earth's spin flings you outward a little, canceling part of the pull. WGS84 packs both effects into **normal gravity**: the gravitation plus centrifugal acceleration of a smooth reference ellipsoid with Earth's mass and spin. At the ellipsoid's surface it is given by the closed-form **[[Somigliana|somigliana]]** formula:

$$
g_0(\varphi) = g_e\,\frac{1+k\sin^2\varphi}{\sqrt{1-e^2\sin^2\varphi}}, \qquad g_e = 9.780\,325\,3359\,\mathrm{m/s^2},\ \ k=0.001\,931\,853.
$$

Here $g_e$ is gravity at the equator, $k$ is a constant of the ellipsoid, and $e^2$ is the same eccentricity squared the radii of curvature used.

Gravity also weakens with height. To first order in $h/a$ — height divided by Earth's radius — the **[[free-air correction|free-air]]** gives

$$
g(\varphi,h) \approx g_0(\varphi)\left(1-\frac{2h}{a}\right).
$$

The $2$ comes from the inverse-square law: if gravity goes as $1/r^2$, a small fractional step $h/a$ outward changes it by about $-2h/a$.

::: example Gravity from equator to pole, and the cost of ignoring height
**Latitude.** Put numbers into the Somigliana formula:

| Latitude | $g_0$ |
| --- | --- |
| $0^\circ$ (equator) | $9.7803\,\mathrm{m/s^2}$ |
| $28.5^\circ$ | $9.7921\,\mathrm{m/s^2}$ |
| $45^\circ$ | $9.8062\,\mathrm{m/s^2}$ |
| $90^\circ$ (pole) | $9.8322\,\mathrm{m/s^2}$ |

From equator to pole, gravity rises by $(9.8322-9.7803)/9.7803 = 0.53\%$.

**Height.** The height gradient is $2g_0/a$. Near $45^\circ$ that is $2\times9.8062/6\,378\,137 = 3.075\times10^{-6}\,\mathrm{s^{-2}}$ — gravity drops by about $3.075\times10^{-6}\,\mathrm{m/s^2}$ for every meter you climb. Geodesists quote about $3.086\times10^{-6}$, once the flattening terms this first-order formula dropped are put back; the difference does not matter anywhere in this module.

**The cost.** Fly at $10\,\mathrm{km}$ without the height correction and the model overstates gravity by $3.075\times10^{-6}\times10\,000 \approx 0.031\,\mathrm{m/s^2}$. Divide by $9.81$: about $3.1$ **[[milli-g|milli-g]]**. The first lesson's table puts a navigation-grade accelerometer's whole bias at $50$ to $100$ micro-$g$, so this one omission is more than thirty times larger. The INS reads it as vertical acceleration, and through the coupling between the **[[vertical channel|vertical-channel]]** and the horizontal ones, it eventually leaks into horizontal error too.

Sanity check: $0.53\%$ of $9.8\,\mathrm{m/s^2}$ is about $0.05\,\mathrm{m/s^2}$, the gap between the first and last rows of the table.
:::

Now assemble the velocity update. Everything on the right-hand side is known: specific force from the accelerometer, turned by the new attitude; Coriolis from Earth rate and transport rate; gravity from the model at the current latitude and height.

::: key Strapdown velocity update in NED
$\dot{\mathbf v}^n = \mathbf C_b^n\mathbf f^b - (2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n + \mathbf g^n$. The Coriolis term is Earth rate plus transport rate; the specific force $\mathbf f^b$ is what the accelerometer actually measures. In NED, $\mathbf g^n=(0,\,0,\,g(\varphi,h))^{\mathsf T}$, from the Somigliana formula and the height correction. Step it over $\Delta t$: $\mathbf v^n(t+\Delta t)\approx\mathbf v^n(t)+\dot{\mathbf v}^n\Delta t$.
:::

## Position update

The previous lesson's geodesy now runs directly:

$$
\dot\varphi = \frac{v_N}{R_M+h}, \qquad \dot\lambda = \frac{v_E}{(R_N+h)\cos\varphi}, \qquad \dot h = -v_D .
$$

The minus sign on $\dot h$ is because $v_D$ counts *down* as positive, while height counts *up*. Step each one over $\Delta t$ with the new velocity. The radii $R_M$ and $R_N$ are evaluated at the *previous* latitude and height. Over one short step the radii barely change, so this makes no practical difference, though a careful implementation evaluates them at the **[[midpoint|midpoint]]** of the step.

This closes the loop. The new $\varphi$, $\lambda$, $h$ feed $R_M$, $R_N$, $g$, $\boldsymbol\omega_{ie}^n$ and $\boldsymbol\omega_{en}^n$ for the next attitude and velocity update.

::: example A perfect stationary IMU, and a biased one, over ten minutes
Run the whole loop on an IMU sitting level and facing north at $28.5^\circ$ latitude, not moving at all. First give it a perfect gyro. Then add a bias of $1^\circ/\mathrm h$ on the north-pointing gyro. Step at $\Delta t = 0.05\,\mathrm s$ for $600\,\mathrm s$.

At rest, the accelerometers feel the bench pushing up, $\mathbf f^b = (0, 0, -g)$, and the gyros feel only Earth's spin, $\boldsymbol\omega_{ib}^b = \boldsymbol\omega_{ie}^n$ (body and NED axes coincide here).

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
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])

def mechanize(C, v, lat, lon, h, f_b, w_ib_b, dt):
    # 1. attitude: remove Earth rate and transport rate, then integrate
    w_ie, w_en = earth_rate_ned(lat), transport_rate_ned(v, lat, h)
    w_nb_b = w_ib_b - C.T @ (w_ie + w_en)
    C = C @ (np.eye(3) + skew(w_nb_b*dt))
    U, _, Vt = np.linalg.svd(C)
    C = U @ Vt                                   # renormalize
    # 2. velocity: rotate specific force, add Coriolis and gravity
    v_dot = C @ f_b - np.cross(2*w_ie + w_en, v) + np.array([0.0, 0.0, gravity(lat, h)])
    v_new = v + v_dot*dt
    # 3. position: latitude, longitude, height from the new velocity
    Rm, Rn = radii_of_curvature(lat)
    lat_new = lat + v_new[0]/(Rm + h)*dt
    lon_new = lon + v_new[1]/((Rn + h)*np.cos(lat))*dt
    h_new = h - v_new[2]*dt
    return C, v_new, lat_new, lon_new, h_new

lat0, dt = np.radians(28.5), 0.05
f_b = np.array([0.0, 0.0, -gravity(lat0)])      # at rest: the bench pushes up

for bias_deg_h in [0.0, 1.0]:
    bias = np.array([np.radians(bias_deg_h)/3600, 0.0, 0.0])   # rad/s, about north
    w_ib_b = earth_rate_ned(lat0) + bias         # what the level, north-facing gyro reads
    C, v, lat, lon, h = np.eye(3), np.zeros(3), lat0, 0.0, 0.0
    for k in range(1, int(600/dt) + 1):
        C, v, lat, lon, h = mechanize(C, v, lat, lon, h, f_b, w_ib_b, dt)
        if k in (200, 1200, 12000):             # t = 10 s, 60 s, 600 s
            print(f"bias {bias_deg_h} deg/h, t = {k*dt:3.0f} s: |v| = {np.linalg.norm(v):.4g} m/s")
# bias 0.0 deg/h, t =  10 s: |v| = 0 m/s
# bias 0.0 deg/h, t =  60 s: |v| = 0 m/s
# bias 0.0 deg/h, t = 600 s: |v| = 0 m/s
# bias 1.0 deg/h, t =  10 s: |v| = 0.002386 m/s
# bias 1.0 deg/h, t =  60 s: |v| = 0.08548 m/s
# bias 1.0 deg/h, t = 600 s: |v| = 8.158 m/s
```

**The perfect gyro** gives exactly zero velocity after ten minutes. The equations agree with each other, and the loop injects no drift of its own. That is the first test any mechanization must pass.

**The biased gyro** builds up a velocity, almost all of it eastward, reaching $8.16\,\mathrm{m/s}$ by $600\,\mathrm s$. Look at how it grows:

- From $10\,\mathrm s$ to $60\,\mathrm s$, time grows six-fold and velocity grows $0.08548/0.002386 = 35.8$-fold — almost exactly $6^2 = 36$. Here is why. The bias tilts the computed platform at a steady rate, so the tilt grows in proportion to $t$. A tilted platform leaks a slice of gravity into the horizontal, also growing as $t$. Integrate that once and velocity grows as $t^2$.
- From $60\,\mathrm s$ to $600\,\mathrm s$, time grows ten-fold, but velocity grows only $8.158/0.08548 = 95.4$-fold, short of the $100$ a clean $t^2$ law would give.

Sanity check on size: $g$ times the bias times $t^2/2$ at $600\,\mathrm s$ is $9.79\times4.848\times10^{-6}\times600^2/2 = 8.54\,\mathrm{m/s}$, close to what the loop gave. Something is already **[[bending the curve|schuler-bend]]** below the $t^2$ law, within the first ten minutes.
:::

::: warning One gyro sample per step is not enough
The attitude update in this lesson is first order and uses one gyro sample per step. Read literally, that invites reading the gyro once per update, however long the update interval is. Under any rotational vibration, that produces the systematic coning error the error-model lesson named and the next lesson measures. The fix is not a better integrator for this equation. It is sampling the gyro several times within each interval and combining those samples with a coning correction before this update ever runs.
:::

## Check yourself

::: check
A gyro triad measures $\boldsymbol\omega_{ib}^b$. Why does the attitude update need $\boldsymbol\omega_{nb}^b$ instead, and what would go wrong if the loop integrated the raw gyro output?
:::

::: answer
$\mathbf C_b^n$ tracks orientation relative to the navigation frame, so its equation is driven by the body's rate relative to *that* frame, not relative to inertial space.

Integrating $\boldsymbol\omega_{ib}^b$ directly would make $\mathbf C_b^n$ track orientation relative to inertial space instead. A vehicle sitting still on the ground would then appear, in the computed attitude, to turn once per sidereal day. The loop would report the vehicle turning, when what the gyro is really sensing is the Earth's rotation.
:::

::: check
A level IMU sits still at $28.5^\circ$ latitude, its $x$ axis pointing north. What does a perfect gyro triad read, in $\mathrm{rad/s}$?
:::

::: answer
It reads Earth rate, written in NED (body and NED axes coincide here):

$$
\boldsymbol\omega_{ib}^b = \omega_{ie}(\cos\varphi,\ 0,\ -\sin\varphi) = 7.292\times10^{-5}\,(0.8788,\ 0,\ -0.4772)\,\mathrm{rad/s}.
$$

That is about $6.408\times10^{-5}\,\mathrm{rad/s}$ on the north gyro, nothing on the east gyro and $-3.479\times10^{-5}\,\mathrm{rad/s}$ on the down gyro. The minus sign means the spin, seen from here, points up out of the ground (Earth's axis tilts up toward the north celestial pole). The attitude update subtracts exactly this, so $\boldsymbol\omega_{nb}^b = \mathbf 0$ and the attitude stays put.
:::

::: check
Estimate, without a calculator, what a $2\%$ error in modeling the latitude dependence of gravity — the $0.53\%$ equator-to-pole swing — would cost, compared with a navigation-grade accelerometer bias budget of $50$ micro-$g$.
:::

::: answer
Two per cent of $0.53\%$ is about $0.01\%$, which is $10^{-4}$ of $g$ — that is, $100$ micro-$g$, or $0.1$ milli-$g$.

That is about twice the $50$ micro-$g$ budget. Getting the latitude dependence of gravity only roughly right can outweigh the sensor's own bias. That is why the Somigliana formula, not a single constant like $9.81\,\mathrm{m/s^2}$, belongs in any mechanization that claims navigation-grade performance.
:::

::: check
The position update uses $R_M$ and $R_N$ at the *previous* latitude rather than the new one. Why, and why is that acceptable?
:::

::: answer
The new latitude is not known until the position update has run, so using it would mean solving for latitude and its own input at the same time.

Using the previous latitude is acceptable because the radii change slowly. $R_M$ changes by only about $64\,\mathrm{km}$ between equator and pole. In one step of $0.05\,\mathrm s$, even an airliner at $250\,\mathrm{m/s}$ moves only $12.5\,\mathrm m$ — about a ten-thousandth of a degree of latitude — so the radii change by well under a meter out of six thousand kilometers. That error is far smaller than the error from stepping to first order in $\Delta t$ in the first place.
:::

::: check
In the biased-gyro example, a bias about the *north* axis produced velocity error in the *east* channel, not the north channel. Why?
:::

::: answer
A turn about the north axis tips the platform's computed vertical toward east or west, not toward north or south. The axis you turn about is left where it is, just as spinning a wheel does not move points on its axle.

So the tilt leaks gravity into the east direction, and $v_E$ grows. $v_N$ stays orders of magnitude smaller, fed only by weaker second-order couplings through the Coriolis and transport-rate terms once $v_E$ itself has grown.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\boldsymbol\omega_{nb}^b=\boldsymbol\omega_{ib}^b-\mathbf C_n^b(\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)$ | What the attitude update integrates: gyro output minus Earth rate and transport rate |
| $\mathbf C_b^n(t+\Delta t)\approx\mathbf C_b^n(t)(\mathbf I+[\Delta\boldsymbol\theta\times])$ | First-order attitude update; renormalize after |
| $g_0(\varphi)=g_e(1+k\sin^2\varphi)/\sqrt{1-e^2\sin^2\varphi}$ | Somigliana normal gravity, $g_e=9.7803253359\,\mathrm{m/s^2}$ |
| $g(\varphi,h)\approx g_0(\varphi)(1-2h/a)$ | Free-air height correction; gradient about $3.08\times10^{-6}\,\mathrm{s^{-2}}$ per meter |
| $\dot{\mathbf v}^n=\mathbf C_b^n\mathbf f^b-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ | Velocity update, fully assembled |
| $\dot\varphi=v_N/(R_M+h)$, $\dot\lambda=v_E/[(R_N+h)\cos\varphi]$, $\dot h=-v_D$ | Position update |

The loop now runs end to end, and the example already showed its error bending away from a clean $t^2$ law within minutes. The next lesson fixes the attitude update's weakness under vibration — coning and sculling — before two later lessons explain that bend exactly: the Schuler oscillation, and the full free-inertial error budget it bounds.

::: context dcm Nine numbers for one orientation
A **direction cosine matrix** is a $3\times3$ table of numbers. Its three columns are the body's three axes — nose, right wing, belly — each written as a vector in NED axes. Each entry is the cosine of the angle between one body axis and one NED axis, hence the name. Because the axes are all at right angles and unit length, the matrix has a handy property: its transpose is its inverse, so going back from NED to body costs nothing but swapping rows and columns. The attitude kinematics module introduced it alongside quaternions, which store the same orientation in four numbers instead of nine.
:::

::: context skew A matrix that does a cross product
The cross product $\mathbf x\times\mathbf y$ is linear in $\mathbf y$, so it can be written as a matrix times $\mathbf y$:

$$
[\mathbf x\times] = \begin{pmatrix} 0 & -x_3 & x_2 \\ x_3 & 0 & -x_1 \\ -x_2 & x_1 & 0 \end{pmatrix}.
$$

It is called **skew-symmetric** because flipping it across the diagonal flips every sign. Writing the cross product this way lets the attitude update be pure matrix multiplication, which is what the `skew` function in the example code builds.
:::

::: context sidereal-day A day measured against the stars
A **solar day**, noon to noon, is $24$ hours. But in that time Earth has also moved about one degree along its orbit around the Sun, so it has to turn a little more than one full turn to bring the Sun back overhead. Measured against the distant stars, one full turn takes only $23$ hours, $56$ minutes and $4$ seconds: the **sidereal day**. A gyro feels the turn against the stars, so Earth rate is $360^\circ$ per sidereal day — $15.041^\circ/\mathrm h$, or $7.292\,115\times10^{-5}\,\mathrm{rad/s}$ — slightly more than $15^\circ/\mathrm h$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" font-family="Inter, Arial, sans-serif">
  <path d="M85,120 A95,95 0 0 0 275,120" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="180" cy="120" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">Sun</text>
  <circle cx="180" cy="215" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="227.5" cy="202.3" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="215" x2="180" y2="190" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="227.5" y1="202.3" x2="227.5" y2="177.3" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="227.5" y1="202.3" x2="215" y2="180.7" stroke="#b4232c" stroke-width="2.5"/>
  <text x="140" y="222" font-size="11" fill="#1f2a44" text-anchor="end">day 1, noon</text>
  <text x="246" y="222" font-size="11" fill="#1f2a44">one turn later</text>
  <text x="248" y="176" font-size="11" fill="#1d6fd1">same star direction</text>
  <text x="206" y="160" font-size="11" fill="#b4232c" text-anchor="end">Sun</text>
  <text x="20" y="30" font-size="11" fill="#1f2a44">Earth's move along its orbit is exaggerated</text>
  <text x="20" y="45" font-size="11" fill="#1f2a44">(about 1° a day, drawn as 30°)</text>
</svg>
```

After one sidereal turn (blue), the same spot faces the same star, but the Sun (red) has shifted, so Earth must turn a little more to bring noon back.
:::

::: context renormalize Keeping a rotation a rotation
A true rotation matrix has columns of length exactly $1$, at exactly right angles. The first-order update $\mathbf C(\mathbf I + [\Delta\boldsymbol\theta\times])$ breaks this very slightly every step, and the computer's rounding adds more. Left alone over a long flight, the columns would stretch and lean, and the matrix would start to scale and shear vectors as well as turn them. **Renormalization** finds the nearest true rotation matrix and replaces the drifted one. The example uses the singular value decomposition, which does this exactly; flight code often uses a cheaper approximate correction applied every few steps.
:::

::: context somigliana The Somigliana formula
Carlo Somigliana, an Italian mathematician, published this closed-form expression in 1929. It gives the exact gravity on the surface of a rotating ellipsoid whose surface is also a surface of constant gravity potential — the ideal Earth with no mountains and no uneven rock beneath. The real Earth's gravity differs from it by up to a few hundred millionths of $g$, from mountains, ocean trenches and dense rock; mapping those differences is its own science, and the best navigation systems carry a map of them.
:::

::: context free-air Why "free air"
The **free-air correction** accounts only for being farther from Earth's center, as if you were floating in open air above the ellipsoid. It ignores any rock between you and the ellipsoid — a mountain under your feet would add its own pull. For an aircraft or rocket that really is in free air, that is exactly right. Surveyors weighing gravity on a mountaintop add a separate correction for the rock, named after the French scientist Pierre Bouguer.
:::

::: context milli-g Measuring small accelerations
Inertial engineers measure accelerometer errors in fractions of $g$, Earth's surface gravity, taken as $9.80665\,\mathrm{m/s^2}$. One **milli-g** (mg) is a thousandth of that, about $0.0098\,\mathrm{m/s^2}$. One **micro-g** is a millionth, about $9.8\times10^{-6}\,\mathrm{m/s^2}$. A cheap phone accelerometer has biases of tens of milli-$g$; a navigation-grade one, tens of micro-$g$ — a thousand times better.
:::

::: context vertical-channel Why height runs away
Suppose the computed height is too high by a little. The gravity model then gives slightly too little gravity, so the computed vertical acceleration is too far upward, so the computed height climbs further, and the model gives even less gravity. It is positive feedback, and it makes an unaided INS's height error grow exponentially, with a time constant of about $\sqrt{a/(2g)} \approx 570\,\mathrm s$. That is why no INS navigates height on its own for long: it leans on a barometric altimeter, radar altimeter or GPS to hold the vertical channel down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="90" y="10" width="180" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="31" font-size="11" fill="#1f2a44" text-anchor="middle">computed height too high</text>
  <rect x="200" y="80" width="150" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="101" font-size="11" fill="#1f2a44" text-anchor="middle">model gravity too small</text>
  <rect x="10" y="80" width="150" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="101" font-size="11" fill="#1f2a44" text-anchor="middle">computed climb too fast</text>
  <g stroke="#b4232c" stroke-width="2" fill="#b4232c">
    <line x1="255" y1="46" x2="268" y2="68"/><polygon points="273,77 263,71 272,65"/>
    <line x1="200" y1="97" x2="171" y2="97"/><polygon points="162,97 172,92 172,102"/>
    <line x1="92" y1="78" x2="105" y2="56"/><polygon points="110,47 109,59 100,54"/>
  </g>
  <text x="180" y="150" font-size="12" fill="#b4232c" text-anchor="middle">each trip around the loop makes it worse</text>
</svg>
```
:::

::: context midpoint Evaluating in the middle
A step from $t$ to $t + \Delta t$ that uses rates from the start of the step is called **Euler's method**. Its error per step shrinks as $\Delta t^2$. Evaluating the rates at the middle of the step instead — here, at the average of the old and new latitudes — cancels the leading error term, so the error per step shrinks as $\Delta t^3$. Halving the step then cuts the total error by four instead of two. Flight software usually takes such cheap improvements.
:::

::: context schuler-bend A pendulum the size of the Earth
The bend comes from a feedback built into the NED mechanization. A velocity error moves the computed position, which changes where the computed "down" points, which tilts the platform back the other way. The result is an oscillation instead of runaway growth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="195">0</text><text x="100" y="195">10</text><text x="160" y="195">20</text><text x="220" y="195">30</text><text x="280" y="195">40</text><text x="340" y="195">50</text>
  </g>
  <text x="190" y="211" font-size="11" fill="#1f2a44" text-anchor="middle">minutes</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="184">0</text><text x="34" y="134">50</text><text x="34" y="84">100</text><text x="34" y="34">150</text>
  </g>
  <text x="46" y="24" font-size="11" fill="#1f2a44">east velocity error, m/s</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5,4" points="40,180.0 55,179.5 70,177.9 85,175.2 100,171.5 115,166.7 130,160.8 145,153.8 160,145.8 175,136.7 190,126.6 205,115.4 220,103.1 235,89.8 250,75.3 265,59.9 280,43.3 295,25.7 300,20"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,180.0 55,179.5 70,177.9 85,175.3 100,171.8 115,167.6 130,162.7 145,157.3 160,151.7 175,145.9 190,140.3 205,135.0 220,130.2 235,126.0 250,122.6 265,120.1 280,118.7 295,118.2 310,118.9 325,120.6 340,123.2"/>
  <text x="250" y="45" font-size="11" fill="#6c7a93" text-anchor="end">t² law</text>
  <text x="300" y="110" font-size="11" fill="#1d6fd1" text-anchor="middle">with the feedback</text>
</svg>
```

For the $1^\circ/\mathrm h$ bias of the example, the blue curve tops out near $62\,\mathrm{m/s}$ after about $42$ minutes and then falls back, repeating every $84.4$ minutes (slower effects are ignored in this sketch). Lesson 8 derives it.
:::
