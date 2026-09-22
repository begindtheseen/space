---
id: l07-constexpr-compile-time
title: constexpr and compile-time computation
minutes: 25
covers:
  - constexpr and compile-time computation
---

The best time to compute something for a flight computer is before launch. Better still is before the binary exists. A lookup table built while the compiler runs costs nothing at boot and cannot be corrupted by a bug in the initialisation code; a checksum implementation verified by the compiler cannot ship wrong; a unit mismatch caught at compile time never reaches the vehicle. C++ has grown, over three standards, a complete facility for this: `constexpr` marks variables and functions the compiler may evaluate itself, `static_assert` turns a compile-time value into a build-breaking test, and C++20's `consteval` and `constinit` let you *demand* compile-time evaluation rather than merely permit it.

This is a different use of the language from what a Python programmer expects. Python has no compile-time; everything happens when the script runs, including building tables and checking units, so a mistake in either shows up as an exception on the pad — or, worse, as a plausible number. In C++ the same code, marked `constexpr`, runs inside the compiler, and the result is baked into the executable as data. The run-time program does not compute the sine table; it reads it.

Three flight-software idioms in this lesson rest on the mechanism: compile-time tables (a CRC table for telemetry, a sine table for a processor without fast transcendentals), *units as types* — a `Quantity` template whose dimensions the compiler adds and subtracts so that a length divided by a time *is* a velocity and a length plus a time is a compile error — and a fixed-point type whose scale is part of its type. All three run at compile time where they can, and at zero overhead where they cannot.

## const, constexpr and what "constant expression" means

`const` means the value does not change after initialisation. `constexpr` means more: the value is known to the compiler, computed from a *constant expression*, and usable wherever the language demands a compile-time constant — an array bound, a template argument, a `static_assert`, a `case` label. `const int n = read_sensor();` is legal; `constexpr int n = read_sensor();` is not, because the compiler cannot evaluate a sensor read.

A `constexpr` *function* is one the compiler is permitted to evaluate during compilation when its arguments are constants. The same function is an ordinary function when called with run-time arguments; the keyword grants an ability, it does not restrict use. Since C++14 such a function may contain loops, local variables and branches, and since C++20 nearly the whole language, with the exceptions of anything whose result the compiler could not reproduce: I/O, reading uninitialised memory, undefined behaviour of any kind (a compile-time evaluation that overflows a signed integer is a compile *error*, which makes `constexpr` evaluation a free UB checker for whatever it touches).

```cpp
constexpr double square(double x) { return x * x; }   // usable at compile time or run time

constexpr double at_compile_time = square(3.0);       // evaluated by the compiler
static_assert(at_compile_time == 9.0);
const double at_run_time = square(argc + 0.5);        // same function, run-time argument
// Output: square: 9.0 at compile time, 2.25 at run time  (for argc == 1)
```

`static_assert(condition, "message")` is evaluated by the compiler and fails the build if the condition is false. It is a unit test that runs on every compile, costs nothing at run time, and can check anything a constant expression can express: the size of a struct, the value of a table entry, the result of an algorithm on known input. The message is optional since C++17 but always worth writing.

```text
sa.cpp:3:30: error: static assertion failed: Packet must be 14 bytes for the telemetry link
sa.cpp:3:30: note: the comparison reduces to '(24 == 14)'
```

That particular failure — a struct of a 4-byte, an 8-byte and a 2-byte field coming to 24 bytes rather than 14 — is padding, and lesson 9 explains it. The point here is that the `static_assert` caught the layout assumption before a single packet was sent.

## Tables built by the compiler

A `constexpr` function that returns a `std::array` can fill a table with a loop, and assigning its result to a `constexpr` variable forces the whole computation to happen at compile time. The table lands in read-only memory as literal data; the function is never called at run time and may not even exist in the binary.

::: example A CRC-32 table computed at compile time, and verified there
Telemetry frames carry a CRC-32 so the ground can reject corrupted packets. The standard implementation uses a 256-entry table derived from the polynomial. Here the compiler derives it.

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

The three `static_assert` lines are the interesting part. `0xCBF43926` is the published check value of CRC-32 over the ASCII string `123456789`; if anyone edits the polynomial, the shift direction or the final inversion, the program stops compiling. The same `crc32` function then runs at run time on the packet — the output agrees with Python's `zlib.crc32` to the last digit — reading the table the compiler built. Nothing is computed twice, and nothing is trusted that the compiler did not check.
:::

::: example A sine table for a processor without a fast sine
`std::sin` is not guaranteed to be usable in a constant expression, so the table below computes its own sine with a Taylor series and then checks itself. At run time a lookup with linear interpolation costs a handful of floating-point operations and no transcendental call — the trade a flight processor without a fast maths library, or an FPGA design, makes routinely.

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

Two lessons hide in the assertions. The first version of the second `static_assert` demanded `kSine[256] <= 1.0` and failed to compile: twelve terms of the series at $\pi/2$ round to $1.0000000000000002$. Compile-time arithmetic is IEEE arithmetic, with the same rounding you met in the Python module, and a compile-time test of a floating-point result needs a tolerance like any other. The second lesson is the error figure: linear interpolation on 1024 points gives a worst case of $4.7 \times 10^{-6}$, which is $\tfrac{1}{8}\,(2\pi/1024)^2 = 4.7 \times 10^{-6}$ from the standard interpolation-error bound — adequate for a coarse attitude display, inadequate for navigation, and a design decision the table size makes explicit.
:::

## Demanding compile time: consteval, constinit and if constexpr

`constexpr` permits compile-time evaluation and the compiler decides. Three C++20 tools remove the discretion.

A `consteval` function — an *immediate* function — must be evaluated at compile time, and calling it with a run-time argument is a compile error. It is the right marking for anything that must never run on the vehicle: computing a timer reload value from a period, deriving a scale factor, checking a configuration constant.

`constinit` on a variable with static storage — a global or a `static` local — requires that its initialiser be a constant expression, so the variable is initialised at compile time and placed in the binary as data. This removes an entire class of embedded bug: the *static initialisation order* problem, where one global's constructor reads another global that has not been constructed yet, because the order of dynamic initialisation across translation units is unspecified. A `constinit` global has no dynamic initialisation to order.

`if constexpr` is a branch evaluated at compile time. Inside a template, the branch not taken is not even compiled for that instantiation, so a generic function can do different things for `float` and `std::int16_t` without either path having to compile for the other type.

```cpp
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
// Output:
// control period = 2500 ticks
// floating point / small integer / something else      (for 1.5, int16_t{3}, "text")
```

`std::is_floating_point_v` and `std::is_integral_v` are *type traits* from the `type_traits` header: compile-time predicates on types, the older cousins of the concepts you met in lesson 5.

::: key
`constexpr` marks a variable or function the compiler *may* evaluate at compile time; `consteval` marks a function it *must*; `constinit` marks a static variable whose initialiser must be a constant expression, so it needs no run-time initialisation. `static_assert` fails the build when a compile-time condition is false. Compile-time evaluation follows IEEE rounding and refuses to perform undefined behaviour.
:::

## Units as types

Lesson 2 wrapped a `double` in `struct Seconds` so that a function taking seconds could not be handed metres. That approach needs a new struct and a new set of operators for every unit, and it cannot express that metres divided by seconds gives metres per second. Templates over integer exponents can. A `Quantity<L, T, M>` carries the exponents of length, time and mass in its type; multiplying two quantities adds the exponents, dividing subtracts them, and adding requires them to match — all decided by the compiler from the types, with a plain `double` as the only run-time content.

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

A 2500 m burn over 12.5 s is $200\,\mathrm{m/s}$; that velocity gained over the same 12.5 s is $16\,\mathrm{m/s^2}$; on a 25 000 kg stage that is $F = ma = 400\,\mathrm{kN}$ — and the compiler knows the result is a force, because `stage * a` has type `Quantity<1, -2, 1>`, which is `Force`. Uncomment either error line and the build stops: `no match for 'operator+' (operand types are 'Quantity<1, 0, 0>' and 'Quantity<0, 1, 0>')`. `operator""_m` defines a *user-defined literal*, so `2500.0_m` reads as a length in the source. Every object is one `double` wide and every operation compiles to the same instructions as unadorned arithmetic; all the checking happened in the type system and is gone by the time the code runs. This is what "zero-cost abstraction" means when the phrase is used honestly.
:::

::: key
Units as types: a `Quantity<L, T, M>` template carries dimension exponents in its type; `constexpr` operators add exponents on `*`, subtract on `/`, and require equal exponents on `+`. A dimensional error is a compile error, and the run-time object is a bare `double`.
:::

## Fixed point with a compile-time scale

Lesson 1 described fixed point — an integer with an implied scale — as the representation at the sensor and actuator boundary. The danger of fixed point is that the scale is implied: nothing stops you adding a Q16.16 value to a Q8.24 one. Making the number of fractional bits a template parameter puts the scale in the type, and `constexpr` lets the conversions and the resolution be computed by the compiler.

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

Read the numbers as a fixed-point designer would. The resolution of Q16 is $2^{-16} = 1.526 \times 10^{-5}$, about $8.7 \times 10^{-4}\,^\circ/\mathrm{s}$: the 12.34°/s rate is stored as 14 115 counts and reproduced to within half a count. The last line is the warning. Multiplying the rate by a 2.5 ms step gives an angle of $5.4 \times 10^{-4}\,\mathrm{rad}$, only 35 counts of Q16, and the product's truncation from 35.3 to 35 counts is a 0.8 % error in the angle — far worse than the 0.002 % error in the rate. Fixed point demands that each signal have its own format: a small quantity like a per-step angle wants Q8.24 or a 64-bit accumulator, and the `Fixed<24>` instantiation is one line away. The type parameter makes that choice visible in every signature, and the compiler refuses to add a `Fixed<16>` to a `Fixed<24>` because they are different types.
:::

::: warning
Compile-time floating-point arithmetic is still floating-point arithmetic. A `static_assert` that compares a computed `double` for exact equality will fail for the same rounding reasons a run-time equality test would, as the sine table showed. Compare against a tolerance, or assert on integer-valued results (a raw fixed-point count, a CRC) where equality is exact.
:::

::: warning
`constexpr` on a function does not make it run at compile time; only a context that requires a constant — initialising a `constexpr` variable, a `static_assert`, a template argument — guarantees that. `const auto table = make_table();` may well be evaluated at run time during start-up. Write `constexpr auto table = make_table();` when you mean the compiler to do the work, or use `consteval` on the function when it must never run on the target.
:::

## Check yourself

::: check
What is the difference between `const double kMu = compute_mu();` and `constexpr double kMu = compute_mu();`, and what must be true of `compute_mu` for the second to compile?
:::

::: answer
The `const` version promises only that `kMu` is not modified after initialisation; `compute_mu()` may run at start-up and do anything. The `constexpr` version requires the initialiser to be a constant expression evaluated by the compiler, so `compute_mu` must itself be declared `constexpr`, and the evaluation must involve no I/O, no reading of run-time state and no undefined behaviour. In return `kMu` can be used as an array bound or in a `static_assert`, and it exists in the binary as a literal rather than as code.
:::

::: check
A colleague writes `const auto kCrcTable = make_crc32_table();` at global scope and is surprised to see the table being computed during start-up in a profile. Explain, and fix it.
:::

::: answer
`constexpr` on `make_crc32_table` permits compile-time evaluation but does not require it, and a `const` variable is not a context that demands a constant expression, so the compiler is free to emit a call at dynamic initialisation time — and at low optimisation levels it will. Declaring the variable `constexpr auto kCrcTable = make_crc32_table();` (or `constinit`) requires the initialiser to be evaluated by the compiler, and the table becomes read-only data with no start-up cost. Adding a `static_assert` on one entry then proves it.
:::

::: check
In the `Quantity` example, what is the type of `stage * a / burn_time`, and what physical quantity is it? Would `thrust + burn_distance` compile?
:::

::: answer
`stage` is `Quantity<0, 0, 1>`, `a` is `Quantity<1, -2, 0>`, so `stage * a` adds exponents to give `Quantity<1, -2, 1>`, a force. Dividing by `burn_time`, `Quantity<0, 1, 0>`, subtracts exponents: `Quantity<1, -3, 1>`, which is force per time — the rate of change of thrust, in newtons per second. `thrust + burn_distance` does not compile: `operator+` is defined only for two quantities with identical exponents, and `Quantity<1, -2, 1>` plus `Quantity<1, 0, 0>` matches no overload. The check costs nothing at run time; it is decided entirely from the types.
:::

::: check
Why did `Q16::from_double(1.5) * Q16::from_double(2.0)` pass an exact-equality `static_assert` while the sine table needed a tolerance?
:::

::: answer
The fixed-point product is integer arithmetic. $1.5$ is exactly $98\,304$ counts and $2.0$ exactly $131\,072$; their 64-bit product shifted right by 16 is exactly $196\,608$ counts, which converts back to exactly $3.0$ because all the values are representable in binary. The sine table's entries come from a floating-point series with twelve rounded multiplications and additions, so the result at $\pi/2$ is $1.0000000000000002$ rather than $1$. Equality is exact for integer-valued results and for binary-representable floating values; anything computed through rounding needs a tolerance.
:::

::: check
The exercise asks for a `static_assert` that the propagator's state type is fixed size. Give one, using Eigen's `Matrix<double, 6, 1>` as the state type, and say why such a check belongs in the code rather than in a test.
:::

::: answer
For a fixed-size Eigen type the size is a compile-time constant, so `static_assert(State::SizeAtCompileTime == 6, "state must be a fixed-size 6-vector");` — or `static_assert(State::RowsAtCompileTime == 6 && State::ColsAtCompileTime == 1);` — compiles for `Eigen::Matrix<double, 6, 1>` and fails for a dynamic `Eigen::VectorXd`, whose size constant is the sentinel `Eigen::Dynamic`. It belongs in the code because a run-time test can only observe that one particular build allocated nothing; the assertion forbids the dynamic type in every build, including the one someone produces after swapping the state type "temporarily".
:::

## Summary

| Item | Meaning |
| --- | --- |
| `const` | not modified after initialisation; may be computed at run time |
| `constexpr` variable | initialised from a constant expression; usable as an array bound or template argument |
| `constexpr` function | may be evaluated at compile time with constant arguments; ordinary otherwise |
| `consteval` | must be evaluated at compile time; run-time argument is a compile error |
| `constinit` | static variable initialised at compile time; no dynamic initialisation order problem |
| `static_assert(cond, "msg")` | build fails if `cond` is false; a unit test with no run-time cost |
| `if constexpr` | compile-time branch; the untaken branch is not compiled |
| compile-time table | `constexpr auto t = make_table();` — literal data in read-only memory |
| CRC-32 check value | `crc32("123456789") == 0xCBF43926` |
| `Quantity<L, T, M>` | exponents in the type; `*` adds, `/` subtracts, `+` requires equality |
| `Fixed` with a `FracBits` parameter | fixed point with resolution $2^{-\text{FracBits}}$ in the type |
| compile-time floating point | IEEE rounding applies; compare with a tolerance |

The next lesson is about what happens when a value cannot be known at compile time and is wrong at run time — how flight code reports and handles errors without the exception machinery Python relies on.
