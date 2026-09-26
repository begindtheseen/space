---
id: l08-const-static-and-friend
title: const member functions, static members and friends
minutes: 22
covers:
  - const member functions and mutable
  - static members; friend functions
---

A museum puts its most precious objects behind glass. Visitors can walk around a fossil, read its label, measure it with their eyes — but not touch it. The museum can still let *some* things happen to an object behind glass: the lighting can change, a guard can dust the case. What it promises is that the fossil itself stays as it is.

C++ has the same idea. A `const` object is behind glass, and only the member functions that promise to look without touching may be called on it. This lesson is about that promise and two other keywords that change who can do what to a class. **`const` member functions** promise not to change the object. **`mutable`** marks the few members — like the lighting — that may change anyway. **`static` members** belong to the whole class instead of to each object, like the museum's visitor counter at the door. And **`friend`** hands a trusted outsider a key to the private rooms.

All four show up in flight code. A telemetry reader gets a `const&` to the vehicle state so it cannot corrupt it. A health monitor counts live sensor objects. And a class that prints itself to a log needs a stream operator that reaches its private data — the job `friend` was made for (lesson 07 already used a friend `swap`).

## const member functions: a promise to look, not touch

You met the syntax in `cod_cpp_01_basics`: a `const` after a member function's parameter list. Read `double mean() const` as "mean, a const member function". Now the precise rule.

Every member function receives a **[[hidden pointer|this-pointer]]** to the object it was called on, named `this`. In an ordinary member function of `SampleWindow`, `this` has type `SampleWindow*`. In a `const` member function, it has type `const SampleWindow*` — "pointer to const SampleWindow". So inside the function, every member is seen through that const pointer and is read-only.

That gives the two rules:

1. Inside a `const` member function, you cannot assign to a data member or call a non-`const` member function on `*this`.
2. On a `const` object — or through a `const&` or `const*` — you can call *only* `const` member functions.

Here is what the compiler says when you break each rule. The class has a non-const `add` and a const `first` that tries to cheat:

```cpp
class SampleWindow {
public:
    void add(double x) { buf_[0] = x; ++n_; }
    double first() const {
        n_ = 0;                  // try to change a member in a const function
        return buf_[0];
    }
private:
    std::array<double, 4> buf_{};
    std::size_t n_ = 0;
};
void report(const SampleWindow& w) {
    w.add(9.81);                 // try to call a non-const function
}
```

```text
cod_cpp_03_raii_08_err.cpp: In member function 'double SampleWindow::first() const':
cod_cpp_03_raii_08_err.cpp:6:12: error: assignment of member 'SampleWindow::n_' in read-only object
cod_cpp_03_raii_08_err.cpp: In function 'void report(const SampleWindow&)':
cod_cpp_03_raii_08_err.cpp:14:10: error: passing 'const SampleWindow' as 'this' argument discards qualifiers [-fpermissive]
```

The second message confuses people. It means: to call `add`, the compiler would have to turn a `const SampleWindow*` into a plain `SampleWindow*` — throw away the `const` "qualifier" — and it will not. The fix is never a cast. Either the function should be `const`, or the caller should not have a `const` view.

### What "not modify" really means

The promise is about the object's **observable state**: what anyone outside can learn by calling its public functions. It is not about every bit in memory. Most of the time the two are the same. The interesting cases are where they differ.

**A cache.** Suppose computing the mean of a window of samples is expensive. It would be nice to compute it once and remember it. But `mean()` should be `const` — asking for the mean does not change the samples. Storing the answer changes a member, though. The member is a private detail: whether the mean was computed a moment ago or is computed now, the caller gets the same number. So it is not part of the observable state.

That is what **`mutable`** is for. A `mutable` data member may be changed even inside a `const` member function, and even in a `const` object.

::: example A cached mean with mutable
An accelerometer channel keeps the last four samples. `mean()` is `const` and caches its answer:

```cpp
#include <array>
#include <cstdio>

class SampleWindow {
public:
    void add(double x) {                    // changes the samples: NOT const
        buf_[n_ % buf_.size()] = x;
        ++n_;
        mean_valid_ = false;                // the cached mean is now stale
    }

    double mean() const {                   // promises: the samples do not change
        if (!mean_valid_) {
            std::puts("  (computing mean)");
            const std::size_t count = n_ < buf_.size() ? n_ : buf_.size();
            double sum = 0.0;
            for (std::size_t i = 0; i < count; ++i) sum += buf_[i];
            mean_cache_ = sum / static_cast<double>(count);   // OK: mutable
            mean_valid_ = true;                                // OK: mutable
        }
        return mean_cache_;
    }

private:
    std::array<double, 4> buf_{};
    std::size_t n_ = 0;
    mutable double mean_cache_ = 0.0;       // a cache: may change inside const functions
    mutable bool   mean_valid_ = false;
};

void report(const SampleWindow& w) {        // read-only access
    std::printf("mean = %.4f m/s^2\n", w.mean());
    std::printf("mean = %.4f m/s^2\n", w.mean());
}

int main() {
    SampleWindow w;
    for (double a : {9.79, 9.81, 9.82, 9.80}) w.add(a);
    report(w);
    w.add(9.86);                            // overwrites the oldest sample
    report(w);
}
```

Output:

```text
  (computing mean)
mean = 9.8050 m/s^2
mean = 9.8050 m/s^2
  (computing mean)
mean = 9.8225 m/s^2
mean = 9.8225 m/s^2
```

Walk through it:

1. Four samples go in. `report` gets a `const SampleWindow&`, so it may call only `const` functions — `mean()` qualifies.
2. The first `mean()` finds the cache invalid, computes $(9.79 + 9.81 + 9.82 + 9.80) / 4 = 9.805$, stores it in the `mutable` members, and prints the message once.
3. The second `mean()` finds the cache valid and returns it without recomputing — no message.
4. `add(9.86)` writes into slot $4 \bmod 4 = 0$, replacing the oldest sample, $9.79$, and marks the cache stale.
5. The next `mean()` recomputes: $(9.86 + 9.81 + 9.82 + 9.80) / 4 = 9.8225$.

Sanity check: the new sample is $0.07$ bigger than the one it replaced, so the mean should rise by $0.07 / 4 = 0.0175$. And $9.805 + 0.0175 = 9.8225$. It matches.
:::

**A mutex.** The second legitimate use is a lock. A **[[mutex|mutex]]** is an object that lets only one thread at a time into a section of code. Locking and unlocking it changes the mutex. But a `const` getter on a shared object still has to lock, or it could read a value while another thread is halfway through writing it:

```cpp
class PacketStats {
public:
    void record(int bytes) {
        std::lock_guard<std::mutex> lock(m_);
        ++packets_; bytes_ += bytes;
    }
    long bytes() const {
        std::lock_guard<std::mutex> lock(m_);   // locking changes m_: needs mutable
        return bytes_;
    }
private:
    mutable std::mutex m_;
    long packets_ = 0;
    long bytes_ = 0;
};
```

(It needs `<mutex>`.) `std::lock_guard` is an RAII type — it locks in its constructor and unlocks in its destructor, exactly like `MutexLock` in exercise `cpp03_ex1`. Without `mutable` on `m_`, g++ refuses: `binding reference of type 'std::mutex&' to 'const std::mutex' discards qualifiers`. The mutex is plumbing, not part of what the statistics *are*, so `mutable` is honest here. In a test with two threads each calling `record` 1000 times (one with 128 bytes, one with 64), `bytes()` read $1000 \times 128 + 1000 \times 64 = 192000$, as it should.

::: key const member functions and mutable
A const member function promises that it does not modify the observable state of the object, so it can be called on a const instance. `mutable` exempts a member, which is legitimate for a cache or a mutex and a smell for anything else.
:::

"A smell" means a warning sign in code: not always a bug, but worth a hard look. If a `mutable` member holds something a caller could notice changing — a mode flag, a command, a counter that is reported in telemetry — then the `const` on the function is a lie, and the next engineer who trusts it will be surprised.

::: warning const is shallow: it does not reach through pointers
Recall `HeapMatrix3` from lesson 07, which holds `double* data_`. In a `const` member function, `data_` becomes `double* const` — the *pointer* cannot change — but the numbers it points at are still writable. So this compiles without a single warning:

```cpp
void sneaky() const { data_[0] = 42.0; }   // compiles: data_ itself is not changed
```

Called on a `const HeapMatrix3 m`, it printed `m(0,0) = 42.0`. The by-value `Matrix3` does not have this hole: its numbers live inside the object, so `const` covers them. For pointer members, you have to keep the promise yourself.
:::

## const-correctness

**Const-correctness** is the habit of marking `const` everything that does not change: every member function that only reads, every reference parameter the function only reads, every local that is set once. The payoff comes in three ways.

- **The compiler checks your intent.** A function taking `const Matrix3&` cannot change the caller's matrix by accident.
- **const spreads.** If `mean()` were not `const`, `report(const SampleWindow&)` could not call it, so the caller would have to drop its `const`, and so would *its* caller. The habit has to start at the bottom, in the class itself.
- **const means safe to share.** Two threads may call `const` member functions on the same object at the same time without a lock, *if* the class keeps the promise. The C++ standard library [[assumes exactly that|const-thread-safe]]. It is also why the cache in the example would need a lock (or an atomic flag) if several threads could call `mean()` at once.

A member function can also be **overloaded on `const`**: two versions with the same name, one `const` and one not. The compiler picks the `const` one for `const` objects. The `Matrix3` in lesson 07 did this with `at`: the non-`const` version returns `double&` so you can write through it, and the `const` version returns a plain `double` copy. Lesson 09 uses the same trick for `operator[]` and `operator()`.

::: warning Do not cast const away to "fix" an error
`const_cast<T&>(x)` removes `const`. If the object was *created* `const` — say `const Matrix3 kIdentity = ...;` — and you write through the result, the behaviour is undefined: the compiler may have put the object in read-only memory or assumed it never changes. If a const-correctness error appears, fix the design: add the missing `const` to the function, or pass a non-`const` reference. Cast only when you are calling an old C function that forgot a `const` and you know it does not write.
:::

## static members: one for the whole class

Back to the museum. Each exhibit has its own label. But the counter at the door that says "347 visitors today" belongs to the museum, not to any exhibit. There is exactly one, however many exhibits there are.

A **static data member** is that door counter: one variable shared by the whole class, not stored inside any object. A **static member function** is a function that belongs to the class and has no object — no `this` at all.

```cpp
class Track {                              // one tracked object in a radar picture
public:
    explicit Track(int id) : id_(id) { ++live_; }
    ~Track() { --live_; }

    static int live() { return live_; }    // static member function: no object needed
private:
    int id_;
    inline static int live_ = 0;           // ONE counter shared by every Track
};
```

Read `inline static int live_ = 0;` as "an inline static int, live, starting at zero". Three rules to know:

1. **Where it lives.** `live_` has [[static storage duration|static-storage]], like a global: it exists before `main` starts and lasts until the program ends. It is not inside any `Track`. `sizeof(Track)` is 4 — just the `int id_`.
2. **How to name it.** You call a static member function through the class name: `Track::live()`, read "Track's live". No object is needed. You *can* write `a.live()` too, but it ignores `a`.
3. **What it can touch.** A static member function has no `this`, so it cannot read `id_` on its own. It can use static members, and it can reach private members of any `Track` object you hand it.

The word `inline` on the data member is the modern (C++17) way to define it right in the class. Before C++17, a non-constant static data member had to be declared in the class and then *defined* once in exactly one `.cpp` file (`int Track::live_ = 0;`), or the linker would complain — the [[One Definition Rule|odr-static]] from `cod_cpp_01_basics`. Constants are simpler: `static constexpr double kMuEarth = 3.986004418e14;` inside a class is a compile-time constant with nothing to define elsewhere.

Static member functions are also the natural home for **named constructors**: functions that build an object in a particular way. Exercise `cpp03_ex2` asks for `Matrix3::identity()` — "Matrix3's identity" — which makes a fresh identity matrix and returns it. There is no existing matrix to call it on, so it must be `static`.

::: example A live-object counter, and the constructor it forgot
This `main` uses the `Track` class above:

```cpp
int main() {
    std::printf("sizeof(Track) = %zu\n", sizeof(Track));
    std::printf("start:          live = %d\n", Track::live());
    {
        Track a{1}, b{2};
        std::printf("two made:       live = %d\n", Track::live());
        std::vector<Track> list;
        list.reserve(2);
        list.push_back(a);                 // copies: counter not bumped
        list.push_back(b);
        std::printf("two copied:     live = %d\n", Track::live());
    }
    std::printf("all destroyed:  live = %d\n", Track::live());
}
```

Output:

```text
sizeof(Track) = 4
start:          live = 0
two made:       live = 2
two copied:     live = 2
all destroyed:  live = -2
```

Minus two live tracks is impossible. Count the events:

1. `a` and `b` are made with the `Track(int)` constructor: $+2$, so `live` is $2$. Correct.
2. `push_back(a)` and `push_back(b)` make two *copies* in the vector. Those use the compiler-generated copy constructor, which copies `id_` and knows nothing about `live_`. So the counter stays at $2$, though four `Track`s now exist.
3. At the closing brace, all four are destroyed. Each destructor subtracts one: $2 - 4 = -2$.

The fix is to make *every* constructor count. Add

```cpp
Track(const Track& o) : id_(o.id_) { ++live_; }   // every constructor counts
Track& operator=(const Track&) = default;         // assignment makes no new object
```

and the output becomes `two copied: live = 4` and `all destroyed: live = 0`. Sanity check: at the end every object that was built has been destroyed, so the count must return to where it started — zero.

A counter is a kind of resource, and managing it by hand dragged the class into lesson 07's territory. The rule-of-zero fix is a small member type that does the counting in its own constructors and destructor, so `Track` declares none of the five.
:::

::: warning A static member is a global in disguise
`live_` is one variable shared by every `Track` in the program. If two threads create tracks at once, both can read `live_` as 5 and both write 6 — a **data race**, which is undefined behaviour. Use `inline static std::atomic<int> live_{0};` if more than one thread touches it. More broadly, flight coding standards treat mutable static state with the same suspicion as [[any global variable|static-global]]. Static *constants* and static *functions* are harmless; static *variables* need a reason.
:::

## friend: a key for a trusted outsider

`private` means "only this class's own member functions may touch this". Sometimes a function that is not a member genuinely belongs with the class and needs its private data. The keyword **`friend`**, written inside the class, grants that access to a named function or class. It is like giving your neighbor a key to your house: they are not family, but you trust them with the inside.

The classic case is printing. You want to write `std::cout << g;` for a `Vector3 g`. An operator used as `a << b` can be written either as a member of `a`'s class or as a free function taking `(a, b)`. Here the left operand is `std::cout`, a `std::ostream`, and you cannot add members to the standard library's class. A member of `Vector3` would make `Vector3` the *left* operand, so `g << std::cout` — backwards. So the operator must be a free function. And a free function cannot see `x_`, `y_` and `z_` — unless the class makes it a friend:

```cpp
#include <iostream>

class Vector3 {
public:
    Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}

    // Not a member: a free function that is allowed to read x_, y_, z_.
    friend std::ostream& operator<<(std::ostream& os, const Vector3& v) {
        return os << '(' << v.x_ << ", " << v.y_ << ", " << v.z_ << ')';
    }
private:
    double x_, y_, z_;
};

int main() {
    const Vector3 g{0.0, 0.0, -9.80665};
    std::cout << "gravity = " << g << " m/s^2\n";
}
```

Output:

```text
gravity = (0, 0, -9.80665) m/s^2
```

Read the declaration aloud: "friend, a function operator-shift-left, taking an ostream reference and a const Vector3 reference, returning an ostream reference". Though it is written inside the class, it is **not** a member. It has no `this`. It reaches the numbers through its parameter `v`: `v.x_`. It returns `os` so that calls can chain — `std::cout << "gravity = " << g << " m/s^2\n"` works left to right, each `<<` handing the stream to the next. Lesson 09 covers the stream operator's conventions in full.

A friend defined inside the class like this is a **hidden friend**, the same form as lesson 07's `swap`. The compiler finds it only when one of the arguments is a `Vector3`, which keeps it out of every unrelated overload search.

Three rules about friendship, all following the neighbor-with-a-key picture:

- **It is granted, not taken.** Only the class itself can declare a friend. Outside code cannot make itself a friend.
- **It is not passed on.** If `A` is a friend of `B`, and `B` is a friend of `C`, `A` is not a friend of `C`. Your neighbor's friends do not get your key.
- **It is not inherited.** A class derived from a friend class (lesson 10 introduces derived classes) does not get the access.

You can also befriend a whole class: `friend class TrackTest;` gives every member function of `TrackTest` access.

Is `friend` a hole in `private`? Used for operators and `swap`, the opposite. The alternative is public getters for every field, which lets *everyone* read them. A friend gives access to exactly one function, written by the class's author, inside the class.

## Check yourself

::: check
A `Quaternion` class has `double norm() const` and `void normalize()`. A function `void log_attitude(const Quaternion& q)` calls both. Which call fails, what does g++ say, and how should the code be fixed?
:::

::: answer
`q.normalize()` fails. `q` is a `const Quaternion&`, so only `const` member functions may be called on it, and `normalize()` is not `const` — it changes the four components. g++ reports `passing 'const Quaternion' as 'this' argument discards qualifiers`: calling it would need a non-const `this`. `q.norm()` is fine. The right fix is in the design, not a cast: a logging function should not change what it logs, so remove the `normalize()` call (normalise where the quaternion is updated, not where it is printed). If the function truly must change it, take `Quaternion&` and rename it so that callers know.
:::

::: check
A teammate marks a `mutable int mode_` in a `GuidanceComputer` so that `double command() const` can switch modes when a threshold is crossed. Why is this a smell, and what is the better design?
:::

::: answer
`mode_` is observable state: the guidance mode changes what every later call returns and is probably reported in telemetry. Changing it inside a `const` function breaks the const promise — code holding a `const GuidanceComputer&` believes it cannot alter the computer, yet calling `command()` does. `mutable` is legitimate only for things no caller can notice, like a cache or a mutex. The better design separates the two jobs: a non-`const` `update(...)` that evaluates thresholds and switches modes, called once per cycle by the owner, and a `const` `command()` that only reads.
:::

::: check
In the `Track` example, why can `live()` be called as `Track::live()` with no object, and why can it not return `id_`?
:::

::: answer
`live()` is a `static` member function, so it belongs to the class and receives no `this` pointer. That is why it can be called through the class name with no object. For the same reason it has no object whose `id_` it could read: `id_` is a non-static member, stored separately in every `Track`, and "which one?" has no answer. It can read `live_` because `live_` is static — one variable for the whole class. If it were given a `Track` as a parameter, it could read that object's `id_`, even though `id_` is private, because it is a member of the class.
:::

::: check
You add `friend std::ostream& operator<<(std::ostream&, const Matrix3&);` to `Matrix3`. Does that make `operator<<` a member of `Matrix3`? What can it do that an ordinary free function cannot, and what can it still not do?
:::

::: answer
It is not a member. It is a free function with no `this`, called as `os << m`, where `os` is the left operand and `m` the right. What `friend` adds is access: it may read `Matrix3`'s private members through its parameter, such as `m.m_[4]`. What it still cannot do is modify `m`, because the parameter is `const Matrix3&` — friendship grants access, not permission to break `const`. Nor does friendship pass on: helpers it calls get no special access.
:::

::: check
A class has `static std::array<double, 1000> scratch_;` used by one of its member functions as a work area. It works in the single-threaded simulator. What goes wrong on the flight computer where two tasks each own one of these objects?
:::

::: answer
A static data member is one array for the whole class, so the two objects, used by two tasks, share the same `scratch_`. If both tasks run the function at overlapping times, they write into the same array — a data race, undefined behaviour, and in practice one task's intermediate results overwritten by the other's. The single-threaded simulator could never show it. Fix: make `scratch_` an ordinary member, so each object owns its own 8,000 bytes, or pass a work buffer in.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| const member function | `double mean() const` | promises not to modify observable state; callable on a const object |
| `this` in a const function | `const T*` | members are read-only; only const members can be called |
| `mutable` | member exempt from const | legitimate for a cache or a mutex; a smell for anything else |
| const is shallow | a pointer member becomes `T* const` | the pointed-to data is still writable |
| const-correctness | `const` on every reader and read-only parameter | missing `const` spreads upward through callers |
| static data member | `inline static int live_ = 0;` | one per class, static storage, not in `sizeof` |
| static member function | `Track::live()`, `Matrix3::identity()` | no `this`; called through the class name |
| friend function | `friend std::ostream& operator<<(...)` | not a member; may use private members |
| friendship | granted by the class | not passed on, not inherited |

Lesson 09 uses all of this at once: operators that are `const` members, operators that are friends, and the full set a `Matrix3` and `Vector3` need — arithmetic, comparison, subscript, call and stream.

::: context this-pointer The pointer every member function gets
When you write `w.mean()`, the compiler quietly passes the address of `w` as a hidden first argument named `this`. The trailing `const` changes the type of that hidden argument, which is why it goes after the parameter list: it describes the object, not the result.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="13" fill="#1f2a44">you write:  w.mean()</text>
  <text x="20" y="48" font-size="13" fill="#1f2a44">compiler passes:  this = &amp;w</text>
  <rect x="220" y="64" width="120" height="50" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">object w</text>
  <text x="280" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">buf_, n_, cache</text>
  <rect x="20" y="74" width="130" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">const SampleWindow*</text>
  <line x1="150" y1="89" x2="212" y2="89" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,89 210,84 210,94" fill="#1d6fd1"/>
  <text x="85" y="122" font-size="11" fill="#6c7a93" text-anchor="middle">this: read-only view</text>
</svg>
```
:::

::: context mutex A talking stick for threads
A **mutex** (short for "mutual exclusion") works like a talking stick in a group discussion: only the person holding the stick may speak. A thread calls `lock()` to take it; if another thread holds it, the caller waits. When it is done it calls `unlock()` and passes it on. Taking and passing the stick changes the mutex, which is why a `const` function that locks needs the mutex to be `mutable`. The concurrency module covers mutexes, locks and deadlock in depth.
:::

::: context const-thread-safe const and threads
The C++ standard library promises that calling its `const` member functions on the same object from several threads at once is safe, as long as nobody calls a non-`const` one at the same time. It expects the same of your types when they are used with it. A class whose `const` functions quietly write to a cache without a lock breaks that expectation, and the resulting data race is undefined behaviour even though every function "looked" read-only.
:::

::: context static-storage One counter, many objects
Each `Track` object holds only its own `id_`. The shared `live_` lives once, in the program's static storage area, next to global variables. That is why `sizeof(Track)` is 4, and why every object sees the same count.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">objects (each 4 bytes)</text>
  <rect x="20" y="30" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">id_ = 1</text>
  <rect x="120" y="30" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="160" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">id_ = 2</text>
  <rect x="220" y="30" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="260" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">id_ = 3</text>
  <text x="20" y="100" font-size="12" fill="#1f2a44">static storage (one only)</text>
  <rect x="120" y="110" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="160" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">live_ = 3</text>
  <line x1="60" y1="60" x2="150" y2="108" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="160" y1="60" x2="160" y2="108" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="260" y1="60" x2="170" y2="108" stroke="#6c7a93" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context odr-static Why the old rule needed a .cpp file
A class definition usually sits in a header that many `.cpp` files include. If the header *defined* `int Track::live_ = 0;`, every file that included it would contain its own definition, and the linker would find several — breaking the One Definition Rule. So before C++17 the definition had to go in exactly one `.cpp` file. The `inline` keyword on a variable (new in C++17) tells the linker that identical definitions in many files are the same variable, so it keeps one.
:::

::: context static-global Why flight code distrusts globals
A mutable static member can be changed by any code, from anywhere, at any time, so a bug that corrupts it could be anywhere. It also creates hidden coupling between objects that look independent, and races between threads. Coding standards for safety-critical software, such as MISRA C++ and the JPL rules, push hard toward keeping data at the smallest possible scope. The usual flight pattern is to create components once at start-up and pass them references to what they need, rather than letting them reach for shared statics.
:::
