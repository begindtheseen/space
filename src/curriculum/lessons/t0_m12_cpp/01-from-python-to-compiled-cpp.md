---
id: l01-from-python-to-compiled-cpp
title: From Python to compiled C++
minutes: 21
covers:
  - C++17/20 core language
---

Every GNC algorithm you have written so far ran in Python: a NumPy propagator, a SciPy fit, a notebook plot. None of it will fly. The computer that closes the loop on a launch vehicle runs compiled code inside a fixed memory budget, with a hard deadline every few milliseconds, and in modern flight software that code is C++. The Python you know does not go away — it becomes the analysis layer that drives the C++ core, runs the Monte Carlo and draws the plots — but the core itself is compiled, statically typed and allocation-free.

This module teaches you to write that core. This first lesson covers the language you need before any of the flight-specific material makes sense: how a C++ program is built, how its types behave, how control flow and functions differ from Python, and which parts of C++17 and C++20 you will lean on. Compile every example yourself. Whenever you catch yourself thinking "Python did this for me", that is the right reaction: C++ makes you state what Python guessed, and flight software wants that explicitness, because anything the language guesses is something a reviewer cannot check.

## Why flight software is written in C++

Three properties matter on a flight computer. **Determinism**: the same inputs must produce the same outputs in the same amount of time, cycle after cycle, so that a scheduler can prove every task meets its deadline. **Bounded resources**: memory is sized at boot and never grows, and there is no garbage collector that may pause the program at an inconvenient moment. **Direct hardware access**: sensor registers, DMA buffers and timers are addresses in memory, and the language must be able to read and write them.

C gives you all three and is still what you find in bootloaders and drivers. C++ gives you the same three plus the abstractions — classes, templates, a standard library — that keep a large GNC codebase readable and testable, and a mature toolchain (CMake, GoogleTest, sanitizers, clang-tidy, pybind11) that this module teaches. Python decides types at run time, allocates on almost every operation and stops the world when its garbage collector runs: fine for analysis, unacceptable in a 400 Hz control loop. You will keep both languages; the last lesson binds them together.

## The compiled model

### From source to executable

A Python program is text that an interpreter reads while the program runs. A C++ program passes through three tools before it runs at all.

1. The **preprocessor** handles lines beginning with `#`. `#include` pastes the text of a header file into yours; `#define` substitutes macros. Flight coding standards minimise preprocessor use, so you will write little beyond `#include` and `#pragma once`.
2. The **compiler** turns each source file — each *translation unit* — into an object file of machine code, checking every type on the way. Errors at this stage are compile errors, and you fix them before anything runs.
3. The **linker** combines object files and libraries into one executable, resolving every function call to an address. An "undefined reference" error is the linker telling you that something was declared but never defined anywhere it can see.

Two consequences shape how you work. The compiler sees one translation unit at a time, so anything used from two files must be *declared* in a header that both include and *defined* in exactly one place. And a large class of mistakes — wrong argument types, misspelled names, a missing return — is caught before the program exists. Python finds the same mistakes only when the offending line executes, which for a rarely taken abort branch may be never.

### Compiling and running

Every program has one `main` function, which the operating system calls first; returning `0` means success. Build and run a single-file program like this:

```text
$ g++ -std=c++20 -Wall -Wextra -O2 orbit.cpp -o orbit
$ ./orbit
```

`-std=c++20` selects the language version. `-Wall -Wextra` turn on the warnings a professional build always uses; flight projects add `-Werror` so that a warning stops the build, which is one of the Power of Ten rules you will meet in lesson 9. `-O2` asks for optimisation; use `-O0 -g` while debugging so that the machine code follows your source line by line. `-o` names the output.

::: example Circular orbital speed, compiled
A first complete program. It computes the speed and period of a circular orbit at 400 km altitude, using $v = \sqrt{\mu / r}$ and $T = 2\pi\sqrt{r^3/\mu}$ with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

```cpp
#include <cmath>
#include <format>
#include <iostream>

// Physical constants: SI units throughout.
constexpr double kMuEarth = 3.986004418e14;  // m^3/s^2
constexpr double kEarthRadius = 6378.137e3;  // m

double circular_speed(double radius_m) {
  return std::sqrt(kMuEarth / radius_m);
}

double orbital_period(double radius_m) {
  const double pi = 3.14159265358979323846;
  return 2.0 * pi * std::sqrt(radius_m * radius_m * radius_m / kMuEarth);
}

int main() {
  const double altitude_m = 400.0e3;
  const double r = kEarthRadius + altitude_m;
  const double v = circular_speed(r);
  const double period_s = orbital_period(r);

  std::cout << std::format("r = {:.1f} m\n", r);
  std::cout << std::format("v = {:.1f} m/s\n", v);
  std::cout << std::format("T = {:.1f} s = {:.2f} min\n", period_s, period_s / 60.0);
  return 0;
}
// Output:
// r = 6778137.0 m
// v = 7668.6 m/s
// T = 5553.6 s = 92.56 min
```

The `#include` lines bring in the maths library, C++20's `std::format` (which works like a Python f-string) and the output stream. `constexpr double` declares a constant the compiler knows at compile time. Each function states the type of every parameter and of its result; there is no way to call `circular_speed` with a string. `std::` is the namespace of the standard library — the equivalent of an `import` prefix, resolved at compile time.
:::

## Types are static and sized

In Python you can write `x = 3` and later `x = "three"`. In C++ a variable has one type for its whole life, fixed when the program is compiled, and that type has a size in bytes that you can query with `sizeof`. The fundamental types are:

| Type | Typical size | Meaning |
| --- | --- | --- |
| `bool` | 1 byte | `true` or `false` |
| `char` | 1 byte | one byte of text or raw data |
| `int` | 4 bytes | signed integer, at least 16 bits guaranteed |
| `long` | 8 bytes on Linux, 4 on Windows | wider signed integer |
| `float` | 4 bytes | IEEE single precision, about 7 significant digits |
| `double` | 8 bytes | IEEE double precision, about 16 significant digits |

The standard guarantees only minimum sizes for `int` and `long`. That is unacceptable for anything that crosses a wire or a register, so flight code uses the fixed-width types from the `cstdint` header: `std::int8_t`, `std::uint8_t`, `std::int16_t`, `std::uint16_t`, `std::int32_t`, `std::uint32_t`, `std::int64_t` and `std::uint64_t`. A telemetry packet declared with these has the same layout on your laptop and on the flight processor. For sizes and indices the standard library uses `std::size_t`, an unsigned type wide enough to hold any object size.

### Integer arithmetic

Integer division truncates toward zero, and the sign of `%` follows the dividend. Python's `//` floors instead, so `-7 // 2` is `-4` in Python but `-7 / 2` is `-3` in C++. Unsigned arithmetic wraps modulo $2^N$, which is fully defined and exactly what a telemetry sequence counter wants: after 255 an 8-bit counter reads 0. Signed overflow is *undefined behaviour*: the standard says nothing about what happens, and the compiler is allowed to assume it never does, which lets it delete checks that look to you like safety code. Lesson 12 returns to this; for now, treat a signed counter that can reach its limit as a bug.

::: example Integers behaving like integers
```cpp
#include <cstdint>
#include <iostream>

int main() {
  int ticks_per_second = 1000 / 1024;   // integer division truncates
  std::cout << "1000 / 1024      = " << ticks_per_second << "\n";
  std::cout << "1000.0 / 1024    = " << 1000.0 / 1024 << "\n";
  std::cout << "-7 / 2           = " << -7 / 2 << "\n";
  std::cout << "-7 % 2           = " << -7 % 2 << "\n";

  std::uint8_t seq = 254;               // telemetry sequence counter
  ++seq;
  std::cout << "seq after 1 inc  = " << static_cast<int>(seq) << "\n";
  ++seq;                                // unsigned wrap is well defined
  std::cout << "seq after 2 inc  = " << static_cast<int>(seq) << "\n";

  double dt = 0.02;                     // 50 Hz control period, seconds
  int steps = static_cast<int>(60.0 / dt);
  std::cout << "steps per minute = " << steps << "\n";

  std::cout << "sizeof(int)      = " << sizeof(int) << "\n";
  std::cout << "sizeof(double)   = " << sizeof(double) << "\n";
  std::cout << "sizeof(float)    = " << sizeof(float) << "\n";
  std::cout << "sizeof(int64_t)  = " << sizeof(std::int64_t) << "\n";
  return 0;
}
// Output:
// 1000 / 1024      = 0
// 1000.0 / 1024    = 0.976562
// -7 / 2           = -3
// -7 % 2           = -1
// seq after 1 inc  = 255
// seq after 2 inc  = 0
// steps per minute = 3000
// sizeof(int)      = 4
// sizeof(double)   = 8
// sizeof(float)    = 4
// sizeof(int64_t)  = 8
```

The literal `1000.0` makes the second division a floating-point one, because when an `int` meets a `double` the `int` is promoted. And `std::uint8_t` is an alias for `unsigned char`, so the stream would print it as a character; the `static_cast` to `int` asks for the number instead.
:::

### Floating point, and the fixed-point alternative

`double` is the default for GNC mathematics, and everything you learned about machine epsilon and cancellation in the Python module carries over: a `double` is the same IEEE 754 number that NumPy's `float64` is. `float` costs half the memory and on many flight processors runs faster, but it carries only about seven significant digits. Stored as a `float`, an Earth-centred position of magnitude $6.4 \times 10^6\,\mathrm{m}$ has a resolution of about $0.5\,\mathrm{m}$; as a `double`, about $10^{-9}\,\mathrm{m}$. Choosing `float` for a state vector is a design decision, not a default. Literals carry their type — `1.0` is a `double`, `1.0f` a `float`, `1` an `int` — and mixing them promotes toward the wider floating type.

There is a third option, older than both. **Fixed point** stores a real number as an integer with an implied scale: a gyro register that reports angular rate in counts of $0.01^\circ/\mathrm{s}$ holds $12.34^\circ/\mathrm{s}$ as the integer 1234. Flight computers without a floating-point unit did all their control mathematics this way, and fixed point survives at the sensor interface, in FPGA logic and in some actuator commands. The rule in a modern flight codebase is to convert register values into engineering units in `double` once, at the boundary, and never mix the two representations inside an algorithm. Lesson 7 builds a fixed-point type whose scale the compiler tracks for you.

### Initialisation and conversions

A local variable declared without an initialiser holds an indeterminate value, and reading it is undefined behaviour. Python has no equivalent because every name is bound when it is created. Initialise everything: `double bias = 0.0;` or the brace form `double bias{};`, which zero-initialises. The brace form has a second virtue: it rejects *narrowing* conversions. `std::int8_t small{300};` is a compile error, while `std::int8_t small = 300;` compiles with, at most, a warning:

```text
narrow.cpp:5:21: error: narrowing conversion of '300' from 'int' to 'int8_t'
    {aka 'signed char'} [-Wnarrowing]
```

When you do mean to convert, say so with `static_cast`, naming the target type in angle brackets as the example above does. It is greppable, reviewable and never does anything beyond the one conversion it names. The C-style cast `(int)x` can silently perform several unrelated conversions and has no place in new code.

::: warning
`g++ -Wall` warns `'bias' is used uninitialized` when it can see the read, but it cannot see every read — pass the variable to a function in another translation unit and the warning disappears while the bug stays. Rely on the habit of initialising at the point of declaration, not on the warning.
:::

### `auto`

`auto x = expression;` gives `x` the type of the expression. Use it when the type is evident from the right-hand side or irrelevant to the reader — long iterator types, lambdas — and write the type out when a number's type matters: `auto n = 7 / 2;` is an `int` holding 3, and a reader skimming for a bug will not see that. Lesson 10 shows a case, Eigen expressions, where `auto` is dangerous rather than merely unclear.

## Control flow

The forms are the ones you know from Python, with braces and parentheses in place of indentation and colons:

```cpp
if (altitude_m < 5.0e3) { mode = FlightMode::Landing; } else { mode = FlightMode::EntryBurn; }
for (int i = 0; i < n; ++i) { total += samples[i]; }
for (const auto& sample : samples) { total += sample; }   // range-for, like Python's for-in
while (!converged) { iterate(); }
```

Always write the braces, even for a one-line body; the classic C bug of a second statement silently falling outside an `if` disappears. C++17 lets an `if` declare a variable scoped to itself: `if (auto status = read_sensor(); status.ok()) { ... }`. `switch` selects on an integer or an enumeration; each `case` runs until a `break`, so a missing `break` falls through into the next case. Every loop in flight code has an upper bound visible in the source, for reasons lesson 9 makes precise. `goto` exists and is banned.

## Functions

A function has a *declaration* — its name, parameter types and return type — and a *definition*, which adds the body. The declaration goes in a header so that every translation unit that calls the function sees the same signature; the definition goes in exactly one `.cpp` file. Two functions may share a name if their parameter types differ, and the compiler chooses by the arguments you pass: *overloading*, which is how `norm(v)` can serve a 3-vector and a 6-vector without a suffix on each name. Parameters may have defaults, filled in from the right. A function whose return value must not be ignored is marked `[[nodiscard]]`, and the compiler warns wherever the result is dropped. To return several values, return a `struct`; C++17 structured bindings unpack it at the call site: `auto [speed, period] = circular_orbit(r);`. Recursion is legal in the language and forbidden by flight coding rules, because its stack depth cannot be bounded by inspection.

## Structs, enums and namespaces

A `struct` groups named members into one value, and C++20 designated initialisers name the members as you fill them, exactly as keyword arguments would. An `enum class` is a strongly typed set of named constants: unlike Python's plain integers or C's old `enum`, a `FlightMode` will not silently convert to an `int`, and you may pick its underlying type — `std::uint8_t` here — so that it packs into a telemetry word. A `namespace` groups names the way a Python module does; `gnc::propagate` is the function `propagate` inside `namespace gnc`. Never write `using namespace std;` in a header — it injects hundreds of names into every file that includes you.

::: example A flight-mode state machine
```cpp
#include <cstdint>
#include <iostream>
#include <string_view>

enum class FlightMode : std::uint8_t { Prelaunch, Ascent, Coast, EntryBurn, Landing };

struct VehicleState {
  double altitude_m;
  double vertical_speed_mps;
  FlightMode mode;
};

std::string_view mode_name(FlightMode mode) {
  switch (mode) {
    case FlightMode::Prelaunch: return "PRELAUNCH";
    case FlightMode::Ascent:    return "ASCENT";
    case FlightMode::Coast:     return "COAST";
    case FlightMode::EntryBurn: return "ENTRY_BURN";
    case FlightMode::Landing:   return "LANDING";
  }
  return "UNKNOWN";
}

FlightMode next_mode(const VehicleState& s) {
  if (s.mode == FlightMode::Ascent && s.vertical_speed_mps < 0.0) return FlightMode::Coast;
  if (s.mode == FlightMode::Coast && s.altitude_m < 70.0e3) return FlightMode::EntryBurn;
  if (s.mode == FlightMode::EntryBurn && s.altitude_m < 5.0e3) return FlightMode::Landing;
  return s.mode;
}

int main() {
  VehicleState state{.altitude_m = 120.0e3, .vertical_speed_mps = 850.0, .mode = FlightMode::Ascent};
  const double samples[][2] = {{125.0e3, 200.0}, {130.0e3, -10.0}, {65.0e3, -900.0}, {4.5e3, -120.0}};
  for (const auto& sample : samples) {
    state.altitude_m = sample[0];
    state.vertical_speed_mps = sample[1];
    state.mode = next_mode(state);
    std::cout << state.altitude_m / 1000.0 << " km  " << mode_name(state.mode) << "\n";
  }
  return 0;
}
// Output:
// 125 km  ASCENT
// 130 km  COAST
// 65 km  ENTRY_BURN
// 4.5 km  LANDING
```

`mode_name` has no `default:` case on purpose. Because the `switch` covers an `enum class`, `-Wall` includes `-Wswitch`, which warns if a new enumerator is added and a case is forgotten; a `default:` would silence that warning and hide the omission. The `return "UNKNOWN";` after the switch exists because the language cannot prove that no other value is possible — an enumeration's underlying integer can, through a cast, hold a value with no name. `std::string_view` is a non-owning view of characters that lives as long as the string literal it refers to, which for a literal is the whole program. `const VehicleState&` is a reference: the function looks at the caller's struct without copying it, which is the subject of lesson 2.
:::

::: warning
`switch` cases fall through. `case FlightMode::Ascent: mode_changes++; case FlightMode::Coast: ...` runs *both* bodies when the mode is `Ascent`. When the switch does something rather than returning, end every case with `break;`, or with `[[fallthrough]];` when the fall-through is intended.
:::

## What C++17 and C++20 added

The language you will write is called "modern C++" to distinguish it from the C-with-classes style of the 1990s. The features this module leans on, by the standard that introduced them:

- **C++17**: `if` with an initialiser, structured bindings, `if constexpr` (lesson 7), `std::optional` (lesson 8), `std::string_view`, `std::variant`, `[[nodiscard]]` and `[[fallthrough]]`, and guaranteed copy elision when returning a temporary (lesson 3).
- **C++20**: concepts and `requires` clauses (lesson 5), ranges, `std::span` (lesson 6), designated initialisers, `consteval` and `constinit` (lesson 7), `std::format`, the three-way comparison `<=>`, and `constexpr` versions of much more of the standard library. Coroutines and modules also arrived; this module does not use them, because their support in embedded toolchains is still uneven.

Which standard a flight project compiles with is a project decision. Many are on C++17 with a shortlist of approved C++20 features, because the compiler qualified for the flight processor lags the desktop compilers by a few years. Everything here compiles with `-std=c++20` on GCC 13 and Clang 18.

::: key
A C++ program is preprocessed, compiled one translation unit at a time into object files, and linked into an executable. Declarations live in headers and are shared; each definition lives in exactly one place. Compile errors come from the compiler, "undefined reference" errors from the linker.
:::

::: key
Every variable has one static type with a known `sizeof`. Use the fixed-width types `std::int32_t`, `std::uint8_t` and friends for anything that crosses a wire or a register. Integer division truncates toward zero, unsigned arithmetic wraps modulo $2^N$ by definition, and signed overflow is undefined behaviour.
:::

::: key
Initialise every variable at its declaration. Brace initialisation `T x{value};` rejects narrowing conversions at compile time, and `static_cast` is the only cast you write by hand.
:::

## Check yourself

::: check
A colleague's build fails with `undefined reference to 'gnc::propagate(State const&, double)'`. Which of the three build stages produced the error, and what is the most likely cause?
:::

::: answer
The linker. The compiler was satisfied — it saw a declaration of `gnc::propagate` in a header and compiled the call — but no object file it was given contains the definition. Either the `.cpp` file that defines `propagate` was not compiled and linked into this target, or the definition's signature differs from the declaration (a `double` declared, a `float` defined), so the symbol the linker wants was never produced.
:::

::: check
A telemetry packet is declared as a struct with an `int` sequence counter and a `long` timestamp. Why will a flight software reviewer reject it, and what should the members be instead?
:::

::: answer
The sizes of `int` and `long` are only guaranteed as minimums and differ between platforms — `long` is 8 bytes on Linux and 4 on Windows. A packet layout that changes with the compiler cannot be decoded by the ground station. Use fixed-width types, `std::uint32_t` for the counter and `std::uint64_t` for the timestamp, so the layout is identical on the laptop, the simulator and the flight processor.
:::

::: check
What value does `n` hold after `int n = 7 / 2 * 2.0;`, and why?
:::

::: answer
`6`. Evaluation goes left to right: `7 / 2` is integer division, giving the `int` 3. Then `3 * 2.0` promotes 3 to `double` and gives `6.0`, which is truncated to `6` on assignment to an `int`. The `2.0` arrived too late to make the division a floating-point one. Writing `7.0 / 2 * 2.0` gives `7.0`, and `int n{7.0 / 2 * 2.0}` would not compile at all, because braces reject the narrowing conversion.
:::

::: check
`std::uint8_t c = 250; c += 10;` and `std::int8_t s = 120; s += 10;` — what does each variable hold afterwards, and is either statement undefined behaviour?
:::

::: answer
`c` holds `4`: unsigned arithmetic wraps modulo $2^8 = 256$, and $260 - 256 = 4$, all well defined. `s` holds `-126`, also well defined, for a subtler reason. Both operands of `s + 10` are promoted to `int` before the addition, so the sum 130 is computed in `int` without overflow. Converting 130 back to `std::int8_t` gives the value congruent to 130 modulo 256 within the type's range, $130 - 256 = -126$; since C++20 that modular result is guaranteed. Signed overflow would occur only if the addition itself exceeded the range of `int`.
:::

::: check
`mode_name` in the state-machine example omits a `default:` case. What protection does that give the program, and what would adding `default: return "UNKNOWN";` cost?
:::

::: answer
With every enumerator listed and no `default`, `-Wall` (via `-Wswitch`) warns when someone adds a sixth `FlightMode` and forgets to name it in the switch; with `-Werror` the build fails, so the omission cannot reach the vehicle. A `default:` case tells the compiler that unlisted values are handled, so the warning disappears and the new mode silently reports as `"UNKNOWN"` in telemetry — plausible-looking output hiding a missing branch. Keep the `return` after the switch instead: it satisfies the requirement that the function always return while leaving the enumerator check intact.
:::

## Summary

| Item | Meaning |
| --- | --- |
| translation unit | one `.cpp` file plus everything it includes; the compiler's unit of work |
| declaration / definition | signature shared through headers / body written once |
| `g++ -std=c++20 -Wall -Wextra -O2 f.cpp -o f` | the build line for a single file; flight builds add `-Werror` |
| `std::int32_t`, `std::uint8_t`, … | fixed-width integers for wire and register layouts |
| `float` / `double` | 4 bytes, about 7 digits / 8 bytes, about 16 digits |
| fixed point | integer with an implied scale; convert to `double` once, at the boundary |
| `T x{v};` | brace initialisation; rejects narrowing |
| `static_cast` | the explicit conversion; no C-style casts |
| `enum class Mode : std::uint8_t` | strongly typed enumeration with a chosen size |
| `switch` without `default` | lets `-Wswitch` catch a forgotten enumerator |
| `[[nodiscard]]` | warns when a return value is ignored |

The next lesson takes the one idea from this program that most separates C++ from Python — that a variable *is* an object, and that assignment copies it — and builds references and `const` on top of it.
