---
id: l07-constexpr-compile-time
title: constexpr and compile-time computation
minutes: 26
covers:
  - constexpr and compile-time computation
---

Think of the multiplication table printed on the back of an old school notebook. Somebody worked out every product once, before the notebook was even printed. When you need $7 \times 8$, you do not multiply. You look it up. The work was done ahead of time, it was checked once, and it can never come out different.

C++ can do the same thing with a program. The **compiler** — the tool that turns your source code into a program the processor can run — can also *run parts of your code while it builds*. Whatever it works out gets stored inside the finished program as plain data. We call the moment of building **[[compile time|compile-vs-run]]**, and the moment the program actually runs on the flight computer **run time**. This lesson is about moving work from run time to compile time.

Why a GNC engineer cares: the best time to compute something for a flight computer is before the program even exists. A lookup table built by the compiler costs nothing at boot, and no bug in start-up code can corrupt it. A checksum routine that the compiler has already tested cannot ship wrong. A units mistake caught while building never reaches the vehicle. Python has no compile time at all — everything happens when the script runs — so these mistakes show up as an error on the launch pad or, worse, as a believable wrong number.

You will meet `constexpr`, which lets the compiler do the work; `static_assert`, which turns a compile-time fact into a test that stops the build; and C++20's `consteval` and `constinit`, which *demand* compile-time work. Then we use them for three flight-software habits: compiler-built tables, compiler-checked units, and fixed-point numbers whose scale is part of their type.

## const, constexpr and what "constant expression" means

Start with two promises. `const` is a promise that a value will not change after it is first set. It says nothing about *when* the value is worked out. `const int n = read_sensor();` is fine: the sensor is read while the program runs, and after that `n` stays put.

`constexpr` (say "const-expr") is a bigger promise. It says the compiler itself can work out the value while building. The value must come from a **constant expression** — a calculation that uses only things the compiler already knows. So `constexpr int n = read_sensor();` will not build: the compiler cannot read a sensor that is bolted to a vehicle it has never seen.

Why bother? Some places in C++ *require* a value known while building — a fixed array's size, a template argument, a `static_assert`, a `case` label — and a `constexpr` value fits all of them.

A `constexpr` *function* is one the compiler is allowed to run while building, when all its inputs are known then. Call the same function with a value that only exists at run time, and it runs as an ordinary function. The keyword adds an ability; it does not take one away. Since C++14 such a function can have loops, local variables and `if` statements. Since C++20 nearly the whole language is allowed. What is still forbidden is anything whose result the compiler could not reproduce: reading or writing files, reading memory that was never set, and any **[[undefined behavior|ub-at-compile-time]]** — the operations C++ refuses to give a meaning to, such as overflowing a signed integer. If a compile-time calculation tries one, the build fails. That makes compile-time evaluation a free checker for whatever code it touches.

```cpp
#include <cstdio>

constexpr double square(double x) { return x * x; }   // usable at compile time or run time

constexpr double at_compile_time = square(3.0);       // evaluated by the compiler
static_assert(at_compile_time == 9.0);

int main(int argc, char**) {
  const double at_run_time = square(argc + 0.5);      // same function, run-time argument
  std::printf("square: %.1f at compile time, %.2f at run time\n", at_compile_time, at_run_time);
  return 0;
}
// Output (run with no arguments, so argc == 1):
// square: 9.0 at compile time, 2.25 at run time
```

One function, two uses. The compiler worked out `square(3.0)`, and the program holds only the answer $9$. `argc` counts the words typed to launch the program, so `square(argc + 0.5)` can only run at run time.

### static_assert: a test that runs every time you build

`static_assert(condition, "message")` asks the compiler to check a condition while building. If the condition is false, the build stops and prints your message. It is a unit test that runs on every build, costs nothing at run time, and can check anything a constant expression can say: the size of a struct, a table entry, an algorithm's result on known input. Since C++17 the message is optional, but write it anyway: it is what the next engineer reads.

```cpp
#include <cstdint>
struct Packet { std::int32_t id; double t; std::uint16_t seq; };
static_assert(sizeof(Packet) == 14, "Packet must be 14 bytes for the telemetry link");
```

```text
sa.cpp:3:30: error: static assertion failed: Packet must be 14 bytes for the telemetry link
sa.cpp:3:30: note: the comparison reduces to '(24 == 14)'
```

The fields add up to $4 + 8 + 2 = 14$ bytes, but the struct is really 24. The extra ten bytes are *padding* — gaps the compiler leaves so that each field sits at a tidy address — and lesson 9 explains exactly where they go. The point for now: the `static_assert` caught the wrong assumption before a single packet was sent.

## Tables built by the compiler

Back to the notebook's times table. A `constexpr` function can fill a whole `std::array` with a loop and hand it back. If you store the result in a `constexpr` variable, the compiler *must* run that loop while building. The finished table lands in the program as literal numbers, in **[[read-only memory|read-only-data]]** — memory the running program is not allowed to write to. The function that built it is never called at run time, and may not even exist in the program.

::: example A CRC-32 table computed at compile time, and verified there
Telemetry frames carry a **[[CRC-32|crc-idea]]** — a 32-bit fingerprint of the bytes — so the ground station can throw away packets that were damaged on the way down. The fast way to compute it uses a table of 256 numbers derived from a fixed bit pattern called the polynomial. Here the compiler derives the table.

```cpp
#include <array>
#include <cstdint>
#include <cstdio>
#include <string_view>

// CRC-32 (IEEE 802.3, reflected, polynomial 0xEDB88320) with a table built at compile time.
constexpr std::array<std::uint32_t, 256> make_crc32_table() {
  std::array<std::uint32_t, 256> table{};
  for (std::uint32_t i = 0; i < 256; ++i) {
    std::uint32_t c = i;
    for (int bit = 0; bit < 8; ++bit) {
      c = (c & 1u) ? (0xEDB88320u ^ (c >> 1)) : (c >> 1);
    }
    table[i] = c;
  }
  return table;
}

// The table is a compile-time constant: 1 KiB in read-only memory, no start-up cost.
constexpr auto kCrc32Table = make_crc32_table();

constexpr std::uint32_t crc32(std::string_view bytes) {
  std::uint32_t crc = 0xFFFFFFFFu;
  for (unsigned char b : bytes) {
    crc = kCrc32Table[(crc ^ b) & 0xFFu] ^ (crc >> 8);
  }
  return crc ^ 0xFFFFFFFFu;
}

// Compile-time tests: the build fails if the implementation is wrong.
static_assert(kCrc32Table[1] == 0x77073096u);
static_assert(kCrc32Table[255] == 0x2D02EF8Du);
static_assert(crc32("123456789") == 0xCBF43926u, "CRC-32 check value");

int main() {
  const char packet[] = "T+00123.456,ALT=00450.2,MODE=ASCENT";
  std::printf("crc32(packet) = 0x%08X\n", crc32(packet));
  std::printf("table[1] = 0x%08X, table size = %zu bytes\n", kCrc32Table[1], sizeof(kCrc32Table));
  return 0;
}
// Output:
// crc32(packet) = 0x75F2B455
// table[1] = 0x77073096, table size = 1024 bytes
```

Step by step. `make_crc32_table` loops over all 256 possible byte values and, for each one, shifts and mixes its bits eight times. Assigning its result to `constexpr auto kCrc32Table` forces the compiler to do all of that while building. The table is $256 \times 4 = 1024$ bytes, which is what the program prints.

The three `static_assert` lines are the interesting part. `0xCBF43926` is the published check value of CRC-32 over the text `123456789`. If anyone edits the polynomial, the shift direction or the final flip of the bits, the program stops building. Then the very same `crc32` function runs at run time on the packet, reading the table the compiler built.

Sanity check: Python's `zlib.crc32` gives `0x75F2B455` for the same packet.
:::

::: example A sine table for a processor without a fast sine
Some flight processors, and the programmable chips called FPGAs, have no quick way to compute a sine. A common trick is a table of sines plus **linear interpolation** — joining neighboring table entries with straight lines and reading off the line. `std::sin` is not guaranteed to work at compile time, so the table below computes its own sine with a **[[Taylor series|taylor-sine]]** — a sum of ever-smaller terms — and then checks itself.

```cpp
#include <array>
#include <cmath>
#include <cstdio>

// std::sin is not guaranteed usable at compile time, so compute it ourselves:
// a Taylor series after reducing the argument to [-pi, pi].
constexpr double kPi = 3.14159265358979323846;

constexpr double sin_series(double x) {
  while (x > kPi) x -= 2.0 * kPi;
  while (x < -kPi) x += 2.0 * kPi;
  double term = x, sum = x;
  for (int n = 1; n <= 12; ++n) {
    term *= -x * x / ((2.0 * n) * (2.0 * n + 1.0));
    sum += term;
  }
  return sum;
}

constexpr int kTableSize = 1024;   // one full turn
constexpr std::array<double, kTableSize> make_sine_table() {
  std::array<double, kTableSize> t{};
  for (int i = 0; i < kTableSize; ++i) t[i] = sin_series(2.0 * kPi * i / kTableSize);
  return t;
}
constexpr auto kSine = make_sine_table();

static_assert(kSine[0] == 0.0);
static_assert(kSine[kTableSize / 4] > 0.999999999 && kSine[kTableSize / 4] < 1.000000001);   // series rounding: 1.0000000000000002
static_assert(sin_series(kPi / 6.0) > 0.4999999999 && sin_series(kPi / 6.0) < 0.5000000001);

// Run-time lookup with linear interpolation: a few flops, no transcendental call.
double fast_sin(double angle_rad) {
  double turns = angle_rad / (2.0 * kPi);
  turns -= std::floor(turns);
  const double pos = turns * kTableSize;
  const int i = static_cast<int>(pos);
  const double frac = pos - i;
  const double a = kSine[i];
  const double b = kSine[(i + 1) % kTableSize];
  return a + frac * (b - a);
}

int main() {
  double worst = 0.0;
  for (int k = 0; k < 100000; ++k) {
    const double x = 0.000123 * k;
    worst = std::fmax(worst, std::fabs(fast_sin(x) - std::sin(x)));
  }
  std::printf("fast_sin(1.0) = %.9f  std::sin(1.0) = %.9f\n", fast_sin(1.0), std::sin(1.0));
  std::printf("worst interpolation error over 100000 angles: %.2e\n", worst);
  std::printf("table: %d entries, %zu bytes, built before the program ran\n", kTableSize, sizeof(kSine));
  return 0;
}
// Output:
// fast_sin(1.0) = 0.841470594  std::sin(1.0) = 0.841470985
// worst interpolation error over 100000 angles: 4.71e-06
// table: 1024 entries, 8192 bytes, built before the program ran
```

How the lookup works. `fast_sin` turns the angle into a fraction of a full turn and throws away whole turns with `std::floor`. It multiplies by 1024 to find a position in the table. The whole-number part `i` picks a table entry, and the leftover `frac` says how far to go toward the next one. At run time that is a handful of multiplications and additions, and no sine call at all.

Two lessons hide in the assertions. First, an earlier draft of the second `static_assert` demanded `kSine[256] <= 1.0`, and it would not build. Entry 256 is a quarter turn, where the sine is exactly $1$, but twelve rounded terms of the series add up to $1.0000000000000002$. Compile-time arithmetic rounds exactly like run-time arithmetic — both follow IEEE 754, the standard for computer decimals — so a compile-time test of a floating-point result needs a tolerance.

Second, the error figure. The table spacing is $h = 2\pi/1024$ radians. For linear interpolation the **[[standard error bound|interpolation-picture]]** is $\tfrac{1}{8} h^2$ times the largest size of the curve's second derivative, which for sine is $1$:

$$
\tfrac{1}{8}\left(\frac{2\pi}{1024}\right)^2 = 4.7 \times 10^{-6} .
$$

That matches the measured $4.71 \times 10^{-6}$: fine for a coarse attitude display, not for navigation — a design decision the table size makes visible.
:::

## Demanding compile time: consteval, constinit and if constexpr

`constexpr` *allows* compile-time work, and the compiler decides whether to do it. Three C++20 tools take the choice away.

A **`consteval`** function (say "const-eval") — also called an *immediate* function — *must* be worked out while building. Call it with a run-time value and the build fails with an error such as `'c' is not a constant expression`. Use it for anything that must never run on the vehicle: a timer's reload value, a scale factor, a configuration check.

A **`constinit`** variable is a global (or a `static` local) whose starting value must be a constant expression. So it is filled in while building and sits in the program as data. This removes a whole family of embedded bugs, the **[[static initialization order|static-init-order]]** problem: one global's set-up code reads another global that has not been set up yet, because C++ does not say which order globals in different source files get set up at start-up. A `constinit` global has no start-up code, so there is nothing to put in the wrong order.

**`if constexpr`** is an `if` decided while building. Inside a template, the branch not taken is not even compiled for that type. So one generic function can do different things for a `float` and a `std::int16_t`, and neither path has to make sense for the other type.

```cpp
#include <cstdint>
#include <cstdio>
#include <type_traits>

// consteval: must be evaluated at compile time; a run-time argument is a compile error.
consteval std::uint32_t ticks_for(double period_s, double tick_s) {
  return static_cast<std::uint32_t>(period_s / tick_s + 0.5);
}

// constinit: a global initialised at compile time, never by run-time code.
constinit std::uint32_t g_control_period_ticks = ticks_for(0.0025, 1.0e-6);

// if constexpr: a compile-time branch inside a template; the untaken branch is not compiled.
template <typename T>
const char* describe(T value) {
  if constexpr (std::is_floating_point_v<T>) {
    return value == value ? "floating point" : "floating point NaN";
  } else if constexpr (std::is_integral_v<T>) {
    return sizeof(T) <= 2 ? "small integer" : "integer";
  } else {
    return "something else";
  }
}

int main() {
  std::printf("control period = %u ticks\n", g_control_period_ticks);
  std::printf("%s / %s / %s\n", describe(1.5), describe(std::int16_t{3}), describe("text"));
  return 0;
}
// Output:
// control period = 2500 ticks
// floating point / small integer / something else
```

Check the tick count: a $2.5\,\mathrm{ms}$ control period on a $1\,\mu\mathrm{s}$ timer is $0.0025 / 0.000001 = 2500$ ticks, and the `+ 0.5` rounds to the nearest whole tick. `std::is_floating_point_v` and `std::is_integral_v` are **type traits**: yes-or-no questions about a type, answered while building — older cousins of lesson 5's concepts.

::: key
`constexpr` marks a variable or function the compiler *may* evaluate at compile time; `consteval` marks a function it *must*; `constinit` marks a static variable whose initializer must be a constant expression, so it needs no run-time initialization. `static_assert` fails the build when a compile-time condition is false. Compile-time evaluation follows IEEE rounding and refuses to perform undefined behavior.
:::

## Units as types

Think of a grocery receipt. You can add apples to apples, but "3 apples plus 2 dollars" is nonsense. Physics works the same way: you can add a length to a length, but never a length to a time. Dividing is different. A length divided by a time is a new kind of thing, a speed.

Lesson 2 wrapped a `double` in `struct Seconds`. That needs a new struct for every unit, and cannot say that meters divided by seconds gives meters per second. A template can.

The idea: every physical unit is lengths, times and masses raised to whole-number powers. Speed is $\mathrm{m^1\,s^{-1}}$. Force is $\mathrm{kg\,m\,s^{-2}}$. So a `Quantity<L, T, M>` stores those three powers — the **exponents** of length, time and mass — as part of its *type*. Then:

- multiplying two quantities **adds** their exponents ($\mathrm{m} \times \mathrm{m} = \mathrm{m}^2$);
- dividing **subtracts** them ($\mathrm{m} / \mathrm{s} = \mathrm{m^1\,s^{-1}}$);
- adding requires the exponents to **match**, or there is no `+` to call.

The compiler decides all of this from the types. The only thing left when the program runs is a plain `double`.

::: example Dimensions the compiler adds and subtracts
```cpp
#include <iostream>

// A quantity with dimensions length^L time^T mass^M, tracked by the compiler.
template <int L, int T, int M>
struct Quantity {
  double value;
  constexpr explicit Quantity(double v) : value(v) {}
};

template <int L, int T, int M>
constexpr Quantity<L, T, M> operator+(Quantity<L, T, M> a, Quantity<L, T, M> b) {
  return Quantity<L, T, M>{a.value + b.value};
}
template <int L1, int T1, int M1, int L2, int T2, int M2>
constexpr Quantity<L1 + L2, T1 + T2, M1 + M2> operator*(Quantity<L1, T1, M1> a, Quantity<L2, T2, M2> b) {
  return Quantity<L1 + L2, T1 + T2, M1 + M2>{a.value * b.value};
}
template <int L1, int T1, int M1, int L2, int T2, int M2>
constexpr Quantity<L1 - L2, T1 - T2, M1 - M2> operator/(Quantity<L1, T1, M1> a, Quantity<L2, T2, M2> b) {
  return Quantity<L1 - L2, T1 - T2, M1 - M2>{a.value / b.value};
}
template <int L, int T, int M>
constexpr Quantity<L, T, M> operator*(double k, Quantity<L, T, M> a) { return Quantity<L, T, M>{k * a.value}; }

using Length       = Quantity<1, 0, 0>;
using Time         = Quantity<0, 1, 0>;
using Mass         = Quantity<0, 0, 1>;
using Velocity     = Quantity<1, -1, 0>;
using Acceleration = Quantity<1, -2, 0>;
using Force        = Quantity<1, -2, 1>;

constexpr Length operator""_m(long double v) { return Length{static_cast<double>(v)}; }
constexpr Time operator""_s(long double v) { return Time{static_cast<double>(v)}; }
constexpr Mass operator""_kg(long double v) { return Mass{static_cast<double>(v)}; }

int main() {
  constexpr Length burn_distance = 2500.0_m;
  constexpr Time burn_time = 12.5_s;
  constexpr Velocity v = burn_distance / burn_time;            // Quantity<1,-1,0>
  constexpr Acceleration a = v / burn_time;                    // Quantity<1,-2,0>
  constexpr Mass stage = 25000.0_kg;
  constexpr Force thrust = stage * a;                          // Quantity<1,-2,1>
  static_assert(v.value == 200.0);
  static_assert(thrust.value == 400000.0);

  std::cout << "v = " << v.value << " m/s, a = " << a.value << " m/s^2, F = " << thrust.value << " N\n";
  // constexpr auto nonsense = burn_distance + burn_time;   // error: no operator+ for L=1,T=0 and L=0,T=1
  // Velocity wrong = burn_time / burn_distance;            // error: Quantity<-1,1,0> is not Velocity
  std::cout << "sizeof(Force) = " << sizeof(Force) << " (same as a double)\n";
  return 0;
}
// Output:
// v = 200 m/s, a = 16 m/s^2, F = 400000 N
// sizeof(Force) = 8 (same as a double)
```

Follow the numbers and the types together.

1. Distance over time: $2500\,\mathrm{m} / 12.5\,\mathrm{s} = 200\,\mathrm{m/s}$. The exponents go $(1,0,0) - (0,1,0) = (1,-1,0)$, which is `Velocity`.
2. That speed gained over the same $12.5\,\mathrm{s}$: $200 / 12.5 = 16\,\mathrm{m/s^2}$. Exponents $(1,-1,0) - (0,1,0) = (1,-2,0)$, which is `Acceleration`.
3. On a $25\,000\,\mathrm{kg}$ stage, $F = ma = 25\,000 \times 16 = 400\,000\,\mathrm{N} = 400\,\mathrm{kN}$. Exponents $(0,0,1) + (1,-2,0) = (1,-2,1)$, which is `Force`.

Sanity check: $16\,\mathrm{m/s^2}$ is about $1.6\,g$, a believable push for a rocket stage.

Now uncomment either error line and the build stops: `no match for 'operator+' (operand types are 'Quantity<1, 0, 0>' and 'Quantity<0, 1, 0>')`. The `operator""_m` lines define **user-defined literals**, so `2500.0_m` reads as a length right in the source.

Every object is one `double` wide — 8 bytes — and every operation compiles to the same instructions as bare arithmetic. All the checking happened in the types and is gone by run time. This is what **[[zero-cost abstraction|zero-cost]]** means when the phrase is used honestly.
:::

::: key
Units as types: a `Quantity<L, T, M>` template carries dimension exponents in its type; `constexpr` operators add exponents on `*`, subtract on `/`, and require equal exponents on `+`. A dimensional error is a compile error, and the run-time object is a bare `double`.
:::

## Fixed point with a compile-time scale

Picture a shop that keeps its prices in whole cents. It never stores $\$1.25$; it stores $125$ and remembers, somewhere, "divide by 100". That is **fixed point**: an ordinary integer with an agreed scale. Lesson 1 described it as the format numbers often arrive in from sensors and leave in toward actuators.

The danger is the word "remembers". Nothing stops you adding a number scaled by $2^{16}$ to one scaled by $2^{24}$, and the sum is garbage that looks fine. The cure: make the number of fractional bits a template parameter. Then the scale is part of the **type**, the compiler can work out conversions and resolution with `constexpr`, and two different scales are two different types that cannot be mixed by accident.

The usual name is a **[[Q format|q-format]]**. "Q15.16" means 15 bits for the whole-number part and 16 bits for the fraction, plus a sign bit: 32 bits in all. One count is worth $2^{-16}$.

::: example A Q16 fixed-point type
```cpp
#include <cstdint>
#include <cstdio>

// Signed fixed point with FracBits fractional bits in a 32-bit word (Q(31-FracBits).FracBits).
template <int FracBits>
class Fixed {
 public:
  static_assert(FracBits > 0 && FracBits < 31, "fractional bits must leave room for the integer part");
  static constexpr std::int32_t kOne = std::int32_t{1} << FracBits;
  static constexpr double resolution() { return 1.0 / kOne; }
  static constexpr double max_value() { return (2147483647.0) / kOne; }

  constexpr Fixed() = default;
  static constexpr Fixed from_raw(std::int32_t raw) { Fixed f; f.raw_ = raw; return f; }
  static constexpr Fixed from_double(double v) {
    // round to nearest; a real flight version would also saturate
    const double scaled = v * kOne;
    return from_raw(static_cast<std::int32_t>(scaled + (scaled >= 0 ? 0.5 : -0.5)));
  }
  constexpr double to_double() const { return static_cast<double>(raw_) / kOne; }
  constexpr std::int32_t raw() const { return raw_; }

  constexpr Fixed operator+(Fixed o) const { return from_raw(raw_ + o.raw_); }
  constexpr Fixed operator*(Fixed o) const {
    // widen to 64 bits so the product of two Q.F values does not overflow, then rescale
    const std::int64_t wide = static_cast<std::int64_t>(raw_) * o.raw_;
    return from_raw(static_cast<std::int32_t>(wide >> FracBits));
  }

 private:
  std::int32_t raw_ = 0;
};

using Q16 = Fixed<16>;          // Q15.16: range about +/-32768, resolution 2^-16

static_assert(Q16::resolution() == 1.0 / 65536.0);
static_assert(Q16::from_double(1.0).raw() == 65536);
static_assert(Q16::from_double(0.5).raw() == 32768);
static_assert((Q16::from_double(1.5) * Q16::from_double(2.0)).to_double() == 3.0);

int main() {
  // A gyro register: 16-bit counts at 0.01 deg/s per count. Convert to Q16 rad/s.
  const std::int16_t register_counts = 1234;                   // 12.34 deg/s
  constexpr double kDegPerCount = 0.01;
  constexpr double kRadPerDeg = 3.14159265358979323846 / 180.0;
  const Q16 rate = Q16::from_double(register_counts * kDegPerCount * kRadPerDeg);

  std::printf("Q16 resolution   = %.3e (about %.3e deg/s)\n", Q16::resolution(), Q16::resolution() / kRadPerDeg);
  std::printf("Q16 max          = %.1f\n", Q16::max_value());
  std::printf("rate raw         = %d\n", rate.raw());
  std::printf("rate             = %.6f rad/s (exact %.6f)\n", rate.to_double(), 12.34 * kRadPerDeg);
  const Q16 dt = Q16::from_double(0.0025);                    // 400 Hz step
  const Q16 dtheta = rate * dt;
  std::printf("angle per step   = %.9f rad (exact %.9f)\n", dtheta.to_double(), 12.34 * kRadPerDeg * 0.0025);
  return 0;
}
// Output:
// Q16 resolution   = 1.526e-05 (about 8.743e-04 deg/s)
// Q16 max          = 32768.0
// rate raw         = 14115
// rate             = 0.215378 rad/s (exact 0.215374)
// angle per step   = 0.000534058 rad (exact 0.000538434)
```

Read the numbers the way a fixed-point designer would.

1. **Resolution.** One count is $2^{-16} = 1.526 \times 10^{-5}$ rad/s. Converting to degrees ($\times 180/\pi$) gives about $8.7 \times 10^{-4}$ degrees per second.
2. **The rate.** The gyro says 1234 counts of $0.01$ °/s, so $12.34$ °/s. In radians that is $12.34 \times \pi/180 = 0.215374$ rad/s. Multiply by $65\,536$ to get $14\,114.7$ counts, which rounds to $14\,115$. The stored rate is within half a count of the truth — an error of only about $0.002\%$.
3. **The angle per step.** Multiply by the $2.5\,\mathrm{ms}$ step. The true angle is $5.38 \times 10^{-4}$ rad, which is only about $35.3$ counts of Q16. The product is cut down to $35$ counts, and together with the rounding of `dt` that makes the stored angle $0.8\%$ too small. That is four hundred times worse than the rate's error.

That last line is the warning: each signal needs its own format. A small per-step angle wants Q8.24 (resolution $2^{-24} \approx 6 \times 10^{-8}$, so the same angle is about 9033 counts) or a 64-bit accumulator, and `Fixed<24>` is one line away. The type parameter shows the choice in every signature, and the compiler refuses to add a `Fixed<16>` to a `Fixed<24>`.
:::

::: warning
Compile-time floating-point arithmetic is still floating-point arithmetic. A `static_assert` that compares a computed `double` for exact equality will fail for the same rounding reasons a run-time equality test would, as the sine table showed. Compare against a tolerance, or assert on integer-valued results (a raw fixed-point count, a CRC) where equality is exact.
:::

::: warning
`constexpr` on a function does not make it run at compile time. Only a place that *requires* a constant — initializing a `constexpr` variable, a `static_assert`, a template argument — guarantees that. `const auto table = make_table();` may well be computed at run time during start-up. Write `constexpr auto table = make_table();` when you mean the compiler to do the work, or mark the function `consteval` when it must never run on the target.
:::

## Check yourself

::: check
What is the difference between `const double kMu = compute_mu();` and `constexpr double kMu = compute_mu();`, and what must be true of `compute_mu` for the second to compile?
:::

::: answer
The `const` version only promises that `kMu` is not changed after it is set. `compute_mu()` may run at start-up and do anything.

The `constexpr` version requires the starting value to be a constant expression worked out by the compiler. So `compute_mu` must itself be declared `constexpr`, and running it must involve no file or device input and output, no reading of run-time state, and no undefined behavior.

In return, `kMu` can be used as an array size or inside a `static_assert`, and it sits in the program as a literal number rather than as code.
:::

::: check
A colleague writes `const auto kCrcTable = make_crc32_table();` at global scope and is surprised to see the table being computed during start-up in a profile. Explain, and fix it.
:::

::: answer
`constexpr` on `make_crc32_table` *allows* compile-time evaluation but does not *require* it. A `const` variable is not a place that demands a constant expression, so the compiler is free to call the function during start-up — and at low optimization levels it will.

Declaring the variable `constexpr auto kCrcTable = make_crc32_table();` (or `constinit`) forces the compiler to evaluate it. The table then becomes read-only data with no start-up cost. Adding a `static_assert` on one entry proves it, because a `static_assert` can only read a value known while building.
:::

::: check
In the `Quantity` example, what is the type of `stage * a / burn_time`, and what physical quantity is it? Would `thrust + burn_distance` compile?
:::

::: answer
`stage` is `Quantity<0, 0, 1>` and `a` is `Quantity<1, -2, 0>`. Multiplying adds exponents, so `stage * a` is `Quantity<1, -2, 1>`, a force.

Dividing by `burn_time`, which is `Quantity<0, 1, 0>`, subtracts exponents: `Quantity<1, -3, 1>`. That is force per unit time — how fast the thrust is changing, in newtons per second.

`thrust + burn_distance` does not compile. `operator+` exists only for two quantities with identical exponents, and `Quantity<1, -2, 1>` plus `Quantity<1, 0, 0>` matches no version of it. The check costs nothing at run time; it is decided entirely from the types.
:::

::: check
Why did `Q16::from_double(1.5) * Q16::from_double(2.0)` pass an exact-equality `static_assert` while the sine table needed a tolerance?
:::

::: answer
The fixed-point product is integer arithmetic. $1.5$ is exactly $98\,304$ counts and $2.0$ is exactly $131\,072$. Their 64-bit product shifted right by 16 is exactly $196\,608$ counts, which converts back to exactly $3.0$, because every value involved can be written exactly in binary.

The sine table's entries come from a floating-point series with a dozen rounded multiplications and additions, so the result at a quarter turn is $1.0000000000000002$ rather than $1$.

Rule of thumb: equality is exact for integer-valued results and for values binary can represent exactly. Anything computed through rounding needs a tolerance.
:::

::: check
The exercise asks for a `static_assert` that the propagator's state type is fixed size. Give one, using Eigen's `Matrix<double, 6, 1>` as the state type, and say why such a check belongs in the code rather than in a test.
:::

::: answer
For a fixed-size Eigen type the size is a compile-time constant, so

`static_assert(State::SizeAtCompileTime == 6, "state must be a fixed-size 6-vector");`

or `static_assert(State::RowsAtCompileTime == 6 && State::ColsAtCompileTime == 1);` builds for `Eigen::Matrix<double, 6, 1>`. It fails for a dynamic `Eigen::VectorXd`, whose size constant is the special marker value `Eigen::Dynamic`.

It belongs in the code because a run-time test can only observe that one particular build allocated nothing. The assertion forbids the dynamic type in *every* build — including the one someone makes after swapping the state type "temporarily".
:::

## Summary

| Item | Meaning |
| --- | --- |
| `const` | not modified after initialization; may be computed at run time |
| `constexpr` variable | initialized from a constant expression; usable as an array bound or template argument |
| `constexpr` function | may be evaluated at compile time with constant arguments; ordinary otherwise |
| `consteval` | must be evaluated at compile time; run-time argument is a compile error |
| `constinit` | static variable initialized at compile time; no dynamic initialization order problem |
| `static_assert(cond, "msg")` | build fails if `cond` is false; a unit test with no run-time cost |
| `if constexpr` | compile-time branch; the untaken branch is not compiled |
| compile-time table | `constexpr auto t = make_table();` — literal data in read-only memory |
| CRC-32 check value | `crc32("123456789") == 0xCBF43926` |
| interpolation error | linear table with spacing $h$: worst error about $\tfrac{1}{8}h^2 \max\lvert f''\rvert$ |
| `Quantity<L, T, M>` | exponents in the type; `*` adds, `/` subtracts, `+` requires equality |
| `Fixed` with a `FracBits` parameter | fixed point with resolution $2^{-\text{FracBits}}$ in the type |
| compile-time floating point | IEEE rounding applies; compare with a tolerance |

The next lesson is about what happens when a value cannot be known at compile time and turns out wrong at run time — how flight code reports and handles errors without the exception machinery Python relies on.

::: context compile-vs-run Two different moments
A C++ program lives through two separate moments. First the compiler reads your source and builds the program file, on an engineer's computer, weeks before flight. Later the flight computer runs that file. `constexpr` work happens in the first moment, so the vehicle only ever sees the answers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="90" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">source</text>
  <text x="55" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">code</text>
  <rect x="135" y="30" width="90" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">compiler</text>
  <text x="180" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">builds tables</text>
  <rect x="260" y="30" width="90" height="44" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">flight</text>
  <text x="305" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">computer</text>
  <line x1="100" y1="52" x2="128" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="134,52 126,48 126,56" fill="#1f2a44"/>
  <line x1="225" y1="52" x2="253" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="259,52 251,48 251,56" fill="#1f2a44"/>
  <text x="117" y="100" font-size="12" text-anchor="middle" fill="#1d6fd1">compile time</text>
  <text x="305" y="100" font-size="12" text-anchor="middle" fill="#b4232c">run time</text>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">static_assert fails here, not in flight</text>
</svg>
```
:::

::: context ub-at-compile-time The compiler as a free bug detector
Undefined behavior is the set of operations C++ gives no meaning to — overflowing a signed integer, reading past the end of an array, reading a variable that was never set. At run time these often *seem* to work, which is why they are dangerous. When the compiler evaluates a `constexpr` function, though, it is required to stop with an error the moment it hits one. So calling your function inside a `static_assert` with test inputs checks that path for undefined behavior for free. Lesson 12 returns to undefined behavior and the run-time tools that hunt it.
:::

::: context read-only-data Why read-only data is safer
A running program's memory is split into regions. Some can be written, some only read. A `constexpr` table goes in a read-only region, and on many flight computers that region lives in flash memory next to the program's instructions. A stray pointer bug that scribbles over memory cannot change it: the processor refuses the write. Compare a table filled in by start-up code, which sits in ordinary writable memory for the whole flight, where one bad write could quietly change a sine value or a CRC entry.
:::

::: context crc-idea A fingerprint for a packet
A CRC — cyclic redundancy check — boils a whole message down to one 32-bit number. The sender computes it and attaches it. The receiver computes it again from the bytes that arrived. If even one bit flipped on the way, the two numbers almost surely differ, and the packet is thrown away. It is a cousin of the check digit on a barcode, but far stronger: CRC-32 catches every single-bit error and every burst of flipped bits up to 32 long. The same CRC-32 guards Ethernet frames, ZIP files and PNG images.
:::

::: context taylor-sine Building a sine out of multiplication
Near zero, $\sin x$ is almost exactly $x$. A better guess subtracts $x^3/6$, and a better one still adds back $x^5/120$:

$$
\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \cdots
$$

Each term is the previous one times $-x^2/\big((2n)(2n+1)\big)$, which is exactly the line `term *= ...` in the code. Only multiplication and addition are needed, so the compiler can do it. Keeping $x$ between $-\pi$ and $\pi$ makes the terms shrink fast. The calculus module shows where this series comes from.
:::

::: context interpolation-picture Why the error goes as the spacing squared
Linear interpolation draws straight chords between table points. The curve bulges away from each chord, most in the middle. Halve the spacing and the bulge shrinks to a quarter, which is why the error bound has $h^2$ in it. Here the spacing is a huge $\pi/4$ so the gaps are visible; the real table uses $2\pi/1024$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="30.0,150.0 35.0,144.2 40.0,138.5 45.0,132.8 50.0,127.1 55.0,121.5 60.0,116.0 65.0,110.6 70.0,105.3 75.0,100.1 80.0,95.0 85.0,90.1 90.0,85.3 95.0,80.8 100.0,76.4 105.0,72.2 110.0,68.3 115.0,64.5 120.0,61.0 125.0,57.7 130.0,54.7 135.0,52.0 140.0,49.5 145.0,47.3 150.0,45.4 155.0,43.7 160.0,42.4 165.0,41.4 170.0,40.6 175.0,40.2 180.0,40.0 185.0,40.2 190.0,40.6 195.0,41.4 200.0,42.4 205.0,43.7 210.0,45.4 215.0,47.3 220.0,49.5 225.0,52.0 230.0,54.7 235.0,57.7 240.0,61.0 245.0,64.5 250.0,68.3 255.0,72.2 260.0,76.4 265.0,80.8 270.0,85.3 275.0,90.1 280.0,95.0 285.0,100.1 290.0,105.3 295.0,110.6 300.0,116.0 305.0,121.5 310.0,127.1 315.0,132.8 320.0,138.5 325.0,144.2 330.0,150.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="30,150 105,72.2 180,40 255,72.2 330,150"/>
  <g fill="#1f2a44"><circle cx="30" cy="150" r="3"/><circle cx="105" cy="72.2" r="3"/><circle cx="180" cy="40" r="3"/><circle cx="255" cy="72.2" r="3"/><circle cx="330" cy="150" r="3"/></g>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">sin x</text>
  <text x="70" y="128" font-size="12" text-anchor="middle" fill="#b4232c">chords</text>
  <text x="30" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="180" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">π/2</text>
  <text x="330" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">π</text>
</svg>
```
:::

::: context static-init-order Who gets set up first?
Imagine two classmates told to arrive at 8:00, where one must copy notes from the other. If the copier arrives first, the notes are blank. Globals with run-time set-up code are like that. C++ sets up globals within one source file in order, but between different source files the order is not specified. If the gyro driver's global reads a calibration global from another file during start-up, it may read it before it has been filled in. The program works on one build and fails on the next. `constinit` sidesteps it: no set-up code, so no order.
:::

::: context zero-cost What you do not use, you do not pay for
Bjarne Stroustrup, who created C++, set two goals for its features. What you do not use, you do not pay for. And what you do use, you could not write more cheaply by hand. The `Quantity` template meets both: a program with unit checking is byte for byte the program you would get with bare `double`s. The phrase is often stretched to features that do cost something at run time, which is why it is worth checking — `sizeof(Force) == 8` is the check here.
:::

::: context q-format Reading a Q15.16 number
A Q15.16 number is a 32-bit integer with an imaginary binary point placed 16 bits from the right. Reading the raw integer and dividing by $2^{16} = 65\,536$ gives the value. The biggest raw value, $2^{31} - 1$, divided by $65\,536$ is a hair under $32\,768$; one count is $2^{-16} \approx 0.0000153$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="10" height="26" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="30" y="30" width="150" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="180" y="30" width="160" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="66" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="180" y="15" font-size="11" text-anchor="middle" fill="#1f2a44">binary point</text>
  <text x="25" y="80" font-size="11" text-anchor="middle" fill="#b4232c">sign</text>
  <text x="105" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">15 integer bits</text>
  <text x="260" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">16 fraction bits</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">value = raw integer ÷ 65 536</text>
</svg>
```
:::
