---
id: l04-array-versus-matrix-reductions-broadcasting
title: Arrays versus matrices, reductions and broadcasting
minutes: 21
covers:
  - Coefficient-wise operations via .array() versus matrix operations
  - Reductions and broadcasting
---

Think about a spreadsheet of test scores: one row per student, one column per quiz. Sometimes you want to do something to every cell on its own, such as adding five bonus points to each score. Sometimes you want to squash a whole column down to one number, such as the class average for quiz 3. And sometimes you want to take one row of numbers and apply it to every row, such as subtracting each quiz's average from every student's score to see who is above or below it.

Those three moves have names. Doing the same thing to each cell on its own is a **coefficient-wise** operation (Eigen calls every entry of a matrix a **[[coefficient|coefficient-word]]**). Squashing many numbers down to one is a **reduction**. Stretching one row or column so it applies to every row or column is **broadcasting**. You met all three in NumPy. This lesson shows how Eigen spells them, and the one place where Eigen and NumPy disagree so sharply that it causes real bugs: what the `*` sign means.

On a flight computer these moves are everywhere. Calibrating an inertial sensor multiplies each axis by its own scale factor: coefficient-wise. Checking whether a residual is too large takes its length: a reduction. Removing a sensor's average offset from a batch of samples: broadcasting.

## Two meanings of multiply

A `Matrix` in Eigen is a linear-algebra object. Its operators mean what they mean in a linear-algebra textbook. So `a * b` for two matrices is the **matrix product**: each entry of the answer is a row of `a` times a column of `b`, multiplied pair by pair and added up. That is the product that rotates a vector, chains two rotations, or pushes a covariance forward in time. If you need a refresher on how it works, the note on the **[[row-times-column rule|row-times-column]]** walks through one entry.

There is a second, humbler kind of multiply: multiply the entries that sit in the same spot. Top-left times top-left, and so on. This is the **coefficient-wise product** (also called the element-wise or Hadamard product). It is what NumPy's `*` does.

Eigen keeps these two apart by type. To get coefficient-wise behavior, you switch the object into an **`Array`** view with `.array()`. An `Array` holds the same numbers, laid out the same way, but its operators all work entry by entry. `.matrix()` switches back.

::: example The same two matrices, two different products
```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix2d a;
    a << 1, 2,
         3, 4;
    Eigen::Matrix2d b;
    b << 10, 20,
         30, 40;

    const Eigen::Matrix2d product = a * b;                    // matrix product
    const Eigen::Matrix2d elementwise = a.array() * b.array(); // coefficient-wise
    const Eigen::Matrix2d same = a.cwiseProduct(b);            // same thing, no .array()

    std::cout << "a * b =\n" << product << "\n\n";
    std::cout << "a.array() * b.array() =\n" << elementwise << "\n\n";
    std::cout << "a.cwiseProduct(b) =\n" << same << "\n";
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3`:

```text
a * b =
 70 100
150 220

a.array() * b.array() =
 10  40
 90 160

a.cwiseProduct(b) =
 10  40
 90 160
```

Check the top-left entry of each by hand.

1. Matrix product: row 1 of `a` is $(1, 2)$, column 1 of `b` is $(10, 30)$. Multiply pairs and add: $1 \times 10 + 2 \times 30 = 10 + 60 = 70$. That matches.
2. Coefficient-wise: top-left times top-left is $1 \times 10 = 10$. Bottom-right: $4 \times 40 = 160$. That matches too.

Sanity check: the two answers share no entries at all. Same inputs, same symbol, completely different numbers.
:::

::: key
Matrix operators mean linear algebra: `*` is matrix product. Switching to `.array()` makes operators coefficient-wise, so `a.array() * b.array()` is the element-wise product. Mixing the two up is a silent-wrong-answer class of bug.
:::

Notice the last line of the example. Assigning an `Array` expression to a `Matrix` variable is allowed, so you can compute coefficient-wise and store the result in an ordinary matrix. What Eigen refuses is *mixing* the two inside one expression: `a.array() * b` (an array times a matrix) does not compile. Eigen makes you say which world you are in.

`.array()` does not copy anything. It is a thin **[[wrapper|zero-cost-view]]** that changes which operators apply, and the compiler removes it entirely. You can use it inside a tight control loop without worry.

### Why "silent" is the scary word

For two vectors, Eigen catches the confusion. `v * w` for two `Vector3d` is a 3-by-1 times a 3-by-1, which is not a legal matrix product, so the compiler stops with a message that begins `INVALID_VECTOR_VECTOR_PRODUCT__IF_YOU_WANTED_A_DOT_OR_COEFF_WISE_PRODUCT_YOU_MUST_USE_THE_EXPLICIT_FUNCTIONS`. Eigen shouts in capital letters on purpose. You then pick `v.dot(w)`, `v.cross(w)` or `v.cwiseProduct(w)`.

For two *square* matrices of the same size, both products are legal. The compiler cannot know which one you meant. If you type `a * b` but wanted entry-by-entry, the program builds, runs, and prints numbers of the right shape and roughly the right size. Nothing crashes. This is the most dangerous kind of **[[bug|silent-bugs]]**.

::: warning The NumPy habit
In NumPy, `*` is coefficient-wise and `@` is the matrix product. In an Eigen `Matrix`, `*` is the matrix product. When you port a NumPy line like `P * scale` to Eigen, stop and ask which one the original meant. If it was element-wise, write `P.cwiseProduct(scale)` or `(P.array() * scale.array()).matrix()`. A port that "matches NumPy" only on a test with diagonal matrices can hide this, because for diagonal matrices both products happen to agree.
:::

### What else lives only on the array side

Several everyday operations only make sense entry by entry, so Eigen offers them on `Array` and not on `Matrix`:

- adding a plain number to every entry: `v.array() + 1.0` (for a `Matrix`, `v + 1.0` does not compile);
- math functions on each entry: `.abs()`, `.sqrt()`, `.square()`, `.exp()`, `.sin()`;
- comparisons, which give an array of true and false: `v.array() > 0.5`. Follow it with `.count()`, `.any()` or `.all()` to turn it into one answer.

A few coefficient-wise operations are common enough that `Matrix` has them as named methods starting with `cwise`: `cwiseProduct`, `cwiseQuotient`, `cwiseAbs`, `cwiseMin`, `cwiseMax`. They do the same as the array version and read well in matrix-heavy code.

## Reductions: many numbers in, one number out

A **reduction** walks over every entry and combines them into a single number, the way a class average combines thirty scores into one. Eigen's reductions work on both `Matrix` and `Array`.

| Call | What it returns |
| --- | --- |
| `sum()` | all entries added |
| `prod()` | all entries multiplied |
| `mean()` | `sum()` divided by the number of entries |
| `minCoeff()`, `maxCoeff()` | the smallest and largest entry |
| `squaredNorm()` | sum of the squares of the entries |
| `norm()` | square root of `squaredNorm()` |

For a vector, `norm()` is its length, $\lVert \mathbf{v} \rVert = \sqrt{v_1^2 + v_2^2 + v_3^2}$. Read $\lVert \mathbf{v} \rVert$ as "the norm of v". For a matrix, `norm()` squares every entry, adds them all, and takes the square root. That matrix version has its own name, the **[[Frobenius norm|frobenius]]**.

`squaredNorm()` exists because a square root costs time and is often not needed. To check whether a position error is under 5 m, compare its `squaredNorm()` against 25. You get the same yes-or-no answer without the square root.

`minCoeff` and `maxCoeff` can also tell you *where* the extreme sits. Pass them the addresses of index variables and they fill them in.

::: example Every reduction on one small matrix
```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    Eigen::Matrix<double, 2, 3> m;
    m << 1, -2, 3,
         4,  5, -6;

    std::cout << "sum          " << m.sum() << "\n";
    std::cout << "prod         " << m.prod() << "\n";
    std::cout << "mean         " << m.mean() << "\n";
    std::cout << "minCoeff     " << m.minCoeff() << "\n";
    std::cout << "maxCoeff     " << m.maxCoeff() << "\n";
    std::cout << "squaredNorm  " << m.squaredNorm() << "\n";
    std::cout << "norm         " << m.norm() << "\n";

    Eigen::Index r, c;
    const double lowest = m.minCoeff(&r, &c);
    std::cout << "lowest " << lowest << " at row " << r << ", col " << c << "\n";

    std::cout << "colwise().sum()  " << m.colwise().sum() << "\n";
    std::cout << "rowwise().sum()  " << m.rowwise().sum().transpose() << "\n";
    std::cout << "cwiseAbs().maxCoeff() " << m.cwiseAbs().maxCoeff() << "\n";
}
```

Output:

```text
sum          5
prod         720
mean         0.833333
minCoeff     -6
maxCoeff     5
squaredNorm  91
norm         9.53939
lowest -6 at row 1, col 2
colwise().sum()   5  3 -3
rowwise().sum()  2 3
cwiseAbs().maxCoeff() 6
```

Check each line by hand.

1. Sum: $1 - 2 + 3 + 4 + 5 - 6 = 5$.
2. Product: $1 \times (-2) \times 3 \times 4 \times 5 \times (-6)$. Two minus signs cancel, and $1 \cdot 2 \cdot 3 \cdot 4 \cdot 5 \cdot 6 = 720$.
3. Mean: $5 / 6 \approx 0.833$.
4. Squared norm: $1 + 4 + 9 + 16 + 25 + 36 = 91$. Norm: $\sqrt{91} \approx 9.539$.
5. The lowest entry, $-6$, is in row 1, column 2. Eigen counts from 0, like C++ arrays, so that is the second row and third column.
6. The last line is the largest *size* of any entry: `cwiseAbs()` turns $-6$ into $6$ first. This "largest absolute entry" pattern is how tests compare two matrices: take the difference, then `cwiseAbs().maxCoeff()`.

Sanity check: the norm (about 9.5) is bigger than the largest entry (6) and smaller than the sum of all the sizes (21). A length should sit between those two, and it does.
:::

## Partial reductions: one answer per row or per column

The last example sneaked in two new calls: `colwise()` and `rowwise()`. These do a **partial reduction**: instead of squashing the whole matrix to one number, they squash each column (or each row) separately.

Read `m.colwise().sum()` aloud as "for each column, the sum". A 2-by-3 matrix has three columns, so the answer is three numbers, returned as a 1-by-3 row: $(1+4,\ -2+5,\ 3-6) = (5, 3, -3)$.

Read `m.rowwise().sum()` as "for each row, the sum". Two rows give two numbers, returned as a 2-by-1 column: $(1-2+3,\ 4+5-6) = (2, 3)$. The example printed it with `.transpose()` only so it fits on one line.

Every reduction from the table works this way: `colwise().mean()`, `rowwise().maxCoeff()`, `colwise().norm()`, and so on.

::: warning colwise is NumPy's axis=0
NumPy names the axis that disappears: `m.sum(axis=0)` adds *down* the rows and leaves one number per column. Eigen names what each answer belongs to: `colwise()` gives one answer per column. So `colwise()` matches NumPy's **[[axis=0|numpy-axis]]**, and `rowwise()` matches `axis=1`. Before porting, say out loud how many numbers you expect back. If the matrix is 3 by 1000 and you expect 3, you want `rowwise()`.
:::

## Broadcasting: one vector applied to every column

In NumPy, if `A` has shape (3, 5) and `mean` has shape (3, 1), then `A - mean` subtracts that column from every column automatically. NumPy stretches the smaller array to fit. That automatic stretching is **broadcasting**.

Eigen does not stretch anything automatically. `A - mean` with a 3-by-5 matrix and a 3-vector is a compile error, because the sizes differ. You must say which way to stretch:

- `A.colwise() -= v;` subtracts the column vector `v` from **each column** (so `v` must have as many rows as `A`);
- `A.rowwise() -= r;` subtracts the row vector `r` from **each row** (so `r` must have as many columns as `A`).

On a `Matrix`, the broadcast operators are `+`, `-`, `+=` and `-=`. For multiply and divide, switch to arrays: `A.array().colwise() *= s.array()` multiplies row $i$ of `A` by `s(i)`. Being explicit costs a few characters and removes a whole family of NumPy surprises, where a shape that was accidentally (5,) instead of (3, 1) broadcasts into nonsense without a word.

::: example Removing the bias from accelerometer samples
A rocket sits on the pad. Its accelerometer should read Earth's gravity reaction straight up and nothing sideways, but every real sensor has a small constant offset called a **[[bias|sensor-bias]]**. We store five samples as the five columns of a 3-by-5 matrix: rows are the x, y and z axes, in m/s².

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    // Five accelerometer samples taken while the vehicle sits on the pad.
    // Each COLUMN is one sample (x, y, z) in m/s^2.
    Eigen::Matrix<double, 3, 5> samples;
    samples <<  0.02, -0.01,  0.03,  0.00,  0.01,
               -0.05, -0.04, -0.06, -0.05, -0.03,
                9.79,  9.82,  9.80,  9.81,  9.83;

    // 1. Average each row: one mean per axis.
    const Eigen::Vector3d mean = samples.rowwise().mean();
    std::cout << "mean per axis: " << mean.transpose() << "\n";

    // 2. Subtract that mean from every column (broadcasting).
    Eigen::Matrix<double, 3, 5> centered = samples;
    centered.colwise() -= mean;
    std::cout << "centered:\n" << centered << "\n";

    // 3. Length of each sample: one norm per column.
    const Eigen::Matrix<double, 1, 5> g = samples.colwise().norm();
    std::cout << "|a| per sample: " << g << "\n";

    // 4. Spread per axis: root-mean-square of the centered values.
    const Eigen::Vector3d rms =
        (centered.array().square().rowwise().sum() / 5.0).sqrt();
    std::cout << "rms per axis:  " << rms.transpose() << "\n";

    // 5. How many samples read more than 9.805 m/s^2 in total?
    std::cout << "samples above 9.805: " << (g.array() > 9.805).count() << "\n";
}
```

Output:

```text
mean per axis:   0.01 -0.046   9.81
centered:
       0.01       -0.02        0.02       -0.01           0
     -0.004       0.006      -0.014      -0.004       0.016
      -0.02        0.01       -0.01 1.77636e-15        0.02
|a| per sample: 9.79015 9.82009 9.80023 9.81013 9.83005
rms per axis:  0.0141421  0.010198 0.0141421
samples above 9.805: 3
```

Walk through it.

1. **Mean per axis.** We want one number per axis, and each axis is a row, so it is `rowwise().mean()`. For z: $(9.79 + 9.82 + 9.80 + 9.81 + 9.83)/5 = 49.05/5 = 9.81$. For y: $(-0.05 - 0.04 - 0.06 - 0.05 - 0.03)/5 = -0.23/5 = -0.046$.
2. **Centering.** `colwise() -= mean` subtracts the 3-vector from each of the five columns. The first sample's x was $0.02$; minus $0.01$ gives $0.01$. The z entry in column 4 should be $9.81 - 9.81 = 0$ but prints as $1.78 \times 10^{-15}$. That is **[[rounding dust|rounding-dust]]**, not a bug in the program, and lesson 06 explains exactly where it comes from.
3. **Length per sample.** One number per sample, and each sample is a column, so `colwise().norm()`. For sample 1: $\sqrt{0.02^2 + 0.05^2 + 9.79^2} = \sqrt{0.0004 + 0.0025 + 95.8441} = \sqrt{95.847} \approx 9.790$.
4. **Spread.** A chain: `.array()` to go coefficient-wise, `.square()` each entry, `rowwise().sum()` per axis, divide by 5, `.sqrt()` each. For x the centered values are $0.01, -0.02, 0.02, -0.01, 0$; their squares add to $0.0001 + 0.0004 + 0.0004 + 0.0001 + 0 = 0.001$; divide by 5 to get $0.0002$; the square root is $0.0141$ m/s².
5. **Counting.** `g.array() > 9.805` makes five true-or-false values; `.count()` counts the trues. Samples 2, 4 and 5 are above 9.805, so 3.

Sanity check: the z mean is 9.81 m/s², close to standard gravity, 9.80665 m/s², as it should be on the pad. The sideways means are a few hundredths of a m/s², a believable bias for a small **[[MEMS|mems]]** sensor. The spreads are about 0.01 m/s², smaller than the biases, which is why averaging many samples before launch is worth doing.
:::

::: key
Reductions: `sum`, `prod`, `mean`, `minCoeff`, `maxCoeff`, `squaredNorm`, `norm`. `colwise()` gives one result per column (NumPy `axis=0`); `rowwise()` gives one per row (NumPy `axis=1`). Broadcasting is explicit: `A.colwise() -= v` subtracts `v` from every column; `A.rowwise() -= r` subtracts `r` from every row.
:::

### Calibration: scale then subtract

A gyroscope reports raw integer counts. Turning counts into radians per second needs a per-axis scale factor, then a per-axis bias subtracted. That is two broadcasts in a row, one multiply and one subtract:

```cpp
Eigen::Matrix<double, 3, 4> counts;
counts << 100, 120, -40,  0,
           10,  20,  30, 40,
           -5,  -5,  -5, -5;
const Eigen::Vector3d scale(0.001, 0.002, 0.004);   // rad/s per count
const Eigen::Vector3d bias(0.01, 0.0, -0.02);        // rad/s

Eigen::Matrix<double, 3, 4> rate = counts;
rate.array().colwise() *= scale.array();   // scale row i by scale(i)
rate.colwise() -= bias;                    // subtract bias from every column
// rate:
//  0.09  0.11 -0.05 -0.01
//  0.02  0.04  0.06  0.08
//     0     0     0     0
```

Check the first column: $100 \times 0.001 - 0.01 = 0.09$; $10 \times 0.002 - 0 = 0.02$; $-5 \times 0.004 - (-0.02) = -0.02 + 0.02 = 0$. The multiply had to go through `.array()`, because on the matrix side a column vector "times" each column has no linear-algebra meaning.

A clamp is a coefficient-wise operation too. `rate.cwiseMax(-0.1).cwiseMin(0.1)` limits every entry to $\pm 0.1$ rad/s, which turns the $0.11$ into $0.1$ and leaves the rest alone. Rate limits like this sit at the end of many control loops, in front of the actuator.

::: warning Order of the broadcast and the size check
`colwise()` wants a vector with as many entries as the matrix has **rows**. If your samples are stored one per *row* instead (a 1000-by-3 matrix, which is how a CSV file often arrives), the per-axis mean is `colwise().mean()` and the subtraction is `rowwise() -= mean.transpose()`. With fixed-size types, getting this backwards is a compile error, which is one more reason to prefer them. With `MatrixXd`, it is a runtime assertion in a debug build and undefined behavior in a release build.
:::

## Check yourself

::: check
`R` is a `Matrix3d` holding a rotation, and `gains` is a `Matrix3d` of per-entry weights. A colleague writes `R * gains` meaning "weight each entry of `R`". What does the code compute, will the compiler complain, and how do you fix it?
:::

::: answer
`R * gains` between two `Matrix` objects is the matrix product: each entry is a row of `R` times a column of `gains`, added up. Both are 3 by 3, so the product is legal and the compiler says nothing. The program runs and gives wrong numbers. To weight entry by entry, write `R.cwiseProduct(gains)` or `(R.array() * gains.array()).matrix()`.
:::

::: check
`v` is the `Vector3d` $(3, -4, 12)$. Give `v.sum()`, `v.squaredNorm()`, `v.norm()`, `v.maxCoeff()` and `v.cwiseAbs().maxCoeff()`.
:::

::: answer
Sum: $3 - 4 + 12 = 11$. Squared norm: $9 + 16 + 144 = 169$. Norm: $\sqrt{169} = 13$. Largest entry: $12$. Largest absolute value: the sizes are $3, 4, 12$, so $12$. (Here the largest entry and the largest size agree; for $(3, -14, 12)$ they would not: `maxCoeff()` would give $12$ but `cwiseAbs().maxCoeff()` would give $14$.)
:::

::: check
`X` is a 6-by-200 matrix: 200 state vectors from a Monte Carlo run, one per column. Write one line that gives the average state (a 6-vector), and one line that makes `X` hold each state minus that average. What NumPy calls would you use if `X` were a NumPy array of shape (6, 200)?
:::

::: answer
The average state has one number per row (per state component), so it is `Eigen::VectorXd mu = X.rowwise().mean();`. Subtracting it from every column is `X.colwise() -= mu;`. In NumPy: `mu = X.mean(axis=1, keepdims=True)` and `X -= mu`. The `keepdims=True` makes `mu` shape (6, 1) so NumPy broadcasts it across the 200 columns.
:::

::: check
Why does `v + 1.0` fail to compile for an `Eigen::Vector3d v`, and what are two ways to add 1 to every entry?
:::

::: answer
A `Matrix` follows linear-algebra rules, and adding a plain number to a vector is not a linear-algebra operation, so Eigen does not define it. To add 1 to every entry, go coefficient-wise: `v.array() + 1.0` (store it in a `Vector3d` if you like), or add a vector of ones: `v + Eigen::Vector3d::Ones()`.
:::

::: check
You want to know how many of the 1,000 range residuals in an `Eigen::VectorXd r` are larger than 3 m in size, either sign. Write the expression and say what each piece does.
:::

::: answer
`(r.array().abs() > 3.0).count()`. `.array()` switches to coefficient-wise operators; `.abs()` takes the size of each residual; `> 3.0` compares each one, giving 1,000 true-or-false values; `.count()` reduces them to the number of trues. The same thing can be written `(r.cwiseAbs().array() > 3.0).count()`.
:::

## Summary

| Idea | Eigen spelling | Meaning |
| --- | --- | --- |
| Matrix product | `a * b` on `Matrix` | rows of `a` times columns of `b` |
| Coefficient-wise product | `a.array() * b.array()` or `a.cwiseProduct(b)` | entry times entry, same spot |
| Switch views | `.array()`, `.matrix()` | no copy; changes what the operators mean |
| Array-only operations | `+ scalar`, `.abs()`, `.sqrt()`, `.square()`, `> x` | work entry by entry |
| Full reductions | `sum`, `prod`, `mean`, `minCoeff`, `maxCoeff`, `squaredNorm`, `norm` | whole matrix to one number |
| Partial reductions | `colwise().f()`, `rowwise().f()` | one result per column / per row (NumPy `axis=0` / `axis=1`) |
| Broadcasting | `A.colwise() -= v`, `A.rowwise() -= r` | explicit; `*` and `/` need `.array()` |
| Largest difference | `(a - b).cwiseAbs().maxCoeff()` | how tests compare two results |

Next, **Expression templates, aliasing, eval() and noalias()** looks under the hood of every line you wrote here. None of these expressions is computed where you write it: Eigen builds a recipe and runs it only at the `=`, which is what makes it fast and what creates the one trap you must learn to spot.

::: context coefficient-word Why "coefficient" and not "element"
In algebra, a coefficient is the number in front of a variable: in $3x + 5y$, the coefficients are 3 and 5. A matrix is a compact way to write the coefficients of a set of equations, so its entries inherited the name. Eigen uses "coefficient" everywhere: `coeff(i, j)`, `minCoeff()`, `cwiseProduct` (the "cwise" is short for coefficient-wise). NumPy says "element" for the same thing. They are two words for one idea.
:::

::: context row-times-column One entry of a matrix product
To find the entry in row $i$, column $j$ of $\mathbf{A}\mathbf{B}$, lay row $i$ of $\mathbf{A}$ alongside column $j$ of $\mathbf{B}$, multiply the pairs, and add. For the top-left entry of the lesson's example: $1 \times 10 + 2 \times 30 = 70$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="70" height="26" fill="#8fb8f0" stroke="#1d6fd1"/>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="37" y="58">1</text><text x="72" y="58">2</text>
    <text x="37" y="90">3</text><text x="72" y="90">4</text>
  </g>
  <text x="55" y="125" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="110" y="75" font-size="16" fill="#1f2a44" text-anchor="middle">×</text>
  <rect x="130" y="40" width="34" height="58" fill="#f2b880" stroke="#b4232c"/>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="147" y="58">10</text><text x="187" y="58">20</text>
    <text x="147" y="90">30</text><text x="187" y="90">40</text>
  </g>
  <text x="165" y="125" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="222" y="75" font-size="16" fill="#1f2a44" text-anchor="middle">→</text>
  <text x="300" y="58" font-size="13" fill="#1f2a44" text-anchor="middle">1×10 + 2×30</text>
  <text x="300" y="82" font-size="14" fill="#b4232c" text-anchor="middle" font-weight="700">= 70</text>
  <text x="300" y="125" font-size="12" fill="#6c7a93" text-anchor="middle">top-left of a * b</text>
</svg>
```

A 3-by-3 product does this nine times, with three multiplications each.
:::

::: context zero-cost-view A different pair of glasses
Think of `.array()` as putting on a different pair of glasses. The numbers on the page do not change; you read them differently. In C++ terms, `.array()` returns a small wrapper object that holds a reference to the original matrix and nothing else. Its type has different operators defined on it. After the compiler inlines everything, the wrapper leaves no trace in the machine code, so the choice between `.array()` and `cwiseProduct` is about which reads better, not speed.
:::

::: context silent-bugs The bugs that do not crash
A crash is annoying, but it is loud: someone notices, a test fails, the fault is found. A wrong answer with the right shape is quiet. It flows into the next calculation and the one after, and may only show up as a filter that "drifts a little" in flight. That is why flight software teams value anything that turns a quiet mistake into a compile error, and why Eigen refuses to mix arrays and matrices in one expression. The best defense for the square-matrix case is a unit test against numbers you worked out independently, with a non-diagonal matrix.
:::

::: context frobenius A length for a whole matrix
Pretend the matrix's entries are unrolled into one long vector and take that vector's ordinary length. That is the Frobenius norm, named after the German mathematician Ferdinand Georg Frobenius:

$$
\lVert \mathbf{A} \rVert_F = \sqrt{\sum_{i}\sum_{j} a_{ij}^2}
$$

It is the easiest matrix size to compute, and it is what Eigen's `norm()` returns for a matrix. Other matrix norms exist, and one of them, the largest stretch a matrix can apply to a vector, is the one behind the condition number in lesson 06.
:::

::: context numpy-axis The axis that disappears
NumPy's `axis` argument names the direction you travel while adding. `axis=0` travels down the rows, so the rows disappear and one number per column is left. Eigen's `colwise()` names the columns that each get an answer. Two descriptions of the same result.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#ffffff">
    <rect x="30" y="20" width="36" height="28"/><rect x="66" y="20" width="36" height="28"/><rect x="102" y="20" width="36" height="28"/>
    <rect x="30" y="48" width="36" height="28"/><rect x="66" y="48" width="36" height="28"/><rect x="102" y="48" width="36" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="39">1</text><text x="84" y="39">-2</text><text x="120" y="39">3</text>
    <text x="48" y="67">4</text><text x="84" y="67">5</text><text x="120" y="67">-6</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="48" y1="80" x2="48" y2="100"/><line x1="84" y1="80" x2="84" y2="100"/><line x1="120" y1="80" x2="120" y2="100"/>
  </g>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="30" y="104" width="36" height="26"/><rect x="66" y="104" width="36" height="26"/><rect x="102" y="104" width="36" height="26"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="122">5</text><text x="84" y="122">3</text><text x="120" y="122">-3</text>
  </g>
  <text x="250" y="60" font-size="13" fill="#1f2a44" text-anchor="middle">Eigen: m.colwise().sum()</text>
  <text x="250" y="84" font-size="13" fill="#1f2a44" text-anchor="middle">NumPy: m.sum(axis=0)</text>
  <text x="250" y="122" font-size="12" fill="#6c7a93" text-anchor="middle">one answer per column</text>
</svg>
```
:::

::: context sensor-bias Why a sensor at rest is not zero
No two sensors are built exactly alike. Tiny differences in the chip, its mounting and its temperature make an accelerometer report a small reading even with no acceleration on that axis. The part that stays roughly constant is the bias. Navigation systems estimate it before launch while the vehicle is still, and many filters keep estimating it in flight as extra states. An uncorrected bias of 0.01 m/s² sounds tiny, but integrated twice for ten minutes it grows to a position error of $\frac{1}{2} \times 0.01 \times 600^2 = 1800$ m.
:::

::: context rounding-dust One step on the number ruler
The number 9.81 cannot be stored exactly in binary, and adding five samples and dividing by 5 rounds a little at every step. The average Eigen computed came out one step below the stored 9.81, where one step is the smallest gap between neighboring `double` values near 9.81: $2^{-49} \approx 1.78 \times 10^{-15}$. That is the "dust" you see.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#6c7a93" stroke-width="2">
    <line x1="40" y1="52" x2="40" y2="68"/><line x1="100" y1="52" x2="100" y2="68"/>
    <line x1="280" y1="52" x2="280" y2="68"/><line x1="320" y1="52" x2="320" y2="68"/>
  </g>
  <line x1="160" y1="46" x2="160" y2="74" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="220" y1="46" x2="220" y2="74" stroke="#b4232c" stroke-width="3"/>
  <text x="160" y="36" font-size="12" fill="#1d6fd1" text-anchor="middle">computed mean</text>
  <text x="228" y="22" font-size="12" fill="#b4232c" text-anchor="middle">stored 9.81</text>
  <line x1="222" y1="26" x2="220" y2="44" stroke="#b4232c" stroke-width="1"/>
  <line x1="160" y1="88" x2="220" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="160,88 168,84 168,92" fill="#1f2a44"/>
  <polygon points="220,88 212,84 212,92" fill="#1f2a44"/>
  <text x="190" y="108" font-size="12" fill="#1f2a44" text-anchor="middle">one step: 2^-49 ≈ 1.78e-15</text>
  <text x="70" y="96" font-size="11" fill="#6c7a93" text-anchor="middle">neighbors</text>
  <text x="300" y="96" font-size="11" fill="#6c7a93" text-anchor="middle">neighbors</text>
</svg>
```

A `double` cannot hold any value between two ticks, so every result snaps to one of them. The dust is fifteen digits below the numbers you care about. Lesson 06 builds the full picture: how big these steps are, when they pile up, and when they suddenly matter.
:::

::: context mems Sensors on a chip
MEMS stands for micro-electro-mechanical systems: tiny moving structures etched into silicon, the same technology as the motion sensor in a phone. A MEMS accelerometer measures how far a microscopic mass on springs is pushed as the chip accelerates. They are small, cheap and light, so drones, small launchers and CubeSats use them widely. Their biases are larger and drift more than those of the expensive fiber-optic or ring-laser units used on many larger vehicles, which is why the bias-removal code in this lesson matters so much for them.
:::
