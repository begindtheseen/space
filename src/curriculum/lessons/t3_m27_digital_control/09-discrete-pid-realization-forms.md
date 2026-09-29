---
id: l09-discrete-pid-realization-forms
title: Discrete PID realization forms
minutes: 21
covers:
  - Discrete PID realization forms (direct, parallel, delta) and their numerical conditioning
---

A song can be written as sheet music, as guitar tabs, or as a list of which keys to press when. Played perfectly, all three sound the same. But try to change the key halfway through, or find the one wrong note, and some versions make it easy and others make it miserable. A controller is like that. The PID you tuned in the classical control module is one transfer function, and there are at least four ways to write it as flight code. On paper they are identical. In a flight computer they are not.

One form makes **anti-windup** — stopping the integrator from piling up while the actuator is maxed out — a single line, and another makes it nearly impossible. One loses almost six significant digits to cancellation at a $1\,\mathrm{kHz}$ frame rate, and another loses none. One changes gains smoothly, and another kicks the command every time a gain schedule updates.

The four forms are:

- the **parallel** form, where each term keeps its own state;
- the **direct** form, where the whole controller is one second-order difference equation;
- the **velocity** (or incremental) form, which computes the *change* in the command instead of the command;
- the **delta** form, which replaces the shift operator $z$ with $(z-1)/T$ so the coefficients stay a sensible size at high sample rates.

This lesson builds each one from the same continuous PID, shows what its stored numbers mean and which jobs are easy or hard in it, and then puts numbers on the conditioning argument — the one that decides the matter on a fast loop.

## Discretizing the three terms

Start from the practical PID of the classical control module. It has a filtered derivative, and that derivative acts on the measurement rather than the error:

$$
u(t) = k_p\,e(t) + k_i\!\int_0^t\! e\,d\tau - k_d\,\frac{N s}{s + N}\,y .
$$

Here $u$ is the command, $r$ the **setpoint** (what you want), $y$ the measurement, $e = r - y$ the error, and $N$ (in $\mathrm{rad/s}$) the corner of the derivative filter. Taking the derivative of the measurement rather than of the error removes the **[[derivative kick|derivative-kick]]** when the setpoint jumps. The minus sign is right because $e = r - y$, and $r$ has been left out of the derivative path: when $r$ is steady, $\dot e = -\dot y$.

**The proportional term** needs nothing: $P[n] = k_p e[n]$.

**The integral term** means "add up the area under the error curve". A computer only knows the error at the sample instants, so it must estimate each slice of area. There are **[[three common ways|rectangles-picture]]** to do it:

$$
\begin{aligned}
\text{forward (left) rectangle:}&\quad I[n] = I[n-1] + k_i T\, e[n-1], \\
\text{backward (right) rectangle:}&\quad I[n] = I[n-1] + k_i T\, e[n], \\
\text{trapezoidal:}&\quad I[n] = I[n-1] + \tfrac{1}{2}k_i T\,\big(e[n] + e[n-1]\big).
\end{aligned}
$$

The forward rectangle uses the height at the start of each slice, the backward rectangle the height at the end, and the trapezoid the average of both.

All three put the pole exactly at $z = 1$, which matters most: an integrator must integrate exactly. Even forward Euler gets the pole location right here, because $s = 0$ maps to $z = 1$ under every discretization method in this module. What differs is the phase. At $f = 2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop, against the ideal integrator's $-90.00^\circ$:

| Discretization | Phase | Gain relative to ideal |
| --- | --- | --- |
| Backward rectangle | $-86.40^\circ$ | $1.00066$ |
| Trapezoidal | $-90.00^\circ$ | $0.99868$ |
| Forward rectangle | $-93.60^\circ$ | $1.00066$ |

The trapezoid has *exactly* $-90^\circ$ at every frequency, with a small gain error of $(\omega T/2)\cot(\omega T/2)$. The rectangles sit half a sample either side of it, $\pm 180^\circ f/f_s$, which is $\pm 3.6^\circ$ here. The backward rectangle *leads*, and that is why it is the common choice: it hands back half a sample of the phase the hold takes. The forward rectangle lags by the same amount and is the one to avoid. (A Check yourself question below derives these phases.)

**The derivative term** is the recursion from the quantization lesson. With $a = e^{-NT}$ and $G = k_d N(1+a)/2$,

$$
D[n] = a\,D[n-1] - G\,\big(y[n] - y[n-1]\big).
$$

The pole lands exactly where $e^{-NT}$ puts it, the high-frequency gain matches $k_d N$, and the filter keeps the quantization noise of the last lesson out of the actuator.

## Parallel form

Picture three separate tip jars labeled P, I and D, and at the end you pour them together. That is the parallel form. Keep $I$ and $D$ as separate states and add at the end:

$$
u[n] = k_p e[n] + I[n] + D[n].
$$

There are two stored numbers, and each one means something physical. $I[n]$ is the integral's contribution *in command units* — newton meters, if the command is a torque — and $D[n]$ is the derivative's contribution in the same units. That is why this form dominates flight software. Every job you must actually do to a PID is easy here.

- **Anti-windup.** The integral is one number, so clamping it, recomputing it, or pausing it is one line of code. The other forms have no such number.
- **[[Bumpless transfer|bumpless]].** To switch into this controller with the actuator already at $u_0$, set $I = u_0 - k_p e - D$. One assignment, and the command does not jump.
- **[[Gain scheduling|gain-scheduling]].** Changing $k_p$ or $k_d$ changes the output immediately and cleanly, because the stored states are contributions, not past outputs. Changing $k_i$ needs a little care: rescale $I$ by the gain ratio if you store it pre-multiplied, or store $\int e\,d\tau$ and multiply at use.
- **Telemetry.** You can send $P$, $I$ and $D$ to the ground separately and see which term is doing the work. A direct-form controller has nothing to send but two numbers with no meaning.

```python
import numpy as np


class ParallelPID:
    """Parallel-form discrete PID with clamping anti-windup. Fixed step, no allocation."""

    def __init__(self, kp, ki, kd, n_filt, dt, u_min, u_max):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.dt, self.u_min, self.u_max = dt, u_min, u_max
        self.a = np.exp(-n_filt * dt)            # derivative filter pole
        self.g = kd * n_filt * (1.0 + self.a) / 2.0
        self.i_state = 0.0                       # integral term, in command units
        self.d_state = 0.0                       # filtered derivative term
        self.y_prev = 0.0

    def step(self, r, y):
        e = r - y
        d_in = y - self.y_prev                   # derivative on measurement, not on error
        self.y_prev = y
        self.d_state = self.a * self.d_state - self.g * d_in
        i_trial = self.i_state + self.ki * self.dt * e
        u = self.kp * e + i_trial + self.d_state
        u_sat = min(max(u, self.u_min), self.u_max)
        if u == u_sat or (u - u_sat) * e < 0.0:  # clamp: integrate only if it helps
            self.i_state = i_trial
        return u_sat


pid = ParallelPID(kp=13260.0, ki=8000.0, kd=2227.0, n_filt=125.66370614359172,
                  dt=0.001, u_min=-2000.0, u_max=2000.0)

j, theta, omega = 500.0, 0.0, 0.0
for k in range(4000):
    u = pid.step(0.1, theta)                     # 0.1 rad step command
    omega += (u / j) * pid.dt
    theta += omega * pid.dt
    if k in (0, 99, 499, 1999, 3999):
        print("t=%5.3f s  theta=%8.5f rad  u=%9.2f N m  I=%9.2f" % (
            (k + 1) * pid.dt, theta, u, pid.i_state))

# t=0.001 s  theta= 0.00000 rad  u=  1326.80 N m  I=     0.80
# t=0.100 s  theta= 0.01190 rad  u=   795.81 N m  I=    76.73
# t=0.500 s  theta= 0.12275 rad  u=  -507.08 N m  I=   171.96
# t=2.000 s  theta= 0.10490 rad  u=   -27.87 N m  I=    40.02
# t=4.000 s  theta= 0.10078 rad  u=     0.73 N m  I=     9.61
```

The plant is the $J = 500\,\mathrm{kg\,m^2}$ rigid body of the earlier lessons, commanded to turn $0.1\,\mathrm{rad}$, with the torque limited to $\pm2000\,\mathrm{N\,m}$. Read the printout. The attitude overshoots — it peaks at $0.136\,\mathrm{rad}$ near $t = 0.68\,\mathrm{s}$ — and settles back toward $0.1$. The integral state peaks at about $182\,\mathrm{N\,m}$ near $0.39\,\mathrm{s}$, then unwinds to under $10\,\mathrm{N\,m}$ by $4\,\mathrm{s}$. The largest command is $1327\,\mathrm{N\,m}$ on the very first frame, so this small step never touches the limit; the clamp is there for bigger ones. Every one of these numbers can be inspected, because every one is a physical quantity.

## Direct form

Now pour all three jars into one pot of soup. Combine the terms algebraically into one transfer function and run it as a single second-order section:

$$
C(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}},
\qquad
u[n] = \sum_k b_k e[n-k] - \sum_k a_k u[n-k].
$$

Its strengths are real. It has the fewest operations, one code path that any filter can share, and coefficients that come straight out of a design tool. It is the right choice for a filter that is only a filter — anti-alias, notch, roll-off — and the next lesson is about doing that well.

For a PID it is the wrong choice, for four reasons.

First and second: the stored states are past *outputs*, so there is no integral state to clamp. Anti-windup needs either rebuilding something parallel or a recalculation derived afresh for each coefficient set. Bumpless transfer has the same problem. Setting $u[n-1]$ and $u[n-2]$ to make the output continuous does not put the controller in the right internal state, because how those two numbers encode "what the integrator has piled up" depends on the coefficients.

Third: changing a gain changes every coefficient. The stored past outputs were computed with the *old* coefficients, and the new coefficients acting on that history make a transient. On a gain-scheduled launch vehicle that updates its gains every frame, that transient happens every frame.

Fourth, and decisive on a fast loop: conditioning.

::: example What the direct form costs at 1 kHz
Take the PID $k_p = 13{,}260$, $k_i = 8{,}000$, $k_d = 2{,}227$, $N = 125.66\,\mathrm{rad/s}$ and discretize it with Tustin at two rates. The denominator comes from $s(s+N)$, and the numerator from putting all three terms over that common denominator.

At $f_s = 50\,\mathrm{Hz}$:

$$
a = [\,1,\ -0.886275,\ -0.113725\,],
\qquad
b = [\,137{,}353,\ -259{,}690,\ 122{,}514\,].
$$

At $f_s = 1000\,\mathrm{Hz}$:

$$
a = [\,1,\ -1.881765,\ 0.881765\,],
\qquad
b = [\,276{,}573,\ -551{,}570,\ 274{,}998\,].
$$

Look at the $1\,\mathrm{kHz}$ numerator. Three coefficients of about $2.8\times10^5$, alternating in sign, whose sum is only $0.946$. The controller's low-frequency behavior depends on that sum, and computing it **[[throws away|cancellation]]** $\log_{10}(551570/0.946) = 5.77$ significant digits. Single precision carries $\log_{10}(2^{24}) = 7.2$ digits, so about one and a half survive. The parallel form stores $k_i = 8000$ as a number and never forms such a difference.

The denominator shows the same disease, the one the delta form is designed to cure. From $50\,\mathrm{Hz}$ to $1\,\mathrm{kHz}$, $a_1$ has moved from $-0.886$ to $-1.882$, on its way to $-2$, and $a_2$ from $-0.114$ to $+0.882$, on its way to $+1$. The information that tells this controller apart from a pure double integrator is sinking into the last digits of both.

None of this shows up in a double-precision simulation on a workstation. That is exactly why it is worth computing rather than hoping a test will catch it.
:::

## Velocity (incremental) form

Instead of telling someone where to stand, tell them how many steps to take. The **velocity form** computes the *change* in the command and adds it on:

$$
\Delta u[n] = k_p\big(e[n] - e[n-1]\big) + k_i T\,e[n] + \frac{k_d}{T}\big(e[n] - 2e[n-1] + e[n-2]\big),
$$

then $u[n] = u[n-1] + \Delta u[n]$. Each term is the change in the matching positional term: proportional becomes a first difference, the integral's change is plain $k_i T e[n]$, and the derivative becomes a *second* difference. The integration has moved into the output accumulator.

It has two real advantages. Anti-windup is nearly automatic: if the actuator saturated, store the value actually applied as $u[n-1]$ instead of the value computed, and the accumulator cannot run away. And a gain change only affects increments, so there is no transient from stale state.

It has two matching drawbacks. The derivative is a second difference. With independent noise of standard deviation $\sigma$ on each sample, $e[n] - 2e[n-1] + e[n-2]$ has variance $(1 + 4 + 1)\sigma^2$, so the noise grows by about $\sqrt{6}/T^2$ in standard deviation, against $\sqrt2/T$ for a first difference. Unfiltered, it is unusable on a real sensor, and filtering it loses much of the form's simplicity. And the output accumulator is a bare integrator, so in fixed point a truncation bias of half an LSB per frame drifts exactly as the quantization lesson warned. Round, and use a wide accumulator.

The velocity form is common in **[[process control|process-control]]**, where actuators are often incremental by nature — a valve stepper, a motor position — and much rarer in aerospace, where the parallel form's inspectability usually wins.

## Delta form

Suppose you want the thickness of a sheet of paper, and all you have is a tape measure from the floor. You measure to the top of a stack, add one sheet, measure again, and subtract. The answer is a tiny difference between two big readings, and every error in the readings lands in it. Much better to measure the thickness directly. The **delta form** does exactly that for a discrete filter.

At high sample rates every pole crowds toward $z = 1$, and each coefficient becomes a small wiggle on a fixed number. The **[[delta operator|delta-operator]]** removes that by construction. Define

$$
\delta = \frac{z - 1}{T},
$$

read "delta". So $z = 1 + \delta T$, and as $T \to 0$, $\delta$ behaves like $s$. A system written in $\delta$ has coefficients that approach the *continuous* ones instead of $[1, -2, 1]$.

Substitute $z = 1 + \delta T$ into $z^2 + a_1 z + a_2$. Expanding, $(1 + \delta T)^2 + a_1(1 + \delta T) + a_2 = T^2\delta^2 + (2 + a_1)T\,\delta + (1 + a_1 + a_2)$. Divide by $T^2$:

$$
\delta^2 + \frac{2 + a_1}{T}\,\delta + \frac{1 + a_1 + a_2}{T^2}.
$$

The two delta coefficients are the combinations $(2 + a_1)/T$ and $(1 + a_1 + a_2)/T^2$. For a pole pair with damping $\zeta$ and natural frequency $\omega_n$ these approach $2\zeta\omega_n$ and $\omega_n^2$ — ordinary-sized numbers that do not depend on the sample rate.

In code, the delta form is the recursion written as adding up increments rather than as a weighted sum of past outputs:

$$
x_1[n+1] = x_1[n] + T\,x_2[n],
\qquad
x_2[n+1] = x_2[n] + T\big(\cdots\big),
$$

which is why "write the integrator as state plus $T$ times rate" is good practice, not mere habit. The stored numbers are states with physical units, and the coefficients are continuous-sized, so neither the coefficients nor the running arithmetic lose precision as $T$ shrinks.

::: key
**Delta form (and when you need it).** At very high sample rates, direct-form coefficients cluster near $z = 1$ and lose precision. The delta operator $(z-1)/T$ keeps coefficients well scaled and is the standard remedy in fixed point.
:::

::: example The same notch, in $z$ and in $\delta$
Take the $\omega_m = 18\,\mathrm{rad/s}$, $\zeta_d = 0.3$ notch used throughout this module, discretized with prewarped Tustin. Here is its denominator in $z$, and the two delta combinations:

| $f_s$ | $a_1$ | $a_2$ | $(2+a_1)/T$ | $(1+a_1+a_2)/T^2$ |
| --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $-1.939607$ | $0.947489$ | $12.079$ | $315.28$ |
| $2\,\mathrm{kHz}$ | $-1.994534$ | $0.994615$ | $10.932$ | $323.13$ |

Check one: at $200\,\mathrm{Hz}$, $(2 - 1.939607)/0.005 = 12.079$. The delta coefficients are closing in on the continuous ones, $2\zeta_d\omega_m = 2 \times 0.3 \times 18 = 10.8$ and $\omega_m^2 = 324$, and both are ordinary-sized at either rate. The $z$ coefficients are closing in on $-2$ and $+1$.

Now nudge $a_2$ by one step of a $\mathrm{Q}15$ word, $2^{-15} = 3.052\times10^{-5}$, and watch $\omega_m^2$, which is $(1 + a_1 + a_2)/T^2$:

| $f_s$ | $1 + a_1 + a_2$ | One $\mathrm{Q}15$ step, as a fraction of it | $\omega_m^2$ before and after |
| --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $7.882\times10^{-3}$ | $0.39\%$ | $315.28 \to 316.50$ |
| $2\,\mathrm{kHz}$ | $8.078\times10^{-5}$ | $37.8\%$ | $323.13 \to 445.20$ |

At $2\,\mathrm{kHz}$ a single least significant bit in $a_2$ moves the notch's squared natural frequency by $38\%$, and the notch center by $\sqrt{1.378} - 1 \approx 17\%$. That is because the notch frequency lives in the fifth significant digit of a sum of numbers near $1$ and $2$. At $200\,\mathrm{Hz}$ the same bit moves it by under half a percent.

The delta form escapes because it stores $323.13$ as a coefficient in its own right. A $16$-bit word scaled for coefficients up to $512$ resolves $512 \times 2^{-15} = 0.0156$, which is $0.005\%$ of $323$: four orders of magnitude better than the direct form, at the same word length and sample rate.

Notice where the threshold sits. The quantity $1 + a_1 + a_2$ is about $(\omega_m T)^2$, so it shrinks as the square of the sample period. Doubling $f_s$ divides it by four, which costs two bits. That is the rule to carry: **[[every doubling of the sample rate costs a direct-form section two bits|two-bits-chart]]**.
:::

::: warning
The delta form is not a different filter, and it is not more accurate in exact arithmetic. In infinite precision the delta and direct forms give identical outputs, because $\delta = (z-1)/T$ is only an invertible change of variable. Its whole benefit is numerical, so it is worth nothing on a loop whose $\omega_n T$ is comfortably large.

The concrete test: compute $1 + a_1 + a_2$ for each section and compare it with the resolution of the word you store $a_2$ in. If the ratio is above a few hundred, the direct form is fine and simpler. Below about $30$, move to the delta form or run that element at a slower rate. In between, look harder.
:::

## Check yourself

::: check
A colleague implements a PID in direct form and reports that the controller "jumps" whenever the gain schedule updates, even though the gains change by less than $1\%$ per frame. Explain the mechanism and give the fix.
:::

::: answer
In direct form the stored state is past *outputs*, $u[n-1]$ and $u[n-2]$, computed with the old coefficients. When the coefficients change, the recursion $u[n] = \sum b_k e[n-k] - \sum a_k u[n-k]$ applies the new $a_k$ to a history that belongs to the old controller. The result is a step in $u$ whose size depends on how big the stored outputs are, not on how small the gain change was. A controller working hard, with $u[n-1]$ near the actuator limit, jumps a lot. One sitting at zero does not jump at all — which is why the problem often slips through bench testing.

The fix is the parallel form. Its states are the integral and derivative *contributions*, so changing $k_p$ or $k_d$ changes the next output by exactly what the gain change implies and nothing more. If the direct form must stay, the state has to be transformed whenever the coefficients change — solving for the $u[n-1]$, $u[n-2]$ the new controller would have produced. That is possible, coefficient-dependent, and far more code than switching forms.
:::

::: check
Why does the backward-rectangle integrator have $-86.4^\circ$ of phase at $2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop rather than $-90^\circ$? Is that good or bad?
:::

::: answer
The backward rectangle is $k_i T/(1 - z^{-1})$. On the unit circle $z = e^{j\omega T}$. Factor out half a sample: $1 - e^{-j\omega T} = e^{-j\omega T/2}\big(e^{j\omega T/2} - e^{-j\omega T/2}\big) = 2j\sin(\omega T/2)\,e^{-j\omega T/2}$. So the transfer function is

$$
\frac{k_i T}{2j\sin(\omega T/2)}\,e^{\,j\omega T/2}.
$$

Dividing by $j$ gives $-90^\circ$, and the factor $e^{j\omega T/2}$ adds $+\omega T/2$. The phase is $-90^\circ + \omega T/2$, that is $-90^\circ + 180^\circ f/f_s$. At $2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop: $-90 + 180 \times 2/100 = -90 + 3.6 = -86.4^\circ$.

It is mildly good. The half sample of lead partly cancels the half sample the zero-order hold takes, so the integral path costs a little less phase than an ideal integrator would. The effect is small — $3.6^\circ$ on one of three terms — and should not be relied on, but it is why backward rather than forward is the default. The forward rectangle has the same expression times an extra $z^{-1}$, giving $-93.6^\circ$: half a sample of lag on top of the hold's half sample, for no benefit.

The trapezoid has exactly $-90^\circ$ at every frequency and a gain error of $(\omega T/2)\cot(\omega T/2)$, here $0.9987$. If you want the discrete integrator to match the continuous one in phase, choose that.
:::

::: check
A $4\,\mathrm{kHz}$ rate loop has a second-order section whose coefficients are stored in a $16$-bit word as $\mathrm{Q}14$. Its poles correspond to $\omega_n = 40\,\mathrm{rad/s}$, $\zeta = 0.5$. Is the direct form acceptable?
:::

::: answer
Apply the test from the warning. $1 + a_1 + a_2 \approx (\omega_n T)^2$ with $T = 1/4000 = 2.5\times10^{-4}\,\mathrm{s}$:

$$
(\omega_n T)^2 = (40 \times 2.5\times10^{-4})^2 = (0.01)^2 = 1.0\times10^{-4}.
$$

A $\mathrm{Q}14$ word resolves $2^{-14} = 6.104\times10^{-5}$. The ratio is $1.0\times10^{-4}/6.104\times10^{-5} = 1.64$.

That is a disaster, not a borderline case. One least significant bit changes $\omega_n^2$ by $61\%$, and two bits can push $1 + a_1 + a_2$ through zero, putting a pole at $z = 1$ and turning the section into an integrator — the failure seen in the last lesson. The direct form is unusable here.

The options: the delta form, which stores $2\zeta\omega_n = 40$ and $\omega_n^2 = 1600$ as ordinary-sized coefficients; a wider coefficient word, which would need about $16$ more bits to reach a comfortable ratio; or running this section at a lower rate in a multi-rate arrangement, since a $40\,\mathrm{rad/s}$ element has no business being evaluated at $4\,\mathrm{kHz}$.
:::

::: check
In the velocity form, why does storing the value actually applied as $u[n-1]$ give anti-windup, and what is the matching operation in the parallel form?
:::

::: answer
In the velocity form the output accumulator *is* the integrator: $u[n] = u[n-1] + \Delta u[n]$. If the actuator saturated at $u_{\text{sat}}$ and you store $u_{\text{sat}}$ rather than the computed $u[n]$, the accumulator never holds a value the actuator cannot produce. The next increment starts from reality, so the moment the error changes sign, the command comes off the limit at once, with no built-up excess to unwind.

In the parallel form the match is **back-calculation**: after saturating, set

$$
I[n] = u_{\text{sat}} - k_p e[n] - D[n],
$$

so the stored integral is exactly what makes the three terms add up to what the actuator is really doing. Clamping — refusing to integrate further while saturated and while the error would push deeper into the limit, as the code above does — is the simpler variant and usually enough. The classical module's anti-windup carries over to the discrete case unchanged. What changes is that here you can see exactly which stored number you are modifying.
:::

::: check
Someone proposes keeping the PID in direct form but computing its coefficients on the flight computer at startup, from $k_p$, $k_i$, $k_d$ and $T$, in double precision. They argue this removes the conditioning problem. Does it?
:::

::: answer
It removes one of the two problems and leaves the other.

The coefficients themselves would be accurate, because they are computed in double precision from well-scaled inputs. If they are also *stored* in double precision, the coefficient-rounding argument of the last lesson no longer applies.

What remains is the cancellation at run time. Every frame, the recursion still forms $b_0 e[n] + b_1 e[n-1] + b_2 e[n-2]$ from three terms of about $2.8\times10^5$ whose sum is of order $1$, with whatever precision the arithmetic has. In double precision that is comfortable. In single precision it is not. And the problem grows with sample rate however the coefficients were obtained.

It also does nothing about the structural objections, which usually decide the matter: no integral state to clamp, no bumpless transfer, and a transient at every gain change. Those belong to the form, not to the arithmetic.
:::

## Summary

| Form | Update | State | Strengths and weaknesses |
| --- | --- | --- | --- |
| Parallel | $u = k_p e + I + D$, with $I$ and $D$ each recursive | Integral and derivative contributions, in command units | Easy anti-windup, bumpless transfer and gain scheduling; inspectable; the flight-software default |
| Direct | $u[n] = \sum b_k e[n-k] - \sum a_k u[n-k]$ | Past inputs and outputs | Fewest operations; no integral state to clamp; transient on gain change; conditioning fails at high rates |
| Velocity | $u[n] = u[n-1] + \Delta u[n]$ | Past command and two past errors | Natural anti-windup by storing the applied command; second difference amplifies noise; accumulator needs rounding |
| Delta | States accumulated as $x + T\,(\cdot)$ | Physical states | Coefficients stay continuous-sized; the fixed-point remedy at high rates; identical to direct form in exact arithmetic |

| Item | Statement |
| --- | --- |
| Integral discretizations | All place the pole at $z = 1$; backward rectangle leads by $180^\circ f/f_s$, forward lags by it, trapezoidal is exactly $-90^\circ$ |
| Filtered derivative | $D[n] = aD[n-1] - G(y[n]-y[n-1])$, $a = e^{-NT}$, $G = k_dN(1+a)/2$; on the measurement, not the error |
| Delta operator | $\delta = (z-1)/T$; $\delta^2 + \frac{2+a_1}{T}\delta + \frac{1+a_1+a_2}{T^2}$, coefficients approaching $2\zeta\omega_n$ and $\omega_n^2$ |
| Conditioning test | Compare $1 + a_1 + a_2 \approx (\omega_nT)^2$ with the coefficient word's resolution; every doubling of $f_s$ costs a direct-form section two bits |

The next lesson takes the direct form seriously for the job it suits: second-order filter sections, how to chain them, and which of the standard structures to write down when the arithmetic is finite.

::: context derivative-kick The kick you avoid
The setpoint (gray) jumps at one instant; the measurement (blue) follows smoothly. Below, the derivative of the *error* (red) contains a spike at the jump — in discrete time, one enormous sample of size $\Delta r/T$ — while the derivative of the *measurement* (blue) is a smooth hump.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs><marker id="dk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker></defs>
  <path d="M40,80 H80 V30 H340" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="40,80.0 80,80.0 85,79.4 90,77.8 95,75.5 100,72.8 105,69.8 110,66.8 115,63.7 120,60.8 125,57.9 130,55.2 135,52.6 140,50.3 145,48.1 150,46.2 155,44.4 160,42.7 165,41.3 170,40.0 180,37.7 190,36.0 200,34.6 210,33.5 220,32.7 230,32.0 240,31.5 250,31.2 260,30.9 270,30.7 280,30.5 290,30.4 300,30.3 320,30.2 340,30.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="250" y="24" font-size="11" fill="#6c7a93">setpoint r</text>
  <text x="250" y="48" font-size="11" fill="#1d6fd1">measurement y</text>
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1"/>
  <line x1="80" y1="150" x2="80" y2="100" stroke="#b4232c" stroke-width="3" marker-end="url(#dk)"/>
  <polyline points="40,150.0 80,150.0 85,161.5 90,169.5 95,174.7 100,177.9 105,179.5 110,180.0 115,179.6 120,178.7 125,177.3 130,175.7 135,173.9 140,172.1 145,170.2 150,168.5 155,166.7 160,165.1 165,163.6 170,162.2 180,159.7 190,157.6 200,156.0 210,154.6 220,153.6 230,152.7 240,152.1 250,151.6 260,151.2 270,150.9 280,150.7 300,150.4 320,150.2 340,150.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="88" y="110" font-size="11" fill="#b4232c">de/dt: spike at the jump</text>
  <text x="150" y="190" font-size="11" fill="#1d6fd1">−dy/dt: smooth</text>
</svg>
```

Feed that spike through $k_d$ and the actuator gets slammed for one frame. Differentiating only $y$ skips it.
:::

::: context rectangles-picture Three ways to slice the area
The same error curve and the same three samples-wide strip, sliced three ways. Left: each slice uses the height at its left edge (forward rectangle). Middle: the height at its right edge (backward rectangle). Right: a straight line between the two edges (trapezoid).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.2">
    <rect x="20" y="130" width="30" height="20"/><rect x="50" y="93.9" width="30" height="56.1"/><rect x="80" y="74.1" width="30" height="75.9"/>
    <rect x="135" y="93.9" width="30" height="56.1"/><rect x="165" y="74.1" width="30" height="75.9"/><rect x="195" y="63.2" width="30" height="86.8"/>
    <polygon points="250,150 250,130 280,93.9 280,150"/><polygon points="280,150 280,93.9 310,74.1 310,150"/><polygon points="310,150 310,74.1 340,63.2 340,150"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <polyline points="20.0,130.0 26.0,121.0 32.0,112.9 38.0,105.8 44.0,99.5 50.0,93.9 56.0,88.9 62.0,84.5 68.0,80.6 74.0,77.2 80.0,74.1 86.0,71.4 92.0,69.0 98.0,66.8 104.0,64.9 110.0,63.2"/>
    <polyline points="135.0,130.0 141.0,121.0 147.0,112.9 153.0,105.8 159.0,99.5 165.0,93.9 171.0,88.9 177.0,84.5 183.0,80.6 189.0,77.2 195.0,74.1 201.0,71.4 207.0,69.0 213.0,66.8 219.0,64.9 225.0,63.2"/>
    <polyline points="250.0,130.0 256.0,121.0 262.0,112.9 268.0,105.8 274.0,99.5 280.0,93.9 286.0,88.9 292.0,84.5 298.0,80.6 304.0,77.2 310.0,74.1 316.0,71.4 322.0,69.0 328.0,66.8 334.0,64.9 340.0,63.2"/>
  </g>
  <line x1="15" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="168">forward</text><text x="180" y="168">backward</text><text x="295" y="168">trapezoid</text>
  </g>
  <text x="180" y="30" font-size="11" fill="#b4232c" text-anchor="middle">error e(t)</text>
</svg>
```

On a rising curve the forward slices come out too small, the backward slices too big, and the trapezoid nearly exact.
:::

::: context bumpless No jolt at the handover
**Bumpless transfer** means switching control from one mode to another — manual to automatic, coast to active, one controller to the next — without a jump in the actuator command.

Picture a driver taking the wheel from cruise control. If the new controller starts from a blank state, its first command may be nothing like what the actuator is doing now, and the vehicle jerks. Setting the integral state so the first output equals the current command makes the handover smooth.
:::

::: context gain-scheduling Gains that change with the flight
A rocket's response to a fin or nozzle deflection changes enormously during ascent, as speed, air density and mass change. So one set of gains cannot serve the whole flight. **Gain scheduling** stores gains for many flight conditions and blends between them as the vehicle flies, often every frame.

That is why a controller form that jolts when a gain changes is unacceptable on a launch vehicle: its gains are always changing.
:::

::: context cancellation How subtraction eats digits
Subtract two nearly equal numbers and most of their digits cancel. $276{,}573.2 - 276{,}572.3 = 0.9$: two numbers known to seven digits give an answer with one.

The lost digits were never errors themselves; they were the part the two numbers shared. But any rounding already in the inputs — in the last digit or two — is now a large fraction of what is left. This is called **catastrophic cancellation**, and it is the reason a direct-form PID at a high rate loses so much precision.
:::

::: context process-control Where the velocity form lives
**Process control** is the control of factories, refineries and power plants: temperatures, flows, levels, pressures. Many of its actuators naturally take *changes* — "open the valve two more steps" — and some old controllers physically could only nudge an output up or down.

For them the velocity form is a perfect fit: its output is literally the next nudge. Aerospace usually prefers to see the P, I and D terms separately.
:::

::: context delta-operator A name worth knowing
The delta operator was developed into a complete theory of sampled systems in the 1980s, notably by Richard Middleton and Graham Goodwin, whose book *Digital Control and Estimation: A Unified Approach* (1990) treats it at length.

Their point was that as $T \to 0$, a delta-domain model turns smoothly into the continuous one, so continuous intuition keeps working. A $z$-domain model instead collapses toward $z = 1$, and its coefficients stop telling you anything useful.
:::

::: context two-bits-chart Where the direct form runs out of bits
For the $18\,\mathrm{rad/s}$ notch: the red curve is $1 + a_1 + a_2$ against sample rate, on logarithmic scales. The solid gray line is one $\mathrm{Q}15$ step, $3.05\times10^{-5}$; the dashed line is $30$ steps, the warning's "move to delta form" threshold. The curve falls a factor of $100$ for each factor of $10$ in rate — two bits per doubling.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="125.5" x2="340" y2="125.5" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="50" y1="81.1" x2="340" y2="81.1" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline points="50.0,35.4 64.5,41.3 79.0,47.1 93.5,53.0 108.0,59.0 122.5,64.9 137.0,70.9 151.5,76.8 166.0,82.8 180.5,88.8 195.0,94.8 209.5,100.7 224.0,106.7 238.5,112.7 253.0,118.7 267.5,124.7 282.0,130.7 296.5,136.7 311.0,142.7 325.5,148.7 340.0,154.7" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="93.6" cy="53.1" r="3.5" fill="#1f2a44"/><circle cx="238.6" cy="112.8" r="3.5" fill="#1f2a44"/>
  <text x="100" y="48" font-size="11" fill="#1f2a44">200 Hz</text>
  <text x="244" y="107" font-size="11" fill="#1f2a44">2 kHz</text>
  <text x="338" y="121" font-size="11" fill="#6c7a93" text-anchor="end">1 LSB of Q15</text>
  <text x="338" y="77" font-size="11" fill="#6c7a93" text-anchor="end">30 LSB</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="24">0.1</text><text x="45" y="84">0.001</text><text x="45" y="144">0.00001</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="184">100 Hz</text><text x="195" y="184">1 kHz</text><text x="330" y="184">10 kHz</text>
  </g>
  <text x="195" y="200" font-size="11" fill="#6c7a93" text-anchor="middle">sample rate</text>
</svg>
```

The curve crosses one LSB near $3.3\,\mathrm{kHz}$: above that, a single bit is bigger than everything that makes this filter a notch.
:::
