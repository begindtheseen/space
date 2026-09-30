---
id: l07-const-constexpr-consteval-auto
title: const, constexpr, consteval and auto
minutes: 22
covers:
  - const, constexpr, consteval, auto
---

Think about the speedometer in a car. The numbers around the dial — 0, 20, 40, 60 — were painted on at the factory. Nobody works them out while you drive. The needle is different: it moves every second, because it shows something only the road can tell you.

Now think about a museum. A painting behind glass can be looked at but not touched. The glass does not make the painting permanent — the curator, who has a key, can still take it down and clean it. The glass only stops *you*.

C++ has a keyword for each of these ideas, and Python has neither. In Python, `KMU_EARTH = 3.986e14` in capitals is a polite request not to change it; any line anywhere can still assign to it. And in Python nothing is worked out "at the factory", because nothing happens before the program runs — a module executes top to bottom the first time it is imported.

- **`const`** is the glass: *this name may not be used to change the object*. It says nothing about when the value was worked out.
- **`constexpr`** is the paint on the dial: *this can be worked out before the program starts*, while the compiler is building it.
- **`consteval`** is the strict version: *it must be worked out before the program starts*, with no other option.
- **`auto`** is a different kind of helper: *compiler, you fill in the type for me*.

For flight software the payoff is concrete. Work moved to compile time cannot fail in flight. It cannot eat time inside a control cycle. It cannot depend on the order things happened to start up in. A buffer whose size is worked out by the compiler gets checked against the RAM budget by the compiler, not by a test that someone might forget to run. And `const` on everything you do not mean to change is the cheapest review tool there is: it turns a whole family of mistakes into compile errors.

## `const`: a promise not to modify

A **`const`** variable — say "const", short for constant — cannot be changed through its name. Try, and the compiler stops you:

```cpp error
int main() {
    const double kDt = 0.01;
    kDt = 0.02;
}
```

g++ 13.3.0 says:

```text
e1.cpp:3:9: error: assignment of read-only variable 'kDt'
    3 |     kDt = 0.02;
      |     ~~~~^~~~~~
```

clang++ 18.1.3 says the same thing and names the type:

```text
e1.cpp:3:9: error: cannot assign to variable 'kDt' with const-qualified type 'const double'
e1.cpp:2:18: note: variable 'kDt' declared const here
```

(The `k` in `kDt` is a common naming habit for constants. The compiler does not care about it; the reader does.)

Here is the part that surprises people. A `const` value does not have to be known early. `const double dt = read_config();` is a perfectly good `const`. The value arrives while the program runs, from a file, and it is fixed from then on. `const` is about *changing*, not about *when*.

Three places `const` earns its keep every day:

- **Parameters.** `double energy(const State& s)` — read the `&` as "reference to", so this is "a reference to a const State". It says the function reads `s` and will not change it. That is half the function's contract, and the compiler checks it.
- **Locals.** Marking a local `const` tells the next reader "this value stays put for the rest of the block". It also catches the day someone adds an assignment by accident.
- **Member functions.** `double speed() const;` promises that calling `speed()` will not change the object. Lesson 10 covers this.

### Two things can be const in a pointer

A **pointer** is a variable that holds the address of another object; the next module is all about them. Read the `*` in a declaration as "pointer to". A pointer has two things that could be locked: the object it points at, and the pointer itself. The rule is to **[[read the declaration right to left|right-to-left]]**:

| Declaration | Read right to left | What you can change |
| --- | --- | --- |
| `const int* p` | p is a pointer to an int that is const | `p` yes, `*p` no |
| `int* const p` | p is a const pointer to an int | `*p` yes, `p` no |
| `const int* const p` | p is a const pointer to a const int | neither |

(`*p` is read "star p" and means "the thing `p` points at".) Here is the compiler holding you to the first two rows:

```cpp error
int main() {
    int a = 1, b = 2;
    const int* p = &a;  p = &b;   // fine: p itself may move
    *p = 5;                       // error: *p is const
    int* const q = &a;  *q = 5;   // fine: the int may change
    q = &b;                       // error: q is const
}
```

```text
ptr.cpp:4:8: error: assignment of read-only location '* p'
ptr.cpp:6:7: error: assignment of read-only variable 'q'
```

The next module drills this. For now, notice that `const State&` is the reference version of the first row, and it is the parameter type you will write most often.

::: warning const is glass, not stone
`const` is a promise about *this name*, not about the object. If some other name, one without `const`, refers to the same object, the object can change underneath your **[[const reference|read-only-view]]**. That is not a bug in `const`. It is the reason `const` is not the same as "can never change", and why a `const&` parameter can still see its object change if the function also modifies that object through another path.
:::

::: note Why a const by-value parameter does not matter to the caller
When a function takes `int hz` by value, it gets its own copy of the caller's number. Whether the function promises not to change *its copy* is invisible from outside: the caller's variable is safe either way. So C++ ignores top-level `const` on a by-value parameter when it matches a declaration to a definition. `void set_rate(int hz);` in a header and `void set_rate(const int hz) { ... }` in the `.cpp` are the same function, and they link without complaint. `const` on a reference or pointer parameter is different: there the function could reach the caller's object, so the promise means something.
:::

## `constexpr`: worked out before the program runs

**[[Compile time|compile-time]]** is while the compiler is building your program. **Run time** is while the finished program is running, on the ground or on the vehicle. A **`constexpr`** variable — say "const-expr" — is a constant the compiler works out at compile time. It is `const` too; that comes free. On top of that, its starting value must be a **constant expression**: something the compiler can calculate by itself, with no input from the running program.

The difference shows up exactly where C++ *demands* a value at compile time. One such place is the size of a `std::array` — read `std::` as "standard", so `std::array` is "standard array", a fixed-size array from the standard library. Its size goes inside the angle brackets and becomes part of the array's type, a **[[template argument|template-argument]]**, so the compiler must know it. Try to size one with a `const` whose value comes from a function call:

```cpp error
#include <array>
int read_config() { return 8; }

int main() {
    const int n = read_config();
    std::array<double, n> buf{};
    (void)buf;
}
```

```text
e4.cpp:6:25: error: the value of 'n' is not usable in a constant expression
    6 |     std::array<double, n> buf{};
      |                         ^
e4.cpp:5:15: note: 'n' was not initialized with a constant expression
```

`n` is `const`, so it will never change. But nobody knows its value until `read_config()` runs, and that is too late for the compiler.

Now write `constexpr` instead. The error moves up to the declaration, which is where the mistake really is:

```text
e5.cpp:4:34: error: call to non-'constexpr' function 'int read_config()'
    4 |     constexpr int n = read_config();
      |                       ~~~~~~~~~~~^~
```

That is the practical reason to reach for `constexpr` first when you mean "a constant": it complains once, at the definition, instead of at every place the value is used.

::: key
`const` means this name cannot be used to modify the object; the value may still be computed at run time. `constexpr` means it can be evaluated at compile time and, for variables, that it is a compile-time constant usable as an array bound or template argument.
:::

### `constexpr` functions

A `constexpr` function is a function the compiler is *allowed* to run at compile time. Call it with constant arguments somewhere a constant is needed, and the compiler runs it and keeps only the answer. Call it with a value that only exists at run time, and it behaves like any ordinary function.

```cpp
#include <cstdio>

constexpr double deg_to_rad(double deg) { return deg * 3.14159265358979323846 / 180.0; }

constexpr double kMaxTiltRad = deg_to_rad(15.0);   // computed by the compiler

int main() {
    double measured_deg = 15.0;                    // pretend this came from a sensor
    std::printf("kMaxTiltRad     = %.6f\n", kMaxTiltRad);
    std::printf("runtime call    = %.6f\n", deg_to_rad(measured_deg));
    return 0;
}
```

```text
kMaxTiltRad     = 0.261799
runtime call    = 0.261799
```

One function, two modes. Check the number: $15 \times \pi / 180 = \pi / 12 \approx 0.2618$ radians, and 15 degrees is a small tilt, so a small fraction of a radian makes sense.

In C++20 a `constexpr` function may use loops, local variables, `if`, and calls to other `constexpr` functions — nearly everything. What it may not do at compile time is anything that needs the running program: call an ordinary function, or keep memory from `new` after the calculation ends.

::: example Sizing a buffer at compile time, against a budget
Lesson 04 worked out by hand that five seconds of IMU history at 1 kHz costs 140,000 bytes. An **IMU** (inertial measurement unit) is the sensor that measures acceleration and rotation; here it is sampled 1000 times a second. Let the compiler do the sum, and let it check the RAM budget too:

```cpp
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdio>

struct ImuSample {
    std::uint32_t t_ms;
    float ax, ay, az, gx, gy, gz;
};

constexpr int    kImuRateHz      = 1000;
constexpr double kHistorySeconds = 5.0;
constexpr std::size_t kHistorySamples =
    static_cast<std::size_t>(kImuRateHz * kHistorySeconds);

int main() {
    std::array<ImuSample, kHistorySamples> history{};
    static_assert(kHistorySamples == 5000);
    static_assert(sizeof(history) <= 200 * 1024, "IMU history exceeds its RAM budget");

    std::printf("kHistorySamples = %zu\n", kHistorySamples);
    std::printf("sizeof(history) = %zu bytes (%.1f KiB)\n",
                sizeof(history), static_cast<double>(sizeof(history)) / 1024.0);
    return 0;
}
```

```text
kHistorySamples = 5000
sizeof(history) = 140000 bytes (136.7 KiB)
```

Walk through it. Step one: $1000\,\mathrm{Hz} \times 5.0\,\mathrm{s} = 5000$ samples, worked out by the compiler. Step two: each sample is one 4-byte integer plus six 4-byte floats, $7 \times 4 = 28$ bytes. Step three: $5000 \times 28 = 140{,}000$ bytes, and dividing by 1024 gives about $136.7$ **[[KiB|kibibyte]]**. That is under the budget of $200 \times 1024 = 204{,}800$ bytes, so the build passes.

A **`static_assert`** is a yes-or-no check the compiler makes while building. If the answer is no, the build stops with your message. Shrink the budget to `100 * 1024` and g++ refuses:

```text
imu_bad.cpp:19:35: error: static assertion failed: IMU history exceeds its RAM budget
imu_bad.cpp:19:35: note: the comparison reduces to '(140000 <= 102400)'
```

Three things happened here that Python cannot do. The array's size is part of its type, so `history` is one block of 140,000 bytes with no separate allocation. The size was *derived* from the rate and the duration, so changing `kImuRateHz` to 2000 resizes the buffer and re-checks the budget in the same edit. And going over budget stops the build instead of running out of RAM on the vehicle. Lesson 13 returns to `static_assert`, and lesson 09 to `std::array`.
:::

## `consteval`: it must be compile time

C++20 added **`consteval`** — say "const-eval". It marks an **[[immediate function|immediate-function]]**: every call to it must be worked out at compile time. There is no fall-back to run time. A call with a run-time value is an error, not a slower path.

```cpp error
consteval int checked_bits(int n) { return n * 8; }

int main(int argc, char**) {
    int a = checked_bits(argc);     // argc is not known at compile time
    return a;
}
```

`argc` is the number of words typed on the command line when the program starts, so nobody can know it at compile time. g++ says:

```text
e3.cpp:4:25: error: 'argc' is not a constant expression
    4 |     int a = checked_bits(argc);     // argc is not known at compile time
      |             ~~~~~~~~~~~~^~~~~~
```

clang++ 18.1.3 is more explicit:

```text
e3.cpp:4:13: error: call to consteval function 'checked_bits' is not a constant expression
e3.cpp:4:26: note: function parameter 'argc' with unknown value cannot be used in a constant expression
```

What is it for? Checking constants at the moment you write them. The body runs inside the compiler, so if it reaches a `throw` — C++'s way of raising an error, like Python's `raise` — the compiler cannot finish the calculation, and the build fails. A range check becomes a build failure.

::: example A validated telemetry identifier
Spacecraft telemetry is sent in **[[CCSDS|ccsds-header]]** packets, and each packet carries an **application process identifier** (APID) that says which part of the vehicle sent it. The APID field is 11 bits wide, so it holds $0$ to $2^{11} - 1 = 2047$. Writing an APID that does not fit should be impossible.

```cpp laptop
#include <cstdint>
#include <cstdio>

// An immediate function: every call must be evaluated at compile time.
consteval std::uint16_t apid(unsigned raw) {
    if (raw >= 2048) throw "APID must fit in 11 bits";
    return static_cast<std::uint16_t>(raw);
}

constexpr std::uint16_t kGncApid  = apid(0x64);
constexpr std::uint16_t kPropApid = apid(0x65);

int main() {
    std::printf("GNC APID  = %u\n", kGncApid);
    std::printf("PROP APID = %u\n", kPropApid);
    return 0;
}
```

```text
GNC APID  = 100
PROP APID = 101
```

Check the numbers: `0x64` is hexadecimal, $6 \times 16 + 4 = 100$, and `0x65` is $101$. Both are well under 2048.

Now change the second one to `apid(5000)`. Is 5000 too big? $2^{12} = 4096$ and $2^{13} = 8192$, so 5000 needs 13 bits — two too many. g++ 13.3.0:

```text
bad_apid.cpp:11:41:   in 'constexpr' expansion of 'apid(5000)'
bad_apid.cpp:6:22: error: expression '<throw-expression>' is not a constant expression
    6 |     if (raw >= 2048) throw "APID must fit in 11 bits";
      |                      ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

clang++ 18.1.3 walks you from the call to the cause:

```text
bad_apid.cpp:11:37: error: call to consteval function 'apid' is not a constant expression
bad_apid.cpp:6:22: note: subexpression not valid in a constant expression
bad_apid.cpp:11:37: note: in call to 'apid(5000)'
```

Nothing is ever thrown while the program runs, because this function never runs at run time at all. Reaching the `throw` inside the compiler means "this is not a constant expression", and the compiler reports it with your message in view. The check costs nothing in flight, and the bad APID cannot reach the vehicle.
:::

## `auto`: let the compiler fill in the type

Picture handing a shoe to a shop assistant and asking them to write the size on the box. You did not say the size; they read it off the shoe. Once it is written, it is written.

**`auto`** works like that. It tells the compiler to **deduce** — work out — a variable's type from the value you start it with. This is *not* Python-style dynamic typing. The type is fixed at compile time, exactly as if you had typed it out yourself. The keyword itself is **[[older than C++|auto-history]]**; this meaning of it dates from C++11.

Three rules matter:

- **Plain `auto` drops references and top-level `const`.** `auto x = v[0];` makes a copy, even though `v[0]` hands back a reference to the element.
- **`auto&` keeps it a reference.** `const auto&` makes it a read-only reference.
- **`auto*` for pointers**, when you want the reader to see it is a pointer.

"Top-level" `const` means a `const` on the variable itself, as in `const int`. A `const` further in, as in `const int*`, is part of what is pointed at, and it stays.

Here it is on a vector of orbital states:

```cpp
#include <cstdio>
#include <type_traits>
#include <vector>

struct State { double r_m, v_mps; };

int main() {
    std::vector<State> traj{{6771000.0, 7670.0}, {6771767.0, 7669.13}};

    auto  copy  = traj[0];       // auto drops the reference: this is a copy
    auto& alias = traj[0];       // an alias for the element in the vector
    const auto& ro = traj[0];    // read-only alias

    copy.v_mps = 0.0;
    std::printf("after copy.v = 0   traj[0].v = %.2f\n", traj[0].v_mps);
    alias.v_mps = 0.0;
    std::printf("after alias.v = 0  traj[0].v = %.2f\n", traj[0].v_mps);
    std::printf("ro.v is now        %.2f\n", ro.v_mps);

    std::printf("decltype(copy) is State:  %d\n", std::is_same_v<decltype(copy), State>);
    std::printf("decltype(alias) is State&: %d\n", std::is_same_v<decltype(alias), State&>);
    auto x = 1 / 3;
    std::printf("auto x = 1 / 3 gives %d, is int: %d\n", x, std::is_same_v<decltype(x), int>);
    return 0;
}
```

```text
after copy.v = 0   traj[0].v = 7670.00
after alias.v = 0  traj[0].v = 0.00
ro.v is now        0.00
decltype(copy) is State:  1
decltype(alias) is State&: 1
auto x = 1 / 3 gives 0, is int: 1
```

(`decltype(copy)` — say "decl-type" — asks the compiler for the type of `copy`, and `std::is_same_v` prints 1 when two types are identical.)

Follow it line by line. Setting `copy.v_mps` to zero left the vector alone: it still says 7670. Setting `alias.v_mps` to zero changed the vector. And `ro`, the read-only alias, *sees* that change, because it is a view of the same element — the museum glass again. This is lesson 06's value-versus-reference split, now hidden behind one keyword. That is exactly why `auto` needs care: plain `auto` always means *a copy*.

When to use it:

- For **[[iterators|iterator]]** and other long or unspellable types: `auto it = samples.begin();` instead of `std::vector<ImuSample>::const_iterator`.
- Anywhere repeating the type adds nothing: `auto s = make_state();`.
- In the range-based `for` loop, where `const auto&` avoids copying every element (lesson 09).

When not to:

- When the type *is* the information. `auto n = v.size();` hides that `n` is unsigned, which lesson 05 showed is exactly the thing you want to see.
- When it hides a conversion you care about. `auto x = 1 / 3;` is an `int` holding 0, as the output shows, because dividing two whole numbers gives a whole number.
- In a flight-code interface, where a reviewer reading the header must see the type.

::: warning auto means a copy
Plain `auto` on something that returns a reference quietly makes a copy. For a large struct that copy can be slow. Worse, you may then change the copy and think you changed the original. If you meant to refer to the object, write `auto&` or `const auto&`. The rule of thumb: `auto` for values, `const auto&` for things you only read, `auto&` for things you mean to change.
:::

## Check yourself

::: check
Why does `const int n = 8;` work as the size in `std::array<double, n>`, but `const int n = read_config();` does not, when both are `const int`?
:::

::: answer
`const` only says the name cannot be used to change the object. It says nothing about when the value is known.

In the first case the starting value, `8`, is a constant expression. The compiler knows it, and C++ lets a `const` integer set from a constant expression be used where a constant is required. So it compiles.

In the second case the starting value is a function call the compiler cannot run. `n` is const, but it is not a constant expression, and the size of a `std::array` is a template argument, which must be one. g++ says "the value of 'n' is not usable in a constant expression", with a note that it "was not initialized with a constant expression".

Writing `constexpr` instead of `const` moves the error to the declaration. That is better: the mistake is reported once, where it is, rather than at every use.
:::

::: check
When would you choose `consteval` over `constexpr` for a function, given that `constexpr` already allows compile-time evaluation?
:::

::: answer
When a run-time call would be a mistake, not merely slower.

A `constexpr` function quietly falls back to ordinary run-time evaluation if its arguments are not constants. So a checking function written `constexpr` can be called with a run-time value. Then the `throw` that was meant to stop the build becomes an exception during flight instead.

`consteval` removes the fall-back. Every call must be a constant expression, so the compiler rejects the run-time call outright. Use it for functions whose whole job is to compute or check something before the program exists: validating a literal, building a lookup table, deriving an identifier.
:::

::: check
`auto gains = controller.gains();` where `gains()` returns `const Gains&`, and `Gains` holds three `double`s. What is the type of `gains`, what happens when you change it, and what should you have written?
:::

::: answer
The type is `Gains`, not `const Gains&`. Plain `auto` drops both the reference and the top-level `const`, so `gains` is a separate copy of $3 \times 8 = 24$ bytes.

Changing it changes the copy and leaves the controller untouched — with no warning, because changing your own non-const local is perfectly legal.

If you only wanted to read the gains, write `const auto& gains = controller.gains();`. That refers to the controller's own object, with no copy. If you really wanted your own copy to change, `auto` is right, and writing `Gains gains = controller.gains();` would make that choice obvious to the next reader.
:::

::: check
A colleague marks every parameter in a header `const`, including `void set_rate(const int hz)`. Which of those `const`s change the interface, and which are noise?
:::

::: answer
`const` on a parameter taken by value, like `const int hz`, is a promise the function makes to itself. The argument is a copy, so the caller cannot tell the difference. C++ even ignores that top-level `const` when matching a declaration to a definition. In a header it is noise. Some teams do write it in the definition, as a local habit.

`const` on a reference or pointer parameter, like `const State&` or `const ImuSample*`, *is* part of the interface. It tells the caller that the object they pass in will not be changed, and the compiler enforces it.

So: put `const` in a header where it limits what the function may do to the caller's objects, and leave it out where it only describes the function's own copy.
:::

::: check
`constexpr double kMaxTiltRad = deg_to_rad(15.0);` compiled, and so did a call to `deg_to_rad` with a sensor reading. What did the compiler actually produce in each case, and what would change if `deg_to_rad` were `consteval`?
:::

::: answer
For the `constexpr` variable, the compiler ran `deg_to_rad(15.0)` while compiling and stored the answer, $0.261799\ldots$, in the program as a constant. No call is made and no arithmetic happens at run time.

For the call with a sensor reading, the compiler produced an ordinary function call — or copied the function's body in place — and the multiply and divide happen while the program runs.

If `deg_to_rad` were `consteval`, the first line would still work and the second would be a compile error, because an immediate function has no run-time form at all. That is the trade: `constexpr` gives you one function usable in both worlds; `consteval` guarantees nothing is ever paid at run time.
:::

## Summary

| Keyword | Says | Enforced how |
| --- | --- | --- |
| `const` variable | cannot be modified through this name | compile error on assignment |
| `const T&` parameter | the function will not modify the caller's object | compile error inside the function |
| `const int*` / `int* const` | the int is const / the pointer is const | read the declaration right to left |
| `constexpr` variable | a compile-time constant; also `const` | its starting value must be a constant expression |
| `constexpr` function | may be run at compile time; otherwise ordinary | falls back to run time without a word |
| `consteval` function | must be run at compile time | a run-time call is a compile error |
| `static_assert` | a condition checked during compilation | the build fails with your message |
| `auto` | deduce the type from the starting value | drops references and top-level `const`: always a copy |
| `auto&` / `const auto&` | deduce, but keep it a reference | no copy |

Lesson 08 turns to functions: how C++ decides which of several same-named functions a call means, what default arguments do and do not do, and why the two are really one mechanism.

::: context right-to-left Reading a pointer declaration backwards
Start at the name and walk left, saying each piece aloud. The `*` is "pointer to", and each `const` locks whatever sits immediately to its left — or, if nothing is to its left, whatever is to its right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="16" font-family="monospace" fill="#1f2a44">
    <text x="30" y="50">const</text>
    <text x="100" y="50">int</text>
    <text x="146" y="50">*</text>
    <text x="172" y="50">const</text>
    <text x="242" y="50">p</text>
  </g>
  <line x1="300" y1="70" x2="36" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="30,70 40,65 40,75" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="247" y="92">p is</text>
    <text x="196" y="108">a const</text>
    <text x="150" y="92">pointer to</text>
    <text x="110" y="108">an int</text>
    <text x="52" y="92">that is const</text>
  </g>
  <text x="300" y="30" font-size="11" fill="#6c7a93" text-anchor="end">read this way</text>
</svg>
```

So `const int* const p` reads "p is a const pointer to an int that is const": neither the pointer nor the int can be changed through `p`.
:::

::: context read-only-view Two names, one object
A `const` reference is a read-only window onto an object that someone else may own. Here `ro` is `const`, but `alias` is not, and both are names for the same element of the vector.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="200" y="45" width="140" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">traj[0]</text>
  <text x="270" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">v_mps = 7670</text>
  <rect x="20" y="20" width="110" height="30" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">auto&amp; alias</text>
  <rect x="20" y="90" width="110" height="30" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="75" y="110" font-size="12" text-anchor="middle" fill="#b4232c">const auto&amp; ro</text>
  <line x1="130" y1="35" x2="196" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="200,60 189,61 193,52" fill="#1f2a44"/>
  <line x1="130" y1="105" x2="196" y2="82" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <polygon points="200,80 193,88 189,79" fill="#b4232c"/>
  <text x="165" y="28" font-size="11" fill="#1f2a44" text-anchor="middle">can write</text>
  <text x="165" y="128" font-size="11" fill="#b4232c" text-anchor="middle">can only read</text>
</svg>
```

A write through `alias` shows up when you read through `ro`. The `const` stopped `ro` from changing the element; it never stopped anyone else.
:::

::: context compile-time Two different moments
Every C++ program lives through two separate stretches of time. **Compile time** happens once, on a developer's machine or a build server, while g++ turns source into a program. **Run time** happens later, every time the program runs — perhaps years later, on a flight computer.

A `constexpr` value is worked out in the first stretch, and only the answer is stored in the program. Python has only the second stretch. It does turn your file into bytecode first, but a module's top-level code, "constants" included, still runs every time the program starts. That is why Python has no word for `constexpr` — there is nowhere for the work to go.
:::

::: context template-argument Values baked into a type
In `std::array<double, 5000>`, the things in angle brackets are **template arguments**. The first is a type, the second is a number, and together they make a brand-new type: "array of 5000 doubles". `std::array<double, 4999>` is a different type altogether.

Because a type must be settled before the program can be built, any number used this way must be a compile-time constant. That is exactly where `const int n = read_config();` fails and `constexpr int n = 8;` works. Templates get a module of their own later in the track.
:::

::: context kibibyte KiB is not quite kB
A **kilobyte** (kB) is 1000 bytes, following the metric prefix. A **kibibyte** (KiB) is $2^{10} = 1024$ bytes. The two names were separated in 1998 by the International Electrotechnical Commission, because people had been using "kilobyte" for both.

Memory chips come in powers of two, so RAM budgets are usually written in KiB. $140{,}000$ bytes is $140.0\,\mathrm{kB}$ but $136.7\,\mathrm{KiB}$. The gap grows with size: a mebibyte (MiB) is about $4.9\%$ bigger than a megabyte.
:::

::: context immediate-function Why "immediate"
The C++ standard calls a `consteval` function an **immediate function** because each call must be turned into its answer immediately, right where it appears in the source, during compilation. It never becomes a function the running program can call.

One side effect: you cannot take the address of a `consteval` function and store it to call later, because there is no run-time function there to point at. In the finished program, `apid(0x64)` has left nothing behind but the number 100.
:::

::: context ccsds-header Where the 11 bits come from
CCSDS, the Consultative Committee for Space Data Systems, is a group of space agencies that agree on how spacecraft data is packaged. Its **Space Packet** starts with a 6-byte primary header, and bits 5 to 15 of it are the APID.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="30" height="36" fill="#ffffff"/>
    <rect x="40" y="30" width="10" height="36" fill="#ffffff"/>
    <rect x="50" y="30" width="10" height="36" fill="#ffffff"/>
    <rect x="60" y="30" width="110" height="36" fill="#8fb8f0"/>
    <rect x="170" y="30" width="20" height="36" fill="#ffffff"/>
    <rect x="190" y="30" width="140" height="36" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="25" y="52">ver</text>
    <text x="115" y="52">APID</text>
    <text x="260" y="52">sequence count</text>
    <text x="25" y="82">3</text>
    <text x="45" y="82">1</text>
    <text x="55" y="96">1</text>
    <text x="115" y="82">11 bits</text>
    <text x="180" y="82">2</text>
    <text x="260" y="82">14 bits</text>
  </g>
  <text x="170" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">first 32 bits of the header (then 16 bits of length)</text>
</svg>
```

The small fields are the version, the packet type, a flag and the sequence flags. Eleven bits give 2048 identifiers, 0 to 2047.
:::

::: context auto-history An old word with a new job
`auto` is older than C++. In C, and in C++ before 2011, it meant "this local variable has automatic storage" — it lives on the stack and dies at the end of its block. Local variables are automatic anyway, so almost nobody wrote it.

C++11 took the nearly unused keyword and gave it its new meaning, "deduce the type", rather than inventing a new word that might clash with names in existing code. Lesson 11 comes back to automatic storage under its own name.
:::

::: context iterator A bookmark for a container
An **iterator** is an object that marks a position inside a container, like a bookmark in a book. `samples.begin()` marks the first element, `samples.end()` marks one past the last, and `++it` moves the bookmark along.

Their full type names are long — `std::vector<ImuSample>::const_iterator` — and for some containers they are hard to write at all. That is the case `auto` was made for: the type is certain, and spelling it out teaches the reader nothing.
:::
