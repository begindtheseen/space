---
id: l09-telemetry-csv-hdf5
title: "Telemetry files: reading and plotting CSV and HDF5"
minutes: 22
covers:
  - reading and plotting CSV / HDF5 telemetry
---

A flight produces files. The vehicle's computer writes down its navigation state, the raw readings of its motion sensors, every command to the actuators (the motors and valves that move things) and every change of mode — anywhere from once a second to thousands of times a second. The ground station adds radar tracks and weather. All of that recorded flight data is called **[[telemetry|telemetry-word]]**.

The first job after any test — an engine firing, a drop test, a launch — is to open those files, check that the data is what it claims to be, line the channels up in time, and plot them. Analysis starts only after that. Most surprises in a post-flight review are found in this first hour, by someone looking at the raw channels.

Two file formats carry most telemetry:

- **CSV**, comma-separated values: plain text, one line per sample, a header naming the columns. Readable in any editor and understood by every tool, but slow and bulky at scale.
- **HDF5**: a binary format arranged like folders of files. A file is a tree of groups holding typed, multi-dimensional arrays with notes attached, and you can read a slice without loading the whole file.

A CSV holds a test stand's ten channels for a minute. An HDF5 file holds a launch's thousand channels for an hour. This lesson reads both, checks them the way a flight-data engineer does, lines up channels recorded at different rates, and makes the overview plots.

## CSV: text you can read

Think of a CSV as a spreadsheet written out as plain text, with commas between the cells. Here is altitude against time — a header row, then one record per line:

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

Look at the header: `t_s` and `alt_m` name the quantity *and its unit* (time in seconds, altitude in meters). Use this habit in every file you write. A column called `altitude` will be read as meters by one engineer and feet by another; `alt_m` cannot be misread.

Python's built-in `csv` module reads a file row by row, as lists or dictionaries of *strings* — everything is text until you convert it. It is the right tool for an odd, irregular file, and the wrong one for a million rows:

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

`io.StringIO(text)` wraps a string so it behaves like an open file, which lets these examples run without a file on disk. With a real file, the same code reads `open("flight.csv")`.

NumPy can read a purely numeric CSV straight into an array. `np.loadtxt("flight.csv", delimiter=",", skiprows=1)` gives a 2D `float64` array with one column per field. `np.genfromtxt(..., names=True)` reads the header too and returns a **structured array**, whose columns you reach by name, as `data["alt_m"]`. Both are fine for clean numbers and give up on timestamps, text or missing fields. For those, and for anything large, use pandas.

## pandas: tables with named columns

**pandas** is Python's library for tables. Its main object, the **[[DataFrame|dataframe]]**, is a table whose columns are named NumPy arrays sharing one **index** — the row labels. By default the index is $0, 1, 2, \ldots$; often it is the time. `read_csv` builds a DataFrame from a file in one call and guesses each column's type:

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

`df.shape` is (rows, columns); `df.dtypes` shows each column's type; `df.head(3)` prints the first three rows.

A single column, `df["alt_m"]`, is a **Series**: a 1D array with the same index and handy methods like `.mean()`, `.max()` and `.diff()`. When a calculation is headed into NumPy or SciPy, take the plain array with `.to_numpy()`.

You pick rows three ways. A **boolean mask** — a True/False list, one per row — works exactly as in NumPy. `.loc` picks by label. `.iloc` picks by position, counting from zero:

```python
alt = df["alt_m"].to_numpy()                 # plain float64 ndarray, shape (9,)
print(round(df["alt_m"].mean(), 2))          # 102.67
high = df[df["alt_m"] > 105.0]               # rows where the mask is True
print(high["t_s"].to_numpy())                # [0.09 0.1  0.11]
print(df.loc[2, "alt_m"], df.iloc[-1, 1])    # 100.5 107.4
```

Check the mean by hand: the nine altitudes add up to $924.0$, and $924.0 / 9 = 102.67$.

`read_csv` has an argument for every messy real-world file:

- `usecols=[...]` reads only the channels you need from a wide file;
- `dtype={"mode": "category"}` forces a column's type;
- `na_values=["", "NaN", "-999"]` lists the **[[sentinels|sentinel]]** — stand-in values that mean "missing";
- `comment="#"` skips comment lines;
- `parse_dates=["utc"]` turns a timestamp column into real dates and times;
- `chunksize=` walks through a file too big for memory, piece by piece.

Missing values become `NaN` ("not a number") in number columns. `df.isna().sum()` counts them per column. `df.dropna()` removes those rows, and `df.interpolate()` fills them in along a straight line. Filling or dropping is a decision: make it on purpose and write it down, never silently.

`df = df.set_index("t_s")` makes time the index, so you can select by time, as in `df.loc[0.03:0.09]`, and use pandas' time-series tools. And `df.describe()` prints the count, mean, standard deviation, minimum, quartiles (the values a quarter and three quarters of the way up the sorted list) and maximum of every number column. Print it first for any new file. A maximum of $1.0 \times 10^{37}$, or a count that differs between columns, is a problem you want to see before plotting.

## Checking telemetry before trusting it

Treat every file like a used car: assume something is wrong until it passes inspection. Four checks, a few lines each, catch most of what goes wrong between a sensor and a disk.

**1. Time only moves forward, at the rate it should.** Take the differences between neighboring times. Their middle value, the **median**, is the **sample period** — the time between samples. A difference much bigger than that is a **[[dropout|dropout]]**, a gap where samples were lost. A zero or negative difference means a duplicated or shuffled record.

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

Read the output. The period is $0.01\,\mathrm{s}$, so the rate is $1/0.01 = 100$ samples per second, $100\,\mathrm{Hz}$. One step is $0.04\,\mathrm{s}$ instead of $0.01$: three samples are missing between $0.05$ and $0.09\,\mathrm{s}$. And every step is positive, so time is **monotonic** — it never goes backward.

That gap matters. Anything that assumes evenly spaced samples — a spectrum, a digital filter, `np.gradient(alt)` without the `t` argument — will be wrong across it. Either pass the time array to functions that accept one, or **resample** onto an even grid first and mark the filled-in stretch on the plot.

**2. Values are physically possible.** Compare each channel's range with what the sensor can produce. A rate gyro reading exactly its maximum for ten samples is **saturated** — pinned at the top of its scale. An accelerometer reading zero on all three axes is unpowered. An altitude of $-999$ is a sentinel that should have been `NaN`. `df.describe()` shows the extremes; `(df["gyro_x_dps"].abs() >= 300).sum()` counts samples pinned at a $300^\circ/\mathrm{s}$ limit.

**3. Units and frames match the header.** A channel named `vel_mps` (velocity, meters per second) with values around 25 000 is really in feet per second or kilometers per hour — or is not a velocity at all. Test every new source against a number you know: circular orbit speed $\sqrt{\mu/r} \approx 7.7\,\mathrm{km/s}$ at $400\,\mathrm{km}$, or `np.linalg.norm(acc, axis=1)` reading $9.81\,\mathrm{m/s^2}$ while the vehicle sits on the pad.

**4. The record is complete.** Compare the first and last times with the test log, and the row count with rate × duration.

::: key
Before analysing a telemetry file: `np.diff(t)` for the sample period, dropouts (`dt > 1.5 × median`) and monotonicity; `df.describe()` for physical ranges and sentinels; a known physical value for units; row count against rate × duration. Name columns with their units — `alt_m`, `gyro_x_dps` — in every file you write.
:::

## Lining up channels recorded at different rates

The motion sensor logs $200$ times a second, GPS $5$ times a second, and the mode word only when it changes. Any calculation that combines them — say, comparing GPS position with position worked out from the motion sensor — needs them on one shared set of times.

The basic tool is **linear interpolation**: connect neighboring samples with straight lines and read values off those lines. `np.interp(t_new, t_old, y_old)` does exactly that at the new times. It needs `t_old` increasing — the monotonic check above. Outside the data it repeats the end values, so trim `t_new` to where both channels have data.

```python
t_gyro = np.array([0.0, 0.1, 0.2])            # 10 Hz channel
w_gyro = np.array([0.0, 1.0, 3.0])            # deg/s
t_fast = np.array([0.0, 0.05, 0.1, 0.15, 0.2])   # 20 Hz grid
print(np.interp(t_fast, t_gyro, w_gyro))      # [0.  0.5 1.  2.  3. ]
```

At $t = 0.05$, halfway between $0$ and $1$, you get $0.5$. At $t = 0.15$, halfway between $1$ and $3$, you get $2$.

Interpolation invents values between samples. It cannot recover wiggles faster than the slow channel ever recorded. So it is fine for moving a slow channel onto a fast grid. Going the other way — a fast channel onto a slow grid — you must **decimate** instead: smooth first with a low-pass filter (`scipy.signal.decimate` does this), or average over each slow interval. Otherwise the fast channel's noise **[[aliases|aliasing]]** onto the slow grid, showing up as fake slow wander.

Some signals hold a value until the next update, like a mode word or a valve command. Those want a **[[zero-order hold|zero-order-hold]]**: keep the last value, no in-between. `pd.merge_asof(fast, slow, on="t_s", direction="backward")` attaches to each fast sample the most recent slow record — exactly what the vehicle itself saw. Once the index is a time, `df.resample("10ms").mean()` and `df.interpolate(method="index")` do the same jobs on whole tables.

Rates from positions, and accelerations from rates, come from `np.gradient(y, t)`. It takes the change across neighboring samples divided by the actual time between them, using the samples on both sides where it can and one side at the ends. It amplifies noise — the floating-point lesson's finite-difference trade-off, with sensor noise in place of round-off. So differentiate a smoothed channel, or use `scipy.signal.savgol_filter(y, window, poly, deriv=1, delta=dt)`, which fits a small polynomial to each stretch of samples and differentiates that.

```python
print(round(float(np.gradient(alt, t)[2]), 3))    # 35.0   m/s at t = 0.02 s, from (100.9 - 100.2)/0.02
```

At sample 2 ($t = 0.02\,\mathrm{s}$) it uses the samples on either side: $(100.9 - 100.2)/(0.03 - 0.01) = 0.7/0.02 = 35.0\,\mathrm{m/s}$.

::: example Reading, checking and plotting a CSV
A drop-test file `drop.csv` has columns `t_s, alt_m, vz_mps, mode`: time, altitude, vertical speed and flight mode. Read it, check it, and make the overview figure.

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

Step by step: read the file, turning `-999` into `NaN`; print the summary; run the time checks; compute a vertical speed of our own from the altitude; then draw three stacked panels. `ax.axvspan` shades a vertical band in red over each dropout.

The figure carries its own checks. The logged vertical speed and the one worked out from altitude should lie on top of each other. Where they part, either the altitude has a dropout (shaded red) or one channel has a scale or sign error.

The mode panel uses `step`, because a mode holds until it changes. It shows whether each switch happens where the physics says it should — the parachute opening at the altitude the logic specifies, for instance. Any bump in the altitude with no matching mode change is the first question to ask in the review.
:::

## HDF5: a filesystem inside a file

Picture a [[filing cabinet in one file|hdf5-history]]. **Groups** are the drawers and folders. **Datasets** are the documents: typed arrays of any number of dimensions. Both carry **attributes** — small named labels for **metadata**, the data about the data: units, sample rate, sensor serial number, the git hash of the software that wrote the file.

Datasets are stored in **[[chunks|hdf5-chunks]]**, blocks that can be compressed. A read of `f["imu/gyro"][1000:2000]` fetches only the chunks it needs. So a gigabyte file opens in a millisecond.

The `h5py` library maps all this onto Python dictionaries and NumPy arrays. Always open a file in a `with` block, so it is closed and saved properly even if an error interrupts you:

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

The first half writes a file: made-up gyro noise at $200\,\mathrm{Hz}$ for $10\,\mathrm{s}$ ($200 \times 10 = 2000$ samples, three axes), stored in an `imu` group — **IMU** is the inertial measurement unit, the vehicle's motion-sensor package — with units and frame as attributes. `"w"` means write, `"r"` means read.

`f["imu/gyro"]` is a *dataset object*, not yet an array. It knows its shape and type without reading any data. Indexing it — `g[:200, 2]`, or `g[...]` for everything — does the read and returns a NumPy array. Here `g[:200, 2]` is the first second ($200$ samples) of the $z$-axis rate. `list(f.keys())` and `visititems` walk the tree; `dict(g.attrs)` shows all attributes. Write units and frames into attributes every time, and read them back rather than assuming: `f["imu/gyro"].attrs["units"]` is the file's own statement of what its numbers mean.

pandas can write HDF5 too (`df.to_hdf("file.h5", key="nav")` and `pd.read_hdf(...)`, through the PyTables library). That is handy for one table, but the layout is one only pandas reads cleanly. For files other tools and teams will open, write plain datasets with `h5py`. To peek inside any file without Python, use the command `h5dump -H flight.h5` or the HDFView application.

::: example Extracting one channel from a large HDF5 log
A $3\,\mathrm{GB}$ file `launch.h5` holds `/imu/gyro` at $1\,\mathrm{kHz}$ and `/nav/pos_ecef_m` (navigation position, in an Earth-centered frame) at $50\,\mathrm{Hz}$, for a $600\,\mathrm{s}$ flight. You need the body $z$-rate during the $30\,\mathrm{s}$ around staging at $t = 150\,\mathrm{s}$, and the navigation altitude over the same window, on the IMU's times.

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

First, find the window. `np.searchsorted` looks up where $135$ and $165\,\mathrm{s}$ fall in the time list and returns their positions, `i0` and `i1`. Reading the full time list costs $600 \times 1000 = 600\,000$ numbers, about $4.8\,\mathrm{MB}$ — small. Then only the $30 \times 1000 = 30\,000$ rows of the gyro inside the window are read: about $240\,\mathrm{kB}$ out of three gigabytes.

The navigation data is small ($600 \times 50 = 30\,000$ rows), so we read it whole. The distance from Earth's center minus Earth's equatorial radius gives a rough altitude.

Next, `np.interp` moves the $50\,\mathrm{Hz}$ altitude *up* onto the IMU's $1\,\mathrm{kHz}$ times. That is safe, because altitude changes slowly compared with $50\,\mathrm{Hz}$. Moving the gyro *down* onto the navigation times would need a decimating filter instead. Finally, a dashed line marks staging, so the rate spike and any altitude change can be compared at the same instant.
:::

::: warning Reading a whole dataset when you need a slice
`np.array(f["imu/gyro"])` or `f["imu/gyro"][...]` loads everything. On a $3\,\mathrm{GB}$ file that is a long wait and possibly a crash. Index the dataset object directly with the slice you need, and use `np.searchsorted` on the time dataset to turn a time window into positions. The same goes for `read_csv` on a huge text file: `usecols=` and `chunksize=` exist for this reason.
:::

::: warning Timestamps without a stated epoch or zone
A time has to be counted *from* something, called its **[[epoch|epoch]]**. A `t_s` column starting at $1\,712\,345\,678.2$ is seconds since the Unix epoch. One starting at $0$ is seconds since *something* — power-on, liftoff, the first sample — and the file must say what. Convert to a shared time base (`pd.to_datetime(df["t_s"], unit="s", utc=True)` for Unix time) before combining sources, and record the epoch as an attribute or in the header. Never assume two computers' clocks agree: a constant offset between an IMU log and a radar track is a routine finding.
:::

## Check yourself

::: check
`np.loadtxt("nav.csv", delimiter=",", skiprows=1)` fails with `ValueError: could not convert string to float: '2026-03-01T12:00:00Z'`. What is happening, and what should you use?
:::

::: answer
The first column is a timestamp written as text (the ISO-8601 standard format), which `loadtxt` cannot turn into a number — it handles purely numeric files only.

Read the file with `pd.read_csv("nav.csv", parse_dates=["utc"])`. That converts the timestamp column into dates and times and leaves the number columns as `float64`. Then make a seconds-since-liftoff column with `(df["utc"] - t0).dt.total_seconds()` for use in NumPy. Alternatively, `np.loadtxt(..., usecols=range(1, n))` skips the timestamp column — but throws away the times.
:::

::: check
The time differences of a $100\,\mathrm{Hz}$ channel have a median of $0.01\,\mathrm{s}$, a minimum of $0.0\,\mathrm{s}$ and a maximum of $2.3\,\mathrm{s}$. What does each number tell you, and what do you do about it?
:::

::: answer
The median confirms the expected rate: $1/0.01 = 100\,\mathrm{Hz}$.

A minimum of zero means at least one repeated timestamp — the same record logged twice, or two samples stamped by a coarse clock. `np.interp` and any spectrum will misbehave. Find them with `t[:-1][dt == 0]`, then drop the repeats (`df.drop_duplicates("t_s")`) or average them, and write down that you did.

A maximum of $2.3\,\mathrm{s}$ is a dropout of about $2.3 / 0.01 = 230$ samples. Find where it starts with `t[:-1][dt > 0.015]` and shade it on every plot. Either leave it as a gap (`NaN`s on an even grid, which matplotlib leaves blank) or interpolate across it with a clear note. Never let a filter run across a $2.3\,\mathrm{s}$ hole as if it were one sample.
:::

::: check
Why is `np.interp` the wrong tool for putting a $1\,\mathrm{kHz}$ accelerometer channel onto a $10\,\mathrm{Hz}$ GPS time base, and what should you use instead?
:::

::: answer
`np.interp` reads the straight-line curve at each $10\,\mathrm{Hz}$ instant — in effect one sample in a hundred, ignoring the other 99. The accelerometer's fast content (vibration at tens or hundreds of hertz) does not disappear. It *aliases*: it shows up in the $10\,\mathrm{Hz}$ series as fake slow wander.

Decimate instead. Low-pass filter below $5\,\mathrm{Hz}$ — the new Nyquist frequency, half of $10\,\mathrm{Hz}$ — and then sample. `scipy.signal.decimate(x, 100)` does this in one call (in stages, for a factor this big), or average each $0.1\,\mathrm{s}$ block with `df.resample("100ms").mean()`.
:::

::: check
A colleague stores a flight's telemetry as one CSV per channel — 400 files — with times as strings like `"00:02:13.450"`. List three concrete costs of this layout, and describe the HDF5 layout you would propose.
:::

::: answer
Costs:

1. Every read parses text and converts time strings, so opening the set takes minutes instead of milliseconds.
2. Each file has its own time column, and nothing but the file name records the channel's rate, units or frame.
3. There is no way to read a time window without reading the whole file.

Proposal: one `flight.h5` with a group per source (`/imu`, `/nav`, `/actuators`). Each group gets a shared `t` dataset in float64 seconds since a stated epoch (recorded as an attribute on the root). Store one dataset per channel, or one `(n, 3)` dataset per vector quantity, compress the large ones, and put `units`, `frame` and `rate_hz` attributes on every dataset. Then `f["imu/gyro"][i0:i1]` reads a window directly, and `f["imu/gyro"].attrs["units"]` answers the question the file name used to.
:::

::: check
In the CSV example, the rate worked out with `np.gradient(alt, t)` is noisier than the logged `vz_mps`. Is that a bug?
:::

::: answer
No, it is expected. Differentiating amplifies noise. An altitude error of $\delta$ per sample becomes a rate error of about $\delta / \Delta t$. At $100\,\mathrm{Hz}$, $\Delta t = 0.01\,\mathrm{s}$, so a centimeter of altitude noise becomes $0.01 / 0.01 = 1\,\mathrm{m/s}$ of rate noise.

The logged `vz_mps` almost certainly comes from the navigation filter, which blends the accelerometer with the position measurement and is far smoother. The derived rate is still worth plotting. Its *average* should track the logged rate, and a constant offset or scale difference between the two reveals a units or sign error that neither channel shows alone. To compare like with like, smooth first — `savgol_filter(alt, 21, 3, deriv=1, delta=dt_med)` — or low-pass both.
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

This closes the module. You can now write a tested, version-controlled Python module, vectorize a Monte Carlo, integrate and optimize with SciPy at tolerances you chose on purpose, read the files a flight produces, and turn the results into figures that carry their own evidence. The linear-algebra modules that follow use every one of these tools, starting with NumPy arrays as matrices and `scipy.linalg` as the solver.

::: context telemetry-word Measuring from far away
The word is Greek: *tele*, "far off" (as in telephone and television), plus *metron*, "measure". Telemetry is measurement made in one place and read in another — originally sent by radio from a flying vehicle to the ground, now also the logs saved on board and pulled off after landing.
:::

::: context dataframe Where pandas came from
Wes McKinney started writing pandas in 2008 while working with financial data at the investment firm AQR, and it was released as open source in 2009. The name comes from "panel data", an economists' term for tables of measurements over time. The DataFrame idea itself was borrowed from the R language, where tables of named columns had long been the everyday way to hold data.
:::

::: context sentinel A fake value standing guard
A sentinel is a guard, and a sentinel value stands in the spot where a real reading should be, meaning "nothing here". Old systems could not store an empty number, so they wrote $-999$ or $9999$. The danger is forgetting: average a column with a few $-999$s left in, and the mean is dragged far off with no error at all. Tell pandas the sentinel with `na_values`, and it becomes a proper `NaN`.
:::

::: context dropout What a dropout looks like
The samples below are the CSV from this lesson: one every $0.01\,\mathrm{s}$, until three go missing after $0.05\,\mathrm{s}$. The time step there is $0.04\,\mathrm{s}$ — four times the median — which is exactly what `dt > 1.5 * dt_med` catches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30" cy="60" r="5" fill="#1d6fd1"/><circle cx="55" cy="60" r="5" fill="#1d6fd1"/><circle cx="80" cy="60" r="5" fill="#1d6fd1"/><circle cx="105" cy="60" r="5" fill="#1d6fd1"/><circle cx="130" cy="60" r="5" fill="#1d6fd1"/><circle cx="155" cy="60" r="5" fill="#1d6fd1"/><circle cx="255" cy="60" r="5" fill="#1d6fd1"/><circle cx="280" cy="60" r="5" fill="#1d6fd1"/><circle cx="305" cy="60" r="5" fill="#1d6fd1"/><circle cx="180" cy="60" r="5" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="205" cy="60" r="5" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="230" cy="60" r="5" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="2,2"/><text x="30" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">0.00</text><text x="155" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">0.05</text><text x="255" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">0.09</text>
  <text x="205" y="32" font-size="12" text-anchor="middle" fill="#b4232c">3 samples lost</text>
  <text x="340" y="88" font-size="11" text-anchor="end" fill="#1f2a44">t [s]</text>
</svg>
```
:::

::: context aliasing A fast wave in disguise
The grey curve wiggles $9$ times a second. Sampled only $10$ times a second (red dots), the samples fall exactly on the slow blue curve, which turns once a second. From the samples alone you cannot tell the two apart. This is why a fast channel must be smoothed *before* it is thinned out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30.0,70.0 31.0,62.5 32.0,55.3 33.0,48.6 34.0,42.6 35.0,37.6 36.0,33.8 37.0,31.3 38.0,30.1 39.0,30.3 40.0,32.0 41.0,34.9 42.0,39.2 43.0,44.5 44.0,50.7 45.0,57.6 46.0,65.0 47.0,72.5 48.0,79.9 49.0,87.0 50.0,93.5 51.0,99.2 52.0,103.8 53.0,107.2 54.0,109.3 55.0,110.0 56.0,109.3 57.0,107.2 58.0,103.8 59.0,99.2 60.0,93.5 61.0,87.0 62.0,79.9 63.0,72.5 64.0,65.0 65.0,57.6 66.0,50.7 67.0,44.5 68.0,39.2 69.0,34.9 70.0,32.0 71.0,30.3 72.0,30.1 73.0,31.3 74.0,33.8 75.0,37.6 76.0,42.6 77.0,48.6 78.0,55.3 79.0,62.5 80.0,70.0 81.0,77.5 82.0,84.7 83.0,91.4 84.0,97.4 85.0,102.4 86.0,106.2 87.0,108.7 88.0,109.9 89.0,109.7 90.0,108.0 91.0,105.1 92.0,100.8 93.0,95.5 94.0,89.3 95.0,82.4 96.0,75.0 97.0,67.5 98.0,60.1 99.0,53.0 100.0,46.5 101.0,40.8 102.0,36.2 103.0,32.8 104.0,30.7 105.0,30.0 106.0,30.7 107.0,32.8 108.0,36.2 109.0,40.8 110.0,46.5 111.0,53.0 112.0,60.1 113.0,67.5 114.0,75.0 115.0,82.4 116.0,89.3 117.0,95.5 118.0,100.8 119.0,105.1 120.0,108.0 121.0,109.7 122.0,109.9 123.0,108.7 124.0,106.2 125.0,102.4 126.0,97.4 127.0,91.4 128.0,84.7 129.0,77.5 130.0,70.0 131.0,62.5 132.0,55.3 133.0,48.6 134.0,42.6 135.0,37.6 136.0,33.8 137.0,31.3 138.0,30.1 139.0,30.3 140.0,32.0 141.0,34.9 142.0,39.2 143.0,44.5 144.0,50.7 145.0,57.6 146.0,65.0 147.0,72.5 148.0,79.9 149.0,87.0 150.0,93.5 151.0,99.2 152.0,103.8 153.0,107.2 154.0,109.3 155.0,110.0 156.0,109.3 157.0,107.2 158.0,103.8 159.0,99.2 160.0,93.5 161.0,87.0 162.0,79.9 163.0,72.5 164.0,65.0 165.0,57.6 166.0,50.7 167.0,44.5 168.0,39.2 169.0,34.9 170.0,32.0 171.0,30.3 172.0,30.1 173.0,31.3 174.0,33.8 175.0,37.6 176.0,42.6 177.0,48.6 178.0,55.3 179.0,62.5 180.0,70.0 181.0,77.5 182.0,84.7 183.0,91.4 184.0,97.4 185.0,102.4 186.0,106.2 187.0,108.7 188.0,109.9 189.0,109.7 190.0,108.0 191.0,105.1 192.0,100.8 193.0,95.5 194.0,89.3 195.0,82.4 196.0,75.0 197.0,67.5 198.0,60.1 199.0,53.0 200.0,46.5 201.0,40.8 202.0,36.2 203.0,32.8 204.0,30.7 205.0,30.0 206.0,30.7 207.0,32.8 208.0,36.2 209.0,40.8 210.0,46.5 211.0,53.0 212.0,60.1 213.0,67.5 214.0,75.0 215.0,82.4 216.0,89.3 217.0,95.5 218.0,100.8 219.0,105.1 220.0,108.0 221.0,109.7 222.0,109.9 223.0,108.7 224.0,106.2 225.0,102.4 226.0,97.4 227.0,91.4 228.0,84.7 229.0,77.5 230.0,70.0 231.0,62.5 232.0,55.3 233.0,48.6 234.0,42.6 235.0,37.6 236.0,33.8 237.0,31.3 238.0,30.1 239.0,30.3 240.0,32.0 241.0,34.9 242.0,39.2 243.0,44.5 244.0,50.7 245.0,57.6 246.0,65.0 247.0,72.5 248.0,79.9 249.0,87.0 250.0,93.5 251.0,99.2 252.0,103.8 253.0,107.2 254.0,109.3 255.0,110.0 256.0,109.3 257.0,107.2 258.0,103.8 259.0,99.2 260.0,93.5 261.0,87.0 262.0,79.9 263.0,72.5 264.0,65.0 265.0,57.6 266.0,50.7 267.0,44.5 268.0,39.2 269.0,34.9 270.0,32.0 271.0,30.3 272.0,30.1 273.0,31.3 274.0,33.8 275.0,37.6 276.0,42.6 277.0,48.6 278.0,55.3 279.0,62.5 280.0,70.0 281.0,77.5 282.0,84.7 283.0,91.4 284.0,97.4 285.0,102.4 286.0,106.2 287.0,108.7 288.0,109.9 289.0,109.7 290.0,108.0 291.0,105.1 292.0,100.8 293.0,95.5 294.0,89.3 295.0,82.4 296.0,75.0 297.0,67.5 298.0,60.1 299.0,53.0 300.0,46.5 301.0,40.8 302.0,36.2 303.0,32.8 304.0,30.7 305.0,30.0 306.0,30.7 307.0,32.8 308.0,36.2 309.0,40.8 310.0,46.5 311.0,53.0 312.0,60.1 313.0,67.5 314.0,75.0 315.0,82.4 316.0,89.3 317.0,95.5 318.0,100.8 319.0,105.1 320.0,108.0 321.0,109.7 322.0,109.9 323.0,108.7 324.0,106.2 325.0,102.4 326.0,97.4 327.0,91.4 328.0,84.7 329.0,77.5 330.0,70.0" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30.0,70.0 35.0,74.2 40.0,78.3 45.0,82.4 50.0,86.3 55.0,90.0 60.0,93.5 65.0,96.8 70.0,99.7 75.0,102.4 80.0,104.6 85.0,106.5 90.0,108.0 95.0,109.1 100.0,109.8 105.0,110.0 110.0,109.8 115.0,109.1 120.0,108.0 125.0,106.5 130.0,104.6 135.0,102.4 140.0,99.7 145.0,96.8 150.0,93.5 155.0,90.0 160.0,86.3 165.0,82.4 170.0,78.3 175.0,74.2 180.0,70.0 185.0,65.8 190.0,61.7 195.0,57.6 200.0,53.7 205.0,50.0 210.0,46.5 215.0,43.2 220.0,40.3 225.0,37.6 230.0,35.4 235.0,33.5 240.0,32.0 245.0,30.9 250.0,30.2 255.0,30.0 260.0,30.2 265.0,30.9 270.0,32.0 275.0,33.5 280.0,35.4 285.0,37.6 290.0,40.3 295.0,43.2 300.0,46.5 305.0,50.0 310.0,53.7 315.0,57.6 320.0,61.7 325.0,65.8 330.0,70.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="30" cy="70.0" r="4" fill="#b4232c"/><circle cx="60" cy="93.5" r="4" fill="#b4232c"/><circle cx="90" cy="108.0" r="4" fill="#b4232c"/><circle cx="120" cy="108.0" r="4" fill="#b4232c"/><circle cx="150" cy="93.5" r="4" fill="#b4232c"/><circle cx="180" cy="70.0" r="4" fill="#b4232c"/><circle cx="210" cy="46.5" r="4" fill="#b4232c"/><circle cx="240" cy="32.0" r="4" fill="#b4232c"/><circle cx="270" cy="32.0" r="4" fill="#b4232c"/><circle cx="300" cy="46.5" r="4" fill="#b4232c"/><circle cx="330" cy="70.0" r="4" fill="#b4232c"/>
  <text x="30" y="135" font-size="11" fill="#1f2a44">0 s</text>
  <text x="330" y="135" font-size="11" text-anchor="end" fill="#1f2a44">1 s</text>
  <text x="180" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">9 Hz sampled at 10 Hz looks like 1 Hz</text>
</svg>
```
:::

::: context zero-order-hold Hold, do not slope
A mode word jumps from one value to the next; it is never "mode 2.5". Zero-order hold keeps each value until the next update (blue staircase). Straight-line interpolation (dashed) would invent in-between modes that never existed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30,90 L102.0,60 L216.0,30 L294.0,90" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4,3"/>
  <path d="M30,90 L102.0,90 L102.0,60 L216.0,60 L216.0,30 L294.0,30 L294.0,90 L330,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="30" cy="90" r="4" fill="#b4232c"/><circle cx="102.0" cy="60" r="4" fill="#b4232c"/><circle cx="216.0" cy="30" r="4" fill="#b4232c"/><circle cx="294.0" cy="90" r="4" fill="#b4232c"/>
  <text x="20" y="94" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="20" y="64" font-size="11" text-anchor="end" fill="#1f2a44">2</text>
  <text x="20" y="34" font-size="11" text-anchor="end" fill="#1f2a44">3</text>
  <text x="340" y="112" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
</svg>
```
:::

::: context hdf5-history Built for scientists with huge data
HDF, the Hierarchical Data Format, was started in the late 1980s at the National Center for Supercomputing Applications at the University of Illinois. HDF5, a redesign, came out in 1998 and is now looked after by The HDF Group. NASA's Earth Observing System satellites deliver their data in HDF-based formats, and many test labs and flight programs store telemetry in HDF5 because it is fast, compact and describes itself.
:::

::: context hdf5-chunks Reading only the chunk you need
The lesson's gyro dataset has $2000$ rows stored in chunks of $500$. Asking for `g[:200, 2]` touches only the first chunk (shaded); the other three stay on disk. In a file of thousands of chunks, that is the difference between a millisecond and a minute.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="40" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="75" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">0–499</text><rect x="110" y="40" width="70" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="145" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">500–999</text><rect x="180" y="40" width="70" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="215" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">1000–1499</text><rect x="250" y="40" width="70" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="285" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">1500–1999</text>
  <text x="75" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">read</text>
  <text x="215" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">rows of imu/gyro, 2000 × 3, chunks of 500 × 3</text>
</svg>
```
:::

::: context epoch Counting time from somewhere
Computers usually store time as seconds since a fixed moment. Unix time counts from midnight UTC on 1 January 1970, so $1\,712\,345\,678$ seconds lands on 5 April 2024. GPS time counts from 6 January 1980 and ignores leap seconds, so it now runs $18$ seconds ahead of UTC. Mixing two epochs, or two clocks that disagree by a few milliseconds, shifts one channel against another.
:::
