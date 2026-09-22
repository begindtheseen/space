---
id: l09-telemetry-csv-hdf5
title: "Telemetry files: reading and plotting CSV and HDF5"
minutes: 21
covers:
  - reading and plotting CSV / HDF5 telemetry
---

A flight produces files. The vehicle's computer logs its navigation state, the IMU's raw rates and accelerations, every actuator command and every mode transition, at rates from $1\,\mathrm{Hz}$ to several kilohertz, and the ground station adds radar tracks and weather. The first task after any test — a hot fire, a drop test, a launch — is to open those files, check that the data is what it claims to be, line the channels up in time, and plot them. Analysis begins only after that, and most of the surprises in a post-flight review are found in this first hour by someone looking at the raw channels.

Two file formats carry most telemetry. *CSV* — comma-separated values — is plain text, one line per sample, a header naming the columns: readable in any editor, understood by every tool, and slow and bulky at scale. *HDF5* is a binary, hierarchical format: a file is a tree of groups containing typed, multi-dimensional datasets with attached metadata, read in slices without loading the whole file. A CSV holds a test stand's ten channels for a minute; an HDF5 file holds a launch's thousand channels for an hour. This lesson reads both, checks them the way a flight-data engineer checks them, aligns channels sampled at different rates, and makes the overview plots.

## CSV: text you can read

A CSV file for altitude versus time looks like this — a header row, then one record per line, fields separated by commas:

```text
t_s,alt_m
0.00,100.0
0.01,100.2
0.02,100.5
0.03,100.9
0.04,101.4
0.05,102.0
0.09,105.3
0.10,106.3
0.11,107.4
```

Notice the header: `t_s` and `alt_m` name the quantity *and its unit*. Adopt this convention in every file you write. A column called `altitude` will be read as metres by one engineer and feet by another; `alt_m` cannot be.

Python's standard `csv` module reads a file row by row as lists or dictionaries of *strings* — everything is text until you convert it. It is the right tool for an odd, irregular file, and the wrong one for a million rows:

```python
import csv, io
text = """t_s,alt_m
0.00,100.0
0.01,100.2
0.02,100.5
0.03,100.9
0.04,101.4
0.05,102.0
0.09,105.3
0.10,106.3
0.11,107.4
"""
rows = list(csv.DictReader(io.StringIO(text)))
print(rows[0])                       # {'t_s': '0.00', 'alt_m': '100.0'}
alt = [float(r["alt_m"]) for r in rows]
print(len(alt), max(alt))            # 9 107.4
```

`io.StringIO(text)` wraps a string so it behaves like an open file, which is how these examples run in the playground; with a real file the same code reads `open("flight.csv")`. NumPy reads numeric CSV directly into an array: `np.loadtxt("flight.csv", delimiter=",", skiprows=1)` gives a 2D `float64` array with one column per field, and `np.genfromtxt(..., names=True)` reads the header too and returns a *structured array* whose columns are reached as `data["alt_m"]`. Both are fine for clean numeric files and give up on anything with timestamps, text or missing fields. For those, and for anything large, use pandas.

## pandas: tables with named columns

pandas is the library for tabular data. Its `DataFrame` is a table whose columns are named NumPy arrays that share an *index* — the row labels, by default `0, 1, 2, \ldots`, and often the time. `read_csv` builds one from a file in a single call, inferring the type of each column:

```python
import numpy as np
import pandas as pd

df = pd.read_csv(io.StringIO(text))
print(df.shape)                      # (9, 2)
print(df.dtypes)                     # t_s      float64
                                     # alt_m    float64
                                     # dtype: object
print(df.head(3))
#     t_s  alt_m
# 0  0.00  100.0
# 1  0.01  100.2
# 2  0.02  100.5
```

A single column, `df["alt_m"]`, is a `Series`: a 1D array with the same index and methods such as `.mean()`, `.max()`, `.diff()`. Whenever a computation is going into NumPy or SciPy, take the raw array with `.to_numpy()`. Rows are selected by *boolean mask*, exactly as in NumPy, or by label with `.loc` and by position with `.iloc`:

```python
alt = df["alt_m"].to_numpy()                 # plain float64 ndarray, shape (9,)
print(round(df["alt_m"].mean(), 2))          # 102.67
high = df[df["alt_m"] > 105.0]               # rows where the mask is True
print(high["t_s"].to_numpy())                # [0.09 0.1  0.11]
print(df.loc[2, "alt_m"], df.iloc[-1, 1])    # 100.5 107.4
```

`read_csv` has arguments for every real-world file: `usecols=[...]` to read only the channels you need from a wide file, `dtype={"mode": "category"}` to force a type, `na_values=["", "NaN", "-999"]` to name the sentinels that mean missing, `comment="#"` to skip commented lines, `parse_dates=["utc"]` to turn a timestamp column into a proper datetime, and `chunksize=` to iterate over a file too large for memory. Missing values become `NaN` in float columns; `df.isna().sum()` counts them per column, `df.dropna()` removes those rows and `df.interpolate()` fills them linearly — a decision to be made consciously and recorded, never silently.

Set the time column as the index with `df = df.set_index("t_s")` when you want to select by time, `df.loc[0.03:0.09]`, or to use pandas' time-series tools. `df.describe()` prints count, mean, standard deviation, minimum, quartiles and maximum of every numeric column — the first thing to print for any new file, because a maximum of $1.0 \times 10^{37}$ or a count that differs between columns is a problem you want to see before plotting.

## Checking telemetry before trusting it

Every file is assumed faulty until four checks pass. They take five lines and catch most of what goes wrong between a sensor and a disk.

**Time is monotonic and the rate is what it should be.** Take the differences of the time column. Their median is the sample period; any difference much larger than that is a *dropout* — a gap where samples were lost — and a zero or negative difference is a duplicated or reordered record.

```python
t = df["t_s"].to_numpy()
dt = np.diff(t)
print(np.round(dt, 3))                 # [0.01 0.01 0.01 0.01 0.01 0.04 0.01 0.01]
dt_med = float(np.median(dt))
print(round(dt_med, 4), round(1.0 / dt_med, 1))     # 0.01 100.0   -> a 100 Hz channel
gaps = t[:-1][dt > 1.5 * dt_med]
print(gaps)                            # [0.05]   a gap begins at t = 0.05 s
print(np.all(dt > 0))                  # True     monotonic, no duplicates
```

This file has a dropout: three samples are missing between $0.05$ and $0.09\,\mathrm{s}$. Anything that assumes a uniform grid — an FFT, a digital filter, a `np.gradient(alt)` without the `t` argument — will be wrong across that gap, so either pass the time array to functions that accept one, or resample onto a uniform grid first and mark the interpolated region on the plot.

**Values are physical.** Compare each channel's range with what the sensor can produce: a rate gyro that reads exactly its full-scale value for ten samples is saturated, an accelerometer reading zero on all three axes is unpowered, an altitude of $-999$ is a sentinel that should have been `NaN`. `df.describe()` shows the extremes; `(df["gyro_x_dps"].abs() >= 300).sum()` counts saturated samples.

**Units and frames are what the header says.** A channel named `vel_mps` with values around 25 000 is in $\mathrm{ft/s}$ or $\mathrm{km/h}$, or is not a velocity. The circular-speed check — $\sqrt{\mu/r} \approx 7.7\,\mathrm{km/s}$ at $400\,\mathrm{km}$ — and a comparison of `np.linalg.norm(acc, axis=1)` with $9.81\,\mathrm{m/s^2}$ on the pad are the kind of sanity test to run on every new source.

**The record is complete.** Compare the first and last timestamps with the test log, and the row count with rate times duration.

::: key
Before analysing a telemetry file: `np.diff(t)` for the sample period, dropouts (`dt > 1.5 × median`) and monotonicity; `df.describe()` for physical ranges and sentinels; a known physical value for units; row count against rate × duration. Name columns with their units — `alt_m`, `gyro_x_dps` — in every file you write.
:::

## Aligning channels sampled at different rates

The IMU logs at $200\,\mathrm{Hz}$, GPS at $5\,\mathrm{Hz}$, and the mode word whenever it changes. Any computation that combines them — subtracting a GPS position from an integrated IMU position — needs them on a common time base. The basic tool is linear interpolation: `np.interp(t_new, t_old, y_old)` evaluates the piecewise-linear curve through `(t_old, y_old)` at the new times. It requires `t_old` increasing, which is the monotonicity check above, and holds the end values constant outside the range, so trim `t_new` to where both channels have data.

```python
t_gyro = np.array([0.0, 0.1, 0.2])            # 10 Hz channel
w_gyro = np.array([0.0, 1.0, 3.0])            # deg/s
t_fast = np.array([0.0, 0.05, 0.1, 0.15, 0.2])   # 20 Hz grid
print(np.interp(t_fast, t_gyro, w_gyro))      # [0.  0.5 1.  2.  3. ]
```

Interpolation invents values between samples; it cannot recover the $50\,\mathrm{Hz}$ content that a $10\,\mathrm{Hz}$ channel never recorded. For a slow channel onto a fast grid it is fine. For a fast channel onto a slow grid, *decimate* instead — low-pass filter with `scipy.signal.decimate` or average over each slow interval — or the fast channel's noise will alias onto the slow grid. Signals that hold a value until the next update, like a mode word or a valve command, want *zero-order hold*: `pd.merge_asof(fast, slow, on="t_s", direction="backward")` attaches to each fast sample the most recent slow record, which is what the vehicle itself saw. Once the index is a time, `df.resample("10ms").mean()` and `df.interpolate(method="index")` do the same jobs on whole tables.

Rates from positions and accelerations from rates come from `np.gradient(y, t)`, which takes central differences with the actual time spacing and one-sided differences at the ends. It amplifies noise — the floating-point lesson's finite-difference trade-off, with sensor noise in place of round-off — so differentiate a low-pass-filtered channel, or use `scipy.signal.savgol_filter(y, window, poly, deriv=1, delta=dt)`, which fits a local polynomial and differentiates that.

```python
print(round(float(np.gradient(alt, t)[2]), 3))    # 35.0   m/s at t = 0.02 s, from (100.9 - 100.2)/0.02
```

::: example Reading, checking and plotting a CSV
A drop-test file `drop.csv` has columns `t_s, alt_m, vz_mps, mode`. Read it, check it, and produce the overview figure.

```python
import matplotlib.pyplot as plt

df = pd.read_csv("drop.csv", na_values=["", "-999"])
print(df.describe())                              # ranges, counts, NaNs at a glance
t = df["t_s"].to_numpy()
dt = np.diff(t)
assert np.all(dt > 0), "time must increase"
dt_med = float(np.median(dt))
gap_starts = t[:-1][dt > 1.5 * dt_med]
print(f"{1/dt_med:.0f} Hz, {len(df)} rows, {len(gap_starts)} dropouts")

vz_fd = np.gradient(df["alt_m"].to_numpy(), t)    # derived rate, to compare with the logged one

fig, axs = plt.subplots(3, 1, sharex=True, figsize=(6.5, 7.0), constrained_layout=True)
axs[0].plot(t, df["alt_m"], label="alt_m")
axs[1].plot(t, df["vz_mps"], label="logged vz")
axs[1].plot(t, vz_fd, lw=0.8, alpha=0.7, label="d(alt)/dt")
axs[2].step(t, df["mode"], where="post")
for ax, lab in zip(axs, ("altitude  [m]", "vertical speed  [m/s]", "mode")):
    ax.set_ylabel(lab); ax.grid(True)
for g in gap_starts:
    for ax in axs:
        ax.axvspan(g, g + 1.5 * dt_med, color="C3", alpha=0.3)   # mark the dropouts
axs[1].legend()
axs[2].set_xlabel("time  [s]")
fig.suptitle(f"drop.csv — {1/dt_med:.0f} Hz, {len(gap_starts)} dropouts")
fig.savefig("drop_overview.png", dpi=200, bbox_inches="tight")
```

The figure carries its own checks. The logged vertical speed and the differentiated altitude should lie on top of each other; where they part company, either the altitude has a dropout (marked in red) or one of the two channels has a scale or sign error. The mode panel, drawn with `step` because a mode holds until it changes, shows whether the transitions happen where the physics says they should — parachute deploy at the altitude the logic specifies, for instance. Any structure in the altitude curve that has no corresponding mode change is the first thing to ask about in the review.
:::

## HDF5: hierarchical binary data

An HDF5 file is a filesystem inside a file. *Groups* are directories, *datasets* are typed n-dimensional arrays, and both carry *attributes* — small named values for metadata: units, sample rate, sensor serial number, the git hash of the software that wrote the file. Datasets are stored in *chunks*, optionally compressed, and a read of `f["imu/gyro"][1000:2000]` fetches only the chunks it needs. A gigabyte file opens in a millisecond.

The `h5py` library maps this onto Python dictionaries and NumPy arrays. Always open a file in a `with` block so it is closed and flushed even if an error interrupts you:

```python
import h5py

rng = np.random.default_rng(0)
t_imu = np.arange(0.0, 10.0, 0.005)                    # 200 Hz for 10 s -> 2000 samples
gyro = rng.normal(0.0, 0.02, size=(t_imu.size, 3))      # rad/s, noise only

with h5py.File("flight.h5", "w") as f:
    f.attrs["vehicle"] = "test-article-3"
    f.attrs["software_git_hash"] = "2646e52"
    imu = f.create_group("imu")
    imu.attrs["rate_hz"] = 200.0
    d_t = imu.create_dataset("t", data=t_imu)
    d_t.attrs["units"] = "s"
    d_g = imu.create_dataset("gyro", data=gyro, compression="gzip", chunks=(500, 3))
    d_g.attrs["units"] = "rad/s"
    d_g.attrs["frame"] = "body, x forward, z down"

with h5py.File("flight.h5", "r") as f:
    print(list(f.keys()))                    # ['imu']
    print(list(f["imu"].keys()))             # ['gyro', 't']
    g = f["imu/gyro"]
    print(g.shape, g.dtype)                  # (2000, 3) float64
    print(g.attrs["units"], f["imu"].attrs["rate_hz"])    # rad/s 200.0
    wz_first_second = g[:200, 2]             # reads only that slice from disk
    print(wz_first_second.shape)             # (200,)
    f.visititems(lambda name, obj: print(name, getattr(obj, "shape", "")))
    # imu
    # imu/gyro (2000, 3)
    # imu/t (2000,)
```

`f["imu/gyro"]` is a *dataset object*, not yet an array: it knows its shape and dtype without reading the data. Indexing it — `g[:200, 2]`, or `g[...]` for everything — performs the read and returns a NumPy array. `list(f.keys())` and `visititems` walk the tree; `dict(g.attrs)` shows all attributes. Write units and frames into attributes every time, and read them back rather than assuming: `f["imu/gyro"].attrs["units"]` is the file's own statement of what its numbers mean.

pandas offers `df.to_hdf("file.h5", key="nav")` and `pd.read_hdf(...)` through the PyTables library, convenient for a table but producing a layout only pandas reads cleanly; for files other tools and other teams will open, write plain datasets with `h5py`. The `h5dump -H flight.h5` command-line tool, or the HDFView application, shows a file's structure without any Python at all.

::: example Extracting one channel from a large HDF5 log
A $3\,\mathrm{GB}$ file `launch.h5` holds `/imu/gyro` at $1\,\mathrm{kHz}$ and `/nav/pos_ecef_m` at $50\,\mathrm{Hz}$ for a $600\,\mathrm{s}$ flight. You need the body $z$-rate during the $30\,\mathrm{s}$ around staging at $t = 150\,\mathrm{s}$, and the navigation altitude over the same window, on the IMU's time base.

```python
with h5py.File("launch.h5", "r") as f:
    t_imu = f["imu/t"]                       # dataset objects: nothing read yet
    i0, i1 = np.searchsorted(t_imu[...], [135.0, 165.0])
    t_win = t_imu[i0:i1]                     # 30 s at 1 kHz -> about 30 000 samples
    wz = f["imu/gyro"][i0:i1, 2]
    assert f["imu/gyro"].attrs["units"] == "rad/s"

    t_nav = f["nav/t"][...]
    pos = f["nav/pos_ecef_m"][...]           # (30000, 3) at 50 Hz: small enough to read whole
    r = np.linalg.norm(pos, axis=1)          # geocentric radius, m
    alt_nav = r - 6_378_137.0                # crude altitude above the equatorial radius

alt_win = np.interp(t_win, t_nav, alt_nav)   # 50 Hz altitude onto the 1 kHz IMU grid

fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True, figsize=(6.5, 5.0), constrained_layout=True)
ax1.plot(t_win, np.degrees(wz), lw=0.6); ax1.set_ylabel("body z-rate  [deg/s]"); ax1.grid(True)
ax2.plot(t_win, alt_win / 1e3);            ax2.set_ylabel("altitude  [km]");        ax2.grid(True)
for ax in (ax1, ax2):
    ax.axvline(150.0, color="0.5", ls="--", lw=1)
ax2.set_xlabel("time since liftoff  [s]")
fig.suptitle("launch.h5 — staging window, IMU 1 kHz, nav 50 Hz interpolated")
fig.savefig("staging_window.png", dpi=200, bbox_inches="tight")
```

`np.searchsorted` on the time dataset finds the indices bracketing the window, and only those $30\,000$ rows of the gyro dataset are read — a few hundred kilobytes out of three gigabytes. The $50\,\mathrm{Hz}$ altitude is interpolated *up* onto the IMU grid, which is legitimate because altitude changes slowly compared to $50\,\mathrm{Hz}$; interpolating the $1\,\mathrm{kHz}$ gyro *down* onto the nav grid would have to be done with a decimating filter instead. The staging event is marked with a reference line so that the rate transient and any altitude anomaly can be compared at the same instant.
:::

::: warning Reading a whole dataset when you need a slice
`np.array(f["imu/gyro"])` or `f["imu/gyro"][...]` loads everything. On a $3\,\mathrm{GB}$ file that is a long wait and possibly a crash. Index the dataset object directly with the slice you need, and use `np.searchsorted` on the time dataset to turn a time window into indices. The same applies to `read_csv` on a huge text file: `usecols=` and `chunksize=` exist for this reason.
:::

::: warning Timestamps without a stated epoch or zone
A `t_s` column that starts at $1\,712\,345\,678.2$ is seconds since the Unix epoch, and one that starts at $0$ is seconds since *something* — power-on, liftoff, the first sample — which the file must say. Convert to a common time base (`pd.to_datetime(df["t_s"], unit="s", utc=True)` for Unix time) before combining sources, record the epoch as a file attribute or in the header, and never assume two computers' clocks agree; a constant offset between an IMU log and a radar track is a routine finding.
:::

## Check yourself

::: check
`np.loadtxt("nav.csv", delimiter=",", skiprows=1)` raises `ValueError: could not convert string to float: '2026-03-01T12:00:00Z'`. What is happening, and what should you use?
:::

::: answer
The first column is an ISO-8601 timestamp, text that `loadtxt` cannot turn into a float — it handles purely numeric files. Read the file with `pd.read_csv("nav.csv", parse_dates=["utc"])`, which converts that column to datetimes and leaves the numeric columns as `float64`; then derive a seconds-since-liftoff column with `(df["utc"] - t0).dt.total_seconds()` for use in NumPy. Alternatively `np.loadtxt(..., usecols=range(1, n))` skips the timestamp, but throws away the time base.
:::

::: check
The differences of a $100\,\mathrm{Hz}$ channel's time column have a median of $0.01\,\mathrm{s}$, a minimum of $0.0\,\mathrm{s}$ and a maximum of $2.3\,\mathrm{s}$. Describe what each of those three numbers tells you and what to do about it.
:::

::: answer
The median confirms the nominal rate. A minimum of zero means at least one duplicated timestamp — the same record logged twice, or two sensors' samples stamped by a coarse clock — so `np.interp` and any FFT will misbehave; find them with `t[:-1][dt == 0]`, then drop duplicates (`df.drop_duplicates("t_s")`) or average them, and record that you did. A maximum of $2.3\,\mathrm{s}$ is a dropout of about 230 samples; locate its start with `t[:-1][dt > 0.015]`, shade it on every plot, and either leave it as a gap (`NaN`s on a uniform grid, which matplotlib leaves blank) or interpolate across it with a clear note. Never let a filter run across a $2.3\,\mathrm{s}$ hole as if it were one sample.
:::

::: check
Why is `np.interp` the wrong tool for putting a $1\,\mathrm{kHz}$ accelerometer channel onto a $10\,\mathrm{Hz}$ GPS time base, and what should be used?
:::

::: answer
`np.interp` picks the value of the piecewise-linear curve at each $10\,\mathrm{Hz}$ instant — effectively one sample in a hundred, ignoring the other 99. The high-frequency content of the accelerometer (vibration at tens or hundreds of hertz) does not disappear; it *aliases*, appearing in the $10\,\mathrm{Hz}$ series as spurious low-frequency wander. Decimate instead: low-pass filter below $5\,\mathrm{Hz}$ (the new Nyquist frequency) and then sample, which `scipy.signal.decimate(x, 100)` does in one call (in stages for large factors), or average each $0.1\,\mathrm{s}$ block with `df.resample("100ms").mean()`.
:::

::: check
A colleague stores a flight's telemetry as one CSV per channel, 400 files, with times as strings like `"00:02:13.450"`. List three concrete costs of this layout and the HDF5 structure you would propose instead.
:::

::: answer
Costs: every read parses text and converts time strings, so opening the set takes minutes rather than milliseconds; each file has its own time column and nothing records the rate, units or frame of the channel except the file name; and there is no way to read a time window without reading the whole file. Proposal: one `flight.h5` with a group per source (`/imu`, `/nav`, `/actuators`), a shared `t` dataset per group in float64 seconds since a stated epoch (an attribute on the root), one dataset per channel or one `(n, 3)` dataset per vector quantity, compression on the large ones, and `units`, `frame` and `rate_hz` attributes on every dataset — so that `f["imu/gyro"][i0:i1]` reads a window directly and `f["imu/gyro"].attrs["units"]` answers the question the file name used to.
:::

::: check
In the CSV example the derived rate `np.gradient(alt, t)` is noisier than the logged `vz_mps`. Is that a bug?
:::

::: answer
No, it is expected. Differentiation amplifies noise: a position error of $\delta$ per sample becomes a rate error of about $\delta / \Delta t$ — at $100\,\mathrm{Hz}$, a centimetre of altitude noise is a metre per second of rate noise. The logged `vz_mps` almost certainly comes from the navigation filter, which combines the accelerometer with the position measurement and is far smoother. The derived rate is still worth plotting: its *mean* should track the logged rate, and a constant offset or a scale difference between them reveals a units or sign error that neither channel shows on its own. To compare like with like, smooth first — `savgol_filter(alt, 21, 3, deriv=1, delta=dt_med)` — or low-pass both.
:::

## Summary

| Task | Call |
| --- | --- |
| Small or odd CSV | `csv.DictReader(open(path))` → rows of strings; convert with `float()` |
| Numeric CSV to array | `np.loadtxt(path, delimiter=",", skiprows=1)`; `np.genfromtxt(path, delimiter=",", names=True)` |
| CSV to table | `pd.read_csv(path, usecols=, dtype=, na_values=, comment="#", parse_dates=[...], chunksize=)` |
| Inspect | `df.shape`, `df.dtypes`, `df.head()`, `df.describe()`, `df.isna().sum()` |
| Select | `df["col"]`, `df["col"].to_numpy()`, `df[mask]`, `df.loc[label, col]`, `df.iloc[i, j]`, `df.set_index("t_s")` |
| Check time | `dt = np.diff(t)`; period `np.median(dt)`; dropouts `t[:-1][dt > 1.5 * med]`; `np.all(dt > 0)` |
| Align | up: `np.interp(t_new, t_old, y_old)`; down: `signal.decimate`, `df.resample(...).mean()`; hold: `pd.merge_asof(..., direction="backward")` |
| Differentiate | `np.gradient(y, t)`; smoother: `signal.savgol_filter(y, w, p, deriv=1, delta=dt)` |
| HDF5 write | `with h5py.File(p, "w") as f:` `f.create_group`, `g.create_dataset(name, data=, compression="gzip", chunks=)`, `.attrs["units"] = "m"` |
| HDF5 read | `f["imu/gyro"]` (lazy), `[i0:i1, 2]` (slice read), `[...]` (all), `.shape`, `.dtype`, `.attrs`, `list(f.keys())`, `f.visititems(fn)` |
| Window by time | `i0, i1 = np.searchsorted(t, [t_start, t_end])` |
| Plot | stacked `plt.subplots(n, 1, sharex=True)`; `ax.step(t, mode, where="post")`; `ax.axvspan(a, b, alpha=0.3)` for gaps |

This closes the module. You can now write a tested, version-controlled Python module, vectorise a Monte Carlo, integrate and optimise with SciPy at tolerances you have chosen deliberately, read the files a flight produces, and turn the results into figures that carry their own evidence. The linear-algebra modules that follow use every one of these tools, starting with NumPy arrays as matrices and `scipy.linalg` as the solver.
