---
id: l09-operator-overloading
title: Operator overloading
minutes: 22
covers:
  - "Operator overloading: arithmetic, comparison and the spaceship operator, subscript, call, stream"
---

The word "plus" means different things in different places. Two dollars plus three dollars is five dollars. A walk of 3 m east plus a walk of 4 m north is not "7 m" — it is an arrow that ends 5 m away, pointing north-east. You add arrows head to tail. Same word, different rule, and nobody is confused, because the kind of thing being added tells you which rule to use.

C++ lets you do the same for your own types. When a GNC engineer writes `r_new = r + v * dt`, the `r` and `v` are 3-D vectors, not numbers. With **operator overloading** — giving an operator like `+` a meaning for a type you wrote — that line compiles and does the vector arithmetic. Without it, you would write `add(r, scale(v, dt))`, and every navigation equation would turn into a thicket of function calls that no longer looks like the maths it came from.

This lesson finishes the toolkit for exercise `cpp03_ex2`: a `Matrix3` and a `Vector3` with `+`, `-` and `*`, a transpose and a determinant, comparison, element access and printing. By the end you will run the exercise's own check: a 90° rotation times its transpose is the identity. Lessons 07 and 08 gave you the pieces this needs — the rule of zero, `const` member functions and `friend`.

## An operator is a function with a special name

When the compiler sees `a + b` and `a` or `b` has a class type, it looks for a function named `operator+`, read "operator plus". It tries two spellings:

- a **member** function of `a`'s class: `a.operator+(b)`;
- a **free** (non-member) function: `operator+(a, b)`.

Whichever one fits is called. That is all operator overloading is: a normal function, found by a special name, called with a nicer syntax.

A few rules keep this from turning into chaos:

1. You cannot invent new operators. There is no `operator**` for powers.
2. You cannot change how many operands an operator takes, or its **precedence** — `*` still binds tighter than `+`, whatever the types.
3. At least one operand must be a class or enum type. You cannot redefine `+` for two `int`s.
4. A handful cannot be overloaded at all: `.` (member access), `::` (scope), `?:` (the conditional), `.*`, and `sizeof`.

And one rule that is not in the standard but matters more than all of them: **make it behave like the built-in version.** `+` should add, and not change its operands. `==` should be true when two things are equal. A reader who sees `a + b` should never need to look up what it does. This is the **[[principle of least surprise|least-surprise]]**.

::: warning Leave &&, || and the comma alone
The built-in `&&` stops early: in `p != nullptr && p->ok()`, the right side is never evaluated when the left is false. An overloaded `operator&&` is an ordinary function, so both arguments are evaluated before it is called — the short-circuit is gone. The same happens to `||`. Overloading them (or the comma operator) silently changes the meaning of code that looks familiar. Do not.
:::

## Arithmetic, and why symmetry decides member or free

Start with a `Vector3` that holds three `double`s in a `std::array` — the rule of zero again.

The first operators to write are the **compound assignments** `+=` and `-=`. They change the left operand, so they are members, and they return `*this` by reference, like the built-in `x += 1` does:

```cpp
Vector3& operator+=(const Vector3& b) {
    for (int i = 0; i < 3; ++i) v_[i] += b.v_[i];
    return *this;
}
```

Then build `+` out of `+=`. Plain `+` must *not* change either operand, so it returns a new vector **by value**:

```cpp
friend Vector3 operator+(Vector3 a, const Vector3& b) { return a += b; }
```

Read the trick slowly. The parameter `a` is taken by value, so it is already a copy of the left operand. The function adds `b` into that copy and returns it. The caller's vectors are untouched, and the real addition code lives in one place, `+=`.

Why is `operator+` a free function (a hidden `friend`, from lesson 08) and not a member? Because of **symmetry**. Scaling a vector by a number should work both ways round: `v * 2.0` and `2.0 * v`. Try it with a member:

```cpp error
struct V { double x; V operator*(double s) const { return {x * s}; } };
int main() { V v{1.0}; V a = v * 2.0; V b = 2.0 * v; (void)a; (void)b; }
```

```text
cod_cpp_03_raii_09_sym.cpp:2:49: error: no match for 'operator*' (operand types are 'double' and 'V')
```

`v * 2.0` works: it means `v.operator*(2.0)`. But `2.0 * v` would have to mean `2.0.operator*(v)`, and a `double` has no members. A member operator always puts *your* object on the left. So the rule of thumb:

- **Member**: operators that change the left operand (`+=`, `-=`, `=`), and the ones the language requires to be members — `=`, `[]`, `()` and `->`.
- **Free** (usually a hidden friend): symmetric binary operators like `+`, `-`, `*`, `==`, and any operator whose left operand is not your type, like `<<` with a stream.

For scaling, write both orders:

```cpp
friend Vector3 operator*(double s, const Vector3& a) { return {s * a[0], s * a[1], s * a[2]}; }
friend Vector3 operator*(const Vector3& a, double s) { return s * a; }
friend Vector3 operator-(const Vector3& a) { return {-a[0], -a[1], -a[2]}; }
```

The last one is **unary minus** — one operand, as in `-v` — which flips the arrow.

::: key Member or free
A member operator always has your object on the left. Operators that modify their left operand (`+=`, `=`) are members and return `*this` by reference; symmetric operators (`+`, `-`, `*`, `==`) are free functions, often hidden friends, and return a new value, so that `2.0 * v` and `v * 2.0` both work.
:::

## Matrix3: everything the exercise needs

The matrix follows the same pattern, using `std::array<double, 9>` in row-major order as in lesson 07, and `operator()(int r, int c)` for element access (more on that below). Addition and subtraction go element by element:

```cpp
friend Matrix3 operator+(const Matrix3& a, const Matrix3& b) {
    Matrix3 out;
    for (int i = 0; i < 9; ++i) out.m_[i] = a.m_[i] + b.m_[i];
    return out;
}
```

`operator-` is the same with `-`. Multiplication is where matrices differ from numbers. To get the entry in row $i$, column $j$ of $\mathbf{A}\mathbf{B}$, walk along row $i$ of $\mathbf{A}$ and down column $j$ of $\mathbf{B}$, multiply pairs and add:

$$
(\mathbf{A}\mathbf{B})_{ij} = \sum_{k=0}^{2} A_{ik} B_{kj}
$$

Read it "A B, entry i j, is the sum over k of A i k times B k j". In code, two overloads of `*` — same name, different right operand:

```cpp
friend Matrix3 operator*(const Matrix3& a, const Matrix3& b) {   // matrix-matrix
    Matrix3 out;
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j) {
            double sum = 0.0;
            for (int k = 0; k < 3; ++k) sum += a(i, k) * b(k, j);
            out(i, j) = sum;
        }
    return out;
}
friend Vector3 operator*(const Matrix3& a, const Vector3& v) {   // matrix-vector
    Vector3 out;
    for (int i = 0; i < 3; ++i)
        out[i] = a(i, 0) * v[0] + a(i, 1) * v[1] + a(i, 2) * v[2];
    return out;
}
```

The compiler picks the right one from the type of the right operand, exactly like any overloaded function. There is deliberately no `Vector3 * Matrix3`: that is not how column vectors multiply, and leaving it out turns a maths mistake into a compile error.

`transpose()` and `determinant()` are not operators, just `const` member functions. The **transpose** $\mathbf{A}^T$ ("A transpose") swaps rows and columns: `t(j, i) = a(i, j)`. The **determinant** of a 3×3 matrix, expanded along the top row, is

$$
\det \mathbf{A} = A_{00}(A_{11}A_{22} - A_{12}A_{21}) - A_{01}(A_{10}A_{22} - A_{12}A_{20}) + A_{02}(A_{10}A_{21} - A_{11}A_{20})
$$

which becomes one `return` statement using `a(0,0)`, `a(1,1)` and so on. For a rotation matrix it is always $1$.

::: example A 90° rotation times its transpose
The complete program is the class above plus a `Vector3`, a `static` `identity()`, a `static` `rot_z(angle)` and a stream operator (all shown in this lesson). `rot_z` builds the matrix used in the exercise:

$$
\mathbf{R}_z(\theta) = \begin{pmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{pmatrix}
$$

This is the **[[frame-rotation|frame-rotation]]** form: it re-expresses a vector in a set of axes turned by $\theta$ about $z$. The test:

```cpp fragment
int main() {
    const double pi = 3.141592653589793;
    const Matrix3 R = Matrix3::rot_z(pi / 2);             // 90 degrees about z
    const Matrix3 P = R * R.transpose();

    std::cout << "R =\n" << R;
    std::cout << "R * R^T =\n" << P;

    const Matrix3 E = P - Matrix3::identity();            // error matrix
    double worst = 0.0;
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j) worst = std::fmax(worst, std::fabs(E(i, j)));
    std::printf("largest |R R^T - I| entry = %.3e  (below 1e-15: %s)\n",
                worst, worst < 1e-15 ? "yes" : "no");
    std::printf("det(R) = %.15f\n", R.determinant());

    const Vector3 x_old{1.0, 0.0, 0.0};
    std::cout << "R * (1, 0, 0) = " << R * x_old << '\n';
    std::cout << "2 * (1, 2, 3) - (0, 0, 1) = " << 2.0 * Vector3{1, 2, 3} - Vector3{0, 0, 1} << '\n';
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
R =
[ 6.12323e-17  1  0 ]
[ -1  6.12323e-17  0 ]
[ 0  0  1 ]
R * R^T =
[ 1  0  0 ]
[ 0  1  0 ]
[ 0  0  1 ]
largest |R R^T - I| entry = 0.000e+00  (below 1e-15: yes)
det(R) = 1.000000000000000
R * (1, 0, 0) = (6.12323e-17, -1, 0)
2 * (1, 2, 3) - (0, 0, 1) = (2, 4, 5)
```

Step by step:

1. **The matrix.** $\cos 90° = 0$ and $\sin 90° = 1$, so $\mathbf{R}$ should have $0$ on the first two diagonal places. It shows $6.12 \times 10^{-17}$ instead. That is not a bug in our code: `pi / 2` is not exactly $\pi/2$ in a `double`, so its cosine is a **[[tiny number, not zero|cos-roundoff]]**.
2. **The product.** Entry $(0,0)$ of $\mathbf{R}\mathbf{R}^T$ is row 0 of $\mathbf{R}$ times row 0 of $\mathbf{R}$ (because column 0 of $\mathbf{R}^T$ *is* row 0 of $\mathbf{R}$): $c^2 + s^2 + 0$. With $c = 6.12 \times 10^{-17}$, $c^2 \approx 3.7 \times 10^{-33}$, far too small to change $1$ in a `double`, so the sum rounds to exactly $1$. Entry $(0,1)$ is row 0 times row 1: $c \cdot (-s) + s \cdot c = 0$ exactly, because the two products are equal and opposite.
3. **The check.** The largest entry of $\mathbf{R}\mathbf{R}^T - \mathbf{I}$ is $0$, below the exercise's $10^{-15}$ limit. Here it even came out exact; for other angles expect errors around $10^{-16}$, which is why the test uses a tolerance and not `==`.
4. **The determinant.** Expanding along the top row: $c(c \cdot 1 - 0) - s(-s \cdot 1 - 0) + 0 = c^2 + s^2 = 1$.
5. **Matrix times vector.** The old $x$ axis, written in the new axes, is $(0, -1, 0)$: the axes turned $+90°$, so the old $x$ now points along the new $-y$.
6. **Chained arithmetic.** $2 \cdot (1, 2, 3) = (2, 4, 6)$, then minus $(0, 0, 1)$ gives $(2, 4, 5)$. Precedence worked as for numbers: `*` before `-`.

Sanity check: a rotation keeps lengths and right angles, which is exactly what $\mathbf{R}\mathbf{R}^T = \mathbf{I}$ says (an **[[orthonormal|orthonormal]]** matrix), and a rotation does not flip space inside out, which is what $\det \mathbf{R} = 1$ says. Both came out right.
:::

::: note Each * makes a temporary
`A * B * C` computes `A * B` into a temporary `Matrix3`, then multiplies that by `C`. For a 72-byte by-value matrix those temporaries live on the stack and cost nothing to allocate — one more reason lesson 07 chose by-value storage. For large matrices, libraries such as Eigen use **[[expression templates|expression-templates]]** to avoid the temporaries entirely.
:::

## Comparison and the spaceship operator

Comparing things used to take six hand-written operators: `==`, `!=`, `<`, `<=`, `>`, `>=`. C++20 cut that to one or two.

The new one is `operator<=>`, the **three-way comparison** operator, nicknamed **[[the spaceship operator|spaceship-name]]** for its shape. Read `a <=> b` as "a spaceship b". Instead of answering yes or no, it answers *which way*: less, equal, or greater. Its result can itself be compared with zero: `(a <=> b) < 0` means "a is less than b".

The big win is `= default`:

```cpp
struct TimeTag {
    std::uint32_t seconds;
    std::uint16_t subseconds;          // units of 1/65536 s

    auto operator<=>(const TimeTag&) const = default;   // also gives ==
};
```

(It needs `<compare>` and `<cstdint>`.) That one line does a lot:

1. The compiler writes `<=>` by comparing members **in declaration order**: first `seconds`; only if those are equal, `subseconds`. This is **[[lexicographic order|lexicographic]]**, the way a dictionary orders words.
2. A defaulted `<=>` also declares a defaulted `==`, which compares every member for equality.
3. The compiler **rewrites** the other four relational operators in terms of `<=>`: `a < b` becomes `(a <=> b) < 0`. And `a != b` is rewritten as `!(a == b)`. So `<`, `<=`, `>`, `>=`, `==`, `!=` all work.

The result's type says what kind of ordering it is:

- **`std::strong_ordering`**: equal means truly interchangeable, and any two values compare. Integers give this, so `TimeTag` gets it.
- **`std::weak_ordering`**: any two values compare, but "equivalent" values may still differ — say, names compared ignoring upper and lower case.
- **`std::partial_ordering`**: some pairs cannot be compared at all. `double` gives this, because of **[[NaN|nan]]**, the "not a number" value, which is neither less than, equal to, nor greater than anything.

A defaulted `<=>` picks the weakest category among its members, so a struct with a `double` member gets `std::partial_ordering`.

::: example Sorting telemetry by time tag
Packets arrive out of order and must be sorted by their time tag. With the `TimeTag` above:

```cpp fragment
int main() {
    std::vector<TimeTag> packets = {
        {1000, 30000}, {999, 65000}, {1000, 12}, {1000, 30000}};

    std::sort(packets.begin(), packets.end());          // uses <
    for (const TimeTag& t : packets)
        std::printf("%u + %5u/65536 s\n", t.seconds, t.subseconds);

    const TimeTag a{1000, 12}, b{999, 65000};
    std::printf("a < b: %d   a > b: %d   a == b: %d   a != b: %d\n",
                a < b, a > b, a == b, a != b);
    std::printf("(a <=> b) > 0: %d\n", (a <=> b) > 0);
    std::printf("packets[2] == packets[3]: %d\n", packets[2] == packets[3]);
}
```

Output:

```text
999 + 65000/65536 s
1000 +    12/65536 s
1000 + 30000/65536 s
1000 + 30000/65536 s
a < b: 0   a > b: 1   a == b: 0   a != b: 1
(a <=> b) > 0: 1
packets[2] == packets[3]: 1
```

Walk through it:

1. `std::sort` only needs `<`, and the rewritten `<` came from the defaulted spaceship.
2. `{999, 65000}` sorts first, even though its `subseconds` is the biggest. `seconds` is declared first, so it is compared first: $999 < 1000$ settles it.
3. Among the three with $1000$ seconds, `subseconds` breaks the tie: $12 < 30000$. The two identical tags end up side by side, and `==` says they are equal.
4. For `a` and `b`: `a` is later, so `a > b` is `1` (true) and `a < b` is `0`. `!=` works though we never wrote it.

Sanity check in seconds: `b` is $999 + 65000/65536 \approx 999.992$ s and `a` is $1000 + 12/65536 \approx 1000.0002$ s. So `a` really is later, by about $0.008$ s. The member order made the comparison match real time — which only works because the coarse field is declared first. Swap the two declarations and the sort is silently wrong.
:::

::: key The spaceship operator
`auto operator<=>(const T&) const = default;` compares members in declaration order and also gives a defaulted `==`; the compiler rewrites `<`, `<=`, `>`, `>=` in terms of `<=>` and `!=` in terms of `==`. The result is `std::strong_ordering`, `std::weak_ordering` or `std::partial_ordering` (any `double` member makes it partial).
:::

::: warning Not every type should be ordered, and floats rarely compare equal
There is no sensible "less than" for 3-D vectors — is east less than north? — so do not give `Vector3` or `Matrix3` a `<=>`. Even `==` is risky for them: after a few operations, two matrices that should be equal differ by $10^{-16}$, and `==` says no. Write a named function like `approx_equal(a, b, tol)`, as the rotation check did with its $10^{-15}$ tolerance.
:::

## Subscript and call: getting at the elements

The **subscript operator** `operator[]` is what makes `v[1]` work. It must be a member, and it almost always comes in a pair — lesson 08's overload on `const`:

```cpp
double& operator[](int i)       { return v_[i]; }   // write access
double  operator[](int i) const { return v_[i]; }   // read-only access
```

The non-`const` version returns a **reference**, `double&`, so `v[1] = 4.0` writes into the vector. The `const` version is chosen for a `const Vector3` and returns a copy, so a `const` vector cannot be changed through it. Leave out the `const` version and you cannot read an element of a `const Vector3&` at all. Leave out the non-`const` one and you cannot write. (A `const` version may also return `const double&`; for a small type like `double`, a copy is just as good.)

Like the built-in `[]`, these do no bounds checking. For a fixed 3-element vector the indices usually come from loops you can see; add an `assert` inside if you want a debug build to catch a bad index.

Before C++23, `operator[]` could take only one argument, so `m[1, 2]` was impossible. That is why the exercise's `Matrix3` uses the **call operator** for two-index access: `m(1, 2)`, read "m of 1, 2". `operator()` can take any number of arguments, and it comes in the same `const`/non-`const` pair.

The call operator has a second, bigger use: it makes an object that can be called like a function — a **function object**. Unlike a plain function, it can carry state between calls:

```cpp
// A first-order low-pass filter: y = y + alpha * (x - y).
class LowPass {
public:
    explicit LowPass(double alpha) : alpha_(alpha) {}
    double operator()(double x) {          // the call operator
        y_ += alpha_ * (x - y_);
        return y_;
    }
private:
    double alpha_;
    double y_ = 0.0;
};
```

With `LowPass filt{0.5};`, feeding in four samples of $10.0$ with `filt(x)` printed `5.0000 7.5000 8.7500 9.3750`. Each call moves the output halfway to the input: $0 \to 5 \to 7.5 \to 8.75 \to 9.375$, closing in on $10$, as a smoothing filter should. It is not `const`, because each call changes `y_` — and that change is the whole point, so `mutable` would be wrong. Pass `filt` to any code expecting "something callable with a `double`" and it works like a function. Every C++ **[[lambda|lambda]]** is a function object of exactly this kind, written for you by the compiler.

## The stream operator

The last operator makes `std::cout << m` work. You met it in lesson 08 as the classic `friend`. The conventions:

```cpp
friend std::ostream& operator<<(std::ostream& os, const Matrix3& a) {
    for (int i = 0; i < 3; ++i)
        os << "[ " << a(i, 0) << "  " << a(i, 1) << "  " << a(i, 2) << " ]\n";
    return os;
}
```

1. **Free function**, because the left operand is the stream, not your type.
2. **Take the stream by non-`const` reference** — writing changes the stream — and **your object by `const` reference**: printing must not change it, and copying 72 bytes to print is wasteful.
3. **Return the stream**, so that `std::cout << "R =\n" << R << "done\n"` chains: each `<<` returns the stream for the next.
4. **Write to `os`, never to `std::cout`**, so the same operator can print into a file or a string stream.
5. **Print only the object.** A `Vector3` should not end its output with a newline; the caller decides the layout. (A matrix spanning three lines is a judgment call — our version ends each row with `'\n'`, so it is best printed on its own lines.)

## Check yourself

::: check
You write `Vector3 operator+(const Vector3& b) const` as a member, and `Vector3 operator*(double s) const` as a member too. Which of `a + b`, `a * 3.0` and `3.0 * a` compile, and how would you fix the one that does not?
:::

::: answer
`a + b` compiles: it calls `a.operator+(b)`. `a * 3.0` compiles: `a.operator*(3.0)`. `3.0 * a` does not, because it would need a member of `double` — `3.0.operator*(a)` — and built-in types have no members; the compiler reports no match for `operator*` with operand types `double` and `Vector3`. Fix: add a free function `Vector3 operator*(double s, const Vector3& a)` (conveniently a hidden friend), and for tidiness make the other order free as well, calling the first. Keeping symmetric operators free gives both orders the same treatment.
:::

::: check
Compute, by hand, entry $(1, 0)$ of $\mathbf{R}\mathbf{R}^T$ for $\mathbf{R} = \mathbf{R}_z(\theta)$ with $c = \cos\theta$, $s = \sin\theta$. What does it show?
:::

::: answer
Entry $(1, 0)$ of $\mathbf{R}\mathbf{R}^T$ is row 1 of $\mathbf{R}$ dotted with column 0 of $\mathbf{R}^T$, which is row 0 of $\mathbf{R}$. Row 1 is $(-s, c, 0)$ and row 0 is $(c, s, 0)$. The sum of products is $(-s)(c) + (c)(s) + 0 \cdot 0 = -sc + cs = 0$. So rows 0 and 1 of $\mathbf{R}$ are perpendicular, for every angle $\theta$. Together with $c^2 + s^2 = 1$ on the diagonal, this is why $\mathbf{R}\mathbf{R}^T = \mathbf{I}$ for any rotation, not just 90°.
:::

::: check
A struct `GpsFix { double lat_deg; double lon_deg; std::uint32_t week; std::uint32_t tow_ms; }` has a defaulted `<=>`. A teammate uses `std::sort` on a vector of fixes to put them in time order. What two things are wrong?
:::

::: answer
First, the order: a defaulted `<=>` compares members in declaration order, so it sorts by latitude first, then longitude, and only uses the GPS week and time of week to break ties. Fixes are sorted by where they were, not when. The time fields must come first in the declaration (week, then time of week), or the ordering must be written by hand. Second, the category: the `double` members make the result `std::partial_ordering`. A `NaN` latitude would compare as unordered with everything, and `std::sort` requires a consistent ordering, so one bad fix could scramble the result. Sorting by time alone — for instance with a comparison that looks only at `week` and `tow_ms` — fixes both.
:::

::: check
Why does `Vector3` need both `double& operator[](int)` and `double operator[](int) const`? What breaks if you keep only one of them?
:::

::: answer
With only the non-`const` version, `v[0]` on a `const Vector3&` does not compile: a `const` object may call only `const` member functions (lesson 08), so every read-only function that takes a `const Vector3&` — a printer, a norm — could not read an element. With only the `const` version, reading works everywhere but `v[0] = 1.0` fails, because it returns a copy, and assigning to a temporary copy of a `double` is not allowed. The pair gives read access to everybody and write access only through a non-`const` view.
:::

::: check
Your `operator<<` for `Vector3` ends with `os << std::endl;`. List two problems with that.
:::

::: answer
First, it forces a newline, so `std::cout << "v = " << v << " m/s\n"` prints the units on the next line; the caller, not the operator, should decide the layout. Second, `std::endl` also **flushes** the stream — pushes its buffered text all the way out to the device — every time a vector is printed. In a logging path that runs every cycle, those flushes can cost far more than the formatting itself. Print only the vector, and let the caller add `'\n'`.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `operator+` | the function behind `a + b` | member `a.operator+(b)` or free `operator+(a, b)` |
| limits | no new operators, same precedence and arity | cannot overload `.`, `::`, `?:`, `.*`, `sizeof` |
| compound assignment | `+=`, `-=` | members; return `*this` by reference |
| symmetric operators | `+`, `-`, `*`, `==` | free (hidden friends), return by value; `2.0 * v` and `v * 2.0` |
| matrix product | $(\mathbf{AB})_{ij} = \sum_k A_{ik}B_{kj}$ | overload `*` for `Matrix3` and for `Vector3` right operands |
| rotation check | $\mathbf{R}\mathbf{R}^T = \mathbf{I}$, $\det\mathbf{R} = 1$ | test with a tolerance such as $10^{-15}$, not `==` |
| `operator<=>` | three-way comparison, "spaceship" | `= default` compares members in declaration order, adds `==` |
| rewriting | `a < b` becomes `(a <=> b) < 0` | `!=` rewritten from `==` |
| ordering categories | strong, weak, partial | `double` members make it partial (NaN) |
| `operator[]` | subscript, one argument before C++23 | non-const returns `T&`, const returns a copy or `const T&` |
| `operator()` | call operator | two-index access `m(r, c)`; function objects with state |
| `operator<<` | stream output | free, `const&` object, returns the stream, no `endl` |

Lesson 10 turns to inheritance: base and derived classes, `virtual` functions and `override`, and the slicing trap that copying a derived object into a base one sets.

::: context least-surprise Operators should not surprise
The idea is simple: a symbol should do what a reader expects from its everyday meaning. If `+` on a vector added the x components only, or `==` compared addresses rather than contents, every line using them would need checking. The standard library itself famously bends the rule once — `<<` on streams means "write to", not "shift bits left" — and that use is now so familiar that it has become the expectation for printing.
:::

::: context frame-rotation Turning the axes, not the arrow
There are two ways to use a rotation matrix. You can rotate an arrow while the axes stay put, or keep the arrow still and turn the axes. The exercise's $\mathbf{R}_z$ does the second. Turn the axes $90°$ anticlockwise about $z$: the new $y$ axis points where the old $-x$ pointed, so the old $x$ direction is now along the new $-y$. The attitude modules later in the course come back to keeping these two conventions apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="100" x2="170" y2="100" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="178,100 168,95 168,105" fill="#6c7a93"/>
  <text x="178" y="120" font-size="12" fill="#6c7a93">old x</text>
  <line x1="90" y1="100" x2="90" y2="28" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="90,20 85,30 95,30" fill="#6c7a93"/>
  <text x="96" y="24" font-size="12" fill="#6c7a93">old y</text>
  <line x1="90" y1="100" x2="90" y2="20" stroke="#1d6fd1" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="40" y="44" font-size="12" fill="#1d6fd1">new x</text>
  <line x1="90" y1="100" x2="18" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="10,100 20,95 20,105" fill="#1d6fd1"/>
  <text x="14" y="120" font-size="12" fill="#1d6fd1">new y</text>
  <text x="200" y="50" font-size="12" fill="#1f2a44">axes turned +90° about z</text>
  <text x="200" y="74" font-size="12" fill="#1f2a44">old x lies along new −y</text>
  <text x="200" y="98" font-size="12" fill="#1f2a44">R · (1, 0, 0) = (0, −1, 0)</text>
</svg>
```
:::

::: context cos-roundoff Why cos 90° printed 6.12e-17
A `double` holds about 16 significant digits, and $\pi$ has infinitely many, so `pi / 2` is the nearest `double` to $\pi/2$, off by about $6 \times 10^{-17}$. Near $90°$ the cosine falls with slope $-1$, so the cosine of that slightly-too-small angle is about $6 \times 10^{-17}$ rather than $0$. It is the correct answer to the question the computer was asked. That is why numerical checks use tolerances.
:::

::: context orthonormal Rows that are unit length and perpendicular
A matrix is **orthonormal** when each row has length $1$ and every pair of rows is perpendicular. Multiplying $\mathbf{R}$ by $\mathbf{R}^T$ computes exactly those facts: the diagonal holds each row dotted with itself (length squared, $1$) and the off-diagonal holds pairs of different rows dotted together ($0$). So $\mathbf{R}\mathbf{R}^T = \mathbf{I}$ is the whole definition in one line. In flight software, rounding slowly erodes it, so attitude code re-orthonormalises its matrices from time to time.
:::

::: context expression-templates How Eigen skips the temporaries
Eigen is a widely used C++ linear-algebra library. In it, `A * B + C` does not compute anything at first: each operator returns a small object that *describes* the operation. Only when the result is assigned does one loop run over the elements, with no temporaries in between. The trick is called expression templates, and the templates module (lesson 09 there) explains how it works.
:::

::: context spaceship-name Why "spaceship"
Written in a monospaced font, `<=>` looks like a tiny flying saucer seen from the side. The same three-character operator already existed in Perl and Ruby, where programmers used the nickname long before C++20 adopted the operator. The standard itself calls it the three-way comparison operator.
:::

::: context lexicographic Dictionary order
A dictionary puts "cab" before "car" by comparing the first letters, then the second, and stopping at the first difference. A defaulted `<=>` does the same with members. That is why the order of declarations matters: the first member is the most important.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="12" fill="#6c7a93">seconds</text>
  <text x="110" y="24" font-size="12" fill="#6c7a93">subseconds</text>
  <rect x="20" y="34" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">999</text>
  <rect x="110" y="34" width="80" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="150" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">65000</text>
  <rect x="20" y="70" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">1000</text>
  <rect x="110" y="70" width="80" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="150" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">12</text>
  <text x="206" y="58" font-size="12" fill="#b4232c">999 &lt; 1000: decided</text>
  <text x="206" y="80" font-size="12" fill="#6c7a93">subseconds never looked at</text>
</svg>
```
:::

::: context nan The number that is not a number
IEEE 754 floating point, the format every flight computer uses for `double`, has a special value NaN, "not a number", produced by things like $0/0$ or the square root of a negative. Every comparison involving NaN is false: `x < nan`, `x > nan` and even `nan == nan`. So `<=>` on doubles must be able to answer "unordered", and its result type is `std::partial_ordering`. One NaN from a failed sensor can poison a sort or a filter, so flight code checks for it at the boundary.
:::

::: context lambda Function objects without the boilerplate
A **lambda** such as `[alpha](double x) { return alpha * x; }` is a shortcut: the compiler writes a small class with the captured values as members and an `operator()` holding the body, then makes one object of it. So everything in this lesson about the call operator applies to lambdas. The standard-library module that follows this one uses them with every algorithm.
:::
