---
id: l09-arrays-std-array-and-vector
title: Raw arrays, std::array, std::vector and range-based for
minutes: 19
covers:
  - Arrays vs std::array vs std::vector; range-based for
---

Python gives you one sequence type for almost everything. A `list` grows, holds anything, knows its length, raises `IndexError` when you go past the end, and you never think about where its storage is. C++ gives you three, with different storage, different costs and different failure modes, and choosing between them is a real engineering decision — in a 1 kHz control loop it is one a reviewer will ask you to justify.

The short version, which the rest of the lesson earns: `std::array` is the flight-code default, `std::vector` is what you use everywhere that a heap allocation is acceptable, and a raw array is what you get from C interfaces and from code written before 2011. The interesting part is *why*, and the mechanism that makes raw arrays dangerous — losing their size at a function boundary — is the same mechanism you will meet again as pointer decay in the next module.

## The raw array

```cpp
double buf[10]{};
```

Ten `double`s laid out contiguously, 80 bytes, storage allocated wherever the declaration is — on the stack here. The size is part of the type: `double[10]` is a different type from `double[9]`. There is no size stored anywhere at run time, because the compiler knows it.

`sizeof` gives the whole array's bytes, so the old idiom `sizeof(buf) / sizeof(buf[0])` recovers the count. And then you pass it to a function:

```cpp
void takes_raw(double buf[10]) {
    std::printf("  inside takes_raw:   sizeof(buf) = %zu\n", sizeof(buf));
}
```

```text
in main: sizeof(raw) = 80, count = 10
  inside takes_raw:   sizeof(buf) = 8
```

Eighty bytes became eight. The `[10]` in the parameter list is a lie the language permits: an array parameter is silently rewritten as a pointer, so `takes_raw` really takes a `double*` and `sizeof` gives the size of a pointer. This is **array-to-pointer decay**, and it means a raw array passed to a function has lost its length. The function cannot check anything, so every such interface needs a separate count parameter that the caller must get right.

g++ 13.3.0 warns, which is worth knowing because the warning names the mechanism:

```text
warning: 'sizeof' on array function parameter 'buf' will return size of 'double*' [-Wsizeof-array-argument]
    6 |     std::printf("  inside takes_raw:   sizeof(buf) = %zu\n", sizeof(buf));
      |                                                                    ~^~~~
note: declared here
    5 | void takes_raw(double buf[10]) {
      |                ~~~~~~~^~~~~~~
```

The second problem is that `buf[12]` on a ten-element array is undefined behaviour with no check of any kind. The compilers catch some cases when the index is a constant:

```cpp
double buf[10]{};
std::printf("%.1f\n", buf[12]);
```

g++ 13.3.0 at `-O2`:

```text
oob3.cpp:4:16: warning: array subscript 12 is above array bounds of 'double [10]' [-Warray-bounds=]
    4 |     std::printf("%.1f\n", buf[12]);
      |     ~~~~~~~~~~~^~~~~~~~~~~~~~~~~~~
oob3.cpp:3:12: note: while referencing 'buf'
```

clang++ 18.1.3 at `-O2`:

```text
oob3.cpp:4:27: warning: array index 12 is past the end of the array (that has type 'double[10]') [-Warray-bounds]
    4 |     std::printf("%.1f\n", buf[12]);
      |                           ^   ~~
oob3.cpp:3:5: note: array 'buf' declared here
```

::: warning
These warnings are best-effort, not a guarantee. Change the read to a *write* whose result is never used — `buf[12] = 1.0;` — and on this toolchain g++ 13.3.0 reports nothing at `-O0`, `-O1`, `-O2` or `-O3` with `-Wall -Wextra -Wpedantic`, while clang++ 18.1.3 still reports it. The optimiser removed the dead store before the bounds check ran. Never treat "it compiles clean" as evidence that indices are in range; that job belongs to AddressSanitizer and to bounds-checked accessors.
:::

## `std::array`

`std::array<T, N>` is the same storage with the size kept in the type and a container interface bolted on. It costs nothing: no heap, no pointer, no size field.

```cpp
void takes_array(const std::array<double, 10>& buf) {
    std::printf("  inside takes_array: sizeof(buf) = %zu, buf.size() = %zu\n",
                sizeof(buf), buf.size());
}
```

```text
in main: sizeof(arr) = 80, arr.size() = 10
  inside takes_array: sizeof(buf) = 80, buf.size() = 10
```

Eighty bytes in `main` and eighty bytes inside the function. `std::array` does not decay, because it is a class type and passing it by reference passes the whole type, size included. `buf.size()` works inside the function; `sizeof(buf)/sizeof(buf[0])` inside `takes_raw` would have given 1.

What you get beyond that:

- `.size()`, `.empty()`, `.front()`, `.back()`, `.data()`, `.begin()`, `.end()`.
- `.at(i)`, which checks and throws instead of running off the end.
- Copy and assignment that work: `std::array<double,10> b = a;` copies all ten elements, where `double b[10] = a;` does not compile.
- It can be returned from a function by value.

The size is a compile-time constant, so it can come from a `constexpr` expression, as lesson 07's buffer did, and `static_assert` can check the result against a budget.

## `std::vector`

`std::vector<T>` owns a heap buffer and can change size at run time. It stores three pointers — begin, end, end-of-capacity — and the elements live somewhere else.

Two numbers describe it. `size()` is how many elements there are; `capacity()` is how many fit before it must allocate a bigger buffer and move everything. Watch it grow:

```cpp
std::vector<double> az;
for (int i = 0; i < 9; ++i) {
    const double* before = az.data();
    az.push_back(-9.81);
    const double* after = az.data();
    // report size, capacity and whether the buffer moved
}
az.reserve(1000);
```

```text
start:            size=0 capacity=0
after push 1:     size=1 capacity=1  buffer moved: yes
after push 2:     size=2 capacity=2  buffer moved: yes
after push 3:     size=3 capacity=4  buffer moved: yes
after push 4:     size=4 capacity=4  buffer moved: no
after push 5:     size=5 capacity=8  buffer moved: yes
after push 6:     size=6 capacity=8  buffer moved: no
after push 7:     size=7 capacity=8  buffer moved: no
after push 8:     size=8 capacity=8  buffer moved: no
after push 9:     size=9 capacity=16  buffer moved: yes
```

The capacity doubles — 1, 2, 4, 8, 16 on this implementation; the standard requires only that `push_back` be amortised constant, not this particular sequence. Four of nine pushes allocated a new buffer, copied everything across and freed the old one. That is fine in analysis code and unacceptable in a control loop, for three separate reasons:

- **Time is not bounded.** Most pushes are a pointer increment; one in a while is an allocation and a copy of everything. A deadline you meet on average is not a deadline you meet.
- **Allocation time is not predictable.** A general-purpose allocator walks free lists whose state depends on the whole program's history.
- **The heap can fragment.** A long-running vehicle that allocates and frees varied sizes can reach a state where a request fails despite enough total free memory.

`reserve` fixes the first two if you know the maximum in advance — `capacity=1000` above, after one allocation — which is the pattern to use when a vector is genuinely the right structure.

::: warning
Any operation that reallocates invalidates every pointer, reference and iterator into the vector. This is legal and silent:

```cpp
std::vector<double> az{-9.81};
double& first = az[0];
az.push_back(-9.79);      // may reallocate
first = 0.0;              // may write to freed memory
```

The `buffer moved: yes` lines above are exactly the moments where `first` would become dangling. Built with `-fsanitize=address`, a read past the end of a vector's buffer reports:

```text
ERROR: AddressSanitizer: heap-buffer-overflow on address 0x503000000068
READ of size 8 at 0x503000000068 thread T0
```

followed by a stack trace naming the source line of the access. (Each of those lines really begins with the process id, as `==16134==`, which differs on every run; the addresses were stable across runs on this machine but are not something to rely on.) Run your tests under ASan; it is the tool that finds this class of bug.
:::

## Bounds checking when you want it

`operator[]` never checks, on any of the three. `.at(i)` checks and throws `std::out_of_range`:

```text
array::at threw: array::at: __n (which is 12) >= _Nm (which is 10)
vector::at threw: vector::_M_range_check: __n (which is 12) >= this->size() (which is 3)
```

Those messages are libstdc++'s wording, not the standard's, so do not parse them — but do notice that they tell you the index and the bound, which is most of a bug report. Use `.at()` where the index comes from outside your own code, and `operator[]` in a loop you have already proved correct.

::: example Choosing a container for three real jobs
**A fixed-size state vector.** Six `double`s, known at compile time, on a 1 kHz path.

```cpp
std::array<double, 6> x{};         // 48 bytes, on the stack, no allocation
```

`std::array`. The size never changes, there is no reason to touch the heap, and the compiler can keep the whole thing in registers for small operations.

**A sensor sample buffer with a fixed maximum.** Up to 5000 IMU samples, however many arrived this cycle.

```cpp
std::array<ImuSample, 5000> storage{};
std::size_t count = 0;             // how many of them are valid
```

`std::array` plus a count, or a small fixed-capacity container built on one. Not a vector: the maximum is known, so there is no reason to allocate, and a fixed buffer makes the worst case the only case. Lesson 13 shows how a `static_assert` keeps the capacity honest, and the next module builds exactly this container properly.

**A Monte-Carlo run's trajectory, on the ground.** Length unknown, memory plentiful, no deadline.

```cpp
std::vector<State> traj;
traj.reserve(100000);              // one allocation if the guess is good
```

`std::vector`, with `reserve` because you can estimate the size. This is where a vector belongs: analysis and offline tooling, where its flexibility is worth more than its unpredictability.

The rule a reviewer applies: if the maximum size is known, use a fixed-size container; if it is not known, ask whether it can be bounded, because an unbounded buffer on a vehicle is an unbounded memory requirement.
:::

## Range-based `for`

The loop you will write most often, and the closest thing C++ has to Python's `for x in xs:`:

```cpp
float sum = 0.0F;
for (const auto& s : buf) sum += s.az;          // alias: no copy
```

The three forms, and they are not interchangeable:

| Form | Meaning |
| --- | --- |
| `for (const auto& s : buf)` | read-only alias of each element; no copy |
| `for (auto& s : buf)` | modifiable alias of each element |
| `for (auto s : buf)` | a *copy* of each element |

```cpp
for (auto s : buf) s.az = 0.0F;                 // copies each element
// buf is unchanged

for (auto& s : buf) s.az = 0.0F;                // aliases each element
// buf is now zeroed
```

```text
mean az = -9.8100
after 'for (auto s : buf) s.az = 0': buf[0].az = -9.79
after 'for (auto& s : buf) s.az = 0': buf[0].az = 0.00
```

This is lesson 06's value-versus-reference distinction inside a loop, and it is the commonest place for a Python programmer to get it wrong, because in Python `for s in buf: s.az = 0` would modify the objects in the list. g++ catches this particular case:

```text
warning: variable 's' set but not used [-Wunused-but-set-variable]
   19 |     for (auto s : buf) s.az = 0.0F;                 // copies each element
```

but it cannot catch the version where you also read `s`, so the habit matters: **write `const auto&` by default**, and change it deliberately when you mean to copy or to modify.

When you need the index, use the ordinary loop with `std::size_t`, remembering lesson 05:

```cpp
for (std::size_t i = 0; i < buf.size(); ++i) {
    std::printf("buf[%zu].t_ms = %u\n", i, buf[i].t_ms);
}
```

```text
buf[0].t_ms = 100
buf[1].t_ms = 110
buf[2].t_ms = 120
```

::: key
`std::array` is a fixed-size aggregate with size known at compile time and no heap use, so it is the flight-code default. A raw array decays to a pointer and loses its size. `std::vector` is heap-allocated and resizable, which is exactly what you cannot have in a hard real-time path.
:::

::: example What decay costs you, in one function signature
Three ways to write "compute the mean of some accelerations":

```cpp
// 1. Raw array: the length is a separate promise the caller must keep.
float mean_az(const ImuSample* s, std::size_t n);

// 2. Fixed size in the type: the length cannot be wrong.
float mean_az(const std::array<ImuSample, 5000>& s);

// 3. A view: any contiguous range, with its length attached. C++20.
float mean_az(std::span<const ImuSample> s);
```

Signature 1 is what lesson 02's telemetry module used, and it is what C interfaces force on you. It has a defect you can see in the type: nothing connects `s` to `n`, so `mean_az(buf, 10)` on a three-element buffer compiles, links, runs, and reads seven elements of whatever follows.

Signature 2 cannot be wrong, and cannot be reused: it works for exactly one array size.

Signature 3 is the modern answer. `std::span` from `<span>` is a pointer and a length together, constructed automatically from a `std::array`, a `std::vector` or a raw array, costing two words and no allocation. One definition then serves all three:

```text
from raw array: -9.8100
from std::array: -9.8100
from std::vector: -9.8100
span size from vector = 3
``` If your project is on C++20 — this module's baseline — prefer it for every "some contiguous elements" parameter. The next module covers it properly; what matters now is recognising that signature 1's separate count is a design compromise, not the natural way to write C++.
:::

## Check yourself

::: check
`sizeof(raw)` is 80 in `main` and 8 inside `takes_raw(double buf[10])`. Explain, and say what the parameter's type actually is.
:::

::: answer
An array parameter is not an array. The language rewrites `double buf[10]` in a parameter list as `double* buf`, so the function receives a pointer and `sizeof` gives the size of a pointer — 8 bytes on this platform, as `sizeof(double*)` confirms. In `main`, `raw` is a genuine `double[10]` object and `sizeof` gives its 80 bytes. The `[10]` in the parameter list is documentation with no effect: `takes_raw` will happily accept a pointer to a single `double`. This is array-to-pointer decay, and it is why a function taking a raw array cannot validate anything about its length.
:::

::: check
A vector's `capacity()` went 1, 2, 4, 8, 16 while `size()` went 1 to 9, and the buffer moved four times. Why is that acceptable in a Monte-Carlo script and not in a 500 Hz attitude loop?
:::

::: answer
Because the cost is unevenly distributed. Most `push_back` calls are a store and an increment; the ones that reallocate call the allocator, copy or move every existing element, and free the old buffer. In a script the total time is what matters and the amortised cost is excellent. In a control loop the *worst* cycle is what matters: every cycle must finish within its period, and a cycle that happens to hit a reallocation can take orders of magnitude longer than its neighbours. On top of that the allocator's own timing depends on the heap's history, so the worst case is not even bounded by the copy. A fixed-size container removes the question; if a vector must be used, `reserve` the maximum before the loop starts so no reallocation can happen inside it.
:::

::: check
`for (auto s : samples) s.valid = false;` compiles, runs, and changes nothing. What did you mean, and what would the same code do in Python?
:::

::: answer
`auto` deduces a value type, so each iteration copies the element into `s`, sets the copy's field and throws the copy away. You meant `for (auto& s : samples)`, which makes `s` an alias for the element in the container. In Python, `for s in samples: s.valid = False` binds `s` to the object in the list and mutates it, so the list really is modified — the Python version of this loop does what the C++ version looks like it does, which is precisely why the mistake is so easy to make coming from Python. g++ happens to catch this exact case with `-Wunused-but-set-variable`, but only because `s` is never read; add a read and the warning disappears while the bug does not.
:::

::: check
Your reviewer says `float mean_az(const ImuSample* s, std::size_t n)` is a weaker interface than `float mean_az(std::span<const ImuSample> s)`. Give the argument in terms of what each signature makes impossible.
:::

::: answer
The pointer-and-count version makes nothing impossible: the two parameters are independent, so any pointer can be paired with any count, and `mean_az(buf, 10)` on a three-element buffer is a well-formed call that reads out of bounds. The correctness of every call depends on a convention the compiler cannot check. A `std::span` carries the pointer and the length as one object, constructed from the container itself, so the length is not something the caller supplies and therefore not something they can get wrong; the only way to produce a bad span is to build one deliberately from a pointer and a wrong count. It also accepts a `std::array`, a `std::vector` and a raw array without overloads. The cost is the same two words the old signature passed anyway.
:::

::: check
Both `.at(12)` calls threw, with messages naming the index and the bound. When should a flight-software function use `.at()` rather than `operator[]`, given that exceptions are often disabled in flight builds?
:::

::: answer
`.at()` earns its cost at a trust boundary: an index derived from a telemetry command, a configuration file, a table lookup keyed by a sensor value. Inside a loop whose bounds you wrote and can see, `operator[]` is right and the check is pure overhead. Where exceptions are disabled — common in flight builds, since an unbounded stack unwind is hard to reason about — `.at()` is not available as a recovery mechanism, and the equivalent is an explicit range check that returns a status or triggers the project's fault handler, with the check written *before* the access rather than after it. The principle survives the change of mechanism: validate an index where it enters your control, then index freely once it is proven.
:::

## Summary

| Container | Storage | Size known | Decays | Bounds-checked accessor | Use |
| --- | --- | --- | --- | --- | --- |
| `T arr[N]` | wherever declared | compile time, lost on passing | yes, to `T*` | none | C interfaces, legacy |
| `std::array<T,N>` | wherever declared | compile time, kept | no | `.at()` | flight-code default |
| `std::vector<T>` | heap | run time | no | `.at()` | analysis, tools, anywhere the heap is fine |
| `std::span<T>` | none — a view | run time, carried with it | no | none in C++20 | parameters that take "some contiguous elements" |

| Idiom | Meaning |
| --- | --- |
| `sizeof(a)/sizeof(a[0])` | element count, only where `a` is a real array |
| `-Wsizeof-array-argument` | g++ telling you `sizeof` is being applied to a decayed parameter |
| `size()` vs `capacity()` | elements present vs elements that fit before reallocating |
| `reserve(n)` | allocate once up front; no reallocation until `n` is exceeded |
| reallocation | invalidates every pointer, reference and iterator into the vector |
| `for (const auto& x : c)` | the default loop: alias, no copy |
| `for (auto& x : c)` | alias, modifiable |
| `for (auto x : c)` | copy each element |

Lesson 10 gives these containers something better to hold than loose `double`s: `struct` and `class`, access specifiers, `enum class` and the namespaces that keep their names apart.
