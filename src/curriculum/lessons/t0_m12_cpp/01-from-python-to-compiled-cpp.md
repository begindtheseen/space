---
id: l01-from-python-to-compiled-cpp
title: From Python to compiled C++
minutes: 24
covers:
  - C++17/20 core language
---

Picture two ways to read a book in a language you do not speak. In the first, a translator sits beside you and translates each sentence aloud as you reach it. You start at once, but every page is slow, and if sentence 400 makes no sense, nobody finds out until you get there. In the second, the whole book is translated before it is printed. You wait, but then you read at full speed, and every sentence has already been checked.

Python is the first way; C++ is the second. Python's **interpreter** reads your program while it runs. C++ goes through a **compiler** — a program that translates your whole source into the processor's own **[[machine code|machine-code]]** before anything runs, and refuses to finish if something does not fit.

Every GNC algorithm you have written so far ran in Python. None of it will fly. The computer that steers a launch vehicle runs compiled code in a fixed amount of memory, with a hard deadline every few milliseconds, and in modern flight software that code is C++. Python becomes the analysis layer that drives the C++ core, runs the Monte Carlo and draws the plots.

This lesson covers how a program is built, how its types behave, and how control flow and functions differ from Python. Compile every example yourself. When you think "Python did this for me", good: C++ makes you state what Python guessed, and a reviewer cannot check a guess.

## Why flight software is written in C++

Three properties matter on a flight computer.

- **Determinism** — same inputs, same outputs, in the same time, every cycle, so a scheduler can prove every task meets its deadline.
- **Bounded resources** — memory is sized at start-up and never grows, with no **[[garbage collector|garbage-collector]]** to pause the program at a bad moment.
- **Direct hardware access** — sensor registers and timers sit at fixed memory addresses, and the language must read and write them.

C gives you all three and still runs the lowest layers, like the code that starts the computer. C++ adds classes, templates and a standard library, which keep a large GNC codebase readable and testable. Python decides types while running, asks for memory on almost every operation, and stops everything when its garbage collector runs. Fine for analysis; unacceptable in a control loop that runs 400 times a second (400 Hz).

## The compiled model

### From source to executable

A C++ program passes through three tools, like an assembly line, before it runs at all.

1. The **preprocessor** handles lines that begin with `#`. `#include` pastes the text of a **header file** — a file of shared declarations, ending in `.h` or `.hpp` — into yours. Flight coding standards keep preprocessor use small: little beyond `#include` and `#pragma once`.
2. The **compiler** turns each source file into an **object file** of machine code, checking every type on the way. Each `.cpp` file, together with everything it includes, is one **translation unit** — the compiler's unit of work. Mistakes found here are **compile errors**, and you fix them before anything runs.
3. The **linker** joins the object files and libraries into one **executable**, the program you run, connecting every function call to its function. An "undefined reference" error is the linker saying something was declared but never defined anywhere it can see.

Two things follow from this **[[assembly line|build-pipeline]]**.

First, the compiler sees one translation unit at a time. So anything used from two files must be **declared** — its name and types announced — in a header both include, and **defined** — its body written — in exactly one place.

Second, many mistakes are caught before the program exists: wrong argument types, misspelled names, a missing `return`. Python finds these only when the bad line runs — for a rarely taken abort branch, perhaps never.

### Compiling and running

Every program has one `main` function, which runs first; returning `0` means success. Build and run a one-file program like this:

```text
$ g++ -std=c++20 -Wall -Wextra -O2 orbit.cpp -o orbit
$ ./orbit
```

- `g++` is the GNU C++ compiler; `-std=c++20` picks the language version.
- `-Wall -Wextra` turn on the warnings every professional build uses. Flight projects add `-Werror`, which makes every warning stop the build — **[[a rule from NASA's Power of Ten|power-of-ten]]** you will meet in lesson 9.
- `-O2` asks for optimization (use `-O0 -g` while debugging).
- `-o orbit` names the output file.

::: example Circular orbital speed, compiled
A first complete program. It computes the speed and period of a circular orbit at 400 km altitude, using $v = \sqrt{\mu / r}$ and $T = 2\pi\sqrt{r^3/\mu}$ with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ ($\mu$ is the Greek letter "mu", Earth's gravitational parameter).

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

Read it top to bottom.

- The `#include` lines bring in the maths library, C++20's `std::format` (like a Python f-string) and `std::cout`, the output stream; read `<<` as "put into".
- `constexpr double` declares a constant the compiler knows while compiling.
- Each function states the type of every parameter and of its result, so calling `circular_speed` with a string would stop the build.
- `std::`, read "standard", is the standard library's prefix, like `math.` in Python's `math.sqrt`.

Sanity check: $r = 6378.137 + 400 = 6778.137\,\mathrm{km}$, and a speed of about 7.7 km/s with a period of about 93 minutes is exactly what the International Space Station does.
:::

## Types are fixed and have sizes

In Python you can write `x = 3` and later `x = "three"`. In C++ a variable has one **type** for its whole life, fixed when the program is compiled. Each type also has a size in **bytes** (one byte is 8 **bits**, and a bit is a single 0 or 1). You can ask for the size with `sizeof`. The basic types are:

| Type | Typical size | Meaning |
| --- | --- | --- |
| `bool` | 1 byte | `true` or `false` |
| `char` | 1 byte | one byte of text or raw data |
| `int` | 4 bytes | signed integer, at least 16 bits guaranteed |
| `long` | 8 bytes on Linux, 4 on Windows | wider signed integer |
| `float` | 4 bytes | IEEE single precision, about 7 significant digits |
| `double` | 8 bytes | IEEE double precision, about 16 significant digits |

The C++ standard guarantees only *minimum* sizes for `int` and `long` — not good enough for anything that crosses a wire or a hardware register. So flight code uses the **fixed-width types** from the `<cstdint>` header: `std::int8_t`, `std::uint8_t`, `std::int16_t`, `std::uint16_t`, `std::int32_t`, `std::uint32_t`, `std::int64_t` and `std::uint64_t`. The number is the width in bits, and a `u` means **unsigned** — no negative values. A telemetry packet declared with these has the same layout on your laptop and on the flight processor. Sizes and positions in memory use `std::size_t`, an unsigned type wide enough for any object's size.

### Integer arithmetic

- **Division truncates toward zero.** `-7 / 2` is `-3` in C++. Python's `//` rounds down: `-7 // 2` is `-4`.
- **The remainder `%` takes the sign of the left number.** `-7 % 2` is `-1`.
- **Unsigned arithmetic wraps around** modulo $2^N$, where $N$ is the number of bits. It counts like a car's **[[odometer|odometer-wrap]]**: after 255, an 8-bit counter reads 0. This is fully defined — exactly what a telemetry sequence counter wants.
- **Signed overflow is undefined behavior.** Going past the largest value of a signed type is **[[undefined behavior|undefined-behaviour]]**: the standard says nothing about what happens, and the compiler may assume it never does, which lets it delete checks that look like safety code (lesson 12). A signed counter that can reach its limit is a bug.

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

Line by line:

- `1000 / 1024` is less than one, and integer division drops the fraction: `0`.
- The literal `1000.0` makes the second division floating-point. When an `int` meets a `double`, the `int` is **promoted** — widened — to `double` first.
- `++seq` (read "plus plus seq") adds one. From 254 it reaches 255, the largest 8-bit value, and the next step wraps to 0.
- `std::uint8_t` is another name for `unsigned char`, so the stream would print it as a character; `static_cast<int>` asks for the number.
- One minute at 50 steps per second is $60 / 0.02 = 3000$ steps, as printed.
:::

### Floating point, and the fixed-point alternative

`double` is the default for GNC mathematics. It is the same IEEE 754 number as NumPy's `float64`, so everything you learned about machine epsilon and cancellation carries over.

`float` uses half the memory and on many flight processors runs faster, but carries only about seven significant digits. Store an Earth-centered position of size $6.4 \times 10^6\,\mathrm{m}$ as a `float`, and the smallest step it can show is about $0.5\,\mathrm{m}$. As a `double`, the step is about $10^{-9}\,\mathrm{m}$. Choosing `float` for a state vector is a design decision, never a default.

Literals carry their type: `1.0` is a `double`, `1.0f` a `float`, `1` an `int`. Mixing them promotes toward the wider floating type.

There is a third option, older than both. **Fixed point** stores a real number as an integer with an agreed scale. A gyro register that reports turn rate in counts of $0.01^\circ/\mathrm{s}$ holds $12.34^\circ/\mathrm{s}$ as the integer 1234. **[[Flight computers without floating-point hardware|fixed-point-history]]** did all their control mathematics this way, and fixed point survives at sensor interfaces, in programmable chips and in some actuator commands. A modern flight codebase converts register values into engineering units in `double` once, at the boundary, and never mixes the two inside an algorithm. Lesson 7 builds a fixed-point type whose scale the compiler tracks.

### Initialization and conversions

A local variable declared without a starting value holds garbage — an **indeterminate** value — and reading it is undefined behavior. So initialize everything where you declare it: `double bias = 0.0;` or the **brace form** `double bias{};`, which sets it to zero. Braces also reject **narrowing** conversions — ones that lose information. `std::int8_t small{300};` is a compile error, since 300 does not fit in 8 signed bits; `std::int8_t small = 300;` compiles with a warning, and `small` quietly becomes 44:

```text
narrow.cpp:5:21: error: narrowing conversion of '300' from 'int' to 'int8_t'
    {aka 'signed char'} [-Wnarrowing]
```

When you *do* mean to convert, say so with `static_cast`, naming the target type in angle brackets. It is easy to search for and review, and it never does more than the one conversion it names. The old C-style cast `(int)x` can silently do several unrelated conversions at once and has no place in new code.

::: warning
`g++ -Wall` warns `'bias' is used uninitialized` only when it can see the read. Pass the variable to a function in another translation unit and the warning vanishes while the bug stays. Rely on the habit, not the warning.
:::

### `auto`

`auto x = expression;` gives `x` the type of the expression. Use it when the type is obvious or does not matter to the reader, like long iterator types. Write the type out when a number's type matters: `auto n = 7 / 2;` is an `int` holding 3, and a reader skimming for a bug will not see that. Lesson 10 shows a case, Eigen expressions, where `auto` is dangerous, not merely unclear.

## Control flow

The forms are the ones you know from Python. Braces `{ }` replace indentation, and conditions go in parentheses:

```cpp
if (altitude_m < 5.0e3) { mode = FlightMode::Landing; } else { mode = FlightMode::EntryBurn; }
for (int i = 0; i < n; ++i) { total += samples[i]; }
for (const auto& sample : samples) { total += sample; }   // range-for, like Python's for-in
while (!converged) { iterate(); }
```

Read the counting loop as "start `i` at 0; keep going while `i` is less than `n`; add one to `i` after each pass". The `!` means "not".

- **Always write the braces**, even for a one-line body, so a second line can never look as if it is inside an `if` when it is not.
- C++17 lets an `if` declare a variable that lives only inside it: `if (auto status = read_sensor(); status.ok()) { ... }`.
- `switch` picks a branch by an integer or enumeration; each `case` runs until a `break`.
- **Every loop in flight code has an upper bound visible in the source**, for reasons lesson 9 makes precise.
- `goto` exists and is banned.

## Functions

A function's **declaration** — name, parameter types, return type — goes in a header, so every caller sees the same signature. Its **definition**, which adds the body, goes in exactly one `.cpp` file.

- **Overloading.** Two functions may share a name if their parameter types differ; the compiler picks by the arguments. So `norm(v)` can serve a 3-vector and a 6-vector.
- **Defaults.** Parameters may have default values, filled in from the right.
- **`[[nodiscard]]`.** A function whose result must not be ignored is marked `[[nodiscard]]`, and the compiler warns wherever the result is dropped.
- **Several results.** Return a `struct`; C++17 **structured bindings** unpack it like Python tuple unpacking: `auto [speed, period] = circular_orbit(r);`.
- **No recursion.** A function calling itself is legal C++ but banned in flight code, because reading the code cannot bound how deep it goes.

## Structs, enums and namespaces

A **`struct`** groups named members into one value. C++20 **designated initializers** let you name the members as you fill them, like keyword arguments in Python.

An **`enum class`** is a strongly typed set of named constants: a `FlightMode` will not silently turn into an `int`, unlike C's old `enum`. You may pick its underlying type — `std::uint8_t` below — so it packs into one byte of telemetry.

A **`namespace`** groups names like a Python module: `gnc::propagate` is `propagate` inside `namespace gnc` (read `::` as "inside"). Never write `using namespace std;` in a header; it dumps hundreds of names into every file that includes yours.

::: example A flight-mode state machine
A **[[state machine|state-machine]]** is a set of modes plus rules for moving between them. This one follows a booster from ascent to landing.

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

Follow the samples. At 125 km the booster still climbs: `ASCENT`. At 130 km its vertical speed turns negative: `COAST`. At 65 km, below 70 km: `ENTRY_BURN`. At 4.5 km, below 5 km: `LANDING`. (`&&` means "and".)

- **No `default:` case in `mode_name`, on purpose.** For a `switch` over an `enum class`, `-Wall` turns on `-Wswitch`, which warns if a new mode is added and its case forgotten. A `default:` would silence that warning.
- **The `return "UNKNOWN";` after the switch** exists because, through a cast, an enumeration can hold a value with no name.
- **`std::string_view`** views characters it does not own — here a string literal, which lives for the whole program.
- **`const VehicleState&`** is a reference: the function reads the caller's struct without copying it (lesson 2).
:::

::: warning
`switch` cases fall through. `case FlightMode::Ascent: mode_changes++; case FlightMode::Coast: ...` runs *both* bodies when the mode is `Ascent`. End every case with `break;` (unless it returns), or with `[[fallthrough]];` when you mean it.
:::

## What C++17 and C++20 added

"Modern C++" means the language since 2011, as opposed to the "C with classes" style of the 1990s. A new **standard** — an official revision — arrives every three years. The features this module leans on:

- **C++17**: `if` with an initializer, structured bindings, `if constexpr` (lesson 7), `std::optional` (lesson 8), `std::string_view`, `std::variant`, `[[nodiscard]]` and `[[fallthrough]]`, and guaranteed copy elision when returning a temporary (lesson 3).
- **C++20**: concepts and `requires` clauses (lesson 5), ranges, `std::span` (lesson 6), designated initializers, `consteval` and `constinit` (lesson 7), `std::format`, the three-way comparison `<=>`, and `constexpr` versions of much more of the standard library. (Coroutines and modules also arrived; embedded toolchains support them unevenly, so this module skips them.)

Many flight projects use C++17 plus a few approved C++20 features, because the **[[compiler qualified for the flight processor|qualified-compiler]]** lags desktop compilers by a few years. Everything here compiles with `-std=c++20` on GCC 13 and Clang 18.

::: key
A C++ program is preprocessed, compiled one translation unit at a time into object files, and linked into an executable. Declarations live in headers and are shared; each definition lives in exactly one place. Compile errors come from the compiler, "undefined reference" errors from the linker.
:::

::: key
Every variable has one static type with a known `sizeof`; initialize it at its declaration, and use brace initialization `T x{value};` to reject narrowing at compile time. Use the fixed-width types `std::int32_t`, `std::uint8_t` and friends for anything that crosses a wire or a register. Integer division truncates toward zero, unsigned arithmetic wraps modulo $2^N$ by definition, signed overflow is undefined behavior, and `static_cast` is the only cast you write by hand.
:::

## Check yourself

::: check
A colleague's build fails with `undefined reference to 'gnc::propagate(State const&, double)'`. Which of the three build stages produced the error, and what is the most likely cause?
:::

::: answer
The linker. The compiler saw a declaration of `gnc::propagate` in a header and compiled the call, but no object file contains the definition. Either the `.cpp` file defining `propagate` was not compiled into this program, or the definition's signature differs from the declaration (a `double` declared, a `float` defined), so the name the linker wants was never produced.
:::

::: check
A telemetry packet is declared as a struct with an `int` sequence counter and a `long` timestamp. Why will a flight software reviewer reject it, and what should the members be instead?
:::

::: answer
The sizes of `int` and `long` are only minimums and differ between platforms — `long` is 8 bytes on Linux, 4 on Windows. A layout that changes with the compiler cannot be decoded on the ground. Use fixed-width types, `std::uint32_t` for the counter and `std::uint64_t` for the timestamp, so the layout is identical on the laptop, the simulator and the flight processor.
:::

::: check
What value does `n` hold after `int n = 7 / 2 * 2.0;`, and why?
:::

::: answer
`6`. Left to right: `7 / 2` is integer division, giving the `int` 3. Then `3 * 2.0` promotes 3 to `double` and gives `6.0`, which is cut down to `6` when stored in an `int`. The `2.0` arrived too late to make the division a floating-point one. Writing `7.0 / 2 * 2.0` gives `7.0`, and `int n{7.0 / 2 * 2.0}` would not compile at all, because braces reject the narrowing from `double` to `int`.
:::

::: check
`std::uint8_t c = 250; c += 10;` and `std::int8_t s = 120; s += 10;` — what does each variable hold afterwards, and is either statement undefined behavior?
:::

::: answer
`c` holds `4`. Unsigned arithmetic wraps modulo $2^8 = 256$, and $260 - 256 = 4$, all well defined.

`s` holds `-126`, also well defined, for a subtler reason. Both operands of `s + 10` are promoted to `int` first, so 130 is computed as an `int` without overflow. Converting 130 back to `std::int8_t` (range $-128$ to $127$) gives the value 256 away that fits, $130 - 256 = -126$, guaranteed since C++20. Signed overflow would need the addition itself to exceed the range of `int`.
:::

::: check
`mode_name` in the state-machine example leaves out a `default:` case. What protection does that give the program, and what would adding `default: return "UNKNOWN";` cost?
:::

::: answer
With every mode listed and no `default`, `-Wswitch` (part of `-Wall`) warns when a sixth `FlightMode` is added but not named in the switch; with `-Werror` the build fails, so the mistake cannot reach the vehicle. A `default:` case tells the compiler that unlisted values are handled, so the warning disappears and the new mode silently shows as `"UNKNOWN"` in telemetry — plausible output hiding a missing branch. The `return` after the switch already guarantees the function returns something, without disabling the check.
:::

## Summary

| Item | Meaning |
| --- | --- |
| translation unit | one `.cpp` file plus everything it includes; the compiler's unit of work |
| declaration / definition | signature shared through headers / body written once |
| `g++ -std=c++20 -Wall -Wextra -O2 f.cpp -o f` | the build line for a single file; flight builds add `-Werror` |
| `std::int32_t`, `std::uint8_t`, … | fixed-width integers for wire and register layouts |
| `float` / `double` | 4 bytes, about 7 digits / 8 bytes, about 16 digits |
| fixed point | integer with an agreed scale; convert to `double` once, at the boundary |
| `T x{v};` | brace initialization; rejects narrowing |
| `static_cast` | the explicit conversion; no C-style casts |
| `enum class Mode : std::uint8_t` | strongly typed enumeration with a chosen size |
| `switch` without `default` | lets `-Wswitch` catch a forgotten enumerator |
| `[[nodiscard]]` | warns when a return value is ignored |

The next lesson takes the idea from this lesson that most separates C++ from Python — that a variable *is* an object, and that assignment copies it — and builds references and `const` on top of it.

::: context machine-code What the processor actually reads
A processor does not understand words like `if` or `sqrt`. It understands only numbered instructions such as "load 8 bytes from this address", "multiply these two registers" or "jump there if the last result was negative". Each instruction is a short pattern of bits. **Machine code** is a long list of these. Different processor families — the x86 chip in most laptops, the ARM chip in a phone, the PowerPC chips flown on many spacecraft — have different instruction sets, which is why the same C++ source must be compiled separately for each one.
:::

::: context garbage-collector Why a garbage collector is a problem at 400 Hz
Python keeps track of which objects are still in use. Every so often its **garbage collector** walks through memory to find objects nothing points to, and frees them. You do not choose when that walk happens, and it can take longer when there is more to check. For a notebook, a pause of a few milliseconds is invisible. For a control loop that must finish its work every 2.5 ms (that is 400 times a second), a surprise pause is a missed deadline. C++ has no collector: objects are freed at points you can see in the code, as lesson 3 shows.
:::

::: context build-pipeline Two files, one program
Each `.cpp` file is compiled on its own, into its own object file. Only the linker sees them all, and it is the linker that connects a call in one file to the function defined in another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="8" y="16" width="64" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="40" y="35">main.cpp</text>
    <rect x="96" y="12" width="92" height="38" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="142" y="28">preprocess</text><text x="142" y="42">+ compile</text>
    <rect x="212" y="16" width="52" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="238" y="35">main.o</text>
    <rect x="8" y="86" width="64" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="40" y="105">gnc.cpp</text>
    <rect x="96" y="82" width="92" height="38" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="142" y="98">preprocess</text><text x="142" y="112">+ compile</text>
    <rect x="212" y="86" width="52" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="238" y="105">gnc.o</text>
    <rect x="288" y="46" width="64" height="40" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="320" y="70">linker</text>
    <rect x="288" y="118" width="64" height="30" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="320" y="137">orbit</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none" marker-end="url(#ah)">
    <line x1="72" y1="31" x2="94" y2="31"/><line x1="188" y1="31" x2="210" y2="31"/>
    <line x1="72" y1="101" x2="94" y2="101"/><line x1="188" y1="101" x2="210" y2="101"/>
    <line x1="264" y1="31" x2="286" y2="56"/><line x1="264" y1="101" x2="286" y2="76"/>
    <line x1="320" y1="86" x2="320" y2="116"/>
  </g>
  <text x="140" y="160" font-size="11" fill="#6c7a93" text-anchor="middle">each file compiled alone; the linker joins them</text>
</svg>
```

That is why a missing definition is a *linker* error: every file compiled fine, but the pieces do not fit together.
:::

::: context power-of-ten Ten rules in four pages
"The Power of Ten" is a short paper by Gerard Holzmann of NASA's Jet Propulsion Laboratory, written in 2006. It lists ten rules for code that must not fail, such as: no recursion, every loop has a fixed upper bound, no new memory after start-up, check every return value, and compile with all warnings on and treat any warning as an error. Each rule exists so that a tool, or a tired reviewer, can check the code mechanically. Lesson 9 goes through the rules and the reasons behind them.
:::

::: context odometer-wrap An 8-bit counter is an odometer
A car odometer with five digits rolls from 99999 to 00000: the carry falls off the left end. An 8-bit unsigned counter does the same in binary. At 255 all eight bits are 1; add one and every bit becomes 0, with the carry lost.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="14" width="46" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="33" y="34">253</text>
    <rect x="70" y="14" width="46" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="93" y="34">254</text>
    <rect x="130" y="14" width="46" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="153" y="34">255</text>
    <rect x="190" y="14" width="46" height="30" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="213" y="34">0</text>
    <rect x="250" y="14" width="46" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="273" y="34">1</text>
    <rect x="310" y="14" width="40" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="330" y="34">2</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="56" y1="29" x2="70" y2="29"/><line x1="116" y1="29" x2="130" y2="29"/><line x1="236" y1="29" x2="250" y2="29"/><line x1="296" y1="29" x2="310" y2="29"/></g>
  <line x1="176" y1="29" x2="190" y2="29" stroke="#b4232c" stroke-width="2.5"/>
  <text x="183" y="60" font-size="11" fill="#b4232c" text-anchor="middle">wraps</text>
  <g font-size="12" fill="#1f2a44" font-family="monospace">
    <text x="60" y="88">  1111 1111   (255)</text>
    <text x="60" y="104">+         1</text>
    <text x="60" y="122" fill="#b4232c">1</text><text x="68" y="122"> 0000 0000   (0)</text>
  </g>
  <text x="250" y="122" font-size="11" fill="#b4232c">carry falls off</text>
</svg>
```

Because the rule is written into the standard, a ground station can always tell that packet 0 came right after packet 255.
:::

::: context undefined-behaviour Why "undefined" is worse than "wrong"
You might expect signed overflow to wrap like an unsigned counter. On most chips the hardware would. But the C++ standard does not promise that, so the optimizer is allowed to assume overflow never happens. Given `if (x + 1 > x)`, it may decide the test is always true and delete it. The program then does something that matches no line you wrote, and it may change with the optimization level. Lesson 12 shows real cases and the tools — the sanitizers — that catch them.
:::

::: context fixed-point-history Mathematics without decimals
Early flight computers had no hardware for floating-point numbers. The Apollo Guidance Computer, which flew astronauts to the Moon, did all its navigation with integers and agreed scale factors — programmers tracked by hand where the imaginary decimal point sat in each number. The idea is the same as counting money in cents: \$12.34 stored as the whole number 1234. It is exact and fast, but every multiplication moves the imaginary point, and forgetting that is a classic bug. Lesson 7 makes the compiler do that bookkeeping.
:::

::: context state-machine The booster's modes as a diagram
Each box is a mode; each arrow is a rule checked on every cycle. Nothing else can change the mode, which is what makes a state machine easy to review.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs><marker id="sm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="14" y="20" width="104" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="66" y="40">ASCENT</text>
    <rect x="232" y="20" width="104" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="284" y="40">COAST</text>
    <rect x="232" y="104" width="104" height="32" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="284" y="124">ENTRY_BURN</text>
    <rect x="14" y="104" width="104" height="32" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="66" y="124">LANDING</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" marker-end="url(#sm)">
    <line x1="118" y1="36" x2="230" y2="36"/>
    <line x1="284" y1="52" x2="284" y2="102"/>
    <line x1="232" y1="120" x2="120" y2="120"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="175" y="28">speed up &lt; 0</text>
    <text x="276" y="82" text-anchor="end">alt &lt; 70 km</text>
    <text x="175" y="112">alt &lt; 5 km</text>
  </g>
</svg>
```

Real flight software has many more modes and abort branches, but it is built the same way: an `enum class` for the modes and one function for the arrows.
:::

::: context qualified-compiler Why flight projects use older compilers
Before a compiler may build flight software, the team checks it: it runs test suites against it, records known bugs, and freezes one exact version for the life of the program. That process, often called **qualification**, takes time and money, so projects move to a new compiler rarely. Vendors of compilers for radiation-tolerant flight processors also add new language features more slowly than GCC or Clang do. The result is that flight teams often work a standard or two behind the newest one.
:::
