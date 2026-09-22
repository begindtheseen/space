---
id: l14-validation-analytic-solutions-and-conservation-laws
title: "Validation: analytic solutions, conservation laws and flight data"
minutes: 30
covers:
  - Validation against analytic solutions, conservation laws, and eventually flight data
---

Every lesson before this one added something to the simulation: a clock architecture, a frame convention, models for the environment, the sensors, the actuators, the mass properties, the flex and slosh dynamics, the events. None of it is worth anything until you can say, with evidence rather than confidence, that the program actually does what it claims to. This lesson is about that evidence — what it looks like, how precise it has to be, and, because the task asked for honesty rather than reassurance, a worked case where a simulation looks completely fine and is not, and the specific check that catches it.

## Verification and validation are different questions

**Verification** asks whether the code solves the equations you wrote down, correctly. It is a question about the program, and it is answered by comparing the program's output against something known independently of the program: a closed-form solution, a conservation law the true equations obey exactly, a second independent implementation. **Validation** asks whether those are the right equations in the first place — whether the model matches the physical vehicle. It is a question about the world, and no amount of checking the code against itself can answer it; it is answered only by comparing the simulation against data from something real: a component test, a wind tunnel run, eventually flight itself.

The two are independent in a way worth being precise about. A simulation can be perfectly verified — solving its equations to machine precision — while being built on a wrong aerodynamic database, and it will be verified and wrong. A simulation can also be validated in the sense that its outputs happen to match a data point, while containing a bug that only shows up outside the range that data point covered. Verification is necessary and comes first, because there is no point comparing a buggy program against test data — you would not be able to tell whether a mismatch was the model or the code. This lesson is mostly about verification, because it is the part you can do entirely yourself, with no flight data and no test campaign, using tools already in this curriculum.

## The validation ladder

Four checks, in increasing order of what they exercise, each with a number attached rather than a claim.

::: example Three rungs, three tolerances
**Vacuum analytic trajectory.** Under constant thrust with no gravity or drag, $\dot v = F/m(t)$ integrates in closed form — the Tsiolkovsky rocket equation, $\Delta v = I_{sp}g_0\ln(m_0/m(t))$ — using exactly the mass depletion this module's mass-properties lesson modelled. Run the plant's own RK4 stepper against it, landing exactly on burnout the way the event-detection lesson insisted on:

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F/(Isp*g0)
m0 = 29000.0
t_burn = (m0 - 4000.0)/mdot   # burn to the 4000 kg dry mass used throughout this module

def m(t): return m0 - mdot*t
def dv_exact(t): return Isp*g0*np.log(m0/m(t))     # Tsiolkovsky
def deriv(v, t): return F/m(t)

def rk4_step(v, t, dt):
    k1 = deriv(v, t)
    k2 = deriv(v + 0.5*dt*k1, t + 0.5*dt)
    k3 = deriv(v + 0.5*dt*k2, t + 0.5*dt)
    k4 = deriv(v + dt*k3, t + dt)
    return v + dt/6*(k1 + 2*k2 + 2*k3 + k4)

def integrate(dt_nom, t_end):
    v, t = 0.0, 0.0
    while t + dt_nom < t_end - 1e-12:              # step exactly to t_end, as lesson 10 insisted
        v = rk4_step(v, t, dt_nom); t += dt_nom
    if t < t_end:
        v = rk4_step(v, t, t_end - t); t = t_end
    return v

for dt in [1.0, 0.1]:
    v = integrate(dt, t_burn)
    exact = dv_exact(t_burn)
    print(f"dt={dt:.1f}:  RK4 dv={v:.6f}  Tsiolkovsky dv={exact:.6f}  relative diff={abs(v-exact)/exact:.3e}")
# dt=1.0:  RK4 dv=6216.636283  Tsiolkovsky dv=6216.636177  relative diff=1.701e-08
# dt=0.1:  RK4 dv=6216.636178  Tsiolkovsky dv=6216.636177  relative diff=1.740e-12
```

At $\Delta t = 0.1\,\mathrm{s}$, RK4 agrees with the closed-form answer to $1.74\times10^{-12}$ relative — essentially the limit of what double-precision arithmetic can represent over roughly a thousand steps. This confirms the integrator and the mass-depletion model are wired together correctly; it says nothing yet about gravity, attitude, or anything rotational.

**Ballistic coast, energy conservation.** With thrust off, coasting under gravity alone on the $500\,\mathrm{km}$ circular orbit this curriculum has used before ($r_0 = 6{,}878.137\,\mathrm{km}$), specific energy $\varepsilon = v^2/2 - \mu/r$ must be exactly constant. Over one full orbital period ($5{,}676.98\,\mathrm{s}$) at $\Delta t = 10\,\mathrm{s}$, the measured relative deviation is $2.90\times10^{-11}$ — round-off, not drift, confirming the translational equations of motion and the integrator agree with a conservation law the true physics obeys exactly.

**Torque-free spin, angular momentum and quaternion norm.** The bus from earlier lessons, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, tumbling at $\boldsymbol\omega_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$ with no torque, integrated for $300\,\mathrm{s}$ at $\Delta t = 0.01\,\mathrm{s}$: $\lVert\mathbf{H}\rVert$ deviates by $5.64\times10^{-16}$ relative, kinetic energy $T$ by $1.39\times10^{-15}$ — matching the Rigid Body Dynamics module's own result for this exact case — and, because every step renormalises the quaternion as the frame-discipline lesson in this module insisted, $\lVert q\rVert$ deviates from $1$ by exactly zero, to the last bit.
:::

Three independent conservation laws or closed-form solutions, three tolerances stated rather than assumed, each isolating a different part of the plant. None of them, on their own, says the *model* is right — a perfectly conserved simulation of a vehicle with the wrong aerodynamic database still conserves energy perfectly whenever thrust and drag are switched off, because conservation follows from the *structure* of the equations (a central force, a torque-free system), not from whether the specific numbers inside them describe the real vehicle. That is exactly the boundary between verification and validation this lesson opened with.

::: example The intermediate-axis instability, and conservation holding straight through it
A verification case does not have to be gentle to be trustworthy. Spin the same bus almost exactly about each of its three principal axes in turn, with a tiny $10^{-4}\,\mathrm{rad/s}$ perturbation on the other two, torque-free, for $600\,\mathrm{s}$:

```python
import numpy as np

I3 = np.array([1200.0, 1500.0, 2000.0])

def euler_deriv(w):
    return np.array([((I3[1]-I3[2])*w[1]*w[2])/I3[0], ((I3[2]-I3[0])*w[2]*w[0])/I3[1],
                      ((I3[0]-I3[1])*w[0]*w[1])/I3[2]])

def rk4_w(w, dt):
    k1 = euler_deriv(w); k2 = euler_deriv(w + 0.5*dt*k1)
    k3 = euler_deriv(w + 0.5*dt*k2); k4 = euler_deriv(w + dt*k3)
    return w + dt/6*(k1 + 2*k2 + 2*k3 + k4)

dt, n_steps, eps = 0.01, 60000, 1e-4   # 600 s, a tiny perturbation

def transverse_peak(w0, axis):
    w = w0.copy()
    others = [i for i in range(3) if i != axis]
    peak = np.hypot(w[others[0]], w[others[1]])
    for _ in range(n_steps):
        w = rk4_w(w, dt)
        peak = max(peak, np.hypot(w[others[0]], w[others[1]]))
    return peak, w

for label, w0, axis in [("minor (I1)", np.array([0.10, eps, eps]), 0),
                         ("intermediate (I2)", np.array([eps, 0.10, eps]), 1),
                         ("major (I3)", np.array([eps, eps, 0.10]), 2)]:
    start = np.hypot(*[w0[i] for i in range(3) if i != axis])
    peak, wf = transverse_peak(w0, axis)
    H0, Hf = np.linalg.norm(I3*w0), np.linalg.norm(I3*wf)
    print(f"spin about {label:18s} axis: transverse rate {start:.1e} -> peak {peak:.4e} rad/s "
          f"(x{peak/start:.1f})   H rel dev over 600 s: {abs(Hf-H0)/H0:.2e}")
# spin about minor (I1)         axis: transverse rate 1.4e-04 -> peak 2.1344e-04 rad/s (x1.5)   H rel dev over 600 s: 1.22e-14
# spin about intermediate (I2)  axis: transverse rate 1.4e-04 -> peak 1.0308e-01 rad/s (x728.9)   H rel dev over 600 s: 1.25e-14
# spin about major (I3)         axis: transverse rate 1.4e-04 -> peak 1.5100e-04 rad/s (x1.1)   H rel dev over 600 s: 2.46e-14
```

Spinning about the minor or major axis, the perturbation barely grows — a factor of $1.1$ to $1.5$. Spinning about the intermediate axis, the same tiny perturbation grows by a factor of $729$, exactly the tennis-racket instability the Rigid Body Dynamics module derived analytically. A simulation that failed to reproduce this — a bounded wobble instead of the characteristic flip — would have a real bug in its inertia coupling, not a subtle one. And through all three of these wildly different behaviours, $\lVert\mathbf{H}\rVert$ stays conserved to $10^{-14}$: the conservation check and a dramatic, physically real instability are not in tension. Verification does not mean "boring"; it means the numbers do what the equations say they must, however the equations behave.
:::

## Component data, and validating a vehicle that has never flown

Conservation laws only ever confirm the code against itself. Confirming the *model* against reality needs data from something real: an engine hot-fire for the thrust curve and its start-up transient, a TVC frequency-response test for the gimbal dynamics, wind tunnel or CFD for the aerodynamic database, a modal survey for the structural frequencies this module's flex model needs, a sensor bench characterisation for the noise and bias figures a navigation filter will be tuned against. Each of these validates one model, in isolation, against a measurement of the real thing that model represents — and a vehicle that has never flown can still be validated this way, component by component, even though the *assembled system's* end-to-end behaviour cannot be checked against flight data yet. What cannot be validated before flight — genuine full-vehicle aerodynamic interference effects, some staging dynamics, anything that only the complete, integrated vehicle produces — has to be carried explicitly as a stated uncertainty and covered by margin, not assumed away. The honest version of "this simulation can be trusted" before first flight is never "it is right"; it is "every model in it is validated against the data that model has, the whole assembly is verified against everything conservation and closed-form analysis can check, and here, explicitly, is the list of what is still unvalidated and how large a dispersion covers it."

## The case where the trajectory hides the bug

Every check so far would pass on a simulation with a serious defect, as long as the defect happened not to touch the specific quantity being checked. Here is a defect that does not stay hidden — but only if you know to look at the right thing.

::: example A frame bug the trajectory does not show, and the energy check that catches it in seconds
Suppose gravity is computed correctly in body-frame components — exactly the quantity an accelerometer model legitimately needs, from this module's sensor-models lesson — and that value is then used directly as the inertial-frame gravity in the plant's translational equation of motion, with the rotation back into inertial frame left out entirely. Exactly the "adjacent frame labels do not cancel" bug the frame-discipline lesson warned about, now embedded in a working simulation rather than a single line.

The vehicle is on the same $500\,\mathrm{km}$ orbit as before, additionally tumbling — a plausible derelict or coasting stage, its rotation unrelated to its orbit — at the same $\boldsymbol\omega_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$ used throughout this module.

```python
import numpy as np

mu, r0 = 398600.4418, 6878.137          # the 500 km orbit used throughout this curriculum
v0 = np.sqrt(mu/r0)
r_I0, v_I0 = np.array([r0, 0.0, 0.0]), np.array([0.0, v0, 0.0])
eps0 = 0.5*v0**2 - mu/r0

I3 = np.array([1200.0, 1500.0, 2000.0])  # the bus, tumbling independently of the orbit

def euler_deriv(w):
    return np.array([((I3[1]-I3[2])*w[1]*w[2])/I3[0], ((I3[2]-I3[0])*w[2]*w[0])/I3[1],
                      ((I3[0]-I3[1])*w[0]*w[1])/I3[2]])

def rk4_w(w, dt):
    k1 = euler_deriv(w); k2 = euler_deriv(w + 0.5*dt*k1)
    k3 = euler_deriv(w + 0.5*dt*k2); k4 = euler_deriv(w + dt*k3)
    return w + dt/6*(k1 + 2*k2 + 2*k3 + k4)

def quat_mult(q, p):
    q0,q1,q2,q3 = q; p0,p1,p2,p3 = p
    return np.array([q0*p0-q1*p1-q2*p2-q3*p3, q0*p1+q1*p0+q2*p3-q3*p2,
                      q0*p2-q1*p3+q2*p0+q3*p1, q0*p3+q1*p2-q2*p1+q3*p0])

def rk4_q(q, w, dt):
    def qd(q): return 0.5*quat_mult(q, np.array([0.0, *w]))
    k1 = qd(q); k2 = qd(q + 0.5*dt*k1); k3 = qd(q + 0.5*dt*k2); k4 = qd(q + dt*k3)
    qn = q + dt/6*(k1 + 2*k2 + 2*k3 + k4)
    return qn/np.linalg.norm(qn)

def dcm_BI(q):                            # C_{B<-I}: inertial components -> body components
    q0,q1,q2,q3 = q
    return np.array([[1-2*(q2**2+q3**2), 2*(q1*q2+q0*q3), 2*(q1*q3-q0*q2)],
                      [2*(q1*q2-q0*q3), 1-2*(q1**2+q3**2), 2*(q2*q3+q0*q1)],
                      [2*(q1*q3+q0*q2), 2*(q2*q3-q0*q1), 1-2*(q1**2+q2**2)]])

def run(dt, t_end, buggy):
    r, v = r_I0.copy(), v_I0.copy()
    w, q = np.array([0.02, 0.0, 0.10]), np.array([1.0, 0.0, 0.0, 0.0])
    def accel(r, q):
        if not buggy:
            return -mu*r/np.linalg.norm(r)**3
        r_B = dcm_BI(q) @ r                                    # correctly computed in body frame
        return -mu*r_B/np.linalg.norm(r_B)**3                  # the bug: used directly as inertial
    for _ in range(int(round(t_end/dt))):
        def deriv(r, v, q): return v, accel(r, q)
        k1r,k1v = deriv(r, v, q); k2r,k2v = deriv(r+0.5*dt*k1r, v+0.5*dt*k1v, q)
        k3r,k3v = deriv(r+0.5*dt*k2r, v+0.5*dt*k2v, q); k4r,k4v = deriv(r+dt*k3r, v+dt*k3v, q)
        r = r + dt/6*(k1r+2*k2r+2*k3r+k4r); v = v + dt/6*(k1v+2*k2v+2*k3v+k4v)
        w = rk4_w(w, dt); q = rk4_q(q, w, dt)
    return r, 0.5*np.dot(v, v) - mu/np.linalg.norm(r)

dt = 5.0
r_true, eps_true = run(dt, 20.0, buggy=False)
r_bug, eps_bug = run(dt, 20.0, buggy=True)
pos_err = np.linalg.norm(r_bug - r_true)
print(f"t=20 s: position deviation = {pos_err:.4f} km ({100*pos_err/r0:.4f}% of orbital radius)")
print(f"t=20 s: specific-energy relative deviation = {abs(eps_bug-eps0)/abs(eps0):.4%}")
print(f"        (true-physics run: {abs(eps_true-eps0)/abs(eps0):.2e})")
# t=20 s: position deviation = 0.6957 km (0.0101% of orbital radius)
# t=20 s: specific-energy relative deviation = 2.5428%
#         (true-physics run: 3.19e-15)

# is this truncation error or a real defect? halve the step and see whether the
# drift shrinks the way truncation error must (the Numerical Methods module's test)
for dt2 in [5.0, 2.5, 1.25]:
    _, eps_b2 = run(dt2, 50.0, buggy=True)
    print(f"  dt={dt2:5.2f} s   energy drift = {abs(eps_b2-eps0)/abs(eps0):.4%}")
# dt= 5.00 s   energy drift = 2.1764%
# dt= 2.50 s   energy drift = 1.9600%
# dt= 1.25 s   energy drift = 1.8453%
```

Twenty seconds in, the buggy trajectory has drifted from the true one by $0.6957\,\mathrm{km}$ — one part in ten thousand of the orbital radius, invisible on any plot anyone would actually look at, and well within the kind of dispersion a real mission tolerates from a dozen mundane causes. The specific energy, meanwhile, has already moved by $2.54\%$ — against a true-physics baseline conserved to three parts in $10^{15}$. Nothing about the position or velocity trace would make anyone stop and look twice. The conservation check is already screaming.

That still leaves one honest question: is $2.54\%$ truncation error from the integrator, or a real defect? The scaling test above answers it, the way the Numerical Methods module's own diagnostic works: quartering the step size (two halvings) should shrink genuine RK4 truncation error by a factor on the order of $4^5 \approx 1{,}000$.

Quartering the step size instead changed the drift by barely $15\%$, nowhere near that order-of-magnitude collapse. This is not truncation error behaving badly; it is a real force in the equations of motion that is not the force the physics actually has. Two lines of evidence — a conservation law violated by percent when the true physics holds it to $10^{-15}$, and a drift that refuses to shrink with the step — together prove there is a genuine bug, at a point in the simulation's life when the trajectory itself gave no reason to suspect one.
:::

::: key Verification vs validation
Verification: am I solving the equations right? A code question, answered by analytic cases and conservation laws you can check with no data from the real vehicle at all. Validation: am I solving the right equations? A physics question, answered only by comparing against data from the real thing — component tests before flight, flight data after. Both are required; neither substitutes for the other, and a bug that respects the quantity you happen to be checking passes any single check regardless of which kind it is.
:::

::: key The validation ladder
Vacuum analytic trajectory; energy conservation on a ballistic coast; angular momentum and quaternion norm under torque-free spin; the intermediate-axis (tennis racket) instability; then component test data (hot fire, TVC frequency response, wind tunnel, modal survey, sensor bench); then flight data. Each rung is stated with the tolerance it actually achieved, not merely claimed to pass.
:::

::: warning A trajectory that "looks right" is not evidence
The worked example's position error was a hundredth of a percent at the moment its energy error was already several percent. Any review process that eyeballs a trajectory plot and moves on would have passed this simulation. Left running for two full orbital periods instead of twenty seconds, the same bug takes the vehicle from $6{,}878\,\mathrm{km}$ out to $87{,}890\,\mathrm{km}$ — nearly thirteen times its starting radius — but by then it is far too late to call the discovery early. The only way to catch a bug like this before it costs real schedule is to make conservation checks a standard, automatic part of every run, not a special investigation reserved for when something already looks visibly wrong.
:::

::: warning Treating a passed conservation check as validation
Conservation checks are verification, not validation — they confirm the code respects the mathematical structure of physics it was written to have, using nothing but the equations themselves. A simulation with a perfectly correct integrator and a completely wrong aerodynamic database passes every check in this lesson's ladder without exception, because none of those checks ever looks at the aerodynamic database. Passing verification is necessary before validation is worth attempting, and it is never a substitute for it.
:::

## Check yourself

::: check
A simulation conserves energy to $10^{-13}$ on a ballistic coast and also uses an aerodynamic database later shown to be $20\%$ wrong. Is this a contradiction?
:::

::: answer
No. Energy conservation on a ballistic coast checks the translational equations of motion under gravity alone, with thrust and aerodynamic forces switched off entirely — it never exercises the aerodynamic database at all. A wrong aerodynamic database is a validation failure (the wrong physics for that specific force), invisible to a verification check that does not touch it. The two findings describe different parts of the simulation and are both simultaneously true.
:::

::: check
Why does the frame-bug example check specific energy rather than only plotting position and velocity against a reference trajectory?
:::

::: answer
At the point examined, the position deviation was only $0.01\%$ of the orbital radius — small enough that a plotted trajectory would look indistinguishable from correct — while the energy deviation was already $2.54\%$, because specific energy is far more sensitive to the *direction* of the force (which the bug corrupted) than raw position is over a short arc. Checking a quantity the true physics holds to near-zero exposes a defect long before its accumulated effect on the trajectory itself becomes visually obvious.
:::

::: check
The frame-bug example's energy drift only fell from $2.18\%$ to $1.85\%$ when the step size was quartered. What would you expect to see instead if the $2.18\%$ drift had genuinely been RK4 truncation error, and why does the observed behaviour rule that out?
:::

::: answer
If the drift were RK4 truncation error on a correctly modelled central force, quartering the step should shrink a per-step error scaling as $h^5$ by a factor on the order of $4^5 \approx 1{,}024$ over a fixed number of orbital periods, or comparably large reductions in any reasonable truncation-error accounting — certainly not the observed $15\%$ change. Truncation error is a property of how finely a *correct* equation is being integrated; a drift that barely responds to step size is not being caused by the fineness of the integration at all, which points to an error in the physics being integrated instead.
:::

::: check
Why is a wind tunnel test a validation activity rather than a verification activity, even though it produces numbers that get compared against the simulation exactly the way a conservation check does?
:::

::: answer
A conservation check compares the simulation against a consequence of the equations it was already built to solve — a purely internal, code-level comparison requiring no measurement of anything physical. A wind tunnel test compares the simulation's aerodynamic model against a measurement of a real physical vehicle (or a scale model of one) in real airflow, which is exactly the "is this the right equation" question validation asks. The comparison method looks superficially similar — numbers checked against numbers — but the source of the reference numbers is the entire distinction between the two activities.
:::

::: check
A programme has no flight data yet and needs to argue its simulation is trustworthy enough to support a launch decision. Using this lesson's terms, sketch the shape of that argument.
:::

::: answer
Verify first: show the vacuum analytic case, energy and angular-momentum conservation, and the quaternion-norm and intermediate-axis checks all hold to stated, tight tolerances, establishing that the code solves its equations correctly with no need for any test data. Then validate what can be validated before flight: each individual model — thrust curve, gimbal dynamics, aerodynamic database, structural frequencies, sensor noise and bias — compared against its own component-level test data. Finally, state explicitly what remains unvalidated because only the complete, flying vehicle could produce it, and show that a dispersion campaign carries a margin wide enough to cover that stated ignorance rather than assuming it away.
:::

::: check
Why does the text insist on stating the exact tolerance each verification check achieved ("$1.74\times10^{-12}$", "$5.64\times10^{-16}$") rather than reporting only that each check "passed"?
:::

::: answer
"Passed" hides how close to the edge the result actually was and gives no way to notice if a later change quietly degrades the margin — a check that "passes" at $10^{-3}$ and one that passes at $10^{-14}$ are both technically passing, but only the specific number reveals that the first is uncomfortably far from what the physics and the integrator's known order should deliver. Stating the tolerance turns every check into a number that can be tracked over time, compared against the integrator's theoretical order, and used exactly as the frame-bug example used it — to distinguish ordinary truncation error from a genuine defect.
:::

## Summary

| Check | What it verifies | Result |
| --- | --- | --- |
| Vacuum analytic (Tsiolkovsky) | Mass depletion and integrator, no gravity | $1.74\times10^{-12}$ relative at $\Delta t = 0.1\,\mathrm{s}$ |
| Ballistic energy conservation | Translational equations of motion under gravity | $2.90\times10^{-11}$ relative over one orbit |
| Torque-free $\lVert\mathbf{H}\rVert$, $T$, $\lVert q\rVert$ | Rotational equations of motion and quaternion kinematics | $5.64\times10^{-16}$, $1.39\times10^{-15}$, exactly $0$ (renormalised) |
| Intermediate-axis instability | Inertia coupling, under a dramatic, correctly-predicted instability | $729\times$ growth (intermediate) vs. $1.1$–$1.5\times$ (major/minor); $\mathbf{H}$ held to $10^{-14}$ throughout |
| Component data | The model, against a real measurement of one part | Hot fire, TVC frequency response, wind tunnel, modal survey, sensor bench |
| Flight data | The whole assembly, against reality | The only check nothing else substitutes for |
| The frame-bug case | A plausible trajectory, an energy check that is not fooled | $0.01\%$ position deviation vs. $2.54\%$ energy deviation at the same instant |

Verification earns the right to trust the code; validation earns the right to trust the model. The next lesson turns to keeping that trust over time — regression testing and the golden-file comparisons that catch an unintended change, and the harder problem of what to do when a change is intended and every golden file moves anyway.
