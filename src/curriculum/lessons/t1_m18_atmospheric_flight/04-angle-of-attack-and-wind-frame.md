---
id: l04-angle-of-attack-and-wind-frame
title: Angle of attack, sideslip and the wind frame
minutes: 17
covers:
  - angle of attack and sideslip; body vs wind frame
---

A gravity turn is defined by one condition: the thrust points along the velocity, so the body axis and the direction of flight coincide and the vehicle slices through the air point-first. In that idealised world the only aerodynamic force is drag. The real world adds wind. The air the vehicle flies through is itself moving — at 10 to 14 km, often at 40 to 80 m/s — and the air-relative velocity that aerodynamics responds to is no longer aligned with the body. The angle between them is the angle of attack, and it is the single quantity that turns a benign dynamic pressure into a bending load.

Describing this needs two coordinate frames and two angles. The body frame is fixed to the vehicle and is where the structure, the sensors and the engine gimbal live. The wind frame is aligned with the air-relative velocity and is where lift and drag are defined. The angle of attack $\alpha$ and the sideslip angle $\beta$ are the two rotations that connect them. This lesson defines all four precisely, gives the transformation between the frames, shows how forces expressed in one are converted to the other, and explains why wind — not the trajectory — is what puts $\alpha$ on a launch vehicle. The exercise on max-Q asks you to compute $\alpha$ from body-axis velocity components; by the end you will know exactly what that function should do.

## The body frame

The **body frame** $B$ has its origin at the vehicle's centre of mass and axes fixed to the structure. For a launch vehicle the convention is: $\hat{\mathbf{x}}_b$ along the longitudinal (roll) axis toward the nose; $\hat{\mathbf{y}}_b$ and $\hat{\mathbf{z}}_b$ perpendicular to it, fixed to the airframe, completing a right-handed set. Rotation about $\hat{\mathbf{x}}_b$ is roll, about $\hat{\mathbf{y}}_b$ is pitch, about $\hat{\mathbf{z}}_b$ is yaw. The **pitch plane** is the $x_b$–$z_b$ plane and the **yaw plane** is $x_b$–$y_b$. Which lateral axis is called $z$ is a matter of the vehicle's own convention, tied to its roll orientation on the pad and the placement of its engines; what matters is that you use one convention consistently.

The aerodynamic force depends on how the air moves past the body, so the velocity that matters is the **air-relative velocity**,

$$
\mathbf{V} = \mathbf{v} - \mathbf{w},
$$

where $\mathbf{v}$ is the vehicle's velocity relative to the ground (the Earth-fixed frame, in which the atmosphere is at rest apart from wind) and $\mathbf{w}$ is the wind velocity. If your simulation works in an inertial frame, remember that the atmosphere co-rotates with the Earth: at the latitude of Cape Canaveral the air is moving east at $\omega_E r\cos\phi = 7.292 \times 10^{-5} \times 6.378 \times 10^6 \times \cos 28.5^\circ = 409\ \mathrm{m/s}$ in inertial space, and that must be subtracted before any wind is added. Resolving $\mathbf{V}$ in body axes gives the three components

$$
\mathbf{V}_b = \begin{pmatrix} u \\ v \\ w \end{pmatrix}, \qquad V = |\mathbf{V}| = \sqrt{u^2 + v^2 + w^2},
$$

with $u$ along the body axis (positive toward the nose means the air flows tail-ward over the vehicle, as it should in forward flight), $v$ along $\hat{\mathbf{y}}_b$ and $w$ along $\hat{\mathbf{z}}_b$.

## Angle of attack and sideslip

The **angle of attack** $\alpha$ is the angle between the body $x$ axis and the projection of the air-relative velocity onto the pitch plane:

$$
\alpha = \operatorname{atan2}(w, u).
$$

The **sideslip angle** $\beta$ is the angle by which the air-relative velocity leaves that plane:

$$
\beta = \arcsin\frac{v}{V}.
$$

So $\alpha$ is a rotation about the pitch axis and $\beta$ a rotation about the yaw axis, and for a vehicle flying nose-first both are small. Use `atan2`, not `atan`: it keeps the correct quadrant when $u$ is small or negative, which happens for a returning booster flying engines-first, where the air-relative velocity points along $-\hat{\mathbf{x}}_b$ and $\alpha$ is near $180^\circ$.

For small angles, $\alpha \approx w/V$ and $\beta \approx v/V$ in radians. A lateral relative-wind component of 21 m/s at an airspeed of 400 m/s is an angle of attack of about $0.0525\ \mathrm{rad} = 3.0^\circ$.

Because a launch vehicle is axisymmetric, its pitch and yaw planes are aerodynamically identical and the body does not care which plane the wind is in. What sets the magnitude of the force is the **total angle of attack**, the angle between the body axis and the relative wind,

$$
\alpha_T = \arccos\frac{u}{V} \approx \sqrt{\alpha^2 + \beta^2},
$$

and what sets the plane in which the force acts is the **aerodynamic roll angle** $\phi_a = \operatorname{atan2}(v, w)$. The structures team cares about $\alpha_T$ (the bending moment magnitude) and the control team resolves it back into $\alpha$ and $\beta$ because the pitch and yaw control loops are separate.

::: key
Angle of attack $\alpha$ is the angle between the body $x$ axis and the velocity vector projected into the $x$–$z$ body plane, $\alpha = \operatorname{atan2}(w, u)$; sideslip $\beta = \arcsin(v/V)$ is the angle of the velocity out of that plane. Aerodynamic forces respond to the wind-relative velocity $\mathbf{V} = \mathbf{v} - \mathbf{w}$, not the inertial one.
:::

::: example Angles from body-axis components
A vehicle's air-relative velocity in body axes is $(u, v, w) = (400, 5, 21)\ \mathrm{m/s}$. The airspeed is $V = \sqrt{400^2 + 5^2 + 21^2} = 400.58\ \mathrm{m/s}$. Then

$$
\alpha = \operatorname{atan2}(21, 400) = 0.05245\ \mathrm{rad} = 3.005^\circ, \qquad
\beta = \arcsin(5/400.58) = 0.01248\ \mathrm{rad} = 0.715^\circ .
$$

The total angle of attack is $\alpha_T = \arccos(400/400.58) = 3.089^\circ$, which agrees with $\sqrt{3.005^2 + 0.715^2} = 3.089^\circ$ to the precision shown, and the aerodynamic roll angle is $\phi_a = \operatorname{atan2}(5, 21) = 13.4^\circ$: the resultant normal force lies $13.4^\circ$ out of the pitch plane toward $+y_b$. This is the computation the exercise's `angle_of_attack` function performs — one `atan2` call, once the relative velocity is in body axes.
:::

## The wind frame

The **wind frame** $W$ (also called the aerodynamic or stability frame) is defined by the relative wind itself: $\hat{\mathbf{x}}_w$ points along $\mathbf{V}$; $\hat{\mathbf{z}}_w$ lies in the body pitch plane, perpendicular to $\hat{\mathbf{x}}_w$; $\hat{\mathbf{y}}_w$ completes the right-handed set. In this frame the aerodynamic force has its textbook components: **drag** $D$ along $-\hat{\mathbf{x}}_w$ (opposing the relative motion), **lift** $L$ along $-\hat{\mathbf{z}}_w$, and **side force** $Y$ along $\hat{\mathbf{y}}_w$.

To get from wind axes to body axes, rotate by $-\beta$ about $z$ to bring the velocity into the pitch plane, then by $\alpha$ about $y$ to bring it onto the body axis. The resulting direction-cosine matrix that converts wind-frame components into body-frame components is

$$
\mathbf{C}_{b\leftarrow w} =
\begin{pmatrix}
\cos\alpha\cos\beta & -\cos\alpha\sin\beta & -\sin\alpha \\
\sin\beta & \cos\beta & 0 \\
\sin\alpha\cos\beta & -\sin\alpha\sin\beta & \cos\alpha
\end{pmatrix}.
$$

You can check it in two ways. Its first column is $\hat{\mathbf{x}}_w$ expressed in body axes, $(\cos\alpha\cos\beta,\ \sin\beta,\ \sin\alpha\cos\beta)$, which is exactly $\mathbf{V}_b/V$ — invert the definitions of $\alpha$ and $\beta$ and you recover $u/V = \cos\alpha\cos\beta$, $v/V = \sin\beta$, $w/V = \sin\alpha\cos\beta$. And its columns are orthonormal with determinant $+1$, as any rotation's must be. The reverse transformation is the transpose.

## Converting forces between the frames

In the wind frame the aerodynamic force vector is $\mathbf{F}_w = (-D,\ Y,\ -L)$. Apply the matrix, and for the common case of zero sideslip ($\beta = 0$) the body-frame components are

$$
\mathbf{F}_b = \begin{pmatrix} -D\cos\alpha + L\sin\alpha \\ 0 \\ -D\sin\alpha - L\cos\alpha \end{pmatrix}.
$$

Launch-vehicle and missile aerodynamics prefer body-axis components, defined positive so that the numbers are positive in normal flight: the **axial force** $A = -F_{b,x}$ pointing tail-ward, and the **normal force** $N = -F_{b,z}$ pointing along $-\hat{\mathbf{z}}_b$, toward the side the nose is tilted relative to the wind. Reading them off,

$$
A = D\cos\alpha - L\sin\alpha, \qquad N = D\sin\alpha + L\cos\alpha,
$$

and inverting,

$$
L = N\cos\alpha - A\sin\alpha, \qquad D = N\sin\alpha + A\cos\alpha .
$$

For small $\alpha$ these say $L \approx N - A\alpha$ and $D \approx A + N\alpha$: lift and normal force are nearly the same thing, drag and axial force nearly the same thing, and the cross-terms are small. Both sets are used, and the coefficient tables — $C_A$, $C_N$ versus $C_D$, $C_L$ — come with the same reference area but must not be mixed.

::: example Body-axis to wind-axis forces
Wind-tunnel data for a booster at $\alpha = 5^\circ$ give a normal force of 100 kN and an axial force of 60 kN. The lift and drag are

$$
L = 100\cos 5^\circ - 60\sin 5^\circ = 99.62 - 5.23 = 94.4\ \mathrm{kN}, \qquad
D = 100\sin 5^\circ + 60\cos 5^\circ = 8.72 + 59.77 = 68.5\ \mathrm{kN}.
$$

The 8.7 kN of drag that the normal force contributes at $5^\circ$ is 14 % of the axial force — the drag penalty of flying at angle of attack, and one reason a gravity turn holds $\alpha \approx 0$ through the dense air. The structural load, by contrast, is set by $N$, the force perpendicular to the airframe; the $5\ \mathrm{kN}$ difference between $L$ and $N$ is irrelevant to the bending moment.
:::

## Where angle of attack comes from on a launcher

Write the pitch-plane geometry in still air. The **pitch attitude** $\theta$ is the angle of the body axis above the local horizontal; the **flight-path angle** $\gamma$ is the angle of the velocity above the horizontal. Then

$$
\theta = \gamma + \alpha .
$$

A gravity turn is the special case $\theta = \gamma$, $\alpha = 0$: the attitude follows the velocity as gravity bends it over. The controller's job through the atmosphere is to hold the body axis on the velocity vector — which is why the pitch program in the guidance computer looks like a slowly falling attitude command, and why the attitude and flight-path angle in the max-Q table of Lesson 2 were the same number.

Now add wind. The relative velocity is $\mathbf{V} = \mathbf{v} - \mathbf{w}$, and a wind component $w_\perp$ perpendicular to the flight path rotates it by $\Delta\alpha \approx w_\perp/V$. The vehicle can be flying a perfect inertial gravity turn, thrust exactly along the ground-relative velocity, and still carry an angle of attack of several degrees relative to the air. The airframe does not know about the trajectory; it knows only the air.

::: example A jet-stream crosswind
At 12 km a vehicle flies at 420 m/s airspeed with $\alpha = 0$ in still air, and the dynamic pressure is 27.4 kPa. A horizontal wind of 60 m/s blows perpendicular to the flight path. The relative wind acquires a lateral component of 60 m/s, so

$$
\alpha_T = \arctan\frac{60}{420} = 8.1^\circ,
$$

and the load indicator that the next lessons develop, dynamic pressure times angle of attack, jumps to $27.4 \times 8.1 = 223\ \mathrm{kPa\cdot deg}$ — far beyond what any launcher's structure is certified for. A 30 m/s wind gives $4.1^\circ$ and 112 kPa·deg, still uncomfortable. This is why the day-of-launch wind is measured and the pitch program re-shaped so that the vehicle flies with its nose into the *measured* mean wind, leaving only the unpredictable gusts and shears to the controller.
:::

Rockets rarely measure $\alpha$ directly. Saturn V carried a "Q-ball", a nose-mounted array of differential pressure ports; most modern launchers instead estimate the angle of attack from the navigation velocity and a wind profile measured before launch, or infer the normal force from body-mounted lateral accelerometers — which is the signal load-relief control uses. Any of these paths goes through exactly the geometry above.

::: warning
Do not confuse pitch attitude with angle of attack, or flight-path angle with either. Attitude is measured against the horizon (or inertial space); angle of attack is measured against the relative wind. A vehicle pitched over to $\theta = 66^\circ$ on a gravity turn has $\alpha = 0$; a vehicle holding $\theta$ perfectly constant while a gust hits has $\alpha \neq 0$. The controller commands attitude; the structure feels angle of attack.
:::

::: warning
$\beta = \arcsin(v/V)$ uses the full airspeed $V$, not $u$. And $\alpha = \operatorname{atan2}(w, u)$ is not $\arcsin(w/V)$ — the two agree only when $\beta = 0$. For the small angles of ascent the difference is negligible; for the large angles of a tumbling stage or an engines-first descent it is not, and using the wrong one silently corrupts the aerodynamic lookup.
:::

## Check yourself

::: check
An engines-first descending booster has air-relative body-axis velocity components $(u, v, w) = (-380, 0, 20)\ \mathrm{m/s}$. Compute $\alpha$ and $\alpha_T$, and explain why `atan` would have given a wrong answer.
:::

::: answer
$\alpha = \operatorname{atan2}(20, -380) = 177.0^\circ$ (the velocity is almost exactly along $-\hat{\mathbf{x}}_b$, tilted $3^\circ$ toward $+z_b$). The airspeed is $V = \sqrt{380^2 + 20^2} = 380.5\ \mathrm{m/s}$ and $\alpha_T = \arccos(-380/380.5) = 177.0^\circ$ as well, since $\beta = 0$. A plain `atan(w/u)` would return $\arctan(-0.0526) = -3.0^\circ$, putting the wind on the wrong end of the vehicle: the aerodynamic database would be queried at a nose-first condition that does not exist.
:::

::: check
A vehicle is in a gravity turn with $\gamma = 60^\circ$ and no wind. Give its pitch attitude. Now a wind produces $\alpha = 2^\circ$ relative to the air while the controller holds attitude fixed. What is the flight-path angle of the air-relative velocity?
:::

::: answer
With no wind $\alpha = 0$, so $\theta = \gamma = 60^\circ$. When the wind arrives the attitude is held at $60^\circ$ and $\alpha = \theta - \gamma_{\text{air}}$ gives $\gamma_{\text{air}} = 60^\circ - 2^\circ = 58^\circ$ — the relative wind now approaches from $2^\circ$ below the body axis, while the ground-relative velocity is still at $60^\circ$. The aerodynamic normal force acts as if the nose were pitched up $2^\circ$ relative to the wind.
:::

::: check
Aerodynamic data give $C_N = 0.30$ and $C_A = 0.55$ at $\alpha = 8^\circ$. Find $C_L$ and $C_D$.
:::

::: answer
$C_L = C_N\cos\alpha - C_A\sin\alpha = 0.30 \times 0.9903 - 0.55 \times 0.1392 = 0.2971 - 0.0766 = 0.220$, and $C_D = C_N\sin\alpha + C_A\cos\alpha = 0.30 \times 0.1392 + 0.55 \times 0.9903 = 0.0418 + 0.5447 = 0.586$. Lift is a quarter smaller than the normal force because the large axial force tilts backward with the body; drag is 7 % more than the axial force because the normal force tilts back.
:::

::: check
A vehicle climbs at 300 m/s through a layer where the horizontal wind changes from 10 m/s to 50 m/s across the flight path. If the controller holds attitude, by how much does the angle of attack change?
:::

::: answer
The perpendicular relative-wind component changes by 40 m/s, so $\Delta\alpha \approx \arctan(40/300) = 7.6^\circ$ (the small-angle estimate $40/300 = 0.133\ \mathrm{rad} = 7.6^\circ$ agrees). A 40 m/s change is a strong shear, but shears of 20–30 m/s over a kilometre of altitude are within the design envelope at the Cape, and at 300 m/s the vehicle crosses that kilometre in about three seconds — faster than the attitude loop can respond.
:::

::: check
Why does the max-Q table of Lesson 2 show the same number for attitude and flight-path angle, and under what circumstances would a real flight show a difference of several degrees?
:::

::: answer
The simulation flew a gravity turn in still air, defined by $\alpha = 0$, so $\theta = \gamma$ identically. In a real flight the two differ whenever the vehicle carries an angle of attack: when a wind rotates the relative velocity (the airframe's $\alpha$ then differs from zero even if $\theta = \gamma$ in ground-relative terms), when the guidance deliberately steers off the velocity vector, or when load relief turns the nose into a gust. Differences of a few degrees are normal in gusty conditions; a sustained several-degree $\alpha$ at max-Q is a structural problem.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Body frame $B$ | $\hat{\mathbf{x}}_b$ toward the nose; $y_b$, $z_b$ lateral; pitch plane $x_b$–$z_b$ |
| $\mathbf{V} = \mathbf{v} - \mathbf{w}$ | air-relative velocity; components $(u, v, w)$ in body axes |
| $\alpha = \operatorname{atan2}(w, u)$ | angle of attack (pitch plane) |
| $\beta = \arcsin(v/V)$ | sideslip angle (out of the pitch plane) |
| $\alpha_T = \arccos(u/V) \approx \sqrt{\alpha^2 + \beta^2}$ | total angle of attack; $\phi_a = \operatorname{atan2}(v, w)$ aerodynamic roll angle |
| $\mathbf{C}_{b\leftarrow w}$ | wind-to-body rotation; first column $= \mathbf{V}_b/V$ |
| $L = N\cos\alpha - A\sin\alpha$, $D = N\sin\alpha + A\cos\alpha$ | wind-axis from body-axis forces |
| $\theta = \gamma + \alpha$ | attitude, flight-path angle and angle of attack in still air |
| $\Delta\alpha \approx w_\perp/V$ | angle of attack from a crosswind |

The next lesson asks where on the vehicle the normal force $N$ acts, and compares that point with the centre of mass. The distance between them, the static margin, decides whether the aerodynamic moment restores or amplifies an angle of attack — and for a launch vehicle the answer is the wrong one.
