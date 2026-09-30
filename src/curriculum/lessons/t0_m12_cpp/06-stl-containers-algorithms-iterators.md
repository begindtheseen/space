---
id: l06-stl-containers-algorithms-iterators
title: The STL: containers, algorithms and iterators
minutes: 25
covers:
  - the STL: containers, algorithms, iterators
---

Look around a kitchen. An egg carton has exactly twelve slots, no more, no fewer. A recipe card tells you to "look at the first two eggs" without owning any eggs itself. A drawer of containers can grow, but when one fills up you have to fetch a bigger one and move everything across. Each way of holding things has its own strengths, and its own way of going wrong.

The C++ standard library — still called the **STL**, the Standard Template Library — hands you the same choices. It has three parts that fit together:

- **containers**, which own and hold items (the carton, the drawer);
- **algorithms**, which do something to a run of items — sort, search, add up (the verbs);
- **iterators**, which point at items and connect the two, so any algorithm works on any container (your finger moving along the carton).

You met the Python versions already: `list` and `dict`, `sorted` and `sum`. Everything in the STL is a template (lesson 5), so a `std::vector` of `double` compiles to the same code you would write by hand.

The big difference from Python: in C++, each container is also a *memory decision*. Some keep their items right inside themselves. Some keep them on the **[[heap|heap-word]]**, the pool of memory handed out while the program runs. In a flight control loop, where lesson 9 forbids heap allocation outright, choosing a container is choosing whether the loop can allocate. So the containers split sharply into ones allowed in the loop and ones used only at start-up. The algorithms have no such split: `std::sort` or `std::lower_bound` on a fixed-size array do a bounded amount of work and allocate nothing. A thrust curve, a gain schedule, an atmosphere table — each is a sorted array and a search, and the STL has the search.

## Containers, and where their memory lives

| Container | Python analog | Where the items live | Hot-loop status |
| --- | --- | --- | --- |
| `std::array` | fixed-length tuple | inline, size in the type | allowed |
| `std::span` | slice or memoryview | nowhere — a view of someone else's | allowed |
| `std::vector` | `list` | heap, side by side, grows by reallocation | only if sized at start-up and never grown |
| `std::string` | `str` | heap (short strings inline) | start-up only |
| `std::map` | sorted `dict` | heap, one node per entry, $O(\log n)$ lookup | start-up only |
| `std::unordered_map` | `dict` | heap, hash buckets plus nodes | start-up only |
| `std::deque`, `std::list` | `collections.deque` | heap, chunks or nodes | rarely used at all |

The $O(\log n)$ is read "order log n". It means the lookup time grows like the logarithm of the number of entries: doubling the table adds only one more step.

### std::array and std::span

**`std::array`** is the egg carton. It is a fixed-size array that also behaves like a container: it has `.size()`, `.data()`, `.begin()`, works with range-for, and copies all its items when you copy it. It has two ways to reach an item:

- `a[i]` — fast and **unchecked**: a wrong `i` reads whatever memory is there;
- `a.at(i)` — **checked**: a wrong `i` throws the error `std::out_of_range`.

Its size is a template parameter, so `std::array<double, 6>` is $6 \times 8 = 48$ bytes of storage and nothing else. No pointer, no stored length, no heap. It is the natural type for a state vector, a row of a matrix, or a window of recent samples.

**`std::span`** (new in C++20) is the recipe card that says "look at those eggs". It is a **view**: a pointer plus a length, 16 bytes, referring to items that something else owns. A function taking a `std::span` of `const double` accepts a `std::array`, a `std::vector`, a plain C array, or **[[part of any of them|span-picture]]** — without copying, and without being a template. It replaces the old C habit of passing a pointer and a count as two separate arguments that could disagree. And it carries the same rule as a reference: the span must not outlive the storage it looks at.

::: example One function for every side-by-side container
```cpp laptop
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

Check two lines. The array's mean is $(9.78 + 9.81 + 9.83 + 9.80)/4 = 39.22/4 = 9.805$. The first two alone give $(9.78 + 9.81)/2 = 9.795$.

The sizes tell the memory story. The array is $4 \times 8 = 32$ bytes: its items, nothing more. The vector is a 24-byte **handle** (a pointer and two counts) whose items live elsewhere, on the heap. The span is 16 bytes: a pointer and a length.

**`std::accumulate`**, from the `<numeric>` header, adds up a range starting from a first value. The *type* of that first value decides the arithmetic, so the `0.0` matters. With `0`, the sum would be done in whole numbers and the decimals thrown away.

The `try`/`catch` at the end is the C++ exception mechanism, shown once so you recognize it. Lesson 8 explains why flight code is built with exceptions turned off. Then `.at()` out of range stops the program instead. In the loop, you check the index yourself and use `[]`.
:::

### std::vector and how it grows

**`std::vector`** is the Python `list`: a growable run of items stored side by side. `push_back` adds an item at the end. Two numbers describe it:

- `size()` — how many items it holds;
- `capacity()` — how many its current block of heap memory has room for.

When `push_back` finds the block full, the vector gets a new block — usually twice as big — moves every item across, and frees the old one. This is **reallocation**. Averaged over many pushes, the cost per item stays constant; engineers say **[[amortised|amortised-growth]]** constant time. But any single `push_back` may cost a heap allocation and a full copy. And afterwards every pointer, reference and iterator into the old block points at freed memory. It is **dangling**.

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

`v.data()` is the address of the first item. Whenever it changes, the whole block has moved.

Count the cost. Twenty pushes caused six allocations. Each move copied every item already there: $1 + 2 + 4 + 8 + 16 = 31$ items copied in all. Any reference taken before a "buffer moved" line is invalid after it.

`reserve(1000)` asks for room for 1000 items in one allocation, up front. The thousand pushes that follow allocate nothing, and the block never moves. That is the pattern for simulation and tool code: size the vector once, at start-up, then treat it as fixed. In the control loop itself, use a fixed-capacity container — `std::array`, or lesson 5's `StaticVector` — so there is no growth to think about.
:::

::: warning Growing a vector while you walk it
Anything that can reallocate a `std::vector` — `push_back`, `insert`, `resize` past capacity — invalidates every reference, pointer and iterator into it. So `for (auto& x : v) { if (cond(x)) v.push_back(x); }` is undefined behavior the moment a push reallocates: the loop's iterators now point into freed memory. Collect the additions in a second container, or `reserve` enough room first.
:::

## Iterators

An **iterator** is a bookmark that knows how to move. It points at one item. `*it` (read "star it") reaches the item it points at, to read or change it. `++it` moves it to the next item.

Every container has two special iterators:

- `begin()` points at the first item;
- `end()` points *one past* the last item — the empty spot after the carton's last slot.

So a run of items goes from `begin` up to *but not including* `end`. Mathematicians write this $[\text{begin}, \text{end})$: the square bracket means "included", the round one "not included". It is called a **[[half-open range|half-open]]**. It makes two things neat: an empty container is one where `begin() == end()`, and `end() - begin()` is the size.

The range-for loop you already use is shorthand for exactly this:

```cpp
#include <array>
#include <iostream>
#include <iterator>

int main() {
  std::array<int, 5> ids{4, 8, 15, 16, 23};
  for (auto it = ids.begin(); it != ids.end(); ++it) {   // what range-for expands to
    std::cout << *it << " ";
  }
  std::cout << "\n";
  auto third = ids.begin() + 2;                            // random access: jump two ahead
  std::cout << *third << "\n";                             // 15
  std::cout << std::distance(ids.begin(), third) << "\n";  // 2
  std::cout << *(ids.end() - 1) << "\n";                   // 23: never dereference end() itself
  std::cout << ids.end() - ids.begin() << "\n";            // 5, the size
  return 0;
}
// Output:
// 4 8 15 16 23
// 15
// 2
// 23
// 5
```

Iterators come in kinds, by what they can do.

- **Random access** iterators — for `std::array` and `std::vector` — can jump: add a number to one, or subtract two of them.
- **Bidirectional** iterators — for `std::map` and `std::list` — can only step, `++` forward or `--` back. "The tenth item" is ten steps.

Each algorithm says which kind it needs. `std::sort` needs random access; `std::find` works with anything. The compiler enforces it. And the dangling rule from the warning above applies to iterators too: a vector reallocation or an `erase` invalidates them, while inserting into a `std::map` does not.

## Algorithms

The `<algorithm>` and `<numeric>` headers hold the loops you would otherwise write by hand. Each takes a range as a pair of iterators — or, in the C++20 `std::ranges` versions, the container itself — and, where needed, a small function, usually a lambda. A function that answers yes or no, like "is this reading bad?", is called a **predicate**. Learning the names is worth an afternoon, because each one turns a hand-written loop into a plain statement of intent that a reviewer can check at a glance.

- **Searching**: `std::find`, `std::find_if`, `std::count_if`, `std::all_of`, `std::any_of`, `std::none_of`. On a *sorted* range, `std::lower_bound` and `std::upper_bound` do a **[[binary search|binary-search]]** in $O(\log n)$.
- **Ordering**: `std::sort` (an **[[introsort|introsort]]**, $O(n \log n)$ even in the worst case), `std::stable_sort`, `std::is_sorted`, `std::min_element`, `std::max_element`, `std::clamp`.
- **Transforming**: `std::transform`, `std::copy`, `std::fill`, `std::iota`, `std::reverse`.
- **Reducing** (many items down to one number): `std::accumulate`, `std::inner_product`, `std::partial_sum`.

::: example A thrust curve with lower_bound
Guidance needs engine thrust at any moment, from a table of a few time-and-thrust points. Between points, you draw a straight line — **linear interpolation**.

The table is sorted by time. `std::lower_bound` finds the first point whose time is *not less than* the query time, in $O(\log N)$ steps. The point before it is the other end of the straight line.

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
                        [](const ThrustPoint& a, const ThrustPoint& b) { return a.t_s < b.t_s; }));
  if (t <= table.front().t_s) return table.front().thrust_kN;
  if (t >= table.back().t_s) return table.back().thrust_kN;
  // First point whose time is not less than t.
  const auto hi = std::lower_bound(table.begin(), table.end(), t,
                                   [](const ThrustPoint& p, double time) { return p.t_s < time; });
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

Check $t = 1.0\,\mathrm{s}$ by hand. The points on either side are $(0.5, 760)$ and $(2.0, 845)$. The fraction of the way across is $(1.0 - 0.5)/(2.0 - 0.5) = 0.5/1.5 = 1/3$. The thrust rises by $845 - 760 = 85$ over that gap, so the answer is $760 + 85/3 = 760 + 28.33 = 788.33\,\mathrm{kN}$. It sits between 760 and 845, a third of the way up, as it should.

Check $t = 155\,\mathrm{s}$ too: the points are $(150, 720)$ and $(162, 0)$, the fraction is $5/12$, and $720 - 720 \times 5/12 = 720 - 300 = 420\,\mathrm{kN}$.

Three details. The comparison lambda passed to `lower_bound` takes the *table item first* and the *query second*, and must match the order the table is sorted in. The `assert` on `std::is_sorted` states that requirement where a reader can see it. And the two `if` lines at the top handle times outside the table, so the code never reaches for a point that does not exist. With six points a binary search is no faster than looking at each in turn; with a 200-row atmosphere table, it is what makes a lookup every cycle affordable.
:::

::: example Voting between redundant altimeters
Five altimeters report the altitude, and one of them is wildly wrong. Flight software must not trust any single one. The plan, one algorithm per step: convert feet to meters, find the median, count and find the outliers, check the readings are believable, and average the good ones.

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
                 [](double ft) { return ft * 0.3048; });

  std::array<double, 5> sorted = alt_m;
  std::sort(sorted.begin(), sorted.end());
  const double median = sorted[2];

  const int outliers = static_cast<int>(std::count_if(alt_m.begin(), alt_m.end(),
      [median](double a) { return std::abs(a - median) > 50.0; }));

  const auto worst = std::max_element(alt_m.begin(), alt_m.end(),
      [median](double a, double b) { return std::abs(a - median) < std::abs(b - median); });

  const bool all_plausible = std::all_of(alt_m.begin(), alt_m.end(),
      [](double a) { return a > 0.0 && a < 50000.0; });

  const double mean_good = std::accumulate(alt_m.begin(), alt_m.end(), 0.0,
      [median](double acc, double a) { return std::abs(a - median) > 50.0 ? acc : acc + a; })
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

Walk through it.

- **`std::transform`** writes `f(x)` for each item of one range into another. Here $f$ multiplies by $0.3048$, the number of **[[meters in a foot|foot-definition]]**.
- **`std::sort`** runs on a *copy*, so the original order survives and the index of the bad sensor still means something. The middle of five sorted readings, `sorted[2]`, is the **median**: $32\,802\,\mathrm{ft} \times 0.3048 = 9998.05\,\mathrm{m}$. One wild value cannot drag a median far, which is why **[[voting|redundancy]]** uses it.
- **`std::count_if`** counts readings more than $50\,\mathrm{m}$ from the median: one.
- **`std::max_element`** with a custom comparison finds the reading farthest from the median: $45\,000 \times 0.3048 = 13\,716\,\mathrm{m}$, at index 3.
- **`std::all_of`** asks whether every reading lies between 0 and $50\,000\,\mathrm{m}$. Even the bad one does, so this check alone would not have caught it.
- **`std::accumulate`** in its four-argument form folds a lambda across the range, adding only the good readings. Their mean is $(32\,810 + 32\,795 + 32\,802 + 32\,799)/4 \times 0.3048 = 32\,801.5 \times 0.3048 = 9997.9\,\mathrm{m}$ — within a meter of the median, as it should be.

Every one of these loops runs exactly five times, a bound fixed at compile time. That is what the hot-loop rules in lesson 9 ask for.
:::

::: warning remove does not remove
`std::remove` and `std::remove_if` erase nothing. They slide the items you keep to the front and return an iterator to the new "logical" end, leaving the container's size unchanged: on `{1, -2, 3, -4, 5}` with "is negative", the size is still 5, with 3 items kept at the front. The classic fix is one statement, `v.erase(std::remove_if(v.begin(), v.end(), pred), v.end());`. C++20 adds `std::erase_if(v, pred)`, which does what its name says.
:::

## What the control loop may use

Put the lesson together as a rule of thumb for a hard-real-time loop.

- **Use freely**: `std::array`, `std::span`, `std::string_view` (a span for text), fixed-capacity containers of your own, and any algorithm on a range whose size is fixed.
- **Start-up only**: `std::vector` (sized with `reserve` or `resize` once, then never grown), `std::string`, `std::map`, `std::unordered_map`. After start-up, read them; never insert, erase or push.
- **Never in the loop**: `.at()` (it throws, or stops the program when exceptions are off), any `push_back` that could pass capacity, building any `std::string`, and any lookup in a map keyed by a string.

Where Python would reach for a `dict` keyed by sensor name, C++ flight code indexes a `std::array` with an `enum class`. Lookup takes constant time, with no hashing, no heap, and keys the compiler checks:

```cpp
#include <array>
#include <cstddef>
#include <iostream>

enum class Gyro : std::size_t { X, Y, Z, Count };

int main() {
  std::array<double, static_cast<std::size_t>(Gyro::Count)> rate_rad_s{};
  auto at = [&](Gyro g) -> double& { return rate_rad_s[static_cast<std::size_t>(g)]; };
  at(Gyro::X) = 0.012;
  at(Gyro::Z) = -0.003;
  std::cout << "x " << at(Gyro::X) << ", y " << at(Gyro::Y) << ", z " << at(Gyro::Z) << "\n";
  return 0;
}
// Output:
// x 0.012, y 0, z -0.003
```

The last name in the enum, `Count`, is a trick: its value is the number of real entries (here 3), so the array's size updates itself when a name is added.

::: key Containers are memory decisions
Every STL container is a memory decision. `std::array` stores its elements inline with the size in the type; `std::span` views contiguous elements it does not own; `std::vector` owns a heap block and reallocates when it grows, invalidating all references into it. Fixed-size containers and views may appear in a control loop; growable and node-based containers are sized at initialization and never modified afterwards.
:::

::: key Algorithms and ranges
Algorithms take a half-open iterator range $[\text{begin}, \text{end})$ and, where needed, a lambda. `std::lower_bound` on a sorted range is the $O(\log n)$ table lookup; `std::transform`, `std::count_if`, `std::all_of`, `std::max_element` and `std::accumulate` replace hand-written loops with statements a reviewer can check at a glance.
:::

## Check yourself

::: check
A colleague proposes `std::vector` for the six-number vehicle state because "it is only a list". Give two reasons a six-element `std::array` is the right type: one about memory and one about correctness.
:::

::: answer
**Memory.** A `std::array` of six doubles is $6 \times 8 = 48$ bytes stored inline, with no heap allocation. A state can live on the stack, inside another object, or in a fixed buffer, and copying it copies 48 bytes. A `std::vector` is a 24-byte handle plus a separate heap block, and creating or copying one allocates.

**Correctness.** The size six is part of the array's type. Passing a five-element state to a function that expects six is a compile error. Two vectors of different lengths are the same type, so the mismatch shows up at run time, if at all.
:::

::: check
This loop is undefined behavior: `for (const auto& s : samples) { if (s > threshold) samples.push_back(s * 2.0); }`, where `samples` is a `std::vector`. Explain exactly when it goes wrong.
:::

::: answer
Range-for takes `samples.begin()` and `samples.end()` once, before the loop starts.

The first `push_back` that finds the vector full allocates a new block, moves the items into it and frees the old block. The loop's iterators, and the reference `s`, still point into the freed block. The next step reads freed memory, and compares against a stale `end`.

It may *seem* to work whenever there happens to be spare capacity, which is what makes it dangerous. Collect the doubled values in a second container, or `reserve` enough room before the loop so no reallocation can happen.
:::

::: check
Why does `mean` take a `std::span` of `const double` rather than a `const` reference to a `std::vector` of `double`? Name two callers from the example that the span version accepts and the vector version rejects.
:::

::: answer
A reference to a `std::vector` accepts only a vector. The span version accepts any run of doubles stored side by side, without copying: a `std::array`, a C array, part of a bigger buffer such as `std::span(fixed).first(2)`, or a vector. It also tells the reader that `mean` only reads — a span cannot grow or shrink what it views.

The two callers that the vector version would reject are the `std::array` named `fixed` and the C array named `raw`.
:::

::: check
An empty vector receives 1000 `push_back` calls, with the doubling growth seen in the example. How many reallocations happen, and about how many item moves in total? How do you bring that down to one allocation?
:::

::: answer
The capacities go $1, 2, 4, \ldots, 512, 1024$. That is 11 allocations: the first for capacity 1, then ten doublings ($2^{10} = 1024$ is the first power of two that holds 1000).

Each reallocation moves every item already there, so the moves total $1 + 2 + 4 + \cdots + 512 = 1023$. That is about one extra move per item — the "amortised constant" cost.

One `reserve(1000)` before the loop makes it one allocation and zero moves. It also keeps every reference into the vector valid the whole time, because the block never changes.
:::

::: check
For a table sorted by time, what does `std::lower_bound(begin, end, t, comp)` return? What must `comp` compare? What happens if the table is not sorted?
:::

::: answer
It returns an iterator to the first item for which `comp(item, t)` is false — the first item *not less than* `t` — or `end` if there is none.

`comp` must take the table item first and the query value second, and it must match the table's sort order: here, "item time less than query time".

On an unsorted table, the binary search's assumption is broken and the answer is arbitrary. Not an error, not a crash — a wrong answer. That is why the example asserts `std::is_sorted` as a precondition.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `std::array<T, N>` | fixed size in the type, inline storage, `[]` unchecked, `.at()` checked |
| `std::span` | pointer plus length, 16 bytes, non-owning view of any side-by-side storage |
| `std::vector` | heap block, `size()` vs `capacity()`, doubling growth, `reserve()` once at start-up |
| reallocation | invalidates every reference, pointer and iterator into the vector |
| `std::map` / `std::unordered_map` | node-based, allocate per entry; start-up only |
| iterator | a movable bookmark; `begin()` to `end()` is half-open; `end()` is never dereferenced |
| random access vs bidirectional | array and vector iterators can jump; map and list iterators only step |
| `std::lower_bound` | first item not less than the query in a sorted range; $O(\log n)$ |
| `std::transform`, `std::count_if`, `std::all_of`, `std::max_element`, `std::accumulate` | the loops you no longer write by hand |
| `std::clamp(x, lo, hi)` | saturate a command |
| erase-remove | `std::remove_if` does not shrink; pair it with `erase`, or use `std::erase_if` |
| `enum class` index | a fixed array indexed by names: the flight-code replacement for a `dict` |

The next lesson moves the computing itself to compile time: `constexpr` tables, units checked by the compiler, and a fixed-point number type whose scale is part of its type.

::: context heap-word Stack and heap
A running program has two main places to keep data. The **stack** holds each function's local variables; space is taken when the function starts and given back the instant it returns, in strict order, at almost no cost. The **heap** is a big shared pool: the program asks for a block of any size at any moment and must hand it back later. Asking takes an unpredictable amount of time, and can even fail when the pool runs low or gets chopped into small pieces. That unpredictability is why flight loops never touch it.
:::

::: context span-picture A window onto someone else's eggs
`std::span(fixed).first(2)` is a pointer to the array's first item and a length of 2. It owns nothing and copies nothing. If the array goes away, the span points at nothing — so a span must never outlive what it looks at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="30" y="18" font-size="11" fill="#1f2a44">std::array&lt;double, 4&gt; fixed (owns the items)</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="26" width="70" height="32" fill="#8fb8f0"/><rect x="100" y="26" width="70" height="32" fill="#8fb8f0"/>
    <rect x="170" y="26" width="70" height="32" fill="#fff"/><rect x="240" y="26" width="70" height="32" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="47">9.78</text><text x="135" y="47">9.81</text><text x="205" y="47">9.83</text><text x="275" y="47">9.80</text>
  </g>
  <rect x="30" y="86" width="140" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="105" font-size="11" fill="#1f2a44" text-anchor="middle">span: pointer, length 2</text>
  <line x1="50" y1="86" x2="50" y2="66" stroke="#b4232c" stroke-width="2"/>
  <polygon points="50,60 46,69 54,69" fill="#b4232c"/>
  <text x="185" y="105" font-size="11" fill="#6c7a93">16 bytes, owns nothing</text>
</svg>
```
:::

::: context amortised-growth Why doubling is cheap on average
"Amortised" is a banker's word: spreading a big cost over many small payments. Each reallocation is expensive, but they get rarer as the vector grows, because each one doubles the room. Pushing 20 items cost 6 allocations and 31 copies — less than two copies per item. The red dots below mark the pushes that moved the whole block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="150" x2="20" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20,146 H36 V142 H52 V134 H84 V118 H148 V86 H276 V22 H340" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="20" y1="150" x2="340" y2="70" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g fill="#b4232c">
    <circle cx="20" cy="146" r="3.5"/><circle cx="36" cy="142" r="3.5"/><circle cx="52" cy="134" r="3.5"/>
    <circle cx="84" cy="118" r="3.5"/><circle cx="148" cy="86" r="3.5"/><circle cx="276" cy="22" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="4" y="26">32</text><text x="4" y="90">16</text><text x="10" y="122">8</text>
    <text x="180" y="80" fill="#1d6fd1">capacity</text><text x="250" y="104" fill="#6c7a93">size</text>
    <text x="20" y="166">0</text><text x="176" y="166">10</text><text x="334" y="166">20</text>
    <text x="140" y="182">number of push_back calls</text>
  </g>
</svg>
```
:::

::: context half-open Why "one past the end"
A half-open range $[\text{begin}, \text{end})$ includes its start and stops right before its end. The computer scientist Edsger Dijkstra argued for this style in a short 1982 note: the length is end minus begin, an empty range has begin equal to end, and two ranges placed side by side share a boundary without overlapping. The `end()` iterator marks a spot, not an item.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="20" y="30" width="56" height="32"/><rect x="76" y="30" width="56" height="32"/>
    <rect x="132" y="30" width="56" height="32"/><rect x="188" y="30" width="56" height="32"/>
    <rect x="244" y="30" width="56" height="32"/>
  </g>
  <rect x="300" y="30" width="44" height="32" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="51">4</text><text x="104" y="51">8</text><text x="160" y="51">15</text>
    <text x="216" y="51">16</text><text x="272" y="51">23</text>
  </g>
  <line x1="48" y1="90" x2="48" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="48,64 44,73 52,73" fill="#1d6fd1"/>
  <text x="48" y="106" font-size="12" fill="#1d6fd1" text-anchor="middle">begin()</text>
  <line x1="322" y1="90" x2="322" y2="68" stroke="#b4232c" stroke-width="2"/>
  <polygon points="322,64 318,73 326,73" fill="#b4232c"/>
  <text x="322" y="106" font-size="12" fill="#b4232c" text-anchor="middle">end()</text>
  <text x="182" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">5 items: end() − begin() = 5</text>
</svg>
```
:::

::: context binary-search Halving the table each step
A binary search is how you find a word in a paper dictionary: open at the middle, see whether your word comes before or after, throw away the wrong half, repeat. Each look halves what is left. A 200-row table needs at most 8 looks, because $2^7 = 128$ is too few and $2^8 = 256$ is enough. A row-by-row scan could need all 200. It only works if the table is sorted — which is why the example checks that first.
:::

::: context introsort Three sorts in one
`std::sort` in the common libraries is an introsort, short for "introspective sort", published by David Musser in 1997. It starts with quicksort, which is usually the fastest, but keeps count of how deep its splitting goes. If a nasty input makes quicksort go too deep — the case where quicksort slows to $n^2$ — it switches to heapsort, which is never worse than $n \log n$. For the last few items it uses insertion sort, which wins on tiny ranges. The result is fast on average and never slow.
:::

::: context foot-definition An exact conversion
One foot is exactly $0.3048\,\mathrm{m}$. That is not a measurement but a definition, agreed in 1959 by the United States, the United Kingdom and other countries, which is why the code can write the number with no rounding. Aircraft and many launch-vehicle ground systems in the United States still report altitude in feet, so conversions like this sit at the edge of plenty of flight software — and a missed one is a classic source of bugs.
:::

::: context redundancy Why flight computers vote
A single sensor can fail in a way that looks perfectly normal: a stuck value, a slow drift, a wild jump. So vehicles carry several and compare them. The Space Shuttle flew four primary flight computers that ran the same software and voted on every command, with a fifth running separately written backup software. Voting by median is popular because one bad member, however wild, cannot pull the median far. With five sensors, even two bad ones cannot move it outside the range of the good ones.
:::
