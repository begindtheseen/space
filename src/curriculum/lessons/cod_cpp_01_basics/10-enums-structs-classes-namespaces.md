---
id: l10-enums-structs-classes-namespaces
title: enum class, struct and class, access and namespaces
minutes: 22
covers:
  - enum class; struct and class; access specifiers; namespaces
---

Think about three things in a family car. The glove box holds whatever you put in it, and anyone can reach in. The engine computer is sealed, and you only talk to it through the pedals and the dashboard. The gear lever has exactly five positions — P, R, N, D, L — and there is no position called "3.7". And if two kids in the same school are both named Alex, the teachers add a last name so nobody gets mixed up.

C++ has a tool for each of those. A **`struct`** is the open glove box: a bundle of data anyone can read and write. A **`class`** is the sealed engine computer: its data is locked away, and you use it through a few approved controls. An **`enum class`** is the gear lever: a type whose only values are the ones you named. A **`namespace`** is the last name: it keeps two people's `norm` functions from being confused.

Python has versions of these, but they are polite agreements: a leading underscore means "please do not touch", and nothing stops you. C++ enforces every one. On a flight computer that is the point. A flight-mode number that quietly turns into an integer will one day be compared with the wrong byte from a **[[telemetry|telemetry]]** packet. Data that anyone can write has no rule a reviewer can trust. And a program with hundreds of source files needs its names organized, or lesson 03's "multiple definition" error becomes a weekly event.

## `struct` and `class`: the same tool, two defaults

Start with a paper form: a line for the time, three boxes for the accelerations an **IMU** — inertial measurement unit, the vehicle's motion sensor — measured. You fill it in, you hand it on. Nothing on the form has to agree with anything else. That is a **`struct`** — a named bundle of variables, called **members**, that travel together.

Now picture a speed limiter on a golf cart. However hard you stamp on the pedal, the speed can only creep up by a small step each moment. For that to be true, nobody may reach in and set the speed directly. That rule — "the output never jumps by more than one step" — is a **[[class invariant|invariant]]**: something that must stay true about an object for its whole life. An object with an invariant needs locked data. That is what a **`class`** is for.

Surprisingly, `struct` and `class` are the *same language feature*. The only difference is the default **access**, meaning who may touch the members:

- in a `struct`, members are **`public`** unless you say otherwise — anyone can use them;
- in a `class`, members are **`private`** unless you say otherwise — only the class's own code can use them.

So the keyword is a message to the reader. The convention:

- use **`struct`** for plain data with no invariant, where every combination of member values is valid: `ImuSample`, `Vec3`, `TelemetryHeader`;
- use **`class`** when the object must keep something true about itself, so the data is private and only the operations that preserve the rule are public.

```cpp
#include <cstdint>
#include <cstdio>

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

int main() {
    ImuSample s{100, 0.0F, 0.0F, -9.81F};
    std::printf("aggregate init: t=%u az=%.2f\n", s.t_ms, s.az);
    RateLimiter rl{0.1};
    for (int i = 0; i < 4; ++i) std::printf("apply(1.0) -> %.3f\n", rl.apply(1.0));
    std::printf("value() = %.3f\n", rl.value());
}
```

```text
aggregate init: t=100 az=-9.81
apply(1.0) -> 0.100
apply(1.0) -> 0.200
apply(1.0) -> 0.300
apply(1.0) -> 0.400
value() = 0.400
```

The first line shows the struct filled in one go from a list in braces, `{100, 0.0F, 0.0F, -9.81F}`, in the order the members are declared. That is called **[[aggregate initialization|aggregate]]**, and it works because `ImuSample` has no private parts and no constructor. Then the limiter is asked four times for 1.0. Each call moves the output up by 0.1, never more. That "at most 0.1" is the invariant, and it holds *because* nothing outside the class can assign to `last_`.

Three pieces of syntax in there deserve names.

- `explicit RateLimiter(double max_step) : max_step_(max_step) {}` is a **constructor** — the function that runs when an object is created. The part after the colon is a **member initializer list**: it sets `max_step_` from the argument before the body `{}` runs. The word **`explicit`** stops the compiler from quietly turning a plain `double` into a `RateLimiter` when some function expects one. You want it on almost every one-argument constructor. Constructors get a whole module of their own later in the track.
- `double value() const` is a **const member function**. The `const` after the parentheses promises that calling it will not change the object. That promise is what allows you to call it through a `const RateLimiter&`, read aloud as "a reference to a const RateLimiter" — a read-only view of someone else's object.
- The trailing underscore on `max_step_` and `last_` is a naming habit for private members. Projects differ; what matters is picking one.

The compiler checks the `const` promise. Here is what g++ 13.3.0 says when a function holding a read-only reference calls `apply`, which is not `const`:

```cpp
void use(const RateLimiter& rl) {
    rl.apply(1.0);            // apply is not const
}
```

```text
p5.cpp:3:13: error: passing 'const RateLimiter' as 'this' argument discards qualifiers [-fpermissive]
    3 |     rl.apply(1.0);            // apply is not const
      |     ~~~~~~~~^~~~~
rl.hpp:5:12: note:   in call to 'double RateLimiter::apply(double)'
```

Read it as: "you tried to hand a read-only object to a function that might change it." The word **[[this|this-pointer]]** in the message is the hidden argument every member function receives — the object it was called on.

So here is the habit: mark every member function that does not change the object `const` the moment you write it. Added later, it means touching every caller that was meanwhile forced to take a non-const reference.

## Access specifiers: who may touch what

The words `public:` and `private:` are **access specifiers**. Each one applies to every member below it, until the next one. There are three:

- **`public`** — anyone may use the member;
- **`private`** — only the class's own member functions, and its **[[friends|friend]]**, may use it;
- **`protected`** — like `private`, but also reachable from classes built on top of this one. That is called inheritance, and a later module, on classes and object lifecycles, covers it. This module does not need it.

Here is what happens when outside code reaches for a private member:

```cpp
int main() {
    RateLimiter rl{0.1};
    rl.max_step_ = 100.0;
}
```

```text
p1.cpp:9:8: error: 'double RateLimiter::max_step_' is private within this context
    9 |     rl.max_step_ = 100.0;
      |        ^~~~~~~~~
p1.cpp:5:12: note: declared private here
```

That error is the whole value of a class. In Python, `rl._max_step = 100.0` runs, and the invariant is gone with no trace in any log. In C++ the build stops and names the line.

::: key
`struct` and `class` differ only in default access: `public` for `struct`, `private` for `class`. Use `struct` for data with no invariant, `class` when the object must keep something true about itself, and make every member function `const` that does not modify the object.
:::

## `enum class`: a type with a fixed list of values

A gear lever has five positions and no others. If you want a variable that holds one of five flight modes, you want the same thing: a type whose only legal values are the ones you listed. That is an **enumeration**. Each named value in it is an **enumerator**.

C++ inherited an older kind from C, the plain `enum`. It has two defects, and both produce a believable wrong answer rather than an error.

**Its enumerators leak into the surrounding scope.** Writing `enum Colour { Red, Green };` makes `Red` and `Green` names in the enclosing namespace, as if you had declared them on their own. A second enumeration in the same place cannot use `Red` again.

**It converts to an integer without being asked.** So it compares equal to integers, and even to values from a *different* enumeration:

```cpp
#include <cstdio>
enum Colour { Red, Green };
enum Fruit  { Apple, Red2 };
int main() {
    int x = Red;                   // plain enum converts silently
    bool same = (Red == Apple);    // comparing unrelated enums
    std::printf("x = %d, same = %d\n", x, same);
}
```

g++ 13.3.0 with `-Wall` catches the comparison:

```text
p4.cpp:6:22: warning: comparison between 'enum Colour' and 'enum Fruit' [-Wenum-compare]
    6 |     bool same = (Red == Apple);    // comparing unrelated enums
      |                  ~~~~^~~~~~~~
```

It says nothing about `int x = Red;`, which is legal C. The program prints:

```text
x = 0, same = 1
```

`same` is 1, meaning true. A red thing equals an apple, because the first enumerator of each list is numbered 0.

An **`enum class`** — also called a **scoped enumeration** — fixes both defects. Its enumerators live inside the type, so you must write the type's name, two colons, then the enumerator: `Mode::Coast`, read "Mode, scope, Coast" or "Mode colon-colon Coast". The `::` is the **scope resolution operator**; it means "the name on the right, found inside the name on the left". And there is no quiet conversion in either direction:

```cpp
enum class Mode { Idle, Ascent };
int main() {
    int m = Mode::Ascent;      // no implicit conversion
    return m;
}
```

```text
p3.cpp:3:19: error: cannot convert 'Mode' to 'int' in initialization
    3 |     int m = Mode::Ascent;      // no implicit conversion
      |             ~~~~~~^~~~~~
```

You can still convert when you mean it, with a **[[named cast|static-cast]]**: `static_cast<int>(Mode::Ascent)`, read "static cast to int". That is exactly right at a **wire-format** boundary, where a mode becomes a byte in a packet: the conversion should be a visible line a reviewer can see.

::: key
`enum class` is scoped (you must write `Colour::Red`) and does not implicitly convert to `int`, so it cannot silently mix with unrelated enums or integers. Plain enums leak their enumerators into the surrounding scope.
:::

### The underlying type

Every enumeration is stored as some integer type, its **underlying type**. For an `enum class` you do not specify, the language fixes it as `int`, which is 4 bytes on the machines you will use. You can choose a different one after a colon: `enum class Mode : std::uint8_t { ... }` stores each `Mode` in one byte. For a plain `enum` with no type given, the compiler picks one big enough for the values, and which one it picks is up to the implementation.

::: example A flight-mode enumeration that survives the downlink
The mode must be one byte on the wire, must not be confused with any other small integer in the program, and must print by name in telemetry.

```cpp
#include <cstdint>
#include <cstdio>

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

int main() {
    Mode m = Mode::Coast;
    std::printf("mode = %s\n", name(m));
    std::printf("sizeof(Mode)        = %zu\n", sizeof(Mode));
    std::uint8_t wire = static_cast<std::uint8_t>(m);
    std::printf("on the wire         = %d\n", wire);
    std::uint8_t rx = 4;
    std::printf("back from the wire  = %s\n", name(static_cast<Mode>(rx)));
}
```

```text
mode = COAST
sizeof(Mode)        = 1
on the wire         = 2
back from the wire  = LANDING
```

The enumerators are numbered from 0 in order: `Idle` 0, `Ascent` 1, `Coast` 2, `Entry` 3, `Landing` 4. So `Coast` goes out as the byte 2, and the byte 4 comes back as `Landing` — both match the list.

`: std::uint8_t` fixes the underlying type, so `sizeof(Mode)` is 1 and the value in a packet is exactly the byte you expect. Without it an `enum class` is an `int` — `sizeof` would be 4 — and your one-byte field would become four.

Now the part that matters in review. Delete the `Landing` case and rebuild:

```text
p2.cpp:6:12: warning: enumeration value 'Landing' not handled in switch [-Wswitch]
    6 |     switch (m) {
      |            ^
```

`-Wswitch`, which `-Wall` turns on, warns when a `switch` over an enumeration misses an enumerator *and has no `default:` label*. With `-Werror` that warning stops the build. So the day someone adds a sixth mode, every `switch` that forgot it fails to compile until someone handles it.

Adding `default: return "UNKNOWN";` would silence that warning for good. A new mode would then show up in telemetry as `"UNKNOWN"`: believable output hiding a missing branch. Keep the `return` *after* the `switch` instead, as above. It does three jobs. It makes sure the function always returns something. It catches a byte from the wire that is not a real enumerator — `static_cast<Mode>(4)` is `Landing`, but `static_cast<Mode>(99)` lands on it and prints `UNKNOWN`. And it leaves the missing-case check switched on.
:::

::: warning
`static_cast<Mode>(n)` does not check `n`. Casting any byte from a packet to an `enum class` gives you a `Mode` holding a value that may match none of the named enumerators, and every `switch` on it skips all its cases. Validate at the boundary: compare the byte with the known range *before* casting, and treat anything else as a fault, not as a mode.
:::

## Namespaces: last names for code

Two teams both write a function called `norm`. The navigation team's takes a vector and returns its length. The control team's takes one number and returns its size. Without last names, the linker sees two things called `norm` and complains, exactly as in lesson 03.

A **namespace** is a named region for declarations — a family name for everything inside it. `gnc::nav::norm` and `gnc::ctrl::norm` are different functions to the compiler *and* to the linker, because the namespace becomes part of the **[[mangled symbol|mangled-name]]** in the object file.

```cpp
#include <cmath>
#include <cstdio>

namespace gnc::nav {
struct Vec3 { double x, y, z; };
double norm(const Vec3& v) { return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
}  // namespace gnc::nav

namespace gnc::ctrl {
double norm(double u) { return std::fabs(u); }
}  // namespace gnc::ctrl

int main() {
    gnc::nav::Vec3 r{3.0, 4.0, 0.0};
    std::printf("gnc::nav::norm  = %.3f\n", gnc::nav::norm(r));
    std::printf("gnc::ctrl::norm = %.3f\n", gnc::ctrl::norm(-2.5));
    using gnc::nav::norm;
    std::printf("after using     = %.3f\n", norm(r));
}
```

```text
gnc::nav::norm  = 5.000
gnc::ctrl::norm = 2.500
after using     = 5.000
```

Check the numbers. The vector $(3, 4, 0)$ has length $\sqrt{9 + 16 + 0} = \sqrt{25} = 5$. The size of $-2.5$ is $2.5$. Both match.

`namespace gnc::nav { }` is the nested form added in C++17, the same as `namespace gnc { namespace nav { } }`. The comment on the closing brace is worth the habit: a namespace can run for hundreds of lines, and a lone `}` does not say what it closes.

Typing `gnc::nav::` every time gets long. There are three ways to shorten a name, from safest to riskiest:

- **Qualify it.** Write `gnc::nav::norm(r)`. Always correct, sometimes wordy.
- **A using-declaration.** `using gnc::nav::norm;` brings in *one name*, and only inside the scope where you wrote it — the last line of `main` above. Safe inside a function or a `.cpp` file.
- **A using-directive.** `using namespace gnc::nav;` brings in *every* name in the namespace. Acceptable inside a function or at the top of a `.cpp` file. Never in a header.

::: warning
`using namespace std;` in a header is forced on every translation unit that includes that header, directly or through other headers, and it drags hundreds of standard names into view. A file that has its own `count`, `data`, `size`, `distance` or `transform` can then find a name that is ambiguous, or a call that quietly picks the standard library's version — in a file whose author never asked for any of it. The error shows up far from the header that caused it. In headers, always write names out in full.
:::

One more namespace you have already met. In lesson 02, `namespace { ... }` — a namespace with no name, the **anonymous namespace** — gave everything inside it **internal linkage**: the names are invisible to the linker outside that `.cpp` file and cannot collide with anything. That is where a file's private helper functions belong.

::: example Organizing a small GNC library
Here is a layout that grows well, using everything in this lesson. The **[[folders mirror the namespaces|tree]]**, so `gnc::nav` lives in `gnc/nav/`.

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

Read what the header tells a reviewer without a single explanatory comment.

1. `ImuSample` is public data, because every combination of a timestamp and three accelerations means something.
2. `ImuMonitor` keeps `health_` private. It must agree with `last_ms_` and `stale_after_ms_`, and only `update` may change any of them.
3. `health()` and `last_update_ms()` are `const`, so code holding a `const ImuMonitor&` can read the state but cannot disturb it.
4. `ImuHealth` is an `enum class` with a one-byte underlying type. It can go in a packet, and it cannot be mixed up with `Mode` or with an `int`.
5. Everything sits inside `gnc::nav`. If the propulsion team also has an `ImuSample`, theirs is a different type with a different mangled name.

The `.cpp` file holds the definition of `update` and, in an anonymous namespace, the helpers only it needs:

```cpp
// gnc/nav/imu.cpp
#include "gnc/nav/imu.hpp"
#include <cmath>

namespace gnc::nav {
namespace {
constexpr float kSaturationLimit = 160.0F;   // m/s^2, internal to this file
bool saturated(const ImuSample& s) {
    return std::fabs(s.ax) >= kSaturationLimit || std::fabs(s.ay) >= kSaturationLimit ||
           std::fabs(s.az) >= kSaturationLimit;
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

`ImuMonitor::update` reads "update, the one that belongs to ImuMonitor": the `::` says which class this definition is for. A monitor built with `ImuMonitor mon{50};` and fed a 10 ms-old sample of $-9.81\,\mathrm{m/s^2}$ reports `Ok`. Feed it $-170\,\mathrm{m/s^2}$ and it reports `Saturated`, because $|-170| = 170 \ge 160$. Feed it a sample 100 ms old and it reports `Stale`, because $100 > 50$.

`saturated` and `kSaturationLimit` have internal linkage — `nm -C imu.o` lists them with the lowercase letters `t` and `r` that mark local symbols. And `ImuMonitor::update` is defined once, in one translation unit, as lesson 02's one-definition rule requires.
:::

::: warning
The limit test compares the *size* of each acceleration, `std::fabs(s.ax)`. A sensor saturates at $-160\,\mathrm{m/s^2}$ as surely as at $+160$, and `s.ax >= kSaturationLimit` would catch only one direction.
:::

## Check yourself

::: check
Your team's code has `struct ControlState { double integral; double last_error; };` and a reviewer asks for it to become a `class`. What are they really asking for, beyond the keyword?
:::

::: answer
They are asking you to name an invariant and protect it. With public members, any code can set `integral` to any value, so nothing is guaranteed — for example, that the integral stays within its anti-windup limit. Turning it into a `class` means making the members private and exposing only operations that keep the rule true: an `accumulate(error, dt)` that clamps, a `reset()`, and `const` accessors for reading. If there is truly no invariant — if every combination of values is valid and the type is a plain record — then `struct` is correct and the reviewer is wrong. The right reply then is to say so, and to say why no rule exists.
:::

::: check
`enum Colour { Red, Green };` and `enum Fruit { Apple, Red2 };` — `Red == Apple` is `true`, and g++ warns. If both were `enum class`, what would happen instead?
:::

::: answer
The comparison would not compile. Scoped enumerations do not convert to integers or to each other, so `Colour::Red == Fruit::Apple` has no matching `==` operator. g++ reports `no match for 'operator==' (operand types are 'Colour' and 'Fruit')`, and the build fails. In the plain version the answer was `true` only because both enumerators are numbered 0. Scoping also means both enumerations could have used `Red` without colliding. A warning about a coincidence becomes an error about comparing two different kinds of thing.
:::

::: check
Why does `enum class Mode : std::uint8_t` matter for a telemetry field, when all the enumerators are small numbers anyway?
:::

::: answer
Without the `: std::uint8_t`, an `enum class` has `int` as its underlying type, so `sizeof(Mode)` is 4 on a normal machine, however small the values. A packet struct holding a `Mode` would be three bytes wider than the format says, and a ground station expecting one byte would misread every field after it. Fixing the underlying type makes `sizeof(Mode)` exactly 1 and makes the byte on the wire exactly the enumerator's number — 2 for `Coast`, 4 for `Landing`. Writing the type out also documents the wire size right where the enumeration is declared.
:::

::: check
A `switch` over `Mode` handles four of the five enumerators and has no `default`. What does g++ do, and why is adding `default:` the wrong fix?
:::

::: answer
With `-Wall`, g++ warns `enumeration value 'Landing' not handled in switch [-Wswitch]`; with `-Werror` the build fails. Adding `default:` tells the compiler every unlisted value is handled, so the warning disappears for good, including for every enumerator added later. You have traded a build failure for a silent jump into a generic branch that prints something believable and hides the missing logic. The right fix is to handle `Landing` by name, and to put any fallback `return` *after* the `switch`, so the check stays alive and the function still always returns.
:::

::: check
A header in your project ends with `using namespace std;`. Describe a failure it can cause in a `.cpp` file that never mentions the standard library.
:::

::: answer
Every file that includes the header, even indirectly, gets hundreds of standard names in its global scope. Suppose the header includes `<algorithm>`, and some `.cpp` file has its own `int count = 0;` and `void tick() { ++count; }`. That file now fails: g++ says `reference to 'count' is ambiguous` and lists `std::count` as a candidate. Its author never wrote `std` anywhere. Headers should write every standard name as `std::...`; a using-directive belongs, at most, inside a function or at the top of a `.cpp` file.
:::

## Summary

| Feature | What it does |
| --- | --- |
| `struct` | a class with default `public` access; use for data with no invariant |
| `class` | a class with default `private` access; use when an invariant must hold |
| `public` / `private` / `protected` | anyone / the class and its friends / also classes built on it |
| const member function | `double value() const` promises not to modify the object; needed to call it through a `const&` |
| `explicit` constructor | blocks quiet conversion from the argument type |
| plain `enum` | enumerators leak into the enclosing scope and convert to `int` |
| `enum class` | scoped enumerators, no implicit conversion; convert with `static_cast` |
| `enum class X : std::uint8_t` | fixes the underlying type, so `sizeof(X)` is 1 and the wire byte is exact; default is `int` |
| `-Wswitch` | warns when a `switch` over an enumeration misses an enumerator and has no `default` |
| `namespace gnc::nav { }` | nested namespace; becomes part of the mangled symbol |
| using-declaration | `using gnc::nav::norm;` — one name, current scope |
| using-directive | `using namespace X;` — everything; never in a header |
| anonymous namespace | internal linkage for a `.cpp` file's private helpers |

Lesson 11 asks where all these objects actually live — the stack, the heap or static storage — and exactly when each one is created and destroyed.

::: context telemetry Data sent down from the vehicle
**Telemetry** is the stream of measurements a vehicle sends to the ground: modes, temperatures, pressures, positions, health flags. It travels as **packets** — fixed layouts of bytes where each field sits at an agreed position with an agreed size. The ground station decodes each packet by that same layout. If the vehicle's idea of a field's size and the ground's idea differ by even one byte, every field after it is read from the wrong place, and the numbers on the console look plausible but are nonsense. That is why the next module spends a long time on exactly how each type is laid out in memory.
:::

::: context invariant A promise the object keeps
The word comes from mathematics, where an **invariant** is something that does not change while everything around it does — like the total number of chess pieces never going up. For a class, it is a rule about its data that is true after the constructor finishes and stays true after every public function returns. A bank account class might promise "balance never below zero". The class keeps the promise by making the balance private, so the only way to change it is through functions that check. When a bug breaks an invariant, you know it must be inside the class, because nothing else could reach the data. That shrinks the search from the whole program to one file.
:::

::: context aggregate Filling in a form in one go
An **aggregate** is a simple bundle — an array, or a struct with no private members, no constructors written by you and no virtual functions. You fill one in with a brace list, in declaration order: `ImuSample s{100, 0.0F, 0.0F, -9.81F};` sets `t_ms`, `ax`, `ay` and `az`. Leave values off the end and those members become zero, though `-Wextra` warns "missing initializer", so writing them all out is the better habit. The `F` makes each number a `float` literal, matching the member. The language forbids braces from quietly narrowing a type — a `double` variable into a `float` member — and g++ reports it as `-Wnarrowing`. A class like `RateLimiter`, with private members and its own constructor, is not an aggregate, so its braces call the constructor instead.
:::

::: context this-pointer The object a member function works on
When you write `rl.apply(1.0)`, the compiler passes `rl` to `apply` as a hidden extra argument. Inside the function it is called **`this`**, and it points to the object the call was made on — that is how `last_` knows *whose* `last_` it is. Marking a member function `const` changes the type of that hidden argument to "pointer to const object". So calling a non-const function on a const object means handing a read-only object to a function that asked for a writable one, which the compiler rejects — hence the wording "passing 'const RateLimiter' as 'this' argument discards qualifiers". A **qualifier** here is the word `const`; "discards" means the call would throw that protection away.
:::

::: context friend A key given to one outsider
A class can name a specific function or another class as a **friend**, writing `friend` followed by its declaration inside the class. A friend gets the same access to private members as the class's own functions. It is used sparingly — for example, for an output operator that prints a class's private state, or for a unit test that must inspect internals. Friendship is granted by the class, never claimed from outside, so the list of code that can break the invariant is still written in one place: the class definition. The later module on classes covers friend functions alongside static members.
:::

::: context static-cast Casts you can find with a search
C++ has several named casts, and **`static_cast`** is the everyday one: a conversion the compiler can check makes sense, such as an enumeration to its number or a `double` to an `int`. The name is long on purpose. C's old cast, `(int)x`, is short and hard to spot, and it will also perform far more dangerous conversions without a word. A named cast stands out in review, and a text search for `static_cast` finds every place the code crosses from one type to another — which, at a telemetry boundary, is exactly the list of lines worth checking twice.
:::

::: context mangled-name The namespace inside the symbol
The compiler encodes a function's namespace, name and parameter types into one symbol, so the linker can tell overloads and namespaces apart. For the program above, `nm ns.o` shows two different symbols for the two `norm` functions:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">_ZN3gnc3nav4normERKNS0_4Vec3E</text>
  <g font-size="11" text-anchor="middle">
    <rect x="10" y="34" width="36" height="22" fill="#6c7a93"/><text x="28" y="49" fill="#fff">_ZN</text>
    <rect x="50" y="34" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="72" y="49" fill="#1f2a44">3gnc</text>
    <rect x="98" y="34" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="120" y="49" fill="#1f2a44">3nav</text>
    <rect x="146" y="34" width="50" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="171" y="49" fill="#1f2a44">4norm</text>
    <rect x="200" y="34" width="150" height="22" fill="#fff" stroke="#1f2a44"/><text x="275" y="49" fill="#1f2a44">E RKNS0_4Vec3E</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="28" y="74">nested name</text>
    <text x="96" y="74">namespaces</text>
    <text x="171" y="74">function</text>
    <text x="275" y="74">end, then const Vec3&amp;</text>
  </g>
  <text x="10" y="110" font-size="12" fill="#1f2a44" font-weight="700">_ZN3gnc4ctrl4normEd</text>
  <text x="10" y="130" font-size="11" fill="#6c7a93">gnc, ctrl, norm, then d = one double parameter</text>
</svg>
```

Each name is written as its length and then its letters: `3gnc`, `4norm`. `nm -C` translates the symbols back to `gnc::nav::norm(gnc::nav::Vec3 const&)` and `gnc::ctrl::norm(double)`.
:::

::: context tree Folders that mirror namespaces
A common convention is to make the folder path match the namespace, so a reader who sees `gnc::nav::ImuMonitor` knows the file is under `gnc/nav/`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="16" y="24" font-weight="700">gnc/</text>
    <text x="46" y="52" font-weight="700">nav/</text>
    <text x="76" y="80">imu.hpp</text>
    <text x="76" y="104">imu.cpp</text>
    <text x="46" y="132" font-weight="700">ctrl/</text>
    <text x="76" y="158">limiter.hpp</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <path d="M26,30 V128 M26,48 H42 M26,128 H42"/>
    <path d="M56,58 V100 M56,76 H72 M56,100 H72"/>
    <path d="M56,138 V154 H72"/>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="190" y="24">namespace gnc</text>
    <text x="190" y="52">namespace gnc::nav</text>
    <text x="190" y="80">ImuSample, ImuMonitor</text>
    <text x="190" y="104">update, saturated</text>
    <text x="190" y="132">namespace gnc::ctrl</text>
  </g>
</svg>
```

The include line then reads like the namespace: `#include "gnc/nav/imu.hpp"`, compiled with `-I.` so the compiler searches from the project's top folder.
:::
