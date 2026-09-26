---
id: l10-lambdas
title: "Lambdas: small functions that carry what they need"
minutes: 24
covers:
  - "Lambdas: capture by value and reference, init-capture, mutable, generic lambdas"
---

You are going out for the day. You can pack your lunch and take it with you, or you can leave a note in your pocket that says "lunch is in the fridge at home". The packed lunch goes wherever you go. The note is lighter, but it only helps while the fridge still has your lunch in it. If someone eats it while you are out, the note points at an empty shelf.

A **lambda** — a small function you write right where you need it — makes exactly this choice about every outside variable it uses. It can pack a copy and carry it along, or it can carry a note that points back at the original. Both are useful. One of them is the source of a classic flight-software bug: a callback that fires later, after the thing its note points at is gone.

You have already met lambdas twice. Lesson 9 of the last module showed that any object with an `operator()` can be called like a function, and lesson 12 used a quick lambda primer to build `std::visit` visitors. The algorithm lessons of this module passed short lambdas to `std::sort` and `std::find_if`. This lesson teaches them properly.

## A class the compiler writes for you

Here is a lambda that scales a sensor reading by a gain:

```cpp
double gain = 2.0;
auto scale = [gain](double x) { return gain * x; };
double y = scale(10.0);   // 20.0
```

Read the lambda aloud as "a lambda that captures `gain`, takes a `double` `x`, and returns `gain` times `x`". It has three parts:

- `[gain]` is the **capture list** — the outside variables the lambda may use. The square brackets are what make it a lambda.
- `(double x)` is the **parameter list**, as in any function.
- `{ return gain * x; }` is the **body**.

You may add a return type with an arrow, `[gain](double x) -> double { ... }`, read "returning `double`". Without the arrow, the compiler works it out from the `return` statements, the same way `auto` does.

What does the compiler do with this? It writes a class. The class has one member per captured variable and an `operator()` that holds your body. Then it makes one object of that class, right where the lambda is written. The class is called the **closure type**, and the object is the **closure** (or closure object). The class has a name the compiler made up, one you cannot write, which is why you hold a lambda with `auto`. So the lambda above is shorthand for something very close to this:

```cpp
class ScaleByValue {
public:
    explicit ScaleByValue(double g) : gain_(g) {}
    double operator()(double x) const { return gain_ * x; }
private:
    double gain_;
};
```

This is the `LowPass` pattern from lesson 9 of the last module, written for you. Notice the `const` on `operator()`: by default, a lambda's call does not change its members. The **[[closure|closure-name]]** is an ordinary object. It has a size, it can be copied (if its members can), and it lives and dies by the ordinary lifetime rules.

::: key
A lambda expression creates a closure object of a unique, unnamed class type. Each captured variable becomes a member; the body becomes `operator()`, which is `const` unless the lambda is declared `mutable`.
:::

## Capture by value and capture by reference

Now the lunch choice. Inside the capture list, each outside variable is captured one of two ways.

- **By value**, written `[gain]`: the closure gets its own copy of `gain`, taken at the moment the lambda is created. Later changes to the outside `gain` do not reach it. This is the packed lunch.
- **By reference**, written `[&gain]` (read "capture `gain` by reference"): the closure holds a reference to the outside `gain`. Every call reads the variable as it is *right now*. This is the note that points at the fridge.

There are two shorthand **default captures**. `[=]` (read "capture everything by value") captures, by value, every local variable the body uses. `[&]` (read "capture everything by reference") captures every one the body uses by reference. You can mix a default with exceptions: `[=, &log]` copies everything except `log`, which it takes by reference; `[&, limit]` does the reverse.

Only local variables (and function parameters) are captured. A global variable, or a `static` one, is not captured at all: the body names it directly, because it lives for the whole program anyway.

::: example Value, reference and the hand-written class side by side
This program builds three callables that all multiply by `gain`, then changes `gain` and calls them again. It also prints how big each closure is.

```cpp
#include <cstdio>

// What the compiler writes for [gain](double x) { return gain * x; }
class ScaleByValue {
public:
    explicit ScaleByValue(double g) : gain_(g) {}
    double operator()(double x) const { return gain_ * x; }
private:
    double gain_;
};

int main() {
    double gain = 2.0;

    auto by_value = [gain](double x) { return gain * x; };   // copies gain now
    auto by_ref   = [&gain](double x) { return gain * x; };  // refers to gain
    ScaleByValue hand_written{gain};

    std::printf("before: %.1f %.1f %.1f\n", by_value(10.0), by_ref(10.0), hand_written(10.0));
    gain = 3.0;                                               // change the original
    std::printf("after:  %.1f %.1f %.1f\n", by_value(10.0), by_ref(10.0), hand_written(10.0));

    auto nothing = [](double x) { return x; };
    std::printf("sizes: %zu %zu %zu %zu\n",
                sizeof(nothing), sizeof(by_value), sizeof(by_ref), sizeof(hand_written));
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
before: 20.0 20.0 20.0
after:  20.0 30.0 20.0
sizes: 1 8 8 8
```

Walk through it.

1. Before the change, all three compute $2.0 \times 10.0 = 20.0$.
2. After `gain = 3.0`, the by-value lambda still says $20.0$. It packed its copy of $2.0$ when it was created, and the outside change never reaches that copy. The hand-written class behaves identically, because it is the same thing.
3. The by-reference lambda says $3.0 \times 10.0 = 30.0$. It reads the live variable on every call.
4. The sizes tell the story of the members. A lambda with no captures has no members, but every C++ object takes at least one byte, so it is 1 byte. One captured `double` is 8 bytes. The by-reference lambda is also 8 bytes: g++ stores the reference as an address, and an address is 8 bytes on this 64-bit machine.

Sanity check: the by-value closure is exactly the size of the one `double` it copied, and it matches the hand-written class byte for byte. Nothing hidden is going on.
:::

Which should you use? Capture by value costs a copy of each captured object — trivial for a `double`, real for a big `std::vector` — but the closure is then self-contained. Capture by reference costs nothing, but ties the closure to the lifetime of every variable it refers to.

That makes the rule about *where the lambda goes*, not about the lambda itself. A lambda passed to `std::sort` or `std::find_if` is called during that one statement and then thrown away. Everything it refers to is certainly still alive, so `[&]` is fine and common there. A lambda that is *stored* — in a member, in a timer, in a queue of work for another thread — may run long after the function that made it has returned. Then every reference inside it is a note pointing at a fridge that may be empty.

::: key
By value copies at lambda creation; by reference keeps a reference that dangles if the lambda outlives the scope. Default-capture-by-reference (`[&]`) in a lambda that is stored or posted to another thread is a classic dangling bug.
:::

::: warning `[=]` inside a member function does not copy the object
In a member function, a lambda that uses a data member such as `limit_c` really uses `this->limit_c`. What gets captured is `this` — the object's address — not a copy of the object. So `[=]` looks like "copy everything", yet the closure dangles the moment the object dies. C++20 deprecated this silent capture, and g++ says so:

```
warning: implicit capture of 'this' via '[=]' is deprecated in C++20 [-Wdeprecated]
```

Write what you mean. `[this]` captures the pointer, out loud. `[*this]` (C++17) copies the whole object into the closure. `[limit = limit_c]`, from the next section, copies one member.
:::

## Init-capture: moving something in

Sometimes the thing a lambda needs is not a local variable yet, or it cannot be copied. An **init-capture** makes a brand-new member of the closure and says how to initialise it:

```cpp
auto sum = [b = std::move(buf)]() { /* use b */ };
```

Read `[b = std::move(buf)]` as "capture a new member `b`, initialised by moving from `buf`". The name on the left is the member. The expression on the right is evaluated once, when the lambda is created. It was added in C++14.

This is the tool for **move-only** objects, like the `std::unique_ptr` from the memory module. A `unique_ptr` cannot be copied, so `[buf]` will not compile. But it can be moved, and an init-capture can move it. Ownership then passes into the closure: when the closure is destroyed, its `b` member is destroyed, and the buffer is freed. That is RAII carried inside a lambda.

Init-capture has everyday uses too:

- `[n = samples.size()]` captures a number computed right now, not the whole container.
- `[limit = limit_c]` inside a member function copies one data member, instead of capturing `this`.
- `[cfg = config_ptr]` copies a `std::shared_ptr`, so the closure becomes one of the owners and the object stays alive for as long as the closure does.

One consequence: a closure holding a `unique_ptr` is itself move-only, because the compiler-written class has a move-only member. You will see in the next lesson that this matters for `std::function`.

## mutable: letting the call change its copy

A by-value capture is a member, and `operator()` is `const`. So the body may read captured values but not change them. Try it:

```cpp
int count = 0;
auto tick = [count]() { return ++count; };
```

g++ refuses:

```
error: increment of read-only variable 'count'
```

Adding the keyword **`mutable`** after the parameter list removes that `const`:

```cpp
auto tick = [count]() mutable { return ++count; };
```

Now each call changes the closure's *own copy* of `count`. The outside `count` is untouched, because by-value capture copied it once and the two are separate from then on. A `mutable` lambda is a function object with state, exactly like `LowPass` with its `y_`.

Two things to keep straight:

- `mutable` changes the *copy*. If you wanted the outside variable to change, you wanted `[&count]`, and `mutable` is not needed for that. A by-reference capture already lets the body change the original, even in a `const` call, because the closure holds a reference and the `const` applies to the closure's members, not to what they refer to.
- Copies of a `mutable` closure each carry their own state. If an algorithm copies your counting lambda — and algorithms are [[allowed to copy|copy-freely]] the callables you give them — each copy counts on its own. Do not rely on a `mutable` lambda to count across an algorithm call; capture a counter by reference for that.

## Generic lambdas: auto parameters

A **generic lambda** has `auto` in its parameter list:

```cpp
auto twice = [](auto x) { return x + x; };
twice(21);     // 42, an int
twice(1.25);   // 2.5, a double
```

Read `[](auto x)` as "a lambda taking `x` of any type". Under the hood the closure's `operator()` becomes a **[[template|generic-template]]**: the compiler writes a fresh version of the call for each argument type you use. `twice(21)` gets an `int` version; `twice(1.25)` gets a `double` version. Nothing is decided at run time, so there is no cost beyond an ordinary call.

Generic lambdas are what make the overloaded visitors of `std::visit` short, and they let one small comparison lambda work on `float` and `double` alike. C++20 adds an explicit form when you need to name the type: `[]<typename T>(T a, T b) { return a < b; }` insists that both arguments have the same type `T`. The next module, on templates, explains what "a fresh version for each type" really involves.

::: example Init-capture, mutable and generic in one program
```cpp
#include <cstdio>
#include <memory>
#include <utility>

struct Buffer {
    double samples[4] = {0.5, 1.0, 1.5, 2.0};
};

int main() {
    // 1. init-capture: move a unique_ptr into the lambda.
    auto buf = std::make_unique<Buffer>();
    auto sum = [b = std::move(buf)]() {
        double s = 0.0;
        for (double x : b->samples) s += x;
        return s;
    };
    std::printf("sum = %.1f, buf is %s\n", sum(), buf ? "still here" : "empty");

    // 2. mutable: a by-value copy the lambda may change.
    int count = 0;
    auto tick = [count]() mutable { return ++count; };
    tick(); tick();
    std::printf("tick() = %d, outer count = %d\n", tick(), count);

    // 3. generic lambda: auto parameters.
    auto twice = [](auto x) { return x + x; };
    std::printf("twice(21) = %d, twice(1.25) = %.2f\n", twice(21), twice(1.25));
}
```

It prints:

```
sum = 5.0, buf is empty
tick() = 3, outer count = 0
twice(21) = 42, twice(1.25) = 2.50
```

Step by step:

1. `sum` owns the buffer now. Its body adds $0.5 + 1.0 + 1.5 + 2.0 = 5.0$. The outside `buf` was moved from, so it is empty — a moved-from `unique_ptr` is null. Exactly one owner exists, and it is inside the closure.
2. `tick` was called twice and then once more inside the `printf`, so its private copy went $0 \to 1 \to 2 \to 3$. The outside `count` is still $0$. Two separate integers.
3. `twice(21)` used the `int` version and gave $42$; `twice(1.25)` used the `double` version and gave $2.50$.

Sanity check: if `buf` had said "still here", two things would own one buffer, which `unique_ptr` exists to prevent. "empty" is the only right answer.
:::

## The stored lambda that outlives its scope

Now the bug the opening promised. A spacecraft heater monitor arms a timer: "in a few seconds, check the heater against its limit". The limit is a local variable. The callback captures it with `[&]`, because that is shortest to type. Here is the whole thing, with a tiny `Timer` that stores one callback in a `std::function` — a box that can hold any callable, which is the next lesson's subject.

::: example A timer callback that reads a dead variable
```cpp
#include <cstdio>
#include <functional>

// A tiny timer: stores one callback and runs it when fire() is called.
class Timer {
public:
    void on_expire(std::function<void()> cb) { cb_ = std::move(cb); }
    void fire() { if (cb_) cb_(); }
private:
    std::function<void()> cb_;
};

void arm_heater_check(Timer& t) {
    double limit_c = 45.0;                       // a local: lives until this function returns
    t.on_expire([&] {                            // [&]: captures limit_c by reference
        std::printf("heater limit %.1f C\n", limit_c);
    });
}                                                // limit_c dies here

int main() {
    Timer t;
    arm_heater_check(t);
    t.fire();                                    // the lambda reads a dead variable
}
```

Follow the lifetimes.

1. `arm_heater_check` creates `limit_c` in its **[[stack frame|stack-frame]]** and hands the timer a closure holding a reference to it.
2. The function returns. Its frame is gone, and `limit_c` with it. The closure, stored inside `t`, lives on.
3. `t.fire()` calls the closure, which reads through its reference into memory that no longer belongs to `limit_c`. That is undefined behaviour: a use-after-return.

What does it print? It depends on luck. With `-O2`, this build printed `heater limit 45.0 C` — the right-looking answer, because the old bytes happened not to have been overwritten yet. With `-O0`, the same source printed `heater limit 0.0 C`. A heater check that silently compares against zero is worse than a crash.

Build it with **[[AddressSanitizer|asan-bridge]]** instead, `g++ -std=c++20 -g -O1 -fsanitize=address`, and the luck runs out, as it should (trimmed, paths shortened):

```
==4109==ERROR: AddressSanitizer: stack-use-after-return on address 0x7f7390f00020 ...
READ of size 8 at 0x7f7390f00020 thread T0
    #0 0x55a49c60d3ea in operator() dangle.cpp:16
    ...
    #5 0x55a49c60da59 in Timer::fire() dangle.cpp:8
    #6 0x55a49c60da59 in main dangle.cpp:23

Address 0x7f7390f00020 is located in stack of thread T0 at offset 32 in frame
    #0 0x55a49c60d3fa in arm_heater_check(Timer&) dangle.cpp:13

  This frame has 5 object(s):
    [32, 40) 'limit_c' (line 14) <== Memory access at offset 32 is inside this variable
```

Read it the way the memory module taught. The error class is `stack-use-after-return`. The read is 8 bytes — one `double`. It happened inside the lambda's `operator()`, called from `Timer::fire()`, called from `main`. And the address is inside `limit_c`, in the frame of `arm_heater_check`, which had already returned. Every clue points at the capture. On this g++ 13 build the check was on by default; with `ASAN_OPTIONS=detect_stack_use_after_return=0` the same binary printed `45.0` and exited cleanly, so on a toolchain where it is off, turn it on.

The fix is one character pair. Change `[&]` to `[limit_c]`. The closure now holds its own copy of $45.0$, and the ASan build prints `heater limit 45.0 C` and exits with status 0.

Sanity check: the 8-byte read equals `sizeof(double)`, and the variable named is the only one the lambda uses.
:::

The general rule for a callback that will be stored, queued or handed to another thread:

1. Capture by value whatever is small and can be copied.
2. Move in whatever the callback should own, with an init-capture.
3. If the callback must share an object that someone else also uses, init-capture a `std::shared_ptr` to it, so the closure is one of the owners and the object cannot die first.
4. Never use a bare `[&]`, and be suspicious of `[=]` in a member function, for the reason in the warning above.

Many [[flight-software coding standards|coding-standards]] turn this into a rule of their own, because the bug does not show up in a quick test.

::: warning The code that "works" is the dangerous version
The dangling capture above printed the right answer at `-O2`. Tests pass, and the bug waits for a different compiler, optimisation level or call stack that reuses those bytes. Run the tests under AddressSanitizer, and treat every `[&]` on a stored lambda as a finding to justify.
:::

## Where lambdas live in flight software

Lambdas turn up wherever a small piece of behaviour is handed to someone else:

- **Algorithm arguments**: the comparison for `std::sort` on a table of channel ids, the operation for `std::transform` on a block of samples. Used once, so `[&]` is fine.
- **Callbacks**: "when the timer expires", "when the command is acknowledged". Stored, so capture by value or by owner.
- **Tables of actions**: a ground-command dispatcher mapping each command code to its handler.

Because a lambda is an ordinary object whose type the compiler knows exactly, a call to it can be [[inlined|inlining]] like any other small function. That is why algorithms-plus-lambdas cost nothing in speed over hand-written loops.

## Check yourself

::: check
A lambda is written as `[a, &b](int x) { return a * x + b; }` with `int a = 3, b = 4;`. After it is created, the program sets `a = 10; b = 20;` and calls the lambda with `x = 2`. What does it return, and what members does its closure have?
:::

::: answer
`a` was captured by value, so the closure holds its own copy made at creation: $3$. `b` was captured by reference, so the call reads the live value: $20$. The result is $3 \times 2 + 20 = 26$. The closure has two members: an `int` copy of `a`, and a reference to `b` (which g++ stores as an address). The later `a = 10` changes only the outside variable.
:::

::: check
Why does `[count]() { return ++count; }` fail to compile, and what are the two different fixes, depending on what you intended?
:::

::: answer
A by-value capture is a member of the closure, and the closure's `operator()` is `const` by default, so the body may not change its members; g++ reports "increment of read-only variable 'count'". If you meant the lambda to keep its own private counter, add `mutable`: `[count]() mutable { return ++count; }`. Each call then changes the closure's copy and the outside `count` stays put. If you meant to change the outside `count`, capture it by reference: `[&count]() { return ++count; }`, which needs no `mutable` — but then the lambda must not outlive `count`.
:::

::: check
A telemetry task holds a `std::unique_ptr<Frame> frame`. You want to post a lambda to a sender thread that writes the frame out and then frees it. Write the capture, and say why `[frame]` and `[&frame]` are both wrong.
:::

::: answer
Use an init-capture that moves the pointer in: `[f = std::move(frame)]() { send(*f); }`. The closure now owns the frame; when the closure is destroyed after running, `f` is destroyed and the frame is freed. `[frame]` does not compile, because capturing by value copies, and a `unique_ptr` cannot be copied. `[&frame]` compiles but is a dangling bug: the closure refers to the task's local `frame`, which may be destroyed or reused before the sender thread runs the lambda.
:::

::: check
Inside a member function of `class Heater`, a lambda written `[=] { return limit_c > 40.0; }` is stored in a timer. The `Heater` is destroyed before the timer fires. Is the lambda safe? Explain what `[=]` captured.
:::

::: answer
No. Inside a member function, `limit_c` means `this->limit_c`, so `[=]` captured the pointer `this`, not a copy of `limit_c` and not a copy of the object. When the timer fires, the lambda reads through a pointer to a destroyed `Heater` — undefined behaviour, and a use-after-free if the `Heater` was on the heap. C++20 deprecates this implicit capture of `this` and g++ warns about it. Safe versions: `[limit = limit_c]` copies the one value; `[*this]` copies the whole object.
:::

::: check
`auto lt = [](auto a, auto b) { return a < b; };` is called as `lt(2, 3)` and then as `lt(2.5, 1.0)`. How many versions of the call operator does the compiler generate, and when is the type decided?
:::

::: answer
Two: one for `(int, int)` and one for `(double, double)`. A generic lambda's `operator()` is a template, and the compiler writes a version for each combination of argument types it sees, while compiling. Nothing is decided at run time, so each call costs the same as a call to an ordinary function and can be inlined. The first call returns `true` ($2 < 3$); the second returns `false` ($2.5 < 1.0$ is false).
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| lambda | a function written where it is used | `[captures](params) -> ret { body }` |
| closure type, closure | the class the compiler writes, and its one object | captures are members; body is `operator()` |
| capture by value `[x]` | the closure gets a copy | taken once, at creation |
| capture by reference `[&x]` | the closure refers to the original | dangles if the lambda outlives `x` |
| `[=]`, `[&]` | default captures | `[=]` in a member function captures `this`, not the object |
| init-capture `[y = expr]` | a new member, initialised once | `[p = std::move(ptr)]` moves ownership in |
| `mutable` | removes the `const` from `operator()` | changes the closure's own copies only |
| generic lambda `[](auto x)` | works for any argument type | `operator()` is a template |
| stored or posted lambda | runs after its creator returned | capture by value or by owner, never bare `[&]` |

The next lesson takes the timer's `std::function` apart: how one type can hold any lambda, what it costs in allocations and in calls, and when a template or a plain function pointer is the better choice.

::: context closure-name Why "closure"
The word comes from programming-language theory: a function together with the variables it "closes over", so that the function is complete on its own. In C++ it is literal. The closure is an object whose members are exactly the captured variables.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">[a, &amp;b](int x) { return a * x + b; }</text>
  <rect x="10" y="40" width="120" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">int a = 3</text>
  <rect x="130" y="40" width="120" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">address of b</text>
  <text x="130" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">closure object: one member per capture</text>
  <rect x="270" y="40" width="80" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">int b</text>
  <line x1="200" y1="74" x2="300" y2="110" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="300" y1="110" x2="310" y2="76" stroke="#b4232c" stroke-width="1.5"/>
  <text x="250" y="132" font-size="11" text-anchor="middle" fill="#b4232c">must outlive the closure</text>
</svg>
```

The name "lambda" is older still: it comes from Alonzo Church's lambda calculus of the 1930s, a mathematical notation for anonymous functions.
:::

::: context copy-freely Algorithms may copy your function object
The standard lets an algorithm copy the function objects you pass it, unless that algorithm says otherwise. `std::for_each` is the exception worth knowing: it returns its function object when done, so you can read a `mutable` lambda's final state from the return value. For anything else, state that must survive the call belongs outside the closure, reached by reference, because the copy you hold may never have been the one that ran.
:::

::: context generic-template A template in disguise
`[](auto x) { return x + x; }` produces a closure class whose call operator is written like `template <typename T> auto operator()(T x) const`. Each new argument type makes the compiler stamp out another copy of the body with `T` filled in. That is why generic lambdas are free at run time but can make a program bigger if called with many types. The next module, on templates, shows how that stamping-out works and how to limit which types are allowed.
:::

::: context stack-frame A frame is borrowed space
Each function call gets a frame on the stack for its local variables, and the frame is handed back when the function returns. The next call reuses the same bytes. A reference into a returned frame still holds the old address, but whatever sits there now belongs to someone else.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">while arming</text>
  <rect x="30" y="30" width="120" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">main: Timer t</text>
  <rect x="30" y="60" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">limit_c = 45.0</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">when fire() runs</text>
  <rect x="210" y="30" width="120" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">main: Timer t</text>
  <rect x="210" y="60" width="120" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="270" y="80" font-size="12" text-anchor="middle" fill="#b4232c">returned: reused</text>
  <line x1="270" y1="120" x2="270" y2="94" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="270,90 265,100 275,100" fill="#b4232c"/>
  <text x="270" y="136" font-size="11" text-anchor="middle" fill="#b4232c">closure's reference</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">stack grows downward in this drawing</text>
</svg>
```
:::

::: context asan-bridge The same tool as the memory module
This is AddressSanitizer from the memory module's lesson 9: the compiler adds checks around every memory access, and a runtime library keeps a "shadow" record of which bytes are alive. For use-after-return it keeps a returned frame's bytes poisoned instead of letting the next call reuse them at once, which is why that check costs more than the others. It is a test build, never a flight build: it makes the program slower and larger.
:::

::: context coding-standards What the rulebooks say
The AUTOSAR C++14 guidelines, written for automotive software and often borrowed by aerospace teams, have rules aimed squarely at this lesson. Rule A5-1-2 says variables shall not be implicitly captured in a lambda, which bans bare `[=]` and `[&]`. Rule A5-1-4 says a lambda object shall not outlive any of its reference-captured objects. Naming every capture makes a reviewer see each one and ask how long it lives.
:::

::: context inlining Why knowing the exact type matters
Inlining means the compiler pastes a called function's body into the caller instead of emitting a jump to it. That removes the call itself, and, more important, lets the optimiser treat the loop and the body as one piece of code: it can keep values in registers and process several elements per instruction. It can only inline what it can see. A lambda passed as its own type is fully visible; the same lambda behind a function pointer or a `std::function` usually is not, as the next lesson measures.
:::
