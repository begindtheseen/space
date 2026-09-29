---
id: l02-non-type-template-parameters
title: Numbers as template parameters
minutes: 23
covers:
  - "Non-type template parameters: the key to Matrix<double,3,3>"
---

An egg carton has its size built in. A carton of 12 has exactly 12 cups. You cannot squeeze a 13th egg in, and you do not need to count the cups before using it, because the size is part of what the carton *is*. A carton of 6 is a different product on a different shelf, even though it holds the same eggs.

Last lesson's templates had holes for types. This lesson's templates also have holes for **values** — numbers, mostly — and a value filled into a template becomes part of the type, exactly like the size of a carton. You have used one already: in `std::array<double, 3>`, the `3` is a value, and `std::array<double, 3>` and `std::array<double, 4>` are two different types.

This is the idea behind every fixed-size matrix library in guidance, navigation and control. A 3-by-3 rotation matrix and a 3-by-1 vector have their shapes written into their types. Then the compiler itself checks that a multiplication makes sense, and a wrong shape stops the build instead of flying. It is also why these small matrices are fast: sizes the compiler knows are sizes it can plan around.

## Values in the angle brackets

Here is the smallest useful example, the average of a fixed number of gyro samples:

```cpp
template <std::size_t N>
double mean(const std::array<double, N>& xs) {
    double s = 0.0;
    for (double x : xs) s += x;
    return s / N;
}
```

Read the first line as "a template, for any size `N`". Instead of `typename`, the parameter has a real type, **[[std::size_t|size-t]]**, the unsigned integer type the standard library uses for sizes. `N` is a **non-type template parameter**: a template parameter that stands for a value rather than a type. Inside the template, `N` is a constant. You can use it anywhere a constant is allowed — as an array size, in a `static_assert`, in another template's arguments.

And it can be deduced, the same way a type is. Call `mean(gyro)` with a `std::array<double, 4>`, and the compiler matches `std::array<double, N>` against `std::array<double, 4>` and solves `N = 4`.

### What may be a non-type parameter

Not every value can go in the angle brackets. The allowed kinds are:

- **integers** of any kind (`int`, `std::size_t`, `char`, `bool` …), by far the commonest;
- **enumerations**, such as `Axis::Z`;
- **pointers** and **references** to objects or functions that have a fixed address for the whole program, and `nullptr`;
- since C++20, **floating-point** values such as `2.5`, and values of simple class types called **[[structural types|structural]]** — roughly, structs whose members are all public and are themselves allowed kinds.

Every argument must be a **[[constant expression|constant-expression]]**: something the compiler can work out while compiling. A literal `4`, a `constexpr` variable, `sizeof(double)`, or `3 * 3` all qualify. A variable read from a file, a sensor or the command line does not.

::: example One template per kind of value
```cpp
#include <array>
#include <cstddef>
#include <cstdio>

enum class Axis { X, Y, Z };

struct Rate { int hz; };                              // a "structural" type: public members only

template <std::size_t N>                              // an integer
double mean(const std::array<double, N>& xs) {
    double s = 0.0;
    for (double x : xs) s += x;
    return s / N;                                     // N is a constant here
}

template <Axis A>                                     // an enumerator
const char* axis_name() { return A == Axis::X ? "x" : A == Axis::Y ? "y" : "z"; }

template <Rate R>                                     // a class-type value (C++20)
constexpr double period_ms() { return 1000.0 / R.hz; }

template <double Gain>                                // a floating-point value (C++20)
double scale(double x) { return Gain * x; }

int main() {
    std::array<double, 4> gyro{0.011, 0.013, 0.009, 0.015};
    std::printf("mean of %zu samples: %.4f rad/s\n", gyro.size(), mean(gyro));   // N deduced as 4
    std::printf("axis %s\n", axis_name<Axis::Z>());
    std::printf("period %.3f ms\n", period_ms<Rate{400}>());
    std::printf("scaled %.2f\n", scale<2.5>(4.0));
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
mean of 4 samples: 0.0120 rad/s
axis z
period 2.500 ms
scaled 10.00
```

Check each line.

1. The four rates add to $0.011 + 0.013 + 0.009 + 0.015 = 0.048$, and $0.048 / 4 = 0.012\,\mathrm{rad/s}$. The `4` was never written at the call; it was deduced from the array's type.
2. `axis_name<Axis::Z>()` picks `"z"`. The enumerator is the argument.
3. A $400\,\mathrm{Hz}$ loop has a period of $1000 / 400 = 2.5\,\mathrm{ms}$. `Rate{400}` is a whole struct passed as a template argument.
4. $2.5 \times 4.0 = 10.0$.

Sanity check: every argument inside the angle brackets was a value the compiler could see while compiling — a literal, an enumerator, a struct built from a literal.
:::

Try it with a run-time value and the compiler refuses:

```cpp
std::size_t n = static_cast<std::size_t>(argc) + 2;
std::array<double, n> buf{};
```

```
error: the value of 'n' is not usable in a constant expression
note: 'std::size_t n' is not const
```

That is not a limitation to work around. It is the point. A template argument is fixed before the program runs, so everything built on it can be checked before the program runs.

::: key
A non-type template parameter is a compile-time value (an integer, an enum, a pointer, and in C++20 a structural type) used as a template argument. `Matrix<double,3,3>` is the canonical GNC use: the dimensions are part of the type, so they can be checked and unrolled.
:::

::: warning Each value is a new type
`std::array<double, 3>` and `std::array<double, 4>` are as unrelated as `int` and `std::string`. A function taking `const std::array<double, 3>&` will not accept the 4-element one, and every distinct `N` you use stamps out another copy of `mean`. That is what you want for a handful of fixed shapes. It is the wrong tool when the size really is decided at run time, such as the number of stars a star tracker happens to see this frame; that needs a `std::vector` or a `std::span`.
:::

## A matrix whose shape is its type

Now the payoff. Here is a matrix class with three template parameters: the element type `T`, the number of rows `R` and the number of columns `C`.

```cpp
template <typename T, std::size_t R, std::size_t C>
class Matrix {
public:
    T& operator()(std::size_t r, std::size_t c) { return m_[r * C + c]; }
    T operator()(std::size_t r, std::size_t c) const { return m_[r * C + c]; }
    static constexpr std::size_t rows = R;
    static constexpr std::size_t cols = C;
private:
    std::array<T, R * C> m_{};
};
```

Go through it piece by piece.

- The storage is a `std::array<T, R * C>`. A 3-by-3 matrix of doubles holds $9$ doubles, $72$ bytes, **inside the object itself**. No `new`, no heap, no pointer to somewhere else.
- `operator()` is element access: `A(1, 2)` reads "A at row 1, column 2". The element sits at index `r * C + c`, which stores the matrix **[[row by row|row-major]]**.
- There are two versions of `operator()`. The first returns a reference, so you can write into a non-`const` matrix. The second is `const`, so you can read from a `const` one.
- `rows` and `cols` are `static constexpr` members: constants that belong to the type, not to each object. `A.rows` costs nothing at run time.

`Matrix<double, 3, 3>` and `Matrix<double, 3, 1>` are different types, the way a carton of 12 and a carton of 6 are different products.

### Multiplication that checks its own shapes

You multiply an $R \times K$ matrix by a $K \times C$ matrix to get an $R \times C$ matrix. Read $R \times K$ as "R by K". The rule every student of linear algebra learns is that the inner numbers — the $K$s — must match: each entry of the result is a sum of $K$ products, pairing row $i$ of the left matrix with column $j$ of the right one:

$$
(AB)_{ij} = \sum_{k=0}^{K-1} A_{ik} B_{kj}.
$$

Now write that rule into the operator's signature:

```cpp
template <typename T, std::size_t R, std::size_t K, std::size_t C>
Matrix<T, R, C> operator*(const Matrix<T, R, K>& a, const Matrix<T, K, C>& b) {
    Matrix<T, R, C> out;
    for (std::size_t i = 0; i < R; ++i)
        for (std::size_t j = 0; j < C; ++j) {
            T s{};
            for (std::size_t k = 0; k < K; ++k) s += a(i, k) * b(k, j);
            out(i, j) = s;
        }
    return out;
}
```

The trick is one letter. `K` appears **twice**: as the column count of `a` and as the row count of `b`. When you write `A * B`, the compiler deduces the template parameters from both arguments, exactly as `clamp_to` did last lesson. `A`'s type votes for a value of `K`; `B`'s type votes for a value of `K`. If the votes agree, the function exists, and its return type `Matrix<T, R, C>` has the right shape automatically. If they disagree, deduction fails, there is no `operator*` for that pair, and the program does not compile. There is no run-time check inside the function, because by the time it runs, the shapes are already known to be right.

`T s{}` — read "T `s`, value-initialized" — starts the sum at zero for any arithmetic `T`.

::: example Rotating a body vector, and a product that cannot compile
A spacecraft measures a vector in its own **body frame** and needs it in the navigation frame. A **[[rotation matrix|dcm]]** does that. Here the body is turned $90^\circ$ about the $z$ axis.

```cpp fragment
#include <array>
#include <cstddef>
#include <cstdio>

// Matrix and operator* exactly as above

int main() {
    Matrix<double, 3, 3> C_nb;        // body-to-navigation rotation: 90 degrees about z
    C_nb(0, 1) = -1.0;
    C_nb(1, 0) =  1.0;
    C_nb(2, 2) =  1.0;

    Matrix<double, 3, 1> v_b;         // a vector measured in the body frame
    v_b(0, 0) = 1.0; v_b(1, 0) = 2.0; v_b(2, 0) = 3.0;

    const auto v_n = C_nb * v_b;      // R = 3, K = 3, C = 1: a Matrix<double, 3, 1>
    std::printf("%zux%zu: %.1f %.1f %.1f (%zu bytes)\n",
                v_n.rows, v_n.cols, v_n(0, 0), v_n(1, 0), v_n(2, 0), sizeof(v_n));

    // Matrix<double, 4, 1> q;        // a quaternion is 4x1
    // const auto oops = C_nb * q;    // inner dimensions 3 and 4
}
```

It prints:

```
3x1: -2.0 1.0 3.0 (24 bytes)
```

Work it by hand. The matrix is

$$
C_{nb} = \begin{bmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix}, \qquad
C_{nb} \begin{bmatrix} 1 \\ 2 \\ 3 \end{bmatrix} = \begin{bmatrix} 0 \cdot 1 + (-1) \cdot 2 + 0 \cdot 3 \\ 1 \cdot 1 + 0 \cdot 2 + 0 \cdot 3 \\ 0 \cdot 1 + 0 \cdot 2 + 1 \cdot 3 \end{bmatrix} = \begin{bmatrix} -2 \\ 1 \\ 3 \end{bmatrix}.
$$

The program agrees. Deduction solved $R = 3$, $K = 3$ (both arguments agreed) and $C = 1$, so the result is a `Matrix<double, 3, 1>`: three doubles, $24$ bytes. Sanity check: turning $90^\circ$ about $z$ moves the $x$ part into $y$ and the $y$ part into $-x$, and leaves $z$ alone — exactly $(1, 2, 3) \to (-2, 1, 3)$.

Now uncomment the two lines. A quaternion is stored as $4 \times 1$, and multiplying a $3 \times 3$ by a $4 \times 1$ is meaningless. g++ 13 says:

```
error: no match for 'operator*' (operand types are 'Matrix<double, 3, 3>' and 'Matrix<double, 4, 1>')
   43 |     const auto oops = C_nb * q;    // inner dimensions 3 and 4
      |                       ~~~~ ^ ~
      |                       |      |
      |                       |      Matrix<[...],4,1>
      |                       Matrix<[...],3,3>
note: candidate: 'template<class T, long unsigned int R, long unsigned int K, long unsigned int C> Matrix<T, R, C> operator*(const Matrix<T, R, K>&, const Matrix<T, K, C>&)'
note:   template argument deduction/substitution failed:
note:   deduced conflicting values for non-type parameter 'K' ('3' and '4')
```

Read it from the bottom: the compiler tried the one candidate, deduced `K` as `3` from the left operand and `4` from the right, and gave up. clang 18 puts the same diagnosis in a one-line note: `candidate template ignored: deduced conflicting values for parameter 'K' (3 vs. 4)`. No object file is written, so nothing reaches the linker, let alone a flight computer.
:::

::: key
Because the dimensions are template parameters, an inner-dimension mismatch is no viable overload: `Matrix<double,3,3> * Matrix<double,3,1>` compiles and yields `Matrix<double,3,1>`, while a mismatched pair fails deduction of `K`. There is nothing left to check at run time, and the compiler can also fully unroll the small loops.
:::

### A friendlier message with static_assert

"Deduced conflicting values" is accurate, but you have to know what `K` is. You can trade it for a message in plain words. Give each operand its own inner dimension, `K1` and `K2`, so any two matrices match, and then check them yourself with the `static_assert` you met in the first module:

```cpp
template <typename T, std::size_t R, std::size_t K1, std::size_t K2, std::size_t C>
Matrix<T, R, C> operator*(const Matrix<T, R, K1>& a, const Matrix<T, K2, C>& b) {
    static_assert(K1 == K2, "Matrix product: columns of the left must equal rows of the right");
    // ... same loops, with K1 as the inner count ...
}
```

Now the same wrong product gives:

```
In instantiation of 'Matrix<T, R, C> operator*(...) [with T = double; long unsigned int R = 3; long unsigned int K1 = 3; long unsigned int K2 = 4; long unsigned int C = 1]':
  required from here
error: static assertion failed: Matrix product: columns of the left must equal rows of the right
note: the comparison reduces to '(3 == 4)'
```

Both versions stop the build. The difference is where. The first says "this operator does not exist for these shapes". The second says "the operator exists, and then refuses". That matters for code that asks, at compile time, whether two things can be multiplied — lesson 6's concepts ask exactly that question, and with the second version the answer is a misleading "yes". Many libraries keep the shared-`K` signature for that reason and rely on good naming, or on a concept, for readable errors.

::: warning A runtime assert is not the same safety
It is tempting to store the sizes as ordinary members and write `assert(a.cols == b.rows)`. That check runs only when that line runs, with the data it happens to have that day. A code path that no test exercised — a fault mode, an unusual mission phase — may run for the first time in flight. And a flight build often has `NDEBUG` defined, which deletes `assert` entirely, as the first module showed.
:::

::: key
A compile-time dimension error cannot reach flight. A runtime assert only fires if that path executes with that data, which may first happen in flight; a type error fails the build, on every machine, every time, at zero runtime cost.
:::

That last line is not a slogan. History has examples of software that failed in flight on a path that [[testing never exercised|ariane]].

## Why a fixed-size multiply is fast

Knowing the sizes while compiling changes what the compiler can do, in three separate ways. Compare the template with a **dynamic** matrix, whose sizes are ordinary run-time numbers:

```cpp
struct DynMatrix {
    std::size_t rows, cols;
    std::vector<double> m;
    // ...
};
```

1. **No allocation.** A `Matrix<double, 3, 3>` is 72 bytes of doubles sitting inside the object — on the stack if it is a local variable. A `DynMatrix` is 40 bytes of bookkeeping (two sizes and a vector's three pointers) whose numbers live on the heap. Every product that returns a new `DynMatrix` calls the allocator, and a flight rule set commonly [[forbids that after start-up|no-heap]] anyway.
2. **No run-time shape check.** The dynamic multiply must compare `a.cols` with `b.rows` every call and decide what to do if they differ. The template version has nothing to compare.
3. **Known loop bounds.** With `K = 3` written into the type, the innermost loop is "exactly three times". The optimizer can **[[unroll|unroll-vectorise]]** it — replace the loop with three copies of its body — and then pack independent multiplications into single instructions that do two or four at once, which is called **vectorizing**. With bounds that are run-time numbers, it has to keep the loops as loops.

::: example Measuring it, honestly
The benchmark multiplies a batch of 1000 different 3-by-3 matrices by one fixed 3-by-3 matrix, 2000 times over — two million products per timing — and keeps the best of five runs. It times three versions: the template; a dynamic multiply that returns a freshly allocated result; and the same dynamic loops writing into a result the caller already owns, so there is no allocation.

```cpp
#include <algorithm>
#include <array>
#include <chrono>
#include <cstddef>
#include <cstdio>
#include <stdexcept>
#include <vector>

// Fixed size: the dimensions are part of the type.
template <typename T, std::size_t R, std::size_t C>
struct Matrix {
    std::array<T, R * C> m{};
    T& operator()(std::size_t r, std::size_t c) { return m[r * C + c]; }
    T operator()(std::size_t r, std::size_t c) const { return m[r * C + c]; }
};

template <typename T, std::size_t R, std::size_t K, std::size_t C>
Matrix<T, R, C> operator*(const Matrix<T, R, K>& a, const Matrix<T, K, C>& b) {
    Matrix<T, R, C> out;
    for (std::size_t i = 0; i < R; ++i)
        for (std::size_t j = 0; j < C; ++j) {
            T s{};
            for (std::size_t k = 0; k < K; ++k) s += a(i, k) * b(k, j);
            out(i, j) = s;
        }
    return out;
}

// Dynamic size: the dimensions are run-time numbers.
struct DynMatrix {
    std::size_t rows, cols;
    std::vector<double> m;
    DynMatrix(std::size_t r, std::size_t c) : rows(r), cols(c), m(r * c, 0.0) {}
    double& operator()(std::size_t r, std::size_t c) { return m[r * cols + c]; }
    double operator()(std::size_t r, std::size_t c) const { return m[r * cols + c]; }
};

void multiply_into(DynMatrix& out, const DynMatrix& a, const DynMatrix& b) {
    if (a.cols != b.rows || out.rows != a.rows || out.cols != b.cols)
        throw std::invalid_argument("shape mismatch");            // run-time check
    for (std::size_t i = 0; i < a.rows; ++i)
        for (std::size_t j = 0; j < b.cols; ++j) {
            double s = 0.0;
            for (std::size_t k = 0; k < a.cols; ++k) s += a(i, k) * b(k, j);
            out(i, j) = s;
        }
}

DynMatrix operator*(const DynMatrix& a, const DynMatrix& b) {
    DynMatrix out(a.rows, b.cols);                                 // heap allocation
    multiply_into(out, a, b);
    return out;
}

int main() {
    constexpr std::size_t M = 1000;      // a batch of 1000 matrices
    constexpr int PASSES = 2000;         // 2 million multiplies per timing
    using clk = std::chrono::steady_clock;

    std::vector<Matrix<double, 3, 3>> fa(M), fo(M);
    std::vector<DynMatrix> da(M, DynMatrix(3, 3)), dout(M, DynMatrix(3, 3));
    Matrix<double, 3, 3> fb;
    DynMatrix db(3, 3);
    for (std::size_t n = 0; n < M; ++n)
        for (std::size_t i = 0; i < 3; ++i)
            for (std::size_t j = 0; j < 3; ++j)
                fa[n](i, j) = da[n](i, j) = 0.001 * double(n) + double(i) - 0.5 * double(j);
    for (std::size_t i = 0; i < 3; ++i)
        for (std::size_t j = 0; j < 3; ++j) fb(i, j) = db(i, j) = 0.1 * double(i + 2 * j);

    auto time_it = [&](auto&& body) {              // best of 5, in ns per multiply
        double best = 1e30;
        for (int rep = 0; rep < 5; ++rep) {
            const auto t0 = clk::now();
            for (int p = 0; p < PASSES; ++p) body();
            const auto t1 = clk::now();
            best = std::min(best, std::chrono::duration<double, std::nano>(t1 - t0).count() / (double(M) * PASSES));
        }
        return best;
    };

    const double t_fixed = time_it([&] { for (std::size_t n = 0; n < M; ++n) fo[n] = fa[n] * fb; });
    const double t_alloc = time_it([&] { for (std::size_t n = 0; n < M; ++n) dout[n] = da[n] * db; });
    const double t_into  = time_it([&] { for (std::size_t n = 0; n < M; ++n) multiply_into(dout[n], da[n], db); });

    double sf = 0, sd = 0;
    for (std::size_t n = 0; n < M; ++n) { sf += fo[n](2, 2); sd += dout[n](2, 2); }
    std::printf("fixed Matrix<double,3,3>       %5.1f ns\n", t_fixed);
    std::printf("dynamic, allocates its result  %5.1f ns\n", t_alloc);
    std::printf("dynamic, result passed in      %5.1f ns\n", t_into);
    std::printf("sizes %zu and %zu bytes; checksums %.3f %.3f\n",
                sizeof(Matrix<double, 3, 3>), sizeof(DynMatrix), sf, sd);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O3`, on one machine (an Intel Xeon at 2.1 GHz) it printed:

```
fixed Matrix<double,3,3>         4.3 ns
dynamic, allocates its result   29.8 ns
dynamic, result passed in       18.4 ns
sizes 72 and 40 bytes; checksums 2899.250 2899.250
```

Read the three lines as a story.

1. Taking the allocation away (line 2 to line 3) saved about $29.8 - 18.4 = 11.4\,\mathrm{ns}$ per product. That is the cost of asking the heap for 72 bytes and giving them back.
2. Knowing the sizes (line 3 to line 1) saved another $18.4 - 4.3 = 14.1\,\mathrm{ns}$. That is unrolling and vectorizing. Looking at the machine code g++ produced for the 3-by-3 product shows it: no loops at all, and the 27 multiplications done as 12 two-at-a-time instructions plus 3 single ones, $12 \times 2 + 3 = 27$.
3. Overall the fixed version is about $29.8 / 4.3 \approx 6.9$ times faster than the naive dynamic one.

The checksums match, so all versions computed the same numbers.

Now the honest part. The same program built with `-O2` instead of `-O3` gave about 27 ns for the fixed version — slower than the dynamic one with no allocation. g++ 13 at `-O2` left the three loops as loops, so the known sizes bought nothing. clang 18 at `-O2` did unroll, and gave about 4 ns. The fixed size makes the fast code *possible*; the optimizer still has to write it. So measure with the compiler and flags you will fly, and treat these numbers as one machine's, which will vary on yours.
:::

That is exactly why fixed-size types are the default for small matrices in flight code, and why [[Eigen, the matrix library|eigen]] behind many GNC projects offers `Matrix3d` alongside its dynamic `MatrixXd`.

::: key
A fixed-size `Matrix<double,3,3>` multiply beats a dynamically sized one because the sizes are compile-time constants: the storage sits in the object (no heap allocation), there is no run-time size check, and the loops can be unrolled and vectorized.
:::

## Check yourself

::: check
Which of these compile, and why? (a) `std::array<float, 2 * 3> a;` (b) `constexpr int n = 5; std::array<int, n> b;` (c) `int n = read_config(); std::array<int, n> c;` (d) `template <double G> double f();` called as `f<9.80665>()`, built as C++17.
:::

::: answer
(a) compiles: `2 * 3` is a constant expression, so the type is `std::array<float, 6>`.

(b) compiles: a `constexpr` variable is a constant expression.

(c) does not: `n` comes from a function run while the program runs, so it is "not usable in a constant expression".

(d) does not in C++17: floating-point non-type template parameters were added in C++20. Built as C++20, it compiles.
:::

::: check
With the shared-`K` `operator*`, what is the type of `A * B * v` if `A` is `Matrix<double, 6, 3>`, `B` is `Matrix<double, 3, 3>` and `v` is `Matrix<double, 3, 1>`? Now swap to `B * A * v`. Which line is the compile error, and why?
:::

::: answer
The `*` operator groups from the left, so `A * B * v` is `(A * B) * v`. First `A * B`: $R = 6$, $K = 3$ from both, $C = 3$, giving `Matrix<double, 6, 3>`. Then that times `v`: $K = 3$ from both, giving `Matrix<double, 6, 1>`.

`B * A * v` is `(B * A) * v`. `B` is $3 \times 3$, so it votes $K = 3$; `A` is $6 \times 3$, so it votes $K = 6$. Deduction fails and there is no matching `operator*` — the build stops at `B * A`, before `v` is even considered.
:::

::: check
Your teammate says, "The shape check and the runtime assert are equivalent — both stop a bad multiply." Give two situations where the runtime assert lets the bad multiply through.
:::

::: answer
First, a release build with `NDEBUG` defined: `assert` is removed completely, so the multiply runs with the wrong shapes and reads past the data.

Second, a code path the tests never reached — for example, a safe-mode branch that multiplies with a differently sized matrix. The assert is there, but it only fires if that path runs with those shapes, and the first time might be in flight.

The template version has neither gap: a wrong shape anywhere in the program, on any path, fails the build on every machine.
:::

::: check
Explain in your own words why the dynamic multiply that writes into a caller-owned result was still about four times slower than the template in the `-O3` measurement, even though neither allocates.
:::

::: answer
Both do the same 27 multiplications and the additions that sum them. The difference is what the compiler knew. In `multiply_into`, the loop counts are `a.rows`, `b.cols` and `a.cols` — numbers read from memory while running — so the compiler must keep three real loops, with counters, comparisons and jumps, and do one multiplication at a time. It must also check the shapes on every call.

In the template, the loop counts are the constants $3$, $3$ and $3$. The compiler removed the loops entirely and used instructions that multiply two doubles at once. Less bookkeeping and more work per instruction made it about $18.4 / 4.3 \approx 4.3$ times faster.
:::

::: check
Write the declaration of a function `trace` that takes any square `Matrix<T, N, N>` and returns the sum of its diagonal. What happens if someone calls it with a `Matrix<double, 3, 4>`?
:::

::: answer
```cpp
template <typename T, std::size_t N>
T trace(const Matrix<T, N, N>& a);
```

`N` appears twice in the parameter type, so both the row count and the column count must deduce the same value. For a `Matrix<double, 3, 4>`, the rows vote $N = 3$ and the columns vote $N = 4$, deduction fails, and there is no matching `trace` — a non-square matrix is rejected at compile time, by the same one-letter trick as `operator*`.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| non-type template parameter | a value in the angle brackets | integer, enum, pointer or reference; C++20 adds floating-point and structural types |
| constant expression | a value known while compiling | literals, `constexpr` variables, `sizeof`; not run-time input |
| each value, a new type | `std::array<double, 3>` vs `<double, 4>` | unrelated types; one instantiation per value |
| `Matrix<T, R, C>` | shape in the type | storage `std::array<T, R*C>` inside the object; row-major index `r*C + c` |
| shared `K` in `operator*` | `(R×K)·(K×C) → R×C` | mismatch means deduction of `K` fails: no viable `operator*` |
| `static_assert` version | separate `K1`, `K2`, then check | readable message; but the operator then "exists" for every pair |
| compile-time vs runtime check | build fails vs maybe fires | a type error cannot reach flight |
| fixed-size speed | no heap, no shape check, known loop bounds | unrolled and vectorized — when the optimizer does it; measure |

The next lesson lets a template take not one or two parameters but any number of them. That is how `std::tuple` holds any mix of types and how one telemetry logger can accept any list of fields.

::: context size-t The type for sizes
`std::size_t` is an unsigned integer type big enough to hold the size of any object; `sizeof` gives one, and so does `.size()` on every standard container. On a 64-bit Linux machine it is the same type as `unsigned long`, which is why g++'s error messages spell a `std::size_t` parameter as `long unsigned int`. It is unsigned, so it can never be negative: `N - 1` with `N = 0` wraps around to a huge number instead of $-1$, a slip the first module's lesson on conversions warned about.
:::

::: context structural Which classes can be template arguments
C++20 allows a class-type value as a template argument if the class is a **structural type**. The rules: every base class and non-static data member is public and not `mutable`, and each member is itself structural — an integer, enum, pointer, reference, floating-point value, or another structural class, or an array of these. Two such values are the same argument when every member is the same. A `std::string` does not qualify: it has private members that point into the heap.
:::

::: context constant-expression Known before the program runs
A constant expression is one the compiler is required to be able to evaluate while compiling. The first module's lesson on `constexpr` introduced them: literals, `constexpr` variables, `sizeof`, and calls to `constexpr` functions with constant arguments. Template arguments, array bounds and `static_assert` conditions all demand one. Lesson 7 of this module turns this into a tool, computing whole lookup tables at compile time.
:::

::: context row-major Laying a grid out in a line
Memory is one long row of bytes, so a two-dimensional matrix has to be flattened. Row-major order stores all of row 0, then all of row 1, and so on; element $(r, c)$ of a matrix with $C$ columns sits at index $rC + c$. C and C++ arrays use row-major order. Fortran, MATLAB and Eigen's default use column-major order instead, so check which one a library expects before copying raw data into it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">2 × 3 matrix</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="24" width="34" height="30" fill="#8fb8f0"/><rect x="44" y="24" width="34" height="30" fill="#8fb8f0"/><rect x="78" y="24" width="34" height="30" fill="#8fb8f0"/>
    <rect x="10" y="54" width="34" height="30" fill="#f2b880"/><rect x="44" y="54" width="34" height="30" fill="#f2b880"/><rect x="78" y="54" width="34" height="30" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="27" y="43">0,0</text><text x="61" y="43">0,1</text><text x="95" y="43">0,2</text>
    <text x="27" y="73">1,0</text><text x="61" y="73">1,1</text><text x="95" y="73">1,2</text>
  </g>
  <text x="180" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">in memory: index = r × 3 + c</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="75" y="120" width="35" height="30" fill="#8fb8f0"/><rect x="110" y="120" width="35" height="30" fill="#8fb8f0"/><rect x="145" y="120" width="35" height="30" fill="#8fb8f0"/>
    <rect x="180" y="120" width="35" height="30" fill="#f2b880"/><rect x="215" y="120" width="35" height="30" fill="#f2b880"/><rect x="250" y="120" width="35" height="30" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="92" y="139">0,0</text><text x="127" y="139">0,1</text><text x="162" y="139">0,2</text>
    <text x="197" y="139">1,0</text><text x="232" y="139">1,1</text><text x="267" y="139">1,2</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="92" y="164">0</text><text x="127" y="164">1</text><text x="162" y="164">2</text>
    <text x="197" y="164">3</text><text x="232" y="164">4</text><text x="267" y="164">5</text>
  </g>
</svg>
```
:::

::: context dcm Reading the name C_nb
A rotation matrix that converts a vector's components from one frame to another is often called a **direction cosine matrix**, because each entry is the cosine of the angle between an axis of one frame and an axis of the other. A common naming habit writes $C_{nb}$ for the matrix that takes body-frame components to navigation-frame components, so $v_n = C_{nb} v_b$ reads correctly from right to left. Conventions differ between teams and textbooks, which is one more reason to put frames in names. The attitude modules later in the course build these matrices properly.
:::

::: context ariane A path that had never run in flight
On 4 June 1996, the first Ariane 5 broke up about 37 seconds after lift-off. The inquiry board traced it to inertial-reference software reused from Ariane 4: converting a 64-bit floating-point value to a 16-bit signed integer overflowed, because Ariane 5's faster trajectory produced values Ariane 4's never had. The conversion was left unprotected in that spot because the value had been judged unable to get that large. It was not a matrix-shape bug, but it is the pattern this lesson guards against: a failure waiting on a path, with data that only flight provided.
:::

::: context no-heap Why flight code avoids the heap
Gerard Holzmann's "Power of Ten" rules for safety-critical code, written at NASA's Jet Propulsion Laboratory, include: do not use dynamic memory allocation after initialization. The heap's timing is hard to bound, it can fragment until a request fails, and every allocation is a chance for a leak or a use-after-free. Many aerospace coding standards carry a similar rule. A `Matrix<double, 3, 3>` meets it without effort, because its storage is part of the object.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">Matrix&lt;double,3,3&gt;: 72 bytes, all in the object</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="24" width="36" height="26"/><rect x="46" y="24" width="36" height="26"/><rect x="82" y="24" width="36" height="26"/>
    <rect x="118" y="24" width="36" height="26"/><rect x="154" y="24" width="36" height="26"/><rect x="190" y="24" width="36" height="26"/>
    <rect x="226" y="24" width="36" height="26"/><rect x="262" y="24" width="36" height="26"/><rect x="298" y="24" width="36" height="26"/>
  </g>
  <text x="10" y="76" font-size="12" fill="#1f2a44">DynMatrix(3,3): 40 bytes here ...</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="10" y="84" width="50" height="26"/><rect x="60" y="84" width="50" height="26"/>
    <rect x="110" y="84" width="50" height="26"/><rect x="160" y="84" width="50" height="26"/><rect x="210" y="84" width="50" height="26"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="35" y="101">rows</text><text x="85" y="101">cols</text><text x="135" y="101">begin</text><text x="185" y="101">end</text><text x="235" y="101">cap</text>
  </g>
  <line x1="135" y1="110" x2="135" y2="136" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="135,142 130,132 140,132" fill="#b4232c"/>
  <rect x="100" y="142" width="170" height="24" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="185" y="158" font-size="11" text-anchor="middle" fill="#b4232c">... 72 bytes on the heap</text>
</svg>
```
:::

::: context unroll-vectorise Unrolling and vectorizing, drawn
Unrolling replaces "do this three times" with the three copies written out, so there is no counter, no comparison and no jump. Vectorizing then notices independent multiplications and does them in one instruction on a wide register. An SSE2 register holds two doubles, so one `mulpd` instruction multiplies two pairs at once; newer AVX registers hold four.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">scalar: one product per instruction</text>
  <rect x="10" y="26" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="44" font-size="12" text-anchor="middle" fill="#1f2a44">a × b</text>
  <text x="100" y="44" font-size="12" fill="#6c7a93">mulsd</text>
  <text x="10" y="80" font-size="12" fill="#1f2a44">vector: two products per instruction</text>
  <rect x="10" y="88" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="88" width="70" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">a0 × b0</text>
  <text x="115" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">a1 × b1</text>
  <text x="170" y="106" font-size="12" fill="#6c7a93">mulpd (one 128-bit register)</text>
</svg>
```
:::

::: context eigen Fixed and dynamic in one library
Eigen is a free C++ template library for linear algebra, widely used in robotics and GNC work. `Eigen::Matrix3d` is shorthand for `Eigen::Matrix<double, 3, 3>`, with its storage inside the object; `Eigen::MatrixXd` has its sizes chosen at run time and its numbers on the heap. Eigen's own documentation advises fixed sizes for small matrices where the size is known. Lesson 9 shows Eigen's other trick, expression templates, which remove the temporary matrices from a long formula.
:::
