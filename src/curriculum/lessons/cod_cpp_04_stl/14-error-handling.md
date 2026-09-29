---
id: l14-error-handling
title: "Error handling: exceptions, error codes and expected"
minutes: 28
covers:
  - "Error handling: exceptions, error_code, expected, and why flight code disables exceptions"
---

There are two ways a building can tell you something went wrong. One is the fire alarm. It goes off where the trouble started, and everybody stops and leaves, floor by floor, until they reach the one place where someone is in charge. The other is a form handed back across a counter, stamped "REJECTED: missing signature". Nobody evacuates. The person holding the form reads the stamp and decides what to do. But if they do not read it, nothing forces them to.

C++ has both. An **exception** is the fire alarm: `throw` abandons the current function and every caller above it until a `catch` takes charge. An **error code** — or its modern forms, `std::error_code` and `std::expected` — is the stamped form: the function returns normally, and the answer says whether it worked.

Flight software cares about this choice more than most code. A thruster controller that meets a bad sensor reading must do something defined, in a bounded time, every time. This lesson shows each tool, measures what a throw really costs, and explains why so many flight teams switch exceptions off entirely.

## Bugs, failures, and which tool fits

First, sort the trouble into two kinds.

- A **bug** can only happen if the program itself is wrong: an index past a loop bound you wrote, a quaternion that should have unit length and does not. The basics module taught the tool: `assert`, which calls `abort()` when it fails and vanishes in release builds that define `NDEBUG`.
- An **error** is something the world can do to a correct program: a sensor that times out, a command with a bad checksum, a missing file. It will happen in flight, and needs handling that stays in the flight build.

::: key
`assert` is for bugs — things that are true unless the program is wrong — and is removed by `NDEBUG`. Errors are things the world can legitimately do; they need handling that stays in the flight build: a returned error, a fault code, a safe mode.
:::

## Return codes: the oldest way

The C way is to return a number. Zero means success; anything else says what failed. The real result, if there is one, comes back through a reference parameter:

```cpp
[[nodiscard]] int read_gyro(GyroSample& out);   // 0 = ok, -1 = timeout, -2 = bad CRC
```

It is cheap, every call site shows the check, and its timing is easy to bound, because the error path is ordinary code.

Its weakness is that nothing makes the caller look. `read_gyro(s);` compiles, ignores the failure and uses a garbage `s`. The `[[nodiscard]]` attribute from the basics module turns that into a warning, and `-Werror` into a build failure. And a bare `int` says little: `-2` means "bad CRC" only to someone who has the table.

## Exceptions: the fire alarm

The RAII module showed the mechanics. `throw std::runtime_error("sensor timeout");` builds an exception object and leaves the function at once. It travels up the callers, running destructors on the way — **stack unwinding** — until a `try` block has a matching `catch`:

```cpp
try {
    GyroSample s = read_gyro_or_throw();
    update_attitude(s);
} catch (const std::runtime_error& e) {
    report_fault(e.what());
}
```

Read `catch (const std::runtime_error& e)` as "catch a runtime error, by const reference, as `e`". Always catch by reference; catching by value copies and can **slice** the object, as lesson 10 of the RAII module showed.

The standard exceptions form a family tree under `std::exception`: `std::logic_error` and children such as `std::out_of_range` (from `vector::at`), and `std::runtime_error` and its children. A `catch` for a parent catches every child.

Two rules close the picture. If an exception reaches the top of `main` with no matching `catch`, the program calls **`std::terminate`**, which by default calls `abort()`. And if an exception tries to leave a function marked `noexcept` — a promise that nothing escapes — `std::terminate` is called there and then.

Exceptions do some things well. They cannot be ignored by accident, and they keep the normal path free of `if`s. What they cost is the next question.

## What a throw costs

On x86-64 Linux, g++ uses the **[[zero-cost model|unwind-tables]]**. The normal path gets no extra instructions. Instead, the compiler writes tables beside the machine code that say, for every function, how to undo its stack frame and which destructors to run. Nothing reads them until something throws. Then a runtime library, the **unwinder**, reads them to find a matching `catch` and walks back up the stack, frame by frame.

So the happy path is free and the throw is not. By how much?

::: example Timing success and failure, both ways
Two functions report a sensor timeout, one by throwing and one by returning `-1`. Each is called a million times succeeding, then a million times failing.

```cpp laptop
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <stdexcept>
#include <vector>

// Kept out of line so the optimiser cannot see through the calls.
[[gnu::noinline]] double read_or_throw(bool fail) {
    if (fail) throw std::runtime_error("sensor timeout");
    return 1.0;
}

[[gnu::noinline]] int read_or_code(bool fail, double& out) {
    if (fail) return -1;                 // error code
    out = 1.0;
    return 0;
}

using clock_type = std::chrono::steady_clock;
double ns(clock_type::duration d) { return std::chrono::duration<double, std::nano>(d).count(); }

// Time N calls, every one succeeding or every one failing.
double time_throw(bool fail, int n, int& errors) {
    auto t0 = clock_type::now();
    for (int i = 0; i < n; ++i) {
        try { (void)read_or_throw(fail); }
        catch (const std::runtime_error&) { ++errors; }
    }
    return ns(clock_type::now() - t0) / n;
}

double time_code(bool fail, int n, int& errors) {
    auto t0 = clock_type::now();
    for (int i = 0; i < n; ++i) {
        double v;
        if (read_or_code(fail, v) != 0) ++errors;
    }
    return ns(clock_type::now() - t0) / n;
}

int main() {
    constexpr int N = 1'000'000;
    int errors = 0;
    std::printf("success path: exceptions %6.1f ns, error codes %6.1f ns\n",
                time_throw(false, N, errors), time_code(false, N, errors));
    std::printf("failure path: exceptions %6.1f ns, error codes %6.1f ns\n",
                time_throw(true, N, errors), time_code(true, N, errors));
    std::printf("errors counted: %d\n", errors);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run on one machine:

```text
success path: exceptions    1.1 ns, error codes    1.7 ns
failure path: exceptions 1180.2 ns, error codes    1.9 ns
errors counted: 2000000
```

Read the rows.

1. **Success path.** About $1$ ns per call both ways; the exception version even came out a little ahead. A `try` adds no work when nothing is thrown.
2. **Failure path.** The error code still costs about $2$ ns. The throw costs about $1{,}180$ ns, roughly $1.2\ \mu\mathrm{s}$: between 700 and 950 times more across three runs.
3. **The count.** Two million failures in all, so every one was seen.

Sanity check: a microsecond is thousands of processor cycles, which fits a throw's work — allocate, search tables, unwind, match — against one compare and return. Your numbers will differ; the ratio of hundreds to one holds.
:::

A 1 kHz control loop has $1{,}000\ \mu\mathrm{s}$ per cycle, so $1.2\ \mu\mathrm{s}$ looks affordable. But it is a typical number, not a bound. A second program on the same machine timed 10,000 throws one at a time, through frames that each held one object with a destructor. Thrown one frame deep, the median was $2.1\ \mu\mathrm{s}$, but the first throw of a run took $28$ to $74\ \mu\mathrm{s}$ and the slowest up to $143\ \mu\mathrm{s}$. Thrown twenty frames deep, the median was $13.3\ \mu\mathrm{s}$ — about $0.6\ \mu\mathrm{s}$ per extra frame.

So a throw's cost depends on who called whom at run time, and its worst case sits far above its median. A timing analysis needs a worst case it can defend; a throw does not offer one.

### A throw uses the heap

The exception object cannot live in the throwing function's frame, which is about to disappear. g++'s runtime allocates it on the heap with `malloc`. The next program counts that.

::: example Counting the allocations inside one throw
```cpp laptop
#include <cstdio>
#include <cstdlib>
#include <stdexcept>

extern "C" void* __libc_malloc(std::size_t);
static int malloc_calls = 0;
static std::size_t malloc_bytes = 0;

// Count every malloc in the program, then hand the request to glibc's own.
extern "C" void* malloc(std::size_t n) {
    ++malloc_calls;
    malloc_bytes += n;
    return __libc_malloc(n);
}

[[gnu::noinline]] void check_pressure(double kpa) {
    if (kpa < 50.0) throw std::runtime_error("chamber pressure low");
}

int main() {
    try { check_pressure(10.0); } catch (const std::exception&) {}   // warm-up
    int before = malloc_calls;
    std::size_t bytes_before = malloc_bytes;
    bool caught = false;
    try {
        check_pressure(10.0);
    } catch (const std::exception&) {
        caught = true;
    }
    const int calls = malloc_calls - before;          // read the counters
    const std::size_t bytes = malloc_bytes - bytes_before;  // before printing
    std::printf("caught: %s\n", caught ? "yes" : "no");
    std::printf("mallocs during one throw: %d (%zu bytes)\n", calls, bytes);
}
```

This replaces `malloc` for the whole program with a counting version that passes each request on to glibc's real allocator — a test trick for Linux, not something to ship. Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
caught: yes
mallocs during one throw: 2 (189 bytes)
```

Two allocations for one throw:

1. The exception object plus the runtime's bookkeeping header in front of it: $16$ bytes of `std::runtime_error` and $128$ of header, $144$ in all.
2. The message: `std::runtime_error` keeps its own copy of the 20-character text in a small block with its own header, $45$ bytes.

Sanity check: $144 + 45 = 189$. Throwing a plain `int` measured one allocation of $132$ bytes: the $128$-byte header plus a 4-byte `int`.
:::

In a flight program that forbids heap use after start-up, that is a problem by itself. (libstdc++ keeps a small emergency pool in case `malloc` fails, but that is a fallback, not a design.)

### A throw costs code size

The tables and cleanup code take room. A small file that builds a `std::vector` of structs holding strings, compiled with and without exceptions and measured with `size`, came to 5,332 bytes against 4,747: about 12% more, from a 71-byte table of `catch` and cleanup locations (`.gcc_except_table`), a larger unwind table (`.eh_frame`, 448 bytes against 296) and extra cleanup code. The percentage varies by project; the direction does not.

::: key
Exceptions under the zero-cost model: the happy path costs nothing, but a throw costs microseconds, allocates on the heap, takes time that grows with the frames it unwinds and has no useful worst case, and the unwind tables and cleanup code add to binary size.
:::

## std::error_code: a number that knows what it means

`std::error_code`, from `<system_error>`, fixes the bare `int`'s silence. It holds a number and a pointer to an **[[error category|error-category]]** that says which table the number comes from, and it can print its own message. An empty one means success; `if (ec)` reads "if there was an error".

`std::filesystem` offers every operation twice: one form throws, one fills a `std::error_code&` instead. `std::from_chars`, the fast number parser from `<charconv>`, never throws; it returns a `std::errc`, an enumeration of standard error conditions, which `std::make_error_code` wraps into a `std::error_code`.

::: example Parsing an uplinked number without exceptions
```cpp
#include <charconv>
#include <cstdio>
#include <filesystem>
#include <string_view>
#include <system_error>

// Parse an uplinked integer field such as "1200" without exceptions.
[[nodiscard]] std::error_code parse_int(std::string_view text, int& out) {
    auto [ptr, ec] = std::from_chars(text.data(), text.data() + text.size(), out);
    if (ec != std::errc{}) return std::make_error_code(ec);
    if (ptr != text.data() + text.size())
        return std::make_error_code(std::errc::invalid_argument);   // junk at the end
    return {};                                                      // success
}

int main() {
    for (std::string_view field : {"1200", "12x0", "99999999999"}) {
        int value = 0;
        std::error_code ec = parse_int(field, value);
        const int w = static_cast<int>(field.size());
        if (ec) std::printf("%-12.*s error %d: %s\n", w, field.data(), ec.value(), ec.message().c_str());
        else    std::printf("%-12.*s ok, value %d\n", w, field.data(), value);
    }

    // Many standard functions come in two forms: one throws, one fills an error_code.
    std::error_code ec;
    const auto bytes = std::filesystem::file_size("/no/such/calibration.bin", ec);
    if (ec) std::printf("file_size: %s (category %s)\n", ec.message().c_str(), ec.category().name());
    else    std::printf("file_size: %ju bytes\n", bytes);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -fno-exceptions` — exceptions switched off, and it still compiles:

```text
1200         ok, value 1200
12x0         error 22: Invalid argument
99999999999  error 34: Numerical result out of range
file_size: No such file or directory (category generic)
```

Step by step:

1. `"1200"`: all four characters read, `ec` empty, `value` is $1200$.
2. `"12x0"`: `from_chars` parsed `12`, reported no error, and stopped at the `x`. `ptr` fell short of the end, so `parse_int` says "invalid argument". Accepting `12` would silently corrupt the command.
3. `"99999999999"` is larger than the biggest 32-bit `int`, $2{,}147{,}483{,}647$, so "result out of range", and `value` is untouched.
4. `file_size` filled `ec` instead of throwing. The **[[numbers 22 and 34|errno-values]]** come from the operating system's error table.

Sanity check: one field parsed; two were refused, each with a readable reason.
:::

## std::expected: the value or the reason

With an out-parameter plus an `error_code`, nothing stops you reading `value` after a failure. C++23 puts answer and error in one box. **`std::expected<T, E>`**, from `<expected>`, read "expected T, or error E", holds *either* a value of type `T` or an error of type `E`, never both.

- `return x;` stores a value. `return std::unexpected(e);` stores an error.
- `if (r)` or `r.has_value()` asks which one is inside.
- `*r` reads the value; `r.error()` reads the error. Each is only valid when that side is present.
- `r.value()` checks first, and throws `std::bad_expected_access` if there is no value.
- `r.and_then(f)` calls `f` on the value if there is one, and otherwise passes the error straight through. It chains steps that can each fail, without an `if` after every step.

It is lesson 05's `std::optional` with a reason attached, and it too lives **[[inside its own bytes|expected-layout]]**, with no heap: a `std::expected<double, int>` is 16 bytes here.

`std::expected` is C++23. On g++ 13, compile with `-std=c++23`; under `-std=c++20` the header exists but is empty, and the compiler says `'expected' in namespace 'std' does not name a template type`.

::: example A throttle command parsed in three checked steps
```cpp fragment
#include <charconv>
#include <cstdio>
#include <expected>
#include <string_view>

enum class CmdError { empty, unknown_verb, bad_number, out_of_range };

const char* to_text(CmdError e) {
    switch (e) {
        case CmdError::empty:        return "empty command";
        case CmdError::unknown_verb: return "unknown verb";
        case CmdError::bad_number:   return "bad number";
        case CmdError::out_of_range: return "throttle out of range";
    }
    return "?";
}

// Step 1: split "THROTTLE 0.72" and check the verb. Returns the number text.
std::expected<std::string_view, CmdError> number_part(std::string_view cmd) {
    if (cmd.empty()) return std::unexpected(CmdError::empty);
    constexpr std::string_view verb = "THROTTLE ";
    if (!cmd.starts_with(verb)) return std::unexpected(CmdError::unknown_verb);
    return cmd.substr(verb.size());
}

// Step 2: turn the text into a double.
std::expected<double, CmdError> to_double(std::string_view text) {
    double x = 0.0;
    auto [ptr, ec] = std::from_chars(text.data(), text.data() + text.size(), x);
    if (ec != std::errc{} || ptr != text.data() + text.size())
        return std::unexpected(CmdError::bad_number);
    return x;
}

// Step 3: check the physical limit, 0.40 to 1.00 of full thrust.
std::expected<double, CmdError> in_limits(double t) {
    if (t < 0.40 || t > 1.00) return std::unexpected(CmdError::out_of_range);
    return t;
}

int main() {
    for (std::string_view cmd : {"THROTTLE 0.72", "THROTTLE 1.30", "THROTLE 0.72", "THROTTLE 0,72"}) {
        std::expected<double, CmdError> r =
            number_part(cmd).and_then(to_double).and_then(in_limits);
        const int w = static_cast<int>(cmd.size());
        if (r) std::printf("%-15.*s -> set throttle %.2f\n", w, cmd.data(), *r);
        else   std::printf("%-15.*s -> rejected: %s\n", w, cmd.data(), to_text(r.error()));
    }
}
```

Built with `g++ -std=c++23 -Wall -Wextra -O2 -fno-exceptions`:

```text
THROTTLE 0.72   -> set throttle 0.72
THROTTLE 1.30   -> rejected: throttle out of range
THROTLE 0.72    -> rejected: unknown verb
THROTTLE 0,72   -> rejected: bad number
```

Follow each command down the chain `number_part(cmd).and_then(to_double).and_then(in_limits)`, read "number part, and then to double, and then in limits".

1. `THROTTLE 0.72` passes all three steps: $0.72$ lies between $0.40$ and $1.00$.
2. `THROTTLE 1.30` passes steps 1 and 2; step 3 rejects it, since $1.30 > 1.00$.
3. `THROTLE 0.72` (misspelled) fails step 1. Both `and_then` calls see an error and pass it along without calling their function.
4. `THROTTLE 0,72` fails step 2: `from_chars` stops at the comma.

Sanity check: each error names the first step that failed, and only the good command sets the throttle — with no `throw`, no `try` and no heap.
:::

::: key
`std::expected<T, E>` (C++23; `-std=c++23` on g++ 13) holds either a value or an error, in its own storage with no heap. Check with `if (r)`, read with `*r` or `r.error()`, and chain fallible steps with `and_then`.
:::

::: warning `*r` on an error is undefined; `r.value()` on an error throws
`*r` does not check. On an `expected` holding an error it is undefined behavior, like `*` on an empty `optional`. `r.value()` does check, and throws `std::bad_expected_access` — which, in a build without exceptions, means the program aborts, as the next section shows. Test `if (r)` first, every time.
:::

## Turning exceptions off: -fno-exceptions

g++ and clang both accept **`-fno-exceptions`**. With it, your code may not contain `throw`, `try` or `catch`:

```text
error: exception handling disabled, use '-fexceptions' to enable
```

But the standard library still has functions written to throw: `vector::at` past the end, `optional::value()` when empty, a `new` that cannot get memory. What happens to them?

::: example What the library does when it cannot throw
```cpp
#include <cstdio>
#include <vector>

int main() {
    std::vector<double> gains{0.5, 1.2, 0.8};
    std::printf("reading gains[10]...\n");
    std::fflush(stdout);
    double g = gains.at(10);          // out of range: the library wants to throw
    std::printf("got %.1f\n", g);     // never reached
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -fno-exceptions`:

```text
reading gains[10]...
terminate called after throwing an instance of 'std::out_of_range'
  what():  vector::_M_range_check: __n (which is 10) >= this->size() (which is 3)
Aborted
```

The shell reported **[[exit status 134|exit-134]]**. And this one, with an empty `std::optional`:

```cpp
#include <cstdio>
#include <optional>

std::optional<double> gps_altitude() { return std::nullopt; }   // no fix yet

int main() {
    std::printf("asking for altitude...\n");
    std::fflush(stdout);
    double h = gps_altitude().value();   // empty: value() wants to throw
    std::printf("h = %.1f\n", h);
}
```

With `-fno-exceptions` it prints `asking for altitude...`, then `Aborted`, exit status 134, and no message. (`expected::value()` on an error did the same.)

Why two different endings?

1. `vector::at` hands its error to a helper in the compiled library, `libstdc++.so`, which was built with exceptions on, so the helper throws. Your code cannot have a `catch`, so the exception reaches the top, and `std::terminate` prints it and calls `abort()`.
2. `optional::value()` lives entirely in the header, so it was compiled with your flags, and libstdc++ writes its throws there so that they become a plain `abort()` when exceptions are off. No exception object is built, so nothing is printed.

Sanity check: in neither program did the next line print. Under `-fno-exceptions` the library's error report is "stop the program", so check the index first, test `has_value()` first, and use `new (std::nothrow)` from the memory module, which returns `nullptr`.
:::

::: key
Under `-fno-exceptions`, `throw`/`try`/`catch` do not compile, and standard-library code that would throw ends the program: header code calls `abort()` directly, and throws from the compiled library reach `std::terminate`. Either way the process aborts.
:::

::: warning Turning off exceptions does not make errors go away
It only removes one way of reporting them. Every `at()`, `value()` and throwing `new` left in the code becomes an abort, so a review must hunt them down.
:::

## Why flight code turns exceptions off

::: key
Many flight-software teams build with `-fno-exceptions` because throwing has unbounded, hard-to-analyze worst-case time; it needs unwinding tables and a runtime (and allocates on the heap); and a missed `catch` terminates the process. Deterministic error returns — error codes, `std::expected`-style types — are auditable and bounded.
:::

You saw three of the reasons above: timing with no defensible worst case, a heap allocation per throw, and tables and cleanup code in the image. Two more matter as much. Any call might throw, so any line might be a hidden exit from the function, which a reviewer or a static-analysis tool must consider; with error returns, every path is on the page. And one forgotten handler turns a recoverable fault into `std::terminate` and a dead process — on a vehicle, possibly the flight software itself.

Notice what is *not* on the list: the ability to describe an error. An exception can carry a type, a message and any fields you like. The objections are about determinism, memory, footprint and analysability, never about expressiveness.

Written standards reflect this. The **[[JSF AV C++ rules|jsf-av]]**, written for the F-35's software, say that C++ exceptions shall not be used. MISRA C++ and the AUTOSAR C++14 guidelines allow exceptions under restrictions, such as using them only for error handling. NASA JPL's best-known **[[coding rules|power-of-ten]]** were written for C, which has no exceptions, and demand the other style: check the return value of every function that has one.

What flight C++ does instead is what this lesson built: `[[nodiscard]]` status codes or `std::expected`-style returns for errors, `assert` for bugs, and for the truly unrecoverable a defined action — a fault code in telemetry, a switch to safe mode — never an uncaught exception.

## Check yourself

::: check
For each, say whether it is a bug (use `assert`) or an error (handle it in the flight build): (a) a star tracker reports "no solution" because the Sun is in its field of view; (b) a ring-buffer index that your own code computed as `head % N` comes out equal to `N`; (c) an uplinked command's CRC does not match.
:::

::: answer
(a) is an error: the world does this to a correct program, and the attitude filter must carry on without the star tracker for a while. (b) is a bug: `head % N` is always less than a positive `N`, so getting `N` means the program is wrong, and `assert(idx < N)` catches it during development. (c) is an error: radio links corrupt bits, so the command must be rejected and the rejection reported in telemetry. Neither (a) nor (c) may rely on `assert`, which disappears under `NDEBUG`.
:::

::: check
In the timing example, why was the success path of the exception version no slower than the error-code version, while its failure path was hundreds of times slower?
:::

::: answer
Under the zero-cost model a `try` adds no instructions; the unwinding information sits in tables that nobody reads until a throw. So succeeding calls cost about $1$ ns either way. A throw does all the work at once: allocate the exception object on the heap, search the tables for a handler, tear down each frame running its destructors, match the type. That measured about $1{,}180$ ns against about $2$ ns for returning `-1`.
:::

::: check
Code built with `-fno-exceptions` calls `samples.at(i)` with `i` equal to `samples.size()`. What happens, and what should the code have done instead?
:::

::: answer
`at` hands the error to a helper in the compiled library, which throws `std::out_of_range`. Nothing can catch it — `try` does not even compile — so `std::terminate` prints the exception and calls `abort()`, exit status 134. The code should check `i < samples.size()` itself and take a defined action on failure, such as returning an error and recording a fault code. If `i` comes from its own loop and can only be out of range through a bug, `operator[]` with an `assert` is the right pair.
:::

::: check
Exceptions are enabled. A function declared `void apply_gains() noexcept` calls `gains.at(7)` on a 3-element vector, and its caller wraps the call in `try { apply_gains(); } catch (const std::out_of_range&) { ... }`. Does the `catch` run?
:::

::: answer
No. `at` throws `std::out_of_range`, but the exception would have to leave `apply_gains`, which promised with `noexcept` that nothing escapes. Breaking that promise calls `std::terminate` at once, and the process aborts; the caller's `catch` never gets a chance. `noexcept` is a promise the program enforces by ending, so put it only on functions that truly cannot throw — or that check the index themselves.
:::

::: check
Write the declaration of a function `read_temperature(int channel)` that returns either a temperature in kelvin as a `double` or one of the errors `timeout` and `bad_crc`, without exceptions. How does a caller use the result, and what flag does g++ 13 need?
:::

::: answer
`enum class SensorError { timeout, bad_crc };` and `std::expected<double, SensorError> read_temperature(int channel);`. Inside, `return 293.1;` stores a value and `return std::unexpected(SensorError::timeout);` an error. The caller writes `auto r = read_temperature(3); if (r) use(*r); else report(r.error());` — never `*r` unchecked, and not `r.value()` in a build without exceptions, where an error aborts. It is C++23, so g++ 13 needs `-std=c++23`.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| bug vs error | program wrong vs world misbehaving | `assert` for bugs (gone under `NDEBUG`); real handling for errors |
| return code | `int` or enum status | cheap and visible; `[[nodiscard]]` stops it being ignored |
| exception | `throw` unwinds to a matching `catch` | catch by `const&`; uncaught or escaping `noexcept` calls `std::terminate` |
| zero-cost model | tables beside the code | happy path free; a throw measured about $1.2\ \mu\mathrm{s}$ and allocated twice |
| throw timing | grows with frames and destructors | first and worst throws far above the median; no useful bound |
| `std::error_code` | number plus category | `if (ec)` means error; used by `<filesystem>` and `from_chars` |
| `std::expected<T, E>` | a value or an error | C++23, `-std=c++23` on g++ 13; `and_then` chains steps |
| `-fno-exceptions` | exceptions switched off | `throw` does not compile; library throws end in `abort()` |
| why flight code disables them | determinism, heap, footprint, analysis | JSF AV C++ forbids them; error returns are bounded and auditable |

That closes the standard-library module. The next module, **[[Templates and Compile-Time Programming|templates-next]]**, opens the machinery under everything used here: the templates behind every algorithm, the concepts guarding the range algorithms, and compile-time checks that catch a mistake before the program runs.

::: context unwind-tables What happens between throw and catch
When a throw happens, g++'s runtime first allocates the exception object. Then the unwinder works in two passes over the stack. The first pass only searches: frame by frame, it reads each function's table entry to find a `catch` that matches. The second pass goes back and does the work, entering each frame's cleanup code to run destructors, until it lands in the handler. If the first pass finds no handler, `std::terminate` is called.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">time →</text>
  <rect x="10" y="30" width="60" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">allocate</text>
  <rect x="70" y="30" width="110" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">1: search tables</text>
  <rect x="180" y="30" width="120" height="34" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="240" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">2: unwind, run dtors</text>
  <rect x="300" y="30" width="50" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="325" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">catch</text>
  <text x="40" y="84" font-size="11" text-anchor="middle" fill="#b4232c">heap</text>
  <text x="125" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">per frame</text>
  <text x="240" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">per frame, per object</text>
  <text x="10" y="116" font-size="12" fill="#1f2a44">both passes grow with call depth,</text>
  <text x="10" y="134" font-size="12" fill="#1f2a44">which is only known at run time</text>
</svg>
```
:::

::: context error-category Why a number needs a category
The number 5 might mean "I/O error" to the operating system, "checksum mismatch" to your radio driver and "gimbal limit" to your actuator library. An `error_code` therefore stores the number together with a pointer to a category object, and the pair is what has meaning. Two codes are equal only if both the number and the category match. The category also supplies the text for `message()`. Projects can define their own categories for their own tables of faults.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">std::error_code</text>
  <rect x="10" y="28" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">value 22</text>
  <rect x="90" y="28" width="100" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">category ptr</text>
  <line x1="190" y1="45" x2="234" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="240,45 230,40 230,50" fill="#1f2a44"/>
  <rect x="240" y="28" width="110" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">generic</text>
  <text x="295" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">name(), message(22)</text>
  <text x="295" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">"Invalid argument"</text>
</svg>
```
:::

::: context errno-values Where 22 and 34 come from
Unix systems report failures through numbered error codes, historically in a variable called `errno`. On Linux, 22 is `EINVAL`, "invalid argument", and 34 is `ERANGE`, "result out of range". `std::errc` gives these conditions portable names, `std::errc::invalid_argument` and `std::errc::result_out_of_range`, and the generic category turns them into the operating system's messages. The numbers can differ on other operating systems, which is why code should compare against the names, not the numbers.
:::

::: context expected-layout Sixteen bytes, no heap
A `std::expected<double, int>` holds its value and its error in the same place, one at a time, like a `std::variant` of two types. Next to that space is a flag saying which one is there. The `double` needs 8 bytes and 8-byte alignment; the flag needs one byte, and padding rounds the whole object up to 16.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="200" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">double value OR int error</text>
  <rect x="210" y="30" width="30" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="30" width="110" height="34" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="295" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="10" y="84" font-size="11" fill="#6c7a93">0</text>
  <text x="210" y="84" font-size="11" fill="#6c7a93">8</text>
  <text x="340" y="84" font-size="11" fill="#6c7a93">16</text>
  <text x="225" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">has-value flag</text>
</svg>
```
:::

::: context exit-134 Reading an exit status of 134
When a process on Linux is killed by a signal, the shell reports its exit status as 128 plus the signal's number. `abort()` raises `SIGABRT`, which is signal 6, so the shell shows $128 + 6 = 134$. Seeing 134 in a test log is a quick way to know the program called `abort()` — through `std::terminate`, a failed `assert`, or a library call that could not throw.
:::

::: context jsf-av The fighter-jet rules
The Joint Strike Fighter Air Vehicle C++ Coding Standards were published by Lockheed Martin in 2005 for the F-35's software. Its rule 208 forbids `throw`, `try` and `catch`; the stated reason was that tool support for exceptions was not yet adequate for safety-critical code. Its rules are still widely read, and Bjarne Stroustrup, who created C++, hosts a copy on his website.
:::

::: context power-of-ten Ten rules from JPL
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten", ten short rules for safety-critical C code. One of them says the return value of every non-void function must be checked by the caller, or explicitly cast to `void` to show it is ignored on purpose. Another asks for at least two assertions per function on average. Both are the error-return style of this lesson, written as a rule a checker can enforce. JPL's longer institutional C coding standard builds on them.
:::

::: context templates-next What comes next
Every algorithm in this module was a function template, every container a class template, and the range algorithms guarded their doors with concepts. The next module writes these things yourself: function and class templates, `Matrix<double, 3, 3>` with sizes known to the compiler, variadic templates, type traits, concepts and `requires`, and `constexpr` computation. Its promise is the same one this lesson ends on: a mistake caught before the program runs is cheaper than any error handling.
:::
