---
id: l12-coding-standards-and-static-analysis
title: Coding standards and static analysis
minutes: 22
covers:
  - 'MISRA C++:2023, which absorbs AUTOSAR C++14; JSF++ AV and its F-35 origin'
  - 'Static analysis: clang-tidy, cppcheck, Polyspace, LDRA, Helix QAC'
---

A spell checker and a building inspector both check your work, but in very different ways. The spell checker is fast and cheap, runs every time you type, and sometimes flags a word that is fine. The inspector is slow and expensive, comes rarely, and signs a paper saying the house will not fall down. You want both. Neither replaces the other, and neither replaces a good builder.

Safety-critical software has the same layers. A **coding standard** is the builder's rulebook: a written list of what the code may and may not do. **Static analysis tools** are the checkers: programs that read the source code, without running it, and report where it breaks the rules or might fail. Some are spell checkers — quick, helpful, sometimes wrong. A few are inspectors — they can *prove* that certain errors can never happen.

The last lesson gave you ten rules that fit on a page. This one covers the full standards used on real vehicles, **MISRA C++:2023** and its predecessor for fighter jets, **JSF++**, and the tools that enforce them: clang-tidy, cppcheck, Polyspace, LDRA and Helix QAC. By the end you should be able to say what each tool can and cannot promise, and how to argue against a rule in a design review the professional way.

## Why a coding standard at all

C++ is a large language with many ways to go wrong quietly. **[[Undefined behavior|undefined-behavior]]** — code the language standard gives no meaning to, such as reading past the end of an array or overflowing a signed integer — does not always crash. It may work in testing and fail in flight after a compiler upgrade. Some features are legal but risky: implicit conversions that lose data, `union` tricks, exceptions with unbounded timing.

A coding standard picks a **safer subset** of the language. It bans the most dangerous features, restricts risky ones, and requires habits that make code easier to check. Crucially, most of its rules are written so a tool can check them. A standard that only people enforce is enforced unevenly; one a tool enforces is enforced on every line, every night.

## MISRA C++:2023

**MISRA** began as a project of the British car industry — the name comes from the Motor Industry Software Reliability Association — and published its first rules for C in 1998. Its standards spread far beyond cars, into rail, medical devices, and aerospace, because the problem they solve is the same everywhere.

For years C++ had two competing rule sets. MISRA C++:2008 covered the old C++03 language. Meanwhile **[[AUTOSAR|autosar]]**, a partnership of carmakers and suppliers, published its own *Guidelines for the use of the C++14 language in critical and safety-related systems* in 2017, known as **AUTOSAR C++14**, to cover modern features like `auto`, lambdas and move semantics. In 2019 the two organizations agreed to merge the work. The result is **MISRA C++:2023**, published in October 2023 and aimed at C++17. It absorbs the AUTOSAR C++14 guidelines, replaces MISRA C++:2008, and largely takes over from JSF++ as the standard new C++ projects adopt.

Every guideline in MISRA C++:2023 has a **category** that says how strictly it binds:

- **Mandatory** — must always be followed. No deviation is allowed. These cover things like undefined behavior that no argument can make safe.
- **Required** — must be followed unless there is a formal, documented **deviation**, approved by the project.
- **Advisory** — recommended good practice. A project may decide not to follow an advisory rule, though it should still record that choice.

A project can make a rule *stricter* — treat an advisory rule as required, say — and may formally switch off an advisory rule, but it can never weaken a required or mandatory one.

::: key
MISRA C++:2023 is the current unified C++ safety-critical coding standard, which absorbs AUTOSAR C++14 and largely supersedes JSF++, defining rules with required, advisory and mandatory categories plus a documented deviation process.
:::

## Deviations: disagreeing the professional way

Sooner or later a rule will forbid something your team believes is safe and clearer than the alternative. The standard expects this. It does not say "never break a required rule". It says: if you break one, show your reasoning and get it approved.

A **deviation record** is a short document that says:

1. which rule is being broken, and exactly where (file, line, or a whole class of cases);
2. why the code is safe here — the argument, with evidence;
3. what extra protection is in place, such as a test, a review, or a runtime check;
4. who reviewed and approved it, and when.

When the same deviation comes up again and again, projects write a **deviation permit** once, stating the conditions under which that rule may be broken, and each use then refers to it. MISRA publishes a companion document, *MISRA Compliance:2020*, that sets out how deviations, permits and a project's claim of compliance should be recorded.

Why all the paperwork? Because someone else — a reviewer, a certification authority, an engineer five years later investigating an anomaly — must be able to see *that* the rule was broken, *why*, and *who agreed*. A silent rule-break looks exactly like a mistake. A documented one is a decision.

::: warning
Two tempting shortcuts are never acceptable. Turning off the checker for a whole file hides every *other* violation in that file along with the one you meant. And rewriting code into an ugly shape purely to dodge a tool's pattern-match — without making it any safer — satisfies the checker while defeating the rule's purpose. If you think a rule is wrong for your code, write the deviation and argue it in the open.
:::

Good design-review arguments are specific, not dogmatic, in either direction. "MISRA says so" is not an argument for a rule; "MISRA is bureaucracy" is not an argument against it. A strong case names the hazard the rule guards against, shows why that hazard cannot occur at this spot, and states what would catch it if the argument were wrong.

## JSF++ and the F-35

Before MISRA had a modern C++ standard, the most influential set of C++ rules for flight came from a fighter jet. The **F-35 Lightning II**, developed under the Joint Strike Fighter (JSF) program, was one of the first major combat aircraft to write most of its flight software in C++ rather than Ada, the language US military projects had long favored.

To make that safe, Lockheed Martin wrote the **Joint Strike Fighter Air Vehicle C++ Coding Standards**, usually called **JSF++** or **JSF AV C++**, published in 2005. **[[Bjarne Stroustrup|stroustrup]]**, the creator of C++, worked with the team on it. It built on MISRA C and other earlier rule sets, and graded its rules with the words *shall* (mandatory, checked), *will* (mandatory, not necessarily checked), and *should* (advice).

Many of its themes will look familiar: no recursion, no allocation after initialization, no exceptions, strict limits on function size and complexity, and a preference for a small, analyzable subset of the language. JSF++ is still read and cited, and it shaped both AUTOSAR C++14 and MISRA C++:2023. But it targets C++ as it was in 2005, and a new project today would normally adopt MISRA C++:2023 instead.

## What static analysis is

A **static analyzer** reads source code and reasons about what it could do, without running it. That is its superpower and its limit. It can consider paths no test ever took. But it must reason about programs in general, and a famous result of computer science, **[[Rice's theorem|rice]]**, says no tool can decide every interesting property of every program exactly. So each tool must give something up.

It can give up in one of two directions:

- A **[[sound|sound-vs-unsound]]** analyzer never misses a real error of the kinds it checks. If it says "no division by zero here", there is none, on any input. The price is **false positives**: it sometimes warns about code that is actually fine, because it could not prove otherwise.
- An **unsound** analyzer, also called a **bug finder**, tries to report only things likely to be real, so it has fewer false alarms. The price is **false negatives**: it can miss real errors.

Most everyday tools are bug finders. They are fast, and they run on every commit. A few tools are sound, slower, and used to build the evidence that a flight build is free of whole classes of run-time errors.

## The tools you will meet

- **clang-tidy** is a free linter from the LLVM project. It runs hundreds of checks grouped into families, such as `bugprone-*`, `cppcoreguidelines-*`, `modernize-*` and `clang-analyzer-*`. It is a bug finder and style checker, easy to run on every build.
- **cppcheck** is a free, open-source analyzer that aims for few false positives. It is good at out-of-bounds indexes, uninitialized variables and leaks. A commercial edition adds coding-standard checking.
- **Polyspace**, from MathWorks, comes in two parts. **Polyspace Bug Finder** is a fast bug finder and coding-standard checker, including MISRA. **Polyspace Code Prover** is a sound analyzer based on **abstract interpretation**, explained below.
- **LDRA** is a British company whose tool suite combines static analysis and coding-standard checking with test coverage measurement, and produces the evidence packages used for certification under aerospace standards such as **[[DO-178C|do-178c]]**.
- **Helix QAC**, from Perforce (earlier known as QA·C and QA·C++ from PRQA), is a commercial analyzer widely used to check and report compliance with MISRA and similar standards.

No single tool catches everything, which is why the Power of Ten asks for more than one.

::: example Three tools, one buggy file
Here is a small file with three planted bugs: a loop that reads one element past the end of an 8-element array (`<=` instead of `<`), a variable that is returned uninitialized when `window_ms` is zero, and an `int` squeezed into a 16-bit result.

```cpp
#include <array>
#include <cstdint>

constexpr int kThrusters = 8;

// Sum the on-times of all thrusters, in milliseconds.
int total_on_time(const std::array<int, kThrusters>& on_ms) {
    int total = 0;
    for (int i = 0; i <= kThrusters; ++i) {
        total += on_ms[i];
    }
    return total;
}

// Duty cycle in percent over a window.
int duty_percent(int on_ms, int window_ms) {
    int percent;
    if (window_ms > 0) {
        percent = 100 * on_ms / window_ms;
    }
    return percent;
}

std::int16_t to_counts(int millivolts) {
    return millivolts * 4;
}

int main() {
    std::array<int, kThrusters> on{10, 20, 0, 0, 5, 5, 0, 0};
    return total_on_time(on) + duty_percent(40, 0) + to_counts(3);
}
```

**cppcheck 2.13** (`cppcheck --enable=warning,style,performance --std=c++20 --quiet thruster.cpp`):

```text
thruster.cpp:10:23: error: Out of bounds access in 'on_ms[i]', if 'on_ms' size is 8 and 'i' is 8 [containerOutOfBounds]
        total += on_ms[i];
                      ^
thruster.cpp:9:23: note: Assuming that condition 'i<=kThrusters' is not redundant
    for (int i = 0; i <= kThrusters; ++i) {
                      ^
thruster.cpp:10:23: note: Access out of bounds
        total += on_ms[i];
                      ^
thruster.cpp:21:12: warning: Uninitialized variable: percent [uninitvar]
    return percent;
           ^
thruster.cpp:18:19: note: Assuming condition is false
    if (window_ms > 0) {
                  ^
thruster.cpp:21:12: note: Uninitialized variable: percent
    return percent;
           ^
```

**clang-tidy 18** with the `bugprone-*`, `clang-analyzer-*`, `cppcoreguidelines-init-variables` and `cppcoreguidelines-narrowing-conversions` checks (only the warning lines shown; its explanatory notes and the full paths are trimmed):

```text
thruster.cpp:17:9: warning: variable 'percent' is not initialized [cppcoreguidelines-init-variables]
thruster.cpp:21:5: warning: Undefined or garbage value returned to caller [clang-analyzer-core.uninitialized.UndefReturn]
thruster.cpp:25:12: warning: narrowing conversion from 'int' to signed type 'std::int16_t' (aka 'short') is implementation-defined [bugprone-narrowing-conversions,cppcoreguidelines-narrowing-conversions]
```

**g++ 13.3** with `-Wall -Wextra -Wconversion -O2` also reports three things: the narrowing on line 25 (`-Wconversion`), the uninitialized `percent` (`-Wmaybe-uninitialized` and `-Wuninitialized`), and `iteration 8 invokes undefined behavior` on line 10.

Score it:

| Bug | cppcheck | clang-tidy (these checks) | g++ `-O2` warnings |
|---|---|---|---|
| Reads `on_ms[8]` | found | missed | found |
| `percent` uninitialized | found | found | found |
| `int` narrowed to 16 bits | missed | found | found |

Each tool missed something another caught. cppcheck skipped the narrowing, which it does not check at these settings. clang-tidy did not see the out-of-bounds read, because `std::array::operator[]` does no checking and none of the enabled checks looks for it. And g++ found the loop bug only because `-O2` inlined the function into `main` where the array size was visible — at `-O0` that warning disappears. That is the practical case for running several tools, at more than one setting, every day.
:::

## How a tool can prove something: abstract interpretation

Testing runs the program on some inputs. A sound analyzer instead runs it on *all* inputs at once, in a simplified form. **Abstract interpretation** replaces each variable's exact value with a description of every value it could have — for example an **[[interval|intervals]]**, written $[a, b]$ and read "from $a$ to $b$" — and pushes those descriptions through the code.

It is like a teacher checking a formula not with one student's numbers but with "any number between 0 and 100": if the answer is safe for the whole range, it is safe for every student.

Polyspace Code Prover works this way and colors each operation in the code:

- **green** — proven safe for every possible input;
- **red** — proven to fail every time it runs;
- **gray** — unreachable code, which never runs at all;
- **orange** — not proven either way: it might fail. An engineer must look at each orange by hand, and either fix the code or write down why it is safe.

::: example Proving a division is safe, by hand
A 12-bit sensor returns a signed value `raw`, somewhere in $[-2048, 2047]$ — the tool is told this range, because it cannot know what hardware will send. Trace three lines through as intervals:

```cpp
std::int32_t scaled = raw * 16;     // line A
int divisor = raw + 2049;           // line B
int ratio = 100000 / divisor;       // line C
```

**Line A.** Multiply both ends by 16: $-2048 \times 16 = -32768$ and $2047 \times 16 = 32752$. So `scaled` is in $[-32768, 32752]$. That fits in 32 bits with lots of room; it even fits the 16-bit range $[-32768, 32767]$, so a later cast to `std::int16_t` would also be green.

**Line B.** Add 2049 to both ends: $-2048 + 2049 = 1$ and $2047 + 2049 = 4096$. So `divisor` is in $[1, 4096]$.

**Line C.** Zero is not in $[1, 4096]$, so the division can never divide by zero: **green**, for every one of the $2^{12} = 4096$ possible inputs, with no test run. The result lies between $100000 / 4096 \approx 24.4$ (24 in integer division) and $100000 / 1 = 100000$.

Now change line B to `raw + 2048`. The interval becomes $[0, 4095]$, which contains zero. The division turns **orange**: the tool cannot rule out a crash. It happens only when `raw` is exactly $-2048$, one input in 4096 — the kind of case a test campaign easily never tries.

Sanity check on why proof beats testing here: with one 12-bit input you *could* test all 4096 values. With two 32-bit inputs there are $2^{64} \approx 1.8 \times 10^{19}$ combinations; at a billion tests per second that takes about 585 years. The interval argument above took three lines.
:::

::: key
What does a static analyser prove that tests cannot? Abstract-interpretation tools such as Polyspace Code Prover can prove the absence of certain run-time errors on all inputs, including paths no test exercises. Tests only demonstrate behaviour on the cases you thought of.
:::

::: warning
"Proven free of run-time errors" is a narrow promise. Code Prover checks things like division by zero, overflow, out-of-bounds access and null dereference. It says nothing about whether the requirements were right, whether the control law is stable, or whether the code meets its time budget. A perfectly green filter can still steer the vehicle the wrong way, if the requirement it implements was wrong.
:::

## Putting it together on a project

A typical flight-software pipeline runs the cheap tools constantly and the expensive ones deliberately:

1. Every build: the compiler at full warnings with `-Werror`, plus clang-tidy.
2. Every merge request: cppcheck and a MISRA checker such as Helix QAC, Polyspace Bug Finder or LDRA, with any new violation blocking the merge unless it has an approved deviation.
3. Before each release: a sound analysis with a tool like Polyspace Code Prover, with every orange reviewed and justified, and the results filed as certification evidence.

The coding standard says what the rules are; the deviation records say where and why the project broke them; the tools say where the code stands. Together they let a reviewer who has never met you trust code you wrote.

## Check yourself

::: check
In MISRA C++:2023, what is the difference between a mandatory, a required and an advisory guideline? For which one can a project write a deviation?
:::

::: answer
A **mandatory** guideline must always be followed; no deviation is permitted. A **required** guideline must be followed unless the project raises a formal deviation — a record of the rule, the location, the safety argument, and the reviewer's approval. An **advisory** guideline is recommended practice that the project may choose not to follow, ideally recording that choice. So deviations apply to required rules (advisory ones need no formal deviation, and mandatory ones cannot have one). A project may make a rule stricter, and may switch off an advisory rule, but may never weaken a required or mandatory one.
:::

::: check
Explain the difference between a sound analyzer and a bug finder in terms of false positives and false negatives. Which kind is clang-tidy, and which is Polyspace Code Prover?
:::

::: answer
A **sound** analyzer never misses a real error of the kinds it checks (no false negatives), but it may flag code that is actually fine (false positives), because when it cannot prove safety it must say "maybe". A **bug finder** tries to report only likely-real problems (few false positives), but can miss real ones (false negatives). clang-tidy is a bug finder and style checker; Polyspace Code Prover is sound, based on abstract interpretation.
:::

::: check
`int speed = sensor_mps();` where the tool knows the value lies in $[0, 300]$. Next, `int t = 1000 / (speed - 150);`. What color would an abstract-interpretation tool give the division, and why? How would you make it green?
:::

::: answer
`speed - 150` lies in $[0 - 150, 300 - 150] = [-150, 150]$. That interval contains 0, so the tool cannot rule out division by zero: **orange**. (It is not red, because most inputs are fine.)

To make it green, handle the zero case before dividing — for example, `const int d = speed - 150; if (d == 0) { /* handle */ } else { t = 1000 / d; }`. On the `else` path the tool knows `d` is not zero, and the division is proven safe.
:::

::: check
Where did JSF++ come from, and why would a new C++ flight project today normally choose MISRA C++:2023 instead?
:::

::: answer
JSF++ — the Joint Strike Fighter Air Vehicle C++ Coding Standards — was written by Lockheed Martin in 2005 for the F-35's flight software, with input from Bjarne Stroustrup, building on MISRA C. It targets C++ as it was then. MISRA C++:2023 covers C++17, absorbs the AUTOSAR C++14 guidelines for modern features, and is actively maintained, with tool support and a defined deviation and compliance process, so it largely supersedes JSF++ for new work.
:::

::: check
In a design review, a colleague proposes silencing a required MISRA rule for the whole `nav/` folder because "it only produces noise". What do you say?
:::

::: answer
Disabling the check for a folder hides every future violation of that rule there, including real ones, and leaves no record of why. Instead: look at the actual findings. If some are genuine, fix them. If the rest are safe for a specific, repeatable reason, write a deviation — or a deviation permit for that recurring pattern — stating the rule, the cases it covers, why they are safe, and any compensating check, and get it approved. That keeps the checker working for new code and gives an auditor the reasoning.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Coding standard | A safer subset of the language, mostly tool-checkable | Picks what the code may do |
| MISRA C++:2023 | Current unified C++ safety standard | Absorbs AUTOSAR C++14, largely supersedes JSF++; targets C++17 |
| Categories | Mandatory, required, advisory | Mandatory: never deviate; required: deviate only with approved record |
| Deviation | Documented, approved rule-break | Rule, location, rationale, compensating measures, approval |
| JSF++ (JSF AV C++) | Lockheed Martin's 2005 C++ rules | Written for the F-35 flight software |
| Sound analyzer | Never misses errors it checks for | May give false positives |
| Bug finder | Reports likely bugs | May miss real errors |
| Abstract interpretation | Pushes value ranges through code | Code Prover: green, red, gray, orange |
| Tools | clang-tidy, cppcheck, Polyspace, LDRA, Helix QAC | Run several; no single tool catches everything |

This completes the module. You now have the whole toolkit of flyable C++: bounded time and stack, static memory, careful interrupts, watchdogs and FDIR, radiation defenses, deterministic arithmetic, a cross-compiled build, and the rules and tools that check it all. The interview module that follows expects you to explain and defend exactly these choices at a whiteboard.

::: context undefined-behavior When the language makes no promise
For most code, the C++ standard says exactly what must happen. For undefined behavior it says nothing at all, and the compiler is allowed to assume it never occurs. That assumption lets optimizers delete checks or reorder work in ways that look impossible from the source. So a bug that was harmless at `-O0` can change behavior at `-O2`, or after a compiler upgrade, with no change to your code. Coding standards ban the constructs that lead there, because a test that passed yesterday proves nothing about them.
:::

::: context autosar The car industry's software partnership
AUTOSAR, short for AUTomotive Open System ARchitecture, is a partnership founded in 2003 by carmakers and their suppliers to standardize the software inside vehicles' electronic control units. When modern C++ started appearing in driver-assistance and self-driving systems, AUTOSAR wrote C++14 guidelines because MISRA's C++ rules still covered only the old language. Rather than keep two standards, the groups combined them into MISRA C++:2023.
:::

::: context stroustrup The language's creator on the team
Bjarne Stroustrup designed C++ at Bell Labs starting in 1979. His involvement gave the JSF rules unusual weight: they were not written by people who distrusted C++, but with its designer helping choose the safe subset. He still hosts a copy of the JSF++ document on his own website, and has pointed to it as an example of using C++ for hard real-time, safety-critical work.
:::

::: context rice Why no tool can be perfect
In 1953 the mathematician Henry Gordon Rice proved that any interesting question about what a program *does* — "can it ever divide by zero?", "does it always finish?" — cannot be answered exactly by a general algorithm for every possible program. So every analyzer approximates. A sound one approximates by saying "maybe" when unsure; a bug finder approximates by staying quiet when unsure. Flight-code rules help both kinds: simple, bounded code is the kind that tools can reason about precisely.
:::

::: context sound-vs-unsound Two ways to be wrong
Every warning either points at a real error or not, and every real error either gets a warning or not. That gives four boxes. A sound tool empties the "missed error" box, at the cost of some false alarms. A bug finder keeps the "false alarm" box small, at the cost of some misses. Neither can empty both boxes for every program.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="110" y="30" width="120" height="60" fill="#8fb8f0"/>
    <rect x="230" y="30" width="120" height="60" fill="#f2b880"/>
    <rect x="110" y="90" width="120" height="60" fill="#b4232c"/>
    <rect x="230" y="90" width="120" height="60" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="170" y="20">real error</text>
    <text x="290" y="20">no error</text>
    <text x="55" y="64">warning</text>
    <text x="55" y="124">no warning</text>
    <text x="170" y="64">caught</text>
    <text x="290" y="58">false positive</text>
    <text x="290" y="74">(sound tools)</text>
    <text x="170" y="118" fill="#ffffff">false negative</text>
    <text x="170" y="134" fill="#ffffff">(bug finders)</text>
    <text x="290" y="124">quiet, correct</text>
  </g>
</svg>
```
:::

::: context do-178c The rulebook for flight software certification
DO-178C, *Software Considerations in Airborne Systems and Equipment Certification*, is the document civil aviation authorities use to approve software on aircraft. It sets objectives by level, from A (a failure could be catastrophic) down to E (no safety effect), and asks for evidence: requirements traced to code, reviews, and test coverage — at level A, down to MC/DC, which shows each condition in a decision independently changes the outcome. Tools whose output replaces a human check must themselves be qualified.
:::

::: context intervals Checking a whole range at once
An interval stands for every number between two ends. Arithmetic on intervals works on the ends: adding a constant shifts both ends, multiplying by a positive number stretches them. If a dangerous value, like zero for a divisor, lies outside the interval, it can never occur — for any input.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="35" x2="100" y2="125" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="100" y="142" font-size="11" fill="#b4232c" text-anchor="middle">zero</text>
  <rect x="102" y="42" width="200" height="16" fill="#1d6fd1"/>
  <text x="202" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">raw + 2049: [1, 4096]  green</text>
  <rect x="100" y="102" width="200" height="16" fill="#f2b880" stroke="#1f2a44"/>
  <text x="202" y="92" font-size="11" fill="#1f2a44" text-anchor="middle">raw + 2048: [0, 4095]  orange</text>
</svg>
```
:::
