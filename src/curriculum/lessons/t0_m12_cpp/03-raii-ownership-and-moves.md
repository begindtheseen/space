---
id: l03-raii-ownership-and-moves
title: RAII, ownership, smart pointers and moves
minutes: 24
covers:
  - RAII, ownership, smart pointers
  - move semantics
---

Imagine a hotel where your room is released the instant you walk out of it — by the front door, the fire exit or the window. You could never forget to check out, because leaving *is* checking out.

C++ works like that hotel. Python frees an object whenever its garbage collector gets round to it, which is why, for files and locks, you wrote `with` blocks that release the resource at a known point. C++ has no garbage collector. Each object's life is tied to a **scope** — a block of code between braces — and when the scope ends, by any way out, the object's cleanup code runs and releases what it holds. The pattern is called **RAII**. It extends Python's `with` to every kind of resource, with no special syntax where you use it.

Flight software leans on this hard. Memory is set aside once, at start-up. A reviewer must see who owns every buffer. A fault check that returns early must not leak a hardware channel or leave a lock held. So modern C++ writes ownership into the types: `std::unique_ptr` means "this object owns that one, alone"; `std::shared_ptr` means "several owners, and the last one out cleans up"; a plain reference or pointer means "borrowed, not owned".

The second half is **move semantics**: handing ownership from one object to another without copying what is owned. It holds a favourite interview question — what does `std::move` actually do? The answer: nothing at run time.

## Lifetime: constructors and destructors

A **constructor** is the function that runs when an object is created. The **destructor**, written `~T()` (read "tilde T"), runs when the object's life ends. For a local variable, that is the closing brace of its scope.

Locals are destroyed in the **reverse order** of their construction, like plates on a **[[stack|stack-and-heap]]**: last on, first off. An object's members are destroyed after its destructor's body runs, again in reverse order of declaration.

```cpp
#include <iostream>
#include <string_view>

class Tracer {
 public:
  explicit Tracer(std::string_view name) : name_(name) {
    std::cout << "construct " << name_ << "\n";
  }
  ~Tracer() { std::cout << "destroy   " << name_ << "\n"; }

 private:
  std::string_view name_;
};

int main() {
  Tracer outer("outer");
  {
    Tracer inner_a("inner_a");
    Tracer inner_b("inner_b");
    std::cout << "-- leaving inner scope\n";
  }
  std::cout << "-- leaving main\n";
  return 0;
}
// Output:
// construct outer
// construct inner_a
// construct inner_b
// -- leaving inner scope
// destroy   inner_b
// destroy   inner_a
// -- leaving main
// destroy   outer
```

The `: name_(name)` after the constructor's parameters is a **member initialiser list**. It builds the member directly instead of assigning to it afterwards, and it is the only way to initialise `const` or reference members.

Nothing in `main` calls a destructor. The compiler inserts a destructor call on *every* path out of a scope: the closing brace, a `return`, a `break`, or an **exception** (an error signal thrown up through the calls) passing through. That guarantee is what everything else in this lesson rides on.

## RAII: Resource Acquisition Is Initialisation

A **resource** is anything you must give back: heap memory, an open file, a locked **[[mutex|mutex-word]]**, a **[[DMA channel|dma-channel]]**, a stretch of time with interrupts switched off.

In RAII, a resource is owned by an object: its constructor **acquires** the resource and its destructor **releases** it. The destructor runs on every path out of the scope, so the resource is released on every path — including the untested early return in a fault check, and an exception unwinding through. There are no `free`, `close` or `unlock` calls scattered through the logic; each resource has one release point, written once.

::: key
RAII — Resource Acquisition Is Initialisation: a resource is owned by an object, acquired in its constructor and released in its destructor, so scope exit — including by exception — always cleans up. It is the reason well-written C++ needs no explicit free.
:::

::: example A log file that cannot be left open
```cpp
#include <cstdio>
#include <iostream>

// Owns a C file handle. Acquire in the constructor, release in the destructor.
class LogFile {
 public:
  explicit LogFile(const char* path) : file_(std::fopen(path, "w")) {}
  ~LogFile() {
    if (file_ != nullptr) {
      std::fclose(file_);
      std::cout << "log closed\n";
    }
  }
  LogFile(const LogFile&) = delete;             // one owner only
  LogFile& operator=(const LogFile&) = delete;

  bool ok() const { return file_ != nullptr; }
  void line(double t, double alt_m) { std::fprintf(file_, "%.3f,%.1f\n", t, alt_m); }

 private:
  std::FILE* file_;
};

bool record_descent(const char* path, double start_alt_m) {
  LogFile log(path);
  if (!log.ok()) return false;            // early return: destructor still runs
  double alt = start_alt_m;
  for (int i = 0; i < 5; ++i) {
    log.line(0.1 * i, alt);
    alt -= 12.0;
    if (alt < 0.0) return false;          // another exit path, same guarantee
  }
  return true;                            // normal exit: destructor closes the file
}

int main() {
  const bool first = record_descent("descent.csv", 100.0);
  std::cout << "result = " << (first ? "ok" : "fail") << "\n";
  const bool second = record_descent("/nonexistent/dir/x.csv", 100.0);
  std::cout << "result = " << (second ? "ok" : "fail") << "\n";
  return 0;
}
// Output:
// log closed
// result = ok
// result = fail
//
// descent.csv afterwards:
// 0.000,100.0
// 0.100,88.0
// 0.200,76.0
// 0.300,64.0
// 0.400,52.0
```

`record_descent` has three exits and not one `fclose`.

- **First call.** The loop writes five lines, the altitude dropping 12 m each time: 100, 88, 76, 64, 52. It never goes below zero, so the function returns `true`, and the destructor closes the file and prints `log closed`.
- **Second call.** The folder does not exist, so `fopen` returns null and the function returns early. The destructor still runs, finds a null handle and does nothing — no special case needed.

The two `= delete` lines forbid copying a `LogFile`. A copy would give two objects holding the same handle, and calling `fclose` twice on one handle is undefined behaviour. Deleting the copy operations is how a class says "exactly one owner".
:::

The standard library is built from RAII types. `std::lock_guard` locks a mutex in its constructor and unlocks in its destructor. `std::vector` owns a heap buffer; `std::fstream` owns a file. Whenever you write a matching pair — enable and disable, claim and release — wrap it in a small class and let scope do the rest. Lesson 13 does exactly this with a `ScopedTimer` that records the elapsed time when it is destroyed.

Flight code switches exceptions off (lesson 8), but RAII's main reason remains: fault checks return early all the time, and each early return is a path a hand-written release can miss.

## Ownership on the heap

The **heap** is a pool of memory you borrow from while the program runs. `new T(args)` builds an object there and hands back a pointer; `delete p` destroys it and gives the space back. Between the two lie the three classic bugs of hand-managed memory:

- the **leak** — nobody ever calls `delete`, so the memory is lost;
- the **double delete** — two pieces of code both call `delete` on the same object;
- the **use after free** — code keeps using a pointer after the object is gone.

All three come from one unclear question: when several pointers refer to one heap object, *which one* must delete it? Modern C++ makes the owner a type. Application code never writes `new` or `delete`; it uses one of two **smart pointers** — objects that act like pointers but own what they point at.

### unique_ptr: one owner

`std::unique_ptr` is like the only key to a locker. Exactly one `unique_ptr` refers to the object, and when that `unique_ptr` is destroyed or reset, the object is deleted.

- **No extra cost.** It *is* one pointer wide, and its destructor is a single `delete`.
- **No copies.** A copy would mean two owners, so copying is forbidden.
- **Moves allowed.** You can hand the key over — *move* it — which transfers ownership.

Create one with `std::make_unique`, which allocates and builds in one step. Lend the object out as a raw pointer from `.get()` or as a reference; neither owns anything.

### shared_ptr: shared owners

`std::shared_ptr` is like a shared flat where the last person out switches off the lights. It carries a second pointer, to a **control block** holding a **reference count** — the number of owners. Copying a `shared_ptr` adds one to the count, destroying one subtracts one, and the last owner deletes the object.

That bookkeeping has a price:

- sixteen bytes instead of eight;
- an extra allocation for the control block (`std::make_shared` merges it with the object's own allocation);
- an **[[atomic operation|atomic-count]]** every time the count changes.

Use it only when ownership truly is shared — rare in flight code, common in tools. One trap: two objects that hold `shared_ptr`s to each other form a **[[cycle|shared-cycle]]** whose counts never reach zero, so both leak. `std::weak_ptr`, a pointer that watches without counting, breaks such cycles.

::: example unique_ptr, shared_ptr and the transfer of ownership
```cpp
#include <iostream>
#include <memory>

struct Imu {
  double bias_rad_s;
  Imu(double b) : bias_rad_s(b) { std::cout << "Imu created\n"; }
  ~Imu() { std::cout << "Imu destroyed\n"; }
};

// Takes ownership: the caller must std::move a unique_ptr in.
void install(std::unique_ptr<Imu> imu) {
  std::cout << "installed imu with bias " << imu->bias_rad_s << "\n";
}   // imu goes out of scope here: the Imu is destroyed

int main() {
  static_assert(sizeof(std::unique_ptr<Imu>) == sizeof(Imu*), "unique_ptr is one pointer wide");
  std::cout << "sizeof(unique_ptr) = " << sizeof(std::unique_ptr<Imu>) << "\n";
  std::cout << "sizeof(shared_ptr) = " << sizeof(std::shared_ptr<Imu>) << "\n";

  std::unique_ptr<Imu> imu = std::make_unique<Imu>(0.002);
  Imu* observer = imu.get();                     // non-owning view, still valid
  std::cout << "observer sees bias " << observer->bias_rad_s << "\n";

  install(std::move(imu));                       // ownership transferred
  std::cout << "after move, imu is " << (imu ? "non-null" : "null") << "\n";

  auto shared_a = std::make_shared<Imu>(0.005);
  auto shared_b = shared_a;                      // copy: count goes to 2
  std::cout << "use_count = " << shared_a.use_count() << "\n";
  shared_a.reset();                              // count goes to 1, no destruction yet
  std::cout << "use_count = " << shared_b.use_count() << "\n";
  return 0;
}   // shared_b destroyed: count hits 0, Imu destroyed
// Output:
// sizeof(unique_ptr) = 8
// sizeof(shared_ptr) = 16
// Imu created
// observer sees bias 0.002
// installed imu with bias 0.002
// Imu destroyed
// after move, imu is null
// Imu created
// use_count = 2
// use_count = 1
// Imu destroyed
```

(An **IMU**, inertial measurement unit, is the box of gyros and accelerometers that senses motion.) Follow the first `Imu`.

1. `make_unique` creates it, and `imu` owns it.
2. `observer` gets a plain pointer from `.get()`. It can look at the `Imu` but does not own it.
3. `install` takes a `unique_ptr` *by value*. That is how a function says "I take ownership". So the caller must write `std::move(imu)` to hand it over.
4. When `install` returns, its parameter — now the owner — is destroyed, and the `Imu` with it. So `Imu destroyed` prints *before* `main`'s next line, and `imu` is then null.

Replace `std::move(imu)` with plain `imu` and the compiler refuses: `use of deleted function ... unique_ptr(const unique_ptr&)`. A copied `unique_ptr` is not a run-time error; it is not a program.

The second `Imu` shows the count: 2 after the copy, 1 after `reset`, and the object dies only when `shared_b`, the last owner, goes away. The `static_assert` is a check the compiler runs while building; it writes the "no extra cost" claim into the code (lesson 7 uses it heavily).
:::

::: key
`unique_ptr` is exclusive ownership with zero overhead; it is the default. `shared_ptr` adds an atomic reference count and should appear only when ownership genuinely is shared. Neither belongs in a hard-real-time hot loop, because both can trigger deallocation.
:::

That last sentence is a flight-software rule, not a style preference. Destroying or resetting a `unique_ptr`, or bringing a `shared_ptr` count to zero, calls `delete`. And `delete` is a heap operation whose running time has **[[no upper bound|heap-latency]]**.

So flight code allocates every long-lived object at start-up, typically with `make_unique` in the constructor of the top-level application object, holds those pointers for the whole mission, and lets the control loop reach the objects through references, which own nothing and cost nothing to pass.

## The rule of zero and the rule of five

Every class has up to six **special member functions**: the default constructor, the destructor, the copy constructor, copy assignment, the move constructor and move assignment. The compiler writes them member by member. For a class whose members all look after themselves — `double`, `std::array`, `std::vector`, `std::unique_ptr` — the compiler's versions are exactly right, and the class writes none of them. This is the **rule of zero**, and most of your classes should live here: the `VehicleState` struct, an estimator holding a fixed-size covariance, a controller holding gains.

A class that holds a *raw* resource — a `FILE*`, a buffer from `new`, a hardware handle — is different. The compiler's copy would duplicate the pointer, not the resource, and then two objects would release the same thing. Such a class must define, or explicitly delete, all five of: the destructor, copy constructor, copy assignment, move constructor and move assignment. That is the **rule of five**.

The danger is doing it halfway. Define only a destructor, and the compiler drops the move operations but still writes the shallow copy, which compiles cleanly and deletes the same memory twice. `= default` and `= delete` say out loud which operations exist.

## Move semantics

Imagine moving house. You could build an exact copy of your house at the new address and knock the old one down — or hand over the keys. Moving an object in C++ is handing over the keys. To know when that is allowed, C++ sorts expressions into two kinds:

- An **[[lvalue|lvalue-rvalue]]** names an object that sticks around: a variable, a member, an array element. Someone may still need it.
- An **rvalue** is a temporary about to vanish: the result of `make_buffer(2000)`, the value of `a + b`. Nobody will look at it again.

C++11 added a reference type that binds only to rvalues, written `T&&` (read "T ref-ref", an **rvalue reference**). A function can then offer one version for "an object someone still needs" and another for "an object nobody will look at again". The second may **steal**: copy the pointer to the resource instead of the resource, and leave the source empty.

A **move constructor** `T(T&& other)` builds a new object that way. A **move assignment** `T& operator=(T&& other)` does the same for an existing object. The **moved-from** object must be left valid — its destructor will still run — but its contents are unspecified: give it a new value or let it die, nothing else.

### What std::move does

`std::move(x)` lets you treat a named object as an rvalue when you are finished with it. Despite its name, it moves nothing. It is a **cast**: it returns `x` as a `T&&`, which changes which function the compiler picks — the move constructor instead of the copy constructor. The stealing happens inside that move operation, not in `std::move`.

If `x` is `const`, no move operation can accept it, because moving changes the source; the compiler quietly falls back to the copy constructor.

::: key
`std::move` does nothing at run time — it is a cast to an rvalue reference, which lets overload resolution pick a move constructor or move assignment that steals the resource instead of copying it. The moved-from object is left valid but unspecified.
:::

::: example A buffer that moves instead of copying
```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

// A buffer that owns heap memory through a raw pointer, so it must
// define all five special members (the "rule of five").
class SampleBuffer {
 public:
  explicit SampleBuffer(std::size_t n) : size_(n), data_(new double[n]()) {
    std::cout << "alloc " << n << "\n";
  }
  ~SampleBuffer() {
    if (data_ != nullptr) std::cout << "free  " << size_ << "\n";
    delete[] data_;
  }
  SampleBuffer(const SampleBuffer& other) : size_(other.size_), data_(new double[other.size_]) {
    std::copy(other.data_, other.data_ + size_, data_);
    std::cout << "copy  " << size_ << "\n";
  }
  SampleBuffer(SampleBuffer&& other) noexcept : size_(other.size_), data_(other.data_) {
    other.size_ = 0;          // leave the source valid but empty
    other.data_ = nullptr;
    std::cout << "move  " << size_ << "\n";
  }
  SampleBuffer& operator=(const SampleBuffer& other) {
    if (this != &other) {
      SampleBuffer copy(other);           // copy-and-swap
      std::swap(size_, copy.size_);
      std::swap(data_, copy.data_);
    }
    return *this;
  }
  SampleBuffer& operator=(SampleBuffer&& other) noexcept {
    std::swap(size_, other.size_);
    std::swap(data_, other.data_);
    return *this;
  }

  std::size_t size() const { return size_; }

 private:
  std::size_t size_;
  double* data_;
};

SampleBuffer make_buffer(std::size_t n) {
  SampleBuffer b(n);
  return b;                   // local returned by value: moved (or elided), never copied
}

int main() {
  std::cout << "-- construct a and copy it\n";
  SampleBuffer a(1000);
  SampleBuffer b = a;

  std::cout << "-- move a into c\n";
  SampleBuffer c = std::move(a);
  std::cout << "a.size() after move = " << a.size() << "\n";

  std::cout << "-- return from a function\n";
  SampleBuffer d = make_buffer(2000);

  std::cout << "-- push into a vector\n";
  std::vector<SampleBuffer> log;
  log.reserve(2);
  log.push_back(std::move(d));
  log.push_back(make_buffer(3000));

  std::cout << "-- std::move on a const object copies\n";
  const SampleBuffer frozen(10);
  SampleBuffer e = std::move(frozen);
  std::cout << "e.size() = " << e.size() << "\n";
  std::cout << "-- leaving main\n";
  return 0;
}
// Output:
// -- construct a and copy it
// alloc 1000
// copy  1000
// -- move a into c
// move  1000
// a.size() after move = 0
// -- return from a function
// alloc 2000
// -- push into a vector
// move  2000
// alloc 3000
// move  3000
// -- std::move on a const object copies
// alloc 10
// copy  10
// e.size() = 10
// -- leaving main
// free  10
// free  10
// free  2000
// free  3000
// free  1000
// free  1000
```

Read the output against the code.

1. **`SampleBuffer b = a;` copies**, because `a` is an lvalue still in use: a second block of 1000 doubles.
2. **`SampleBuffer c = std::move(a);` moves.** The **[[1000 doubles change owner|move-steal]]** without one being copied, and `a` is left empty, size 0.
3. **`make_buffer` prints neither `copy` nor `move`.** The compiler built `b` directly in `d`'s storage: **copy elision**, guaranteed since C++17 for returned temporaries and done for named locals whenever the compiler can. Otherwise the return would have moved, since a returned local is treated as an rvalue.
4. **Each `move` under the vector** is the vector taking over a buffer — `d` by `std::move`, and the temporary from `make_buffer(3000)` because it is already an rvalue.
5. **`std::move(frozen)` prints `copy 10`.** The move constructor cannot bind to a `const` source, so the copy constructor is chosen, with no warning.

At the end, destruction runs in reverse: `e`, `frozen`, the vector's two elements, `c`, `b` — 10, 10, 2000, 3000, 1000, 1000, as printed. `a` and `d` were moved from and hold null, so they print nothing.
:::

Two details of the class matter.

First, the move operations are marked **`noexcept`** — a promise never to throw an exception. When a `std::vector` grows into a bigger block, it moves its elements only if their move constructor makes that promise; otherwise, if they can be copied, it **[[copies them instead|noexcept-moves]]**. Forget `noexcept` and your class gets copied everywhere it expected to be moved.

Second, copy assignment uses **copy-and-swap**: build the copy first, then swap it into place. If the copy fails for lack of memory, the object is unchanged.

::: warning
Do not write `return std::move(local);`. A local returned by value is already treated as an rvalue, and the explicit `std::move` stops the compiler from eliding the construction — you turn a free operation into a move. (`g++ -Wall` warns: `moving a local object in a return statement prevents copy elision`.) Write `return local;`. `std::move` belongs in a return when you return a *member* of the object. Under C++17, a parameter passed by rvalue reference needs it too; C++20 moves those automatically.
:::

::: warning
After `install(std::move(imu));`, `imu` is null. Following a moved-from `unique_ptr` follows null. Reading a moved-from `std::vector` gives some valid but unspecified contents. Treat a moved-from variable as dead until you assign to it, and let clang-tidy's `bugprone-use-after-move` check (lesson 13) enforce the rule.
:::

## Where this shows up in GNC code

Inside a control loop, almost nothing in this lesson happens: the state is a small value, buffers were allocated at start-up and are reached through references, and nothing is created or destroyed 400 times a second. Ownership and moves live at the edges: the start-up code that builds sensor drivers with `make_unique` and hands them to the estimator, the simulation harness that moves ten thousand trajectories into a results vector, the recorder that moves a full telemetry buffer into an output queue.

## Check yourself

::: check
In `main` you declare `Tracer a("a"); Tracer b("b"); { Tracer c("c"); } Tracer d("d");`. In what order are the four destructors called?
:::

::: answer
`c` first, at the closing brace of the inner block where its scope ends. Then, when `main` returns, the rest go in reverse order of construction: `d`, `b`, `a`. Destruction mirrors construction, which lets a later object safely depend on an earlier one for its whole life.
:::

::: check
A function `configure` takes a `std::unique_ptr` to an `Imu` by value. A caller creates `imu` with `std::make_unique` and writes `configure(imu);`. Why does this fail to compile, how do you fix it, and what is `imu` afterwards?
:::

::: answer
Passing `imu` by value asks for a copy of a `unique_ptr`, and the copy constructor is deleted — two owners would be a contradiction. The fix is `configure(std::move(imu));`, which casts `imu` to an rvalue so the move constructor is chosen and ownership moves into the parameter. Afterwards the caller's `imu` is null. The `Imu` is destroyed when `configure`'s parameter goes out of scope, unless `configure` moved it on somewhere else.
:::

::: check
A class holds a `double* data_` allocated with `new[]` and defines only a destructor that calls `delete[] data_`. A colleague writes `Buffer b = a;`. What happens, and what does the rule of five say the class should have done?
:::

::: answer
The compiler's copy constructor copies the pointer, so `a` and `b` share one array. At scope exit both destructors call `delete[]` on it: undefined behaviour, typically a crash or a corrupted heap.

The rule of five says a class managing a raw resource must define or delete all five special members. Either write a deep copy and a stealing move, as `SampleBuffer` does, or write `Buffer(const Buffer&) = delete;` and its assignment twin so the copy becomes a compile error. Better still, hold the array in a `std::vector` or `std::unique_ptr` and follow the rule of zero.
:::

::: check
Why is a `shared_ptr` sixteen bytes when a `unique_ptr` is eight, and what does copying each of them cost at run time?
:::

::: answer
A `shared_ptr` holds two pointers: one to the object and one to a control block storing the reference count (and the deleter). Copying it copies both and adds one to the count atomically; destroying it subtracts one atomically and deletes the object if the count reaches zero.

A `unique_ptr` holds one pointer and cannot be copied at all. Moving it copies one pointer and sets the source to null — no atomic operation, no count.
:::

::: check
Explain why smart pointers are kept out of a hard-real-time hot loop even though they add little or no cost to the pointer operations themselves.
:::

::: answer
Following the pointer is not the issue; freeing the object is. A `unique_ptr` destroyed or reset calls `delete`, and so does the last `shared_ptr` when the count reaches zero. `delete` is a heap operation whose running time cannot be bounded — the allocator may merge free blocks, take a lock, or touch memory that is not in the cache. A loop with a deadline cannot contain an operation with no worst-case time, so objects are created at start-up and reached through references, and nothing in the loop can trigger a free.
:::

## Summary

| Item | Meaning |
| --- | --- |
| constructor / destructor `~T()` | run at creation and at scope exit; locals destroyed in reverse order |
| RAII | resource acquired in a constructor, released in a destructor; every exit path cleans up |
| `std::unique_ptr`, `std::make_unique` | exclusive ownership, one pointer wide, move-only |
| `std::shared_ptr`, `std::make_shared` | shared ownership, atomic count, 16 bytes; only when ownership truly is shared |
| `.get()`, `T&`, `T*` | non-owning views; how a hot loop reaches objects allocated at start-up |
| rule of zero | members manage themselves; write no special member functions |
| rule of five | a raw resource means define or delete all five special members |
| lvalue / rvalue, `T&&` | persistent object / temporary; an rvalue reference binds only to temporaries |
| `std::move(x)` | a cast to `T&&`; no run-time work; lets the move overload be chosen |
| moved-from state | valid but unspecified; assign or destroy, nothing else |
| `noexcept` on moves | needed for `std::vector` to move rather than copy when it grows |
| copy elision | returning a temporary builds it in place; never `return std::move(local)` |

Next: classes proper — how C++ builds interfaces with inheritance and virtual functions, what a virtual call costs in nanoseconds and in how easily the code can be analysed, and when a flight codebase chooses templates instead.

::: context stack-and-heap Two places an object can live
Local variables live on the **stack**: each function call gets a fresh slab of memory on top, and it is thrown away the moment the call returns. That is fast and automatic, and it is why locals die in reverse order. The **heap** is a separate pool for objects that must outlive the function that made them, or whose size is only known at run time. Only heap objects need an owner to free them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="sh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker></defs>
  <text x="80" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">stack</text>
  <rect x="20" y="118" width="120" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">main(): imu</text>
  <rect x="20" y="78" width="120" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">install(): param</text>
  <rect x="20" y="38" width="120" height="36" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="80" y="60" font-size="11" fill="#6c7a93" text-anchor="middle">next call goes here</text>
  <text x="260" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">heap</text>
  <rect x="190" y="30" width="160" height="130" rx="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="48" width="50" height="24" fill="#6c7a93"/>
  <rect x="280" y="90" width="56" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="308" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">Imu</text>
  <rect x="215" y="124" width="40" height="22" fill="#6c7a93"/>
  <line x1="140" y1="136" x2="278" y2="108" stroke="#b4232c" stroke-width="1.5" marker-end="url(#sh)"/>
  <text x="200" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">grey: other blocks in use</text>
</svg>
```

The red arrow is a `unique_ptr` on the stack owning an object on the heap. When the stack slab holding it goes away, the destructor frees the heap object too.
:::

::: context mutex-word What a mutex is
A **mutex** (short for "mutual exclusion") is a lock that two threads of a program use to take turns with shared data. One thread locks it, uses the data, and unlocks it; any other thread that tries to lock it in the meantime has to wait. Forget to unlock — say, on an early return — and every other thread waits forever. That is why `std::lock_guard` unlocks in its destructor.
:::

::: context dma-channel What a DMA channel is
**DMA**, direct memory access, is a piece of hardware that copies data between a device and memory without the processor doing the work — for example, streaming IMU samples into a buffer while the processor runs the control law. A flight computer has only a few DMA channels. Code claims one, uses it, and must give it back. A channel leaked on a fault path is gone until the computer restarts, which makes it a textbook case for RAII.
:::

::: context atomic-count Why the count must be atomic
Two threads might copy the same `shared_ptr` at the same moment. Adding one to a number is really three steps — read it, add, write it back — and if two threads interleave those steps, one increment can be lost. The count then hits zero too early and the object is deleted while still in use. An **atomic** operation does the read-add-write as one step that cannot be interrupted. It is correct, but it costs noticeably more than a plain addition, because the processor cores must agree on the value.
:::

::: context shared-cycle A cycle that never cleans up
Suppose object A holds a `shared_ptr` to B, and B holds a `shared_ptr` back to A. When the rest of the program lets go of both, each still has one owner — the other — so neither count reaches zero, and both leak.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <defs><marker id="cy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <rect x="60" y="40" width="80" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="60" font-size="13" fill="#1f2a44" text-anchor="middle">A</text><text x="100" y="76" font-size="11" fill="#1f2a44" text-anchor="middle">count 1</text>
  <rect x="220" y="40" width="80" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="60" font-size="13" fill="#1f2a44" text-anchor="middle">B</text><text x="260" y="76" font-size="11" fill="#1f2a44" text-anchor="middle">count 1</text>
  <path d="M140,50 C170,30 190,30 218,50" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cy)"/>
  <path d="M220,74 C190,94 170,94 142,74" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#cy)"/>
  <text x="180" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">shared_ptr</text>
  <text x="180" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">shared_ptr</text>
  <text x="180" y="124" font-size="11" fill="#b4232c" text-anchor="middle">nobody else points here, yet neither count is 0</text>
</svg>
```

Making one of the two links a `std::weak_ptr` fixes it: a weak pointer can look at the object but does not add to its count.
:::

::: context heap-latency Why delete has no upper bound
Freeing memory is not one fixed step. The allocator may merge the freed block with its neighbours, search or reorganise its free lists, take a lock because another thread is allocating, or touch memory that has fallen out of the cache. Most calls are quick; a rare one is very slow, and nobody can prove a maximum. A real-time schedule is built on worst cases, so one unbounded call breaks it. Lesson 9 lists this with the other things banned from the hot loop.
:::

::: context lvalue-rvalue Where "lvalue" and "rvalue" come from
The names are older than C++. In early languages, an **l**value was something that could stand on the **l**eft of an `=` — a place you can store into, like `x` in `x = 5`. An **r**value could only appear on the **r**ight — a plain value like `5` or `a + b`. Today's rules are more detailed, but the picture still works: an lvalue is a *place* that persists, an rvalue is a *value* about to disappear.
:::

::: context move-steal What stealing looks like in memory
A move copies two small fields — the size and the pointer — and then clears them in the source. The 8,000 bytes of samples on the heap never move at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ms" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">before</text>
  <rect x="10" y="26" width="110" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">a: 1000, ptr</text>
  <rect x="230" y="26" width="120" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="45" font-size="11" fill="#1f2a44" text-anchor="middle">1000 doubles</text>
  <line x1="120" y1="40" x2="228" y2="40" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ms)"/>
  <text x="10" y="84" font-size="12" font-weight="700" fill="#1f2a44">after c = std::move(a)</text>
  <rect x="10" y="92" width="110" height="28" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="65" y="111" font-size="11" fill="#6c7a93" text-anchor="middle">a: 0, null</text>
  <rect x="10" y="130" width="110" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="149" font-size="11" fill="#1f2a44" text-anchor="middle">c: 1000, ptr</text>
  <rect x="230" y="130" width="120" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="149" font-size="11" fill="#1f2a44" text-anchor="middle">same 1000 doubles</text>
  <line x1="120" y1="144" x2="228" y2="144" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ms)"/>
</svg>
```

A copy, by contrast, would allocate a second block of 8,000 bytes and fill it value by value.
:::

::: context noexcept-moves Why the vector insists on noexcept
When a vector grows, it builds its elements in a new block one by one. Suppose it is moving them and the fifth move throws an exception. The first four elements have already been gutted, so the vector can neither finish nor go back — your data is damaged. Copying does not have that problem: if a copy fails, the originals are untouched and the vector can give up cleanly. So the standard library moves only when the move promises, with `noexcept`, never to throw. Flight code compiles without exceptions, but the rule still decides which constructor the library calls.
:::
