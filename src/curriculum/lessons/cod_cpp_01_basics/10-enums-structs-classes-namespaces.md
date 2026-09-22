---
id: l10-enums-structs-classes-namespaces
title: enum class, struct and class, access and namespaces
minutes: 18
covers:
  - enum class; struct and class; access specifiers; namespaces
---

Python's organising tools are conventions. A leading underscore means "private" and nothing stops you touching it. An enumeration is a class of integers, or a set of module-level constants, or — since 3.4 — an `Enum` you have to opt into. Two modules with a `norm` function do not collide because module names are objects you import from.

C++ makes all three enforceable. `private` is checked by the compiler. `enum class` gives you a type whose values are exactly the ones you named and which does not silently become an integer. A namespace keeps two teams' `norm` functions apart at the level of the symbol, so the linker can tell them apart too.

For flight code these are not stylistic preferences. A mode enumeration that converts to `int` will eventually be compared against a raw number from a telemetry packet and match the wrong mode. A struct whose members anyone can write has no invariant a reviewer can rely on. And a program with hundreds of translation units needs its names organised, or lesson 03's multiple-definition error becomes a weekly event.

## `struct` and `class`

They are the same language feature. The only difference is the default access: members of a `struct` are `public` unless you say otherwise, members of a `class` are `private`.

The difference that matters is the convention, and it is worth taking seriously:

- **`struct`** for a plain aggregate of data with no invariant — every combination of member values is valid, so there is nothing to protect. `ImuSample`, `Vec3`, `TelemetryHeader`.
- **`class`** when the object must maintain something true about itself — a *class invariant* — so the data is private and the operations that preserve it are public.

```cpp
// A struct: a bag of data with no invariant to protect.
struct ImuSample {
    std::uint32_t t_ms;
    float ax, ay, az;
};

// A class: it has an invariant, so the data is private.
class RateLimiter {
public:
    explicit RateLimiter(double max_step) : max_step_(max_step) {}

    // Modifies the object, so not const.
    double apply(double cmd) {
        const double delta = cmd - last_;
        if (delta >  max_step_) last_ += max_step_;
        else if (delta < -max_step_) last_ -= max_step_;
        else last_ = cmd;
        return last_;
    }

    // Only reads, so const: callable through a const reference.
    double value() const { return last_; }

private:
    double max_step_;     // invariant: never modified after construction
    double last_{0.0};    // invariant: |last_ - previous last_| <= max_step_
};
```

```text
aggregate init: t=100 az=-9.81
apply(1.0) -> 0.100
apply(1.0) -> 0.200
apply(1.0) -> 0.300
apply(1.0) -> 0.400
value() = 0.400
```

Four calls, each moving the output by at most 0.1 towards the commanded 1.0. That "at most 0.1" is the invariant, and it holds *because* nothing outside the class can assign to `last_`.

Three pieces of syntax in there to name:

- `explicit RateLimiter(double max_step) : max_step_(max_step) {}` is a **constructor** with a **member initialiser list**. `explicit` stops the compiler from silently converting a `double` into a `RateLimiter`, which is what you want for almost every one-argument constructor. The next module covers construction properly.
- `double value() const` is a **const member function**: it promises not to modify the object, which is what lets it be called through a `const RateLimiter&`.
- The trailing underscore on `max_step_` and `last_` is a naming convention for private members. Projects differ; consistency is what matters.

`const` on member functions is enforced. Calling a non-const member through a const reference:

```text
p5.cpp:10:13: error: passing 'const RateLimiter' as 'this' argument discards qualifiers [-fpermissive]
   10 |     rl.apply(1.0);            // apply is not const
      |     ~~~~~~~~^~~~~
p5.cpp:3:12: note:   in call to 'double RateLimiter::apply(double)'
```

So the habit is: mark every member function `const` that does not modify the object, immediately, because adding it later means touching every caller that has meanwhile been forced to take a non-const reference.

## Access specifiers

`public` members are reachable by anyone; `private` only by the class's own members and its friends; `protected` also by derived classes (which this module does not need — inheritance is the next module's subject).

```text
p1.cpp:12:8: error: 'double RateLimiter::max_step_' is private within this context
   12 |     rl.max_step_ = 100.0;
      |        ^~~~~~~~~
p1.cpp:6:12: note: declared private here
```

That error is the whole value proposition. In Python the equivalent line runs, and the invariant is gone with no trace in any log.

::: key
`struct` and `class` differ only in default access: `public` for `struct`, `private` for `class`. Use `struct` for data with no invariant, `class` when the object must keep something true about itself, and make every member function `const` that does not modify the object.
:::

## `enum class`

A plain C-style `enum` has two defects, and both are the kind that produce a plausible wrong answer.

**Its enumerators leak into the surrounding scope.** `enum Colour { Red, Green };` introduces `Red` and `Green` as names in the enclosing namespace, so a second enumeration cannot reuse either.

**It converts implicitly to an integer.** So it compares equal to integers, and to *other* enumerations:

```cpp
enum Colour { Red, Green };
enum Fruit  { Apple, Red2 };

int x = Red;                   // plain enum converts silently
bool same = (Red == Apple);    // comparing unrelated enums
```

g++ 13.3.0 catches the second with `-Wall`:

```text
p4.cpp:6:22: warning: comparison between 'enum Colour' and 'enum Fruit' [-Wenum-compare]
    6 |     bool same = (Red == Apple);   // comparing unrelated enums
      |                  ~~~~^~~~~~~~
```

but it says nothing about `int x = Red;`, which is legal and often intended in C code. `same` is `true`, because both enumerators are zero.

`enum class` fixes both. The enumerators are scoped to the type, so you write `Mode::Coast`, and there is no implicit conversion in either direction:

```text
p3.cpp:4:19: error: cannot convert 'Mode' to 'int' in initialization
    4 |     int m = Mode::Ascent;      // no implicit conversion
      |             ~~~~~~^~~~~~
```

You can still convert, deliberately, with `static_cast` — which is exactly the property you want at a wire-format boundary, where the conversion should be a visible line of code.

::: key
`enum class` is scoped (you must write `Mode::Coast`) and does not implicitly convert to `int`, so it cannot silently mix with unrelated enums or integers. Plain enums leak their enumerators into the surrounding scope.
:::

::: example A flight-mode enumeration that survives the downlink
The mode has to be one byte on the wire, must not be confusable with any other small integer in the program, and must be printable in telemetry.

```cpp
enum class Mode : std::uint8_t { Idle, Ascent, Coast, Entry, Landing };

const char* name(Mode m) {
    switch (m) {
        case Mode::Idle:    return "IDLE";
        case Mode::Ascent:  return "ASCENT";
        case Mode::Coast:   return "COAST";
        case Mode::Entry:   return "ENTRY";
        case Mode::Landing: return "LANDING";
    }
    return "UNKNOWN";
}
```

```text
mode = COAST
sizeof(Mode)        = 1
on the wire         = 2
back from the wire  = LANDING
```

`: std::uint8_t` fixes the **underlying type**, so `sizeof(Mode)` is 1 and the value in a packet is exactly the byte you expect. Without it the underlying type is implementation-defined (`int` in practice), and your one-byte field becomes four.

Now the part that matters for review. Delete the `Landing` case and rebuild:

```text
p2.cpp:6:12: warning: enumeration value 'Landing' not handled in switch [-Wswitch]
    6 |     switch (m) {
      |            ^
```

`-Wswitch`, which `-Wall` enables, warns when a `switch` over an enumeration does not handle every enumerator *and has no `default:` label*. With `-Werror` that is a build failure — so the day someone adds a sixth mode, every switch that forgot it stops the build.

Adding `default: return "UNKNOWN";` would silence that warning permanently, and the new mode would then report as `"UNKNOWN"` in telemetry: plausible output hiding a missing branch. Keep the `return` *after* the switch instead, as above. It satisfies the requirement that the function always return a value, it handles a byte from the wire that is not a valid enumerator — `static_cast<Mode>(4)` is `Landing`, but `static_cast<Mode>(99)` would reach it — and it leaves the enumerator check intact.
:::

::: warning
`static_cast<Mode>(n)` does not validate `n`. Casting an arbitrary byte from a packet to an `enum class` gives you a `Mode` object holding a value that is not any of the named enumerators, and every `switch` on it falls through to whatever comes after. Validate at the boundary: check the byte against the known range *before* casting, and treat anything else as a fault, not as a mode.
:::

## Namespaces

A namespace is a named scope for declarations. It prevents collisions between parts of a program written by different people, and it participates in the mangled symbol, so `gnc::nav::norm` and `gnc::ctrl::norm` are different symbols to the linker.

```cpp
namespace gnc::nav {
struct Vec3 { double x, y, z; };
double norm(const Vec3& v) { return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
}  // namespace gnc::nav

namespace gnc::ctrl {
double norm(double u) { return std::fabs(u); }
}  // namespace gnc::ctrl
```

```text
gnc::nav::norm  = 5.000
gnc::ctrl::norm = 2.500
after using     = 5.000
```

`namespace gnc::nav { }` is the C++17 nested form, equivalent to `namespace gnc { namespace nav { } }`. The closing comment is a convention worth adopting: namespaces have no visual end.

Three ways to shorten a name, in decreasing order of safety:

- **Qualify it.** `gnc::nav::norm(r)`. Always correct, sometimes verbose.
- **A using-declaration.** `using gnc::nav::norm;` brings in *one name*, and only into the scope where you wrote it. Safe inside a function or a `.cpp`.
- **A using-directive.** `using namespace gnc::nav;` brings in *everything*. Acceptable inside a function or at the top of a `.cpp`; never in a header.

::: warning
`using namespace std;` in a header is imposed on every translation unit that includes it, directly or transitively, and it pulls in several hundred names. A project that has a `count`, a `data`, a `size`, a `distance` or a `transform` of its own can then find a call resolving to the standard library's instead, or becoming ambiguous, in files whose authors never asked for any of it. The failure appears far from the header that caused it. Qualify names in headers, always.
:::

Remember the anonymous namespace from lesson 02. `namespace { ... }` in a `.cpp` gives internal linkage: the names inside are invisible to the linker and cannot collide with anything, which is what you want for a file's private helpers.

::: example Organising a small GNC library
A layout that scales, using everything in this lesson:

```cpp
// gnc/nav/imu.hpp
#pragma once
#include <cstdint>

namespace gnc::nav {

enum class ImuHealth : std::uint8_t { Ok, Stale, Saturated, Failed };

struct ImuSample {                  // no invariant: a struct
    std::uint32_t t_ms;
    float ax, ay, az;
};

class ImuMonitor {                  // has an invariant: a class
public:
    explicit ImuMonitor(std::uint32_t stale_after_ms) : stale_after_ms_(stale_after_ms) {}
    void update(const ImuSample& s, std::uint32_t now_ms);
    ImuHealth health() const { return health_; }
    std::uint32_t last_update_ms() const { return last_ms_; }

private:
    std::uint32_t stale_after_ms_;
    std::uint32_t last_ms_{0};
    ImuHealth health_{ImuHealth::Stale};
};

}  // namespace gnc::nav
```

Read what the header tells a reviewer without any comments. `ImuSample` is public data because every combination of a timestamp and three accelerations is meaningful. `ImuMonitor` keeps `health_` private because it must be consistent with `last_ms_` and `stale_after_ms_`, and only `update` may change either. `health()` and `last_update_ms()` are `const`, so a caller holding a `const ImuMonitor&` can read the state without being able to disturb it. `ImuHealth` is an `enum class` with a one-byte underlying type, so it can go in a packet and cannot be confused with `Mode` or with an `int`. And everything is inside `gnc::nav`, so the propulsion team's `ImuSample` — if they have one — is a different type with a different mangled name.

The `.cpp` then contains the definition of `update` and, in an anonymous namespace, anything only it needs:

```cpp
// gnc/nav/imu.cpp
#include "gnc/nav/imu.hpp"

namespace gnc::nav {
namespace {
constexpr float kSaturationLimit = 160.0F;   // m/s^2, internal to this file
bool saturated(const ImuSample& s) {
    return s.ax >= kSaturationLimit || s.ay >= kSaturationLimit || s.az >= kSaturationLimit;
}
}  // namespace

void ImuMonitor::update(const ImuSample& s, std::uint32_t now_ms) {
    last_ms_ = s.t_ms;
    if (now_ms - s.t_ms > stale_after_ms_) health_ = ImuHealth::Stale;
    else if (saturated(s))                 health_ = ImuHealth::Saturated;
    else                                   health_ = ImuHealth::Ok;
}
}  // namespace gnc::nav
```

`saturated` and `kSaturationLimit` have internal linkage, so no other file can call or collide with them, and `ImuMonitor::update` is defined once, in one translation unit, exactly as the one-definition rule requires.
:::

## Check yourself

::: check
Your team's code has `struct ControlState { double integral; double last_error; };` and a reviewer asks for it to become a `class`. What would they be asking for, beyond the keyword?
:::

::: answer
They are asking you to identify an invariant and protect it. As a `struct` with public members, any code anywhere can set `integral` to anything, so nothing about the object is guaranteed — including, for example, that the integral stays within its anti-windup limit. Turning it into a `class` means making the members private and exposing operations that preserve the invariant: an `accumulate(error, dt)` that clamps, a `reset()`, and `const` accessors. If there is genuinely no invariant — if every combination of values is valid and the type is a plain record — then `struct` is correct and the reviewer is wrong, and saying so with the invariant named is the right answer.
:::

::: check
`enum Colour { Red, Green };` and `enum Fruit { Apple, Red2 };` — `Red == Apple` is `true` and g++ warns. With `enum class` for both, what happens instead?
:::

::: answer
The comparison does not compile. Scoped enumerations do not convert to integers or to each other, so `Colour::Red == Fruit::Apple` has no valid operator and the build fails rather than producing a `true` that happens to be right for the wrong reason — both enumerators are zero, which is why the plain version compares equal. The scoping also means `Red` alone is not a name in the enclosing scope at all, so the two enumerations could both have used `Red` without colliding. That is the whole argument for `enum class`: what was a warning about a coincidence becomes a type error about a category mistake.
:::

::: check
Why does `enum class Mode : std::uint8_t` matter for a telemetry field, given that the enumerators are all small?
:::

::: answer
Without an explicit underlying type, the enumeration's underlying type is implementation-defined — in practice `int`, so four bytes — and `sizeof(Mode)` would be 4. A struct holding it as a packet field would then be four bytes wider than intended, and a ground station expecting one byte would misparse everything after it. Fixing the underlying type to `std::uint8_t` makes `sizeof(Mode)` exactly 1, makes the byte on the wire exactly the enumerator's value, and — a secondary benefit — makes the enumeration usable in a forward declaration, because its size is known without its definition.
:::

::: check
A switch over `Mode` handles four of five enumerators and has no `default`. What does g++ do, and why is adding `default:` the wrong fix?
:::

::: answer
g++ with `-Wall` warns: "enumeration value 'Landing' not handled in switch [-Wswitch]", and with `-Werror` the build fails. Adding `default:` tells the compiler that every unlisted value is handled, so the warning disappears — permanently, for that switch and for every enumerator anyone adds afterwards. You have traded a build failure, which someone must fix, for a silent fall-through into a generic branch, which reports something plausible in telemetry and hides the missing logic. The right fix is to handle `Landing` explicitly, and to put any fallback `return` *after* the switch rather than inside it, so the exhaustiveness check stays alive while the function still always returns.
:::

::: check
A header in your project ends with `using namespace std;`. Describe a failure it could cause in a file that never mentions the standard library.
:::

::: answer
Every translation unit that includes that header — including ones that include it only indirectly — gets several hundred standard-library names in its global scope. Suppose one of those files has its own free function `count(const Samples&)`. A call to `count(s)` now has two candidates, the project's and `std::count`, and depending on the argument types the call may become ambiguous, or silently resolve to the standard one, producing a compile error or wrong behaviour in a file whose author never asked for any of this. The error appears far from the header that caused it, and it appears the day someone adds an unrelated include. Headers should qualify every name they use; a using-directive belongs, at most, inside a function or at the top of a `.cpp`.
:::

## Summary

| Feature | What it does |
| --- | --- |
| `struct` | class with default `public` access; use for data with no invariant |
| `class` | class with default `private` access; use when an invariant must hold |
| `public` / `private` / `protected` | anyone / the class and its friends / also derived classes |
| const member function | `double value() const` promises not to modify the object; required to call it through a `const&` |
| `explicit` constructor | blocks implicit conversion from the argument type |
| plain `enum` | enumerators leak into the enclosing scope and convert to `int` |
| `enum class` | scoped enumerators, no implicit conversion; convert with `static_cast` |
| `enum class X : std::uint8_t` | fixes the underlying type, so `sizeof(X)` is 1 and the wire byte is exact |
| `-Wswitch` | warns when a `switch` over an enumeration misses an enumerator and has no `default` |
| `namespace gnc::nav { }` | nested namespace; becomes part of the mangled symbol |
| using-declaration | `using gnc::nav::norm;` — one name, current scope |
| using-directive | `using namespace X;` — everything; never in a header |
| anonymous namespace | internal linkage for a `.cpp` file's private helpers |

Lesson 11 asks where all of these objects actually live: the stack, the heap and static storage, and exactly when each one is created and destroyed.
