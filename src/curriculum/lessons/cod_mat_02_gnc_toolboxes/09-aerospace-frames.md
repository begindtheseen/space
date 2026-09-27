---
id: l09-aerospace-frames
title: 'Aerospace frames: ECI, ECEF, NED, ENU, body, wind, stability'
minutes: 25
covers:
  - 'Aerospace frames: ECI, ECEF, NED, ENU, body, wind, stability'
---

Ask a friend for directions and you might hear "turn left at the gas station". Ask a map and it says "go north on Main Street". Ask a pilot and you get "heading 010". All three can describe the same trip, but each one is measured from a different starting point and a different set of directions. "Left" depends on which way you are facing. "North" does not. If you mix them up, you end up in the wrong town.

A **coordinate frame** is exactly such an agreement: an **origin** (the point you measure from) and three perpendicular **axes** (the directions you measure along). A vector such as a position or a velocity is only three numbers until you say which frame they belong to. Say it, and the numbers mean something.

A GNC engineer lives among many frames at once. The orbit is integrated in one frame, the GPS receiver reports in another, the gyros measure in a third, and the aerodynamic forces are easiest to write in a fourth. Most painful bugs in flight software are not wrong physics. They are right numbers in the wrong frame. The last lesson scheduled gains on Mach, which the navigation system computes from velocity; this lesson names the frames that velocity can live in and shows the Aerospace Toolbox commands that move a vector between them.

## Frames and the matrices between them

Every frame in this lesson is **right-handed**: point the fingers of your right hand along $x$, curl them toward $y$, and your thumb points along $z$. Every frame has three axes of unit length, each perpendicular to the other two.

To move a vector from frame $a$ to frame $b$ you multiply by a $3 \times 3$ rotation matrix, often called a **[[direction cosine matrix|dcm-name]]** or DCM. We will write it $\mathbf{C}_{ba}$, read "C, b from a":

$$
\mathbf{v}_b = \mathbf{C}_{ba}\,\mathbf{v}_a
$$

A rotation matrix has one gift that makes frame work bearable. Its inverse is its transpose, $\mathbf{C}_{ab} = \mathbf{C}_{ba}^{\mathsf{T}}$. Going back costs nothing but a transpose, written `C'` in MATLAB. How to *build* rotation matrices from angles and quaternions is lesson 10's subject. This lesson is about *which* frames exist and what each is good for.

::: warning A vector without a frame is a bug waiting
Name every variable with its frame: `r_ecef`, `v_ned`, `w_body`. Code that adds `v_ned` to `v_ecef` runs without complaint and produces garbage. The name is the cheapest test you will ever write.
:::

## ECI: the frame that does not spin

Picture Earth as a merry-go-round. If you stand on it, a ball you roll "straight" appears to curve. If you stand on the ground beside it, the ball goes straight and the merry-go-round turns underneath. Newton's laws in their simple form, force equals mass times acceleration, hold only for the observer on the ground. A frame where they hold is called **inertial**.

The **Earth-centered inertial** frame, **ECI**, has its origin at Earth's center of mass and axes that do not rotate relative to the distant stars:

- $z$ points along Earth's spin axis, toward the North Pole.
- $x$ points toward the **[[vernal equinox|vernal-equinox]]**, a fixed direction in the sky.
- $y$ completes the right-handed set, in the equatorial plane.

The precise versions (J2000, and the modern GCRF) pin these directions at a chosen date, because Earth's axis itself wobbles slowly. For our purposes ECI is the frame where orbits, and any long flight, are integrated.

## ECEF: the frame that turns with Earth

The **Earth-centered, Earth-fixed** frame, **ECEF**, also has its origin at Earth's center, but its axes are glued to the planet:

- $z$ points toward the North Pole.
- $x$ points to where the equator meets the **[[prime meridian|prime-meridian]]** (zero longitude).
- $y$ points to where the equator meets longitude $90^\circ$ east.

A launch pad, a radar and a GPS ground station all sit still in ECEF. That makes it the natural frame for anything tied to the ground.

ECEF turns relative to ECI once per **[[sidereal day|sidereal-day]]**, at the rate

$$
\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}
$$

read "omega sub E". Check it: one full turn takes $\frac{2\pi}{7.292115 \times 10^{-5}} \approx 86\,164\,\mathrm{s}$, about $23.93$ hours, a little under a solar day.

If you ignore the slow wobbles of the axis, the two frames differ by a single rotation about the shared $z$ axis, by the angle $\theta(t) = \theta_0 + \omega_E t$, where $\theta_0$ is the angle at some starting instant. Real conversions add small corrections for precession, nutation and polar motion. The Aerospace Toolbox's `dcmeci2ecef` builds the full matrix for a given UTC time, and `lla2eci` and `eci2lla` convert positions directly.

### What the rotation costs you

Two things change when you step from ECI into ECEF.

**Velocity picks up an extra term.** A point sitting still in ECEF is moving in ECI, carried around by the spin. Its speed is $\omega_E$ times its distance from the spin axis:

$$
\mathbf{v}_{\text{ECI}} = \mathbf{v}_{\text{ECEF}} + \boldsymbol{\omega}_E \times \mathbf{r}
$$

(with both sides written in the same axes at that instant). At the equator that extra speed is $7.292115 \times 10^{-5} \times 6\,378\,137 \approx 465.1\,\mathrm{m/s}$. That free eastward speed is why rockets launch east.

**Acceleration picks up two extra terms.** Newton's law, rewritten for someone riding the merry-go-round, becomes

$$
\ddot{\mathbf{r}} = \frac{\mathbf{F}}{m} - 2\,\boldsymbol{\omega}_E \times \dot{\mathbf{r}} - \boldsymbol{\omega}_E \times (\boldsymbol{\omega}_E \times \mathbf{r})
$$

where every vector is in ECEF. The term $-2\,\boldsymbol{\omega}_E \times \dot{\mathbf{r}}$ is the **[[Coriolis|coriolis]]** acceleration: it pushes a moving body sideways. The term $-\boldsymbol{\omega}_E \times (\boldsymbol{\omega}_E \times \mathbf{r})$ is the **centrifugal** acceleration: it pushes outward from the spin axis. Neither is a real force. Both appear because the frame is turning.

::: key
ECI is non-rotating (inertial) and ECEF rotates with the Earth at about 7.292e-5 rad/s. Integrating dynamics in ECEF without Coriolis and centrifugal terms, or comparing states across the two without the rotation, gives errors that grow with time and latitude.
:::

::: example How big are the missing terms?
A vehicle flies north at $1000\,\mathrm{m/s}$ above Cape Canaveral, latitude $28.5729^\circ$.

**Coriolis.** Only the part of Earth's spin along the local vertical turns a horizontal velocity, and that part is $\omega_E \sin\varphi$, where $\varphi$ (read "phi") is the latitude. So the sideways acceleration is $2\,\omega_E v \sin\varphi$. With $\sin 28.5729^\circ \approx 0.4783$: $2 \times 7.292115 \times 10^{-5} \times 1000 \times 0.4783 \approx 0.0698\,\mathrm{m/s^2}$, pushing east (to the right, as always in the northern hemisphere).

**Over time.** Leave that out of an ECEF simulation for $100\,\mathrm{s}$ and the position error is $\tfrac{1}{2} \times 0.0698 \times 100^2 \approx 349\,\mathrm{m}$. It grows with the square of time, and with $\sin\varphi$, so it is zero at the equator and largest at the poles.

**Centrifugal.** At the equator, $\omega_E^2 R = (7.292115 \times 10^{-5})^2 \times 6\,378\,137 \approx 0.0339\,\mathrm{m/s^2}$, about $0.35\%$ of gravity.

**Comparing across frames.** Line up the ECI and ECEF axes at one instant. One minute later, the Earth has turned $\omega_E \times 60\,\mathrm{s} \approx 0.25^\circ$. A launch pad at the Cape, $5\,605\,635\,\mathrm{m}$ from the spin axis, has moved about $408.8 \times 60 \approx 24\,500\,\mathrm{m}$ in ECI. Compare an ECEF position with an ECI position from a minute later and you have a 24.5 km "error" that is only bookkeeping.

**Sanity check.** These accelerations are tiny next to gravity, which is why short tests can hide the mistake. The position errors, which grow with time, are what give it away.
:::

::: warning Even at the instant the axes line up, velocities differ
At the moment ECI and ECEF axes coincide, positions agree, but velocities do not. A rocket sitting on the pad at the Cape has zero ECEF velocity and about $408.8\,\mathrm{m/s}$ ECI velocity. Always convert velocity with the $\boldsymbol{\omega}_E \times \mathbf{r}$ term.
:::

## Latitude, longitude, altitude and WGS84

People do not give positions as ECEF $x$, $y$, $z$. They give **latitude**, **longitude** and **altitude**, called **LLA** or **geodetic coordinates**. To convert, you need the shape of the Earth.

Earth is not a sphere. It spins, so it bulges at the equator, like a ball of dough spun on a finger. The standard model is the **WGS84** ellipsoid, the same one GPS uses. Two numbers define it:

- Equatorial radius (semi-major axis): $a = 6\,378\,137\,\mathrm{m}$ exactly.
- Flattening: $f = 1/298.257223563$.

From these, the polar radius is $b = a(1 - f) \approx 6\,356\,752.3\,\mathrm{m}$, about $21.4\,\mathrm{km}$ shorter. A number used everywhere is the **first eccentricity squared**, $e^2 = f(2 - f) \approx 0.00669438$.

**[[Geodetic latitude|geodetic-latitude]]** $\varphi$ is the angle between the equatorial plane and the line *perpendicular to the ellipsoid* at your spot, which is the direction a plumb bob hangs, near enough. Longitude $\lambda$ (read "lambda") is the angle east of the prime meridian. Altitude $h$ is the height above the ellipsoid along that perpendicular.

The conversion to ECEF uses a helper radius $N$, the distance along the perpendicular from the surface to the spin axis:

$$
N = \frac{a}{\sqrt{1 - e^2 \sin^2\varphi}}
$$

$$
\begin{aligned}
x &= (N + h)\cos\varphi\cos\lambda \\
y &= (N + h)\cos\varphi\sin\lambda \\
z &= \left(N(1 - e^2) + h\right)\sin\varphi
\end{aligned}
$$

Two quick checks. At the equator and prime meridian at sea level, $\varphi = \lambda = h = 0$, so $N = a$ and the point is $(a, 0, 0)$. At the North Pole, $N = a / \sqrt{1 - e^2}$, and $z = N(1 - e^2) = a\sqrt{1 - e^2} = b$, the polar radius. Both are right.

In MATLAB's Aerospace Toolbox, `lla2ecef(lla)` does this, with `lla` an $n \times 3$ array of `[latitude longitude altitude]` in degrees, degrees and meters, and WGS84 as the default ellipsoid. `ecef2lla` goes back.

::: key
`lla2ecef([lat lon alt])` takes degrees, degrees, meters and returns ECEF meters on the WGS84 ellipsoid ($a = 6\,378\,137\,\mathrm{m}$, $f = 1/298.257223563$). Geodetic latitude is measured to the ellipsoid's perpendicular, not to Earth's center.
:::

::: example Cape Canaveral in ECEF, by hand
The launch-site reference point is latitude $28.5729^\circ$, longitude $-80.6490^\circ$ (west is negative), altitude $3\,\mathrm{m}$.

**Sines and cosines.** $\sin\varphi \approx 0.478277$, $\cos\varphi \approx 0.878209$, $\cos\lambda \approx 0.162482$, $\sin\lambda \approx -0.986711$.

**The helper radius.** $e^2 \sin^2\varphi \approx 0.00669438 \times 0.228748 \approx 0.00153133$. So $N = \frac{6\,378\,137}{\sqrt{0.99846867}} \approx 6\,383\,026.1\,\mathrm{m}$, about $4.9\,\mathrm{km}$ more than $a$.

**The coordinates.** $(N + h)\cos\varphi \approx 5\,605\,635\,\mathrm{m}$ is the distance from the spin axis. Multiply by $\cos\lambda$ and $\sin\lambda$: $x \approx 910\,816\,\mathrm{m}$ and $y \approx -5\,531\,145\,\mathrm{m}$. And $z = (N(1 - e^2) + h)\sin\varphi \approx 6\,340\,299 \times 0.478277 \approx 3\,032\,416\,\mathrm{m}$.

```matlab
xyz_ref = lla2ecef([28.5729, -80.6490, 3.0])
%   xyz_ref = 1.0e+06 *
%       0.9108   -5.5311    3.0324
```

**Sanity check.** The length of $(x, y, z)$ comes to about $6\,373\,\mathrm{km}$, between the polar and equatorial radii, as it should be for a point at mid-latitude. And $y$ is large and negative because $-80.6^\circ$ is nearly a quarter-turn west of Greenwich.
:::

## NED and ENU: flat maps stuck to one spot

For anything near the ground, ECEF numbers are awkward. A rocket climbing a kilometer changes all three ECEF coordinates at once. What you want is "how far north, how far east, how far down".

That is the **north-east-down** frame, **NED**. Pick a reference point on the ground. At that point:

- $N$ points toward true north, level with the ground.
- $E$ points east, level with the ground.
- $D$ points down, along the ellipsoid's perpendicular.

Aircraft and most flight-dynamics code use NED, because "down" lines up with gravity and with the aircraft's own $z$ axis. The **east-north-up** frame, **ENU**, has the same idea with different axes: $x$ east, $y$ north, $z$ up. Surveyors, many GPS tools and the **[[robotics world|ros-enu]]** prefer it. To go from NED to ENU, swap the first two components and flip the sign of the third:

$$
\begin{bmatrix} E \\ N \\ U \end{bmatrix} =
\begin{bmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & -1 \end{bmatrix}
\begin{bmatrix} N \\ E \\ D \end{bmatrix}
$$

The rotation from ECEF to NED at geodetic latitude $\varphi$ and longitude $\lambda$ is

$$
\mathbf{C}_{ne} =
\begin{bmatrix}
-\sin\varphi\cos\lambda & -\sin\varphi\sin\lambda & \cos\varphi \\
-\sin\lambda & \cos\lambda & 0 \\
-\cos\varphi\cos\lambda & -\cos\varphi\sin\lambda & -\sin\varphi
\end{bmatrix}
$$

Each row is one NED axis written in ECEF components. Check the last row at the North Pole ($\varphi = 90^\circ$): it becomes $(0, 0, -1)$, pointing down the spin axis, which is exactly "down" there. In MATLAB, `dcmecef2ned(lat, lon)` returns this matrix, with the angles in degrees.

The reference point is the key word. The matrix depends on $\varphi$ and $\lambda$. Move somewhere else and "down" points in a different direction through the Earth. So NED is a **[[local frame|local-frame]]**: it belongs to one spot.

::: key
NED's axes are defined relative to the local vertical and the local meridian, so they rotate as you move over the Earth. A trajectory spanning hundreds of kilometres cannot use a single NED frame; integrate in ECI or ECEF and convert for reporting.
:::

How far is "hundreds of kilometers"? Over a distance $d$ on a sphere of radius about $6371\,\mathrm{km}$, the ground drops away from a flat tangent plane by roughly $\frac{d^2}{2R}$, and the local vertical tilts by $\frac{d}{R}$ radians. At $10\,\mathrm{km}$ the drop is about $7.8\,\mathrm{m}$. At $100\,\mathrm{km}$ it is about $785\,\mathrm{m}$ with a tilt of $0.9^\circ$. At $300\,\mathrm{km}$ it is about $7.1\,\mathrm{km}$ with a tilt of $2.7^\circ$. A flat-Earth NED frame is fine for a landing approach and useless for an ascent downrange.

::: example ECEF to NED and back
A second point lies to the north-east and $2000\,\mathrm{m}$ higher: latitude $28.6629^\circ$, longitude $-80.5470^\circ$, altitude $2003\,\mathrm{m}$. Find its offset from the reference point in NED, then go back to ECEF and measure the round-trip error.

```matlab
lla_ref = [28.5729, -80.6490, 3.0];
lla_pt  = [28.6629, -80.5470, 2003.0];

xyz_ref = lla2ecef(lla_ref);
xyz_pt  = lla2ecef(lla_pt);

C   = dcmecef2ned(lla_ref(1), lla_ref(2));   % ECEF -> NED at the reference point
d   = (xyz_pt - xyz_ref)';                    % ECEF offset as a column, m
ned = C*d
%   ned =
%      1.0e+03 *
%       9.9820
%       9.9740
%      -1.9844

back = xyz_ref + (C'*ned)';                   % NED -> ECEF with the transpose
err  = norm(back - xyz_pt)                    % zero, or a few nanometers
```

**Step by step.** The ECEF offset is about $(9348.9,\ 4611.8,\ 9715.4)\,\mathrm{m}$, $14\,249.9\,\mathrm{m}$ long. Rotated into NED it becomes about $9982.0\,\mathrm{m}$ north, $9974.0\,\mathrm{m}$ east and $-1984.4\,\mathrm{m}$ down.

**Sanity checks.** North: $0.09^\circ$ of latitude at about $111\,\mathrm{km}$ per degree is about $10\,\mathrm{km}$. East: $0.102^\circ$ of longitude, shrunk by $\cos 28.6^\circ$, is also about $10\,\mathrm{km}$. Down is $-1984.4$, not $-2000$: the point is $2000\,\mathrm{m}$ higher, but it is $14\,\mathrm{km}$ away, and the ground curves down by about $\frac{14\,100^2}{2 \times 6\,371\,000} \approx 15.6\,\mathrm{m}$ over that distance. $2000 - 15.6 = 1984.4$. The curvature shows up even at this small range.

**Round trip.** Because $\mathbf{C}^{\mathsf{T}}$ is the exact inverse of $\mathbf{C}$, going there and back loses only floating-point rounding. An independent implementation in Octave of the formulas above gives the same NED numbers to $0.1\,\mathrm{m}$ and a round-trip error of zero at double precision; anything above about $10^{-6}\,\mathrm{m}$ would mean a bug.
:::

::: warning Rotate the offset, not the point
`dcmecef2ned` rotates *directions*. Apply it to the ECEF difference `xyz_pt - xyz_ref`, never to `xyz_pt` alone. Rotating an absolute ECEF position gives a vector about $6400\,\mathrm{km}$ long pointing mostly "up", not an offset. And note the shapes: `lla2ecef` returns a row, and `C*d` needs a column, hence the transposes.
:::

## Body, stability and wind frames

The last three frames ride with the vehicle itself.

The **body frame** is glued to the airframe, with its origin at the center of gravity. For an aircraft, $x$ points out the nose, $y$ out the right wing, and $z$ down through the belly. For a launch vehicle, $x$ points along the long axis toward the nose; on the pad it points straight up. The gyros and accelerometers of the inertial measurement unit measure in (a frame fixed to) the body, and thrust and control torques are simplest here.

But the air does not care where the nose points. It cares which way the vehicle is *moving* through it. Let the velocity relative to the air, written in body axes, be $(u, v, w)$ with speed $V = \sqrt{u^2 + v^2 + w^2}$. Two angles describe how the air meets the body:

- **[[Angle of attack|alpha-beta]]** $\alpha = \operatorname{atan2}(w, u)$ ("alpha"): how far the nose is pitched above the oncoming air.
- **Sideslip angle** $\beta = \arcsin(v / V)$ ("beta"): how far the air comes from the side.

Those angles define two more frames:

- The **stability frame** is the body frame turned by $\alpha$ about the body $y$ axis, so its $x$ axis lies along the velocity's projection onto the body's plane of symmetry. Linearized aircraft models, such as the short-period and Dutch-roll modes, are usually written here.
- The **wind frame** is the stability frame turned by $\beta$ about its $z$ axis, so its $x$ axis points exactly along the air-relative velocity. **Lift** and **drag** are defined in this frame: drag along $-x$, lift along $-z$.

In MATLAB, `dcmbody2wind(alpha, beta)` returns the rotation from body to wind axes, with the angles in radians.

::: key
Body axes: fixed to the vehicle ($x$ nose, $y$ right, $z$ down). Stability axes: body turned by $\alpha$ about $y$. Wind axes: stability turned by $\beta$ about $z$, so $x_w$ lies along the air-relative velocity. $\alpha = \operatorname{atan2}(w, u)$ and $\beta = \arcsin(v/V)$.
:::

::: example Angles from an air-data velocity
An aircraft's air data system reports body-axis air velocity $(u, v, w) = (249.24,\ 8.72,\ 17.43)\,\mathrm{m/s}$.

**Speed.** $V = \sqrt{249.24^2 + 8.72^2 + 17.43^2} \approx 250.0\,\mathrm{m/s}$.

**Angle of attack.** $\alpha = \operatorname{atan2}(17.43, 249.24) \approx 4.00^\circ$. Positive $w$ means the vehicle is moving slightly toward its own belly, so the air meets it from below and the nose sits above the flight path.

**Sideslip.** $\beta = \arcsin(8.72 / 250.0) \approx 2.00^\circ$: the air arrives slightly from the right.

**Into wind axes.**

```matlab
Cwb   = dcmbody2wind(deg2rad(4), deg2rad(2));
v_w   = Cwb*[249.24; 8.72; 17.43]      % approximately [250.0; 0; 0]
```

**Sanity check.** In wind axes the whole velocity lies along $x$, with zero side and vertical parts. That is the definition of the wind frame, so it confirms both angles and the matrix.
:::

## Checking against an independent implementation

On a real team, a frame conversion is not trusted because a toolbox function returned numbers. It is trusted because two independent implementations agree. A common habit is to write the WGS84 formulas yourself, in a few lines of MATLAB or Python, and compare:

```matlab
function xyz = myLla2ecef(lla)
    a  = 6378137.0;                  % WGS84 semi-major axis, m
    f  = 1/298.257223563;            % WGS84 flattening
    e2 = f*(2 - f);                  % first eccentricity squared
    lat = deg2rad(lla(:,1));  lon = deg2rad(lla(:,2));  h = lla(:,3);
    N  = a ./ sqrt(1 - e2*sin(lat).^2);
    xyz = [(N + h).*cos(lat).*cos(lon), ...
           (N + h).*cos(lat).*sin(lon), ...
           (N*(1 - e2) + h).*sin(lat)];
end
```

Then assert that `norm(myLla2ecef(lla) - lla2ecef(lla))` is below a millimeter for a spread of test points: the equator, both poles, the Cape, a high altitude. Put that check in a test file, and the next person who "improves" the frame code finds out at once if they broke it.

## Check yourself

::: check
A ground station is at latitude $0^\circ$, longitude $90^\circ$, altitude $0$. Without a computer, what are its ECEF coordinates, and what is its speed in ECI?
:::

::: answer
On the equator $\varphi = 0$, so $N = a$ and $\sin\varphi = 0$. Then $x = a\cos 0^\circ\cos 90^\circ = 0$, $y = a\cos 0^\circ\sin 90^\circ = a = 6\,378\,137\,\mathrm{m}$, and $z = 0$. The station is on the ECEF $y$ axis, as the definition says. It is $a$ from the spin axis, so its ECI speed is $\omega_E a \approx 465.1\,\mathrm{m/s}$, eastward.
:::

::: check
A simulation integrates a sounding rocket in ECEF using only gravity and thrust. It flies straight up at an average of $800\,\mathrm{m/s}$ for $120\,\mathrm{s}$ at latitude $30^\circ$. Estimate the size and direction of the Coriolis effect it misses.
:::

::: answer
For vertical motion, the part of Earth's spin that matters is the horizontal part, $\omega_E\cos\varphi$. The acceleration is $2\,\omega_E v\cos\varphi = 2 \times 7.292115 \times 10^{-5} \times 800 \times 0.866 \approx 0.101\,\mathrm{m/s^2}$, toward the west (rising bodies drift west). Over $120\,\mathrm{s}$ that gives roughly $\tfrac{1}{2} \times 0.101 \times 120^2 \approx 727\,\mathrm{m}$ of westward drift the simulation will not show.
:::

::: check
A test flight's telemetry is plotted in a single NED frame centered at the launch site. The vehicle lands $250\,\mathrm{km}$ downrange, and the plot shows it ending "$4.9\,\mathrm{km}$ below ground". What happened?
:::

::: answer
Nothing happened to the vehicle; the frame is the problem. The NED frame's "down" is fixed at the launch site. $250\,\mathrm{km}$ away, the Earth's surface has curved below that flat plane by about $\frac{250\,000^2}{2 \times 6\,371\,000} \approx 4.9\,\mathrm{km}$. A single NED frame cannot represent a trajectory that long. Convert each point to LLA (or to NED at its own location) for the altitude plot.
:::

::: check
Why does `dcmecef2ned` need only latitude and longitude, and not altitude?
:::

::: answer
The NED axes depend only on direction: north, east and the ellipsoid's perpendicular at that spot. All three are the same for every point on the same vertical line, whatever the altitude. Altitude moves the origin along the $D$ axis but does not turn the axes, and a rotation matrix describes only the turn. The origin enters when you subtract the reference ECEF position, which does use altitude.
:::

::: check
An aircraft's body-axis air velocity is $(u, v, w) = (180, 0, -9.4)\,\mathrm{m/s}$. Find $\alpha$ and $\beta$, and say what the sign of $\alpha$ means.
:::

::: answer
$\beta = \arcsin(0) = 0$, since $v = 0$. $\alpha = \operatorname{atan2}(-9.4, 180) \approx -2.99^\circ$, about $-3^\circ$. Negative angle of attack means the vehicle is moving slightly toward its own back, so the air meets it from above and the nose points below the flight path, as in a dive or a pushover. The wind frame is then the body frame turned by $-3^\circ$ about $y$.
:::

## Summary

| Frame | Origin and axes | Used for |
|---|---|---|
| ECI | Earth's center; $z$ spin axis, $x$ vernal equinox; does not rotate | orbits, long trajectories, Newton's law as written |
| ECEF | Earth's center; $z$ North Pole, $x$ Greenwich on the equator; turns at $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$ | ground sites, GPS; needs Coriolis and centrifugal terms |
| LLA | geodetic latitude, longitude, altitude on WGS84 | human-readable positions; `lla2ecef`, `ecef2lla` |
| NED / ENU | a reference point; north, east, down (or east, north, up) | local navigation and reporting; `dcmecef2ned` |
| Body | vehicle CG; $x$ nose, $y$ right, $z$ down | sensors, thrust, torques |
| Stability | body turned by $\alpha$ about $y$ | linearized aircraft models |
| Wind | stability turned by $\beta$ about $z$ | lift, drag, airspeed |

Key relations: $\mathbf{v}_b = \mathbf{C}_{ba}\mathbf{v}_a$ and $\mathbf{C}_{ab} = \mathbf{C}_{ba}^{\mathsf{T}}$; $\mathbf{v}_{\text{ECI}} = \mathbf{v}_{\text{ECEF}} + \boldsymbol{\omega}_E \times \mathbf{r}$.

Next lesson: every arrow between frames here was a rotation matrix handed over by a toolbox. Lesson 10 builds those rotations from Euler angles and quaternions with `angle2dcm`, `dcm2quat` and friends, and meets the scalar-first quaternion convention that finishes the frames exercise.

::: context dcm-name Why "direction cosine"
Each entry of a rotation matrix is the cosine of the angle between one axis of the old frame and one axis of the new frame. The entry in row 2, column 3 of $\mathbf{C}_{ba}$, for instance, is the cosine of the angle between $b$'s $y$ axis and $a$'s $z$ axis. Nine cosines, nine angles between axes, hence "direction cosine matrix". Since each row is a unit vector and the rows are perpendicular, the transpose undoes the matrix.
:::

::: context vernal-equinox A direction pinned to the sky
The vernal equinox is where the Sun crosses the celestial equator heading north, around March 20 each year. The line from Earth toward that point on the sky makes a direction that does not turn with the Earth's daily spin. It does drift very slowly, about one full circle in some 26,000 years, because Earth's axis precesses like a tilted top. So precise frames name a date: J2000 uses the direction at noon on January 1, 2000.
:::

::: context prime-meridian Where zero longitude lives
Zero longitude was agreed at an international conference in Washington in 1884, running through the Royal Observatory at Greenwich, England. Today's reference meridian, kept by the International Earth Rotation and Reference Service and used by GPS, runs about $100\,\mathrm{m}$ east of the old telescope line at Greenwich. If you stand on the brass strip there with a GPS receiver, it reads a tiny bit west of zero.
:::

::: context sidereal-day A day measured by the stars
A solar day, $86\,400\,\mathrm{s}$, is the time from noon to noon. During that time Earth also moves about one degree along its orbit, so it must turn a little more than one full revolution to face the Sun again. Measured against the stars, one true revolution takes about $86\,164\,\mathrm{s}$, the sidereal day. That is why $\omega_E$ is $2\pi$ divided by $86\,164\,\mathrm{s}$, not by $86\,400\,\mathrm{s}$.
:::

::: context coriolis The sideways push on a turning floor
Gaspard-Gustave de Coriolis, a French engineer, worked out this term in 1835 while studying machines with rotating parts. On Earth it turns large moving air masses, giving hurricanes their spin (counterclockwise in the north). For a rocket it is small but steady, and a guidance system that ignores it lands its payload in the wrong place. In the example it pushes a northbound vehicle east, to its right.
:::

::: context geodetic-latitude Two latitudes that differ
On a squashed Earth, the perpendicular to the surface does not pass through the center. Geodetic latitude $\varphi$ uses the perpendicular, the direction "down" really points. Geocentric latitude $\psi$ uses the line to the center. The two differ by up to about $0.19^\circ$ near latitude $45^\circ$, a latitude difference worth about $21\,\mathrm{km}$ on the ground. Maps and `lla2ecef` use geodetic latitude.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="110" rx="140" ry="90" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="110" x2="270" y2="41" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="233" y1="110" x2="282" y2="19" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="270" cy="41" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="110" r="3" fill="#1f2a44"/>
  <text x="150" y="128" font-size="11" fill="#1f2a44">center</text>
  <text x="200" y="104" font-size="12" fill="#1d6fd1">ψ</text>
  <text x="246" y="104" font-size="12" fill="#b4232c">φ</text>
  <text x="290" y="24" font-size="11" fill="#b4232c">perpendicular</text>
  <text x="120" y="60" font-size="11" fill="#1d6fd1">line to center</text>
  <text x="40" y="200" font-size="11" fill="#6c7a93">flattening greatly exaggerated</text>
</svg>
```
:::

::: context ros-enu Who uses ENU
The Robot Operating System (ROS), used widely in robotics research and on many drones, standardizes on east-north-up for its local world frames in its convention document REP 103. Surveying and many GPS processing tools also report local offsets as east, north, up. Aircraft and missile flight dynamics grew up with north-east-down. So a GNC engineer working near a robotics team will convert between the two often, and the swap-and-flip matrix is worth knowing by heart.
:::

::: context local-frame Down points somewhere different everywhere
Here are NED frames at two latitudes on the same meridian. At each spot, D points toward the inside of the Earth along that spot's perpendicular, and N lies along the surface toward the pole. The two frames are turned relative to each other by the difference in latitude. That is the whole reason a single NED frame cannot describe a long trajectory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="120" r="80" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="20" x2="180" y2="205" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <text x="186" y="18" font-size="11" fill="#6c7a93">spin axis</text>
  <line x1="100" y1="120" x2="260" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 4"/>
  <circle cx="255" cy="93" r="4" fill="#1f2a44"/>
  <line x1="255" y1="93" x2="229" y2="102" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="255" y1="93" x2="246" y2="67" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="222" y="116" font-size="12" fill="#b4232c">D</text>
  <text x="250" y="64" font-size="12" fill="#1d6fd1">N</text>
  <text x="264" y="98" font-size="11" fill="#1f2a44">latitude 20°</text>
  <circle cx="220" cy="51" r="4" fill="#1f2a44"/>
  <line x1="220" y1="51" x2="206" y2="75" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="220" y1="51" x2="196" y2="37" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="196" y="88" font-size="12" fill="#b4232c">D</text>
  <text x="184" y="36" font-size="12" fill="#1d6fd1">N</text>
  <text x="230" y="46" font-size="11" fill="#1f2a44">latitude 60°</text>
</svg>
```
:::

::: context alpha-beta Nose versus flight path
Angle of attack is the angle between where the nose points (body $x$) and where the vehicle is actually going through the air. Wings make lift in proportion to it at small angles, and a rocket's aerodynamic turning moment, the $M_\alpha$ of lesson 08, grows with it too. Sideslip is the same idea sideways.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="110" x2="300" y2="110" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="306,110 294,104 294,116" fill="#1d6fd1"/>
  <line x1="60" y1="110" x2="292" y2="48" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="298,46 285,44 289,56" fill="#1f2a44"/>
  <path d="M190,110 A130,130 0 0 0 186,76" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="98" font-size="13" fill="#b4232c">α</text>
  <text x="240" y="40" font-size="11" fill="#1f2a44">body x (nose)</text>
  <text x="230" y="128" font-size="11" fill="#1d6fd1">air-relative velocity</text>
  <text x="60" y="30" font-size="11" fill="#6c7a93">side view, angle exaggerated</text>
</svg>
```
:::
