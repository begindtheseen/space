---
id: l08-carrier-phase-and-integer-ambiguity
title: Carrier phase and integer ambiguity resolution
minutes: 21
covers:
  - Carrier phase measurements, cycle slips, integer ambiguity resolution with LAMBDA
---

Imagine two measuring tapes. The first has a mark every $293\,\mathrm{m}$, with a number printed beside each mark, and you can read it to a few percent of the gap between marks. The second has a mark every $19\,\mathrm{cm}$ and you can read it to a millimeter — but the numbers have rubbed off. You can see exactly where you are between two marks. You cannot tell which mark it is.

Everything in this module so far used the first tape: the ranging code. This lesson picks up the second one: the **carrier**, the radio wave the code rides on. On L1 its **wavelength** — the distance from one wave crest to the next — is $19.03\,\mathrm{cm}$. A receiver can read where it is inside one wave to a few percent, which is millimeters. That is about a thousand times finer than the code.

The price is the rubbed-off numbers. The receiver cannot count, from a standing start, how many whole waves lie between it and the satellite. That missing whole number is the **integer ambiguity**, and pinning it down takes real machinery. This lesson covers the measurement, how a receiver notices when its count breaks, and how it finally settles on the right whole number. Get it right and you have centimeter positioning. That is how survey instruments, farm tractors that steer themselves, and precise spacecraft orbit determination work.

## The carrier phase measurement

Think of a bicycle wheel with a counter on it. Every time the valve passes the top, the counter clicks. Between clicks, you can see exactly how far round the valve is. That "how far round" is the **[[phase|phase-picture]]**, measured in **cycles** (one cycle is one full turn, one wavelength).

A receiver tracks the carrier with a **[[phase-lock loop|pll]]**, a circuit that keeps its own copy of the wave lined up with the incoming one. Once locked, it counts: each time the tracked phase passes a full cycle, a counter goes up by one. At any moment it knows the fraction of the current cycle very precisely, plus how many whole cycles have passed *since it locked*. What it never learns is how many whole cycles there were between it and the satellite *before* it started counting. Call that missing count $N_i$ for satellite $i$.

Multiply the phase by the wavelength $\lambda$ to turn it into meters. Then the carrier measurement $\Phi_i$ (read "capital phi sub i") looks like the pseudorange equation from lesson 2, with two changes:

$$
\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}.
$$

Term by term: the true distance from receiver $\mathbf{x}$ to satellite $\mathbf{s}_i$; the receiver clock and satellite clock errors times the speed of light $c$; the ionosphere $I_i$; the troposphere $T_i$; the new ambiguity term $\lambda N_i$; and the noise $\varepsilon_{\Phi,i}$ (read "epsilon phi").

**Change one: the ionosphere sign flips.** The troposphere delays the carrier and the code equally, because it is not dispersive, so $+T_i$ stays. The ionosphere is different. Lesson 6 found its refractive index for the wave's phase is $n \approx 1 - 40.3\,N_e/f^2$, a little *less* than one. So the wave's crests [[move faster than light|phase-advance]] through it, while the code slows down. The carrier is advanced by exactly the amount the code is delayed, so the term is $-I_i$. A receiver comparing its own code and carrier on one frequency sees the gap between them change by twice as much as the ionosphere changes, a handy way to watch the ionosphere move.

**Change two: the ambiguity.** $\lambda N_i$ is the unknown whole number times the wavelength. On L1 each unit of $N_i$ is $19.03\,\mathrm{cm}$. It stays *constant* as long as the loop holds lock, however far the satellite moves.

The noise on a good carrier loop is a few millimeters. The code's is tens of centimeters to a few meters. That gap is the reason for everything in this lesson.

::: key
Carrier phase (in range units): $\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$ — ionosphere sign flipped from code, troposphere the same, plus an integer-cycle ambiguity $N_i$ that is constant while lock holds. Millimeter-level noise; on L1, $\lambda = 19.03\,\mathrm{cm}$.
:::

::: key Carrier phase measurement
Millimeter-level precision but biased by an unknown integer number of wavelengths ($19\,\mathrm{cm}$ on L1). Resolve the ambiguity (LAMBDA) and you have centimeter positioning; lose lock and the cycle slip must be detected and repaired.
:::

::: example Turning a cycle count into a range
A receiver reports an accumulated L1 phase of $84{,}213{,}905.62$ cycles. Its counter started at an arbitrary number when it locked, so the ambiguity can be any whole number, positive or negative. Later the ambiguity is found to be $N = -26{,}141{,}000$ cycles.

**Remove the ambiguity.** Since the reading is range plus $N$ (in cycles), the range in cycles is the reading minus $N$:

$$
84{,}213{,}905.62 - (-26{,}141{,}000) = 110{,}354{,}905.62\ \text{cycles}.
$$

**Convert to meters.** One cycle is $\lambda = 0.19029367\,\mathrm{m}$ on L1, so

$$
110{,}354{,}905.62 \times 0.19029367 \approx 20{,}999{,}840\,\mathrm{m},
$$

about $21{,}000\,\mathrm{km}$ (ignoring the clock and atmosphere terms, which are handled separately). Sanity check: GPS satellites are $20{,}200$ to $25{,}800\,\mathrm{km}$ away, so this is a satellite high in the sky.

**One cycle wrong.** Had $N$ been off by one, the answer would be off by $19.03\,\mathrm{cm}$. That is why a wrong integer is worse than none. A code error looks like noise. A wrong integer gives a smooth, confident, precise and wrong answer.
:::

::: warning Keep every digit of the wavelength
At a hundred million cycles, small rounding in $\lambda$ is not small. Using $0.1903\,\mathrm{m}$ instead of $0.19029367\,\mathrm{m}$ in the example shifts the range by about $700\,\mathrm{m}$. Always compute $\lambda = c/f$ from the exact frequency ($1575.42\,\mathrm{MHz}$ for L1) and keep full precision.
:::

## Cycle slips: when the count breaks

The whole-cycle count survives only while the phase-lock loop keeps continuous lock. A signal blocked for an instant, a sudden drop in signal strength, or a jolt of motion faster than the loop can follow (lesson 13 works out how fast) makes the loop lose lock. It grabs the signal again moments later, but its counter has lost some whole cycles along the way.

The measurement looks almost the same before and after. What has silently changed is $N_i$, now off by some whole number. This is a **[[cycle slip|slip-word]]**. If nobody notices, every measurement afterwards is precise, smooth and wrong by a fixed amount.

### Catching a slip

The trick is that real range changes smoothly. A satellite and a receiver cannot jump. So look at how the phase changes from one moment to the next:

- the **first difference**, $\Phi_{k+1} - \Phi_k$, is how far the phase moved in one step — close to the range rate, which can be large;
- the **second difference**, $\Phi_{k+2} - 2\Phi_{k+1} + \Phi_k$, is how much that step changed — close to the range acceleration, which is tiny over a second.

So the second difference normally sits near zero. A slip is a sudden step. A step shows up in the second difference as a sharp **[[up-then-down pair|doublet]]**: a big spike one way, then the same spike the other way.

::: example Catching a thirty-seven-cycle slip
Simulate ten seconds of phase at one measurement per second for a satellite closing at a steady $700\,\mathrm{m/s}$. Add noise of $0.01$ cycle (about $2\,\mathrm{mm}$), and inject a $+37$-cycle slip at epoch $5$:

```python
import numpy as np

lam = 0.1903
t = np.arange(0, 10, 1.0)
R = 2.2e7 - 700.0 * t                       # smooth, near-linear range, m
rng = np.random.default_rng(11)
phase = R / lam + 15_342_871 + rng.normal(0, 0.01, size=len(t))   # cycles
phase[5:] += 37                              # a cycle slip at epoch 5

d2 = np.diff(phase, 2)                       # second difference, cycles
np.set_printoptions(suppress=True, precision=3)
print(d2)
# [ -0.015  -0.016   0.019  36.996 -36.987  -0.017   0.014  -0.034]
```

**Read the output.** Six of the eight values sit at the noise floor, a few hundredths of a cycle. Two stand out: nearly $+37$, then nearly $-37$. That pair is the fingerprint of one step. Real receivers flag anything above a threshold of a few cycles, far above the noise and far above any real range curvature.

**Then repair it.** Once flagged, the receiver either starts a fresh ambiguity from that epoch, or — if it has a second frequency — works out the exact size of the slip and fixes the count. The **[[geometry-free combination|geometry-free]]** of two frequencies is the usual tool.

Sanity check: the slip was $37$ cycles, and the spikes are $36.996$ and $-36.987$. The small leftovers are the noise, as they should be.
:::

::: warning Half-cycle slips
A slip is not always a whole number of cycles. The original L1 C/A signal carries navigation data that flips the carrier upside down with every data bit. To track it, receivers use a **[[Costas loop|costas]]**, which cannot tell a wave from its upside-down copy. It knows phase only to half a cycle, so a slip can leave a stray half cycle. Newer civil signals (L2C, L5, L1C) include a **pilot** part with no data flips, so the loop can track the full cycle. A receiver using only the old L1 C/A data channel must handle the half-cycle case.
:::

## Resolving the ambiguity: from float to fixed

Can a single receiver, on its own, find its $N_i$ from one moment's measurements? No. Count the unknowns. With $n$ satellites there are $n$ phase measurements. The unknowns are three position coordinates, one receiver clock, and one $N_i$ per satellite: $n + 4$ in total. There are always four more unknowns than measurements. Worse, each satellite and each receiver adds small fractional-cycle delays in its own electronics, which blur the $N_i$ so they are no longer whole numbers.

The fix is **differencing** between two receivers and between pairs of satellites, which the next lesson builds in full. Subtraction cancels the clocks and the hardware delays, and over a short distance most of the atmosphere. What is left depends only on position and a set of whole-number ambiguities. Collect several moments of data as the satellites move, and the system becomes solvable.

### The float solution

Solve that system by ordinary least squares and pretend, for now, that the ambiguities can be any real number. The result is the **float solution**: an estimate $\hat{\mathbf{N}}$ (read "N hat") of all the ambiguities as decimals, plus a **covariance matrix** $\mathbf{Q}_N$ that says how uncertain each is and how their errors move together. The errors are strongly **correlated** — when one is too high, others tend to be too high too — because they all share the same satellite geometry.

### The best whole-number answer

The tempting move is to round each float value to its nearest whole number. That is wrong when the errors are correlated. The right question is: which vector of whole numbers $\mathbf{N}$ makes

$$
(\mathbf{N}-\hat{\mathbf{N}})^{\mathsf T}\mathbf{Q}_N^{-1}(\mathbf{N}-\hat{\mathbf{N}})
$$

as small as possible? This is a distance that accounts for the correlation, and finding its smallest value over whole-number vectors is **integer least squares**. The set of points at equal cost is a tilted, stretched ellipse — a **[[search ellipse|search-ellipse]]** — not a circle.

**LAMBDA**, the **[[Least-squares AMBiguity Decorrelation Adjustment|lambda-history]]**, solves exactly this problem. Its contribution is not the cost above, which follows from the float covariance. It is a fast way to search when there are ten, twenty or more correlated ambiguities, where trying every nearby integer vector would take forever.

Its trick is a change of variables that maps whole numbers to whole numbers and can be undone. For two ambiguities, replace $N_2$ by $N_2 - N_1$: if $N_1$ and $N_2$ are integers, so is their difference, and you can always get $N_2$ back. Chosen well, such swaps make the errors nearly uncorrelated. The long, thin, tilted ellipse becomes almost round, and searching a round region for the best integer point is far quicker. At the end the swap is undone to give the answer in the original ambiguities.

::: example Why rounding each one gets it wrong
Two ambiguities have float estimate $\hat{\mathbf{N}} = (3.10,\,-4.45)$ and covariance

$$
\mathbf{Q}_N = \begin{pmatrix}1.0 & 0.85 \\ 0.85 & 3.0\end{pmatrix}.
$$

Their correlation is $0.85/\sqrt{1.0 \times 3.0} = 0.49$, a realistic value. Rounding each gives $(3,-4)$. Now search the correlation-aware cost:

```python
import numpy as np

Q_N = np.array([[1.0, 0.85], [0.85, 3.0]])
Qinv = np.linalg.inv(Q_N)
N_float = np.array([3.10, -4.45])

results = []
for n1 in range(0, 7):
    for n2 in range(-8, -1):
        d = np.array([n1, n2]) - N_float
        results.append((d @ Qinv @ d, n1, n2))
results.sort()
for cost, n1, n2 in results[:2]:
    print(f"N=({n1},{n2})  cost={cost:.4f}")
# N=(3,-5)  cost=0.1049
# N=(3,-4)  cost=0.1357
```

**The winner is $(3,-5)$, not $(3,-4)$.** Here is why. From $\hat{\mathbf{N}}$, the point $(3,-5)$ means both float values were too high (by $0.10$ and $0.55$). The positive correlation says errors tend to go the same way, so that is plausible. The point $(3,-4)$ means the first was too high and the second too low — errors in opposite directions, which the correlation says is less likely.

**A decorrelating swap.** Replace $N_2$ by $N_2 - N_1$. The new covariance has variances $1.0$ and $1.0 + 3.0 - 2 \times 0.85 = 2.3$ and a cross term $0.85 - 1.0 = -0.15$, so the correlation drops from $0.49$ to about $-0.10$. With that one swap the ellipse is already much rounder.
:::

### The ratio test: is the winner clear?

Finding the best integer vector is not the end. A wrong integer, once accepted, gives a confidently wrong position. So every candidate faces a **ratio test**: the second-best cost divided by the best cost.

A large ratio means the best candidate stands out. A ratio near one means the data cannot yet tell two answers apart. Then the correct move is to *not* fix: keep the float solution and wait for more epochs, more satellites or a second frequency to sharpen $\hat{\mathbf{N}}$. In the example the ratio is

$$
\frac{0.1357}{0.1049} = 1.29,
$$

well below the [[ratios of two to three|ratio-threshold]] that working systems require. That epoch would rightly stay float.

::: warning Do not fix on the best candidate alone
However much better its cost looks, a low-ratio fix trades an honest, known uncertainty for a possibly wrong, falsely precise integer. A receiver that fixes too eagerly, with poor geometry or too little data, is the most common source of a carrier-phase solution that is precise, self-consistent, and meters from the truth.
:::

## Check yourself

::: check
Write the carrier phase measurement equation. Which sign differs from the pseudorange equation, and why?
:::

::: answer
$\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$. The ionosphere term is $-I_i$ instead of $+I_i$. The ionosphere delays the code but advances the carrier's phase by the same amount, because its phase refractive index is less than one. The troposphere keeps the same sign as in the pseudorange equation: it is not dispersive and delays phase and code equally.
:::

::: check
A cycle slip changes the ambiguity by $-12$ cycles on L2 ($\lambda = 24.42\,\mathrm{cm}$). If nobody notices, how much does every later range measurement on that satellite shift, and which way?
:::

::: answer
$\lambda N$ enters with a plus sign. A change of $-12$ cycles lowers the measurement by $12 \times 0.2442 = 2.93\,\mathrm{m}$. The receiver still subtracts the old $N$, so every measurement after the slip reads $2.93\,\mathrm{m}$ short — a constant offset it would take for real range.
:::

::: check
Why is the second difference of the phase, rather than the phase itself or its first difference, the natural slip detector?
:::

::: answer
The raw phase carries the whole huge range, so a slip of a few cycles is invisible in it. The first difference is about the range rate — hundreds of meters per second — which is large and changing, so there is no fixed threshold to set. The second difference is about the range acceleration, which is tiny and steady, so normally it sits at the noise floor. A slip is a one-time step in the phase, and a step turns into a sharp up-then-down pair in the second difference that stands far above the noise, while leaving everything else untouched.
:::

::: check
Two integer candidates have correlation-aware costs of $0.041$ and $0.052$. Compute the ratio test. Is this a safe fix?
:::

::: answer
The ratio is second-best over best: $0.052/0.041 = 1.27$. That is close to one, so the second candidate fits the data almost as well as the best. It is not a safe fix by the usual standard of two to three or more. Keep the float solution and wait for more data.
:::

::: check
Why can a single receiver not resolve its own carrier ambiguities from one epoch of measurements, however many satellites it tracks?
:::

::: answer
Count unknowns. $n$ satellites give $n$ phase measurements. The unknowns are three coordinates, the receiver clock, and one ambiguity per satellite: $n + 4$. There are always four too many. On top of that, fractional-cycle delays in the satellite and receiver hardware get mixed into each ambiguity, so the numbers left to estimate are not whole numbers and the integer rule has nothing to grip. Differencing between two receivers and two satellites (next lesson) cancels the clocks and those hardware delays, leaving true integers to solve for.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Carrier phase | Range read from the carrier wave | $\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$; millimeter noise |
| Integer ambiguity | Whole cycles missing from the count | $N_i$, constant while lock holds; one cycle on L1 is $19.03\,\mathrm{cm}$ |
| Cycle slip | A sudden jump in $N_i$ after lost lock | Found as a $\pm$ spike pair in the phase's second difference |
| Float solution | Ambiguities estimated as decimals | $\hat{\mathbf{N}}$ with covariance $\mathbf{Q}_N$, from differenced phase |
| Integer least squares | Best whole-number vector | Minimize $(\mathbf{N}-\hat{\mathbf{N}})^{\mathsf T}\mathbf{Q}_N^{-1}(\mathbf{N}-\hat{\mathbf{N}})$; not rounding each |
| LAMBDA | Fast integer search | Integer-preserving change of variables that decorrelates $\mathbf{Q}_N$ |
| Ratio test | Is the winner clear? | Second-best cost over best; near $1$ means do not fix yet |

With the integers resolved, range measurements go from meter class to millimeter class. The next lesson builds the differencing that made that possible, and uses it for centimeter positioning with a nearby base station — and for precise point positioning, which needs no base station at all.

::: context phase-picture Whole cycles and the fraction
Between the satellite and the receiver lie millions of wave cycles. The receiver sees only the last partial cycle precisely. The whole ones before it are the ambiguity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20.0,60.0 22.5,51.6 25.0,44.4 27.5,39.7 30.0,38.0 32.5,39.7 35.0,44.4 37.5,51.6 40.0,60.0 42.5,68.4 45.0,75.6 47.5,80.3 50.0,82.0 52.5,80.3 55.0,75.6 57.5,68.4 60.0,60.0 62.5,51.6 65.0,44.4 67.5,39.7 70.0,38.0 72.5,39.7 75.0,44.4 77.5,51.6 80.0,60.0 82.5,68.4 85.0,75.6 87.5,80.3 90.0,82.0 92.5,80.3 95.0,75.6 97.5,68.4 100.0,60.0 102.5,51.6 105.0,44.4 107.5,39.7 110.0,38.0 112.5,39.7 115.0,44.4 117.5,51.6 120.0,60.0 122.5,68.4 125.0,75.6 127.5,80.3 130.0,82.0 132.5,80.3 135.0,75.6 137.5,68.4 140.0,60.0 142.5,51.6 145.0,44.4 147.5,39.7 150.0,38.0 152.5,39.7 155.0,44.4 157.5,51.6 160.0,60.0 162.5,68.4 165.0,75.6 167.5,80.3 170.0,82.0 172.5,80.3 175.0,75.6 177.5,68.4 180.0,60.0 182.5,51.6 185.0,44.4 187.5,39.7 190.0,38.0 192.5,39.7 195.0,44.4 197.5,51.6 200.0,60.0 202.5,68.4 205.0,75.6 207.5,80.3 210.0,82.0 212.5,80.3 215.0,75.6 217.5,68.4 220.0,60.0 222.5,51.6 225.0,44.4 227.5,39.7 230.0,38.0 232.5,39.7 235.0,44.4 237.5,51.6 240.0,60.0 242.5,68.4 245.0,75.6 247.5,80.3 250.0,82.0 252.5,80.3 255.0,75.6 257.5,68.4 260.0,60.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="3" points="260.0,60.0 262.5,51.6 265.0,44.4 267.5,39.7 270.0,38.0 272.5,39.7 275.0,44.4 277.5,51.6 280.0,60.0 282.5,68.4 285.0,75.6 287.5,80.3 290.0,82.0"/>
  <circle cx="14" cy="60" r="6" fill="#1f2a44"/>
  <text x="14" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">satellite</text>
  <rect x="296" y="52" width="16" height="16" fill="#1f2a44"/>
  <text x="304" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">receiver</text>
  <path d="M20,100 L20,106 L260,106 L260,100" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="124" font-size="12" text-anchor="middle" fill="#1d6fd1">whole cycles: unknown N</text>
  <path d="M260,100 L260,106 L290,106 L290,100" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="124" font-size="12" text-anchor="middle" fill="#b4232c">0.75: measured</text>
</svg>
```

The drawing shows six whole cycles; a real signal has about a hundred million.
:::

::: context pll A loop that chases the wave
A **phase-lock loop** is a small feedback system. It makes its own copy of the carrier, compares its phase with the incoming wave, and speeds up or slows down its copy to close the gap — like matching your steps to a friend walking beside you. Lesson 13 builds these loops properly, and shows why a loop that follows fast motion well also lets in more noise. That trade is what decides how easily a receiver on a rocket loses lock and slips cycles.
:::

::: context phase-advance Faster than light, without breaking any rules
In the ionosphere, the crests of a radio wave travel slightly faster than light in vacuum. That sounds forbidden, but crests carry no information. Information rides on changes in the wave — like the code's flips — and those travel at the **group velocity**, which is slower than light. For a plasma the two speeds sit on either side of $c$ by the same small amount. So the carrier arrives *early* by exactly the amount the code arrives *late*. That equal-and-opposite pair is what lets the next lesson's tricks measure the ionosphere.
:::

::: context slip-word Where the name comes from
Picture a gear with teeth driving a counter. If the gear jumps a few teeth, the counter slips and never finds out. A **cycle slip** is the same: the loop's cycle counter jumps by a whole number of cycles while it briefly lost its grip. In early GPS surveying, finding and fixing slips was a large part of the work of processing the data.
:::

::: context doublet Why a step makes a spike pair
A slip is a sudden step in the phase. Taking the difference twice turns that one step into one spike up and one spike down, side by side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="330" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="81.9" x2="330" y2="81.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="98.1" x2="330" y2="98.1" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="60" cy="90" r="3" fill="#1d6fd1"/>
  <circle cx="95" cy="90" r="3" fill="#1d6fd1"/>
  <circle cx="130" cy="90" r="3" fill="#1d6fd1"/>
  <rect x="157" y="30" width="16" height="60" fill="#b4232c"/>
  <rect x="192" y="90" width="16" height="60" fill="#b4232c"/>
  <circle cx="235" cy="90" r="3" fill="#1d6fd1"/>
  <circle cx="270" cy="90" r="3" fill="#1d6fd1"/>
  <circle cx="305" cy="90" r="3" fill="#1d6fd1"/>
  <text x="178" y="24" font-size="12" fill="#b4232c">+37</text>
  <text x="213" y="160" font-size="12" fill="#b4232c">−37</text>
  <text x="40" y="170" font-size="11" fill="#6c7a93">dashed: a 5-cycle threshold</text>
  <text x="40" y="20" font-size="12" fill="#1f2a44">second difference, cycles</text>
</svg>
```

These are the eight values from the example, drawn to scale; the six small ones are too tiny to see.
:::

::: context geometry-free Subtracting away everything but the sky
Measure the same satellite's carrier on L1 and L2, both in meters, and subtract. The distance, both clocks and the troposphere are identical on the two frequencies, so they vanish. What is left is the ionosphere (different on each frequency) and the two ambiguities. This is the **geometry-free combination**. The ionosphere changes slowly and smoothly, so a sudden jump in this combination can only be a slip, and its size tells you how many cycles slipped on which frequency.
:::

::: context costas A loop that ignores upside-down
The **Costas loop** was invented by the American engineer John P. Costas at General Electric in the 1950s. A plain phase-lock loop gets confused when the data flips the wave upside down. A Costas loop is built so that a flipped wave looks the same as an unflipped one, so the data does not disturb it. The price is that it cannot tell which half of a cycle it is in, which is where the half-cycle slip comes from.
:::

::: context search-ellipse Rounding looks at a square; the data draws an ellipse
The dots are whole-number pairs. The ellipse is where the correlation-aware cost equals $0.12$ around the float estimate (the cross). The dot at $(3,-5)$ sits inside it; the rounded answer $(3,-4)$ sits just outside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="#6c7a93">
    <circle cx="110" cy="25" r="3"/><circle cx="160" cy="25" r="3"/><circle cx="210" cy="25" r="3"/>
    <circle cx="110" cy="75" r="3"/><circle cx="210" cy="75" r="3"/>
    <circle cx="110" cy="125" r="3"/><circle cx="210" cy="125" r="3"/>
    <circle cx="110" cy="175" r="3"/><circle cx="160" cy="175" r="3"/><circle cx="210" cy="175" r="3"/>
  </g>
  <ellipse cx="165" cy="97.5" rx="31.5" ry="14.4" transform="rotate(-69.8 165 97.5)" fill="#8fb8f0" fill-opacity="0.4" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="160" cy="75" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="160" cy="125" r="5" fill="#b4232c"/>
  <path d="M160,92.5 L170,102.5 M170,92.5 L160,102.5" stroke="#1f2a44" stroke-width="2"/>
  <text x="228" y="79" font-size="12" fill="#1f2a44">(3, −4): rounded</text>
  <text x="228" y="129" font-size="12" fill="#b4232c">(3, −5): best</text>
  <text x="228" y="101" font-size="12" fill="#1f2a44">float (3.10, −4.45)</text>
  <text x="110" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">N1 = 2</text>
  <text x="210" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">N1 = 4</text>
</svg>
```

Both axes use the same scale. The ellipse tilts because the two errors are correlated.
:::

::: context lambda-history A Dutch answer to a hard search
LAMBDA was developed by Peter Teunissen and colleagues at Delft University of Technology in the Netherlands, first published in 1993. Before it, receivers searched for integers with slow, clumsy methods that often took many minutes of data. LAMBDA made fast, reliable ambiguity fixing practical, and it remains the standard method in survey receivers and open-source tools such as RTKLIB.
:::

::: context ratio-threshold How strict real receivers are
There is no single correct threshold. The open-source RTKLIB package uses $3$ as its default ratio. Many commercial receivers use values between $2$ and $3$, sometimes adjusted by how many ambiguities are being fixed. Stricter thresholds mean fewer wrong fixes but a longer wait before fixing. Designers of safety-critical systems choose from a target failure probability rather than a round number.
:::
