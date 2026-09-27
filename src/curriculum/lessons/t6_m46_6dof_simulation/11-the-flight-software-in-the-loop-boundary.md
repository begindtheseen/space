---
id: l11-flight-software-in-the-loop-boundary
title: The flight-software-in-the-loop boundary
minutes: 18
covers:
  - "The flight-software-in-the-loop boundary: compiling the actual flight code into the sim rather than a Python re-implementation of it"
---

Your grandmother has a famous cookie recipe on a stained card. You copy it by hand into your own notebook. For a while the two copies make the same cookies. Then she discovers the oven runs hot and changes "12 minutes" to "10" on her card. Your notebook still says 12. Nobody made a mistake. There are two copies now, and a fix to one does not reach the other.

A simulation can fall into the same trap with the most important code on the vehicle. The five-box lesson said the GNC box should be "the actual flight code". That phrase asks a lot. It would be much easier to write a Python function that does the same thing — the same control law, the same navigation filter, the same guidance — because Python is easy to read, change and plot. This lesson explains why that easy path is a trap, and what it takes to put the real **flight software** (the code that will run on the vehicle's computer) inside a Python-driven simulation instead.

The idea has a name: **flight-software-in-the-loop**. The genuine flight code, built as the Modern C++ for Flight and Simulation module taught, is **[[compiled|compiled-code]]** into a library the simulation calls. What the simulation tests is then the very code that will fly, not a second copy of it.

## Two copies, one algorithm

A Python version of the flight software is a **re-implementation**: a second, separate body of code that carries out the same **algorithm** (the same step-by-step method) as the first. The moment two codebases exist for "the same" logic, they can drift apart, and they drift for reasons that have nothing to do with anyone misunderstanding anything:

- A bug found and fixed in the flight code during testing does not fix itself in the simulation's copy.
- Something subtle discovered in the simulation does not travel back to the flight code.
- Every future change has to be made twice, correctly, by someone who remembers that both copies exist.

That is a **process risk** — a risk from how people work — before you look at a single line of arithmetic. But the arithmetic does not stay the same either, even when both copies are "the same algorithm" in every way a reviewer would check.

## Same algorithm, different numbers

A computer stores most numbers in **[[floating point|floating-point]]**: a fixed number of binary digits for the significant figures, plus an exponent that says where the decimal point goes, like scientific notation. Python's numbers use **double precision**, called `float64` because it uses 64 bits. That gives about 16 significant decimal digits. Some flight computers do their arithmetic in **single precision**, `float32`, with 32 bits and about 7 significant digits.

Every arithmetic step rounds its result to the nearest number the format can store. The rounding is tiny. But a simulation does millions of steps, and tiny roundings can add up.

::: example How far two "identical" programs drift
Take the quaternion kinematics from the frame-discipline lesson: RK4 integration of $\dot q = \tfrac12 q\otimes\boldsymbol\omega$, renormalized every step. (Read $\dot q$ as "q dot", the rate of change of the **[[quaternion|quaternion-refresher]]** $q$, and $\otimes$ as "quaternion product".) The body spins at $2\,\mathrm{rad/s}$ about its $z$ axis, and the step is $h = 0.01\,\mathrm{s}$. Run it twice: once in `float64` and once in `float32`. The code, the step and the math are the same. Only the number of bits changes.

```python
import numpy as np

def run(dtype, n_steps, h=0.01):
    wx, wy, wz = dtype(0.0), dtype(0.0), dtype(2.0)
    q0, q1, q2, q3 = dtype(1.0), dtype(0.0), dtype(0.0), dtype(0.0)
    half, hh = dtype(0.5), dtype(h)
    for _ in range(n_steps):
        def qdot(q0, q1, q2, q3):
            return (half*(-q1*wx - q2*wy - q3*wz), half*(q0*wx + q2*wz - q3*wy),
                    half*(q0*wy - q1*wz + q3*wx), half*(q0*wz + q1*wy - q2*wx))
        k1 = qdot(q0, q1, q2, q3)
        a = (q0+hh*half*k1[0], q1+hh*half*k1[1], q2+hh*half*k1[2], q3+hh*half*k1[3])
        k2 = qdot(*a)
        a = (q0+hh*half*k2[0], q1+hh*half*k2[1], q2+hh*half*k2[2], q3+hh*half*k2[3])
        k3 = qdot(*a)
        a = (q0+hh*k3[0], q1+hh*k3[1], q2+hh*k3[2], q3+hh*k3[3])
        k4 = qdot(*a)
        q0 = q0 + hh/dtype(6.0)*(k1[0]+2*k2[0]+2*k3[0]+k4[0])
        q1 = q1 + hh/dtype(6.0)*(k1[1]+2*k2[1]+2*k3[1]+k4[1])
        q2 = q2 + hh/dtype(6.0)*(k1[2]+2*k2[2]+2*k3[2]+k4[2])
        q3 = q3 + hh/dtype(6.0)*(k1[3]+2*k2[3]+2*k3[3]+k4[3])
        norm = (q0*q0+q1*q1+q2*q2+q3*q3)**dtype(0.5)     # renormalize every step, as lesson 4 taught
        q0, q1, q2, q3 = q0/norm, q1/norm, q2/norm, q3/norm
    return np.array([q0, q1, q2, q3], dtype=np.float64)

for n_steps, label in [(2000, "20 s"), (500000, "5,000 s (1.39 h)")]:
    q64 = run(np.float64, n_steps)
    q32 = run(np.float32, n_steps)
    angle = np.degrees(2*np.arccos(np.clip(abs(np.dot(q64, q32)), -1, 1)))
    print(f"{label}: attitude difference between float64 and float32 = {angle:.4f} deg")
# 20 s: attitude difference between float64 and float32 = 0.0000 deg
# 5,000 s (1.39 h): attitude difference between float64 and float32 = 0.0392 deg
```

The last lines compare the two final attitudes. The angle between two unit quaternions is $2\arccos|q_a \cdot q_b|$, so that is what the code prints.

After $20\,\mathrm{s}$ (2,000 steps) you cannot tell them apart. After $5{,}000\,\mathrm{s}$ — 500,000 steps, about $1.39$ hours — they are $0.0392^\circ$ apart. Neither is wrong. Each rounded slightly differently at every step, and the differences piled up.

Sanity check on the size: in $5{,}000\,\mathrm{s}$ at $2\,\mathrm{rad/s}$ the body turned $10{,}000\,\mathrm{rad}$, about 1,600 full turns. A `float32` number holds about 7 significant digits, so drifting in the fourth or fifth digit after that many turns is about what you would expect.

And this is the *best* case: identical code, identical math, only the number width differs. A truly independent rewrite — different order of operations, different library for sine and cosine, a different compiler reordering the arithmetic — has no reason to agree better, and every reason to drift faster.
:::

## When "equivalent" quietly stops being true

That drift was slow and honest, with no logic error anywhere. The second risk is sharper. Two versions can pass every test anyone thought to write, and still disagree on an input nobody tested.

::: example Two angle-wrapping functions that agree, until they do not
**Wrapping** an angle means bringing it into the range $-\pi$ to $\pi$ by adding or removing whole turns of $2\pi$. There is more than one standard way to do it. A Python simulation might use the **[[modulo|modulo-word]]** operator `%`, which gives the remainder after division. Embedded flight code has sometimes used a loop that subtracts $2\pi$ over and over, historically to avoid a division instruction on hardware where division was slow.

```python
import numpy as np

def wrap_modulo(angle):
    return ((angle + np.pi) % (2*np.pi)) - np.pi

def wrap_loop(angle):
    a = angle
    while a > np.pi:
        a -= 2*np.pi
    while a < -np.pi:
        a += 2*np.pi
    return a

for angle in [1.0, -3.0, 6.0]:
    print(angle, wrap_modulo(angle), wrap_loop(angle))

big = 1e8 + 1.2345
m, l = wrap_modulo(big), wrap_loop(big)
print("big angle:", big, " modulo:", m, " loop:", l, " diff (deg):", np.degrees(abs(m - l)))
rpm = 5000.0
w = rpm*2*np.pi/60.0
print("days of continuous 5000 RPM spin to reach this angle:", big/w/86400)
# 1.0 1.0 1.0
# -3.0 -3.0 -3.0
# 6.0 -0.28318530717958623 -0.28318530717958623
# big angle: 100000001.2345  modulo: -3.105990164920332  loop: -3.102748011301607  diff (deg): 0.18576171888601192
# days of continuous 5000 RPM spin to reach this angle: 2.21048534800921
```

For every ordinary test angle — $1$, $-3$, $6$ — the two agree exactly. (For $6$: $6 - 2\pi \approx -0.2832$, one turn removed.)

Now feed in about $10^8\,\mathrm{rad}$. That is the kind of number a **[[reaction wheel|reaction-wheel]]**'s running rotation count reaches. At $5{,}000\,\mathrm{RPM}$ the wheel turns at $5{,}000 \times 2\pi / 60 \approx 524\,\mathrm{rad/s}$, so $10^8\,\mathrm{rad}$ takes $10^8 / 524 \approx 191{,}000\,\mathrm{s}$, about $2.2$ days — nothing unusual for a spacecraft. At that input the two functions disagree by $0.186^\circ$.

Which is closer to the truth? Checking with exact arithmetic, the modulo answer is right to about $2 \times 10^{-9}\,\mathrm{rad}$. The loop is off by $0.00324\,\mathrm{rad}$. The reason is the **[[spacing of floating-point numbers|number-spacing]]**. Near $10^8$, a `float64` can only land on multiples of about $1.5 \times 10^{-8}$, so every subtraction rounds a little. The loop subtracts $2\pi$ about $16$ million times ($10^8 / 2\pi \approx 1.59 \times 10^7$), and those roundings pile up. The modulo does the reduction in one step, with one rounding.

Neither function has a bug in the usual sense. Each is a defensible way to wrap an angle, and each passes the tests a person would naturally write. They only part ways when the input is big enough that rounding dominates — and nobody testing with angles of a few radians would ever see it. A simulation using one while the real flight code uses the other is testing a controller on numbers the real vehicle will not agree with, silently, and only after days of flight.
:::

## The boundary, and what crosses it

The alternative is to take the real flight **source code** — the text programmers write, reviewed exactly as it will fly — and compile it into a library the simulation links to. Then you write only a thin, explicit piece of glue called a **[[harness|harness-word]]**. The harness:

- fills in the exact data structures the real onboard sensor interface would fill: the same layout, the same units, the same **[[byte order|byte-order]]**;
- calls the flight code at the exact GNC tick the two-rate architecture set up;
- reads back the exact command structure the real actuator interface would receive.

The flight code sees only what the Sensors box produced, and produces only what the Actuators box will act on.

The harness is new code, written for the simulation. It deserves its own careful review. A byte-order mix-up or a field of the wrong size in the harness is exactly the kind of frame-and-unit bug the frame-discipline lesson warned about.

What must *never* be new code is the algorithm. The control law, the filter and the guidance logic run as the actual compiled flight code. Nothing about them is rewritten.

Why is this worth the extra effort? Because the two kinds of bug are found in very different ways. A harness bug is **local**: it lives at one well-defined boundary, and you catch it the way you catch any interface bug — check that the data on one side matches what the other side expects. A silent drift between two separately kept copies of an algorithm has no boundary to check. It hides until someone happens to run the right input, or a long enough run, to expose it. The examples above showed that "long enough" can mean hours or days, not some far-off extreme.

::: key Why compiled flight code, not a re-implementation
Two codebases for "the same" algorithm drift apart with no conceptual error at all. Number width alone gave a $0.0392^\circ$ attitude difference after $1.39$ hours of otherwise identical integration. Two defensible angle-wrapping functions disagreed by $0.186^\circ$ on an input a real wheel counter reaches in about $2.2$ days. Compiling the actual flight code into the simulation, behind a thin, separately reviewed harness that copies the real onboard data layout, removes this whole class of risk: the algorithm under test is the algorithm that flies.
:::

::: warning "It passed every test case we wrote"
A test suite proves two versions agree only on the inputs it contains. The angle-wrapping functions agreed on every ordinary angle and split only at a size nobody thought to test — not an exotic size, only bigger than anyone's usual test range. A re-implementation "verified" against a test suite is verified against that suite, not against every input the mission will actually produce.
:::

::: warning Treating a Python model as a permanent stand-in
Early in a program, before the flight code exists or compiles into a harness, a Python model of the algorithm is a sensible **placeholder** for design work — as long as everyone treats it as one, with a plan to swap in the real flight code before any result is used for a flight decision. The danger is not the placeholder. It is a placeholder that quietly becomes load-bearing: cited in a review long after the real code exists, because replacing it was never scheduled as a task of its own.
:::

## Check yourself

::: check
The `float32`-versus-`float64` example showed no visible difference at $20\,\mathrm{s}$ but $0.0392^\circ$ at $1.39$ hours. Does that mean the `float32` run is "wrong" and the `float64` run "right"?
:::

::: answer
Neither is wrong. Both are consistent numerical solutions of the same equation, each accurate to the precision it carries. The gap is the pile-up of each one rounding slightly differently at every one of 500,000 steps, not an error in either one alone.

The lesson is not that one answer is correct. It is that two implementations of "the same algorithm" are not the same program, and they will disagree measurably given enough time, even with no logic difference between them at all.
:::

::: check
Why did the two angle-wrapping functions agree exactly for small angles but differ by $0.186^\circ$ at about $10^8\,\mathrm{rad}$?
:::

::: answer
For small angles, both functions do only a step or two of well-behaved arithmetic, and rounding is negligible either way.

At about $10^8\,\mathrm{rad}$, numbers near the input can only be stored to steps of about $1.5 \times 10^{-8}$. The modulo reduces the angle in one operation, so it rounds once and lands within about $2 \times 10^{-9}\,\mathrm{rad}$ of the true answer. The loop reduces it by roughly sixteen million separate subtractions, each rounding a little. Those errors add up to about $0.00324\,\mathrm{rad}$, which is $0.186^\circ$. The two methods lose precision in different amounts, so their answers no longer match.
:::

::: check
A program decides to skip the compiled-flight-code harness and re-implement the flight software in Python. They argue that a careful line-by-line review comparing the two versions will catch any difference. Based on this lesson's two examples, what kind of difference would such a review miss?
:::

::: answer
In neither example is there a line a reviewer would flag as wrong. The drift in the first came from using a different but perfectly legitimate number type. The disagreement in the second came from two correct, defensible ways to meet the same specification.

A line-by-line review checks that each version is reasonable on its own. It does not check that the two stay numerically identical on every input the mission will ever produce — a much bigger claim, and one you mostly cannot settle by reading code.
:::

::: check
In the flight-software-in-the-loop setup, what is allowed to be new code written only for the simulation, and what is never allowed to be?
:::

::: answer
The harness may be new: the code that fills the exact data structures the real sensor interface would fill and reads back the exact structures the real actuator interface would consume. It needs its own review.

The algorithm itself — the control law, the filter, the guidance logic — must always be the actual compiled flight code. Never a re-implementation, however faithful.
:::

::: check
A team uses a plainly labeled Python model of the guidance algorithm for six months of early design, with the real flight code arriving later. Apart from the drift risk, what risk does this lesson point to?
:::

::: answer
The placeholder is fine during early design. The risk is that it quietly becomes permanent, because swapping it for the compiled flight code was never scheduled and tracked as its own task. Results and margins found with the Python model can then be quoted in later reviews as if they described the real flight software — exactly the boundary this lesson says must not be skipped for anything that informs a flight decision.
:::

::: check
Why is a byte-order or field-size mistake in the harness a less dangerous kind of bug than a silent drift between two independent copies of an algorithm?
:::

::: answer
A harness mistake is local. It corrupts data crossing one well-defined boundary, and you catch it by directly comparing what goes across with what the real interface expects — the same way you catch any frame or unit bug at a boundary.

A drift between two copies has no boundary to check. You only find it by noticing that two things assumed identical are not, on some particular input or after some particular run length. That is far harder to test for in a systematic way.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Re-implementation risk | Two codebases for one algorithm drift apart: fixes do not travel, and every change must be made twice |
| Number width alone | `float64` vs `float32`, same code: $0.0392^\circ$ apart after $1.39$ hours |
| "Equivalent" is not forever | Two defensible wrap functions agree on normal angles, differ by $0.186^\circ$ at $\sim 10^8\,\mathrm{rad}$ (a wheel counter after $\sim 2.2$ days) |
| Flight-software-in-the-loop | Compile the real flight code into a library the simulation calls at the true GNC tick |
| Harness | Thin new glue copying the real onboard data layout, units and byte order; reviewed on its own |
| What must never be new | The algorithm: control law, filter, guidance |
| Placeholders | A Python model is fine only while tracked as one, with a scheduled swap before any flight decision |

This lesson set the principle: run the real code. The next lesson asks *where* that code runs — on a workstation, on the real flight processor, or inside the real flight hardware — and what each step up can catch that the one before cannot.

::: context compiled-code What "compiling" means
Programmers write **source code**: text in a language like C++ that people can read. A processor cannot run text. A **compiler** translates the source into **machine code** — the processor's own list of numbered instructions. The result is called a **binary**.

The same source can be compiled for different processors, and even for the same processor with different settings. That is why "the flight code" really means a specific source, built a specific way. A Python program can call a compiled C++ library through a **binding** layer (tools such as pybind11 or ctypes do this), so the simulation keeps Python's convenience while the algorithm runs as real compiled code.
:::

::: context floating-point How the two formats are laid out
A floating-point number is stored as a sign bit, some exponent bits (the "times ten to the something", but in powers of two) and some fraction bits (the significant figures). `float32` has 1 + 8 + 23 bits; `float64` has 1 + 11 + 52.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">float32 (about 7 digits)</text>
  <rect x="20" y="30" width="5" height="24" fill="#b4232c"/>
  <rect x="25" y="30" width="40" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="65" y="30" width="115" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="45" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">8</text>
  <text x="122" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">23 fraction</text>
  <text x="20" y="80" font-size="12" fill="#1f2a44">float64 (about 16 digits)</text>
  <rect x="20" y="88" width="5" height="24" fill="#b4232c"/>
  <rect x="25" y="88" width="55" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="88" width="260" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="52" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">11</text>
  <text x="210" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">52 fraction</text>
  <text x="200" y="46" font-size="11" fill="#6c7a93">red: sign, orange: exponent</text>
</svg>
```

Each bit is drawn the same width. The fraction bits set the precision: 23 bits is about 7 decimal digits, 52 bits about 16.
:::

::: context quaternion-refresher The quaternion, briefly
A **quaternion** is four numbers, $q = (q_0, q_1, q_2, q_3)$, that together describe an attitude — which way the vehicle is pointing. For a turn of angle $\theta$ about a unit axis, $q_0 = \cos(\theta/2)$ and the other three are the axis times $\sin(\theta/2)$. A valid attitude quaternion has length exactly $1$, which is why the code rescales it to length $1$ after every step. The frame-discipline lesson in this module and the attitude modules earlier in the course derive all of this; here it is only the test subject.
:::

::: context modulo-word Remainders, and a sign surprise
"Modulo" means "what is left over after taking out whole groups". $17 \bmod 5 = 2$, because three fives make 15 and 2 remain. For angles, the group is one full turn, $2\pi$.

Languages disagree about negative numbers. Python's `%` always returns a result with the sign of the divisor, so `-1 % 5` is `4`. C's `fmod` keeps the sign of the first number, so `fmod(-1, 5)` is `-1`. That is one more way a Python copy and a C flight version of "the same" wrap can differ, and one more reason to run the real one.
:::

::: context reaction-wheel Reaction wheels and their counters
A **reaction wheel** is a heavy flywheel inside a spacecraft. Speed it up one way and the spacecraft turns the other way, because the total spin is conserved. Wheels run for years, often at a few thousand RPM. Software that tracks the wheel's angle, for example to drive its motor, may keep a running total of rotation. At $524\,\mathrm{rad/s}$ that total passes $10^8\,\mathrm{rad}$ in about $2.2$ days and keeps growing. That is how a "huge" angle turns up in ordinary operation.
:::

::: context number-spacing Floating-point numbers have gaps
Floating-point numbers are not spread evenly. Near $1$, a `float64` can step in units of about $2 \times 10^{-16}$. Near $10^8$, the smallest step is about $1.5 \times 10^{-8}$. Any result in between gets rounded to one of the marks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="40" x2="40" y2="60"/><line x1="120" y1="40" x2="120" y2="60"/>
    <line x1="200" y1="40" x2="200" y2="60"/><line x1="280" y1="40" x2="280" y2="60"/>
  </g>
  <line x1="120" y1="80" x2="200" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <text x="160" y="98" font-size="12" text-anchor="middle" fill="#1d6fd1">1.5 × 10⁻⁸ near 10⁸</text>
  <circle cx="148" cy="50" r="5" fill="#b4232c"/>
  <text x="148" y="30" font-size="11" text-anchor="middle" fill="#b4232c">exact result</text>
  <path d="M148,58 Q134,70 122,58" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">storable values</text>
</svg>
```

One rounding of up to half a gap is harmless. Sixteen million of them, as in the subtraction loop, add up to thousandths of a radian.
:::

::: context harness-word Why it is called a harness
A horse's harness does not do the pulling. It connects the horse to the cart so the horse's strength goes where it should. A **test harness** is the same: it does no guidance or control itself. It connects the real flight code to the simulated world.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="72" height="40" rx="5" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="44" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">sensor model</text>
  <rect x="96" y="30" width="56" height="40" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="124" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">harness</text>
  <rect x="168" y="30" width="84" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="210" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">flight binary</text>
  <rect x="268" y="30" width="56" height="40" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="296" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">harness</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="50" x2="94" y2="50"/><line x1="152" y1="50" x2="166" y2="50"/>
    <line x1="252" y1="50" x2="266" y2="50"/><line x1="324" y1="50" x2="350" y2="50"/>
  </g>
  <text x="330" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">to actuators</text>
  <text x="210" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">never rewritten</text>
  <text x="124" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">new, reviewed</text>
</svg>
```

Orange boxes are new code written for the simulation. The blue box is the real, compiled flight code.
:::

::: context byte-order Byte order, or which end first
A 32-bit number is four bytes, and computers disagree about which byte goes first in memory. **Big-endian** machines store the most significant byte first; **little-endian** machines store the least significant first. The number written in hexadecimal as `0A0B0C0D` is stored as `0A 0B 0C 0D` on one and `0D 0C 0B 0A` on the other. Most desktop processors are little-endian, while many network formats and some flight processors are big-endian. Read the bytes in the wrong order and a small sensor value turns into a huge nonsense one. The harness is where this must be handled — and where a mistake is at least loud.
:::
