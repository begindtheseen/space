---
id: l01-sequence-containers
title: "Sequence containers: array, vector, deque and list"
minutes: 24
covers:
  - array, vector (size vs capacity, reserve, iterator invalidation), deque, list
---

Think of four ways to keep a row of things. An **egg carton** has twelve slots, fixed forever: you can fill them, but never add a thirteenth. A **bookshelf** holds your books side by side; when it is full, you buy a bigger shelf and carry every book across. A **train** adds carriages at either end without touching the passengers already on board. A **scavenger hunt** keeps each clue in a different place, and every clue tells you where the next one is hidden.

Those are the four **sequence containers** of the C++ **[[standard library|stl-name]]** — containers that keep elements in an order you choose, first to last. The egg carton is `std::array`. The bookshelf is `std::vector`. The train is `std::deque`. The scavenger hunt is `std::list`. Each is fast at some jobs and slow at others, for one reason: *where the elements live in memory*.

The last module ended with the rule of zero: build a class from members that manage themselves, and the compiler's copy, move and destructor are correct for free. These containers are the rule of zero in action. `std::vector` owns a heap buffer and has answered all five questions: its destructor frees the buffer, its copy is deep, its moves are `noexcept` pointer steals. A `struct` with a `std::vector` member writes none of the five and still behaves correctly. This module is about choosing among such pieces the way a flight-software reviewer would, and the first question is always: *does it allocate, and when?*

## std::array: the egg carton

You met `std::array<T, N>` in the basics module. Read it aloud as "array of T, size N". It is N elements side by side, with the size baked into the type, and nothing else — no pointer, no size field, no heap.

```cpp
std::array<double, 128> gains{};   // 128 doubles, 1024 bytes, all zero
```

`sizeof(gains)` is $128 \times 8 = 1024$ bytes. The storage lives wherever the object lives — on the stack, inside another object, or in static memory — and never comes from the allocator, so its timing is the same on the first cycle and the millionth. Its limit is the egg carton's: the size cannot change at run time.

## std::vector: the bookshelf

A `std::vector<T>` is three pointers: where the buffer starts, where the elements end, and where the buffer ends. The elements themselves live in one contiguous heap block. That gives two numbers people mix up:

- **size** — how many elements exist right now. `v.size()`.
- **capacity** — how many elements fit in the current buffer before it must be replaced. `v.capacity()`.

When you `push_back` below capacity, the new element goes into the next free slot: a store and a pointer increment. At full capacity, the vector **reallocates**: it asks the heap for a bigger buffer, carries every element across, destroys the old ones and frees the old buffer. It **[[moves them if it safely can|noexcept-growth]]**, which is where last module's `noexcept` pays off.

::: key vector: size versus capacity
size is how many elements exist; capacity is how many fit before reallocation. push_back beyond capacity allocates a larger buffer, moves everything and invalidates every iterator, pointer and reference into the vector.
:::

### How much bigger?

The standard does not say. It says only that `push_back` takes **amortised constant time**: averaged over many pushes, the cost per push is bounded by a constant, even though a single push can be slow. That forces growth by a *factor*, not by a fixed amount. Let us measure the factor for g++ 13.3 and its library, **libstdc++**.

::: example Measuring the growth factor
This program pushes one million doubles and watches the capacity change:

```cpp
#include <cstdio>
#include <vector>

int main() {
    std::vector<double> v;
    std::size_t last_cap = v.capacity();
    int reallocs = 0;
    long relocated = 0;            // elements carried from an old buffer to a new one
    for (int i = 0; i < 1'000'000; ++i) {
        const std::size_t old_size = v.size();
        v.push_back(0.001 * i);
        if (v.capacity() != last_cap) {
            ++reallocs;
            relocated += static_cast<long>(old_size);
            if (last_cap != 0 && v.capacity() <= 64)
                std::printf("capacity %4zu -> %4zu  ratio %.2f\n",
                            last_cap, v.capacity(), double(v.capacity()) / double(last_cap));
            last_cap = v.capacity();
        }
    }
    std::printf("size %zu  capacity %zu\n", v.size(), v.capacity());
    std::printf("reallocations %d  elements relocated %ld  per element %.2f\n",
                reallocs, relocated, double(relocated) / double(v.size()));

    std::vector<double> w;
    w.reserve(1'000'000);
    const double* start = w.data();
    for (int i = 0; i < 1'000'000; ++i) w.push_back(0.001 * i);
    std::printf("with reserve: capacity %zu  buffer moved: %s\n",
                w.capacity(), w.data() == start ? "no" : "yes");
}
```

(`1'000'000` is one million; the `'` marks are digit separators, ignored by the compiler.) Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
capacity    1 ->    2  ratio 2.00
capacity    2 ->    4  ratio 2.00
capacity    4 ->    8  ratio 2.00
capacity    8 ->   16  ratio 2.00
capacity   16 ->   32  ratio 2.00
capacity   32 ->   64  ratio 2.00
size 1000000  capacity 1048576
reallocations 21  elements relocated 1048575  per element 1.05
with reserve: capacity 1000000  buffer moved: no
```

Read it step by step.

1. **The factor is 2.** clang++ 18 on this machine uses the same library and printed the same lines.
2. **21 reallocations.** The capacity went 0, 1, 2, 4, … up to $2^{20} = 1{,}048{,}576$, the first power of two above one million: 21 changes.
3. **1,048,575 elements relocated.** Each reallocation carried the old contents across: $1 + 2 + 4 + \dots + 2^{19} = 2^{20} - 1 = 1{,}048{,}575$.
4. **About 1.05 relocations per element** — roughly one extra move each, not a million each. That is "amortised constant".
5. **With `reserve`, the buffer never moved.**

Sanity check: the final capacity, 1,048,576, is more than the size, 1,000,000. The vector is carrying about 48,576 empty slots — 388,608 bytes of doubles it allocated but is not using. That is the price of doubling.
:::

::: note Why growing by a factor gives amortised constant time
Say the vector doubles and has filled a capacity of $n$. The reallocations so far relocated $1 + 2 + 4 + \dots + n/2 = n - 1$ elements. Add the $n$ ordinary stores, and $n$ pushes cost less than $2n$ units of work: at most 2 per push. Any factor $r > 1$ works the same way, with relocations summing to about $n/(r-1)$; Microsoft's library grows by 1.5 times, trading more reallocations for less wasted space. Growing by a fixed step of ten slots instead makes the relocations sum to about $n^2/20$ — a cost per push that grows with $n$, so not amortised constant.
:::

::: warning The doubling is of the size, not a power of two
libstdc++ doubles the current size, so capacities need not be powers of two: `std::vector<double> v{1.0, 2.0, 3.0};` has capacity 3, and one `push_back` takes it to 6. Never rely on a particular capacity sequence; ask for what you need with `reserve`.
:::

### reserve: pay once, up front

`v.reserve(n)` makes the capacity at least `n` without changing the size. The vector allocates once, and no `push_back` reallocates until the size would pass `n`. If you know the maximum, reserve it at start-up.

Do not confuse it with `v.resize(n)`, which changes the *size*: it creates or destroys elements until there are exactly `n`. After `reserve(100)` the vector is still empty and `v[5]` is out of range. After `resize(100)` there are 100 zero-valued doubles.

## When the shelf is replaced, old addresses go stale

When the vector reallocates, every element moves to a new address, and anything that pointed into the old buffer now points at freed memory.

That includes an **[[iterator|iterator-intro]]** — an object that marks a position in a container, the way a pointer marks a position in an array. `v.begin()` marks the first element and `v.end()` one past the last. For now, think of a vector's iterator as a pointer in a thin disguise.

The exact rule for `push_back`:

- If the new size is **greater than the old capacity**, the vector reallocates, and every iterator, pointer and reference into it is **invalidated** — it no longer refers to a valid element, and using it is undefined behavior.
- Otherwise, the element goes into spare capacity, nothing moves, and pointers and references to existing elements stay valid. Only `end()` changes.

So whether a pointer survives a `push_back` depends on the capacity at that moment. A test that runs with spare capacity passes; the build that fills the buffer one sample later writes into freed memory.

::: example Which addresses survive a push
This program holds on to an element in each of three containers and then keeps pushing:

```cpp
#include <cstdint>
#include <cstdio>
#include <deque>
#include <list>
#include <vector>

int main() {
    // vector: the buffer moves when a push_back exceeds capacity
    std::vector<double> v{1.0, 2.0, 3.0};
    const std::uintptr_t first_addr = reinterpret_cast<std::uintptr_t>(&v[0]);
    const std::size_t first_idx = 0;
    std::printf("vector: size %zu capacity %zu\n", v.size(), v.capacity());
    v.push_back(4.0);
    const bool moved = reinterpret_cast<std::uintptr_t>(&v[0]) != first_addr;
    std::printf("after one push_back: size %zu capacity %zu, v[0] moved: %s\n",
                v.size(), v.capacity(), moved ? "yes" : "no");
    std::printf("the index still works: v[%zu] = %.1f\n", first_idx, v[first_idx]);

    // deque: push at either end never moves existing elements
    std::deque<double> d{1.0};
    const double* dfront = &d.front();
    for (int i = 0; i < 10000; ++i) { d.push_back(i); d.push_front(-i); }
    std::printf("deque: 20000 pushes later, old element still at same address: %s\n",
                &d[10000] == dfront ? "yes" : "no");

    // list: every element is its own node; nodes never move
    std::list<double> l{1.0};
    const double* lfront = &l.front();
    for (int i = 0; i < 10000; ++i) { l.push_back(i); l.push_front(-i); }
    auto it = l.begin();
    for (int i = 0; i < 10000; ++i) ++it;
    std::printf("list: 20000 pushes later, old element still at same address: %s\n",
                &*it == lfront ? "yes" : "no");
}
```

The vector's address is kept as an integer (`std::uintptr_t`), not as a pointer that may dangle. Output:

```text
vector: size 3 capacity 3
after one push_back: size 4 capacity 6, v[0] moved: yes
the index still works: v[0] = 1.0
deque: 20000 pushes later, old element still at same address: yes
list: 20000 pushes later, old element still at same address: yes
```

Step by step:

1. The vector started full, size 3 and capacity 3. One `push_back` exceeded the capacity, the vector reallocated to 6, and `v[0]` moved. A `double*` taken before the push would now dangle.
2. The *index* 0 still works: an index is a position, not an address.
3. The deque grew by 10,000 at each end and the original element never moved; it now sits at index 10,000.
4. The list's original node never moved either.

Sanity check: the program runs clean under `-fsanitize=address,undefined`.
:::

Two habits follow: `reserve` the maximum before anyone takes a pointer, or keep **indices** instead of pointers into a vector that may grow. Every container has its own invalidation rules; lesson 06 gives the full table.

::: warning A loop that pushes into the vector it is reading
`for (const auto& x : v) if (x > limit) v.push_back(limit);` compiles and often passes tests. The range-based `for` holds iterators into `v`, and the first push past capacity leaves them pointing at freed memory. Collect additions in a second container, or loop over indices.
:::

## std::deque: the train

A `std::deque<T>` (say "deck", short for **double-ended queue**) grows fast at *both* ends because it never keeps everything in one block. The elements live in fixed-size **[[blocks, with a small index of blocks|deque-blocks]]** on the side. In libstdc++ each block is 512 bytes, so it holds 64 doubles. Growing at either end adds a block when the end block is full; existing elements never move.

That gives the deque three properties:

- `push_back` and `push_front` are constant time, and **references to existing elements stay valid** when you push at either end. (Iterators are still invalidated, because the index of blocks may be rebuilt; lesson 06 has the fine print.)
- `d[i]` works, but costs two lookups: the block, then the slot.
- It still allocates as it grows: a block every 64 doubles, and now and then a bigger index.

A deque fits a queue added at the back and removed from the front, such as ground commands awaiting execution, when there is no fixed maximum. `std::queue` is a deque underneath by default.

## std::list: the scavenger hunt

A `std::list<T>` is a **doubly linked list**: every element lives in its own **node**, a small heap block holding the element plus a pointer to the next node and one to the previous. For a `double`, that is 8 bytes of data and 16 bytes of pointers — 24 bytes per node, three times the vector's cost — and one heap allocation per element.

What you buy with that:

- **Nodes never move.** A pointer to an element stays valid until that element is erased, no matter what else is inserted or removed.
- **Insert and erase anywhere are constant time**, given an iterator to the spot: relink pointers, shift nothing.
- **`splice`** moves nodes between lists by relinking, with no copy and no allocation.

What you pay is what matters most on modern hardware: walking the list means following pointers to nodes that could be anywhere in memory. The processor reads memory through a **[[cache|cache-line]]** — a small, fast copy of recently used memory, filled 64 bytes at a time. A vector's next element is almost always in the 64 bytes already fetched. A list's next node may be a fresh trip to main memory.

::: example Walking four million doubles
This program sums the same four million random doubles held in a vector, a deque and a list. It walks the list twice: once with its nodes allocated in order, and once after `l.sort()` has relinked the nodes so that walking them jumps all over memory. (Sorting a list relinks pointers; the nodes themselves stay where they were allocated.)

```cpp
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <deque>
#include <list>
#include <random>
#include <vector>

template <typename C>
void walk(const char* name, const C& c) {
    double best = 1e9, sum = 0.0;
    for (int rep = 0; rep < 5; ++rep) {
        const auto t0 = std::chrono::steady_clock::now();
        sum = 0.0;
        for (double x : c) sum += x;
        const auto t1 = std::chrono::steady_clock::now();
        best = std::min(best, std::chrono::duration<double, std::milli>(t1 - t0).count());
    }
    std::printf("%-26s %7.2f ms  (sum %.3f)\n", name, best, sum);
}

int main() {
    constexpr int N = 4'000'000;
    std::mt19937 gen(42);
    std::uniform_real_distribution<double> u(0.0, 1.0);
    std::vector<double> vals(N);
    for (double& x : vals) x = u(gen);

    std::list<double> l(vals.begin(), vals.end());
    walk("list, nodes in order", l);
    l.sort();                                 // relinks nodes; they stay put in memory
    std::sort(vals.begin(), vals.end());
    std::vector<double> v(vals.begin(), vals.end());
    std::deque<double> d(vals.begin(), vals.end());
    walk("vector", v);
    walk("deque", d);
    walk("list, nodes scattered", l);
}
```

The `template <typename C>` line lets one `walk` work for any container type `C` (the next module teaches templates). `steady_clock::now()` reads a clock, lesson 12's subject; each walk runs five times and keeps the best. On one machine:

```text
list, nodes in order         20.86 ms  (sum 2000095.883)
vector                        2.48 ms  (sum 2000095.883)
deque                         2.46 ms  (sum 2000095.883)
list, nodes scattered       529.79 ms  (sum 2000095.883)
```

Step by step:

1. **All four sums agree**: four million numbers averaging 0.5 give about 2,000,096.
2. **Vector and deque tie**, about 2.5 ms, or 0.6 ns per element. The vector is one contiguous block and the deque is contiguous within each 512-byte block, so the cache fetches each line once and uses all of it.
3. **The in-order list is about 8 times slower.** Its nodes sit nearly in order, but each is 24 bytes with 8 of data, and each step must load a pointer before it knows where to go.
4. **The scattered list is about 200 times slower**: about 130 ns per element, nearly every step a trip to main memory.

Sanity check: $529.79 / 2.48 \approx 214$. A second run gave 540 ms against 2.41 ms. Timings vary between machines and runs; the ratio of two orders of magnitude is the lesson, not the exact figure.
:::

A long-running program's heap looks more like the scattered case, because nodes are allocated whenever insertions happen, among everything else. Use a list when you need its guarantees — stable addresses, constant-time splicing — and measure before believing it is faster at anything else.

::: key
Contiguous storage (array, vector) is the default because the cache rewards it. Node-based containers (list, and next lesson's map and set) trade traversal speed for stable addresses, and pay one heap allocation per element.
:::

## Choosing a container for a 1 kHz control task

A **control task** at 1 kHz has one millisecond per cycle to read sensors, estimate the state and write commands. What matters is the *worst* cycle: miss the deadline once and the actuator commands are late.

Most flight software follows the rule **[[no heap allocation after initialization|no-alloc-rule]]**. As the memory module showed, an allocation's time depends on the heap's whole history, it may take a lock, it can fail, and mixed sizes fragment the heap over a long mission. So ask of each container: does it allocate while the loop runs?

- **`std::array`** never allocates. The default for anything with a size known at build time: a state vector, a 12-element set of thruster commands, a table of gains.
- **A fixed-capacity ring buffer** — an array plus a head index and a count, wrapping around at the end — never allocates. The right shape for "the last N samples" or a queue between two tasks.
- **A view** over a buffer allocated at start-up never allocates either. Lesson 04's `std::span` is exactly that: a pointer and a length, owning nothing.
- **`std::vector`** only if `reserve`d at initialization and provably never grown past that in the loop — a fragile promise that one `push_back` in a rare branch breaks.
- **`std::deque` and `std::list`**, filled during the loop, allocate as they grow; the list on every insertion. So does next lesson's `std::map`, a tree of nodes. Any container that allocates per insertion, filled inside the loop, makes the worst case unbounded.

Here is a small ring buffer. Its storage is a `std::array` member, so it follows the rule of zero and never allocates:

```cpp
#include <array>
#include <cstddef>
#include <cstdio>

// A fixed-capacity ring buffer: storage is a member, so it never allocates.
class SampleRing {
public:
    static constexpr std::size_t capacity = 4;

    bool push(double x) {                       // false when full: nothing is lost silently
        if (count_ == capacity) return false;
        buf_[(head_ + count_) % capacity] = x;
        ++count_;
        return true;
    }
    bool pop(double& out) {                     // false when empty
        if (count_ == 0) return false;
        out = buf_[head_];
        head_ = (head_ + 1) % capacity;
        --count_;
        return true;
    }
    std::size_t size() const { return count_; }

private:
    std::array<double, capacity> buf_{};
    std::size_t head_ = 0;                      // index of the oldest sample
    std::size_t count_ = 0;                     // how many are stored
};

int main() {
    SampleRing r;
    for (double x : {1.0, 2.0, 3.0, 4.0, 5.0})
        std::printf("push %.1f -> %s\n", x, r.push(x) ? "ok" : "full");
    double out = 0.0;
    r.pop(out);
    std::printf("pop -> %.1f, size %zu\n", out, r.size());
    r.push(6.0);                                // wraps around into slot 0
    while (r.pop(out)) std::printf("%.1f ", out);
    std::printf("\nsizeof(SampleRing) = %zu bytes\n", sizeof(SampleRing));
}
```

```text
push 1.0 -> ok
push 2.0 -> ok
push 3.0 -> ok
push 4.0 -> ok
push 5.0 -> full
pop -> 1.0, size 3
2.0 3.0 4.0 6.0 
sizeof(SampleRing) = 48 bytes
```

The `%` (read "modulo", the remainder after division) is what wraps the index: slot $(1 + 3) \bmod 4 = 0$ received the 6.0. The fifth push was refused rather than allocating; a real design chooses on purpose whether "full" drops the newest sample, overwrites the oldest or raises a fault. The whole object is $4 \times 8 + 2 \times 8 = 48$ bytes.

### A fixed table looked up by id

A common job: a table of 128 telemetry channels, each a 16-bit id and a scale factor, fixed at start-up and looked up by id every cycle. Keep the entries in a `std::array` **sorted by id**, and search it with **binary search**: look at the middle entry; if its id is too small, the answer is in the upper half, otherwise in the lower half; repeat. Each step halves what is left, so 128 entries need about $\log_2 128 = 7$ steps. (Read $\log_2 128$ as "log base two of 128": the number of times you halve 128 to reach 1.)

The standard library's binary search is `std::lower_bound` (lesson 07 covers it in full). It returns an iterator to the first entry whose id is *not less than* the key — which is the entry itself, if the key is present:

```cpp
#include <algorithm>
#include <array>
#include <cstdint>

struct Entry { std::uint16_t id; double scale; };

bool id_less(const Entry& e, std::uint16_t key) { return e.id < key; }

// table must be sorted by id; returns nullptr if id is absent
const Entry* find_channel(const std::array<Entry, 128>& table, std::uint16_t id) {
    const auto it = std::lower_bound(table.begin(), table.end(), id, id_less);
    return (it != table.end() && it->id == id) ? &*it : nullptr;
}
```

The last line checks the search landed on the id itself, since for a missing key `lower_bound` answers "where would it go". A counting version of `id_less` on this table found every lookup took **[[7 or 8 comparisons|comparison-count]]**, never more. The whole table is $128 \times 16 = 2048$ bytes, which fits in 32 cache lines.

::: key Which container for a fixed 128-entry table looked up by id in flight code?
A sorted std::array with std::lower_bound, or a **[[perfect-hash|perfect-hash]]** lookup. It is contiguous, cache-friendly, allocation-free and its worst case is a bounded log2(128) = 7 comparisons, which a real-time analysis can use.
:::

The next two lessons test that choice against the two obvious rivals, `std::map` and `std::unordered_map`, and measure all three.

## Check yourself

::: check
A vector holds 5 elements with capacity 8. You take `double* p = &v[2];`, then call `push_back` three times, then once more. After which push, if any, is `p` no longer safe to use, and why?
:::

::: answer
The first three pushes take the size to 6, 7 and 8, never past the capacity of 8, so nothing moves and `p` stays valid. The fourth would make the size 9, so the vector reallocates (to 16 in libstdc++), moves all eight elements and frees the old buffer. From then on `p` points into freed memory, and using it is undefined behavior. The index `2` would still find the element.
:::

::: check
Your colleague calls `v.reserve(500)` and then writes `v[10] = 3.0;`. What is wrong, and what should they have written?
:::

::: answer
`reserve` changes the capacity, not the size. The vector still has size 0 — room for 500 elements, none existing — so `v[10]` is out of range: undefined behavior. For 500 elements to assign to, call `v.resize(500)` or construct `std::vector<double> v(500);`. To fill it in order, keep `reserve` and use `push_back`.
:::

::: check
Using the doubling rule, how many reallocations and how many element relocations happen when you `push_back` 3000 doubles into an empty vector with no `reserve`? How much memory does the final buffer waste?
:::

::: answer
The capacity goes 1, 2, 4, …, 2048, 4096: that is 13 capacities, so 13 allocations, and the first (0 to 1) relocates nothing. The others relocate $1 + 2 + \dots + 2048 = 2^{12} - 1 = 4095$ elements — about 1.4 per element pushed. The final capacity is 4096 for a size of 3000, so $1096 \times 8 = 8768$ bytes are allocated but unused. A `reserve(3000)` would make it one allocation, no relocations and no waste.
:::

::: check
A logger keeps a pointer to the most recent message in a container, while new messages are appended at the back and old ones removed from the front. Which of vector, deque and list keeps that pointer valid while messages are appended? Which one would you still avoid in a flight loop, and why?
:::

::: answer
A vector's `push_back` can reallocate and invalidate it. A deque keeps references valid on pushes at either end, and a list keeps every address until that element is erased, so both keep the pointer valid (unless that message is the one removed). But both allocate as they grow — the deque a block at a time, the list on every message — so the flight answer is neither: a fixed-capacity ring buffer, which never allocates and whose slots never move.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::array<T, N>` | N elements in place, size in the type | no heap; flight-code default |
| `std::vector<T>` | one contiguous heap buffer | three pointers, 24 bytes; elements elsewhere |
| size vs capacity | elements that exist vs elements that fit | `push_back` past capacity reallocates |
| growth factor | how much bigger the new buffer is | 2 in libstdc++ (1.5 in Microsoft's); amortised constant `push_back` |
| `reserve(n)` | capacity at least `n`, size unchanged | one allocation; no reallocation until size passes `n` |
| invalidation | a pointer, reference or iterator no longer valid | a reallocating `push_back` invalidates all; indices survive |
| `std::deque<T>` | blocks plus an index of blocks | constant-time push at both ends; references survive pushes at the ends |
| `std::list<T>` | one node per element, two links each | addresses never move; 24 bytes and one allocation per `double` |
| cache locality | memory arrives in 64-byte lines | scattered list walk about 200× slower than vector |
| 1 kHz rule | no allocation after initialization | array, ring buffer, view over a preallocated buffer |
| fixed id table | sorted `std::array` + `std::lower_bound` | 2048 bytes for 128 entries; $\log_2 128 = 7$ comparisons, 8 at most in libstdc++ |

Next lesson opens the other family of containers — `std::map` and `std::set`, which keep their keys sorted in a tree of nodes — and measures them against the sorted array from this lesson.

::: context stl-name Where "STL" comes from
People often call the containers and algorithms "the STL". The name comes from the **Standard Template Library**, designed by Alexander Stepanov and colleagues in the early 1990s and adopted, with changes, into the first C++ standard, C++98. Its central idea is the one this module keeps using: containers hold data, algorithms work on ranges marked by iterators, and the two meet in the middle so that any algorithm works with any suitable container. Strictly, the STL is now only part of the C++ standard library, which also has strings, streams, clocks and more.
:::

::: context noexcept-growth Why the vector checks for noexcept
Last module's move-semantics lesson showed this with a counting class. While relocating, the vector has already moved some elements into the new buffer; if moving the next one threw an exception, the old buffer would be half emptied and could not be restored. To keep its promise that a failed `push_back` changes nothing, the vector moves an element only if its move constructor is `noexcept`, and copies it otherwise. A class built by the rule of zero from `noexcept`-movable members gets a `noexcept` move automatically, so it gets the fast path for free.
:::

::: context iterator-intro A bookmark for a container
An iterator is a generalized bookmark. For a vector it behaves like a pointer: `*it` reads the element (say "star it"), `++it` moves to the next one, and two iterators can be compared. For a list, `++it` follows the node's `next` pointer instead, but the code that uses it looks the same. That shared shape is what lets one algorithm, like `std::lower_bound`, work on many containers. Lesson 06 sorts iterators into categories by what they can do, and gives each container's full list of operations that invalidate them.
:::

::: context deque-blocks What a deque looks like inside
A deque keeps a small array of pointers, often called the *map* inside libstdc++ (nothing to do with `std::map`), and each pointer leads to a fixed block. Pushing at the back fills the last block; when it is full, a new block is allocated and its pointer added to the index. Pushing at the front works the same way at the other end. No existing element ever moves, only the index of pointers does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="30" y="16" font-size="12" fill="#1f2a44">index of blocks</text>
  <rect x="30" y="24" width="40" height="28" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="30" y="52" width="40" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="30" y="80" width="40" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="30" y="108" width="40" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="30" y="136" width="40" height="28" fill="#ffffff" stroke="#1f2a44"/>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <line x1="60" y1="66" x2="140" y2="38"/>
    <line x1="60" y1="94" x2="140" y2="88"/>
    <line x1="60" y1="122" x2="140" y2="138"/>
  </g>
  <g stroke="#1f2a44">
    <rect x="140" y="26" width="160" height="24" fill="#ffffff"/>
    <rect x="220" y="26" width="80" height="24" fill="#8fb8f0"/>
    <rect x="140" y="76" width="160" height="24" fill="#8fb8f0"/>
    <rect x="140" y="126" width="160" height="24" fill="#8fb8f0"/>
    <rect x="240" y="126" width="60" height="24" fill="#ffffff"/>
  </g>
  <text x="225" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">push_front fills leftward</text>
  <text x="310" y="92" font-size="11" fill="#1f2a44">block</text>
  <text x="250" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">push_back fills rightward</text>
</svg>
```

Blue cells hold elements; white cells are spare room.
:::

::: context cache-line Why contiguous memory wins
Main memory is far away in processor terms: a read that misses every cache takes on the order of 100 ns, hundreds of clock cycles. So the processor keeps copies of recently used memory in small, fast **caches**, and it always moves memory in 64-byte **cache lines**. Contiguous data gets eight doubles per line, and the hardware notices a steady stride and fetches the next lines before you ask. Scattered nodes get one useful value per line and no warning of where the next one is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">vector: one line brings 8 doubles</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="10" y="26" width="20" height="22"/><rect x="30" y="26" width="20" height="22"/>
    <rect x="50" y="26" width="20" height="22"/><rect x="70" y="26" width="20" height="22"/>
    <rect x="90" y="26" width="20" height="22"/><rect x="110" y="26" width="20" height="22"/>
    <rect x="130" y="26" width="20" height="22"/><rect x="150" y="26" width="20" height="22"/>
  </g>
  <rect x="10" y="26" width="160" height="22" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="42" font-size="11" fill="#b4232c">64-byte line</text>
  <text x="10" y="80" font-size="12" fill="#1f2a44">list: every node is a new line</text>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="20" y="92" width="36" height="22"/>
    <rect x="220" y="122" width="36" height="22"/>
    <rect x="110" y="126" width="36" height="22"/>
    <rect x="300" y="92" width="36" height="22"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <line x1="56" y1="103" x2="220" y2="133"/>
    <line x1="220" y1="133" x2="146" y2="137"/>
    <line x1="128" y1="126" x2="300" y2="103"/>
  </g>
</svg>
```
:::

::: context no-alloc-rule A rule written into coding standards
Gerard Holzmann's "Power of Ten" rules for safety-critical code, written at NASA's Jet Propulsion Laboratory, include "do not use dynamic memory allocation after initialization". The JSF Air Vehicle C++ standard written for the F-35 has a rule to the same effect, and so do many company standards. Allocation at start-up is allowed because it happens once, before the vehicle depends on timing, and a failure there can stop the launch instead of the mission.
:::

::: context comparison-count Seven or eight
Halving 128 seven times reaches 1, which is where $\log_2 128 = 7$ comes from. libstdc++'s `lower_bound` sometimes needs one more comparison, because when it steps into the lower half it keeps the middle element as a candidate, so that half is one element bigger. The standard allows for this: it promises at most $\log_2 N + O(1)$ comparisons, a small constant on top. For a real-time analysis, the figure to write down is the bound you measured and understood: 8 comparisons here, fixed forever by the table size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="16" font-size="12" fill="#1f2a44">entries still in play: each comparison halves them</text>
  <rect x="20" y="26" width="280.0" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="306.0" y="36" font-size="11" fill="#1f2a44">128</text>
  <rect x="20" y="43" width="140.0" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="166.0" y="53" font-size="11" fill="#1f2a44">64</text>
  <rect x="20" y="60" width="70.0" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="96.0" y="70" font-size="11" fill="#1f2a44">32</text>
  <rect x="20" y="77" width="35.0" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="61.0" y="87" font-size="11" fill="#1f2a44">16</text>
  <rect x="20" y="94" width="17.5" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="43.5" y="104" font-size="11" fill="#1f2a44">8</text>
  <rect x="20" y="111" width="8.75" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="34.75" y="121" font-size="11" fill="#1f2a44">4</text>
  <rect x="20" y="128" width="4.38" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="30.38" y="138" font-size="11" fill="#1f2a44">2</text>
  <rect x="20" y="145" width="2.19" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="28.19" y="155" font-size="11" fill="#1f2a44">1</text>
</svg>
```
:::

::: context perfect-hash A hash with no collisions
A hash function turns a key into a slot number; lesson 03 explains how `std::unordered_map` uses one. When every key is known in advance, as in a fixed channel table, you can search offline for a hash function that sends each of the 128 ids to a different slot. That is a **perfect hash**. A lookup is then one computation and one comparison, with no search at all, and tools such as GNU `gperf` generate such functions. It suits a table that never changes; any new id means generating the function again.
:::
