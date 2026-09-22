---
id: l13-assert-and-static-assert
title: assert and static_assert
minutes: 19
covers:
  - assert and static_assert
---

Every function you write assumes things. That the pointer is not null, that the count is positive, that the packet header is still twelve bytes, that `size_t` is 64 bits on this target. Most of those assumptions live in a comment, or in the author's head, and both are erased by the first refactor.

C++ gives you two ways to write an assumption down so that something checks it. `static_assert` is evaluated during compilation, so a violated assumption is a build failure and cannot reach a vehicle at all. `assert` is evaluated while the program runs, in builds where it is enabled, and stops the program when the assumption turns out to be false.

Python has one `assert`, which raises `AssertionError` and disappears under `python3 -O`. C++'s run-time `assert` is the same idea with a sharper edge: it calls `abort()` rather than raising something you can catch, and it is removed by defining `NDEBUG`, which every release build does. This lesson covers both, the trap that follows from that removal, and how flight-software projects actually use them.

## `static_assert`

`static_assert(condition)` or `static_assert(condition, "message")` checks a constant expression at compile time. Since C++17 the message is optional. If the condition is false, the build stops.

The condition must be a constant expression — everything lesson 07 called `constexpr`. In practice that means `sizeof`, `alignof`, `offsetof`, values from `std::numeric_limits`, type traits from `<type_traits>`, and any `constexpr` function you have written.

::: example A wire format the compiler checks
Lesson 04 designed a twelve-byte telemetry header. Here is how you stop it from changing by accident.

```cpp
struct TelemetryHeader {
    std::uint16_t apid;
    std::uint16_t seq_count;
    std::uint32_t t_ms;
    std::uint8_t  mode;
    std::uint8_t  flags;
    std::uint16_t payload_len;
};

// The wire format, checked by the compiler rather than by a test.
static_assert(sizeof(TelemetryHeader) == 12, "header size changed: the ground decoder will break");
static_assert(offsetof(TelemetryHeader, t_ms) == 4, "t_ms moved");
static_assert(offsetof(TelemetryHeader, payload_len) == 10, "payload_len moved");
static_assert(std::is_trivially_copyable_v<TelemetryHeader>,
              "header must be memcpy-able into a packet buffer");
static_assert(std::is_standard_layout_v<TelemetryHeader>, "header must have standard layout");

// The platform assumptions this code is written against.
static_assert(sizeof(std::size_t) == 8, "this code assumes a 64-bit size_t");
static_assert(std::numeric_limits<std::uint8_t>::max() == 255);

// The memory budget, derived rather than remembered.
constexpr std::size_t kMaxFrames = 512;
static_assert(kMaxFrames * sizeof(TelemetryHeader) <= 8 * 1024,
              "frame ring exceeds its 8 KiB budget");
```

```text
sizeof(TelemetryHeader) = 12
sizeof(ring)            = 6144 bytes
```

Every line of that is a requirement that would otherwise be a comment. Someone inserts a `std::uint32_t` in the middle: the size check fails and names the consequence. Someone reorders two fields for readability: the `offsetof` checks fail. Someone adds a `std::string` member: `is_trivially_copyable_v` fails, because the struct can no longer be `memcpy`d into a packet buffer. Someone builds for a 32-bit target: the `size_t` check fails on the first compile rather than in flight.

Now break one deliberately — claim the header is sixteen bytes — and read what the compilers say. g++ 13.3.0:

```text
s1.cpp:14:39: error: static assertion failed: TelemetryHeader must be 16 bytes on the wire
   14 | static_assert(sizeof(TelemetryHeader) == 16, "TelemetryHeader must be 16 bytes on the wire");
      |               ~~~~~~~~~~~~~~~~~~~~~~~~^~~~~
s1.cpp:14:39: note: the comparison reduces to '(12 == 16)'
```

clang++ 18.1.3:

```text
s1.cpp:14:15: error: static assertion failed due to requirement 'sizeof(TelemetryHeader) == 16': TelemetryHeader must be 16 bytes on the wire
s1.cpp:14:39: note: expression evaluates to '12 == 16'
```

Both print the *values*: `12 == 16`. That is why the message should say what breaks rather than restate the condition — the compiler already tells you the numbers, and your job is to tell the reader why it matters.
:::

Where `static_assert` earns its place:

- **Wire and shared-memory layouts.** Size, member offsets, trivial copyability.
- **Platform assumptions.** Integer widths, `CHAR_BIT`, endianness where the compiler exposes it.
- **Budgets.** Buffer sizes against a RAM allowance, as lesson 07 did.
- **Template and API constraints.** "This function requires a floating-point type", via `std::is_floating_point_v`.
- **Enumeration consistency.** That a names table has as many entries as the enumeration has values.

## `assert`

`assert(condition)` from `<cassert>` checks at run time. If the condition is false it writes a message to `stderr` and calls `abort()`.

```cpp
double mean_az(const double* az, std::size_t n) {
    assert(az != nullptr);
    assert(n > 0 && "mean_az requires at least one sample");
    ...
}
```

Calling it with `n == 0` in a debug build:

```text
a1: a1.cpp:7: double mean_az(const double*, std::size_t): Assertion `n > 0 && "mean_az requires at least one sample"' failed.
```

and the shell reports exit status 134. The message names the program, the file, the line, the enclosing function and the condition as written. Exit status 134 is 128 + 6, signal 6, `SIGABRT`. The `&& "message"` idiom works because a non-empty string literal is always true, so it does not change the condition and does appear in the printed text.

One detail from that run worth knowing: the program had already printed a line to `stdout` before the assertion fired, and **that line never appeared**. `abort()` does not flush `stdout`, which is block-buffered when it is not a terminal, so the buffer is lost. The assertion message survives because `stderr` is unbuffered. When you are debugging a crash and the last thing you expected to see is missing, that is usually why — print to `stderr`, or flush.

### `NDEBUG` removes it entirely

`assert` is a macro. If `NDEBUG` is defined when `<cassert>` is included, it expands to nothing. Every release build defines it — CMake's `Release` and `RelWithDebInfo` configurations add `-DNDEBUG` for you.

Build the same program with `-DNDEBUG`:

```text
-9.8100
-nan
```

with exit status 0. No abort. The division by zero in the mean produced a NaN, the program printed it, and exited successfully. That is the contract: assertions catch *programmer* errors during development and are gone in the build you ship, so anything that must be checked in flight has to be checked by real code.

::: warning
Because `assert` disappears, an expression with a side effect inside one disappears with it. This is a real defect, not a stylistic point:

```cpp
int arm_sensor() { ++g_samples_armed; return 0; }   // 0 means success

assert(arm_sensor() == 0);          // the call itself vanishes under NDEBUG
```

```bash
g++ -std=c++20 -Wall -Wextra -O0 -g side.cpp -o side   && ./side
g++ -std=c++20 -Wall -Wextra -O2 -DNDEBUG side.cpp -o siden && ./siden
```

```text
g_samples_armed = 1
g_samples_armed = 0
```

The sensor is never armed in the build you fly. Write `const int rc = arm_sensor(); assert(rc == 0);` — and then ask whether `rc` should really be handled rather than asserted.
:::

### What belongs in an assertion

The line to draw: an assertion states something that is true *unless the program has a bug*. It is not error handling.

| Condition | Mechanism |
| --- | --- |
| A caller passed a null pointer | `assert` — a bug in the caller |
| A loop index exceeded the buffer | `assert` — a bug here |
| An invariant broke | `assert` — a bug somewhere |
| A sensor returned a value out of range | real code — the world, not a bug |
| A packet checksum failed | real code — the link, not a bug |
| A configuration file is missing | real code — the environment |

The test is whether a correct program can encounter the condition. If it can, it is an input and needs handling that survives into the release build; if it cannot, it is an assumption and `assert` documents and checks it for free during development.

::: key
`static_assert` is checked during compilation and its condition must be a constant expression; a failure stops the build. `assert` is checked at run time, prints to `stderr` and calls `abort()`, and is removed entirely when `NDEBUG` is defined — so it must never contain a side effect, and never replaces handling for something the world can actually do.
:::

::: example How a flight project actually uses assertions
The JPL Power of Ten rules — the coding standard behind a lot of spacecraft software — include one that surprises people: *use a minimum of two run-time assertions per function*. The reasoning is statistical rather than aesthetic. Assertion density correlates with defects found, and an assertion is a machine-checkable statement of what the author believed, which is the only kind of documentation that cannot drift.

The same rules add two constraints that follow from everything above. Assertions must be **side-effect free**, for the reason the warning above demonstrates. And an assertion that fails must have a **defined recovery action** — which `abort()` is not, on a vehicle in flight.

So a real project rarely uses the standard `assert` in flight code. It defines its own:

```cpp
// A project assertion: always present, and it does something survivable.
#define GNC_ASSERT(cond, code)                                   \
    do {                                                         \
        if (!(cond)) {                                           \
            gnc::fault::raise((code), __FILE__, __LINE__);       \
            return;                                              \
        }                                                        \
    } while (false)
```

Three differences from `assert`, all deliberate. It is **not** removed by `NDEBUG`, because the check is part of the flight behaviour. It records a fault code that goes down in telemetry, so the ground knows which assumption failed and where. And it takes a defined action — here returning, elsewhere entering a safe mode or failing over to the redundant string — rather than terminating a process that is flying a vehicle.

The `do { ... } while (false)` wrapper is the standard macro idiom: it makes the macro a single statement, so `if (x) GNC_ASSERT(...); else ...` parses correctly.

What this means for you as a new hire: write `static_assert` freely, because it costs nothing and cannot misfire; use `assert` in your own tools, tests and analysis code; and in flight code use whatever the project's macro is, having read what it does when it fires. The instinct the module wants you to leave with is that an assumption worth holding is an assumption worth writing down in a form a machine will check.
:::

::: example Keeping an enumeration and its names in step
Lesson 10's mode table has a defect waiting to happen: the enumeration and the names array can drift apart.

```cpp
enum class Mode : std::uint8_t { Idle, Ascent, Coast, Entry, Landing, Count };

constexpr const char* kModeNames[] = {"IDLE", "ASCENT", "COAST", "ENTRY", "LANDING"};

static_assert(std::size(kModeNames) == static_cast<std::size_t>(Mode::Count),
              "kModeNames is out of step with enum class Mode");

const char* mode_name(Mode m) {
    const auto i = static_cast<std::size_t>(m);
    return (i < std::size(kModeNames)) ? kModeNames[i] : "UNKNOWN";
}
```

```text
mode_name(Mode::Coast)  = COAST
mode_name(Mode::Count)  = UNKNOWN
number of modes         = 5
```

The trailing `Count` enumerator is a common idiom: it is always one past the last real value, so it is the number of them. The `static_assert` then ties the table's length to the enumeration, and adding `Mode::Terminal` without adding its name is a build failure with a message that says exactly what to do.

Note the run-time check as well as the compile-time one. `static_assert` guarantees the *table* is the right length; it cannot guarantee that the `Mode` value handed to `mode_name` is one of the named ones, because a byte cast from a packet can be anything (lesson 10's warning). The two checks cover different failures, and you want both.
:::

## Check yourself

::: check
Why can `static_assert(sizeof(Header) == 12)` never be written as a unit test, and what would you lose by trying?
:::

::: answer
It can be written as a unit test — `EXPECT_EQ(sizeof(Header), 12u)` is perfectly valid — but you lose three things. The check then only runs when someone runs the tests, on the platform the tests run on, whereas `static_assert` runs on every compilation of every target including the cross-compiled flight build, where the size may differ and where the test suite may not run at all. The failure arrives later: a broken layout compiles, links and reaches a test report instead of stopping at the file you just edited. And the assertion is no longer next to the struct, so the next person to reorder the fields does not see it. A compile-time property should be checked at compile time; keep the unit test for behaviour.
:::

::: check
`assert(n > 0 && "mean_az requires at least one sample")` — why does the string literal not change the condition, and what does it do?
:::

::: answer
A non-empty string literal is an array of `char` that decays to a pointer, and a non-null pointer converts to `true`, so `X && "message"` has exactly the same truth value as `X`. What it buys you is the printed text: `assert` stringises its whole argument, so the message appears in the diagnostic — `Assertion 'n > 0 && "mean_az requires at least one sample"' failed.` It is a way of attaching an explanation to an assertion that predates `static_assert`'s optional message, and it is still the only way to do it with the C `assert` macro.
:::

::: check
A colleague writes `assert(fd = open_port());` intending `==`. Describe both bugs and what each build does.
:::

::: answer
Two bugs. First, `=` instead of `==` means the assertion tests whether the assigned value is non-zero rather than comparing it, so it passes for any non-zero file descriptor and fails for zero — which is a *valid* descriptor. Second, and worse, the call is inside the assertion, so under `-DNDEBUG` the whole expression vanishes: the port is never opened and `fd` is never assigned, leaving it uninitialised, which is undefined behaviour the moment it is read. The debug build appears to work and the release build fails in a way that has no obvious connection to the line that caused it. `-Wall` catches the assignment-in-condition part with `-Wparentheses`; nothing catches the disappearing side effect except knowing the rule. Write `const int fd = open_port(); assert(fd >= 0);` — and then handle a failed open properly, because a port that will not open is something the world can do.
:::

::: check
The debug build's assertion message appeared but the line the program had already printed did not. Explain, and say what it implies for debugging a crash.
:::

::: answer
`stdout` is block-buffered when it is not connected to a terminal, so the printed line was sitting in a buffer waiting to be flushed. `abort()` terminates the process without flushing it, and the buffer is lost. `stderr` is unbuffered by design, so the assertion message was written immediately and survived. The implication is that the last output you see before a crash is not the last thing the program did — there may be several lines of `stdout` you will never see, and a bug can look as though it happens earlier than it does. Log diagnostics to `stderr`, or flush after each line, when you are chasing a crash.
:::

::: check
Give two conditions from a GNC context that belong in `static_assert`, two that belong in `assert`, and two that belong in neither.
:::

::: answer
`static_assert`: that a telemetry struct is exactly the size the interface control document specifies, and that a ring buffer's capacity times its element size is within the RAM budget — both are constant expressions and both are requirements that must never be violated on any target. `assert`: that a quaternion handed to a conversion function has unit norm to within a tolerance, and that a loop index used to address a fixed array is below its bound — both are true unless some part of the program has a bug, and both are cheap to check while developing. Neither: that a star tracker returned a valid attitude solution, and that an uplinked command's checksum matches. Those are things the world can legitimately do wrong, so they need real handling that stays in the flight build — a fault code, a safe mode, a rejected packet — not a check that `-DNDEBUG` deletes.
:::

## Summary

| Item | Behaviour |
| --- | --- |
| `static_assert(cond, "msg")` | checked during compilation; condition must be a constant expression; failure stops the build |
| `static_assert(cond)` | same, message optional since C++17 |
| Typical uses | `sizeof`, `offsetof`, `is_trivially_copyable_v`, integer widths, budgets, table lengths |
| Compiler output | both compilers print the reduced comparison, e.g. `12 == 16` |
| `assert(cond)` | run-time; on failure writes to `stderr` and calls `abort()` |
| Exit status | 134 = 128 + `SIGABRT` |
| `&& "message"` | attaches text to an assertion without changing its truth value |
| `NDEBUG` | defined in release builds; removes `assert` and everything inside it |
| Side effects in `assert` | disappear in release builds — never put a call there |
| Assertion vs handling | an assertion states what is true unless there is a bug; anything the world can cause needs real code |
| Flight practice | a project macro that is always present, records a fault code and takes a defined action |

That is the end of the module. You can build a multi-file program by hand and with a Makefile and explain every flag; read an undefined-reference or multiple-definition error and name its cause; say what undefined behaviour is and name several instances; choose a fixed-width type for a telemetry field and justify it; and read a program and say where every object lives and when it dies. The next module, *Memory, Pointers, References and Ownership*, takes the lifetime rules from lesson 11 and builds the whole ownership vocabulary on them.
