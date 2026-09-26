---
id: l11-the-power-of-ten-rules
title: The Power of Ten rules
minutes: 24
covers:
  - The NASA/JPL Power of Ten rules
---

Think of the rules posted beside a swimming pool. No running. No diving in the shallow end. No glass near the water. None of them is clever, and a lifeguard can check each one from across the pool in a second. That is the point. A rule that needs an argument to check does not get checked.

In 2006 **[[Gerard Holzmann|holzmann]]**, a researcher at NASA's Jet Propulsion Laboratory (JPL), published a four-page paper called *The Power of Ten: Rules for Developing Safety-Critical Code*. It gives ten rules for writing C that flies. Each one is short, and each one can be checked by a tool rather than by a person's judgment. The paper became one of the most quoted documents in flight software, and its rules sit underneath JPL's own coding standard and much of what the rest of the industry does.

You have met most of these rules already in this module, one at a time: bounded loops, no recursion, no allocation after startup. This lesson puts all ten side by side, says why each one exists, and shows how to meet each one in modern C++ — which the paper, written for C, never had to deal with.

## Why ten short rules

Big coding standards run to hundreds of rules. Holzmann's argument was that nobody remembers hundreds of rules, and a rule nobody remembers is not followed. Ten fits on one page. Better still, every one of the ten is **mechanically checkable**: a program can read the source and say "yes" or "no", with no human opinion involved.

The deeper reason is **analyzability**. A flight computer cannot be tested on every input it will ever see. So engineers want to *prove* things about the code before it flies: that it finishes within its time budget, that it never runs out of stack, that it never runs out of memory. Tools that do those proofs need code with a simple, predictable shape. Most of the ten rules exist to give the code that shape.

## Rules 1 and 2: simple control flow and bounded loops

**Rule 1** says: use only simple control flow. No `goto`. No `setjmp` or `longjmp`. No **recursion** — a function calling itself, directly or through other functions.

`goto` jumps anywhere in a function, which turns the flow into a tangle a reader cannot follow. **[[setjmp and longjmp|setjmp-longjmp]]** are C functions that jump right out of a chain of calls back to an earlier point, skipping every return along the way. Recursion makes the **call graph** — the map of which function calls which — contain a loop.

Why does a loop in the call graph matter? Because a stack-depth tool (lesson 03) adds up the frame sizes along the deepest path through the graph. If the graph has a **[[cycle|call-graph-cycle]]**, the deepest path has no end, and the tool cannot give a number.

**Rule 2** says: every loop must have a fixed upper bound that a checking tool can prove statically, without running the code. `for (std::size_t i = 0; i < 64; ++i)` has a bound anyone can see. `while (sensor.moving())` does not: if the sensor sticks, the loop never ends. Lesson 02 showed the fix — add a maximum count, and treat reaching it as a fault.

There is one allowed exception. The top-level loop of a flight program, `for (;;)`, is *meant* never to end. For that loop the rule turns around: it must be provable that the loop *cannot* terminate.

::: key
Power of Ten rules 1 and 2: Restrict all code to simple control flow: no goto, setjmp/longjmp, or recursion. Give every loop a fixed, statically provable upper bound. Together they make the call graph and the execution time analysable.
:::

In modern C++ rule 1 costs little. A tree walk becomes a loop with a fixed-size explicit stack. Exceptions deserve a mention here too: `throw` jumps out of a chain of calls much as `longjmp` does, and its timing is hard to bound, which is why flight builds usually turn exceptions off with `-fno-exceptions`.

## Rule 3: no dynamic memory allocation after initialization

**Rule 3** says: do not use dynamic memory allocation after initialization. During startup, you may set up everything the program will ever need. Once the control loops start, `new`, `malloc` and anything that calls them are off limits.

Lesson 04 covered the reasons in detail. In short: an allocator's worst-case time is hard to bound, and after long running, **[[fragmentation|fragmentation]]** can make an allocation fail even though plenty of memory is free in total. The rule removes both problems at once, plus a whole family of bugs — leaks, use-after-free, double-free — because memory that is never freed cannot be freed wrongly.

::: key
Power of Ten rule 3: Do not use dynamic memory allocation after initialisation. This removes allocator non-determinism, fragmentation and the whole class of use-after-free and leak defects in one stroke.
:::

## Rules 4 and 5: short functions and assertions

**Rule 4** says: no function longer than one printed page — one statement per line, one declaration per line — which comes to about 60 lines. A function that fits on a page can be understood as one unit. A 300-line function cannot be held in anyone's head, and its paths multiply until nobody can test them all.

**Rule 5** says: use at least two runtime **assertions** per function, on average. An assertion is a check of something that should be impossible if the code is correct: "this index is less than the array size", "this quaternion has length close to 1", "this pointer is not null".

Three conditions come with it:

- An assertion must be a plain true-or-false test with **no side effects** — checking it must not change anything.
- It should check a condition that should *never* be false. A condition that can legitimately happen, such as a sensor timeout, is ordinary error handling, not an assertion.
- When it fails, it must **do something** in flight. The standard C `assert` either stops the program or, in a release build, vanishes completely. Neither is acceptable on a vehicle. A flight assertion reports the fault and takes a recovery action, such as returning an error to the caller or putting the vehicle into a **[[safe mode|safe-mode]]**.

The average is per function over the whole program. A file with 40 functions and 70 assertions averages $70/40 = 1.75$, below the minimum; it needs at least $2 \times 40 = 80$.

::: key
Power of Ten rules on function size and assertions: Keep each function short enough to print on one page, about sixty lines, and use a minimum of two runtime assertions per function, checking conditions that should be impossible. Assertions must have an effect other than nothing in flight, such as entering a safe mode.
:::

::: example An assertion that still works in flight
Here is a check that records where it failed and switches the vehicle to safe mode, and a function that uses two of them. `std::source_location` (C++20) supplies the line number without a macro.

```cpp
#include <cstdio>
#include <source_location>
#include <span>

enum class Mode { Nominal, Safe };
Mode g_mode = Mode::Nominal;

// Rule 5: an assertion that still does something in flight.
bool check(bool ok, std::source_location where = std::source_location::current()) {
    if (!ok) {
        std::printf("check failed at line %u: entering safe mode\n",
                    static_cast<unsigned>(where.line()));
        g_mode = Mode::Safe;
    }
    return ok;
}

constexpr std::size_t kMaxSamples = 64;

// Mean of a window of gyro samples, in rad/s.
[[nodiscard]] bool mean_rate(std::span<const float> samples, float& out) {
    if (!check(!samples.empty())) { return false; }
    if (!check(samples.size() <= kMaxSamples)) { return false; }
    float sum = 0.0F;
    for (const float s : samples) {    // runs at most kMaxSamples times
        sum += s;
    }
    out = sum / static_cast<float>(samples.size());
    return true;
}

int main() {
    const float window[4] = {0.010F, 0.012F, 0.011F, 0.009F};
    float rate = 0.0F;
    if (mean_rate(window, rate)) {
        std::printf("mean rate %.4f rad/s, safe mode %s\n",
                    static_cast<double>(rate), g_mode == Mode::Safe ? "on" : "off");
    }
    if (!mean_rate(std::span<const float>{}, rate)) {
        std::printf("empty window rejected, safe mode %s\n",
                    g_mode == Mode::Safe ? "on" : "off");
    }
    return 0;
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra` and run:

```text
mean rate 0.0105 rad/s, safe mode off
check failed at line 22: entering safe mode
empty window rejected, safe mode on
```

Check the first line by hand: $(0.010 + 0.012 + 0.011 + 0.009)/4 = 0.042/4 = 0.0105\,\mathrm{rad/s}$. Correct.

The second call passes an empty window. Averaging it would divide by zero. Instead, the first check fails, reports line 22 (the line of that check), sets safe mode, and the function returns `false`, which the caller tests.

Notice how the checks also serve rule 2. The loop is a range-for over `samples`, and the second check has already proved `samples.size() <= 64`. So a tool, or a reviewer, can see the loop runs at most 64 times.
:::

::: warning
Do not put work inside an assertion. `check(pop_sample(q) > 0.0F)` removes a sample *as a side effect* of checking. If someone later compiles the checks out for a speed test, the program's behavior changes. Do the work first, store the result, then check the stored value.
:::

## Rules 6 and 7: small scope, checked results

**Rule 6** says: declare every data object at the smallest possible **scope** — the region of code where its name can be used. A variable declared inside a loop body cannot be changed by code outside it. When something goes wrong, the fewer places that can touch a value, the fewer places you must search. In C++ this also means preferring a local over a global, and a `private` member over a public one.

**Rule 7** says: the caller must check the return value of every function that returns one, and every function must check that its parameters are valid. If a result is truly useless, cast it to `void` to show the choice was deliberate.

C++ can make the compiler enforce the first half. Mark a function `[[nodiscard]]` and ignoring its result becomes a warning.

::: example Letting the compiler catch an unchecked result
```cpp
[[nodiscard]] bool arm_pyro(int channel) {
    return channel >= 0 && channel < 4;
}

int main() {
    arm_pyro(7);     // result thrown away: did it work?
    return 0;
}
```

`g++ -std=c++20 -Wall -Wextra -c` reports:

```text
p10_nodiscard.cpp: In function 'int main()':
p10_nodiscard.cpp:6:13: warning: ignoring return value of 'bool arm_pyro(int)', declared with attribute 'nodiscard' [-Wunused-result]
    6 |     arm_pyro(7);     // result thrown away: did it work?
      |     ~~~~~~~~^~~
p10_nodiscard.cpp:1:20: note: declared here
    1 | [[nodiscard]] bool arm_pyro(int channel) {
      |                    ^~~~~~~~
```

Channel 7 does not exist (valid channels are 0 to 3), so `arm_pyro` returns `false`. Without the attribute, that failure would pass in silence and the sequence would carry on as if a pyrotechnic charge were armed. With it, and with warnings treated as errors (rule 10), the program does not even build until someone handles the result. Note that `arm_pyro` also follows the second half of rule 7: it checks its own parameter.
:::

## Rules 8 and 9: the preprocessor and pointers

**Rule 8** says: use the preprocessor only to include headers and to define simple macros. No token pasting (`##`, which glues two pieces of text into a new name), no macros with a variable number of arguments, no macros that call themselves, and every macro must expand to a complete piece of syntax. Conditional compilation (`#if`, `#ifdef`) is discouraged, because every `#if` doubles the number of program versions that need testing: ten independent ones make $2^{10} = 1024$ versions.

Modern C++ makes this rule easy. A `constexpr` variable replaces a numeric `#define`. A `constexpr` or template function replaces a function-like macro, with real types. `if constexpr` replaces many `#if` blocks, and the compiler checks both branches.

**Rule 9** says: restrict pointers. At most one level of **[[dereferencing|pointer-levels]]** at a time — no `**p`. Do not hide a dereference inside a macro or a `typedef`. And no **function pointers**.

The ban on function pointers is the one that surprises people. The reason is the call graph again. With `handler(s)`, where `handler` is a pointer set at run time, a tool cannot tell which function is being called, so it cannot add up the stack depth or the worst-case time along that path. In C++ the usual replacements keep the call target visible at compile time: a template parameter, a `switch` over an `enum`, or a lambda passed to a template. `std::span` and references replace most raw pointer arithmetic. Virtual functions are a form of function pointer too; a project that uses them must show the analyzer every possible target.

## Rule 10: all warnings on, analyzers every day

**Rule 10** says: from the first day, compile with every compiler warning turned on at its most pedantic setting, and fix the code until there are zero warnings. Check it every day with at least one — preferably more than one — **static analyzer**, a tool that reads code and reports likely bugs without running it, and pass with zero warnings.

"Zero" matters. When a build prints 200 warnings, nobody reads the 201st, which is the one that mattered. When the count is kept at zero, a new warning stands out at once. The usual way to hold the line is to make warnings errors: `-Werror`.

When a warning is a false alarm, the fix is to rewrite the code so the tool can see it is safe, or, as the next lesson explains, to record a justified exception.

## Which rule fights modern C++ the most

Most of the ten fit modern C++ well; some are easier to meet in C++ than in C. The one that most often clashes with everyday C++ is rule 3. `std::vector`, `std::string`, `std::map` and `std::function` all allocate from the heap behind your back, and ordinary C++ style reaches for them first.

You do not have to give up good C++ to comply. Allocate everything at startup; use `std::array` and fixed-capacity containers (lesson 04), pass views with `std::span` and `std::string_view`, and give any container that must grow a custom allocator backed by a fixed pool. RAII, strong types and templates all still work.

::: key
Which Power of Ten rule most often conflicts with idiomatic modern C++? The no-dynamic-allocation rule, because most standard containers and std::string allocate. You comply by preallocating at init, using fixed-capacity containers, std::array and std::span, and custom allocators, without giving up RAII or type safety.
:::

## Writing a compliance report

On a real project you are often asked to show, rule by rule, whether a body of code complies. A **compliance report** lists each rule and gives one of three verdicts — compliant, non-compliant, or not applicable — with the file and line as evidence. Every non-compliance gets either a fix or a **deviation**: a written argument for why breaking the rule here is safe, approved by a reviewer. The next lesson covers deviations in coding standards; the idea is the same.

::: example Auditing a small file, then fixing it
Here is a small star-catalog loader with line numbers, and what the strictest warning set says about it.

```cpp
#include <cstdint>
#include <vector>

#define FIELD(name) float star_##name

struct Star {
    FIELD(x);
    FIELD(y);
};

using Handler = void (*)(const Star&);

std::vector<Star> g_catalog;

int count_in_view(const Star* stars, int n, int i) {
    if (i >= n) { return 0; }
    return (stars[i].star_y > 0.0F ? 1 : 0) + count_in_view(stars, n, i + 1);
}

void load(bool (*read_next)(Star&), Handler on_star) {
    Star s{};
    while (read_next(s)) {
        g_catalog.push_back(s);
        on_star(s);
    }
}

std::uint8_t brightest_index(const std::vector<Star>& v) {
    int best = 0;
    for (std::size_t i = 0; i < v.size(); ++i) {
        int best = static_cast<int>(i);
        (void)best;
    }
    return best;
}
```

`g++ -std=c++20 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Werror -c star_tracker.cpp`:

```text
star_tracker.cpp: In function 'uint8_t brightest_index(const std::vector<Star>&)':
star_tracker.cpp:31:13: error: declaration of 'best' shadows a previous local [-Werror=shadow]
   31 |         int best = static_cast<int>(i);
      |             ^~~~
star_tracker.cpp:29:9: note: shadowed declaration is here
   29 |     int best = 0;
      |         ^~~~
star_tracker.cpp:34:12: error: conversion from 'int' to 'uint8_t' {aka 'unsigned char'} may change value [-Werror=conversion]
   34 |     return best;
      |            ^~~~
cc1plus: all warnings being treated as errors
```

The line numbers below count from the `#include` at line 1. The report:

| Rule | Verdict | Evidence |
|---|---|---|
| 1 control flow | Non-compliant | line 17: `count_in_view` calls itself |
| 2 loop bounds | Non-compliant | line 22: `while (read_next(s))` has no bound |
| 3 no allocation | Non-compliant | line 23: `push_back` may allocate at any time |
| 4 function length | Compliant | longest function is 8 lines |
| 5 assertions | Non-compliant | 0 assertions in 3 functions |
| 6 smallest scope | Non-compliant | line 13: global `g_catalog` |
| 7 check returns and parameters | Non-compliant | line 15: `stars` never checked for null |
| 8 preprocessor | Non-compliant | line 4: token pasting `##` |
| 9 pointers | Non-compliant | lines 11 and 20: function pointers |
| 10 warnings | Non-compliant | lines 31 and 34: two warnings, and the build fails |

Nine of ten rules fail in 35 lines. Here is a rewrite of the core that fixes rules 1, 2, 3, 8 and 9:

```cpp
#include <algorithm>
#include <array>
#include <cstddef>
#include <cstdio>
#include <span>

struct Star {
    float x;
    float y;
};

constexpr std::size_t kMaxStars = 256;

class Catalog {
public:
    // Loads stars until the source runs dry or the catalog is full.
    // Source is any type with bool next(Star&): resolved at compile time,
    // so the call graph stays visible to the analyser (rule 9).
    template <typename Source>
    [[nodiscard]] std::size_t load(Source& src) {
        count_ = 0;
        for (std::size_t k = 0; k < kMaxStars; ++k) {   // rule 2: fixed bound
            Star s{};
            if (!src.next(s)) { break; }
            stars_[k] = s;                               // rule 3: no allocation
            ++count_;
        }
        return count_;
    }

    // Rule 1: a bounded algorithm instead of recursion.
    [[nodiscard]] std::size_t count_in_view() const {
        const std::span<const Star> loaded(stars_.data(), count_);
        return static_cast<std::size_t>(std::count_if(
            loaded.begin(), loaded.end(), [](const Star& s) { return s.y > 0.0F; }));
    }

private:
    std::array<Star, kMaxStars> stars_{};
    std::size_t count_{0};
};

struct FakeSensor {
    int left = 5;
    bool next(Star& s) {
        if (left == 0) { return false; }
        s = Star{0.0F, static_cast<float>(left) - 2.5F};
        --left;
        return true;
    }
};

int main() {
    static Catalog catalog;       // static storage, reserved before main runs
    FakeSensor sensor;
    const std::size_t n = catalog.load(sensor);
    std::printf("loaded %zu stars, %zu in view\n", n, catalog.count_in_view());
    return 0;
}
```

With the same strict flags it builds with no warnings at all, and prints:

```text
loaded 5 stars, 3 in view
```

Check by hand: the fake sensor gives `y` values $5 - 2.5 = 2.5$, then $1.5$, $0.5$, $-0.5$, $-1.5$. Three are above zero. Correct.

What changed: recursion became `std::count_if`, whose loop is bounded by `count_`, at most 256. The unbounded `while` became a `for` with a fixed limit. The vector became a `std::array` inside an object with static storage. The token-pasting macro became plain member names. The function pointers became a template parameter and a lambda, both resolved when the code compiles. What is still missing: rule 5's assertions (for example, `count_ <= kMaxStars` at the end of `load`). A real report would list that as the next fix.
:::

## Check yourself

::: check
A team's C++ code base uses a small `goto cleanup;` pattern in 30 functions to release resources on error. Which rule does it break, and what is the C++ way to get the same effect without breaking it?
:::

::: answer
It breaks rule 1, which bans `goto`. The C++ way is RAII: wrap each resource in an object whose destructor releases it. Every return path — normal or error — runs the destructors automatically, so the cleanup happens without any jump. The control flow is now plain `if`/`return`, which rule 1 allows.
:::

::: check
Why does rule 9 ban function pointers, when a function pointer never points into data and cannot overrun an array?
:::

::: answer
The ban is about analysis, not memory safety. Stack-depth and worst-case timing tools work on the call graph. At a call through a pointer set at run time, the tool cannot tell which function runs, so it cannot add up the frames or the time along that path, and the whole-program bound is lost. Replacing the pointer with a template parameter or a `switch` over an `enum` makes every possible target visible when the code compiles, so the call graph is complete again.
:::

::: check
A module has 25 functions and 38 assertions. Does it meet rule 5? If one of its assertions reads `check(buffer.pop(x))`, what is wrong with it?
:::

::: answer
$38/25 = 1.52$ assertions per function, below the minimum average of 2. It needs at least $2 \times 25 = 50$, so 12 more.

`check(buffer.pop(x))` has a side effect: it removes an item from the buffer while checking. Assertions must be side-effect-free, so that removing or changing the checking never changes what the program does. Write `const bool popped = buffer.pop(x);` and then `check(popped);` — or better, since an empty buffer can legitimately happen, handle it as a normal error rather than as an "impossible" condition.
:::

::: check
The top-level loop of the flight program is `for (;;) { wait_for_tick(); run_frame(); }`. Does it break rule 2?
:::

::: answer
No. Rule 2 is about loops that are supposed to finish. For a loop that must never end, such as a scheduler's main loop, the rule is turned around: it must be provable that the loop *cannot* terminate, and `for (;;)` with no `break` or `return` inside proves that at a glance. What rule 2 still demands is that every loop *inside* `run_frame()` has a fixed bound, so each frame finishes within its time budget.
:::

::: check
Your lead says "we use `std::vector` everywhere, so we cannot comply with the Power of Ten." Reply in two or three sentences.
:::

::: answer
Rule 3 bans allocation *after initialization*, not vectors as such. A vector whose `reserve` is called at startup and that never grows past that capacity does not allocate in the loop; better still, replace it with `std::array` or a fixed-capacity container, or give it a pool allocator, and pass views with `std::span`. The code keeps RAII and type safety, and an allocation counter in the tests (lesson 04) proves nothing allocates once the loop starts.
:::

## Summary

| Rule | In one line | Typical modern C++ way to comply |
|---|---|---|
| 1 | No `goto`, `setjmp`/`longjmp`, recursion | Loops with explicit bounded stacks; RAII instead of `goto cleanup` |
| 2 | Every loop has a provable fixed bound | `for` with a constant limit; fault if reached |
| 3 | No dynamic allocation after init | `std::array`, fixed-capacity containers, pools, `std::span` |
| 4 | About 60 lines per function | Split into small named functions |
| 5 | At least 2 assertions per function; they act in flight | A `check()` that reports and enters safe mode |
| 6 | Smallest possible scope | Locals over globals; `private` members |
| 7 | Check every return value and parameter | `[[nodiscard]]`; validate inputs first |
| 8 | Preprocessor only for includes and simple macros | `constexpr`, templates, `if constexpr` |
| 9 | One level of dereference; no function pointers | References, `std::span`, templates, `switch` on `enum` |
| 10 | All warnings, zero warnings, analyzers daily | `-Wall -Wextra -Wpedantic -Werror` plus two analyzers in CI |

The last lesson, **Coding standards and static analysis**, zooms out from ten rules to the full standards the industry uses — MISRA C++:2023 and JSF++ — and to the tools that check them, including the ones that can *prove* a whole class of errors is absent.

::: context holzmann The person behind the rules
Gerard Holzmann is a computer scientist who led JPL's Laboratory for Reliable Software. Before that, at Bell Labs, he created SPIN, a tool that checks designs of concurrent programs for errors, and received the ACM Software System Award for it. His *Power of Ten* paper appeared in the magazine *IEEE Computer* in June 2006. He later described in a paper called "Mars Code" how JPL's rules and tools were applied to the flight software of the Curiosity rover.
:::

::: context setjmp-longjmp A jump that skips everything
`setjmp` saves "where the program is" into a variable. Later, `longjmp` with that variable teleports the program back to that spot, no matter how many function calls deep it has gone. Every function in between is abandoned without returning. In C++ that is worse than in C: destructors of the abandoned functions' objects are not guaranteed to run, so locks stay locked and resources leak.
:::

::: context call-graph-cycle Why recursion has no depth limit
Draw each function as a box and each call as an arrow. Without recursion the drawing never loops back, and the deepest path is a finite list you can add up. With recursion an arrow points back up, and the path can go round that loop as many times as the data says — so no fixed stack size is guaranteed to be enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="50" y="15" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="90" y="33">main</text>
    <rect x="10" y="75" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="50" y="93">read_imu</text>
    <rect x="95" y="75" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="135" y="93">control</text>
    <rect x="95" y="130" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="135" y="148">mix</text>
    <rect x="230" y="15" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="270" y="33">main</text>
    <rect x="230" y="85" width="80" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="270" y="103">walk</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="41" x2="55" y2="75"/><line x1="100" y1="41" x2="130" y2="75"/>
    <line x1="135" y1="101" x2="135" y2="130"/><line x1="270" y1="41" x2="270" y2="85"/>
  </g>
  <path d="M310,92 C350,80 350,120 310,106" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="310,106 320,101 318,111" fill="#b4232c"/>
  <text x="90" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">no cycle: deepest path is 3</text>
  <text x="275" y="140" font-size="11" fill="#b4232c" text-anchor="middle">cycle: no bound</text>
</svg>
```
:::

::: context fragmentation Free memory you cannot use
Picture a parking lot where cars of different sizes come and go all day. By evening there may be room for ten cars in total, but scattered in single gaps between parked cars, so a bus cannot park anywhere. A heap does the same: after hours of allocations and frees, the free bytes are split into small pieces, and a large request fails even though the total free is plenty.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="20" width="40" height="30" fill="#6c7a93"/>
    <rect x="60" y="20" width="30" height="30" fill="#ffffff"/>
    <rect x="90" y="20" width="50" height="30" fill="#6c7a93"/>
    <rect x="140" y="20" width="30" height="30" fill="#ffffff"/>
    <rect x="170" y="20" width="60" height="30" fill="#6c7a93"/>
    <rect x="230" y="20" width="30" height="30" fill="#ffffff"/>
    <rect x="260" y="20" width="50" height="30" fill="#6c7a93"/>
    <rect x="310" y="20" width="30" height="30" fill="#ffffff"/>
    <rect x="20" y="70" width="100" height="26" fill="#f2b880"/>
  </g>
  <text x="130" y="81" font-size="11" fill="#1f2a44">request: 100 bytes</text>
  <text x="130" y="97" font-size="11" fill="#b4232c">free: 4 gaps of 30 = 120, none fits</text>
</svg>
```
:::

::: context safe-mode What "doing something" means
Lesson 07 described safe mode: the vehicle stops its normal mission, points its solar panels at the Sun, keeps itself warm and powered, and waits for the ground to diagnose the problem. A failed assertion is strong evidence that the software's picture of the world is wrong, so handing control to that simple, well-tested mode is often the right response. A smaller response — rejecting one bad input and returning an error — is right when the damage is local.
:::

::: context pointer-levels Counting the arrows
A pointer is an arrow to a value. `*p` follows one arrow. `**p` follows an arrow to another arrow, and then that one. Each extra level is one more thing that can be null or stale, and one more step a reader and an analyzer must track. Rule 9 allows following one arrow at a time; if you need to go further, name the middle step with its own checked variable.
:::
