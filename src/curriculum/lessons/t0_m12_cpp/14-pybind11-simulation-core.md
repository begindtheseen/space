---
id: l14-pybind11-simulation-core
title: pybind11 bindings over a C++ simulation core
minutes: 26
covers:
  - pybind11 bindings over a C++ simulation core
---

When you travel to another country, your phone charger does not fit the wall socket. You do not rebuild the charger. You carry a small **adapter**: one side fits the socket, the other fits your plug, and power flows through.

Production GNC tooling has the same shape. The dynamics, the integrator and the estimator — the code that must be fast, predictable and identical to what flies — are written in C++. The **[[Monte Carlo|monte-carlo]]** study that runs ten thousand slightly different cases through them, the statistics, the plots — those are Python. Between them sits a **binding**: a compiled Python module that makes the C++ functions look like ordinary Python functions, turning NumPy arrays into Eigen matrices on the way in and back again on the way out. **pybind11** is the C++ library that builds that adapter from a few lines of code.

Speed is part of the reason, and it is real: this lesson's propagator runs its orbit more than sixty times faster in C++ than the same algorithm in NumPy. The deeper reason is **fidelity** — being true to the real thing. When the Python Monte Carlo calls the C++ core, it exercises the *flight* code, not a Python copy that may or may not agree with it. The Monte Carlo becomes a test of the software that flies.

This lesson writes the binding for the two-body propagator, drives it from Python, releases Python's global lock so a thread pool can use every processor core, and packages it so `pip install -e .` builds it from a clean checkout. That is the module's third exercise, end to end.

## How Python loads C++ code

Python can import a compiled **[[shared library|shared-library]]** — a file of machine code loaded while a program runs, ending in `.so` on Linux or `.pyd` on Windows — as a module. The one condition: the library must contain a start-up function named after the module. That function hands Python a list of callable functions. Each is C code that receives Python objects, converts them to C++ values, does the work, and builds a Python object to return.

Writing that glue by hand is long and error-prone. pybind11 writes it for you. You write `m.def("propagate", &propagate)`, and the library works out the argument and return types of `propagate`, generates a converter for each, and produces the registration code. It is a **header-only** library: there is nothing to link, you only `#include` it.

The converters are called **[[type casters|type-caster]]**. pybind11 has them for numbers, strings and `bool`; for the standard containers if you include `pybind11/stl.h`; for NumPy arrays through `pybind11/numpy.h`; and for Eigen matrices through `pybind11/eigen.h`. That last header is what lets a `Vector6d` parameter accept a NumPy array of six doubles.

C++ exceptions that reach the boundary are translated too: `std::invalid_argument` becomes a Python `ValueError`, `std::out_of_range` an `IndexError`, `std::runtime_error` a `RuntimeError`. Lesson 8 said the binding layer is exactly where exceptions belong, and this is why.

One more fact matters for building. The module's file name records which Python it was built for: `gnc_core.cpython-311-x86_64-linux-gnu.so` means CPython 3.11 on 64-bit Linux. Python will not import a module built for another version, so ask the Python that will import it for the right ending.

## The binding

::: example A pybind11 module over the propagator
```cpp
#include <Eigen/Dense>
#include <pybind11/eigen.h>
#include <pybind11/numpy.h>
#include <pybind11/pybind11.h>

#include <cmath>
#include <stdexcept>

namespace py = pybind11;

using Vector6d = Eigen::Matrix<double, 6, 1>;
constexpr double kMu = 3.986004418e14;  // m^3/s^2

Vector6d two_body(const Vector6d& x) {
  const Eigen::Vector3d r = x.head<3>();
  const double r3 = std::pow(r.norm(), 3);
  Vector6d dx;
  dx << x.tail<3>(), -kMu / r3 * r;
  return dx;
}

Vector6d rk4_step(const Vector6d& x, double dt) {
  const Vector6d k1 = two_body(x);
  const Vector6d k2 = two_body(x + (0.5 * dt) * k1);
  const Vector6d k3 = two_body(x + (0.5 * dt) * k2);
  const Vector6d k4 = two_body(x + dt * k3);
  return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

// propagate(state, dt, n_steps) -> (n_steps + 1, 6) NumPy array of the trajectory.
// NumPy allocates the array once; the loop writes into it through an Eigen::Map.
py::array_t<double> propagate(const Vector6d& state0, double dt, int n_steps) {
  if (n_steps < 0) throw std::invalid_argument("n_steps must be non-negative");
  if (!(dt > 0.0)) throw std::invalid_argument("dt must be positive");

  py::array_t<double> out({n_steps + 1, 6});
  using RowMajor6 = Eigen::Matrix<double, Eigen::Dynamic, 6, Eigen::RowMajor>;
  Eigen::Map<RowMajor6> traj(out.mutable_data(), n_steps + 1, 6);

  {
    py::gil_scoped_release release;  // other Python threads may run now
    Vector6d x = state0;
    traj.row(0) = x.transpose();
    for (int i = 0; i < n_steps; ++i) {
      x = rk4_step(x, dt);
      traj.row(i + 1) = x.transpose();
    }
  }  // the GIL comes back here, before we touch Python again
  return out;
}

double specific_energy(const Vector6d& x) {
  return 0.5 * x.tail<3>().squaredNorm() - kMu / x.head<3>().norm();
}

PYBIND11_MODULE(gnc_core, m) {
  m.doc() = "Two-body RK4 propagator: C++/Eigen core exposed to Python";
  m.def("propagate", &propagate, py::arg("state"), py::arg("dt"), py::arg("n_steps"),
        "Propagate a 6-state [r; v] with RK4; returns an (n_steps+1, 6) array");
  m.def("specific_energy", &specific_energy, py::arg("state"));
  m.def("rk4_step", &rk4_step, py::arg("state"), py::arg("dt"));
  m.attr("MU_EARTH") = kMu;
}
```

```text
$ g++ -std=c++20 -O3 -Wall -Wextra -shared -fPIC -fvisibility=hidden \
      $(python3 -m pybind11 --includes) -I/usr/include/eigen3 \
      gnc_core.cpp -o gnc_core$(python3 -c "import sysconfig; print(sysconfig.get_config_var('EXT_SUFFIX'))")
$ ls
gnc_core.cpp  gnc_core.cpython-311-x86_64-linux-gnu.so
```

The physics is lesson 10's propagator, unchanged. Everything new is in `propagate` and the `PYBIND11_MODULE` block.

**Step 1: the input.** The `Vector6d` parameter is filled from a NumPy array of shape `(6,)`. `pybind11/eigen.h` checks the shape and the number type, then copies the 48 bytes. For something this small, a copy is the right choice.

**Step 2: the checks.** A negative step count or a step size that is not positive throws `std::invalid_argument`. The `!(dt > 0.0)` form also rejects a NaN ("not a number"), because every comparison with NaN is false. Python will see these as `ValueError`.

**Step 3: the output.** A trajectory of $(n+1) \times 6$ doubles is big, so it goes the other way. It is allocated *once, by NumPy*, as a `py::array_t<double>`. Then an `Eigen::Map` lays an Eigen matrix view over that same memory, without copying. The `RowMajor` setting matches NumPy's **[[row-major|row-major]]** layout, which is the opposite of Eigen's default. The loop writes each new state straight into the row where Python will find it. That is what the exercise means by "without copying more than necessary".

**Step 4: the lock.** The `py::gil_scoped_release` line lets other Python threads run while the loop computes. A later section explains it.

**The registration.** `PYBIND11_MODULE(gnc_core, m)` defines the module and its start-up function. Each `m.def` registers a function, with argument names (so Python may call `propagate(x0, dt=1.0, n_steps=5554)`) and a help string. `m.attr` exports a constant.

**The build flags.** `-shared -fPIC` produce a shared library. `-fvisibility=hidden` keeps the library's list of exported names down to what Python needs. `python3 -m pybind11 --includes` prints the header folders for pybind11 and for the Python that runs the command, and the file ending comes from that same Python. On a machine with several Pythons, `python3-config` may describe a different one.
:::

## Driving the core from Python

::: example Agreement, energy, and the speedup
This script propagates one orbit of a 400 km circular orbit two ways — through the C++ core, and with a pure-NumPy copy of the same algorithm — and compares them.

```python
import time
import numpy as np
import gnc_core

MU = gnc_core.MU_EARTH

def two_body(x):
    r = x[:3]
    r3 = np.linalg.norm(r) ** 3
    return np.concatenate((x[3:], -MU / r3 * r))

def rk4_step(x, dt):
    k1 = two_body(x)
    k2 = two_body(x + (0.5 * dt) * k1)
    k3 = two_body(x + (0.5 * dt) * k2)
    k4 = two_body(x + dt * k3)
    return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)

def propagate_numpy(x0, dt, n):
    out = np.empty((n + 1, 6))
    out[0] = x0
    x = x0.copy()
    for i in range(n):
        x = rk4_step(x, dt)
        out[i + 1] = x
    return out

r0 = 6378.137e3 + 400.0e3
v0 = np.sqrt(MU / r0)
x0 = np.array([r0, 0.0, 0.0, 0.0, v0, 0.0])
n, dt = 5554, 1.0

t = time.perf_counter(); traj_cpp = gnc_core.propagate(x0, dt, n); t_cpp = time.perf_counter() - t
t = time.perf_counter(); traj_np = propagate_numpy(x0, dt, n); t_np = time.perf_counter() - t

d = traj_cpp - traj_np
row, col = np.unravel_index(np.argmax(np.abs(d)), d.shape)
print(f"shape {traj_cpp.shape}, dtype {traj_cpp.dtype}, C-contiguous {traj_cpp.flags['C_CONTIGUOUS']}")
print(f"entries bit-for-bit identical: {np.mean(d == 0):.1%}")
print(f"largest difference {abs(d[row, col]):.3e} in column {col}, where the value is {traj_np[row, col]:.3f}")
e0 = gnc_core.specific_energy(x0)
e1 = gnc_core.specific_energy(traj_cpp[-1])
print(f"energy drift {abs(e1 - e0) / abs(e0):.2e}")
print(f"C++ {t_cpp * 1e3:.1f} ms, NumPy {t_np * 1e3:.1f} ms, speedup {t_np / t_cpp:.0f}x")

try:
    gnc_core.propagate(x0, -1.0, 10)
except ValueError as e:
    print("C++ exception arrived as", type(e).__name__, "->", e)

# Output:
# shape (5555, 6), dtype float64, C-contiguous True
# entries bit-for-bit identical: 97.0%
# largest difference 4.547e-13 in column 4, where the value is -2935.565
# energy drift 1.77e-15
# C++ 1.5 ms, NumPy 100.1 ms, speedup 67x
# C++ exception arrived as ValueError -> dt must be positive
```

Read the output line by line.

**The shape.** 5555 rows (the start plus 5554 steps) of 6 numbers, in row-major C order, as promised.

**The agreement.** 97.0% of the $5555 \times 6 = 33\,330$ numbers are *exactly* the same bits in both versions. The largest difference is $4.547 \times 10^{-13}$ in column 4, the $y$-velocity, where the value is about $-2935.565\,\mathrm{m/s}$. That difference is exactly one **[[unit in the last place|ulp]]**: the two answers are neighboring numbers on the grid of values a `double` can hold. They agree because both versions do the same arithmetic in the same order; the rare one-step differences come from the two libraries adding up a norm in a slightly different order. That meets the exercise's "identical to $10^{-12}$" with room to spare.

**What breaks it.** Rebuild the C++ with **[[-ffast-math|fast-math]]** and the largest difference grows to about $4.7 \times 10^{-9}\,\mathrm{m}$ in a position, and the worst relative difference of any entry reaches $1.5 \times 10^{-12}$ — the $10^{-12}$ test now fails. That is why flight-representative code is never built with fast-math.

**The energy.** The orbit's energy per kilogram changed by a fraction $1.8 \times 10^{-15}$ over the whole orbit: rounding-sized.

**The speed.** $100.1 / 1.5 \approx 67$. Per step, NumPy spends $100.1\,\mathrm{ms} / 5554 \approx 18\,\mu\mathrm{s}$, while C++ spends about $0.27\,\mu\mathrm{s}$. (Timings wobble by 20% or so from run to run; the ratio stays in the sixties.) Each NumPy step is a dozen separate calls on six-element arrays, and each call pays microseconds of interpreter overhead for nanoseconds of arithmetic. The steps happen one after another, so there is no big array for NumPy to speed through.

**The exception.** The C++ `std::invalid_argument` arrived as the `ValueError` Python programmers expect, message intact.
:::

::: key
The pybind11 pattern for a simulation core: small inputs cross by value (an Eigen fixed-size vector from a NumPy array); large outputs are allocated once as a `py::array_t` and written in place through an `Eigen::Map` with `RowMajor` layout; C++ exceptions thrown in the binding become Python exceptions; `PYBIND11_MODULE` registers functions with `py::arg` names and docstrings.
:::

## Releasing the GIL

Picture a meeting where only the person holding the microphone may speak. Others can think and write notes, but only one voice is heard at a time. CPython runs Python code the same way. The **[[Global Interpreter Lock|gil-story]]** (GIL, said "gill") lets only one thread run Python bytecode at a time.

By default, a C++ function called from Python holds the GIL for its whole run. So a `ThreadPoolExecutor` calling `propagate` from four threads would still run the calls one after another.

`py::gil_scoped_release` is an RAII object (lesson 3 again). Creating it puts the microphone down; destroying it, at the closing brace, picks it back up. Inside its scope the C++ code runs without the interpreter, and other Python threads — each calling into the same core — run at the same time on other cores. The exercise asks for exactly this, so a Monte Carlo can use a thread pool without `multiprocessing`, which would start whole new Python processes and copy data between them.

Two rules make it safe.

1. **While the GIL is released, touch no Python object.** Do not create arrays, read attributes, or call any Python function. That is why `propagate` allocates its output array *before* the release and only writes raw numbers into its memory inside.
2. **The C++ code must be safe to run on several threads at once.** It must not share any changeable state between calls. The propagator passes: it uses only its arguments and local variables. A `static` scratch vector inside `two_body` would become a **data race** — two threads writing the same memory with nothing coordinating them — the moment two threads called it.

::: example A thread pool that scales with the cores
```python
import time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import gnc_core

rng = np.random.default_rng(1)
r0 = 6778137.0
cases = [np.array([r0 * (1 + 1e-3 * rng.standard_normal()), 0, 0, 0,
                   7668.56 * (1 + 1e-3 * rng.standard_normal()), 5.0 * rng.standard_normal()])
         for _ in range(64)]

def run(x0):
    return gnc_core.propagate(x0, 1.0, 20000)[-1, 0]

for workers in (1, 2, 4):
    t = time.perf_counter()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(run, cases))
    print(f"{workers} thread(s): {time.perf_counter() - t:.2f} s for {len(cases)} cases"
          f"  (checksum {sum(results):.1f})")

# Output on a four-core machine:
# 1 thread(s): 0.29 s for 64 cases  (checksum -348941526.4)
# 2 thread(s): 0.15 s for 64 cases  (checksum -348941526.4)
# 4 thread(s): 0.08 s for 64 cases  (checksum -348941526.4)
```

**The cases.** Sixty-four starting states, radius and speed nudged by about 0.1%, plus a small random out-of-plane velocity — a tiny Monte Carlo of 20 000 steps per case.

**The timing.** One thread takes 0.29 s, two take 0.15 s, four take 0.08 s. That is $0.29 / 0.08 \approx 3.6$ times faster on four cores: nearly perfect, because the GIL is released for the whole compute loop and the threads **[[genuinely run at once|threads-measured]]**. The same test with the release line deleted gave 0.29, 0.30 and 0.31 s — no gain at all.

**The checksum.** Identical in every row, so the answer does not depend on how the threads were scheduled. Determinism kept.

**Scaling up.** One case costs about $0.29 / 64 \approx 4.5\,\mathrm{ms}$. A 10 000-case Monte Carlo is then about $45\,\mathrm{s}$ on one core and about $12.5\,\mathrm{s}$ on four. The pure-NumPy version, at $18\,\mu\mathrm{s}$ per step, would need about an hour. The third exercise has this shape, with its dispersions generated in NumPy the way `cases` is here.
:::

::: warning Python objects inside the release scope
Using any Python object while the GIL is released is undefined behavior of the worst kind: it quietly damages the interpreter's bookkeeping instead of crashing. Allocate outputs and read inputs before the release, do pure C++ inside it, and let the scope end before returning. If the C++ inside throws, RAII helps you: the exception passes through the release object's destructor, which takes the GIL back before pybind11 turns the exception into a Python one. What you must not do inside the scope is call anything in the Python API yourself.
:::

Four cores gave 3.6 times, not 4. Some work still runs with the GIL held: converting each input, allocating each output array, and the Python loop handing out cases. **[[Amdahl's law|amdahl]]** says that serial part caps the speedup, however many cores you add.

## Packaging so pip builds it

A binding only its author can build is not a tool. The fix puts the compiling under `pip`, with two small files.

::: example pyproject.toml and setup.py
```text
[build-system]
requires = ["setuptools>=64", "pybind11>=2.12"]
build-backend = "setuptools.build_meta"

[project]
name = "gnc-core"
version = "0.1.0"
description = "Two-body RK4 propagator: C++/Eigen core with a pybind11 binding"
requires-python = ">=3.9"
dependencies = ["numpy"]
```

```python
import os
from pybind11.setup_helpers import Pybind11Extension, build_ext
from setuptools import setup

eigen_include = os.environ.get("EIGEN_INCLUDE", "/usr/include/eigen3")

ext = Pybind11Extension(
    "gnc_core",
    sources=["src/gnc_core.cpp"],
    include_dirs=[eigen_include],
    cxx_std=20,
    extra_compile_args=["-O3", "-Wall", "-Wextra"],
)

setup(ext_modules=[ext], cmdclass={"build_ext": build_ext})
```

```text
$ python3 -m venv venv && . venv/bin/activate
$ pip install -e .
$ pip show gnc-core
Name: gnc-core
Version: 0.1.0
Summary: Two-body RK4 propagator: C++/Eigen core with a pybind11 binding
$ python -c "import gnc_core, numpy as np; print(gnc_core.propagate(np.array([6778137.0,0,0,0,7668.56,0]), 1.0, 3).shape)"
(4, 6)
```

**The first file,** `pyproject.toml`, tells `pip` what it needs before it can build (setuptools and pybind11) and describes the package: name, version, and NumPy as a run-time need.

**The second file,** `setup.py`, describes the extension. `Pybind11Extension` already knows pybind11's include folders, the visibility flag and how to ask for C++20. `build_ext` from `pybind11.setup_helpers` can compile several files in parallel. The Eigen folder comes from an environment variable, so a colleague with Eigen installed somewhere unusual can point at it.

**The install.** In a fresh virtual environment, `pip install -e .` reads `pyproject.toml`, downloads the build requirements into a temporary, isolated environment, compiles the extension for *this* Python, and installs the package as **[[editable|editable-install]]**. The last line proves it: the module imports and a three-step run returns 4 rows. That is the exercise's "builds from a clean checkout": one command, for anyone with a compiler, Eigen and network access.
:::

If the C++ side already has a CMake build (lesson 11), there is a second route. Add `pybind11_add_module(gnc_core src/gnc_core.cpp)` to `CMakeLists.txt` — pybind11 ships that CMake function — and let `pip` drive CMake through the `scikit-build-core` backend instead of setuptools. The result is the same editable install; the only choice is whether the Python package or the C++ project owns the build.

## Designing the split

Put in the C++ core everything that must be flight-representative or fast: dynamics, integrator, estimator, fixed-point conversions, mode logic. Keep in Python what changes daily and suits a notebook: dispersions, running the cases, statistics, plots.

Keep the interface between them **narrow**: a handful of functions that take and return arrays. A state-in, trajectory-out `propagate` is easier to bind, test and keep stable than an object model copied across the boundary.

Move data in bulk, in NumPy's layout.

- **Small inputs** copy cheaply, like the six-number state.
- **Large inputs** arrive as `py::array_t<double, py::array::c_style | py::array::forcecast>` — "give me a C-ordered array of doubles, converting if you must" — and are viewed with `Eigen::Map`. Or take an `Eigen::Ref` to a dynamic matrix, which pybind11 fills without copying when the layout already matches.
- **Outputs** are NumPy arrays, allocated in C++ and filled in place.
- **Watch the containers.** Returning `std::vector<Vector6d>` through `pybind11/stl.h` gives Python a *list* of 5555 separate little arrays — one Python object per state, each built one at a time. That is the copying trap the exercise warns about.

Errors the core reports as status codes (lesson 8) become exceptions in the binding, so a Python caller sees a `ValueError` it cannot miss instead of a return code it might ignore.

::: key
Release the GIL around the compute loop with `py::gil_scoped_release`, touching no Python objects inside the scope, so that a `ThreadPoolExecutor` of Python threads runs the C++ core in parallel on every core with no `multiprocessing`; keep the core free of mutable shared state so that the result is deterministic whatever the scheduling.
:::

## Check yourself

::: check
`propagate` allocates a `py::array_t` and fills it through a `RowMajor` `Eigen::Map`. A colleague suggests returning a plain `Eigen::MatrixXd` instead, which `pybind11/eigen.h` also accepts. What would change for the Python caller, and what would go wrong if you kept the `py::array_t` but dropped `RowMajor` from the `Map`?
:::

::: answer
Returning an Eigen matrix by value does not copy the numbers: pybind11 moves the matrix to the heap and hands Python an array that points into it (its `OWNDATA` flag is `False`). But a plain `MatrixXd` is **column-major**, Eigen's default. So Python receives a Fortran-ordered array (`C_CONTIGUOUS` is `False`), and any NumPy code or C library that needs C order will quietly make a full copy. Declaring the matrix `RowMajor` would fix that. The `py::array_t` route makes NumPy the owner of an ordinary C-ordered array from the start, allocated before the GIL is released.

Dropping `RowMajor` from the `Map` is worse. Eigen would treat the buffer as column-major, so `traj.row(i)` would write six numbers spread $n+1$ places apart. Read back in NumPy's row order, the trajectory would be scrambled — the right numbers in the wrong places, with no error.
:::

::: check
A colleague moves the line that allocates `out` inside the `py::gil_scoped_release` scope, "so the allocation runs in parallel too". What is wrong?
:::

::: answer
Creating a NumPy array is a Python-object operation: it calls into the interpreter to allocate the object and register it, and the interpreter's internal data is protected by the GIL. Doing it with the GIL released is a data race against every other Python thread. That is undefined behavior, and it usually damages the interpreter's memory or reference counts rather than crashing at the guilty line. Everything that touches Python objects — allocating outputs, reading inputs, raising exceptions — must happen with the GIL held. Only pure C++ over raw memory goes inside the release scope.
:::

::: check
NumPy is usually called fast, yet the C++ core beat it about 67 times here. Why, and for what kind of computation would NumPy have been competitive?
:::

::: answer
NumPy is fast when one call does a lot of work — one operation over a million numbers — because the loop runs in compiled C and the interpreter overhead is paid once. Here each RK4 step is a dozen calls on six-number arrays, each paying microseconds of overhead for nanoseconds of arithmetic, and the steps must run in time order, so no call can be made bigger.

NumPy would compete, or even win, if the work were vectorized across *cases* instead of time: stepping all ten thousand Monte Carlo states at once as a $(10\,000, 6)$ array. But that rewrites the propagator in a form that no longer matches the flight code, which defeats the purpose of the split.
:::

::: check
The thread pool went from 0.29 s to 0.08 s between one and four threads. What would limit further scaling, and what would happen if `two_body` used a `static Vector6d scratch;` to avoid building its result on every call?
:::

::: answer
Past the number of physical cores, threads take turns on the same cores, so eight threads on four cores gain nothing. For bigger problems, memory bandwidth and the shared cache run out before that. And every part that still holds the GIL — converting inputs, allocating outputs, the Python bookkeeping — runs one at a time and caps the speedup, by Amdahl's law.

A `static` scratch vector is one object shared by every thread. Two threads in `two_body` at once would read and write it with nothing coordinating them: a data race. The derivatives would be corrupted, and the checksum would change from run to run. To be called from a thread pool, the core must keep its state in arguments and local variables.
:::

::: check
A module built on one workstation imports fine there, but fails with `ModuleNotFoundError` on a colleague's machine, although the `.so` file is right there in the folder. Name the most likely cause and the fix.
:::

::: answer
The file name records the Python it was built for — `gnc_core.cpython-311-x86_64-linux-gnu.so`. A colleague running Python 3.12 looks for a `cpython-312` ending, ignores the 3.11 file completely, and reports the module as not found. Compiled modules are tied to one Python version and platform. The fix is to build on, or for, the colleague's Python, which `pip install -e .` does automatically because it compiles against whichever Python runs it. A module built by hand should take its include folders and file ending from the Python that will import it.
:::

## Summary

| Item | Meaning |
| --- | --- |
| binding, extension module | a shared library with a start-up function; Python imports it like a module |
| file ending | carries the Python version and platform, e.g. `cpython-311-x86_64-linux-gnu.so` |
| `PYBIND11_MODULE(name, m)` | defines the module; `m.def("f", &f, py::arg("x"), "doc")` registers a function |
| `pybind11/eigen.h`, `numpy.h`, `stl.h` | type casters for Eigen matrices, NumPy arrays, standard containers |
| output in place | allocate a `py::array_t` once, view it with a `RowMajor` `Eigen::Map`, write rows directly |
| exception translation | `std::invalid_argument` becomes `ValueError`; the binding is where exceptions belong |
| `py::gil_scoped_release` | RAII release of the GIL around pure C++; no Python objects inside |
| thread pool | released C++ runs in parallel: 0.29 s to 0.08 s on four cores here |
| agreement | 97% of entries bit-identical, worst one ulp; `-ffast-math` breaks the $10^{-12}$ test |
| build by hand | `-shared -fPIC -fvisibility=hidden`, includes and ending from the Python that imports it |
| `pyproject.toml` + `setup.py` | `Pybind11Extension`; `pip install -e .` builds and installs editable |
| the split | flight-representative, fast code in C++; dispersions, orchestration and plots in Python |

This closes the module. You have written allocation-free numerical C++ with Eigen, built it with CMake, tested it with GoogleTest, checked it with sanitizers and analyzers, and driven it from Python — the daily work of a GNC software engineer.

::: context monte-carlo Answering a question by rolling dice
A Monte Carlo study answers "how likely is this to go wrong?" by trying it thousands of times with slightly different inputs — a heavier vehicle, a gustier wind, an engine a little weaker — and counting the outcomes. Instead of solving for every combination, you sample them.

The method was worked out at Los Alamos in the late 1940s by Stanislaw Ulam and John von Neumann, and named after the famous casino in Monaco, because it runs on random numbers the way a roulette wheel does. Every launch vehicle's guidance is checked this way before flight.
:::

::: context shared-library Machine code loaded while the program runs
A normal program has all its code packed in at build time. A shared library is a file of compiled machine code that a program loads *while it is running* — and that several programs can share. Linux calls them `.so` files ("shared object"), Windows `.dll` (Python's are renamed `.pyd`), macOS `.dylib`.

Because the library may be loaded at any address in memory, its code must work wherever it lands. That is what `-fPIC`, "position-independent code", asks the compiler for. When you `import numpy`, Python is loading dozens of these files behind the scenes.
:::

::: context type-caster The converters at the border
A Python number and a C++ `double` hold the same idea but are stored completely differently: the Python one is a full object with a type and a reference count, the C++ one is 8 bytes of raw bits. Something must translate at the border, both ways.

In pybind11 that something is a type caster — a small piece of template code for each type pair. When you register a function, pybind11 picks the right caster for every parameter and for the return value, at compile time. If no caster exists for a type, the code fails to compile or raises a `TypeError` at the call, instead of passing garbage.
:::

::: context row-major Two ways to lay a table in a line
Memory is one long line of slots, so a 2-D table must be flattened. Row-major order (NumPy and C) writes the first row, then the second. Column-major order (Eigen's default, and Fortran and MATLAB) writes the first column, then the second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="40" width="30" height="30"/><rect x="50" y="40" width="30" height="30"/><rect x="80" y="40" width="30" height="30"/>
    <rect x="20" y="70" width="30" height="30"/><rect x="50" y="70" width="30" height="30"/><rect x="80" y="70" width="30" height="30"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="35" y="60">a</text><text x="65" y="60">b</text><text x="95" y="60">c</text>
    <text x="35" y="90">d</text><text x="65" y="90">e</text><text x="95" y="90">f</text>
    <text x="65" y="28" font-size="12">the table</text>
  </g>
  <text x="150" y="44" font-size="12" fill="#1d6fd1">row-major (NumPy)</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2">
    <rect x="150" y="50" width="30" height="24"/><rect x="180" y="50" width="30" height="24"/><rect x="210" y="50" width="30" height="24"/>
    <rect x="240" y="50" width="30" height="24"/><rect x="270" y="50" width="30" height="24"/><rect x="300" y="50" width="30" height="24"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="67">a</text><text x="195" y="67">b</text><text x="225" y="67">c</text>
    <text x="255" y="67">d</text><text x="285" y="67">e</text><text x="315" y="67">f</text>
  </g>
  <text x="150" y="104" font-size="12" fill="#b4232c">column-major (Eigen default)</text>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1.2">
    <rect x="150" y="110" width="30" height="24"/><rect x="180" y="110" width="30" height="24"/><rect x="210" y="110" width="30" height="24"/>
    <rect x="240" y="110" width="30" height="24"/><rect x="270" y="110" width="30" height="24"/><rect x="300" y="110" width="30" height="24"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="127">a</text><text x="195" y="127">d</text><text x="225" y="127">b</text>
    <text x="255" y="127">e</text><text x="285" y="127">c</text><text x="315" y="127">f</text>
  </g>
  <text x="240" y="158" font-size="11" fill="#6c7a93" text-anchor="middle">memory addresses increase to the right</text>
</svg>
```

Same table, same six numbers, different order in memory. Read one layout as the other and the values land in the wrong cells.
:::

::: context ulp The smallest step a double can take
A `double` cannot hold every number. It holds a grid of values, and the gap between neighbors grows with the size of the number. Near $2935.565$ the gap is $4.547 \times 10^{-13}$. That gap is called one ulp, a "unit in the last place".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="52" x2="40" y2="68"/><line x1="100" y1="52" x2="100" y2="68"/><line x1="160" y1="52" x2="160" y2="68"/>
    <line x1="220" y1="52" x2="220" y2="68"/><line x1="280" y1="52" x2="280" y2="68"/><line x1="340" y1="52" x2="340" y2="68"/>
  </g>
  <circle cx="160" cy="60" r="6" fill="#1d6fd1"/>
  <circle cx="220" cy="60" r="6" fill="#b4232c"/>
  <text x="160" y="40" font-size="12" fill="#1d6fd1" text-anchor="middle">C++</text>
  <text x="220" y="40" font-size="12" fill="#b4232c" text-anchor="middle">NumPy</text>
  <line x1="160" y1="84" x2="220" y2="84" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="160" y1="79" x2="160" y2="89" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="220" y1="79" x2="220" y2="89" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="190" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">1 ulp = 4.547 × 10⁻¹³ near 2935.565</text>
</svg>
```

No `double` lies between the two answers. They differ by the smallest amount two doubles near that size possibly can.
:::

::: context fast-math What -ffast-math gives up
Computer arithmetic breaks some school rules. $(a + b) + c$ and $a + (b + c)$ can round to different answers. The C++ standard makes the compiler keep your order exactly.

`-ffast-math` tells the compiler it may reorder sums, assume no value is ever NaN or infinite, and take other shortcuts. The code often gets faster, but the results change in the last digits and can differ between compilers or machines. Here it widened the gap to the NumPy version about ten thousand times, from $4.5 \times 10^{-13}$ to $4.7 \times 10^{-9}$. For code whose job is to match the flight software, that is fatal.
:::

::: context gil-story Why Python has one big lock
Every Python object carries a count of how many names point to it; when the count reaches zero, the object is freed. If two threads changed the same count at the same instant, the count could go wrong and an object could be freed while still in use.

Since threads arrived in CPython in the early 1990s, the fix has been one lock around the whole interpreter. It is simple and makes single-threaded code fast, at the cost of true parallel Python code. Python 3.13, released in 2024, added an optional experimental build without the GIL, so this may change over the coming years. C++ code that releases the lock gets the parallelism today.
:::

::: context threads-measured Released versus held, measured
The same 64 cases, timed with the GIL released inside `propagate` and with the release line deleted:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="45" y="46.5" width="26" height="93.5"/>
    <rect x="81" y="91.6" width="26" height="48.4"/>
    <rect x="117" y="114.2" width="26" height="25.8"/>
  </g>
  <g fill="#6c7a93">
    <rect x="205" y="46.5" width="26" height="93.5"/>
    <rect x="241" y="43.2" width="26" height="96.8"/>
    <rect x="277" y="40" width="26" height="100"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="58" y="40">0.29</text><text x="94" y="85">0.15</text><text x="130" y="108">0.08</text>
    <text x="218" y="40">0.29</text><text x="254" y="37">0.30</text><text x="290" y="34">0.31</text>
    <text x="58" y="154">1</text><text x="94" y="154">2</text><text x="130" y="154">4</text>
    <text x="218" y="154">1</text><text x="254" y="154">2</text><text x="290" y="154">4</text>
  </g>
  <text x="94" y="172" font-size="12" fill="#1d6fd1" text-anchor="middle">GIL released</text>
  <text x="254" y="172" font-size="12" fill="#6c7a93" text-anchor="middle">GIL held</text>
  <text x="30" y="18" font-size="11" fill="#1f2a44">seconds for 64 cases, by number of threads</text>
</svg>
```

With the GIL held, extra threads only wait their turn, and the small rise comes from the cost of switching between them.
:::

::: context amdahl The part you cannot split
Amdahl's law, named after computer designer Gene Amdahl, says: if a fraction $s$ of a job must run one step at a time, then with $N$ cores the best speedup is

$$
\frac{1}{s + (1 - s)/N}.
$$

With 5% serial work ($s = 0.05$), four cores give at most $1 / (0.05 + 0.95/4) \approx 3.48$ times, and even a million cores give less than 20 times. That is why the binding does as much as possible with the GIL released, and keeps the serial Python part small.
:::

::: context editable-install Installed, but still in your folder
A normal `pip install` copies the package into Python's library folder; change the source afterwards and the installed copy does not notice. An editable install (`-e`) instead records a pointer to your source folder, so `import gnc_core` always finds the files where you are working.

For Python files, edits take effect at the next import. For a compiled extension, the `.so` must be rebuilt after a C++ change — run `pip install -e .` again — but you never have to hunt down stale copies elsewhere.
:::
