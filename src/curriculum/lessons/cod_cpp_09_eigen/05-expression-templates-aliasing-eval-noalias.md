---
id: l05-expression-templates-aliasing-eval-noalias
title: Expression templates, aliasing, eval() and noalias()
minutes: 25
covers:
  - Expression templates, lazy evaluation, aliasing, eval() and noalias()
---

A recipe card is not a cake. You can write "mix flour, sugar and eggs, then bake" on a card, pass the card around, even add a line to it, and nothing has been cooked. The cooking happens once, when someone stands at the stove and follows the whole card from top to bottom. A good cook reads the whole card first and does the steps in one smooth pass, with one bowl, instead of dirtying a new bowl for every line.

Eigen treats your arithmetic like that recipe card. When you write `a + b + c`, no adding happens there. Eigen builds an object that *describes* the sum, and the work happens at the `=`, in one loop, with no in-between vectors. That trick is called an **[[expression template|expression-template-origin]]**, and waiting until the last moment to do the work is called **lazy evaluation**. It is a large part of why Eigen code runs as fast as a hand-written loop.

Waiting has one catch. Suppose the recipe says "take the cake out of this pan, flip it, and put it back in the same pan", and you start putting pieces back before you have finished taking them out. You end up mixing new pieces with old ones. In code, that is **aliasing**: the result is written into a variable that the right-hand side is still reading. This lesson shows exactly when that goes wrong, including one case that bites Kalman filters, and the two tools that manage it: `eval()` and `noalias()`.

## What `a + b + c` really is

First, the problem Eigen solves. Imagine a plain C++ vector class whose `operator+` returns a new vector. Then `d = a + b + c` runs like this:

1. `a + b` loops over three entries and fills a temporary vector, call it `t1`.
2. `t1 + c` loops again and fills a second temporary, `t2`.
3. `d = t2` loops a third time to copy.

Three loops and two temporaries for one line. For a 3-vector the waste is small, but in a covariance update with many terms, or with large dynamic matrices where every temporary is a heap allocation, it adds up.

Eigen's `operator+` returns something else: a small object whose *type* records the operation. In C++ terms it is a class template, `CwiseBinaryOp`, with the operation and the two operands as template parameters. (You met class templates in the templates module; this is the same machinery, used very heavily.) The object stores references to `a` and `b` and nothing more. Adding `c` wraps that object in another `CwiseBinaryOp`. Only when you assign to `d` does Eigen generate the loop, and the loop it generates is the one you would have written by hand:

```cpp
for (int i = 0; i < 3; ++i) d[i] = a[i] + b[i] + c[i];
```

One pass, no temporaries. Because every size is known to the compiler for fixed-size types, it also unrolls that loop into three straight lines, as lesson 01 showed.

::: example Looking at the recipe card
This program prints the type Eigen actually builds for `a + b`, then shows what lazy evaluation means in practice.

```cpp fragment
#include <Eigen/Dense>
#include <cxxabi.h>
#include <cstdlib>
#include <iostream>
#include <typeinfo>

// Turn the compiler's internal type name into readable C++.
template <typename T>
void print_type(const char* label) {
    int status = 0;
    char* name = abi::__cxa_demangle(typeid(T).name(), nullptr, nullptr, &status);
    std::cout << label << name << "\n";
    std::free(name);
}

int main() {
    Eigen::Vector3d a(1, 2, 3);
    Eigen::Vector3d b(10, 20, 30);

    auto recipe = a + b;              // NOT a vector: an expression object
    Eigen::Vector3d result = a + b;   // a real vector, computed right here

    print_type<decltype(recipe)>("type of recipe: ");

    a(0) = 100;                       // change an input afterwards
    std::cout << "result: " << result.transpose() << "\n";
    std::cout << "recipe: " << recipe.transpose() << "\n";   // computed only now
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3`:

```text
type of recipe: Eigen::CwiseBinaryOp<Eigen::internal::scalar_sum_op<double, double>, Eigen::Matrix<double, 3, 1, 0, 3, 1> const, Eigen::Matrix<double, 3, 1, 0, 3, 1> const>
result: 11 22 33
recipe: 110  22  33
```

Read the type from the outside in: a coefficient-wise binary operation, whose operation is "sum of two doubles", applied to two constant 3-by-1 double matrices. It is a description, not a vector.

Now the numbers. `result` was computed on its line, when `a` was still $(1, 2, 3)$: $1 + 10 = 11$. `recipe` was only computed when it was printed, after `a(0)` had become 100: $100 + 10 = 110$. Same line of source, two answers, because one was cooked early and one late.

Sanity check: the second and third entries agree (22 and 33), because those inputs never changed. Only the entry we edited differs.
:::

::: warning Do not hold Eigen expressions in auto
`auto x = a + b;` stores the recipe, not the answer. If `a` or `b` changes, `x` changes. Worse, if `a` and `b` are local variables in a function that returns `x`, the recipe holds references to variables that no longer exist: a **[[dangling reference|dangling]]**, and undefined behavior. Write the type you want (`Eigen::Vector3d x = a + b;`), or, if you really want `auto`, finish the expression with `.eval()`, which turns it into a real matrix.
:::

### Products are the exception

A matrix product is not computed lazily by default. Each entry of $\mathbf{A}\mathbf{B}$ needs a whole row of $\mathbf{A}$ and a whole column of $\mathbf{B}$. If Eigen evaluated a product lazily inside a bigger expression, it would recompute those row-times-column sums again and again. So when you write `C = A * B`, Eigen computes the product into a **temporary** matrix first and then copies it into `C`. This matters for aliasing, as you are about to see.

## Aliasing: reading what you are writing

Two names **[[alias|alias-picture]]** when they refer to the same memory. In `a = a.transpose()`, the destination `a` and the source inside `a.transpose()` are the same nine numbers. Because of lazy evaluation, Eigen does not copy the right-hand side first. It walks the destination one entry at a time, and each entry reads from the source *as it is at that moment*, including entries it has already overwritten.

Whether that causes trouble depends on which source entries each destination entry reads:

- **Safe:** each output entry reads only the *same* entry of the destination. `a = 2 * a + b`, `a = a.array() * b.array()`, `a = a.cwiseAbs()`. Entry $(i, j)$ reads only $(i, j)$, so by the time it is overwritten nobody needs the old value.
- **Unsafe:** some output entry reads a *different* entry of the destination. Transposes (entry $(i, j)$ reads $(j, i)$), overlapping blocks, and `reverse()` all do this.

Matrix products read different entries too, but they are safe by default thanks to the temporary Eigen makes for them.

::: key
Why is `a = a * b` hazardous? The product reads `a` while writing it. Eigen inserts a temporary for matrix products by default to be safe, but for expressions that read other positions of the destination (a transpose, overlapping blocks) you must call `.eval()` yourself.
:::

The expressions that go wrong are the ones that read other positions of the destination, like the transpose and the overlapping blocks above; a plain entry-by-entry sum, which reads each position only to write that same position, is fine. **`.eval()`** is the fix: it forces the part of the expression it is attached to into a real temporary matrix before any writing starts. You pay for one copy; you get a correct answer.

::: example a = a.transpose(), in debug and in release
```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix3d a;
    a << 1, 2, 3,
         4, 5, 6,
         7, 8, 9;
    Eigen::Matrix3d b = a;
    Eigen::Matrix3d c = a;

    b.transposeInPlace();             // safe: written for exactly this job
    c = c.transpose().eval();         // safe: copy first, then overwrite
    std::cout << "transposeInPlace:\n" << b << "\n";
    std::cout << "eval:\n" << c << std::endl;

    a = a.transpose();                // reads a while writing a
    std::cout << "a = a.transpose():\n" << a << "\n";
}
```

A **[[debug build|ndebug]]** (no `-DNDEBUG`) prints the two safe results, then stops (message shortened):

```text
transposeInPlace:
1 4 7
2 5 8
3 6 9
eval:
1 4 7
2 5 8
3 6 9
d1: .../Eigen/src/Core/Transpose.h:434: ... Assertion `... && "aliasing detected during
transposition, use transposeInPlace() or evaluate the rhs into a temporary using .eval()"' failed.
Aborted
```

A **release build** (`-O2 -DNDEBUG`, which removes Eigen's checks) prints the same two correct results, and then:

```text
a = a.transpose():
1 2 3
2 5 6
3 6 9
```

That is not the transpose. Trace why. Eigen stores a `Matrix3d` column by column (lesson 02), so it fills the destination column by column too, and entry $(i, j)$ reads the source at $(j, i)$.

1. Column 0. Entry $(0,0)$ reads $(0,0) = 1$. Entry $(1,0)$ reads $(0,1) = 2$ and overwrites the 4 that used to be there. Entry $(2,0)$ reads $(0,2) = 3$ and overwrites the 7. Column 0 is now $1, 2, 3$.
2. Column 1. Entry $(0,1)$ should read the old $(1,0)$, which was 4, but that spot now holds 2. Entry $(2,1)$ reads $(1,2) = 6$, which has not been touched. Column 1 is now $2, 5, 6$.
3. Column 2. Entries $(0,2)$ and $(1,2)$ read $(2,0)$ and $(2,1)$, which are now 3 and 6. Column 2 is $3, 6, 9$.

The old lower-left numbers 4, 7 and 8 were destroyed before anyone read them. Sanity check: the damaged result is symmetric, a copy of the upper triangle mirrored down, which is exactly the fingerprint you would expect from "overwrite, then read back what you wrote".
:::

The debug check caught this case. It only knows the plainest pattern, though. The next one slips straight past it, and it is one every Kalman filter author writes.

### The symmetrizing trap

A quick reminder of what a **covariance** is, since the rest of this example leans on it. A Kalman filter keeps a matrix $\mathbf{P}$ that says how uncertain it is about each state (the diagonal) and how the errors in two states move together (the off-diagonal entries). Entry $(i, j)$ and entry $(j, i)$ describe the same pair, so $\mathbf{P}$ must be **symmetric**: $\mathbf{P} = \mathbf{P}^\mathsf{T}$ (read $\mathbf{P}^\mathsf{T}$ as "P transpose"). After many updates, **[[round-off|round-off]]** makes the two halves drift apart slightly. Flight filters fix that by averaging $\mathbf{P}$ with its transpose:

$$
\mathbf{P} \leftarrow \tfrac{1}{2}\left(\mathbf{P} + \mathbf{P}^\mathsf{T}\right)
$$

The natural Eigen spelling of that line has the same kind of aliasing as the transpose, only better hidden.

::: example Symmetrizing a covariance, wrongly and rightly
```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    // A covariance that round-off has made slightly unsymmetric.
    Eigen::Matrix3d P;
    P << 4.0, 1.0, 0.5,
         1.2, 3.0, 0.2,
         0.4, 0.3, 2.0;

    Eigen::Matrix3d bad = P;
    bad = 0.5 * (bad + bad.transpose());            // aliasing, no warning

    Eigen::Matrix3d good = P;
    good = 0.5 * (good + good.transpose().eval());  // transpose copied first

    std::cout << "without eval:\n" << bad << "\n";
    std::cout << "with eval:\n" << good << "\n";
    std::cout << "symmetry error without eval: "
              << (bad - bad.transpose()).cwiseAbs().maxCoeff() << "\n";
}
```

Output, identical in a debug build and in an `-O2 -DNDEBUG` build (no assertion fires):

```text
without eval:
    4  1.05 0.475
  1.1     3 0.225
 0.45  0.25     2
with eval:
   4  1.1 0.45
 1.1    3 0.25
0.45 0.25    2
symmetry error without eval: 0.05
```

Work out the correct entry $(0, 1)$: the average of $P_{01} = 1.0$ and $P_{10} = 1.2$ is $\tfrac{1}{2}(1.0 + 1.2) = 1.1$. The `eval()` version has 1.1 in both $(0,1)$ and $(1,0)$.

Now the broken one, filled column by column.

1. Column 0 comes first. Entry $(1,0)$ becomes $\tfrac{1}{2}(1.2 + 1.0) = 1.1$. Correct, and it overwrites the 1.2.
2. Column 1. Entry $(0,1)$ needs the *old* $P_{10} = 1.2$, but that spot now holds 1.1. It computes $\tfrac{1}{2}(1.0 + 1.1) = 1.05$.

So the "symmetrized" matrix is less symmetric than before in one place: $1.05$ against $1.1$, an error of $0.05$. Sanity check: the diagonal is untouched (4, 3, 2), because entry $(i, i)$ reads only itself, which is the safe case.

A filter that runs this line every cycle is quietly injecting asymmetry instead of removing it. That is why the covariance update in this module's Kalman exercise writes `P.transpose().eval()`.
:::

::: warning The answer can depend on the build
Overlapping blocks alias too. Shifting a history of five altitude readings down by one slot with `h.tail(4) = h.head(4);`, starting from $105, 104, 103, 102, 101$ and then storing a new reading $106$ in slot 0, should give $106, 105, 104, 103, 102$. On the same machine, the same source printed `106 105 105 103 103` when built with `-O2`, and `106 105 105 105 105` when built with `-O3 -march=native`, because the wider **[[SIMD|simd]]** registers copy a different number of entries at a time. `h.tail(4) = h.head(4).eval();` gives the right answer in every build. A wrong answer that changes with compiler flags is the worst kind to debug, so learn to spot the pattern by eye: the same variable on both sides, and some entry reading a *different* position.
:::

## noalias(): skipping the temporary on purpose

The temporary Eigen makes for products is a safety net, and nets cost something. For fixed-size types it is a copy on the stack. For dynamic types like `MatrixXd` it is a **[[heap allocation|heap-in-loop]]** every time the line runs: exactly what real-time flight code must avoid.

When you *know* the destination does not appear on the right-hand side, you can tell Eigen so, and it will write the product directly into the destination:

```cpp
C.noalias() = A * B;      // "C is not A or B: write straight into C"
x.noalias() += K * y;     // works with += and -= too
```

**`noalias()`** is a promise from you to Eigen. Eigen does not check it.

::: example Counting the allocations
This program counts every call to `malloc` (the linker option `-Wl,--wrap=malloc` [[routes each call through our counting function|linker-wrap]] first) while it multiplies two 40-by-40 dynamic matrices.

```cpp fragment
#include <Eigen/Dense>
#include <cstdio>
#include <cstdlib>

// Count every call to malloc (link with -Wl,--wrap=malloc).
extern "C" void* __real_malloc(std::size_t);
static int g_mallocs = 0;
extern "C" void* __wrap_malloc(std::size_t n) {
    ++g_mallocs;
    return __real_malloc(n);
}

int main() {
    const Eigen::MatrixXd A = Eigen::MatrixXd::Random(40, 40);
    const Eigen::MatrixXd B = Eigen::MatrixXd::Random(40, 40);
    Eigen::MatrixXd C(40, 40);

    for (int round = 1; round <= 2; ++round) {
        g_mallocs = 0;
        C.noalias() = A * B;
        std::printf("round %d  C.noalias() = A * B : %d malloc\n", round, g_mallocs);
        g_mallocs = 0;
        C = A * B;
        std::printf("round %d  C = A * B           : %d malloc\n", round, g_mallocs);
    }
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -I/usr/include/eigen3 alloc.cpp -Wl,--wrap=malloc`:

```text
round 1  C.noalias() = A * B : 0 malloc
round 1  C = A * B           : 1 malloc
round 2  C.noalias() = A * B : 0 malloc
round 2  C = A * B           : 1 malloc
```

The plain assignment allocates one block per call: the temporary product, $40 \times 40 \times 8 = 12{,}800$ bytes. With `noalias()`, none. Sanity check: the count does not shrink in round 2, because the temporary is thrown away after each line and made again next time. In a 100 Hz loop, that is 100 allocations a second from one innocent-looking line.
:::

Lesson 11 turns this kind of counting into a test that fails the build if anything allocates.

### Breaking the promise

If the destination *does* appear on the right, `noalias()` gives a silently wrong answer. Here `B` shuffles the columns of whatever it multiplies (new column 0 is old column 2, new column 1 is old column 0, new column 2 is old column 1), a bit like relabeling the axes of a frame.

```cpp
Eigen::Matrix3d A;
A << 1, 2, 3,
     4, 5, 6,
     7, 8, 9;
Eigen::Matrix3d B;
B << 0, 1, 0,
     0, 0, 1,
     1, 0, 0;

Eigen::Matrix3d safe = A;
safe = safe * B;                  // Eigen makes a temporary: correct
Eigen::Matrix3d broken = A;
broken.noalias() = broken * B;    // promise broken: broken is on the right
Eigen::Matrix3d fine;
fine.noalias() = A * B;           // promise kept: fine is not on the right
// safe and fine:      broken:
// 3 1 2               3 3 3
// 6 4 5               6 6 6
// 9 7 8               9 9 9
```

The correct answer has the columns $(1,4,7), (2,5,8), (3,6,9)$ moved into the order third, first, second. The broken one is column $(3, 6, 9)$ three times: column 0 was filled with old column 2, then column 1 copied "column 0", which already held $(3, 6, 9)$, and column 2 copied "column 1", which by then held the same. This gave the same wrong answer in debug, `-O2` and `-O3 -march=native` builds. No assertion, no crash. And a broken promise does not always show: on the same machine, the same misuse with a different 6-by-6 matrix happened to come out right. A test that passes proves nothing here, so treat every broken `noalias()` promise as a bug.

::: key
What does `noalias()` prevent? Eigen creating a temporary for a matrix product assignment. Write `C.noalias() = A * B` only when you know `C` does not appear on the right-hand side; using it when it does can give a silently wrong result.
:::

## eval() and noalias() point in opposite directions

It helps to see the two tools side by side. They are opposite promises.

| You write | What you are telling Eigen | Cost | Use it when |
| --- | --- | --- | --- |
| `x.eval()` | "I suspect aliasing: make a real copy of this first." | one extra temporary | the destination is read at a different position on the right: transposes, overlapping blocks, symmetrizing |
| `C.noalias() = ...` | "There is no aliasing here: skip your safety copy." | saves a temporary (and, for dynamic types, an allocation) | a product whose destination is a separate variable |
| neither | "Use your defaults." | products get a temporary; everything else is lazy | coefficient-wise expressions that read each entry only at its own position |

A good habit in filter code: every product that lands in a separate variable gets `noalias()`; every line with the same name on both sides gets a moment's thought about which entries it reads. Transpose-in-place has its own method, `transposeInPlace()`, and so does reversing: `reverseInPlace()`.

::: note Why the product default is "make a temporary"
Eigen could have made products lazy like everything else and left aliasing to you. It does not, because `x = A * x` (rotate a vector in place) and `P = F * P` are so common that making them wrong by default would be a trap on nearly every page of GNC code. For coefficient-wise expressions, the choice goes the other way: they are safe in the common case, and making a temporary for every `a = a + b` would throw away the whole point of expression templates. So Eigen's defaults follow how often each case really aliases, and `eval()` and `noalias()` are the two ways to override them.
:::

## Check yourself

::: check
For `Eigen::Vector3d a, b, c, d;`, how many loops over the entries and how many temporary vectors does `d = a + 2.0 * b - c;` cost? What would a naive vector class that returns a new vector from each operator cost?
:::

::: answer
Eigen builds one nested expression object (a difference, whose left side is a sum, whose right side is a scalar-times-vector) and runs a single loop at the `=`: `d[i] = a[i] + 2.0 * b[i] - c[i]` for each $i$, with no temporary vectors. For fixed size 3 the compiler unrolls it into three lines. A naive class does `2.0 * b` into a temporary, adds `a` into a second temporary, subtracts `c` into a third, and copies into `d`: four loops and three temporaries.
:::

::: check
Which of these lines alias badly (give a wrong answer without `.eval()`)? (i) `v = v.cwiseAbs();` (ii) `M = M.transpose() * 2.0;` (iii) `M = M * N;` (iv) `v.tail(3) = v.head(3);` for a `Matrix<double, 5, 1>` `v`.
:::

::: answer
(i) Safe: entry $i$ reads only entry $i$. (ii) Unsafe: entry $(i, j)$ reads $(j, i)$, which may already be overwritten. (This one is close enough to the plain pattern that a debug build's assertion catches it; a release build prints a wrong matrix.) Write `M.transposeInPlace(); M *= 2.0;` or `M = M.transpose().eval() * 2.0;`. (iii) Safe by default: Eigen evaluates the product into a temporary. (iv) Unsafe: `head(3)` is positions 0–2 and `tail(3)` is positions 2–4. Filling position 2 overwrites a value that position 4 still has to read. Starting from $1, 2, 3, 4, 5$ the build used for this lesson printed $1, 2, 1, 2, 1$ instead of $1, 2, 1, 2, 3$. Write `v.tail(3) = v.head(3).eval();`. (Copying the other way, `v.head(3) = v.tail(3)`, happens to be safe with a front-to-back loop, because every position is read before it is overwritten. Relying on loop direction is fragile, so use `.eval()` for any overlap.)
:::

::: check
A teammate adds `.noalias()` everywhere to "make the filter faster", including on the attitude update `R.noalias() = R * dR;`, where `R` is the vehicle's 3-by-3 rotation matrix and `dR` a small rotation for this time step. What happens, and what would you write instead?
:::

::: answer
`R` appears on the right, so the promise is false. Eigen writes the product straight into `R` while still reading `R`. With a 0.5 rad attitude and a 0.01 rad step, the test build for this lesson gave entries off by about $9 \times 10^{-5}$, and `R` was no longer a true rotation: $\mathbf{R}\mathbf{R}^\mathsf{T}$ missed the identity by about $1.7 \times 10^{-4}$. Small enough to look plausible, and it compounds every cycle. No warning in any build. Fix: drop `noalias()` (Eigen then uses its temporary and gets it right), or write into a separate matrix: `R_next.noalias() = R * dR; R = R_next;`.
:::

::: check
Explain why this function is a bug even though it compiles and often seems to work:

`auto sum(const Eigen::Vector3d& a, const Eigen::Vector3d& b) { Eigen::Vector3d s = a + b; return s + a; }`
:::

::: answer
`auto` makes the return type the expression type of `s + a`, which stores a reference to the local variable `s`. When the function returns, `s` is destroyed, and the caller receives a recipe pointing at dead stack memory. Evaluating it later is undefined behavior. It may "work" until the stack slot is reused. Fix: declare the return type `Eigen::Vector3d`, or return `(s + a).eval()`.
:::

::: check
In one sentence each: what does `.eval()` promise, and what does `.noalias()` promise? Which one costs a copy?
:::

::: answer
`.eval()` says "evaluate this sub-expression into a real temporary now", protecting you when the destination is read at other positions on the right; it costs a copy. `.noalias()` says "the destination is not read on the right, so write the product straight into it"; it saves the temporary Eigen would otherwise make, and it is wrong to use if the promise is false.
:::

## Summary

| Idea | What it means | Rule of thumb |
| --- | --- | --- |
| Expression template | `a + b` returns a typed description, not a vector | the work happens at `=` in one fused loop |
| Lazy evaluation | nothing computed until assigned | never store an Eigen expression in `auto` without `.eval()` |
| Products | evaluated into a temporary by default | `a = a * b` is safe as written |
| Aliasing | destination read at other positions while being written | transposes, overlapping blocks, reverse, symmetrizing |
| `.eval()` | force a temporary copy of a sub-expression | fixes aliasing; costs one copy |
| `transposeInPlace()` | in-place transpose done safely | use instead of `a = a.transpose()` |
| `.noalias()` | skip the product temporary | only when the destination is not on the right |
| Debug checks | catch only `a = a.transpose()`-style cases | other aliasing is silent in every build |

Next, **Floating point in practice** looks at the numbers themselves: why the "rounding dust" appears, how fused multiply-add and compensated summation fight it, how the condition number tells you how many digits a covariance solve can keep, and why the same code can give different bits on different builds.

::: context expression-template-origin An old trick with a plain idea
Expression templates were described in the mid-1990s by Todd Veldhuizen, who used them in the Blitz++ array library, and found independently by David Vandevoorde. The idea is to let the C++ type system hold the shape of a formula, so the compiler can see the whole formula at once and write one tight loop for it. Eigen builds its whole design on it. The price is long type names in error messages, which is why Eigen compile errors can fill a screen.
:::

::: context dangling A reference to nothing
A reference is a second name for an existing object. If the object is destroyed, for example because it was a local variable and its function returned, the reference still exists but names nothing. Using it reads whatever now occupies that memory. The C++ memory module called this a dangling reference, one of the classic memory bugs. Eigen expressions store references to their operands on purpose, because copying operands would cost time, so any expression that outlives its operands dangles.
:::

::: context alias-picture Two names, one box
In `a = a.transpose()`, the name on the left and the name inside the right-hand side are labels on the same nine numbers in memory. Writing through one label changes what the other one reads.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="70" width="120" height="44" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="97" font-size="13" fill="#1f2a44" text-anchor="middle">nine doubles</text>
  <text x="60" y="30" font-size="13" fill="#b4232c" text-anchor="middle">destination a</text>
  <text x="300" y="30" font-size="13" fill="#1f2a44" text-anchor="middle">source a.transpose()</text>
  <line x1="60" y1="38" x2="150" y2="68" stroke="#b4232c" stroke-width="2"/>
  <polygon points="150,68 139,66 144,58" fill="#b4232c"/>
  <line x1="300" y1="38" x2="210" y2="68" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="210,68 216,58 221,66" fill="#1f2a44"/>
  <text x="60" y="56" font-size="11" fill="#6c7a93" text-anchor="middle">writes</text>
  <text x="300" y="56" font-size="11" fill="#6c7a93" text-anchor="middle">reads</text>
</svg>
```

The same thing happens with pointers and references in plain C++, and compilers have to allow for it too, which is part of why they cannot always optimize loops as much as you might hope.
:::

::: context ndebug What NDEBUG switches off
C and C++ have a standard macro, `assert(condition)`, which stops the program with a message if the condition is false. Defining the name `NDEBUG` ("no debug") before the headers are included turns every `assert` into nothing. Eigen's run-time checks, such as size mismatches, index out of range and this aliasing check, are built on `assert`, so they vanish in a build with `-DNDEBUG`. Most release builds define it for speed. That is why it pays to run the test suite in a debug build as well as a release build: the debug run catches what it can, and the release run tests the code that will fly.
:::

::: context round-off Where the asymmetry comes from
In exact arithmetic, the covariance update produces a perfectly symmetric matrix. On a computer, entry $(i, j)$ and entry $(j, i)$ are computed by different sequences of multiplies and adds, and each operation rounds to the nearest representable `double`. The two results can differ in the last digit or two. One update barely matters, but a filter runs hundreds of updates a second for hours, and an unsymmetric covariance can drift toward one with a negative variance, which no real uncertainty can have. Symmetrizing every cycle keeps that from starting.
:::

::: context simd One instruction, several numbers
SIMD stands for "single instruction, multiple data". Modern processors have wide registers that hold several numbers side by side, and one instruction adds or multiplies all of them at once. A 128-bit SSE register holds two doubles; a 256-bit AVX register holds four; a 512-bit AVX-512 register holds eight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">SSE, 128 bits</text>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="120" y="14" width="50" height="24"/><rect x="170" y="14" width="50" height="24"/>
  </g>
  <text x="10" y="80" font-size="12" fill="#1f2a44">AVX, 256 bits</text>
  <g fill="#f2b880" stroke="#b4232c">
    <rect x="120" y="64" width="50" height="24"/><rect x="170" y="64" width="50" height="24"/>
    <rect x="220" y="64" width="50" height="24"/><rect x="270" y="64" width="50" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="30">double</text><text x="195" y="30">double</text>
    <text x="145" y="80">double</text><text x="195" y="80">double</text>
    <text x="245" y="80">double</text><text x="295" y="80">double</text>
  </g>
  <text x="180" y="125" font-size="12" fill="#6c7a93" text-anchor="middle">one add instruction handles every box in a row</text>
</svg>
```

Eigen uses these registers automatically. That is why a copy between overlapping blocks can move two entries at a time in one build and four in another, and why the aliasing damage differs.
:::

::: context heap-in-loop Why flight code fears malloc in a loop
Asking the heap for memory runs a search through the allocator's bookkeeping, and how long that search takes depends on everything the program has allocated and freed before. On a desktop it is fast on average, but a control loop cares about the worst case, not the average. The heap can also fragment until a request fails. For both reasons, flight software usually allocates everything at startup and nothing in the loop. The C++ memory and real-time modules go into both problems in depth.
:::

::: context linker-wrap How the counting trick works
When the linker sees `--wrap=malloc`, it rewires the program: every call to `malloc` goes to a function named `__wrap_malloc` instead, and the name `__real_malloc` reaches the original. Our wrapper adds one to a counter and passes the request on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">Eigen code</text>
  <rect x="135" y="35" width="100" height="36" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="185" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">__wrap_malloc</text>
  <rect x="270" y="35" width="80" height="36" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="310" y="58" font-size="12" fill="#1f2a44" text-anchor="middle">real malloc</text>
  <line x1="100" y1="53" x2="131" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="135,53 127,49 127,57" fill="#1f2a44"/>
  <line x1="235" y1="53" x2="266" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="270,53 262,49 262,57" fill="#1f2a44"/>
  <text x="185" y="92" font-size="11" fill="#b4232c" text-anchor="middle">++g_mallocs</text>
  <text x="115" y="28" font-size="11" fill="#6c7a93" text-anchor="middle">malloc(n)</text>
</svg>
```

It is a debugging tool for a test build, not something to ship. Eigen allocates through `malloc` rather than `operator new`, which is why overriding `new` alone would miss its allocations.
:::
