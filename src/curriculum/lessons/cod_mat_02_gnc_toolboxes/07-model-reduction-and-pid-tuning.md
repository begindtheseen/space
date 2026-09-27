---
id: l07-model-reduction-and-pid-tuning
title: Shrinking models and tuning PID controllers
minutes: 23
covers:
  - minreal, balred, modred for model reduction
  - Control System Designer and PID Tuner; pidtune
---

Think about a map of your town. A map with every tree, mailbox and crack in the sidewalk would be perfectly accurate and completely useless for finding the grocery store. The useful map keeps the streets and drops the rest. Deciding what to drop is a skill: drop a street and you get lost; keep the mailboxes and you cannot read the map.

Control engineers face the same choice with models. A launch vehicle's pitch model can easily reach thirty or forty states: the rigid body, a handful of **[[bending modes|bending-modes]]** of the long thin structure, the actuator that swings the engine nozzle, the gyro and its filter, fuel sloshing in the tanks. The LQG controller of lesson 06 carries a full copy of the plant model inside its Kalman filter, so a big plant model hands you a big controller too. Big models are slow to simulate thousands of times, hard to reason about, and costly to run on a flight computer. **Model reduction** means replacing a big model by a smaller one that behaves almost the same way where it matters.

This lesson has two halves. First, three Control System Toolbox commands that shrink models: `minreal`, `balred` and `modred`. Second, the tools that pick controller gains for you: the function `pidtune`, the **PID Tuner** app and the **Control System Designer** app. The two halves meet in practice: you tune a simple controller on a reduced model, then check it on the full one.

## Removing what cancels: minreal

Start with the easiest kind of fat to trim. Sometimes a model contains a piece that does nothing at all from input to output. In a transfer function this shows up as the same factor on the top and the bottom, like $\frac{s+3}{s+3}$. A pole and a zero sit on the same spot and cancel. This is a **pole-zero cancellation**.

It happens all the time when you connect blocks. Suppose you design a controller with a zero at $s = -3$ on purpose, to cancel a slow plant pole at $s = -3$:

```matlab
s = tf('s');
C = (s + 3)/s;                 % PI-style controller, zero at -3
P = 5/((s + 3)*(s + 10));      % plant with poles at -3 and -10
L = C*P
%   L =
%          5 s + 15
%     -------------------
%     s^3 + 13 s^2 + 30 s
Lm = minreal(L)
%   Lm =
%          5
%     ----------
%     s^2 + 10 s
```

MATLAB multiplied the polynomials and did not notice the shared factor. You can see it by hand: $5s + 15 = 5(s+3)$ and $s^3 + 13s^2 + 30s = s(s+3)(s+10)$. The command `minreal` (read it "min real", short for **minimal realization**, the smallest model with the same input-output behavior) finds pole-zero pairs that match within a tolerance and removes them. For a state-space model it removes the states that the input cannot move or the output cannot see, and prints how many it removed. An optional second input sets the tolerance: `minreal(sys, tol)`.

::: key
`minreal(sys)` removes pole-zero pairs that cancel and states that are uncontrollable or unobservable. The input-output behavior does not change; only the bookkeeping shrinks. `minreal(sys, tol)` sets how close a pole and zero must be to count as cancelling.
:::

::: warning Never let minreal hide an unstable pole
If the plant has an unstable pole at $s = +1$ and your controller has a zero at $s = +1$, `minreal` will cancel them and the loop transfer function will look perfectly stable. The real vehicle still has that unstable motion inside it. The controller cannot see it, so it cannot fix it, and the smallest disturbance sets it growing. Before trusting a cancellation, run `pole` on the plant and on the controller separately. Lesson 06's `ctrb` and `obsv` catch the same trap in state-space form.
:::

## Ranking states: Hankel singular values and balred

`minreal` removes only states that contribute exactly nothing. Most states contribute *something*. The question becomes: which states contribute the least?

Here is the everyday picture. A state matters for input-output behavior only if two things are true. The input must be able to push it (it is easy to **excite**), and the output must be able to feel it (it is easy to **see**). A state that is hard to push and hard to see is like a backroom in a store that no customer enters and no window shows. You can close it and nobody notices.

The **[[Hankel singular values|hsv-meaning]]** put a number on this, one number per state, after a change of coordinates called **balancing** that makes "easy to push" and "easy to see" line up state by state. They are always listed largest first and written $\sigma_1 \ge \sigma_2 \ge \dots$ (read "sigma one, sigma two"). A big value means an important state. A tiny one means a state you can drop. The command `hsvd(sys)` returns them (with no output argument it draws them as a bar chart).

Then `balred(sys, r)` (read "bal red", for **balanced reduction**) keeps the $r$ most important states and removes the rest. There is a useful guarantee behind it. The worst-case error of the reduced model, over all frequencies, is at most twice the sum of the values you threw away:

$$
\text{worst error} \le 2\,(\sigma_{r+1} + \sigma_{r+2} + \dots + \sigma_n)
$$

So you can read the right order straight off the list: look for a big drop.

::: example Shrinking a four-state pitch model
A simple pitch channel has three parts in a row: a slow vehicle response $\frac{1}{s+1}$, an actuator $\frac{30}{s+30}$ (a pole at $-30$, so its **[[time constant|time-constant]]** is $1/30\,\mathrm{s}$), and a gyro filter $\frac{2500}{s^2 + 70s + 2500}$ (a pair of poles at $\omega_n = 50\,\mathrm{rad/s}$). That is four states. Each part has a gain of $1$ at zero frequency, so the whole model does too.

```matlab
s = tf('s');
G = 1/(s+1) * 30/(s+30) * 2500/(s^2 + 70*s + 2500);
hsv = hsvd(G)
%   hsv =
%       0.5275
%       0.0308
%       0.0037
%       0.0005
```

**Read the list.** The first value is about 17 times the second ($0.5275 / 0.0308 \approx 17.1$). After that the values keep falling, by roughly a factor of eight each time. One state carries almost all the input-output behavior.

**Predict the error.** Keeping one state throws away $0.0308 + 0.0037 + 0.0005 = 0.0350$, so the worst error is at most $2 \times 0.0350 = 0.0700$. Keeping two states throws away $0.0037 + 0.0005 = 0.0042$, a bound of $0.0084$.

**Reduce and compare.**

```matlab
G1 = balred(G, 1);
G2 = balred(G, 2);
step(G, G1, G2)
```

Computed step responses show a largest gap of about $0.055$ for the one-state model and about $0.0065$ for the two-state model. Both sit under their bounds ($0.070$ and $0.0084$), as they must. The one-state model has a single pole at about $-0.99$, very close to the slow pole at $-1$ that everyone expected to dominate. The two-state model has poles near $-1.0$ and $-27$: it kept the slow pole and blended the actuator and filter into one fast pole.

**Sanity check.** A step into the full model settles at $1$. So do both reduced models, because of the option explained next.
:::

`balred` has two ways of throwing states away, set with `balredOptions('StateElimination', ...)`. The default, `'MatchDC'`, lets the dropped states settle instantly to where they would end up, so the **[[DC gain|dc-gain]]** (the steady output for a steady input) is preserved exactly. The other, `'Truncate'`, deletes the dropped states outright. Truncation matches high frequencies better but gets the steady value slightly wrong. For the model above, one-state truncation settles at about $1.055$ instead of $1$, an error of five and a half percent in the steady answer.

::: note Why MatchDC produces a D term
With `'MatchDC'`, the one-state model of the example comes out as $\frac{-0.0550\,s + 0.9924}{s + 0.9924}$. The top has an $s$ in it, which means an instant **feedthrough**: at the first moment of a step, the output jumps to $-0.055$ before rising. Here is where that comes from. Setting the dropped states' derivatives to zero turns them into algebraic equations. Solve those and substitute back, and part of the input reaches the output with no delay, through the $D$ matrix of $\dot{x} = Ax + Bu$, $y = Cx + Du$. At zero frequency, $s = 0$, the formula gives $\frac{0.9924}{0.9924} = 1$, the exact DC gain. The price is that small wrong-way blip at the start.
:::

Newer MATLAB releases, from R2023b on, also offer `reducespec`, a two-step interface for the same job: you build a reduction specification from the model, then ask it for a model of the order you want. `balred` still works, and it is what most existing team code calls.

## Choosing states yourself: modred

Balancing mixes the original states together, so the states of a balanced model have no physical meaning anymore. Sometimes you want to keep physical meaning. You know exactly which states are fast and uninteresting, such as the actuator's, and you want to remove those and keep the rest as they are. That is `modred` (read "mod red", for **modal reduction** or model reduction).

`modred(sys, elim)` removes the states listed in `elim`, a vector of state indices. Like `balred`, it defaults to `'MatchDC'`, and `modred(sys, elim, 'Truncate')` deletes them instead.

::: example Removing an actuator state by hand and by modred
A vehicle state $x_1$ obeys $\dot{x}_1 = -x_1 + x_2$, where $x_2$ is the actuator position. The actuator obeys $\dot{x}_2 = -30x_2 + 30u$: it follows the command $u$ with a time constant of $1/30\,\mathrm{s}$. The output is $y = x_1$. In matrices:

$$
A = \begin{bmatrix} -1 & 1 \\ 0 & -30 \end{bmatrix},\quad
B = \begin{bmatrix} 0 \\ 30 \end{bmatrix},\quad
C = \begin{bmatrix} 1 & 0 \end{bmatrix}
$$

**MatchDC by hand.** Pretend the actuator is so fast that it is always settled: set $\dot{x}_2 = 0$. Then $0 = -30x_2 + 30u$, so $x_2 = u$. Put that into the first equation: $\dot{x}_1 = -x_1 + u$. The reduced model is $\frac{1}{s+1}$. Its DC gain is $1$, the same as the full model $\frac{30}{(s+1)(s+30)}$ at $s = 0$, which is $\frac{30}{30} = 1$.

**Truncate by hand.** Delete $x_2$ and everything that touches it. What is left is $\dot{x}_1 = -x_1$, with no input at all. The row of $B$ that belonged to $x_1$ is $0$, so the reduced model's gain is zero everywhere. The command signal reached the vehicle only *through* the actuator, and truncation cut that wire.

**In MATLAB.**

```matlab
sys = ss([-1 1; 0 -30], [0; 30], [1 0], 0);
rMatch = modred(sys, 2);               % keeps x1, default 'MatchDC'
rTrunc = modred(sys, 2, 'Truncate');
tf(rMatch)    % 1/(s + 1)
tf(rTrunc)    % 0: the input path is gone
```

**Sanity check.** The fast actuator pole at $-30$ is thirty times faster than the vehicle pole, so the reduced model $\frac{1}{s+1}$ should look almost identical to the full model on a step plot. It does, apart from a tiny delay of about $1/30\,\mathrm{s}$ at the start.
:::

::: warning Truncating a state that sits in the signal path
Truncation is safe only when the states you delete are weakly coupled to the input and output. An actuator or filter state usually sits right in the middle of the path, and deleting it cuts the path. For physical states, use the default `'MatchDC'` unless you have checked that truncation keeps the DC gain.
:::

::: key
`balred(sys, r)` keeps the $r$ states with the largest Hankel singular values (from `hsvd`); the worst error is at most twice the sum of the discarded values. `modred(sys, elim)` removes the states you name, in your original coordinates. Both default to `'MatchDC'`, which keeps the DC gain exact; `'Truncate'` deletes the states outright.
:::

## PID controllers and pidtune

Now the second half. Most loops on a real vehicle are not LQG. They are **PID** controllers, the workhorse of control since a 1922 paper by **[[Nicolas Minorsky|minorsky]]** on steering ships automatically. The name lists three terms, each with an everyday meaning:

- **P, proportional**: push in proportion to the error now. Far off, push hard.
- **I, integral**: push in proportion to the error added up over time. A small error that never goes away slowly builds a big push, so steady errors die out.
- **D, derivative**: push in proportion to how fast the error is changing. It acts like a brake before you overshoot.

In MATLAB's **parallel form**, with $K_p$, $K_i$ and $K_d$ (read "K sub p" and so on) the three gains:

$$
C(s) = K_p + \frac{K_i}{s} + K_d\,s
$$

A pure $K_d\,s$ amplifies high-frequency noise without limit, so real designs add a first-order filter to it, written $\frac{K_d\,s}{T_f\,s + 1}$ with $T_f$ the filter time constant. `pid(Kp, Ki, Kd, Tf)` builds that controller as an object; leave out the last inputs and they are zero. The **standard form** `pidstd(Kp, Ti, Td)` writes the same thing as $K_p\left(1 + \frac{1}{T_i s} + T_d s\right)$, so $K_i = K_p / T_i$ and $K_d = K_p T_d$.

The command `pidtune(G, type)` designs one for you. `type` is a string such as `'P'`, `'PI'`, `'PD'`, `'PID'` or `'PIDF'` (PID with the derivative filter). Out of the box it picks a **[[crossover frequency|crossover]]** from the plant and aims for a phase margin of $60^\circ$, a sturdy balance between speed and robustness. You can take control of both:

```matlab
C = pidtune(G, 'PI', 5);                  % force crossover at 5 rad/s
opts = pidtuneOptions('PhaseMargin', 45); % ask for 45 degrees instead of 60
[C, info] = pidtune(G, 'PID', opts);      % info.Stable, info.CrossoverFrequency, info.PhaseMargin
```

`pidtuneOptions` also takes `'DesignFocus'`, set to `'balanced'` (the default), `'reference-tracking'` or `'disturbance-rejection'`, to lean the design toward following commands or toward fighting disturbances.

::: key
`pidtune(G, 'PI')` or `pidtune(G, 'PID')` returns a `pid` object tuned for a target phase margin of $60^\circ$ at a crossover it chooses; `pidtune(G, type, wc)` fixes the crossover and `pidtuneOptions('PhaseMargin', pm)` changes the target. Always check the result with `margin` and `step` before believing it.
:::

It helps to know what `pidtune` is solving, so its answers never feel like magic. At the crossover $\omega_c$ the loop $L = CG$ must have magnitude $1$ and phase $-180^\circ + \text{PM}$. For a PI controller those are two equations in two unknowns, $K_p$ and $K_i$, and you can solve them yourself.

::: example Tuning a PI loop by hand, then checking it
Plant: $G(s) = \frac{8}{(s+2)(s+8)}$, a rate loop with a DC gain of $\frac{8}{16} = 0.5$. Goal: crossover $\omega_c = 5\,\mathrm{rad/s}$ and phase margin $60^\circ$.

**Step 1: the plant at crossover.** Put $s = 5j$ into $G$. Computed: $G(5j) \approx -0.0279 - 0.1550j$, which has magnitude about $0.157$ and phase about $-100.2^\circ$.

**Step 2: what the controller must supply.** We want $L(5j)$ to have magnitude $1$ and phase $-180^\circ + 60^\circ = -120^\circ$. So $C(5j) = L(5j)/G(5j)$ needs magnitude $1/0.157 \approx 6.35$ and phase $-120^\circ - (-100.2^\circ) = -19.8^\circ$. As a complex number, $C(5j) \approx 5.975 - 2.151j$.

**Step 3: read off the gains.** A PI controller at $s = j\omega$ is $K_p + \frac{K_i}{j\omega} = K_p - j\frac{K_i}{\omega}$. Match the real parts: $K_p \approx 5.975$. Match the imaginary parts: $\frac{K_i}{5} = 2.151$, so $K_i \approx 10.75$.

**Step 4: check with MATLAB.**

```matlab
s = tf('s');
G = 8/((s + 2)*(s + 8));
C = pid(5.975, 10.75);
[Gm, Pm, Wcg, Wcp] = margin(C*G)
%   Gm  = Inf       (the phase never reaches -180 degrees)
%   Pm  = 60.0      degrees
%   Wcg = NaN
%   Wcp = 5.00      rad/s
stepinfo(feedback(C*G, 1))
```

The closed-loop step overshoots by about $8.2\%$, rises from 10 to 90 percent in about $0.27\,\mathrm{s}$ and settles within 2 percent in about $0.80\,\mathrm{s}$.

**Sanity check.** The integrator guarantees zero steady error, and a $60^\circ$ margin usually means a modest overshoot of under ten percent. Both hold. `pidtune(G, 'PI', 5)` is solving the same kind of problem and should land close to these gains; if it lands far away, find out why before flying either answer.
:::

::: warning A tuned PID is only as good as the model it was tuned on
`pidtune` finds gains that are right for the model you gave it. If you tuned on a reduced model, re-run `margin` on the *full* model, bending modes and all, before you trust the gains. Reduction throws away high-frequency detail, and a bending mode that crosses back above 0 dB is exactly the kind of detail it throws away.
:::

## The two apps: PID Tuner and Control System Designer

MATLAB wraps these ideas in two interactive apps. Both are ways of turning dials and watching plots update. Neither does anything you could not script, and flight teams usually end by writing the chosen design into a script, so it can be reviewed and rerun.

The **PID Tuner** opens with `pidTuner(G, 'PID')`. It shows the closed-loop step response of an automatically tuned controller. Two sliders let you trade response time against robustness (in time-domain view they are labelled for response time and transient behavior). A panel lists the gains and the performance numbers: rise time, settling time, overshoot, gain and phase margin. When you like the result you export the controller to the workspace.

The **Control System Designer** opens with `controlSystemDesigner(G)`. It is the older and broader tool; it used to be called the **[[SISO Design Tool|siso-name]]**, and `sisotool` still opens it. Its standard setup is a feedback loop with a compensator $C$ in the forward path, plus a prefilter and a sensor block you can use or leave at $1$. It shows linked editors: the root locus from lesson 03 and the open-loop Bode plot from lesson 04. You drag the compensator's poles and zeros, or its gain, right on those plots, and every other plot updates. You can shade forbidden regions, such as "settling time must be under 2 seconds" on the root locus, so you see at once whether a design meets its requirements. It is the natural place for designs that are not PID-shaped, such as the notch filter and lead network you will meet in this module's first exercise.

::: key
**PID Tuner** (`pidTuner`): automatic PID tuning with response-time and robustness sliders, for one loop. **Control System Designer** (`controlSystemDesigner`, formerly `sisotool`): drag poles, zeros and gain on linked root-locus and Bode editors, with requirement regions, for any compensator shape. Both export the controller to the workspace, where you verify it in a script.
:::

## Check yourself

::: check
`L = C*P` came back as $\frac{2s + 4}{s^3 + 5s^2 + 6s}$. What will `minreal(L)` return? Show the factoring.
:::

::: answer
Factor the top: $2s + 4 = 2(s+2)$. Factor the bottom: $s^3 + 5s^2 + 6s = s(s^2 + 5s + 6) = s(s+2)(s+3)$. The factor $(s+2)$ appears on both, so `minreal` cancels it and returns $\frac{2}{s(s+3)} = \frac{2}{s^2 + 3s}$. The model drops from third order to second order, with the same input-output behavior.
:::

::: check
A model has Hankel singular values $[4.1,\ 3.8,\ 0.02,\ 0.01,\ 0.004]$. What order would you reduce to, and what is the error bound?
:::

::: answer
The big drop is between the second value ($3.8$) and the third ($0.02$), a factor of $190$. Keep two states. The discarded values add to $0.02 + 0.01 + 0.004 = 0.034$, so the worst error is at most $2 \times 0.034 = 0.068$. That is small next to the kept values of about $4$. Reducing to one state would be a mistake: $\sigma_2 = 3.8$ is almost as important as $\sigma_1$.
:::

::: check
You call `modred(sys, 3, 'Truncate')` to remove a sensor filter state, and the reduced model's step response is flat zero. What happened, and what should you have done?
:::

::: answer
The sensor filter state sat in the path from the vehicle to the measured output: the output matrix $C$ read the filter state and nothing else. Deleting that state removed the only way the output could see anything, so the output became zero. Use the default, `modred(sys, 3)`, which is `'MatchDC'`. It sets the filter state's derivative to zero, solves for it, and substitutes it back, so the output reads the vehicle state directly with the correct steady gain.
:::

::: check
A PID controller in standard form has $K_p = 2$, $T_i = 0.5\,\mathrm{s}$ and $T_d = 0.1\,\mathrm{s}$. What are $K_i$ and $K_d$ in parallel form, and what `pid` call builds it?
:::

::: answer
Standard form is $K_p\left(1 + \frac{1}{T_i s} + T_d s\right) = K_p + \frac{K_p/T_i}{s} + K_p T_d\,s$. So $K_i = K_p / T_i = 2 / 0.5 = 4$ and $K_d = K_p T_d = 2 \times 0.1 = 0.2$. The call is `pid(2, 4, 0.2)`, or `pidstd(2, 0.5, 0.1)` for the same controller in standard form.
:::

::: check
`pidtune(G, 'PI')` returns a controller with phase margin $60^\circ$ at $1.2\,\mathrm{rad/s}$, but your requirement is a crossover near $4\,\mathrm{rad/s}$. What do you change, and what should you check afterward?
:::

::: answer
Fix the crossover yourself: `C = pidtune(G, 'PI', 4)`. Then check it: `margin(C*G)` to see the phase margin `pidtune` could reach at that faster crossover (it may fall short of $60^\circ$; `info.PhaseMargin` from `[C, info] = pidtune(...)` reports it), and `step(feedback(C*G,1))` or `stepinfo` for overshoot and settling. If `G` was a reduced model, repeat the `margin` check on the full model, since a faster crossover sits closer to the high-frequency dynamics that reduction threw away.
:::

## Summary

| Tool or idea | What it does | Remember |
|---|---|---|
| `minreal(sys, tol)` | removes cancelling pole-zero pairs and dead states | never cancel an unstable pole |
| `hsvd(sys)` | Hankel singular values, largest first | look for a big drop |
| `balred(sys, r)` | keeps the $r$ most important balanced states | error $\le 2 \sum$ discarded $\sigma$ |
| `modred(sys, elim)` | removes the states you name, physical coordinates kept | default `'MatchDC'` keeps DC gain |
| `'Truncate'` | deletes states outright | can cut the input or output path |
| $C(s) = K_p + K_i/s + K_d s$ | parallel PID form, `pid(Kp,Ki,Kd,Tf)` | $K_i = K_p/T_i$, $K_d = K_p T_d$ |
| `pidtune(G, type, wc)` | automatic PID gains | default target $60^\circ$ phase margin |
| PID Tuner, Control System Designer | interactive tuning apps | export, then verify in a script |

Next lesson: every model and controller here was designed at one flight condition. A launch vehicle flies through many, so lesson 08 builds a whole family of designs at once, stored in arrays of LTI models, and blends their gains as the vehicle climbs.

::: context bending-modes Why a rocket bends
A launch vehicle is a long, thin tube, often more than ten times as tall as it is wide. Like a ruler you flick, it can vibrate in a bending shape. Each bending shape, or mode, adds two states to the model: one for how far it has bent and one for how fast. The gyros sit somewhere along that bending tube, so they feel both the rigid rotation the autopilot wants to control and the wiggle it must not chase.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="75" x2="320" y2="75" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M40,55 C110,95 250,95 320,55" fill="none" stroke="#1d6fd1" stroke-width="4"/>
  <circle cx="92" cy="80" r="6" fill="#b4232c"/>
  <circle cx="268" cy="80" r="6" fill="#b4232c"/>
  <text x="40" y="30" font-size="12" fill="#1f2a44">first bending mode (exaggerated)</text>
  <text x="70" y="110" font-size="11" fill="#b4232c">node</text>
  <text x="250" y="110" font-size="11" fill="#b4232c">node</text>
  <text x="170" y="130" font-size="11" fill="#6c7a93">straight, rigid shape</text>
  <text x="300" y="45" font-size="11" fill="#1f2a44">nose</text>
  <text x="30" y="45" font-size="11" fill="#1f2a44">tail</text>
</svg>
```

The red dots are nodes, points that do not move sideways in this mode.
:::

::: context hsv-meaning How much a state is worth
Each Hankel singular value blends two measurements of the same state. One is how much energy it takes to push the state to a given size from rest (cheap to push means controllable). The other is how much output energy the state produces when it is let go (loud means observable). Balancing picks coordinates in which those two measurements are equal for every state, and each Hankel singular value is that shared measure. Hermann Hankel was a nineteenth-century German mathematician; the matrices named after him have constant values along each anti-diagonal, and the values here are the singular values of one of them.
:::

::: context time-constant How fast a single pole answers
A block $\frac{a}{s+a}$ has one pole at $s = -a$. Give it a step and its output climbs as $1 - e^{-at}$. After a time $\tau = 1/a$ (read "tau"), the time constant, it has covered $1 - e^{-1}$, about 63 percent of the way. After $4\tau$ it is within 2 percent of the end. So an actuator with its pole at $-30$ has $\tau \approx 0.033\,\mathrm{s}$ and is essentially done in about $0.13\,\mathrm{s}$, while the vehicle pole at $-1$ takes about $4\,\mathrm{s}$. That thirty-to-one gap in speed is why the fast state can be dropped.
:::

::: context dc-gain What DC means here
DC stands for direct current, a leftover from electrical engineering, where a steady current was "direct" and a wiggling one "alternating". In control it means "at zero frequency": hold the input steady forever and see where the output settles. For a transfer function, the DC gain is its value at $s = 0$, and `dcgain(sys)` computes it. A reduced model that gets the DC gain wrong will settle at the wrong value, which on a vehicle can mean a steady pointing error.
:::

::: context minorsky A helmsman turned into equations
Nicolas Minorsky, a Russian-born engineer who settled in the United States, watched how skilled helmsmen steered. They reacted to how far off course the ship was, to how long it had been off, and to how fast it was swinging. His 1922 paper turned those three habits into the proportional, integral and derivative terms, and the Navy tested his steering system on the battleship USS New Mexico in the 1920s. A century later, the same three terms fly on drones, rockets and spacecraft reaction wheels.
:::

::: context crossover Where the loop gain crosses 1
On the Bode magnitude plot of the loop $L = CG$ from lesson 04, the crossover frequency is where the curve crosses 0 dB, meaning a loop gain of exactly $1$. Below it, feedback is strong and fights errors. Above it, feedback fades. The crossover sets roughly how fast the closed loop responds, and the phase margin is read at this one frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M50,25 L190,75 L330,125" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="190" cy="75" r="5" fill="#b4232c"/>
  <text x="200" y="68" font-size="12" fill="#b4232c">crossover, |L| = 1</text>
  <text x="295" y="90" font-size="11" fill="#6c7a93">0 dB</text>
  <text x="60" y="118" font-size="11" fill="#1f2a44">|L| in dB</text>
  <text x="250" y="145" font-size="11" fill="#1f2a44">frequency (log) →</text>
</svg>
```
:::

::: context siso-name Single input, single output
SISO means single-input, single-output: one command in, one measurement out, like a pitch loop from nozzle angle to pitch angle. Classical tools such as root locus and Bode shaping work one SISO loop at a time, which is why the old tool had the name. A problem with several coupled inputs and outputs is MIMO (multi-input, multi-output), and that is where the state-space methods of lesson 06 take over.
:::
