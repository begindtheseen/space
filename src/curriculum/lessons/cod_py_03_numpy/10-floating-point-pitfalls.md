---
id: l10-floating-point-pitfalls
title: Floating-point pitfalls
minutes: 20
covers:
  - "Float pitfalls: allclose, catastrophic cancellation, float32 vs float64"
---

Think of a ruler. On a school ruler the marks are one millimeter apart, so you can measure a pencil to the nearest millimeter. Now imagine a strange ruler whose marks get farther apart the farther you go from zero: a millimeter apart near the start, a centimeter apart a meter out, ten centimeters apart ten meters out. Every length you measure gets rounded to the nearest mark. Near zero you are very precise. Far out, you are rounding to big steps.

A computer's floating-point numbers are exactly that ruler. In the Python basics module you met the first surprise it causes, `0.1 + 0.2` giving `0.30000000000000004`, and learned to compare with `math.isclose`. NumPy arrays are made of the same floats, a million at a time, so every one of those surprises is now multiplied. And NumPy adds a second, shorter ruler — **float32** — that is very easy to pick up by accident.

This lesson is about the four ways floats hurt GNC code: using the short ruler where you needed the long one, comparing with `==`, subtracting two nearly equal numbers, and the special values `inf` and `nan` that appear when a number falls off the end of the ruler. Each one has caused real flight software bugs. Each one has a simple habit that prevents it.

## The ruler inside a float

A float stores a number the way scientific notation does: a sign, a handful of significant digits, and a power that says where the decimal point goes. The difference is that it uses base two. So $6.5$ is stored as $1.625 \times 2^2$, and the computer keeps the sign, the digits of $1.625$ in binary (the **fraction**), and the power $2$ (the **exponent**). This layout is fixed by a standard called **[[IEEE 754|ieee-bits]]**, so every computer and language does it the same way.

Two sizes matter:

- **float64** (also called double precision, NumPy's default) uses 64 bits: 52 bits of fraction. That is about 16 significant decimal digits.
- **float32** (single precision) uses 32 bits: 23 bits of fraction. That is about 7 significant decimal digits.

The number of fraction bits decides how fine the ruler's marks are. The gap between $1.0$ and the next float up is called **machine epsilon**, and NumPy reports it with `np.finfo`:

```python
import numpy as np

print(np.finfo(np.float64).eps)   # 2.220446049250313e-16
print(np.finfo(np.float32).eps)   # 1.1920929e-07
```

Machine epsilon is $2^{-52} \approx 2.2 \times 10^{-16}$ for float64 and $2^{-23} \approx 1.2 \times 10^{-7}$ for float32. Every stored value and every arithmetic result can be off by about half of that, *relative to its own size*.

"Relative to its own size" is the ruler whose marks spread out. The gap between neighboring floats, called the **[[spacing|spacing-picture]]** (or one **ulp**, "unit in the last place"), grows with the number. `np.spacing(x)` tells you the gap next to `x`:

```python
print(np.spacing(1.0))                   # 2.220446049250313e-16
print(np.spacing(7e6))                   # 9.313225746154785e-10
print(np.spacing(np.float32(1.0)))       # 1.1920929e-07
print(np.spacing(np.float32(7e6)))       # 0.5
```

A satellite about $7000\,\mathrm{km}$ from Earth's center has a position of about $7 \times 10^{6}\,\mathrm{m}$. In float64 its neighbors are a billionth of a meter apart. In float32 they are half a meter apart. Try to store $7\,000\,000.3\,\mathrm{m}$ as float32 and you get `7.0000005e+06`: rounded to the nearest half meter.

::: key Machine epsilon
The gap between 1.0 and the next float: `np.finfo(np.float64).eps` $= 2^{-52} \approx 2.2 \times 10^{-16}$ (about 16 digits); `np.finfo(np.float32).eps` $= 2^{-23} \approx 1.2 \times 10^{-7}$ (about 7 digits). The absolute gap near $x$, `np.spacing(x)`, is roughly $|x| \times$ eps.
:::

## float32 vs float64

Why would anyone use the short ruler? Because it takes half the memory. A billion float32 values fit in 4 GB instead of 8 GB, move through memory twice as fast, and a graphics card may compute with them much faster. For storing a huge archive of sensor readings that were only measured to four digits anyway, float32 is fine.

For the *calculations* of GNC it usually is not. Seven digits are not enough for:

- **Positions in an Earth-centered frame.** As above, float32 rounds a $7000\,\mathrm{km}$ radius to the nearest $0.5\,\mathrm{m}$. A navigation filter that must track position to centimeters cannot even write the answer down.
- **Time.** Seconds counted from the start of a GPS week run up to $604\,800$. Near $500\,000\,\mathrm{s}$, float32 marks are $1/32\,\mathrm{s}$ apart, so 100 Hz time stamps can no longer be told apart.
- **Long integrations.** Every step of a simulation rounds. With 7 digits, those roundings pile up quickly, as the next example shows.

::: key float32 vs float64 in a GNC context
float32 has about seven decimal digits, which is not enough for ECI positions in metres or for long-horizon integration. Use float64 by default and drop to float32 only for bulk storage or a memory-bound stage you have measured.
:::

::: example A clock kept in float32
A flight recorder logs at 100 Hz and keeps its time tag by adding $0.01\,\mathrm{s}$ at every sample. What goes wrong in float32? First, look at time stamps late in the **[[GPS week|gps-week]]**:

```python
import numpy as np

t0 = np.float32(500_000.0)                     # s into the GPS week
stamps = t0 + np.arange(6, dtype=np.float32) * np.float32(0.01)
print(stamps - t0)
# [0.      0.      0.03125 0.03125 0.03125 0.0625 ]
print(np.spacing(t0))
# 0.03125
```

Six samples, $0.01\,\mathrm{s}$ apart, come out as only three different times. The marks near $500\,000$ are $0.03125\,\mathrm{s}$ apart, three times wider than the sample interval, so each stamp snaps to the nearest mark.

Now the accumulating clock, starting from zero, for one hour ($360\,000$ samples). `np.cumsum` adds the steps one after another, exactly like a `t += dt` loop:

```python
dt = 0.01                                      # s, 100 Hz
n = 360_000                                    # one hour of samples
t32 = np.cumsum(np.full(n, dt, dtype=np.float32))
t64 = np.cumsum(np.full(n, dt, dtype=np.float64))
print(t32[-1], t64[-1])
# 3603.204 3600.0000000321593
print(t32[-1] - 3600.0, t64[-1] - 3600.0)
# 3.2041016 3.2159277907339856e-08
```

**Step 1.** The float64 clock ends $3.2 \times 10^{-8}\,\mathrm{s}$ off after an hour: 32 nanoseconds. Harmless.

**Step 2.** The float32 clock ends $3.2\,\mathrm{s}$ off. That is a hundred million times worse, and it happened in an ordinary one-hour log.

**Step 3.** Why so much? Once the total passes $2048\,\mathrm{s}$, float32 marks are $2^{-12} \approx 0.000244\,\mathrm{s}$ apart. Adding $0.01$ must land on a mark, and the nearest one is 41 marks along, $0.0100098\,\mathrm{s}$. So every step from then on adds almost $10\,\mu\mathrm{s}$ too much — always in the same direction.

**Sanity check.** A satellite moving at $7.5\,\mathrm{km/s}$ travels $24\,\mathrm{km}$ in $3.2\,\mathrm{s}$. A time error that size would put every measurement against the wrong position, and real systems have failed [[exactly this way|patriot]]. The fix is not a cleverer addition: keep an integer sample counter `k` and compute `t = k * dt` in float64, which rounds once instead of 360,000 times.
:::

::: warning float32 sneaks in from files and devices
You rarely type `np.float32`. It arrives on its own: from a binary log whose format says 4-byte floats, from an image or GPU library, from `np.load` of someone else's file. Check `.dtype` when data arrives, and convert with `.astype(np.float64)` before doing arithmetic on it.
:::

## Comparing floats: == versus allclose

Here is a direction cosine matrix — the rotation matrix from lesson 8 — for a $50°$ turn about $z$, built two ways. Once directly, and once as a $20°$ turn followed by a $30°$ turn. Mathematically they are the same matrix.

```python
import numpy as np

def rz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, s, 0.0], [-s, c, 0.0], [0.0, 0.0, 1.0]])

C1 = rz(np.radians(50.0))
C2 = rz(np.radians(20.0)) @ rz(np.radians(30.0))
print(np.array_equal(C1, C2))   # False
print((C1 == C2).sum(), "of 9 entries equal")   # 7 of 9 entries equal
print(np.abs(C1 - C2).max())    # 1.1102230246251565e-16
print(np.allclose(C1, C2))      # True
```

`C1 == C2` compares element by element and gives a table of `True`/`False`. `np.array_equal` asks whether *all* of them are equal. Two of the nine entries differ, by $1.1 \times 10^{-16}$ — half of machine epsilon. The sines and cosines were rounded differently on the two routes. That is all.

So never test computed floats with `==`. Test whether they are close. **`np.isclose(a, b)`** does it element by element, and **`np.allclose(a, b)`** asks whether every element is close. Both use this test:

$$
|a - b| \le \mathrm{atol} + \mathrm{rtol} \times |b|
$$

- **rtol**, the **relative tolerance**, allows a difference that grows with the size of the numbers. The default is $10^{-5}$: agreement to about five digits.
- **atol**, the **absolute tolerance**, allows a fixed difference, which matters near zero, where any relative test fails. The default is $10^{-8}$.

::: key Why compare DCMs with allclose rather than ==
Every trigonometric evaluation and matrix product introduces rounding at the 1e-16 level, so two mathematically identical matrices differ in their last bits. allclose applies rtol and atol; == will essentially always be False.
:::

### allclose is not symmetric

Look at the formula again: it uses $|b|$, the size of the *second* argument only. So swapping the arguments can change the answer:

```python
print(np.isclose(10.0, 11.05, rtol=0.1, atol=0.0))   # True
print(np.isclose(11.05, 10.0, rtol=0.1, atol=0.0))   # False
```

The difference is $1.05$. In the first call the allowance is $0.1 \times 11.05 = 1.105$, which covers it. In the second the allowance is $0.1 \times 10.0 = 1.0$, which does not. Python's `math.isclose`, from the basics module, uses the larger of the two sizes and so is symmetric; NumPy's is not. The habit that makes this harmless: put the **reference value second** — `np.allclose(computed, expected)` — so the tolerance is always measured against the value you trust.

::: warning The default tolerances do not know your units
`np.allclose(7_000_000.0, 7_000_060.0)` returns `True`. The default relative tolerance allows $10^{-5} \times 7\,000\,060 \approx 70$, so two satellite positions $60\,\mathrm{m}$ apart count as "close". And `np.isclose(1e-9, 0.0)` is `True` because the default `atol` of $10^{-8}$ happens to cover it, which is nonsense if the quantity is a small angle in radians. Pick both tolerances from the physics, and write them down: `np.allclose(r, r_ref, rtol=0, atol=1e-3)` for "within a millimeter".
:::

Two more details. `nan` is never close to anything, including itself, unless you pass `equal_nan=True`. And in tests, `np.testing.assert_allclose(actual, desired, rtol=..., atol=...)` does the same check but prints the worst mismatch when it fails, which is far more useful than a bare `False`.

## Catastrophic cancellation

Measure the heights of two skyscrapers to the nearest meter: $442\,\mathrm{m}$ and $443\,\mathrm{m}$. Subtract and you get $1\,\mathrm{m}$. But each measurement could be off by half a meter, so the real difference could be anywhere from $0$ to $2\,\mathrm{m}$. The subtraction itself was exact. What happened is that the leading digits, the ones you knew well, cancelled, and what is left is mostly the uncertainty you started with.

Floats do this too. **Catastrophic cancellation** is the loss of accuracy when you subtract two nearly equal floating-point numbers: the matching leading digits cancel, and the few digits left are mostly rounding error.

::: key What is catastrophic cancellation?
Subtracting two nearly equal floating-point numbers destroys the leading significant digits, so the relative error of the result explodes. Reformulate the expression (for example the stable quadratic formula) rather than adding precision.
:::

### Small angles: 1 − cos x

For a small angle $x$ in radians, $\cos x$ is very close to $1$, so $1 - \cos x$ subtracts two nearly equal numbers. There is an identity from trigonometry that gives the same value with no subtraction:

$$
1 - \cos x = 2\sin^2\!\left(\frac{x}{2}\right)
$$

Read $\sin^2$ as "sine squared". Compare them in NumPy, along with the small-angle approximation $x^2/2$ as a referee:

```python
x = np.array([1e-2, 1e-4, 1e-6, 1e-8])
print(1.0 - np.cos(x))
# [4.99995833e-05 4.99999997e-09 5.00044450e-13 0.00000000e+00]
print(2.0 * np.sin(x / 2.0)**2)
# [4.99995833e-05 5.00000000e-09 5.00000000e-13 5.00000000e-17]
print(x**2 / 2)
# [5.e-05 5.e-09 5.e-13 5.e-17]
```

At $x = 10^{-2}$ both agree. At $10^{-6}$ the subtraction is already wrong in the fifth digit ($5.00044$ instead of $5.00000$). At $10^{-8}$ it returns exactly zero — $\cos(10^{-8})$ rounds to $1.0$, and every digit cancelled. The rewritten form is right everywhere. In float32 the naive form is already zero at $x = 10^{-4}$.

You meet this whenever you work out the angle between two nearly parallel directions — a star tracker's pointing error, say. `np.arccos(a @ b)` for unit vectors 10 nanoradians apart returns exactly $0$, because the dot product rounds to $1.0$. `np.arctan2(np.linalg.norm(np.cross(a, b)), a @ b)` returns $1.0 \times 10^{-8}$, correct, because it never subtracts from $1$.

### The one-pass variance

The **variance** is the average squared distance of data from its mean; its square root is the standard deviation. There is a tempting shortcut formula that needs only one pass through the data: "mean of the squares minus square of the mean",

$$
\sigma^2 = \overline{x^2} - \bar{x}^2 .
$$

($\bar{x}$ reads "x bar", the mean.) It is exact in algebra and a disaster in floats when the mean is large and the spread is small.

::: example A negative variance from position telemetry
A GPS receiver on a satellite reports its orbit radius, about $7\,000\,\mathrm{km}$, with $5\,\mathrm{cm}$ of noise. Compute the variance of $100\,000$ samples two ways.

```python
import numpy as np

rng = np.random.default_rng(4)
r = 7_000_000.0 + rng.normal(0.0, 0.05, size=100_000)   # m
n = r.size
one_pass = (r**2).sum() / n - (r.sum() / n)**2
print(one_pass)
# -0.0078125
print(np.var(r))
# 0.002495384609674618
print(np.spacing(4.9e13))
# 0.0078125
```

**Step 1.** The true variance is about $0.05^2 = 0.0025\,\mathrm{m^2}$. `np.var` gets $0.00250\,\mathrm{m^2}$. Good.

**Step 2.** The one-pass formula gets $-0.0078\,\mathrm{m^2}$. A variance is an average of squares, so it can never be negative. This answer is not merely inaccurate; it is impossible.

**Step 3.** Why: each $r^2$ is about $(7 \times 10^{6})^2 = 4.9 \times 10^{13}$. Near that size, float64 marks are $0.0078125$ apart — three times bigger than the variance we are looking for. The two large numbers being subtracted each carry rounding errors bigger than their difference, so the result is noise in steps of $0.0078125$.

**Sanity check.** The bad answer is exactly one spacing, $-0.0078125$. That fits: the subtraction left nothing but rounding.

`np.var` avoids the trap by subtracting the mean first, then squaring the small differences. That is the **two-pass** method, and it is the one to use.
:::

### The stable quadratic formula

The same idea saves the quadratic formula. For $x^2 + bx + c = 0$ with $b = 10^{8}$ and $c = 1$, the small root is about $-10^{-8}$. The textbook formula $\frac{-b + \sqrt{b^2 - 4c}}{2}$ subtracts two numbers both close to $10^{8}$ and returns $-7.45 \times 10^{-9}$, wrong by $25\%$. The stable version first computes the root that involves no cancellation,

$$
q = -\tfrac{1}{2}\left(b + \operatorname{sign}(b)\sqrt{b^2 - 4ac}\right), \qquad x_1 = \frac{q}{a}, \qquad x_2 = \frac{c}{q},
$$

and gets the small root by division, which does not cancel. It returns $-1.0 \times 10^{-8}$, correct. [[Why the second root is c/q|vieta]]: the two roots of a quadratic always multiply to $c/a$.

The lesson of all three: **rearrange the formula** so it never subtracts nearly equal numbers. Switching from float64 to some longer type only postpones the problem.

## Falling off the ruler: inf and nan

Every ruler has ends. float64 tops out near $1.8 \times 10^{308}$ and float32 near $3.4 \times 10^{38}$. Go past the end and you get **overflow**: the result becomes `inf`, infinity. Do something with no sensible answer, like $0/0$ or $\sqrt{-1}$, and you get `nan`, **[[not a number|nan-rules]]**.

In plain Python, `1.0 / 0.0` raises `ZeroDivisionError`. NumPy does not stop. It prints a `RuntimeWarning` and carries on:

```python
print(np.array([1.0, 0.0, -1.0]) / 0.0)
# RuntimeWarning: divide by zero encountered in divide
# RuntimeWarning: invalid value encountered in divide
# [ inf  nan -inf]
print(np.exp(np.array([700.0, 710.0])))
# RuntimeWarning: overflow encountered in exp
# [1.01423205e+304             inf]
v = np.float32(1e20)
print(v * v)
# RuntimeWarning: overflow encountered in scalar multiply
# inf
```

That last one is worth a second look: $10^{40}$ is a perfectly ordinary float64, but it is past the end of the float32 ruler. Squeezing a big value into a small type is how [[a rocket was lost|ariane]] in 1996.

`nan` spreads. Any arithmetic with a `nan` gives `nan`, so one bad sample makes the whole sum `nan`. And `nan` is not equal to anything, not even itself, so you must test for it with a function:

```python
x = np.array([1.0, np.nan, 3.0])
print(x.sum(), np.nansum(x))    # nan 4.0
print(np.nan == np.nan)          # False
print(np.isnan(x))               # [False  True False]
```

`np.isfinite(x)` is `True` only for ordinary numbers, so `x[np.isfinite(x)]` (a boolean mask from lesson 4) drops both `inf` and `nan`. The `nan`-aware reductions from lesson 6, like `np.nanmean`, skip `nan`s deliberately.

::: warning Do not let the warning scroll past
A `RuntimeWarning` is printed once and the program keeps going with `inf` or `nan` in the data. In a long Monte Carlo run it is easy to miss. While developing, turn the warnings into errors so the program stops at the line that caused them:

```python
with np.errstate(all="raise"):
    np.array([1.0]) / 0.0
# FloatingPointError: divide by zero encountered in divide
```

Then decide on purpose what a zero divisor should mean, as the `unit` function in this module's exercise does for zero-length vectors.
:::

## Check yourself

::: check
A star catalog stores star directions as float32 unit vectors. Roughly what is the smallest angle between two directions it can represent, in radians and in arcseconds? ($1$ arcsecond $\approx 4.85 \times 10^{-6}\,\mathrm{rad}$.) Is float32 good enough for a star tracker accurate to about one arcsecond?
:::

::: answer
The components of a unit vector are at most $1$, and near $1$ float32 marks are $\mathrm{eps} \approx 1.2 \times 10^{-7}$ apart. A change in direction by a small angle $\theta$ changes the small components by about $\theta$, so the finest step is roughly $10^{-7}\,\mathrm{rad}$. In arcseconds: $1.2 \times 10^{-7} / 4.85 \times 10^{-6} \approx 0.025$ arcseconds. That is about forty times finer than one arcsecond, so float32 is fine for *storing* the catalog — a good example of float32 for bulk storage. Do the pointing arithmetic in float64, and compute small angles without `arccos`.
:::

::: check
Why does `np.allclose(C @ C.T, np.eye(3))` work for checking that a DCM is orthonormal, while `np.allclose(C @ C.T - np.eye(3), 0.0, rtol=1e-9, atol=0.0)` fails even for a perfect DCM?
:::

::: answer
In the second call the reference value `b` is `0.0`, so the relative allowance is $\mathrm{rtol} \times |0| = 0$, and with `atol=0.0` the test demands the difference be exactly zero. Rounding makes the off-diagonal entries about $10^{-17}$ instead of zero, so it fails. Nothing is relatively close to zero. The first call compares against the identity, whose entries are $1$ and $0$; the default `atol` of $10^{-8}$ covers the zeros. For a zero reference you must set `atol` yourself, for example `atol=1e-12`.
:::

::: check
An orbit determination tool computes a range-rate residual as `measured - predicted`, where both are about $7500\,\mathrm{m/s}$ and agree to about $1\,\mathrm{mm/s}$. Is this catastrophic cancellation? How many significant digits does the residual keep in float64?
:::

::: answer
Yes, it is a subtraction of nearly equal numbers, but it is survivable here. Near $7500$, float64 marks are about $7500 \times 2.2 \times 10^{-16} \approx 1.7 \times 10^{-12}\,\mathrm{m/s}$ apart. The residual is about $10^{-3}\,\mathrm{m/s}$, so the rounding error is about $10^{-12} / 10^{-3} = 10^{-9}$ of it: roughly 9 good digits left out of 16. The subtraction cost the seven leading digits that matched. In float32 (marks near $7500$ about $0.0005\,\mathrm{m/s}$ apart) the residual would keep barely one digit.
:::

::: check
A test does `assert np.allclose(x_filter, x_truth)` on position estimates in meters, around $6.8 \times 10^{6}\,\mathrm{m}$. It passes. Why might it pass even if the filter is $50\,\mathrm{m}$ off? Rewrite it.
:::

::: answer
The default `rtol` is $10^{-5}$, so the allowance is about $10^{-5} \times 6.8 \times 10^{6} = 68\,\mathrm{m}$ (plus a negligible `atol`). A $50\,\mathrm{m}$ error is inside that. State the requirement in meters instead: `np.testing.assert_allclose(x_filter, x_truth, rtol=0, atol=1.0)` for "within a meter", with the truth second so the tolerance is measured against it.
:::

::: check
A script computes speed as `np.sqrt(vx**2 + vy**2 + vz**2)` in float32 for an interplanetary probe whose velocity components are around $10^{20}$ in some internal unit. What goes wrong, and name two fixes.
:::

::: answer
Each square is about $10^{40}$, past float32's maximum of about $3.4 \times 10^{38}$, so the squares overflow to `inf` and the speed comes out `inf` even though the true answer, about $1.7 \times 10^{20}$, fits easily. Fix 1: use float64, whose range reaches about $1.8 \times 10^{308}$. Fix 2: scale first — divide by the largest component, take the norm of the scaled vector (all components now at most $1$), and multiply back; `np.hypot(np.hypot(vx, vy), vz)` does this scaling for you and returns $1.73 \times 10^{20}$ even in float32. (Beware: `np.linalg.norm` does *not* scale, and returns `inf` here too.) Better still, choose units that keep numbers near $1$.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Machine epsilon | float64: $2^{-52} \approx 2.2 \times 10^{-16}$, about 16 digits; float32: $2^{-23} \approx 1.2 \times 10^{-7}$, about 7 digits |
| Spacing | `np.spacing(x)` $\approx |x| \times$ eps; float32 near $7 \times 10^{6}$ is $0.5$ |
| float32 | for bulk storage; not for ECI positions, GPS-week seconds or long integrations |
| Time | keep an integer counter, compute `t = k * dt` in float64 |
| `==` on floats | almost always wrong for computed values |
| `np.isclose`, `np.allclose` | $|a - b| \le \mathrm{atol} + \mathrm{rtol}|b|$; defaults $10^{-5}$ and $10^{-8}$; not symmetric: reference second |
| Catastrophic cancellation | subtracting nearly equal numbers; rewrite: $2\sin^2(x/2)$, two-pass variance, stable quadratic |
| `inf`, `nan` | overflow and invalid operations; NumPy warns and continues; `np.isfinite`, `np.errstate(all="raise")` |

The next lesson turns to numbers that are *meant* to be unpredictable: random numbers for Monte Carlo runs, and how to make them come out exactly the same every time you need them to.

::: context ieee-bits How the bits are laid out
IEEE 754, first published in 1985, fixes how a float is stored. A float32 has 1 sign bit, 8 exponent bits and 23 fraction bits. A float64 has 1 sign bit, 11 exponent bits and 52 fraction bits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">float32 (32 bits)</text>
  <rect x="10" y="26" width="10" height="24" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="20" y="26" width="80" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="100" y="26" width="230" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">exp 8</text>
  <text x="215" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">fraction 23</text>
  <text x="10" y="76" font-size="12" fill="#1f2a44">float64 (64 bits, drawn at half scale)</text>
  <rect x="10" y="84" width="5" height="24" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="15" y="84" width="55" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="70" y="84" width="260" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="42" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">exp 11</text>
  <text x="200" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">fraction 52</text>
  <text x="10" y="124" font-size="11" fill="#b4232c">red: sign bit</text>
</svg>
```

The fraction bits set the precision (the fineness of the ruler's marks); the exponent bits set the range (how far the ruler reaches).
:::

::: context spacing-picture Marks that spread out
Between each power of two and the next there are the same number of floats: $2^{52}$ of them in float64, $2^{23}$ in float32. So each time the numbers double, the gaps double too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="50" x2="350" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="10" y1="42" x2="10" y2="58"/><line x1="20" y1="42" x2="20" y2="58"/><line x1="30" y1="42" x2="30" y2="58"/><line x1="40" y1="42" x2="40" y2="58"/>
    <line x1="50" y1="42" x2="50" y2="58"/><line x1="70" y1="42" x2="70" y2="58"/><line x1="90" y1="42" x2="90" y2="58"/><line x1="110" y1="42" x2="110" y2="58"/>
    <line x1="130" y1="42" x2="130" y2="58"/><line x1="170" y1="42" x2="170" y2="58"/><line x1="210" y1="42" x2="210" y2="58"/><line x1="250" y1="42" x2="250" y2="58"/>
    <line x1="290" y1="42" x2="290" y2="58"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="76">1</text><text x="130" y="76">2</text><text x="290" y="76">4</text>
  </g>
  <text x="30" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">gap g</text>
  <text x="90" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">gap 2g</text>
  <text x="210" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">gap 4g</text>
</svg>
```

The picture uses four marks per doubling so you can see them. That is why precision is relative: every float is stored to the same number of significant binary digits, wherever it sits.
:::

::: context gps-week Seconds of the GPS week
GPS satellites broadcast time as a week number plus the seconds since the start of that week, which begins at midnight between Saturday and Sunday. A week has $7 \times 86\,400 = 604\,800$ seconds, so the seconds count runs from $0$ up to $604\,799.999\ldots$ and then starts over. Many receivers and flight logs keep that "time of week" as their time tag. Because it gets large by the end of the week, it is a classic place for float32 to fail on Friday and Saturday data while working fine on Monday's.
:::

::: context patriot Twenty-four bits of time
In February 1991 a Patriot missile battery at Dhahran, Saudi Arabia, failed to intercept an incoming missile, and 28 soldiers were killed. The system counted time in tenths of a second and multiplied by $0.1$ held in a 24-bit fixed-point register — not quite a float, but the same kind of short ruler. After about 100 hours of continuous running, the rounding had grown to about $0.34\,\mathrm{s}$, enough for the radar to look in the wrong place. The US General Accounting Office report on it (1992) is short and worth reading. It is the float32 clock example, with real consequences.
:::

::: context vieta Why the roots multiply to c over a
If a quadratic $ax^2 + bx + c$ has roots $x_1$ and $x_2$, it can be written as $a(x - x_1)(x - x_2)$. Multiply that out and the constant term is $a\,x_1 x_2$. That must equal $c$, so $x_1 x_2 = c/a$. This is one of Vieta's formulas, named after the French mathematician François Viète (1540–1603). Once you have the large root accurately, dividing gives the small one with no subtraction at all.
:::

::: context nan-rules Why nan is not equal to itself
IEEE 754 decided that any comparison involving `nan` — equal, less than, greater than — comes out false, except "not equal", which comes out true. One reason: a `nan` from $0/0$ and a `nan` from $\sqrt{-1}$ are not "the same value" in any useful sense. A handy side effect is that `x != x` is true only for `nan`, which is how people tested for it before `isnan` existed everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="14" y="24">1.0 + nan</text><text x="200" y="24" fill="#b4232c">nan</text>
    <text x="14" y="48">nan == nan</text><text x="200" y="48" fill="#b4232c">False</text>
    <text x="14" y="72">nan != nan</text><text x="200" y="72" fill="#1d6fd1">True</text>
    <text x="14" y="96">np.isnan(nan)</text><text x="200" y="96" fill="#1d6fd1">True</text>
  </g>
  <line x1="170" y1="10" x2="170" y2="102" stroke="#6c7a93"/>
</svg>
```

So a mask like `x == np.nan` is always all `False` and silently finds nothing. Use `np.isnan(x)`.
:::


::: context ariane Overflow on Ariane 5
On 4 June 1996 the first Ariane 5 rocket veered off course and broke up about 37 seconds after launch. The inertial reference software, reused from Ariane 4, converted a 64-bit float, a value that grows with the rocket's horizontal velocity, into a 16-bit signed integer. Ariane 5 was faster, the value no longer fit, and the conversion raised an unhandled error that shut down both inertial units. It was an overflow, like the ones in this lesson: a number fell off the end of the ruler it was being squeezed into. The fix in your own code is the same: know the range of every value, and check before narrowing a type.
:::
