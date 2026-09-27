---
id: l03-plot-types
title: Lines, steps, stems, error bars and sigma bands
minutes: 25
covers:
  - Line, scatter, step, stem, errorbar, fill_between for sigma envelopes
---

Think of a hurricane forecast on the evening news. There is a line for the most likely path of the storm's center, and around it a shaded **[[cone|forecast-cone]]** that widens with every day into the future. Nobody reads the line as a promise. The shading is the honest part: it says "we are not sure, and here is how unsure." One picture shows the best guess and the spread at the same time.

GNC engineers draw that picture all the time. A **Monte Carlo** simulation flies the same rocket hundreds of times, each with slightly different winds, engine thrust, sensor errors and mass. The result is not one trajectory but a bundle of them. The figure that goes in front of a review is a mean line with a shaded band around it, a few individual runs, and a limit line — and the band is drawn with one matplotlib call, `fill_between`.

The last two lessons built the frame: a Figure, its Axes, and the layout of many panels. This lesson fills the panels. Each kind of data has a mark that tells the truth about it — a line for a smooth signal, dots for unordered points, steps for a command that holds its value, stems for separate samples, bars for measurements with uncertainty, and shaded bands for spread. Pick the wrong mark and the figure says something the data does not.

## Lines with plot

`ax.plot(x, y)` draws a line through the points in the order you give them. That is the right mark for a **time history**: a quantity sampled often enough that joining the dots is a fair guess at what happened in between, like altitude at $100\,\mathrm{Hz}$.

The call takes styling keywords. The ones you will use constantly are:

- `color` — a named color or `"C0"`, `"C1"`, … (the first, second, … colors of the default cycle);
- `linestyle` — `"-"` solid, `"--"` dashed, `":"` dotted, `"-."` dash-dot;
- `linewidth` — in points, $1.5$ by default;
- `marker` — `"o"`, `"s"`, `"^"`, … to draw a symbol at each sample;
- `label` — the text the legend will show.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 10.0, 1001)                 # s
theta_cmd = 2.0 * (t > 1.0)                       # deg, a 2 degree step at t = 1 s
fig, ax = plt.subplots(layout="constrained")
ax.plot(t, theta_cmd, color="C0", linestyle="--", label="commanded")
ax.plot(t, 2.0 * (1 - np.exp(-(t - 1.0).clip(0) / 0.4)),
        color="C1", linestyle="-", linewidth=2.0, label="measured")
ax.set_xlabel("Time (s)")
ax.set_ylabel("Pitch angle (deg)")
ax.legend()
print(len(ax.lines))                              # 2
```

Two lines that must be told apart differ in line style as well as color. That habit keeps a figure readable when it is printed in grey or seen by someone who cannot separate the colors, which a later lesson on color takes further.

## Scatter: points with no order

A line says "these points follow each other." Sometimes they do not. Where 200 simulated boosters touched down on a landing pad has no "next point"; joining them with a line would draw a meaningless scribble. For unordered points, use `ax.scatter(x, y)`.

`scatter` can also vary each point's size (`s=`, area in points squared) and color (`c=`, an array mapped through a color scale), so a landing-footprint plot can color each touchdown by its vertical speed. For a map-like plot where one meter across must look as long as one meter up, add `ax.set_aspect("equal")`.

::: warning A line through unordered points
`ax.plot(x, y)` on scattered data draws zig-zags between points in whatever order the array happens to be in, and the eye reads them as a path. If the points are not a sequence, use `scatter`, or `plot(x, y, "o")` with markers and no line (`"o"` alone means "circle markers, no line").
:::

## Step: a command that holds its value

A flight computer does not change its commands smoothly. A controller running at $10\,\mathrm{Hz}$ computes a gimbal command, sends it, and the actuator holds that value until the next update $0.1\,\mathrm{s}$ later. Between updates the command is flat, then it jumps. That is called a **[[zero-order hold|zero-order-hold]]**: hold the last value, with no slope.

`ax.plot` would join the samples with sloping lines, drawing ramps the command never had. `ax.step` draws the flat-then-jump shape.

::: example What the command really was at 0.15 s
A controller updates its gimbal command every $0.1\,\mathrm{s}$. The first five commands, at $t = 0, 0.1, 0.2, 0.3, 0.4\,\mathrm{s}$, are $0, 1.0, 1.5, 1.2, 0.8$ degrees. What command was the actuator holding at $t = 0.15\,\mathrm{s}$, and what would a plain line plot suggest?

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t_cmd = np.arange(0.0, 0.5, 0.1)                   # s, 10 Hz updates
u_cmd = np.array([0.0, 1.0, 1.5, 1.2, 0.8])        # deg

fig, ax = plt.subplots(layout="constrained")
ax.plot(t_cmd, u_cmd, linestyle=":", label="plot: ramps (wrong)")
st, = ax.step(t_cmd, u_cmd, where="post", label="step: held values")
print(st.get_drawstyle())                          # steps-post

print(np.interp(0.15, t_cmd, u_cmd))               # 1.25
i = np.searchsorted(t_cmd, 0.15, side="right") - 1
print(u_cmd[i])                                    # 1.0
```

**What the line plot shows.** Joining the points means reading between $t = 0.1$ and $0.2$ along a straight ramp from $1.0$ to $1.5$. Halfway along is $1.25$ degrees; `np.interp` does exactly that straight-line reading.

**What really happened.** The command sent at $0.1\,\mathrm{s}$ was $1.0$ degree, and it held until $0.2\,\mathrm{s}$. To find it, look for the last update at or before $0.15\,\mathrm{s}$: `np.searchsorted(..., side="right") - 1` gives the index of that update, and the value there is $1.0$.

So the ramp overstates the command by $0.25$ degrees at that instant — a quarter of the step. On a panel comparing commanded and actual gimbal angle, that fake ramp would make a lagging actuator look better than it was.
:::

The `where` argument says where the jump goes. `"post"` means each value holds *after* its sample time until the next one, which is a zero-order hold and nearly always what you want for commands. `"pre"` holds each value *before* its time, and `"mid"` puts the jump halfway between samples.

::: key
Use `ax.step(t, u, where="post")` for sampled commands and other signals held between updates; `ax.plot` would draw ramps that never existed.
:::

## Stem: separate samples

Some data is a list of separate numbers at separate places, and nothing lives in between. The output of a digital filter at sample $0, 1, 2, \dots$ is one. So are the lines of a spectrum at separate frequencies. For these, `ax.stem(x, y)` draws a vertical stalk from zero up to each value with a dot on top. The stalks say "this is a separate sample", and the empty space between them says "nothing is defined here."

A good use is the **[[impulse response|impulse-response]]** of a digital filter: what comes out when a single $1$ goes in and zeros follow. A simple smoothing filter used on noisy sensor readings, $y_k = \alpha\,y_{k-1} + (1 - \alpha)\,x_k$ (read $y_k$ as "y sub k", the output at sample $k$), has the impulse response

$$
h_n = (1 - \alpha)\,\alpha^n, \qquad n = 0, 1, 2, \dots
$$

```python
alpha = 0.8
n = np.arange(12)
h = (1 - alpha) * alpha**n
print(np.round(h[:4], 3))              # [0.2   0.16  0.128 0.102]
print(round(float(h.sum()), 3))        # 0.931

fig, ax = plt.subplots(layout="constrained")
ax.stem(n, h)
ax.set_xlabel("Sample number n (-)")
ax.set_ylabel("Impulse response h (-)")
```

The first response is $0.2$, and each next one is $0.8$ times the last. The twelve stems add to $0.931$, which is $1 - 0.8^{12}$. The full infinite sum is exactly $1$, which is why this filter passes a constant signal through unchanged.

## Error bars: measurements with uncertainty

A measurement is a number plus a doubt. When you plot measured points, show the doubt too: `ax.errorbar(x, y, yerr=e)` draws each point with a vertical bar reaching from $y - e$ to $y + e$. Use `fmt="o"` for markers without a connecting line and `capsize=3` for small crossbars at the ends. `xerr=` does the same horizontally.

::: example Drag coefficient from repeated wind tunnel runs
A wind tunnel measures the **[[drag coefficient|drag-coefficient]]** $C_D$ of a rocket model three times at each of five Mach numbers. Plot the average with a one-standard-deviation error bar.

```python
mach = np.array([0.6, 0.8, 0.95, 1.1, 1.3])                 # (-)
cd_runs = np.array([[0.31, 0.33, 0.52, 0.61, 0.55],          # run 1
                    [0.30, 0.34, 0.49, 0.63, 0.54],          # run 2
                    [0.32, 0.33, 0.55, 0.60, 0.56]])         # run 3
cd_mean = cd_runs.mean(axis=0)
cd_sd = cd_runs.std(axis=0, ddof=1)
print(np.round(cd_mean, 3))    # [0.31  0.333 0.52  0.613 0.55 ]
print(np.round(cd_sd, 3))      # [0.01  0.006 0.03  0.015 0.01 ]

fig, ax = plt.subplots(layout="constrained")
ax.errorbar(mach, cd_mean, yerr=cd_sd, fmt="o", capsize=3,
            label="mean ± 1σ of 3 runs")
ax.set_xlabel("Mach (-)")
ax.set_ylabel("Drag coefficient C_D (-)")
ax.legend()
```

**Averaging.** The array has one row per run and one column per Mach number, so `axis=0` averages *down* each column. At Mach $0.6$: $(0.31 + 0.30 + 0.32)/3 = 0.31$.

**Spreading.** `std(axis=0, ddof=1)` is the sample standard deviation of each column. At Mach $0.95$ the three readings are $0.52, 0.49, 0.55$. Their mean is $0.52$. The differences from the mean are $0, -0.03, +0.03$. Squared and added: $0 + 0.0009 + 0.0009 = 0.0018$. Divide by $3 - 1 = 2$ to get $0.0009$, and take the square root: $0.03$. That matches the printout.

**Reading the picture.** The bar at Mach $0.95$ is about five times longer than at Mach $0.8$. That is real: flow near Mach $1$ is unsteady, and repeat runs disagree more. The drag peak a little past Mach $1$ is a well-known shape, so the numbers make sense.

Always say in the legend or caption what the bar means — one sigma, two sigma, or min to max. A bar with no stated meaning cannot be read.
:::

The `ddof=1` deserves a word. **ddof** means "delta degrees of freedom": NumPy divides the sum of squared differences by $M - \text{ddof}$, where $M$ is the number of samples. The default `ddof=0` divides by $M$. With `ddof=1` it divides by $M - 1$, which gives the **[[unbiased sample variance|bessel-correction]]** — the estimate that is right on average when the true mean is unknown and you had to use the sample mean instead. With 500 Monte Carlo runs the two differ by only $0.1\%$, but with three wind-tunnel runs the difference is about $22\%$ in the standard deviation ($\sqrt{3/2} \approx 1.22$), and requirements are written for the unbiased one.

## fill_between: bands for spread

`ax.fill_between(x, y1, y2)` shades the region between two curves. That one call is how every dispersion band, requirement corridor and covariance bound in GNC is drawn. Its useful arguments:

- `alpha=0.25` makes the band **[[see-through|alpha-transparency]]**, so lines and grid behind it still show;
- `color=` and `label=` work as for lines, so the band gets a legend entry;
- `where=` takes a True/False array and shades only where it is True, which is how you color only the stretches where a curve exceeds a limit.

Draw the band first and the mean line on top of it, so the line is not tinted by the shading.

::: key
fill_between draws shaded envelopes: dispersion bands, requirement corridors, filter three-sigma covariance bounds around an error. A band plus the mean conveys an ensemble far better than 500 overplotted lines.
:::

### Two ways to draw a dispersion band

Suppose the Monte Carlo runs are stored as an array `runs` with shape $(M, N)$: $M$ runs, each sampled at the same $N$ times. There are two standard bands, and both are computed *across runs* at each time, which means `axis=0`.

**Mean plus and minus three sigma.** Compute the mean $\bar{x}$ (read "x bar") and the sample standard deviation $s$ at each time, and shade from $\bar{x} - 3s$ to $\bar{x} + 3s$. For a **[[Gaussian|gaussian-rule]]** (bell-curve) spread, $68.3\%$ of values fall within one sigma of the mean, $95.4\%$ within two and $99.73\%$ within three. Most requirements are written in these terms: "the angle of attack shall stay below $6$ degrees at three sigma."

**Percentile band.** Sort the runs at each time and read off, for example, the value below which $0.5\%$ of runs fall (the **0.5th percentile**) and the value below which $99.5\%$ fall (the **99.5th percentile**). `np.percentile(runs, [0.5, 99.5], axis=0)` returns both. This band assumes nothing about the shape of the spread. It is only as good as the number of runs, though: with $500$ runs, only $2.5$ runs lie beyond each end, so the outer percentiles are set by a handful of cases.

The two bands are not the same even for a perfect bell curve. For a Gaussian, the 0.5th and 99.5th percentiles sit at $\pm 2.576$ sigma, so they hold $99\%$ of runs, while $\pm 3$ sigma holds $99.73\%$. The percentiles that match three sigma are the 0.135th and 99.865th. When you compare the two bands, expect the percentile band to be a little narrower on healthy, bell-shaped data.

Where they really split apart is when the spread is **skewed** (leaning to one side) or **bounded** — cut off by a hard limit such as an actuator hitting its end stop.

::: example A band that runs past the hardware stop
A gimbal angle is dispersed over $500$ simulated flights. Its mean bulges to about $4$ degrees near $t = 60\,\mathrm{s}$, and the actuator has a hard **[[end stop|saturation]]** at $6$ degrees: no run can ever exceed it. Compare the two bands at $t = 60\,\mathrm{s}$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(42)
M, t = 500, np.linspace(0.0, 100.0, 501)             # 500 runs, s
bump = np.exp(-((t - 60.0) / 15.0) ** 2)
z = rng.normal(size=(M, 1))                          # one draw per run
runs = 4.0 * bump + (0.3 + 0.9 * bump) * z           # deg, shape (500, 501)
runs = runs + rng.normal(0.0, 0.05, size=runs.shape) # a little sensor noise
runs = np.clip(runs, -6.0, 6.0)                      # hardware stop at 6 deg
print(runs.shape)                                    # (500, 501)

mean = runs.mean(axis=0)
sd = runs.std(axis=0, ddof=1)
lo3, hi3 = mean - 3.0 * sd, mean + 3.0 * sd
p005, p995 = np.percentile(runs, [0.5, 99.5], axis=0)

k = np.argmin(np.abs(t - 60.0))
print(round(mean[k], 2), round(sd[k], 2))            # 3.96 1.11
print(round(hi3[k], 2), round(p995[k], 2))           # 7.28 6.0
hit = np.nonzero(runs.max(axis=1) >= 6.0)[0]
print(hit.size)                                      # 24
```

**The statistics at $60\,\mathrm{s}$.** The mean is $3.96$ degrees and the sample standard deviation is $1.11$ degrees.

**The three-sigma top.** $3.96 + 3 \times 1.11 = 7.29$, which the code reports as $7.28$ because it uses the unrounded values. That is more than a degree *past* the end stop — a value no run can reach. The band is drawing a gimbal angle that is physically impossible.

**The percentile top.** $6.0$ degrees, exactly at the stop. It is honest: at that moment $4.6\%$ of the runs are sitting on the stop, so the top half-percent of values is exactly $6.0$.

**How many?** $24$ runs of $500$, about $5\%$, hit the stop at some point. That is a finding in its own right: the actuator saturates in one flight in twenty.

So which band goes in the review? The requirement is written at three sigma, so the three-sigma band belongs there. But the gap between $7.28$ and $6.0$ is the point. The Gaussian assumption fails here because the hardware clips the tail, and the percentile band shows it. Plot both, and say why they differ.
:::

::: key
Three sigma assumes near-Gaussian behaviour and is what most requirements are written in. Percentiles make no distributional assumption and are what you report when the dispersion is skewed or bounded, for example by a saturation. Show both when the difference is large; it is itself a finding.
:::

### Drawing the ensemble

With the band computed, the figure has four layers, drawn back to front:

```python
fig, ax = plt.subplots(layout="constrained")
ax.fill_between(t, lo3, hi3, color="C0", alpha=0.2, label="mean ± 3σ")
ax.plot(t, p995, color="C0", linestyle="--", linewidth=1.0,
        label="0.5 / 99.5 percentile")
ax.plot(t, p005, color="C0", linestyle="--", linewidth=1.0)
for i in rng.choice(M, size=5, replace=False):       # a few sample runs
    ax.plot(t, runs[i], color="grey", linewidth=0.5)
for i in hit:                                        # every run that hit the stop
    ax.plot(t, runs[i], color="C3", linewidth=0.8)
ax.plot(t, mean, color="C0", linewidth=2.0, label="mean")
ax.axhline(6.0, color="black", linestyle=":", label="end stop")
ax.fill_between(t, 6.0, hi3, where=hi3 > 6.0, color="C3", alpha=0.3)
ax.set_xlabel("Time since liftoff (s)")
ax.set_ylabel("Gimbal angle (deg)")
ax.legend(loc="upper left")
print(round(float(t[hi3 > 6.0][0]), 1), round(float(t[hi3 > 6.0][-1]), 1))   # 52.6 67.4
```

The shaded band shows the spread. A few thin grey runs show what a single flight looks like — the band alone cannot tell you whether runs wiggle or glide. Every run that hit the stop is drawn in its own color, because those are the cases the reviewer will ask about. The dotted line is the limit, so nobody has to remember it. The last `fill_between`, with `where=hi3 > 6.0`, tints only the stretch where the three-sigma top runs past the stop: from $52.6$ to $67.4\,\mathrm{s}$.

Compare that with the other choice — all $500$ runs drawn as solid lines. The middle of the bundle turns into one solid blob, every run looks equally important, and the $24$ that matter are buried.

::: warning Mean and sigma across the wrong axis
With `runs` shaped $(M, N)$, the statistics across runs at each time use `axis=0`, giving arrays of length $N$ that line up with `t`. Using `axis=1` averages each run over time instead, giving $M$ numbers that have nothing to do with the time axis. If `fill_between(t, lo3, hi3)` complains that the shapes do not match, this is almost always why.
:::

### Covariance bounds on a filter error

A navigation filter — the part of the flight software that blends sensors into a best estimate of position and velocity — reports not only its estimate but how uncertain it thinks it is, as a **[[covariance|covariance-p]]** matrix $\mathbf{P}$. The square root of a diagonal entry is the filter's own one-sigma for that state: $\sigma = \sqrt{P_{ii}}$.

In simulation you know the truth, so you can plot the actual estimation error with the filter's own $\pm 3\sigma$ as a band around zero. If the filter is **consistent** — honest about its own uncertainty — about $99.7\%$ of the errors fall inside the band.

::: example Is the filter honest?
A simulated filter runs for $10$ minutes at $10\,\mathrm{Hz}$. The true position error has a standard deviation that shrinks from $3.5\,\mathrm{m}$ to about $2.0\,\mathrm{m}$ as the filter settles. Compare two filters: one that reports the true sigma, and one that reports only $0.6$ of it.

```python
rng = np.random.default_rng(7)
t = np.arange(0.0, 600.0, 0.1)                       # s, 6000 samples
sigma_true = 2.0 + 1.5 * np.exp(-t / 120.0)          # m
err = rng.normal(0.0, sigma_true)                    # m, true error

for name, sigma_P in [("honest", sigma_true), ("optimistic", 0.6 * sigma_true)]:
    inside = np.abs(err) <= 3.0 * sigma_P
    print(name, round(inside.mean() * 100, 1))
# honest 99.7
# optimistic 92.7

fig, ax = plt.subplots(layout="constrained")
ax.fill_between(t, -3 * 0.6 * sigma_true, 3 * 0.6 * sigma_true,
                alpha=0.25, label="filter ±3σ")
ax.plot(t, err, linewidth=0.5, label="true error")
ax.set_xlabel("Time (s)")
ax.set_ylabel("Position error (m)")
```

**The honest filter.** $99.7\%$ of the $6000$ errors sit inside its $\pm 3\sigma$ band, as three-sigma promises.

**The optimistic filter.** Its band is $0.6$ as wide, so it reaches only $3 \times 0.6 = 1.8$ true sigmas. A Gaussian keeps $92.8\%$ inside $\pm 1.8$ sigma, and the simulation gives $92.7\%$. About one error in fourteen escapes, where one in 370 should.

On the plot, the difference is plain: the error trace pokes out of the shaded band again and again.
:::

When errors keep escaping, the filter believes it knows the state better than it does. The usual causes are a process-noise or measurement-noise setting that is too small, or an error source — a sensor bias, say — that the filter does not model at all. A filter that is too sure of itself also gives too little weight to new measurements, so the problem tends to grow. The fix is in the tuning or the model, not in the plot.

::: note Why the band should hold 99.7 percent
If the error $e$ is Gaussian with standard deviation $\sigma$, then $e/\sigma$ is a standard bell curve, and the fraction with $|e/\sigma| \le 3$ is $0.9973$. An honest filter's reported $\sigma$ equals the real spread, so its $\pm 3\sigma$ band holds $99.73\%$. If the reported sigma is only a fraction $c$ of the real one, the band covers $\pm 3c$ real sigmas; with $c = 0.6$ that is $\pm 1.8$, holding $92.8\%$. Fewer errors inside than promised means $c < 1$: the reported covariance is too small.
:::

## Check yourself

::: check
Match each dataset to a mark: (a) GPS altitude at $10\,\mathrm{Hz}$ over an ascent; (b) touchdown points of 300 simulated landings; (c) a thruster on/off command updated every $20\,\mathrm{ms}$; (d) the 16 coefficients of a digital filter; (e) thrust from four static fires at each of three throttle settings.
:::

::: answer
(a) `ax.plot`: a densely sampled time history, where joining samples is a fair picture. (b) `ax.scatter`: the points have no order, so a line would invent a path. (c) `ax.step(t, u, where="post")`: the command holds each value until the next update. (d) `ax.stem`: separate numbers at separate indices with nothing in between. (e) `ax.errorbar` with the mean of the four fires and a bar for their sample standard deviation, stating in the legend that it is one sigma.
:::

::: check
`runs` has shape `(1000, 250)`: 1000 Monte Carlo cases, 250 time samples. Write the lines that compute the mean, the three-sigma bounds with the unbiased standard deviation, and the 0.5th and 99.5th percentiles at each time. What shape is each result?
:::

::: answer
```python
mean = runs.mean(axis=0)
sd = runs.std(axis=0, ddof=1)
lo3, hi3 = mean - 3.0 * sd, mean + 3.0 * sd
p005, p995 = np.percentile(runs, [0.5, 99.5], axis=0)
```

Each is shape `(250,)`, one value per time sample, because `axis=0` collapses the 1000 cases. `ddof=1` divides by $M - 1 = 999$ for the unbiased sample variance.
:::

::: check
On perfectly Gaussian data, which is wider: the mean $\pm 3\sigma$ band or the 0.5th to 99.5th percentile band? By how much, in sigmas?
:::

::: answer
The three-sigma band. The 0.5th and 99.5th percentiles of a Gaussian sit at $\pm 2.576\sigma$, so each side of the percentile band is about $0.42\sigma$ inside the three-sigma edge. The three-sigma band holds $99.73\%$ of values, the percentile band $99\%$. The matching percentiles for three sigma are the 0.135th and 99.865th.
:::

::: check
A filter's position error, plotted with its $\pm 3\sigma$ bound over a long run, stays inside the band $99.99\%$ of the time and never gets closer than halfway to the edge. Is that good news?
:::

::: answer
Not entirely. The filter is **pessimistic**: its reported sigma is larger than the real spread, so the band is too wide. It is safe in the sense that the filter will not ignore good measurements, but it wastes information (it weighs new data more than it should and its uncertainty numbers are useless for margins). A consistent filter keeps about $99.7\%$ inside $\pm 3\sigma$, with errors regularly reaching into the outer part of the band.
:::

::: check
A 50 Hz controller's commanded elevon angle is plotted with `ax.plot`, next to the measured angle. The measured curve seems to lag the commanded one by about 10 ms. Why might that lag be partly an artifact of the plot?
:::

::: answer
A sampled command holds each value for the whole $20\,\mathrm{ms}$ interval. Drawn with `plot`, each jump becomes a ramp that starts at the previous sample, so the commanded curve appears to rise earlier and more gently than the real held command, and the gap between command and response is distorted. Drawn with `ax.step(t, u, where="post")`, the command jumps at its true update time, and any remaining lag belongs to the actuator.
:::

## Summary

| Mark | Use it for | Call |
|---|---|---|
| Line | Densely sampled time histories | `ax.plot(t, y, linestyle=..., label=...)` |
| Scatter | Unordered points, footprints | `ax.scatter(x, y, s=..., c=...)` |
| Step | Held commands, zero-order hold | `ax.step(t, u, where="post")` |
| Stem | Separate samples, filter taps | `ax.stem(n, h)` |
| Error bar | Measurements with stated uncertainty | `ax.errorbar(x, y, yerr=e, fmt="o", capsize=3)` |
| Band | Dispersion, corridors, covariance bounds | `ax.fill_between(t, lo, hi, alpha=0.25, where=...)` |
| Three sigma | Gaussian-based band, used in requirements | `mean ± 3 * runs.std(axis=0, ddof=1)` |
| Percentiles | Shape-free band | `np.percentile(runs, [0.5, 99.5], axis=0)` |
| Consistency | Honest filter keeps about 99.7% inside ±3σ | $\sigma = \sqrt{P_{ii}}$ |

The next lesson turns to axes that are not linear: logarithmic scales, and the frequency-response, pole-zero and root-locus plots that control engineers read every day.

::: context forecast-cone What the hurricane cone really means
The cone drawn by the US National Hurricane Center is built from the center's own past forecast errors: its width at each forecast day is set so that the storm's center stayed inside it about two thirds of the time over recent seasons. It is a band from history, not from a formula — much like a percentile band from a Monte Carlo ensemble. A common misreading is that the storm's effects stay inside the cone; the cone is about the center only, and winds and rain reach far beyond it.
:::

::: context zero-order-hold Holding a value until the next one
A zero-order hold keeps each sample constant until the next arrives, so the signal is a staircase. "Zero-order" means it fits a polynomial of degree zero — a flat line — through each interval. A first-order hold would fit sloping lines instead, which is what `ax.plot` implicitly draws.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" points="40,140 100,80 160,50 220,68 280,92"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,140 100,140 100,80 160,80 160,50 220,50 220,68 280,68 280,92 340,92"/>
  <circle cx="40" cy="140" r="3.5" fill="#1d6fd1"/>
  <circle cx="100" cy="80" r="3.5" fill="#1d6fd1"/>
  <circle cx="160" cy="50" r="3.5" fill="#1d6fd1"/>
  <circle cx="220" cy="68" r="3.5" fill="#1d6fd1"/>
  <circle cx="280" cy="92" r="3.5" fill="#1d6fd1"/>
  <line x1="130" y1="80" x2="130" y2="65" stroke="#b4232c" stroke-width="2"/>
  <text x="136" y="30" font-size="11" fill="#b4232c">t = 0.15 s: ramp 1.25, held 1.0</text>
  <text x="40" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="100" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <text x="160" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0.2</text>
  <text x="220" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0.3</text>
  <text x="280" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0.4 s</text>
</svg>
```

The vertical scale is $60$ pixels per degree, so the red tick at $0.15\,\mathrm{s}$ spans the $0.25$-degree gap between the ramp and the held value.
:::

::: context impulse-response A filter's fingerprint
Feed a single $1$ into a filter, followed by zeros, and record what comes out. That output sequence is the impulse response, and it describes the filter completely: the response to any input is a sum of shifted, scaled copies of it. For the smoothing filter here, each output keeps $80\%$ of the last one, so the stems shrink by the same factor every sample — a geometric decay you can read straight off a stem plot.
:::

::: context drag-coefficient A number for how draggy a shape is
The drag coefficient $C_D$ turns the drag force into a pure number: $C_D = D / (q\,S)$, where $D$ is drag, $q$ the dynamic pressure and $S$ a reference area. Because it has no unit, the same $C_D$ applies to a small wind-tunnel model and the full-size vehicle at the same Mach number. For slender rockets it typically climbs steeply as Mach approaches $1$, peaks a little above it, and falls off at higher Mach, which is the shape in the example.
:::

::: context bessel-correction Why divide by M minus 1
The spread is measured around the sample mean, and the sample mean is computed from the same data, so it always sits a little closer to the samples than the true mean does. The squared differences therefore come out slightly too small on average. Dividing by $M - 1$ instead of $M$ exactly cancels that bias for the variance. The fix is called **Bessel's correction**. For $M = 3$ it enlarges the standard deviation by $\sqrt{3/2} \approx 1.22$; for $M = 500$, by only about $0.1\%$.
:::

::: context alpha-transparency Alpha means opacity
In computer graphics, alpha is a color's opacity: $1$ is solid, $0$ is invisible. An alpha of $0.25$ lets three quarters of whatever is behind show through. Bands use a low alpha so the grid, the limit lines and any overlapping band stay visible. Where two see-through bands overlap they get darker, which also makes the overlap itself easy to spot.
:::

::: context gaussian-rule The 68, 95, 99.7 rule
For a bell curve, about $68.3\%$ of values lie within one standard deviation of the mean, $95.4\%$ within two and $99.73\%$ within three. Only about $0.135\%$ lie beyond $+3\sigma$ on the upper side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="280" height="120" fill="#8fb8f0" opacity="0.25"/>
  <rect x="86.7" y="20" width="186.6" height="120" fill="#8fb8f0" opacity="0.35"/>
  <rect x="133.3" y="20" width="93.4" height="120" fill="#8fb8f0" opacity="0.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,139.3 55.6,138.3 71.1,136.1 86.7,131.9 102.2,125.0 117.8,115.3 133.3,103.6 148.9,92.0 164.4,83.2 180.0,80.0 195.6,83.2 211.1,92.0 226.7,103.6 242.2,115.3 257.8,125.0 273.3,131.9 288.9,136.1 304.4,138.3 320.0,139.3"/>
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="133.3" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">−1σ</text>
  <text x="226.7" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">+1σ</text>
  <text x="86.7" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">−2σ</text>
  <text x="273.3" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">+2σ</text>
  <text x="40" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">−3σ</text>
  <text x="320" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">+3σ</text>
  <text x="180" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">68.3%</text>
  <text x="110" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">95.4%</text>
  <text x="62" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">99.7%</text>
</svg>
```

The curve's height is proportional to $e^{-z^2/2}$, where $z$ is the distance from the mean in sigmas; the shaded strips mark one, two and three sigma.
:::

::: context saturation When an actuator runs out of travel
Every actuator has limits. An engine gimbal can tilt only so far before it hits a mechanical stop, and its motor can only move it so fast. When a command asks for more than that, the output **saturates**: it sits at the limit while the command keeps asking. Saturation makes a dispersion lopsided, piling runs up at the limit, which is exactly the kind of spread a Gaussian band describes badly. It also matters for control: while saturated, the controller has lost part of its authority.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2" points="30.0,140 30.0,139.7 39.4,139.3 48.8,138.7 58.1,137.7 67.5,136.0 76.9,133.5 86.2,129.7 95.6,124.5 105.0,117.6 114.4,108.9 123.8,98.8 133.1,87.7 142.5,76.4 151.9,66.0 161.2,57.5 170.6,51.9 180.0,50.0 189.4,51.9 198.8,57.5 208.1,66.0 217.5,76.4 226.9,87.7 236.2,98.8 245.6,108.9 255.0,117.6 255.0,140"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" points="255.0,117.6 264.4,124.5 273.8,129.7 283.1,133.5 292.5,136.0 301.9,137.7 311.2,138.7 320.6,139.3 330.0,139.7"/>
  <rect x="250" y="84" width="10" height="56" fill="#b4232c"/>
  <line x1="255" y1="20" x2="255" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <text x="250" y="32" font-size="11" text-anchor="end" fill="#1f2a44">end stop 6°</text>
  <line x1="303" y1="60" x2="303" y2="140" stroke="#f2b880" stroke-width="2.5" stroke-dasharray="5 3"/>
  <text x="303" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">mean + 3σ</text>
  <text x="180" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">4°</text>
  <text x="255" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">6°</text>
  <text x="303" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">7.3°</text>
  <text x="180" y="174" font-size="11" text-anchor="middle" fill="#6c7a93">red: runs piled on the stop; grey: impossible tail</text>
</svg>
```
:::

::: context covariance-p The filter's own error bars
A Kalman filter carries a covariance matrix $\mathbf{P}$ alongside its estimate. Each diagonal entry is the variance the filter believes for one state, so $\sqrt{P_{ii}}$ is its one-sigma for that state; the off-diagonal entries say how errors in different states move together. Plotting the true error with $\pm 3\sqrt{P_{ii}}$ is the standard first check of a filter in simulation, and the state-estimation modules later in the course turn it into formal consistency tests.
:::
