---
id: l05-move-semantics
title: Moving objects instead of copying them
minutes: 24
covers:
  - Move constructor and move assignment; noexcept on moves and why containers check it
---

When a family moves house, nobody builds a copy of every chair and bed at the new address and then burns the originals. A truck carries the same furniture across town. The old house ends up empty, and that is fine, because nobody is going to live there anymore.

Last lesson's deep copy is the "build a copy of every chair" plan. It is the right plan when the original will keep being used. It is a waste when the original is about to be thrown away, and C++ throws objects away all the time: temporaries at the end of a line, local variables handed back from a function, elements left behind when a `std::vector` grows into a bigger block. For those, the sensible thing is to load the truck: let the new object take the old one's heap block, and leave the old one empty.

That is **move semantics** — building or overwriting an object by taking over another object's resources instead of copying them. It [[arrived in C++11|history]], and it is why a modern C++ program can pass around a vector of a million samples as cheaply as a pointer. It comes with two functions, the **move constructor** and the **move assignment operator**, one small cast called `std::move`, and one keyword, `noexcept`, whose absence can quietly turn all your moves back into copies.

## Things with a name, and things about to vanish

Lesson 04 of the memory module sorted every expression into two kinds. Here they are again, in plain words.

An **lvalue** is an expression that names an object with a home: a variable, an array element, `*p`. You could take its address. Someone may use it again on the next line, so it is not safe to empty it.

An **[[rvalue|xvalue]]** is a value with no lasting home: a literal like `3`, the result of `a + b`, a function that returns by value, a temporary like `Buffer(4)`. When the full line finishes, it is gone. Nobody can ever look at it again, so emptying it harms no one.

C++ lets a function tell the two apart through the kind of reference it takes. `const T&` binds to anything, lvalue or rvalue. `T&&` binds only to rvalues. Read `T&&` aloud as "T double-ampersand" or "an rvalue reference to T". A function that takes `T&&` is really saying: "I will only ever be handed something that is about to vanish, so I may gut it."

When both overloads exist, an lvalue can only go to `const T&`, while an rvalue could go to either and the rules prefer `T&&`.

::: key
An lvalue names an object with a home that may be used again; an rvalue is a temporary about to vanish. `T&&` (an rvalue reference) binds only to rvalues. When `f(const T&)` and `f(T&&)` both exist, an rvalue argument picks `f(T&&)`.
:::

## The move constructor

Here is the move constructor for last lesson's `Buffer`, the class that owns `n_` doubles through `double* data_`:

```cpp
Buffer(Buffer&& other) noexcept
    : n_(other.n_), data_(other.data_) {   // take the block
    other.n_ = 0;                           // leave the source empty
    other.data_ = nullptr;                  // so its destructor frees nothing
}
```

Read the first line as "Buffer, taking an rvalue reference to another Buffer, noexcept". The `noexcept` gets its own section later.

There are three steps, and they are the whole idea:

1. **Take the pointer.** The new object copies `other.data_`, the address. That is one 8-byte copy, no matter whether the block holds 4 doubles or 4 million. No `new`, no loop.
2. **Take the size.** Same with `n_`.
3. **Empty the source.** Set `other.data_` to `nullptr` and `other.n_` to 0. This step is what makes it a **[[move rather than a shallow copy|move-picture]]**. Last lesson, a shallow copy left two owners of one block and the program crashed. Here the source gives up ownership, so there is still exactly one owner. When the emptied source is destroyed, it runs `delete[] nullptr`, which the language defines to do nothing.

Compare the cost. Copying a 1,000-element `Buffer` meant a heap allocation plus 8,000 bytes of element copies. Moving it copies two numbers and writes two zeros, whatever the size.

## Move assignment

Move assignment is to the move constructor what copy assignment was to the copy constructor: the object on the left already exists and already owns a block, so it must release that first.

```cpp
Buffer& operator=(Buffer&& other) noexcept {
    if (this != &other) {
        delete[] data_;                     // 1. release what I own
        data_ = other.data_;                // 2. take theirs
        n_ = other.n_;
        other.data_ = nullptr;              // 3. leave them empty
        other.n_ = 0;
    }
    return *this;
}
```

Freeing first is safe here, unlike in copy assignment, because nothing after the `delete[]` can fail: there is no allocation to throw. The self-check guards `a = std::move(a);`, which would otherwise free the block and then adopt the freed address. Under AddressSanitizer, a `Buffer` with both move functions runs clean, and after `Buffer b = std::move(a);` the address in `b` is the one `a` used to hold.

## A move-only file handle

Some things should never be copied at all. An open file is one: if two objects both held the same `FILE*`, both destructors would call `fclose` on it, the double free of the file world. But handing the file from one owner to another is perfectly sensible, for example returning it from the function that opened it. A type that can be moved but not copied is called **[[move-only|move-only]]**. `std::unique_ptr` from the memory module is the standard example, and you will build one in this module's first exercise.

The recipe: delete the two copy functions (`= delete` makes them unusable; lesson 06 covers it in full) and write the two move functions.

::: example FileHandle: one owner, handed along
```cpp
#include <cstdio>
#include <utility>

class FileHandle {
public:
    FileHandle() = default;
    FileHandle(const char* path, const char* mode) : f_(std::fopen(path, mode)) {}
    ~FileHandle() { reset(); }

    FileHandle(const FileHandle&) = delete;             // no copies: one owner
    FileHandle& operator=(const FileHandle&) = delete;

    FileHandle(FileHandle&& other) noexcept : f_(other.f_) {
        other.f_ = nullptr;                             // source gives up the FILE*
    }
    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) {
            reset();                                    // close what I had
            f_ = other.f_;                              // take theirs
            other.f_ = nullptr;                         // leave them empty
        }
        return *this;
    }

    bool valid() const { return f_ != nullptr; }
    std::FILE* get() const { return f_; }

private:
    void reset() {
        if (f_) { std::fclose(f_); std::puts("  file closed"); f_ = nullptr; }
    }
    std::FILE* f_{nullptr};
};

FileHandle open_log() {
    FileHandle h("telemetry.log", "w");
    std::fputs("boot\n", h.get());
    return h;                                           // moved (or elided) out
}

int main() {
    FileHandle a = open_log();
    std::printf("a valid: %d\n", a.valid());

    FileHandle b = std::move(a);                        // move constructor
    std::printf("after move: a valid: %d, b valid: %d\n", a.valid(), b.valid());

    FileHandle c("events.log", "w");
    std::puts("c = std::move(b):");
    c = std::move(b);                                   // move assignment
    std::printf("b valid: %d, c valid: %d\n", b.valid(), c.valid());
    std::puts("end of main");
}
```

Output:

```text
a valid: 1
after move: a valid: 0, b valid: 1
c = std::move(b):
  file closed
b valid: 0, c valid: 1
end of main
  file closed
```

Follow the one `FILE*` for `telemetry.log`. `open_log` opened it and returned it, and `a` ended up owning it. `FileHandle b = std::move(a);` ran the move constructor: `b` took the pointer and `a` became empty, so `a valid: 0`. Then `c`, which already owned `events.log`, was move-assigned from `b`. Its `reset()` closed `events.log` (the first "file closed"), took `telemetry.log` from `b`, and emptied `b`. At the end of `main` the three objects are destroyed. `a` and `b` hold `nullptr` and close nothing; `c` closes `telemetry.log` (the second "file closed").

Sanity check: two files were opened, and "file closed" appears exactly twice.

If you try to copy one, `FileHandle d = c;`, g++ refuses:

```text
error: use of deleted function 'FileHandle::FileHandle(const FileHandle&)'
```
:::

## The moved-from object

After a move, the source still exists. It will be destroyed later, and you might assign to it again. So it has to be in some sensible state. What state is that?

For the standard library, the rule is **[[valid but unspecified|valid-unspecified]]**. "Valid" means every operation without preconditions still works: you can destroy it, assign a new value to it, ask its `size()`. "Unspecified" means you are not told what value it holds. A moved-from `std::string` is usually empty in practice, but the standard does not promise it. A few types do promise: a moved-from `std::unique_ptr` is guaranteed to be null.

For your own classes, you decide, and the honest choice is usually "empty", as `Buffer` and `FileHandle` do. Then write that down, and give the class a way to ask, like `valid()`.

::: warning Do not read a moved-from object
After `auto b = std::move(a);`, treat `a` as a box whose contents were taken. You may throw it away (let it be destroyed) or refill it (`a = something;`). Do not read it and expect the old value. Code that "works" because a moved-from `std::string` happened to still hold its text on one compiler will break on another.
:::

## `std::move` moves nothing

Here is the surprising part. In `FileHandle b = std::move(a);`, `std::move` did not do the moving. The move constructor did.

`std::move(x)` is a **cast**: it converts `x` into an rvalue reference, exactly as if you had written `static_cast<T&&>(x)`. That is all it does. It generates no instructions of its own. Its only effect is to change *which overload* the compiler picks, from the one that takes `const T&` to the one that takes `T&&`. It is you saying, "treat this named object as if it were about to vanish; I promise not to rely on its value afterwards."

The function that receives it decides what happens. A move constructor takes the resources. If no move constructor exists, the rvalue binds to `const T&` and a copy is made; nothing is stolen.

::: example Watching a cast do nothing, and then do something
```cpp
#include <cstdio>
#include <utility>

struct Tracer {
    Tracer() = default;
    Tracer(const Tracer&) { std::puts("  COPY"); }
    Tracer(Tracer&&) noexcept { std::puts("  MOVE"); }
};

void take(Tracer&&) { std::puts("  take(Tracer&&) chosen"); }
void take(const Tracer&) { std::puts("  take(const Tracer&) chosen"); }

int main() {
    Tracer t;
    const Tracer ct;

    std::puts("1: std::move(t) alone, result unused");
    std::move(t);                             // nothing printed: no move happened

    std::puts("2: take(t) and take(std::move(t))");
    take(t);
    take(std::move(t));

    std::puts("3: Tracer a = std::move(t);");
    [[maybe_unused]] Tracer a = std::move(t);

    std::puts("4: Tracer b = static_cast<Tracer&&>(t);");
    [[maybe_unused]] Tracer b = static_cast<Tracer&&>(t);      // exactly what std::move does

    std::puts("5: Tracer c = std::move(ct);   // ct is const");
    [[maybe_unused]] Tracer c = std::move(ct);
}
```

(`[[maybe_unused]]` tells the compiler we know `a`, `b` and `c` are never read, so it does not warn.) The compiler does warn about line 1:

```text
warning: ignoring return value of 'constexpr typename std::remove_reference<_Tp>::type&& std::move(_Tp&&) [with _Tp = Tracer&; ...]', declared with attribute 'nodiscard' [-Wunused-result]
```

And the program prints:

```text
1: std::move(t) alone, result unused
2: take(t) and take(std::move(t))
  take(const Tracer&) chosen
  take(Tracer&&) chosen
3: Tracer a = std::move(t);
  MOVE
4: Tracer b = static_cast<Tracer&&>(t);
  MOVE
5: Tracer c = std::move(ct);   // ct is const
  COPY
```

Case by case. **1:** `std::move(t)` on its own printed nothing. The cast happened, its result was thrown away, and no constructor ran. The library marks `std::move` as **[[nodiscard|nodiscard]]**, which is why g++ warned. **2:** the same object `t` reached two different overloads; the cast alone changed the choice. **3 and 4:** identical output, because `std::move(t)` *is* `static_cast<Tracer&&>(t)`. (`t` is moved from twice here; that is harmless only because `Tracer` holds nothing.) **5:** `ct` is `const`. `std::move(ct)` produces a `const Tracer&&`, and the move constructor takes a plain `Tracer&&`, which cannot bind to something `const`, since moving means changing the source. The only constructor left that accepts it is the copy constructor, `const Tracer&`. So "moving" a `const` object copies it, silently.

Sanity check: count the constructor lines. Three objects were built from `t` or `ct` (`a`, `b`, `c`), and there are three lines: MOVE, MOVE, COPY. Case 1 built nothing and printed nothing.
:::

::: key
`std::move` is an unconditional cast to an rvalue reference, the same as `static_cast<T&&>(x)`. It moves nothing by itself; it makes the expression eligible to bind to a move constructor or move assignment, which then steals the resources. If no move-enabled overload exists (or the object is `const`), the expression binds to a copy and nothing is stolen.
:::

::: warning Three ways `std::move` misleads
**Moving a `const` object copies it,** as case 5 showed. **A named rvalue reference is an lvalue:** inside `Frame(Frame&& o)`, the name `o` has a home, so to move a member onward you must write `std::move(o.samples)` again, or it is copied. **Do not write `return std::move(local);`**: returning a local already moves it or builds it in place, and the cast blocks that. g++'s `-Wall` catches this one with "moving a local object in a return statement prevents copy elision [-Wpessimizing-move]".
:::

## Why moves should be `noexcept`

Now the keyword we set aside. **`noexcept`** on a function is a promise that it will never throw an exception. A move constructor that only copies pointers and writes zeros cannot fail, so the promise is easy to keep. Why does it matter? Because of how `std::vector` grows.

A `std::vector` keeps its elements in one heap block with some spare room, called its **capacity**. When you add an element and the block is full, the vector performs a **[[reallocation|reallocation]]**: it gets a bigger block (the GNU library doubles the capacity), puts every existing element into the new block, destroys the old elements, and frees the old block. "Puts every element into the new block" means one copy or move per element.

Moving is the obvious choice. But `push_back` makes a promise of its own: if it fails, the vector is left exactly as it was — the strong exception guarantee from last lesson. Picture a move that can throw. The vector has moved elements 0, 1 and 2 into the new block, emptying the originals, and the move of element 3 throws. Now the old block holds three gutted elements and the new block holds half a vector. Moving them back could throw too. There is no way to put things back, and the promise is broken.

With copies, the problem disappears. If copying element 3 throws, the originals are untouched: the vector destroys the three new copies, frees the new block, and it is as if nothing happened.

So the vector uses a helper, **`std::move_if_noexcept`**: during reallocation it moves an element only if the element's move constructor is `noexcept` (or if the type cannot be copied at all, so there is no safer choice). Otherwise it copies. A move constructor without `noexcept` is, from the vector's point of view, a move that might throw, so it is not used.

::: example Counting copies and moves as a vector grows
One small class counts every copy and every move. A **template parameter**, written `template <bool NoThrow>`, is a value filled in at compile time, so `Probe<true>` and `Probe<false>` are two separate classes; the templates module covers them properly. Here it switches `noexcept` on or off, so we can compare the two in one program. `noexcept(NoThrow)` is `noexcept` with a condition: it promises no exceptions when `NoThrow` is `true`, and promises nothing when it is `false`.

```cpp
#include <cstdio>
#include <vector>

static int copies = 0;
static int moves = 0;

template <bool NoThrow>
struct Probe {
    Probe() = default;
    Probe(const Probe&) { ++copies; }
    Probe(Probe&&) noexcept(NoThrow) { ++moves; }
};

template <bool NoThrow>
void grow(const char* label) {
    copies = moves = 0;
    std::vector<Probe<NoThrow>> v;
    int reallocations = 0;
    for (int i = 0; i < 1000; ++i) {
        const auto cap = v.capacity();
        v.emplace_back();                    // build in place: no copy, no move
        if (v.capacity() != cap) ++reallocations;
    }
    std::printf("%-22s reallocations %2d  copies %4d  moves %4d\n",
                label, reallocations, copies, moves);
}

int main() {
    grow<true>("move is noexcept:");
    grow<false>("move may throw:");
}
```

`emplace_back()` builds each new element directly inside the vector, so adding an element costs nothing. Every copy or move counted comes from reallocation. Output:

```text
move is noexcept:      reallocations 11  copies    0  moves 1023
move may throw:        reallocations 11  copies 1023  moves    0
```

Check the numbers by hand. The capacity went 0, 1, 2, 4, 8, and so on up to 1024: that is 11 changes. The first one (0 to 1) had nothing to relocate. The other ten relocated everything that was there: $1 + 2 + 4 + \dots + 512$ elements. That is a doubling sum, $2^{10} - 1 = 1023$. Both runs relocated 1023 elements, exactly as predicted. The only difference is how: all moves with `noexcept`, all copies without it. The move constructor in the second run exists and works perfectly. The vector refused to use it.

What does that cost? A second version gave each element a `std::vector<double>` of 100 samples (800 bytes) and added 100,000 of them. On one machine, over three runs, growth took about 22 to 34 ms with a `noexcept` move and about 67 to 77 ms without it, roughly two to three times slower, because each copy is a heap allocation plus 800 bytes. Timings vary a lot between machines; the counts do not.
:::

::: key
`std::vector` reallocation uses `move_if_noexcept`: if the move constructor is not `noexcept`, it copies instead, to keep the strong exception guarantee (a throwing move halfway through would leave the vector broken, half moved). A missing `noexcept` silently turns your moves back into copies. Mark move constructors and move assignments `noexcept`.
:::

You can make the compiler check your promise with one line after the class:

```cpp
static_assert(std::is_nothrow_move_constructible_v<FileHandle>);
```

Read it as "assert at compile time that FileHandle is nothrow move constructible". It needs `#include <type_traits>`. If someone later removes the `noexcept`, the build fails instead of the vector quietly slowing down.

::: note Why the compiler cannot guess
Could the vector not check whether the move constructor *actually* throws? Not in general: a function body can call anything, and often the compiler cannot see it. `noexcept` is part of the declaration precisely so that other code can ask about it at compile time: `std::is_nothrow_move_constructible_v<T>` reads it, and `move_if_noexcept` is built on that. The good news is that a move constructor the compiler writes for you is `noexcept` automatically whenever all the members' moves are. `std::vector`, `std::string` and `std::unique_ptr` all have `noexcept` moves, so a class made of them gets fast growth for free. The trap is only in moves you write by hand.
:::

Flight software usually calls `reserve()` once at start-up so a vector never reallocates in flight. Moves still matter there: a telemetry frame handed from a sensor task to a downlink queue, a file handle passed to the logger that will own it. A **[[transfer of ownership|ownership-handoff]]** that costs two pointer writes is what makes those designs cheap.

## Check yourself

::: check
Which constructor does each line call, if `Buffer` has both copy and move constructors? `Buffer a(8);` then (a) `Buffer b = a;` (b) `Buffer c = Buffer(8);` (c) `Buffer d = std::move(a);` (d) `const Buffer e(8); Buffer f = std::move(e);`
:::

::: answer
(a) Copy constructor: `a` is an lvalue, so only `const Buffer&` accepts it. (b) Neither: since C++17, a temporary of the same type initialises `c` directly, so only the ordinary `Buffer(std::size_t)` constructor runs. (c) Move constructor: `std::move(a)` casts `a` to `Buffer&&`, which prefers the move constructor. Afterwards `a` is empty. (d) Copy constructor: `std::move(e)` gives `const Buffer&&`, which cannot bind to `Buffer&&`, so the copy constructor takes it. `e` is unchanged.
:::

::: check
In `Buffer(Buffer&& other) noexcept : n_(other.n_), data_(other.data_) {}` the author forgot the body that sets `other.data_ = nullptr`. What happens when both objects are destroyed?
:::

::: answer
Without emptying the source, this is last lesson's shallow copy with a different name. Both objects hold the same address. The first destructor frees the block; the second calls `delete[]` on the same address, a double free. The "empty the source" step is what turns a pointer copy into a transfer of ownership, and it is not optional.
:::

::: check
A colleague writes a telemetry class with a hand-written move constructor that is correct but lacks `noexcept`, and stores 50,000 of them in a `std::vector` without `reserve`. Using the doubling rule, how many element copies happen during growth, and what one-word change turns them into moves?
:::

::: answer
The capacity doubles through 1, 2, 4, …, 32,768, then to 65,536, which holds 50,000. Each reallocation copies everything present: $1 + 2 + \dots + 32768 = 2^{16} - 1 = 65535$ copies in total (the first allocation, from 0 to 1, relocates nothing). Because the move constructor might throw, `move_if_noexcept` picks the copy constructor every time. Adding `noexcept` to the move constructor turns all 65,535 copies into moves. (Calling `reserve(50000)` first would remove the relocations altogether.)
:::

::: check
Why is it safe for move assignment to free its old block first, when the previous lesson said copy assignment must allocate first?
:::

::: answer
The danger in copy assignment was a step that can fail, the `new`, coming after the old block had been freed. Move assignment has no allocation: it frees, then copies a pointer and a size, then writes `nullptr` and 0. None of those can throw, which is exactly why it can be `noexcept`. The only remaining danger is self-move, `a = std::move(a)`, where freeing first would free the block you are about to adopt, and the `this != &other` check handles that.
:::

::: check
Explain in two sentences why `std::move` can be called a "request" rather than an "action".
:::

::: answer
`std::move(x)` only casts `x` to an rvalue reference, so its whole effect is to ask the compiler to pick a `T&&` overload if one exists. Whether anything is moved is decided by the function that receives it: a move constructor steals, while a class with only a copy constructor (or a `const` object) copies, and nothing is taken.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| lvalue / rvalue | named object with a home / temporary about to vanish | `T&&` binds only to rvalues; an rvalue prefers `f(T&&)` over `f(const T&)` |
| Move constructor | build a new object by taking another's resources | `T(T&& other) noexcept`: take the pointer, then empty the source |
| Move assignment | release own resources, take another's | `T& operator=(T&& other) noexcept`, with a self-move check |
| Moved-from state | what the source holds afterwards | valid but unspecified for the standard library; destroy or reassign it, do not read it |
| Move-only type | movable, not copyable | delete the copy pair, write the move pair; `FileHandle`, `std::unique_ptr` |
| `std::move` | a cast, not a move | same as `static_cast<T&&>(x)`; on a `const` object it produces a copy |
| `noexcept` on moves | a promise not to throw | vector reallocation uses `move_if_noexcept`; without `noexcept` it copies |
| Growth cost | relocations as a vector doubles to 1024 | $2^{10} - 1 = 1023$ elements moved, or copied without `noexcept` |

Next lesson: you have now seen six special member functions. The compiler writes some of them for you and silently drops others, and one innocent destructor can cost you every move in this lesson. Lesson 06 lays out exactly when each is generated, and how `= default` and `= delete` let you take control.

::: context history Where moves came from
Before C++11, returning a big container from a function or growing a vector of strings meant copying, and programmers wrote contorted code (output parameters, swap tricks) to avoid it. The proposal that became move semantics, "A Proposal to Add Move Semantics Support to the C++ Language", was written in 2002 by Howard Hinnant, Peter Dimov and Dave Abrahams. It took until the C++11 standard to arrive, together with rvalue references, `std::move`, and move-aware versions of every standard container. Lesson 06's table of which special members the compiler generates is usually credited to Hinnant as well.
:::

::: context xvalue Three kinds of value, not two
The standard splits rvalues further. A **prvalue** ("pure rvalue") is a value that is not yet an object anywhere: `3`, `a + b`, `Buffer(4)` before it is used. An **xvalue** ("expiring value") is an object that does have a home but has been marked as finished with, and `std::move(x)` is exactly what produces one. Both are rvalues, so both bind to `T&&`. For everyday code "lvalue or rvalue" is enough; the finer names show up in compiler errors and in the standard. An xvalue counts both as a "glvalue" (it has an identity) and as an rvalue (it may be moved from).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="8" width="100" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="26" font-size="12" fill="#1f2a44" text-anchor="middle">expression</text>
  <rect x="50" y="52" width="90" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">glvalue</text>
  <rect x="220" y="52" width="90" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">rvalue</text>
  <rect x="10" y="96" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="114" font-size="12" fill="#1f2a44" text-anchor="middle">lvalue</text>
  <rect x="135" y="96" width="90" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="114" font-size="12" fill="#1f2a44" text-anchor="middle">xvalue</text>
  <rect x="260" y="96" width="90" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="114" font-size="12" fill="#1f2a44" text-anchor="middle">prvalue</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="160" y1="34" x2="110" y2="52"/><line x1="200" y1="34" x2="250" y2="52"/>
    <line x1="80" y1="78" x2="60" y2="96"/><line x1="115" y1="78" x2="165" y2="96"/>
    <line x1="245" y1="78" x2="195" y2="96"/><line x1="285" y1="78" x2="300" y2="96"/>
  </g>
</svg>
```
:::

::: context move-picture What a move looks like in memory
Before the move, `a` owns the heap block. The move constructor copies the address into `b` and then writes `nullptr` into `a`. The block itself never moves and is never copied; only the arrow changes hands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">before</text>
  <text x="270" y="16" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">after b = std::move(a)</text>
  <line x1="180" y1="8" x2="180" y2="174" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="30" y="34" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="60" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="40" y="126" width="100" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="146" font-size="12" fill="#1f2a44" text-anchor="middle">1000 doubles</text>
  <line x1="60" y1="70" x2="78" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="80,126 73,118 82,116" fill="#1d6fd1"/>
  <rect x="200" y="34" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="230" y="64" font-size="11" fill="#b4232c" text-anchor="middle">nullptr</text>
  <rect x="280" y="34" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="310" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="220" y="126" width="100" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="146" font-size="12" fill="#1f2a44" text-anchor="middle">1000 doubles</text>
  <line x1="310" y1="70" x2="292" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="290,126 288,116 297,118" fill="#1d6fd1"/>
  <text x="270" y="172" font-size="11" fill="#6c7a93" text-anchor="middle">same block, same address, one owner</text>
</svg>
```
:::

::: context move-only The standard's move-only types
`std::unique_ptr` (memory module, lesson 14) is the move-only type you already know: it owns one heap object, cannot be copied, and after a move the source is null. `FileHandle` is the same shape for a `FILE*`, and you could even build it from a `std::unique_ptr` given a custom deleter whose "delete" step calls `fclose`. `std::thread`, `std::unique_lock` and `std::fstream` are move-only too. Each one stands for something that must have exactly one owner.
:::

::: context valid-unspecified Valid, but you do not know what
Think of a moved-from object as a lunchbox after someone ate the lunch. It is still a perfectly good lunchbox: you can wash it, refill it, or throw it away. You just should not open it expecting a sandwich. For the standard library that is the formal promise: the object still meets all its own rules (its size matches its contents, its destructor works) but its value is not stated. Only a few types say more; `std::unique_ptr` promises null.
:::

::: context nodiscard An attribute that says "use me"
`[[nodiscard]]` is an attribute, a note in double square brackets attached to a declaration. On a function it means "ignoring my return value is almost certainly a mistake", and compilers warn when you do. The standard library puts it on `std::move` because a bare `std::move(x);` does nothing: its only product is the cast result, and throwing that away is a sign the programmer thought the call itself moved something. You can use it on your own functions too, for example on a function that returns an error code that must be checked. `[[maybe_unused]]`, used in the same example, is its mirror: "I know this is not used; do not warn."
:::

::: context reallocation How a vector grows
A `std::vector` with size 4 and capacity 4 is full. Adding a fifth element makes it allocate a block for 8, relocate the four elements across, destroy the old ones and free the old block. If the relocation throws on element 2 after moving 0 and 1, the old block is left with two gutted elements (shown in red) and there is no safe way back. That is the state `move_if_noexcept` exists to prevent.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="22" font-size="12" fill="#1f2a44">old block (capacity 4)</text>
  <rect x="12" y="30" width="40" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="52" y="30" width="40" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="92" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="132" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="32" y="50" font-size="11" fill="#b4232c" text-anchor="middle">empty</text>
  <text x="72" y="50" font-size="11" fill="#b4232c" text-anchor="middle">empty</text>
  <text x="112" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="152" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">3</text>
  <text x="12" y="92" font-size="12" fill="#1f2a44">new block (capacity 8)</text>
  <rect x="12" y="100" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="52" y="100" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="92" y="100" width="40" height="30" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="132" y="100" width="40" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="172" y="100" width="40" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="212" y="100" width="40" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="252" y="100" width="40" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="292" y="100" width="40" height="30" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <text x="32" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="72" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="112" y="120" font-size="11" fill="#b4232c" text-anchor="middle">throw</text>
  <line x1="32" y1="60" x2="32" y2="96" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="72" y1="60" x2="72" y2="96" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="112" y1="60" x2="112" y2="96" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="190" y="48" font-size="11" fill="#b4232c">0 and 1 already moved out;</text>
  <text x="190" y="62" font-size="11" fill="#b4232c">moving back could throw too</text>
  <text x="12" y="146" font-size="11" fill="#6c7a93">with copies instead, the old block is untouched and the vector can back out</text>
</svg>
```
:::

::: context ownership-handoff Handing things between tasks
Flight software is usually a set of tasks or components passing data along: a sensor driver fills a frame, an estimator consumes it, a downlink task sends a report. The question "who owns this buffer now?" comes up at every hand-off. A move-only type answers it in the type system: once the frame is moved into the queue, the sender's variable is empty, and using it again is visibly wrong in the code. Many flight frameworks pass small handles to preallocated buffers rather than moving heap memory, which keeps the heap out of the loop; the ownership question, and the move-only idea, are the same. The concurrency module returns to hand-offs between threads.
:::
