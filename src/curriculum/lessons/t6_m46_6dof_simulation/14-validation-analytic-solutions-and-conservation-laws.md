---
id: l14-validation-analytic-solutions-and-conservation-laws
title: "Validation: analytic solutions, conservation laws and flight data"
minutes: 24
covers:
  - Validation against analytic solutions, conservation laws, and eventually flight data
---

Run a spell checker over a history essay. It can promise you that every word is spelled right. It cannot tell you whether the Battle of Hastings really was in 1066. Those are two different kinds of checking. The first checks that you wrote what you meant. The second checks that what you meant is true.

A simulation needs both kinds. Every lesson before this one added a piece: a clock architecture, frame conventions, models of the environment, sensors, actuators, mass properties, flex and slosh, events. None of it is worth anything until you can say, with evidence rather than confidence, that the program does what it claims. This lesson is about that evidence: what it looks like, how precise it has to be, and a worked case where a simulation looks completely fine and is not — plus the specific check that catches it.

On a real program, this evidence is what a review board reads before it lets the simulation's numbers support a launch decision.

## Verification and validation are different questions

**Verification** asks: does the code solve the equations I wrote down, correctly? It is the spell check. It is a question about the program. You answer it by comparing the program's output against something known without the program: a **[[closed-form|closed-form]]** solution, a conservation law the true equations obey exactly, or a second, independent implementation.

**Validation** asks: are these the right equations — does the model match the real vehicle? It is the history check. It is a question about the world, and no amount of checking the code against itself can answer it. Only data from something real can: a component test, a wind tunnel run, and eventually flight itself.

The two are independent, and it pays to be precise about how. A simulation can be perfectly verified — solving its equations to the last digit — while built on a wrong aerodynamic table. It is then verified *and* wrong. A simulation can also match one test data point while hiding a bug that only shows up outside the range that data point covered.

Verification comes first. There is no point comparing a buggy program against test data, because when they disagree you cannot tell whether the model or the code is to blame. This lesson spends most of its time on verification, because you can do it entirely yourself, with no flight data and no test campaign.

::: key Verification vs validation
Verification: am I solving the equations right? Validation: am I solving the right equations? The first is a code question answered by analytic cases; the second is a physics question answered by test data. Both are required; neither substitutes for the other, and a bug that leaves untouched the quantity you happen to be checking passes any single check, whichever kind it is.
:::

## The validation ladder

Picture checking a new bathroom scale. First put nothing on it: it should read zero. Then a $1\,\mathrm{kg}$ bag of sugar: it should read $1\,\mathrm{kg}$. Then two bags. Each test is simple, has a known answer, and exercises a bit more of the scale.

A simulation gets the same treatment, called the **validation ladder**. Each rung checks something with a known answer, and each exercises more of the plant. Every rung reports a *number* — how close it came — not just "pass".

::: example Three rungs, three tolerances
**Rung 1: a vacuum trajectory with a known answer.** Take constant thrust, no gravity, no drag. Then $\dot v = F/m(t)$ (read "v dot", the rate of change of speed) has an exact answer, the **[[Tsiolkovsky rocket equation|tsiolkovsky]]**:

$$
\Delta v = I_{sp}\,g_0 \ln\!\frac{m_0}{m(t)}.
$$

Here $I_{sp}$ is the specific impulse, $g_0 = 9.80665\,\mathrm{m/s^2}$, $m_0$ the starting mass and $m(t)$ the mass now, shrinking at the rate this module's mass-properties lesson modeled. Run the plant's own RK4 stepper against it, landing exactly on burnout the way the event-detection lesson insisted:

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

With $F = 800\,\mathrm{kN}$ and $I_{sp} = 320\,\mathrm{s}$, the mass flow is $F/(I_{sp} g_0) = 255\,\mathrm{kg/s}$, so burning from $29{,}000\,\mathrm{kg}$ down to $4{,}000\,\mathrm{kg}$ takes $98.1\,\mathrm{s}$. The exact answer is $3138 \times \ln(29000/4000) = 3138 \times 1.981 = 6217\,\mathrm{m/s}$.

At $\Delta t = 0.1\,\mathrm{s}$, RK4 agrees to $1.74\times10^{-12}$ relative. That is close to the limit of **[[double-precision arithmetic|machine-precision]]** over about a thousand steps.

**Sanity check.** Making the step $10$ times smaller shrank the error from $1.70\times10^{-8}$ to $1.74\times10^{-12}$, a factor of about $10^4$. That is exactly what a fourth-order method should do: error proportional to $\Delta t^4$. This rung confirms the integrator and the mass model are wired together correctly. It says nothing yet about gravity, attitude or rotation.

**Rung 2: a ballistic coast, energy conservation.** Switch thrust off and coast under gravity alone on the $500\,\mathrm{km}$ circular orbit this curriculum has used before ($r_0 = 6{,}878.137\,\mathrm{km}$). The **specific energy** — energy per kilogram — is

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r},
$$

read "epsilon equals v squared over two minus mu over r": kinetic energy per kilogram minus the depth of the gravity well. With no thrust and no drag it must stay exactly constant. Integrate one orbital period ($5{,}676.98\,\mathrm{s}$) at $\Delta t = 10\,\mathrm{s}$. The measured relative change is $2.90\times10^{-11}$: rounding noise, not drift. The translational equations and the integrator respect a law the true physics obeys exactly.

**Rung 3: torque-free spin.** Take the bus from earlier lessons, inertia $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, tumbling at $\boldsymbol\omega_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$ with no torque. With nothing pushing on it, the size of its angular momentum $\lVert\mathbf{H}\rVert$ (read "the norm of H") and its rotational kinetic energy $T$ must both stay fixed. Integrate for $300\,\mathrm{s}$ at $\Delta t = 0.01\,\mathrm{s}$. $\lVert\mathbf{H}\rVert$ changes by $5.64\times10^{-16}$ relative and $T$ by $1.39\times10^{-15}$. The attitude quaternion is **[[renormalized|renormalize]]** every step, as this module's frame-discipline lesson insisted, so its norm $\lVert q\rVert$ never strays more than one rounding step ($2.2\times10^{-16}$) from $1$ — and at the end of this run it is exactly $1$.
:::

Three rungs, three tolerances stated rather than assumed, each isolating a different part of the plant. None of them says the *model* is right. A simulation with a wrong aerodynamic table still conserves energy perfectly whenever thrust and drag are off. Conservation follows from the *structure* of the equations (a central force, a torque-free body), not from whether the numbers inside describe the real vehicle. That is exactly the line between verification and validation.

A verification case does not have to be gentle. The next rung is dramatic on purpose.

::: example The intermediate-axis instability, with conservation holding straight through it
Spin the same bus almost exactly about each of its three **principal axes** (the axes of its smallest, middle and largest moment of inertia) in turn. Add a tiny $10^{-4}\,\mathrm{rad/s}$ nudge on the other two axes. No torque. Run $600\,\mathrm{s}$ and record how big the sideways rate grows.

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

About the minor axis (smallest inertia) or the major axis (largest), the nudge barely grows: a factor of $1.1$ to $1.5$. About the intermediate axis, the same tiny nudge grows by a factor of $729$ — the **[[tennis-racket instability|tennis-racket]]**, which the Rigid Body Dynamics module derived analytically. The body flips.

A simulation that failed to show this — a gentle wobble instead of the flip — would have a real bug in its inertia coupling. And through all three very different behaviors, $\lVert\mathbf{H}\rVert$ stays conserved to about $10^{-14}$. A conservation check and a violent, physically real instability are not in conflict. Verification does not mean "boring". It means the numbers do what the equations say, however the equations behave.
:::

::: key The validation ladder
Vacuum analytic trajectory; energy conservation on a ballistic coast; angular momentum and quaternion norm under torque-free spin; the intermediate-axis (tennis racket) instability; then component test data (engine hot fire, TVC frequency response, wind tunnel, modal survey, sensor bench); then flight data. Each rung is stated with the tolerance it actually achieved, not merely claimed to pass.
:::

## More verification tools

Conservation laws and closed-form cases are the backbone, but three more tools round out a verification argument.

**Step-size refinement.** Run the same case at step $h$, $h/2$, $h/4$, and watch the error. For a correct RK4 setup, halving the step should cut the error by about $2^4 = 16$. If it does, the code behaves the way its **[[order of accuracy|refinement-slope]]** says it must. If it does not, something is wrong — or something other than the integrator is producing the error, as the frame-bug case below will show.

**Independent reimplementation.** Have a different person write a critical model — say, gravity or the atmosphere — from the same specification, without looking at the first version, and compare outputs. Two people rarely make the same slip. A second copy written by copying the first proves nothing.

**The [[method of manufactured solutions|manufactured-solutions]].** When no real case has a known answer, invent one. Pick a solution you like, work out what extra forcing term would make it satisfy your equations exactly, add that term to the code, and check the code reproduces your invented answer — with the error shrinking at the right rate as the step shrinks.

## Component data: validating a vehicle that has never flown

Every check so far compares the code against itself. Checking the *model* against reality needs data from something real. Each model has its own test:

- an engine **hot fire** (a full-power firing on a test stand) for the thrust curve and its start-up transient;
- a TVC frequency-response test for the gimbal dynamics;
- wind tunnel runs, or CFD (computer airflow simulation), for the aerodynamic table;
- a **[[modal survey|modal-survey]]** for the bending frequencies this module's flex model needs;
- sensor bench characterization for the noise and bias figures a navigation filter is tuned against.

Each validates one model, alone, against a measurement of the real thing it represents. So a vehicle that has never flown can still be validated, component by component, even though the whole assembled system cannot yet be checked against flight. Comparing against **analogous vehicles** — similar rockets that have flown — adds a further, system-level sanity check.

Some things only the complete, flying vehicle produces: full-vehicle aerodynamic interference, some staging dynamics, anything that emerges from integration. Those must be written down as a stated uncertainty and covered by margin — represented as a **dispersion** (a spread of values the Monte Carlo will try) wide enough to cover the ignorance — not assumed away.

So the honest pre-flight claim is never "it is right". It is: every model in it is validated against the data that model has; the whole assembly is verified against every conservation law and closed-form case we could find; and here, explicitly, is the list of what is still unvalidated and how wide a dispersion covers it. A standard called **[[NASA-STD-7009|nasa-std-7009]]** formalizes this argument. After flight, the flight data joins the ladder as the one check nothing else can replace.

## The case where the trajectory hides the bug

Every check so far would pass on a simulation with a serious defect, as long as the defect happened not to touch the quantity being checked. Here is a defect that does not stay hidden — but only if you look at the right thing.

::: example A frame bug the trajectory does not show, and the energy check that catches it
Suppose gravity is computed correctly in body-frame components — exactly what an accelerometer model legitimately needs, from this module's sensor-models lesson. Then that same value is used directly as *inertial*-frame gravity in the plant's equation of motion. The rotation back into the inertial frame is simply left out. This is the "adjacent frame labels do not cancel" bug the frame-discipline lesson warned about, now hiding inside a working simulation. In effect, **[[gravity gets twisted|twisted-gravity]]** along with the tumbling body.

The vehicle is on the same $500\,\mathrm{km}$ orbit, and it is also tumbling — think of a derelict or coasting stage, spinning with no connection to its orbit — at the same $\boldsymbol\omega_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$.

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

**What the first two lines say.** After $20\,\mathrm{s}$, the buggy trajectory is $0.6957\,\mathrm{km}$ from the true one. Divided by the orbit radius, $0.6957 / 6878 = 0.0101\%$. On any plot anyone would look at, invisible. It is well inside the scatter a real mission tolerates from a dozen ordinary causes.

The specific energy, meanwhile, has already moved by $2.54\%$ — against a correct run that holds it to $3$ parts in $10^{15}$. Nothing in the position or velocity trace would make anyone look twice. The energy check is already screaming.

**Truncation error, or a real bug?** One honest question remains: could $2.54\%$ be ordinary integrator error from a big $5\,\mathrm{s}$ step? The last three lines answer it, using the step-refinement test. For RK4, each step's error scales like $h^5$ (read "h to the fifth"). Over a fixed stretch of time there are $1/h$ steps, so the total error scales like $h^5 \times (1/h) = h^4$. Quartering the step should therefore shrink truncation error by about $4^4 = 256$.

Instead, going from $5\,\mathrm{s}$ to $1.25\,\mathrm{s}$ moved the drift from $2.18\%$ to $1.85\%$: down by only $15\%$, nowhere near a factor of $256$. The drift is not coming from how finely the equations are integrated. It is a real force in the equations that is not the force physics has.

Two lines of evidence together — a conservation law broken by percents when true physics holds it to $10^{-15}$, and a drift that refuses to shrink with the step — prove a genuine bug. And they prove it at a moment when the trajectory itself gave no reason to suspect anything.
:::

::: warning A trajectory that "looks right" is not evidence
In the example, the position error was a hundredth of a percent while the energy error was already several percent. A review that glances at a trajectory plot and moves on would have passed this simulation. Left running for two full orbits instead of twenty seconds, the same bug carries the vehicle from $6{,}878\,\mathrm{km}$ out to about $87{,}900\,\mathrm{km}$ — nearly thirteen times its starting radius. By then it is far too late to call it an early catch. The only way to catch a bug like this early is to make conservation checks an automatic part of every run, not a special investigation for when something already looks wrong.
:::

::: warning Treating a passed conservation check as validation
Conservation checks are verification. They confirm the code respects the mathematical structure it was written to have, using nothing but the equations themselves. A simulation with a perfect integrator and a completely wrong aerodynamic table passes every rung of the analytic ladder, because none of those rungs ever reads the aerodynamic table. Passing verification is required before validation is worth attempting, and it never replaces it.
:::

## Check yourself

::: check
A simulation conserves energy to $10^{-13}$ on a ballistic coast, and its aerodynamic table is later shown to be $20\%$ wrong. Is this a contradiction?
:::

::: answer
No. The ballistic-coast check exercises the translational equations under gravity alone, with thrust and aerodynamic forces switched off. It never touches the aerodynamic table. A wrong table is a validation failure — the wrong physics for that particular force — and it is invisible to a verification check that does not use it. The two findings describe different parts of the simulation, and both are true at once.
:::

::: check
Why does the frame-bug example check specific energy instead of only plotting position and velocity against a reference trajectory?
:::

::: answer
At the moment examined, the position error was only $0.01\%$ of the orbit radius — a plot would look correct. The energy error was already $2.54\%$. Energy is very sensitive to the *direction* of the force, which is exactly what the bug corrupted, while position over a short arc barely notices. Checking a quantity the true physics holds constant to near zero exposes the defect long before its effect on the trajectory becomes visible.
:::

::: check
In the frame-bug example, the energy drift fell only from $2.18\%$ to $1.85\%$ when the step was quartered. What would you have seen if the drift had been RK4 truncation error, and why does the observed behavior rule that out?
:::

::: answer
RK4's error per step scales like $h^5$, and over a fixed time there are $1/h$ steps, so the total error scales like $h^4$. Quartering the step should shrink genuine truncation error by about $4^4 = 256$: from $2.18\%$ to roughly $0.0085\%$. The observed drop was about $15\%$, a factor of $1.18$. Truncation error measures how finely a *correct* equation is being integrated. A drift that barely responds to the step size is not caused by the step size at all, which points to an error in the equation being integrated.
:::

::: check
Why is a wind tunnel test a validation activity rather than a verification activity, even though it also produces numbers that get compared against the simulation?
:::

::: answer
A conservation check compares the simulation with a consequence of its own equations — an internal, code-level comparison that measures nothing physical. A wind tunnel test compares the simulation's aerodynamic model with a measurement of a real vehicle (or a scale model of one) in real airflow. That is exactly the "is this the right equation?" question validation asks. The method looks the same — numbers checked against numbers — but where the reference numbers come from is the entire difference.
:::

::: check
A program has no flight data yet and must argue its simulation is trustworthy enough to support a launch decision. Using this lesson's terms, sketch the shape of that argument.
:::

::: answer
Verify first: show the vacuum analytic case, energy and angular-momentum conservation, the quaternion norm and the intermediate-axis instability all hold to stated, tight tolerances, backed by step-refinement studies. That shows the code solves its equations correctly, without any test data. Then validate what can be validated before flight: each model — thrust curve, gimbal dynamics, aerodynamic table, structural frequencies, sensor noise and bias — against its own component test data, with analogous vehicles as a system-level cross-check. Finally, list explicitly what remains unvalidated because only the complete flying vehicle could reveal it, and show that the dispersion campaign carries a margin wide enough to cover that stated ignorance.
:::

::: check
Why does this lesson insist on stating the exact tolerance each verification check reached (such as $1.74\times10^{-12}$ or $5.64\times10^{-16}$) instead of reporting only that each check "passed"?
:::

::: answer
"Passed" hides how close to the edge the result was, and gives no way to notice when a later change quietly erodes the margin. A check that passes at $10^{-3}$ and one that passes at $10^{-14}$ both "pass", but only the numbers show that the first is far worse than the physics and the integrator's order should deliver. A stated tolerance can be tracked over time, compared with the integrator's theoretical order, and used exactly as the frame-bug example used it: to tell ordinary truncation error from a genuine defect.
:::

## Summary

| Check | What it verifies or validates | Result |
| --- | --- | --- |
| Vacuum analytic (Tsiolkovsky) | Mass depletion and integrator, no gravity | $1.74\times10^{-12}$ relative at $\Delta t = 0.1\,\mathrm{s}$ |
| Ballistic energy conservation | Translational equations under gravity | $2.90\times10^{-11}$ relative over one orbit |
| Torque-free $\lVert\mathbf{H}\rVert$, $T$, $\lVert q\rVert$ | Rotational equations and quaternion kinematics | $5.64\times10^{-16}$, $1.39\times10^{-15}$, within $2.2\times10^{-16}$ (renormalized) |
| Intermediate-axis instability | Inertia coupling, through a dramatic, predicted instability | $729\times$ growth (intermediate) vs $1.1$–$1.5\times$ (major, minor); $\lVert\mathbf{H}\rVert$ held to $10^{-14}$ |
| Step refinement | The error shrinks at the integrator's order | RK4: $\times 16$ per halving, $\times 256$ per quartering |
| Component data | One model against a real measurement of one part | Hot fire, TVC frequency response, wind tunnel, modal survey, sensor bench |
| Flight data | The whole assembly against reality | The only check nothing else replaces |
| The frame-bug case | A plausible trajectory; an energy check that is not fooled | $0.01\%$ position error vs $2.54\%$ energy error at the same instant |

Verification earns the right to trust the code; validation earns the right to trust the model. The next lesson is about keeping that trust over time: regression testing, the golden-file comparisons that catch an unintended change, and what to do when a change is intended and every golden file moves anyway.

::: context closed-form An answer you can write down
A **closed-form** solution is a formula you can evaluate directly, with no step-by-step simulation: plug in the time, get the answer. Most real vehicle problems have none, which is why we simulate at all. But a few simplified cases do — a rocket in a vacuum, a satellite on a circular orbit, a body spinning with no torque. Those rare cases are gold for verification, because they give the simulation an answer key it did not write itself.
:::

::: context tsiolkovsky An equation from 1903
Konstantin Tsiolkovsky, a Russian schoolteacher, published the rocket equation in 1903, decades before any large rocket flew. It says a rocket's speed gain depends only on how fast its exhaust leaves ($I_{sp}\,g_0$, here $3138\,\mathrm{m/s}$) and on the logarithm of its mass ratio. That makes it the perfect first rung: it involves thrust and shrinking mass but nothing else, so if the simulation disagrees with it, the fault is in the integrator or the mass model and nowhere else.
:::

::: context machine-precision How precise a computer number is
An ordinary computer number, a "double", keeps about $16$ significant digits. The gap between $1$ and the next number it can store is $2.2\times10^{-16}$. Every arithmetic step can round by about that much, and over thousands of steps those tiny roundings add up. So a relative error near $10^{-12}$ after a thousand steps is about as good as the arithmetic allows. Chasing it lower would be chasing rounding, not bugs.
:::

::: context renormalize Keeping the quaternion a unit length
An attitude quaternion must have length exactly $1$ to describe a pure rotation. Each integration step adds a tiny error that nudges the length off $1$, and left alone those nudges pile up until the "rotation" starts to stretch and shrink vectors too. **Renormalizing** — dividing the quaternion by its own length after every step — pulls it back to $1$. It is a cheap, standard fix, and it is why this check comes out at the level of a single rounding step.
:::

::: context tennis-racket The flip you can do at home
Toss a tennis racket (or a phone, or a book held shut with a rubber band) spinning about each of its three axes. About the long axis and about the axis through the face, the spin is steady. About the third, middle axis, the object flips over mid-air, every time. Cosmonaut Vladimir Dzhanibekov famously noticed it on a spinning wing nut aboard Salyut 7 in 1985.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="45" width="120" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="75" x2="330" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="336,75 326,70 326,80" fill="#1d6fd1"/>
  <text x="300" y="66" font-size="12" text-anchor="middle" fill="#1d6fd1">minor: steady</text>
  <line x1="180" y1="75" x2="180" y2="12" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,6 175,16 185,16" fill="#b4232c"/>
  <text x="186" y="18" font-size="12" fill="#b4232c">intermediate: flips</text>
  <line x1="180" y1="75" x2="100" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="95,134 101,124 106,131" fill="#1f2a44"/>
  <text x="20" y="128" font-size="12" fill="#1f2a44">major: steady</text>
</svg>
```

The long, thin block has its smallest inertia about its long axis and its largest about the axis coming out of its face; the middle one is unstable.
:::

::: context refinement-slope Reading an error-versus-step plot
Plot error against step size with both axes on a logarithmic scale, and a method of order $p$ draws a straight line of slope $p$. RK4's line has slope $4$: every tenfold smaller step buys four more correct digits, which is what rung 1 showed. A line that flattens out at the bottom has hit rounding; a line that is flat everywhere means the error is not coming from the step at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="135" x2="340" y2="135" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="310" y1="20" x2="130" y2="116" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="130" y1="116" x2="60" y2="118" stroke="#1d6fd1" stroke-width="2.5" stroke-dasharray="5 3"/>
  <line x1="310" y1="40" x2="60" y2="47" stroke="#b4232c" stroke-width="2.5"/>
  <text x="210" y="98" font-size="12" fill="#1d6fd1">correct RK4: slope 4</text>
  <text x="62" y="110" font-size="11" fill="#6c7a93">rounding floor</text>
  <text x="120" y="36" font-size="12" fill="#b4232c">a real bug: flat</text>
  <text x="340" y="152" font-size="11" text-anchor="end" fill="#1f2a44">step size (log)</text>
  <text x="56" y="20" font-size="11" fill="#1f2a44">error (log)</text>
</svg>
```
:::

::: context manufactured-solutions Inventing an answer key
Suppose your equation is $\dot x = f(x)$ and no case has a known answer. Choose one anyway, say $x(t) = \sin t$. Plug it in: $\dot x = \cos t$, but the code would compute $f(\sin t)$. The mismatch, $s(t) = \cos t - f(\sin t)$, is a "source term". Add $s(t)$ to the right-hand side in the code, and the exact answer of the modified equation is now $\sin t$ by construction. If the code does not return $\sin t$, with its error falling at the integrator's order, the code has a bug. Engineers use this heavily on fluid-flow and structural codes.
:::

::: context modal-survey Shaking the real structure
In a **modal survey**, engineers hang or stand the real structure (or a test article built like it), attach dozens of accelerometers, and shake it gently with shakers or tap it with an instrumented hammer. The response shows the frequencies at which it likes to bend, and the shapes it bends into. Those measured frequencies and shapes then replace or correct the numbers the flex model was built from — a direct validation of one model against one real measurement.
:::

::: context nasa-std-7009 A standard for trusting a model
NASA-STD-7009, the Standard for Models and Simulations, sets out what a team must show before simulation results can back a decision. It asks for verification, validation, and a statement of uncertainty, and it scores a simulation's credibility on several factors — how well it is verified, how well validated, how its inputs are pedigreed, how its uncertainty is characterized — each on a scale. Its point is that credibility comes in levels, and a team must say honestly which level it has reached.
:::

::: context twisted-gravity What the frame bug does to gravity
Gravity should always point at Earth's center. The bug takes the right numbers but reads them in the wrong frame, so the arrow turns with the tumbling body. Part of the time it pulls sideways along the orbit, speeding the vehicle up or slowing it down — which changes its energy, something true gravity can never do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="95" r="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <path d="M 224.2,17.5 A 155,155 0 0 1 235.7,148" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <rect x="236" y="86" width="18" height="18" fill="#fff" stroke="#1f2a44" stroke-width="2" transform="rotate(30 245 95)"/>
  <line x1="236" y1="95" x2="180" y2="95" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="172,95 182,90 182,100" fill="#1d6fd1"/>
  <text x="200" y="86" font-size="12" text-anchor="middle" fill="#1d6fd1">true</text>
  <line x1="245" y1="104" x2="217" y2="152" stroke="#b4232c" stroke-width="3"/>
  <polygon points="213,159 214,147 223,152" fill="#b4232c"/>
  <text x="270" y="150" font-size="12" fill="#b4232c">buggy: turned</text>
  <text x="305" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">tumbling vehicle</text>
</svg>
```
:::
