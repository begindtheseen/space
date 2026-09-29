---
id: l02-member-initialiser-lists
title: Member initializer lists and initialization order
minutes: 19
covers:
  - Member initializer lists and the actual initialization order (declaration order, not list order)
---

Picture a factory assembly line. The stations are bolted to the floor in a fixed order: frame, then engine, then wheels, then paint. A work order arrives that says "paint it red, fit the 2-liter engine, use the steel frame". The work order can say *what* each station does. It cannot move the stations. However the order is written, the frame is built first and the paint goes on last, because that is the order of the floor.

A C++ object is built the same way. Its members are the stations, and their order on the floor is the order you **declared** them in the class. The **member initializer list** — the part of a constructor after the colon — is the work order. It says what value each member starts with. It does not change the order they are built in.

Last lesson used the list to write `Vector3`'s constructors and promised to come back to it. This lesson does that. You will see why the list is better than assigning in the constructor body, which members *must* go in it, how to give members a default right where they are declared, and the ordering rule above — which causes a real, silent bug in flight code when one member is computed from another.

## Initializing is not assigning

There are two places a constructor could give a member its value:

```cpp
class Channel {
public:
    Channel() { name_ = "IMU-A"; }         // (1) assign in the body
    Channel(int) : name_("IMU-A") {}       // (2) initialise in the list
private:
    std::string name_;
};
```

They look like the same thing. They are not. The rule is:

> Every member is fully constructed **before** the constructor body starts.

So in form (1), by the time the body runs, `name_` has already been built — as an empty string, by its default constructor — and the body then **assigns** over it. That is two operations: build empty, then overwrite. In form (2), `name_` is built once, directly from `"IMU-A"`. One operation.

In the list, `name_("IMU-A")` is read "name-underscore is initialized from the string IMU-A". Braces work too: `name_{"IMU-A"}`, with the same no-narrowing protection you saw with `Vector3`.

::: example Counting what really happens
To see the difference, give a member type that prints every time something happens to it.

```cpp
#include <cstdio>

struct Loud {                                   // prints whatever happens to it
    const char* tag;
    Loud() : tag("?") { std::printf("  default-construct\n"); }
    explicit Loud(const char* t) : tag(t) { std::printf("  construct %s\n", tag); }
    Loud& operator=(const char* t) {
        tag = t;
        std::printf("  assign %s\n", tag);
        return *this;
    }
};

struct InBody {
    Loud name;
    InBody() { name = "IMU-A"; }                // assigned in the body
};

struct InList {
    Loud name;
    InList() : name("IMU-A") {}                 // initialised in the list
};

struct Ordered {
    Loud first;                                 // declared first
    Loud second;                                // declared second
    Ordered() : second("second"), first("first") {}   // list written backwards
};

int main() {
    std::printf("InBody:\n");
    InBody a;
    std::printf("InList:\n");
    InList b;
    std::printf("Ordered:\n");
    Ordered c;
}
```

(`Loud& operator=(const char* t)` is an **assignment operator** — it says what `name = "IMU-A"` does. Lesson 04 treats assignment properly; here it only prints.)

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, the program runs and prints:

```text
InBody:
  default-construct
  assign IMU-A
InList:
  construct IMU-A
Ordered:
  construct first
  construct second
```

Read it block by block. `InBody` does **two** things to its member: the default constructor runs before the body, then the body assigns. `InList` does **one**: the member is built from `"IMU-A"` directly.

`Ordered` is the assembly line. Its list names `second` before `first`, yet `first` was built first — because `first` is declared first in the class. The list could not move the stations.

Sanity check: the compiler *knew* the list was misleading, and said so while compiling it. That warning is the next section.
:::

For a `double` the extra step costs almost nothing, but for a `std::string` or a `std::vector` it can mean an allocation thrown away. And for some members, as you will see below, assigning is not possible at all. So the rule of thumb is short: **give every member its value in the list, and use the body only for work that is not "set a member"** — checking an argument, logging, starting a device.

## Declaration order, not list order

Here is the rule in its exact form.

::: key
Members are initialized **in the order they are declared in the class**, regardless of the order written in the member initializer list. Writing them out of order earns a warning (`-Wreorder`), and it is a real bug source when one member is initialized from another.
:::

(If the class has base classes, those are built even before the first member — [[a detail for later|bases-first]].)

On its own, a list in a strange order is only confusing. It becomes a bug when one member's starting value is **computed from another member**. If the member you read is declared *later*, it has not been built yet when you read it. You are reading an uninitialised value — undefined behavior, the same garbage bytes you met last lesson.

Here is what g++ printed while compiling `Ordered` above, and it is worth learning to recognize:

```text
warning: 'Ordered::second' will be initialized after [-Wreorder]
   26 |     Loud second;                                // declared second
warning:   'Loud Ordered::first' [-Wreorder]
   25 |     Loud first;                                 // declared first
warning:   when initialized here [-Wreorder]
   27 |     Ordered() : second("second"), first("first") {}   // list written backwards
```

Read the three lines as one sentence: "`second` will be initialized after `first`, even though you wrote it first here." The **[[-Wreorder warning|wreorder]]** is part of `-Wall` for C++, so you get it for free if you compile with warnings on.

::: example A loop clock that divides by garbage
A flight computer runs its control loop at a fixed rate. This small class stores the rate in hertz and the time step in seconds, $\Delta t = 1/f$ (read "delta t equals one over f"). At $f = 1000\,\mathrm{Hz}$ the step should be $\Delta t = 0.001\,\mathrm{s}$, one millisecond.

```cpp
#include <cstdio>

class LoopClock {
public:
    explicit LoopClock(double rate_hz)
        : rate_hz_(rate_hz), dt_s_(1.0 / rate_hz_) {}
    void print() const {
        std::printf("rate = %g Hz, dt = %g s\n", rate_hz_, dt_s_);
    }
private:
    double dt_s_;      // declared first, so initialised first
    double rate_hz_;   // declared second
};

int main() {
    LoopClock control(1000.0);
    control.print();
}
```

The list *looks* fine: set the rate, then use it. But `dt_s_` is declared first, so it is built first, and `1.0 / rate_hz_` reads `rate_hz_` before it holds anything. g++ 13 warns twice — the reorder warning, and then:

```text
warning: member 'LoopClock::rate_hz_' is used uninitialized [-Wuninitialized]
    6 |         : rate_hz_(rate_hz), dt_s_(1.0 / rate_hz_) {}
```

If you ignore the warnings and run it, on one machine at both `-O0` and `-O2` it printed:

```text
rate = 1000 Hz, dt = inf s
```

The rate is right (it was set from the parameter) and the time step is **[[infinity|inf]]**. That particular run found a zero, or something extremely close to it, in the unset memory, and one divided by zero is infinity in floating point. Another compiler, another optimization level or another day could print a different wrong number, or a plausible-looking one — undefined behavior promises nothing. An integrator stepping by `inf`, or by a plausible wrong $\Delta t$, corrupts the navigation state in its first cycle.

**The fix.** Compute from the *parameter*, which is always ready, and write the list in declaration order so it reads the way it runs:

```cpp
explicit LoopClock(double rate_hz)
    : dt_s_(1.0 / rate_hz), rate_hz_(rate_hz) {}
```

Now it compiles with no warnings and prints `rate = 1000 Hz, dt = 0.001 s`. Sanity check: $1/1000 = 0.001$, one millisecond per cycle, as a 1 kHz loop should have.
:::

Three habits keep you out of this entirely:

1. **Write the list in declaration order**, always. Then the list reads the way it runs.
2. **Initialize from constructor parameters, not from other members**, whenever you can. Parameters exist before any member does.
3. **Build with warnings on, and treat them as errors** (`-Wall -Wextra -Werror`). The compiler caught both mistakes above; it only helps if someone reads what it says.

::: warning Reordering the declarations changes behavior
If a class depends on its members being built in a certain order — a `Buffer` member that must exist before a `Parser` member that is given a reference to it — then moving the declarations around (to "tidy up", or to shrink padding) silently changes the construction order. Put a comment on such members: `// must be declared before parser_`. The [[reason the language uses declaration order|why-declaration-order]] is exactly so that there is one order, fixed in one place.
:::

## Members that must be in the list

Some members cannot be given a value by assignment at all, so the list is the only place for them.

- A **`const` member** — a member marked `const` can never be assigned, so it must be initialized.
- A **reference member**, like `Bus& bus_` — read "a reference to a Bus". A reference must be [[bound to something when it is created|reference-binding]], and it can never be re-pointed afterwards. The body is too late.
- A **member whose type has no default constructor** — for example a member of type `LoopClock`, whose only constructor needs a rate. There is no way to build it "empty first", so it must be built with its argument in the list.

Here is a driver that gets it wrong, assigning in the body:

```cpp
struct Bus { int id; };

class ImuDriver {
public:
    ImuDriver(Bus& bus, int address) {
        bus_ = bus;
        address_ = address;
    }
private:
    Bus& bus_;
    const int address_;
};
```

g++ 13 refuses it with three errors:

```text
error: uninitialized reference member in 'struct Bus&' [-fpermissive]
error: uninitialized const member in 'const int' [-fpermissive]
error: assignment of read-only member 'ImuDriver::address_'
```

The first two say the members were never initialized before the body began. The third says the body then tried to assign to a `const`. Worse, `bus_ = bus;` would not re-point the reference even if it compiled — it would copy one `Bus` into whatever `bus_` referred to. The version that works puts both in the list:

```cpp
class ImuDriver {
public:
    ImuDriver(Bus& bus, int address) : bus_(bus), address_(address) {}
    void print() const { std::printf("IMU at 0x%02X on bus %d\n", address_, bus_.id); }
private:
    Bus& bus_;
    const int address_;
};
```

With `Bus spi1{1}; ImuDriver imu(spi1, 0x68); imu.print();` it prints `IMU at 0x68 on bus 1`. (`0x68` is hexadecimal for 104, a [[common address for an inertial measurement chip|i2c-address]].)

::: key
`const` members and reference members must be initialized in the member initializer list (or with a default member initializer, below). So must any member whose type has no default constructor. Assigning in the body is too late: every member is already built when the body starts.
:::

Before you reach for `const` members, know the [[price of a const member|const-member-price]]: it makes the whole object impossible to assign.

## Default member initializers

Since C++11 you can give a member a starting value right where it is declared. This is a **[[default member initializer|nsdmi]]**:

```cpp
class RateLimiter {
public:
    RateLimiter() {}                                        // every member uses its default
    explicit RateLimiter(double max_step) : max_step_(max_step) {}   // overrides one
    void print(const char* name) const {
        std::printf("%s: max_step = %g, last = %g, saturations = %d\n",
                    name, max_step_, last_, saturations_);
    }
private:
    double max_step_ = 0.5;     // default member initialisers
    double last_{0.0};
    int saturations_ = 0;
};
```

Making `RateLimiter a;` and `RateLimiter b(0.02);` and printing both gives:

```text
a: max_step = 0.5, last = 0, saturations = 0
b: max_step = 0.02, last = 0, saturations = 0
```

The rule for combining the two: **if a constructor's list mentions a member, the list wins and the default is ignored for that constructor. If the list does not mention it, the default is used.** So `b` took `max_step_` from its list (0.02) and the other two from their defaults. Either way, the member is still built at its place in the declaration order.

Two good reasons to use defaults everywhere you can:

- **No member is ever forgotten.** A class with five constructors and one new member needs one edit, not five. The alternative is a member left as garbage by the one constructor someone forgot to update.
- **The declaration tells the whole story.** A reader sees `int saturations_ = 0;` and knows its starting value without reading every constructor.

Many flight-software teams go further and require every data member of a built-in type to have a default member initializer, so an uninitialised `double` cannot exist at all.

::: warning A default member initializer still obeys declaration order
`double dt_s_ = 1.0 / rate_hz_;` declared above `double rate_hz_ = 1000.0;` has the same bug as the loop clock: `dt_s_` is built first and reads a member that does not exist yet. Defaults are built in declaration order too, interleaved with list entries.
:::

## Check yourself

::: check
A class declares `std::vector<double> samples_;` then `std::size_t capacity_;`. Its constructor is `explicit Window(std::size_t n) : capacity_(n), samples_(capacity_) {}`. What is wrong, what might happen, and what is the smallest fix?
:::

::: answer
`samples_` is declared first, so it is initialized first — before `capacity_` has a value — and `samples_(capacity_)` reads an uninitialised `std::size_t`. That is undefined behavior. In practice the vector may be built with whatever number happened to be in that memory: zero (an empty window that fails later), or some huge value (a failed allocation, `std::bad_alloc`, or gigabytes of memory). g++ warns with `-Wreorder` and usually `-Wuninitialized`. The smallest fix is to initialize from the parameter: `samples_(n), capacity_(n)` — written in declaration order so the list reads the way it runs.
:::

::: check
Why does a member of type `const double` compile when it has a default member initializer (`const double g0_ = 9.80665;`) and no mention in any constructor list?
:::

::: answer
A `const` member must be initialized, not assigned — but a default member initializer *is* an initialization. When a constructor's list does not mention `g0_`, the compiler uses the default, so `g0_` is built with 9.80665 at its place in declaration order. The rule "must be in the list" really means "must be initialized by the list or by a default member initializer". What would fail is leaving it out of both, or trying to set it in the body.
:::

::: check
Explain, in terms of the order of events, why assigning a `std::string` member in the constructor body is slower than initializing it in the list.
:::

::: answer
Every member is fully built before the body begins. With assignment in the body, the string is first built by its default constructor (empty), and then the body's assignment replaces its contents — two operations, and if the new text is long, the second one may allocate memory. With the list, the string is built once, directly from the text: one operation. The `Loud` program showed exactly this: "default-construct" then "assign" for the body version, and a single "construct" for the list version.
:::

::: check
A constructor list is written `: c_(1), a_(2), b_(a_ + 1)` and the members are declared `int a_; int b_; int c_;`. In what order are they initialized, and is the value of `b_` well defined?
:::

::: answer
They are initialized in declaration order: `a_`, then `b_`, then `c_` — the list order `c_, a_, b_` is ignored. `a_` becomes 2. Then `b_` is built from `a_ + 1`, and `a_` already holds 2, so `b_` is 3, well defined. `c_` is built last, as 1. So the code is correct, but only by luck of the declarations; `-Wreorder` still warns because the list is out of order, and rewriting the list as `: a_(2), b_(a_ + 1), c_(1)` removes both the warning and the trap for the next reader.
:::

::: check
A teammate adds a reference member `const Config& cfg_;` to a class that has two constructors, and gets an error from only one of them. What does that tell you?
:::

::: answer
A reference member must be bound when the object is built, so every constructor must bind it in its list — there is no way to give a reference a meaningful default member initializer in most designs. The constructor that compiles is the one whose list includes `cfg_(something)`. The one that errors ("uninitialized reference member") left `cfg_` out of its list. The fix is to add `cfg_(...)` to that constructor's list, or have it delegate to the one that already does.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Member initializer list | `: a_(x), b_(y)` after the constructor's parameters | builds each member directly from its value |
| Body assignment | `a_ = x;` inside `{}` | too late: the member was already built; two steps instead of one |
| Initialization order | the order members are built | declaration order in the class, never list order |
| `-Wreorder` | warning that the list is out of order | part of `-Wall`; list order does not change anything |
| Member from member | one member's value computed from another | reads garbage if the other is declared later; initialize from parameters |
| `const` and reference members | cannot be assigned | must be initialized in the list or by a default member initializer |
| No default constructor | a member type that needs arguments | must be built in the list |
| Default member initializer | `double gain_ = 1.0;` at the declaration | used when the list does not mention the member; the list wins otherwise |

The next lesson follows an object to the end of its life: the destructor, the reverse order in which members and locals are destroyed, and RAII — the idea that ties every resource a program holds to an object's lifetime so that it is released exactly once, even when an exception is thrown.

::: context bases-first Base classes come before members
Lesson 10 introduces inheritance, where one class is built on top of another, its **base class**. The full construction order is: base classes first (in the order they are listed after the class name), then members in declaration order, then the constructor body. Destruction runs the same steps backwards. The list can name a base class too, to pass it arguments, but just as with members, where you write it in the list does not change when it runs.
:::

::: context wreorder Warnings are free testing
`-Wreorder` is one of many checks g++ and clang run while compiling, each named by a `-W` flag. `-Wall` turns on a large, well-chosen set (despite the name, not literally all), and `-Wextra` adds more. `-Werror` makes every warning stop the build, so nobody can merge code that has one. Flight-software teams commonly build with a strict warning set and `-Werror`, and add static-analysis tools on top, because a warning costs nothing at run time and each one is a bug the compiler found before any test was written.
:::

::: context inf Where infinity comes from
Computers store `double`s using the IEEE 754 floating-point standard. It includes special values for results that are not ordinary numbers: dividing a positive number by zero gives $+\infty$, printed `inf`, and $0/0$ gives NaN, "not a number". Once one appears, it spreads — `inf` plus anything finite is still `inf`, and NaN compared with anything is false. That is why a single bad $\Delta t$ in the first cycle can poison every later value in an estimator, and why flight code often checks for these values explicitly with `std::isfinite`.
:::

::: context why-declaration-order Why one fixed order
A class can have several constructors, each with its own list, possibly in different orders. But it has only **one** destructor, and destruction must undo construction in exactly the reverse order, so that nothing is torn down while something built after it might still use it. If construction followed each list, the destructor would not know which order to reverse. Declaration order is the only order every constructor shares.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">declared:</text>
  <g font-size="12" text-anchor="middle">
    <rect x="90" y="6" width="70" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="125" y="22" fill="#1f2a44">first</text>
    <rect x="170" y="6" width="70" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="205" y="22" fill="#1f2a44">second</text>
    <rect x="250" y="6" width="70" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="285" y="22" fill="#1f2a44">third</text>
  </g>
  <text x="20" y="68" font-size="12" fill="#1d6fd1">built:</text>
  <line x1="90" y1="64" x2="310" y2="64" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="320,64 308,58 308,70" fill="#1d6fd1"/>
  <text x="205" y="56" font-size="11" text-anchor="middle" fill="#1d6fd1">every constructor, same order</text>
  <text x="20" y="112" font-size="12" fill="#b4232c">destroyed:</text>
  <line x1="320" y1="108" x2="100" y2="108" stroke="#b4232c" stroke-width="3"/>
  <polygon points="90,108 102,102 102,114" fill="#b4232c"/>
  <text x="205" y="130" font-size="11" text-anchor="middle" fill="#b4232c">the one destructor, reverse order</text>
</svg>
```
:::

::: context reference-binding A reference cannot be re-pointed
A reference is a second name for one object, fixed for life (the previous module's lesson on references). After `ImuDriver` binds `bus_` to `spi1`, the line `bus_ = other;` does not make `bus_` refer to `other`. It copies `other`'s contents *into* `spi1`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="50" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">bus_</text>
  <rect x="160" y="20" width="90" height="34" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="205" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">spi1: id 1</text>
  <rect x="160" y="80" width="90" height="34" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="205" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">other: id 2</text>
  <line x1="100" y1="62" x2="152" y2="42" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="158,40 146,40 150,50" fill="#1d6fd1"/>
  <text x="126" y="36" font-size="11" text-anchor="middle" fill="#1d6fd1">fixed</text>
  <line x1="255" y1="97" x2="300" y2="97" stroke="#b4232c" stroke-width="2"/>
  <line x1="300" y1="97" x2="300" y2="37" stroke="#b4232c" stroke-width="2"/>
  <line x1="300" y1="37" x2="262" y2="37" stroke="#b4232c" stroke-width="2"/>
  <polygon points="255,37 265,32 265,42" fill="#b4232c"/>
  <text x="306" y="72" font-size="11" fill="#b4232c">bus_ = other</text>
  <text x="306" y="86" font-size="11" fill="#b4232c">copies id 2</text>
  <text x="306" y="100" font-size="11" fill="#b4232c">into spi1</text>
</svg>
```

That is why the only moment to choose what a reference member refers to is the member initializer list.
:::

::: context i2c-address What an I2C address is
I2C (read "I squared C") is a simple two-wire bus that lets one processor talk to many small chips — sensors, clocks, memories. Each chip on the bus answers to a 7-bit address, a number from 0 to 127. The popular MPU-6050 inertial measurement chip answers at `0x68`, or `0x69` if one of its pins is wired high, so two of them can share a bus. Storing the address in a `const` member says "this driver talks to this one chip for its whole life".
:::

::: context const-member-price What a const member costs you
An object with a `const` member, or a reference member, cannot be assigned: `a = b;` would have to change the `const` or re-point the reference, and neither is allowed. So the compiler does not give such a class a working copy assignment, and it cannot sit in a container that needs to reassign elements, such as a `std::vector` you sort. Often the better tool is a private, non-`const` member with no setter, which is read-only from outside and still assignable. Lesson 04 covers copy assignment, and lesson 06 the exact rules for when the compiler provides it.
:::

::: context nsdmi The name people use
The standard calls `double gain_ = 1.0;` in a class a *default member initializer*. Many programmers call it an NSDMI, short for "non-static data member initializer" — "non-static" because it belongs to each object, not to the class as a whole (static members are lesson 08). They arrived in C++11. In C++11 a struct with them stopped counting as a simple aggregate that you could fill with braces; C++14 relaxed that, so `struct Gains { double kp = 1.0; double kd = 0.1; };` can still be written `Gains g{2.0, 0.3};`.
:::
