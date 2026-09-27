---
id: l08-testing-numerical-code
title: Testing numerical code without an answer key
minutes: 22
covers:
  - 'Testing numerical code: invariants, convergence order, conservation laws'
---

Think about checking a long division problem when the teacher has not handed back the answer key. You divided $7\,392$ by $24$ and got $308$. Is it right? You do not need the key. Multiply back: $308 \times 24 = 7\,392$. It checks. You tested the answer against a rule that *must* hold, not against a number someone gave you.

Numerical code — integrators, rotation libraries, orbit propagators — is mostly in that position: nobody can work the answer out by hand, which is why you wrote the code. This lesson is about testing it anyway, with three tools: **invariants** (things that must always be true of a correct answer), **convergence order** (how the error must shrink when you make the step smaller), and **conservation laws** (quantities the physics says cannot change). Together they catch the bugs that hard-coded numbers miss, including in simulations whose output is chaotic.

## Why a hard-coded expected value is a weak test

The first test most people write for a numerical function looks like this: run it once, print the answer, paste the answer into an `assert`. That test has three problems.

- **Where did the number come from?** From the code under test. If the code had a bug when you ran it, the test now protects the bug. This is called the **[[oracle problem|oracle-problem]]**: to check an answer, you need something that knows the right answer.
- **It only checks one input.** A rotation that is correct at $30°$ and wrong at $150°$ passes.
- **It breaks for the wrong reasons.** A new step size or compiler moves the last digits.

Hard-coded values still have a place, in hand-checkable cases and golden files. But the backbone of a numerical test suite is *properties*: relationships that must hold for every input, which you can argue for on paper.

## Invariants: what must always be true

An **invariant** is a property that a correct result has no matter what the input was. Here is the everyday version: however you shuffle a deck of cards, it still has 52 cards and one of each. A shuffling function that returns 51 cards is broken, and you know it without knowing what order the cards should be in.

### A rotation matrix

A **rotation matrix** $\mathbf{C}$ is a $3 \times 3$ matrix that turns vectors without stretching or mirroring them. GNC code uses them for attitude, frame changes and sensor pointing. Every proper rotation matrix has three invariants.

1. **Finite.** Every entry is an ordinary number, not `nan` (not a number) or `inf` (infinity). Check with `np.all(np.isfinite(C))`.
2. **[[Orthonormal|orthonormal]].** Its columns are unit vectors at right angles to each other, which is the same as saying $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$. Read $\mathbf{C}^{\mathsf{T}}$ as "C transpose" (rows and columns swapped) and $\mathbf{I}$ as "the identity matrix", ones on the diagonal and zeros elsewhere. In NumPy: `np.allclose(C @ C.T, np.eye(3), rtol=0, atol=tol)`.
3. **Determinant $+1$.** The **determinant**, $\det \mathbf{C}$, measures how the matrix scales volumes, with a sign that says whether it mirrors. A rotation keeps volume and does not mirror, so $\det \mathbf{C} = +1$. A mirror image (a **reflection**) has $\det = -1$ and is still orthonormal. Check with `abs(np.linalg.det(C) - 1.0) < tol`.

The target $\mathbf{C}\mathbf{C}^{\mathsf{T}} - \mathbf{I}$ is full of zeros, so the tolerance is absolute (`rtol=0`); $10^{-12}$ is comfortably above rounding noise. As pytest tests over 13 angles:

```python
import numpy as np
import pytest

from rotations import rot_z   # active rotation about +z: turns +x toward +y

ANGLES = np.linspace(-np.pi, np.pi, 13)


@pytest.mark.parametrize("theta", ANGLES)
def test_rot_z_is_a_proper_rotation(theta):
    C = rot_z(theta)
    assert np.all(np.isfinite(C))
    assert np.allclose(C @ C.T, np.eye(3), rtol=0, atol=1e-12)
    assert abs(np.linalg.det(C) - 1.0) < 1e-12
```

Where

$$
\mathbf{C}_z(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}.
$$

### What invariants cannot see

Now the uncomfortable part. Flip the signs of both sine terms — the single most common bug in rotation code — and you get $\mathbf{C}_z(-\theta)$: a rotation by the same angle the *other way*. Is it orthonormal? Yes. Is its determinant $+1$? Yes. Every invariant above passes. A rotation the wrong way round is still a perfectly good rotation.

So a rotation suite needs at least one **directed case**: a single input whose correct output you can state from the definition, independent of the code. For an active rotation about $+z$, the **[[right-hand rule|right-hand-rule]]** says a turn of $+90°$ carries the $+x$ axis onto the $+y$ axis:

```python
from numpy.testing import assert_allclose


def test_rot_z_turns_x_toward_y():
    # one directed case: +90 degrees about z carries +x onto +y
    x_new = rot_z(np.pi / 2) @ [1.0, 0.0, 0.0]
    assert_allclose(x_new, [0.0, 1.0, 0.0], rtol=0, atol=1e-12)
```

The expected value comes from the written-down convention, not from a run of the code. That is the difference between a directed case and a hard-coded output.

::: warning State the convention before you test it
"Rotation matrix" means two different things in GNC code. An *active* rotation turns a vector inside one frame. A *passive* rotation, or direction cosine matrix (DCM), re-expresses a fixed vector in a turned frame, and it is the transpose of the active one. Both pass every invariant. The directed case is where the convention lives, so write it down in the test's comment. A directed case that silently assumes the wrong convention will "fix" correct code into wrong code.
:::

### A quaternion library

A **quaternion** is a set of four numbers $q = [w, x, y, z]$ that stores an attitude compactly. It has a scalar part $w$ and a vector part $[x, y, z]$, and attitude quaternions have length $1$ (they are **unit quaternions**). Multiplying two of them, $p \otimes q$ (read "p times q", with the special quaternion product), combines two rotations. Quaternions have their own invariants, and none of them needs a hard-coded answer:

- The product of two unit quaternions is a unit quaternion.
- $q$ and $-q$ **[[describe the same rotation|double-cover]]**, so they must convert to the same rotation matrix.
- Converting to a rotation matrix and back reproduces the original rotation (up to that sign).
- The quaternion product matches the matrix product: $\mathbf{C}(p \otimes q) = \mathbf{C}(p)\,\mathbf{C}(q)$.

```python
from rotations import qmul, q_to_dcm   # Hamilton product; quaternion to matrix


def random_unit_quaternions(n, seed=0):
    q = np.random.default_rng(seed).normal(size=(n, 4))
    return q / np.linalg.norm(q, axis=1, keepdims=True)


def test_product_of_unit_quaternions_is_unit():
    for p, q in zip(random_unit_quaternions(500, 1), random_unit_quaternions(500, 2)):
        assert abs(np.linalg.norm(qmul(p, q)) - 1.0) < 1e-12


def test_q_and_minus_q_give_the_same_rotation():
    for q in random_unit_quaternions(500):
        assert np.allclose(q_to_dcm(q), q_to_dcm(-q), rtol=0, atol=1e-12)


def test_quaternion_product_matches_matrix_product():
    for p, q in zip(random_unit_quaternions(500, 3), random_unit_quaternions(500, 4)):
        assert np.allclose(q_to_dcm(qmul(p, q)), q_to_dcm(p) @ q_to_dcm(q),
                           rtol=0, atol=1e-12)
```

Four normal random numbers divided by their length give quaternions spread evenly over all attitudes; fixed seeds keep runs repeatable. Hypothesis, from the property-based testing lesson, works equally well.

::: key
Three good invariants for a quaternion library: unit norm is preserved by multiplication; $q$ and $-q$ give the same rotation matrix; converting to a DCM and back reproduces the original rotation. None of these require a hard-coded expected value.
:::

## Prove that your tests can fail

A test that has never failed has not shown you anything. Maybe it checks the right thing. Maybe it has a bug of its own and would pass whatever the code did. The only way to know is to break the code on purpose and watch.

So make it a habit: after writing a set of tests, flip one sign in the code under test and run the suite. Here is the rotation suite, with the two sine terms in `rot_z` swapped:

```text
$ pytest -q tests/test_rotations.py
.............F...                                                        [100%]
=================================== FAILURES ===================================
_________________________ test_rot_z_turns_x_toward_y __________________________
...
>       assert_allclose(x_new, [0.0, 1.0, 0.0], rtol=0, atol=1e-12)
E       AssertionError:
E       Not equal to tolerance rtol=0, atol=1e-12
E
E       Mismatched elements: 1 / 3 (33.3%)
E       Mismatch at index:
E        [1]: -1.0 (ACTUAL), 1.0 (DESIRED)
...
FAILED tests/test_rotations.py::test_rot_z_turns_x_toward_y - AssertionError:
1 failed, 16 passed in 0.30s
```

Read three things off this run. The suite went red, so it *can* catch this bug. All 16 other tests still passed, as predicted — without the directed case, this bug would have shipped. And the message points at the cause: the $y$ component came out $-1$ instead of $+1$. (A first draft of this test used a bare `assert np.allclose(...)`, which failed with a wall of array text; watching it fail is how you find that out.) Then revert the change.

::: key
A deliberately injected sign error is the only way to know your tests can fail. Flip a sign, confirm the suite goes red and that the failure message points at the cause, then revert. A suite that never fails is measuring nothing.
:::

Doing this automatically, for hundreds of small edits, is called **[[mutation testing|mutation-testing]]**.

## Convergence order: how fast the error must shrink

For integrators the strongest tool is this one. Picture measuring a curved garden path by laying down straight sticks end to end. Short sticks follow the curve better than long ones, so the total gets closer to the true length as the sticks shrink. How much closer, for each halving of stick length, depends on how cleverly you lay them. That rate is a fingerprint of the method.

An integrator steps a differential equation forward in time with a step size $h$. Its **global error** at a fixed end time — the difference between the computed answer and the true one — behaves for small $h$ like

$$
e(h) \approx C\,h^p,
$$

where $C$ is a constant that depends on the problem and $p$ is the method's **[[order|order-word]]**. Read $h^p$ as "h to the p". Forward Euler has order $p = 1$. The classic fourth-order Runge–Kutta method (RK4) has $p = 4$.

Now halve the step:

$$
\frac{e(h)}{e(h/2)} \approx \frac{C\,h^p}{C\,(h/2)^p} = 2^p.
$$

The constant $C$ cancels. Halving the step divides Euler's error by $2^1 = 2$ and RK4's by $2^4 = 16$. Take the base-2 logarithm of both sides and you get the **observed order**:

$$
p_{\text{obs}} = \log_2 \frac{e(h)}{e(h/2)}.
$$

You can predict it without knowing $C$, and a bug in the method almost always changes it.

::: note Why the error goes as h to the p
A method of order $p$ is built so that one step matches the Taylor series of the true solution through the $h^p$ term. What is left over — the **local error** of one step — is about $K h^{p+1}$ for some constant $K$. To reach a fixed end time $T$ you take $T/h$ steps. If each adds roughly that much error, the total is about

$$
\frac{T}{h} \cdot K h^{p+1} = (TK)\,h^p.
$$

That is $C h^p$ with $C = TK$. One power of $h$ is lost because there are more steps when the steps are smaller. (Errors can also grow or shrink as they are carried forward, which changes $C$ but not the power $p$ as long as the problem is smooth and $T$ is fixed.)
:::

::: example Measuring the order of Euler and RK4
Test problem: $\ddot{x} = -x$ (read "x double-dot", the second derivative of position with time) with $x(0) = 1$ and $\dot{x}(0) = 0$. It is a mass on a spring, and its exact solution is $x = \cos t$, $\dot{x} = -\sin t$. Integrate to $t = 1\,\mathrm{s}$ and measure the error (the length of the difference vector in position and velocity):

| $h$ (s) | Euler error | RK4 error |
|---|---|---|
| 0.1 | $5.112 \times 10^{-2}$ | $8.333 \times 10^{-7}$ |
| 0.05 | $2.530 \times 10^{-2}$ | $5.208 \times 10^{-8}$ |
| 0.025 | $1.258 \times 10^{-2}$ | $3.255 \times 10^{-9}$ |
| 0.0125 | $6.269 \times 10^{-3}$ | $2.034 \times 10^{-10}$ |

Euler first: $5.112 \times 10^{-2} / 2.530 \times 10^{-2} = 2.021$, and $\log_2 2.021 = 1.015$. The later ratios are $2.012$ and $2.006$, giving orders $1.008$ and $1.004$. Order 1, as promised, and getting closer as $h$ shrinks.

RK4: $8.333 \times 10^{-7} / 5.208 \times 10^{-8} = 16.0$, and $\log_2 16 = 4.00$. Every halving divides the error by 16. Order 4.

Sanity check: at $h = 0.1\,\mathrm{s}$ RK4 is already about $60\,000$ times more accurate than Euler, which is why nobody propagates orbits with Euler.
:::

As a test, parametrized over the two methods:

```python
import numpy as np
import pytest

from integrators import euler, rk4


def oscillator(y):
    return np.array([y[1], -y[0]])        # x'' = -x


def observed_order(method, h):
    exact = np.array([np.cos(1.0), -np.sin(1.0)])
    e_h = np.linalg.norm(method(oscillator, [1.0, 0.0], 1.0, h) - exact)
    e_h2 = np.linalg.norm(method(oscillator, [1.0, 0.0], 1.0, h / 2) - exact)
    return np.log2(e_h / e_h2)


@pytest.mark.parametrize("method, p", [(euler, 1), (rk4, 4)], ids=["euler", "rk4"])
def test_convergence_order(method, p):
    assert observed_order(method, 0.05) == pytest.approx(p, abs=0.1)
```

Here `integrators.rk4(f, y0, t_end, h)` is a plain RK4 loop. Now break it the way people really do: a copy-paste typo in the third stage, `k3 = f(y + 0.5 * h * k1)` where it should say `k2`. At $h = 0.01\,\mathrm{s}$ this broken RK4 gives $x(1) = 0.5402953$ against the true $\cos 1 = 0.5403023$ — agreement to five digits. It looks fine. Printing the answer would never catch it. The order test does:

```text
$ pytest -q tests/test_integrators.py
.F                                                                       [100%]
...
E       assert np.float64(2.0000707225559347) == 4 ± 0.1
E         comparison failed
E         Obtained: 2.0000707225559347
E         Expected: 4 ± 0.1
...
FAILED tests/test_integrators.py::test_convergence_order[rk4] - assert np.flo...
1 failed, 1 passed in 0.21s
```

The typo turned a fourth-order method into a second-order one. The answer is still close; the fingerprint is wrong.

::: warning Measure the order in the right range of step sizes
$e \approx C h^p$ only holds when $h$ is small enough, in the **asymptotic range**. With steps too large the observed order comes out off; too small and the error hits rounding noise near $10^{-15}$, making the ratio meaningless. For RK4, pick steps where the errors land roughly between $10^{-4}$ and $10^{-11}$.
:::

### When you have no exact solution

Most real problems have no formula for the answer. You can still measure the order by running three step sizes, $h$, $h/2$ and $h/4$, and comparing them with each other. Since $y_h - y_{h/2} \approx C h^p (1 - 2^{-p})$ and $y_{h/2} - y_{h/4} \approx C (h/2)^p (1 - 2^{-p})$, their ratio is again $2^p$:

$$
p_{\text{obs}} \approx \log_2 \frac{\lVert y_h - y_{h/2} \rVert}{\lVert y_{h/2} - y_{h/4} \rVert}.
$$

The double bars $\lVert \cdot \rVert$ mean "length of the vector". Run on the double pendulum from the last section of this lesson, integrated to $2\,\mathrm{s}$ with RK4, steps of $0.004$, $0.002$ and $0.001\,\mathrm{s}$ give differences of $2.30 \times 10^{-7}$ and $1.57 \times 10^{-8}$, so $p_{\text{obs}} = \log_2(14.6) = 3.88$. With steps twice as large, $0.01$ down to $0.0025\,\mathrm{s}$, it comes out $3.62$: those steps are not yet in the asymptotic range.

## Conservation laws: what the physics will not let change

A **conservation law** says some quantity stays constant as a system moves. An orbit around a single point-mass Earth, with no drag, keeps its **specific orbital energy** (energy per kilogram of spacecraft) and its angular momentum:

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}.
$$

Here $v$ is the speed, $r$ the distance from Earth's center, and $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravitational parameter. Read $\varepsilon$ as "epsilon". The first term is kinetic energy per kilogram, the second is potential energy per kilogram. As the spacecraft falls toward Earth it speeds up, trading one for the other, but the sum does not change.

A correct propagator must keep $\varepsilon$ nearly constant, and how "nearly" is itself a fingerprint of the integrator.

::: example Energy in a LEO orbit: RK4 against velocity Verlet
Start at $r = 6778\,\mathrm{km}$ from Earth's center ($400\,\mathrm{km}$ up) moving sideways at $1.05$ times circular speed: $1.05 \times 7669 = 8052\,\mathrm{m/s}$. That gives

$$
\varepsilon = \frac{8052^2}{2} - \frac{3.986 \times 10^{14}}{6.778 \times 10^6} \approx -2.639 \times 10^7\,\mathrm{J/kg},
$$

an ellipse with eccentricity $0.1025$ that swings out to about $1948\,\mathrm{km}$ altitude, with a period of $6531\,\mathrm{s}$ (about $109$ minutes). Integrate with a $60\,\mathrm{s}$ step, about $109$ steps per orbit, with two methods, and track the worst relative energy error $|\varepsilon/\varepsilon_0 - 1|$ so far:

| orbits | RK4 | velocity Verlet |
|---|---|---|
| 1 | $1.65 \times 10^{-7}$ | $3.69 \times 10^{-4}$ |
| 10 | $1.56 \times 10^{-6}$ | $3.69 \times 10^{-4}$ |
| 100 | $1.55 \times 10^{-5}$ | $3.69 \times 10^{-4}$ |
| 1000 | $1.55 \times 10^{-4}$ | $3.69 \times 10^{-4}$ |

RK4 is far more accurate at first, but its error grows by about $1.55 \times 10^{-7}$ every orbit, in a straight line. Keep going and it passes Verlet after roughly $2400$ orbits. **Velocity Verlet** (also called leapfrog), a simpler second-order method, wobbles by up to $3.69 \times 10^{-4}$ within each orbit — the error swells near perigee, where the spacecraft moves fastest, and shrinks again — but the wobble never grows.

Sanity check: the circular speed $\sqrt{\mu/r} = \sqrt{3.986 \times 10^{14} / 6.778 \times 10^{6}} \approx 7669\,\mathrm{m/s}$ matches the familiar $7.7\,\mathrm{km/s}$ of low Earth orbit.
:::

Verlet belongs to a family called **[[symplectic integrators|symplectic]]**. They do not conserve energy exactly, but they exactly conserve a slightly different "shadow" energy, so the true energy wobbles around its starting value forever instead of drifting. They are also **time-reversible**: run forward, flip the velocity, run the same number of steps, and you land back where you started, up to rounding. RK4 has neither property.

Each of these is a test:

```python
import numpy as np

from orbit import MU, energy, verlet

R0 = np.array([6778e3, 0.0, 0.0])                      # m, 400 km altitude
V0 = np.array([0.0, 1.05 * np.sqrt(MU / 6778e3), 0.0])  # m/s, 5% above circular
H = 60.0                                               # s


def test_verlet_energy_stays_bounded():
    E0 = energy(R0, V0)
    r, v = R0, V0
    worst = []
    for block in range(10):                   # ten blocks of about 10 orbits
        errs = []
        for _ in range(1090 // 10):
            r, v = verlet(r, v, H, 10)
            errs.append(abs(energy(r, v) / E0 - 1.0))
        worst.append(max(errs))
    assert max(worst) < 1e-3                  # the known size of the wobble
    assert worst[-1] < 1.1 * worst[0]         # and it does not grow


def test_verlet_is_time_reversible():
    r, v = verlet(R0, V0, H, 1090)            # about 10 orbits forward
    r, v = verlet(r, -v, H, 1090)             # flip velocity, same steps back
    assert np.linalg.norm(r - R0) < 1e-3      # meters
    assert np.linalg.norm(-v - V0) < 1e-6     # m/s
```

After ten orbits out and ten back — more than $400\,000\,\mathrm{km}$ of travel — Verlet returns to within $3.0 \times 10^{-6}\,\mathrm{m}$ of its start, three micrometers. The same round trip with RK4 misses by $1.23\,\mathrm{km}$. So this test can tell a correct Verlet from something that only looks like one.

::: warning Know which law your model really keeps
Add drag and energy is no longer conserved; add Earth's oblateness and only the polar component of angular momentum is; add thrust and nothing is. Test the law your model really obeys, or test a balance instead: energy lost equals work done by drag.
:::

## When the trajectory itself is chaotic

Some systems are **chaotic**: a tiny change in the starting point **[[grows|chaos-growth]]** until the two paths have nothing in common. A **double pendulum** — one pendulum hanging from the end of another — is the classic desk-sized one, and multi-body orbits near the Moon can behave the same way.

Take a double pendulum with two $1\,\mathrm{m}$ arms and two $1\,\mathrm{kg}$ bobs, both arms released from rest at $2\,\mathrm{rad}$ (about $115°$) from straight down. Integrate with RK4 at $h = 0.001\,\mathrm{s}$. Then do it again with the first angle changed by $10^{-12}\,\mathrm{rad}$, a trillionth of a radian:

| time (s) | lower arm angle, run 1 (rad) | run 2 (rad) | difference (rad) |
|---|---|---|---|
| 10 | $-10.5015$ | $-10.5015$ | $6.8 \times 10^{-9}$ |
| 20 | $-32.1802$ | $-32.1787$ | $1.5 \times 10^{-3}$ |
| 25 | $-20.0138$ | $-15.8740$ | $4.1$ |

(The angles pass $-2\pi$ because the lower arm keeps flipping all the way over.) By $25\,\mathrm{s}$ the two runs disagree completely. Halving the step to $0.0005\,\mathrm{s}$ does the same: at $25\,\mathrm{s}$ it gives $-36.4750\,\mathrm{rad}$, different from both. So would a new compiler. None of these answers is "the right one" in any testable sense, and a golden file of this trajectory past about $15\,\mathrm{s}$ could only pass with a tolerance so wide it tests nothing.

So you do not test the trajectory. You test the things that are still true:

- **Convergence order** on a short horizon, before the chaos has grown: the $3.88$ measured earlier was on this very pendulum, over $2\,\mathrm{s}$.
- **Conservation of energy.** The total energy of the pendulum is $12.25\,\mathrm{J}$ at the start. At $25\,\mathrm{s}$, when the angle itself is meaningless, the energy is still correct to $4.1 \times 10^{-8}\,\mathrm{J}$, about $3$ parts in a billion, and halving the step shrinks that error further.
- **Time-reversibility**, if the scheme is symplectic.
- **Agreement with an exact answer on a non-chaotic piece of the problem.** For tiny swings, the double pendulum becomes linear and has two exact **normal modes** — patterns where both bobs swing at the same frequency. For equal arms and bobs, the slow mode has $\omega^2 = (g/L)(2 - \sqrt{2})$ and the lower angle is $\sqrt{2}$ times the upper one. With $g = 9.81\,\mathrm{m/s^2}$ and $L = 1\,\mathrm{m}$, $\omega = 2.397\,\mathrm{rad/s}$ and the period is $2\pi/\omega = 2.621\,\mathrm{s}$. Start the code in that mode with a swing of $10^{-4}\,\mathrm{rad}$, run one period, and it returns to its start within a few parts in $10^{8}$ of the swing — the size of the small nonlinear effects that the linear formula leaves out.

Code that passes all four is right, even though no one can say where the pendulum is at $t = 25\,\mathrm{s}$.

::: key
How do you test an integrator whose trajectory is chaotic? Do not test the trajectory. Test the properties: convergence order under step halving, conservation of energy or of a known integral, time-reversibility for a symplectic scheme, and agreement with an analytic solution on a non-chaotic subproblem.
:::

## Check yourself

::: check
Someone's test for a rotation library runs `rot_x(0.3)` once, pastes the printed matrix into the test file, and checks against it with `assert_allclose`. Name two weaknesses of this test and one test that would be better.
:::

::: answer
Weaknesses: the expected matrix came from the code under test, so if the code was wrong when it was printed, the test protects the bug (the oracle problem). And it checks one angle only; a bug that shows up at other angles, or only in some quadrants, passes.

Better: invariant tests over many angles (finite entries, $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$ within an absolute tolerance, $\det \mathbf{C} = +1$), plus one directed case whose answer comes from the stated convention — for an active rotation about $+x$, a turn of $+90°$ carries $+y$ onto $+z$.
:::

::: check
A method's error at a fixed end time is $3.2 \times 10^{-5}$ with step $h$ and $4.0 \times 10^{-6}$ with step $h/2$. What is its observed order? What error do you expect at $h/4$?
:::

::: answer
The ratio is $3.2 \times 10^{-5} / 4.0 \times 10^{-6} = 8$, and $\log_2 8 = 3$, so the observed order is $3$. Each halving divides the error by $2^3 = 8$, so at $h/4$ expect about $4.0 \times 10^{-6} / 8 = 5.0 \times 10^{-7}$.
:::

::: check
Why can the observed-order test catch the RK4 typo (`k1` in place of `k2`) when checking the answer at $h = 0.01\,\mathrm{s}$ against $\cos 1$ with `pytest.approx` would probably not?
:::

::: answer
The broken method is still a consistent method; it is second order instead of fourth. At $h = 0.01\,\mathrm{s}$ its answer, $0.5402953$, differs from $\cos 1 = 0.5403023$ by about $7 \times 10^{-6}$, which is a relative error of $1.3 \times 10^{-5}$. Many tolerances a person would pick for "is the answer right" would let that through, and a looser check certainly would. But the *rate* at which the error shrinks cannot hide: halving the step divides its error by $4$, not $16$, so the observed order is $2.0$ instead of $4.0$ — a difference no reasonable tolerance can swallow.
:::

::: check
After a change to an orbit propagator, the worst relative energy error over 100 orbits jumps from $3.7 \times 10^{-4}$ (bounded wobble, as before) to a steady climb that reaches $2 \times 10^{-2}$. The model has no drag or thrust. What does that suggest, and which other test would you run to confirm?
:::

::: answer
A steady climb means the integrator is no longer behaving like a symplectic scheme, or the force has changed: either the Verlet update was broken (for example, a velocity half-step dropped or a stale acceleration used), or the gravity calculation itself is wrong in a way that pumps energy in. Bounded wobble is the fingerprint of a correct symplectic method; drift is not.

To confirm, run the time-reversibility test — ten orbits forward, flip the velocity, ten back. A correct Verlet returns within micrometers; a broken one misses by far more. A convergence-order test on a short arc would also show whether the method is still second order.
:::

## Summary

| Tool | What it checks | Example |
|---|---|---|
| Invariant | a property every correct answer has | $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$, $\det \mathbf{C} = +1$, all entries finite |
| Quaternion invariants | unit norm under product; $q$ and $-q$ same DCM; DCM round trip | 500 random unit quaternions, fixed seed |
| Directed case | direction and convention, which invariants cannot see | $\mathbf{C}_z(90°)\,\hat{\mathbf{x}} = \hat{\mathbf{y}}$ |
| Injected bug | that the tests can fail at all | flip a sign, see red, read the message, revert |
| Convergence order | the method's fingerprint | $p_{\text{obs}} = \log_2 \dfrac{e(h)}{e(h/2)}$: Euler 1, RK4 4 |
| Order without exact answer | three step sizes | $p_{\text{obs}} \approx \log_2 \dfrac{\lVert y_h - y_{h/2}\rVert}{\lVert y_{h/2} - y_{h/4}\rVert}$ |
| Conservation law | the physics | $\varepsilon = v^2/2 - \mu/r$ constant in two-body motion |
| Symplectic scheme | bounded energy wobble, time-reversible | velocity Verlet: $3.69 \times 10^{-4}$ wobble, back within $3\,\mu\mathrm{m}$ |
| Chaotic trajectory | never the trajectory itself | order, conservation, reversibility, exact non-chaotic case |

The tests in this lesson all run pure computation. The next lesson deals with code that talks to things outside the computer — an altimeter, an IMU, a valve — and how to test it with stand-ins when the real hardware is not on your desk.

::: context oracle-problem The oracle problem
In testing, an oracle is whatever tells you the right answer for a given input: a hand calculation, a trusted older program, a published table. The name comes from the ancient oracles people consulted for answers they could not work out themselves. For most numerical code no oracle exists, which is why testers lean on partial oracles: properties that any correct answer must have, even if they do not pin down the answer completely. Every tool in this lesson is a partial oracle.
:::

::: context orthonormal What orthonormal means
"Ortho" is Greek for straight or right, as in right angles; "normal" here means length one. A matrix is orthonormal when its columns are unit vectors at right angles to each other. Multiply $\mathbf{C}^{\mathsf{T}}\mathbf{C}$ and each entry is the dot product of two columns: $1$ on the diagonal (each column with itself) and $0$ off it (different columns are perpendicular). That is why the whole condition fits in one line, $\mathbf{C}^{\mathsf{T}}\mathbf{C} = \mathbf{I}$, which for a square matrix is equivalent to $\mathbf{C}\mathbf{C}^{\mathsf{T}} = \mathbf{I}$.
:::

::: context right-hand-rule The right-hand rule
Point the thumb of your right hand along the axis of rotation. Your fingers curl in the direction of a positive rotation. With the thumb along $+z$, the fingers sweep from $+x$ toward $+y$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="120" x2="270" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="280,120 268,114 268,126" fill="#1f2a44"/>
  <text x="288" y="124" font-size="13" fill="#1f2a44">+x</text>
  <line x1="150" y1="120" x2="150" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="150,20 144,32 156,32" fill="#1f2a44"/>
  <text x="140" y="16" font-size="13" fill="#1f2a44">+y</text>
  <circle cx="150" cy="120" r="7" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="150" cy="120" r="2.5" fill="#1f2a44"/>
  <text x="104" y="144" font-size="12" fill="#1f2a44">+z (toward you)</text>
  <path d="M 230 120 A 80 80 0 0 0 150 40" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="150,40 162,34 162,46" fill="#1d6fd1"/>
  <text x="216" y="66" font-size="12" fill="#1d6fd1">+90°</text>
  <text x="16" y="60" font-size="12" fill="#b4232c">sign flipped:</text>
  <text x="16" y="76" font-size="12" fill="#b4232c">+x goes to −y</text>
</svg>
```

Whether a library follows this rule is exactly the kind of fact a directed test pins down.
:::

::: context double-cover Why q and −q are the same attitude
A unit quaternion for a turn by angle $\theta$ about a unit axis $\hat{\mathbf{n}}$ is $q = [\cos(\theta/2),\ \hat{\mathbf{n}}\sin(\theta/2)]$. Replace $\theta$ by $\theta + 2\pi$ — the same physical attitude, one full extra turn — and both $\cos(\theta/2)$ and $\sin(\theta/2)$ change sign, giving $-q$. So every attitude has exactly two quaternions. The rotation matrix is built from products of pairs of quaternion components, like $2(xy - wz)$, and each product is unchanged when both factors flip sign. That is why $q$ and $-q$ must give the same matrix — and why a quaternion comparison in a test must accept either sign.
:::

::: context mutation-testing Mutation testing, automated
Tools such as mutmut and Cosmic Ray for Python make many small changes to your code, one at a time — flip `<` to `<=`, `+` to `-`, a constant to another constant — and run your test suite against each "mutant". A mutant the suite fails on is "killed"; one that survives shows a behavior no test checks. Full mutation runs are slow, because the suite runs once per mutant, so teams often run them overnight or only on the modules that matter most, such as guidance laws and attitude math.
:::

::: context order-word Where "order" comes from
The word comes from Taylor series, which write a smooth function near a point as a sum of powers: $f(t + h) = f(t) + h f'(t) + \tfrac{h^2}{2} f''(t) + \dots$. A method "of order $p$" matches that series through the $h^p$ term. On a log-log plot of error against step size, a method of order $p$ is a straight line with slope $p$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <text x="195" y="192" font-size="12" fill="#1f2a44" text-anchor="middle">step size h (log scale, halving to the left)</text>
  <text x="14" y="100" font-size="12" fill="#1f2a44" transform="rotate(-90 14 100)" text-anchor="middle">error (log)</text>
  <line x1="100" y1="54" x2="310" y2="30" stroke="#f2b880" stroke-width="3"/>
  <text x="250" y="26" font-size="12" fill="#1f2a44">Euler, slope 1</text>
  <line x1="100" y1="160" x2="310" y2="64" stroke="#1d6fd1" stroke-width="3"/>
  <text x="250" y="96" font-size="12" fill="#1d6fd1">RK4, slope 4</text>
  <line x1="100" y1="120" x2="230" y2="90" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="112" y="140" font-size="11" fill="#b4232c">RK4 with typo, slope 2</text>
</svg>
```

Halving $h$ moves one step left; the error drops by $2^p$.
:::

::: context symplectic What symplectic means
The word is Greek for "woven together", chosen by the mathematician Hermann Weyl in 1939. For our purposes: the equations of an orbit or a pendulum have a hidden geometric structure — they preserve areas in the space of positions and momenta. A symplectic integrator preserves that structure exactly, step by step. The payoff is that its energy error stays bounded over enormous times instead of accumulating. That is why long-term solar-system simulations, which run for millions of orbits, use symplectic methods.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="20" x2="40" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <text x="190" y="142" font-size="12" fill="#1f2a44" text-anchor="middle">time (many orbits)</text>
  <text x="46" y="16" font-size="12" fill="#1f2a44">energy error</text>
  <path d="M40,120 Q55,80 70,120 Q85,80 100,120 Q115,80 130,120 Q145,80 160,120 Q175,80 190,120 Q205,80 220,120 Q235,80 250,120 Q265,80 280,120 Q295,80 310,120 Q325,80 340,120" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="120" x2="340" y2="30" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="48" font-size="12" fill="#b4232c">RK4: steady drift</text>
  <text x="200" y="80" font-size="12" fill="#1d6fd1">Verlet: bounded wobble</text>
</svg>
```
:::

::: context chaos-growth How fast chaos grows
In the pendulum runs, the gap between the two starts grew from $10^{-12}\,\mathrm{rad}$ to $6.8 \times 10^{-9}$ at $10\,\mathrm{s}$ and to $1.5 \times 10^{-3}$ at $20\,\mathrm{s}$ — about a factor of $200\,000$ in ten seconds. Growth like this is exponential, and its rate is measured by the Lyapunov exponent, named after the Russian mathematician Aleksandr Lyapunov. Because the growth is exponential, better arithmetic buys little time: starting a thousand times closer delays the divergence only by the time it takes the gap to grow a thousandfold, about six seconds here.
:::
