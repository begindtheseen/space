---
id: l09-discrete-pid-realization-forms
title: Discrete PID realization forms
minutes: 20
covers:
  - Discrete PID realization forms (direct, parallel, delta) and their numerical conditioning
---

The PID you tuned in the classical control module is one transfer function. There are at least four ways to write it as flight code, they are algebraically identical, and choosing between them is not a matter of style. One of them makes anti-windup a single line and another makes it impossible. One of them loses five significant digits to cancellation at a $1\,\mathrm{kHz}$ frame rate and another loses none. One of them changes gains without a transient and another produces a step in the command every time a gain schedule interpolates.

The forms are the **parallel** form, where each term keeps its own state; the **direct** form, where the whole controller is one second-order difference equation; the **velocity** or incremental form, which computes the change in command rather than the command; and the **delta** form, which replaces the shift operator $z$ with $(z-1)/T$ so the coefficients stay well scaled at high sample rates.

This lesson builds each one from the same continuous PID, shows what its states mean and what operations are easy and hard in it, and then puts numbers on the conditioning argument, which is the one that decides the matter on a fast loop.

## Discretizing the three terms

Start from the practical PID of the classical control module, with a filtered derivative acting on the measurement rather than the error:

$$
u(t) = k_p\,e(t) + k_i\!\int_0^t\! e\,d\tau - k_d\,\frac{N s}{s + N}\,y ,
$$

where $e = r - y$ is the error, $r$ the setpoint, $y$ the measurement, and $N$ in $\mathrm{rad/s}$ the derivative filter's corner. Derivative on the measurement rather than on the error is what removes the derivative kick when the setpoint steps, and the sign works out because $e = r - y$ and $r$ is held out of the derivative path.

**The proportional term** needs nothing: $P[n] = k_p e[n]$.

**The integral term** has three common discretizations, and their difference is instructive:

$$
\begin{aligned}
\text{forward (left) rectangle:}&\quad I[n] = I[n-1] + k_i T\, e[n-1], \\
\text{backward (right) rectangle:}&\quad I[n] = I[n-1] + k_i T\, e[n], \\
\text{trapezoidal:}&\quad I[n] = I[n-1] + \tfrac{1}{2}k_i T\,\big(e[n] + e[n-1]\big).
\end{aligned}
$$

All three put the pole exactly at $z = 1$, which is the one thing that matters most — an integrator must integrate exactly, and here even forward Euler is exact in pole location, because $s = 0$ maps to $z = 1$ under every discretization method in this module. What differs is the phase. At $f = 2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop, against the ideal $-90.00^\circ$:

| Discretization | Phase | Gain relative to ideal |
| --- | --- | --- |
| Backward rectangle | $-86.40^\circ$ | $1.00066$ |
| Trapezoidal | $-90.00^\circ$ | $0.99868$ |
| Forward rectangle | $-93.60^\circ$ | $1.00066$ |

Trapezoidal integration has *exactly* $-90^\circ$ of phase at every frequency — the factors of $e^{-j\omega T/2}$ in numerator and denominator cancel — with a small gain error of $(\omega T/2)\cot(\omega T/2)$. The rectangles are half a sample either side of it, $\pm 180^\circ f/f_s$, which is $3.6^\circ$ here. Backward rectangle *leads*, which is why it is the common choice: it gives back half a sample of the phase the hold takes. Forward rectangle lags by the same amount and is the one to avoid.

**The derivative term** is the recursion from the quantization lesson. With $a = e^{-NT}$ and $G = k_d N(1+a)/2$,

$$
D[n] = a\,D[n-1] - G\,\big(y[n] - y[n-1]\big).
$$

The pole is placed exactly, the high-frequency gain matches $k_d N$, and the filter is what keeps the quantization noise of the previous lesson out of the actuator.

## Parallel form

Keep $I$ and $D$ as separate states and add at the end:

$$
u[n] = k_p e[n] + I[n] + D[n].
$$

Two state words, and each one has physical meaning: $I[n]$ is the integral contribution *in command units* — newton metres, if the command is a torque — and $D[n]$ is the derivative contribution in the same units. That is why this form dominates flight software.

Everything that has to be done to a PID in practice is easy here.

- **Anti-windup**: the integral state is one number, so clamping it, back-calculating it, or conditionally integrating is a line of code. The forms below have no such number.
- **Bumpless transfer**: entering a mode with the actuator at $u_0$ means setting $I = u_0 - k_p e - D$. One assignment.
- **Gain scheduling**: changing $k_p$ or $k_d$ changes the output immediately with no transient, because the stored states are contributions rather than past outputs. Changing $k_i$ does require care — rescale $I$ by the gain ratio if the integral state is stored pre-multiplied, or store $\int e\,d\tau$ separately and multiply at use.
- **Telemetry and diagnosis**: you can downlink $P$, $I$ and $D$ separately and see which term is doing the work. On a direct-form controller there is nothing to downlink but two numbers with no interpretation.

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

The loop is the $J = 500\,\mathrm{kg\,m^2}$ rigid body of the earlier lessons, commanded to $0.1\,\mathrm{rad}$, with the torque limited to $\pm2000\,\mathrm{N\,m}$. The command overshoots to $0.1228\,\mathrm{rad}$ and settles back; the integral state peaks at $172\,\mathrm{N\,m}$ and unwinds. Every one of those numbers is inspectable because every one is a physical quantity.

## Direct form

Combine the three terms algebraically into one transfer function and implement it as a single second-order section:

$$
C(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}},
\qquad
u[n] = \sum_k b_k e[n-k] - \sum_k a_k u[n-k].
$$

Its virtues are real: the smallest operation count, one code path that any filter can use, and coefficients that come straight out of a design tool. It is the right choice for a filter that is a filter — the anti-alias, the notch, the roll-off — and the next lesson is about doing it well.

For a PID it is the wrong choice, for four reasons.

The states are past *outputs*, so there is no integral state to clamp. Anti-windup in direct form requires either restructuring back to something parallel or a back-calculation that has to be derived for each coefficient set. Bumpless transfer has the same problem: initialising $u[n-1]$ and $u[n-2]$ to make the output continuous does not put the controller in the right internal state, because the mapping from those two numbers to "what the integrator has accumulated" depends on the coefficients.

Changing a gain changes every coefficient, and because the stored state is past outputs computed with the *old* coefficients, the new coefficients acting on that state produce a transient. On a gain-scheduled launch vehicle interpolating gains every frame, that transient is every frame.

And then there is conditioning.

::: example What the direct form costs at 1 kHz
Take the PID $k_p = 13{,}260$, $k_i = 8{,}000$, $k_d = 2{,}227$, $N = 125.66\,\mathrm{rad/s}$ and discretize it with Tustin at two rates. The denominator comes from $s(s+N)$ and the numerator from combining all three terms.

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

Look at the numerator at $1\,\mathrm{kHz}$. Three coefficients of about $2.8\times10^5$, alternating in sign, whose signed sum is $0.946$. The controller's low-frequency behaviour depends on that sum, and computing it destroys $\log_{10}(551570/0.946) = 5.77$ significant digits. Single precision carries $7.2$; roughly one and a half digits survive. The parallel form stores $k_i = 8000$ as a number and never forms a difference at all.

The denominator shows the same disease in the form the delta-form card describes: $a_1$ has moved from $-0.886$ at $50\,\mathrm{Hz}$ to $-1.882$ at $1\,\mathrm{kHz}$, on its way to $-2$, and $a_2$ from $-0.114$ to $+0.882$, on its way to $+1$. The information that distinguishes this controller from a pure double integrator is retreating into the low-order bits of both.

None of this is visible in a simulation run in double precision on a workstation, which is exactly why it is worth computing rather than testing for.
:::

## Velocity (incremental) form

Compute the *change* in the command and accumulate it:

$$
\Delta u[n] = k_p\big(e[n] - e[n-1]\big) + k_i T\,e[n] + \frac{k_d}{T}\big(e[n] - 2e[n-1] + e[n-2]\big),
$$

then $u[n] = u[n-1] + \Delta u[n]$. The integral term has become the plain term and the integration has moved into the output accumulator.

The form has two genuine advantages. Anti-windup is close to automatic: if the actuator saturated, set $u[n-1]$ to the value actually applied rather than the value computed, and the accumulator cannot run away. And a gain change takes effect on increments only, so there is no transient from stale state.

It has two matching drawbacks. The derivative term is a *second* difference, which amplifies measurement noise by roughly $\sqrt{6}/T^2$ in standard deviation against $\sqrt2/T$ for a first difference — the unfiltered version is unusable on a real sensor, and the filtered version loses much of the form's simplicity. And the output accumulator is a bare integrator in fixed point, so a truncation bias of half an LSB per frame drifts exactly as the quantization lesson described. Round, and use a wide accumulator.

Velocity form is common in process control, where actuators are often incremental by nature (a valve stepper, a motor position), and much less common in aerospace, where the parallel form's inspectability usually wins.

## Delta form

At high sample rates every discrete pole crowds towards $z = 1$, and every coefficient becomes a small perturbation on a fixed number. The delta operator removes that by construction. Define

$$
\delta = \frac{z - 1}{T},
$$

so $z = 1 + \delta T$ and, as $T \to 0$, $\delta \to s$. A system written in $\delta$ has coefficients that converge to the *continuous* coefficients rather than to $[1, -2, 1]$.

Substituting $z = 1 + \delta T$ into $z^2 + a_1 z + a_2$ and dividing by $T^2$:

$$
\delta^2 + \frac{2 + a_1}{T}\,\delta + \frac{1 + a_1 + a_2}{T^2}.
$$

The two delta coefficients are the combinations $(2 + a_1)/T$ and $(1 + a_1 + a_2)/T^2$. For a pole pair at $(\zeta, \omega_n)$ these approach $2\zeta\omega_n$ and $\omega_n^2$, which are numbers of ordinary size, independent of the sample rate.

In code, the delta form is the recursion written as an accumulation of increments rather than as a weighted sum of past outputs:

$$
x_1[n+1] = x_1[n] + T\,x_2[n],
\qquad
x_2[n+1] = x_2[n] + T\big(\cdots\big),
$$

which is why "write the integrator as state plus $T$ times rate" is good practice rather than merely conventional. The stored numbers are states with physical units and the coefficients are continuous-sized, so neither the coefficients nor the state arithmetic consumes precision as $T$ shrinks.

::: key
**Delta form (and when you need it).** At very high sample rates, direct-form coefficients cluster near $z = 1$ and lose precision. The delta operator $(z-1)/T$ keeps coefficients well scaled and is the standard remedy in fixed point.
:::

::: example The same notch, in $z$ and in $\delta$
Take the $\omega_m = 18\,\mathrm{rad/s}$, $\zeta_d = 0.3$ notch used throughout this module, discretized with prewarped Tustin. Its denominator in $z$, and the two delta combinations:

| $f_s$ | $a_1$ | $a_2$ | $(2+a_1)/T$ | $(1+a_1+a_2)/T^2$ |
| --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $-1.939607$ | $0.947489$ | $12.079$ | $315.28$ |
| $2\,\mathrm{kHz}$ | $-1.994534$ | $0.994615$ | $10.932$ | $323.13$ |

The delta coefficients are converging to the continuous ones, $2\zeta_d\omega_m = 10.8$ and $\omega_m^2 = 324$, and both are numbers of ordinary size at either rate. The $z$-domain coefficients are converging to $-2$ and $+1$.

Now perturb $a_2$ by one step of a $\mathrm{Q}15$ word, $3.052\times10^{-5}$, and watch what happens to $\omega_m^2$, which is $(1 + a_1 + a_2)/T^2$:

| $f_s$ | $1 + a_1 + a_2$ | One $\mathrm{Q}15$ step, as a fraction of it | $\omega_m^2$ before and after |
| --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $7.882\times10^{-3}$ | $0.39\%$ | $315.28 \to 316.50$ |
| $2\,\mathrm{kHz}$ | $8.078\times10^{-5}$ | $37.8\%$ | $323.13 \to 445.20$ |

At $2\,\mathrm{kHz}$ a single least significant bit in $a_2$ moves the notch's squared natural frequency by $38\%$ — the notch centre by $17\%$ — because the quantity that carries the notch frequency is the fifth significant digit of a difference of two numbers near 1 and 2. At $200\,\mathrm{Hz}$ the same bit moves it by under half a percent.

The delta form escapes this because it stores $323.13$ as a coefficient in its own right. A $\mathrm{Q}15$-style word scaled for a coefficient of size $512$ resolves $512 \times 2^{-15} = 0.0156$, which is $0.005\%$ of $323$: four orders of magnitude better than the direct form at the same word length and the same sample rate.

Note also where the threshold sits. The quantity $1 + a_1 + a_2$ is approximately $(\omega_m T)^2$, so it falls as the square of the sample period. Doubling $f_s$ costs two bits of resolution in the notch frequency. That is the rule to carry: **every doubling of the sample rate costs a direct-form section two bits.**
:::

::: warning
The delta form is not a different filter and it is not more accurate in exact arithmetic. Written in infinite precision, the delta form and the direct form produce identical outputs, because $\delta = (z-1)/T$ is an invertible change of variable and nothing else. Its entire benefit is numerical, and it is therefore worth nothing on a loop whose $\omega_n T$ is comfortably large.

The concrete test: compute $1 + a_1 + a_2$ for each section and compare it with the resolution of the word you are storing $a_2$ in. If the ratio is above a few hundred, the direct form is fine and simpler. Below about $30$, move to the delta form or to a slower rate for that element. Between those, look harder.
:::

## Check yourself

::: check
A colleague implements a PID in direct form and reports that the controller "jumps" whenever the gain schedule updates, even though the gains change by less than $1\%$ per frame. Explain the mechanism and give the fix.
:::

::: answer
In direct form the stored state is past *outputs*, $u[n-1]$ and $u[n-2]$, computed with the old coefficients. When the coefficients change, the recursion $u[n] = \sum b_k e[n-k] - \sum a_k u[n-k]$ applies new $a_k$ to a state that encodes the old controller's history. The result is a step in $u$ whose size depends on how large the stored outputs are, not on how small the gain change was. A controller working hard, with $u[n-1]$ near the actuator limit, jumps a great deal; one sitting at zero does not jump at all — which is why the problem often escapes bench testing.

The fix is the parallel form. Its states are the integral and derivative *contributions*, so changing $k_p$ or $k_d$ changes the next output by exactly the amount the gain change implies and nothing more. If direct form must be kept, the state has to be transformed when the coefficients change, which means solving for the $u[n-1]$, $u[n-2]$ that the new controller would have produced — possible, coefficient-dependent, and considerably more code than switching forms.
:::

::: check
Why does the backward-rectangle integrator have $-86.4^\circ$ of phase at $2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop rather than $-90^\circ$, and is that a good thing or a bad thing?
:::

::: answer
The backward rectangle is $k_i T/(1 - z^{-1})$. On the unit circle, $1 - e^{-j\omega T} = 2j\sin(\omega T/2)\,e^{-j\omega T/2}$, so the transfer function is

$$
\frac{k_i T}{2j\sin(\omega T/2)}\,e^{\,j\omega T/2},
$$

whose phase is $-90^\circ + \omega T/2$, that is $-90^\circ + 180^\circ f/f_s$. At $2\,\mathrm{Hz}$ in a $100\,\mathrm{Hz}$ loop that is $-90 + 3.6 = -86.4^\circ$.

It is a good thing, mildly. The half sample of lead partly cancels the half sample the zero-order hold takes, so the integral path is a little less costly than an ideal integrator would be. The effect is small — $3.6^\circ$ on one term of three — and it should not be relied on, but it is the reason backward rectangle rather than forward is the default. Forward rectangle has the same expression with an extra $z^{-1}$, giving $-93.6^\circ$: half a sample of lag added to the half sample the hold already takes, for no benefit.

Trapezoidal integration has exactly $-90^\circ$ at every frequency and a gain error of $(\omega T/2)\cot(\omega T/2)$, here $0.9987$. If you want the discrete integrator to behave exactly like the continuous one in phase, that is the choice.
:::

::: check
A $4\,\mathrm{kHz}$ rate loop has a second-order section whose coefficients are stored in a $16$-bit word as $\mathrm{Q}14$. The section's poles correspond to $\omega_n = 40\,\mathrm{rad/s}$, $\zeta = 0.5$. Decide whether the direct form is acceptable.
:::

::: answer
Apply the test from the warning. $1 + a_1 + a_2 \approx (\omega_n T)^2$ with $T = 2.5\times10^{-4}\,\mathrm{s}$:

$$
(\omega_n T)^2 = (40 \times 2.5\times10^{-4})^2 = (0.01)^2 = 1.0\times10^{-4}.
$$

A $\mathrm{Q}14$ word resolves $2^{-14} = 6.104\times10^{-5}$. The ratio is $1.0\times10^{-4}/6.104\times10^{-5} = 1.64$.

That is catastrophic, not marginal. One least significant bit changes $\omega_n^2$ by $61\%$, and two bits can take $1 + a_1 + a_2$ through zero, putting a pole at $z = 1$ and turning the section into an integrator — the failure seen in the finite-word-length lesson. The direct form is unusable here.

The options are the delta form, which stores $2\zeta\omega_n = 40$ and $\omega_n^2 = 1600$ as coefficients of ordinary size; a wider coefficient word, which needs about $16$ more bits to reach a comfortable ratio; or running this particular section at a lower rate in a multi-rate arrangement, since a $40\,\mathrm{rad/s}$ element has no business being evaluated at $4\,\mathrm{kHz}$.
:::

::: check
In the velocity form, why does setting $u[n-1]$ to the value actually applied provide anti-windup, and what is the equivalent operation in the parallel form?
:::

::: answer
In the velocity form the output accumulator *is* the integrator: $u[n] = u[n-1] + \Delta u[n]$. If the actuator saturated at $u_{\text{sat}}$ and you store $u_{\text{sat}}$ rather than the computed $u[n]$, the accumulator never holds a value the actuator cannot produce. The next frame's increment starts from reality, so the moment the error changes sign the command comes off the limit immediately, with no accumulated excess to unwind.

In the parallel form the equivalent is back-calculation: after saturating, set

$$
I[n] = u_{\text{sat}} - k_p e[n] - D[n],
$$

so that the stored integral is exactly the amount that makes the three terms sum to what the actuator is actually doing. Clamping — refusing to integrate further while saturated and while the error would push further into the limit, as the code above does — is the simpler variant and is usually enough. The classical control module's treatment of anti-windup transfers to the discrete case unchanged; what changes is that here you can see precisely which stored number you are modifying.
:::

::: check
Someone proposes storing the PID in direct form but computing the coefficients on the flight computer at startup from $k_p$, $k_i$, $k_d$ and $T$ in double precision, arguing that this removes the conditioning problem. Does it?
:::

::: answer
It removes one of the two problems and leaves the other.

The coefficients themselves would indeed be accurate, because they are computed from well-scaled inputs in double precision. If they are then *stored* in double precision, the coefficient-quantization argument of the previous lesson does not apply.

What it does not remove is the run-time cancellation. The recursion $u[n] = \sum b_k e[n-k] - \sum a_k u[n-k]$ still forms $b_0 e[n] + b_1 e[n-1] + b_2 e[n-2]$ from three terms of about $2.8\times10^5$ whose sum is of order 1, every frame, with whatever precision the arithmetic has. In double precision that is comfortable; in single precision it is not; and the problem grows as the sample rate rises regardless of how the coefficients were obtained.

It also does nothing about the structural objections, which are the ones that usually decide: no integral state to clamp, no bumpless transfer, and a transient at every gain change. Those are properties of the form, not of the arithmetic.
:::

## Summary

| Form | Update | State | Strengths and weaknesses |
| --- | --- | --- | --- |
| Parallel | $u = k_p e + I + D$, with $I$ and $D$ each recursive | Integral and derivative contributions, in command units | Trivial anti-windup, bumpless transfer and gain scheduling; inspectable; the flight-software default |
| Direct | $u[n] = \sum b_k e[n-k] - \sum a_k u[n-k]$ | Past inputs and outputs | Fewest operations; no integral state to clamp; transient on gain change; conditioning fails at high rates |
| Velocity | $u[n] = u[n-1] + \Delta u[n]$ | Past command and two past errors | Natural anti-windup by storing the applied command; second difference amplifies noise; accumulator needs rounding |
| Delta | States accumulated as $x + T\,(\cdot)$ | Physical states | Coefficients stay continuous-sized; the fixed-point remedy at high rates; identical to direct form in exact arithmetic |

| Item | Statement |
| --- | --- |
| Integral discretizations | All place the pole at $z = 1$; backward rectangle leads by $180^\circ f/f_s$, forward lags by it, trapezoidal is exactly $-90^\circ$ |
| Filtered derivative | $D[n] = aD[n-1] - G(y[n]-y[n-1])$, $a = e^{-NT}$, $G = k_dN(1+a)/2$; on the measurement, not the error |
| Delta operator | $\delta = (z-1)/T$; $\delta^2 + \frac{2+a_1}{T}\delta + \frac{1+a_1+a_2}{T^2}$, coefficients approaching $2\zeta\omega_n$ and $\omega_n^2$ |
| Conditioning test | Compare $1 + a_1 + a_2 \approx (\omega_nT)^2$ with the coefficient word's resolution; every doubling of $f_s$ costs a direct-form section two bits |

The next lesson takes the direct form seriously for the job it is right for: second-order filter sections, how to cascade them, and which of the standard structures to write down when the arithmetic is finite.
