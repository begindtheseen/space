---
id: l07-sorting-and-searching
title: Sorting and searching
minutes: 24
covers:
  - "Algorithms: sort, stable_sort, nth_element, lower_bound, binary_search, find_if"
---

Think of a shelf of library books. If the books are in no order, the only way to find one is to walk along the shelf and read every spine until you hit it. If they are in order by author, you can open the shelf in the middle, see whether your author comes before or after, and throw away half the shelf in one look. Do that again and again and you find any book in a handful of looks, however long the shelf is.

That is the whole story of this lesson. Putting things in order costs work once. Finding things in an ordered range is then far cheaper, every time. And sometimes you do not need the whole shelf in order at all — you only need to know which book would be the 95th out of 100 — and there is a tool that does exactly that much work and no more.

The C++ standard library gives you each of these as a ready-made **algorithm** — a function template in the header `<algorithm>` that works on any range you hand it as a pair of iterators. In flight software they show up everywhere: sorting telemetry events by priority before they go down the radio link, looking up a channel id in a fixed table inside a 1 kHz control loop, and finding the worst latencies of a task among millions of test samples on the ground.

## Ranges, iterators and a first lambda

Every algorithm in this lesson takes a **range** written as two iterators, `first` and `last`. Recall from lesson 06 that an iterator is a bookmark into a container. `v.begin()` marks the first element, and `v.end()` marks the spot *one past* the last element. The range `[first, last)` — read "from first, up to but not including last" — is called a **[[half-open range|half-open]]**. An empty range has `first == last`.

Many algorithms also take a small function that says *how* to compare or *what* to look for. The shortest way to write one is a **lambda**, a function written in place, without a name. You glimpsed them in the previous module. Here is one:

```cpp
[](const Event& a, const Event& b) { return a.priority < b.priority; }
```

Read it as: "a small unnamed function that takes two events, `a` and `b`, and returns true when `a`'s priority is less than `b`'s". The empty `[]` at the front means it uses nothing from the code around it. When it is `[&]` instead, it may read and change the local variables around it. That is all you need for now. Lesson 10 teaches lambdas fully — what `[]` and `[&]` really do, and when each one is dangerous.

## std::sort

`std::sort(first, last)` puts the range in increasing order, using `<` to compare. Give it a third argument, a comparison function, and it uses that instead:

```cpp
std::sort(v.begin(), v.end());                                  // smallest first, by <
std::sort(v.begin(), v.end(), std::greater<>{});                // largest first
std::sort(log.begin(), log.end(),
          [](const Event& a, const Event& b) { return a.priority < b.priority; });
```

`std::greater<>{}` (from `<functional>`) is a ready-made comparison object that returns `a > b`.

**How much work?** For a range of $n$ elements, `std::sort` makes about $n \log_2 n$ comparisons, written $O(n \log n)$ and read "order n log n". The $O(\ldots)$ says how the work grows as $n$ grows, ignoring the constant in front. Since C++11 the standard promises $O(n \log n)$ comparisons even in the *worst* case, not only on average. Library writers meet that promise with a method called **[[introsort|introsort]]**: a fast quicksort that switches to a slower but guaranteed method if it notices it is going badly.

`std::sort` needs **random-access iterators** — iterators that can jump straight to any position, like a `vector`'s, an `array`'s or a `deque`'s. A `std::list` iterator can only step one node at a time, so this does not compile:

```cpp
std::list<int> l{3, 1, 2};
std::sort(l.begin(), l.end());   // error
```

g++ 13 buries the reason deep inside the library, but the first error line names it:

```text
/usr/include/c++/13/bits/stl_algo.h:1948:50: error: no match for 'operator-' (operand types are 'std::_List_iterator<int>' and 'std::_List_iterator<int>')
```

`sort` tried to subtract two iterators to measure the distance between them, and list iterators cannot do that. A list sorts itself instead, with its member function `l.sort()`.

### The rule your comparison must follow

The comparison must behave like `<`, not like `<=`. The precise name is a **[[strict weak ordering|strict-weak]]**: comparing an element with itself must return false, and if `a` comes before `b` and `b` before `c`, then `a` must come before `c`. Two elements where neither comes before the other count as **equivalent** — tied.

::: warning Never sort with <=
`std::sort(v.begin(), v.end(), [](int a, int b) { return a <= b; })` breaks the rule, because it says every element comes before itself. That is undefined behaviour. It may seem to work on a small test, and then, on a large range with many equal values, read past the end of the array and crash. If you want "largest first", use `>` or `std::greater<>{}`. Never add the `=`.
:::

## std::stable_sort: keep the ties in order

Picture a stack of mail you sort by zip code. Two letters to the same zip code were in some order before you started — say, by the date they arrived. A **stable** sort promises that tied elements stay in the order they had before. An unstable one makes no promise at all.

`std::sort` is not stable. `std::stable_sort` is. That matters when the order you started with carries meaning. A telemetry log arrives in time order. You sort it by priority so the urgent events go down the link first. Within each priority, the events must still be in time order, or the ground sees a thruster "close" before its "open".

::: example Sorting a telemetry log by priority
A log of 1,000 events arrives in time order, one every millisecond, with priorities 0, 1 and 2 mixed together. We sort one copy with `std::sort` and one with `std::stable_sort`, both by priority only. Then we count how many neighbours with the *same* priority ended up out of time order.

```cpp
#include <algorithm>
#include <cstdio>
#include <vector>

struct Event { int priority; int t_ms; };

int broken_pairs(const std::vector<Event>& v) {
    int bad = 0;
    for (std::size_t i = 1; i < v.size(); ++i)
        if (v[i].priority == v[i - 1].priority && v[i].t_ms < v[i - 1].t_ms) ++bad;
    return bad;
}

int main() {
    std::vector<Event> log;
    for (int t = 0; t < 1000; ++t) log.push_back({(t * 7) % 3, t});  // priorities 0,1,2 in time order

    auto by_priority = [](const Event& a, const Event& b) { return a.priority < b.priority; };

    std::vector<Event> a = log, b = log;
    std::sort(a.begin(), a.end(), by_priority);
    std::stable_sort(b.begin(), b.end(), by_priority);

    std::printf("sort:        %d neighbours out of time order\n", broken_pairs(a));
    std::printf("stable_sort: %d neighbours out of time order\n", broken_pairs(b));
    std::printf("stable_sort first four: ");
    for (int i = 0; i < 4; ++i) std::printf("(p%d, %d ms) ", b[i].priority, b[i].t_ms);
    std::printf("\n");
}
```

Output, g++ 13.3 at `-O2`:

```text
sort:        500 neighbours out of time order
stable_sort: 0 neighbours out of time order
stable_sort first four: (p0, 0 ms) (p0, 3 ms) (p0, 6 ms) (p0, 9 ms)
```

Step by step. The expression `(t * 7) % 3` gives priority 0 to times 0, 3, 6, 9 and so on, so about a third of the events have each priority. Both sorts put every priority-0 event before every priority-1 event — both did their job on the key. But `std::sort` scrambled the times inside each group: 500 of the neighbouring pairs are backwards. `stable_sort` left all of them in time order, and the first four priority-0 events come out at 0, 3, 6 and 9 ms, exactly as they arrived.

Sanity check: the 500 belongs to this library and this input; another library could scramble a different number. Only the zero from `stable_sort` is guaranteed.
:::

**The price.** `stable_sort` makes $O(n \log n)$ comparisons when it can get a spare buffer of memory about the size of the range, and $O(n \log^2 n)$ when it cannot. So it usually allocates. In a loop with a strict time budget that is a real cost, and one reason flight code prefers to avoid sorting at run time at all.

::: key sort and stable_sort
`std::sort` is $O(n \log n)$, needs random-access iterators, and may reorder equal elements. `std::stable_sort` keeps equal elements in their original order, is $O(n \log n)$ with a spare buffer and $O(n \log^2 n)$ without, and usually allocates that buffer. The comparison must be a strict weak ordering: use `<`, never `<=`.
:::

## std::nth_element: only as much order as you need

Suppose a teacher wants to know the score that splits the class into the top five and everyone else. She does not need to rank all thirty students. She needs to find one score and put everyone higher on one side and everyone lower on the other.

`std::nth_element(first, nth, last)` does exactly that. After it runs:

- the element at position `nth` is the one that *would* be there if the whole range were sorted;
- everything before `nth` is less than or equal to it;
- everything after `nth` is greater than or equal to it.

Nothing else is promised. The two sides are in no particular order inside themselves. This is **partial selection**, and it runs in $O(n)$ time on average — linear, like one or two passes over the data — instead of the $O(n \log n)$ of a full sort. The method behind it is a cousin of quicksort called **[[quickselect|quickselect]]**.

That makes it the right tool for a **median** (the middle value) or any **[[percentile|percentile]]** of a big sample, such as the run times of a flight task measured millions of times on test hardware.

To find the $p$-th percentile of $N$ samples by the "nearest rank" rule, you want the element at zero-based position

$$
k = \left\lceil \frac{p}{100} N \right\rceil - 1.
$$

The brackets $\lceil \cdot \rceil$ are read "ceiling of", which means "round up to a whole number". The $-1$ is there because C++ counts positions from zero.

::: example The 95th percentile of ten million latencies
We make ten million fake task latencies in microseconds from a seeded random generator (a later lesson in this module covers `<random>`; here it only fills the vector with the same numbers every run). Then we find the 95th percentile twice: once with `nth_element` and once with a full `sort`. A counting lambda records how many comparisons each one makes.

```cpp
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <random>
#include <vector>

int main() {
    constexpr std::size_t N = 10'000'000;
    std::mt19937 gen(42);                                   // fixed seed: same data every run
    std::lognormal_distribution<double> latency(4.0, 0.5);  // microseconds, median about 55
    std::vector<double> samples(N);
    for (double& x : samples) x = latency(gen);

    const std::size_t k = (N * 95 + 99) / 100 - 1;           // nearest rank: ceil(0.95 N) - 1
    std::printf("k = %zu\n", k);

    std::vector<double> a = samples, b = samples;
    long long ca = 0, cb = 0;

    auto t0 = std::chrono::steady_clock::now();
    std::nth_element(a.begin(), a.begin() + k, a.end(),
                     [&](double x, double y) { ++ca; return x < y; });
    auto t1 = std::chrono::steady_clock::now();
    std::sort(b.begin(), b.end(),
              [&](double x, double y) { ++cb; return x < y; });
    auto t2 = std::chrono::steady_clock::now();

    using ms = std::chrono::milliseconds;
    std::printf("nth_element: p95 = %.3f us, %lld comparisons, %lld ms\n", a[k], ca,
                (long long)std::chrono::duration_cast<ms>(t1 - t0).count());
    std::printf("sort:        p95 = %.3f us, %lld comparisons, %lld ms\n", b[k], cb,
                (long long)std::chrono::duration_cast<ms>(t2 - t1).count());

    bool left_ok = true, right_ok = true;
    for (std::size_t i = 0; i < k; ++i) left_ok  = left_ok  && a[i] <= a[k];
    for (std::size_t i = k; i < N; ++i) right_ok = right_ok && a[i] >= a[k];
    std::printf("left side all <= p95: %s, right side all >= p95: %s\n",
                left_ok ? "yes" : "no", right_ok ? "yes" : "no");
}
```

Output on one machine, g++ 13.3 at `-O2`:

```text
k = 9499999
nth_element: p95 = 124.294 us, 24726860 comparisons, 101 ms
sort:        p95 = 124.294 us, 277395014 comparisons, 911 ms
left side all <= p95: yes, right side all >= p95: yes
```

Walk through it.

1. **The position.** $0.95 \times 10{,}000{,}000 = 9{,}500{,}000$, already whole, so the ceiling changes nothing, and $k = 9{,}500{,}000 - 1 = 9{,}499{,}999$. The line `(N * 95 + 99) / 100` is the integer way to round up: adding 99 before dividing by 100 pushes any remainder up to the next whole number.
2. **Same answer.** Both methods give $124.294\,\mu\mathrm{s}$. They must: `nth_element` promises that `a[k]` is what the sorted array holds at `k`.
3. **The comparisons.** A full sort of $n$ items needs about $n \log_2 n$. Here $\log_2 10^7 \approx 23.3$, so $n \log_2 n \approx 2.33 \times 10^8$. The count of $2.77 \times 10^8$ is about 1.19 times that — the same size, as the theory says. `nth_element` made $2.47 \times 10^7$ comparisons, about $2.5$ per element. That is what "linear" looks like: a small constant times $n$. The ratio is about 11 to 1.
4. **The time.** On one machine, about 100 ms against about 900 ms. Timings vary between machines and runs; the comparison counts do not.
5. **The promise.** The last line checks the partition: every element before position `k` is at most the percentile, and every element from `k` on is at least it.

Sanity check: these latencies come from a log-normal distribution whose 95th percentile is $e^{4 + 0.5 \times 1.645} \approx 124.3\,\mu\mathrm{s}$. The sample value, $124.294$, is right next to it, as ten million samples should be.
:::

A close relative is `std::partial_sort(first, middle, last)`. It puts the smallest `middle - first` elements, *sorted*, at the front, and costs about $O(n \log m)$ for $m$ of them. Reach for it when you want the top ten in order. When you want one position, `nth_element` does less.

::: key nth_element
`std::nth_element` is partial selection. It places the nth element where it would be if sorted and partitions around it, in $O(n)$ average rather than $O(n \log n)$. It is the right tool for a median or a percentile of a large sample.
:::

::: warning It reorders your data
`nth_element`, like `sort`, rearranges the range in place. If you still need the original order, run it on a copy, as the example did.
:::

## Finding things: find, find_if, lower_bound, binary_search

Back to the library shelf. There are two ways to look for a book, and the choice depends on one question: is the shelf in order?

### Walking the shelf: find and find_if

`std::find(first, last, value)` checks every element in turn, from the front, and returns an iterator to the first one equal to `value`. If there is none, it returns `last`. That result, "not found means `last`", is how nearly every standard algorithm says "no".

`std::find_if(first, last, pred)` does the same, but instead of a value it takes a **predicate** — a function that answers yes or no about one element. It returns the first element for which the predicate says yes:

```cpp
auto it = std::find_if(temps.begin(), temps.end(), [](double t) { return t > 35.0; });
if (it != temps.end()) std::printf("first hot reading at index %td\n", it - temps.begin());
```

Read the lambda as "true when the temperature is above 35". Both searches are **linear**: $O(n)$, up to $n$ tests. Their strength is that they need no order at all.

### Halving the shelf: lower_bound and binary_search

When the range is sorted, you can do far better. `std::lower_bound(first, last, key)` returns the **first position whose element is not less than** `key`. If the key is there, that is the key's position. If it is not, that is exactly where you would insert it to keep the range sorted. It works by **[[binary search|halving]]**: look at the middle, keep the half that must contain the answer, repeat. For $n$ elements that takes about $\log_2 n$ comparisons.

`std::binary_search(first, last, key)` uses the same method but only returns a `bool`: there or not there. It cannot tell you *where*, so in real code you almost always want `lower_bound`. Its cousin `std::upper_bound` gives the first element *greater* than the key, and `std::equal_range` gives both ends of the run of equal elements at once.

::: example Looking up a telemetry channel
A spacecraft has 128 telemetry channels with ids 1, 8, 15, … 890 (every seventh number), stored sorted in a `std::array`. We look up id 638, which exists, and id 640, which does not, and count how many comparisons each method makes.

```cpp
#include <algorithm>
#include <array>
#include <cstdio>

int main() {
    std::array<int, 128> ids{};                    // telemetry channel ids, sorted
    for (int i = 0; i < 128; ++i) ids[i] = i * 7 + 1;   // 1, 8, 15, ..., 890

    int n = 0;                                     // comparison counter
    auto less = [&](int a, int b) { ++n; return a < b; };

    for (int key : {638, 640}) {
        n = 0;
        auto it = std::lower_bound(ids.begin(), ids.end(), key, less);
        std::printf("lower_bound(%d): index %td, value %d, %d comparisons\n",
                    key, it - ids.begin(), *it, n);

        n = 0;
        bool there = std::binary_search(ids.begin(), ids.end(), key, less);
        std::printf("binary_search(%d): %s, %d comparisons\n", key, there ? "true" : "false", n);

        n = 0;
        auto f = std::find_if(ids.begin(), ids.end(), [&](int x) { ++n; return x == key; });
        std::printf("find_if(%d): %s after %d tests\n", key,
                    f == ids.end() ? "end()" : "found", n);
    }
}
```

Output:

```text
lower_bound(638): index 91, value 638, 7 comparisons
binary_search(638): true, 8 comparisons
find_if(638): found after 92 tests
lower_bound(640): index 92, value 645, 7 comparisons
binary_search(640): false, 8 comparisons
find_if(640): end() after 128 tests
```

Read it line by line.

- **Id 638** is $91 \times 7 + 1$, so it lives at index 91. `lower_bound` found it in 7 comparisons, and $\log_2 128 = 7$ exactly: 128 halves to 64, 32, 16, 8, 4, 2, 1.
- **`binary_search`** took 8: the same 7 halvings, plus one more comparison to check whether the element it landed on is really equal to the key.
- **`find_if`** walked 92 elements (indices 0 to 91) before it hit 638.
- **Id 640** is not in the table. `lower_bound` still answers in 7 comparisons, pointing at index 92, value 645 — the first id not less than 640, and the place 640 would go. `find_if` had to test all 128 before giving up.

Sanity check: for a missing key a linear search pays the full $n$, while a binary search pays $\log_2 n$ either way — 128 against 7 here, a million against 20 for a million entries.
:::

That fixed bound is why a sorted `std::array` searched with `lower_bound` is a favourite shape for lookup tables in [[flight code|bounded-time]]. The worst case is known before the program ever runs. Exercise `cpp04_ex2` asks you to measure it against the tree and hash containers of lessons 02 and 03.

::: warning lower_bound does not say "found"
`lower_bound` always returns *a* position, even when the key is missing. You must check both that it is not `end()` and that the element there is really your key:

```cpp
auto it = std::lower_bound(ids.begin(), ids.end(), key);
bool found = (it != ids.end() && *it == key);
```

Using `*it` without those checks reads the wrong channel's data — or, when the key is larger than everything, reads past the end.
:::

::: warning Unsorted input gives quiet nonsense
`lower_bound` and `binary_search` *assume* the range is sorted by the same comparison you pass them. They do not check. On unsorted data they return a wrong answer with no error at all. If a table is sorted by id, search it by id. Only `find` and `find_if` are safe on an unsorted range.
:::

::: note Why halving takes log₂ n steps
Each comparison keeps at most half of the remaining candidates. After $s$ steps at most $n / 2^s$ remain. The search ends when one candidate is left, so $n / 2^s \le 1$, which means $2^s \ge n$, which means $s \ge \log_2 n$. Rounding up gives the worst case, $\lceil \log_2 n \rceil$. For 128 that is exactly 7. For 1,000 it is 10, because $2^{10} = 1024$ is the first power of two that reaches 1,000. That is the ideal count. The standard promises at most $\log_2 n + O(1)$ comparisons, and a real library can use one more: lesson 01 counted libstdc++'s `lower_bound` on a 128-entry table and saw 7 or 8, depending on the key.

There is one more detail. `std::lower_bound` counts comparisons, not steps. On a `vector` or an `array`, jumping to the middle is one step. On a `std::list`, reaching the middle means walking there node by node, so the comparisons are still $O(\log n)$ but the walking is $O(n)$. A `std::set` or `std::map` has its own member `lower_bound`, which uses the tree and is truly $O(\log n)$ — use that one on them.
:::

::: key lower_bound versus find versus binary_search
`lower_bound` gives the first position not less than the key, so it also tells you where to insert; `binary_search` returns only a `bool`; `find` (and `find_if`) is a linear scan that works on unsorted ranges. Only the first two require a sorted range. `lower_bound` and `binary_search` cost $O(\log n)$ comparisons; `find` costs $O(n)$.
:::

## The costs in one table

| Algorithm | Needs sorted input? | Iterators | Comparisons |
| --- | --- | --- | --- |
| `sort` | no | random access | $O(n \log n)$, worst case too |
| `stable_sort` | no | random access | $O(n \log n)$ with a buffer, $O(n \log^2 n)$ without |
| `nth_element` | no | random access | $O(n)$ average |
| `partial_sort` | no | random access | about $O(n \log m)$ for $m$ sorted |
| `find`, `find_if` | no | forward (any) | $O(n)$ |
| `lower_bound`, `upper_bound` | yes | forward (best with random access) | $O(\log n)$ |
| `binary_search` | yes | forward (best with random access) | $O(\log n)$, returns only `bool` |

A good habit: before a sort, ask whether you need the whole range in order; before a search, ask whether the range is sorted — and, if you search it often, whether it should be.

## Check yourself

::: check
A vector of 50 fault records is in time order. You must show them grouped by subsystem, and within each subsystem still in time order. Which algorithm, and what comparison?
:::

::: answer
`std::stable_sort` with a comparison on the subsystem only:

```cpp
std::stable_sort(faults.begin(), faults.end(),
                 [](const Fault& a, const Fault& b) { return a.subsystem < b.subsystem; });
```

Records with the same subsystem are ties for this comparison, and `stable_sort` promises to keep ties in the order they had — time order. `std::sort` would group them correctly but could scramble the times inside each group.
:::

::: check
You have 1,001 temperature readings and want the median. Which position do you ask `nth_element` for, and what do you know about the other 1,000 readings afterwards?
:::

::: answer
With 1,001 readings, the middle one has 500 readings on each side, so it is at zero-based position 500: `std::nth_element(v.begin(), v.begin() + 500, v.end());` and the median is `v[500]`.

Afterwards, `v[0]` to `v[499]` are all less than or equal to `v[500]`, and `v[501]` to `v[1000]` are all greater than or equal to it. Neither side is sorted inside itself. The work is linear on average, about the same as a couple of passes over the data.
:::

::: check
A sorted `std::array<int, 128>` holds channel ids. What do `std::lower_bound` and `std::binary_search` each return for a key that is not in the table, and which would you use to add the key while keeping the array sorted (if it had room)?
:::

::: answer
`binary_search` returns `false` and nothing else. `lower_bound` returns an iterator to the first element greater than the key (since none equals it), or `end()` if the key is larger than every element. That iterator is exactly the insertion point: put the key there and shift the rest right, and the order is kept. So you want `lower_bound`. Both take at most 7 comparisons, because $\log_2 128 = 7$.
:::

::: check
Why does `std::sort(v.begin(), v.end(), [](int a, int b) { return a <= b; })` count as a bug even if it seems to work on your test?
:::

::: answer
The comparison must be a strict weak ordering: an element must never come before itself. With `<=`, `a <= a` is true, so the rule is broken and the behaviour is undefined. It may pass small tests and then, on a big range with many equal elements, run past the end of the array. Use `<` for increasing order and `>` (or `std::greater<>{}`) for decreasing order.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `[first, last)` | a half-open range | `last` is one past the end; "not found" returns `last` |
| lambda as argument | an unnamed function written in place | `[]` uses nothing around it; lesson 10 teaches the rest |
| `sort` | full ordering | $O(n \log n)$ worst case; random access; not stable |
| strict weak ordering | the rule a comparison must obey | use `<`, never `<=` |
| `stable_sort` | full ordering, ties keep their order | $O(n \log n)$ with a buffer, usually allocates |
| `nth_element` | partial selection around one position | $O(n)$ average; median and percentiles |
| nearest-rank percentile | position of the $p$-th percentile | $k = \lceil pN/100 \rceil - 1$ |
| `find`, `find_if` | linear search | $O(n)$; no order needed |
| `lower_bound` | first element not less than the key | $O(\log n)$; also the insertion point; check `!= end()` and `== key` |
| `binary_search` | is it there? | $O(\log n)$; `bool` only |

Next lesson: the algorithms that *change* or *combine* values rather than order them — `transform`, `accumulate`, `reduce` and friends — and how to rewrite a loop-heavy function in terms of them without changing what it does.

::: context half-open Why "one past the end"
A half-open range $[a, b)$ includes $a$ and stops right before $b$. It has two tidy properties. Its length is $b - a$ with no plus or minus one. And an empty range is the natural case $a = b$, so an algorithm needs no special code for "nothing to do".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="30" y="30" width="50" height="34"/><rect x="80" y="30" width="50" height="34"/>
    <rect x="130" y="30" width="50" height="34"/><rect x="180" y="30" width="50" height="34"/>
  </g>
  <rect x="230" y="30" width="50" height="34" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="52">3</text><text x="105" y="52">1</text><text x="155" y="52">4</text><text x="205" y="52">1</text>
  </g>
  <text x="55" y="20" font-size="12" fill="#1d6fd1" text-anchor="middle">begin()</text>
  <text x="255" y="20" font-size="12" fill="#b4232c" text-anchor="middle">end()</text>
  <text x="180" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">4 elements: end() - begin() = 4</text>
  <text x="255" y="52" font-size="11" fill="#6c7a93" text-anchor="middle">no element</text>
</svg>
```

`end()` marks a place, not an element, so it must never be read with `*`.
:::

::: context introsort A sort that watches itself
Quicksort is fast on almost every input, but a few unlucky inputs make it take about $n^2$ steps. Heapsort always takes about $n \log n$ steps but is slower in practice. David Musser described **introsort** ("introspective sort") in 1997: run quicksort, count how deep the recursion goes, and if it passes about $2 \log_2 n$, switch that part to heapsort. The library that ships with g++ does this, and finishes with an insertion sort over the nearly sorted result, which is quick on small pieces. The mix gives quicksort's speed with heapsort's worst case.
:::

::: context strict-weak What "strict weak ordering" means
"Strict" means nothing comes before itself: `comp(a, a)` is false. The ordering must also be consistent: if `a` comes before `b` and `b` before `c`, then `a` comes before `c`. "Weak" allows ties: two different elements may be equivalent, neither before the other, like two events with the same priority. The ties must also chain: if `a` ties with `b` and `b` ties with `c`, then `a` ties with `c`. Ordinary `<` on integers obeys all of this. `<=` breaks the "strict" part. Sorting doubles that include a NaN (a "not a number" value) breaks the tie-chaining part, because NaN compares false with everything.
:::

::: context quickselect Selection by throwing half away
Quickselect picks a **pivot** element and splits the range into "smaller than the pivot" and "larger than the pivot", as quicksort does. Then it checks which side the wanted position is on, and continues on that side only. The other side is never touched again. The work is about $n + n/2 + n/4 + \ldots$, which adds up to about $2n$. Tony Hoare published this idea in 1961, alongside quicksort. The g++ library guards it the same way as introsort: if the splits keep going badly, it switches to a slower method with a guaranteed bound.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">pass 1: all n elements</text>
  <rect x="20" y="58" width="160" height="22" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="180" y="58" width="160" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="74" font-size="11" fill="#6c7a93" text-anchor="middle">dropped</text>
  <text x="260" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">n/2 kept</text>
  <rect x="180" y="96" width="80" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="96" width="80" height="22" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="220" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">n/4</text>
  <text x="300" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">dropped</text>
  <text x="180" y="140" font-size="12" fill="#b4232c" text-anchor="middle">total about n + n/2 + n/4 + ... = 2n</text>
</svg>
```
:::

::: context percentile Percentiles, and why engineers want the 99th
The $p$-th percentile is the value that $p$ percent of the samples are at or below. The 50th percentile is the median. For timing, the average is nearly useless: a task that takes 55 µs on average may still take 400 µs once in a thousand runs, and that one run is the one that misses a deadline. So test reports quote high percentiles, and the true worst case is found separately, by analysis. There are several slightly different percentile rules; nearest-rank is the simplest and always returns an actual sample.
:::

::: context halving Seven halvings find one channel in 128
Each look at the middle throws away half of what is left. Starting from 128 candidates:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="14" width="320" height="12"/>
    <rect x="180" y="30" width="160" height="12"/>
    <rect x="180" y="46" width="80" height="12"/>
    <rect x="220" y="62" width="40" height="12"/>
    <rect x="240" y="78" width="20" height="12"/>
    <rect x="240" y="94" width="10" height="12"/>
    <rect x="245" y="110" width="5" height="12"/>
    <rect x="245" y="126" width="2.5" height="12" fill="#b4232c"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="26" y="24">start: 128</text><text x="22" y="40">after 1: 64</text><text x="22" y="56">after 2: 32</text>
    <text x="22" y="72">after 3: 16</text><text x="22" y="88">after 4: 8</text><text x="22" y="104">after 5: 4</text>
    <text x="22" y="120">after 6: 2</text><text x="22" y="136">after 7: 1 left</text>
  </g>
</svg>
```

Because $2^7 = 128$, seven looks always suffice. Double the table to 256 and it takes one more look, not 128 more.
:::

::: context bounded-time Bounded time is the point
Flight software on a real-time processor is checked by **worst-case execution time** analysis: for every task, engineers show the longest it could ever take, and that it still fits in its time slot. A loop that "usually" finishes quickly is not good enough. One of the NASA JPL "Power of Ten" coding rules, written by Gerard Holzmann, asks that every loop have a fixed upper bound that a checking tool can confirm. A binary search over a fixed 128-entry table has one: 7 comparisons, always. A hash table's average case is fast, but its worst case depends on the keys.
:::
