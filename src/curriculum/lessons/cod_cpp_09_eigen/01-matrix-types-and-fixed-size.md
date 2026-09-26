---
id: l01-matrix-types-and-fixed-size
title: Matrix types, fixed size and dynamic size
minutes: 23
covers:
  - Matrix<Scalar, Rows, Cols>; Vector3d, Matrix3d, Quaterniond typedefs; Dynamic sizing
  - Why fixed-size types allocate nothing and unroll their loops
---

Think about an egg carton. It has twelve cups molded into it. Before you ever get to the store, you know it holds twelve eggs, you know how much room it takes in the fridge, and you never have to ask anyone for a bigger one. Now think about a grocery bag. You get it at the checkout, on the day, sized for whatever you happened to buy. It is more flexible. It also means a trip to the counter every time, and some days the counter has run out.

Numbers in a program can live in either kind of container. A 3-element velocity is an egg carton: it will always have exactly three numbers. The list of satellites a GPS receiver can see right now is a grocery bag: it might be five today and eleven tomorrow. This lesson is about how a C++ library called Eigen lets you pick the carton or the bag, and why flight software reaches for the carton whenever it can.

**Eigen** — a free C++ library for vectors, matrices, rotations and the standard ways of solving matrix equations — is what a great deal of robotics and aerospace C++ uses in place of writing its own matrix code. It is **[[header-only|header-only]]**: there is nothing to build or link, you include its headers and the compiler does the rest. You already know NumPy from Python. Eigen plays the same role in C++, with one big difference you will meet in this lesson: in Eigen, the *size* of a matrix can be part of its *type*.

## Your first Eigen program

Here is a whole program. It takes a velocity measured in a spacecraft's own body frame and turns it into another frame with a rotation matrix — the kind of step a navigation computer does many times a second.

```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    // A velocity measured in the spacecraft's body frame, m/s.
    Eigen::Vector3d v_body(3.0, 4.0, 0.0);

    // A rotation of 90 degrees about the z axis, typed in row by row.
    Eigen::Matrix3d R;
    R << 0.0, -1.0, 0.0,
         1.0,  0.0, 0.0,
         0.0,  0.0, 1.0;

    Eigen::Vector3d v_world = R * v_body;   // matrix times vector

    std::cout << "R =\n" << R << "\n";
    std::cout << "v_world = " << v_world.transpose() << "\n";
    std::cout << "speed before: " << v_body.norm()
              << "  after: " << v_world.norm() << "\n";
    std::cout << "R(0,1) = " << R(0, 1) << ", v_world.y() = " << v_world.y() << "\n";
    return 0;
}
```

To build it, tell the compiler where Eigen's headers live with the **[[-I flag|include-path]]**:

```text
g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 first.cpp -o first
./first
```

and it prints:

```text
R =
 0 -1  0
 1  0  0
 0  0  1
v_world = -4  3  0
speed before: 5  after: 5
R(0,1) = -1, v_world.y() = 3
```

Walk through it line by line.

- `#include <Eigen/Dense>` pulls in all of Eigen's everyday parts: matrices, the solvers, and rotations. Everything lives in the namespace `Eigen`.
- `Eigen::Vector3d v_body(3.0, 4.0, 0.0);` makes a vector of three `double`s and fills it.
- `R << 0.0, -1.0, ...;` is the **[[comma initializer|comma-initializer]]**: you type the numbers row by row, left to right, top to bottom, the way you would write the matrix on paper.
- `R * v_body` is a real matrix-times-vector product, the one from linear algebra. Each output number is a row of $\mathbf{R}$ dotted with the vector.
- `R(0, 1)` reads "R at row zero, column one". Rows and columns count from zero, as in NumPy, so this is the first row, second column, which holds $-1$.
- `.norm()` is the length of the vector, $\sqrt{x^2 + y^2 + z^2}$. `.transpose()` turns the column into a row, only so that it prints on one line.

Sanity check: the body velocity $(3, 4, 0)$ has length $\sqrt{9 + 16} = 5\,\mathrm{m/s}$. A rotation turns a vector without stretching it, so the rotated velocity $(-4, 3, 0)$ must have length $5$ too — and it does. Turning $(3, 4)$ a quarter-turn counterclockwise gives $(-4, 3)$, which is what the program printed.

## One template, many nicknames

In the C++ templates module you wrote class templates that take types and numbers as parameters. Eigen's central type is one of those:

```cpp
Eigen::Matrix<Scalar, Rows, Cols>
```

Read it as "a matrix of `Scalar`, with `Rows` rows and `Cols` columns". The **scalar** is the type of one entry — `double`, `float`, `int`, or even a complex number. `Rows` and `Cols` are integers known when the program is compiled.

A vector is not a separate thing. It is a matrix with one column. So `Matrix<double, 3, 1>` is a column vector of three doubles, and `Matrix<double, 1, 3>` is a row vector.

Writing the full template every time would be tiring, so Eigen gives the common shapes short names, called typedefs. The pattern is shape, then a letter for the scalar: `d` for `double`, `f` for `float`, `i` for `int`.

| Nickname | Full type | What it holds |
|---|---|---|
| `Vector3d` | `Matrix<double, 3, 1>` | a 3-element column: a position, a velocity |
| `Matrix3d` | `Matrix<double, 3, 3>` | a 3 × 3 matrix: a rotation, an inertia tensor |
| `Vector4f` | `Matrix<float, 4, 1>` | four floats |
| `RowVector3d` | `Matrix<double, 1, 3>` | a 3-element row |
| `MatrixXd` | `Matrix<double, Dynamic, Dynamic>` | any size, chosen while running |
| `VectorXd` | `Matrix<double, Dynamic, 1>` | a column of any length |

There is one more nickname you will use constantly, and it is *not* a matrix. `Quaterniond` is short for `Quaternion<double>`. A **quaternion** — four numbers $w, x, y, z$ that together describe a 3D orientation — is the standard way flight software stores which way a vehicle is pointing. Eigen gives it its own class, because a quaternion is multiplied by quaternion rules, not matrix rules. It still holds exactly four doubles and nothing else. Lessons 09 and 10 are about it; for now, know that it exists and that it is fixed-size too.

::: key
`Matrix<Scalar, Rows, Cols>` is the one template. `Vector3d` = `Matrix<double, 3, 1>`, `Matrix3d` = `Matrix<double, 3, 3>`, and `Quaterniond` = `Quaternion<double>`, a separate class holding four doubles. The trailing letter is the scalar: `d` double, `f` float, `i` int.
:::

::: example Checking the nicknames with the compiler
You do not have to trust the table. `static_assert` makes the compiler check a fact while it builds, and `std::is_same_v` asks whether two types are the same type.

```cpp
#include <Eigen/Dense>
#include <iostream>
#include <type_traits>

int main() {
    // The short names are only nicknames for the one big template.
    static_assert(std::is_same_v<Eigen::Vector3d, Eigen::Matrix<double, 3, 1>>);
    static_assert(std::is_same_v<Eigen::Matrix3d, Eigen::Matrix<double, 3, 3>>);
    static_assert(std::is_same_v<Eigen::MatrixXd,
                  Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic>>);
    std::cout << "Eigen::Dynamic = " << Eigen::Dynamic << "\n";

    // A quaternion is its own class, holding four doubles.
    Eigen::Quaterniond q = Eigen::Quaterniond::Identity();
    std::cout << "sizeof(Quaterniond) = " << sizeof(q)
              << ", w = " << q.w() << "\n";

    // A dynamic matrix learns its size while the program runs.
    int n = 6;                                  // could come from a file
    Eigen::MatrixXd P = Eigen::MatrixXd::Zero(n, n);
    std::cout << "P is " << P.rows() << " x " << P.cols() << "\n";
    P.resize(9, 9);                             // new size, old values gone
    std::cout << "now " << P.rows() << " x " << P.cols() << "\n";

    // Mixed: exactly 3 rows, any number of columns.
    Eigen::Matrix<double, 3, Eigen::Dynamic> track(3, 4);
    track.setZero();
    std::cout << "track is " << track.rows() << " x " << track.cols() << "\n";
    return 0;
}
```

It compiles, which means all three `static_assert`s held. Running it prints:

```text
Eigen::Dynamic = -1
sizeof(Quaterniond) = 32, w = 1
P is 6 x 6
now 9 x 9
track is 3 x 4
```

Check the sizes. A quaternion is four doubles, and a `double` is $8$ bytes, so $4 \times 8 = 32$ bytes — no hidden extras. The identity quaternion, "no rotation at all", has $w = 1$ and $x = y = z = 0$, which is the `w = 1` printed.
:::

::: warning Eigen does not zero your matrix for you
`Eigen::Matrix3d R;` on its own leaves the nine numbers holding whatever bytes were already in that memory, like a plain `double x;`. Reading them before you write them is undefined behavior. Start from a known value: `Matrix3d::Zero()`, `Matrix3d::Identity()`, `setZero()`, or a comma initializer that supplies every number.
:::

## Dynamic sizing

Sometimes you cannot know the size when you write the code. A navigation filter that uses satellite signals gets one measurement per satellite it can hear, and **[[that number changes|gnss-count]]** as satellites rise and set. A matrix read from a configuration file has whatever size the file says.

For those cases, put the special value `Eigen::Dynamic` in place of a number. It equals $-1$, which is never a real size, so Eigen can tell "a size I will learn later" apart from any real one. The nicknames use `X`, read "any size": `MatrixXd` is a matrix of doubles whose rows and columns are both chosen while running, and `VectorXd` is a column of any length.

- Make one with its size: `Eigen::MatrixXd P(6, 6);` or `Eigen::MatrixXd::Zero(n, n)`.
- Ask its size with `.rows()`, `.cols()`, and `.size()` for the number of entries.
- Change its size with `.resize(r, c)`. The old numbers are thrown away.

You can also mix. `Matrix<double, 3, Dynamic>` has exactly three rows — say, $x$, $y$, $z$ — and as many columns as you need, one per point along a recorded trajectory.

## Where the numbers live

Here is the real difference between the carton and the bag. Recall from the memory module that a program has two main places to keep data. The **stack** holds a function's local variables; making room there costs one subtraction and is instant. The **heap** is a big shared pool; you ask an allocator for a piece of it at run time, and that request is the "trip to the checkout counter".

A fixed-size Eigen type stores its numbers inside itself, in an ordinary array member whose length is written into the type. A `Matrix3d` is nine doubles side by side, and nothing more. So it lives wherever the object lives — usually on the stack — and making one never touches the heap.

A dynamic type cannot do that, because the compiler does not know how big to make the object. So a `MatrixXd` is a small handle: a pointer to a heap buffer, plus its row and column counts. Creating one sized $3 \times 3$ asks the heap for $72$ bytes. This picture is worth **[[drawing once|stack-heap-picture]]**.

::: key
Fixed-size types store their coefficients in a member array sized at compile time, so they live wherever the object lives, usually the stack. Dynamic types hold a pointer to a heap buffer sized at runtime. That is why `Matrix3d` is allocation-free but `MatrixXd` is not.
:::

::: example Measuring the difference
This program prints the size of each object, then asks the C library how many bytes the heap has handed out before and after making three matrices of each kind. (`mallinfo2` is a GNU C library function; it reports on this machine's heap.)

```cpp
#include <Eigen/Dense>
#include <cstdio>
#include <malloc.h>   // mallinfo2(): glibc's report on the heap

// Bytes the heap currently has handed out to this program.
static std::size_t heap_in_use() { return mallinfo2().uordblks; }

int main() {
    std::printf("sizeof(Matrix3d) = %zu bytes\n", sizeof(Eigen::Matrix3d));
    std::printf("sizeof(MatrixXd) = %zu bytes\n", sizeof(Eigen::MatrixXd));

    std::size_t before = heap_in_use();
    Eigen::Matrix3d A = Eigen::Matrix3d::Identity();
    Eigen::Matrix3d B = 2.0 * A;
    Eigen::Matrix3d C = A + B;
    std::printf("fixed 3x3:   trace %.1f, extra heap bytes %zu\n",
                C.trace(), heap_in_use() - before);

    before = heap_in_use();
    Eigen::MatrixXd X = Eigen::MatrixXd::Identity(3, 3);
    Eigen::MatrixXd Y = 2.0 * X;
    Eigen::MatrixXd Z = X + Y;
    std::printf("dynamic 3x3: trace %.1f, extra heap bytes %zu\n",
                Z.trace(), heap_in_use() - before);
    return 0;
}
```

```text
sizeof(Matrix3d) = 72 bytes
sizeof(MatrixXd) = 24 bytes
fixed 3x3:   trace 9.0, extra heap bytes 0
dynamic 3x3: trace 9.0, extra heap bytes 240
```

Read the numbers one at a time.

1. `sizeof(Matrix3d)` is $9 \times 8 = 72$ bytes: the nine doubles themselves.
2. `sizeof(MatrixXd)` is $24$ bytes: a pointer, a row count and a column count, $8$ bytes each. The numbers are not in there at all.
3. Both calculations get the same answer. $\mathbf{A}$ is the identity, $\mathbf{B} = 2\mathbf{A}$, so $\mathbf{C} = 3\mathbf{I}$, whose **trace** (the sum of the diagonal) is $3 + 3 + 3 = 9$.
4. The fixed version used $0$ heap bytes.
5. The dynamic version used $240$ heap bytes: three buffers, each $72$ bytes of numbers plus $8$ bytes of the allocator's own bookkeeping, and $3 \times 80 = 240$.

The math was identical. The only difference was where the numbers were kept.
:::

Why should a flight computer care about a few heap requests? Three reasons. A heap request takes a time that depends on the heap's history, so you cannot promise it finishes inside a control cycle. It can fail when the heap runs low or is chopped into small pieces, and a guidance loop has nowhere sensible to go when that happens. And a bug in heap use can corrupt memory far from where it happened. That is why widely used flight coding rules, such as the **[[Power of Ten|power-of-ten]]**, forbid allocating memory once the software has finished starting up. Fixed-size Eigen types let you write matrix math that obeys that rule with no extra effort.

## Loops that disappear

Every matrix operation is a loop underneath. A dot product of two vectors multiplies matching entries and adds them up.

For a `VectorXd`, the compiler has to write a real loop: keep a counter, compare it with the length, jump back, and handle whatever length arrives. For a `Vector3d`, the compiler knows the length is $3$ before the program ever runs. So it does what you would do with a recipe that says "stir three times": it writes "stir, stir, stir" and throws the counter away. That is called **loop unrolling** — replacing a loop with a known, small count by straight-line copies of its body, with **[[no counting and no jumping|unrolling-picture]]**.

::: example Reading what the compiler wrote
Two functions, identical except for the type:

```cpp
#include <Eigen/Dense>

double dot_fixed(const Eigen::Vector3d& a, const Eigen::Vector3d& b) {
    return a.dot(b);
}

double dot_dynamic(const Eigen::VectorXd& a, const Eigen::VectorXd& b) {
    return a.dot(b);
}
```

Compile to assembly — the processor's own instructions — with optimization on:

```text
g++ -std=c++20 -O2 -DNDEBUG -I/usr/include/eigen3 -S -masm=intel dot.cpp -o dot.s
```

Here is all of `dot_fixed` (bookkeeping directives removed):

```text
	movupd	xmm0, XMMWORD PTR [rsi]
	movupd	xmm3, XMMWORD PTR [rdi]
	movsd	xmm2, QWORD PTR 16[rdi]
	mulsd	xmm2, QWORD PTR 16[rsi]
	mulpd	xmm0, xmm3
	movapd	xmm1, xmm0
	unpckhpd	xmm1, xmm0
	addsd	xmm0, xmm1
	addsd	xmm2, xmm0
	movapd	xmm0, xmm2
	ret
```

Eleven instructions and not one jump. The first two lines load $a_0, a_1$ and $b_0, b_1$ in pairs. `mulpd` multiplies both pairs in a single instruction — the processor's **[[side-by-side arithmetic|simd]]** — while `mulsd` handles the third pair on its own. The `addsd` lines add the three products together. That is $a_0 b_0 + a_1 b_1 + a_2 b_2$ written out in full.

The same count for `dot_dynamic` gives 60 instructions, 8 of them conditional jumps: checks for an empty vector, a main loop that handles four entries per pass, a clean-up loop for the leftovers, and so on. It is good code, and for a vector of a thousand entries it is the right code. For three entries, nearly all of it is overhead.
:::

Eigen does not unroll without limit. Past a size threshold (set by a macro called `EIGEN_UNROLLING_LIMIT`), it keeps an ordinary loop, because a huge straight-line block would bloat the program. For the 3-, 4- and 6-element vectors and small matrices of attitude and navigation code, it unrolls.

The straight-line code is also *predictable*. It takes the same time on every call, with no branches that depend on the data. When you have to prove that a control loop always finishes inside its time budget, that is worth even more than the raw speed.

## Mistakes the compiler catches

Because the size is part of a fixed-size type, the compiler can check your linear algebra before the program runs. Multiplying a $3 \times 3$ matrix by a 2-element vector makes no sense: the inner sizes, $3$ and $2$, do not match.

```cpp
#include <Eigen/Dense>

int main() {
    Eigen::Matrix3d R = Eigen::Matrix3d::Identity();
    Eigen::Vector2d v(1.0, 2.0);
    Eigen::Vector3d w = R * v;   // 3x3 times 2x1: does not make sense
    return static_cast<int>(w.x());
}
```

This does not compile. Among the messages, g++ 13 reports:

```text
error: static assertion failed: INVALID_MATRIX_PRODUCT
error: static assertion failed: YOU_MIXED_MATRICES_OF_DIFFERENT_SIZES
```

Eigen's error names are in capitals on purpose, so that you can find the real complaint inside a long template error message. Search the compiler output for a capitalized phrase like these and read it first.

Now write the same mistake with dynamic types:

```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::MatrixXd R = Eigen::MatrixXd::Identity(3, 3);
    Eigen::VectorXd v(2);
    v << 1.0, 2.0;
    std::cout << "compiled fine, now multiplying..." << std::endl;
    Eigen::VectorXd w = R * v;   // same mistake, sizes only known at run time
    std::cout << w.transpose() << "\n";
    return 0;
}
```

It compiles without a word. Run it in a normal debug build and Eigen's run-time check stops the program:

```text
compiled fine, now multiplying...
mmd: /usr/include/eigen3/Eigen/src/Core/Product.h:96: [...]: Assertion `lhs.cols() == rhs.rows() && "invalid matrix product" && [...]' failed.
Aborted
```

That is caught, but only when that line runs — maybe in a test, maybe in flight. Build it for release with `-O2 -DNDEBUG` and it is worse:

```text
compiled fine, now multiplying...
1 2 0
```

With **[[NDEBUG|ndebug]]** defined, Eigen's checks are compiled out. The product read past the end of the 2-element vector, found some leftover byte pattern that happened to be zero, and printed a confident, meaningless answer. That read is undefined behavior; on another day it could print anything.

::: warning A dynamic size mismatch is not a compile error
With `MatrixXd` and `VectorXd`, a wrong size is only noticed when the line runs, and only in builds that keep assertions. In a release build it gives garbage silently. If you know a size, put it in the type, and the compiler checks every product and every assignment for you.
:::

## Choosing between them

Put the three benefits of fixed size side by side: no heap at all, straight-line code with no loop overhead, and linear-algebra size mistakes turned into compile errors. For a vehicle's control and navigation path, where the sizes are set by physics — three axes, four quaternion numbers, a six- or fifteen-element filter state — these are the properties you want, so fixed size is the default there. This design is not unique to Eigen: **[[PX4|px4-matrix]]**, the open-source drone autopilot, carries its own small matrix library built on the same fixed-size idea.

Dynamic size is right when the size really is unknown until run time, or when the matrix is large. A fixed-size object lives on the stack, and a stack is small: a $100 \times 100$ fixed matrix of doubles is $80{,}000$ bytes in one variable, enough to overflow a typical flight task's stack by itself. For big matrices, the unrolling benefit is gone anyway.

A rule of thumb that serves well: if you could write the size on the whiteboard before the mission, and it is small, make it fixed. Otherwise use `Dynamic`, and do the allocation once, while starting up.

## Check yourself

::: check
Write out the full `Matrix<...>` type behind each nickname: `Vector3f`, `Matrix4d`, `VectorXi`.
:::

::: answer
`Vector3f` is `Matrix<float, 3, 1>`: a column of three floats. `Matrix4d` is `Matrix<double, 4, 4>`. `VectorXi` is `Matrix<int, Dynamic, 1>`: a column of ints whose length is set at run time. The pattern is always shape first, then the letter for the scalar, and a vector is a matrix with one column.
:::

::: check
A `Matrix<double, 6, 6>` covariance lives inside a filter object. How many bytes does it add to the object, and how many heap bytes does creating it use?
:::

::: answer
It holds $6 \times 6 = 36$ doubles in a member array, so it adds $36 \times 8 = 288$ bytes to whatever object contains it. It uses zero heap bytes, because the size is in the type and the numbers are stored inline. A `MatrixXd` of the same size would add only $24$ bytes (a pointer and two counts) to the object and ask the heap for $288$ bytes more.
:::

::: check
Why can the compiler turn the dot product of two `Vector3d`s into straight-line code, but not the dot product of two `VectorXd`s?
:::

::: answer
Unrolling needs the loop count while compiling. For `Vector3d` the count, $3$, is part of the type, so the compiler writes the three multiplies and two adds directly, with no counter and no jumps. For `VectorXd` the length is a number stored in the object and only known when the program runs, so the compiler must emit a general loop that tests the length and branches. The same fact — size in the type — is what also removes the heap allocation.
:::

::: check
A teammate writes `Eigen::Vector3d r = M * s;` where `M` is a `Matrix<double, 3, 4>` and `s` is a `Vector3d`. What happens, and when? What would happen if all three were dynamic types?
:::

::: answer
The product needs the number of columns of `M`, $4$, to equal the number of rows of `s`, $3$. They do not match, and because every size is in a type, the build fails with a static assertion such as `INVALID_MATRIX_PRODUCT` — the mistake never reaches a test, let alone a vehicle. With dynamic types the code would compile. In a build with assertions the program would abort when that line ran. In a release build with `NDEBUG` there would be no check at all: it would read past the end of `s` and produce a meaningless result.
:::

::: check
Your ground software fits a curve to however many radar tracking points arrived in the last pass — sometimes 40, sometimes 400. Your flight software propagates a 9-element state every 10 ms. Which Eigen size choice fits each, and why?
:::

::: answer
The ground fit has a size known only at run time and possibly large, so `MatrixXd` and `VectorXd` are right; ground software can afford heap use, and a $400$-row fixed matrix would be a waste or impossible. The flight propagation has a size set by the design, $9$, and runs every $10\,\mathrm{ms}$, so `Matrix<double, 9, 1>` and `Matrix<double, 9, 9>` are right: no allocation during the loop, unrolled predictable code, and size errors caught by the compiler.
:::

## Summary

| Idea | Meaning | Example |
|---|---|---|
| `Matrix<Scalar, Rows, Cols>` | the one matrix template; a vector has one column | `Matrix<double, 3, 1>` |
| nickname letters | `d` double, `f` float, `i` int; `X` means any size | `Vector3d`, `Matrix3d`, `MatrixXd` |
| `Quaterniond` | `Quaternion<double>`, its own class, four doubles, 32 bytes | `Quaterniond::Identity()` |
| `Eigen::Dynamic` | the value $-1$: size chosen while running | `Matrix<double, 3, Dynamic>` |
| fixed-size storage | numbers inside the object; no heap | `sizeof(Matrix3d)` is 72 |
| dynamic storage | a pointer and counts; numbers on the heap | `sizeof(MatrixXd)` is 24 |
| unrolling | a small known loop becomes straight-line code | a `Vector3d` dot product: 11 instructions, no jumps |
| size checks | fixed: at compile time; dynamic: at run time, only with assertions | `INVALID_MATRIX_PRODUCT` |
| building | header-only; add the include path | `-I/usr/include/eigen3` |

The next lesson, *Storage order and Map*, looks inside a matrix at how its numbers are laid out in memory, and shows how to wrap a buffer you already have — a telemetry packet, or a NumPy array — as an Eigen matrix without copying a single number.

::: context header-only Nothing to build, nothing to link
Most libraries come in two parts: headers that describe the functions, and a compiled file (`.a` or `.so`) that holds their machine code, which you link into your program. Eigen is almost entirely templates, and a template is only turned into machine code when you use it with real types. So Eigen ships as headers alone. Your compiler generates exactly the code for the sizes and scalar types you use, and nothing else.

That makes Eigen easy to carry into a flight project: adding it is copying a folder, and there is no separately built binary to trust. The cost is that every file including it compiles more slowly.
:::

::: context include-path Telling the compiler where to look
When the compiler meets `#include <Eigen/Dense>`, it searches a list of folders for a file called `Eigen/Dense`. The standard folders, like `/usr/include`, are on the list already. Ubuntu installs Eigen one level deeper, in `/usr/include/eigen3`, so the file is really `/usr/include/eigen3/Eigen/Dense`.

`-I/usr/include/eigen3` adds that folder to the front of the list. Read `-I` as "also look in". Forget it and you get `fatal error: Eigen/Dense: No such file or directory` before anything else happens. In a CMake project, `find_package(Eigen3)` and linking the target `Eigen3::Eigen` adds the same flag for you.
:::

::: context comma-initializer Why the numbers go in row by row
The `<<` after a matrix is not printing here. Eigen reuses the operator to mean "fill me with these". The values go in reading order: all of row 0, then all of row 1, and so on. That matches how you would write the matrix on paper, which is the point.

You must give exactly the right count. Give eight numbers to a $3 \times 3$ matrix and a debug build stops with an assertion about too few coefficients. Lesson 02 will show that this reading order has nothing to do with the order the numbers are stored in memory, which surprises most people.
:::

::: context gnss-count Why the satellite count keeps changing
A GPS receiver can only use satellites above its horizon. The satellites circle Earth about twice a day, so every so often one rises above the horizon or sets below it, and buildings, mountains or the vehicle's own body can block others. A receiver on the ground might track anywhere from four to a dozen or more GPS satellites, and more when it also listens to Galileo, GLONASS or BeiDou.

A navigation filter that uses each satellite's range as a measurement therefore has a measurement vector whose length changes from one second to the next. That is the classic case for a dynamic size — or, in flight code, for a fixed maximum size with a count of how many slots are in use.
:::

::: context stack-heap-picture The carton and the ticket
A `Matrix3d` carries its nine numbers inside itself. A `MatrixXd` carries a ticket: an address on the heap and the size of what is waiting there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">stack</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">heap</text>
  <line x1="190" y1="10" x2="190" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="20" y="42" font-size="11" fill="#1f2a44">Matrix3d (72 bytes)</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="50" width="18" height="22"/><rect x="38" y="50" width="18" height="22"/><rect x="56" y="50" width="18" height="22"/>
    <rect x="74" y="50" width="18" height="22"/><rect x="92" y="50" width="18" height="22"/><rect x="110" y="50" width="18" height="22"/>
    <rect x="128" y="50" width="18" height="22"/><rect x="146" y="50" width="18" height="22"/><rect x="164" y="50" width="18" height="22"/>
  </g>
  <text x="20" y="112" font-size="11" fill="#1f2a44">MatrixXd (24 bytes)</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="120" width="54" height="22" fill="#f2b880"/>
    <rect x="74" y="120" width="40" height="22" fill="#ffffff"/>
    <rect x="114" y="120" width="40" height="22" fill="#ffffff"/>
  </g>
  <text x="47" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">ptr</text>
  <text x="94" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="134" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="20" y="160" font-size="11" fill="#6c7a93">rows, cols</text>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="200" y="120" width="16" height="22"/><rect x="216" y="120" width="16" height="22"/><rect x="232" y="120" width="16" height="22"/>
    <rect x="248" y="120" width="16" height="22"/><rect x="264" y="120" width="16" height="22"/><rect x="280" y="120" width="16" height="22"/>
    <rect x="296" y="120" width="16" height="22"/><rect x="312" y="120" width="16" height="22"/><rect x="328" y="120" width="16" height="22"/>
  </g>
  <path d="M47,142 C47,180 200,180 206,146" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="206,143 201,153 211,152" fill="#b4232c"/>
  <text x="272" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">72 bytes, asked for</text>
  <text x="272" y="179" font-size="11" text-anchor="middle" fill="#1f2a44">at run time</text>
</svg>
```

Copy a `Matrix3d` and you copy the nine numbers. Copy a `MatrixXd` and Eigen must ask the heap for a second buffer.
:::

::: context power-of-ten Ten rules on four pages
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published *The Power of Ten*, ten short rules for writing safety-critical code that tools can check. Rule 3 says not to use dynamic memory allocation after initialization. The reasoning is the one in this lesson: allocators take unpredictable time, can fail, and are a rich source of memory bugs.

Flight software that follows the rule sets up all of its memory while starting, then runs its control loops without ever asking for more. Fixed-size Eigen types make that natural for matrix math. You will meet all ten rules in the real-time C++ module.
:::

::: context unrolling-picture A loop, and the same loop unrolled
On the left, the loop keeps a counter, tests it and jumps back. On the right, the compiler knew the count was three and wrote the body three times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <text x="85" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">loop (any n)</text>
  <text x="265" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">unrolled (n = 3)</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="25" y="32" width="120" height="26" rx="4" fill="#ffffff"/>
    <rect x="25" y="76" width="120" height="26" rx="4" fill="#8fb8f0"/>
    <rect x="25" y="120" width="120" height="26" rx="4" fill="#f2b880"/>
  </g>
  <text x="85" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">i = 0, s = 0</text>
  <text x="85" y="93" font-size="11" text-anchor="middle" fill="#1f2a44">s += a[i] * b[i]</text>
  <text x="85" y="137" font-size="11" text-anchor="middle" fill="#1f2a44">i += 1; i &lt; n ?</text>
  <line x1="85" y1="58" x2="85" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="85" y1="102" x2="85" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M145,133 C175,133 175,89 149,89" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="147,89 156,84 156,94" fill="#b4232c"/>
  <text x="178" y="115" font-size="11" fill="#b4232c">jump</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="205" y="32" width="120" height="26" rx="4"/>
    <rect x="205" y="76" width="120" height="26" rx="4"/>
    <rect x="205" y="120" width="120" height="26" rx="4"/>
  </g>
  <text x="265" y="49" font-size="11" text-anchor="middle" fill="#1f2a44">s = a0 * b0</text>
  <text x="265" y="93" font-size="11" text-anchor="middle" fill="#1f2a44">s += a1 * b1</text>
  <text x="265" y="137" font-size="11" text-anchor="middle" fill="#1f2a44">s += a2 * b2</text>
  <line x1="265" y1="58" x2="265" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="265" y1="102" x2="265" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="175" font-size="11" text-anchor="middle" fill="#6c7a93">no counter, no test, no jump</text>
</svg>
```

Fewer instructions is nice. Having no branches at all is better still: the time is the same on every call.
:::

::: context simd Two numbers for the price of one
Modern processors have wide registers that hold several numbers at once and instructions that work on all of them together. This is called SIMD, "single instruction, multiple data". The `xmm` registers in the listing are 128 bits wide, room for two 64-bit doubles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="20" width="70" height="26" fill="#8fb8f0"/><rect x="110" y="20" width="70" height="26" fill="#8fb8f0"/>
    <rect x="40" y="60" width="70" height="26" fill="#f2b880"/><rect x="110" y="60" width="70" height="26" fill="#f2b880"/>
    <rect x="220" y="40" width="70" height="26" fill="#ffffff"/><rect x="290" y="40" width="70" height="26" fill="#ffffff"/>
  </g>
  <text x="75" y="37" font-size="12" text-anchor="middle" fill="#1f2a44">a0</text>
  <text x="145" y="37" font-size="12" text-anchor="middle" fill="#1f2a44">a1</text>
  <text x="75" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">b0</text>
  <text x="145" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">b1</text>
  <text x="255" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">a0·b0</text>
  <text x="325" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">a1·b1</text>
  <text x="20" y="58" font-size="16" text-anchor="middle" fill="#1f2a44">×</text>
  <line x1="185" y1="53" x2="212" y2="53" stroke="#b4232c" stroke-width="2"/>
  <polygon points="216,53 206,48 206,58" fill="#b4232c"/>
  <text x="200" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">one mulpd instruction, two products</text>
</svg>
```

Eigen arranges its fixed-size code so the compiler can use these instructions. Lesson 11 shows the one rule this imposes on how some Eigen objects are placed in memory.
:::

::: context ndebug The switch that removes the checks
`assert(condition)` from `<cassert>` stops the program with a message when the condition is false. Defining the macro `NDEBUG` ("no debug"), usually with `-DNDEBUG` on the command line, turns every `assert` into nothing at all. Release builds commonly do this for speed, and Eigen's size checks are asserts, so they vanish too.

That is why a check that only happens at run time is weak protection: it is often absent from the very build you fly. A size in the type is checked by the compiler in every build.
:::

::: context px4-matrix The same idea in a drone autopilot
PX4 is an open-source flight control system used in many research and commercial drones. Its source includes a compact header-only matrix library whose vectors, matrices and quaternions are templates with their sizes as parameters — the same fixed-size design as Eigen's, cut down to what a small flight controller needs.

Different projects make different library choices, but the reasons match this lesson: no heap use in the control loop, code the compiler can fully unroll, and dimension mistakes that fail the build.
:::
