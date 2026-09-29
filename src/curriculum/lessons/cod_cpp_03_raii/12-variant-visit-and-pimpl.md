---
id: l12-variant-visit-and-pimpl
title: std::variant for fixed sets of types, and PIMPL for hiding a class's insides
minutes: 22
covers:
  - std::variant plus std::visit as a closed-set alternative to virtual dispatch
  - PIMPL for compilation firewalls
---

A traffic light has exactly three states: red, yellow, green. Nobody will plug a fourth color into it next year. Its software should list the three states and make sure every piece of code handles all three.

A launch vehicle's flight modes are like that. Before liftoff it is in **Prelaunch**. After liftoff it is in **Ascent**. When the engine cuts off it goes into **Coast**. When it falls back into the thick air it is in **Entry**. Each mode carries its own data — a countdown, a throttle setting, a predicted peak altitude, a heating rate — and the list is fixed when the software is written. Virtual functions, from the last two lessons, are built for an *open* set, where anyone can add new kinds later. For a *closed* set like this one, C++ has a better-fitting tool: `std::variant`, together with `std::visit`.

The second half of this lesson turns to a different problem: build time. Changing one private member of a widely used class can force hundreds of files to recompile. The **PIMPL** idiom puts a wall between a class's public face and its insides, so the insides can change without anyone else noticing. It is the last topic of this module.

## A value that is one of a fixed list

`std::variant`, from the header `<variant>`, holds exactly one value out of a fixed list of types:

```cpp
using Mode = std::variant<Prelaunch, Ascent, Coast, Entry>;
```

Read it aloud as "a variant of `Prelaunch`, `Ascent`, `Coast` or `Entry`". The types in the angle brackets are the **alternatives**. A `Mode` holds one of them at a time, plus a small number that says which one: its **index**, counting from 0 in the order listed. Assigning a different alternative destroys the old one and stores the new one.

Three facts make `std::variant` different from the `Sensor*` world of lesson 10.

- **It is a value.** The alternative is stored inside the variant itself, not somewhere on the heap. A `Mode` is as big as its largest alternative plus room for the index. Copying a `Mode` copies the whole state. Nothing is sliced, because there is no base class to slice into.
- **No heap, no vtable.** Creating or changing a mode never calls `new`. That matters in flight code, which usually forbids allocation once the vehicle is flying.
- **The list is part of the type.** The compiler knows every alternative, so it can check that your code handles all of them.

This design is an old idea with a new safety lock: a **[[tagged union|tagged-union]]**, where the tag and the data can never disagree.

You can ask a variant what it holds:

- `m.index()` gives the index, so `Coast` is 2 in the list above.
- `std::holds_alternative<Coast>(m)` is `true` if it holds a `Coast`.
- `std::get_if<Coast>(&m)` returns a pointer to the `Coast` inside, or `nullptr` if it holds something else. Test it before use.
- `std::get<Coast>(m)` returns a reference, and throws `std::bad_variant_access` if the variant holds something else.

Checking the index by hand everywhere is an `if` chain again. Better to let the variant call the right function for you.

## Visiting: one function per alternative

`std::visit(visitor, m)` looks at which alternative `m` holds and calls `visitor` with it. The **visitor** is any object that can be called with each alternative. Lesson 9 showed how to make a class callable: give it an `operator()`, the call operator. A visitor is a class with one `operator()` per alternative:

```cpp
struct Describe {
    void operator()(const Prelaunch& p) const { std::printf("T-%.0f s\n", p.hold_s); }
    void operator()(const Ascent& a)    const { std::printf("throttle %.0f%%\n", 100 * a.throttle); }
    void operator()(const Coast& c)     const { std::printf("apogee %.0f km\n", c.apogee_m / 1000); }
    void operator()(const Entry& e)     const { std::printf("heating %.1f W/cm^2\n", e.heat_w_per_cm2); }
};
```

With `Mode m = Ascent{0.8};`, the line `std::visit(Describe{}, m);` printed `throttle 80%`. After `m = Coast{105000.0};` it printed `apogee 105 km`: ordinary overload resolution, on the type actually stored.

### Lambdas, in brief

Writing a whole named class for every visitor gets tiresome. C++ lets you write a small callable object in place, called a **[[lambda|lambda-bridge]]**:

```cpp
auto add = [](double a, double b) { return a + b; };   // add(2.0, 0.5) gives 2.5
```

Read `[]` as "a lambda that captures nothing". The parentheses hold the parameters, the braces the body. Behind the scenes, the compiler writes a class with an `operator()` exactly like `Describe`'s, and makes one object of it. `[&]` instead of `[]` means "this lambda may use the local variables around it, by reference". The next module teaches lambdas fully; this is enough to read the code below.

### The overloaded-lambda trick

One lambda has one `operator()`. A visitor needs four. This small helper glues several lambdas into one object:

```cpp
template <class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
```

Read it slowly. `template <class... Ts>` is "a template taking any number of types, called the pack `Ts`" — the three dots mean "zero or more of these". `: Ts...` means `overloaded` derives from every one of those types at once. `using Ts::operator()...;` pulls every base's call operator into `overloaded`, so they form one set of overloads. Hand it four lambdas and you get one object with four `operator()`s — a visitor. This is inheritance used purely at compile time: no virtual functions anywhere.

In C++20 you write `overloaded{ lambda1, lambda2, ... }` and the compiler works out `Ts` from the lambdas. In C++17 that deduction fails — g++ says "class template argument deduction failed" — unless you add one more line, a [[deduction guide|deduction-guide]]: `template <class... Ts> overloaded(Ts...) -> overloaded<Ts...>;`.

::: example A four-mode flight state machine
```cpp
#include <cstdio>
#include <variant>

// The four flight modes. Each carries only the data that mode needs.
struct Prelaunch { double hold_s; };            // seconds left in the count
struct Ascent    { double throttle; };          // 0 to 1
struct Coast     { double apogee_m; };          // predicted peak altitude
struct Entry     { double heat_w_per_cm2; };    // heating rate on the shield

using Mode = std::variant<Prelaunch, Ascent, Coast, Entry>;

// The overloaded-lambda helper: one object with every lambda's operator().
template <class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };

// Inputs the state machine reacts to on each tick.
struct Inputs { bool liftoff; bool engine_out; bool below_100km; };

Mode step(const Mode& m, const Inputs& in) {
    return std::visit(overloaded{
        [&](const Prelaunch& p) -> Mode {
            if (in.liftoff) return Ascent{1.0};
            return Prelaunch{p.hold_s - 1.0};
        },
        [&](const Ascent& a) -> Mode {
            if (in.engine_out) return Coast{105000.0};
            return a;
        },
        [&](const Coast& c) -> Mode {
            if (in.below_100km) return Entry{12.0};
            return c;
        },
        [&](const Entry& e) -> Mode { return e; },
    }, m);
}

const char* name(const Mode& m) {
    return std::visit(overloaded{
        [](const Prelaunch&) { return "Prelaunch"; },
        [](const Ascent&)    { return "Ascent"; },
        [](const Coast&)     { return "Coast"; },
        [](const Entry&)     { return "Entry"; },
    }, m);
}

int main() {
    std::printf("sizeof(Mode) = %zu, index of Coast = %zu\n",
                sizeof(Mode), Mode{Coast{}}.index());

    const Inputs script[] = {
        {false, false, false},   // still counting down
        {true,  false, false},   // liftoff
        {false, false, false},
        {false, true,  false},   // main engine cutoff
        {false, false, true},    // falling back below 100 km
    };

    Mode mode = Prelaunch{3.0};
    int tick = 0;
    for (const Inputs& in : script) {
        mode = step(mode, in);
        std::printf("tick %d: %s\n", ++tick, name(mode));
    }
    if (const Entry* e = std::get_if<Entry>(&mode))
        std::printf("entry heating %.1f W/cm^2\n", e->heat_w_per_cm2);
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
sizeof(Mode) = 16, index of Coast = 2
tick 1: Prelaunch
tick 2: Ascent
tick 3: Ascent
tick 4: Coast
tick 5: Entry
entry heating 12.0 W/cm^2
```

Walk through it. The size first: every alternative is one `double`, 8 bytes. The index needs only one byte, and padding rounds the total up to a multiple of 8: $8 + 8 = 16$ bytes. There is no pointer to anything elsewhere. The whole flight state is those 16 bytes.

`step` is the state machine. It visits the current mode and returns the next one. Each lambda handles exactly one mode, and receives that mode's own data, already the right type. The `-> Mode` after each lambda's parameters says "this lambda returns a `Mode`", so that returning `Ascent{1.0}` in one branch and `a` in another both become a `Mode`. The `[&]` lets each lambda read `in`, the step's inputs.

Now the ticks. Tick 1: no liftoff, so Prelaunch stays Prelaunch, with the hold counted down from 3 to 2 seconds. Tick 2: liftoff, so the machine moves to Ascent at full throttle. Tick 3: nothing happens, so Ascent returns itself. Tick 4: engine cutoff, so Coast, with an apogee of 105 km — above the 100 km line most people use as the edge of space. Tick 5: falling below 100 km, so Entry.

The last lines use `std::get_if`. The mode really is `Entry` now, so it returned a valid pointer and printed the heating rate. Sanity check: five inputs, five lines, each change on the tick that called for it.
:::

## The compiler checks every case

Here is the feature that makes `std::variant` right for [[mode machines|mode-machines]]. Delete the `Entry` lambda from `name`, and the program no longer compiles. g++ prints a long error, and the line that matters is:

```text
error: no type named 'type' in 'struct std::invoke_result<overloaded<...>, const Entry&>'
```

(the `...` stands for the three long lambda type names). Decoded: "your visitor cannot be called with a `const Entry&`". The compiler tried to build a call for every alternative, and one was missing.

The day someone adds a fifth mode, `Abort`, every `std::visit` that does not handle it stops compiling, and each error points at a place that needs a decision. With virtual functions, a new derived class that forgets to override a non-pure function compiles fine and quietly gets the base behavior.

::: warning The catch-all that switches the check off
A lambda with an `auto` parameter, such as `[](const auto&) { return "other"; }`, accepts *any* type. Put one in a visitor and it silently handles every missing case, including the `Abort` mode added next year. In a mode machine, write one lambda per mode instead, so the compiler keeps checking.
:::

::: key
Prefer `std::variant` plus `std::visit` to virtual dispatch when the set of alternatives is closed and known at compile time, as mode-machine states usually are. You get no heap allocation, no vtable, value semantics, and the compiler tells you when a visitor forgets a case.
:::

### Choosing between the two

The two tools are good at opposite things.

| | virtual functions | `std::variant` + `std::visit` |
| --- | --- | --- |
| set of types | open: anyone can derive later | closed: fixed in the type |
| adding a new type | easy, touches no existing code | touches every visitor, and the compiler finds them |
| adding a new operation | touches every class | easy: write one new visitor |
| storage | usually by pointer, often on the heap | by value, inside the variant |
| missed case | compiles, falls back to the base | compile error |
| per-object overhead | one vptr | an index, plus room for the largest type |

The two middle rows are a famous trade-off called the **[[expression problem|expression-problem]]**. Virtual functions make new types cheap and new operations expensive. A variant makes new operations cheap and new types expensive — but safe, because the compiler lists every place to change.

A vehicle's list of modes rarely changes, while new operations — log it, display it, step it — are added often: the variant's side. A plug-in system where other teams add sensor drivers is the virtual side.

`std::visit` usually compiles to a jump on the index, like a `switch`, and since every alternative's type is known, the lambdas can be inlined. Still, measure your own hot loop, as lesson 11 did.

## PIMPL: a wall between a class and its users

Now the second problem. Think of a restaurant. Diners see the menu. The kitchen can get a new oven or new suppliers, and as long as the menu stays the same, no diner notices.

C++ classes do not naturally work like that. A class's header lists its private members, because the compiler needs them to know the object's size. So add one private `double`, and every file that includes the header must recompile — possibly hundreds, for a change none of them can see.

**PIMPL**, short for "pointer to implementation", fixes this. The header keeps only the public functions and one private pointer. The private members move into a struct defined only in the `.cpp` file. The header becomes a **[[compilation firewall|compilation-firewall]]**: changes behind it do not spread.

```cpp
// recorder.hpp
#pragma once
#include <memory>

class Recorder {
public:
    Recorder();
    ~Recorder();                              // declared here, defined in recorder.cpp
    Recorder(Recorder&&) noexcept;
    Recorder& operator=(Recorder&&) noexcept;

    void log(double t_s, double alt_m);
    int  count() const;

private:
    struct Impl;                              // declared, never defined in the header
    std::unique_ptr<Impl> impl_;
};
```

`struct Impl;` says "a struct called `Impl` exists" without saying what is in it. That makes `Impl` an **[[incomplete type|incomplete-type]]** in the header: the compiler knows its name, not its size. You cannot make an `Impl` object with only that, but you can hold a pointer to one, because every pointer is 8 bytes. The `std::unique_ptr` from the last module owns it and deletes it.

```cpp
// recorder.cpp
#include "recorder.hpp"
#include <cstdio>
#include <vector>

struct Recorder::Impl {                       // the private details live here
    std::vector<double> times, alts;
};

Recorder::Recorder() : impl_(std::make_unique<Impl>()) {}
Recorder::~Recorder() = default;              // Impl is complete here
Recorder::Recorder(Recorder&&) noexcept = default;
Recorder& Recorder::operator=(Recorder&&) noexcept = default;

void Recorder::log(double t_s, double alt_m) {
    impl_->times.push_back(t_s);
    impl_->alts.push_back(alt_m);
}
int Recorder::count() const { return static_cast<int>(impl_->times.size()); }
```

Notice what the header no longer includes: `<vector>`. Files that use `Recorder` do not pay to compile it either.

### Why the destructor must live in the `.cpp`

This is where everyone trips once. Delete `~Recorder();` from the header and its `= default` from the `.cpp`, and `main.cpp` no longer compiles:

```text
/usr/include/c++/13/bits/unique_ptr.h:97:23: error: invalid application of 'sizeof' to incomplete type 'Recorder::Impl'
```

With no destructor declared, the compiler writes one for you, inline, in every file that destroys a `Recorder` — including `main.cpp`. That destructor destroys `impl_`, and `unique_ptr`'s destructor calls `delete` on the `Impl`. To `delete` an object you must know its type in full, so the standard library checks `sizeof(Impl)` on purpose — and in `main.cpp`, `Impl` is incomplete.

The fix is the pattern above: declare the destructor in the header, and define it — even as `= default` — in the `.cpp`, after `Impl` is complete. The same goes for the move operations, which may need to destroy an `Impl` too. Declaring the destructor also stops the compiler from generating the move operations, as lesson 6 showed, which is why they are declared and defaulted by hand. Copying is not provided at all; add it by hand, with a deep copy of `*impl_`, if you need it.

::: example What recompiles when the insides change
The program is three files: the two above and a `main.cpp` that logs three samples. A three-rule `Makefile` says `main.o` depends on `main.cpp` and `recorder.hpp`, and `recorder.o` depends on `recorder.cpp` and `recorder.hpp`. `make` rebuilds only what is older than the files it depends on.

```cpp fragment
// main.cpp
#include "recorder.hpp"
#include <cstdio>

int main() {
    Recorder rec;
    rec.log(0.0, 0.0);
    rec.log(1.0, 4.9);
    rec.log(2.0, 19.6);
    std::printf("%d samples, sizeof(Recorder) = %zu\n", rec.count(), sizeof(Recorder));
}
```

First build, from nothing:

```text
g++ -std=c++20 -Wall -Wextra -O2 -c main.cpp
g++ -std=c++20 -Wall -Wextra -O2 -c recorder.cpp
g++ main.o recorder.o -o app
3 samples, sizeof(Recorder) = 8
```

Both files compiled, then linked. `sizeof(Recorder)` is 8: the object is one pointer.

Now add a private member, `double max_alt_m = 0.0;`, to `Impl` in `recorder.cpp`, and run `make` again:

```text
g++ -std=c++20 -Wall -Wextra -O2 -c recorder.cpp
g++ main.o recorder.o -o app
3 samples, sizeof(Recorder) = 8
```

Only `recorder.cpp` recompiled. `main.cpp` was not touched, because nothing it includes changed. And `sizeof(Recorder)` is still 8: the new member lives inside `Impl`, on the heap.

For contrast, touching `recorder.hpp` — which is what adding a private member to a normal class means — made `make` recompile both `main.cpp` and `recorder.cpp`. Here that is one extra file; for a header included by 300 files, it is 300.

Sanity check on the logged numbers: altitudes of 0, 4.9 and 19.6 m at 0, 1 and 2 s are $\frac{1}{2} \times 9.8 \times t^2$, a free fall read backwards. Three calls to `log`, and `count()` said 3.
:::

### What PIMPL costs, and what else it buys

PIMPL is not free.

- **One heap allocation per object**, in the constructor. In flight code that is fine for objects created once at start-up, and wrong for objects created every cycle.
- **One extra pointer hop** on every member access, `impl_->times`, which the compiler cannot remove.
- **No inlining across the wall.** The member functions live in the `.cpp`, so callers in other files cannot have them inlined — the same barrier lesson 11 measured. Do not put a PIMPL class in a hot loop.

In return, beyond faster rebuilds, it gives **ABI stability**. The **[[ABI|abi-stability]]** is the binary-level contract between compiled pieces of a program: object sizes, member positions, how functions are called. A library shipped as a compiled file can change its `Impl` freely, and programs already compiled against its header keep working, because `sizeof(Recorder)` and the position of every public member stay the same. That is why large libraries that ship as binaries, such as [[Qt|qt-d-pointer]], use this idiom throughout.

::: key
PIMPL moves a class's private members into an `Impl` struct defined only in the `.cpp` and holds it through `std::unique_ptr<Impl>`. Changing the private details then rebuilds one file instead of every includer, and keeps the class's size and layout — its ABI — stable. Declare the destructor (and moves) in the header and define them in the `.cpp`, where `Impl` is complete. The price is a heap allocation, an extra indirection and no inlining.
:::

## Check yourself

::: check
A GNC mode is `std::variant<Standby, Tracking, Safe>`. `Standby` is empty, `Tracking` holds a 4-number quaternion of `double`s, and `Safe` holds one `int`. Roughly how big is the variant, and where does its data live?
:::

::: answer
The largest alternative is `Tracking`: $4 \times 8 = 32$ bytes. The variant needs that much space for whichever alternative it holds, plus the index. With the 8-byte alignment of `double`, the index is padded out, so the total is $32 + 8 = 40$ bytes on a typical 64-bit g++ build. (g++ 13 printed 40.) All of it lives inside the variant object itself — on the stack if the variant is a local, inside the owning object if it is a member. There is no heap allocation and no pointer to anything elsewhere, which is exactly why copying a mode copies the whole state.
:::

::: check
You add a fifth alternative, `Abort`, to the `Mode` from the example. The program has twelve `std::visit` calls. Three of them use a visitor with a `[](const auto&)` lambda. What happens when you compile?
:::

::: answer
The nine visitors that list one lambda per mode fail to compile, each with an error saying the visitor cannot be called with a `const Abort&`. Each points at a place where someone must decide what an abort means. The three visitors with an `auto` catch-all compile silently, and send `Abort` to the catch-all. Those three need a human review, because the compiler has been told not to care. That is the argument for avoiding catch-alls in mode machines.
:::

::: check
Explain why a mode machine written with `std::variant` cannot suffer the object slicing of lesson 10, while one written as `std::vector<Mode*>` of a virtual base class could.
:::

::: answer
Slicing happens when a derived object is copied into a base-sized object: the derived part does not fit and is dropped. A `std::variant` has no base class. It reserves room for its largest alternative and stores whichever alternative it holds, whole, with an index saying which one. Copying a variant copies the index and the whole alternative, so nothing is dropped and the type travels with the data. A virtual base held by value would slice, which forces such designs into pointers, and then into questions of who owns and deletes each mode.
:::

::: check
A teammate writes a PIMPL class, leaves out the destructor declaration, and the build fails in `main.cpp` with "invalid application of 'sizeof' to incomplete type". They propose fixing it by moving `struct Impl { ... };` into the header. Why does that "work", and why is it the wrong fix?
:::

::: answer
It compiles, because now `Impl` is complete everywhere, so the compiler-generated inline destructor can delete it in `main.cpp`. But it defeats the purpose of PIMPL. The private members are back in the header, so every file that includes it recompiles whenever they change, and the header again needs `<vector>` and whatever else `Impl` uses. The right fix is to declare `~Recorder();` in the header and define `Recorder::~Recorder() = default;` in the `.cpp`, after `Impl`'s definition, where the type is complete.
:::

::: check
Would you use PIMPL for a `Vector3` type used in the inner loop of an attitude filter? What about for a telemetry downlink manager created once at start-up?
:::

::: answer
Not for `Vector3`. Every `Vector3` would cost a heap allocation, every access would follow a pointer, and none of its arithmetic could be inlined into callers — the cost lesson 11 measured. A small value type belongs in the header, with its data inline. For the downlink manager, yes, it is a good fit. It is created once, at start-up, so the one allocation happens before flight. Its calls are few per cycle, so the extra indirection is negligible. And its private insides (buffers, radio driver state, queue sizes) are exactly the kind of thing that changes often, so hiding them saves rebuilds across the whole tree.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::variant<A, B, C>` | holds exactly one of a fixed list of types | by value; size of the largest plus the index; no heap |
| index, `holds_alternative`, `get_if`, `get` | ask which alternative is held | `get` throws `std::bad_variant_access` on the wrong type |
| `std::visit(visitor, v)` | calls the visitor with the held alternative | visitor needs a call for every alternative |
| overloaded trick | `struct overloaded : Ts... { using Ts::operator()...; };` | glues lambdas into one visitor; C++17 also needs a deduction guide |
| exhaustiveness | a missing alternative is a compile error | an `auto` catch-all switches the check off |
| variant vs virtual | closed set vs open set | modes: variant; plug-ins from other teams: virtual |
| PIMPL | private members in an `Impl` defined in the `.cpp` | header holds `std::unique_ptr<Impl>` |
| compilation firewall | private changes rebuild one file | not every includer |
| the destructor rule | declare `~T()` in the header, define it in the `.cpp` | otherwise `unique_ptr` deletes an incomplete type |
| costs of PIMPL | heap allocation, pointer hop, no inlining | fine at start-up, wrong in a hot loop |
| ABI stability | size and layout of the class never change | why binary libraries use it |

That completes the module. You can now build a class that owns its resources, copies and moves them correctly, and says precisely what it promises — and choose between inheritance, CRTP and `std::variant` for "many kinds of thing". The next module, **The Standard Library: Containers, Algorithms, Lambdas** (`cod_cpp_04_stl`), puts these classes to work: `std::vector` and its relatives, the algorithms that run over them, and lambdas taught properly, including every capture form you glimpsed here.

::: context tagged-union The unsafe ancestor
C has a `union`: several members sharing the same bytes, only one meaningful at a time. It does not remember which one. So C programmers pair it with a tag, an enum saying which member is live, and must keep the two in step by hand. Reading the wrong member is undefined behavior. `std::variant` is that tag and union, fused, with the checking done for you.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">Mode, 16 bytes</text>
  <rect x="10" y="28" width="200" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="28" width="25" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="235" y="28" width="115" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">shared storage: 8 bytes</text>
  <text x="222" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="292" y="49" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="110" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">holds Coast{apogee_m}</text>
  <text x="222" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">index</text>
  <text x="10" y="102" font-size="11" fill="#6c7a93">all four modes share these 8 bytes</text>
</svg>
```

The exact placement of the index is up to the library; this is g++'s.
:::

::: context lambda-bridge A lambda is a class you did not have to name
When you write `[](double a, double b) { return a + b; }`, the compiler invents a class with a unique, unspeakable name, gives it an `operator()(double, double) const` with your body, and creates one object of it. Captured variables become members of that class. That is why a lambda can be passed to `std::visit` just like `Describe{}`: to the compiler they are the same kind of thing. The next module's lesson on lambdas covers capture by value, by reference, init-capture, `mutable` and generic lambdas.
:::

::: context deduction-guide Teaching the compiler to fill in the template arguments
Class template argument deduction, added in C++17, lets you write `std::pair p{1, 2.0};` and have the compiler work out `std::pair<int, double>`. It works from constructors. `overloaded` has no constructors — it is an aggregate, a plain struct built from braces — so C++17 needs the guide line to say "given these arguments, the type is `overloaded<Ts...>`". C++20 extended deduction to aggregates, so the line is no longer needed. The templates module covers deduction in depth.
:::

::: context mode-machines Flight software is full of mode machines
A launch vehicle's sequencer steps through countdown, ignition, liftoff, staging and cutoff. A spacecraft's attitude control switches between sun-pointing, target-tracking and safe mode. Each mode has its own data, entry actions and allowed transitions, and a missed case is exactly the kind of bug reviews exist to catch. Writing the modes as a closed `std::variant` lets the compiler do part of that review on every build.
:::

::: context expression-problem A trade-off with a name
In 1998 the computer scientist Philip Wadler named this the expression problem: a program has data types and operations on them, and a design makes one of "add a type" or "add an operation" easy and the other hard. Object-oriented class hierarchies favor new types; the tagged unions of functional languages, and `std::variant`, favor new operations. Clever designs can get part of both, at a cost in complexity.
:::

::: context compilation-firewall Why a header change spreads
Recall the build pipeline from the first C++ module: `#include` pastes the header's text into every file that names it, and each `.cpp` becomes its own translation unit, compiled separately. So a header's contents are part of every includer, and a build tool must recompile them all when it changes. PIMPL keeps the changeable part out of the pasted text.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">recorder.hpp</text>
  <rect x="20" y="100" width="100" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">main.cpp</text>
  <rect x="130" y="100" width="100" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">telemetry.cpp</text>
  <rect x="240" y="100" width="110" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">recorder.cpp</text>
  <line x1="150" y1="40" x2="70" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="40" x2="295" y2="98" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="146" font-size="11" text-anchor="middle" fill="#b4232c">Impl lives only here</text>
  <text x="125" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">recompile only if the header changes</text>
</svg>
```
:::

::: context incomplete-type Knowing a name but not a size
A type is incomplete when the compiler has seen its name but not its definition. With an incomplete type you may declare pointers and references to it, and declare functions that take or return it. You may not create an object of it, take its `sizeof`, access its members, or `delete` it — each of those needs the full layout. `std::default_delete` turns the last one into a hard error on purpose, because deleting an incomplete class type would silently skip a non-trivial destructor.
:::

::: context abi-stability Why a size change breaks compiled code
When `main.cpp` is compiled, the size of `Recorder` and the offset of each member are baked into its machine code: how much stack space to reserve, where to find each field. If a library later ships a `Recorder` with one more private member, old compiled callers still reserve the old size and read the old offsets, and memory is silently corrupted. That is an ABI break. With PIMPL, the only thing callers ever see is one pointer, so the library's insides can change without breaking them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">what callers see: Recorder, 8 bytes</text>
  <rect x="10" y="24" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="44" font-size="12" text-anchor="middle" fill="#1f2a44">impl_</text>
  <line x1="90" y1="39" x2="170" y2="39" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="178,39 168,33 168,45" fill="#1f2a44"/>
  <text x="180" y="16" font-size="12" fill="#1f2a44">Impl on the heap: free to grow</text>
  <rect x="180" y="24" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="24" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">times</text>
  <text x="300" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">alts</text>
  <rect x="180" y="62" width="80" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="220" y="82" font-size="11" text-anchor="middle" fill="#b4232c">max_alt_m</text>
  <text x="10" y="116" font-size="11" fill="#6c7a93">new members change Impl, not the 8 bytes callers see</text>
</svg>
```
:::

::: context qt-d-pointer PIMPL in a large real library
Qt, the cross-platform application framework, uses this idiom in almost every public class and calls it the d-pointer: each class holds a pointer, conventionally named `d`, to a private data class. Qt ships as compiled shared libraries and promises binary compatibility within a major version, so programs built against an earlier release keep running with a later one without recompiling. That promise depends on public class layouts never changing, and the d-pointer is how Qt keeps it.
:::
