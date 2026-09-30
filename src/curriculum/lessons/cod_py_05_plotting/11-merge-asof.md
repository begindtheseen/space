---
id: l11-merge-asof
title: Lining up two clocks with merge_asof
minutes: 22
covers:
  - merge and merge_asof for aligning a 200 Hz IMU stream to 1 Hz GPS
---

Picture a soccer game. You take photos on your phone, dozens a minute. Your friend sits next to you and writes a note in a notebook once a minute: "12:31 — corner kick". Afterwards you want to put each note next to the right photo. The trouble is that no photo was taken at exactly 12:31:00.000. One was taken at 12:30:59.6 and the next at 12:31:00.4. So you do the sensible thing: for each note you pick the photo taken *nearest* in time, and if the closest photo is ten minutes away (your battery died), you leave that note without a photo rather than pairing it with something unrelated.

Flight data has exactly this problem. An **[[inertial measurement unit|imu]]** (IMU) reports acceleration and rotation rate 200 times a second. A GPS receiver reports position once a second. They run on [[two different clocks|two-clocks]], and their timestamps never line up. To compare the IMU's idea of motion with GPS, or to feed both into one table, you must match each GPS fix to the IMU sample nearest in time, and refuse to match when the nearest one is too far away.

pandas has two tools for joining tables. `merge` matches rows whose keys are *exactly equal*. `merge_asof` matches rows whose keys are *nearest*, with a direction and a tolerance. This lesson teaches both, shows why the first one fails on time, and then opens up `merge_asof` to show the NumPy function that does the real work, `np.searchsorted`.

## merge: matching on an exact key

Start with the easy case, where the key really does match. Back in the last lesson you found the peak dynamic pressure of each Monte Carlo run. A second table, written by the simulation setup, lists each run's inputs: the wind speed and the engine thrust it drew. Both tables have a `run` column. To ask "did the high-wind runs have the high peaks?", you need them side by side in one table.

That is a **merge** (also called a **[[join|sql-join]]**): combining two tables into one by matching rows that share a value in a **key** column. `pd.merge(left, right, on="run")` finds every pair of rows, one from each table, with equal `run`, and glues them into one wider row.

::: example Joining Monte Carlo results to their inputs
```python
import pandas as pd

peaks = pd.DataFrame({"run": [0, 1, 2], "max_q_kPa": [33.5, 36.1, 31.9]})
inputs = pd.DataFrame({"run": [0, 1, 2, 3],
                       "wind_ms": [12.0, 19.0, 9.0, 15.0],
                       "thrust_pct": [99.2, 101.4, 98.7, 100.3]})
table = pd.merge(peaks, inputs, on="run")
print(table)
#    run  max_q_kPa  wind_ms  thrust_pct
# 0    0       33.5     12.0        99.2
# 1    1       36.1     19.0       101.4
# 2    2       31.9      9.0        98.7
```

**Match.** Run 0 in `peaks` pairs with run 0 in `inputs`, and the same for runs 1 and 2.

**Drop.** Run 3 appears only in `inputs`, perhaps because that simulation crashed before it reached max-q. The default join is **inner**: it keeps only keys found in both tables. So the result has 3 rows, not 4.

**Read it.** Run 1 had the strongest wind, $19\,\mathrm{m/s}$, and the highest peak, $36.1\,\mathrm{kPa}$. Run 2 had the weakest wind, $9\,\mathrm{m/s}$, and the lowest peak, $31.9\,\mathrm{kPa}$. Three runs prove nothing, but with a thousand this table is where the pattern shows up.

Sanity check: a run that crashed should not quietly vanish from a study. `how="outer"` keeps every key from both sides and fills the holes with NaN; here it returns 4 rows, and row 3 has NaN for `max_q_kPa`. That NaN is the crash, made visible.
:::

The `how` argument picks which keys survive. **Inner** keeps keys in both tables. **Left** keeps every row of the left table, with NaN where the right table had no match. **Outer** keeps every key from either side. **Right** is left with the tables swapped.

::: warning Duplicate keys multiply rows
If a key appears twice in the left table and three times in the right, merge pairs every one with every other and you get $2 \times 3 = 6$ rows for that key. When you expect each key once on each side, say so with `validate="one_to_one"`. pandas then raises an error instead of silently multiplying your data.
:::

## Why exact matching fails for time

Now try the same tool on the two sensors. Here are four seconds of IMU samples at 200 Hz, stamped with the vehicle's clock. The first sample came $2.1\,\mathrm{ms}$ after the clock's zero, so the samples sit at $0.0021\,\mathrm{s}$, $0.0071\,\mathrm{s}$, $0.0121\,\mathrm{s}$ and so on, $5\,\mathrm{ms}$ apart. The GPS fixes are stamped at $1.0003\,\mathrm{s}$, $2.0004\,\mathrm{s}$ and $3.0001\,\mathrm{s}$. There is also a radio dropout: no IMU samples arrived between 2.5 s and 3.2 s.

```python
import numpy as np
import pandas as pd

k = np.arange(800)                       # IMU sample number
t_imu = 0.0021 + 0.005 * k               # s, 200 Hz, starts 2.1 ms late
keep = (t_imu < 2.5) | (t_imu > 3.2)     # radio dropout from 2.5 s to 3.2 s
imu = pd.DataFrame({"t": t_imu[keep], "k": k[keep]})
gps = pd.DataFrame({"t": [1.0003, 2.0004, 3.0001],
                    "alt_m": [1000.0, 1050.0, 1100.0]})

print(len(pd.merge(gps, imu, on="t")))   # 0
```

Zero rows. Not one GPS timestamp equals an IMU timestamp, and none ever will. The two devices sample on their own schedules. Even if both were meant to tick at exactly 1.000 s, their clocks drift apart by microseconds, and timestamps stored as decimal numbers rarely compare equal after any arithmetic — that is the [[floating-point trap|float-equality]]. An exact join on time is the wrong question.

## merge_asof: nearest in time

`merge_asof` asks the right question. For each row of the left table, it finds one row of the right table whose key is close, following a rule you choose. The name comes from "[[as of|as-of]]": "the IMU reading as of this GPS fix".

It works in three parts.

- **Both tables sorted.** The key column must be in ascending order in both tables. pandas refuses unsorted keys with a `ValueError`, because the search it runs depends on the order.
- **Direction.** `direction="backward"` (the default) takes the last right row at or before the left row's time. `"forward"` takes the first one at or after. `"nearest"` takes whichever is closer, on either side.
- **Tolerance.** `tolerance=0.003` refuses any match further away than $0.003\,\mathrm{s}$. A left row with nothing close enough gets NaN.

Every row of the left table appears exactly once in the result, in its original order. So the left table decides the rate of the answer. With GPS on the left you get one row per fix; with the IMU on the left you get one row per IMU sample.

::: key merge vs merge_asof
merge_asof joins on nearest time rather than exact equality, with a direction and a tolerance. That is the only sane way to align a 200 Hz IMU stream with 1 Hz GPS fixes, where no two timestamps ever match exactly.
:::

::: example One IMU sample per GPS fix
Continue with the tables above and join nearest, with a $3\,\mathrm{ms}$ tolerance:

```python
import numpy as np
import pandas as pd

k = np.arange(800)
t_imu = 0.0021 + 0.005 * k
keep = (t_imu < 2.5) | (t_imu > 3.2)
imu = pd.DataFrame({"t": t_imu[keep], "k": k[keep]})
gps = pd.DataFrame({"t": [1.0003, 2.0004, 3.0001],
                    "alt_m": [1000.0, 1050.0, 1100.0]})

both = pd.merge_asof(gps, imu, on="t", direction="nearest", tolerance=0.003)
print(both)
#         t   alt_m      k
# 0  1.0003  1000.0  200.0
# 1  2.0004  1050.0  400.0
# 2  3.0001  1100.0    NaN
```

**First fix, 1.0003 s.** The IMU samples on either side are number 199 at $0.0021 + 0.005 \times 199 = 0.9971\,\mathrm{s}$ and number 200 at $1.0021\,\mathrm{s}$. The distances are

$$
1.0003 - 0.9971 = 0.0032\,\mathrm{s}, \qquad 1.0021 - 1.0003 = 0.0018\,\mathrm{s}.
$$

Sample 200 is nearer, $1.8\,\mathrm{ms}$ away, inside the $3\,\mathrm{ms}$ tolerance. Matched.

**Second fix, 2.0004 s.** Sample 400 at $2.0021\,\mathrm{s}$ is $1.7\,\mathrm{ms}$ away. Matched.

**Third fix, 3.0001 s.** This falls in the dropout. The nearest samples are number 499 at $2.4971\,\mathrm{s}$, about $503\,\mathrm{ms}$ before, and number 640 at $3.2021\,\mathrm{s}$, about $202\,\mathrm{ms}$ after. Both are far beyond $3\,\mathrm{ms}$, so the row gets NaN.

Sanity check: every match is under half the $5\,\mathrm{ms}$ sample spacing, which is the most a nearest match can ever be when no samples are missing. Notice also that `k` turned into decimals (`200.0`): a column of whole numbers that gains a NaN becomes a float column, because NaN is a float.
:::

## Choosing the direction

The direction is not a detail. It says what question the joined table answers.

**Backward** answers "what was the latest thing known at this moment?" That is what a flight computer sees: when an IMU sample arrives, the most recent GPS fix is the only position it has, and it keeps using it until the next one comes. Engineers call that holding the last value a **[[zero-order hold|zero-order-hold]]**. If you are replaying data to test flight software, or asking "what did the navigation filter know at the time?", use backward. It never looks into the future.

**Nearest** answers "which sample was measured closest to this moment?" That is what you want for a comparison or a plot after the flight, when you have the whole recording and only care about being close in time.

**Forward** answers "what was the first thing that happened after this moment?", such as the first telemetry frame after a command was sent. It is the rarest of the three.

::: example Attaching the last GPS fix to every IMU sample
Now put the IMU on the left, so the result has one row per IMU sample, and attach the most recent GPS altitude to each. Normal fixes are $1\,\mathrm{s}$ apart, so a tolerance of $1.2\,\mathrm{s}$ allows the usual age plus some margin.

```python
import numpy as np
import pandas as pd

imu = pd.DataFrame({"t": 0.0021 + 0.005 * np.arange(800)})   # no dropout here
gps = pd.DataFrame({"t": [1.0003, 2.0004, 3.0001],
                    "alt_m": [1000.0, 1050.0, 1100.0]})
back = pd.merge_asof(imu, gps, on="t", direction="backward", tolerance=1.2)
print(back.iloc[[199, 200, 599, 600]].round(4))
#           t   alt_m
# 199  0.9971     NaN
# 200  1.0021  1000.0
# 599  2.9971  1050.0
# 600  3.0021  1100.0
print(back["alt_m"].isna().sum())                            # 200
```

**Before the first fix.** IMU samples 0 to 199 come before 1.0003 s. Looking backward there is no fix at all, so all $200$ of them get NaN — one full second at 200 Hz.

**Row 599 at 2.9971 s.** The latest fix at or before it is the one at 2.0004 s, $0.9967\,\mathrm{s}$ old, under $1.2\,\mathrm{s}$. It gets $1050\,\mathrm{m}$, even though the vehicle has climbed since then. That is the honest answer to "what did we know?"

**Row 600 at 3.0021 s.** The fix at 3.0001 s is now available, $2\,\mathrm{ms}$ old. The altitude jumps to $1100\,\mathrm{m}$.

Sanity check: the altitude column is a staircase that steps once a second, exactly like the picture of a zero-order hold.
:::

## Choosing the tolerance

The tolerance is the most important number you pass, and you should be able to defend it. It says how far apart in time two samples may be and still count as "the same moment".

For a nearest match onto a steady stream, start from the stream's spacing. At 200 Hz the samples are $5\,\mathrm{ms}$ apart. Any moment in time lies between two samples, and the nearer of the two is at most **[[half the spacing|half-period]]** away: $2.5\,\mathrm{ms}$. Add a small margin for timestamp jitter, and $3\,\mathrm{ms}$ is a defensible tolerance. Any match further than that means samples are missing, and the right answer is NaN.

For a backward match onto a slow stream, start from its period. GPS fixes are $1\,\mathrm{s}$ apart, so a fix up to about $1\,\mathrm{s}$ old is normal. A tolerance of $1.2\,\mathrm{s}$ accepts that and turns a missed fix into NaN once the last one is more than $1.2\,\mathrm{s}$ stale.

Then ask how much error the skew costs. Two samples $\delta t$ apart (read "delta t") on a vehicle accelerating at $a$ differ in speed by about $a\,\delta t$. At $30\,\mathrm{m/s^2}$ during ascent, a $3\,\mathrm{ms}$ skew is $30 \times 0.003 = 0.09\,\mathrm{m/s}$, which is small next to GPS velocity noise. A $0.2\,\mathrm{s}$ skew is $6\,\mathrm{m/s}$, which is not.

::: warning A big tolerance hides dropouts
It is tempting to pass `tolerance=1.0` "so nothing comes back NaN". In the example above, that would match the fix at $3.0001\,\mathrm{s}$ to IMU sample 640, taken $202\,\mathrm{ms}$ later, and the table would show an acceleration from a different moment as if it belonged to that fix. The NaN was information: it told you about the dropout. Pick the tolerance from the sample rates, not from how the output looks.
:::

Three more details you will meet at once in real data.

When the key is a real datetime column (the kind you built in lesson 9), the tolerance must be a time span too: `tolerance=pd.Timedelta("3ms")`. Passing a bare `0.003` raises a `MergeError`, because pandas cannot tell whether you meant seconds or days.

The two datetime keys must also have the same resolution. In pandas 3, `pd.to_timedelta` on floats picks its unit from the values: whole-second GPS times added to a start `Timestamp` end up in microseconds (`datetime64[us, UTC]`), while 200 Hz IMU times end up in nanoseconds (`datetime64[ns, UTC]`). `merge_asof` then stops with `MergeError: incompatible merge keys`. Cast both keys to one unit before merging: `gps["t"] = gps["t"].dt.as_unit("ns")`, and the same for `imu`.

When one table holds several vehicles or several Monte Carlo runs stacked together, pass `by="run"` as well. pandas then matches only rows with the same run, and within that, nearest in time.

::: warning merge_asof cannot fix a clock offset
merge_asof matches the timestamps it is given. If the GPS stamps are in GPS time and the IMU stamps are in the vehicle's own clock, and the two differ by a constant offset, every match is wrong by that offset — and a tolerance does not catch it. Convert both streams to one time scale first, then align.
:::

## Under the hood: np.searchsorted

How does merge_asof find the nearest sample without comparing every GPS fix to every IMU sample? An hour at 200 Hz is $720{,}000$ samples; checking each one for each fix would be slow. Instead it uses the fact that both tables are sorted.

`np.searchsorted(a, v)` takes a sorted array `a` and some values `v`, and returns, for each value, the position where it would slot into `a` to keep the order. It finds each position with a **[[binary search|binary-search]]**, the "open the phone book in the middle" method.

```python
import numpy as np

tf = np.array([0.0, 0.5, 1.0, 1.5])       # sorted sample times, s
q = np.array([0.2, 0.5, 1.4, 2.0])        # times we want to look up
print(np.searchsorted(tf, q))                 # [1 1 3 4]
print(np.searchsorted(tf, q, side="right"))   # [1 2 3 4]
```

Read the first line. $0.2$ would slot in at position 1, between `tf[0] = 0.0` and `tf[1] = 0.5`. $1.4$ slots in at 3, between $1.0$ and $1.5$. $2.0$ is past the end, so it gets 4, the array's length. The only difference between the two lines is a value that equals an entry: with the default `side="left"` the value $0.5$ goes *before* the equal entry (position 1), and with `side="right"` it goes *after* it (position 2).

So for each lookup time, the returned position `i` points at the first sample *after* it, and `i - 1` at the last sample *before* it. Those two neighbors are the only candidates for a nearest match. Here is a backward match, vectorized with no Python loop over the lookup times:

```python
import numpy as np

def last_before(t_fast, x_fast, t_slow, tol):
    """Latest x_fast at or before each t_slow; NaN if none within tol."""
    tf = np.asarray(t_fast, dtype=float)
    xf = np.asarray(x_fast, dtype=float)
    ts = np.asarray(t_slow, dtype=float)
    i = np.searchsorted(tf, ts, side="right") - 1   # last sample at or before
    ok = i >= 0                                     # -1 means none before
    out = np.full(ts.shape, np.nan)
    age = ts[ok] - tf[i[ok]]
    vals = xf[i[ok]]
    vals[age > tol] = np.nan                        # too stale
    out[ok] = vals
    return out

tf = np.array([0.0, 0.5, 1.0, 1.5])
xf = np.array([10.0, 20.0, 30.0, 40.0])
print(last_before(tf, xf, np.array([-0.1, 0.2, 0.5, 1.4, 2.3]), 0.6))
# [nan 10. 20. 30. nan]
```

Walk through it. `side="right"` minus one gives the last sample *at or before* each time, so $0.5$ matches its own sample (value 20). A lookup at $-0.1\,\mathrm{s}$ gets position $-1$, meaning nothing came before it, and stays NaN. A lookup at $2.3\,\mathrm{s}$ finds the sample at $1.5\,\mathrm{s}$, but it is $0.8\,\mathrm{s}$ old, over the $0.6\,\mathrm{s}$ tolerance, so it becomes NaN too.

A nearest match needs one more step: look at *both* neighbors, `i - 1` and `i`, keep the closer one, and apply the tolerance to that distance. Positions can fall off either end of the array (−1 or the length), so clip them into range with `np.clip` before indexing. That is exactly what the exercise for this module asks you to build.

## Check yourself

::: check
A table of 50 GPS fixes is merged with `pd.merge(gps, imu, on="t", how="left")` against a 200 Hz IMU table. How many rows come back, and what is in the IMU columns? What changes with the default `how="inner"`?
:::

::: answer
A left join keeps every row of the left table, so 50 rows come back. Since no GPS timestamp exactly equals an IMU timestamp, no row finds a partner and every IMU column is NaN. With the default inner join, only keys present in both tables survive, and there are none, so the result has 0 rows. Either way, the exact join has answered the wrong question.
:::

::: check
An IMU runs at 400 Hz. What is the largest possible distance to the nearest sample when none are missing? Suggest a tolerance for a nearest match, and say what a NaN in the result would then mean.
:::

::: answer
The spacing is $1/400\,\mathrm{s} = 2.5\,\mathrm{ms}$, so the nearest sample is at most half of that, $1.25\,\mathrm{ms}$, away. A tolerance a little above that, such as $1.5\,\mathrm{ms}$, allows for timestamp jitter. A NaN then means there was no sample within $1.5\,\mathrm{ms}$, so at least one sample is missing around that moment.
:::

::: check
You are replaying recorded sensor data into a copy of the navigation software to reproduce a fault. To build its input table, should each IMU row get the GPS fix by `"backward"` or `"nearest"`? Why?
:::

::: answer
Backward. The flight software, at the moment of each IMU sample, only had the most recent GPS fix; the next fix had not been received yet. A nearest match would sometimes hand it a fix from up to half a second in the future, which it never had in flight, and the replay would not reproduce what really happened.
:::

::: check
What does `np.searchsorted([2.0, 4.0, 6.0], [1.0, 4.0, 5.0, 7.0])` return? And with `side="right"`? For the lookup at $5.0$, which two samples are the candidates for a nearest match, and which wins?
:::

::: answer
Default `side="left"`: $1.0$ slots in at 0, $4.0$ goes before the equal entry at 1, $5.0$ at 2, $7.0$ past the end at 3. Result `[0 1 2 3]`. With `side="right"`, only the equal value changes: $4.0$ goes after its twin, at 2. Result `[0 2 2 3]`.

For $5.0$, the position is 2, so the candidates are index $1$ ($4.0$, distance $1.0$) and index $2$ ($6.0$, distance $1.0$). They tie, so you need a rule. pandas' nearest picks the earlier sample, $4.0$; a hand-built version should choose the left neighbor when the distances are equal, to agree with it.
:::

::: check
A rocket accelerates at $25\,\mathrm{m/s^2}$. You align IMU velocity to GPS velocity with a tolerance of $50\,\mathrm{ms}$. In the worst accepted case, how much velocity difference could come from timing alone? Is that acceptable if GPS velocity noise is about $0.05\,\mathrm{m/s}$?
:::

::: answer
The speed changes by about $a\,\delta t = 25 \times 0.05 = 1.25\,\mathrm{m/s}$ in $50\,\mathrm{ms}$. That is 25 times the GPS noise, so a mismatch that big would look like a real sensor error. The tolerance is far too loose; at a 200 Hz IMU, a few milliseconds is the right size, giving an error under $0.1\,\mathrm{m/s}$.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| `pd.merge(a, b, on=key)` | exact-equality join; `how` is inner (default), left, right or outer |
| Duplicate keys | multiply rows; guard with `validate="one_to_one"` |
| Exact join on time | finds no matches: clocks never tick together |
| `pd.merge_asof(left, right, on="t")` | nearest-in-time join; both sorted; one output row per left row |
| `direction` | backward (default, what was known), nearest (closest), forward (first after) |
| `tolerance` | nearest onto a stream: a bit over half its spacing; datetime keys need `pd.Timedelta` |
| Timing error | about $a\,\delta t$ for a vehicle accelerating at $a$ |
| `by="run"` | match only within the same group |
| `np.searchsorted(a, v)` | insert positions in sorted `a`; `side="right"` puts equal values after |

Next lesson: your aligned table may now hold ten million rows, far more than a plot can show. You will learn to shrink it for the screen without losing the short spike a reviewer is looking for.

::: context imu Gyros and accelerometers in one box
An inertial measurement unit holds three accelerometers and three gyroscopes, one of each along each of three perpendicular axes. The accelerometers measure specific force (acceleration minus gravity's pull), and the gyros measure rotation rate. Integrating them gives velocity, position and attitude with no outside signal at all, which is why every rocket carries one. The catch is that small sensor errors grow with time, so the IMU is usually corrected by a slower, drift-free source such as GPS. Aligning the two streams in time is the first step of that correction.
:::

::: context two-clocks GPS time is not UTC
Every device stamps data with its own clock, and clocks disagree. GPS satellites keep GPS time, which does not include leap seconds. Since January 2017 it has run 18 seconds ahead of UTC, the time on your phone. A vehicle's flight computer usually counts from its own power-on or from lift-off. Before any alignment, every stream has to be converted to one agreed time scale; otherwise an 18-second offset looks like a sensor that is badly wrong.
:::

::: context sql-join Joins come from databases
The idea of joining tables on a shared key comes from the relational model of data, set out by Edgar F. Codd at IBM in 1970, and from the SQL language built on it. pandas borrowed the names inner, left, right and outer straight from SQL. The picture below shows which keys each kind keeps when the left table has keys 0, 1, 2 and the right has 0, 1, 2, 3.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="30">left keys</text>
    <text x="12" y="58">right keys</text>
    <text x="12" y="96">inner</text>
    <text x="12" y="124">outer</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="110" y="16" width="40" height="20" fill="#8fb8f0"/><text x="130" y="31">0</text>
    <rect x="160" y="16" width="40" height="20" fill="#8fb8f0"/><text x="180" y="31">1</text>
    <rect x="210" y="16" width="40" height="20" fill="#8fb8f0"/><text x="230" y="31">2</text>
    <rect x="110" y="44" width="40" height="20" fill="#f2b880"/><text x="130" y="59">0</text>
    <rect x="160" y="44" width="40" height="20" fill="#f2b880"/><text x="180" y="59">1</text>
    <rect x="210" y="44" width="40" height="20" fill="#f2b880"/><text x="230" y="59">2</text>
    <rect x="260" y="44" width="40" height="20" fill="#f2b880"/><text x="280" y="59">3</text>
    <rect x="110" y="82" width="40" height="20" fill="#1d6fd1"/><text x="130" y="97" fill="#ffffff">0</text>
    <rect x="160" y="82" width="40" height="20" fill="#1d6fd1"/><text x="180" y="97" fill="#ffffff">1</text>
    <rect x="210" y="82" width="40" height="20" fill="#1d6fd1"/><text x="230" y="97" fill="#ffffff">2</text>
    <rect x="110" y="110" width="40" height="20" fill="#1d6fd1"/><text x="130" y="125" fill="#ffffff">0</text>
    <rect x="160" y="110" width="40" height="20" fill="#1d6fd1"/><text x="180" y="125" fill="#ffffff">1</text>
    <rect x="210" y="110" width="40" height="20" fill="#1d6fd1"/><text x="230" y="125" fill="#ffffff">2</text>
    <rect x="260" y="110" width="40" height="20" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/><text x="280" y="125" fill="#b4232c">3</text>
  </g>
  <text x="310" y="124" font-size="11" fill="#b4232c">NaN</text>
  <text x="110" y="146" font-size="11" fill="#6c7a93">here a left join equals inner</text>
</svg>
```
:::

::: context float-equality Why 0.1 + 0.2 is not 0.3
Computers store decimal numbers in binary, and most decimals, like $0.1$, have no exact binary form, the way $\tfrac{1}{3}$ has no exact decimal form. So `0.1 + 0.2 == 0.3` is `False` in Python: the left side is $0.30000000000000004$. A timestamp computed as a start time plus a sample count times a period picks up errors like this. Two streams that "should" share a tick at $1.0\,\mathrm{s}$ can differ in the last digit, and an exact join then misses them. Comparing with a tolerance is the cure, which is what merge_asof does.
:::

::: context as-of A term from the trading floor
"As of" is how finance talks about time: "the price as of 10:00" means the last trade at or before 10:00. Trading systems have joined trades to quotes this way for decades, and the kdb+ database calls it an asof join. pandas added `merge_asof` in version 0.19, in 2016, and its default direction, backward, keeps that original meaning.
:::

::: context zero-order-hold Holding the last value
A zero-order hold turns samples into a continuous signal by keeping each value until the next one arrives, which draws a staircase. "Zero order" means the polynomial used between samples has degree zero: a constant. A first-order hold would draw straight lines between samples instead, which is what linear interpolation does. Digital controllers output their commands through a zero-order hold, and the control lessons later in the course model it explicitly because the staircase adds about half a sample period of delay.
:::

::: context half-period The nearest sample is never far
On a steady stream spaced $T$ apart, any moment lies between two samples, and the nearer one is at most $T/2$ away. At 200 Hz, $T = 5\,\mathrm{ms}$, so the nearest sample is within $2.5\,\mathrm{ms}$. That bound is the starting point for a nearest-match tolerance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="40" y1="48" x2="40" y2="72"/><line x1="140" y1="48" x2="140" y2="72"/>
    <line x1="240" y1="48" x2="240" y2="72"/><line x1="340" y1="48" x2="340" y2="72"/>
  </g>
  <line x1="176" y1="40" x2="176" y2="80" stroke="#b4232c" stroke-width="2.5"/>
  <text x="176" y="32" font-size="12" fill="#b4232c" text-anchor="middle">GPS fix</text>
  <line x1="140" y1="90" x2="190" y2="90" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="140" y1="84" x2="140" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="190" y1="84" x2="190" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="165" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">at most 2.5 ms</text>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="40" y="40">IMU</text><text x="140" y="40">IMU</text><text x="240" y="40">IMU</text>
  </g>
  <text x="90" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">5 ms</text>
</svg>
```
:::

::: context binary-search Halving the phone book
To find a name in a sorted phone book, open it in the middle, see which half the name is in, and repeat on that half. Each step halves what is left, so a sorted list of $N$ items takes about $\log_2 N$ steps (read "log base two of N"). For $720{,}000$ samples, an hour at 200 Hz, that is about 20 steps per lookup instead of up to $720{,}000$. np.searchsorted runs this search for every lookup value in compiled code, which is why it is fast and why the input must be sorted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="16" width="320" height="18" fill="#8fb8f0"/>
  <rect x="180" y="46" width="160" height="18" fill="#8fb8f0"/>
  <rect x="180" y="76" width="80" height="18" fill="#8fb8f0"/>
  <rect x="220" y="106" width="40" height="10" fill="#1d6fd1"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="180" y1="12" x2="180" y2="38"/><line x1="260" y1="42" x2="260" y2="68"/>
    <line x1="220" y1="72" x2="220" y2="98"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="24" y="29">step 1: all N</text>
    <text x="100" y="59">step 2: N/2</text>
    <text x="100" y="89">step 3: N/4</text>
    <text x="100" y="116">step 4: N/8</text>
  </g>
</svg>
```
:::
