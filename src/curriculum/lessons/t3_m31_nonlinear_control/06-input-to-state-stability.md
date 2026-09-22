---
id: l06-input-to-state-stability
title: Input-to-state stability
minutes: 18
covers:
  - 'Input-to-state stability'
---

The stability results so far all describe an undisturbed system released from an initial condition. Real vehicles are not released and left alone. A spacecraft carries a solar-pressure torque all day, a misaligned thruster during every burn, and fuel slosh through every slew; a launch vehicle flies through wind shear; an aircraft sits in turbulence. The question that matters is not "does the error go to zero" but "how large does the error get, given how large the disturbance is".

For a linear system that question has a clean answer: the gain from input to output, read off a Bode plot or as an induced norm, and the state is bounded by that gain times the input. For a nonlinear system the answer is not a number but a *function*, because doubling the disturbance need not double the error — it might multiply it by $\sqrt[3]{2}$, or it might destroy stability entirely.

**Input-to-state stability** (ISS) is the notion that makes this precise, and it is the right robustness concept for the rest of this module. Sliding-mode controllers are designed to be ISS with respect to unmatched disturbance; backstepping proofs are assembled from ISS pieces; an estimator feeding a controller is a cascade, and the cascade of two ISS systems is ISS. This lesson defines it, gives the Lyapunov test that establishes it, and computes the gain for two systems you will recognise.

## Why asymptotic stability is not enough

It is tempting to assume that a system whose unforced dynamics are globally asymptotically stable will merely be nudged by a small bounded input. For linear systems that is true. For nonlinear systems it is false, and the counterexample is one line:

$$
\dot{x} = -x + x u .
$$

With $u \equiv 0$ this is $\dot{x} = -x$, globally exponentially stable with time constant $1\,\mathrm{s}$. With a constant input $u \equiv 2$ it becomes $\dot{x} = +x$, and from $x(0) = 0.1$ the state reaches $2.20\times10^{3}$ in ten seconds — verified by integration, and exactly $0.1e^{10}$. A bounded input has turned a globally stable system into a divergent one, and no amount of shrinking the initial condition helps.

The mechanism is that the input enters multiplied by the state. Such **bilinear** couplings are common: a torque error proportional to commanded torque, an aerodynamic coefficient perturbation that scales with dynamic pressure, a scale-factor error on a gyro. Zero-input stability tells you nothing about them.

::: key
Zero-input global asymptotic stability does not imply bounded response to bounded inputs, for nonlinear systems. $\dot{x} = -x + xu$ is globally exponentially stable with $u = 0$ and diverges for the constant input $u = 2$. A separate property — input-to-state stability — has to be established.
:::

## Comparison functions

The definition needs two families of functions that make "small" and "decaying" precise without committing to a particular shape.

A continuous function $\alpha : [0,\infty) \to [0,\infty)$ is **class $\mathcal{K}$** if $\alpha(0) = 0$ and it is strictly increasing. It is **class $\mathcal{K}_\infty$** if in addition $\alpha(r) \to \infty$ as $r \to \infty$. Examples: $\alpha(r) = 3r$, $\alpha(r) = r^{1/3}$, $\alpha(r) = \tanh r$ (class $\mathcal{K}$ but not $\mathcal{K}_\infty$, since it saturates at $1$).

A continuous function $\beta : [0,\infty)\times[0,\infty) \to [0,\infty)$ is **class $\mathcal{KL}$** if $\beta(\cdot, t)$ is class $\mathcal{K}$ for each fixed $t$, and $\beta(r, t)$ decreases to zero as $t \to \infty$ for each fixed $r$. The canonical example is $\beta(r,t) = Mre^{-\sigma t}$, which is what exponential stability gives.

## The definition

::: key Input-to-state stability
The system $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ is **input-to-state stable** if there exist a class $\mathcal{KL}$ function $\beta$ and a class $\mathcal{K}$ function $\gamma$ such that for every initial state and every bounded input,

$$
\lVert\mathbf{x}(t)\rVert \ \le\ \beta\!\left(\lVert\mathbf{x}(0)\rVert,\, t\right) \ +\ \gamma\!\left(\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert\right)
\qquad \text{for all } t \ge 0 .
$$

$\gamma$ is the **ISS gain**. Setting $\mathbf{u} \equiv 0$ recovers global asymptotic stability; letting $t \to \infty$ gives the **asymptotic gain** $\limsup\lVert\mathbf{x}\rVert \le \gamma(\limsup\lVert\mathbf{u}\rVert)$.
:::

Read the two terms separately. The first is memory of where you started, and it decays; after a transient it contributes nothing. The second is the price of the disturbance, measured by the *largest* value the input has taken so far — the supremum, not the current value, because a nonlinear system can be kicked far out by a brief pulse and take time to come back.

Three consequences follow immediately and are worth stating, because they are the reasons ISS is used:

- **Bounded input, bounded state.** No input of bounded magnitude can make the state escape.
- **Converging input, converging state.** If $\mathbf{u}(t) \to \mathbf{0}$ then $\mathbf{x}(t) \to \mathbf{0}$. This is what makes cascades work: an estimator whose error decays, driving an ISS controller, gives a closed loop whose state decays.
- **A quantified robustness margin.** $\gamma$ converts a disturbance budget into a performance budget, with no linearisation anywhere.

For a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ with $\mathbf{A}$ Hurwitz, ISS is automatic and the gain is linear: $\lVert\mathbf{x}(t)\rVert \le Me^{-\sigma t}\lVert\mathbf{x}(0)\rVert + \left(M\lVert\mathbf{B}\rVert/\sigma\right)\sup\lVert\mathbf{u}\rVert$, obtained by bounding the convolution $\int_0^t e^{\mathbf{A}(t-s)}\mathbf{B}\mathbf{u}(s)\,ds$. So for linear systems asymptotic stability and ISS are the same property, and $\gamma$ is a number. Everything interesting about ISS happens because nonlinear systems separate the two.

## The Lyapunov test

Checking the definition directly is impractical. The usable version is a Lyapunov function that is allowed to increase while the state is small relative to the input.

::: key ISS-Lyapunov function
Suppose $V$ is continuously differentiable and radially unbounded with $\alpha_1(\lVert\mathbf{x}\rVert) \le V(\mathbf{x}) \le \alpha_2(\lVert\mathbf{x}\rVert)$ for class $\mathcal{K}_\infty$ functions $\alpha_1, \alpha_2$, and suppose there are a class $\mathcal{K}_\infty$ function $\alpha_3$ and a class $\mathcal{K}$ function $\rho$ with

$$
\lVert\mathbf{x}\rVert \ \ge\ \rho\!\left(\lVert\mathbf{u}\rVert\right)
\quad\Longrightarrow\quad
\dot{V} \ \le\ -\alpha_3\!\left(\lVert\mathbf{x}\rVert\right).
$$

Then the system is ISS, with gain $\gamma = \alpha_1^{-1}\circ\alpha_2\circ\rho$.
:::

The picture is a shell. Outside the ball of radius $\rho(\lVert\mathbf{u}\rVert)$, $V$ strictly decreases, so the state is driven inward. Inside, all bets are off, and the state may wander — but it cannot leave, because the level set of $V$ that circumscribes that ball is never crossed outward. The composition $\alpha_1^{-1}\circ\alpha_2$ is the price of translating between $\lVert\mathbf{x}\rVert$ and $V$ twice, and it is why the certified gain is larger than the true asymptotic behaviour.

::: example A cube-law gain
Take $\dot{x} = -x^3 + u$ — the slow, non-exponentially-stable system of the linearisation lesson, now with a disturbance. Use $V = \tfrac{1}{2}x^2$:

$$
\dot{V} = x\left(-x^3 + u\right) = -x^4 + xu \le -x^4 + |x|\,\lVert u\rVert_\infty .
$$

Split the first term with a fraction $\theta \in (0,1)$: $\dot{V} \le -(1-\theta)x^4 - \theta x^4 + |x|\lVert u\rVert_\infty$, and the last two terms are non-positive whenever $\theta|x|^3 \ge \lVert u\rVert_\infty$, that is

$$
|x| \ \ge\ \rho(\lVert u\rVert_\infty) = \left(\frac{\lVert u\rVert_\infty}{\theta}\right)^{1/3} .
$$

Here $\alpha_1 = \alpha_2 = \tfrac{1}{2}r^2$, so $\alpha_1^{-1}\circ\alpha_2$ is the identity and the ISS gain is $\gamma(r) = (r/\theta)^{1/3}$. Letting $\theta \to 1$ gives the tightest form of this estimate, $\gamma(r) = r^{1/3}$.

Check it. The equilibrium under a constant $u = d$ is $x = d^{1/3}$, and integrating from $x(0) = 5$ for $600\,\mathrm{s}$ at $\Delta t = 10\,\mathrm{ms}$:

| $d$ | $d^{1/3}$ | $x(600\,\mathrm{s})$ |
| --- | --- | --- |
| $0.001$ | $0.100000$ | $0.100000$ |
| $0.008$ | $0.200000$ | $0.200000$ |
| $0.027$ | $0.300000$ | $0.300000$ |
| $0.125$ | $0.500000$ | $0.500000$ |

The gain is genuinely nonlinear and the consequence is uncomfortable: multiplying the disturbance by $125$ multiplies the steady error by only $5$, which sounds forgiving, but read it the other way — cutting the error by a factor of ten requires cutting the disturbance by a factor of a thousand. A switching disturbance of the same amplitude stays well inside the bound: with $u = 0.008\,\mathrm{sign}(\sin 0.05t)$ the state at $600\,\mathrm{s}$ is $0.1071$, against a bound of $0.2$ set by the supremum.
:::

::: example Rate damping with a disturbance torque, and the pointing error it leaves
A spacecraft with $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$ under rate feedback $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$, $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$, carries a disturbance torque $\mathbf{d}$:

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) - \mathbf{P}\boldsymbol{\omega} + \mathbf{d} .
$$

With $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the gyroscopic term drops as always and

$$
\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} + \boldsymbol{\omega}^\mathsf{T}\mathbf{d}
\ \le\ -\lambda_{\min}(\mathbf{P})\lVert\boldsymbol{\omega}\rVert^2 + \lVert\boldsymbol{\omega}\rVert\lVert\mathbf{d}\rVert ,
$$

which is negative whenever $\lVert\boldsymbol{\omega}\rVert \ge \lVert\mathbf{d}\rVert/\lambda_{\min}(\mathbf{P})$. Here $\alpha_1(r) = \tfrac{1}{2}\lambda_{\min}(\mathbf{J})r^2$ and $\alpha_2(r) = \tfrac{1}{2}\lambda_{\max}(\mathbf{J})r^2$, so the certified gain carries the factor $\sqrt{\lambda_{\max}(\mathbf{J})/\lambda_{\min}(\mathbf{J})} = \sqrt{120/80} = 1.225$:

$$
\gamma(r) = 1.225\,\frac{r}{80} .
$$

Take $\mathbf{d} = (0.05, -0.03, 0.02)\,\mathrm{N\,m}$, a plausible thrust-misalignment torque, with $\lVert\mathbf{d}\rVert = 0.06164\,\mathrm{N\,m}$. The asymptotic bound before the conversion factor is $\lVert\mathbf{d}\rVert/80 = 7.7055\times10^{-4}\,\mathrm{rad/s}$. Integrating from $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$:

| $t$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) |
| --- | --- |
| $0$ | $3.9051\times10^{-1}$ |
| $5\,\mathrm{s}$ | $1.2026\times10^{-2}$ |
| $10\,\mathrm{s}$ | $1.1257\times10^{-3}$ |
| $60\,\mathrm{s}$ | $7.7055\times10^{-4}$ |

The state settles exactly on $\mathbf{P}^{-1}\mathbf{d}$, whose norm is $7.70552\times10^{-4}$. Replacing the constant torque with $\mathbf{d}\sin(0.1t)$ gives a measured $\sup\lVert\boldsymbol{\omega}\rVert = 7.6303\times10^{-4}$ after the transient, inside the same bound — the supremum in the definition is what the bound responds to, not the instantaneous value.

Now close the attitude loop with $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega} $, $K = 20\,\mathrm{N\,m}$, and ask what the same torque does to *pointing*. At equilibrium $\boldsymbol{\omega} = \mathbf{0}$, so the torque balance is $-K\mathbf{q}_v + \mathbf{d} = \mathbf{0}$ and

$$
\mathbf{q}_v = \frac{\mathbf{d}}{K},
\qquad
\Phi = 2\arcsin\frac{\lVert\mathbf{d}\rVert}{K} \approx \frac{2\lVert\mathbf{d}\rVert}{K} .
$$

For these numbers $\lVert\mathbf{q}_v\rVert = 3.0822\times10^{-3}$ and $\Phi = 0.3532^\circ$. Simulating the full nonlinear closed loop from zero error for $300\,\mathrm{s}$ gives $\mathbf{q}_v = (0.0025, -0.0015, 0.0010)$ exactly, $\lVert\boldsymbol{\omega}\rVert = 7\times10^{-17}\,\mathrm{rad/s}$, and $\Phi = 0.353195^\circ$.

That is the design equation for the proportional gain against a disturbance budget, and it is linear in $1/K$: raising $K$ to $200\,\mathrm{N\,m}$ cuts the offset to $0.0353^\circ$. It also says plainly what proportional feedback cannot do — the offset never reaches zero, which is the argument for adding integral action or a disturbance observer when the pointing requirement is tighter than $2\lVert\mathbf{d}\rVert/K$.
:::

::: warning
The ISS gain is a bound, not a prediction. The rate-loop certificate above carries the factor $\sqrt{\lambda_{\max}(\mathbf{J})/\lambda_{\min}(\mathbf{J})} = 1.225$ that the actual response does not show, because the conversion between $V$ and $\lVert\boldsymbol{\omega}\rVert$ goes through the worst axis twice. Expect a certified gain to overstate the measured one, and do not tune to the certificate.
:::

::: note
ISS composes, which is the property that makes it worth the formalism. If $\dot{\mathbf{x}}_1 = \mathbf{f}_1(\mathbf{x}_1, \mathbf{x}_2)$ is ISS with gain $\gamma_1$ with respect to $\mathbf{x}_2$, and $\dot{\mathbf{x}}_2 = \mathbf{f}_2(\mathbf{x}_2)$ is globally asymptotically stable, the cascade is globally asymptotically stable — the classic use being an observer driving a controller. For a feedback interconnection of two ISS systems the condition is the **small-gain theorem** in its nonlinear form, $\gamma_1(\gamma_2(r)) \lt r$ for all $r \gt 0$, which reduces to the familiar $\gamma_1\gamma_2 \lt 1$ when both gains are linear.
:::

## Check yourself

::: check
Is $\dot{x} = -x + u$ ISS? Find the gain from a Lyapunov argument and check it against the steady state.
:::

::: answer
Take $V = \tfrac{1}{2}x^2$, so $\dot{V} = -x^2 + xu \le -x^2 + |x|\lVert u\rVert_\infty$. Splitting with $\theta$, this is at most $-(1-\theta)x^2$ whenever $|x| \ge \lVert u\rVert_\infty/\theta$, so $\rho(r) = r/\theta$ and, since $\alpha_1 = \alpha_2$ here, $\gamma(r) = r/\theta$, approaching $\gamma(r) = r$ as $\theta \to 1$. The steady state under a constant $u = d$ is $x = d$, so the gain is exactly $1$ and the estimate is tight. This is the linear case, where ISS and asymptotic stability coincide.
:::

::: check
A gyro has a scale-factor error, so the rate used by the controller is $(1 + \epsilon)\boldsymbol{\omega}$ rather than $\boldsymbol{\omega}$. Which of the two failure modes in this lesson does that resemble, and what does that imply about treating $\epsilon$ as a disturbance?
:::

::: answer
It resembles the bilinear counterexample $\dot{x} = -x + xu$, because the error enters multiplied by the state rather than added to it: the damping term becomes $-\mathbf{P}(1+\epsilon)\boldsymbol{\omega}$. Treating $\epsilon$ as an additive disturbance and quoting an ISS gain would be wrong in kind, not merely in size. The correct treatment is as a parametric uncertainty — here a benign one, since any $\epsilon \gt -1$ leaves the damping term negative definite and the Lyapunov proof intact, while $\epsilon \lt -1$ reverses its sign and destabilises the loop outright. Multiplicative errors deserve a parametric analysis, not a disturbance budget.
:::

::: check
The pointing offset under a constant torque is $\Phi \approx 2\lVert\mathbf{d}\rVert/K$. A mission needs $0.05^\circ$ against $\lVert\mathbf{d}\rVert = 0.0616\,\mathrm{N\,m}$. What $K$ does that require, and what is the objection?
:::

::: answer
$\Phi = 0.05^\circ = 8.727\times10^{-4}\,\mathrm{rad}$ requires $K = 2\lVert\mathbf{d}\rVert/\Phi = 2(0.0616)/8.727\times10^{-4} = 141\,\mathrm{N\,m}$. The objection is torque: the proportional term alone reaches $K\lVert\mathbf{q}_v\rVert$, which at a $30^\circ$ error ($\lVert\mathbf{q}_v\rVert = 0.259$) is $36.6\,\mathrm{N\,m}$ — far beyond any reaction wheel, and it would also raise the closed-loop bandwidth into the structural modes. The practical answer is integral action or a disturbance estimator, which removes a constant torque without raising the proportional gain at all, at the cost of a slower mode and a windup problem.
:::

::: check
Why does the ISS definition use $\sup_{0\le s\le t}\lVert\mathbf{u}(s)\rVert$ rather than $\lVert\mathbf{u}(t)\rVert$?
:::

::: answer
Because the state has memory. A disturbance that is large for a second and then vanishes leaves the state far from the origin, and at the later instant $\lVert\mathbf{u}(t)\rVert = 0$ would make a bound written on the current input claim the state is already back at zero. Taking the supremum over the history makes the bound valid at every instant while the transient decays, and the decay itself is carried by the $\beta$ term once the input is gone. The refinement that discounts old disturbances is the "fading memory" or asymptotic-gain form, $\limsup_t\lVert\mathbf{x}\rVert \le \gamma(\limsup_t\lVert\mathbf{u}\rVert)$, which follows from the ISS definition and is what you quote for steady-state performance.
:::

::: check
For $\dot{x} = -x^3 + u$, how much must the disturbance be reduced to halve the steady-state error?
:::

::: answer
The asymptotic gain is $\gamma(r) = r^{1/3}$, so the error scales as the cube root of the disturbance and halving it requires dividing the disturbance by $2^3 = 8$. The table bears this out: $d = 0.008$ gives $0.200$ and $d = 0.001$ gives $0.100$. The general lesson is that a control law whose restoring effort vanishes faster than linearly near the set point has a poor disturbance gain there, which is the same weakness that made its unforced convergence algebraic rather than exponential.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Class $\mathcal{K}$ | $\alpha(0) = 0$, strictly increasing; $\mathcal{K}_\infty$ adds $\alpha(r)\to\infty$ |
| Class $\mathcal{KL}$ | $\beta(r,t)$: class $\mathcal{K}$ in $r$, decaying to zero in $t$; e.g. $Mre^{-\sigma t}$ |
| ISS | $\lVert\mathbf{x}(t)\rVert \le \beta(\lVert\mathbf{x}(0)\rVert, t) + \gamma\!\left(\sup_{s\le t}\lVert\mathbf{u}(s)\rVert\right)$ |
| ISS gain $\gamma$ | Class $\mathcal{K}$; asymptotic gain $\limsup\lVert\mathbf{x}\rVert \le \gamma(\limsup\lVert\mathbf{u}\rVert)$ |
| ISS-Lyapunov | $\lVert\mathbf{x}\rVert \ge \rho(\lVert\mathbf{u}\rVert) \Rightarrow \dot{V} \le -\alpha_3(\lVert\mathbf{x}\rVert)$; then $\gamma = \alpha_1^{-1}\circ\alpha_2\circ\rho$ |
| $\dot{x} = -x + xu$ | Zero-input GES, not ISS: $u \equiv 2$ gives $x(10) = 2.20\times10^3$ from $x(0) = 0.1$ |
| $\dot{x} = -x^3 + u$ | ISS with $\gamma(r) = r^{1/3}$; $d = 0.008 \Rightarrow |x| \to 0.200$ |
| $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{P}\boldsymbol{\omega} + \mathbf{d}$ | ISS; $\lVert\boldsymbol{\omega}\rVert \to \lVert\mathbf{d}\rVert/\lambda_{\min}(\mathbf{P}) = 7.706\times10^{-4}\,\mathrm{rad/s}$ |
| $\mathbf{q}_v = \mathbf{d}/K$, $\Phi \approx 2\lVert\mathbf{d}\rVert/K$ | Steady pointing offset under a constant torque; $0.353^\circ$ at $K = 20\,\mathrm{N\,m}$ |
| Linear systems | Hurwitz $\iff$ ISS, with linear gain $M\lVert\mathbf{B}\rVert/\sigma$ |
| Small gain | Feedback of two ISS systems is stable if $\gamma_1(\gamma_2(r)) \lt r$ for all $r \gt 0$ |

Everything so far has been analysis: given a closed loop, decide whether it is stable and how far. The rest of the module is design. The next lesson takes the most direct design idea available — cancel the nonlinearity with feedback so that what remains is linear — and shows both how well it works and the specific way it fails.
