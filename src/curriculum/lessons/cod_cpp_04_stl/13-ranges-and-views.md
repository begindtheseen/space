---
id: l13-ranges-and-views
title: Ranges and views
minutes: 26
covers:
  - C++20 ranges and views
---

Think of a music playlist. A playlist does not copy any songs. It is a short list of which songs from your library to play, in what order, maybe skipping some and repeating others. Making a playlist is instant and takes almost no space, however big the songs are. But if you delete a song from the library, the playlist still names it, and pressing play gets you silence or an error.

Now think of a car wash. Cars roll in one end and out the other: rinse, soap, brush, dry. No station does all the cars first and then hands the pile to the next one. Each car goes through every station, one car at a time, and if the owner only wants the first three cars done today, the line stops after three.

C++20 gives the standard library both ideas. A **view** is the playlist: a small object that describes a sequence made from someone else's elements, without copying them. And a **pipeline** of views is the car wash: each element passes through every step, one at a time, and only when you ask for it. Around them sits a tidier way to call the algorithms of lessons 07 to 09. All of it lives in two headers, `<ranges>` and `<algorithm>`, under the name **[[ranges|ranges-origin]]**. In flight software this is how you write "the valid samples, converted to bar, first three only" in one readable line that allocates nothing — and it is also a new way to make the dangling bug of lesson 04.

## A range is anything with a beginning and an end

Every algorithm so far took two iterators: `std::sort(v.begin(), v.end())`. That pair has a weakness. Nothing stops you from writing `std::sort(v.begin(), w.end())`, with the two ends from different containers. It compiles, and it is undefined behavior.

C++20 names the idea the pair was standing for. A **range** is anything you can call `begin()` and `end()` on: a `std::vector`, a `std::array`, a `std::span`, a plain C array, a `std::string`. The **range algorithms**, in the namespace `std::ranges`, take the whole range as one argument:

```cpp
std::ranges::sort(v);                         // same as std::sort(v.begin(), v.end())
auto it = std::ranges::find(v, 42);           // same as std::find(v.begin(), v.end(), 42)
bool ok = std::ranges::all_of(v, in_range);   // same as std::all_of(v.begin(), v.end(), in_range)
```

Read `std::ranges::sort(v)` as "ranges sort of v". Almost every algorithm from lessons 07 and 08 has a twin in `std::ranges`: `sort`, `stable_sort`, `find_if`, `lower_bound`, `transform`, `copy_if`, `all_of`, and the rest. They do the same work at the same cost; what changes is how you call them and what the compiler checks.

The range algorithms state their requirements as **[[concepts|concepts-bridge]]** — named, compile-time checks on a type. `std::ranges::sort` requires a `random_access_range`, a range whose iterators can jump to any position. Lesson 07 showed plain `std::sort` on a `std::list` failing with a message about `operator-` buried in the library. The ranges version fails at the front door, and says why:

```cpp
std::list<int> l{3, 1, 2};
std::ranges::sort(l);   // error
```

```text
error: no match for call to '(const std::ranges::__sort_fn) (std::__cxx11::list<int>&)'
...
required for the satisfaction of 'random_access_range<_Range>' [with _Range = std::__cxx11::list<int, std::allocator<int> >&]
```

The first line says "no `sort` that takes a list". Further down, the note names the unmet requirement: `random_access_range`. The fix is the same as before, `l.sort()`, but the message now points at the real reason.

::: key
A range is anything with `begin()` and `end()`. The `std::ranges` algorithms take the whole range as one argument, check their iterator requirements as concepts at compile time, and cost the same as the iterator-pair versions.
:::

## Projections: sort by a member without writing a lambda

Lesson 07 sorted a telemetry log by priority with a comparison lambda:

```cpp
std::stable_sort(log.begin(), log.end(),
                 [](const Event& a, const Event& b) { return a.priority < b.priority; });
```

Most of that lambda says one thing: "compare by `priority`". The range algorithms let you say only that, with a **projection** — a function applied to each element before the algorithm looks at it. The algorithm compares the projected values, but still moves the whole elements.

```cpp
std::ranges::stable_sort(log, {}, &Event::priority);
```

Read it as "stable-sort the log, with the default comparison, by priority". The three arguments are:

- `log`, the range.
- `{}`, empty braces, meaning "the default comparison". For `sort` that is `std::ranges::less`, which does `<`.
- `&Event::priority`, read "address of `Event`'s `priority`". This is a **[[pointer to member|member-pointer]]**. It does not point at any one event's priority. It names the `priority` field of the type, so the algorithm can ask each event for its own.

A projection may also be any callable. `[](const Event& e) { return e.time_ms / 1000; }` would sort by whole seconds. Projections work with searching too: `std::ranges::find(log, 150, &Event::time_ms)` finds the first event whose `time_ms` is 150.

::: example Sort, find and pick a maximum with projections
```cpp
#include <algorithm>
#include <cstdio>
#include <vector>

struct Event {
    int time_ms;
    int priority;     // 0 = most urgent
    const char* what;
};

int main() {
    std::vector<Event> log{
        {100, 2, "heater on"},
        {120, 0, "valve open"},
        {130, 1, "gyro warm"},
        {150, 0, "valve close"},
        {170, 2, "heater off"},
    };

    // Old style: iterator pair plus a comparison lambda.
    // std::stable_sort(log.begin(), log.end(),
    //     [](const Event& a, const Event& b) { return a.priority < b.priority; });

    // Ranges style: the whole container, default comparison, projection.
    std::ranges::stable_sort(log, {}, &Event::priority);
    for (const Event& e : log)
        std::printf("%d  %3d ms  %s\n", e.priority, e.time_ms, e.what);

    // Find the first event at 150 ms, comparing only the time_ms member.
    auto it = std::ranges::find(log, 150, &Event::time_ms);
    std::printf("found: %s\n", it != log.end() ? it->what : "none");

    // Latest event overall, by time.
    auto last = std::ranges::max_element(log, {}, &Event::time_ms);
    std::printf("latest: %s at %d ms\n", last->what, last->time_ms);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
0  120 ms  valve open
0  150 ms  valve close
1  130 ms  gyro warm
2  100 ms  heater on
2  170 ms  heater off
found: valve close
latest: heater off at 170 ms
```

Step by step:

1. `stable_sort` compared only the `priority` fields, $0$, $1$ or $2$, and moved whole events. The two priority-0 events kept their time order, $120$ before $150$ ms, because the sort is stable. So did the two priority-2 events.
2. `find` compared `150` against each event's `time_ms` and stopped at "valve close".
3. `max_element` projected each event to its time and returned an iterator to the event with the largest one, $170$ ms.

Sanity check: the valve opens before it closes in the sorted log. If the sort had been unstable, "valve close" could have come first, which is exactly the ordering bug lesson 07 warned about.
:::

## Views: sequences made on demand

A range algorithm still works on a real container. A **view** is a range that owns no elements of its own. It holds a reference to some other range plus a rule for what to show, and it produces each element only when you ask for it. Copying a view is cheap, whatever the size of what it looks at.

The standard views live in `std::views` (short for `std::ranges::views`). The six you will use most:

| View | Read it as | What it shows |
| --- | --- | --- |
| `views::filter(pred)` | "filter by pred" | only the elements for which `pred` returns true |
| `views::transform(f)` | "transform by f" | `f(x)` for each element `x` |
| `views::take(n)` | "take n" | the first `n` elements, or fewer if the range is shorter |
| `views::drop(n)` | "drop n" | everything except the first `n` |
| `views::reverse` | "reversed" | the elements back to front |
| `views::iota(a, b)` | "iota from a to b" | the numbers $a, a+1, \ldots, b-1$, never stored |

`views::iota(a)` with one argument never stops: $a, a+1, a+2, \ldots$ forever. That is fine, as long as something downstream, such as `take`, decides when to stop asking. The name comes from **[[a Greek letter|iota-name]]**, and it matches `std::iota` from lesson 08, which fills a container with a counting sequence. The view makes the same numbers without a container.

You chain views with `|`, read "piped into" or "then":

```cpp
auto first_three_bar = kpa | std::views::filter(valid)
                           | std::views::transform(to_bar)
                           | std::views::take(3);
```

Read it top to bottom: "the pressures, filtered to the valid ones, transformed to bar, first three". The `|` is borrowed from the **[[command line|unix-pipe]]**, where it sends one program's output into the next. `kpa | views::take(3)` means the same as `views::take(kpa, 3)`; the pipe form reads left to right, in the order things happen.

### Lazy evaluation

Here is the car wash. Building `first_three_bar` does no filtering and no converting. It builds a small object that remembers the steps. The work happens one element at a time, as a loop asks for the next one. This is **[[lazy evaluation|lazy-trace]]**: compute a value only when it is needed.

::: example Counting the work a pipeline does
Pressure samples arrive in kilopascals. A value of $-1.0$ marks a dropout. We want the first three valid samples, converted to bar ($1\ \mathrm{bar} = 100\ \mathrm{kPa}$). Each lambda counts how often it runs.

```cpp
#include <cstdio>
#include <ranges>
#include <vector>

int main() {
    // Pressure samples in kilopascals; negative values are sensor dropouts.
    std::vector<double> kpa{101.2, -1.0, 99.8, 100.4, -1.0, 98.9, 97.5, 96.1};

    int checks = 0, conversions = 0;

    auto valid = [&](double p) { ++checks; return p >= 0.0; };
    auto to_bar = [&](double p) { ++conversions; return p / 100.0; };

    // Build the pipeline. Nothing runs yet.
    auto first_three_bar = kpa
        | std::views::filter(valid)
        | std::views::transform(to_bar)
        | std::views::take(3);

    std::printf("after building: %d checks, %d conversions\n", checks, conversions);

    for (double b : first_three_bar)
        std::printf("  %.3f bar\n", b);

    std::printf("after the loop: %d checks, %d conversions\n", checks, conversions);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
after building: 0 checks, 0 conversions
  1.012 bar
  0.998 bar
  1.004 bar
after the loop: 6 checks, 3 conversions
```

Walk through it.

1. After building the pipeline, both counters are $0$. The pipeline is only a description.
2. The loop asks for the first element. The filter checks $101.2$ (check 1): valid. The transform converts it: $101.2 / 100 = 1.012$ bar (conversion 1).
3. The loop asks for the next. The filter checks $-1.0$ (check 2, rejected) and $99.8$ (check 3, valid), which becomes $0.998$ bar.
4. Next: $100.4$ (check 4) becomes $1.004$ bar. That is three.
5. The loop steps forward once more before it asks "am I done?". Stepping the filter means searching for the next valid sample: $-1.0$ (check 5) and $98.9$ (check 6). Then `take` reports that its three are used up, and the loop ends. $98.9$ was found but never converted.

Sanity check: 8 samples, 6 checked, 2 ($97.5$ and $96.1$) never touched. Only 3 conversions for 3 outputs. A version with `copy_if` and `transform` from lesson 08 would check all 8, convert all 6 valid ones, and allocate new vectors to hold the results.
:::

Lesson 10 said an algorithm may copy the lambdas you give it. Views store their lambdas too. Here the lambdas captured the counters by reference, `[&]`, so every copy updates the same two integers. That is safe because the pipeline is used inside the same block where the counters live.

::: key
Views are lazy and non-owning: building a pipeline with `|` computes nothing, and each element is produced only when the loop asks for it. Copying a view does not copy the elements it looks at.
:::

::: example Infinite numbers, dropped and reversed
```cpp
#include <cstdio>
#include <ranges>
#include <vector>

int main() {
    namespace views = std::views;

    // iota: the numbers 1, 2, 3, ... made on demand, never stored.
    for (int n : views::iota(1) | views::filter([](int k) { return k % 2 == 0; })
                                | views::transform([](int k) { return k * k; })
                                | views::take(4))
        std::printf("%d ", n);
    std::printf("\n");

    std::vector<int> frames{10, 11, 12, 13, 14, 15};
    // drop the first two, then walk the rest backward.
    for (int f : frames | views::drop(2) | views::reverse)
        std::printf("%d ", f);
    std::printf("\n");
}
```

It prints:

```text
4 16 36 64 
15 14 13 12 
```

The first loop counts $1, 2, 3, \ldots$ with no end, keeps the even numbers $2, 4, 6, 8$, squares them to $4, 16, 36, 64$, and stops after four. The second drops frames $10$ and $11$ and walks the remaining four from the back.

Sanity check: the infinite `iota` did not hang the program, because `take(4)` stopped asking. Put `take` before `filter` and you get something different: `iota(1) | take(4) | filter(even)` looks only at $1, 2, 3, 4$ and yields only $4$ and $16$. The order of the steps matters, as it does in a car wash.
:::

::: warning The order of the stages is part of the meaning
`filter` then `take(3)` gives the first three *valid* samples. `take(3)` then `filter` gives the valid ones *among the first three*. Both compile. Read the pipeline aloud, left to right, and check that the sentence is the one you meant.
:::

## Views do not own: the dangling hazard again

A view is a playlist. It refers to its elements and does not keep them alive. That is lesson 04's rule for `std::span` and `std::string_view`, and it holds for every view. When you pipe a named container into a view, the view stores a **[[reference to that container|ref-view-picture]]**, not a copy. On this machine, `sizeof` a `take` view over a `std::vector<double>` is 16 bytes, and a `reverse` view is 8, however many elements the vector holds.

Here is how that goes wrong. A function builds a vector, wraps it in a view, and returns the view:

```cpp
#include <cstdio>
#include <ranges>
#include <vector>

auto scaled_readings(double gain) {
    std::vector<double> raw{1.0, 2.0, 3.0};            // a local: dies at the }
    return raw | std::views::transform([gain](double x) { return gain * x; });
}

int main() {
    for (double y : scaled_readings(10.0))
        std::printf("%.1f\n", y);
}
```

g++ 13 with `-Wall -Wextra` compiles this without a single warning. Run it, and it crashed with `Segmentation fault`. Built with AddressSanitizer, the report begins:

```text
ERROR: AddressSanitizer: stack-use-after-return on address 0x7f0ab6600100 ...
READ of size 8 at 0x7f0ab6600100 thread T0
```

The view held the address of `raw`, a local variable in `scaled_readings`. When the function returned, `raw` was destroyed. The loop in `main` then read through the view into a stack frame that no longer existed.

The fix is to give the view something it can own. If you pipe in an **rvalue** — a temporary, or a variable wrapped in `std::move` — C++20 (as amended, and as g++ 13 implements it) moves the container *into* the view:

```cpp
return std::move(raw) | std::views::transform([gain](double x) { return gain * x; });
```

Now the view holds the vector itself, and the program prints $10.0$, $20.0$, $30.0$, clean under AddressSanitizer. The rule to remember: a view built from a **named** container borrows it; a view built from a **temporary** container owns it.

::: warning Do not return a view of a local
A function that returns `local | views::something` returns a view of a dead container. The compiler is silent. Either return the container, or move the local into the pipeline with `std::move`, or have the caller own the data and pass it in.
:::

### std::ranges::dangling: the library refuses to hand you a dead iterator

The range algorithms catch one common case at compile time. If you pass a temporary container to an algorithm that returns an iterator, the container dies at the end of the statement, and the iterator would point into it. So the library does not return an iterator at all. It returns an empty marker type, `std::ranges::dangling`, which has no `*` and no `->`:

```cpp
std::vector<int> read_channels() { return {7, 12, 42, 99}; }

auto it = std::ranges::find(read_channels(), 42);
std::printf("%d\n", *it);   // error
```

```text
error: no match for 'operator*' (operand type is 'std::ranges::dangling')
```

The mistake is caught at the line that would have read freed memory. Fix it by keeping the container: `auto channels = read_channels();` and then search `channels`.

Some ranges are safe to search as temporaries, because they are views into storage somebody else owns: a `std::span`, a `std::string_view`, a view of a named vector. The standard calls these **[[borrowed ranges|borrowed-range]]**, and for them the algorithms return a real iterator.

::: key
Views do not own their elements, so they dangle if the underlying storage dies or reallocates. A range algorithm given a temporary, non-borrowed range returns `std::ranges::dangling` instead of an iterator, so dereferencing the result does not compile.
:::

::: warning A filter view cannot be walked through a `const&`
```cpp
void print_all(const auto& r) { for (double x : r) std::printf("%.1f\n", x); }
print_all(v | std::views::filter(positive));   // error
```

g++ says `passing 'const std::ranges::filter_view<...>' as 'this' argument discards qualifiers`. A filter view **[[remembers where its first element is|filter-cache]]** after the first search, and remembering means changing itself, which a `const` object may not do. Take views by value (`auto r`) or by forwarding reference (`auto&& r`) instead. Copying a view is cheap.
:::

## What g++ 13 has, and which flag it needs

The views above are all C++20, and `-std=c++20` is enough for them. C++23 added more. g++ 13 already has many of them, but only with `-std=c++23`:

- `views::enumerate(r)` pairs each element with its index.
- `views::zip(a, b)` walks two ranges side by side, stopping at the shorter.
- `views::chunk(n)`, `views::slide(n)`, `views::stride(n)`, `views::adjacent<n>`, `views::cartesian_product` and `views::join_with`.
- `std::ranges::fold_left(r, init, op)`, the ranges relative of `std::accumulate` from lesson 08.

One C++23 piece g++ 13 does **not** have is `std::ranges::to`, which copies a view into a new container (`| std::ranges::to<std::vector>()`). With g++ 13 you write the loop, or construct the container from the view's `begin()` and `end()`. Check the compiler your project flies with before using a C++23 view; embedded toolchains often lag the desktop.

::: example zip and enumerate, which need -std=c++23
```cpp fragment
#include <cstdio>
#include <ranges>
#include <vector>

int main() {
    std::vector<const char*> names{"gyro_x", "gyro_y", "gyro_z"};
    std::vector<double> rates{0.012, -0.003, 0.250};

    // C++23: enumerate pairs each element with its index.
    for (auto [i, name] : std::views::enumerate(names))
        std::printf("%lld: %s\n", static_cast<long long>(i), name);

    // C++23: zip walks two ranges side by side.
    for (auto [name, r] : std::views::zip(names, rates))
        std::printf("%-7s %+.3f rad/s\n", name, r);
}
```

Built with `g++ -std=c++23 -Wall -Wextra -O2`:

```text
0: gyro_x
1: gyro_y
2: gyro_z
gyro_x  +0.012 rad/s
gyro_y  -0.003 rad/s
gyro_z  +0.250 rad/s
```

Built with `-std=c++20` instead, the same file fails with `error: 'enumerate' is not a member of 'std::views'` and the same for `zip`.

Each element of `enumerate` is a pair of an index and a reference to the element; each element of `zip` is a tuple of references, one from each range. The structured bindings from lesson 05 unpack them. The index type is the range's signed **difference type**, a `long` here, so the cast makes the `printf` format match on every platform.

Sanity check: three names and three rates gave three zipped lines. Had `rates` held only two values, `zip` would have stopped after two, with no out-of-bounds read.
:::

## Ranges in flight code

Views fit flight code well in one way. The standard views allocate nothing, so a pipeline over a fixed buffer is allowed inside a 1 kHz loop where a `copy_if` into a growing vector is not. They also state the steps in the order they happen, which a reviewer can check against the requirement.

They have costs too. Each stage is a template, so pipelines lean on the optimizer to inline everything; in an unoptimised debug build, every step is a real function call. They add compile time. Their error messages are long, though concepts help. And the dangling cases above are easy to write. A sensible house rule: build and use a pipeline in the same block, over data that block can see, and store containers, not views.

## Check yourself

::: check
Rewrite `std::sort(table.begin(), table.end(), [](const Entry& a, const Entry& b) { return a.id < b.id; });` as a range algorithm with a projection. What does the algorithm move, and what does it compare?
:::

::: answer
`std::ranges::sort(table, {}, &Entry::id);`. The first argument is the whole range. `{}` asks for the default comparison, `std::ranges::less`, which uses `<`. `&Entry::id` is the projection, a pointer to the `id` member. The algorithm compares the projected values, the `id` numbers, but it moves the whole `Entry` objects, so each id stays attached to the rest of its entry. The cost is the same as `std::sort`: $O(n \log n)$ comparisons.
:::

::: check
How many times does the predicate run in `std::views::iota(1) | std::views::filter([](int n) { return n % 3 == 0; }) | std::views::take(2)`, when a range-for loop walks it to the end?
:::

::: answer
Nine times, and the loop prints `3 6`. Finding the first element checks $1, 2, 3$ (three calls; $3$ passes). Stepping to the second checks $4, 5, 6$ (six calls; $6$ passes). After the second element the loop steps once more before asking whether it is done, and stepping the filter searches for the next multiple of 3: $7, 8, 9$ (nine calls). Only then does `take` report that its two are used up. Counting the calls with a captured counter, as in the pressure example, gives exactly 9.
:::

::: check
`auto it = std::ranges::max_element(load_samples());`, where `load_samples()` returns a `std::vector<double>` by value. What type is `it`, and why did the library designers choose that?
:::

::: answer
`it` is `std::ranges::dangling`. The vector returned by `load_samples()` is a temporary that is destroyed at the end of the statement, so any iterator into it would point at freed memory. Rather than return such an iterator, the range algorithm returns an empty marker type with no `*` or `->`. Any attempt to read the maximum through `it` fails to compile, so the use-after-free is caught at the line where it would happen. The fix is to name the vector first: `auto samples = load_samples(); auto it = std::ranges::max_element(samples);`.
:::

::: check
Which of these is safe, and why? (a) `auto first_two = get_frames() | std::views::take(2);` followed by a loop over `first_two`, where `get_frames()` returns a `std::vector<int>` by value. (b) A function that declares `std::vector<int> frames = get_frames();` and returns `frames | std::views::take(2)`.
:::

::: answer
(a) is safe. `get_frames()` is a temporary, an rvalue, and piping an rvalue container into a view moves the container into the view, which then owns it. Checked on g++ 13: the loop printed `10 11`, AddressSanitizer stayed silent, and `sizeof(first_two)` was 32 bytes, the 24-byte vector plus the count. (b) dangles. `frames` is a named local, so the view only refers to it, and `frames` dies when the function returns. The caller's loop then reads a dead stack frame. Writing `std::move(frames) | std::views::take(2)` makes (b) safe too.
:::

::: check
A teammate on g++ 13 writes `for (auto [i, x] : std::views::enumerate(samples))` and gets "`'enumerate' is not a member of 'std::views'`". What is wrong, and what would still fail after the fix if they then wrote `| std::ranges::to<std::vector>()`?
:::

::: answer
`views::enumerate` is C++23. g++ 13 has it, but only when compiling with `-std=c++23`; under `-std=c++20` the name does not exist. After switching the flag, `enumerate` works. `std::ranges::to` would still fail, because it is also C++23 but g++ 13's library does not provide it at all: the error is "`'to' is not a member of 'std::ranges'`". On g++ 13, fill the container with a loop instead, or build it from the view's `begin()` and `end()`.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| range | anything with `begin()` and `end()` | vector, array, span, string, C array, views |
| `std::ranges::sort(v)` | range algorithm | whole range as one argument; requirements checked as concepts |
| projection | function applied before comparing | `std::ranges::sort(v, {}, &T::member)`; compares members, moves elements |
| view | non-owning, lazy range | copying it does not copy elements |
| `filter`, `transform`, `take`, `drop`, `reverse`, `iota` | the everyday views | chained with the pipe symbol, read left to right |
| lazy evaluation | work done only when asked | building a pipeline computes nothing |
| view of a named container | borrows it | dangles if the container dies or reallocates |
| view of a temporary container | owns it (moved in) | safe to return; move a local in with `std::move` |
| `std::ranges::dangling` | returned for a temporary non-borrowed range | cannot be dereferenced: compile error |
| C++23 views in g++ 13 | `zip`, `enumerate`, `chunk`, `slide`, `stride`, `fold_left` | need `-std=c++23`; `std::ranges::to` is missing |

The next and last lesson of the module is about what happens when something fails: exceptions, error codes and `std::expected`, and why so much flight code is built with exceptions turned off.

::: context ranges-origin Where ranges came from
C++20's ranges grew out of range-v3, an open-source library written mainly by Eric Niebler, which let programmers try pipelines and views for years before the committee adopted a version of them. The idea of a "range" as one object, instead of a pair of iterators, is older still; the D programming language's standard library was built around ranges. Range-v3 still exists and still has pieces the standard has not adopted.
:::

::: context concepts-bridge Concepts, the short version
A concept is a named yes-or-no test that the compiler runs on a type before it accepts a call. `std::ranges::random_access_range<std::list<int>>` is false, so the call to `std::ranges::sort` is rejected there and then, and the message can name the failed test. Before C++20, templates had no such front door: errors came out wherever, deep inside the library, the type finally failed. The next module, on templates, teaches how to write your own concepts with `requires`.
:::

::: context member-pointer A field's name, not a field's address
An ordinary pointer holds the address of one object. A pointer to member, like `&Event::priority`, holds no address at all. It says "the `priority` field of any `Event`". To use it you need an event: `e.*p` reads "e's member p". The range algorithms call it through `std::invoke`, which knows that applying a member pointer to an object means reading that member. Under the hood, for a plain data member, g++ stores it as the field's offset in bytes from the start of the object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">one Event, 16 bytes on this machine</text>
  <rect x="10" y="30" width="80" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="30" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="30" width="170" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">time_ms</text>
  <text x="130" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">priority</text>
  <text x="255" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">what (pointer)</text>
  <text x="10" y="80" font-size="11" fill="#6c7a93">0</text>
  <text x="90" y="80" font-size="11" fill="#6c7a93">4</text>
  <text x="170" y="80" font-size="11" fill="#6c7a93">8</text>
  <text x="130" y="106" font-size="12" text-anchor="middle" fill="#b4232c">&amp;Event::priority = offset 4</text>
</svg>
```
:::

::: context iota-name A letter from APL
The name comes from APL, a programming language Kenneth Iverson designed in the 1960s, which wrote its operations as single symbols. The Greek letter iota, ι, was the function that produced the counting sequence: ι5 gave the first five whole numbers. C++ kept the name for `std::iota` in `<numeric>`, and C++20 reused it for the view that counts on demand.
:::

::: context unix-pipe Where the vertical bar comes from
In a Unix shell, `ls | grep log | wc -l` sends the output of `ls` into `grep`, and `grep`'s output into `wc`. Pipes were added to Unix in 1973, at the urging of Doug McIlroy, who had long argued that programs should connect like lengths of garden hose. The ranges library borrowed the symbol because a view pipeline has the same shape: each stage takes the previous stage's output, one piece at a time. In C++ it is the ordinary bitwise-or operator, overloaded for views.
:::

::: context lazy-trace Following each sample through the pipeline
The picture shows the eight pressure samples of the example and how far each one got. Blue boxes passed the filter and were converted; the orange one passed the filter but was never converted; red ones were rejected; gray ones were never looked at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="4" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="24" y="49">101.2</text>
    <rect x="48" y="30" width="40" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
    <text x="68" y="49">-1.0</text>
    <rect x="92" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="112" y="49">99.8</text>
    <rect x="136" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="156" y="49">100.4</text>
    <rect x="180" y="30" width="40" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
    <text x="200" y="49">-1.0</text>
    <rect x="224" y="30" width="40" height="30" fill="#f2b880" stroke="#1f2a44"/>
    <text x="244" y="49">98.9</text>
    <rect x="268" y="30" width="40" height="30" fill="#ffffff" stroke="#6c7a93"/>
    <text x="288" y="49" fill="#6c7a93">97.5</text>
    <rect x="312" y="30" width="40" height="30" fill="#ffffff" stroke="#6c7a93"/>
    <text x="332" y="49" fill="#6c7a93">96.1</text>
    <text x="24" y="80">1.012</text>
    <text x="112" y="80">0.998</text>
    <text x="156" y="80">1.004</text>
  </g>
  <text x="4" y="18" font-size="12" fill="#1f2a44">samples in kPa, left to right</text>
  <text x="4" y="104" font-size="12" fill="#1f2a44">checked: 6 (the first six boxes)</text>
  <text x="4" y="122" font-size="12" fill="#1f2a44">converted to bar: 3 (blue)</text>
  <text x="4" y="140" font-size="12" fill="#6c7a93">never touched: 2 (grey)</text>
</svg>
```
:::

::: context ref-view-picture What the returned view held
When `raw` is a named local, the view stores a pointer to the vector object `raw` itself, which sits in `scaled_readings`'s stack frame. The vector's elements are on the heap. After the return, the frame is gone, and the view's pointer leads into memory that the next function call will reuse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">scaled_readings's frame (gone after return)</text>
  <rect x="10" y="26" width="170" height="44" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="95" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">vector raw</text>
  <text x="10" y="104" font-size="12" fill="#1f2a44">main's frame</text>
  <rect x="10" y="112" width="170" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">view: pointer + lambda</text>
  <line x1="95" y1="112" x2="95" y2="78" stroke="#b4232c" stroke-width="2"/>
  <polygon points="95,72 90,82 100,82" fill="#b4232c"/>
  <rect x="230" y="26" width="120" height="44" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">1.0  2.0  3.0</text>
  <text x="290" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">heap buffer, freed</text>
  <line x1="180" y1="48" x2="224" y2="48" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="230,48 220,43 220,53" fill="#6c7a93"/>
</svg>
```

With `std::move(raw)`, the vector object itself moves into the view, in `main`'s frame, and the arrow disappears.
:::

::: context borrowed-range Why a span can be searched as a temporary
A range is borrowed when its iterators do not depend on the range object staying alive. A `std::span` is a pointer and a length; its iterators point straight into the array it looks at. If the span object dies, the array does not, so an iterator from a temporary span is still good. A `std::vector` is not borrowed: its iterators point into the vector's own buffer, which dies with it. The library marks the safe types with a flag, `std::ranges::enable_borrowed_range`, and returns `dangling` only for the others.
:::

::: context filter-cache Why the filter remembers
The standard asks that calling `begin()` on a view be cheap on average, because loops and algorithms call it freely. For a filter, finding the first element can mean scanning a long way. So the first call to `begin()` does the scan and stores the answer inside the view, and later calls return the stored answer. Storing it changes the view, so `begin()` cannot be a `const` member function. A consequence to know: if you change the underlying elements after that first scan, the stored answer may be stale.
:::
