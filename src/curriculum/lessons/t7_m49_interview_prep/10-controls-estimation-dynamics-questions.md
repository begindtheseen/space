---
id: l10-controls-estimation-dynamics-questions
title: "Controls, estimation and dynamics rounds: the questions that recur"
minutes: 19
covers:
  - "Controls, estimation and dynamics rounds: the questions that recur, and the follow-ups that separate memorisation from understanding"
---

An interviewer's first question in a controls, estimation, or dynamics round is rarely the real question. "What's an EKF?" is a door, not the destination — the destination is whatever the follow-up asks once you have answered the door question correctly, because a follow-up is where memorized definitions and real understanding stop looking identical. Someone who has memorized "the EKF linearizes about the current estimate" can usually say that sentence. Far fewer can say, without hesitating, exactly when that linearization stops being good enough and why.

This lesson is a catalog: a set of questions that recur often enough across controls, estimation, and dynamics rounds to be worth having complete, correct answers for, each paired with the follow-up that actually does the discriminating. It does not restate derivations covered fully in earlier lessons — the rocket equation, the Kalman gain, Euler's equations, and the Clohessy-Wiltshire equations already have full treatments — it covers the recurring questions this module has not yet built dedicated lessons around.

## Controls

**"What does a right-half-plane zero do to achievable bandwidth, and where do they come from physically?"** A right-half-plane (RHP) zero produces an *inverse response*: the system's output initially moves opposite to the direction the input is eventually driving it, before turning around — the classic example is an aircraft's altitude briefly dropping when the pilot pitches up, because the tail-down force needed to start the pitch change initially reduces lift before the increased angle of attack takes over. In a control loop, an RHP zero places a hard ceiling on achievable closed-loop bandwidth: pushing the crossover frequency up toward the zero's location drives the loop toward instability, roughly because the zero contributes phase lag of a sign the controller cannot design around the way it can for an ordinary (left-half-plane) zero. The commonly cited rule of thumb bounds usable bandwidth to well under the zero's own frequency — often stated as needing to stay below about half of it — though the exact factor depends on how much performance margin the design needs, so treat the number as an order-of-magnitude guideline rather than an exact law. Physically, in a flexible spacecraft, an RHP zero is a common consequence of a **non-collocated** sensor and actuator: when the attitude sensor and the control torque source sit on opposite sides of a flexible structure's node, the transfer function between them picks up exactly this kind of non-minimum-phase behaviour, which is part of why sensor placement relative to a flexible mode's shape is a real design decision, not an afterthought.

**"What is a gain schedule, and when do you actually need one?"** A gain schedule changes controller gains as a function of a measured or estimated operating condition, used when the plant's linearized dynamics change enough across the operating envelope that a single fixed-gain design cannot serve the whole envelope well. A launch vehicle in ascent is the canonical case: dynamic pressure and vehicle mass properties both change by large factors from liftoff to staging, so the aerodynamic and inertial dynamics the controller is regulating are not the same plant at different points in flight. Gains are typically scheduled against a variable that tracks the dynamics well — dynamic pressure or Mach number rather than time directly, since the relationship between flight time and dynamic pressure is itself dispersed. The near-universal follow-up: how do you verify stability across the *whole* schedule, not only at the handful of design points the gains were tuned at? The minimum bar is dense gridding — checking margins at many points across the envelope, not only the ones used for tuning — and a more rigorous answer names linear parameter-varying (LPV) analysis, covered in the robust-control track, which can certify stability across a continuum of operating points rather than a finite grid of them.

**"What changes when you implement a continuous design digitally?"** Sampling introduces additional phase lag — a zero-order hold contributes roughly $\omega T_s/2$ radians of extra phase lag at frequency $\omega$, for a sample interval $T_s$, a good approximation as long as $\omega$ is well below the Nyquist frequency — which erodes phase margin that a continuous-time analysis never accounted for, and can turn an apparently well-margined continuous design into a marginal or unstable digital one if the sample rate is not comfortably faster than the crossover frequency. The second concern is aliasing: any signal content above the Nyquist frequency — commonly a structural mode the continuous design never had to worry about — folds down into the controlled bandwidth unless it is removed by an anti-aliasing filter before sampling, not after.

::: example Right-half-plane zero, worked
A flexible-structure attitude loop has a non-collocated sensor and actuator producing an RHP zero at $z = 8\,\mathrm{rad/s}$. Using the rule-of-thumb bound of roughly half the zero's frequency, achievable closed-loop bandwidth is limited to on the order of $4\,\mathrm{rad/s}$ or less. If the mission's pointing-settle-time requirement needs a bandwidth of $6\,\mathrm{rad/s}$ to meet it with a conventional design, that requirement is not achievable with this sensor and actuator placement alone — the real design conversation moves to relocating the sensor, adding a second sensor closer to the actuator, or relaxing the settle-time requirement, rather than trying to tune around a physical limitation with a better controller.
:::

## Estimation

**"EKF versus UKF — when does the difference actually matter?"** The EKF linearizes the nonlinear dynamics or measurement function about the current estimate — a first-order Taylor expansion evaluated at a point — and propagates the covariance through that linear approximation. The UKF instead propagates a small, deterministic set of sample points (sigma points) through the *true*, unmodified nonlinear function, then reconstructs the mean and covariance from the transformed points, which captures curvature effects a first-order linearization misses entirely, without ever needing to compute a Jacobian. The difference is negligible when the nonlinearity is mild relative to the size of the uncertainty ellipse the filter is propagating — for small enough covariance, any smooth function looks locally linear, and the EKF's approximation is essentially exact. The difference becomes real when uncertainty is large relative to the function's curvature: bearings-only tracking, strongly nonlinear coordinate transforms, or any case with a large initial uncertainty before the filter has converged. The cost side of the trade: the UKF needs $2n+1$ function evaluations per update for an $n$-dimensional state, against one Jacobian evaluation for the EKF, a real computational cost that matters on constrained flight hardware.

**"What does it mean for a filter to be consistent, and how do you actually test it?"** Consistency means the filter's *reported* covariance matches its *actual* error statistics — if the filter says it is uncertain to within one metre at one standard deviation, the true error should actually fall within one metre about 68% of the time across many trials, not merely on average look reasonable. The standard test is the **normalized estimation error squared (NEES)**: $e^T P^{-1} e$, where $e$ is the true error and $P$ the filter's reported covariance. For a consistent filter, NEES follows a chi-square distribution with degrees of freedom equal to the state dimension, so its expected value is exactly the state dimension — averaged across a Monte Carlo ensemble, the mean NEES should land inside a chi-square-derived confidence band around that expected value. A mean NEES well above that band means the filter is overconfident (true error is bigger than the reported covariance admits); well below means it is underconfident (reported covariance is unnecessarily pessimistic, wasting information). When ground truth is unavailable, the same idea applied to the measurement innovation instead of the state error — the **normalized innovation squared (NIS)** — gives an online-computable version of the same test.

::: example Filter consistency, worked and verified
True error variance $4.0$. A consistent filter reports $\hat P = 4.0$; averaged over 20,000 trials, mean NEES comes out at $0.99$ — matching the chi-square(1) expectation of $1$ closely, and well inside the 95% band of roughly $[0.98, 1.02]$ for that many trials. An overconfident filter reporting $\hat P = 1.0$ against the same true error gives mean NEES of about $3.97 \approx 4$, matching the predicted ratio $P_{\text{true}}/\hat P = 4$ exactly — a filter reporting four times less uncertainty than it actually has, which is precisely the overconfidence that silently erodes the Kalman gain (covered in an earlier lesson) and lets true error drift unchecked.
:::

## Dynamics

**"Write down quaternion kinematics, and explain why an attitude filter doesn't update the quaternion directly."** Quaternion kinematics: $\dot{\mathbf{q}} = \tfrac12\,\mathbf{q} \otimes \boldsymbol\omega_{\text{body}}$ (Hamilton convention, body-frame rate). Four parameters describe an orientation that genuinely has only three degrees of freedom, constrained to the unit-norm hypersphere $\|\mathbf{q}\|=1$ — a standard linear Kalman update, applied directly to all four quaternion components, has no mechanism to respect that constraint: the updated quaternion generally drifts off the unit sphere, and the associated covariance is singular in the direction the constraint removes, since there is genuinely no freedom in that direction to have uncertainty about. The standard fix is a **multiplicative error-state filter**: estimate a three-parameter small-angle (or similar) error about a quaternion reference, update that unconstrained three-parameter error linearly in the usual way, then fold the correction back into the reference quaternion by quaternion multiplication and renormalize — respecting the constraint by construction rather than fighting it after the fact.

**"What environmental torques act on a spacecraft, and roughly how big are they?"** The standard list: gravity-gradient torque, from the inverse-square gravity field pulling harder on the nearer part of a body of finite size and non-spherical inertia, tending to align the axis of least inertia with the local vertical; aerodynamic torque, from residual atmosphere in low orbits acting on an off-center-of-pressure vehicle; solar radiation pressure torque, from photon momentum on surfaces with an offset center of pressure relative to the center of mass; and magnetic torque, from the interaction of a residual (unintentional) magnetic dipole with the local geomagnetic field. All four are usually small compared to actuator authority on an actively controlled vehicle, but they matter as secular disturbances a control system has to reject continuously, and gravity-gradient torque specifically is sometimes used deliberately for passive attitude stabilization rather than only fought against.

**"How is the variable-mass rocket equation of motion different from Euler's equations for a fixed rigid body?"** Covered in full in an earlier lesson of this module: the correct translational equation is $m\,d\mathbf{v}/dt = \mathbf{T} + \mathbf{F}_{\text{ext}}$ with $\mathbf{T} = -v_e\,dm/dt$, derived from momentum conservation on the vehicle-plus-ejected-propellant system rather than from naively differentiating the vehicle's own momentum; the rotational form adds a thrust-vector-control moment from any offset between the thrust line and the center of mass, on top of the ordinary rigid-body Euler equation.

::: warning
Every recurring question in this catalog has a real follow-up waiting behind it. Do not stop at the door-question answer even when it is fully correct — volunteer the boundary condition ("this matters more when uncertainty is large relative to the nonlinearity," "the exact bandwidth bound depends on how much margin you need") before being asked for it, the same instinct this module has been building since the very first lesson on project talks.
:::

## Check yourself

::: check
Why is an interviewer's first question in this kind of round rarely the one that actually discriminates candidates, and what does that imply about how you should answer it?
:::

::: answer
A door question like "what's an EKF" or "what's a gain schedule" has a short, memorizable correct answer that says nothing about depth of understanding — many candidates can produce it correctly. The discriminating signal lives in the follow-up, which probes the boundary of the concept: when does it break down, what does it cost, what's the alternative and why not that instead. The implication is that a strong answer to the door question anticipates and partially pre-empts the follow-up — stating the boundary condition unprompted, rather than waiting to be asked, is the same "volunteer the limitation" instinct this module has built from the first lesson onward.
:::

::: check
A filter reports covariance $\hat P = 2.0$ for a state whose true error variance is actually $8.0$. Predict the mean NEES you would measure across a large Monte Carlo ensemble, and state whether the filter is overconfident or underconfident.
:::

::: answer
Mean NEES should be close to $P_{\text{true}}/\hat P = 8.0/2.0 = 4.0$, well above the chi-square(1) expectation of $1.0$ for a consistent filter — this is an overconfident filter, reporting less uncertainty than it actually has. In a real fielded filter this would show up as a Kalman gain that is systematically too small for how much the measurements should actually be trusted, since the gain formula scales directly with the (here, too-small) reported covariance.
:::

::: check
Under what condition does the choice between an EKF and a UKF stop mattering in practice, and under what condition does it start to matter a great deal?
:::

::: answer
It stops mattering when the uncertainty the filter carries is small relative to the curvature of the nonlinear function being propagated — locally, any smooth nonlinearity looks approximately linear over a small enough neighborhood, which is exactly the regime the EKF's first-order approximation is built for. It starts to matter a great deal when uncertainty is large relative to that curvature: a large initial covariance before convergence, or a function (like a bearings-only or strongly nonlinear coordinate transform) whose curvature is significant even over a modest uncertainty ellipse — in that regime the EKF's linearization error becomes a real, biasing error in the propagated mean and covariance, rather than an approximation error that averages out.
:::

::: check
Why can a standard linear Kalman update not be applied directly to all four components of a quaternion, and what does the multiplicative error-state approach do instead?
:::

::: answer
A quaternion has four parameters but only three genuine degrees of freedom, constrained to the unit-norm hypersphere — a linear update has no mechanism to keep the result on that constraint surface, so the updated quaternion generally drifts off unit norm, and the covariance describing four numbers with only three real degrees of freedom is singular in the constrained direction, which is mathematically ill-posed for a filter update. The multiplicative error-state approach instead estimates a three-parameter, unconstrained small-angle error relative to a reference quaternion, runs the ordinary linear Kalman machinery on that well-posed three-parameter state, and then composes the correction back onto the reference quaternion by quaternion multiplication (followed by renormalization) rather than by direct linear addition — respecting the constraint structurally instead of patching it after the fact.
:::

::: check
Why does pushing closed-loop bandwidth up toward a right-half-plane zero drive a control loop toward instability, in a sentence a follow-up question would be satisfied with?
:::

::: answer
An RHP zero contributes phase lag of the same sign as a delay rather than the phase lead an ordinary left-half-plane zero can provide, so as crossover frequency approaches the zero's location, the loop accumulates phase faster than a conventional compensator can recover it, eroding phase margin toward zero and eventually past it into instability — which is why the zero's location sets a real ceiling on achievable bandwidth rather than merely making high bandwidth harder to tune.
:::

::: check
A gain-scheduled controller is verified at five design points across the flight envelope and shows healthy margins at each one. Why is that not sufficient evidence the scheduled controller is safe across the whole envelope?
:::

::: answer
Checking only the design points says nothing about the *interpolated* behaviour between them — a schedule that is well-behaved at five discrete points can still pass through a region between two of them where the interpolated gains produce poor margins or even instability, especially if the plant's dynamics vary nonlinearly with the scheduling variable between grid points, or if the scheduling variable itself changes quickly enough that the "frozen-time" assumption behind gridding starts to break down. A more complete verification either grids much more densely across the whole envelope or uses a genuinely continuous method, such as linear parameter-varying analysis, that certifies stability across the full range rather than at a finite sample of points within it.
:::

## Summary

| Question | Core answer |
| --- | --- |
| RHP zero and bandwidth | Inverse response, phase lag of the wrong sign, bounds achievable crossover to roughly a fraction of the zero's own frequency |
| Gain scheduling | Needed when linearized dynamics vary greatly across the envelope; verify with dense gridding or LPV analysis, not only at design points |
| Discretization | Zero-order hold adds roughly $\omega T_s/2$ phase lag; unfiltered high-frequency content aliases into the controlled band |
| EKF vs UKF | Converge when uncertainty is small relative to nonlinearity's curvature; diverge in accuracy (at added cost for UKF) when it is not |
| Filter consistency | Reported covariance should match actual error statistics; tested with NEES against its chi-square distribution |
| Quaternion filtering | Multiplicative three-parameter error state avoids the unit-norm constraint a direct four-parameter linear update cannot respect |
| Environmental torques | Gravity-gradient, aerodynamic, solar-radiation-pressure, magnetic — small but secular, sometimes exploited for passive stabilization |

The next lesson turns from technical content entirely to the discipline of stating your own results credibly: numbers instead of adjectives, applied to project talks, a resume, and a portfolio a stranger can actually read.
