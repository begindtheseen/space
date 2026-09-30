---
id: l01-constructors
title: Constructors, and the explicit keyword
minutes: 20
covers:
  - Constructors: default, parameterized, delegating, converting, explicit
---

Think about checking in at a hotel. Before you get a key, the person at the desk fills in a card: your name, your room, the night you leave. You never walk around the hotel as a half-registered guest with a blank room number. The check-in desk is the one door into being a guest, and it makes sure every field is filled.

A C++ object gets the same treatment from its **constructor** — a special function that runs automatically at the moment the object is created, and whose job is to put the object into a sensible starting state. Nothing can use the object before its constructor has finished.

The last module ended on two ideas. Lesson 13 split types into [[values|value-bridge]] (a state vector, a quaternion — copy one and you get an independent twin) and identities (an IMU driver — there is only one). Lesson 14 showed smart pointers that destroy what they own at exactly the right moment. Both quietly relied on objects that begin and end their lives cleanly. This module is about that lifecycle: how an object is born, how it dies, how it is copied and moved. This first lesson is about birth. We will build one small class, a `Vector3` — three numbers `x`, `y`, `z` in meters, the kind of thing that holds a position, a velocity or a thrust command in flight software — and give it every kind of constructor C++ has.

## What a constructor is

Here is a `Vector3` with one constructor.

```cpp
class Vector3 {
public:
    Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}
private:
    double x_;
    double y_;
    double z_;
};
```

Three things make `Vector3(double x, double y, double z)` a constructor rather than an ordinary member function:

- Its name is the class's own name.
- It has **no return type** — not even `void`. It does not return anything; it sets up the object it is running inside.
- You never call it by name. The compiler calls it for you whenever a `Vector3` is created: `Vector3 p{1.0, 2.0, 3.0};`.

The part after the colon, `: x_(x), y_(y), z_(z)`, is the **member initializer list** — the list of starting values for the members. Read `x_(x)` aloud as "x-underscore is initialized from x". The trailing underscore is a naming habit that marks a private member, so it cannot be confused with the parameter `x`. The empty braces `{}` at the end are the constructor's **body**, which runs after every member has its value. The list has rules of its own that surprise people, and the next lesson is about exactly those. For now, read it as "fill in the card".

Why bother? Because a class usually has a promise it wants to keep for its whole life — a **[[class invariant|class-invariant]]**, a rule about its members that is always true from the outside. A `Vector3` has an easy one: all three numbers are real values, never leftover garbage. A `UnitQuaternion` would promise its length is 1. A `RingBuffer` would promise its head index is inside the buffer. The constructor is where the invariant is first made true, and because it is the only way in, no object ever exists without it.

## The default constructor

A **default constructor** is one you can call with no arguments. It runs when you write `Vector3 v;` or `Vector3 v{};`.

Here is the first rule that surprises people. If your class declares *no constructors at all*, the compiler writes a default constructor for you. But the one it writes does not choose values for `double` or `int` members. It leaves them **uninitialised** — holding whatever bytes happened to be in that memory before, the [[garbage from a previous call|garbage-bytes]]. Reading such a value is undefined behavior, one of the five memory bugs from the last module.

```cpp
struct RawVector { double x, y, z; };   // no constructor written

RawVector a;     // a.x, a.y, a.z: indeterminate garbage (for a local variable)
RawVector b{};   // empty braces: every member set to zero
```

The empty braces ask for **value-initialization**, which zero-fills members when there is no constructor you wrote. That is why `{}` is a good habit.

The second rule: as soon as you declare *any* constructor yourself, the compiler stops writing the default one. Our `Vector3` above has only the three-number constructor, so `Vector3 v;` no longer compiles. g++ 13 says:

```text
error: no matching function for call to 'Vector3::Vector3()'
note: candidate: 'Vector3::Vector3(double, double, double)'
note:   candidate expects 3 arguments, 0 provided
```

That is often exactly what you want: a thruster command with no numbers in it should not be possible. If a zero vector is a sensible default, you write the default constructor yourself — and the neatest way is the delegating form below. (Lesson 06 shows a third option, `= default`, which asks the compiler to write it anyway.)

::: warning Empty parentheses declare a function
`Vector3 v();` looks like "make `v` with no arguments", but C++ reads it as a *function declaration*: a function named `v` that takes nothing and returns a `Vector3`. g++ warns `empty parentheses were disambiguated as a function declaration [-Wvexing-parse]`, and the first use of `v.x()` fails to compile. Write `Vector3 v;` or `Vector3 v{};` instead.
:::

## Parameterized constructors, and more than one

A constructor that takes arguments is a **parameterized constructor**. Ours takes three. A class may have several constructors, as long as their parameter lists differ — this is the function **overloading** you met in the basics module, and the compiler picks one by matching the arguments you pass.

You can pass the arguments in round brackets or curly braces:

```cpp
Vector3 p(1.5, -2.0, 400.0);   // parentheses
Vector3 q{1.5, -2.0, 400.0};   // braces: the modern default
```

Both call the same constructor. The braces have one advantage: they forbid a **[[narrowing conversion|narrowing]]** — a conversion that can lose information, such as a `double` squeezed into an `int`, or a `long long` too large for a `double` to hold exactly. The standard says a narrowing conversion inside braces makes the program ill-formed. clang stops with an error. g++ 13 also stops with an error when the value is a constant that does not fit, such as `int n{2.5};`, but when the value is a variable, as in `int n{d};` with `double d`, it only prints a `-Wnarrowing` warning, which teams usually promote to an error with `-Werror`.

## Delegating constructors

A **delegating constructor** hands the work to another constructor of the same class. You write the other constructor's name in the initializer list, where members would normally go:

```cpp
Vector3() : Vector3(0.0, 0.0, 0.0) {}
```

Read it as "the default constructor delegates to the three-number constructor with zeros". The rules are short:

1. The **target** constructor (the one delegated to) runs completely first — its list and its body.
2. Then the delegating constructor's own body runs.
3. The delegation must be the *only* thing in the list. You cannot delegate and also initialize a member; g++ says `mem-initializer for 'Vector3::z_' follows constructor delegation`.
4. Constructors must not delegate in a circle (A to B to A). That is an error the compiler is not required to catch.

The point is to keep one copy of the setup logic. If the three-number constructor later gains a check — say, rejecting a NaN, the "not a number" value a failed calculation produces — every delegating constructor gets the check for free.

::: example Watching the delegation happen
This program puts a `printf` in each constructor body so you can see which one runs, and in what order.

```cpp
#include <cstdio>

class Vector3 {
public:
    Vector3(double x, double y, double z)          // parameterised
        : x_(x), y_(y), z_(z) {
        std::printf("  (x, y, z) constructor ran\n");
    }
    Vector3() : Vector3(0.0, 0.0, 0.0) {           // delegating
        std::printf("  default constructor body ran\n");
    }
    void print(const char* name) const {
        std::printf("%s = (%g, %g, %g) m\n", name, x_, y_, z_);
    }
private:
    double x_;
    double y_;
    double z_;
};

int main() {
    std::printf("making a:\n");
    Vector3 a{1.5, -2.0, 400.0};
    std::printf("making b:\n");
    Vector3 b;
    a.print("a");
    b.print("b");
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
making a:
  (x, y, z) constructor ran
making b:
  (x, y, z) constructor ran
  default constructor body ran
a = (1.5, -2, 400) m
b = (0, 0, 0) m
```

Step by step. Making `a` passes three numbers, so overloading picks the three-number constructor, and one line prints. Making `b` passes nothing, so the default constructor is chosen. Its list says "delegate", so the three-number constructor runs *first*, with zeros, and prints its line. Only then does the default constructor's own body print. That is the [[order of the two bodies|delegation-timeline]]: target first, delegator second.

Sanity check: `b` printed as `(0, 0, 0)`, not garbage, so the zeros really did arrive through the delegation — the default constructor never touched `x_` itself.
:::

::: note When does the object's life begin?
An object's lifetime begins when its constructor finishes. With delegation there are two constructors, so which one counts? The standard's answer: the object is [[considered fully built|lifetime-begins]] once the *target* constructor completes. So if the delegating constructor's body then throws an exception, the object's destructor *does* run, because there is a finished object to clean up. If the target itself throws, there is no finished object, and the destructor does not run. Lesson 03 covers destructors and exceptions properly; this is the one place the two meet in this lesson.
:::

## Converting constructors

Now a harmless-looking addition. It would be handy to make a vector with all three parts equal, so we add a one-argument constructor:

```cpp
Vector3(double s) : Vector3(s, s, s) {}
```

Any constructor that can be called with a single argument, and is not marked `explicit`, is a **converting constructor**. It does two jobs. It builds a `Vector3` when you ask for one, and it also teaches the compiler a silent conversion: *a `double` can become a `Vector3` whenever one is needed*. The compiler will use that conversion on its own, without asking — once per expression, at most one user-defined conversion in a row.

::: example A thrust command that compiles when it should not
```cpp
#include <cstdio>

class Vector3 {
public:
    Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}
    Vector3(double s) : Vector3(s, s, s) {}        // one argument: a converting constructor
    double x() const { return x_; }
    double y() const { return y_; }
    double z() const { return z_; }
private:
    double x_, y_, z_;
};

void command_thrust(const Vector3& f_newtons) {
    std::printf("thrust command: (%g, %g, %g) N\n",
                f_newtons.x(), f_newtons.y(), f_newtons.z());
}

int main() {
    double thrust_magnitude = 450.0;      // meant: 450 N straight up
    command_thrust(thrust_magnitude);     // compiles!
    Vector3 v = 2.5;                      // also compiles
    command_thrust(v);
}
```

Output, with no warnings at all under `-Wall -Wextra`:

```text
thrust command: (450, 450, 450) N
thrust command: (2.5, 2.5, 2.5) N
```

Walk through the first call. `command_thrust` wants a `const Vector3&`. It was handed a `double`. The compiler looks for a way to turn a `double` into a `Vector3`, finds the one-argument constructor, builds a [[hidden temporary Vector3|hidden-temporary]] holding `(450, 450, 450)`, and passes a reference to that. The programmer meant 450 N along one axis — "straight up" — and the vehicle was commanded 450 N along *all three* axes.

How big is that mistake? The commanded force has size $\sqrt{450^2 + 450^2 + 450^2} = 450\sqrt{3} \approx 779\,\mathrm{N}$, about 73 percent more than intended, and pointing about $54.7^\circ$ away from the axis that was meant — the angle whose cosine is $1/\sqrt{3}$. Sanity check: three equal parts put the vector along the diagonal of a cube, and the diagonal of a cube is the $\sqrt{3}$ times one edge that you get from Pythagoras twice.

The second line, `Vector3 v = 2.5;`, is **copy-initialization** — the `=` form — and it uses the same silent conversion.
:::

## explicit: make the conversion opt-in

The fix is one word. Put **`explicit`** in front of the constructor:

```cpp
explicit Vector3(double s) : Vector3(s, s, s) {}
```

Now the constructor still works when you *ask* for it by name, but the compiler may no longer use it on its own. Recompiling the program above, g++ 13 rejects both surprising lines:

```text
error: invalid initialization of reference of type 'const Vector3&' from expression of type 'double'
   21 |     command_thrust(thrust_magnitude);     // compiles!
error: conversion from 'double' to non-scalar type 'Vector3' requested
   22 |     Vector3 v = 2.5;                      // also compiles
```

And the deliberate forms still compile, because each one names the type:

```cpp
command_thrust(Vector3{0.0, 0.0, 450.0});   // the command that was meant
command_thrust(Vector3{2.5});               // all three equal, on purpose
Vector3 v(2.5);                             // direct initialisation: fine
```

A mistake that used to reach the vehicle is now a build failure on the programmer's desk.

::: key
Mark single-argument constructors `explicit`. Otherwise they define an **implicit conversion**, so a function expecting your type silently accepts an unrelated value. `explicit` makes the conversion opt-in and eliminates a whole class of surprising overload resolution.
:::

**Overload resolution** is the compiler's process of choosing which of several same-named functions to call. Implicit conversions widen the set of candidates it may pick from, so a converting constructor can make a call go to an overload you never meant — or make two overloads tie, so that code which compiled yesterday is ambiguous today. `explicit` keeps your type out of that contest unless someone names it.

When is a converting constructor *right*? When the conversion is exact, cheap and unsurprising — the two types are really the same idea. `std::string` can be built implicitly from `"text"`, because a string literal and a string mean the same thing. A `double` and a 3-vector are not the same idea, and neither are a `double` and a `Seconds`, or an `int` and a `ChannelId`. The [[common rule in coding standards|coding-standards]] is the key block above: `explicit` by default, and a comment explaining any exception.

::: warning It is "callable with one argument", not "has one parameter"
`Vector3(double x, double y = 0.0, double z = 0.0)` has three parameters, but with the default arguments it can be called with one, so it is a converting constructor too. Mark it `explicit` for the same reason. (A constructor with several parameters and no defaults can also be used implicitly through braces, as in `command_thrust({0.0, 0.0, 9.0})`. That is usually fine, because the braces are a visible sign that an object is being built.)
:::

## Putting the pieces together

Here is the `Vector3` this lesson built, with every constructor in its final form:

```cpp
class Vector3 {
public:
    Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}   // parameterised
    Vector3() : Vector3(0.0, 0.0, 0.0) {}                              // default, delegating
    explicit Vector3(double s) : Vector3(s, s, s) {}                   // converting, made explicit
private:
    double x_;
    double y_;
    double z_;
};
```

One place holds the setup. Every way in leaves the invariant true. And nothing becomes a `Vector3` without the programmer saying so.

## Check yourself

::: check
A class `Telemetry` declares exactly one constructor, `Telemetry(int apid)`. A teammate writes `Telemetry t;` and gets an error. Explain why, and give two different fixes.
:::

::: answer
The compiler writes a default constructor only when a class declares no constructors at all. `Telemetry` declares one, so there is no default constructor, and `Telemetry t;` has nothing to call — g++ reports "no matching function for call to 'Telemetry::Telemetry()'". Fix one: pass an argument, `Telemetry t{42};`, if every telemetry object really must have an APID (often the better answer). Fix two: add a default constructor that delegates with a sensible value, `Telemetry() : Telemetry(0) {}`. While you are there, the one-argument constructor should be `explicit Telemetry(int apid)`, so an `int` cannot silently become a `Telemetry`.
:::

::: check
In the delegation example, suppose the default constructor's body printed first and the three-number constructor's body second. What would that tell you about the rules? (It does not happen — explain why it cannot.)
:::

::: answer
It would mean the delegating constructor's body ran before the target had set up the object — so the body could see members that were not yet initialized. The rule is the reverse: the target constructor runs completely (its list, then its body), and only then does the delegating constructor's body run. That is why the real output shows "(x, y, z) constructor ran" before "default constructor body ran", and why the delegating body can safely read `x_`, `y_` and `z_`: they already hold zeros.
:::

::: check
Which of these compile when the one-argument constructor is `explicit Vector3(double s)`? (a) `Vector3 a(3.0);` (b) `Vector3 b = 3.0;` (c) `Vector3 c{3.0};` (d) `command_thrust(3.0);` (e) `command_thrust(Vector3{3.0});`
:::

::: answer
(a) compiles — direct initialization names the type, so an explicit constructor may be used. (b) does not — the `=` form is copy-initialization, which only uses non-explicit constructors; g++ says "conversion from 'double' to non-scalar type 'Vector3' requested". (c) compiles — direct-list-initialization with braces is a direct form. (d) does not — passing a `double` where a `const Vector3&` is expected would need an implicit conversion, and `explicit` forbids exactly that. (e) compiles — the call site builds the `Vector3` by name, then passes it. The pattern: any form where you write `Vector3` yourself works; any form where the compiler would have to invent it does not.
:::

::: check
A `Duration` class stores milliseconds and has `Duration(long ms)`. A function is `void set_timeout(Duration d)`. Someone calls `set_timeout(5)`, meaning five seconds. What happens, and how does `explicit` help?
:::

::: answer
Without `explicit`, `Duration(long ms)` is a converting constructor, so `5` (an `int`, promoted to `long`) silently becomes `Duration(5)` — five *milliseconds*, a thousand times shorter than intended, and the code compiles without a word. With `explicit Duration(long ms)`, the call `set_timeout(5)` is a compile error, and the caller must write `set_timeout(Duration{5000})`, which puts the unit decision in front of their eyes. (The standard library's `std::chrono::milliseconds` has an explicit constructor from a plain number for exactly this reason.)
:::

::: check
Why might a team require every constructor to put its setup in one "main" constructor and have the others delegate to it? Give a concrete example with `Vector3`.
:::

::: answer
So that the setup logic, and especially the invariant checks, exist in one place. Suppose the team later decides that a `Vector3` must never hold a NaN, and adds a check in the three-number constructor that replaces NaN with zero and raises a fault flag. Because the default constructor delegates with `(0.0, 0.0, 0.0)` and the one-argument constructor delegates with `(s, s, s)`, both pass through the check automatically. If each constructor had its own copy of the member setup, someone would add the check to one and forget the others, and a NaN could enter through the forgotten door.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Constructor | runs automatically when an object is created | same name as the class, no return type |
| Class invariant | a promise about the members, always true from outside | first made true by the constructor |
| Default constructor | callable with no arguments | written for you only if you declare no constructor; its `double`s are then uninitialised unless you write `{}` |
| Parameterized constructor | takes arguments | several may exist; overloading picks one |
| Braces `{…}` | the modern way to pass constructor arguments | forbid narrowing conversions |
| Delegating constructor | hands the work to another constructor | target runs fully first; the delegation must be alone in the list |
| Converting constructor | callable with one argument, not `explicit` | defines a silent conversion from the argument type |
| `explicit` | makes that conversion opt-in | mark single-argument constructors `explicit` by default |
| `Vector3 v();` | declares a function, not an object | write `Vector3 v;` or `Vector3 v{};` |

The next lesson opens up the member initializer list itself — why it beats assigning in the body, why `const` and reference members must go there, and the rule that bites everyone once: members are initialized in the order they are declared, not the order you list them.

::: context value-bridge Values and identities, in one line each
From the last module: a **value** is a type where two objects with the same contents are interchangeable, and a copy is an independent twin — a `Vector3`, a `State`, a `Matrix3`. An **identity** stands for one particular thing — an `ImuDriver` for the chip on bus 3 — so copying it makes no sense and its copy operations are deleted. `Vector3` in this lesson is a value, which is why it is safe to hand out copies and why a silent conversion to one is so easy to miss.
:::

::: context class-invariant Where the word "invariant" comes from
*Invariant* means "does not vary". In mathematics it names a quantity that stays the same while other things change, like the total energy of a swinging pendulum with no friction. In programming, a class invariant is a statement about an object's members that stays true between any two calls from outside: a unit quaternion has $q_w^2 + q_x^2 + q_y^2 + q_z^2 = 1$, a ring buffer's count is between zero and its capacity. Member functions may break it briefly while they work, but must restore it before they return. The constructor is where it first becomes true.
:::

::: context garbage-bytes What "uninitialised" really looks like
A local variable lives in the function's stack frame, a slice of memory that earlier function calls also used. Nobody wipes it between calls. So a `double` that is never given a value holds whatever eight bytes the previous user left there:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">stack bytes after an earlier call returned</text>
  <g font-size="11" text-anchor="middle">
    <rect x="20" y="30" width="100" height="30" fill="#f2b880" stroke="#1f2a44"/>
    <text x="70" y="50" fill="#1f2a44">old loop counter</text>
    <rect x="120" y="30" width="100" height="30" fill="#f2b880" stroke="#1f2a44"/>
    <text x="170" y="50" fill="#1f2a44">old pointer</text>
    <rect x="220" y="30" width="100" height="30" fill="#f2b880" stroke="#1f2a44"/>
    <text x="270" y="50" fill="#1f2a44">old double</text>
  </g>
  <text x="20" y="90" font-size="12" fill="#1f2a44">RawVector a;  reuses the same 24 bytes, unchanged</text>
  <g font-size="12" text-anchor="middle">
    <rect x="20" y="100" width="100" height="30" fill="#fff" stroke="#b4232c" stroke-width="2"/>
    <text x="70" y="120" fill="#b4232c">a.x = ???</text>
    <rect x="120" y="100" width="100" height="30" fill="#fff" stroke="#b4232c" stroke-width="2"/>
    <text x="170" y="120" fill="#b4232c">a.y = ???</text>
    <rect x="220" y="100" width="100" height="30" fill="#fff" stroke="#b4232c" stroke-width="2"/>
    <text x="270" y="120" fill="#b4232c">a.z = ???</text>
  </g>
</svg>
```

Reading them is undefined behavior, and the optimizer is allowed to assume it never happens — so the result may not even be the old bytes.
:::

::: context narrowing Why "narrowing"
Picture each type as a range of values it can hold. Converting from a wide range into a narrower one — `double` into `int`, `int` into `std::uint8_t` — can drop part of the value: $2.7$ becomes $2$, and $300$ becomes $44$ (because $300 - 256 = 44$). Even `long long` into `double` narrows: a `double` has 53 bits of precision, so $2^{53} + 1 = 9{,}007{,}199{,}254{,}740{,}993$ cannot be stored exactly. Brace initialization, added in C++11, was designed to refuse these silent losses, which is one reason modern style prefers braces.
:::

::: context delegation-timeline The order of events when b is made
Time runs left to right. The delegating constructor starts, hands off at once, and gets control back only after the target has finished completely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="340,120 330,115 330,125" fill="#6c7a93"/>
  <text x="300" y="140" font-size="11" fill="#6c7a93">time</text>
  <rect x="20" y="30" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">Vector3()</text>
  <rect x="80" y="70" width="80" height="26" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="120" y="87" font-size="11" text-anchor="middle" fill="#fff">list: 0, 0, 0</text>
  <rect x="160" y="70" width="80" height="26" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="200" y="87" font-size="11" text-anchor="middle" fill="#fff">target body</text>
  <rect x="240" y="30" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">delegator body</text>
  <text x="120" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">Vector3(0, 0, 0)</text>
  <line x1="240" y1="20" x2="240" y2="120" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="236" y="18" font-size="11" text-anchor="end" fill="#b4232c">object's life begins</text>
</svg>
```

The dashed line marks the moment the object counts as built: the end of the target constructor.
:::

::: context lifetime-begins Why the standard draws the line there
Destructors clean up an object that exists. Before the line, there is no finished object, so running a destructor would clean up members that may never have been set. After the line, every member has a value, so the destructor is safe to run and *must* run, or anything the target acquired — a file, a lock, a buffer — would leak. Putting the line at the end of the target constructor is the only choice that keeps both of those true. Lesson 03 turns this into the general rule for exceptions during construction.
:::

::: context hidden-temporary What the compiler quietly wrote
With a non-explicit one-argument constructor, the call on the left is compiled as if you had written the code on the right:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="120" height="40" fill="#fff" stroke="#1f2a44"/>
  <text x="70" y="53" font-size="11" text-anchor="middle" fill="#1f2a44">command_thrust(</text>
  <text x="70" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">450.0);</text>
  <line x1="135" y1="55" x2="170" y2="55" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="178,55 168,50 168,60" fill="#6c7a93"/>
  <rect x="182" y="20" width="168" height="70" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="266" y="40" font-size="11" text-anchor="middle" fill="#b4232c">Vector3 tmp(450.0);</text>
  <text x="266" y="56" font-size="11" text-anchor="middle" fill="#b4232c">// tmp = (450, 450, 450)</text>
  <text x="266" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">command_thrust(tmp);</text>
  <text x="266" y="108" font-size="11" text-anchor="middle" fill="#6c7a93">tmp is destroyed at the semicolon</text>
</svg>
```

Nothing in the source shows the red box. That invisibility is the whole problem.
:::

::: context coding-standards What real coding standards say
The C++ Core Guidelines, edited by Bjarne Stroustrup and Herb Sutter, have a rule "By default, declare single-argument constructors explicit" (rule C.46). Safety-critical standards used in aerospace and automotive software, such as MISRA C++ and AUTOSAR's C++14 guidelines, have similar rules requiring `explicit` on constructors callable with one argument of a built-in type. Static-analysis tools check these rules automatically on every commit, so an unmarked converting constructor in flight code is usually caught before a human reviewer sees it.
:::
