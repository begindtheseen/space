---
id: l05-backslash-and-linear-systems
title: Backslash and linear systems
minutes: 21
covers:
  - 'Backslash mldivide and why A\b beats inv(A)*b'
---

Here is a puzzle you could meet at a lunch counter. Two burgers and a drink cost \$13. One burger and three drinks cost \$14. What does a burger cost, and what does a drink cost?

You can solve it by fiddling. Double the second order and you get two burgers and six drinks for \$28. Take away the first order, and the two burgers cancel: five drinks cost \$15, so a drink is \$3. Put that back in the first order: two burgers cost \$10, so a burger is \$5. Two unknowns, two facts, one answer.

That puzzle is a **[[system of linear equations|why-linear]]**: a set of equations where the unknowns are only multiplied by numbers and added, never squared or multiplied together. Real engineering produces the same thing with tens, thousands or millions of unknowns. Estimating a satellite's orbit from radar measurements, calibrating a gyro, finding the control settings that hold an aircraft in steady flight and updating a navigation filter all come down to solving one. The last lesson ended with a fork: the plain `/` in MATLAB is a matrix division, not an element-wise one. This lesson is about that division and its partner, the **backslash** `\`, the operator MATLAB built its reputation on.

## Writing the puzzle as a matrix

Call the burger price $x_1$ and the drink price $x_2$ (read "x one" and "x two"). The two facts are

$$
\begin{aligned}
2x_1 + 1x_2 &= 13 \\
1x_1 + 3x_2 &= 14.
\end{aligned}
$$

Now pull the numbers apart into three pieces. The **coefficient matrix** $\mathbf{A}$ holds the multipliers, one row per equation. The **unknown vector** $\mathbf{x}$ holds what you want. The **right-hand side** $\mathbf{b}$ holds the totals:

$$
\underbrace{\begin{bmatrix} 2 & 1 \\ 1 & 3 \end{bmatrix}}_{\mathbf{A}}
\underbrace{\begin{bmatrix} x_1 \\ x_2 \end{bmatrix}}_{\mathbf{x}}
=
\underbrace{\begin{bmatrix} 13 \\ 14 \end{bmatrix}}_{\mathbf{b}}.
$$

Multiply it out with the row-times-column rule from the last lesson, and row 1 gives back $2x_1 + 1x_2$, row 2 gives back $1x_1 + 3x_2$. So the whole puzzle is the single line $\mathbf{A}\mathbf{x} = \mathbf{b}$, read "A x equals b". Every linear system, of any size, has this shape.

## Backslash: dividing from the left

With plain numbers, $3x = 6$ is solved by dividing both sides by 3. MATLAB lets you write that division two ways. `6/3` divides 6 by 3. `3\6` also gives 2: read it as "3 divided *into* 6", or "3 under 6". The backslash puts the thing you divide by on the left, where it sat in the equation.

For matrices the side matters, because matrix products do not commute. In $\mathbf{A}\mathbf{x} = \mathbf{b}$ the matrix sits on the left of $\mathbf{x}$, so you "divide it off" from the left:

```matlab
>> A = [2 1; 1 3];
>> b = [13; 14];
>> x = A \ b
% x =
%      5
%      3
```

A burger is \$5 and a drink is \$3, the same as the fiddling found. Read `A \ b` aloud as "A backslash b" or "A left-divide b". Its official function name is **`mldivide`**, short for "matrix left divide", so `mldivide(A, b)` is the same call. The plain slash is **`mrdivide`**, "matrix right divide", and it solves the mirror-image problem $\mathbf{x}\mathbf{A} = \mathbf{b}$ where the unknown is a row on the left: `x = b / A`.

Always check a solve by putting the answer back in. `A*x - b` is the **residual**, the amount by which the equations fail. Here it is `[0; 0]`, so the answer is exact.

::: key
`x = A\b` solves $\mathbf{A}\mathbf{x} = \mathbf{b}$. `x = b/A` solves $\mathbf{x}\mathbf{A} = \mathbf{b}$. Backslash chooses an appropriate factorisation for the structure of A and solves directly, which is faster and more accurate than forming an explicit inverse. MATLAB documentation warns against `inv` for exactly this reason.
:::

## Why not the inverse?

Algebra class teaches a tidy formula. The **inverse** of a square matrix, written $\mathbf{A}^{-1}$ ("A inverse"), is the matrix that undoes $\mathbf{A}$: $\mathbf{A}^{-1}\mathbf{A} = \mathbf{I}$, where $\mathbf{I}$ is the identity matrix (ones on the diagonal, zeros elsewhere). Multiply both sides of $\mathbf{A}\mathbf{x} = \mathbf{b}$ by it and you get $\mathbf{x} = \mathbf{A}^{-1}\mathbf{b}$. MATLAB has `inv`, so it is tempting to type `x = inv(A)*b`.

That line works on paper and usually works on small examples. It is still the wrong habit, for two reasons: it does more work, and it adds more rounding error.

Think about ordinary numbers first. To solve $7x = 21$, you divide 21 by 7 and get exactly 3. You could instead work out $1/7 = 0.142857\ldots$, round it to the digits your calculator holds, and multiply by 21. That is an extra step, and the rounding of $1/7$ gets carried into the answer. With one number the damage is tiny. With a matrix, the inverse has $n^2$ entries, each built from many rounded steps, and all of that error flows into $\mathbf{x}$.

### More work

Solving $\mathbf{A}\mathbf{x} = \mathbf{b}$ directly costs about $\tfrac{2}{3}n^3$ **[[floating-point operations|flops]]** (single additions or multiplications) for an $n$-by-$n$ matrix. Forming the full inverse first costs about $2n^3$, three times as much, and you still have to multiply it by $\mathbf{b}$ afterwards. The note below shows where those counts come from.

::: example Timing a 3000-unknown system
For $n = 3000$, the direct solve needs about $\tfrac{2}{3} \cdot 3000^3 = 1.8 \times 10^{10}$ operations. The inverse route needs about $2 \cdot 3000^3 = 5.4 \times 10^{10}$. The prediction is a factor of three.

A measurement, in GNU Octave (a free program that runs most MATLAB code) on a four-core cloud machine, with a random 3000-by-3000 matrix:

```matlab
>> A = randn(3000);  b = randn(3000, 1);   % random numbers
>> tic; x1 = inv(A)*b; toc
% Elapsed time is 16.6 seconds.
>> tic; x2 = A\b; toc
% Elapsed time is 5.96 seconds.
```

`tic` starts a stopwatch and `toc` reads it. The ratio is $16.6 / 5.96 \approx 2.8$, close to the predicted 3. MATLAB on a desktop will be much faster in absolute terms, because it ships highly tuned math libraries, but the ratio is the part that carries over. Sanity check: both residuals were around $10^{-10}$, so both answers were fine here. The inverse only wasted time. The next example shows it wasting accuracy too.
:::

### Less accurate

Some systems are touchy: a tiny change in $\mathbf{b}$, or in the rounding, makes a big change in $\mathbf{x}$. They are called **ill-conditioned**. The **condition number**, `cond(A)`, measures how touchy. A value near 1 is relaxed. A value of $10^{k}$ means you can lose about $k$ of the roughly 16 significant digits that a MATLAB `double` carries.

::: example A touchy matrix, solved both ways
The **[[Hilbert matrix|hilbert-matrix]]** is a famous touchy one. Its entry in row $i$, column $j$ is $1/(i + j - 1)$, and MATLAB builds it with `hilb(n)`. Take $n = 8$, pick the true answer to be all ones, and make $\mathbf{b}$ to match. Then solve both ways and compare.

```matlab
>> H  = hilb(8);
>> xt = ones(8, 1);          % the true answer
>> b  = H*xt;
>> cond(H)
% ans = 1.5258e+10
>> x1 = inv(H)*b;   x2 = H\b;
>> norm(H*x1 - b)            % residual, inverse route
% ans = 5.3821e-07
>> norm(H*x2 - b)            % residual, backslash
% ans = 6.0809e-16
>> norm(x1 - xt)             % error, inverse route
% ans = 5.4458e-06
>> norm(x2 - xt)             % error, backslash
% ans = 6.6802e-07
```

`norm` measures the size of a vector: the square root of the sum of its squared entries. Step by step:

- The condition number is about $1.5 \times 10^{10}$. So expect to lose about 10 of 16 digits, leaving about 6. Both errors ($5 \times 10^{-6}$ and $7 \times 10^{-7}$) fit that budget.
- The residual tells the real story. Backslash's answer satisfies the equations to about $6 \times 10^{-16}$, which is as good as `double` arithmetic can do. The inverse route's answer misses by about $5 \times 10^{-7}$: roughly a billion times worse.
- The error in $\mathbf{x}$ is about eight times smaller with backslash, too.

(These numbers came from Octave. MATLAB's last digits will differ, because the rounding happens in a different order. The gap between the two methods does not go away.)
:::

::: warning Do not hide the inverse inside other formulas
The same rule applies wherever an inverse appears in a formula. A **[[navigation filter|kalman-filter]]**'s gain is often written $\mathbf{K} = \mathbf{P}\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$. In MATLAB, write `K = P*H'/S` with the right-divide, not `K = P*H'*inv(S)`. When you see `inv(` in a code review, ask whether the inverse matrix itself is really needed, or only its effect on something.
:::

When *is* `inv` fine? When you truly need the entries of the inverse matrix for their own sake, which is rare, or for a 2-by-2 or 3-by-3 you are writing out by hand. Solving equations is not that case.

::: note Where 2/3 n³ and 2n³ come from
Solving by elimination (what you did with the burgers) runs in two phases. Phase one clears out the numbers below the diagonal, column by column. Clearing column $k$ updates a block of about $(n-k)$ by $(n-k)$ numbers, with one multiply and one subtract each. Adding over all columns gives

$$
\sum_{k=1}^{n} 2(n-k)^2 \approx 2 \cdot \frac{n^3}{3} = \frac{2}{3}n^3.
$$

Phase two is two triangle solves (below), which cost only about $2n^2$. To build the inverse you do phase one once, then solve for every one of the $n$ columns of the identity matrix. Done carefully, that adds about $\tfrac{4}{3}n^3$, for a total near $2n^3$. For $n = 3000$, $n^3$ is $2.7 \times 10^{10}$, so those $n^2$ terms are tiny by comparison.
:::

## What backslash looks at first

The backslash is not one algorithm. It is a dispatcher: before solving, it inspects $\mathbf{A}$ and picks the cheapest reliable method for that shape. That is what "chooses an appropriate factorisation for the structure of A" means. A **factorisation** splits a matrix into a product of simpler matrices that are easy to solve with.

- **Triangular.** If every entry above the diagonal (or below it) is zero, $\mathbf{A}$ is **triangular**. The last equation then has one unknown, the one above it has two, and so on. You solve from one end, plugging in as you go. That is **substitution**, and it costs only about $n^2$ operations.
- **Symmetric with a positive diagonal.** If $\mathbf{A}$ equals its own transpose and its diagonal entries are positive, backslash first tries a **[[Cholesky factorisation|cholesky]]**, which is about twice as fast as the general method. If that attempt fails, it falls back to another method.
- **General square.** Otherwise it uses an **LU factorisation**: it writes $\mathbf{A}$ as a lower-triangular $\mathbf{L}$ times an upper-triangular $\mathbf{U}$ (with rows swapped as needed for accuracy, called **[[pivoting|pivoting]]**). Then two cheap triangle solves finish the job. This is elimination, done in an organized way.
- **Not square.** If there are more equations than unknowns, it uses a **QR factorisation** to find the best-fitting answer. The next section is about that case.
- **Sparse.** If $\mathbf{A}$ is stored as a **[[sparse|sparse-matrices]]** matrix, one that records only its nonzero entries, backslash uses solvers that skip the zeros. A million-unknown system that is mostly zeros can then solve in seconds.

MATLAB's documentation for `mldivide` includes a flowchart of these checks, with a few more special shapes besides. You do not need to memorize it. The point is that `A\b` gets smarter as your matrix gets more special, and `inv(A)*b` cannot use any of it.

::: note Seeing the LU pieces
For the burger matrix, `[L, U, P] = lu(A)` returns

$$
\mathbf{L} = \begin{bmatrix} 1 & 0 \\ 0.5 & 1 \end{bmatrix}, \quad
\mathbf{U} = \begin{bmatrix} 2 & 1 \\ 0 & 2.5 \end{bmatrix}, \quad
\mathbf{P} = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}.
$$

Check: $\mathbf{L}\mathbf{U} = \begin{bmatrix} 2 & 1 \\ 1 & 0.5 + 2.5 \end{bmatrix} = \begin{bmatrix} 2 & 1 \\ 1 & 3 \end{bmatrix}$, which is $\mathbf{A}$. The $0.5$ in $\mathbf{L}$ is "half of row 1", the multiple you subtract to clear the 1 under the 2. $\mathbf{P}$ is the row-swap record; here no swap was needed. If you must solve with the same $\mathbf{A}$ and many different right-hand sides, factor once and reuse the pieces, since the factoring is the expensive part.
:::

## When there is no single answer

Some systems have no unique answer. If one equation is a copy of another in disguise, say $x_1 + 2x_2 = 1$ and $2x_1 + 4x_2 = 2$, then the second tells you nothing new, and infinitely many pairs work. The matrix is called **singular**. Its determinant is zero, and it has no inverse.

For a singular or nearly singular square matrix, MATLAB still returns numbers, but it also prints a warning: "Matrix is singular to working precision", or "Matrix is close to singular or badly scaled. Results may be inaccurate." followed by an `RCOND` value (an estimate of one over the condition number). Treat that warning as an error. The numbers it returns are not an answer you can use.

::: warning Never silence the singular warning
A near-singular matrix usually means the problem was set up wrong: two sensors that measure the same thing, a unit mix-up that makes one column a million times the others, or an unknown that no measurement can see. Turning the warning off hides the bug and keeps the garbage. Look at `cond(A)` and find out why.
:::

## More equations than unknowns: least squares

Real measurements are noisy, so engineers take more of them than strictly needed. Then there are more equations than unknowns, the system is **tall** (more rows than columns), and in general no $\mathbf{x}$ satisfies every equation exactly.

Backslash then returns the **[[least-squares|least-squares]]** answer: the $\mathbf{x}$ that makes the residual $\mathbf{A}\mathbf{x} - \mathbf{b}$ as small as possible, measured by the sum of its squared entries. The mystery number `a/b = 0.4156` in the last lesson was exactly this, with one unknown and three equations.

::: example Measuring a gyro's drift
A **[[gyro|gyro-drift]]** (a sensor that measures how fast something is turning) sits perfectly still on a lab bench, so the true angle never changes. Its integrated angle reading still creeps. Readings once an hour for four hours are $1.1$, $2.9$, $5.2$, $6.8$ and $9.1$ degrees at $t = 0, 1, 2, 3, 4$ hours. Model the reading as a straight line, $\text{angle} = c_1 + c_2 t$, where $c_1$ is an offset in degrees and $c_2$ is the drift rate in degrees per hour.

Each reading gives one equation, five in all, for two unknowns. Stack them. The column of ones multiplies $c_1$ and the column of times multiplies $c_2$:

```matlab
>> t = [0; 1; 2; 3; 4];                  % hours
>> y = [1.1; 2.9; 5.2; 6.8; 9.1];        % degrees
>> M = [ones(5,1) t];                    % 5-by-2
>> c = M \ y
% c =
%     1.0400
%     1.9900
>> y - M*c
% ans =
%     0.0600
%    -0.1300
%     0.1800
%    -0.2100
%     0.1000
```

The best-fit line is $1.04 + 1.99\,t$: an offset of about $1.04^\circ$ and a drift of about $1.99^\circ$ per hour, which is a realistic figure for an inexpensive gyro. Sanity check: the leftover misfits are all under $0.25^\circ$ and swing between plus and minus with no pattern, which is what random noise on a good straight-line fit looks like. A drift estimate like this is exactly what a navigation filter subtracts out in flight.
:::

::: warning Backslash is not only for square systems
It is easy to assume `\` needs a square matrix, the way `inv` does. It does not. A tall `A` gives a least-squares fit. A wide one (fewer equations than unknowns) gives one of the many exact answers. Check `size(A)` so that you know which question you asked.
:::

## Check yourself

::: check
Write this system as `A` and `b` in MATLAB and solve it: $x_1 + x_2 = 10$ and $x_1 - x_2 = 4$. Then say how you would confirm the answer.
:::

::: answer
`A = [1 1; 1 -1]; b = [10; 4]; x = A\b` gives `x = [7; 3]`. Add the two equations by hand to see why: $2x_1 = 14$, so $x_1 = 7$, and then $x_2 = 10 - 7 = 3$. Confirm with the residual: `A*x - b` should be `[0; 0]`. It is: $7 + 3 = 10$ and $7 - 3 = 4$.
:::

::: check
For $n = 1000$, about how many floating-point operations does `A\b` need, and about how many does `inv(A)*b` need?
:::

::: answer
Direct solve: about $\tfrac{2}{3} \cdot 1000^3 = \tfrac{2}{3} \times 10^9 \approx 6.7 \times 10^8$. Inverse route: about $2 \cdot 1000^3 = 2 \times 10^9$ to form the inverse, plus about $2 \times 10^6$ for the final multiply, which is negligible. So the inverse route does about three times the work.
:::

::: check
Two solutions to the same system have residuals `norm(A*x - b)` of $10^{-15}$ and $10^{-7}$. The condition number is $10^{9}$. Which method probably produced each, and roughly how many correct digits do you expect in $\mathbf{x}$?
:::

::: answer
The $10^{-15}$ residual, near the limit of `double` arithmetic, is what backslash typically achieves. The $10^{-7}$ one fits the inverse route on a touchy matrix. With a condition number of $10^9$ you lose about 9 of the roughly 16 digits, so expect about 7 correct digits in $\mathbf{x}$ at best, whichever method you use. Backslash does not beat the condition number, but it does not add avoidable error on top of it.
:::

::: check
Why is a triangular system so much cheaper to solve than a general one? Solve $\begin{bmatrix} 2 & 0 \\ 3 & 4 \end{bmatrix}\mathbf{x} = \begin{bmatrix} 6 \\ 17 \end{bmatrix}$ to show it.
:::

::: answer
In a lower-triangular system the first equation has only one unknown: $2x_1 = 6$, so $x_1 = 3$. The second has two, but one is already known: $3 \cdot 3 + 4x_2 = 17$, so $4x_2 = 8$ and $x_2 = 2$. Each unknown costs one short pass, so the total is about $n^2$ operations instead of about $\tfrac{2}{3}n^3$. Backslash spots the zeros and uses this shortcut on its own.
:::

::: check
A teammate fits a line to 200 thrust-stand readings with `c = inv(M'*M)*M'*y`, where `M` is 200-by-2. What single line should replace it, and why?
:::

::: answer
`c = M\y`. Backslash on a tall matrix returns the least-squares fit directly, using a QR factorisation. The teammate's formula is the textbook one, but it forms `M'*M`, which squares the condition number, and then inverts it. That throws away accuracy twice and costs extra work for no gain.
:::

## Summary

| Idea | Meaning | In MATLAB |
|---|---|---|
| linear system | equations in unknowns multiplied by numbers and added | $\mathbf{A}\mathbf{x} = \mathbf{b}$ |
| backslash, `mldivide` | solve with $\mathbf{A}$ on the left | `x = A\b` |
| slash, `mrdivide` | solve with $\mathbf{A}$ on the right | `x = b/A` for $\mathbf{x}\mathbf{A} = \mathbf{b}$ |
| residual | how much the equations miss | `A*x - b`, size with `norm` |
| cost | direct solve versus inverse | about $\tfrac{2}{3}n^3$ versus $2n^3$ operations |
| condition number | how touchy the system is | `cond(A)`; $10^k$ costs about $k$ digits |
| dispatch | triangular, Cholesky, LU, QR, sparse | chosen automatically by `\` |
| singular warning | no unique answer | treat as an error; check `cond(A)` |
| least squares | best fit for a tall system | `c = M\y` |

The next lesson turns from single operations to whole programs: `if`, `switch` and loops, and the one loop habit, growing an array, that can make a MATLAB script thousands of times slower than it needs to be.

::: context why-linear Why the word "linear"
Plot $2x_1 + x_2 = 13$ on graph paper and you get a straight line; that is where "linear" comes from. With three unknowns each equation is a flat sheet, and beyond that the pictures run out but the algebra does not change. Anything with $x_1^2$, $x_1 x_2$ or $\sin x_1$ is nonlinear. Engineers often turn a nonlinear problem into a string of linear ones, solving a linear system at every step, which is why a fast, accurate solver matters so much.
:::

::: context flops Counting the work
A floating-point operation, or flop, is one addition, subtraction, multiplication or division on two decimal numbers stored the computer's way. Counting flops is how numerical analysts compare methods without a stopwatch, because the count does not depend on the machine. Watch the power of $n$ most of all: doubling the size of a system multiplies an $n^3$ method's work by eight, whatever the constant in front.
:::

::: context hilbert-matrix A matrix built to be difficult
David Hilbert studied this matrix around 1894, and numerical analysts have used it ever since as a standard hard test. Its rows look nearly alike: $1, \tfrac{1}{2}, \tfrac{1}{3}, \ldots$ and then $\tfrac{1}{2}, \tfrac{1}{3}, \tfrac{1}{4}, \ldots$. So the equations barely disagree with one another, and pinning down the unknowns is like finding where two almost-parallel lines cross.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="20" y1="112" x2="340" y2="48" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="20" y1="108" x2="340" y2="44" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,3"/>
  <circle cx="180" cy="80" r="4" fill="#1f2a44"/>
  <circle cx="260" cy="60" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">crossing</text>
  <text x="260" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">after a nudge</text>
  <text x="20" y="140" font-size="11" fill="#6c7a93">nudge one line slightly and the crossing slides far</text>
</svg>
```

A tiny nudge to one line (dashed) moves the crossing a long way. That is ill-conditioning in a picture.
:::

::: context kalman-filter The filter that blends sensors
A Kalman filter is the standard way navigation software blends a prediction (where physics says the vehicle should be) with noisy measurements (what the GPS or star tracker says). Its gain decides how much to trust each new measurement. Computing that gain means solving a small linear system at every update, many times a second, for the whole flight. The Apollo guidance computer ran one on the way to the Moon. You will build one in a later module.
:::

::: context cholesky A shortcut for symmetric matrices
André-Louis Cholesky, a French army officer and surveyor, worked out this method in the early 1900s for adjusting survey measurements; it was published after he was killed in the First World War. It writes a symmetric matrix of the right kind (called positive definite, which roughly means its "energy" $\mathbf{x}^{\mathsf{T}}\mathbf{A}\mathbf{x}$ is positive for every nonzero $\mathbf{x}$) as $\mathbf{L}\mathbf{L}^{\mathsf{T}}$, one triangle times its own transpose, so only one triangle has to be computed. Covariance matrices in Kalman filters have exactly this shape, which is why navigation code leans on it constantly.
:::

::: context pivoting Why rows get swapped
Elimination divides by the number on the diagonal, called the pivot. If that number is zero the step fails, and if it is tiny the division blows rounding errors up. Partial pivoting looks down the column, picks the entry with the largest size, and swaps that row to the top before eliminating. It costs almost nothing and turns a fragile method into a dependable one. The matrix $\mathbf{P}$ from `lu` records which swaps were made.
:::

::: context sparse-matrices Mostly zeros
In a big physical model, each unknown usually talks only to its neighbors: a node in a structural model touches a handful of others, not all million. The matrix is then almost all zeros. Storing only the nonzeros saves memory, and solvers that skip the zeros save time. MATLAB builds such matrices with `sparse`, and backslash notices and switches methods. Finite-element models of rocket structures and large orbit-determination problems both produce sparse systems.
:::

::: context least-squares Why squares?
Least squares picks the line that makes the sum of the squared vertical misfits as small as possible. Squaring makes every misfit count as positive, punishes big misses more than small ones, and gives a problem with a clean exact solution.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="150" x2="40" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="131.5" x2="320" y2="28" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="130.7" x2="40" y2="131.5" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="110" y1="107.3" x2="110" y2="105.6" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="180" y1="77.4" x2="180" y2="79.7" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="250" y1="56.6" x2="250" y2="53.9" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="320" y1="26.7" x2="320" y2="28.0" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="40" cy="130.7" r="4" fill="#1f2a44"/>
  <circle cx="110" cy="107.3" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="77.4" r="4" fill="#1f2a44"/>
  <circle cx="250" cy="56.6" r="4" fill="#1f2a44"/>
  <circle cx="320" cy="26.7" r="4" fill="#1f2a44"/>
  <text x="190" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">time (h)</text>
  <text x="60" y="30" font-size="11" fill="#1f2a44">gyro angle</text>
  <text x="230" y="110" font-size="11" fill="#b4232c">red: misfits</text>
</svg>
```

The dots are the five gyro readings, the blue line is the fit from the example, and the red ticks are the misfits being squared and added. Carl Friedrich Gauss used this method in 1801 to predict where the dwarf planet Ceres would reappear, which made his name.
:::

::: context gyro-drift Why a still gyro seems to turn
A rate gyro reports angular speed. To get an angle, navigation software adds up those speeds over time. Any small constant error in the rate, called bias, gets added up too, so the angle drifts steadily even when nothing moves. A bias of $2^\circ$ per hour sounds tiny, but after a day it is $48^\circ$. That is why inertial navigation systems estimate the bias and subtract it, and why navigation-grade gyros, with biases around $0.01^\circ$ per hour, cost so much more.
:::
