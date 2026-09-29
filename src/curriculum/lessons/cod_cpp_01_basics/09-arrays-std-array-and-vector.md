---
id: l09-arrays-std-array-and-vector
title: Raw arrays, std::array, std::vector and range-based for
minutes: 22
covers:
  - Arrays vs std::array vs std::vector; range-based for
---

Think about three ways to keep a row of things.

An **egg carton** has exactly twelve cups, molded in. You cannot add a thirteenth, and you never need to ask how many cups there are — it is printed on the box. A **bookshelf** is different: when it fills up, you buy a bigger one and move every book across, and in the meantime anyone who wrote down "third book from the left, top shelf" now has the wrong address. The third way is a **row of mailboxes** with no sign at the end: if you tell a friend "start at box 1", they have no way of knowing where the row stops.

Python gives you one sequence type for almost everything: a `list` grows, knows its own length, and raises `IndexError` past the end. C++ gives you three, and they are those three pictures. **`std::array`** is the egg carton: a fixed number of slots, with the number part of its type. **`std::vector`** is the bookshelf: it grows by moving to bigger storage. The **raw array** inherited from C is the row of mailboxes: the moment you hand it to a function, the function no longer knows how long it is.

In a 1 kHz control loop — one that runs a thousand times a second — choosing between them is a decision a reviewer will ask you to justify. The short version, which the rest of the lesson earns: `std::array` is the flight-code default, `std::vector` is for everywhere a heap allocation is acceptable, and a raw array is what you get from C interfaces and code written before 2011.

## The raw array

```cpp
double buf[10]{};
```

Read it as "buf is an array of 10 doubles, all set to zero" — the empty braces `{}` fill every slot with zero. The ten `double`s sit side by side in memory, **[[contiguous|contiguous-layout]]**: 8 bytes each, 80 bytes in all. Their storage is wherever the declaration is; inside a function, that is on the **stack**, the scratch memory a function uses while it runs.

The size is part of the type. `double[10]` is a different type from `double[9]`. No size is stored anywhere at run time, because the compiler already knows it.

`sizeof` gives the whole array's size in bytes, so the old trick `sizeof(buf) / sizeof(buf[0])` — total bytes divided by bytes per element — recovers the count: $80 / 8 = 10$. Now pass the array to a function:

```cpp
#include <array>
#include <cstdio>

void takes_raw(double buf[10]) {
    std::printf("  inside takes_raw:   sizeof(buf) = %zu\n", sizeof(buf));
}

void takes_array(const std::array<double, 10>& buf) {
    std::printf("  inside takes_array: sizeof(buf) = %zu, buf.size() = %zu\n",
                sizeof(buf), buf.size());
}

int main() {
    double raw[10]{};
    std::printf("in main: sizeof(raw) = %zu, count = %zu\n", sizeof(raw), sizeof(raw) / sizeof(raw[0]));
    takes_raw(raw);
    std::array<double, 10> arr{};
    std::printf("in main: sizeof(arr) = %zu, arr.size() = %zu\n", sizeof(arr), arr.size());
    takes_array(arr);
}
```

```text
in main: sizeof(raw) = 80, count = 10
  inside takes_raw:   sizeof(buf) = 8
in main: sizeof(arr) = 80, arr.size() = 10
  inside takes_array: sizeof(buf) = 80, buf.size() = 10
```

Eighty bytes became eight. The `[10]` in the parameter list is a fib the language allows: an array parameter is quietly rewritten as a pointer. `takes_raw` really takes a `double*` — a pointer to a double, 8 bytes on this machine — and `sizeof` measures the pointer. This is **[[array-to-pointer decay|decay-history]]**: when a raw array is passed to a function, it turns into a pointer to its first element and loses its length. The function cannot check anything, so every such function needs a separate count parameter, and the caller must get it right.

g++ 13.3.0 warns, and the warning names the mechanism:

```text
decay.cpp:5:69: warning: 'sizeof' on array function parameter 'buf' will return size of 'double*' [-Wsizeof-array-argument]
    5 |     std::printf("  inside takes_raw:   sizeof(buf) = %zu\n", sizeof(buf));
      |                                                                    ~^~~~
decay.cpp:4:23: note: declared here
    4 | void takes_raw(double buf[10]) {
      |                ~~~~~~~^~~~~~~
```

The second problem is going past the end. `buf[12]` on a ten-element array is **[[undefined behavior|out-of-bounds]]**, and nothing checks for it. The compilers catch some cases when the index is a fixed number:

```cpp
#include <cstdio>
int main() {
    double buf[10]{};
    std::printf("%.1f\n", buf[12]);
}
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

::: warning Clean compile does not mean safe indices
These warnings are best effort, not a guarantee. Change the read to a *write* that is never used — `buf[12] = 1.0;` — and on this toolchain g++ 13.3.0 says nothing about the bounds at `-O0`, `-O1`, `-O2` or `-O3` with `-Wall -Wextra -Wpedantic`. Its only complaint is that `buf` is "set but not used". clang++ 18.1.3 still flags the index. g++'s bounds warning runs inside its optimizer (from `-O2` up), and the optimizer most likely deleted the useless store before the check saw it. Never treat "it compiles clean" as proof that indices are in range. That job belongs to **[[AddressSanitizer|asan]]** and to checked access with `.at()`.
:::

## `std::array`: the egg carton

`std::array<T, N>` — read "standard array of N T's" — is the same storage as a raw array, with the size kept in the type and a proper container interface on top. It costs nothing extra: no heap, no pointer, no hidden size field. `sizeof(std::array<double, 10>)` is 80, exactly like the raw array.

Look back at the last two lines of the output above. Eighty bytes in `main` and inside the function. `std::array` does not decay, because it is a class type, and passing it by reference passes the whole type, size included. `buf.size()` works inside the function. The same `sizeof(buf)/sizeof(buf[0])` trick inside `takes_raw` would have given $8 / 8 = 1$.

What else you get:

- `.size()`, `.empty()`, `.front()`, `.back()`, `.data()`, `.begin()`, `.end()`.
- `.at(i)`, which checks the index and throws an exception instead of running off the end.
- Copying that works. `std::array<double, 10> b = a;` copies all ten elements. `double b[10] = a;` does not even compile.
- It can be returned from a function by value. A raw array cannot.

The size is a compile-time constant, so it can come from a `constexpr` expression, as lesson 07's IMU buffer did, and a `static_assert` can check the total against a memory budget.

## `std::vector`: the bookshelf

`std::vector<T>` owns a block of memory on the **heap** — the pool of memory a program can request and hand back while it runs — and can change size at run time. The vector object itself is small. In the usual implementation it holds **[[three pointers|vector-layout]]**: where the elements begin, where they end, and where the reserved space ends. The elements live elsewhere, in the heap block.

Two numbers describe it. `size()` is how many elements there are. `capacity()` is how many fit before it must get a bigger block and move everything. Watch it grow:

```cpp
#include <cstdio>
#include <vector>

int main() {
    std::vector<double> az;
    std::printf("start:            size=%zu capacity=%zu\n", az.size(), az.capacity());
    for (int i = 0; i < 9; ++i) {
        const double* before = az.data();
        az.push_back(-9.81);
        const double* after = az.data();
        std::printf("after push %d:     size=%zu capacity=%zu  buffer moved: %s\n",
                    i + 1, az.size(), az.capacity(), before != after ? "yes" : "no");
    }
    az.reserve(1000);
    std::printf("after reserve:    size=%zu capacity=%zu\n", az.size(), az.capacity());
}
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
after reserve:    size=9 capacity=1000
```

`push_back` adds one element at the end. `.data()` gives the address of the first element, so comparing it before and after tells you whether the elements moved.

The capacity doubles: 1, 2, 4, 8, 16 on this implementation. The standard only requires `push_back` to be **[[amortised constant|amortised]]** time, not this exact sequence. Count the "yes" lines: five of nine pushes grabbed a new block. Four of those also copied every element across and freed the old block; the first had nothing to copy yet.

That is fine in analysis code. In a control loop it is unacceptable, for three reasons:

- **Time is not bounded.** Most pushes are a store and a counter bump. Now and then one is an allocation plus a copy of everything. A deadline you meet *on average* is not a deadline you meet.
- **Allocation time is not predictable.** A general-purpose allocator searches its lists of free space, and how long that takes depends on the program's whole history.
- **The heap can [[fragment|fragmentation]].** A long-running vehicle that allocates and frees blocks of varied sizes can reach a state where a request fails even though enough total memory is free.

`reserve(n)` fixes the first two if you know the maximum ahead of time. Above, one call brought the capacity to 1000, so the next 991 pushes cannot move anything. That is the pattern to use when a vector really is the right structure.

There is one more cost to know, and lesson 06 promised it: passing a vector **by value** copies every element into a new heap block.

```cpp
#include <cstdio>
#include <vector>

void by_value(std::vector<double> v, const double* caller) {
    std::printf("by value:     own copy of %zu bytes: %s\n",
                v.size() * sizeof(double), v.data() != caller ? "yes" : "no");
}

void by_const_ref(const std::vector<double>& v, const double* caller) {
    std::printf("by const ref: own copy: %s\n", v.data() != caller ? "yes" : "no");
}

int main() {
    std::vector<double> samples(5000, -9.81);
    by_value(samples, samples.data());
    by_const_ref(samples, samples.data());
}
```

```text
by value:     own copy of 40000 bytes: yes
by const ref: own copy: no
```

`samples(5000, -9.81)` makes 5000 elements, each $-9.81$. By value, the function got its own $5000 \times 8 = 40{,}000$ bytes — an allocation and a copy on every call. By `const&`, it read the caller's elements where they sit. For a vector parameter you only read, write `const std::vector<T>&`.

::: warning Growing a vector can leave you holding a dangling reference
Anything that makes the vector move its elements makes every pointer, reference and iterator into it **dangle** — point at memory that has been freed. This is legal C++ and gives no warning:

```cpp
#include <cstdio>
#include <vector>
int main() {
    std::vector<double> az{-9.81};
    double& first = az[0];
    az.push_back(-9.79);      // may reallocate
    first = 0.0;              // may write to freed memory
    std::printf("%f\n", az[0]);
}
```

The `buffer moved: yes` lines above are exactly the moments when `first` goes bad. Build with `-fsanitize=address` and run, and AddressSanitizer stops the program at the bad write:

```text
ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
WRITE of size 8 at 0x502000000010 thread T0
    #0 ... in main dangle.cpp:7
```

The report names the source line: line 7, `first = 0.0;`. (Real output starts each line with a process id such as `==5061==`; the stack line is shortened here.) Run your tests under ASan. It is the tool that finds this kind of bug.
:::

## Bounds checking when you want it

The square-bracket index, `operator[]`, never checks on any of the three. `.at(i)` on `std::array` or `std::vector` does, and throws `std::out_of_range` when `i` is too big:

```cpp
#include <array>
#include <cstdio>
#include <stdexcept>
#include <vector>

int main() {
    std::array<double, 10> a{};
    std::vector<double> v{1.0, 2.0, 3.0};
    try { (void)a.at(12); }
    catch (const std::out_of_range& e) { std::printf("array::at threw: %s\n", e.what()); }
    try { (void)v.at(12); }
    catch (const std::out_of_range& e) { std::printf("vector::at threw: %s\n", e.what()); }
}
```

```text
array::at threw: array::at: __n (which is 12) >= _Nm (which is 10)
vector::at threw: vector::_M_range_check: __n (which is 12) >= this->size() (which is 3)
```

(`try` and `catch` are C++'s version of Python's `try` and `except`.) Those messages are the wording of libstdc++, GCC's standard library, not of the C++ standard, so never parse them. But notice that they name the index and the limit, which is most of a bug report. Use `.at()` where the index comes from outside your own code, and `[]` inside a loop you have already shown to be correct.

::: example Choosing a container for three real jobs
**A fixed-size state vector.** Six `double`s — say three position and three velocity numbers — known at compile time, on a 1 kHz path.

```cpp
std::array<double, 6> x{};         // 48 bytes, on the stack, no allocation
```

Check the size: $6 \times 8 = 48$ bytes. Use `std::array`. The size never changes, there is no reason to touch the heap, and for small operations the compiler can keep the whole thing in the processor's **registers**, the tiny storage slots inside the chip itself.

**A sensor sample buffer with a fixed maximum.** Up to 5000 IMU samples, however many arrived this cycle.

```cpp
std::array<ImuSample, 5000> storage{};
std::size_t count = 0;             // how many of them are valid
```

Use `std::array` plus a count, or a small fixed-capacity container built on one. Not a vector: the maximum is known, so there is nothing to gain from allocating, and a fixed buffer makes the worst case the only case. At 28 bytes per sample that is $5000 \times 28 = 140{,}000$ bytes, the figure from lessons 04 and 07. Lesson 13 shows how a `static_assert` keeps the capacity honest, and the next module builds exactly this container properly.

**A Monte Carlo run's trajectory, on the ground.** Thousands of randomized simulation runs, each of unknown length. Memory is plentiful, and there is no deadline.

```cpp
std::vector<State> traj;
traj.reserve(100000);              // one allocation if the guess is good
```

Use `std::vector`, with `reserve` because you can estimate the size. This is where a vector belongs.

The rule a reviewer applies: if the maximum size is known, use a fixed-size container. If it is not known, ask whether it *can* be bounded — because an unbounded buffer on a vehicle is an unbounded memory requirement.
:::

## Range-based `for`

This is the loop you will write most often, and the closest thing C++ has to Python's `for x in xs:`. Read the colon as "in":

```cpp
float sum = 0.0F;
for (const auto& s : buf) sum += s.az;          // alias: no copy
```

"For each `s` in `buf`, add its `az` to `sum`." (`0.0F` is a `float` zero; the `F` marks it as `float` rather than `double`.)

There are three forms, and they are not interchangeable. They are lesson 07's `auto` rules again:

| Form | Meaning |
| --- | --- |
| `for (const auto& s : buf)` | read-only alias of each element; no copy |
| `for (auto& s : buf)` | changeable alias of each element |
| `for (auto s : buf)` | a *copy* of each element |

Here all three are, on three IMU samples:

```cpp
#include <array>
#include <cstdint>
#include <cstdio>

struct ImuSample {
    std::uint32_t t_ms;
    float ax, ay, az, gx, gy, gz;
};

int main() {
    std::array<ImuSample, 3> buf{{
        {100, 0.0F, 0.0F, -9.79F, 0.0F, 0.0F, 0.0F},
        {110, 0.0F, 0.0F, -9.81F, 0.0F, 0.0F, 0.0F},
        {120, 0.0F, 0.0F, -9.83F, 0.0F, 0.0F, 0.0F},
    }};

    float sum = 0.0F;
    for (const auto& s : buf) sum += s.az;          // alias: no copy
    std::printf("mean az = %.4f\n", sum / static_cast<float>(buf.size()));

    for (auto s : buf) s.az = 0.0F;                 // copies each element
    std::printf("after 'for (auto s : buf) s.az = 0': buf[0].az = %.2f\n", buf[0].az);

    for (auto& s : buf) s.az = 0.0F;                // aliases each element
    std::printf("after 'for (auto& s : buf) s.az = 0': buf[0].az = %.2f\n", buf[0].az);

    for (std::size_t i = 0; i < buf.size(); ++i) {
        std::printf("buf[%zu].t_ms = %u\n", i, buf[i].t_ms);
    }
}
```

```text
mean az = -9.8100
after 'for (auto s : buf) s.az = 0': buf[0].az = -9.79
after 'for (auto& s : buf) s.az = 0': buf[0].az = 0.00
buf[0].t_ms = 100
buf[1].t_ms = 110
buf[2].t_ms = 120
```

Check the mean: $(-9.79 - 9.81 - 9.83) / 3 = -29.43 / 3 = -9.81$, close to gravity's $9.81\,\mathrm{m/s^2}$, as a resting sensor should read. Then the copy loop set three *copies* to zero and threw them away, so `buf[0].az` is still $-9.79$. The alias loop reached the real elements, so it became $0$.

This is the commonest place for a Python programmer to slip. In Python, `for s in buf: s.az = 0` *does* change the objects in the list, because `s` is another name for each one. g++ catches this exact case:

```text
rangefor.cpp:21:15: warning: variable 's' set but not used [-Wunused-but-set-variable]
   21 |     for (auto s : buf) s.az = 0.0F;                 // copies each element
```

But it cannot catch the version where you also *read* `s`, so the habit matters: **write `const auto&` by default**, and change it on purpose when you mean to copy or to modify.

When you need the index, use the ordinary counting loop with `std::size_t`, as the last loop does. Remember lesson 05: `std::size_t` is unsigned and can never be negative, so count *up* to `size()`. Counting down to zero with it needs a different test.

::: key
`std::array` is a fixed-size aggregate with size known at compile time and no heap use, so it is the flight-code default. A raw array decays to a pointer and loses its size. `std::vector` is heap-allocated and resizable, which is exactly what you cannot have in a hard real-time path.
:::

(An **aggregate** is a plain bundle of values you can set up with braces, like `{1, 2, 3}`. A **hard real-time** path is code that must finish before a fixed deadline every single time, not only on average.)

::: example What decay costs you, in one function signature
Three ways to write "work out the mean of some accelerations":

```cpp
// 1. Raw array: the length is a separate promise the caller must keep.
float mean_az(const ImuSample* s, std::size_t n);

// 2. Fixed size in the type: the length cannot be wrong.
float mean_az(const std::array<ImuSample, 5000>& s);

// 3. A view: any contiguous range, with its length attached. C++20.
float mean_az(std::span<const ImuSample> s);
```

**Signature 1** is what lesson 02's telemetry module used, and it is what C interfaces force on you. Its flaw is visible in the type: nothing ties `s` to `n`. So `mean_az(buf, 10)` on a three-element buffer compiles, links, runs, and reads seven elements of whatever happens to follow.

**Signature 2** cannot be wrong, but it cannot be reused either: it works for exactly one size.

**Signature 3** is the modern answer. A **[[span|span-view]]** — `std::span`, from the `<span>` header — is a pointer and a length packed together. It is built automatically from a `std::array`, a `std::vector` or a raw array, costs two words (16 bytes here), and allocates nothing. One definition serves all three:

```cpp
#include <array>
#include <cstdint>
#include <cstdio>
#include <span>
#include <vector>

struct ImuSample {
    std::uint32_t t_ms;
    float ax, ay, az, gx, gy, gz;
};

float mean_az(std::span<const ImuSample> s) {
    float sum = 0.0F;
    for (const auto& x : s) sum += x.az;
    return sum / static_cast<float>(s.size());
}

int main() {
    ImuSample raw[3] = {{100, 0, 0, -9.79F, 0, 0, 0}, {110, 0, 0, -9.81F, 0, 0, 0}, {120, 0, 0, -9.83F, 0, 0, 0}};
    std::array<ImuSample, 3> arr{raw[0], raw[1], raw[2]};
    std::vector<ImuSample> vec(arr.begin(), arr.end());
    std::printf("from raw array: %.4f\n", mean_az(raw));
    std::printf("from std::array: %.4f\n", mean_az(arr));
    std::printf("from std::vector: %.4f\n", mean_az(vec));
    std::printf("span size from vector = %zu\n", std::span<const ImuSample>(vec).size());
    std::printf("sizeof(span) = %zu\n", sizeof(std::span<const ImuSample>));
}
```

```text
from raw array: -9.8100
from std::array: -9.8100
from std::vector: -9.8100
span size from vector = 3
sizeof(span) = 16
```

Notice the raw-array call: `mean_az(raw)` works because at that point, in `main`, `raw` still has its full type `ImuSample[3]`, and the span takes the length from it *before* any decay happens. Same answer, $-9.81$, from all three.

This module's baseline is C++20, so prefer `std::span` for every "some elements in a row" parameter; the next module covers it properly. Signature 1's separate count is a compromise inherited from C, not the natural way to write C++.
:::

## Check yourself

::: check
`sizeof(raw)` is 80 in `main` but 8 inside `takes_raw(double buf[10])`. Explain, and say what the parameter's type really is.
:::

::: answer
An array parameter is not an array. C++ rewrites `double buf[10]` in a parameter list as `double* buf`. So the function receives a pointer, and `sizeof` gives the size of a pointer: 8 bytes on this machine, the same as `sizeof(double*)`.

In `main`, `raw` is a real `double[10]` object, and `sizeof` gives its $10 \times 8 = 80$ bytes.

The `[10]` in the parameter list does nothing at all: `takes_raw` will happily accept a pointer to a single `double`. This is array-to-pointer decay, and it is why a function taking a raw array cannot check anything about its length.
:::

::: check
A vector's `capacity()` went 1, 2, 4, 8, 16 while `size()` went from 1 to 9, and the elements moved each time the capacity grew. Why is that acceptable in a Monte Carlo script and not in a 500 Hz attitude loop?
:::

::: answer
Because the cost is lumpy. Most `push_back` calls are a store and a counter bump. The ones that grow the vector call the allocator, copy or move every existing element, and free the old block.

In a script, only the *total* time matters, and the average cost per push is excellent.

In a control loop, the *worst* cycle is what matters. At 500 Hz every cycle must finish within $1/500 = 2\,\mathrm{ms}$, and a cycle that happens to hit a regrowth can take many times longer than its neighbors. On top of that, the allocator's own timing depends on the heap's history, so the worst case is not even limited by the copy.

A fixed-size container removes the question. If a vector must be used, `reserve` the maximum before the loop starts, so no regrowth can happen inside it.
:::

::: check
`for (auto s : samples) s.valid = false;` compiles, runs, and changes nothing. What did you mean, and what would the same loop do in Python?
:::

::: answer
Plain `auto` deduces a value type. So each time round the loop, the element is copied into `s`, the copy's field is set, and the copy is thrown away. You meant `for (auto& s : samples)`, which makes `s` an alias for each element in the container.

In Python, `for s in samples: s.valid = False` makes `s` another name for each object in the list, so the list really is changed. The Python loop does what the C++ loop *looks* like it does — which is exactly why the mistake is so easy to make coming from Python.

g++ happens to catch this exact case with `-Wunused-but-set-variable`, but only because `s` is never read. Add a read, and the warning disappears while the bug stays.
:::

::: check
A reviewer says `float mean_az(const ImuSample* s, std::size_t n)` is a weaker interface than `float mean_az(std::span<const ImuSample> s)`. Make the argument in terms of what each signature makes impossible.
:::

::: answer
The pointer-and-count version makes nothing impossible. The two parameters are independent, so any pointer can be paired with any count. `mean_az(buf, 10)` on a three-element buffer is a perfectly legal call that reads past the end. Every call is correct only if the caller follows a rule the compiler cannot check.

A `std::span` carries the pointer and the length as one object, built from the container itself. The caller does not supply the length, so the caller cannot get it wrong. The only way to make a bad span is to build one on purpose from a pointer and a wrong count.

It also accepts a `std::array`, a `std::vector` and a raw array with no extra overloads, and it costs the same two words the old signature passed anyway.
:::

::: check
Both `.at(12)` calls threw, with messages naming the index and the limit. When should flight software use `.at()` rather than `[]`, given that exceptions are often turned off in flight builds?
:::

::: answer
`.at()` earns its cost at a **trust boundary** — where an index comes from outside code you control: a telemetry command, a configuration file, a table lookup keyed by a sensor reading. Inside a loop whose limits you wrote and can see, `[]` is right and the check is wasted work.

Where exceptions are turned off — common in flight builds, because the path an exception takes is hard to reason about — `.at()` is not available as a way to recover. The equivalent is an explicit range check, written *before* the access, that returns a status or calls the project's fault handler.

The principle survives the change of tool: check an index where it enters your control, then index freely once it is proven good.
:::

## Summary

| Container | Storage | Size known | Decays | Checked access | Use |
| --- | --- | --- | --- | --- | --- |
| `T arr[N]` | wherever declared | compile time, lost when passed | yes, to `T*` | none | C interfaces, old code |
| `std::array<T,N>` | wherever declared | compile time, kept | no | `.at()` | flight-code default |
| `std::vector<T>` | heap | run time | no | `.at()` | analysis, tools, anywhere the heap is fine |
| `std::span<T>` | none — a view | run time, carried with it | no | none in C++20 | parameters that take "some elements in a row" |

| Idiom | Meaning |
| --- | --- |
| `sizeof(a)/sizeof(a[0])` | element count, only where `a` is a real array |
| `-Wsizeof-array-argument` | g++ telling you `sizeof` is measuring a decayed parameter |
| `size()` vs `capacity()` | elements present vs elements that fit before regrowing |
| `reserve(n)` | allocate once up front; no regrowth until `n` is passed |
| regrowth | leaves every pointer, reference and iterator into the vector dangling |
| `const std::vector<T>&` parameter | read the caller's elements; no copy |
| `for (const auto& x : c)` | the default loop: alias, no copy |
| `for (auto& x : c)` | alias, changeable |
| `for (auto x : c)` | copy each element |

Lesson 10 gives these containers something better to hold than loose `double`s: `struct` and `class`, access specifiers, `enum class`, and the namespaces that keep all their names apart.

::: context contiguous-layout Ten doubles in a row
"Contiguous" means touching, with no gaps. The ten `double`s of `double buf[10]` sit end to end, each 8 bytes wide, so element `i` starts $8i$ bytes after the first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="30" width="34" height="30"/><rect x="44" y="30" width="34" height="30"/>
    <rect x="78" y="30" width="34" height="30"/><rect x="112" y="30" width="34" height="30"/>
    <rect x="146" y="30" width="34" height="30"/><rect x="180" y="30" width="34" height="30"/>
    <rect x="214" y="30" width="34" height="30"/><rect x="248" y="30" width="34" height="30"/>
    <rect x="282" y="30" width="34" height="30"/><rect x="316" y="30" width="34" height="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="27" y="50">[0]</text><text x="61" y="50">[1]</text><text x="95" y="50">[2]</text>
    <text x="129" y="50">[3]</text><text x="163" y="50">[4]</text><text x="197" y="50">[5]</text>
    <text x="231" y="50">[6]</text><text x="265" y="50">[7]</text><text x="299" y="50">[8]</text>
    <text x="333" y="50">[9]</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="10" y="78">0</text><text x="44" y="78">8</text><text x="78" y="78">16</text>
    <text x="180" y="78">40</text><text x="316" y="78">72</text><text x="350" y="78">80</text>
  </g>
  <text x="180" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">byte offset below each boundary; 80 bytes in all</text>
</svg>
```

Being contiguous is what makes indexing fast: finding `buf[7]` is one multiply and one add, $7 \times 8 = 56$ bytes in, with no searching.
:::

::: context decay-history Why arrays forget their size
The rule comes from C, and C took it from its ancestor, the language B. In B, an array's name really was a pointer to its first cell. When Dennis Ritchie designed C in the early 1970s, he gave arrays real array types but kept B's habit: in most expressions, and always when passed to a function, an array turns into a pointer to its first element. That kept old code working.

C++ kept C's rule for compatibility. `std::array` and `std::span` are the C++ ways around it.
:::

::: context out-of-bounds What really happens past the end
On a real machine, `buf[12]` usually reads whatever 8 bytes happen to sit 96 bytes after the start of `buf` — perhaps another variable, perhaps a saved return address. The program may print nonsense, crash, or appear to work perfectly.

"Appear to work" is the dangerous one. Because the behavior is undefined, the optimizer is allowed to assume it never happens, and code built at `-O2` may behave differently from the same code at `-O0`. A write past the end is worse still: it silently changes some other variable, and the symptom shows up far from the cause.
:::

::: context asan A sanitizer that watches every access
**AddressSanitizer** (ASan), built into both g++ and clang++, is switched on with `-fsanitize=address`. It surrounds every block of memory with "poisoned" guard bytes, keeps freed blocks poisoned for a while, and adds a check before every memory access. Touching poison stops the program with a report naming the source line.

It makes the program roughly twice as slow and uses extra memory, so it is for test builds, not flight builds. Lesson 05 met its partner, UndefinedBehaviorSanitizer, which catches problems such as signed overflow.
:::

::: context vector-layout What a vector really holds
The vector object itself is three pointers, 24 bytes on a 64-bit machine. The elements live in a separate block on the heap. Here the vector holds 5 elements and has room for 8.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="11" fill="#6c7a93" text-anchor="middle">vector object</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="20" y="24" width="80" height="24"/><rect x="20" y="48" width="80" height="24"/><rect x="20" y="72" width="80" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="40">begin</text><text x="60" y="64">end</text><text x="60" y="88">cap end</text>
  </g>
  <text x="195" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">heap block</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="120" y="110" width="30" height="28" fill="#8fb8f0"/><rect x="150" y="110" width="30" height="28" fill="#8fb8f0"/>
    <rect x="180" y="110" width="30" height="28" fill="#8fb8f0"/><rect x="210" y="110" width="30" height="28" fill="#8fb8f0"/>
    <rect x="240" y="110" width="30" height="28" fill="#8fb8f0"/><rect x="270" y="110" width="30" height="28" fill="#ffffff"/>
    <rect x="300" y="110" width="30" height="28" fill="#ffffff"/><rect x="330" y="110" width="30" height="28" fill="#ffffff"/>
  </g>
  <g stroke-width="1.5" fill="none">
    <path d="M100 36 L121 36 L121 104" stroke="#1d6fd1"/>
    <path d="M100 60 L270 60 L270 104" stroke="#1d6fd1"/>
    <path d="M100 84 L357 84 L357 104" stroke="#b4232c"/>
  </g>
  <polygon points="121,110 117,102 125,102" fill="#1d6fd1"/>
  <polygon points="270,110 266,102 274,102" fill="#1d6fd1"/>
  <polygon points="357,110 353,102 361,102" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="195" y="156">size 5</text><text x="315" y="156">spare</text>
  </g>
</svg>
```

`end` points one past the last element; `size()` is `end − begin` and `capacity()` is `cap end − begin`. Growing past the capacity gets a new block and moves all three pointers.
:::

::: context amortised Why doubling is cheap on average
"Amortised" means averaged over many operations. Each time the vector doubles, it copies everything it has. Growing to 9 elements copied $1 + 2 + 4 + 8 = 15$ elements in total.

The copies form the series $1, 2, 4, 8, \ldots$, and each term is one more than all the terms before it added together. So the total is less than twice the biggest term, and the biggest term is smaller than the number of elements pushed. The total number of copies is therefore always less than twice the number of pushes: $15 < 2 \times 9 = 18$. So the average cost per `push_back` stays constant however big the vector gets. The *worst single* push is still expensive, which is why an average is no comfort to a control loop.
:::

::: context fragmentation Enough memory, in the wrong shape
Imagine a parking lot where cars of different lengths come and go all day. By evening there may be plenty of free space in total, but in small gaps between parked cars — and a bus cannot park anywhere. That is heap **fragmentation**.

It is one reason for the rule, from NASA JPL's widely cited "Power of Ten" coding rules, that flight code should not allocate memory dynamically after initialization. Everything is allocated at startup, when the heap is empty, and the sizes never change again.
:::

::: context span-view A window, not a box
A `std::span` owns nothing. It is a pointer to the first element and a count, looking at storage that belongs to somebody else — here a `std::vector` of three samples.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="20" y="20" width="70" height="24"/><rect x="90" y="20" width="70" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="36">pointer</text><text x="125" y="36">size = 3</text>
    <text x="90" y="12">std::span (16 bytes)</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="40" y="80" width="80" height="28"/><rect x="120" y="80" width="80" height="28"/><rect x="200" y="80" width="80" height="28"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="98">sample 0</text><text x="160" y="98">sample 1</text><text x="240" y="98">sample 2</text>
    <text x="160" y="124">the vector's elements</text>
  </g>
  <line x1="55" y1="44" x2="55" y2="74" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="55,80 50,71 60,71" fill="#1d6fd1"/>
</svg>
```

Because it owns nothing, a span must never outlive what it looks at. If the vector regrows or is destroyed, the span dangles, exactly like the reference in the warning above.
:::
