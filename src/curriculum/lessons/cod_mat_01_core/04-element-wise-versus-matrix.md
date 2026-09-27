---
id: l04-element-wise-versus-matrix
title: Element-wise versus matrix operations
minutes: 21
covers:
  - Element-wise .* ./ .^ versus matrix * / ^ (the single most common beginner error)
---

Imagine you and a friend come back from the store with the same shopping list. You have two lists of numbers: how many of each thing you bought, and what each thing cost. There are two quite different questions you could ask by "multiplying" those lists.

- **What did each line of the receipt cost?** Multiply the first quantity by the first price, the second by the second, and so on. You get a new list, the same length as the old ones.
- **What was the total bill?** Do the same multiplications and then add them all up. You get one number.

Both are fair uses of the word "multiply", and they give completely different answers. MATLAB has a separate operator for each, and they differ by a single character: a dot. In the last two lessons you saw that every MATLAB value is a grid of numbers (a matrix) and how to pick parts of it out. This lesson is about doing arithmetic on those grids, and about the one dot that causes more wrong answers in beginner MATLAB than anything else.

On a GNC team you need both kinds of multiply every day. Turning a velocity measured in the rocket's own axes into the ground's axes is a true matrix multiply, using a **[[direction cosine matrix|dcm]]** (a 3-by-3 grid that describes how one set of axes is turned relative to another). Computing the air pressure on the nose at every one of ten thousand points along a trajectory is the one-number-at-a-time kind. Mix them up and MATLAB will often not complain. It will hand you numbers that look reasonable and are wrong.

## The matrix product: rows meet columns

Start with the "total bill" idea. Put the quantities in a **row vector** (a 1-by-n grid, one row) and the prices in a **column vector** (an n-by-1 grid, one column). The **matrix product** of a row and a column multiplies matching entries and adds the results. That single sum is the **[[dot product|dot-product]]** of the two lists.

```matlab
>> qty   = [2 1 3];          % a row: 1-by-3
>> price = [4; 5; 6];        % a column: 3-by-1
>> qty * price
% ans = 31
```

Check it by hand: $2 \cdot 4 + 1 \cdot 5 + 3 \cdot 6 = 8 + 5 + 18 = 31$.

A bigger matrix product is the same idea repeated. To find the entry in row $i$ and column $j$ of $\mathbf{A}\mathbf{B}$ (read "A times B"), take row $i$ of $\mathbf{A}$, take column $j$ of $\mathbf{B}$, and form their dot product. In symbols,

$$
(\mathbf{A}\mathbf{B})_{ij} = \sum_{k} A_{ik} B_{kj}.
$$

Read $A_{ik}$ as "A sub i k": the entry of $\mathbf{A}$ in row $i$, column $k$. The big $\sum$ ("sigma", the sum sign) means add up over every value of $k$.

For that to work, each row of $\mathbf{A}$ must be exactly as long as each column of $\mathbf{B}$. So if $\mathbf{A}$ is $m$-by-$n$, then $\mathbf{B}$ must be $n$-by-$p$, and the answer is $m$-by-$p$. The two inside numbers must match, and the two outside numbers give the size of the result.

$$
(m \times n)\,(n \times p) \;\rightarrow\; (m \times p).
$$

Here is a small one, every entry worked:

$$
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}
\begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix}
=
\begin{bmatrix} 1\cdot5 + 2\cdot7 & 1\cdot6 + 2\cdot8 \\ 3\cdot5 + 4\cdot7 & 3\cdot6 + 4\cdot8 \end{bmatrix}
=
\begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}.
$$

Swap the order and you get $\begin{bmatrix} 23 & 34 \\ 31 & 46 \end{bmatrix}$ instead. The matrix product is **not commutative**: $\mathbf{A}\mathbf{B}$ and $\mathbf{B}\mathbf{A}$ are usually different. That is not a quirk. Turning a book 90 degrees about one edge and then about another leaves it in a different position than doing the two turns the other way round, and matrices describe turns.

In MATLAB the plain star `*` is this matrix product, `^` is a matrix power, and `/` is a matrix division. These three are the **matrix operators**. They follow the rules of linear algebra, not the rules of the shopping receipt.

::: warning A size error is a gift
`[1 2 3] * [4 5 6]` stops with an error: a 1-by-3 times a 1-by-3 has inside numbers 3 and 1, which do not match. MATLAB's message says the dimensions are incorrect for matrix multiplication and even suggests `.*`. Do not reach for the dot the moment you see that error. First decide which multiply you meant. If you wanted the dot product, the fix is `[1 2 3] * [4 5 6]'`, turning the second row into a column.
:::

## The dot: one element at a time

Now the receipt idea. Put a dot in front of the operator and MATLAB works **element-wise**: entry by entry, pairing the first with the first, the second with the second, and so on. The answer has the same size as the inputs.

- `.*` multiplies element by element ("dot times").
- `./` divides element by element ("dot divide").
- `.^` raises each element to a power ("dot power").

```matlab
>> qty   = [2 1 3];
>> price = [4 5 6];
>> qty .* price
% ans =  8   5   18
```

Those are the receipt lines. `sum(qty .* price)` adds them up and gives $31$ again.

A few operators never need a dot, because there is only one sensible meaning. Plus `+` and minus `-` always work element by element; there is no `.+`. And when one side is a single number (a **scalar**), `*` and `.*` agree: `3 * [1 2]` and `3 .* [1 2]` are both `[3 6]`. The danger lives only in `*`, `/` and `^` between two non-scalars.

If you know **[[NumPy|numpy-flip]]**, the Python library for arrays, notice that its convention is the opposite. In NumPy, `*` is element-wise and `@` is the matrix product. In MATLAB, `*` is the matrix product and `.*` is element-wise. When you translate NumPy code, every `*` needs a decision.

::: example Dynamic pressure along a climb
The **[[dynamic pressure|dynamic-pressure]]** $q$ is the push of the oncoming air on a vehicle. It is $q = \tfrac{1}{2}\rho v^2$, where $\rho$ ("rho") is the air density in $\mathrm{kg/m^3}$ and $v$ is the speed in $\mathrm{m/s}$. The answer comes out in pascals ($\mathrm{Pa}$).

Take three moments on a climb: at sea level, going $100\,\mathrm{m/s}$; at $10\,\mathrm{km}$, going $300\,\mathrm{m/s}$; at $20\,\mathrm{km}$, going $600\,\mathrm{m/s}$. Standard-atmosphere densities at those heights are $1.225$, $0.41351$ and $0.08891\,\mathrm{kg/m^3}$.

```matlab
>> rho = [1.225 0.41351 0.08891];    % kg/m^3
>> v   = [100 300 600];              % m/s
>> q   = 0.5 * rho .* v.^2           % Pa
% q = 1.0e+04 *
%     0.6125    1.8608    1.6004
```

Walk through it. `v.^2` squares each speed: $10\,000$, $90\,000$, $360\,000$. Then `rho .* v.^2` multiplies each density by its own squared speed: $12\,250$, $37\,215.9$, $32\,007.6$. Then `0.5 *` halves each one (a scalar, so no dot is needed). The answers are about $6\,130$, $18\,600$ and $16\,000\,\mathrm{Pa}$. (MATLAB printed a shared factor `1.0e+04 *` above the row, meaning "multiply every number shown by $10^4$".)

Sanity check: $q$ rises and then falls, because the air thins faster than the rocket speeds up. That rise-and-fall is exactly what real launches see, with the peak near $10\,\mathrm{km}$. Write `v^2` without the dot and MATLAB stops with an error, because a 1-by-3 row cannot be matrix-multiplied by itself.
:::

::: key
`A.^2` squares each element; `A^2` is the matrix product `A*A`. Confusing them is the most common MATLAB beginner error and it produces plausible-looking wrong numbers rather than an error.
:::

## A.^2 versus A^2

For a row vector, forgetting the dot on `^` gives an error, which is kind. For a square matrix, both versions run, and that is where the trouble starts. A **square matrix** has as many rows as columns, so its inside and outside numbers always match, and $\mathbf{A}$ times $\mathbf{A}$ is always allowed.

```matlab
>> A = [1 2 3; 4 5 6; 7 8 10];
>> A.^2
% ans =
%      1     4     9
%     16    25    36
%     49    64   100
>> A^2
% ans =
%     30    36    45
%     66    81   102
%    109   134   169
```

`A.^2` is the table of squares: $1^2 = 1$, $2^2 = 4$, all the way to $10^2 = 100$. `A^2` is the matrix product $\mathbf{A}\mathbf{A}$. Its top-left entry is row 1 of $\mathbf{A}$ dotted with column 1 of $\mathbf{A}$: $1\cdot1 + 2\cdot4 + 3\cdot7 = 1 + 8 + 21 = 30$.

Neither answer is "the wrong one" in general. They answer different questions. The bug is using one when you meant the other. And since both are 3-by-3 grids of ordinary-looking numbers, nothing on the screen tells you which you got.

**[[A matrix power|matrix-power]]** means "apply this matrix again". If $\mathbf{R}$ turns a vector by some angle, $\mathbf{R}^2$ turns it twice. An element-wise power has no such meaning. It is a table of squared numbers that happens to be laid out in a grid.

::: example A rotation squared, two ways
A rotation by an angle $\theta$ ("theta") in a flat plane is described by the matrix

$$
\mathbf{R} = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}.
$$

Take $\theta = 30^\circ$. Then $\cos 30^\circ \approx 0.8660$ and $\sin 30^\circ = 0.5$.

```matlab
>> th = 30*pi/180;                        % degrees to radians
>> R = [cos(th) -sin(th); sin(th) cos(th)]
% R =
%     0.8660   -0.5000
%     0.5000    0.8660
>> R^2
% ans =
%     0.5000   -0.8660
%     0.8660    0.5000
>> R.^2
% ans =
%     0.7500    0.2500
%     0.2500    0.7500
```

`R^2` is a rotation by $60^\circ$: $\cos 60^\circ = 0.5$ and $\sin 60^\circ \approx 0.8660$. Turning by $30^\circ$ twice is turning by $60^\circ$, as it should be.

`R.^2` squared each entry: $0.8660^2 = 0.75$, $0.5^2 = 0.25$, and $(-0.5)^2 = +0.25$, so the minus sign vanished. It looks tidy, and it is not a rotation at all. Two quick checks catch it. A rotation matrix keeps lengths, so each of its columns has length $1$. The first column of `R.^2` has length $\sqrt{0.75^2 + 0.25^2} \approx 0.791$. And a rotation's **determinant** (a single number that measures how the matrix stretches area) is $1$, while `det(R.^2)` is $0.75 \cdot 0.75 - 0.25 \cdot 0.25 = 0.5$. Point `R.^2` at the vector $(1, 0)$ and it gives $(0.75, 0.25)$: a shrunken arrow at about $18.4^\circ$ instead of $60^\circ$.
:::

::: warning The bug that gets through review
Attitude code is full of rotation matrices and their powers, products and transposes. A stray dot in `R.^2` or a missing one in `v^2` often survives a code review because the output is a matrix of plausible numbers between $-1$ and $1$. Whenever you square or multiply a matrix, say out loud which you mean: "apply it twice" (no dot) or "square each number" (dot).
:::

The same trap waits for other powers. `A^-1` is the matrix inverse, the matrix that undoes $\mathbf{A}$. `A.^-1` is the table of reciprocals, $1/A_{ij}$ for each entry. They are completely different matrices. The next lesson explains why you should rarely compute the inverse at all.

## Division has two meanings too

Dividing brings the same fork in the road. `./` divides entry by entry:

```matlab
>> x = [2 4 8];
>> 1 ./ x
% ans =  0.5000   0.2500   0.1250
```

Plain `/` is **matrix right division**. `B/A` means "solve for the unknown $\mathbf{X}$ in $\mathbf{X}\mathbf{A} = \mathbf{B}$", which is roughly $\mathbf{B}$ times the inverse of $\mathbf{A}$. It is a linear-algebra operation, and the next lesson is about it and its partner, the backslash.

Two consequences surprise people. First, `1 / x` with a vector `x` is an error, because a 1-by-1 and a 1-by-3 do not fit together as a system of equations. Second, and worse, two row vectors of the same length *do* fit:

```matlab
>> a = [1 2 3];
>> b = [4 5 6];
>> a / b
% ans = 0.4156
```

No error, and a single number that looks like a ratio. What MATLAB did was find the one scalar $s$ that makes $s \cdot b$ as close as possible to $a$ (a "best fit" in a sense the next lesson explains). If you meant three ratios, you wanted `a ./ b`, which is `[0.25 0.4 0.5]`.

::: key
Element-wise operators carry a dot: `.*` `./` `.^`. The plain operators `*` `/` `^` follow the rules of matrix algebra. `+` and `-` are always element-wise, and with a scalar on one side `*` and `.*` agree.
:::

## Implicit expansion: when sizes do not match

Element-wise operations want equal sizes. There is one generous exception. If one input has size 1 along some direction, MATLAB stretches it to match the other. This is **[[implicit expansion|implicit-expansion]]**, and it has been part of MATLAB since release R2016b. A scalar is the simplest case: it gets stretched to every position.

A column times a row, element-wise, makes a full table:

```matlab
>> [1; 2; 3] .* [10 20]
% ans =
%     10    20
%     20    40
%     30    60
```

The 3-by-1 column was copied across two columns, the 1-by-2 row was copied down three rows, and then the two 3-by-2 grids were multiplied entry by entry. That is handy. Subtracting each column's average from a data matrix is one line: `X - mean(X)`.

::: warning The row plus column surprise
Implicit expansion turns a mistake into a table. If `t` is a 1-by-3 row and `offset` is accidentally a 3-by-1 column, `t + offset` does not fail. It builds a 3-by-3 matrix. Downstream code may then run happily on nine numbers when you expected three. When a result is suddenly a matrix, check the orientation of every input with `size`.
:::

::: example Speed from velocity components
A navigation log stores one velocity per row, with the three columns holding the east, north and up components in $\mathrm{m/s}$. The speed of each row is $\sqrt{v_x^2 + v_y^2 + v_z^2}$.

```matlab
>> V = [7.6 0.2 0.1;
        3.0 4.0 0.0];
>> speed = sqrt(sum(V.^2, 2))
% speed =
%     7.6033
%     5.0000
```

Step by step: `V.^2` squares every component (with the dot, because you want each number squared, not the matrix times itself; a 2-by-3 cannot even be matrix-squared). `sum(..., 2)` adds along direction 2, meaning across each row, giving $57.81$ and $25$. `sqrt` takes the square root of each. Sanity check on the second row: $3$, $4$, $0$ is the famous 3-4-5 right triangle, and the speed is $5\,\mathrm{m/s}$ exactly.

Contrast this with turning each velocity into another set of axes. There you would write `(C * V')'`, a true matrix product of a 3-by-3 direction cosine matrix `C` with the 3-by-2 grid of columns: no dot, because each output is a sum of products.
:::

## Transpose: ' and .'

One more pair. An apostrophe `'` after a matrix **transposes** it: rows become columns. `[1 2 3]'` is the column $(1, 2, 3)$. For real numbers that is all it does.

For **complex numbers** (numbers with an imaginary part, like $1 + 2i$), `'` also flips the sign of every imaginary part. That flip is called taking the **[[complex conjugate|complex-conjugate]]**. The dotted version `.'` transposes without flipping. So `[1+2i 3-1i]'` is the column $(1-2i,\; 3+1i)$, while `[1+2i 3-1i].'` is $(1+2i,\; 3-1i)$. Frequency-domain work in controls uses complex numbers constantly, so if you only want to turn a row into a column, `.'` is the safe habit there.

## A habit that catches the bug

You will type these operators thousands of times. Three habits keep them honest.

1. **Ask the question first.** "Do I want each number on its own, or am I doing linear algebra?" Physics formulas applied along a time history ($\tfrac{1}{2}\rho v^2$, $F = ma$ at every sample) are element-wise. Rotations, coordinate changes, filters and systems of equations are matrix operations.
2. **Check sizes.** Before and after a line you are unsure of, look at `size` of each variable. A matrix product changes shapes according to the inside-outside rule. An element-wise operation keeps them.
3. **Test on a case you know.** A rotation by $0^\circ$ is the **identity matrix** `eye(3)`, which leaves every vector alone, and a rotation times its own transpose is the identity. A 3-4-5 triangle has length 5. One known case in a test catches the stray dot that the eye misses.

## Check yourself

::: check
`B = [1 2; 3 4]`. Write out `B.*B`, `B*B` and `B'*B`.
:::

::: answer
`B.*B` squares each entry: $\begin{bmatrix} 1 & 4 \\ 9 & 16 \end{bmatrix}$.

`B*B` is the matrix product. Top-left: $1\cdot1 + 2\cdot3 = 7$. Top-right: $1\cdot2 + 2\cdot4 = 10$. Bottom-left: $3\cdot1 + 4\cdot3 = 15$. Bottom-right: $3\cdot2 + 4\cdot4 = 22$. So $\begin{bmatrix} 7 & 10 \\ 15 & 22 \end{bmatrix}$.

`B'` is $\begin{bmatrix} 1 & 3 \\ 2 & 4 \end{bmatrix}$, so `B'*B` is $\begin{bmatrix} 1+9 & 2+12 \\ 2+12 & 4+16 \end{bmatrix} = \begin{bmatrix} 10 & 14 \\ 14 & 20 \end{bmatrix}$. Three different answers from the same four numbers.
:::

::: check
`m` is a 1-by-5 row of masses in kg and `a` is a 1-by-5 row of accelerations in $\mathrm{m/s^2}$. You want the force at each of the five samples. Which line is right: `F = m*a`, `F = m.*a` or `F = m*a'`? What does each of the other two do?
:::

::: answer
`F = m.*a` is right: five forces, one per sample, each $F = ma$.

`m*a` is a 1-by-5 times a 1-by-5; the inside numbers (5 and 1) do not match, so MATLAB stops with an error. `m*a'` is a 1-by-5 times a 5-by-1, which is allowed and gives a single number, the sum of all five products. That number has units of newtons and looks reasonable, which is what makes it dangerous.
:::

::: check
Why does `v^2` error for a 1-by-3 row `v`, while `A^2` runs for a 3-by-3 matrix `A`?
:::

::: answer
`v^2` means `v*v`, a 1-by-3 times a 1-by-3. The inside sizes are 3 and 1, which do not match, so the matrix product is not defined. `A^2` means `A*A`, a 3-by-3 times a 3-by-3. The inside sizes are both 3, so it is allowed. Every square matrix can be matrix-squared, which is why the missing dot only goes unnoticed for square matrices.
:::

::: check
`p` is a 1-by-4 row and `w` is a 4-by-1 column. What size is `p + w`, and why might that be a bug?
:::

::: answer
Implicit expansion stretches the row down 4 rows and the column across 4 columns, so `p + w` is a 4-by-4 matrix with $p_j + w_i$ in row $i$, column $j$. If you meant to add matching entries you wanted four numbers, not sixteen. Fix it by making both the same orientation, for example `p + w'`.
:::

::: check
A teammate computes the $60^\circ$ rotation as `R60 = R30.^2`, where `R30` is the $30^\circ$ rotation matrix. Give two quick numerical checks that expose the mistake without knowing the right answer.
:::

::: answer
First, every column of a rotation matrix has length 1. A column of `R30.^2` is $(0.75, 0.25)$, whose length is about $0.791$. Second, a rotation has determinant 1, but `det(R30.^2)` is $0.75^2 - 0.25^2 = 0.5$. Either check fails, so `R30.^2` is not a rotation. The right line is `R30^2` (or `R30*R30`).
:::

## Summary

| Operator | Name | What it does |
|---|---|---|
| `A*B` | matrix product | row $i$ of A dotted with column $j$ of B; sizes $(m\times n)(n\times p)\to(m\times p)$ |
| `A.*B` | element-wise product | multiplies matching entries; same size (or expandable) |
| `A^2` | matrix power | `A*A`; square matrices only; "apply it twice" |
| `A.^2` | element-wise power | squares each entry |
| `B/A`, `A\B` | matrix division | solve a linear system (next lesson) |
| `A./B` | element-wise division | divides matching entries |
| `+`, `-` | addition, subtraction | always element-wise; no dotted version |
| `'` and `.'` | transposes | `'` also conjugates complex numbers; `.'` does not |
| implicit expansion | size-1 directions stretch | since R2016b; a row plus a column makes a table |

The next lesson picks up the division fork: what `A\b` does when $\mathbf{A}$ is a matrix, and why it beats multiplying by the inverse.

::: context dcm A matrix that remembers which way you are facing
A direction cosine matrix, or DCM, is a 3-by-3 grid whose nine entries are the cosines of the angles between the axes of two frames, say the rocket's body axes and the ground's north-east-down axes. Multiply a vector written in one frame by the DCM and you get the same vector written in the other frame. Flight software on nearly every spacecraft carries attitude as either a DCM or a quaternion, and converts between frames many times a second. You will meet the MathWorks functions for this in the next module.
:::

::: context dot-product Row meets column
The dot product walks along a row and down a column at the same time, multiplying the pairs it meets and keeping a running total. A matrix product is a whole grid of these walks, one for every row-column pair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="55" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="75" font-size="14" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="80" y="75" font-size="14" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="120" y="75" font-size="14" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="80" y="105" font-size="11" text-anchor="middle" fill="#6c7a93">row: 1 by 3</text>
  <text x="160" y="76" font-size="18" text-anchor="middle" fill="#1f2a44">×</text>
  <rect x="180" y="15" width="30" height="120" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="40" font-size="14" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="195" y="80" font-size="14" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="195" y="120" font-size="14" text-anchor="middle" fill="#1f2a44">6</text>
  <text x="240" y="76" font-size="18" text-anchor="middle" fill="#1f2a44">=</text>
  <text x="300" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">2·4 + 1·5 + 3·6</text>
  <text x="300" y="90" font-size="16" text-anchor="middle" fill="#b4232c">31</text>
</svg>
```

The row's length must equal the column's length, or there are unpaired numbers left over. That is the "inside numbers must match" rule.
:::

::: context numpy-flip Two languages, opposite defaults
NumPy was built for general programmers, who mostly want arithmetic on each number, so its `*` is element-wise and the matrix product got the `@` operator (added to Python 3.5 in 2015). MATLAB was built in the late 1970s as a friendly front end to matrix libraries, so its plain `*` was always the linear-algebra product. Neither is wrong. When you port code between them, search for every `*`, `/` and `**` or `^` and decide each one on purpose.
:::

::: context dynamic-pressure Max-q, the roughest part of the ride
Dynamic pressure rises as a rocket speeds up and falls as the air thins, so it has a peak, called max-q. For a large launcher that peak is typically a few tens of kilopascals, reached about a minute after lift-off at roughly 10 to 15 km altitude. Many rockets throttle their engines down around max-q so the airframe is not overloaded, then throttle back up. Guidance engineers plot $q$ along every simulated trajectory, which is an element-wise calculation over thousands of samples.
:::

::: context matrix-power Why a matrix power means "do it again"
A matrix is a machine that takes a vector in and gives a vector out. Feeding the output back in is applying the machine twice, and that is exactly what $\mathbf{R}\mathbf{R}$ computes. For a rotation, two $30^\circ$ turns make a $60^\circ$ turn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="140" x2="200" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="140" x2="60" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="140" x2="180" y2="140" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="60" y1="140" x2="163.9" y2="80" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="140" x2="120" y2="36.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="140" x2="150" y2="110" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="5,3"/>
  <text x="184" y="136" font-size="12" fill="#1f2a44">start (1, 0)</text>
  <text x="168" y="80" font-size="12" fill="#1d6fd1">R: 30°</text>
  <text x="124" y="34" font-size="12" fill="#1d6fd1">R^2: 60°</text>
  <text x="156" y="112" font-size="12" fill="#b4232c">R.^2: (0.75, 0.25)</text>
</svg>
```

The dashed red arrow is where `R.^2` sends the same start vector: shorter than the original, and at about $18^\circ$.
:::

::: context implicit-expansion Before R2016b
Older MATLAB refused to add a row to a column. To get the table you had to call `bsxfun`, short for "binary singleton expansion function", as in `bsxfun(@times, col, row)`, or copy the data yourself with `repmat`. Implicit expansion made the tidy one-liners possible, and NumPy has had the same idea, under the name broadcasting, for much longer. You will still see `bsxfun` in older code that has to run on old releases.
:::

::: context complex-conjugate Flipping the imaginary part
A complex number $a + bi$ has a real part $a$ and an imaginary part $b$, where $i$ is the square root of $-1$. Its conjugate is $a - bi$: the same number reflected across the real axis. The conjugate transpose is the natural "transpose" for complex matrices in linear algebra, which is why MATLAB gave it the short symbol. You will lean on complex numbers when you study frequency response, where a system's gain and phase at each frequency are packed into one complex number.
:::
