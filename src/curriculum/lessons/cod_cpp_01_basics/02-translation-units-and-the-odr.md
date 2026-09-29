---
id: l02-translation-units-and-the-odr
title: Translation units, headers and the one-definition rule
minutes: 22
covers:
  - Translation units, headers vs sources, include guards and pragma once
  - Declaration vs definition, the one-definition rule, inline, internal linkage
---

Picture a restaurant menu and a kitchen. The menu lists every dish, with a short description, so you can order. The kitchen is where each dish is actually made. You can print the menu a hundred times and hand a copy to every table. But if two kitchens both cook your order, you get two plates and one very confused waiter.

C++ splits code the same way. A **declaration** is the menu entry: it says a thing exists and what type it has. A **definition** is the kitchen: it actually supplies the thing. You may print as many menus as you like. There must be exactly one kitchen per dish.

Python works differently. `import telemetry` finds a file, runs it once, remembers it, and hands you an object. Import it again and nothing runs twice. C++ has no such system in the toolchains you will meet at work — C++20 added real **[[modules|cpp20-modules]]**, but support is still patchy, and flight projects are not built from them yet. What C++ has instead is a preprocessor that pastes text, and a rule about how many times a thing may be defined. This lesson states the rule, shows the errors you get when you break it, and gives you the file layout that makes breaking it hard. The examples build a small telemetry module across three files, and every output shown came from g++ 13.3.0 and clang++ 18.1.3 on x86-64 Linux.

## The translation unit is the compiler's whole world

A **[[translation unit|translation-unit]]** is one `.cpp` file after the preprocessor has finished with it: your code plus the full text of every header it included, directly or through other headers. That is what `cc1plus` compiles, and it is *all* the compiler ever sees at once. It knows nothing about your other source files. Anything it needs from them must be declared inside this translation unit, and the linker matches that declaration to a definition later.

Two consequences follow. Everything else in this lesson grows out of them.

- Every name used in a translation unit must be declared in that translation unit. That is what headers are for.
- The same definition pasted into two translation units means the linker sees two of them. That is what the one-definition rule is about.

## Declaration versus definition

A declaration introduces a name and its type, so code can refer to it. A definition also provides the entity itself: the function's body, the memory for the variable, the members of the class.

| Code | Declaration? | Definition? |
| --- | --- | --- |
| `float mean_az(const ImuSample* s, std::size_t n);` | yes | no |
| `float mean_az(const ImuSample* s, std::size_t n) { ... }` | yes | yes |
| `extern int g_packet_count;` | yes | no |
| `int g_packet_count;` | yes | yes (of a variable) |
| `struct ImuSample;` | yes | no (an incomplete type) |
| `struct ImuSample { std::uint32_t t_ms; };` | yes | yes |
| `void arm_engine(int n);` inside a `.cpp` | yes | no |

Two rows need a word. `extern` means "this variable exists, but its memory is somewhere else". And `struct ImuSample;` with no braces makes an **[[incomplete type|incomplete-type]]**: the compiler knows the name, but not the size or the members yet.

In C++ the declaration is the promise and the definition is the delivery, and they can sit in different files compiled hours apart.

A declaration is enough to compile a call. To check a call and write the right instructions, the compiler needs the argument types and the return type. It does not need the body. That is exactly why one header of declarations lets forty source files use a function whose body lives in a single `.cpp`.

::: key
Declaration versus definition: a declaration introduces a name and its type so code can refer to it; a definition also provides the entity (function body, storage for a variable). A name may be declared many times but defined once per program, which is the one-definition rule.
:::

## The one-definition rule

The **one-definition rule**, or **ODR**, has two halves. Mixing them up is why ODR errors feel random.

**Inside one translation unit**, nothing may be defined twice. Include a header containing `struct ImuSample { ... }` twice into one `.cpp`, and the compiler stops with an error, because this translation unit now holds two definitions of the struct.

**Across the whole program**, every function that is not marked `inline`, and every variable the linker can see, must be defined exactly once. Put a function *body* in a header, include that header from two `.cpp` files, and each object file carries a definition. The linker sees two and refuses.

There is a third clause, which the standard states and no linker checks. Some things *may* be defined in more than one translation unit — classes, `inline` functions, templates. Their definitions must be identical everywhere. If two source files disagree about what `struct ImuSample` contains, the program is **[[ill-formed, no diagnostic required|ifndr]]**. You get a build that works and a program that prints nonsense. This lesson's last example shows it happening, and lesson 03's Makefile exists largely to stop it.

## Headers versus sources: what goes where

| Put in the header (`.hpp`) | Put in the source (`.cpp`) |
| --- | --- |
| function declarations | function definitions |
| class and struct definitions | member function bodies (unless small and `inline`) |
| `constexpr` and `inline constexpr` constants | anything that does work when the program starts |
| `enum` and type aliases | file-local helpers, in an anonymous namespace |
| templates (definition and all) | the definition of a variable declared `extern` in the header |

Here is the telemetry module split that way. The header is the menu — it says what exists:

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

`ImuSample` is one reading from an **[[IMU|imu]]**, the sensor that measures how the vehicle is being pushed and turned. The source file is the kitchen — it supplies the bodies:

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

```cpp fragment
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

Notice that `telem.cpp` includes its own header. That is not wasted. It puts each declaration and its definition in the same translation unit, so the compiler can compare them. If the two disagree in a way the language forbids — say the header promises a `float` result and the source returns a `double` — you get a compile error on the spot instead of a mystery later. It also proves the header works on its own, without needing something else included first. Make it a habit.

::: warning
Including the header does *not* catch every drift. If the source defines `mean_az(ImuSample* s, std::size_t n)` — one `const` gone — that is a different, legal function (an **overload**), and it compiles without a word. Only the link fails. Add `-Wmissing-declarations` to your g++ flags and it warns "no previous declaration for 'float mean_az(ImuSample*, std::size_t)'", which points straight at the typo. Lesson 03 reads the link error this produces.
:::

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

Check both numbers by hand. The mean of $-9.79$, $-9.83$ and $-9.81$ is

$$
\frac{-9.79 - 9.83 - 9.81}{3} = \frac{-29.43}{3} = -9.81.
$$

That is one standard gravity, which is what an IMU sitting still should read. For the checksum, add the four bytes, written in hexadecimal (base 16, marked `0x`):

$$
\mathrm{A5}_{16} + 10_{16} + 02_{16} + \mathrm{7F}_{16} = 165 + 16 + 2 + 127 = 310.
$$

A `std::uint8_t` holds only 0 to 255, so the running sum wraps around: $310 - 256 = 54$. For an unsigned type that wrapping is defined behavior, not a bug.

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

`main.o` needs (`U`) exactly what `telem.o` supplies (`T`). That pairing is the whole of linking. Notice also that `ImuSample` appears nowhere in either table. A type is not a symbol. It exists only while compiling, which is why every translation unit that uses it needs the header — and why the linker cannot catch two files that disagree about it.
:::

## Include guards and `#pragma once`

A header that defines a type will sooner or later be included twice in one translation unit. Usually not because you typed `#include` twice, but because `filter.hpp` includes `sample.hpp`, and your `.cpp` includes both. Without protection, the second inclusion pastes the struct in again, and the translation unit breaks the one-definition rule. The **[[include graph|include-graph]]** has a diamond in it.

Here is the error, with `sample.hpp` left unprotected and included both directly and through `filter.hpp`. First g++ 13.3.0:

```text
In file included from filter.hpp:2,
                 from main.cpp:2:
sample.hpp:4:8: error: redefinition of 'struct ImuSample'
    4 | struct ImuSample {
      |        ^~~~~~~~~
In file included from main.cpp:1:
sample.hpp:4:8: note: previous definition of 'struct ImuSample'
```

Then clang++ 18.1.3 on the same files:

```text
./sample.hpp:4:8: error: redefinition of 'ImuSample'
main.cpp:1:10: note: './sample.hpp' included multiple times, additional include site here
./filter.hpp:2:10: note: './sample.hpp' included multiple times, additional include site here
./sample.hpp:4:8: note: unguarded header; consider using #ifdef guards or #pragma once
```

Same error, same spot — but only clang++ names the cause. When a message says *what* but not *why*, try the other compiler.

There are two ways to prevent it. The classic **include guard** is standard C++ and works everywhere:

```cpp
#ifndef ORBIT_TELEM_SAMPLE_HPP
#define ORBIT_TELEM_SAMPLE_HPP

struct ImuSample { /* ... */ };

#endif  // ORBIT_TELEM_SAMPLE_HPP
```

Read `#ifndef` as "if not defined". Walk through it:

1. The first time, `ORBIT_TELEM_SAMPLE_HPP` is not defined. So the text passes through, and `#define` defines the name.
2. The second time, the name is defined. So the preprocessor deletes everything between `#ifndef` and `#endif`.

The macro name must be unique across the whole program, every library included. That is why the convention builds it from the project, the path and the file name.

**`#pragma once`** says the same thing in one line:

```cpp
#pragma once
```

A **pragma** is an instruction to the compiler outside the standard language. This one is not in the standard, but every compiler you will meet — g++, clang++, MSVC, and the vendor compilers for flight processors — supports it. It cannot collide with anything, which removes a real bug: copy a header, forget to rename its guard macro, and the second header silently vanishes. Its one weakness: it recognizes files by identity, not name, so a header reachable by two paths (a copy, a link) may still be included twice. Both approaches are fine. Pick one per project.

::: key
Why does a header need include guards or pragma once? Without them, a header included twice in one translation unit redefines its types and inline entities, violating the one-definition rule. The guard makes the second inclusion a no-op.
:::

::: warning
A guard protects *within* one translation unit. It does nothing about a function body in a header being compiled into two different object files, because the guard has no memory between separate compiler runs. That failure is a link error, and it is lesson 03's subject.
:::

## `inline`: permission, not a request

`inline` used to mean "please paste this function's body wherever it is called". Compilers now make that choice themselves and ignore your opinion. What `inline` means today is a message to the linker: *this may be defined in more than one translation unit; all the definitions are the same; keep one and throw the rest away.*

That is what lets you put a small function in a header. Here `limits.hpp` holds `inline float clamp_throttle(float cmd)`, which limits a throttle command to between 0 and 1, and both `control.cpp` and `main.cpp` include it. Compile the two and look:

```text
0000000000000000 W clamp_throttle(float)
0000000000000000 T step(float)
```

```text
0000000000000000 W clamp_throttle(float)
                 U step(float)
0000000000000000 T main
                 U printf
```

`W` is a **[[weak symbol|weak-symbol]]**. The same function is defined in both object files, both copies are marked weak, the linker keeps one, and the program has exactly one `clamp_throttle`. Delete the word `inline` and both become `T`. The linker then sees two ordinary ("strong") definitions of one name, and the build fails.

The same keyword works on variables since C++17. `inline constexpr double kG0 = 9.80665;` in a header gives every translation unit the same constant: one object, one address.

## Internal linkage: `static` and anonymous namespaces

The opposite tool says: this name belongs to this translation unit alone. **Linkage** is whether the linker can see a name across files. `static` at file scope — outside any function or class, where it means something else — gives a name **internal linkage**. The linker cannot see it, it cannot collide with anything, and there is *one copy per translation unit*.

That last part surprises people. Put this in a header:

```cpp
// counter.hpp
#pragma once

// static at namespace scope: internal linkage, one copy per translation unit.
static int calls = 0;
```

Include it from `drive.cpp` and from `main.cpp`, and each translation unit gets its own `calls`:

```cpp fragment
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

`drive.cpp` contains only `int drive_bump() { return ++calls; }`. (Read `++calls` as "add one to calls, then use the new value".) The output:

```text
drive_bump()  -> 1
++calls here  -> 1
drive_bump()  -> 2
calls in main -> 1
```

Follow it line by line. `drive_bump` bumps *its* `calls` from 0 to 1. `main` bumps *its own* `calls` from 0 to 1. `drive_bump` bumps its copy again, to 2. `main`'s copy is still 1. Two counters, not one. `nm -C` agrees: it shows `b calls` — lowercase, so local, in the **[[bss|bss]]** section — in *both* object files. The program does exactly what `static` asks for — just not what someone wanting a shared counter meant. That is why a changeable variable in a header is nearly always a mistake.

The modern spelling is an **anonymous namespace** — a `namespace` block with no name — which gives internal linkage to anything, types included:

```cpp
namespace {
    constexpr int kMaxRetries = 3;
    bool is_stale(std::uint32_t t_ms, std::uint32_t now_ms) { return now_ms - t_ms > 100; }
}
```

Use it in a `.cpp` for helpers nobody outside should see. Then two engineers can each write an `is_stale` helper, and the link still works.

::: key
What does static at file scope do? It gives the entity internal linkage, so it is visible only within that translation unit and cannot collide with a same-named symbol elsewhere. An anonymous namespace is the modern, more general way to say the same thing.
:::

::: example The bug the linker cannot see
Two source files each define their own `struct ImuSample`, and someone has added a `temp_c` field to one of them:

```cpp
// a.cpp: version A
#include <cstdint>

struct ImuSample { std::uint32_t t_ms; float ax, ay, az; };

void print_sample(const ImuSample& s);

int main() {
    ImuSample s{100, -0.01F, 0.02F, -9.81F};
    print_sample(s);
    return 0;
}
```

```cpp
// b.cpp: version B
#include <cstdint>
#include <cstdio>

struct ImuSample { std::uint32_t t_ms; float temp_c; float ax, ay, az; };

void print_sample(const ImuSample& s) {
    std::printf("t=%u ax=%.2f az=%.2f\n", s.t_ms, s.ax, s.az);
}
```

`a.cpp` builds a sample with `ax = -0.01` and `az = -9.81` and passes it to `print_sample` in `b.cpp`. Build with `g++ -std=c++20 -Wall -Wextra a.cpp b.cpp -o app`: no warnings, and the link succeeds, because a type is not a symbol and the linker has nothing to compare. Then run the same program four times:

```text
t=100 ax=0.02 az=0.00
t=100 ax=0.02 az=0.00
t=100 ax=0.02 az=0.00
t=100 ax=0.02 az=-128435624498188779520.00
```

Work out why, field by field. Each field is 4 bytes.

1. `t_ms` sits at byte 0 in both versions, so `t=100` is right.
2. `b.cpp` thinks `ax` is at byte 8, after `temp_c`. In version A, byte 8 holds `ay`, which is `0.02`. So it prints `ay` and calls it `ax`.
3. `b.cpp` thinks `az` is at byte 16. Version A's object is only 16 bytes long (bytes 0 to 15). So `az` reads memory *past the end* of the object — whatever happens to be there, different on different runs of the same program.

None of those numbers is a fact about C++. The program breaks the rule, no diagnostic is required, and you see whatever this run's memory held. What it will never do is tell you it is broken.

One tool does catch it. Ask for **[[link-time optimization|lto]]**, which hands the compiler every translation unit at once, and g++ compares the definitions:

```bash
g++ -std=c++20 -Wall -Wextra -O2 -flto a.cpp b.cpp -o app
```

```text
a.cpp:4:8: warning: type 'struct ImuSample' violates the C++ One Definition Rule [-Wodr]
b.cpp:5:8: note: a different type is defined in another translation unit
a.cpp:4:46: note: the first difference of corresponding definitions is field 'ax'
b.cpp:5:46: note: a field with different name is defined in another translation unit
```

Two lessons follow. Define each type once, in a header, and include it everywhere — never retype a struct. And put an `-flto` build in your automated checks even if you ship without it, because `-Wodr` is the practical way to find this defect.
:::

## Check yourself

::: check
`telem.cpp` starts with `#include "telem.hpp"`, the header for the very functions it defines. The definitions do not need those declarations to compile. So what does the include buy you — and what does it *not* catch?
:::

::: answer
It puts every declaration and its definition in one translation unit, so the compiler can compare them. A definition that conflicts with its declaration — the same parameters but a different return type, or a definition written as `gnc::f` that does not match anything declared in `namespace gnc` — becomes a compile error pointing at the right file. It also proves the header compiles on its own.

What it does not catch is a changed parameter list. `float mean_az(ImuSample*, std::size_t)` next to a declared `float mean_az(const ImuSample*, std::size_t)` is simply a second overload, which is legal, so the file compiles. The mismatch surfaces at link time as an undefined reference from the *calling* file. `-Wmissing-declarations` closes that gap by warning about any non-static function defined without an earlier declaration.
:::

::: check
A header contains `#pragma once` and a function body that is not marked `inline`. Two source files include it. Does `#pragma once` prevent a problem? What happens?
:::

::: answer
No. `#pragma once` stops a second inclusion *within one translation unit*. Separate compiler runs know nothing about each other, so it has no effect across them.

Each translation unit includes the header exactly once and compiles the function body into its own object file. Each object file now holds a strong `T` definition of the same symbol. Both compiles succeed, and the link fails with a multiple-definition error. Marking the function `inline` fixes it: both definitions become weak, and the linker keeps one.
:::

::: check
You move `static int g_sequence = 0;` from `telem.cpp` into `telem.hpp` so that `main.cpp` can read it too. The build succeeds, but the sequence number never changes in `main.cpp`. Why?
:::

::: answer
`static` at file scope means internal linkage. So the header does not share one variable — it gives each translation unit that includes it a private copy. `telem.cpp` increases its own `g_sequence`, while `main.cpp` reads a different object that nothing ever touches.

Nothing collides and nothing warns: to the language these are two unrelated variables. To share one variable, declare it `extern int g_sequence;` in the header and define it in exactly one `.cpp`. Better still, in most cases, avoid the global and pass the value explicitly.
:::

::: check
Why does putting `struct ImuSample` in one header solve a problem the linker could never solve for you?
:::

::: answer
Because a type produces no symbol. In the `nm` output for `telem.o` and `main.o`, the functions appear but `ImuSample` does not. The type exists only during compiling, to decide an object's size, where each member sits, and which overload a call picks.

So two translation units holding different definitions of the type produce object files the linker cannot compare, and it links them without complaint. A single header makes both translation units read the same text, which is the only way the language offers to keep them in agreement.
:::

::: check
When would you write `inline constexpr double kMuEarth = 3.986004418e14;` in a header rather than `constexpr double kMuEarth = 3.986004418e14;`? (`kMuEarth` is Earth's gravitational parameter, $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.)
:::

::: answer
`constexpr` at file scope already implies `const`, and a `const` variable at file scope has internal linkage. So the plain version gives each including translation unit its own private copy. For a value that is only ever read, that costs nothing, and it is what most code does.

`inline` makes it one entity with one address shared by the whole program. That matters if anything takes its address or binds a reference to it and needs those to compare equal across files, and it avoids many identical copies in a large program. For a single number either is fine. For something larger, or anything whose identity matters, write `inline`.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Translation unit | one `.cpp` after preprocessing; everything the compiler sees at once |
| Declaration | introduces a name and its type; may appear many times |
| Definition | supplies the entity; exactly once per program |
| One-definition rule | once per translation unit for types; once per program for functions and variables; identical everywhere for things allowed in several |
| Include guard | `#ifndef` / `#define` / `#endif`; standard, needs a globally unique macro name |
| `#pragma once` | not in the standard but supported everywhere; one line, cannot collide |
| `inline` | may be defined in every translation unit; linker keeps one (symbol `W`) |
| `static` at file scope | internal linkage: private to this translation unit, one copy each (symbol `b` or `t`) |
| Anonymous namespace | internal linkage for anything, including types |
| `-Wmissing-declarations` | warns when a function is defined with no earlier declaration |
| `-flto` with `-Wodr` | the practical check that two files agree about a type |

Lesson 03 breaks this program on purpose. It removes a definition, duplicates another, reads the two linker errors that result, and then writes the Makefile that saves you from typing these commands ever again.

::: context cpp20-modules Real modules, arriving slowly
C++20 added **modules**: a file starts with `export module telem;`, and users write `import telem;`. The compiler reads the module once and saves a compact summary, much closer to Python's `import` than to pasting text. Modules remove the repeated header parsing and the macro leaks. The catch is tooling. Build systems must discover which module each file needs before compiling anything, and compilers, CMake and code analyzers only reached workable support in the last few years. Safety-critical projects also move slowly on purpose, so expect headers for a long while yet.
:::

::: context translation-unit What the compiler actually receives
The preprocessor turns one `.cpp` and everything it pulls in into a single stream. That stream, not the file you wrote, is the translation unit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="14" width="96" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="58" y="31">main.cpp</text>
    <rect x="10" y="62" width="96" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="58" y="79">telem.hpp</text>
    <rect x="10" y="110" width="96" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="58" y="127">cstdio + others</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="106" y1="27" x2="190" y2="70"/>
    <line x1="106" y1="75" x2="190" y2="75"/>
    <line x1="106" y1="123" x2="190" y2="80"/>
  </g>
  <rect x="196" y="20" width="150" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44">
    <text x="206" y="40">one translation unit</text>
    <text x="206" y="62">cstdio text</text>
    <text x="206" y="80">ImuSample, mean_az,</text>
    <text x="206" y="96">checksum declared</text>
    <text x="206" y="116">main's own code</text>
  </g>
  <text x="196" y="150" font-size="11" fill="#6c7a93">this is all cc1plus ever sees</text>
</svg>
```

`telem.cpp` becomes a second, separate translation unit, compiled in its own run.
:::

::: context incomplete-type Knowing a name without knowing its size
After `struct ImuSample;` the compiler knows `ImuSample` is a type, but not how big it is or what is inside. You may still declare pointers and references to it, because a pointer is the same size whatever it points to. You may not create one: `ImuSample s;` fails with "aggregate 'ImuSample s' has incomplete type and cannot be defined", because the compiler cannot reserve memory of unknown size. This trick, a **forward declaration**, lets a header mention a type without including that type's header, which keeps headers thin and builds fast.
:::

::: context ifndr No diagnostic required
The C++ standard sorts broken programs into kinds. Most rule-breaking must be reported: the compiler has to print an error. But for a few rules, checking would be too expensive or impossible with separate compilation, so the standard says the program is "ill-formed, no diagnostic required". That means it is wrong, yet the tools are allowed to say nothing and produce a program anyway, with no promise about what it does. The ODR clause about identical definitions is the classic case: checking it would need every translation unit at once, which ordinary compiling never has.
:::

::: context imu Inertial measurement unit
An **IMU** holds three accelerometers and three gyroscopes, one per axis. The accelerometers measure **specific force**: every push on the vehicle except gravity. So an IMU sitting still on the launch pad does not read zero. It feels the pad pushing up, about $9.81\,\mathrm{m/s^2}$. With the z axis pointing down, as in many vehicle frames, that shows up as $a_z \approx -9.81\,\mathrm{m/s^2}$ — the values in this lesson's buffer. Flight software reads an IMU hundreds of times a second, and the guidance, navigation and control modules later in the course are built on these numbers.
:::

::: context include-graph The diamond that needs a guard
Draw each `#include` as an arrow. When two paths lead to the same header, it gets pasted twice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="130" y="10" width="100" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="180" y="27">main.cpp</text>
    <rect x="230" y="70" width="100" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="280" y="87">filter.hpp</text>
    <rect x="130" y="130" width="100" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
    <text x="180" y="147">sample.hpp</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="170" y1="36" x2="170" y2="122"/>
    <line x1="210" y1="36" x2="262" y2="64"/>
    <line x1="262" y1="96" x2="210" y2="124"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="170,130 166,121 174,121"/>
    <polygon points="268,68 258,67 262,60"/>
    <polygon points="204,128 208,119 214,126"/>
  </g>
  <g font-size="11" fill="#b4232c">
    <text x="20" y="80">include #1</text>
    <text x="20" y="96">(line 1 of main)</text>
    <text x="262" y="124">include #2</text>
  </g>
</svg>
```

A guard or `#pragma once` in `sample.hpp` makes the second arrow paste nothing.
:::

::: context weak-symbol Keep one, drop the rest
A strong definition says "this is *the* definition". A weak one says "this is *a* definition; use it if nothing better turns up". When several identical weak copies of `clamp_throttle` arrive, the linker keeps the first and throws the others away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="14" width="140" height="40" fill="#fff" stroke="#1f2a44"/>
    <text x="18" y="30">control.o</text>
    <text x="18" y="46">W clamp_throttle</text>
    <rect x="10" y="80" width="140" height="40" fill="#fff" stroke="#1f2a44"/>
    <text x="18" y="96">main.o</text>
    <text x="18" y="112">W clamp_throttle</text>
    <rect x="220" y="46" width="130" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="228" y="62">program</text>
    <text x="228" y="78">one clamp_throttle</text>
  </g>
  <line x1="150" y1="34" x2="214" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,65 210,64 213,57" fill="#1d6fd1"/>
  <line x1="150" y1="100" x2="190" y2="84" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="160" y="126" font-size="11" fill="#b4232c">discarded</text>
</svg>
```

C++ compilers actually place each inline function in its own small group of sections (a "COMDAT" group), so the unused copy's machine code is dropped too, not only its name.
:::

::: context bss Where zero-filled variables live
The **bss** section holds variables that start at zero. The file does not store their bytes — only how much room they need — and the operating system hands over zeroed memory when the program starts. That keeps executables small. The name is old: it comes from an assembler instruction on 1950s IBM computers, "Block Started by Symbol". Variables with a nonzero starting value, like `int x = 256;`, go in the `.data` section instead, which is why `nm` shows them with a `D` (or `d` when local).
:::

::: context lto Letting the compiler see everything
Normally each translation unit is compiled alone, and the linker only glues machine code together. With `-flto` the compiler writes its internal form of the code into each object file instead of finished machine code. At link time it loads all of them together and optimizes across files — inlining a function from `telem.cpp` into `main.cpp`, say. Because it now holds every definition of every type at once, it can also compare them, and that is where `-Wodr` comes from. The price is slower, more memory-hungry links.
:::
