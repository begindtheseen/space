---
id: l08-the-separation-principle
title: The separation principle and exactly when it holds
minutes: 20
covers:
  - The separation principle and the exact conditions under which it holds
---

Lesson 6 designed a gain $\mathbf{K}$ as if the whole state were on hand. Lesson 7 built an observer that supplies a guess $\hat{\mathbf{x}}$, which homes in on the state but is not the state. The obvious move is to wire them together and fly $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$. The obvious worry comes with it. During every transient, the controller is being fed the wrong numbers. Surely the closed-loop poles are no longer where either design put them?

They are exactly where the designs put them. Picture two people on a tandem bicycle: one steers, one pedals. You might expect each to upset the other's work. Here, for an exact linear model, they do not. The closed loop has $2n$ eigenvalues, and they are precisely the $n$ eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ plus the $n$ eigenvalues of $\mathbf{A}-\mathbf{L}\mathbf{C}$. Nothing moves. This is the **separation principle** — the fact that controller and observer poles can be chosen separately. It is why the last two lessons could each be done on their own.

It is also one of the most over-claimed results in control. It is a statement about pole locations. People read it as a statement about performance and robustness, and it is neither. This lesson derives it with the right choice of coordinates, checks it with numbers, lists the conditions it needs one at a time, and then breaks them: a model error that destroys the structure outright, and the margin question, where the principle stays silent even when it holds perfectly.

## The derivation: track the error, not the guess

Write the plant and the observer with $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ plugged in:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}}, \qquad \dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}} + \mathbf{L}\left(\mathbf{C}\mathbf{x} - \mathbf{C}\hat{\mathbf{x}}\right).$$

Stack $\mathbf{x}$ and $\hat{\mathbf{x}}$ into one column of $2n$ numbers. The $2n\times2n$ matrix you get has something in every block, and its eigenvalues are not obvious at all.

The trick is to keep track of different things. Instead of the truth and the guess, track the truth and the *error*, $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$. This is a change of coordinates — a **[[similarity transform|similarity-bridge]]** with $\mathbf{T}^{-1} = \begin{pmatrix}\mathbf{I}&\mathbf{0}\\\mathbf{I}&-\mathbf{I}\end{pmatrix}$ — so by Lesson 2 the eigenvalues do not change. It is the same machine described with different numbers.

Put $\hat{\mathbf{x}} = \mathbf{x} - \mathbf{e}$ into the plant equation and multiply out:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}(\mathbf{x}-\mathbf{e}) = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}\mathbf{K}\mathbf{e}.$$

Lesson 7 already gave the error equation, $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$. Stack the two:

$$\frac{d}{dt}\begin{pmatrix}\mathbf{x}\\\mathbf{e}\end{pmatrix} = \begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0} & \mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}\begin{pmatrix}\mathbf{x}\\\mathbf{e}\end{pmatrix}.$$

Look at the bottom-left block: zero. The state does not feed into the estimation error. A matrix with zeros everywhere below its diagonal blocks is **[[block upper triangular|block-triangular]]**.

Here is why that settles it, in plain terms. Suppose the error starts at zero. Its equation has nothing driving it, so it stays zero, and the state moves exactly as full state feedback would: the modes of $\mathbf{A}-\mathbf{B}\mathbf{K}$. Now suppose the error starts non-zero. It dies out through the modes of $\mathbf{A}-\mathbf{L}\mathbf{C}$, whatever the state is doing. Those two sets of modes are all there is. The characteristic polynomial splits into two factors, and the spectrum is the union.

::: note Why it has to be true: the determinant splits
For a block-triangular matrix, $\det\begin{pmatrix}\mathbf{P}&\mathbf{Q}\\\mathbf{0}&\mathbf{R}\end{pmatrix} = \det\mathbf{P}\,\det\mathbf{R}$ when $\mathbf{P}$ and $\mathbf{R}$ are square. When $\mathbf{P}$ is invertible, one way to see it is to factor

$$\begin{pmatrix}\mathbf{P}&\mathbf{Q}\\\mathbf{0}&\mathbf{R}\end{pmatrix} = \begin{pmatrix}\mathbf{P}&\mathbf{0}\\\mathbf{0}&\mathbf{I}\end{pmatrix}\begin{pmatrix}\mathbf{I}&\mathbf{P}^{-1}\mathbf{Q}\\\mathbf{0}&\mathbf{R}\end{pmatrix}.$$

The first factor has determinant $\det\mathbf{P}$. The second, expanded down its first columns (each has a single $1$ on the diagonal), has determinant $\det\mathbf{R}$. The determinant of a product is the product of determinants. (If $\mathbf{P}$ is singular, both sides are zero.) Apply this to $s\mathbf{I} - \mathbf{M}$:

$$\det(s\mathbf{I}-\mathbf{M}) = \det\left(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}\right)\,\det\left(s\mathbf{I}-\mathbf{A}+\mathbf{L}\mathbf{C}\right).$$

A polynomial that factors has, as roots, the roots of each factor.
:::

::: key Separation principle
For an exact LTI model, the observer-based closed-loop spectrum is exactly $\operatorname{eig}(\mathbf{A}-\mathbf{B}\mathbf{K}) \cup \operatorname{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$. It fixes **poles** only — it guarantees nothing about margins (see LQG).
:::

Read $\cup$ as "union": the two lists put together.

::: example The union, to machine precision
Take the spacecraft axis with $J = 120\,\mathrm{kg\,m^2}$:

$$\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}, \qquad \mathbf{B} = (0,\ 1/J)^\mathsf{T}, \qquad \mathbf{C} = (1\ \ 0).$$

Lesson 6 put the controller poles at $-0.1(1\pm i)$, giving $\mathbf{K} = (2.4,\ 24)$. Lesson 7 put the observer poles four times faster, at $-0.4(1\pm i)$, giving $\mathbf{L} = (0.8,\ 0.32)^\mathsf{T}$.

**Build the $4\times4$ matrix** in $(\mathbf{x},\mathbf{e})$ coordinates. The top-left block $\mathbf{A}-\mathbf{B}\mathbf{K}$ has second row $(-2.4/120,\ -24/120) = (-0.02,\ -0.2)$. The top-right block $\mathbf{B}\mathbf{K}$ has second row $(0.02,\ 0.2)$. The bottom-right block is $\mathbf{A}-\mathbf{L}\mathbf{C}$:

$$\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix} = \begin{pmatrix}0 & 1 & 0 & 0\\ -0.02 & -0.2 & 0.02 & 0.2\\ 0&0&-0.8&1\\ 0&0&-0.32&0\end{pmatrix}.$$

**Take its eigenvalues.** They come back as $-0.1\pm0.1i$ and $-0.4\pm0.4i$. Mathematically the gap from the union of the two designed sets is exactly zero, because the polynomial factors. In **[[floating point|floating-point]]** you should expect round-off near $10^{-16}$; this time even that came out as $0.0$.

**Now the coordinates a flight computer actually uses,** $(\mathbf{x},\hat{\mathbf{x}})$:

$$\begin{pmatrix}\mathbf{A} & -\mathbf{B}\mathbf{K}\\ \mathbf{L}\mathbf{C} & \mathbf{A}-\mathbf{B}\mathbf{K}-\mathbf{L}\mathbf{C}\end{pmatrix}.$$

Same four eigenvalues. But this matrix is not block triangular, and nothing about it looks separated. Only the change of coordinates shows the structure. That is the whole content of the proof.
:::

## Block triangular is not block diagonal

The top-right block $\mathbf{B}\mathbf{K}$ is not zero, and it matters. The eigenvalues separate. The **trajectories** — the actual paths the vehicle takes — do not.

The error pushes on the state through the term $\mathbf{B}\mathbf{K}\mathbf{e}$. That is the math for something physically plain: if the guess is wrong, the controller computes a torque the vehicle did not need, and applies it anyway. Back on the tandem bicycle, a wrong idea about where the road is still turns the handlebars, even if both riders are good at their jobs.

::: example Estimation error moving a vehicle that was already on target
Start the same loop with the vehicle exactly at rest, exactly on target: $\mathbf{x}(0) = \mathbf{0}$. But start the guess $1^\circ$ off: $\mathbf{e}(0) = (0.01745\,\mathrm{rad},\ 0)^\mathsf{T}$.

The guess thinks the vehicle is pointing wrong, so the controller commands a correction. The vehicle, which needed nothing, gets pushed off target.

Running the $4\times4$ system forward in time gives a peak **[[excursion|excursion-picture]]** of $0.651^\circ$ at $t = 10.9\,\mathrm{s}$, a peak commanded torque of $0.0872\,\mathrm{N\,m}$, and a return to $0.0035^\circ$ by $60\,\mathrm{s}$. Every eigenvalue is exactly where it was designed to be. The vehicle still swung two-thirds of a degree for no reason.

**Sanity check:** the excursion is smaller than the $1^\circ$ starting error, because the observer shrinks the error while the controller is still reacting to it. That is as it should be.

This is the real reason for the two-to-six rule on observer speed. A faster observer kills $\mathbf{e}$ before the controller can act on it. A slower one lets $\mathbf{B}\mathbf{K}\mathbf{e}$ dominate the early transient. The separation principle says the poles do not care. Whoever is watching the pointing telemetry does.
:::

## The exact conditions

Go back through the derivation and mark every place an assumption was used. The separation principle holds when, and essentially only when:

1. **The plant is linear and time-invariant, and the observer is built on the same $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$** (and $\mathbf{D}$, if non-zero). The cancellation of $\mathbf{B}\mathbf{u}$ in Lesson 7 needed the observer's $\mathbf{B}$ to equal the plant's. The cancellation of $\mathbf{x}$ needed $\mathbf{A}$ and $\mathbf{C}$ to match too.
2. **The command applied is the command the observer is told about.** Saturation (the actuator hitting its limit), rate limits, rounding, dead band, an unmodeled actuator lag, or a computing delay the observer does not share — each makes the applied $\mathbf{u}$ differ from $-\mathbf{K}\hat{\mathbf{x}}$. Then the $\mathbf{B}\mathbf{u}$ terms no longer cancel.
3. **The measurement is the modeled measurement.** A sensor misalignment, scale factor, bias or lag that the observer does not carry shows up as $(\mathbf{C}-\hat{\mathbf{C}})\mathbf{x}$ driving the error.
4. **Both halves run on the same clock.** A continuous-time $\mathbf{K}$ paired with a discrete observer, or two different discretizations, is not the system whose eigenvalues you computed.

And even when it holds exactly, it says nothing about:

- **Robustness.** Nothing in the derivation bounds what happens when the plant differs from the model. The next two sections put numbers on that.
- **Noise.** Pole locations say nothing about how big $\mathbf{e}$ gets under sensor noise. Lesson 7's table showed the rate-estimate noise changing by a factor of thirty across the same set of cleanly separated poles.
- **Transient size**, as the last example showed.

## What model mismatch does

Suppose the observer runs on a model $(\hat{\mathbf{A}}, \hat{\mathbf{B}}, \hat{\mathbf{C}})$ while the real plant is $(\mathbf{A}, \mathbf{B}, \mathbf{C})$. Redo the error derivation:

$$\dot{\mathbf{e}} = \dot{\mathbf{x}} - \dot{\hat{\mathbf{x}}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}} - \left(\hat{\mathbf{A}}\hat{\mathbf{x}} - \hat{\mathbf{B}}\mathbf{K}\hat{\mathbf{x}} + \mathbf{L}\mathbf{C}\mathbf{x} - \mathbf{L}\hat{\mathbf{C}}\hat{\mathbf{x}}\right).$$

Substitute $\hat{\mathbf{x}} = \mathbf{x}-\mathbf{e}$ and collect everything multiplying $\mathbf{x}$. That becomes the bottom-left block:

$$\mathbf{M}_{21} = \left(\mathbf{A}-\hat{\mathbf{A}}\right) - \left(\mathbf{B}-\hat{\mathbf{B}}\right)\mathbf{K} + \mathbf{L}\left(\hat{\mathbf{C}}-\mathbf{C}\right).$$

Each bracket is one model error. The block is zero exactly when all three errors vanish (or happen to cancel). Any non-zero $\mathbf{M}_{21}$ wrecks the triangular shape. The polynomial stops factoring, and the $2n$ eigenvalues become one tangled set that belongs to neither design.

::: example Twenty percent of inertia
Keep the real plant at $J = 120\,\mathrm{kg\,m^2}$, but give the observer $\hat{J} = 144\,\mathrm{kg\,m^2}$ — a $20\,\%$ error. That is entirely realistic for a spacecraft whose **[[propellant load|propellant-inertia]]** is uncertain. Only $\mathbf{B}$ differs, so $\mathbf{M}_{21} = -(\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} \ne \mathbf{0}$ and the structure is gone.

Build the $4\times4$ matrix in $(\mathbf{x},\hat{\mathbf{x}})$ coordinates, using $\hat{\mathbf{B}}$ inside the observer, and take its eigenvalues:

| model | eigenvalues |
| --- | --- |
| exact | $-0.100\pm0.100i$, $-0.400\pm0.400i$ |
| $\hat{J}/J = 1.2$ | $-0.1125\pm0.1009i$, $-0.3708\pm0.3779i$ |
| $\hat{J}/J = 0.8$ | $-0.0865\pm0.0976i$, $-0.4385\pm0.4290i$ |
| $\hat{J}/J = 1.5$ | $-0.1300\pm0.0999i$, $-0.3366\pm0.3531i$ |

Nothing dramatic happens here. All four stay comfortably stable, and the slow pair's real part moves about $13\,\%$ for a $20\,\%$ inertia error. Two observations matter more than the numbers.

First, the poles no longer belong to either design. There is no "controller pair" and "observer pair" anymore — only four eigenvalues of one coupled system, and you cannot reason about them separately.

Second, the **[[direction of the drift|pole-cloud]]** tells a story. An *under*-estimated inertia ($\hat J/J = 0.8$) pushes the slow pair *toward* the imaginary axis, to $-0.0865$. That is the dangerous direction: poles near the imaginary axis mean slow, poorly damped motion.

Once mismatch is in play, the honest procedure is to stop quoting separated poles and start sweeping. Build the coupled $2n\times2n$ matrix across the parameter range you expect, and check the whole cloud of eigenvalues. It is a four-line computation, and it replaces an argument that no longer applies.
:::

## Separation says nothing about margins

The sharpest limit is the one that costs the most in practice. Even with a perfect model, the observer changes the loop.

**[[Break the loop|breaking-the-loop]]** at the plant input — cut the wire carrying $\mathbf{u}$, inject a signal, and see what comes back around. With full state feedback, the **loop transfer function** is

$$L_{\text{fs}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}.$$

(Here $L(s)$ is a transfer function, not the observer gain $\mathbf{L}$; the subscript tells you which loop.) With the observer, the compensator from $\mathbf{y}$ to $\mathbf{u}$ is $-\mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}$, so the loop becomes

$$L_{\text{ob}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\;\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}.$$

These are different functions with different margins, even though the closed-loop poles are exactly the designed ones in both cases. For the $J = 120$ axis, with the controller fixed and the observer at speed ratio $r$:

| design | crossover | phase margin | gain margin |
| --- | --- | --- | --- |
| full state feedback | $0.220\,\mathrm{rad/s}$ | $65.5^\circ$ | unbounded |
| observer, $r = 2$ | $0.146\,\mathrm{rad/s}$ | $36.6^\circ$ | $10.9\,\mathrm{dB}$ |
| observer, $r = 4$ | $0.176\,\mathrm{rad/s}$ | $45.0^\circ$ | $14.4\,\mathrm{dB}$ |
| observer, $r = 10$ | $0.200\,\mathrm{rad/s}$ | $55.1^\circ$ | $20.9\,\mathrm{dB}$ |
| observer, $r = 30$ | $0.213\,\mathrm{rad/s}$ | $61.6^\circ$ | $29.8\,\mathrm{dB}$ |

In every row the controller poles sit at $-0.1(1\pm i)$ and the observer poles exactly where that row designed them. Yet the phase margin ranges from $37^\circ$ to $62^\circ$. The observer always costs margin compared with full state feedback. On this minimum-phase plant the loss shrinks as the observer gets faster — an effect called **[[loop transfer recovery|ltr]]**. The recovery is not free: Lesson 7 showed rate-estimate noise growing as $r^{3/2}$ over the same range. And it is not available at all on a non-minimum-phase plant.

::: warning LQG is the canonical counterexample
Choose $\mathbf{K}$ by **[[LQR|lq-names]]** (the optimal state-feedback gain) and $\mathbf{L}$ by a Kalman filter, and combine them. That is the LQG controller — the optimal version of exactly this architecture — and the separation principle holds for it exactly.

LQR on its own comes with guaranteed margins: for a single input, at least $60^\circ$ of phase margin and a gain margin from $0.5$ to infinity, whatever positive weights you choose. **[[Doyle showed in 1978|doyle]]** that the LQG combination has **no** guaranteed margins at all. There are plants and noise models where the LQG loop's gain margin is as close to $1$ as you like, even though the LQR half and the Kalman half are each excellent. Separation is a statement about poles. Robustness has to be computed, every time, on the loop you are actually going to fly.
:::

```python
import numpy as np

J, a, r = 120.0, 0.1, 4.0
A = np.array([[0.0, 1], [0, 0]])
B = np.array([[0.0], [1 / J]])
C = np.array([[1.0, 0]])
K = np.array([[2 * a * a * J, 2 * a * J]])
L = np.array([[2 * r * a], [2 * r * r * a * a]])

def separation_check(A, B, C, K, L):           # exact model, (x, e) coordinates
    Z = np.zeros_like(A)
    combined = np.block([[A - B @ K, B @ K], [Z, A - L @ C]])
    union = np.concatenate([np.linalg.eigvals(A - B @ K), np.linalg.eigvals(A - L @ C)])
    return np.sort_complex(np.linalg.eigvals(combined)), np.sort_complex(union)

def mismatched(A, B, C, K, L, Bhat):          # observer built on Bhat, (x, xhat)
    M = np.block([[A, -B @ K], [L @ C, A - Bhat @ K - L @ C]])
    return np.sort_complex(np.linalg.eigvals(M))

comb, union = separation_check(A, B, C, K, L)
print("exact model, max |difference| =", np.abs(comb - union).max())
print("20% inertia error:", np.round(mismatched(A, B, C, K, L,
                                                np.array([[0.0], [1 / (1.2 * J)]])), 4))
# exact model, max |difference| = 0.0
# 20% inertia error: [-0.3708-0.3779j -0.3708+0.3779j -0.1125-0.1009j -0.1125+0.1009j]
```

## Check yourself

::: check
Show that the closed-loop characteristic polynomial of the observer-based loop is $\det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})\cdot\det(s\mathbf{I}-\mathbf{A}+\mathbf{L}\mathbf{C})$, and identify which step needs an exact model.
:::

::: answer
In $(\mathbf{x},\mathbf{e})$ coordinates the closed-loop matrix is $\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}&\mathbf{B}\mathbf{K}\\\mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}$. The determinant of a block-triangular matrix is the product of its diagonal blocks' determinants, so

$$\det(s\mathbf{I}-\mathbf{M}) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})\det(s\mathbf{I}-\mathbf{A}+\mathbf{L}\mathbf{C}).$$

A change of coordinates keeps the eigenvalues, so this is also the polynomial of the physical loop.

The step that needs an exact model is the zero in the bottom-left block. It came from $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$ having no $\mathbf{x}$ term. With a mismatched model that block is $(\mathbf{A}-\hat{\mathbf{A}}) - (\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} + \mathbf{L}(\hat{\mathbf{C}}-\mathbf{C})$, and nothing factors.
:::

::: check
An observer-based loop is verified in simulation and the eigenvalues come out as the exact union. On hardware, the vehicle oscillates at a frequency that is in neither design. Name three candidate causes.
:::

::: answer
Any of the four conditions could have failed.

1. **Actuator saturation** (most likely). The applied command differs from $-\mathbf{K}\hat{\mathbf{x}}$ during the transient, so the loop is not linear and the eigenvalue argument does not apply at all. The oscillation is a **[[limit cycle|limit-cycle]]**.
2. **A model error big enough to couple the two halves.** The mismatch block contains $(\mathbf{B}-\hat{\mathbf{B}})\mathbf{K}$, so a high-gain controller turns a small $\Delta\mathbf{B}$ into a large $\mathbf{M}_{21}$.
3. **Dynamics the simulation did not have** — a structural mode, a sensor filter, or a computing delay. These add states the $2n$ analysis never contained.

A fourth worth checking early is a discretization mismatch between the controller and observer rates.
:::

::: check
The separation principle holds exactly, and yet the noise-driven wheel torque roughly triples when the observer poles are moved from $-0.4(1\pm i)$ to $-1.0(1\pm i)$. Is this a contradiction?
:::

::: answer
No. The principle fixes where the eigenvalues are and nothing else. Moving the observer poles changes $\mathbf{L}$, and $\mathbf{L}$ multiplies sensor noise into the estimate, from which $-\mathbf{K}\hat{\mathbf{x}}$ carries it to the actuator.

Those two pole choices are $r = 4$ and $r = 10$ on Lesson 7's speed-ratio scale. There the rate-estimate noise grows as $r^{3/2}$, by a factor of $(10/4)^{3/2} \approx 4$, and the noise torque grows from $1.9\times10^{-4}$ to $6.4\times10^{-4}\,\mathrm{N\,m}$, a factor of about $3.4$ — the tripling observed.

Poles belong to the system left to itself. Jitter belongs to the system driven by noise. They are answered by different calculations: eigenvalues for the first, a Lyapunov equation or covariance propagation for the second.
:::

::: check
Why does an anti-windup scheme matter more for an observer-based controller than for a plain PID loop?
:::

::: answer
Because saturation breaks the observer as well as the controller. When the actuator saturates, the plant receives a command different from $-\mathbf{K}\hat{\mathbf{x}}$. But the observer runs its model with the command it *thinks* was applied. The $\mathbf{B}\mathbf{u}$ terms stop canceling, and the guess wanders away from the truth — exactly when the vehicle is farthest from where you want it.

When the actuator comes off its limit, the guess is wrong, the loop drops into a transient the design never considered, and every separated pole is irrelevant during the episode. The fix is the PID anti-windup idea applied one level deeper: feed the observer the command the actuator *actually* delivered. That needs either telemetry from the actuator or a model of its limit inside the flight software.
:::

::: check
For the $J = 120$ axis, the full-state loop has $65.5^\circ$ of phase margin and the observer-based loop with $r = 2$ has $36.6^\circ$. Both have their closed-loop poles exactly where they were designed. Which number would you put in a design review, and what would you do about it?
:::

::: answer
The observer-based number, $36.6^\circ$, because that is the loop the vehicle flies. The full-state figure describes a controller you cannot build unless you measure the rate directly. It is also below the $45^\circ$ most programs require, so something has to change. Options, roughly in order of preference:

- speed the observer up to $r = 4$, which recovers the margin to $45.0^\circ$ at the cost of $2^{3/2} \approx 2.8$ times more rate-estimate noise;
- add a rate gyro so $\mathbf{C}$ includes $\omega$ and the observer has less to reconstruct;
- slow the controller, which shrinks $\mathbf{K}$ and with it the sensitivity to estimation error.

What is not acceptable is quoting the separated poles and stopping. That is exactly the failure this lesson exists to prevent.
:::

## Summary

| Item | Statement |
| --- | --- |
| Architecture | $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ with $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}}+\mathbf{B}\mathbf{u}+\mathbf{L}(\mathbf{y}-\mathbf{C}\hat{\mathbf{x}})$ |
| Key coordinates | $(\mathbf{x},\mathbf{e})$ with $\mathbf{e} = \mathbf{x}-\hat{\mathbf{x}}$; a similarity transform, so eigenvalues are preserved |
| Closed-loop matrix | $\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}&\mathbf{B}\mathbf{K}\\\mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}$ — block upper triangular |
| Separation principle | spectrum $= \operatorname{eig}(\mathbf{A}-\mathbf{B}\mathbf{K}) \cup \operatorname{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$, exactly |
| Conditions | exact LTI model in the observer; the applied command is the modeled one; the measurement is the modeled one; one time base |
| Not block diagonal | $\mathbf{B}\mathbf{K}\mathbf{e}$ drives the state: estimation error moves the vehicle even with separated poles |
| Mismatch block | $\mathbf{M}_{21} = (\mathbf{A}-\hat{\mathbf{A}}) - (\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} + \mathbf{L}(\hat{\mathbf{C}}-\mathbf{C})$; non-zero means no factorization |
| Margins | $L_{\text{ob}} = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\,\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} \ne L_{\text{fs}}$ |
| LQG | separation holds exactly and there are no guaranteed margins at all (Doyle, 1978) |

So far the controller drives the state to zero. A real vehicle has to hold a commanded attitude against a steady disturbance torque, and state feedback alone leaves an offset. The next lesson adds the missing integrator, the state-space way.

::: context similarity-bridge Same machine, different numbers
Lesson 2 showed that if you describe a system with new coordinates $\mathbf{z} = \mathbf{T}^{-1}\mathbf{x}$, the matrix becomes $\mathbf{T}^{-1}\mathbf{M}\mathbf{T}$ and its eigenvalues do not change. Think of describing a trip in miles or kilometers: the numbers differ, the trip does not. Here the new coordinates are "truth" and "truth minus guess". The top half of $\mathbf{T}^{-1}$ copies $\mathbf{x}$; the bottom half forms $\mathbf{x}-\hat{\mathbf{x}}$. It is invertible — in fact it is its own inverse — so no information is lost.
:::

::: context block-triangular What block triangular looks like
Cut the $2n\times2n$ matrix into four $n\times n$ tiles. "Block upper triangular" means the bottom-left tile is all zeros. The error row only listens to the error; the state row listens to both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="15" width="70" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="15" width="70" height="70" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="85" width="70" height="70" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="85" width="70" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="135" y="54">A − BK</text>
    <text x="205" y="54">BK</text>
    <text x="135" y="124">0</text>
    <text x="205" y="124">A − LC</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="92" y="54" text-anchor="end">x row</text>
    <text x="92" y="124" text-anchor="end">e row</text>
    <text x="248" y="54">coupling:</text>
    <text x="248" y="68">error moves x</text>
    <text x="248" y="124">errors decay</text>
    <text x="248" y="138">on their own</text>
  </g>
</svg>
```

The two blue tiles hold all the eigenvalues. The orange tile shapes the paths but never the poles.
:::

::: context floating-point Why exactly zero, not tiny
Computers store numbers with about $16$ significant digits, so most calculations pick up round-off near $10^{-16}$ times the size of the numbers. A check "to machine precision" means the difference is down at that level — as small as the arithmetic can resolve. Getting exactly $0.0$ here is partly luck: the entries are short decimals and the matrix is already nearly triangular. With messier numbers you would see something like $10^{-16}$, and that counts as perfect agreement too. A mismatched model, by contrast, moves eigenvalues in the second or third digit.
:::

::: context excursion-picture The needless swing, drawn
The vehicle's pointing (blue) and the estimation error (gray) for the first minute. The error starts at $1^\circ$ and is gone in about $12\,\mathrm{s}$. The vehicle, which started perfectly on target, is shoved to $-0.651^\circ$ at $10.9\,\mathrm{s}$ and creeps back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="145" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="90" x2="345" y2="90" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="34">1°</text><text x="44" y="94">0</text><text x="44" y="124">−0.5°</text>
  </g>
  <line x1="50" y1="120" x2="345" y2="120" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="50.0,30.0 57.2,81.4 64.5,100.3 71.8,101.9 79.0,97.7 86.2,93.4 93.5,90.7 100.8,89.7 108.0,89.5 115.2,89.6 122.5,89.8 129.8,89.9 137.0,90.0 144.2,90.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,90.0 57.2,90.7 64.5,96.0 71.8,105.2 79.0,114.8 86.2,122.4 93.5,127.1 100.8,129.0 108.0,128.6 115.2,126.7 122.5,123.7 129.8,120.2 137.0,116.5 144.2,112.7 151.5,109.0 158.8,105.5 166.0,102.4 173.2,99.5 180.5,97.1 187.8,95.0 195.0,93.2 202.2,91.8 209.5,90.7 216.8,89.8 224.0,89.2 231.2,88.8 238.5,88.5 245.8,88.3 253.0,88.3 260.2,88.3 267.5,88.4 274.8,88.6 282.0,88.7 289.2,88.9 296.5,89.0 303.8,89.2 311.0,89.3 318.2,89.5 325.5,89.6 332.8,89.7 340.0,89.8"/>
  <circle cx="102.9" cy="129.1" r="3" fill="#b4232c"/>
  <text x="112" y="142" font-size="11" fill="#b4232c">−0.651° at 10.9 s</text>
  <text x="90" y="62" font-size="11" fill="#6c7a93">estimation error</text>
  <text x="230" y="112" font-size="11" fill="#1d6fd1">vehicle pointing</text>
  <text x="195" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">time, 0 to 60 s</text>
</svg>
```
:::

::: context propellant-inertia Why a spacecraft's inertia is uncertain
Much of a spacecraft's mass can be propellant. A geostationary communications satellite may launch with roughly half its mass in its tanks. As the propellant burns, the moment of inertia falls. Liquid also moves in the tanks, so where the mass sits is not fixed. Gauging how much is left in weightlessness is hard, since there is no "bottom" of the tank to measure a level against. An inertia known only to $10$ to $20\,\%$ late in life is ordinary.
:::

::: context pole-cloud Where the poles wander
The upper half of the complex plane, with the exact design (black) and the three mismatched models. Each model moves both pairs. The $\hat J/J = 0.8$ case (red) pushes the slow pair right, toward the imaginary axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="340" y1="25" x2="340" y2="185" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="195">−0.4</text><text x="160" y="195">−0.3</text><text x="220" y="195">−0.2</text><text x="280" y="195">−0.1</text><text x="340" y="195">0</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="334" y="154">0.1</text><text x="334" y="94">0.3</text><text x="334" y="64">0.4</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.8">
    <path d="M276,146 l8,8 M284,146 l-8,8"/><path d="M96,56 l8,8 M104,56 l-8,8"/>
  </g>
  <g fill="#1d6fd1"><circle cx="272.5" cy="149.7" r="3.5"/><circle cx="117.5" cy="66.6" r="3.5"/></g>
  <g fill="#b4232c"><circle cx="288.1" cy="150.7" r="3.5"/><circle cx="76.9" cy="51.3" r="3.5"/></g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"><circle cx="262" cy="150" r="3.5"/><circle cx="138" cy="74.1" r="3.5"/></g>
  <g font-size="11">
    <text x="40" y="30" fill="#1f2a44">× exact</text>
  </g>
  <circle cx="102" cy="26" r="3.5" fill="#1d6fd1"/><circle cx="152" cy="26" r="3.5" fill="#b4232c"/><circle cx="202" cy="26" r="3.5" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <g font-size="11">
    <text x="110" y="30" fill="#1f2a44">1.2</text>
    <text x="160" y="30" fill="#1f2a44">0.8</text>
    <text x="210" y="30" fill="#1f2a44">1.5</text>
    <text x="240" y="30" fill="#1f2a44">(Ĵ/J ratios)</text>
  </g>
</svg>
```
:::

::: context breaking-the-loop What "breaking the loop" measures
Imagine snipping the wire from the controller to the actuator, feeding a small test wave into the actuator side, and watching what arrives back at the snipped end after passing through the vehicle, the sensor, the observer and the gain. That round-trip transfer function is the loop transfer function. Gain margin is how much you could turn up the round-trip gain before the loop goes unstable; phase margin is how much extra delay it could take. Breaking at the plant input is the standard place, because that is where real actuator uncertainty lives.
:::

::: context ltr A known recovery trick
Doyle and Stein published "Robustness with observers" in 1979, showing that for a minimum-phase plant, making the observer (or the Kalman filter's assumed input noise) faster and faster makes the observer-based loop approach the full-state loop, margins included. The method became known as loop transfer recovery, or LTR. The table shows it happening: $36.6^\circ$, $45.0^\circ$, $55.1^\circ$, $61.6^\circ$, creeping up toward $65.5^\circ$. The price is paid in noise.
:::

::: context lq-names What LQR and LQG stand for
**LQR** is the linear quadratic regulator: a linear plant, a quadratic cost (squared state error plus squared control effort, each weighted), and a regulator that minimizes it. **LQG** adds Gaussian noise, and pairs LQR with a Kalman filter. Both come later in the course. Here they matter as the most famous case of an observer-based loop: each half is optimal, and the separation principle holds exactly.
:::

::: context doyle "There are none"
John Doyle's 1978 paper in the IEEE Transactions on Automatic Control was titled "Guaranteed Margins for LQG Regulators". Its abstract is famous for being three words long: "There are none." He gave a simple two-state example in which the gain margin could be made as small as you like by changing the noise and cost weights. The paper helped start the robust-control movement of the 1980s, which asks how much the plant may differ from the model before the loop fails.
:::

::: context limit-cycle What a limit cycle is
A limit cycle is a steady oscillation that a nonlinear system settles into by itself, with a fixed size and period. A linear system cannot do this — its oscillations either grow, shrink, or depend on how you started it. Saturation is a classic cause. The actuator slams to its limit, overshoots, slams the other way, and the pattern repeats. Its frequency comes from the nonlinearity, which is why it matches neither designed pole.
:::
