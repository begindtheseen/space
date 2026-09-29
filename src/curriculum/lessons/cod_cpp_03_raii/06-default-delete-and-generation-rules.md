---
id: l06-default-delete-and-generation-rules
title: What the compiler writes for you, and how to say yes or no
minutes: 21
covers:
  - = default and = delete; the special-member generation rules
---

Picture a helpful office assistant who fills in the blank boxes on your forms. Leave "copy to" empty and she fills in the usual answer. Most days that saves you time. But she has one careful habit: if you write something unusual in certain boxes, she assumes you are doing something special, and she leaves some *other* boxes blank rather than guess. She never tells you she did that.

The C++ compiler is that assistant. The last three lessons met six functions a class can have: the default constructor, the destructor, the copy constructor, copy assignment, the move constructor and move assignment. These are the **[[special member functions|special]]** — the ones the compiler can write for you, and calls for you without your asking. Whether it writes each one depends on which of the others you wrote yourself, and the rules are exact.

This lesson gives you the rules and two tools for taking control of them. **`= default`** says "yes, write the usual one for me". **`= delete`** says "no, this operation is forbidden". With those, you can make a class non-copyable like `MutexLock`, keep the fast moves of lesson 05 after adding a destructor, and read any class and say exactly which of the six it has. That is one of this module's objectives, and it is a classic interview question for flight-software jobs, because getting it wrong produces code that compiles, passes its tests, and runs slower than anyone expects.

## The six, by name

Here they are for a class `T`, with how to read each aloud:

```cpp
T();                          // default constructor: "T, taking nothing"
~T();                         // destructor: "tilde T"
T(const T&);                  // copy constructor
T& operator=(const T&);       // copy assignment
T(T&&);                       // move constructor
T& operator=(T&&);            // move assignment
```

Two words will matter all lesson. A special member is **user-declared** if its declaration appears in your class at all, even as `= default` or `= delete`. It is **implicitly declared** if you wrote nothing and the compiler added it. The generation rules look only at *what you declared*, not at what you put in the body.

## `= default`: yes, please write it

Sometimes the compiler's version is exactly what you want, but it will not write it on its own. The classic case is the default constructor. The compiler writes one only if you declared **no constructors at all**. Write a `Sample(double value)` constructor, and `Sample s;` stops compiling. To get it back:

```cpp
struct Sample {
    double value = 0.0;
    Sample() = default;                 // the usual one, please
    explicit Sample(double v) : value(v) {}
};
```

Read `= default` as "equals default": "use the compiler's standard definition for this function". A defaulted default constructor runs each member's default initialization, including the `= 0.0` written on the member. A defaulted copy constructor does last lesson's memberwise copy. A defaulted move constructor moves each member in declaration order, and it is `noexcept` automatically when every member's move is.

The second use is documentation. Writing `T(const T&) = default;` tells the next reader: "I thought about copying, and the memberwise copy is right." That is different from writing nothing, where the reader cannot tell whether you thought about it.

::: warning `= default` still counts as declaring it
`~T() = default;` looks like "no destructor". It is not. It is a user-declared destructor, and as you will see below, a user-declared destructor stops the compiler from writing the move pair. Writing `= default` on one special member is still writing it, as far as the rules are concerned. (The difference between user-declared and **[[user-provided|declared-provided]]** matters for other rules, but not for this one.)
:::

## `= delete`: no, this is forbidden

`= delete` ("equals delete") declares a function and forbids every use of it. Any code that would call it fails to compile, with an error that names the deleted function. This is how you say "this type cannot be copied".

Lesson 03 built `MutexLock`, which locks a mutex in its constructor and unlocks it in its destructor. Copying one would be a disaster: two objects would each unlock the same mutex, and the second unlock is undefined behavior. So it deletes its copy pair. What about moving? `MutexLock` holds a *reference* to its mutex, and [[a reference cannot be re-pointed or emptied|lock-guard]], so there is no sensible "moved-from" state. The exercise asks for it to be non-copyable *and* non-movable, and the generation rules give us that for free.

::: example `MutexLock`: no copies, and no moves either
```cpp error
#include <cstdio>
#include <mutex>
#include <utility>

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

int main() {
    MutexLock lock(telemetry_mutex);
    MutexLock copy = lock;              // line 19: try to copy
    MutexLock moved = std::move(lock);  // line 20: try to move
}
```

g++ rejects both lines:

```text
cod_cpp_03_raii_06_ex3.cpp:19:22: error: use of deleted function 'MutexLock::MutexLock(const MutexLock&)'
   19 |     MutexLock copy = lock;              // line 19: try to copy
cod_cpp_03_raii_06_ex3.cpp:9:5: note: declared here
    9 |     MutexLock(const MutexLock&) = delete;
cod_cpp_03_raii_06_ex3.cpp:20:37: error: use of deleted function 'MutexLock::MutexLock(const MutexLock&)'
   20 |     MutexLock moved = std::move(lock);  // line 20: try to move
cod_cpp_03_raii_06_ex3.cpp:9:5: note: declared here
    9 |     MutexLock(const MutexLock&) = delete;
```

Line 19 is expected: we deleted the copy constructor, and the error points at line 9 where we did it.

Line 20 is the interesting one. We never mentioned moves, yet the move fails, and the error names the *copy* constructor. Here is the chain of reasoning, step by step. We declared a copy constructor (deleting it still declares it). A user-declared copy constructor means the compiler does not declare a move constructor at all. So for `std::move(lock)` the only candidate is the copy constructor, whose `const MutexLock&` parameter accepts rvalues. That one is deleted. Error.

Sanity check: with neither line 19 nor 20, the program compiles and prints `mutex released` once, at the end of `main`. One lock, one release.
:::

So deleting the copy pair of a class also leaves it with no moves, unless you declare moves yourself. That is exactly what `MutexLock` wants, and exactly what `FileHandle` in lesson 05 had to fix by writing its move pair.

### Deleting any function

`= delete` works on ordinary functions too, which makes it a precise tool for blocking a [[conversion you do not want|units]]:

```cpp
void set_throttle(double fraction) { std::printf("throttle %.2f\n", fraction); }
void set_throttle(int) = delete;        // catch "70" meant as a percent
```

`set_throttle(0.7)` works. `set_throttle(70)` would otherwise convert 70 to 70.0 and command a throttle of 7,000 percent. With the deleted overload, the compiler picks the `int` version as the exact match, finds it deleted, and stops: `error: use of deleted function 'void set_throttle(int)'`. A deleted function still takes part in choosing an overload. It just cannot be the winner.

::: warning Do not delete the move to "turn moves off"
That rule, "deleted functions still take part", has a sharp edge. Suppose you want a copyable type and write `Sample(Sample&&) = delete;` because you think moves are unnecessary. Now `Sample c = std::move(a);` picks the move constructor (the best match for an rvalue), finds it deleted, and fails to compile: `error: use of deleted function 'Sample::Sample(Sample&&)'`. It does *not* fall back to copying. If you want "copies only", leave the move pair undeclared and declare the copy pair: then rvalues fall back to the copy constructor. Declaring and deleting are different things.
:::

::: key
`= default` asks for the compiler's standard version of a special member; `= delete` forbids a function, and any use is a compile error. Delete the copy constructor and copy assignment to make a type non-copyable (`MutexLock`, `FileHandle`). A deleted function is still declared and still takes part in overload resolution.
:::

## The generation rules

Now the assistant's habits, stated exactly. Each rule says when the compiler **declares** a special member for you. Then, when something uses it, the compiler writes the memberwise version.

- **Default constructor.** Declared only if you declared no constructor of any kind (including a copy or move constructor).
- **Destructor.** Always declared unless you declared one.
- **Copy constructor.** Declared unless you declared one. It is declared as *deleted* if you declared a move constructor or a move assignment. If you declared a destructor or a copy assignment, it is still generated, but that generation is **[[deprecated|deprecated]]**.
- **Copy assignment.** The same, with the roles swapped: deleted if you declared either move operation; generated but deprecated if you declared a destructor or a copy constructor.
- **Move constructor and move assignment.** Declared only if you declared *none* of these four: copy constructor, copy assignment, the other move operation, destructor.

That last rule is the one that bites. Here is the whole picture as a table, in the layout **[[Howard Hinnant|hinnant]]** made popular. Read across a row: "if I declare this, what does the compiler give me for each of the six?"

| You declare | default ctor | destructor | copy ctor | copy assign | move ctor | move assign |
| --- | --- | --- | --- | --- | --- | --- |
| nothing | generated | generated | generated | generated | generated | generated |
| any constructor | not declared | generated | generated | generated | generated | generated |
| default ctor | yours | generated | generated | generated | generated | generated |
| destructor | generated | yours | deprecated | deprecated | not declared | not declared |
| copy ctor | not declared | generated | yours | deprecated | not declared | not declared |
| copy assign | generated | generated | deprecated | yours | not declared | not declared |
| move ctor | not declared | generated | deleted | deleted | yours | not declared |
| move assign | generated | generated | deleted | deleted | not declared | yours |

("Any constructor" means one that is not the default, copy or move constructor, like `Sample(double)`. "Deprecated" means generated, but relying on it is deprecated.)

The difference between **not declared** and **deleted** is the one the `MutexLock` example turned on. A move constructor that is *not declared* does not exist, so an rvalue quietly goes to the copy constructor instead. A copy constructor that is *deleted* exists and is forbidden, so using it is a compile error.

One more case sits outside the table. Even a generated member becomes deleted when the memberwise version cannot be written. If a class holds a `std::unique_ptr`, which cannot be copied, the class's generated copy constructor is **defined as deleted**. g++ says so plainly: `'Estimator::Estimator(const Estimator&)' is implicitly deleted because the default definition would be ill-formed`. The generated move is still fine, so a class with a `unique_ptr` member is move-only automatically.

::: key
The compiler does not generate a move constructor or move assignment when the class declares any of: a copy constructor, a copy assignment operator, a move assignment operator (or move constructor), or a destructor. Declaring a destructor silently costs you moves: rvalues then bind to the copy constructor, which is still generated (deprecated but generated), so the code compiles and runs slower. Declaring either move operation makes the copy pair deleted.
:::

::: note Why the rules are this way
Declaring a destructor, a copy constructor or a copy assignment is a hint that the class manages something by hand. If it does, the memberwise move is probably wrong, just as lesson 04 showed the memberwise copy was wrong: moving a raw pointer member copies it without emptying the source. So when move semantics arrived in C++11, the committee chose the cautious rule: in those classes, do not invent a move; let rvalues fall back to the copy the class already had. That kept old code correct. By the same logic the implicit *copy* should also stop when you declare a destructor, but switching it off in 2011 would have broken millions of lines of working pre-C++11 code. So it was only marked deprecated, and it is still generated today.
:::

## One destructor, a thousand copies

Here is what the key block means in a running program. Three classes each hold one `Payload`, a small member that counts every copy and move made of it.

::: example Watching a destructor switch moves off
```cpp
#include <cstdio>
#include <vector>

static int copies = 0, moves = 0;

struct Payload {                                  // counts what happens to it
    Payload() = default;
    Payload(const Payload&) { ++copies; }
    Payload(Payload&&) noexcept { ++moves; }
    Payload& operator=(const Payload&) { ++copies; return *this; }
    Payload& operator=(Payload&&) noexcept { ++moves; return *this; }
};

struct Plain {                                    // declares nothing
    Payload p;
};

struct Logged {                                   // declares only a destructor
    Payload p;
    ~Logged() {}
};

struct Restored {                                 // destructor plus all four, defaulted
    Payload p;
    ~Restored() {}
    Restored() = default;
    Restored(const Restored&) = default;
    Restored& operator=(const Restored&) = default;
    Restored(Restored&&) = default;
    Restored& operator=(Restored&&) = default;
};

template <class T>
void grow(const char* label) {
    copies = moves = 0;
    std::vector<T> v;
    for (int i = 0; i < 1000; ++i) v.emplace_back();
    std::printf("%-10s copies %4d  moves %4d\n", label, copies, moves);
}

int main() {
    grow<Plain>("Plain");
    grow<Logged>("Logged");
    grow<Restored>("Restored");
}
```

`grow<T>` is a small template (the same idea as lesson 05's `Probe<true>`): it runs once for each class. Output, with `g++ -std=c++20 -Wall -Wextra -O2` and no warnings:

```text
Plain      copies    0  moves 1023
Logged     copies 1023  moves    0
Restored   copies    0  moves 1023
```

Go row by row through the table. **`Plain`** declared nothing, so all six are generated. Its generated move constructor moves `p`, and it is `noexcept` because `Payload`'s move is, so the vector moved 1023 elements while growing to 1000, the same doubling count as lesson 05. **`Logged`** declared a destructor, an empty one. Look up the "destructor" row: move constructor *not declared*. So when the vector relocated elements, the only way to build a `Logged` from another was the generated copy constructor, and it copied all 1023. **`Restored`** also has a destructor, but it declares the other four with `= default`, so it has a move constructor again, and the moves are back.

Sanity check: the totals agree across rows. Every run relocated exactly 1023 elements; only the kind of relocation changed.
:::

Nothing in that build warned about `Logged`. Neither `-Wall` nor `-Wextra` turns on the check. g++ has it behind a separate flag, `-Wdeprecated-copy-dtor`. On a smaller program that moves a `Logged` whose destructor is user-provided, it says:

```text
warning: implicitly-declared 'constexpr Logged::Logged(const Logged&)' is deprecated [-Wdeprecated-copy-dtor]
    8 |     Logged b = std::move(a);
note: because 'Logged' has user-provided 'Logged::~Logged()'
```

Read it closely. The line says `std::move`, and the warning is about the *copy* constructor. That is the lost move, caught in the act. clang reports the same thing under `-Wdeprecated`. Adding one of these flags to a flight project's build is cheap insurance.

::: warning A destructor added for logging
The usual way this happens: someone adds `~Telemetry() { log("destroyed"); }` while debugging, or an empty `~T() {}` to satisfy a style checker, to a class that was quietly moving. It still compiles, every test still passes, and every `std::vector<Telemetry>` reallocation and every `std::move` of one now copies. If you need a destructor, either declare the other four `= default` as `Restored` does, or put the logging into a small member object so the outer class declares nothing. Lesson 07 turns this into two named rules.
:::

## Reading a class

With the table you can look at any class and list its six members. Try `FileHandle` from lesson 05. It declares a default constructor (`= default`), a two-argument constructor, the destructor, the copy pair (`= delete`) and the move pair (written out). Every one of the six is user-declared, so the compiler generates nothing, and what you see is exactly what it has: default-constructible, movable, not copyable. `MutexLock` declares a constructor taking a `std::mutex&`, the destructor and the deleted copy pair. So: no default constructor ("any constructor" row), move pair not declared (copy constructor row), and copy deleted. Non-copyable and non-movable, as the exercise asks.

This habit of declaring all of the five or none leads straight to next lesson's two rules, the **[[rule of five and the rule of zero|bridge-07]]**.

## Check yourself

::: check
For each class, say whether it has a move constructor and whether it has a copy constructor. (a) `struct A { std::vector<double> v; };` (b) `struct B { std::vector<double> v; B(const B&) = default; };` (c) `struct C { std::vector<double> v; C(C&&) = default; };` (d) `struct D { std::vector<double> v; virtual ~D() = default; };`
:::

::: answer
(a) Both, generated: `A` declares nothing. (b) Copy: yes, it is user-declared as defaulted. Move: not declared, because a user-declared copy constructor suppresses it; rvalues are copied. Also note `B` has no default constructor now, since a copy constructor counts as a constructor. (c) Move: yes, defaulted. Copy: deleted, because a user-declared move constructor makes the copy pair deleted; `C c2 = c1;` will not compile. (d) Copy: generated, deprecated. Move: not declared, because of the user-declared destructor, even though it is `= default`. Every "move" of a `D` copies the whole vector. A base class that needs a virtual destructor should also `= default` the other four if it wants moves.
:::

::: check
Why does `MutexLock copy = lock;` fail with an error mentioning line 9, while `MutexLock moved = std::move(lock);` fails with the *same* message?
:::

::: answer
Both lines end up calling the copy constructor, and it is deleted at line 9. The first is a plain copy. For the second, the class declared a copy constructor (deleting still declares it), so the compiler declared no move constructor. The only constructor that can take the rvalue `std::move(lock)` is `MutexLock(const MutexLock&)`, which is deleted, so the error names it.
:::

::: check
A colleague wants a class that can be copied but not moved, and writes `Frame(Frame&&) = delete; Frame& operator=(Frame&&) = delete;`. What breaks, and what should they write instead?
:::

::: answer
Two things break. First, declaring the move operations makes the copy pair deleted, so `Frame b = a;` no longer compiles either, unless the copy pair is also declared. Second, even with the copy pair declared, every rvalue picks the deleted move and fails: `Frame b = std::move(a);`, `v.push_back(Frame{})` and returning a local `Frame` in some cases. Deleted functions still take part in overload resolution. To get "copy only", declare the copy pair (write them or `= default` them) and leave the move pair undeclared; rvalues then fall back to copying. In practice "copy but never move" is rarely what anyone needs.
:::

::: check
A class holds `std::string name_; std::unique_ptr<double[]> buf_;` and declares nothing. List what it can do: default-construct, copy, move, destroy.
:::

::: answer
It declares nothing, so all six are generated. Default construction, destruction and both moves are fine: `std::string` and `std::unique_ptr` can both be default-constructed, moved and destroyed. The copy constructor and copy assignment are generated but *defined as deleted*, because the memberwise copy would have to copy the `unique_ptr`, which is not allowed. So the class is move-only, automatically, without a single `= delete` in it. Its generated move is `noexcept`, since both members' moves are.
:::

::: check
You add `~Telemetry() = default;` to a class to make a code-review tool stop complaining, and a benchmark that stores 100,000 `Telemetry` objects in a vector gets slower. Explain it using the table, and give the fix.
:::

::: answer
`~Telemetry() = default;` is a user-declared destructor. In the "destructor" row, the move constructor and move assignment are "not declared". During each vector reallocation the elements can only be copied, so every relocation now copies every member, including the heap buffers of any vectors or strings inside. (With doubling up to 131,072 that is $2^{17} - 1 = 131071$ element copies.) Fix: remove the destructor declaration, since the default one is generated anyway, or declare the other four `= default` so the moves come back.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Special member functions | the six the compiler can write | default ctor, destructor, copy ctor, copy assign, move ctor, move assign |
| User-declared | appears in the class at all | includes `= default` and `= delete`; the generation rules look only at this |
| `= default` | "write the standard version" | memberwise; still counts as declaring the member |
| `= delete` | "this is forbidden" | use is a compile error; still takes part in overload resolution |
| Non-copyable type | delete the copy pair | then no move is declared either: `MutexLock` is non-copyable and non-movable |
| Default constructor | generated only with no constructors | `T() = default;` brings it back |
| Move pair suppressed | by a user-declared copy ctor, copy assign, other move op, or destructor | rvalues fall back to copying, silently |
| Copy pair | deleted if you declare a move; deprecated if you declare a destructor or the other copy | still generated after a destructor |
| Implicitly deleted | memberwise version impossible | a `std::unique_ptr` member makes the copy deleted, so the class is move-only |
| Catching the lost move | a separate warning flag | g++ `-Wdeprecated-copy-dtor`, clang `-Wdeprecated` |

Next lesson: all these rules boil down to two habits. The **rule of five** says that if you declare any of the five (destructor, copy pair, move pair), declare all five. The **rule of zero** says to arrange your class so you declare none. Lesson 07 builds both, and shows copy-and-swap, a way to write assignment once and get it right.

::: context special Why "special"?
Ordinary member functions run only when you call them by name. These six are special because the language calls them for you: a constructor when an object is created, a destructor at the closing brace or during stack unwinding, a copy when you pass by value, a move when a vector grows. They are also the only functions the compiler will write for you. That combination, invisible calls plus invisible definitions, is why a class can behave in ways its source code does not show, and why this lesson exists.
:::

::: context declared-provided Declared, provided, or neither
Three states, from least to most yours. **Implicitly declared**: you wrote nothing; the compiler added it. **User-declared**: it appears in your class, perhaps as `= default` or `= delete`. **User-provided**: user-declared and not defaulted or deleted on its first declaration, meaning you wrote a body. The move-suppression rule uses "user-declared", so `~T() = default;` suppresses moves. Other rules use "user-provided": for example, a class whose special members are all defaulted in the class can still be "trivially copyable", which lets the compiler copy it with a plain byte copy. An empty body `~T() {}` is user-provided and makes the destructor non-trivial.
:::

::: context lock-guard The standard library made the same choice
`std::lock_guard`, the standard's version of `MutexLock`, is also non-copyable and non-movable, for the same reason: it holds a reference to one mutex for exactly one scope. When you do need to hand a lock around, `std::unique_lock` is movable, because it stores a *pointer* to the mutex plus an "owns the lock" flag, and a pointer can be set to null in a moved-from object. The concurrency module uses both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,60 331,55 331,65" fill="#1f2a44"/>
  <rect x="70" y="46" width="200" height="28" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="170" y="64" font-size="12" fill="#1f2a44" text-anchor="middle">mutex held: one owner</text>
  <line x1="70" y1="30" x2="70" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="270" y1="30" x2="270" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <text x="70" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">constructor: lock()</text>
  <text x="270" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">closing brace: unlock()</text>
  <text x="170" y="100" font-size="11" fill="#b4232c" text-anchor="middle">a copy would unlock a second time</text>
  <text x="20" y="80" font-size="11" fill="#6c7a93">time</text>
</svg>
```
:::

::: context units Conversions and lost spacecraft
Silent conversions between numbers that mean different things are a classic source of flight-software failures. NASA's Mars Climate Orbiter was lost in 1999 because one piece of ground software produced thruster impulse in pound-force seconds while the software using it expected newton-seconds; nothing in the interface caught the mismatch. A deleted overload catches one narrow case, an `int` where a fraction was meant. The stronger fix, used in many flight codebases, is a distinct type per unit, so a `Newtons` cannot be passed where a `PoundsForce` is expected at all.
:::

::: context deprecated What "deprecated" means
In the C++ standard, a **deprecated** feature still works and is still required to work, but the committee has warned that a future standard may remove it, and new code should not rely on it. The implicit copy in a class with a user-declared destructor has been deprecated since C++11 and has not been removed, because removing it would break a vast amount of code. Compilers do not warn by default. The practical meaning for you: if your class needs its copy after declaring a destructor, declare the copy explicitly (even as `= default`), so the class stops relying on the deprecated rule.
:::

::: context hinnant The table and where it comes from
Howard Hinnant, one of the authors of the original move-semantics proposal, presented this table in talks on how special members are declared, and it has been reproduced in C++ teaching ever since. The version in this lesson is laid out afresh, but the idea is his: one row per "what you declared", one column per special member. The shape to remember is two blocks. Declaring a destructor or either copy operation empties the move columns. Declaring either move operation turns the copy columns to "deleted".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" font-weight="700" fill="#1f2a44">you declare</text>
  <text x="170" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">copy pair</text>
  <text x="290" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">move pair</text>
  <text x="10" y="46" font-size="12" fill="#1f2a44">destructor</text>
  <text x="10" y="74" font-size="12" fill="#1f2a44">a copy op</text>
  <text x="10" y="102" font-size="12" fill="#1f2a44">a move op</text>
  <rect x="110" y="30" width="120" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="170" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">deprecated</text>
  <rect x="240" y="30" width="110" height="24" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="295" y="46" font-size="11" fill="#b4232c" text-anchor="middle">not declared</text>
  <rect x="110" y="58" width="120" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="170" y="74" font-size="11" fill="#1f2a44" text-anchor="middle">yours / deprecated</text>
  <rect x="240" y="58" width="110" height="24" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="295" y="74" font-size="11" fill="#b4232c" text-anchor="middle">not declared</text>
  <rect x="110" y="86" width="120" height="24" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <text x="170" y="102" font-size="11" fill="#ffffff" text-anchor="middle">deleted</text>
  <rect x="240" y="86" width="110" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="295" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">yours / not declared</text>
  <text x="10" y="128" font-size="11" fill="#6c7a93">not declared: rvalues fall back to the copy</text>
  <text x="10" y="144" font-size="11" fill="#6c7a93">deleted: any use is a compile error</text>
</svg>
```
:::

::: context bridge-07 From rules to habits
The generation rules are worth knowing exactly, but good code does not depend on anyone remembering them. The C++ Core Guidelines put it as rule C.21: if you define or `= delete` any copy, move or destructor function, define or `= delete` them all. That is the rule of five in guideline form. Better still is a class whose members each manage themselves, like `std::vector` and `std::unique_ptr`, so it declares none of the five and every row of the table reads "generated". Lesson 07 builds both habits and weighs them against each other with a `Matrix3`.
:::
