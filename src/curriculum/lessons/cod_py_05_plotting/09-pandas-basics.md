---
id: l09-pandas-basics
title: Telemetry tables with pandas
minutes: 23
covers:
  - 'pandas: DataFrame, Series, DatetimeIndex, read_csv, read_parquet'
---

Think of a spreadsheet you have used for anything — a class schedule, a budget, a list of scores. Every column has a name at the top: "Date", "Item", "Cost". Every row has a label down the side. You never say "the number in row 7, column 3". You say "the cost on Tuesday". The names are what make the table readable.

A NumPy array is a spreadsheet with the names torn off. It holds the numbers well and does fast math on them, but column 3 is only "column 3". Did the altitude go in column 1 or column 2? Is row 0 at liftoff or at power-on? The array cannot tell you, and every script that reads it has to remember.

**pandas** is Python's library for tables *with* the names left on. It is built on top of NumPy, so the math is as fast as ever, but every column has a name and every row has a label. For flight data, the row label that matters most is time. This lesson covers the two pandas objects — the **Series** and the **DataFrame** — how to use real clock time as the row label, and how to load telemetry from the two file formats you will meet most: CSV and Parquet. The lessons after this one resample, smooth, align and thin that data, and all of them lean on what is set up here.

## A Series: one column with labels

A **Series** is one column of values with a label on every value. The labels together are called the **index**.

```python
import pandas as pd

p = pd.Series([352.4, 318.9, 410.2, 377.5],
              index=["lox_ullage", "fuel_ullage", "lox_inlet", "fuel_inlet"],
              name="pressure_kPa")
print(p)
# lox_ullage     352.4
# fuel_ullage    318.9
# lox_inlet      410.2
# fuel_inlet     377.5
# Name: pressure_kPa, dtype: float64
```

These are four pressure readings from a rocket's propellant system, in kilopascals. The left column of the printout is the index — the labels. The right column is the values. The `name` is the name of the whole column, and `dtype` is the type of the values, the same idea as a NumPy array's dtype. Notice the unit is in the name, `pressure_kPa`. A table cannot have an axis label, so the column name is where the unit lives.

You can get a value two ways:

- by **label** with `p["lox_inlet"]` or `p.loc["lox_inlet"]`, both giving `410.2`;
- by **position** with `p.iloc[2]`, also `410.2`, because `lox_inlet` is third and counting starts at $0$.

Read `.loc` as "locate by label" and `.iloc` as "locate by integer position". Keeping them apart matters later, when the labels are times and the positions are sample numbers.

Math works element by element, as in NumPy, and filtering with a true/false mask works too:

```python
print(p[p > 350.0])
# lox_ullage    352.4
# lox_inlet     410.2
# fuel_inlet    377.5
# Name: pressure_kPa, dtype: float64
print(type(p.to_numpy()).__name__)    # ndarray
```

`to_numpy()` hands back the plain NumPy array, for when you need it — matplotlib's `ax.plot` accepts a Series directly, but some functions want the bare numbers.

### Math lines up by label

Here is the one big difference from NumPy. When you add two Series, pandas matches values by **label**, not by position. This is called **[[index alignment|alignment]]**.

```python
a = pd.Series([1.0, 2.0, 3.0], index=["x", "y", "z"])
b = pd.Series([10.0, 20.0, 30.0], index=["y", "z", "w"])
print(a + b)
# w     NaN
# x     NaN
# y    12.0
# z    23.0
# dtype: float64
```

`y` got $2 + 10 = 12$ and `z` got $3 + 20 = 23$, because those labels appear in both. `x` and `w` each appear in only one, so there is nothing to add them to, and the answer is `NaN` — **[[not a number|nan]]**, pandas' marker for a missing value. NumPy would have added the first to the first and never noticed that the labels disagreed.

::: key
A Series is a column of values plus an index of labels. `.loc` selects by label, `.iloc` by position. Arithmetic between Series matches values by label, and labels found in only one give `NaN`.
:::

::: warning NaN is a clue, not a nuisance
When a sum between two tables comes back full of `NaN`, pandas is telling you the labels did not match — often two sensors whose timestamps are a few milliseconds apart. Do not reach for `.fillna(0)` to make them go away. Filling with zero invents data. Find out why the labels differ; the lesson on `merge_asof` shows the right way to line up two clocks.
:::

## A DataFrame: a table of Series

A **DataFrame** is a table: several Series side by side, all sharing one index. Each column has a name and its own dtype. The easiest way to build one is from a dictionary of column name to values:

::: example A first flight table
Here are the first two seconds of a small rocket's flight, sampled every half second:

```python
import pandas as pd

df = pd.DataFrame({
    "t_s": [0.0, 0.5, 1.0, 1.5, 2.0],
    "alt_m": [0.0, 1.2, 4.9, 11.0, 19.6],
    "vz_mps": [0.0, 4.9, 9.8, 14.7, 19.6],
    "mode": ["PAD", "ASCENT", "ASCENT", "ASCENT", "ASCENT"],
})
print(df)
#    t_s  alt_m  vz_mps    mode
# 0  0.0    0.0     0.0     PAD
# 1  0.5    1.2     4.9  ASCENT
# 2  1.0    4.9     9.8  ASCENT
# 3  1.5   11.0    14.7  ASCENT
# 4  2.0   19.6    19.6  ASCENT
print(df.shape)                        # (5, 4)
print(type(df["alt_m"]).__name__)      # Series
```

The index on the left is $0$ to $4$, the default when you do not give one. There are $5$ rows and $4$ columns. Pulling out one column with `df["alt_m"]` gives a Series. `df[["t_s", "alt_m"]]`, with a *list* of names, gives a smaller DataFrame.

Now add a column. The vertical acceleration is the change in speed divided by the change in time. `.diff()` subtracts each value from the one after it:

```python
df["acc_mps2"] = df["vz_mps"].diff() / df["t_s"].diff()
print(df.loc[df["alt_m"] > 5.0, ["t_s", "alt_m", "acc_mps2"]])
#    t_s  alt_m  acc_mps2
# 3  1.5   11.0       9.8
# 4  2.0   19.6       9.8
```

Check it by hand for row 3: the speed went from $9.8$ to $14.7\,\mathrm{m/s}$ in $0.5\,\mathrm{s}$, so $(14.7 - 9.8) / 0.5 = 9.8\,\mathrm{m/s^2}$. That is about one $g$, a gentle climb for a small rocket, so the number is believable. (Row $0$ has no row before it, so its acceleration is `NaN`.)

The `.loc[rows, columns]` form takes a row selector and a column selector at once. Here the rows are "where altitude is above $5\,\mathrm{m}$" and the columns are a list of three names.
:::

Each column keeps its own type. Ask with `df.dtypes`: the three number columns are `float64`, and `mode` is text (pandas 3 shows it as `str`; older versions show `object`). That is something a NumPy array cannot do — one array holds one type — and it is why a single DataFrame can hold both a sensor reading and the flight mode it was taken in.

A few everyday tools:

- `df.head()` and `df.tail()` show the first and last five rows;
- `df.columns` lists the column names;
- `df.describe()` gives count, mean, standard deviation, minimum and maximum of every number column;
- `df.to_numpy()` gives the whole table as one NumPy array.

::: key
A DataFrame is a table of named columns (each a Series) sharing one index. `df["col"]` is a Series, `df[["a", "b"]]` is a DataFrame, and `df.loc[row_mask, ["a", "b"]]` selects rows and columns together. Put units in column names: `alt_m`, `vz_mps`.
:::

## Time as the index

So far the index was $0, 1, 2, \dots$ or sensor names. For telemetry, the natural label for a row is *when* it was measured. pandas has real time types for this:

- a **Timestamp** is one moment, like `2026-03-14 17:30:00 UTC`;
- a **Timedelta** is a length of time, like $90.25$ seconds;
- a **DatetimeIndex** is an index made of Timestamps — one moment per row.

The **UTC** in that Timestamp is **[[Coordinated Universal Time|utc]]**, the world's reference clock. Telemetry should carry it (or another named time scale) explicitly, so everyone knows which clock the stamps come from.

Flight software often counts **[[mission elapsed time|met]]** — seconds since liftoff. To turn that into real times, add it to the liftoff Timestamp:

```python
import numpy as np
import pandas as pd

t0 = pd.Timestamp("2026-03-14 17:30:00", tz="UTC")    # liftoff
met = np.array([0.0, 0.5, 1.0, 1.5, 2.0])              # s after liftoff
idx = t0 + pd.to_timedelta(met, unit="s")
df = pd.DataFrame({"alt_m": [0.0, 1.2, 4.9, 11.0, 19.6]}, index=idx)
df.index.name = "time_utc"
print(df.index.dtype)                                  # datetime64[ns, UTC]
print(df.loc["2026-03-14 17:30:00.5":"2026-03-14 17:30:01.5"])
#                                   alt_m
# time_utc
# 2026-03-14 17:30:00.500000+00:00    1.2
# 2026-03-14 17:30:01+00:00           4.9
# 2026-03-14 17:30:01.500000+00:00   11.0
print((df.index[-1] - df.index[0]).total_seconds())    # 2.0
print(df.index.tz_convert("America/Chicago")[0])       # 2026-03-14 12:30:00-05:00
```

Step by step. `pd.to_timedelta(met, unit="s")` turns the plain seconds into Timedeltas. Adding them to `t0` gives five Timestamps, one per sample, which become the index. The dtype `datetime64[ns, UTC]` says two things: times are stored to the nanosecond (billionth of a second), and they are in UTC.

The `.loc` line slices by *time*, written as text. Unlike most Python slices, a label slice includes both ends, so you get three rows from $0.5\,\mathrm{s}$ to $1.5\,\mathrm{s}$. Subtracting two Timestamps gives a Timedelta, here $2$ seconds. And `tz_convert` shows the same instant on a local clock: 17:30 UTC is 12:30 in Chicago, where the $-05{:}00$ says local time is five hours behind UTC that day.

Why go to this trouble? Because the next lessons need it. With a DatetimeIndex, pandas can group samples into time bins ("one row per second"), compute a moving average over "the last $2$ seconds" rather than "the last $400$ rows", and line up two streams recorded on different clocks by nearest time. None of that works on a column of plain floats.

::: key
A DatetimeIndex makes resample, rolling with a time window, time-based slicing and merge_asof work, and it keeps time zone information explicit. Storing time as a float of seconds since an unstated **[[epoch|epoch]]** is how ground and vehicle clocks quietly diverge.
:::

::: example Two clocks, one number
A GPS receiver logs the time $1457544618$ seconds. The file does not say since *when*. Two engineers read it two ways:

```python
import pandas as pd

stamp = 1457544618.0          # seconds, from a GPS receiver log

as_unix = pd.to_datetime(stamp, unit="s", utc=True)
as_gps = pd.to_datetime(stamp, unit="s", origin=pd.Timestamp("1980-01-06"), utc=True)
utc = as_gps - pd.Timedelta(seconds=18)       # GPS runs 18 s ahead of UTC
print(as_unix)                # 2016-03-09 17:30:18+00:00
print(as_gps)                 # 2026-03-14 17:30:18+00:00
print(utc)                    # 2026-03-14 17:30:00+00:00
print((as_gps - as_unix).days)                # 3657
```

**Engineer A** assumes the usual computer epoch, midnight on 1 January 1970 (the **Unix epoch**, `unit="s"` with no `origin`). She gets a date in 2016.

**Engineer B** knows GPS receivers count from midnight on 6 January 1980, the **GPS epoch**, and passes that as `origin`. He gets 14 March 2026 — but $18$ seconds late, because GPS time does not stop for **[[leap seconds|leap-seconds]]** and has run $18\,\mathrm{s}$ ahead of UTC since 2017. Subtracting them gives the true UTC time, 17:30:00.

The two readings are $3657$ days apart — the gap between the two epochs. That is the dramatic failure. The quiet one is the $18$-second slip, which looks perfectly plausible on a plot and moves every GPS fix $18$ seconds away from the IMU samples it should line up with. At orbital speed, about $7.7\,\mathrm{km/s}$, $18$ seconds is roughly $139\,\mathrm{km}$ of flight.

Sanity check: $(18 \times 7.7) = 138.6$, about $139\,\mathrm{km}$. The lesson: convert to a DatetimeIndex with a named epoch and time zone *once*, at the moment you load the file, and never pass bare float seconds between scripts.
:::

## Loading a CSV

**CSV**, "comma-separated values", is the most common telemetry export there is: plain text, one row per line, values separated by commas, column names on the first line. Any tool can write it and any person can read it. pandas reads it with `pd.read_csv`.

```python
import io
import pandas as pd

text = """time_utc,alt_m,vz_mps,mode
2026-03-14T17:30:00.000Z,0.0,0.0,PAD
2026-03-14T17:30:00.500Z,1.2,4.9,ASCENT
2026-03-14T17:30:01.000Z,4.9,9.8,ASCENT
2026-03-14T17:30:01.500Z,11.0,14.7,ASCENT
"""
raw = pd.read_csv(io.StringIO(text))
print(raw["time_utc"].dtype)             # str

df = pd.read_csv(io.StringIO(text), parse_dates=["time_utc"], index_col="time_utc")
print(df.index.dtype)                    # datetime64[us, UTC]
print(df.loc["2026-03-14 17:30:01":, "alt_m"])
# time_utc
# 2026-03-14 17:30:01+00:00            4.9
# 2026-03-14 17:30:01.500000+00:00    11.0
# Name: alt_m, dtype: float64
```

`io.StringIO(text)` makes a string behave like a file, so the example needs no file on disk; with a real file you pass its path, `pd.read_csv("flight.csv")`.

The first read shows the trap. Without instructions, the time column comes back as **text** — strings of characters that happen to look like dates. You cannot slice by time or subtract them. The second read adds two arguments:

- `parse_dates=["time_utc"]` says "turn this column into Timestamps". The `Z` at the end of each stamp is the standard way to write "UTC", so pandas makes them UTC-aware.
- `index_col="time_utc"` says "use this column as the index".

Now the index is a DatetimeIndex, and time slicing works. (Here pandas stored the times to the microsecond, `us`; the earlier example, built in code, used nanoseconds. Which one you get depends on how the times were made and on your pandas version. Both are real time types, and both work the same way.)

Two more arguments save time on big files: `usecols=["time_utc", "alt_m"]` reads only the columns you name, and `dtype={"mode": "category"}` stores a column with a few repeating values compactly.

::: warning A CSV does not know its own types
Every value in a CSV is text until pandas guesses. Guesses go wrong: a sensor ID like `007` becomes the number $7$; a column with one `N/A` becomes text; a time column stays text unless you say `parse_dates`. After reading any CSV, look at `df.dtypes` before doing anything else. And a CSV with a time column that has no time zone and no `Z` is exactly the "float with an unstated epoch" problem in text form.
:::

## Loading Parquet

**Parquet** is a binary file format built for tables. Three things make it better than CSV for telemetry:

- It stores **types**. A float column is saved as floats, a time column as times with its time zone, a text column as text. Nothing is guessed when you read it back.
- It is **[[columnar|columnar]]**. Each column is stored in its own block. So reading two columns out of forty only touches those two, which is fast.
- It is **compressed**, so files are smaller.

You write one with `df.to_parquet(path)` and read it with `pd.read_parquet(path)`. The `pyarrow` library does the actual file work behind the scenes; it needs to be installed, and in most scientific Python setups it already is.

::: example CSV or Parquet for an IMU log
An **IMU** (inertial measurement unit — the box of accelerometers and gyroscopes that feels the vehicle's motion) records $6$ channels at $200\,\mathrm{Hz}$ for $10$ minutes. That is $10 \times 60 \times 200 = 120{,}000$ rows. Save it both ways and compare:

```python
import os
import numpy as np
import pandas as pd

rate = 200                                            # Hz
n = 10 * 60 * rate                                    # 10 minutes of samples
t0 = pd.Timestamp("2026-03-14 17:30:00", tz="UTC")
idx = t0 + pd.to_timedelta(np.arange(n) / rate, unit="s")
rng = np.random.default_rng(42)
imu = pd.DataFrame(
    {
        "ax_mps2": 9.81 + rng.normal(0, 0.05, n),
        "ay_mps2": rng.normal(0, 0.05, n),
        "az_mps2": rng.normal(0, 0.05, n),
        "gx_dps": rng.normal(0, 0.1, n),
        "gy_dps": rng.normal(0, 0.1, n),
        "gz_dps": rng.normal(0, 0.1, n),
    },
    index=pd.DatetimeIndex(idx, name="time_utc"),
)
print(imu.shape)                                      # (120000, 6)

imu.to_csv("imu.csv")
imu.to_parquet("imu.parquet")
csv_mb = os.path.getsize("imu.csv") / 1e6
pq_mb = os.path.getsize("imu.parquet") / 1e6
print(round(csv_mb, 1), round(pq_mb, 1), round(csv_mb / pq_mb, 1))   # 18.6 8.2 2.3

back = pd.read_parquet("imu.parquet")
print(back.index.dtype, back.equals(imu))             # datetime64[ns, UTC] True
print(pd.read_parquet("imu.parquet", columns=["gz_dps"]).shape)      # (120000, 1)
print(pd.read_csv("imu.csv")["time_utc"].dtype)       # str
```

**Size.** The CSV is $18.6\,\mathrm{MB}$ and the Parquet file $8.2\,\mathrm{MB}$, about $2.3$ times smaller. Where does the CSV's size come from? Each float is written out as about $19$ characters of text plus a comma, and each timestamp as $32$ characters, so a row takes about $155$ characters. Parquet stores each float in $8$ bytes, then compresses.

**Round trip.** Reading the Parquet file gives back a table that `.equals` the original exactly: same numbers, same DatetimeIndex, same UTC time zone. Reading the CSV without `parse_dates` gives the time column back as text again.

**One column.** `columns=["gz_dps"]` read only the yaw-rate column, $120{,}000$ rows by $1$ column, without touching the other five.

Sanity check on the size ratio: this data is pure random noise, which is the hardest thing to compress. Real telemetry has slowly changing values and repeating patterns, and Parquet usually shrinks it much further.
:::

::: key
`pd.read_csv(path, parse_dates=[...], index_col=...)` loads text tables; check `df.dtypes` after every CSV. `pd.read_parquet(path, columns=[...])` loads typed, compressed, columnar tables with their time zone intact. Keep raw exports as they came, and convert to Parquet with a proper DatetimeIndex for analysis.
:::

## Check yourself

::: check
A Series `s` has index `["a", "b", "c"]` and values `[5, 6, 7]`. What do `s["b"]`, `s.iloc[0]` and `s.loc["c"]` return? Now `t` has index `["b", "c", "d"]` and values `[1, 1, 1]`. What is `s + t`?
:::

::: answer
`s["b"]` is `6` (by label), `s.iloc[0]` is `5` (first by position), and `s.loc["c"]` is `7` (by label).

`s + t` lines up by label. `b` gives $6 + 1 = 7$ and `c` gives $7 + 1 = 8$. `a` exists only in `s` and `d` only in `t`, so both come out `NaN`. The result has index `a, b, c, d` with values `NaN, 7, 8, NaN`.
:::

::: check
Given the flight table `df` from the first example, write the expression that selects the altitude and vertical speed for every row where the mode is `"ASCENT"`. What kind of object comes back?
:::

::: answer
`df.loc[df["mode"] == "ASCENT", ["alt_m", "vz_mps"]]`. The first part is a true/false mask with one entry per row; the second is a list of column names. Because the column selector is a list, the result is a DataFrame (four rows, two columns). With a single name, `"alt_m"`, it would be a Series.
:::

::: check
Liftoff is at `2026-03-14 17:30:00 UTC` and a telemetry file stores mission elapsed time in seconds. Show how to build a DatetimeIndex from it, and name two things you can then do that you could not do with the float column.
:::

::: answer
`idx = pd.Timestamp("2026-03-14 17:30:00", tz="UTC") + pd.to_timedelta(met, unit="s")`, then `df.index = idx`.

With the DatetimeIndex you can slice by clock time, like `df.loc["2026-03-14 17:31":"2026-03-14 17:32"]`; resample into fixed time bins; compute rolling statistics over a time window like two seconds; align with another stream by nearest time with `merge_asof`; and convert to other time zones. Any two of these answer the question.
:::

::: check
A colleague sends `ascent.csv` and your script does `df = pd.read_csv("ascent.csv")` followed by `df.loc["2026-03-14 17:30:05":]`. It fails. What is the likely cause, and what is the fix?
:::

::: answer
Without `parse_dates` and `index_col`, the time column was read as plain text and the index is the default $0, 1, 2, \dots$. A time slice cannot work on a numbered index. Read it with `pd.read_csv("ascent.csv", parse_dates=["time_utc"], index_col="time_utc")` (using the real column name), then check `df.index.dtype` shows a `datetime64` type with a time zone.
:::

::: check
Give two reasons to store a 200 Hz IMU log as Parquet rather than CSV for analysis, and one reason you might still keep the CSV.
:::

::: answer
Parquet keeps the types, including the DatetimeIndex and its time zone, so nothing is guessed on reading; it is columnar, so reading one channel out of many only reads that channel; and it is compressed, so the file is smaller (about $2.3$ times for random noise, usually more for real data). A reason to keep the CSV: it is the raw export as delivered, readable by any tool and any person, so it is the record you can always go back to if a conversion step had a bug.
:::

## Summary

| Idea | Meaning | In code |
|---|---|---|
| Series | One column of values with index labels | `pd.Series(values, index=labels, name=...)` |
| By label / by position | Two ways to select | `.loc["x"]` / `.iloc[0]` |
| Alignment | Math matches labels; missing gives `NaN` | `a + b` |
| DataFrame | Named columns sharing one index | `pd.DataFrame({...})`, `df["col"]`, `df.loc[mask, cols]` |
| Units | Live in the column name | `alt_m`, `vz_mps`, `pressure_kPa` |
| Timestamp / Timedelta | A moment / a length of time | `pd.Timestamp(..., tz="UTC")`, `pd.to_timedelta(s, unit="s")` |
| DatetimeIndex | Time as row labels, with time zone | time slicing, resample, rolling, merge_asof |
| Epoch | The zero of a time count | Unix 1970-01-01; GPS 1980-01-06, 18 s ahead of UTC |
| read_csv | Text table; types guessed | `parse_dates=[...]`, `index_col=...`, check `dtypes` |
| read_parquet | Typed, columnar, compressed | `pd.read_parquet(path, columns=[...])` |

The next lesson puts the DatetimeIndex to work: `resample` to change the sampling rate, `rolling` for moving statistics, `interpolate` to fill gaps, and `groupby` with `agg` to summarize a flight by phase.

::: context alignment Why pandas lines things up by label
Think of two class lists, one with math scores and one with art scores, sorted in different orders. Adding "the first number to the first number" would mix up students. Matching by name is the only sensible way. pandas does that automatically with its index.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="30" y="20">a</text><text x="150" y="20">b</text><text x="270" y="20">a + b</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="20" y="30" width="70" height="24"/><rect x="20" y="54" width="70" height="24"/><rect x="20" y="78" width="70" height="24"/>
    <rect x="140" y="54" width="70" height="24"/><rect x="140" y="78" width="70" height="24"/><rect x="140" y="102" width="70" height="24"/>
    <rect x="260" y="30" width="80" height="24"/><rect x="260" y="54" width="80" height="24"/><rect x="260" y="78" width="80" height="24"/><rect x="260" y="102" width="80" height="24"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="28" y="47">x: 1</text><text x="28" y="71">y: 2</text><text x="28" y="95">z: 3</text>
    <text x="148" y="71">y: 10</text><text x="148" y="95">z: 20</text><text x="148" y="119">w: 30</text>
    <text x="268" y="71">y: 12</text><text x="268" y="95">z: 23</text>
  </g>
  <g font-size="12" fill="#b4232c">
    <text x="268" y="47">x: NaN</text><text x="268" y="119">w: NaN</text>
  </g>
  <line x1="90" y1="66" x2="140" y2="66" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="90" y1="90" x2="140" y2="90" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#6c7a93">rows are matched by label, not by position</text>
</svg>
```
:::

::: context nan A number that says "no number"
NaN is a special floating-point value, part of the IEEE 754 standard every modern computer uses for decimals. It comes out of things like $0/0$, and pandas borrows it to mean "missing". It has one strange rule: NaN is not equal to anything, not even itself, so `x == np.nan` is always false. Test for it with `pd.isna(x)` or `s.isna()` instead. Any math with a NaN gives NaN, which is why one missing sample can quietly turn a whole column's `sum` into NaN in NumPy (pandas skips NaN in `sum` and `mean` by default).
:::

::: context utc The world's reference clock
UTC, Coordinated Universal Time, is the time standard the world's clocks are set from. It is kept by atomic clocks and is the same everywhere; local time zones are UTC plus or minus some hours. Mission control, ground stations and spacecraft logs use UTC (or a related scale such as GPS time) so that data from a station in Australia and one in Florida can be compared without anyone doing time-zone arithmetic. The odd letter order comes from a compromise between the English and French names.
:::

::: context met Mission elapsed time
Mission elapsed time, or MET, is a stopwatch that starts at liftoff. Launch commentary counts "T minus 10 seconds" before it and "T plus 2 minutes" after; flight software logs the same idea as seconds. It is convenient because every flight starts at zero, so flights can be overlaid on one plot. But it is only half an address: to compare with a ground radar, a weather balloon or a GPS receiver, you need the liftoff time in UTC as well.
:::

::: context epoch The zero of a clock
An epoch is the moment a time count starts from — the "zero" on the clock. Unix computers count seconds from midnight UTC on 1 January 1970. GPS counts from midnight on 6 January 1980. Many spacecraft count from their own power-on or from liftoff. A number like $1457544618$ means nothing until you know which zero it is measured from, which is why the epoch must travel with the data, not in someone's memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="50" x2="40" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="91" y1="50" x2="91" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="325" y1="50" x2="325" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="88" font-size="11" text-anchor="middle" fill="#1d6fd1">1970</text>
  <text x="40" y="102" font-size="11" text-anchor="middle" fill="#1d6fd1">Unix zero</text>
  <text x="91" y="88" font-size="11" text-anchor="middle" fill="#b4232c">1980</text>
  <text x="91" y="102" font-size="11" text-anchor="middle" fill="#b4232c">GPS zero</text>
  <text x="325" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">2026</text>
  <text x="208" y="44" font-size="11" text-anchor="middle" fill="#6c7a93">same seconds count, measured from different zeros</text>
</svg>
```

The picture is to scale: 56 years of line from 1970 to 2026, with the 1980 mark ten years in.
:::

::: context leap-seconds Leap seconds and GPS time
The Earth's spin is slightly irregular, so every so often (27 times between 1972 and 2016) an extra second was inserted into UTC to keep it in step with the sky. GPS time was set equal to UTC in January 1980 and never takes leap seconds, so it has pulled ahead by one second at every leap since: by 18 seconds after the one at the end of 2016. GPS receivers broadcast the current offset so that software can convert, but only if the software knows to ask.
:::

::: context columnar Rows versus columns on disk
A CSV stores the table row by row: all of sample 1, then all of sample 2. To read one channel, you must read every row and throw most of it away. Parquet stores it column by column: all of the x-acceleration, then all of the y-acceleration, and so on. Reading one channel means reading one block. Values in a column are also alike — all floats, often slowly changing — which is why they compress well when stored together.
:::
