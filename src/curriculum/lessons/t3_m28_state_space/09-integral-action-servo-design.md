---
id: l09-integral-action-servo-design
title: Integral action in state feedback — servo and augmented-state design
minutes: 19
covers:
  - "Integral action in state feedback: servo and augmented-state design"
---

Everything in this module so far has been a **regulator**: $\mathbf{u} = -\mathbf{K}\mathbf{x}$ drives the state to zero and nowhere else. A real vehicle is asked for more than that. It has to hold a commanded attitude, not zero attitude, and it has to hold it against torques nobody commanded — solar radiation pressure on an asymmetric array, gravity gradient, a thruster with a residual misalignment, aerodynamic torque at low altitude, magnetic dipole interaction. Those disturbances do not go away, they are not well known in advance, and a plain state feedback leaves a permanent pointing offset in their presence.

The classical control module's answer was the integral term of a PID controller: integrate the error and the steady-state error has nowhere to hide. The state-space answer is the same idea expressed structurally. Add a new state that *is* the integral of the tracking error, put it in the state vector, and design one gain matrix on the enlarged plant. Everything from Lesson 6 then applies unchanged, and the integral gain comes out of the same pole placement as the rest.

This lesson shows exactly how big the offset is without integral action, builds the reference feedforward that fixes tracking but not disturbance rejection, constructs the augmented-state servo, states the controllability condition the augmentation needs, and finishes with the two prices integral action charges: an extra pole to place, and a loop that becomes conditionally stable.

## The size of the offset

Take the single spacecraft axis with $J = 120\,\mathrm{kg\,m^2}$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = (0,\ 1/J)^\mathsf{T}$, and Lesson 6's gain $\mathbf{K} = (2.4,\ 24)$ from poles at $-0.1(1\pm i)$. A constant disturbance torque $\tau_d$ enters through the same channel as the control, so the closed loop is $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}\tau_d$ and the equilibrium is $\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}\tau_d$. Working out the inverse for this $2\times2$ case,

$$\mathbf{x}_{ss} = \begin{pmatrix}\tau_d/k_1 \\ 0\end{pmatrix}, \qquad \theta_{ss} = \frac{\tau_d}{k_1}.$$

The physical reading is immediate: the loop tilts off-target until the position gain $k_1$ produces a torque equal and opposite to the disturbance. It is a spring balancing a constant force, and a spring always deflects.

A gravity-gradient torque of $\tau_d = 10^{-4}\,\mathrm{N\,m}$ is a realistic number for a spacecraft with a few hundred $\mathrm{kg\,m^2}$ of inertia difference in low Earth orbit. It gives $\theta_{ss} = 10^{-4}/2.4 = 4.17\times10^{-5}\,\mathrm{rad} = 8.59''$, permanently. For a communications antenna that is nothing; for an imaging payload with an arcsecond requirement it is the whole budget and more. Raising $k_1$ shrinks the offset in proportion, and Lesson 6 explained why you cannot raise it far.

## Reference feedforward, and what it does not fix

Tracking a non-zero reference $r$ needs a feedforward path. Ask what steady state you want: $\mathbf{x}_{ss} = \mathbf{N}_x r$ and $\mathbf{u}_{ss} = \mathbf{N}_u r$ with $\dot{\mathbf{x}} = \mathbf{0}$ and $\mathbf{y} = r$. Those are two linear equations,

$$\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}\begin{pmatrix}\mathbf{N}_x\\\mathbf{N}_u\end{pmatrix} = \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix},$$

and the control law $\mathbf{u} = -\mathbf{K}(\mathbf{x} - \mathbf{N}_xr) + \mathbf{N}_ur$ then holds the output at $r$ exactly. For the spacecraft axis the square system matrix is $\begin{pmatrix}0&1&0\\0&0&1/J\\1&0&0\end{pmatrix}$, whose determinant is $1/J \ne 0$, and solving gives $\mathbf{N}_x = (1,\ 0)^\mathsf{T}$ and $N_u = 0$ — the reference enters through the position gain, $u = -\mathbf{K}\mathbf{x} + k_1 r$, which is what anyone would have written by hand.

Feedforward is worth having: it gives fast, well-damped tracking with no extra dynamics. It also fixes nothing about disturbances. $\mathbf{N}_x$ and $\mathbf{N}_u$ are computed from the model, so a model error puts the steady state in the wrong place, and an unmodelled torque puts it somewhere else again. Feedforward is open loop about the thing you cannot predict.

## The augmented-state servo

Add a state whose derivative is the tracking error:

::: key Integral action in state feedback
Augment the state with the integral of the tracking error, $\dot{\boldsymbol{\xi}} = \mathbf{r} - \mathbf{y}$, and design $\mathbf{K}$ on the augmented plant. This gives zero steady-state error to step disturbances, the state-space analogue of the I term.
:::

Written out, with $\mathbf{y} = \mathbf{C}\mathbf{x}$, the augmented plant is

$$\frac{d}{dt}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} = \underbrace{\begin{pmatrix}\mathbf{A}&\mathbf{0}\\-\mathbf{C}&\mathbf{0}\end{pmatrix}}_{\tilde{\mathbf{A}}}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} + \underbrace{\begin{pmatrix}\mathbf{B}\\\mathbf{0}\end{pmatrix}}_{\tilde{\mathbf{B}}}\mathbf{u} + \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}\mathbf{r},$$

and the control law is $\mathbf{u} = -\tilde{\mathbf{K}}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} = -\mathbf{K}\mathbf{x} - \mathbf{K}_I\boldsymbol{\xi}$. Design $\tilde{\mathbf{K}}$ by any method from Lesson 6 on the pair $(\tilde{\mathbf{A}}, \tilde{\mathbf{B}})$, which now has $n + p$ states, so there are $n + p$ poles to place.

The argument for why this works is short and does not depend on the model at all. Suppose the closed loop is stable and a constant disturbance and constant reference are applied. Then every derivative goes to zero, including $\dot{\boldsymbol{\xi}}$, and $\dot{\boldsymbol{\xi}} = \mathbf{r}-\mathbf{y} = \mathbf{0}$ means $\mathbf{y} = \mathbf{r}$ **exactly**. No inverse was computed, no gain appeared, and no property of $\mathbf{A}$, $\mathbf{B}$ or $\mathbf{C}$ was used. That is the robustness of integral action in one line: the only thing it needs is that the loop is stable and the integrator state settles. A $20\,\%$ inertia error changes where the poles are, and does not change the fact that the steady-state error is zero.

### When the augmentation is controllable

Placing $n+p$ poles requires $(\tilde{\mathbf{A}}, \tilde{\mathbf{B}})$ to be controllable, and that is two conditions:

$$(\mathbf{A},\mathbf{B})\text{ controllable}, \qquad \operatorname{rank}\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = n + p.$$

The second is the same matrix that the feedforward calculation needed to invert, and it has a name: it says the plant has **no transmission zero at the origin**, in the sense Lesson 10 makes precise. The reason is intuitive — a zero at $s = 0$ means the plant blocks constant signals in some direction, and an integrator cannot control something the plant refuses to pass. It also requires $m \ge p$: you cannot drive $p$ outputs to independent set points with fewer than $p$ independent actuators.

::: example A servo for the spacecraft axis
Augmenting the $J = 120$ axis with $\dot{\xi} = r - \theta$ gives

$$\tilde{\mathbf{A}} = \begin{pmatrix}0&1&0\\0&0&0\\-1&0&0\end{pmatrix}, \qquad \tilde{\mathbf{B}} = \begin{pmatrix}0\\1/120\\0\end{pmatrix} = \begin{pmatrix}0\\0.008333\\0\end{pmatrix}.$$

Check controllability first: $\tilde{\mathbf{C}}_m = [\tilde{\mathbf{B}},\ \tilde{\mathbf{A}}\tilde{\mathbf{B}},\ \tilde{\mathbf{A}}^2\tilde{\mathbf{B}}]$ has columns $(0,\ 1/J,\ 0)$, $(1/J,\ 0,\ 0)$ and $(0,\ 0,\ -1/J)$, so its rank is $3$. The second condition holds too: $\det\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&0\end{pmatrix} = 1/J = 8.333\times10^{-3} \ne 0$.

Place three poles at the same radius as before — the complex pair at $-0.1(1\pm i)$ and the new integrator pole at $-0.1$ — and Ackermann returns

$$\tilde{\mathbf{K}} = (4.8,\ \ 36,\ \ -0.24), \qquad \operatorname{eig}(\tilde{\mathbf{A}}-\tilde{\mathbf{B}}\tilde{\mathbf{K}}) = \{-0.1,\ -0.1\pm0.1i\}.$$

The position and rate gains have exactly doubled relative to the regulator, which is the cost of adding a third pole at the same radius. The sign of $K_I$ is bookkeeping, not an error: with $\dot{\xi} = r - y$, a persistent shortfall $y < r$ makes $\xi$ grow positive, and $\mathbf{u} = -\mathbf{K}\mathbf{x} - K_I\xi = -\mathbf{K}\mathbf{x} + 0.24\,\xi$ then increases the torque, which is the direction that closes the gap.

Apply the same $10^{-4}\,\mathrm{N\,m}$ disturbance. The steady state now has $\theta_{ss} = 0$ identically and $\xi_{ss} = -4.167\times10^{-4}\,\mathrm{rad\,s}$, and the resulting command is $u_{ss} = -K_I\xi_{ss} = -10^{-4}\,\mathrm{N\,m}$ — precisely cancelling the disturbance. The integrator has measured the unknown torque and is holding it off; $\xi$ is a disturbance estimator that nobody designed.

The transient is worth looking at. Applying the disturbance as a step from rest, the attitude wanders out to a peak of $3.57''$ at $t = 15.7\,\mathrm{s}$ and is back inside $0.86''$ by $t = 36.2\,\mathrm{s}$. Compare the regulator, which sits at $8.59''$ forever. For a step reference of $1^\circ$, the servo settles to $1.000000^\circ$ with no overshoot, reaching $2\,\%$ at $43\,\mathrm{s}$, and the peak torque is $9.08\times10^{-3}\,\mathrm{N\,m}$ — well inside a $0.2\,\mathrm{N\,m}$ wheel set.
:::

## The two prices

**An extra pole, and gains that grow.** Each integrated output adds a state and a pole. Placing the new pole at the same radius as the others raised $k_1$ and $k_2$ by a factor of two in the example; pushing it faster raises them further. Place the integrator pole at or slightly inside the dominant pair — fast enough that the disturbance is nulled within a few settling times, slow enough that it does not demand gain.

**Conditional stability.** Integral action puts an extra pole at the origin in the loop transfer function, and that changes the shape of the Nyquist plot qualitatively.

::: example The gain margin goes the wrong way
Break the loop at the plant input for both designs and compute the margins. The regulator's loop is $L(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = (k_1 + k_2s)/(Js^2)$; the servo's is $L(s) = (\mathbf{K} - K_I\mathbf{C}/s)(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = (k_2s^2 + k_1s - K_I)/(Js^3)$.

| design | crossover | phase margin | gain margin |
| --- | --- | --- | --- |
| regulator | $0.220\,\mathrm{rad/s}$ | $65.5^\circ$ | unbounded above |
| servo | $0.308\,\mathrm{rad/s}$ | $65.0^\circ$ | unstable below $\times0.167$ ($-15.6\,\mathrm{dB}$) |

The phase margin is essentially unchanged, and the crossover has moved out because the gains are larger. But the servo's loop has three poles at the origin, so its phase starts at $-270^\circ$ and climbs through $-180^\circ$ at $\omega = 0.082\,\mathrm{rad/s}$, where $|L| = 6.0$. The loop is **conditionally stable**: it needs the gain to be *high enough*. Scaling $\tilde{\mathbf{K}}$ down confirms it — at $\times0.2$ the closed loop still has $\max\operatorname{Re}\lambda = -0.0037$, at $\times0.1$ it has $+0.0068$, and the vehicle diverges. The regulator, by contrast, is stable for every positive scaling of $\mathbf{K}$, from $\times0.01$ to $\times100$.

This is not a curiosity. An actuator that de-rates, a wheel that saturates, a thruster running at reduced supply pressure, a scheduled gain applied to the wrong flight condition — all of these are effective gain reductions, and on a conditionally stable loop a gain reduction is the dangerous direction. Any design with integral action needs its margin checked below unity gain as well as above.
:::

::: warning Integral action and saturation: windup
While an actuator is saturated the loop is open, and $\xi$ keeps integrating an error the controller cannot do anything about. By the time the vehicle comes back into range, $\xi$ holds a large value that must be integrated back out, producing a long overshoot in the wrong direction. The classical control module's anti-windup schemes carry over directly: stop integrating while saturated, or feed back the difference between the commanded and the delivered command to bleed $\xi$ down. In state space there is one extra thing to do — if there is also an observer, feed it the command the actuator *delivered*, not the command you asked for, or Lesson 8's separation argument breaks at the same moment.
:::

::: note The other way: estimate the disturbance
An alternative to integrating the error is to add the disturbance itself to the state. Model $\tau_d$ as a constant, $\dot{\tau}_d = 0$, giving the augmented plant $\dot{\tilde{\mathbf{x}}} = \begin{pmatrix}\mathbf{A}&\mathbf{B}_d\\\mathbf{0}&\mathbf{0}\end{pmatrix}\tilde{\mathbf{x}} + \begin{pmatrix}\mathbf{B}\\\mathbf{0}\end{pmatrix}\mathbf{u}$, build an observer for it — which needs the augmented pair to be detectable, a genuine observability question of the kind Lesson 5 handles — and feed the estimate forward as $\mathbf{u} = -\mathbf{K}\mathbf{x} - \hat{\tau}_d$. The two approaches null the same steady-state error; the disturbance observer can be faster, because it does not have to wait for an integrator to wind up, and it tells you the disturbance as a number you can put in telemetry. The servo is simpler and needs no extra sensor geometry. Many flight systems carry both.
:::

```python
import numpy as np

def ctrb(A, B):
    return np.hstack([np.linalg.matrix_power(A, j) @ B for j in range(A.shape[0])])

def ackermann(A, B, poles):
    n = A.shape[0]
    P = np.zeros((n, n))
    for c in np.poly(np.asarray(poles, complex)).real:
        P = P @ A + c * np.eye(n)
    e_n = np.zeros((1, n)); e_n[0, -1] = 1.0
    return e_n @ np.linalg.inv(ctrb(A, B)) @ P

J, a, tau_d = 120.0, 0.1, 1e-4
A = np.array([[0.0, 1], [0, 0]]); B = np.array([[0.0], [1 / J]]); C = np.array([[1.0, 0]])
K = np.array([[2 * a * a * J, 2 * a * J]])
print("regulator offset:", np.rad2deg(-np.linalg.inv(A - B @ K) @ B * tau_d)[0, 0] * 3600, "arcsec")

At = np.block([[A, np.zeros((2, 1))], [-C, np.zeros((1, 1))]])
Bt = np.vstack([B, [[0.0]]])
Kt = ackermann(At, Bt, [-a + 1j * a, -a - 1j * a, -a])
xss = -np.linalg.inv(At - Bt @ Kt) @ np.vstack([B, [[0.0]]]) * tau_d
print("Ktilde =", np.round(Kt, 4))
print("servo offset:", np.rad2deg(xss[0, 0]) * 3600, "arcsec;  u_ss =", float(-(Kt @ xss)[0, 0]))
# regulator offset: 8.594366926962348 arcsec
# Ktilde = [[ 4.8  36.   -0.24]]
# servo offset: 0.0 arcsec;  u_ss = -0.00010000000000000002
```

## Check yourself

::: check
A launch vehicle pitch loop has $\mathbf{K}$ giving a position gain of $k_1 = 4\times10^6\,\mathrm{N\,m/rad}$, and flies through a wind shear producing a constant aerodynamic torque of $2\times10^4\,\mathrm{N\,m}$. What is the steady-state attitude error without integral action, and does it matter?
:::

::: answer
By the same argument as the spacecraft axis, the offset is $\theta_{ss} = \tau_d/k_1 = 2\times10^4/4\times10^6 = 5\times10^{-3}\,\mathrm{rad} = 0.29^\circ$. Whether that matters depends on the phase of flight: a third of a degree of attitude offset while flying through maximum dynamic pressure means a third of a degree of angle of attack added to whatever the wind already produced, which drives structural load. Launch vehicles typically do **not** add integral action in the pitch loop during that phase precisely because of the conditional-stability and windup issues above — they use drift-minimum or load-relief gains instead, accepting the attitude offset in exchange for smaller loads. The state-space servo is the right tool for a spacecraft holding an attitude for hours; it is not automatically the right tool for sixty seconds of ascent.
:::

::: check
Show that the servo gives zero steady-state error without using the model, and say precisely what assumption the argument does need.
:::

::: answer
At a constant equilibrium every derivative vanishes, and one of the state equations is $\dot{\boldsymbol{\xi}} = \mathbf{r}-\mathbf{y}$. Setting $\dot{\boldsymbol{\xi}} = \mathbf{0}$ gives $\mathbf{y} = \mathbf{r}$ exactly, whatever $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$, $\mathbf{K}$ and the disturbance are. The assumption is that such an equilibrium is reached — that the closed loop is asymptotically stable and nothing saturates — and that the reference and the disturbance really are constant. Against a ramp disturbance one integrator is not enough and a constant error remains; against a sinusoid at $\omega \ne 0$ the integrator provides no help at all, because its gain there is finite.
:::

::: check
A two-axis gimbal is to track commanded azimuth and elevation with zero steady-state error, from two motor commands. How many states does the servo design have, and what would you check before starting?
:::

::: answer
Two outputs means $p = 2$, so $\boldsymbol{\xi} \in \mathbb{R}^2$ and the augmented plant has $n + 2$ states, where $n$ is the per-axis model dimension times two — six states for the three-state gimbal model of Lesson 1 on each axis, so eight in total. Before starting, check $m \ge p$ (two motors for two outputs: satisfied), check that $(\mathbf{A},\mathbf{B})$ is controllable, and check $\operatorname{rank}\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = n+p = 8$, which says the plant has no transmission zero at the origin. Then place eight poles, remembering that the two integrator poles are new and that each of them adds gain to the whole matrix.
:::

::: check
The servo loop above is unstable if the loop gain falls below $0.167$ of nominal. Name two physical situations that produce exactly that, and one design response.
:::

::: answer
First, actuator degradation: a wheel whose motor constant has dropped, a thruster at reduced tank pressure, a gimbal actuator with a failed coil in a redundant winding. Second, and more common, saturation — while the actuator is on its limit, the incremental gain around the loop is effectively zero, which is well below $0.167$, so the system is operating in a regime where the linear analysis says it is divergent. Gain scheduling applied at the wrong flight condition is a third. The design response is to check the low-gain end of the margin explicitly and, if it is uncomfortable, to move the integrator pole slower (reducing the low-frequency phase penalty), or to use a disturbance-observer feedforward instead, which adds no pole at the origin in the loop and therefore no conditional stability.
:::

::: check
For the spacecraft servo, $\xi_{ss} = -4.167\times10^{-4}$ and $K_I = -0.24$. Confirm that the integrator is cancelling the disturbance, and give the units of $\xi$ and $K_I$.
:::

::: answer
At steady state $\mathbf{x}_{ss} = \mathbf{0}$ so $u_{ss} = -K_I\xi_{ss} = -(-0.24)(-4.167\times10^{-4}) = -1.0\times10^{-4}\,\mathrm{N\,m}$, exactly the negative of the $+10^{-4}\,\mathrm{N\,m}$ disturbance: the net torque on the vehicle is zero and it sits still, on target. Units: $\xi$ is the time integral of an angle error, so $\mathrm{rad\,s}$; $K_I$ converts that into torque, so $\mathrm{N\,m/(rad\,s)}$, which is the same as $\mathrm{N\,m\,s^{-1}/rad}$ — a stiffness per unit time, as an integral gain always is.
:::

## Summary

| Item | Statement |
| --- | --- |
| Regulator offset | constant $\tau_d$ through $\mathbf{B}$ gives $\theta_{ss} = \tau_d/k_1$; a spring always deflects |
| Feedforward | $\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}\begin{pmatrix}\mathbf{N}_x\\\mathbf{N}_u\end{pmatrix} = \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}$, $\mathbf{u} = -\mathbf{K}(\mathbf{x}-\mathbf{N}_x\mathbf{r})+\mathbf{N}_u\mathbf{r}$; tracking only |
| Servo augmentation | $\dot{\boldsymbol{\xi}} = \mathbf{r}-\mathbf{y}$; $\tilde{\mathbf{A}} = \begin{pmatrix}\mathbf{A}&\mathbf{0}\\-\mathbf{C}&\mathbf{0}\end{pmatrix}$, $\tilde{\mathbf{B}} = \begin{pmatrix}\mathbf{B}\\\mathbf{0}\end{pmatrix}$, $\mathbf{u} = -\mathbf{K}\mathbf{x}-\mathbf{K}_I\boldsymbol{\xi}$ |
| Why it works | at equilibrium $\dot{\boldsymbol{\xi}} = \mathbf{0}$ forces $\mathbf{y} = \mathbf{r}$, model-free |
| Condition | $(\mathbf{A},\mathbf{B})$ controllable **and** $\operatorname{rank}\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = n+p$ (no transmission zero at the origin), with $m \ge p$ |
| Worked gains | $\tilde{\mathbf{K}} = (4.8,\ 36,\ -0.24)$ for poles $\{-0.1,\ -0.1\pm0.1i\}$; offset $8.59'' \to 0$ |
| Price 1 | $p$ extra poles; gains roughly double when the new pole sits at the same radius |
| Price 2 | conditional stability: the servo loop above diverges below $\times0.167$ gain |
| Windup | freeze or bleed $\boldsymbol{\xi}$ while saturated; feed the observer the delivered command |
| Alternative | augment with $\dot{\tau}_d = \mathbf{0}$, estimate $\hat\tau_d$, and feed it forward |

Every design in this module so far has treated the plant one loop at a time, even when the matrices were large. The next lesson looks at what genuinely changes when there are several inputs and several outputs at once: how to measure directional gain, what a zero means for a matrix, and how to decide which actuator should chase which output.
