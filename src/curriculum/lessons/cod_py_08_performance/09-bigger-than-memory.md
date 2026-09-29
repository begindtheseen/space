---
id: l09-bigger-than-memory
title: Telemetry bigger than memory
minutes: 23
covers:
  - 'numpy.memmap, chunking and Parquet for telemetry larger than memory'
---

Think about a huge encyclopedia — thirty heavy volumes on a shelf. You want to look up one fact about Saturn. You do not carry all thirty volumes to your desk. You take down volume S, open it to the right page, read a paragraph, and put it back. The shelf holds everything; your desk only ever holds what you are reading right now.

A computer has the same two places. The **disk** (or SSD) is the shelf: big, slow and permanent. **RAM** — the computer's working memory — is the desk: fast, but much smaller. A laptop might have $16\,\mathrm{GB}$ of RAM and a $1000\,\mathrm{GB}$ disk. When a data file is bigger than RAM, "load the whole thing into a NumPy array" stops working. Python either crashes with a `MemoryError`, or the machine slows to a crawl as the operating system shuffles memory back and forth.

Rocket telemetry gets that big quickly. A static fire test, a long hot-fire campaign or a day of flight-software testing in a hardware-in-the-loop lab records hundreds of channels, thousands of times a second, for hours. This lesson gives you three tools to work with data like that without ever loading all of it: **`numpy.memmap`**, which lets an array live on disk; **chunking**, which walks through data one piece at a time; and **Parquet**, a file format built so that you can read only the columns and rows you need.

## How big is telemetry?

Start with arithmetic, because the size of a file decides everything else.

A **channel** is one measured quantity recorded over time — a chamber pressure, a tank temperature, one axis of an accelerometer. The **sample rate** is how many readings per second each channel records, in hertz ($\mathrm{Hz}$). Each reading stored as a `float64` takes $8$ bytes; as a `float32`, $4$ bytes.

$$
\text{size in bytes} = \text{channels} \times \text{rate} \times \text{bytes per sample} \times \text{duration in seconds}
$$

::: example Sizing a test campaign
A test stand records $200$ channels at $1000\,\mathrm{Hz}$ as `float64`.

One hour: $200 \times 1000 \times 8 \times 3600 = 5.76 \times 10^{9}$ bytes, which is $5.76\,\mathrm{GB}$.

A ten-hour campaign: $10 \times 5.76 = 57.6\,\mathrm{GB}$.

On a $16\,\mathrm{GB}$ laptop, one hour fits (barely, with room for little else). Ten hours cannot fit at all. Storing as `float32` halves it to $28.8\,\mathrm{GB}$, which still does not fit.

Sanity check: $200$ channels at $1000\,\mathrm{Hz}$ is $200{,}000$ numbers a second, $1.6\,\mathrm{MB}$ a second at $8$ bytes each, and about $5.8\,\mathrm{GB}$ an hour. The two ways of counting agree.
:::

There is a second, sneakier limit. A computation often needs more RAM than the data it starts from. `x - x.mean()` makes a new array the same size as `x`. Reading a text file with pandas can need several times the file's size while it parses. So "the file is $10\,\mathrm{GB}$ and I have $16\,\mathrm{GB}$" is not a safe plan — the vectorization lesson showed how temporaries pile up.

## numpy.memmap: an array that lives on disk

A **memory map** makes a file on disk look like it is already in memory. You get an ordinary-looking NumPy array. When you touch a part of it, the operating system quietly reads that part of the file in. Parts you never touch are never read.

The operating system does this in fixed-size pieces called **[[pages|pages]]** — $4096$ bytes each on most machines. It keeps recently used pages in spare RAM, in the **page cache**, so touching them again is fast. If RAM runs short, it drops pages that have not been used lately; they can always be read again from the file.

`np.memmap(filename, dtype, mode, shape)` makes such an array. The `mode` says what you plan to do: `"r"` read only, `"r+"` read and write an existing file, `"w+"` create a new file (erasing any old one).

Here is a telemetry file made the memory-mapped way. It has $4$ million rows (about $67$ minutes at $1\,\mathrm{kHz}$) and $8$ columns: time, then seven sensor channels. It is written in blocks of half a million rows, so the whole thing is never in RAM at once.

```python
import numpy as np

n_samples, n_channels = 4_000_000, 8          # 1 kHz for about 67 minutes
mm = np.memmap("telemetry.f64", dtype=np.float64, mode="w+",
               shape=(n_samples, n_channels))

rng = np.random.default_rng(3)
block = 500_000
for start in range(0, n_samples, block):
    stop = min(start + block, n_samples)
    t = np.arange(start, stop) / 1000.0                   # seconds
    mm[start:stop, 0] = t
    mm[start:stop, 1:] = rng.normal(size=(stop - start, n_channels - 1))
mm.flush()                                                # make sure it is on disk
print(mm.shape, mm.dtype, f"{mm.nbytes / 1e6:.0f} MB")
del mm

# (4000000, 8) float64 256 MB
```

`mm.flush()` pushes any changed pages still waiting in RAM out to the file. `del mm` closes the map.

Now read it back three ways: open it as a memory map, copy one second of one channel into RAM, and — for comparison — load the entire file with `np.fromfile`.

```python
import time
import numpy as np

t0 = time.perf_counter()
tlm = np.memmap("telemetry.f64", dtype=np.float64, mode="r").reshape(-1, 8)
t_open = time.perf_counter() - t0

t0 = time.perf_counter()
one_second = np.array(tlm[2_000_000:2_001_000, 3])     # copy 1000 samples to RAM
t_slice = time.perf_counter() - t0

t0 = time.perf_counter()
everything = np.fromfile("telemetry.f64", dtype=np.float64).reshape(-1, 8)
t_all = time.perf_counter() - t0

print(f"open memmap      {1000 * t_open:7.2f} ms")
print(f"read 1 s slice   {1000 * t_slice:7.2f} ms")
print(f"load whole file  {1000 * t_all:7.2f} ms")
print(np.array_equal(one_second, everything[2_000_000:2_001_000, 3]))

# One run on a 4-core machine with the page cache emptied first:
# open memmap         0.53 ms
# read 1 s slice      3.58 ms
# load whole file   104.46 ms
# True
```

Opening took half a millisecond: nothing was read, because nothing was touched yet. Reading one second of one channel took a few milliseconds. Loading everything took about $0.1\,\mathrm{s}$ on this machine — it varied from $0.09$ to $1.6\,\mathrm{s}$ across runs, depending on what the disk was doing — and, more importantly, needed all $256\,\mathrm{MB}$ of RAM. Scale the file up to $57.6\,\mathrm{GB}$ and the slice still takes milliseconds, while the full load becomes impossible. Run the script a second time and the slice drops to a few hundredths of a millisecond: its pages are now sitting in the page cache.

`reshape(-1, 8)` needs a word. A raw memory map of a plain binary file is one long row of numbers; the file does not know its own shape. `reshape(-1, 8)` means "8 columns, and work out the number of rows yourself" ($-1$ is the "you figure it out" value).

::: key
What is numpy.memmap for? Treating an on-disk array as an ndarray, with the OS paging in only the parts you touch. It is how you analyze a telemetry file larger than RAM without writing a chunking loop by hand.
:::

::: example What one second of one channel really reads
Take the ten-hour, $200$-channel file from the first example, stored the same way as ours: one row per time step, all channels side by side. That layout is called **[[row-major|row-major]]**, and it is NumPy's default.

One row is $200 \times 8 = 1600$ bytes. One second is $1000$ rows, so one second of *one* channel is spread across $1000 \times 1600 = 1{,}600{,}000$ bytes of file — $1.6\,\mathrm{MB}$ — because each sample sits $1600$ bytes after the previous one. That is about $1.6 \times 10^6 / 4096 \approx 391$ pages. The operating system reads all of them, including the $199$ channels you did not ask for.

Now store the same data channel by channel: all of channel $0$, then all of channel $1$, and so on. One second of one channel is then $1000 \times 8 = 8000$ bytes in a row — about $2$ pages.

Both are tiny next to $57.6\,\mathrm{GB}$. But if your job is "read all of channel $37$ for the whole ten hours", the row layout reads the entire $57.6\,\mathrm{GB}$ file to get $288\,\mathrm{MB}$ of data, and the channel layout reads only the $288\,\mathrm{MB}$. Match the layout to how you will read it. Parquet, later in this lesson, stores data by column for exactly this reason.
:::

### The .npy format remembers its shape

A raw binary file forgets its `dtype` and shape; you must remember them and type them in correctly. NumPy's own `.npy` format writes a small **header** at the start of the file that records them. `np.lib.format.open_memmap` creates a memory-mapped `.npy` file, and `np.load(path, mmap_mode="r")` opens one as a memory map.

```python
import numpy as np

out = np.lib.format.open_memmap("accel.npy", mode="w+",
                                dtype=np.float32, shape=(3_000_000, 3))
out[:] = 0.0
out[:, 2] = -9.81                     # a resting accelerometer, z axis down
out.flush()
del out

acc = np.load("accel.npy", mmap_mode="r")   # shape and dtype come from the header
print(type(acc).__name__, acc.shape, acc.dtype)
print(acc[1_500_000])

# memmap (3000000, 3) float32
# [ 0.    0.   -9.81]
```

Prefer `.npy` whenever you control how the file is written. It is also what the last lesson meant by "let the workers load the data themselves": save a big array once with `np.save`, and every worker process opens it with `np.load(path, mmap_mode="r")`. The operating system keeps one copy of each page in its cache and shares it among all the workers.

::: warning A wrong dtype gives garbage, not an error
A raw memory map believes whatever `dtype` you tell it. Open our `float64` file as `float32` and NumPy cuts every 8-byte number into two 4-byte halves and reads each half as its own number:

```python
import numpy as np
wrong = np.memmap("telemetry.f64", dtype=np.float32, mode="r")
print(wrong.shape, np.round(wrong[16:20], 3))
right = np.memmap("telemetry.f64", dtype=np.float64, mode="r")
print(right.shape, np.round(right[8:10], 3))

# (64000000,) [-5.1896949e+11  8.1400001e-01 -6.2589596e+07 -1.6070000e+00]
# (32000000,) [ 0.001 -0.232]
```

Twice as many "numbers", and nonsense values like $-5.19 \times 10^{11}$, with no warning. Always check a few values you know — the time column should start $0.000, 0.001, 0.002, \ldots$ — before trusting a raw file. Files from other machines can also differ in **[[byte order|byte-order]]**.
:::

::: warning Whole-array operations still read, and still allocate
A memmap looks like a normal array, so it is easy to write `tlm[:, 1:].std(axis=0)`. That reads every page of the file, which is slow but works. Worse, `tlm * 2.0` or `tlm - tlm.mean(axis=0)` build a brand-new, full-size array *in RAM* — the result is not a memory map. On a file bigger than RAM, that is the crash you were trying to avoid. For whole-file calculations, use chunks.
:::

## Chunking: one piece at a time

**Chunking** means processing a big dataset as a series of smaller blocks, each small enough to fit comfortably in RAM, and combining the per-block results into the final answer. It is how you read a thick book: a chapter at a time, keeping a few notes as you go.

The trick is choosing what to carry from one chunk to the next. Some answers combine easily:

- **Count, sum, minimum and maximum** — keep a running total or a running max, and update it with each chunk.
- **Mean** — keep a running sum and count; divide at the end.
- **Standard deviation** — the spread about the mean. The simplest safe way is two passes: the first pass finds the mean, the second adds up squared distances from it.

Here are the mean, standard deviation and largest magnitude of all seven sensor channels, computed in chunks of $250{,}000$ rows. `tracemalloc`, a standard-library module, measures how much RAM the arrays actually used.

```python
import tracemalloc
import numpy as np

tlm = np.memmap("telemetry.f64", dtype=np.float64, mode="r").reshape(-1, 8)
data = tlm[:, 1:]                       # the 7 sensor channels, still on disk
n = data.shape[0]
block = 250_000                         # rows per chunk: 14 MB of float64

tracemalloc.start()

# pass 1: count, sum and largest magnitude, one chunk at a time
total = np.zeros(7)
peak = np.zeros(7)
for start in range(0, n, block):
    chunk = np.array(data[start:start + block])    # copy this chunk into RAM
    total += chunk.sum(axis=0)
    peak = np.maximum(peak, np.abs(chunk).max(axis=0))
mean = total / n

# pass 2: spread about the mean
sq = np.zeros(7)
for start in range(0, n, block):
    chunk = np.array(data[start:start + block])
    sq += ((chunk - mean) ** 2).sum(axis=0)
std = np.sqrt(sq / n)

_, peak_bytes = tracemalloc.get_traced_memory()
tracemalloc.stop()

print("mean", np.round(mean, 4))
print("std ", np.round(std, 4))
print("max|x|", np.round(peak, 2))
print(f"peak RAM for arrays: {peak_bytes / 1e6:.0f} MB of a {tlm.nbytes / 1e6:.0f} MB file")
print(np.allclose(std, np.asarray(data).std(axis=0)))

# mean [-0.0003  0.001   0.0003 -0.0008 -0.0001  0.0005 -0.0001]
# std  [0.9998 1.     0.9998 1.0005 0.9998 1.0003 0.9998]
# max|x| [5.45 5.07 5.12 5.18 5.25 5.59 5.62]
# peak RAM for arrays: 28 MB of a 256 MB file
# True
```

The final line checks the chunked answer against NumPy's own `std` over the whole array, and they agree. (That check does load everything, which is fine for a $256\,\mathrm{MB}$ test file and is exactly what you would not do on the real one.)

::: example Choosing a chunk size
The peak was $28\,\mathrm{MB}$: one chunk of $250{,}000 \times 7 \times 8 = 14{,}000{,}000$ bytes ($14\,\mathrm{MB}$) plus one temporary the same size, from `chunk - mean`. That is about a tenth of the file.

For the $57.6\,\mathrm{GB}$ campaign, aim for chunks of around $100\,\mathrm{MB}$ — big enough that NumPy's per-call overhead is invisible, small enough that a few temporaries fit easily. Each row is $1600$ bytes, so

$$
\frac{100 \times 10^6\,\mathrm{bytes}}{1600\,\mathrm{bytes/row}} = 62{,}500\,\mathrm{rows\ per\ chunk}.
$$

Ten hours at $1000\,\mathrm{Hz}$ is $36{,}000{,}000$ rows, so that is $36{,}000{,}000 / 62{,}500 = 576$ chunks. Peak RAM stays at a few hundred megabytes, whatever the file size. Sanity check: $576 \times 100\,\mathrm{MB} = 57.6\,\mathrm{GB}$, the whole file.
:::

::: warning Windows that cross a chunk edge
A **[[moving window|moving-window]]** statistic, such as a $50$-sample moving average, needs samples from *before* the start of each chunk. If each chunk starts fresh, the first $49$ outputs of every chunk are wrong or missing, and nothing crashes to tell you. Carry the last $w - 1$ samples of each chunk over to the front of the next one.
:::

Text files chunk the same way. `pandas.read_csv` takes a `chunksize` argument and then hands back one DataFrame of that many rows at a time instead of the whole file. `usecols` reads only the named columns. Here, the mean tank temperature during the coast phase of a $2$-million-row CSV file. (The script that makes `tlm.csv` is in the Parquet section below; run it first.)

```python
import pandas as pd

total, count = 0.0, 0
for chunk in pd.read_csv("tlm.csv", chunksize=500_000,
                         usecols=["phase", "tank_temp"]):
    coast = chunk[chunk["phase"] == "coast"]
    total += coast["tank_temp"].sum()
    count += len(coast)
print(f"{count} coast samples, mean tank temperature {total / count:.2f} K")

# 600000 coast samples, mean tank temperature 93.40 K
```

Notice the mean is combined as one grand sum over one grand count. Averaging the per-chunk averages would be wrong whenever the chunks hold different numbers of coast samples, as they do here.

## Parquet: a file format built for this

CSV is text. Every number is written as characters, every read has to turn characters back into numbers, and to get one column you must read every character of every row. That is slow and large.

**Parquet** is a file format for tables designed for exactly the jobs in this lesson. Four features matter:

- **Columnar.** Each column is stored together, one after another, like the channel-by-channel layout in the example above. Reading one column reads only that column.
- **Typed.** A `float32` column is stored as `float32`, an `int8` as `int8`, and a text column that repeats a few values (like a flight phase) as a small table of codes. No parsing.
- **Compressed.** Each column is squeezed with a **[[compression|compression]]** method; similar values sitting next to each other compress well.
- **Row groups with statistics.** The file is cut into blocks of rows called **row groups**. For each column in each row group, the file records the minimum and maximum. A reader asking for "rows where `t` is between $600$ and $1400$" can skip every row group whose range does not overlap, without reading it.

In Python, pandas reads and writes Parquet through the **pyarrow** library. `df.to_parquet(path)` writes; `pd.read_parquet(path, columns=[...], filters=[...])` reads only what you name.

Here is a $2$-million-row telemetry table ($2000\,\mathrm{s}$ at $1\,\mathrm{kHz}$) with a time column, four sensor channels of different types, and a flight-phase label, saved as both CSV and Parquet.

```python
import os
import numpy as np
import pandas as pd

n = 2_000_000                                   # 2000 s at 1 kHz
rng = np.random.default_rng(5)
t = np.arange(n) / 1000.0
phase = np.where(t < 600, "prelaunch", np.where(t < 1400, "ascent", "coast"))
df = pd.DataFrame({
    "t": t,
    "chamber_p": (np.where(phase == "ascent", 9.7e6, 0.0)
                  + rng.normal(0, 2e4, n)).astype("float32"),     # Pa
    "tank_temp": (90.0 + 0.002 * t + rng.normal(0, 0.05, n)).round(2)
                 .astype("float32"),                              # K
    "accel_x": rng.normal(0, 0.3, n).astype("float32"),           # m/s^2
    "valve_open": (phase == "ascent").astype("int8"),
    "phase": pd.Categorical(phase),
})
df.to_parquet("tlm.parquet", row_group_size=250_000)   # pyarrow engine
df.to_csv("tlm.csv", index=False)
for f in ("tlm.csv", "tlm.parquet"):
    print(f"{f:<12} {os.path.getsize(f) / 1e6:6.1f} MB")
print(f"in memory    {df.memory_usage(deep=True).sum() / 1e6:6.1f} MB")

# tlm.csv        93.1 MB
# tlm.parquet    34.6 MB
# in memory      44.0 MB
```

The Parquet file is $93.1 / 34.6 \approx 2.7$ times smaller than the CSV, and even smaller than the table in RAM. Most of these columns are random noise, which barely compresses; real telemetry, with slowly changing temperatures and valves that sit still for minutes, usually shrinks much more.

Now read it back in different ways.

```python
import time
import pandas as pd
import pyarrow.parquet as pq

def clock(label, fn):
    t0 = time.perf_counter()
    out = fn()
    print(f"{label:<28} {1000 * (time.perf_counter() - t0):7.1f} ms")
    return out

clock("CSV, everything", lambda: pd.read_csv("tlm.csv"))
clock("Parquet, everything", lambda: pd.read_parquet("tlm.parquet"))
p = clock("Parquet, one column", lambda: pd.read_parquet("tlm.parquet", columns=["chamber_p"]))
a = clock("Parquet, ascent rows only", lambda: pd.read_parquet(
    "tlm.parquet", columns=["t", "chamber_p"], filters=[("t", ">=", 600.0), ("t", "<", 1400.0)]))
print(len(p), len(a), round(float(a["chamber_p"].mean()) / 1e6, 3), "MPa")

meta = pq.ParquetFile("tlm.parquet").metadata
print(meta.num_rows, "rows in", meta.num_row_groups, "row groups")
st = meta.row_group(3).column(0).statistics
print("row group 3, column t: min", st.min, "max", st.max)

# One run on a 4-core machine (yours will differ):
# CSV, everything               1316.8 ms
# Parquet, everything            186.0 ms
# Parquet, one column             20.1 ms
# Parquet, ascent rows only       33.9 ms
# 2000000 800000 9.7 MPa
# 2000000 rows in 8 row groups
# row group 3, column t: min 750.0 max 999.999
```

Reading everything from Parquet was about $7$ times faster than from CSV ($1316.8 / 186.0 \approx 7.1$) — no text to parse. Reading one column was another $9$ times faster again. The filtered read returned exactly the $800{,}000$ ascent rows ($t$ from $600$ to $1400\,\mathrm{s}$ at $1000$ rows per second), with the mean chamber pressure of $9.7\,\mathrm{MPa}$ the table was built with.

The last lines look inside the file. It holds $8$ row groups of $250{,}000$ rows. Row group $3$ covers $t$ from $750.0$ to $999.999\,\mathrm{s}$, and the file says so in its own metadata. That is how the filter could skip the row groups before $600\,\mathrm{s}$ and after $1400\,\mathrm{s}$ without reading them.

### Streaming a Parquet file in batches

For a Parquet file bigger than RAM, even one column may be too large. `pyarrow.parquet.ParquetFile.iter_batches` hands you the file a batch of rows at a time — chunking and Parquet together.

```python
import numpy as np
import pyarrow.parquet as pq

f = pq.ParquetFile("tlm.parquet")
peak_p = -np.inf
samples_high = 0
batches = 0
for batch in f.iter_batches(batch_size=100_000, columns=["chamber_p"]):
    p = batch.column("chamber_p").to_numpy()      # one batch as a NumPy array
    peak_p = max(peak_p, float(p.max()))
    samples_high += int((p > 9.5e6).sum())
    batches += 1

print(f"{batches} batches, peak {peak_p / 1e6:.3f} MPa")
print(f"above 9.5 MPa for {samples_high / 1000:.1f} s")

# 20 batches, peak 9.794 MPa
# above 9.5 MPa for 800.0 s
```

Twenty batches of $100{,}000$ rows. The chamber was above $9.5\,\mathrm{MPa}$ for $800{,}000$ samples, which at $1000$ samples per second is $800\,\mathrm{s}$ — the whole ascent phase, as it should be.

## Which tool when

| Situation | Tool | Why |
|---|---|---|
| Big numeric array, random access to pieces | `np.load(..., mmap_mode="r")` on a `.npy` file | OS pages in only what you touch |
| Raw binary file from a recorder | `np.memmap` with the right `dtype` and shape | no copy, but you supply the layout |
| Whole-file statistics | chunked loop over a memmap or file | peak RAM set by chunk size, not file size |
| Many columns, analysis uses a few | Parquet with `columns=` | columnar: unread columns cost nothing |
| Need a time range or a phase | Parquet with `filters=` | row-group statistics skip whole blocks |
| Parquet file bigger than RAM | `ParquetFile.iter_batches` | chunking and Parquet together |
| Arrays shared by worker processes | `.npy` plus `mmap_mode="r"` in each worker | one copy in the page cache, shared |

## Check yourself

::: check
A flight computer logs $64$ channels at $500\,\mathrm{Hz}$ as `float32` for a $9$-minute flight. How big is the log? Would it fit in the RAM of a $16\,\mathrm{GB}$ laptop?
:::

::: answer
$9$ minutes is $540\,\mathrm{s}$. Size $= 64 \times 500 \times 4 \times 540 = 69{,}120{,}000$ bytes, about $69\,\mathrm{MB}$. That fits in RAM with room to spare — no memory map or chunking needed for this one. The tools in this lesson are for test campaigns and ground data that run to tens of gigabytes, not every file.
:::

::: check
You open a $40\,\mathrm{GB}$ `.npy` file with `np.load(path, mmap_mode="r")` and it returns instantly. Then `x.mean()` takes several minutes, and `y = x - x.mean()` crashes. Explain both.
:::

::: answer
Opening only reads the small header and sets up the mapping; no data pages are touched, so it is instant. `x.mean()` has to look at every number, so the operating system reads all $40\,\mathrm{GB}$ from disk page by page — slow, but it works, because the pages can be dropped again as it goes. `x - x.mean()` creates a brand-new $40\,\mathrm{GB}$ array in RAM (the result of arithmetic on a memmap is an ordinary in-memory array), which cannot fit, so it fails. The fix is a chunked loop that subtracts the mean from one block at a time and writes each result block to an output memmap or file.
:::

::: check
A colleague computes the mean of a channel in chunks by averaging the per-chunk means. The file has $10{,}000{,}000$ rows in chunks of $3{,}000{,}000$. Why is the answer slightly wrong, and how do you fix it?
:::

::: answer
The chunks are $3$, $3$, $3$ and $1$ million rows. Averaging the four chunk means gives the last chunk the same weight as each of the others, although it holds a third as many rows, so its samples count three times too much. Fix: carry a running sum and a running count, and divide once at the end: mean $=$ (sum of all chunk sums) / $10{,}000{,}000$. Equivalently, weight each chunk mean by its row count.
:::

::: check
A test report needs only the chamber pressure and the time for the $120\,\mathrm{s}$ of a burn, from a $300$-column, $5$-hour telemetry file. Why is Parquet a much better storage choice than CSV or a row-major binary file for this?
:::

::: answer
Parquet is columnar, so asking for `columns=["t", "chamber_p"]` reads $2$ of the $300$ columns and skips the other $298$ entirely. Its row groups carry the minimum and maximum of each column, so a filter on `t` for the $120\,\mathrm{s}$ window skips every row group outside the burn. CSV forces you to read and parse every character of every row. A row-major binary file interleaves all $300$ channels in every row, so reading one channel pulls in the pages holding all the others. Parquet also stores numbers compactly and compressed, so the file itself is smaller.
:::

::: check
You compute a $200$-sample moving average of a long signal in chunks of $1{,}000{,}000$ samples, starting each chunk fresh. What goes wrong, and what exactly should you carry between chunks?
:::

::: answer
Each output needs the $200$ samples ending at that point. At the start of a chunk, the first $199$ windows reach back into the previous chunk, which you have thrown away, so those outputs are missing or computed from too few samples. Carry the last $199$ samples ($w - 1$) of each chunk and put them in front of the next chunk before computing; then every window is complete and the chunked result matches the whole-signal one.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| telemetry size | channels × rate × bytes × seconds | $200$ ch, $1\,\mathrm{kHz}$, `float64`: $5.76\,\mathrm{GB}$ per hour |
| memory map | file that looks like an array | the OS reads only the $4096$-byte pages you touch |
| `np.memmap` | raw binary file as an ndarray | you must give the right `dtype` and shape |
| `.npy` with `mmap_mode="r"` | memmap with a header | shape and `dtype` stored in the file |
| row-major layout | one row per time step | one channel alone is spread across the file |
| chunking | process block by block, combine | peak RAM set by chunk size |
| chunk combine rules | sums, counts, max carry; means need sum and count | two passes for standard deviation |
| Parquet | columnar, typed, compressed, row groups | `columns=` and `filters=` read only what you need |
| `iter_batches` | stream a Parquet file in pieces | chunking for files bigger than RAM |

The next lesson turns from data that is too big to work that is done too often: **[[caching and precomputing|bridge-caching]]** lookup tables and interpolators so that each is built once instead of inside every loop.

::: context pages Why memory comes in pages
The operating system does not track memory byte by byte; it would need more bookkeeping than there is memory. Instead it manages fixed blocks called pages, usually $4096$ bytes. Each program sees its own tidy range of addresses, and a table maps each page of that range to a real page of RAM, or to "not loaded yet". When your code touches a page that is not loaded, the processor stops, the operating system reads that page from the file, fills in the table and lets the code continue. That pause is a page fault, and it is how a memory map reads only what you touch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44">file on disk (pages)</text>
  <rect x="10" y="30" width="340" height="26" fill="#fff" stroke="#1f2a44"/>
  <line x1="52.5" y1="30" x2="52.5" y2="56" stroke="#6c7a93"/>
  <line x1="95" y1="30" x2="95" y2="56" stroke="#6c7a93"/>
  <line x1="137.5" y1="30" x2="137.5" y2="56" stroke="#6c7a93"/>
  <line x1="180" y1="30" x2="180" y2="56" stroke="#6c7a93"/>
  <line x1="222.5" y1="30" x2="222.5" y2="56" stroke="#6c7a93"/>
  <line x1="265" y1="30" x2="265" y2="56" stroke="#6c7a93"/>
  <line x1="307.5" y1="30" x2="307.5" y2="56" stroke="#6c7a93"/>
  <rect x="137.5" y="30" width="42.5" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="265" y="30" width="42.5" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="10" y="100" font-size="12" fill="#1f2a44">RAM (page cache)</text>
  <rect x="140" y="85" width="120" height="26" fill="#fff" stroke="#1f2a44"/>
  <rect x="145" y="89" width="42.5" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="200" y="89" width="42.5" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="158.75" y1="56" x2="166" y2="89" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="286.25" y1="56" x2="221" y2="89" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">only the 2 touched pages of 8 are read</text>
</svg>
```
:::

::: context row-major Rows or columns first
A table in memory is really one long line of numbers, so it must be laid out in some order. Row-major order writes row $0$ in full, then row $1$, and so on; it is NumPy's default and the language C's. Column-major order writes column $0$ in full, then column $1$; Fortran and MATLAB use it. Neither is better in general. What matters is that the numbers you read together sit together. For telemetry you often read one channel over a long time, which favors storing by column — the idea behind Parquet.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">row-major: t0 a b c | t1 a b c | …</text>
  <rect x="10" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="40" y="26" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="70" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="100" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="130" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="160" y="26" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="220" y="26" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="262" y="42" font-size="11" fill="#1f2a44">channel a: scattered</text>
  <text x="10" y="76" font-size="12" fill="#1f2a44">by column: a a a a | b b b b | …</text>
  <rect x="10" y="84" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="40" y="84" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="70" y="84" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="84" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="130" y="84" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="160" y="84" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="190" y="84" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <rect x="220" y="84" width="30" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="262" y="100" font-size="11" fill="#1f2a44">channel a: together</text>
</svg>
```
:::

::: context byte-order Which end of the number comes first
A `float64` is $8$ bytes, and machines disagree about which byte goes first. Most modern processors, including x86 and ARM chips, are **little-endian**: the least significant byte first. Some older flight computers, network protocols and file formats are **big-endian**. NumPy writes the choice into the dtype: `'<f8'` is little-endian `float64`, `'>f8'` big-endian. Reading a big-endian recording as little-endian gives wild values, exactly like a wrong dtype. The names come from *Gulliver's Travels*, where two nations went to war over which end of a boiled egg to crack.
:::

::: context moving-window The window reaches back
A moving window of width $w$ ending at sample $i$ uses samples $i - w + 1$ through $i$. For the first $w - 1$ samples of any block, part of that range lies in the previous block. The fix of carrying $w - 1$ samples forward is the same idea as the cumulative-sum trick from the complexity lesson: keep exactly the state the next step needs and nothing more. Filters with memory, such as a low-pass filter in a navigation pipeline, need the same care — carry the filter's internal state across the chunk boundary, not the raw samples.
:::

::: context compression How similar neighbors shrink
Compression finds repetition and writes it more briefly. A valve column that reads $0$ for $600{,}000$ samples and then $1$ for $800{,}000$ can be stored as "$0$, $600{,}000$ times; $1$, $800{,}000$ times" — a handful of bytes. Parquet uses tricks like this per column, then a general-purpose compressor; pandas with pyarrow uses one called Snappy by default, which is fast to decompress, and Zstandard is a common choice when smaller files matter more. Random noise has no repetition, so it barely shrinks, which is why the lesson's mostly-random table compressed only modestly.
:::

::: context bridge-caching From big data to repeated work
This lesson dealt with data that does not fit. The next one deals with work that is repeated: rebuilding the same atmosphere table or aerodynamic interpolator every time a function is called. The two meet in practice. A precomputed table saved as a `.npy` file and opened with `mmap_mode="r"` in each Monte Carlo worker is built once, stored once, and shared by every process.
:::
