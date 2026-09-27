---
id: l10-resample-rolling-groupby
title: Resample, rolling, interpolate and groupby
minutes: 22
covers:
  - resample, rolling, interpolate, groupby and agg
---

Think about a fitness watch. It measures your heart rate every second, all day long. Nobody wants to read 86,400 numbers, so the app shows you something shorter: one average per hour, a smooth line that ignores single wobbles, and a tidy table with your fastest mile on each run. Those are three different jobs. The first cuts the day into boxes and summarizes each box. The second slides a small window along the data and keeps every point. The third sorts the data into groups by some label and sums up each group.

Flight telemetry needs the same three jobs, plus a fourth: filling in the holes where a sample went missing. A rocket's chamber pressure sensor may report 1,000 times a second, while a review slide wants one number per second. An accelerometer is noisy, so you want a moving average without losing the time stamps. A Monte Carlo study produces thousands of simulated flights, and you want the worst dynamic pressure from each one. pandas has one tool for each job: **resample**, **rolling**, **interpolate**, and **groupby** with **agg**.

This lesson builds on the last one, where you met the DataFrame, the Series and the DatetimeIndex. Every tool here leans on that index. By the end you will know which tool answers which question, what each one does to the index, and where each one can quietly mislead you.

## Resample: cut time into boxes

Picture a long strip of paper tape with a dot for every sample. Take scissors and cut the tape every second. Each piece is a **bin** — one box of time. Now write one number on each piece: the average of its dots, or the biggest, or how many dots it holds. The pieces with their numbers are the new, slower data.

That is **resampling**: changing the sampling rate by grouping samples into time bins and summarizing each bin. In pandas it takes two steps. `resample("1s")` says how wide the bins are. A second call, such as `.mean()`, says how to squash each bin into one number. The result has a new index with one row per bin.

A sensor that reports 100 times a second runs at 100 **[[hertz|hertz]]** (Hz), so its samples are $10\,\mathrm{ms}$ apart (a millisecond, ms, is a thousandth of a second). Here is three seconds of chamber pressure at 100 Hz. The engine throttles up halfway through: the pressure is $9.7\,\mathrm{MPa}$ (megapascals, millions of pascals) for the first 1.5 s and $10.0\,\mathrm{MPa}$ after that.

```python
import numpy as np
import pandas as pd

t = pd.date_range("2026-03-14 12:00:00", periods=300, freq="10ms")
p = np.where(np.arange(300) < 150, 9.7, 10.0)       # MPa, step at 1.5 s
s = pd.Series(p, index=t, name="p_c_MPa")

print(s.resample("1s").mean())
# 2026-03-14 12:00:00     9.70
# 2026-03-14 12:00:01     9.85
# 2026-03-14 12:00:02    10.00
# Freq: s, Name: p_c_MPa, dtype: float64
```

Three hundred rows went in and three rows came out. Each output row is stamped with the *start* of its bin: the row labeled 12:00:01 summarizes every sample from 12:00:01.000 up to, but not including, 12:00:02.000. That is the pandas default for bins of seconds or minutes: the **[[left edge is in and the right edge is out|bin-edges]]**, and the label is the left edge.

The string `"1s"` is a **frequency alias**, a short code for a time step. The ones you will use most are `"ms"` for milliseconds, `"s"` for seconds, `"min"` for minutes and `"h"` for hours, with a number in front: `"250ms"`, `"5s"`, `"10min"`. Older code uses [[capital letters|offset-aliases]] such as `"S"` and `"T"`; modern pandas rejects those.

### Choosing how to squash each bin

The mean is only one choice. The `agg` method (short for aggregate, "gather into one") takes a list of summaries and gives you a column for each:

```python
import numpy as np
import pandas as pd

t = pd.date_range("2026-03-14 12:00:00", periods=300, freq="10ms")
s = pd.Series(np.where(np.arange(300) < 150, 9.7, 10.0), index=t)

print(s.resample("1s").agg(["min", "max", "count"]))
#                       min   max  count
# 2026-03-14 12:00:00   9.7   9.7    100
# 2026-03-14 12:00:01   9.7  10.0    100
# 2026-03-14 12:00:02  10.0  10.0    100
```

Each choice answers a different question. The mean says "about what level was it?" The max and min say "how far did it go?" The count says "how many samples did the bin actually get?" A count lower than you expect is the first sign of a gap in the data. `"last"` and `"first"` pick one sample per bin, which is right for a slowly changing value such as a mode flag.

Resample needs a clock. It works on a Series or DataFrame whose index is a DatetimeIndex (or a TimedeltaIndex, which holds elapsed times such as "3.2 seconds after lift-off"). If the time is a column instead of the index, you pass its name with `on="time"`. On a plain integer index there are no seconds to cut at, and pandas raises a `TypeError`.

::: example Downsampling a throttle step
Take the chamber pressure above: 100 Hz for 3 s, $9.7\,\mathrm{MPa}$ before 1.5 s and $10.0\,\mathrm{MPa}$ after.

**Count the samples.** $100\,\mathrm{Hz} \times 3\,\mathrm{s} = 300$ samples. One-second bins hold $100$ samples each, so there are $3$ bins.

**First bin**, 0 s to 1 s: all 100 samples are $9.7$, so the mean is $9.7\,\mathrm{MPa}$.

**Second bin**, 1 s to 2 s: the step comes at 1.5 s, so 50 samples are $9.7$ and 50 are $10.0$.

$$
\bar{p} = \frac{50 \times 9.7 + 50 \times 10.0}{100} = \frac{485 + 500}{100} = 9.85\,\mathrm{MPa}.
$$

(Read $\bar{p}$ as "p bar", the average pressure.)

**Third bin**, 2 s to 3 s: all $10.0\,\mathrm{MPa}$.

Sanity check: the middle value lands exactly halfway between the two levels, because the step cut that bin exactly in half. Notice what the one-second means cannot tell you: *when* inside that second the step happened. The max and min columns at least show that the bin held both levels.
:::

::: warning Resampling with the mean hides short events
A mean over a bin is a smoothing filter. A $5\,\mathrm{ms}$ pressure spike inside a one-second bin moves that bin's mean by less than one percent of the spike's height. If short events matter — and in a flight review they always do — resample with `"max"` and `"min"` as well as `"mean"`. Lesson 12 turns this into a full recipe for plotting.
:::

### Going the other way: upsampling

Resample can also make bins *smaller* than the sample spacing. That is **upsampling**: asking for more rows than you have data. A GPS receiver that reports once a second has nothing to say about the time 0.25 s after a fix, so pandas has to be told what to put there. `asfreq()` puts in NaN (read "not a number", the marker for a missing value). `ffill()` ("forward fill") copies the last known value forward. For a smooth guess between samples, you use interpolate, which comes later in this lesson.

```python
import pandas as pd

g = pd.Series([1000.0, 1050.0, 1100.0, 1150.0],          # altitude, m
              index=pd.date_range("2026-03-14 12:00:00", periods=4, freq="1s"))
print(g.resample("250ms").asfreq().iloc[:5].to_numpy())
# [1000.   nan   nan   nan 1050.]
print(g.resample("250ms").ffill().iloc[:5].to_numpy())
# [1000. 1000. 1000. 1000. 1050.]
```

Downsampling throws information away on purpose. Upsampling never adds information; it only makes room for a guess.

## Rolling: a window that slides

Now picture a small cardboard frame that shows ten dots of the tape at once. Put it at the start, write down the average of the ten dots you see, then slide it one dot to the right and do it again. You get one average for *every* dot. The tape keeps its length; each dot's number is now a local average.

That is a **rolling** (or moving) statistic. It keeps the index exactly as it was and computes a statistic over a window that moves along the data. `s.rolling(10).mean()` is a 10-sample moving average. By default the window is **trailing**: the value at each row uses that row and the nine rows before it.

```python
import numpy as np
import pandas as pd

t = pd.date_range("2026-03-14 12:00:00", periods=300, freq="10ms")
s = pd.Series(np.where(np.arange(300) < 150, 9.7, 10.0), index=t)

m = s.rolling(10).mean()
print(len(m), m.index.equals(s.index))        # 300 True
print(m.iloc[:3].to_numpy())                  # [nan nan nan]
print(m.iloc[148:162].round(2).to_numpy())
# [ 9.7   9.7   9.73  9.76  9.79  9.82  9.85  9.88  9.91  9.94  9.97 10.
#  10.   10.  ]
```

Three things to notice. The output has all 300 rows and the same index. The first nine values are NaN, because a 10-sample window does not fit until the tenth row. And the sharp step has become a ramp ten samples long: each new sample of $10.0$ pushes out one old $9.7$, so the average climbs by $0.3 / 10 = 0.03\,\mathrm{MPa}$ per row.

::: key resample vs rolling
resample changes the sampling rate by grouping into time bins and aggregating, producing a new index. rolling keeps the index and computes a moving statistic over a window. Downsampling telemetry is resample; a moving average is rolling.
:::

### Windows in rows or in time

`rolling(10)` counts **rows**. `rolling("100ms")` measures **time**: each window holds every sample from the last 100 ms, however many that is. On evenly spaced 100 Hz data the two agree once the window has filled. They part ways when the data has gaps or an uneven rate, which real telemetry usually does. A time window stays 100 ms wide across a gap; a row window quietly stretches to reach back ten samples, however old they are. Time windows need a DatetimeIndex, like resample.

Time windows also start differently. They report a value from the very first row, averaging whatever samples they have so far. Row windows wait until the window is full. The `min_periods` argument controls this for both: `rolling(10, min_periods=1)` reports from row one.

::: example The delay of a moving average
A 10-sample trailing mean at 100 Hz smooths noise, but it also makes events look late. How late?

The step really happens between the samples at 1.49 s and 1.50 s, so call its time $1.495\,\mathrm{s}$. The smoothed curve is halfway up, at $9.85\,\mathrm{MPa}$, when its window holds five old and five new samples. That is the row at $1.54\,\mathrm{s}$ (rows 145 to 154 are in the window, and rows 150 to 154 are the new ones).

$$
1.540 - 1.495 = 0.045\,\mathrm{s} = 45\,\mathrm{ms}.
$$

The general rule for a trailing mean of $N$ samples spaced $\Delta t$ apart (read "delta t", the time step) is a delay of

$$
\frac{N - 1}{2}\,\Delta t = \frac{9}{2} \times 10\,\mathrm{ms} = 45\,\mathrm{ms},
$$

which matches. Sanity check: the window's center sits $4.5$ samples behind its newest sample, so the average describes the signal about $4.5$ samples ago.
:::

Passing `center=True` puts the window's middle on each row instead of its end, and the delay disappears. The price is that each value now uses samples from the future. That is fine when you post-process a recorded flight. It is impossible inside flight software, where the future has not arrived yet; a filter that uses only past samples is called **[[causal|causal]]**, and on board every filter must be.

::: warning rolling(60) is sixty rows, not sixty seconds
A bare number is a row count. On 200 Hz data, `rolling(60)` averages 0.3 s of data, not a minute. Write the window as a time string, `rolling("60s")`, whenever you mean a span of time, and you never have to remember the sample rate.
:::

## Interpolate: filling the holes

Radio links drop samples. A sensor goes quiet for a moment during staging. Upsampling leaves NaN between real points. **Interpolation** fills a missing value with a guess made from its neighbors. The simplest guess draws a straight line between the known points on either side.

pandas does this with `interpolate()`. The default, `method="linear"`, draws the straight line **by row position**: it assumes the rows are evenly spaced, whatever the timestamps say. `method="time"` draws the line against the real clock. On evenly spaced data the two agree. On uneven data they do not:

```python
import numpy as np
import pandas as pd

t = pd.to_datetime(["2026-03-14 12:00:00", "2026-03-14 12:00:01",
                    "2026-03-14 12:00:04"])
h = pd.Series([0.0, np.nan, 40.0], index=t)
print(h.interpolate().to_numpy())                  # [ 0. 20. 40.]
print(h.interpolate(method="time").to_numpy())     # [ 0. 10. 40.]
```

The missing sample is one second into a four-second gap. The clock-aware answer is a quarter of the way from 0 to 40, which is 10. The row-counting answer puts it halfway, at 20, because the missing row sits halfway down the list. Only the first is physics.

Upsampling and interpolating together turn 1 Hz GPS altitude into a smooth 4 Hz series:

```python
import pandas as pd

g = pd.Series([1000.0, 1050.0, 1100.0, 1150.0],
              index=pd.date_range("2026-03-14 12:00:00", periods=4, freq="1s"))
print(g.resample("250ms").asfreq().interpolate(method="time").iloc[:5].to_numpy())
# [1000.  1012.5 1025.  1037.5 1050. ]
```

Between 1000 m and 1050 m the line climbs 50 m in four quarter-second steps, $12.5\,\mathrm{m}$ each.

::: warning Interpolation invents data
A straight line across a two-second **[[dropout|dropout]]** looks exactly like real data on a plot, and it may hide the very event that caused the dropout. Cap how far a guess may reach with `limit` (the most missing rows in a row to fill), and keep a column that marks which rows were filled. A reviewer should always be able to tell measured from guessed.
:::

## Groupby and agg: split, summarize, combine

Back to the fitness watch: "fastest mile on each run". To get it, you sort the samples into piles by run, find the fastest mile in each pile, and write the answers in one table. That pattern has a name, **[[split-apply-combine|split-apply-combine]]**, and pandas spells it `groupby`.

`df.groupby("phase")` splits the rows into groups that share a value in the column `phase`. Nothing is computed yet. Choose a column and a summary, and pandas applies it to each group and combines the answers into a new table indexed by the group labels:

```python
import pandas as pd

df = pd.DataFrame({
    "phase":   ["boost"] * 4 + ["coast"] * 2 + ["upper"] * 3,
    "axial_g": [1.4, 2.1, 2.9, 3.6, 0.0, 0.1, 0.8, 1.2, 1.5],
})
print(df.groupby("phase")["axial_g"].max())
# phase
# boost    3.6
# coast    0.1
# upper    1.5
# Name: axial_g, dtype: float64
```

When you want several summaries at once, use `agg` with **named aggregations**. Each argument is written `new_name=(column, summary)`, and each becomes a column of the result:

```python
import pandas as pd

df = pd.DataFrame({
    "phase":   ["boost"] * 4 + ["coast"] * 2 + ["upper"] * 3,
    "axial_g": [1.4, 2.1, 2.9, 3.6, 0.0, 0.1, 0.8, 1.2, 1.5],
})
summary = df.groupby("phase").agg(
    n=("axial_g", "size"),
    peak=("axial_g", "max"),
    mean=("axial_g", "mean"),
)
print(summary.round(2))
#        n  peak  mean
# phase
# boost  4   3.6  2.50
# coast  2   0.1  0.05
# upper  3   1.5  1.17
```

Check one row by hand: the boost mean is $(1.4 + 2.1 + 2.9 + 3.6) / 4 = 10.0 / 4 = 2.5$. The groups come out sorted by label; pass `sort=False` to keep them in the order they first appear.

Resample is a groupby too. It is the special case where the group label is "which time bin does this sample fall in", which is why it needs a clock and why it returns one row per bin.

::: note Why resample is a groupby
Round every timestamp down to the start of its second with `s.index.floor("1s")`. That gives each sample a label saying which one-second bin it belongs to. Grouping by that label and taking the mean produces exactly the same numbers as `s.resample("1s").mean()`: `np.allclose` on the two results prints `True`. Resample adds only conveniences on top: empty bins still show up as rows, you get the label and closed-side options, and the new index remembers its frequency.
:::

::: example Worst dynamic pressure in each Monte Carlo run
A **[[Monte Carlo|monte-carlo]]** study flies the same trajectory many times, each with slightly different winds, engine thrust and mass. Here are three short runs stacked in one table, with a column saying which run each row came from. The structure is rated for $35\,\mathrm{kPa}$ of dynamic pressure $q$.

```python
import pandas as pd

mc = pd.DataFrame({
    "run":   [0, 0, 0, 1, 1, 1, 2, 2, 2],
    "q_kPa": [21.0, 33.5, 28.0, 22.4, 36.1, 30.2, 20.8, 31.9, 27.5],
})
peaks = mc.groupby("run")["q_kPa"].max()
print(peaks.to_numpy(), round(peaks.mean(), 2), peaks.max())
# [33.5 36.1 31.9] 33.83 36.1
```

**Split** by run: rows 0 to 2, rows 3 to 5, rows 6 to 8.

**Apply** the max to each: $33.5$, $36.1$ and $31.9\,\mathrm{kPa}$.

**Combine** into a Series with one row per run. Its mean is $(33.5 + 36.1 + 31.9) / 3 = 101.5 / 3 \approx 33.83\,\mathrm{kPa}$.

The worst run, run 1, reaches $36.1\,\mathrm{kPa}$, which is $1.1\,\mathrm{kPa}$ over the rating. That run is the one a reviewer wants to see plotted on its own. Sanity check: each peak must be at least as big as every other value in its run, and $36.1$ is indeed the largest of $22.4$, $36.1$ and $30.2$.
:::

Notice the order of operations. You take the max *within* each run first and summarize *across* runs second. Taking the mean of all nine rows would mix the calm start of each flight with the peak and tell you nothing about the worst case.

::: key
groupby splits rows by a label, applies a summary to each group, and combines the answers into a table indexed by the labels. agg with name=(column, function) pairs builds several summary columns at once.
:::

## Check yourself

::: check
A 200 Hz IMU log lasts 10 minutes. How many rows does it have? How many rows does `df.resample("1s").mean()` return, and how many samples go into each?
:::

::: answer
Rows in: $200\,\mathrm{Hz} \times 600\,\mathrm{s} = 120{,}000$. Ten minutes is $600$ one-second bins, so the result has $600$ rows. Each bin holds $120{,}000 / 600 = 200$ samples, which is the sample rate, as it should be. If the log had a gap, the `count` of the affected bins would come out below 200.
:::

::: check
On the same 200 Hz log, how much time does `rolling(50)` cover? How many samples does `rolling("50ms")` cover once it has filled? Which one keeps the same width across a half-second dropout?
:::

::: answer
Samples are $1/200 = 5\,\mathrm{ms}$ apart. `rolling(50)` covers 50 rows, $50 \times 5\,\mathrm{ms} = 250\,\mathrm{ms}$. `rolling("50ms")` covers $50 / 5 = 10$ samples. Across a dropout, the time window stays 50 ms wide and holds fewer samples; the row window keeps 50 rows and so reaches back more than half a second in time. The time window keeps its meaning.
:::

::: check
A Series has timestamps at 0 s, 2 s and 10 s with values 2.0, NaN and 12.0. What do `interpolate()` and `interpolate(method="time")` put in the gap? Which is right for a physical signal?
:::

::: answer
The default counts rows: the missing row is halfway down, so it gets $(2.0 + 12.0)/2 = 7.0$. The time method uses the clock: 2 s is $2/10 = 0.2$ of the way through the gap, so it gets $2.0 + 0.2 \times (12.0 - 2.0) = 4.0$. For a physical signal sampled at uneven times, `method="time"` is right, because the signal changes with time, not with row number.
:::

::: check
A trailing 20-sample moving average runs on 50 Hz data. About how late does it make a sudden step appear? What would make the delay go away, and why can a flight computer not do that?
:::

::: answer
Samples are $1/50 = 20\,\mathrm{ms}$ apart. The delay is $\frac{N-1}{2}\Delta t = \frac{19}{2} \times 20\,\mathrm{ms} = 190\,\mathrm{ms}$. `center=True` centers the window on each row and removes the delay, but that uses ten samples from the future. A flight computer only has the past, so its filters must be causal and it has to live with the delay (or use a smarter filter with less of it).
:::

::: check
A DataFrame `tel` has columns `run`, `phase` and `lat_g` (lateral acceleration). Write one line that gives, for each run, the largest lateral acceleration and the number of samples, in columns called `worst` and `n`.
:::

::: answer
`tel.groupby("run").agg(worst=("lat_g", "max"), n=("lat_g", "size"))`. It splits the rows by run, applies max and size to the `lat_g` column of each group, and combines the answers into a table with one row per run and the two named columns. For the worst value across all runs, take `.max()` of the `worst` column afterwards.
:::

## Summary

| Tool | What it does | What happens to the index |
| --- | --- | --- |
| `resample("1s").mean()` | groups samples into time bins, summarizes each | new index, one row per bin, labeled by the bin's left edge |
| `resample(...).agg(["min", "max", "count"])` | several summaries per bin | same; count exposes gaps |
| `resample("250ms").asfreq()` / `.ffill()` | upsampling: makes room, fills with NaN or last value | new, finer index |
| `rolling(10).mean()` | moving average over 10 rows | unchanged; first 9 values NaN |
| `rolling("100ms")` | window measured in time | unchanged; needs a DatetimeIndex |
| trailing-mean delay | $\frac{N-1}{2}\Delta t$; `center=True` removes it but is not causal | — |
| `interpolate(method="time")` | straight-line fill against the clock; default counts rows | unchanged |
| `groupby(key).agg(name=(col, fn))` | split, apply, combine | new index of group labels |

Next lesson: two sensors, two clocks. You will join a 200 Hz IMU stream to 1 Hz GPS fixes with merge_asof, which matches rows by nearest time instead of exact equality.

::: context hertz One hertz is once a second
The hertz, written Hz, counts events per second: 100 Hz means 100 samples every second. It is named after Heinrich Hertz, who first produced and detected radio waves in the 1880s. The spacing between samples is one over the rate: at 100 Hz it is $1/100\,\mathrm{s} = 10\,\mathrm{ms}$, and at 200 Hz it is $5\,\mathrm{ms}$. Flight vehicles run many rates at once. An IMU may report at 200 Hz or more, a guidance loop may run at 50 Hz, and a GPS receiver may deliver a fix once a second.
:::

::: context bin-edges Which bin owns the sample on the line
A sample stamped exactly 12:00:01.000 sits on the boundary between two bins. pandas must give it to one of them, and for bins of seconds and minutes it chooses the right-hand bin: each bin includes its left edge and excludes its right edge, written $[\,t,\ t+1\,\mathrm{s})$. The square bracket means "included", the round one "excluded". So every sample lands in exactly one bin. The `closed` and `label` arguments change the convention when a data source counts the other way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 126" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <rect x="30" y="40" width="100" height="40" fill="#8fb8f0" fill-opacity="0.35" stroke="none"/>
  <rect x="130" y="40" width="100" height="40" fill="#f2b880" fill-opacity="0.35" stroke="none"/>
  <rect x="230" y="40" width="100" height="40" fill="#8fb8f0" fill-opacity="0.35" stroke="none"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="36" x2="30" y2="84"/><line x1="130" y1="36" x2="130" y2="84"/>
    <line x1="230" y1="36" x2="230" y2="84"/><line x1="330" y1="36" x2="330" y2="84"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="30" cy="60" r="4"/><circle cx="55" cy="60" r="4"/><circle cx="80" cy="60" r="4"/><circle cx="105" cy="60" r="4"/>
    <circle cx="155" cy="60" r="4"/><circle cx="180" cy="60" r="4"/><circle cx="205" cy="60" r="4"/>
    <circle cx="255" cy="60" r="4"/><circle cx="280" cy="60" r="4"/><circle cx="305" cy="60" r="4"/>
  </g>
  <circle cx="130" cy="60" r="5" fill="#b4232c"/>
  <circle cx="230" cy="60" r="4" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="102">0 s</text><text x="130" y="102">1 s</text><text x="230" y="102">2 s</text><text x="330" y="102">3 s</text>
  </g>
  <text x="130" y="26" font-size="12" fill="#b4232c" text-anchor="middle">this sample goes right</text>
  <text x="80" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">bin labeled 0 s</text>
  <text x="180" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">bin labeled 1 s</text>
  <text x="280" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">bin labeled 2 s</text>
</svg>
```
:::

::: context offset-aliases Old codes you will still see
Older pandas code writes frequencies with capital or odd letters: `"S"` for seconds, `"T"` for minutes (from "time"), `"L"` for milliseconds and `"H"` for hours. pandas 2.2 marked these as deprecated, and pandas 3 no longer accepts them, raising a `ValueError` for "Invalid frequency". The modern spellings are lowercase and easier to read: `"s"`, `"min"`, `"ms"` and `"h"`. When you copy an old snippet from a forum, this is the first thing to fix. Note that `"m"` is not minutes; for a time step, write `"min"`.
:::

::: context causal Why flight code cannot peek ahead
A **causal** filter's output at time $t$ depends only on inputs at time $t$ and before — cause comes before effect. Every filter running live on a vehicle is causal, because the next sample has not been measured yet. The price of causality is delay: a trailing average reports what the signal looked like a little while ago. Control engineers count that delay as phase lag, and too much of it can make a feedback loop oscillate. On the ground, with the whole recording in hand, a centered (non-causal) window is free to use both sides and has no delay at all. Filters designed for the loop and filters used for the review plot are often different for exactly this reason.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <text x="335" y="138" font-size="11" fill="#6c7a93" text-anchor="end">time</text>
  <polyline points="30,100 170,100 170,40 340,40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="30,100 170,100 230,40 340,40" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="30,100 140,100 200,40 340,40" fill="none" stroke="#1d6fd1" stroke-width="2.5" stroke-dasharray="6 4"/>
  <text x="40" y="92" font-size="12" fill="#1f2a44">real step</text>
  <text x="238" y="62" font-size="12" fill="#b4232c">trailing: late</text>
  <text x="206" y="28" font-size="12" fill="#1d6fd1">centered: on time</text>
</svg>
```
:::

::: context dropout When telemetry goes quiet
A **dropout** is a stretch where samples never arrived. On a launch they cluster at predictable moments: at staging, when separating hardware and a fresh plume can block an antenna's view of the ground; when the rocket plume sits between the vehicle and the receiver; and during atmospheric entry, when hot plasma around a capsule blocks radio for minutes at a time. Those are also the moments where the most interesting physics happens. That is why the rule is to mark every filled sample and never let a smooth interpolated line pass for measurement.
:::

::: context split-apply-combine A name for a pattern everyone used
The phrase comes from Hadley Wickham's 2011 paper "The Split-Apply-Combine Strategy for Data Analysis", written about his R package plyr. The idea is much older — SQL has had `GROUP BY` since its early days — but naming it made it easier to teach. The three steps are independent, so a library can run the apply step on each group in parallel, and you can swap in any summary you like.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="16">table</text><text x="170" y="16">split</text><text x="300" y="16">combine</text>
  </g>
  <rect x="20" y="26" width="50" height="16" fill="#8fb8f0"/>
  <rect x="20" y="44" width="50" height="16" fill="#f2b880"/>
  <rect x="20" y="62" width="50" height="16" fill="#8fb8f0"/>
  <rect x="20" y="80" width="50" height="16" fill="#1d6fd1"/>
  <rect x="20" y="98" width="50" height="16" fill="#f2b880"/>
  <rect x="20" y="116" width="50" height="16" fill="#1d6fd1"/>
  <rect x="145" y="30" width="50" height="16" fill="#8fb8f0"/><rect x="145" y="48" width="50" height="16" fill="#8fb8f0"/>
  <rect x="145" y="74" width="50" height="16" fill="#f2b880"/><rect x="145" y="92" width="50" height="16" fill="#f2b880"/>
  <rect x="145" y="118" width="50" height="16" fill="#1d6fd1"/><rect x="145" y="136" width="50" height="16" fill="#1d6fd1"/>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <line x1="78" y1="80" x2="137" y2="80"/><polygon points="137,80 130,76 130,84" fill="#6c7a93"/>
    <line x1="203" y1="47" x2="275" y2="62"/><line x1="203" y1="91" x2="275" y2="80"/><line x1="203" y1="135" x2="275" y2="98"/>
  </g>
  <text x="240" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">apply max</text>
  <rect x="280" y="54" width="44" height="16" fill="#8fb8f0"/>
  <rect x="280" y="72" width="44" height="16" fill="#f2b880"/>
  <rect x="280" y="90" width="44" height="16" fill="#1d6fd1"/>
</svg>
```
:::

::: context monte-carlo Flying the mission a thousand times
A Monte Carlo study runs a simulation many times, each with inputs drawn at random from their expected spread: winds, engine thrust, mass, sensor errors. The ensemble shows how the real flight could turn out. The name was chosen in the 1940s by scientists at Los Alamos, after the Monte Carlo casino in Monaco, because the method runs on random chance. A typical launch vehicle study flies hundreds to thousands of cases, stacked in one long table with a run column — which is exactly the shape groupby is built for.
:::
