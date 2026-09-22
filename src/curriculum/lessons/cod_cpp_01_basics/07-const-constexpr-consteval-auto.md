---
id: l07-const-constexpr-consteval-auto
title: const, constexpr, consteval and auto
minutes: 16
covers:
  - const, constexpr, consteval, auto
---

Python has no way to say a value must not change. `KMU_EARTH = 3.986e14` is a naming convention and nothing more; any line anywhere can assign to it. Python also has no way to say a value is known before the program runs, because nothing is known before the program runs — the module executes top to bottom the first time it is imported.

C++ can say both, and they are different statements. `const` says *this name may not be used to modify the object*, which the compiler enforces but which says nothing about when the value is computed. `constexpr` says *this can be computed before the program starts*, which turns a computation into a constant in the binary and lets it be used where the language requires a compile-time value: an array bound, a template argument, a `static_assert`. `consteval` says *it must be*, with no run-time fallback.

For flight software the payoff is concrete. Work moved to compile time cannot fail in flight, cannot take time in a control cycle, and cannot depend on the order in which things were initialised. A buffer whose size is a `constexpr` expression is checked against your RAM budget by the compiler rather than by a test. And `const` on every parameter and member you do not intend to modify is the cheapest review tool there is: it converts a class of mistakes into compile errors.

## `const`: a promise not to modify

`const` on a variable means the object cannot be modified through that name. The compiler enforces it:

```cpp
const double kDt = 0.01;
kDt = 0.02;
```

g++ 13.3.0:

```text
e1.cpp:3:9: error: assignment of read-only variable 'kDt'
    3 |     kDt = 0.02;
      |     ~~~~^~~~~~
```

clang++ 18.1.3 names the type as well:

```text
e1.cpp:3:9: error: cannot assign to variable 'kDt' with const-qualified type 'const double'
e1.cpp:2:18: note: variable 'kDt' declared const here
```

The value need not be known early. `const double dt = read_config();` is a perfectly good `const`: the value arrives at run time and is fixed from then on.

Three places `const` earns its keep every day:

- **Parameters.** `double energy(const State& s)` says the function reads `s` and will not change it. That is half the function's contract, checked by the compiler.
- **Locals.** Making a local `const` where you do not intend to change it tells the next reader that the value is stable through the rest of the block — and catches the day someone adds an assignment.
- **Member functions.** `double speed() const;` promises not to modify the object. Lesson 10 covers this.

A pointer has two things that can be `const`, and the rule is to read the declaration right to left:

| Declaration | Meaning |
| --- | --- |
| `const int* p` | pointer to const int: cannot change `*p`, can change `p` |
| `int* const p` | const pointer to int: can change `*p`, cannot change `p` |
| `const int* const p` | neither |

The next module drills this. For now, note that `const State&` is the reference equivalent of the first row and is the parameter type you will write most often.

::: warning
`const` is a promise about *this name*, not about the object. If another, non-const, name refers to the same object, the object can change underneath your const reference. That is not a defect in `const`; it is the reason `const` is not the same as "immutable", and why a `const&` parameter bound to something a callee also modifies is a real hazard.
:::

## `constexpr`: computed before the program runs

A `constexpr` variable is a compile-time constant. It is `const` as well — that is implied — and additionally its initialiser must be a *constant expression*, something the compiler can evaluate itself.

The difference matters exactly where the language demands a compile-time value. Try to size an array with a `const` whose value comes from a function call:

```cpp
const int n = read_config();
std::array<double, n> buf{};
```

```text
e4.cpp:7:25: error: the value of 'n' is not usable in a constant expression
    7 |     std::array<double, n> buf{};
      |                         ^
e4.cpp:6:15: note: 'n' was not initialized with a constant expression
```

Change `const` to `constexpr` and the error moves earlier, to the declaration, which is where the mistake actually is:

```text
e5.cpp:4:34: error: call to non-'constexpr' function 'int read_config()'
    4 |     constexpr int n = read_config();
      |                       ~~~~~~~~~~~^~
```

That is the practical argument for reaching for `constexpr` first: it fails at the definition rather than at every use.

::: key
`const` means this name cannot be used to modify the object; the value may still be computed at run time. `constexpr` means it can be evaluated at compile time and, for variables, that it is a compile-time constant usable as an array bound or template argument.
:::

### `constexpr` functions

A `constexpr` function *may* be evaluated at compile time. Call it with constant arguments in a context that needs a constant, and the compiler runs it; call it with run-time arguments and it is an ordinary function.

```cpp
constexpr double deg_to_rad(double deg) { return deg * 3.14159265358979323846 / 180.0; }

constexpr double kMaxTiltRad = deg_to_rad(15.0);   // computed by the compiler
```

```cpp
double measured_deg = 15.0;                        // pretend this came from a sensor
std::printf("runtime call    = %.6f\n", deg_to_rad(measured_deg));
```

```text
kMaxTiltRad     = 0.261799
runtime call    = 0.261799
```

One function, two modes. In C++20 a `constexpr` function may contain loops, local variables, `if`, and calls to other `constexpr` functions — nearly everything except things that cannot exist at compile time, such as `new` that outlives the evaluation, or a call to an ordinary function.

::: example Sizing a buffer at compile time, against a budget
Lesson 04 computed by hand that five seconds of 1 kHz IMU history costs 140,000 bytes. Make the compiler do it, and make it check the budget:

```cpp
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

Three things happened that could not happen in Python. The array's size is part of its type, so `history` is one object of 140,000 bytes with no allocation and no pointer chasing. The size was *derived* from the rate and the duration, so changing `kImuRateHz` to 2000 changes the buffer and re-checks the budget in the same edit. And the budget check is a `static_assert`, so exceeding it stops the build rather than exhausting RAM on the vehicle. Lesson 13 comes back to `static_assert`; lesson 09 to `std::array`.
:::

## `consteval`: it must be compile time

C++20 added `consteval`, which declares an *immediate function*: every call must produce a constant expression. There is no run-time fallback, so a call with a run-time argument is an error rather than a slower path.

```cpp
consteval int checked_bits(int n) { return n * 8; }

int main(int argc, char**) {
    int a = checked_bits(argc);     // argc is not known at compile time
    return a;
}
```

```text
e3.cpp:4:25: error: 'argc' is not a constant expression
    4 |     int a = checked_bits(argc);
      |             ~~~~~~~~~~~~^~~~~~
```

clang++ 18.1.3 says it more explicitly:

```text
e3.cpp:4:13: error: call to consteval function 'checked_bits' is not a constant expression
e3.cpp:4:26: note: function parameter 'argc' with unknown value cannot be used in a constant expression
```

What it is for: validating constants at the point they are written. Because the function body runs at compile time, a `throw` inside it that is actually reached makes the program ill-formed — which turns a range check into a build failure.

::: example A validated telemetry identifier
The CCSDS application process identifier is eleven bits. Writing one that does not fit should not be possible.

```cpp
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

Now change one identifier to 5000, which needs thirteen bits. g++ 13.3.0:

```text
bad_apid.cpp:10:41:   in 'constexpr' expansion of 'apid(5000)'
bad_apid.cpp:6:22: error: expression '<throw-expression>' is not a constant expression
    6 |     if (raw >= 2048) throw "APID must fit in 11 bits";
      |                      ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

clang++ 18.1.3 walks you from the call to the cause:

```text
bad_apid.cpp:10:37: error: call to consteval function 'apid' is not a constant expression
bad_apid.cpp:6:22: note: subexpression not valid in a constant expression
bad_apid.cpp:10:37: note: in call to 'apid(5000)'
```

The `throw` never executes in the ordinary sense — nothing is thrown at run time, because there is no run time for this function. Reaching a `throw` during constant evaluation simply means the evaluation is not a constant expression, and the compiler reports it. The cost of the check is zero, and the defect cannot reach the vehicle.
:::

## `auto`

`auto` asks the compiler to deduce a variable's type from its initialiser. It is not dynamic typing — the type is fixed, at compile time, exactly as if you had written it out.

The deduction rules that matter:

- `auto` **drops references and top-level `const`**. `auto x = v[0];` copies, even though `v[0]` returns a reference.
- `auto&` keeps it a reference. `const auto&` makes it a read-only reference.
- `auto*` for pointers, when you want the pointer-ness visible.

```cpp
std::vector<State> traj{{6771000.0, 7670.0}, {6771767.0, 7669.13}};

auto  copy  = traj[0];       // auto drops the reference: this is a copy
auto& alias = traj[0];       // an alias for the element in the vector
const auto& ro = traj[0];    // read-only alias

copy.v_mps = 0.0;
// ... then alias.v_mps = 0.0;
```

```text
after copy.v = 0   traj[0].v = 7670.00
after alias.v = 0  traj[0].v = 0.00
ro.v is now        0.00
decltype(copy) is State:  1
decltype(alias) is State&: 1
deduced = 8, is int: 1
```

Writing to `copy` left the vector alone; writing to `alias` changed it. This is lesson 06's value-versus-reference distinction, now hidden behind one keyword, which is precisely why `auto` needs care: `auto` alone always means *a copy*.

When to use it:

- Iterators and other unspellable types: `auto it = samples.begin();` instead of `std::vector<ImuSample>::const_iterator`.
- Anywhere repeating the type adds nothing: `auto s = make_state();`.
- In range-based `for`, where `const auto&` avoids copying every element (lesson 09).

When not to:

- When the type is the information. `auto n = v.size();` hides that `n` is unsigned, which lesson 05 showed is exactly the thing you want visible.
- When it hides a conversion you care about: `auto x = 1 / 3;` is an `int` holding 0.
- In a flight-code interface, where a reviewer reading the header must be able to see the type.

::: warning
`auto` applied to an expression that returns a reference silently makes a copy, and for a container element or a large struct that copy may be expensive and, worse, may leave you modifying something the caller cannot see. If you meant to refer to the object, write `auto&` or `const auto&`. The rule of thumb: `auto` for values, `const auto&` for things you only read, `auto&` for things you mean to change.
:::

## Check yourself

::: check
Why does `const int n = 8;` work as `std::array<double, n>` but `const int n = read_config();` does not, when both are `const int`?
:::

::: answer
`const` says the name cannot be used to modify the object; it says nothing about when the value is known. For a `const` integer initialised with a *constant expression*, the compiler also knows the value, and the language permits such a variable to be used where a constant is required — so the first case compiles. In the second the initialiser is a function call the compiler cannot evaluate, so the variable is const but not a constant expression, and `std::array`'s size argument, being a template argument, must be one. g++ says "the value of 'n' is not usable in a constant expression" with a note that it "was not initialized with a constant expression". Writing `constexpr` instead of `const` moves the diagnosis to the declaration, which is better: the mistake is reported once, where it is, rather than at every use.
:::

::: check
When would you choose `consteval` over `constexpr` for a function, given that `constexpr` already allows compile-time evaluation?
:::

::: answer
When a run-time call would be a mistake rather than merely slower. A `constexpr` function quietly falls back to ordinary run-time evaluation if its arguments are not constants, so a validation function written `constexpr` can be called with a run-time value and check nothing — the `throw` that was meant to fail the build becomes an exception in flight. `consteval` removes the fallback: every call must be a constant expression, so the compiler rejects the run-time call outright. Use it for functions whose entire purpose is to compute or check something before the program exists: validating a literal, building a lookup table, deriving an identifier.
:::

::: check
`auto gains = controller.gains();` where `gains()` returns `const Gains&`, and `Gains` holds three `double`s. What is the type of `gains`, what happens when you modify it, and what should you have written?
:::

::: answer
The type is `Gains`, not `const Gains&`: `auto` deduction drops both the reference and the top-level `const`, so `gains` is an independent copy of 24 bytes. Modifying it changes the copy and leaves the controller untouched — with no warning, since assigning to your own non-const local is entirely legal. If you only wanted to read the gains, write `const auto& gains = controller.gains();`, which binds to the controller's object with no copy. If you wanted your own modifiable copy, `auto` is correct, and writing `Gains gains = controller.gains();` would have made that visible to the next reader.
:::

::: check
A colleague marks every parameter in a header `const`, including `void set_rate(const int hz)`. Which of those `const`s change the interface, and which are noise?
:::

::: answer
`const` on a parameter taken by value — like `const int hz` — is a promise the function makes to itself, not to the caller: the argument is a copy, so the caller cannot tell the difference, and the top-level `const` is even ignored when matching a declaration to a definition. It is noise in the header, though some teams put it in the definition as a local discipline. `const` on a reference or pointer parameter, `const State&` or `const ImuSample*`, is part of the interface: it tells the caller that the object it passes will not be modified, and the compiler enforces it. Put `const` in a header where it constrains what the function may do to the caller's objects, and leave it out where it only describes the function's own local.
:::

::: check
`constexpr double kMaxTiltRad = deg_to_rad(15.0);` compiled, and so did a call to `deg_to_rad` with a sensor reading. What did the compiler actually emit in each case, and what would change if `deg_to_rad` were `consteval`?
:::

::: answer
For the `constexpr` variable the compiler evaluated `deg_to_rad(15.0)` during compilation and put the resulting `double`, 0.261799…, into the binary as a constant; no call is emitted and no arithmetic happens at run time. For the call with a run-time argument it emitted an ordinary function call — or inlined the body — and the multiplication and division happen while the program runs. If `deg_to_rad` were `consteval` the first line would still work and the second would be a compile error, because an immediate function has no run-time form at all. That is the trade: `constexpr` gives you one function usable in both worlds, `consteval` gives you a guarantee that nothing is paid at run time.
:::

## Summary

| Keyword | Says | Enforced how |
| --- | --- | --- |
| `const` variable | cannot be modified through this name | compile error on assignment |
| `const T&` parameter | the callee will not modify the caller's object | compile error in the callee |
| `const int*` / `int* const` | pointee is const / pointer is const | read the declaration right to left |
| `constexpr` variable | a compile-time constant; implies `const` | initialiser must be a constant expression |
| `constexpr` function | may be evaluated at compile time; otherwise ordinary | falls back to run time silently |
| `consteval` function | must be evaluated at compile time | run-time call is a compile error |
| `static_assert` | a condition checked during compilation | build fails with your message |
| `auto` | deduce the type from the initialiser | drops references and top-level `const`: always a copy |
| `auto&` / `const auto&` | deduce, but keep it a reference | no copy |

Lesson 08 turns to functions: how C++ decides which overload a call means, what default arguments do and do not do, and why both are part of the same mechanism.
