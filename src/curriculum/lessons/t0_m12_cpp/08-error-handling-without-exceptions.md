---
id: l08-error-handling-without-exceptions
title: Error handling without exceptions
minutes: 24
covers:
  - error handling without exceptions
---

Python reports every failure the same way: it raises, the exception climbs the call stack until an `except` catches it, and if nothing does, the program prints a traceback and dies. C++ has the same mechanism — `throw`, `try`, `catch` — and its standard library uses it: `std::vector::at` throws on a bad index, `new` throws when memory runs out, `std::stoi` throws on bad text. And almost every flight software project compiles with exceptions switched off. This lesson explains why, and then teaches what flight code does instead: errors as values, checked at every call, with assertions that record faults rather than crash.

The unifying idea is that an error is data. A sensor timeout, a checksum failure, an out-of-range command are ordinary outcomes of ordinary functions, returned the way any other result is returned and handled by whichever caller has enough context to decide. Nothing happens behind the caller's back. A reviewer can read a function and see every path out of it, which is the property a hidden-control-flow mechanism like exceptions takes away.

Two of the Power of Ten rules you will meet in full in the next lesson live here: check the return value of every non-void function, and put at least two assertions in every function. Both are unenforceable with exceptions and natural without them.

## What exceptions are, and why flight code turns them off

`throw obj;` creates an exception object and starts *unwinding*: the run-time walks back up the call stack, running the destructor of every local along the way (which is why RAII and exceptions were designed together), until it finds a `catch` whose type matches. Modern compilers implement this with a "zero-cost" model: the non-throwing path pays nothing, and the throwing path pays for everything by consulting tables that describe each function's frame.

That model is precisely the problem for a hard-real-time system.

1. **Unbounded, unanalysable time.** The unwinder's running time depends on how deep the stack is, how many destructors run, and which tables it must search. There is no worst-case number to give a scheduler.
2. **Hidden control flow.** Any call may not return. A reviewer reading `angle += rate * dt;` cannot see that `rate` came from a function that might have thrown three frames down, and there is no way to enforce "check every error" when the errors bypass the call site.
3. **Memory and code size.** The exception object is allocated by the run-time (in libstdc++, through the heap with an emergency pool), and the unwind tables add to the binary.
4. **Toolchain support.** Compilers for flight processors and the real-time operating systems they run on have historically supported exceptions poorly or not at all.

The compiler flag is `-fno-exceptions`. With it, a `throw` in your own code is a compile error — `error: exception handling disabled, use '-fexceptions' to enable` — and library code that would have thrown calls `std::terminate` instead, which aborts the program:

```text
$ g++ -std=c++20 -fno-exceptions noexc.cpp -o noexc && ./noexc
about to index 6
terminate called after throwing an instance of 'std::out_of_range'
  what():  array::at: __n (which is 6) >= _Nm (which is 4)
```

Read that carefully. The bad index did not become a recoverable error; it became a crash. Under `-fno-exceptions` every throwing operation in the standard library is a latent abort, so flight code does not call them with inputs it has not already validated: `[]` after your own bounds check instead of `.at()`, a checked accessor of your own instead of `std::optional::value()`, no `std::stoi`. Exceptions remain the right tool in the code around the flight software — ground tooling, the simulation harness, the pybind11 layer that turns C++ errors into Python exceptions, the tests — and you will use `try`/`catch` there without apology.

::: key
Flight code compiles with `-fno-exceptions` because unwinding has no bounded worst-case time, because exceptions hide control flow so that no reviewer can verify that every error is checked, and because they cost memory and toolchain support. With the flag set, library code that would throw terminates the program instead, so validate before you call anything that can throw.
:::

## Errors as values: status codes

The plainest replacement is an enumeration returned from every function that can fail, with the actual result delivered through a reference parameter. Two attributes make the pattern safe. `[[nodiscard]]` on the return type makes the compiler warn wherever a caller drops the status, and `-Werror` turns that warning into a build failure — so the Power of Ten rule "check every return value" is enforced by the toolchain rather than by review. And an `enum class` with a fixed underlying type gives a status that packs into a telemetry word.

::: example A status enumeration, propagated by early return
```cpp
#include <cstdint>
#include <cstdio>
#include <string_view>

enum class Status : std::uint8_t { Ok, SensorTimeout, OutOfRange, NotInitialised };

std::string_view to_string(Status s) {
  switch (s) {
    case Status::Ok:             return "OK";
    case Status::SensorTimeout:  return "SENSOR_TIMEOUT";
    case Status::OutOfRange:     return "OUT_OF_RANGE";
    case Status::NotInitialised: return "NOT_INITIALISED";
  }
  return "UNKNOWN";
}

// Output through a reference parameter; the return value is the status and may not be ignored.
[[nodiscard]] Status read_gyro(int cycle, double& rate_rad_s) {
  if (cycle % 7 == 3) return Status::SensorTimeout;       // simulated dropout
  rate_rad_s = 0.01 * cycle;
  if (rate_rad_s > 0.05) return Status::OutOfRange;
  return Status::Ok;
}

[[nodiscard]] Status update_attitude(int cycle, double dt, double& angle_rad) {
  double rate = 0.0;
  if (const Status s = read_gyro(cycle, rate); s != Status::Ok) {
    return s;                                             // propagate; angle is untouched
  }
  angle_rad += rate * dt;
  return Status::Ok;
}

int main() {
  double angle = 0.0;
  int faults = 0;
  for (int cycle = 0; cycle < 8; ++cycle) {
    const Status s = update_attitude(cycle, 0.1, angle);
    if (s != Status::Ok) ++faults;
    std::printf("cycle %d: %-15s angle = %.4f rad\n", cycle, to_string(s).data(), angle);
  }
  std::printf("%d faults, last good angle held\n", faults);
  return 0;
}
// Output:
// cycle 0: OK              angle = 0.0000 rad
// cycle 1: OK              angle = 0.0010 rad
// cycle 2: OK              angle = 0.0030 rad
// cycle 3: SENSOR_TIMEOUT  angle = 0.0030 rad
// cycle 4: OK              angle = 0.0070 rad
// cycle 5: OK              angle = 0.0120 rad
// cycle 6: OUT_OF_RANGE    angle = 0.0120 rad
// cycle 7: OUT_OF_RANGE    angle = 0.0120 rad
// 3 faults, last good angle held
```

Every path is visible. `update_attitude` checks `read_gyro`'s status, returns it unchanged if it is not `Ok`, and only then touches the angle — so a failed read leaves the estimate exactly where it was, the "hold last good value" behaviour a control loop wants during a one-cycle dropout. The caller counts faults and could equally switch to a redundant gyro after three in a row. Delete the check in `main` and the compiler says:

```text
warning: ignoring return value of 'Status arm_igniter()', declared with attribute 'nodiscard' [-Wunused-result]
```

which `-Werror` makes a build failure. Note also `to_string(s).data()`: `printf` needs a C string, and a `std::string_view` of a literal provides one.
:::

## std::optional: a value or nothing

Some functions have no result without anything having gone *wrong*. A GPS receiver with three satellites has no fix. A table lookup outside the table has no entry. `std::find` may find nothing. For these, `std::optional` holds either a value or `std::nullopt`, in place, with no heap: `sizeof` a `std::optional` of `double` is 16 bytes, the value plus a flag. `has_value()` or a test in boolean context asks whether a value is present; `*` and `->` reach it; `value_or(fallback)` gives a default. The one member to avoid in flight code is `.value()`, which throws when empty — and under `-fno-exceptions`, terminates.

::: example Absent, but not an error
```cpp
#include <array>
#include <cstdio>
#include <optional>

struct GpsFix { double lat_deg, lon_deg, alt_m; };

// A fix may legitimately be absent; that is not an error, so optional fits.
std::optional<GpsFix> latest_fix(int satellites) {
  if (satellites < 4) return std::nullopt;
  return GpsFix{28.5623, -80.5774, 12.0};
}

// Table lookup that may fall outside the table.
std::optional<double> density_at(double altitude_km) {
  static constexpr std::array<double, 5> table{1.225, 0.4135, 0.08891, 0.01841, 0.003996};  // 0,10,20,30,40 km
  if (altitude_km < 0.0 || altitude_km > 40.0) return std::nullopt;
  const int i = static_cast<int>(altitude_km / 10.0);
  if (i >= 4) return table[4];
  const double frac = altitude_km / 10.0 - i;
  return table[i] + frac * (table[i + 1] - table[i]);
}

int main() {
  for (int sats : {3, 6}) {
    if (const auto fix = latest_fix(sats); fix.has_value()) {
      std::printf("%d satellites: fix at %.4f, %.4f, %.1f m\n", sats, fix->lat_deg, fix->lon_deg, fix->alt_m);
    } else {
      std::printf("%d satellites: no fix, holding last estimate\n", sats);
    }
  }
  for (double h : {5.0, 25.0, 55.0}) {
    const std::optional<double> rho = density_at(h);
    std::printf("h = %4.1f km: rho = %s", h, rho ? "" : "outside table, ");
    std::printf("%.5f kg/m^3\n", rho.value_or(0.0));
  }
  std::printf("sizeof(std::optional<double>) = %zu\n", sizeof(std::optional<double>));
  return 0;
}
// Output:
// 3 satellites: no fix, holding last estimate
// 6 satellites: fix at 28.5623, -80.5774, 12.0 m
// h =  5.0 km: rho = 0.81925 kg/m^3
// h = 25.0 km: rho = 0.05366 kg/m^3
// h = 55.0 km: rho = outside table, 0.00000 kg/m^3
// sizeof(std::optional<double>) = 16
```

The `if (const auto fix = latest_fix(sats); fix.has_value())` form declares the optional and tests it in one statement, so the name `fix` exists only where it is known to hold something. `value_or(0.0)` supplies a fallback density where there is none — a choice the caller makes explicitly, in view, rather than a silent zero from an uninitialised variable. Between 0 and 10 km the interpolation gives $1.225 + 0.5 \times (0.4135 - 1.225) = 0.819\,\mathrm{kg/m^3}$ at 5 km.
:::

## A Result type: a value or the reason there is none

When the caller must know *why* a value is missing — which of several checks a telemetry packet failed — `std::optional` is not enough. C++23 adds `std::expected` for exactly this, holding either a value or an error; in C++20 you write a small equivalent over `std::variant`, which stores one of a fixed set of types in place. The shape is the same as `optional` with an error attached, and propagation is one line: if the callee's result is not ok, return its error.

::: example Decoding a packet through a chain of checks
```cpp
#include <cstdint>
#include <cstdio>
#include <string_view>
#include <variant>

enum class Error : std::uint8_t { BadChecksum, BadLength, ValueOutOfRange };

std::string_view to_string(Error e) {
  switch (e) {
    case Error::BadChecksum:     return "bad checksum";
    case Error::BadLength:       return "bad length";
    case Error::ValueOutOfRange: return "value out of range";
  }
  return "unknown";
}

// A value or an error, never both, never neither. No heap: variant stores in place.
template <typename T>
class Result {
 public:
  Result(T value) : data_(value) {}
  Result(Error error) : data_(error) {}
  bool ok() const { return std::holds_alternative<T>(data_); }
  const T& value() const { return std::get<T>(data_); }      // precondition: ok()
  Error error() const { return std::get<Error>(data_); }     // precondition: !ok()

 private:
  std::variant<T, Error> data_;
};

struct Packet { std::uint8_t length; std::uint8_t payload[4]; std::uint8_t checksum; };

Result<std::uint32_t> decode(const Packet& p) {
  if (p.length != 4) return Error::BadLength;
  std::uint8_t sum = 0;
  for (std::uint8_t b : p.payload) sum = static_cast<std::uint8_t>(sum + b);
  if (sum != p.checksum) return Error::BadChecksum;
  return static_cast<std::uint32_t>(p.payload[0] | (p.payload[1] << 8) | (p.payload[2] << 16) | (p.payload[3] << 24));
}

Result<double> tank_pressure_bar(const Packet& p) {
  const Result<std::uint32_t> raw = decode(p);
  if (!raw.ok()) return raw.error();                       // propagate the error unchanged
  const double bar = raw.value() * 0.001;                  // counts of 1 mbar
  if (bar > 400.0) return Error::ValueOutOfRange;
  return bar;
}

int main() {
  const Packet good{4, {0x10, 0x27, 0x00, 0x00}, 0x37};      // 10000 mbar = 10.000 bar
  const Packet corrupt{4, {0x10, 0x27, 0x00, 0x00}, 0x38};
  const Packet huge{4, {0x00, 0x00, 0x10, 0x00}, 0x10};      // 1048576 mbar = 1048.6 bar
  const Packet shortp{3, {0x10, 0x27, 0x00, 0x00}, 0x37};
  for (const Packet* p : {&good, &corrupt, &huge, &shortp}) {
    const Result<double> r = tank_pressure_bar(*p);
    if (r.ok()) std::printf("pressure = %.3f bar\n", r.value());
    else        std::printf("error: %s\n", to_string(r.error()).data());
  }
  std::printf("sizeof(Result<double>) = %zu\n", sizeof(Result<double>));
  return 0;
}
// Output:
// pressure = 10.000 bar
// error: bad checksum
// error: value out of range
// error: bad length
// sizeof(Result<double>) = 16
```

`0x2710` is 10 000, so the good packet decodes to 10.000 bar; its checksum `0x37` is the byte sum $0x10 + 0x27$. `tank_pressure_bar` neither knows nor cares which check `decode` failed — it forwards the `Error` — and `main` is the level with the context to print it, or in flight to log it and mark the sensor suspect. `std::get` on the wrong alternative throws, which is why `value()` and `error()` document their preconditions and callers test `ok()` first; a flight version would assert those preconditions with the mechanism in the next section.
:::

::: key
Errors are values. A `[[nodiscard]]` status enumeration, with `-Werror`, enforces "check every return value"; `std::optional` expresses a legitimately absent result; a `Result` (or C++23 `std::expected`) carries a value or the reason there is none. All three live in place with no heap, and none can bypass a caller.
:::

## Assertions that record instead of crash

Status codes are for failures you *expect* — a sensor will time out sooner or later. Assertions are for conditions that should be impossible if the code is correct: a negative time step, a covariance that is not symmetric, a mode index outside the enumeration. The standard `assert` from `cassert` prints a message and aborts when its condition is false, and is removed entirely when the program is compiled with `-DNDEBUG`. Both properties are wrong for flight. A crash in flight is the worst possible response to a bad value, and the flight build *is* the optimised build, so an assertion that disappears under `NDEBUG` protects only the developer's laptop.

Flight projects therefore define their own assertion, which is the one preprocessor macro every coding standard permits. It never compiles out. When it fires, it records the fault — a counter, the failed expression, the line — for telemetry and for the fault manager, and it lets the function continue with a safe value so that the loop meets its deadline and the vehicle keeps flying while a higher level decides what to do.

::: example A flight-style assertion beside the standard one
```cpp
#include <cassert>
#include <cstdio>

// A flight-style assertion: never compiled out, never aborts. It records the fault
// and lets the caller degrade gracefully. (An assertion macro is the one preprocessor
// use every flight coding standard permits.)
struct FaultLog { int count = 0; const char* last = ""; int line = 0; };
static FaultLog g_faults;

#define FSW_ASSERT(cond)                                                     \
  do {                                                                       \
    if (!(cond)) { ++g_faults.count; g_faults.last = #cond; g_faults.line = __LINE__; } \
  } while (false)

double throttle_command(double demand_frac, double min_frac) {
  FSW_ASSERT(min_frac >= 0.0 && min_frac <= 1.0);        // precondition
  FSW_ASSERT(demand_frac >= 0.0 && demand_frac <= 1.0);  // precondition
  const double cmd = demand_frac < min_frac ? min_frac : demand_frac;
  FSW_ASSERT(cmd >= min_frac && cmd <= 1.0);             // postcondition
  return cmd;
}

int main() {
  std::printf("cmd = %.2f\n", throttle_command(0.30, 0.40));
  std::printf("cmd = %.2f\n", throttle_command(1.70, 0.40));   // violates a precondition
  std::printf("faults = %d, last = \"%s\" at line %d\n", g_faults.count, g_faults.last, g_faults.line);

  assert(g_faults.count == 0 && "standard assert: aborts unless compiled with -DNDEBUG");
  std::printf("reached the end (so NDEBUG was defined)\n");
  return 0;
}
// Output, built with -O2:
// cmd = 0.40
// cmd = 1.70
// faults = 2, last = "cmd >= min_frac && cmd <= 1.0" at line 19
// fswassert: fswassert.cpp:28: int main(): Assertion `g_faults.count == 0 && "..."' failed.
// (aborted)
//
// Output, built with -O2 -DNDEBUG:
// cmd = 0.40
// cmd = 1.70
// faults = 2, last = "cmd >= min_frac && cmd <= 1.0" at line 19
// reached the end (so NDEBUG was defined)
```

The second call violates a precondition (a 170 % throttle demand), and the postcondition catches the consequence too — two faults recorded, the function still returned, the program still ran. The `#cond` in the macro turns the expression into a string so that telemetry can name the check that failed. Then the standard `assert` shows its two faces: in the plain build it aborts the program on a condition that is merely a recorded fault, and with `-DNDEBUG` it vanishes and the program runs to the end. Neither behaviour belongs on a vehicle. Note also that a real `throttle_command` would *saturate* the bad demand to a legal value after recording the fault rather than return 1.70; the example leaves the value alone so that the postcondition has something to catch.
:::

The Power of Ten asks for at least two assertions per function, checking preconditions, postconditions and invariants; asks that assertions be free of side effects; and asks that every assertion failure have an explicit recovery action. The fault log above is the recording half of that; the recovery half is a fault manager that reads it and, for example, switches to a redundant sensor, saturates a command, or commands a safe mode. What it never does is `abort()`.

::: warning
Under `-fno-exceptions`, `std::optional::value()`, `std::vector::at()`, `std::get` on the wrong `variant` alternative and `std::stoi` on bad text all terminate the program. Test before you take: `has_value()` then `*`, a bounds check then `[]`, `ok()` then `value()`. In tooling code that compiles with exceptions, the same calls throw and are fine.
:::

::: warning
`assert` disappears with `-DNDEBUG`, which most release configurations define, so an `assert` that guards a flight computation guards nothing on the vehicle. Use the project's assertion macro in flight code; keep `assert` for tests and tooling, where an abort is the behaviour you want.
:::

## Choosing the mechanism

| Situation | Mechanism | Example |
| --- | --- | --- |
| an expected failure the caller must handle | `[[nodiscard]]` status enum, or `Result` with an error enum | sensor timeout, bad checksum |
| a legitimately absent result, no reason needed | `std::optional` | no GPS fix, lookup outside the table |
| a condition that should be impossible | flight assertion that records a fault | negative `dt`, non-unit quaternion |
| tooling, tests, the Python binding layer | exceptions | a missing configuration file in the simulator |
| never in flight | `abort`, uncaught `throw`, ignored returns | — |

## Check yourself

::: check
Under `-fno-exceptions`, what happens when `std::vector::at` is called with an out-of-range index, and what should flight code do instead?
:::

::: answer
With exceptions disabled the library cannot throw `std::out_of_range`, so it calls `std::terminate`, which aborts the program — the message `terminate called after throwing an instance of 'std::out_of_range'` appears and the process dies. A recoverable error has become a crash. Flight code checks the index itself, `if (i < v.size())`, and then indexes with `[]`; the failed check becomes a status code or a recorded fault that the caller handles, and nothing can terminate the loop.
:::

::: check
A GPS receiver reports no fix; a telemetry packet fails its checksum. Which type does each function return, and why are they different?
:::

::: answer
`latest_fix` returns `std::optional` of a fix: with too few satellites there is legitimately nothing to report, no reason needs attaching, and the caller's response — hold the last estimate — does not depend on why. `decode` returns a `Result` with an error enumeration: a packet can fail for several distinct reasons (length, checksum, range), the caller needs to know which one to log it, count it against the right fault, or decide whether to trust the link, and `optional` cannot carry that distinction.
:::

::: check
Give the two reasons exceptions are excluded from a hard-real-time control loop, and say what each reason has to do with the "check every return value" rule.
:::

::: answer
First, unwinding has no bounded worst-case time: it walks tables and runs destructors up the stack, and the time depends on the depth and the types involved, so the loop's deadline cannot be proven. Second, exceptions hide control flow: any call may fail to return, so a reviewer cannot see the error paths. The return-value rule depends on errors coming back *to the call site*, where they can be checked and their handling reviewed; an exception bypasses the call site entirely, which is why the rule and the mechanism cannot coexist.
:::

::: check
A function checks one precondition with the standard `assert`. Name three things the Power of Ten and flight practice would change about it.
:::

::: answer
It would use the project's flight assertion macro, which is never compiled out by `NDEBUG`, so the check exists in the flight build. It would record the failure — count, expression, line — rather than abort, and continue with a safe value so that the loop completes. And it would not be alone: the rule asks for at least two assertions per function, typically a precondition and a postcondition or an invariant, each free of side effects and each with an explicit recovery action defined for the case where it fires.
:::

::: check
`[[nodiscard]] Status arm_igniter();` is called as a bare statement `arm_igniter();` in a build with `-Wall -Werror`. What happens, and what rule is the toolchain enforcing?
:::

::: answer
The compiler emits `warning: ignoring return value of 'Status arm_igniter()', declared with attribute 'nodiscard' [-Wunused-result]`, and `-Werror` promotes it to an error, so the code does not build. The toolchain is enforcing the Power of Ten rule that the return value of every non-void function is checked. The fix is to receive the status and act on it — `if (const Status s = arm_igniter(); s != Status::Ok) { ... }` — never to cast the result to `void` to silence the warning, which would defeat the purpose of marking the function in the first place.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `throw` / `try` / `catch` | C++ exceptions; stack unwinding runs destructors up to the matching handler |
| `-fno-exceptions` | flight build flag; `throw` is a compile error, library throws become `std::terminate` |
| why exceptions are off | unbounded unwinding time, hidden control flow, memory, toolchain support |
| `[[nodiscard]] Status f(double& out)` | status enum returned, result through a reference; ignoring the status fails the build with `-Werror` |
| `std::optional` | a value or `std::nullopt`, in place; `has_value()`, `*`, `->`, `value_or()`; never `.value()` in flight |
| `Result` / `std::expected` | a value or an error enum, in place; propagate with `if (!r.ok()) return r.error();` |
| `assert` | aborts; removed by `-DNDEBUG`; tests and tooling only |
| flight assertion | never compiled out, records the fault, continues safely; at least two per function |
| Power of Ten rules 5 and 7 | two assertions per function; check every return value |
| exceptions belong in | tooling, simulation harness, tests, the pybind11 layer |

The next lesson collects the remaining rules of the hot loop — where memory lives, how the cache sees it, and why nothing in the loop may allocate — and reads the Power of Ten in full.
