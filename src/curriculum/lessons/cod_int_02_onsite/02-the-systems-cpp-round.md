---
id: l02-the-systems-cpp-round
title: The systems C++ round
minutes: 25
covers:
  - 'Systems C++ round: pointers and memory, double delete, RAII, rule of five, unique_ptr versus shared_ptr, virtual destructors, vtable layout, move semantics, undefined behavior, static and const and volatile, data races, cache effects, avoiding new in a hot path'
---

Think about a library book. You borrow it, and exactly one thing must happen next: you return it, once. If you never return it, the library slowly runs out of books. If you return it twice, the second return confuses the records — maybe someone else's book gets marked as returned. If you keep reading it after you returned it, you are reading a book that now belongs to someone else, and the pages may change under you.

Memory in C++ works the same way. A program borrows memory, uses it, and must give it back exactly once, at the right moment, and never touch it again afterwards. Most of the systems C++ round is about one question: **who owns this memory, and when is it given back?** The rest is about what the compiler and the hardware do underneath your code — threads, tables of function pointers, and the cache.

Flight software is written in C++ largely because it gives this control, which is why a flight software interviewer will poke at it. This lesson goes through the ten things to have ready, each with a short explanation and, where it helps, a small program you can compile and run with `g++ -std=c++17 -Wall`.

## The ten things

Learn the list itself first, so that in the room you can see which of the ten a question is really about.

::: key Systems C++ round: the ten things to have ready
What double delete does, RAII in three sentences, rule of five and when moves are suppressed, unique_ptr versus shared_ptr cost, virtual destructors, vtable layout, what std::move actually does, three examples of undefined behavior, what a data race is, and why you would avoid new in a hot path. Beside the ten, know static, const and volatile, and cache effects.
:::

The two extras, `static`, `const` and `volatile`, and cache effects, are covered at the end.

## Pointers, the heap, and double delete

A **pointer** is a variable that holds a memory address — like a slip of paper with a locker number on it. `new` asks for a fresh piece of memory on the **[[heap|heap-and-stack]]** (the pool of memory a program borrows from while it runs) and hands back a pointer to it. `delete` gives it back.

Deleting frees the memory, but the slip of paper still has the old locker number on it. That leftover is a **dangling pointer**.

**Double delete** is calling `delete` twice on the same address. It is **[[undefined behavior|what-ub-means]]** — the C++ standard puts no requirements at all on what happens next. In practice, one of three things tends to happen:

- the memory allocator notices and stops the program with an error message;
- nothing visible happens now, but the allocator's records are corrupted, and a crash happens much later in unrelated code;
- the same block ends up handed out to two later `new` calls, so two objects silently share memory and overwrite each other.

The last two are the dangerous ones, because the crash appears far from the cause. This lesson does not run a double delete: a program with undefined behavior has no "real output" to show. Lesson 3 shows how tools catch this class of bug.

The interview answer: "Double delete is undefined behavior. It usually corrupts the allocator's bookkeeping, so the symptom often shows up later, somewhere else. The cure is not to be careful — it is to make ownership automatic, so no human writes `delete` at all."

## RAII in three sentences

**RAII** stands for "resource acquisition is initialization" — an [[awkward name|raii-name]] for a simple habit. In three sentences:

1. A resource (memory, a file, a lock) is acquired in an object's constructor.
2. It is released in that object's destructor.
3. Because C++ runs the destructor automatically whenever the object goes out of scope — at the closing brace, on an early `return`, or when an exception passes through — the release cannot be forgotten.

```cpp
#include <cstdio>

class LogFile {
public:
    explicit LogFile(const char* path) : f_(std::fopen(path, "w")) {
        std::printf("opened\n");
    }
    ~LogFile() {
        if (f_) std::fclose(f_);
        std::printf("closed\n");
    }
    LogFile(const LogFile&) = delete;             // no copies: one owner
    LogFile& operator=(const LogFile&) = delete;
    void write(const char* s) { if (f_) std::fputs(s, f_); }
private:
    std::FILE* f_;
};

int main() {
    {
        LogFile log("/tmp/l02_raii.txt");
        log.write("attitude ok\n");
        std::printf("leaving the block\n");
    }   // destructor runs here, even on an early return or an exception
    std::printf("after the block\n");
}
// Output:
// opened
// leaving the block
// closed
// after the block
```

"closed" prints before "after the block": the file is shut at the closing brace, with no line of code asking for it. `std::vector`, `std::string`, `std::unique_ptr` and `std::lock_guard` are all RAII classes, which is why modern C++ contains almost no `delete`.

## The rule of five, and when moves are suppressed

A class can control five special operations:

1. the **destructor** — cleans up;
2. the **copy constructor** — builds a new object as a copy of another;
3. the **copy assignment** — overwrites an existing object with a copy;
4. the **move constructor** — builds a new object by taking over another's resources;
5. the **move assignment** — overwrites an existing object by taking over another's resources.

A **move** is handing someone your backpack instead of buying them an identical one. For a big buffer, that is copying one pointer instead of a million numbers.

The **rule of five** says: if a class writes any one of these by hand, it probably needs to think about all five, because it is managing a resource directly and all five must agree on how.

The trap is this. If you declare a destructor, a copy constructor or a copy assignment yourself, the compiler **stops generating the move operations** for you. It does not warn you. A "move" of that class silently becomes a copy, because the copy constructor is the next best match.

```cpp
#include <cstdio>
#include <utility>
#include <vector>

struct Loud {
    Loud() = default;
    Loud(const Loud&)            { std::printf("  copy\n"); }
    Loud(Loud&&) noexcept        { std::printf("  move\n"); }
    Loud& operator=(const Loud&) = default;
    Loud& operator=(Loud&&)      = default;
    ~Loud() = default;
};

struct WithDtor {          // declares only a destructor
    Loud part;
    ~WithDtor() {}         // this line quietly switches off the implicit move
};

struct RuleOfZero {        // declares nothing special
    Loud part;
};

int main() {
    RuleOfZero a;
    std::printf("RuleOfZero moved:\n");
    RuleOfZero b = std::move(a);
    (void)b;
    WithDtor c;
    std::printf("WithDtor 'moved':\n");
    WithDtor d = std::move(c);
    (void)d;
}
// Output:
// RuleOfZero moved:
//   move
// WithDtor 'moved':
//   copy
```

An empty destructor turned a move into a copy.

::: key Rule of five, and rule of zero
Declaring a destructor, copy constructor or copy assignment suppresses the implicit move operations, so a move silently becomes a copy. Declaring a move operation deletes the implicit copies. Best of all is the **rule of zero**: hold resources in RAII members (`std::vector`, `std::unique_ptr`) and declare none of the five.
:::

::: warning The empty destructor
People add `~Thing() {}` "to be tidy", or to set a breakpoint. It costs the class its moves. If you need a destructor for another reason, also write `Thing(Thing&&) = default;` and `Thing& operator=(Thing&&) = default;` — and then, because declaring moves deletes the copies, default those too if you want them.
:::

## unique_ptr versus shared_ptr

Both are **smart pointers**: RAII objects that delete what they point to when done. They differ in who owns the object.

- `std::unique_ptr<T>` — exactly one owner. It cannot be copied, only moved. When it goes away, the object is deleted.
- `std::shared_ptr<T>` — many owners. It keeps a count of how many `shared_ptr`s point at the object, and the last one to go away deletes it.

That count has to live somewhere. It sits in a separate piece of memory called the **[[control block|control-block]]**, which holds the count of owners (and a second count for `weak_ptr`s). Because two threads might copy the same `shared_ptr` at the same moment, the count is changed with **[[atomic|atomic-meaning]]** instructions — special instructions that finish as one indivisible step, even with other cores watching — which cost more than an ordinary add.

```cpp
#include <cstdio>
#include <memory>

struct Sample { double t, x, y, z; };

int main() {
    std::printf("raw pointer:  %zu bytes\n", sizeof(Sample*));
    std::printf("unique_ptr:   %zu bytes\n", sizeof(std::unique_ptr<Sample>));
    std::printf("shared_ptr:   %zu bytes\n", sizeof(std::shared_ptr<Sample>));

    auto u = std::make_unique<Sample>();
    auto s = std::make_shared<Sample>();
    std::printf("use_count after make_shared: %ld\n", s.use_count());
    auto s2 = s;   // copying bumps an atomic counter
    std::printf("use_count after one copy:    %ld\n", s.use_count());
    std::unique_ptr<Sample> u2 = std::move(u);   // ownership moves; no counter
    std::printf("u is now %s\n", u ? "set" : "empty");
}
// Output on a typical 64-bit Linux machine:
// raw pointer:  8 bytes
// unique_ptr:   8 bytes
// shared_ptr:   16 bytes
// use_count after make_shared: 1
// use_count after one copy:    2
// u is now empty
```

::: key unique_ptr versus shared_ptr cost
unique_ptr: one pointer wide (8 bytes on 64-bit), no count, move-only, zero overhead over a raw pointer. shared_ptr: two pointers wide (16 bytes), plus a heap-allocated control block, plus an atomic increment on every copy and decrement on every destruction. Use unique_ptr by default; use shared_ptr only when ownership really is shared.
:::

::: example What the handles alone cost
A ground system keeps one pointer per satellite for $6000$ satellites. How much memory do the pointers themselves take?

With `unique_ptr`: $6000 \times 8 = 48{,}000$ bytes, about $48\,\mathrm{kB}$.

With `shared_ptr`: $6000 \times 16 = 96{,}000$ bytes, about $96\,\mathrm{kB}$ — twice as much — and that is before counting the $6000$ control blocks, one per object.

Sanity check: shared is exactly double, because $16 = 2 \times 8$. In a real program the bigger cost is usually not these bytes but the atomic count update every time a `shared_ptr` is copied into a function.
:::

## Virtual destructors and the vtable

A **virtual function** is one a derived class can replace, with the right version chosen at run time: call `read()` through a `Sensor*` that points at a `Gyro`, and `Gyro`'s version runs.

Destruction works the same way — but only if the destructor is virtual. If you `delete` a derived object through a pointer to its base, and the base destructor is **not** virtual, the behavior is undefined. In practice, usually only the base part is destroyed, so anything the derived class owns (a buffer, a file) leaks.

```cpp
#include <cstdio>
#include <memory>

struct Sensor {
    virtual ~Sensor() { std::printf("~Sensor\n"); }
    virtual double read() const = 0;
};

struct Gyro : Sensor {
    ~Gyro() override { std::printf("~Gyro\n"); }
    double read() const override { return 0.01; }
};

int main() {
    std::unique_ptr<Sensor> s = std::make_unique<Gyro>();
    std::printf("read %.2f\n", s->read());
    std::printf("sizeof(Sensor) = %zu (one hidden vptr)\n", sizeof(Sensor));
}   // deletes through Sensor*: ~Gyro runs, then ~Sensor
// Output on a typical 64-bit Linux machine:
// read 0.01
// sizeof(Sensor) = 8 (one hidden vptr)
// ~Gyro
// ~Sensor
```

Both destructors ran, derived first. Lesson 3 breaks this on purpose.

::: key Virtual destructors
A class meant to be deleted through a pointer to its base needs a virtual destructor. Without one, deleting a derived object through a base pointer is undefined behavior, and in practice the derived part's resources leak.
:::

How does the program know, at run time, which `read()` to call? The C++ standard does not say; it is **implementation-defined**, meaning each compiler chooses and documents its own way. The way every major compiler actually does it is the **[[vtable|vtable-picture]]**:

- Each class with virtual functions gets one table of function pointers, shared by all objects of that class. `Gyro`'s table points at `Gyro::read` and `Gyro`'s destructor.
- Each object carries one hidden pointer, the **vptr**, to its class's table. That is why `sizeof(Sensor)` printed 8 even though `Sensor` declares no data: the 8 bytes are the vptr.
- A virtual call loads the vptr, loads the right slot from the table, and jumps to that address — two memory reads and an indirect jump, instead of a direct call.

In the interview, say "vtable layout is implementation-defined", then describe this common scheme.

## What std::move actually does

Here is the surprise: `std::move` does not move anything. It is a **cast** — a change of type, done at compile time, that produces no machine code of its own. It turns its argument into an **[[rvalue reference|rvalue-reference]]**, a type that means "this object may be taken apart". That type is what makes the compiler pick the move constructor instead of the copy constructor. The move itself happens later, inside that constructor.

```cpp
#include <cstdio>
#include <string>
#include <utility>

int main() {
    std::string a = "telemetry frame 0042";
    std::string&& r = std::move(a);   // only a cast: nothing moved yet
    std::printf("after std::move: a = \"%s\"\n", a.c_str());
    std::string b = std::move(r);     // the move constructor runs here
    std::printf("after the move:  b = \"%s\"\n", b.c_str());
    std::printf("a is valid but unspecified; size here = %zu\n", a.size());
}
// Output:
// after std::move: a = "telemetry frame 0042"
// after the move:  b = "telemetry frame 0042"
// a is valid but unspecified; size here = 0
```

After the first `std::move`, `a` still holds its text. Only when `b` was built did the buffer change hands. A moved-from standard object is left **valid but unspecified**: you may assign to it or destroy it, but you should not rely on its value. Here it happened to be empty.

::: warning Moving from a const object
`std::move` on a `const` object produces a `const` rvalue reference. The move constructor cannot accept that (it needs to modify the source), so the copy constructor is chosen instead — silently. If a move "is not making things faster", check for `const`.
:::

## Three examples of undefined behavior

Undefined behavior is not "it crashes". It is "no promise at all": the compiler may assume it never happens and optimize on that, so the program can do things that look impossible in the source. Three examples to have ready:

1. **Signed integer overflow.** If an `int` goes past its largest value, the behavior is undefined. (Unsigned integers are different: they wrap around by rule.) A compiler may, for example, delete a check like `if (x + 1 < x)`, because for signed `x` it "cannot" be true.
2. **Reading or writing outside an array.** `a[10]` on a ten-element array touches memory that is not part of it. It might read junk, overwrite another variable, or crash.
3. **Using memory after it is freed** — dereferencing a dangling pointer, or a double delete. Also: null dereference, uninitialized reads, and data races.

::: key Three examples of undefined behavior
Signed integer overflow; out-of-bounds array access; use after free (or double delete, or null dereference). The compiler may assume undefined behavior never happens, so the symptom can be anything, anywhere.
:::

## Data races, and std::atomic or a mutex

Picture two people updating one whiteboard tally at once. Both read "41", both add one, both write "42". Two events, one recorded.

A **data race** is the precise version: two threads access the same memory location at the same time, at least one of them writes, and nothing orders the two accesses. In C++ a data race is undefined behavior — not just a wrong count, but no promises at all.

There are two standard fixes. `std::atomic<T>` makes each operation on one variable indivisible. A **[[mutex|mutex-meaning]]** (short for "mutual exclusion") is a lock: only one thread at a time can hold it, so a whole block of code runs without interference. `std::lock_guard` is the RAII wrapper that locks in its constructor and unlocks in its destructor.

```cpp
#include <atomic>
#include <cstdio>
#include <mutex>
#include <thread>

std::atomic<long> atomic_count{0};
long locked_count = 0;
std::mutex m;

void work() {
    for (int i = 0; i < 1000000; ++i) {
        atomic_count.fetch_add(1, std::memory_order_relaxed);
        std::lock_guard<std::mutex> lock(m);
        ++locked_count;
    }
}

int main() {
    std::thread t1(work), t2(work);
    t1.join();
    t2.join();
    std::printf("atomic: %ld\n", atomic_count.load());
    std::printf("mutex:  %ld\n", locked_count);
}
// Output:
// atomic: 2000000
// mutex:  2000000
```

Two threads times one million increments is two million, and both counters get it exactly. The unprotected version is a data race, so it is not run here: its output would mean nothing.

::: key What a data race is
Two threads access the same memory location concurrently, at least one access is a write, and there is no synchronization between them. It is undefined behavior. Fix it with std::atomic for a single variable or a mutex for a larger section.
:::

## static, const and volatile

- **`static`** on a local variable means one copy that lives for the whole program and keeps its value between calls; on a class member, one copy shared by the class rather than one per object.
- **`const`** means "not modified through this name". The compiler rejects writes.
- **`volatile`** tells the compiler that every read and write of this variable is observable from outside the program, so it must not remove, merge or reorder them relative to other volatile accesses. Its real use is **[[memory-mapped hardware registers|memory-mapped-register]]**, where reading an address actually asks a device for a value.

```cpp
#include <cstdio>

int next_frame_id() {
    static int counter = 0;      // one copy, lives for the whole program
    return ++counter;
}

int main() {
    const double g0 = 9.80665;   // const: the compiler refuses writes to it
    for (int i = 0; i < 3; ++i) std::printf("frame %d\n", next_frame_id());
    std::printf("g0 = %.5f m/s^2\n", g0);
}
// Output:
// frame 1
// frame 2
// frame 3
// g0 = 9.80665 m/s^2
```

::: warning volatile is not for threads
`volatile` does not make an operation atomic, and it does not order memory between threads. Two threads doing `++v` on a `volatile int` still race. For sharing data between threads, use `std::atomic` or a mutex. Saying this unprompted in the round is a good sign to the interviewer.
:::

## Why you would avoid new in a hot path

A **hot path** is code that runs very often or under a deadline — a control loop running hundreds of times a second, say. `new` is a bad fit there for three reasons:

- **Unpredictable time.** The allocator's speed depends on the heap's state: usually fast, occasionally slow, and a real-time loop is judged by its slowest run.
- **Locking.** A general-purpose allocator may take a lock, so one thread's allocation can wait on another's.
- **Failure and fragmentation.** An allocation can fail, and long runs of allocate-and-free leave the heap in scattered pieces.

The fix, covered in depth in the real-time module, is to allocate everything at startup — fixed-size arrays, pre-reserved vectors, object pools — and nothing in the loop.

## Cache effects

The processor fetches memory a whole **[[cache line|cache-line]]** at a time — on typical x86 processors, 64 bytes, or eight `double`s — into a small, fast memory next to the core called the **cache**. Reading a neighbor of something you just read is nearly free. Jumping far away forces a slow trip to main memory.

A two-dimensional array in C++ is stored **row-major**: row 0 in full, then row 1, and so on. So walking along a row visits neighbors, and walking down a column jumps a whole row's width every step.

```cpp
#include <chrono>
#include <cstdio>
#include <vector>

int main() {
    const int N = 4096;                         // 4096 x 4096 doubles = 128 MiB
    std::vector<double> a(static_cast<size_t>(N) * N, 1.0);
    using clk = std::chrono::steady_clock;

    auto t0 = clk::now();
    double s1 = 0;
    for (int i = 0; i < N; ++i)                 // row by row: next door in memory
        for (int j = 0; j < N; ++j) s1 += a[static_cast<size_t>(i) * N + j];
    auto t1 = clk::now();
    double s2 = 0;
    for (int j = 0; j < N; ++j)                 // column by column: 32 KiB jumps
        for (int i = 0; i < N; ++i) s2 += a[static_cast<size_t>(i) * N + j];
    auto t2 = clk::now();

    auto ms = [](auto d) { return std::chrono::duration<double, std::milli>(d).count(); };
    std::printf("sums %.0f %.0f\n", s1, s2);
    std::printf("row-major:    %.0f ms\n", ms(t1 - t0));
    std::printf("column-major: %.0f ms\n", ms(t2 - t1));
}
// One run, built with g++ -std=c++17 -Wall -O2 (your times will differ):
// sums 16777216 16777216
// row-major:    20 ms
// column-major: 201 ms
```

Same array, same additions, same answer — about ten times slower, only because of the order.

::: example Why the column walk is so slow
Each row holds $4096$ doubles of $8$ bytes, so one row is

$$
4096 \times 8 = 32{,}768 \text{ bytes} = 32\,\mathrm{KiB}.
$$

Walking down a column, each step jumps $32\,\mathrm{KiB}$ — far more than one $64$-byte line — so every single read needs a new cache line. Walking along a row, one $64$-byte line holds

$$
\frac{64}{8} = 8 \text{ doubles},
$$

so only one read in eight needs a new line.

The measured ratio was $201 / 20 \approx 10$. That is in the same ballpark as the factor of $8$ in cache lines (the rest comes from the processor's prefetcher, which guesses the next line when you walk in order).

Sanity check: the two sums both equal $4096^2 = 16{,}777{,}216$, because every element is $1.0$ — so the two loops did identical work and only the order differed.
:::

The interview sentence: "Walk data in the order it is laid out."

## Check yourself

::: check
State RAII in three sentences, and name two standard library classes that follow it.
:::

::: answer
A resource is acquired in an object's constructor. It is released in the object's destructor. Because the destructor runs automatically when the object leaves scope — including an early return or an exception — the release cannot be forgotten. Examples: `std::vector`, `std::unique_ptr`, `std::lock_guard`.
:::

::: check
A class holds a big `std::vector<double>`. A teammate adds `~Buffer() { log("gone"); }`. Benchmarks now show large copies where moves used to be. Explain what happened and give two fixes.
:::

::: answer
Declaring a destructor suppressed the compiler-generated move constructor and move assignment. Moves now fall back to the copy constructor, which copies the whole vector. Fix one: also declare `Buffer(Buffer&&) = default;` and `Buffer& operator=(Buffer&&) = default;` (and default the copies too if they are still wanted, since declaring moves deletes the implicit copies). Fix two: remove the destructor and put the logging somewhere else, returning to the rule of zero.
:::

::: check
A function takes `std::shared_ptr<Model>` by value and is called 50,000 times a second. What does each call cost that a `const Model&` or a raw `Model*` would not?
:::

::: answer
Copying the `shared_ptr` into the parameter is an atomic increment of the count, and destroying it at the end of the call an atomic decrement: $2 \times 50{,}000 = 100{,}000$ atomic operations a second. If the function does not need to share ownership, pass `const Model&` instead: no count is touched.
:::

::: check
Why did `sizeof(Sensor)` print 8 when `Sensor` has no data members? What is the careful way to phrase this in an interview?
:::

::: answer
Each object of a class with virtual functions carries a hidden pointer (the vptr) to its class's table, and a pointer is 8 bytes on a 64-bit machine. The careful phrasing: "vtable layout is implementation-defined — the standard only specifies the behavior of virtual calls — but every major compiler uses one table per class and one vptr per object."
:::

::: check
A teammate says "I made the flag `volatile`, so the two threads are safe now." What do you say?
:::

::: answer
`volatile` only stops the compiler from removing or merging accesses. It does not make operations indivisible or order memory between threads, so unsynchronized access with at least one writer is still a data race — undefined behavior. Use `std::atomic<bool>` for a flag, or a mutex.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Double delete | undefined behavior; often fails later, far away |
| RAII | acquire in the constructor, release in the destructor, destructor runs automatically |
| Rule of five | declaring a destructor or a copy operation suppresses the implicit moves |
| Rule of zero | hold resources in RAII members and declare none of the five |
| unique_ptr | 8 bytes, move-only, no count, the default |
| shared_ptr | 16 bytes, control block, atomic count on every copy and destruction |
| Virtual destructor | needed to delete a derived object through a base pointer |
| vtable | implementation-defined; commonly one table per class, one vptr per object |
| std::move | a cast to an rvalue reference; the move constructor does the moving |
| Undefined behavior | signed overflow, out of bounds, use after free; no promises at all |
| Data race | concurrent access, at least one write, no synchronization; fix with atomic or mutex |
| volatile | for memory-mapped hardware, not for threads |
| new in a hot path | unpredictable time, possible locking, fragmentation; allocate at startup |
| Cache effects | walk memory in layout order; the column walk was about ten times slower |

Next lesson turns this around: you are handed a program with one of these bugs and asked to find it, live, with the compiler, AddressSanitizer, valgrind and gdb.

::: context heap-and-stack Two places memory comes from
The **stack** holds a function's local variables. It is fast and automatic: the space appears when the function starts and vanishes when it returns. The **heap** is a large pool the program borrows from on request with `new`, and the borrowed memory stays until someone gives it back with `delete`. Every ownership bug in this lesson is about heap memory, because the stack cleans up after itself and the heap does not.
:::

::: context what-ub-means Why the standard leaves it undefined
Different processors do different things when, say, an integer overflows or a bad address is read. If the standard pinned down one answer, every compiler on every chip would have to add checks to produce it, and C++ would run slower. So the standard says "no requirements" instead. The price is that a program containing undefined behavior means nothing: the compiler may assume the situation never occurs and optimize the code around that assumption.
:::

::: context raii-name A name that describes half the idea
Bjarne Stroustrup, who created C++, coined "resource acquisition is initialization". It describes the first half — getting the resource while the object is being built — but the part that does the work is the destructor releasing it. Some engineers prefer "scope-bound resource management", which says what actually happens. In an interview, use RAII, then explain it in plain words.
:::

::: context control-block Where the count lives
`std::make_shared` usually allocates the object and its control block together in one heap block. Building a `shared_ptr` from a separate `new` needs two allocations. Either way, each `shared_ptr` handle holds two pointers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="16" y="20" width="96" height="44" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="64" y1="20" x2="64" y2="64" stroke="#1f2a44" stroke-width="1"/>
  <text x="40" y="47" font-size="11" fill="#1f2a44" text-anchor="middle">obj</text>
  <text x="88" y="47" font-size="11" fill="#1f2a44" text-anchor="middle">ctrl</text>
  <text x="64" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">handles s and s2</text>
  <rect x="16" y="94" width="96" height="44" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="64" y1="94" x2="64" y2="138" stroke="#1f2a44" stroke-width="1"/>
  <text x="40" y="121" font-size="11" fill="#1f2a44" text-anchor="middle">obj</text>
  <text x="88" y="121" font-size="11" fill="#1f2a44" text-anchor="middle">ctrl</text>
  <rect x="200" y="40" width="144" height="80" rx="6" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="200" y1="80" x2="344" y2="80" stroke="#1d6fd1" stroke-width="1"/>
  <text x="272" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">control block</text>
  <text x="272" y="73" font-size="11" fill="#b4232c" text-anchor="middle">owners: 2 (atomic)</text>
  <text x="272" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">Sample object</text>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <path d="M88 42 L200 60"/><path d="M88 116 L200 64"/>
    <path d="M40 42 L200 98"/><path d="M40 116 L200 102"/>
  </g>
  <text x="272" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">one heap block (make_shared)</text>
</svg>
```
:::

::: context atomic-meaning Indivisible, even with other cores watching
An ordinary `++count` is really three steps: read the value, add one, write it back. If another core does the same three steps in between, one update is lost. An atomic increment is a single hardware operation that no other core can interrupt halfway. It is slower than an ordinary add, because the cores have to agree on who owns that piece of memory at that instant.
:::

::: context vtable-picture One table per class, one pointer per object
Two `Gyro` objects share one table. Each object's first 8 bytes (in this common scheme) are its vptr.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="16" y="20" width="100" height="44" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="66" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro object A</text>
  <text x="66" y="56" font-size="11" fill="#1d6fd1" text-anchor="middle">vptr</text>
  <rect x="16" y="90" width="100" height="44" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="66" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro object B</text>
  <text x="66" y="126" font-size="11" fill="#1d6fd1" text-anchor="middle">vptr</text>
  <rect x="190" y="44" width="150" height="64" rx="4" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="190" y1="76" x2="340" y2="76" stroke="#1d6fd1" stroke-width="1"/>
  <text x="265" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">Gyro's vtable</text>
  <text x="265" y="65" font-size="11" fill="#1f2a44" text-anchor="middle">slot: ~Gyro</text>
  <text x="265" y="97" font-size="11" fill="#1f2a44" text-anchor="middle">slot: Gyro::read</text>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <path d="M100 52 L190 60"/><path d="M100 122 L190 90"/>
  </g>
</svg>
```

A virtual call reads the vptr, reads a slot, and jumps to the address in it.
:::

::: context rvalue-reference Values you are allowed to take apart
An **rvalue** is roughly a value with no name that is about to disappear, like the result of `a + b`. Nobody can look at it afterwards, so stealing its insides is safe. An rvalue reference, written `T&&` ("T ref-ref"), binds to such values. `std::move(a)` is a promise from you to the compiler: "treat `a` as if it were about to disappear". The move constructor takes that promise at its word.
:::

::: context mutex-meaning A key on a hook
Think of a single-person bathroom with one key on a hook. Whoever holds the key goes in; everyone else waits. A mutex is that key. `lock()` takes the key (waiting if someone has it) and `unlock()` puts it back. The danger is forgetting to put it back, which is why `std::lock_guard` — RAII again — unlocks in its destructor.
:::

::: context memory-mapped-register When reading an address talks to hardware
On a microcontroller, some addresses are not memory at all. They are wired to a device: reading one address returns a sensor's latest value, and writing another starts a motor or sends a byte out of a serial port. The compiler must perform every one of those reads and writes exactly as written, which is precisely what `volatile` guarantees. Flight software meets this in device drivers, close to the hardware.
:::

::: context cache-line Why the order of the walk matters
A 64-byte line holds eight doubles. Row order uses all eight before moving on; column order uses one and jumps a whole row ahead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="30" width="30" height="20"/><rect x="50" y="30" width="30" height="20"/><rect x="80" y="30" width="30" height="20"/><rect x="110" y="30" width="30" height="20"/>
    <rect x="140" y="30" width="30" height="20"/><rect x="170" y="30" width="30" height="20"/><rect x="200" y="30" width="30" height="20"/><rect x="230" y="30" width="30" height="20"/>
  </g>
  <text x="140" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">one cache line: 8 doubles, all used (row walk)</text>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="80" width="30" height="20" fill="#f2b880"/><rect x="50" y="80" width="30" height="20"/><rect x="80" y="80" width="30" height="20"/><rect x="110" y="80" width="30" height="20"/>
    <rect x="140" y="80" width="30" height="20"/><rect x="170" y="80" width="30" height="20"/><rect x="200" y="80" width="30" height="20"/><rect x="230" y="80" width="30" height="20"/>
  </g>
  <text x="140" y="118" font-size="11" fill="#b4232c" text-anchor="middle">column walk: 1 of 8 used, then jump 32 KiB</text>
  <line x1="264" y1="90" x2="330" y2="90" stroke="#b4232c" stroke-width="2"/>
  <polygon points="340,90 328,84 328,96" fill="#b4232c"/>
</svg>
```
:::
