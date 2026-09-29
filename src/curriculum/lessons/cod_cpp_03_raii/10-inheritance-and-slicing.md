---
id: l10-inheritance-and-slicing
title: Inheritance, virtual functions and object slicing
minutes: 25
covers:
  - Inheritance, virtual, override, final; pure virtual and abstract classes
  - Object slicing and how to prevent it
---

Think of a wall socket. The socket does not care what you plug into it: a lamp, a phone charger, a kettle. It promises one thing — the right voltage on the right pins — and every device that fits the plug shape can use it. The kettle and the lamp do completely different jobs once they are plugged in. The socket never needs to know which one it is feeding.

Flight software has the same shape all over it. A flight computer reads many sensors: an IMU, a barometer, a GPS receiver, a star tracker. The code that samples them once per cycle would like to say "for every sensor, read it" without a long `if` chain that names each kind. And when a new sensor is added next year, nobody should have to edit that loop.

C++ gives you this with **inheritance** — building a new class on top of an existing one — and **virtual functions** — functions whose version is picked by the object's real type while the program runs. This lesson teaches both, the keywords that keep them safe (`override`, `final`, `= 0`), and the one trap that catches everyone: copying a derived object into a base-sized box, which quietly chops it in half.

## A class built on another class

You write inheritance like this:

```cpp
class Imu : public Sensor { /* ... */ };
```

Read it aloud as "class `Imu`, publicly derived from `Sensor`". `Sensor` is the **base class** — the general one. `Imu` is the **derived class** — the specific one. Every `Imu` object contains a whole `Sensor` inside it, plus whatever `Imu` adds. That inner piece is called the **[[base subobject|base-subobject]]**.

The word `public` means that everything public in `Sensor` stays public in `Imu`, so code that holds an `Imu` can call `Sensor`'s public functions on it. Almost all inheritance you write will be public. (Private inheritance exists; it means "implemented using", and composition, from the next lesson, is nearly always the clearer way to say that.)

Public inheritance makes a promise: an `Imu` **is a** `Sensor`. Anywhere the program needs a `Sensor`, an `Imu` must be able to stand in and behave sensibly. That promise is the **[[is-a test|is-a-test]]**, and it is how you decide whether inheritance fits at all. An IMU is a sensor. A thruster is not a valve, even though it has one.

Construction and destruction follow the order you learned in lessons 1 to 3. The base subobject is built first, then the derived class's members, then the derived constructor's body runs. Destruction goes in reverse: derived first, base last. The derived class passes arguments to its base in the member initializer list, as `Imu(int id, double a) : Sensor(id), accel_(a) {}`.

A third access level appears here. A **protected** member is hidden from outside code, like `private`, but visible to derived classes. You will use it below to let derived classes copy a base while forbidding everyone else.

## Virtual functions: the object decides

Here is the key idea. A pointer or reference of type `Sensor&` can refer to an `Imu`. So every expression has two types:

- the **static type** — what the code says, here `Sensor`;
- the **dynamic type** — what the object really is at run time, here `Imu`.

The [[two kinds of type|static-dynamic-type]] matter because a call can be decided by either one. For an ordinary member function, the compiler uses the static type. For a function marked `virtual` in the base, the program uses the dynamic type, while it runs. That is **dynamic dispatch**: the object, not the code that calls it, picks which version runs.

A derived class **overrides** a virtual function by declaring one with exactly the same name, parameters and `const`-ness. It marks that with the keyword `override`, written after the parameter list.

::: example One loop, three kinds of sensor
```cpp
#include <cstdio>

class Sensor {
public:
    explicit Sensor(int id) : id_(id) {}
    virtual ~Sensor() = default;

    int id() const { return id_; }                        // not virtual
    virtual const char* kind() const { return "generic sensor"; }
    virtual double read() const { return 0.0; }

private:
    int id_;
};

class Imu : public Sensor {
public:
    Imu(int id, double accel) : Sensor(id), accel_(accel) {}
    const char* kind() const override { return "IMU"; }
    double read() const override { return accel_; }

private:
    double accel_;                                        // m/s^2
};

class Barometer : public Sensor {
public:
    Barometer(int id, double pa) : Sensor(id), pa_(pa) {}
    const char* kind() const override { return "barometer"; }
    double read() const override { return pa_; }

private:
    double pa_;                                           // Pa
};

void report(const Sensor& s) {
    std::printf("sensor %d (%s) reads %.2f\n", s.id(), s.kind(), s.read());
}

int main() {
    Imu imu(1, 9.81);
    Barometer baro(2, 101325.0);
    Sensor plain(3);

    report(imu);
    report(baro);
    report(plain);

    const Sensor* list[] = {&imu, &baro, &plain};
    double sum = 0.0;
    for (const Sensor* p : list) sum += p->read();
    std::printf("sum of readings = %.2f\n", sum);
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
sensor 1 (IMU) reads 9.81
sensor 2 (barometer) reads 101325.00
sensor 3 (generic sensor) reads 0.00
sum of readings = 101334.81
```

Walk through it. `report` takes a `const Sensor&`, so inside it the static type is always `Sensor`. Yet the first call printed "IMU" and 9.81. The call `s.read()` went to `Imu::read`, because `read` is virtual and the dynamic type was `Imu`. The second call went to `Barometer::read`. The third object really is a plain `Sensor`, so it got the base versions.

`s.id()` is not virtual, and it did not need to be. Every kind of sensor stores its id the same way, in the base.

The array holds three `const Sensor*` — read "pointer to const Sensor". The loop never names a derived class, yet each `p->read()` found the right function. Sanity check: $9.81 + 101325 + 0 = 101334.81$, which matches the last line.
:::

How does a running program know which `read` to call? Each object with virtual functions carries a [[small hidden pointer|vptr-bridge]] that leads to its class's list of functions. The next lesson opens that up and measures what it costs. For now, the rule is enough.

::: key
A `virtual` member function is chosen by the object's dynamic type at run time when called through a base pointer or reference. A non-virtual one is chosen by the static type, at compile time.
:::

## `override`: let the compiler check your spelling

Overriding is fussy. The derived function must match the base one exactly — same parameters, same `const`. If it differs by one keyword, it does not override. It becomes a brand-new function that happens to share a name, and the base version keeps running. Nothing fails to compile.

::: example A missing `const`, found at run time and then at compile time
```cpp
#include <cstdio>

struct Sensor {
    virtual ~Sensor() = default;
    virtual double read() const { return 0.0; }
};

struct Imu : Sensor {
    double read() { return 9.81; }       // meant to override; const is missing
};

double sample(const Sensor& s) { return s.read(); }

int main() {
    Imu imu;
    std::printf("imu.read()   = %.2f\n", imu.read());
    std::printf("sample(imu)  = %.2f\n", sample(imu));
}
```

It compiles and prints:

```text
imu.read()   = 9.81
sample(imu)  = 0.00
```

The flight computer asks through a `Sensor&`, so it gets 0.00, not 9.81. The IMU reports zero acceleration forever. Calling `imu.read()` directly looks fine, which is exactly why a quick test misses it.

Why? The base promises `read() const` — a function callable on a const object. `Imu::read()` without `const` has a different signature, so it does not replace the base slot. `sample` holds a `const Sensor&`, and only the base's `const` version can be called on it.

g++ 13 with `-Wall` does say something, as a warning that is easy to scroll past:

```text
l10_silent.cpp:5:20: warning: 'virtual double Sensor::read() const' was hidden [-Woverloaded-virtual=]
```

Without `-Wall`, this build printed nothing at all. Now write the same mistake with `override`:

```cpp
struct Imu2 : Sensor {
    double read() override { return 9.81; }   // same mistake, but with override
};
```

```text
l10_override.cpp:11:12: error: 'double Imu2::read()' marked 'override', but does not override
```

That is a hard error on every conforming compiler, with no flag needed. Add the missing `const` and it compiles, and `sample(imu)` returns 9.81.
:::

`override` is a **[[contextual keyword|contextual-keyword]]**: it has its special meaning only in that spot after a function's parameter list. It costs nothing at run time. It adds one check at compile time.

::: key
`override` buys a compile error if the function does not actually override a base virtual. That catches a silently different signature, most often a missing `const`. It costs nothing and belongs on every overriding function.
:::

::: warning
Write exactly one of `virtual`, `override` or `final` on each function. `virtual` goes only on the base declaration that introduces the function. Writing `virtual double read() const` in the derived class compiles, but it throws away the check: if the signature drifts, you silently get a new virtual function instead of an error.
:::

## `final`: this is the last word

`final` says "no further". It works in two places.

- On a function, `double read() const final` means no class derived from this one may override `read` again.
- On a class, `class Imu final : public Sensor` means nothing may derive from `Imu` at all.

Why would you want that? First, design: some classes are complete and are not meant as a base. Second, speed. When the compiler knows the dynamic type cannot be anything more derived, it can call the function directly instead of looking it up. The next lesson measures that and finds it makes a large difference in a hot loop.

## Pure virtual functions and abstract classes

Some base classes have no sensible default. What should a generic `Sensor::read()` return? Returning 0.0 was a lie in the first example — it looked like a real reading. Better to say "every real sensor must supply this".

You write that with `= 0` after the declaration, read aloud as "equals zero" or "is pure":

```cpp
struct Sensor {
    virtual ~Sensor() = default;
    virtual double read() const = 0;      // pure virtual: no default
};
```

A **pure virtual function** is a virtual function the base class declares but does not implement for you. The [[odd `= 0` spelling|pure-syntax]] means "no implementation here; derived classes must provide one". A class with at least one pure virtual function is an **abstract class**: you cannot create an object of it. It exists only to be derived from. A derived class that overrides every pure virtual function is **concrete**, and you can create those.

Try to make a plain `Sensor` and the compiler refuses:

```text
l10_abstract.cpp:10:12: error: cannot declare variable 's' to be of abstract type 'Sensor'
l10_abstract.cpp:3:20: note:     'virtual double Sensor::read() const'
```

It even lists which pure function is still missing. An abstract class with only pure virtual functions and no data is often called an **interface**. It is the socket from the opening: a shape, with no appliance attached.

::: warning
Do not call a virtual function from a constructor or destructor and expect the derived version. While the `Sensor` part is being built, the `Imu` part does not exist yet, so the call goes to `Sensor`'s version. If that version is pure, the program [[crashes with "pure virtual method called"|ctor-dispatch]].
:::

## The virtual destructor, revisited

Lesson 3 met this rule. Now you can see why it has to hold. `delete p` where `p` is a `Sensor*` runs a destructor. If `~Sensor` is not virtual, the compiler picks it by the static type — `Sensor` — and `~Imu` never runs. Anything the `Imu` owns, such as a `std::vector` of history, is never freed. The standard calls it **undefined behavior**.

g++ warns about it under `-Wall`:

```text
l10_dtor.cpp:14:5: warning: deleting object of polymorphic class type 'Sensor' which has non-virtual destructor might cause undefined behavior [-Wdelete-non-virtual-dtor]
```

and the program printed only `~Sensor`. The `~Imu` line never appeared.

There are two correct fixes, and the [[C++ Core Guidelines|core-guidelines]] give both. Make the base destructor public and virtual, so `delete` through a base pointer works. Or make it protected and non-virtual, so `delete` through a base pointer does not compile at all.

::: key
Deleting a derived object through a base pointer with a non-virtual destructor is undefined behavior: only the base destructor runs, so derived members leak. Either make the destructor virtual, or make it protected and non-virtual to forbid that deletion.
:::

Where does this bite in flight software? Anywhere an object is deleted through a base pointer — typically a `std::unique_ptr<Sensor>` holding an `Imu`. That is one reason many flight teams avoid owning polymorphic objects through pointers at all. They create every component once at start-up, as a named object with a fixed lifetime, and hand out references. No base-pointer delete ever happens. The rule still applies; the design just never tests it. The [[F Prime framework|fprime-components]] is a real example of this style.

## Object slicing

Now the trap. Suppose a logging function takes its sensor **by value**:

```cpp
void log_by_value(Sensor s);
```

and you pass it an `Imu`. The parameter `s` is a brand-new `Sensor` object, `Sensor`-sized, made by `Sensor`'s copy constructor. That copy constructor knows about `Sensor`'s members and nothing else. It copies the base subobject out of the `Imu` and ignores the rest.

That is **object slicing**: copying a derived object into a base-typed object keeps only the base part. The derived data is gone, and so is the dynamic type — the new object really is a `Sensor`, so virtual calls on it go to `Sensor`'s versions. Nothing is wrong with dispatch. The `Imu` is simply [[no longer there|slicing-picture]].

::: example Four ways to call, three of them sliced
```cpp
void log_by_value(Sensor s) {
    std::printf("  by value:     %s reads %.2f\n", s.kind(), s.read());
}
void log_by_ref(const Sensor& s) {
    std::printf("  by reference: %s reads %.2f\n", s.kind(), s.read());
}

int main() {
    Imu imu(1, 9.81);
    std::printf("sizeof(Sensor) = %zu, sizeof(Imu) = %zu\n", sizeof(Sensor), sizeof(Imu));

    log_by_value(imu);
    log_by_ref(imu);

    Sensor copy = imu;                       // slicing in a declaration
    std::printf("  copy:         %s reads %.2f\n", copy.kind(), copy.read());

    std::vector<Sensor> bank;                // slicing into a container
    bank.push_back(imu);
    std::printf("  in vector:    %s reads %.2f\n", bank[0].kind(), bank[0].read());
}
```

With the `Sensor` and `Imu` classes from the first example (plus `#include <vector>`), the output is:

```text
sizeof(Sensor) = 16, sizeof(Imu) = 24
  by value:     generic sensor reads 0.00
  by reference: IMU reads 9.81
  copy:         generic sensor reads 0.00
  in vector:    generic sensor reads 0.00
```

The sizes tell the story first. A `Sensor` is 16 bytes: an 8-byte hidden pointer, the 4-byte `id_`, and 4 bytes of padding. An `Imu` is 24: the same 16, plus the 8-byte `accel_`. A 16-byte box cannot hold a 24-byte object. Something must be dropped, and it is `accel_`.

Only the reference kept the `Imu`. The by-value parameter, the declaration `Sensor copy = imu;` and the `std::vector<Sensor>` each built a fresh `Sensor` from the base part. Each one then honestly reported what it is: a generic sensor reading 0.00. Sanity check: the id survived in all four, because `id_` lives in the base part. Only the derived part vanished.
:::

The vector line is the one that hurts in real code. `std::vector<Sensor>` stores `Sensor` objects, all 16 bytes each, side by side. It cannot store an `Imu`. A container of mixed sensor kinds must hold pointers or references to objects that live elsewhere — `std::vector<Sensor*>`, or `std::vector<std::unique_ptr<Sensor>>` — or use a different tool altogether, which lesson 12 shows.

::: warning Slicing through assignment
Assignment slices too, and this one damages an existing object. With `Imu a(1, 9.81), b(2, 3.71);` and `Sensor& ra = a;`, the line `ra = b;` calls `Sensor::operator=`. It copies `b`'s base part into `a`'s base part and leaves `a`'s `accel_` alone. Run it and `a` comes out with `id = 2` and `accel = 9.81` — half of one IMU glued to half of another.
:::

### Preventing slicing

Three defenses, from lightest to strongest.

1. **Pass polymorphic objects by reference or pointer.** `const Sensor&` for looking, `Sensor&` for changing, `Sensor*` when "no sensor" is allowed. This fixes each call site, but it relies on everyone remembering.
2. **Make the base abstract.** A by-value `Sensor` parameter becomes a compile error, because no `Sensor` object can ever be created. The compiler says "cannot declare parameter 's' to be of abstract type 'Sensor'". That blocks copies into a `Sensor`, but not the assignment in the warning above.
3. **Make the base's copy operations protected, or delete them.** This closes every door at once.

Here is defense 3, with the copy operations `protected`:

```cpp
class Sensor {
public:
    explicit Sensor(int id) : id_(id) {}
    virtual ~Sensor() = default;
    virtual double read() const { return 0.0; }
    int id() const { return id_; }
protected:
    Sensor(const Sensor&) = default;             // only derived classes may copy
    Sensor& operator=(const Sensor&) = default;
private:
    int id_;
};
```

Outside code can no longer copy a `Sensor`, so `log_by_value(a)` fails to compile:

```text
l10_noslice2.cpp:30:17: error: 'constexpr Sensor::Sensor(const Sensor&)' is protected within this context
```

But an `Imu`'s own compiler-generated copy constructor is a member of a derived class, so it may call the protected base copy. `Imu b = a;` still compiles and copies the whole `Imu`: the run printed `b.id() = 1, b.read() = 9.81`. Whole objects copy; half objects cannot be made.

If the objects should never be copied at all — a driver that owns a hardware bus, say — write `= delete` on both instead. That is the stronger and more common choice for polymorphic bases.

::: key
Object slicing: assigning or copying a derived object into a base-typed variable copies only the base part, discarding the derived state and the dynamic type. Prevent it by passing polymorphic objects by reference or pointer, and by making base classes non-copyable (copy operations deleted, or protected).
:::

## Check yourself

::: check
A base class declares `virtual void update(double dt_s);`. A derived class declares `void update(float dt_s) override;`. What happens, and what would have happened without `override`?
:::

::: answer
With `override` it fails to compile, with an error like "marked 'override', but does not override". The parameter type differs — `float` instead of `double` — so the derived function has a different signature and cannot fill the base's slot. Without `override`, it would compile. The derived class would then have two unrelated functions named `update`. A call through a base reference, `base.update(0.01)`, would run the base version, and the derived logic would never execute in the control loop. `override` turns that silent run-time bug into a compile error.
:::

::: check
`class Star : public Tracker` where `Tracker` has one pure virtual function, `virtual Quat attitude() const = 0;`. `Star` does not define `attitude`. Can you write `Star s;`? Why or why not?
:::

::: answer
No. `Star` inherits the pure virtual `attitude` and does not override it, so `Star` still has a pure virtual function. That makes `Star` abstract too, and the compiler refuses to create one, listing `attitude` as the function still pure. Give `Star` a `Quat attitude() const override` with a body, and `Star s;` compiles. A class is concrete only when every pure virtual function along its chain of bases has been overridden.
:::

::: check
A function is declared `double mean_reading(Sensor s)`, and inside it calls the virtual `s.read()` in a loop. A colleague passes it a `Barometer` that reads 101325. The function returns 0. Explain exactly where the barometer went, and give the one-word fix to the signature.
:::

::: answer
The parameter `s` is its own object of type `Sensor`. It was made by `Sensor`'s copy constructor from the base part of the `Barometer`, so the barometer's `pa_` member was never copied. The new object's dynamic type is `Sensor`, so `s.read()` really does call `Sensor::read`, which returns 0. Dispatch worked correctly; there was simply no barometer left to dispatch to. The fix is to take a reference: `double mean_reading(const Sensor& s)`. Adding `&` (and `const`, since the function only reads) makes `s` another name for the caller's `Barometer`, and `s.read()` reaches `Barometer::read`.
:::

::: check
Why does `std::vector<Sensor>` slice, but `std::vector<std::unique_ptr<Sensor>>` does not? And what must `Sensor` have for the second one to be safe?
:::

::: answer
A `std::vector<Sensor>` stores actual `Sensor` objects, each exactly `sizeof(Sensor)` bytes, in one row of memory. Pushing an `Imu` copies it into one of those `Sensor`-sized slots, so only the base part fits. A `std::vector<std::unique_ptr<Sensor>>` stores pointers, each 8 bytes. The `Imu` itself lives on the heap at its full size, and the vector only holds its address, so nothing is copied or cut. For this to be safe, `Sensor` needs a public virtual destructor. When the `unique_ptr` is destroyed it runs `delete` on a `Sensor*`, and without a virtual destructor that is undefined behavior and `~Imu` never runs.
:::

::: check
You mark a class `final`. Name one thing this stops a programmer from doing, and one thing it lets the compiler do.
:::

::: answer
It stops anyone from deriving from the class: `class Special : public Imu` becomes a compile error if `Imu` is `final`. It lets the compiler know that an object of static type `Imu` has dynamic type exactly `Imu`, never something more derived. So a virtual call on an `Imu&` can be replaced with a direct call to `Imu`'s function, and that direct call can then be inlined. The next lesson measures how much that helps in a hot loop.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| inheritance | `class D : public B` builds `D` on top of `B` | public inheritance means "a D is a B" |
| base subobject | the whole `B` inside every `D` | built first, destroyed last |
| static and dynamic type | what the code says vs what the object is | a virtual call uses the dynamic type |
| `virtual` | the object's real type picks the function | chosen at run time through a base pointer or reference |
| `override` | "this replaces a base virtual" | compile error if it does not, e.g. a missing `const` |
| `final` | no more overriding or deriving | also lets the compiler call directly |
| pure virtual, `= 0` | declared, no default | a class with one is abstract and cannot be created |
| virtual destructor | base-pointer `delete` runs the derived destructor | otherwise undefined behavior; or make it protected and non-virtual |
| object slicing | copying a derived object into a base object | keeps the base part only; the dynamic type is lost |
| preventing slicing | references or pointers; abstract or non-copyable base | protected copy lets derived classes still copy whole objects |

Every virtual call in this lesson worked by magic: the object "knew" its type. The next lesson opens the box — the hidden pointer and the table it points at — and measures what a virtual call really costs in a hot loop, against a template trick that gets the same structure for free.

::: context base-subobject What an Imu looks like in memory
With g++ on a 64-bit Linux machine, the `Imu` from the first example is 24 bytes. The first 16 bytes are its `Sensor` part, laid out exactly as a stand-alone `Sensor` would be. The last 8 are what `Imu` adds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">Imu object, 24 bytes</text>
  <rect x="20" y="30" width="104" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="124" y="30" width="52" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="176" y="30" width="52" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="228" y="30" width="104" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="72" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">hidden ptr</text>
  <text x="150" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">id_</text>
  <text x="202" y="53" font-size="11" text-anchor="middle" fill="#6c7a93">padding</text>
  <text x="280" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">accel_</text>
  <text x="20" y="84" font-size="11" fill="#6c7a93">0</text>
  <text x="120" y="84" font-size="11" fill="#6c7a93">8</text>
  <text x="170" y="84" font-size="11" fill="#6c7a93">12</text>
  <text x="222" y="84" font-size="11" fill="#6c7a93">16</text>
  <text x="322" y="84" font-size="11" fill="#6c7a93">24</text>
  <line x1="20" y1="96" x2="228" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <text x="124" y="114" font-size="12" text-anchor="middle" fill="#1d6fd1">Sensor base subobject (16 bytes)</text>
  <text x="280" y="114" font-size="12" text-anchor="middle" fill="#1f2a44">Imu's own part</text>
</svg>
```

Because the base part sits at the front, a `Sensor*` pointing at an `Imu` holds the same address as the `Imu` itself.
:::

::: context is-a-test The substitution rule has a name
The idea that a derived object must work anywhere its base is expected is called the Liskov substitution principle, after the computer scientist Barbara Liskov, who set it out in a 1987 conference keynote. The practical test: could every piece of code written for `Sensor` receive your new class and still be correct? If a derived class has to refuse some base operation ("this sensor cannot be read"), the relationship is probably not is-a, and a member (has-a) is the better design.
:::

::: context static-dynamic-type Two types for one expression
In `const Sensor& s = imu;`, the name `s` has static type `Sensor` forever: that is what is written. The object it refers to has dynamic type `Imu`: that is what was built. The static type is known when compiling; the dynamic type may only be known when running, for example when a configuration file decides which sensor to create. Non-virtual calls, overloads and templates all follow the static type. Only virtual calls, `dynamic_cast` and `typeid` look at the dynamic type.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="36" width="120" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">const Sensor&amp; s</text>
  <text x="70" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">static type: Sensor</text>
  <line x1="130" y1="53" x2="200" y2="53" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="208,53 198,47 198,59" fill="#1f2a44"/>
  <rect x="210" y="30" width="140" height="46" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">an Imu object</text>
  <text x="280" y="92" font-size="11" text-anchor="middle" fill="#b4232c">dynamic type: Imu</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">refers to</text>
</svg>
```
:::

::: context vptr-bridge The hidden pointer, briefly
That extra 8 bytes in `sizeof(Sensor)` is the hidden pointer, usually called the vptr. It points at a table built by the compiler, one per class, that lists the addresses of that class's virtual functions. A virtual call loads the vptr, looks up the right slot, and calls whatever address is there. Lesson 11 draws the table, reads the machine code for a virtual call, and times it against a direct call.
:::

::: context contextual-keyword Why override is not a reserved word
`override` and `final` arrived in C++11. Making them fully reserved would have broken every existing program that used `final` or `override` as a variable name. So the standard calls them identifiers with special meaning: they act as keywords only in the few places the grammar expects them, after a function declarator or a class name. Elsewhere, `int final = 3;` still compiles. You should not write that, but old code may.
:::

::: context pure-syntax Why "= 0" and not a keyword
Most languages spell this with a word, such as `abstract`. Bjarne Stroustrup, who designed C++, has written that he chose the `= 0` form because at the time he saw no chance of getting a new keyword accepted. Read it as "this function's body is nothing". A pure virtual function may still be given a body elsewhere, which derived classes can call explicitly, but the class stays abstract either way.
:::

::: context ctor-dispatch Why a constructor cannot reach the derived class
Building an `Imu` happens in stages: first the `Sensor` part, then the `Imu` members. While `Sensor`'s constructor runs, the `Imu` members hold nothing yet, so calling `Imu::read` would read an uninitialised `accel_`. C++ prevents that: during the base constructor the object's dynamic type is `Sensor`, and the hidden pointer points at `Sensor`'s table. If that table's entry is pure, g++'s runtime prints "pure virtual method called" and aborts. The same holds in reverse inside destructors.
:::

::: context core-guidelines The rules, as the guidelines state them
The C++ Core Guidelines, edited by Bjarne Stroustrup and Herb Sutter, say this in several numbered rules. C.35: a base class destructor should be either public and virtual, or protected and non-virtual. C.67: a polymorphic class should suppress public copy and move, which is the slicing defense in this lesson. C.128: virtual functions should specify exactly one of `virtual`, `override` or `final`. Many flight-software coding standards cite or adapt these rules.
:::

::: context fprime-components Inheritance in a real flight framework
F Prime is NASA JPL's open-source flight software framework, flown on the Ingenuity Mars helicopter. A developer describes a component in a model file, and the autocoder generates a base class for it. That base class declares a pure virtual handler function for each input port and command. The developer's class derives from it and overrides each handler. Components are created once, at start-up, and connected to each other, so nothing is deleted through a base pointer while the software is flying.
:::

::: context slicing-picture Where the missing bytes went
Copying an `Imu` into a `Sensor` runs `Sensor`'s copy constructor, which copies the `id_` (and sets up a fresh `Sensor` hidden pointer). The `accel_` bytes have nowhere to go.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">Imu imu (24 bytes)</text>
  <rect x="20" y="26" width="96" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="116" y="26" width="96" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="212" y="26" width="96" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="68" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">ptr to Imu table</text>
  <text x="164" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">id_ = 1</text>
  <text x="260" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">accel_ = 9.81</text>
  <line x1="164" y1="58" x2="164" y2="88" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="164,96 158,86 170,86" fill="#1d6fd1"/>
  <line x1="260" y1="58" x2="260" y2="84" stroke="#b4232c" stroke-width="2"/>
  <line x1="250" y1="74" x2="270" y2="94" stroke="#b4232c" stroke-width="2"/>
  <line x1="270" y1="74" x2="250" y2="94" stroke="#b4232c" stroke-width="2"/>
  <text x="280" y="112" font-size="12" fill="#b4232c">dropped</text>
  <text x="20" y="92" font-size="12" fill="#1f2a44">Sensor copy (16 bytes)</text>
  <rect x="20" y="100" width="96" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="116" y="100" width="96" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="68" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">ptr to Sensor table</text>
  <text x="164" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">id_ = 1</text>
</svg>
```

The copy's hidden pointer is set by `Sensor`'s constructor, so it leads to `Sensor`'s functions. The dynamic type is gone along with the data.
:::
