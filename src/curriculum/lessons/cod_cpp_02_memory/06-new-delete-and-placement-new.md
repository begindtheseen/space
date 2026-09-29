---
id: l06-new-delete-and-placement-new
title: new and delete, the array forms, and placement new
minutes: 21
covers:
  - new/delete, new[]/delete[], placement new
---

Think about how a house gets built. First you buy a plot of land. Then you build the house on it. Those are two different jobs, done by different people: a real-estate agent sells you the land, and a builder puts up the walls. Taking it down is the same two jobs in reverse. First you demolish the house, then you sell the land.

`new` in C++ looks like one operation, and it is those two. It calls an **allocation function** to get raw bytes — the plot of land — and then runs a **constructor** in those bytes — the builder. `delete` is the same pair in reverse: run the **destructor** (demolish), then call the **deallocation function** (sell the land).

Keeping the two halves apart in your head explains almost everything surprising about objects made with `new`. It explains why the array forms have their own spelling, why mixing them up is undefined, why an exception from a constructor does not leak memory, and what **placement `new`** is for.

You will write very little of this by hand. Modern C++ hides `new` inside containers and smart pointers, and lesson 14 gives you tools that mean you never type `delete`. But flight software does one thing that needs the raw machinery. It builds objects in memory it already owns, at a time it chooses, with no allocator involved. That is placement `new` — building on land you already hold — and it is what a fixed-capacity container, the one you will write for this module's first exercise, is made of.

## Two steps, made visible

The allocation and deallocation functions have names: `operator new` and `operator delete`. They are ordinary functions, and the language lets you **[[replace them for the whole program|replacing-operator-new]]**. Doing that, with a print in each, is the clearest way to watch the two steps happen.

::: example Watching allocation and construction separately
Each replacement gets its bytes from **[[`malloc`|malloc-free]]**, the C library's allocator, and prints what it was asked for:

```cpp
#include <cstdio>
#include <cstdlib>
#include <new>

void* operator new(std::size_t n) {
    void* p = std::malloc(n);
    if (!p) throw std::bad_alloc{};
    std::printf("  operator new(%zu)\n", n);
    return p;
}
void operator delete(void* p, std::size_t n) noexcept {
    std::printf("  operator delete(ptr, %zu)\n", n);
    std::free(p);
}
void operator delete(void* p) noexcept {
    std::printf("  operator delete(ptr)\n");
    std::free(p);
}
void* operator new[](std::size_t n) {
    void* p = std::malloc(n);
    if (!p) throw std::bad_alloc{};
    std::printf("  operator new[](%zu)\n", n);
    return p;
}
void operator delete[](void* p, std::size_t n) noexcept {
    std::printf("  operator delete[](ptr, %zu)\n", n);
    std::free(p);
}
void operator delete[](void* p) noexcept {
    std::printf("  operator delete[](ptr)\n");
    std::free(p);
}

struct Sample {
    double v;
    Sample() : v(0.0) { std::printf("  ctor Sample\n"); }
    ~Sample() { std::printf("  dtor Sample\n"); }
};

struct Plain { double v; };     // trivial destructor

int main() {
    std::printf("sizeof(Sample) = %zu, sizeof(Plain) = %zu\n", sizeof(Sample), sizeof(Plain));
    std::printf("new Sample:\n");
    Sample* s = new Sample;
    std::printf("delete s:\n");
    delete s;
    std::printf("new Sample[3]:\n");
    Sample* a = new Sample[3];
    std::printf("delete[] a:\n");
    delete[] a;
    std::printf("new Plain[3]:\n");
    Plain* p = new Plain[3];
    std::printf("delete[] p:\n");
    delete[] p;
    return 0;
}
```

```text
sizeof(Sample) = 8, sizeof(Plain) = 8
new Sample:
  operator new(8)
  ctor Sample
delete s:
  dtor Sample
  operator delete(ptr, 8)
new Sample[3]:
  operator new[](32)
  ctor Sample
  ctor Sample
  ctor Sample
delete[] a:
  dtor Sample
  dtor Sample
  dtor Sample
  operator delete[](ptr, 32)
new Plain[3]:
  operator new[](24)
delete[] p:
  operator delete[](ptr)
```

Read it a block at a time.

**`new Sample`** asked for 8 bytes, then ran the constructor. Land first, then the house.

**`delete s`** ran the destructor, then gave the 8 bytes back. It also passed the size, 8, to the deallocation function. That is **[[sized deallocation|sized-deallocation]]**, added in C++14 so the allocator does not have to look the size up.

**`new Sample[3]`** asked for **32** bytes, not $3 \times 8 = 24$. The extra 8 bytes are the **array cookie**: a hidden count of the elements. `Sample` has a destructor that does something, so `delete[]` must know how many objects to destroy. The count is stored immediately before the first element, and the pointer you get back points past it — the **[[cookie layout|array-cookie]]** in a picture. Then three constructors ran, first element to last. `delete[]` ran three destructors — in *reverse* order, last element first, as the standard requires — and then gave back all 32 bytes.

**`new Plain[3]`** asked for exactly 24. `Plain` has a **trivial destructor** — one that does nothing at all — so `delete[]` has no per-element work and needs no count. No cookie. And the matching `delete[]` called the *unsized* deallocation function, because with no cookie the size was not stored anywhere.

That is the whole mechanism. It shows why `delete` and `delete[]` are different operations, not a matter of style: one of them steps back over a cookie and loops over the elements, and the other does not.
:::

## Mismatching the forms

The pairs are fixed:

- `new` pairs with `delete`.
- `new[]` pairs with `delete[]`.
- `malloc` pairs with `free`.

Any other combination is **undefined behavior** — the standard promises nothing about what happens. That includes `free()`-ing a pointer from `new`, and `delete`-ing one from `malloc`.

::: example `new[]` then `delete`: what two tools say, and what the program does
```cpp
#include <cstdio>

int main() {
    double* buf = new double[4];
    buf[0] = -9.81;
    std::printf("buf[0] = %.2f\n", buf[0]);
    delete buf;            // wrong: allocated with new[], freed with delete
    return 0;
}
```

g++ 13.3.0 catches it at compile time. The warning is turned on by `-Wall` (with no flags it is silent):

```text
l06-mismatch.cpp:7:12: warning: 'void operator delete(void*, long unsigned int)' called on pointer returned from a mismatched allocation function [-Wmismatched-new-delete]
    7 |     delete buf;            // wrong: allocated with new[], freed with delete
      |            ^~~
l06-mismatch.cpp:4:31: note: returned from 'void* operator new [](long unsigned int)'
```

AddressSanitizer names it precisely at run time:

```text
buf[0] = -9.81
=================================================================
==8564==ERROR: AddressSanitizer: alloc-dealloc-mismatch (operator new [] vs operator delete) on 0x503000000040
    #0 0x7fafc84ff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x55b7c3d422a9 in main l06-mismatch.cpp:7
    ...

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
allocated by thread T0 here:
    #0 0x7fafc84fe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x55b7c3d4223e in main l06-mismatch.cpp:4
    ...
```

(`...` marks the three library frames below `main` that every one of these traces ends with. Addresses and the process number change on every run.)

The report gives you both ends. Line 7 is where the memory was wrongly released, line 4 is where it was allocated, and the header names the two functions that did not match: `operator new []` and `operator delete`. The region is 32 bytes because the array was $4 \times 8 = 32$ bytes of `double`.

And the same program built at `-O1` with no sanitizer printed `buf[0] = -9.81` and **exited 0**. Nothing visibly went wrong. That is the characteristic danger of this whole module. The bug is real, the behavior is undefined, and one build's observable result is a clean run. For `double`, which has no destructor and so no cookie, the two release paths happen to do the same thing on this implementation. Give the type a destructor, or change the allocator, and the same line can crash or corrupt the heap.
:::

## When allocation fails

`new` does not return null when memory runs out. It throws an exception, `std::bad_alloc`. If you want a null pointer instead, write `new (std::nothrow) T`: it returns `nullptr` on failure. That form is what code built **[[without exceptions|no-exceptions]]** uses.

```cpp
#include <cstddef>
#include <cstdio>
#include <new>

int main() {
    const std::size_t huge = static_cast<std::size_t>(1) << 46;   // 2^46 doubles = 512 TiB
    try {
        double* p = new double[huge];
        delete[] p;
    } catch (const std::bad_alloc& e) {
        std::printf("throwing form: caught std::bad_alloc: %s\n", e.what());
    }
    double* q = new (std::nothrow) double[huge];
    std::printf("nothrow form: %s\n", q ? "got a block" : "returned nullptr");
    delete[] q;                      // deleting nullptr is defined and does nothing
    return 0;
}
```

```text
throwing form: caught std::bad_alloc: std::bad_alloc
nothrow form: returned nullptr
```

Check the size: $2^{46}$ doubles at 8 bytes each is $2^{49}$ bytes, which is $2^{49} / 2^{40} = 512$ TiB. No machine has that.

Two things to keep.

First, `delete nullptr` and `delete[] nullptr` are defined and do nothing. So a guard like `if (p) delete p;` is noise.

Second, on Linux the failure you get is rarely the failure you fear. The kernel **[[overcommits|overcommit]]**: a request that fits the address space usually succeeds, and a real shortage shows up later, when the out-of-memory killer ends the process. Asking for 512 TiB fails cleanly because no address space that large exists. Asking for 4 GiB on a 2 GiB machine may succeed now and kill you later. On a flight target with no overcommit and no swap, `new` failing is a real, testable event. That is one more reason flight code does all its allocation at initialization, where a failure can be handled before anything is flying.

::: warning
If a constructor throws part way through a `new` expression, the language calls the matching `operator delete` on the storage automatically, so the *memory* does not leak. What can still leak is anything the constructor had already acquired through a raw pointer member. That member is never cleaned up, because the object's lifetime never began and so its destructor never runs. Members that own their resources — a `unique_ptr`, a `std::vector` — are destroyed properly. That is the rule of zero (lesson 13) seen from the exception side.
:::

## Placement new: construction without allocation

Now the useful half on its own. **Placement `new`** is the builder without the real-estate agent. You hand it storage you already have, and it runs a constructor there:

```cpp
::new (address) T(args...)
```

Read `::` as "colon colon" or "global": the leading `::new` names the global placement form, even if the class `T` has declared its own member `operator new`. It is a habit worth keeping. The **[[bracketed address|placement-syntax]]** is where the object will be built.

Placement `new` allocates nothing, so it cannot run out of memory. Its partner is an explicit destructor call, `p->~T()` — read "p arrow tilde T". That ends the object's lifetime (demolishes the house) without giving back any storage (you keep the land).

The storage has to be suitable: big enough, and correctly **aligned** for `T` — starting at an address that is a multiple of what `T` requires. The standard way to get it is a raw byte array with `alignas`:

```cpp
alignas(T) unsigned char storage_[sizeof(T) * N];
```

This declares `N` objects' worth of bytes, and `alignas(T)` gives the array the alignment `T` needs. Lesson 10 explains alignment and why it is not optional.

::: example A fixed sensor pool with no heap at all
`Pool` holds up to `N` objects of type `T` in its own member array. `acquire` builds a new object in the next free slot; `release_last` destroys the newest one.

```cpp
#include <cstddef>
#include <cstdio>
#include <new>
#include <utility>

template <typename T, std::size_t N>
class Pool {
public:
    Pool() = default;
    Pool(const Pool&) = delete;
    Pool& operator=(const Pool&) = delete;

    ~Pool() { while (live_ > 0) release_last(); }

    template <typename... Args>
    T* acquire(Args&&... args) {
        if (live_ == N) return nullptr;
        T* p = ::new (slot(live_)) T(std::forward<Args>(args)...);
        ++live_;
        return p;
    }

    void release_last() {
        if (live_ == 0) return;
        --live_;
        slot(live_)->~T();
    }

    std::size_t size() const { return live_; }
    static constexpr std::size_t capacity() { return N; }

private:
    T* slot(std::size_t i) { return reinterpret_cast<T*>(storage_) + i; }

    alignas(T) unsigned char storage_[sizeof(T) * N];
    std::size_t live_{0};
};

struct Reading {
    int id;
    double az;
    Reading(int i, double a) : id(i), az(a) { std::printf("  ctor Reading %d\n", id); }
    ~Reading() { std::printf("  dtor Reading %d\n", id); }
};

int main() {
    std::printf("Pool<Reading,3>: sizeof = %zu, alignof = %zu\n",
                sizeof(Pool<Reading, 3>), alignof(Pool<Reading, 3>));
    std::printf("sizeof(Reading) = %zu, alignof(Reading) = %zu\n",
                sizeof(Reading), alignof(Reading));
    {
        Pool<Reading, 3> pool;
        std::printf("acquiring three:\n");
        pool.acquire(1, -9.79);
        pool.acquire(2, -9.81);
        Reading* third = pool.acquire(3, -9.83);
        std::printf("size = %zu of %zu, third az = %.2f\n",
                    pool.size(), pool.capacity(), third->az);
        Reading* fourth = pool.acquire(4, -9.80);
        std::printf("a fourth is refused: %s\n", fourth ? "got one" : "nullptr");
        std::printf("leaving the scope:\n");
    }
    std::printf("done\n");
    return 0;
}
```

A few pieces of syntax, read aloud. `template <typename... Args>` with `Args&&... args` means "any number of arguments of any types"; `std::forward` passes each one on to `T`'s constructor exactly as it came in. `reinterpret_cast<T*>(storage_)` tells the compiler to **[[treat the byte array's address as a pointer to `T`|launder-fine-print]]**, and `+ i` steps to slot `i`.

Built with `-Wall -Wextra -fsanitize=address,undefined`, it runs clean:

```text
Pool<Reading,3>: sizeof = 56, alignof = 8
sizeof(Reading) = 16, alignof(Reading) = 8
acquiring three:
  ctor Reading 1
  ctor Reading 2
  ctor Reading 3
size = 3 of 3, third az = -9.83
a fourth is refused: nullptr
leaving the scope:
  dtor Reading 3
  dtor Reading 2
  dtor Reading 1
done
```

**Check the size.** A `Reading` is 16 bytes: a 4-byte `int`, 4 bytes of padding, and an 8-byte `double`. Three of them is $3 \times 16 = 48$ bytes, plus 8 for `live_`, giving $48 + 8 = 56$ — what the program printed. No cookie, no allocator, no hidden field. The **[[pool is its storage|pool-layout]]**.

Four properties matter, because they are what the exercise is graded on.

1. Every object is constructed exactly once, by a placement `new`.
2. Every object is destroyed exactly once, by an explicit `~T()` call.
3. The pool's destructor destroys whatever is still live, in reverse order — Reading 3, then 2, then 1, as the trace shows.
4. A request beyond capacity is *refused* with a null return instead of being undefined. That is the same discipline as the bounded stack in lesson 05.

Two rules make this correct rather than merely working. You must not run a constructor in storage that already holds a live object. And you must not let the storage go away without calling the destructor. Both are on you; the compiler checks neither.

Notice also that the copy constructor and copy assignment are `= delete`d, meaning "this operation does not exist". A default copy would duplicate the raw bytes of `storage_`, giving two pools whose destructors both destroy the same logical objects — a double destruction. Lesson 13 gives this problem its proper name.
:::

::: key
`new T(args)` allocates then constructs; `delete p` destructs then deallocates. `new[]` may allocate extra bytes for an array cookie holding the element count, which is why `delete[]` is a different operation and why mismatching the forms is undefined behavior. Placement `new`, written `::new (address) T(args)`, runs a constructor in storage you already own and allocates nothing; end that object's life with an explicit `p->~T()`.
:::

## Check yourself

::: check
`new Sample[3]` requested 32 bytes for three 8-byte objects, but `new Plain[3]` requested exactly 24. Explain the difference, and say what it means for a pointer you get back from `new T[n]`.
:::

::: answer
`Sample` has a destructor that does work, so `delete[]` must know how many elements to destroy. The implementation stores that count in a cookie immediately before the first element — 8 bytes on this ABI — and returns a pointer past it. So `operator new[]` was asked for $3 \times 8 + 8 = 32$ bytes.

`Plain`'s destructor is trivial. `delete[]` has nothing to do per element, needs no count, and the request is exactly $3 \times 8 = 24$.

The consequence: when there is a cookie, the pointer you get back is *not* the address the allocation function returned. So you cannot pass it to `free()`, you cannot `delete` it (the deallocation would be handed the wrong address), and you cannot assume anything about the bytes before it. Only `delete[]` knows how to step back over the cookie.
:::

::: check
A code review sees `Widget* w = new Widget(cfg);` followed twenty lines later by `delete w;`, with two `return` statements and a `throw` in between. What is wrong, and what is the smallest correct change?
:::

::: answer
The three early exits skip the `delete`, so the `Widget` leaks on each of those paths — and the `throw` also leaks anything else acquired along the way.

Adding a `delete` before each `return` is not the fix. It does not help the `throw`, and the next person to add a fourth exit will forget.

The smallest correct change is `auto w = std::make_unique<Widget>(cfg);` and removing the `delete`. The `unique_ptr`'s destructor runs on every path out of the scope, including while an exception is traveling up, so the leak becomes impossible rather than merely absent today. That is lesson 14's subject, and it is why a bare `new` and `delete` in ordinary application code is a review finding under most modern C++ style guides.
:::

::: check
Why can placement `new` never run out of memory, and what obligations does that shift onto you?
:::

::: answer
It cannot run out because it allocates nothing: you supplied the storage, so there is nothing to run out of. Its only work is running a constructor. If the constructor throws, that is the constructor's exception, not an allocation failure.

Three obligations shift to you.

1. The storage must be large enough — at least `sizeof(T)` — and correctly aligned for `T`. That is what `alignas(T)` on the byte array buys. Wrong alignment is undefined behavior, and on some processors a hardware fault.
2. The storage must not already hold a live object. Otherwise you have silently ended that object's lifetime without running its destructor.
3. You must call `p->~T()` yourself before the storage is reused or goes away, because no `delete` is coming.
:::

::: check
The `Pool` deletes its copy constructor. Suppose it did not. Describe concretely what `Pool<Reading,3> b = a;` would do, and at which moment the program would go wrong.
:::

::: answer
The compiler-generated copy constructor copies each member. It would copy `storage_`, an `unsigned char` array, byte for byte, and copy `live_`. For `Reading`, which is only an `int` and a `double`, the copied bytes would even look like three sensible `Reading` objects. Nothing appears wrong at the copy.

The program goes wrong at destruction. Both `a` and `b` believe they hold three live objects, so each `~Pool` runs `~Reading` three times: six destructor calls for three logical objects. With `Reading` that happens to be harmless, because its destructor only prints. With a type that owns a heap buffer, the second destructor of each pair frees memory already freed — a double free, which AddressSanitizer reports as `attempting double-free`.

The general lesson: a byte-by-byte copy is correct exactly when the object owns nothing, and a class that builds objects in its own storage always owns something.
:::

::: check
Flight rules say all allocation happens during initialization and none afterwards. Does placement `new` in a control loop break that rule?
:::

::: answer
No — and this is precisely why placement `new` exists. The rule is about the *allocator*: calls whose worst-case time has no bound and whose repeated use fragments the heap.

Placement `new` calls no allocation function. It writes a constructor's worth of bytes into storage obtained once, at initialization, or into a static or automatic object that was never allocated at all. Its cost is exactly the constructor's cost, which for a small struct is a few stores to memory and completely predictable.

That is how a fixed-capacity queue, a **ring buffer** of telemetry frames (a fixed array used in a circle, oldest slot reused first) and a pool of message objects are built in flight code. The memory is reserved up front, and objects appear and disappear inside it at a rate the loop controls.
:::

## Summary

| Expression | What it does |
| --- | --- |
| `new T(args)` | `operator new(sizeof(T))`, then the constructor |
| `delete p` | the destructor, then `operator delete(p, sizeof(T))` |
| `new T[n]` | `operator new[](…)`, possibly plus an array cookie, then `n` constructors in order |
| `delete[] p` | `n` destructors in reverse order, then `operator delete[]` |
| array cookie | the element count, stored before the first element when `~T` is non-trivial |
| mismatching the forms | undefined behavior; `-Wall` warns, ASan reports `alloc-dealloc-mismatch` |
| allocation failure | `std::bad_alloc` thrown; `new (std::nothrow) T` returns `nullptr` instead |
| `delete nullptr` | defined, does nothing |
| `::new (addr) T(args)` | placement new: constructs in your storage, allocates nothing, cannot run out |
| `p->~T()` | ends a lifetime without releasing storage; the partner of placement new |
| `alignas(T) unsigned char s[sizeof(T)*N]` | correctly aligned raw storage for `N` objects of type `T` |

Lesson 07 asks what the allocator is actually doing when you call `new`, how long it takes, and why a heap that has been running for a month can refuse a request it would have granted on day one.

::: context replacing-operator-new Swapping out the allocator
The standard explicitly allows a program to supply its own global `operator new` and `operator delete`. Define them once, anywhere in the program, and every `new` expression uses yours instead of the library's.

Flight and embedded teams use this for more than printing. A test build can replace `operator new` with one that counts calls — or that stops the program — once initialization is over. Run the full test suite, and the count proves that no code path allocates while the vehicle is "flying".
:::

::: context malloc-free The C allocator underneath
`malloc(n)` is the C library's function for "give me `n` bytes": it returns a pointer to raw, uninitialised memory, or null if it cannot. `free(p)` gives the block back. Neither knows anything about constructors or destructors.

On Linux, g++'s default `operator new` is itself a thin layer over `malloc`. That is why the replacement here can call `malloc` and nothing looks different — and why lesson 07 studies `malloc`'s behavior when it asks how long `new` takes.
:::

::: context sized-deallocation Why pass the size back?
Before C++14, `operator delete` received only the pointer. The allocator then had to work out the block's size itself, usually by reading a small header it had hidden in front of the block.

With **sized deallocation**, the compiler passes the size it already knows — it is `sizeof(T)`, or for arrays it can be computed from the cookie. Allocators that keep blocks of each size in separate lists can then skip the lookup, which makes freeing cheaper.
:::

::: context array-cookie Where the count hides
For `new Sample[3]`, the allocator hands back 32 bytes. The first 8 hold the count, 3. The pointer your program receives points at byte 8, the first `Sample`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="80" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="40" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="40" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="40" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="62">count = 3</text><text x="140" y="62">a[0]</text>
    <text x="220" y="62">a[1]</text><text x="300" y="62">a[2]</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="90">0</text><text x="100" y="90">8</text><text x="180" y="90">16</text>
    <text x="260" y="90">24</text><text x="340" y="90">32</text>
  </g>
  <line x1="20" y1="24" x2="20" y2="38" stroke="#b4232c" stroke-width="2"/>
  <text x="24" y="20" font-size="11" fill="#b4232c">operator new[] returned</text>
  <line x1="100" y1="104" x2="100" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="100,76 95,86 105,86" fill="#1d6fd1"/>
  <text x="108" y="118" font-size="11" fill="#1d6fd1">pointer a that your code gets</text>
</svg>
```

`delete[] a` steps back 8 bytes, reads the 3, runs three destructors, and frees from byte 0. Plain `delete a` would free from byte 8 — an address the allocator never handed out.
:::

::: context no-exceptions Code built without exceptions
Exceptions need extra support code and tables in the program, and the time to throw and catch one is hard to bound. Many embedded and flight projects therefore compile with `-fno-exceptions`, which turns every `throw` into a compile error.

In such a build, a plain `new` that runs out of memory cannot throw `std::bad_alloc`; with g++'s library the program usually aborts instead. So code that must survive failure uses `new (std::nothrow)` and checks for `nullptr` — or, better, does not allocate after start-up at all.
:::

::: context overcommit Promising memory you do not have
By default Linux **overcommits**: when a program asks for memory, the kernel says yes before finding any real memory for it. Actual pages are handed out only when the program first writes to them. Most programs never touch everything they ask for, so this usually works.

When too many pages really are touched, the kernel's **out-of-memory killer** picks a process and ends it. From that program's point of view, `new` succeeded and the program died later at some unrelated line.
:::

::: context placement-syntax Why it is called "placement"
The bracket after `new` is a general feature: `new (a, b) T` passes the extra arguments `a` and `b` to a matching `operator new(std::size_t, a, b)`. The standard library, in the header `<new>`, provides one whose only extra argument is an address and which returns that address. Because that version decides where the object is *placed*, the whole syntax took the name.

`new (std::nothrow) T` uses the same bracket to pass the `std::nothrow` tag — which is why it looks so similar.
:::

::: context launder-fine-print The fine print on reinterpret_cast
Strictly, the standard is fussy about reaching an object through a pointer made from its storage — `reinterpret_cast<T*>(storage_)` — rather than through the pointer placement `new` returned. The formal fix is to wrap the cast in `std::launder`, a C++17 function that tells the compiler "an object really lives here now".

Every mainstream compiler handles the plain pattern in `Pool` and in the exercise's solution as you would expect, and much real code is written that way. If you want to be exact, keep the pointer placement `new` returns, or pass the cast through `std::launder`.
:::

::: context pool-layout Fifty-six bytes, and nothing else
`Pool<Reading, 3>` is its storage plus one counter. Each `Reading` is an `int` (4 bytes), 4 bytes of padding so the `double` starts on a multiple of 8, and the `double` (8 bytes).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="40" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="108" y="40" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="204" y="40" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="300" y="40" width="48" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="62">slot 0</text><text x="156" y="62">slot 1</text>
    <text x="252" y="62">slot 2</text><text x="324" y="62">live_</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="12" y="90">0</text><text x="108" y="90">16</text><text x="204" y="90">32</text>
    <text x="300" y="90">48</text><text x="348" y="90">56</text>
  </g>
  <text x="156" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">storage_: 3 × 16 = 48 bytes</text>
  <text x="180" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">byte offsets from the start of the pool</text>
</svg>
```

The exercise's `StaticVector` has exactly this shape, with `size_` in place of `live_`.
:::
