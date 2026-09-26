---
id: l04-angle-of-attack-and-wind-frame
title: Angle of attack, sideslip and the wind frame
minutes: 23
covers:
  - angle of attack and sideslip; body vs wind frame
---

Stick your hand out of the window of a moving car. Hold it flat, fingers pointing forward, and the air slides past with hardly a push. Now tilt the front edge up a little. Your hand is shoved upward and backward, hard. Nothing changed about the car's speed. What changed is the angle between your hand and the air rushing at it.

Now picture the same car on a windy day. The air you feel is not only the air you are driving through. It is your motion *plus* the wind's. A flag on the car's antenna does not point straight back — it leans to one side. The flag shows you the direction of the air *relative to the car*, and that is the direction that matters for every push the air gives.

A rocket climbing through the atmosphere is that hand and that flag. Ideally it flies nose-first, with its body lined up exactly with its direction of travel, so the air meets it head-on and the only push is drag. The real sky has wind. At 10 to 14 km the **[[jet stream|jet-stream]]** often blows at 40 to 80 m/s. That wind tilts the air flowing past the rocket, so the air no longer arrives along the body's axis. The angle between the body and the oncoming air is the **angle of attack** — the tilt of your hand out of the window. It is the single number that turns a harmless dynamic pressure into a sideways load that bends the airframe.

To talk about this precisely you need two sets of directions, called frames, and two angles to connect them. The **body frame** is fixed to the vehicle; it is where the structure, the sensors and the engine gimbal live. The **wind frame** is lined up with the oncoming air; it is where lift and drag are defined. The angle of attack $\alpha$ and the sideslip angle $\beta$ are the two turns that carry one frame onto the other. This lesson builds all four, shows how to convert forces between the frames, and explains why wind — not the planned trajectory — is what gives a launch vehicle an angle of attack. The max-Q exercise asks you to compute $\alpha$ from velocity components; by the end you will know exactly what that function must do.

## The body frame

Think of three arrows glued to the rocket, all starting at its **center of mass** (the balance point of all its mass). They turn and travel with the vehicle. That set of arrows is the **body frame**, written $B$.

For a launch vehicle the usual choice is:

- $\hat{\mathbf{x}}_b$ (read "x-hat sub b") points along the long axis, toward the nose;
- $\hat{\mathbf{y}}_b$ and $\hat{\mathbf{z}}_b$ point sideways, at right angles to the long axis and to each other, fixed to the airframe;
- the three form a **[[right-handed|right-handed]]** set.

The hat means "an arrow of length one", a **unit vector**. Turning about $\hat{\mathbf{x}}_b$ is **roll**, about $\hat{\mathbf{y}}_b$ is **pitch**, and about $\hat{\mathbf{z}}_b$ is **yaw**. The flat sheet that holds $\hat{\mathbf{x}}_b$ and $\hat{\mathbf{z}}_b$ is the **pitch plane**; the sheet that holds $\hat{\mathbf{x}}_b$ and $\hat{\mathbf{y}}_b$ is the **yaw plane**.

Which sideways axis gets the name $z$ is up to each vehicle. It depends on how the rocket is rolled on the pad and where its engines sit. What matters is that you pick one convention and use it everywhere.

## The air you actually fly through

The air pushes on the vehicle because the vehicle moves *through the air*. So the velocity that matters is the **air-relative velocity**:

$$
\mathbf{V} = \mathbf{v} - \mathbf{w}.
$$

Here $\mathbf{v}$ is the vehicle's velocity relative to the ground (the Earth-fixed frame, in which still air sits at rest) and $\mathbf{w}$ is the wind's velocity. Subtract the wind, the same way a cyclist riding into a 5 m/s headwind at 5 m/s feels a 10 m/s breeze.

::: warning Earth's spin carries the air
If your simulation works in an **inertial frame** (one that does not spin with the Earth), remember that the whole atmosphere turns with the Earth. At Cape Canaveral's latitude $\phi = 28.5^\circ$ the still air is already moving east at

$$
\omega_E\, r \cos\phi = 7.292 \times 10^{-5} \times 6.378 \times 10^6 \times \cos 28.5^\circ = 409\ \mathrm{m/s}.
$$

That is the Earth's spin rate $\omega_E$ ("omega sub E", in rad/s) times the distance from the spin axis, $r\cos\phi$. Subtract this [[co-rotating air|corotation]] before you add any wind, or your "airspeed" at lift-off will be 409 m/s.
:::

Now write $\mathbf{V}$ in body axes. It has three parts:

$$
\mathbf{V}_b = \begin{pmatrix} u \\ v \\ w \end{pmatrix}, \qquad V = |\mathbf{V}| = \sqrt{u^2 + v^2 + w^2}.
$$

Here $u$ is the part along the body axis. It is positive in normal flight: the vehicle moves nose-first, so the air streams back over it toward the tail. The part along $\hat{\mathbf{y}}_b$ is $v$, and the part along $\hat{\mathbf{z}}_b$ is $w$. The length $V$ is the **airspeed**.

(Careful: the italic $w$ here is a body-axis component of $\mathbf{V}$. The bold $\mathbf{w}$ above is the wind. Aerodynamicists have used these letters for a century, so you will see both.)

## Angle of attack and sideslip

Look at the rocket from the side, so you see the pitch plane. The airflow may point partly out of that plane, so flatten it onto the plane first — throw away the $v$ part and keep $u$ and $w$. The **angle of attack** $\alpha$ ("alpha") is the angle between the body axis and that flattened velocity:

$$
\alpha = \operatorname{atan2}(w, u).
$$

The **sideslip angle** $\beta$ ("beta") is how far the airflow leans out of the pitch plane:

$$
\beta = \arcsin\frac{v}{V}.
$$

So $\alpha$ is a turn about the pitch axis and $\beta$ a turn about the yaw axis. For a vehicle flying nose-first, both are small.

Use **[[atan2|atan2-quadrant]]**, not plain arctangent. atan2 takes both parts separately, so it keeps the correct quadrant when $u$ is small or negative. That really happens: a booster coming back to land flies engines-first, so the air arrives along $-\hat{\mathbf{x}}_b$ and $\alpha$ is near $180^\circ$.

For small angles, the arctangent and arcsine are nearly their own inputs, so $\alpha \approx w/V$ and $\beta \approx v/V$, in radians. A sideways air component of 21 m/s at an airspeed of 400 m/s is an angle of attack of about $21/400 = 0.0525\ \mathrm{rad}$. Multiply by $180/\pi$ to get degrees: $3.0^\circ$.

### The total angle of attack

A launch vehicle is round. Its pitch and yaw planes look exactly the same to the air, so the body does not care which plane the wind lies in. What sets the *size* of the sideways force is the **total angle of attack** $\alpha_T$ ("alpha sub T"), the full angle between the body axis and the oncoming air:

$$
\alpha_T = \arccos\frac{u}{V} \approx \sqrt{\alpha^2 + \beta^2}.
$$

What sets the *direction* of that force around the body is the **aerodynamic roll angle** $\phi_a = \operatorname{atan2}(v, w)$ ("phi sub a"). The structures team cares about $\alpha_T$, because it sets how hard the body bends. The control team splits it back into $\alpha$ and $\beta$, because the pitch and yaw control loops are separate.

::: key
Angle of attack $\alpha$ is the angle between the body $x$ axis and the velocity vector projected into the $x$–$z$ body plane, $\alpha = \operatorname{atan2}(w, u)$; sideslip $\beta = \arcsin(v/V)$ is the angle of the velocity out of that plane. Aerodynamic forces respond to the wind-relative velocity $\mathbf{V} = \mathbf{v} - \mathbf{w}$, not the inertial one.
:::

::: example Angles from body-axis components
A vehicle's air-relative velocity in body axes is $(u, v, w) = (400, 5, 21)\ \mathrm{m/s}$. Find $\alpha$, $\beta$, $\alpha_T$ and $\phi_a$.

**Airspeed.** Square, add, take the root:

$$
V = \sqrt{400^2 + 5^2 + 21^2} = \sqrt{160\,000 + 25 + 441} = \sqrt{160\,466} = 400.58\ \mathrm{m/s}.
$$

**Angle of attack and sideslip.**

$$
\alpha = \operatorname{atan2}(21, 400) = 0.05245\ \mathrm{rad} = 3.005^\circ, \qquad
\beta = \arcsin(5/400.58) = 0.01248\ \mathrm{rad} = 0.715^\circ .
$$

**Total angle of attack.** From the exact formula, $\alpha_T = \arccos(400/400.58) = 3.089^\circ$. From the shortcut, $\sqrt{3.005^2 + 0.715^2} = 3.089^\circ$. They agree to the digits shown.

**Aerodynamic roll angle.** $\phi_a = \operatorname{atan2}(5, 21) = 13.4^\circ$. So the total sideways force points $13.4^\circ$ out of the pitch plane, toward $+y_b$.

**Sanity check.** The sideways parts (5 and 21 m/s) are tiny next to 400 m/s, so all the angles should be a few degrees. They are. This is exactly what the exercise's `angle_of_attack` function does: one `atan2` call, once the air-relative velocity is in body axes.
:::

## The wind frame

Now build a second set of arrows, this time lined up with the oncoming air instead of the body. That is the **wind frame** $W$ (also called the aerodynamic or stability frame):

- $\hat{\mathbf{x}}_w$ points along $\mathbf{V}$, the direction the vehicle moves through the air;
- $\hat{\mathbf{z}}_w$ lies in the body's pitch plane, at right angles to $\hat{\mathbf{x}}_w$;
- $\hat{\mathbf{y}}_w$ completes the right-handed set.

In this frame the air's push splits into its textbook names. **Drag** $D$ points along $-\hat{\mathbf{x}}_w$, straight against the motion through the air. **Lift** $L$ points along $-\hat{\mathbf{z}}_w$, at right angles to the motion. **Side force** $Y$ points along $\hat{\mathbf{y}}_w$.

To turn wind-frame arrows into body-frame arrows you make two turns: one by the sideslip angle, which brings the airflow into the pitch plane, and one by the angle of attack, which brings it onto the body axis. The **[[direction-cosine matrix|dcm]]** that converts wind-frame components into body-frame components is

$$
\mathbf{C}_{b\leftarrow w} =
\begin{pmatrix}
\cos\alpha\cos\beta & -\cos\alpha\sin\beta & -\sin\alpha \\
\sin\beta & \cos\beta & 0 \\
\sin\alpha\cos\beta & -\sin\alpha\sin\beta & \cos\alpha
\end{pmatrix}.
$$

Read $\mathbf{C}_{b\leftarrow w}$ as "C, body from wind". The reverse conversion, body to wind, is its **transpose** (the matrix flipped across its diagonal).

::: note Why it has to be true
Two checks confirm the matrix.

**The first column is the airflow.** Multiplying by the column $(1, 0, 0)$ picks out the first column, so the first column is $\hat{\mathbf{x}}_w$ written in body axes: $(\cos\alpha\cos\beta,\ \sin\beta,\ \sin\alpha\cos\beta)$. That should equal $\mathbf{V}_b/V$. Work backward from the definitions. From $\beta = \arcsin(v/V)$ you get $v/V = \sin\beta$. The flattened velocity in the pitch plane has length $\sqrt{u^2 + w^2} = V\cos\beta$, and $\alpha$ is its angle from the body axis, so $u = V\cos\beta\cos\alpha$ and $w = V\cos\beta\sin\alpha$. Divide by $V$ and you get exactly the first column.

**It is a rotation.** Each column has length one, the columns are at right angles to each other, and the determinant is $+1$. Every rotation matrix has those three properties, which is also why its inverse is its transpose.
:::

## Converting forces between the frames

In the wind frame the air's force is $\mathbf{F}_w = (-D,\ Y,\ -L)$. Multiply by the matrix. For the common case of no sideslip, $\beta = 0$, so $\cos\beta = 1$ and $\sin\beta = 0$, and the body-frame force is

$$
\mathbf{F}_b = \begin{pmatrix} -D\cos\alpha + L\sin\alpha \\ 0 \\ -D\sin\alpha - L\cos\alpha \end{pmatrix}.
$$

(The middle row is zero because with no sideslip and no side force there is nothing sideways.)

Rocket and missile engineers prefer to work with body-axis forces, named so they come out positive in normal flight:

- the **axial force** $A = -F_{b,x}$, pointing back along the body toward the tail;
- the **normal force** $N = -F_{b,z}$, pointing along $-\hat{\mathbf{z}}_b$, at right angles to the body, toward the side the nose is tilted relative to the oncoming air.

Read them straight off the matrix result:

$$
A = D\cos\alpha - L\sin\alpha, \qquad N = D\sin\alpha + L\cos\alpha .
$$

Solve those two for $L$ and $D$ (multiply the first by $\sin\alpha$, the second by $\cos\alpha$, and subtract; then do the same the other way round) and you get the inverse:

$$
L = N\cos\alpha - A\sin\alpha, \qquad D = N\sin\alpha + A\cos\alpha .
$$

For small $\alpha$, $\cos\alpha \approx 1$ and $\sin\alpha \approx \alpha$, so these say $L \approx N - A\alpha$ and $D \approx A + N\alpha$. Lift and normal force are nearly the same thing, and so are drag and axial force. The cross-terms are small. Both pairs are in everyday use, and the [[coefficient tables|coefficient-tables]] — $C_A$ and $C_N$ versus $C_D$ and $C_L$ — share the same reference area. Never mix a number from one pair with a formula from the other.

::: example Body-axis to wind-axis forces
Wind-tunnel data for a booster at $\alpha = 5^\circ$ give a normal force of 100 kN and an axial force of 60 kN. Find the lift and drag.

**The trig values.** $\cos 5^\circ = 0.9962$ and $\sin 5^\circ = 0.08716$.

**Lift.** Normal force times cosine, minus axial force times sine:

$$
L = 100\cos 5^\circ - 60\sin 5^\circ = 99.62 - 5.23 = 94.4\ \mathrm{kN}.
$$

**Drag.** Normal force times sine, plus axial force times cosine:

$$
D = 100\sin 5^\circ + 60\cos 5^\circ = 8.72 + 59.77 = 68.5\ \mathrm{kN}.
$$

**What it means.** The normal force adds 8.7 kN to the drag at $5^\circ$. That is about 14 % more than the 60 kN axial force — the drag penalty of flying tilted, and one reason a gravity turn holds $\alpha \approx 0$ through the thick air. The structure, though, feels $N$, the force at right angles to the airframe. The 5.6 kN difference between $L$ and $N$ does not matter to the bending.

**Sanity check.** At a small angle, lift should be a little less than $N$ and drag a little more than $A$. It is: $94.4 < 100$ and $68.5 > 60$.
:::

## Where angle of attack comes from on a launcher

Look at the rocket from the side again, in still air, with a horizon line drawn. [[Three angles appear|attitude-angles]]:

- the **pitch attitude** $\theta$ ("theta"): how far the body axis is tilted above the local horizontal;
- the **flight-path angle** $\gamma$ ("gamma"): how far the velocity is tilted above the horizontal;
- the angle of attack $\alpha$: the gap between them.

So in still air,

$$
\theta = \gamma + \alpha .
$$

A **[[gravity turn|gravity-turn]]** is the special case $\theta = \gamma$, so $\alpha = 0$. The rocket keeps its nose on its velocity while gravity slowly bends the path over. Through the atmosphere, the controller's job is to hold the body on the velocity vector. That is why the pitch program in the guidance computer looks like a slowly falling attitude command. It is also why the simulated ascent of Lesson 2, flown as a still-air gravity turn, has a pitch attitude equal to its flight-path angle at every moment.

Now add wind. The air-relative velocity is $\mathbf{V} = \mathbf{v} - \mathbf{w}$. A wind part $w_\perp$ ("w perp", the part of the wind at right angles to the flight path) turns that velocity by

$$
\Delta\alpha \approx \frac{w_\perp}{V}.
$$

So the vehicle can fly a perfect gravity turn relative to the ground, thrust exactly along its ground velocity, and still carry several degrees of angle of attack relative to the air. The airframe does not know about the trajectory. It knows only the air.

::: example A jet-stream crosswind
At 12 km a vehicle flies at 420 m/s airspeed with $\alpha = 0$ in still air. The dynamic pressure there is 27.4 kPa. Then a 60 m/s horizontal wind blows at right angles to the flight path.

**The new angle.** The oncoming air gains a 60 m/s sideways part next to its 420 m/s along the body. The angle between them is

$$
\alpha_T = \arctan\frac{60}{420} = \arctan 0.1429 = 8.1^\circ .
$$

**The load.** The next lessons use dynamic pressure times angle of attack as the measure of bending load. Here it jumps to

$$
27.4 \times 8.1 = 223\ \mathrm{kPa\cdot deg},
$$

far beyond what any launcher's structure is certified for. A 30 m/s wind gives $\arctan(30/420) = 4.1^\circ$ and $27.4 \times 4.1 = 112\ \mathrm{kPa\cdot deg}$, still uncomfortable.

**Sanity check.** The small-angle rule gives $60/420 = 0.143\ \mathrm{rad} = 8.2^\circ$, close to the exact $8.1^\circ$.

**What engineers do about it.** On launch day the winds aloft are measured with weather balloons, and the pitch program is reshaped so the vehicle flies with its nose into the *measured* average wind. That leaves only the gusts and shears nobody could predict for the controller to handle.
:::

Rockets rarely measure $\alpha$ directly. The Saturn V carried a **[[Q-ball|q-ball]]** on its nose for this. Most modern launchers instead estimate the angle of attack from their navigation velocity and a wind profile measured before launch, or they infer the normal force from sideways accelerometers in the body — the signal that load-relief control uses. Every one of those paths runs through the geometry above.

::: warning Attitude is not angle of attack
Do not mix up pitch attitude, flight-path angle and angle of attack. Attitude is measured against the horizon (or against fixed stars). Angle of attack is measured against the oncoming air. A vehicle pitched over to $\theta = 66^\circ$ on a gravity turn has $\alpha = 0$. A vehicle holding $\theta$ perfectly still while a gust hits has $\alpha \neq 0$. The controller commands attitude; the structure feels angle of attack.
:::

::: warning Use the right formula for each angle
$\beta = \arcsin(v/V)$ uses the full airspeed $V$, not $u$. And $\alpha = \operatorname{atan2}(w, u)$ is not the same as $\arcsin(w/V)$ — the two agree only when $\beta = 0$. For the small angles of ascent the difference is tiny. For the large angles of a tumbling stage or an engines-first descent it is not, and the wrong formula quietly sends the aerodynamic lookup to the wrong row.
:::

## Check yourself

::: check
A booster descending engines-first has air-relative body-axis velocity $(u, v, w) = (-380, 0, 20)\ \mathrm{m/s}$. Compute $\alpha$ and $\alpha_T$, and explain why plain `atan` would give a wrong answer.
:::

::: answer
**Angle of attack.** $\alpha = \operatorname{atan2}(20, -380) = 177.0^\circ$. The air arrives almost exactly along $-\hat{\mathbf{x}}_b$, tilted $3^\circ$ toward $+z_b$.

**Total angle.** The airspeed is $V = \sqrt{380^2 + 20^2} = \sqrt{144\,800} = 380.5\ \mathrm{m/s}$, so $\alpha_T = \arccos(-380/380.5) = 177.0^\circ$ too. That matches, because $\beta = 0$ here.

**Why not `atan`.** Plain `atan(w/u)` sees only the ratio $20/(-380) = -0.0526$ and returns $\arctan(-0.0526) = -3.0^\circ$. That puts the oncoming air on the wrong end of the vehicle. The aerodynamic database would be read at a nose-first condition that does not exist.
:::

::: check
A vehicle flies a gravity turn with $\gamma = 60^\circ$ and no wind. What is its pitch attitude? Now a wind gives it $\alpha = 2^\circ$ relative to the air while the controller holds the attitude fixed. What is the flight-path angle of the air-relative velocity?
:::

::: answer
**No wind.** A gravity turn has $\alpha = 0$, so $\theta = \gamma + 0 = 60^\circ$.

**With wind.** The attitude stays at $60^\circ$. Apply $\theta = \gamma + \alpha$ to the air-relative velocity: $\gamma_{\text{air}} = \theta - \alpha = 60^\circ - 2^\circ = 58^\circ$. The oncoming air now arrives from $2^\circ$ below the body axis, while the ground-relative velocity is still at $60^\circ$. The normal force acts as if the nose were pitched up $2^\circ$ into the wind.
:::

::: check
Aerodynamic data give $C_N = 0.30$ and $C_A = 0.55$ at $\alpha = 8^\circ$. Find $C_L$ and $C_D$.
:::

::: answer
The coefficients convert exactly like the forces. Use $\cos 8^\circ = 0.9903$ and $\sin 8^\circ = 0.1392$.

$$
C_L = C_N\cos\alpha - C_A\sin\alpha = 0.30 \times 0.9903 - 0.55 \times 0.1392 = 0.2971 - 0.0766 = 0.220,
$$

$$
C_D = C_N\sin\alpha + C_A\cos\alpha = 0.30 \times 0.1392 + 0.55 \times 0.9903 = 0.0418 + 0.5447 = 0.586.
$$

Lift is about a quarter smaller than the normal force, because the large axial force tilts backward with the body. Drag is about 7 % more than the axial force, because the normal force tilts back too.
:::

::: check
A vehicle climbs at 300 m/s through a layer where the crosswind changes from 10 m/s to 50 m/s. If the controller holds the attitude fixed, by how much does the angle of attack change?
:::

::: answer
The crosswind part of the oncoming air changes by $50 - 10 = 40\ \mathrm{m/s}$. So

$$
\Delta\alpha \approx \arctan\frac{40}{300} = 7.6^\circ .
$$

The small-angle rule agrees: $40/300 = 0.133\ \mathrm{rad} = 7.6^\circ$. A 40 m/s change is a strong **wind shear**, but changes of 20–30 m/s over a kilometer of altitude are inside the design envelope at the Cape. A vehicle at 300 m/s covers a kilometer of path in about three seconds — faster than the attitude loop can fully respond.
:::

::: check
Lesson 2's simulated ascent lists only a flight-path angle, yet it also tells you the pitch attitude. Why? When would a real flight show attitude and flight-path angle differing by several degrees?
:::

::: answer
The simulation flew a gravity turn in still air, which means $\alpha = 0$ by definition, so $\theta = \gamma$ at every moment. In a real flight the two differ whenever the vehicle carries an angle of attack:

- a wind turns the air-relative velocity, so the airframe's $\alpha$ is not zero even while the nose follows the ground-relative velocity;
- guidance deliberately steers the nose off the velocity vector;
- load relief turns the nose into a gust.

A few degrees are normal in gusty weather. A steady angle of attack of several degrees at max-Q is a structural problem.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Body frame $B$ | $\hat{\mathbf{x}}_b$ toward the nose; $y_b$, $z_b$ sideways; pitch plane $x_b$–$z_b$ |
| $\mathbf{V} = \mathbf{v} - \mathbf{w}$ | air-relative velocity; components $(u, v, w)$ in body axes |
| $\alpha = \operatorname{atan2}(w, u)$ | angle of attack (in the pitch plane) |
| $\beta = \arcsin(v/V)$ | sideslip angle (out of the pitch plane) |
| $\alpha_T = \arccos(u/V) \approx \sqrt{\alpha^2 + \beta^2}$ | total angle of attack; $\phi_a = \operatorname{atan2}(v, w)$ is the aerodynamic roll angle |
| $\mathbf{C}_{b\leftarrow w}$ | wind-to-body rotation; its first column is $\mathbf{V}_b/V$ |
| $A = D\cos\alpha - L\sin\alpha$, $N = D\sin\alpha + L\cos\alpha$ | body-axis forces from wind-axis forces |
| $L = N\cos\alpha - A\sin\alpha$, $D = N\sin\alpha + A\cos\alpha$ | wind-axis forces from body-axis forces |
| $\theta = \gamma + \alpha$ | attitude, flight-path angle and angle of attack in still air |
| $\Delta\alpha \approx w_\perp/V$ | angle of attack from a crosswind |
| Earth's spin | still air at the Cape moves east at 409 m/s in inertial space |

The next lesson asks *where* along the vehicle the normal force $N$ acts, and compares that point with the center of mass. The distance between them, the static margin, decides whether the air's push straightens the rocket out or tips it further — and for a launch vehicle, it tips it further.

::: context jet-stream Rivers of fast air overhead
The **jet streams** are narrow bands of very fast wind that circle the Earth at about 9 to 16 km up, blowing mostly from west to east. They form where warm tropical air meets cold polar air, and they are strongest in winter.

Airliners ride them eastbound to save fuel. Rockets have no such luck: the jet stream sits right in the altitude band where dynamic pressure peaks, so the fastest winds of the whole climb hit exactly when the vehicle is least able to shrug them off. Launch teams send up weather balloons in the hours before launch to measure it, and scrub when it is too strong.
:::

::: context right-handed The right-hand rule
Point the fingers of your right hand along $\hat{\mathbf{x}}$ and curl them toward $\hat{\mathbf{y}}$. Your thumb then points along $\hat{\mathbf{z}}$. A set of axes that obeys this is **right-handed**.

It matters because every cross product and every rotation formula in the course assumes it. Build a left-handed frame by mistake — flip one axis — and every computed torque, rotation and angle of attack comes out with the wrong sign, while the numbers still look perfectly reasonable. Checking handedness is one of the first things an engineer does with someone else's frame definitions.
:::

::: context corotation Why the air spins with the Earth
Friction with the ground drags the lower atmosphere along with the planet's rotation, so on a calm day the air is still *relative to the ground*. But the ground itself is moving. At the equator the surface travels east at $7.292 \times 10^{-5} \times 6.378 \times 10^6 = 465\ \mathrm{m/s}$. At the Cape, closer to the axis by a factor $\cos 28.5^\circ = 0.879$, it is 409 m/s.

This is the same eastward boost that makes rockets launch toward the east. For aerodynamics, it is a trap: an inertial-frame simulation that forgets to subtract it gives the rocket a 409 m/s gale on the launch pad.
:::

::: context atan2-quadrant Why the nose and tail look alike to arctan
Plain arctangent sees only the ratio $w/u$. For the booster flying engines-first (blue), $u$ is negative, so the ratio is negative and arctan reports about $-3^\circ$ — as if the vehicle were flying nose-first (like the red case) with the air tilted the other way. It cannot tell which end of the rocket the air is hitting. atan2 keeps both signs and puts the angle in the correct half of the circle, near $177^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="aq-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="aq-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="aq-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
  </defs>
  <rect x="120" y="62" width="110" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,62 262,72 230,82" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,66 108,60 108,84 120,78" fill="#6c7a93"/>
  <line x1="180" y1="72" x2="330" y2="72" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#aq-k)"/>
  <text x="318" y="62" font-size="12" fill="#1f2a44">x_b</text>
  <line x1="180" y1="72" x2="295" y2="80" stroke="#b4232c" stroke-width="2.5" marker-end="url(#aq-r)"/>
  <text x="250" y="102" font-size="12" fill="#b4232c">nose-first: α ≈ 3°</text>
  <line x1="180" y1="72" x2="65" y2="80" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#aq-b)"/>
  <text x="20" y="102" font-size="12" fill="#1d6fd1">engines-first: α ≈ 177°</text>
  <text x="180" y="134" font-size="12" fill="#1f2a44" text-anchor="middle">velocity through the air, drawn from the center of mass</text>
</svg>
```
:::

::: context dcm A table of cosines
A **direction-cosine matrix** gets its name from what its entries are. The entry in row $i$, column $j$ is the cosine of the angle between body axis $i$ and wind axis $j$ — which is also the dot product of those two unit vectors.

So the matrix is a lookup table: "how much of each wind-frame arrow lies along each body-frame arrow". You met these in the rotating-frames and attitude modules. Here the same machinery connects the frame the air cares about to the frame the rocket is built in.
:::

::: context coefficient-tables Two pairs of forces, one push
The air gives one total push, drawn here in red. You can split it along the wind axes into lift $L$ and drag $D$ (blue), or along the body axes into normal force $N$ and axial force $A$ (orange). Both splits add back to the same red arrow. The angle is exaggerated to $20^\circ$ so you can see it; on ascent it is a few degrees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ct-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="ct-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="ct-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#f2b880"/></marker>
    <marker id="ct-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6c7a93"/></marker>
  </defs>
  <line x1="40" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ct-k)"/>
  <text x="300" y="148" font-size="12" fill="#6c7a93">V (x_w)</text>
  <line x1="96.6" y1="167.6" x2="331.6" y2="82.1" stroke="#1f2a44" stroke-width="2"/>
  <text x="300" y="80" font-size="12" fill="#1f2a44">body x_b</text>
  <path d="M250,130 A50,50 0 0,0 247.0,112.9" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="256" y="124" font-size="12" fill="#1f2a44">α</text>
  <line x1="200" y1="130" x2="116" y2="74" stroke="#b4232c" stroke-width="2.5" marker-end="url(#ct-r)"/>
  <line x1="200" y1="130" x2="116" y2="130" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ct-b)"/>
  <line x1="200" y1="130" x2="200" y2="74" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ct-b)"/>
  <line x1="200" y1="130" x2="172.2" y2="53.6" stroke="#f2b880" stroke-width="3" marker-end="url(#ct-o)"/>
  <line x1="200" y1="130" x2="143.8" y2="150.4" stroke="#f2b880" stroke-width="3" marker-end="url(#ct-o)"/>
  <text x="100" y="68" font-size="12" fill="#b4232c">F</text>
  <text x="112" y="124" font-size="12" fill="#1d6fd1">D</text>
  <text x="206" y="80" font-size="12" fill="#1d6fd1">L</text>
  <text x="160" y="50" font-size="12" fill="#1f2a44">N</text>
  <text x="128" y="166" font-size="12" fill="#1f2a44">A</text>
</svg>
```
:::

::: context attitude-angles The three angles in one picture
From the side, with the horizon drawn: the flight-path angle $\gamma$ is the tilt of the velocity (blue), the pitch attitude $\theta$ is the tilt of the body (black), and the angle of attack $\alpha$ is the gap between them. Here $\gamma = 30^\circ$ and $\alpha = 12^\circ$, so $\theta = 42^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="aa-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="aa-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
  </defs>
  <line x1="30" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="290" y="162" font-size="12" fill="#6c7a93">horizon</text>
  <line x1="60" y1="170" x2="233.2" y2="70" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#aa-b)"/>
  <text x="240" y="74" font-size="12" fill="#1d6fd1">velocity</text>
  <line x1="60" y1="170" x2="230.9" y2="16.1" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#aa-k)"/>
  <text x="238" y="22" font-size="12" fill="#1f2a44">body axis</text>
  <path d="M120,170 A60,60 0 0,0 112.0,140" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="126" y="156" font-size="12" fill="#1d6fd1">γ</text>
  <path d="M155.3,115 A110,110 0 0,0 141.7,96.4" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="160" y="100" font-size="12" fill="#b4232c">α</text>
  <path d="M210,170 A150,150 0 0,0 171.5,69.6" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="214" y="122" font-size="12" fill="#1f2a44">θ</text>
</svg>
```
:::

::: context gravity-turn Letting gravity do the steering
In a **gravity turn** the rocket launches straight up, tips over by a small angle early on, and from then on keeps its nose pointed along its velocity. Gravity pulls the path over, the nose follows, and the rocket arcs toward horizontal without the engines ever pushing sideways.

The payoff is structural: with the nose on the velocity, the angle of attack is zero through the thick air, so the airframe carries almost no sideways load. You met the gravity turn in the dynamics module; this lesson is where you see *why* launch vehicles fly it.
:::

::: context q-ball A ball that feels the wind
The Saturn V's **Q-ball** was a small cone on the very tip of the launch escape tower, drilled with pressure ports. When the rocket flew straight into the air the ports on opposite sides read the same. When the air arrived at an angle, one side read higher, and the difference measured the angle of attack.

On crewed Apollo flights its readings were shown in the cockpit. A rising angle of attack in the dense air was one of the cues for an abort. Modern launchers mostly estimate $\alpha$ instead of measuring it, because a probe on the nose is one more thing that can ice over or break.
:::
