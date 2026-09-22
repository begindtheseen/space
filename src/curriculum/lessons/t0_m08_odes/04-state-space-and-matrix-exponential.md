---
id: l04-state-space-and-matrix-exponential
title: State-space form and the matrix exponential
minutes: 18
covers:
  - systems of first-order ODEs and state-space form
  - matrix exponential solution
---

A flight computer does not solve second-order equations. It stores a list of numbers — position, velocity, attitude, angular rate, gyro biases, perhaps a hundred entries for a full navigation filter — and at every step it updates the whole list at once using a rule of the form "rate of change of the list equals a function of the list and the inputs". That list is the **state vector**, the rule is a **system of first-order ODEs**, and when the rule is linear it is written in the **state-space form** $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$. Every simulation, every Kalman filter, and every modern controller is built on this form.

The payoff is uniformity. A first-order actuator lag, a second-order damped oscillator, a fifth-order flexible booster and a fifteen-state navigation model are all the same object — a matrix $\mathbf{A}$ — and the same theorems apply to all of them. The poles of lessons 2 and 3 become the eigenvalues of $\mathbf{A}$. The case-by-case solutions (two exponentials, a repeated root, a decaying sinusoid) collapse into one formula, $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, built on the **matrix exponential**. And the discrete-time propagation step of a Kalman filter, $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$, is the matrix exponential evaluated at the sample interval.

This lesson shows how to convert any $n$-th order linear ODE into state-space form, why the eigenvalues of $\mathbf{A}$ are the poles, what $e^{\mathbf{A}t}$ means and how to compute it, and how the forced solution and its discretisation follow. It leans on the eigenvalue and diagonalisation material of the linear algebra modules.

## State and the state-space form

The **state** of a system at time $t$ is the smallest set of numbers which, together with the inputs from $t$ onward, determines the entire future. For a point mass on a line the state is position and velocity: two numbers, because Newton's law is second order and needs two initial conditions. For a rotating rigid body it is attitude and angular rate. For an actuator modelled as a first-order lag it is the single number $y$. In general an $n$-th order ODE has an $n$-dimensional state, and a collection of coupled ODEs has a state whose dimension is the sum of their orders.

Stack the state variables into a column vector $\mathbf{x} \in \mathbb{R}^n$, the inputs into $\mathbf{u} \in \mathbb{R}^m$, and the measured or commanded outputs into $\mathbf{y} \in \mathbb{R}^p$. A **linear time-invariant** (LTI) system in state-space form is

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u},
$$

with constant matrices $\mathbf{A}$ ($n \times n$, the **system** or **dynamics matrix**), $\mathbf{B}$ ($n \times m$, the **input matrix**), $\mathbf{C}$ ($p \times n$, the **output matrix**) and $\mathbf{D}$ ($p \times m$, the **direct feedthrough**, usually zero for physical systems because inputs do not instantaneously appear in outputs). The first equation is the dynamics; the second says which combinations of state you actually see. Units: each entry of $\mathbf{A}$ carries the units of (row state rate)/(column state), so a row that says $\dot{\theta} = \omega$ has a dimensionless 1 in it, while a row that turns an angle into an angular acceleration has entries in $\mathrm{s^{-2}}$.

## Converting an $n$-th order ODE: the companion form

Take the general $n$-th order linear ODE with the leading coefficient normalised to one,

$$
y^{(n)} + a_{n-1}y^{(n-1)} + \cdots + a_1\dot{y} + a_0 y = b\,u(t).
$$

Choose the state to be the output and its first $n - 1$ derivatives: $x_1 = y$, $x_2 = \dot{y}$, …, $x_n = y^{(n-1)}$. Then the first $n - 1$ state equations are definitions — $\dot{x}_1 = x_2$, $\dot{x}_2 = x_3$, and so on — and the last comes from solving the ODE for the highest derivative:

$$
\dot{x}_n = y^{(n)} = -a_0x_1 - a_1x_2 - \cdots - a_{n-1}x_n + b\,u.
$$

In matrix form this is the **companion** (or controllable canonical) form:

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 & \cdots & 0 \\ 0 & 0 & 1 & \cdots & 0 \\ \vdots & & & \ddots & \vdots \\ 0 & 0 & 0 & \cdots & 1 \\ -a_0 & -a_1 & -a_2 & \cdots & -a_{n-1} \end{bmatrix}, \qquad \mathbf{B} = \begin{bmatrix} 0 \\ 0 \\ \vdots \\ 0 \\ b \end{bmatrix}, \qquad \mathbf{C} = \begin{bmatrix} 1 & 0 & \cdots & 0 \end{bmatrix}, \qquad \mathbf{D} = 0.
$$

Ones on the superdiagonal, the negated ODE coefficients along the bottom row in increasing order of derivative, and the input entering only the last row. The bottom row is the part that goes wrong: its entries are the *negatives* of the coefficients, and $a_0$ (the coefficient of $y$ itself) comes first.

For the canonical second-order system $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$, with $\mathbf{x} = [y, \dot{y}]^T$,

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & -2\zeta\omega_n \end{bmatrix}, \qquad \mathbf{B} = \begin{bmatrix} 0 \\ \omega_n^2 \end{bmatrix}, \qquad \mathbf{C} = \begin{bmatrix} 1 & 0 \end{bmatrix}, \qquad \mathbf{D} = 0.
$$

::: key
Companion form of $\ddot{y} + a_1\dot{y} + a_0y = bu$ with $\mathbf{x} = [y, \dot{y}]^T$: $\dot{x}_1 = x_2$ and $\dot{x}_2 = -a_0x_1 - a_1x_2 + bu$, so $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -a_0 & -a_1 \end{bmatrix}$, $\mathbf{B} = [0, b]^T$, $\mathbf{C} = [1, 0]$, $\mathbf{D} = 0$. For $\ddot{y} + 3\dot{y} + 2y = u$: $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, $\mathbf{B} = [0, 1]^T$, $\mathbf{C} = [1, 0]$, $\mathbf{D} = 0$.
:::

::: warning
The two most common slips in the bottom row are forgetting the minus signs and writing the coefficients in the wrong order — $[-a_1, -a_0]$ instead of $[-a_0, -a_1]$. Both produce a matrix with the wrong eigenvalues. Always check by computing $\det(s\mathbf{I} - \mathbf{A})$: it must reproduce the characteristic polynomial of the original ODE, as the next section shows.
:::

The companion form is not the only choice of state, and often not the physical one. If a system is built from several coupled equations, write a state equation for each physical variable directly.

::: example A PD satellite with an actuator lag, as a state-space model
Lesson 2 controlled a satellite with $I = 50\,\mathrm{kg\,m^2}$ using $T = -K_p\theta - K_d\dot{\theta}$ with $K_p = 20\,\mathrm{N\,m/rad}$ and $K_d = 40\,\mathrm{N\,m\,s/rad}$. Now suppose the reaction wheel that produces the torque is a first-order lag with $\tau = 0.05\,\mathrm{s}$: the delivered torque $T$ obeys $\tau\dot{T} + T = T_c$, where $T_c = -K_p\theta - K_d\dot{\theta}$ is the commanded torque. Three variables have derivatives in the equations, so the state is $\mathbf{x} = [\theta, \dot{\theta}, T]^T$, and the three state equations are

$$
\dot{x}_1 = x_2, \qquad \dot{x}_2 = \frac{1}{I}x_3, \qquad \dot{x}_3 = -\frac{K_p}{\tau}x_1 - \frac{K_d}{\tau}x_2 - \frac{1}{\tau}x_3.
$$

Numerically,

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 0.02 \\ -400 & -800 & -20 \end{bmatrix},
$$

with a dimensionless 1 in the $(1, 2)$ entry, $\mathrm{kg^{-1}\,m^{-2}}$ in the $(2, 3)$ entry, and $\mathrm{N\,m\,s^{-1}/rad}$, $\mathrm{N\,m/rad}$ and $\mathrm{s^{-1}}$ along the bottom row. There is no external input here (the loop is closed), so $\mathbf{B}$ is empty or, if you add a disturbance torque $T_d$ acting on the body, $\mathbf{B} = [0, 1/I, 0]^T$. The output of interest is the attitude, $\mathbf{C} = [1, 0, 0]$.

The characteristic polynomial $\det(s\mathbf{I} - \mathbf{A})$, expanded along the first row, is

$$
s^3 + \frac{1}{\tau}s^2 + \frac{K_d}{I\tau}s + \frac{K_p}{I\tau} = s^3 + 20s^2 + 16s + 8.
$$

Its roots are $s = -19.2\,\mathrm{s^{-1}}$ and $s = -0.406 \pm 0.502j\ \mathrm{s^{-1}}$. The fast real root is the actuator, barely moved from its open-loop value $-1/\tau = -20$. The complex pair is the attitude loop: $\omega_n = \sqrt{0.406^2 + 0.502^2} = 0.646\,\mathrm{rad/s}$ and $\zeta = 0.406/0.646 = 0.629$, compared with $-0.4 \pm 0.490j$ and $\zeta = 0.632$ without the lag. This actuator is fast enough to be nearly invisible; lesson 8 shows what happens when it is not.
:::

## Eigenvalues are the poles

Try the exponential ansatz on the vector equation: guess $\mathbf{x}(t) = \mathbf{v}e^{\lambda t}$ with $\mathbf{v}$ a constant vector. Then $\dot{\mathbf{x}} = \lambda\mathbf{v}e^{\lambda t}$, and the homogeneous equation $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ becomes $\lambda\mathbf{v} = \mathbf{A}\mathbf{v}$: the guess works exactly when $\lambda$ is an eigenvalue of $\mathbf{A}$ and $\mathbf{v}$ its eigenvector. The eigenvalues are the roots of

$$
\det(s\mathbf{I} - \mathbf{A}) = 0,
$$

which is the characteristic polynomial of the matrix — and for a companion matrix it is exactly the characteristic polynomial of the ODE. For the $2 \times 2$ companion form,

$$
\det\begin{bmatrix} s & -1 \\ a_0 & s + a_1 \end{bmatrix} = s(s + a_1) + a_0 = s^2 + a_1s + a_0.
$$

So the poles of lessons 2 and 3 *are* the eigenvalues of $\mathbf{A}$, and each eigenvalue contributes a mode $\mathbf{v}e^{\lambda t}$ to the free motion, now with a direction $\mathbf{v}$ in state space as well as a time behaviour. For $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$ the eigenvalues are $-1$ and $-2$, with eigenvectors $[1, -1]^T$ and $[1, -2]^T$: in each mode the velocity is $\lambda$ times the position, as it must be for $x_2 = \dot{x}_1$ when $x_1 \propto e^{\lambda t}$.

The free response is the sum of the modes, $\mathbf{x}(t) = \sum_i c_i\mathbf{v}_ie^{\lambda_it}$, with the $c_i$ chosen so that $\sum_i c_i\mathbf{v}_i = \mathbf{x}(0)$. That is a linear system for the $c_i$, solvable whenever the eigenvectors are independent. Complex eigenvalues come in conjugate pairs with conjugate eigenvectors and combine into real decaying sinusoids exactly as in lesson 2. All of this is the diagonalisation you learned in linear algebra, now with a physical meaning: diagonalising $\mathbf{A}$ decouples the system into $n$ independent first-order equations, one per mode.

## The matrix exponential

For the scalar equation $\dot{x} = ax$ the solution is $x_0e^{at}$. The vector equation has the same solution if we can make sense of $e^{\mathbf{A}t}$ for a matrix. Define it by the same power series that defines the scalar exponential:

$$
e^{\mathbf{A}t} \equiv \mathbf{I} + \mathbf{A}t + \frac{(\mathbf{A}t)^2}{2!} + \frac{(\mathbf{A}t)^3}{3!} + \cdots = \sum_{k=0}^{\infty}\frac{\mathbf{A}^kt^k}{k!}.
$$

Every term is an $n \times n$ matrix, the series converges for every matrix and every $t$, and the result is called the **matrix exponential** or, in the context of dynamics, the **state transition matrix** $\boldsymbol{\Phi}(t) = e^{\mathbf{A}t}$. Differentiate the series term by term:

$$
\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A} + \mathbf{A}^2t + \frac{\mathbf{A}^3t^2}{2!} + \cdots = \mathbf{A}\left(\mathbf{I} + \mathbf{A}t + \frac{\mathbf{A}^2t^2}{2!} + \cdots\right) = \mathbf{A}e^{\mathbf{A}t}.
$$

So $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ satisfies $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ and starts at $\mathbf{x}(0)$ because $e^{\mathbf{A}\cdot 0} = \mathbf{I}$. By uniqueness of the initial value problem it is *the* solution, in every case at once — real roots, repeated roots, complex roots — with no case distinction.

::: key
Matrix exponential: $e^{\mathbf{A}t} = \sum_{k \ge 0}\mathbf{A}^kt^k/k!$. It satisfies $\frac{d}{dt}e^{\mathbf{A}t} = \mathbf{A}e^{\mathbf{A}t}$, $e^{\mathbf{A}\cdot 0} = \mathbf{I}$, $e^{\mathbf{A}(t_1 + t_2)} = e^{\mathbf{A}t_1}e^{\mathbf{A}t_2}$ and $(e^{\mathbf{A}t})^{-1} = e^{-\mathbf{A}t}$. The free response of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$, and its eigenvalues are $e^{\lambda_it}$ for the eigenvalues $\lambda_i$ of $\mathbf{A}$.
:::

Three properties follow from the series. First, $e^{\mathbf{A}(t_1 + t_2)} = e^{\mathbf{A}t_1}e^{\mathbf{A}t_2}$: propagating for $t_1$ then $t_2$ is the same as propagating for $t_1 + t_2$, which is what makes a step-by-step simulation legitimate. Second, $e^{\mathbf{A}t}$ is always invertible with inverse $e^{-\mathbf{A}t}$: you can run the dynamics backward. Third, if $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ then every term of the series acts on $\mathbf{v}$ as a scalar, so $e^{\mathbf{A}t}\mathbf{v} = e^{\lambda t}\mathbf{v}$: the eigenvectors of $e^{\mathbf{A}t}$ are those of $\mathbf{A}$ and its eigenvalues are $e^{\lambda_it}$.

::: warning
$e^{\mathbf{A}t}$ is not the matrix of elementwise exponentials $e^{a_{ij}t}$, and in general $e^{\mathbf{A} + \mathbf{B}} \ne e^{\mathbf{A}}e^{\mathbf{B}}$; the identity holds only when $\mathbf{A}\mathbf{B} = \mathbf{B}\mathbf{A}$. In NumPy, `np.exp(A)` is elementwise and wrong for this purpose; `scipy.linalg.expm(A)` is the matrix exponential.
:::

### Computing it

The series is a definition, not a method — though summing it is a reasonable way to check any other method for small $\|\mathbf{A}t\|$. Three shortcuts cover most hand calculations.

**Diagonalisable $\mathbf{A}$.** If $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ with $\boldsymbol{\Lambda} = \operatorname{diag}(\lambda_1, \ldots, \lambda_n)$, then $\mathbf{A}^k = \mathbf{V}\boldsymbol{\Lambda}^k\mathbf{V}^{-1}$ (the inner $\mathbf{V}^{-1}\mathbf{V}$ pairs cancel), and summing the series,

$$
e^{\mathbf{A}t} = \mathbf{V}\,e^{\boldsymbol{\Lambda}t}\,\mathbf{V}^{-1} = \mathbf{V}\operatorname{diag}\bigl(e^{\lambda_1t}, \ldots, e^{\lambda_nt}\bigr)\mathbf{V}^{-1}.
$$

**Nilpotent $\mathbf{A}$.** If some power of $\mathbf{A}$ is zero, the series terminates. The double integrator $\ddot{y} = u$ — a rigid body with no spring and no damping — has $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$, $\mathbf{A}^2 = \mathbf{0}$, and therefore

$$
e^{\mathbf{A}t} = \mathbf{I} + \mathbf{A}t = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix}:
$$

position advances by velocity times time, velocity is unchanged. That is the free-drift kinematics of every coasting body.

**A complex pair.** For a $2 \times 2$ matrix with eigenvalues $-\sigma \pm j\omega_d$, the shifted matrix $\mathbf{N} = \mathbf{A} + \sigma\mathbf{I}$ has eigenvalues $\pm j\omega_d$, so by the Cayley–Hamilton theorem $\mathbf{N}^2 = -\omega_d^2\mathbf{I}$. Its exponential series then splits into even and odd powers exactly like the series for cosine and sine, giving

$$
e^{\mathbf{A}t} = e^{-\sigma t}\left(\cos(\omega_dt)\,\mathbf{I} + \frac{\sin(\omega_dt)}{\omega_d}\,(\mathbf{A} + \sigma\mathbf{I})\right).
$$

The special case $\sigma = 0$, $\mathbf{A} = \begin{bmatrix} 0 & \omega \\ -\omega & 0 \end{bmatrix}$, gives $e^{\mathbf{A}t} = \begin{bmatrix} \cos\omega t & \sin\omega t \\ -\sin\omega t & \cos\omega t \end{bmatrix}$, a rotation: the free motion of an undamped oscillator traces a circle in the $(x, \dot{x}/\omega)$ plane. Lesson 8 draws that picture.

::: example The transition matrix of a two-real-pole system
Compute $e^{\mathbf{A}t}$ for $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$ and use it to propagate $\mathbf{x}(0) = [1, 0]^T$ to $t = 0.5\,\mathrm{s}$.

The eigenvalues are $-1$ and $-2$ with eigenvectors $[1, -1]^T$ and $[1, -2]^T$, so

$$
\mathbf{V} = \begin{bmatrix} 1 & 1 \\ -1 & -2 \end{bmatrix}, \qquad \det\mathbf{V} = -2 + 1 = -1, \qquad \mathbf{V}^{-1} = \begin{bmatrix} 2 & 1 \\ -1 & -1 \end{bmatrix}.
$$

Then

$$
e^{\mathbf{A}t} = \mathbf{V}\begin{bmatrix} e^{-t} & 0 \\ 0 & e^{-2t} \end{bmatrix}\mathbf{V}^{-1} = \begin{bmatrix} 2e^{-t} - e^{-2t} & e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t} \end{bmatrix}.
$$

Check $t = 0$: $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$. Check the derivative at $t = 0$: differentiating each entry gives $\begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} = \mathbf{A}$. At $t = 0.5$, with $e^{-0.5} = 0.6065$ and $e^{-1} = 0.3679$,

$$
e^{0.5\mathbf{A}} = \begin{bmatrix} 0.845 & 0.239 \\ -0.477 & 0.129 \end{bmatrix}, \qquad \mathbf{x}(0.5) = \begin{bmatrix} 0.845 \\ -0.477 \end{bmatrix}.
$$

The first column is the response to a unit initial position, $y = 2e^{-t} - e^{-2t}$ — the same function lesson 2's method would produce for $\ddot{y} + 3\dot{y} + 2y = 0$ with $y(0) = 1$, $\dot{y}(0) = 0$. Summing thirty terms of the power series in Python reproduces every entry to six decimals.
:::

::: example Propagating a pitch-rate loop with a complex pair
The pitch-rate poles of lesson 3, $-1.5 \pm 2j$, belong to $\ddot{y} + 3\dot{y} + 6.25y = 0$, so $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -6.25 & -3 \end{bmatrix}$ with $\sigma = 1.5$ and $\omega_d = 2$. Then $\mathbf{A} + \sigma\mathbf{I} = \begin{bmatrix} 1.5 & 1 \\ -6.25 & -1.5 \end{bmatrix}$, whose square is $\begin{bmatrix} 2.25 - 6.25 & 0 \\ 0 & -6.25 + 2.25 \end{bmatrix} = -4\mathbf{I} = -\omega_d^2\mathbf{I}$ as promised. At $t = 1\,\mathrm{s}$, $e^{-1.5} = 0.2231$, $\cos 2 = -0.4161$ and $\sin 2 = 0.9093$:

$$
e^{\mathbf{A}} = 0.2231\left(-0.4161\,\mathbf{I} + 0.4546\begin{bmatrix} 1.5 & 1 \\ -6.25 & -1.5 \end{bmatrix}\right) = \begin{bmatrix} 0.0593 & 0.1014 \\ -0.634 & -0.245 \end{bmatrix}.
$$

Released from a $0.1\,\mathrm{rad}$ error at rest, the state after one second is $\mathbf{x}(1) = [0.00593, -0.0634]^T$: the error has shrunk to 6% of its starting value and the rate is still negative, so the response is about to cross zero and overshoot, as $\zeta = 0.6$ predicts.
:::

## The forced solution and discretisation

Now add the input. The vector equation $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ yields to the same integrating-factor trick as lesson 1: multiply by $e^{-\mathbf{A}t}$ and recognise a derivative,

$$
\frac{d}{dt}\bigl(e^{-\mathbf{A}t}\mathbf{x}\bigr) = e^{-\mathbf{A}t}\dot{\mathbf{x}} - \mathbf{A}e^{-\mathbf{A}t}\mathbf{x} = e^{-\mathbf{A}t}\mathbf{B}\mathbf{u}.
$$

Integrate from 0 to $t$ and multiply through by $e^{\mathbf{A}t}$:

$$
\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau.
$$

The first term is the **zero-input response**: what the initial condition does on its own. The second is the **zero-state response**: the accumulated effect of the input, each past input $\mathbf{u}(\tau)$ propagated forward by $e^{\mathbf{A}(t - \tau)}$ for the time remaining. Lesson 7 will recognise this integral as a convolution.

On a flight computer the input is held constant between samples: $\mathbf{u}(t) = \mathbf{u}_k$ for $t_k \le t < t_k + \Delta t$. Over one interval the formula becomes exact **discretisation**:

$$
\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \boldsymbol{\Gamma}\mathbf{u}_k, \qquad \boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}, \qquad \boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\eta}\,d\eta\;\mathbf{B}.
$$

For the double integrator with $\mathbf{B} = [0, 1]^T$, $e^{\mathbf{A}\eta}\mathbf{B} = [\eta, 1]^T$ and integrating gives $\boldsymbol{\Gamma} = [\Delta t^2/2, \Delta t]^T$: exactly the constant-acceleration kinematics $x_{k+1} = x_k + v_k\Delta t + \tfrac{1}{2}a\Delta t^2$. With $\Delta t = 0.1\,\mathrm{s}$, $\boldsymbol{\Phi} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1 \end{bmatrix}$ and $\boldsymbol{\Gamma} = [0.005, 0.1]^T$. For the first-order lag $\dot{y} = -y/\tau + u/\tau$ with $\tau = 0.05\,\mathrm{s}$ and $\Delta t = 0.01\,\mathrm{s}$, $\Phi = e^{-0.2} = 0.819$ and $\Gamma = 1 - e^{-0.2} = 0.181$. These $\boldsymbol{\Phi}$ and $\boldsymbol{\Gamma}$ are what a Kalman filter's prediction step multiplies by.

::: note
A small model you will meet repeatedly in navigation: attitude $\theta$ integrated from a gyro whose measurement carries an unknown constant bias $b$. The true rate is the measured rate minus the bias, so $\dot{\theta} = \omega_{\mathrm{meas}} - b$ and $\dot{b} = 0$. With state $[\theta, b]^T$, $\mathbf{A} = \begin{bmatrix} 0 & -1 \\ 0 & 0 \end{bmatrix}$, which is nilpotent, so $e^{\mathbf{A}t} = \begin{bmatrix} 1 & -t \\ 0 & 1 \end{bmatrix}$. An uncorrected bias of $0.01^\circ/\mathrm{s}$ produces an attitude error of $0.1^\circ$ after $10\,\mathrm{s}$ and $36^\circ$ after an hour. The transition matrix tells you that without solving anything.
:::

```python
import numpy as np
from scipy.linalg import expm

A = np.array([[0.0, 1.0], [-2.0, -3.0]])
Phi = expm(0.5 * A)                  # state transition over 0.5 s
print(np.round(Phi, 3))
# [[ 0.845  0.239]
#  [-0.477  0.129]]
print(np.linalg.eigvals(A))          # [-1. -2.] — the poles
```

## Check yourself

::: check
Write $\dddot{y} + 4\ddot{y} + 5\dot{y} + 2y = 3u$ in state-space form with $\mathbf{x} = [y, \dot{y}, \ddot{y}]^T$, and verify that $\det(s\mathbf{I} - \mathbf{A})$ gives back the characteristic polynomial.
:::

::: answer
$\dot{x}_1 = x_2$, $\dot{x}_2 = x_3$, $\dot{x}_3 = -2x_1 - 5x_2 - 4x_3 + 3u$, so
$\mathbf{A} = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ -2 & -5 & -4 \end{bmatrix}$, $\mathbf{B} = [0, 0, 3]^T$, $\mathbf{C} = [1, 0, 0]$, $\mathbf{D} = 0$. Expanding $\det(s\mathbf{I} - \mathbf{A})$ along the first row: $s\bigl(s(s + 4) + 5\bigr) + 1\cdot(0\cdot(s+4) + 2) = s^3 + 4s^2 + 5s + 2$. It factors as $(s + 1)^2(s + 2)$: a repeated pole at $-1$ and a pole at $-2$, all stable.
:::

::: check
What is $e^{\mathbf{A}t}$ for $\mathbf{A} = \begin{bmatrix} -1 & 0 \\ 0 & -4 \end{bmatrix}$, and for $\mathbf{A} = \begin{bmatrix} 0 & 3 \\ -3 & 0 \end{bmatrix}$?
:::

::: answer
A diagonal matrix exponentiates entry by entry on the diagonal: $e^{\mathbf{A}t} = \operatorname{diag}(e^{-t}, e^{-4t})$ — two decoupled first-order lags with time constants $1$ and $0.25\,\mathrm{s}$. The second matrix has eigenvalues $\pm 3j$ ($\sigma = 0$, $\omega_d = 3$) and the complex-pair formula gives $e^{\mathbf{A}t} = \cos 3t\,\mathbf{I} + \tfrac{1}{3}\sin 3t\,\mathbf{A} = \begin{bmatrix} \cos 3t & \sin 3t \\ -\sin 3t & \cos 3t \end{bmatrix}$, a rotation through angle $3t$.
:::

::: check
Explain why the eigenvalues of $e^{\mathbf{A}\Delta t}$ are $e^{\lambda_i\Delta t}$, and what this says about the discrete-time stability of $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$.
:::

::: answer
If $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ then $\mathbf{A}^k\mathbf{v} = \lambda^k\mathbf{v}$, so the series gives $e^{\mathbf{A}\Delta t}\mathbf{v} = \sum_k(\lambda\Delta t)^k/k!\;\mathbf{v} = e^{\lambda\Delta t}\mathbf{v}$. Iterating the discrete map $k$ times multiplies the mode by $(e^{\lambda\Delta t})^k = e^{\lambda k\Delta t}$, which decays exactly when $\operatorname{Re}\lambda < 0$. Equivalently, a continuous pole in the left half plane maps to a discrete eigenvalue inside the unit circle, $|e^{\lambda\Delta t}| = e^{\operatorname{Re}\lambda\,\Delta t} < 1$. The exact discretisation preserves stability for any $\Delta t$; approximate ones, such as $\boldsymbol{\Phi} \approx \mathbf{I} + \mathbf{A}\Delta t$, do not.
:::

::: check
For the satellite-with-lag model in this lesson, what would the state and $\mathbf{A}$ matrix be if the wheel torque responded instantly ($\tau \to 0$)? Check that the eigenvalues agree with lesson 2.
:::

::: answer
With no lag, $T = T_c$ at every instant and the torque is no longer a state: $\mathbf{x} = [\theta, \dot{\theta}]^T$ with $\ddot{\theta} = -(K_p/I)\theta - (K_d/I)\dot{\theta}$, so $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -0.4 & -0.8 \end{bmatrix}$. Then $\det(s\mathbf{I} - \mathbf{A}) = s^2 + 0.8s + 0.4$, whose roots $-0.4 \pm 0.490j$ are exactly lesson 2's. The third-order model's complex pair, $-0.406 \pm 0.502j$, sits within 3% of these; the lag has cost almost nothing because its pole at $-19.2$ is thirty times faster than the loop.
:::

::: check
Starting from $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t - \tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau$, derive the step response of $\dot{y} = -y/\tau_a + u/\tau_a$ for a unit step from rest and confirm it matches lesson 1.
:::

::: answer
Here everything is scalar: $A = -1/\tau_a$, $B = 1/\tau_a$, $x(0) = 0$, $u = 1$. The zero-state term is $\int_0^t e^{-(t - \tau)/\tau_a}\,\frac{1}{\tau_a}\,d\tau$. Substituting $\eta = t - \tau$, it becomes $\frac{1}{\tau_a}\int_0^t e^{-\eta/\tau_a}\,d\eta = 1 - e^{-t/\tau_a}$, the first-order step response of lesson 1. The integrand $e^{-(t - \tau)/\tau_a}/\tau_a$ is the contribution at time $t$ of the input applied at time $\tau$, weighted by how much of it the lag has forgotten in the interval $t - \tau$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ | LTI state-space form; $\mathbf{A}$ is $n \times n$, $\mathbf{B}$ is $n \times m$, $\mathbf{C}$ is $p \times n$, $\mathbf{D}$ is $p \times m$ |
| $\mathbf{x} = [y, \dot{y}, \ldots, y^{(n-1)}]^T$ | Companion-form state; ones on the superdiagonal, $[-a_0, \ldots, -a_{n-1}]$ in the last row, input in the last row |
| $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & -2\zeta\omega_n \end{bmatrix}$, $\mathbf{B} = [0, \omega_n^2]^T$ | Canonical second-order system in state space |
| $\det(s\mathbf{I} - \mathbf{A}) = 0$ | Eigenvalues of $\mathbf{A}$ are the poles; each gives a mode $\mathbf{v}e^{\lambda t}$ |
| $e^{\mathbf{A}t} = \sum_k\mathbf{A}^kt^k/k!$ | Matrix exponential, the state transition matrix $\boldsymbol{\Phi}(t)$ |
| $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$ | Free response, all cases at once |
| $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$ | Diagonalisable case |
| $e^{\mathbf{A}t} = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix}$ | Double integrator (nilpotent $\mathbf{A}$) |
| $e^{\mathbf{A}t} = e^{-\sigma t}\bigl(\cos\omega_dt\,\mathbf{I} + \tfrac{\sin\omega_dt}{\omega_d}(\mathbf{A} + \sigma\mathbf{I})\bigr)$ | $2 \times 2$ with poles $-\sigma \pm j\omega_d$ |
| $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^te^{\mathbf{A}(t-\tau)}\mathbf{B}\mathbf{u}(\tau)\,d\tau$ | Zero-input plus zero-state response |
| $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$, $\boldsymbol{\Gamma} = \int_0^{\Delta t}e^{\mathbf{A}\eta}d\eta\,\mathbf{B}$ | Exact discretisation for a piecewise-constant input |

The next lesson returns to the scalar second-order equation and asks what a persistent input does to it — a step, a ramp, and above all a sinusoid — and finds that a lightly damped system can amplify a small input at the right frequency by a factor of a hundred.
