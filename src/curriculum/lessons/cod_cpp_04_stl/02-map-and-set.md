---
id: l02-map-and-set
title: "Ordered containers: map and set"
minutes: 23
covers:
  - map and set (red-black tree, ordered, node-based, cache-hostile)
---

Play the guessing game. A friend thinks of a number from 1 to 100. You guess 50; she says "lower". You guess 25; "higher". Each answer throws away half of what is left, so you always win in seven guesses or fewer. Now freeze that game into memory: every guess becomes a box, and each box holds two arrows, one to the box you would try on "lower" and one for "higher". That frozen game is a **binary search tree**, and it is what sits inside `std::map` and `std::set`.

Last lesson built a sorted `std::array` and searched it with the same halving trick. The tree does the same search, but each box is a separate heap block, like the nodes of a `std::list`. That buys something the array cannot do cheaply — insert and remove keys at any time while staying sorted — and it costs what the list cost: allocations and scattered memory.

This lesson opens up the tree, shows the rule that keeps it balanced, and then measures it against the sorted array on one machine. The honest result is more interesting than "the tree is slow", and it is exactly the kind of result you will need to defend in a design review.

## What map and set promise

A `std::map<K, V>` (read "map from K to V") stores **key–value pairs**, at most one per key, always sorted by key. A `std::set<K>` stores keys alone, each at most once, also sorted. Both live in headers of the same names.

```cpp
std::map<std::uint16_t, double> gains;   // channel id -> gain
gains[40] = 20.0;                        // insert, or overwrite if 40 exists
gains.insert({12, 6.0});                 // insert only if 12 is absent
auto it = gains.find(40);                // iterator to the pair, or gains.end()
gains.erase(12);                         // remove by key
```

The operations you will use most, and what they cost for a container of $n$ elements:

- `find`, `insert`, `erase`, `count`, `contains` (C++20): $O(\log n)$ each, read "order log n" — the work grows like $\log_2 n$, the number of halvings. The **[[O|big-o]]** hides the constant in front.
- Walking from `begin()` to `end()` visits the keys **in increasing order**. Every time, for free.
- `lower_bound(k)` gives the first key not less than `k`; `upper_bound(k)` the first key greater than `k`. Together they pick out a **range** of keys, such as every channel id from 15 to 60.

These bounds are *guarantees*, not averages: the standard requires logarithmic time in the worst case. That is the tree's great strength, and it matters again in the next lesson, whose hash tables promise far less.

::: warning `operator[]` is a read that can write
`gains[999]` means "the value for key 999 — and if there is none, insert one with a default value". So a line that only looks like a read changes the map:

```cpp
std::map<std::uint16_t, double> gains{{3, 1.5}, {12, 6.0}};
if (gains[999] > 1.0) std::puts("big gain");          // a read that writes
std::printf("size %zu, gains[999] = %.1f\n", gains.size(), gains[999]);
const auto it = gains.find(500);                      // a read that only reads
std::printf("500 %s, size still %zu\n", it == gains.end() ? "absent" : "present", gains.size());
```

```text
size 3, gains[999] = 0.0
500 absent, size still 3
```

The map grew from two entries to three, and in a real system that is a heap allocation hidden inside an `if`. To look something up, use `find`, `contains` or `at` (which throws if the key is missing). `operator[]` does not even compile on a `const` map, which is a useful hint.
:::

## Inside: a tree that keeps itself balanced

Each element lives in a **node**: a heap block with the key (and value, for a map), a pointer to its left child, a pointer to its right child and a pointer to its parent. Everything in a node's left subtree has a smaller key; everything in its right subtree, a larger one. To find a key, start at the top node, the **root**, and go left or right at each node until you hit it or run out of tree. Each step is one guess in the guessing game.

The danger is balance. Insert 1, 2, 3, … in order into a plain binary search tree and every new key goes to the right of the last one: the "tree" is a list, and a search takes $n$ steps instead of $\log_2 n$. The standard's worst-case promise rules that out, so every major library builds `std::map` and `std::set` as a **red-black tree** — a binary search tree that repairs its own shape after every insert and erase.

Every node carries one extra bit, a color, red or black, and the tree keeps three rules:

1. The root is black.
2. A red node never has a red child.
3. Every path from a node down to an empty spot below it passes through the same number of black nodes.

Rule 3 says the black nodes are perfectly balanced. Rule 2 says red nodes can only be sprinkled between black ones, never two in a row. Together they mean the longest path from the root is at most twice the shortest. When an insert or erase breaks a rule, the tree recolours some nodes and performs a few **[[rotations|rotation]]** — local rearrangements that change which node is a parent of which without disturbing the sorted order. An insert needs at most two rotations, so the repair is $O(\log n)$ like the search.

::: note Why the height is at most $2\log_2(n+1)$
Call the number of black nodes on any path from a node down to an empty spot (not counting the node itself) its **black height**, $b$. By rule 3 this is the same on every path. A subtree whose root has black height $b$ contains at least $2^b - 1$ nodes: true for an empty subtree ($b = 0$, zero nodes), and each child of a node with black height $b$ has black height at least $b - 1$, so the node plus two children's subtrees hold at least $1 + 2(2^{b-1} - 1) = 2^b - 1$. Now take the whole tree, with height $h$ nodes on its longest path. By rule 2, at least half the nodes on that path are black, so the root's black height is at least $h/2$. Therefore $n \ge 2^{h/2} - 1$, and rearranging, $h \le 2\log_2(n + 1)$. For 128 keys: $2\log_2 129 \approx 14.0$, so no search ever visits more than 14 nodes. Inserting the keys 1 to 128 in order into a libstdc++ `std::map` gave a tree 12 nodes tall — inside the bound, where a plain tree would be 128 tall.
:::

The name, and the idea, come from a **[[1978 paper|rb-history]]**; the tree for seven channel ids appears in the example below, colors and all.

::: example Opening up a map's nodes
This program counts the heap allocations a `std::map` and a `std::set` make, using the same replaced `operator new` trick as a test harness would, and then uses the ordering:

```cpp laptop
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <map>
#include <new>
#include <set>

static long g_allocs = 0, g_bytes = 0;
void* operator new(std::size_t n) {
    ++g_allocs; g_bytes += static_cast<long>(n);
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc{};
}
[[gnu::noinline]] void operator delete(void* p) noexcept { std::free(p); }
[[gnu::noinline]] void operator delete(void* p, std::size_t) noexcept { std::free(p); }

int main() {
    std::map<std::uint16_t, double> gains;
    const std::uint16_t ids[] = {40, 12, 97, 3, 55, 71, 20};
    for (std::uint16_t id : ids) gains[id] = id * 0.5;
    std::printf("map: %zu entries, %ld allocations, %ld bytes (%ld per node)\n",
                gains.size(), g_allocs, g_bytes, g_bytes / g_allocs);
    std::printf("payload per entry: %zu bytes\n", sizeof(std::pair<const std::uint16_t, double>));
    std::printf("in order:");
    for (const auto& [id, g] : gains) std::printf(" %u", id);
    std::printf("\n");

    g_allocs = g_bytes = 0;
    std::set<std::uint16_t> s(std::begin(ids), std::end(ids));
    std::printf("set: %ld allocations, %ld bytes per node\n", g_allocs, g_bytes / g_allocs);
    auto lo = s.lower_bound(15), hi = s.upper_bound(60);
    std::printf("ids from 15 to 60:");
    for (auto it = lo; it != hi; ++it) std::printf(" %u", *it);
    std::printf("\n");
}
```

Defining your own global `operator new` replaces the library's for the whole program, so every container allocation passes through the counter. (`[[gnu::noinline]]` on the two `delete`s stops a false `-Wmismatched-new-delete` warning from g++ 13; clang++ accepts it too.) `for (const auto& [id, g] : gains)` is a **structured binding**: read it "for each id and gain in gains"; it names the two halves of each pair. Output, identical under g++ 13 and clang++ 18:

```text
map: 7 entries, 7 allocations, 336 bytes (48 per node)
payload per entry: 16 bytes
in order: 3 12 20 40 55 71 97
set: 7 allocations, 40 bytes per node
ids from 15 to 60: 20 40 55
```

Step by step:

1. **One allocation per key.** Seven inserts, seven trips to the heap. There is no `reserve` for a tree.
2. **48 bytes per node, 16 of them data.** The pair is a 2-byte key padded to 8, plus an 8-byte double: 16 bytes. The other 32 bytes are the node's bookkeeping: the color (padded to 8 bytes) and three pointers of 8 bytes each. The tree spends twice as much memory on structure as on data.
3. **Keys come out sorted,** though they went in as 40, 12, 97, 3, 55, 71, 20.
4. **A set node is 40 bytes:** the same 32 bytes of bookkeeping plus a 2-byte key, rounded up to a multiple of 8.
5. **`lower_bound(15)` and `upper_bound(60)`** marked the range, and walking between them printed 20, 40 and 55 — every stored id from 15 to 60.

Sanity check: $7 \times 48 = 336$ bytes. The same seven pairs in a sorted `std::array` would be $7 \times 16 = 112$ bytes with no allocation. The **[[tree those inserts built|rb-picture]]** has 40 at its root and is three levels deep.
:::

::: key
`std::map` and `std::set` are red-black trees: ordered, with guaranteed $O(\log n)$ find, insert and erase, and every element in its own heap-allocated node.
:::

## Node-based: what it gives and what it costs

Because each element is its own node, the tree has the list's best property: **elements never move**. Inserting or erasing other keys only relinks pointers, so an iterator, pointer or reference to an element stays valid until that element itself is erased. Lesson 06 puts that rule beside the others; for now, notice it is the opposite of the vector's.

The costs are also the list's:

- **An allocation per insert.** A map filled inside a control loop calls the allocator on every new key — the unbounded, fragmenting operation last lesson ruled out. A map built once at start-up and only read afterwards avoids that, but still pays the next two costs.
- **Memory overhead.** 32 bytes of bookkeeping per node here, plus whatever the allocator adds around each block.
- **Scattered memory.** Nodes are allocated one at a time, whenever keys arrive, in among everything else the program allocates. Walking from a node to its child means loading a pointer and then going wherever it points, which may be a cache line the processor has never seen. This is called **[[pointer chasing|pointer-chasing]]**, and it is why node-based containers are described as **cache-hostile**.

A sorted array does the same binary search over one contiguous block. For 128 entries of 16 bytes, that is 2048 bytes in 32 cache lines, and the last two or three steps of the search land in a line already fetched. The theory says the array should win whenever the data is not already sitting in cache. So let us measure.

::: example Map against sorted vector, 128 entries, hot and cold
The program builds a `std::map<std::uint32_t, double>` and a sorted `std::vector` of 16-byte entries with the same 128 keys, inserted in random order with other allocations in between, as happens in a real program. It then times three things:

- **hot lookup:** a million random lookups back to back, so the table stays in cache;
- **cold lookup:** one lookup after reading through 32 MB of other memory, the way a control task finds its tables after the rest of the cycle's work, averaged over 2000 tries;
- **cold walk:** summing all 128 values in key order after the same flush.

```cpp
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <map>
#include <memory>
#include <random>
#include <vector>

struct Entry { std::uint32_t id; double value; };
using Clock = std::chrono::steady_clock;

std::vector<char> g_other(32u << 20, 1);    // 32 MB of "other work"
long evict_cache() {                        // touch one byte per 64-byte line
    long s = 0;
    for (std::size_t i = 0; i < g_other.size(); i += 64) s += g_other[i];
    return s;
}

template <typename F>
double cold_ns(F f, double& sink) {         // time one call after the cache is flushed
    sink += static_cast<double>(evict_cache());
    const auto t0 = Clock::now();
    sink += f();
    const auto t1 = Clock::now();
    return std::chrono::duration<double, std::nano>(t1 - t0).count();
}

int main() {
    constexpr std::size_t N = 128;
    std::mt19937 gen(7);
    std::vector<std::uint32_t> ids(N);
    for (std::size_t i = 0; i < N; ++i) ids[i] = static_cast<std::uint32_t>(3 * i + 1);
    std::shuffle(ids.begin(), ids.end(), gen);

    // Build both tables. Other allocations happen in between, as in a real
    // program, so the map's nodes do not sit side by side in memory.
    std::vector<std::unique_ptr<char[]>> others;
    std::uniform_int_distribution<int> other_size(16, 2048);
    std::map<std::uint32_t, double> tree;
    std::vector<Entry> table;
    for (std::uint32_t id : ids) {
        others.emplace_back(new char[other_size(gen)]);
        tree[id] = 0.5 * id;
        table.push_back({id, 0.5 * id});
    }
    std::sort(table.begin(), table.end(),
              [](const Entry& a, const Entry& b) { return a.id < b.id; });

    auto map_find = [&](std::uint32_t q) { return tree.find(q)->second; };
    auto vec_find = [&](std::uint32_t q) {
        return std::lower_bound(table.begin(), table.end(), q,
            [](const Entry& e, std::uint32_t k) { return e.id < k; })->value;
    };

    // Hot: a million lookups back to back, everything stays in cache.
    std::uniform_int_distribution<std::size_t> pick(0, N - 1);
    std::vector<std::uint32_t> queries(1'000'000);
    for (auto& q : queries) q = ids[pick(gen)];
    double sink = 0.0;
    auto hot = [&](auto find) {
        const auto t0 = Clock::now();
        for (std::uint32_t q : queries) sink += find(q);
        return std::chrono::duration<double, std::nano>(Clock::now() - t0).count() / 1e6;
    };
    const double hot_map = hot(map_find), hot_vec = hot(vec_find);

    // Cold: one lookup, or one walk over all 128 entries, after flushing.
    double cm = 0, cv = 0, wm = 0, wv = 0;
    constexpr int R = 2000;
    for (int r = 0; r < R; ++r) {
        const std::uint32_t q = ids[pick(gen)];
        cm += cold_ns([&] { return map_find(q); }, sink);
        cv += cold_ns([&] { return vec_find(q); }, sink);
        wm += cold_ns([&] { double s = 0; for (const auto& kv : tree) s += kv.second; return s; }, sink);
        wv += cold_ns([&] { double s = 0; for (const auto& e : table) s += e.value; return s; }, sink);
    }
    std::printf("128 entries        std::map   sorted vector\n");
    std::printf("hot lookup      %8.0f ns %10.0f ns\n", hot_map, hot_vec);
    std::printf("cold lookup     %8.0f ns %10.0f ns\n", cm / R, cv / R);
    std::printf("cold walk (all) %8.0f ns %10.0f ns\n", wm / R, wv / R);
    if (sink == 42.0) std::puts("");
}
```

The small functions written `[&](...) { ... }` are **lambdas**, unnamed functions that can use the local variables around them; lesson 10 explains them. `sink` collects every result so the compiler cannot delete work whose answer is never used. Built with `g++ -std=c++20 -Wall -Wextra -O2` and run three times on one machine (a 2.1 GHz Xeon server), the first run printed:

```text
128 entries        std::map   sorted vector
hot lookup            33 ns         42 ns
cold lookup          787 ns        388 ns
cold walk (all)     6422 ns        349 ns
```

The other two runs gave 33 against 41 and 45 ns hot, 865 and 783 ns against 377 and 333 ns cold, and walks of 6856 and 6651 ns against 374 and 328 ns. Read it row by row.

1. **Hot lookup: the map won**, 33 ns to about 42. Everything fits in the fastest cache, so pointer chasing costs little, and both do about eight comparisons. The vector's binary search is slowed by **[[branch mispredictions|branch-prediction]]**: with random keys, the processor cannot guess which half comes next.
2. **Cold lookup: the vector won by about two times**, 388 ns to 787. Now each step down the tree is a separate trip to memory for a node that could be anywhere. The array's steps converge on a few neighboring lines.
3. **Cold walk: the vector won by about eighteen times**, 349 ns to 6422. The walk touches every element, and the vector's 2048 bytes arrive in 32 predictable lines, while the map visits 128 scattered nodes one pointer at a time.

Sanity check: 787 ns for about 8 to 12 dependent memory reads is 65 to 100 ns each, the right size for a trip to main memory on a server. Timings vary between machines and runs; which column wins, and by roughly how much, is what repeated here.
:::

A second program ran the hot loop alone, with random keys, for bigger and bigger tables. On the same machine:

| entries | `std::map` | sorted vector |
| --- | --- | --- |
| 16 | 19 ns | 22 ns |
| 128 | 32 ns | 43 ns |
| 1,024 | 54 ns | 63 ns |
| 16,384 | 112 ns | 97 ns |
| 262,144 | 392 ns | 203 ns |
| 2,097,152 | 1,095 ns | 370 ns |

Once the tree outgrows the caches, even the hot loop goes cold, and the vector pulls ahead: about three times faster at two million entries.

::: key Why is std::map often slower than a sorted vector for small N?
It is a node-based red-black tree: every node is a separate allocation, so traversal chases pointers and misses cache. A contiguous array of the same data fits in a few cache lines.
:::

Notice the word *often*. In one very hot loop, on this machine, the small map was quicker per lookup. In a real control cycle the table is visited once per cycle between other work, which is the cold row, and there the array wins lookups by two times and walks by eighteen. That, plus zero allocations and a third of the memory, is why the fixed channel table is a sorted array. Measure your own case, and measure the case the program really runs.

::: warning A benchmark that only measures the hot case
A tight loop of lookups keeps the whole table in the fastest cache, and allocates the tree's nodes neatly side by side if nothing else is allocated in between. That is the kindest possible setting for a node-based container. If your benchmark shows a map "as fast as an array", ask whether the flight program will ever run it that way.
:::

## When a map is the right tool

None of this makes `std::map` bad. It is the right choice when you need what only a balanced tree gives together:

- keys that **arrive and leave at run time**, in any order, while the container **stays sorted**;
- **range queries**: every event between two timestamps, the first scheduled command after now;
- **stable references** to elements while others come and go;
- a **worst case** of $O(\log n)$, with no bad inputs.

A ground-side sequencer that keeps pending commands sorted by execution time, receives new ones from operators and pulls the next due one each second is a good fit. So is almost any analysis tool. Keys only need a less-than comparison that behaves sensibly, which the map uses to decide **[[when two keys are the same|strict-weak]]**.

When the data is built once and then only read — a flight table, a configuration loaded at start-up — sort a vector or array instead. C++23 even packages that as `std::flat_map`, a **[[map interface over sorted arrays|flat-map]]**.

## Check yourself

::: check
A red-black tree holds 1000 keys. What is the most nodes a search can visit, and how does that compare with a perfectly balanced tree and with a plain binary search tree fed keys in sorted order?
:::

::: answer
The height bound is $h \le 2\log_2(n+1) = 2\log_2 1001 \approx 19.9$, so at most 19 nodes. A perfectly balanced tree of 1000 nodes has $\lceil \log_2 1001 \rceil = 10$ levels, so the red-black tree is at worst about twice as deep as perfect. A plain binary search tree fed sorted keys degenerates into a chain 1000 nodes long, so a search can visit all 1000. The rebalancing rules exist to rule that case out.
:::

::: check
How many bytes of heap does a `std::map<std::uint16_t, double>` with 128 entries use on this library, not counting the allocator's own overhead? Compare with a sorted `std::array` of 16-byte entries.
:::

::: answer
Each node is 48 bytes (32 of bookkeeping, 16 of pair), so $128 \times 48 = 6144$ bytes in 128 separate allocations. The sorted array is $128 \times 16 = 2048$ bytes in place, with no allocation at all. The map uses three times the memory before counting the allocator's per-block headers, and those blocks are spread across the heap instead of sitting in 32 consecutive cache lines.
:::

::: check
A telemetry monitor writes `if (limits[channel] < reading) raise_alarm(channel);` where `limits` is a `std::map<std::uint16_t, double>`. A corrupted packet carries channel id 60000, which has no limit. What happens, twice?
:::

::: answer
The first time, `limits[60000]` finds no key, so it inserts one with a value-initialized `double`, 0.0 — a heap allocation inside the monitoring code. The comparison is then `0.0 < reading`, so any positive reading raises a false alarm. The second time, the key exists, so there is no new allocation, but the entry with limit 0.0 stays in the table for good and the false alarm repeats. The fix is `find` (or `contains`) and an explicit decision about unknown channels, probably rejecting the packet.
:::

::: check
In the measurement, the map beat the sorted vector for hot lookups but lost badly for the cold walk. Explain both results with the same two ideas.
:::

::: answer
The ideas are cache locality and prediction. Hot, every node is already in the fastest cache, so following a pointer costs a few cycles; what remains is the comparison sequence, and the vector's search, with random keys, keeps mispredicting which way to branch. Cold, every node the map touches is a separate trip to memory whose address is not known until the previous node arrives, while the vector's data is 32 consecutive lines the hardware can fetch ahead. A walk touches all 128 nodes, so the difference is multiplied by 128, which is why that row showed the biggest gap.
:::

::: check
A mission planner stores upcoming ground-station passes keyed by start time, adds new ones as predictions improve, deletes past ones, and asks "what is the first pass after time t?" Is `std::map` a reasonable choice there? Would it be in the attitude control loop?
:::

::: answer
In the planner, yes: keys arrive and leave at run time, the container must stay sorted, and "first pass after t" is `upper_bound(t)`, logarithmic and exact. It runs on the ground or in a slow background task, so the allocations are acceptable. In the attitude loop, no: every new key allocates a node, which the no-allocation-after-initialization rule forbids, and a lookup through scattered nodes costs a cold cache miss per level. There a fixed, sorted array built at start-up does the job.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::map<K, V>` | key–value pairs sorted by key, one per key | find, insert, erase $O(\log n)$ worst case |
| `std::set<K>` | sorted unique keys | same tree, no values |
| `operator[]` | read or insert | inserts a default value if the key is missing; use `find` to only read |
| `lower_bound` / `upper_bound` | first key not less than / greater than `k` | pick out a range of keys in order |
| red-black tree | self-balancing binary search tree | root black; no red child of red; equal black count on every path |
| height bound | deepest path in nodes | $h \le 2\log_2(n+1)$; 14 for 128 keys |
| node | one heap block per element | 48 bytes for a `uint16_t`→`double` pair in libstdc++, 32 of them bookkeeping |
| node-based | elements never move | references survive other inserts and erases |
| cache-hostile | each step chases a pointer to scattered memory | cold lookup about 2×, walk about 18× slower than sorted vector at 128 entries, on one machine |
| use map when | keys change at run time and order or ranges matter | not in a loop that must not allocate |

Next lesson turns to the other way of finding a key fast — hashing — with `std::unordered_map` and `std::unordered_set`, and puts all three candidates for the 128-entry table side by side.

::: context big-o Reading the big O
$O(\log n)$ is read "order log n" or "big O of log n". It says how the work grows as the container grows, ignoring constant factors. $O(1)$ means it does not grow at all, $O(n)$ that it grows in proportion to the size, and $O(\log n)$ that it grows by one step each time the size doubles. For 128 keys, $\log_2 128 = 7$; for a million, about 20. That slow growth is why logarithmic containers scale so well — but the O says nothing about the size of each step, which is what the cache decides.
:::

::: context rotation A rotation, drawn
A left rotation at node x lifts its right child y into x's place. x becomes y's left child, and y's old left subtree, b, moves across to become x's right subtree. Everything in b was bigger than x and smaller than y before, and still is afterwards, so the sorted order is untouched. Only three pointers change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="60" y1="30" x2="30" y2="75"/><line x1="60" y1="30" x2="100" y2="75"/>
    <line x1="100" y1="75" x2="75" y2="120"/><line x1="100" y1="75" x2="125" y2="120"/>
    <line x1="280" y1="30" x2="240" y2="75"/><line x1="280" y1="30" x2="320" y2="75"/>
    <line x1="240" y1="75" x2="215" y2="120"/><line x1="240" y1="75" x2="265" y2="120"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="60" cy="30" r="13" fill="#8fb8f0"/><circle cx="100" cy="75" r="13" fill="#f2b880"/>
    <circle cx="280" cy="30" r="13" fill="#f2b880"/><circle cx="240" cy="75" r="13" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="34">x</text><text x="100" y="79">y</text>
    <text x="280" y="34">y</text><text x="240" y="79">x</text>
    <text x="30" y="90">a</text><text x="75" y="135">b</text><text x="125" y="135">c</text>
    <text x="215" y="135">a</text><text x="265" y="135">b</text><text x="320" y="90">c</text>
  </g>
  <line x1="150" y1="70" x2="195" y2="70" stroke="#b4232c" stroke-width="2"/>
  <polygon points="203,70 193,64 193,76" fill="#b4232c"/>
  <text x="175" y="58" font-size="11" fill="#b4232c" text-anchor="middle">rotate left</text>
</svg>
```
:::

::: context rb-history Where red-black trees come from
Rudolf Bayer described the underlying structure in 1972 under the name "symmetric binary B-trees". Leonidas Guibas and Robert Sedgewick recast it in 1978 in a paper titled "A dichromatic framework for balanced trees", which introduced the two colors; "dichromatic" means two-colored. The standard does not require a red-black tree, only the guarantees, but in practice libstdc++, LLVM's libc++ and Microsoft's library all use one.
:::

::: context rb-picture The seven channel ids, as a tree
Reading libstdc++'s own node colors and parent pointers after inserting 40, 12, 97, 3, 55, 71 and 20 gives this tree. Black nodes are dark, red nodes red. Every path from the root down has two black nodes, and no red node has a red child.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="30" x2="100" y2="85"/><line x1="180" y1="30" x2="260" y2="85"/>
    <line x1="100" y1="85" x2="60" y2="140"/><line x1="100" y1="85" x2="140" y2="140"/>
    <line x1="260" y1="85" x2="220" y2="140"/><line x1="260" y1="85" x2="300" y2="140"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="180" cy="30" r="16" fill="#1f2a44"/>
    <circle cx="100" cy="85" r="16" fill="#1f2a44"/>
    <circle cx="260" cy="85" r="16" fill="#1f2a44"/>
    <circle cx="60" cy="140" r="16" fill="#b4232c"/>
    <circle cx="140" cy="140" r="16" fill="#b4232c"/>
    <circle cx="220" cy="140" r="16" fill="#b4232c"/>
    <circle cx="300" cy="140" r="16" fill="#b4232c"/>
  </g>
  <g font-size="12" fill="#ffffff" text-anchor="middle">
    <text x="180" y="34">40</text><text x="100" y="89">12</text><text x="260" y="89">71</text>
    <text x="60" y="144">3</text><text x="140" y="144">20</text>
    <text x="220" y="144">55</text><text x="300" y="144">97</text>
  </g>
</svg>
```

Finding 55 takes three comparisons: 55 is more than 40, go right; less than 71, go left; found.
:::

::: context pointer-chasing Why pointer chasing is slow
A processor can have many memory reads in flight at once, as long as it knows the addresses. Walking an array, it does: the next address is the current one plus 16. Walking a tree or list, it does not: the address of the next node is *inside* the current node, so the next read cannot even start until the previous one finishes. Each cache miss is then paid in full, one after another. Engineers call these **dependent loads**, and a chain of them is the slowest way to read memory.
:::

::: context branch-prediction Guessing which way the code goes
A modern processor starts working on the instructions after an `if` before it knows the answer, betting on the way the branch went recently. A correct bet costs nothing; a wrong one throws away the partial work, typically 15 to 20 cycles. A binary search over random keys is a string of coin-flip branches, so it loses many bets. The map's search has branches too, but its time was also being spent waiting for nodes, so the lost bets overlap with waiting. Branch-free versions of binary search exist, and are a later optimization topic.
:::

::: context strict-weak What "the same key" means to a map
A map never asks whether two keys are equal. It asks only "is `a` less than `b`?", using `std::less<K>` unless you give it another comparison. Two keys count as the same when neither is less than the other. For that to work, the comparison must be a **strict weak ordering**: never true for `a < a`, and consistent, so that if `a < b` and `b < c` then `a < c`. A comparison that breaks these rules — say, comparing floating-point values where one is NaN — silently corrupts the tree.
:::

::: context flat-map A map made of vectors
C++23 adds `std::flat_map` and `std::flat_set` in headers `<flat_map>` and `<flat_set>`. They offer the same interface as `map` and `set` but store the keys, and the values, in sorted contiguous containers. Lookups are the binary search you measured; walks are fast; inserting in the middle shifts elements, which costs $O(n)$. g++ 13, the compiler used here, does not ship them yet, which is one more reason a flight team writes its own small sorted table.
:::
