---
id: l09-erase-remove-and-parallel
title: Removing elements, and running algorithms in parallel
minutes: 23
covers:
  - The erase-remove idiom and C++20 std::erase_if
  - Execution policies and parallel algorithms
---

Picture an egg carton with twelve cups. Some eggs are cracked. You take the cracked ones out and slide every good egg toward the left end, so the good ones sit together with no gaps. Now look at the carton. It still has twelve cups. The good eggs fill the first few, and the cups on the right hold whatever was left there. You tidied the eggs, but you did not make the carton any smaller. To do that, you need scissors — and the scissors belong to the carton, not to your hands.

That is exactly how removing elements works in C++. The algorithm `std::remove` is your hands: it slides the good elements together. The container's own `erase` is the scissors: only it can make the container shorter. Forget either step and you get one of the most common bugs in C++ code, one that compiles without a single warning. This lesson shows both steps, the one-line idiom that does them together, and C++20's `std::erase_if`, which does it all in one call.

The second half of the lesson is about speed. Last lesson you saw that `std::reduce` may regroup its additions. That freedom exists so the library can split work across several processor cores. An **execution policy** is the extra first argument that gives the library permission to do that. You will see what each policy allows, what it forbids, and what really happens when you compile such code with g++ on a machine without the parallel library it needs.

## What std::remove really does

`std::remove(first, last, value)`, from `<algorithm>`, walks the range once. Every element that is *not* equal to `value` is moved forward to fill the next free place at the front, keeping its order. When it is done, it returns an iterator to the spot right after the last kept element: the **new logical end**. `std::remove_if(first, last, pred)` does the same, but drops the elements for which the predicate says yes.

The range is still the same length. The part from the new logical end to `last` — the **tail** — holds values the standard calls **[[unspecified|unspecified]]**: each is a valid object, but you may not rely on what it holds.

Why can't `remove` shrink the vector? Lesson 08 gave the reason. An algorithm receives only two iterators, never the container. An iterator can read and write the element it points at, but it cannot reach the vector's size or free its memory. So no algorithm in `<algorithm>` can ever change how many elements a container has. [[Only the container can do that|who-can-shrink]], with a member function such as `erase`.

`v.erase(first, last)` destroys the elements in `[first, last)` and shrinks the vector to match. Put the two together and you get the **erase-remove idiom**:

```cpp
v.erase(std::remove(v.begin(), v.end(), 0), v.end());
```

Read it from the inside out: "remove the zeros, which gives the new end; then erase everything from the new end to the real end". The inner call tidies. The outer call cuts.

::: key The erase-remove idiom
`std::remove` does not remove: it shifts the surviving elements forward and returns the new logical end, leaving the tail unspecified. You must call `container.erase(new_end, end())` to actually shrink. C++20 `std::erase_if` does both in one call.
:::

::: example Four ways to drop the dropped frames
A buffer holds six telemetry frame numbers. A `0` marks a frame that was lost. We try four ways of getting rid of the zeros, and then C++20's `std::erase_if` with a different test.

```cpp
#include <algorithm>
#include <cstdio>
#include <vector>

void show(const char* name, const std::vector<int>& v) {
    std::printf("%-22s size %zu:", name, v.size());
    for (int x : v) std::printf(" %d", x);
    std::printf("\n");
}

int main() {
    const std::vector<int> frames{3, 0, 5, 0, 0, 8};   // 0 marks a dropped frame
    show("start", frames);

    std::vector<int> a = frames;
    auto new_end = std::remove(a.begin(), a.end(), 0);
    show("remove alone", a);
    std::printf("%-22s new_end is index %td\n", "", new_end - a.begin());

    std::vector<int> b = frames;
    b.erase(std::remove(b.begin(), b.end(), 0));         // one argument: the bug
    show("erase(one iterator)", b);

    std::vector<int> c = frames;
    c.erase(std::remove(c.begin(), c.end(), 0), c.end()); // the idiom
    show("erase(new_end, end)", c);

    std::vector<int> d = frames;
    auto gone = std::erase(d, 0);                         // C++20
    show("std::erase", d);
    std::printf("%-22s removed %zu\n", "", gone);

    std::vector<int> e = frames;
    gone = std::erase_if(e, [](int x) { return x < 4; });  // C++20
    show("std::erase_if(x < 4)", e);
    std::printf("%-22s removed %zu\n", "", gone);
}
```

Output, g++ 13.3 at `-O2`:

```text
start                  size 6: 3 0 5 0 0 8
remove alone           size 6: 3 5 8 0 0 8
                       new_end is index 3
erase(one iterator)    size 5: 3 5 8 0 8
erase(new_end, end)    size 3: 3 5 8
std::erase             size 3: 3 5 8
                       removed 3
std::erase_if(x < 4)   size 2: 5 8
                       removed 4
```

Line by line.

1. **remove alone.** The keepers 3, 5, 8 slid to the front, in order. The size is still 6. The tail, `0 0 8`, is whatever this library happened to leave — here, the old values that were never overwritten. Printing the whole vector makes it look as if "nothing was removed" and a stray 8 appeared. `new_end` points at index 3, right after the three keepers.
2. **erase with one iterator.** `erase(it)` with a *single* iterator erases *one* element — the one at `it`. So it erased index 3, one zero from the tail, and left a vector of five with junk in it. It compiles, because `erase` has both forms. If nothing had been removed, `new_end` would equal `end()`, and erasing the element at `end()` is undefined behaviour.
3. **The idiom.** `erase(new_end, end())` cut the whole tail. Size 3, contents 3 5 8. Correct.
4. **`std::erase(d, 0)`** did the same in one call and returned the count removed, 3.
5. **`std::erase_if`** with "less than 4" dropped the 3 and all three zeros — four elements — and kept 5 and 8.

Sanity check: six elements in, three zeros, so three should survive the zero-removal: 3, 5 and 8, in their original order. Every correct version agrees, and the counts plus the survivors add back to six ($3 + 3$ and $4 + 2$).
:::

::: warning remove alone, and erase alone
The two halves of the idiom each fail on their own, and neither g++ 13 nor clang++ 18 warns about either with `-Wall -Wextra`:

- **`remove` alone** — `std::remove(v.begin(), v.end(), 0);` with the result thrown away. The size never changes, and the tail still holds stale values, so loops over `v` see "removed" data.
- **`erase` alone** — `v.erase(std::remove(v.begin(), v.end(), 0));` with the second argument forgotten. It erases one element instead of the tail, and is undefined behaviour when nothing matched.

When you see `std::remove` or `std::unique` in a review, look for the `erase(…, v.end())` around it. On C++20, write `std::erase` or `std::erase_if` and the question disappears.
:::

## The loop that erases one at a time

There is a third way people remove elements, and it is the one they write before they know the idiom: a loop that erases each bad element as it finds it. The first version usually looks like this:

```cpp
for (auto it = v.begin(); it != v.end(); ++it)
    if (is_bad(*it)) v.erase(it);        // bug: it is invalid after erase
```

Lesson 06's rule for `vector` says `erase` invalidates every iterator at or after the erased position. So `it` is dangling the moment `erase` returns, and `++it` is undefined behaviour. The fix uses the iterator that `erase` returns, which points at the element after the erased one:

```cpp
for (auto it = v.begin(); it != v.end();) {
    if (is_bad(*it)) it = v.erase(it);   // erase returns the next valid iterator
    else ++it;
}
```

That version is correct. But it is slow, and slow in a way that grows badly. Every `erase` in the middle of a vector slides *all* the later elements one place left. Erase many elements and the same elements are slid again and again.

::: example Counting the moves
We fill a vector with 10,000 samples numbered 0 to 9,999 and remove the odd ones, half of them, both ways. A small `Sample` type counts every time it is moved.

```cpp
#include <algorithm>
#include <cstdio>
#include <vector>

long long moves = 0;   // counts every move of a Sample

struct Sample {
    int value = 0;
    Sample(int v) : value(v) {}
    Sample(const Sample&) = default;
    Sample& operator=(const Sample&) = default;
    Sample(Sample&& o) noexcept : value(o.value) { ++moves; }
    Sample& operator=(Sample&& o) noexcept { value = o.value; ++moves; return *this; }
};

std::vector<Sample> make(int n) {
    std::vector<Sample> v;
    v.reserve(n);
    for (int i = 0; i < n; ++i) v.emplace_back(i);
    return v;
}

int main() {
    const int n = 10'000;
    auto odd = [](const Sample& s) { return s.value % 2 != 0; };

    std::vector<Sample> a = make(n);
    moves = 0;
    for (auto it = a.begin(); it != a.end();) {
        if (odd(*it)) it = a.erase(it);   // erase returns the next valid iterator
        else ++it;
    }
    std::printf("erase in a loop:  size %zu, %lld moves\n", a.size(), moves);

    std::vector<Sample> b = make(n);
    moves = 0;
    b.erase(std::remove_if(b.begin(), b.end(), odd), b.end());
    std::printf("erase-remove:     size %zu, %lld moves\n", b.size(), moves);
}
```

Output:

```text
erase in a loop:  size 5000, 24995000 moves
erase-remove:     size 5000, 4999 moves
```

Where the numbers come from.

1. **The loop.** The first odd sample, 1, sits at index 1 with 9,998 samples after it; erasing it slides all 9,998 left. The next odd one now sits at index 2 with 9,996 after it. Each erase slides two fewer than the one before: $9998 + 9996 + \cdots + 2 + 0$. That is 5,000 terms averaging $4{,}999$, so $5000 \times 4999 = 24{,}995{,}000$ moves.
2. **erase-remove.** `remove_if` walks once. Sample 0 is already in place. Each of the other 4,999 even samples moves exactly once, to its final place. Then `erase` destroys the 5,000-element tail, which moves nothing. Total: 4,999 moves.

Sanity check: the loop's cost grows like $n^2/4$ — here $10{,}000^2 / 4 = 25{,}000{,}000$, right next to the real count — while the idiom's grows like $n$. Double $n$ and the loop does four times the work; the idiom does twice. Both left the same 5,000 even samples.
:::

This is the second reason the idiom exists. It is not only shorter; it is **[[linear instead of quadratic|quadratic]]**.

::: key erase alone is the common bug
Erasing inside a loop with `v.erase(it); ++it;` uses an invalidated iterator — undefined behaviour. The corrected loop, `it = v.erase(it)`, works but moves elements $O(n^2)$ times. The erase-remove idiom (or `std::erase_if`) does one $O(n)$ pass.
:::

## C++20: std::erase and std::erase_if

C++20 added two free functions, declared in each container's own header:

- `std::erase(c, value)` removes every element equal to `value`;
- `std::erase_if(c, pred)` removes every element for which `pred` says yes.

Both return how many elements were removed. They work on every standard container — `vector`, `deque`, `string`, `list`, `forward_list`, and the `map`, `set` and unordered families — and each one does the right thing *for that container*:

- For `vector`, `deque` and `string`, it is the erase-remove idiom inside.
- For `list` and `forward_list`, it calls the list's own `remove_if` member, which unlinks the nodes. Nothing is moved.
- For `map`, `set` and the unordered containers, the idiom *cannot* work: their keys are `const`, so `std::remove_if` cannot move elements over them, and g++ rejects the call with "use of deleted function … `operator=`". `std::erase_if` instead walks the container with the `it = c.erase(it)` loop, which is fine here, because erasing a tree or hash node moves nothing else.

```cpp
std::map<int, double> last_seen{{101, 0.5}, {102, 7.0}, {103, 0.1}, {104, 9.5}};   // channel -> age in s
auto n = std::erase_if(last_seen, [](const auto& kv) { return kv.second > 5.0; });
// n is 2; channels 102 and 104, silent for more than 5 s, are gone; 2 remain
```

The lambda receives each map entry, a key-and-value pair; read `kv.second > 5.0` as "this channel's age is over 5 seconds". The `const auto&` parameter lets the compiler work out the entry's type; lesson 10 explains it.

The same two-step shape applies to `std::unique` from lesson 08: `v.erase(std::unique(v.begin(), v.end()), v.end());` after a sort leaves each value once.

## Execution policies: permission to split the work

Picture a supermarket with one checkout lane and a queue of a hundred shoppers. Open four lanes and the queue clears about four times faster — *if* the shoppers do not need to talk to each other, and *if* opening a lane is cheaper than the time it saves. Parallel algorithms are that trade.

Since C++17, most algorithms in `<algorithm>` and `<numeric>` have an extra form that takes an **execution policy** as its first argument. The policies live in the header `<execution>`:

| Policy | Read it as | May use several threads? | May vectorize? |
| --- | --- | --- | --- |
| `std::execution::seq` | sequenced | no, the calling thread only | no |
| `std::execution::par` | parallel | yes | no |
| `std::execution::par_unseq` | parallel and unsequenced | yes | yes |
| `std::execution::unseq` (C++20) | unsequenced | no, the calling thread only | yes |

A **[[thread|threads]]** is one line of execution — one worker. Several threads can run at once on a processor with several **cores**. To **[[vectorize|simd]]** means to handle several elements with one instruction, such as adding four `double`s at once.

```cpp
std::transform(std::execution::par, a.begin(), a.end(), out.begin(), f);
double total = std::reduce(std::execution::par_unseq, v.begin(), v.end(), 0.0);
std::sort(std::execution::par, v.begin(), v.end());
```

A policy is **permission, not a command**. The library may use as many threads as it likes, including one. What the policy really changes is what *you* promise:

- With **`par`**, your function may run at the same time on different threads, for different elements. It must not cause a **[[data race|data-race]]**: two threads touching the same memory at the same time, at least one of them writing, with nothing coordinating them. That is undefined behaviour. A `for_each` that does `++count` on one shared `int` is the classic case; use `std::count_if` or `std::reduce` instead, which combine the partial results safely.
- With **`par_unseq`** and **`unseq`**, the steps for different elements may also be interleaved *within one thread*. So your function must not take a lock or allocate memory either — a thread could end up waiting on a lock that it already holds, one step earlier.
- Under **every** policy, including `seq`, an exception that escapes your function calls `std::terminate`. The program ends. There is no `catch`.
- `reduce` and `transform_reduce` under a parallel policy may split the range differently on different machines or thread counts, so floating-point sums may differ in their last digits from run to run — last lesson's example, now with the grouping outside your control.

::: key Execution policies
`seq`: one thread, no vectorizing. `par`: may use many threads; your function must not race. `par_unseq`: many threads and vectorizing; no locks or allocation either. `unseq` (C++20): one thread, may vectorize. Policies grant permission, they do not guarantee parallelism. An exception escaping any policy calls `std::terminate`.
:::

::: warning Parallel is not always faster
Starting threads and splitting a range cost time. For a few thousand cheap elements — adding two numbers each — a parallel version is often *slower* than the plain one. Parallel algorithms pay off on large ranges with real work per element, like sorting ten million samples or evaluating a trajectory model for each of a million Monte Carlo cases. Measure before and after, on the machine that will run it.
:::

### What g++ actually does

The standard says what the policies allow. How they are carried out is up to the library, and here the details matter.

The library that ships with g++, libstdc++, runs `par` and `par_unseq` using Intel's **[[oneTBB|tbb]]** library (Threading Building Blocks). Two conditions must both hold:

1. When you compile, the TBB headers must be installed (the file `tbb/tbb.h`). If they are, libstdc++ switches its parallel back end on.
2. When you link, you must add `-ltbb`, so the TBB library itself is linked in.

If the headers are *not* installed, libstdc++ quietly uses a serial back end instead. The program compiles, runs and gives the right answers — on one thread. No warning says so.

On the machine used to write this lesson, TBB is not installed: `libtbb-dev` shows as "Installed: (none)". So this lesson does not quote any parallel timing. Here is what that machine does do.

::: example A parallel program, compiled without TBB
The program computes $\sin$ of a million angles with `par`, sums them with `par_unseq`, sorts them largest first with `par`, and checks for negatives with `unseq`.

```cpp
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <execution>
#include <functional>
#include <numeric>
#include <vector>

int main() {
    const std::size_t n = 1'000'000;
    std::vector<double> angle(n);
    std::iota(angle.begin(), angle.end(), 0.0);

    std::vector<double> s(n);
    std::transform(std::execution::par, angle.begin(), angle.end(), s.begin(),
                   [](double a) { return std::sin(a * 1e-6); });       // each element on its own

    const double total = std::reduce(std::execution::par_unseq, s.begin(), s.end(), 0.0);
    std::sort(std::execution::par, s.begin(), s.end(), std::greater<>{});
    const bool any_neg = std::any_of(std::execution::unseq, s.begin(), s.end(),
                                     [](double x) { return x < 0.0; });

    std::printf("sum of sin: %.6f\n", total);
    std::printf("largest:    %.6f\n", s.front());
    std::printf("any < 0:    %s\n", any_neg ? "yes" : "no");
}
```

First, the build with `-ltbb`, as the g++ documentation asks:

```text
$ g++ -std=c++20 -Wall -Wextra -O2 par.cpp -o par -ltbb
/usr/bin/ld: cannot find -ltbb: No such file or directory
collect2: error: ld returned 1 exit status
```

The **[[linker|linker]]** cannot find the TBB library, because it is not installed. Without `-ltbb` the build succeeds, with no warnings, and the program prints:

```text
sum of sin: 459697.273396
largest:    0.841470
any < 0:    no
```

Check the numbers.

1. **The angles** run from $0$ to $0.999999$ radians in steps of $10^{-6}$, so every sine is between $0$ and $\sin(0.999999) \approx 0.841470$. That is the "largest" line, and it is why no value is negative.
2. **The sum** of a million samples of $\sin x$ spaced $10^{-6}$ apart is close to the area under $\sin x$ from 0 to 1, divided by the spacing: $(1 - \cos 1) / 10^{-6} \approx 459{,}698$. The printed $459{,}697.27$ is within one, as a sum of steps that start at the low end should be.
3. **What ran.** Every call ran on one thread, through libstdc++'s serial back end. The answers are right; the program gained no speed. With `libtbb-dev` installed and `-ltbb` added, the same source would run `par` and `par_unseq` on several threads. Whether that is faster, and by how much, is something to measure on your own machine — not something this lesson can report.

Sanity check: Python's `math.fsum` of the same million sines gives $459{,}697.273396$ as well, so the policy changed nothing about the answer.
:::

### Where parallel algorithms belong in a spacecraft project

On the ground, they are welcome: log analysis, Monte Carlo dispersion runs, building star catalogs, sorting a day's telemetry. In a flight task with a hard deadline they are usually not allowed, for reasons you now know:

- the library may start threads you did not create and cannot schedule;
- the TBB back end allocates memory as it splits work;
- timing depends on what else the cores are doing, so the worst case is hard to bound;
- an exception ends the program with `std::terminate`.

Flight software that needs several cores gets them the explicit way: fixed threads, created at start-up, with fixed priorities. The concurrency and real-time modules later in this track build exactly that.

## Check yourself

::: check
After `auto it = std::remove_if(v.begin(), v.end(), is_stale);` on a vector of 20 elements, 6 of them stale, what are `v.size()` and `it - v.begin()`? What can you say about `v[15]`?
:::

::: answer
`v.size()` is still 20: `remove_if` cannot change the size. `it - v.begin()` is 14, because the 14 fresh elements were moved to the front, in order, and `it` points right after them. `v[15]` is in the tail, `[it, end())`. It is a valid object, so reading it is not undefined, but its value is unspecified — it might be an old value or a moved-from one. The fix is `v.erase(it, v.end());`, after which the size is 14.
:::

::: check
Explain what goes wrong in each line, for a `std::vector<int> v` that contains no zeros at all:

```cpp
v.erase(std::remove(v.begin(), v.end(), 0));
```
:::

::: answer
`std::remove` finds nothing to remove and returns `v.end()`. The single-argument `erase(pos)` then tries to erase the element *at* `v.end()` — which is not an element. That is undefined behaviour. When there *are* zeros, the same line erases only one element of the tail and leaves the rest. The line needs its second argument: `v.erase(std::remove(v.begin(), v.end(), 0), v.end());`, or on C++20, `std::erase(v, 0);`.
:::

::: check
About how many element moves does the erase-in-a-loop version need to remove every odd element from a vector of 20,000? And the erase-remove idiom?
:::

::: answer
The loop costs about $n^2 / 4$: $20{,}000^2 / 4 = 100{,}000{,}000$, four times the 25 million for 10,000, because the work grows with the square. (The exact count is $10{,}000 \times 9{,}999 = 99{,}990{,}000$.) The idiom moves each even element except the first exactly once: $10{,}000 - 1 = 9{,}999$ moves.
:::

::: check
Why does `std::remove_if` fail to compile on a `std::map`, and what should you write instead?
:::

::: answer
A map's elements are pairs whose key is `const`, because changing a key in place would break the tree's order. `remove_if` works by assigning kept elements over removed ones, and assigning to a pair with a `const` key is not allowed, so g++ reports a use of the deleted `operator=`. Use `std::erase_if(m, pred)` in C++20, or the loop `for (auto it = m.begin(); it != m.end();) it = pred(*it) ? m.erase(it) : std::next(it);`. Erasing a node from a tree moves no other elements, so the loop is not quadratic here.
:::

::: check
A teammate writes `std::for_each(std::execution::par, v.begin(), v.end(), [&](double x) { if (x > limit) ++count; });` with `int count = 0;`. What is wrong, and what is the fix?
:::

::: answer
With `par`, the lambda may run on several threads at once, and each one does `++count` on the same `int` with nothing coordinating them. That is a data race: undefined behaviour, and in practice a count that is sometimes too low. The fix is an algorithm that combines partial results safely: `auto count = std::count_if(std::execution::par, v.begin(), v.end(), [&](double x) { return x > limit; });`. Each thread counts its own piece, and the library adds the pieces together.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::remove`, `remove_if` | slide keepers forward | return the new logical end; size unchanged; tail unspecified |
| erase-remove idiom | tidy, then cut | `v.erase(std::remove(v.begin(), v.end(), x), v.end());` |
| one-argument `erase` | erases one element | with `remove`, a bug; UB when nothing matched |
| erase in a loop | `it = v.erase(it)` | correct but $O(n^2)$ moves on a vector |
| `std::erase`, `std::erase_if` | C++20, every container | return the count removed; the right method per container |
| `seq`, `par`, `par_unseq`, `unseq` | execution policies | permission, not a promise; exceptions call `terminate` |
| data race | unsynchronized shared write | undefined behaviour; use `count_if` or `reduce` |
| libstdc++ back end | Intel oneTBB | needs TBB headers and `-ltbb`; otherwise quietly serial |

Next lesson: lambdas in full. You have been reading `[]` and `[&]` as "uses nothing" and "uses the locals around it". Lesson 10 shows what the compiler builds for each, how capture by value and by reference differ, and why a stored `[&]` lambda is a classic dangling bug.

::: context unspecified "Valid but unspecified"
The standard uses this phrase for an object you may still use, but whose value you must not count on. You can assign it a new value or destroy it, and nothing breaks. You cannot expect it to hold anything in particular. It is the same state a moved-from object is left in, from the move-semantics lesson of the previous module. For a vector of `int`, this library leaves the old values in the tail; for a vector of strings, the tail may hold empty strings. Code must not depend on either.
:::

::: context who-can-shrink Hands and scissors
`std::remove` only ever writes through the iterators it was given. The vector's size lives inside the vector object, out of reach.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">before: size 6</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="24" width="40" height="28" fill="#8fb8f0"/><rect x="50" y="24" width="40" height="28" fill="#fff"/>
    <rect x="90" y="24" width="40" height="28" fill="#8fb8f0"/><rect x="130" y="24" width="40" height="28" fill="#fff"/>
    <rect x="170" y="24" width="40" height="28" fill="#fff"/><rect x="210" y="24" width="40" height="28" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="43">3</text><text x="70" y="43">0</text><text x="110" y="43">5</text><text x="150" y="43">0</text><text x="190" y="43">0</text><text x="230" y="43">8</text>
  </g>
  <text x="10" y="76" font-size="12" fill="#1f2a44">after remove: still size 6</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="84" width="40" height="28" fill="#8fb8f0"/><rect x="50" y="84" width="40" height="28" fill="#8fb8f0"/>
    <rect x="90" y="84" width="40" height="28" fill="#8fb8f0"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3" fill="#fff">
    <rect x="130" y="84" width="40" height="28"/><rect x="170" y="84" width="40" height="28"/><rect x="210" y="84" width="40" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="103">3</text><text x="70" y="103">5</text><text x="110" y="103">8</text>
  </g>
  <g font-size="13" fill="#6c7a93" text-anchor="middle">
    <text x="150" y="103">?</text><text x="190" y="103">?</text><text x="230" y="103">?</text>
  </g>
  <polygon points="130,118 124,130 136,130" fill="#b4232c"/>
  <text x="130" y="146" font-size="11" fill="#b4232c" text-anchor="middle">new_end</text>
  <text x="258" y="103" font-size="11" fill="#1f2a44">erase(new_end, end())</text>
  <text x="258" y="118" font-size="11" fill="#1f2a44">cuts this tail</text>
</svg>
```
:::

::: context quadratic Why quadratic hurts
"Quadratic" means the work grows with the square of the size: ten times the data, a hundred times the work. At 100 elements the erase loop does about 2,500 moves, which nobody notices. At 100,000 it does about 2.5 billion, which is slow enough to notice. That is why quadratic code passes every small unit test and then stalls on a real day's telemetry. When a loop inside a loop both walk the whole range, suspect it.
:::

::: context threads Threads and cores
A **core** is one piece of a processor that runs instructions. A **thread** is one sequence of instructions the operating system schedules onto a core. A four-core laptop can run four threads truly at once. A parallel algorithm splits its range into chunks and gives one to each thread, then combines the results.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">seq: one thread does every chunk</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#8fb8f0">
    <rect x="10" y="26" width="80" height="18"/><rect x="90" y="26" width="80" height="18"/>
    <rect x="170" y="26" width="80" height="18"/><rect x="250" y="26" width="80" height="18"/>
  </g>
  <text x="10" y="68" font-size="12" fill="#1f2a44">par: four threads, one chunk each, then combine</text>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#f2b880">
    <rect x="10" y="76" width="80" height="12"/><rect x="10" y="90" width="80" height="12"/>
    <rect x="10" y="104" width="80" height="12"/><rect x="10" y="118" width="80" height="12"/>
  </g>
  <rect x="92" y="96" width="14" height="14" fill="#b4232c"/>
  <text x="112" y="108" font-size="11" fill="#6c7a93">combine; starting threads also costs time</text>
</svg>
```
:::

::: context simd One instruction, four numbers
Modern processors have **SIMD** instructions — "single instruction, multiple data". One AVX instruction on an x86 processor adds four pairs of `double`s at once, using registers 256 bits wide. The compiler often does this by itself for a plain loop, but only when it may reorder the steps. `unseq` and `par_unseq` give that permission for an algorithm. It is also why these policies ban locks: four elements handled by one instruction cannot each stop to wait.
:::

::: context data-race Why a data race is undefined
`++count` looks like one step but is three: read the value, add one, write it back. Two threads can both read 41, both add one, and both write 42 — one increment lost. The C++ standard goes further than "the answer may be wrong": any data race makes the whole program's behaviour undefined, which lets compilers optimise as if races never happen. The concurrency module later in this track covers the tools that make shared data safe: atomics and mutexes.
:::

::: context tbb Where libstdc++'s parallel algorithms came from
Intel developed a "Parallel STL" implementation on top of its Threading Building Blocks library and contributed it to GCC, which shipped it in version 9. TBB is now an open-source project called oneTBB. On Ubuntu, installing the package `libtbb-dev` provides both the headers and the library. Other standard libraries made other choices: Microsoft's implements parallel algorithms on the Windows thread pool, and needs no extra library.
:::

::: context linker The linker, again
The compiler turns each source file into object code. The linker then joins that code with the libraries it uses into one program. `-ltbb` says "also link the library named tbb", which the linker looks for as a file like `libtbb.so`. "Cannot find -ltbb" means that file is not in any directory the linker searches — here, because it was never installed. You met the linker and its errors in the first C++ module.
:::
