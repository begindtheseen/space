---
id: l09-integral-action-servo-design
title: Integral action in state feedback — servo and augmented-state design
minutes: 18
covers:
  - "Integral action in state feedback: servo and augmented-state design"
---

Everything in this module so far has been a **[[regulator|regulator-servo]]** — a controller whose only job is to drive the state to zero. The law $\mathbf{u} = -\mathbf{K}\mathbf{x}$ pulls everything back to the origin and nowhere else. A real vehicle is asked for more. It has to hold a *commanded* attitude, not zero attitude. And it has to hold it against torques nobody commanded: sunlight pressing on a lopsided solar array, **[[gravity gradient|gravity-gradient]]**, a thruster mounted slightly crooked, air drag at low altitude, the Earth's magnetic field tugging on onboard currents. These disturbances do not go away, nobody knows them exactly in advance, and plain state feedback leaves a permanent pointing error when they are present.

Think of holding a heavy shopping bag at arm's length. Your arm sags a little until your muscles push back as hard as the bag pulls down. Plain state feedback is like that arm: it only pushes back when it is already off-target. What you want is a helper who notices "you have been low for a while" and adds more push until the sag is gone. That helper is **integral action**.

The classical control module did this with the I term of a PID controller: add up the error over time, and a steady error has nowhere to hide. The state-space version is the same idea, built into the structure. Add a new state that *is* the running total of the tracking error, put it in the state vector, and design one gain matrix for the bigger plant. Everything from Lesson 6 then applies unchanged, and the integral gain falls out of the same pole placement. This lesson measures the offset you get without integral action, builds the feedforward that fixes tracking but not disturbances, constructs the augmented-state servo, states when it can work, and then counts its two prices.

## The size of the offset

Take the spacecraft axis again: inertia $J = 120\,\mathrm{kg\,m^2}$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = (0,\ 1/J)^\mathsf{T}$, and Lesson 6's gain $\mathbf{K} = (2.4,\ 24)$ from poles at $-0.1(1\pm i)$. Call the two gains $k_1 = 2.4$ (on angle) and $k_2 = 24$ (on rate).

A constant disturbance torque $\tau_d$ enters through the same channel as the control. So the closed loop is

$$\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}\tau_d.$$

At the resting point nothing changes, so $\dot{\mathbf{x}} = \mathbf{0}$, and solving gives $\mathbf{x}_{ss} = -(\mathbf{A}-\mathbf{B}\mathbf{K})^{-1}\mathbf{B}\tau_d$. ("ss" is short for steady state.) Working out the $2\times2$ inverse,

$$\mathbf{x}_{ss} = \begin{pmatrix}\tau_d/k_1 \\ 0\end{pmatrix}, \qquad \theta_{ss} = \frac{\tau_d}{k_1}.$$

Read it physically. The vehicle tilts off-target until the angle gain $k_1$ produces a torque equal and opposite to the disturbance. It is a **[[spring balancing a steady force|spring-offset]]**, and a spring under load always stretches.

Put in a number. A gravity-gradient torque of $\tau_d = 10^{-4}\,\mathrm{N\,m}$ is realistic in low Earth orbit for a spacecraft whose inertias differ by a few hundred $\mathrm{kg\,m^2}$. Then

$$\theta_{ss} = \frac{10^{-4}}{2.4} = 4.17\times10^{-5}\,\mathrm{rad} = 8.59'',$$

forever. For a communications antenna that is nothing. For a telescope with an arcsecond requirement it is the whole error budget and more. Raising $k_1$ shrinks the offset in proportion, and Lesson 6 explained why you cannot raise it far.

## Reference feedforward, and what it does not fix

To follow a non-zero command $r$ (the **reference**), you need a feedforward path. Ask what resting point you want: a state $\mathbf{x}_{ss} = \mathbf{N}_x r$ and a command $\mathbf{u}_{ss} = \mathbf{N}_u r$ with $\dot{\mathbf{x}} = \mathbf{0}$ and $\mathbf{y} = r$. Those are two linear equations:

$$\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}\begin{pmatrix}\mathbf{N}_x\\\mathbf{N}_u\end{pmatrix} = \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}.$$

The top row says "the state stays still"; the bottom row says "the output equals the reference". The control law

$$\mathbf{u} = -\mathbf{K}(\mathbf{x} - \mathbf{N}_xr) + \mathbf{N}_ur$$

then holds the output at $r$ exactly — if the model is right.

For the spacecraft axis, with $\mathbf{C} = (1\ \ 0)$ and $\mathbf{D} = 0$, the square matrix is $\begin{pmatrix}0&1&0\\0&0&1/J\\1&0&0\end{pmatrix}$. Its determinant is $1/J \ne 0$, so it can be inverted. Solving gives $\mathbf{N}_x = (1,\ 0)^\mathsf{T}$ and $N_u = 0$. The reference enters through the angle gain, $u = -\mathbf{K}\mathbf{x} + k_1 r$ — what anyone would have written by hand.

Feedforward is worth having: it gives fast, well-damped tracking with no extra dynamics. But it fixes nothing about disturbances. $\mathbf{N}_x$ and $\mathbf{N}_u$ come from the model. A model error puts the resting point in the wrong place, and an unmodeled torque moves it again. Feedforward is open loop about exactly the thing you cannot predict.

## The augmented-state servo

Now the helper. Add a new state $\boldsymbol{\xi}$ (the Greek letter "xi", said "ksee" or "zai") whose rate of change is the tracking error:

::: key Integral action in state feedback
Augment the state with the integral of the tracking error, $\dot{\boldsymbol{\xi}} = \mathbf{r} - \mathbf{y}$, and design $\mathbf{K}$ on the augmented plant. This gives zero steady-state error to step disturbances, the state-space analog of the I term.
:::

So $\boldsymbol{\xi}$ is the running total of "how far short, for how long". Written out, with $\mathbf{y} = \mathbf{C}\mathbf{x}$, the bigger — **augmented** — plant is

$$\frac{d}{dt}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} = \underbrace{\begin{pmatrix}\mathbf{A}&\mathbf{0}\\-\mathbf{C}&\mathbf{0}\end{pmatrix}}_{\tilde{\mathbf{A}}}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} + \underbrace{\begin{pmatrix}\mathbf{B}\\\mathbf{0}\end{pmatrix}}_{\tilde{\mathbf{B}}}\mathbf{u} + \begin{pmatrix}\mathbf{0}\\\mathbf{I}\end{pmatrix}\mathbf{r}.$$

The tilde, as in $\tilde{\mathbf{A}}$ ("A tilde"), marks the augmented version. The control law is

$$\mathbf{u} = -\tilde{\mathbf{K}}\begin{pmatrix}\mathbf{x}\\\boldsymbol{\xi}\end{pmatrix} = -\mathbf{K}\mathbf{x} - \mathbf{K}_I\boldsymbol{\xi},$$

where $\mathbf{K}_I$ is the **integral gain**. Design $\tilde{\mathbf{K}}$ by any method from Lesson 6 on the pair $(\tilde{\mathbf{A}}, \tilde{\mathbf{B}})$. It has $n + p$ states, where $p$ is the number of outputs being tracked, so there are $n + p$ poles to place.

Why does this work? The argument is short, and it never uses the model. Suppose the closed loop is stable, and a constant disturbance and a constant reference are applied. Eventually everything settles and every rate of change goes to zero — including $\dot{\boldsymbol{\xi}}$. But $\dot{\boldsymbol{\xi}} = \mathbf{r}-\mathbf{y}$. So at rest, $\mathbf{y} = \mathbf{r}$ **exactly**.

No inverse was computed. No gain appeared. No property of $\mathbf{A}$, $\mathbf{B}$ or $\mathbf{C}$ was used. That is the **[[robustness of integral action|internal-model]]** in one line: all it needs is a stable loop and an integrator that can settle. A $20\,\%$ inertia error moves the poles. It does not change the fact that the steady error is zero.

### When the augmentation is controllable

Placing $n+p$ poles needs $(\tilde{\mathbf{A}}, \tilde{\mathbf{B}})$ to be controllable. That comes down to two conditions:

$$(\mathbf{A},\mathbf{B})\text{ controllable}, \qquad \operatorname{rank}\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = n + p.$$

The second is the same matrix the feedforward calculation had to invert. It says the plant has **[[no transmission zero at the origin|zero-at-origin]]**, in the sense Lesson 10 makes precise. The intuition: a zero at $s = 0$ means the plant blocks constant signals in some direction, and an integrator cannot steer something the plant refuses to pass. The rank condition also needs $m \ge p$ — at least as many inputs as tracked outputs. You cannot drive $p$ outputs to independent set points with fewer than $p$ independent actuators.

::: example A servo for the spacecraft axis
Augment the $J = 120$ axis with $\dot{\xi} = r - \theta$:

$$\tilde{\mathbf{A}} = \begin{pmatrix}0&1&0\\0&0&0\\-1&0&0\end{pmatrix}, \qquad \tilde{\mathbf{B}} = \begin{pmatrix}0\\1/120\\0\end{pmatrix} = \begin{pmatrix}0\\0.008333\\0\end{pmatrix}.$$

**Step 1: check controllability.** $\tilde{\mathbf{C}}_m = [\tilde{\mathbf{B}},\ \tilde{\mathbf{A}}\tilde{\mathbf{B}},\ \tilde{\mathbf{A}}^2\tilde{\mathbf{B}}]$ has columns $(0,\ 1/J,\ 0)$, $(1/J,\ 0,\ 0)$ and $(0,\ 0,\ -1/J)$. Each points along a different axis, so the rank is $3$. The second condition holds too: $\det\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&0\end{pmatrix} = 1/J = 8.333\times10^{-3} \ne 0$.

**Step 2: place three poles** at the same radius as before — the pair at $-0.1(1\pm i)$ and the new integrator pole at $-0.1$. Ackermann returns

$$\tilde{\mathbf{K}} = (4.8,\ \ 36,\ \ -0.24), \qquad \operatorname{eig}(\tilde{\mathbf{A}}-\tilde{\mathbf{B}}\tilde{\mathbf{K}}) = \{-0.1,\ -0.1\pm0.1i\}.$$

The angle gain went from $2.4$ to $4.8$ — doubled. The rate gain went from $24$ to $36$, one and a half times. That is the cost of adding a third pole at the same radius.

**About the minus sign on $K_I$.** It is bookkeeping, not a mistake. With $\dot{\xi} = r - y$, a lasting shortfall $y < r$ makes $\xi$ grow positive. Then $u = -\mathbf{K}\mathbf{x} - K_I\xi = -\mathbf{K}\mathbf{x} + 0.24\,\xi$ increases the torque — the direction that closes the gap.

**Step 3: apply the same $10^{-4}\,\mathrm{N\,m}$ disturbance.** At rest, $\theta_{ss} = 0$ exactly, and $\xi_{ss} = -4.167\times10^{-4}\,\mathrm{rad\,s}$. The resulting command is

$$u_{ss} = -K_I\xi_{ss} = -(-0.24)(-4.167\times10^{-4}) = -10^{-4}\,\mathrm{N\,m},$$

precisely canceling the disturbance. The integrator has *measured* the unknown torque and is holding it off. $\xi$ is a **[[disturbance estimator nobody designed|hidden-estimator]]**.

**Step 4: look at the transient.** Apply the disturbance as a sudden step with the vehicle at rest. The angle wanders out to a peak of $3.57''$ at $t = 15.7\,\mathrm{s}$, and is back inside $0.86''$ — a tenth of the regulator's offset — by about $t = 36.3\,\mathrm{s}$. The regulator, in contrast, sits at $8.59''$ forever.

For a step reference of $1^\circ$, the servo settles to $1.000000^\circ$ with no overshoot, entering the $2\,\%$ band at $43\,\mathrm{s}$. The peak torque is $9.08\times10^{-3}\,\mathrm{N\,m}$ — well inside a $0.2\,\mathrm{N\,m}$ wheel set. **Sanity check:** the servo's peak disturbance error ($3.57''$) is well under the regulator's permanent one ($8.59''$), as it should be once the integrator starts pushing back.
:::

## The two prices

**Price 1: an extra pole, and gains that grow.** Each tracked output adds a state and a pole. Putting the new pole at the same radius as the others doubled $k_1$ in the example. Pushing it faster raises the gains further. A good default: put the integrator pole at or a little inside the dominant pair — fast enough that the disturbance is canceled within a few settling times, slow enough that it does not demand gain.

**Price 2: conditional stability.** Integral action adds a pole at the origin to the loop transfer function. That changes the shape of the Nyquist plot in a basic way.

::: example The gain margin goes the wrong way
Break the loop at the plant input for both designs and compute the margins. The regulator's loop is

$$L(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = \frac{k_1 + k_2s}{Js^2}.$$

The servo's is

$$L(s) = \left(\mathbf{K} - \frac{K_I\mathbf{C}}{s}\right)(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = \frac{k_2s^2 + k_1s - K_I}{Js^3}.$$

| design | crossover | phase margin | gain margin |
| --- | --- | --- | --- |
| regulator | $0.220\,\mathrm{rad/s}$ | $65.5^\circ$ | unbounded above |
| servo | $0.308\,\mathrm{rad/s}$ | $65.0^\circ$ | unstable below $\times0.167$ ($-15.6\,\mathrm{dB}$) |

The phase margin hardly changes, and the crossover has moved out because the gains are bigger. But look at the servo's gain margin. Its loop has three poles at the origin, so its phase starts at $-270^\circ$. It climbs through $-180^\circ$ at $\omega = 0.082\,\mathrm{rad/s}$, where $|L| = 6.0$. The loop is **[[conditionally stable|conditional-stability]]**: it needs the gain to be *high enough*. Cut the gain to $1/6.0 \approx 0.167$ of nominal and it goes unstable.

Scaling $\tilde{\mathbf{K}}$ down confirms it. At $\times0.2$ the closed loop still has $\max\operatorname{Re}\lambda = -0.0037$ — barely stable. At $\times0.1$ it has $+0.0068$, and the vehicle diverges. The regulator, by contrast, is stable for every positive scaling of $\mathbf{K}$, from $\times0.01$ to $\times100$.

This is not a curiosity. An actuator that weakens, a wheel that saturates, a thruster running on low tank pressure, a scheduled gain applied at the wrong flight condition — all of these are effective gain *reductions*. On a conditionally stable loop, a gain reduction is the dangerous direction. Any design with integral action needs its margin checked below unit gain as well as above.
:::

::: warning Integral action and saturation: windup
While an actuator is saturated, the loop is effectively open. But $\xi$ keeps adding up an error the controller can do nothing about. By the time the vehicle comes back into range, $\xi$ holds a big value that has to be added back out, and that produces a long overshoot the other way. This is **[[windup|windup-word]]**.

The classical module's anti-windup schemes carry over directly: stop integrating while saturated, or feed back the difference between the commanded and the delivered command to bleed $\xi$ down. State space adds one more rule. If there is also an observer, feed it the command the actuator *delivered*, not the one you asked for — or Lesson 8's separation argument breaks at the same moment.
:::

::: note The other way: estimate the disturbance
Instead of adding up the error, you can add the disturbance itself to the state. Model $\tau_d$ as a constant, $\dot{\tau}_d = 0$. The augmented plant is

$$\dot{\tilde{\mathbf{x}}} = \begin{pmatrix}\mathbf{A}&\mathbf{B}_d\\\mathbf{0}&\mathbf{0}\end{pmatrix}\tilde{\mathbf{x}} + \begin{pmatrix}\mathbf{B}\\\mathbf{0}\end{pmatrix}\mathbf{u},$$

where $\mathbf{B}_d$ says how the disturbance enters. Build an observer for it — which needs the augmented pair to be detectable, a real observability question of the kind Lesson 5 handles — and feed the estimate forward: $\mathbf{u} = -\mathbf{K}\mathbf{x} - \hat{\tau}_d$.

Both approaches cancel the same steady error. The disturbance observer can be faster, because it does not have to wait for an integrator to wind up, and it hands you the disturbance as a number you can put in telemetry. The servo is simpler and needs no extra sensor geometry. Many flight systems carry both.
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
# regulator offset: 8.594366926962346 arcsec
# Ktilde = [[ 4.8  36.   -0.24]]
# servo offset: 0.0 arcsec;  u_ss = -0.00010000000000000002
```

## Check yourself

::: check
A launch vehicle pitch loop has $\mathbf{K}$ giving an angle gain of $k_1 = 4\times10^6\,\mathrm{N\,m/rad}$, and flies through a wind shear producing a constant aerodynamic torque of $2\times10^4\,\mathrm{N\,m}$. What is the steady-state attitude error without integral action, and does it matter?
:::

::: answer
Same argument as the spacecraft axis: the loop tilts until $k_1\theta$ balances the torque.

$$\theta_{ss} = \frac{\tau_d}{k_1} = \frac{2\times10^4}{4\times10^6} = 5\times10^{-3}\,\mathrm{rad} = 0.29^\circ.$$

Whether it matters depends on the phase of flight. Near maximum dynamic pressure, a third of a degree of attitude offset adds about a third of a degree of angle of attack on top of what the wind already produced, and that drives structural load. Many launch vehicles do **not** add integral action to the pitch loop during that phase, precisely because of the conditional-stability and windup issues above. They use drift-minimum or **[[load-relief|load-relief]]** gains instead, accepting an attitude offset in exchange for smaller loads. The state-space servo is the right tool for a spacecraft holding an attitude for hours. It is not automatically the right tool for sixty seconds of ascent.
:::

::: check
Show that the servo gives zero steady-state error without using the model, and say precisely what assumption the argument does need.
:::

::: answer
At a constant resting point every rate of change is zero, and one of the state equations is $\dot{\boldsymbol{\xi}} = \mathbf{r}-\mathbf{y}$. Setting $\dot{\boldsymbol{\xi}} = \mathbf{0}$ gives $\mathbf{y} = \mathbf{r}$ exactly, whatever $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$, $\mathbf{K}$ and the disturbance are.

The assumption: such a resting point is actually reached. That means the closed loop is asymptotically stable, nothing saturates, and the reference and disturbance really are constant. Against a ramp disturbance one integrator is not enough, and a constant error remains. Against a sinusoid at $\omega \ne 0$ the integrator's gain is finite there, so it does not remove the error.
:::

::: check
A two-axis gimbal is to track commanded azimuth and elevation with zero steady-state error, from two motor commands. How many states does the servo design have, and what would you check before starting?
:::

::: answer
Two tracked outputs means $p = 2$, so $\boldsymbol{\xi}$ has two entries. The plant itself is two copies of Lesson 1's three-state gimbal, so $n = 6$, and the augmented plant has $n + p = 8$ states.

Before starting, check:

- $m \ge p$: two motors for two outputs — satisfied;
- $(\mathbf{A},\mathbf{B})$ is controllable;
- $\operatorname{rank}\begin{pmatrix}\mathbf{A}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = n+p = 8$, meaning no transmission zero at the origin.

Then place eight poles, remembering that the two integrator poles are new and each one adds gain across the whole matrix.
:::

::: check
The servo loop above is unstable if the loop gain falls below $0.167$ of nominal. Name two physical situations that produce exactly that, and one design response.
:::

::: answer
First, actuator degradation: a wheel whose motor constant has dropped, a thruster at reduced tank pressure, a gimbal actuator that has lost one coil of a redundant winding. Second, and more common, saturation. While the actuator sits on its limit, the small-signal gain around the loop is effectively zero — far below $0.167$ — so the linear analysis says the loop is divergent in that regime. Gain scheduling applied at the wrong flight condition is a third.

The design response: check the low-gain end of the margin explicitly. If it is uncomfortable, move the integrator pole slower, which reduces the low-frequency phase penalty. Or use a disturbance-observer feedforward instead, which adds no pole at the origin to the loop and so no conditional stability.
:::

::: check
For the spacecraft servo, $\xi_{ss} = -4.167\times10^{-4}$ and $K_I = -0.24$. Confirm that the integrator is canceling the disturbance, and give the units of $\xi$ and $K_I$.
:::

::: answer
At rest $\mathbf{x}_{ss} = \mathbf{0}$, so only the integrator contributes:

$$u_{ss} = -K_I\xi_{ss} = -(-0.24)(-4.167\times10^{-4}) = -1.0\times10^{-4}\,\mathrm{N\,m}.$$

That is exactly the negative of the $+10^{-4}\,\mathrm{N\,m}$ disturbance. The net torque is zero, so the vehicle sits still, on target.

Units: $\xi$ is the time-integral of an angle error, so it is in $\mathrm{rad\,s}$. $K_I$ turns that into torque, so it is in $\mathrm{N\,m/(rad\,s)}$ — the same as $\mathrm{N\,m\,s^{-1}/rad}$, a stiffness per unit time, as an integral gain always is.
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
| Price 1 | $p$ extra poles; gains grow (here $k_1$ doubled, $k_2$ rose $1.5\times$) when the new pole sits at the same radius |
| Price 2 | conditional stability: the servo loop above diverges below $\times0.167$ gain |
| Windup | freeze or bleed $\boldsymbol{\xi}$ while saturated; feed the observer the delivered command |
| Alternative | augment with $\dot{\tau}_d = \mathbf{0}$, estimate $\hat\tau_d$, and feed it forward |

Every design in this module so far has treated the plant one loop at a time, even when the matrices were large. The next lesson looks at what really changes when there are several inputs and several outputs at once: how to measure gain that depends on direction, what a zero means for a matrix, and how to decide which actuator should chase which output.

::: context regulator-servo Regulators and servos
A **regulator** holds something at a fixed value — a thermostat regulates temperature. A **servo** follows a command that can change — a power-steering system follows the steering wheel. "Servo" is short for servomechanism, from the Latin *servus*, a servant: a machine that obeys a command signal. In state space the difference is only whether there is a reference $\mathbf{r}$ in the equations, but the design questions change: a regulator must reject disturbances, a servo must also track.
:::

::: context gravity-gradient Why gravity twists a spacecraft
Gravity weakens with distance from Earth. A long spacecraft's near end is pulled a little harder than its far end. Unless the spacecraft lines up exactly with the local vertical (or at right angles to it), that difference makes a small twisting torque that tries to point its long axis at the Earth. The torque grows with the difference between the spacecraft's inertias and falls off as the cube of orbital distance. In low orbit it is often in the range $10^{-5}$ to $10^{-3}\,\mathrm{N\,m}$ — tiny, but it never stops.
:::

::: context spring-offset A spring under a steady load
Hang a weight from a spring and it stretches until the spring's pull matches the weight. A stiffer spring stretches less, but it always stretches some. The angle gain $k_1$ is exactly this kind of spring, in torque per radian.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="10" height="80" fill="#6c7a93"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="30,60 60,60 70,45 85,75 100,45 115,75 130,45 145,75 160,45 170,60 190,60"/>
  <rect x="190" y="40" width="50" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="240" y1="60" x2="310" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="320,60 309,54 309,66" fill="#b4232c"/>
  <text x="275" y="50" font-size="12" text-anchor="middle" fill="#b4232c">τd</text>
  <line x1="160" y1="92" x2="190" y2="92" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="160" y1="86" x2="160" y2="98" stroke="#1f2a44" stroke-width="1"/>
  <line x1="190" y1="86" x2="190" y2="98" stroke="#1f2a44" stroke-width="1"/>
  <text x="175" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">stretch θss = τd / k1</text>
  <text x="100" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">spring k1</text>
</svg>
```

The marked gap is the extra stretch caused by the load: the offset that the spring alone can never remove.
:::

::: context internal-model Why the integrator must be inside the loop
Control theorists call this the **internal model principle**, set out by Bruce Francis and Murray Wonham in 1976: to cancel a disturbance exactly and robustly, the controller must contain a model of what generates it. A constant disturbance is generated by an integrator ($\dot{\tau}_d = 0$), so the controller needs an integrator. A ramp needs two. A sinusoid at frequency $\omega$ needs an oscillator at $\omega$. That is why one integrator beats steps but not ramps or vibrations.
:::

::: context zero-at-origin A zero that blocks constants
A transmission zero at $s = 0$ means some constant input produces no steady output at all — the plant "differentiates" in that direction. An example: a mass tied to a wall by a spring, pushed by a force, with its velocity as the output. Hold the force steady and the mass settles at a new position, with zero velocity. If the plant cannot pass a constant to the output, no constant command can hold that output away from zero, and the integrator would wind up forever. Lesson 10 defines transmission zeros for MIMO plants properly.
:::

::: context hidden-estimator The integrator as a torque gauge
At rest, the only thing holding the spacecraft still is $-K_I\xi$, and it must equal $-\tau_d$. So $\xi_{ss} = \tau_d/K_I$, and reading the integrator state tells you the disturbance torque. That makes it useful in telemetry: a slow change in an integrator state over an orbit tracks the environmental torques acting on the vehicle, and a sudden jump points to something new pushing on it, such as a leak or a stuck mechanism.
:::

::: context conditional-stability Stable only in the middle
The real part of the rightmost closed-loop pole — the slowest mode — plotted against how much the whole gain is scaled. Below the dashed zero line is stable. The regulator (gray) stays stable at every gain. The servo (blue) crosses into instability when the gain drops below $1/6$ of nominal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="25" x2="50" y2="182" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="182" x2="340" y2="182" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="40.5" x2="340" y2="40.5" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4,3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="44">0</text><text x="44" y="114">−0.1</text><text x="44" y="184">−0.2</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="196">×0.01</text><text x="146.7" y="196">×0.1</text><text x="243.3" y="196">×1</text><text x="330" y="196">×10</text>
  </g>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="50.0,41.2 59.7,41.3 69.3,41.6 79.0,41.9 88.7,42.2 98.3,42.7 108.0,43.2 117.7,44.0 127.3,44.9 137.0,46.0 146.7,47.4 156.3,49.2 166.0,51.5 175.7,54.4 185.3,58.0 195.0,62.5 204.7,68.2 214.3,75.4 224.0,84.5 233.7,95.9 243.3,110.2 253.0,128.3 262.7,151.0 272.3,179.7 277.2,145.7 286.8,131.1 296.5,124.5 306.2,120.5 315.8,117.9 325.5,116.0 340.0,114.1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,33.4 59.7,33.2 69.3,32.9 79.0,32.7 88.7,32.6 98.3,32.6 108.0,32.8 117.7,33.1 127.3,33.6 137.0,34.5 146.7,35.7 156.3,37.5 166.0,39.8 175.7,43.0 185.3,47.2 195.0,52.7 204.7,59.7 214.3,68.7 224.0,80.0 233.7,94.1 243.3,110.2 248.2,117.1 253.0,114.7 262.7,102.1 272.3,96.9 282.0,94.0 291.7,92.1 301.3,90.9 311.0,89.9 320.7,89.3 330.3,88.7 340.0,88.4"/>
  <circle cx="168.1" cy="40.5" r="3.5" fill="#b4232c"/>
  <text x="120" y="22" font-size="11" fill="#b4232c">unstable left of ×1/6</text>
  <text x="185" y="80" font-size="11" fill="#1d6fd1">servo</text>
  <text x="275" y="140" font-size="11" fill="#6c7a93">regulator</text>
</svg>
```
:::

::: context windup-word Why it is called windup
Picture winding a clock spring while the clock's hands are held still. Energy piles up in the spring, and when you let go the hands spin far past where they should stop. An integrator behind a saturated actuator is the same: it keeps "winding" on an error it cannot act on, and releases it all as overshoot once the actuator comes off its limit.
:::

::: context load-relief What load relief does
During the high-drag part of ascent, a gust hitting a rocket side-on raises its angle of attack, and that bends the vehicle. A load-relief controller deliberately lets the rocket turn *into* the wind, trading a small attitude or trajectory error for a smaller angle of attack and lower bending load. An integrator fighting to hold attitude exactly would do the opposite, holding the vehicle broadside to the gust. The guidance system cleans up the resulting drift later in flight, when loads are low.
:::
