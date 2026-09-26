---
id: l04-state-space-and-matrix-exponential
title: State-space form and the matrix exponential
minutes: 22
covers:
  - systems of first-order ODEs and state-space form
  - matrix exponential solution
---

Pause a video game and save it. The save file does not store the whole history of your game. It stores a short list of numbers — where you are, how fast you are moving, how much health you have — and that list is enough to carry on from exactly where you stopped. A flight computer thinks about a spacecraft the same way. It keeps a list of numbers: position, velocity, attitude, spin rate, perhaps a hundred entries for a full navigation filter. Every few milliseconds it updates the whole list at once, using a rule that says "how fast each number is changing depends on the list and on the commands".

That list is the **[[state vector|state-word]]**. The rule is a **system of first-order ODEs** — several first-order differential equations that are solved together. When the rule is linear, it is written in **state-space form**, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$. Every simulation, every Kalman filter and every modern controller is built on this one form.

The payoff is that everything looks the same. A slow actuator, a damped oscillator, a flexible booster and a fifteen-number navigation model are all one kind of object: a matrix $\mathbf{A}$. The poles of lessons 2 and 3 turn out to be the eigenvalues of $\mathbf{A}$. The three separate cases for the roots (two real, repeated, complex) merge into one formula, $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, built on the **matrix exponential** you met in the linear algebra module. And the step a Kalman filter takes from one moment to the next, $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$, is that same matrix exponential over one time step.

## What the state is

The **state** of a system at time $t$ is the smallest set of numbers that, together with the inputs from $t$ onward, pins down the entire future.

Throw a ball. To predict where it goes, you need to know where it is now *and* how fast it is moving now. Its position alone is not enough — a ball at the top of its arc and a ball that has only now left your hand can be at the same height. So a point mass moving on a line has a state of two numbers: position and velocity. That matches Newton's law being second order: a second-order equation needs two starting values.

The same counting works everywhere:

- A spinning rigid body: attitude and spin rate.
- An actuator modeled as a first-order lag (lesson 1): one number, its output $y$.
- An $n$-th order equation: $n$ numbers.
- Several coupled equations: add up their orders.

## State-space form

Stack the state numbers into a column, the vector $\mathbf{x}$ (bold x). If there are $n$ of them we write $\mathbf{x} \in \mathbb{R}^n$, read "x is in R n": a list of $n$ real numbers. Stack the inputs — commands, disturbances — into $\mathbf{u}$, with $m$ entries. Stack the outputs you measure or care about into $\mathbf{y}$, with $p$ entries.

A **linear time-invariant** (LTI) system — linear, and with rules that do not change over time — is written

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}.
$$

Read $\dot{\mathbf{x}}$ as "x dot": the rate of change of every state number at once. The four constant matrices each have a job:

- $\mathbf{A}$, $n \times n$, the **system matrix** or **dynamics matrix**: how the state drives its own rate of change.
- $\mathbf{B}$, $n \times m$, the **input matrix**: how the inputs push on the state.
- $\mathbf{C}$, $p \times n$, the **output matrix**: which combinations of the state you actually see.
- $\mathbf{D}$, $p \times m$, the **direct feedthrough**: input that appears in the output instantly. For physical systems it is usually zero, because a push takes time to show up.

The first equation is the dynamics. The second is the sensor.

Units follow the rows and columns. Each entry of $\mathbf{A}$ has units of (the rate in its row) divided by (the state in its column). A row saying $\dot{\theta} = \omega$ holds a plain $1$. A row that turns an angle into an angular acceleration holds entries in $\mathrm{s^{-2}}$.

## Turning an $n$-th order equation into state space

Take any linear equation of order $n$, divided through so the top derivative has coefficient one:

$$
y^{(n)} + a_{n-1}y^{(n-1)} + \cdots + a_1\dot{y} + a_0 y = b\,u(t).
$$

Here $y^{(n)}$ means the $n$-th derivative of $y$.

Choose the state to be the output and its derivatives up to one below the top: $x_1 = y$, $x_2 = \dot{y}$, …, $x_n = y^{(n-1)}$. Now the first $n - 1$ state equations are free — they are definitions:

$$
\dot{x}_1 = x_2, \qquad \dot{x}_2 = x_3, \qquad \ldots, \qquad \dot{x}_{n-1} = x_n.
$$

The derivative of "position" is "velocity", which is the next state. The last equation comes from solving the original equation for its top derivative:

$$
\dot{x}_n = y^{(n)} = -a_0x_1 - a_1x_2 - \cdots - a_{n-1}x_n + b\,u.
$$

In matrix form this is the **[[companion form|companion-name]]** (also called controllable canonical form):

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 & \cdots & 0 \\ 0 & 0 & 1 & \cdots & 0 \\ \vdots & & & \ddots & \vdots \\ 0 & 0 & 0 & \cdots & 1 \\ -a_0 & -a_1 & -a_2 & \cdots & -a_{n-1} \end{bmatrix}, \qquad \mathbf{B} = \begin{bmatrix} 0 \\ 0 \\ \vdots \\ 0 \\ b \end{bmatrix}, \qquad \mathbf{C} = \begin{bmatrix} 1 & 0 & \cdots & 0 \end{bmatrix}, \qquad \mathbf{D} = 0.
$$

There are ones directly above the diagonal (the **superdiagonal**). The bottom row holds the ODE's coefficients with their signs flipped, in increasing order of derivative. The input enters only the last row. The bottom row is where people slip: its entries are the *negatives* of the coefficients, and $a_0$ — the coefficient of $y$ itself — comes first.

For the canonical second-order system of lesson 3, $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$, with $\mathbf{x} = [y, \dot{y}]^T$ (the little $T$, "transpose", turns the row into a column):

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & -2\zeta\omega_n \end{bmatrix}, \qquad \mathbf{B} = \begin{bmatrix} 0 \\ \omega_n^2 \end{bmatrix}, \qquad \mathbf{C} = \begin{bmatrix} 1 & 0 \end{bmatrix}, \qquad \mathbf{D} = 0.
$$

::: key
Companion form of $\ddot{y} + a_1\dot{y} + a_0y = bu$ with $\mathbf{x} = [y, \dot{y}]^T$: $\dot{x}_1 = x_2$ and $\dot{x}_2 = -a_0x_1 - a_1x_2 + bu$, so $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$, $\mathbf{B} = [0, b]^T$, $\mathbf{C} = [1, 0]$, $\mathbf{D} = 0$. For $\ddot{y} + 3\dot{y} + 2y = u$: $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, $\mathbf{B} = [0, 1]^T$, $\mathbf{C} = [1, 0]$, $\mathbf{D} = 0$.
:::

::: warning Two slips in the bottom row
The common mistakes are forgetting the minus signs, and writing the coefficients in the wrong order — $[-a_1, -a_0]$ instead of $[-a_0, -a_1]$. Both give a matrix with the wrong eigenvalues, so the model moves differently from the real system. Always check by working out $\det(s\mathbf{I} - \mathbf{A})$. It must give back the characteristic polynomial of the original equation, as the next section shows.
:::

The companion form is one choice of state, not the only one, and often not the most physical. When a system is built from several linked equations, write one state equation for each physical quantity directly.

::: example A PD satellite with a slow reaction wheel
Lesson 2 steered a satellite with moment of inertia $I = 50\,\mathrm{kg\,m^2}$ using the torque law $T = -K_p\theta - K_d\dot{\theta}$, with $K_p = 20\,\mathrm{N\,m/rad}$ and $K_d = 40\,\mathrm{N\,m\,s/rad}$. Now make it more honest. The **[[reaction wheel|reaction-wheel]]** that makes the torque cannot respond instantly. Model it as a first-order lag with time constant $\tau = 0.05\,\mathrm{s}$: the torque it delivers, $T$, obeys $\tau\dot{T} + T = T_c$, where $T_c = -K_p\theta - K_d\dot{\theta}$ is the torque the computer asked for.

**Choose the state.** Three quantities have derivatives in these equations: $\theta$, $\dot{\theta}$ and $T$. So $\mathbf{x} = [\theta, \dot{\theta}, T]^T$.

**Write one equation per state.** The angle's rate is the rate state. The rate's rate is torque over inertia. The torque's rate comes from the lag equation, divided by $\tau$:

$$
\dot{x}_1 = x_2, \qquad \dot{x}_2 = \frac{1}{I}x_3, \qquad \dot{x}_3 = -\frac{K_p}{\tau}x_1 - \frac{K_d}{\tau}x_2 - \frac{1}{\tau}x_3.
$$

**Put in the numbers.** $1/I = 0.02$, $K_p/\tau = 400$, $K_d/\tau = 800$, $1/\tau = 20$:

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 0.02 \\ -400 & -800 & -20 \end{bmatrix}.
$$

The $(1, 2)$ entry is a plain $1$. The $(2, 3)$ entry is in $\mathrm{kg^{-1}\,m^{-2}}$. The bottom row is in $\mathrm{N\,m\,s^{-1}/rad}$, $\mathrm{N\,m/rad}$ and $\mathrm{s^{-1}}$. The loop is closed, so there is no outside input. If you add a disturbance torque $T_d$ pushing on the body, $\mathbf{B} = [0, 1/I, 0]^T$. The output we care about is the angle, so $\mathbf{C} = [1, 0, 0]$.

**Find the poles.** Expanding $\det(s\mathbf{I} - \mathbf{A})$ along the first row gives

$$
s^3 + \frac{1}{\tau}s^2 + \frac{K_d}{I\tau}s + \frac{K_p}{I\tau} = s^3 + 20s^2 + 16s + 8.
$$

Its roots are $s = -19.2\,\mathrm{s^{-1}}$ and $s = -0.406 \pm 0.502j\ \mathrm{s^{-1}}$.

**Read them.** The fast real root is the wheel, barely moved from its own value $-1/\tau = -20$. The complex pair is the attitude loop, with $\omega_n = \sqrt{0.406^2 + 0.502^2} = 0.646\,\mathrm{rad/s}$ and $\zeta = 0.406/0.646 = 0.629$. Without the lag, lesson 2 had $-0.4 \pm 0.490j$ and $\zeta = 0.632$. Sanity check: a wheel thirty times faster than the loop should hardly matter, and it hardly does. Lesson 8 shows what happens when it is not fast enough.
:::

## The eigenvalues are the poles

In lesson 2 you guessed $y = e^{st}$. Try the same guess on the whole vector: $\mathbf{x}(t) = \mathbf{v}e^{\lambda t}$, where $\mathbf{v}$ is a fixed vector and $\lambda$ ("lambda") a number. Then $\dot{\mathbf{x}} = \lambda\mathbf{v}e^{\lambda t}$. Put both into $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ and cancel the $e^{\lambda t}$:

$$
\lambda\mathbf{v} = \mathbf{A}\mathbf{v}.
$$

That is the eigenvalue equation. The guess works exactly when $\lambda$ is an eigenvalue of $\mathbf{A}$ and $\mathbf{v}$ is its eigenvector. The eigenvalues are the roots of

$$
\det(s\mathbf{I} - \mathbf{A}) = 0,
$$

the characteristic polynomial of the matrix. For a companion matrix it is exactly the characteristic polynomial of the ODE. Here is the $2 \times 2$ case, using "top-left times bottom-right minus top-right times bottom-left":

$$
\det\begin{bmatrix} s & -1 \\ a_0 & s + a_1 \end{bmatrix} = s(s + a_1) - (-1)(a_0) = s^2 + a_1s + a_0.
$$

So the poles of lessons 2 and 3 *are* the eigenvalues of $\mathbf{A}$. Each one gives a **[[mode|mode-picture]]** $\mathbf{v}e^{\lambda t}$ of the free motion. The mode now has a direction $\mathbf{v}$ in the space of states as well as a behavior in time.

For $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$ the eigenvalues are $-1$ and $-2$, with eigenvectors $[1, -1]^T$ and $[1, -2]^T$. Sanity check: in each mode the velocity is $\lambda$ times the position. It has to be, because $x_2 = \dot{x}_1$, and the derivative of $e^{\lambda t}$ is $\lambda e^{\lambda t}$.

The free response is the sum of the modes, $\mathbf{x}(t) = \sum_i c_i\mathbf{v}_ie^{\lambda_it}$, with the numbers $c_i$ chosen so that $\sum_i c_i\mathbf{v}_i = \mathbf{x}(0)$. That is a linear system for the $c_i$, and it has a solution whenever the eigenvectors are independent. Complex eigenvalues come in conjugate pairs and combine into real decaying sinusoids, the same way as in lesson 2. This is the diagonalization of the linear algebra module with a physical meaning: diagonalizing $\mathbf{A}$ splits the system into $n$ separate first-order equations, one per mode.

## The matrix exponential

For one number, $\dot{x} = ax$ has the solution $x = x_0e^{at}$. We would like to write the vector answer the same way, $\mathbf{x} = e^{\mathbf{A}t}\mathbf{x}(0)$ — read "e to the A t, times x of zero". For that we need $e$ raised to a matrix. Define it with the same **[[power series|series-settles]]** that defines the ordinary exponential:

$$
e^{\mathbf{A}t} \equiv \mathbf{I} + \mathbf{A}t + \frac{(\mathbf{A}t)^2}{2!} + \frac{(\mathbf{A}t)^3}{3!} + \cdots = \sum_{k=0}^{\infty}\frac{\mathbf{A}^kt^k}{k!}.
$$

Every term is an $n \times n$ matrix, and the sum settles down to a finite answer for every matrix and every $t$. The result is the **matrix exponential**. In dynamics it is also called the **state transition matrix**, $\boldsymbol{\Phi}(t) = e^{\mathbf{A}t}$ ($\boldsymbol{\Phi}$ is the Greek capital "phi"), because it carries the state from time $0$ to time $t$.

Why does it solve the equation? Differentiate the series one term at a time. Each power of $t$ drops by one and brings its exponent down, which cancels one step of the factorial:

$$
\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A} + \mathbf{A}^2t + \frac{\mathbf{A}^3t^2}{2!} + \cdots = \mathbf{A}\left(\mathbf{I} + \mathbf{A}t + \frac{\mathbf{A}^2t^2}{2!} + \cdots\right) = \mathbf{A}e^{\mathbf{A}t}.
$$

So $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ satisfies $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$. It also starts in the right place, because at $t = 0$ every term but the first vanishes and $e^{\mathbf{A}\cdot 0} = \mathbf{I}$. An initial value problem has only one solution, so this is *the* solution — for real roots, repeated roots and complex roots alike, with no cases to sort out.

::: key
Matrix exponential: $e^{\mathbf{A}t} = \sum_{k \ge 0}\mathbf{A}^kt^k/k!$. It satisfies $\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A}e^{\mathbf{A}t}$, $e^{\mathbf{A}\cdot 0} = \mathbf{I}$, $e^{\mathbf{A}(t_1 + t_2)} = e^{\mathbf{A}t_1}e^{\mathbf{A}t_2}$ and $(e^{\mathbf{A}t})^{-1} = e^{-\mathbf{A}t}$. The free response of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, and its eigenvalues are $e^{\lambda_it}$ for the eigenvalues $\lambda_i$ of $\mathbf{A}$.
:::

Three facts in that box are worth saying in words.

- **Steps add up.** $e^{\mathbf{A}(t_1 + t_2)} = e^{\mathbf{A}t_1}e^{\mathbf{A}t_2}$. Moving forward $t_1$ and then $t_2$ is the same as moving forward $t_1 + t_2$ in one go. That is what makes a step-by-step simulation honest.
- **You can run it backward.** $e^{\mathbf{A}t}$ always has an inverse, $e^{-\mathbf{A}t}$.
- **Eigenvectors ride along.** If $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$, then every $\mathbf{A}^k$ acts on $\mathbf{v}$ as the number $\lambda^k$, so the whole series acts on $\mathbf{v}$ as $e^{\lambda t}$. The eigenvectors of $e^{\mathbf{A}t}$ are those of $\mathbf{A}$, and its eigenvalues are $e^{\lambda_it}$.

::: warning Not the exponential of each entry
$e^{\mathbf{A}t}$ is not the matrix you get by taking $e^{a_{ij}t}$ of each entry. Also, in general $e^{\mathbf{A} + \mathbf{B}} \ne e^{\mathbf{A}}e^{\mathbf{B}}$; that rule holds only when $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$. In NumPy, `np.exp(A)` works entry by entry and is wrong here. `scipy.linalg.expm(A)` is the matrix exponential.
:::

### Computing it

The series is a definition, not a good method — although summing it is a fine way to check another method when $\mathbf{A}t$ is small. Three shortcuts cover most hand work.

**When $\mathbf{A}$ can be diagonalized.** Write $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$, where the columns of $\mathbf{V}$ are eigenvectors and $\boldsymbol{\Lambda} = \operatorname{diag}(\lambda_1, \ldots, \lambda_n)$ has the eigenvalues on its diagonal. In $\mathbf{A}^k$ every inner pair $\mathbf{V}^{-1}\mathbf{V}$ cancels, leaving $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$. Put that into the series and pull $\mathbf{V}$ out on both sides:

$$
e^{\mathbf{A}t} = \mathbf{V}\,e^{\boldsymbol{\Lambda}t}\,\mathbf{V}^{-1} = \mathbf{V}\operatorname{diag}\bigl(e^{\lambda_1t}, \ldots, e^{\lambda_nt}\bigr)\mathbf{V}^{-1}.
$$

**When a power of $\mathbf{A}$ is zero.** Such a matrix is called **nilpotent**, and its series stops after a few terms. The **double integrator** $\ddot{y} = u$ — a body with no spring and no damping — has $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$. Multiply it by itself and you get the zero matrix, so

$$
e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix}.
$$

In words: position moves on by velocity times time, and velocity does not change. That is how every coasting body drifts.

**A complex pair.** Suppose a $2 \times 2$ matrix has eigenvalues $-\sigma \pm j\omega_d$ (lesson 3's decay rate $\sigma$ and damped frequency $\omega_d$). Then

$$
e^{\mathbf{A}t} = e^{-\sigma t}\left(\cos(\omega_dt)\,\mathbf{I} + \frac{\sin(\omega_dt)}{\omega_d}\,(\mathbf{A} + \sigma\mathbf{I})\right).
$$

The decay $e^{-\sigma t}$ out front and the cosine and sine inside are exactly the pieces of a decaying oscillation.

::: note Why the complex-pair formula has to be true
Shift the matrix: $\mathbf{N} = \mathbf{A} + \sigma\mathbf{I}$ has eigenvalues $\pm j\omega_d$, so its characteristic polynomial is $s^2 + \omega_d^2$. The **[[Cayley–Hamilton theorem|cayley-hamilton]]** says every matrix satisfies its own characteristic polynomial, so $\mathbf{N}^2 + \omega_d^2\mathbf{I} = \mathbf{0}$, that is $\mathbf{N}^2 = -\omega_d^2\mathbf{I}$.

Now $\mathbf{A}t = -\sigma t\,\mathbf{I} + \mathbf{N}t$, and $\mathbf{I}$ commutes with everything, so $e^{\mathbf{A}t} = e^{-\sigma t}e^{\mathbf{N}t}$. In the series for $e^{\mathbf{N}t}$, the even powers are $\mathbf{N}^{2k} = (-\omega_d^2)^k\mathbf{I}$ and the odd powers are $\mathbf{N}^{2k+1} = (-\omega_d^2)^k\mathbf{N}$. Collecting them,

$$
e^{\mathbf{N}t} = \left(1 - \frac{(\omega_dt)^2}{2!} + \frac{(\omega_dt)^4}{4!} - \cdots\right)\mathbf{I} + \frac{1}{\omega_d}\left(\omega_dt - \frac{(\omega_dt)^3}{3!} + \cdots\right)\mathbf{N},
$$

and those two brackets are the series for $\cos\omega_dt$ and $\sin\omega_dt$.
:::

The special case $\sigma = 0$, $\mathbf{A} = \begin{bmatrix} 0 & \omega \\ -\omega & 0 \end{bmatrix}$, gives

$$
e^{\mathbf{A}t} = \begin{bmatrix} \cos\omega t & \sin\omega t \\ -\sin\omega t & \cos\omega t \end{bmatrix},
$$

a **[[rotation|rotation-circle]]**. The free motion of an undamped oscillator goes round and round a circle in the $(x, \dot{x}/\omega)$ plane. Lesson 8 draws that picture.

::: example The transition matrix of a two-real-pole system
Find $e^{\mathbf{A}t}$ for $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, and use it to carry $\mathbf{x}(0) = [1, 0]^T$ forward to $t = 0.5\,\mathrm{s}$.

**Eigenvectors into $\mathbf{V}$.** The eigenvalues are $-1$ and $-2$, with eigenvectors $[1, -1]^T$ and $[1, -2]^T$. Put them side by side and invert (swap the diagonal, flip the signs off it, divide by the determinant):

$$
\mathbf{V} = \begin{bmatrix} 1 & 1 \\ -1 & -2 \end{bmatrix}, \qquad \det\mathbf{V} = (1)(-2) - (1)(-1) = -1, \qquad \mathbf{V}^{-1} = \begin{bmatrix} 2 & 1 \\ -1 & -1 \end{bmatrix}.
$$

**Multiply out.**

$$
e^{\mathbf{A}t} = \mathbf{V}\begin{bmatrix} e^{-t} & 0 \\ 0 & e^{-2t} \end{bmatrix}\mathbf{V}^{-1} = \begin{bmatrix} 2e^{-t} - e^{-2t} & e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t} \end{bmatrix}.
$$

**Check it two ways.** At $t = 0$ every exponential is $1$ and the matrix becomes $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$, as it must. Differentiate each entry and set $t = 0$: you get $\begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} = \mathbf{A}$, as the rule $\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A}e^{\mathbf{A}t}$ says at $t = 0$.

**Evaluate.** At $t = 0.5$, with $e^{-0.5} = 0.6065$ and $e^{-1} = 0.3679$,

$$
e^{0.5\mathbf{A}} = \begin{bmatrix} 0.845 & 0.239 \\ -0.477 & 0.129 \end{bmatrix}, \qquad \mathbf{x}(0.5) = \begin{bmatrix} 0.845 \\ -0.477 \end{bmatrix}.
$$

Multiplying by $[1, 0]^T$ picks out the first column. That column is the response to a unit starting position, $y = 2e^{-t} - e^{-2t}$ — the same answer lesson 2's method gives for $\ddot{y} + 3\dot{y} + 2y = 0$ with $y(0) = 1$, $\dot{y}(0) = 0$. Summing thirty terms of the power series in Python reproduces every entry to six decimals.
:::

::: example Propagating a pitch-rate loop with a complex pair
The pitch-rate poles of lesson 3, $-1.5 \pm 2j$, belong to $\ddot{y} + 3\dot{y} + 6.25y = 0$. So $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -6.25 & -3 \end{bmatrix}$, with $\sigma = 1.5$ and $\omega_d = 2$.

**The shifted matrix.** $\mathbf{A} + \sigma\mathbf{I} = \begin{bmatrix} 1.5 & 1 \\ -6.25 & -1.5 \end{bmatrix}$. Check that its square is $-\omega_d^2\mathbf{I}$:

$$
\begin{bmatrix} 1.5 & 1 \\ -6.25 & -1.5 \end{bmatrix}^2 = \begin{bmatrix} 2.25 - 6.25 & 1.5 - 1.5 \\ -9.375 + 9.375 & -6.25 + 2.25 \end{bmatrix} = -4\mathbf{I},
$$

and $\omega_d^2 = 4$, as promised.

**At $t = 1\,\mathrm{s}$.** $e^{-1.5} = 0.2231$, $\cos 2 = -0.4161$ and $\sin 2 / 2 = 0.4546$ (angles in radians):

$$
e^{\mathbf{A}} = 0.2231\left(-0.4161\,\mathbf{I} + 0.4546\begin{bmatrix} 1.5 & 1 \\ -6.25 & -1.5 \end{bmatrix}\right) = \begin{bmatrix} 0.0593 & 0.1014 \\ -0.634 & -0.245 \end{bmatrix}.
$$

**Use it.** Let go of the vehicle with a $0.1\,\mathrm{rad}$ error and no rate, $\mathbf{x}(0) = [0.1, 0]^T$. One second later, $\mathbf{x}(1) = [0.00593, -0.0634]^T$. The error has shrunk to 6% of where it started, and the rate is still negative — the angle is heading down fast and will cross zero and overshoot. That is what $\zeta = 0.6$ predicts.
:::

## Adding an input, and stepping it on a computer

Now switch on the input. The vector equation $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ gives way to the same integrating-factor trick as lesson 1. Multiply by $e^{-\mathbf{A}t}$ and notice that the left side is the derivative of a product:

$$
\frac{d}{dt}\bigl(e^{-\mathbf{A}t}\mathbf{x}\bigr) = e^{-\mathbf{A}t}\dot{\mathbf{x}} - \mathbf{A}e^{-\mathbf{A}t}\mathbf{x} = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}.
$$

Integrate from $0$ to $t$, then multiply through by $e^{\mathbf{A}t}$:

$$
\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau.
$$

Here $\tau$ ("tau") is a dummy variable that runs over past times. The two pieces have names:

- The **zero-input response**, $e^{\mathbf{A}t}\mathbf{x}(0)$: what the starting state does on its own.
- The **zero-state response**, the integral: the piled-up effect of the input. Each past input $\mathbf{u}(\tau)$ is carried forward by $e^{\mathbf{A}(t - \tau)}$ for the time that remains.

Lesson 7 will recognize that integral as a *convolution*.

On a flight computer the command is held constant between samples: $\mathbf{u}(t) = \mathbf{u}_k$ for $t_k \le t < t_k + \Delta t$. Over one step the formula becomes an exact **discretization** — a rule that jumps from one sample to the next with no error:

$$
\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k, \qquad \boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}, \qquad \boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\eta}\,d\eta\;\mathbf{B}.
$$

($\boldsymbol{\Gamma}$ is capital "gamma", and $\eta$, "eta", is another dummy variable.)

Try it on the double integrator with $\mathbf{B} = [0, 1]^T$. From above, $e^{\mathbf{A}\eta}\mathbf{B} = [\eta, 1]^T$. Integrating from $0$ to $\Delta t$ gives $\boldsymbol{\Gamma} = [\Delta t^2/2, \Delta t]^T$. That is the constant-acceleration formula from physics class, $x_{k+1} = x_k + v_k\Delta t + \tfrac{1}{2}a\Delta t^2$. With $\Delta t = 0.1\,\mathrm{s}$, $\boldsymbol{\Phi} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1 \end{bmatrix}$ and $\boldsymbol{\Gamma} = [0.005, 0.1]^T$.

For the first-order lag $\dot{y} = -y/\tau + u/\tau$ with $\tau = 0.05\,\mathrm{s}$ and $\Delta t = 0.01\,\mathrm{s}$, everything is a single number: $\Phi = e^{-0.2} = 0.819$ and $\Gamma = 1 - e^{-0.2} = 0.181$. These $\boldsymbol{\Phi}$ and $\boldsymbol{\Gamma}$ are what a **[[Kalman filter|kalman-predict]]** multiplies by in its prediction step.

::: note A gyro with a bias
Here is a small model you will meet again and again in navigation. A gyro measures spin rate, but its reading carries an unknown constant error, the **bias** $b$. The true rate is the measured rate minus the bias, so $\dot{\theta} = \omega_{\mathrm{meas}} - b$, and the bias does not change, $\dot{b} = 0$.

With state $[\theta, b]^T$, the matrix is $\mathbf{A} = \begin{bmatrix} 0 & -1 \\ 0 & 0 \end{bmatrix}$. It is nilpotent, so $e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{bmatrix} 1 & -t \\ 0 & 1 \end{bmatrix}$. The top-right entry says: the angle error grows by the bias times the time. An uncorrected bias of $0.01^\circ/\mathrm{s}$ — **[[typical of a cheap gyro|gyro-grades]]** — gives $0.1^\circ$ of error after $10\,\mathrm{s}$ and $36^\circ$ after an hour. The transition matrix tells you that without solving anything.
:::

In Python, SciPy's `expm` computes the matrix exponential for you:

```python
import numpy as np
from scipy.linalg import expm

A = np.array([[0.0, 1.0], [-2.0, -3.0]])
Phi = expm(0.5 * A)                  # state transition over 0.5 s
print(np.round(Phi, 3))
# [[ 0.845  0.239]
#  [-0.477  0.129]]
print(np.linalg.eigvals(A))          # the poles
# [-1. -2.]
```

## Check yourself

::: check
Write $\dddot{y} + 4\ddot{y} + 5\dot{y} + 2y = 3u$ in state-space form with $\mathbf{x} = [y, \dot{y}, \ddot{y}]^T$. Then check that $\det(s\mathbf{I} - \mathbf{A})$ gives back the characteristic polynomial.
:::

::: answer
The first two state equations are definitions, $\dot{x}_1 = x_2$ and $\dot{x}_2 = x_3$. Solving the ODE for the top derivative gives the third: $\dot{x}_3 = -2x_1 - 5x_2 - 4x_3 + 3u$. So

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ -2 & -5 & -4 \end{bmatrix}, \qquad \mathbf{B} = [0, 0, 3]^T, \qquad \mathbf{C} = [1, 0, 0], \qquad \mathbf{D} = 0.
$$

Expand $\det(s\mathbf{I} - \mathbf{A})$ along the first row: $s\bigl(s(s + 4) + 5\bigr) + 1\cdot\bigl(0\cdot(s + 4) + 2\bigr) = s^3 + 4s^2 + 5s + 2$. That matches. It factors as $(s + 1)^2(s + 2)$: a repeated pole at $-1$ and a pole at $-2$, all stable.
:::

::: check
What is $e^{\mathbf{A}t}$ for $\mathbf{A} = \begin{bmatrix} -1 & 0 \\ 0 & -4 \end{bmatrix}$? And for $\mathbf{A} = \begin{bmatrix} 0 & 3 \\ -3 & 0 \end{bmatrix}$?
:::

::: answer
Powers of a diagonal matrix are diagonal, so the series works on each diagonal entry separately: $e^{\mathbf{A}t} = \operatorname{diag}(e^{-t}, e^{-4t})$. That is two unconnected first-order lags, with time constants $1\,\mathrm{s}$ and $0.25\,\mathrm{s}$.

The second matrix has eigenvalues $\pm 3j$, so $\sigma = 0$ and $\omega_d = 3$. The complex-pair formula gives $e^{\mathbf{A}t} = \cos 3t\,\mathbf{I} + \tfrac{1}{3}\sin 3t\,\mathbf{A} = \begin{bmatrix} \cos 3t & \sin 3t \\ -\sin 3t & \cos 3t \end{bmatrix}$ — a rotation through angle $3t$.
:::

::: check
Explain why the eigenvalues of $e^{\mathbf{A}\Delta t}$ are $e^{\lambda_i\Delta t}$. What does this say about whether the stepped system $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$ is stable?
:::

::: answer
If $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$, then $\mathbf{A}^k\mathbf{v} = \lambda^k\mathbf{v}$. So the series gives $e^{\mathbf{A}\Delta t}\mathbf{v} = \sum_k\frac{(\lambda\Delta t)^k}{k!}\mathbf{v} = e^{\lambda\Delta t}\mathbf{v}$.

Stepping $k$ times multiplies that mode by $(e^{\lambda\Delta t})^k = e^{\lambda k\Delta t}$, which shrinks exactly when $\operatorname{Re}\lambda < 0$ (the real part of $\lambda$ is negative). Put another way: a continuous pole in the left half plane becomes a stepped eigenvalue inside the unit circle, because $|e^{\lambda\Delta t}| = e^{\operatorname{Re}\lambda\,\Delta t} < 1$. The exact discretization keeps a stable system stable for any $\Delta t$. Rough ones, such as $\boldsymbol{\Phi} \approx \mathbf{I} + \mathbf{A}\Delta t$, do not.
:::

::: check
In the satellite-with-wheel example, what would the state and $\mathbf{A}$ be if the wheel torque responded instantly ($\tau \to 0$)? Check that the eigenvalues agree with lesson 2.
:::

::: answer
With no lag, $T = T_c$ at every instant, so the torque is no longer a state. The state is $\mathbf{x} = [\theta, \dot{\theta}]^T$ with $\ddot{\theta} = -(K_p/I)\theta - (K_d/I)\dot{\theta}$, so

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -0.4 & -0.8 \end{bmatrix}.
$$

Then $\det(s\mathbf{I} - \mathbf{A}) = s^2 + 0.8s + 0.4$, whose roots $-0.4 \pm 0.490j$ are exactly lesson 2's. The three-state model's pair, $-0.406 \pm 0.502j$, is within 3% of these. The lag cost almost nothing because its pole at $-19.2$ is about thirty times faster than the loop.
:::

::: check
Start from $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau$. Derive the response of $\dot{y} = -y/\tau_a + u/\tau_a$ to a unit step from rest, and confirm it matches lesson 1.
:::

::: answer
Everything is a single number here: $A = -1/\tau_a$, $B = 1/\tau_a$, $x(0) = 0$ and $u = 1$. The zero-input term is zero. The zero-state term is $\int_0^t e^{-(t - \tau)/\tau_a}\,\frac{1}{\tau_a}\,d\tau$.

Substitute $\eta = t - \tau$ (the time since that bit of input arrived). It becomes $\frac{1}{\tau_a}\int_0^t e^{-\eta/\tau_a}\,d\eta = 1 - e^{-t/\tau_a}$, the first-order step response of lesson 1.

The integrand $e^{-(t - \tau)/\tau_a}/\tau_a$ is how much the input at time $\tau$ still counts at time $t$ — weighted by how much of it the lag has forgotten in between.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ | LTI state-space form; $\mathbf{A}$ is $n \times n$, $\mathbf{B}$ is $n \times m$, $\mathbf{C}$ is $p \times n$, $\mathbf{D}$ is $p \times m$ |
| $\mathbf{x} = [y, \dot{y}, \ldots, y^{(n-1)}]^T$ | Companion-form state: ones on the superdiagonal, $[-a_0, \ldots, -a_{n-1}]$ in the last row, input in the last row |
| $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & -2\zeta\omega_n \end{bmatrix}$, $\mathbf{B} = [0, \omega_n^2]^T$ | Canonical second-order system in state space |
| $\det(s\mathbf{I} - \mathbf{A}) = 0$ | Eigenvalues of $\mathbf{A}$ are the poles; each gives a mode $\mathbf{v}e^{\lambda t}$ |
| $e^{\mathbf{A}t} = \sum_k\mathbf{A}^kt^k/k!$ | Matrix exponential, the state transition matrix $\boldsymbol{\Phi}(t)$ |
| $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ | Free response, every case at once |
| $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$ | When $\mathbf{A}$ can be diagonalized |
| $e^{\mathbf{A}t} = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix}$ | Double integrator (nilpotent $\mathbf{A}$) |
| $e^{\mathbf{A}t} = e^{-\sigma t}\bigl(\cos\omega_dt\,\mathbf{I} + \tfrac{\sin\omega_dt}{\omega_d}(\mathbf{A} + \sigma\mathbf{I})\bigr)$ | $2 \times 2$ with poles $-\sigma \pm j\omega_d$ |
| $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^te^{\mathbf{A}(t-\tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau$ | Zero-input plus zero-state response |
| $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$, $\boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\eta}d\eta\,\mathbf{B}$ | Exact discretization for an input held constant over each step |

The next lesson goes back to the single second-order equation and asks what a steady push does to it — a step, a ramp, and above all a sinusoid. It finds that a lightly damped system, pushed at exactly the right frequency, can blow a small input up a hundredfold.

::: context state-word Why it is called the state
In everyday English, the "state" of something is its condition right now — the state of your room, the state of the weather. Engineers mean the same thing, made exact: the fewest numbers that describe the system's condition completely enough to predict what happens next.

The idea came into control engineering in the late 1950s and 1960s, largely through Rudolf Kálmán's work. It arrived at the same time as digital computers began flying on rockets and spacecraft, and computers love lists of numbers updated step by step. The Apollo guidance computer's navigation filter kept its knowledge of the spacecraft as a state vector.
:::

::: context companion-name Where "companion" comes from
Mathematicians call this the **companion matrix** of a polynomial: it is the matrix that goes along with, or "keeps company with", the polynomial $s^n + a_{n-1}s^{n-1} + \cdots + a_0$. Its characteristic polynomial is exactly that polynomial, so its eigenvalues are exactly the polynomial's roots.

That link runs both ways. Control engineers use it to turn an ODE into a matrix. Numerical programs use it the other way round: NumPy's `np.roots` finds the roots of a polynomial by building its companion matrix and computing the eigenvalues.
:::

::: context reaction-wheel How a reaction wheel turns a spacecraft
A **reaction wheel** is a heavy flywheel driven by an electric motor, mounted inside the spacecraft. Spin the wheel one way and the spacecraft turns the other way, because the total angular momentum has to stay the same — like sitting on a swivel chair and swinging a heavy book to one side: the chair turns the opposite way.

The motor cannot change the wheel's speed instantly. The torque it delivers builds up over a short time, which is why the example models it as a first-order lag. The Hubble Space Telescope points itself with reaction wheels.
:::

::: context mode-picture Two straight-line paths
Each eigenvector is a straight line in the plane of states (position across, velocity up). Start on one and you slide straight in along it: the blue line with $e^{-t}$, the orange line twice as fast with $e^{-2t}$. The red curve starts at $[1, 0]^T$, which is a mix of both. The fast part dies first, so the path bends over and finishes along the slow blue line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="8" x2="180" y2="200" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="300" y="116" font-size="11" fill="#1f2a44">x₁ (position)</text>
  <text x="186" y="12" font-size="11" fill="#1f2a44">x₂ (velocity)</text>
  <line x1="100" y1="20" x2="262" y2="182" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="136" y1="12" x2="224" y2="188" stroke="#f2b880" stroke-width="3"/>
  <text x="266" y="186" font-size="12" fill="#1d6fd1">slow, e⁻ᵗ</text>
  <text x="206" y="40" font-size="12" fill="#1f2a44">fast, e⁻²ᵗ</text>
  <line x1="202" y1="37" x2="154" y2="46" stroke="#1f2a44" stroke-width="1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="220.0,100.0 219.4,108.3 218.0,113.8 216.1,117.2 213.8,119.1 211.4,119.9 208.9,119.9 206.4,119.4 204.0,118.6 201.8,117.5 199.6,116.4 197.7,115.1 195.9,113.9 194.2,112.7 192.7,111.5 191.3,110.4 190.1,109.4 189.0,108.4 188.0,107.5 187.1,106.7 186.3,106.0 185.6,105.4 185.0,104.8 184.4,104.3 183.9,103.8 183.4,103.4 183.0,103.0 182.7,102.6 182.4,102.3 182.1,102.1 181.9,101.8 181.6,101.6 181.5,101.4 181.3,101.3 181.1,101.1 181.0,101.0 180.9,100.9 180.8,100.8 180.7,100.7 180.6,100.6 180.5,100.5 180.5,100.5 180.4,100.4 180.4,100.4 180.3,100.3 180.3,100.3 180.3,100.3 180.2,100.2 180.2,100.2"/>
  <circle cx="220" cy="100" r="4.5" fill="#b4232c"/>
  <text x="226" y="92" font-size="11" fill="#b4232c">start [1, 0]</text>
</svg>
```

The curve is drawn from the exact solution $\mathbf{x}(t) = [2e^{-t} - e^{-2t},\ -2e^{-t} + 2e^{-2t}]^T$.
:::

::: context series-settles Why the series always settles down
Each term of $e^{a}$ is $a^k/k!$. The top grows by a factor $a$ each step; the bottom grows by a factor $k$. Once $k$ is bigger than $a$, the bottom wins and the terms shrink fast. Here are the terms of $e^5$: they climb to $26.0$ at $k = 4$ and $5$, then fall away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="34" y1="140" x2="360" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="135.8" width="16" height="4.2" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="60" y="118.9" width="16" height="21.1" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="80" y="87.2" width="16" height="52.8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="100" y="52.0" width="16" height="88.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="120" y="30.0" width="16" height="110.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="140" y="30.0" width="16" height="110.0" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="160" y="48.3" width="16" height="91.7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="180" y="74.5" width="16" height="65.5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="200" y="99.1" width="16" height="40.9" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="220" y="117.3" width="16" height="22.7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="240" y="128.6" width="16" height="11.4" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="260" y="134.8" width="16" height="5.2" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="280" y="137.8" width="16" height="2.2" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="300" y="139.2" width="16" height="0.8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="320" y="139.7" width="16" height="0.3" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <rect x="340" y="139.9" width="16" height="0.1" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="156">0</text><text x="148" y="156">5</text><text x="248" y="156">10</text><text x="348" y="156">15</text>
    <text x="128" y="24">26.0, 26.0</text>
  </g>
  <text x="200" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">k</text>
  <text x="220" y="60" font-size="12" fill="#1f2a44">term 5ᵏ / k!</text>
  <text x="220" y="78" font-size="12" fill="#1f2a44">rises, then falls fast</text>
</svg>
```

They add up to $e^5 \approx 148.4$. The same race happens for a matrix, with the size of $\mathbf{A}t$ playing the part of $a$. So the series always settles down — though for a big $\mathbf{A}t$ it can take many terms, which is one reason software uses cleverer methods.
:::

::: context cayley-hamilton Every matrix obeys its own equation
The **Cayley–Hamilton theorem** says: take the characteristic polynomial of a square matrix, put the matrix itself in place of $s$, and you get the zero matrix.

Try it on $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, whose polynomial is $s^2 + 3s + 2$. Squaring gives $\mathbf{A}^2 = \begin{bmatrix} -2 & -3 \\ 6 & 7 \end{bmatrix}$, and $\mathbf{A}^2 + 3\mathbf{A} + 2\mathbf{I} = \begin{bmatrix} -2 + 0 + 2 & -3 + 3 + 0 \\ 6 - 6 + 0 & 7 - 9 + 2 \end{bmatrix} = \mathbf{0}$.

It is named after Arthur Cayley and William Rowan Hamilton, two nineteenth-century mathematicians. Its practical meaning: any power of an $n \times n$ matrix can be rewritten using only $\mathbf{I}, \mathbf{A}, \ldots, \mathbf{A}^{n-1}$.
:::

::: context rotation-circle Going round the circle
For an undamped oscillator, plot position $x_1$ across and $x_2 = \dot{x}/\omega$ up. The state starts at $[1, 0]^T$ (black dot). Multiplying by $e^{\mathbf{A}t}$ turns it clockwise by the angle $\omega t$ — here $60^\circ$ — and it never leaves the circle, because nothing takes energy out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="rh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <line x1="30" y1="100" x2="215" y2="100" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="120" y1="12" x2="120" y2="192" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="200" y="92" font-size="11" fill="#1f2a44">x₁</text>
  <text x="126" y="20" font-size="11" fill="#1f2a44">x₂</text>
  <circle cx="120" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="100" x2="190" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="100" x2="155.0" y2="160.6" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="190" cy="100" r="5" fill="#1f2a44"/>
  <circle cx="155.0" cy="160.6" r="5" fill="#1d6fd1"/>
  <path d="M205,100 A85,85 0 0,1 162.5,173.6" fill="none" stroke="#1d6fd1" stroke-width="2" marker-end="url(#rh)"/>
  <text x="200" y="152" font-size="12" fill="#1d6fd1">ωt = 60°</text>
  <text x="236" y="44" font-size="12" fill="#1f2a44">e^(At) turns the</text>
  <text x="236" y="62" font-size="12" fill="#1f2a44">state clockwise</text>
  <text x="236" y="80" font-size="12" fill="#1f2a44">by the angle ωt</text>
</svg>
```

Add damping and the circle becomes a spiral that winds in toward the center.
:::

::: context kalman-predict Where Φ lives in a Kalman filter
A **Kalman filter** is the program a spacecraft uses to blend a model of its motion with noisy sensor readings. It runs in a loop of two steps. **Predict:** push the best guess of the state forward one time step with $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k$. **Update:** when a measurement arrives, nudge the guess toward it.

So the $\boldsymbol{\Phi}$ you have computed is the heart of the predict step. You will build one yourself in the estimation track; the matrix exponential is where it starts.
:::

::: context gyro-grades How good are real gyros?
A bias of $0.01^\circ/\mathrm{s}$ — $36^\circ$ per hour — is about what a cheap phone-grade MEMS gyro can drift. Gyros are sorted into rough grades by bias. **Tactical-grade** units, used in missiles and drones, drift somewhere around $1$ to $10$ degrees per hour. **Navigation-grade** units, used in airliners and spacecraft, drift around $0.01$ degrees per hour or better.

Whatever the grade, the transition matrix says the angle error grows in a straight line with time until something outside — a star tracker, a sun sensor — measures the attitude and lets the filter estimate the bias and remove it.
:::
