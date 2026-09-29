---
id: l07-reviewing-a-diff
title: Reviewing a diff
minutes: 25
covers:
  - "Reviewing a diff: correctness, tests, interfaces, units and frames"
---

Last lesson you wrote a pull request. Now you are in the other chair. Leo has opened a PR that adds attitude math to orbit-sim — a quaternion-to-matrix conversion, the Sun's direction as seen from the spacecraft, and a check on how fast the spacecraft is turning. CI is green. You are the reviewer.

Passing tests tell you less than it seems: they check what their author thought of. A reviewer thinks of what the author did not. In numerical code the errors that fly are rarely crashes. They are degrees where radians were expected, or a matrix used backwards: code that runs, gives reasonable-looking numbers, and points the solar panels the wrong way. Mars Climate Orbiter (basics lesson 09) was lost to exactly this kind of error.

By the end you will have a plan for reviewing a numerical PR of a few hundred lines, a checklist for units, frames and the other usual suspects, and a way of writing comments that catch a real error without an argument about style.

## What a review is for

Picture a building inspector. They do not care whether the kitchen is blue or green, only whether the wiring will start a fire, and they do not refuse to sign because it is not the house they would have built. A good reviewer works the same way.

Google's published guide to code review (its **[[Engineering Practices|google-eng-practices]]** documents) puts the standard like this, in our words: approve a change once it definitely makes the code base healthier overall, even if it is not perfect. No change is perfect. The question is not "is this how I would have written it?" but "is the code better with this change than without it, and is anything here wrong?"

That standard splits comments into two kinds:

- **Blocking** — must be fixed before merge: wrong results, missing tests for the new behavior, an interface that will be hard to change later, a unit or frame error.
- **Non-blocking** — worth saying but not worth holding the change for: naming preferences, layout, a slightly neater way to write a loop. Many teams prefix these with **"nit:"** ("a nitpick").

::: key When to approve a PR you would have written differently
When it definitively improves overall code health even if it is not the way you would have done it. Style preference is a non-blocking nit; correctness, tests and interface design are blocking.
:::

Marking every comment tells the author which three of your twelve comments stand between them and merging. It also keeps you honest: if you cannot say why a comment blocks, it probably does not. And respond within a working day; slow reviews push authors toward bigger PRs.

## Getting the diff in front of you

For numerical code, have the branch locally, where you can run things. (On GitHub, `git fetch origin pull/123/head:pr-123` makes a local branch from PR number 123.) Leo's branch is on the team's server:

```bash
git fetch origin
git diff --stat origin/main...origin/leo/attitude
```

```text
 README.md              |  2 +-
 attitude.py            | 34 ++++++++++++++++++++++++++++++++++
 tests/test_attitude.py | 21 +++++++++++++++++++++
 3 files changed, 56 insertions(+), 1 deletion(-)
```

The `--stat` summary is your map: two new files and a one-line README change. Look at one file at a time with `git diff origin/main...origin/leo/attitude -- attitude.py`. Useful options:

- `-w` ignores whitespace changes, so a re-indented block does not hide the real change inside it.
- `--word-diff` shows changes inside a line, word by word.
- `git log -p origin/main..origin/leo/attitude` shows the diff commit by commit, with messages.

Reading a diff means reading its **hunk headers**, the lines starting `@@`. In `@@ -1,3 +1,3 @@`, read aloud as "old file from line 1, 3 lines; new file from line 1, 3 lines", the minus side describes the old version and the plus side the new. A brand-new file shows `@@ -0,0 +1,34 @@`: nothing before, 34 lines after. Lines starting `-` were removed, `+` added, and a space means unchanged context. The [[hunk header picture|hunk-header]] labels each part.

## The order to read in

Do not start at line 1 of the first file. For a numerical PR, this order finds problems fastest:

1. **The description and the stat.** If you cannot say in one sentence what the PR does, ask before reading further.
2. **The tests.** They show what the author believes the code does. Notice what they *do not* test; that is where numerical bugs escape.
3. **The interfaces.** Names, arguments, return values, docstrings: what units and frames go in and come out? Other code will depend on these for years.
4. **The implementation**, line by line, with the checklist below.
5. **Run it.** Check out the branch, run the tests, and feed the code one case you worked out by hand.

For about 300 lines, plan on an hour in one sitting, and stop if your attention fades.

## The checklist for numerical code

Keep this list next to your keyboard. Every item has broken real flight software.

::: key Reviewer checklist for a numerical change
Units, reference frame and sign convention; division by zero and NaN propagation; integer overflow; array bounds; allocation in a hot path; magic numbers; and whether a test would have caught the bug you are imagining.
:::

### Units

Code does not carry units unless you make it. So for every constant and argument, ask: *in what unit?* and *does everyone who touches it agree?*

The classic pairs: **degrees and radians** (a factor of $180/\pi \approx 57.3$), **kilometers and meters** (1,000), **deg/s and rad/s** (57.3 again), pounds-force and newtons (about 4.45). NumPy's trigonometric functions take radians: `np.cos(90.0)` is $-0.448$, not $0$, because 90 radians is about 14 full turns plus some.

Good code makes units visible: names like `alt_m`, `rate_rad_s`, `lat_deg`; a unit comment on every constant; conversions done once, where data comes in, with `np.deg2rad` rather than a hand-typed `0.01745`.

### Reference frames

A vector's three numbers mean nothing until you know which axes they are measured along. Those axes are its **reference frame**. Three you will meet constantly:

- **ECI** (Earth-centered inertial): origin at Earth's center, axes fixed relative to the distant stars. Orbits are computed here.
- **ECEF** (Earth-centered, Earth-fixed): same origin, but the axes turn with the Earth, once per sidereal day (about 23.93 hours). Ground stations have fixed coordinates here.
- **Body**: axes fixed to the spacecraft — say $x$ out the nose, $z$ out the bottom. Sensors and thrusters are described here.

To move a vector's components from one frame to another you multiply by a **direction cosine matrix**, or **DCM**: a $3 \times 3$ rotation matrix. Its name tells you which way it goes. $\mathbf{C}_{bi}$, read "C sub b i", takes components in the inertial frame $i$ and gives components in the body frame $b$:

$$
\mathbf{v}_b = \mathbf{C}_{bi}\,\mathbf{v}_i .
$$

A helpful habit is to check that the [[inner subscripts match|dcm-subscripts]]: $\mathbf{C}_{bi}\,\mathbf{v}_i$ has $i$ next to $i$. Going the other way uses the **transpose** (the matrix flipped across its diagonal, written with a superscript $T$), because for a rotation matrix the transpose is the inverse:

$$
\mathbf{C}_{ib} = \mathbf{C}_{bi}^{T}, \qquad \mathbf{C}_{bi}^{T}\,\mathbf{C}_{bi} = \mathbf{I}.
$$

This is why a missing or extra `.T` is the most common frame bug in the business. It does not crash. It produces a perfectly valid rotation — the opposite one.

::: note Why the transpose undoes a rotation
The columns of a rotation matrix are three unit-length arrows, each at right angles to the others. Entry $(j, k)$ of $\mathbf{C}^T\mathbf{C}$ is the dot product of column $j$ with column $k$. For $j = k$ that is an arrow dotted with itself, which is $1$ (unit length). For $j \ne k$ it is two perpendicular arrows dotted together, which is $0$. So $\mathbf{C}^T\mathbf{C}$ has ones on the diagonal and zeros elsewhere: it is the identity. That is also why a test that checks $\mathbf{C}\mathbf{C}^T = \mathbf{I}$ cannot tell $\mathbf{C}$ from $\mathbf{C}^T$ — both pass.
:::

**Quaternions** store an attitude in four numbers instead of nine. The trap is *order*: some code puts the scalar part first, `[w, x, y, z]`, other code last, `[x, y, z, w]`, and a quaternion that crosses between them unreordered becomes a [[different rotation|quaternion-order]]. Every interface that passes one must say which order, and which frames it relates (`q_bi`: inertial to body).

**ECI versus ECEF** is the frame error that grows with time: when the frames line up, a position means the same in both, and then the Earth turns. The [[picture|eci-ecef]] and this example show how fast it goes wrong.

::: example How far off is an ECEF-for-ECI mix-up?
A PR takes a ground station on the equator, at ECEF position $(6378.137, 0, 0)\,\mathrm{km}$, and uses those numbers as its ECI position one hour after the frames were aligned.

**Step 1 — how far has Earth turned?** Earth's rotation rate is $\omega_E = 7.2921159 \times 10^{-5}\,\mathrm{rad/s}$ (radians per second). In one hour, $3600\,\mathrm{s}$:

$$
\theta = \omega_E\, t = 7.2921159 \times 10^{-5} \times 3600 \approx 0.2625\,\mathrm{rad} \approx 15.04^\circ .
$$

**Step 2 — how far apart are the true and assumed positions?** Both are on a circle of radius $R = 6378.137\,\mathrm{km}$, separated by angle $\theta$. The straight-line distance between two points on a circle (a *chord*) is $2R\sin(\theta/2)$:

$$
2 \times 6378.137 \times \sin(0.13126) \approx 1670\,\mathrm{km}.
$$

**Sanity check.** The Earth's equator is about $40\,075\,\mathrm{km}$ around, and $15.04^\circ$ is about $1/24$ of a turn: $40\,075 / 24 \approx 1670\,\mathrm{km}$ along the arc. The chord is a hair shorter than the arc, and at this small angle the two agree to well under a kilometer. An antenna pointed with this error misses the satellite entirely.
:::

### Sign conventions

Is positive $z$ up or down? Is drag returned as a positive size or as a negative component along velocity? Either choice is fine; mixing them is not. Every new signed quantity needs its docstring to say which way is positive.

### Division by zero and NaN

**NaN** ("not a number") is the floating-point value produced by undefined arithmetic such as $0/0$. NumPy warns and carries on. NaN is contagious: any arithmetic with it gives NaN, so one bad input can turn a whole state vector into NaN a few steps later.

Worse, **every comparison with NaN is false**. `nan <= 0.03` is `False`, `nan > 0.03` is `False`, even `nan == nan` is `False`. So `if rate > LIMIT: alarm()` silently lets a NaN rate through. For each division ask "what if the bottom is zero?", and for each comparison "what if this is NaN?"

### Integer overflow, array bounds, hot paths, magic numbers

- **Integer overflow.** Fixed-size integers wrap around when full. A NumPy `int32` holds up to $2^{31} - 1 = 2\,147\,483\,647$; two billion plus two billion in an `int32` array gives $-294\,967\,296$, with no warning. A microsecond counter in an `int32` overflows after about 35.8 minutes. See the [[airliner counter|overflow-787]].
- **Array bounds.** Off-by-one indexing, and in NumPy, negative indices that silently count from the end instead of failing.
- **Allocation in a hot path.** A **hot path** is code that runs very often, like every cycle of a 100 Hz control loop. New arrays there cost time, and flight computers often forbid them because memory use must be predictable.
- **Magic numbers.** An unexplained `0.01745` or `86164`. Give it a name, a unit and a source.

### Would a test have caught it?

The most powerful item. For each bug you imagine — "what if this `.T` is wrong?" — ask whether any test would fail. If none would, asking for that test is a blocking comment.

Convenient tests are often blind. The identity rotation equals its own transpose, so it cannot reveal a transpose error. At zero angle every unit gives the same answer. A zero rate is below every limit in every unit. Good numerical tests use lopsided inputs, where the right answer and the likely wrong ones differ.

::: warning Green CI is not a review
A green check mark only means the author's tests pass. In the example below, all five pass on code with three serious bugs. Your review adds the tests nobody wrote.
:::

## Writing comments that work

A comment should let the author fix the problem without a meeting:

- **Say whether it blocks.** Start with a label: `[blocking]`, `[non-blocking]`, `nit:`, or `question:`. Some teams use a fuller scheme called [[Conventional Comments|conventional-comments]].
- **Point at the line** and say what is wrong, not only that something feels off.
- **Give evidence**: a number, a hand calculation, a failing input. "This looks wrong" starts a debate; "for a 90° yaw this returns $+y$, expected $-y$" ends one.
- **Suggest a fix or a test**, when you have one.
- **Talk about the code, not the person.** "This call passes degrees", not "you mixed up units".
- **Ask when you are not sure.** A `question:` is a fine comment.

And say what is good; it tells the author what to keep doing.

::: example Reviewing Leo's attitude PR
Here is the diff from `git diff origin/main...origin/leo/attitude`, as it would appear on the PR page.

```diff
diff --git a/README.md b/README.md
index 49a08a4..5006c0d 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
 # orbit-sim
 
-Models: point-mass gravity.
+Models: point-mass gravity, attitude (quaternions and DCMs).
diff --git a/attitude.py b/attitude.py
new file mode 100644
index 0000000..081b417
--- /dev/null
+++ b/attitude.py
@@ -0,0 +1,34 @@
+"""Attitude helpers: quaternions, direction cosine matrices, slew limits."""
+import numpy as np
+
+MAX_SLEW_RATE = 2.0  # deg/s, reaction-wheel limit from the ADCS spec
+
+
+def normalize(q):
+    """Return q scaled to unit length."""
+    q = np.asarray(q, dtype=float)
+    return q / np.linalg.norm(q)
+
+
+def quat_to_dcm(q):
+    """DCM C_bi from the quaternion q = [w, x, y, z] (scalar first).
+
+    C_bi takes inertial components to body components: v_b = C_bi @ v_i.
+    """
+    w, x, y, z = normalize(q)
+    return np.array([
+        [1 - 2*(y*y + z*z), 2*(x*y + w*z),     2*(x*z - w*y)],
+        [2*(x*y - w*z),     1 - 2*(x*x + z*z), 2*(y*z + w*x)],
+        [2*(x*z + w*y),     2*(y*z - w*x),     1 - 2*(x*x + y*y)],
+    ])
+
+
+def sun_in_body(q_bi, sun_eci):
+    """Unit Sun direction in body axes, from the unit Sun direction in ECI."""
+    C_bi = quat_to_dcm(q_bi)
+    return C_bi.T @ sun_eci
+
+
+def slew_ok(omega_b):
+    """True if the body rate omega_b (rad/s, from the gyros) is within limits."""
+    return np.linalg.norm(omega_b) <= MAX_SLEW_RATE
diff --git a/tests/test_attitude.py b/tests/test_attitude.py
new file mode 100644
index 0000000..3ee0a87
--- /dev/null
+++ b/tests/test_attitude.py
@@ -0,0 +1,21 @@
+import numpy as np
+from attitude import quat_to_dcm, sun_in_body, slew_ok
+
+
+def test_identity_quaternion_gives_identity_dcm():
+    assert np.allclose(quat_to_dcm([1, 0, 0, 0]), np.eye(3))
+
+
+def test_dcm_is_orthonormal():
+    C = quat_to_dcm([0.9, 0.1, -0.3, 0.2])
+    assert np.allclose(C @ C.T, np.eye(3))
+    assert np.isclose(np.linalg.det(C), 1.0)
+
+
+def test_sun_in_body_identity():
+    s = np.array([1.0, 0.0, 0.0])
+    assert np.allclose(sun_in_body([1, 0, 0, 0], s), s)
+
+
+def test_slew_ok_at_rest():
+    assert slew_ok(np.zeros(3))
```

Reading the tests first: they use the identity quaternion, an orthonormality check and a zero rate — every one an input where common mistakes are invisible. So the implementation gets a careful read. Line numbers are in the new `attitude.py`.

**Comment 1, line 29 — `[blocking]` frame error.**

> `quat_to_dcm` returns $\mathbf{C}_{bi}$ ($\mathbf{v}_b = \mathbf{C}_{bi}\mathbf{v}_i$), so this should be `C_bi @ sun_eci`; the `.T` converts the wrong way. For a +90° yaw, `q = [cos 45°, 0, 0, sin 45°]`, a Sun along ECI $+x$ should appear along body $-y$; this returns $+y$. Please fix and add that case as a test.

**Comment 2, lines 4 and 34 — `[blocking]` unit error.**

> `MAX_SLEW_RATE` is 2.0 in deg/s, but `omega_b` is in rad/s, so line 34 compares rad/s with deg/s. The effective limit is 2 rad/s ≈ 114.6 deg/s, 57.3 times the spec. A 5 deg/s slew passes. Suggest `MAX_SLEW_RATE = np.deg2rad(2.0)  # rad/s (2 deg/s, ADCS spec)` and a test just below and just above 2 deg/s.

**Comment 3, line 10 — `[blocking]` division by zero.**

> A zero quaternion (say, an uninitialized telemetry field) gives 0/0 here: a warning and a DCM full of NaN that spreads into every vector we rotate. Please raise `ValueError` when the norm is zero, tiny or not finite, with a test.

**Comment 4, line 14 — `[non-blocking]` interface: quaternion order.**

> Thanks for writing `[w, x, y, z]` in the docstring. Other tools we use put the scalar last; could the argument be named `q_bi_wxyz`? The scalar-last identity `[0, 0, 0, 1]` read here is a 180° turn about $z$ — wrong, and no crash.

**Comment 5, line 26 — `question:` which inertial frame?**

> Is `sun_eci` in J2000 (the standard inertial frame at the year-2000 epoch)? `q_bi` must be relative to the same inertial frame. Worth one line in the docstring.

**Comment 6, test file — `[blocking]` tests cannot see the bugs above.**

> The behavior tests use inputs (identity, zero rate) where the likely errors give the correct answer, and the orthonormality test (a good idea) passes for $\mathbf{C}$ and $\mathbf{C}^T$ alike. Please add lopsided cases: the 90° yaw; rates of 1.9 and 2.1 deg/s; a zero quaternion.

**Comment 7, line 34 — `[non-blocking]` NaN behavior.**

> With a NaN rate, `norm <= limit` is `False`, so we report "not OK" — the safe direction. Please say so in a comment, so nobody rewrites it as `not (norm > limit)`, which lets NaN through.

**Comment 8, README — `nit:`** could link to the new module. Take it or leave it.

**Verdict: request changes**, on comments 1, 2, 3 and 6. Everything else is optional.

**Check.** Of eight comments, four are blocking, and all four are about results or tests — none about style. The other four — two non-blocking suggestions, a question and a nit — cost the author a minute each. That is the balance the standard asks for.
:::

::: example Proving the comments before posting them
Before posting, the reviewer checks the claims on Leo's branch, because a confident comment that turns out wrong costs trust:

```python
import numpy as np
from attitude import sun_in_body, slew_ok, quat_to_dcm

q = [np.cos(np.pi / 4), 0.0, 0.0, np.sin(np.pi / 4)]   # +90 deg about z
print(sun_in_body(q, np.array([1.0, 0.0, 0.0])).round(6))   # [0. 1. 0.]
print(slew_ok(np.array([0.0, 0.0, np.deg2rad(5.0)])))        # True
print(quat_to_dcm([0.0, 0.0, 0.0, 1.0]).round(6))
# [[-1.  0.  0.]
#  [ 0. -1.  0.]
#  [ 0.  0.  1.]]
```

**Step 1 — the frame bug.** Work out the right answer by hand. A +90° yaw turns the body's $x$ axis to point along inertial $+y$, and the body's $y$ axis along inertial $-x$. So an arrow along inertial $+x$ points along body $-y$: expected $(0, -1, 0)$. The code prints $(0, 1, 0)$. Comment 1 is confirmed.

**Step 2 — the unit bug.** 5 deg/s is $5 \times \pi/180 \approx 0.0873\,\mathrm{rad/s}$, well over the 2 deg/s spec, yet `slew_ok` says `True`. The effective limit is $2\,\mathrm{rad/s} = 2 \times 57.2958 \approx 114.6\,\mathrm{deg/s}$. Comment 2 is confirmed.

**Step 3 — the ordering example.** The scalar-last identity `[0, 0, 0, 1]`, read as scalar-first, gives $\mathrm{diag}(-1, -1, 1)$: a half-turn about $z$. The claim in comment 4 is right.

**Sanity check.** Each printed result disagrees with the hand calculation exactly as the comment predicted. Had one agreed, that comment would have been deleted, not posted.
:::

## After the author responds

Leo fixes the bugs, adds the tests, rewrites his commit and pushes with `--force-with-lease` (lesson 03). To re-review without reading everything again, use **`git range-diff`**, which compares two versions of a branch: a diff of diffs.

```bash
git range-diff origin/main old-tip new-tip
```

```text
# (abbreviated)
1:  2c24b7c ! 1:  bef34bb Add quaternion-to-DCM, Sun direction in body axes, slew check
    @@ attitude.py (new)
     +"""Attitude helpers: quaternions, direction cosine matrices, slew limits."""
     +import numpy as np
     +
    -+MAX_SLEW_RATE = 2.0  # deg/s, reaction-wheel limit from the ADCS spec
    ++MAX_SLEW_RATE = np.deg2rad(2.0)  # rad/s (2 deg/s reaction-wheel limit, ADCS spec)
    ...
    -+    return C_bi.T @ sun_eci
    ++    return C_bi @ sun_eci
```

(`old-tip` is the commit you reviewed; `git reflog` of your remote-tracking branch has its hash.) Read the prefixes as two columns: the outer one compares old and new versions of the patch; the inner `+` means "added by the PR". So `-+ … C_bi.T` is a line the PR *used to* add, and `++ … C_bi @` one it adds *now*. The fixes sit exactly where the comments were, 8 tests pass, and you approve.

## Check yourself

::: check Blocking or not?
Label each as blocking or non-blocking, with a reason: (a) "`r_km` is passed to `accel`, which expects meters"; (b) "I'd use a list comprehension here"; (c) "no test covers the new branch for `h > 1000 km`"; (d) "rename `tmp` to something descriptive".
:::

::: answer
(a) Blocking: a unit mismatch gives results off by a factor of $1000^2 = 10^6$ in gravity (since `accel` divides by $r^2$). (b) Non-blocking nit: style preference, same behavior. (c) Blocking: new behavior with no test is a correctness risk and the checklist's last item. (d) Non-blocking nit, unless the name hides something a reader needs, in which case it is still usually a suggestion rather than a blocker.
:::

::: check Subscripts
Code computes `v_b = C_ib @ v_i`. Is it right? What should it be, and how would you spot it at a glance?
:::

::: answer
It is wrong. $\mathbf{C}_{ib}$ takes body components to inertial ones, so it needs a body vector on its right. The inner subscripts do not match ($b$ next to $i$). To get `v_b` from `v_i` use $\mathbf{C}_{bi}$, which is $\mathbf{C}_{ib}^T$: `v_b = C_ib.T @ v_i`. At a glance: the subscript next to the vector must equal the vector's frame.
:::

::: check A blind test
A PR adds `lat_rad = lat * 3.14159 / 180` and a test at `lat = 0`. Name two problems a reviewer should comment on, and propose a better test.
:::

::: answer
First, a magic number: `3.14159` is a truncated $\pi$ (relative error about $8 \times 10^{-7}$) with no name; use `np.deg2rad(lat)`. Second, the test is blind: at zero latitude every unit and every conversion factor gives zero, so a missing or doubled conversion passes. Test at a lopsided value, for example `lat = 30` degrees, checking `np.sin(lat_rad)` equals $0.5$.
:::

::: check NaN in a guard
A fault check reads `if not (temp_c < 80.0): shutdown()`. What does it do if the sensor returns NaN? Is that what you want? What would `if temp_c >= 80.0: shutdown()` do instead?
:::

::: answer
`temp_c < 80.0` is `False` for NaN, so `not (...)` is `True` and the check shuts down: it fails safe. The rewritten `temp_c >= 80.0` is also `False` for NaN, so it does *not* shut down — a NaN sensor silently passes. The two look equivalent but differ exactly on NaN. A reviewer should ask for an explicit `np.isnan` (or `math.isnan`) check with a decision the team made on purpose, plus a test that feeds NaN.
:::

::: check The frame drift
Ground software stores a tracking station's position in ECEF and a PR uses it directly as ECI, 30 minutes after the frames were aligned. Roughly how far off is the position for a station on the equator?
:::

::: answer
Earth turns $\theta = 7.2921159 \times 10^{-5} \times 1800 \approx 0.1313\,\mathrm{rad}$, about $7.52^\circ$. The chord is $2 \times 6378.137 \times \sin(0.06563) \approx 837\,\mathrm{km}$. Check: half an hour is $1/48$ of a turn, and $40\,075/48 \approx 835\,\mathrm{km}$ along the arc, close to the chord. The error keeps growing until the frames line up again after a sidereal day.
:::

## Summary

| Idea | In one line |
| --- | --- |
| The standard | approve when the change definitively improves overall code health, even if imperfect |
| Blocking / non-blocking | correctness, tests, interfaces, units, frames block; style is a nit |
| Getting the diff | `git diff --stat A...B`, `-- path`, `-w`, `--word-diff`, `git log -p A..B` |
| Hunk header | `@@ -a,b +c,d @@`: old from line a, b lines; new from line c, d lines |
| Reading order | description, tests, interfaces, implementation, then run it |
| DCM | $\mathbf{v}_b = \mathbf{C}_{bi}\mathbf{v}_i$; $\mathbf{C}_{ib} = \mathbf{C}_{bi}^T$; inner subscripts match |
| Quaternion order | scalar-first `[w,x,y,z]` vs scalar-last `[x,y,z,w]`: say which at every interface |
| ECI vs ECEF | Earth turns about $15.04^\circ$ per hour; mixing them grows to ~1,670 km per hour at the equator |
| NaN | contagious; every comparison with it is false |
| Checklist | units, frame, sign; divide by zero and NaN; overflow; bounds; hot-path allocation; magic numbers; would a test catch it? |
| Good comment | labeled, on a line, with evidence, with a fix or test |
| `git range-diff` | compare two versions of a branch when re-reviewing |

Reviewed, approved changes pile up on `main`. Next lesson is about turning them into releases people can depend on: release branches for stabilizing a version, tags on the release line, version numbers that follow the rules from basics lesson 09, and a changelog that tells users what changed.

::: context google-eng-practices Google's review guide
Google publishes the guidance its engineers follow for code review, in two parts: one for reviewers and one for authors of changes (Google calls a change a "CL", for changelist). Its central point is the standard you read here: reviewers should lean toward approving once a change improves the health of the code base, because demanding perfection slows everything down and makes people stop sending improvements. It also introduced many people to the "Nit:" prefix for optional polish, and it argues for fast, small reviews. It is free to read online and short enough to finish in an evening.
:::

::: context hunk-header Reading a hunk header
Each hunk opens with a header saying where it sits in the old and new files. The numbers are a starting line and a count of lines shown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="30" y="40" font-size="18" fill="#1f2a44">@@</text>
  <text x="70" y="40" font-size="18" fill="#b4232c">-1,3</text>
  <text x="130" y="40" font-size="18" fill="#1d6fd1">+1,3</text>
  <text x="190" y="40" font-size="18" fill="#1f2a44">@@</text>
  <line x1="88" y1="50" x2="88" y2="72" stroke="#b4232c" stroke-width="1.5"/>
  <text x="30" y="88" font-size="11" fill="#b4232c">old file: from line 1,</text>
  <text x="30" y="103" font-size="11" fill="#b4232c">3 lines shown</text>
  <line x1="150" y1="50" x2="200" y2="72" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="200" y="88" font-size="11" fill="#1d6fd1">new file: from line 1,</text>
  <text x="200" y="103" font-size="11" fill="#1d6fd1">3 lines shown</text>
</svg>
```

A new file shows `-0,0`, because nothing existed before. The counts include unchanged context lines, which is why a one-line change usually shows 3 or more lines on each side.
:::

::: context dcm-subscripts Subscripts that cancel
Reading $\mathbf{C}_{bi}$ as "to b, from i" makes chains easy to check, like canceling units. To go from inertial to Earth-fixed to body, $\mathbf{C}_{bi} = \mathbf{C}_{be}\,\mathbf{C}_{ei}$: each neighboring pair of subscripts matches ($e$ next to $e$), and the outer ones name the result. If you ever write $\mathbf{C}_{be}\,\mathbf{C}_{ie}$, the mismatch ($e$ next to $i$) tells you a transpose is missing before you run anything. Some books write the same matrix as $\mathbf{C}^{b}_{i}$ or $\mathbf{R}_{b \leftarrow i}$; the habit of matching neighbors works in every notation, so find out which one your team's code uses.
:::

::: context quaternion-order Same four numbers, different rotation
A quaternion stores a rotation as a scalar part $w$ and a vector part $(x, y, z)$. The identity — no rotation — is $w = 1$ and $x = y = z = 0$. Written scalar-first that is `[1, 0, 0, 0]`; scalar-last, `[0, 0, 0, 1]`. Feed the scalar-last identity to a scalar-first function and it reads $w = 0$, $z = 1$: a 180° turn about $z$. SciPy's `Rotation.from_quat`, for example, expects scalar-last by default, while many flight-software and textbook formulas put the scalar first. There is a second, subtler split: the **Hamilton** and **JPL** conventions define quaternion multiplication differently, and the same four numbers moved between them without conversion describe the opposite rotation.
:::

::: context eci-ecef Two frames, one Earth
ECI's axes stay pointed at the same distant stars. ECEF's axes are glued to the Earth and turn with it. After an hour they differ by about 15°, and a point fixed on the ground has moved along an arc in ECI.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ee" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
    <marker id="eb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1d6fd1"/>
    </marker>
  </defs>
  <circle cx="150" cy="110" r="70" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="150" y1="110" x2="270" y2="110" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ee)"/>
  <text x="276" y="114" font-size="11" fill="#1f2a44">x ECI</text>
  <line x1="150" y1="110" x2="266" y2="79" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#eb)"/>
  <text x="270" y="76" font-size="11" fill="#1d6fd1">x ECEF</text>
  <circle cx="220" cy="110" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="218" cy="92" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="220" y1="110" x2="218" y2="92" stroke="#b4232c" stroke-width="2"/>
  <text x="150" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">view from above the North Pole</text>
  <text x="228" y="130" font-size="11" fill="#1f2a44">assumed (ECEF numbers)</text>
  <text x="120" y="80" font-size="11" fill="#1d6fd1">true, 1 h later</text>
  <text x="192" y="160" font-size="11" fill="#b4232c">error ≈ 1,670 km</text>
  <path d="M190,110 A40,40 0 0 0 188.6,99.6" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="172" y="104" font-size="11" fill="#1d6fd1">15°</text>
</svg>
```

The orange dot is where the ECEF coordinates put the station if read as ECI; the blue dot is where it really is in ECI after the Earth has turned. The red segment is the chord between them.
:::

::: context overflow-787 A counter that ran out of room
In 2015 the US Federal Aviation Administration ordered operators of the Boeing 787 to power-cycle the aircraft's electrical system at least every 248 days. The reason was a software counter in the generator control units, which counted time in hundredths of a second in a signed 32-bit integer. It overflows after $2^{31}$ hundredths of a second, which is $2^{31} / 100 / 86\,400 \approx 248.6$ days, and when that happened the units could shut down, cutting electrical power. Nobody had tested an aircraft left powered on for eight months. The review question "what is the largest value this can ever hold?" is how such bugs are caught on paper.
:::

::: context conventional-comments A shared label vocabulary
**Conventional Comments** is a small published scheme for starting every review comment with a label that says what kind of comment it is: `praise:`, `nitpick:`, `suggestion:`, `issue:`, `question:`, `thought:`, `chore:`, with optional decorations such as `(blocking)` or `(non-blocking)` after the label. The point is the same as the labels in this lesson: the author should never have to guess which comments stand between them and merging. Whatever scheme your team uses, the important thing is that everyone uses the same one.
:::
