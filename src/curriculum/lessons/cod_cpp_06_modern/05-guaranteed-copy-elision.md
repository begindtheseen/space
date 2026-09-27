---
id: l05-guaranteed-copy-elision
title: Returning big objects without copying them
minutes: 22
covers:
  - Guaranteed copy elision and what it means for returning big objects
---

You order a new sofa. The old way it reaches you goes like this. The factory builds it. A truck carries it to a warehouse. A second truck carries it from the warehouse to your house. Then the warehouse throws its copy away. Two trips, and one sofa that existed only to be moved.

The smart way: the factory is given your address before it starts. The workers build the sofa in your living room. No warehouse, no trucks. The sofa is made once, in the place it will stay.

Returning an object from a C++ function used to look like the first story, at least on paper. Since C++17, for one very common kind of `return`, it is the second story, and the language *guarantees* it. Leaving out a copy like this is called **copy elision** — "elision" means leaving something out, as in "elide a syllable". The basics module (lesson 06) told you it exists. The RAII module (lesson 05) warned you not to write `return std::move(local);`. This lesson gives the exact rules, shows them with a counter, and says what they mean for the big objects flight code passes around: a $6 \times 6$ covariance matrix, a state vector, a 1 MiB block of state history.

## What a return used to cost

Take a function that builds and returns an object:

```cpp
Counted make() { return Counted{}; }

Counted r = make();
```

Read by the C++14 rules, two things happen after `Counted{}` is built. First, it is moved into a temporary object, the function's return value. Second, that temporary is moved into `r`. Two moves, like the two truck trips.

The C++98 and C++14 standards **allowed** compilers to skip both, and every serious compiler did, an optimisation called **[[return value optimisation|rvo-history]]**, or RVO. But it was only *allowed*. So the language still insisted that the move constructor (or copy constructor) exist and be accessible, in case some compiler did not skip it. A class whose copy and move were both deleted could not be returned by value at all, even though no compiler would ever have called them.

GCC and Clang have a flag that turns the optional skipping off: `-fno-elide-constructors`. With it you can see the paper story. Compiled as C++14 with that flag, the `make()` above performs exactly 2 moves. Keep that number; you will see it again in a table.

## Values that are not objects yet

C++17 fixed this by changing what a certain kind of expression *is*.

Every expression has a **[[value category|value-category]]**, which says what kind of thing it names. Three matter here:

- An **lvalue** is something with a name and a home in memory, like the variable `r`. You can take its address.
- An **xvalue** ("expiring value") is an object you are allowed to steal from, like `std::move(r)`.
- A **prvalue** ("pure rvalue") is a value with no home yet, like `Counted{}`, `3 + 4`, or the call `make()` when `make` returns by value.

Before C++17, a prvalue of class type was a temporary object that already existed somewhere. Since C++17 it is not an object at all. It is a **recipe**: "here is how to initialise a `Counted`". Nothing is built until the recipe lands in the place where the object will live. Only if there is no such place — say, you bind the prvalue to a `const&` — does the compiler make a temporary to hold it, a step the standard calls **[[temporary materialisation|materialisation]]**.

So the rule is:

> When an object is initialised from a prvalue of the same type, the prvalue initialises that object directly. There is no intermediate object, so there is no copy or move to skip.

That is why people say "guaranteed copy elision", even though the standard's own wording is stronger: there is nothing left to elide. It covers:

- `return T{...};` and `return T(args);` — the object is built in the caller's storage;
- `T x = f();` where `f` returns `T` by value;
- chains: if `f` does `return g();` and `g` does `return T{};`, the one object is built at the far end, in the caller of `f`;
- `T x = T{...};` and passing a prvalue to a by-value parameter.

::: key What guaranteed copy elision changes
Since C++17, returning a prvalue constructs directly into the caller's storage; there is no copy or move to elide, so returning large objects by value is free and does not require the type to be movable.
:::

How can a function build something in its caller's storage? The caller reserves the space before the call and passes its address as a **[[hidden argument|return-slot]]**. The function's `return T{...}` constructs the object at that address. This was how compilers implemented RVO all along. C++17 made the language rules match what the machine was already doing.

::: example A type that cannot be copied or moved, returned by value
A handle to a block of hardware registers must never be copied: two handles to one device invite two drivers fighting over it. So both copy and move are deleted. In C++17 you can still write a factory function for it.

```cpp
#include <cstdio>

// A handle to a block of hardware registers. There is exactly one of these
// per device, so copying or moving one makes no sense: both are deleted.
class ImuPort {
public:
    explicit ImuPort(unsigned base) : base_(base) { std::printf("construct at %p\n", static_cast<void*>(this)); }
    ImuPort(const ImuPort&) = delete;
    ImuPort(ImuPort&&) = delete;
    ImuPort& operator=(const ImuPort&) = delete;
    ImuPort& operator=(ImuPort&&) = delete;
    unsigned base() const { return base_; }
private:
    unsigned base_;
};

ImuPort open_imu() {
    return ImuPort{0x4000'2000u};     // a prvalue: no object yet, only a recipe
}

int main() {
    ImuPort imu = open_imu();          // the recipe runs here, in main's storage
    std::printf("imu lives at %p, base 0x%X\n", static_cast<void*>(&imu), imu.base());
}
```

With `g++ -std=c++17 -Wall -Wextra -O2` it compiles cleanly and prints:

```text
construct at 0x7ffc303cd454
imu lives at 0x7ffc303cd454, base 0x40002000
```

The address changes from run to run (the operating system shuffles the stack's position on purpose), but the two lines always show the *same* address. The constructor ran with `this` already pointing at `main`'s variable `imu`. One object, built once, in its final home.

Now compile the same file with `-std=c++14`:

```text
el1.cpp: In function 'ImuPort open_imu()':
el1.cpp:18:12: error: use of deleted function 'ImuPort::ImuPort(ImuPort&&)'
   18 |     return ImuPort{0x4000'2000u};     // a prvalue: no object yet, only a recipe
      |            ^~~~~~~~~~~~~~~~~~~~~
el1.cpp:9:5: note: declared here
    9 |     ImuPort(ImuPort&&) = delete;
      |     ^~~~~~~
el1.cpp: In function 'int main()':
el1.cpp:22:28: error: use of deleted function 'ImuPort::ImuPort(ImuPort&&)'
   22 |     ImuPort imu = open_imu();          // the recipe runs here, in main's storage
      |                            ^
```

Two errors, one for each of the two moves the C++14 rules describe on paper: into the return value, and from it into `imu`. C++17 removed both from the rules, so the deleted move no longer matters.

Sanity check: nothing in the program calls a move, and in C++17 it runs; in C++14 it is rejected for moves that no optimising compiler would ever have performed. That gap is exactly what C++17 closed.
:::

The same rule rescues standard types that cannot move. `std::atomic<int> a = 0;` is an error in C++14 (`use of deleted function 'std::atomic<int>::atomic(const std::atomic<int>&)'`) and fine in C++17. A struct holding a `std::mutex` can be returned from a factory with `return Guarded{{}, 42};` in C++17, and not before.

## Named return values: NRVO is still optional

Most real functions do not return a bare `T{...}`. They build a named local, fill it in, and return it:

```cpp
Matrix6 propagate(const Matrix6& P, const Matrix6& F) {
    Matrix6 out{};
    // ... fill out ...
    return out;
}
```

`out` is an lvalue, not a prvalue, so the C++17 guarantee does not cover it. Compilers may still build `out` directly in the caller's return slot. That is **named return value optimisation**, **NRVO**, and it remains *allowed but not required*.

When NRVO does not happen, the language has a second safety net. In a `return` statement, a local variable (or a by-value parameter) is treated first as if it were an rvalue, so the **move** constructor is chosen if there is one. C++20 and C++23 widened this "implicit move" to a few more cases, but neither made NRVO mandatory. So returning a named local costs zero moves with NRVO, one move without it, and a copy only when the type cannot move at all.

A compiler cannot do NRVO when it cannot know, at the moment the local is created, that this local will be the one returned. That happens more often than you might think. Counting is the way to find out.

::: example Counting copies and moves for six ways to return
`Counted` counts every copy and every move. Six functions return one in six common ways.

```cpp
#include <cstdio>
#include <utility>

struct Counted {
    static inline int copies = 0, moves = 0;
    double data[4]{};
    Counted() = default;
    Counted(const Counted& o) { ++copies; for (int i = 0; i < 4; ++i) data[i] = o.data[i]; }
    Counted(Counted&& o) noexcept { ++moves; for (int i = 0; i < 4; ++i) data[i] = o.data[i]; }
};

Counted a_prvalue()            { return Counted{}; }                    // unnamed temporary
Counted b_one_name()           { Counted s; s.data[0] = 1; return s; }  // one named local
Counted c_two_names(bool f)    { Counted x, y; if (f) return x; return y; }
Counted d_parameter(Counted p) { return p; }                            // a function parameter
Counted e_std_move()           { Counted s; return std::move(s); }      // the "optimisation"
Counted f_ternary(bool f)      { Counted x, y; return f ? x : y; }      // a conditional

void reset() { Counted::copies = Counted::moves = 0; }
void report(const char* name, const Counted&) {
    std::printf("%-12s copies %d  moves %d\n", name, Counted::copies, Counted::moves);
}

int main() {
    reset(); { Counted r = a_prvalue();          report("a prvalue", r); }
    reset(); { Counted r = b_one_name();         report("b one name", r); }
    reset(); { Counted r = c_two_names(true);    report("c two names", r); }
    reset(); { Counted r = d_parameter(Counted{}); report("d parameter", r); }
    reset(); { Counted r = e_std_move();         report("e std::move", r); }
    reset(); { Counted r = f_ternary(true);      report("f ternary", r); }
}
```

Built three ways with g++ 13 (`-Wall -Wextra -O2` each time; the C++14 build also needs `-Wno-c++17-extensions`, because the counters are a C++17 `inline` variable), the counts are:

| Case | C++17 | C++17, `-fno-elide-constructors` | C++14, `-fno-elide-constructors` |
|---|---|---|---|
| a prvalue | 0 copies, 0 moves | 0, 0 | 0, 2 moves |
| b one name | 0, 0 | 0, 1 move | 0, 2 moves |
| c two names | 0, 1 move | 0, 1 move | 0, 2 moves |
| d parameter | 0, 1 move | 0, 1 move | 0, 3 moves |
| e std::move | 0, 1 move | 0, 1 move | 0, 2 moves |
| f ternary | 1 copy, 0 | 1 copy, 0 | 1 copy, 1 move |

(The plain C++17 column is the same at `-O0`, and clang++ 18 gives the same numbers: elision is not an optimisation-level thing.) Every build also printed one warning, about case e:

```text
el2.cpp:16:61: warning: moving a local object in a return statement prevents copy elision [-Wpessimizing-move]
```

Case by case:

- **a.** A prvalue. Zero, in every C++17 build: `-fno-elide-constructors` cannot touch it, because there is nothing optional to turn off. In C++14 with the flag you see the two paper moves from the start of the lesson.
- **b.** One named local, returned on every path. g++ does NRVO: zero. Turn optional elision off and the implicit move shows up: one move, never a copy.
- **c.** Two locals, and which one is returned depends on `f`. The compiler cannot build both in the one return slot, so NRVO is off; the implicit move gives 1 move.
- **d.** A by-value parameter. The *caller* built `p` before the function started, so the function cannot choose where it lives. Never elided; implicitly moved: 1 move.
- **e.** `return std::move(s);` The expression is now an xvalue, not the name of a local, so NRVO is forbidden, and you get 1 move where case b got 0. The "optimisation" made it worse, and `-Wall` says so.
- **f.** `return f ? x : y;` The conditional expression is an lvalue that is neither `x` nor `y` by name, so there is no implicit move: 1 **[[copy|ternary-copy]]**. Write `if (f) return x; return y;` and it becomes case c, a move.

Sanity check: across the whole table the only copy is case f, and the only extra moves in C++17 are cases where NRVO was impossible or blocked. Nothing ever costs more than one operation in C++17, which matches the rules above.
:::

::: warning Do not `std::move` a local on return
`return std::move(local);` never helps and can hurt: it forbids NRVO and forces a move. g++ flags it with `-Wpessimizing-move` (on in `-Wall`). Moving a by-value parameter on return is merely useless; `-Wextra` reports "redundant move in return statement [-Wredundant-move]". Write `return local;` and let the rules work. The one place `std::move` belongs in a return is moving out of a *member* or other non-local, where no implicit move applies.
:::

## Big objects: a Matrix and a 1 MiB state array

Why does any of this matter more for flight code than for a web server? Because of *where the data lives*.

A `std::vector<double>` of a million samples keeps its data on the heap. The vector object itself is three pointers. Moving it hands over those three pointers: 24 bytes, whatever the size of the data. So for a vector, a missed elision costs almost nothing.

Flight code avoids the heap, so its big objects keep their data *inside* the object. A $6 \times 6$ covariance matrix of `double`s from the templates module (lesson 02) is a `std::array` of 36 doubles, $36 \times 8 = 288$ bytes, inside the `Matrix` object. A block of state history might be a `std::array<double, 131072>`: $131072 \times 8 = 1\,048\,576$ bytes, exactly 1 **[[MiB|mebibyte]]**. For types like these, **moving is copying**: there is no pointer to steal, so the move constructor copies every element. The only way to avoid touching all 288 bytes, or all 1 MiB, is elision.

::: example Returning a 1 MiB state array
```cpp
#include <array>
#include <chrono>
#include <cstdint>
#include <cstdio>

constexpr std::size_t N = 131'072;              // 131072 doubles = 1 MiB
using State = std::array<double, N>;

std::uintptr_t g_inside = 0;                     // where the callee built it

State propagate(double t) {                      // returns a named local: NRVO
    State s;
    for (std::size_t i = 0; i < N; ++i) s[i] = t + static_cast<double>(i);
    g_inside = reinterpret_cast<std::uintptr_t>(&s);
    return s;
}

int main() {
    std::printf("sizeof(State) = %zu bytes\n", sizeof(State));
    State* x = new State(propagate(0.5));         // on the heap, not the stack
    std::printf("built in place: %s\n", g_inside == reinterpret_cast<std::uintptr_t>(x) ? "yes" : "no");
    std::printf("x[10] = %.1f\n", (*x)[10]);

    // What a real copy would cost: copy the whole array 1000 times.
    State* y = new State;
    auto t0 = std::chrono::steady_clock::now();
    for (int k = 0; k < 1000; ++k) {
        *y = *x;
        (*x)[k] += 1.0;                            // stop the loop being folded away
    }
    auto t1 = std::chrono::steady_clock::now();
    double us = std::chrono::duration<double, std::micro>(t1 - t0).count() / 1000.0;
    std::printf("one 1 MiB copy: about %.0f microseconds\n", us);
    std::printf("check: y[0] = %.1f\n", (*y)[0]);
    delete x;
    delete y;
}
```

With `g++ -std=c++20 -Wall -Wextra -O2`, one run printed:

```text
sizeof(State) = 1048576 bytes
built in place: yes
x[10] = 10.5
one 1 MiB copy: about 42 microseconds
check: y[0] = 1.5
```

Step by step:

1. **The size.** $131072 \times 8 = 1\,048\,576$ bytes, as computed above.
2. **Where it was built.** `new State(propagate(0.5))` initialises the heap object from a prvalue, the call. So the heap memory is the return slot. Inside `propagate`, g++ applied NRVO and built `s` *in that heap memory*: the address recorded inside the function equals `x`. Zero bytes were copied to return a megabyte.
3. **The values.** Element 10 is $0.5 + 10 = 10.5$. Correct.
4. **The price of not eliding.** The timing loop copies 1 MiB a thousand times. On this machine one copy took about 42 microseconds; it varies with the machine and from run to run (three runs gave 39 to 42). A 1 kHz control cycle has 1000 microseconds in total, so one stray copy would eat about 4% of it on a fast desktop, and far more on a slower flight processor.
5. **The check line.** `y[0]` is $0.5 + 1 = 1.5$, because the first pass of the loop added 1 to `x[0]` after copying, and later passes copied that. It is printed so the optimiser must keep the copies.

Build the same file with `-fno-elide-constructors` and the second line becomes `built in place: no`: without NRVO, `s` is built in the function's own frame and then "moved" — for a `std::array`, copied — into the heap object.
:::

::: warning Built in place still means built somewhere
Elision decides *which* storage the object is built in: the caller's. If the caller writes `State s = propagate(0.5);` inside a function, that storage is 1 MiB of stack. This machine's main thread has 8 MiB of stack (`ulimit -s` prints 8192, in KiB). A task on a small real-time operating system often has a few KiB. So flight code keeps objects this size in static storage, allocated once before the mission starts, and fills them through a reference or a `std::span`. Return-by-value is free; the place you return *into* must still be one you can afford.
:::

For the $6 \times 6$ matrix the picture is friendlier. 288 bytes fits on any stack, and a function like `Matrix6 operator*(const Matrix6&, const Matrix6&)` that builds a named result and returns it gets NRVO from g++ and clang in practice. If you want the guarantee rather than the likelihood, write the function so it returns a prvalue — for example, `return Matrix6{...};` from a helper that computes the elements.

## Seeing it for yourself: `-fno-elide-constructors`

The flag is a teaching tool, not a production setting. It tells GCC and Clang to stop doing any elision the standard makes *optional*. In C++17 and later that means NRVO and a couple of rarer cases. It cannot remove the prvalue rules, because under those rules there is no copy to reinstate.

Two practical uses:

- **Learning and reviewing.** Build a test with it, count, and you see the worst case the language allows, as in the table above.
- **Checking a class.** If a class behaves differently with the flag, its copy or move constructor has a side effect that the program secretly relies on never running. That is a bug waiting for a different compiler.

## Check yourself

::: check
Which of these compile in C++17 if `Port` has both its copy and move constructors deleted? Why?

```cpp
Port a() { return Port{1}; }
Port b() { Port p{1}; return p; }
```
:::

::: answer
`a` compiles: `Port{1}` is a prvalue, so the returned object is built directly in the caller's storage and no copy or move is needed. `b` does not: `p` is a named local, so its return is only eligible for NRVO, which is optional. The language still needs a move or copy constructor in case the compiler does not elide, finds both deleted, and reports "use of deleted function".
:::

::: check
A colleague writes `return std::move(result);` at the end of a function that builds a named local `result` of type `std::array<double, 4096>`. What does that cost compared with `return result;`, and what will g++ say?
:::

::: answer
With `return result;`, g++ normally applies NRVO: `result` is built in the caller's storage, 0 bytes copied. With `std::move`, the return expression is an xvalue, not the local's name, so NRVO is forbidden and the move constructor runs. For a `std::array` of doubles a move copies every element: $4096 \times 8 = 32\,768$ bytes. `-Wall` reports "moving a local object in a return statement prevents copy elision [-Wpessimizing-move]".
:::

::: check
Why can a function never elide the return of its own by-value parameter?
:::

::: answer
The caller constructs the argument before the function begins, in storage the caller chose. The return slot is different storage, also chosen by the caller. The function cannot make one object occupy both places, so NRVO is impossible. The language does the next best thing: it treats the parameter as an rvalue in the `return`, so it is moved rather than copied.
:::

::: check
With `-std=c++17 -fno-elide-constructors`, how many moves does `Counted r = make();` perform when `make` is `return Counted{};`? And when `make` is `Counted c; return c;`?
:::

::: answer
Zero for the first: the prvalue rule is not an optional elision, so the flag cannot turn it off. One for the second: the flag disables NRVO, so `c` is built in `make`'s own frame and then moved (by the implicit move on return) into `r`. The move from the return value into `r` does not exist in either case, because `make()` is itself a prvalue.
:::

::: check
Two functions return a `std::vector<double>` holding a million samples, and a `std::array<double, 1000000>`. NRVO fails in both (two different locals are returned on different paths). Roughly how many bytes does each return move, on a 64-bit machine?
:::

::: answer
The vector's move hands over its three internal pointers, 24 bytes, no matter how many elements. The array's move copies every element, because they live inside the object: $1\,000\,000 \times 8 = 8\,000\,000$ bytes, about 8 MB. For in-object data, elision is the only thing that makes returning cheap.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Copy elision | leaving out a copy or move | since C++98 allowed; since C++17 required for prvalues |
| prvalue | a recipe, not yet an object | `T{...}`, `f()` returning `T`; initialises its final object directly |
| Guaranteed elision | `return T{...};`, `T x = f();` | zero copies, zero moves; type need not be movable |
| NRVO | eliding `return local;` | allowed, not required; falls back to an implicit move |
| No NRVO possible | two locals, a parameter | one move |
| Copies on return | `cond ? a : b`, a member | a copy; write `if`/`return` instead |
| `return std::move(x)` | pessimizing | blocks NRVO; `-Wpessimizing-move` in `-Wall` |
| In-object data | `std::array`, fixed `Matrix` | move = copy; 1 MiB copy about 40 µs on one machine |
| `-fno-elide-constructors` | turn off optional elision | shows NRVO's absence; cannot touch prvalue elision |

Next lesson is C++20, the biggest update since C++11: concepts, ranges, `std::span`, `std::format`, the spaceship operator and designated initialisers, with a first look at modules and coroutines.

::: context rvo-history RVO is older than you might think
Compilers were allowed to skip the copy on return from the first standard, C++98, and the idea is older still. What C++17 changed was not the optimisation but the rules: the program no longer needs a copy or move constructor that is never called. The proposal that did it, P0135, is titled "Wording for guaranteed copy elision through simplified value categories", which describes the trick: redefine prvalues, and the copies vanish from the rules.
:::

::: context value-category The value-category family tree
Every expression is exactly one of three leaf kinds. The two middle words group them: a **glvalue** ("generalised lvalue") has an identity, a place in memory; an **rvalue** may be moved from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="8" width="80" height="26" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="26" font-size="12" fill="#1f2a44" text-anchor="middle">expression</text>
  <rect x="60" y="56" width="80" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="100" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">glvalue</text>
  <rect x="220" y="56" width="80" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="260" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">rvalue</text>
  <line x1="165" y1="34" x2="110" y2="56" stroke="#1f2a44"/><line x1="195" y1="34" x2="250" y2="56" stroke="#1f2a44"/>
  <rect x="10" y="108" width="80" height="26" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="50" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">lvalue: r</text>
  <rect x="130" y="108" width="100" height="26" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">xvalue: move(r)</text>
  <rect x="265" y="108" width="85" height="26" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="307" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">prvalue: T{}</text>
  <line x1="90" y1="82" x2="55" y2="108" stroke="#1f2a44"/><line x1="110" y1="82" x2="170" y2="108" stroke="#1f2a44"/>
  <line x1="250" y1="82" x2="190" y2="108" stroke="#1f2a44"/><line x1="270" y1="82" x2="300" y2="108" stroke="#1f2a44"/>
</svg>
```

The xvalue sits under both: it has a home, and you may steal from it.
:::

::: context materialisation When a recipe must become a thing
A prvalue stays a recipe until something needs an actual object. Binding it to a reference (`const T& r = make();`), calling a member function on it (`make().size()`), or throwing it away as a statement (`make();`) all need one. At that point the compiler creates a temporary and runs the recipe into it: the temporary materialisation conversion. When the prvalue is used to initialise a `T`, no temporary is ever needed.
:::

::: context return-slot The hidden address
On a typical 64-bit Linux machine (the x86-64 System V calling convention), a function returning a struct too big for registers receives a hidden first argument: the address where the caller wants the result. The function builds its object there and hands the same address back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">caller's frame</text>
  <rect x="20" y="26" width="140" height="100" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="32" y="60" width="116" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">State s (reserved)</text>
  <text x="270" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">propagate()</text>
  <rect x="200" y="26" width="140" height="100" fill="#ffffff" stroke="#1f2a44"/>
  <text x="270" y="60" font-size="12" fill="#1f2a44" text-anchor="middle">hidden arg:</text>
  <text x="270" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">address of s</text>
  <text x="270" y="104" font-size="11" fill="#6c7a93" text-anchor="middle">builds the result there</text>
  <line x1="200" y1="80" x2="152" y2="80" stroke="#b4232c" stroke-width="2"/>
  <polygon points="150,80 160,75 160,85" fill="#b4232c"/>
  <text x="180" y="144" font-size="11" fill="#6c7a93" text-anchor="middle">one object, written once, in the caller's space</text>
</svg>
```
:::

::: context ternary-copy Why the conditional copies
`f ? x : y` is a new expression. When both sides are lvalues of the same type, the result is an lvalue referring to one of them. The implicit move on return applies only when the returned expression is the plain name of a local or parameter, and a conditional is not a name. So the copy constructor is chosen. Splitting it into two `return` statements gives each one a plain name.
:::

::: context mebibyte MB or MiB?
A megabyte (MB) is $10^6$ bytes, in SI style. A mebibyte (MiB) is $2^{20} = 1\,048\,576$ bytes, the power of two that memory sizes come in naturally. The difference is about 5%. This lesson's array is exactly 1 MiB, about 1.05 MB. Tools disagree about which one they print, so when a number matters, check.
:::
