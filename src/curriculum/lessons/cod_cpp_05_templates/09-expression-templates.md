---
id: l09-expression-templates
title: Expression templates and lazy evaluation
minutes: 24
covers:
  - "Expression templates and lazy evaluation; how Eigen removes temporaries"
---

Say you need milk, bread and eggs, and you are a very literal errand-runner. Someone says "milk", and you walk to the store, buy milk, walk home. Then "bread", a second trip. Then "eggs", a third. The groceries arrive, but you walked three times.

A sensible person writes a **list** first and makes one trip. Writing the list costs almost nothing. The walking is the expensive part, so you do it once, at the end, when you know everything you need.

C++ arithmetic on big objects normally behaves like the literal errand-runner. This lesson builds the shopping list. An **expression template** is a way of writing operators so that `b + c + d` does not compute anything. It builds a small, cheap description of the sum (the list), and the real work happens in one pass when the result is finally stored (the trip). That trick is why the Eigen library, used for vectors and matrices in a lot of guidance and robotics code, can be both pleasant to read and fast. It also uses nearly everything this module taught: class templates, deduction, and last lesson's CRTP.

## The hidden cost of `a = b + c + d`

Take a simple vector of numbers that owns its storage, like the ones lesson 2 wrapped around `std::array`, but sized at run time. Now write the most natural `operator+` there is: make a new vector, fill it, return it.

```cpp
Vec operator+(const Vec& x, const Vec& y) {
    Vec out(x.size());
    for (std::size_t i = 0; i < x.size(); ++i) out[i] = x[i] + y[i];
    return out;
}
```

That reads well. Now look at what `a = b + c + d;` does with it. The `+` operator groups left to right, so the statement means `a = (b + c) + d;`.

1. `b + c` runs first. It asks for fresh memory, loops over every element, and returns an unnamed vector. Call it `t1`. An unnamed object like `t1` is a **[[temporary|temporary-lifetime]]**: the compiler makes it to hold an in-between result, and it disappears at the end of the statement.
2. `t1 + d` runs next. More fresh memory, a second full loop, a second temporary `t2`.
3. `a = t2` moves `t2`'s storage into `a`. Thanks to move assignment, from the RAII module, this costs no loop.
4. At the semicolon, `t1` is destroyed and its memory handed back.

So one line of code made **two allocations** and **two full loops**, `b` and `c` were read in one pass while `t1` was written, then `t1` and `d` were read in a second pass. For a 3-element vector nobody cares. For a million-element state history, or a big covariance matrix updated at every filter step, it is exactly the kind of waste a fast loop cannot afford.

::: example Counting the hidden work
Put two counters in the vector and the operator, and ask the program to report.

```cpp
#include <cstddef>
#include <cstdio>
#include <vector>

// Counters so we can see the hidden work.
static int allocations = 0;
static int loops = 0;

struct Vec {
    std::vector<double> v;
    explicit Vec(std::size_t n) : v(n) { ++allocations; }
    std::size_t size() const { return v.size(); }
    double  operator[](std::size_t i) const { return v[i]; }
    double& operator[](std::size_t i)       { return v[i]; }
};

// The ordinary way: each + builds and returns a whole new Vec.
Vec operator+(const Vec& x, const Vec& y) {
    Vec out(x.size());                 // one allocation
    ++loops;
    for (std::size_t i = 0; i < x.size(); ++i) out[i] = x[i] + y[i];
    return out;
}

int main() {
    const std::size_t n = 1000;
    Vec a(n), b(n), c(n), d(n);
    for (std::size_t i = 0; i < n; ++i) { b[i] = 1.0; c[i] = 2.0; d[i] = 3.0; }

    allocations = 0;                   // count only the statement below
    a = b + c + d;
    std::printf("a[0] = %.1f, allocations = %d, loops = %d\n", a[0], allocations, loops);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
a[0] = 6.0, allocations = 2, loops = 2
```

Step by step: the counter was reset to zero right before the statement. `b + c` constructed one `Vec` (allocation 1, loop 1). `(b + c) + d` constructed another (allocation 2, loop 2). The assignment into `a` moved the second temporary in and counted nothing. Sanity check on the value: $1 + 2 + 3 = 6$, which is what `a[0]` holds. With four operands, `a = b + c + d + e`, you would see three of each: one per `+`.
:::

Could the optimizer fix this on its own? In practice, no. Each loop sits inside its own `operator+`, behind its own request to the allocator for memory, and compilers do not merge loops across that. The cure has to come from how the operators are written.

## Operators that return a description

Here is the shopping-list idea in C++. Instead of doing the addition, `b + c` returns a tiny object that **remembers** "the sum of `b` and `c`". It holds two references and nothing else. Such a stand-in object is called a **[[proxy|proxy-word]]**: it stands in for a value that has not been computed yet.

The proxy still has to act like a vector, so it gets an `operator[]`. Asked for element `i`, it computes `b[i] + c[i]` right then, for that one `i`. Nothing is stored.

Now `(b + c) + d` is a proxy whose left side is itself a proxy. The two of them form a small tree: the root says "left plus right", its left child says "`b` plus `c`", and the leaves are the real vectors. That is an **[[expression tree|expression-tree]]**, and because each node's type records its children's types, the whole tree lives in the *type* of the expression: `Sum<Sum<Vec, Vec>, Vec>`, read "sum of (sum of Vec and Vec) and Vec".

Finally, `Vec::operator=` accepts any such tree. It runs one loop, and in that loop it asks the tree for element `i`. The request travels down: the root asks its left child for element `i`, which returns `b[i] + c[i]`, then adds `d[i]`. All four arrays are touched in one pass. This is **lazy evaluation**: no arithmetic happens until someone needs the answer, and then only the arithmetic for exactly what is needed.

To make "any expression" a type the operators can accept, we use lesson 8's CRTP. A base class `VecExpr<E>`, read "vec-expression of E", means "an `E` that can hand out elements". Every node and the real vector inherit from it, naming themselves as `E`.

::: example A tiny expression-template vector
```cpp
#include <cstdio>
#include <cstddef>
#include <vector>

static int allocations = 0;   // counters, to see the hidden work
static int loops = 0;

// The CRTP base: "some expression that can hand out element i".
template <typename E>
struct VecExpr {
    const E& self() const { return static_cast<const E&>(*this); }
    std::size_t size() const { return self().size(); }
    double operator[](std::size_t i) const { return self()[i]; }
};

// A Sum node: remembers its two operands. It adds nothing yet.
template <typename L, typename R>
struct Sum : VecExpr<Sum<L, R>> {
    const L& l;
    const R& r;
    Sum(const L& l_, const R& r_) : l(l_), r(r_) {}
    std::size_t size() const { return l.size(); }
    double operator[](std::size_t i) const { return l[i] + r[i]; }   // the work, for one i
};

// + on any two expressions builds a node: no allocation, no loop.
template <typename L, typename R>
Sum<L, R> operator+(const VecExpr<L>& l, const VecExpr<R>& r) {
    return Sum<L, R>(l.self(), r.self());
}

// The real vector: the only thing that owns numbers.
struct Vec : VecExpr<Vec> {
    std::vector<double> v;
    explicit Vec(std::size_t n) : v(n) { ++allocations; }
    std::size_t size() const { return v.size(); }
    double  operator[](std::size_t i) const { return v[i]; }
    double& operator[](std::size_t i)       { return v[i]; }

    // Assigning any expression runs the one and only loop.
    template <typename E>
    Vec& operator=(const VecExpr<E>& e) {
        ++loops;
        for (std::size_t i = 0; i < v.size(); ++i) v[i] = e[i];
        return *this;
    }
};

int main() {
    const std::size_t n = 1000;
    Vec a(n), b(n), c(n), d(n);
    for (std::size_t i = 0; i < n; ++i) { b[i] = 1.0; c[i] = 2.0; d[i] = 3.0; }

    allocations = 0;
    a = b + c + d;       // right side has type Sum<Sum<Vec, Vec>, Vec>
    std::printf("a[0] = %.1f, allocations = %d, loops = %d\n", a[0], allocations, loops);
}
```

It prints:

```text
a[0] = 6.0, allocations = 0, loops = 1
```

Walk through the statement the way the compiler does:

1. `b + c`: both are `Vec`, which is a `VecExpr<Vec>`, so the template `operator+` matches with `L = Vec` and `R = Vec`. It returns a `Sum<Vec, Vec>` holding two references. No memory, no loop.
2. `(b + c) + d`: the left side is a `Sum<Vec, Vec>`, which is a `VecExpr<Sum<Vec, Vec>>`. Deduction gives `L = Sum<Vec, Vec>`, `R = Vec`. The result is a `Sum<Sum<Vec, Vec>, Vec>`. Still nothing computed.
3. `a = ...`: `Vec::operator=` is a template, so it accepts `VecExpr<E>` with `E = Sum<Sum<Vec, Vec>, Vec>`. Its loop asks for `e[i]`.
4. `e[i]` expands to `outer.l[i] + d[i]`, and `outer.l[i]` expands to `b[i] + c[i]`. After inlining, the loop body is `a.v[i] = (b.v[i] + c.v[i]) + d.v[i]`, which is what you would have written by hand.

Sanity check: same answer as before, $6.0$, with zero allocations and one loop instead of two and two. The operator is written once and works for any number of terms: `b + c + d + e` makes a three-level tree and still one loop.
:::

::: key
An expression template: operators return small proxy objects describing the computation rather than performing it, so a whole expression is fused into one loop when it is finally assigned. This is how Eigen evaluates `a + b + c` with no intermediate temporaries.
:::

Two details make this design safe to use. First, `operator+` only accepts `VecExpr<...>` arguments, so it cannot grab `+` on unrelated types such as two `std::string`s. Deduction against the base class is what keeps it fenced in, the same way lesson 6's concepts fence a template. Second, `a = a + b` is fine: element `i` of the result reads only element `i` of `a` and `b`, so writing `a[i]` never spoils a value the loop still needs. When that "only element `i`" condition fails, the trick breaks. Eigen calls that aliasing.

::: note Why the compiler can flatten the tree
Every node type is known while compiling, and every `operator[]` is a small function whose body is visible, so the optimizer inlines the whole chain of calls into the loop. CRTP's `static_cast` in `self()` is resolved at compile time; no virtual call is involved. With a virtual `operator[]` instead, each element would pay an indirect call the compiler usually cannot inline, and much of the gain would vanish.
:::

## How much faster, honestly

Counting loops is one thing. Timing is another. A small harness ran each version of `a = b + c + d` many times, with the two vector types side by side and the same inputs, and divided the total time by the number of runs. The heart of it:

```cpp
template <typename V>
double run(std::size_t n, int reps) {
    V a(n), b(n), c(n), d(n);
    for (std::size_t i = 0; i < n; ++i) { b[i] = 1.0 * i; c[i] = 2.0; d[i] = 3.0; }
    auto t0 = std::chrono::steady_clock::now();
    double check = 0;
    for (int r = 0; r < reps; ++r) { a = b + c + d; check += a[r % n]; b[0] += 1e-9; }
    auto t1 = std::chrono::steady_clock::now();
    if (check < 0) std::printf("impossible\n");   // keeps the work observable
    return std::chrono::duration<double, std::micro>(t1 - t0).count() / reps;
}
```

The `check` sum and the tiny change to `b[0]` stop the optimizer from deleting the repeated statement as pointless. On one machine (g++ 13, `-O2`), three runs gave:

```text
n = 1000000: eager 2425.90 us, fused 1161.20 us, ratio 2.1
n = 1000: eager 0.87 us, fused 0.46 us, ratio 1.9
n = 1000000: eager 2449.40 us, fused 1186.37 us, ratio 2.1
n = 1000: eager 0.92 us, fused 0.46 us, ratio 2.0
n = 1000000: eager 2424.29 us, fused 1156.64 us, ratio 2.1
n = 1000: eager 0.90 us, fused 0.45 us, ratio 2.0
```

So on this machine the fused version was about twice as fast, for both a big vector and a small one. Your numbers will differ with the processor, the compiler and the sizes.

Where does a factor of two come from? For a million doubles, each vector is 8 MB, far bigger than the processor's caches, so the time goes mostly into moving bytes between memory and the processor. A loop like this is **[[memory-bound|memory-bound]]**. Count the doubles moved per element. The eager version reads 2 and writes 1 in its first loop, then reads 2 and writes 1 in its second: 6 doubles, 48 bytes. The fused loop reads `b`, `c`, `d` and writes `a`: 4 doubles, 32 bytes. That alone predicts a ratio of $48/32 = 1.5$. The rest is the price of asking the allocator for two fresh 8 MB blocks and freeing them again on every statement. For the 1000-element vectors, which fit in the cache, memory speed matters less, and the saving is mostly the allocations and the second loop.

::: warning Do not oversell it
Fusing removes temporaries and passes over memory. It does not make an addition faster. A single `a = b + c` has no temporary to remove, so it gains close to nothing. The trick pays when expressions have several terms and the objects are big, or when a small-matrix expression runs thousands of times a second and every avoided allocation counts, as in a filter loop on a flight computer.
:::

## The trap: `auto` keeps the description, not the answer

The proxy holds *references*. That is what makes it cheap, and it is also its one real danger. A reference is only good while the thing it refers to is alive.

When you write `Vec a(n); a = b + c;`, the type on the left is `Vec`, so the tree is evaluated right there, at the semicolon, while everything it points to still exists. But `auto` deduces the type of the right-hand side itself, which is the proxy. `auto e = b + c;` makes `e` a `Sum<Vec, Vec>`, the description, not a vector of answers. If anything in that description was a temporary, it is destroyed at the semicolon, and `e` is left holding a **[[dangling reference|dangling]]**: a reference to an object that no longer exists.

::: example A proxy that outlives its operand
Keep the classes from the last example, add a function that returns a vector by value, and replace `main`:

```cpp
Vec ones(std::size_t n) {
    Vec out(n);
    for (std::size_t i = 0; i < n; ++i) out[i] = 1.0;
    return out;
}

int main() {
    const std::size_t n = 1000;
    Vec b(n);
    for (std::size_t i = 0; i < n; ++i) b[i] = 2.0;

    auto e = ones(n) + b;   // e holds a reference to the Vec returned by ones(n),
                            // and that Vec is destroyed at this semicolon.
    Vec a(n);
    a = e;                  // reads through a dangling reference
    std::printf("a[0] = %.1f (should be 3.0)\n", a[0]);
}
```

With `-O2` it compiled with one long `-Wmaybe-uninitialized` warning, whose note points at the line `auto e = ones(n) + b;`. On one machine it printed:

```text
a[0] = 2.0 (should be 3.0)
```

Step by step: `ones(n)` returned a temporary `Vec` full of ones. The `+` stored a reference to it inside `e`. At the semicolon the temporary was destroyed. Later, the loop in `a = e` read memory that no longer belonged to any vector. Reading it is **undefined behavior**: this run happened to produce $2.0$, another build could produce $3.0$, garbage or a crash. Sanity check: $1 + 2 = 3$, so $2.0$ is wrong, and the program gave no error. Built with `-fsanitize=address`, the same program stops at the bad read with `ERROR: AddressSanitizer: stack-use-after-scope`, the kind of report **[[AddressSanitizer|asan]]** exists for.
:::

The same trap has a sneakier form. Even with three named vectors, `auto e = b + c + d;` dangles in our toy, because the inner `Sum<Vec, Vec>` node is itself a temporary, and the outer node holds a reference to it. AddressSanitizer reports that one too. Real libraries such as Eigen store child *expressions* by value (they are tiny) and only real matrices by reference, which closes this form but not the first one.

::: warning Never store an expression in `auto`
With expression-template types, write the result type you want: `Vec e = ...;` in our toy, `Eigen::VectorXd e = ...;` in Eigen. That forces evaluation at the semicolon. `auto` is fine for almost everything else in C++; here it quietly keeps the shopping list instead of the groceries.
:::

## How Eigen does it

**Eigen** is a free C++ template library for linear algebra, and lesson 2 met its fixed-size `Matrix3d` and dynamic `MatrixXd`. It is not installed in the toolchain used for this module, so the Eigen code below is described from its documentation rather than compiled here. Module cod_cpp_09_eigen builds it and prints its real output.

Eigen's design is the one you built, at industrial scale:

- **Every expression is a type.** For two `Eigen::VectorXd` values, `a + b` returns an object of a class template named `CwiseBinaryOp` ("coefficient-wise binary operation"), carrying the operation and its two operands. Products, transposes, blocks and scalar multiples have expression types of their own.
- **CRTP holds it together.** All of them derive from a base, `MatrixBase<Derived>`, which plays the role of `VecExpr<E>` and supplies the shared operators.
- **Assignment evaluates.** When an expression is assigned to a real `Matrix`, one loop fills the destination. Eigen processes several elements per instruction with the processor's **[[SIMD|simd]]** instructions where it can, and for small fixed sizes such as `Matrix3d` it can unroll the loop completely. Expressions themselves allocate nothing, and the scheme works for fixed and dynamic sizes alike.

```cpp
Eigen::VectorXd a(n), b(n), c(n), d(n);
a = b + c + d;       // one fused loop, no temporary vectors
```

### Aliasing, `eval()` and `noalias()`

**Aliasing** means the destination also appears on the right-hand side of the assignment. For coefficient-wise expressions it is harmless, for the reason you saw: element `i` of the result needs only element `i` of each input. `a = a + b` is safe in Eigen as in the toy.

It is not harmless when an output element depends on *other* elements of the input. The classic case is `m = m.transpose();`. Written element by element into `m` itself, the loop overwrites entries it still needs to read, and the result is a **[[scrambled matrix|aliasing-transpose]]**. Eigen's documentation shows this case and says Eigen catches it with a run-time assertion in debug builds. The fixes are `m.transposeInPlace();`, or `m = m.transpose().eval();`. The member function **`eval()`** forces an expression to be computed into a temporary right now, which is exactly the temporary you need when source and destination overlap.

Matrix *products* are the other special case. Every element of `A * B` depends on a whole row of `A` and a whole column of `B`, so `A = A * B;` evaluated in place would be wrong. Eigen therefore evaluates a product into a temporary by default, then copies it in, and `A = A * B` gives the right answer. When you know the destination does not overlap the operands, you can say so:

```cpp
C.noalias() = A * B;   // promise: C is not A or B, so write straight into C
```

**`noalias()`** removes that temporary. It is a promise, and Eigen does not check it: `A.noalias() = A * B;` produces wrong numbers.

::: key
Eigen's expression templates build a compile-time expression tree, and the whole statement is evaluated in one fused loop when it is assigned; the expressions themselves need no dynamic allocation, for fixed and dynamic sizes. Coefficient-wise aliasing (`a = a + b`) is safe; `m = m.transpose()` is not (use `transposeInPlace()` or `eval()`). Products are evaluated into a temporary by default; `noalias()` removes it when you promise the destination does not overlap. Do not store Eigen expressions in `auto`.
:::

Eigen's documentation warns against `auto` for the reason you saw: `auto x = a + b;` stores the expression, which is recomputed every time `x` is read and dangles if an operand was a temporary. The rest of Eigen's practice is the subject of the **[[Eigen module|eigen-module]]** later in the course.

## Check yourself

::: check
With the eager `operator+` from the first example, how many allocations and full loops does `x = p + q + r + s + t;` make? How many with the expression-template version?
:::

::: answer
Five operands means four `+` operators. Eagerly, each `+` builds a new vector: 4 allocations and 4 loops. (The last temporary is moved into `x`, which costs no loop.) With expression templates, each `+` builds a proxy with no allocation and no loop, the tree has type `Sum<Sum<Sum<Sum<Vec, Vec>, Vec>, Vec>, Vec>`, and `x = ...` runs 1 loop with 0 allocations.
:::

::: check
In the tiny library, why does `Vec::operator=` have to be a template, and what does its template parameter become for `a = b + c + d`?
:::

::: answer
Each different expression shape has a different type, so one ordinary `operator=(const Vec&)` could not accept them all. As a template taking `const VecExpr<E>&`, it accepts any node that derives from `VecExpr`. For `a = b + c + d`, deduction gives `E = Sum<Sum<Vec, Vec>, Vec>`, and the compiler writes a version of the loop specialised for exactly that tree, which it can then inline into one plain loop.
:::

::: check
For the million-element case, the fused version moved 32 bytes per element instead of 48. How many megabytes does each version move per statement, and what ratio does memory traffic alone predict?
:::

::: answer
Eagerly: $48 \times 10^6$ bytes, about 48 MB (six 8 MB arrays: read `b`, `c`, write `t1`, read `t1`, `d`, write `t2`). Fused: $32 \times 10^6$ bytes, about 32 MB (read `b`, `c`, `d`, write `a`). Memory alone predicts $48/32 = 1.5$. The measured ratio of about 2.1 on one machine is larger because the eager version also allocates, first touches and frees two 8 MB blocks every statement.
:::

::: check
A colleague writes `auto delta = measured - predicted;` with Eigen vectors, then updates `predicted` and prints `delta`. What will they see, and what should they write?
:::

::: answer
`delta` is an expression object, not a vector, so it is recomputed each time it is read and uses the *current* `predicted`. The printed values reflect the updated prediction, not the difference at the moment of the assignment. If either operand had been a temporary, it would also dangle. They should write the type: `Eigen::VectorXd delta = measured - predicted;`, which evaluates once, at that line (or call `.eval()`).
:::

::: check
Which of these is safe in Eigen, and why? (1) `x = x + dx;` (2) `P = P * F.transpose();` (3) `P.noalias() = P * F.transpose();`
:::

::: answer
(1) Safe: coefficient-wise, each element of the result reads only the same element of `x` and `dx`. (2) Safe: it is a product, and Eigen evaluates products into a temporary by default, so overwriting `P` happens only after the product is complete. (3) Wrong: `noalias()` promises that `P` does not appear on the right, but it does, so Eigen writes into `P` while still reading it and the numbers are corrupted, with no error.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| temporary | unnamed in-between object | destroyed at the end of the full statement |
| eager `operator+` | computes and returns a new object | `a = b + c + d`: 2 allocations, 2 loops |
| proxy / expression node | object describing a computation | `Sum<L, R>` holds references, computes `l[i] + r[i]` on request |
| expression tree | nested proxies, encoded in the type | `Sum<Sum<Vec, Vec>, Vec>` |
| lazy evaluation | compute only when the result is needed | one fused loop in `operator=`: 0 allocations, 1 loop |
| measured gain | fewer passes over memory, no allocation | about 2x on one machine for 3 terms; nothing for one `+` |
| `auto` trap | keeps the proxy, not the values | dangling references, recomputation; name the type |
| Eigen | `CwiseBinaryOp` etc. on a CRTP `MatrixBase<Derived>` | evaluates on assignment; SIMD; unrolled for small fixed sizes |
| aliasing | destination also on the right side | safe coefficient-wise; `m = m.transpose()` is not; `eval()` forces a temporary |
| `noalias()` | "destination does not overlap" | skips the product temporary; wrong if the promise is false |

Every one of these templates is compiled separately for each expression shape, in every file that uses it. The next lesson, the module's last, measures what that costs in build time, shows how `extern template` cuts it, and teaches a calm method for reading the long error messages templates produce.

::: context temporary-lifetime When a temporary dies
A temporary lives until the end of the **full-expression** that created it, which in practice usually means the semicolon. That is why `a = b + c + d;` is safe even though the intermediate objects are unnamed: everything is used before the semicolon. There is one extension: binding a temporary directly to a `const` reference variable, as in `const Vec& r = b + c;` with the eager version, stretches its life to match `r`. That rule does not reach through a reference stored *inside* another object, which is why the proxy in this lesson can dangle.
:::

::: context proxy-word A stand-in with permission to act
In everyday English a proxy is someone allowed to act for another person, like a proxy vote. In programming, a proxy object stands in for something else and forwards requests to it. You have met one already: `std::vector<bool>::operator[]` returns a proxy for a single bit, because a bit has no address of its own. Proxies share the same `auto` trap as expression templates: `auto x = bits[3];` keeps the proxy, not a `bool`.
:::

::: context expression-tree The tree hiding in the type
The type `Sum<Sum<Vec, Vec>, Vec>` is a tree drawn in angle brackets. Each node holds references to its children; only the leaves own numbers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="12" width="120" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">Sum (outer)</text>
  <rect x="40" y="82" width="120" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">Sum (inner)</text>
  <rect x="230" y="82" width="70" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">Vec d</text>
  <rect x="10" y="152" width="70" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">Vec b</text>
  <rect x="120" y="152" width="70" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="155" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">Vec c</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="160" y1="42" x2="110" y2="82"/>
    <line x1="200" y1="42" x2="258" y2="82"/>
    <line x1="85" y1="112" x2="52" y2="152"/>
    <line x1="115" y1="112" x2="148" y2="152"/>
  </g>
  <text x="250" y="150" font-size="11" fill="#6c7a93">orange: proxy, no data</text>
  <text x="250" y="168" font-size="11" fill="#6c7a93">blue: owns numbers</text>
</svg>
```

Asking the root for element $i$ walks the tree and returns $(b_i + c_i) + d_i$.
:::

::: context memory-bound When the loop waits for memory
A modern processor can add doubles far faster than main memory can deliver them. For a loop that does one addition per element loaded, the processor spends most of its time waiting for bytes to arrive, so the time tracks the bytes moved, not the arithmetic done. That is memory-bound. The bars below are the bytes moved per statement for million-element vectors.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="32" font-size="12" fill="#1f2a44">eager</text>
  <rect x="60" y="18" width="288" height="22" fill="#b4232c"/>
  <text x="204" y="34" font-size="12" text-anchor="middle" fill="#ffffff">48 MB (6 arrays)</text>
  <text x="10" y="76" font-size="12" fill="#1f2a44">fused</text>
  <rect x="60" y="62" width="192" height="22" fill="#1d6fd1"/>
  <text x="156" y="78" font-size="12" text-anchor="middle" fill="#ffffff">32 MB (4 arrays)</text>
  <text x="60" y="102" font-size="11" fill="#6c7a93">each array: 1,000,000 doubles = 8 MB</text>
</svg>
```
:::

::: context dangling What a dangling reference is
A reference is a second name for an object that already exists. When that object is destroyed, the reference is not told; it still holds the old address, like a note with a friend's address after they have moved out. Using it reads memory that may already hold something else. The compiler cannot reliably warn about it, because the object and the reference can live in different places in the code.
:::

::: context asan A tool that watches every memory access
AddressSanitizer is built into g++ and clang++. Compiling with `-fsanitize=address` adds checks around memory accesses and marks freed or out-of-scope memory as poisoned. A read or write of poisoned memory stops the program with a report naming the kind of error and the line. It slows a program down (typically around two times) and uses extra memory, so teams run it in tests and simulations, not in flight builds. It finds a dangling proxy in one test run that might otherwise pass silently for months.
:::

::: context simd One instruction, several numbers
SIMD stands for single instruction, multiple data. A processor with SIMD registers can add several doubles in one instruction: two with SSE2 on x86 or NEON on 64-bit ARM, four with AVX. Eigen groups coefficients into such packets inside its fused loop. A plain loop like the toy's can also be vectorized by the compiler on its own when it can prove the arrays do not overlap in a harmful way.
:::

::: context aliasing-transpose Why an in-place transpose scrambles
Transposing into the same storage, one element at a time in row order, reads an element after it has been overwritten.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <rect x="20" y="30" width="80" height="60" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="45" y="55">1</text><text x="75" y="55">2</text><text x="45" y="80">3</text><text x="75" y="80">4</text>
    <rect x="140" y="30" width="80" height="60" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="165" y="55">1</text><text x="195" y="55">3</text><text x="165" y="80">2</text><text x="195" y="80">4</text>
    <rect x="260" y="30" width="80" height="60" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
    <text x="285" y="55">1</text><text x="315" y="55">3</text><text x="285" y="80" fill="#b4232c">3</text><text x="315" y="80">4</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="20">m</text>
    <text x="180" y="20">correct transpose</text>
    <text x="300" y="20">in place, naive</text>
    <text x="300" y="112">m(1,0) read m(0,1) = 3, already overwritten</text>
  </g>
</svg>
```

Row 0 is written first: $m_{01}$ becomes $3$. Then $m_{10}$ copies $m_{01}$, which is now $3$, not the original $2$.
:::

::: context eigen-module Where Eigen comes back
Module cod_cpp_09_eigen is devoted to Eigen, and its lesson 5 runs this lesson's ideas on real Eigen code: fixed and dynamic matrices, `Map` over existing buffers, blocks, decompositions such as Cholesky for covariance matrices, quaternions, and exactly this lesson's topics with real measurements, including `eval()`, `noalias()`, and proving that a filter update allocates nothing. Knowing that an Eigen expression is a tree of types waiting to be assigned makes its long type names in error messages, and its few sharp edges, far less mysterious.
:::
