---
id: l09-slosh-and-structural-flex
title: Slosh and structural flex
minutes: 20
covers:
  - Slosh and structural flex models, and where they get inserted in the loop
---

The Rigid Body Dynamics module derived the equations this lesson uses without re-deriving them: the hub equation $I\ddot\vartheta + \delta\ddot\eta = M$ and the modal equation $\ddot\eta + \delta\ddot\vartheta + 2\zeta\omega_n\dot\eta + \omega_n^2\eta = 0$ for a flexible appendage, the cantilevered and free-free frequencies $\omega_n$ and $\omega_p = \omega_n/\sqrt{1-\sigma}$, and the slosh frequency $\omega_s^2 = (\xi_1 a/R)\tanh(\xi_1 h/R)$ for a cylindrical tank. What that module did not need to ask, because it was reasoning about the physics rather than building a running program, is where in a simulation these equations actually live, what they couple to, and what changes the moment you integrate them as part of a working loop instead of analysing them on paper. That is this lesson's entire job.

## The state vector gets bigger, not the architecture

A flex mode or a slosh mode is not a separate box in the five-box picture — it is additional state inside the Plant box, exactly the way position and quaternion already are. Each mode contributes two more state variables, a generalised coordinate and its rate ($\eta$, $\dot\eta$ for a structural mode; an equivalent pendulum angle and rate for a slosh mode), integrated by the same integrator, at the same fine step, alongside the rigid-body state. This has an immediate, concrete consequence for the two-rate architecture this module built earlier: $\Delta t_{\text{plant}}$ has to resolve whichever of these modes oscillates fastest, not just the rigid-body dynamics, which is exactly the warning the two-rate lesson raised about a $6\,\mathrm{Hz}$ bending mode simulated with a step sized for a $20\,\mathrm{Hz}$ controller.

::: example Integrating the coupled mode, and which frequency you actually get
Take a structural mode with $\sigma = \delta^2/I = 0.04$, cantilevered frequency $f_n = 6\,\mathrm{Hz}$, damping $\zeta = 0.005$, coupled to a hub with $I = 105{,}450\,\mathrm{kg\,m^2}$ — the inertia this module's mass-properties lesson computed at $t = 15\,\mathrm{s}$ into a burn. Solve the coupled $2\times2$ system for the two accelerations and integrate with RK4:

```python
import numpy as np

I, sigma, fn_hz, zeta = 105450.1, 0.04, 6.0, 0.005   # I from lesson 8 at t=15s
delta = np.sqrt(sigma*I)
wn = 2*np.pi*fn_hz
Amat = np.array([[I, delta], [delta, 1.0]])
Ainv = np.linalg.inv(Amat)

def deriv(state, M):
    theta, thetadot, eta, etadot = state
    Q = 2*zeta*wn*etadot + wn**2*eta
    thetaddot, etaddot = Ainv @ np.array([M, -Q])
    return np.array([thetadot, thetaddot, etadot, etaddot])

def rk4(state, M, dt):
    k1 = deriv(state, M); k2 = deriv(state+0.5*dt*k1, M)
    k3 = deriv(state+0.5*dt*k2, M); k4 = deriv(state+dt*k3, M)
    return state + dt/6*(k1+2*k2+2*k3+k4)

dt = 0.0005
state = np.array([0.0, 0.0, 0.001, 0.0])   # small modal displacement, hub free, M=0
ts, etas = [0.0], [state[2]]
for i in range(int(2.0/dt)):
    state = rk4(state, 0.0, dt)
    ts.append((i+1)*dt); etas.append(state[2])
ts, etas = np.array(ts), np.array(etas)

crossings = np.where(np.diff(np.sign(etas)) != 0)[0]
period = np.mean(np.diff(ts[crossings]))*2
wp = wn/np.sqrt(1-sigma)
print("det(A) =", np.linalg.det(Amat), " I*(1-sigma) =", I*(1-sigma))
print("measured free-response frequency (Hz):", 1/period)
print("cantilevered fn (Hz):", fn_hz, " free-free fp = fn/sqrt(1-sigma) (Hz):", wp/(2*np.pi))
# det(A) = 101232.09599999998  I*(1-sigma) = 101232.096
# measured free-response frequency (Hz): 6.123535676251332
# cantilevered fn (Hz): 6.0  free-free fp = fn/sqrt(1-sigma) (Hz): 6.123724356957946
```

Two things confirm what the Rigid Body Dynamics module stated and this lesson needed to verify by actually running it. First, the coefficient matrix's determinant is exactly $I(1-\sigma) = 101{,}232.1\,\mathrm{kg\,m^2}$ — the "effective inertia above the mode" that module's summary table named, appearing here as literally the determinant of the system this simulation has to solve at every step. Second, and more important for this lesson: with no external torque and the hub left *free* to respond — which is exactly the situation in a 6-DOF simulation, where nothing holds the vehicle's attitude fixed the way a cantilevered ground vibration test does — the coupled system's own free response oscillates at $6.124\,\mathrm{Hz}$, matching the *free-free pole* frequency $\omega_p/2\pi = 6.124\,\mathrm{Hz}$, not the cantilevered $6.000\,\mathrm{Hz}$ that went into the model as a parameter. A simulation that integrates the hub and the mode together, as it must, sees the pole frequency by construction; a ground test that clamps the hub sees the zero. Confusing the two — quoting a cantilevered test frequency as if it were what the flying, free vehicle will exhibit — is a small but real modelling error with exactly this mechanism behind it.
:::

## Slosh parameters are not constants either

The slosh frequency formula depends on the axial acceleration $a$ and the liquid height $h$, and this module's mass-properties lesson already computed both of those as functions of time over a burn: $a(t) = F/m(t)$ grows as mass depletes under constant thrust, and $h(t)$ shrinks as propellant burns. A slosh model that evaluates $\omega_s$ once, at the start of a burn, and holds it fixed is not a simplification — it is wrong for the entire rest of the burn, in a way that grows as the burn proceeds.

::: example How much the slosh frequency actually moves over one burn
Reusing the exact burn from the mass-properties lesson — $F = 800\,\mathrm{kN}$, $I_{sp} = 320\,\mathrm{s}$, a tank of radius $1.5\,\mathrm{m}$ and length $8\,\mathrm{m}$ starting with $25{,}000\,\mathrm{kg}$ of propellant over a $4{,}000\,\mathrm{kg}$ dry mass:

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F/(Isp*g0)
m_dry, m_prop0, L_tank, r_tank = 4000.0, 25000.0, 8.0, 1.5
xi1 = 1.8412

def slosh_freq(t):
    m_prop = max(m_prop0 - mdot*t, 0.0)
    h = L_tank*(m_prop/m_prop0)
    m_total = m_dry + m_prop
    a = F/m_total
    ws2 = (xi1*a/r_tank)*np.tanh(xi1*h/r_tank)
    return np.sqrt(ws2)/(2*np.pi), h, a

for t in [0, 15, 50, 90]:
    fs, h, a = slosh_freq(t)
    print(f"t={t:5.1f} s   h={h:.3f} m   a={a:6.2f} m/s^2   f_slosh={fs:.4f} Hz")
# t=  0.0 s   h=8.000 m   a= 27.59 m/s^2   f_slosh=0.9261 Hz
# t= 15.0 s   h=6.776 m   a= 31.78 m/s^2   f_slosh=0.9940 Hz
# t= 50.0 s   h=3.921 m   a= 49.22 m/s^2   f_slosh=1.2370 Hz
# t= 90.0 s   h=0.658 m   a=132.09 m/s^2   f_slosh=1.6568 Hz
```

The slosh frequency climbs from $0.926\,\mathrm{Hz}$ at ignition to $1.657\,\mathrm{Hz}$ near the end of the burn — a $79\%$ increase — driven by the acceleration term growing faster than the shrinking-tanh term falls. A controller with a notch filter tuned to reject slosh at the ignition frequency is tuned to the wrong frequency for the rest of the burn; the only correct architecture is one where $\omega_s$ is recomputed from the plant's *current* mass and acceleration state every step, exactly the way the previous lesson insisted the inertia tensor be recomputed rather than scaled.
:::

## What GNC gets to see, and what it does not

Nothing about this lesson changes the rule the five-box lesson established: GNC never reads plant truth directly. The flight software does not receive $\eta$ or $\dot\eta$, or a slosh pendulum's angle, as inputs — it receives whatever a sensor produces, and a sensor mounted away from a node of the mode sees a *combination* of rigid-body motion and local structural deflection, which is exactly the non-collocated sensing problem the Rigid Body Dynamics module analysed through the right-half-plane zero. In most vehicles the flight software's own internal model contains rigid-body dynamics explicitly — it was designed around them — but not flex or slosh dynamics in any detailed sense; those are phenomena the control loop must be *robust to*, via gain stabilisation, a notch filter, or simply enough phase margin at the mode's frequency, rather than phenomena it explicitly estimates and cancels. That robustness is exactly what the bandwidth rule from the Rigid Body Dynamics module — crossover comfortably below the lowest structural pole — is protecting, and it is exactly what a rate limit's describing-function phase loss or an unmodelled sensor delay, from the two previous lessons, can quietly erode if either happens to land near a mode's frequency rather than safely below it.

Where the mode's parameters come from crosses box boundaries in a way worth noticing explicitly: the slosh frequency needs the current thrust, which is the Actuators box's output, and the current mass, which the Plant box is tracking from the mass-properties model. None of the five boxes is a hermetically sealed unit that only ever reads its official upstream neighbour — Plant's own internal bookkeeping legitimately draws on Actuators' commanded thrust to update a truth quantity (slosh frequency) that stays entirely on the truth side of the Sensors boundary. What must never happen is GNC drawing on that same information directly; the boundary that matters is the one between truth and what a sensor actually reports, not a rule that every box may only ever look at exactly one other box.

::: key Where slosh and flex live in the loop
Flex and slosh modes are additional Plant-box state, integrated by the same fine-step integrator as the rigid-body equations of motion — which must therefore resolve the fastest mode present, not just the control rate. Their parameters (frequency, damping, modal participation) are functions of the vehicle's current mass and acceleration state and must be recomputed every step, not fixed at ignition values. A free vehicle's coupled hub-plus-mode system oscillates at the free-free pole frequency $\omega_p = \omega_n/\sqrt{1-\sigma}$, not the cantilevered frequency $\omega_n$ a ground test measures. GNC sees these modes only through whatever a sensor's placement and the mode's shape combine to produce — never directly.
:::

::: warning A slosh or flex frequency computed once at ignition
Freezing $\omega_s$ or $\omega_n$-derived quantities at their ignition-time values because "the tank doesn't move much in one control cycle" mistakes a true statement about a single tick for a false one about the whole burn: the example above showed a $79\%$ frequency change over $90\,\mathrm{s}$, far larger than anything a single control cycle could produce, and a notch filter or gain-stabilisation margin sized for the wrong frequency protects against nothing.
:::

::: warning Giving the flight software the modal state "just to check something"
Feeding $\eta$ or a slosh angle directly into the flight software during development — to verify a filter design against the true structural motion, say — is the same mistake the five-box lesson warned about for rigid-body truth, with the same fix: isolate the algorithm with a unit test, and leave the closed-loop simulation's Sensors boundary intact. A controller that has ever seen modal truth directly has never been validated against what it will actually have to work with in flight, which is a sensor's noisy, non-collocated, band-limited view of the same motion.
:::

## Check yourself

::: check
Why must the plant's fine integration step resolve a vehicle's structural and slosh modes, and not just its rigid-body dynamics and the control rate?
:::

::: answer
Flex and slosh modes are additional state variables integrated inside the Plant box by the same fixed-step integrator as the rigid-body state, and an integrator only resolves dynamics it takes small enough steps against. If the fine step is sized only for the rigid-body motion or the control rate, the fastest mode present — whichever is highest in frequency among the structural modes, slosh modes and rigid-body coupling — is under-resolved regardless of how well everything else in the simulation is set up.
:::

::: check
The coupled hub-plus-mode simulation in this lesson's first example produced a free response at $6.124\,\mathrm{Hz}$, even though the cantilevered frequency parameter fed into the model was $6.000\,\mathrm{Hz}$. Explain why, and say what kind of test would actually measure $6.000\,\mathrm{Hz}$.
:::

::: answer
$6.000\,\mathrm{Hz}$ is the cantilevered frequency, which describes the mode when the hub is held fixed — a boundary condition. In the simulation, the hub is free to rotate under the mode's own coupling torque, with nothing holding it, so the system's actual free response is at the free-free pole frequency $\omega_p = \omega_n/\sqrt{1-\sigma}$, here $6.124\,\mathrm{Hz}$. A ground vibration test that physically clamps the structure at the hub would measure the cantilevered $6.000\,\mathrm{Hz}$; a simulation of the free-flying vehicle, or a real vehicle in flight, will not exhibit that frequency at all.
:::

::: check
The slosh frequency example showed $f_{\text{slosh}}$ rising from $0.926\,\mathrm{Hz}$ to $1.657\,\mathrm{Hz}$ over a burn. Which two physical changes drive this, and do they push the frequency in the same direction or opposite directions?
:::

::: answer
Two things change: the axial acceleration $a = F/m$ rises as mass depletes under constant thrust, which by itself increases $\omega_s$ since $\omega_s^2 \propto a$; and the liquid height $h$ falls as propellant burns, which by itself decreases $\omega_s$ through the $\tanh(\xi_1 h/R)$ factor. They push in opposite directions, and the net result in the example is a substantial increase, meaning the acceleration effect dominates for most of this burn — a conclusion that had to be computed rather than guessed, since the two effects are not obviously comparable in size without evaluating the formula.
:::

::: check
A teammate proposes feeding the flight software's navigation filter the true modal displacement $\eta(t)$ directly during a development test, "just to see whether the filter's structural-mode rejection is working correctly." What is wrong with this, and what should be done instead?
:::

::: answer
Feeding the filter truth directly means it has never been tested against what it will actually receive in flight — a sensor's measurement, shaped by that sensor's location relative to the mode and corrupted by the sensor's own noise, bias and latency. Whatever "working correctly" means under that test says nothing about flight performance. The isolated question — does the filter's structural-mode rejection logic behave as intended — belongs in a unit test that calls the filter directly with constructed inputs, leaving the closed-loop simulation's Sensors boundary untouched.
:::

::: check
The text notes that the slosh frequency depends on both the current thrust (an Actuators-box quantity) and the current mass (tracked inside the Plant box), and that this is not a violation of the five-box discipline. Why not, given that the first lesson of this module insisted the boxes stay separable?
:::

::: answer
The five-box discipline's real requirement is that GNC never reads plant or environment truth directly, and that the plant never receives a command directly — not that every box may only ever consult exactly one official upstream neighbour for every internal calculation. The Plant box's own bookkeeping legitimately uses the Actuators box's actual delivered thrust (not GNC's command) to update a truth quantity that stays entirely on the truth side of the simulation; nothing here lets GNC see modal state, and nothing here lets a command bypass the Actuators box's own dynamics. The two rules that matter are both still intact.
:::

::: check
Why would a controller's phase margin, sized adequately against sensor latency and actuator rate limits alone, still be at risk from a structural mode this lesson's models did not directly cause?
:::

::: answer
Phase margin is a property of the whole open-loop transfer function at its crossover frequency, and every phase-eroding effect in the loop — sensor latency, the zero-order hold, actuator rate limiting, and a structural mode's own dynamics if the mode's frequency happens to be close enough to crossover to contribute — stacks at that same frequency. A margin computed only against latency and rate limits, without checking where the nearest structural or slosh mode sits relative to crossover, could still be eroded to nothing once that mode's contribution is included, which is exactly why the bandwidth rule (crossover comfortably below the lowest structural pole) is a separate, necessary check rather than something the delay-margin analysis alone covers.
:::

## Summary

| Item | Statement |
| --- | --- |
| Where the state lives | Additional Plant-box state ($\eta$, $\dot\eta$ per mode), integrated by the same fine-step integrator as the rigid-body equations |
| Step-size consequence | $\Delta t_{\text{plant}}$ must resolve the fastest mode present, not only the control rate |
| Coupled free response | A free hub oscillates at the free-free pole $\omega_p = \omega_n/\sqrt{1-\sigma}$, not the cantilevered $\omega_n$ — measured $6.124\,\mathrm{Hz}$ against a $6.000\,\mathrm{Hz}$ parameter |
| Effective inertia check | $\det\begin{pmatrix}I&\delta\\\delta&1\end{pmatrix} = I(1-\sigma) = 101{,}232\,\mathrm{kg\,m^2}$, matching the Rigid Body Dynamics module's effective-inertia result |
| Slosh parameters vary | $\omega_s(t)$ from the plant's current $a(t) = F/m(t)$ and $h(t)$; measured $0.926 \to 1.657\,\mathrm{Hz}$ (79%) over one burn |
| GNC's view | Never direct; only through a sensor's noisy, non-collocated measurement — the same boundary as every other truth quantity |
| Cross-box data flow | A truth-side calculation may legitimately draw on another box's true output (e.g. Actuators' delivered thrust); the boundary that must never be crossed is truth into GNC or command straight into Plant |

The plant, its environment, and now its own flexible and sloshing structure are all in place; the next lesson turns to the moments when this otherwise-smooth state changes discontinuously — staging — and the event-detection machinery that lands the simulation exactly on the moment it happens rather than stepping over it.
