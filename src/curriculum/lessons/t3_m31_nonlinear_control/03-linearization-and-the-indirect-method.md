---
id: l03-linearization-and-the-indirect-method
title: Linearization and the Lyapunov indirect method
minutes: 20
covers:
  - 'Linearization and the Lyapunov indirect method, including its failure cases'
---

Look at the Earth from your backyard and it seems flat. For laying out a garden, that is a perfectly good model. For flying across an ocean, it is not. A **linearization** is the same kind of model: zoom in close enough on any smooth system and it looks linear, and close in, the linear model is excellent.

Almost every flight control law ever certified was designed this way. You trim the vehicle, take partial derivatives, get $\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{B}\mathbf{u}$, and from there the whole linear toolbox applies. The theorem that makes this legitimate is **[[Lyapunov's|lyapunov-name]] indirect method**. It is a real theorem with a real proof: if the linearization at an equilibrium is stable in the strict sense, the nonlinear system really is asymptotically stable there.

The trouble is what the theorem does *not* say, and how rarely that is mentioned alongside it. It says nothing about how large a neighborhood the guarantee covers. It says nothing at all when an eigenvalue sits on the imaginary axis. It does not apply when the dynamics are not smooth — which includes every on-off thruster and every sliding-mode law in this module. And a whole family of stable linearizations, one per operating point, does not add up to a stable system.

This lesson states the method precisely, shows why it works, and then works through each failure with numbers, because the failures are where nonlinear control earns its place. One of them answers a question you should be able to answer cold in an interview: give a concrete case where linearization says stable and the system is not stable in any useful sense.

## The method

Let $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$, with $\mathbf{f}$ continuously differentiable (smooth enough to have slopes that change without jumps) and $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$. Put $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$, the offset from the equilibrium, and split $\mathbf{f}$ into its straight-line part and everything else:

$$
\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{g}(\mathbf{z}),
\qquad
\mathbf{A} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\mathbf{x}_e},
\qquad
\frac{\lVert\mathbf{g}(\mathbf{z})\rVert}{\lVert\mathbf{z}\rVert} \to 0 \ \text{ as } \ \lVert\mathbf{z}\rVert \to 0 .
$$

$\mathbf{A}$ is the Jacobian from the last lesson. The **remainder** $\mathbf{g}$ collects everything of second order and higher — the [[gap between the curve and its tangent|tangent-picture]]. The limit on the right is the exact sense in which that remainder is negligible close in: as the offset shrinks, the remainder shrinks *faster*, so its share of the total goes to zero. ($\lVert\mathbf{z}\rVert$, read "norm of z", is the length of the vector.)

A matrix is **[[Hurwitz|hurwitz-word]]** when every one of its eigenvalues has a negative real part — every mode of $\dot{\mathbf{z}} = \mathbf{A}\mathbf{z}$ decays.

::: key Lyapunov's indirect method
Let $\mathbf{A}$ be the Jacobian of $\mathbf{f}$ at an equilibrium. If every eigenvalue of $\mathbf{A}$ has $\operatorname{Re}\lambda < 0$ (Hurwitz), the equilibrium is locally asymptotically stable — in fact locally exponentially stable. If any eigenvalue has $\operatorname{Re}\lambda > 0$, the equilibrium is unstable. If the eigenvalue with the largest real part has $\operatorname{Re}\lambda = 0$ and none is positive, the test is **inconclusive**: the nonlinear terms decide. Eigenvalues on the imaginary axis are inconclusive, and the method never bounds the region of attraction.
:::

Here $\operatorname{Re}\lambda$ means the real part of the eigenvalue $\lambda$ ("lambda").

::: note Why it has to be true
Because $\mathbf{A}$ is Hurwitz, for any symmetric positive definite matrix $\mathbf{Q}$ the **[[Lyapunov equation|lyapunov-equation]]**

$$
\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}
$$

has exactly one solution $\mathbf{P}$, and it is symmetric positive definite. (The state-space module used this equation to compute quadratic cost.) Use $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$ as a measure of distance from the equilibrium — a bowl-shaped function that is zero only at $\mathbf{z} = \mathbf{0}$. Differentiate it along the *nonlinear* trajectory:

$$
\dot{V} = \mathbf{z}^\mathsf{T}(\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z})
= -\mathbf{z}^\mathsf{T}\mathbf{Q}\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z}) .
$$

The first term is at most $-\lambda_{\min}(\mathbf{Q})\lVert\mathbf{z}\rVert^2$, where $\lambda_{\min}(\mathbf{Q})$ is the smallest eigenvalue of $\mathbf{Q}$. The second is at most $2\lVert\mathbf{P}\rVert\lVert\mathbf{z}\rVert\lVert\mathbf{g}(\mathbf{z})\rVert$ in size. Since $\lVert\mathbf{g}\rVert/\lVert\mathbf{z}\rVert \to 0$, there is a radius $r$ inside which $\lVert\mathbf{g}(\mathbf{z})\rVert \le \tfrac{\lambda_{\min}(\mathbf{Q})}{4\lVert\mathbf{P}\rVert}\lVert\mathbf{z}\rVert$. Inside that ball the second term is at most half the first, so

$$
\dot{V} \le -\tfrac{1}{2}\lambda_{\min}(\mathbf{Q})\lVert\mathbf{z}\rVert^2 < 0 .
$$

$V$ keeps shrinking, so the state keeps sliding down the bowl — exactly the condition the next lesson turns into a stability proof. The argument also shows where the guarantee stops: at the radius $r$ where the remainder stops being small next to the linear part. That radius depends on $\mathbf{g}$, and the eigenvalues say nothing about it.
:::

## Failure case one: eigenvalues on the axis

If the Jacobian has an eigenvalue with zero real part, the linear part neither grows nor shrinks in that direction. Then the remainder $\mathbf{g}$, however small, is the only thing left to decide — and the linearization is silent. The cleanest demonstration has one state.

Both $\dot{x} = -x^3$ and $\dot{x} = +x^3$ have slope $f'(0) = 0$ at the origin. So both have the same linearization, $\dot{z} = 0$, which is marginal. Their behaviors could not be more different.

Separate the variables in $\dot{x} = -x^3$: $x^{-3}\,dx = -dt$, so $-\tfrac{1}{2}x^{-2} = -t - \tfrac{1}{2}x_0^{-2}$. Solving for $x$:

$$
x(t) = \frac{x_0}{\sqrt{1 + 2x_0^2 t}} .
$$

This shrinks to zero from every starting point: **globally asymptotically stable**. The other sign gives $x(t) = x_0/\sqrt{1 - 2x_0^2 t}$, which escapes to infinity at $t = 1/(2x_0^2)$. Same linear model, one globally stable and one with finite escape time. And a third system with the same linearization, $\dot{x} = 0$, has every point as an equilibrium.

::: example How slow "asymptotically stable" can be
Take $\dot{x} = -x^3$ with $x_0 = 0.1\,\mathrm{rad}$. Think of an attitude error under a control law whose gain has been shaped to fade out cubically near zero, which is what a smoothed deadband does. The closed form gives

| $t$ | $x$ |
| --- | --- |
| $1\,\mathrm{s}$ | $0.09902$ |
| $10\,\mathrm{s}$ | $0.09129$ |
| $100\,\mathrm{s}$ | $0.05774$ |
| $1000\,\mathrm{s}$ | $0.02182$ |
| $4950\,\mathrm{s}$ | $0.01000$ |

Runge–Kutta with a $10\,\mathrm{ms}$ step reproduces the last row to eleven digits.

**Time to reach a target.** Set $x(t) = x_1$ and solve for $t$: square both sides and rearrange to get $t = \tfrac{1}{2}(x_1^{-2} - x_0^{-2})$. To reach $0.01\,\mathrm{rad}$: $t = \tfrac{1}{2}(10\,000 - 100) = 4950\,\mathrm{s}$. To reach $0.001\,\mathrm{rad}$: $t = \tfrac{1}{2}(1\,000\,000 - 100) = 499\,950\,\mathrm{s}$, about $5.8$ days. Each factor of ten in accuracy costs a factor of a hundred in time.

**Compare with linear.** $\dot{x} = -x$ covers the first factor of ten in $\ln 10 = 2.30\,\mathrm{s}$, and every further factor of ten in another $2.30\,\mathrm{s}$. "Asymptotically stable" is a true description of both. Only one of them can [[point a telescope|decay-picture]].

The difference has a name. $\dot{x} = -x$ is **exponentially stable**, meaning $\lVert x(t)\rVert \le M\lVert x_0\rVert e^{-\sigma t}$ for some constants $M, \sigma > 0$: the error is squeezed under a decaying exponential. The cubic system is asymptotically stable but *not* exponentially stable. The indirect method can never certify it, precisely because a Hurwitz Jacobian would have implied exponential decay.
:::

## Failure case two: the guarantee has no size

This is the failure that matters most on a vehicle. The conclusion is not wrong. It is only uselessly small.

::: example A loop that is stable up to an amplitude of two
Picture a loop whose damping is positive for small signals and turns negative as the amplitude grows. That is the signature of an actuator that starts to hit its **[[rate limit|rate-limit]]**, or of aerodynamic damping that reverses at high incidence. A compact model is the van der Pol equation with the damping sign reversed:

$$
\ddot{x} + \mu(1 - x^2)\dot{x} + x = 0, \qquad \mu = 0.3 .
$$

For $|x| < 1$ the damping coefficient $\mu(1 - x^2)$ is positive, and for $|x| > 1$ it is negative.

**Linearize at the origin.** Drop the $x^2\dot{x}$ term: $\ddot{x} + 0.3\dot{x} + x = 0$, with characteristic equation $\lambda^2 + 0.3\lambda + 1 = 0$. The eigenvalues are $-0.15 \pm 0.9887j$, so $\zeta = 0.15$ and $\omega_n = 1\,\mathrm{rad/s}$. Hurwitz. The indirect method certifies asymptotic stability, and a frequency-domain analysis of the same linear model would report healthy margins.

**Now find the fence.** This system is the time reverse of the standard van der Pol oscillator from the first lesson. Running the film backward turns its stable limit cycle of amplitude $2.0009$ into an **unstable** limit cycle here, and that cycle is the [[edge of the region of attraction|roa-picture]]. Integrate for $120\,\mathrm{s}$ with a $1\,\mathrm{ms}$ step, from rest at $x_0$:

| $x_0$ | Outcome at $120\,\mathrm{s}$ |
| --- | --- |
| $0.50$ | $\lVert\mathbf{x}\rVert = 7.3\times10^{-9}$ |
| $1.99$ | $\lVert\mathbf{x}\rVert = 2.8\times10^{-7}$ |
| $2.0009$ | $\lVert\mathbf{x}\rVert = 6.2\times10^{-6}$ |
| $2.0010$ | diverged |
| $2.10$ | diverged |

Bisection puts the boundary at $x_0 = 2.00092$ on the axis $\dot{x} = 0$. Inside, the loop settles. Outside, the amplitude grows without bound. The eigenvalues $-0.15 \pm 0.9887j$ are the same in both cases, because they describe a neighborhood of the origin and nothing else.

**Make it concrete.** Scale the model to a real error signal: measure $x$ in degrees, with the nonlinearity starting at $1^\circ$ instead of $1$. Now the region of attraction reaches out only $2^\circ$, while the linear analysis still reports $\zeta = 0.15$ and full margins. A gust, a slew transient or a sensor glitch of $2^\circ$ ends the mission. Quoting local stability without a region is the error the rest of this module exists to prevent.
:::

The subcritical Hopf from the first lesson is the same trap in another form: a stable equilibrium ringed by an unstable cycle, with any disturbance past the ring diverging. It is why flight programs estimate regions of attraction rather than quoting local stability.

The *instability* half of the theorem has no such weakness. If the Jacobian has an eigenvalue with positive real part, the equilibrium is unstable, full stop. There is no nonlinear rescue, because close to the equilibrium the linear growth outruns the remainder in the same way that the linear decay did in the proof.

## Failure case three: the dynamics are not differentiable

Taking a slope needs a smooth curve. At a sharp corner or a jump, there is no single tangent line. The expansion above requires $\mathbf{f}$ to be continuously differentiable at the equilibrium, and several things in this module are not:

- an on-off thruster, $u = -u_{\max}\operatorname{sign}(s)$, where $\mathbf{f}$ jumps across the switching surface;
- **[[Coulomb friction|coulomb]]** in a gimbal bearing, which jumps at zero rate;
- a hard saturation at the point where it saturates (continuous, but with a corner);
- the quaternion attitude law with its $\operatorname{sign}(q_0)$ factor, later in this module.

For these there is no Jacobian at the point of interest, so the indirect method does not apply. Not "gives a cautious answer" — does not apply. The direct method of the next lesson handles them without difficulty, which is one of the strongest reasons to learn it.

## Failure case four: a family of stable linearizations

**[[Gain scheduling|gain-scheduling]]** designs a linear controller at each of several operating points and blends between them as the vehicle flies. The unspoken claim is that if every frozen operating point is stable, the scheduled system is stable. It is false, and the counterexample is small enough to check by hand.

::: example Stable at every instant, growing at every instant
Take the linear time-varying system $\dot{\mathbf{x}} = \mathbf{A}(t)\mathbf{x}$ with

$$
\mathbf{A}(t) = \begin{bmatrix}
-1 + 1.5\cos^2 t & 1 - 1.5\sin t\cos t \\
-1 - 1.5\sin t\cos t & -1 + 1.5\sin^2 t
\end{bmatrix} .
$$

**Freeze time and look.** The trace is $-2 + 1.5(\cos^2 t + \sin^2 t) = -0.5$, and the determinant works out to $0.5$, at every $t$. So the frozen eigenvalues, from $\lambda^2 + 0.5\lambda + 0.5 = 0$, are $-0.25 \pm 0.6614j$ — constant, Hurwitz, with $\zeta = 0.354$. Every snapshot of this system is a comfortably damped second-order mode. Evaluating at $t = 0, 0.7, 1.9, 3.3$ gives the same pair to six decimals each time.

**Now integrate it.** From $\mathbf{x}(0) = (1, 0)$ with a $0.1\,\mathrm{ms}$ step:

| $t$ | $\lVert\mathbf{x}\rVert$ | $e^{t/2}$ |
| --- | --- | --- |
| $5\,\mathrm{s}$ | $12.18$ | $12.18$ |
| $10\,\mathrm{s}$ | $148.4$ | $148.4$ |
| $20\,\mathrm{s}$ | $22026$ | $22026$ |

The state grows exactly as $e^{t/2}$. You can check this in closed form: $\mathbf{x}(t) = e^{t/2}(\cos t,\ -\sin t)^\mathsf{T}$ satisfies the equation. (Differentiate the first entry to get $e^{t/2}(0.5\cos t - \sin t)$, and multiply out the first row of $\mathbf{A}(t)$ times $\mathbf{x}$ to get the same thing.)

The frozen eigenvalues are stable and the system diverges. The reason is that the eigenvectors rotate as time passes, and the trajectory is handed from one to the next in a way no single snapshot reveals.

**The rule that follows** is the one flight programs use. A schedule is safe when the parameter changes slowly compared with the closed-loop dynamics, and "slowly" must be backed by a rate bound, not assumed. Building that bound into the design, instead of checking it afterward, is what linear parameter-varying design does; the robust and multivariable control module treats it.
:::

::: warning
Two linearization habits cause most of the damage. The first is linearizing about a point the vehicle is not at — a trim computed for nominal mass but flown at end-of-burn mass, so the "equilibrium" is a few degrees away and the Jacobian is evaluated at the wrong place. The second is reporting eigenvalues from a model whose nonlinearity has been smoothed to make linearization possible. Replace a hard saturation by its small-signal gain and the model becomes differentiable, Hurwitz, and silent about the very case you were worried about.
:::

::: note What a Hurwitz Jacobian does buy you
A Hurwitz Jacobian buys more than bare stability. It gives local exponential stability, and with it local robustness. For small enough perturbations, exponential stability survives bounded disturbances and small unmodeled dynamics, which is why linear design works as well as it does. The quantitative version of that statement is input-to-state stability, a later lesson in this module.
:::

## Check yourself

::: check
Classify the origin for $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - x_2^3$ using the indirect method. Then say what the method has actually told you.
:::

::: answer
The Jacobian is $\begin{bmatrix}0 & 1\\ -1 & -3x_2^2\end{bmatrix}$. At the origin that is $\begin{bmatrix}0 & 1\\ -1 & 0\end{bmatrix}$, with eigenvalues from $\lambda^2 + 1 = 0$: $\pm j$. They lie on the imaginary axis, so the method is inconclusive and has told you nothing.

That is not a mistake in your calculation. The cubic damping $-x_2^3$ is the only friction in the system, and it is invisible to a first-order expansion because its slope at zero is zero. The direct method settles it in three lines using $V = \tfrac{1}{2}(x_1^2 + x_2^2)$, and the answer is asymptotically stable but not exponentially so.
:::

::: check
A report states: "the nonlinear simulation diverged from a $6^\circ$ initial error, but linear analysis shows eigenvalues at $-0.8 \pm 3.1j$, so the divergence must be a simulation artifact." What is wrong with the reasoning?
:::

::: answer
The eigenvalues certify a neighborhood of the equilibrium whose size they do not determine. A $6^\circ$ error may be outside the region of attraction, which is entirely consistent with a Hurwitz Jacobian. The reversed van der Pol loop above has eigenvalues $-0.15 \pm 0.989j$ and a basin that ends at a definite, finite amplitude.

The right response is to find the boundary. Locate the other equilibria and any unstable periodic orbits of the nonlinear model, then bisect on the starting state to see where the outcome changes. Blaming the integrator is testable too: repeat with a step ten times smaller and see whether the divergence time moves.
:::

::: check
For $\dot{x} = -x^3$ with $x_0 = 0.2$, how long to reach $0.02$? Compare with $\dot{x} = -x$ from the same start.
:::

::: answer
Use $t = \tfrac{1}{2}(x_1^{-2} - x_0^{-2})$ with $x_1 = 0.02$ and $x_0 = 0.2$. Here $x_1^{-2} = 1/0.0004 = 2500$ and $x_0^{-2} = 1/0.04 = 25$, so $t = \tfrac{1}{2}(2500 - 25) = 1237.5\,\mathrm{s}$, about $21\,\mathrm{min}$.

The linear system takes $\ln(0.2/0.02) = \ln 10 = 2.30\,\mathrm{s}$.

The cubic system is faster than the linear one only while $|x| > 1$, where $x^3$ is bigger than $x$. Below that it falls behind, and further below it falls behind catastrophically.
:::

::: check
Why does the indirect method's instability half not suffer from the "how big is the neighborhood" problem?
:::

::: answer
Because the conclusion is negative. To prove instability you only need to show states arbitrarily close to the equilibrium from which trajectories leave some fixed neighborhood. Arbitrarily close is exactly where the linearization is most accurate.

The unstable eigendirection supplies those states. Along it, the linear growth $e^{\sigma t}$ with $\sigma > 0$ outruns the higher-order remainder for as long as the state stays small, which is long enough to escape.

Stability, by contrast, is a claim about all future time. It needs the remainder kept under control over the whole journey, and that is where the unknown radius comes in.
:::

::: check
Your controller uses $u = -k\,\operatorname{sign}(x)$ around $x = 0$. Someone asks for the closed-loop eigenvalues. What do you tell them?
:::

::: answer
That the question has no answer at the equilibrium. $\operatorname{sign}(x)$ jumps at $x = 0$, so the closed-loop system has no Jacobian there, and the indirect method does not apply.

You can report eigenvalues of a smoothed replacement, such as $u = -k\,\mathrm{sat}(x/\phi)$, whose small-signal gain is $k/\phi$. ($\mathrm{sat}$ is the saturation function: linear with slope $1$ between $-1$ and $1$, and clipped flat outside; $\phi$, "phi", is the width of the linear zone, called the boundary layer.) But that is a different system, and the number misleads if $\phi$ is small.

The honest analysis is a direct Lyapunov argument on the discontinuous law, which is what the sliding-mode lesson does. It yields convergence in finite time rather than an eigenvalue.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{A} = \partial\mathbf{f}/\partial\mathbf{x}|_{\mathbf{x}_e}$ | Jacobian; $\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{g}(\mathbf{z})$ with $\lVert\mathbf{g}\rVert/\lVert\mathbf{z}\rVert \to 0$ |
| $\mathbf{A}$ Hurwitz | Locally exponentially, hence asymptotically, stable |
| Any $\operatorname{Re}\lambda > 0$ | Unstable; this half is not conservative |
| $\operatorname{Re}\lambda = 0$ | Inconclusive — the nonlinear terms decide |
| $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ | Gives $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$, the proof of the method |
| $\dot{x} = -x^3$ | Globally asymptotically stable, not exponentially; $x = x_0(1 + 2x_0^2t)^{-1/2}$ |
| $\dot{x} = +x^3$ | Same linearization; escapes at $t = 1/(2x_0^2)$ |
| $0.1 \to 0.01$ under $-x^3$ | $4950\,\mathrm{s}$, against $2.30\,\mathrm{s}$ for $\dot{x} = -x$ |
| Reversed van der Pol, $\mu = 0.3$ | Eigenvalues $-0.15 \pm 0.989j$; region of attraction ends at $x_0 = 2.0009$ |
| Frozen eigenvalues $-0.25 \pm 0.661j$ | Constant and stable while $\lVert\mathbf{x}\rVert$ grows as $e^{t/2}$ |
| Not differentiable | Sign, Coulomb friction, hard saturation: the method does not apply |

The next lesson supplies what is missing here: a stability test that works away from an equilibrium, works on discontinuous dynamics, works in any number of states, and returns a region rather than a point. That is the Lyapunov direct method, and it is the backbone of everything that follows.

::: context lyapunov-name Who Lyapunov was
Aleksandr Lyapunov was a Russian mathematician. His 1892 doctoral thesis, *The General Problem of the Stability of Motion*, laid out two ways to decide whether an equilibrium is stable.

The "first" or **indirect** method is this lesson's: linearize and look at the eigenvalues. The "second" or **direct** method, next lesson, needs no linearization at all — it looks for an energy-like function that always decreases. The word "indirect" refers to going through the linear approximation instead of working with the nonlinear equations directly. His name is spelled several ways in English (Liapunov, Ljapunov); they are all the same person.
:::

::: context tangent-picture The curve and its tangent
Here is a one-state example, $f(z) = -z + 0.5z^3$. The dashed red line is its tangent at the equilibrium, $Az$ with $A = -1$: the linearization. The shaded gap between the tangent and the true curve is the remainder $g(z) = 0.5z^3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93"/><line x1="180" y1="10" x2="180" y2="172" stroke="#6c7a93"/>
<polygon points="180.0,90.0 184.0,91.8 188.0,93.6 191.9,95.4 195.9,97.2 199.9,99.0 203.9,100.8 207.9,102.6 211.8,104.4 215.8,106.2 219.8,108.0 223.8,109.8 227.8,111.6 231.8,113.4 235.7,115.2 239.7,117.0 243.7,118.8 247.7,120.6 251.7,122.4 255.6,124.2 259.6,126.0 263.6,127.8 267.6,129.6 271.6,131.4 275.5,133.2 279.5,135.0 283.5,136.8 287.5,138.6 291.5,140.4 295.4,142.2 299.4,144.0 303.4,145.8 307.4,147.6 311.4,149.4 315.3,151.2 319.3,153.0 323.3,154.8 327.3,156.6 331.3,158.4 335.2,160.2 335.2,96.2 331.3,99.2 327.3,102.0 323.3,104.5 319.3,106.8 315.3,108.8 311.4,110.6 307.4,112.3 303.4,113.7 299.4,114.9 295.4,115.9 291.5,116.7 287.5,117.4 283.5,117.8 279.5,118.1 275.5,118.3 271.6,118.3 267.6,118.1 263.6,117.8 259.6,117.4 255.6,116.8 251.7,116.1 247.7,115.3 243.7,114.4 239.7,113.4 235.7,112.2 231.8,111.0 227.8,109.7 223.8,108.4 219.8,106.9 215.8,105.4 211.8,103.8 207.9,102.2 203.9,100.6 199.9,98.9 195.9,97.1 191.9,95.4 188.0,93.6 184.0,91.8 180.0,90.0" fill="#f2b880" opacity="0.6"/>
<polygon points="24.8,19.8 28.7,21.6 32.7,23.4 36.7,25.2 40.7,27.0 44.7,28.8 48.6,30.6 52.6,32.4 56.6,34.2 60.6,36.0 64.6,37.8 68.5,39.6 72.5,41.4 76.5,43.2 80.5,45.0 84.5,46.8 88.4,48.6 92.4,50.4 96.4,52.2 100.4,54.0 104.4,55.8 108.3,57.6 112.3,59.4 116.3,61.2 120.3,63.0 124.3,64.8 128.2,66.6 132.2,68.4 136.2,70.2 140.2,72.0 144.2,73.8 148.2,75.6 152.1,77.4 156.1,79.2 160.1,81.0 164.1,82.8 168.1,84.6 172.0,86.4 176.0,88.2 180.0,90.0 180.0,90.0 176.0,88.2 172.0,86.4 168.1,84.6 164.1,82.9 160.1,81.1 156.1,79.4 152.1,77.8 148.2,76.2 144.2,74.6 140.2,73.1 136.2,71.6 132.2,70.3 128.2,69.0 124.3,67.8 120.3,66.6 116.3,65.6 112.3,64.7 108.3,63.9 104.4,63.2 100.4,62.6 96.4,62.2 92.4,61.9 88.4,61.7 84.5,61.7 80.5,61.9 76.5,62.2 72.5,62.6 68.5,63.3 64.6,64.1 60.6,65.1 56.6,66.3 52.6,67.7 48.6,69.4 44.7,71.2 40.7,73.2 36.7,75.5 32.7,78.0 28.7,80.8 24.8,83.8" fill="#f2b880" opacity="0.6"/>
<line x1="24.8" y1="19.8" x2="335.2" y2="160.2" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
<polyline points="24.8,83.8 28.6,80.8 32.5,78.2 36.4,75.7 40.3,73.5 44.2,71.4 48.0,69.6 51.9,68.0 55.8,66.6 59.7,65.4 63.6,64.3 67.4,63.5 71.3,62.8 75.2,62.3 79.1,61.9 83.0,61.7 86.8,61.7 90.7,61.8 94.6,62.0 98.5,62.4 102.4,62.9 106.3,63.5 110.1,64.2 114.0,65.1 117.9,66.0 121.8,67.0 125.7,68.2 129.5,69.4 133.4,70.7 137.3,72.0 141.2,73.4 145.1,74.9 148.9,76.5 152.8,78.1 156.7,79.7 160.6,81.3 164.5,83.0 168.4,84.8 172.2,86.5 176.1,88.2 180.0,90.0 183.9,91.8 187.8,93.5 191.6,95.2 195.5,97.0 199.4,98.7 203.3,100.3 207.2,101.9 211.1,103.5 214.9,105.1 218.8,106.6 222.7,108.0 226.6,109.3 230.5,110.6 234.3,111.8 238.2,113.0 242.1,114.0 246.0,114.9 249.9,115.8 253.7,116.5 257.6,117.1 261.5,117.6 265.4,118.0 269.3,118.2 273.1,118.3 277.0,118.3 280.9,118.1 284.8,117.7 288.7,117.2 292.6,116.5 296.4,115.7 300.3,114.6 304.2,113.4 308.1,112.0 312.0,110.4 315.8,108.6 319.7,106.5 323.6,104.3 327.5,101.8 331.4,99.2 335.2,96.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<text x="250" y="104" font-size="11" fill="#1f2a44">z</text>
<text x="30" y="24" font-size="11" fill="#b4232c">tangent line: Az</text>
<text x="222" y="60" font-size="11" fill="#1d6fd1">true f(z)</text>
<text x="330" y="140" font-size="11" fill="#9a5a1a" text-anchor="end">gap = g(z)</text>
</svg>
```

Near $z = 0$ the gap is so thin you can barely see it; the ratio $g(z)/z = 0.5z^2$ goes to zero. Farther out it grows, and the curve bends back toward zero; it crosses zero at $z = \pm\sqrt{2} \approx \pm 1.41$, just past the edge of the picture — two new equilibria the tangent line knows nothing about. The linearization is trustworthy only where the gap is thin.
:::

::: context hurwitz-word Where "Hurwitz" comes from
Adolf Hurwitz was a German mathematician. In 1895 he published a test, using only the coefficients of a polynomial, that says whether all of its roots have negative real parts — without ever finding the roots. Engineers designing steam-turbine governors needed exactly that.

A matrix whose eigenvalues all have negative real parts is now called Hurwitz in his honor, and the Routh–Hurwitz test from classical control is his coefficient test, merged with Edward Routh's earlier version of the same idea.
:::

::: context lyapunov-equation Why the Lyapunov equation has a solution
When $\mathbf{A}$ is Hurwitz, the solution can be written down directly:

$$
\mathbf{P} = \int_0^{\infty} e^{\mathbf{A}^\mathsf{T}t}\,\mathbf{Q}\,e^{\mathbf{A}t}\,dt .
$$

The integral converges because every mode of $e^{\mathbf{A}t}$ decays — that is what Hurwitz buys. And $\mathbf{P}$ is positive definite because $\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$ adds up $\mathbf{Q}$-weighted squares of the decaying trajectory that starts at $\mathbf{z}$, which is positive for any $\mathbf{z} \ne \mathbf{0}$. In words: $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$ is the total future cost of the linear system starting from $\mathbf{z}$. In practice you solve it with `scipy.linalg.solve_continuous_lyapunov`.
:::

::: context decay-picture Asymptotic is not the same as fast
Both curves start at $0.1$. The red one, $\dot{x} = -x$, is essentially at zero within five seconds. The blue one, $\dot{x} = -x^3$, has lost less than a tenth of its size after ten.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
<line x1="44" y1="164" x2="334" y2="164" stroke="#6c7a93"/><line x1="44" y1="16" x2="44" y2="164" stroke="#6c7a93"/>
<text x="44" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="101" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
<text x="158" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
<text x="215" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">6</text>
<text x="272" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">8</text>
<text x="329" y="180" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
<text x="40" y="168" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
<text x="40" y="98" font-size="11" fill="#1f2a44" text-anchor="end">0.05</text>
<text x="40" y="28" font-size="11" fill="#1f2a44" text-anchor="end">0.1</text>
<polyline points="44.0,24.0 46.9,24.1 49.7,24.3 52.5,24.4 55.4,24.6 58.2,24.7 61.1,24.8 64.0,25.0 66.8,25.1 69.7,25.2 72.5,25.4 75.3,25.5 78.2,25.7 81.1,25.8 83.9,25.9 86.8,26.1 89.6,26.2 92.5,26.3 95.3,26.5 98.2,26.6 101.0,26.7 103.8,26.9 106.7,27.0 109.6,27.1 112.4,27.2 115.2,27.4 118.1,27.5 121.0,27.6 123.8,27.8 126.7,27.9 129.5,28.0 132.4,28.1 135.2,28.3 138.1,28.4 140.9,28.5 143.8,28.7 146.6,28.8 149.4,28.9 152.3,29.0 155.2,29.2 158.0,29.3 160.9,29.4 163.7,29.5 166.6,29.7 169.4,29.8 172.2,29.9 175.1,30.0 178.0,30.1 180.8,30.3 183.7,30.4 186.5,30.5 189.4,30.6 192.2,30.8 195.1,30.9 197.9,31.0 200.8,31.1 203.6,31.2 206.5,31.4 209.3,31.5 212.2,31.6 215.0,31.7 217.9,31.8 220.7,31.9 223.6,32.1 226.4,32.2 229.2,32.3 232.1,32.4 235.0,32.5 237.8,32.6 240.7,32.8 243.5,32.9 246.4,33.0 249.2,33.1 252.1,33.2 254.9,33.3 257.8,33.4 260.6,33.6 263.5,33.7 266.3,33.8 269.1,33.9 272.0,34.0 274.9,34.1 277.7,34.2 280.6,34.3 283.4,34.5 286.2,34.6 289.1,34.7 292.0,34.8 294.8,34.9 297.6,35.0 300.5,35.1 303.3,35.2 306.2,35.3 309.1,35.4 311.9,35.6 314.8,35.7 317.6,35.8 320.5,35.9 323.3,36.0 326.2,36.1 329.0,36.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<polyline points="44.0,24.0 46.9,37.3 49.7,49.4 52.5,60.3 55.4,70.2 58.2,79.1 61.1,87.2 64.0,94.5 66.8,101.1 69.7,107.1 72.5,112.5 75.3,117.4 78.2,121.8 81.1,125.8 83.9,129.5 86.8,132.8 89.6,135.7 92.5,138.4 95.3,140.9 98.2,143.1 101.0,145.1 103.8,146.9 106.7,148.5 109.6,150.0 112.4,151.3 115.2,152.5 118.1,153.6 121.0,154.6 123.8,155.5 126.7,156.3 129.5,157.0 132.4,157.7 135.2,158.3 138.1,158.8 140.9,159.3 143.8,159.8 146.6,160.2 149.4,160.5 152.3,160.9 155.2,161.2 158.0,161.4 160.9,161.7 163.7,161.9 166.6,162.1 169.4,162.3 172.2,162.4 175.1,162.6 178.0,162.7 180.8,162.8 183.7,163.0 186.5,163.1 189.4,163.1 192.2,163.2 195.1,163.3 197.9,163.4 200.8,163.4 203.6,163.5 206.5,163.5 209.3,163.6 212.2,163.6 215.0,163.7 217.9,163.7 220.7,163.7 223.6,163.7 226.4,163.8 229.2,163.8 232.1,163.8 235.0,163.8 237.8,163.8 240.7,163.9 243.5,163.9 246.4,163.9 249.2,163.9 252.1,163.9 254.9,163.9 257.8,163.9 260.6,163.9 263.5,163.9 266.3,163.9 269.1,163.9 272.0,164.0 274.9,164.0 277.7,164.0 280.6,164.0 283.4,164.0 286.2,164.0 289.1,164.0 292.0,164.0 294.8,164.0 297.6,164.0 300.5,164.0 303.3,164.0 306.2,164.0 309.1,164.0 311.9,164.0 314.8,164.0 317.6,164.0 320.5,164.0 323.3,164.0 326.2,164.0 329.0,164.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
<text x="330" y="28" font-size="11" fill="#1d6fd1" text-anchor="end">ẋ = −x³: still 0.091 at 10 s</text>
<text x="110" y="128" font-size="11" fill="#b4232c">ẋ = −x</text>
<text x="330" y="160" font-size="11" fill="#1f2a44" text-anchor="end">t (s)</text>
</svg>
```

A space telescope has to hold its pointing error to tiny fractions of a degree within minutes of a slew. A law that behaves like the blue curve near zero would never get there on any useful timescale — even though, mathematically, it is asymptotically stable. That is why "exponentially stable" is the property engineers actually want to certify.
:::

::: context rate-limit What a rate limit does
An actuator such as a control-surface motor or a gimbal can only move so fast: that maximum speed is its **rate limit**. For small, slow commands it keeps up and the loop behaves as designed. For big or fast commands it falls behind, so its output lags the command more and more.

Extra lag in a feedback loop eats phase margin, and enough of it turns damping negative: the actuator ends up pushing at the wrong moment and feeding the oscillation. That is exactly the "positive damping for small signals, negative for large ones" of the reversed van der Pol model. Rate limiting has contributed to pilot-induced oscillations in real aircraft.
:::

::: context roa-picture The fence around the safe region
This is the phase plane of the reversed van der Pol loop. The dashed red loop is the unstable limit cycle, crossing the $x$ axis at about $\pm 2$. Everything inside it (shaded) is the region of attraction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="106" x2="330" y2="106" stroke="#6c7a93"/><line x1="180" y1="14" x2="180" y2="200" stroke="#6c7a93"/>
<polygon points="100.6,95.9 101.3,91.4 102.3,86.6 103.5,81.8 105.0,76.9 106.7,71.9 108.8,67.0 111.1,62.1 113.7,57.3 116.5,52.7 119.6,48.3 123.0,44.3 126.5,40.5 130.3,37.2 134.2,34.3 138.3,31.9 142.5,29.9 146.8,28.4 151.2,27.3 155.6,26.7 160.0,26.5 164.5,26.6 168.9,27.0 173.3,27.8 177.6,28.8 181.9,30.0 186.1,31.4 190.3,32.9 194.3,34.6 198.2,36.3 202.1,38.1 205.8,40.0 209.5,42.0 213.0,43.9 216.4,45.9 219.7,47.9 222.9,50.0 226.0,52.0 228.9,54.0 231.8,56.1 234.5,58.2 237.1,60.3 239.6,62.4 242.0,64.6 244.2,66.9 246.3,69.1 248.3,71.5 250.2,73.9 251.9,76.5 253.5,79.1 254.9,81.8 256.2,84.7 257.3,87.8 258.2,90.9 259.0,94.3 259.5,97.8 259.9,101.6 260.0,105.5 260.0,109.6 259.6,113.9 259.1,118.3 258.2,123.0 257.2,127.8 255.8,132.6 254.2,137.6 252.3,142.6 250.1,147.5 247.6,152.4 244.9,157.1 241.9,161.5 238.7,165.8 235.3,169.6 231.6,173.2 227.8,176.3 223.8,178.9 219.6,181.1 215.4,182.9 211.0,184.2 206.6,185.0 202.2,185.5 197.8,185.5 193.3,185.2 188.9,184.6 184.5,183.8 180.2,182.7 176.0,181.4 171.8,179.9 167.7,178.3 163.7,176.6 159.8,174.8 156.0,172.9 152.4,171.0 148.8,169.1 145.3,167.1 141.9,165.1 138.7,163.1 135.6,161.0 132.6,159.0 129.6,156.9 126.9,154.8 124.2,152.8 121.6,150.6 119.2,148.5 116.9,146.3 114.7,144.0 112.6,141.7 110.7,139.3 108.9,136.8 107.3,134.2 105.8,131.5 104.4,128.7 103.2,125.8 102.2,122.7 101.4,119.4 100.7,116.0 100.3,112.3 100.0,108.5 100.0,104.5 100.2,100.3 100.6,95.9" fill="#e8f0fb"/>
<polyline points="256.0,106.0 255.7,112.2 254.9,118.8 253.5,125.7 251.4,132.8 248.8,139.9 245.5,146.9 241.6,153.7 237.1,159.9 232.1,165.5 226.7,170.2 220.9,174.0 214.7,176.8 208.4,178.7 202.0,179.6 195.5,179.6 189.1,178.9 182.7,177.6 176.5,175.8 170.5,173.6 164.6,171.2 159.0,168.4 153.6,165.6 148.5,162.6 143.7,159.5 139.1,156.4 134.8,153.1 130.8,149.8 127.1,146.4 123.7,143.0 120.6,139.3 117.9,135.5 115.5,131.5 113.4,127.3 111.7,122.9 110.4,118.1 109.6,113.0 109.2,107.7 109.3,102.0 109.9,96.0 111.1,89.9 112.8,83.6 115.0,77.2 117.8,70.9 121.2,64.9 125.0,59.2 129.4,54.1 134.1,49.7 139.3,46.0 144.7,43.1 150.3,41.1 156.1,39.9 161.9,39.4 167.7,39.6 173.5,40.4 179.3,41.8 184.8,43.5 190.2,45.6 195.4,47.9 200.4,50.5 205.2,53.2 209.7,56.1 214.0,59.0 218.0,62.1 221.7,65.3 225.1,68.6 228.3,71.9 231.1,75.4 233.6,79.1 235.8,82.9 237.7,86.9 239.2,91.0 240.3,95.4 241.1,99.9 241.4,104.6 241.3,109.5 240.8,114.6 239.8,119.7 238.3,124.9 236.5,130.0 234.1,135.0 231.4,139.8 228.2,144.2 224.7,148.3 220.8,151.8 216.6,154.8 212.2,157.2 207.6,159.0 202.9,160.2 198.1,160.8 193.3,160.9 188.5,160.5 183.7,159.7 179.1,158.5 174.5,156.9 170.1,155.1 165.9,153.1 161.8,150.8 158.0,148.4 154.4,145.8 151.0,143.2 147.9,140.4 145.0,137.5 142.3,134.4 140.0,131.3 137.9,128.1 136.1,124.8 134.6,121.3 133.4,117.8 132.5,114.1 132.0,110.4 131.8,106.6 131.9,102.8 132.3,98.9 133.1,95.1 134.2,91.3 135.7,87.6 137.5,84.1 139.5,80.7 141.9,77.6 144.5,74.8 147.4,72.4 150.4,70.2 153.7,68.5 157.0,67.1 160.5,66.1 164.0,65.5 167.6,65.3 171.2,65.4 174.7,65.8 178.2,66.5 181.6,67.5 185.0,68.7 188.2,70.1 191.3,71.7 194.2,73.5 197.0,75.4 199.6,77.4 202.0,79.6 204.2,81.8 206.3,84.2 208.1,86.6 209.7,89.1 211.0,91.7 212.2,94.3 213.1,97.0 213.7,99.7 214.2,102.5 214.4,105.2 214.3,107.9 214.0,110.6 213.5,113.2 212.8,115.8 211.8,118.3 210.6,120.6 209.2,122.8 207.7,124.9 205.9,126.7 204.0,128.4 202.0,129.8 199.8,131.0 197.6,132.0 195.3,132.8 192.9,133.3 190.5,133.6 188.1,133.7 185.6,133.5 183.2,133.2 180.9,132.7 178.5,132.0 176.3,131.2 174.1,130.2 172.0,129.1 170.1,127.8 168.2,126.5 166.5,125.0 164.9,123.5 163.4,121.9 162.1,120.2 160.9,118.5 159.9,116.7 159.0,114.9 158.3,113.0 157.8,111.2 157.4,109.3 157.2,107.5 157.2,105.7 157.3,103.9 157.5,102.1 157.9,100.5 158.5,98.8 159.2,97.3 160.0,95.9 161.0,94.5 162.0,93.3 163.2,92.2 164.5,91.2 165.8,90.4 167.2,89.6 168.7,89.1 170.2,88.6 171.7,88.3 173.3,88.2 174.9,88.1 176.4,88.2 178.0,88.4 179.5,88.8 181.0,89.2 182.5,89.8 183.9,90.4 185.2,91.2 186.5,92.0 187.7,92.9 188.8,93.8 189.8,94.8 190.7,95.9 191.6,97.0 192.3,98.2 193.0,99.3 193.5,100.5 193.9,101.7 194.2,102.9 194.5,104.1 194.6,105.3 194.6,106.4 194.5,107.6 194.3,108.7 194.0,109.7 193.7,110.7 193.2,111.7 192.7,112.6 192.1,113.4 191.4,114.1 190.6,114.8 189.8,115.4 189.0,115.9 188.1,116.4 187.2,116.7 186.2,117.0 185.2,117.2 184.2,117.3 183.2,117.3 182.3,117.2 181.3,117.1 180.3,116.9 179.4,116.6 178.5,116.2 177.6,115.8 176.7,115.4 175.9,114.8 175.2,114.3 174.5,113.7 173.8,113.0 173.2,112.4 172.7,111.6 172.2,110.9 171.8,110.2 171.5,109.4 171.2,108.7 171.0,107.9 170.9,107.2 170.8,106.4 170.8,105.7 170.9,105.0 171.0,104.3 171.2,103.6 171.4,103.0 171.7,102.4 172.1,101.9 172.4,101.4 172.9,100.9 173.3,100.5 173.8,100.1 174.4,99.8 174.9,99.5 175.5,99.3 176.1,99.1 176.7,99.0 177.3,99.0 177.9,99.0 178.6,99.0 179.2,99.1 179.8,99.2 180.4,99.4 180.9,99.6 181.5,99.9 182.0,100.1 182.5,100.5 183.0,100.8 183.4,101.2 183.8,101.6 184.2,102.0 184.5,102.5 184.8,102.9 185.1,103.4 185.3,103.9 185.5,104.3 185.6,104.8 185.7,105.3 185.7,105.7 185.7,106.2 185.7,106.6 185.6,107.1 185.5,107.5 185.4,107.9 185.2,108.2 185.0,108.6 184.7,108.9 184.5,109.2 184.2,109.4 183.9,109.7 183.5,109.9 183.2,110.0 182.8,110.2 182.4,110.3 182.1,110.3 181.7,110.4 181.3,110.4 180.9,110.4 180.5,110.3 180.2,110.2 179.8,110.1 179.4,110.0 179.1,109.8 178.8,109.7 178.4,109.5 178.1,109.2 177.9,109.0 177.6,108.7 177.4,108.5 177.2,108.2 177.0,107.9 176.8,107.6 176.7,107.3 176.6,107.1 176.5,106.8 176.5,106.5 176.4,106.2 176.4,105.9 176.5,105.6 176.5,105.4 176.6,105.1 176.7,104.9 176.8,104.6 176.9,104.4 177.1,104.2 177.2,104.0 177.4,103.9 177.6,103.7 177.8,103.6 178.0,103.5 178.2,103.4 178.5,103.3 178.7,103.3 178.9,103.3 179.2,103.3 179.4,103.3 179.7,103.3 179.9,103.4 180.1,103.4 180.3,103.5 180.6,103.6 180.8,103.7 181.0,103.8 181.1,104.0 181.3,104.1 181.5,104.3 181.6,104.4 181.7,104.6 181.9,104.8 182.0,105.0 182.0,105.2 182.1,105.3 182.2,105.5 182.2,105.7 182.2,105.9 182.2,106.1 182.2,106.2 182.2,106.4 182.1,106.6 182.1,106.7 182.0,106.8 181.9,107.0 181.8,107.1 181.7,107.2 181.6,107.3 181.5,107.4 181.4,107.5 181.2,107.6 181.1,107.6 181.0,107.6 180.8,107.7 180.7,107.7 180.5,107.7 180.4,107.7 180.2,107.7 180.1,107.6 179.9,107.6 179.8,107.5 179.7,107.5 179.5,107.4 179.4,107.3 179.3,107.3 179.2,107.2 179.1,107.1 179.0,107.0 178.9,106.9 178.8,106.8 178.8,106.6 178.7,106.5 178.7,106.4 178.7,106.3 178.6,106.2 178.6,106.1 178.6,106.0 178.6,105.9 178.7,105.8 178.7,105.7 178.7,105.6 178.8,105.5 178.8,105.4 178.9,105.3 178.9,105.2 179.0,105.2 179.1,105.1 179.1,105.1 179.2,105.0 179.3,105.0 179.4,105.0 179.5,105.0 179.6,105.0 179.7,104.9 179.8,105.0 179.9,105.0 180.0,105.0 180.0,105.0 180.1,105.0 180.2,105.1 180.3,105.1 180.4,105.2 180.4,105.2 180.5,105.3 180.6,105.3 180.6,105.4 180.7,105.5 180.7,105.5 180.8,105.6 180.8,105.7 180.8,105.7 180.8,105.8 180.8,105.9 180.9,105.9 180.9,106.0 180.8,106.1 180.8,106.1 180.8,106.2 180.8,106.3 180.8,106.3 180.7,106.4 180.7,106.4 180.7,106.5 180.6,106.5 180.6,106.5 180.5,106.6 180.5,106.6 180.4,106.6 180.4,106.6 180.3,106.6 180.3,106.7 180.2,106.7 180.1,106.7 180.1,106.6 180.0,106.6 180.0,106.6 179.9,106.6 179.9,106.6 179.8,106.5 179.8,106.5 179.7,106.5 179.7,106.5" fill="none" stroke="#1d6fd1" stroke-width="1.2"/>
<polyline points="261.2,106.0 261.0,111.7 260.3,117.8 259.2,124.3 257.5,131.0 255.4,137.8 252.7,144.7 249.5,151.6 245.8,158.2 241.6,164.4 237.0,170.0 231.9,175.0 226.5,179.1 220.9,182.4 215.0,184.9 208.9,186.4 202.8,187.2 196.6,187.2 190.5,186.6 184.4,185.5 178.5,183.9 172.6,181.9 167.0,179.7 161.5,177.3 156.2,174.8 151.0,172.1 146.1,169.5 141.4,166.7 136.9,164.0 132.6,161.2 128.6,158.5 124.7,155.7 121.0,152.9 117.6,150.0 114.4,147.0 111.4,144.0 108.6,140.8 106.1,137.5 103.8,134.0 101.8,130.3 100.2,126.2 98.8,121.9 97.8,117.3 97.1,112.2 96.8,106.8 97.0,101.0 97.6,94.7 98.7,88.1 100.3,81.2 102.5,74.1 105.1,66.8 108.4,59.7 112.2,52.7 116.5,46.1 121.2,40.1 126.4,34.8 132.0,30.4 137.9,26.8 144.0,24.2 150.2,22.6 156.6,21.8 163.0,21.7 169.4,22.4 175.7,23.6 181.8,25.3 187.9,27.3 193.8,29.6 199.5,32.1 205.0,34.7 210.3,37.3 215.4,40.1 220.3,42.8 225.0,45.5 229.4,48.3 233.7,51.0 237.8,53.7 241.6,56.4 245.3,59.2 248.7,62.0 252.0,64.9 255.0,67.9 257.7,71.0 260.3,74.4 262.5,77.9 264.5,81.7 266.2,85.8 267.6,90.3 268.6,95.3 269.2,100.7 269.4,106.6 269.1,113.0 268.3,119.9 267.0,127.4 265.0,135.3 262.5,143.4 259.4,151.7 255.6,160.0 251.2,168.0 246.2,175.5 240.7,182.2 234.7,188.0 228.3,192.7 221.5,196.3 214.6,198.7 207.5,200.1 200.4,200.4 193.2,199.9 186.2,198.6 179.2,196.9 172.4,194.7 165.8,192.2 159.3,189.5 153.1,186.7 147.1,183.9 141.3,181.1 135.7,178.4 130.3,175.8 125.1,173.3 120.1,170.8 115.3,168.6 110.6,166.4 106.1,164.3 101.8,162.3 97.6,160.5 93.5,158.7 89.6,157.0 85.8,155.4 82.1,153.8 78.6,152.3 75.1,150.8 71.8,149.3 68.5,147.8 65.4,146.2 62.4,144.6 59.6,142.9 56.9,140.9 54.3,138.8 51.9,136.3" fill="none" stroke="#f2b880" stroke-width="1.6"/>
<polyline points="100.6,95.9 101.3,91.4 102.3,86.6 103.5,81.8 105.0,76.9 106.7,71.9 108.8,67.0 111.1,62.1 113.7,57.3 116.5,52.7 119.6,48.3 123.0,44.3 126.5,40.5 130.3,37.2 134.2,34.3 138.3,31.9 142.5,29.9 146.8,28.4 151.2,27.3 155.6,26.7 160.0,26.5 164.5,26.6 168.9,27.0 173.3,27.8 177.6,28.8 181.9,30.0 186.1,31.4 190.3,32.9 194.3,34.6 198.2,36.3 202.1,38.1 205.8,40.0 209.5,42.0 213.0,43.9 216.4,45.9 219.7,47.9 222.9,50.0 226.0,52.0 228.9,54.0 231.8,56.1 234.5,58.2 237.1,60.3 239.6,62.4 242.0,64.6 244.2,66.9 246.3,69.1 248.3,71.5 250.2,73.9 251.9,76.5 253.5,79.1 254.9,81.8 256.2,84.7 257.3,87.8 258.2,90.9 259.0,94.3 259.5,97.8 259.9,101.6 260.0,105.5 260.0,109.6 259.6,113.9 259.1,118.3 258.2,123.0 257.2,127.8 255.8,132.6 254.2,137.6 252.3,142.6 250.1,147.5 247.6,152.4 244.9,157.1 241.9,161.5 238.7,165.8 235.3,169.6 231.6,173.2 227.8,176.3 223.8,178.9 219.6,181.1 215.4,182.9 211.0,184.2 206.6,185.0 202.2,185.5 197.8,185.5 193.3,185.2 188.9,184.6 184.5,183.8 180.2,182.7 176.0,181.4 171.8,179.9 167.7,178.3 163.7,176.6 159.8,174.8 156.0,172.9 152.4,171.0 148.8,169.1 145.3,167.1 141.9,165.1 138.7,163.1 135.6,161.0 132.6,159.0 129.6,156.9 126.9,154.8 124.2,152.8 121.6,150.6 119.2,148.5 116.9,146.3 114.7,144.0 112.6,141.7 110.7,139.3 108.9,136.8 107.3,134.2 105.8,131.5 104.4,128.7 103.2,125.8 102.2,122.7 101.4,119.4 100.7,116.0 100.3,112.3 100.0,108.5 100.0,104.5 100.2,100.3 100.6,95.9" fill="none" stroke="#b4232c" stroke-width="2.2" stroke-dasharray="6 4"/>
<circle cx="256.0" cy="106" r="3.5" fill="#1d6fd1"/><circle cx="261.2" cy="106" r="3.5" fill="#c77a2c"/>
<text x="336" y="120" font-size="11" fill="#1f2a44" text-anchor="end">x</text><text x="186" y="24" font-size="11" fill="#1f2a44">ẋ</text>
<text x="14" y="206" font-size="11" fill="#b4232c">unstable cycle = edge of the safe region</text>
<text x="150" y="134" font-size="11" fill="#1d6fd1">inside: settles</text>
</svg>
```

The blue run starts at $x = 1.9$, inside the fence, and spirals into the origin. The orange run starts at $x = 2.03$, a hair outside, and spirals outward, away forever. The eigenvalues at the origin are identical for both runs. Only the nonlinear model can show you where the fence is — which is what the region-of-attraction lesson will teach you to estimate.
:::

::: context coulomb Coulomb friction
Coulomb friction is the everyday sliding kind, named after the French physicist Charles-Augustin de Coulomb. Its size barely depends on speed, but its direction always opposes the motion: $F = -F_c\,\operatorname{sign}(v)$.

So at zero speed the force jumps from $+F_c$ to $-F_c$. There is no slope there to take, and a Jacobian does not exist. In a gimbal or reaction-wheel bearing this jump is why very slow, precise motions are hard: the mechanism sticks, then slips.
:::

::: context gain-scheduling How gain scheduling works in practice
A vehicle's dynamics change a lot over a flight. An aircraft at low speed and at high speed, or a rocket at liftoff and at max-Q, needs different controller gains. So designers pick a grid of operating points — often indexed by dynamic pressure, Mach number or altitude — design a linear controller at each, and interpolate the gains between them in flight.

It works very well, and most flying vehicles use it. The example here shows why it is not automatically safe: stability at every frozen point is not enough if the conditions change fast relative to the loop. This counterexample is usually credited to Markus and Yamabe, from 1960.
:::
