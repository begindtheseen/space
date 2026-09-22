---
id: l09-memory-cache-hot-loops
title: Memory layout, the cache, and allocation-free hot loops
minutes: 27
covers:
  - memory layout, cache behaviour, allocation-free hot loops
---

A control loop has one job that matters more than any other: finish on time, every cycle, for the whole flight. Two things break that promise in ways that no amount of algorithmic cleverness repairs. The first is touching the heap — an allocation whose duration nobody can bound. The second is touching memory the processor's cache does not hold, which turns a one-nanosecond load into a hundred-nanosecond stall, and does it thousands of times when the data layout is wrong. This lesson is about both: where C++ objects live, how they are laid out in bytes, how the cache sees them, and the rules a flight codebase imposes so that the loop's worst case is a number rather than a hope.

The rules have a name. In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory distilled JPL's flight-software experience into ten rules that fit on four pages, *The Power of Ten*. They were written for C, they are the backbone of most C++ flight coding standards since, and several of them are precisely about memory: no allocation after initialisation, every loop bounded, no more than one level of pointer indirection. You will read all ten here, and you will meet them in interviews.

The Python module never asked these questions, because Python answers them for you — badly, from a real-time point of view. Every object on the heap, every list resizable, every attribute a hash lookup: convenient, and the reason a Python control loop cannot promise anything about its worst cycle.

## Where objects live

C++ gives an object one of three storage durations, and each has a cost model.

**Automatic storage** is the stack. A local variable exists from its declaration to the end of its scope; allocating it is a subtraction from the stack pointer and freeing it is the reverse, both free in practice, both perfectly predictable. The limit is the stack's size — a flight task typically has a few tens of kilobytes — so large arrays and any recursion are the risks, and a stack overflow is not an error you can catch.

**Static storage** is memory that exists for the whole program: globals, `static` locals, `constinit` variables. It is laid out in the binary before the program starts, costs nothing to "allocate", and is where flight software puts everything it wants to exist forever — the telemetry ring buffer, the sensor drivers, the state of the estimator.

**Dynamic storage** is the heap, reached through `new` and `malloc`. The allocator has to find a free block of a suitable size, possibly split one, possibly coalesce neighbours when freeing, possibly take a lock because another thread is allocating too, possibly ask the operating system for more pages. None of these has a bounded duration; the allocation can fail; and over a long mission the heap fragments, so that a request that succeeded on day one fails on day ninety. This is why Power of Ten rule 3 reads *no dynamic memory allocation after initialisation*. Flight code allocates during start-up, where time is plentiful and failure can abort the boot, and then never again.

## Layout: alignment and padding

Every type has an alignment, `alignof(T)`, and an object must sit at an address that is a multiple of it: a `double` at a multiple of 8, a `std::uint16_t` at a multiple of 2, a `std::uint8_t` anywhere. A struct's members are placed in declaration order, and the compiler inserts *padding* between them so that each is aligned, then pads the tail so that `sizeof` is a multiple of the largest member alignment — otherwise the second element of an array of the struct would be misaligned.

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

Eleven bytes of data cost 24 in one order and 16 in the other. The rule of thumb is to declare members from the largest alignment to the smallest. The `static_assert` lines pin the layout so that a later edit cannot silently change a telemetry format, and `std::is_trivially_copyable` confirms that the struct may be copied byte for byte with `memcpy` onto a wire. Lesson 7's `Packet` that came to 24 bytes instead of 14 was this effect.
:::

::: warning
Compiler-specific `#pragma pack` and `[[gnu::packed]]` remove padding by permitting misaligned members. A misaligned load is undefined behaviour in standard C++, faults outright on some flight processors, and is slow on the ones that tolerate it. For a wire format, keep the struct aligned and serialise the fields explicitly, or `memcpy` each field out of the byte buffer.
:::

## The cache

The processor does not read memory a byte at a time. It reads *cache lines* of 64 bytes into a hierarchy of small fast memories: a level-one cache of a few tens of kilobytes that answers in about a nanosecond, a level-two of a few hundred kilobytes at three or four nanoseconds, a shared level-three of several megabytes at ten to twenty, and finally main memory at sixty to a hundred nanoseconds. A load that misses every level costs roughly a hundred times a load that hits the first. The hierarchy also *prefetches*: when it sees consecutive lines being read, it fetches the next ones before they are asked for, so a sequential sweep through memory runs near the speed of the fastest cache no matter how large the data.

Two consequences follow. Reading one `double` out of every line and skipping the rest wastes seven-eighths of every fetch and defeats the prefetcher. And any data structure that follows pointers — a linked list, a `std::map`, an array of pointers to objects scattered on the heap — pays a potential miss at every hop.

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
// Output on the machine this lesson was written on (g++ -O2):
// row-major sweep 22.9 ms, column sweep 213.9 ms, ratio 9.3x (same 16777216 additions, sum 16777216)
```

Both loops perform 16.8 million additions on the same numbers. The row-major sweep reads consecutive addresses: every fetched line contributes eight doubles and the prefetcher stays ahead. The column walk jumps 32 KiB between consecutive reads, so every single addition fetches a fresh line, uses eight of its 64 bytes, and gets no help from the prefetcher. The ratio of about ten is the cost of ignoring layout. `volatile double sink` exists so that the optimiser cannot discard a sum it can see is never used.
:::

### Array of structs or struct of arrays

The same effect decides how a Monte Carlo stores its cases. An *array of structs* keeps all the fields of one case together; a *struct of arrays* keeps one field of all cases together. Which is faster depends entirely on the access pattern.

::: example Sweeping one field over two million cases
```cpp
// One Monte Carlo case: 8 doubles = 64 bytes = exactly one cache line.
struct Case {
  double mass, cd, wind_n, wind_e, isp_scale, thrust_scale, ignition_delay, result;
};

// Array of structs: cases[i].mass, cases[i].cd, ...
struct CasesAoS { std::vector<Case> cases; };

// Struct of arrays: one contiguous array per field.
struct CasesSoA {
  std::vector<double> mass, cd, wind_n, wind_e, isp_scale, thrust_scale, ignition_delay, result;
};

// Sweep one field over every case: the statistic a Monte Carlo post-processor computes.
//   for (int i = 0; i < n; ++i) s += aos.cases[i].mass;   // stride 64 bytes: 1 useful double per line
//   for (int i = 0; i < n; ++i) s += soa.mass[i];         // stride 8 bytes: 8 useful doubles per line
// Touch every field of each case: the per-case simulation itself.
//   ... c.mass * c.cd + c.wind_n - c.wind_e + ... over aos.cases[i], and the same over soa.*[i]

// Output on the machine this lesson was written on (g++ -O2, 2 000 000 cases):
// 2000000 cases, one field summed:   AoS 10.02 ms   SoA 1.44 ms   ratio 6.9x
// 2000000 cases, all fields touched: AoS 20.43 ms   SoA 9.53 ms   ratio 2.1x
// sizeof(Case) = 64 bytes = one 64-byte cache line
```

Summing the mass over every case is seven times faster in the struct-of-arrays layout. Each `Case` is exactly one cache line, so the array-of-structs loop fetches a full line to use eight bytes of it, while the struct-of-arrays loop uses all 64 bytes of every line and, because consecutive `double`s are consecutive in memory, the compiler vectorises the sum. When the loop touches every field of a case — the simulation itself rather than the statistics — the gap narrows, because the array-of-structs layout now uses its whole line too; the residual factor here comes from the eight separate streams prefetching well, and on other machines the two layouts are close to even in that pattern. The choice is made by the access pattern, and a Monte Carlo post-processor sweeps one field at a time.
:::

::: key
Struct-of-arrays for a Monte Carlo. Sweeping one field over many cases touches contiguous memory, so every cache line is fully used and the loop vectorises. Array-of-structs strides over unused fields and wastes most of each line.
:::

For the flight loop the lesson is smaller data, laid out contiguously: a state vector in a `std::array` or an Eigen fixed-size type, gains and tables in flat arrays, no pointer chasing, a working set that fits in the first two cache levels. A `std::map` lookup in a control loop is a chain of dependent cache misses waiting to happen.

## The hot loop

The set of things a hard-real-time loop must not do follows from one criterion: every operation must have a worst-case execution time that someone can write down. Speed is not the criterion; a slow operation with a known bound is acceptable, a usually-fast operation with no bound is not.

::: key
Three things forbidden in a hard-real-time hot loop, and why: dynamic allocation (unbounded, non-deterministic latency, can fail); exceptions and unbounded recursion (unbounded stack and unwinding time); unbounded loops or blocking calls such as I/O, locks and logging (no provable worst-case execution time).
:::

Allocation hides. `std::vector::push_back` at capacity, `std::string` construction or concatenation, a `std::function` holding a lambda larger than its buffer (lesson 5), `std::make_shared`, an insertion into a `std::map`, formatting through an `iostream`, and every operation on an Eigen dynamic-size type (lesson 10) all reach the heap, and none of them looks like `new`. Logging is the classic trap: a `printf` to a console or a write to a file blocks for an unbounded time, so flight code writes fixed-size records into a preallocated ring buffer — the module's exercise — and a lower-priority task drains it.

You find hidden allocations by making allocation visible. Replacing the global `operator new` is legal C++, and a test build that does so can count every allocation and, while the loop is running, treat one as fatal.

::: example An allocation guard for the test build
The guard lives in its own translation unit so that it can be linked into any test binary.

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

`step_naive` allocates once per step even though its `std::string` is optimised away — the six-element `std::vector` is enough. `step_fixed` does the same arithmetic in a `std::array` and allocates nothing, which the guard proves rather than asserts. In a GoogleTest suite (lesson 11) the count becomes an `EXPECT_EQ(g_allocations, 0)` around the propagator, which is the "custom allocator that aborts" the exercise asks for; `valgrind --tool=massif` in lesson 13 is the other way to demonstrate it.
:::

Loops need the same discipline as allocations. Every loop in the flight code has an upper bound a reader can see in the source — a fixed array size, a `kMaxIterations` on an iterative solver with a convergence `break` inside it — because a loop whose iteration count depends on data is a loop whose worst case nobody can write down. The one deliberate exception is the scheduler's outer loop, which is meant to run until power-off and is marked as such so that a checking tool can tell intent from bug.

::: key
The Power of Ten requires every loop to have a fixed upper bound because a statically provable bound makes termination checkable by a static analyser and gives a finite worst-case execution time for the real-time scheduler. A runaway loop in flight software is a missed deadline, not a slow program.
:::

Finally, measure. A loop that has been *reasoned* bounded still gets timed, with `std::chrono::steady_clock` around each cycle, recording the maximum and a histogram rather than the mean — a control loop is judged by its worst cycle, and an average hides exactly the cycles that matter.

## The Power of Ten

Holzmann's rules, as a flight C++ codebase reads them today:

::: key
The Power of Ten rules: (1) no complex control flow — no `goto`, no `setjmp`/`longjmp`, no recursion; (2) all loops have a fixed upper bound; (3) no dynamic memory allocation after initialisation; (4) functions short enough to fit one printed page, about 60 lines; (5) at least two assertions per function; (6) declare data at the smallest possible scope; (7) check the return value of every non-void function and the validity of every parameter; (8) minimal preprocessor use — includes and simple macros only; (9) restricted pointer use — one level of dereferencing, no function pointers; (10) compile with all warnings on at the most pedantic setting, with zero warnings tolerated, and run static analysers routinely.
:::

Read the ten as an engineering argument rather than a list. Rules 1 and 2 make the control flow of every function analysable by a tool. Rule 3 makes the memory footprint fixed. Rules 4 and 6 keep every function small enough to review completely. Rules 5 and 7 catch the errors that do occur, at the point they occur, as lesson 8 described. Rules 8 and 9 remove the two features of C that most defeat static analysis. Rule 10 hands the enforcement of everything else to the compiler and the analysers, which is where lessons 12 and 13 go.

Modern C++ meets the rules more comfortably than C did. RAII is not dynamic allocation; templates and `constexpr` are compile-time and analysable; `std::array`, `std::span` and references replace most pointer arithmetic; `-Werror` is rule 10 in one flag. Two points of friction remain. Virtual functions are function pointers in a table, and projects decide individually whether rule 9 permits them at module boundaries (most do, with the restrictions lesson 4 described). And exceptions are hidden control flow that rules 1 and 7 cannot accommodate, which is one more reason they are switched off.

::: warning
"It ran fast on my laptop" is not a bound. A desktop processor has a large cache, an aggressive prefetcher and no other tasks contending for the core; the flight processor has none of these to the same degree. Bound the loop by construction — fixed sizes, fixed iteration counts, no heap — and then confirm with timing on the target, recording the worst cycle.
:::

## Check yourself

::: check
A telemetry struct is declared as `struct T { std::uint16_t a; double b; std::uint8_t c; std::uint32_t d; };`. What is `sizeof(T)` on a 64-bit machine, where is the padding, and how would you reorder the members?
:::

::: answer
`a` occupies bytes 0–1, then 6 bytes of padding so that `b` can start at offset 8; `b` occupies 8–15; `c` takes byte 16, then 3 bytes of padding so `d` is 4-aligned at 20; `d` occupies 20–23. That is 24 bytes, a multiple of the largest alignment (8), so no tail padding: `sizeof(T) == 24` for 15 bytes of data. Reordered largest-first — `double b; std::uint32_t d; std::uint16_t a; std::uint8_t c;` — the members occupy bytes 0–14 with one byte of tail padding, and `sizeof` is 16.
:::

::: check
A Monte Carlo has two phases: propagating each case through a full trajectory, and computing the mean and standard deviation of every output field across all cases. Which layout suits each phase, and why?
:::

::: answer
The propagation touches every field of one case together, many times, before moving to the next case, so an array-of-structs layout keeps each case's fields on one or two cache lines and is the natural fit. The statistics sweep one field across all cases, so a struct-of-arrays layout makes each sweep a contiguous read that uses every byte of every line and vectorises — the measured factor of about seven. Many codebases store the results in struct-of-arrays form precisely because the post-processing dominates; when both phases matter, convert between layouts once, at the boundary, rather than paying the wrong layout in one of them.
:::

::: check
Which of these allocate on the heap: copying a `std::array` of six doubles; `push_back` on a `std::vector` whose `size()` equals its `capacity()`; `std::make_unique`; constructing a `std::span` over a `std::array`; adding two Eigen `Vector3d`; adding two Eigen `VectorXd`?
:::

::: answer
`push_back` at capacity allocates (a new block, then a move of every element). `std::make_unique` allocates — that is its purpose. Adding two `VectorXd` allocates, because a dynamic-size Eigen result needs heap storage. Copying a `std::array` does not: its elements are inline and the copy is 48 bytes on the stack. Constructing a `std::span` does not: it is a pointer and a length. Adding two `Vector3d` does not: fixed-size Eigen types live on the stack. The first three are initialisation-only operations in flight code; the last three are fine in the loop.
:::

::: check
An iterative Kepler solver loops "until the correction is below tolerance". Why does the Power of Ten reject that loop as written, and how do you fix it without giving up the convergence test?
:::

::: answer
The iteration count depends on the data — on how eccentric the orbit is and how good the initial guess was — so there is no bound a reader or a static analyser can prove, and a pathological input could spin for the rest of the cycle: a missed deadline, not merely a slow answer. Fix it with a fixed upper bound and the convergence test inside: `for (int i = 0; i < kMaxIterations; ++i) { ...; if (std::abs(delta) < tol) break; }`, and record a fault if the loop exits by exhausting `kMaxIterations` rather than by converging. The worst case is now `kMaxIterations` iterations, a number the timing analysis can use.
:::

::: check
Name four of the Power of Ten rules, and for two of them say how the toolchain rather than a reviewer enforces them in a modern C++ build.
:::

::: answer
Any four of: no recursion or `goto`; fixed loop bounds; no allocation after initialisation; functions of about 60 lines; two assertions per function; smallest scope for data; check every return value; minimal preprocessor; restricted pointers; all warnings on and zero tolerated. Enforcement examples: rule 10 is `-Wall -Wextra -Werror` plus clang-tidy and cppcheck in continuous integration (lesson 13), so a warning fails the build; rule 7 is `[[nodiscard]]` on every status-returning function, which with `-Werror` makes an unchecked return a compile error; rule 3 can be enforced in tests by the allocation guard, which fails a test that allocates inside the loop.
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

The next lesson turns to Eigen, the linear-algebra library flight GNC is written with, whose fixed-size types are exactly the stack-resident, allocation-free objects this lesson asked for — and whose expression templates have one trap you must know.
