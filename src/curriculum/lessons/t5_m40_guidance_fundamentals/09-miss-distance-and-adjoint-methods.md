---
id: l09-miss-distance-and-adjoint-methods
title: Miss-distance analysis and the adjoint method
minutes: 24
covers:
  - Miss-distance analysis and adjoint methods
---

Carry a full cup of hot cocoa across a room. Someone bumps your elbow. If the bump comes right as you stand up, you have the whole walk to steady the cup, and nothing spills. If it comes as you set the cup down, it barely matters either — the cup is already on the table before the cocoa can slosh far. The worst bump is somewhere in between: late enough that you cannot fully recover, early enough that the slosh has time to reach the rim.

A guidance loop has exactly this problem. Real flights are full of bumps: a heading error at launch, a target that swerves, an autopilot that responds slowly, a noisy sensor. A designer has to know how much final **miss** each one causes, and whether *when* it happens matters. This is called **miss-distance analysis**.

The obvious way to find out is to simulate the whole flight once for every kind of bump and every moment it could happen. That is a lot of simulations. This lesson teaches the smarter way, the **adjoint method**. It gets the complete answer — the effect of a bump at *every* moment — from one simulation run backward in time.

## A loop worth asking about

First we need a guidance loop where the question has an interesting answer.

The loops so far, PN with no lag and unlimited acceleration, are too perfect. Lesson 5 showed that with no lag, PN shrinks any leftover zero-effort miss as a power of $t_{go}$, so it is gone by $t_{go} = 0$. Any bump, however late, is fully wiped out. True, but not interesting, and not realistic.

Real vehicles cannot produce a commanded acceleration instantly. The **autopilot** — the control loop that turns an acceleration command into fin deflections or engine gimbal angles — takes time. The simplest model of that delay is a **[[first-order lag|first-order-lag]]**: the achieved acceleration chases the commanded one, closing a fixed fraction of the gap each moment. How slow it is gets measured by the **time constant** $\tau_a$ ("tau sub a"). After one time constant, it has closed about $63\%$ of a sudden jump.

Add that one ingredient and the loop becomes rich enough to show real structure. Look sideways again, across the line of sight. The three states are:

- $x_1$: the sideways miss offset — the quantity whose final value is the miss;
- $x_2$: how fast $x_1$ is changing;
- $x_3$: the acceleration the vehicle is *really* achieving, which lags behind the command.

Add a disturbance $w(t)$ — for example, a target swerve — that pushes directly on $x_2$. The equations are

$$
\dot x_1 = x_2, \qquad \dot x_2 = x_3 + w(t), \qquad \dot x_3 = \frac{1}{\tau_a}\left(-\frac{N}{t_{go}^2}x_1 - \frac{N}{t_{go}}x_2 - x_3\right).
$$

Read the last one slowly. Inside the brackets, the first two terms are the PN command, $-N(x_1 + x_2 t_{go})/t_{go}^2$ — the ZEM form from lesson 7. Subtracting $x_3$ gives the gap between commanded and achieved. Dividing by $\tau_a$ says how fast that gap closes.

In matrix form this is

$$
\dot{\mathbf{x}} = \mathbf{F}(t)\,\mathbf{x} + \mathbf{G}\,w, \qquad \mathbf{G} = \begin{pmatrix}0\\1\\0\end{pmatrix},
$$

where $\mathbf{F}(t)$ holds the coefficients. It changes with time, because $t_{go} = t_f - t$ appears inside it, with $t_f$ the final time. That makes this a **linear time-varying** system — linear, because every term is a state times a coefficient.

## The adjoint method

### The idea first

Think of a maze. Suppose you want to know, for every square, whether you can reach the exit from it. You could start at each square in turn and search forward — hundreds of searches. Or you could start *at the exit* once and walk backward, marking every square you pass. One search answers every square.

The adjoint method does the same with time. The forward way asks: "a bump at time $t$ — where does it lead at the end?" That needs one run per $t$. The adjoint way stands at the end and asks: "which earlier moments feed into the final miss, and by how much?" Running once, backward from the end, answers it for every earlier moment at once.

### The rule

Here is the recipe. Make a new vector $\boldsymbol\psi$ ("psi"), with one entry per state. Start it at the final time with a $1$ in the slot for the quantity you care about, the miss $x_1$, and zeros elsewhere: $\boldsymbol\psi(t_f) = \mathbf{c} = (1, 0, 0)^\top$. Then run it *backward* in time with

$$
\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi .
$$

The $\top$ means **transpose**: swap the rows and columns of $\mathbf{F}$. Then read off

$$
h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G},
$$

where $\tau$ is the time to go at which a bump arrives. $h(\tau)$ is the **miss sensitivity**: the final miss caused by a unit sudden bump in $w$ at that moment. A unit bump here is a sudden sideways velocity kick of $1\,\mathrm{m/s}$, so $h$ is in meters of miss per meter-per-second of kick — which works out to seconds.

In practice, you run it forward in $\tau = t_{go}$, from $0$ up to the full flight time. Running forward in time-to-go *is* running backward in clock time.

::: key The adjoint method
$$
\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi, \qquad \boldsymbol\psi(t_f) = \mathbf{c}, \qquad h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}.
$$
Run the linearized guidance loop **backward** from the terminal time. One integration gives the miss-distance sensitivity to every disturbance, at every time-to-go $\tau$, instead of one forward simulation per disturbance. It is the standard technique in Zarchan's work on missile guidance.
:::

::: note Why it has to be true
The **[[state-transition matrix|stm]]** $\boldsymbol\Phi(t_f, t)$ carries any small change in the state at time $t$ forward to its effect at $t_f$. A unit bump in $w$ at time $t$ adds $\mathbf{G}$ to the state, so the final miss it causes is

$$
\text{miss} = \mathbf{c}^\top\boldsymbol\Phi(t_f, t)\,\mathbf{G}.
$$

Define the row $\boldsymbol\psi(t)^\top = \mathbf{c}^\top\boldsymbol\Phi(t_f, t)$. The state-transition matrix obeys $\partial\boldsymbol\Phi(t_f,t)/\partial t = -\boldsymbol\Phi(t_f,t)\,\mathbf{F}(t)$ — moving the start time later removes a sliver of $\mathbf{F}$ from the front of the journey. Differentiate the row:

$$
\dot{\boldsymbol\psi}(t)^\top = \mathbf{c}^\top\frac{\partial\boldsymbol\Phi(t_f,t)}{\partial t} = -\mathbf{c}^\top\boldsymbol\Phi(t_f,t)\,\mathbf{F}(t) = -\boldsymbol\psi(t)^\top\mathbf{F}(t).
$$

Transpose both sides and you get $\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi$. At the end, $\boldsymbol\Phi(t_f, t_f) = \mathbf{I}$ (no time, no change), so $\boldsymbol\psi(t_f) = \mathbf{c}$. That is the whole method: one small differential equation that computes the row $\mathbf{c}^\top\boldsymbol\Phi(t_f, t)$ for every $t$ in a single sweep.
:::

::: example One backward run matches many forward runs
Take $N = 4$, a lag of $\tau_a = 0.5\,\mathrm{s}$, and a $10\,\mathrm{s}$ flight. Run the adjoint once. Then check it the slow way: for several bump times, inject a unit kick and simulate forward to the end.

```python
import numpy as np
from scipy.integrate import solve_ivp

N, ta, tf, eps = 4.0, 0.5, 10.0, 1e-6   # nav constant, lag (s), flight time (s), stop just short of tgo = 0
G = np.array([0.0, 1.0, 0.0])           # the disturbance enters the x2 equation
c = np.array([1.0, 0.0, 0.0])           # we care about x1 at the end

def F(t):
    tgo = tf - t
    return np.array([[0.0, 1.0, 0.0],
                     [0.0, 0.0, 1.0],
                     [-N / (ta * tgo**2), -N / (ta * tgo), -1.0 / ta]])

# Adjoint: ONE run, going backward in time (forward in tau = tgo).
adj = solve_ivp(lambda tau, psi: F(tf - tau).T @ psi, [eps, tf], c,
                method="LSODA", rtol=1e-10, atol=1e-12, dense_output=True)
h = lambda tau: adj.sol(tau) @ G

# Direct: one forward run for EACH injection time.
def direct(tau):
    run = solve_ivp(lambda t, x: F(t) @ x, [tf - tau, tf - eps], G,
                    method="LSODA", rtol=1e-10, atol=1e-12)
    return run.y[0, -1]

for tau in (0.2, 0.5, 1.0, 2.0, 4.0, 7.0):
    print(f"tau = {tau:3.1f} s   direct {direct(tau):+.5f}   adjoint {h(tau):+.5f}")
# tau = 0.2 s   direct +0.08402   adjoint +0.08402
# tau = 0.5 s   direct +0.03066   adjoint +0.03066
# tau = 1.0 s   direct -0.04511   adjoint -0.04511
# tau = 2.0 s   direct -0.01221   adjoint -0.01221
# tau = 4.0 s   direct +0.00492   adjoint +0.00492
# tau = 7.0 s   direct +0.00011   adjoint +0.00011
```

Every value matches to five decimal places. Six forward simulations, each a full run of the closed loop, are all reproduced by the one backward run. (The backward equation goes forward in $\tau$, so the code multiplies by $+\mathbf{F}^\top$ instead of $-\mathbf{F}^\top$: flipping the direction of time flips the sign.)

Sanity check on units and size: a $1\,\mathrm{m/s}$ kick with $0.2\,\mathrm{s}$ left, if nobody corrected it, would drift $0.2\,\mathrm{m}$. The loop cut that to $0.084\,\mathrm{m}$. Less than the uncorrected drift, as it should be.
:::

## Reading the sensitivity curve

The shape of $h(\tau)$ is worth reading, not only checking. Here it is, from the same run:

- **Very late bumps** ($\tau$ near $0$): $h(\tau)$ is close to $\tau$ itself — $h(0.01) = 0.0096$. There is no time for the loop to react, and no time for the kick to grow into much miss either.
- **The worst moment** is around $\tau \approx 0.21\,\mathrm{s}$, where $h$ peaks at about $0.084$. That is less than half of one lag time constant before the end. The loop has started to react, but the lag keeps it from finishing.
- **Over-correction.** $h$ crosses zero at $\tau \approx 0.63\,\mathrm{s}$ and dips to about $-0.048$ near $\tau \approx 1.15\,\mathrm{s}$. Here the loop reacts, but the lag makes it swing too far, like over-steering a car. It crosses back at about $2.36\,\mathrm{s}$.
- **Early bumps** barely matter. Past about $5.4\,\mathrm{s}$ to go, $|h|$ stays below $0.001$. By $\tau = 10\,\mathrm{s}$, it is about $10^{-6}$.

So the damage lives almost entirely in the last few seconds — roughly the last five to ten lag time constants. That is the cocoa cup from the start of the lesson, drawn as a [[curve|h-curve]]. You cannot read that peak off the formula for the gains. It appears only once the lag is in the model and the adjoint run is done.

::: warning A negative sensitivity is not a smaller effect — it is an opposite one
$h(\tau)$ changes sign in this curve. A negative value does not mean "this bump matters less". It means a bump there pushes the final miss the *opposite* way from a bump at a time where $h$ is positive. Two bumps of the same sign, at two times where $h$ has opposite signs, can partly cancel. A miss budget has to get this right, and a table of sizes alone would hide it.
:::

## Any disturbance, still one run

Because the loop is linear, $h(\tau)$ is more than a table of kick responses. A long, smooth push is just a string of tiny kicks, one after another. Each tiny kick, of size $w(t)\,dt$, causes a miss of $h(t_f - t)\,w(t)\,dt$. Add them all up and you get the miss from *any* disturbance history:

$$
x_1(t_f) = \int_0^{t_f} h(t_f - t)\,w(t)\,dt .
$$

Mathematicians call this a **[[convolution|convolution]]**, and they call $h$ the system's **Green's function**. It uses only the adjoint run you already did. No new simulation is needed.

::: example Predicting the miss from a target's swerve
The target swerves with a steady $3\,\mathrm{m/s^2}$ sideways from $t = 6\,\mathrm{s}$ to $t = 9\,\mathrm{s}$ — three seconds of steady push, not a kick. In time-to-go, that is $\tau$ from $4\,\mathrm{s}$ down to $1\,\mathrm{s}$.

**Step 1: set up the integral.** The push $w$ is $3$ inside that window and $0$ outside, so

$$
x_1(t_f) = \int_{1}^{4} h(\tau)\cdot 3\,d\tau = 3\int_{1}^{4} h(\tau)\,d\tau .
$$

**Step 2: evaluate it** from the stored $h(\tau)$, for example with `scipy.integrate.quad`. The result is $x_1(t_f) = -0.0811\,\mathrm{m}$.

**Step 3: check it the slow way.** A full forward simulation carrying the swerve through the closed loop gives $-0.0811\,\mathrm{m}$ as well — the two agree to better than a millionth of a meter.

**Sanity check.** Most of the window, $\tau$ from $1$ to about $2.4\,\mathrm{s}$, sits in the negative lobe of $h$, so a negative miss makes sense. And the answer is small — about $8\,\mathrm{cm}$ — because the swerve ends a full second before intercept, before the worst stretch of the curve.
:::

This is the method's real value. A real miss budget prices a dozen or more sources: initial heading error, several possible swerve start times, seeker noise, wind. Every one of them is answered from the same single adjoint run, instead of a fresh [[forward simulation|monte-carlo]] apiece.

There is a bonus. $\boldsymbol\psi(\tau)$ is a full vector, one entry per state. A disturbance that enters a different equation has a different $\mathbf{G}$, and its sensitivity is simply $\boldsymbol\psi(\tau)^\top\mathbf{G}$ with that new $\mathbf{G}$. The same run serves every entry point.

::: note The random-noise extension
Sensor noise is not one fixed push but a random process. It is described by a **[[power spectral density|psd]]** — how much of its strength sits at each frequency — rather than a fixed history. The same $h(\tau)$ still carries the answer. For white noise of spectral density $\Phi$ entering through $\mathbf{G}$, the mean-square miss is

$$
\overline{x_1(t_f)^2} = \Phi\int_0^{t_f} h(\tau)^2\,d\tau .
$$

Working through this properly belongs to the probability and estimation material this module leans on, so it is not taken further here.
:::

::: warning Linearity is what makes any of this valid
The kick-response identity and the convolution both depend on the loop being linear. Superposition — "the response to two bumps is the sum of the responses to each" — must hold. This loop was linearized the same way earlier lessons treated small heading errors near a collision course. A loop analyzed far from that regime, or one with a truly nonlinear part such as a hard acceleration limit, does not get this shortcut for free. Lesson 12, on actuator limits, is where that boundary starts to matter.
:::

## Check yourself

::: check
State the adjoint differential equation and its terminal condition. In one sentence, say why it is run backward.
:::

::: answer
$\dot{\boldsymbol\psi} = -\mathbf{F}(t)^\top\boldsymbol\psi$, with $\boldsymbol\psi(t_f) = \mathbf{c}$, where $\mathbf{c}$ picks out the state whose final value you care about.

It runs [[backward|adjoint-costate]] because the question — "how does a bump at time $t$ affect the outcome at the fixed later time $t_f$?" — is naturally asked from the end. Fixing the known condition at $t_f$ and sweeping back reaches every earlier $t$ in one pass. Running forward from each candidate bump time would need a separate run for each one.
:::

::: check
Why does adding an autopilot lag produce an interesting sensitivity curve, when the same analysis without a lag wiped out every bump no matter when it came?
:::

::: answer
Without a lag, the commanded acceleration is achieved instantly, and PN's gains grow without limit as $t_{go} \to 0$. That is effectively unlimited power to correct anything, however late.

A lag caps how fast the real acceleration can follow the command. So there really are bump times the loop cannot fully fix in the time left:

- too early, and ordinary correction handles it;
- too close to intercept, and there is not enough flight left for even an uncorrected kick to grow into much miss;
- in between, the lag prevents full correction while there is still time for the leftover to grow — which produces the peak in the example.
:::

::: check
Use the adjoint sensitivities $h(4.0) = 0.004920$ and $h(1.5) = -0.037340$. Predict the total miss from a kick of size $2.0\,\mathrm{m/s}$ at $\tau = 4.0\,\mathrm{s}$ together with a kick of size $-1.5\,\mathrm{m/s}$ at $\tau = 1.5\,\mathrm{s}$.
:::

::: answer
By superposition (linearity), the total miss is each kick's size times its sensitivity, added:

$$
2.0 \times 0.004920 + (-1.5) \times (-0.037340) = 0.009840 + 0.056010 = 0.065850\,\mathrm{m}.
$$

A direct simulation carrying both kicks through the loop together gives $0.06585\,\mathrm{m}$ too. The two contributions add with no interaction term. That is exactly what lets you build a many-source miss budget out of single-source sensitivities.

Notice both contributions came out positive: a negative kick at a time where $h$ is negative adds to the miss, just as a positive kick at a positive-$h$ time does.
:::

::: check
A miss budget lists three disturbance sources with their RMS miss contributions, but not their signs or timing. What is missing, and why does it matter?
:::

::: answer
Without the sign and timing of each source's $h(\tau)$, the budget cannot tell whether the sources add up or partly cancel. Three sources that each look comparable could combine into a much bigger total (if their effective signs line up) or a much smaller one (if they oppose). A table of sizes cannot tell the two apart.

Worse, the sensitivity curve can change sign within one flight, as the example showed. So a single source, hitting at two different moments, can push the miss in opposite directions in two different failure cases. A complete budget has to carry the sensitivity function, not only a size, to combine sources correctly. (Truly independent random sources are the exception: their mean-square contributions do add.)
:::

::: check
Why can the same single adjoint run answer questions about a sudden kick, a steady swerve and, in principle, random noise, without redoing it for each?
:::

::: answer
All three are only different choices of $w(t)$ fed into the same linear loop. And $h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}$ depends only on the loop's own dynamics, $\mathbf{F}(t)$ and $\mathbf{G}$ — not on which disturbance is applied.

A kick reads $h(\tau)$ off directly. A steady or changing push convolves $h$ with $w(t)$. Random noise, described by how its strength is spread over frequency, combines with $h$ through an integral of $h^2$ in the same spirit. The adjoint solution belongs to the guidance loop, not to any one disturbance, which is why computing it once is enough.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Loop with a lag | $\dot x_1=x_2$, $\dot x_2=x_3+w$, $\dot x_3=\big({-}Nx_1/t_{go}^2-Nx_2/t_{go}-x_3\big)/\tau_a$ |
| Adjoint equation | $\dot{\boldsymbol\psi}=-\mathbf{F}(t)^\top\boldsymbol\psi$, $\boldsymbol\psi(t_f)=\mathbf{c}$, run backward |
| Sensitivity | $h(\tau) = \boldsymbol\psi(\tau)^\top\mathbf{G}$: miss per unit kick at time-to-go $\tau$, all $\tau$ from one run |
| Any history | $x_1(t_f) = \int_0^{t_f} h(t_f-t)\,w(t)\,dt$ — a convolution, still one run |
| Why the lag matters | without it, PN wipes out every bump; with it, sensitivity peaks a fraction of a lag before intercept and swings negative just before that |
| Validity | the loop must be linear (or linearized); a hard actuator limit breaks superposition |

Every sensitivity here assumed $t_{go}$ was known exactly, at every instant. The next lesson takes on the question this one kept sidestepping: where $t_{go}$ really comes from, and what happens to a loop like this when the estimate is wrong.

::: context first-order-lag A slow shower knob
Turn a shower from cold to hot. The water does not jump to the new temperature; it creeps toward it, fast at first and then slower. That is a first-order lag. After one time constant it has covered $1 - e^{-1} \approx 63\%$ of the change, after two about $86\%$, after three about $95\%$. An autopilot behaves much the same when asked for a new acceleration.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,140 60,140 60,40 340,40" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="33" font-size="11" fill="#b4232c">command</text>
  <path d="M 60 140 C 90 90, 120 60, 180 48 S 280 41, 340 40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="200" y="80" font-size="11" fill="#1d6fd1">achieved</text>
  <line x1="110" y1="140" x2="110" y2="77" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="40" y1="77" x2="110" y2="77" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="36" y="81" font-size="11" fill="#6c7a93" text-anchor="end">63%</text>
  <text x="110" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">one time constant</text>
</svg>
```

The step jumps at the left; the dashed lines mark where the achieved value reaches $63\%$ of it, one time constant later.
:::

::: context stm A machine that carries changes forward
The state-transition matrix answers one question: if the state is nudged by a small amount now, how much is it nudged later? Multiply the nudge by $\boldsymbol\Phi(t_f, t)$ and you get its effect at $t_f$. For a system whose coefficients do not change with time, it is the matrix exponential from the state-space module. For a time-varying loop like this one, it has no neat formula, but it can always be computed numerically. The adjoint trick needs only one row of it — the row for the miss — which is why it is so cheap.
:::

::: context h-curve The shape of the danger
The sensitivity $h(\tau)$ from the example, with time-to-go across (zero at the left, where intercept happens). It rises from zero, peaks near $0.21\,\mathrm{s}$, swings negative around $1.15\,\mathrm{s}$, and dies away after about $2.5\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="20" x2="50" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,99 51,85 53,72 54,62 56,54 57,47 58,42 60,38 61,35 63,33 64,33 65,33 67,34 68,35 70,37 71,39 72,42 74,45 75,49 77,52 78,56 79,60 81,64 82,68 84,72 85,75 88,85 95,102 102,116 109,127 116,134 123,137 130,139 137,138 144,136 151,132 158,128 164,124 171,120 178,116 185,112 192,109 199,106 206,103 213,101 220,99 226,97 233,96 240,95 247,95 254,94 261,94 268,94 275,94 282,94 289,94 296,94 302,95 309,95 316,95 323,96 330,96"/>
  <text x="44" y="37" font-size="11" fill="#6c7a93" text-anchor="end">0.08</text>
  <text x="44" y="104" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <text x="44" y="142" font-size="11" fill="#6c7a93" text-anchor="end">−0.05</text>
  <text x="72" y="28" font-size="11" fill="#1f2a44">peak, 0.21 s</text>
  <text x="140" y="155" font-size="11" fill="#1f2a44">over-correction</text>
  <text x="50" y="166" font-size="11" fill="#1f2a44">0</text>
  <text x="190" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="330" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">4 s to go</text>
</svg>
```
:::

::: context convolution Adding up a string of tiny kicks
Chop a steady push into thin slices of time. Each slice is a tiny kick, of size $w\,dt$. Each kick causes a miss equal to its size times $h$ at that moment. Linear systems add responses, so the total miss is the sum of all those small pieces, which becomes an integral as the slices get thinner. That sum-of-shifted-responses is what "convolution" means. It is the same operation behind audio echo effects and image blurring: one response pattern, slid along and added up.
:::

::: context monte-carlo How much work the adjoint saves
The brute-force alternative is a Monte Carlo campaign: run the full simulation hundreds or thousands of times with random disturbances and collect statistics on the miss. It handles nonlinear effects, so it is still used to check final designs. But for a linear or linearized loop, the adjoint gives exact answers — for every disturbance source and every timing — from one backward run. Paul Zarchan's guidance textbook made this the standard working tool, and it is why a designer can sweep dozens of design choices in the time one Monte Carlo campaign would take.
:::

::: context psd Power spectral density
Random noise has no single history you can write down, but it has a recipe: how much of its strength is at slow wiggles and how much at fast ones. The power spectral density is that recipe. "White" noise has equal strength at every frequency, like the hiss of an untuned radio. For white noise the miss formula collapses to one number, $\Phi$, times the area under $h^2$. For this example's loop that area is about $0.0039\,\mathrm{s^3}$, so a white-noise source with $\Phi = 1\,\mathrm{m^2/s^3}$ would give a root-mean-square miss of about $\sqrt{0.0039} \approx 0.063\,\mathrm{m}$.
:::

::: context adjoint-costate The adjoint is an old friend
Look at the adjoint equation, $\dot{\boldsymbol\psi} = -\mathbf{F}^\top\boldsymbol\psi$, next to the costate equations from lessons 5 and 7, $\dot{\boldsymbol\lambda} = -\partial H/\partial\mathbf{x}$. For a linear system they are the same equation. Both are backward-running sensitivities: the costate says how the final cost changes with the state, and $\boldsymbol\psi$ says how the final miss changes with the state. The word "adjoint" is the mathematician's name for the transposed partner of a linear operator — for a matrix, it is the transpose.
:::
