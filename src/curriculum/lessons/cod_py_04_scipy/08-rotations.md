---
id: l08-rotations
title: Rotations with SciPy
minutes: 19
covers:
  - 'scipy.spatial.transform.Rotation: from_quat, as_quat, from_euler, as_matrix, slerp'
---

Pick up a book lying flat on a table and turn it a quarter turn to the left. Now describe what you did. You could say "a quarter turn left, about the up direction". You could list where each edge of the book ended up. You could give three angles, the way a pilot reports heading, pitch and bank. Or you could give four strange numbers called a **[[quaternion|hamilton]]**. All four descriptions are the *same turn*. They are different spellings of one thing.

A spacecraft's **attitude** — which way it is pointing — is exactly this kind of thing. The **[[star tracker|star-tracker]]** reports it as a quaternion. The guidance engineer thinks in angles. The physics code multiplies vectors by a matrix. Converting between those spellings by hand is where many attitude bugs are born.

SciPy's answer is one class: `scipy.spatial.transform.Rotation`. You build a `Rotation` from whatever spelling you have — `from_quat`, `from_euler`, `from_matrix`, `from_rotvec` — and read it back in whatever spelling you need — `as_quat`, `as_euler`, `as_matrix`, `as_rotvec`. In between, the object does the bookkeeping. This lesson teaches you to use it: the matrix, the angles, the quaternion, putting turns together, and smoothly blending between two attitudes with **slerp**.

## One object, many spellings

Here is the quarter turn about the up axis, built from an angle and read back three ways:

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

r = R.from_euler("z", 90, degrees=True)    # a quarter turn about z
print(r.as_matrix().round(3))
# [[ 0. -1.  0.]
#  [ 1.  0.  0.]
#  [ 0.  0.  1.]]
print(r.apply([1.0, 0.0, 0.0]).round(3))   # [0. 1. 0.]
print(r.as_quat().round(4))                # [0.     0.     0.7071 0.7071]
print(r.as_rotvec().round(4))              # [0.     0.     1.5708]
```

Line by line:

- `R.from_euler("z", 90, degrees=True)` builds the turn: 90 degrees about the $z$ axis. Without `degrees=True`, SciPy reads angles in radians.
- `as_matrix()` spells it as a $3 \times 3$ matrix.
- `apply(v)` turns a vector. The $x$ axis, $[1, 0, 0]$, swings round to point along $y$, $[0, 1, 0]$. That matches the picture: a quarter turn left, seen from above.
- `as_quat()` gives four numbers. We will decode them below.
- `as_rotvec()` gives the **rotation vector**: an arrow along the turning axis whose length is the angle in radians. Here it points along $z$ with length $\pi/2 \approx 1.5708$.

Which way is "positive" for a turn? SciPy uses the **[[right-hand rule|right-hand-rule]]**: point your right thumb along the axis, and your fingers curl in the positive direction. A positive turn about $z$ carries $x$ toward $y$.

::: key
A `Rotation` stores one attitude. Build it with `from_quat`, `from_euler`, `from_matrix` or `from_rotvec`; read it with `as_quat`, `as_euler`, `as_matrix` or `as_rotvec`; turn vectors with `apply`.
:::

## The rotation matrix

The matrix is the spelling physics code uses most, because turning a vector is then one matrix multiply. It is often called the **[[direction cosine matrix|dcm-name]]**, or DCM.

There is a simple way to read one. **Each column is where an axis ends up.** In the quarter-turn matrix above, the first column is $[0, 1, 0]$: the $x$ axis now points along $y$. The second column is $[-1, 0, 0]$: the $y$ axis now points along $-x$. The third column is $[0, 0, 1]$: the $z$ axis did not move. Try it with the book on the table.

Because a rotation does not stretch or bend anything, every rotation matrix $\mathbf{C}$ has three properties:

- each column has length 1, and the columns are at right angles to each other (the matrix is **orthonormal**);
- its **transpose** $\mathbf{C}^\mathsf{T}$ (rows and columns swapped, read "C transpose") is its inverse: $\mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{I}$, the identity matrix;
- its **determinant** is $+1$. A determinant of $-1$ would be a mirror, not a turn.

### Two readings of the same matrix

On a vehicle you usually have two frames. A **frame** is a set of three axes. The **body frame** is glued to the vehicle: $x$ out the nose, $y$ out the right side, $z$ out the belly. A navigation frame is glued to the ground; a common one is **[[NED|ned-frame]]**: north, east, down.

The rotation that turns the NED axes into the body axes does two jobs with one matrix. Read one way, it *turns a vector*. Read the other way, it *converts components*: hand it a vector's components in the body frame, and it gives back the same arrow's components in NED. That second reading is the one navigation code uses all day.

In SciPy, if `att` is the vehicle's attitude (NED to body):

- `att.apply(v_body)` gives the NED components of a vector measured in the body frame;
- `att.apply(v_ned, inverse=True)` — or `att.inv().apply(v_ned)` — goes the other way.

::: warning Which way does your matrix go?
Every attitude matrix hides a direction: body to navigation, or navigation to body. They are transposes of each other, and both look like perfectly good rotation matrices. Name your variables with the direction in them — `C_ned_from_body`, not `dcm` — and test with one vector whose answer you know, such as the nose direction.
:::

## Euler angles

Pilots and launch engineers think in three angles. **Yaw** $\psi$ ("psi") is the compass heading of the nose. **Pitch** $\theta$ ("theta") is how far the nose is above the horizon. **Roll** $\phi$ ("phi") is the bank about the nose. Three angles about three axes, one after the other, are called **Euler angles**.

The order matters, and so does *which* axes. There are two families:

- **Intrinsic** turns go about the vehicle's own axes, which move after each turn. SciPy writes these in **uppercase**: `"ZYX"`.
- **Extrinsic** turns go about the fixed ground axes, which never move. SciPy writes these in **lowercase**: `"xyz"`.

The aerospace yaw-pitch-roll convention is intrinsic `"ZYX"`: first yaw about $z$ (down), then pitch about the new $y$, then roll about the newest $x$ (the nose). A neat fact: the same three turns done about the *fixed* axes in the *reverse* order give the same attitude. So `from_euler("ZYX", [yaw, pitch, roll])` equals `from_euler("xyz", [roll, pitch, yaw])`.

::: example Where is the nose, and where is gravity?
An aircraft flies with yaw $30^\circ$, pitch $10^\circ$ and roll $5^\circ$, in the NED frame. Where does its nose point, and how does its accelerometer see gravity?

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

att = R.from_euler("ZYX", [30, 10, 5], degrees=True)       # yaw, pitch, roll
print(att.apply([1.0, 0.0, 0.0]).round(4))                 # [ 0.8529  0.4924 -0.1736]
print(att.apply([0.0, 0.0, 9.81], inverse=True).round(3))  # [-1.703  0.842  9.624]
same = R.from_euler("xyz", [5, 10, 30], degrees=True)       # roll, pitch, yaw
print(np.allclose(same.as_matrix(), att.as_matrix()))       # True
```

**The nose.** The body $x$ axis, turned into NED components, is $[0.8529, 0.4924, -0.1736]$. Check it by hand. Pitching up $10^\circ$ tips the nose so its horizontal part is $\cos 10^\circ = 0.9848$ and its up part is $\sin 10^\circ = 0.1736$. "Up" is *minus* down, so the down component is $-0.1736$. Yawing $30^\circ$ then splits the horizontal part into north $0.9848 \times \cos 30^\circ = 0.8529$ and east $0.9848 \times \sin 30^\circ = 0.4924$. Roll spins the vehicle about its nose, so it cannot move the nose. All three numbers match.

**Gravity.** In NED, gravity is $[0, 0, 9.81]\,\mathrm{m/s^2}$ — straight down. Converting into the body frame gives $[-1.703, 0.842, 9.624]$. The $-1.703$ along the nose axis is $9.81 \times \sin 10^\circ$: with the nose up, gravity pulls partly backward along the body. The small sideways part comes from the $5^\circ$ bank. The length is still $9.81$, since a turn never changes length.

The last print confirms the reversed-order fact: intrinsic `"ZYX"` with (yaw, pitch, roll) and extrinsic `"xyz"` with (roll, pitch, yaw) build the same matrix.
:::

::: warning Gimbal lock
Pitch the nose straight up, to $90^\circ$, and the yaw axis and the roll axis line up. Turning about one is now the same as turning about the other, so only their *difference* means anything. That is **[[gimbal lock|gimbal-lock]]**. The attitude itself is fine; the three angles have stopped being a good description of it. Ask SciPy for `as_euler("ZYX")` of yaw 30, pitch 90, roll 5 and it warns "Gimbal lock detected", sets the roll to zero and returns yaw 25 — a different set of angles for the same attitude. A rocket climbing vertically at lift-off sits right at this point, which is one reason flight software stores attitude as a quaternion and only turns it into angles for people to read.
:::

## Quaternions

A quaternion stores a turn in four numbers without any gimbal lock. Its recipe uses the axis-and-angle picture: every turn, however complicated, is one single turn by some angle $\theta$ about some axis $\hat{\mathbf{n}}$ ("n hat", a unit-length arrow). This is **[[Euler's rotation theorem|euler-theorem]]**. The quaternion packs the axis and the angle like this:

$$
\mathbf{q} = \big(\,\hat{\mathbf{n}}\sin\tfrac{\theta}{2},\;\cos\tfrac{\theta}{2}\,\big).
$$

The first three numbers are the **vector part**, the axis scaled by the sine of *half* the angle. The fourth is the **scalar part**, the cosine of half the angle. SciPy lists them in that order, $[x, y, z, w]$, with the scalar $w$ **last**. The next lesson is about that ordering choice and the other order used in much of the aerospace world.

Decode the quarter turn: $\theta = 90^\circ$, so $\theta/2 = 45^\circ$, and $\sin 45^\circ = \cos 45^\circ = 0.7071$. The axis is $z$, $[0, 0, 1]$. So $\mathbf{q} = [0, 0, 0.7071, 0.7071]$ — exactly what `as_quat()` printed.

Three facts follow from the recipe.

- **Unit length.** $\sin^2 + \cos^2 = 1$, so a rotation quaternion always has length 1. `from_quat` divides by the length for you, so `R.from_quat([0, 0, 1, 1])` becomes $[0, 0, 0.7071, 0.7071]$.
- **No turn** is $[0, 0, 0, 1]$: $\theta = 0$ gives $\sin 0 = 0$ and $\cos 0 = 1$.
- **Two quaternions per turn.** $\mathbf{q}$ and $-\mathbf{q}$ describe the same rotation (a turn of $\theta$ one way about $\hat{\mathbf{n}}$ equals a turn of $360^\circ - \theta$ the other way about $-\hat{\mathbf{n}}$). `as_quat(canonical=True)` picks the one whose scalar part is not negative, which helps when you compare numbers.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

att = R.from_euler("ZYX", [30, 10, 5], degrees=True)
q = att.as_quat()
print(q.round(4))                                  # [0.0194 0.0954 0.2539 0.9623]
print(round(float(np.linalg.norm(q)), 6))          # 1.0
print(round(float(np.degrees(att.magnitude())), 2))   # 31.56
print(np.allclose(R.from_quat(-q).as_matrix(), att.as_matrix()))   # True
```

The yaw-30, pitch-10, roll-5 attitude is a single turn of $31.56^\circ$ about one tilted axis; `magnitude()` returns that angle in radians. Its scalar part is $\cos(31.56^\circ/2) = 0.9623$, near 1 because the turn is modest.

::: key
SciPy stores a quaternion as $[x, y, z, w]$: vector part first, scalar last, with $[x, y, z] = \hat{\mathbf{n}}\sin(\theta/2)$ and $w = \cos(\theta/2)$. `from_quat` normalizes its input; $\mathbf{q}$ and $-\mathbf{q}$ are the same rotation.
:::

## Putting turns together

Doing one turn and then another is called **composition**. In SciPy you write it with `*`, and the rule reads right to left, like matrix products: `b * a` means *first* `a`, *then* `b`. It is the same as multiplying the matrices, $\mathbf{C}_b \mathbf{C}_a$.

Order matters for turns. Put a book flat, turn it a quarter turn about the up axis, then a quarter turn about the east-west axis, and note where the spine ends up. Start again and do them the other way round. The spine lands somewhere else.

::: example Two quarter turns, two orders
Let `a` be $90^\circ$ about $z$ and `b` be $90^\circ$ about $x$. Follow the vector $[1, 0, 0]$.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

a = R.from_euler("z", 90, degrees=True)
b = R.from_euler("x", 90, degrees=True)
v = np.array([1.0, 0.0, 0.0])
print((b * a).apply(v).round(3))                   # [0. 0. 1.]
print((a * b).apply(v).round(3))                   # [0. 1. 0.]
both = b * a
print(round(float(np.degrees(both.magnitude())), 1))              # 120.0
print((both.as_rotvec() / both.magnitude()).round(4))             # [ 0.5774 -0.5774  0.5774]
```

**`b * a` (a first).** The $z$ turn carries $x$ to $y$: $[0, 1, 0]$. The $x$ turn then carries $y$ to $z$: $[0, 0, 1]$.

**`a * b` (b first).** The $x$ turn leaves $[1, 0, 0]$ alone, since it lies on the axis. The $z$ turn then carries it to $y$: $[0, 1, 0]$.

Different answers, so the order matters. And the two quarter turns together, `b * a`, equal one single turn of $120^\circ$ about the axis $[1, -1, 1]/\sqrt{3} \approx [0.577, -0.577, 0.577]$. Two $90^\circ$ turns do not make a $180^\circ$ turn — another sign that turns do not add like ordinary numbers.
:::

The **inverse** `r.inv()` undoes a turn, so `r.inv() * r` is no turn at all. For a matrix it is the transpose; for a quaternion it flips the sign of the vector part.

A `Rotation` can also hold *many* turns at once. `R.from_quat(Q)` with `Q` of shape `(N, 4)` builds a stack; `len` gives $N$, indexing picks one, and `apply` and `*` work on the whole stack in one call. A whole flight's worth of attitude telemetry becomes one object. For a single axis, pass the angles as a column: `R.from_euler("z", [[0], [90]], degrees=True)` makes a stack of two.

## Slerp: blending between two attitudes

Telemetry arrives in samples: the attitude at $t = 0$, the attitude at $t = 2\,\mathrm{s}$. Your analysis needs it at $t = 0.5\,\mathrm{s}$. That is interpolation again, as in the previous lesson, but for turns.

The straight-line trick from that lesson does not work here. Averaging the four quaternion numbers gives a result that is not unit length, and even after fixing that, it turns at an uneven speed — fast in the middle, slow at the ends. Averaging Euler angles is worse: halfway between a heading of $350^\circ$ and $10^\circ$ is $0^\circ$, the short way through north, but the plain average of $350$ and $10$ is $180$ — due south.

The right tool is **[[slerp|slerp-arc]]**, short for *spherical linear interpolation*. It finds the single turn that takes the first attitude to the second, and then does a fraction of that turn: a quarter of the way in time means a quarter of the angle. The vehicle turns at a steady rate about one fixed axis — the smoothest, shortest way between the two samples.

In SciPy, `Slerp` lives next to `Rotation`. You give it the key times and a `Rotation` stack of the attitudes at those times, and get back an object you call with new times:

```python
import numpy as np
from scipy.spatial.transform import Rotation as R, Slerp

keys = R.from_euler("z", [[0], [90]], degrees=True)   # attitude at t = 0 and t = 2 s
slerp = Slerp([0.0, 2.0], keys)
yaw = slerp([0.0, 0.5, 1.0, 1.5, 2.0]).as_euler("zyx", degrees=True)[:, 0]
print(yaw.round(3))                                   # [ 0.  22.5 45.  67.5 90. ]
```

A quarter of the time, a quarter of the angle: $22.5^\circ$ at $0.5\,\mathrm{s}$, a steady $45^\circ/\mathrm{s}$ throughout. Like the table interpolators in the last lesson, `Slerp` refuses times outside the key times.

::: example Why not average the numbers?
Blend from no turn to a $170^\circ$ turn about $z$, and compare slerp with averaging the quaternion components.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R, Slerp

q0 = R.identity().as_quat()
q1 = R.from_euler("z", 170, degrees=True).as_quat()
mid = (q0 + q1) / 2
print(mid.round(4), round(float(np.linalg.norm(mid)), 4))   # [0.     0.     0.4981 0.5436] 0.7373

ts = np.array([0.25, 0.5, 0.75])
keys = R.from_euler("z", [[0], [170]], degrees=True)
print(np.degrees(Slerp([0, 1], keys)(ts).magnitude()).round(2))        # [ 42.5  85.  127.5]
print([round(float(np.degrees(R.from_quat((1 - t) * q0 + t * q1).magnitude())), 2)
       for t in ts])                                                   # [35.77, 85.0, 134.23]
```

**The plain average** has length $0.737$, not 1. It is not a rotation quaternion until you rescale it.

**Slerp** gives $42.5^\circ$, $85^\circ$, $127.5^\circ$ at the quarter points: steps of exactly $170/4 = 42.5^\circ$, a steady rate.

**Averaging then rescaling** (which `from_quat` does for you) gets the midpoint right, but gives $35.77^\circ$ and $134.23^\circ$ at the quarter points. The steps are $35.8^\circ$, $49.2^\circ$, $49.2^\circ$, $35.8^\circ$: the turn speeds up in the middle. A pointing controller fed that profile would see a rate change that never happened.
:::

## Check yourself

::: check
A rotation matrix has first column $[0, 0, -1]$. In words, what did the turn do to the $x$ axis?
:::

::: answer
Each column is where an axis ends up. The first column is the new direction of $x$, so $x$ now points along $-z$. In NED terms, a vehicle whose nose was pointing north now has its nose pointing straight up.
:::

::: check
Without running code, what does `R.from_euler("x", 180, degrees=True).as_quat()` return?
:::

::: answer
The axis is $x = [1, 0, 0]$ and $\theta/2 = 90^\circ$. The vector part is $[1, 0, 0] \times \sin 90^\circ = [1, 0, 0]$, the scalar part is $\cos 90^\circ = 0$. In SciPy's order that is $[1, 0, 0, 0]$. The last entry prints as a tiny number such as $6 \times 10^{-17}$ instead of an exact zero: that is rounding error in $\cos 90^\circ$, not a real turn.
:::

::: check
A teammate computes the attitude "first yaw by `r_yaw`, then pitch by `r_pitch`" as `r_yaw * r_pitch`. Is that right?
:::

::: answer
No. SciPy's `*` applies the right-hand rotation first, so `r_yaw * r_pitch` does the pitch first. "Yaw first, then pitch" is `r_pitch * r_yaw`. Because turns do not commute, the two give different attitudes unless both turns share an axis.
:::

::: check
Why does flight software usually keep the attitude as a quaternion, even though the displays show yaw, pitch and roll?
:::

::: answer
Euler angles break down at gimbal lock (pitch $\pm 90^\circ$ for the yaw-pitch-roll order), where yaw and roll become the same motion and small attitude changes can make the angles jump. A vertical rocket sits right there. A quaternion has no such point, needs only four numbers and one normalization, and composes cheaply. The angles are computed from it only for people to read.
:::

::: check
Attitude samples arrive at $t = 10\,\mathrm{s}$ (no turn) and $t = 14\,\mathrm{s}$ ($60^\circ$ about the body $y$ axis). What does slerp give at $t = 11\,\mathrm{s}$?
:::

::: answer
$t = 11$ is $\frac{11 - 10}{14 - 10} = 0.25$ of the way. Slerp takes the same fraction of the angle about the same axis: $0.25 \times 60^\circ = 15^\circ$ about body $y$. The turn rate is a steady $60/4 = 15^\circ/\mathrm{s}$.
:::

## Summary

| Idea | SciPy | Remember |
|---|---|---|
| Build a rotation | `from_quat`, `from_euler`, `from_matrix`, `from_rotvec` | Degrees only with `degrees=True` |
| Read it back | `as_quat`, `as_euler`, `as_matrix`, `as_rotvec` | One object, many spellings |
| Turn a vector | `r.apply(v)`; `r.apply(v, inverse=True)` | Also converts body ↔ NED components |
| Rotation matrix | columns = new axes | $\mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{I}$, $\det\mathbf{C} = +1$ |
| Euler angles | `"ZYX"` intrinsic, `"xyz"` extrinsic | Yaw-pitch-roll is `"ZYX"`; gimbal lock at pitch $\pm 90^\circ$ |
| Quaternion | `[x, y, z, w]` in SciPy | $\hat{\mathbf{n}}\sin\frac{\theta}{2}$, $\cos\frac{\theta}{2}$; $\mathbf{q} \equiv -\mathbf{q}$ |
| Composition | `b * a` | `a` first, then `b` |
| Slerp | `Slerp(times, rotations)(t)` | Steady rate about one fixed axis |

The next lesson zooms in on the quaternion's four numbers: SciPy puts the scalar last, much of the aerospace world puts it first, and mixing the two up produces errors that look perfectly reasonable. You will learn to convert safely and to spot a mix-up in seconds.

::: context hamilton Carved into a bridge
Quaternions were invented by the Irish mathematician William Rowan Hamilton in 1843. He had spent years trying to multiply triples of numbers the way complex numbers multiply pairs. The answer came to him on a walk along a canal in Dublin: it takes four numbers, not three. He scratched the rule $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Broom Bridge, where a plaque marks the spot today. Spacecraft attitude software adopted them more than a century later.
:::

::: context star-tracker A camera that knows the sky
A star tracker is a small camera that photographs a patch of sky, matches the pattern of stars against a catalog in its memory, and works out which way it is pointing. It reports that attitude several times per second, and nearly every modern tracker outputs it as a quaternion. Its accuracy is often a few arcseconds, far finer than a degree.
:::

::: context right-hand-rule Your right hand sets the sign
Point your right thumb along the axis. Your curled fingers show the positive direction of turning. For the $z$ axis pointing out of the page, positive turns are counterclockwise, carrying $x$ toward $y$. Using the left hand by mistake flips every sign.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="130" x2="300" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="306,130 294,124 294,136" fill="#1f2a44"/>
  <text x="312" y="134" font-size="13" fill="#1f2a44">x</text>
  <line x1="180" y1="130" x2="180" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,14 174,26 186,26" fill="#1f2a44"/>
  <text x="188" y="20" font-size="13" fill="#1f2a44">y</text>
  <circle cx="180" cy="130" r="7" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="130" r="2" fill="#1f2a44"/>
  <text x="150" y="152" font-size="12" fill="#1f2a44">z (out of page)</text>
  <path d="M260,130 A80,80 0 0,0 180,50" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="180,50 192,44 192,56" fill="#1d6fd1"/>
  <text x="246" y="72" font-size="12" fill="#1d6fd1">positive turn</text>
</svg>
```
:::

::: context dcm-name Why "direction cosine"
Each entry of the matrix is the cosine of the angle between one axis of the first frame and one axis of the second. The cosine of the angle between two unit arrows is how much one points along the other: 1 if they agree, 0 if they are at right angles, −1 if opposite. So the whole matrix is a table of nine "how much does this axis point along that one" numbers, which is exactly what you need to convert components.
:::

::: context ned-frame North, east, down
NED puts $x$ north, $y$ east and $z$ down, all at the vehicle's spot on Earth. "Down" is chosen so that the three axes follow the right-hand rule and so that a body frame with $x$ forward, $y$ right, $z$ down lines up with NED when the vehicle sits level facing north. Aircraft and many rocket codes use it; others prefer east-north-up. Always check which one a data file uses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="85" x2="260" y2="45" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="266,43 253,42 257,53" fill="#1d6fd1"/>
  <text x="272" y="44" font-size="13" fill="#1d6fd1">x north</text>
  <line x1="120" y1="85" x2="250" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="256,122 245,114 242,125" fill="#1d6fd1"/>
  <text x="262" y="128" font-size="13" fill="#1d6fd1">y east</text>
  <line x1="120" y1="85" x2="120" y2="155" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="120,161 114,149 126,149" fill="#b4232c"/>
  <text x="130" y="158" font-size="13" fill="#b4232c">z down</text>
  <circle cx="120" cy="85" r="4" fill="#1f2a44"/>
  <text x="110" y="80" font-size="12" text-anchor="end" fill="#1f2a44">vehicle's spot</text>
</svg>
```
:::

::: context gimbal-lock Named after real hardware
Older inertial platforms held their gyroscopes on three nested rings called gimbals, one per Euler angle. When the middle ring turned $90^\circ$, the inner and outer rings lined up and the platform lost one direction of freedom. Apollo's guidance platform had exactly three gimbals, so the crew watched for gimbal lock warnings; on Apollo 11, Michael Collins joked about wanting a fourth gimbal for Christmas. Software Euler angles inherit the same weak spot even though no rings are involved.
:::

::: context euler-theorem Any turn is one turn
Leonhard Euler showed in 1775 that however you twist a rigid object about a fixed point, the end result equals one single turn about one axis. Sit on a spinning office chair and you have a feel for it: whatever sequence of tilts and spins got you here, one clean turn could have done it. That single axis and angle are what a quaternion and a rotation vector both store.
:::

::: context slerp-arc Along the sphere, not through it
Unit quaternions live on the surface of a sphere in four dimensions. Slerp walks along the surface at an even pace, so equal time gives equal angle. Averaging the numbers cuts straight through the inside: the point you land on is shorter than 1, and after stretching it back out to the surface, the steps are uneven. The word slerp came from Ken Shoemake's 1985 paper on animating rotations for computer graphics.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="160" r="130" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <path d="M65.3,98.97 A130,130 0 0,1 294.7,98.97" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="65.3" y1="98.97" x2="294.7" y2="98.97" stroke="#b4232c" stroke-width="2"/>
  <circle cx="65.3" cy="98.97" r="5" fill="#1f2a44"/>
  <circle cx="294.7" cy="98.97" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="30" r="5" fill="#1d6fd1"/>
  <circle cx="180" cy="98.97" r="5" fill="#b4232c"/>
  <text x="40" y="92" font-size="12" fill="#1f2a44">q0</text>
  <text x="304" y="92" font-size="12" fill="#1f2a44">q1</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">slerp: stays on the sphere</text>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#b4232c">plain average: inside, too short</text>
</svg>
```
:::
