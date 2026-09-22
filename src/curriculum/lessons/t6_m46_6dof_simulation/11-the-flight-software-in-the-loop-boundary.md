---
id: l11-flight-software-in-the-loop-boundary
title: The flight-software-in-the-loop boundary
minutes: 20
covers:
  - "The flight-software-in-the-loop boundary: compiling the actual flight code into the sim rather than a Python re-implementation of it"
---

The five-box lesson called the GNC box "the actual flight code" without dwelling on how demanding that phrase is. It would be far more convenient to write a Python function that implements the same control law, the same navigation filter, the same guidance algorithm — readable, easy to modify, easy to plot from — and call that the GNC box instead. This lesson is about why that convenience is a trap, and about what it actually takes to put the genuine flight software, built the way the Modern C++ for Flight and Simulation module taught you to build it, inside a Python-orchestrated simulation instead.

## Two codebases, one algorithm, and why that is already a problem

A Python re-implementation of the flight software is, by construction, a second body of code implementing the same algorithm as the first. The moment two codebases exist for "the same" logic, they can diverge, and they diverge for reasons that have nothing to do with anyone making a conceptual mistake: a bug found and fixed in the flight code during integration testing does not automatically get fixed in the simulation's copy, and a subtlety discovered in the simulation does not automatically propagate back. Every future change has to be made twice, correctly, by someone who remembers both copies exist. This is a process risk on its own, before a single line of arithmetic is examined — but the arithmetic itself does not stay equivalent either, even when both copies are, in every way a human reviewer would check, "the same algorithm."

::: example How far two "identical" implementations can drift, given enough time
Take the exact quaternion kinematics this module's frame-discipline lesson verified — RK4 integration of $\dot q = \tfrac12 q\otimes\boldsymbol\omega$, renormalised every step — and run it two ways: once at double precision (`float64`, what a Python simulation naturally uses) and once at single precision (`float32`, closer to what some embedded flight processors compute in). Everything else — the algorithm, the code, the step size — is identical.

```python
import numpy as np

def quat_mult(q, p):
    q0,q1,q2,q3 = q; p0,p1,p2,p3 = p
    return np.array([
        q0*p0-q1*p1-q2*p2-q3*p3, q0*p1+q1*p0+q2*p3-q3*p2,
        q0*p2-q1*p3+q2*p0+q3*p1, q0*p3+q1*p2-q2*p1+q3*p0,
    ], dtype=q.dtype)

def rk4_step(q, w, h):
    def qdot(q):
        return 0.5*quat_mult(q, np.array([0.0, *w], dtype=q.dtype))
    k1 = qdot(q); k2 = qdot(q + h*0.5*k1)
    k3 = qdot(q + h*0.5*k2); k4 = qdot(q + h*k3)
    q_new = q + (h/6.0)*(k1 + 2*k2 + 2*k3 + k4)
    return (q_new/np.linalg.norm(q_new)).astype(q.dtype)

def run(dtype, n_steps, h=0.01):
    w = np.array([0.0, 0.0, 2.0], dtype=dtype)
    q = np.array([1.0, 0.0, 0.0, 0.0], dtype=dtype)
    for _ in range(n_steps):
        q = rk4_step(q, w, dtype(h))
    return q

for n_steps, label in [(2000, "20 s"), (2000000, "20,000 s (5.6 h)")]:
    q64 = run(np.float64, n_steps)
    q32 = run(np.float32, n_steps).astype(np.float64)
    angle = np.degrees(2*np.arccos(np.clip(abs(np.dot(q64, q32)), -1, 1)))
    print(f"{label}: attitude difference between float64 and float32 = {angle:.4f} deg")
# 20 s: attitude difference between float64 and float32 = 0.0000 deg
# 20,000 s (5.6 h): attitude difference between float64 and float32 = 0.1006 deg
```

After 20 seconds the two are indistinguishable. After 5.6 hours of continuous operation, the two attitudes have drifted $0.1006^\circ$ apart — not because either one is wrong, but because every single rounding decision along the way was made slightly differently, and those tiny differences accumulate into a visible one given enough time. This is the *best case*: identical code, identical math, differing only in how many bits represent each number. A genuinely independent reimplementation — different variable ordering, different library calls for trigonometric functions, different compiler optimisations reordering floating-point operations — has no reason to do better, and every reason to diverge faster.
:::

## When "equivalent" quietly stops being true

The float-width example shows a slow, honest drift with no logic error anywhere. A second, sharper risk is that two implementations can pass every test case anyone thought to write and still disagree substantially on an input nobody tested.

::: example Two "equivalent" angle-wrapping functions, until they are not
Wrapping an angle into $[-\pi, \pi]$ has more than one standard implementation. A Python simulation might use the language's modulo operator; embedded flight code sometimes favours a loop of repeated additions or subtractions, historically to avoid a division instruction on hardware where it was expensive:

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

Every ordinary-sized test angle agrees exactly. Feed both functions an angle of $10^8\,\mathrm{rad}$ — the kind of number a reaction wheel's *cumulative* rotation counter reaches after about $2.2$ days of continuous spin at $5{,}000\,\mathrm{RPM}$, a completely unremarkable amount of time for a wheel on an operating spacecraft — and the two functions disagree by $0.186^\circ$. Neither implementation has a logic bug in the ordinary sense; both are internally consistent and each is a defensible way to wrap an angle. They simply stop agreeing once the input magnitude is large enough that floating-point precision loss in representing the raw angle at all becomes the dominant effect, and nobody testing with angles of a few radians would ever see it. A simulation using `wrap_modulo` while the real flight software uses `wrap_loop`, or vice versa, is testing a controller against inputs that its actual onboard counterpart will not agree with once the mission has run long enough — silently, and only once the vehicle has been flying for days.
:::

## The boundary, and what actually crosses it

The alternative to a re-implementation is to compile the genuine flight source — built and reviewed exactly as it will fly — into a library the simulation links against, and to write only a thin, explicit interface: a harness that populates the exact data structures the real onboard interface would populate (the same sensor data layout, the same units, the same byte packing) and reads back the exact command structure the real actuator interface would consume. That harness is new code, written for the simulation, and it deserves its own scrutiny — a byte-order mismatch or a mis-sized field in the harness is exactly the kind of frame-and-unit bug an earlier lesson in this module warned about. What must never be new code is the algorithm itself: the control law, the filter, the guidance logic all execute as the actual compiled binary, called at the exact GNC tick the two-rate architecture established, seeing only what the Sensors box produced and producing only what the Actuators box will act on.

This is also why the boundary is worth the engineering cost even though it is harder to set up than a Python model: a harness bug is visible and local, caught the same way any interface bug is caught, by checking that data crossing it matches on both sides. A silent divergence between two independently maintained implementations of the same algorithm is neither — it can sit undetected for exactly as long as nobody happens to run a test case, or a mission duration, long enough to expose it, which the examples above showed can be measured in hours to days, not in some unreachable extreme.

::: key Why compiled flight code, not a re-implementation
Two codebases implementing "the same" algorithm diverge for reasons with nothing to do with a conceptual error: floating-point width and rounding alone produced a measurable attitude difference after hours of otherwise-identical integration, and two defensible implementations of the same simple function disagreed by a fifth of a degree on an input a real onboard counter reaches within days. Compiling the actual flight code into the simulation, behind a thin, explicitly-reviewed interface that mimics the real onboard data layout, removes this entire class of risk by construction: the algorithm under test is the algorithm that flies, not a second copy of it.
:::

::: warning "It passed every test case we wrote"
A test suite proves equivalence only on the inputs it contains. The angle-wrapping example agreed on every ordinary test angle and diverged only once the input reached a magnitude neither implementer thought to test — and the magnitude in question was not exotic, only larger than anyone's habitual test range. A re-implementation "verified" against a finite test suite is verified against that suite, not against the real flight software's behaviour on every input the mission will actually produce.
:::

::: warning Treating a Python model as a permanent stand-in
Early in a programme, before flight code exists or compiles cleanly into a simulation harness, a Python algorithmic model is a reasonable placeholder for GNC design work — as long as everyone treats it explicitly as one, with a plan to replace it before any result is used for a flight decision. The risk is not using a placeholder; it is a placeholder that quietly becomes load-bearing, cited in a review long after the real flight code exists, because swapping it out was never scheduled as its own task.
:::

## Check yourself

::: check
The float32-versus-float64 quaternion example showed no measurable difference at 20 seconds but a $0.1^\circ$ difference at 5.6 hours. Does this mean the float32 integration is "wrong" and the float64 one "right"?
:::

::: answer
Neither is simply wrong. Both are internally consistent numerical solutions to the same equation, each accurate to the precision it carries; the divergence is the accumulated effect of each one rounding slightly differently at every step, not an error in either one individually. The point is not that one answer is correct and the other is not — it is that two implementations that are "the same algorithm" are not the same program, and will disagree measurably given enough time, even in the total absence of any logic difference between them.
:::

::: check
Why did the two angle-wrapping functions in the second example agree exactly for every small test angle but disagree by $0.186^\circ$ at $10^8\,\mathrm{rad}$?
:::

::: answer
For small angles, both the modulo operation and the repeated-subtraction loop reduce the input in a small number of well-conditioned operations, and floating-point rounding is negligible either way. At $10^8\,\mathrm{rad}$, the raw input itself can only be represented with limited precision relative to its own huge magnitude, and the two methods lose that precision differently as they reduce the angle — one in a single modulo operation, the other through roughly sixteen million individual subtractions, each with its own tiny rounding step. Both losses are real; they simply do not cancel the same way.
:::

::: check
A programme decides to skip a compiled-flight-code harness and instead re-implements the flight software in Python, arguing that a careful code review comparing the two implementations line by line will catch any discrepancy. What kind of divergence would this review not catch, based on the two examples in this lesson?
:::

::: answer
Neither example involved a line that a reviewer would flag as wrong: the float-width divergence came from using a different, equally legitimate numeric type, and the angle-wrapping divergence came from two individually correct, equally defensible implementations of the same specification. A line-by-line review checks whether each implementation is individually reasonable, not whether the two remain numerically identical on every input the mission will ever present — which is a much larger, and largely untestable-by-inspection, claim.
:::

::: check
What specifically is allowed to be new code, written only for the simulation, in the flight-software-in-the-loop architecture — and what is never allowed to be?
:::

::: answer
The interface harness — the code that populates the exact data structures the real sensor interface would populate and reads back the exact structures the real actuator interface would consume — is new code, written for the simulation, and needs its own review. The algorithm itself — the control law, filter, or guidance logic inside the flight software — must be the actual compiled flight binary, never a re-implementation, however faithful.
:::

::: check
A team uses a Python model of the guidance algorithm for six months of early design work, clearly labelled as a placeholder, with the real flight code arriving later. What specific risk does this lesson identify with this practice, beyond the divergence risk already discussed?
:::

::: answer
The risk is not the placeholder itself, which is reasonable during early design — it is the placeholder quietly becoming permanent because replacing it with the compiled flight code was never scheduled as an explicit, tracked task. Results and margins established against the Python model can end up cited in later reviews as if they described the real flight software's behaviour, precisely the flight-software-in-the-loop boundary this lesson argues must not be skipped for anything that will inform a flight decision.
:::

::: check
Why is a byte-order or field-size mistake in the simulation's interface harness considered a less dangerous class of bug than a silent divergence between two independent implementations of the same algorithm?
:::

::: answer
A harness mistake is local and structural — it corrupts the data crossing a well-defined boundary, which is exactly the kind of defect that a direct comparison of what goes in against what the real interface expects is designed to catch, the same way any frame or unit bug is caught by checking a boundary explicitly. A silent algorithmic divergence between two codebases has no such boundary to check against; it can only be found by noticing that two things that were assumed to be identical are not, on some particular input or after some particular duration, which is far harder to test for systematically.
:::

## Summary

| Item | Statement |
| --- | --- |
| The risk of re-implementation | Two codebases for "the same" algorithm can diverge from floating-point width alone, with no logic error anywhere — measured $0.1^\circ$ after 5.6 hours from `float64` vs `float32` |
| "Equivalent" is not permanent | Two defensible implementations of the same function can agree on every ordinary test case and disagree substantially on a realistic large input — measured $0.186^\circ$ at an angle a reaction wheel's counter reaches within $2.2$ days |
| What crosses the boundary | The actual compiled flight binary, called through a thin, explicitly-reviewed harness that mimics the real onboard data interface |
| What is allowed to be new | Only the harness — never the algorithm |
| Placeholder discipline | A Python model is a reasonable stand-in only while explicitly tracked as one, with a scheduled swap to the real flight code before any result informs a flight decision |

This lesson set the principle; the next lesson gives the progression a name — software-in-the-loop, processor-in-the-loop, hardware-in-the-loop — and is precise about what each additional step actually adds that the one before it could not catch.
