---
id: l06-input-to-state-stability
title: Input-to-state stability
minutes: 17
covers:
  - 'Input-to-state stability'
---

Hold a broom upright on your palm and keep it there while a friend keeps poking it. You cannot make the broom perfectly still — the pokes keep coming. What you *can* promise is something like this: "however it started, it settles down, and it never wobbles more than a certain amount for pokes of a certain size." That promise is what this lesson is about.

The stability results so far all describe a system that is released from some starting point and then left alone. Real vehicles are never left alone. A spacecraft carries a **[[solar-pressure torque|solar-torque]]** all day, a misaligned thruster during every burn, and fuel sloshing through every slew. A launch vehicle flies through wind shear. An aircraft sits in turbulence. The question that matters is not "does the error go to zero?" but "how big does the error get, given how big the disturbance is?"

For a linear system that question has a clean answer: a gain. Read it off a Bode plot, and the state is bounded by that gain times the input. For a nonlinear system the answer is not a single number but a *function*, because doubling the disturbance need not double the error. It might multiply it by $\sqrt[3]{2}$ — or it might destroy stability entirely.

**Input-to-state stability** (ISS) is the idea that makes this precise, and it is the right robustness notion for the rest of this module. The boundary-layer version of sliding-mode control trades exact convergence for a bound set by the disturbance, which is an ISS-style statement. Robust versions of backstepping are assembled from ISS pieces. An estimator feeding a controller is a chain of two systems, and a chain of ISS systems is ISS. This lesson defines ISS, gives the Lyapunov test that establishes it, and computes the gain for two systems you will recognize.

## Why asymptotic stability is not enough

It is tempting to think that if a system settles when left alone, a small steady push will only nudge it a little. For linear systems that is true. For nonlinear systems it is false, and the counterexample fits on one line:

$$
\dot{x} = -x + x u .
$$

Here $u$ is the input. With $u \equiv 0$ ("u is zero for all time") this is $\dot{x} = -x$, which decays exponentially from any start, with time constant $1\,\mathrm{s}$. Now hold the input at $u \equiv 2$. The equation becomes

$$
\dot{x} = -x + 2x = +x ,
$$

and the state **[[grows exponentially|bilinear-picture]]** instead. From $x(0) = 0.1$ it reaches $0.1e^{10} = 2.20\times10^{3}$ in ten seconds, which integration confirms. A bounded input has turned a globally stable system into a runaway one, and making the starting point smaller does not help — it only delays the blow-up.

The cause is that the input enters *multiplied by the state*. A coupling like that is called **bilinear**: linear in $x$ and linear in $u$ separately, but a product of the two. Bilinear couplings are common on vehicles: a torque error proportional to the commanded torque, an aerodynamic coefficient error that scales with dynamic pressure, a scale-factor error on a gyro. Knowing the system is stable with zero input tells you nothing about them.

::: key
Zero-input global asymptotic stability does not imply bounded response to bounded inputs, for nonlinear systems. $\dot{x} = -x + xu$ is globally exponentially stable with $u = 0$ and diverges for the constant input $u = 2$. A separate property — input-to-state stability — has to be established.
:::

## Comparison functions

The definition needs a precise way to say "small" and "fading away" without committing to a particular formula. Two families of functions do that job. They are called **comparison functions**.

A continuous function $\alpha : [0,\infty) \to [0,\infty)$ ("alpha, from non-negative numbers to non-negative numbers") is **class $\mathcal{K}$** if $\alpha(0) = 0$ and it is strictly increasing. Think of it as "a way of measuring size": zero means zero, and bigger in means bigger out. It is **class $\mathcal{K}_\infty$** ("K infinity") if in addition $\alpha(r) \to \infty$ as $r \to \infty$ — it grows without limit.

Examples: $\alpha(r) = 3r$ and $\alpha(r) = r^{1/3}$ are both class $\mathcal{K}_\infty$. The function $\alpha(r) = \tanh r$ is class $\mathcal{K}$ but **[[not $\mathcal{K}_\infty$|class-k-picture]]**, because it levels off at $1$.

A continuous function $\beta : [0,\infty)\times[0,\infty) \to [0,\infty)$ ("beta of r and t") is **class $\mathcal{KL}$** if two things hold. For each fixed time $t$, $\beta(\cdot, t)$ is class $\mathcal{K}$ in $r$: a bigger start gives a bigger bound. For each fixed $r$, $\beta(r, t)$ decreases to zero as $t \to \infty$: the bound fades with time. The standard example is $\beta(r,t) = Mre^{-\sigma t}$ ("M r e to the minus sigma t"), which is what exponential stability gives.

## The definition

::: key Input-to-state stability
The system $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ is **input-to-state stable** if there exist a class $\mathcal{KL}$ function $\beta$ and a class $\mathcal{K}$ function $\gamma$ such that for every initial state and every bounded input,

$$
\lVert\mathbf{x}(t)\rVert \ \le\ \beta\!\left(\lVert\mathbf{x}(0)\rVert,\, t\right) \ +\ \gamma\!\left(\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert\right)
\qquad \text{for all } t \ge 0 .
$$

$\gamma$ ("gamma") is the **ISS gain**. Setting $\mathbf{u} \equiv 0$ recovers global asymptotic stability; letting $t \to \infty$ gives the **asymptotic gain** $\limsup\lVert\mathbf{x}\rVert \le \gamma(\limsup\lVert\mathbf{u}\rVert)$. ISS is the right notion of robustness for nonlinear systems with disturbances.
:::

Read the two terms on the right one at a time.

- The first term, $\beta$, is the memory of where you started. It fades, and after the transient it contributes nothing.
- The second term, $\gamma$, is the price of the disturbance. It is measured by the **[[supremum|sup-word]]** $\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert$ — the largest size the input has reached so far — not by its size right now. A nonlinear system can be kicked far out by a brief pulse and take a while to come back, so the bound has to remember the pulse.

The $\limsup$ in the asymptotic gain, read "lim sup", is the **[[eventual worst value|limsup-word]]**: the largest size something keeps returning to as time goes on, ignoring the early transient.

Three consequences follow at once, and they are the reasons ISS is used.

- **Bounded input, bounded state.** No input of bounded size can make the state escape.
- **Fading input, fading state.** If $\mathbf{u}(t) \to \mathbf{0}$ then $\mathbf{x}(t) \to \mathbf{0}$. This is what makes chains of systems work: an estimator whose error fades, driving an ISS controller, gives a closed loop whose state fades.
- **A number you can budget.** $\gamma$ turns a disturbance budget into a performance budget, with no linearization anywhere.

For a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ with $\mathbf{A}$ Hurwitz, ISS comes free and the gain is a straight line. If $\lVert e^{\mathbf{A}t}\rVert \le Me^{-\sigma t}$, then bounding the convolution $\int_0^t e^{\mathbf{A}(t-s)}\mathbf{B}\mathbf{u}(s)\,ds$ gives

$$
\lVert\mathbf{x}(t)\rVert \le Me^{-\sigma t}\lVert\mathbf{x}(0)\rVert + \frac{M\lVert\mathbf{B}\rVert}{\sigma}\sup\lVert\mathbf{u}\rVert .
$$

So for linear systems, asymptotic stability and ISS are the same property, and $\gamma$ is a number. Everything interesting about ISS happens because nonlinear systems pull the two apart.

::: note Why the linear bound has to be true
Solve the linear system with the variation-of-constants formula: $\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_0^t e^{\mathbf{A}(t-s)}\mathbf{B}\mathbf{u}(s)\,ds$. The first term is at most $Me^{-\sigma t}\lVert\mathbf{x}(0)\rVert$. In the integral, replace $\lVert\mathbf{u}(s)\rVert$ by its largest value so far, pull it out, and bound what is left:

$$
\int_0^t Me^{-\sigma(t-s)}\lVert\mathbf{B}\rVert\,ds = \frac{M\lVert\mathbf{B}\rVert}{\sigma}\left(1 - e^{-\sigma t}\right) \le \frac{M\lVert\mathbf{B}\rVert}{\sigma} .
$$

Add the two pieces and you have the bound.
:::

## The Lyapunov test

Checking the definition directly would mean solving the system for every possible input — impractical. The usable version is a Lyapunov function that is *allowed* to increase, but only while the state is small compared with the input.

::: key ISS-Lyapunov function
Suppose $V$ is continuously differentiable and radially unbounded with $\alpha_1(\lVert\mathbf{x}\rVert) \le V(\mathbf{x}) \le \alpha_2(\lVert\mathbf{x}\rVert)$ for class $\mathcal{K}_\infty$ functions $\alpha_1, \alpha_2$, and suppose there are a class $\mathcal{K}_\infty$ function $\alpha_3$ and a class $\mathcal{K}$ function $\rho$ with

$$
\lVert\mathbf{x}\rVert \ \ge\ \rho\!\left(\lVert\mathbf{u}\rVert\right)
\quad\Longrightarrow\quad
\dot{V} \ \le\ -\alpha_3\!\left(\lVert\mathbf{x}\rVert\right).
$$

Then the system is ISS, with gain $\gamma = \alpha_1^{-1}\circ\alpha_2\circ\rho$.
:::

Read $\alpha_1^{-1}\circ\alpha_2\circ\rho$ as "**[[$\alpha_1$-inverse after $\alpha_2$ after $\rho$|composition-word]]**": apply $\rho$ first, then $\alpha_2$, then undo $\alpha_1$.

The picture is a **[[shell|shell-picture]]**. Draw a ball of radius $\rho(\lVert\mathbf{u}\rVert)$ ("rho") around the origin. Outside it, $V$ strictly falls, so the state is pushed inward. Inside it, anything goes — the input may push the state around. But the state cannot get far out, because the smallest contour of $V$ that encloses the ball is never crossed outward. The composition $\alpha_1^{-1}\circ\alpha_2$ is the price of translating from $\lVert\mathbf{x}\rVert$ to $V$ and back again. It is why a certified gain is usually larger than what the system really does.

::: example A cube-law gain
Take $\dot{x} = -x^3 + u$. That is the slow, not-exponentially-stable system from the linearization lesson, now with a disturbance.

**Step 1: differentiate.** Use $V = \tfrac{1}{2}x^2$. Write $\lVert u\rVert_\infty$ for the largest size the input ever reaches. Then

$$
\dot{V} = x\left(-x^3 + u\right) = -x^4 + xu \le -x^4 + |x|\,\lVert u\rVert_\infty .
$$

**Step 2: split the good term.** Pick a fraction $\theta$ ("theta") between $0$ and $1$ and split $-x^4$ into two pieces:

$$
\dot{V} \le -(1-\theta)x^4 - \theta x^4 + |x|\lVert u\rVert_\infty .
$$

The first piece is the $-\alpha_3$ we want to keep. The last two together are $|x|\left(\lVert u\rVert_\infty - \theta|x|^3\right)$, which is zero or negative whenever $\theta|x|^3 \ge \lVert u\rVert_\infty$, that is, whenever

$$
|x| \ \ge\ \rho(\lVert u\rVert_\infty) = \left(\frac{\lVert u\rVert_\infty}{\theta}\right)^{1/3} .
$$

**Step 3: read off the gain.** Here $\alpha_1 = \alpha_2 = \tfrac{1}{2}r^2$, so $\alpha_1^{-1}\circ\alpha_2$ does nothing and the ISS gain is $\gamma(r) = (r/\theta)^{1/3}$. Letting $\theta \to 1$ gives the tightest form of this estimate, $\gamma(r) = r^{1/3}$.

**Step 4: check against the truth.** Under a constant $u = d$, the equilibrium is where $-x^3 + d = 0$, so $x = d^{1/3}$. Integrating from $x(0) = 5$ for $600\,\mathrm{s}$ at $\Delta t = 10\,\mathrm{ms}$:

| $d$ | $d^{1/3}$ | $x(600\,\mathrm{s})$ |
| --- | --- | --- |
| $0.001$ | $0.100000$ | $0.100000$ |
| $0.008$ | $0.200000$ | $0.200000$ |
| $0.027$ | $0.300000$ | $0.300000$ |
| $0.125$ | $0.500000$ | $0.500000$ |

**What it means.** The gain is truly nonlinear, and the consequence is uncomfortable. Multiplying the disturbance by $125$ multiplies the steady error by only $5$, which sounds forgiving. But read it the other way: cutting the error by ten requires cutting the disturbance by a thousand.

**Sanity check with a changing input.** A switching disturbance of the same size, $u = 0.008\,\mathrm{sign}(\sin 0.05t)$, stays well inside the bound. From $100\,\mathrm{s}$ on, once the start-up transient has faded, the state never exceeds $0.195$ in size, and at $600\,\mathrm{s}$ it is $-0.107$. The bound, $0.2$, is set by the supremum $0.008$, as the definition says.
:::

::: example Rate damping with a disturbance torque, and the pointing error it leaves
A spacecraft with $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$ under rate feedback $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$, $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$, carries a disturbance torque $\mathbf{d}$:

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) - \mathbf{P}\boldsymbol{\omega} + \mathbf{d} .
$$

**Step 1: the Lyapunov test.** With $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the gyroscopic term drops out as always, and

$$
\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} + \boldsymbol{\omega}^\mathsf{T}\mathbf{d}
\ \le\ -\lambda_{\min}(\mathbf{P})\lVert\boldsymbol{\omega}\rVert^2 + \lVert\boldsymbol{\omega}\rVert\lVert\mathbf{d}\rVert .
$$

Splitting with $\theta$ exactly as before, $\dot{V}$ is negative definite whenever $\lVert\boldsymbol{\omega}\rVert \ge \lVert\mathbf{d}\rVert/(\theta\lambda_{\min}(\mathbf{P}))$, and letting $\theta \to 1$ gives $\rho(r) = r/\lambda_{\min}(\mathbf{P})$.

**Step 2: the conversion factor.** Here $\alpha_1(r) = \tfrac{1}{2}\lambda_{\min}(\mathbf{J})r^2$ and $\alpha_2(r) = \tfrac{1}{2}\lambda_{\max}(\mathbf{J})r^2$. So $\alpha_1^{-1}\circ\alpha_2$ multiplies by $\sqrt{\lambda_{\max}(\mathbf{J})/\lambda_{\min}(\mathbf{J})} = \sqrt{120/80} = 1.225$, and the certified gain is

$$
\gamma(r) = 1.225\,\frac{r}{80} .
$$

**Step 3: numbers.** Take $\mathbf{d} = (0.05, -0.03, 0.02)\,\mathrm{N\,m}$, a plausible **[[thrust-misalignment torque|misalignment]]**. Its size is $\lVert\mathbf{d}\rVert = \sqrt{0.0025 + 0.0009 + 0.0004} = 0.06164\,\mathrm{N\,m}$. The bound before the conversion factor is $\lVert\mathbf{d}\rVert/80 = 7.7055\times10^{-4}\,\mathrm{rad/s}$. Integrating from $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$:

| $t$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) |
| --- | --- |
| $0$ | $3.9051\times10^{-1}$ |
| $5\,\mathrm{s}$ | $1.2026\times10^{-2}$ |
| $10\,\mathrm{s}$ | $1.1257\times10^{-3}$ |
| $60\,\mathrm{s}$ | $7.7055\times10^{-4}$ |

The rate settles on a constant vector within $10^{-7}\,\mathrm{rad/s}$ of $\mathbf{P}^{-1}\mathbf{d} = \mathbf{d}/80$ (the tiny gyroscopic term makes up the difference), with norm $7.7055\times10^{-4}\,\mathrm{rad/s}$ — right at the bound before conversion, and inside the certified $1.225$ times that. Replace the constant torque with $\mathbf{d}\sin(0.1t)$ and the measured $\sup\lVert\boldsymbol{\omega}\rVert$ after the transient is $7.6303\times10^{-4}$, inside the same bound. The bound responds to the largest input, not the current one.

**Step 4: what the torque does to pointing.** Now close the attitude loop with $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, $K = 20\,\mathrm{N\,m}$. At equilibrium $\boldsymbol{\omega} = \mathbf{0}$, so the torques must balance: $-K\mathbf{q}_v + \mathbf{d} = \mathbf{0}$. That gives

$$
\mathbf{q}_v = \frac{\mathbf{d}}{K},
\qquad
\Phi = 2\arcsin\frac{\lVert\mathbf{d}\rVert}{K} \approx \frac{2\lVert\mathbf{d}\rVert}{K} ,
$$

using $\lVert\mathbf{q}_v\rVert = \sin(\Phi/2)$. For these numbers $\lVert\mathbf{q}_v\rVert = 0.06164/20 = 3.0822\times10^{-3}$ and $\Phi = 0.3532^\circ$. Simulating the full nonlinear closed loop from zero error for $300\,\mathrm{s}$ gives $\mathbf{q}_v = (0.0025, -0.0015, 0.0010)$ exactly, $\lVert\boldsymbol{\omega}\rVert$ below $10^{-13}\,\mathrm{rad/s}$, and $\Phi = 0.353195^\circ$.

**What it means.** That is the design equation for the spring gain against a disturbance budget, and the offset scales as $1/K$: raising $K$ to $200\,\mathrm{N\,m}$ cuts it to $0.0353^\circ$. It also says plainly what proportional feedback cannot do — the offset never reaches zero. That is the argument for adding **[[integral action or a disturbance observer|integral-action]]** when the pointing requirement is tighter than $2\lVert\mathbf{d}\rVert/K$.
:::

::: warning
The ISS gain is a bound, not a prediction. The rate-loop certificate above carries the factor $\sqrt{\lambda_{\max}(\mathbf{J})/\lambda_{\min}(\mathbf{J})} = 1.225$ that the real response does not show, because the conversion between $V$ and $\lVert\boldsymbol{\omega}\rVert$ goes through the worst axis twice. Expect a certified gain to overstate the measured one, and do not tune to the certificate.
:::

::: note ISS snaps together
ISS composes, which is what makes it worth the formality. If $\dot{\mathbf{x}}_1 = \mathbf{f}_1(\mathbf{x}_1, \mathbf{x}_2)$ is ISS with gain $\gamma_1$ with respect to $\mathbf{x}_2$, and $\dot{\mathbf{x}}_2 = \mathbf{f}_2(\mathbf{x}_2)$ is globally asymptotically stable, then the chain is globally asymptotically stable — the classic use being an observer driving a controller. For a feedback loop of two ISS systems the condition is the **[[small-gain theorem|small-gain]]** in its nonlinear form, $\gamma_1(\gamma_2(r)) < r$ for all $r > 0$. When both gains are straight lines this reduces to the familiar $\gamma_1\gamma_2 < 1$.
:::

## Check yourself

::: check
Is $\dot{x} = -x + u$ ISS? Find the gain from a Lyapunov argument and check it against the steady state.
:::

::: answer
Take $V = \tfrac{1}{2}x^2$, so $\dot{V} = -x^2 + xu \le -x^2 + |x|\lVert u\rVert_\infty$. Split with $\theta$: this is at most $-(1-\theta)x^2$ whenever $|x| \ge \lVert u\rVert_\infty/\theta$. So $\rho(r) = r/\theta$. Since $\alpha_1 = \alpha_2$ here, $\gamma(r) = r/\theta$, which approaches $\gamma(r) = r$ as $\theta \to 1$.

Check: under a constant $u = d$ the steady state is where $-x + d = 0$, so $x = d$. The true gain is exactly $1$, and the estimate is tight. This is the linear case, where ISS and asymptotic stability coincide.
:::

::: check
A gyro has a scale-factor error, so the rate used by the controller is $(1 + \epsilon)\boldsymbol{\omega}$ instead of $\boldsymbol{\omega}$. Which of the two failure modes in this lesson does that resemble, and what does that imply about treating $\epsilon$ as a disturbance?
:::

::: answer
It resembles the bilinear counterexample $\dot{x} = -x + xu$, because the error enters multiplied by the state instead of added to it: the damping term becomes $-\mathbf{P}(1+\epsilon)\boldsymbol{\omega}$. Treating $\epsilon$ as an added disturbance and quoting an ISS gain would be wrong in kind, not only in size.

The correct treatment is as a **parametric uncertainty** — an uncertain number inside the model. Here it is a harmless one as long as $\epsilon > -1$: the damping term stays negative definite and the Lyapunov proof goes through unchanged. If $\epsilon < -1$ the damping flips sign and the loop is destabilized outright. Multiplicative errors deserve a parametric analysis, not a disturbance budget.
:::

::: check
The pointing offset under a constant torque is $\Phi \approx 2\lVert\mathbf{d}\rVert/K$. A mission needs $0.05^\circ$ against $\lVert\mathbf{d}\rVert = 0.0616\,\mathrm{N\,m}$. What $K$ does that require, and what is the objection?
:::

::: answer
Convert the requirement to radians: $0.05^\circ = 8.727\times10^{-4}\,\mathrm{rad}$. Then

$$
K = \frac{2\lVert\mathbf{d}\rVert}{\Phi} = \frac{2(0.0616)}{8.727\times10^{-4}} = 141\,\mathrm{N\,m} .
$$

The objection is torque. The spring term alone is $K\lVert\mathbf{q}_v\rVert$. At a $30^\circ$ error, $\lVert\mathbf{q}_v\rVert = \sin 15^\circ = 0.259$, so the command is $141 \times 0.259 = 36.5\,\mathrm{N\,m}$ — far beyond a reaction wheel, which typically delivers well under one newton-meter. It would also raise the closed-loop bandwidth toward the structural modes. The practical answer is integral action or a disturbance estimator, which removes a constant torque without raising the spring gain at all, at the cost of a slower mode and a windup problem.
:::

::: check
Why does the ISS definition use $\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert$ instead of $\lVert\mathbf{u}(t)\rVert$?
:::

::: answer
Because the state has memory. A disturbance that is large for one second and then vanishes leaves the state far from the origin. At a later moment $\lVert\mathbf{u}(t)\rVert = 0$, so a bound written on the current input would claim the state is already back at zero — which is false.

Taking the supremum over the history keeps the bound true at every instant while the transient dies away, and that dying away is carried by the $\beta$ term once the input is gone. The version that forgets old disturbances is the asymptotic-gain form, $\limsup_t\lVert\mathbf{x}\rVert \le \gamma(\limsup_t\lVert\mathbf{u}\rVert)$. It follows from the ISS definition, and it is what you quote for steady-state performance.
:::

::: check
For $\dot{x} = -x^3 + u$, how much must the disturbance be reduced to halve the steady-state error?
:::

::: answer
The asymptotic gain is $\gamma(r) = r^{1/3}$, so the error scales as the cube root of the disturbance. Halving the error needs the disturbance divided by $2^3 = 8$. The table agrees: $d = 0.008$ gives $0.200$ and $d = 0.001$ gives $0.100$.

The general lesson: a control law whose restoring push fades faster than linearly near the set point has a poor disturbance gain there. It is the same weakness that made its unforced convergence slow and algebraic instead of exponential.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Class $\mathcal{K}$ | $\alpha(0) = 0$, strictly increasing; $\mathcal{K}_\infty$ adds $\alpha(r)\to\infty$ |
| Class $\mathcal{KL}$ | $\beta(r,t)$: class $\mathcal{K}$ in $r$, fading to zero in $t$; e.g. $Mre^{-\sigma t}$ |
| ISS | $\lVert\mathbf{x}(t)\rVert \le \beta(\lVert\mathbf{x}(0)\rVert, t) + \gamma\!\left(\sup_{s\le t}\lVert\mathbf{u}(s)\rVert\right)$ |
| ISS gain $\gamma$ | Class $\mathcal{K}$; asymptotic gain $\limsup\lVert\mathbf{x}\rVert \le \gamma(\limsup\lVert\mathbf{u}\rVert)$ |
| ISS-Lyapunov | $\lVert\mathbf{x}\rVert \ge \rho(\lVert\mathbf{u}\rVert) \Rightarrow \dot{V} \le -\alpha_3(\lVert\mathbf{x}\rVert)$; then $\gamma = \alpha_1^{-1}\circ\alpha_2\circ\rho$ |
| $\dot{x} = -x + xu$ | Zero-input GES, not ISS: $u \equiv 2$ gives $x(10) = 2.20\times10^3$ from $x(0) = 0.1$ |
| $\dot{x} = -x^3 + u$ | ISS with $\gamma(r) = r^{1/3}$; $d = 0.008 \Rightarrow |x| \to 0.200$ |
| $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{P}\boldsymbol{\omega} + \mathbf{d}$ | ISS; $\lVert\boldsymbol{\omega}\rVert \to \lVert\mathbf{d}\rVert/\lambda_{\min}(\mathbf{P}) = 7.706\times10^{-4}\,\mathrm{rad/s}$ |
| $\mathbf{q}_v = \mathbf{d}/K$, $\Phi \approx 2\lVert\mathbf{d}\rVert/K$ | Steady pointing offset under a constant torque; $0.353^\circ$ at $K = 20\,\mathrm{N\,m}$ |
| Linear systems | Hurwitz $\iff$ ISS, with linear gain $M\lVert\mathbf{B}\rVert/\sigma$ |
| Small gain | Feedback of two ISS systems is stable if $\gamma_1(\gamma_2(r)) < r$ for all $r > 0$ |

Everything so far has been analysis: given a closed loop, decide whether it is stable and how far. The rest of the module is design. The next lesson takes the most direct design idea available — cancel the nonlinearity with feedback so that what remains is linear — and shows both how well it works and the specific way it fails.

::: context solar-torque How big a solar-pressure torque is
Sunlight carries momentum. Near Earth it presses on a surface that absorbs it with about $4.6\times10^{-6}\,\mathrm{N/m^2}$ — about the weight of half a milligram spread over a square meter. That push acts at the center of the sunlit area, which is rarely exactly at the center of mass, so it makes a torque. For a typical satellite it is somewhere around $10^{-6}$ to $10^{-4}\,\mathrm{N\,m}$: tiny, but it never stops, so the attitude controller must hold against it all the time.
:::

::: context bilinear-picture Same system, one steady input apart
Both curves start at $x = 0.5$ and are drawn for $1.5\,\mathrm{s}$ on the same scale. Blue: $u = 0$, so $\dot{x} = -x$ and the state falls to $0.5e^{-1.5} = 0.11$. Red: $u = 2$, so $\dot{x} = +x$ and the state climbs to $0.5e^{1.5} = 2.24$, and keeps going. The only difference is a constant input of size $2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="340" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="15" x2="40" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="36" y1="110" x2="40" y2="110"/><line x1="36" y1="40" x2="40" y2="40"/><line x1="135" y1="180" x2="135" y2="184"/><line x1="230" y1="180" x2="230" y2="184"/><line x1="325" y1="180" x2="325" y2="184"/></g>
  <path d="M40.0,145.0 L49.5,146.7 L59.0,148.3 L68.5,149.9 L78.0,151.3 L87.5,152.7 L97.0,154.1 L106.5,155.3 L116.0,156.5 L125.5,157.7 L135.0,158.8 L144.5,159.8 L154.0,160.8 L163.5,161.7 L173.0,162.6 L182.5,163.5 L192.0,164.3 L201.5,165.0 L211.0,165.8 L220.5,166.5 L230.0,167.1 L239.5,167.8 L249.0,168.3 L258.5,168.9 L268.0,169.5 L277.5,170.0 L287.0,170.5 L296.5,170.9 L306.0,171.4 L315.5,171.8 L325.0,172.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40.0,145.0 L49.5,143.2 L59.0,141.3 L68.5,139.3 L78.0,137.3 L87.5,135.1 L97.0,132.8 L106.5,130.3 L116.0,127.8 L125.5,125.1 L135.0,122.3 L144.5,119.3 L154.0,116.2 L163.5,113.0 L173.0,109.5 L182.5,105.9 L192.0,102.1 L201.5,98.1 L211.0,93.9 L220.5,89.5 L230.0,84.9 L239.5,80.0 L249.0,74.9 L258.5,69.5 L268.0,63.8 L277.5,57.8 L287.0,51.6 L296.5,45.0 L306.0,38.1 L315.5,30.8 L325.0,23.1" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="32" y="114" text-anchor="end">1</text><text x="32" y="44" text-anchor="end">2</text><text x="32" y="184" text-anchor="end">0</text>
    <text x="135" y="196" text-anchor="middle">0.5 s</text><text x="230" y="196" text-anchor="middle">1 s</text><text x="325" y="196" text-anchor="middle">1.5 s</text>
    <text x="240" y="160" fill="#1d6fd1">u = 0: decays</text>
    <text x="150" y="60" fill="#b4232c">u = 2: runs away</text>
    <text x="48" y="24">x</text>
  </g>
</svg>
```
:::

::: context class-k-picture Three class K functions
All three start at zero and only ever go up, so all are class $\mathcal{K}$. The line $r$ (grey) and the cube root $r^{1/3}$ (blue) keep growing forever, so they are class $\mathcal{K}_\infty$. The curve $\tanh r$ (red) flattens toward the dashed line at height $1$ and never passes it, so it is class $\mathcal{K}$ only. Notice how steeply $r^{1/3}$ rises near zero: a tiny input already gives a noticeable output, which is the cube-law gain's weakness.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="15" x2="40" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="110" x2="340" y2="110" stroke="#b4232c" stroke-width="1" stroke-dasharray="5 4"/>
  <path d="M40.0,180.0 L47.5,173.0 L55.0,166.0 L62.5,159.0 L70.0,152.0 L77.5,145.0 L85.0,138.0 L92.5,131.0 L100.0,124.0 L107.5,117.0 L115.0,110.0 L122.5,103.0 L130.0,96.0 L137.5,89.0 L145.0,82.0 L152.5,75.0 L160.0,68.0 L167.5,61.0 L175.0,54.0 L182.5,47.0 L190.0,40.0 L197.5,33.0 L205.0,26.0" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <path d="M40.0,180.0 L40.8,164.9 L41.5,161.0 L42.2,158.2 L43.0,156.1 L43.8,154.2 L44.5,152.6 L45.2,151.2 L46.0,149.8 L46.8,148.6 L47.5,147.5 L49.0,145.5 L56.5,137.8 L63.9,132.2 L71.4,127.6 L78.8,123.8 L86.3,120.4 L93.8,117.3 L101.2,114.6 L108.7,112.0 L116.2,109.6 L123.6,107.4 L131.1,105.3 L138.5,103.3 L146.0,101.4 L153.5,99.6 L160.9,97.9 L168.4,96.3 L175.8,94.7 L183.3,93.1 L190.8,91.7 L198.2,90.2 L205.7,88.8 L213.2,87.5 L220.6,86.2 L228.1,84.9 L235.5,83.7 L243.0,82.4 L250.5,81.3 L257.9,80.1 L265.4,79.0 L272.8,77.9 L280.3,76.8 L287.8,75.7 L295.2,74.7 L302.7,73.7 L310.2,72.7 L317.6,71.7 L325.1,70.8 L332.5,69.8 L340.0,68.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40.0,180.0 L47.5,173.0 L55.0,166.2 L62.5,159.6 L70.0,153.4 L77.5,147.7 L85.0,142.4 L92.5,137.7 L100.0,133.5 L107.5,129.9 L115.0,126.7 L122.5,124.0 L130.0,121.6 L137.5,119.7 L145.0,118.0 L152.5,116.6 L160.0,115.5 L167.5,114.5 L175.0,113.7 L182.5,113.1 L190.0,112.5 L197.5,112.1 L205.0,111.7 L212.5,111.4 L220.0,111.1 L227.5,110.9 L235.0,110.8 L242.5,110.6 L250.0,110.5 L257.5,110.4 L265.0,110.3 L272.5,110.3 L280.0,110.2 L287.5,110.2 L295.0,110.2 L302.5,110.1 L310.0,110.1 L317.5,110.1 L325.0,110.1 L332.5,110.1 L340.0,110.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="32" y="114" text-anchor="end">1</text><text x="32" y="44" text-anchor="end">2</text><text x="32" y="184" text-anchor="end">0</text>
    <text x="115" y="196" text-anchor="middle">1</text><text x="190" y="196" text-anchor="middle">2</text><text x="265" y="196" text-anchor="middle">3</text><text x="340" y="196" text-anchor="middle">4</text>
    <text x="212" y="30" fill="#6c7a93">r</text>
    <text x="300" y="62" fill="#1d6fd1">r^(1/3)</text>
    <text x="290" y="128" fill="#b4232c">tanh r</text>
  </g>
</svg>
```
:::

::: context sup-word The supremum
"Sup" is short for supremum, Latin for "highest". For a list of numbers it is the largest one — or, if there is no single largest, the smallest number that none of them exceeds. For $\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert$, picture a ratchet pointer on a gauge that is pushed up by the needle and never falls back: at time $t$ it shows the biggest input seen so far.
:::

::: context limsup-word Lim sup: the eventual worst
Take a quantity that wiggles as time goes on. Look at its largest value from time $T$ onward, and let $T$ move later and later. That largest value can only shrink as early bumps are left behind. Where it ends up is the $\limsup$. For a signal that settles to a steady ripple between $-0.2$ and $0.2$, the $\limsup$ of its size is $0.2$, no matter how wild the start was.
:::

::: context composition-word Reading the little circle
The symbol $\circ$ means "apply one function, then the next". So $(f\circ g)(r) = f(g(r))$: work from the right. In $\alpha_1^{-1}\circ\alpha_2\circ\rho$, the input size goes through $\rho$ to give a radius, through $\alpha_2$ to give the largest $V$ on that ball, and through $\alpha_1^{-1}$ to give the largest radius that value of $V$ allows. The last step, $\alpha_1^{-1}$, is the inverse of $\alpha_1$: it undoes it.
:::

::: context shell-picture The ball, the contour and the bound
A slice through the rate space of the spacecraft example, $\omega_1$ across ($J = 120$) and $\omega_3$ up ($J = 80$). Outside the red ball of radius $\rho$, $V$ must fall. The blue contour of $V$ is the smallest one that holds the ball; it touches the ball on the $\omega_1$ axis and reaches $\sqrt{120/80} = 1.225$ times further on the $\omega_3$ axis. Since the state can never cross that contour outward, the guaranteed bound is the dashed circle of radius $1.225\rho$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="110" x2="270" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="110" r="73.5" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="180" cy="110" rx="60" ry="73.5" fill="#8fb8f0" fill-opacity="0.3" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="180" cy="110" r="60" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="110" x2="240" y2="110" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="110" x2="180" y2="36.5" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="12">
    <text x="210" y="124" fill="#b4232c" text-anchor="middle">ρ</text>
    <text x="186" y="60" fill="#1d6fd1">1.225ρ</text>
    <text x="274" y="114" fill="#1f2a44">ω₁</text>
    <text x="186" y="16" fill="#1f2a44">ω₃</text>
    <text x="8" y="30" fill="#b4232c">ball: V may rise inside</text>
    <text x="8" y="46" fill="#1d6fd1">contour of V around it</text>
    <text x="8" y="206" fill="#1f2a44">dashed: guaranteed bound</text>
  </g>
</svg>
```
:::

::: context misalignment Where a thrust-misalignment torque comes from
A thruster is meant to push through the vehicle's center of mass, but no build is perfect, and the center of mass moves as propellant is used. A thrust line that misses by a distance $a$ makes a torque equal to thrust times $a$. The $0.0616\,\mathrm{N\,m}$ here is, for example, a $22\,\mathrm{N}$ thruster missing by $2.8\,\mathrm{mm}$. Offsets of a few millimeters are ordinary, which is why the attitude controller is sized to hold against this torque for the whole burn.
:::

::: context integral-action Removing the offset
Integral action adds a term proportional to the running total of the attitude error. While any error remains, that total keeps growing, so the controller keeps pushing harder until the error is gone — and then the integral holds exactly the torque that cancels $\mathbf{d}$. A disturbance observer does the same job by estimating $\mathbf{d}$ from the mismatch between the measured and the predicted motion, and subtracting it. Either way the spring gain $K$ can stay small.
:::

::: context small-gain Where small-gain comes from
George Zames published the small-gain theorem for feedback systems in 1966: if each part of a loop shrinks signals and the product of the shrink factors is below one, the loop is stable. Eduardo Sontag introduced input-to-state stability in 1989, and in 1994 Zhong-Ping Jiang, Andrew Teel and Laurent Praly extended the small-gain idea to ISS gains that are functions, not numbers. It lets engineers prove a whole vehicle stable from bounds on its parts.
:::
