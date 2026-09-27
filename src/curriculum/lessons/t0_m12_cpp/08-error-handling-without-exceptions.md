---
id: l08-error-handling-without-exceptions
title: Error handling without exceptions
minutes: 25
covers:
  - error handling without exceptions
---

Picture two ways a restaurant kitchen could deal with a problem. In the first, when a cook finds the fish has gone bad, they pull the fire alarm. Everyone stops, the building empties, and somebody far away decides what happens next. In the second, the cook walks the plate back to the head chef and says, "No fish tonight." The head chef, who knows the menu, offers the chicken. Dinner service goes on.

Python works like the fire alarm. When something fails, it **raises an exception**: the error jumps up through every function that was waiting on the answer until some `except` catches it, and if nothing does, the program prints a traceback and stops. C++ has the same machinery — `throw`, `try`, `catch` — and its standard library uses it. `std::vector::at` throws on a bad index. `new` throws when memory runs out. `std::stoi` throws on text that is not a number.

And yet almost every flight software project switches exceptions off. This lesson explains why, and then teaches the second kitchen: **errors as values**. A sensor timeout, a failed checksum, a command out of range are ordinary outcomes. They are returned the way any other result is returned, checked at every call, and handled by whichever caller has the context to decide. Nothing happens behind the caller's back. A reviewer can read a function and see every path out of it.

Two of the Power of Ten rules from NASA's Jet Propulsion Laboratory live here: check the return value of every function that returns one, and put at least two assertions in every function. You will read all ten rules in the next lesson. Both of these are impossible to enforce with exceptions and natural without them.

## What exceptions are, and why flight code turns them off

`throw obj;` creates an **exception object** and starts **[[unwinding|unwinding-picture]]**. The run-time walks back up the chain of waiting functions — the **call stack** — running the destructor of every local object on the way. (That is why RAII and exceptions were designed together.) It stops at the first `catch` whose type matches. Modern compilers use a "zero-cost" design: the normal path pays nothing, and the throwing path pays for everything by searching tables that describe each function.

That design is exactly the problem for a **hard-real-time** system — one where every cycle must finish before a deadline, every time.

1. **Unbounded, unanalysable time.** How long unwinding takes depends on how deep the stack is, how many destructors run, and which tables must be searched. There is no worst-case number to hand to the scheduler.
2. **Hidden control flow.** Any call might not return. A reviewer reading `angle += rate * dt;` cannot see that `rate` came from a function that might have thrown three levels down. There is no way to enforce "check every error" when errors skip right past the place they would be checked.
3. **Memory and code size.** The run-time allocates the exception object (in the GNU library, from the heap, with an emergency pool as a fallback), and the unwind tables make the program bigger.
4. **Toolchain support.** The **[[toolchains|toolchain]]** for flight processors, and the real-time operating systems they run, have often supported exceptions poorly or not at all.

The compiler flag is `-fno-exceptions`. With it, a `throw` in your own code does not build: `error: exception handling disabled, use '-fexceptions' to enable`. Library code that throws still throws, but nothing can ever catch it, so the program calls `std::terminate` and aborts:

```cpp
#include <array>
#include <cstdio>

int main(int argc, char**) {
  std::array<int, 4> a{1, 2, 3, 4};
  const std::size_t i = 5 + static_cast<std::size_t>(argc);   // 6 when run with no arguments
  std::printf("about to index %zu\n", i);
  std::fflush(stdout);
  return a.at(i);                                             // checked access: throws
}
```

```text
$ g++ -std=c++20 -fno-exceptions noexc.cpp -o noexc && ./noexc
about to index 6
terminate called after throwing an instance of 'std::out_of_range'
  what():  array::at: __n (which is 6) >= _Nm (which is 4)
Aborted
```

Read that carefully. The bad index did not become an error the program could recover from. It became a crash. With `-fno-exceptions`, every throwing call in the standard library is a hidden abort waiting for a bad input. So flight code does not call them with inputs it has not already checked: `[]` after its own bounds check instead of `.at()`, its own checked accessor instead of `std::optional::value()`, and no `std::stoi`.

Exceptions remain the right tool in the code *around* the flight software — ground tools, the simulation harness, the tests, and the pybind11 layer that turns C++ errors into Python exceptions. Use `try` and `catch` there without apology.

::: key
Flight code compiles with `-fno-exceptions` because unwinding has no bounded worst-case time, because exceptions hide control flow so that no reviewer can verify that every error is checked, and because they cost memory and toolchain support. With the flag set, library code that would throw terminates the program instead, so validate before you call anything that can throw.
:::

## Errors as values: status codes

The plainest replacement is the head chef's note. Every function that can fail returns a small code saying how it went, and hands its actual result back through a reference parameter. The codes live in an **enumeration** — a type whose values are a fixed list of names.

Two touches make the pattern safe.

- **`[[nodiscard]]`** on the function is an **[[attribute|attribute-brackets]]** — a note to the compiler — that says "warn anyone who ignores what I return". Add `-Werror`, which turns every warning into a build failure, and the Power of Ten rule "check every return value" is enforced by the tools instead of by a tired reviewer.
- An `enum class` with a fixed underlying type, such as `std::uint8_t`, gives a status that is one byte and packs neatly into a telemetry word.

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

Walk through it. The fake gyro drops out whenever `cycle % 7 == 3` — the remainder after dividing by 7 is 3 — which happens at cycle 3. Its rate is $0.01 \times \text{cycle}$ rad/s, and anything above $0.05$ counts as out of range, which happens from cycle 6 on.

`update_attitude` checks `read_gyro`'s status. If it is not `Ok`, it hands the same status straight back and never touches the angle. Only on success does it add $\text{rate} \times dt$. Check cycle 4: the rate is $0.04$ rad/s, times $dt = 0.1$ s is $0.004$ rad, and $0.0030 + 0.004 = 0.0070$. That matches.

So a failed read leaves the estimate exactly where it was. That is the **[[hold last good value|hold-last-good]]** behaviour a control loop wants during a one-cycle dropout. The caller counts faults, and could equally switch to a **[[redundant gyro|redundant-sensors]]** after three in a row.

Every path is visible. Now try to cheat: call `update_attitude(cycle, 0.1, angle);` as a bare statement, throwing the status away. The compiler says

```text
warning: ignoring return value of 'Status update_attitude(int, double, double&)', declared with attribute 'nodiscard' [-Wunused-result]
```

and `-Werror` makes that a failed build. One small detail: `to_string(s).data()` is there because `printf` wants a C-style string, and a `std::string_view` of a string literal can provide one.
:::

## std::optional: a value or nothing

Some functions have no answer without anything having gone *wrong*. Ask a friend for the time when they are not wearing a watch: nothing is broken, but they have nothing to tell you. A GPS receiver that can see only three satellites has no position fix. A table lookup outside the table has no entry.

For these, **`std::optional`** holds either a value or the marker `std::nullopt`, meaning "nothing". It stores the value in place, with no heap: `sizeof` a `std::optional` of `double` is 16 bytes — the 8-byte value, a flag saying whether it is there, and padding.

The parts you use:

- `has_value()`, or testing it like a `bool`, asks whether a value is there;
- `*` and `->` reach the value;
- `value_or(fallback)` gives the value, or a default you choose.

The one to avoid in flight code is `.value()`. It throws when the optional is empty — and under `-fno-exceptions` it terminates.

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

A GPS receiver needs at least four satellites to solve for its three position coordinates and its clock error, so three satellites give `std::nullopt`. The line `if (const auto fix = latest_fix(sats); fix.has_value())` declares the optional and tests it in one statement. The name `fix` then exists only inside the branch where it is known to hold something.

The density table holds air density every 10 km from the standard atmosphere. At 5 km the code interpolates halfway between the first two entries:

$$
1.225 + 0.5 \times (0.4135 - 1.225) = 0.819\,\mathrm{kg/m^3} .
$$

That is roughly two-thirds of sea-level density, sensible for the height of a tall mountain. At 55 km there is no entry, and `value_or(0.0)` supplies a fallback. The caller makes that choice openly, in view — not a silent zero from a variable nobody set.
:::

## A Result type: a value or the reason there is none

Sometimes "nothing" is not enough. If a telemetry packet is rejected, the caller wants to know *why*: wrong length, bad checksum, or a reading out of range? Each means something different about the radio link or the sensor.

C++23 adds `std::expected` for this: it holds either a value or an error. In C++20 you write a small equivalent on top of **`std::variant`**, a type that stores exactly one of a fixed list of types **[[in place|variant-in-place]]**. The result works like `optional` with a reason attached, and passing an error upward is one line: if the result is not OK, return its error.

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

Check the good packet by hand. Its four payload bytes are stored lowest byte first, so the value is $0x2710$, and $0x2710 = 2 \times 4096 + 7 \times 256 + 1 \times 16 = 10\,000$. At 1 mbar per count that is $10.000$ bar. Its checksum is the byte sum $0x10 + 0x27 = 0x37$, which matches. The "corrupt" packet carries $0x38$ instead, so it fails. The "huge" packet decodes to $0x100000 = 1\,048\,576$ mbar, about $1049$ bar, which is over the 400 bar limit.

Notice the division of labour. `tank_pressure_bar` neither knows nor cares which check `decode` failed; it forwards the `Error`. `main` is the level with the context to print it — or, in flight, to log it and mark the sensor suspect.

`std::get` on the wrong alternative throws. That is why `value()` and `error()` state their preconditions and callers test `ok()` first. A flight version would check those preconditions with the kind of assertion in the next section.
:::

::: key
Errors are values. A `[[nodiscard]]` status enumeration, with `-Werror`, enforces "check every return value"; `std::optional` expresses a legitimately absent result; a `Result` (or C++23 `std::expected`) carries a value or the reason there is none. All three live in place with no heap, and none can bypass a caller.
:::

## Assertions that record instead of crash

Status codes are for failures you *expect*. A sensor will time out sooner or later. **Assertions** are for things that should be impossible if the code is right: a negative time step, a covariance matrix that is not symmetric, a mode number outside the list of modes. An assertion states "this must be true here" and checks it.

The standard `assert`, from the `cassert` header, prints a message and aborts when its condition is false. It is also removed completely when the program is compiled with `-DNDEBUG` ("no debug"). Both of those are wrong for flight:

- A crash in flight is the worst possible response to one bad value. **[[Ariane 5's first flight|ariane-501]]** was lost that way.
- The flight build *is* the optimised build, where `NDEBUG` is usually defined. An assertion that vanishes there protects only the developer's laptop.

So flight projects define their own assertion, as a macro — the one use of the preprocessor every flight coding standard allows. It never compiles out. When it fires, it *records* the fault — a counter, the failed expression, the line number — for telemetry and for the fault manager. Then it lets the function carry on with a safe value, so the loop meets its deadline and the vehicle keeps flying while a higher level decides what to do.

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
// Output in a terminal, built with -O2:
// cmd = 0.40
// cmd = 1.70
// faults = 2, last = "cmd >= min_frac && cmd <= 1.0" at line 19
// fswassert: fswassert.cpp:28: int main(): Assertion `g_faults.count == 0 && "standard assert: aborts unless compiled with -DNDEBUG"' failed.
// Aborted
//
// Output, built with -O2 -DNDEBUG:
// cmd = 0.40
// cmd = 1.70
// faults = 2, last = "cmd >= min_frac && cmd <= 1.0" at line 19
// reached the end (so NDEBUG was defined)
```

The function has three assertions: two **preconditions** (what must be true on the way in) and one **postcondition** (what must be true on the way out). The first call asks for 30 % throttle with a 40 % minimum, so the command is raised to 0.40 and every check passes.

The second call asks for 170 % throttle — impossible. The precondition on `demand_frac` fires. The command stays 1.70, so the postcondition `cmd <= 1.0` fires too. Two faults are recorded, the function still returned, and the program still ran. The `#cond` in the macro turns the checked expression into text, so telemetry can name exactly which check failed. (The **[[do and while wrapper|macro-wrapper]]** around the macro body is a standard trick that makes it behave like one statement.)

Then the standard `assert` shows its two faces. In the plain build it aborts the whole program over a condition that was only a recorded fault. With `-DNDEBUG` it vanishes and the program runs to the end. Neither belongs on a vehicle.

One honest note: a real `throttle_command` would **saturate** the bad demand — clamp it to the legal range — after recording the fault, instead of returning 1.70. The example leaves the value alone so that the postcondition has something to catch.
:::

The Power of Ten asks for at least two assertions per function, checking preconditions, postconditions and **invariants** (promises that must always hold). It asks that assertions have no side effects — they must only look, never change anything. And it asks that every assertion failure have an explicit recovery action. The fault log above is the recording half. The recovery half is a fault manager that reads the log and, for example, switches to a redundant sensor, saturates a command, or commands **[[safe mode|safe-mode]]**. What it never does is `abort()`.

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
The library throws `std::out_of_range`, but with exceptions disabled nothing can catch it, so `std::terminate` runs and the program aborts. The message `terminate called after throwing an instance of 'std::out_of_range'` appears and the process dies. A recoverable error has become a crash.

Flight code checks the index itself, `if (i < v.size())`, and only then uses `[]`. The failed check becomes a status code or a recorded fault that the caller handles, and nothing can end the loop.
:::

::: check
A GPS receiver reports no fix; a telemetry packet fails its checksum. Which type does each function return, and why are they different?
:::

::: answer
`latest_fix` returns a `std::optional` of a fix. With too few satellites there is legitimately nothing to report. No reason needs to be attached, and the caller's response — hold the last estimate — does not depend on why.

`decode` returns a `Result` with an error enumeration. A packet can fail for several different reasons (length, checksum, range). The caller needs to know which, to log it, count it against the right fault, or decide whether to trust the link. An `optional` cannot carry that difference.
:::

::: check
Give the two reasons exceptions are excluded from a hard-real-time control loop, and say what each reason has to do with the "check every return value" rule.
:::

::: answer
First, unwinding has no bounded worst-case time. It searches tables and runs destructors up the stack, and the time depends on the depth and the types involved, so nobody can prove the loop meets its deadline.

Second, exceptions hide control flow. Any call may fail to return, so a reviewer cannot see the error paths.

The return-value rule depends on errors coming back *to the call site*, where they can be checked and where their handling can be reviewed. An exception skips the call site entirely. That is why the rule and the mechanism cannot live together.
:::

::: check
A function checks one precondition with the standard `assert`. Name three things the Power of Ten and flight practice would change about it.
:::

::: answer
1. Use the project's flight assertion macro, which `NDEBUG` never removes, so the check exists in the flight build.
2. Record the failure — count, expression, line — instead of aborting, and carry on with a safe value so the loop completes.
3. Do not leave it alone. The rule asks for at least two assertions per function, typically a precondition and a postcondition or invariant, each free of side effects and each with an explicit recovery action for when it fires.
:::

::: check
`[[nodiscard]] Status arm_igniter();` is called as a bare statement `arm_igniter();` in a build with `-Wall -Werror`. What happens, and what rule is the toolchain enforcing?
:::

::: answer
The compiler warns `ignoring return value of 'Status arm_igniter()', declared with attribute 'nodiscard' [-Wunused-result]`, and `-Werror` turns the warning into an error, so the code does not build.

The toolchain is enforcing the Power of Ten rule that the return value of every non-void function is checked. The fix is to receive the status and act on it — `if (const Status s = arm_igniter(); s != Status::Ok) { ... }`. Never cast the result to `void` to silence the warning: that defeats the reason the function was marked in the first place.
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

::: context unwinding-picture Climbing back up the stack
Each function that calls another waits on a pile, like trays stacked in a cafeteria. When the deepest one throws, the run-time lifts trays off one by one, cleaning up each function's local objects, until it reaches a function with a matching `catch`. How many trays, and how much cleaning, depends on the program's state at that moment — so the time cannot be known in advance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="180" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="39" font-size="12" text-anchor="middle" fill="#1f2a44">control_loop()  catch</text>
  <rect x="30" y="52" width="180" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">update_attitude()</text>
  <rect x="30" y="84" width="180" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="103" font-size="12" text-anchor="middle" fill="#1f2a44">read_gyro()</text>
  <rect x="30" y="116" width="180" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="135" font-size="12" text-anchor="middle" fill="#1f2a44">parse_frame()  throw</text>
  <line x1="240" y1="130" x2="240" y2="44" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="240,36 234,48 246,48" fill="#b4232c"/>
  <text x="252" y="80" font-size="11" fill="#b4232c">unwind:</text>
  <text x="252" y="95" font-size="11" fill="#b4232c">run each</text>
  <text x="252" y="110" font-size="11" fill="#b4232c">destructor</text>
  <text x="120" y="162" font-size="11" text-anchor="middle" fill="#6c7a93">deepest call at the bottom</text>
</svg>
```
:::

::: context toolchain What a toolchain is
A toolchain is the set of programs that turn source code into something a particular processor can run: the compiler, the assembler, the linker, and the standard library that comes with them. A laptop's toolchain targets its own chip. Flight computers often use radiation-tolerant processors, such as the LEON and PowerPC-based chips in many spacecraft, with their own toolchains — sometimes qualified for safety-critical use, often years behind the newest compilers, and sometimes shipped with only a reduced C++ library.
:::

::: context attribute-brackets The double square brackets
`[[nodiscard]]` is a C++ **attribute**: extra information for the compiler, written in double square brackets, that does not change what the code computes. Others you may meet are `[[maybe_unused]]` (stop warning that this variable is unused), `[[fallthrough]]` (yes, this `switch` case falls into the next one on purpose) and `[[likely]]`. Since C++20 you can add a reason: `[[nodiscard("check the igniter status")]]`, and the reason appears in the warning.
:::

::: context hold-last-good Why freezing for one cycle is fine
A control loop running at 100 Hz sees the vehicle move very little in 10 milliseconds. If one gyro reading is missing, using the previous estimate for one more cycle costs almost nothing — the attitude error grows by the rate times one time step. What would be dangerous is feeding in a zero or a garbage value, which the controller would treat as real. The risk grows the longer the hold lasts, which is why flight code counts consecutive faults and acts when the count passes a limit.
:::

::: context redundant-sensors Three gyros and a vote
Flight vehicles often carry three or more copies of an important sensor. Each cycle the software compares them. If two agree and one is far off, the odd one out is voted off and ignored. With only two, you can tell something is wrong but not which one; with three, a majority can decide. Many launch vehicles carry redundant inertial units for exactly this reason.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="90" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">gyro A 0.040</text>
  <rect x="20" y="56" width="90" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">gyro B 0.041</text>
  <rect x="20" y="97" width="90" height="28" rx="5" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="65" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">gyro C 0.900</text>
  <line x1="110" y1="29" x2="195" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="70" x2="195" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="111" x2="195" y2="74" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <rect x="195" y="52" width="60" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">vote</text>
  <line x1="255" y1="70" x2="290" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="322" y="66" font-size="12" text-anchor="middle" fill="#1d6fd1">use</text>
  <text x="322" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">A and B</text>
  <text x="200" y="120" font-size="11" fill="#b4232c">C voted out</text>
</svg>
```
:::

::: context variant-in-place One box, two possible contents
A `std::variant<double, Error>` reserves one space big enough for the larger choice, plus a small tag saying which choice is stored right now. No heap, no pointer: the whole thing is one block of 16 bytes here. `std::holds_alternative` reads the tag; `std::get` reads the contents after checking the tag.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="160" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">8 bytes: double or Error</text>
  <rect x="180" y="30" width="20" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">t</text>
  <rect x="200" y="30" width="140" height="34" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="270" y="52" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">0</text>
  <text x="340" y="20" font-size="11" text-anchor="end" fill="#1f2a44">16 bytes</text>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">t = 1-byte tag: 0 means a value, 1 means an error</text>
</svg>
```
:::

::: context ariane-501 The rocket that crashed on an exception
On 4 June 1996, about 37 seconds after lift-off, the first Ariane 5 veered off course and broke up. Inside each of its two inertial reference units, a conversion of a 64-bit floating-point value into a 16-bit integer overflowed — the rocket was faster sideways than the Ariane 4 the code was written for. The Ada run-time raised an exception nobody handled, and the policy for an unhandled exception was to shut the unit down. Both units failed the same way. The flight computer then read diagnostic data as if it were attitude data and swung the nozzles hard over. The code that failed was an alignment routine with no job to do after lift-off.
:::

::: context macro-wrapper Why do { ... } while (false)
A macro is pasted into the code as text before compiling. If its body were a bare `if (...) { ... }`, then writing `if (x) FSW_ASSERT(y); else ...` would glue the `else` onto the macro's hidden `if` instead of yours. Wrapping the body in `do { ... } while (false)` makes the whole thing one statement that needs its own semicolon, and runs it exactly once. It is a decades-old C idiom.
:::

::: context safe-mode What a spacecraft does in safe mode
Safe mode is the "stop and wait for help" state. A spacecraft that detects a fault it cannot fix on its own turns off anything non-essential, points its solar panels at the Sun so it keeps power, points an antenna toward Earth, and waits for the ground team to work out what happened. It is designed to be reachable from almost any failure and to keep the vehicle alive for days or weeks. Launch vehicles, which cannot pause, use abort modes instead.
:::
