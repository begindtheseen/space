---
id: l01-lti-models
title: Describing a system to MATLAB with tf, zpk, ss and frd
minutes: 22
covers:
  - tf, zpk, ss, frd; series, parallel, feedback, connect, sumblk
---

Think about a shower with an old-fashioned hot tap. You turn the tap, and nothing happens for a moment. Then the water warms up, slowly at first, then faster, and it settles at a new temperature. If you turn the tap twice as far, the temperature change is about twice as big. If you turn it the same way tomorrow, it behaves the same way tomorrow. The shower has a personality: how fast it reacts, how far it goes, whether it overshoots and scalds you.

Control engineers spend their days writing down personalities like that. A spacecraft that turns when a [[reaction wheel|reaction-wheel]] pushes it, a rocket nozzle that swings when its actuator is told to move, an antenna that points when its motor gets a voltage — each one takes an input and produces an output, with its own delays and wobbles. To design a controller in MATLAB, you first have to describe the system to MATLAB as an object it can multiply, connect and analyze.

This lesson is about that description. You will meet the **Control System Toolbox** — the MathWorks add-on for building and analyzing control systems — and its four ways to write a model: `tf`, `zpk`, `ss` and `frd`. Then you will join models together with `series`, `parallel`, `feedback`, and the most general tool, `connect` with `sumblk`. In core MATLAB you learned that everything is a matrix. Here, a whole dynamic system becomes one variable.

## What kind of system these tools describe

All four model types describe an **LTI system** — a system that is **linear** (double the input, double the output; add two inputs, add their outputs) and **time-invariant** (the same input today or tomorrow gives the same output). The shower is close to LTI for small turns of the tap. A rocket is not LTI over a whole flight, because its mass and air speed change, but around one moment of flight it behaves very nearly like one. That is why GNC teams build many small LTI models along a trajectory, a story that comes back in the gain-scheduling lesson.

Real LTI systems are described by **differential equations**: rules that say how fast things change. For a spacecraft turning in space, Newton's law for rotation says

$$
J\,\ddot{\theta} = \tau
$$

Read $\ddot{\theta}$ as "theta double dot": the angular acceleration, the rate of change of the rate of change of the angle $\theta$. Here $J$ is the **moment of inertia** (how hard the spacecraft is to spin, in $\mathrm{kg\,m^2}$) and $\tau$ (read "tau") is the torque from the reaction wheels, in $\mathrm{N\,m}$.

## Transfer functions and the letter s

The toolbox replaces "rate of change" with a letter. Wherever a derivative appears, write $s$ times the thing. One dot becomes one $s$; two dots become $s^2$. This trick comes from the **[[Laplace transform|laplace-s]]**, and you do not need its full theory to use it. For the spacecraft:

$$
J s^2\,\Theta(s) = T(s)
\quad\Longrightarrow\quad
\frac{\Theta(s)}{T(s)} = \frac{1}{J s^2}
$$

The capital letters are the transformed signals. The ratio "output over input" is the **transfer function**: a fraction in $s$ that holds the system's whole personality. Read $\frac{1}{Js^2}$ aloud as "one over J s squared".

In MATLAB, `tf` builds a transfer function from two row vectors: the coefficients of the top polynomial (the **numerator**) and of the bottom one (the **denominator**), highest power of $s$ first, exactly as `polyval` and `roots` expect.

```matlab
J = 10;                  % kg m^2, a small satellite
P = tf(1, [J 0 0])       % 1 / (10 s^2 + 0 s + 0)
```

MATLAB prints the fraction with a line of dashes. Octave's control package shows the same fraction but labels it differently, so you will see both layouts in this module.

A second way reads more like the math. Make `s` itself a transfer function, then write ordinary algebra with it:

```matlab
s = tf('s');             % the "rate of change" operator as an object
G = 4/(s^2 + 2*s + 4)
% MATLAB prints:
%          4
%   -------------
%   s^2 + 2 s + 4
%
%   Continuous-time transfer function.
```

Both styles give the same object. The `s = tf('s')` style is easier to read when the model is built from pieces.

::: warning Missing zeros in the coefficient vector
`tf(1, [10 0 0])` is $\frac{1}{10 s^2}$. Drop a zero and write `tf(1, [10 0])`, and you get $\frac{1}{10 s}$ — a different system, with no error message. Count the entries: a polynomial of degree $n$ needs $n+1$ coefficients, including the zeros.
:::

## Poles, zeros and zpk

A transfer function is a fraction, and fractions have two kinds of special values of $s$:

- a **zero** is a value of $s$ that makes the numerator zero;
- a **pole** is a value of $s$ that makes the denominator zero.

The poles set the system's natural motions: how fast it settles, whether it wobbles, whether it runs away. The zeros shape how strongly each motion shows up at the output. Lesson 3 is all about them. For now, you need only know they exist, because the second model type is built from them.

`zpk` stands for **zero-pole-gain**. You give it a list of zeros, a list of poles and a gain $k$, and it builds

$$
H(s) = k\,\frac{(s - z_1)(s - z_2)\cdots}{(s - p_1)(s - p_2)\cdots}
$$

```matlab
H = zpk(-1, [-2 -5], 3)
% MATLAB prints (factored form):
%     3 (s+1)
%   -----------
%   (s+2) (s+5)
```

That is a zero at $s = -1$, poles at $s = -2$ and $s = -5$, and a gain of 3. Multiply it out and it is $\frac{3s + 3}{s^2 + 7s + 10}$. MATLAB keeps it in factored form, which is easier to read. Octave's control package stores `zpk` models as ordinary polynomials and prints `3 s + 3` over `s^2 + 7 s + 10`; the model is the same.

You can turn any model into any other form: `tf(H)`, `zpk(G)`, `ss(G)`. The conversions are exact, apart from tiny rounding.

::: warning A pole at s = -2 is written -2, not 2
In `zpk`, you pass the pole itself, the root of the denominator. The factor $(s+2)$ has its pole at $s = -2$. Passing `2` makes a factor $(s-2)$, which is an unstable system that runs away. It is the single most common `zpk` slip.
:::

## State space: the inside view

A transfer function only says how the output answers the input. It is a view from the outside. A **state-space model** also keeps track of what is going on inside.

The **[[state|state-word]]** of a system is the short list of numbers that, together with future inputs, fixes everything it will do next. For the spacecraft, the state is the angle $\theta$ and the turn rate $\omega = \dot\theta$ (read "omega"). Knowing both now, and the torque from now on, you know the whole future.

A state-space model writes the physics as four matrices:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad
\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}
$$

Here $\mathbf{x}$ is the state vector, $\mathbf{u}$ the input, $\mathbf{y}$ the output. $\mathbf{A}$ says how the state moves on its own, $\mathbf{B}$ how the input pushes it, $\mathbf{C}$ what the sensors see, and $\mathbf{D}$ any direct shortcut from input to output (usually zero).

::: example The satellite as a state-space model
Take $J = 10\,\mathrm{kg\,m^2}$, state $\mathbf{x} = [\theta;\ \omega]$, input $u = \tau$, output $y = \theta$ (a star tracker measures the angle).

**Step 1: write each state's rate.** The angle changes at the turn rate: $\dot\theta = \omega$. The turn rate changes at torque over inertia: $\dot\omega = \tau / J = 0.1\,\tau$.

**Step 2: read off the matrices.** Row 1 of $\dot{\mathbf{x}}$ uses $0\cdot\theta + 1\cdot\omega$ and no input. Row 2 uses no state and $0.1$ times the input. The sensor sees $1\cdot\theta + 0\cdot\omega$.

```matlab
J = 10;
A = [0 1; 0 0];
B = [0; 1/J];
C = [1 0];
D = 0;
P = ss(A, B, C, D);
tf(P)
% ans =
%   0.1
%   ---
%   s^2
```

**Step 3: compare with the transfer function.** `tf(P)` gives $\frac{0.1}{s^2}$, the same as $\frac{1}{10 s^2}$ from earlier. Two descriptions, one satellite.

**Sanity check.** A steady torque of $0.2\,\mathrm{N\,m}$ gives an angular acceleration of $0.2/10 = 0.02\,\mathrm{rad/s^2}$. After $10\,\mathrm{s}$ the angle is $\tfrac12 \times 0.02 \times 10^2 = 1\,\mathrm{rad}$, about $57^\circ$. A gentle push for ten seconds turns a small satellite most of the way to a right angle, which is the right size for a wheel-driven slew.
:::

Going the other way, `ss(G)` turns a transfer function into matrices. There are infinitely many state-space models with the same transfer function, because you can pick the states in different ways. MATLAB and Octave pick different ones, so do not be surprised when `ss(G)` gives different `A` matrices on the two. Both are right.

So why keep two forms? Because the transfer function [[hides things|hidden-mode]] the state-space model keeps.

::: example A cancellation the transfer function hides
Put $G_1 = \frac{s-1}{s+2}$ first and $G_2 = \frac{1}{s-1}$ after it. The second one has a pole at $s = +1$, on the positive side, so on its own it runs away.

```matlab
s = tf('s');
G1 = (s - 1)/(s + 2);
G2 = 1/(s - 1);
Gs = G1*G2               % (s - 1) / (s^2 + s - 2)
minreal(Gs)              % 1 / (s + 2)   <- looks perfectly calm
pole(ss(G2)*ss(G1))      % G1 then G2 in state space: both poles kept
% ans =
%    1
%   -2
```

**Step 1.** The product has numerator $s - 1$ and denominator $(s+2)(s-1) = s^2 + s - 2$.

**Step 2.** `minreal` ("minimal realization") cancels the common factor $(s-1)$ and leaves $\frac{1}{s+2}$. From the outside, input to output, this is exactly right.

**Step 3.** The state-space series still has a pole at $+1$. That mode is inside the hardware. The input can no longer excite it, but any small disturbance or starting offset will, and it grows like $e^{t}$ — nearly triple every second.

**Sanity check.** Cancelling $(s-1)$ is algebra on paper; it cannot remove a real, unstable part from a real machine. The state-space answer is the one that matches the hardware.
:::

::: key
State space is mandatory for MIMO systems, internal state constraints, observers and LQR/LQG design, and anything where you need controllability or observability. Transfer functions are convenient for SISO loop shaping and hide internal modes, including unstable cancellations.
:::

A few words in that key block are new. **SISO** means single-input, single-output; **[[MIMO|mimo]]** means multiple-input, multiple-output. An **observer** estimates states you cannot measure, and **LQR/LQG** are design methods that need the state explicitly; lesson 6 builds all three. **Controllability** and **observability** ask whether every internal mode can be pushed by the inputs and seen by the outputs. The hidden unstable mode above failed exactly that test: after the cancellation, the input could not push it.

## Measured models: frd

Sometimes nobody has the equations. What you have is a test: shake the hardware at a list of frequencies and record how big the output is and how late it arrives. That list of complex numbers, one per frequency, is a **frequency response**. `frd` (frequency response data) stores it as a model:

```matlab
w    = [0.1 1 10];                % rad/s, test frequencies
resp = [0.9901-0.0990i, 0.5-0.5i, 0.0099-0.0990i];
Pf   = frd(resp, w);              % a model made only of measurements
```

An `frd` model has no poles or zeros, because it is only numbers at chosen frequencies. You can still put it in series with a controller and read margins from it, which is lesson 4's subject. Those three numbers are what $\frac{1}{s+1}$ gives at those frequencies, and `frd(tf(1,[1 1]), w)` would build the same object from a model. Real ones come from [[vibration tests|frd-shaker]] on the actual vehicle.

## Joining models: series, parallel, feedback

Once blocks are objects, joining them is arithmetic.

- **Series** (one after another): the first block's output feeds the second. The transfer functions multiply. `series(P, Q)` is the same as `Q*P`.
- **Parallel** (side by side, outputs added): they add. `parallel(P, Q)` is `P + Q`.

With $P = \frac{1}{s+1}$ and $Q = \frac{2}{s+3}$, series gives $\frac{2}{s^2 + 4s + 3}$ and parallel gives $\frac{3s + 5}{s^2 + 4s + 3}$. Check the parallel one by hand: over the common denominator $(s+1)(s+3)$, the top is $1\cdot(s+3) + 2\cdot(s+1) = 3s + 5$.

The third join is the one control is named after. In a **[[feedback loop|loop-picture]]** a sensor measures the output, the controller compares it with the command, and the difference — the **error** — drives the plant. The **[[plant|plant-word]]** is the thing being controlled. If the forward path is $G$ and the sensor path is $H$, the **closed-loop** transfer function from command to output is

$$
T = \frac{G}{1 + G H}
$$

`feedback(G, H)` computes it. With one argument less, `feedback(G, 1)` assumes a perfect sensor, $H = 1$. The minus sign at the comparison is the default; `feedback(G, H, +1)` gives positive feedback, which is almost never what you want.

::: note Why the closed loop is G over 1 + GH
Call the command $R$, the output $Y$ and the error $E$. The sensor reports $HY$, so the error is $E = R - HY$. The forward path makes $Y = GE$. Put the first into the second: $Y = G(R - HY) = GR - GHY$. Move the $Y$ terms to one side: $Y + GHY = GR$, so $Y(1 + GH) = GR$. Divide: $\frac{Y}{R} = \frac{G}{1 + GH}$.
:::

::: example Pointing an antenna with a proportional controller
An antenna mount with a motor and some friction behaves like $G(s) = \frac{1}{s(s+2)}$ from motor command to pointing angle. A **proportional controller** multiplies the error by a gain $K = 4$. The sensor is perfect.

```matlab
s = tf('s');
G = 1/(s*(s + 2));
T = feedback(4*G, 1)
% T =
%          4
%   -------------
%   s^2 + 2 s + 4
dcgain(T)
% ans = 1
```

**Step 1: forward path.** $KG = \frac{4}{s^2 + 2s}$.

**Step 2: one plus the loop.** $1 + KG = \frac{s^2 + 2s}{s^2 + 2s} + \frac{4}{s^2 + 2s} = \frac{s^2 + 2s + 4}{s^2 + 2s}$.

**Step 3: divide.** The $s^2 + 2s$ bottoms cancel, leaving $T = \frac{4}{s^2 + 2s + 4}$.

**Sanity check.** `dcgain` is the value at $s = 0$, which means "after everything has stopped changing". Here it is $\frac{4}{4} = 1$: the antenna ends up exactly where it was told to point. That is what an integrator in the plant (the $s$ on its own in the bottom of $G$) buys you.
:::

You will meet this $T$ again: lesson 2 draws its step response, and lesson 3 finds its poles.

::: warning Series order for many inputs and outputs
For single-input, single-output blocks, `P*Q` and `Q*P` are the same. For MIMO blocks they are matrix products, and the order matters. `series(P, Q)` means "P first, then Q", which is `Q*P`, with the later block on the left, like matrix products acting on a column vector.
:::

## Building by name: connect and sumblk

For a loop with many blocks, nested `feedback` calls get hard to read. The general tool is `connect`. You give each block's inputs and outputs names, describe every summing junction with `sumblk`, and tell `connect` which named signals are the outside inputs and outputs. It wires everything up by matching names.

```matlab
G = tf(1, [1 2 0]);  G.InputName = 'u';  G.OutputName = 'y';
K = tf(4);           K.InputName = 'e';  K.OutputName = 'u';
S = sumblk('e = r - y');           % the comparison at the loop's start
T = connect(G, K, S, 'r', 'y');    % inputs 'r', outputs 'y'
tf(T)
%          4
%   -------------
%   s^2 + 2 s + 4
```

The string `'e = r - y'` reads like the equation it stands for: the error is the command minus the measurement. `connect` returns a state-space model, so `tf(T)` shows the fraction. It matches `feedback` exactly, as it should.

On a real vehicle this is how a flight-control team assembles a pitch loop from a dozen pieces — sensor, filters, controller, actuator, rigid body, bending modes — each built and checked on its own, with names that match the signal list in the design document. When a name is misspelled, `connect` warns that a signal is not connected, which is a far better failure than a silently wrong model.

## Check yourself

::: check
Write the MATLAB line that builds $\frac{5s + 2}{s^3 + 4s}$ with `tf`, and say how many zeros and poles it has.
:::

::: answer
`tf([5 2], [1 0 4 0])`. The denominator $s^3 + 0s^2 + 4s + 0$ needs four coefficients, including the two zeros. The numerator is degree 1, so there is one zero, at $s = -2/5 = -0.4$. The denominator is degree 3, so there are three poles: $s = 0$ and $s = \pm 2j$ (from $s^2 + 4 = 0$).
:::

::: check
A colleague builds `zpk([], [3 1], 6)` for a plant whose denominator is $(s+3)(s+1)$. What went wrong, and what is the fix?
:::

::: answer
`zpk` wants the poles themselves, the values of $s$ that zero the denominator. $(s+3)(s+1)$ is zero at $s = -3$ and $s = -1$. The colleague typed $3$ and $1$, which builds $\frac{6}{(s-3)(s-1)}$, an unstable plant. The fix is `zpk([], [-3 -1], 6)`.
:::

::: check
Find the closed-loop transfer function of `feedback(G, H)` with $G = \frac{10}{s+1}$ and $H = \frac{1}{0.1s + 1}$ (a sensor with a small lag). Leave it as one fraction.
:::

::: answer
$GH = \frac{10}{(s+1)(0.1s+1)}$. Then $T = \frac{G}{1+GH}$. Multiply top and bottom by $(s+1)(0.1s+1)$: the top becomes $10(0.1s+1) = s + 10$ and the bottom becomes $(s+1)(0.1s+1) + 10 = 0.1s^2 + 1.1s + 11$. So $T = \frac{s + 10}{0.1s^2 + 1.1s + 11}$. The sensor's pole shows up as a zero of the closed loop, a nice detail to spot.
:::

::: check
Give two reasons from the key block why a GNC team designing an LQR controller for a spacecraft with three reaction wheels would use `ss` rather than `tf`.
:::

::: answer
First, the system is MIMO: three wheel torques in, three attitude angles (or more) out. Second, LQR design works directly on the state, so it needs $\mathbf{A}$ and $\mathbf{B}$. A third good answer: a transfer function can hide internal modes, including unstable cancellations, while the state-space model keeps them so you can check controllability and observability.
:::

::: check
Using `sumblk` and `connect`, what line would describe a loop where the error is the command `r` minus the sum of a gyro signal `yg` and a filtered accelerometer signal `ya`?
:::

::: answer
`S = sumblk('e = r - yg - ya');`. The string lists each signal with its sign, so `connect` can match `e`, `r`, `yg` and `ya` to the blocks whose `InputName` and `OutputName` use those names.
:::

## Summary

| Idea | Meaning | MATLAB |
|---|---|---|
| LTI system | linear and time-invariant | what every model here describes |
| $s$ | "rate of change": one dot becomes one $s$ | `s = tf('s')` |
| Transfer function | output over input, a fraction in $s$ | `tf(num, den)` |
| Zeros, poles | roots of numerator, denominator | `zpk(z, p, k)` |
| State space | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ | `ss(A, B, C, D)` |
| Measured model | response numbers at chosen frequencies | `frd(resp, w)` |
| Series, parallel | multiply, add | `series(P,Q)` is `Q*P`; `parallel(P,Q)` is `P+Q` |
| Closed loop | $T = \frac{G}{1 + GH}$ | `feedback(G, H)` |
| Named wiring | summing junctions and signal names | `sumblk('e = r - y')`, `connect(...)` |
| Hidden modes | tf can cancel an unstable pole | keep `ss` when internals matter |

Next, lesson 2 feeds these models test signals — a step, a kick, a ramp, an offset — with `step`, `impulse`, `lsim` and `initial`, and turns the antenna loop's response into requirement numbers with `stepinfo`.

::: context reaction-wheel Turning without thrusters
A reaction wheel is a heavy flywheel inside a spacecraft, driven by an electric motor. When the motor speeds the wheel up one way, the spacecraft turns the other way, because the total spin (angular momentum) of wheel plus spacecraft must stay the same. That lets a satellite point its camera or antenna precisely using only electricity, with no propellant. The motor torque is the input $\tau$ in this lesson's satellite model. Most satellites carry three or four wheels, one per axis plus a spare.
:::

::: context laplace-s Where the letter s comes from
The French mathematician Pierre-Simon Laplace gave his name to a transform that turns a signal of time, $f(t)$, into a function of a new variable $s$. Its most useful property is that taking a derivative in time becomes multiplying by $s$ (when the signal starts from rest). So a differential equation turns into ordinary algebra with polynomials. Engineers divide, multiply and factor those polynomials, then translate back. You will not compute a Laplace transform by hand in this module: MATLAB does the algebra, and you read the results.
:::

::: context state-word A save file for a system
Think of a video game's save file. It does not store everything that happened; it stores only enough — position, health, inventory — to carry on exactly where you left off. A system's state is the same idea. For a rigid spacecraft turning about one axis, two numbers are enough: the angle and the turn rate. A full 3D attitude needs more: an attitude (often a quaternion, four numbers) and three body rates. For a model with nothing cancelled or hidden, the number of states equals the number of poles, which is why a second-order plant like $\frac{1}{Js^2}$ has two.
:::

::: context hidden-mode A pole hiding behind a zero
On a map of the complex plane, poles are drawn as crosses and zeros as circles. Here the zero of $G_1$ sits exactly on top of the unstable pole of $G_2$ at $s = +1$. On paper they cancel and only the pole at $-2$ seems to remain. In the hardware, the mode at $+1$ is still there; only its link to the input has been cut. Real parameters never match exactly, either, so the "cancellation" would be slightly off and the runaway mode would leak into the output.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="220" y1="15" x2="220" y2="140" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="330" y="92" font-size="11" fill="#6c7a93">real</text>
  <text x="226" y="24" font-size="11" fill="#6c7a93">imaginary</text>
  <rect x="220" y="15" width="120" height="125" fill="#f2b880" opacity="0.25"/>
  <text x="250" y="130" font-size="11" fill="#b4232c">unstable side</text>
  <line x1="92" y1="67" x2="108" y2="83" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="92" y1="83" x2="108" y2="67" stroke="#1d6fd1" stroke-width="3"/>
  <text x="100" y="105" font-size="12" fill="#1f2a44" text-anchor="middle">-2</text>
  <circle cx="280" cy="75" r="11" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="272" y1="67" x2="288" y2="83" stroke="#b4232c" stroke-width="3"/>
  <line x1="272" y1="83" x2="288" y2="67" stroke="#b4232c" stroke-width="3"/>
  <text x="280" y="105" font-size="12" fill="#1f2a44" text-anchor="middle">+1</text>
  <text x="280" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">pole under a zero</text>
</svg>
```
:::

::: context mimo Many inputs, many outputs
A launch vehicle steers with several engine gimbals or fins at once, and measures pitch, yaw and roll angles and rates. Each input moves several outputs: gimbaling one engine to pitch the vehicle also nudges yaw and roll a little if the vehicle is not perfectly symmetric. A MIMO model keeps all those cross-couplings in one set of matrices. Transfer functions can describe MIMO systems too, as a matrix of fractions, but the bookkeeping grows fast and the internal modes can be hard to see, which is why state space is the working form.
:::

::: context frd-shaker Shaking the real hardware
Before a new rocket or spacecraft flies, engineers bolt it to a test fixture and shake it with electrodynamic shakers, sweeping through frequencies, while accelerometers record how it answers. This is part of modal survey or ground vibration testing. The measured response, one complex number per frequency for each sensor and shaker pair, is exactly the kind of data `frd` holds. Control engineers then compare the measured bending frequencies with their models and adjust the flight filters if the real structure differs.
:::

::: context loop-picture The loop in one picture
The command enters on the left. A circle marks the summing junction: plus for the command, minus for the measurement. Their difference, the error, drives the controller and plant. The output goes out on the right and also back through the sensor. `feedback(G, H)` turns this whole picture into one fraction; `sumblk('e = r - y')` is the circle written in words.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <line x1="10" y1="50" x2="62" y2="50" stroke="#1f2a44" stroke-width="2" marker-end="url(#ah)"/>
  <text x="14" y="42" font-size="12" fill="#1f2a44">r</text>
  <circle cx="75" cy="50" r="13" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="56" y="40" font-size="12" fill="#1f2a44">+</text>
  <text x="80" y="76" font-size="13" fill="#b4232c">&#8722;</text>
  <line x1="88" y1="50" x2="138" y2="50" stroke="#1f2a44" stroke-width="2" marker-end="url(#ah)"/>
  <text x="106" y="42" font-size="12" fill="#1f2a44">e</text>
  <rect x="140" y="30" width="80" height="40" rx="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="55" font-size="13" fill="#1f2a44" text-anchor="middle">G</text>
  <line x1="220" y1="50" x2="345" y2="50" stroke="#1f2a44" stroke-width="2" marker-end="url(#ah)"/>
  <text x="330" y="42" font-size="12" fill="#1f2a44">y</text>
  <line x1="290" y1="50" x2="290" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="290" y1="120" x2="222" y2="120" stroke="#1f2a44" stroke-width="2" marker-end="url(#ah)"/>
  <rect x="140" y="100" width="80" height="40" rx="5" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
  <text x="180" y="125" font-size="13" fill="#1f2a44" text-anchor="middle">H (sensor)</text>
  <line x1="140" y1="120" x2="75" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="75" y1="120" x2="75" y2="65" stroke="#1f2a44" stroke-width="2" marker-end="url(#ah)"/>
</svg>
```
:::

::: context plant-word Why "plant"
The word comes from industrial process control in the early twentieth century, when the thing being controlled really was a plant: a chemical works, a boiler, a power station. The name stuck. Today a "plant model" can be a spacecraft, a rocket's pitch dynamics or a single valve. On a GNC team, "the plant" means everything the controller acts on — actuators, vehicle and often the sensors — as opposed to the controller and filters that the team designs.
:::
