---
id: l11-vtables-and-crtp
title: How virtual calls work, what they cost, and CRTP
minutes: 25
covers:
  - vtables and the real cost of dynamic dispatch
  - Composition over inheritance; CRTP for static polymorphism
---

Picture an old office phone with a speed-dial card taped under it. Button 1 calls the front desk, button 2 calls maintenance, button 3 calls the boss. Every office in the building has the same buttons, but each office's card lists different numbers. To make a call, you do not need to know which office you are in. You look at the card, find the button's line, and dial whatever number is written there.

That is exactly how a virtual call works. Last lesson, each object seemed to "know" its own type. In fact every object with virtual functions carries a hidden pointer to its class's speed-dial card, and a virtual call is "find the card, read the line, dial". This lesson draws that card, reads the machine code a virtual call turns into, and then measures the cost in a hot loop — the kind of loop a 1 kHz flight controller runs thousands of times a second.

The measurement brings a surprise. The lookup itself is cheap. What costs you is what the lookup prevents the compiler from doing. That leads to two ways out: building classes from parts instead of from parents, and a template pattern called CRTP that keeps the structure of inheritance while throwing away the run-time lookup.

## The vtable and the vptr

For every class that has virtual functions, the compiler builds one table in the program's read-only data. It is called the **[[vtable|vtable-name]]**, short for virtual function table: a list of addresses, one slot per virtual function, pointing at the version that class uses. `Gain` gets one vtable. `Offset` gets another. There is one per class, not one per object.

Each object then carries one hidden member, the **vptr** — "v-pointer", the address of its class's vtable. The constructor writes it. That hidden pointer is why `sizeof(Sensor)` was 16 last lesson and not 8.

A virtual call `f.apply(x)` becomes three steps:

1. load the vptr from the object;
2. load the address stored in the `apply` slot of that vtable;
3. call that address.

That third step is an **indirect call**: a call to an address read from memory, rather than to a fixed address written into the instruction.

::: example Looking inside the objects and the machine code
```cpp
#include <cstdint>
#include <cstdio>
#include <cstring>

struct PlainGain { double k; double apply(double x) const { return k * x; } };

struct Filter {
    virtual ~Filter() = default;
    virtual double apply(double x) const = 0;
};
struct Gain : Filter {
    double k;
    explicit Gain(double k) : k(k) {}
    double apply(double x) const override { return k * x; }
};
struct Offset : Filter {
    double b;
    explicit Offset(double b) : b(b) {}
    double apply(double x) const override { return x + b; }
};

std::uintptr_t first_word(const void* obj) {     // read the object's first 8 bytes
    std::uintptr_t w;
    std::memcpy(&w, obj, sizeof w);
    return w;
}

int main() {
    std::printf("sizeof(PlainGain) = %zu\n", sizeof(PlainGain));
    std::printf("sizeof(Gain)      = %zu\n", sizeof(Gain));
    Gain g1(2.0), g2(3.0);
    Offset o1(1.0);
    std::printf("g1 first word = %#lx\n", (unsigned long)first_word(&g1));
    std::printf("g2 first word = %#lx\n", (unsigned long)first_word(&g2));
    std::printf("o1 first word = %#lx\n", (unsigned long)first_word(&o1));
    const Filter* chain[] = {&g1, &o1, &g2};
    double x = 5.0;
    for (const Filter* f : chain) x = f->apply(x);
    std::printf("((5 * 2) + 1) * 3 = %.1f\n", x);
}
```

One run on a 64-bit Linux machine with g++ 13, `-std=c++20 -O2`:

```text
sizeof(PlainGain) = 8
sizeof(Gain)      = 16
g1 first word = 0x555f3eaafd28
g2 first word = 0x555f3eaafd28
o1 first word = 0x555f3eaafd50
((5 * 2) + 1) * 3 = 33.0
```

Read it line by line.

- `PlainGain` has one `double` and no virtual functions: 8 bytes. `Gain` has the same `double` plus the vptr: 16 bytes. That extra pointer is the per-object cost.
- `g1` and `g2` start with the same 8 bytes. Both are `Gain`s, so both point at `Gain`'s one vtable. Their `k` values differ; their vptrs do not.
- `o1` starts with a different address. It is an `Offset`, with its own vtable.
- The chain applied gain 2, offset 1, gain 3: $(5 \times 2 + 1) \times 3 = 33$. Each call found the right function through the pointer.

The exact addresses change on every run, because Linux loads programs at a random base address. The pattern stays: same class, same vptr. The two vtables sit $0\mathrm{x}50 - 0\mathrm{x}28 = 40$ bytes apart. The symbol table (`nm -S`) confirms each vtable is 40 bytes long — five 8-byte entries under the **[[Itanium C++ ABI|itanium-abi]]** rules g++ follows: two bookkeeping entries, two destructor slots, and `apply`. The vptr points just past the bookkeeping, at the first function slot. You can see [[the whole layout drawn out|vtable-picture]] in the note.

Now the call itself. This function makes one virtual call:

```cpp
double run_once(const Filter& f, double x) { return f.apply(x); }
```

`g++ -O2 -S -masm=intel` turns it into:

```text
_Z8run_onceRK6Filterd:
	endbr64
	mov	rax, QWORD PTR [rdi]
	jmp	[QWORD PTR 16[rax]]
```

`rdi` holds the address of `f`. The first `mov` loads the vptr into `rax` — step 1. The `jmp` reads the address 16 bytes into the vtable and jumps there — steps 2 and 3 in one instruction. (It is a `jmp`, not a `call`, because the call is the last thing the function does.) Slot 16 is the third 8-byte slot, after the two destructors. That is the whole mechanism: two loads and a jump.
:::

## What a virtual call really costs

There are three costs, and they are very different sizes.

**One pointer per object.** Eight bytes on a 64-bit machine, plus any padding it causes. For a few dozen sensor objects, nothing. For a million small particles in a simulation, 8 MB of vptrs, and fewer objects per **[[cache line|cache-line]]**.

**An indirect call per invocation.** Modern processors guess where a jump will go before they know, using a **[[branch predictor|branch-predictor]]**. When one loop calls the same class's function every time, the guess is right nearly every time and the indirect call costs about as much as a direct one. When the objects in a list are mixed kinds in random order, the guess is often wrong, and each wrong guess throws away work the processor had started.

**It usually blocks inlining.** This is the big one. **Inlining** means the compiler pastes a function's body into the caller instead of calling it. A call to `k * x` becomes one multiply, right there in the loop. Once the body is in the loop, the compiler can keep `k` in a register, remove the call's setup and cleanup, and even process several elements with one instruction. For an [[inlined function|inlining]], the call disappears entirely. The compiler cannot paste in a body when it does not know, while compiling, which body will run. A virtual call through a `Filter&` is exactly that case.

::: key
A vtable costs one pointer per object plus an indirect call per virtual invocation, which usually blocks inlining and may mispredict. That is often fine, and unacceptable in a tight inner loop — which is why CRTP or `std::variant` appear in hot flight-code paths.
:::

## Measuring it in a hot loop

Numbers beat opinions. The program below runs the same loop — `out[i] = f.apply(in[i])` over 1,000 samples — four ways, ten million calls per trial, and keeps the best of seven trials. The four versions differ only in the type of `f`.

- **virtual, type unknown**: `f` is a `const Filter&`, and which filter it is gets decided from the command-line argument count. The compiler cannot know it.
- **CRTP**: a template version, explained at the end of this lesson. The call is resolved while compiling.
- **virtual, final class**: still a virtual function, but called on a `final` class.
- **direct, not inlined**: an ordinary member function, with inlining forbidden by `__attribute__((noinline))`, a g++ extension. This one separates "indirect call" from "not inlined".

Every loop function is also marked `noinline`, so the compiler cannot merge it into `main` and discover which filter it has.

::: example Virtual against CRTP, ten million calls
```cpp
#include <chrono>
#include <cstdio>

// ---- dynamic polymorphism: virtual functions --------------------------
struct Filter {
    virtual ~Filter() = default;
    virtual double apply(double x) const = 0;
};
struct Gain : Filter {
    double k;
    explicit Gain(double k) : k(k) {}
    double apply(double x) const override { return k * x; }
};
struct Offset : Filter {
    double b;
    explicit Offset(double b) : b(b) {}
    double apply(double x) const override { return x + b; }
};
struct GainF final : Filter {                  // final: nothing derives from it
    double k;
    explicit GainF(double k) : k(k) {}
    double apply(double x) const override { return k * x; }
};

// ---- static polymorphism: CRTP ----------------------------------------
template <typename Derived>
struct FilterBase {
    double apply(double x) const {
        return static_cast<const Derived&>(*this).apply_impl(x);
    }
};
struct GainC : FilterBase<GainC> {
    double k;
    explicit GainC(double k) : k(k) {}
    double apply_impl(double x) const { return k * x; }
};

// ---- a direct call that the compiler is forbidden to inline -----------
struct GainN {
    double k;
    __attribute__((noinline)) double apply(double x) const { return k * x; }
};

// ---- the four hot loops: identical bodies, different filter types ----
__attribute__((noinline))
void run_virtual(const Filter& f, const double* in, double* out, int n) {
    for (int i = 0; i < n; ++i) out[i] = f.apply(in[i]);
}
template <typename D>
__attribute__((noinline))
void run_crtp(const FilterBase<D>& f, const double* in, double* out, int n) {
    for (int i = 0; i < n; ++i) out[i] = f.apply(in[i]);
}
__attribute__((noinline))
void run_final(const GainF& f, const double* in, double* out, int n) {
    for (int i = 0; i < n; ++i) out[i] = f.apply(in[i]);
}
__attribute__((noinline))
void run_noinline(const GainN& f, const double* in, double* out, int n) {
    for (int i = 0; i < n; ++i) out[i] = f.apply(in[i]);
}

constexpr int N = 1000, REPS = 10000;          // 10 million calls per trial
double in[N], out[N];

const Filter* chosen = nullptr;                // decided at run time, in main
GainC gain_c(1.5);
GainF gain_f(1.5);
GainN gain_n{1.5};

void loop_virtual()  { run_virtual(*chosen, in, out, N); }
void loop_crtp()     { run_crtp(gain_c, in, out, N); }
void loop_final()    { run_final(gain_f, in, out, N); }
void loop_noinline() { run_noinline(gain_n, in, out, N); }

// Best of 7 trials, in nanoseconds per call.
double time_it(void (*loop)()) {
    double best = 1e30;
    for (int trial = 0; trial < 7; ++trial) {
        auto t0 = std::chrono::steady_clock::now();
        for (int r = 0; r < REPS; ++r) loop();
        auto t1 = std::chrono::steady_clock::now();
        double ns = std::chrono::duration<double, std::nano>(t1 - t0).count();
        if (ns < best) best = ns;
    }
    return best / (double(N) * REPS);
}

int main(int argc, char**) {
    for (int i = 0; i < N; ++i) in[i] = 0.001 * i;
    static Gain gain(1.5);
    static Offset offset(0.25);
    chosen = (argc > 5) ? static_cast<const Filter*>(&offset) : &gain;   // unknowable

    double v = time_it(loop_virtual);  double last_v = out[N - 1];
    double c = time_it(loop_crtp);     double last_c = out[N - 1];
    double f = time_it(loop_final);    double last_f = out[N - 1];
    double d = time_it(loop_noinline); double last_d = out[N - 1];

    std::printf("virtual, type unknown  %.2f ns/call  (last output %.4f)\n", v, last_v);
    std::printf("CRTP                   %.2f ns/call  (last output %.4f)\n", c, last_c);
    std::printf("virtual, final class   %.2f ns/call  (last output %.4f)\n", f, last_f);
    std::printf("direct, not inlined    %.2f ns/call  (last output %.4f)\n", d, last_d);
}
```

`time_it` takes `void (*loop)()`, read "a pointer to a function taking nothing and returning nothing", so one timing routine can run all four loops. `std::chrono::steady_clock` is a clock that never jumps, which makes it the right one for measuring intervals.

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run on one machine (a 2.1 GHz Intel Xeon cloud server, 4 cores):

```text
virtual, type unknown  1.78 ns/call  (last output 1.4985)
CRTP                   0.37 ns/call  (last output 1.4985)
virtual, final class   0.37 ns/call  (last output 1.4985)
direct, not inlined    1.42 ns/call  (last output 1.4985)
```

Five runs in a row agreed to within 0.03 ns. An earlier build of a slightly different version gave 1.3 to 1.8 ns for the virtual loop, so treat these as "on one machine, about". Your numbers will differ. The pattern is what to take away.

First, the sanity check. All four print the same last output: $1.5 \times 0.999 = 1.4985$. They did the same work, so comparing their times is fair.

Now read the pattern.

- The virtual loop costs about 1.8 ns per call. CRTP costs about 0.37 ns. That is $1.78 / 0.37 \approx 4.8$ times faster.
- Look at the direct call that was not inlined: 1.42 ns. It has no vtable and no indirect jump, yet it is almost as slow as the virtual one.
- So split the gap. The indirect call itself — virtual minus direct-not-inlined — is about $1.78 - 1.42 = 0.36$ ns. Losing inlining — direct-not-inlined minus CRTP — is about $1.42 - 0.37 = 1.05$ ns. Most of the cost is the missing inlining, not the lookup.

The generated code shows why. The CRTP loop compiled to one load, one multiply and one store per element, with no call at all. The virtual loop has to save registers, load the vptr, jump out, run a separate function, and come back, every element.

Then build the same program with `-O3`, which turns on more aggressive **[[vectorisation|vectorisation]]**. On the same machine, CRTP and the `final` loop both dropped to about 0.19 ns per call — the compiler now multiplies two samples with one instruction. The virtual loop stayed at about 1.75 ns. The gap grew from about 5 times to about 9 times. The virtual call did not get slower; the inlined code got faster, because inlining let further optimisation in.
:::

Notice the third line. The `final` loop still calls a function declared `virtual`, and it ran exactly as fast as CRTP. Because `GainF` is `final`, the compiler knows a `const GainF&` refers to exactly a `GainF`. It replaces the virtual call with a direct call and inlines it. This is **[[devirtualisation|devirtualisation]]**: turning a virtual call into a direct one when the compiler can prove the target.

That is the honest caveat on every virtual-versus-CRTP benchmark. Compilers devirtualise whenever they can prove the type: a `final` class, a local object whose type is visible, or a whole program compiled together with link-time optimisation. If a benchmark accidentally lets the compiler see the type, the gap vanishes, and it looks as if virtual calls are free. That is why this benchmark picks the filter from `argc` and stops the loops from being inlined into `main`.

::: warning
Measure before you rewrite. A virtual call in code that runs 50 times a second costs nanoseconds out of a 20 ms budget, and replacing it gains nothing you could ever see. The cost matters in an inner loop over thousands of elements per cycle, such as filtering every sample of a sensor stream or updating every cell of a grid. Profile first; then change the loop that the profile points at.
:::

## Composition over inheritance

Before reaching for a faster kind of inheritance, ask whether inheritance is the right tool at all.

A rocket's reaction-control thruster has a valve and a heater. It is not a valve. If `Thruster` inherited from `Valve`, every public `Valve` function — `open()`, `close()` — would become part of `Thruster`'s public face. Any code could open the valve without going through the thruster's own safety logic. And any change to `Valve` would ripple into every class built on it.

**Composition** means building a class from member objects — "has a" — instead of from a base class — "is a". The thruster holds a `Valve` and a `Heater` as members and decides for itself what to expose:

```cpp
class Thruster {
public:
    void fire()  { heater_.set_power_w(0.0); valve_.open(); }
    void stop()  { valve_.close(); }
    bool firing() const { return valve_.is_open(); }
private:
    Valve  valve_;
    Heater heater_;
};
```

With simple `Valve` and `Heater` classes, calling `fire()` then `stop()` printed `firing: 1` and then `firing: 0`. Composition has no vptr, no virtual calls and nothing to slice. Each member's constructor and destructor run in the usual order, so RAII works unchanged. And the members can be swapped for others with the same functions without touching any caller.

"Prefer composition over inheritance" is one of the best-known design rules, going back to the [[1994 Design Patterns book|design-patterns]]. It does not mean "never inherit". Inheritance fits when you truly have an is-a relationship and need to treat many kinds through one interface — the sensor loop from last lesson. It is a poor way merely to reuse code.

## CRTP: the structure of inheritance, decided while compiling

Sometimes you want what inheritance gives — shared code written once in a base, with each derived class filling in one step — but you know every type while compiling and cannot afford the virtual call. The **Curiously Recurring Template Pattern**, or **[[CRTP|crtp-name]]**, does that.

The trick is in the first line of a CRTP class:

```cpp
class Thermistor : public SensorBase<Thermistor> { /* ... */ };
```

Read it aloud: "class `Thermistor`, derived from `SensorBase` of `Thermistor`". The derived class passes itself as the base's template argument. That is the "curiously recurring" part. The base can now name its derived type, so it can convert `*this` to the derived type and call the derived function directly:

```cpp
static_cast<const Derived&>(*this)
```

Read that as "treat this object as a `const Derived&`". It is safe here because the object really is a `Derived`: the only class that inherits from `SensorBase<Thermistor>` is `Thermistor`. Nothing is looked up while the program runs, so the call is an ordinary direct call, and the compiler can inline it.

::: example A calibrated-sensor base, written once
```cpp
#include <cstdio>

template <typename Derived>
class SensorBase {
public:
    // Shared logic, written once: read the raw count, then calibrate it.
    double sample() const {
        const Derived& self = static_cast<const Derived&>(*this);
        return scale_ * self.read_raw() + bias_;
    }
protected:
    SensorBase(double scale, double bias) : scale_(scale), bias_(bias) {}
private:
    double scale_, bias_;
};

class Thermistor : public SensorBase<Thermistor> {
public:
    Thermistor() : SensorBase(0.1, -40.0) {}
    int read_raw() const { return 612; }          // stand-in for a hardware read
};

class PressureTap : public SensorBase<PressureTap> {
public:
    PressureTap() : SensorBase(25.0, 0.0) {}
    int read_raw() const { return 4053; }
};

template <typename D>
void show(const char* name, const SensorBase<D>& s) {
    std::printf("%-12s %.1f\n", name, s.sample());
}

int main() {
    Thermistor t;
    PressureTap p;
    show("temperature", t);       // 0.1 * 612 - 40
    show("pressure", p);          // 25 * 4053
    std::printf("sizeof(Thermistor) = %zu\n", sizeof(Thermistor));
}
```

Output:

```text
temperature  21.2
pressure     101325.0
sizeof(Thermistor) = 16
```

Check the arithmetic. The thermistor: $0.1 \times 612 - 40 = 21.2$, a room temperature in degrees Celsius. The pressure tap: $25 \times 4053 = 101325$ pascals, sea-level air pressure. Both sensible.

The calibration formula lives once, in `SensorBase::sample`. Each sensor supplies only `read_raw`. That is the same shape as a virtual function with a pure `read_raw` in the base, but the size line shows the difference: `Thermistor` is 16 bytes — its two `double`s and nothing else. There is no vptr, because there is no virtual function anywhere.

The constructors pass `SensorBase(0.1, -40.0)` without writing `<Thermistor>`: inside a class, the base's own name can be used without its template argument. The base constructor is `protected`, so nobody can make a stray `SensorBase<Thermistor>` on its own.
:::

::: key
CRTP: a base class templated on its derived type, so calls are resolved at compile time and inlined, giving polymorphic structure with zero dispatch overhead and no vtable pointer in the object.
:::

### What CRTP gives up

CRTP is not a free replacement for virtual functions. `SensorBase<Thermistor>` and `SensorBase<PressureTap>` are two different, unrelated types. There is no common base type, so you cannot put a thermistor and a pressure tap in one array and loop over them. Every function that accepts "any sensor" must itself be a template, like `show` above. The compiler generates a separate copy of each such function per sensor type, which grows the program and the build time.

So choose by what you know, and when:

- The set of types is open, chosen at run time, or extended by other teams: virtual functions.
- Each piece of code uses one type known while compiling, and the call is in a hot loop: CRTP.
- The set of types is fixed and small, and you want them in one container: `std::variant`, next lesson.

A later module on templates returns to CRTP, along with a newer C++23 feature called [[deducing this|deducing-this]] that can replace it in some cases.

## Check yourself

::: check
A `struct Waypoint { double lat, lon, alt; };` is 24 bytes. You add one virtual function to it. What is `sizeof(Waypoint)` now on a 64-bit Linux machine, and how much extra memory does an array of 100,000 waypoints use?
:::

::: answer
The object gains one vptr of 8 bytes. Three `double`s are 24 bytes, plus 8 is 32, and 32 is already a multiple of the 8-byte alignment, so there is no extra padding: `sizeof(Waypoint)` becomes 32. An array of 100,000 grows by $100{,}000 \times 8 = 800{,}000$ bytes, about 0.8 MB, all of it copies of the same vptr. The vtable itself is shared, so it adds only a few dozen bytes once. A data record like a waypoint should not have virtual functions; this is one reason why.
:::

::: check
In the benchmark, suppose someone deleted `__attribute__((noinline))` from every loop function and the virtual loop suddenly ran as fast as CRTP. Did virtual calls become free? Explain what probably happened.
:::

::: answer
No. The compiler probably devirtualised the call. Without `noinline`, `run_virtual` could be inlined into `loop_virtual` and onwards. If the compiler could then trace `chosen` back to a single possible target, it could turn the virtual call into a direct call and inline it. (Here `chosen` depends on `argc`, which makes that harder, but a speculative check — "if the vptr is `Gain`'s, run `Gain::apply` inline, else call through the table" — is something g++ can do at `-O2`.) The benchmark would then be measuring the devirtualised case, not the cost of real dynamic dispatch. A fair benchmark must make the type genuinely unknowable, and then check the generated code to confirm the indirect call is really there.
:::

::: check
Using the measured numbers, a flight computer runs a filter over 4,000 samples each cycle at 1 kHz through a virtual `apply`. Roughly how much time per second goes to dispatch overhead compared with a CRTP version, and is it worth changing?
:::

::: answer
Per call the difference was about $1.78 - 0.37 = 1.41$ ns on the test machine. Per cycle: $4{,}000 \times 1.41 = 5{,}640$ ns, about 5.6 µs. At 1,000 cycles per second, that is about 5.6 ms of every second, or 0.56 per cent of one core. The cycle has a 1 ms budget, and 5.6 µs is 0.56 per cent of it. Whether that is worth changing depends on how close to the budget the cycle is. On a loaded flight computer, where every microsecond of worst-case time is counted, it may well be. The numbers came from one server and would need re-measuring on the real flight processor, which is usually slower.
:::

::: check
A colleague proposes `class Tank : public std::vector<double>` so that a propellant tank "gets push_back for free". What would you say?
:::

::: answer
A tank is not a vector of doubles, so this fails the is-a test. Inheriting would put every `std::vector` function — `clear()`, `resize()`, `erase()` — on the tank's public face, so any code could wipe a tank's history without going through the tank's own rules. `std::vector` also has no virtual destructor, so deleting a `Tank` through a `std::vector<double>*` would be undefined behaviour. Use composition: give `Tank` a private `std::vector<double> samples_;` member and write the few public functions the tank really needs, such as `record(double kg)` and `mass_kg()`. The tank then controls its own rules.
:::

::: check
Why can the CRTP base safely use `static_cast<const Derived&>(*this)`, when the same cast from an arbitrary `Filter&` to `Gain&` could be a disaster?
:::

::: answer
`static_cast` down a class hierarchy does no run-time check. It trusts you that the object really is of the target type. In CRTP that is guaranteed by the pattern: `SensorBase<Thermistor>` exists only as the base of `Thermistor`, so any `SensorBase<Thermistor>` object is the base part of a `Thermistor`, and its constructor is `protected` so no one can make one on its own. A general `Filter&` might refer to a `Gain`, an `Offset` or anything else derived later. A `static_cast` to `Gain&` on an `Offset` would read the `Offset`'s bytes as if they were a `Gain`'s, which is undefined behaviour. The cast is only as safe as the guarantee behind it.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| vtable | one table per class of virtual-function addresses | lives in read-only data; 40 bytes for `Gain` here |
| vptr | hidden pointer in each object to its class's vtable | 8 bytes per object on a 64-bit machine |
| virtual call | load vptr, load slot, indirect call | `mov rax, [rdi]` then `jmp [rax+16]` |
| cost of dispatch | pointer per object, indirect call, lost inlining | lost inlining is usually the biggest part |
| measured (one machine, `-O2`) | virtual 1.78, CRTP 0.37, not-inlined direct 1.42 ns/call | indirect part about 0.36 ns; lost inlining about 1.05 ns |
| devirtualisation | compiler turns a virtual call into a direct one | when it can prove the type: `final`, visible local object, LTO |
| composition | build from members, "has a" | no vptr, nothing to slice, controlled public face |
| CRTP | `class D : public Base<D>`; base calls `static_cast<const D&>(*this)` | resolved while compiling, inlined, no vptr |
| CRTP's limit | no common base type | cannot mix kinds in one container |

CRTP is fast but cannot hold a thermistor and a pressure tap in one list. The next lesson meets that head-on with `std::variant`, which stores one of a fixed list of types by value, and then shows PIMPL, a way to hide a class's insides so that changing them does not rebuild half the program.

::: context vtable-name A table of functions
"vtable" is short for "virtual function table", sometimes called a virtual method table. The C++ standard never mentions it: the standard only says which function a virtual call must reach. Tables of function pointers are simply how every major compiler meets that requirement, because they make a call cost the same small number of steps however many derived classes exist.
:::

::: context itanium-abi Why g++ and clang agree on the layout
An ABI, or application binary interface, is the set of rules for how compiled code is laid out: where members sit, how functions receive arguments, what a vtable looks like, how names are encoded. The Itanium C++ ABI was first written for Intel's Itanium processor, and it became the standard C++ ABI on Linux and most Unix-like systems on x86-64, with small variations on ARM. Because g++ and clang both follow it, object files from the two can be linked together.
:::

::: context vtable-picture The objects and tables from the example
Two `Gain` objects share one table; the `Offset` has its own. Each vptr points past two bookkeeping entries (offset-to-top and type information) to the first function slot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">objects</text>
  <rect x="10" y="24" width="50" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="60" y="24" width="50" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="35" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">vptr</text>
  <text x="85" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">k = 2</text>
  <text x="10" y="62" font-size="11" fill="#6c7a93">g1</text>
  <rect x="10" y="70" width="50" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="60" y="70" width="50" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="35" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">vptr</text>
  <text x="85" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">k = 3</text>
  <text x="10" y="108" font-size="11" fill="#6c7a93">g2</text>
  <rect x="10" y="150" width="50" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="60" y="150" width="50" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="35" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">vptr</text>
  <text x="85" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">b = 1</text>
  <text x="10" y="188" font-size="11" fill="#6c7a93">o1</text>
  <text x="200" y="16" font-size="12" fill="#1f2a44">vtable for Gain (40 bytes)</text>
  <rect x="200" y="22" width="150" height="14" fill="#ffffff" stroke="#6c7a93"/>
  <rect x="200" y="36" width="150" height="14" fill="#ffffff" stroke="#6c7a93"/>
  <rect x="200" y="50" width="150" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="200" y="64" width="150" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="200" y="78" width="150" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="275" y="33" font-size="11" text-anchor="middle" fill="#6c7a93">offset to top</text>
  <text x="275" y="47" font-size="11" text-anchor="middle" fill="#6c7a93">type info</text>
  <text x="275" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">~Gain</text>
  <text x="275" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">~Gain (deleting)</text>
  <text x="275" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">Gain::apply</text>
  <text x="200" y="120" font-size="12" fill="#1f2a44">vtable for Offset (40 bytes)</text>
  <rect x="200" y="126" width="150" height="14" fill="#ffffff" stroke="#6c7a93"/>
  <rect x="200" y="140" width="150" height="14" fill="#ffffff" stroke="#6c7a93"/>
  <rect x="200" y="154" width="150" height="14" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="200" y="168" width="150" height="14" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="200" y="182" width="150" height="14" fill="#f2b880" stroke="#1f2a44"/>
  <text x="275" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">~Offset</text>
  <text x="275" y="179" font-size="11" text-anchor="middle" fill="#1f2a44">~Offset (deleting)</text>
  <text x="275" y="193" font-size="11" text-anchor="middle" fill="#1f2a44">Offset::apply</text>
  <line x1="35" y1="36" x2="196" y2="50" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="35" y1="82" x2="196" y2="52" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="35" y1="162" x2="196" y2="154" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```

A call to `apply` reads the slot 16 bytes past where the vptr points, which is the third function slot.
:::

::: context cache-line Why object size matters for speed
The processor does not fetch single bytes from main memory. It fetches 64-byte blocks called cache lines on most current x86 and ARM chips, and keeps recent ones in small, fast caches. A loop that walks an array of 24-byte objects gets about two and a half objects per line; make them 32 bytes and it gets two. Fewer useful bytes per fetch means more fetches, and main memory is roughly a hundred times slower than the nearest cache.
:::

::: context branch-predictor Guessing where the jump goes
A modern processor works on many instructions at once, like an assembly line. At a jump whose destination is not yet known, it cannot stop the line and wait, so it guesses, using a record of where that jump went before, and carries on. A right guess costs almost nothing. A wrong one means discarding the partly done work, typically costing on the order of 15 to 20 clock cycles on current desktop and server chips. That is why an indirect call that always goes to the same place is cheap, and one that changes target at random is not.
:::

::: context inlining What the compiler gains by pasting the body in
A function call has fixed costs: saving and restoring registers, moving arguments into place, the call and return themselves. Inlining removes those. The larger gain comes after: with the body in view, the compiler can keep values in registers across iterations, drop work whose result is unused, replace a variable with a constant it knows, and process several elements at once. None of that can cross a call whose target is unknown.
:::

::: context vectorisation One instruction, several numbers
Processors have wide registers that hold several numbers side by side, and instructions that work on all of them at once. This is called SIMD, single instruction, multiple data. With 128-bit SSE registers on x86-64, one `mulpd` multiplies two `double`s at a time. That is why the inlined loop at `-O3` roughly halved its time per element.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">mulsd: one at a time</text>
  <rect x="10" y="26" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="45" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">in[0] × k</text>
  <rect x="90" y="26" width="70" height="26" fill="#ffffff" stroke="#6c7a93"/>
  <text x="125" y="43" font-size="11" text-anchor="middle" fill="#6c7a93">unused</text>
  <text x="10" y="76" font-size="12" fill="#1f2a44">mulpd: two per instruction</text>
  <rect x="10" y="84" width="70" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">in[0] × k</text>
  <rect x="90" y="84" width="70" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="125" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">in[1] × k</text>
  <text x="190" y="43" font-size="11" fill="#1f2a44">128-bit register, half used</text>
  <text x="190" y="101" font-size="11" fill="#1f2a44">both lanes busy</text>
</svg>
```

A virtual call inside the loop makes this impossible, because the compiler cannot tell what each call does.
:::

::: context devirtualisation How compilers remove virtual calls
g++ tries this with the options `-fdevirtualize` and `-fdevirtualize-speculatively`, both on at `-O2`. The first replaces a virtual call when the type is proven: a `final` class or function, or an object whose construction the compiler can see. The second guesses the likely type, emits "if the vptr is this class's, run its code inlined; otherwise do the real virtual call", and so keeps correctness while often gaining speed. Link-time optimisation, `-flto`, lets it see the whole program and prove more.
:::

::: context design-patterns Where the slogan comes from
The book "Design Patterns: Elements of Reusable Object-Oriented Software", published in 1994 by Erich Gamma, Richard Helm, Ralph Johnson and John Vlissides (often called the Gang of Four), states the principle "favor object composition over class inheritance". Their reason: inheritance exposes a subclass to its parent's internals, so a change to the parent can break every child, while composed objects interact only through their public interfaces.
:::

::: context crtp-name Who named the curious pattern
The name comes from James Coplien, who described the pattern in a 1995 column in the "C++ Report" titled "Curiously Recurring Template Patterns". He had noticed programmers independently arriving at this same odd-looking form, a class deriving from a template of itself. The pattern is also known as F-bounded polymorphism in programming-language research, and it is used inside the C++ standard library itself: `std::enable_shared_from_this<T>` is a CRTP base.
:::

::: context deducing-this The C++23 alternative
C++23 added the explicit object parameter, often called "deducing this". A member function can name its object as a template parameter, as in `template <class Self> double sample(this const Self& self)`, and then `self` already has the derived type, with no cast and no template argument on the base. g++ supports it from version 14. The templates module revisits CRTP and shows where this newer form replaces it.
:::
