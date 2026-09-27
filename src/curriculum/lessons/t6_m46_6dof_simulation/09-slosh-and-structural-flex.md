---
id: l09-slosh-and-structural-flex
title: Slosh and structural flex
minutes: 19
covers:
  - Slosh and structural flex models, and where they get inserted in the loop
---

Carry a full bowl of soup across a kitchen. Walk at the wrong pace and the soup starts rocking, back and forth at a rhythm of its own, until it slops over the rim. Now hold a long ruler by its middle and flick it: the ends bend up and down, again at a rhythm of their own. Neither the soup nor the ruler cares much what rhythm you *want*. They have their own.

A rocket is a long, thin tube, mostly full of liquid. Its liquid **sloshes** — rocks inside the tank like the soup. Its body **flexes** — bends like the ruler. Each of these motions has a natural rhythm, and each shape of motion with its own rhythm is called a **mode**. The steering loop has to live with them, and a simulation has to contain them.

The Rigid Body Dynamics module already derived the equations. This lesson asks a different question: where do those equations live inside a running simulation, what do they connect to, and what changes when you integrate them in a working loop instead of analyzing them on paper?

## The equations you already have

Picture the vehicle as a stiff **hub** with one bendy part attached. The hub turns through an angle $\vartheta$ ("theta", in its curly form). The bendy part's shape is summed up by one number, $\eta$ ("eta"), the **[[modal coordinate|modal-coordinate]]**: zero when straight, bigger when more bent. The Rigid Body Dynamics module gave two equations tying them together:

$$
I\ddot\vartheta + \delta\ddot\eta = M ,
$$

$$
\ddot\eta + \delta\ddot\vartheta + 2\zeta\omega_n\dot\eta + \omega_n^2\eta = 0 .
$$

Here $I$ is the hub's inertia and $M$ the torque on it. The **coupling coefficient** $\delta$ ("delta") says how strongly bending and turning push on each other. The **damping ratio** $\zeta$ ("zeta") says how quickly bending dies out on its own. $\omega_n$ ("omega sub n") is the mode's **[[cantilevered|cantilever-free]]** frequency, the rhythm it has when the hub is clamped still.

Two more numbers come from these. The fraction $\sigma = \delta^2/I$ ("sigma") says how much of the vehicle's inertia takes part in the mode. And when the hub is left free to turn, the rhythm rises to the **free-free** frequency

$$
\omega_p = \frac{\omega_n}{\sqrt{1 - \sigma}} .
$$

Slosh gets its own formula. For the first slosh mode in a cylindrical tank of radius $R$ holding liquid to height $h$, under axial acceleration $a$,

$$
\omega_s^2 = \frac{\xi_1 a}{R}\tanh\!\left(\frac{\xi_1 h}{R}\right) ,
$$

with $\xi_1 = 1.8412$ ("xi sub one", a **[[fixed number from the tank's round shape|xi-one]]**). Read $\tanh$ as "tanch", the **[[hyperbolic tangent|tanh]]**. For a deep tank it is almost exactly $1$.

## The state gets bigger, not the architecture

A flex or slosh mode is not a sixth box in the five-box picture. It is **more state inside the Plant box**, exactly like position and the attitude quaternion already are.

Each mode adds two numbers to the state: a position-like coordinate and its rate. For a bending mode, those are $\eta$ and $\dot\eta$. For a slosh mode, they are the angle and rate of an **[[equivalent pendulum|slosh-pendulum]]** that stands in for the moving liquid. The same integrator moves them forward, at the same fine step, alongside the rigid-body state.

That has an immediate, concrete cost. The plant step $\Delta t_{\text{plant}}$ must be small enough to follow whichever mode oscillates *fastest* — not just the rigid-body motion, and not just the control rate. The two-rate lesson warned about exactly this: a $6\,\mathrm{Hz}$ bending mode simulated with a step sized for a $20\,\mathrm{Hz}$ controller.

::: example Integrating the coupled mode, and which frequency you actually get
Take a structural mode with $\sigma = 0.04$, cantilevered frequency $f_n = 6\,\mathrm{Hz}$ and damping $\zeta = 0.005$. Couple it to a hub of inertia $I = 105{,}450\,\mathrm{kg\,m^2}$, the inertia the mass-properties lesson found $15\,\mathrm{s}$ into its burn. Each step, solve the two equations for the two accelerations, then integrate with RK4.

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

Step 1: the coupling is $\delta = \sqrt{\sigma I} = \sqrt{0.04 \times 105{,}450} = 64.9$.

Step 2: the two equations share $\ddot\vartheta$ and $\ddot\eta$, so they are written as one matrix equation and solved together. The code bends the mode by $\eta = 0.001$, lets go with no torque, and runs $2\,\mathrm{s}$ with a $0.5\,\mathrm{ms}$ step — $333$ steps per cycle of a $6\,\mathrm{Hz}$ mode.

Step 3: count the zero crossings of $\eta$ to measure its frequency.

Two results confirm what the Rigid Body Dynamics module stated. First, the matrix's **determinant** — the number that says whether the pair can be solved — is exactly $I(1-\sigma) = 101{,}232.1\,\mathrm{kg\,m^2}$. That is the "effective inertia above the mode" from that module's summary table, showing up here as the number this simulation divides by at every step.

Second, and more important: the free response rings at $6.124\,\mathrm{Hz}$. That matches the free-free frequency $\omega_p/2\pi = 6.000/\sqrt{0.96} = 6.124\,\mathrm{Hz}$, not the $6.000\,\mathrm{Hz}$ that went in as a parameter. Nothing in a 6-DOF simulation holds the vehicle's attitude fixed, so the hub is free, and the simulation sees the free-free **pole** by construction. A **[[ground vibration test|ground-vibration-test]]** that clamps the hub sees the cantilevered frequency instead, which shows up as a **zero** of the transfer function.

Quoting the clamped test frequency as if it were what the free, flying vehicle will show is a small but real modeling error, with exactly this mechanism behind it.
:::

::: note Why it has to be true
Set $M = 0$. The hub equation gives $\ddot\vartheta = -\delta\ddot\eta/I$: when the mode swings one way, the hub swings back a little. Put that into the modal equation:

$$
\ddot\eta - \frac{\delta^2}{I}\ddot\eta + 2\zeta\omega_n\dot\eta + \omega_n^2\eta = 0
\quad\Longrightarrow\quad
(1 - \sigma)\,\ddot\eta + 2\zeta\omega_n\dot\eta + \omega_n^2\eta = 0 .
$$

Divide through by $1 - \sigma$. The stiffness term becomes $\omega_n^2/(1-\sigma)$, so the natural frequency is $\omega_n/\sqrt{1-\sigma}$. The free hub "gives way", so less of the mode's mass is really moving, and a lighter mass on the same spring rings faster. The same $1 - \sigma$ appears in the determinant: $I \cdot 1 - \delta \cdot \delta = I - \delta^2 = I(1 - \sigma)$.
:::

## Slosh parameters are not constants either

Swing a pendulum on a train that is speeding up hard, and it swings faster, as if gravity got stronger. Slosh is the same: the axial acceleration $a$ plays the part of gravity. And the liquid height $h$ changes the rhythm too.

The mass-properties lesson already tracked both over a burn. Under constant thrust, $a(t) = F/m(t)$ grows as mass leaves, and $h(t)$ shrinks as propellant burns. So a slosh model that works out $\omega_s$ once at ignition and holds it is not a simplification. It is wrong for the whole rest of the burn, and more wrong as the burn goes on.

::: example How much the slosh frequency actually moves over one burn
Reuse the burn from the mass-properties lesson: $F = 800\,\mathrm{kN}$, $I_{sp} = 320\,\mathrm{s}$, a tank of radius $1.5\,\mathrm{m}$ and length $8\,\mathrm{m}$, $25{,}000\,\mathrm{kg}$ of propellant and $4{,}000\,\mathrm{kg}$ of dry mass.

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

Check the first line by hand. At ignition, $a = 800{,}000/29{,}000 = 27.59\,\mathrm{m/s^2}$. The tank is full, so $\tanh(1.8412 \times 8/1.5) = \tanh(9.82) \approx 1$. Then $\omega_s^2 = 1.8412 \times 27.59/1.5 = 33.86$, so $\omega_s = 5.82\,\mathrm{rad/s}$, and $f = 5.82/2\pi = 0.926\,\mathrm{Hz}$.

The slosh frequency climbs from $0.926\,\mathrm{Hz}$ at ignition to $1.657\,\mathrm{Hz}$ at $90\,\mathrm{s}$, a $79\%$ rise. Growing acceleration pushes it up faster than the shrinking $\tanh$ factor pulls it down. Scanning the whole burn finely shows more: it **[[peaks at 1.71 Hz|slosh-curve]]** near $86\,\mathrm{s}$, and then, as the last liquid becomes a thin film, it falls fast toward zero.

Sanity check: by $90\,\mathrm{s}$ this toy stage is pulling $132\,\mathrm{m/s^2}$, about $13.5\,g$ — far more than a real stage would allow, which is why real engines throttle down near burnout. The numbers exaggerate the swing, but the lesson stands for any vehicle.

A controller with a **[[notch filter|notch-filter]]** tuned to reject slosh at the ignition frequency is tuned to the wrong frequency for the rest of the burn. The only correct design recomputes $\omega_s$ from the plant's *current* mass and acceleration at every step — exactly as the previous lesson insisted the inertia tensor be recomputed rather than scaled.
:::

::: warning A slosh or flex frequency computed once at ignition
"The tank does not change much in one control cycle" is true about a single tick. Freezing $\omega_s$, or anything built from $\omega_n$, at its ignition value turns that into a false statement about the whole burn. The example showed a $79\%$ change over $90\,\mathrm{s}$, far more than one cycle could produce. A notch filter or gain-stabilization margin sized for the wrong frequency protects against nothing.
:::

## What GNC gets to see, and what it does not

This lesson does not change the rule the five-box lesson set: **GNC never reads plant truth directly.** The flight software never gets $\eta$, $\dot\eta$ or a slosh pendulum's angle as inputs. It gets whatever a sensor produces.

A sensor bolted to a bending body feels two things added together: the rigid-body motion, and the local bending where it is mounted. How much bending it feels depends on the **[[mode's shape at that spot|mode-shape]]** — the local sideways displacement for an accelerometer, the local slope for a gyro. This is the **non-collocated** sensing problem (sensor and actuator in different places) that the Rigid Body Dynamics module analyzed through the right-half-plane zero.

In most vehicles, the flight software's own internal model contains the rigid-body dynamics — it was designed around them — but not flex or slosh in any detail. Those are motions the loop must be *robust to*, not ones it estimates and cancels. There are three usual ways:

- **[[gain stabilization|gain-stabilization]]**: make sure the loop has too little gain at the mode's frequency to excite it;
- a notch filter that removes the mode's frequency from the sensor signal;
- or simply enough phase margin at the mode's frequency.

That robustness is what the Rigid Body Dynamics module's bandwidth rule — crossover comfortably below the lowest structural pole — protects. And it is exactly what a rate limit's describing-function phase loss, or an unmodeled sensor delay, from the two previous lessons, can quietly erode if either lands near a mode's frequency instead of safely below it.

### Data that crosses box lines on the truth side

Where the mode's numbers come from crosses box boundaries in a way worth noticing. The slosh frequency needs the current thrust, which is the Actuators box's output. It also needs the current mass, which the Plant box tracks with its mass-properties model.

That is allowed. None of the five boxes is a sealed unit that may only read one official neighbor. The Plant's own bookkeeping may use the thrust the Actuators box really delivered to update a truth quantity, here the slosh frequency, which stays entirely on the truth side of the Sensors boundary. What must never happen is GNC using that same information directly. The boundary that matters is between truth and what a sensor reports.

::: key Where slosh and flex live in the loop
Flex and slosh modes are extra Plant-box state, integrated by the same fine-step integrator as the rigid-body equations of motion — so that step must resolve the fastest mode present, not only the control rate. Their parameters (frequency, damping, modal participation) depend on the vehicle's current mass and acceleration and are recomputed every step, never fixed at ignition. A free vehicle's coupled hub-plus-mode system oscillates at the free-free pole frequency $\omega_p = \omega_n/\sqrt{1-\sigma}$, not the cantilevered $\omega_n$ a clamped ground test measures. GNC sees these modes only through what a sensor's placement and the mode's shape combine to produce — never directly.
:::

::: warning Giving the flight software the modal state "to check something quickly"
Feeding $\eta$ or a slosh angle straight into the flight software during development — to check a filter against the true structural motion, say — is the same mistake the five-box lesson warned about for rigid-body truth, with the same fix. Test the algorithm on its own in a unit test, and leave the closed-loop simulation's Sensors boundary intact. A controller that has seen modal truth has never been checked against what it gets in flight: a sensor's noisy, non-collocated, band-limited view of the same motion.
:::

## Check yourself

::: check
Why must the plant's fine integration step resolve the vehicle's structural and slosh modes, and not only its rigid-body dynamics and the control rate?
:::

::: answer
Flex and slosh modes are extra state inside the Plant box, moved forward by the same fixed-step integrator as the rigid-body state. An integrator only follows motion it takes small enough steps against.

If the step is sized only for rigid-body motion or the control rate, the fastest thing present — whichever is highest in frequency among the bending modes, slosh modes and rigid-body coupling — is under-resolved, however well everything else is set up.
:::

::: check
The coupled hub-plus-mode simulation rang at $6.124\,\mathrm{Hz}$, although the cantilevered frequency fed in was $6.000\,\mathrm{Hz}$. Explain why, and say what kind of test would actually measure $6.000\,\mathrm{Hz}$.
:::

::: answer
$6.000\,\mathrm{Hz}$ is the cantilevered frequency: the mode's rhythm when the hub is held still. That is a boundary condition.

In the simulation nothing holds the hub. It turns in response to the mode's own coupling torque, so the pair rings at the free-free pole frequency, $\omega_p = \omega_n/\sqrt{1-\sigma} = 6.000/\sqrt{0.96} = 6.124\,\mathrm{Hz}$.

A ground vibration test that clamps the structure at the hub measures the cantilevered $6.000\,\mathrm{Hz}$. A simulation of the free-flying vehicle, or the real vehicle in flight, will not show that frequency at all.
:::

::: check
The slosh example showed the frequency rising from $0.926\,\mathrm{Hz}$ to $1.657\,\mathrm{Hz}$ over the burn. Which two physical changes drive this, and do they push the same way or opposite ways?
:::

::: answer
First, the axial acceleration $a = F/m$ rises as mass leaves under constant thrust. On its own that raises $\omega_s$, because $\omega_s^2$ is proportional to $a$.

Second, the liquid height $h$ falls as propellant burns. On its own that lowers $\omega_s$, through the $\tanh(\xi_1 h/R)$ factor.

They push in opposite directions. In the example the net result is a big increase, so the acceleration effect wins for most of this burn — until the very end, when the liquid is so shallow that the height effect takes over and the frequency drops. Neither size is obvious by looking; it had to be computed.
:::

::: check
A teammate proposes feeding the navigation filter the true modal displacement $\eta(t)$ directly during a development test, "to see whether the filter's structural-mode rejection is working". What is wrong with this, and what should be done instead?
:::

::: answer
Fed with truth, the filter is never tested against what it really gets in flight: a sensor's measurement, shaped by where the sensor sits on the mode and corrupted by the sensor's own noise, bias and latency. Whatever "working" means in that test says nothing about flight.

The narrow question — does the filter's mode-rejection logic behave as intended? — belongs in a unit test that calls the filter directly with made-up inputs. The closed-loop simulation's Sensors boundary stays untouched.
:::

::: check
The slosh frequency depends on the current thrust (an Actuators-box quantity) and the current mass (tracked inside the Plant box). Why is this not a break in the five-box discipline, when the first lesson insisted the boxes stay separable?
:::

::: answer
The real rules of the five boxes are that GNC never reads plant or environment truth directly, and that the Plant never receives a command directly. They do not say each box may consult only one official neighbor.

The Plant's own bookkeeping uses the thrust the Actuators box actually *delivered* — not GNC's command — to update a truth quantity that stays on the truth side. Nothing here lets GNC see modal state, and nothing lets a command skip the Actuators box's own dynamics. Both rules that matter still hold.
:::

::: check
A controller's phase margin was sized carefully against sensor latency and actuator rate limits. Why could it still be at risk from a structural mode?
:::

::: answer
Phase margin belongs to the whole open loop at its crossover frequency. Every effect that eats phase — sensor latency, the zero-order hold, actuator rate limiting, and a structural mode's own dynamics if its frequency is close enough to crossover to contribute — piles up at that same frequency.

A margin checked only against latency and rate limits, without asking where the nearest bending or slosh mode sits, can shrink to nothing once that mode is included. That is why the bandwidth rule (crossover comfortably below the lowest structural pole) is a separate, necessary check that the delay-margin analysis alone does not cover.
:::

## Summary

| Item | Statement |
| --- | --- |
| Where the state lives | Extra Plant-box state ($\eta$, $\dot\eta$ per mode, or a slosh pendulum's angle and rate), integrated by the same fine-step integrator as the rigid-body equations |
| Step-size consequence | $\Delta t_{\text{plant}}$ must resolve the fastest mode present, not only the control rate |
| Coupled free response | A free hub rings at the free-free pole $\omega_p = \omega_n/\sqrt{1-\sigma}$, not the cantilevered $\omega_n$ — $6.124\,\mathrm{Hz}$ against a $6.000\,\mathrm{Hz}$ parameter |
| Effective inertia check | $\det\begin{pmatrix}I&\delta\\\delta&1\end{pmatrix} = I(1-\sigma) = 101{,}232\,\mathrm{kg\,m^2}$, the Rigid Body Dynamics module's effective inertia |
| Slosh frequency | $\omega_s^2 = (\xi_1 a/R)\tanh(\xi_1 h/R)$, $\xi_1 = 1.8412$ |
| Slosh parameters vary | $\omega_s(t)$ from the current $a(t) = F/m(t)$ and $h(t)$: $0.926 \to 1.657\,\mathrm{Hz}$ ($79\%$) by $90\,\mathrm{s}$, peak $1.71\,\mathrm{Hz}$ near $86\,\mathrm{s}$ |
| GNC's view | Never direct; only through a sensor's noisy, non-collocated measurement — the same boundary as every other truth quantity |
| Cross-box data flow | A truth-side calculation may use another box's true output (the Actuators' delivered thrust); truth must never reach GNC, and a command must never skip straight into the Plant |

The plant, its environment, and now its own bending and sloshing are all in place. The next lesson turns to the moments when this smooth state changes all at once — staging — and the event-detection machinery that lands the simulation exactly on that moment instead of stepping over it.

::: context modal-coordinate One number for a whole shape
A bending rocket could take countless shapes. The trick of **modal analysis** is that its natural vibrations come in a few fixed shapes, the modes, each with its own frequency. Once the shape is known — from a finite-element model, checked by a ground test — the only unknown left is *how much* of it there is at each moment. That amount is $\eta$. So a whole bending tube becomes two numbers in the state vector, $\eta$ and $\dot\eta$, per mode. Real simulations keep the first few bending modes, because the higher ones are too fast and too weakly excited to matter to the loop.
:::

::: context cantilever-free Clamped or floating
A **cantilever** is a beam clamped at one end, like a diving board. Hold the hub still and the flexible part vibrates as a cantilever, at $\omega_n$. Let go and the hub rocks back against each swing, which makes the mode ring faster, at $\omega_p$. A rocket in flight is held by nothing, so it is **free-free**: free at both ends. That is why the flying vehicle's frequency is the higher one. The gap is small when $\sigma$ is small: with $\sigma = 0.04$, the rise is only about $2\%$.
:::

::: context xi-one Where 1.8412 comes from
Liquid rocking in a round tank has its surface shaped by a **Bessel function**, a curve that plays the role for circles that sine waves play for straight lines. The wall of the tank forces the surface's slope to be zero where it meets the wall. The first place a Bessel function of order one, $J_1$, has zero slope is at $1.8412$. So $\xi_1 = 1.8412$ is a property of round tanks, the same for every size. The tank size enters through $R$.
:::

::: context tanh Deep tanks and shallow tanks
$\tanh x$ is close to $x$ when $x$ is small, and levels off at $1$ when $x$ is large. In the slosh formula, $x = \xi_1 h/R$. For a tank filled deeper than about its own radius, $x$ is above $1.8$ and $\tanh x$ is above $0.95$, so depth hardly matters. Only for shallow liquid does the frequency start to fall with depth. That is why the burn example's frequency barely notices $h$ until the last meter or two of liquid.
:::

::: context slosh-pendulum A pendulum inside the tank
Engineers do not simulate every drop. They replace the sloshing liquid with a **mechanical analog**: a fixed mass that moves with the tank, plus a pendulum whose length and mass are chosen so it swings at the slosh frequency and pushes on the tank walls the way the liquid would. The pendulum's angle and rate become two more state variables. In a long, deep tank only a small part of the liquid takes part in the first slosh mode; the rest behaves as the fixed mass.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="20" width="120" height="170" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="121" y="150" width="118" height="39" fill="#8fb8f0"/>
  <text x="180" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">fixed mass</text>
  <circle cx="180" cy="50" r="4" fill="#1f2a44"/>
  <line x1="180" y1="50" x2="180" y2="125" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="180" y1="50" x2="212" y2="118" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="212" cy="118" r="10" fill="#1d6fd1"/>
  <path d="M180,90 A40,40 0 0,0 197,86" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="192" y="104" font-size="12" fill="#b4232c">angle</text>
  <text x="250" y="122" font-size="12" fill="#1d6fd1">slosh mass</text>
  <text x="250" y="54" font-size="12" fill="#1f2a44">hinge</text>
  <line x1="60" y1="120" x2="60" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="55,62 60,50 65,62" fill="#1f2a44"/>
  <text x="60" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">thrust</text>
</svg>
```
:::

::: context ground-vibration-test Shaking the real thing
Before a new vehicle flies, engineers do a **ground vibration test** (or modal survey): they hang or clamp the structure, shake it with small electric shakers across a range of frequencies, and measure the response with dozens of accelerometers. The peaks give the mode frequencies, damping and shapes, which update the finite-element model the simulation uses. How the article is held matters: bolted to a stand gives something close to cantilevered numbers, while soft bungee suspension comes close to free-free. The analysis has to correct for whichever one was used.
:::

::: context slosh-curve The whole slosh curve
The slosh frequency over the whole example burn, sampled finely. It starts at $0.93\,\mathrm{Hz}$, rises as the acceleration grows, peaks at about $1.71\,\mathrm{Hz}$ near $86\,\mathrm{s}$, then collapses as the last liquid becomes a thin film. The simple formula is least trustworthy in that last part — real tanks have curved domes, not flat bottoms — but its message is plain: no single frequency describes the burn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="92.2" x2="335" y2="92.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,98.0 58.6,97.0 67.1,96.0 75.7,94.9 84.3,93.8 92.8,92.7 101.4,91.5 110.0,90.2 118.5,88.9 127.1,87.5 135.7,86.1 144.2,84.5 152.8,82.9 161.4,81.1 169.9,79.3 178.5,77.3 187.0,75.3 195.6,73.0 204.2,70.6 212.7,68.0 221.3,65.3 229.9,62.3 238.4,59.0 247.0,55.5 255.6,51.7 264.1,47.8 272.7,43.8 281.3,40.1 289.8,37.3 298.4,36.9 307.0,41.1 309.8,44.3 312.3,48.1 314.9,53.1 317.4,59.6 319.9,67.9 322.4,78.7 325.0,93.1 327.5,113.9 330.0,170.0"/>
  <circle cx="295.5" cy="36.7" r="4" fill="#b4232c"/>
  <text x="44" y="57" font-size="11" text-anchor="end" fill="#1f2a44">1.5</text>
  <text x="44" y="96" font-size="11" text-anchor="end" fill="#1f2a44">1.0</text>
  <text x="44" y="135" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="50" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0 s</text>
  <text x="330" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">98 s</text>
  <text x="270" y="30" font-size="11" text-anchor="end" fill="#b4232c">1.71 Hz peak</text>
  <text x="60" y="34" font-size="12" fill="#1f2a44">slosh frequency (Hz)</text>
</svg>
```
:::

::: context notch-filter Cutting out one frequency
A **notch filter** passes every frequency through untouched except a narrow band, which it strongly weakens — like an equalizer on a music player with one slider pulled all the way down. Put one on the sensor signal at a bending or slosh frequency, and the loop stops reacting to that mode's wobble. The catch is that a notch costs phase at nearby frequencies, and it only works if it sits on the mode's real frequency. That is why the frequency must be tracked, or the notch made wide enough to cover the whole burn.
:::

::: context mode-shape Where to put the sensor
The first bending shape of a free-free rocket body, drawn much exaggerated. The body bends like a bow: the ends swing one way, the middle the other way (a bit less), and two **nodes**, about $22\%$ of the length in from each end, do not move sideways at all. An accelerometer at a node feels almost none of the mode's sideways motion. A gyro measures turning, so it feels the *slope* of the shape instead; the slope is zero in the middle of the bow. Designers place sensors with the mode shapes in hand.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30.0,65.0 40.0,70.4 50.0,75.8 60.0,81.2 70.0,86.5 80.0,91.6 90.0,96.6 100.0,101.3 110.0,105.6 120.0,109.5 130.0,113.0 140.0,115.9 150.0,118.2 160.0,119.9 170.0,120.9 180.0,121.3 190.0,120.9 200.0,119.9 210.0,118.2 220.0,115.9 230.0,113.0 240.0,109.5 250.0,105.6 260.0,101.3 270.0,96.6 280.0,91.6 290.0,86.5 300.0,81.2 310.0,75.8 320.0,70.4 330.0,65.0"/>
  <circle cx="97.2" cy="100" r="5" fill="#b4232c"/>
  <circle cx="262.8" cy="100" r="5" fill="#b4232c"/>
  <text x="97" y="84" font-size="12" text-anchor="middle" fill="#b4232c">node</text>
  <text x="263" y="84" font-size="12" text-anchor="middle" fill="#b4232c">node</text>
  <text x="180" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">slope zero in the middle</text>
  <text x="30" y="52" font-size="12" fill="#1f2a44">nose</text>
  <text x="330" y="52" font-size="12" text-anchor="end" fill="#1f2a44">engine</text>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#6c7a93">dashed: straight body</text>
</svg>
```
:::

::: context gain-stabilization Too quiet to excite it
**Gain stabilization** means making sure the loop's gain at a mode's frequency is so low that, whatever the phase, the mode cannot be driven unstable: the loop simply does not push hard enough there. It suits modes well above crossover, where a low-pass filter can cut the gain. Its partner is **phase stabilization**, used for modes too close to crossover to filter out: there the loop must have the right phase at the mode so its push damps the motion instead of feeding it.
:::
