---
id: l06-iterators-and-invalidation
title: Iterators, and when they stop being safe
minutes: 24
covers:
  - Iterators and their categories; per-container invalidation rules
---

You are reading a long book and stop for the night. You slip a bookmark between two pages. Tomorrow, the bookmark takes you straight back to the right spot — as long as nobody touched the book.

Now imagine the library rebinds the book overnight into a thicker edition with bigger print. Your bookmark is still in the old cover, pointing at a page that no longer exists. Or imagine a different book, a ring binder. Someone adds new pages in the middle, but your bookmark is clipped to one particular sheet, so it still finds your page no matter what was added around it.

An **iterator** is a bookmark into a container: a small object that marks one position and can move to the next. Every standard algorithm — sorting, searching, summing — talks to containers only through iterators. And whether your bookmark survives a change to the container depends entirely on how that container stores its elements. Lesson 01 showed the vector's version of this: a `push_back` past capacity moves everything. This lesson gives the whole picture: what an iterator can do, the five kinds of iterator, the half-open ranges every algorithm uses, and the exact rule, container by container, for when a bookmark goes bad.

## What an iterator does

An **[[iterator|iterator-name]]** supports, at least, three operations:

- `*it` — read "star it" — gives the element it marks.
- `++it` — read "plus plus it" — moves it to the next element.
- `it == other` and `it != other` — do two iterators mark the same position?

For a vector, an iterator behaves like a pointer, and in many library builds it is one in a thin wrapper. For a `std::list`, `++it` follows the node's "next" link. For a `std::map`, `++it` walks to the next larger key in the tree. The code using the iterator looks identical in all three cases. That is the whole point: one algorithm, written once, works on every container.

Every container hands out two special iterators. `c.begin()` marks the first element. `c.end()` marks the position **[[one past the end|one-past-end]]** — not the last element, but the empty spot just after it. You must never read `*c.end()`; it marks where the elements stop.

Two more pairs are worth knowing. `c.cbegin()` and `c.cend()` give **const iterators**, which can read elements but not change them. `c.rbegin()` and `c.rend()` give **reverse iterators**, for which `++` walks backward from the last element.

## Half-open ranges: [begin, end)

An algorithm never takes a container. It takes two iterators, `first` and `last`, and works on the elements from `first` up to, but **not including**, `last`. Mathematicians write that as $[\text{first}, \text{last})$ — the square bracket means "included", the round one "not included" — and call it a **half-open range**. Read it "from first up to last, not including last".

Why leave the last one out? Because it makes three things fall out with no special cases:

- **The empty range is easy.** When `first == last`, there are no elements. A loop `for (; first != last; ++first)` runs zero times.
- **The size is a subtraction.** For a vector, `last - first` is the number of elements. `v.end() - v.begin()` is `v.size()`.
- **Ranges split cleanly.** $[\text{a}, \text{m})$ and $[\text{m}, \text{b})$ together cover $[\text{a}, \text{b})$ with no gap and no overlap. Binary search, sorting and merging all rely on this.

This choice has a long history among people who think carefully about **[[counting from zero|dijkstra-half-open]]**, and the whole library follows it. The design goes back to **[[the original STL|stepanov]]**.

The loop pattern below is the heart of every standard algorithm. A **function template** — read `template <typename It>` as "a template with a type parameter called `It`" — lets one function accept any iterator type. The compiler writes a separate version for each type it is used with. The next module teaches templates in full; this much is enough to read and write one.

::: example One loop, three containers
```cpp
#include <array>
#include <cstdio>
#include <list>
#include <vector>

// Count the values above a limit in the half-open range [first, last).
// Works with any iterator that can do !=, ++ and * : a forward iterator or better.
template <typename It>
int count_above(It first, It last, double limit) {
    int n = 0;
    for (; first != last; ++first)
        if (*first > limit) ++n;
    return n;
}

int main() {
    const std::vector<double> v{3.1, 7.4, 9.9, 2.0, 8.8};
    const std::list<double>   l{3.1, 7.4, 9.9, 2.0, 8.8};
    const std::array<double, 5> a{3.1, 7.4, 9.9, 2.0, 8.8};

    std::printf("vector %d, list %d, array %d\n",
                count_above(v.begin(), v.end(), 5.0),
                count_above(l.begin(), l.end(), 5.0),
                count_above(a.begin(), a.end(), 5.0));

    // Sub-ranges: the second half of the vector, [begin + 2, end)
    std::printf("last three of vector: %d\n", count_above(v.begin() + 2, v.end(), 5.0));
    // An empty range: first == last, the loop body never runs
    std::printf("empty range: %d\n", count_above(v.begin(), v.begin(), 5.0));
    std::printf("v.end() - v.begin() = %td\n", v.end() - v.begin());
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
vector 3, list 3, array 3
last three of vector: 2
empty range: 0
v.end() - v.begin() = 5
```

Walk through it. `count_above` never names a container. It only uses `!=`, `++` and `*` on whatever `It` turns out to be. Called with vector iterators, `++first` moves a pointer by 8 bytes. Called with list iterators, it follows a link to the next node. Same source, different machine code.

Check the counts. Above 5.0 in $3.1, 7.4, 9.9, 2.0, 8.8$ are $7.4$, $9.9$ and $8.8$: three, for all three containers.

`v.begin() + 2` jumps two elements ahead, so the range is $9.9, 2.0, 8.8$, and two of those are above 5.0. `count_above(v.begin(), v.begin(), 5.0)` is an empty range: `first == last` at the start, so the loop never ran and the count is 0. And `v.end() - v.begin()` is 5, the vector's size, as the half-open rule promises.

Sanity check: `v.begin() + 2` worked on the vector. The same line with `l.begin() + 2` does not compile, and the next section explains why.
:::

::: warning `end()` is not the last element
`*v.end()` reads past the end, which is undefined behavior. The last element is `*(v.end() - 1)`, or `v.back()`. And on an empty container, `begin() == end()`, so even `*v.begin()` is out of bounds. Check `empty()` before you dereference anything.
:::

## The five kinds of iterator

A vector's iterator can jump ten places in one step. A list's iterator can only walk, one node at a time, because the only way to find the tenth node is to follow nine links. So iterators come in kinds, called **iterator categories**, each able to do everything the one before it can, plus more. From weakest to strongest:

- **Input iterator.** Reads each element once, moving forward only. After `++`, the old position may be gone for good. Example: `std::istream_iterator`, which reads numbers from a stream as they arrive, like telemetry off a serial line.
- **Forward iterator.** Also forward only, but you can copy it and go over the same range again. `std::forward_list` and the unordered containers give these.
- **Bidirectional iterator.** Adds `--it`, one step backward. `std::list`, `std::map` and `std::set` give these.
- **Random-access iterator.** Adds jumps: `it + n`, `it - n`, `it[n]`, the distance `it2 - it1`, and comparisons with `<`. All in one step, whatever `n` is. `std::deque` gives these.
- **Contiguous iterator.** Random access, plus a promise that the elements really sit side by side in memory, so `&*(it + n) == &*it + n`. `std::vector`, `std::array`, `std::string`, a plain array, and last lesson's `std::span` and `std::string_view` give these. C++20 made this category official.

There is also the **output iterator**, which can only write, once per position. `std::back_inserter(v)` is one: writing through it calls `v.push_back`. It sits off to the side of the **[[ladder|category-ladder]]** because it cannot read.

::: key
Iterator categories, weakest to strongest: input (one pass, read), forward (many passes), bidirectional (adds `--`), random access (adds `it + n`, `it2 - it1`, `<`), contiguous (random access with elements side by side in memory). Output iterators write only. An algorithm states the weakest category it needs; a container's iterators must meet it.
:::

### Why the category matters

Every algorithm asks for the weakest category it can live with. `std::find_if` needs only an input iterator, since it walks forward once. `std::sort` needs random access, because it jumps around the range. Hand `std::sort` two list iterators and it will not compile; the first error line from g++ 13 complains that it found no `operator-` for two `std::_List_iterator<double>` objects. `std::list` has its own member `l.sort()` for exactly this reason.

The category also sets the cost of the helpers in `<iterator>`:

- `std::distance(first, last)` counts the steps between two iterators. For random access it is one subtraction. For anything weaker it walks the whole way, $n$ steps.
- `std::advance(it, n)`, `std::next(it, n)` and `std::prev(it, n)` move an iterator $n$ places: one jump for random access, $n$ single steps otherwise. `std::prev` needs at least bidirectional.

So `std::next(l.begin(), 2)` is how you write `l.begin() + 2` for a list — and it costs two link-follows, not one jump. The code looks similar; the cost does not. The same goes for searching: `std::lower_bound` on map iterators compiles, but it must walk the tree step by step to find midpoints. Use the map's own `m.lower_bound(key)`, which follows the tree's shape in $O(\log n)$ steps. Lesson 07 comes back to this.

## Invalidation: when a bookmark goes bad

An iterator, pointer or reference is **invalidated** when the element it marks has moved or been destroyed. Using an invalidated one is undefined behavior. It may seem to work, crash, or quietly read another element — and which one it does can change from build to build.

Whether a change invalidates your handle depends on how the container stores elements. Contiguous containers move elements to keep them side by side. Node-based containers — list, map, set — put each element in its own heap node, which never moves until that element is erased. Everything below follows from those two facts.

**std::vector.** All elements live in one buffer.

- An insertion (`push_back`, `emplace_back`, `insert`) that makes the size larger than the capacity **reallocates**: every iterator, pointer and reference into the vector is invalidated.
- An insertion that fits in the existing capacity moves only the elements *after* the insertion point, to make room. Iterators, pointers and references *before* it stay valid. For `push_back` nothing moves at all, so only `end()` is invalidated.
- `erase` shifts the later elements down to close the gap: everything at or after the erased position is invalidated, including `end()`. Earlier ones stay valid.
- `reserve(n)` with `n` above the current capacity reallocates, invalidating everything once — which is why you call it *before* anyone takes a pointer.

**std::deque.** Elements live in fixed blocks, found through a small index of blocks.

- Inserting at either end (`push_back`, `push_front`) invalidates **all iterators**, because the index of blocks may be rebuilt — but **references and pointers to elements stay valid**, because no element moves. This split between iterators and references surprises nearly everyone.
- Inserting in the middle invalidates everything: iterators, pointers and references.
- Erasing the first element invalidates only handles to that element. Erasing the last element invalidates handles to it and `end()`. Erasing in the middle invalidates everything.

**std::list.** Inserting never invalidates anything. Erasing invalidates only handles to the erased element.

**std::map and std::set.** The same as list: inserting invalidates nothing, erasing invalidates only the erased element. Their nodes never move.

**std::unordered_map and std::unordered_set.** Elements live in nodes, sorted into **buckets** by their hash, as lesson 03 described.

- An insertion that pushes the **[[load factor|load-factor-bridge]]** — elements per bucket — above its maximum triggers a **rehash**: a new, larger bucket array, with every element re-sorted into it. A rehash invalidates **all iterators**, but **references and pointers to elements stay valid**, because the nodes themselves do not move.
- An insertion that does not rehash invalidates nothing.
- Erasing invalidates only the erased element.
- `reserve(n)` sets up enough buckets for `n` elements in advance, so inserting up to `n` never rehashes.

::: key
vector: size versus capacity. size is how many elements exist; capacity is how many fit before reallocation. push_back beyond capacity allocates a larger buffer, moves everything and invalidates every iterator, pointer and reference into the vector.
:::

::: key
unordered_map: rehashing on growth invalidates all iterators, though not references or pointers to elements. deque: pushing at either end invalidates all iterators, though not references or pointers to elements. list, map and set: insertion invalidates nothing, and erasing invalidates only the erased element.
:::

Here is the whole thing on one card.

| Container | Insert | Erase |
| --- | --- | --- |
| `array` | cannot insert | cannot erase |
| `vector` | past capacity: **everything**; otherwise: at and after the insertion point, and `end()` | at and after the erased point, and `end()` |
| `deque` | at either end: all **iterators**, no references; in the middle: everything | first or last: only the erased (and `end()` for the last); middle: everything |
| `list` | nothing | only the erased element |
| `map`, `set` | nothing | only the erased element |
| `unordered_map`, `unordered_set` | if it rehashes: all **iterators**, no references; otherwise nothing | only the erased element |

::: note Why a rehash kills iterators but not references
A reference or pointer leads to the element's node, and the node stays where it is. An iterator is more than that: it also has to know how to reach the *next* element, which depends on the bucket layout. A rehash changes the bucket count and shuffles which nodes follow which. So the standard declares every iterator invalid, even though, in libstdc++, `*it` on an old iterator may still happen to read the right element. What cannot survive is the *walk*: a loop half-way through the old order, continued in the new order, may skip elements or visit some twice.
:::

## The two bugs you will actually write

Invalidation bugs in real code nearly always come in two shapes.

**Holding a handle across a growth.** A telemetry registry keeps `double*` pointers to entries in a `std::vector<Channel>`. It works for months. Then someone adds a channel at run time, the vector reallocates, and every stored pointer dangles. The fixes, from lesson 01: size the vector once at start-up with `reserve` and never grow it after, or store **[[indices instead of pointers|handles]]**. The flight-software habit of allocating everything at initialization makes this bug much rarer — one more reason for the rule.

**Erasing inside a loop.** You walk a container and erase the elements you do not want. The obvious loop, `for (auto it = m.begin(); it != m.end(); ++it) if (stale) m.erase(it);`, erases the element `it` marks — and then does `++it` on an invalidated iterator. The fix is that every standard container's `erase(it)` returns an iterator to the element *after* the erased one. Take it, and only step forward when you did not erase.

::: example Dropping stale telemetry channels from a map
The buggy version first:

```cpp
#include <cstdio>
#include <map>

int main() {
    // channel id -> seconds since last update
    std::map<int, double> age_s{{1, 0.02}, {2, 5.10}, {3, 0.01}, {4, 7.30}};
    for (auto it = age_s.begin(); it != age_s.end(); ++it)
        if (it->second > 1.0) age_s.erase(it);        // drop stale channels
    std::printf("%zu channels left\n", age_s.size());
}
```

Built with `g++ -std=c++20 -O2` and run three times, it died every time with `Segmentation fault` (exit status 139). Channel 2 is stale, so its node was erased and freed, and then `++it` tried to follow the links stored inside that freed node.

Surprise: built with AddressSanitizer, the same program printed `2 channels left` and reported nothing. The step to the next tree node runs inside **[[precompiled library code|asan-blind-spot]]** that ASan does not check. A tool that catches this is libstdc++'s **[[debug mode|debug-mode]]**, switched on with `-D_GLIBCXX_DEBUG`. It stopped the program at the bad step:

```text
Error: attempt to increment a singular iterator.
```

A **[[singular|singular]]** iterator is one that no longer belongs to any container — here, the erased one.

Now the fix:

```cpp
#include <cstdio>
#include <map>

int main() {
    // channel id -> seconds since last update
    std::map<int, double> age_s{{1, 0.02}, {2, 5.10}, {3, 0.01}, {4, 7.30}};
    for (auto it = age_s.begin(); it != age_s.end(); ) {
        if (it->second > 1.0)
            it = age_s.erase(it);      // erase returns the next valid iterator
        else
            ++it;                      // only step when nothing was erased
    }
    for (const auto& [id, age] : age_s) std::printf("channel %d, age %.2f s\n", id, age);
}
```

Output, the same in a plain build and in a build with both `-D_GLIBCXX_DEBUG` and `-fsanitize=address`:

```text
channel 1, age 0.02 s
channel 3, age 0.01 s
```

Trace the loop. `it` starts at channel 1, age $0.02 \le 1.0$: keep it, `++it`. Channel 2, age $5.10 > 1.0$: `erase` removes it and returns an iterator to channel 3, the next key. No `++`, so channel 3 is checked next: $0.01$, keep, `++it`. Channel 4, $7.30$: erased, and `erase` returns `end()`. The loop condition sees `end()` and stops.

Sanity check: two stale channels out of four, two left, and they are 1 and 3. Erasing only invalidated the erased node, as the map's rule says, so the iterator `erase` returned was safe to use.
:::

The same `it = c.erase(it)` pattern works for `list`, `set`, `unordered_map` and `deque`, and for `vector` too — but on a vector each `erase` shifts every later element, so removing many elements this way does a lot of copying. Lesson 09 shows the faster tools for that: the erase-remove idiom and C++20's `std::erase_if`, which also works on maps.

::: example Watching an unordered_map rehash
```cpp
#include <cstdio>
#include <unordered_map>

void show_order(const char* label, const std::unordered_map<int, double>& m) {
    std::printf("%s buckets %3zu, order:", label, m.bucket_count());
    for (const auto& [id, s] : m) std::printf(" %d", id);
    std::printf("\n");
}

int main() {
    std::unordered_map<int, double> scale;
    for (int id : {5, 12, 18, 30}) scale[id] = 0.1 * id;
    const double* p = &scale.at(12);                 // pointer to one element
    show_order("before:", scale);

    for (int id = 100; id < 120; ++id) scale[id] = 1.0;  // grows past the load limit
    std::printf("after 20 inserts: size %zu, buckets %zu, load factor %.3f\n",
                scale.size(), scale.bucket_count(), scale.load_factor());
    std::printf("element 12 still at same address: %s, value %.1f\n",
                p == &scale.at(12) ? "yes" : "no", *p);

    std::unordered_map<int, double> planned;
    planned.reserve(128);                            // buckets for 128 at load factor 1
    const std::size_t b0 = planned.bucket_count();
    for (int id = 0; id < 128; ++id) planned[id] = 0.0;
    std::printf("reserved: buckets %zu before, %zu after 128 inserts\n",
                b0, planned.bucket_count());

    std::unordered_map<int, double> same4;           // the same four keys again,
    for (int id : {5, 12, 18, 30}) same4[id] = 0.1 * id;
    same4.rehash(64);                                // but spread over more buckets
    show_order("rehashed:", same4);
}
```

Output with g++ 13:

```text
before: buckets  13, order: 30 12 18 5
after 20 inserts: size 24, buckets 29, load factor 0.828
element 12 still at same address: yes, value 1.2
reserved: buckets 137 before, 137 after 128 inserts
rehashed: buckets  67, order: 5 18 12 30
```

Read it line by line. The map started with 13 buckets. Twenty more keys made 24 elements, and 24 elements in 13 buckets would be a load factor of about $1.85$, above the default maximum of $1.0$. So the map rehashed, to 29 buckets: $24 / 29 \approx 0.828$.

The pointer `p` still found element 12, value $0.1 \times 12 = 1.2$, at the same address. Nodes do not move in a rehash, so pointers and references survive, exactly as the rule says.

`reserve(128)` set up 137 buckets before anything was inserted — at least 128, and libstdc++ picks prime numbers. All 128 inserts then fit with no rehash: $128 / 137 \approx 0.934$, under $1.0$.

The last line is why iterators do not survive. The same four keys, spread over 67 buckets instead of 13, come out in a different order: `5 18 12 30` instead of `30 12 18 5`. An iterator in the middle of the old order has no meaningful "next" in the new one.

Sanity check: every bucket count printed is at least the element count divided by $1.0$, the maximum load factor.
:::

::: warning Growing a container while you walk it
A range-based `for` over a container holds iterators for the whole loop. Inserting into a vector, a deque or an unordered_map inside that loop may invalidate them: a reallocation, a rebuilt block index, or a rehash. It can work in every test and fail the day the container crosses a capacity or load limit. Collect new elements in a separate container and add them after the loop, or `reserve` enough room first and loop by index.
:::

## Check yourself

::: check
You hold a reference `Channel& c = channels[7];`. Say whether it is still valid after each operation, if `channels` is (a) a `std::vector<Channel>` with spare capacity, and `push_back` is called; (b) the same vector, full, and `push_back` is called; (c) a `std::deque<Channel>`, and `push_front` is called; (d) a `std::unordered_map<int, Channel>` (with `c = channels[7]` looking up key 7) that rehashes during an insert.
:::

::: answer
(a) Valid. The new element goes into spare capacity, nothing moves, and only `end()` is invalidated. (b) Invalid. The size exceeds the capacity, so the vector reallocates and every reference moves to freed memory. (c) Valid. Pushing at either end of a deque invalidates its *iterators*, but references to elements stay valid, because elements never move between blocks. Note that element 7 is now at index 8. (d) Valid. A rehash rebuilds the buckets, but the nodes holding the elements stay put, so references and pointers survive. Only iterators are invalidated.
:::

::: check
Put these in order from weakest to strongest category, and name one container whose iterators are in each: bidirectional, contiguous, forward, random access, input.
:::

::: answer
Input (reading `std::istream_iterator`; no container), forward (`std::forward_list`, `std::unordered_map`), bidirectional (`std::list`, `std::map`, `std::set`), random access (`std::deque`), contiguous (`std::vector`, `std::array`, `std::string`). Each can do everything the one before it can. The vector's iterators are therefore also random-access, bidirectional, forward and input iterators, so a vector works with every algorithm.
:::

::: check
A range is $[\text{first}, \text{last})$ over a `std::vector<int>` with `first = v.begin() + 3` and `last = v.begin() + 7`. How many elements does it hold, and which indices? What is the range $[\text{last}, \text{last})$?
:::

::: answer
`last - first` $= 7 - 3 = 4$ elements: indices 3, 4, 5 and 6. Index 7 is not included — the round bracket. $[\text{last}, \text{last})$ has `first == last`, so it is an empty range with zero elements. Any algorithm given it does nothing, which is exactly what you want at the edge of a split.
:::

::: check
Why does `std::distance(l.begin(), l.end())` on a `std::list` with a million elements take far longer than the same call on a vector of a million? What should you call on the list instead?
:::

::: answer
`std::distance` uses one subtraction for random-access iterators, so on the vector it is a single step. A list's iterators are only bidirectional, so `std::distance` must walk from `begin` to `end` one node at a time: a million link-follows, each one probably a cache miss, since nodes are scattered around the heap. Call `l.size()` instead, which the list keeps up to date and returns in constant time.
:::

::: check
This loop is meant to remove every negative reading from a `std::vector<double> v`: `for (auto it = v.begin(); it != v.end(); ++it) if (*it < 0) v.erase(it);`. Name the rule it breaks, and rewrite the loop so it is correct.
:::

::: answer
Erasing from a vector invalidates every iterator at or after the erased position, including `it` itself, and then `++it` is applied to it. In practice, too, the element after the erased one slides into `it`'s slot and is skipped by the `++`, and if the last element is erased, `it` can step past `end()`. Correct version:

`for (auto it = v.begin(); it != v.end(); ) { if (*it < 0) it = v.erase(it); else ++it; }`

`erase` returns an iterator to the element that moved into the erased slot. This is correct, but each `erase` shifts every later element, so it is slow for many removals; lesson 09's `std::erase_if(v, pred)` does the job in one pass.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Iterator | a bookmark into a container | `*it` reads, `++it` moves, `==` compares |
| `begin()`, `end()` | first element; one past the last | never dereference `end()` |
| Half-open range | $[\text{first}, \text{last})$ | empty when `first == last`; size `last - first` for random access |
| Input, forward | one pass; many passes | forward-only |
| Bidirectional | adds `--it` | list, map, set |
| Random access | adds `it + n`, `it2 - it1`, `<` | deque; needed by `std::sort` |
| Contiguous | random access, elements side by side | vector, array, string, span |
| Invalidated | handle to a moved or destroyed element | using it is undefined behavior |
| vector | reallocation on growth past capacity | invalidates everything; `reserve` prevents it |
| deque | push at an end | all iterators, but no references |
| list, map, set | node-based | insert invalidates nothing; erase only the erased |
| unordered_map | rehash on growth | all iterators, but no references; `reserve` prevents it |
| Erasing in a loop | `it = c.erase(it);` | step with `++it` only when nothing was erased |

Next lesson: with ranges and iterator categories in hand, the algorithms themselves — `sort`, `stable_sort`, `nth_element`, `lower_bound`, `binary_search` and `find_if` — what each needs, what each costs, and which one to reach for.

::: context iterator-name Where the word comes from
To iterate means to do something again and again, one step after another; the word comes from the Latin *iterum*, "again". An iterator is the thing that lets you repeat "look at this element, then move to the next" across a container. Python uses the same word for the objects a `for` loop walks, so if you have written `for x in data:`, you have used an iterator already.
:::

::: context one-past-end The spot after the last element
For a vector of five elements at positions 0 to 4, `end()` marks position 5. There is no element there. It is a marker, like the white line after the last parking space. C++ guarantees you may form the address one past the end of an array and compare with it, but not read from it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="20" y="34" width="50" height="30"/><rect x="70" y="34" width="50" height="30"/>
    <rect x="120" y="34" width="50" height="30"/><rect x="170" y="34" width="50" height="30"/>
    <rect x="220" y="34" width="50" height="30"/>
  </g>
  <rect x="270" y="34" width="50" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="54">3.1</text><text x="95" y="54">7.4</text><text x="145" y="54">9.9</text>
    <text x="195" y="54">2.0</text><text x="245" y="54">8.8</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="45" y="26">0</text><text x="95" y="26">1</text><text x="145" y="26">2</text>
    <text x="195" y="26">3</text><text x="245" y="26">4</text><text x="295" y="26">5</text>
  </g>
  <line x1="45" y1="96" x2="45" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="45,66 40,76 50,76" fill="#1d6fd1"/>
  <text x="45" y="112" font-size="12" fill="#1d6fd1" text-anchor="middle">begin()</text>
  <line x1="295" y1="96" x2="295" y2="68" stroke="#b4232c" stroke-width="2"/>
  <polygon points="295,66 290,76 300,76" fill="#b4232c"/>
  <text x="295" y="112" font-size="12" fill="#b4232c" text-anchor="middle">end(): no element</text>
</svg>
```
:::

::: context dijkstra-half-open An old argument for [a, b)
In 1982 the computer scientist Edsger Dijkstra wrote a short note, "Why numbering should start at zero", about how to write a range of whole numbers. He compared four conventions and argued for including the lower bound and excluding the upper, as in $2 \le i < 13$: the length is the difference of the bounds, adjacent ranges meet without overlap, and an empty range needs no odd-looking bounds. Starting indices at 0 then makes a range of $n$ elements $0 \le i < n$. The C++ library follows the same convention with iterators.
:::

::: context stepanov Where iterators came from
The Standard Template Library, the containers-algorithms-iterators core of the C++ library, was designed mainly by Alexander Stepanov, with Meng Lee, at Hewlett-Packard, and accepted into the C++ standard in 1994. Its central idea was to write each algorithm once, against the weakest iterator category it needs, so that any container providing such iterators gets the algorithm for free. That is why `std::find_if` works on a list, a vector and a file stream alike.
:::

::: context category-ladder Each rung adds a power
Each category can do everything the rungs below it can, plus the new operation shown. An algorithm asks for a rung; any iterator on that rung or higher will do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="10" width="150" height="30" fill="#1d6fd1"/>
    <rect x="20" y="46" width="150" height="30" fill="#8fb8f0"/>
    <rect x="20" y="82" width="150" height="30" fill="#8fb8f0"/>
    <rect x="20" y="118" width="150" height="30" fill="#8fb8f0"/>
    <rect x="20" y="154" width="150" height="30" fill="#ffffff"/>
  </g>
  <g font-size="12" text-anchor="middle">
    <text x="95" y="30" fill="#ffffff">contiguous</text>
    <text x="95" y="66" fill="#1f2a44">random access</text>
    <text x="95" y="102" fill="#1f2a44">bidirectional</text>
    <text x="95" y="138" fill="#1f2a44">forward</text>
    <text x="95" y="174" fill="#1f2a44">input</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="180" y="30">+ side by side: vector, array</text>
    <text x="180" y="66">+ it + n, it2 - it1: deque</text>
    <text x="180" y="102">+ --it: list, map, set</text>
    <text x="180" y="138">+ many passes: unordered_map</text>
    <text x="180" y="174">*it, ++it, one pass: istream</text>
  </g>
</svg>
```
:::

::: context load-factor-bridge Back to lesson 03
The load factor is the number of elements divided by the number of buckets, so it is the average bucket's length. Keeping it at or below a maximum, 1.0 by default, keeps the average lookup short. `max_load_factor` changes the limit; lower means more buckets, more memory, and shorter chains. Lesson 03 covers what happens to lookup time as the load factor grows, and why a bad hash can make it linear anyway.
:::

::: context handles Indices and handles
An index is a position number, not an address. After a vector reallocates, index 7 still means "the eighth element", because it is worked out fresh from the new buffer each time. Many flight systems go one step further and keep all objects of a kind in one fixed-size table created at start-up, handing out small integer handles into it. A handle can also carry a generation count, so that a handle to a slot that has since been reused can be detected and refused instead of silently pointing at the wrong object.
:::

::: context asan-blind-spot Why AddressSanitizer missed it
ASan checks only the memory reads and writes in code that was compiled with `-fsanitize=address`. Stepping a map iterator to the next node calls a function inside the shared libstdc++ library, which was compiled long ago without that flag, so its reads of the freed node's links went unchecked. The freed node was also sitting in ASan's quarantine rather than being reused, so its stale links still led somewhere sensible. A tool is only as good as the code it can see; this is why teams run several.
:::

::: context debug-mode The checked library build
With `-D_GLIBCXX_DEBUG` on the command line, libstdc++ swaps in checked versions of its containers and iterators. Each iterator remembers which container it belongs to, and each container tells its iterators when they become invalid. Using a bad iterator stops the program with a message naming the error. The price is larger, slower containers, so it belongs in test builds, never in flight builds. Microsoft's library has a similar switch, and LLVM's libc++ has hardening modes.
:::

::: context singular What "singular" means
The standard calls an iterator singular when it is not associated with any sequence: a default-constructed iterator that was never pointed at anything, or one whose element was erased. The only safe things to do with a singular iterator are to assign a new value to it or destroy it. Reading through it, stepping it, or even comparing it with another iterator is undefined behavior.
:::
