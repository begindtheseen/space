---
id: l07-rule-of-five-and-zero
title: The rule of five, the rule of zero, and copy-and-swap
minutes: 24
covers:
  - Rule of five and rule of zero; copy-and-swap
---

Think about two ways to get to school. In the first, you own a bike. You lock it, fix the flat tire, and decide what happens when your little brother wants to borrow it. In the second, you take the school bus. Somebody else already answered all of those questions, and nothing is your job.

A C++ class makes the same choice. If it holds a resource by hand — a raw pointer to heap memory, say — it owns a bike, and must answer five questions: how to clean up, how to copy, how to overwrite itself with a copy, how to hand the resource over, and how to take one over. If every member already looks after itself, the class rides the bus: it answers none of the five, and the compiler's answers are correct.

Lessons 04 to 06 taught the pieces: the copy pair, the move pair, and when the compiler writes them for you. This lesson turns them into two design rules and one technique. You will build the same 3×3 matrix twice — once riding the bus, once owning the bike — which is exactly exercise `cpp03_ex2`. A 3×3 matrix is the workhorse of attitude code: every **[[direction cosine matrix|dcm]]** that turns a star-tracker measurement into the vehicle's body frame is one.

## The five, and the rule that ties them together

Here are the five **special member functions** that deal with ownership — the member functions the compiler may write for you if you do not:

1. the **destructor** `~T()`, read "tilde T" — cleans up when the object dies;
2. the **copy constructor** `T(const T&)` — builds a new object as a copy;
3. the **copy assignment operator** `T& operator=(const T&)` — overwrites an existing object with a copy;
4. the **move constructor** `T(T&&)` — builds a new object by taking over another's resources (read `T&&` as "T double-ampersand", an rvalue reference);
5. the **move assignment operator** `T& operator=(T&&)` — overwrites an existing object by taking over another's resources.

Lesson 06 showed that these five are tangled together. Declaring a destructor, or either copy operation, stops the compiler from generating the move pair. Declaring either move operation makes the copy pair deleted. So you cannot safely write one of them and leave the rest to chance.

The **rule of five** turns that into a habit: *if you declare any one of the five, declare all five.* "Declare" includes writing a body, writing `= default` (use the compiler's version) and writing `= delete` (forbid it). The point is that a reader can see, in one place, what copying, moving and destroying mean for your type.

The **rule of zero** is the better habit: *design the class so that you declare none of them.* Choose members that already manage their own resources — a `std::array`, a `std::vector`, a `std::string`, a `std::unique_ptr` — and the compiler's memberwise versions are correct by construction.

::: key Rule of zero
Prefer classes whose members already manage their own resources, so you write none of the five special members and get correct copy, move and destruction for free. Writing any of them is a sign a resource is being managed by hand.
:::

In a code review, when you see a hand-written copy constructor, ask: which member is a raw resource, and why is it not wrapped in a type that owns it?

## Matrix3 by value: the rule of zero

Start with the version flight software actually uses. A 3×3 matrix is nine `double`s. Store them directly inside the object:

```cpp
#include <array>
#include <cstdio>
#include <type_traits>

// Rule of zero: the only member is a std::array, which already knows how to
// copy, move and destroy itself. We write none of the five.
class Matrix3 {
public:
    Matrix3() = default;                                   // all zeros
    double& at(int r, int c)       { return m_[3 * r + c]; }
    double  at(int r, int c) const { return m_[3 * r + c]; }
private:
    std::array<double, 9> m_{};
};

static_assert(sizeof(Matrix3) == 72);
static_assert(std::is_trivially_copyable_v<Matrix3>);
static_assert(std::is_nothrow_move_constructible_v<Matrix3>);
```

The element in row `r`, column `c` lives at index `3 * r + c`. Rows are laid out one after another, which is called **[[row-major order|row-major]]**. The `{}` after `m_` sets all nine numbers to zero.

(`Matrix3() = default;` declares a *constructor*, which is not one of the five. It does not affect the rule of zero.)

Why is zero the right number? Ask what each compiler-written member does:

- **Destroy**: destroys nine `double`s, which own nothing. Correct.
- **Copy** and **copy-assign**: copy nine `double`s. The copy is independent, because the numbers are *inside* the object. Correct.
- **Move** and **move-assign**: there is no pointer to steal, so moving is copying the same 72 bytes. Still correct, and still cheap.

The three `static_assert` lines make the compiler check those claims; the build stops if one is false. `std::is_trivially_copyable_v<Matrix3>` asks whether a byte-for-byte copy is a correct copy. Here it is, so a `Matrix3` copies as fast as 72 plain bytes.

::: example Checking the rule-of-zero Matrix3
Add this `main` to the class above and build it with `g++ -std=c++20 -Wall -Wextra -O2`:

```cpp
int main() {
    Matrix3 a;
    a.at(0, 0) = 1.0; a.at(1, 1) = 2.0; a.at(2, 2) = 3.0;

    Matrix3 b = a;          // copy constructor (generated)
    b.at(0, 0) = 99.0;      // change the copy only

    Matrix3 c;
    c = a;                  // copy assignment (generated)

    std::printf("sizeof(Matrix3) = %zu bytes\n", sizeof(Matrix3));
    std::printf("a(0,0) = %.1f  b(0,0) = %.1f  c(2,2) = %.1f\n",
                a.at(0, 0), b.at(0, 0), c.at(2, 2));
}
```

It compiles with no warnings, which means all three `static_assert`s held, and prints:

```text
sizeof(Matrix3) = 72 bytes
a(0,0) = 1.0  b(0,0) = 99.0  c(2,2) = 3.0
```

Step by step:

1. `sizeof` is $9 \times 8 = 72$ bytes: nine 8-byte doubles and nothing else.
2. Setting `b(0,0)` to $99$ left `a(0,0)` at $1.0$. The copy is independent — the mark of a value.
3. `c = a` used the generated copy assignment, and `c(2,2)` is $3.0$, from `a`.

Sanity check: we wrote zero lines of copy or cleanup code, and every operation behaved like copying an `int`.
:::

The exercise asks you to write a comment justifying the rule of zero. In one sentence: *every member of this class manages itself, so the compiler-generated copy, move and destructor are already correct and as fast as anything you could write by hand.*

## Matrix3 on the heap: the rule of five

Now own the bike. The nine numbers live in a heap block, and the object holds only a pointer to it. The compiler's memberwise copy would copy the pointer, not the block, and both destructors would free it: a double free, as `cod_cpp_02_memory` showed. So all five must be written by hand.

```cpp
class HeapMatrix3 {
public:
    HeapMatrix3() : data_(new double[9]{}) { std::puts("  default ctor: new[]"); }

    ~HeapMatrix3() {                                          // 1. destructor
        std::printf("  dtor: delete[] %s\n", data_ ? "block" : "nullptr");
        delete[] data_;
    }

    HeapMatrix3(const HeapMatrix3& other)                     // 2. copy constructor
        : data_(new double[9]) {
        std::copy(other.data_, other.data_ + 9, data_);
        std::puts("  copy ctor: new[] + copy 9 doubles");
    }

    HeapMatrix3& operator=(const HeapMatrix3& other) {        // 3. copy assignment
        std::puts("  copy assign");
        if (this != &other) {
            double* fresh = new double[9];                    // may throw: do it first
            std::copy(other.data_, other.data_ + 9, fresh);
            delete[] data_;
            data_ = fresh;
        }
        return *this;
    }

    HeapMatrix3(HeapMatrix3&& other) noexcept                 // 4. move constructor
        : data_(std::exchange(other.data_, nullptr)) {
        std::puts("  move ctor: steal pointer");
    }

    HeapMatrix3& operator=(HeapMatrix3&& other) noexcept {    // 5. move assignment
        std::puts("  move assign: free mine, steal theirs");
        if (this != &other) {
            delete[] data_;
            data_ = std::exchange(other.data_, nullptr);
        }
        return *this;
    }

    double& at(int r, int c) { return data_[3 * r + c]; }

private:
    double* data_;
};
```

(It needs `<algorithm>`, `<cstdio>` and `<utility>`.) What each member guarantees:

**The destructor** frees the block. For a moved-from object `data_` is `nullptr`, and `delete[] nullptr` is guaranteed to do nothing.

**The copy constructor** gets its own block and copies the nine numbers in — the **deep copy** of lesson 04.

**The copy assignment** also has to free the target's old block and survive `a = a`. Look at the order: build the new block *first*, fill it, and only then free the old one. If `new` throws `std::bad_alloc`, nothing has changed yet. The guard `if (this != &other)`, read "if this is not the address of other", skips self-assignment.

**The move constructor** takes the pointer and leaves `nullptr` behind. `std::exchange(other.data_, nullptr)` means "give me the old value, and set it to `nullptr`" in one step. Only 8 bytes of pointer change hands. It is `noexcept`, so `std::vector` will use it (lesson 05).

**The move assignment** frees what it holds, then steals. Nothing in it can fail, so it is `noexcept` too.

The moved-from object is left in a **[[valid but unspecified state|moved-from]]**: here, a null pointer. You may destroy it or assign a new value to it. You must not read its elements.

::: example Tracing all five
Run this `main` with the class above:

```cpp
int main() {
    std::puts("HeapMatrix3 a;");
    HeapMatrix3 a;
    a.at(1, 1) = 5.0;
    std::puts("HeapMatrix3 b = a;");
    HeapMatrix3 b = a;
    std::puts("b = a;");
    b = a;
    std::puts("HeapMatrix3 c = std::move(a);");
    HeapMatrix3 c = std::move(a);
    std::puts("b = std::move(c);");
    b = std::move(c);
    std::printf("b(1,1) = %.1f\n", b.at(1, 1));
    std::puts("end of main:");
}
```

Output:

```text
HeapMatrix3 a;
  default ctor: new[]
HeapMatrix3 b = a;
  copy ctor: new[] + copy 9 doubles
b = a;
  copy assign
HeapMatrix3 c = std::move(a);
  move ctor: steal pointer
b = std::move(c);
  move assign: free mine, steal theirs
b(1,1) = 5.0
end of main:
  dtor: delete[] nullptr
  dtor: delete[] block
  dtor: delete[] nullptr
```

Follow the one block that `a` allocated on the first line. `c = std::move(a)` handed it to `c`. `b = std::move(c)` handed it on to `b`, after `b` freed the block it was holding. So at the end, `b` holds `a`'s original block, and `b(1,1)` is still $5.0$.

Now the three destructor lines. Objects die in reverse order of construction: `c`, then `b`, then `a`. `c` was emptied by the move into `b`, so it deletes `nullptr`. `b` deletes the one real block. `a` was emptied by the move into `c`, so it also deletes `nullptr`.

Sanity check: count the blocks. Allocated: `a`'s constructor, `b`'s copy constructor, and the fresh block in `b = a` — three. Freed: the old block in `b = a`, the old block in the move assignment, and `b`'s destructor — three. Every block freed exactly once. Built again with `-fsanitize=address,undefined`, the program runs clean.
:::

::: warning Cheap moves do not make the heap version faster
The heap version moves 8 bytes instead of 72, but every *construction* costs a trip to the **[[heap allocator|allocator-cost]]**. For nine numbers the by-value `Matrix3` wins. Moving pays off when the resource is big and separate, like a 10,000-sample buffer.
:::

## Copy assignment is where the bugs hide

Copy assignment is the one of the five people get wrong, because it does three jobs: release the old resource, acquire and fill a new one, and cope with the source being itself. This version looks reasonable:

```cpp
HeapMatrix3& operator=(const HeapMatrix3& o) {   // the naive version
    delete[] data_;                              // 1. free my block
    double* fresh = new double[9];               // 2. get a new one
    std::copy(o.data_, o.data_ + 9, fresh);      // 3. copy theirs in
    data_ = fresh;                               // 4. keep it
    return *this;
}
```

It has two separate bugs.

**Self-assignment.** In `m = m`, `o` and `*this` are the same object. Step 1 frees the block; step 3 reads it. A test that sets `m(0,0)` to $1.0$ and does `m = alias` (`alias` being a reference to `m`) printed `m(0,0) = 1.0` in a normal build — the freed memory still held the old numbers. Built with AddressSanitizer:

```text
==1897==ERROR: AddressSanitizer: heap-use-after-free on address 0x507000000090 ...
READ of size 72 at 0x507000000090 thread T0
    ...
    #6 0x558803dbb425 in HeapMatrix3::operator=(HeapMatrix3 const&) cod_cpp_03_raii_07_naive.cpp:14
0x507000000090 is located 0 bytes inside of 72-byte region [0x507000000090,0x5070000000d8)
freed by thread T0 here:
    #1 0x558803dbb3c6 in HeapMatrix3::operator=(HeapMatrix3 const&) cod_cpp_03_raii_07_naive.cpp:12
```

Line 12 is the `delete[]`, line 14 the `std::copy`: freed, then read.

Self-assignment sounds silly — who writes `m = m`? Nobody, on purpose. It happens through aliases: `attitude[i] = attitude[j]` when `i` happens to equal `j`, or a function that takes two references and gets the same object twice.

**Failure halfway.** Suppose step 2 throws `std::bad_alloc` because memory ran out. Step 1 has already freed the block, but `data_` still points at it — a **dangling pointer**. When the object is destroyed later, its destructor frees the same block again. With an injected allocation failure and AddressSanitizer, the report is `attempting double-free`.

This leads to the two promises a good copy assignment makes. **Self-assignment safety**: `a = a` leaves `a` unchanged and valid. And the **[[strong exception guarantee|exception-guarantees]]**: if the assignment throws, the target is exactly as it was before, as if the call never happened.

## Copy-and-swap

**Copy-and-swap** writes assignment once and keeps both promises without extra thought. Picture redecorating your room to match your friend's. Instead of emptying your room first (and being stuck with an empty room if the delivery truck breaks down), you have a copy of your friend's room built next door. Only when it is finished do you swap the door signs, and then the old room is cleared out.

In code:

```cpp
class SwapMatrix3 {
public:
    SwapMatrix3() : data_(alloc9()) {}
    ~SwapMatrix3() { delete[] data_; }
    SwapMatrix3(const SwapMatrix3& o) : data_(alloc9()) {
        std::copy(o.data_, o.data_ + 9, data_);
    }
    SwapMatrix3(SwapMatrix3&& o) noexcept : data_(std::exchange(o.data_, nullptr)) {}

    // Copy-and-swap: ONE assignment operator, parameter taken BY VALUE.
    SwapMatrix3& operator=(SwapMatrix3 other) noexcept {
        swap(*this, other);   // trade pointers with the fresh copy
        return *this;         // other's destructor frees my old block
    }
    friend void swap(SwapMatrix3& a, SwapMatrix3& b) noexcept {
        std::swap(a.data_, b.data_);
    }
    double& at(int r, int c) { return data_[3 * r + c]; }
private:
    double* data_;
};
```

Here `alloc9()` is a small helper that returns `new double[9]{}`. In the example below it also counts allocations and can be told to fail.

Walk through `b = a` with this operator:

1. **Copy.** The parameter `other` is taken *by value*, so the copy constructor builds it from `a` before the body runs — the new room next door. If that throws, `b` has not been touched.
2. **Swap.** The body trades `b`'s pointer for `other`'s. Swapping two pointers cannot fail, so `swap` is `noexcept`. Now `b` holds the new copy and `other` holds `b`'s old block.
3. **Clean up.** At the closing brace `other` dies, and its destructor frees `b`'s old block. Cleanup lives in one place, the destructor.

Self-assignment is handled for free: in `a = a`, step 1 copies `a` first, so swapping with that copy changes nothing. No `if (this != &other)` needed.

A bonus: because the parameter is taken by value, the same operator serves as move assignment. For `b = std::move(c)`, `other` is *move*-constructed from `c` — a pointer steal, no allocation — and the swap proceeds as before.

The `swap` is a **[[hidden friend|hidden-friend]]**: a function declared `friend` and defined inside the class. It is not a member, but it may touch `data_`. Lesson 08 explains `friend` properly.

::: key Copy-and-swap
It writes assignment once, in terms of the copy constructor and a `noexcept` swap, giving self-assignment safety and the strong exception guarantee with no duplicated cleanup logic. Its cost is always making a copy, which matters in hot paths.
:::

::: example Proving the guarantees, and measuring the cost
This program uses `SwapMatrix3` from above, plus a second class, `ReuseMatrix3`, whose copy assignment overwrites its existing block in place instead of making a new one:

```cpp
int  g_allocs    = 0;
bool g_fail_next = false;
double* alloc9() {
    if (g_fail_next) { g_fail_next = false; throw std::bad_alloc{}; }
    ++g_allocs;
    return new double[9]{};
}

// ... SwapMatrix3 as above ...

class ReuseMatrix3 {   // same class, but copy assignment reuses its own block
public:
    ReuseMatrix3() : data_(alloc9()) {}
    ~ReuseMatrix3() { delete[] data_; }
    ReuseMatrix3(const ReuseMatrix3& o) : data_(alloc9()) {
        std::copy(o.data_, o.data_ + 9, data_);
    }
    ReuseMatrix3(ReuseMatrix3&& o) noexcept : data_(std::exchange(o.data_, nullptr)) {}
    ReuseMatrix3& operator=(const ReuseMatrix3& o) {
        if (this != &o) {
            if (!data_) data_ = alloc9();              // only if I was moved from
            std::copy(o.data_, o.data_ + 9, data_);    // overwrite in place
        }
        return *this;
    }
    ReuseMatrix3& operator=(ReuseMatrix3&& o) noexcept {
        if (this != &o) { delete[] data_; data_ = std::exchange(o.data_, nullptr); }
        return *this;
    }
private:
    double* data_;
};

int main() {
    SwapMatrix3 a, b;
    a.at(0, 0) = 1.0;
    b.at(0, 0) = 2.0;

    a = a;                                               // self-assignment
    std::printf("after a = a:        a(0,0) = %.1f\n", a.at(0, 0));

    g_fail_next = true;                                  // the next allocation throws
    try { b = a; } catch (const std::bad_alloc&) { std::puts("b = a threw std::bad_alloc"); }
    std::printf("after failed b = a: b(0,0) = %.1f\n", b.at(0, 0));

    g_allocs = 0;
    for (int i = 0; i < 1000; ++i) b = a;
    std::printf("copy-and-swap, 1000 x (b = a): %d allocations\n", g_allocs);

    ReuseMatrix3 c, d;
    g_allocs = 0;
    for (int i = 0; i < 1000; ++i) d = c;
    std::printf("reuse buffer,  1000 x (d = c): %d allocations\n", g_allocs);
}
```

With `#include`s for `<algorithm>`, `<cstdio>`, `<new>` and `<utility>`, it prints:

```text
after a = a:        a(0,0) = 1.0
b = a threw std::bad_alloc
after failed b = a: b(0,0) = 2.0
copy-and-swap, 1000 x (b = a): 1000 allocations
reuse buffer,  1000 x (d = c): 0 allocations
```

Line by line:

1. **Self-assignment is safe.** `a = a` left `a(0,0)` at $1.0$, and AddressSanitizer reports nothing.
2. **The strong guarantee holds.** We forced the copy inside `b = a` to fail. The exception escaped, and `b(0,0)` is still $2.0$ — `b` is exactly as it was. Compare the naive version, which would have left `b` dangling.
3. **The cost is real.** One thousand copy-and-swap assignments made one thousand heap allocations (and one thousand frees). The reuse version made zero, because `d` already owned a block of the right size and overwrote it in place.

Sanity check: $1000$ assignments, $1$ new block each, $1000$ total — the count matches the design. For nine doubles, one allocation per assignment is slow compared with copying 72 bytes, and in a **[[1 kHz control loop|hot-path]]** it adds up to a thousand allocations every second.
:::

So which should you write? Copy-and-swap is the safe default when correctness matters more than the last bit of speed. Reuse-in-place is faster, but in general it gives up the strong guarantee: if copying several parts fails halfway, the target is left half-overwritten. That weaker promise — "still valid, but possibly changed" — is the **basic guarantee**. Choose on purpose, and write down which you chose.

::: warning Do not call std::swap on the whole object
Writing the body as `std::swap(*this, other);` looks tidier. It is a trap. `std::swap` works by moving: it does `tmp = move(a); a = move(b); b = move(tmp);`. The line `a = move(b)` calls *your* `operator=`, which calls `std::swap` again, which calls your `operator=`… On one machine the compiler gave no warning and the program died with `Segmentation fault` when the call stack ran out. Swap the *members* (`std::swap(a.data_, b.data_)`) inside your own `swap`, as the class above does.
:::

## Choosing between them

Put the two versions side by side:

| | `Matrix3` (by value) | `HeapMatrix3` (heap) |
| --- | --- | --- |
| special members written | zero | five (or four plus swap) |
| `sizeof` | 72 bytes | 8 bytes, plus a 72-byte heap block |
| construct | no allocation | one `new[]` |
| copy | copy 72 bytes | `new[]` plus copy 72 bytes |
| move | copy 72 bytes | copy an 8-byte pointer |
| bugs possible in ownership code | none written | every line you wrote |

For a small, fixed-size value, the rule of zero wins on speed, simplicity and safety. It also fits a rule most flight software follows: **[[no dynamic allocation after initialization|no-heap-after-init]]**.

The rule of five is still needed, in a small place. When a resource has no ready-made owner — a file, a DMA buffer — write one small class whose *only* job is owning it, declare all five (often with the copy pair `= delete`d, like `FileHandle` in exercise `cpp03_ex1`), and let every other class hold it as a member and write none. The hand-written ownership code stays a few dozen lines you can test hard.

::: note Why "declare all five" and not "write all five"
If you only need a destructor for logging, you do not have to write copy and move bodies. Declare the rest `= default`:

```cpp
struct Logged {
    ~Logged() { std::puts("gone"); }
    Logged() = default;
    Logged(const Logged&) = default;
    Logged& operator=(const Logged&) = default;
    Logged(Logged&&) = default;
    Logged& operator=(Logged&&) = default;
};
```

The user-declared destructor would have suppressed the moves (lesson 06). Writing `= default` for all four brings them back, and every reader sees the complete set. This is still the rule of five — five declared — even though you wrote only one body. Declaring the default constructor too is needed here, because declaring any constructor, including the copy constructor, stops the compiler from generating a default one.
:::

## Check yourself

::: check
A class holds a `std::string name_`, a `std::vector<double> samples_` and an `int id_`. A teammate wrote a copy constructor that copies all three members one by one. Should they also write the other four? What would you suggest instead?
:::

::: answer
Every member already manages itself, so the compiler's memberwise copy constructor does exactly what the hand-written one does. Worse, a user-declared copy constructor suppresses the implicit move pair, so every "move" of this class now copies the string and the vector. The fix is not four more functions. Remove the copy constructor and apply the rule of zero: declare none of the five.
:::

::: check
The rule-of-zero `Matrix3` has no copy-and-swap and no self-assignment test. Is its generated copy assignment still self-assignment safe, and does it give the strong exception guarantee?
:::

::: answer
Yes to both. The generated copy assignment copies the `std::array`, which assigns nine `double`s one by one. In `a = a`, each number is assigned to itself and nothing is freed, so nothing can be read after being freed. And assigning a `double` cannot throw, so the whole operation cannot throw: it is effectively `noexcept`, which is stronger than the strong guarantee. The dangers copy-and-swap protects against come from owning a resource by hand. With no resource, there is nothing to protect.
:::

::: check
The by-value `Matrix3` is 72 bytes. The heap version's move constructor moves only 8 bytes. A teammate argues the heap version is therefore better for passing matrices around a 1 kHz attitude loop. Give two reasons they are wrong.
:::

::: answer
First, making a heap matrix costs an allocation, and copying one costs an allocation plus the same 72-byte copy. Every temporary — each `A * B` result — would call the allocator, at least a thousand times a second at 1 kHz, with timing that is hard to bound. The by-value version never allocates, and copying 72 bytes is a handful of instructions. Second, most flight coding rules forbid dynamic allocation after initialization, so the heap version cannot be used in the loop at all.
:::

::: check
A class wraps a POSIX file descriptor (an `int` that must be passed to `close()` exactly once). Copying makes no sense. Which of the five do you write, and how?
:::

::: answer
All five must be declared, because the class owns a raw resource. The destructor calls `close(fd_)` if `fd_` is valid (say, not $-1$). The copy constructor and copy assignment are declared `= delete`, because two objects closing the same descriptor would be a double close. The move constructor takes the descriptor with `std::exchange(other.fd_, -1)` and is `noexcept`. The move assignment closes its own descriptor if valid, then takes the other's, leaving $-1$ behind, also `noexcept`, with a self-move check. That is the rule of five with the copy pair deleted — a move-only type, like `FileHandle` in exercise `cpp03_ex1` and like `std::unique_ptr`. Every class that uses a file then holds one of these as a member and follows the rule of zero.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| the five | destructor, copy ctor, copy assign, move ctor, move assign | they are generated or suppressed together (lesson 06) |
| rule of five | if you declare any of the five, declare all five | body, `= default` or `= delete` all count as declaring |
| rule of zero | declare none; let members own their resources | correct copy, move and destruction for free |
| `Matrix3` by value | `std::array<double, 9>` inside the object | 72 bytes, trivially copyable, rule of zero |
| `HeapMatrix3` | `double*` to a heap block | needs all five; moved-from holds `nullptr` |
| self-assignment safety | `a = a` leaves `a` valid and unchanged | the naive free-then-copy version reads freed memory |
| strong exception guarantee | if it throws, nothing changed | build the new state before touching the old |
| copy-and-swap | take the parameter by value, `swap`, let the destructor clean up | safe and simple; always allocates a copy |
| basic guarantee | if it throws, still valid but maybe changed | what reuse-in-place assignment usually gives |

Lesson 08 turns from ownership to promises: `const` member functions and `mutable`, `static` members shared by every object, and the `friend` keyword that let `swap` reach inside the class.

::: context dcm A matrix that turns one frame into another
A **direction cosine matrix** is a $3 \times 3$ matrix whose nine numbers are the cosines of the angles between the axes of two coordinate frames. Multiply a vector written in one frame by it, and you get the same vector written in the other frame. A star tracker reports where stars are in its own frame; a DCM turns that into the spacecraft body frame, and another into an inertial frame. The attitude modules later in the course use these constantly, so a correct, fast `Matrix3` is not a toy.
:::

::: context row-major Nine numbers in a row
Memory is one long line of bytes, so a grid has to be flattened. **Row-major** order stores row 0, then row 1, then row 2. The element in row $r$, column $c$ lands at index $3r + c$. C and C++ arrays use row-major order; Fortran and MATLAB use column-major, which stores columns one after another. Mixing the two silently transposes a matrix, a classic bug when C++ code calls an old Fortran library.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="20" y="10" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="35" y="27">0</text>
    <rect x="50" y="10" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="65" y="27">1</text>
    <rect x="80" y="10" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="95" y="27">2</text>
    <rect x="20" y="34" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="35" y="51">3</text>
    <rect x="50" y="34" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="65" y="51">4</text>
    <rect x="80" y="34" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="95" y="51">5</text>
    <rect x="20" y="58" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="35" y="75">6</text>
    <rect x="50" y="58" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="65" y="75">7</text>
    <rect x="80" y="58" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="95" y="75">8</text>
  </g>
  <text x="65" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">the grid, index 3r + c</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="130" y="110" width="24" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="142" y="127">0</text>
    <rect x="154" y="110" width="24" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="166" y="127">1</text>
    <rect x="178" y="110" width="24" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="190" y="127">2</text>
    <rect x="202" y="110" width="24" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="214" y="127">3</text>
    <rect x="226" y="110" width="24" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="238" y="127">4</text>
    <rect x="250" y="110" width="24" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="262" y="127">5</text>
    <rect x="274" y="110" width="24" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="286" y="127">6</text>
    <rect x="298" y="110" width="24" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="310" y="127">7</text>
    <rect x="322" y="110" width="24" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="334" y="127">8</text>
  </g>
  <text x="238" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">in memory: row 0, row 1, row 2</text>
  <text x="200" y="40" font-size="12" fill="#1f2a44">element (1, 2)</text>
  <text x="200" y="56" font-size="12" fill="#1f2a44">is at 3·1 + 2 = 5</text>
</svg>
```
:::

::: context moved-from What is left after a move
The standard library promises only that a moved-from object is **valid but unspecified**: its invariants still hold, so destroying it or assigning to it is safe, but you cannot count on its value. For our own class we chose exactly what is left — a null pointer — and wrote the destructor so that null is fine. A moved-from `std::vector` is usually empty in practice, but the standard does not promise that. Treat a moved-from object like an empty box: refill it or throw it away.
:::

::: context allocator-cost What a trip to the heap costs
`new` does not just hand back an address. The allocator has to find a free block of the right size, update its bookkeeping, and sometimes ask the operating system for more memory. On a desktop that is often tens of nanoseconds, but the worst case is much longer and hard to predict, and it may take a lock shared with other threads. Copying 72 bytes, by contrast, is a few instructions that always take the same time. For real-time code the unpredictability matters more than the average.
:::

::: context exception-guarantees Three promises a function can make
C++ library designers describe what a function promises if it throws. The **basic guarantee**: nothing leaks and every object is still valid, though values may have changed. The **strong guarantee**: the operation either fully succeeds or leaves everything exactly as it was — commit or roll back, like a bank transfer. The **nothrow guarantee**: it never throws at all, which is what `noexcept` declares. Copy-and-swap builds strong assignment out of a copy (which may throw) and a swap and destructor (which must not).
:::

::: context hidden-friend Why swap lives inside the class
A friend function defined inside the class body is found only by **argument-dependent lookup**: when you call `swap(x, y)` unqualified, the compiler also looks inside the classes of `x` and `y`. So the function takes part only when one of your objects is involved, and does not clutter every other overload set. Generic code writes `using std::swap; swap(a, b);` so that a class's own `swap` wins when it has one, and `std::swap` is used otherwise.
:::

::: context hot-path Why a thousand allocations a second matters
A control loop running at 1 kHz has 1 ms per cycle for reading sensors, estimating the state, computing commands and sending them. A single slow allocation that stalls for a fraction of a millisecond can make the loop miss its deadline. What matters is the worst case, not the average, and heap allocation has an ugly worst case. That is why hot paths are written so that they allocate nothing at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="62" x2="20" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="62" x2="180" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="340" y1="62" x2="340" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">0 ms</text>
  <text x="180" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">1 ms</text>
  <text x="340" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">2 ms</text>
  <rect x="20" y="40" width="110" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">cycle work</text>
  <rect x="180" y="40" width="110" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="290" y="40" width="60" height="22" fill="#b4232c" stroke="#1f2a44"/>
  <text x="235" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">cycle work</text>
  <text x="350" y="30" font-size="11" fill="#b4232c" text-anchor="end">slow allocation: overrun</text>
</svg>
```
:::

::: context no-heap-after-init A rule most flight code follows
NASA JPL's "Power of Ten" rules for safety-critical code say not to use dynamic memory allocation after initialization, and many flight C++ standards say the same. Memory is allocated once at start-up, sized for the worst case, and never again. Then the program cannot run out of memory mid-flight, cannot fragment the heap, and has no allocator timing to worry about. A by-value `Matrix3` lives on the stack or inside another object, so it fits this rule without effort.
:::
