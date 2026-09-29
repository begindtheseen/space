---
id: l04-copying-deep-and-shallow
title: Copying objects, deep and shallow
minutes: 25
covers:
  - Copy constructor and copy assignment; deep versus shallow
---

Your friend lends you a house key, and you get a copy cut at the hardware store. Now there are two keys. There is still only one house. If your friend sells the house and you later let yourself in, you are walking into somebody else's home.

A copy of a key is not a copy of the house. That one sentence is the whole of this lesson. A C++ object often holds a pointer, and a pointer is a key: an address that leads to memory somewhere else. Copy the object the lazy way and you copy the key. Copy it the careful way and you build a second house with the same furniture inside.

The last three lessons built objects and tore them down: constructors, member initializer lists, and destructors that release what the object owns. Now we ask what happens in between, when one object is made *from* another. C++ gives you two functions for that. The **copy constructor** builds a brand-new object as a copy of an existing one. The **copy assignment operator** overwrites an object that already exists with a copy of another. Get either one wrong in a class that owns memory and the program frees the same block twice, reads memory that has been given back, or quietly shares data that was meant to be separate. On a flight computer those are exactly the bugs that pass every bench test and fail on day 40 of a mission.

## Two ways to copy, and when each one runs

Picture two moments. In the first, a new notebook arrives and you copy your friend's notes into it: the notebook did not exist a second ago. In the second, you already have a notebook full of old notes, you rip those pages out, and you copy your friend's notes in their place. The first is construction. The second is assignment. They look alike, but the second has an extra job: dealing with what was there before.

Here are the two functions for a class `T`:

```cpp
T(const T& other);              // copy constructor
T& operator=(const T& other);   // copy assignment operator
```

Read the first aloud as "T, taking a const reference to another T". It has no return type, because it is a constructor. Read the second as "operator equals, taking a const reference to another T, returning a reference to T". The word `operator=` is the name C++ gives to the function that runs when you write `=` between two existing objects. Both take the source by `const T&`, because copying must not change the thing being copied, and taking it by value would itself need a copy.

The copy assignment operator ends with `return *this;`. Inside a member function, **`this`** is a pointer to the object the function was called on, so `*this` is that object itself. Returning it by reference is what lets you chain `a = b = c;`, the same way you can with `int`s.

The rule for *which* one runs is about whether the object on the left already exists:

- **Copy constructor**: a new object is being born from an existing one. `T b = a;`, `T b(a);` and `T b{a};` all do this. So does passing an argument **[[by value|return-by-value]]** (the parameter is a new object), and so does a container like `std::vector` storing a copy of what you hand it.
- **Copy assignment**: both objects already exist. `b = a;` on a line of its own, where `b` was declared earlier.

::: warning `T b = a;` is not an assignment
It has an `=` sign, but `b` is being declared on that very line, so it does not exist yet and there is nothing to overwrite. The compiler calls the copy constructor. Ask one question every time: "is the thing on the left being born right now?" If yes, it is a constructor.
:::

::: example Watching which function runs
Give a class a copy constructor and a copy assignment operator that print a line each, then try every situation.

```cpp
#include <cstdio>

struct Tracer {
    int id;
    explicit Tracer(int i) : id(i) { std::printf("  make %d\n", id); }
    Tracer(const Tracer& other) : id(other.id) {
        std::printf("  COPY CONSTRUCT from %d\n", other.id);
    }
    Tracer& operator=(const Tracer& other) {
        std::printf("  COPY ASSIGN %d <- %d\n", id, other.id);
        id = other.id;
        return *this;
    }
};

void by_value(Tracer t) { std::printf("  inside by_value, id %d\n", t.id); }
void by_ref(const Tracer& t) { std::printf("  inside by_ref, id %d\n", t.id); }

int main() {
    std::puts("1: Tracer a{1}; Tracer b{2};");
    Tracer a{1};
    Tracer b{2};
    std::puts("2: Tracer c = a;");
    Tracer c = a;
    std::puts("3: b = a;");
    b = a;
    std::puts("4: by_value(a);");
    by_value(a);
    std::puts("5: by_ref(a);");
    by_ref(a);
    std::printf("done, c.id = %d\n", c.id);
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2` and run:

```text
1: Tracer a{1}; Tracer b{2};
  make 1
  make 2
2: Tracer c = a;
  COPY CONSTRUCT from 1
3: b = a;
  COPY ASSIGN 2 <- 1
4: by_value(a);
  COPY CONSTRUCT from 1
  inside by_value, id 1
5: by_ref(a);
  inside by_ref, id 1
done, c.id = 1
```

Walk through it. Line 2 has an `=`, yet it printed COPY CONSTRUCT, because `c` was being born. Line 3 printed COPY ASSIGN: `b` already held 2, and the message shows the old value being overwritten by 1. Line 4 made a copy even though we never wrote one: the parameter `t` is a new `Tracer`, so the copy constructor built it from `a`. Line 5 made no copy at all, because a reference is only a second name for `a`.

Sanity check: we asked for four objects to be built from scratch or copied into existence (`a`, `b`, `c`, and the parameter `t`) and there are exactly two "make" lines plus two COPY CONSTRUCT lines. One assignment, one COPY ASSIGN line. The counts match.
:::

That last line is why flight code passes anything bigger than a few numbers by `const T&`. A by-value parameter quietly calls the copy constructor on every call, and in a 1 kHz control loop that is a thousand hidden copies a second.

::: key
The copy constructor `T(const T&)` builds a new object from an existing one: `T b = a;`, `T b(a);`, `T b{a};`, pass by value. Copy assignment `T& operator=(const T&)` overwrites an object that already exists: `b = a;`. It returns `*this` so assignments can chain.
:::

## The copy the compiler writes for you

If you do not write a copy constructor, the compiler writes one. Its rule is simple: copy each member, one by one, in the order the members are declared, using that member's own copy. This is called a **[[memberwise copy|memberwise]]**. The generated copy assignment does the same with each member's assignment.

For numbers that is exactly right. Copying an `int` or a `double` copies the value. For a `std::vector` it is also right, because `std::vector` has its own careful copy constructor that copies every element.

For a **raw pointer** it is wrong, or at least dangerous. Copying a pointer copies the address: the key, not the house. After the copy, two objects hold the same address. That is a **[[shallow copy|shallow-deep]]**: the object is copied, but the thing it points to is shared. The opposite, where the pointed-to data is duplicated too, is a **deep copy**.

A shallow copy is not always a bug. A pointer to a sensor's calibration table that nobody owns, or a `const char*` pointing at a string literal, can be shared safely. The bug appears when the class *owns* what the pointer points to, which means its destructor frees it. Then two objects both think they own one block, and both will free it.

::: example The double free a shallow copy causes
Here is a class that owns a heap buffer of samples. It has a constructor and a destructor, as lesson 03 taught, but no copy constructor.

```cpp
#include <cstddef>
#include <cstdio>

class Buffer {
public:
    explicit Buffer(std::size_t n) : n_(n), data_(new double[n]{}) {
        std::printf("  allocate %zu doubles at %p\n", n_, static_cast<void*>(data_));
    }
    ~Buffer() {
        std::printf("  free %p\n", static_cast<void*>(data_));
        delete[] data_;
    }
    double& operator[](std::size_t i) { return data_[i]; }
    const double* data() const { return data_; }
private:
    std::size_t n_;
    double* data_;
};

int main() {
    Buffer a(4);
    a[0] = 9.81;
    Buffer b = a;                       // compiler-written copy: copies the pointer
    std::printf("  a.data() = %p, b.data() = %p\n",
                static_cast<const void*>(a.data()), static_cast<const void*>(b.data()));
    b[0] = -1.0;                        // writes into a's buffer too
    std::printf("  a[0] = %.2f\n", a[0]);
}                                       // ~b frees, then ~a frees the same block
```

It compiles with no warnings at all. Run it:

```text
  allocate 4 doubles at 0x560b4c2bd2b0
  a.data() = 0x560b4c2bd2b0, b.data() = 0x560b4c2bd2b0
  a[0] = -1.00
  free 0x560b4c2bd2b0
  free 0x560b4c2bd2b0
free(): double free detected in tcache 2
Aborted
```

(Your addresses will differ. The last word, `Aborted`, is printed by the shell, not by the program.)

Read it as a story. There is one "allocate" line, so there is one block of memory. The next line proves both objects hold the same address. We wrote `-1.0` through `b` and then read `-1.00` back through `a`: the "copy" was never separate. At the closing brace, local objects are destroyed in reverse order of construction, so `b` dies first and frees the block. Then `a` dies and frees the same address again. The C library's memory manager, **[[glibc's allocator|tcache]]**, noticed the second free and killed the program. The exit status was 134, which is 128 plus signal 6, the abort signal.

Sanity check: count allocations and frees. One allocation, two frees. Any time those two numbers differ, something is wrong.
:::

The crash here is the lucky outcome. If `a` had lived on after `b` was destroyed, `a` would have kept reading freed memory that might by then belong to a telemetry packet or a guidance command. Nothing crashes; numbers go quietly wrong. Built with `-fsanitize=address`, this program stops with `AddressSanitizer: attempting double-free` and names the destructor at line 11 and the allocation at line 6.

::: warning The compiler never warns about this
A class with a raw owning pointer and no copy constructor looks finished. It compiles cleanly with every warning turned on. The bug is in every program that copies one, which includes every by-value parameter and every `std::vector<Buffer>`. If a class has a destructor that frees something, stop and decide what copying should mean before you do anything else.
:::

## Writing a deep copy

The fix is to say what copying really means for this class: allocate a new block of the same size and copy the numbers across. Then each object owns its own block, and each destructor frees exactly one thing.

The copy constructor is the easy half, because the new object starts empty. There is nothing old to throw away:

```cpp
Buffer(const Buffer& other) : n_(other.n_), data_(new double[other.n_]) {
    for (std::size_t i = 0; i < n_; ++i) data_[i] = other.data_[i];
}
```

Step by step: copy the size, allocate a fresh block of that size, then copy each element across. We may read `other.data_` even though it is private, because access rules in C++ are per class, not per object.

The copy assignment operator is harder, because the object on the left already owns a block. It has four jobs:

1. Get a new block big enough for `other`'s data.
2. Copy `other`'s numbers into it.
3. Free the block this object owned before, or it leaks.
4. Adopt the new block, update the size, and return `*this`.

The order matters, and the order above is deliberate. If step 1 fails, because the heap is full and `new` throws `std::bad_alloc`, nothing has been touched yet: the object still owns its old block and its old numbers. If you freed the old block first and then the allocation failed, the object would be left holding a pointer to freed memory, and its destructor would later free it a second time. Allocating first gives the **[[strong exception guarantee|strong-guarantee]]**: if the assignment fails, the object is exactly as it was before.

::: example A buffer that copies deeply
```cpp
#include <cstddef>
#include <cstdio>

class Buffer {
public:
    explicit Buffer(std::size_t n) : n_(n), data_(new double[n]{}) {}
    ~Buffer() { delete[] data_; }

    // Copy constructor: a brand-new object, so there is nothing old to release.
    Buffer(const Buffer& other) : n_(other.n_), data_(new double[other.n_]) {
        for (std::size_t i = 0; i < n_; ++i) data_[i] = other.data_[i];
        std::puts("  deep copy constructor");
    }

    // Copy assignment: this object already owns a buffer.
    Buffer& operator=(const Buffer& other) {
        std::puts("  deep copy assignment");
        if (this == &other) return *this;            // a = a: nothing to do
        double* fresh = new double[other.n_];        // 1. get the new block first
        for (std::size_t i = 0; i < other.n_; ++i)   // 2. fill it
            fresh[i] = other.data_[i];
        delete[] data_;                              // 3. only now drop the old one
        data_ = fresh;
        n_ = other.n_;
        return *this;
    }

    double& operator[](std::size_t i) { return data_[i]; }
    const double* data() const { return data_; }
    std::size_t size() const { return n_; }
private:
    std::size_t n_;
    double* data_;
};

int main() {
    Buffer a(4);
    a[0] = 9.81;
    Buffer b = a;
    b[0] = -1.0;
    std::printf("  a[0] = %.2f, b[0] = %.2f, same block? %s\n",
                a[0], b[0], a.data() == b.data() ? "yes" : "no");

    Buffer c(1000);
    c = a;                                           // c had 1000, now has 4
    std::printf("  c.size() = %zu, c[0] = %.2f\n", c.size(), c[0]);

    a = a;                                           // self-assignment
    std::printf("  after a = a: a[0] = %.2f\n", a[0]);
}
```

Output:

```text
  deep copy constructor
  a[0] = 9.81, b[0] = -1.00, same block? no
  deep copy assignment
  c.size() = 4, c[0] = 9.81
  deep copy assignment
  after a = a: a[0] = 9.81
```

`Buffer b = a;` ran the deep copy constructor, and now the two objects are separate: writing `-1.0` into `b` left `a` at `9.81`, and the addresses differ. `c = a;` ran copy assignment on an object that already owned 1,000 doubles. It built a new 4-element block, copied into it, and freed the old 1,000-element block (8,000 bytes). The last line assigned `a` to itself and survived, thanks to the first line of the operator.

Sanity check: rebuild with `-fsanitize=address` and run again. The output is identical and the sanitizer reports nothing, so every block was freed exactly once. Counting by hand agrees: four allocations in all (`a`, `b`, `c`'s first block, `c`'s new block), four frees (`c`'s old block during the assignment, then the three destructors).
:::

## Self-assignment

Nobody writes `a = a` on purpose. It happens through **[[aliasing|aliasing]]**, when two names refer to one object. `samples[i] = samples[j]` is a self-assignment whenever `i` equals `j`, and `load(buf, buf)` is one if `load` does `dst = src;`. The class has to survive it.

The line `if (this == &other) return *this;` compares two addresses: `this` is the address of the object on the left, and `&other` is the address of the one on the right. If they are equal, it is the same object, and copying it onto itself would change nothing, so the operator returns at once.

Here is what goes wrong without that care, in the order many people write it first: free the old block, then allocate, then copy.

::: example A naive assignment that reads freed memory
```cpp
#include <cstddef>
#include <cstdio>

class Buffer {
public:
    explicit Buffer(std::size_t n) : n_(n), data_(new double[n]{}) {}
    ~Buffer() { delete[] data_; }
    Buffer(const Buffer& other) : n_(other.n_), data_(new double[other.n_]) {
        for (std::size_t i = 0; i < n_; ++i) data_[i] = other.data_[i];
    }
    Buffer& operator=(const Buffer& other) {        // naive: free first
        delete[] data_;
        double* fresh = new double[other.n_];
        for (std::size_t i = 0; i < other.n_; ++i)
            fresh[i] = other.data_[i];              // if &other == this: freed!
        data_ = fresh;
        n_ = other.n_;
        return *this;
    }
    double& operator[](std::size_t i) { return data_[i]; }
private:
    std::size_t n_;
    double* data_;
};

int main() {
    Buffer a(4);
    a[0] = 9.81;
    Buffer& alias = a;       // e.g. two references that happen to name one object
    a = alias;
    std::printf("a[0] = %.2f\n", a[0]);
}
```

A plain build prints `a[0] = 9.81` and exits normally. It looks fine. Built with `-fsanitize=address`, the first lines of the report are:

```text
==1726==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 ...
READ of size 8 at 0x503000000040 thread T0
    #0 ... in Buffer::operator=(Buffer const&) cod_cpp_03_raii_04_ex4.cpp:15
    #1 ... in main cod_cpp_03_raii_04_ex4.cpp:30
...
freed by thread T0 here:
    #0 ... in operator delete[](void*) ...
    #1 ... in Buffer::operator=(Buffer const&) cod_cpp_03_raii_04_ex4.cpp:12
```

Follow the line numbers. Line 12 freed `data_`. Because `other` *is* this object, `other.data_` is that same freed address. Line 15 then read from it. The plain build printed the right number only because nothing had reused the freed block yet. That is luck, not correctness.

Sanity check: move the `delete[]` below the copy loop, as in the previous example, and the sanitizer report disappears even without the `this == &other` test. The safe order (allocate, copy, then free) survives self-assignment on its own. The early return only saves the wasted work.
:::

Two defences, then: allocate and copy before you free, and check for self-assignment. Lesson 07 shows a third way, called **copy-and-swap**, which writes the assignment operator in terms of the copy constructor and gets both defenses with no extra thought. Here, it is enough to know it exists.

::: key
A shallow copy duplicates the pointer, so two objects share one block, and the second destructor frees it again: a double free. A deep copy allocates a new block and copies the contents, so each object owns its own. Copy assignment must also release the old block, and must survive self-assignment `a = a`: allocate and copy first, free the old block last.
:::

::: note Why the memberwise rule is the right default
The compiler cannot know what a pointer means. It might own a block, share a block, or point into the middle of someone else's array. Only you know. So the language picks the one rule that is correct for every member that manages itself, and leaves pointers to you. This is also why the fix is rarely a hand-written deep copy. Replace `double* data_` with `std::vector<double> data_` and the generated memberwise copy calls the vector's own deep copy. You write nothing and it is correct. Lesson 07 names that idea: the rule of zero.
:::

## What a copy costs

A deep copy is honest, but it is not free. Copying a `Buffer` of 1,000 doubles means one trip to the heap for 8,000 bytes plus 1,000 element copies. Copying an `int` costs almost nothing. The cost of a copy depends entirely on what the object owns.

That matters in flight software in two ways. First, time: a heap allocation can take a very different amount of time from one call to the next, and a control loop running at 1 kHz has 1 ms per cycle, every cycle. Second, rules: many flight coding standards forbid **[[heap allocation after start-up|no-heap]]** altogether, so a copy constructor that calls `new` cannot run in the loop at all. The habits that follow are simple. Pass big objects by `const T&`. Copy on purpose, not by accident. And when an object is about to die anyway, do not copy it: hand over its block instead. That is the next lesson.

## Check yourself

::: check
For each line, say whether the copy constructor, copy assignment, or neither runs. `Tracer x{5};` then (a) `Tracer y(x);` (b) `Tracer z = x;` (c) `z = y;` (d) `const Tracer& r = x;` (e) `std::vector<Tracer> v; v.push_back(x);`
:::

::: answer
(a) Copy constructor: `y` is born from `x`. (b) Copy constructor: `z` is born on this line, so the `=` is initialization, not assignment. (c) Copy assignment: `z` already exists and is overwritten with `y`'s value. (d) Neither: `r` is a reference, a second name for `x`, and no new `Tracer` is made. (e) Copy constructor: `push_back` with a named object stores a copy inside the vector's own memory, and that copy is a new object.
:::

::: check
A class `Frame` holds `std::uint8_t* bytes_` (a buffer it allocates with `new[]` and frees in its destructor) and `std::size_t len_`. There is no copy constructor. A colleague writes `void send(Frame f);` and calls `send(frame)` once per cycle. Describe exactly what goes wrong, and when.
:::

::: answer
Passing by value runs the compiler-generated copy constructor, which copies `bytes_` (the address) and `len_`. Now the parameter `f` and the caller's `frame` share one buffer. When `send` returns, `f` is destroyed and its destructor frees that buffer. The caller's `frame` still holds the address, so its next use reads freed memory, and when `frame` is destroyed it frees the same address a second time: a double free. The first call already breaks it. Fixes: take `const Frame&` (no copy at all), and give `Frame` a real deep copy or delete its copy operations so the mistake cannot compile.
:::

::: check
Why does the copy constructor not need a self-assignment check, while copy assignment does?
:::

::: answer
A constructor builds an object that did not exist a moment ago, so it cannot also be the source: there is no way to write `T a = a;` meaningfully and get the same object on both sides. (The code compiles, but it reads `a` before `a` is initialized, which is a separate bug that `-Wall` warns about.) Assignment works on two objects that both already exist, and two references or two array indexes can name the same one. So only assignment can be handed itself, and only assignment frees an old block that might also be the source.
:::

::: check
In the deep copy assignment, suppose `new double[other.n_]` throws `std::bad_alloc`. What state is the left-hand object in, for the safe order and for the "free first" order?
:::

::: answer
Safe order (allocate, copy, free, adopt): the exception leaves on the first step, before anything was changed. The object still owns its old block with its old numbers and its old size. It is exactly as it was, which is the strong exception guarantee. Free-first order: `delete[] data_` has already run, so `data_` still holds the address of a freed block. When the exception unwinds the stack and the object's destructor eventually runs, it calls `delete[]` on that address again: a double free, caused by a failed allocation.
:::

::: check
`Buffer` copies deeply. How many bytes are allocated, in total, by `std::vector<Buffer> v(3, Buffer(500));`? Count the temporary too.
:::

::: answer
`Buffer(500)` is one temporary that allocates `500 × 8 = 4,000` bytes. The vector then copy-constructs three elements from it, each allocating its own 4,000 bytes, so `3 × 4,000 = 12,000` more. That is `4,000 + 12,000 = 16,000` bytes of samples, in four allocations. There is one more: the vector's own array of three `Buffer` objects, which holds only their sizes and pointers, not the samples. On a typical 64-bit laptop each `Buffer` is 16 bytes, so that fifth allocation is 48 bytes, and the full total is `16,000 + 48 = 16,048` bytes in five allocations. (ORBIT's in-browser build is 32-bit, where a `Buffer` is 8 bytes, so there the total is `16,000 + 24 = 16,024`.) When the line ends the temporary is destroyed and frees its 4,000 bytes, leaving 12,000 bytes of samples owned by the vector's three elements.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Copy constructor | build a new object as a copy | `T(const T& other)`; runs for `T b = a;`, `T b(a);`, pass by value |
| Copy assignment | overwrite an existing object | `T& operator=(const T& other)`; runs for `b = a;`, returns `*this` |
| Memberwise copy | what the compiler generates | copies each member in declaration order, with that member's own copy |
| Shallow copy | the pointer is copied, not the data | two owners of one block, so a double free at destruction |
| Deep copy | the pointed-to data is copied too | new allocation, then element-by-element copy |
| Safe assignment order | allocate, copy, free old, adopt | survives self-assignment and a failed allocation |
| Self-assignment | `a = a`, usually through aliasing | check `this == &other`, and never free before you have copied |
| Cost of a copy | depends on what the object owns | a 1,000-double buffer: one heap allocation, 8,000 bytes |

Next lesson: when the source object is about to be destroyed anyway, copying its block and then freeing the original is wasted work. **Move semantics** lets the new object take the block instead, and that changes how `std::vector` grows.

::: context return-by-value Returning is not the same as passing
Passing by value always builds a new parameter object. Returning by value usually does not copy at all. Since C++17, `return Buffer(4);` builds the result directly in the caller's variable: the language guarantees it, so no copy constructor runs even if it prints something. For `Buffer b(4); return b;` compilers almost always do the same, but there the standard only allows it rather than requiring it. When it does not happen, the returned object is treated as about to die, so a move constructor (next lesson) runs if the class has one. So returning a big object by value is normal, cheap C++; passing one by value is the thing to watch.
:::

::: context memberwise One member at a time
The generated copy constructor behaves as if you had written a member initializer list that copies each member from `other`, in declaration order. For a class with `int n_; double* data_;` that is `n_(other.n_), data_(other.data_)`. Each member is copied with its own rules: a `std::string` member runs the string's copy constructor, a nested struct runs that struct's copy, and a raw pointer copies the address. The class never looks inside a pointer. That is why a class made only of well-behaved members is copied correctly for free, and one raw owning pointer ruins it.
:::

::: context shallow-deep Two pictures of one copy
On the left, a shallow copy: `a` and `b` are separate objects on the stack, but their pointers hold the same address, so they share one heap block. On the right, a deep copy: each object points at its own block with its own numbers. Writing through `b` on the left changes what `a` sees. On the right it does not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="13" font-weight="700" fill="#b4232c" text-anchor="middle">shallow</text>
  <text x="270" y="16" font-size="13" font-weight="700" fill="#1d6fd1" text-anchor="middle">deep</text>
  <line x1="180" y1="8" x2="180" y2="184" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="14" y="36" font-size="11" fill="#6c7a93">stack</text>
  <text x="14" y="128" font-size="11" fill="#6c7a93">heap</text>
  <rect x="20" y="42" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="50" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="100" y="42" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="130" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="50" y="136" width="80" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="156" font-size="12" fill="#1f2a44" text-anchor="middle">9.81 0 0 0</text>
  <line x1="50" y1="78" x2="78" y2="132" stroke="#b4232c" stroke-width="2"/>
  <polygon points="80,136 73,128 81,126" fill="#b4232c"/>
  <line x1="130" y1="78" x2="102" y2="132" stroke="#b4232c" stroke-width="2"/>
  <polygon points="100,136 99,126 107,128" fill="#b4232c"/>
  <text x="90" y="182" font-size="11" fill="#b4232c" text-anchor="middle">one block, two owners</text>
  <rect x="200" y="42" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="230" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="280" y="42" width="60" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="310" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">data_</text>
  <rect x="192" y="136" width="76" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="156" font-size="12" fill="#1f2a44" text-anchor="middle">9.81 0 0 0</text>
  <rect x="272" y="136" width="76" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="156" font-size="12" fill="#1f2a44" text-anchor="middle">9.81 0 0 0</text>
  <line x1="230" y1="78" x2="230" y2="130" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="230,136 225,127 235,127" fill="#1d6fd1"/>
  <line x1="310" y1="78" x2="310" y2="130" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="310,136 305,127 315,127" fill="#1d6fd1"/>
  <text x="270" y="182" font-size="11" fill="#1d6fd1" text-anchor="middle">two blocks, one owner each</text>
</svg>
```
:::

::: context tcache The allocator keeps a list
When you free a block, glibc (the standard C library on most Linux systems) does not hand it straight back to the operating system. It keeps small freed blocks on per-thread lists so the next `new` of the same size is fast; the lists are called the thread cache, or tcache. Recent versions mark each freed block in that cache, so freeing it again can be spotted, and the library aborts with the `double free detected in tcache 2` message you saw. It is a helpful safety net, not a guarantee: many double frees and most use-after-free reads slip past it. AddressSanitizer is the real detector.
:::

::: context strong-guarantee Promises about failure
C++ describes what a function leaves behind when it throws, in three levels. The **basic guarantee**: nothing leaks and every object is still usable, though its value may have changed. The **strong guarantee**: the operation either succeeds completely or has no effect at all, like a bank transfer that either happens or does not. The **no-throw guarantee**: it never fails, which is what `noexcept` will promise in the next lesson. Our allocate-first assignment is strong because every step that can fail happens before any step that changes the object. Lesson 07 returns to this with copy-and-swap, and the next lesson shows `std::vector` choosing between copying and moving in order to keep the strong guarantee.
:::

::: context aliasing Two names, one object
Aliasing is the ordinary state of affairs in C++, not a rare trick. References and pointers exist to give an object a second name. Here is how it reaches an assignment operator: a sort routine swaps `v[i]` and `v[j]` without checking `i != j`; a mode manager copies "the active configuration" into "the pending configuration" when both currently name the same slot; a test calls `load(buf, buf)`. None of these look like `a = a` at the call site. That is why the class, not the caller, is responsible for surviving it, and the picture shows why the order of its steps decides whether it does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" font-weight="700" fill="#b4232c">free first (naive)</text>
  <rect x="12" y="30" width="96" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="60" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">free my block</text>
  <rect x="132" y="30" width="96" height="30" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">allocate new</text>
  <rect x="252" y="30" width="96" height="30" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">read other's</text>
  <line x1="108" y1="45" x2="126" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="132,45 124,41 124,49" fill="#1f2a44"/>
  <line x1="228" y1="45" x2="246" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="252,45 244,41 244,49" fill="#1f2a44"/>
  <text x="300" y="74" font-size="11" fill="#b4232c" text-anchor="middle">already freed if a = a</text>
  <text x="12" y="100" font-size="12" font-weight="700" fill="#1d6fd1">allocate first (safe)</text>
  <rect x="12" y="110" width="96" height="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="60" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">allocate new</text>
  <rect x="132" y="110" width="96" height="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">copy other's</text>
  <rect x="252" y="110" width="96" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="300" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">free old block</text>
  <line x1="108" y1="125" x2="126" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="132,125 124,121 124,129" fill="#1f2a44"/>
  <line x1="228" y1="125" x2="246" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="252,125 244,121 244,129" fill="#1f2a44"/>
</svg>
```
:::

::: context no-heap Why flight code avoids the heap in flight
Gerard Holzmann's "Power of Ten" rules, written at NASA's Jet Propulsion Laboratory for safety-critical code, include a rule against dynamic memory allocation after initialization. The reasons are the ones this lesson touched: allocation time is hard to bound, memory can fragment over a long mission, and ownership bugs like double frees become impossible if nothing is freed. So a flight program typically allocates its buffers once at start-up and then only copies *into* existing storage. A copy assignment that reuses the existing block when the sizes match fits that style; a copy constructor that calls `new` in the control loop does not.
:::
