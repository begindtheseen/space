---
id: l08-transform-and-fold
title: Transforming, combining and checking ranges
minutes: 23
covers:
  - transform, accumulate, reduce, copy_if, all_of/any_of/none_of, clamp, rotate, unique
  - "numeric: iota, inner_product, partial_sum"
---

Picture a cookie factory. One machine stamps a shape onto every cookie that rolls past. Another picks out the burnt ones. A third tips everything that reaches the end of the belt into one big box. Each machine does one plain job, and anybody walking past can tell what it does from its name.

Now picture the same factory where one worker does everything by hand, in one long shift, with a notebook. It works. But to find out what happens to a cookie, you have to read the whole notebook.

A hand-written `for` loop is that worker. It can do anything, so a reader has to read every line to learn what it *does* do: does it change each element, pick some out, add them up, or stop at the first bad one? The standard **algorithms** are the named machines. `std::transform` changes every element. `std::copy_if` picks some out. `std::accumulate` adds them into one value. When a flight-software reviewer sees `std::all_of(counts.begin(), counts.end(), in_range)`, the intent is on the page before they read the lambda. Last lesson's algorithms put ranges in order and searched them. This lesson's algorithms change values and combine them — and ends by rewriting a loop-heavy function with them, without changing a single output.

## How an algorithm is written

There is no magic inside `<algorithm>`. Each algorithm is a short function template that walks an iterator pair. Here is a home-made version of the standard `std::count_if`, which counts the elements that pass a test:

```cpp
template <typename It, typename Pred>
std::size_t my_count_if(It first, It last, Pred pred) {
    std::size_t n = 0;
    for (; first != last; ++first)
        if (pred(*first)) ++n;
    return n;
}
```

Read the first line aloud as "a template, for any type `It` and any type `Pred`". `It` stands for whatever iterator the caller passes: a `std::vector<double>` iterator, a `std::array<int, 5>` iterator, even a raw pointer. `Pred` stands for whatever callable the caller passes, usually a lambda. The compiler works out both types from the arguments at the call, and writes a separate copy of the function for each combination — this is **[[template argument deduction|deduction]]**.

The body uses only three things from the iterator:

- `first != last` — "have we reached the end yet?";
- `++first` — "step to the next element";
- `*first` — "the element here".

The loop moves `first` itself forward. That is fine, because `first` was passed by value: the caller's iterator does not move. Any iterator that can compare, step and read works, which is why the one template serves every container. Here it is next to the real thing:

```cpp
const std::vector<double> temps{21.5, 38.0, 19.0, 41.2};
const std::array<int, 5> flags{0, 1, 1, 0, 1};

auto hot = [](double t) { return t > 35.0; };
auto set = [](int f) { return f != 0; };

std::printf("hot:  mine %zu, std %td\n", my_count_if(temps.begin(), temps.end(), hot),
            std::count_if(temps.begin(), temps.end(), hot));
std::printf("set:  mine %zu, std %td\n", my_count_if(flags.begin(), flags.end(), set),
            std::count_if(flags.begin(), flags.end(), set));
```

```text
hot:  mine 2, std 2
set:  mine 3, std 3
```

Two temperatures are above 35 (38.0 and 41.2) and three flags are set, and both versions agree on both containers. Exercise `cpp04_ex1` asks you to write `my_accumulate` and `my_find_if` the same way. Everything you need is on this page and in the two sections on `accumulate` and `find_if`: the loop shape above, what each algorithm returns, and what "not found" looks like.

::: key An algorithm over an iterator pair
An algorithm is a function template over `[first, last)`. It loops `for (; first != last; ++first)` and reads each element with `*first`. It needs nothing from the container itself, so the same template works for a `vector`, an `array` or a raw pointer range. That same fact means an algorithm can never change a container's size — lesson 09 builds on this.
:::

## transform: change every element

`std::transform(first, last, out, f)` calls `f` on every element of the input and writes each result through the **output iterator** `out`. It returns the output position after the last one written.

```cpp
std::vector<double> volts(counts.size());                   // room for every result
std::transform(counts.begin(), counts.end(), volts.begin(),
               [](int c) { return c * (5.0 / 4095.0); });   // ADC count -> volts
```

Read the lambda as "take a count `c`, return it times 5 over 4095". That is how a 12-bit analog-to-digital converter's reading, 0 to 4095, becomes a voltage from 0 to 5 V.

A second form takes two input ranges and a two-argument function, pairing the elements up:

```cpp
std::transform(a.begin(), a.end(), b.begin(), sum.begin(),
               [](double x, double y) { return x + y; });   // sum[i] = a[i] + b[i]
```

The output may be the input itself — `std::transform(v.begin(), v.end(), v.begin(), f)` changes `v` in place.

::: warning The output must already have room
`transform` writes through `out`; it does not grow anything. Writing into an empty `std::vector` with `v.begin()` writes past the end: undefined behavior. Either size the vector first (`std::vector<double> volts(counts.size());`) or pass `std::back_inserter(volts)`, an output iterator that calls `volts.push_back` for every value written. The second one allocates as it grows, so in a control loop prefer the first, with the size fixed ahead of time.
:::

## accumulate and reduce: many values into one

### accumulate: a strict left-to-right fold

`std::accumulate(first, last, init)` from the header `<numeric>` starts with `init` and adds each element in turn, left to right:

$$
((\,(\text{init} + x_0) + x_1) + x_2) + \cdots
$$

Give it a fourth argument and it uses that operation instead of `+`: `std::accumulate(first, last, init, op)` computes `init = op(init, *first)` for every element and returns the final `init`. Combining a whole range into one value like this is called a **[[fold|fold]]**. The order is fixed: always left to right, one element at a time.

::: warning The starting value picks the type
The type of the result is the type of `init`, not the type of the elements. That catches almost everyone once:

```cpp
std::vector<double> half{0.5, 0.5, 0.5};
std::printf("int start:    %d\n", std::accumulate(half.begin(), half.end(), 0));
std::printf("double start: %.1f\n", std::accumulate(half.begin(), half.end(), 0.0));
```

```text
int start:    0
double start: 1.5
```

With `0`, an `int`, every step computes `int + double`, and the result is stored back into an `int`, cutting off the fraction: $0 + 0.5 = 0.5 \to 0$, three times. The answer is 0, not 1.5. g++ with `-Wall -Wextra` printed no warning, because the conversion happens inside a library header. Write `0.0` for doubles, and `0.0f` for floats.
:::

### reduce: permission to regroup

`std::reduce(first, last, init)` (C++17, also in `<numeric>`) looks the same, but the standard lets it add the elements in **any order and any grouping**. It might compute $(x_0 + x_1) + (x_2 + x_3)$ instead of $((x_0 + x_1) + x_2) + x_3$. That freedom lets the library split the work into pieces — across the four lanes of a vector unit, or across processor cores, which is lesson 09's subject.

For whole numbers, grouping never changes the answer. For floating-point numbers it does, because every addition [[rounds|floating-spacing]] to the nearest number a `double` can hold, and different groupings round at different moments. Here is the smallest case. Near $10^{16}$, neighboring `double` values are 2 apart, so adding 1 lands exactly halfway and rounds back down:

$$
(10^{16} + 1) + 1 = 10^{16}, \qquad 10^{16} + (1 + 1) = 10^{16} + 2.
$$

Same three numbers, two groupings, two answers.

::: example accumulate and reduce disagree
Ten million sensor readings of $0.1$ each, summed both ways.

```cpp
#include <cstdio>
#include <numeric>
#include <vector>

int main() {
    std::vector<double> v(10'000'000, 0.1);        // ten million readings of 0.1
    double a = std::accumulate(v.begin(), v.end(), 0.0);
    double r = std::reduce(v.begin(), v.end(), 0.0);
    std::printf("accumulate: %.10f\n", a);
    std::printf("reduce:     %.10f\n", r);
    std::printf("difference: %.3g\n", a - r);
}
```

Output, g++ 13.3 at `-O2`:

```text
accumulate: 999999.9998389754
reduce:     1000000.0000402561
difference: -0.000201
```

Step by step.

1. **The true answer.** The `double` nearest to $0.1$ is a tiny bit more than $0.1$, so ten million of them add up to $1{,}000{,}000.0000000000555$ exactly (computed with Python's exact decimal arithmetic). To ten decimal places, that is $1{,}000{,}000.0000000000$.
2. **accumulate** is off by about $-1.6 \times 10^{-4}$. It adds one $0.1$ at a time to a running total that grows to a million. Once the total is large, each addition rounds off a little of the $0.1$, and ten million small losses pile up.
3. **reduce** is off by about $+4.0 \times 10^{-5}$ — four times closer. In this library, `std::reduce` on a `vector` adds the elements in groups of four, $(x_0 + x_1) + (x_2 + x_3)$, and only then adds the group into the total. Fewer additions hit the big running total, so less is rounded away.
4. **Why the output differs at all.** The two results differ by $2.01 \times 10^{-4}$ even though both summed the same numbers. Nothing is wrong with either. They grouped differently.

Sanity check: both are within $0.0002$ of a million, a relative error of about $2 \times 10^{-10}$, far smaller than any sensor's own error. The lesson is not that one is broken. It is that `reduce` gives no promise about *which* grouping you get, so its last digits can change with the library, the compiler, or — in parallel — the number of threads.
:::

So choose deliberately. Use `accumulate` when you need the same bits every run — a regression test that compares against a stored answer, or a flight computation that must match the ground's simulation exactly. Use `reduce` when the operation truly does not care about order and you want the speed. For `reduce`, the operation must be **associative** (grouping does not matter) and **commutative** (order does not matter). `+` on integers is both. Subtraction is neither, so never `reduce` with `-`.

::: key accumulate versus reduce
`std::accumulate` is a left fold, in order, one element at a time; its result type is the type of `init`. `std::reduce` (C++17) may regroup and reorder, which lets it vectorize and run in parallel, but floating-point sums can then differ in the last digits. Its operation must be associative and commutative.
:::

## Picking, checking and limiting

### copy_if

`std::copy_if(first, last, out, pred)` copies only the elements for which `pred` says yes. It is the "pick out" machine:

```cpp
std::vector<double> high;
std::copy_if(volts.begin(), volts.end(), std::back_inserter(high),
             [](double v) { return v > 4.5; });
```

You rarely know ahead of time how many will pass, so `back_inserter` is the usual output here. (Where allocation is not allowed, copy into a fixed-size array and keep the returned output iterator: it tells you how many were copied.)

### all_of, any_of, none_of

These three answer yes-or-no questions about a whole range:

- `std::all_of(first, last, pred)` — does *every* element pass?
- `std::any_of(first, last, pred)` — does *at least one* pass?
- `std::none_of(first, last, pred)` — does *no* element pass?

Each stops at the first element that settles the answer, as a careful loop with `break` would. On an **empty range**, `all_of` and `none_of` return `true` and `any_of` returns `false`. That is not a quirk: "every sensor in this empty list is healthy" is true because there is no sensor to disprove it. It is a real hazard, though. A health check with `all_of` over a list that failed to fill says "all good".

### clamp

`std::clamp(x, lo, hi)` (C++17, in `<algorithm>`) returns `lo` if `x < lo`, `hi` if `hi < x`, and `x` otherwise. It is how a commanded gimbal angle or a throttle setting is held inside its limits:

```cpp
double cmd = std::clamp(requested, -0.1, 0.1);   // radians: limit the gimbal to ±0.1 rad
```

`std::clamp(-3.0, 0.0, 1.0)` gives `0`, `std::clamp(0.4, 0.0, 1.0)` gives `0.4`, and `std::clamp(7.0, 0.0, 1.0)` gives `1`. Two traps: if `lo` is greater than `hi` the behavior is undefined, and `clamp` returns a *reference* to one of its arguments, so binding the result to a reference when an argument was a temporary, as in `const double& r = std::clamp(x, 0.0, 1.0);`, leaves `r` dangling. Store the result by value.

## Rearranging: rotate and unique

### rotate

`std::rotate(first, middle, last)` turns the range like a wheel so that `middle` becomes the first element. The elements before `middle` move, in order, to the back:

```cpp
std::array<int, 5> history{1, 2, 3, 4, 5};
auto old_first = std::rotate(history.begin(), history.begin() + 1, history.end());
// history is now 2 3 4 5 1; old_first points at index 4
```

It returns where the old first element ended up. Rotating left by one is how you slide a short history window — drop the oldest sample, making room at the back for the newest — in $O(n)$ moves with no allocation. For long histories a **[[ring buffer|ring-buffer]]** does the same job without moving anything.

### unique

`std::unique(first, last)` removes **consecutive** duplicates. It keeps the first element of each run of equal neighbors, slides the keepers to the front, and returns an iterator to the new logical end. Two things surprise people:

- It only sees *neighbors*. On `{7, 3, 7, 7, 1, 3, 3}` it keeps `7 3 7 1 3` — five values, with 7 and 3 each still there twice. Sort first, and the same values become `1 3 7`.
- Like every algorithm, it cannot shrink the container. The vector is still seven long; only the front part is meaningful. Lesson 09 shows the one-line fix, and why forgetting it is one of the most common C++ bugs.

## The numeric toolkit: iota, partial_sum, inner_product

Three more folds live in `<numeric>`:

- `std::iota(first, last, start)` fills the range with `start`, `start + 1`, `start + 2`, … — the quick way to make a list of indices or channel numbers. The name is the Greek letter **[[iota|iota]]**.
- `std::partial_sum(first, last, out)` writes the **running total**: the first element, then the sum of the first two, then the first three, and so on. Summing small steps into a running value is exactly how a navigation filter builds a velocity out of acceleration samples.
- `std::inner_product(a_first, a_last, b_first, init)` multiplies the two ranges pair by pair and adds up the products, starting from `init`. For two 3-vectors that is the **[[dot product|dot-product]]**, $\mathbf{a} \cdot \mathbf{b} = a_x b_x + a_y b_y + a_z b_z$ — read "a dot b". Like `accumulate`, its result type is the type of `init`, so start doubles from `0.0`.

::: example From acceleration samples to velocity
An accelerometer reports five samples, $0.5\,\mathrm{s}$ apart: $2, 4, 4, 3, 1\,\mathrm{m/s^2}$. We turn each into a velocity change, then run them into a velocity. We also project a velocity onto a thrust direction, slide a history window, and deduplicate a list of ids.

```cpp
#include <algorithm>
#include <array>
#include <cstdio>
#include <numeric>
#include <vector>

template <typename C>
void show(const char* name, const C& c) {
    std::printf("%-13s", name);
    for (const auto& x : c) std::printf(" %g", static_cast<double>(x));
    std::printf("\n");
}

int main() {
    std::array<int, 6> idx{};
    std::iota(idx.begin(), idx.end(), 10);                 // 10, 11, 12, ...
    show("iota:", idx);

    // Acceleration samples (m/s^2) over 0.5 s steps -> velocity change per step -> running velocity.
    const std::vector<double> accel{2.0, 4.0, 4.0, 3.0, 1.0};
    std::vector<double> dv(accel.size());
    std::transform(accel.begin(), accel.end(), dv.begin(), [](double a) { return a * 0.5; });
    std::vector<double> vel(dv.size());
    std::partial_sum(dv.begin(), dv.end(), vel.begin());
    show("dv:", dv);
    show("partial_sum:", vel);

    const std::array<double, 3> thrust_dir{0.0, 0.6, 0.8};
    const std::array<double, 3> velocity{100.0, 50.0, 25.0};
    std::printf("inner_product: %g\n",
                std::inner_product(thrust_dir.begin(), thrust_dir.end(), velocity.begin(), 0.0));

    std::array<int, 5> history{1, 2, 3, 4, 5};
    auto old_first = std::rotate(history.begin(), history.begin() + 1, history.end());
    show("rotate:", history);
    std::printf("old first now at index %td\n", old_first - history.begin());

    std::vector<int> ids{7, 3, 7, 7, 1, 3, 3};
    auto e1 = std::unique(ids.begin(), ids.end());
    std::printf("unique unsorted keeps %td:", e1 - ids.begin());
    for (auto it = ids.begin(); it != e1; ++it) std::printf(" %d", *it);
    std::printf("\n");
    ids = {7, 3, 7, 7, 1, 3, 3};
    std::sort(ids.begin(), ids.end());
    auto e2 = std::unique(ids.begin(), ids.end());
    std::printf("unique sorted keeps %td:", e2 - ids.begin());
    for (auto it = ids.begin(); it != e2; ++it) std::printf(" %d", *it);
    std::printf("\n");
}
```

Output:

```text
iota:         10 11 12 13 14 15
dv:           1 2 2 1.5 0.5
partial_sum:  1 3 5 6.5 7
inner_product: 50
rotate:       2 3 4 5 1
old first now at index 4
unique unsorted keeps 5: 7 3 7 1 3
unique sorted keeps 3: 1 3 7
```

Walk through it.

1. **iota** filled six slots starting at 10.
2. **transform** turned each acceleration into a velocity change, $\Delta v = a \, \Delta t$: $2 \times 0.5 = 1$, $4 \times 0.5 = 2$, $2$, $1.5$, $0.5\,\mathrm{m/s}$.
3. **partial_sum** ran them together: $1$, then $1 + 2 = 3$, then $3 + 2 = 5$, then $5 + 1.5 = 6.5$, then $6.5 + 0.5 = 7\,\mathrm{m/s}$. The last running total is the whole change in speed.
4. **inner_product**: $0 \times 100 + 0.6 \times 50 + 0.8 \times 25 = 0 + 30 + 20 = 50\,\mathrm{m/s}$, the part of the velocity along the thrust direction.
5. **rotate** moved the 1 from the front to the back, and reported that it now sits at index 4.
6. **unique** kept 5 values from the unsorted list and 3 from the sorted one.

Sanity check: the final velocity must equal the total of all the velocity changes, $1 + 2 + 2 + 1.5 + 0.5 = 7$. It does. And the thrust direction has length $\sqrt{0.6^2 + 0.8^2} = 1$, so the dot product is a true "component along", no bigger than the speed itself, $\sqrt{100^2 + 50^2 + 25^2} \approx 114.6\,\mathrm{m/s}$.
:::

## Rewriting a loop-heavy function

Here is the objective of this lesson in one program. `process_loops` is the kind of function you meet in real code: four loops, each doing one job, none of them named. `process_algorithms` does the same four jobs with four algorithms. The test is strict: every output must be bit-for-bit identical.

::: example The same report, with loops and with algorithms
A batch of 12-bit ADC counts comes in. We must convert each to volts and clamp it to 0–5 V, collect the readings above 4.5 V, compute the mean voltage, and flag whether every raw count was inside 0–4095.

```cpp
#include <algorithm>
#include <cstdio>
#include <iterator>
#include <numeric>
#include <vector>

struct Report {
    std::vector<double> volts;   // every reading, clamped to 0..5 V
    std::vector<double> high;    // readings above 4.5 V
    double mean = 0.0;
    bool all_in_range = true;    // no raw count was outside 0..4095
};

// Before: loops written by hand.
Report process_loops(const std::vector<int>& counts) {
    Report r;
    for (std::size_t i = 0; i < counts.size(); ++i) {
        double v = counts[i] * (5.0 / 4095.0);
        if (v < 0.0) v = 0.0;
        if (v > 5.0) v = 5.0;
        r.volts.push_back(v);
    }
    for (std::size_t i = 0; i < r.volts.size(); ++i)
        if (r.volts[i] > 4.5) r.high.push_back(r.volts[i]);
    double sum = 0.0;
    for (std::size_t i = 0; i < r.volts.size(); ++i) sum += r.volts[i];
    r.mean = sum / r.volts.size();
    for (std::size_t i = 0; i < counts.size(); ++i)
        if (counts[i] < 0 || counts[i] > 4095) { r.all_in_range = false; break; }
    return r;
}

// After: the same four jobs, each named by an algorithm.
Report process_algorithms(const std::vector<int>& counts) {
    Report r;
    r.volts.resize(counts.size());
    std::transform(counts.begin(), counts.end(), r.volts.begin(),
                   [](int c) { return std::clamp(c * (5.0 / 4095.0), 0.0, 5.0); });
    std::copy_if(r.volts.begin(), r.volts.end(), std::back_inserter(r.high),
                 [](double v) { return v > 4.5; });
    r.mean = std::accumulate(r.volts.begin(), r.volts.end(), 0.0) / r.volts.size();
    r.all_in_range = std::all_of(counts.begin(), counts.end(),
                                 [](int c) { return c >= 0 && c <= 4095; });
    return r;
}

void print(const char* name, const Report& r) {
    std::printf("%s volts:", name);
    for (double v : r.volts) std::printf(" %.3f", v);
    std::printf("\n%s high: %zu, mean %.6f V, all in range: %s\n",
                name, r.high.size(), r.mean, r.all_in_range ? "yes" : "no");
}

int main() {
    const std::vector<int> counts{0, 1024, 2048, 3900, 4095, 4200, -12, 3700};
    const Report a = process_loops(counts);
    const Report b = process_algorithms(counts);
    print("loops", a);
    print("algos", b);
    std::printf("identical: %s\n",
                (a.volts == b.volts && a.high == b.high && a.mean == b.mean &&
                 a.all_in_range == b.all_in_range) ? "yes" : "no");
}
```

Output:

```text
loops volts: 0.000 1.250 2.501 4.762 5.000 5.000 0.000 4.518
loops high: 4, mean 2.878816 V, all in range: no
algos volts: 0.000 1.250 2.501 4.762 5.000 5.000 0.000 4.518
algos high: 4, mean 2.878816 V, all in range: no
identical: yes
```

How each loop became one call, and why the behavior is unchanged:

1. **Convert and clamp** became `transform` with `clamp` inside the lambda. The two `if`s did exactly what `clamp` does. Count 4200 is above the top, so it clamps to 5.000; count −12 is below zero and clamps to 0.000.
2. **Pick the high ones** became `copy_if` into a `back_inserter`, the same `push_back` the loop did. Four readings pass: 4.762, 5.000, 5.000 and 4.518.
3. **Sum and divide** became `accumulate` from `0.0`. It is a left fold, in the same order as the loop, so the sum is the same bits. (With `reduce` the mean could differ in its last digit, and the `==` test could fail. That is exactly the "without changing behavior" trap.)
4. **Check the range, stopping early** became `all_of`, which also stops at the first failure — here at 4200.

Sanity check: the mean should be the eight clamped voltages over 8. Their sum is $0 + 1.2503 + 2.5006 + 4.7619 + 5 + 5 + 0 + 4.5177 = 23.0305$, and $23.0305 / 8 \approx 2.8788\,\mathrm{V}$. It matches.
:::

Two habits carry over to any rewrite. First, keep the old version and compare outputs exactly, as `main` does here. Second, watch for the three places where "the same" can quietly change: a fold whose order changes (`accumulate` to `reduce`), an early exit that is lost or gained, and an output that no longer has room. A clean rewrite changes the words, never the answers.

::: key Rewriting loops as algorithms
Match each loop to one job: change every element (`transform`), pick some (`copy_if`), fold into one value (`accumulate`), ask a yes-or-no question (`all_of`, `any_of`, `none_of`). Keep the fold order the same — `accumulate`, not `reduce` — and compare the old and new outputs exactly.
:::

## Check yourself

::: check
What does `std::accumulate(v.begin(), v.end(), 0)` return for `v = {0.4, 0.4, 0.4}`, and why? How do you fix it?
:::

::: answer
It returns `0`. The result has the type of `init`, and `0` is an `int`. Each step computes `int + double` and stores it back into an `int`: $0 + 0.4 = 0.4 \to 0$, three times. Fix it by starting from `0.0`, which gives $1.2$ (to within rounding).
:::

::: check
A teammate replaces `std::accumulate` with `std::reduce` in a function that sums 50,000 `double` thrust samples, and a regression test that compares the sum to a stored value starts failing in the 12th significant digit. Is `reduce` broken?
:::

::: answer
No. `reduce` is allowed to group and order the additions any way it likes, and floating-point addition rounds differently under different groupings: for example $(10^{16} + 1) + 1 = 10^{16}$ but $10^{16} + (1 + 1) = 10^{16} + 2$. The new sum is equally good, but it is not the same bits. Either keep `accumulate` where exact repeatability matters, or change the test to compare with a tolerance.
:::

::: check
Write one line that sets `ok` to true when every element of a `std::array<double, 12> temps` lies between −40 and 85 °C. What does it return if the array were replaced by an empty `std::vector<double>`?
:::

::: answer
```cpp
bool ok = std::all_of(temps.begin(), temps.end(),
                      [](double t) { return t >= -40.0 && t <= 85.0; });
```

On an empty range `all_of` returns `true`: there is no element to break the rule. That is why a health check should also check the range is not empty when "nothing arrived" is itself a fault.
:::

::: check
Using `partial_sum`, what running totals come out of the velocity changes $\{0.5, 0.5, -0.2, 1.0\}\,\mathrm{m/s}$? And what does `inner_product` give for $(1, 2, 3)$ and $(4, -5, 6)$ from `0.0`?
:::

::: answer
Running totals: $0.5$, then $0.5 + 0.5 = 1.0$, then $1.0 - 0.2 = 0.8$, then $0.8 + 1.0 = 1.8\,\mathrm{m/s}$.

Inner product: $0 + 1 \times 4 + 2 \times (-5) + 3 \times 6 = 4 - 10 + 18 = 12$.
:::

::: check
Following the shape of `my_count_if`, what three operations must an iterator support to be used in a loop like `for (; first != last; ++first)` reading `*first`? Why can such a template never make a vector shorter?
:::

::: answer
It must support `!=` (to test for the end), `++` (to step forward) and `*` (to read the element). The template receives only those two iterators, never the container. An iterator can read and write the element it points at, but it has no way to reach the vector's size or free its storage. So an algorithm can move values around inside the range, but only a container member function such as `erase` can change the size.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| algorithm template | a loop over `[first, last)` | uses `!=`, `++`, `*` only; cannot resize a container |
| `transform` | change every element | output must have room, or use `back_inserter` |
| `accumulate` | left fold, in order | result type is the type of `init`; start doubles at `0.0` |
| `reduce` | fold in any grouping | faster, parallel-ready; float sums may differ; op must be associative and commutative |
| `copy_if` | copy the ones that pass | usually into a `back_inserter` |
| `all_of`, `any_of`, `none_of` | yes-or-no about the whole range | stop early; empty range gives true, false, true |
| `clamp` | hold a value in `[lo, hi]` | undefined if `lo > hi`; store the result by value |
| `rotate` | turn the range so `middle` is first | returns the old first's new position |
| `unique` | drop consecutive duplicates | sort first; returns the new logical end, does not shrink |
| `iota`, `partial_sum`, `inner_product` | count up, running total, sum of products | in `<numeric>` |

Next lesson: why `unique` and `remove` leave the container the same size, the one-line idiom that finishes the job, C++20's `std::erase_if` — and how an execution policy lets `transform`, `reduce` and `sort` run on several cores at once.

::: context deduction How the compiler finds It and Pred
At the call `my_count_if(temps.begin(), temps.end(), hot)`, the compiler looks at the arguments. The first two have type `std::vector<double>::const_iterator`, so `It` becomes that. The third is the lambda's own unnamed class, so `Pred` becomes that. Then it writes a real function with those types filled in, and calls it. The call on the `std::array<int, 5>` makes a second, separate function. Because each copy knows the exact lambda type, the compiler can put the lambda's body straight into the loop, so an algorithm with a lambda is usually as fast as the hand loop. The templates module, next in the course, covers deduction in full.
:::

::: context fold Folds: one shape, many names
Other languages call a fold `reduce`, `inject` or `foldl`. The picture shows the two shapes this lesson meets. A left fold is a long chain: each step waits for the one before it. A tree-shaped fold adds pairs, then pairs of pairs, and its pieces can run at the same time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">accumulate: a chain</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">reduce may do: a tree</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="40">x0</text><text x="60" y="40">x1</text><text x="100" y="40">x2</text><text x="140" y="40">x3</text>
    <text x="210" y="40">x0</text><text x="250" y="40">x1</text><text x="290" y="40">x2</text><text x="330" y="40">x3</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <path d="M20,46 L40,76 M60,46 L40,76"/>
    <path d="M40,82 L70,112 M100,46 L70,112"/>
    <path d="M70,118 L105,148 M140,46 L105,148"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2">
    <circle cx="40" cy="79" r="6"/><circle cx="70" cy="115" r="6"/><circle cx="105" cy="151" r="6"/>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <path d="M210,46 L230,86 M250,46 L230,86"/>
    <path d="M290,46 L310,86 M330,46 L310,86"/>
    <path d="M230,92 L270,136 M310,92 L270,136"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1.2">
    <circle cx="230" cy="89" r="6"/><circle cx="310" cy="89" r="6"/><circle cx="270" cy="139" r="6"/>
  </g>
  <text x="140" y="120" font-size="11" fill="#6c7a93">3 steps in a row</text>
  <text x="270" y="162" font-size="11" fill="#6c7a93" text-anchor="middle">2 levels; the two pairs at once</text>
</svg>
```

Both use three additions for four numbers. The tree finishes in two levels instead of three steps, and with many numbers the difference grows.
:::

::: context floating-spacing Why 1 vanishes next to 10^16
A `double` stores about 16 significant decimal digits. Near $1$ the gap between neighboring doubles is about $2.2 \times 10^{-16}$. Near $10^{6}$ it is about $1.2 \times 10^{-10}$. Near $10^{16}$ it is exactly $2$. So $10^{16} + 1$ lands halfway between two doubles, and the rule "round halfway to the even one" sends it back to $10^{16}$. The gap grows with the size of the number, which is why adding many small values to one large running total loses the most.
:::

::: context ring-buffer Rotating without moving
`std::rotate` physically moves every element. A ring buffer instead keeps the data still and moves an index: the newest sample overwrites the oldest slot, and "the front" is wherever the index says. That makes adding a sample one write, whatever the length. Flight software uses ring buffers for sensor histories and telemetry queues for exactly that reason. Rotating a 5-element array is cheap. Rotating a 10,000-element history 1,000 times a second is not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">rotate, then write 6 at the back: every sample moves</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="28" width="40" height="28"/><rect x="50" y="28" width="40" height="28"/><rect x="90" y="28" width="40" height="28"/><rect x="130" y="28" width="40" height="28"/>
  </g>
  <rect x="170" y="28" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="47">2</text><text x="70" y="47">3</text><text x="110" y="47">4</text><text x="150" y="47">5</text><text x="190" y="47">6</text>
  </g>
  <text x="10" y="86" font-size="12" fill="#1f2a44">ring buffer: overwrite the oldest slot, move the index</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="50" y="96" width="40" height="28"/><rect x="90" y="96" width="40" height="28"/><rect x="130" y="96" width="40" height="28"/><rect x="170" y="96" width="40" height="28"/>
  </g>
  <rect x="10" y="96" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="115">6</text><text x="70" y="115">2</text><text x="110" y="115">3</text><text x="150" y="115">4</text><text x="190" y="115">5</text>
  </g>
  <polygon points="70,128 64,140 76,140" fill="#b4232c"/>
  <text x="84" y="140" font-size="11" fill="#b4232c">oldest is now here: 1 write</text>
</svg>
```

Both hold the samples 2 to 6. The array keeps them in time order by moving them; the ring buffer keeps them still and remembers where the oldest one is.
:::

::: context iota A letter borrowed from APL
`std::iota` is named after the Greek letter iota, ι. In APL, a programming language Kenneth Iverson designed in the 1960s, the symbol ι applied to a number n produced the list of the first n whole numbers. The C++ function borrowed the name for the same job: counting up from a start value. It is pronounced "eye-OH-tuh".
:::

::: context dot-product The dot product in guidance
The dot product of a unit direction with a vector gives the part of the vector along that direction. Guidance software uses it constantly: the part of the velocity along the thrust axis, the angle between a star tracker's line of sight and the Sun (from $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}||\mathbf{b}|\cos\theta$), or whether a target is ahead or behind. `inner_product` computes it for any length of vector. In the linear-algebra modules you will meet it as a row times a column.
:::
