---
id: l03-linearization-and-the-indirect-method
title: Linearization and the Lyapunov indirect method
minutes: 19
covers:
  - 'Linearization and the Lyapunov indirect method, including its failure cases'
---

Almost every flight control law ever certified was designed from a linear model. You trim the vehicle, take partial derivatives, get $\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{B}\mathbf{u}$, and from there the whole linear toolbox applies. The theorem that licenses this is **Lyapunov's indirect method**, and it is a genuine theorem with a genuine proof: if the Jacobian at an equilibrium is Hurwitz, the nonlinear system really is asymptotically stable there.

The trouble is what the theorem does not say, and how rarely that is quoted alongside it. It says nothing about how large a neighbourhood the guarantee covers. It says nothing at all when an eigenvalue sits on the imaginary axis. It does not apply when the dynamics are not differentiable — which includes every on-off thruster and every sliding-mode law in this module. And a whole family of stable linearizations, one per operating point, does not add up to a stable nonlinear system, which is the failure that makes ad hoc gain scheduling a certification problem.

This lesson states the method precisely, shows why it works, and then works through its failure cases with numbers, because the failures are where nonlinear control earns its place. One of them is the answer to a question you should be able to answer cold in an interview: give a concrete case where linearization says stable and the system is not stable in any useful sense.

## The method

Let $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with $\mathbf{f}$ continuously differentiable and $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$. Put $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$ and expand:

$$
\dot{\mathbf{z}} = \mathbf{A}\mathbf{z} + \mathbf{g}(\mathbf{z}),
\qquad
\mathbf{A} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\mathbf{x}_e},
\qquad
\frac{\lVert\mathbf{g}(\mathbf{z})\rVert}{\lVert\mathbf{z}\rVert} \to 0 \ \text{ as } \ \lVert\mathbf{z}\rVert \to 0 .
$$

The remainder $\mathbf{g}$ collects everything of second order and higher, and the limit is the precise sense in which it is negligible close in.

::: key Lyapunov's indirect method
Let $\mathbf{A}$ be the Jacobian of $\mathbf{f}$ at an equilibrium. If every eigenvalue of $\mathbf{A}$ has $\operatorname{Re}\lambda < 0$ (Hurwitz), the equilibrium is locally asymptotically stable — in fact locally exponentially stable. If any eigenvalue has $\operatorname{Re}\lambda > 0$, the equilibrium is unstable. If the eigenvalue with the largest real part has $\operatorname{Re}\lambda = 0$ and none is positive, the test is **inconclusive**: the nonlinear terms decide. The method never bounds the region of attraction.
:::

Why it works, in outline. Because $\mathbf{A}$ is Hurwitz, for any symmetric positive definite $\mathbf{Q}$ the Lyapunov equation $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ has a unique symmetric positive definite solution $\mathbf{P}$, which the state-space module used to compute quadratic cost. Take $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$ and differentiate along the nonlinear trajectory:

$$
\dot{V} = \mathbf{z}^\mathsf{T}(\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z})
= -\mathbf{z}^\mathsf{T}\mathbf{Q}\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z}) .
$$

The first term is at most $-\lambda_{\min}(\mathbf{Q})\lVert\mathbf{z}\rVert^2$. The second is bounded by $2\lVert\mathbf{P}\rVert\lVert\mathbf{z}\rVert\lVert\mathbf{g}(\mathbf{z})\rVert$, and since $\lVert\mathbf{g}\rVert/\lVert\mathbf{z}\rVert \to 0$, there is a radius $r$ inside which $\lVert\mathbf{g}(\mathbf{z})\rVert \le \tfrac{\lambda_{\min}(\mathbf{Q})}{4\lVert\mathbf{P}\rVert}\lVert\mathbf{z}\rVert$. Inside that ball,

$$
\dot{V} \le -\tfrac{1}{2}\lambda_{\min}(\mathbf{Q})\lVert\mathbf{z}\rVert^2 < 0 ,
$$

which is exactly the condition the next lesson turns into a stability proof. The argument also shows where the guarantee stops: at the radius $r$ where the quadratic terms stop being dominated, which depends on $\mathbf{g}$ and is not computed by the eigenvalues at all.

## Failure case one: eigenvalues on the axis

If the Jacobian has an eigenvalue with zero real part, the remainder $\mathbf{g}$ is no longer negligible in the direction that matters, and the linearisation is genuinely silent. The cleanest demonstration is one dimensional.

Both $\dot{x} = -x^3$ and $\dot{x} = +x^3$ have $f'(0) = 0$: the same linearisation, $\dot{z} = 0$, marginal. Their behaviours could not differ more. Separating variables in $\dot{x} = -x^3$ gives

$$
x(t) = \frac{x_0}{\sqrt{1 + 2x_0^2 t}} ,
$$

which decays to zero from every initial condition — globally asymptotically stable. The other sign gives $x(t) = x_0/\sqrt{1 - 2x_0^2 t}$, which escapes at $t = 1/(2x_0^2)$. Same linear model, one globally stable and one with finite escape time. And a third system with the same linearisation, $\dot{x} = 0$, has every point an equilibrium.

::: example How slow "asymptotically stable" can be
Take $\dot{x} = -x^3$ with $x_0 = 0.1\,\mathrm{rad}$ — say an attitude error under a control law whose gain has been shaped to vanish cubically near zero, which is what a smoothed deadband does. The closed form gives

| $t$ | $x$ |
| --- | --- |
| $1\,\mathrm{s}$ | $0.09902$ |
| $10\,\mathrm{s}$ | $0.09129$ |
| $100\,\mathrm{s}$ | $0.05774$ |
| $1000\,\mathrm{s}$ | $0.02182$ |
| $4950\,\mathrm{s}$ | $0.01000$ |

Runge–Kutta at $\Delta t = 10\,\mathrm{ms}$ reproduces the last row to eleven digits. Solving $x(t) = x_1$ gives $t = \tfrac{1}{2}(x_1^{-2} - x_0^{-2})$, so reaching $0.01\,\mathrm{rad}$ takes $4950\,\mathrm{s}$ and reaching $0.001\,\mathrm{rad}$ takes $499\,950\,\mathrm{s}$ — five and a half days. Each factor of ten in accuracy costs a factor of a hundred in time.

Contrast the linear $\dot{x} = -x$, which covers the same first decade in $\ln 10 = 2.30\,\mathrm{s}$ and every subsequent decade in another $2.30\,\mathrm{s}$. "Asymptotically stable" is a true description of both. Only one of them points a telescope.

The distinction has a name: $\dot{x} = -x$ is **exponentially stable**, meaning $\lVert x(t)\rVert \le M\lVert x_0\rVert e^{-\sigma t}$ for some $M, \sigma > 0$. The cubic system is asymptotically stable but not exponentially stable, and the indirect method never certifies the cubic one, precisely because a Hurwitz Jacobian would have implied exponential decay.
:::

## Failure case two: the guarantee has no size

This is the failure that matters most on a vehicle, because the conclusion is not wrong, only unusably small.

::: example A loop that is stable up to an amplitude of two
Consider a second-order loop whose effective damping is positive for small signals and turns negative as the amplitude grows — the signature of an actuator that starts to rate-limit, or of aerodynamic damping that reverses at high incidence. A compact model is the van der Pol equation with the damping sign reversed:

$$
\ddot{x} + \mu(1 - x^2)\dot{x} + x = 0, \qquad \mu = 0.3 .
$$

For $|x| < 1$ the damping coefficient $\mu(1 - x^2)$ is positive, and for $|x| > 1$ it is negative. Linearise at the origin: $\lambda^2 + 0.3\lambda + 1 = 0$, eigenvalues $-0.15 \pm 0.9887j$, $\zeta = 0.15$, $\omega_n = 1\,\mathrm{rad/s}$. Hurwitz. The indirect method certifies asymptotic stability, and a frequency-domain analysis of the same linear model would report healthy margins.

Now find the fence. This system is the time reverse of the standard van der Pol oscillator, so the stable limit cycle of amplitude $2.0009$ found in the first lesson becomes an **unstable** limit cycle here, and it is the boundary of the region of attraction. Integrating for $120\,\mathrm{s}$ at $\Delta t = 1\,\mathrm{ms}$ from $(x_0, 0)$:

| $x_0$ | Outcome at $120\,\mathrm{s}$ |
| --- | --- |
| $0.50$ | $\lVert\mathbf{x}\rVert = 7.3\times10^{-9}$ |
| $1.99$ | $\lVert\mathbf{x}\rVert = 2.8\times10^{-7}$ |
| $2.0009$ | $\lVert\mathbf{x}\rVert = 6.2\times10^{-6}$ |
| $2.0010$ | diverged |
| $2.10$ | diverged |

Bisection puts the boundary at $x_0 = 2.00092$ on the axis $\dot{x} = 0$. Inside, the loop settles. Outside, the amplitude grows without bound. The eigenvalues $-0.15 \pm 0.9887j$ are identical in both cases, because they describe a neighbourhood of the origin and nothing else.

Change one number and the point becomes sharper. Scale the model to a real error signal — take $x$ in degrees with the nonlinearity at $x = 1^\circ$ instead of $1$ — and the region of attraction is $2^\circ$ wide while the linear analysis still reports $\zeta = 0.15$ and full margins. A gust, a slew transient or a sensor glitch of $2^\circ$ ends the mission. Quoting local stability without a region is the error the rest of this module exists to prevent.
:::

The instability half of the theorem has no such weakness. If the Jacobian has an eigenvalue with positive real part, the equilibrium is unstable, full stop — there is no nonlinear rescue for a state that the linearisation pushes away, because near the equilibrium the linear growth dominates the remainder in the same way.

## Failure case three: the dynamics are not differentiable

The expansion requires $\mathbf{f}$ to be continuously differentiable at the equilibrium. Several things in this module are not:

- an on-off thruster, $u = -u_{\max}\operatorname{sign}(s)$, where $\mathbf{f}$ jumps across the switching surface;
- Coulomb friction in a gimbal bearing, which has a discontinuity at zero rate;
- a hard saturation at the point where it saturates (continuous, but not differentiable);
- the quaternion attitude law with its $\operatorname{sign}(q_0)$ factor, later in this module.

For these there is no Jacobian at the point of interest, so the indirect method does not apply — not "gives a conservative answer", but does not apply. The direct method of the next lesson handles them without difficulty, which is one of the strongest arguments for learning it.

## Failure case four: a family of stable linearizations

Gain scheduling designs a linear controller at each of several operating points and interpolates. The tacit claim is that if every frozen operating point is stable, the scheduled system is stable. It is false, and the counterexample is small enough to check by hand.

::: example Stable at every instant, growing at every instant
Take the linear time-varying system $\dot{\mathbf{x}} = \mathbf{A}(t)\mathbf{x}$ with

$$
\mathbf{A}(t) = \begin{bmatrix}
-1 + 1.5\cos^2 t & 1 - 1.5\sin t\cos t \\
-1 - 1.5\sin t\cos t & -1 + 1.5\sin^2 t
\end{bmatrix} .
$$

Its trace is $-2 + 1.5 = -0.5$ and its determinant is $0.5$ at every $t$, so the frozen eigenvalues are $-0.25 \pm 0.6614j$ — constant, Hurwitz, with $\zeta = 0.354$. Every snapshot of this system is a comfortably damped second-order mode. Evaluating at $t = 0, 0.7, 1.9, 3.3$ gives the same pair to six decimals each time.

Integrate it. From $\mathbf{x}(0) = (1, 0)$ at $\Delta t = 0.1\,\mathrm{ms}$:

| $t$ | $\lVert\mathbf{x}\rVert$ | $e^{t/2}$ |
| --- | --- | --- |
| $5\,\mathrm{s}$ | $12.18$ | $12.18$ |
| $10\,\mathrm{s}$ | $148.4$ | $148.4$ |
| $20\,\mathrm{s}$ | $22026$ | $22026$ |

The state grows exactly as $e^{t/2}$. You can verify it in closed form: $\mathbf{x}(t) = e^{t/2}(\cos t,\ -\sin t)^\mathsf{T}$ satisfies the equation. The frozen eigenvalues are stable and the system diverges, because the eigenvectors rotate and the trajectory is handed from one to the next in a way no snapshot reveals.

The practical rule that follows is the one flight programs use: a schedule is safe when the parameter varies slowly compared with the closed-loop dynamics, and "slowly" has to be quantified with a rate bound, not assumed. Making that bound part of the synthesis instead of an afterthought is what linear parameter-varying design does, and the robust and multivariable control module treats it.
:::

::: warning
Two linearisation habits cause most of the damage. The first is linearising about a point the vehicle is not at — a trim computed for nominal mass, flown at end-of-burn mass, so the "equilibrium" is a few degrees away and the Jacobian is evaluated at the wrong place. The second is reporting eigenvalues from a model whose nonlinearity has been smoothed for the linearisation's benefit: replace a hard saturation by its small-signal gain and the model becomes differentiable, Hurwitz and silent about the case you were worried about.
:::

::: note
Hurwitz at an equilibrium does buy you something beyond bare stability: local exponential stability, and with it local robustness. For small enough perturbations, exponential stability survives bounded disturbances and small unmodelled dynamics, which is why linear design works as well as it does. The quantitative version of that statement is input-to-state stability, a later lesson in this module.
:::

## Check yourself

::: check
Classify the origin for $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - x_2^3$ using the indirect method. Then say what the method has actually told you.
:::

::: answer
The Jacobian is $\begin{bmatrix}0 & 1\\ -1 & -3x_2^2\end{bmatrix}$, which at the origin is $\begin{bmatrix}0 & 1\\ -1 & 0\end{bmatrix}$ with eigenvalues $\pm j$. They lie on the imaginary axis, so the method is inconclusive and has told you nothing. This is not a defect of your calculation: the cubic damping $-x_2^3$ is the only dissipation in the system and it is invisible to a first-order expansion. The direct method settles it in three lines using $V = \tfrac{1}{2}(x_1^2 + x_2^2)$, and the answer is asymptotically stable but not exponentially so.
:::

::: check
A report states: "the nonlinear simulation diverged from a $6^\circ$ initial error, but linear analysis shows eigenvalues at $-0.8 \pm 3.1j$, so the divergence must be a simulation artefact." What is wrong with the reasoning?
:::

::: answer
The eigenvalues certify a neighbourhood of the equilibrium whose size the eigenvalues do not determine. A $6^\circ$ error may be outside the region of attraction, which is entirely consistent with a Hurwitz Jacobian — the reversed van der Pol loop above has eigenvalues $-0.15 \pm 0.989j$ and a basin that ends at a specific finite amplitude. The right response is to find the boundary: locate the other equilibria and any unstable periodic orbits of the nonlinear model, then bisect on the initial condition to measure where the outcome changes. Blaming the integrator is testable too — repeat with a step ten times smaller and see whether the divergence time moves.
:::

::: check
For $\dot{x} = -x^3$ with $x_0 = 0.2$, how long to reach $0.02$? Compare with $\dot{x} = -x$ from the same start.
:::

::: answer
From $t = \tfrac{1}{2}(x_1^{-2} - x_0^{-2})$ with $x_1 = 0.02$ and $x_0 = 0.2$: $t = \tfrac{1}{2}(2500 - 25) = 1237.5\,\mathrm{s}$, about $21\,\mathrm{min}$. The linear system takes $\ln(0.2/0.02) = \ln 10 = 2.30\,\mathrm{s}$. The cubic system is faster than the linear one only while $|x| > 1$, where $x^3$ exceeds $x$; below that it falls behind, and further below it falls behind catastrophically.
:::

::: check
Why does the indirect method's instability half not suffer from the "how big is the neighbourhood" problem?
:::

::: answer
Because the conclusion is negative. To prove instability you need only exhibit states arbitrarily close to the equilibrium from which trajectories leave a fixed neighbourhood, and arbitrarily close is where the linearisation is most accurate. The unstable eigendirection supplies those states: along it the linear growth $e^{\sigma t}$ with $\sigma > 0$ dominates the higher-order remainder for as long as the state remains small, which is long enough to escape. Stability, by contrast, is a claim about all time and needs the remainder controlled over the whole journey, and that is where the unknown radius enters.
:::

::: check
Your controller uses $u = -k\,\operatorname{sign}(x)$ around $x = 0$. Someone asks for the closed-loop eigenvalues. What do you tell them?
:::

::: answer
That the question has no answer at the equilibrium: $\operatorname{sign}(x)$ is discontinuous at $x = 0$, the closed-loop vector field has no Jacobian there, and the indirect method does not apply. You can report eigenvalues of a smoothed replacement, such as $u = -k\,\mathrm{sat}(x/\phi)$ whose small-signal gain is $k/\phi$, but that is a different system and the number will mislead if the boundary layer $\phi$ is small. The honest analysis is a direct Lyapunov argument on the discontinuous law, which is what the sliding-mode lesson does, and it yields finite-time convergence rather than an eigenvalue.
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
| $\dot{x} = +x^3$ | Same linearisation; escapes at $t = 1/(2x_0^2)$ |
| $0.1 \to 0.01$ under $-x^3$ | $4950\,\mathrm{s}$, against $2.30\,\mathrm{s}$ for $\dot{x} = -x$ |
| Reversed van der Pol, $\mu = 0.3$ | Eigenvalues $-0.15 \pm 0.989j$; region of attraction ends at $x_0 = 2.0009$ |
| Frozen eigenvalues $-0.25 \pm 0.661j$ | Constant and stable while $\lVert\mathbf{x}\rVert$ grows as $e^{t/2}$ |
| Not differentiable | Sign, Coulomb friction, hard saturation: the method does not apply |

The next lesson supplies what is missing here: a stability test that works away from an equilibrium, works on discontinuous dynamics, works in any number of states, and returns a region rather than a point. That is the Lyapunov direct method, and it is the spine of everything that follows.
