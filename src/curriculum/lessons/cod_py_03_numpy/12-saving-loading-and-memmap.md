---
id: l12-saving-loading-and-memmap
title: Saving, loading and memory-mapping big telemetry
minutes: 19
covers:
  - save, load, npz, memmap for big telemetry
---

Imagine copying a recipe for a friend. You could read it aloud while they write it down in their own handwriting — slow, and a "1/4 cup" might come out as "1/2 cup". Or you could hand them a photocopy: fast, and exactly the same as the original. Saving numbers as text, like a CSV file, is reading the recipe aloud. Saving them in NumPy's own [[binary format|other-formats]] is the photocopy.

In the Python basics module you wrote CSV and JSON files. Those are right for small tables that people will read. Flight data is different. A single test on a satellite's attitude sensors can log millions of samples, and a year of fleet telemetry is far bigger than the memory of any laptop. You need files that store the exact bits, load in a blink, carry their own shape and dtype, and — for the really big ones — let you work on a file without reading it into memory at all.

This lesson covers `np.save` and `np.load` for one array, `np.savez` and `np.savez_compressed` for several, why `allow_pickle` is off by default, and **memory mapping** with `np.memmap` and `np.load(..., mmap_mode='r')`, which lets you treat a 200 GB file on disk as if it were an array in memory.

## One array: np.save and np.load

`np.save(filename, array)` writes one array to a **.npy** file. `np.load(filename)` reads it back:

```python
import numpy as np, os

rng = np.random.default_rng(5)
gyro = rng.normal(0.0, 0.002, size=(1000, 3))     # rad/s, 10 s at 100 Hz
np.save("gyro.npy", gyro)
print(os.path.getsize("gyro.npy"))
# 24128
back = np.load("gyro.npy")
print(back.shape, back.dtype, np.array_equal(back, gyro))
# (1000, 3) float64 True
```

Three things to notice. The file came back with its shape and dtype without you saying what they were. The values are *exactly* equal — `np.array_equal` is safe here, unlike after arithmetic, because no arithmetic happened: the bits were copied. And the size is $24\,128$ bytes.

### What is inside a .npy file

Where does $24\,128$ come from? The data is $1000 \times 3$ numbers at 8 bytes each, $24\,000$ bytes. The other 128 bytes are a **header**, a short label at the front of the file. You can read it yourself:

```python
with open("gyro.npy", "rb") as f:
    head = f.read(128)
print(head[:10])
# b'\x93NUMPY\x01\x00v\x00'
print(head[10:].decode("latin1").rstrip())
# {'descr': '<f8', 'fortran_order': False, 'shape': (1000, 3), }
```

- The first six bytes, `\x93NUMPY`, are a **[[magic number|magic-number]]**: a fixed signature that says "this is a .npy file".
- The next two bytes, `\x01\x00`, are the format version, 1.0.
- The next two, `v\x00`, give the length of the rest of the header: the byte `v` is 118, so the header is $10 + 118 = 128$ bytes.
- Then comes a plain-text Python dictionary. `'descr': '<f8'` is the dtype: `<` for **[[little-endian|endianness]]** byte order, `f` for float, `8` for 8 bytes — float64. `'fortran_order': False` says the data is in C order, the row-by-row layout from lesson 7. `'shape'` is the shape.

After the header, the raw bytes of the array follow in order, exactly as they sat in memory. That is why loading is fast: NumPy reads the header, sets up an empty array of the right shape and dtype, and pours the bytes straight in. The header is padded so the data always starts at a round byte position, which makes the next trick, memory mapping, efficient.

Compare text. The same array written with `np.savetxt` to a CSV file takes $76\,456$ bytes, over three times as much, and on the computer this lesson was written on it loaded about 20 times more slowly. CSV is for people and spreadsheets. `.npy` is for your own programs.

::: key np.save and the .npy format
`np.save("x.npy", a)` writes one array: a header (magic `\x93NUMPY`, version, then a dictionary with `descr` (dtype), `fortran_order` and `shape`), followed by the raw bytes. `np.load("x.npy")` restores the exact array, shape and dtype included.
:::

::: warning Keep the extension
`np.save("gyro", a)` quietly adds `.npy` and writes `gyro.npy`. Then `np.load("gyro")` fails with `FileNotFoundError`. Always write the extension yourself, in both calls, so the name in the code is the name on disk.
:::

## Several arrays: .npz files

A telemetry pass is rarely one array. You have time stamps, gyro readings, a flight-mode flag, maybe a quaternion history. **`np.savez`** stores several arrays in one **.npz** file, each under a name you choose:

```python
rng = np.random.default_rng(5)
n = 100_000
t = np.arange(n) * 0.01                                  # s, 100 Hz
gyro = rng.normal(0.0, 0.002, size=(n, 3))               # rad/s, noisy
mode = np.zeros(n, dtype=np.int8); mode[40_000:] = 2     # flight-mode flag
np.savez("pass.npz", t=t, gyro=gyro, mode=mode)

with np.load("pass.npz") as d:
    print(d.files)
    # ['t', 'gyro', 'mode']
    print(d["gyro"].shape, d["mode"].dtype)
    # (100000, 3) int8
```

The keyword names (`t=`, `gyro=`, `mode=`) become the names inside the file. Loading a `.npz` gives you an object that behaves like a dictionary: `d.files` lists the names and `d["gyro"]` reads that one array. Reading is **lazy**: an array is only read from disk when you ask for it by name, so opening a file with twenty arrays to read one is cheap. The `with` block (the context managers from the idiomatic Python module) closes the file afterwards.

Inside, a `.npz` is an ordinary **[[zip archive|zip-inside]]** holding one `.npy` file per array — `t.npy`, `gyro.npy`, `mode.npy`. Any zip tool can open it.

### Compressed or not

**`np.savez_compressed`** is the same, except it squeezes each array with the same compression zip files use. Whether that helps depends entirely on the data:

| Array | Bytes in memory | Bytes compressed | Shrink |
| --- | --- | --- | --- |
| `t`, evenly spaced times | 800,000 | 215,389 | about 3.7 times |
| `gyro`, sensor noise | 2,400,000 | 2,300,384 | about 4% |
| `mode`, a flag that changes once | 100,000 | 325 | about 300 times |

Compression works by finding patterns and repeats. A mode flag that sits at `0` for 40,000 samples and `2` for 60,000 is almost all repeats. Sensor noise has, by design, almost no pattern, so it barely shrinks — and compressed files are slower to write and read. Use `savez_compressed` for archives full of flags, counters and slowly changing values. Use plain `savez` or `save` when the data is noisy floats and speed matters.

::: key npz
`np.savez("f.npz", t=t, gyro=gyro)` stores several named arrays in one zip file; `np.savez_compressed` also compresses each one. `np.load("f.npz")` returns a lazy, dictionary-like object: `d.files`, `d["gyro"]`. Compression helps repetitive data a lot and random noise hardly at all.
:::

::: example Sizing a day of telemetry
A small satellite logs 16 channels (gyros, accelerometers, magnetometer, temperatures, currents) at $10\,\mathrm{Hz}$, as float32. How big is one day as a `.npy` file, and what would float64 cost?

**Step 1.** Samples per day: $10\,\mathrm{Hz} \times 86\,400\,\mathrm{s} = 864\,000$ rows.

**Step 2.** Values: $864\,000 \times 16 = 13\,824\,000$ numbers.

**Step 3.** Bytes in float32: $13\,824\,000 \times 4 = 55\,296\,000$ bytes, plus the 128-byte header: about $55.3\,\mathrm{MB}$.

**Step 4.** In float64 it doubles, to about $110.6\,\mathrm{MB}$.

**Sanity check.** Check with the shape alone: `np.zeros((864_000, 16), dtype=np.float32).nbytes` is `55296000`, matching Step 3. A day fits easily in memory. A year, $365$ times more, is about $20\,\mathrm{GB}$ in float32 — more than many laptops have. Storing it as float32 is fine (lesson 10: float32 for bulk storage), as long as you convert slices to float64 before doing arithmetic on them.
:::

## allow_pickle: why a file should not run code

A `.npy` file holds numbers. But NumPy also has **object arrays**, whose elements are arbitrary Python objects — for example a "ragged" collection of passes of different lengths. Those cannot be stored as raw bytes, so NumPy stores them with **[[pickle|pickle-danger]]**, Python's general way of turning any object into bytes and back.

The danger is how pickle rebuilds an object. The file itself contains instructions like "call this function with these arguments". Whoever made the file chose the function. Here is a harmless demonstration — the "attack" only prints a line:

```python
import numpy as np

class Surprise:
    def __reduce__(self):
        return (print, ("this line ran inside np.load",))

np.save("surprise.npy", np.array([Surprise()], dtype=object))
out = np.load("surprise.npy", allow_pickle=True)
# this line ran inside np.load
```

`__reduce__` tells pickle how to rebuild the object; here it says "call `print`". Loading the file ran that call. A malicious file could name `os.system` instead, with a command that deletes files or steals credentials, and it would run the moment you loaded it.

That is why `np.load` has **`allow_pickle=False`** by default. With the default, a file that needs pickle is refused:

```python
passes = np.array([np.zeros(3), np.zeros(5)], dtype=object)   # ragged: an object array
np.save("ragged.npy", passes)
np.load("ragged.npy")
# ValueError: Object arrays cannot be loaded when allow_pickle=False
```

::: warning Never allow_pickle on a file you did not make
Setting `allow_pickle=True` on a file from an email, a shared drive or the internet is the same as running a program someone sent you. Leave it off. If you need ragged data, store it without objects: one flat array of all samples plus an array of where each pass starts, saved together in a `.npz`. Plain numeric `.npy` and `.npz` files are safe to load.
:::

## Memory mapping: arrays bigger than memory

Now the big case. A fleet archive holds one year of one satellite's telemetry: 16 channels at $100\,\mathrm{Hz}$, in float32. Size it:

$$
100\,\mathrm{Hz} \times 86\,400\,\mathrm{s/day} \times 365\,\mathrm{days} = 3.1536 \times 10^{9} \text{ rows}
$$

$$
3.1536 \times 10^{9} \times 16 \times 4\,\mathrm{bytes} \approx 2.02 \times 10^{11}\,\mathrm{bytes} \approx 202\,\mathrm{GB}.
$$

Your laptop has $16\,\mathrm{GB}$ of memory. `np.load` would try to read all 202 GB in and fail. But you rarely need all of it at once. You want one hour around an anomaly — $100 \times 3600 \times 16 \times 4 = 23\,\mathrm{MB}$ — or one channel's average, which can be computed a piece at a time.

**Memory mapping** does exactly this. Think of a huge book on a shelf. Instead of photocopying the whole book, you get a table of contents that tells you where every page is, and you only open the pages you look at. The operating system maps the file into your program's address space, so the array *looks* like it is all in memory, but a page of the file is only read from disk when your code first touches it. The operating system keeps recently used pages in spare memory and quietly drops them again when memory is needed. This behavior is called [[paging|paging]].

For a `.npy` file, you ask for it with one argument:

```python
tel = np.load("telemetry.npy", mmap_mode="r")
```

`mmap_mode="r"` means "map it, read-only". The result is a **memmap**, a subclass of `ndarray`: it has a shape, dtype and strides, and slicing, masks, broadcasting and reductions all work on it. Only the pages you touch are read.

::: example An hour out of three and a half days
The file below holds 30 million samples of 4 channels in float32: $30\,000\,000 \times 4 \times 4 = 480\,000\,000$ bytes, plus the 128-byte header — about 83 hours at $100\,\mathrm{Hz}$. It was written in chunks with `numpy.lib.format.open_memmap`, which creates a `.npy` file on disk and hands back a writable memmap to fill. Now read it back three ways and watch the program's peak memory, reported by the `resource` module in megabytes.

```python
import numpy as np, resource

def peak_mb():
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024

print(f"start:         {peak_mb():6.0f} MB peak")
tel = np.load("telemetry.npy", mmap_mode="r")
print(type(tel).__name__, tel.shape, tel.dtype)
print(f"after open:    {peak_mb():6.0f} MB peak")

hour = slice(10 * 360_000, 11 * 360_000)      # the 11th hour at 100 Hz
print(tel[hour, 2].mean())
print(f"after 1 hour:  {peak_mb():6.0f} MB peak")

total, count = 0.0, 0                         # whole-file mean, one chunk at a time
for start in range(0, tel.shape[0], 1_000_000):
    block = tel[start:start + 1_000_000, 2]
    total += block.sum(dtype=np.float64)
    count += block.size
print(total / count)
print(f"after chunks:  {peak_mb():6.0f} MB peak")
# start:             25 MB peak
# memmap (30000000, 4) float32
# after open:        25 MB peak
# 20.000166
# after 1 hour:      33 MB peak
# 20.000016690849876
# after chunks:     483 MB peak
```

**Step 1.** Opening the 480 MB file cost nothing: peak memory stayed at 25 MB, the size of Python plus NumPy. Only the header was read.

**Step 2.** The hour is rows $3\,600\,000$ to $3\,960\,000$. Reading channel 2 of it raised the peak by about 8 MB. That fits: an hour is $360\,000$ rows of 16 bytes (4 channels of 4 bytes), $5.76\,\mathrm{MB}$, and the disk is read in whole pages, so a little more comes along.

**Step 3.** The chunked loop reads the whole channel, one million rows at a time, and adds up in float64 (lesson 10: do not accumulate in float32). The peak climbed to 483 MB — the whole file. Those are pages of the file the operating system kept around because memory was free. They are copies of what is on disk, so it can drop them at any moment without losing anything. On a machine with less memory, the same loop runs; old pages are dropped as new ones are read.

**Sanity check.** The data was simulated with a mean of $20$, and both averages come out at $20.0000$. Opening a regular `np.load` of the same file, for comparison, raises the peak to 483 MB immediately, before you have looked at anything. On the 202 GB archive, that version would fail; the memory-mapped one would work.
:::

::: key memmap for big telemetry
`np.load("f.npy", mmap_mode="r")` returns a read-only **memmap**: an ndarray whose data stays on disk and is read page by page as you touch it. Slice the part you need, or reduce in chunks, and accumulate in float64. `open_memmap(..., mode="w+")` creates a new `.npy` you can fill in pieces.
:::

### np.memmap for raw binary files

Many flight recorders write plain binary with no header at all — just rows of numbers in a documented layout. For those, `np.memmap` takes the layout from you:

```python
raw = np.memmap("telemetry.npy", dtype="<f4", mode="r", offset=128, shape=(30_000_000, 4))
print(raw[0])
# [20.017096 20.679874 20.61236  19.744846]
```

You must give the dtype (here `<f4`, little-endian float32), the mode (`"r"` read-only, `"r+"` read-write, `"w+"` create), the number of bytes to skip at the start (`offset`), and the shape. This line reads the same `.npy` file by skipping its 128-byte header by hand, which shows that there is no magic: a `.npy` file is a header followed by raw bytes. For a real recorder, you take all four numbers from the format document.

::: warning A memmap slice is still a view of the file
`tel[100:103]` is a memmap view, not a copy in memory; with `mode="r+"`, writing to it writes to the file on disk. With `mode="r"`, writing raises `ValueError: assignment destination is read-only`, which is a good reason to open read-only unless you mean to edit. When you want a small independent array to keep, call `np.array(tel[100:103])` to copy it into memory.
:::

## Check yourself

::: check
A `.npy` file is exactly $6\,400\,128$ bytes, and its header says `'descr': '<f8', 'shape': (N, 4)`. What is `N`? If the header had said `'<f4'`, what would `N` be?
:::

::: answer
Subtract the 128-byte header: $6\,400\,000$ bytes of data. Each row is 4 values of 8 bytes, 32 bytes, so $N = 6\,400\,000 / 32 = 200\,000$. With 4-byte float32, a row is 16 bytes and $N = 400\,000$. (This assumes the standard 128-byte header, which is what NumPy writes for a simple array like this; always read the header length from bytes 8 and 9 rather than assuming it.)
:::

::: check
You receive `results.npz` from another team. List its contents and load only the array named `miss`, making sure the file is closed afterwards. Should you pass `allow_pickle=True` if it fails?
:::

::: answer
```python
with np.load("results.npz") as d:
    print(d.files)
    miss = d["miss"]
```

Only `miss` is read, because `.npz` loading is lazy. If loading fails with the object-array error, do *not* switch on `allow_pickle`: a pickled array can run any code its author chose. Ask the other team to send plain numeric arrays instead (for ragged data, a flat array plus an index array).
:::

::: check
A hardware-in-the-loop rig writes 64 channels of float64 at $1\,\mathrm{kHz}$ for an 8-hour test. How big is the file? Can you `np.load` it on a machine with 16 GB of memory? What would you do instead?
:::

::: answer
Rows: $1000 \times 8 \times 3600 = 28\,800\,000$. Bytes: $28\,800\,000 \times 64 \times 8 = 1.47456 \times 10^{10}$, about $14.7\,\mathrm{GB}$. A full `np.load` needs that much memory for the array alone, on top of everything else running, so on a 16 GB machine it will probably fail or push everything else out of memory. Open it with `np.load(..., mmap_mode="r")`, take the slices you need, and do whole-file statistics chunk by chunk.
:::

::: check
Why does compressing a file of simulated sensor noise with `savez_compressed` save almost nothing, while compressing the time column saves a lot?
:::

::: answer
Compression works by finding repeated patterns and storing them once. Random noise is built to have no patterns, so there is nothing to squeeze out, and the file shrinks only a few percent. Evenly spaced time stamps are highly regular: neighboring values share most of their bytes, so the compressor can describe them much more briefly (about 3.7 times smaller in the lesson's example). A value that is constant for long stretches, like a mode flag, compresses best of all.
:::

::: check
In the memmap example, the chunked mean made the program's peak memory reach 483 MB, the size of the file. Does that mean memory mapping failed to save memory? Explain.
:::

::: answer
No. The pages counted there are file-backed copies the operating system kept because memory was free. They are unchanged copies of what is on disk, so the operating system can drop them whenever it needs the memory and read them again later if touched. The program only ever needed one chunk at a time: a million rows, 16 MB of pages. A plain `np.load`, in contrast, must hold the whole array in memory it cannot drop, which is what fails for a file bigger than memory.
:::

## Summary

| Tool | What it does | Remember |
| --- | --- | --- |
| `np.save("x.npy", a)` | one array, exact bits | header (magic, version, `descr`, `fortran_order`, `shape`) then raw bytes |
| `np.load("x.npy")` | read it all into memory | shape and dtype come from the header |
| `np.savez("f.npz", a=a, b=b)` | several named arrays in one zip | `d.files`, `d["a"]`; lazy; use `with` |
| `np.savez_compressed` | same, compressed | great for flags and counters, poor for noise |
| `allow_pickle` | load object arrays | off by default; never on for files you did not make |
| `np.load(..., mmap_mode="r")` | memory-mapped `.npy` | pages read on touch; slice or chunk; accumulate in float64 |
| `np.memmap(f, dtype, mode, offset, shape)` | map a raw binary file | you supply the layout |
| Sizing | rows × channels × bytes per value | a year of 16 channels at 100 Hz in float32 is about 202 GB |

The last lesson of the module steps back and asks the question behind every lesson so far: why write NumPy code as array expressions instead of loops, how much faster it really is — measured — and the cases where a loop is still the right tool.

::: context other-formats Other binary formats you will meet
`.npy` and `.npz` are NumPy's own formats: simple, fast, and read directly by NumPy, but not by most other tools. Flight-data teams also use **HDF5**, a self-describing format that holds many arrays in a tree with labels and units and can be read from C++, MATLAB and Python (through the `h5py` package), and **Parquet**, a column-based table format used by data-analysis tools such as pandas. The ideas in this lesson carry over: a header that describes the data, raw binary values, and reading only the part you need.
:::

::: context magic-number Magic numbers in file headers
Many file formats start with a few fixed bytes so programs can tell what they are, whatever the file is called. PNG images start with `\x89PNG`, PDF files with `%PDF`, zip files (and so `.npz` files) with `PK`, the initials of Phil Katz, who created the zip format. The `.npy` magic starts with the byte `\x93`, which is not a printable character. That makes it very unlikely a text file would ever begin the same way by accident.
:::

::: context endianness Little-endian and big-endian
A float64 is 8 bytes, and computers disagree about which byte comes first. **Little-endian** machines store the least significant byte first; **big-endian** machines store the most significant byte first. Almost every modern processor — the ones in laptops, phones and most flight computers built on ARM or x86 — is little-endian, but some older spacecraft processors and many network protocols are big-endian. The `<` in `'<f8'` records the order, so a file written on one kind of machine reads correctly on the other. A big-endian float64 is written `'>f8'`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">the 4-byte integer 0x0A0B0C0D</text>
  <text x="10" y="50" font-size="11" fill="#1d6fd1">little-endian</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="110" y="34" width="50" height="24"/><rect x="160" y="34" width="50" height="24"/><rect x="210" y="34" width="50" height="24"/><rect x="260" y="34" width="50" height="24"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="135" y="51">0D</text><text x="185" y="51">0C</text><text x="235" y="51">0B</text><text x="285" y="51">0A</text>
  </g>
  <text x="10" y="90" font-size="11" fill="#b4232c">big-endian</text>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="110" y="74" width="50" height="24"/><rect x="160" y="74" width="50" height="24"/><rect x="210" y="74" width="50" height="24"/><rect x="260" y="74" width="50" height="24"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="135" y="91">0A</text><text x="185" y="91">0B</text><text x="235" y="91">0C</text><text x="285" y="91">0D</text>
  </g>
</svg>
```

The names come from *Gulliver's Travels*, where two nations go to war over which end of a boiled egg to crack first.
:::

::: context zip-inside A .npz is a zip of .npy files
Rename `pass.npz` to `pass.zip` and any unzip tool shows three files inside: `t.npy`, `gyro.npy` and `mode.npy`. Each is an ordinary `.npy` file with its own header. That is why loading one named array does not require reading the others: the zip format has a directory at the end of the file saying where each member starts, and NumPy jumps straight there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="340" height="56" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="18" y="14" font-size="11" fill="#6c7a93">pass.npz (zip)</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="20" y="30" width="70" height="36" fill="#8fb8f0"/>
    <rect x="96" y="30" width="150" height="36" fill="#8fb8f0"/>
    <rect x="252" y="30" width="44" height="36" fill="#8fb8f0"/>
    <rect x="302" y="30" width="40" height="36" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="55" y="52">t.npy</text><text x="171" y="52">gyro.npy</text><text x="274" y="52">mode</text><text x="322" y="52">dir</text>
  </g>
  <text x="180" y="94" font-size="11" text-anchor="middle" fill="#6c7a93">the directory at the end says where each member starts</text>
</svg>
```
:::

::: context pickle-danger What pickle is, and why it is dangerous
Pickle is Python's built-in way of saving almost any object to bytes, and it is very convenient. But its format is a tiny program for rebuilding objects, and that program may call any importable function with any arguments. Python's own documentation warns never to unpickle data from a source you do not trust. Security teams treat an untrusted pickle, or an untrusted machine-learning model file saved with pickle, the same way they treat an untrusted executable.
:::

::: context paging How paging works
The operating system divides memory and files into **pages**, usually 4 kilobytes each. When a program touches an address in a memory-mapped file whose page is not in memory yet, the processor pauses the program and the operating system reads that page from disk, then lets the program continue. This is called a page fault, and it is normal, not an error. Reading a slice that crosses many pages causes many page faults, which is why reading rows that are next to each other in the file (C order, lesson 7) is much faster than jumping around.
:::
