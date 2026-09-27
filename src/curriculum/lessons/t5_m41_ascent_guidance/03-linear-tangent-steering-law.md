---
id: l03-linear-tangent-steering-law
title: The linear tangent steering law
minutes: 21
covers:
  - "Optimal exoatmospheric steering: the linear tangent law from Pontryagin and the calculus of variations"
---

Drive into the mountains and you will see yellow signs that say "8% grade". That number is the road's steepness: it climbs 8 metres for every 100 metres it goes forward. Mathematicians call rise-over-run the **[[tangent|tangent-grade]]** of the angle, written $\tan$. A flat road has tangent $0$. A road at $45^\circ$ has tangent $1$.

Now picture a road whose grade drops by the same amount every minute you drive: 60%, then 55%, then 50%, then 45%, all the way down. That odd road is the answer to this lesson's question. Above the atmosphere, the best way to point a rocket's thrust is to let the *tangent* of its pitch angle change by the same amount every second. That is the **linear tangent steering law**:

$$
\tan\beta(t) = A + Bt .
$$

Here $\beta$ ("beta") is the pitch angle of the thrust above the horizontal, $t$ is time, and $A$ and $B$ are two constants guidance must find. Read it "tan beta equals A plus B t".

Why does this matter now? Once the rocket is above the dense air, the argument from the last lesson is gone. There is no dynamic pressure left to turn a steering command into a bending load. So guidance is finally free to steer toward the real target orbit. The question is *how*: exactly which direction to push at every moment, to reach the target with the least propellant. The optimal control tools you already have — Pontryagin's minimum principle and the calculus of variations — answer it, and the answer is that straight line in $\tan\beta$. This lesson derives it step by step.

## The problem, stripped down

Use a flat, non-spinning frame with gravity $g$ pointing straight down:

- $x$ — **downrange** distance, along the ground in the direction of flight;
- $z$ — altitude, straight up;
- $v_x, v_z$ — the two velocity components ("v sub x", "v sub z");
- $m$ — mass.

These are the same coordinates as the optimal control module's landing examples. The engine gives thrust of known size $T(t)$ along a direction we get to choose, the unit vector $\hat{\mathbf u}(t) = (\cos\beta, \sin\beta)$. We are above the air, so there is no drag and no lift. The motion is

$$
\dot x = v_x, \qquad \dot z = v_z, \qquad
\dot v_x = \frac{T(t)}{m}\cos\beta, \qquad
\dot v_z = \frac{T(t)}{m}\sin\beta - g, \qquad \dot m = -\dot m_{\text{flow}}(t).
$$

The last one says the mass drops at the engine's known flow rate, in kg/s. Only the thrust *direction* is ours to pick; the size of the thrust and the throttle policy are a later lesson.

**The goal.** Reach a target velocity $(v_x^f, v_z^f)$ at the final time $t_f$ (and, in the full problem, a target altitude). The downrange position $x(t_f)$ is left completely **free** — nobody cares exactly where along the ground track the burn ends. A target orbit fixes its plane and its shape, but not where along the orbit you join it. That one unused freedom turns out to be what makes the answer so clean. Lesson 7 comes back to how a target orbit is handed to guidance.

## Price tags: costates and the Hamiltonian

Pontryagin's method attaches a **[[costate|costate-price]]** to every state. Think of a costate as a *price tag*: it says how much the final cost would change if you could nudge that state by one unit right now. We write $\lambda_x, \lambda_z$ ("lambda x", "lambda z") for the position price tags, $\lambda_{v_x}, \lambda_{v_z}$ for velocity, and $\lambda_m$ for mass.

The **[[Hamiltonian|hamiltonian-name]]** adds up the running cost $L$ and every state's rate of change times its price tag:

$$
H = L + \boldsymbol\lambda^\top \mathbf f
= L + \lambda_x v_x + \lambda_z v_z + \lambda_{v_x}\frac{T}{m}\cos\beta + \lambda_{v_z}\Big(\frac{T}{m}\sin\beta - g\Big) - \lambda_m \dot m_{\text{flow}} .
$$

Here $\mathbf f$ is the list of right-hand sides above, and $\boldsymbol\lambda^\top\mathbf f$ ("lambda transpose f") is the sum of each price times its rate. Whatever the running cost is — time, propellant, or a blend — it only affects $\lambda_m$ and the throttle. The steering angle $\beta$ shows up in just two terms:

$$
H \supset \lambda_{v_x}\frac{T}{m}\cos\beta + \lambda_{v_z}\frac{T}{m}\sin\beta = \frac{T}{m}\,\boldsymbol\lambda_v \cdot \hat{\mathbf u} .
$$

(The symbol $\supset$ means "contains the terms".) The pair $\boldsymbol\lambda_v = (\lambda_{v_x}, \lambda_{v_z})$ — the costate of velocity — is the **[[primer vector|primer-name]]**.

The minimum principle says: at every instant, choose the control that makes $H$ as small as possible. Since $T/m$ is positive, that means making the dot product $\boldsymbol\lambda_v \cdot \hat{\mathbf u}$ as small as possible. A dot product of a fixed vector with a unit vector is smallest when the unit vector points exactly the opposite way. So

$$
\hat{\mathbf u}^\star(t) = -\frac{\boldsymbol\lambda_v(t)}{\lVert\boldsymbol\lambda_v(t)\rVert} .
$$

The star marks the optimal choice; $\lVert\cdot\rVert$ means length. Notice what did *not* appear: $\lambda_m$ and the size of $T$. The direction question separates cleanly from the throttle question. That is why the primer vector deserves its own name.

Its *length* matters too. When thrust is bounded and the cost counts propellant burned, $H$ is also a straight-line function of the throttle, so the best throttle is **bang-bang**: full on or fully off. The switch is decided by the sign of a **switching function** built from $\lVert\boldsymbol\lambda_v\rVert$ and $\lambda_m$. A continuous ascent burn with no coast is the case where that function never changes sign, so thrust stays on throughout. The two-phase throttle structure in lesson 5 is a different mechanism — driven by an acceleration *limit*, not a fuel-optimal switch — so do not mix the two up.

::: key Primer vector
The costate of velocity, $\boldsymbol\lambda_v$. Pontryagin says optimal thrust points along it — with the minimum-principle signs used here, along $-\boldsymbol\lambda_v$: $\hat{\mathbf u}^\star = -\boldsymbol\lambda_v/\lVert\boldsymbol\lambda_v\rVert$, independent of the throttle or mass bookkeeping (many books define the primer vector as $\mathbf p = -\boldsymbol\lambda_v$ so it points along the thrust). Its magnitude $\lVert\boldsymbol\lambda_v\rVert$ determines the throttle switching structure for a bounded-thrust problem.
:::

::: note Why it has to be true: the Euler–Lagrange route
The calculus of variations reaches the same answer by setting derivatives to zero instead of "minimizing over unit vectors". Its **Euler–Lagrange conditions** for this problem are the costate equations of the next section plus the stationarity condition $\partial H/\partial\beta = 0$. Differentiate the two $\beta$ terms:

$$
\frac{\partial H}{\partial\beta} = \frac{T}{m}\left(-\lambda_{v_x}\sin\beta + \lambda_{v_z}\cos\beta\right) = 0
\quad\Longrightarrow\quad
\tan\beta = \frac{\lambda_{v_z}}{\lambda_{v_x}} .
$$

That fixes the thrust *line*. It has two solutions, pointing opposite ways; one makes $H$ a maximum and one a minimum. The second-derivative check picks $\hat{\mathbf u}$ opposite $\boldsymbol\lambda_v$, matching the minimum principle. Either way, the tangent of the pitch angle is the ratio of the primer vector's two components — so if we learn how those components change in time, we know the steering law.
:::

## How the price tags change over time

Pontryagin's costate equations say each price tag changes at the rate $\dot\lambda = -\partial H/\partial(\text{its state})$. Take them one at a time.

**Position price tags.** Look at the Hamiltonian: $x$ and $z$ appear nowhere in it. Gravity is uniform and there is no air, so nothing in the motion depends on where the rocket is. So

$$
\dot\lambda_x = -\frac{\partial H}{\partial x} = 0, \qquad \dot\lambda_z = -\frac{\partial H}{\partial z} = 0 .
$$

**Both position costates are constant** for the whole burn.

**Velocity price tags.** The velocities *do* appear in $H$, in the terms $\lambda_x v_x + \lambda_z v_z$ (because velocity is what changes position). Nothing else in $H$ contains them — no drag, and no running cost that depends on velocity. Differentiating:

$$
\dot\lambda_{v_x} = -\frac{\partial H}{\partial v_x} = -\lambda_x, \qquad
\dot\lambda_{v_z} = -\frac{\partial H}{\partial v_z} = -\lambda_z .
$$

The right-hand sides are constants, so each velocity price tag changes at a steady rate — it is a straight line in time:

$$
\lambda_{v_x}(t) = \lambda_{v_x}(0) - \lambda_x\, t, \qquad
\lambda_{v_z}(t) = \lambda_{v_z}(0) - \lambda_z\, t .
$$

In words: **the primer vector's components are [[affine|affine-line]] in time** — straight lines, each with its own starting value, and slopes set by the constant position costates. In compact vector form, $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$ and $\dot{\boldsymbol\lambda}_r = 0$, where $\boldsymbol\lambda_r = (\lambda_x, \lambda_z)$ is the position costate.

::: note Why the price of velocity falls in a straight line
Use the price-tag picture. Nudge $v_x$ up by a tiny amount $\delta$ at time $t$. Nothing else changes, because nothing depends on position. But for the rest of the burn you travel $\delta$ metres farther every second, so at the end $x$ is larger by $\delta\,(t_f - t)$. Its effect on the cost is its price at the end, plus $\lambda_x$ times that extra distance:

$$
\lambda_{v_x}(t) = \lambda_{v_x}(t_f) + \lambda_x\,(t_f - t) .
$$

That is a straight line in $t$ with slope $-\lambda_x$ — exactly the costate equation, reached without any calculus.
:::

## The free downrange coordinate makes the law exact

One affine function divided by another is *not* affine in general. So $\tan\beta = \lambda_{v_z}/\lambda_{v_x}$ is not yet a straight line. The last step comes from the one condition we left open.

**[[Transversality|transversality]]** says: if a final state is left free, its price tag at the end is zero. That makes sense — if nobody cares where $x$ ends, nudging it costs nothing. So $\lambda_x(t_f) = 0$.

But $\lambda_x$ is constant for the whole burn. If it is zero at the end, it is zero *all the time*: $\lambda_x \equiv 0$ (the triple bar means "for every $t$"). Then

$$
\dot\lambda_{v_x} = -\lambda_x = 0 \quad\Longrightarrow\quad \lambda_{v_x}(t) = \lambda_{v_x}(0), \text{ a true constant.}
$$

The downrange part of the primer vector does not change at all. Meanwhile the final altitude $z(t_f)$ *is* constrained (a target altitude, or a target radius in the orbital version), so $\lambda_z$ is some fixed number set by that constraint, not zero. So $\lambda_{v_z}(t)$ stays a genuine straight line.

Now divide. Thrust points opposite the primer vector, so $\hat u_x \propto -\lambda_{v_x}$ (constant) and $\hat u_z \propto -\lambda_{v_z}$ (a straight line). The symbol $\propto$ means "proportional to". Step by step:

$$
\tan\beta(t) = \frac{\hat u_z}{\hat u_x} = \frac{-\lambda_{v_z}(t)}{-\lambda_{v_x}(0)}
= \frac{-\lambda_{v_z}(0) + \lambda_z t}{-\lambda_{v_x}(0)}
= \underbrace{\frac{-\lambda_{v_z}(0)}{-\lambda_{v_x}(0)}}_{A} \;+\; \underbrace{\frac{\lambda_z}{-\lambda_{v_x}(0)}}_{B}\, t
\;\equiv\; A + Bt .
$$

The first step is "tangent = rise over run". The second puts in the two primer components. The third writes out the straight line for $\lambda_{v_z}$. The last splits the fraction into a constant part $A$ and a part that grows with $t$, with slope $B$. A straight line divided by a constant is a straight line. That is the **linear tangent steering law**.

The derivation shows where each piece comes from. The straight-line primer vector comes from uniform gravity and no drag. The clean $A + Bt$ form comes from the free downrange coordinate. That freedom is not a trick for convenience. It is the real physical situation: where along the ground the burn ends does not matter; only the velocity and the altitude do.

::: key Linear tangent steering law
$\tan\beta(t) = A + Bt$ — tan(pitch) = A + B·t — the optimal exoatmospheric thrust pitch angle for a minimum-propellant ascent under constant gravity and no drag. It follows because the primer vector's components are linear in time (from $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$, $\dot{\boldsymbol\lambda}_r = 0$) and the downrange costate vanishes identically (from the free downrange position), making the downrange primer-vector component a true constant.
:::

## Solving for A and B

The law gives the *shape* of the steering. Two numbers, $A$ and $B$, pick the particular member of the family that hits the target. They are found by a **[[shooting method|shooting]]**, like adjusting a cannon until the ball lands on the target:

1. Guess $(A, B)$.
2. Fly the equations of motion forward with $\beta(t) = \arctan(A + Bt)$ ("arctan" undoes tan: it turns a grade back into an angle).
3. Compare the final velocity with the target. The two differences are the **residuals**.
4. Adjust $(A, B)$ using Newton's method on the two residuals, and repeat.

Because the map from $(A, B)$ to final velocity is smooth, Newton's method converges in a handful of passes. Here it is in Python:

```python
import numpy as np

g, m0, mdot, ve, tf = 9.80665, 60000.0, 250.0, 3200.0, 150.0

def burnout_velocity(A, B, n=3000):
    """Integrate vx, vz with tan(beta) = A + B t (RK4); return [vx, vz]."""
    def f(t):
        beta = np.arctan(A + B * t)
        a = mdot * ve / (m0 - mdot * t)          # thrust acceleration T/m
        return np.array([a * np.cos(beta), a * np.sin(beta) - g])
    v, h = np.zeros(2), tf / n
    for k in range(n):
        t = k * h
        v = v + h / 6 * (f(t) + 4 * f(t + h / 2) + f(t + h))
    return v

target = np.array([2400.0, 500.0])
p = np.array([1.0, -0.01])                        # first guess (A, B)
for it in range(8):                               # Newton's method
    r = burnout_velocity(*p) - target
    J = np.column_stack([(burnout_velocity(*(p + d)) - burnout_velocity(*p)) / 1e-6
                         for d in (np.array([1e-6, 0]), np.array([0, 1e-6]))])
    p = p - np.linalg.solve(J, r)
print(f"A = {p[0]:.6f}, B = {p[1]:.8f}")
print("burnout velocity:", np.round(burnout_velocity(*p), 4))
# A = 1.371108, B = -0.00596055
# burnout velocity: [2400.  500.]
```

::: example Shooting for A and B
A vehicle starts at rest with $m_0 = 60{,}000\ \mathrm{kg}$, burns a constant $250\ \mathrm{kg/s}$ with exhaust velocity $v_e = 3200\ \mathrm{m/s}$ for $t_f = 150\ \mathrm{s}$, and must reach $v_x = 2400\ \mathrm{m/s}$, $v_z = 500\ \mathrm{m/s}$. Take $g = 9.80665\ \mathrm{m/s^2}$.

**Is it even possible?** The final mass is $60{,}000 - 250 \times 150 = 22{,}500\ \mathrm{kg}$. The rocket equation gives the ideal speed gain $v_e\ln(m_0/m_f) = 3200\ln(60{,}000/22{,}500) = 3138.7\ \mathrm{m/s}$. The target speed is $\sqrt{2400^2 + 500^2} = 2451.5\ \mathrm{m/s}$. Plenty of margin, so shooting can begin.

**Shoot.** The code above, started from $(A, B) = (1.0, -0.01)$, converges to

$$
A = 1.371108, \qquad B = -0.00596055 .
$$

**Read the steering.** At $t = 0$, $\tan\beta = 1.371108$, so $\beta = 53.895^\circ$. At $t = 60$ s, $\tan\beta = 1.371108 - 0.00596055 \times 60 = 1.013475$, so $\beta = 45.383^\circ$. At $t = 150$ s, $\tan\beta = 0.477026$, so $\beta = 25.502^\circ$. A smooth pitch-down that never doubles back — what a single straight line in $\tan\beta$ should give.

**Check the result.** Flying the full equations with this $\beta(t)$ gives $v_x = 2400.0000$ and $v_z = 500.0000$ m/s, a final speed of 2451.53 m/s, and an altitude gain of 28.55 km.

**Where did the other 687.1 m/s go?** The ideal was 3138.7 m/s; we got $3138.65 - 2451.53 = 687.12$ m/s less. Two losses share it. **Gravity loss**, $\int g\sin\gamma\,dt$, takes 272.8 m/s. **[[Steering loss|steering-loss]]** — thrust not pointing along the velocity, so part of it turns the velocity instead of speeding it up — takes 414.3 m/s. Check: $272.8 + 414.3 = 687.1$. The steering loss is large here because the rocket starts from rest: early on its small velocity points well away from the $54^\circ$ thrust. It is the price of arriving with *this* velocity vector, 28.55 km up, in exactly 150 s.

**Is this steering optimal?** It meets the minimum-principle conditions for reaching that velocity at that altitude, with $x$ free. So among all steering histories it is the most propellant-efficient way to reach that end state. In the full problem the target altitude is given too, and the burn time becomes a third unknown alongside $A$ and $B$ — three unknowns for three conditions. The exercise for this module does exactly that.
:::

::: warning Do not start Newton at B = 0
If the first guess has $B = 0$, the thrust direction is constant, and nudging $A$ or nudging $B$ rotates it the same way — only the timing differs. The two columns of the Newton matrix then point in the same direction, the matrix is singular, and the solve fails. Start with a small nonzero $B$ (a gentle pitch-down, like $-0.01$), as the code does.
:::

## Why the second parameter is not optional

The pitch-down above is gentle. So why not use one constant angle, $B = 0$? Because it is a question of counting, not of gentleness.

::: example One angle cannot hit two targets
Keep $B = 0$ and the same 150 s burn.

**Aim for $v_x$.** The constant angle that gives $v_x = 2400$ m/s exactly is $A = 0.842774$, or $\beta = 40.123^\circ$. But then $v_z = 551.66$ m/s — 51.7 m/s above the 500 m/s target, and no freedom left to fix it.

**Aim for $v_z$.** The constant angle that gives $v_z = 500$ m/s is $A = 0.806925$, or $\beta = 38.901^\circ$. Now $v_x = 2442.60$ m/s — 42.6 m/s off.

One adjustable number can satisfy one condition, not two. A constant pitch with a fixed burn time can hit $v_x$ or $v_z$, never both, for a general target. The second parameter $B$ is not extra polish. It is the second degree of freedom that a two-part velocity target requires. And the derivation above is what proves the *right* second freedom is a steady rate of change of the tangent, not some other function of time.
:::

::: warning
The linear tangent law is a *pitch-angle* result. It fixes the direction of thrust, not its size. Do not read $\tan\beta = A + Bt$ as a claim about acceleration, speed or throttle. Those follow separately once the direction is known — and the two-phase throttle structure later in this module is exactly the size question this derivation left open.
:::

## Why it holds only outside the atmosphere

Every step leaned on one fact: the accelerations $\dot v_x, \dot v_z$ depend only on $t$, $m$ and $\beta$ — not on position, and not on the velocity itself. That is what made $\partial H/\partial x$ and $\partial H/\partial z$ zero, gave constant position costates, and gave the simple velocity costate equations.

**Add drag.** Drag $D(\mathbf v)$ depends on the velocity, so $\dot v_x$ and $\dot v_z$ now do too. The velocity costate equations pick up extra terms involving $\boldsymbol\lambda_v$ and $\partial D/\partial\mathbf v$. The primer vector stops being a straight line in time, and the clean law is gone. The true best steering inside the air is a much harder problem with no neat formula — one more reason the last two lessons fly an open-loop program there.

**Add realistic gravity.** Real gravity is $\mu/r^2$, which depends on position. Then $\partial H/\partial z \ne 0$, the position costates stop being constant, and the law is no longer exact.

So the linear tangent law is exact for flat, uniform-gravity, drag-free flight, and an excellent approximation over any short stretch of a real, curved-gravity burn above the air. The next lesson uses precisely that: [[re-solve it every few seconds|peg-bridge]], and a locally flat answer flies a curved path to orbit.

## Check yourself

::: check
Show, without looking back, why $\lambda_x$ and $\lambda_z$ stay constant during the burn.
:::

::: answer
The costate equations are $\dot\lambda_x = -\partial H/\partial x$ and $\dot\lambda_z = -\partial H/\partial z$. The Hamiltonian is built from the running cost and the motion: $\dot x = v_x$, $\dot z = v_z$, $\dot v_x = (T/m)\cos\beta$, $\dot v_z = (T/m)\sin\beta - g$. None of these right-hand sides contains $x$ or $z$ — gravity is uniform and there is no air. So $\partial H/\partial x = 0$ and $\partial H/\partial z = 0$ everywhere, giving $\dot\lambda_x = \dot\lambda_z = 0$. Both position costates are constants, fixed by their boundary values.
:::

::: check
Why is $\lambda_x$ zero for the whole burn, while $\lambda_z$ is in general not zero?
:::

::: answer
Transversality makes a free final state's costate zero at $t_f$. The downrange position $x(t_f)$ is free, so $\lambda_x(t_f) = 0$. Because $\lambda_x$ is constant through the burn (previous answer), that one end value makes it zero at every $t$, not only at the end. The altitude $z(t_f)$ is held to a target, so its costate is not forced to zero; instead it takes whatever constant value the altitude constraint requires.
:::

::: check
A learner repeats the derivation but fixes *both* $x(t_f)$ and $z(t_f)$ to target values, instead of leaving $x$ free. What happens to $\tan\beta$, and why is the shooting problem harder?
:::

::: answer
Now both position costates are generally nonzero, so both primer components are straight lines in $t$ with their own slopes. Then $\tan\beta = \lambda_{v_z}(t)/\lambda_{v_x}(t)$ is a ratio of two independently changing straight lines — in general not a straight line itself. There is no clean two-number law to use, so shooting must solve for more parameters (or the full nonlinear pitch history), not just $A$ and $B$. That is exactly why real guidance leaves the downrange coordinate (in the orbital problem, the position along the orbit) unconstrained: it is what buys the closed-form steering law.
:::

::: check
Explain why adding drag breaks the linear tangent law, using the costate equations rather than "the atmosphere is complicated".
:::

::: answer
The velocity costate equation is $\dot{\boldsymbol\lambda}_v = -\partial H/\partial\mathbf v$. Without drag, the only velocity terms in $H$ are $\lambda_x v_x + \lambda_z v_z$, which gives $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$, a constant. With drag, the motion $\dot{\mathbf v}$ depends on $\mathbf v$ itself, so $H$ gains a term $-\boldsymbol\lambda_v \cdot D(\mathbf v)\hat{\mathbf v}/m$. Differentiating that with respect to $\mathbf v$ adds extra terms to $\dot{\boldsymbol\lambda}_v$ that depend on the velocity and on the costates. The primer's rate of change is no longer constant, so its components are no longer straight lines in time, and the exact tangent law does not survive.
:::

::: check
In the shooting example the rocket reaches 2451.53 m/s, while its ideal capability is 3138.7 m/s. Does the 687.1 m/s gap prove the linear-tangent solution is not optimal?
:::

::: answer
No. The gap is 272.8 m/s of gravity loss plus 414.3 m/s of steering loss. Both come with the job itself: climbing 28.55 km while speeding up costs gravity loss for *any* trajectory, and arriving with this particular velocity vector in exactly 150 s, starting from rest, forces the thrust to point away from the velocity for much of the early burn. Optimal steering does not make losses vanish; it makes them as small as the end state allows. The linear tangent solution satisfies the minimum principle's conditions for this end state, so no other steering reaches it more cheaply.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\tan\beta$ | tangent of the thrust pitch angle: vertical push over horizontal push, like a road grade |
| Costate $\lambda$ | a state's "price tag": how much the final cost changes per unit nudge |
| $\boldsymbol\lambda_v$ | primer vector, the costate of velocity; optimal thrust points along $-\boldsymbol\lambda_v$ |
| $\partial H/\partial\beta = 0$ | Euler–Lagrange stationarity: $\tan\beta = \lambda_{v_z}/\lambda_{v_x}$ |
| $\dot{\boldsymbol\lambda}_v = -\boldsymbol\lambda_r$, $\dot{\boldsymbol\lambda}_r = 0$ | costate equations for uniform gravity, no drag — the primer vector is a straight line in time |
| $x(t_f)$ free $\Rightarrow \lambda_x \equiv 0$ | the free downrange coordinate makes the downrange primer component a true constant |
| $\tan\beta(t) = A + Bt$ | linear tangent steering law: a straight line over a constant is a straight line |
| Two-parameter shooting | fly with trial $(A,B)$, correct against the two final-velocity residuals by Newton's method |
| Worked example | $A=1.371108$, $B=-0.00596055$ hits $(v_x,v_z)=(2400,500)$ m/s from a 150 s fixed-thrust burn; gap to ideal = 272.8 gravity + 414.3 steering loss |
| One angle, two targets | constant pitch ($B=0$) hits only one velocity component in a fixed burn time, never both |
| Validity | exact for flat, uniform-gravity, drag-free flight; breaks under drag or position-dependent gravity |

The next lesson turns this exact but idealized result into a working onboard algorithm — Powered Explicit Guidance — and shows why re-solving it every cycle lets a locally flat approximation fly a real, curved-gravity ascent to orbit.

::: context tangent-grade Tangent is rise over run
Draw a right triangle under a ramp. The tangent of the ramp's angle is the height it rises divided by the distance it runs forward. For thrust, "rise" is the upward part of the push and "run" is the forward part, so $\tan\beta = \hat u_z/\hat u_x$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="60,120 300,120 300,40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 110 120 A 50 50 0 0 0 107.4 104.2" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="116" y="113" font-size="13" fill="#1f2a44">β</text>
  <text x="180" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">run: forward push</text>
  <text x="306" y="84" font-size="12" fill="#1f2a44">rise</text>
  <text x="150" y="72" font-size="12" fill="#1d6fd1">tan β = rise / run = 80/240</text>
</svg>
```

Here rise is 80 and run is 240, so $\tan\beta = 1/3$ and $\beta \approx 18.4^\circ$. An "8% grade" road sign is a tangent of 0.08.
:::

::: context costate-price Costates as price tags
Economists use "shadow prices" in exactly this sense: how much better or worse the final result gets per extra unit of some resource you hold right now. A costate is the shadow price of a state. If nudging your altitude up by a metre now would cut the propellant you need by 0.01 kg, altitude's price tag is about $-0.01$ kg per metre. The costate equations say how these prices change as time runs on, and the optimal control at each instant is the one that is best when judged at these prices.
:::

::: context hamiltonian-name Where the name comes from
The Hamiltonian is named after the Irish mathematician William Rowan Hamilton, who in the 1830s rewrote Newton's mechanics around a single function of positions and their paired "momenta". Optimal control borrowed his form, with the costates playing the role of momenta. Lev Pontryagin and his students in Moscow published the minimum principle (they wrote it as a maximum principle, with the opposite sign) in the late 1950s — just in time for the space age.
:::

::: context primer-name Why "primer"?
The British mathematician Derek Lawden, working out optimal rocket trajectories in the 1950s and 1960s, named this vector the primer vector: it primes, or sets up, the thrust direction. Many books define it as $\mathbf p = -\boldsymbol\lambda_v$, so that thrust points *along* the primer. This lesson keeps $\boldsymbol\lambda_v$ itself and says "opposite"; the physics is identical. When you read other sources, check the sign convention first.
:::

::: context affine-line Affine versus proportional
"Linear in time" in engineering talk usually means a straight line on a graph, $a + bt$. Mathematicians call that affine, and keep "linear" for lines through the origin, $bt$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="125" x2="330" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="125" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="125" x2="300" y2="45" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="40" y1="35" x2="300" y2="95" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="250" y="40" font-size="12" fill="#6c7a93">bt (through 0)</text>
  <text x="200" y="100" font-size="12" fill="#1d6fd1">a + bt</text>
  <text x="48" y="30" font-size="12" fill="#1d6fd1">a</text>
  <text x="325" y="142" font-size="12" text-anchor="end" fill="#1f2a44">t</text>
</svg>
```

The quiz and flashcards say "linear in time"; they mean the blue kind. The distinction matters in this lesson because an affine function divided by an affine function is generally not affine.
:::

::: context transversality The end is free, so its price is zero
Transversality conditions are the boundary rules of optimal control: for each final state, either you fix its value, or you leave it free and its costate must be zero at the end. You never get both. Think of it as balance: if the final downrange position could be changed at no cost, then the optimum cannot care about it, so its price tag at the end must be exactly zero. The name comes from geometry — the costate must be "transverse", at right angles, to the set of allowed end points.
:::

::: context shooting Aim, fire, correct
The name comes from artillery. You guess the barrel angle, fire, see how far off the shell lands, and correct the aim. Here the "barrel settings" are $A$ and $B$, the "landing point" is the final velocity, and Newton's method does the correcting from the measured miss.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="125" x2="345" y2="125" stroke="#6c7a93" stroke-width="2"/>
  <rect x="24" y="112" width="26" height="13" fill="#1f2a44"/>
  <path d="M 40 118 Q 130 10 220 125" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M 40 118 Q 190 -10 340 125" fill="none" stroke="#f2b880" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M 40 118 Q 170 0 300 125" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="300" y1="125" x2="300" y2="95" stroke="#b4232c" stroke-width="2"/>
  <polygon points="300,95 316,101 300,107" fill="#b4232c"/>
  <text x="215" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">short</text>
  <text x="300" y="142" font-size="11" text-anchor="middle" fill="#1d6fd1">hit</text>
  <text x="340" y="142" font-size="11" text-anchor="end" fill="#1f2a44">long</text>
</svg>
```
:::

::: context steering-loss Pushing a little sideways
Push a shopping cart straight ahead and all your effort speeds it up. Push it at an angle and part of your effort only turns it. A rocket's speed grows at $(T/m)\cos\delta$, where $\delta$ is the angle between thrust and velocity. Adding up the missing part, $\int (T/m)(1 - \cos\delta)\,dt$, gives the steering loss. With gravity loss it accounts exactly for the gap between ideal and achieved speed: $|\mathbf v_f| = v_e\ln(m_0/m_f) - \Delta v_{\text{steer}} - \Delta v_{\text{grav}}$ for a burn from rest.
:::

::: context peg-bridge Where this goes next
The Saturn V's Iterative Guidance Mode (lesson 6) and the Space Shuttle's Powered Explicit Guidance (lesson 4) both rest on this law. They do not solve it once. They re-solve for the steering constants every guidance cycle, a second or two apart, from the rocket's latest measured state, with gravity averaged over the remaining burn. Each solve treats the rest of the flight as locally flat; re-solving keeps that approximation honest as the path curves around the Earth.
:::
