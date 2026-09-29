---
id: l10-modernising-legacy-code
title: Modernizing old C++ code safely
minutes: 19
covers:
  - Modernizing legacy code: what to change first and how to justify each change
---

Imagine renovating an old house while a family still lives in it. You would not start by knocking down walls. First you put smoke detectors in every room, so that if something starts to burn, you hear about it. Then you photograph every room exactly as it is, so that later you can prove what you changed and what you did not. Then you work one room at a time, and you never mix "fix the leaking pipe" with "repaint the kitchen" in the same afternoon, because if the floor gets wet you want to know which job did it.

Old flight and ground code is that house. It works. It has flown, or it has run in the simulator for fifteen years. It is also written the C++98 way: `NULL`, raw `new` and `delete`, C arrays with a separate length, macros, plain `enum`. You have spent this module learning what replaced each of those. This lesson is about the harder question: in what order do you change them, and how do you convince a reviewer — or a certification board — that each change made the code safer without changing what it does?

**Modernizing** here means changing the *form* of working code to use newer, safer language features, while keeping its *behavior* identical. It is a kind of **[[refactoring|refactoring]]**: improving the structure of code without changing what it does from the outside.

## The one rule: change the form, not the behavior

Every change in a modernization falls into one of two kinds.

- A **refactoring** changes how the code is written and nothing it does. Same inputs, same outputs, same timing class.
- A **behavior change** makes the program do something different. A bug fix is a behavior change, even a good one.

The whole method rests on keeping these apart. If a diff is a pure refactoring, the review question is narrow: "is this really equivalent?" If a diff mixes the two, the reviewer must untangle which lines are the fix and which are the tidy-up, and one wrong line hides among fifty right ones.

The order of work follows from the risk of each step and what it buys:

1. **Turn on the smoke detectors**: compiler warnings and sanitizers. No code changes at all, and they often find real bugs on day one.
2. **Photograph the house**: tests that pin down what the code does now.
3. **Mechanical changes**, cheapest and safest first: `nullptr`, `override`, `enum class`, smart pointers for ownership, `std::array` and `std::span` for C arrays, range-for, `const` and `constexpr`, and replacing macros.
4. **Bug fixes**, each in its own change, each with a test that shows the difference.

::: key What to change first
Order by risk and benefit: warnings and sanitizers on first, then tests around the code, then small mechanical changes (`nullptr`, `override`, `enum class`, smart pointers for ownership, `std::array` for C arrays, range-for, `const`/`constexpr`, macros), and only then behavior changes, each on its own.
:::

## Step 1: smoke detectors

A **compiler warning** is the compiler saying "this is legal, but it looks like a mistake". `-Wall -Wextra` turns on the large, well-tested sets you have used since the basics module. A **[[sanitizer|sanitizer-cost]]** is a checker the compiler builds into the program, which watches it while it runs: AddressSanitizer for bad memory accesses and leaks, UndefinedBehaviorSanitizer for things like signed overflow. The memory module introduced both. Here they are pointed at old code.

::: example Warnings and sanitizers on a legacy file
Here is `legacy.cpp`, the simulator's thruster log, written the C++98 way. It has run for years and prints plausible numbers.

```cpp
// legacy.cpp -- thruster log, C++98 style, still used in the simulator
#include <cstdio>
#include <cstring>

#define MAX_THRUSTERS 4
#define SQUARE(x) x * x

enum Mode { IDLE, FIRING, FAULT };

class Filter {
public:
    virtual ~Filter() {}
    virtual double update(double sample) { return sample; }
};

class LowPass : public Filter {
public:
    LowPass() : state_(0.0) {}
    virtual double update(float sample) {       // meant to override
        state_ = 0.5 * state_ + 0.5 * sample;
        return state_;
    }
private:
    double state_;
};

double energy(const double* pulses, int n, double offset) {
    double total = 0.0;
    for (int i = 0; i < n; i++)
        total += SQUARE(pulses[i] - offset);
    return total;
}

void report(const double* pulses, Mode mode) {
    char* name = new char[16];
    std::strcpy(name, "RCS-A");
    std::printf("%s energy %.2f mode %d\n", name,
                energy(pulses, MAX_THRUSTERS, 0.5), mode);
}

int main() {
    double pulses[MAX_THRUSTERS] = {1.0, 2.0, 3.0, 4.0};
    Filter* f = new LowPass();
    if (f != NULL) {
        for (int i = 0; i < MAX_THRUSTERS; i++)
            std::printf("filtered %.4f\n", f->update(pulses[i]));
    }
    report(pulses, FIRING);
    delete f;
    return 0;
}
```

Built with plain `g++ -std=c++20 -O2`, no warnings appear, and it prints:

```text
filtered 1.0000
filtered 2.0000
filtered 3.0000
filtered 4.0000
RCS-A energy 3.00 mode 1
```

**Turn on warnings.** Add `-Wall -Wextra` and g++ 13 says:

```text
legacy.cpp:13:20: warning: 'virtual double Filter::update(double)' was hidden [-Woverloaded-virtual=]
   13 |     virtual double update(double sample) { return sample; }
      |                    ^~~~~~
legacy.cpp:19:20: note:   by 'virtual double LowPass::update(float)'
```

Read it slowly. `LowPass::update` takes a `float`; the base takes a `double`. Different parameter types make a different function, so `LowPass` did not override anything. It added a new function that **[[hides|hidden-virtual]]** the base one. The call `f->update(pulses[i])` goes through a `Filter*`, finds the base `update(double)`, and returns the sample unchanged. That is why the "filtered" values equal the raw pulses: the filter has never filtered.

**Turn on sanitizers.** Build with `g++ -std=c++20 -g -O0 -fsanitize=address,undefined` and run. After the five normal lines:

```text
==15062==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 16 byte(s) in 1 object(s) allocated from:
    #0 0x7f21c58fe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x55dc6ca0f562 in report(double const*, Mode) legacy.cpp:35
    #2 0x55dc6ca0fab8 in main legacy.cpp:48
    #3 0x7f21c482a1c9 in __libc_start_call_main ../sysdeps/nptl/libc_start_call_main.h:58
    #4 0x7f21c482a28a in __libc_start_main_impl ../csu/libc-start.c:360
    #5 0x55dc6ca0f2c4 in _start (lega+0x32c4) (BuildId: 1254cda68f1f926fddd6481847bf75224d1b77de)

SUMMARY: AddressSanitizer: 16 byte(s) leaked in 1 allocation(s).
```

Read the stack from the top: the memory came from `operator new[]`, called at line 35 in `report`, called from `main`. Line 35 is `new char[16]`, never deleted. Sixteen bytes once is harmless; the same function called at 10 Hz for a day is $16 \times 10 \times 86{,}400 = 13{,}824{,}000$ bytes, about 14 MB.

Sanity check: two real bugs, and not one line of the program changed. That is why this step comes first.
:::

::: warning Leak detection is conservative
Built with `-O1` instead of `-O0`, the same program reported no leak on this machine. The leak checker looks through memory for anything that still looks like a pointer to each block, and an optimized build can leave a stale copy of `name` lying around. So run sanitizer builds without heavy optimization, and treat "no report" as "nothing found", not "nothing there".
:::

## Step 2: photograph the house

Before changing a line, write down what the code does now. A **[[characterization test|characterization-test]]** records a program's current behavior — right or wrong — so that any change to it is noticed. The simplest kind is a **golden file**: run the program once, save its output, and compare every later run against it.

```text
$ ./legacy > golden.txt           # once, before any change
$ ./legacy | diff golden.txt -    # after every change: silence means identical
```

Notice what this test pins down: the *wrong* filtered values and the *wrong* energy. That is deliberate. During refactoring, the test's job is to prove nothing changed. Fixing the bugs is a separate job, later, with its own test.

::: warning Tests before changes, not after
Writing tests after modernizing only proves the new code does what the new code does. The comparison that matters is old against new, and the old behavior is gone once you have edited it. Keep the original build, or its saved output, until the refactoring is finished.
:::

## Step 3: the mechanical changes

Each change below replaces a C++98 pattern with the feature this module traced back to its standard. Each earns its place by removing a **defect class** — a whole family of bugs that can no longer be written. The right-hand column is what makes a change *justifiable*: something a reviewer can check.

| Change | Defect class removed | Evidence for the reviewer |
| --- | --- | --- |
| `NULL` or `0` to `nullptr` | `NULL` sent to an integer overload instead of a pointer one | golden file unchanged |
| add `override` | a "virtual override" that overrides nothing | it compiles, or it finds a bug |
| `enum` to `enum class` | enum values mixed with integers or other enums | compiles; every new cast is visible in the diff |
| owning raw pointer to `std::unique_ptr` | leaks, double delete, delete on the wrong path | sanitizer run clean |
| C array plus length to `std::array` or `std::span` | mismatched length, array decay, `sizeof` on a pointer | golden file unchanged |
| index loop to range-for | off-by-one, wrong index variable | golden file unchanged |
| add `const`, `constexpr` | accidental writes; values computed at run time | compiles |
| macros to `constexpr` and functions | precedence and double-evaluation surprises | golden file — and see below |

The order in the table is the order of risk. `override` never changes the machine code at all. `nullptr` changes it only where `NULL` was quietly choosing an integer overload — the very bug it exists to catch. Smart pointers change who deletes an object, so they need the sanitizer run. Macros come last, because replacing a macro with a function can change behavior when the macro was broken, as this one is.

The same thinking applies to function signatures. A C++98 parser often looks like `bool parse(const std::uint8_t* p, int n, int* out_id, double* out_value)`. Taking a `std::span<const std::uint8_t>` removes the mismatched pointer-and-length and the null-argument cases; returning a `std::optional` removes the ignored `bool` and the half-written output on failure. Lesson 04's C++17 tools finish the job at the call site:

```cpp
struct Sample {
    int id = 0;
    double value = 0.0;
};

std::optional<Sample> parse(std::span<const std::uint8_t> frame) {
    if (frame.size() < 9) return std::nullopt;
    Sample s;
    s.id = frame[0];
    std::memcpy(&s.value, frame.data() + 1, sizeof s.value);
    return s;
}

void handle(std::span<const std::uint8_t> frame) {
    // The result exists only inside the if that checks it.
    if (const auto sample = parse(frame); sample) {
        const auto [id, value] = *sample;
        std::printf("channel %d = %.1f\n", id, value);
    } else {
        std::puts("frame rejected");
    }
}
```

Called with a 9-byte frame holding channel 7 and the value 101.3, and then with only its first 4 bytes, this printed `channel 7 = 101.3` and then `frame rejected`.

::: key Three C++17 features that reduce bug risk, and how
`std::optional` removes the sentinel-value and uninitialised-out-parameter pattern; structured bindings remove index and `get<>` mistakes; if-init scopes a result to the branch that checks it, so it cannot be misused afterwards.
:::

## Letting the tool do the typing

Much of step 3 is so mechanical that a tool can do it. **[[clang-tidy|clang-tidy-name]]** is a free checker from the LLVM project. Its `modernize-*` family of checks finds C++98 patterns and can rewrite them.

::: example clang-tidy on the legacy file
clang-tidy 18 is installed here. Run the modernize checks, minus one noisy check explained below, plus one that flags macros:

```text
$ clang-tidy legacy.cpp -checks='-*,modernize-*,-modernize-use-trailing-return-type,cppcoreguidelines-macro-usage' -- -std=c++20
legacy.cpp:5:1: warning: replace macro with enum [modernize-macro-to-enum]
legacy.cpp:5:9: warning: macro 'MAX_THRUSTERS' used to declare a constant; consider using a 'constexpr' constant [cppcoreguidelines-macro-usage]
legacy.cpp:5:9: warning: macro 'MAX_THRUSTERS' defines an integral constant; prefer an enum instead [modernize-macro-to-enum]
legacy.cpp:6:9: warning: function-like macro 'SQUARE' used; consider a 'constexpr' template function [cppcoreguidelines-macro-usage]
legacy.cpp:12:13: warning: use '= default' to define a trivial destructor [modernize-use-equals-default]
legacy.cpp:24:12: warning: use default member initializer for 'state_' [modernize-use-default-member-init]
legacy.cpp:42:5: warning: do not declare C-style arrays, use std::array<> instead [modernize-avoid-c-arrays]
legacy.cpp:44:14: warning: use nullptr [modernize-use-nullptr]
legacy.cpp:45:9: warning: use range-based for loop instead [modernize-loop-convert]
```

(The part after `--` gives the compiler flags, since there is no build database here.) Nine findings. The first time, without excluding anything, there were also four `modernize-use-trailing-return-type` findings, asking to write `auto main() -> int`. That is a style preference, not a defect class, so it was switched off. Choosing checks is part of the job.

Now let the tool apply its own fixes to a copy, with `-fix` and the modernize checks. Part of the resulting diff:

```text
-    virtual ~Filter() {}
+    virtual ~Filter() = default;
...
-    double state_;
+    double state_{0.0};
...
-    if (f != NULL) {
-        for (int i = 0; i < MAX_THRUSTERS; i++)
-            std::printf("filtered %.4f\n", f->update(pulses[i]));
+    if (f != nullptr) {
+        for (double pulse : pulses)
+            std::printf("filtered %.4f\n", f->update(pulse));
```

It also turned `#define MAX_THRUSTERS 4` into an unnamed `enum`. Now the evidence. The fixed copy printed exactly the five golden lines, so `diff` was silent. Better still, compiled with `g++ -O2 -c`, the two object files were both 1,020 bytes, and their disassembly was **identical**, instruction for instruction.

Sanity check: identical machine code is the strongest "no behavior change" evidence there is — and it also means the tool fixed neither bug. The filter still does not filter, and the energy is still 3.00. No `modernize` check reported `LowPass::update(float)`, because it overrides nothing, so `modernize-use-override` had nothing to act on. The tool changes form. Finding bugs was step 1's job.
:::

::: warning Automatic fixes still need a review
`-fix` edits your files. It can leave awkward formatting (here, `LowPass()  {}` with two spaces), and on unusual code a rewrite can be wrong. Run it on a clean working copy, one check family at a time, and review the diff like any other.
:::

## Bug fixes go in their own change

Now the two bugs. Try adding `override` by hand to `LowPass::update(float)`, as step 3 says, and the compiler turns the warning into an error:

```text
error: 'double LowPass::update(float)' marked 'override', but does not override
```

That error is the whole point of `override`. The fix is to take a `double`. The second bug is the macro. `SQUARE(pulses[i] - offset)` pastes text, becoming `pulses[i] - offset * pulses[i] - offset`. Multiplication happens first, so for a pulse $p$ it computes $p - 0.5p - 0.5 = 0.5p - 0.5$ instead of $(p - 0.5)^2$. Replacing it with `constexpr double square(double x) { return x * x; }` fixes the [[precedence|macro-expansion]].

Both fixes change the output, so each is its own change, with its own ticket, and each updates the golden file on purpose. After both, and the rest of step 3 (`std::array`, `std::span`, `std::make_unique`, `enum class Mode`, `std::string_view` for the name), the program prints:

```text
filtered 0.5000
filtered 1.2500
filtered 2.1250
filtered 3.0625
RCS-A energy 21.00 mode 1
```

Check by hand. The filter halves the distance to each new sample: $0.5 \times 0 + 0.5 \times 1 = 0.5$, then $0.5 \times 0.5 + 0.5 \times 2 = 1.25$, then $2.125$, then $3.0625$. The energy is $(0.5)^2 + (1.5)^2 + (2.5)^2 + (3.5)^2 = 0.25 + 2.25 + 6.25 + 12.25 = 21.0$. The old macro gave $0.5 \times (1 + 2 + 3 + 4) - 4 \times 0.5 = 5 - 2 = 3.0$, which matches the old output. The sanitizer run is clean, and clang-tidy with the same checks reports nothing.

## Justifying each change

A reviewer, and even more a certification board, will ask of every diff: why this, why now, and how do you know it is safe? Four habits answer them.

- **Name a measurable benefit.** "Removes the mismatched-length defect class from 12 call sites." "Warning count 31 to 0." "clang-tidy modernize findings 9 to 0." "Sanitizer run: 1 leak to none." Numbers can be checked; "more modern" cannot.
- **Keep diffs small and single-purpose.** One kind of change per commit: all the `nullptr` changes, then all the `override` changes. A reviewer can check a 40-line diff of one pattern properly; a 2,000-line mix gets skimmed.
- **Show there was no behavior change.** The golden file is unchanged. For the strongest claim, the object code is unchanged, as it was for the clang-tidy fixes.
- **Leave regression tests behind.** Each bug fix adds a test that failed before and passes after, so the bug cannot quietly come back.

::: key How to justify each change
Each change names a measurable benefit (a defect class removed, a count that falls), comes as a small single-purpose diff, carries evidence of no behavior change (golden output, ideally identical object code), and leaves regression tests behind.
:::

For flight code under a formal standard such as **[[DO-178C|do-178c]]**, add one more question: what does the change cost to re-verify? Changing certified code can mean repeating reviews, tests and coverage analysis for everything it touches. So teams often modernize a file when they must change it anyway, and leave stable, verified code alone. "Modern" is not a reason. A defect class removed, at a verification cost the project accepts, is.

## Check yourself

::: check
A colleague proposes one pull request that converts 300 files from `NULL` to `nullptr`, adds `override` everywhere, and fixes the three bugs `-Wall` found. What would you ask them to change, and why?
:::

::: answer
Split it. The `nullptr` change and the `override` change are pure refactorings, each one pattern, each checkable by "compiles, golden output unchanged, ideally object code unchanged". The three bug fixes change behavior, so each needs its own change, its own test that fails before and passes after, and a deliberate update to the golden output. Mixed together, a reviewer cannot tell which lines are meant to change behavior, and a mistake in one fix hides among hundreds of mechanical edits.
:::

::: check
Why do warnings and sanitizers come before any code change, and before the tests?
:::

::: answer
They change no source code, so they cannot break anything, and they often find real bugs at once — in the example, a filter that never filtered and a leak, with zero edits. They also tell you which "current behavior" is actually a bug before you pin it down in a characterization test, so you know which lines of the golden file you expect to change later.
:::

::: check
`#define SQUARE(x) x * x` is used as `SQUARE(a + 1)` with `a = 3`. What does it compute, what should it compute, and why is replacing it not a pure refactoring?
:::

::: answer
The text becomes `a + 1 * a + 1`, and multiplication goes first: $3 + 1 \times 3 + 1 = 3 + 3 + 1 = 7$. The intended value is $(3 + 1)^2 = 16$. A `constexpr` function computes 16, so the program's output changes. That makes the replacement a bug fix — a behavior change — which needs its own change and test, not a place in a batch of mechanical edits.
:::

::: check
clang-tidy's `-fix` produced a diff, the golden output is unchanged, and the disassembly of the object file is identical before and after. What exactly have you shown, and what have you not?
:::

::: answer
You have shown that, with this compiler and these flags, the change produced the same machine code, so the program behaves the same in every case, not only the ones the golden file covers. You have not shown that the code is correct: identical code keeps every existing bug, as the unchanged "filtered" values showed. You also have not shown it for other compilers or flags, which could in principle generate different code from the new source.
:::

::: check
Turn `bool read_gyro(const double* buf, int n, double* rate)` into a signature a reviewer would call safer, and name the defect classes your version removes.
:::

::: answer
`std::optional<double> read_gyro(std::span<const double> buf)`. The `span` carries its own length, so the pointer and length cannot disagree, and it cannot be a bare null pointer with a nonzero count. The `optional` return means there is no out-parameter to leave half-written or uninitialised on failure, and no `bool` to ignore: to get the rate the caller must check whether there is one. At the call site, `if (const auto rate = read_gyro(buf); rate)` keeps `rate` inside the branch that checked it.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Refactoring | change form, keep behavior | never mix with a bug fix in one change |
| Order of work | cheapest and safest first | warnings and sanitizers, tests, mechanical changes, then bug fixes |
| Characterization test | pins down current behavior, bugs included | golden file: save output once, `diff` after every change |
| Defect class | a family of bugs a change makes impossible | each change names the one it removes |
| clang-tidy `modernize-*` | finds and rewrites C++98 patterns | choose checks; review `-fix` diffs; it changes form, not bugs |
| Strongest evidence | identical object code | the clang-tidy fixes here gave identical disassembly |
| Justification | measurable benefit, small diffs, no behavior change, regression tests | in certified code, weigh the cost of re-verification |

That finishes the module: you know what each standard added, which subset flies, and how to move old code toward it safely. The next module, **Concurrency, memory ordering and determinism**, adds the thing every real flight computer has and none of these examples did — [[several threads running at once|next-module]] — and the rules that keep them from corrupting each other's data.

::: context refactoring A word with a book behind it
Martin Fowler's book *Refactoring* (1999) made the word common. Its idea is that structure improves in many small steps, each one a behavior-preserving change you can check, rather than one big rewrite. Renaming a variable, extracting a function and replacing a loop with range-for are all refactorings. Fixing a bug is not, however small, because afterwards the program does something different.
:::

::: context sanitizer-cost Sanitizers are for test builds
A sanitizer adds checks around memory accesses and arithmetic, plus bookkeeping memory of its own. The Clang documentation gives the typical slowdown of AddressSanitizer as about 2x, and it uses much more memory than the plain program. So sanitizers belong in test and simulation builds run on the ground, never in the flight image. They are still among the cheapest ways to find memory bugs in old code: build, run the tests, read the report.
:::

::: context hidden-virtual Hiding is not overriding
A derived class overrides a virtual function only if the name and the parameter types match. Change `double` to `float` and the derived class gets a second, unrelated function. Calls through a base pointer still use the base version. `override` asks the compiler to check the match; `-Woverloaded-virtual` spots the hiding.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">vtable for Filter</text>
  <rect x="10" y="26" width="150" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="85" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">~Filter</text>
  <rect x="10" y="52" width="150" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">Filter::update(double)</text>
  <text x="195" y="18" font-size="12" fill="#1f2a44">vtable for LowPass</text>
  <rect x="195" y="26" width="155" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="272" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">~LowPass</text>
  <rect x="195" y="52" width="155" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="272" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">Filter::update(double)</text>
  <rect x="195" y="78" width="155" height="26" fill="#f2b880" stroke="#b4232c"/>
  <text x="272" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">LowPass::update(float)</text>
  <text x="10" y="126" font-size="11" fill="#1f2a44">f-&gt;update(x) uses the blue slot in both tables.</text>
  <text x="10" y="142" font-size="11" fill="#b4232c">The orange slot is new; a Filter* never calls it.</text>
</svg>
```
:::

::: context characterization-test Pinning down what is, not what should be
The name comes from Michael Feathers' book *Working Effectively with Legacy Code* (2004), which defines legacy code as code without tests. A characterization test describes what the code actually does, so you can change its structure and notice at once if its behavior moved. It is not a statement that the behavior is right. Once the refactoring is done, the characterization tests are often replaced by ordinary tests of the intended behavior.
:::

::: context clang-tidy-name A linter with fixes built in
clang-tidy is built on the Clang compiler's own parser, so it sees the code exactly as the compiler does: types, overloads, templates. That is what lets it rewrite code safely, such as turning an index loop into range-for only when the index is used for nothing else. Its checks come in families: `modernize-*`, `bugprone-*`, `cppcoreguidelines-*`, `readability-*` and more. The real-time module returns to it alongside the commercial analyzers used on flight code.
:::

::: context macro-expansion Why the macro multiplied the wrong things
The preprocessor pastes text before the compiler sees anything, with no idea of precedence. The compiler then applies the usual rule: multiplication before subtraction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">SQUARE(p - off)  pastes  x * x  with x = p - off:</text>
  <text x="10" y="50" font-size="14" fill="#1f2a44">p -</text>
  <rect x="36" y="34" width="86" height="24" fill="#f2b880" stroke="#b4232c"/>
  <text x="79" y="50" font-size="14" text-anchor="middle" fill="#1f2a44">off * p</text>
  <text x="128" y="50" font-size="14" fill="#1f2a44">- off</text>
  <text x="10" y="80" font-size="11" fill="#b4232c">computed: p - off*p - off   (for off = 0.5: 0.5p - 0.5)</text>
  <text x="10" y="104" font-size="11" fill="#1d6fd1">intended: (p - off)*(p - off)</text>
</svg>
```

Wrapping every use in brackets, `((x) * (x))`, fixes precedence but still evaluates `x` twice, so `SQUARE(i++)` would still be wrong. A function has neither problem.
:::

::: context do-178c The rulebook for aircraft software
DO-178C, published by RTCA in 2011, is the standard certification authorities use to approve software in civil aircraft. It sorts software into levels A to E by how bad a failure could be, and at the highest level demands the most evidence: requirements traced to code, reviews, and detailed structural coverage from tests. NASA uses its own requirements, NPR 7150.2, for spacecraft software. Under any of these, a change to verified code needs its evidence redone, which is why modernization is planned, not casual.
:::

::: context next-module Where the next module starts
Everything so far ran on one thread, so each line finished before the next began. With several threads, two can read and write the same variable at the same moment, and the result depends on timing. C++ calls that a data race and gives it no meaning at all. The next module teaches the tools that prevent it — mutexes, atomics, memory orderings — and a sanitizer you have not met yet, ThreadSanitizer, which finds races the way AddressSanitizer found the leak here.
:::
