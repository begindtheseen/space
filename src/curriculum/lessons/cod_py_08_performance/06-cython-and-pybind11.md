---
id: l06-cython-and-pybind11
title: Cython and pybind11 – a compiled core with a Python harness
minutes: 20
covers:
  - 'Cython and pybind11; calling a C++ simulation core from a Python harness'
---

Think about a TV remote. The remote is simple and friendly: big buttons, easy to change the channel, easy to hand to someone else. It does almost no work itself. The hard work — decoding the signal, drawing sixty pictures a second — happens in specialised electronics inside the TV. You would never want to decode video with the remote, and you would never want to change channels by opening the TV and soldering.

Big simulation codes are built the same way. The heavy numerics — the equations of motion, the guidance law, the navigation filter — live in fast compiled code, often C++. Python is the remote: it sets up 500 dispersion cases, calls the core for each one, collects the results, draws the plots and writes the report. This lesson shows two tools that connect the remote to the box. **Cython** lets you write Python with C types added and compiles it. **pybind11** lets you take C++ code that already exists and call it from Python.

Numba, from the last two lessons, compiles Python for you at run time. These two tools compile ahead of time, into a file you build once and import like any other module. That extra step buys you something Numba cannot: the fast core does not have to be Python at all. It can be the same C++ that runs in the hardware-in-the-loop lab — a rig where the real flight computer is fed simulated sensor data — or on the vehicle.

## What an extension module is

When you write `import numpy`, Python does not only load `.py` files. The parts of NumPy that do the arithmetic are **[[extension modules|extension-module]]** — compiled machine code in a shared library file, ending in `.so` on Linux or `.pyd` on Windows, that Python can import as if it were Python.

The CPython interpreter has a **C API**: a set of C functions for creating Python objects, reading arguments, raising exceptions and so on. An extension module uses that API to accept Python arguments, convert them to C numbers, do its work, and convert the answer back. Writing that glue by hand is long and easy to get wrong. Cython and pybind11 both generate it for you. You write the interesting part; they write the plumbing.

## Cython: Python with types

Cython is a language that is almost exactly Python, plus optional C type declarations. The Cython compiler translates a `.pyx` file into a C file, and a C compiler turns that into an extension module.

### Compiling Python without types

The first surprise is that compiling ordinary Python with Cython does little. Put the `coast` function from the Numba lessons, unchanged, into `coast_plain.pyx` and build it:

```bash
cythonize -i coast_plain.pyx
```

`cythonize` runs Cython and then the C compiler; `-i` puts the built module "in place", next to the source. Timed against the original (best of five repeats of 20 calls each, on a 4-core Intel Xeon at 2.1 GHz — your machine will give different numbers):

```text
Python             3.220 ms per call
Cython, no types   3.468 ms per call
```

Slightly *slower*. Without types, Cython has to assume every variable might be any Python object, so the C it writes makes the same calls into the C API that the interpreter would make. The errands from the Numba lesson are all still there. (Python here is faster than the $4.7\,\mathrm{ms}$ of the single call timed in the Numba lesson because this is the best of many calls; a single cold call is usually slower.)

### Adding types

Now declare the types. `cdef double h` means "`h` is a C double — a raw 64-bit float, not a Python object". Read `cdef` as "C def". Here is `coast_cy.pyx`:

```cython
# cython: language_level=3, boundscheck=False, wraparound=False
from libc.math cimport exp, fabs
import numpy as np

cpdef double coast(double v0, double m, double dt):
    cdef double h = 0.0, v = v0, t = 0.0
    cdef double rho, drag, g, r
    while h >= 0.0:
        rho = 1.225 * exp(-h / 8500.0)
        drag = 0.5 * rho * v * fabs(v) * 0.36
        r = 6.371e6 + h
        g = 3.986e14 / (r * r)
        v += (-g - drag / m) * dt
        h += v * dt
        t += dt
    return t

def coast_many(double[:] v0s, double m, double dt):
    cdef Py_ssize_t i, n = v0s.shape[0]
    out = np.empty(n)
    cdef double[:] res = out
    for i in range(n):
        res[i] = coast(v0s[i], m, dt)
    return out
```

Line by line:

- `from libc.math cimport exp, fabs` brings in C's own `exp` and absolute value. `cimport` ("C import") imports C declarations, not a Python module.
- `cpdef double coast(double v0, ...)` makes a function that takes and returns C doubles. `cpdef` gives it two doors: a fast C door for other Cython code, and a Python door so you can call it from Python.
- `double[:] v0s` is a **[[typed memoryview|memoryview]]** — a view of a 1-D block of doubles, such as a NumPy array's data, that Cython can index as fast as C.
- `Py_ssize_t` is the integer type Python uses for sizes and indexes.
- The first-line comment sets **compiler directives**. `boundscheck=False` stops Cython checking every index against the array's length, and `wraparound=False` turns off Python's negative indexes like `x[-1]`. Both make indexing faster; both mean a wrong index reads garbage instead of raising an `IndexError`, so turn them off only on code you have tested.

::: example What the types bought
Build with `cythonize -i coast_cy.pyx` and time the four versions of one coast call side by side:

```python
import timeit
from coast import coast_py, coast as coast_nb     # from the Numba lesson
import coast_plain, coast_cy

coast_nb(300.0, 25.0, 0.001)                     # warm up Numba
for name, f in (("Python", coast_py), ("Cython, no types", coast_plain.coast),
                ("Cython, typed", coast_cy.coast), ("Numba", coast_nb)):
    best = min(timeit.repeat(lambda: f(300.0, 25.0, 0.001), number=20, repeat=5)) / 20
    print(f"{name:17s} {f(300.0, 25.0, 0.001):.3f} s flight   {best * 1e3:.3f} ms per call")
# Python            14.846 s flight   3.220 ms per call
# Cython, no types  14.846 s flight   3.468 ms per call
# Cython, typed     14.846 s flight   0.537 ms per call
# Numba             14.846 s flight   0.537 ms per call
```

Step 1, check the answers: all four agree on $14.846\,\mathrm{s}$.

Step 2, the speedup from types: $3.220 / 0.537 \approx 6.0$.

Step 3, compare with Numba: identical to the microsecond. That makes sense. Both end up as a tight machine-code loop around the same `exp` call, which is now most of the cost of each step. Neither tool can make `exp` itself faster.

Step 4, the cost of untyped Cython: $3.468 / 3.220 \approx 1.08$, about $8\%$ slower than Python. Types are the whole point.
:::

### Seeing the slow lines

Run `cython -a coast_cy.pyx` and Cython writes an HTML page of your source with each line shaded yellow by how much it talks to the Python C API: white is pure C, bright yellow is heavy Python interaction. Click a line and it unfolds into the generated C. In a hot loop you want white. A yellow line inside a loop is almost always a variable you forgot to type.

::: warning A missing cdef is silent
Forget to declare one variable in the loop, say `drag`, and Cython does not complain. It makes `drag` a Python object, and every step now creates and destroys a boxed float. The code stays correct and gets several times slower. Check the `-a` page after every change to a hot loop, the way you would check a profile.
:::

Cython is strongest when you have Python code, or a NumPy-heavy algorithm, and want to speed up one module without leaving Python-like syntax. Large parts of SciPy, scikit-learn and pandas are written in it.

## pybind11: wrapping a C++ core

Now the other direction. Suppose your team already has the simulation core in C++: tested, reviewed, maybe running on the flight computer. You do not want to rewrite it in Python-with-types. You want to call it.

**pybind11** is a C++ library for exactly that. It is **[[header-only|header-only]]**: you `#include` it, describe which C++ functions and classes Python should see, and compile. Here is a tiny core, `gnc_core.cpp`:

```cpp
// gnc_core.cpp -- a tiny C++ "simulation core" exposed to Python with pybind11
#include <cmath>
#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>

namespace py = pybind11;

struct Vehicle {
    double mass;   // kg
    double cda;    // drag coefficient times area, m^2
};

// Plain C++: knows nothing about Python. This is the part you could fly.
double coast(const Vehicle& veh, double v0, double dt) {
    double h = 0.0, v = v0, t = 0.0;
    while (h >= 0.0) {
        double rho = 1.225 * std::exp(-h / 8500.0);
        double drag = 0.5 * rho * v * std::fabs(v) * veh.cda;
        double r = 6.371e6 + h;
        double g = 3.986e14 / (r * r);
        v += (-g - drag / veh.mass) * dt;
        h += v * dt;
        t += dt;
    }
    return t;
}

// A batch entry point: one call from Python runs every case.
py::array_t<double> coast_many(const Vehicle& veh,
                               py::array_t<double, py::array::c_style | py::array::forcecast> v0s,
                               double dt) {
    auto in = v0s.unchecked<1>();
    py::array_t<double> out(in.shape(0));
    auto res = out.mutable_unchecked<1>();
    {
        py::gil_scoped_release release;          // pure C++ from here: let other threads run
        for (py::ssize_t i = 0; i < in.shape(0); ++i)
            res(i) = coast(veh, in(i), dt);
    }
    return out;
}

PYBIND11_MODULE(gnc_core, m) {
    m.doc() = "Toy GNC simulation core";
    py::class_<Vehicle>(m, "Vehicle")
        .def(py::init<double, double>(), py::arg("mass"), py::arg("cda"))
        .def_readwrite("mass", &Vehicle::mass)
        .def_readwrite("cda", &Vehicle::cda);
    m.def("coast", &coast, py::arg("veh"), py::arg("v0"), py::arg("dt"),
          "Flight time of a straight-up coast, s");
    m.def("coast_many", &coast_many, py::arg("veh"), py::arg("v0s"), py::arg("dt"));
}
```

It has three layers, and keeping them apart is the design.

1. **The core.** `Vehicle` and `coast` are ordinary C++. They include nothing from pybind11 and know nothing about Python. In a real project they sit in their own files, with their own C++ unit tests, and the same code compiles into the flight software or the lab simulator.
2. **An adapter.** `coast_many` takes a NumPy array, loops over it in C++ and returns a new array. `py::array_t<double>` is pybind11's type for a NumPy array of doubles. `unchecked<1>()` gives fast 1-D access without bounds checks. The `forcecast` flag means "if the caller passes a list or a float32 array, convert it to float64 for me" — convenient, but it makes a copy.
3. **The binding.** `PYBIND11_MODULE(gnc_core, m)` defines the module Python will import. `py::class_<Vehicle>` exposes the struct as a Python class with a constructor and two attributes. `m.def` exposes each function, with argument names and a docstring.

The module name in `PYBIND11_MODULE` must match the file name you build. One command compiles it:

```bash
g++ -O3 -Wall -shared -std=c++17 -fPIC $(python3 -m pybind11 --includes) \
    gnc_core.cpp -o gnc_core$(python3 -m pybind11 --extension-suffix)
```

Piece by piece: `-O3` turns on full optimisation; `-shared -fPIC` builds a **[[shared library|shared-library]]** that Python can load; `-std=c++17` picks the C++ standard; `python3 -m pybind11 --includes` prints where the pybind11 and Python headers are; and `--extension-suffix` prints the file ending this Python expects, here `.cpython-311-x86_64-linux-gnu.so`. The build took about seven seconds; pybind11's templates make compiles slow, which is one reason to keep the binding file small.

Now it is a Python module:

```python
import gnc_core

veh = gnc_core.Vehicle(mass=25.0, cda=0.36)
print(round(gnc_core.coast(veh, 300.0, 0.001), 3))     # 14.846
print(gnc_core.coast_many(veh, [280, 300.0], 0.001))  # [14.583 14.846]
veh.mass = 30.0
print(round(gnc_core.coast(veh, 300.0, 0.001), 3))     # 15.897
```

The `Vehicle` behaves like a Python object: you build it with keyword arguments and change `veh.mass` like any attribute. The list `[280, 300.0]` was converted to a float64 array on the way in, integer and all. Pass something that cannot be converted, like the string `"fast"` for `v0`, and pybind11 raises a `TypeError` that lists the argument types it accepts.

Why did the heavier vehicle fly longer? Drag slows it by a force divided by mass, so more mass means less deceleration from the same drag: $15.897\,\mathrm{s}$ against $14.846\,\mathrm{s}$. The physics checks out.

::: key
Why pybind11 is the realistic pattern for a heavy GNC core: the numerics live in tested, optimised C++ that can also be flown or reused, and Python drives the dispersion harness, the plotting and the reporting. You get compiled speed where it matters and scripting speed where it matters.
:::

## Calling the core from a Python harness

Here is the harness side: draw 500 dispersed cases, run each through the C++ core, summarise, plot.

```python
import time
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import gnc_core

rng = np.random.default_rng(42)
n = 500
mass = rng.normal(25.0, 0.5, n)          # kg
cda = rng.normal(0.36, 0.02, n)          # m^2
v0 = rng.uniform(250.0, 350.0, n)        # m/s

t0 = time.perf_counter()
flight = np.array([gnc_core.coast(gnc_core.Vehicle(mass=m, cda=c), v, 0.001)
                   for m, c, v in zip(mass.tolist(), cda.tolist(), v0.tolist())])
elapsed = time.perf_counter() - t0

print(f"{n} cases in {elapsed:.2f} s")
print(f"mean {flight.mean():.2f} s, std {flight.std(ddof=1):.2f} s, "
      f"99th percentile {np.percentile(flight, 99):.2f} s")
# 500 cases in 0.27 s
# mean 14.85 s, std 0.50 s, 99th percentile 15.96 s

fig, ax = plt.subplots(figsize=(5, 3))
ax.hist(flight, bins=30)
ax.set_xlabel("flight time (s)")
ax.set_ylabel("cases")
fig.tight_layout()
fig.savefig("flight_times.png", dpi=120)
```

Everything that changes often — which parameters to disperse, how widely, which statistics to report, what the plot looks like — is in Python, where it takes seconds to edit. Everything that must be fast and trustworthy is in C++, where it is tested once and reused.

### What crossing the boundary costs

Every call from Python into C++ has to convert the arguments and the result. That is the same kind of fee as Numba's dispatcher in the last lesson.

::: example Is the harness loop a problem?
Timing a call that does almost no work (a launch speed of $-1\,\mathrm{m/s}$, so the loop ends after one step) gives about $140\,\mathrm{ns}$ per call. Building a `Vehicle` from Python with keyword arguments costs about $570\,\mathrm{ns}$.

Step 1, the overhead per case: $140 + 570 = 710\,\mathrm{ns}$.

Step 2, for 500 cases: $500 \times 710\,\mathrm{ns} \approx 0.355\,\mathrm{ms}$.

Step 3, as a fraction of the run: $0.355\,\mathrm{ms} / 270\,\mathrm{ms} \approx 0.0013$, about $0.13\%$.

So calling the core once per case from a Python loop is fine, because each case does half a millisecond of real work. Timing the 500 cases one call at a time and in one `coast_many` call confirms it: $0.268\,\mathrm{s}$ against $0.269\,\mathrm{s}$, the same within noise.

It would not be fine for a tiny function. A million calls to a C++ gravity model that does $10\,\mathrm{ns}$ of arithmetic would spend $0.14\,\mathrm{s}$ crossing the boundary and $0.01\,\mathrm{s}$ computing. The rule is the same as for Numba: put the loop on the fast side of the boundary. Give the core a whole trajectory or a whole batch of cases per call, not one derivative evaluation.
:::

::: warning Copies you did not ask for
`forcecast` quietly converts a float32 array or a list to a fresh float64 array. For 500 launch speeds that is nothing. For a 2 GB telemetry array passed on every call, it is a 2 GB copy each time. For big arrays, make the input float64 and contiguous once, in Python, and drop `forcecast` so a wrong type is an error instead of a copy.
:::

### Letting threads run: releasing the GIL

Look again at `coast_many`. Before its loop, it creates a `py::gil_scoped_release`. That releases Python's **global interpreter lock**, the **[[GIL|gil]]** — the lock that lets only one thread at a time run Python code. Inside the braces the code touches no Python objects, so it is safe to let other threads carry on. When the braces close, the lock is taken back.

That one line lets ordinary Python threads run the C++ core on several cores at once:

```python
import timeit
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import gnc_core

veh = gnc_core.Vehicle(mass=25.0, cda=0.36)
v0s = np.random.default_rng(1).uniform(250.0, 350.0, 500)
chunks = np.array_split(v0s, 4)

def threaded():
    with ThreadPoolExecutor(max_workers=4) as pool:
        parts = pool.map(lambda c: gnc_core.coast_many(veh, c, 0.001), chunks)
        return np.concatenate(list(parts))

print(np.array_equal(threaded(), gnc_core.coast_many(veh, v0s, 0.001)))
for name, f in (("1 thread", lambda: gnc_core.coast_many(veh, v0s, 0.001)), ("4 threads", threaded)):
    print(f"{name:9s} {min(timeit.repeat(f, number=1, repeat=5)):.3f} s")
# True
# 1 thread  0.268 s
# 4 threads 0.069 s
```

Four threads, about $3.9$ times faster ($0.268 / 0.069 \approx 3.88$), with bit-identical answers because each case is computed alone. Built without the release line, the same four threads took $0.271\,\mathrm{s}$ — no faster than one, because each thread waited for the lock. The lesson on the GIL, coming up next, explains why.

## Choosing your tool

You now have four ways to speed up a hot loop. They fit different situations.

| Situation | Reach for |
|---|---|
| The work can be written as whole-array operations | NumPy vectorisation |
| A numeric Python loop you wrote, NumPy arrays in and out | Numba `@njit` |
| A Python module you want compiled ahead of time, or that mixes Python objects and fast loops | Cython with types |
| The core already exists in C or C++, or must also run outside Python | pybind11 |

Some differences worth knowing:

- **Build step.** Numba needs none; Cython and pybind11 need a C or C++ compiler and a build, and the built file is specific to one Python version and platform. Real packages use a build backend such as setuptools or **[[scikit-build-core|build-backends]]** so users can `pip install` them.
- **Who can read it.** Cython and Numba code is readable by a Python programmer. pybind11 needs C++ skills on the team.
- **Reuse outside Python.** Only the pybind11 route leaves you with a core that a C++ flight program, a test rig or another language can use without Python.
- **Speed.** For a tight numeric loop they end up close together, as the `coast` timings showed. The choice is about the code's home and its life cycle, not about the last ten percent.

And whichever you choose, it comes late in the order of attack. Profile first, fix the algorithm, remove repeated work, vectorise; compile what is left; then run cases in parallel. A compiled version of a bad algorithm is a faster way to waste time.

## Check yourself

::: check
A colleague renames `dynamics.py` to `dynamics.pyx`, builds it with `cythonize -i` and reports no speedup. Is Cython broken? What would you do next?
:::

::: answer
Cython is working as designed. Without type declarations, every variable is still a Python object and the generated C makes the same C API calls the interpreter would, so it runs at about Python speed (in the lesson it was about $8\%$ slower). Next: add `cdef double` declarations to the variables in the hot loop, type the function arguments, use `libc.math` for `exp` and `sqrt`, use typed memoryviews like `double[:]` for arrays, and check `cython -a` until the loop lines are white.
:::

::: check
Name the three layers of a pybind11 module like `gnc_core.cpp`, and say why the bottom layer should not include any pybind11 header.
:::

::: answer
The C++ core (the physics, here `Vehicle` and `coast`), an optional adapter layer that converts between NumPy arrays and C++ (here `coast_many`), and the binding block `PYBIND11_MODULE` that tells Python what to expose. The core should not depend on pybind11 so that it can be compiled and tested on its own and reused in C++ programs with no Python at all — the flight software, a hardware-in-the-loop rig or a C++ test suite.
:::

::: check
A C++ atmosphere function takes $20\,\mathrm{ns}$ to evaluate, and calling it from Python through pybind11 costs about $140\,\mathrm{ns}$ extra per call. A Python integrator calls it $2 \times 10^6$ times. How long is spent computing, and how long crossing the boundary? What would you change?
:::

::: answer
Computing: $2 \times 10^6 \times 20\,\mathrm{ns} = 0.04\,\mathrm{s}$. Crossing: $2 \times 10^6 \times 140\,\mathrm{ns} = 0.28\,\mathrm{s}$, seven times the useful work. Move the loop to the C++ side: bind a function that takes a whole array of altitudes and returns an array of densities, or move the integrator itself into the core, so there is one crossing per batch instead of one per point.
:::

::: check
Your pybind11 function runs a long C++ loop over cases. Four Python threads calling it take the same time as one thread. What is the most likely missing piece, and what must be true of the code before you add it?
:::

::: answer
The function probably does not release the GIL, so the four threads take turns holding it and only one runs at a time. Add `py::gil_scoped_release` (or `py::call_guard<py::gil_scoped_release>()` on the binding) around the C++ loop. Before doing so, make sure the released section touches no Python objects: read the NumPy input and create the output array before releasing, and do not create or change any Python object until the lock is taken back.
:::

::: check
For each case, pick Numba, Cython or pybind11 and say why: (a) a 40-line Python function looping over a NumPy array of sensor samples; (b) a 20,000-line C++ navigation filter already used in the lab simulator; (c) a Python module that mixes dictionaries of configuration with an inner loop you want compiled into a wheel (Python's ready-to-install package file) you ship to other teams.
:::

::: answer
(a) Numba: a numeric loop over arrays is its sweet spot, and adding `@njit` needs no build step. (b) pybind11: the code already exists in C++ and must stay there for the lab; you bind it rather than rewrite it. (c) Cython: it compiles ahead of time into a package you can distribute, and it handles a mix of ordinary Python objects (the dictionaries) and typed fast loops in one module.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Extension module | Compiled `.so` or `.pyd` that Python imports | Cython and pybind11 generate the C API glue |
| `cythonize -i file.pyx` | Build a Cython module in place | Untyped Cython runs at about Python speed |
| `cdef double x` | Declare a C type in Cython | Types are where the speed comes from |
| `double[:]` | Typed memoryview of an array | Indexes as fast as C |
| `cython -a` | Annotated HTML of the source | Yellow lines talk to Python; want white in loops |
| `PYBIND11_MODULE` | Defines the module Python imports | Name must match the built file |
| `py::array_t<double>` | NumPy array in C++ | `forcecast` converts, and copies |
| Boundary cost | About $140\,\mathrm{ns}$ per call here | Keep the loop on the C++ side |
| `py::gil_scoped_release` | Let other threads run during pure C++ | 4 threads: $0.268 \to 0.069\,\mathrm{s}$ |
| The pattern | C++ core, Python harness | Compiled speed and scripting speed, each where it matters |

The GIL appeared twice in this lesson: Numba's `prange` sidesteps it, and a pybind11 core can release it. The next lesson looks at the lock itself — what it blocks, what it does not, and why that decides between threads and processes.

::: context extension-module Modules that are not Python
Try `import _json; print(_json.__file__)` on Linux and you will usually get a path ending in `.so`: the accelerator behind the `json` module is compiled C, not Python. NumPy's core and most of SciPy are extension modules too. (A few, like `math`, are often compiled straight into the interpreter, so they have no file at all.) Python cannot tell the difference when you import them. The only visible sign is that a built extension works only for the Python version and platform it was compiled for, which is why its file name carries a tag like `cpython-311-x86_64-linux-gnu`.
:::

::: context memoryview A window onto the numbers
A NumPy array is a header (shape, strides, type) plus one block of raw doubles. A typed memoryview is a lightweight window onto that block. When Cython sees `v0s[i]` on a `double[:]`, it compiles it to "start address plus $8i$ bytes", one machine instruction, with no Python object created. Indexing a NumPy array without the memoryview would go through NumPy's Python-level indexing and build a boxed float every time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">header</text>
  <text x="65" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">shape, dtype</text>
  <rect x="130" y="20" width="50" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="20" width="50" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="20" width="50" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="280" y="20" width="50" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="155" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">[0]</text>
  <text x="205" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">[1]</text>
  <text x="255" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">[2]</text>
  <text x="305" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">[3]</text>
  <line x1="130" y1="70" x2="330" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="130" y1="64" x2="130" y2="76" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="64" x2="330" y2="76" stroke="#1d6fd1" stroke-width="2"/>
  <text x="230" y="92" font-size="12" text-anchor="middle" fill="#1d6fd1">double[:] sees only this block</text>
  <text x="230" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">each element 8 bytes: address of [i] = start + 8i</text>
</svg>
```
:::

::: context header-only No library to install
Most C++ libraries come as headers plus a compiled library file you must build and link. A header-only library puts all its code in the headers, as templates the compiler fills in for your types. That makes pybind11 easy to use — install it with pip and add one include path — at the price of slower compiles. It was started by Wenzel Jakob in 2015, modelled on the older Boost.Python but without depending on the rest of Boost. SciPy uses it for some of its C++ code.
:::

::: context shared-library One file, loaded when needed
A shared library is compiled code that a program loads while it runs rather than having it baked in when it is built. On Linux it ends in `.so` ("shared object"), on Windows `.dll`, on macOS `.dylib`. When Python imports an extension module, it asks the operating system to load the `.so`, then looks for one entry function, named `PyInit_` plus the module name, which pybind11's `PYBIND11_MODULE` macro writes for you. `-fPIC` ("position-independent code") lets the library work wherever in memory the system places it.
:::

::: context gil One microphone
Picture a meeting with one microphone. Only the person holding it may speak. The GIL is that microphone for Python code: a thread must hold it to run Python bytecode. A thread that goes off to do pure C++ work can put the microphone down, and then another Python thread can pick it up and start its own C++ work. That is why releasing the GIL let four threads run four chunks at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44" font-weight="700">GIL held in the loop</text>
  <rect x="80" y="26" width="60" height="12" fill="#b4232c"/>
  <rect x="140" y="42" width="60" height="12" fill="#b4232c"/>
  <rect x="200" y="58" width="60" height="12" fill="#b4232c"/>
  <rect x="260" y="74" width="60" height="12" fill="#b4232c"/>
  <text x="20" y="36" font-size="11" fill="#1f2a44">thread 1</text>
  <text x="20" y="84" font-size="11" fill="#1f2a44">thread 4</text>
  <text x="20" y="112" font-size="12" fill="#1f2a44" font-weight="700">GIL released</text>
  <rect x="80" y="120" width="60" height="10" fill="#1d6fd1"/>
  <rect x="80" y="133" width="60" height="10" fill="#1d6fd1"/>
  <rect x="80" y="146" width="60" height="10" fill="#1d6fd1"/>
  <rect x="80" y="159" width="60" height="10" fill="#1d6fd1"/>
  <text x="150" y="150" font-size="11" fill="#1d6fd1">same work, a quarter of the time</text>
</svg>
```
:::

::: context build-backends From one g++ line to pip install
The one-line `g++` build is fine for learning and for a lab script. A package that other teams install needs more: building for their Python version, finding their compiler, producing a wheel. Build backends do that. Setuptools can build Cython modules and, with helpers pybind11 ships, pybind11 modules. scikit-build-core drives CMake, the build tool most C++ projects already use, so the same CMake files can build the flight library and the Python module. meson-python does the same with the Meson build system, and NumPy and SciPy themselves build with it.
:::
