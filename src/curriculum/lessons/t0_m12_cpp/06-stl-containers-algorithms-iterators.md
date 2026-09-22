---
id: l06-stl-containers-algorithms-iterators
title: The STL: containers, algorithms and iterators
minutes: 24
covers:
  - the STL: containers, algorithms, iterators
---

Python hands you `list`, `dict` and `set`, the builtins `sorted`, `min` and `sum`, and `itertools` for the rest. The C++ standard library — still called the STL, for Standard Template Library, after the design it grew from — hands you the same three things under different names: *containers* that own elements, *algorithms* that operate on ranges of elements, and *iterators* that connect the two so that any algorithm works on any container. Everything is a template, so a `std::vector` of `double` and a `std::vector` of `Waypoint` are each compiled to exactly the code you would write by hand.

The difference from Python is that each container is also a memory decision. `std::array` lives inline wherever you put it. `std::vector` lives on the heap and grows by allocating a bigger block and moving everything across. `std::unordered_map` allocates a node for every entry. In a flight control loop, where lesson 9 will forbid heap allocation outright, choosing a container is choosing whether the loop can allocate — so the STL's containers divide sharply into the ones allowed in the loop and the ones used only at initialisation.

The algorithms carry no such division. `std::sort`, `std::lower_bound` or `std::accumulate` over a fixed-size range do a bounded amount of work and allocate nothing, and they replace hand-written loops that are easy to get subtly wrong. A guidance gain schedule, a thrust curve, an atmosphere table: each is a sorted array and a binary search, and the STL has the binary search.

## Containers, and where their memory lives

| Container | Python analogue | Where the elements live | Hot-loop status |
| --- | --- | --- | --- |
| `std::array` | fixed-length tuple | inline, size in the type | allowed |
| `std::span` | slice or memoryview | nowhere — a view of someone else's | allowed |
| `std::vector` | `list` | heap, contiguous, grows by reallocation | only if sized at initialisation and never grown |
| `std::string` | `str` | heap (small strings inline) | initialisation only |
| `std::map` | sorted `dict` | heap, one node per entry, $O(\log n)$ lookup | initialisation only |
| `std::unordered_map` | `dict` | heap, hash buckets plus nodes | initialisation only |
| `std::deque`, `std::list` | `collections.deque` | heap, chunks or nodes | rarely used at all |

### std::array and std::span

`std::array` is a fixed-size array with the interface of a container: `.size()`, `.data()`, `.begin()`, range-for, value semantics (copying copies the elements), and two ways to index — `[]`, which is unchecked, and `.at()`, which checks the bound and throws `std::out_of_range`. Its size is a template parameter, so `std::array<double, 6>` is 48 bytes of storage and nothing else: no pointer, no length field, no heap. It is the natural type for a state vector, a covariance row or a sample window.

`std::span` (C++20) is a *view*: a pointer and a length, 16 bytes, referring to contiguous elements owned by something else. A function taking a `std::span` of `const double` accepts a `std::array`, a `std::vector`, a C array or part of any of them, without copying and without being a template. It replaces the C habit of passing a pointer and a count as two parameters that can disagree, and it carries the same lifetime rule as a reference: the span must not outlive the storage it views.

::: example One function, every contiguous container
```cpp
#include <array>
#include <iostream>
#include <numeric>
#include <span>
#include <vector>

// One function accepts any contiguous sequence of doubles without copying it.
double mean(std::span<const double> samples) {
  if (samples.empty()) return 0.0;
  const double sum = std::accumulate(samples.begin(), samples.end(), 0.0);
  return sum / static_cast<double>(samples.size());
}

int main() {
  std::array<double, 4> fixed{9.78, 9.81, 9.83, 9.80};     // stack, size in the type
  std::vector<double> dynamic{1.0, 2.0, 3.0};               // heap, size at run time
  double raw[3] = {4.0, 5.0, 6.0};                          // C array

  std::cout << "mean(array)  = " << mean(fixed) << "\n";
  std::cout << "mean(vector) = " << mean(dynamic) << "\n";
  std::cout << "mean(raw)    = " << mean(raw) << "\n";
  std::cout << "mean(first two of array) = " << mean(std::span(fixed).first(2)) << "\n";

  std::cout << "sizeof(fixed)   = " << sizeof(fixed) << "\n";
  std::cout << "sizeof(dynamic) = " << sizeof(dynamic) << "  (the handle; data on the heap)\n";
  std::cout << "sizeof(span)    = " << sizeof(std::span<const double>) << "\n";
  std::cout << "fixed.at(7): ";
  try { std::cout << fixed.at(7); } catch (const std::out_of_range& e) { std::cout << "out_of_range\n"; }
  return 0;
}
// Output:
// mean(array)  = 9.805
// mean(vector) = 2
// mean(raw)    = 5
// mean(first two of array) = 9.795
// sizeof(fixed)   = 32
// sizeof(dynamic) = 24  (the handle; data on the heap)
// sizeof(span)    = 16
// fixed.at(7): out_of_range
```

`std::accumulate`, from the `numeric` header, sums a range starting from an initial value — and the initial value's type decides the arithmetic, so `0.0` matters: with `0` the sum would be performed in `int`. The `try`/`catch` at the end is the C++ exception mechanism, shown once so that you recognise it; lesson 8 explains why flight code compiles with exceptions disabled, in which case `.at()` out of range terminates the program instead. In the loop you index with `[]` after checking the bound yourself.
:::

### std::vector and how it grows

`std::vector` is the Python `list`: a contiguous, growable sequence. `push_back` appends; `size()` is the element count and `capacity()` the number of elements the current heap block can hold. When a `push_back` finds the block full, the vector allocates a new block — typically twice the size — moves every element across, and frees the old one. Amortised over many pushes that is constant time per element, but an individual `push_back` may cost an allocation and a full copy, and after it every pointer, reference and iterator into the old block is dangling.

::: example Watching a vector reallocate
```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<double> v;
  const double* previous = nullptr;
  int reallocations = 0;
  for (int i = 0; i < 20; ++i) {
    v.push_back(1.0 * i);
    if (v.data() != previous) {
      ++reallocations;
      std::cout << "size " << v.size() << " capacity " << v.capacity() << " -> buffer moved\n";
      previous = v.data();
    }
  }
  std::cout << reallocations << " reallocations for 20 pushes\n";

  std::vector<double> w;
  w.reserve(1000);                 // one allocation, at initialisation
  const double* start = w.data();
  for (int i = 0; i < 1000; ++i) w.push_back(1.0 * i);
  std::cout << "reserved: buffer " << (w.data() == start ? "unchanged" : "moved")
            << ", capacity " << w.capacity() << "\n";
  return 0;
}
// Output:
// size 1 capacity 1 -> buffer moved
// size 2 capacity 2 -> buffer moved
// size 3 capacity 4 -> buffer moved
// size 5 capacity 8 -> buffer moved
// size 9 capacity 16 -> buffer moved
// size 17 capacity 32 -> buffer moved
// 6 reallocations for 20 pushes
// reserved: buffer unchanged, capacity 1000
```

Twenty pushes cost six allocations and the copying of $1 + 2 + 4 + 8 + 16 = 31$ elements, and any reference taken before a "buffer moved" line is invalid after it. `reserve(1000)` performs one allocation up front, and the thousand pushes that follow allocate nothing. That is the pattern for simulation and tooling code: size the vector once, at initialisation, then treat it as fixed. In the control loop itself you use a fixed-capacity container — `std::array`, or the `StaticVector` of lesson 5 — so that there is no growth to reason about.
:::

::: warning
Any operation that can reallocate a `std::vector` — `push_back`, `insert`, `resize` beyond capacity — invalidates every reference, pointer and iterator into it. `for (auto& x : v) { if (cond(x)) v.push_back(x); }` is undefined behaviour the moment a push reallocates, because the loop's iterators now point into freed memory. Collect the additions in a second container, or `reserve` enough space first.
:::

## Iterators

An iterator is a generalised pointer: it refers to an element, `*it` reads or writes the element, and `++it` moves to the next one. Every container provides `begin()`, referring to the first element, and `end()`, referring to *one past* the last. The range is half-open, $[\text{begin}, \text{end})$, which is what makes an empty container simply one with `begin() == end()` and lets `end() - begin()` be the size. Range-for is sugar over this:

```cpp
std::array<int, 5> ids{4, 8, 15, 16, 23};
for (auto it = ids.begin(); it != ids.end(); ++it) {   // what range-for expands to
  std::cout << *it << " ";
}
auto third = ids.begin() + 2;                            // *third == 15
std::cout << std::distance(ids.begin(), third);          // 2
std::cout << *(ids.end() - 1);                           // 23: end() itself must never be dereferenced
```

Iterators come in categories by what they support. Array and vector iterators are *random access*: you may add an integer or subtract two of them. Map and list iterators are *bidirectional*: `++` and `--` only, so "the tenth element" is ten increments. Algorithms state which category they need — `std::sort` requires random access, `std::find` works with anything — and the compiler enforces it. The same invalidation rule applies to iterators as to references: a vector reallocation or an `erase` invalidates them; an insertion into a `std::map` does not.

## Algorithms

The `algorithm` and `numeric` headers hold the loops you would otherwise write by hand, each taking a range as a pair of iterators (or, in the C++20 `std::ranges` versions, the container itself) and, where it needs one, a *predicate* or *transform* — usually a lambda. Learning the names is worth an afternoon, because each one replaces a hand-written loop with a statement of intent that a reviewer can check at a glance:

- **Searching**: `std::find`, `std::find_if`, `std::count_if`, `std::all_of`, `std::any_of`, `std::none_of`; and on a *sorted* range, `std::lower_bound` and `std::upper_bound`, which binary-search in $O(\log n)$.
- **Ordering**: `std::sort` (introsort, $O(n \log n)$ worst case), `std::stable_sort`, `std::is_sorted`, `std::min_element`, `std::max_element`, `std::clamp`.
- **Transforming**: `std::transform`, `std::copy`, `std::fill`, `std::iota`, `std::reverse`.
- **Reducing**: `std::accumulate`, `std::inner_product`, `std::partial_sum`.

::: example A thrust curve with lower_bound
Guidance needs engine thrust as a function of time from a table of a few breakpoints. The table is sorted by time; `std::lower_bound` finds the first breakpoint at or after the query in $O(\log N)$, and linear interpolation between it and its predecessor gives the value.

```cpp
#include <algorithm>
#include <array>
#include <cassert>
#include <format>
#include <iostream>

struct ThrustPoint { double t_s; double thrust_kN; };

// Piecewise-linear lookup in a table sorted by time. O(log N) with std::lower_bound.
double thrust_at(const std::array<ThrustPoint, 6>& table, double t) {
  assert(std::is_sorted(table.begin(), table.end(),
                        [] (const ThrustPoint& a, const ThrustPoint& b) { return a.t_s < b.t_s; }));
  if (t <= table.front().t_s) return table.front().thrust_kN;
  if (t >= table.back().t_s) return table.back().thrust_kN;
  // First point whose time is not less than t.
  const auto hi = std::lower_bound(table.begin(), table.end(), t,
                                   [] (const ThrustPoint& p, double time) { return p.t_s < time; });
  const auto lo = hi - 1;
  const double frac = (t - lo->t_s) / (hi->t_s - lo->t_s);
  return lo->thrust_kN + frac * (hi->thrust_kN - lo->thrust_kN);
}

int main() {
  const std::array<ThrustPoint, 6> curve{{{0.0, 0.0}, {0.5, 760.0}, {2.0, 845.0},
                                          {60.0, 845.0}, {150.0, 720.0}, {162.0, 0.0}}};
  for (double t : {-1.0, 0.25, 1.0, 30.0, 155.0, 200.0}) {
    std::cout << std::format("t = {:6.2f} s  thrust = {:7.2f} kN\n", t, thrust_at(curve, t));
  }
  return 0;
}
// Output:
// t =  -1.00 s  thrust =    0.00 kN
// t =   0.25 s  thrust =  380.00 kN
// t =   1.00 s  thrust =  788.33 kN
// t =  30.00 s  thrust =  845.00 kN
// t = 155.00 s  thrust =  420.00 kN
// t = 200.00 s  thrust =    0.00 kN
```

Check one value: at $t = 1.0\,\mathrm{s}$ the bracketing points are $(0.5, 760)$ and $(2.0, 845)$, the fraction is $(1.0 - 0.5)/1.5 = 1/3$, and $760 + 85/3 = 788.33\,\mathrm{kN}$. The comparator passed to `lower_bound` takes the element first and the query second, and must agree with the ordering of the table; the `assert` on `std::is_sorted` states that precondition where a reader can see it. The clamps at the two ends handle queries outside the table without touching an element that does not exist. With six entries the binary search is no faster than a scan; with the 200-row atmosphere table it is what makes a per-cycle lookup affordable.
:::

::: example Voting redundant altimeters
Five altimeters report, one of them wildly wrong. Convert, take the median, count and locate the outliers, check plausibility, and average the survivors — each step one algorithm.

```cpp
#include <algorithm>
#include <array>
#include <cmath>
#include <iostream>
#include <numeric>

int main() {
  // Five redundant altimeter readings in feet, one of them bad.
  std::array<double, 5> alt_ft{32810.0, 32795.0, 32802.0, 45000.0, 32799.0};

  std::array<double, 5> alt_m{};
  std::transform(alt_ft.begin(), alt_ft.end(), alt_m.begin(),
                 [] (double ft) { return ft * 0.3048; });

  std::array<double, 5> sorted = alt_m;
  std::sort(sorted.begin(), sorted.end());
  const double median = sorted[2];

  const int outliers = static_cast<int>(std::count_if(alt_m.begin(), alt_m.end(),
      [median] (double a) { return std::abs(a - median) > 50.0; }));

  const auto worst = std::max_element(alt_m.begin(), alt_m.end(),
      [median] (double a, double b) { return std::abs(a - median) < std::abs(b - median); });

  const bool all_plausible = std::all_of(alt_m.begin(), alt_m.end(),
      [] (double a) { return a > 0.0 && a < 50000.0; });

  const double mean_good = std::accumulate(alt_m.begin(), alt_m.end(), 0.0,
      [median] (double acc, double a) { return std::abs(a - median) > 50.0 ? acc : acc + a; })
      / static_cast<double>(alt_m.size() - outliers);

  std::cout << "median          = " << median << " m\n";
  std::cout << "outliers        = " << outliers << "\n";
  std::cout << "worst reading   = " << *worst << " m at index " << (worst - alt_m.begin()) << "\n";
  std::cout << "all plausible?  = " << (all_plausible ? "yes" : "no") << "\n";
  std::cout << "mean of good    = " << mean_good << " m\n";
  std::cout << "clamped command = " << std::clamp(1.7, -1.0, 1.0) << "\n";
  return 0;
}
// Output:
// median          = 9998.05 m
// outliers        = 1
// worst reading   = 13716 m at index 3
// all plausible?  = yes
// mean of good    = 9997.9 m
// clamped command = 1
```

`std::transform` writes `f(x)` for each element of one range into another; `std::sort` on a copy leaves the original order intact so that the index of the bad sensor is still meaningful; `std::max_element` with a custom comparator finds the element farthest from the median; `std::accumulate` with a four-argument form folds a lambda across the range. Every one of these loops has a bound equal to the array size, five, fixed at compile time, which is exactly what the hot-loop rules in lesson 9 ask for. The readings are $32\,802\,\mathrm{ft} \times 0.3048 = 9998.05\,\mathrm{m}$ at the median.
:::

::: warning
`std::remove` and `std::remove_if` do not erase anything: they shuffle the kept elements to the front and return an iterator to the new logical end, leaving the container's size unchanged. The classic idiom is `v.erase(std::remove_if(v.begin(), v.end(), pred), v.end());` in one statement; C++20 adds `std::erase_if(v, pred)`, which does what the name says.
:::

## What the control loop may use

Put the lesson together as a rule of thumb for a hard-real-time loop:

- **Use freely**: `std::array`, `std::span`, `std::string_view`, fixed-capacity containers of your own, and any algorithm applied to a range whose size is fixed.
- **Initialisation only**: `std::vector` (sized with `reserve` or `resize` once, then never grown), `std::string`, `std::map`, `std::unordered_map`. After initialisation, read them; never insert, erase or push.
- **Never in the loop**: `.at()` (it throws, or terminates when exceptions are off), any `push_back` that could exceed capacity, any construction of a `std::string`, any lookup in a map keyed by string. Where Python would reach for a `dict` keyed by sensor name, C++ flight code indexes a `std::array` by an `enum class`: constant time, no hashing, no heap, and the compiler checks the keys.

::: key
Every STL container is a memory decision. `std::array` stores its elements inline with the size in the type; `std::span` views contiguous elements it does not own; `std::vector` owns a heap block and reallocates when it grows, invalidating all references into it. Fixed-size containers and views may appear in a control loop; growable and node-based containers are sized at initialisation and never modified afterwards.
:::

::: key
Algorithms take a half-open iterator range $[\text{begin}, \text{end})$ and, where needed, a lambda. `std::lower_bound` on a sorted range is the $O(\log n)$ table lookup; `std::transform`, `std::count_if`, `std::all_of`, `std::max_element` and `std::accumulate` replace hand-written loops with statements a reviewer can check at a glance.
:::

## Check yourself

::: check
A colleague proposes `std::vector` for the six-element vehicle state because "it is just a list". Give two reasons `std::array` with six elements is the right type, one about memory and one about correctness.
:::

::: answer
Memory: a `std::array` of six doubles is 48 bytes of inline storage with no heap allocation, so a state can live on the stack, inside another object, or in a fixed-size buffer, and copying it copies 48 bytes; a `std::vector` is a 24-byte handle plus a separately allocated block, and constructing or copying one allocates. Correctness: the size six is part of the type, so passing a five-element state to a function expecting six is a compile error, whereas two vectors of different lengths are the same type and the mismatch surfaces at run time, if at all.
:::

::: check
This loop is undefined behaviour. Explain exactly when it goes wrong: `for (const auto& s : samples) { if (s > threshold) samples.push_back(s * 2.0); }` where `samples` is a `std::vector`.
:::

::: answer
Range-for takes `samples.begin()` and `samples.end()` once, before the loop. The first `push_back` that finds the vector at capacity allocates a new block, moves the elements into it and frees the old one; the loop's iterators, and the reference `s`, still point into the freed block. The next iteration reads freed memory, and the comparison with `end()` uses a stale end. It may appear to work when capacity happens to be available, which is what makes it dangerous. Collect the doubled values into a second container, or `reserve` enough capacity before the loop so that no reallocation can occur.
:::

::: check
Why does `mean` take a `std::span` of `const double` rather than a `const` reference to a `std::vector` of `double`? Name two callers that the span version accepts and the vector version rejects.
:::

::: answer
A `std::vector` reference accepts only a vector. The span version accepts any contiguous sequence of doubles without copying: a `std::array`, a C array, part of a larger buffer (`std::span(fixed).first(2)`), or a vector. It also documents that `mean` reads and does not resize — a span cannot grow. The two callers from the example that the vector version rejects are the `std::array` `fixed` and the C array `raw`.
:::

::: check
A vector starts empty and receives 1000 `push_back` calls with the doubling growth seen in the example. How many reallocations occur, and roughly how many element moves in total? How do you reduce the count to one?
:::

::: answer
Capacities go 1, 2, 4, …, 1024, so there are 11 allocations (the first for capacity 1, then ten doublings). Each reallocation moves every existing element, so the total is $1 + 2 + 4 + \dots + 512 = 1023$ moves, about one extra move per element — the "amortised constant" cost. A single `reserve(1000)` before the loop makes it one allocation and zero moves, and it also keeps every reference into the vector valid throughout, because the block never changes.
:::

::: check
For a table sorted by time, what does `std::lower_bound(begin, end, t, comp)` return, what must `comp` compare, and what happens if the table is not sorted?
:::

::: answer
It returns an iterator to the first element for which `comp(element, t)` is false — the first element not less than `t` — or `end` if there is none. `comp` must take the element first and the query value second, and it must induce the same ordering as the table's sort, here "element time less than query time". On an unsorted table the binary search's assumption fails and the result is arbitrary — not an error, not a crash, a wrong answer — which is why the example asserts `std::is_sorted` as a precondition.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `std::array<T, N>` | fixed size in the type, inline storage, `[]` unchecked, `.at()` checked |
| `std::span` | pointer plus length, 16 bytes, non-owning view of any contiguous storage |
| `std::vector` | heap block, `size()` vs `capacity()`, doubling growth, `reserve()` once at init |
| reallocation | invalidates every reference, pointer and iterator into the vector |
| `std::map` / `std::unordered_map` | node-based, allocate per entry; initialisation only |
| iterator | generalised pointer; `begin()` to `end()` is half-open; `end()` is never dereferenced |
| random access vs bidirectional | array and vector iterators do arithmetic; map and list iterators only step |
| `std::lower_bound` | first element not less than the query in a sorted range; $O(\log n)$ |
| `std::transform`, `std::count_if`, `std::all_of`, `std::max_element`, `std::accumulate` | the loops you no longer write by hand |
| `std::clamp(x, lo, hi)` | saturate a command |
| erase-remove | `std::remove_if` does not shrink; pair it with `erase`, or use `std::erase_if` |

The next lesson moves the computation itself to compile time: `constexpr` tables, units checked by the compiler, and a fixed-point type whose scale is part of its type.
