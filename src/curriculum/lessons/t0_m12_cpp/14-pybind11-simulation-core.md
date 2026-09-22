---
id: l14-pybind11-simulation-core
title: pybind11 bindings over a C++ simulation core
minutes: 26
covers:
  - pybind11 bindings over a C++ simulation core
---

Production GNC tooling has a shape. The dynamics, the integrator and the estimator — the code that must be fast, deterministic and identical to what flies — are C++. The Monte Carlo that disperses ten thousand cases over them, the statistics, the plots, the notebook a reviewer opens the next morning — those are Python. The boundary between the two is a *binding*: a compiled Python extension module that exposes the C++ functions as ordinary Python callables, converting NumPy arrays to Eigen matrices on the way in and back on the way out. pybind11 is the header-only library that generates that binding from a few lines of C++.

The reason for the split is only partly speed, though the speed is real: this lesson's propagator runs its 5554 RK4 steps sixty times faster than the same algorithm written with NumPy, because NumPy's strength is vectorising across many elements and a time-stepping loop offers it six at a time. The deeper reason is fidelity. When the Python Monte Carlo calls the C++ core, it exercises the *flight* implementation — the same integrator, the same fixed-point conversions, the same fault logic — rather than a Python transcription of it that may or may not agree. The Monte Carlo becomes a test of the software that flies.

This lesson writes the binding for the two-body propagator, drives it from Python, releases the Global Interpreter Lock so that a thread pool can use every core, and packages it so that `pip install -e .` builds it from a clean checkout — which is the module's third exercise, end to end.

## How a Python extension module works

CPython can import a shared library — a `.so` on Linux, a `.pyd` on Windows — as a module, provided it exports an initialisation function named after the module. That function registers Python-callable functions, each of which is a C function that receives Python objects, converts them, does its work and builds a Python object to return. Writing that glue by hand against the C API is tedious and error-prone. pybind11 writes it for you from templates: you say `m.def("propagate", &propagate)` and the library deduces the argument and return types of `propagate`, generates converters for each, and produces the registration code.

The converters — pybind11 calls them *type casters* — cover the built-in types, the STL containers when you include `pybind11/stl.h`, NumPy arrays through `pybind11/numpy.h`, and Eigen matrices through `pybind11/eigen.h`, which is the header that makes a `Vector6d` parameter accept a NumPy array of six doubles. C++ exceptions crossing the boundary are translated: `std::invalid_argument` becomes a Python `ValueError`, `std::out_of_range` an `IndexError`, `std::runtime_error` a `RuntimeError`. The binding layer is precisely the place lesson 8 said exceptions belong.

The compiled module's file name carries the Python version and platform it was built for — `gnc_core.cpython-311-x86_64-linux-gnu.so` — and Python will not import a module built for a different interpreter. Ask the interpreter itself for the suffix rather than guessing.

## The binding

::: example A pybind11 module over the propagator
```cpp
#include <Eigen/Dense>
#include <pybind11/eigen.h>
#include <pybind11/numpy.h>
#include <pybind11/pybind11.h>

#include <stdexcept>

namespace py = pybind11;

using Vector6d = Eigen::Matrix<double, 6, 1>;
constexpr double kMu = 3.986004418e14;   // m^3/s^2

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
// The array is allocated once, by NumPy, and written in place through an Eigen::Map.
py::array_t<double> propagate(const Vector6d& state0, double dt, int n_steps) {
  if (n_steps < 0) throw std::invalid_argument("n_steps must be non-negative");
  if (!(dt > 0.0)) throw std::invalid_argument("dt must be positive");

  py::array_t<double> out({n_steps + 1, 6});
  using RowMajor6 = Eigen::Matrix<double, Eigen::Dynamic, 6, Eigen::RowMajor>;
  Eigen::Map<RowMajor6> traj(out.mutable_data(), n_steps + 1, 6);

  {
    py::gil_scoped_release release;          // other Python threads may run while we compute
    Vector6d x = state0;
    traj.row(0) = x.transpose();
    for (int i = 0; i < n_steps; ++i) {
      x = rk4_step(x, dt);
      traj.row(i + 1) = x.transpose();
    }
  }                                          // the GIL is re-acquired here, before touching Python again
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
      -I$(python3 -c "import sysconfig; print(sysconfig.get_paths()['include'])") \
      $(python3 -m pybind11 --includes) -I/usr/include/eigen3 \
      gnc_core.cpp -o gnc_core$(python3 -c "import sysconfig; print(sysconfig.get_config_var('EXT_SUFFIX'))")
$ ls
gnc_core.cpython-311-x86_64-linux-gnu.so  gnc_core.cpp
```

The physics is lesson 10's propagator unchanged. Everything new is in `propagate` and the `PYBIND11_MODULE` block. The `Vector6d` parameter comes from a NumPy array of shape `(6,)`; `pybind11/eigen.h` checks the shape and dtype and copies the 48 bytes, which is the right trade for a small input. The output is the other way round: a trajectory of $(n+1) \times 6$ doubles is allocated *once, by NumPy*, as a `py::array_t`, and an `Eigen::Map` with `RowMajor` layout — NumPy's default, the opposite of Eigen's — lets the loop write straight into it. No C++ matrix is built and then copied into Python; the exercise's "without copying more than necessary" means exactly this. The two `throw` statements become Python exceptions at the call site.

`PYBIND11_MODULE(gnc_core, m)` defines the module and its initialisation function; `m.def` registers each function with argument names (so Python may call `propagate(x0, dt=1.0, n_steps=5554)`) and a docstring; `m.attr` exports a constant. `-shared -fPIC` produce a shared library, `-fvisibility=hidden` keeps the symbol table to what pybind11 needs, and the include paths and suffix come from the interpreter that will import the module — `python3-config` on a machine with several Pythons may describe a different one.
:::

## Driving the core from Python

::: example Agreement, energy, and a sixty-fold speedup
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

print(f"shape {traj_cpp.shape}, dtype {traj_cpp.dtype}, C-contiguous {traj_cpp.flags['C_CONTIGUOUS']}")
print(f"max |cpp - numpy| over the trajectory: {np.max(np.abs(traj_cpp - traj_np)):.3e} m")
print(f"relative: {np.max(np.abs(traj_cpp - traj_np)) / r0:.3e}")
e0 = gnc_core.specific_energy(x0); e1 = gnc_core.specific_energy(traj_cpp[-1])
print(f"energy drift {abs(e1 - e0) / abs(e0):.2e}")
print(f"C++ {t_cpp*1e3:.1f} ms, NumPy {t_np*1e3:.1f} ms, speedup {t_np / t_cpp:.0f}x  ({n} steps)")

try:
    gnc_core.propagate(x0, -1.0, 10)
except ValueError as e:
    print("C++ exception became a Python", type(e).__name__, "->", e)
```

```text
Output:
shape (5555, 6), dtype float64, C-contiguous True
max |cpp - numpy| over the trajectory: 4.547e-13 m
relative: 6.709e-20
energy drift 1.77e-15
C++ 1.5 ms, NumPy 91.4 ms, speedup 62x  (5554 steps)
C++ exception became a Python ValueError -> dt must be positive
```

Four results, each worth a sentence. The two implementations agree to $4.5 \times 10^{-13}\,\mathrm{m}$ over a full orbit of a $6.8 \times 10^6\,\mathrm{m}$ radius — a relative $7 \times 10^{-20}$, below double precision's $2 \times 10^{-16}$, which means the trajectories are bit-for-bit identical almost everywhere. That is not luck: both perform the same IEEE operations in the same order, and it is the exercise's "identical to $10^{-12}$" requirement met with room to spare. Reorder the arithmetic, or compile the C++ with `-ffast-math`, and the agreement collapses to $10^{-9}$ or so — which is why flight-representative code is never built with fast-math. The energy drift of $1.8 \times 10^{-15}$ is rounding. The speedup of about sixty is the interpreter's per-step overhead: each NumPy step is a dozen calls on six-element arrays, roughly 16 µs of dispatch around a few hundred nanoseconds of arithmetic, and the steps are sequential, so there is nothing for NumPy to vectorise across. And the `ValueError` shows the exception translation: the C++ `std::invalid_argument` arrived in Python as the exception a Python programmer expects, with its message intact.
:::

::: key
The pybind11 pattern for a simulation core: small inputs cross by value (an Eigen fixed-size vector from a NumPy array); large outputs are allocated once as a `py::array_t` and written in place through an `Eigen::Map` with `RowMajor` layout; C++ exceptions thrown in the binding become Python exceptions; `PYBIND11_MODULE` registers functions with `py::arg` names and docstrings.
:::

## Releasing the GIL

CPython's Global Interpreter Lock lets one thread execute Python bytecode at a time. A C++ function called from Python holds the lock for its whole duration by default, so a `ThreadPoolExecutor` calling `propagate` from four threads would run them one after another. `py::gil_scoped_release` is an RAII object (lesson 3 again) that releases the lock on construction and reacquires it on destruction. Inside its scope the C++ code runs free of the interpreter, and other Python threads — each calling into the same core — run in parallel on other cores. The exercise asks for exactly this, so that a Monte Carlo can use a thread pool without the process-spawning and pickling overhead of `multiprocessing`.

Two rules make it safe. While the lock is released, the code must not touch any Python object — no creating arrays, no reading attributes, no raising exceptions — which is why `propagate` allocates its output array *before* the release and only writes to the raw buffer inside it. And the C++ code must be thread-safe in its own right: no mutable shared state, which the propagator satisfies because it uses only its arguments and locals. A `static` scratch buffer inside `two_body` would be a data race the moment two threads called it.

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
    print(f"{workers} thread(s): {time.perf_counter() - t:.2f} s for {len(cases)} cases  (checksum {sum(results):.1f})")
```

```text
Output on a four-core machine:
1 thread(s): 0.30 s for 64 cases  (checksum -348941526.4)
2 thread(s): 0.14 s for 64 cases  (checksum -348941526.4)
4 thread(s): 0.08 s for 64 cases  (checksum -348941526.4)
```

Sixty-four dispersed cases of 20 000 steps each take 0.30 s on one thread, 0.14 s on two and 0.08 s on four: nearly linear, because the GIL is released for the whole compute loop and the four threads genuinely run at once. The identical checksums say the result does not depend on the scheduling — determinism preserved. Scale the numbers: at 4.7 ms per case, a 10 000-case Monte Carlo is 47 s on one core and about 12 s on four; the pure-NumPy version, sixty times slower per case, would take close to fifty minutes. This is the shape of the third exercise, and the dispersions — mass, drag, winds, initial state — are generated in NumPy exactly as `cases` is here.
:::

::: warning
Inside a `py::gil_scoped_release` scope, any use of a Python object is undefined behaviour of the worst kind — it corrupts the interpreter's state rather than crashing immediately. Allocate outputs and read inputs before the release, do pure C++ inside it, and let the scope end before returning. If the C++ code can throw, catch inside the scope or let the release object's destructor run first; pybind11 handles the common case, but the rule is easier to follow than to reason about.
:::

## Packaging so that pip builds it

A binding that only its author can build is not tooling. The standard packaging puts the compilation under `pip`: a `pyproject.toml` that names pybind11 as a build dependency and a `setup.py` that describes the extension.

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
$ pip install -e .
$ pip show gnc-core
Name: gnc-core
Version: 0.1.0
Summary: Two-body RK4 propagator: C++/Eigen core with a pybind11 binding
$ python -c "import gnc_core, numpy as np; print(gnc_core.propagate(np.array([6778137.0,0,0,0,7668.56,0]), 1.0, 3).shape)"
(4, 6)
```

`Pybind11Extension` knows the include paths, the visibility flag and the C++ standard switch; `build_ext` from `pybind11.setup_helpers` adds parallel compilation. `pip install -e .` reads `pyproject.toml`, installs the build dependencies into an isolated environment, compiles the extension, and installs the package *editable*, so that the module is imported from the source tree and a rebuild after a C++ change is another `pip install -e .`. On a machine where pybind11 is already present, `--no-build-isolation` skips the isolated environment; that is how the commands above were run for this lesson. The Eigen path comes from an environment variable so that a developer with Eigen somewhere unusual can point at it; the exercise's "builds from a clean checkout" means a colleague with only a compiler, Eigen and network access can run the install and get a working module.
:::

When the C++ side already has a CMake build (lesson 11), the alternative is to add `pybind11_add_module(gnc_core src/gnc_core.cpp)` to the `CMakeLists.txt` — pybind11 ships the CMake function — and drive it from `pip` through the `scikit-build-core` backend instead of `setuptools`. The result is the same editable install; the choice is whether the Python package or the C++ project owns the build.

## Designing the split

Put into the C++ core whatever must be flight-representative or fast: the dynamics and integrator, the estimator, fixed-point conversions, mode logic. Keep in Python whatever changes daily and benefits from a notebook: dispersion generation, orchestration, statistics, plotting. The interface between them is a handful of functions taking and returning arrays, and it is worth keeping it narrow — a `propagate` that takes a state and returns a trajectory is easier to bind, test and keep stable than an object model mirrored across the boundary.

Move data across the boundary in bulk and in NumPy's layout. Inputs that are small copy cheaply; inputs that are large arrive as `py::array_t` with `py::array::c_style | py::array::forcecast` and are mapped with `Eigen::Map`, or as `Eigen::Ref` to a dynamic matrix, which pybind11 binds without a copy when the layout already matches. Outputs are NumPy arrays allocated in C++ and filled in place. Errors that the core reports as status codes (lesson 8) are converted to exceptions in the binding, so that a Python caller sees a `ValueError` rather than a return code it might ignore.

::: key
Release the GIL around the compute loop with `py::gil_scoped_release`, touching no Python objects inside the scope, so that a `ThreadPoolExecutor` of Python threads runs the C++ core in parallel on every core with no `multiprocessing`; keep the core free of mutable shared state so that the result is deterministic whatever the scheduling.
:::

## Check yourself

::: check
Why does `propagate` return a `py::array_t` filled through an `Eigen::Map`, rather than building an `Eigen::MatrixXd` and returning it, which `pybind11/eigen.h` would also accept?
:::

::: answer
Returning an Eigen matrix by value makes pybind11 allocate a NumPy array and *copy* the matrix into it, so the trajectory exists twice and $(n+1) \times 6$ doubles are written and read once more than necessary — for a long run, megabytes per call. Allocating the `py::array_t` first and mapping it lets the loop write each row directly into the memory Python will own, so the data is written exactly once. The `RowMajor` template argument on the `Map` matches NumPy's default layout; without it Eigen would interpret the buffer column-major and the array would come back transposed in memory.
:::

::: check
A colleague moves the line that allocates the output array, `out`, inside the `py::gil_scoped_release` scope "so that the allocation runs in parallel too". What is wrong?
:::

::: answer
Creating a NumPy array is a Python object operation: it calls into the interpreter to allocate and register the object, and the interpreter's data structures are protected by the GIL. Doing it with the lock released is a data race against every other Python thread — undefined behaviour that typically corrupts the interpreter's heap or reference counts rather than crashing at the offending line. Everything that touches Python objects — allocating outputs, reading inputs, raising exceptions — must happen with the lock held, before the release scope opens or after it closes; only pure C++ over raw buffers goes inside.
:::

::: check
NumPy is usually described as fast, yet the C++ core beat it sixty-fold here. Why, and in what kind of computation would NumPy have been competitive?
:::

::: answer
NumPy is fast when a single call does a large amount of work — one operation over a million elements — because the loop runs in C and the interpreter overhead is paid once. Here each RK4 step is a dozen calls on six-element arrays, each costing microseconds of dispatch for nanoseconds of arithmetic, and the steps are sequential in time, so no call can be made larger. NumPy would be competitive, or would win, in a formulation vectorised across *cases* rather than time — stepping all ten thousand Monte Carlo states at once as a $(10\,000, 6)$ array — but that reimplements the propagator in a form that no longer matches the flight code, which defeats the purpose of the split.
:::

::: check
The thread pool scaled from 0.30 s to 0.08 s from one to four threads. What would limit further scaling, and what would happen if `two_body` used a `static Vector6d scratch;` to avoid constructing its result each call?
:::

::: answer
Beyond the number of physical cores, threads share cores and time-slice, so eight threads on four cores gain nothing; memory bandwidth and the shared last-level cache limit scaling before that for larger states; and any part of the work that still holds the GIL — converting inputs, allocating outputs, Python-side bookkeeping — runs serially and caps the speedup by Amdahl's law. A `static` scratch buffer would be shared by all threads: two threads calling `two_body` at once would write and read the same object without synchronisation, a data race, producing corrupted derivatives and different checksums on every run. The core must hold its state in arguments and locals to be called from a thread pool.
:::

::: check
A module built on one workstation imports fine there but fails with `ModuleNotFoundError` on a colleague's machine, although the `.so` file is present in the directory. Name the most likely cause and the fix.
:::

::: answer
The extension's file name encodes the interpreter it was built for — `gnc_core.cpython-311-x86_64-linux-gnu.so` — and Python 3.12, say, looks for a `cpython-312` suffix and ignores the 3.11 file entirely, reporting the module as not found. Extensions are bound to a Python version and platform; the fix is to build on, or for, the colleague's interpreter, which is what `pip install -e .` does automatically by compiling against whichever Python runs the install. Hand-built modules should take their include path and suffix from `sysconfig` of the interpreter that will import them, not from a `python3-config` that may belong to another.
:::

## Summary

| Item | Meaning |
| --- | --- |
| extension module | a shared library with an init function; file name carries the Python version and platform |
| `PYBIND11_MODULE(name, m)` | defines the module; `m.def("f", &f, py::arg("x"), "doc")` registers a function |
| `pybind11/eigen.h`, `pybind11/numpy.h` | Eigen matrices from and to NumPy arrays; `py::array_t` for arrays you allocate yourself |
| output in place | allocate `py::array_t` once, map it with `Eigen::Map` (`RowMajor`), write rows directly |
| exception translation | `std::invalid_argument` becomes `ValueError`; the binding is where exceptions belong |
| `py::gil_scoped_release` | RAII release of the GIL around pure C++ work; no Python objects inside the scope |
| thread pool | `ThreadPoolExecutor` runs released C++ in parallel; 0.30 s to 0.08 s on four cores here |
| agreement to $10^{-12}$ | same IEEE operations in the same order; `-ffast-math` would destroy it |
| build by hand | `-shared -fPIC -fvisibility=hidden`, includes and suffix from `sysconfig` |
| `pyproject.toml` + `setup.py` | `Pybind11Extension`; `pip install -e .` builds and installs editable |
| the split | flight-representative, fast code in C++; dispersions, orchestration and plots in Python |

This closes the module. You have written allocation-free, unit-tested numerical C++ with Eigen, built it with CMake, tested it with GoogleTest, checked it with sanitizers and analysers, and driven it from Python — the four objectives, and the daily work of a GNC software engineer.
