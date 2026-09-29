---
id: l04-log-axes-and-control-plots
title: Log axes, Bode plots, pole-zero maps and root loci
minutes: 20
covers:
  - Log and semilog axes; annotated Bode, pole-zero and root-locus plots
---

Think about how loud things are. A whisper, a normal voice, a lawn mower, a rocket launch seen from the press site. The loudest is millions of times more powerful than the quietest. If you drew them as bars on an ordinary ruler, the rocket bar would run off the page and the whisper bar would be too thin to see. So nobody measures sound that way. Sound meters count *how many times ten* one sound is over another. Every step up the scale is ten times more, not one more.

A plot axis can work the same way. On a **log axis**, equal distances mean equal *ratios*: the gap from 1 to 10 is as wide as the gap from 10 to 100 and from 100 to 1000. That lets one picture hold a quantity that spans many powers of ten, and it turns certain curves into straight lines you can read with a ruler.

Guidance and control engineers live on log axes. The standard picture of a control loop, the **Bode plot**, has frequency on a log axis. Filter errors that shrink by a factor every second are plotted on log axes. Gyro noise is judged on log-log plots. This lesson shows you how to make these axes with the object API from the first lesson, and then how to draw the three pictures every control review asks for: the Bode plot, the pole-zero map and the root locus, each annotated so a reviewer sees the answer without squinting.

## Equal steps mean equal ratios

On an ordinary, **linear** axis, moving one centimeter always adds the same amount. On a log axis, moving one centimeter always *multiplies* by the same amount. The position of a value $x$ is proportional to $\log_{10} x$, read "log base ten of x": the power you raise 10 to in order to get $x$. So $\log_{10} 100 = 2$ and $\log_{10} 1000 = 3$.

One power of ten along a log axis is called a **[[decade|decade-word]]**. From $0.1$ to $100$ is three decades: $0.1 \to 1 \to 10 \to 100$.

Inside each decade the tick marks bunch up toward the right. The value 2 sits $\log_{10} 2 \approx 0.301$ of the way across its decade, 3 sits at $0.477$, and 5 sits at $0.699$. That uneven spacing is the fingerprint of a log axis. When you see it, read values by the ratio, not the distance.

Matplotlib gives every Axes a **scale** per axis. You set it with `ax.set_xscale("log")` or `ax.set_yscale("log")`. There are also three shortcut plotting methods on the Axes:

- `ax.semilogx(x, y)` draws a line with a log horizontal axis and a linear vertical one;
- `ax.semilogy(x, y)` does the opposite: linear horizontal, log vertical;
- `ax.loglog(x, y)` makes both axes log.

"Semilog" means half-log: one axis of each kind.

::: key
On a log axis equal distances are equal ratios; one decade (a factor of 10) is always the same length. `semilogx`, `semilogy` and `loglog` are Axes methods; `ax.set_xscale("log")` does the same to an existing axis.
:::

### When a curve becomes a straight line

Here is why engineers reach for log axes so often. Take something that shrinks by the same *fraction* every second, like the position error of a navigation filter settling after it starts. Its size follows $e(t) = e_0\, e^{-t/\tau}$, where $e_0$ ("e sub zero") is the starting error and $\tau$ ("tau") is the **time constant**, the time for the error to fall to about 37 percent.

On a linear axis this curve drops fast and then looks flat, glued to zero. You cannot tell whether the error at 60 seconds is 3 centimeters or 3 millimeters. On a semilog-y axis, the same curve is a straight line, because $\log_{10} e(t)$ is a straight-line function of $t$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0, 60, 601)             # s
err = 50.0 * np.exp(-t / 8.0)           # m, a filter error settling

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(8, 3), layout="constrained")
ax1.plot(t, err)
ax1.set_xlabel("Time since start (s)")
ax1.set_ylabel("Position error (m)")

ax2.semilogy(t, err)                     # same data, log vertical axis
ax2.set_xlabel("Time since start (s)")
ax2.set_ylabel("Position error (m)")

print(ax2.get_yscale())
print(round(err[-1], 5))
# log
# 0.02765
```

In the left panel, anything after about 30 seconds looks like zero. In the right panel you can read that the error ends near $0.028\,\mathrm{m}$, and that it keeps falling at a steady rate the whole time. If that line ever bent flat, you would see it at once. That bend would mean the filter had stopped improving, which is exactly what a reviewer wants to catch.

::: note Why an exponential is straight on a log axis
Take the log of both sides of $e(t) = e_0 e^{-t/\tau}$:

$$
\log_{10} e(t) = \log_{10} e_0 - \frac{t}{\tau \ln 10}.
$$

The right side is a constant minus a constant times $t$: the equation of a straight line in $t$. Here $\ln 10 \approx 2.303$ is the natural log of 10. The slope says the error drops one decade every $\tau \ln 10$ seconds. With $\tau = 8\,\mathrm{s}$ that is about $18.4\,\mathrm{s}$ per decade, and 60 seconds is about $3.26$ decades: $50\,\mathrm{m}$ down to about $0.028\,\mathrm{m}$.
:::

A power law, $y = c\,x^{p}$, becomes straight on a log-log plot, with slope $p$. That is why noise spectra and the **[[Allan deviation|allan-deviation]]** of a gyro are always drawn with `loglog`: each noise type shows up as a straight segment with its own slope.

::: warning Zero and negative numbers have no place on a log axis
There is no power of ten that equals $0$ or $-3$. By default Matplotlib **clips** such values to a tiny positive number, so a line dives off the bottom of the plot; with `nonpositive="mask"` it leaves a gap instead. Neither is an error message, so the problem hides. Decide on purpose: plot `np.abs(err)` and say so in the label, or use `ax.set_yscale("symlog", linthresh=...)`, a **[[symmetric log|symlog-scale]]** scale that is linear near zero and logarithmic beyond.
:::

## Decibels and the Bode plot

A control loop is judged by how it treats a wiggle at each frequency. Push on a spacecraft's attitude with a slow sine wave and the controller pushes back hard. Push with a very fast one and the controller barely reacts. The **frequency response** records, for each frequency, how much the loop multiplies a wiggle (its **gain**) and how far behind it lags (its **phase**).

The loop is described by a **[[transfer function|transfer-function]]**: a fraction of two polynomials in a variable $s$. Our running example is a simple loop,

$$
L(s) = \frac{20}{s(s+4)} = \frac{20}{s^2 + 4s}.
$$

Put $s = j\omega$ in it, where $j$ is the square root of $-1$ and $\omega$ ("omega") is the frequency in radians per second. You get a complex number. Its size $|L(j\omega)|$ is the gain. Its angle is the phase, in degrees.

Gain is quoted in **decibels** (dB), a log unit:

$$
|L|_{\mathrm{dB}} = 20 \log_{10} |L|.
$$

A gain of 10 is $+20\,\mathrm{dB}$. A gain of $0.1$ is $-20\,\mathrm{dB}$. A gain of exactly 1, where the loop neither grows nor shrinks a signal, is $0\,\mathrm{dB}$. Doubling is about $+6\,\mathrm{dB}$. The **[[factor of 20|twenty-not-ten]]** is there because gain is a ratio of amplitudes, not of powers.

A **Bode plot** is two panels stacked with a shared log-frequency axis: magnitude in dB on top, phase in degrees below. Both vertical axes are linear. The dB already did the log for the magnitude.

::: key
A Bode plot is magnitude in dB, $20\log_{10}|L(j\omega)|$, and phase in degrees, both against frequency on a log axis. Use `semilogx` (or `set_xscale("log")`) with a shared x axis; the vertical axes stay linear.
:::

SciPy computes the numbers. `scipy.signal.TransferFunction` takes the numerator and denominator coefficients, highest power first, and `scipy.signal.bode` returns the frequencies, the magnitude in dB and the phase in degrees. Make the frequencies with `np.logspace(-1, 2, 2000)`: 2000 points spread evenly *in log*, from $10^{-1}$ to $10^{2}$ rad/s.

::: example Reading crossover and phase margin
Two numbers sum up how healthy a loop is.

The **gain crossover** frequency $\omega_c$ ("omega sub c") is where the magnitude passes through $0\,\mathrm{dB}$. The **[[phase margin|phase-margin]]** is how far the phase is above $-180^\circ$ at that frequency: $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$. More margin means a calmer loop.

```python
import numpy as np
from scipy import signal

L = signal.TransferFunction([20.0], [1.0, 4.0, 0.0])   # 20 / (s^2 + 4 s)
w = np.logspace(-1, 2, 2000)                            # 0.1 to 100 rad/s
w, mag_db, phase_deg = signal.bode(L, w)

i = np.argmin(np.abs(mag_db))           # sample closest to 0 dB
w_c = w[i]
pm = 180.0 + phase_deg[i]
print(f"crossover {w_c:.2f} rad/s, phase {phase_deg[i]:.1f} deg, PM {pm:.1f} deg")
print(f"|L| at 0.1 rad/s: {mag_db[0]:.1f} dB, at 100 rad/s: {mag_db[-1]:.1f} dB")
# crossover 3.68 rad/s, phase -132.6 deg, PM 47.4 deg
# |L| at 0.1 rad/s: 34.0 dB, at 100 rad/s: -54.0 dB
```

**Step 1, crossover.** `np.argmin(np.abs(mag_db))` finds the index of the magnitude sample nearest zero. That frequency is $\omega_c \approx 3.68\,\mathrm{rad/s}$.

**Step 2, phase there.** The phase at that index is about $-132.6^\circ$.

**Step 3, margin.** $180 + (-132.6) = 47.4^\circ$.

**Sanity check by hand.** $|L(j\omega)| = 20 / (\omega\sqrt{\omega^2 + 16})$. Setting it to 1 gives $\omega^2(\omega^2 + 16) = 400$, a quadratic in $\omega^2$ with positive root $\omega^2 \approx 13.54$, so $\omega \approx 3.68$. The phase is $-90^\circ$ from the lone $s$ minus $\arctan(\omega/4) \approx 42.6^\circ$ from the $(s+4)$, total $-132.6^\circ$. The code agrees. And on the plot's three-decade axis, $3.68$ sits $(\log_{10} 3.68 + 1)/3 \approx 0.52$ of the way across, a little right of center.
:::

### Annotating the Bode plot

A bare Bode plot makes the reviewer do the work. An annotated one puts the answer on the page: the 0 dB and $-180^\circ$ reference lines, a dashed vertical line at crossover through both panels, a two-headed arrow for the margin, and the numbers in text.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal

L = signal.TransferFunction([20.0], [1.0, 4.0, 0.0])
w, mag_db, phase_deg = signal.bode(L, np.logspace(-1, 2, 2000))
i = np.argmin(np.abs(mag_db))
w_c, pm = w[i], 180.0 + phase_deg[i]

fig, (ax_m, ax_p) = plt.subplots(2, 1, sharex=True, figsize=(6, 5),
                                 layout="constrained")
ax_m.semilogx(w, mag_db)
ax_m.axhline(0.0, color="0.4", lw=0.8)           # the 0 dB line
ax_m.set_ylabel("Magnitude (dB)")

ax_p.semilogx(w, phase_deg)
ax_p.axhline(-180.0, color="0.4", lw=0.8)        # the -180 deg line
ax_p.set_ylabel("Phase (deg)")
ax_p.set_xlabel("Frequency (rad/s)")

for ax in (ax_m, ax_p):
    ax.axvline(w_c, color="0.4", ls="--", lw=0.8)
    ax.grid(True, which="both", alpha=0.3)

ax_p.annotate("", xy=(w_c, -180.0), xytext=(w_c, phase_deg[i]),
              arrowprops=dict(arrowstyle="<->"))
ax_p.annotate(f"PM = {pm:.1f} deg", xy=(w_c, phase_deg[i] - 20),
              xytext=(8, 0), textcoords="offset points")
ax_m.annotate(f"crossover {w_c:.2f} rad/s", xy=(w_c, 0.0),
              xytext=(10, 15), textcoords="offset points")
fig.savefig("bode.png", dpi=100)
print(f"{w_c:.2f} {pm:.1f}")
# 3.68 47.4
```

Walk through the new pieces. `sharex=True` ties the two frequency axes, so zooming one zooms both. `axhline` and `axvline` draw a line across the whole axes at one value. `grid(True, which="both")` draws grid lines at the minor ticks too, the 2, 3, 4 … inside each decade, which is what makes a log axis readable. `annotate` with an empty string and `arrowprops` draws the arrow alone; the second `annotate` places text a few points to the right of a data position. The next lesson covers text and arrows in detail.

Look at the magnitude line on the finished plot. At low frequency it falls about $20\,\mathrm{dB}$ per decade. At high frequency it falls about $40\,\mathrm{dB}$ per decade: from $-14.6\,\mathrm{dB}$ at $10\,\mathrm{rad/s}$ to $-54.0\,\mathrm{dB}$ at $100\,\mathrm{rad/s}$. Each factor of $s$ in the denominator adds $-20\,\mathrm{dB}$ per decade once the frequency is past its corner. Straight-line slopes like these are only visible because the frequency axis is log.

::: warning Hertz or radians per second?
`scipy.signal.bode` works in radians per second. Many test reports quote hertz, and $1\,\mathrm{Hz} = 2\pi\,\mathrm{rad/s} \approx 6.28\,\mathrm{rad/s}$. A crossover of $3.68\,\mathrm{rad/s}$ is only $0.586\,\mathrm{Hz}$. Put the unit in the axis label every time, and convert with `w / (2 * np.pi)` before plotting if the report is in hertz.
:::

## Pole-zero maps

The **poles** of a transfer function are the values of $s$ that make its denominator zero. The **zeros** make its numerator zero. They are complex numbers, so each one is a point on a flat plane, the **[[s-plane|s-plane]]**: real part across, imaginary part up.

Where the poles sit tells you how a system moves. Poles in the left half (negative real part) give motions that die away. Poles in the right half give motions that grow: an unstable vehicle. The imaginary axis is the border. Poles farther up and down give faster oscillation.

Close our loop, and the closed-loop system is

$$
T(s) = \frac{20}{s^2 + 4s + 20}.
$$

`np.roots` finds a polynomial's roots from its coefficients, highest power first. Poles are drawn as `x` and zeros as hollow `o`, by long habit.

::: example Poles, natural frequency and damping
```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

num = [20.0]                    # closed loop T(s) = 20 / (s^2 + 4 s + 20)
den = [1.0, 4.0, 20.0]
zeros = np.roots(num)           # empty: no zeros
poles = np.roots(den)
print(np.round(poles, 3))
# [-2.+4.j -2.-4.j]

wn = np.abs(poles[0])                 # distance from the origin
zeta = -poles[0].real / wn            # cosine of the angle from the negative real axis
print(f"wn = {wn:.3f} rad/s, zeta = {zeta:.3f}")
# wn = 4.472 rad/s, zeta = 0.447

fig, ax = plt.subplots(figsize=(4, 4), layout="constrained")
ax.axhline(0.0, color="0.6", lw=0.8)
ax.axvline(0.0, color="0.6", lw=0.8)             # the stability boundary
ax.plot(poles.real, poles.imag, "x", ms=10, mew=2, label="poles")
ax.plot(zeros.real, zeros.imag, "o", mfc="none", ms=10, label="zeros")
ax.set_aspect("equal")                            # 1 rad/s is the same length both ways
ax.set_xlim(-6, 2)
ax.set_ylim(-5, 5)
ax.set_xlabel("Real part (1/s)")
ax.set_ylabel("Imaginary part (rad/s)")
ax.annotate(f"zeta = {zeta:.2f}", xy=(poles[0].real, poles[0].imag),
            xytext=(10, 5), textcoords="offset points")
ax.legend(loc="upper left")
fig.savefig("pz.png", dpi=100)
```

**Step 1.** The roots of $s^2 + 4s + 20$ are $-2 \pm 4j$: the formula gives $(-4 \pm \sqrt{16 - 80})/2 = -2 \pm \sqrt{-16} = -2 \pm 4j$.

**Step 2.** The **natural frequency** $\omega_n$ ("omega sub n") is the pole's distance from the origin: $\sqrt{2^2 + 4^2} = \sqrt{20} \approx 4.47\,\mathrm{rad/s}$.

**Step 3.** The **[[damping ratio|damping-angle]]** $\zeta$ ("zeta") is the real part's size over that distance: $2/4.47 \approx 0.447$. A value near $0.4$ to $0.7$ is a well-behaved loop with a small overshoot.

**Sanity check.** Both poles are left of the imaginary axis, so the closed loop is stable, which matches the healthy $47^\circ$ phase margin from the Bode plot.
:::

The line `ax.set_aspect("equal")` matters more than it looks. It makes one unit across the same length as one unit up. Without it the plane is stretched, and the angle of a pole from the real axis, which *is* the damping, looks wrong. Draw the imaginary axis boldly too: it is the stability boundary, and the reviewer's eye goes there first.

## Root loci

Most loops have a gain knob, $K$. Turn it up and the closed-loop poles move. A **root locus** plots the path every closed-loop pole takes as $K$ goes from zero upward. It answers "how much gain can I add before this goes unstable, and what does the motion look like on the way?"

For a loop $K\,G(s)$ with $G(s) = N(s)/D(s)$, the closed-loop poles are the roots of

$$
D(s) + K\,N(s) = 0.
$$

With our $G(s) = 1/(s^2 + 4s)$ that is $s^2 + 4s + K = 0$. The plotting recipe is a loop over gains, `np.roots` at each one, and a scatter of all the roots:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

gains = np.linspace(0.0, 40.0, 401)
# closed-loop characteristic polynomial: s^2 + 4 s + K = 0
roots = np.array([np.roots([1.0, 4.0, k]) for k in gains])   # shape (401, 2)
print(roots.shape)
# (401, 2)
print(np.round(roots[gains == 4.0][0], 3))     # the two branches meet
# [-2.+0.j -2.+0.j]
print(np.round(roots[gains == 20.0][0], 3))
# [-2.+4.j -2.-4.j]

fig, ax = plt.subplots(figsize=(4, 4), layout="constrained")
ax.plot(roots.real, roots.imag, ".", ms=2, color="C0")
ax.plot([0.0, -4.0], [0.0, 0.0], "x", ms=10, mew=2, color="k")  # open-loop poles
k20 = roots[gains == 20.0][0]
ax.plot(k20.real, k20.imag, "s", color="C3")
ax.annotate("K = 20", xy=(k20[0].real, k20[0].imag),
            xytext=(8, 0), textcoords="offset points")
ax.axvline(0.0, color="0.6", lw=0.8)
ax.set_aspect("equal")
ax.set_xlim(-7, 2)
ax.set_ylim(-7, 7)
ax.set_xlabel("Real part (1/s)")
ax.set_ylabel("Imaginary part (rad/s)")
fig.savefig("rl.png", dpi=100)
```

Read it. At $K = 0$ the closed-loop poles sit on the open-loop poles, $0$ and $-4$, marked with black crosses. As $K$ grows they slide toward each other along the real axis, meet at $-2$ when $K = 4$, and then split straight up and down along the line where the real part is $-2$. The square marks the gain actually used, $K = 20$, at $-2 \pm 4j$: the same poles as the pole-zero map. Every plot in this lesson tells one consistent story about one loop.

Plot the roots as dots, not a connected line. `np.roots` does not promise to return roots in the same order at every gain, so a line would jump between branches and draw false zigzags.

::: warning Mark the operating point
A root locus without the chosen gain marked is a picture of every possible design, not of yours. Put a distinct marker at the design gain, label it, and draw the imaginary axis. If the locus crosses into the right half-plane, mark the crossing gain too. The crossing gain divided by the design gain is the **gain margin**, how many times the gain could grow before the loop goes unstable, and the plot then shows it in plain sight.
:::

## Check yourself

::: check
A sensor's noise is attenuated by a factor of $0.05$ at some frequency. What is that in decibels, and would a line at that value sit above or below the 0 dB line?
:::

::: answer
$20 \log_{10} 0.05 = 20 \times (-1.301) \approx -26.0\,\mathrm{dB}$. It is negative, so it sits below the 0 dB line. Any factor less than 1 is a negative number of decibels.
:::

::: check
You call `ax.semilogy(t, alt_error)` and part of the curve plunges to the bottom of the axes and vanishes. The altitude error changes sign during the flight. What happened, and what are two honest fixes?
:::

::: answer
A log axis cannot show zero or negative values. Matplotlib's default clips them to a tiny positive number, so the line dives off the bottom. Fix 1: plot `np.abs(alt_error)` on the log axis and label it "Altitude error magnitude (m)". Fix 2: keep the sign and use `ax.set_yscale("symlog", linthresh=0.01)` (or another threshold that suits the data), which is linear inside $\pm 0.01\,\mathrm{m}$ and logarithmic outside. The wrong fix is to leave it and hope nobody notices the gap.
:::

::: check
A closed-loop system has poles at $-1 \pm 1j$. Find its natural frequency and damping ratio. What pole-zero-map setting do you need so the $45^\circ$ angle of these poles looks like $45^\circ$?
:::

::: answer
The distance from the origin is $\omega_n = \sqrt{1^2 + 1^2} = \sqrt{2} \approx 1.41\,\mathrm{rad/s}$. The damping ratio is the real part's size over that distance: $\zeta = 1/1.41 \approx 0.707$. The poles sit at $45^\circ$ from the negative real axis, and $\cos 45^\circ \approx 0.707$, which matches. To see that angle correctly you need `ax.set_aspect("equal")`, so one unit across is as long as one unit up.
:::

::: check
The loop $K / (s(s+4)(s+10))$ has closed-loop poles at the roots of $s^3 + 14s^2 + 40s + K$. Describe the code that finds the gain at which its root locus crosses the imaginary axis, and what you would mark on the plot.
:::

::: answer
Make an array of gains, for example `np.linspace(0, 1000, 10001)`, and for each gain compute `np.roots([1.0, 14.0, 40.0, k])`. Take the largest real part at each gain and find the first gain where it becomes zero or positive. That gain is $K = 560$, and the crossing roots are about $\pm 6.32j$, so the loop oscillates at about $6.32\,\mathrm{rad/s}$ ($1.01\,\mathrm{Hz}$) there. (By hand: with $s = j\omega$, the imaginary part gives $\omega^2 = 40$ and the real part gives $K = 14 \times 40 = 560$.) On the plot, mark the crossing with a labeled marker ("K = 560, 6.32 rad/s"), mark the design gain with another, and draw the imaginary axis. The ratio of the two gains is the gain margin.
:::

::: check
Why does a Bode plot put frequency on a log axis but leave the magnitude axis linear?
:::

::: answer
The frequencies of interest span several decades, and the slopes that tell you about the loop ($-20\,\mathrm{dB}$ per decade for each pole) only become straight lines on a log frequency axis. The magnitude is already a log quantity, because decibels are $20\log_{10}$ of the gain. Putting dB on a log axis would take the log twice, which means nothing. So the vertical axis is linear in dB, and the phase axis is linear in degrees.
:::

## Summary

| Idea | Meaning | Code or formula |
|---|---|---|
| Log axis | equal distances are equal ratios | `ax.set_xscale("log")` |
| Semilog, log-log | one or both axes log | `semilogx`, `semilogy`, `loglog` |
| Decade | a factor of 10 along a log axis | from $0.1$ to $1$ is one decade |
| Nonpositive values | cannot sit on a log axis | clipped by default; use `abs` or `"symlog"` |
| Decibel | log gain unit | $20\log_{10}\lvert L\rvert$ |
| Bode plot | gain and phase against log frequency | `signal.bode`, two panels, `sharex=True` |
| Phase margin | phase above $-180^\circ$ at 0 dB | $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$ |
| Pole-zero map | poles `x`, zeros `o` on the s-plane | `np.roots`, `set_aspect("equal")` |
| Root locus | closed-loop poles as gain grows | roots of $D(s) + K N(s)$, plotted as dots |

Every one of these plots leaned on text and arrows: labels with units, numbers placed at a point, a marker named in a legend. The next lesson takes those tools apart properly, along with tick marks, number formats and time axes.

::: context decade-word A decade of frequency
In everyday speech a decade is ten years. On a log axis it is a factor of ten. Engineers say a filter "rolls off at 20 dB per decade" or a sensor is "flat over three decades". Musicians and audio engineers also use the **octave**, a factor of two; $-20\,\mathrm{dB}$ per decade is about $-6\,\mathrm{dB}$ per octave.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="38" x2="30" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="38" x2="130" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <line x1="230" y1="38" x2="230" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <line x1="330" y1="38" x2="330" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="60.1" y1="44" x2="60.1" y2="56"/><line x1="77.7" y1="44" x2="77.7" y2="56"/>
    <line x1="90.2" y1="44" x2="90.2" y2="56"/><line x1="99.9" y1="44" x2="99.9" y2="56"/>
    <line x1="107.8" y1="44" x2="107.8" y2="56"/><line x1="114.5" y1="44" x2="114.5" y2="56"/>
    <line x1="120.3" y1="44" x2="120.3" y2="56"/><line x1="125.4" y1="44" x2="125.4" y2="56"/>
    <line x1="160.1" y1="44" x2="160.1" y2="56"/><line x1="177.7" y1="44" x2="177.7" y2="56"/>
    <line x1="190.2" y1="44" x2="190.2" y2="56"/><line x1="199.9" y1="44" x2="199.9" y2="56"/>
    <line x1="207.8" y1="44" x2="207.8" y2="56"/><line x1="214.5" y1="44" x2="214.5" y2="56"/>
    <line x1="220.3" y1="44" x2="220.3" y2="56"/><line x1="225.4" y1="44" x2="225.4" y2="56"/>
    <line x1="260.1" y1="44" x2="260.1" y2="56"/><line x1="277.7" y1="44" x2="277.7" y2="56"/>
    <line x1="290.2" y1="44" x2="290.2" y2="56"/><line x1="299.9" y1="44" x2="299.9" y2="56"/>
    <line x1="307.8" y1="44" x2="307.8" y2="56"/><line x1="314.5" y1="44" x2="314.5" y2="56"/>
    <line x1="320.3" y1="44" x2="320.3" y2="56"/><line x1="325.4" y1="44" x2="325.4" y2="56"/>
  </g>
  <text x="30" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">0.1</text>
  <text x="130" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="230" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="330" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="80" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">decade</text>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">decade</text>
  <text x="280" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">decade</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">minor ticks at 2, 3, … 9 bunch to the right</text>
</svg>
```
:::

::: context allan-deviation The gyro engineer's favorite log-log plot
An Allan deviation plot answers "if I average this gyro's output over $\tau$ seconds, how much does the average wander?" It is drawn against $\tau$ on log-log axes, often over five or six decades. Each kind of noise has its own straight-line slope: random walk in angle falls with slope $-1/2$, bias instability is the flat bottom, and rate random walk rises with slope $+1/2$. A navigation engineer reads a gyro's quality off those segments in seconds. On linear axes the same curve would be an unreadable hockey stick.
:::

::: context symlog-scale A log scale that tolerates zero
Matplotlib's `"symlog"` scale is linear for values between $-$`linthresh` and $+$`linthresh`, and logarithmic outside, mirrored for negative values. It suits signed data that spans decades, such as a velocity error that swings from $-10$ to $+10{,}000\,\mathrm{m/s}$. The price is a kink in scale at the threshold. Say in the caption where the linear band is, or a reader will misjudge sizes near zero.
:::

::: context transfer-function What the fraction in s means
A transfer function describes a linear system: output over input, after a change of variable called the Laplace transform turns derivatives into powers of $s$. A pure integrator (velocity in, position out) is $1/s$. A first-order lag with time constant $\tau$ is $1/(\tau s + 1)$. Setting $s = j\omega$ gives the steady response to a sine wave at frequency $\omega$. You meet the full theory in the classical control module; for plotting, what you need is that the numerator and denominator are polynomials, stored as coefficient lists, highest power first.
:::

::: context twenty-not-ten Why 20 and not 10
The bel, named after Alexander Graham Bell, measures a *power* ratio: one bel is a factor of 10 in power, and the decibel is a tenth of that, so power in dB is $10\log_{10} P$. Power goes as amplitude squared, and $10\log_{10}(A^2) = 20\log_{10} A$. A control loop's gain is an amplitude ratio (degrees out per degree in), so it takes the 20. Mixing the two conventions puts a factor-of-two error in every dB number.
:::

::: context phase-margin Why minus 180 degrees is the danger line
A loop feeds its output back with a minus sign, which is already a $180^\circ$ flip. If the loop adds another $180^\circ$ of lag at a frequency where its gain is 1, the signal comes back around identical to how it left: the loop pushes the wiggle instead of fighting it, and it sustains itself. Phase margin is how many degrees of extra lag, from a slow sensor, a computing delay or a flexible structure, the loop can absorb before reaching that point. Launch vehicle attitude loops are commonly designed to margins of about $30^\circ$ or more.
:::

::: context s-plane The map of where motions live
Each point of the s-plane is a kind of motion $e^{st}$. The real part sets growth or decay; the imaginary part sets how fast it spins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="160" height="180" fill="#8fb8f0" opacity="0.35"/>
  <rect x="180" y="10" width="160" height="180" fill="#f2b880" opacity="0.35"/>
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <text x="100" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">decays: stable</text>
  <text x="260" y="30" font-size="12" text-anchor="middle" fill="#b4232c">grows: unstable</text>
  <text x="330" y="94" font-size="11" text-anchor="end" fill="#1f2a44">real</text>
  <text x="186" y="22" font-size="11" fill="#1f2a44">imaginary</text>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="134" y1="54" x2="146" y2="66"/><line x1="146" y1="54" x2="134" y2="66"/>
    <line x1="134" y1="134" x2="146" y2="146"/><line x1="146" y1="134" x2="134" y2="146"/>
  </g>
  <text x="124" y="64" font-size="11" text-anchor="end" fill="#1f2a44">−2 + 4j</text>
  <text x="124" y="144" font-size="11" text-anchor="end" fill="#1f2a44">−2 − 4j</text>
  <text x="100" y="180" font-size="11" text-anchor="middle" fill="#6c7a93">farther left: dies faster</text>
</svg>
```

Poles on the imaginary axis neither grow nor decay: a steady oscillation, the edge of instability.
:::

::: context damping-angle Damping is an angle
Draw a line from the origin to a pole. The angle $\theta$ between that line and the negative real axis satisfies $\zeta = \cos\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="250" y1="20" x2="250" y2="190" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="250" y1="170" x2="190" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="50" x2="190" y2="170" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M210,170 A40,40 0 0,1 232.1,134.2" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="212" y="158" font-size="12" fill="#b4232c">θ</text>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="184" y1="44" x2="196" y2="56"/><line x1="196" y1="44" x2="184" y2="56"/>
  </g>
  <text x="178" y="42" font-size="12" text-anchor="end" fill="#1f2a44">pole −2 + 4j</text>
  <text x="228" y="100" font-size="12" fill="#1d6fd1">ωn = 4.47</text>
  <text x="190" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">−2</text>
  <text x="256" y="186" font-size="11" fill="#1f2a44">0</text>
  <text x="60" y="130" font-size="12" fill="#1f2a44">ζ = cos θ = 2 / 4.47</text>
</svg>
```
 Poles on the negative real axis ($\theta = 0$) have $\zeta = 1$ and no overshoot; poles on the imaginary axis ($\theta = 90^\circ$) have $\zeta = 0$ and ring forever. Our poles at $-2 \pm 4j$ sit at $\theta \approx 63.4^\circ$, and $\cos 63.4^\circ \approx 0.447$. This is why the aspect ratio must be equal: stretch the plot and every angle, and so every damping ratio, looks wrong. Control engineers often overlay straight lines of constant $\zeta$ as design guides.
:::
