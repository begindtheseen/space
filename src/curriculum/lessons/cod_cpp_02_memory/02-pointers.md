---
id: l02-pointers
title: Pointers: holding an address, and the four places const can go
minutes: 20
covers:
  - 'Pointers: dereference, arithmetic, nullptr, pointer-to-const vs const pointer, void*, function pointers'
---

A pointer is an object whose value is an address. That is the whole definition, and everything that makes pointers hard follows from two consequences of it: the address may name an object that no longer exists, and the pointer itself is an object with its own separate lifetime.

Python has nothing to compare it to. A Python name is already an indirection, managed for you, and you cannot hold a stale one. In C++ the indirection is explicit, it is the same size as an integer, you can copy it, store it in a struct, pass it across a subsystem boundary, and keep it long after the thing it names is gone. That is the price of the control, and this lesson is about spending it deliberately.

The previous module taught references, which you should still prefer for a parameter that must be present. Pointers are for the cases a reference cannot express: absence, reseating, arrays, C interfaces, and indirection through a table. This lesson covers dereference, `nullptr`, the four positions `const` can occupy, `void*` and function pointers. Pointer arithmetic gets lesson 03 to itself.

## Declaring, taking, dereferencing

```cpp
#include <cstdio>

struct State { double r_m; double v_mps; };

int main() {
    State s{6771000.0, 7670.0};
    State* p = &s;                 // p holds the address of s

    std::printf("sizeof(State)  = %zu\n", sizeof(State));
    std::printf("sizeof(State*) = %zu\n", sizeof(State*));
    std::printf("sizeof(double*) = %zu, sizeof(char*) = %zu, sizeof(void*) = %zu\n",
                sizeof(double*), sizeof(char*), sizeof(void*));

    std::printf("(*p).r_m = %.1f\n", (*p).r_m);
    std::printf("p->v_mps = %.1f\n", p->v_mps);

    p->v_mps = 7669.13;            // writes through the pointer, into s
    std::printf("s.v_mps  = %.2f\n", s.v_mps);
    return 0;
}
```

g++ 13.3.0, `-std=c++20 -Wall -Wextra -Wpedantic`:

```text
sizeof(State)  = 16
sizeof(State*) = 8
sizeof(double*) = 8, sizeof(char*) = 8, sizeof(void*) = 8
(*p).r_m = 6771000.0
p->v_mps = 7670.0
s.v_mps  = 7669.13
```

Four things are in that output.

`&s` is the address-of operator: it yields a `State*`. `*p` is the dereference operator: it yields the object at that address, as an lvalue you can read or assign. `p->m` is exactly `(*p).m`, and you will write the arrow every time because the parentheses are unbearable.

Every pointer is 8 bytes on this platform, whatever it points at. `sizeof(State*)` is 8 even though `State` is 16, and `sizeof(char*)` is 8 even though `char` is 1. A pointer is not the thing; it is where the thing is. (On a 32-bit flight processor they would all be 4. Write `sizeof` rather than a literal.)

And the write through `p` changed `s`. There is one `State` object here, with two names for reaching it. That is the point of a pointer and also the reason a stale one is dangerous.

::: warning
`State* p, q;` declares a pointer `p` and a plain `State` called `q`. The `*` binds to the declarator, not to the type. Either declare one variable per line, which is the house style in every flight codebase you will meet, or accept that you will eventually be surprised.
:::

## `nullptr` and the meaning of absence

A pointer can hold a value that names no object. Write it `nullptr`.

```cpp
double speed_or_zero(const State* p) {
    return p ? p->v_mps : 0.0;      // a pointer tests as a bool
}
```

`nullptr` has its own type, `std::nullptr_t`, which converts to any pointer type and to no integer type. That last part is why it exists. The old spelling `NULL` is a macro for `0` or `0L`, so `f(NULL)` calling an overload set containing `f(int)` and `f(char*)` picks the `int`, which is never what you meant. Use `nullptr` and the ambiguity disappears.

A pointer that is null is a perfectly good value: you may copy it, compare it, and test it. What you may not do is dereference it. That is undefined behaviour, and the standard offers no promise at all about what happens — not "it segfaults", which is merely what this operating system usually arranges.

UndefinedBehaviorSanitizer is the cheapest way to see that a program did it. Compiled with `g++ -std=c++20 -fsanitize=undefined -fno-sanitize-recover=all`:

```text
with an object: 7670.0
with nullptr:   0.0
about to dereference nullptr
l02-nullcheck.cpp:18:32: runtime error: member access within null pointer of type 'const struct State'
```

and the process exits with status 1. The `-fno-sanitize-recover=all` is what produced the non-zero exit: by default UBSan prints the diagnostic and *carries on*, which means a test suite scrolls past it and reports a pass. In CI you want the failing exit code, so you want that flag.

::: key
`nullptr` is a value meaning "no object", usable and testable; dereferencing it is undefined behaviour. Prefer a reference for a parameter that must be present, a pointer when absence is meaningful, and check the pointer once at the boundary rather than at every use.
:::

## The four positions of `const`

This is the flashcard that the module expects you to answer without hesitating, and the way to answer it is to read the declaration right to left from the variable's name.

```cpp
int*             p;    // "p is a pointer to int"                     — both mutable
const int*      pc;    // "pc is a pointer to int const"              — pointee frozen
int* const      cp;    // "cp is a const pointer to int"              — pointer frozen
const int* const cpc;  // "cpc is a const pointer to int const"       — both frozen
```

`const int*` and `int const*` mean exactly the same thing; the second reads better right to left, and some codebases require it. What never moves is the `const` *after* the star: that one always applies to the pointer itself.

::: example What the compiler says when you get it wrong
Four illegal assignments, one per rule, in one file:

```cpp
int a = 1;
int b = 2;

const int* pc  = &a;      // pointer to const int
int* const cp  = &a;      // const pointer to int
const int* const cpc = &a;

*pc = 5;                  // error 1
pc  = &b;                 // fine
*cp = 5;                  // fine
cp  = &b;                 // error 2
*cpc = 5;                 // error 3
cpc = &b;                 // error 4
```

g++ 13.3.0 rejects exactly the four marked lines and accepts the other two:

```text
l02-const-positions.cpp:12:9: error: assignment of read-only location '* pc'
   12 |     *pc = 5;                  // error 1
      |     ~~~~^~~
l02-const-positions.cpp:15:9: error: assignment of read-only variable 'cp'
   15 |     cp  = &b;                 // error 2
      |     ~~~~^~~~
l02-const-positions.cpp:16:10: error: assignment of read-only location '*(const int*)cpc'
   16 |     *cpc = 5;                 // error 3
      |     ~~~~~^~~
l02-const-positions.cpp:17:9: error: assignment of read-only variable 'cpc'
   17 |     cpc = &b;                 // error 4
      |     ~~~~^~~~
```

Read the wording, because it is the tell. "Read-only **location**" means the *pointee* is const — you tried to write through a `const int*`. "Read-only **variable**" means the *pointer* is const — you tried to reseat it. Once you can map those two phrases onto the two positions, the error tells you which `const` to move.

Note also which line is fine: `pc = &b;` reseats a pointer-to-const, which is legal, because the promise is about the pointee and not about `pc`. `const` on the pointee is a promise not to modify *through this pointer*; `a` itself is still an ordinary `int` and can still be changed by its own name.
:::

In practice you will write `const T*` constantly and `T* const` almost never, because a local pointer you do not intend to reseat is better expressed as a reference. `const T*` is what a function parameter looks like when the function reads an object it does not own and may be handed nothing:

```cpp
double speed_or_zero(const State* p);
```

That signature says three things at once: I will not copy your object, I will not modify it, and you may pass `nullptr`. The reference version, `double speed(const State&)`, says the first two and forbids the third.

## `void*`: an address with the type erased

`void*` holds an address and remembers nothing about what is there. Any object pointer converts to it implicitly; converting back requires an explicit cast and is only defined if you cast back to the original type.

You cannot dereference a `void*`, you cannot do arithmetic on it in standard C++ (g++ allows `vp + 1` as a GNU extension and `-Wpedantic` warns about it), and you cannot call `delete` on one. It exists for exactly one job: carrying a caller's context through an interface that must not know the caller's types.

::: example A C-style callback that carries a context
The `pump` function walks a buffer and calls a sink for each sample. It has no idea what the sink accumulates into, so it takes the context as `void*` and hands it back untouched.

```cpp
#include <cstdio>

using Sink = void (*)(double sample, void* ctx);

struct Accumulator { double sum; int n; };

void accumulate(double sample, void* ctx) {
    Accumulator* acc = static_cast<Accumulator*>(ctx);   // cast back to the real type
    acc->sum += sample;
    acc->n   += 1;
}

void pump(const double* data, int n, Sink sink, void* ctx) {
    for (int i = 0; i < n; ++i) sink(data[i], ctx);
}

int main() {
    const double az[4] = {-9.81, -9.79, -9.83, -9.80};
    Accumulator acc{0.0, 0};
    pump(az, 4, &accumulate, &acc);
    std::printf("n = %d, sum = %.2f, mean = %.4f\n", acc.n, acc.sum, acc.sum / acc.n);
    return 0;
}
```

```text
n = 4, sum = -39.23, mean = -9.8075
```

Check it: $-9.81 - 9.79 - 9.83 - 9.80 = -39.23$, and $-39.23 / 4 = -9.8075\,\mathrm{m/s^2}$, about a quarter of a percent above standard gravity, which is what four noisy accelerometer samples ought to look like.

The `static_cast<Accumulator*>(ctx)` is the dangerous line, and nothing checks it. If a later change passes a different struct's address as the context, the cast still compiles and the program writes into the wrong layout. This is why every driver and RTOS API in the C world looks like this, and why in C++ you use a template or a `std::function` instead when you are free to. When you are talking to a C API — and on a vehicle you will be, constantly — the discipline is to do the cast exactly once, immediately, in a function whose only job is that cast.
:::

## Function pointers

A function is not an object, but it has an address, and a pointer to it is an ordinary object you can store in a table. That is how a mode-switched controller dispatches without a chain of `if`s and without a virtual call.

::: example A dispatch table for a descent controller
```cpp
#include <cstdio>

struct State { double alt_m; double v_mps; };   // v negative while descending

double coast(const State&)     { return 0.0; }
double burn(const State&)      { return 12.0; }
double descend(const State& s) { return -0.8 * (s.v_mps + 2.0); }   // hold -2 m/s

using AccelLaw = double (*)(const State&);      // a name for the pointer type

enum Mode { kCoast = 0, kBurn = 1, kDescend = 2, kModeCount = 3 };

const AccelLaw kLaws[kModeCount]     = { &coast, &burn, &descend };
const char* const kNames[kModeCount] = { "coast", "burn", "descend" };

int main() {
    State s{120.0, -5.0};
    std::printf("sizeof(AccelLaw) = %zu\n", sizeof(AccelLaw));
    for (int m = 0; m < kModeCount; ++m) {
        std::printf("%-8s -> a = %.1f m/s^2\n", kNames[m], kLaws[m](s));
    }
    AccelLaw f = kLaws[kDescend];
    std::printf("through the variable: %.1f\n", f(s));
    std::printf("explicit dereference: %.1f\n", (*f)(s));
    return 0;
}
```

```text
sizeof(AccelLaw) = 8
coast    -> a = 0.0 m/s^2
burn     -> a = 12.0 m/s^2
descend  -> a = 2.4 m/s^2
through the variable: 2.4
explicit dereference: 2.4
```

The descent law is a proportional controller on vertical rate: commanded acceleration $a = -0.8\,(v + 2)$, so at $v = -5\,\mathrm{m/s}$ it commands $-0.8 \times (-5 + 2) = 2.4\,\mathrm{m/s^2}$ upward, slowing the descent toward the $-2\,\mathrm{m/s}$ target.

Two syntax notes. The raw declaration of that type is `double (*)(const State&)` — the parentheses around the star are required, because `double* f(const State&)` is a function returning `double*`. Write `using AccelLaw = …;` once and never look at it again. And a function name decays to a pointer on its own, so `&coast` and `coast` are the same value here, and `f(s)` and `(*f)(s)` are the same call; both spellings appear in real code.

The whole table is `const`, and on this toolchain that is not merely documentation. g++ 13.3.0 puts `kLaws` in the `.data.rel.ro.local` section, which the linker places inside the `GNU_RELRO` segment; the loader makes that segment read-only once relocations are done. A separate test program that took `const_cast<AccelLaw*>(kLaws)` and wrote through it printed its first line and then died with signal 11, exit status 139. That is what this build does, not a language guarantee — the standard simply says modifying an object declared `const` is undefined behaviour — but it is the behaviour you want, and it is worth knowing how to check it with `readelf -lW` on your own target. A dispatch table in writable memory is one stray write away from transferring control somewhere arbitrary, which is why safety-critical reviews look for exactly this `const`.
:::

::: warning
A function pointer table is fast and fixed, but it is also an indirect call the compiler cannot inline and the branch predictor must guess. If the mode changes once a second and the loop runs at 1 kHz, that is irrelevant. Do not reach for it to replace a two-branch `if`.
:::

## Check yourself

::: check
Write the declaration for a pointer, held by a telemetry formatter, that may not be reseated and through which the pointee may not be modified. Then say which of the two `const`s you would actually write in a real function parameter, and why the other is usually pointless there.
:::

::: answer
`const State* const p = &s;` — read right to left: `p` is a `const` pointer to a `const State`. In a function parameter you write only the first `const`: `void format(const State* s)`. The top-level `const` on a parameter promises the *caller* nothing at all, because the parameter is already a copy of the caller's pointer — reseating it inside the function could not affect anyone. It is not an error, and some codebases put it on the definition as a note to the implementer, but it does not participate in overload resolution and it is not part of the function's interface. The `const` that matters to a caller is always the one applying to the pointee.
:::

::: check
`sizeof(State*)` is 8 and `sizeof(State)` is 16. A function takes a `State` by value and another takes a `State*`. Which copies more bytes at the call, and is that the right reason to choose between them?
:::

::: answer
By value copies 16 bytes; by pointer copies 8. That is the wrong reason to choose, for two reasons. First, 16 bytes is two registers on this ABI, so by-value is very likely free while the pointer version forces the object to have an address and adds an indirection at every member access. Second, the choice is about meaning: a pointer parameter says "this may be absent and I may keep the address", and neither of those is true of a state vector being read. The size argument starts to bite at, say, a 6-by-6 covariance matrix — 288 bytes — and even then the right answer is `const State&`, which costs the same 8 bytes at the call but cannot be null. Reach for a pointer when the interface genuinely needs absence, reseating, or a C boundary.
:::

::: check
`pc = &b;` compiled but `*pc = 5;` did not, where `pc` is a `const int*`. If `a` is an ordinary `int` and `pc` points at it, can `a` still be changed? By what?
:::

::: answer
Yes. `const` on the pointee is a promise about *that access path*, not about the object. `a` is a non-const `int`, so `a = 5;` is legal, and so is writing through any non-const pointer or reference that also names it. The compiler enforces the promise only where the `const` type is visible, and it will happily let a value change behind a `const int*` — which is exactly why a `const T&` parameter is not a guarantee that the object is stable across a call that could reach it another way. The converse case, casting away `const` to write to an object that was *declared* `const`, is different and is undefined behaviour, because the object itself may live in read-only memory.
:::

::: check
Why does `f(NULL)` choose the wrong overload where `f(nullptr)` does not?
:::

::: answer
`NULL` is a macro that expands to an integer constant — `0` or `0L` in the usual headers — so its type is `int` or `long`, and overload resolution sees an integer argument. Given `void f(int)` and `void f(char*)`, `f(NULL)` matches `f(int)` exactly and calls it. `nullptr` has type `std::nullptr_t`, which converts to any pointer type and to no arithmetic type at all, so `f(nullptr)` can only match `f(char*)`. The same distinction stops `int n = nullptr;` from compiling while `int n = NULL;` quietly succeeds. There is no case in C++ where `NULL` is better, and static analysers in flight codebases generally flag it.
:::

::: check
A driver API gives you `void register_sink(Sink fn, void* ctx)` and you pass `&acc` where `acc` is an `Accumulator` local in `main`. What are the two lifetime obligations you have just taken on?
:::

::: answer
First, `acc` must outlive the registration: the driver holds the address and will call back later, so if `acc` is a local in a function that returns before the last callback, every callback writes through a dangling pointer — a use-after-return, which lesson 08 covers and AddressSanitizer detects. Here `acc` is in `main`, so it outlives everything, which is why the example is safe; in real code the context is usually a member of a long-lived subsystem object, or has static storage duration. Second, the type must match for the whole time: the callback does `static_cast<Accumulator*>(ctx)`, and nothing checks it, so if anyone ever re-registers with a different struct the cast silently reinterprets the bytes. Both obligations are invisible at the call site, which is why the convention is to register once during initialisation and never afterwards.
:::

## Summary

| Form | Meaning |
| --- | --- |
| `T* p = &x;` | `p` holds the address of `x`; `sizeof(p)` is 8 here, whatever `T` is |
| `*p`, `p->m` | the object at that address; `p->m` is `(*p).m` |
| `nullptr` | a pointer value naming no object; testable, not dereferenceable |
| `std::nullptr_t` | its type: converts to any pointer, to no integer |
| `const int* p` | pointer to const int — cannot write through it, can reseat |
| `int* const p` | const pointer to int — can write through it, cannot reseat |
| `const int* const p` | neither |
| "read-only location" | g++'s wording when the *pointee* is const |
| "read-only variable" | g++'s wording when the *pointer* is const |
| `void*` | an address with the type erased; cast back with `static_cast` to the original type |
| `double (*)(const State&)` | pointer to a function; name it with `using` |
| `-fsanitize=undefined -fno-sanitize-recover=all` | report undefined behaviour and exit non-zero |

Lesson 03 gives the pointer an arithmetic: what `p + 1` means, why the unit is the pointee's size, where the arithmetic becomes undefined, and how an array loses its length the moment it is passed to a function.
