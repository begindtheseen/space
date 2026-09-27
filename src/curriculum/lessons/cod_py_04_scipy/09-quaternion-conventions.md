---
id: l09-quaternion-conventions
title: Scalar-first and scalar-last quaternions
minutes: 16
covers:
  - 'The scalar-last quaternion convention in SciPy and the scalar-first convention elsewhere'
---

Write the date `03/04/2026`. In the United States that is March 4. In most of Europe it is April 3. Both readings are real dates. Nothing about the digits looks wrong, so nobody gets an error message — one person simply turns up a month late.

Quaternions have exactly this problem. The four numbers can be written in two orders: with the scalar part first, or with it last. Both orders are in wide use, both give a valid-looking quaternion, and reading one as the other gives a real rotation — just the wrong one. It is one of the most common attitude bugs in aerospace code, and it happens at the seams: where Python talks to MATLAB, to C++, to a telemetry file, or to a colleague's library.

This lesson teaches the two conventions, shows exactly what a mix-up does and why nothing catches it automatically, and gives you a way to convert safely and a check that spots a flipped order in about 30 seconds.

## Two orders for the same four numbers

In the last lesson you met the quaternion recipe. A turn by angle $\theta$ about the unit axis $\hat{\mathbf{n}}$ has

- a **vector part** $\hat{\mathbf{n}}\sin(\theta/2)$ — three numbers, usually called $x, y, z$;
- a **scalar part** $\cos(\theta/2)$ — one number, usually called $w$ (some books call it $q_0$ or $q_4$, or $\eta$, "eta").

The recipe says nothing about the order you list them in. So there are two habits:

- **Scalar-last**: $[x, y, z, w]$. This is SciPy's order. It is also the order in ROS (the Robot Operating System), in the Unity game engine, and in the memory layout of the Eigen C++ library.
- **Scalar-first**: $[w, x, y, z]$. This is the order in MATLAB's Aerospace Toolbox, in the constructor of Eigen's quaternion class, in NASA's **[[SPICE|spice-toolkit]]** toolkit, and in many textbooks and flight-software codebases.

Neither is more correct. They are two spellings, like the two date formats. Books do not all agree either: Markley and Crassidis's attitude text, for example, puts the scalar last. So whenever a quaternion crosses from one piece of code into another, the order has to be checked and, when needed, changed.

::: key
`scipy.spatial.transform.Rotation` uses scalar-last: $(x, y, z, w)$. MATLAB Aerospace, Eigen constructors and most textbooks are scalar-first: $(w, x, y, z)$. Reordering is required at every boundary, and getting it wrong yields a rotation that looks plausible but is wrong.
:::

::: warning Eigen has both, in one class
In **[[Eigen|eigen-trap]]**, `Quaterniond(w, x, y, z)` takes the scalar first. But `q.coeffs()` returns the numbers stored as $[x, y, z, w]$, and building a quaternion from a raw array of four numbers reads them in that stored, scalar-last order. The same object is scalar-first by one door and scalar-last by the other. When C++ code hands Python four raw numbers, ask which door they came through.
:::

## Why nothing catches the mistake

Most bugs announce themselves: a shape mismatch, a `nan`, a crash. A quaternion order mix-up does not, and it is worth seeing exactly why.

A rotation quaternion has length 1. Swapping its entries around does not change its length, because the length is the square root of the sum of the squares, and a sum does not care about order. So the misread quaternion is *also* a perfectly good unit quaternion. It describes a real rotation. Every "is this a valid quaternion?" check passes.

Take the quarter turn about $z$ from the last lesson. SciPy writes it $[0, 0, 0.7071, 0.7071]$. Now hand those four numbers to a scalar-first tool. It reads

- $w = 0$, so $\cos(\theta/2) = 0$, so $\theta/2 = 90^\circ$ and $\theta = 180^\circ$;
- vector part $[0, 0.7071, 0.7071]$, so the axis is halfway between $y$ and $z$.

A half-turn about a diagonal axis, instead of a quarter-turn about $z$. Different angle, different axis — and both are ordinary rotations.

::: example What a misread does to the nose
A vehicle's attitude is a quarter turn about $z$, so its nose (body $x$) should point along $+y$. Read the quaternion in the wrong order and apply it:

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

right = R.from_euler("z", 90, degrees=True)
q = right.as_quat()                                   # SciPy order: x, y, z, w
print(q.round(4))                                     # [0.     0.     0.7071 0.7071]

wrong = R.from_quat(q, scalar_first=True)             # the same numbers, read as w, x, y, z
print(round(float(np.degrees(wrong.magnitude())), 1)) # 180.0
print(right.apply([1.0, 0.0, 0.0]).round(4))          # [0. 1. 0.]
print(wrong.apply([1.0, 0.0, 0.0]).round(4))          # [-1.  0.  0.]
```

(Here `scalar_first=True` is used on purpose to *cause* the mistake, pretending to be the other tool.)

**The right answer**: the nose swings from $+x$ to $+y$, as expected.

**The misread**: a $180^\circ$ turn about the axis $[0, 0.7071, 0.7071]$. The nose ends up at $[-1, 0, 0]$ — pointing straight backwards.

**Sanity check**: backwards is at least visibly odd. But the result is a genuine rotation, with unit length, from genuine inputs, and no line of code objected. In a longer chain of calculations, the wrong attitude would feed a pointing command, an estimated star position or a thruster choice, and the symptom might show up far from its cause.
:::

It gets sneakier with the kind of attitude a real vehicle usually has: small. A $5^\circ$ roll about $x$ is $[0.0436, 0, 0, 0.9990]$ in SciPy's order. Read as scalar-first, $w = 0.0436$ gives $\theta = 2\arccos(0.0436) = 175^\circ$ about the $z$ axis. A gentle roll has turned into a near half-turn about a different axis. A plot of that would not look like a crash; it would look like a different, perfectly smooth maneuver.

The same holds for the matrix. Here is a hand-written converter from a scalar-first quaternion to a rotation matrix, the kind you find in many codebases. Fed SciPy's order by mistake, it returns a matrix that passes every test a rotation matrix should pass — except being the right one:

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

def dcm_from_wxyz(q):
    """Rotation matrix from a scalar-first quaternion (w, x, y, z)."""
    w, x, y, z = q
    return np.array([
        [1 - 2*(y*y + z*z), 2*(x*y - w*z),     2*(x*z + w*y)],
        [2*(x*y + w*z),     1 - 2*(x*x + z*z), 2*(y*z - w*x)],
        [2*(x*z - w*y),     2*(y*z + w*x),     1 - 2*(x*x + y*y)],
    ])

att = R.from_euler("ZYX", [30, 10, 5], degrees=True)
q_xyzw = att.as_quat()
bad = dcm_from_wxyz(q_xyzw)                             # wrong order handed in
print(np.allclose(bad.T @ bad, np.eye(3)), round(float(np.linalg.det(bad)), 6))  # True 1.0
print(np.allclose(bad, att.as_matrix()))                # False
print(np.allclose(dcm_from_wxyz(np.roll(q_xyzw, 1)), att.as_matrix()))           # True
```

The bad matrix is orthonormal and has determinant $+1$: a valid rotation matrix. Only comparing it with the truth exposes it. With the order fixed by `np.roll` (next section), it matches.

::: warning The checks that do not help
Checking that the quaternion has length 1, that the matrix is orthonormal, or that the determinant is $+1$ cannot detect a swapped order. They check that you have *a* rotation, not *the* rotation. You need a test with a known answer.
:::

## Converting safely

Converting is only a matter of moving the scalar from one end to the other. There are three good ways to do it in NumPy and SciPy.

**Let SciPy do it.** Since SciPy 1.14, `from_quat` and `as_quat` take a `scalar_first` argument:

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

q_wxyz = np.array([0.9623, 0.0194, 0.0954, 0.2539])      # from a scalar-first source
att = R.from_quat(q_wxyz, scalar_first=True)             # SciPy now holds it correctly
print(att.as_quat().round(4))                            # [0.0194 0.0954 0.2539 0.9623]
print(att.as_quat(scalar_first=True).round(4))           # [0.9623 0.0194 0.0954 0.2539]
print(att.as_euler("ZYX", degrees=True).round(1))        # [30. 10.  5.]
```

**Roll the array.** `np.roll(q, 1)` shifts every entry one place to the right and **[[wraps the last one round|scalar-roll]]** to the front, so it turns $[x, y, z, w]$ into $[w, x, y, z]$. `np.roll(q, -1)` goes back. For a whole table of quaternions with shape `(N, 4)`, add `axis=-1` so each row is rolled, not the flattened array.

**Index explicitly.** `q[..., [3, 0, 1, 2]]` picks the entries in the order scalar, x, y, z, and `q[..., [1, 2, 3, 0]]` goes back. The `...` makes it work for one quaternion or a stack. Some teams prefer this because the new order is written right there on the page.

```python
import numpy as np

q_xyzw = np.array([[0.0, 0.0, 0.7071, 0.7071],
                   [0.0436, 0.0, 0.0, 0.9990]])
q_wxyz = np.roll(q_xyzw, 1, axis=-1)
print(q_wxyz)
# [[0.7071 0.     0.     0.7071]
#  [0.999  0.0436 0.     0.    ]]
print(np.array_equal(q_wxyz, q_xyzw[..., [3, 0, 1, 2]]))   # True
print(np.array_equal(np.roll(q_wxyz, -1, axis=-1), q_xyzw)) # True
```

::: warning np.roll without axis on a stack
`np.roll(Q, 1)` on an `(N, 4)` array with no `axis` flattens it, shifts by one and reshapes back. The first row's scalar ends up at the start of the *second* row. The numbers still look like quaternions. Always write `axis=-1` for a stack.
:::

### Convert once, at the edge, with names that say the order

The best defense is structural. Keep one convention *inside* your program — with SciPy, that is the `Rotation` object itself, so you rarely touch raw arrays at all. Convert exactly once, at the **[[boundary|boundary-story]]** where data comes in or goes out: reading a telemetry file, calling a MATLAB function, receiving a C++ message. Put that conversion in one small, tested function.

Name raw arrays with their order: `q_wxyz` and `q_xyzw`, never plain `q`. Then a line like `R.from_quat(q_wxyz)` looks wrong on sight, before anyone runs it.

## The 30-second check

Suppose someone hands you a file of quaternions and nobody knows the order. You do not need to guess. Use a rotation whose answer you know.

Take a **small rotation about one axis** — a few degrees about $x$, say. From the recipe, its scalar part is $\cos(\theta/2)$, which is **[[very close to 1|near-one]]** for small $\theta$ ($\cos 2.5^\circ = 0.9990$). Its vector part is $\sin(\theta/2)$ along one axis, close to 0 ($\sin 2.5^\circ = 0.0436$), and exactly 0 along the other two. So the array has one entry near 1, one small entry, and two zeros. **Where the near-1 entry sits tells you the order**: at the end means scalar-last, at the front means scalar-first. If a tool's output puts it at the "wrong" end for the convention you assumed, the convention is flipped.

The same trick works with real data. A vehicle sitting on the pad, or a spacecraft holding close to its reference attitude, has quaternions that are nearly "no turn": scalar near $\pm 1$, vector parts small. Look at the first few rows of the file. Whichever column sits near $\pm 1$ is the scalar.

The second check is a **round trip through a rotation matrix**. Build the matrix from the quaternion with your code, build it again with a trusted library, and compare. As the matrix example above showed, a flipped order breaks that comparison immediately, even though each matrix alone looks fine.

::: key
Feed a small rotation about one axis: the scalar part should be near 1 and the vector part near zero. If the near-1 element sits at the wrong end of the array, the convention is flipped. Round-tripping through a DCM also breaks immediately.
:::

::: example Identifying an unknown file
A partner team sends attitude telemetry. The first three rows, taken while the vehicle sat on the pad, are:

```text
0.99996  0.00410 -0.00780  0.00120
0.99996  0.00412 -0.00781  0.00119
0.99996  0.00409 -0.00779  0.00121
```

**Step 1 — find the near-1 column.** It is the first. So the file is scalar-first, $(w, x, y, z)$.

**Step 2 — check it makes sense.** On the pad the vehicle should be close to its reference attitude, so a scalar near 1 fits. The angle is $\theta = 2\arccos(0.99996) \approx 1.0^\circ$: a small, believable offset between the vehicle and its reference frame.

**Step 3 — load it the right way.**

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

q_wxyz = np.array([[0.99996, 0.00410, -0.00780, 0.00120],
                   [0.99996, 0.00412, -0.00781, 0.00119],
                   [0.99996, 0.00409, -0.00779, 0.00121]])
att = R.from_quat(q_wxyz, scalar_first=True)
print(np.degrees(att.magnitude()).round(2))                      # [1.02 1.02 1.02]
print(np.degrees(R.from_quat(q_wxyz).magnitude()).round(1))      # [179.9 179.9 179.9]
```

Loaded correctly, the vehicle is about $1^\circ$ off its reference. Loaded with SciPy's default order, the same numbers claim it is upside down, $179.9^\circ$ away. A vehicle upside down on the launch pad is the kind of answer that should stop you — but only if you look.
:::

## Order is not the only convention

Fixing the order fixes the most common bug, but quaternions carry a few more choices. When two tools still disagree after the order is right, look here next.

- **Sign.** $\mathbf{q}$ and $-\mathbf{q}$ are the same rotation (**[[double cover|double-cover]]**). Two correct tools can print opposite signs. Compare rotations, not raw numbers: `r1.approx_equal(r2)`, or compare matrices.
- **Direction.** Some tools use a quaternion to *turn a vector* (SciPy's `apply`). Others use it to *re-express the same vector in a turned frame*, which is the reverse turn. The two matrices are transposes of each other. Your round-trip test with a known vector catches this too.
- **Multiplication rule.** Hamilton's rule, used by SciPy, has $ij = k$. The **[[JPL convention|jpl-convention]]**, used in some navigation filters, flips it to $ij = -k$, which changes what multiplying two quaternions means. It usually appears together with scalar-last order, so do not assume that "scalar-last" means "same as SciPy".

## Check yourself

::: check
SciPy's `as_quat()` returns $[0.2588, 0, 0, 0.9659]$. What rotation is it, and how would a scalar-first tool write it?
:::

::: answer
SciPy is scalar-last, so $w = 0.9659$ and the vector part is $[0.2588, 0, 0]$. Then $\theta/2 = \arccos(0.9659) = 15^\circ$, so $\theta = 30^\circ$ about the $x$ axis ($\sin 15^\circ = 0.2588$ confirms it). A scalar-first tool writes the same rotation as $[0.9659, 0.2588, 0, 0]$.
:::

::: check
Why does `np.isclose(np.linalg.norm(q), 1.0)` not protect you from an order mix-up?
:::

::: answer
The length of a quaternion is $\sqrt{w^2 + x^2 + y^2 + z^2}$, and a sum of squares does not depend on the order of the terms. A correctly ordered unit quaternion and its reordered version both have length 1, and both describe valid rotations. The check confirms you have a rotation, not that you have the right one.
:::

::: check
Write one line that turns an `(N, 4)` array `q_wxyz` into SciPy's order, and one line that builds a `Rotation` from `q_wxyz` without reordering by hand.
:::

::: answer
`q_xyzw = np.roll(q_wxyz, -1, axis=-1)` (or `q_wxyz[..., [1, 2, 3, 0]]`) moves the scalar from the front to the end of each row. Or skip the array step: `R.from_quat(q_wxyz, scalar_first=True)`. The `axis=-1` matters: without it the roll runs across rows.
:::

::: check
A file's first row is $[0.0012, -0.0030, 0.0005, 0.99999]$. The file's documentation says it is scalar-first. What do you conclude?
:::

::: answer
The entry near 1 is at the end, which is where the scalar sits in a scalar-last file. If the vehicle was near its reference attitude (the usual case at the start of a log), the documentation is wrong and the data are really $(x, y, z, w)$. Read as scalar-first, $w = 0.0012$ would mean a turn of about $179.9^\circ$ — a vehicle nearly upside down. Confirm with the partner team, and add a test that loads the first row and checks the angle is small.
:::

::: check
Two libraries give $[0, 0, 0.3827, 0.9239]$ and $[0, 0, -0.3827, -0.9239]$ for the same attitude, both scalar-last. Is one of them wrong?
:::

::: answer
No. The second is the negative of the first, and $\mathbf{q}$ and $-\mathbf{q}$ describe the same rotation: $45^\circ$ about $z$ (since $\cos 22.5^\circ = 0.9239$). Compare the rotation matrices, or use `approx_equal`, rather than comparing the raw numbers.
:::

## Summary

| Idea | Fact |
|---|---|
| SciPy order | Scalar-last $(x, y, z, w)$; also ROS, Unity, Eigen's storage |
| Other order | Scalar-first $(w, x, y, z)$: MATLAB Aerospace, Eigen's constructor, SPICE, many texts |
| Why it is silent | Reordering keeps length 1, so the result is a valid but wrong rotation |
| Convert with SciPy | `R.from_quat(q_wxyz, scalar_first=True)`, `r.as_quat(scalar_first=True)` |
| Convert with NumPy | `np.roll(q, 1, axis=-1)` to scalar-first; `np.roll(q, -1, axis=-1)` back |
| 30-second check | Small one-axis rotation: the near-1 entry marks the scalar's end |
| Round-trip check | Compare matrices from both tools; a flipped order fails at once |
| Other conventions | Sign $\mathbf{q} \equiv -\mathbf{q}$, vector vs frame direction, Hamilton vs JPL product |

The next lesson turns from single attitudes to thousands of them: `scipy.stats` for describing the spread of Monte Carlo dispersions and reporting the percentiles a review board asks for.

::: context spice-toolkit NASA's geometry toolkit
SPICE is a free software toolkit from NASA's Navigation and Ancillary Information Facility (NAIF). Planetary missions use it to compute where spacecraft, planets and moons are and which way instruments point, from data files called kernels. Its quaternions put the scalar first. If you analyze data from a deep-space mission in Python, SPICE's quaternions meeting SciPy's Rotation class is a very likely place for this lesson's bug.
:::

::: context eigen-trap How one library ended up with both orders
Eigen is the linear-algebra library behind a great deal of robotics and flight C++ code. Its quaternion class stores the four numbers in memory as $x, y, z, w$, which lines up with how its vector types are laid out. But mathematicians write $w$ first, so the four-number constructor follows the maths and takes $w$ first. Both choices made sense on their own. Together they mean the same variable reads differently depending on how you get the numbers in or out.
:::

::: context scalar-roll What np.roll does to the four slots
Rolling by one moves each entry one slot to the right and wraps the last entry round to the front. Rolling by minus one undoes it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <rect x="70" y="20" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="95" y="42">x</text>
    <rect x="120" y="20" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="145" y="42">y</text>
    <rect x="170" y="20" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="195" y="42">z</text>
    <rect x="220" y="20" width="50" height="34" fill="#f2b880" stroke="#1f2a44"/><text x="245" y="42">w</text>
    <rect x="70" y="96" width="50" height="34" fill="#f2b880" stroke="#1f2a44"/><text x="95" y="118">w</text>
    <rect x="120" y="96" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="145" y="118">x</text>
    <rect x="170" y="96" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="195" y="118">y</text>
    <rect x="220" y="96" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="245" y="118">z</text>
  </g>
  <path d="M245,56 C245,80 95,72 95,94" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="95,96 90,85 100,85" fill="#b4232c"/>
  <text x="280" y="42" font-size="12" fill="#1f2a44">SciPy</text>
  <text x="280" y="118" font-size="12" fill="#1f2a44">scalar-first</text>
  <text x="262" y="82" font-size="12" fill="#b4232c">np.roll(q, 1)</text>
</svg>
```
:::

::: context boundary-story Missions lost at a seam
In 1999 NASA lost the Mars Climate Orbiter because one team's ground software reported thruster impulse in pound-force seconds while the navigation software expected newton-seconds. Each program was right by its own convention; the fault lived at the boundary between them. A quaternion order mix-up is the same kind of fault: two correct programs, one unchecked seam. That is why careful teams convert at one place, test that place, and write the convention into the variable name.
:::

::: context near-one Why a small turn has a scalar near 1
The scalar part is $\cos(\theta/2)$, and cosine stays close to 1 for small angles: $0.99996$ for a $1^\circ$ turn, $0.99905$ for $5^\circ$, $0.9962$ for $10^\circ$. The vector part grows with $\sin(\theta/2)$, roughly half the angle in radians. So a $5^\circ$ roll about $x$ has one tall bar and one short one:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="126.1" width="44" height="3.9" fill="#1d6fd1"/>
  <rect x="270" y="30.1" width="44" height="99.9" fill="#f2b880" stroke="#1f2a44"/>
  <text x="82" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">0.0436</text>
  <text x="152" y="124" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="222" y="124" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="292" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">0.9990</text>
  <text x="82" y="150" font-size="13" text-anchor="middle" fill="#1f2a44">x</text>
  <text x="152" y="150" font-size="13" text-anchor="middle" fill="#1f2a44">y</text>
  <text x="222" y="150" font-size="13" text-anchor="middle" fill="#1f2a44">z</text>
  <text x="292" y="150" font-size="13" text-anchor="middle" fill="#1f2a44">w</text>
  <text x="40" y="166" font-size="11" fill="#6c7a93">SciPy order: the tall bar sits at the end</text>
</svg>
```
:::

::: context double-cover Two points, one turn
Every rotation has exactly two unit quaternions, pointing opposite ways, like two ends of a line through the center of a sphere. Going once around a full $360^\circ$ turn takes $\mathbf{q}$ to $-\mathbf{q}$; it takes $720^\circ$ to get back to $\mathbf{q}$ itself. That is why the formula uses *half* the angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="65" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="226" y1="39" x2="134" y2="131" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="85" r="3" fill="#1f2a44"/>
  <circle cx="226" cy="39" r="6" fill="#1d6fd1"/>
  <circle cx="134" cy="131" r="6" fill="#b4232c"/>
  <text x="236" y="36" font-size="13" fill="#1d6fd1">q</text>
  <text x="104" y="150" font-size="13" fill="#b4232c">−q</text>
  <text x="270" y="100" font-size="12" fill="#1f2a44">same</text>
  <text x="270" y="115" font-size="12" fill="#1f2a44">rotation</text>
  <text x="20" y="100" font-size="12" fill="#6c7a93">unit sphere</text>
</svg>
```
:::

::: context jpl-convention A second multiplication rule
Hamilton's 1843 rule makes $ij = k$, and SciPy, MATLAB and Eigen follow it. A different rule, with $ij = -k$, is named after NASA's Jet Propulsion Laboratory, where it was adopted for spacecraft attitude work. It makes quaternion products line up with the order of rotation-matrix products, and some visual-inertial navigation filters still use it. The four numbers look exactly the same either way, but the product of two quaternions means something different. Joan Solà's widely read 2017 notes on quaternion kinematics compare the two side by side.
:::
