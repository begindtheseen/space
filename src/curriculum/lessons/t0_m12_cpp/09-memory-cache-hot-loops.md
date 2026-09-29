---
id: l09-memory-cache-hot-loops
title: Memory layout, the cache, and allocation-free hot loops
minutes: 26
covers:
  - memory layout, cache behaviour, allocation-free hot loops
---

Picture a pit crew at a race. Four tyres change in about two seconds, because everything was set up beforehand: every tyre in reach, every wrench in place. Nobody runs to the storeroom mid-stop. A pit stop is judged by its slowest moment, so the crew removes every moment that *might* be slow.

A flight control loop is a pit stop hundreds of times a second, for the whole flight. Its most important job is to finish on time, every cycle. Two things break that promise, and no clever algorithm repairs them. The first is asking for fresh memory from the **heap** mid-loop — the run to the storeroom, which takes a time nobody can bound. The second is reaching for data the processor's fast nearby memory does not hold, which turns a one-nanosecond read into a hundred-nanosecond wait, thousands of times over when the data is laid out badly.

This lesson covers where C++ objects live, how they are laid out in bytes, how the cache sees them, and the rules that make a loop's worst case a number rather than a hope. In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory boiled those rules down to ten, on four pages: *The Power of Ten*. Written for C, they are the backbone of most C++ flight coding standards. You will read all ten here.

Python hides these questions — every object on the heap — so a Python control loop cannot promise anything about its worst cycle.

## Where objects live

C++ gives every object one of three **storage durations**: how long it lives, and where. Each has its own cost.

**Automatic storage** is the **[[stack|stack-plates]]**. A local variable exists from its declaration to the end of its block. Making room for it is one subtraction from a pointer, and freeing it is the reverse — free and perfectly predictable. The limit is size: a flight task typically gets a few tens of kilobytes of stack, so big arrays and recursion are the risks. A stack overflow is not an error you can catch.

**Static storage** lasts for the whole program: globals, `static` locals, `constinit` variables. It is laid out before the program starts, costs nothing to "allocate", and holds everything flight software means to keep forever — the telemetry buffer, the sensor drivers, the estimator's state.

**Dynamic storage** is the heap, reached through `new` and `malloc`. To hand out a block, the **allocator** — the library code that manages the heap — must find a free block big enough, perhaps split one, perhaps take a lock because another thread is allocating too, perhaps ask the operating system for more. None of these has a bounded duration. The request can fail. And over a long mission the heap becomes **[[fragmented|heap-fragmentation]]**, so a request that worked on day one fails on day ninety.

Hence Power of Ten rule 3: *no dynamic memory allocation after initialisation*. Flight code allocates during start-up, where time is plentiful and a failure can stop the boot, and never again.

## Layout: alignment and padding

Think of a parking lot where buses must start on a space numbered by 8 and motorbikes may park anywhere. Park a motorbike, then a bus, and seven empty spaces sit between them.

Memory works the same way. Every type has an **alignment**, `alignof(T)` (say "align-of T"): its address must be a multiple of that number. A `double` sits at a multiple of 8, a `std::uint16_t` at a multiple of 2, a `std::uint8_t` anywhere. Processors are built to read **[[aligned|alignment-why]]** data in one go.

A struct's members are placed in the order you declare them. The compiler inserts **padding** — unused bytes — so each member is aligned. Then it pads the end so that `sizeof` is a multiple of the largest alignment; otherwise the second element of an array of these structs would be misaligned.

::: example Padding, and how member order removes it
```cpp
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <type_traits>

// Members in declaration order; the compiler inserts padding to align each one.
struct Sloppy {
  std::uint8_t  mode;        // 1 byte, then 7 bytes of padding so t_us is 8-aligned
  std::uint64_t t_us;        // 8 bytes
  std::uint16_t seq;         // 2 bytes, then 6 bytes of tail padding to make sizeof a multiple of 8
};

// Same members, largest alignment first: no interior padding.
struct Packed {
  std::uint64_t t_us;
  std::uint16_t seq;
  std::uint8_t  mode;
};                            // 11 bytes of data, padded to 16

static_assert(sizeof(Sloppy) == 24);
static_assert(sizeof(Packed) == 16);
static_assert(alignof(Packed) == 8);
static_assert(std::is_trivially_copyable_v<Packed>, "safe to memcpy onto a wire");

int main() {
  std::printf("Sloppy: sizeof %zu  offsets mode=%zu t_us=%zu seq=%zu\n", sizeof(Sloppy),
              offsetof(Sloppy, mode), offsetof(Sloppy, t_us), offsetof(Sloppy, seq));
  std::printf("Packed: sizeof %zu  offsets t_us=%zu seq=%zu mode=%zu\n", sizeof(Packed),
              offsetof(Packed, t_us), offsetof(Packed, seq), offsetof(Packed, mode));
  std::printf("alignof: uint8 %zu  uint16 %zu  uint64 %zu  double %zu\n",
              alignof(std::uint8_t), alignof(std::uint16_t), alignof(std::uint64_t), alignof(double));
  std::printf("1000 Sloppy = %zu bytes, 1000 Packed = %zu bytes\n", 1000 * sizeof(Sloppy), 1000 * sizeof(Packed));
  return 0;
}
// Output:
// Sloppy: sizeof 24  offsets mode=0 t_us=8 seq=16
// Packed: sizeof 16  offsets t_us=0 seq=8 mode=10
// alignof: uint8 1  uint16 2  uint64 8  double 8
// 1000 Sloppy = 24000 bytes, 1000 Packed = 16000 bytes
```

Walk through `Sloppy`. `mode` takes byte 0. `t_us` needs a multiple of 8, so bytes 1 to 7 are padding and `t_us` fills 8 to 15. `seq` fills 16 and 17. That is 18 bytes, but 18 is not a multiple of 8, so the end is padded to 24.

`Packed` puts `t_us` in 0 to 7, `seq` in 8 and 9, `mode` in 10: 11 bytes, padded to 16. Same data, 24 bytes in one order and 16 in the other — and lesson 7's 24-byte `Packet` was this same effect.

Rule of thumb: declare members from the largest alignment to the smallest. The `static_assert` lines pin the layout so a later edit cannot quietly change a telemetry format, and `std::is_trivially_copyable_v` confirms the struct may be copied byte for byte with `memcpy` onto a wire.
:::

::: warning
Compiler-specific `#pragma pack` and `[[gnu::packed]]` remove padding by allowing misaligned members. A misaligned load is undefined behaviour in standard C++, faults outright on some flight processors, and is slow on the ones that tolerate it. For a wire format, keep the struct aligned and write out the fields one by one, or `memcpy` each field out of the byte buffer.
:::

## The cache

Picture doing homework. A book on your desk takes a second to reach; one at the library takes an afternoon. So you bring home a whole stack at once, and keep the ones you are using on the desk.

The processor does exactly this. It never reads memory one byte at a time. It fetches **cache lines** of 64 bytes into a **[[hierarchy of small, fast memories|memory-hierarchy]]** called caches:

- **level 1** (L1): a few tens of kilobytes, answering in about 1 nanosecond;
- **level 2** (L2): a few hundred kilobytes, about 3 to 4 ns;
- **level 3** (L3): several megabytes, shared between cores, about 10 to 20 ns;
- **main memory**: gigabytes, about 60 to 100 ns.

A read that misses every level costs roughly a hundred times one that hits L1. The hardware also **[[prefetches|prefetcher]]**: when it sees consecutive lines being read, it fetches the next ones before they are asked for. So a sequential sweep runs close to cache speed however large the data is.

Two consequences follow. Reading one 8-byte `double` from each 64-byte line wastes seven-eighths of every fetch. And any structure that follows pointers — a linked list, a `std::map`, an array of pointers to scattered objects — risks a miss at every hop.

::: example The same additions, ten times slower
```cpp
#include <chrono>
#include <cstdio>
#include <vector>

int main() {
  const int n = 4096;                       // 4096 x 4096 doubles = 128 MiB, far larger than any cache
  std::vector<double> m(static_cast<std::size_t>(n) * n, 1.0);
  volatile double sink = 0.0;

  auto t0 = std::chrono::steady_clock::now();
  double s = 0.0;
  for (int r = 0; r < n; ++r)
    for (int c = 0; c < n; ++c) s += m[static_cast<std::size_t>(r) * n + c];   // row-major: consecutive addresses
  sink = s;
  auto t1 = std::chrono::steady_clock::now();
  s = 0.0;
  for (int c = 0; c < n; ++c)
    for (int r = 0; r < n; ++r) s += m[static_cast<std::size_t>(r) * n + c];   // column walk: stride 32 KiB
  sink = s;
  auto t2 = std::chrono::steady_clock::now();

  const double row_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
  const double col_ms = std::chrono::duration<double, std::milli>(t2 - t1).count();
  std::printf("row-major sweep %.1f ms, column sweep %.1f ms, ratio %.1fx (same %zu additions, sum %.0f)\n",
              row_ms, col_ms, col_ms / row_ms, m.size(), static_cast<double>(sink));
  return 0;
}
// Output on the machine this lesson was checked on (g++ -O2; your times will differ):
// row-major sweep 19.2 ms, column sweep 190.0 ms, ratio 9.9x (same 16777216 additions, sum 16777216)
```

The matrix is stored **[[row-major|row-major]]**: row 0 first, then row 1, and so on. It has $4096 \times 4096 = 16\,777\,216$ entries of 8 bytes, which is 128 MiB — thousands of times bigger than L1.

Both loops do the same 16.8 million additions. The first walks along rows, reading consecutive addresses: every fetched line gives eight useful doubles, and the prefetcher stays ahead. The second walks down columns. Each step jumps one whole row, $4096 \times 8 = 32\,768$ bytes = 32 KiB, so every addition fetches a fresh line, uses 8 of its 64 bytes, and gets no help from the prefetcher.

Result: about ten times slower, for identical arithmetic. (`volatile` keeps the optimiser from deleting the sums.)
:::

### Array of structs or struct of arrays

The same effect decides how a **[[Monte Carlo|monte-carlo]]** stores its cases. Picture a class's test results. You can keep one card per student with all their scores on it — an **array of structs** (AoS). Or you can keep one sheet per subject with every student's score in a column — a **struct of arrays** (SoA). To find the class average in maths, the sheets win: one sheet, read top to bottom. To write one student's report, the cards win.

::: example Sweeping one field over two million cases
```cpp
#include <chrono>
#include <cstdio>
#include <vector>

// One Monte Carlo case: 8 doubles = 64 bytes = exactly one cache line.
struct Case {
  double mass, cd, wind_n, wind_e, isp_scale, thrust_scale, ignition_delay, result;
};

// Struct of arrays: one contiguous array per field.
struct CasesSoA {
  std::vector<double> mass, cd, wind_n, wind_e, isp_scale, thrust_scale, ignition_delay, result;
  explicit CasesSoA(std::size_t n)
      : mass(n, 1.0), cd(n, 1.0), wind_n(n, 1.0), wind_e(n, 1.0),
        isp_scale(n, 1.0), thrust_scale(n, 1.0), ignition_delay(n, 1.0), result(n, 1.0) {}
};

template <typename F>
double time_ms(F&& f, int reps) {
  const auto t0 = std::chrono::steady_clock::now();
  for (int r = 0; r < reps; ++r) f();
  const auto t1 = std::chrono::steady_clock::now();
  return std::chrono::duration<double, std::milli>(t1 - t0).count() / reps;
}

int main() {
  const std::size_t n = 2'000'000;
  std::vector<Case> aos(n, Case{1, 1, 1, 1, 1, 1, 1, 1});   // array of structs
  CasesSoA soa(n);
  volatile double sink = 0.0;   // keeps the optimiser from deleting the sums

  // Sweep ONE field over every case: what a post-processor does.
  const double aos_one = time_ms([&] {
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) s += aos[i].mass;      // stride 64 bytes
    sink = s;
  }, 20);
  const double soa_one = time_ms([&] {
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) s += soa.mass[i];      // stride 8 bytes
    sink = s;
  }, 20);

  // Touch EVERY field of each case: what the simulation itself does.
  const double aos_all = time_ms([&] {
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
      const Case& c = aos[i];
      s += c.mass * c.cd + c.wind_n - c.wind_e + c.isp_scale * c.thrust_scale
           + c.ignition_delay + c.result;
    }
    sink = s;
  }, 20);
  const double soa_all = time_ms([&] {
    double s = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
      s += soa.mass[i] * soa.cd[i] + soa.wind_n[i] - soa.wind_e[i]
           + soa.isp_scale[i] * soa.thrust_scale[i] + soa.ignition_delay[i] + soa.result[i];
    }
    sink = s;
  }, 20);

  std::printf("one field summed:   AoS %.2f ms   SoA %.2f ms   ratio %.1fx\n", aos_one, soa_one, aos_one / soa_one);
  std::printf("all fields touched: AoS %.2f ms   SoA %.2f ms   ratio %.1fx\n", aos_all, soa_all, aos_all / soa_all);
  std::printf("sizeof(Case) = %zu bytes, sum check %.0f\n", sizeof(Case), static_cast<double>(sink));
  return 0;
}
// Output on the machine this lesson was checked on (g++ -O2; your times will differ):
// one field summed:   AoS 5.03 ms   SoA 1.47 ms   ratio 3.4x
// all fields touched: AoS 9.87 ms   SoA 5.72 ms   ratio 1.7x
// sizeof(Case) = 64 bytes, sum check 8000000
```

Each `Case` is exactly one cache line, so summing `mass` in the AoS layout fetches 2 million lines — 128 MB — to use 8 bytes of each. The SoA loop reads one 16 MB array and uses every byte: over three times faster here.

It can go faster still. Neighbouring `double`s let the compiler **[[vectorise|vectorise]]** — add several numbers with one instruction. For a floating-point *sum* it needs your permission, because a different order rounds differently. With `-O2 -ffast-math`, which grants it, the SoA sum took about 0.9 ms and the ratio rose to about six.

When the loop touches every field of each case — the simulation rather than the statistics — the gap narrows, because now AoS uses its whole line too; on other machines the two are close to even. The access pattern decides, and a Monte Carlo post-processor sweeps one field at a time.
:::

::: key
Struct-of-arrays for a Monte Carlo. Sweeping one field over many cases touches contiguous memory, so every cache line is fully used and the loop can vectorise (a floating-point sum only if the compiler may reorder it, e.g. -ffast-math). Array-of-structs strides over unused fields and wastes most of each line.
:::

For the flight loop itself: small data, laid out contiguously — a state vector in a `std::array` or an Eigen fixed-size type, tables in flat arrays, no pointer chasing, a working set that fits in L1 and L2. A `std::map` lookup in a control loop is a chain of cache misses waiting to happen.

## The hot loop

The **hot loop** is the code that runs every cycle. What it must not do follows from one test: every operation must have a **worst-case execution time** that someone can write down. Speed is not the test. A slow operation with a known bound is fine. A usually-fast operation with no bound is not.

::: key
Three things forbidden in a hard-real-time hot loop, and why: dynamic allocation (unbounded, non-deterministic latency, can fail); exceptions and unbounded recursion (unbounded stack and unwinding time); unbounded loops or blocking calls such as I/O, locks and logging (no provable worst-case execution time).
:::

A **blocking call** is one that may wait on something else: a disk, a console, or a **lock** held by another task — and a waiting loop misses its deadline, as **[[Mars Pathfinder|pathfinder]]** found on Mars.

Allocation hides. None of these looks like `new`, yet all reach the heap: `std::vector::push_back` when the vector is full, building or joining `std::string`s, a `std::function` holding a lambda too big for its built-in buffer (lesson 5), `std::make_shared`, inserting into a `std::map`, formatting through an `iostream`, and every operation on an Eigen dynamic-size type (lesson 10).

Logging is the classic trap: a `printf` to a console can block for an unbounded time. Flight code writes fixed-size records into a preallocated **[[ring buffer|ring-buffer]]** — the module's exercise — and a lower-priority task empties it.

To find hidden allocations, make allocation visible. Replacing the global `operator new` is legal C++, so a test build can count every allocation and, while the loop runs, treat one as fatal.

::: example An allocation guard for the test build
The guard lives in its own source file, linkable into any test.

```cpp
// alloc_guard.hpp
#pragma once
// Allocation guard for tests: counts every heap allocation and, while a
// HotLoopGuard is alive, treats one as a fatal fault.
extern int g_allocations;
struct HotLoopGuard {
  HotLoopGuard();
  ~HotLoopGuard();
};
```

```cpp
// alloc_guard.cpp
#include "alloc_guard.hpp"

#include <cstdio>
#include <cstdlib>
#include <new>

int g_allocations = 0;
static bool g_hot_loop = false;

// Replacing the global allocation functions makes every heap use visible.
void* operator new(std::size_t n) {
  ++g_allocations;
  if (g_hot_loop) {
    std::fputs("FATAL: heap allocation inside the hot loop\n", stderr);
    std::abort();                      // a flight build would latch a fault instead
  }
  void* p = std::malloc(n == 0 ? 1 : n);
  if (p == nullptr) std::abort();
  return p;
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

HotLoopGuard::HotLoopGuard() { g_hot_loop = true; }
HotLoopGuard::~HotLoopGuard() { g_hot_loop = false; }
```

```cpp
// noalloc_main.cpp
#include <array>
#include <cstdio>
#include <string>
#include <vector>

#include "alloc_guard.hpp"

struct State { std::array<double, 6> x{}; };

// Version 1: looks innocent, allocates every cycle.
State step_naive(const State& s, double dt) {
  std::vector<double> k(6);                       // heap
  for (int i = 0; i < 6; ++i) k[i] = -s.x[i] * 0.1;
  State out;
  for (int i = 0; i < 6; ++i) out.x[i] = s.x[i] + dt * k[i];
  std::string label = "step " + std::to_string(dt);   // heap again
  (void)label;
  return out;
}

// Version 2: the same arithmetic, no heap anywhere.
State step_fixed(const State& s, double dt) {
  std::array<double, 6> k{};
  for (int i = 0; i < 6; ++i) k[i] = -s.x[i] * 0.1;
  State out;
  for (int i = 0; i < 6; ++i) out.x[i] = s.x[i] + dt * k[i];
  return out;
}

int main(int argc, char**) {
  State s;
  s.x = {7000e3, 0, 0, 0, 7.5e3, 0};

  g_allocations = 0;
  for (int i = 0; i < 1000; ++i) s = step_naive(s, 0.01);
  std::printf("naive: %d allocations in 1000 steps\n", g_allocations);

  g_allocations = 0;
  {
    HotLoopGuard guard;                             // any allocation now aborts
    for (int i = 0; i < 1000; ++i) s = step_fixed(s, 0.01);
  }
  std::printf("fixed: %d allocations in 1000 steps\n", g_allocations);

  if (argc > 1) {                                   // run with an argument to see the guard fire
    HotLoopGuard guard;
    s = step_naive(s, 0.01);
  }
  std::printf("x[0] = %.1f\n", s.x[0]);
  return 0;
}
// $ g++ -std=c++20 -Wall -Wextra -O2 alloc_guard.cpp noalloc_main.cpp -o noalloc && ./noalloc
// naive: 1000 allocations in 1000 steps
// fixed: 0 allocations in 1000 steps
// x[0] = 946399.5
// $ ./noalloc fire
// naive: 1000 allocations in 1000 steps
// fixed: 0 allocations in 1000 steps
// FATAL: heap allocation inside the hot loop
// Aborted
```

`step_naive` allocates once per step: its `std::string` is optimised away, but the `std::vector` is enough. `step_fixed` does the same arithmetic in a `std::array` and allocates nothing — and the guard *proves* it rather than claiming it.

Sanity check: each step multiplies `x[0]` by $1 - 0.01 \times 0.1 = 0.999$, over 2000 steps, so $7 \times 10^6 \times 0.999^{2000} \approx 946\,400$.

In a GoogleTest suite (lesson 11) this becomes `EXPECT_EQ(g_allocations, 0)` around the propagator — the "custom allocator that aborts" the exercise asks for; `valgrind --tool=massif` (lesson 13) is the other way.
:::

Loops need the same discipline. Every loop in flight code has an upper bound a reader can see in the source: a fixed array size, or a `kMaxIterations` on an iterative solver with a convergence `break` inside. A loop whose count depends on data has a worst case nobody can write down. The one deliberate exception is the scheduler's outer loop, meant to run until power-off and marked as such so a checking tool can tell intent from bug.

::: key
The Power of Ten requires every loop to have a fixed upper bound because a statically provable bound makes termination checkable by a static analyser and gives a finite worst-case execution time for the real-time scheduler. A runaway loop in flight software is a missed deadline, not a slow program.
:::

Finally, measure. A loop you have *reasoned* is bounded still gets timed with `std::chrono::steady_clock`, recording the maximum and a histogram — never only the average, which hides exactly the cycles that matter.

## The Power of Ten

Holzmann's rules, as a flight C++ codebase reads them today:

::: key
The Power of Ten rules: (1) no complex control flow — no `goto`, no `setjmp`/`longjmp`, no recursion; (2) all loops have a fixed upper bound; (3) no dynamic memory allocation after initialisation; (4) functions short enough to fit one printed page, about 60 lines; (5) at least two assertions per function; (6) declare data at the smallest possible scope; (7) check the return value of every non-void function and the validity of every parameter; (8) minimal preprocessor use — includes and simple macros only; (9) restricted pointer use — one level of dereferencing, no function pointers; (10) compile with all warnings on at the most pedantic setting, with zero warnings tolerated, and run static analysers routinely.
:::

Read the ten as one argument. Rules 1 and 2 make control flow analysable by a tool. Rule 3 fixes the memory footprint. Rules 4 and 6 keep functions small enough to review completely. Rules 5 and 7 catch errors where they occur (lesson 8). Rules 8 and 9 remove the two C features that most defeat analysis tools. Rule 10 hands enforcement to the compiler and analysers — lessons 12 and 13.

Modern C++ meets the rules more comfortably than C: RAII is not dynamic allocation, templates and `constexpr` are compile-time, `std::array`, `std::span` and references replace most pointer arithmetic, and `-Werror` is rule 10 in one flag. Two frictions remain. Virtual functions are function pointers in a table, and each project decides whether rule 9 permits them at module boundaries (most do, with lesson 4's limits). And exceptions are hidden control flow that rules 1 and 7 cannot live with — one more reason they are switched off.

::: warning
"It ran fast on my laptop" is not a bound. A desktop processor has a large cache, an aggressive prefetcher and no other tasks fighting for the core; the flight processor has none of these to the same degree. Bound the loop by construction — fixed sizes, fixed iteration counts, no heap — and then confirm with timing on the target, recording the worst cycle.
:::

## Check yourself

::: check
A telemetry struct is declared as `struct T { std::uint16_t a; double b; std::uint8_t c; std::uint32_t d; };`. What is `sizeof(T)` on a 64-bit machine, where is the padding, and how would you reorder the members?
:::

::: answer
Place the members one at a time:

- `a` fills bytes 0–1. Then 6 bytes of padding, so `b` can start at 8.
- `b` fills bytes 8–15.
- `c` takes byte 16. Then 3 bytes of padding, so `d` starts at a multiple of 4, which is 20.
- `d` fills bytes 20–23.

That is 24 bytes, already a multiple of the largest alignment (8), so no tail padding: `sizeof(T) == 24` for 15 bytes of data.

Reordered largest first — `double b; std::uint32_t d; std::uint16_t a; std::uint8_t c;` — the members fill bytes 0–14 with one byte of tail padding, and `sizeof` is 16.
:::

::: check
A Monte Carlo has two phases: propagating each case through a full trajectory, and computing the mean and standard deviation of every output field across all cases. Which layout suits each phase, and why?
:::

::: answer
Propagation touches every field of one case together, many times, before moving on. An array-of-structs layout keeps each case's fields on one or two cache lines, so it is the natural fit.

The statistics sweep one field across all cases. A struct-of-arrays layout makes each sweep a contiguous read that uses every byte of every line and can vectorise — the measured factor of three to six.

If both matter, convert once, at the boundary.
:::

::: check
Which of these allocate on the heap: copying a `std::array` of six doubles; `push_back` on a `std::vector` whose `size()` equals its `capacity()`; `std::make_unique`; constructing a `std::span` over a `std::array`; adding two Eigen `Vector3d`; adding two Eigen `VectorXd`?
:::

::: answer
Allocate:

- `push_back` at capacity — a new, bigger block, then every element moved into it.
- `std::make_unique` — allocating is its whole purpose.
- adding two `VectorXd` — a dynamic-size Eigen result needs heap storage.

Do not allocate:

- copying a `std::array` — its elements are inline, so the copy is 48 bytes on the stack;
- constructing a `std::span` — it is only a pointer and a length;
- adding two `Vector3d` — fixed-size Eigen types live on the stack.

The first three belong in initialisation only.
:::

::: check
An iterative Kepler solver loops "until the correction is below tolerance". Why does the Power of Ten reject that loop as written, and how do you fix it without giving up the convergence test?
:::

::: answer
The number of iterations depends on the data — on how stretched the orbit is and how good the first guess was. No reader or analysis tool can prove a bound, and a bad input could spin for the rest of the cycle: a missed deadline, not merely a slow answer.

Fix it with a fixed upper bound and the convergence test inside:
`for (int i = 0; i < kMaxIterations; ++i) { ...; if (std::abs(delta) < tol) break; }`.
Record a fault if the loop runs out of iterations instead of converging. The worst case is now `kMaxIterations` iterations, a number timing analysis can use.
:::

::: check
Name four of the Power of Ten rules, and for two of them say how the toolchain rather than a reviewer enforces them in a modern C++ build.
:::

::: answer
Any four of: no recursion or `goto`; fixed loop bounds; no allocation after initialisation; functions of about 60 lines; two assertions per function; smallest scope for data; check every return value; minimal preprocessor; restricted pointers; all warnings on and zero tolerated.

Tool enforcement, for example:

- Rule 10 is `-Wall -Wextra -Werror` plus clang-tidy and cppcheck in continuous integration (lesson 13), so any warning fails the build.
- Rule 7 is `[[nodiscard]]` on every status-returning function, which with `-Werror` makes an unchecked return a compile error.
- Rule 3 can be enforced in tests by the allocation guard, which fails any test that allocates inside the loop.
:::

## Summary

| Item | Meaning |
| --- | --- |
| automatic / static / dynamic storage | stack (free, scoped) / whole-program (laid out in the binary) / heap (unbounded time, can fail) |
| `alignof`, padding | members aligned to their type; padding fills gaps; order members largest-first |
| `static_assert(sizeof(T) == N)` | pins a wire layout so that a later edit cannot change it silently |
| cache line | 64 bytes, the unit of memory transfer; L1 about 1 ns, main memory about 100 ns |
| sequential vs strided access | prefetched and fully used vs one fetch per element; about 10 times slower here |
| AoS vs SoA | array of structs for whole-case work; struct of arrays for sweeping one field |
| forbidden in the hot loop | allocation, exceptions and unbounded recursion, unbounded loops and blocking calls |
| hidden allocators | `vector` growth, `string`, `std::function`, `make_shared`, `map` insert, iostreams, dynamic Eigen |
| allocation guard | replaced global `operator new` that counts, and aborts while a `HotLoopGuard` is armed |
| bounded loops | fixed upper bound in the source; convergence tests break out early; scheduler loop is the marked exception |
| Power of Ten | Holzmann's ten rules; rules 2, 3, 7 and 10 are the ones this lesson enforced |

The next lesson turns to Eigen, the linear-algebra library flight GNC is written with. Its fixed-size types are exactly the stack-resident, allocation-free objects this lesson asked for — and its expression templates hide one trap you must know.

::: context stack-plates A stack of plates
The stack works like a pile of plates in a cafeteria: you only ever add to the top or take from the top. When a function starts, its local variables are a new plate on top; when it returns, that plate comes off. The processor keeps one register, the stack pointer, marking the top, so "allocating" is moving that marker. Because the pile has a fixed height, very deep recursion or a huge local array overflows it — and on a small flight processor that can overwrite whatever memory sits next to it.
:::

::: context heap-fragmentation Plenty of room, but not in one piece
After many allocations and frees of different sizes, the heap's free space is scattered in small gaps between blocks still in use. The total free space may be large, yet no single gap is big enough for the next request, so it fails. Over a long mission this can happen even though the program never leaks a byte.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="320" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="30" width="50" height="34" fill="#6c7a93"/>
  <rect x="100" y="30" width="60" height="34" fill="#6c7a93"/>
  <rect x="180" y="30" width="40" height="34" fill="#6c7a93"/>
  <rect x="250" y="30" width="70" height="34" fill="#6c7a93"/>
  <text x="85" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="170" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="235" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="330" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">grey = in use · white = free</text>
  <rect x="20" y="84" width="60" height="22" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="50" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">need 60</text>
  <text x="95" y="99" font-size="11" fill="#b4232c">free 100 in total, largest gap 30: request fails</text>
</svg>
```
:::

::: context alignment-why Why processors want aligned data
Memory is wired to deliver data in fixed-size chunks that start at round addresses. An 8-byte `double` at address 16 arrives in one chunk. The same `double` at address 13 straddles two chunks, so the processor must fetch both and stitch the pieces together — slower on a desktop, and on some flight processors not allowed at all: the read triggers a hardware fault. Alignment rules exist so the compiler never puts you in that position.
:::

::: context memory-hierarchy How much slower is "far away"?
Drawn to the same scale, one read from main memory takes about as long as a hundred reads from L1. The exact numbers vary by processor; the shape does not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="32" font-size="12" fill="#1f2a44">L1</text>
  <rect x="50" y="22" width="3" height="14" fill="#1d6fd1"/>
  <text x="60" y="33" font-size="11" fill="#1f2a44">about 1 ns</text>
  <text x="10" y="62" font-size="12" fill="#1f2a44">L2</text>
  <rect x="50" y="52" width="12" height="14" fill="#1d6fd1"/>
  <text x="68" y="63" font-size="11" fill="#1f2a44">about 4 ns</text>
  <text x="10" y="92" font-size="12" fill="#1f2a44">L3</text>
  <rect x="50" y="82" width="45" height="14" fill="#8fb8f0"/>
  <text x="101" y="93" font-size="11" fill="#1f2a44">about 15 ns</text>
  <text x="10" y="122" font-size="12" fill="#1f2a44">RAM</text>
  <rect x="50" y="112" width="300" height="14" fill="#b4232c"/>
  <text x="200" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">about 100 ns (bar lengths to scale)</text>
</svg>
```
:::

::: context prefetcher The hardware that reads ahead
A prefetcher is a small circuit in the processor that watches the addresses being read. When it spots a pattern — line 100, line 101, line 102 — it starts fetching line 103 and beyond before the program asks. For a steady walk through an array, data is often already waiting in cache when the program needs it. It cannot guess a linked list, where the next address is only known after the current node has arrived.
:::

::: context row-major Rows laid end to end
Memory is one long line of bytes, so a grid has to be flattened. Row-major order, used by C++ arrays and NumPy by default, lays row 0 down first, then row 1 after it. Walking along a row steps through neighbouring addresses. Walking down a column jumps a whole row's length each step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="40" y="20" width="40" height="30"/><rect x="80" y="20" width="40" height="30"/><rect x="120" y="20" width="40" height="30"/><rect x="160" y="20" width="40" height="30"/>
    <rect x="40" y="50" width="40" height="30"/><rect x="80" y="50" width="40" height="30"/><rect x="120" y="50" width="40" height="30"/><rect x="160" y="50" width="40" height="30"/>
    <rect x="40" y="80" width="40" height="30"/><rect x="80" y="80" width="40" height="30"/><rect x="120" y="80" width="40" height="30"/><rect x="160" y="80" width="40" height="30"/>
    <rect x="40" y="110" width="40" height="30"/><rect x="80" y="110" width="40" height="30"/><rect x="120" y="110" width="40" height="30"/><rect x="160" y="110" width="40" height="30"/>
  </g>
  <line x1="48" y1="35" x2="186" y2="35" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="194,35 184,30 184,40" fill="#1d6fd1"/>
  <line x1="60" y1="58" x2="60" y2="128" stroke="#b4232c" stroke-width="3"/>
  <polygon points="60,136 55,126 65,126" fill="#b4232c"/>
  <text x="215" y="40" font-size="12" fill="#1d6fd1">along a row:</text>
  <text x="215" y="55" font-size="12" fill="#1d6fd1">next address</text>
  <text x="215" y="100" font-size="12" fill="#b4232c">down a column:</text>
  <text x="215" y="115" font-size="12" fill="#b4232c">jump a whole row</text>
</svg>
```
:::

::: context monte-carlo Thousands of flights on a computer
A Monte Carlo analysis runs the same simulation thousands of times, each with slightly different inputs drawn at random: a bit more wind, a slightly weaker engine, a late ignition. Afterwards engineers look at the spread of results — how many landings missed the pad, and by how much. It is named after the casino in Monaco, because it runs on chance. GNC teams use it to show a design works not only on the perfect day but across everything the real day might bring.
:::

::: context vectorise One instruction, several numbers
Modern processors have wide registers that hold two, four or eight numbers side by side, and a single instruction adds all of them at once. This is called SIMD — single instruction, multiple data. The compiler can use it when the numbers sit next to each other in memory. For a sum it must also reorder the additions into several running totals, and since floating-point rounding depends on order, it will only do that when you allow it, with a flag such as `-ffast-math` or a hint in the code.
:::

::: context pathfinder The Mars lander that kept rebooting
In July 1997, days after landing on Mars, NASA's Pathfinder lander began resetting itself. A low-priority weather task held a lock on a shared data bus. A high-priority bus task waited for that lock, while medium-priority tasks kept running and starved the weather task, so the lock was never released in time. A watchdog saw the high-priority task miss its deadline and reset the computer. Engineers reproduced it on Earth and uploaded a fix that turned on priority inheritance for that lock.
:::

::: context ring-buffer A buffer that goes round in a circle
A ring buffer is a fixed array used as if its ends were joined. New records are written at the "head", which moves forward and wraps back to slot 0 after the last slot. When the buffer is full, the newest record overwrites the oldest. No memory is ever allocated, and adding one record is a write and an index step, always the same cost. You will build one, `RingBuffer<T, N>`, in this module's exercise.
:::
