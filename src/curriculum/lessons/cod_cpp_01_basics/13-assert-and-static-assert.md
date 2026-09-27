---
id: l13-assert-and-static-assert
title: assert and static_assert
minutes: 22
covers:
  - assert and static_assert
---

Think about how a new car gets checked. At the factory, an inspector measures every part before the car is put together. A bolt that is the wrong size never makes it into a car at all. Then, on the test track, engineers drive with extra warning lights wired to the dashboard, so any surprise shows up at once. Before the car is sold, those extra lights are taken out.

C++ gives you both kinds of check. **`static_assert`** (read "static assert") is the factory inspector: it is checked while the program is being compiled, so a broken assumption is a build failure and can never reach a vehicle. **`assert`** is the test-track warning light: it is checked while the program runs, in builds where it is switched on, and it stops the program the moment an assumption turns out false. And like those extra lights, it is removed from the build you ship.

Why bother? Every function you write assumes things. That a pointer is not null. That a count is positive. That the packet header is still twelve bytes. That `size_t` is 64 bits on this computer. Most of those assumptions live in a comment, or in the author's head, and both get erased by the first rewrite. An assertion writes the assumption down in a form a machine checks.

Python has one `assert`. It raises `AssertionError`, and it disappears under `python3 -O`. C++'s run-time `assert` is the same idea with a sharper edge. It calls `abort()`, which ends the program on the spot instead of raising something you can catch. And it is removed by defining `NDEBUG`, which every release build does. This lesson covers both kinds, the trap that removal sets, and how flight-software projects really use them.

## `static_assert`: checked while compiling

`static_assert(condition)` or `static_assert(condition, "message")` checks a condition during compilation. If the condition is false, the build stops and prints your message. Since C++17 the message is optional.

The condition must be a **[[constant expression|constant-expression]]** — something the compiler can work out completely, the same idea lesson 07 called `constexpr`. In practice that means:

- `sizeof(T)` — how many bytes a type takes;
- `alignof(T)` — the byte boundary a type must start on;
- `offsetof(T, member)` — how many bytes from the start of a struct a member begins;
- values from `std::numeric_limits`, such as the largest `std::uint8_t`;
- **type traits** from `<type_traits>` — yes-or-no facts about a type, such as `std::is_floating_point_v<T>`;
- any `constexpr` function you have written.

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

Add a ring of 512 headers, `std::array<TelemetryHeader, kMaxFrames> ring{};`, and print the sizes:

```text
sizeof(TelemetryHeader) = 12
sizeof(ring)            = 6144 bytes
```

Check the numbers by hand. The fields are $2 + 2 + 4 + 1 + 1 + 2 = 12$ bytes. The ring is $512 \times 12 = 6144$ bytes. The budget is $8 \times 1024 = 8192$ bytes, and $6144 \le 8192$, so the budget check passes with 2048 bytes to spare. The offsets match too: `t_ms` starts after two 2-byte fields, at byte 4, and `payload_len` starts after $4 + 4 + 1 + 1 = 10$ bytes.

Every line of that is a requirement that would otherwise be a comment. Now watch each one catch a mistake:

- Someone inserts a `std::uint32_t` in the middle. The size check fails and says what breaks.
- Someone reorders two fields to make them read nicer. The `offsetof` checks fail.
- Someone adds a `std::string` member. The struct is no longer **[[trivially copyable|trivially-copyable]]**, so that check fails — it can no longer be copied byte for byte into a packet.
- Someone builds for a 32-bit processor. The `size_t` check fails on the very first compile, not in flight.

Now break one on purpose. Claim the header is sixteen bytes, and read what the compilers say. g++ 13.3.0:

```text
hdr.cpp:18:39: error: static assertion failed: TelemetryHeader must be 16 bytes on the wire
   18 | static_assert(sizeof(TelemetryHeader) == 16, "TelemetryHeader must be 16 bytes on the wire");
      |               ~~~~~~~~~~~~~~~~~~~~~~~~^~~~~
hdr.cpp:18:39: note: the comparison reduces to '(12 == 16)'
```

clang++ 18.1.3:

```text
hdr.cpp:18:15: error: static assertion failed due to requirement 'sizeof(TelemetryHeader) == 16': TelemetryHeader must be 16 bytes on the wire
hdr.cpp:18:39: note: expression evaluates to '12 == 16'
```

Both print the actual *values*: `12 == 16`. So your message should not repeat the condition. The compiler already shows the numbers. Your job is to tell the reader why it matters.
:::

Where `static_assert` earns its place:

- **Wire and shared-memory layouts.** Size, member offsets and trivial copyability, exactly as the **[[interface control document|icd]]** says.
- **Platform assumptions.** Integer widths, `CHAR_BIT` (the number of bits in a byte), and byte order where the compiler exposes it.
- **Budgets.** Buffer sizes against a RAM allowance, as lesson 07 did.
- **Template and API rules.** "This function needs a floating-point type", with `std::is_floating_point_v`.
- **Tables that must match.** That a names table has as many entries as its enumeration has values.

## `assert`: checked while running

`assert(condition)` comes from `<cassert>`. It checks while the program runs. If the condition is false, it writes a message to `stderr` (the error stream) and calls `abort()`.

```cpp
double mean_az(const double* az, std::size_t n) {
    assert(az != nullptr);
    assert(n > 0 && "mean_az requires at least one sample");
    double sum = 0.0;
    for (std::size_t i = 0; i < n; ++i) sum += az[i];
    return sum / static_cast<double>(n);
}
```

Read `!=` as "is not equal to" and `&&` as "and". The first assertion says "the pointer is not null". The second says "there is at least one sample".

The program first prints the mean of three samples, then calls `mean_az(samples, 0)` — a bug in the caller. With output sent to a file, the debug build prints:

```text
a1: a1.cpp:7: double mean_az(const double*, std::size_t): Assertion `n > 0 && "mean_az requires at least one sample"' failed.
```

and the shell reports **[[exit status 134|exit-status]]**. The message names the program (`a1`), the file, the line, the function, and the condition exactly as written.

Why is the text in quotes there? A string literal that is not empty is always true: it becomes a pointer, and any non-null pointer counts as `true`. So `X && "message"` is true exactly when `X` is. The string changes nothing about the check, but it does appear in the printed message. That is the only way to attach a note to the C `assert`.

One detail from that run is worth knowing. The program had already printed the first mean to `stdout` before the assertion fired — and **that line never appeared** in the file. When output goes to a file or a pipe, `stdout` is **[[block-buffered|stdout-buffer]]**: it collects text in memory and writes it out in batches. `abort()` does not write out that batch, so it is lost. The assertion message survives because `stderr` is unbuffered. When you are chasing a crash and the last line you expected is missing, this is usually why. Print diagnostics to `stderr`, or flush.

### `NDEBUG` removes it entirely

`assert` is a **[[macro|ndebug-macro]]**, a piece of text the preprocessor swaps in before compiling (lesson 01). If a name called `NDEBUG` ("no debug") is defined when `<cassert>` is included, `assert(...)` is replaced by an expression that does nothing. Every release build defines `NDEBUG`. CMake's `Release` and `RelWithDebInfo` settings add `-DNDEBUG` for you.

Build the same program with `-DNDEBUG`:

```text
-9.8100
-nan
```

The exit status is 0. No abort. The first line is the mean of $-9.80$, $-9.81$ and $-9.82$: their sum is $-29.43$, and $-29.43 / 3 = -9.81$. That makes sense — the middle of three evenly spaced numbers. The second line is the bad call. It divided $0.0$ by $0$, got "not a number" (NaN), printed it, and finished "successfully".

That is the deal. Assertions catch *programmer* mistakes while you develop, and they are gone in the build you ship. Anything that must be checked in flight has to be checked by real code.

::: warning Never put a side effect inside `assert`
Because `assert` disappears, anything with a **side effect** inside it — a function call that changes something, an assignment, a `++` — disappears with it. This is a real defect, not a matter of style:

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

The sensor is never armed in the build you fly. Write `const int rc = arm_sensor(); assert(rc == 0);` instead — and then ask whether a failed `rc` should really be handled rather than asserted.
:::

### What belongs in an assertion

Here is the line to draw. An assertion states something that is true *unless the program has a bug*. It is not error handling.

| Condition | Mechanism |
| --- | --- |
| A caller passed a null pointer | `assert` — a bug in the caller |
| A loop index went past the buffer | `assert` — a bug here |
| An invariant broke | `assert` — a bug somewhere |
| A sensor returned a value out of range | real code — the world, not a bug |
| A packet checksum failed | real code — the radio link, not a bug |
| A configuration file is missing | real code — the environment |

The test: can a *correct* program meet this condition? If yes, it is an input, and it needs handling that stays in the release build. If no, it is an assumption, and `assert` writes it down and checks it for free while you develop.

::: key
`static_assert` is checked during compilation and its condition must be a constant expression; a failure stops the build. `assert` is checked at run time, prints to `stderr` and calls `abort()`, and is removed entirely when `NDEBUG` is defined — so it must never contain a side effect, and never replaces handling for something the world can actually do.
:::

::: example How a flight project really uses assertions
The **[[Power of Ten|power-of-ten]]** rules, written at NASA's Jet Propulsion Laboratory for safety-critical code, include one that surprises people: the code should average *at least two run-time assertions per function*. The reasoning is about odds, not looks. Testing finds defects at a steady rate, and each extra assertion is one more place a defect can be caught. An assertion is also a machine-checked statement of what the author believed — documentation that cannot drift out of date.

The same rules add two conditions that follow from everything above. Assertions must be **side-effect free**, for the reason the warning showed. And a failed assertion must lead to a **defined recovery action**. `abort()` is not a recovery action on a vehicle in flight.

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

Read `!(cond)` as "not cond". `__FILE__` and `__LINE__` are filled in by the compiler with the current file name and line number. Here it is guarding a time step, in a program compiled *with* `-DNDEBUG`:

```cpp
void step(double dt) {
    GNC_ASSERT(dt < 0.1, 42);   // fault 42: time step too large
    std::printf("step ok\n");
}

int main() { step(0.01); step(0.5); }
```

```text
step ok
fault 42 at step.cpp:14
```

The first call passes the check ($0.01 < 0.1$) and carries on. The second fails it ($0.5$ is not below $0.1$), so the fault is recorded and the function returns early. And it still fired in a build with `NDEBUG` defined.

Three differences from `assert`, all on purpose:

- It is **not** removed by `NDEBUG`, because the check is part of how the vehicle behaves.
- It records a fault code that goes down in telemetry, so the ground knows which assumption failed and where.
- It takes a defined action — here returning early; elsewhere entering **[[safe mode|safe-mode]]** or switching to a backup computer — instead of killing the process that is flying the vehicle.

The `do { ... } while (false)` wrapper is the standard trick for macros. It turns the macro's several lines into **[[one statement|do-while-false]]**, so `if (x) GNC_ASSERT(...); else ...` still pairs the `else` correctly.

What this means for you as a new hire. Write `static_assert` freely: it costs nothing at run time and cannot misfire. Use `assert` in your own tools, tests and analysis code. In flight code, use the project's own macro, after reading what it does when it fires.
:::

::: example Keeping an enumeration and its names in step
Lesson 12's mode-name table has a defect waiting to happen: the list of modes and the list of names can drift apart. Here it is again, using lesson 10's `enum class`:

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

The last enumerator, `Count`, is a common trick. Enumerators count up from 0, so `Idle` is 0 and `Landing` is 4, and **[[Count|count-enumerator]]** lands on 5 — exactly the number of real modes. The `static_assert` ties the table's length to it.

Now add `Mode::Terminal` before `Count` and forget its name. `Count` becomes 6 while the table still has 5 entries, and g++ stops the build:

```text
en2.cpp:10:37: error: static assertion failed: kModeNames is out of step with enum class Mode
en2.cpp:10:37: note: the comparison reduces to '(5 == 6)'
```

Notice the run-time check as well. `static_assert` guarantees the *table* has the right length. It cannot guarantee that the `Mode` handed to `mode_name` is one of the named ones, because a byte cast from a packet can hold anything (lesson 10's warning). `mode_name(Mode::Count)` shows the guard at work: 5 is not below 5, so it returns `"UNKNOWN"` instead of reading past the end. The two checks catch different failures, and you want both.
:::

## Check yourself

::: check
Someone suggests replacing `static_assert(sizeof(Header) == 12)` with a unit test. What would you lose?
:::

::: answer
It *can* be a unit test — `EXPECT_EQ(sizeof(Header), 12u)` is valid — but you lose three things.

First, the test only runs when someone runs the tests, on the computer the tests run on. `static_assert` runs on every compile of every target, including the flight build compiled for the vehicle's own processor, where the size may differ and the tests may not run at all.

Second, the failure arrives later. A broken layout compiles, links and shows up in a test report, instead of stopping the build at the file you just edited.

Third, the check is no longer next to the struct, so the next person to reorder the fields never sees it. Check a compile-time fact at compile time; keep unit tests for behavior.
:::

::: check
In `assert(n > 0 && "mean_az requires at least one sample")`, why does the string not change the condition, and what does it do?
:::

::: answer
A non-empty string literal is an array of `char` that decays to a pointer, and a non-null pointer converts to `true`. So `X && "message"` has exactly the same truth value as `X`.

What it adds is text. `assert` turns its whole argument into a string for the error message, so the explanation appears word for word in the "Assertion ... failed." line. It is the only way to attach an explanation to the C `assert` macro.
:::

::: check
A colleague writes `assert(fd = open_port());`, meaning `==`. Describe both bugs, and what each build does.
:::

::: answer
Bug one: `=` assigns instead of comparing. The assertion then tests whether the returned value is non-zero. It passes for any non-zero file descriptor and fails for zero — and zero is a *valid* descriptor.

Bug two, worse: the call is inside the assertion. Under `-DNDEBUG` the whole expression vanishes. The port is never opened and `fd` is never assigned. If `fd` was declared without a value, reading it later is undefined behaviour.

So the debug build seems to work, and the release build fails somewhere with no obvious link to this line. g++'s `-Wall` flags the first bug (`-Wparentheses`: "suggest parentheses around assignment used as truth value"). In a tiny program, the release build's `-Wuninitialized` may also notice `fd` is never set — but nothing flags the vanished call itself except knowing the rule.

Write `const int fd = open_port(); assert(fd >= 0);` — and then handle a failed open properly, because a port that will not open is something the world can do.
:::

::: check
The debug build's assertion message appeared, but a line the program had already printed did not. Explain, and say what it means when you debug a crash.
:::

::: answer
`stdout` is block-buffered when it is not connected to a terminal, so the printed line was sitting in memory, waiting to be written out. `abort()` ends the process without writing that buffer, so the line is lost. `stderr` is unbuffered by design, so the assertion message went out immediately and survived.

What it means: the last output you see before a crash is not the last thing the program did. Several lines of `stdout` may be missing, and a bug can look as if it happened earlier than it did. When you chase a crash, log to `stderr`, or flush after each line.
:::

::: check
From guidance and navigation work, give two conditions that belong in `static_assert`, two that belong in `assert`, and two that belong in neither.
:::

::: answer
`static_assert`: that a telemetry struct is exactly the size the interface control document specifies, and that a ring buffer's capacity times its element size fits the RAM budget. Both are constant expressions, and both must hold on every target.

`assert`: that a quaternion (the four numbers used to store an orientation) handed to a conversion function has length 1 within a tolerance, and that a loop index into a fixed array is below its bound. Both are true unless some part of the program has a bug, and both are cheap to check while developing.

Neither: that a star tracker (a camera that works out the vehicle's orientation from the stars) returned a valid solution, and that an uplinked command's checksum matches. The world can legitimately get those wrong, so they need real handling that stays in the flight build — a fault code, a safe mode, a rejected packet — not a check that `-DNDEBUG` deletes.
:::

## Summary

| Item | Behavior |
| --- | --- |
| `static_assert(cond, "msg")` | checked during compilation; condition must be a constant expression; failure stops the build |
| `static_assert(cond)` | same, message optional since C++17 |
| Typical uses | `sizeof`, `offsetof`, `is_trivially_copyable_v`, integer widths, budgets, table lengths |
| Compiler output | both compilers print the reduced comparison, e.g. `12 == 16` |
| `assert(cond)` | run time; on failure writes to `stderr` and calls `abort()` |
| Exit status | 134 = 128 + 6, signal 6 being `SIGABRT` |
| `&& "message"` | attaches text to an assertion without changing its truth value |
| `NDEBUG` | defined in release builds; removes `assert` and everything inside it |
| Side effects in `assert` | disappear in release builds — never put a call there |
| Assertion vs handling | an assertion states what is true unless there is a bug; anything the world can cause needs real code |
| Flight practice | a project macro that is always present, records a fault code and takes a defined action |

That is the end of the module. You can now build a multi-file program by hand and with a Makefile and explain every flag; read an undefined-reference or multiple-definition error and name its cause; say what undefined behaviour is and name several instances; choose a fixed-width type for a telemetry field and justify it; and read a program and say where every object lives and when it dies. The next module, *Memory, Pointers, References and Ownership*, takes the lifetime rules from lesson 11 and builds the whole ownership vocabulary on them.

::: context constant-expression Known before the program exists
A constant expression is one the compiler can finish working out by itself, with nothing left to learn at run time. `sizeof(TelemetryHeader) == 12` qualifies: the compiler laid out the struct, so it knows the size. `n > 0` inside `mean_az` does not, because `n` arrives only when someone calls the function. That is the whole split in this lesson: facts known while compiling go to `static_assert`, facts known only while running go to `assert` or real code.
:::

::: context trivially-copyable Copying by the byte
A type is trivially copyable when copying its bytes, for example with `std::memcpy`, gives a correct copy. A struct of plain numbers qualifies. A `std::string` does not: its bytes include a pointer to heap memory, so a byte copy would give two strings sharing one block, and both would try to free it. Packet code copies headers byte for byte into buffers, so it needs the guarantee, and `std::is_trivially_copyable_v` checks it.
:::

::: context icd The document both sides sign
An interface control document, or ICD, is the agreement between two systems that must talk to each other — say, the flight software and the ground station. It lists every field of every packet: its name, its type, its byte offset, its units. When the ICD says the header is 12 bytes with the time at byte 4, a `static_assert` turns that sentence into something the compiler enforces on every build.
:::

::: context exit-status Reading the number 134
When a program ends normally, its exit status is whatever `main` returned, usually 0. When the operating system kills it with a signal, shells such as bash report 128 plus the signal's number. `abort()` raises `SIGABRT`, which is signal 6 on Linux, so the status is $128 + 6 = 134$. A status of 139 is $128 + 11$, `SIGSEGV`, a segmentation fault — the other crash number you will see often.
:::

::: context stdout-buffer Two paths out of a program
`stdout` collects text in a buffer and writes it out in batches. `stderr` writes every message straight away. When `abort()` ends the program, whatever is still in the buffer is thrown away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="74" height="50" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="47" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">program</text>
  <line x1="84" y1="62" x2="140" y2="38" stroke="#1d6fd1" stroke-width="2"/>
  <text x="104" y="36" font-size="11" fill="#1d6fd1" text-anchor="middle">stdout</text>
  <rect x="140" y="20" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="188" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">buffer: -9.8100</text>
  <line x1="236" y1="37" x2="290" y2="37" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="254" y1="27" x2="272" y2="47" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="272" y1="27" x2="254" y2="47" stroke="#b4232c" stroke-width="2.5"/>
  <text x="263" y="66" font-size="11" fill="#b4232c" text-anchor="middle">lost at abort</text>
  <line x1="84" y1="88" x2="290" y2="112" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="296,113 286,107 285,117" fill="#1f2a44"/>
  <text x="170" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">stderr: Assertion ... failed.</text>
  <rect x="296" y="20" width="56" height="112" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="324" y="80" font-size="11" fill="#6c7a93" text-anchor="middle">file</text>
</svg>
```

Sent to a terminal, `stdout` is line-buffered instead, so the line would have appeared there.
:::

::: context ndebug-macro One line, two builds
The preprocessor runs before the compiler proper and edits your source as text. It looks at `NDEBUG` once, where `<cassert>` is included, and rewrites every `assert` to match:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="55" width="110" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">assert(n &gt; 0);</text>
  <line x1="120" y1="66" x2="176" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="80" x2="176" y2="112" stroke="#6c7a93" stroke-width="2"/>
  <text x="140" y="36" font-size="11" fill="#1d6fd1" text-anchor="middle">debug</text>
  <text x="140" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">-DNDEBUG</text>
  <rect x="176" y="18" width="174" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="263" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">test n &gt; 0; if false, abort()</text>
  <rect x="176" y="94" width="174" height="36" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="263" y="116" font-size="11" fill="#6c7a93" text-anchor="middle">does nothing at all</text>
</svg>
```

Anything written inside the brackets — including a function call — goes with it.
:::

::: context power-of-ten Ten rules for code that must not fail
Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten: Rules for Developing Safety-Critical Code" in 2006. It is ten short rules for C: no `goto` or recursion, every loop with a fixed upper bound, no heap allocation after start-up, functions short enough to fit on one printed page, an average of at least two assertions per function, and every build with all warnings on and none left. Many flight-software coding standards borrow from it, and the same ideas run through this whole track.
:::

::: context safe-mode What a spacecraft does when something is wrong
Safe mode is a spacecraft's way of pausing. It turns off everything not needed to survive, points its solar panels at the Sun to keep power up, points an antenna where the ground can hear it, and waits for instructions. Many vehicles also carry duplicate computers and sensors, often called "strings", and can switch to the backup. A failed flight assertion usually leads to one of these, never to a program that simply stops.
:::

::: context do-while-false Why a loop that never repeats
A macro is pasted in as text. If `GNC_ASSERT` were two plain statements in braces, then `if (x) GNC_ASSERT(c, 1); else y();` would turn into `if (x) { ... }; else y();` — and the stray `;` ends the `if`, so the `else` has nothing to attach to and the build fails. Wrapping the body in `do { ... } while (false)` makes it a single statement that wants exactly one `;` after it. The loop body runs once, and the compiler removes the loop entirely.
:::

::: context count-enumerator The enumerator that counts
Enumerators get the values 0, 1, 2 and so on, in order. Put one extra name at the end and its value equals the number of names before it:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="56" height="34" fill="#8fb8f0"/>
    <rect x="66" y="30" width="56" height="34" fill="#8fb8f0"/>
    <rect x="122" y="30" width="56" height="34" fill="#8fb8f0"/>
    <rect x="178" y="30" width="56" height="34" fill="#8fb8f0"/>
    <rect x="234" y="30" width="56" height="34" fill="#8fb8f0"/>
    <rect x="296" y="30" width="56" height="34" fill="#f2b880" stroke-dasharray="5 4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="38" y="51">Idle</text><text x="94" y="51">Ascent</text><text x="150" y="51">Coast</text>
    <text x="206" y="51">Entry</text><text x="262" y="51">Landing</text><text x="324" y="51">Count</text>
  </g>
  <g font-size="12" fill="#6c7a93" text-anchor="middle">
    <text x="38" y="22">0</text><text x="94" y="22">1</text><text x="150" y="22">2</text>
    <text x="206" y="22">3</text><text x="262" y="22">4</text><text x="324" y="22">5</text>
  </g>
  <line x1="12" y1="80" x2="288" y2="80" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="150" y="98" font-size="11" fill="#1d6fd1" text-anchor="middle">5 real modes, 5 names in kModeNames</text>
  <text x="324" y="98" font-size="11" fill="#b4232c" text-anchor="middle">not a mode</text>
</svg>
```

`Count` is a bookkeeping value, not a real mode, which is why `mode_name` must still guard against it.
:::
