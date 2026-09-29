---
id: l03-destructors-and-raii
title: Destructors and RAII
minutes: 24
covers:
  - Destructors; virtual destructors for polymorphic bases
---

A library book comes with a rule: you borrowed it, so you bring it back. People forget. Now imagine a better book — one that walks itself back to the library the moment you leave the building, whichever door you leave by. Front door, side door, fire exit during an alarm: it does not matter. You cannot forget to return it, because returning is not your job any more.

C++ has exactly that kind of book. The last two lessons were about how an object is born. This one is about how it dies. The **destructor** is a special function that runs automatically at the end of an object's life. If an object *acquires* something in its constructor — a file, a lock, a timer, a block of memory — and *releases* it in its destructor, then the release happens by itself, on every way out of the scope, including the emergency exit: an exception.

That pattern has a name, **[[RAII|raii-name]]**, and it is the single most important idea in C++. It is how `std::vector` frees its memory, how `std::unique_ptr` from the last module deletes what it owns, and how flight software makes sure a telemetry file is closed and a shared lock is let go even when something goes wrong halfway through a cycle. By the end of this lesson you will have written three RAII classes of your own, and met the one situation where a destructor needs the keyword `virtual`.

## The destructor

A destructor is written like a constructor with a **[[tilde|tilde]]** (`~`) in front of the name. Read `~Stage()` aloud as "tilde Stage", or "the Stage destructor".

```cpp
struct Stage {
    ~Stage() { std::printf("  ~Stage body\n"); }
};
```

The rules are short and strict:

- A class has **exactly one** destructor. It takes no arguments and has no return type, so it cannot be overloaded.
- You never call it yourself in ordinary code. The compiler calls it when the object's lifetime ends.
- If you do not write one, the compiler writes one for you, which destroys each member and does nothing else.
- It is **`noexcept`** automatically — a promise that no exception will escape it. More on that below.

When does "the end of its lifetime" happen? It depends on where the object lives:

| Where the object lives | When the destructor runs |
| --- | --- |
| a local variable (automatic storage) | at the closing brace of its scope, however the scope is left |
| an object made with `new` | when `delete` is called on it |
| a temporary | at the end of the full expression — usually the semicolon |
| a member of another object | right after the enclosing object's destructor body |
| a global or `static` | after `main` returns |

The first row is the one RAII is built on.

## Destruction runs in reverse

Think of stacking plates. The last plate you put on the stack is the first one you take off. Objects in a scope work the same way: **they are destroyed in the reverse order of their construction.** That goes for local variables in a block and for the members inside an object.

The reason is dependencies. Something built later may use something built earlier — a parser holding a reference to a buffer, a lock protecting a file. Tearing down in reverse means nothing is destroyed while something that might still use it is alive.

Inside one object, the order has three steps: the destructor's **body** runs first (while every member is still alive, so the body can use them), then the **members** are destroyed in reverse declaration order. Last lesson's rule — members are built in declaration order — has this as its mirror image.

::: key
Objects are destroyed in the **reverse order of construction**: locals in reverse order of their definitions, members in reverse declaration order, and an object's destructor body runs before its members are destroyed.
:::

## Exceptions and stack unwinding

To see why this matters, you need a little of how C++ reports errors. You met `throw` and `catch` briefly in the last module; here is the whole picture you need.

- `throw std::runtime_error("chamber pressure low");` creates an **exception** — an object describing what went wrong — and immediately abandons the current function. Read it as "throw a runtime error".
- The exception travels *up* the chain of callers, leaving each function in turn, until it reaches a `try` block with a matching `catch`.
- `catch (const std::exception& e)` catches it; `e.what()` gives back the message.

Leaving all those functions on the way up is called **[[stack unwinding|unwinding]]**. And here is the guarantee RAII stands on:

> As an exception leaves each scope, the destructor of every fully constructed local object in that scope runs, in reverse order of construction.

So an exception is just another way out of a scope, and the destructors run on that way out as on any other.

::: example Watching the order, with and without an exception
`Tracer` prints when it is built and when it is destroyed. `Stage` holds two `Tracer` members, given their names by default member initializers.

```cpp
#include <cstdio>
#include <stdexcept>

struct Tracer {
    const char* name;
    explicit Tracer(const char* n) : name(n) { std::printf("  construct %s\n", name); }
    ~Tracer() { std::printf("  destroy   %s\n", name); }
};

struct Stage {
    Tracer engine{"engine"};        // declared first
    Tracer tank{"tank"};            // declared second
    ~Stage() { std::printf("  ~Stage body\n"); }
};

void ignition(bool fail) {
    Tracer valve("valve");
    Stage stage;
    Tracer igniter("igniter");
    if (fail) throw std::runtime_error("chamber pressure low");
    std::printf("  ignition ok\n");
}

int main() {
    std::printf("normal run:\n");
    ignition(false);
    std::printf("failing run:\n");
    try {
        ignition(true);
    } catch (const std::exception& e) {
        std::printf("caught: %s\n", e.what());
    }
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
normal run:
  construct valve
  construct engine
  construct tank
  construct igniter
  ignition ok
  destroy   igniter
  ~Stage body
  destroy   tank
  destroy   engine
  destroy   valve
failing run:
  construct valve
  construct engine
  construct tank
  construct igniter
  destroy   igniter
  ~Stage body
  destroy   tank
  destroy   engine
  destroy   valve
caught: chamber pressure low
```

Follow the normal run. Construction goes top to bottom: `valve`, then `stage` (which builds its members `engine`, `tank` in declaration order), then `igniter`. At the closing brace, destruction is the exact mirror: `igniter` first, then `stage` — its body, then its members in reverse, `tank` before `engine` — and `valve` last.

Now the failing run. The `throw` happens before "ignition ok", so that line never prints. But the destruction sequence is **identical**, line for line, and all of it happens *before* `caught:` prints. The exception did not skip any cleanup. It unwound the scope exactly as the closing brace would have.

Sanity check: count them. Five objects were constructed (`valve`, `engine`, `tank`, `igniter`, and the `Stage` that owns two of them), and five destruction steps appear (four `destroy` lines and one `~Stage body`). Each was released exactly once.
:::

Two more rules and a warning complete the picture.

**If a constructor throws, that object's destructor does not run** — the object never finished being born, so there is nothing whole to destroy. But any *members* that were already fully built are destroyed, in reverse order. This is why RAII members matter: if a class holds a `std::vector` and a `FileHandle` as members, and its constructor throws after both are built, both are cleaned up. If it held a raw `FILE*` instead, nothing would close it.

**A destructor must not throw.** Destructors are `noexcept` by default, so an exception that tries to escape one calls `std::terminate`, which ends the program on the spot. g++ even warns at compile time: `'throw' will always call 'terminate' [-Wterminate]`, with the note `in C++11 destructors default to 'noexcept'`. If releasing a resource can fail — closing a file whose last write did not reach the disk, say — record the failure (a counter, a log entry) inside the destructor, and offer a separate `close()` function for callers who need to check it.

::: warning An exception nobody catches may skip every destructor
The guarantee is for exceptions that *are* caught. If an exception escapes `main`, the program calls `std::terminate`, and whether the stack is unwound first is up to the implementation. With g++ on Linux, this program never prints `released`:

```cpp
struct T { ~T() { std::puts("released"); } };
int main() { T t; throw std::runtime_error("nobody catches this"); }
```

It prints `terminate called after throwing an instance of 'std::runtime_error'` and aborts. So if your program uses exceptions at all, put a `try`/`catch` at the top of `main` (and at the top of every thread), or your careful RAII cleanup may never run.
:::

## RAII: tie every resource to an object

Now the idea, stated precisely.

::: key
**RAII — resource acquisition is initialization.** Every resource is owned by an object. The constructor acquires it; the destructor releases it. Because destructors run automatically at scope exit — by `return`, by `break`, by the closing brace, or by an exception — the resource is released exactly once and cannot leak.
:::

A **resource** here means anything that must be given back: heap memory, an open file, a locked mutex, a network socket, a hardware channel you have claimed, even "the time I started measuring". Imagine the code without it: every function that opens a file would need a `fclose` before every `return` and every point that could throw — and some later edit would add a `return` and forget one.

The exercise for this module asks for three RAII types. Here they are in outline. Each follows the same shape: acquire in the constructor, release in the destructor, and forbid copying.

**`ScopedTimer`** measures how long a scope takes. Its "resource" is the start time. It reads a **[[steady clock|steady-clock]]** in the constructor, reads it again in the destructor, and prints the difference in microseconds. Put one at the top of a function and you have profiled it, with no chance of forgetting the "stop" call on an early return.

**`FileHandle`** owns a `FILE*`, the C library's handle for an open file, which `std::fopen` gives you and `std::fclose` must give back. The constructor opens; the destructor closes, if the open succeeded. An open file is a [[limited resource|file-limit]], so a leaked one is a real failure, not a tidiness problem.

**`MutexLock`** holds a **mutex** — short for "mutual exclusion", a lock that lets only one thread at a time into a section of code — while its scope lasts. The constructor calls `lock()`, the destructor calls `unlock()`. A mutex left locked by a function that threw means every other thread waiting for it [[waits forever|deadlock]].

About the lines ending in `= delete`: they forbid copying. Two `FileHandle`s both believing they own one `FILE*` would close it twice; two `MutexLock`s would unlock one mutex twice. Lesson 04 explains copying and why the compiler's default copy is wrong here, and lesson 06 explains `= delete` itself. `FileHandle` should also be *movable* — handing ownership from one handle to another, the way `unique_ptr` does — and that is lesson 05. For now, copying is switched off, and that is enough to be safe.

::: example Three resources, one exception, everything released
```cpp
#include <chrono>
#include <cstdio>
#include <mutex>
#include <stdexcept>

class ScopedTimer {
public:
    explicit ScopedTimer(const char* name)
        : name_(name), t0_(std::chrono::steady_clock::now()) {}
    ~ScopedTimer() {
        const auto us = std::chrono::duration_cast<std::chrono::microseconds>(
            std::chrono::steady_clock::now() - t0_).count();
        std::printf("timer %s: %lld us\n", name_, static_cast<long long>(us));
    }
    ScopedTimer(const ScopedTimer&) = delete;
    ScopedTimer& operator=(const ScopedTimer&) = delete;
private:
    const char* name_;
    std::chrono::steady_clock::time_point t0_;
};

class FileHandle {
public:
    FileHandle(const char* path, const char* mode) : f_(std::fopen(path, mode)) {}
    ~FileHandle() {
        if (f_) { std::fclose(f_); std::puts("file closed"); }
    }
    FileHandle(const FileHandle&) = delete;             // moves: lesson 05
    FileHandle& operator=(const FileHandle&) = delete;
    bool valid() const { return f_ != nullptr; }
    std::FILE* get() const { return f_; }
private:
    std::FILE* f_;
};

class MutexLock {
public:
    explicit MutexLock(std::mutex& m) : m_(m) { m_.lock(); }
    ~MutexLock() { m_.unlock(); std::puts("mutex released"); }
    MutexLock(const MutexLock&) = delete;
    MutexLock& operator=(const MutexLock&) = delete;
private:
    std::mutex& m_;
};

std::mutex telemetry_mutex;

void write_frame(bool corrupt) {
    ScopedTimer timer("write_frame");
    MutexLock lock(telemetry_mutex);
    FileHandle file("frame.bin", "wb");
    if (!file.valid()) throw std::runtime_error("could not open frame.bin");
    std::fputs("FRAME", file.get());
    if (corrupt) throw std::runtime_error("checksum mismatch");
    std::puts("frame written");
}

int main() {
    write_frame(false);
    try {
        write_frame(true);
    } catch (const std::exception& e) {
        std::printf("caught: %s\n", e.what());
    }
    if (telemetry_mutex.try_lock()) {
        std::puts("mutex is free again");
        telemetry_mutex.unlock();
    }
}
```

One run printed:

```text
frame written
file closed
mutex released
timer write_frame: 94 us
file closed
mutex released
timer write_frame: 134 us
caught: checksum mismatch
mutex is free again
```

The microsecond figures change from run to run — on the same machine a second run gave 90 and 378 — because they include opening a file, which depends on the operating system. Everything else is the same every time.

Read the first call. `write_frame(false)` builds timer, lock, file — in that order — writes, and prints "frame written". At the closing brace they are released in reverse: file closed, mutex released, then the timer reports.

Now the second call. It throws "checksum mismatch" after the file is open. Unwinding runs the same three destructors in the same reverse order — **file, mutex, timer** — and only after that does `main` print `caught:`. Each resource was released exactly once, in reverse construction order, before the exception was reported.

The last line is the proof that matters. `try_lock()` takes the mutex only if nobody holds it, and it succeeded, so the lock taken inside the failed call really was given back.

Sanity check on the order: `file` was built last, so it must be released first. It was, in both runs.
:::

A stricter `FileHandle` would throw from its constructor when `fopen` fails, so every `FileHandle` that exists holds an open file — a stronger invariant, but it needs exceptions, so code built without them uses the `valid()` check instead. And in production you rarely write these yourself: the [[standard library already has them|std-raii]].

::: warning A nameless guard dies at the semicolon
`MutexLock{telemetry_mutex};` with no variable name looks like it takes the lock for the rest of the scope. It does not: it creates a *temporary*, which is destroyed at the end of its full expression — the semicolon. With print statements added, the output is `locked`, `unlocked`, and only then `protected work?`: the code after it runs unprotected, and g++ says nothing. The round-bracket spelling `MutexLock(telemetry_mutex);` is a different trap: C++ reads it as declaring a new variable named `telemetry_mutex`, so here it fails to compile with `no matching function for call to 'MutexLock::MutexLock()'`. Always give an RAII guard a name: `MutexLock lock(telemetry_mutex);`.
:::

## Virtual destructors for polymorphic bases

There is one situation where the right destructor can fail to run, and it needs an idea lesson 10 teaches fully: **inheritance**. Here is just enough of it.

A class can be built on top of another. `class StarTracker : public Sensor` (read "StarTracker is a public kind of Sensor") makes `StarTracker` a **derived class** of the **base class** `Sensor`. A `StarTracker` object contains a whole `Sensor` inside it, plus its own extra members. A `Sensor*` pointer is allowed to point at a `StarTracker`.

A member function marked **`virtual`** in the base is looked up at run time: calling `s->read()` through a `Sensor*` runs the `StarTracker` version if the object really is a `StarTracker`. A class with at least one virtual function is called **polymorphic** ("many shapes"). The `override` on the derived version is a check that it really replaces a base virtual function; lesson 10 covers it.

The destructor is a member function too. If it is *not* virtual, then `delete s;` on a `Sensor*` calls whatever destructor the *pointer's* type names — `~Sensor` — no matter what the object really is.

::: example Deleting a star tracker through a sensor pointer
```cpp
#include <cstdio>

struct Buffer {
    Buffer()  { std::puts("  buffer acquired"); }
    ~Buffer() { std::puts("  buffer released"); }
};

class Sensor {                                  // a base class
public:
    virtual double read() { return 0.0; }
    ~Sensor() { std::puts("  ~Sensor"); }       // NOT virtual
};

class StarTracker : public Sensor {             // a derived class
public:
    double read() override { return 1.0; }
    ~StarTracker() { std::puts("  ~StarTracker"); }
private:
    Buffer image_;                              // a member that owns something
};

int main() {
    std::puts("make it:");
    Sensor* s = new StarTracker;
    std::printf("  read() = %g\n", s->read());
    std::puts("delete through Sensor*:");
    delete s;
}
```

g++ warns while compiling, under `-Wall`:

```text
warning: deleting object of polymorphic class type 'Sensor' which has non-virtual destructor might cause undefined behavior [-Wdelete-non-virtual-dtor]
```

Run anyway, one run printed:

```text
make it:
  buffer acquired
  read() = 1
delete through Sensor*:
  ~Sensor
```

`read()` was virtual, so the call found `StarTracker`'s version and returned 1. But the destructor was not, so `delete` ran only `~Sensor`. `~StarTracker` never ran, so the `Buffer` member was never destroyed: "buffer acquired" has no matching "buffer released". If `Buffer` had owned heap memory or a file, it would have leaked.

That was the *good* outcome. The standard says this is **undefined behavior**, full stop. Built with AddressSanitizer (`-fsanitize=address`), the same program stops with `new-delete-type-mismatch`, reporting "size of the allocated type: 16 bytes; size of the deallocated type: 8 bytes" — `delete` handed back a `StarTracker`-sized block as if it were a `Sensor`.

**The fix is one word.** Declare the base destructor `virtual`:

```cpp
virtual ~Sensor() { std::puts("  ~Sensor"); }
```

and the same program prints:

```text
make it:
  buffer acquired
  read() = 1
delete through Sensor*:
  ~StarTracker
  buffer released
  ~Sensor
```

Now `delete` looks up the destructor at run time, like `read()`, finds `~StarTracker`, and the full reverse-order teardown happens: the derived body, its member, then the base.

Sanity check: every "acquired" now has a "released", and the base is destroyed last because it was built first.
:::

There is a second correct design. If code should *never* delete a derived object through a base pointer, make the base destructor **`protected` and non-virtual**. `protected` means derived classes may use it but outside code may not. Then `delete s;` on a `Sensor*` does not compile — g++ says `'Sensor::~Sensor()' is protected within this context` — while using a `StarTracker` through a `Sensor&` still works. The mistake becomes impossible instead of merely handled.

::: key
Deleting a derived object through a base pointer with a non-virtual destructor is **undefined behavior**: in practice only the base destructor runs, so derived members leak. Either make the base destructor **virtual**, or make it **protected and non-virtual** to forbid that deletion.
:::

The same rule covers smart pointers. A `std::unique_ptr<Sensor>` that owns a `StarTracker` calls `delete` on a `Sensor*` when it dies, so it needs `virtual ~Sensor()` too.

Where does this matter in flight software? **Anywhere an object is deleted through a base pointer** — a list of `std::unique_ptr<Sensor>` built at start-up from a configuration file, say. And it is one more reason many flight teams avoid owning polymorphic objects on the heap at all. A common style creates every object once, at initialization, as a [[fixed member or static object|static-allocation]], and never deletes anything, so the question never arises. A virtual destructor is still cheap insurance: a class with virtual functions already carries the [[hidden pointer that virtual calls use|vtable-peek]].

## Check yourself

::: check
A function defines, in order, `ScopedTimer t("fdir");`, `MutexLock l(fault_mutex);` and `FileHandle log("fdir.log", "a");`, and then a call inside it throws. List what is printed or released, in order, and say when the `catch` in the caller runs.
:::

::: answer
All three are fully constructed local objects, so unwinding destroys them in reverse order of construction: first `log` (the file is closed), then `l` (the mutex is unlocked), then `t` (the timer prints its elapsed microseconds). Only after all three destructors have run does control reach the caller's `catch` block. Reverse order is the right order here: the file was opened while the lock was held, so it is closed while the lock is still held, and the timer — started first — measures the whole thing, including the cleanup.
:::

::: check
A class `Recorder` has members `FileHandle file_;` then `std::vector<char> buf_;`, and its constructor body throws after both are built. Does `~Recorder` run? What happens to `file_` and `buf_`?
:::

::: answer
`~Recorder` does not run: the constructor never finished, so there is no complete `Recorder` to destroy. But both members were fully constructed before the body began, so they are destroyed — in reverse declaration order, `buf_` first (its memory freed), then `file_` (the file closed). This is exactly why resources should be held by RAII members: the cleanup happens even though the owning object's own destructor never runs. With a raw `FILE*` member instead of `FileHandle`, the file would stay open.
:::

::: check
Why does `write_frame` in the second example end by testing `try_lock()` in `main`, and what would it print if `MutexLock` were replaced by bare `telemetry_mutex.lock()` at the top of `write_frame` and `telemetry_mutex.unlock()` at the bottom?
:::

::: answer
`try_lock()` succeeds only if nobody holds the mutex, so it is a direct test that the lock taken inside the failed call was given back. With bare `lock()`/`unlock()`, the "checksum mismatch" `throw` leaves `write_frame` before the `unlock()` line, so the mutex stays locked. `try_lock()` would then return `false` and "mutex is free again" would not print. In a real program the next caller of `lock()` — the telemetry thread's next cycle, say — would block forever. The RAII version cannot have that bug, because the unlock is in a destructor, and destructors run on the exception path.
:::

::: check
A base class `Actuator` has virtual functions and a public, non-virtual destructor. Code only ever uses actuators as `Actuator&` parameters and never deletes one through an `Actuator*`. Is there a bug today? What would you change, and why?
:::

::: answer
No undefined behavior today: the dangerous operation, deleting a derived object through a base pointer, never happens. But nothing stops someone adding it tomorrow, perhaps via a `std::unique_ptr<Actuator>`, and g++ would only warn. Either fix is correct. Make the destructor `virtual` — free here, since the class already carries the hidden table pointer — so that such a deletion is safe. Or make it `protected` and non-virtual, so a future `delete` through `Actuator*` is a compile error while use through `Actuator&` is untouched; that states the design ("actuators are never owned polymorphically") in the code itself.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Destructor `~T()` | runs automatically at the end of an object's lifetime | exactly one per class, no arguments, `noexcept` by default |
| When it runs | end of scope, `delete`, end of full expression, after the owner's destructor | for locals, on every way out of the scope |
| Order | reverse of construction | locals in reverse; destructor body first, then members in reverse declaration order |
| Stack unwinding | leaving scopes as an exception travels up | every fully constructed local is destroyed on the way |
| Constructor throws | the object never existed | its destructor does not run; its built members are destroyed |
| Destructor throws | exception escapes a `noexcept` function | `std::terminate`: never throw from a destructor |
| Uncaught exception | escapes `main` | unwinding may not happen; catch at the top of `main` |
| RAII | acquire in the constructor, release in the destructor | released exactly once, even under exceptions |
| `ScopedTimer`, `FileHandle`, `MutexLock` | a time, a `FILE*`, a mutex | copying forbidden; moves are lesson 05 |
| Virtual destructor | `virtual ~Base()` | needed wherever a derived object is deleted through a base pointer |
| Alternative | `protected` non-virtual destructor | makes that deletion a compile error |

The next lesson asks what happens when an object is copied. For a `Vector3` the compiler's copy is perfect; for a class owning a raw pointer it gives two owners of one resource, and you will see exactly why a destructor that is correct for one object becomes a double free for two.

::: context raii-name Where the awkward name comes from
The idea and its name come from Bjarne Stroustrup, who created C++, and from the work on making C++ programs safe when exceptions are thrown. "Resource acquisition is initialization" describes the first half: getting a resource happens as part of building an object. The half that makes it valuable — the release happens as part of destroying it — is left out, and programmers have joked about the name ever since. Some prefer "scope-bound resource management", which says what it does. Other languages borrowed the idea: Python's `with` statement and Rust's ownership rules solve the same problem.
:::

::: context tilde The tilde as "undo"
The `~` character is called a tilde. In C and C++ it is also the bitwise-NOT operator, which flips every bit of a number, so `~Stage` reads naturally as "the opposite of `Stage`" — the function that undoes what the constructor did. You will occasionally see "dtor" and "ctor" in comments and code reviews; they are programmers' short names for destructor and constructor.
:::

::: context unwinding The stack unwinds like a spring
Each function call pushes a frame onto the stack. When `ignition` throws, the exception passes back up through the frames, and each frame's locals are destroyed as it is left, until a matching `catch` is found:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="170" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="105" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">main: try / catch</text>
  <rect x="20" y="62" width="170" height="36" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">ignition: valve, stage</text>
  <rect x="20" y="104" width="170" height="36" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="126" font-size="12" text-anchor="middle" fill="#1f2a44">igniter ... throw</text>
  <line x1="215" y1="130" x2="215" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polygon points="215,30 209,42 221,42" fill="#b4232c"/>
  <text x="228" y="126" font-size="11" fill="#b4232c">1. destroy igniter</text>
  <text x="228" y="84" font-size="11" fill="#b4232c">2. destroy stage, valve</text>
  <text x="228" y="42" font-size="11" fill="#1d6fd1">3. catch runs</text>
  <text x="20" y="160" font-size="11" fill="#6c7a93">the exception travels up; each scope is cleaned as it is left</text>
</svg>
```

(In the example `igniter` and `valve` share one function; the picture splits them only to show the direction.)
:::

::: context steady-clock Why a steady clock
A computer has more than one clock. The **system clock** tells the time of day, and it can jump: when the machine synchronizes with a time server or a GPS receiver, it may be set forwards or even backwards. Time a scope with it across such a jump and you can get a negative duration. `std::chrono::steady_clock` never goes backwards; it only counts ticks since some fixed starting point. It cannot tell you the date, but it is exactly right for "how long did this take", which is why every timing measurement in this course uses it.
:::

::: context file-limit Why a leaked file matters
An operating system gives each process a limited number of open files — on Linux the usual default is 1,024 — and sockets, pipes and devices count against the same limit. A telemetry recorder that leaks one file handle per failed write will, after enough failures, find that `fopen` returns null for everything, including the log it needs to report the problem. The fault shows up hours after its cause and far from it, which is the worst kind of bug to diagnose.
:::

::: context deadlock When a lock is never released
A thread that tries to lock a mutex someone else holds stops and waits. If the holder threw an exception and never unlocked, the waiter waits forever. This is a kind of **deadlock**, and on a flight computer it looks like a task that silently stops running:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="36" font-size="11" fill="#1f2a44">thread A</text>
  <rect x="70" y="24" width="90" height="18" fill="#1d6fd1"/>
  <text x="115" y="37" font-size="11" text-anchor="middle" fill="#fff">holds lock</text>
  <text x="170" y="37" font-size="11" fill="#b4232c">throws, no unlock</text>
  <text x="10" y="86" font-size="11" fill="#1f2a44">thread B</text>
  <rect x="70" y="74" width="60" height="18" fill="#8fb8f0"/>
  <text x="100" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">works</text>
  <rect x="130" y="74" width="210" height="18" fill="#fff" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="235" y="87" font-size="11" text-anchor="middle" fill="#b4232c">waiting for the lock, forever</text>
  <line x1="130" y1="50" x2="130" y2="110" stroke="#6c7a93" stroke-dasharray="2 3"/>
  <text x="130" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">B calls lock()</text>
</svg>
```

A watchdog timer usually catches it by resetting the processor, which turns a software bug into a lost stretch of the mission.
:::

::: context std-raii The standard library's versions
You will write these three once, to understand them, and then mostly use the standard library's: `std::lock_guard` and `std::scoped_lock` lock a mutex for a scope (`scoped_lock` can take several mutexes at once without deadlocking), `std::unique_lock` is a movable lock guard, and `std::ifstream` and `std::ofstream` are file streams that close in their destructors. `std::unique_ptr` with a custom deleter, from the last module, can wrap nearly any C-style handle, including a `FILE*`. All of them are RAII classes shaped exactly like the ones in this lesson.
:::

::: context static-allocation Why flight code avoids delete altogether
NASA JPL's "Power of Ten" rules for safety-critical code include one that forbids dynamic memory allocation after initialization. The reasons: heap allocation can fail, can take an unpredictable time, and can fragment memory over a long mission. Code written this way creates every object at start-up — as members, as statics, or with memory set aside once — and keeps it until power-off. Nothing is ever deleted, so deletion through a base pointer cannot happen, and polymorphic objects are passed around only by reference.
:::

::: context vtable-peek The hidden pointer inside a polymorphic object
A class with virtual functions gets one hidden member: a pointer to a table of function addresses for its real type, called a **vtable**. That is why `Sensor` was 8 bytes (the hidden pointer alone) and `StarTracker` 16 (the pointer plus its `Buffer`, padded) in the sanitizer's report. A virtual destructor is one more entry in the same table (the picture is simplified; real tables hold a little more bookkeeping):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#1f2a44">a StarTracker object</text>
  <rect x="20" y="26" width="110" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">hidden pointer</text>
  <rect x="20" y="56" width="110" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="75" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">image_ (Buffer)</text>
  <line x1="130" y1="41" x2="200" y2="41" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="208,41 198,36 198,46" fill="#1d6fd1"/>
  <text x="210" y="18" font-size="11" fill="#1f2a44">StarTracker's vtable</text>
  <rect x="210" y="26" width="130" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="275" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">read</text>
  <rect x="210" y="56" width="130" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="275" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">~StarTracker</text>
  <text x="20" y="112" font-size="11" fill="#6c7a93">delete through Sensor* looks up the destructor here, like read()</text>
</svg>
```

Lesson 11 measures what this costs.
:::
