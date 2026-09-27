---
id: l06-nalgebra-matrices
title: 'nalgebra: matrices whose size is part of the type'
minutes: 19
covers:
  - 'nalgebra: type-level dimensions, SMatrix versus DMatrix, and when it allocates'
---

Think about a weekly pill organizer: a plastic tray with exactly seven little boxes, printed MON to SUN. You can see at a glance that it has room for one week, no more, and you can never put a pill into "day eight" because there is no such box. Compare that with a paper bag of pill bottles. The bag holds any number, but you only find out it is wrong when you open it.

Guidance, navigation and control is built out of small matrices whose sizes never change. A rotation is 3 by 3. A position-and-velocity state is a column of 6. The covariance of that state, which says how unsure the filter is, is 6 by 6. Those sizes are known when you design the filter, years before launch. **nalgebra** is Rust's main linear-algebra library, and its central idea is the pill organizer: the size of a matrix can be written into its *type*, so the compiler knows it, checks every multiplication against it, and stores the numbers inline with no heap at all.

This lesson shows how nalgebra writes sizes into types, the difference between the fixed-size `SMatrix` and the flexible `DMatrix`, exactly when nalgebra touches the heap, and how to make "this filter never allocates" something the build checks. Everything was built with Rust 1.94.1 and nalgebra 0.35.0; all output is copied from real runs.

## One matrix type with four parameters

In nalgebra, every matrix and vector is the same generic type:

```rust
Matrix<T, R, C, S>
```

Read it as "a matrix of `T`, with `R` rows and `C` columns, stored in `S`".

- `T` is the number type, usually `f64` or `f32`.
- `R` and `C` are the dimensions, but written as **types**, not ordinary numbers. `Const<3>` is a type meaning "exactly 3, known when compiling". `Dyn` is a type meaning "some number, decided when the program runs".
- `S` is the **storage**: where the numbers live. For fixed sizes it is `ArrayStorage<T, R, C>`, an ordinary array inside the matrix. For dynamic sizes it is `VecStorage`, a heap-allocated `Vec`.

Nobody types all four parameters. nalgebra provides short **[[type aliases|type-alias]]**, names that stand for a longer type:

| Alias | Stands for | Size known |
|---|---|---|
| `Matrix3<f64>` | 3 by 3 of `f64` | when compiling |
| `Vector3<f64>` | 3 by 1 (a column) | when compiling |
| `SMatrix<f64, 6, 6>` | any `R` by `C`, here 6 by 6 | when compiling |
| `SVector<f64, 6>` | a column of `D`, here 6 | when compiling |
| `DMatrix<f64>` | `Dyn` by `Dyn` | when running |
| `DVector<f64>` | `Dyn` by 1 | when running |

The "S" in `SMatrix` stands for static (fixed at compile time) and the "D" in `DMatrix` for dynamic. Under the hood, `SMatrix<T, R, C>` is exactly `Matrix<T, Const<R>, Const<C>, ArrayStorage<T, R, C>>`, using the [[const generics|const-generics]] you met with `heapless::Vec<T, N>` in lesson 04.

To use nalgebra on a laptop, `cargo add nalgebra`. The `no_std` setup comes later in the lesson.

## Building matrices and reading them

`Matrix3::new` takes its nine numbers **row by row**, the way you write a matrix on paper. Indexing uses a pair, `m[(row, col)]`, counting from 0, and the product of a matrix and a vector is written with `*`.

One detail surprises people. Although you *type* the numbers row by row, nalgebra *stores* them **column by column**, called **[[column-major|column-major]]** order. `as_slice()` shows the raw storage:

```rust
use nalgebra::Matrix2x3;

fn main() {
    // Written row by row, as you would on paper.
    let m = Matrix2x3::new(
        1.0, 2.0, 3.0,
        4.0, 5.0, 6.0,
    );
    println!("m[(1, 0)] = {}", m[(1, 0)]); // row 1, column 0
    println!("in memory: {:?}", m.as_slice());
    println!("nrows = {}, ncols = {}", m.nrows(), m.ncols());
}
```

```text
m[(1, 0)] = 4
in memory: [1.0, 4.0, 2.0, 5.0, 3.0, 6.0]
nrows = 2, ncols = 3
```

Indexing always means row, then column, so you rarely notice the storage order. It matters when you hand the raw numbers to something else: C code expecting row-major arrays, a telemetry packet, or a file.

::: example A rotation, a measurement and a covariance prediction
Here are three small GNC calculations with fixed-size types.

```rust
use nalgebra::{Matrix2, Matrix3, SMatrix, SVector, Vector3};

fn main() {
    // A 3x3 rotation: 90 degrees about z, written out by hand.
    let r = Matrix3::new(
        0.0, -1.0, 0.0,
        1.0,  0.0, 0.0,
        0.0,  0.0, 1.0,
    );
    let v_body = Vector3::new(2.0, 0.0, 0.5);
    let v_nav = r * v_body;
    println!("v_nav = {:?}", v_nav.as_slice());

    // SMatrix<f64, 2, 3>: 2 rows, 3 columns, fixed when compiling.
    let h: SMatrix<f64, 2, 3> = SMatrix::from_row_slice(&[
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
    ]);
    let z: SVector<f64, 2> = h * v_nav;
    println!("z = {:?}", z.as_slice());

    // Constant-velocity model, dt = 0.1 s: covariance prediction P' = F P F^T + Q
    let dt = 0.1;
    let f = Matrix2::new(1.0, dt, 0.0, 1.0);
    let p = Matrix2::new(4.0, 0.0, 0.0, 1.0);
    let q = Matrix2::new(0.001, 0.0, 0.0, 0.01);
    let p_next = f * p * f.transpose() + q;
    println!("P' = {}", p_next);
}
```

```text
v_nav = [0.0, 2.0, 0.5]
z = [0.0, 2.0]
P' = 
  ┌             ┐
  │ 4.011   0.1 │
  │   0.1  1.01 │
  └             ┘
```

Check each one by hand.

**The rotation.** Row 1 of `r` times `v_body` is $0 \cdot 2 + (-1) \cdot 0 + 0 \cdot 0.5 = 0$. Row 2 is $1 \cdot 2 + 0 + 0 = 2$. Row 3 is $0 + 0 + 1 \cdot 0.5 = 0.5$. A vector pointing along $x$, turned 90 degrees about $z$, now points along $y$, and its $z$ part is unchanged. That is what a quarter turn should do.

**The measurement.** `h` picks out the first two components, the way a sensor that sees only $x$ and $y$ would: $(0, 2)$. The product of a 2 by 3 matrix and a 3 by 1 vector is 2 by 1, and the type `SVector<f64, 2>` says so.

**The covariance.** $\mathbf{P}$ is the uncertainty of (position, velocity): variance $4\,\mathrm{m^2}$ in position and $1\,\mathrm{m^2/s^2}$ in velocity. $\mathbf{F}$ moves the state forward by $\Delta t = 0.1\,\mathrm{s}$. Work $\mathbf{F}\mathbf{P}\mathbf{F}^\mathsf{T}$ in two steps:

$$
\mathbf{F}\mathbf{P} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1 \end{bmatrix}\begin{bmatrix} 4 & 0 \\ 0 & 1 \end{bmatrix} = \begin{bmatrix} 4 & 0.1 \\ 0 & 1 \end{bmatrix},
\qquad
(\mathbf{F}\mathbf{P})\mathbf{F}^\mathsf{T} = \begin{bmatrix} 4 & 0.1 \\ 0 & 1 \end{bmatrix}\begin{bmatrix} 1 & 0 \\ 0.1 & 1 \end{bmatrix} = \begin{bmatrix} 4.01 & 0.1 \\ 0.1 & 1 \end{bmatrix}.
$$

Adding $\mathbf{Q}$ gives $4.01 + 0.001 = 4.011$ and $1 + 0.01 = 1.01$ on the diagonal. The position uncertainty grew, because an uncertain velocity smears the position over time. The off-diagonal $0.1$ says position and velocity errors are now linked. The output matches.
:::

## The compiler checks the shapes

Here is the payoff of writing sizes into types. Multiply a 3 by 3 matrix by a 2-element vector, a real bug that happens when someone wires the wrong sensor into a filter:

```rust
use nalgebra::{Matrix3, Vector2};

fn main() {
    let r = Matrix3::<f64>::identity();
    let v = Vector2::new(1.0, 2.0);
    let w = r * v;
    println!("{}", w);
}
```

The program never gets to run. The compiler says (trimmed):

```text
error[E0277]: the trait bound `ShapeConstraint: DimEq<Const<3>, Const<2>>` is not satisfied
 --> examples/mismatch.rs:5:15
  |
5 |     let w = r * v;
  |               ^ the trait `DimEq<Const<3>, Const<2>>` is not implemented for `ShapeConstraint`
```

The message is long, but read the middle of it: `DimEq<Const<3>, Const<2>>` means "3 must equal 2". nalgebra only implements multiplication when the columns of the left matrix and the rows of the right one are the *same type*. `Const<3>` and `Const<2>` are different types, so there is no multiplication to call. The **[[trait system|shape-constraint]]** did the linear algebra check.

Now the same bug with dynamic types:

```rust
use nalgebra::{DMatrix, DVector};

fn main() {
    let r = DMatrix::<f64>::identity(3, 3);
    let v = DVector::from_vec(vec![1.0, 2.0]);
    println!("built both; multiplying...");
    let w = &r * &v;
    println!("{}", w);
}
```

This compiles, because `Dyn` could be any size. It fails only when it runs:

```text
built both; multiplying...

thread 'main' (30883) panicked at .../nalgebra-0.35.0/src/base/blas_uninit.rs:147:9:
Gemv: dimensions mismatch.
```

(`Gemv` is the name of the matrix-times-vector routine, from the classic [[BLAS library|blas]].) On a laptop that is a crash with a message. In flight it is a panic in the middle of a control loop, found only if a test happened to take that path. The fixed-size version made the same mistake impossible to ship.

::: warning The row-by-row constructor is easy to transpose
`Matrix2::new(1.0, dt, 0.0, 1.0)` is $\begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}$, read across the rows. But `from_column_slice` and `from_vec` fill **down the columns**, so the same four numbers give the transpose. The types cannot catch this, because both are 2 by 2. Print the matrix with `{}`, which draws it as rows and columns, the first time you build one.
:::

## When nalgebra allocates

Picture the two kinds of matrix as two kinds of container. `SMatrix` is the pill organizer: the boxes are part of the object, so the numbers live wherever the matrix lives, on the stack, inside a struct, or in a `static`. `DMatrix` is a small card with an address written on it: the card itself is small, and the numbers live [[somewhere else, on the heap|inline-vs-heap]].

`size_of` shows it:

```rust
println!("size_of Matrix3<f64>     = {}", core::mem::size_of::<Matrix3<f64>>());
println!("size_of SMatrix<f64,6,6> = {}", core::mem::size_of::<SMatrix<f64, 6, 6>>());
println!("size_of DMatrix<f64>     = {}", core::mem::size_of::<DMatrix<f64>>());
```

```text
size_of Matrix3<f64>     = 72
size_of SMatrix<f64,6,6> = 288
size_of DMatrix<f64>     = 40
```

A `Matrix3<f64>` is $3 \times 3 \times 8 = 72$ bytes: nine 8-byte floats and nothing else. The 6 by 6 is $6 \times 6 \times 8 = 288$ bytes. The `DMatrix` is 40 bytes on this 64-bit laptop *however big the matrix is*: a `Vec` (pointer, capacity and length, 24 bytes) plus the row and column counts (8 bytes each). Its numbers are in a heap block allocated when it was created.

So the rule is short. **nalgebra allocates only for dynamically sized types**: `DMatrix`, `DVector`, and any matrix with a `Dyn` dimension. Every operation on fixed-size types (products, transposes, inverses, decompositions like LU and Cholesky, views into blocks) works on inline arrays and returns inline arrays.

::: key When nalgebra allocates
Only for dynamically sized types (DMatrix, DVector). Use the statically sized SMatrix, SVector, Matrix3, Vector3 and UnitQuaternion families, and build for a no_std target with no allocator so an accidental dynamic type fails to link.
:::

Two more fixed-size tools cover most of what a filter needs. **Solving** $\mathbf{A}\mathbf{x} = \mathbf{b}$ without an allocation:

```rust
let a = Matrix2::new(4.0, 1.0, 1.0, 3.0);
let b = Vector2::new(1.0, 2.0);
let x = a.lu().solve(&b).expect("A is invertible");
// x = [0.09090909090909091, 0.6363636363636364]
```

That is $x_1 = 1/11$ and $x_2 = 7/11$. Check the first row: $4 \cdot \tfrac{1}{11} + \tfrac{7}{11} = \tfrac{11}{11} = 1$. Check the second: $\tfrac{1}{11} + 3 \cdot \tfrac{7}{11} = \tfrac{22}{11} = 2$. Both match $\mathbf{b}$. `solve` returns an `Option`, `None` if the matrix cannot be inverted, so the singular case is visible in the type.

**Views** into a block, with the block size in the type:

```rust
let mut p = SMatrix::<f64, 6, 6>::zeros();
p.fixed_view_mut::<3, 3>(0, 0).fill_with_identity();
p.fixed_view_mut::<3, 3>(3, 3).fill_with_identity();
p.fixed_view_mut::<3, 3>(3, 3).scale_mut(0.25);
let vel_block = p.fixed_view::<3, 3>(3, 3);
// vel_block.trace() = 0.75
```

`fixed_view::<3, 3>(3, 3)` means "a 3 by 3 window whose top-left corner is at row 3, column 3". It borrows the numbers in place; nothing is copied. The velocity block holds $0.25$ three times on its diagonal, so its trace (the sum of the diagonal) is $3 \times 0.25 = 0.75$.

::: warning Fixed size is not free size
An `SMatrix` lives wherever you put it, and on a microcontroller the stack is often only a few kilobytes. A 6 by 6 `f64` covariance is 288 bytes, fine. A `SMatrix<f64, 100, 100>` is $100 \times 100 \times 8 = 80000$ bytes, and one of those as a local variable will overflow a small stack before any code in the function runs. Keep big fixed-size matrices in a `static` or inside a struct that is itself in a `static`, and count them in `.bss`.
:::

## Making "never allocates" a build check

Saying "we only use fixed-size types" in a code review is a promise. Promises slip, especially when someone adds a quick debugging helper late on a Friday. You want the build to break instead.

Lesson 01 showed the trick: a `no_std` program with **no allocator** cannot link anything that needs the heap. nalgebra supports this directly. Its default features include `std`; turning them off gives a `no_std` library, and the `libm` feature supplies `sqrt`, `sin` and friends from the pure-Rust [[libm|libm-crate]] maths library, since `core` has none of them:

```toml
[dependencies]
nalgebra = { version = "0.35.0", default-features = false, features = ["libm"] }
```

With that line, the dynamic types are not merely unused; they do not exist. `DMatrix` is only defined when the `std` or `alloc` feature is on. Here is a real `no_std` [[Kalman filter|kalman-filter]] library, followed by what happens when someone tries to sneak a `DMatrix` into it.

::: example A no_std Kalman filter that cannot allocate
```rust
#![no_std]

use nalgebra::{Matrix1x2, Matrix2, Vector2};

/// A two-state Kalman filter (position, velocity) for one axis.
/// Every matrix has its size fixed in its type, so nothing allocates.
pub struct Kf1d {
    pub x: Vector2<f64>, // state estimate
    pub p: Matrix2<f64>, // covariance
}

impl Kf1d {
    pub fn predict(&mut self, dt: f64, q: &Matrix2<f64>) {
        let f = Matrix2::new(1.0, dt, 0.0, 1.0);
        self.x = f * self.x;
        self.p = f * self.p * f.transpose() + q;
    }

    /// Fuse one position measurement `z` with variance `r`.
    pub fn update(&mut self, z: f64, r: f64) {
        let h = Matrix1x2::new(1.0, 0.0);
        let s = (h * self.p * h.transpose())[(0, 0)] + r; // innovation variance
        let k = self.p * h.transpose() / s;               // Kalman gain, 2x1
        let innovation = z - (h * self.x)[(0, 0)];
        self.x += k * innovation;
        self.p = (Matrix2::identity() - k * h) * self.p;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_step() {
        let mut kf = Kf1d { x: Vector2::new(0.0, 1.0), p: Matrix2::new(4.0, 0.0, 0.0, 1.0) };
        let q = Matrix2::new(0.001, 0.0, 0.0, 0.01);
        kf.predict(0.1, &q);
        kf.update(0.2, 1.0);
        assert!((kf.x[0] - 0.180_043_903).abs() < 1e-8);
    }
}
```

Where does `0.180_043_903` come from? Work it by hand. The prediction moves the state from $(0, 1)$ to $(0 + 0.1 \cdot 1, 1) = (0.1, 1)$ and, as in the first example, the covariance to $\begin{bmatrix} 4.011 & 0.1 \\ 0.1 & 1.01 \end{bmatrix}$. Then the update:

- The innovation variance is $s = 4.011 + 1 = 5.011$ (predicted position variance plus sensor variance).
- The gain is the first column of $\mathbf{P}$ divided by $s$: $k_1 = 4.011 / 5.011 \approx 0.80044$ and $k_2 = 0.1 / 5.011 \approx 0.019956$.
- The innovation is measurement minus prediction: $0.2 - 0.1 = 0.1\,\mathrm{m}$.
- The new position is $0.1 + 0.80044 \times 0.1 \approx 0.180044\,\mathrm{m}$.

The filter trusts the measurement a lot (gain near 0.8) because its own position guess is uncertain ($4\,\mathrm{m^2}$) compared with the sensor ($1\,\mathrm{m^2}$). `cargo test` on the laptop passed, and `cargo build --release --target thumbv7em-none-eabihf` built the same library for the chip.

Linked into a small cortex-m-rt program that runs `predict` and `update` in a loop and writes the position to one `static f64`, the sections were:

```text
section             size        addr
.vector_table       1024   134217728
.text               4320   134218752
.rodata                0   134223072
.data                  0   536870912
.bss                   8   536870912
```

The whole filter, with its matrix arithmetic, is about 4.3 KB of code. RAM use is 8 bytes of `.bss`, the one `f64` static; the filter's own 48 bytes (a 2-vector and a 2 by 2 matrix of `f64`) live on the stack. There is no heap because there is no allocator.

Now add one line that uses a dynamic matrix:

```rust
pub fn trace_of_identity(n: usize) -> f64 {
    nalgebra::DMatrix::<f64>::identity(n, n).trace()
}
```

The chip build refuses at once:

```text
error[E0433]: failed to resolve: could not find `DMatrix` in `nalgebra`
```

And if someone turns on nalgebra's `alloc` feature to make `DMatrix` appear, the firmware still fails to build, now at the final link:

```text
error: no global memory allocator found but one is required; link to std or add `#[global_allocator]` to a static item that implements the GlobalAlloc trait
```

Either way, the allocation never reaches the chip.
:::

This is the same move as the Eigen trick you may know from C++, where a test build makes any `malloc` inside Eigen stop the program. The difference is when it bites: the Rust version fails while building, before any test runs.

## nalgebra next to Eigen

If you have used **Eigen**, the C++ library behind a great deal of GNC code, the fixed-size half of nalgebra will feel familiar. `Eigen::Matrix3d` is a 3 by 3 of `double` whose size is a template parameter, as `Matrix3<f64>` is a 3 by 3 whose size is a type parameter.

::: key SMatrix<f64,3,3> versus Eigen::Matrix3d
Same: compile-time dimensions, stack storage, no allocation, dimension checking at compile time. Different: nalgebra dimensions are type-level parameters integrated with the trait system, it has no expression-template layer of Eigen sophistication, and its geometry types make the unit-quaternion invariant part of the type.
:::

Take the three differences one at a time.

**Dimensions in the trait system.** Rust generics are checked when the generic code is *written*, against the traits it asks for; C++ templates are checked when they are *used*. That is why the shape error above names a trait, `DimEq<Const<3>, Const<2>>`. It also means you can write a function generic over any size, such as `fn predict<const N: usize>(p: &SMatrix<f64, N, N>)`, and the compiler checks it once for all `N`.

**No expression templates.** Eigen uses a C++ technique called **[[expression templates|expression-templates]]**: `a + b + c` builds a description of the sum and evaluates it in one loop at the `=`, with no temporary matrices. nalgebra evaluates each operation as it goes. For small fixed-size matrices the optimizer usually removes the difference; for large dynamic ones Eigen can be faster.

**Invariants in the type.** nalgebra's geometry module has `UnitQuaternion`, a quaternion that is guaranteed to have length 1, and `Rotation3`, a matrix guaranteed to be a proper rotation. Eigen has quaternions too, but nothing in their type says "normalized". The next lesson is about those types.

## Check yourself

::: check
Read these types aloud and say whether each one's numbers live inline or on the heap: `Matrix3<f32>`, `SVector<f64, 9>`, `DVector<f64>`, `SMatrix<f64, 4, 2>`.
:::

::: answer
`Matrix3<f32>`: a 3 by 3 of `f32`, inline, $9 \times 4 = 36$ bytes. `SVector<f64, 9>`: a fixed 9-element column of `f64`, inline, 72 bytes. `DVector<f64>`: a column of `f64` whose length is chosen at run time, stored on the heap. `SMatrix<f64, 4, 2>`: 4 rows, 2 columns of `f64`, inline, 64 bytes. Only the `D` type allocates.
:::

::: check
A teammate writes `let k = p * h;` where `p` is `Matrix2<f64>` and `h` is `Matrix1x2<f64>`. What happens, and what did they probably mean?
:::

::: answer
It does not compile. `p` is 2 by 2 and `h` is 1 by 2, so the product would need the columns of `p` (2) to equal the rows of `h` (1), and `DimEq<Const<2>, Const<1>>` does not exist. They probably meant `p * h.transpose()`, a 2 by 2 times a 2 by 1, giving the 2 by 1 gain numerator used in the Kalman update.
:::

::: check
Why is `size_of::<DMatrix<f64>>()` the same 40 bytes for a 2 by 2 matrix and a 1000 by 1000 matrix, and what does that tell you about where a `DMatrix` keeps its numbers?
:::

::: answer
The `DMatrix` value itself holds only a `Vec` (pointer, capacity, length) and its two dimensions. The numbers are in a separate heap block that the pointer points to. `size_of` measures only the value, not the heap block, so it is the same for every size. A fixed-size matrix, by contrast, contains its numbers, so its `size_of` grows with it.
:::

::: check
Your flight library's `Cargo.toml` says `nalgebra = "0.35"`. A reviewer says this does not prove the filter is allocation-free. Why not, and what two changes make it a build-time guarantee?
:::

::: answer
With default features, nalgebra has `std` on, so `DMatrix` exists and the program links with the system allocator; an accidental `DMatrix` would compile and run. First, use `default-features = false` (with `features = ["libm"]` for the maths functions), so the library is `no_std` and `DMatrix` is not even defined. Second, build the final program for a `no_std` target such as `thumbv7em-none-eabihf` with no global allocator, so that even if some crate turns on `alloc`, any heap use fails to link.
:::

::: check
A GNC engineer moving from C++ asks: "Is `SMatrix<f64, 3, 3>` just `Eigen::Matrix3d` with a different name?" Give one way it is the same and two ways it differs.
:::

::: answer
Same: both have their dimensions fixed when compiling, store their nine numbers inline with no allocation, and reject mismatched shapes at compile time. Different: nalgebra's dimensions are types checked through Rust's trait system (so generic code over any size is checked once, and errors name a trait such as `DimEq`), and nalgebra has no expression-template machinery like Eigen's, evaluating each operation directly. A third difference is that nalgebra's geometry types, like `UnitQuaternion`, carry their invariant in the type.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| `Matrix<T, R, C, S>` | The one matrix type | Number type, rows, columns, storage |
| `Const<N>` / `Dyn` | Size known when compiling / when running | Dimensions are types |
| `SMatrix<T, R, C>`, `Matrix3`, `Vector3` | Fixed-size aliases | `ArrayStorage`, inline, no heap |
| `DMatrix<T>`, `DVector<T>` | Dynamic aliases | `VecStorage`, heap, shape errors panic at run time |
| `Matrix3::new(...)` | Arguments row by row | Stored column-major; `m[(row, col)]` |
| Shape check | Mismatched product | Compile error `DimEq<Const<3>, Const<2>>` |
| `lu().solve`, `fixed_view` | Solve and block views | No allocation for fixed sizes |
| no-alloc guarantee | `default-features = false`, `libm`, no allocator | `DMatrix` vanishes or fails to link |
| vs Eigen | Same fixed-size idea | Traits instead of templates; no expression templates |

The next lesson builds on these fixed-size matrices with nalgebra's geometry types, `UnitQuaternion`, `Rotation3` and `Isometry3`, and meets the neighbouring crates a Rust GNC stack uses.

::: context type-alias A nickname for a long type
A type alias is declared with `type`, for example `pub type Matrix3<T> = Matrix<T, U3, U3, ArrayStorage<T, 3, 3>>;`, which is how nalgebra defines it. The alias is not a new type; it is the same type under a shorter name, so a `Matrix3<f64>` and a `SMatrix<f64, 3, 3>` are interchangeable. (`U3` is another alias, for `Const<3>`.) Aliases are why nalgebra's documentation pages for `Matrix3` show few methods: almost all of them are defined once, on `Matrix`.
:::

::: context const-generics Numbers inside angle brackets
Rust generics were originally only over types, so early nalgebra spelled numbers as types, `U1`, `U2`, `U3` and so on, built with a type-level-numbers library. Since Rust 1.51 in 2021, generics can also take constant values, as in `[T; N]` or `SMatrix<T, 6, 6>`. nalgebra's `Const<N>` bridges the two worlds: it is a type that carries an ordinary constant, so the old type-based machinery and the new number syntax work together.
:::

::: context column-major Down the columns, not across the rows
Row-major storage (C arrays, NumPy's default) lays out row 0, then row 1. Column-major (Fortran, MATLAB, Eigen's default, nalgebra) lays out column 0, then column 1. Neither is better in general. Column-major suits the classic linear-algebra routines from Fortran's LAPACK, and it keeps a column vector's numbers next to each other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" text-anchor="middle" fill="#1f2a44" stroke="#1f2a44">
    <rect x="20" y="20" width="30" height="30" fill="#8fb8f0"/><text x="35" y="40" stroke="none">1</text>
    <rect x="50" y="20" width="30" height="30" fill="#f2b880"/><text x="65" y="40" stroke="none">2</text>
    <rect x="80" y="20" width="30" height="30" fill="#fff"/><text x="95" y="40" stroke="none">3</text>
    <rect x="20" y="50" width="30" height="30" fill="#8fb8f0"/><text x="35" y="70" stroke="none">4</text>
    <rect x="50" y="50" width="30" height="30" fill="#f2b880"/><text x="65" y="70" stroke="none">5</text>
    <rect x="80" y="50" width="30" height="30" fill="#fff"/><text x="95" y="70" stroke="none">6</text>
  </g>
  <text x="65" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">matrix as written</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44" stroke="#1f2a44">
    <rect x="150" y="35" width="30" height="30" fill="#8fb8f0"/><text x="165" y="55" stroke="none">1</text>
    <rect x="180" y="35" width="30" height="30" fill="#8fb8f0"/><text x="195" y="55" stroke="none">4</text>
    <rect x="210" y="35" width="30" height="30" fill="#f2b880"/><text x="225" y="55" stroke="none">2</text>
    <rect x="240" y="35" width="30" height="30" fill="#f2b880"/><text x="255" y="55" stroke="none">5</text>
    <rect x="270" y="35" width="30" height="30" fill="#fff"/><text x="285" y="55" stroke="none">3</text>
    <rect x="300" y="35" width="30" height="30" fill="#fff"/><text x="315" y="55" stroke="none">6</text>
  </g>
  <text x="240" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">in memory, column by column</text>
</svg>
```
:::

::: context shape-constraint How a trait does linear algebra
nalgebra's multiplication is implemented only when a hidden helper type, `ShapeConstraint`, implements `DimEq<C1, R2>`, "the left columns equal the right rows". It implements `DimEq<D, D>` for any dimension `D` equal to itself, plus the mixed cases where one side is `Dyn` (checked at run time instead). So `DimEq<Const<3>, Const<3>>` exists and `DimEq<Const<3>, Const<2>>` does not. The compiler's search for a matching implementation is the dimension check; it costs nothing when the program runs.
:::

::: context blas The library everyone's matrices sit on
BLAS, the Basic Linear Algebra Subprograms, is a set of routine names and interfaces agreed in the 1970s and 1980s, originally in Fortran. Names are short codes: `gemv` is "general matrix times vector", `gemm` is "general matrix times matrix", and a leading `d` or `s` marks `double` or `single` precision. Fast implementations such as OpenBLAS and Intel MKL sit under NumPy, MATLAB and many simulation codes. nalgebra borrows the names for its own internal routines, which is why a Rust panic message mentions `Gemv`.
:::

::: context inline-vs-heap The organizer and the address card
The two layouts side by side. A fixed-size matrix is its numbers. A dynamic matrix is a small header that points to a block the allocator handed out, which is why creating one costs an allocation and why it cannot exist on a chip with no allocator.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">Matrix2&lt;f64&gt;: 32 bytes</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="28" width="25" height="28" fill="#8fb8f0"/>
    <rect x="45" y="28" width="25" height="28" fill="#8fb8f0"/>
    <rect x="70" y="28" width="25" height="28" fill="#8fb8f0"/>
    <rect x="95" y="28" width="25" height="28" fill="#8fb8f0"/>
  </g>
  <text x="70" y="74" font-size="11" text-anchor="middle" fill="#6c7a93">numbers inline</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">DMatrix&lt;f64&gt;: 40 bytes</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="200" y="28" width="40" height="28" fill="#f2b880"/>
    <rect x="240" y="28" width="30" height="28" fill="#fff"/>
    <rect x="270" y="28" width="30" height="28" fill="#fff"/>
    <rect x="300" y="28" width="25" height="28" fill="#fff"/>
    <rect x="325" y="28" width="25" height="28" fill="#fff"/>
  </g>
  <text x="220" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">ptr</text>
  <text x="255" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">cap</text>
  <text x="285" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">len</text>
  <text x="312" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">r</text>
  <text x="337" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">c</text>
  <line x1="220" y1="56" x2="220" y2="98" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,104 215,95 225,95" fill="#b4232c"/>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="200" y="106" width="25" height="28" fill="#8fb8f0"/>
    <rect x="225" y="106" width="25" height="28" fill="#8fb8f0"/>
    <rect x="250" y="106" width="25" height="28" fill="#8fb8f0"/>
    <rect x="275" y="106" width="25" height="28" fill="#8fb8f0"/>
  </g>
  <text x="330" y="124" font-size="11" text-anchor="middle" fill="#6c7a93">heap</text>
</svg>
```
:::

::: context libm-crate Where sqrt comes from without an operating system
`core` gives you `+`, `*` and comparisons on floats, but not `sqrt`, `sin` or `atan2`, because on a desktop those come from the C maths library shipped with the operating system. The `libm` crate is a pure-Rust port of the maths library from the musl C library, so it works on a bare chip. nalgebra needs it for norms, square roots in Cholesky, and the trigonometry inside rotations. Lesson 07 compares it with `micromath`, which trades accuracy for speed.
:::

::: context kalman-filter Guess, then correct
A Kalman filter keeps a best guess of the state and a covariance saying how unsure that guess is. Each cycle it predicts forward with a model (the guess moves, the uncertainty grows) and then updates with a measurement (the guess moves toward the sensor by an amount set by the gain, the uncertainty shrinks). The gain is large when the filter trusts the sensor more than its own guess. Rudolf Kalman published it in 1960, and it was soon used in the Apollo navigation computer; it is the core of the estimation modules later in this course.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="120" height="44" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">predict</text>
  <text x="90" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">P grows</text>
  <rect x="210" y="30" width="120" height="44" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">update</text>
  <text x="270" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">P shrinks</text>
  <line x1="150" y1="42" x2="204" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="210,42 202,38 202,46" fill="#1f2a44"/>
  <line x1="210" y1="64" x2="156" y2="64" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="150,64 158,60 158,68" fill="#1f2a44"/>
  <text x="270" y="96" font-size="11" text-anchor="middle" fill="#b4232c">measurement z</text>
  <text x="90" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">model F, noise Q</text>
</svg>
```
:::

::: context expression-templates Adding three matrices without temporaries
In plain code, `d = a + b + c` computes `a + b` into a temporary matrix, then adds `c` into another. Eigen's `operator+` instead returns a lightweight object meaning "the sum of these two", and only the final assignment runs one loop over the elements, computing `a[i] + b[i] + c[i]` directly. For big matrices that saves memory traffic. It is also why Eigen's compiler errors are famously long, and why `auto x = a + b;` in Eigen can hold a dangling description instead of a result, a classic C++ bug nalgebra cannot have.
:::
