---
id: l11-alignment-and-proving-no-allocation
title: Alignment and proving no allocation
minutes: 21
covers:
  - Alignment, fixed-size vectorizable types and EIGEN_MAKE_ALIGNED_OPERATOR_NEW
  - Proving no allocation with EIGEN_RUNTIME_NO_MALLOC and set_is_malloc_allowed
---

Picture an egg carton and a machine that lifts eggs two at a time. Its gripper has two cups side by side, and it always comes down on cups 0 and 1, or 2 and 3, or 4 and 5. If you put a pair of eggs in cups 1 and 2, the gripper comes down on half of one pair and half of the next. At best it is slow. On some machines it drops the eggs.

A modern processor is that machine, and the eggs are numbers. It can load two or four `double`s in one go, but its fastest loads expect the group to start at an address that is a neat multiple of the group size. Eigen arranges this for you inside its small fixed-size types, and most of the time you never think about it. This lesson covers the few places where you must: a class that holds such a type as a member, a container of them, and code built for older C++ standards.

The second half of the lesson turns a promise into a proof. Earlier in this module you saw that fixed-size types allocate nothing, and the real-time module said steady-state flight code must never touch the heap. Saying so in a code review is a promise. A test that crashes the moment anything allocates is a proof, and it keeps being a proof after the next person refactors the code. Eigen has a switch for exactly this.

## Doing several numbers at once

Ordinary arithmetic works one number at a time: load a `double`, add another, store the result. **SIMD** (single instruction, multiple data) instructions work on a small group at once. A **[[SIMD register|simd-lanes]]** on an x86-64 processor holds 16 bytes, which is two `double`s, with the SSE instruction family every x86-64 chip has. With the AVX family it holds 32 bytes, four `double`s. One SIMD add then does two or four additions in the time of one.

Eigen uses SIMD automatically whenever the numbers are laid out for it. That is part of why a `Matrix4d` product is fast.

Now the catch. Every byte in memory has a numbered **address**. A value is **[[aligned|aligned-picture]]** to 16 bytes when its address is a multiple of 16, that is, when the address divided by 16 leaves remainder 0. We write that as "address mod 16 = 0" (read "mod" as "remainder after dividing by"). The fastest SIMD loads, the ones Eigen uses for its fixed-size types, require that alignment. On x86-64 an aligned load from a misaligned address does not give a wrong answer. It crashes the program.

C++ can tell you the alignment a type needs: `alignof(T)` (read "align-of T") gives it in bytes, and `sizeof(T)` gives the size.

## Which Eigen types care

Eigen asks for extra alignment only for **fixed-size vectorizable** types: fixed-size types whose total size in bytes is a multiple of 16. Those are the ones Eigen can chop exactly into SIMD-sized pieces, so those are the ones it vectorizes with aligned loads.

Here is what the compiler reports on a standard x86-64 build (`g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 sizes.cpp`):

```cpp fragment
#include <Eigen/Geometry>
#include <cstdio>

template <typename T>
void row(const char* name) {
    std::printf("%-12s sizeof %3zu  alignof %2zu\n", name, sizeof(T), alignof(T));
}

int main() {
    row<double>("double");
    row<Eigen::Vector2d>("Vector2d");
    row<Eigen::Vector3d>("Vector3d");
    row<Eigen::Vector4d>("Vector4d");
    row<Eigen::Matrix3d>("Matrix3d");
    row<Eigen::Matrix4d>("Matrix4d");
    row<Eigen::Quaterniond>("Quaterniond");
    row<Eigen::Vector4f>("Vector4f");
    row<Eigen::MatrixXd>("MatrixXd");
    return 0;
}
```

```text
double       sizeof   8  alignof  8
Vector2d     sizeof  16  alignof 16
Vector3d     sizeof  24  alignof  8
Vector4d     sizeof  32  alignof 16
Matrix3d     sizeof  72  alignof  8
Matrix4d     sizeof 128  alignof 16
Quaterniond  sizeof  32  alignof 16
Vector4f     sizeof  16  alignof 16
MatrixXd     sizeof  24  alignof  8
```

Built again with `-mavx` (allow AVX instructions), the 32-byte types ask for more: `Vector4d`, `Matrix4d` and `Quaterniond` report `alignof 32`, because now Eigen loads them four `double`s at a time. The same source code has different alignment needs on different targets.

Two rows deserve a second look.

- `Vector3d` and `Matrix3d` need only the alignment of a plain `double`. Their sizes, 24 and 72 bytes, are not multiples of 16, so Eigen does not use aligned SIMD loads on them. The types a GNC engineer uses most are the ones that never cause alignment trouble.
- `MatrixXd` is 24 bytes whatever its size: a pointer and two integers (rows and columns). The numbers themselves live in a heap buffer, and Eigen's own allocator aligns that buffer. So dynamic types never raise the alignment problem either. They raise the allocation problem, which is the second half of this lesson.

::: key The fixed-size vectorizable alignment rule
Fixed-size types whose size is a multiple of 16 bytes (for example `Vector4d`, `Matrix4d`, `Vector2d`) require over-aligned storage for SIMD. Classes holding them as members need `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` on older toolchains; C++17 aligned `new` largely handles it now.
:::

::: example Which types are fixed-size vectorizable?
Multiply the number of entries by the bytes per entry (8 for `double`, 4 for `float`), then check whether 16 divides the result.

- `Vector2d`: $2 \times 8 = 16$ bytes, and $16 / 16 = 1$ exactly. Vectorizable.
- `Vector3d`: $3 \times 8 = 24$ bytes, and $24 / 16 = 1.5$. Not a whole number, so not vectorizable.
- `Matrix2d`: $4 \times 8 = 32$ bytes, and $32 / 16 = 2$. Vectorizable.
- `Matrix3f`: $9 \times 4 = 36$ bytes, and $36 / 16 = 2.25$. Not vectorizable.
- `Matrix<double, 6, 6>`: $36 \times 8 = 288$ bytes, and $288 / 16 = 18$. Vectorizable.

Sanity check against the table: `Vector2d` and `Matrix4d` ($16 \times 8 = 128$, and $128 / 16 = 8$) report `alignof 16`, and `Vector3d` reports 8. The arithmetic and the compiler agree. So a 6-state covariance, the size you meet in the Kalman exercise, is one of the types that care.
:::

## Where alignment goes wrong

A local variable on the stack is aligned correctly by the compiler; `alignof` tells it what to do. Trouble comes from the places where memory is handed out by something that does not know about the extra alignment.

**The heap, before C++17.** Before C++17, `new T` ignored any alignment bigger than the platform's usual one (16 bytes on x86-64 Linux). So a class with a `Matrix4d` member, built with `new` in an AVX build, could land on an address that is a multiple of 16 but not of 32. Eigen checks this in debug builds and stops with an assertion that points to its documentation.

**Standard containers, before C++17.** `std::vector<Eigen::Vector4d>` gets its memory from `std::allocator`, which used plain `new`, so the same problem applied. The old fix was `std::vector<Eigen::Vector4d, Eigen::aligned_allocator<Eigen::Vector4d>>`.

**Passing by value.** Eigen's documentation asks you not to pass fixed-size vectorizable objects to functions by value, because some platforms' calling conventions do not keep the copy aligned. Pass by `const&` instead. It is also cheaper, so it is a good habit for every Eigen type.

The fix for classes is one line. Put the macro `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` in the public part of any class that holds a fixed-size vectorizable member. It gives the class its own `operator new` that asks for correctly aligned memory.

::: example Watching the crash, and the fix
This program builds three `Filter` objects on the heap. The `char` in front pushes things around so the matrix does not happen to land well by luck.

```cpp fragment
#include <Eigen/Dense>
#include <cstdint>
#include <cstdio>

struct Filter {
    char mode;              // one byte of something else first
    Eigen::Matrix4d P;      // wants 32-byte alignment when built with AVX
#ifdef USE_MACRO
    EIGEN_MAKE_ALIGNED_OPERATOR_NEW
#endif
};

int main() {
    for (int i = 0; i < 3; ++i) {
        Filter* f = new Filter;          // leaked on purpose: a fresh address each time
        const auto addr = reinterpret_cast<std::uintptr_t>(&f->P);
        std::printf("P address mod 32 = %lu\n", static_cast<unsigned long>(addr % 32));
        f->P.setIdentity();
    }
    return 0;
}
```

Built as C++14 with AVX, `g++ -std=c++14 -mavx -I/usr/include/eigen3 align.cpp -o align`, it dies before printing anything:

```text
align: /usr/include/eigen3/Eigen/src/Core/DenseStorage.h:128: Eigen::internal::plain_array<T, Size, MatrixOrArrayOptions, 32>::plain_array() [with T = double; int Size = 16; int MatrixOrArrayOptions = 0]: Assertion `(internal::UIntPtr(eigen_unaligned_array_assert_workaround_gcc47(array)) & (31)) == 0 && "this assertion is explained here: " "http://eigen.tuxfamily.org/dox-devel/group__TopicUnalignedArrayAssert.html" " **** READ THIS WEB PAGE !!! ****"' failed.
Aborted
```

Read the middle of that message: `& (31)) == 0`. Taking an address "and 31" keeps its remainder after dividing by 32. Eigen demanded remainder 0, and the plain C++14 `new` gave it something else.

The same file with `-DUSE_MACRO` added (C++14, AVX), or built as C++17 with or without the macro, prints

```text
P address mod 32 = 0
P address mod 32 = 0
P address mod 32 = 0
```

Three objects, every matrix on a 32-byte boundary.
:::

Why does C++17 fix it with no macro? C++17 added **[[aligned new|aligned-new]]**: when a type's `alignof` is bigger than the usual heap alignment, `new` calls a version of `operator new` that receives the required alignment and honors it. `std::allocator` uses it too, so `std::vector<Vector4d>` is safe as well. Eigen 3.4 knows this: when it detects C++17 over-aligned `new`, it defines `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` as nothing at all.

::: warning Keep the macro in code that might meet an older compiler
Flight and embedded code often builds with more than one toolchain, and some cross-compilers lag years behind. In a C++17 build the macro costs nothing, and in a C++14 build it prevents a crash that appears only on the target with the wider SIMD. If a class holds a `Vector4d`, `Matrix4d`, `Quaterniond` or a 6-by-6 matrix and might be built with `new`, put the macro in.
:::

## Proving that a step never allocates

Now the second idea. A Kalman filter update built only from fixed-size types puts every temporary on the stack. A 6-by-6 `double` matrix is $36 \times 8 = 288$ bytes, so even a dozen temporaries are only a few kilobytes of stack, reserved the instant the function starts. No heap.

But one careless line changes that. A `MatrixXd` declared inside the step, a product of dynamic matrices assigned without `noalias()`, or an `.inverse()` on a dynamic matrix all ask the heap for memory. The code still compiles, still gives the right numbers, and still passes every accuracy test. It is only slower on a bad day, and on a flight computer "slower on a bad day" is the failure you cannot afford.

So you want a test that fails the moment anything in the step allocates. Eigen supplies the switch:

1. Define the macro `EIGEN_RUNTIME_NO_MALLOC` before any Eigen header is included. Eigen then checks a flag every time it is about to allocate.
2. Call `Eigen::internal::set_is_malloc_allowed(false)` to lower the flag, run the code under test, and call `set_is_malloc_allowed(true)` to raise it again.
3. Any Eigen heap allocation while the flag is down hits an **[[assertion|assertion-abort]]** and stops the program.

```cpp fragment
#define EIGEN_RUNTIME_NO_MALLOC      // must come before any Eigen header
#include <Eigen/Dense>
#include <cstdio>

int main() {
    Eigen::MatrixXd A = Eigen::MatrixXd::Random(6, 6);   // allocated here: allowed
    Eigen::MatrixXd B = Eigen::MatrixXd::Random(6, 6);
    Eigen::MatrixXd C(6, 6);

    Eigen::internal::set_is_malloc_allowed(false);        // the fence goes up
    C.noalias() = A * B;                                  // writes into C's buffer
    std::printf("noalias product: fine\n");
    std::fflush(stdout);                                  // print before any crash
    C = A * B;                                            // needs a temporary
    std::printf("plain product: fine\n");
    Eigen::internal::set_is_malloc_allowed(true);         // the fence comes down
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 nm.cpp -o nm` and run:

```text
noalias product: fine
nm: /usr/include/eigen3/Eigen/src/Core/util/Memory.h:164: void Eigen::internal::check_that_malloc_is_allowed(): Assertion `is_malloc_allowed() && "heap allocation is forbidden (EIGEN_RUNTIME_NO_MALLOC is defined and g_is_malloc_allowed is false)"' failed.
Aborted
```

The first product wrote straight into `C`'s existing buffer, which was allocated before the fence went up. The second one, as the lesson on aliasing explained, first builds the product in a temporary in case `C` appears on the right-hand side. For dynamic matrices that temporary comes from the heap, and the fence caught it on the spot. (There is also `EIGEN_NO_MALLOC`, a blunter tool that forbids Eigen heap allocation everywhere in the program, with no switch to turn it back on.)

::: key How to prove an Eigen update step allocates nothing
Compile with `EIGEN_RUNTIME_NO_MALLOC` and wrap the region with `Eigen::internal::set_is_malloc_allowed(false)`; any attempted allocation then asserts. Keep it in a test so a future refactor that introduces a dynamic type fails CI. The check is an assertion, so run it in a build without NDEBUG.
:::

::: warning The check vanishes in a release build
The guard is an `eigen_assert`, and like the standard `assert` it is compiled out when `NDEBUG` is defined. Release builds, including CMake's `Release` configuration, define **[[NDEBUG|ndebug]]**. The same program built with `-O2 -DNDEBUG` prints

```text
noalias product: fine
plain product: fine
```

and exits cleanly, having allocated inside the fence. Build the no-allocation test with assertions on, and make sure CI runs that build.
:::

::: warning Define it everywhere or nowhere
`EIGEN_RUNTIME_NO_MALLOC` changes what Eigen's inline functions contain. If one source file defines it and another does not, the program has two different versions of the same inline function, which C++ does not allow. Set it on the compiler command line (`-DEIGEN_RUNTIME_NO_MALLOC`) for the whole test build rather than writing it at the top of one file.
:::

## What Eigen's fence cannot see

Eigen's switch watches Eigen's own allocator, and nothing else. A `std::vector`, a `std::string`, a `std::function` holding a big lambda: none of them go through Eigen, so none of them trip it. Eigen, for its part, gets its heap memory from `malloc`, not from `operator new`. This little program counts every call to `operator new` by replacing it (C++ lets a program supply its own global **[[operator new|replace-new]]**):

```cpp fragment
#include <Eigen/Dense>
#include <cstdio>
#include <cstdlib>
#include <new>
#include <vector>
static long g_news = 0;
void* operator new(std::size_t n) { ++g_news; if (void* p = std::malloc(n)) return p; throw std::bad_alloc{}; }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }
int main() {
    long b = g_news;
    Eigen::MatrixXd M(50, 50);
    M.setZero();
    std::printf("MatrixXd(50,50): %ld calls to operator new\n", g_news - b);
    b = g_news;
    std::vector<double> v(50);
    std::printf("std::vector<double>(50): %ld calls to operator new\n", g_news - b);
    return static_cast<int>(M(0,0) + v[0]);
}
```

```text
MatrixXd(50,50): 0 calls to operator new
std::vector<double>(50): 1 calls to operator new
```

A 50-by-50 matrix, 20,000 bytes of heap, and the `operator new` counter saw nothing. The vector, which Eigen's fence would miss, the counter caught. Each tool is blind exactly where the other can see, so a thorough test uses both.

## The test that guards CI

Here is the whole idea as a GoogleTest file. (GoogleTest has its own module later in the track; read `TEST` as "a named check" and `EXPECT_EQ(a, b)` as "a must equal b".) It has four parts: the `operator new` counter, a small **RAII** guard that lowers Eigen's fence for one scope and raises it again on the way out, the code under test, and two tests.

```cpp
#define EIGEN_RUNTIME_NO_MALLOC
#include <Eigen/Dense>
#include <gtest/gtest.h>
#include <atomic>
#include <cstdlib>
#include <new>

// --- A counter on the global operator new catches everything else. -------
static std::atomic<long> g_news{0};
void* operator new(std::size_t n) {
    ++g_news;
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc{};
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// --- A guard that forbids Eigen heap allocation for one scope. -----------
class NoEigenMalloc {
public:
    NoEigenMalloc() { Eigen::internal::set_is_malloc_allowed(false); }
    ~NoEigenMalloc() { Eigen::internal::set_is_malloc_allowed(true); }
};

// --- The code under test: a 6-state covariance prediction. ---------------
using Mat6 = Eigen::Matrix<double, 6, 6>;

void predict(Mat6& P, const Mat6& F, const Mat6& Q) {
    P = F * P * F.transpose() + Q;
}

// The same step written with dynamic types, the way a refactor might.
void predictDynamic(Eigen::MatrixXd& P, const Eigen::MatrixXd& F,
                    const Eigen::MatrixXd& Q) {
    P = F * P * F.transpose() + Q;
}

TEST(NoAllocation, FixedSizePredictAllocatesNothing) {
    Mat6 P = Mat6::Identity();
    Mat6 F = Mat6::Identity();
    F.topRightCorner<3, 3>() = 0.01 * Eigen::Matrix3d::Identity();
    const Mat6 Q = 1e-6 * Mat6::Identity();

    const long before = g_news.load();
    {
        NoEigenMalloc fence;
        for (int k = 0; k < 1000; ++k) predict(P, F, Q);
    }
    EXPECT_EQ(g_news.load() - before, 0);
    EXPECT_GT(P.trace(), 6.0);   // the step really ran: uncertainty grew
}

TEST(NoAllocationDeathTest, DynamicPredictIsCaught) {
    Eigen::MatrixXd P = Eigen::MatrixXd::Identity(6, 6);
    const Eigen::MatrixXd F = Eigen::MatrixXd::Identity(6, 6);
    const Eigen::MatrixXd Q = 1e-6 * Eigen::MatrixXd::Identity(6, 6);
    EXPECT_DEATH({
        NoEigenMalloc fence;
        predictDynamic(P, F, Q);
    }, "heap allocation is forbidden");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 no_alloc_test.cpp -o no_alloc_test -lgtest -lgtest_main -pthread` (no `NDEBUG`), it reports:

```text
[ RUN      ] NoAllocationDeathTest.DynamicPredictIsCaught
[       OK ] NoAllocationDeathTest.DynamicPredictIsCaught (1 ms)
[ RUN      ] NoAllocation.FixedSizePredictAllocatesNothing
[       OK ] NoAllocation.FixedSizePredictAllocatesNothing (17 ms)
[  PASSED  ] 2 tests.
```

The first test runs the fixed-size step a thousand times behind both fences: Eigen's guard would abort on any Eigen allocation, and the counter checks that `operator new` was not called either. The trace check makes sure the loop really did something, because a test that measures zero allocations in code that never ran proves nothing. (With this $F$ and $Q$, the trace grows from 6 to about 306 over the thousand steps: the position uncertainty climbs because nothing is measuring it.)

The second is a **[[death test|death-test]]**. It runs the dynamic version in a separate child process and passes only if that process dies with a message containing "heap allocation is forbidden". It proves the fence is really up in this build. If someone builds the tests with `NDEBUG`, this test fails, which is exactly the warning you want.

Put this file in the test suite that CI runs on every change. Now "the update allocates nothing" is no longer a comment someone hopes is still true; it is checked on every commit.

## Check yourself

::: check
For each type, say whether it is fixed-size vectorizable, and show the arithmetic: `Eigen::Matrix<double, 3, 1>`, `Eigen::Matrix<float, 2, 2>`, `Eigen::Matrix<double, 3, 2>`, `Eigen::Matrix<double, Eigen::Dynamic, 1>`.
:::

::: answer
- `Matrix<double, 3, 1>` is `Vector3d`: $3 \times 8 = 24$ bytes, and $24 / 16 = 1.5$, so no.
- `Matrix<float, 2, 2>` (`Matrix2f`): $4 \times 4 = 16$ bytes, and $16 / 16 = 1$, so yes.
- `Matrix<double, 3, 2>`: $6 \times 8 = 48$ bytes, and $48 / 16 = 3$, so yes.
- `Matrix<double, Dynamic, 1>` (`VectorXd`) is not fixed-size at all, so the rule does not apply. Its heap buffer is aligned by Eigen's allocator, and the object itself holds only a pointer and a size.
:::

::: check
A C++14 flight library has `struct Attitude { double time; Eigen::Quaterniond q; };` and creates them with `new`. It works on the developer's laptop and crashes on a new target built with AVX. Explain why, and give two fixes.
:::

::: answer
`Quaterniond` is four doubles, 32 bytes, so it is fixed-size vectorizable. With AVX it needs 32-byte alignment. C++14 `new` ignores alignment beyond the usual 16 bytes, so on the AVX build the quaternion can land at an address that is a multiple of 16 but not 32, and Eigen's aligned-load check aborts. On the laptop build without AVX the requirement is only 16, which plain `new` satisfies, so the bug hides.

Fix 1: add `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` in the public part of `Attitude`. Fix 2: build with C++17 or later, whose aligned `new` honors `alignof`. Keeping the macro is harmless even after moving to C++17.
:::

::: check
Your no-allocation test passes locally but you suspect it is not checking anything. Name two ways the Eigen fence could be silently off, and one test you could add that would catch both.
:::

::: answer
(1) The test is built with `NDEBUG`, for example in a Release configuration, so `eigen_assert` is compiled out. (2) `EIGEN_RUNTIME_NO_MALLOC` is not defined before the Eigen headers, so the check is never compiled in. Either way, allocations go through silently.

Add a death test that deliberately allocates inside the fence, such as building a `MatrixXd` or doing a dynamic product without `noalias()`, and expects the process to die with "heap allocation is forbidden". If the fence is off, that process survives and the death test fails.
:::

::: check
A teammate replaces a fixed-size `Matrix<double, 6, 3>` gain with a `std::vector<double>` of 18 entries created inside the update step. Will Eigen's fence catch it? What will?
:::

::: answer
No. `std::vector` does not use Eigen's allocator, so `set_is_malloc_allowed(false)` never hears about it. The global `operator new` counter will: the vector's constructor calls `operator new` once, and the check that the count did not change fails. This is why the test uses both tools.
:::

::: check
Roughly how many bytes of stack does one 6-state covariance matrix take, and why does that not count as an allocation?
:::

::: answer
$36$ entries times $8$ bytes is $288$ bytes. It lives in the function's stack frame, whose size the compiler knows at compile time; the space is reserved by moving the stack pointer once when the function starts, with no search, no lock and no chance of failing partway. That is why fixed-size types are called allocation-free: there is no call to any allocator at all.
:::

## Summary

| Idea | What to remember |
|---|---|
| SIMD | one instruction on 2 doubles (SSE, 16 bytes) or 4 doubles (AVX, 32 bytes) |
| Aligned to $N$ | address mod $N$ = 0; `alignof(T)` says what $T$ needs |
| Fixed-size vectorizable | fixed size and a multiple of 16 bytes: `Vector2d`, `Vector4d`, `Matrix4d`, `Quaterniond`, 6-by-6 |
| Not affected | `Vector3d`, `Matrix3d` (24 and 72 bytes); dynamic types (heap buffer aligned by Eigen) |
| `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` | gives a class an aligned `operator new`; needed before C++17, empty in C++17 with Eigen 3.4 |
| Other rules | `aligned_allocator` for containers before C++17; pass by `const&` |
| `EIGEN_RUNTIME_NO_MALLOC` | define before any Eigen header, for the whole build |
| `set_is_malloc_allowed(false)` | any Eigen allocation now asserts; `true` lifts it |
| `NDEBUG` | turns the check off; build the test with assertions on |
| `operator new` counter | catches non-Eigen allocations the fence cannot see |

The last lesson of the module, *Eigen and NumPy side by side, and the neighbors*, steps back from single features: it maps what you know from NumPy onto Eigen, gotchas included, and introduces the libraries built on top of Eigen that a GNC team is likely to use.

::: context simd-lanes Lanes on a highway
Think of a SIMD register as a road with several lanes. A normal instruction drives one car down one lane. A SIMD instruction sends a car down every lane at once, all doing the same thing. With 16-byte registers there are two lanes for `double`s; with 32-byte registers there are four.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="12" fill="#1f2a44">16-byte register (SSE)</text>
  <rect x="10" y="32" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="90" y="32" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">double</text>
  <text x="130" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">double</text>
  <text x="10" y="92" font-size="12" fill="#1f2a44">32-byte register (AVX)</text>
  <rect x="10" y="100" width="80" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="90" y="100" width="80" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="170" y="100" width="80" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="250" y="100" width="80" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <g font-size="12" fill="#ffffff" text-anchor="middle">
    <text x="50" y="120">double</text><text x="130" y="120">double</text><text x="210" y="120">double</text><text x="290" y="120">double</text>
  </g>
</svg>
```
:::

::: context aligned-picture Starting on the line
Memory is one long row of numbered bytes. Draw a line every 16 bytes. A `Vector2d` is 16 bytes long. If it starts on a line, one aligned 16-byte load picks it up. If it starts 8 bytes past a line, it straddles two 16-byte chunks, and the aligned load cannot be used.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" fill="#ffffff">
    <rect x="20" y="40" width="80" height="26"/><rect x="100" y="40" width="80" height="26"/>
    <rect x="180" y="40" width="80" height="26"/><rect x="260" y="40" width="80" height="26"/>
    <rect x="20" y="96" width="80" height="26"/><rect x="100" y="96" width="80" height="26"/>
    <rect x="180" y="96" width="80" height="26"/><rect x="260" y="96" width="80" height="26"/>
  </g>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="20" y1="34" x2="20" y2="72"/><line x1="180" y1="34" x2="180" y2="72"/><line x1="340" y1="34" x2="340" y2="72"/>
    <line x1="20" y1="90" x2="20" y2="128"/><line x1="180" y1="90" x2="180" y2="128"/><line x1="340" y1="90" x2="340" y2="128"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="28">0</text><text x="180" y="28">16</text><text x="340" y="28">32</text>
  </g>
  <rect x="180" y="42" width="160" height="22" fill="#1d6fd1"/>
  <text x="260" y="57" font-size="12" fill="#ffffff" text-anchor="middle">Vector2d at 16: aligned</text>
  <rect x="100" y="98" width="160" height="22" fill="#b4232c"/>
  <text x="180" y="113" font-size="12" fill="#ffffff" text-anchor="middle">Vector2d at 8: straddles</text>
  <text x="20" y="145" font-size="11" fill="#6c7a93">each box: one 8-byte double; thick line every 16 bytes</text>
</svg>
```
:::

::: context aligned-new The C++17 fix
Before C++17, `operator new` received only a size, so it could not know a type wanted 32-byte alignment. C++17 added overloads that also receive a `std::align_val_t` argument. When a type's `alignof` is bigger than the platform's default heap alignment, the compiler calls those overloads, and the allocator returns memory on the right boundary. Containers get the same benefit through `std::allocator`. This is why most modern code never writes Eigen's alignment macro, and why older code is full of it.
:::

::: context assertion-abort What "Aborted" means
An assertion is a check the programmer wrote into the code: "this must be true here". When it is false, the program prints the file, line and condition, then calls `abort()`, which ends the process at once with the signal SIGABRT. The shell reports that as exit status 134, which is 128 plus 6, the signal's number. Nothing after that point runs, which is why the example flushes its output first: text still waiting in the output buffer is lost when the process dies.
:::

::: context ndebug No debug
`NDEBUG` stands for "no debug". It is a macro the standard `assert` has looked for since C was first standardized: if it is defined, every `assert` becomes an empty statement, so shipped code pays nothing for its checks. Eigen's `eigen_assert` follows the same rule. Build systems add `-DNDEBUG` to release configurations by default, so a check that lives in an assertion only protects you in builds where assertions are on. Some teams keep a separate "release with assertions" build for exactly this reason.
:::

::: context replace-new Swapping out operator new
C++ lets a program provide its own global `operator new` and `operator delete`. If you define them, the linker uses yours instead of the library's, for every `new` in the whole program, including inside the standard library. That makes a counting version easy to write and is also how memory-checking tools and custom flight allocators hook in. The replacement must be defined exactly once, in one source file of the program, and must still throw `std::bad_alloc` on failure, as the one in the lesson does.
:::

::: context death-test A test that expects to die
A normal test fails if the program crashes. A death test turns that around: it passes only if the code crashes, and with the message you expected. GoogleTest does it by starting a child process, running the statement there, and watching how the child ends, so the crash does not take the test runner down with it. By convention the test suite's name ends in `DeathTest`, and GoogleTest runs those suites first, which is why it appeared first in the output.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="110" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">test runner</text>
  <line x1="120" y1="70" x2="190" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="190,70 181,65 181,75" fill="#1f2a44"/>
  <text x="155" y="60" font-size="11" fill="#6c7a93" text-anchor="middle">fork</text>
  <rect x="192" y="50" width="110" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="247" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">child process</text>
  <text x="247" y="112" font-size="12" fill="#b4232c" text-anchor="middle">aborts: "heap allocation</text>
  <text x="247" y="127" font-size="12" fill="#b4232c" text-anchor="middle">is forbidden"</text>
  <text x="65" y="112" font-size="12" fill="#1d6fd1" text-anchor="middle">checks the message:</text>
  <text x="65" y="127" font-size="12" fill="#1d6fd1" text-anchor="middle">test passes</text>
</svg>
```
:::
