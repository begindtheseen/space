---
id: l12-decimation-for-plotting
title: Shrinking big data for a plot without losing the spike
minutes: 18
covers:
  - Downsampling for plotting without hiding transients (min/max decimation)
---

Picture a night guard watching a hallway on a camera screen. He is busy, so he glances at the screen for one second every minute. Most of the time that works: the hallway looks the same from one glance to the next. But someone who dashes across the hallway in two seconds, between glances, is never seen. The guard's log says "all quiet", and the log is wrong.

Plotting a huge data file can fail in exactly the same way. A pressure sensor on an engine test stand might record 10,000 samples a second for a 1,000-second firing: ten million numbers. The plot on your screen is only about 800 pixels wide, so the ten million numbers have to be squeezed down to something a picture can hold. That squeezing is called **[[decimation|decimate-word]]** — reducing the number of samples. Done the most direct way, it glances at the data now and then, and a pressure spike lasting 30 milliseconds can slip between the glances and vanish from the figure.

A reviewer looking at a test or flight plot is scanning for exactly those short events. This lesson shows why the simple way loses them, why averaging loses them too, and a method called **min/max decimation** that keeps every one, for the same small number of plotted points.

## More points than pixels

A screen draws a plot as a grid of pixels. Across the plot area there are a fixed number of **[[pixel columns|pixel-column]]**, the one-pixel-wide vertical strips that make up the picture. Every sample whose time falls inside one column's slice of the time axis is drawn somewhere in that one strip. Whatever you do, a column can only show a vertical run of colored pixels, from the lowest point drawn in it to the highest.

You can ask matplotlib how many columns an Axes has. `ax.bbox` is the rectangle the Axes covers on the figure, measured in pixels:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 4), dpi=100)
print(round(ax.bbox.width))       # 775
```

The figure is $10\,\mathrm{in} \times 100\,\mathrm{dpi} = 1000$ pixels wide, and the Axes gets $775$ of them after room is left for the tick labels. Ten million samples across 775 columns is

$$
\frac{10{,}000{,}000}{775} \approx 12{,}903
$$

samples per column. At 10,000 samples a second, each column covers about $1.29\,\mathrm{s}$ of test time.

Why not hand all ten million to the plot and let it sort them out? Sometimes you can. matplotlib [[quietly thins long lines|path-simplify]] as it draws them, and a simple line of ten million points renders in under a second. But plenty of things along the way do not thin anything. Ten million pairs of 8-byte floats are $160\,\mathrm{MB}$ of memory. An interactive Plotly figure (from lesson 8) sends every point to your web browser, which for ten million points is roughly $200\,\mathrm{MB}$ of data, and the browser slows to a crawl. Markers, scatter plots and every pan-and-zoom redraw pay the full price again. So in practice you shrink the data before plotting. The question is how to shrink it honestly.

## Every Nth sample: the glance method

The first idea everyone has is to keep every $N$th sample and throw the rest away. In NumPy that is a slice with a step, `x[::N]`: start at the first element and take every $N$th one. To get 1,000 points out of ten million, take $N = 10{,}000$. This is **naive decimation**, and it is the night guard's glance.

::: example The spike that was never plotted
A chamber pressure transducer samples at $f_s = 10{,}000\,\mathrm{Hz}$ (read $f_s$ as "f sub s", the sampling rate) for $1000\,\mathrm{s}$. The pressure holds at $9.7\,\mathrm{MPa}$, except for a spike of $+2.0\,\mathrm{MPa}$ lasting $30\,\mathrm{ms}$, starting at $612.345\,\mathrm{s}$.

```python
import numpy as np

fs = 10_000                              # Hz, pressure transducer
t = np.arange(10_000_000) / fs           # s, 1000 s of data
p = np.full(t.size, 9.7)                 # MPa, steady chamber pressure
p[6_123_450:6_123_750] += 2.0            # 30 ms spike at 612.345 s

naive = p[::10_000]                      # every 10,000th sample
print(naive.size, naive.max())           # 1000 9.7
```

**Count the spike's samples.** $30\,\mathrm{ms}$ at $10{,}000\,\mathrm{Hz}$ is $0.030 \times 10{,}000 = 300$ samples, indexes $6{,}123{,}450$ to $6{,}123{,}749$.

**See what the slice kept.** It keeps indexes $0, 10{,}000, 20{,}000, \ldots$ The two kept samples nearest the spike are $6{,}120{,}000$ and $6{,}130{,}000$. Both lie outside it. So the decimated data never rises above $9.7\,\mathrm{MPa}$, and the plot shows a perfectly flat line.

**How unlucky was that?** The kept samples are $10{,}000$ apart, and the spike is $300$ samples wide. Out of the $10{,}000$ possible starting offsets for the slice, exactly $300$ would land a sample inside the spike. The chance of seeing it at all is

$$
\frac{300}{10{,}000} = 0.03 = 3\%.
$$

Sanity check: the spike is 3% as long as the gap between glances, so a glance at a random moment catches it 3% of the time. Ninety-seven times out of a hundred, the most important event of the test is invisible.
:::

This is the same problem as any sampling done too slowly. When you look at a signal less often than it changes, you do not merely lose detail — you can see something that is not there, or miss something that is. Engineers call the general effect **[[aliasing|aliasing]]**. Plotting is a kind of sampling, so it inherits the problem.

::: key
Taking every Nth sample can step straight over a short transient, so a 30 ms spike vanishes from the figure. Use min/max decimation per pixel column, which preserves the visual extremes at the same cost.
:::

::: warning Downsampling by time has the same flaw
`df.resample("1s").first()`, `.last()` and `.asfreq()` in pandas each keep one sample per second. They are naive decimation wearing a time index, and they miss short events in exactly the same way. The method is what matters, not the tool.
:::

## Averages shrink spikes too

The next idea is kinder: instead of keeping one sample per bin, average them. That is `resample(...).mean()` from lesson 10, or in NumPy, reshaping the array into rows of one bin each and taking the mean of each row.

An average does not skip the spike; every sample counts. But it dilutes it. In a bin of $10{,}000$ samples, the spike's $300$ samples raise the average by

$$
\frac{300}{10{,}000} \times 2.0\,\mathrm{MPa} = 0.03 \times 2.0 = 0.06\,\mathrm{MPa}.
$$

So the plotted bin shows $9.76\,\mathrm{MPa}$ instead of $11.7\,\mathrm{MPa}$. A $2\,\mathrm{MPa}$ **[[transient|transient]]** — a short event that comes and goes — has become a bump 3% as tall, easy to mistake for noise.

```python
import numpy as np

p = np.full(10_000_000, 9.7)
p[6_123_450:6_123_750] += 2.0
bin_means = p.reshape(1000, -1).mean(axis=1)   # 1000 bins of 10,000
print(round(bin_means.max(), 3))                # 9.76
```

`reshape(1000, -1)` lays the ten million samples out as 1,000 rows. The `-1` tells NumPy to work out the row length itself: $10{,}000{,}000 / 1000 = 10{,}000$. Then `mean(axis=1)` averages along each row.

Averaging is the right tool when you want the typical level, such as a smooth trend line. It is the wrong tool when the question is "did anything cross the limit?"

## Min/max decimation

Go back to the pixel column. Whatever the samples inside one column do, the column can only show a vertical stroke from the lowest sample to the highest. So those two numbers, the minimum and the maximum of the column's samples, are all the column can ever display. Keep them and you have kept everything visible.

**Min/max decimation** does exactly that:

1. Split the samples into as many equal bins as the plot has pixel columns.
2. In each bin, find the smallest and the largest sample.
3. Output those two points per bin, in the order they happened.

Two points per column is the same kind of budget as naive decimation — about 1,500 points for a 775-column plot — and finding them takes one pass over the data. But now every spike, however short, lands in some bin and becomes that bin's maximum (or minimum, for a dip). It cannot be skipped and it cannot be diluted.

::: note Why the picture is the same
Take one pixel column and all the samples in it. Draw a line through them in time order. The line moves up and down, but it never goes below the smallest sample or above the largest, and a continuous line passes through both. So the column's colored pixels run from the min to the max, with no gaps. Now draw a line through only the min and the max. It covers the same vertical run. The only difference is inside the column's width of one pixel, which the screen cannot show. Keeping the two in time order also makes the short link to the next column start from the right height.
:::

Here is a vectorized version. It reshapes the data into one row per bin, finds where each row's min and max are, and returns those samples in time order:

```python
import numpy as np

def minmax_decimate(t, x, n_bins):
    """Keep the min and max of each of n_bins equal chunks, in time order."""
    n = (x.size // n_bins) * n_bins          # drop the ragged tail
    xb = x[:n].reshape(n_bins, -1)           # one row per bin
    tb = t[:n].reshape(n_bins, -1)
    i_min = xb.argmin(axis=1)                # where each row's min is
    i_max = xb.argmax(axis=1)                # where each row's max is
    idx = np.sort(np.column_stack([i_min, i_max]), axis=1)  # time order
    rows = np.arange(n_bins)[:, None]
    return tb[rows, idx].ravel(), xb[rows, idx].ravel()
```

Walk through it line by line.

- `n` rounds the length down to a whole number of bins, so `reshape` works. For ten million samples and 775 bins that drops $10{,}000{,}000 - 775 \times 12{,}903 = 175$ samples at the very end; a careful version would plot those too.
- `argmin` and `argmax` along `axis=1` give, for each row, the position of its smallest and largest value.
- `np.column_stack` pairs them up into an array of shape (bins, 2), and sorting each pair puts the earlier one first.
- `rows` is a column of row numbers. Indexing `xb[rows, idx]` picks, in each row, the two samples named in `idx`. `ravel()` flattens the (bins, 2) result into one long array.

::: example Ten million points onto one plot
Put it together with the same test data, a figure $10$ inches wide at $100\,\mathrm{dpi}$, and a limit line at $11.0\,\mathrm{MPa}$:

```python
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

def minmax_decimate(t, x, n_bins):
    n = (x.size // n_bins) * n_bins
    xb = x[:n].reshape(n_bins, -1)
    tb = t[:n].reshape(n_bins, -1)
    idx = np.sort(np.column_stack([xb.argmin(axis=1), xb.argmax(axis=1)]), axis=1)
    rows = np.arange(n_bins)[:, None]
    return tb[rows, idx].ravel(), xb[rows, idx].ravel()

fs = 10_000
t = np.arange(10_000_000) / fs
p = np.full(t.size, 9.7)
p[6_123_450:6_123_750] += 2.0

fig, ax = plt.subplots(figsize=(10, 4), dpi=100)
n_bins = int(ax.bbox.width)                  # pixel columns in the plot area
td, pdec = minmax_decimate(t, p, n_bins)
ax.plot(td, pdec, lw=0.8, color="#1d6fd1")
ax.axhline(11.0, ls="--", color="#b4232c", label="limit 11.0 MPa")
ax.set_xlabel("Time since ignition (s)")
ax.set_ylabel("Chamber pressure (MPa)")
ax.legend(loc="upper right")
fig.savefig(io.BytesIO(), format="png")      # draw it; a real script saves a file
print(n_bins, td.size, pdec.max(), round(t.size / n_bins))
# 775 1550 11.7 12903
```

**Bins.** The Axes has $775$ pixel columns, so there are $775$ bins of $12{,}903$ samples, each about $12{,}903 / 10{,}000 \approx 1.29\,\mathrm{s}$ of test time.

**Points plotted.** Two per bin: $2 \times 775 = 1550$. That is about $6{,}450$ times fewer than ten million.

**The spike.** The bin holding $612.345\,\mathrm{s}$ has a maximum of $9.7 + 2.0 = 11.7\,\mathrm{MPa}$, and the plot shows it: a thin vertical stroke that crosses the dashed limit line at $11.0\,\mathrm{MPa}$.

Sanity check: the spike is $300$ samples wide and a bin is $12{,}903$ samples wide, so the whole spike fits in one bin (or two, if it straddles a boundary). It shows up as a stroke one pixel wide — which is honest. At this zoom, 30 ms really is narrower than a pixel. What matters is that its height is right, so the reviewer sees it cross the limit.
:::

::: warning Decimated data is for looking, not for computing
The min/max output is not a sample of the signal. Its mean is pulled toward the extremes, it has two points per bin at uneven times, and a spectrum computed from it is garbage. Compute every statistic, filter and margin from the full-rate data, then decimate only the thing you draw.
:::

## Picking the bins

The number of bins should match the number of pixel columns, and a bin should cover a fixed span of time. That gives three practical rules.

**Use the plot's width, not a round number.** `int(ax.bbox.width)` counts columns for the Axes you are about to draw on. A $6$-inch-wide panel at $150\,\mathrm{dpi}$ has fewer than $900$ columns, so there is no point in giving it more bins than that. Using twice as many bins as columns costs little and gives some margin; using ten times fewer makes the plot look blocky.

**Redo it when you zoom.** Bins computed for the whole $1000\,\mathrm{s}$ are $1.29\,\mathrm{s}$ wide. Zoom into a $10\,\mathrm{s}$ window and only about $8$ bins remain in view, drawn as a crude staircase. An interactive viewer should [[decimate again for the visible range|zoom-redecimate]] every time the view changes, pulling fresh min and max values from the full data.

**Use time bins when the sampling is uneven.** Equal numbers of samples per bin assume a steady sample rate. Real telemetry has gaps, and then equal-count bins cover unequal spans of time. pandas does min/max decimation on time bins with the tools from lesson 10:

```python
import numpy as np
import pandas as pd

fs = 10_000
t = pd.to_timedelta(np.arange(1_000_000) / fs, unit="s")   # 100 s of data
p = pd.Series(9.7, index=t)
p.iloc[612_345:612_645] += 2.0                             # 30 ms spike at 61.2345 s
bins = p.resample("100ms").agg(["min", "max"])
print(len(bins), bins["max"].max(), bins["max"].idxmax().total_seconds())
# 1000 11.7 61.2
```

A hundred seconds in $100\,\mathrm{ms}$ bins gives $1000$ bins. The one starting at $61.2\,\mathrm{s}$ holds the spike, and its max is $11.7\,\mathrm{MPa}$. To draw it, plot the `min` and `max` columns as the two edges of a shaded band with `fill_between`, or interleave them into one line as the NumPy version does.

There are other ways to shrink a plot. One popular method, [[Largest-Triangle-Three-Buckets|lttb]], keeps one point per bin chosen to preserve the curve's shape. It makes attractive plots of smooth data, but by design it keeps only one point per bin, so it can drop one side of an up-and-down excursion. For engineering review, where the extremes are the point, min/max is the safe default. And it is a different job from the **[[anti-alias decimation|scipy-decimate]]** used in signal processing, which filters the signal before thinning it and therefore smooths spikes away on purpose.

## Check yourself

::: check
A 1 kHz accelerometer log runs for two hours and you plot it with `x[::5000]`. A shock lasting $20\,\mathrm{ms}$ happened once. What is the chance the plot shows it at all?
:::

::: answer
At $1000\,\mathrm{Hz}$ the shock spans $0.020 \times 1000 = 20$ samples. The slice keeps one sample every $5000$. Out of $5000$ possible starting offsets, $20$ would land inside the shock, so the chance of seeing it is $20 / 5000 = 0.004$, or $0.4\%$. The plot almost certainly shows nothing.
:::

::: check
A panel is 600 pixel columns wide and holds 3.6 million samples. With min/max decimation, how many samples go into each bin and how many points are plotted? With naive decimation at the same number of plotted points, what step would you use?
:::

::: answer
Each bin gets $3{,}600{,}000 / 600 = 6000$ samples. Two points per bin gives $2 \times 600 = 1200$ plotted points. Naive decimation with the same $1200$ points would keep every $3{,}600{,}000 / 1200 = 3000$th sample. Both plot $1200$ points, but only min/max guarantees every bin's extremes are among them.
:::

::: check
A colleague first runs `resample("1s").mean()` to make the data manageable, then applies min/max decimation to the result for the plot. Will a 30 ms spike of $+2\,\mathrm{MPa}$ in 10 kHz data show at its full height? Why?
:::

::: answer
No. The mean over a one-second bin of $10{,}000$ samples dilutes the spike's $300$ samples to $\frac{300}{10{,}000} \times 2.0 = 0.06\,\mathrm{MPa}$. Min/max decimation afterwards can only keep the extremes of the data it is given, and the $2\,\mathrm{MPa}$ extreme is already gone. Min/max must run on the full-rate data, or the first step must itself keep the min and max, as `agg(["min", "max"])` does.
:::

::: check
After plotting the min/max-decimated array, someone computes its mean to report the average chamber pressure. What goes wrong, and what should they do instead?
:::

::: answer
The decimated array holds only each bin's extremes, so its mean is roughly the average of the bin minima and maxima, not the average of the signal. On a noisy signal it is pulled toward the middle of the noise band's edges, and a single spike counts as heavily as a whole second of steady running. The mean, like every other statistic, must be computed from the full-rate data; decimation is only for drawing.
:::

::: check
Why does a min/max plot built from 775 bins look blocky after zooming 50 times into one region, and what fixes it?
:::

::: answer
Zooming in 50 times shows $1/50$ of the time range, which contains only about $775 / 50 \approx 16$ of the original bins, each now spread across about 50 pixel columns. Each bin's two points become a coarse step. The fix is to decimate again for the visible time range, using the full-rate data, so there are once more about 775 bins across the view.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Pixel columns | `int(ax.bbox.width)`; a column can only show a vertical stroke from min to max |
| Samples per column | total samples ÷ columns; $10^7 / 775 \approx 12{,}903$ |
| Naive decimation `x[::N]` | chance of catching a spike of $k$ samples is about $k / N$; usually misses it |
| Bin mean | dilutes a spike to (spike samples ÷ bin samples) of its height |
| Min/max decimation | per bin keep min and max in time order; $2$ points per column; extremes preserved |
| pandas version | `resample("100ms").agg(["min", "max"])` on a time index |
| Zooming | re-decimate for the visible range from the full data |
| Decimated data | for drawing only; compute statistics from full-rate data |

This is the last lesson of the module. With aligned, honestly decimated telemetry, three-sigma bands, units on every axis and the limit line drawn, you have everything the six-panel flight-review figure needs.

::: context decimate-word A word from the Roman army
To decimate once meant to punish a Roman legion by executing one soldier in ten — "decem" is Latin for ten. In signal processing the word kept the "reduce by a factor" meaning but not the "one in ten": decimating by $N$ means keeping one sample in every $N$. In plotting, people use it loosely for any method that cuts the number of points, including min/max, which keeps two per bin.
:::

::: context pixel-column What a pixel column can show
Many samples fall inside one pixel column. However the line wiggles between them, the screen can only light up a vertical run of pixels, from the lowest value to the highest. So each column's picture depends on exactly two numbers: its minimum and its maximum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="20" y1="20" x2="20" y2="120"/><line x1="70" y1="20" x2="70" y2="120"/>
    <line x1="120" y1="20" x2="120" y2="120"/><line x1="170" y1="20" x2="170" y2="120"/>
  </g>
  <polyline points="20,70 26,64 32,76 38,60 44,72 50,66 56,78 62,62 68,70 74,68 80,74 86,30 92,40 98,72 104,66 110,76 116,64 122,70 128,66 134,74 140,62 146,76 152,68 158,72 164,64 170,70" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="10">
    <line x1="220" y1="60" x2="220" y2="78"/>
    <line x1="270" y1="30" x2="270" y2="76"/>
    <line x1="320" y1="62" x2="320" y2="76"/>
  </g>
  <line x1="200" y1="36" x2="340" y2="36" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="95" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">samples in 3 columns</text>
  <text x="270" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">what each column shows</text>
  <text x="345" y="30" font-size="11" fill="#b4232c" text-anchor="end">limit</text>
</svg>
```
:::

::: context path-simplify matplotlib already thins lines
By default matplotlib simplifies a long line as it draws it: it drops points that would move the drawn path by less than a small fraction of a pixel. The settings are `path.simplify` (on) and `path.simplify_threshold` (one ninth). This is why a plain ten-million-point line still renders quickly. It is designed to leave the picture unchanged, so it does not hide spikes the way `x[::N]` does, but it only helps matplotlib's own line drawing. Scatter plots, markers, Plotly in a browser and every step before drawing still carry all the points.
:::

::: context aliasing Seeing a wave that is not there
When a signal is sampled less often than it changes, the samples can trace out a completely different, slower signal. Below, a wave with nine cycles (thin gray) is sampled in ten equal steps, at the red dots. The dots fall exactly on a wave with a single cycle, drawn in blue, which is all anyone looking at the samples would see. The same effect makes a spinning wheel look like it turns backwards on film. Sampling theory says a signal must be sampled more than twice as fast as its fastest wiggle to avoid it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <polyline points="20.0,70.0 20.9,63.7 21.8,57.6 22.7,51.8 23.6,46.5 24.4,41.7 25.3,37.6 26.2,34.4 27.1,32.0 28.0,30.5 28.9,30.0 29.8,30.5 30.7,32.0 31.6,34.4 32.4,37.6 33.3,41.7 34.2,46.5 35.1,51.8 36.0,57.6 36.9,63.7 37.8,70.0 38.7,76.3 39.6,82.4 40.4,88.2 41.3,93.5 42.2,98.3 43.1,102.4 44.0,105.6 44.9,108.0 45.8,109.5 46.7,110.0 47.6,109.5 48.4,108.0 49.3,105.6 50.2,102.4 51.1,98.3 52.0,93.5 52.9,88.2 53.8,82.4 54.7,76.3 55.6,70.0 56.4,63.7 57.3,57.6 58.2,51.8 59.1,46.5 60.0,41.7 60.9,37.6 61.8,34.4 62.7,32.0 63.6,30.5 64.4,30.0 65.3,30.5 66.2,32.0 67.1,34.4 68.0,37.6 68.9,41.7 69.8,46.5 70.7,51.8 71.6,57.6 72.4,63.7 73.3,70.0 74.2,76.3 75.1,82.4 76.0,88.2 76.9,93.5 77.8,98.3 78.7,102.4 79.6,105.6 80.4,108.0 81.3,109.5 82.2,110.0 83.1,109.5 84.0,108.0 84.9,105.6 85.8,102.4 86.7,98.3 87.6,93.5 88.4,88.2 89.3,82.4 90.2,76.3 91.1,70.0 92.0,63.7 92.9,57.6 93.8,51.8 94.7,46.5 95.6,41.7 96.4,37.6 97.3,34.4 98.2,32.0 99.1,30.5 100.0,30.0 100.9,30.5 101.8,32.0 102.7,34.4 103.6,37.6 104.4,41.7 105.3,46.5 106.2,51.8 107.1,57.6 108.0,63.7 108.9,70.0 109.8,76.3 110.7,82.4 111.6,88.2 112.4,93.5 113.3,98.3 114.2,102.4 115.1,105.6 116.0,108.0 116.9,109.5 117.8,110.0 118.7,109.5 119.6,108.0 120.4,105.6 121.3,102.4 122.2,98.3 123.1,93.5 124.0,88.2 124.9,82.4 125.8,76.3 126.7,70.0 127.6,63.7 128.4,57.6 129.3,51.8 130.2,46.5 131.1,41.7 132.0,37.6 132.9,34.4 133.8,32.0 134.7,30.5 135.6,30.0 136.4,30.5 137.3,32.0 138.2,34.4 139.1,37.6 140.0,41.7 140.9,46.5 141.8,51.8 142.7,57.6 143.6,63.7 144.4,70.0 145.3,76.3 146.2,82.4 147.1,88.2 148.0,93.5 148.9,98.3 149.8,102.4 150.7,105.6 151.6,108.0 152.4,109.5 153.3,110.0 154.2,109.5 155.1,108.0 156.0,105.6 156.9,102.4 157.8,98.3 158.7,93.5 159.6,88.2 160.4,82.4 161.3,76.3 162.2,70.0 163.1,63.7 164.0,57.6 164.9,51.8 165.8,46.5 166.7,41.7 167.6,37.6 168.4,34.4 169.3,32.0 170.2,30.5 171.1,30.0 172.0,30.5 172.9,32.0 173.8,34.4 174.7,37.6 175.6,41.7 176.4,46.5 177.3,51.8 178.2,57.6 179.1,63.7 180.0,70.0 180.9,76.3 181.8,82.4 182.7,88.2 183.6,93.5 184.4,98.3 185.3,102.4 186.2,105.6 187.1,108.0 188.0,109.5 188.9,110.0 189.8,109.5 190.7,108.0 191.6,105.6 192.4,102.4 193.3,98.3 194.2,93.5 195.1,88.2 196.0,82.4 196.9,76.3 197.8,70.0 198.7,63.7 199.6,57.6 200.4,51.8 201.3,46.5 202.2,41.7 203.1,37.6 204.0,34.4 204.9,32.0 205.8,30.5 206.7,30.0 207.6,30.5 208.4,32.0 209.3,34.4 210.2,37.6 211.1,41.7 212.0,46.5 212.9,51.8 213.8,57.6 214.7,63.7 215.6,70.0 216.4,76.3 217.3,82.4 218.2,88.2 219.1,93.5 220.0,98.3 220.9,102.4 221.8,105.6 222.7,108.0 223.6,109.5 224.4,110.0 225.3,109.5 226.2,108.0 227.1,105.6 228.0,102.4 228.9,98.3 229.8,93.5 230.7,88.2 231.6,82.4 232.4,76.3 233.3,70.0 234.2,63.7 235.1,57.6 236.0,51.8 236.9,46.5 237.8,41.7 238.7,37.6 239.6,34.4 240.4,32.0 241.3,30.5 242.2,30.0 243.1,30.5 244.0,32.0 244.9,34.4 245.8,37.6 246.7,41.7 247.6,46.5 248.4,51.8 249.3,57.6 250.2,63.7 251.1,70.0 252.0,76.3 252.9,82.4 253.8,88.2 254.7,93.5 255.6,98.3 256.4,102.4 257.3,105.6 258.2,108.0 259.1,109.5 260.0,110.0 260.9,109.5 261.8,108.0 262.7,105.6 263.6,102.4 264.4,98.3 265.3,93.5 266.2,88.2 267.1,82.4 268.0,76.3 268.9,70.0 269.8,63.7 270.7,57.6 271.6,51.8 272.4,46.5 273.3,41.7 274.2,37.6 275.1,34.4 276.0,32.0 276.9,30.5 277.8,30.0 278.7,30.5 279.6,32.0 280.4,34.4 281.3,37.6 282.2,41.7 283.1,46.5 284.0,51.8 284.9,57.6 285.8,63.7 286.7,70.0 287.6,76.3 288.4,82.4 289.3,88.2 290.2,93.5 291.1,98.3 292.0,102.4 292.9,105.6 293.8,108.0 294.7,109.5 295.6,110.0 296.4,109.5 297.3,108.0 298.2,105.6 299.1,102.4 300.0,98.3 300.9,93.5 301.8,88.2 302.7,82.4 303.6,76.3 304.4,70.0 305.3,63.7 306.2,57.6 307.1,51.8 308.0,46.5 308.9,41.7 309.8,37.6 310.7,34.4 311.6,32.0 312.4,30.5 313.3,30.0 314.2,30.5 315.1,32.0 316.0,34.4 316.9,37.6 317.8,41.7 318.7,46.5 319.6,51.8 320.4,57.6 321.3,63.7 322.2,70.0 323.1,76.3 324.0,82.4 324.9,88.2 325.8,93.5 326.7,98.3 327.6,102.4 328.4,105.6 329.3,108.0 330.2,109.5 331.1,110.0 332.0,109.5 332.9,108.0 333.8,105.6 334.7,102.4 335.6,98.3 336.4,93.5 337.3,88.2 338.2,82.4 339.1,76.3 340.0,70.0" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="20.0,70.0 22.7,72.1 25.3,74.2 28.0,76.3 30.7,78.3 33.3,80.4 36.0,82.4 38.7,84.3 41.3,86.3 44.0,88.2 46.7,90.0 49.3,91.8 52.0,93.5 54.7,95.2 57.3,96.8 60.0,98.3 62.7,99.7 65.3,101.1 68.0,102.4 70.7,103.5 73.3,104.6 76.0,105.6 78.7,106.5 81.3,107.3 84.0,108.0 86.7,108.6 89.3,109.1 92.0,109.5 94.7,109.8 97.3,109.9 100.0,110.0 102.7,109.9 105.3,109.8 108.0,109.5 110.7,109.1 113.3,108.6 116.0,108.0 118.7,107.3 121.3,106.5 124.0,105.6 126.7,104.6 129.3,103.5 132.0,102.4 134.7,101.1 137.3,99.7 140.0,98.3 142.7,96.8 145.3,95.2 148.0,93.5 150.7,91.8 153.3,90.0 156.0,88.2 158.7,86.3 161.3,84.3 164.0,82.4 166.7,80.4 169.3,78.3 172.0,76.3 174.7,74.2 177.3,72.1 180.0,70.0 182.7,67.9 185.3,65.8 188.0,63.7 190.7,61.7 193.3,59.6 196.0,57.6 198.7,55.7 201.3,53.7 204.0,51.8 206.7,50.0 209.3,48.2 212.0,46.5 214.7,44.8 217.3,43.2 220.0,41.7 222.7,40.3 225.3,38.9 228.0,37.6 230.7,36.5 233.3,35.4 236.0,34.4 238.7,33.5 241.3,32.7 244.0,32.0 246.7,31.4 249.3,30.9 252.0,30.5 254.7,30.2 257.3,30.1 260.0,30.0 262.7,30.1 265.3,30.2 268.0,30.5 270.7,30.9 273.3,31.4 276.0,32.0 278.7,32.7 281.3,33.5 284.0,34.4 286.7,35.4 289.3,36.5 292.0,37.6 294.7,38.9 297.3,40.3 300.0,41.7 302.7,43.2 305.3,44.8 308.0,46.5 310.7,48.2 313.3,50.0 316.0,51.8 318.7,53.7 321.3,55.7 324.0,57.6 326.7,59.6 329.3,61.7 332.0,63.7 334.7,65.8 337.3,67.9 340.0,70.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c">
    <circle cx="20.0" cy="70.0" r="4"/><circle cx="52.0" cy="93.5" r="4"/><circle cx="84.0" cy="108.0" r="4"/>
    <circle cx="116.0" cy="108.0" r="4"/><circle cx="148.0" cy="93.5" r="4"/><circle cx="180.0" cy="70.0" r="4"/>
    <circle cx="212.0" cy="46.5" r="4"/><circle cx="244.0" cy="32.0" r="4"/><circle cx="276.0" cy="32.0" r="4"/>
    <circle cx="308.0" cy="46.5" r="4"/><circle cx="340.0" cy="70.0" r="4"/>
  </g>
  <text x="180" y="132" font-size="11" fill="#1f2a44" text-anchor="middle">9 cycles sampled in 10 steps look like 1 cycle</text>
</svg>
```
:::

::: context transient Short events that matter
On a rocket engine, many of the events a test engineer most needs to see last only milliseconds: the pressure spike of a hard start when too much propellant ignites at once, water hammer when a valve slams shut, or a combustion instability starting to grow. A 30 ms spike can be the first sign of a problem that later destroys an engine. Below, glances every 40 pixels step straight over a narrow spike.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <polyline points="20,80 196,80 198,24 204,24 206,80 340,80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="20" cy="80" r="4"/><circle cx="60" cy="80" r="4"/><circle cx="100" cy="80" r="4"/>
    <circle cx="140" cy="80" r="4"/><circle cx="180" cy="80" r="4"/><circle cx="220" cy="80" r="4"/>
    <circle cx="260" cy="80" r="4"/><circle cx="300" cy="80" r="4"/><circle cx="340" cy="80" r="4"/>
  </g>
  <text x="212" y="30" font-size="12" fill="#b4232c">30 ms spike</text>
  <text x="180" y="108" font-size="11" fill="#1d6fd1" text-anchor="middle">kept samples: every one is on the flat line</text>
</svg>
```
:::

::: context zoom-redecimate Zoomable plots of huge data
Interactive viewers solve the zoom problem by keeping the full data on the Python side and sending the browser only a decimated view, recomputed on every zoom or pan. The open-source plotly-resampler package does this for the Plotly figures you met in lesson 8, and min/max decimation is one of the methods it offers. Tools such as Datashader take a related route, turning millions of points straight into a pixel image. The principle is the same one as in this lesson: the screen has a fixed number of pixels, so never send it more than it can show.
:::

::: context lttb A shape-keeping alternative
Largest-Triangle-Three-Buckets was described by Sveinn Steinarsson in his 2013 master's thesis at the University of Iceland on downsampling time series for visual display. In each bucket it keeps the one point that forms the largest triangle with the point kept before it and the average of the next bucket, which tends to keep peaks and corners and gives a pleasing curve. Because it keeps one point per bucket, a bucket holding both a sharp rise and a sharp dip can show only one of them.
:::

::: context scipy-decimate Decimation in signal processing
scipy.signal.decimate reduces the sample rate the careful signal-processing way: it first runs a low-pass anti-aliasing filter that removes anything changing faster than the new rate can represent, and then keeps every $N$th sample. That is right when the thinned signal feeds further analysis, because it prevents aliasing. It is wrong for a review plot: a 30 ms spike is exactly the kind of fast content the filter is built to remove.
:::
