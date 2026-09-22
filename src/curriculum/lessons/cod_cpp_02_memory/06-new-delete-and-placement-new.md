---
id: l06-new-delete-and-placement-new
title: new and delete, the array forms, and placement new
minutes: 18
covers:
  - new/delete, new[]/delete[], placement new
---

`new` looks like one operation and is two. It calls an **allocation function** to obtain raw bytes, then runs a **constructor** in those bytes. `delete` is the same two in reverse: run the destructor, then call the **deallocation function**. Keeping the two halves separate in your head explains almost everything surprising about dynamic objects — why the array forms have their own spelling, why mismatching them is undefined, why an exception from a constructor does not leak, and what placement `new` is for.

You will write very little of this by hand. Modern C++ puts `new` inside containers and smart pointers, and lesson 14 gives you the tools that mean you never type `delete`. But flight software does one thing that requires the raw machinery: it builds objects in memory it already owns, at a time it chooses, with no allocator involved. That is placement `new`, and it is what a fixed-capacity container — the one you will write for this module's first exercise — is made of.

This lesson takes the two halves apart, shows each one happening, and then shows the half you can use on its own.

## Two steps, made visible

`operator new` and `operator delete` are ordinary functions, and you may replace them program-wide. Doing so is the clearest way to watch the steps.

::: example Watching allocation and construction separately
```cpp
void* operator new(std::size_t n) {
    void* p = std::malloc(n);
    if (!p) throw std::bad_alloc{};
    std::printf("  operator new(%zu) -> %s\n", n, p ? "ok" : "null");
    return p;
}
void operator delete(void* p, std::size_t n) noexcept {
    std::printf("  operator delete(ptr, %zu)\n", n);
    std::free(p);
}
// … and the [] forms, likewise …

struct Sample {
    double v;
    Sample() : v(0.0) { std::printf("  ctor Sample\n"); }
    ~Sample() { std::printf("  dtor Sample\n"); }
};

struct Plain { double v; };     // trivial destructor
```

```text
sizeof(Sample) = 8, sizeof(Plain) = 8
new Sample:
  operator new(8) -> ok
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

Read it line by line.

`new Sample` allocated 8 bytes and then constructed. `delete s` destructed and then deallocated — and it passed the size, 8, to the deallocation function. That is *sized deallocation*, added in C++14 so the allocator does not have to look the size up.

`new Sample[3]` asked for **32** bytes, not 24. The extra 8 bytes are the **array cookie**: because `Sample` has a non-trivial destructor, `delete[]` must know how many objects to destroy, so the count is stored just before the first element and the returned pointer is offset past it. Then three constructors ran, in order, and `delete[]` ran three destructors in *reverse* order before deallocating all 32 bytes.

`new Plain[3]` asked for exactly 24. `Plain` has a trivial destructor, so `delete[]` has nothing to do per element and no count is needed — no cookie. The corresponding `delete[]` also called the *unsized* deallocation function, because with no cookie the size was not available.

That is the whole mechanism, and it tells you why `delete` and `delete[]` are different operations rather than a stylistic choice: one of them steps back over a cookie and loops, the other does not.
:::

## Mismatching the forms

`new` pairs with `delete`. `new[]` pairs with `delete[]`. Any other combination is undefined behaviour, and so is `free()`-ing a pointer from `new`, or `delete`-ing one from `malloc`.

::: example `new[]` then `delete`: what two tools say, and what the program does
```cpp
double* buf = new double[4];
buf[0] = -9.81;
std::printf("buf[0] = %.2f\n", buf[0]);
delete buf;            // wrong: allocated with new[], freed with delete
```

g++ 13.3.0 catches it at compile time — the warning is enabled by `-Wall`:

```text
l06-mismatch.cpp:9:12: warning: 'void operator delete(void*, long unsigned int)' called on pointer returned from a mismatched allocation function [-Wmismatched-new-delete]
    9 |     delete buf;            // wrong: allocated with new[], freed with delete
      |            ^~~
l06-mismatch.cpp:6:31: note: returned from 'void* operator new [](long unsigned int)'
```

AddressSanitizer names it precisely at run time:

```text
buf[0] = -9.81
=================================================================
==21369==ERROR: AddressSanitizer: alloc-dealloc-mismatch (operator new [] vs operator delete) on 0x503000000040
    #0 0x7fecf54ff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x55698473432b in main l06-mismatch.cpp:9
    ...

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
allocated by thread T0 here:
    #0 0x7fecf54fe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x5569847342c0 in main l06-mismatch.cpp:6
    ...
```

(`...` marks the three library frames below `main` that every one of these traces ends with; addresses and the process id differ on every run.)

The report gives both ends: the line that deallocated wrongly and the line that allocated, with the two function names in the header so you can see the pair that did not match.

And the same program built at `-O1` with no sanitizer printed `buf[0] = -9.81` and **exited 0**. Nothing went wrong that anyone could see. That is the characteristic danger of this whole module: the bug is real, the standard says the behaviour is undefined, and the observable result of one build is a clean run. For `double`, which has no destructor and no cookie, the two deallocation paths happen to do the same thing on this implementation — until the type gains a destructor, or the allocator changes, or someone turns on hardened glibc, at which point the same line aborts.
:::

## When allocation fails

`new` does not return null on failure. It throws `std::bad_alloc`. The variant `new (std::nothrow) T` returns `nullptr` instead, and is what code compiled without exceptions uses.

```cpp
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
```

```text
throwing form: caught std::bad_alloc: std::bad_alloc
nothrow form: returned nullptr
```

Two things to keep. `delete nullptr` and `delete[] nullptr` are defined and do nothing, so a guard `if (p) delete p;` is noise. And on Linux the failure you get is rarely the failure you fear: the kernel overcommits, so a request that fits the address space usually succeeds and the shortage appears later as the out-of-memory killer terminating the process. Asking for 512 TiB fails cleanly because no address space that large exists; asking for 4 GiB on a 2 GiB machine may succeed and kill you later. On a flight target with no overcommit and no swap, `new` failing is a real and testable event — which is one more reason flight code does all its allocation at initialisation, where a failure can be handled before anything is flying.

::: warning
If a constructor throws part way through a `new` expression, the language calls the matching `operator delete` on the storage automatically, so the *memory* does not leak. What can still leak is anything the constructor had already acquired through a raw pointer member, because that member's destructor never runs — the object's lifetime never began. Members that own their resources (a `unique_ptr`, a `std::vector`) are destroyed properly, which is the rule of zero seen from the exception-safety side.
:::

## Placement new: construction without allocation

Placement `new` is the second half of `new` on its own. You hand it storage you already have, and it runs a constructor there.

```cpp
::new (address) T(args...)
```

It allocates nothing and cannot fail. Its counterpart is an explicit destructor call, `p->~T()`, which ends the object's lifetime without releasing any storage. The leading `::` is a habit worth keeping: it names the global placement form even if the class has declared a member `operator new`.

The storage has to be suitable: big enough, and correctly aligned for `T`. The idiom is a raw byte array with `alignas`:

```cpp
alignas(T) unsigned char storage_[sizeof(T) * N];
```

`alignas(T)` gives the array the alignment `T` requires — lesson 10 explains what that means and why it is not optional.

::: example A fixed sensor pool with no heap at all
```cpp
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
```

With a `Reading` whose constructor and destructor print:

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

Check the size: three `Reading` at 16 bytes is 48, plus 8 for `live_`, giving $3 \times 16 + 8 = 56$, which is what the program printed. No cookie, no allocator, no hidden field — the pool *is* its storage.

Four properties are worth stating because they are what the exercise is graded on. Every object is constructed exactly once, by a placement `new`. Every object is destroyed exactly once, by an explicit `~T()` call. The destructor of the pool destroys what is live, in reverse order, which is what the trace shows. And a request beyond capacity is *refused* with a null return rather than being undefined — the same discipline as the bounded stack in lesson 05.

The two rules that make this correct rather than merely working: you must not run a constructor in storage that already holds a live object, and you must not let the storage go away without calling the destructor. Both are on you; the compiler checks neither. Note also that the copy constructor and copy assignment are `= delete`d. A default copy would duplicate the raw bytes of `storage_`, producing two pools whose destructors both destroy the same logical objects — a double destruction. Lesson 13 gives this its proper name.
:::

::: key
`new T(args)` allocates then constructs; `delete p` destructs then deallocates. `new[]` may allocate extra bytes for an array cookie holding the element count, which is why `delete[]` is a different operation and why mismatching the forms is undefined behaviour. Placement `new`, written `::new (address) T(args)`, runs a constructor in storage you already own and allocates nothing; end that object's life with an explicit `p->~T()`.
:::

## Check yourself

::: check
`new Sample[3]` requested 32 bytes for three 8-byte objects, but `new Plain[3]` requested exactly 24. Explain the difference, and say what it means for a pointer you get back from `new T[n]`.
:::

::: answer
`Sample` has a non-trivial destructor, so `delete[]` must know how many elements to destroy. The implementation stores that count in a cookie immediately before the first element — 8 bytes on this ABI — and returns a pointer past it, so `operator new[]` was asked for $3 \times 8 + 8 = 32$. `Plain`'s destructor is trivial, `delete[]` has nothing to do per element, no count is needed, and the request is exactly 24. The consequence for the returned pointer is that it is *not* the address the allocation function returned when a cookie exists. So you cannot pass it to `free()`, you cannot `delete` it (the deallocation would be handed the wrong address), and you cannot assume anything about the bytes before it. Only `delete[]` knows how to step back over the cookie.
:::

::: check
A code review sees `Widget* w = new Widget(cfg);` followed twenty lines later by `delete w;`, with two `return` statements and a `throw` in between. What is wrong, and what is the smallest correct change?
:::

::: answer
The three early exits skip the `delete`, so the object leaks on those paths — and the `throw` leaks whatever else was acquired after it too. Adding a `delete` before each `return` is not the fix: it does not help the `throw`, and the next person to add a fourth exit path will forget. The smallest correct change is `auto w = std::make_unique<Widget>(cfg);` and deleting the `delete`. The `unique_ptr`'s destructor runs on every path out of the scope, including exception propagation, so the leak is structurally impossible rather than currently absent. That is lesson 14's subject, and it is why `new` and `delete` in ordinary application code are a review finding in most modern C++ style guides.
:::

::: check
Why can placement `new` never fail, and what obligation does that shift onto you?
:::

::: answer
It cannot fail because it does no allocation: you supplied the storage, so there is nothing to run out of. The only work it does is run a constructor, and if the constructor throws, that is the constructor's exception, not an allocation failure. The obligations that shift to you are three. The storage must be large enough — at least `sizeof(T)` — and correctly aligned for `T`, which is what `alignas(T)` on the byte array buys; getting alignment wrong is undefined behaviour and on some architectures a fault. The storage must not already hold a live object, or you have silently ended one object's lifetime without running its destructor. And you must call `p->~T()` yourself before the storage is reused or goes away, because no `delete` is coming.
:::

::: check
The `Pool` deletes its copy constructor. Suppose it did not. Describe concretely what `Pool<Reading,3> b = a;` would do, and at which moment the program would be wrong.
:::

::: answer
The implicitly generated copy constructor would copy the members: it would copy `storage_` — a `unsigned char` array — byte for byte, and copy `live_`. For `Reading`, which is two trivially copyable members, the resulting bytes would even represent plausible `Reading` objects, so nothing would appear wrong at the copy. The program becomes wrong at destruction: both `a` and `b` believe they hold three live objects, so `~Pool` runs `~Reading` three times on each, giving six destructor calls for three logical objects. With `Reading` that is harmless because its destructor only prints; with a type that owns a heap buffer, the second destructor on each pair is a double free, which AddressSanitizer reports as `attempting double-free`. The general lesson is that a byte-wise copy is correct exactly when the object owns nothing, and a class that constructs objects in its own storage always owns something.
:::

::: check
Flight rules say all allocation happens during initialisation and none afterwards. Does placement `new` in a control loop violate that rule?
:::

::: answer
No, and this is precisely why it exists. The rule is about the *allocator*: about calls whose worst-case time is unbounded and whose repeated use fragments the heap. Placement `new` calls no allocation function; it writes a constructor's worth of bytes into storage that was obtained once, at initialisation, or that lives in a static or automatic object and was never allocated at all. Its cost is exactly the constructor's cost, which for a small aggregate is a few stores and is entirely predictable. That is how a fixed-capacity queue, a ring buffer of telemetry frames and a pool of message objects are all implemented in flight code: the memory is reserved up front, and objects appear and disappear inside it at a rate the loop controls.
:::

## Summary

| Expression | What it does |
| --- | --- |
| `new T(args)` | `operator new(sizeof(T))`, then the constructor |
| `delete p` | the destructor, then `operator delete(p, sizeof(T))` |
| `new T[n]` | `operator new[](…)`, possibly plus an array cookie, then `n` constructors in order |
| `delete[] p` | `n` destructors in reverse order, then `operator delete[]` |
| array cookie | the element count, stored before the first element when `~T` is non-trivial |
| mismatching the forms | undefined behaviour; `-Wall` warns, ASan reports `alloc-dealloc-mismatch` |
| allocation failure | `std::bad_alloc` thrown; `new (std::nothrow) T` returns `nullptr` instead |
| `delete nullptr` | defined, does nothing |
| `::new (addr) T(args)` | placement new: constructs in your storage, allocates nothing, cannot fail |
| `p->~T()` | ends a lifetime without releasing storage; the partner of placement new |
| `alignas(T) unsigned char s[sizeof(T)*N]` | correctly aligned raw storage for `N` objects of type `T` |

Lesson 07 asks what the allocator is actually doing when you call `new`, how long it takes, and why a heap that has been running for a month can refuse a request it would have granted on day one.
