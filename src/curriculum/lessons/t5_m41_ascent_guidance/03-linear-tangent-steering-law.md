---
id: l03-linear-tangent-steering-law
title: The linear tangent steering law
minutes: 17
covers:
  - "Optimal exoatmospheric steering: the linear tangent law from Pontryagin and the calculus of variations"
---

Once the vehicle is out of the dense atmosphere, the argument the previous lesson built against closed-loop correction disappears — there is no dynamic pressure left to turn a commanded attitude change into a bending load, so there is nothing stopping guidance from steering toward the actual target orbit. That raises the real question this module exists to answer: steer *how*? Not "point roughly toward where the burnout state needs to be," but the precise thrust direction, as a function of time, that reaches the target using the least propellant. The optimal control module's Pontryagin minimum principle and the primer vector it introduced are exactly the tool this problem needs, and this lesson uses them to derive one of the cleanest results in ascent guidance: the optimal exoatmospheric thrust direction, in the right coordinates, is a straight line.

## The problem, stripped to its essentials

Work in a local, flat, non-rotating frame with constant gravity $g$ pointing in the $-z$ direction, $x$ the downrange coordinate and $z$ the altitude — exactly the coordinates the optimal control module's minimum-time and minimum-propellant landing examples used. The vehicle has position $(x,z)$, velocity $(v_x, v_z)$, and mass $m$, burning propellant at a prescribed rate to produce thrust of prescribed magnitude $T(t)$ along a *steerable* unit direction $\hat{\mathbf u}(t) = (\cos\beta, \sin\beta)$, with $\beta$ the pitch angle from the downrange axis. No drag, no lift — this is the vacuum, exoatmospheric regime the previous two lessons established. The dynamics are

$$
\dot x = v_x, \qquad \dot z = v_z, \qquad
\dot v_x = \frac{T(t)}{m}\cos\beta, \qquad
\dot v_z = \frac{T(t)}{m}\sin\beta - g, \qquad \dot m = -\dot m(t),
$$

with $T(t)$ and the mass-flow rate $\dot m(t)$ given functions of time — this lesson derives the optimal *direction*, and leaves the magnitude and throttle policy that multiply it to a later lesson. The terminal requirement is a target velocity $(v_x^f, v_z^f)$ at some time $t_f$; the downrange position $x(t_f)$ is left completely free, because nothing about reaching an orbit cares exactly where along the ground track the burn ends — the target orbit's plane and shape fix everything except that one coordinate, a point this module develops further when it takes up how a target orbit is specified to guidance.

## The Hamiltonian and its costates

Attach a costate to every state — $\lambda_x, \lambda_z$ to position, $\lambda_{v_x}, \lambda_{v_z}$ to velocity, $\lambda_m$ to mass — and form the Hamiltonian exactly as the Pontryagin minimum principle lesson defines it, $H = L + \boldsymbol\lambda^\top \mathbf f$. Whatever the running cost $L$ turns out to be (time, propellant, or some combination — the choice affects only $\lambda_m$ and the throttle question this lesson sets aside), the only place the steering direction $\beta$ appears in $H$ is through

$$
H \supset \lambda_{v_x}\frac{T}{m}\cos\beta + \lambda_{v_z}\frac{T}{m}\sin\beta = \frac{T}{m}\,\boldsymbol\lambda_v \cdot \hat{\mathbf u},
$$

with $\boldsymbol\lambda_v = (\lambda_{v_x}, \lambda_{v_z})$ the **primer vector** — the costate of velocity, named for exactly the role it plays here. Minimizing $H$ pointwise over unit vectors $\hat{\mathbf u}$ minimizes $\boldsymbol\lambda_v \cdot \hat{\mathbf u}$, and for fixed $T/m > 0$ that happens when $\hat{\mathbf u}$ points opposite $\boldsymbol\lambda_v$:

$$
\hat{\mathbf u}^\star(t) = -\frac{\boldsymbol\lambda_v(t)}{\lVert\boldsymbol\lambda_v(t)\rVert}.
$$

This holds regardless of how $\lambda_m$ or $T(t)$ behave — the direction question separates cleanly from the throttle question, which is exactly why the primer vector is worth naming on its own.

The primer vector's *magnitude*, not only its direction, carries real information: for a bounded-thrust problem where the running cost is proportional to propellant burned, the optimal control module's minimum principle lesson showed the Hamiltonian is linear in throttle magnitude too, so the optimal throttle is bang-bang, switching between off and full thrust on the sign of a switching function built from $\lVert\boldsymbol\lambda_v\rVert$ and $\lambda_m$. A continuously-thrusting ascent burn, with no coast arc inserted, is the case where that switching function never changes sign — thrust stays commanded on throughout, and $\lVert\boldsymbol\lambda_v\rVert$ never needs to fall far enough to flip it. The two-phase throttle structure this module derives in a later lesson is a different mechanism again, driven by an active acceleration *constraint* rather than a fuel-optimal switching decision, and the two should not be conflated even though both answer "what should the throttle be doing."

::: key
Primer vector: $\boldsymbol\lambda_v$, the costate of velocity. Pontryagin's minimum condition makes the optimal thrust direction point exactly opposite it, $\hat{\mathbf u}^\star = -\boldsymbol\lambda_v/\lVert\boldsymbol\lambda_v\rVert$, independent of the throttle or mass bookkeeping — and its magnitude $\lVert\boldsymbol\lambda_v\rVert$ is what determines the throttle switching structure for a bounded-thrust, minimum-propellant problem.
:::

Now find how $\boldsymbol\lambda_v$ evolves. The costate equations are $\dot{\boldsymbol\lambda} = -\partial H/\partial(\text{state})$. Neither $v_x$ nor $v_z$ appears in $H$ except through the terminal cost (there is no running cost that depends on velocity here), so to first order in the interior of the burn,

$$
\dot\lambda_{v_x} = -\frac{\partial H}{\partial x} = -\lambda_x, \qquad
\dot\lambda_{v_z} = -\frac{\partial H}{\partial z} = -\lambda_z,
$$

because $x$ and $z$ do not appear anywhere in the dynamics either — this is a uniform-gravity, vacuum problem, so nothing in $\dot v_x$ or $\dot v_z$ depends on position. That in turn makes $\dot\lambda_x = -\partial H/\partial x = 0$ and $\dot\lambda_z = -\partial H/\partial z = 0$: **both position costates are constant** throughout the burn. Differentiating once more, $\ddot\lambda_{v_x} = -\dot\lambda_x = 0$ and likewise for $z$, so

$$
\lambda_{v_x}(t) = \lambda_{v_x}(0) - \lambda_x\, t, \qquad
\lambda_{v_z}(t) = \lambda_{v_z}(0) - \lambda_z\, t:
$$

**the primer vector's components are affine in time**, each with its own intercept but a *common* time-scaling set by the constant position costates.

## Why the free downrange coordinate makes the law exact

An affine function divided by another affine function is not, in general, itself affine — so $\tan\beta = \lambda_{v_z}/\lambda_{v_x}$ being linear in $t$ is not automatic from the last section alone. It becomes exact because of the one boundary condition this problem left open. Transversality for a free terminal state says the costate conjugate to that state vanishes at $t_f$: since $x(t_f)$ is unconstrained, $\lambda_x(t_f) = 0$. But $\lambda_x$ is *constant* — the previous section showed $\dot\lambda_x = 0$ throughout — so if it is zero at $t_f$ it is zero for every $t$. Then

$$
\dot\lambda_{v_x} = -\lambda_x = 0 \quad\Longrightarrow\quad \lambda_{v_x}(t) = \lambda_{v_x}(0), \text{ a genuine constant.}
$$

The downrange component of the primer vector does not merely vary slowly — it does not vary at all. Meanwhile $z(t_f)$ is generally constrained (a target altitude, or more generally a target radius once this is embedded in the orbital problem), so $\lambda_z$ is fixed by that constraint rather than forced to zero, and $\lambda_{v_z}(t) = \lambda_{v_z}(0) - \lambda_z t$ stays genuinely affine. The optimal thrust direction is opposite the primer vector, so with $\hat u_x \propto -\lambda_{v_x}$ (constant) and $\hat u_z \propto -\lambda_{v_z}$ (affine),

$$
\tan\beta(t) = \frac{\hat u_z}{\hat u_x} = \frac{-\lambda_{v_z}(t)}{-\lambda_{v_x}(0)} = \underbrace{\frac{-\lambda_{v_z}(0)}{-\lambda_{v_x}(0)}}_{A} \;+\; \underbrace{\frac{\lambda_z}{-\lambda_{v_x}(0)}}_{B}\, t
\;\equiv\; A + Bt,
$$

a ratio of an affine function to a genuine constant, which *is* affine. This is the **linear tangent steering law**, and the derivation shows exactly where each piece of it comes from: the affine-in-time primer vector is generic to any uniform-gravity, drag-free problem, but the clean $\tan\beta = A + Bt$ form — rather than the ratio of two independently-varying affine functions — depends specifically on one terminal coordinate being left free. That freedom is not a simplifying assumption made for convenience; it is the actual physical situation of an ascent, where the vehicle's downrange position at cutoff is immaterial and only the velocity vector and the altitude (or radius) matter.

::: key
Linear tangent steering law: $\tan\beta(t) = A + Bt$, the optimal exoatmospheric thrust pitch angle for a minimum-propellant ascent under constant gravity and no drag. It follows because the primer vector's components are affine in time (from $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$, $\dot{\boldsymbol\lambda}_r = 0$) and the downrange costate vanishes identically (from the free downrange position), making the downrange primer-vector component a true constant.
:::

## Solving for A and B

With $T(t)$, $\dot m(t)$ and $t_f$ given, $A$ and $B$ are found by a two-parameter shooting method: integrate the equations of motion forward with $\beta(t) = \arctan(A + Bt)$ for a trial $(A,B)$, compare the resulting $(v_x(t_f), v_z(t_f))$ to the target, and adjust $(A,B)$ — Newton's method on the two residuals converges in a handful of iterations, because the map from $(A,B)$ to terminal velocity is smooth and well behaved.

::: example Shooting for A and B
A vehicle with $m_0 = 60{,}000\ \mathrm{kg}$, constant mass flow $\dot m = 250\ \mathrm{kg/s}$, exhaust velocity $v_e = 3200\ \mathrm{m/s}$, burning for $t_f = 150\ \mathrm{s}$, must reach $v_x = 2400\ \mathrm{m/s}$, $v_z = 500\ \mathrm{m/s}$. The ideal propulsive capability is $v_e\ln(m_0/m_f) = 3200\ln(60{,}000/22{,}500) = 3138.7\ \mathrm{m/s}$ — comfortably above the $\sqrt{2400^2+500^2} = 2451.5\ \mathrm{m/s}$ the target demands, so the problem is feasible before any shooting begins.

A numerical shooting solve on the residuals $(v_x(t_f) - 2400,\, v_z(t_f) - 500)$, started from $(A,B) = (0.1, 0)$, converges in well under a second to

$$
A = 1.371108, \qquad B = -0.00596055,
$$

which drives the pitch angle from $\beta(0) = 53.895^\circ$ down through $45.383^\circ$ at $t=60\ \mathrm{s}$ to $\beta(150) = 25.502^\circ$ — a smooth, monotonic pitch-down, never doubling back, exactly the well-behaved shape a single affine tangent should produce. Integrating the true nonlinear equations of motion with this $\beta(t)$ gives $v_x = 2400.0000\ \mathrm{m/s}$, $v_z = 500.0000\ \mathrm{m/s}$ to the precision the shooting solver was asked for, an altitude gain of 28.55 km along the way, and a final speed of 2451.53 m/s — 687.1 m/s short of the 3138.7 m/s ideal, entirely accounted for by $\int g\sin\gamma\,dt$ over a burn that spends real time climbing.
:::

## Why the second parameter is not optional

It is tempting to wonder whether a single, constant pitch angle — $B = 0$ — might do almost as well, since the pitch-down above is gentle. It cannot, and the reason is a matter of counting degrees of freedom rather than degree of gentleness.

::: example One angle cannot hit two targets
Hold $B = 0$ and search for the single angle $A$ that hits $v_x = 2400\ \mathrm{m/s}$ in the same 150 s burn: $A = 0.842774$ ($\beta = 40.123^\circ$) does it exactly, but the resulting $v_z$ comes out to 551.66 m/s — 51.7 m/s past the 500 m/s target, with no remaining freedom to fix it. Search instead for the angle that hits $v_z = 500\ \mathrm{m/s}$ exactly: $A = 0.806925$ ($\beta = 38.901^\circ$) does that, but now $v_x = 2442.60\ \mathrm{m/s}$, 42.6 m/s off. A one-parameter family of trajectories (constant pitch, fixed burn time) can satisfy one terminal velocity component or the other, never both at once, for generic targets. The second parameter, $B$, is not a refinement of accuracy — it is the second degree of freedom the two-component terminal velocity constraint requires, and the calculus-of-variations derivation above is what proves the *particular* extra freedom needed is a linear rate of change of the tangent, not some other function.
:::

::: warning
The linear tangent law is a *pitch-angle* result: it fixes the direction of thrust, not its magnitude. Do not confuse $\tan\beta = A+Bt$ with a claim about acceleration, velocity, or throttle setting — those follow separately once the direction is known, and the two-phase throttle structure this module covers later is exactly the magnitude question this derivation deliberately left open.
:::

## Why it is valid only outside the atmosphere

Every step above leans on two facts that are true only in vacuum, uniform-gravity flight: the dynamics $\dot v_x, \dot v_z$ depend on nothing but $t$, $m$ and $\beta$ — not on $x$, $z$, or the velocity itself — which is what made $\partial H/\partial x$ and $\partial H/\partial z$ vanish and gave constant position costates in the first place. Reintroduce drag, $D(\mathbf v)$, and $\dot v_x$, $\dot v_z$ now depend on the velocity components through $D$'s dependence on speed; the costate equations for $\lambda_{v_x}, \lambda_{v_z}$ pick up extra terms proportional to $\boldsymbol\lambda_v \cdot \partial D/\partial \mathbf v$, and the clean linear-in-time result is gone — the true optimal steering law in the atmosphere is a much harder two-point boundary value problem with no closed form, part of why the previous two lessons' answer there is an open-loop program rather than a law solved in real time. Reintroduce a non-uniform gravity field — the $\mu/r^2$ this module needs once altitude changes enough to matter — and $g$ depends on position too, breaking $\partial H/\partial z = 0$ in the same way. The linear tangent law is exact for flat, uniform-gravity, drag-free flight and an excellent local approximation over any short arc of a real, curved-gravity exoatmospheric burn — which is precisely how the next lesson puts it to work.

## Check yourself

::: check
Derive, without looking back at the lesson, why $\lambda_x$ and $\lambda_z$ are constant throughout the burn in this problem.
:::

::: answer
The costate equations are $\dot\lambda_x = -\partial H/\partial x$ and $\dot\lambda_z = -\partial H/\partial z$. The Hamiltonian is built from the dynamics $\dot x = v_x$, $\dot z = v_z$, $\dot v_x = (T/m)\cos\beta$, $\dot v_z = (T/m)\sin\beta - g$, none of which contains $x$ or $z$ on the right-hand side — position never appears except as the state being differentiated. So $\partial H/\partial x = 0$ and $\partial H/\partial z = 0$ identically, giving $\dot\lambda_x = \dot\lambda_z = 0$: both position costates are constants of the motion, fixed by their boundary values.
:::

::: check
Why does $\lambda_x \equiv 0$ specifically, while $\lambda_z$ is in general nonzero?
:::

::: answer
Transversality sets a free terminal state's costate to zero at $t_f$: since downrange position $x(t_f)$ is unconstrained, $\lambda_x(t_f) = 0$. Because $\lambda_x$ is constant throughout the burn (previous answer), that single boundary value fixes it at zero for all $t$, not only at the end. Altitude $z(t_f)$ is generally constrained to a target value, so its transversality condition instead determines a nonzero constant value for $\lambda_z$, set by whatever the altitude constraint actually is.
:::

::: check
A learner sets up the same derivation but constrains *both* $x(t_f)$ and $z(t_f)$ to fixed target values, instead of leaving $x$ free. What happens to the tangent of the pitch angle, and why does that make the shooting problem harder?
:::

::: answer
With both position costates generally nonzero and each primer-vector component affine in time with its own slope, $\tan\beta = \lambda_{v_z}(t)/\lambda_{v_x}(t)$ becomes a ratio of two independently-varying affine functions of $t$ — not itself an affine function in general. There is no clean linear-tangent closed form to exploit, and the shooting problem must solve for the actual nonlinear pitch history (or a richer set of parameters) rather than two numbers. This is exactly why real guidance formulations leave the downrange coordinate (or, in the orbital problem, the argument of latitude) unconstrained: it is what buys the closed-form steering law.
:::

::: check
Explain why reintroducing drag breaks the linear tangent law, using the costate equations rather than an appeal to "the atmosphere is complicated."
:::

::: answer
The costate equation for velocity is $\dot{\boldsymbol\lambda}_v = -\partial H/\partial \mathbf v$. Without drag, $H$'s only velocity-dependence is through the trivial $\lambda_x v_x + \lambda_z v_z$ terms, giving the constant $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$ result used throughout this lesson. With drag $D(\mathbf v)$ present, the dynamics $\dot{\mathbf v}$ depend on $\mathbf v$ itself, so $H$ gains a term $-\boldsymbol\lambda_v \cdot D(\mathbf v)\hat{\mathbf v}/m$, and differentiating that with respect to $\mathbf v$ introduces additional, velocity-and-costate-dependent terms into $\dot{\boldsymbol\lambda}_v$. The primer vector no longer obeys a simple constant-derivative equation, so its components are no longer affine in time, and the exact closed-form tangent law does not survive.
:::

::: check
In the shooting example, the vehicle reaches 2451.53 m/s against an ideal propulsive capability of 3138.7 m/s. Is the 687.1 m/s difference evidence that the linear-tangent solution is suboptimal?
:::

::: answer
No. That difference is gravity loss, $\int g\sin\gamma\,dt$, an unavoidable cost of spending real time climbing against gravity while accelerating — it is present for *any* trajectory that gains 28.55 km of altitude in 150 s, optimal or not. The linear tangent law guarantees the steering direction that reaches the required terminal velocity using the least propellant for the given burn time and thrust profile; it does not, and cannot, eliminate gravity loss itself, only avoid adding any unnecessary steering inefficiency on top of it.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\boldsymbol\lambda_v$ | primer vector, the costate of velocity; optimal thrust points along $-\boldsymbol\lambda_v$ |
| $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$, $\dot{\boldsymbol\lambda}_r = 0$ | costate equations for uniform gravity, no drag — primer vector is affine in time |
| $x(t_f)$ free $\Rightarrow \lambda_x \equiv 0$ | the free downrange coordinate makes the downrange primer-vector component a true constant |
| $\tan\beta(t) = A + Bt$ | linear tangent steering law: affine over constant is affine |
| Two-parameter shooting | integrate with trial $(A,B)$, correct against the two terminal velocity residuals |
| Worked example | $A=1.371108$, $B=-0.00596055$ hits $(v_x,v_z)=(2400,500)$ m/s exactly from a 150 s, fixed-thrust burn |
| One angle, two targets | constant pitch ($B=0$) can hit only one velocity component in a fixed burn time, never both |
| Validity | exact for flat, uniform-gravity, drag-free flight; breaks under drag or position-dependent gravity |

The next lesson turns this exact, idealized result into a working, repeatedly re-solved onboard algorithm — Powered Explicit Guidance — and shows why re-converging every cycle is what lets a locally-flat approximation fly a real, curved-gravity ascent to orbit.
