---
id: l02-pointers
title: Pointers: holding an address, and the four places const can go
minutes: 24
covers:
  - 'Pointers: dereference, arithmetic, nullptr, pointer-to-const vs const pointer, void*, function pointers'
---

Write a friend's home address on a sticky note. The note is not the house. It is small, you can copy it, you can hand it to someone else, and you can keep it for years. And if the house is knocked down, the note still says the same thing. It now leads to an empty lot.

A **pointer** is that sticky note. It is an object whose value is an address. That is the whole definition, and everything hard about pointers follows from two facts about it. First, the address may name an object that no longer exists. Second, the pointer is an object in its own right, with its own separate lifetime.

Python has nothing quite like it. A Python name is already an arrow to an object, managed for you, and it can never go stale. In C++ the arrow is explicit. It is the same size as an integer. You can copy it, store it in a struct, pass it to another subsystem, and keep it long after the thing it names is gone. That is the price of control, and this lesson is about paying it on purpose.

The previous module taught references, and you should still prefer a reference for a parameter that must be present. Pointers are for what a reference cannot say: "there may be nothing here", "this may point somewhere else later", arrays, C interfaces, and tables of functions. This lesson covers dereferencing, `nullptr`, the four places `const` can go, `void*` and function pointers. Pointer arithmetic gets lesson 03 to itself.

## Declaring, taking, dereferencing

Three new pieces of syntax:

- `State* p` declares `p` as a pointer to a `State`. Read the `*` in a declaration as "pointer to".
- `&s` is the **address-of** operator, read "address of s". It gives you a `State*`.
- `*p` is the **[[dereference|dereference-word]]** operator, read "star p" or "the thing p points at". It gives you the object at that address.

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

(The numbers are a spacecraft in low orbit: 6,771 km from Earth's center, about 400 km up, moving at 7.67 km/s.) Four things are in that output.

**`*p` is the object itself**, not a copy. It is an **[[lvalue|lvalue-word]]** — something with a home in memory that you can read or assign to.

**`p->m` is exactly `(*p).m`.** Read `->` as "arrow". You will write the arrow every time, because the parentheses are tiresome.

**Every pointer is 8 bytes on this platform, whatever it points at.** `sizeof(State*)` is 8 though `State` is 16, and `sizeof(char*)` is 8 though a `char` is 1. The sticky note is the same size whether it names a shed or a stadium. (On a 32-bit flight processor every pointer would be 4 bytes. Write `sizeof`, never the literal number.)

**The write through `p` changed `s`.** There is one `State` object with [[two ways to reach it|two-names-one-object]]. That is the point of a pointer, and also why a stale one is dangerous.

::: warning Where the star belongs
`State* p, q;` declares a pointer `p` and a plain `State` called `q`. The `*` attaches to the name next to it, not to the type. Declare one variable per line — the house style in every flight codebase you will meet.
:::

## `nullptr` and the meaning of absence

Sometimes the honest answer is "there is no object". A pointer can say that. It holds a special value, written `nullptr` (read "null pointer"), that names no object at all.

```cpp
double speed_or_zero(const State* p) {
    return p ? p->v_mps : 0.0;      // a pointer tests as a bool
}
```

A pointer used as a condition is `true` when it points at something and `false` when it is null. (`c ? a : b`, read "if c then a else b", picks one of two values.)

A null pointer is a perfectly good value. You may copy it, compare it and test it. What you may not do is dereference it. That is **undefined behavior**: the language makes no promise at all. It is *not* "it crashes". Crashing is merely what Linux [[usually arranges|null-page]].

`nullptr` has its own type, `std::nullptr_t`, which converts to any pointer type and to no integer type. That last part is why it exists. The old spelling, `NULL`, is a macro for an integer constant: `0` on some compilers, and a built-in integer `__null` on g++. Given two overloads, `f(int)` and `f(char*)`, `f(NULL)` therefore never picks `f(char*)`. Where `NULL` is `0`, it quietly calls `f(int)`. On g++ 13.3 and clang 18 the call is rejected as ambiguous. Either way it is not what you meant. `f(nullptr)` can only match `f(char*)`, and calls it.

**[[UndefinedBehaviorSanitizer|sanitizers]]** (UBSan) is the cheapest way to catch a program dereferencing null. Here is a whole program that does:

```cpp
#include <cstdio>

struct State { double r_m; double v_mps; };

double speed_or_zero(const State* p) {
    return p ? p->v_mps : 0.0;      // a pointer tests as a bool
}

double speed_unchecked(const State* p) {
    return p->v_mps;                // no check: the caller promised
}

int main() {
    State s{6771000.0, 7670.0};
    std::printf("with an object: %.1f\n", speed_or_zero(&s));
    std::printf("with nullptr:   %.1f\n", speed_or_zero(nullptr));
    std::printf("about to dereference nullptr\n");
    std::printf("%.1f\n", speed_unchecked(nullptr));
    return 0;
}
```

Saved as `l02-nullcheck.cpp` and built with `g++ -std=c++20 -g -fsanitize=undefined -fno-sanitize-recover=all`, it prints:

```text
with an object: 7670.0
with nullptr:   0.0
about to dereference nullptr
l02-nullcheck.cpp:10:15: runtime error: member access within null pointer of type 'const struct State'
```

and the process exits with status 1. The report gives the file, line 10, column 15 — the `p->v_mps` in `speed_unchecked` — and says exactly what went wrong.

The `-fno-sanitize-recover=all` flag is what makes the exit status non-zero. By default UBSan prints the message and *carries on*. (Here, carrying on means the real null dereference happens next and the program dies with a segmentation fault, exit 139. With other kinds of undefined behavior it can run on quietly.) In a test suite, a message nobody reads scrolls past and the test reports a pass. In CI you want the failing exit code, so you want that flag.

::: key
`nullptr` is a value meaning "no object", usable and testable; dereferencing it is undefined behaviour. Prefer a reference for a parameter that must be present, a pointer when absence is meaningful, and check the pointer once at the boundary rather than at every use.
:::

## The four positions of `const`

A pointer involves two things: the note, and the house it names. `const` can freeze either one, both, or neither. The module expects you to answer this without hesitating. The trick is to **[[read the declaration right to left|right-to-left]]**, starting from the variable's name.

```cpp
int              n = 0;
int*             p   = &n;   // "p is a pointer to int"                — both mutable
const int*      pc   = &n;   // "pc is a pointer to int const"         — pointee frozen
int* const      cp   = &n;   // "cp is a const pointer to int"         — pointer frozen
const int* const cpc = &n;   // "cpc is a const pointer to int const"  — both frozen
```

The **pointee** is the object the pointer points at. To **reseat** (or repoint) a pointer is to make it hold a different address.

The last two need an initializer and would not compile without one. Any `const` object, a pointer included, must get its value where it is declared.

`const int*` and `int const*` mean exactly the same thing. The second reads better right to left, and some codebases require it. What never moves is a `const` written *after* the star: that one always applies to the pointer itself.

::: key
`const int*`, `int* const`, `const int* const`: pointer to const int (the pointee cannot be modified through it); const pointer to int (the pointer cannot be repointed); const pointer to const int (neither). Read the declaration right to left from the name.
:::

::: example What the compiler says when you get it wrong
Four illegal assignments, one per rule, in one file, `l02-const-positions.cpp`:

```cpp
int main() {
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
    return 0;
}
```

g++ 13.3.0 rejects exactly the four marked lines and accepts the other two:

```text
l02-const-positions.cpp:9:9: error: assignment of read-only location '* pc'
    9 |     *pc = 5;                  // error 1
      |     ~~~~^~~
l02-const-positions.cpp:12:9: error: assignment of read-only variable 'cp'
   12 |     cp  = &b;                 // error 2
      |     ~~~~^~~~
l02-const-positions.cpp:13:10: error: assignment of read-only location '*(const int*)cpc'
   13 |     *cpc = 5;                 // error 3
      |     ~~~~~^~~
l02-const-positions.cpp:14:9: error: assignment of read-only variable 'cpc'
   14 |     cpc = &b;                 // error 4
      |     ~~~~^~~~
```

Read the wording, because it is the clue.

- "Read-only **location**" means the *pointee* is const. You tried to write through a pointer-to-const (errors 1 and 3).
- "Read-only **variable**" means the *pointer* is const. You tried to reseat it (errors 2 and 4).

Once you can map those two phrases onto the two positions, the error tells you which `const` is in the way.

Now notice the lines that are fine. `pc = &b;` reseats a pointer-to-const. That is legal, because the promise is about the pointee, not about `pc`. And `*cp = 5;` writes through a const pointer, which is legal because only the pointer is frozen.

One more subtle point: `const` on the pointee is a promise not to modify *through this pointer*. `a` itself is still an ordinary `int`, and `a = 5;` still works.
:::

In practice you will write `const T*` all the time and `T* const` almost never, because a local pointer you never reseat is better written as a reference. `const T*` is what a function parameter looks like when the function reads an object it does not own and may be handed nothing:

```cpp
double speed_or_zero(const State* p);
```

That signature promises three things at once: I will not copy your object, I will not modify it, and you may pass `nullptr`. The reference version, `double speed(const State&)`, promises the first two and forbids the third.

## `void*`: an address with the type erased

A `void*` (read "void pointer") is a sticky note with an address and nothing else — no label saying what kind of building is there.

Any object pointer converts to `void*` automatically. Converting back needs an explicit cast, and it is only defined if you cast back to the original type.

You cannot dereference a `void*`: g++ says `'void*' is not a pointer-to-object type`. You cannot do arithmetic on it in standard C++ (g++ allows `vp + 1` as an extension, and `-Wpedantic` warns `pointer of type 'void *' used in arithmetic`). And `delete` on one is undefined behavior; g++ warns `deleting 'void*' is undefined`.

It exists for one job: carrying a caller's own data through an interface that must not know the caller's types. That data is usually called the **context**.

::: example A C-style callback that carries a context
A **[[callback|callback-word]]** is a function you hand to someone else for them to call later. Here, `pump` walks a buffer and calls a "sink" for each sample. `pump` has no idea what the sink adds things up into, so it takes the context as `void*` and hands it back untouched.

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

Follow one call. `main` passes `&acc`, which converts to `void*` on the way in. `pump` hands that same address to `accumulate` four times. `accumulate` casts it back to `Accumulator*` and adds one sample each time.

Check the numbers: $-9.81 - 9.79 - 9.83 - 9.80 = -39.23$, and $-39.23 / 4 = -9.8075\,\mathrm{m/s^2}$. That is about a quarter of a percent more than standard gravity, $9.80665\,\mathrm{m/s^2}$ — what four noisy accelerometer samples ought to look like.

The `static_cast<Accumulator*>(ctx)` is the dangerous line, and nothing checks it. If a later change passes a different struct's address as the context, the cast still compiles, and the program writes into the wrong layout.

Every driver and real-time operating system API in the C world looks like this. In C++ you would use a template or `std::function` instead when you are free to. When you must talk to a C API — and on a vehicle you will, constantly — the discipline is to do the cast exactly once, right away, in a function whose only job is that cast.
:::

## Function pointers

A function is not an object, but its machine code lives at an address. A pointer to it is an ordinary object you can store in a table. That is how a controller with several modes can pick its behavior without a chain of `if`s and without a virtual call (the run-time choice that class inheritance uses).

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

`kLaws` is a **[[dispatch table|dispatch-table]]**: an array of three function pointers, indexed by the mode. `kLaws[m](s)` means "take entry `m` and call it with `s`".

The descent law is a **[[proportional controller|p-controller]]** on vertical speed. It commands an acceleration $a = -0.8\,(v + 2)$. At $v = -5\,\mathrm{m/s}$:

$$
a = -0.8 \times (-5 + 2) = -0.8 \times (-3) = 2.4\,\mathrm{m/s^2}.
$$

Positive means upward, so the law slows the descent toward the $-2\,\mathrm{m/s}$ target. Sanity check: if the vehicle were already at $-2\,\mathrm{m/s}$, the bracket would be zero and the law would command nothing, as it should.

Two syntax notes.

The raw spelling of the type is `double (*)(const State&)`. The parentheses around the star are required: `double* f(const State&)` would declare a function *returning* `double*`. Write `using AccelLaw = …;` once and never look at the raw spelling again.

A function's name turns into a pointer to it on its own. So `&coast` and `coast` are the same value here, and `f(s)` and `(*f)(s)` are the same call. Both spellings appear in real code.

The whole table is `const`, and on this toolchain that is more than a comment. g++ 13.3.0 puts `kLaws` in a section named `.data.rel.ro.local`, which the linker places inside the **[[RELRO|relro]]** segment. The loader makes that segment read-only once it has filled in the addresses. A separate test program that took `const_cast<AccelLaw*>(kLaws)` and wrote through it printed its first line and then died with signal 11, exit status 139.

That is what this build does, not a language guarantee. The standard says only that modifying an object declared `const` is undefined behavior. But it is the behavior you want, and you can check it on your own target with `readelf -lW`. A dispatch table in writable memory is one stray write away from jumping somewhere arbitrary, which is why safety reviews look for exactly this `const`.
:::

::: warning Do not use a table for a two-way choice
A function pointer table is fast and fixed, but every call through it is an **indirect call**: the compiler cannot inline it, and the processor must guess where it goes. If the mode changes once a second and the loop runs at 1 kHz, that cost is irrelevant. Do not reach for a table to replace a two-branch `if`.
:::

## Check yourself

::: check
Write the declaration for a pointer, held by a telemetry formatter, that may not be reseated and through which the pointee may not be modified. Then say which of the two `const`s you would actually write on a function parameter, and why the other is usually pointless there.
:::

::: answer
`const State* const p = &s;` Read right to left: `p` is a `const` pointer to a `const State`.

On a function parameter you write only the first `const`: `void format(const State* s)`. The `const` on the pointer itself (called *top-level* `const`) promises the caller nothing, because the parameter is already a copy of the caller's pointer. Reseating that copy inside the function could not affect anyone.

It is not an error. Some codebases put it on the definition as a note to whoever maintains the function. But it is ignored when the compiler matches overloads, and it is not part of the function's interface. The `const` that matters to a caller is always the one on the pointee.
:::

::: check
`sizeof(State*)` is 8 and `sizeof(State)` is 16. One function takes a `State` by value and another takes a `State*`. Which copies more bytes at the call, and is that the right reason to choose between them?
:::

::: answer
By value copies 16 bytes; by pointer copies 8. That is the wrong reason to choose, for two reasons.

First, 16 bytes is two registers on this platform's calling convention, so passing by value is very likely free. The pointer version forces the object to have an address in memory and adds an extra step at every member access.

Second, the choice is about meaning. A pointer parameter says "this may be absent, and I may keep the address". Neither is true of a state vector being read.

Size starts to matter at, say, a 6-by-6 covariance matrix of doubles: $36 \times 8 = 288$ bytes. Even then the right answer is `const State&`, which costs the same 8 bytes at the call but cannot be null. Reach for a pointer when the interface truly needs absence, reseating, or a C boundary.
:::

::: check
`pc = &b;` compiled but `*pc = 5;` did not, where `pc` is a `const int*`. If `a` is an ordinary `int` and `pc` points at it, can `a` still be changed? By what?
:::

::: answer
Yes. `const` on the pointee is a promise about *that route to the object*, not about the object. `a` is a non-const `int`, so `a = 5;` is legal, and so is writing through any non-const pointer or reference that also names it.

The compiler enforces the promise only where the `const` type is visible. It will happily let a value change behind a `const int*`. That is exactly why a `const T&` parameter does not guarantee the object stays still during a call that could reach it another way.

The opposite case is different. Casting away `const` to write to an object that was *declared* `const` is undefined behavior, because that object may live in read-only memory — as the dispatch table did.
:::

::: check
Given `void f(int)` and `void f(char*)`, why is `f(NULL)` never a safe way to call the pointer version, while `f(nullptr)` is?
:::

::: answer
`NULL` is a macro that expands to an integer constant: `0` or `0L` in some standard libraries, g++'s built-in `__null` in others. Its type is an integer type, so overload resolution sees an integer argument.

Where `NULL` is `0`, `f(int)` is an exact match and gets called — silently the wrong function. On g++ and clang, `__null` has type `long`, which converts equally well to `int` and to `char*`, so the call is rejected as ambiguous. Neither outcome calls `f(char*)`.

`nullptr` has type `std::nullptr_t`, which converts to any pointer type and to no arithmetic type, so `f(nullptr)` can only match `f(char*)`. The same difference makes `int n = nullptr;` a compile error, while `int n = NULL;` compiles (g++ adds a warning). There is no case in C++ where `NULL` is better, and static analyzers in flight codebases generally flag it.
:::

::: check
A driver API gives you `void register_sink(Sink fn, void* ctx)`, and you pass `&acc`, where `acc` is an `Accumulator` local in `main`. What two lifetime obligations have you taken on?
:::

::: answer
First, `acc` must outlive the registration. The driver keeps the address and will call back later. If `acc` were a local in a function that returns before the last callback, every callback would write through a dangling pointer — a use-after-return, which lesson 08 covers and AddressSanitizer detects. Here `acc` is in `main`, so it outlives everything, which is why the example is safe. In real code the context is usually a member of a long-lived subsystem object, or has static storage duration.

Second, the type must match for the whole time. The callback does `static_cast<Accumulator*>(ctx)`, and nothing checks it. If anyone ever re-registers with a different struct, the cast silently reinterprets the bytes.

Both obligations are invisible at the call site. That is why the convention is to register once, during initialization, and never afterwards.
:::

## Summary

| Form | Meaning |
| --- | --- |
| `T* p = &x;` | `p` holds the address of `x`; `sizeof(p)` is 8 here, whatever `T` is |
| `*p`, `p->m` | the object at that address; `p->m` is `(*p).m` |
| `nullptr` | a pointer value naming no object; testable, not dereferenceable |
| `std::nullptr_t` | its type: converts to any pointer, to no integer |
| `NULL` | an integer constant; `f(NULL)` never picks the pointer overload |
| `const int* p` | pointer to const int — cannot write through it, can reseat |
| `int* const p` | const pointer to int — can write through it, cannot reseat |
| `const int* const p` | neither |
| "read-only location" | g++'s wording when the *pointee* is const |
| "read-only variable" | g++'s wording when the *pointer* is const |
| `void*` | an address with the type erased; cast back with `static_cast` to the original type |
| `double (*)(const State&)` | pointer to a function; name it with `using` |
| `-fsanitize=undefined -fno-sanitize-recover=all` | report undefined behaviour and exit non-zero |

Lesson 03 gives the pointer arithmetic: what `p + 1` means, why the step is the pointee's size, where the arithmetic becomes undefined, and how an array loses its length the moment it is passed to a function.

::: context dereference-word Following the note to the house
To dereference is to go from a reference — here, an address — to the thing it refers to: you read the sticky note and walk to the house. The same star does two jobs in C++. In a declaration, `State* p`, it says "p is a pointer". In an expression, `*p`, it says "go there". Seeing the two meanings as "this is an address" and "follow the address" keeps them apart.
:::

::: context lvalue-word Things that have a home
An **lvalue** is an expression that names an object with a place in memory, so it can appear on the left of `=` (the "l" originally stood for "left"). `s`, `*p` and `p->v_mps` are lvalues. `3 + 4` is not: it is a value with no home, and `3 + 4 = 7;` does not compile.

Lesson 04 sorts all expressions into these categories properly, because they decide which references can bind to what.
:::

::: context two-names-one-object One object, two ways in
The layout in the example. `s` is 16 bytes: two doubles. `p` is another object, 8 bytes, whose value is the address of the first byte of `s`. The addresses are made up for the picture; the sizes are real.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="40" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">r_m (8 B)</text>
  <text x="150" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">v_mps (8 B)</text>
  <text x="110" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">s, 16 bytes</text>
  <text x="30" y="90" font-size="11" fill="#6c7a93">0x1000</text>
  <text x="110" y="90" font-size="11" fill="#6c7a93">0x1008</text>
  <rect x="250" y="40" width="80" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">0x1000</text>
  <text x="290" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">p, 8 bytes</text>
  <path d="M290,78 C290,130 60,130 40,80" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="36,86 40,74 46,85" fill="#b4232c"/>
  <text x="175" y="140" font-size="11" text-anchor="middle" fill="#b4232c">*p is s itself</text>
</svg>
```
:::

::: context null-page Why a null dereference usually crashes on Linux
On most machines the null pointer is the address 0. Linux deliberately leaves the lowest part of every program's address space unmapped — at least the first 4 KiB page, and 64 KiB on a stock Ubuntu install, set by the `vm.mmap_min_addr` setting — so any read or write near address 0 traps, and the kernel sends the program signal 11, a segmentation fault.

That is a courtesy of the operating system, not a promise of the language. A small microcontroller with no memory protection may have real data at address 0, and a null dereference there quietly reads it. And the optimizer, which assumes you never dereference null, may remove checks you wrote after the dereference.
:::

::: context sanitizers Instruments built into the program
A **sanitizer** is extra checking code the compiler weaves into your program when you pass a `-fsanitize=` flag. UBSan checks for many kinds of undefined behavior: null dereference, signed integer overflow, out-of-range shifts, misaligned access. It is cheap enough to leave on for a whole test suite.

Its sibling, AddressSanitizer (`-fsanitize=address`), checks memory accesses against a map of what is valid. You meet it in lesson 03, and lesson 09 is all about it.
:::

::: context right-to-left Reading from the name outward
Start at the name and read leftward, saying "pointer to" at each star.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="16" text-anchor="middle" fill="#1f2a44">
    <text x="50" y="70">const</text>
    <text x="110" y="70">int</text>
    <text x="160" y="70">*</text>
    <text x="215" y="70">const</text>
    <text x="290" y="70">cpc</text>
  </g>
  <path d="M290,48 C290,18 50,18 50,48" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="45,42 50,54 55,42" fill="#1d6fd1"/>
  <text x="170" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">read this way</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="290" y="96">1. cpc is a</text>
    <text x="215" y="112">2. const</text>
    <text x="160" y="96">3. pointer to</text>
    <text x="110" y="112">4. int</text>
    <text x="50" y="96">5. const</text>
  </g>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">a const pointer to an int that is const</text>
</svg>
```

A `const` right after the star freezes the pointer; a `const` before the star (on either side of `int`) freezes the pointee.
:::

::: context callback-word "Call me back"
The name comes from the phone: you leave your number and they call you back when something happens. In code you leave a function's address.

The C standard library is full of them. `qsort` takes a pointer to your comparison function. POSIX `pthread_create` takes a function of type `void* (*)(void*)` plus a `void*` argument to hand it — exactly the function-plus-context shape of this example. Real-time operating systems used on spacecraft use the same pattern to start tasks and to register interrupt handlers.
:::

::: context dispatch-table An array of addresses of code
`kLaws` holds three 8-byte function pointers. Indexing it by the mode picks which function runs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">kLaws (24 bytes)</text>
  <rect x="30" y="30" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="60" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="30" y="90" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">[0] &amp;coast</text>
  <text x="70" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">[1] &amp;burn</text>
  <text x="70" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">[2] &amp;descend</text>
  <rect x="230" y="30" width="110" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="64" width="110" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="98" width="110" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">coast code</text>
  <text x="285" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">burn code</text>
  <text x="285" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">descend code</text>
  <line x1="110" y1="45" x2="226" y2="43" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="110" y1="75" x2="226" y2="77" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="110" y1="105" x2="226" y2="111" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">read-only data points into the code</text>
</svg>
```
:::

::: context p-controller Push back in proportion to the error
A proportional controller measures how far you are from what you want — the error — and pushes back by a fixed multiple of it, the **gain**. Here the error is $v - (-2) = v + 2$ and the gain is $0.8\,\mathrm{s^{-1}}$, so each metre per second of extra sink rate asks for $0.8\,\mathrm{m/s^2}$ of upward acceleration.

It is the simplest feedback law there is, and the starting point of the control-systems modules later in the course, which add integral and derivative terms to fix what a pure proportional law cannot.
:::

::: context relro Read-only after relocation
RELRO stands for "relocation read-only". When a program starts, the loader must patch some data with real addresses — a table of function pointers, for example, cannot hold final addresses until the program's random base address is known. Those patches are called relocations.

With RELRO, the linker groups such data into one segment; the loader patches it and then asks the kernel to make it read-only. `readelf -lW program` lists a `GNU_RELRO` entry when this is on, as it is by default on Ubuntu's g++.
:::
