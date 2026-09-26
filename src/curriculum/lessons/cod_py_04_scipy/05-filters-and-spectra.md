---
id: l05-filters-and-spectra
title: Filters and spectra: butter, lfilter, filtfilt and welch
minutes: 22
covers:
  - 'scipy.signal: butter, filtfilt vs lfilter, welch, bode, tf2ss, cont2discrete'
---

Turn on a radio between stations and you hear hiss. Tune in a song and the music rides on top of that hiss. Now picture the bass and treble knobs on a stereo. Turn the treble down and the hiss softens, because hiss is mostly high notes. And the bouncing bars on a music player's equalizer show you how loud each pitch is, moment to moment.

Sensor data is exactly like that radio. An accelerometer on a rocket measures the slow motion you care about, plus fast buzz from engines, pumps and electronics. Two jobs come up again and again. The first is **filtering**: turning the treble down so the slow motion shows through. The second is **spectral analysis**: drawing the equalizer bars so you can see which pitches — which **frequencies** — carry the energy, and track each one back to the machine that made it.

This lesson covers the first half of `scipy.signal`: `butter` to design a filter, `lfilter` and `filtfilt` to run it, and `welch` to measure a spectrum. The difference between `lfilter` and `filtfilt` is small in code and huge in meaning. One can live inside a flight computer. The other can only ever run on data that has already been recorded. The next lesson covers the other half of the module's signal topic: `bode`, `tf2ss` and `cont2discrete`.

## Samples, rates and frequencies

A digital sensor does not record a smooth curve. It writes down a number at regular ticks, the way a movie is a string of still frames. The number of ticks per second is the **sample rate** $f_s$ (read "f sub s"), in hertz (Hz, "per second"). An IMU might sample at $f_s = 1000\,\mathrm{Hz}$, one reading every millisecond.

A **frequency** is how many times per second something repeats. A panel that swings back and forth twice a second vibrates at $2\,\mathrm{Hz}$. Control engineers often use **angular frequency** $\omega$ (read "omega") in radians per second instead: $\omega = 2\pi f$, so $2\,\mathrm{Hz}$ is about $12.6\,\mathrm{rad/s}$. SciPy's filter tools take hertz when you pass `fs`, and the next lesson's Bode tools use rad/s. Always check which one a function wants.

Sampling sets a hard ceiling. You cannot see anything faster than half the sample rate, the **[[Nyquist frequency|nyquist]]** $f_s / 2$. At $1000\,\mathrm{Hz}$ that is $500\,\mathrm{Hz}$. A vibration faster than that does not vanish; it shows up disguised as a slower one, which is why sensors have an analog filter in front of the sampler.

## Designing a low-pass filter with butter

A **low-pass filter** lets slow changes through and blocks fast ones, like the treble knob turned down. Two numbers describe it:

- The **cutoff frequency** $f_c$ is where the filter starts to bite. For the filters here it is the frequency where the output amplitude has dropped to $1/\sqrt{2} \approx 0.707$ of the input, which is $-3$ **[[decibels|decibels]]**.
- The **order** $N$ says how steeply it bites past the cutoff. Each extra order adds about $20\,\mathrm{dB}$ more blocking for every tenfold rise in frequency.

A **[[Butterworth|butterworth]]** filter is the most common first choice, because it is as flat as possible below the cutoff: it does not ripple or boost anything you meant to keep. `scipy.signal.butter` designs one:

```python
import numpy as np
from scipy import signal

fs = 1000.0                                  # Hz, accelerometer sample rate
b, a = signal.butter(4, 20.0, btype="low", fs=fs)   # 4th order, 20 Hz cutoff
print(len(b), len(a))

f, H = signal.freqz(b, a, worN=[2.0, 20.0, 100.0], fs=fs)
for fi, h in zip(f, H):
    print(f"{fi:5.0f} Hz: gain {abs(h):.4f} ({20 * np.log10(abs(h)):6.2f} dB)")
# 5 5
#     2 Hz: gain 1.0000 ( -0.00 dB)
#    20 Hz: gain 0.7071 ( -3.01 dB)
#   100 Hz: gain 0.0014 (-57.04 dB)
```

`butter` returns two short lists of numbers, `b` and `a`, called the filter's **coefficients**. `freqz` then reports what the filter does to a steady wave at each frequency. A $2\,\mathrm{Hz}$ motion passes untouched. At the $20\,\mathrm{Hz}$ cutoff the gain is exactly $0.7071$. At $100\,\mathrm{Hz}$, a fivefold rise, only $0.14\%$ gets through.

::: warning Pass fs, or the cutoff means something else
Without `fs=`, SciPy reads the cutoff as a fraction of the Nyquist frequency, a number between $0$ and $1$. Then `butter(4, 20.0)` raises an error, which is lucky; but `butter(4, 0.2)` quietly designs a filter with a cutoff at $0.2 \times 500 = 100\,\mathrm{Hz}$, not $0.2\,\mathrm{Hz}$. Always pass the sample rate and give the cutoff in hertz.
:::

For orders above about $8$, ask for `output="sos"`. It returns the filter as a chain of small second-order sections, which stays accurate where one long `b`, `a` pair can lose digits. You then run it with `sosfilt` or `sosfiltfilt` instead of `lfilter` or `filtfilt`.

## lfilter: the filter a flight computer can run

What do the coefficients mean? A digital filter is a recipe. Each new output mixes the newest input with a few recent inputs and a few recent outputs:

$$
a_0\,y[n] = b_0\,x[n] + b_1\,x[n-1] + \cdots - a_1\,y[n-1] - a_2\,y[n-2] - \cdots
$$

Read $x[n]$ as "x at step n", the newest input sample, and $y[n-1]$ as the output one step ago. This is a **difference equation**. `lfilter(b, a, x)` walks through the data from start to end and applies it at every step.

Look at what the recipe uses: only the present sample and the past. It never peeks at $x[n+1]$. A filter like this is **[[causal|causal]]** — each output depends on nothing that has not happened yet — so a flight computer can run it in real time, one sample per tick.

::: example Running a filter recipe by hand
The simplest smoother keeps $80\%$ of its last output and mixes in $20\%$ of the new input: $y[n] = 0.2\,x[n] + 0.8\,y[n-1]$. In SciPy's form that is `b = [0.2]` and `a = [1, -0.8]` (the $a_1$ term is subtracted, so $-a_1 = +0.8$). Feed it a step: the input jumps from $0$ to $1$ and stays there. Start with $y[-1] = 0$.

**Step 0.** $y[0] = 0.2 \times 1 + 0.8 \times 0 = 0.2$.

**Step 1.** $y[1] = 0.2 \times 1 + 0.8 \times 0.2 = 0.2 + 0.16 = 0.36$.

**Step 2.** $y[2] = 0.2 \times 1 + 0.8 \times 0.36 = 0.2 + 0.288 = 0.488$.

**Check with SciPy.**

```python
import numpy as np
from scipy import signal

y = signal.lfilter([0.2], [1.0, -0.8], np.ones(5))
print(np.round(y, 4))
# [0.2    0.36   0.488  0.5904 0.6723]
```

**Sanity check.** The output creeps toward $1$ and never jumps there. It *lags behind* the input. That lag is the price of smoothing with only the past to go on.
:::

### Every causal filter delays the signal

That creeping is not special to this toy. Any causal low-pass filter delays what it passes. In frequency terms, it adds **[[phase lag|phase-lag]]**: the output wave peaks later than the input wave. You can turn a phase lag of $\phi$ degrees at frequency $f$ into a time delay:

$$
\text{delay} = \frac{\phi}{360°} \times \frac{1}{f}.
$$

The fraction $\phi/360°$ says what part of one cycle the wave slipped, and $1/f$ is the length of one cycle in seconds.

::: example How late is the filtered accelerometer?
Our $4$th-order, $20\,\mathrm{Hz}$ Butterworth filter has a phase of $-14.97°$ at $2\,\mathrm{Hz}$ (ask `freqz` for `np.angle(H)`). How late is a $2\,\mathrm{Hz}$ motion after filtering?

**Use the formula.** One cycle at $2\,\mathrm{Hz}$ lasts $1/2 = 0.5\,\mathrm{s}$. The slip is $14.97/360 \approx 0.0416$ of a cycle. So the delay is $0.0416 \times 0.5\,\mathrm{s} \approx 0.0208\,\mathrm{s}$, about $21\,\mathrm{ms}$.

**Measure it instead.** Filter a clean $2\,\mathrm{Hz}$ sine and see when each version crosses zero on the way up near $t = 2\,\mathrm{s}$:

```python
import numpy as np
from scipy import signal

fs = 1000.0
t = np.arange(0.0, 5.0, 1 / fs)                      # 5 s of samples
clean = np.sin(2 * np.pi * 2.0 * t)                  # 2 Hz motion
b, a = signal.butter(4, 20.0, fs=fs)

def upcross(y):
    """Time the signal crosses zero going up, just after t = 1.9 s."""
    i = np.where((y[:-1] < 0) & (y[1:] >= 0) & (t[:-1] > 1.9))[0][0]
    return t[i] - y[i] / (y[i + 1] - y[i]) / fs      # straight-line fill-in

print(f"input    {upcross(clean):.4f} s")
print(f"lfilter  {upcross(signal.lfilter(b, a, clean)):.4f} s")
print(f"filtfilt {upcross(signal.filtfilt(b, a, clean)):.4f} s")
# input    2.0000 s
# lfilter  2.0208 s
# filtfilt 2.0000 s
```

**Read the answer.** The `lfilter` output is $20.8\,\mathrm{ms}$ late, matching the formula. At $1\,\mathrm{Hz}$ and $5\,\mathrm{Hz}$ the lag in degrees is different ($-7.5°$ and $-37.7°$) but the delay is still about $21\,\mathrm{ms}$: a Butterworth filter acts like a near-constant delay well below its cutoff.

**Sanity check.** Well below its cutoff, an $N$th-order Butterworth filter delays by $\dfrac{1}{2\pi f_c \sin(90°/N)}$. For $N = 4$ and $f_c = 20\,\mathrm{Hz}$ that is $\dfrac{1}{125.7 \times 0.383} \approx 0.0208\,\mathrm{s}$. The same $21\,\mathrm{ms}$ again. A lower cutoff or a higher order means more delay.
:::

Twenty milliseconds sounds tiny. Inside a control loop it is not. The next lesson shows how every millisecond of delay eats into a loop's safety margin, and a filter in the feedback path is one of the most common sources of delay.

## filtfilt: zero delay, but only after the fact

Here is a trick for recorded data. Run the filter forward through the data: every wave comes out late. Now flip the result end to end and run the same filter again. Going backward, the filter delays everything *toward the start* by exactly the same amount. Flip it back, and the two delays cancel. That is `filtfilt`, and the zero-crossing check above showed it: the output crosses at $2.0000\,\mathrm{s}$, right on top of the input.

Three facts follow from running the filter twice:

- **Zero phase.** Every frequency comes out with no delay and no distortion of the waveform's shape.
- **Double the order.** The signal passes through the filter twice, so the gain is squared. A $4$th-order design behaves like an $8$th-order one in how hard it blocks. At the cutoff the gain is $0.707^2 = 0.5$, which is $-6\,\mathrm{dB}$ instead of $-3\,\mathrm{dB}$.
- **Non-causal.** The backward pass starts at the *end* of the record. To compute today's output, it needs samples from the future.

That last fact settles where each one belongs. In **[[post-flight analysis|post-flight]]**, the whole record sits on disk, the future is available, and `filtfilt` is the better tool: clean data with no time shift, so events line up with other channels. Inside a control loop, the future has not happened. There is no amount of computing power that makes `filtfilt` possible in real time.

::: key
`lfilter` is the causal difference equation, with its inherent phase lag. `filtfilt` runs the filter forwards and backwards, giving zero phase distortion and double the order, but it is non-causal: perfectly valid in post-flight analysis, never valid inside a control loop.
:::

::: warning Do not tune a flight filter on filtfilt plots
A common slip: an engineer prototypes a sensor filter in a notebook with `filtfilt`, likes how crisp the plot looks, and ports the same `b`, `a` into the flight code, where it runs as a causal filter. The flight version now has $20\,\mathrm{ms}$ of delay the notebook never showed, and half the blocking at the cutoff. When a filter is meant for flight, evaluate it in the notebook with `lfilter` (or `sosfilt`), exactly as it will run.
:::

Two smaller points about `filtfilt`. It pads the ends of the record before filtering, to soften start-up effects, so the first and last few hundred milliseconds of a short record deserve suspicion. And for high orders, use `sosfiltfilt` with an `output="sos"` design, for the accuracy reason above.

## Power spectral density with welch

Now the equalizer bars. Suppose a test-stand accelerometer shows what looks like pure noise. Is there a vibration hidden in it? The tool for that question is the **power spectral density**, or **PSD**. It tells you how the signal's power — its variance, for a signal with zero average — is spread across frequency.

The units give it away. For acceleration in m/s², the PSD is in $(\mathrm{m/s^2})^2/\mathrm{Hz}$: variance per hertz of bandwidth. The area under the PSD curve equals the total variance of the signal. A sharp peak means a lot of power packed into a narrow band — a tone, usually from something spinning or ringing.

### Why a raw FFT is not enough

The obvious approach is one big Fourier transform of the whole record, squared and scaled. That estimate is called a **[[periodogram|periodogram]]**. It has a nasty property: for noisy data, each bin is wildly uncertain, and a longer record does not help. More data only buys more bins, each as noisy as before.

```python
import numpy as np
from scipy import signal

fs = 1000.0
rng = np.random.default_rng(0)
for seconds in (10.0, 100.0):
    x = rng.standard_normal(int(seconds * fs))       # white noise, variance 1
    f, P = signal.periodogram(x, fs=fs)
    band = (f > 10) & (f < 400)
    print(f"{seconds:5.0f} s: {band.sum():6d} bins, spread/mean = {P[band].std() / P[band].mean():.2f}")
#    10 s:   3899 bins, spread/mean = 1.00
#   100 s:  38999 bins, spread/mean = 1.00
```

For this noise the true PSD is flat, at variance divided by the Nyquist band, $1 / 500 = 0.002$ per Hz. Yet each bin of the raw estimate scatters by $100\%$ of that value, whether you record for $10$ seconds or $100$. Ten times the data, ten times the bins, same scatter in every one.

### Welch's method: chop, window, average

Welch's fix is the same trick you use to get a steady reading from a jittery bathroom scale: step on it several times and average. It works in three steps.

1. **Chop** the record into segments of `nperseg` samples, usually overlapping by half.
2. **Window** each segment: taper its ends smoothly to zero with a **[[window function|window]]**, so the chopped edges do not create false frequencies.
3. **Average** the periodograms of all the segments.

Averaging $K$ independent estimates shrinks the scatter by about $1/\sqrt{K}$. The cost is resolution: the frequency bins are now spaced $f_s / \texttt{nperseg}$ apart instead of $1 / (\text{record length})$. Shorter segments mean more of them to average and a smoother curve, but blurrier frequencies. That is the **trade-off** you tune with `nperseg`.

```python
import numpy as np
from scipy import signal

fs = 1000.0
rng = np.random.default_rng(0)
x = rng.standard_normal(100_000)                     # 100 s of white noise
for nperseg in (1024, 4096):
    f, P = signal.welch(x, fs=fs, nperseg=nperseg)
    band = (f > 10) & (f < 400)
    print(f"nperseg {nperseg}: bins {f[1]:.3f} Hz apart, spread/mean = {P[band].std() / P[band].mean():.3f}")
# nperseg 1024: bins 0.977 Hz apart, spread/mean = 0.081
# nperseg 4096: bins 0.244 Hz apart, spread/mean = 0.155
```

With $1024$-sample segments and half overlap, $100\,\mathrm{s}$ of data gives about $190$ segments. The scatter drops from $100\%$ to about $8\%$, a little above $1/\sqrt{190} \approx 0.073$ because overlapping segments are not fully independent. Quadruple the segment length and the bins are four times finer, but there are a quarter as many segments, so the scatter roughly doubles.

::: key
Welch's method estimates the power spectral density by averaging windowed, overlapping periodograms, trading frequency resolution for variance reduction. A single raw FFT of noisy data has about 100 percent variance in every bin, no matter how long the record.
:::

::: example Finding a pump tone buried in noise
A test-stand accelerometer samples at $1000\,\mathrm{Hz}$ for one minute. Its broadband noise has a standard deviation of $0.5\,\mathrm{m/s^2}$. A nearby pump motor spins at $2250$ revolutions per minute. Does its vibration show up?

**Predict the frequency.** $2250\,\mathrm{rev/min} \div 60\,\mathrm{s/min} = 37.5$ revolutions per second, so look near $37.5\,\mathrm{Hz}$.

**Predict the noise floor.** White noise with variance $0.5^2 = 0.25$ spread over $0$ to $500\,\mathrm{Hz}$ gives $0.25 / 500 = 5 \times 10^{-4}\,(\mathrm{m/s^2})^2/\mathrm{Hz}$.

**Compute the PSD.** The simulated data below hide a $0.1\,\mathrm{m/s^2}$ tone — one fifth of the noise's spread, invisible in a time plot.

```python
import numpy as np
from scipy import signal

fs = 1000.0
t = np.arange(0.0, 60.0, 1 / fs)                     # one minute
rng = np.random.default_rng(11)
accel = 0.5 * rng.standard_normal(t.size)            # noise, m/s^2
accel += 0.1 * np.sin(2 * np.pi * 37.5 * t)          # the pump's tone

f, P = signal.welch(accel, fs=fs, nperseg=4096)
k = np.argmax(P)
floor = np.median(P)
print(f"floor {floor:.2e} (m/s^2)^2/Hz")
print(f"peak at {f[k]:.2f} Hz, {P[k] / floor:.0f} times the floor")
print(f"area {np.trapezoid(P, f):.3f}, variance {np.var(accel):.3f}")
# floor 4.95e-04 (m/s^2)^2/Hz
# peak at 37.60 Hz, 23 times the floor
# area 0.255, variance 0.255
```

**Read the answer.** The floor matches the prediction, $5 \times 10^{-4}$. A peak stands $23$ times above it at $37.60\,\mathrm{Hz}$. Why not exactly $37.5$? The bins are $1000/4096 \approx 0.244\,\mathrm{Hz}$ apart, and the nearest bin to $37.5$ is number $154$, at $154 \times 0.244 \approx 37.60\,\mathrm{Hz}$. The peak is as close as the resolution allows.

**Sanity check.** The area under the PSD equals the variance, $0.255$: the noise's $0.25$ plus the tone's $0.1^2/2 = 0.005$. The books balance.
:::

### Reading a spectrum like a detective

A PSD becomes useful when you ask of every peak: *who made this?* Two kinds of suspects cover most cases.

- **Drivers.** Anything that spins or pulses: pumps, fans, cryocoolers, turbopumps, reaction wheels, electrical supplies. A driver puts a tone at its running rate, often with **harmonics** at two, three or more times that rate. If a peak moves when the machine's speed changes, and matches that speed in telemetry, you have found your driver.
- **Resonances.** The vehicle's own structural modes, like the ringing solar panel of the last lesson. Broadband noise shakes them, and they show up as wider humps at fixed frequencies that do not move with any machine.

The dangerous case is when the two meet. A driver running at a structure's natural frequency pumps energy into it every cycle, like pushing a swing in time. On a space telescope the result is **[[jitter|jitter]]**: a fine wobble in pointing that blurs the image. The fixes are to move the driver's speed away from the mode, isolate it mechanically, or add a **[[notch filter|notch-filter]]** that removes that narrow band from the control loop's view.

::: warning Welch mistakes that fool people
- **Too-short segments** blur two nearby peaks into one. If two tones are $0.5\,\mathrm{Hz}$ apart, you need bins finer than that: `nperseg` of at least $f_s / 0.5$.
- **Forgetting `fs`** makes the frequency axis read in cycles per sample, from $0$ to $0.5$, and the PSD units come out wrong too.
- **Mixed units.** Vibration specs often quote $g^2/\mathrm{Hz}$. One $g$ is $9.80665\,\mathrm{m/s^2}$, so convert PSDs with the *square*, $9.80665^2 \approx 96.2$, not $9.81$.
:::

## Check yourself

::: check
You filter a recorded engine-test pressure trace with a $2$nd-order Butterworth low-pass at $50\,\mathrm{Hz}$, using `filtfilt`. What is the gain at $50\,\mathrm{Hz}$ in the filtered data, in plain numbers and in decibels?
:::

::: answer
One pass of a Butterworth filter has gain $1/\sqrt{2} \approx 0.707$ at its cutoff, which is $-3\,\mathrm{dB}$. `filtfilt` passes the data through twice, so the gain is squared: $0.707^2 = 0.5$. In decibels, $20\log_{10}(0.5) \approx -6.0\,\mathrm{dB}$. The effective order is also doubled, to $4$.
:::

::: check
Write out the first three outputs of the filter `b = [0.5]`, `a = [1, -0.5]` for the input $x = [2, 0, 0, \ldots]$ (a single spike), starting from rest.
:::

::: answer
The recipe is $y[n] = 0.5\,x[n] + 0.5\,y[n-1]$. Step 0: $y[0] = 0.5 \times 2 + 0 = 1$. Step 1: $y[1] = 0.5 \times 0 + 0.5 \times 1 = 0.5$. Step 2: $y[2] = 0 + 0.5 \times 0.5 = 0.25$. The spike becomes a tail that halves each step. It never uses a future sample, so it is causal.
:::

::: check
A filter has $-9°$ of phase at $5\,\mathrm{Hz}$. How much does it delay a $5\,\mathrm{Hz}$ signal, in milliseconds?
:::

::: answer
One cycle at $5\,\mathrm{Hz}$ is $1/5 = 0.2\,\mathrm{s}$. The slip is $9/360 = 0.025$ of a cycle. The delay is $0.025 \times 0.2 = 0.005\,\mathrm{s}$, or $5\,\mathrm{ms}$.
:::

::: check
You have $20\,\mathrm{s}$ of gyro data at $f_s = 400\,\mathrm{Hz}$ and call `welch` with `nperseg=800`. How far apart are the frequency bins, and roughly how many segments are averaged if they overlap by half?
:::

::: answer
The bins are $f_s / \texttt{nperseg} = 400 / 800 = 0.5\,\mathrm{Hz}$ apart. The record has $20 \times 400 = 8000$ samples. With half overlap, a new segment starts every $400$ samples, so there are $(8000 - 800)/400 + 1 = 19$ segments. The scatter per bin is then roughly $1/\sqrt{19} \approx 23\%$ (a bit more, since overlapping segments are not fully independent).
:::

::: check
A colleague says, "My raw FFT PSD is too noisy. I'll record ten times longer and it will smooth out." Will it? What should they do instead?
:::

::: answer
No. A longer record gives finer frequency bins, but each bin of a raw periodogram still scatters by about $100\%$. The fix is to average: use `welch`, with `nperseg` chosen so the bins are only as fine as needed for the peaks of interest. Then the extra data turns into more segments and less scatter.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Sample rate $f_s$ | Readings per second | Nyquist limit $f_s / 2$ |
| `butter(N, fc, fs=fs)` | Butterworth design, returns `b`, `a` | Gain $0.707$ ($-3\,\mathrm{dB}$) at $f_c$ |
| Difference equation | What `lfilter` runs | $a_0 y[n] = \sum b_i x[n-i] - \sum_{i \ge 1} a_i y[n-i]$ |
| Phase to delay | Lag in time | delay $= (\phi / 360°)(1/f)$ |
| `lfilter` | Causal, has phase lag | Can run in flight |
| `filtfilt` | Forward and backward | Zero phase, double order, $-6\,\mathrm{dB}$ at $f_c$, non-causal |
| PSD | Variance per hertz | Area under it = variance |
| Raw periodogram | One FFT | About $100\%$ scatter per bin, whatever the length |
| `welch(x, fs, nperseg)` | Averaged, windowed segments | Bins $f_s/\texttt{nperseg}$ apart, scatter $\approx 1/\sqrt{K}$ |

The next lesson takes the idea of delay into the control loop: transfer functions and Bode plots with `bode`, state-space models with `tf2ss`, and what `cont2discrete` does when a continuous design must run on a computer that samples.

::: context nyquist Why half the sample rate is the limit
To tell that something is going up and down, you need at least two samples per cycle: one near a top and one near a bottom. Sample any slower and a fast wave looks exactly like a slow one — the wagon wheel in an old film that seems to spin backward. That disguise is **aliasing**. Below, a $9\,\mathrm{Hz}$ wave sampled at $10\,\mathrm{Hz}$ gives the same dots as a $1\,\mathrm{Hz}$ wave.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="20.0,30.0 20.9,30.4 21.8,31.5 22.7,33.3 23.6,35.7 24.4,38.8 25.3,42.4 26.2,46.4 27.1,50.7 28.0,55.3 28.9,60.0 29.8,64.7 30.7,69.3 31.6,73.6 32.4,77.6 33.3,81.2 34.2,84.3 35.1,86.7 36.0,88.5 36.9,89.6 37.8,90.0 38.7,89.6 39.6,88.5 40.4,86.7 41.3,84.3 42.2,81.2 43.1,77.6 44.0,73.6 44.9,69.3 45.8,64.7 46.7,60.0 47.6,55.3 48.4,50.7 49.3,46.4 50.2,42.4 51.1,38.8 52.0,35.7 52.9,33.3 53.8,31.5 54.7,30.4 55.6,30.0 56.4,30.4 57.3,31.5 58.2,33.3 59.1,35.7 60.0,38.8 60.9,42.4 61.8,46.4 62.7,50.7 63.6,55.3 64.4,60.0 65.3,64.7 66.2,69.3 67.1,73.6 68.0,77.6 68.9,81.2 69.8,84.3 70.7,86.7 71.6,88.5 72.4,89.6 73.3,90.0 74.2,89.6 75.1,88.5 76.0,86.7 76.9,84.3 77.8,81.2 78.7,77.6 79.6,73.6 80.4,69.3 81.3,64.7 82.2,60.0 83.1,55.3 84.0,50.7 84.9,46.4 85.8,42.4 86.7,38.8 87.6,35.7 88.4,33.3 89.3,31.5 90.2,30.4 91.1,30.0 92.0,30.4 92.9,31.5 93.8,33.3 94.7,35.7 95.6,38.8 96.4,42.4 97.3,46.4 98.2,50.7 99.1,55.3 100.0,60.0 100.9,64.7 101.8,69.3 102.7,73.6 103.6,77.6 104.4,81.2 105.3,84.3 106.2,86.7 107.1,88.5 108.0,89.6 108.9,90.0 109.8,89.6 110.7,88.5 111.6,86.7 112.4,84.3 113.3,81.2 114.2,77.6 115.1,73.6 116.0,69.3 116.9,64.7 117.8,60.0 118.7,55.3 119.6,50.7 120.4,46.4 121.3,42.4 122.2,38.8 123.1,35.7 124.0,33.3 124.9,31.5 125.8,30.4 126.7,30.0 127.6,30.4 128.4,31.5 129.3,33.3 130.2,35.7 131.1,38.8 132.0,42.4 132.9,46.4 133.8,50.7 134.7,55.3 135.6,60.0 136.4,64.7 137.3,69.3 138.2,73.6 139.1,77.6 140.0,81.2 140.9,84.3 141.8,86.7 142.7,88.5 143.6,89.6 144.4,90.0 145.3,89.6 146.2,88.5 147.1,86.7 148.0,84.3 148.9,81.2 149.8,77.6 150.7,73.6 151.6,69.3 152.4,64.7 153.3,60.0 154.2,55.3 155.1,50.7 156.0,46.4 156.9,42.4 157.8,38.8 158.7,35.7 159.6,33.3 160.4,31.5 161.3,30.4 162.2,30.0 163.1,30.4 164.0,31.5 164.9,33.3 165.8,35.7 166.7,38.8 167.6,42.4 168.4,46.4 169.3,50.7 170.2,55.3 171.1,60.0 172.0,64.7 172.9,69.3 173.8,73.6 174.7,77.6 175.6,81.2 176.4,84.3 177.3,86.7 178.2,88.5 179.1,89.6 180.0,90.0 180.9,89.6 181.8,88.5 182.7,86.7 183.6,84.3 184.4,81.2 185.3,77.6 186.2,73.6 187.1,69.3 188.0,64.7 188.9,60.0 189.8,55.3 190.7,50.7 191.6,46.4 192.4,42.4 193.3,38.8 194.2,35.7 195.1,33.3 196.0,31.5 196.9,30.4 197.8,30.0 198.7,30.4 199.6,31.5 200.4,33.3 201.3,35.7 202.2,38.8 203.1,42.4 204.0,46.4 204.9,50.7 205.8,55.3 206.7,60.0 207.6,64.7 208.4,69.3 209.3,73.6 210.2,77.6 211.1,81.2 212.0,84.3 212.9,86.7 213.8,88.5 214.7,89.6 215.6,90.0 216.4,89.6 217.3,88.5 218.2,86.7 219.1,84.3 220.0,81.2 220.9,77.6 221.8,73.6 222.7,69.3 223.6,64.7 224.4,60.0 225.3,55.3 226.2,50.7 227.1,46.4 228.0,42.4 228.9,38.8 229.8,35.7 230.7,33.3 231.6,31.5 232.4,30.4 233.3,30.0 234.2,30.4 235.1,31.5 236.0,33.3 236.9,35.7 237.8,38.8 238.7,42.4 239.6,46.4 240.4,50.7 241.3,55.3 242.2,60.0 243.1,64.7 244.0,69.3 244.9,73.6 245.8,77.6 246.7,81.2 247.6,84.3 248.4,86.7 249.3,88.5 250.2,89.6 251.1,90.0 252.0,89.6 252.9,88.5 253.8,86.7 254.7,84.3 255.6,81.2 256.4,77.6 257.3,73.6 258.2,69.3 259.1,64.7 260.0,60.0 260.9,55.3 261.8,50.7 262.7,46.4 263.6,42.4 264.4,38.8 265.3,35.7 266.2,33.3 267.1,31.5 268.0,30.4 268.9,30.0 269.8,30.4 270.7,31.5 271.6,33.3 272.4,35.7 273.3,38.8 274.2,42.4 275.1,46.4 276.0,50.7 276.9,55.3 277.8,60.0 278.7,64.7 279.6,69.3 280.4,73.6 281.3,77.6 282.2,81.2 283.1,84.3 284.0,86.7 284.9,88.5 285.8,89.6 286.7,90.0 287.6,89.6 288.4,88.5 289.3,86.7 290.2,84.3 291.1,81.2 292.0,77.6 292.9,73.6 293.8,69.3 294.7,64.7 295.6,60.0 296.4,55.3 297.3,50.7 298.2,46.4 299.1,42.4 300.0,38.8 300.9,35.7 301.8,33.3 302.7,31.5 303.6,30.4 304.4,30.0 305.3,30.4 306.2,31.5 307.1,33.3 308.0,35.7 308.9,38.8 309.8,42.4 310.7,46.4 311.6,50.7 312.4,55.3 313.3,60.0 314.2,64.7 315.1,69.3 316.0,73.6 316.9,77.6 317.8,81.2 318.7,84.3 319.6,86.7 320.4,88.5 321.3,89.6 322.2,90.0 323.1,89.6 324.0,88.5 324.9,86.7 325.8,84.3 326.7,81.2 327.6,77.6 328.4,73.6 329.3,69.3 330.2,64.7 331.1,60.0 332.0,55.3 332.9,50.7 333.8,46.4 334.7,42.4 335.6,38.8 336.4,35.7 337.3,33.3 338.2,31.5 339.1,30.4 340.0,30.0" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <polyline points="20.0,30.0 20.9,30.0 21.8,30.0 22.7,30.0 23.6,30.1 24.4,30.1 25.3,30.2 26.2,30.2 27.1,30.3 28.0,30.4 28.9,30.5 29.8,30.6 30.7,30.7 31.6,30.8 32.4,30.9 33.3,31.0 34.2,31.2 35.1,31.3 36.0,31.5 36.9,31.6 37.8,31.8 38.7,32.0 39.6,32.2 40.4,32.4 41.3,32.6 42.2,32.8 43.1,33.0 44.0,33.3 44.9,33.5 45.8,33.8 46.7,34.0 47.6,34.3 48.4,34.6 49.3,34.8 50.2,35.1 51.1,35.4 52.0,35.7 52.9,36.0 53.8,36.4 54.7,36.7 55.6,37.0 56.4,37.4 57.3,37.7 58.2,38.1 59.1,38.4 60.0,38.8 60.9,39.2 61.8,39.5 62.7,39.9 63.6,40.3 64.4,40.7 65.3,41.1 66.2,41.5 67.1,41.9 68.0,42.4 68.9,42.8 69.8,43.2 70.7,43.7 71.6,44.1 72.4,44.5 73.3,45.0 74.2,45.5 75.1,45.9 76.0,46.4 76.9,46.8 77.8,47.3 78.7,47.8 79.6,48.3 80.4,48.8 81.3,49.2 82.2,49.7 83.1,50.2 84.0,50.7 84.9,51.2 85.8,51.7 86.7,52.2 87.6,52.7 88.4,53.3 89.3,53.8 90.2,54.3 91.1,54.8 92.0,55.3 92.9,55.8 93.8,56.3 94.7,56.9 95.6,57.4 96.4,57.9 97.3,58.4 98.2,59.0 99.1,59.5 100.0,60.0 100.9,60.5 101.8,61.0 102.7,61.6 103.6,62.1 104.4,62.6 105.3,63.1 106.2,63.7 107.1,64.2 108.0,64.7 108.9,65.2 109.8,65.7 110.7,66.2 111.6,66.7 112.4,67.3 113.3,67.8 114.2,68.3 115.1,68.8 116.0,69.3 116.9,69.8 117.8,70.3 118.7,70.8 119.6,71.2 120.4,71.7 121.3,72.2 122.2,72.7 123.1,73.2 124.0,73.6 124.9,74.1 125.8,74.5 126.7,75.0 127.6,75.5 128.4,75.9 129.3,76.3 130.2,76.8 131.1,77.2 132.0,77.6 132.9,78.1 133.8,78.5 134.7,78.9 135.6,79.3 136.4,79.7 137.3,80.1 138.2,80.5 139.1,80.8 140.0,81.2 140.9,81.6 141.8,81.9 142.7,82.3 143.6,82.6 144.4,83.0 145.3,83.3 146.2,83.6 147.1,84.0 148.0,84.3 148.9,84.6 149.8,84.9 150.7,85.2 151.6,85.4 152.4,85.7 153.3,86.0 154.2,86.2 155.1,86.5 156.0,86.7 156.9,87.0 157.8,87.2 158.7,87.4 159.6,87.6 160.4,87.8 161.3,88.0 162.2,88.2 163.1,88.4 164.0,88.5 164.9,88.7 165.8,88.8 166.7,89.0 167.6,89.1 168.4,89.2 169.3,89.3 170.2,89.4 171.1,89.5 172.0,89.6 172.9,89.7 173.8,89.8 174.7,89.8 175.6,89.9 176.4,89.9 177.3,90.0 178.2,90.0 179.1,90.0 180.0,90.0 180.9,90.0 181.8,90.0 182.7,90.0 183.6,89.9 184.4,89.9 185.3,89.8 186.2,89.8 187.1,89.7 188.0,89.6 188.9,89.5 189.8,89.4 190.7,89.3 191.6,89.2 192.4,89.1 193.3,89.0 194.2,88.8 195.1,88.7 196.0,88.5 196.9,88.4 197.8,88.2 198.7,88.0 199.6,87.8 200.4,87.6 201.3,87.4 202.2,87.2 203.1,87.0 204.0,86.7 204.9,86.5 205.8,86.2 206.7,86.0 207.6,85.7 208.4,85.4 209.3,85.2 210.2,84.9 211.1,84.6 212.0,84.3 212.9,84.0 213.8,83.6 214.7,83.3 215.6,83.0 216.4,82.6 217.3,82.3 218.2,81.9 219.1,81.6 220.0,81.2 220.9,80.8 221.8,80.5 222.7,80.1 223.6,79.7 224.4,79.3 225.3,78.9 226.2,78.5 227.1,78.1 228.0,77.6 228.9,77.2 229.8,76.8 230.7,76.3 231.6,75.9 232.4,75.5 233.3,75.0 234.2,74.5 235.1,74.1 236.0,73.6 236.9,73.2 237.8,72.7 238.7,72.2 239.6,71.7 240.4,71.2 241.3,70.8 242.2,70.3 243.1,69.8 244.0,69.3 244.9,68.8 245.8,68.3 246.7,67.8 247.6,67.3 248.4,66.7 249.3,66.2 250.2,65.7 251.1,65.2 252.0,64.7 252.9,64.2 253.8,63.7 254.7,63.1 255.6,62.6 256.4,62.1 257.3,61.6 258.2,61.0 259.1,60.5 260.0,60.0 260.9,59.5 261.8,59.0 262.7,58.4 263.6,57.9 264.4,57.4 265.3,56.9 266.2,56.3 267.1,55.8 268.0,55.3 268.9,54.8 269.8,54.3 270.7,53.8 271.6,53.3 272.4,52.7 273.3,52.2 274.2,51.7 275.1,51.2 276.0,50.7 276.9,50.2 277.8,49.7 278.7,49.2 279.6,48.8 280.4,48.3 281.3,47.8 282.2,47.3 283.1,46.8 284.0,46.4 284.9,45.9 285.8,45.5 286.7,45.0 287.6,44.5 288.4,44.1 289.3,43.7 290.2,43.2 291.1,42.8 292.0,42.4 292.9,41.9 293.8,41.5 294.7,41.1 295.6,40.7 296.4,40.3 297.3,39.9 298.2,39.5 299.1,39.2 300.0,38.8 300.9,38.4 301.8,38.1 302.7,37.7 303.6,37.4 304.4,37.0 305.3,36.7 306.2,36.4 307.1,36.0 308.0,35.7 308.9,35.4 309.8,35.1 310.7,34.8 311.6,34.6 312.4,34.3 313.3,34.0 314.2,33.8 315.1,33.5 316.0,33.3 316.9,33.0 317.8,32.8 318.7,32.6 319.6,32.4 320.4,32.2 321.3,32.0 322.2,31.8 323.1,31.6 324.0,31.5 324.9,31.3 325.8,31.2 326.7,31.0 327.6,30.9 328.4,30.8 329.3,30.7 330.2,30.6 331.1,30.5 332.0,30.4 332.9,30.3 333.8,30.2 334.7,30.2 335.6,30.1 336.4,30.1 337.3,30.0 338.2,30.0 339.1,30.0 340.0,30.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="20" cy="30.0" r="4" fill="#1f2a44"/>
  <circle cx="52" cy="35.7" r="4" fill="#1f2a44"/>
  <circle cx="84" cy="50.7" r="4" fill="#1f2a44"/>
  <circle cx="116" cy="69.3" r="4" fill="#1f2a44"/>
  <circle cx="148" cy="84.3" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="90.0" r="4" fill="#1f2a44"/>
  <circle cx="212" cy="84.3" r="4" fill="#1f2a44"/>
  <circle cx="244" cy="69.3" r="4" fill="#1f2a44"/>
  <circle cx="276" cy="50.7" r="4" fill="#1f2a44"/>
  <circle cx="308" cy="35.7" r="4" fill="#1f2a44"/>
  <circle cx="340" cy="30.0" r="4" fill="#1f2a44"/>
  <text x="20" y="122" font-size="12" fill="#1d6fd1">9 Hz, real</text>
  <text x="200" y="122" font-size="12" fill="#b4232c">1 Hz, what the samples say</text>
</svg>
```
:::

::: context decibels A ruler for ratios
A decibel measures a ratio on a logarithmic scale. For an amplitude ratio $g$, the value in decibels is $20\log_{10} g$. So $0\,\mathrm{dB}$ is "unchanged", $-20\,\mathrm{dB}$ is one tenth, $-40\,\mathrm{dB}$ is one hundredth, and $-3\,\mathrm{dB}$ is $0.707$, which halves the *power* (power goes as amplitude squared). Engineers like decibels because gains in a chain multiply, and their decibels add.
:::

::: context butterworth Flat where it matters
The British engineer Stephen Butterworth described this design in 1930, in a paper on filter amplifiers. His aim was a response as flat as possible across the band you keep, with no bumps, and then a smooth roll-off. Other classic families trade that flatness for a steeper edge: Chebyshev filters allow ripple for a sharper cutoff, and elliptic filters allow ripple on both sides for the sharpest cutoff of all. `scipy.signal` designs all of them, as `cheby1`, `cheby2` and `ellip`.
:::

::: context causal Cause before effect
A causal system's output at any moment depends only on inputs up to that moment. Every real-time system is causal, because it cannot read the future. Offline processing does not have that limit: once the data are recorded, "the future" of sample $500$ is sample $501$, sitting right there in the array.
:::

::: context phase-lag What a phase lag looks like
Two waves of the same frequency, one shifted later. The filtered wave (red) reaches each peak a little after the input (blue). The shift, as a fraction of one full cycle, is the phase lag divided by $360°$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,70 C45,10 95,10 120,70 C145,130 195,130 220,70 C245,10 295,10 320,70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M45,70 C70,10 120,10 145,70 C170,130 220,130 245,70 C270,10 320,10 345,70" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="70" y1="25" x2="95" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="95,25 88,21 88,29" fill="#1f2a44"/>
  <text x="82" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">delay</text>
  <text x="120" y="132" font-size="12" text-anchor="middle" fill="#1d6fd1">input</text>
  <text x="250" y="132" font-size="12" text-anchor="middle" fill="#b4232c">filtered, lagging</text>
</svg>
```

Here the red wave is shifted by a quarter of a half-cycle, one eighth of a cycle: a $45°$ lag.
:::

::: context post-flight Where filtfilt earns its keep
After a flight or a static fire, engineers pull terabytes of telemetry and line up events across hundreds of channels: when a valve opened, when chamber pressure rose, when a strain gauge spiked. A causal filter would shift each channel by its own delay and scramble that timeline. Zero-phase filtering keeps every event where it happened, which is why it is the default in analysis tools.
:::

::: context periodogram The raw estimate
A periodogram is the squared size of a signal's discrete Fourier transform, scaled so its area equals the variance. For noise, each bin behaves like a random number drawn from an exponential-shaped distribution, whose spread equals its mean. That is the $100\%$ scatter. Arthur Schuster introduced the idea in 1898 while hunting for hidden periods in weather and earthquake records.
:::

::: context window Tapering the edges
Chopping a signal into segments creates sudden jumps at the cut points, and a jump contains every frequency. A window multiplies each segment by a curve that rises smoothly from zero and falls back to zero, so the cut is invisible. `welch` uses the Hann window by default, a single hump shaped like one cycle of a cosine lifted above zero. Half overlap wins back most of the data the tapered ends would otherwise waste.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,90 C60,90 60,30 100,30 C140,30 140,90 180,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M100,90 C140,90 140,30 180,30 C220,30 220,90 260,90" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M180,90 C220,90 220,30 260,30 C300,30 300,90 340,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="100" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">segment 1</text>
  <text x="180" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">segment 2</text>
  <text x="260" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">segment 3</text>
</svg>
```
:::

::: context jitter A wobble you cannot see, until you can
Jitter is small, fast pointing motion, often measured in thousandths of an arcsecond for a space telescope. It rarely comes from the attitude controller itself; it comes from spinning machinery shaking the structure. Spacecraft makers test every wheel and cooler for the vibrations it emits and map the structure's modes, then keep the two apart.
:::

::: context notch-filter A filter with a narrow bite
A notch filter passes everything except a thin band around one frequency, where it cuts deeply. Flight control loops use notches to stop the controller from reacting to, and feeding energy into, a known structural mode. The next lesson turns one into a discrete filter and shows how the conversion method can move the notch off target.
:::
