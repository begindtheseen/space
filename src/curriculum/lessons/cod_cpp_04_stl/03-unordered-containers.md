---
id: l03-unordered-containers
title: "Hash tables: unordered_map and unordered_set"
minutes: 24
covers:
  - "unordered_map and unordered_set: hashing, load factor, worst case"
---

At a big concert, the coat check has 50 hooks. You hand over your coat, and instead of searching for a free hook, the attendant looks at the last two digits of your ticket, divides by 50 and takes the remainder: ticket 1437 goes on hook 37. When you come back, she does the same sum and walks straight to hook 37. No searching, however many coats there are. But if a friend's ticket is 2437, it lands on hook 37 as well, and the two coats share one hook. Now she has to check both.

That is a **hash table**. A **hash function** turns a key into a number; the number, divided by the table size, picks a **bucket** (the hook); and keys that land in the same bucket, a **collision**, share it. In C++ it is `std::unordered_map` and `std::unordered_set`, and the name says what you give up: unlike last lesson's `std::map`, the keys come out in no useful order.

In return, a lookup is one sum and a short walk, instead of a climb down a tree. *On average.* This lesson is about that word. You will measure how the table grows, how it can be forced into its worst case, and how it compares with the map and the sorted array for the 128-entry table that has run through this whole block of lessons.

## From key to bucket

An `unordered_map<K, V>` stores key–value pairs, one per key, like `map`; `unordered_set<K>` stores keys alone. The interface is nearly the same: `find`, `insert`, `erase`, `contains`, `operator[]` (with the same "a read that can insert" trap as in the map).

The difference is inside. The table keeps an array of buckets. To find key `k` it:

1. computes `std::hash<K>{}(k)` — read "hash of k" — a `std::size_t` number;
2. takes that number modulo the **bucket count**, `hash % bucket_count()`, to choose a bucket;
3. walks the short chain of nodes in that bucket, comparing keys with `==`, until it finds `k` or the chain ends.

Each element is still a heap-allocated node, as in the map, but a node here holds only the element and a pointer to the next node in the chain. This way of handling collisions, a list per bucket, is called **[[separate chaining|chaining]]**.

Step 1 costs whatever the hash function costs. For integers, libstdc++'s `std::hash` is the **[[identity function|identity-hash]]**: it returns the key itself. Strings get a real mixing function that reads every character.

::: example Watching the buckets grow
This program inserts the 128 channel ids of the running example, $7i + 1$ for $i = 0$ to $127$, and reports each time the table changes its number of buckets:

```cpp
#include <cstdint>
#include <cstdio>
#include <functional>
#include <unordered_map>

int main() {
    std::hash<std::uint16_t> h;
    std::printf("hash(7) = %zu, hash(300) = %zu\n", h(7), h(300));

    std::unordered_map<std::uint16_t, double> gains;
    std::printf("empty: bucket_count %zu, max_load_factor %.1f\n",
                gains.bucket_count(), gains.max_load_factor());
    std::size_t last = gains.bucket_count();
    for (int i = 0; i < 128; ++i) {
        const auto id = static_cast<std::uint16_t>(i * 7 + 1);
        gains[id] = 0.5 * i;
        if (gains.bucket_count() != last) {
            std::printf("size %3zu: rehash to %4zu buckets, load factor now %.2f\n",
                        gains.size(), gains.bucket_count(), gains.load_factor());
            last = gains.bucket_count();
        }
    }
    const std::uint16_t id = 7 * 100 + 1;   // channel 701
    std::printf("key %u lives in bucket %zu = %u mod %zu\n",
                id, gains.bucket(id), id, gains.bucket_count());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
hash(7) = 7, hash(300) = 300
empty: bucket_count 1, max_load_factor 1.0
size   1: rehash to   13 buckets, load factor now 0.08
size  14: rehash to   29 buckets, load factor now 0.48
size  30: rehash to   59 buckets, load factor now 0.51
size  60: rehash to  127 buckets, load factor now 0.47
size 128: rehash to  257 buckets, load factor now 0.50
key 701 lives in bucket 187 = 701 mod 257
```

Step by step:

1. **The integer hash is the identity:** 7 hashes to 7, 300 to 300.
2. **The first insert creates 13 buckets.** Before that, an empty table has a single placeholder bucket and allocates nothing.
3. **The 14th insert rehashes.** Fourteen elements in 13 buckets would be more than one element per bucket, which breaks the limit printed on the second line, `max_load_factor` 1.0. The table picked 29 buckets.
4. **Each rehash roughly doubles the buckets,** rounding up to a **[[prime number|prime-buckets]]**: 13, 29, 59, 127, 257.
5. **Bucket 187 for key 701**, because $701 = 2 \times 257 + 187$. Check it with long division: $2 \times 257 = 514$, and $701 - 514 = 187$.

Sanity check: after each rehash the load factor is about 0.5 — size 128 in 257 buckets is $128 / 257 \approx 0.498$. The table stays between half full and full, on average less than one element per bucket.
:::

## Load factor and rehashing

The **load factor** is `size() / bucket_count()`: the average number of elements per bucket, which is the average chain length a lookup must walk. Keep it small and lookups stay short. `max_load_factor()` is the ceiling, 1.0 by default. An insert that would push the load factor above it first triggers a **rehash**:

- allocate a new, bigger bucket array;
- walk every node and link it into its bucket in the new array (the bucket depends on `bucket_count`, so almost every node changes bucket);
- free the old bucket array.

That is $O(n)$ work in one insert, like a vector's reallocation, and it is amortised the same way: the bucket count grows by a factor, so the average cost per insert stays constant.

Unlike a vector's reallocation, a rehash does **not move the elements**. The nodes stay where they were; only the chains are relinked. So after a rehash:

- **iterators are invalidated** — an iterator knows its position in the bucket structure, and that structure was rebuilt;
- **pointers and references to elements stay valid** — the element is in the same node at the same address.

A run of the footprint program later in this lesson confirms it: a reference taken to key 1 when the table had 13 buckets still read the right value after inserts grew it to 257.

`reserve(n)` asks for enough buckets that `n` elements fit without a rehash. `m.reserve(128)` gave 137 buckets on this library, and then 128 inserts triggered no rehash at all. Unlike a vector's `reserve`, it does not preallocate the nodes: each insert still allocates one.

::: warning Iterating while inserting
`for (auto& [k, v] : m) if (v > limit) m[k + 1000] = limit;` looks harmless. Any insert may rehash, and a rehash invalidates the loop's iterators, so the loop may skip elements, repeat them or read freed bucket memory. Collect the new keys first, insert them after the loop.
:::

## Average O(1), worst case O(n)

Everything above assumed the keys spread evenly across the buckets. The famous "$O(1)$ lookup" of a hash table is a statement about that case: with a good hash and a load factor of about 1, the expected chain length is a constant, so the expected lookup time is a constant.

Nothing forces the keys to spread. If many keys land in one bucket, that bucket's chain is a linked list, and finding a key in it takes time proportional to its length. In the worst case every key lands in the same bucket, and every operation — find, insert, erase — is $O(n)$, read "order n": a linear scan through the whole table. The standard says so: average constant, worst case linear.

With an identity hash, forcing that is easy. Keys that are all multiples of the bucket count all have remainder 0.

::: example Forcing every key into one bucket
This program fixes the bucket count up front with `reserve`, so no rehash changes it, then inserts 20,000 keys twice: first 1, 2, 3, …; then $P, 2P, 3P, \dots$ where $P$ is the bucket count.

```cpp
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <unordered_map>

// Insert n keys into a table whose bucket count is fixed up front,
// and report the time and the length of the longest bucket.
void fill(const char* name, std::uint64_t step, std::size_t n) {
    std::unordered_map<std::uint64_t, double> m;
    m.reserve(n);                                  // no rehash during the fill
    const std::size_t buckets = m.bucket_count();
    const auto t0 = std::chrono::steady_clock::now();
    for (std::uint64_t i = 1; i <= n; ++i) m[i * (step ? step : 1)] = 1.0;
    const auto t1 = std::chrono::steady_clock::now();
    std::size_t longest = 0;
    for (std::size_t b = 0; b < m.bucket_count(); ++b) longest = std::max(longest, m.bucket_size(b));
    std::printf("%-9s %zu keys, %zu buckets, longest bucket %5zu, %8.2f ms\n", name, m.size(),
                buckets, longest, std::chrono::duration<double, std::milli>(t1 - t0).count());
}

int main() {
    constexpr std::size_t n = 20000;
    std::unordered_map<std::uint64_t, double> probe;
    probe.reserve(n);
    const std::uint64_t P = probe.bucket_count();  // the bucket count reserve(n) picks
    fill("ordinary", 0, n);                        // keys 1, 2, 3, ...
    fill("hostile", P, n);                         // keys P, 2P, 3P, ... all land in bucket 0
}
```

On one machine:

```text
ordinary  20000 keys, 20753 buckets, longest bucket     1,     0.61 ms
hostile   20000 keys, 20753 buckets, longest bucket 20000,   605.24 ms
```

Step by step:

1. **Same table, same number of keys.** `reserve(20000)` chose 20,753 buckets both times.
2. **Ordinary keys spread perfectly.** Keys 1 to 20,000 are each their own remainder, so no bucket holds more than one: 0.61 ms, about 30 ns per insert, most of it the node allocation.
3. **Hostile keys all collide.** $kP \bmod P = 0$ for every $k$, so all 20,000 went into bucket 0. Each insert first searched the whole chain to make sure the key was not already there.
4. **About a thousand times slower.** Inserting the $i$-th key walks $i - 1$ nodes, so the total is $0 + 1 + \dots + 19{,}999 = 19{,}999 \times 20{,}000 / 2 \approx 2 \times 10^8$ node visits. At 605 ms, that is about 3 ns per visit.

Sanity check: a second run gave 0.66 ms and 629 ms. Doubling $n$ would double the ordinary time but quadruple the hostile one, because the hostile work grows like $n^2/2$. That is the signature of $O(n)$ per insert.
:::

Real attackers have done exactly this. When a program builds a hash table from input someone else controls — packet fields, uploaded file names, web form parameters — an attacker who knows the hash function can send keys that all collide, and a small message can keep a processor busy for seconds. This is **[[hash flooding|hash-flooding]]**. The defences:

- a **keyed** hash, mixed with a secret random value chosen at start-up, so outsiders cannot predict collisions;
- never letting outside input choose keys for a table on a time-critical path;
- a container with a guaranteed worst case — last lesson's tree, or a fixed table.

For flight code the attacker is often not a person. It is the timing analysis. A real-time task must have a proven **[[worst-case execution time|wcet]]**, and "constant on average, linear if unlucky" does not give one. A corrupted packet, an unusual pattern of ids, or a rehash landing in the wrong cycle is enough.

::: key unordered_map worst case
O(n) per operation when many keys collide in one bucket, and rehashing on growth invalidates all iterators (though not references to elements). The average O(1) is a statement about a good hash, not a guarantee.
:::

## Memory: what 128 entries cost

Last lesson's allocation counter answers the memory question for all three candidates. This program uses it on the 128-entry table, then checks the rehash rule for references:

```cpp
#include <array>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <map>
#include <new>
#include <unordered_map>

static long g_allocs = 0, g_bytes = 0;
void* operator new(std::size_t n) {
    ++g_allocs; g_bytes += static_cast<long>(n);
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc{};
}
[[gnu::noinline]] void operator delete(void* p) noexcept { std::free(p); }
[[gnu::noinline]] void operator delete(void* p, std::size_t) noexcept { std::free(p); }

struct Entry { std::uint16_t id; double scale; };

int main() {
    constexpr int N = 128;
    auto id_of = [](int i) { return static_cast<std::uint16_t>(i * 7 + 1); };

    g_allocs = g_bytes = 0;
    std::map<std::uint16_t, double> tree;
    for (int i = 0; i < N; ++i) tree[id_of(i)] = 0.5 * i;
    std::printf("std::map            %4ld allocations %6ld bytes\n", g_allocs, g_bytes);

    g_allocs = g_bytes = 0;
    std::unordered_map<std::uint16_t, double> hash;
    for (int i = 0; i < N; ++i) hash[id_of(i)] = 0.5 * i;
    std::printf("std::unordered_map  %4ld allocations %6ld bytes\n", g_allocs, g_bytes);

    g_allocs = g_bytes = 0;
    std::unordered_map<std::uint16_t, double> hash2;
    hash2.reserve(N);
    for (int i = 0; i < N; ++i) hash2[id_of(i)] = 0.5 * i;
    std::printf("  ... with reserve  %4ld allocations %6ld bytes\n", g_allocs, g_bytes);

    std::array<Entry, N> table{};
    std::printf("std::array<Entry>   %4d allocations %6zu bytes (in place)\n", 0, sizeof(table));

    // Rehash: iterators are invalidated, references to elements are not.
    std::unordered_map<std::uint16_t, double> m;
    m[1] = 10.0;
    double& ref = m.at(1);
    const std::size_t before = m.bucket_count();
    for (std::uint16_t k = 2; k < 200; ++k) m[k] = k;
    std::printf("buckets %zu -> %zu; reference still reads %.1f\n",
                before, m.bucket_count(), ref);
}
```

```text
std::map             128 allocations   6144 bytes
std::unordered_map   133 allocations   6952 bytes
  ... with reserve   129 allocations   4168 bytes
std::array<Entry>      0 allocations   2048 bytes (in place)
buckets 13 -> 257; reference still reads 10.0
```

The hash table's bytes split into nodes and buckets. Each node is 24 bytes — an 8-byte next pointer and the 16-byte pair — so 128 nodes are $128 \times 24 = 3072$ bytes. The buckets are 8-byte pointers, and without `reserve` the table allocated five bucket arrays on the way up: $(13 + 29 + 59 + 127 + 257) \times 8 = 3880$ bytes. Together, $3072 + 3880 = 6952$, in $128 + 5 = 133$ allocations. With `reserve(128)`, one array of 137 buckets, $137 \times 8 = 1096$ bytes, and $3072 + 1096 = 4168$. The program also ran clean under AddressSanitizer, including the read through `ref` after the rehash.

## Three candidates for the 128-entry table

Now the question the last three lessons have been building to: a fixed table of 128 telemetry channels, 16-bit ids, looked up by id. Here are the three candidates in one program, measured the way last lesson measured two of them — a million hot lookups in a row, and single lookups after 32 MB of other memory traffic.

::: example Map, hash table and sorted array
```cpp
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <map>
#include <memory>
#include <random>
#include <unordered_map>
#include <vector>

struct Entry { std::uint16_t id; double scale; };
using Clock = std::chrono::steady_clock;

std::vector<char> g_other(32u << 20, 1);          // 32 MB of "other work"
long evict_cache() {
    long s = 0;
    for (std::size_t i = 0; i < g_other.size(); i += 64) s += g_other[i];
    return s;
}

int main() {
    constexpr int N = 128;
    std::mt19937 gen(11);
    std::array<std::uint16_t, N> ids{};
    for (int i = 0; i < N; ++i) ids[i] = static_cast<std::uint16_t>(i * 7 + 1);
    std::shuffle(ids.begin(), ids.end(), gen);

    std::vector<std::unique_ptr<char[]>> others;   // unrelated allocations in between
    std::uniform_int_distribution<int> other_size(16, 2048);
    std::map<std::uint16_t, double> tree;
    std::unordered_map<std::uint16_t, double> hash;
    std::array<Entry, N> sorted{};
    for (int i = 0; i < N; ++i) {
        others.emplace_back(new char[other_size(gen)]);
        tree[ids[i]] = 0.5 * ids[i];
        others.emplace_back(new char[other_size(gen)]);
        hash[ids[i]] = 0.5 * ids[i];
        sorted[i] = Entry{ids[i], 0.5 * ids[i]};
    }
    std::sort(sorted.begin(), sorted.end(),
              [](const Entry& a, const Entry& b) { return a.id < b.id; });

    auto f_map  = [&](std::uint16_t q) { return tree.find(q)->second; };
    auto f_hash = [&](std::uint16_t q) { return hash.find(q)->second; };
    auto f_arr  = [&](std::uint16_t q) {
        return std::lower_bound(sorted.begin(), sorted.end(), q,
            [](const Entry& e, std::uint16_t k) { return e.id < k; })->scale;
    };

    std::uniform_int_distribution<int> pick(0, N - 1);
    std::vector<std::uint16_t> queries(1'000'000);
    for (auto& q : queries) q = ids[pick(gen)];
    double sink = 0.0;

    auto hot = [&](auto find) {                     // a million lookups in a row
        const auto t0 = Clock::now();
        for (std::uint16_t q : queries) sink += find(q);
        return std::chrono::duration<double, std::nano>(Clock::now() - t0).count() / 1e6;
    };
    auto cold = [&](auto find) {                    // one lookup after flushing, averaged
        double total = 0.0;
        for (int r = 0; r < 2000; ++r) {
            const std::uint16_t q = ids[pick(gen)];
            sink += static_cast<double>(evict_cache());
            const auto t0 = Clock::now();
            sink += find(q);
            total += std::chrono::duration<double, std::nano>(Clock::now() - t0).count();
        }
        return total / 2000.0;
    };

    std::printf("128 entries      hot lookup   cold lookup\n");
    std::printf("std::map         %6.0f ns   %7.0f ns\n", hot(f_map), cold(f_map));
    std::printf("unordered_map    %6.0f ns   %7.0f ns\n", hot(f_hash), cold(f_hash));
    std::printf("sorted array     %6.0f ns   %7.0f ns\n", hot(f_arr), cold(f_arr));
    if (sink == 42.0) std::puts("");
}
```

Three runs on one machine gave:

```text
128 entries      hot lookup   cold lookup
std::map             34 ns       862 ns
unordered_map         3 ns       606 ns
sorted array         40 ns       269 ns
```

The other runs: map 36 and 37 ns hot, 938 and 953 ns cold; hash table 3 ns hot both times, 565 and 711 ns cold; sorted array 39 ns hot both times, 241 and 225 ns cold. Read the two columns separately, because they tell different stories.

1. **Hot, the hash table wins by more than ten times.** With an identity hash, a lookup is one remainder, one bucket load and one node load, all in the fastest cache, with no branch that depends on the key's value in a hard-to-guess way. Separate lookups do not depend on each other, so the processor overlaps several at once, and each costs about 3 ns of throughput.
2. **Cold, the sorted array wins** — about two to three times faster than the hash table and three to four times faster than the map. Once nothing is in cache, what counts is how many separate trips to memory a lookup makes, and whether each one's address is known in advance. The hash table must load the bucket array, then the node the bucket points to, which was allocated somewhere in the heap; each is a miss. The map misses on every level of the tree. The array's 2048 bytes are one contiguous block, its last steps fall in lines already fetched, and there is no pointer to follow at all.

Sanity check: the cold hash lookup, about 600 ns, is a little under the map's 860 and a little over twice the array's 270 — two dependent misses plus the flush's leftovers, against the map's eight to twelve. Timings vary between machines and runs; repeat them before you quote them.
:::

So which is faster depends on how the program uses the table, and a flight control loop is the cold case: one or a few lookups per cycle, between everything else the cycle does. The hot row is what a naive benchmark measures.

And speed is not even the main argument. Put the three side by side as a reviewer would:

| | `std::map` | `std::unordered_map` | sorted `std::array` |
| --- | --- | --- | --- |
| heap allocations | 128 | 129 to 133 | 0 |
| bytes (libstdc++) | 6144 | 4168 to 6952 | 2048 |
| worst-case lookup | $O(\log n)$, 12 to 14 levels | $O(n)$ if keys collide | 7 to 8 comparisons, fixed |
| hot lookup, one machine | about 35 ns | about 3 ns | about 40 ns |
| cold lookup, one machine | about 900 ns | about 600 ns | about 250 ns |

The sorted array is the only one with no allocation, the smallest, and the only one whose worst case is a small fixed number a timing analysis can write down. Exercise `cpp04_ex2` asks you to build the three yourself and report timings, footprint and your choice; expect your hot numbers to differ from these, and say why.

## Check yourself

::: check
An `unordered_set<std::uint32_t>` has 59 buckets and 40 elements. What is its load factor, and how many more inserts can it take before it rehashes? Where does key 1000 go?
:::

::: answer
The load factor is $40 / 59 \approx 0.68$. With `max_load_factor` 1.0, the table can hold 59 elements in 59 buckets, so 19 more inserts fit; the 20th, which would make 60 elements in 59 buckets, triggers a rehash (to 127 buckets in libstdc++). With the identity hash, key 1000 goes to bucket $1000 \bmod 59$: $16 \times 59 = 944$ and $1000 - 944 = 56$, so bucket 56.
:::

::: check
You hold an iterator `it` and a reference `double& r` to the same element of an `unordered_map`, and then insert enough keys to cause a rehash. Which of the two may you still use, and why the difference?
:::

::: answer
The reference `r` is still valid: a rehash builds a new bucket array and relinks the existing nodes into it, but the nodes, and the elements inside them, stay at the same addresses. The iterator `it` is invalidated, because an iterator encodes a position in the old bucket structure, which no longer exists. Contrast a vector, where a reallocation moves the elements and invalidates both.
:::

::: check
Why does calling `reserve(128)` on an `unordered_map` not make it safe to insert 128 entries inside a control loop?
:::

::: answer
`reserve` sizes the bucket array, so 128 inserts cause no rehash. But every insert still allocates a node for the new element, as the footprint program showed: 129 allocations with `reserve`, one for the buckets and one per node. The loop would still call the allocator 128 times, which is exactly what the no-allocation-after-initialisation rule forbids. Build the table at start-up, or use a fixed array.
:::

::: check
A ground tool counts how often each packet source address appears, using `unordered_map<std::uint32_t, int>` with the default hash, and it processes traffic from the open internet. A colleague says, "lookups are O(1), so this cannot be slowed down by the input." What is wrong with that claim?
:::

::: answer
$O(1)$ is the *average* for keys that spread well, not a guarantee. The keys here come from outsiders, and with libstdc++'s identity hash for integers, anyone who can pick addresses that are all equal modulo the bucket count can put them in one bucket, making each operation walk a chain as long as the table: $O(n)$ per insert and $O(n^2)$ to process $n$ packets. That is hash flooding. Defences are a keyed hash with a secret seed, or a container with a guaranteed worst case, such as `std::map`.
:::

::: check
In the three-way benchmark, the hash table was about ten times faster than the sorted array in the hot loop, but more than twice as slow cold. Give the one-sentence explanation of each, and say which result predicts a 1 kHz control loop.
:::

::: answer
Hot, everything is in cache, so the hash table's single remainder and two cached loads beat the array's seven or eight hard-to-predict comparisons. Cold, cost is counted in trips to memory, and the hash table makes at least two dependent misses to scattered heap blocks while the array's search stays inside one small contiguous region with no pointers to follow. A control loop does a few lookups per cycle among other work, so the cold result is the one that predicts it.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| hash function | key to number | `std::hash<K>`; identity for integers in libstdc++ |
| bucket | one slot of the table | bucket = `hash % bucket_count()`; a chain of nodes |
| load factor | elements per bucket | `size() / bucket_count()`; max 1.0 by default |
| rehash | new bucket array, nodes relinked | about double, rounded to a prime: 13, 29, 59, 127, 257 |
| after a rehash | what survives | iterators invalidated; pointers and references valid |
| `reserve(n)` | enough buckets for `n` | no rehash; still one allocation per node |
| complexity | find, insert, erase | $O(1)$ average with a good hash; $O(n)$ worst case |
| hash flooding | chosen keys all collide | a small input costs $O(n^2)$ total; use a keyed hash or a bounded structure |
| 128-entry table | map vs hash vs sorted array | cold, on one machine: about 900, 600, 250 ns; only the array allocates nothing |

Next lesson moves from containers that *own* their elements to types that only *look at* someone else's: `std::span` and `std::string_view`, and the dangling-view hazard that comes with them.

::: context chaining Buckets with chains
In a chained hash table, the bucket array holds pointers, and each pointer leads to a short linked list of the nodes whose keys landed there. Most buckets hold zero or one node; with a load factor near 1, a few hold two or three. A lookup costs the hash, one bucket load and a walk down one chain.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="20" y="16" font-size="12" fill="#1f2a44">buckets</text>
  <g stroke="#1f2a44">
    <rect x="20" y="24" width="50" height="28" fill="#8fb8f0"/>
    <rect x="20" y="52" width="50" height="28" fill="#ffffff"/>
    <rect x="20" y="80" width="50" height="28" fill="#8fb8f0"/>
    <rect x="20" y="108" width="50" height="28" fill="#ffffff"/>
    <rect x="20" y="136" width="50" height="28" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="15" y="42">0</text><text x="15" y="70">1</text><text x="15" y="98">2</text>
    <text x="15" y="126">3</text><text x="15" y="154">4</text>
  </g>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="110" y="26" width="60" height="24"/>
    <rect x="110" y="82" width="60" height="24"/>
    <rect x="200" y="82" width="60" height="24"/>
    <rect x="110" y="138" width="60" height="24"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="42">15</text><text x="140" y="98">7</text>
    <text x="230" y="98">22</text><text x="140" y="154">19</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="60" y1="38" x2="110" y2="38"/>
    <line x1="60" y1="94" x2="110" y2="94"/>
    <line x1="170" y1="94" x2="200" y2="94"/>
    <line x1="60" y1="150" x2="110" y2="150"/>
  </g>
  <text x="280" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">key mod 5</text>
</svg>
```

Here keys 15, 7, 22 and 19 sit in 5 buckets: 7 and 22 both leave remainder 2 and share a chain.
:::

::: context identity-hash Is returning the key itself a good hash?
For the standard, yes: `std::hash` only has to give equal results for equal keys and rarely give equal results for different keys, and the identity never collides at all before the remainder is taken. It is also free to compute. The weakness is the remainder step: keys that share a pattern with the bucket count collide. That is why libstdc++ pairs it with prime bucket counts, and why an identity hash is a gift to anyone who wants to cause collisions on purpose.
:::

::: context prime-buckets Why the bucket counts are prime
Real keys often come in patterns: ids that are all multiples of 8, addresses aligned to 16 bytes. Take such keys modulo a power of two like 16 and they pile into a few buckets: multiples of 8 land only in buckets 0 and 8. Take them modulo a prime like 13 and they spread over every bucket, because a prime shares no factor with the pattern's step. With an identity hash, a prime bucket count is the table's main protection against ordinary, non-hostile patterns.
:::

::: context hash-flooding An attack on the average case
Hash flooding reached the headlines in December 2011, when Alexander Klink and Julian Wälde showed at the Chaos Communication Congress that a single web request full of colliding form-field names could tie up a server running PHP, Java, Python or several other languages for a long time. The languages responded with randomised or keyed hashing. Python, since version 3.4, hashes strings with SipHash, a keyed function designed by Jean-Philippe Aumasson and Daniel J. Bernstein for exactly this use.
:::

::: context wcet A number the whole schedule depends on
**Worst-case execution time** is the longest a piece of code can take on the target hardware, over every input. Real-time schedulers for flight software are checked against these numbers: if every task's worst case fits inside its period, with margin, the schedule is safe. An operation whose cost depends on how keys happen to collide has no useful bound, so a timing analyst has to assume the linear worst case, which is far too pessimistic to schedule.
:::

::: context open-addressing Hash tables without nodes
Many fast hash tables outside the standard library store elements directly in one big array and, on a collision, try the next slot, a scheme called **open addressing**. That is contiguous and cache-friendly. The standard's `unordered_map` cannot do this, because it promises that references to elements survive a rehash, and in an open-addressed table a rehash moves every element. That one promise, made in 2011, commits every standard library to nodes.
:::
