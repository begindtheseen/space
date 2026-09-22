---
id: l03-raii-ownership-and-moves
title: RAII, ownership, smart pointers and moves
minutes: 28
covers:
  - RAII, ownership, smart pointers
  - move semantics
---

Python frees an object when its garbage collector notices that nothing refers to it any more. *When* that happens is not yours to control, which is why, for files and locks, you learned to write `with` blocks that release the resource at a known point. C++ has no garbage collector. Its answer is stronger and simpler: an object's lifetime is tied to a scope, its destructor runs at a known instant on every path out of that scope, and any resource the object owns is released there. The pattern is called RAII, it generalises `with` to every kind of resource, and it needs no special syntax at the point of use.

Flight software leans on this harder than most code. Memory is allocated once, at initialisation, and never freed in the control loop; a reviewer must be able to read who owns every buffer and who releases it; a fault-handling path that returns early must not leak a DMA channel or leave a mutex held. Ownership has to be explicit, and modern C++ writes it into the types. `std::unique_ptr` says "this object owns that one, alone"; `std::shared_ptr` says "several owners, the last one out cleans up"; a plain reference or pointer says "borrowed, not owned".

The second half of the lesson is *move semantics*, the C++11 feature that lets ownership travel from one object to another without copying what is owned. It is also the source of one of the most common interview questions in the field — what does `std::move` actually do? — and the answer is: nothing at run time.

## Lifetime: constructors and destructors

A constructor runs when an object is created; the destructor, written `~T()`, runs when the object's lifetime ends. For a local variable that is the closing brace of its scope, and locals are destroyed in the reverse order of their construction. Members of an object are destroyed after the enclosing destructor's body, again in reverse declaration order.

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

The `: name_(name)` after the constructor's parameter list is a *member initialiser list*; it constructs the member directly rather than default-constructing it and assigning afterwards, and it is the only way to initialise `const` or reference members. Nothing in `main` calls the destructors. The compiler emits a destructor call on every path that leaves a scope — the closing brace, a `return`, a `break`, an exception propagating through — and that guarantee is the mechanism everything else in this lesson rides on.

## RAII: Resource Acquisition Is Initialisation

The name is awkward and the idea is not. A resource — heap memory, a file handle, a mutex lock, a DMA channel, a disabled-interrupts state — is owned by an object. The object's constructor acquires it and its destructor releases it. Because the destructor runs at scope exit on every path, the resource is released on every path, including the early return in a fault check that nobody thought to test, and including an exception unwinding through the scope. Well-written C++ has no explicit `free`, `close` or `unlock` calls scattered through its logic; each resource has exactly one release point, in a destructor, written once.

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

`record_descent` has three exits and no `fclose`. The `LogFile` destructor closes the file on all three; when the open fails, the destructor finds a null handle and does nothing, so there is no need for a special case in the caller. The two `= delete` lines forbid copying a `LogFile`: a copy would produce two objects holding the same handle, and two `fclose` calls on one handle is undefined behaviour. Deleting the copy operations is how a class states "exactly one owner".
:::

The standard library is built from RAII types. `std::lock_guard` locks a mutex in its constructor and unlocks in its destructor, so an early return can never leave a mutex held; `std::vector` owns a heap buffer and frees it in its destructor; `std::fstream` owns a file. When you find yourself writing a matching acquire and release pair — enable and disable, claim and release — wrap the pair in a small class and let scope do the rest. Lesson 13 uses exactly this for a `ScopedTimer` that prints its elapsed time when destroyed.

Flight code compiles with exceptions disabled (lesson 8), which removes one of RAII's motivations but not the main one: fault checks return early constantly, and every early return is a path a hand-written release call can miss.

## Ownership on the heap

`new T(args)` allocates an object on the heap and returns a pointer; `delete p` destroys it and frees the memory. Between the two lie the three classic bugs of manual memory management — the leak, the double delete and the use after free — and all three come from one ambiguity: when several pointers refer to one heap object, *which* is responsible for deleting it? Modern C++ makes the owner a type. You never write `new` or `delete` in application code; you write one of two smart pointers.

`std::unique_ptr` expresses exclusive ownership. Exactly one `unique_ptr` refers to the object; when it is destroyed or reset, the object is deleted. It has no run-time overhead beyond a raw pointer — it *is* one pointer wide, and its destructor is a single `delete` — and it cannot be copied, because a copy would mean two owners. It can be *moved*, which transfers ownership. Create one with `std::make_unique`, which allocates and constructs in one step, and lend the object to others as a raw pointer from `.get()` or as a reference, neither of which owns anything.

`std::shared_ptr` expresses shared ownership. It carries a second pointer to a control block holding a reference count; copying increments the count atomically, destroying decrements it, and the last owner deletes the object. It costs sixteen bytes rather than eight, a control-block allocation (`std::make_shared` folds it into the object's) and an atomic operation per copy. Use it only when ownership genuinely is shared, which is rare in flight code and common in tooling. Cycles of `shared_ptr` never reach zero and leak; `std::weak_ptr` breaks them.

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

Follow the first `Imu`. `make_unique` creates it and `imu` owns it. `install` takes a `unique_ptr` *by value*, which is how a function declares that it takes ownership, so the caller must write `std::move(imu)` to hand it over; when `install` returns, its parameter — now the owner — is destroyed and the `Imu` with it, before `main` prints its next line. Replace `std::move(imu)` with plain `imu` and the compiler refuses with `use of deleted function ... unique_ptr(const unique_ptr&)`: copying a `unique_ptr` is not a run-time error, it is not a program. The `static_assert` is a compile-time check that documents the zero-overhead claim in the code itself; lesson 7 uses the same tool heavily.
:::

::: key
`unique_ptr` is exclusive ownership with zero overhead; it is the default. `shared_ptr` adds an atomic reference count and should appear only when ownership genuinely is shared. Neither belongs in a hard-real-time hot loop, because both can trigger deallocation.
:::

That last sentence is a flight-software rule, not a style preference. Destroying or resetting a `unique_ptr`, or decrementing a `shared_ptr` count to zero, calls `delete`, and `delete` is a heap operation whose latency is unbounded (lesson 9 goes into why). The pattern in flight code is therefore: allocate every long-lived object at initialisation, typically with `make_unique` inside the constructor of the top-level application object; hold the pointers for the life of the mission; and let the control loop reach the objects through references, which own nothing and cost nothing to pass.

## The rule of zero and the rule of five

Every class has up to six *special member functions*: the default constructor, the destructor, the copy constructor, copy assignment, the move constructor and move assignment. The compiler generates them for you, member by member, and for a class whose members all manage themselves — `double`, `std::array`, `std::vector`, `std::unique_ptr` — the generated versions are exactly right. Such a class writes none of them. This is the **rule of zero**, and it is where most of your classes should live: the `VehicleState` struct, an estimator holding a fixed-size covariance, a controller holding gains.

A class that holds a raw resource — a `FILE*`, a `new`-ed buffer, a hardware handle — is different. Its generated copy would duplicate the pointer, not the resource, and two objects would release the same thing. Such a class must define, or explicitly delete, all five of the destructor, copy constructor, copy assignment, move constructor and move assignment: the **rule of five**. The danger is partial compliance. Defining only a destructor suppresses the implicit move operations and leaves the implicit shallow copy in place, which compiles cleanly and double-frees at scope exit. `= default` and `= delete` let you say explicitly which operations exist.

## Move semantics

Some expressions name objects that persist: a variable, a member, an array element. These are *lvalues*. Others produce temporaries that are about to vanish: the result of `make_buffer(2000)`, the value of `a + b`. These are *rvalues*. C++11 added a reference type that binds only to rvalues, written `T&&`, so that a function can offer one overload for "an object someone still needs" and another for "an object nobody will look at again". The second overload is allowed to *steal*: copy the pointer to the resource rather than the resource, and leave the source empty.

A **move constructor** `T(T&& other)` does exactly that, and a **move assignment** `T& operator=(T&& other)` does the same for an existing object. The moved-from object must be left valid — its destructor will still run — but its contents are unspecified; the only sensible things to do with it are to assign a new value or let it die.

`std::move(x)` is the tool that lets you treat an lvalue as an rvalue when you know you no longer need it. Despite its name it moves nothing. It is a cast: it returns `x` as a `T&&`, and that changes which overload the compiler selects — the move constructor instead of the copy constructor. There is no run-time work in `std::move` itself; the stealing happens inside whichever move operation the cast causes to be chosen. If `x` is `const`, no move operation can accept it (moving modifies the source), so overload resolution quietly falls back to the copy constructor and nothing is moved at all.

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

Read the output against the code. `SampleBuffer b = a;` copies, because `a` is an lvalue still in use. `SampleBuffer c = std::move(a);` moves: 1000 doubles change owner without one being copied, and `a` is left empty. `make_buffer` returns a local by value and prints neither `copy` nor `move` — the compiler built `b` directly in `d`'s storage, an optimisation called *copy elision*, guaranteed by C++17 for temporaries and performed for named locals whenever the compiler can; had it not applied, the return would have moved, since a returned local is treated as an rvalue automatically. Each `move` line under the vector is it taking over a buffer. And `std::move(frozen)` on a `const` object prints `copy 10`: the move constructor cannot bind to a `const` source, so the copy constructor is chosen without a warning. Destruction at the end runs in reverse — `e`, `frozen`, the vector's two elements, `c`, `b` — while `a` and `d`, moved from and holding null, print nothing.
:::

Two details of the class matter. The move operations are `noexcept`: `std::vector` reallocates by moving its elements only if their move constructor promises not to throw, and otherwise copies them, so a class that forgets `noexcept` gets copied everywhere it expected to be moved. And copy assignment uses *copy-and-swap* — build the copy, then swap it into place — so a failed allocation leaves the object unchanged.

::: warning
Do not write `return std::move(local);`. A local returned by value is already treated as an rvalue, and the explicit `std::move` prevents the compiler from eliding the construction altogether — you turn a free operation into a move. Write `return local;`. The one time `std::move` belongs in a return is when returning a *member* or a parameter that was passed by rvalue reference.
:::

::: warning
After `install(std::move(imu));`, `imu` is null. Reading through a moved-from `unique_ptr` dereferences null; reading a moved-from `std::vector` gives you some valid but unspecified contents. Treat a moved-from variable as dead until you assign to it, and let clang-tidy's `bugprone-use-after-move` check (lesson 13) enforce the rule.
:::

## Where this shows up in GNC code

Inside a control loop, almost nothing in this lesson happens: the state is a small value copied by value, buffers were allocated at boot and are reached through references, and nothing is created or destroyed at 400 Hz. Ownership and moves live at the edges — the initialisation code that builds sensor drivers with `make_unique` and hands them to the estimator, the simulation harness that moves ten thousand trajectories into a results vector, the recorder that moves a full telemetry buffer into an output queue.

## Check yourself

::: check
In `main` you declare `Tracer a("a"); Tracer b("b"); { Tracer c("c"); } Tracer d("d");`. In what order are the four destructors called?
:::

::: answer
`c` first, at the closing brace of the inner block, because its scope ends there. Then, when `main` returns, the remaining locals are destroyed in reverse order of construction: `d`, then `b`, then `a`. Destruction order is always the mirror image of construction order within a scope, which is what lets a later object safely depend on an earlier one for its whole life.
:::

::: check
A function `configure` takes a `std::unique_ptr` to an `Imu` by value. A caller creates `imu` with `std::make_unique` and writes `configure(imu);`. Why does this fail to compile, how do you fix it, and what is `imu` afterwards?
:::

::: answer
Passing `imu` by value asks for a copy of a `unique_ptr`, and the copy constructor is deleted — two owners of one object would be a contradiction. The fix is `configure(std::move(imu));`, which casts `imu` to an rvalue so that the move constructor is selected and ownership transfers into the parameter. Afterwards the caller's `imu` is null; the `Imu` is destroyed when `configure`'s parameter goes out of scope, unless `configure` moved it on somewhere else.
:::

::: check
A class holds a `double* data_` allocated with `new[]` and defines only a destructor that calls `delete[] data_`. A colleague writes `Buffer b = a;`. What happens, and what does the rule of five say the class should have done?
:::

::: answer
The compiler generates a copy constructor that copies the pointer, so `a` and `b` refer to the same array. At scope exit both destructors run and `delete[]` is called twice on one allocation: undefined behaviour, typically a crash or heap corruption. The rule of five says a class managing a raw resource must define or delete all five special members. Either implement a deep copy and a stealing move as `SampleBuffer` does, or write `Buffer(const Buffer&) = delete;` and its assignment twin so the copy is a compile error. Better still, hold the array in a `std::vector` or `std::unique_ptr` and follow the rule of zero.
:::

::: check
Why is a `shared_ptr` sixteen bytes when a `unique_ptr` is eight, and what does copying each of them cost at run time?
:::

::: answer
A `shared_ptr` holds two pointers: one to the object and one to a control block that stores the reference count (and the deleter). Copying it increments that count with an atomic operation and copying two pointers; destroying it decrements atomically and, if the count reaches zero, deletes the object. A `unique_ptr` holds one pointer and cannot be copied at all; moving it copies one pointer and nulls the source, with no atomic operation and no count.
:::

::: check
Explain why smart pointers are excluded from a hard-real-time hot loop even though they add little or no overhead to the pointer operations themselves.
:::

::: answer
The overhead of dereferencing is not the issue; deallocation is. When a `unique_ptr` is destroyed or reset it calls `delete`, and when a `shared_ptr` copy is destroyed and the count reaches zero, it too calls `delete`. `delete` is a heap operation whose execution time cannot be bounded — the allocator may coalesce free blocks, take a lock, or touch cold memory. A control loop with a deadline cannot contain an operation with no worst-case time. Objects are therefore created at initialisation and reached through references, so that nothing in the loop can trigger a free.
:::

## Summary

| Item | Meaning |
| --- | --- |
| constructor / destructor `~T()` | run at creation and at scope exit; locals destroyed in reverse order |
| RAII | resource acquired in a constructor, released in a destructor; every exit path cleans up |
| `std::unique_ptr`, `std::make_unique` | exclusive ownership, one pointer wide, move-only |
| `std::shared_ptr`, `std::make_shared` | shared ownership, atomic count, 16 bytes; only when ownership truly is shared |
| `.get()`, `T&`, `T*` | non-owning views; how a hot loop reaches objects allocated at boot |
| rule of zero | members manage themselves, write no special member functions |
| rule of five | a raw resource means define or delete all five special members |
| lvalue / rvalue, `T&&` | persistent object / temporary; rvalue reference binds only to temporaries |
| `std::move(x)` | a cast to `T&&`; no run-time work; enables the move overload |
| moved-from state | valid but unspecified; assign or destroy, nothing else |
| `noexcept` on moves | required for `std::vector` to move rather than copy on reallocation |
| copy elision | returning a temporary constructs it in place; never `return std::move(local)` |

Next: classes proper — how C++ builds interfaces with inheritance and virtual functions, what a virtual call costs in nanoseconds and in analysability, and when a flight codebase chooses templates instead.
