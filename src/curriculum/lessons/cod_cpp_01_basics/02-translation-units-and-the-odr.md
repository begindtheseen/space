---
id: l02-translation-units-and-the-odr
title: Translation units, headers and the one-definition rule
minutes: 20
covers:
  - Translation units, headers vs sources, include guards and pragma once
  - Declaration vs definition, the one-definition rule, inline, internal linkage
---

Python has a module system. `import telemetry` finds a file, executes it once, caches it, and hands you an object whose attributes you can reach. Do it again and nothing is re-executed. C++ has no such thing in the toolchains you will meet at work — C++20 added real modules, but compiler and build-system support is still uneven, and no flight project you join in the next few years will be built out of them. What C++ has instead is a preprocessor that pastes text, and a rule about how many times a thing may be defined.

That difference is the source of a specific family of build failures: the same file included twice, a function defined where it should have been declared, a constant that turns out to be three different constants. They are not mysterious once you know the rule, and the rule is short. This lesson states it, shows the errors it produces when you break it, and gives you the file layout that makes breaking it hard.

The examples build a small telemetry module across three files. Everything shown was produced by g++ 13.3.0 and clang++ 18.1.3 on x86-64 Linux.

## The translation unit is the compiler's whole world

A **translation unit** is one `.cpp` file after the preprocessor has finished with it: your code plus the full text of every header it included, directly or indirectly. That is the unit `cc1plus` compiles, and it is all the compiler ever sees at once. It knows nothing about your other source files. Anything it needs from them must be *declared* inside this translation unit, and the linker will match the declaration to a definition later.

Two consequences follow, and everything else in this lesson is a corollary of them.

- Every name used in a translation unit must be declared in that translation unit. That is what headers are for.
- The same definition pasted into two translation units means the linker sees two of them. That is what the one-definition rule is about.

## Declaration versus definition

A **declaration** introduces a name and its type so code can refer to it. A **definition** also supplies the entity: the function's body, the storage for the variable, the members of the class. A name may be declared as many times as you like; it must be defined exactly once.

| Code | Declaration? | Definition? |
| --- | --- | --- |
| `float mean_az(const ImuSample* s, std::size_t n);` | yes | no |
| `float mean_az(const ImuSample* s, std::size_t n) { ... }` | yes | yes |
| `extern int g_packet_count;` | yes | no |
| `int g_packet_count;` | yes | yes (of a variable) |
| `struct ImuSample;` | yes | no (an incomplete type) |
| `struct ImuSample { std::uint32_t t_ms; };` | yes | yes |
| `void arm_engine(int n);` inside a `.cpp` | yes | no |

Note the asymmetry with Python, where there is no such distinction: `def f(): ...` creates the function object then and there, and nothing exists until it runs. In C++ the declaration is the promise and the definition is the delivery, and they can be in different files compiled hours apart.

A declaration is enough to compile a call. The compiler needs to know the argument types and the return type to check the call and to emit the right instructions; it does not need the body. That is exactly why a header of declarations lets forty source files use a function whose body lives in one `.cpp`.

## The one-definition rule

The rule has two halves, and confusing them is the reason ODR errors feel arbitrary.

**Within one translation unit**, no entity may be defined twice. Include a header containing `struct ImuSample { ... }` twice into one `.cpp` and you get a compile error, because the translation unit now contains two definitions of that struct.

**Within one program**, every non-inline function and every variable with external linkage must be defined exactly once across all translation units. Put a function *body* in a header, include it from two `.cpp` files, and each object file contains a definition; the linker sees two and refuses.

There is a third clause, which the standard states and no linker checks: entities that are *allowed* to be defined in more than one translation unit — classes, inline functions, templates — must have definitions that are identical everywhere. If two source files disagree about what `struct ImuSample` contains, the program is ill-formed, no diagnostic is required, and you get a working build that produces nonsense. Lesson 03's Makefile exists largely to stop exactly this.

::: key
Declaration: introduces a name and its type. Definition: also provides the entity. A name may be declared many times and must be defined once per program. That is the one-definition rule.
:::

## Headers versus sources: what goes where

| Put in the header (`.hpp`) | Put in the source (`.cpp`) |
| --- | --- |
| function declarations | function definitions |
| class and struct definitions | member function bodies (unless small and `inline`) |
| `constexpr` and `inline constexpr` constants | anything with a side effect |
| `enum` and type aliases | file-local helpers, in an anonymous namespace |
| templates (definition and all) | the definition of a variable declared `extern` in the header |

Here is the telemetry module split that way. The header states what exists:

```cpp
// telem.hpp
#pragma once

#include <cstddef>
#include <cstdint>

// One inertial measurement, as the IMU driver hands it over.
struct ImuSample {
    std::uint32_t t_ms;  // time since boot, ms
    float ax, ay, az;    // specific force, m/s^2
};

// Mean of the z channel over n samples.
float mean_az(const ImuSample* s, std::size_t n);

// Sum-of-bytes checksum, the way the ground station recomputes it.
std::uint8_t checksum(const std::uint8_t* p, std::size_t n);
```

The source supplies it:

```cpp
// telem.cpp
#include "telem.hpp"

float mean_az(const ImuSample* s, std::size_t n) {
    if (n == 0) return 0.0F;
    float sum = 0.0F;
    for (std::size_t i = 0; i < n; ++i) sum += s[i].az;
    return sum / static_cast<float>(n);
}

std::uint8_t checksum(const std::uint8_t* p, std::size_t n) {
    std::uint8_t sum = 0;
    for (std::size_t i = 0; i < n; ++i) sum = static_cast<std::uint8_t>(sum + p[i]);
    return sum;
}
```

And a second source uses it:

```cpp
// main.cpp
#include "telem.hpp"

#include <cstdio>

int main() {
    const ImuSample buf[3] = {
        {100, 0.02F, -0.01F, -9.79F},
        {110, 0.03F, -0.02F, -9.83F},
        {120, 0.01F, -0.01F, -9.81F},
    };
    std::printf("mean az = %.4f m/s^2\n", mean_az(buf, 3));
    const std::uint8_t packet[4] = {0xA5, 0x10, 0x02, 0x7F};
    std::printf("checksum = %u\n", checksum(packet, 4));
    return 0;
}
```

Note that `telem.cpp` includes its own header. That is not redundant: it makes the compiler check the definitions against the declarations, so a signature that drifts is caught at compile time rather than at link time. Make it a habit.

::: example Two translation units, one program
Compile each source to an object file, then link. `-c` stops after the assembler, as lesson 01 showed.

```bash
g++ -std=c++20 -Wall -Wextra -Wpedantic -c telem.cpp -o telem.o
g++ -std=c++20 -Wall -Wextra -Wpedantic -c main.cpp -o main.o
g++ telem.o main.o -o telem_app
./telem_app
```

```text
mean az = -9.8100 m/s^2
checksum = 54
```

Check both numbers by hand. The mean of $-9.79$, $-9.83$ and $-9.81$ is $-29.43/3 = -9.81$. The checksum is $0\mathrm{xA5} + 0\mathrm{x10} + 0\mathrm{x02} + 0\mathrm{x7F} = 165 + 16 + 2 + 127 = 310$, and 310 modulo 256 is 54 — the `std::uint8_t` accumulator wraps, which for an unsigned type is defined behaviour, not a bug.

Now look at what each object file carries:

```bash
nm -C telem.o
nm -C main.o
```

```text
0000000000000000 T mean_az(ImuSample const*, unsigned long)
000000000000009f T checksum(unsigned char const*, unsigned long)
```

```text
                 U mean_az(ImuSample const*, unsigned long)
                 U checksum(unsigned char const*, unsigned long)
                 U __stack_chk_fail
0000000000000000 T main
                 U printf
```

`main.o` needs (`U`) exactly what `telem.o` provides (`T`). That pairing is the whole of linking. Notice also that `struct ImuSample` appears nowhere in either symbol table: a type is not a symbol. It exists only at compile time, which is why every translation unit that uses it needs the header, and why two translation units that disagree about it cannot be caught by the linker.
:::

## Include guards and `#pragma once`

A header that defines a type will eventually be included twice in one translation unit — not because you wrote `#include` twice, but because `filter.hpp` includes `sample.hpp` and your `.cpp` includes both. Without protection, the second inclusion pastes the definitions in again and the translation unit breaks the one-definition rule.

Here is the error, with `sample.hpp` left unguarded and included both directly and through `filter.hpp`. g++ 13.3.0:

```text
In file included from err/d/filter.hpp:2,
                 from err/d/main.cpp:2:
err/d/sample.hpp:4:8: error: redefinition of 'struct ImuSample'
    4 | struct ImuSample {
      |        ^~~~~~~~~
In file included from err/d/main.cpp:1:
err/d/sample.hpp:4:8: note: previous definition of 'struct ImuSample'
```

clang++ 18.1.3 on the same files:

```text
err/d/sample.hpp:4:8: error: redefinition of 'ImuSample'
err/d/main.cpp:1:10: note: 'err/d/sample.hpp' included multiple times, additional include site here
err/d/filter.hpp:2:10: note: 'err/d/sample.hpp' included multiple times, additional include site here
err/d/sample.hpp:4:8: note: unguarded header; consider using #ifdef guards or #pragma once
```

Both compilers report the same error at the same place. Only clang++ names the cause. This is a concrete case of the habit from lesson 01: when a diagnostic tells you what but not why, try the other compiler before you start guessing.

Two ways to prevent it. The classic **include guard** is standard C++ and works everywhere:

```cpp
#ifndef ORBIT_TELEM_SAMPLE_HPP
#define ORBIT_TELEM_SAMPLE_HPP

struct ImuSample { /* ... */ };

#endif  // ORBIT_TELEM_SAMPLE_HPP
```

The first inclusion defines the macro and the contents pass through; the second finds the macro defined and the preprocessor deletes everything between `#ifndef` and `#endif`. The macro name must be unique across the entire program including every library you link, which is why the convention is project, path and filename.

**`#pragma once`** is one line and says the same thing:

```cpp
#pragma once
```

It is not in the standard, but every compiler you will meet — g++, clang++, MSVC, Intel, and the vendor compilers on flight processors — implements it. It cannot collide with anything, so it removes a real class of bug: a copy-pasted header whose guard macro was not renamed silently suppresses the *second* header entirely, producing errors that point at completely innocent code. Its one weakness is that it identifies files by identity rather than by name, so a header reachable through two different paths (a copy, a hard link, a mount) may be included twice anyway. Both are acceptable; pick one per project and be consistent.

::: key
Without include guards or `#pragma once`, a header included twice in one translation unit redefines its types and inline entities, violating the one-definition rule. The guard makes the second inclusion a no-op.
:::

::: warning
A guard protects *within* a translation unit. It does nothing about a function body in a header being compiled into two different object files — the guard has no memory between compiler runs. That failure is a link error, and it is lesson 03's subject.
:::

## `inline`: permission, not a request

`inline` no longer means "please paste this function's body at the call site". Compilers make that decision on their own and ignore your opinion. What `inline` means today is a statement to the linker: *this entity may be defined in more than one translation unit, all the definitions are the same, keep one and discard the rest.*

That is what lets you put a small function in a header. Compile the two objects and look:

```text
0000000000000000 W clamp_throttle(float)
0000000000000000 T step(float)
```

```text
0000000000000000 W clamp_throttle(float)
0000000000000000 T main
```

`W` is a *weak* symbol. The same function is defined in both object files, both are marked weak, the linker keeps one and the program has exactly one `clamp_throttle`. Remove the `inline` keyword and both become `T`, the linker sees two strong definitions of one name, and the build fails.

The same keyword works for variables since C++17. `inline constexpr double kG0 = 9.80665;` in a header gives every translation unit the same constant, one object, one address.

## Internal linkage: `static` and anonymous namespaces

The opposite tool is to say that a name belongs to this translation unit alone. `static` at namespace scope — not inside a class, where it means something different — gives a name **internal linkage**: invisible to the linker, uncollidable, and *one copy per translation unit*.

That last part surprises people. Put this in a header:

```cpp
// counter.hpp
#pragma once

// static at namespace scope: internal linkage, one copy per translation unit.
static int calls = 0;
```

include it from `drive.cpp` and `main.cpp`, and each translation unit gets its own `calls`:

```cpp
// main.cpp
#include "counter.hpp"
#include <cstdio>

int drive_bump();

int main() {
    std::printf("drive_bump()  -> %d\n", drive_bump());
    std::printf("++calls here  -> %d\n", ++calls);
    std::printf("drive_bump()  -> %d\n", drive_bump());
    std::printf("calls in main -> %d\n", calls);
    return 0;
}
```

with `drive.cpp` containing only `int drive_bump() { return ++calls; }`:

```text
drive_bump()  -> 1
++calls here  -> 1
drive_bump()  -> 2
calls in main -> 1
```

Two counters, not one. The symbol tables say so: `nm -C` shows `b calls` — lowercase `b`, a local symbol in the bss section — in *both* object files. Nothing is wrong with the program; it is doing exactly what `static` asks for. It is simply not what someone writing a shared counter intended, which is why a mutable variable in a header is nearly always a mistake.

The modern spelling is an **anonymous namespace**, which gives internal linkage to anything, including types:

```cpp
namespace {
    constexpr int kMaxRetries = 3;
    bool is_stale(std::uint32_t t_ms, std::uint32_t now_ms) { return now_ms - t_ms > 100; }
}
```

Use it in a `.cpp` for helpers that nobody outside should see. It keeps the symbol out of the global namespace, so two engineers can each write an `is_stale` helper in their own file and the link still works.

::: key
`static` at file scope gives internal linkage: the entity is visible only in that translation unit and cannot collide with a same-named symbol elsewhere. An anonymous namespace is the modern, more general way to say the same thing.
:::

::: example The bug the linker cannot see
Two source files each define `struct ImuSample`, and someone has added a `temp_c` field to one of them:

```cpp
// a.cpp: version A
struct ImuSample { std::uint32_t t_ms; float ax, ay, az; };
// b.cpp: version B
struct ImuSample { std::uint32_t t_ms; float temp_c; float ax, ay, az; };
```

`a.cpp` builds an `ImuSample` and passes it to a function defined in `b.cpp`. Both files compile without a warning. The link succeeds — a type is not a symbol, so there is nothing for the linker to compare. With g++ 13.3.0 at `-O2` the program ran and printed

```text
t=100 ax=-0.01 az=-2292883456.00
```

That number is not a fact about C++; it is what one build did with one memory layout. The program is ill-formed and the standard requires no diagnostic, so another compiler, another optimisation level or another day could print anything at all. What it will never do is tell you it is broken.

There is one tool that catches it. Ask for link-time optimisation, which gives the compiler all translation units at once, and g++ compares the definitions:

```bash
g++ -std=c++20 -Wall -Wextra -O2 -flto a.cpp b.cpp -o app
```

```text
a.cpp:4:8: warning: type 'struct ImuSample' violates the C++ One Definition Rule [-Wodr]
b.cpp:4:8: note: a different type is defined in another translation unit
a.cpp:6:11: note: the first difference of corresponding definitions is field 'ax'
b.cpp:6:11: note: a field with different name is defined in another translation unit
```

Two conclusions for a flight-software build. Define each type exactly once, in a header, and include it everywhere — never retype a struct. And put an `-flto` build in continuous integration even if you ship without it, because `-Wodr` is the only thing that finds this class of defect.
:::

## Check yourself

::: check
`telem.cpp` starts with `#include "telem.hpp"`, the header of the very functions it defines. What does that buy you, given that the definitions do not need the declarations?
:::

::: answer
It makes the compiler check the definitions against the declarations inside one translation unit. If the header says `float mean_az(const ImuSample*, std::size_t)` and the source defines `float mean_az(ImuSample*, std::size_t)`, the two are different functions; without the include, both files compile happily and the mismatch surfaces later as an undefined reference from the linker, pointing at the *calling* file rather than at either of the two files that actually disagree. With the include, the definition and the declaration are in the same translation unit and the compiler can tell you immediately. It also proves the header is self-contained — that it compiles without needing something included before it.
:::

::: check
A header contains `#pragma once` and a function body that is not marked `inline`. Two source files include it. Does the guard prevent a problem? What happens?
:::

::: answer
No. `#pragma once` stops a second inclusion *within one translation unit*; it has no effect across separate compiler runs, which know nothing about one another. Each of the two translation units includes the header exactly once, each compiles the function body into its own object file, and each object file contains a strong definition of the same symbol. The compile succeeds twice and the link fails with a multiple-definition error. Marking the function `inline` fixes it, by making both definitions weak so the linker keeps one.
:::

::: check
You move `static int g_sequence = 0;` from `telem.cpp` into `telem.hpp` so that `main.cpp` can read it too. The build succeeds and the sequence number never advances in `main.cpp`. Why?
:::

::: answer
`static` at namespace scope means internal linkage, so the header does not share one variable — it gives each translation unit that includes it a private copy. `telem.cpp` increments its own `g_sequence`; `main.cpp` reads a different object that nothing ever touches. Nothing collides and nothing warns, because from the language's point of view these are two unrelated variables that happen to have the same spelling. To share one variable, declare it `extern` in the header and define it in exactly one `.cpp` — or, better in most cases, do not use a global at all and pass the state explicitly.
:::

::: check
Why does putting `struct ImuSample` in a header solve a problem that the linker could never have solved for you?
:::

::: answer
Because a type generates no symbol. Look at the `nm` output for `telem.o` and `main.o`: the functions appear, `ImuSample` does not. The type exists only during compilation, to decide the size of an object, the offsets of its members and which overload a call resolves to. Two translation units that hold different definitions of the type therefore produce object files the linker has no way to compare, and it links them without complaint. The header is what makes both translation units read the same text, which is the only mechanism the language offers to keep them in agreement.
:::

::: check
When would you write `inline constexpr double kMuEarth = 3.986004418e14;` in a header rather than `constexpr double kMuEarth = 3.986004418e14;`?
:::

::: answer
`constexpr` at namespace scope already implies `const`, and a `const` variable at namespace scope has internal linkage, so the plain version gives each including translation unit its own private copy of the constant. For a value that is only ever read, that costs nothing and is what most code does. `inline` makes it one entity with one address shared by the whole program, which matters if anything takes its address or binds a reference to it and you need those to compare equal across files, and it avoids many identical copies in a large program. For a scalar constant either is fine; for something larger, or anything whose identity matters, write `inline`.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Translation unit | one `.cpp` after preprocessing; everything the compiler sees at once |
| Declaration | introduces a name and its type; may appear many times |
| Definition | supplies the entity; exactly once per program |
| One-definition rule | once per translation unit for types; once per program for functions and variables; identical everywhere for entities allowed in several |
| Include guard | `#ifndef` / `#define` / `#endif`; standard, needs a globally unique macro |
| `#pragma once` | non-standard but universal; one line, cannot collide |
| `inline` | this entity may be defined in every translation unit; keep one (symbol `W`) |
| `static` at file scope | internal linkage: private to this translation unit, one copy each (symbol `b` or `t`) |
| Anonymous namespace | internal linkage for anything, including types |
| `-flto` with `-Wodr` | the only practical check that two files agree about a type |

Lesson 03 breaks this program on purpose: it removes a definition, duplicates another, and reads the two linker errors that result, then writes the Makefile that stops you from having to type these commands again.
