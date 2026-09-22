---
id: l03-two-rate-simulation-and-zoh
title: Two rates and the zero-order hold
minutes: 18
covers:
  - Running the plant at a fine step while the flight software runs at its true rate, with zero-order hold between updates
---

The previous lesson established the constraint: the plant can be integrated as accurately as the physics demands, but the flight software must be called exactly once per its true sample period, on a fixed, unwavering grid, never from inside an integrator's internal stage evaluations. Those two requirements look like they are in tension — one wants a step small enough to resolve the fastest dynamics in the vehicle, the other wants a step that matches a specific, usually much slower, control rate — until you notice that nothing requires them to be the *same* step. This lesson builds the architecture that keeps them separate: a fine, accurate plant step nested inside each controller tick, with the controller's output held fixed across every one of those fine steps by a zero-order hold. It is the structural decision every closed-loop simulation in this curriculum sits on.

## Two clocks, one integer relationship

Call the plant's integration step $\Delta t_{\text{plant}}$ and the flight software's true sample period $\Delta t_{\text{ctrl}}$. $\Delta t_{\text{plant}}$ is chosen the way the Numerical Methods module taught you to choose any fixed step: small compared with the shortest period you need to resolve — a structural mode, a slosh mode, the fastest coupling period in the rigid-body motion — and confirmed by a refinement study, not guessed. $\Delta t_{\text{ctrl}}$ is not chosen at all; it is a property of the flight software, fixed by its designers before you ever wrote a line of the simulation, and the previous lesson is the reason it cannot move.

The one rule that ties the two clocks together is that $\Delta t_{\text{ctrl}}$ must be an integer multiple of $\Delta t_{\text{plant}}$:

$$
\Delta t_{\text{ctrl}} = n\,\Delta t_{\text{plant}}, \qquad n \in \mathbb{Z}^+ .
$$

This is not a convenience; it is what makes every controller tick land exactly on a plant step boundary, with no interpolation and no truncated final substep. If the ratio is not an integer — $\Delta t_{\text{ctrl}} = 0.025\,\mathrm{s}$ against $\Delta t_{\text{plant}} = 0.002\,\mathrm{s}$, say, a ratio of $12.5$ — the honest response is to refuse and ask for different numbers, not to silently resample the plant state onto the tick boundary. A resampled state is a state nobody actually integrated to; it is manufactured by interpolation, and manufacturing state is exactly the kind of quiet unmodelled error this module exists to keep out.

::: example The two-rate loop, and a mismatched ratio refused
The bus from the previous two lessons, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, nulling a small residual rate with a $400\,\mathrm{N\,m\,s/rad}$ reaction-wheel damper limited to $\pm0.20\,\mathrm{N\,m}$. Run the loop with $\Delta t_{\text{plant}} = 2\,\mathrm{ms}$ and $\Delta t_{\text{ctrl}} = 20\,\mathrm{ms}$ — a clean ratio of 10 — for half a second, then again with $\Delta t_{\text{ctrl}} = 25\,\mathrm{ms}$, a ratio of $12.5$.

```python
import numpy as np

I = np.array([1200.0, 1500.0, 2000.0])   # kg m^2, the bus

def euler_deriv(w, M):
    return np.array([
        ((I[1]-I[2])*w[1]*w[2] + M[0]) / I[0],
        ((I[2]-I[0])*w[2]*w[0] + M[1]) / I[1],
        ((I[0]-I[1])*w[0]*w[1] + M[2]) / I[2],
    ])

def rk4_step(w, M, dt):
    k1 = euler_deriv(w, M)
    k2 = euler_deriv(w + 0.5*dt*k1, M)
    k3 = euler_deriv(w + 0.5*dt*k2, M)
    k4 = euler_deriv(w + dt*k3, M)
    return w + dt/6.0*(k1 + 2*k2 + 2*k3 + k4)

def closed_loop(w0, Kd, tau_max, dt_plant, dt_ctrl, t_end):
    ratio = dt_ctrl / dt_plant
    n_sub = round(ratio)
    if abs(ratio - n_sub) > 1e-9:
        raise ValueError(f"dt_ctrl/dt_plant = {ratio} is not an integer; refusing to resample")
    w, n_ticks, n_calls = w0.copy(), round(t_end / dt_ctrl), 0
    for _ in range(n_ticks):
        u = np.clip(-Kd * w, -tau_max, tau_max)   # GNC runs once, here
        n_calls += 1
        for _ in range(n_sub):                     # plant integrates n_sub times, u held fixed
            w = rk4_step(w, u, dt_plant)
    return w, n_calls, n_ticks

w_final, n_calls, n_ticks = closed_loop(
    np.array([0.0020, -0.0004, 0.0006]), 400.0, 0.20, dt_plant=0.002, dt_ctrl=0.02, t_end=0.5)
print(n_calls, n_ticks, w_final)
# 25 25 [ 0.00191671 -0.00034966  0.00055005]

try:
    closed_loop(np.array([0.002, 0, 0]), 400.0, 0.20, dt_plant=0.002, dt_ctrl=0.025, t_end=0.5)
except ValueError as e:
    print(e)
# dt_ctrl/dt_plant = 12.5 is not an integer; refusing to resample
```

The plant integrates ten fine RK4 steps of $2\,\mathrm{ms}$ for every one of the 25 controller ticks over the half-second run — exactly $t_{\text{end}}/\Delta t_{\text{ctrl}} = 25$ calls to the control law, no more, no fewer — and `u` inside the inner loop is the same array reference for all ten substeps: the zero-order hold. Ask for a non-integer ratio, as the second call does, and the function refuses rather than guessing what state to hand the controller at $t = 0.025\,\mathrm{s}$, a time the plant never actually reached.
:::

## The zero-order hold's cost, and why it is worth paying

Holding the control fixed between ticks is not free — it is a controller design assumption, and the control tier's classical and digital control modules already gave you the tool to price it: a zero-order hold of period $T$ has the frequency response

$$
G_{\text{ZOH}}(j\omega) = \frac{1 - e^{-j\omega T}}{j\omega T} .
$$

Factor out the midpoint phase: $1 - e^{-j\omega T} = e^{-j\omega T/2}\left(e^{j\omega T/2} - e^{-j\omega T/2}\right) = e^{-j\omega T/2}\cdot 2j\sin(\omega T/2)$, so

$$
G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\cdot\frac{\sin(\omega T/2)}{\omega T/2} = e^{-j\omega T/2}\,\mathrm{sinc}\!\left(\frac{\omega T}{2}\right) .
$$

The $\mathrm{sinc}$ factor is real and positive for any $\omega T < 2\pi$ — every case of practical interest — so it contributes magnitude but no phase. All of the phase is in $e^{-j\omega T/2}$, exactly the phase of a pure time delay of $T/2$:

$$
\phi_{\text{ZOH}}(\omega) = -\frac{\omega T}{2} .
$$

That is the flashcard fact, derived rather than asserted: a zero-order hold behaves, in phase, exactly like a delay of half the sample period. At the loop's crossover frequency $\omega_c$, it costs $\tfrac12\omega_c T$ radians of phase margin that the control design has to budget for. Converting a common design rule — sample at 20 to 40 times crossover, $\omega_s = 2\pi/T$ in the range $20\omega_c$ to $40\omega_c$ — into that phase cost: at $\omega_s = 20\omega_c$, $\omega_c T = 2\pi/20 = 0.3142\,\mathrm{rad}$ and the ZOH eats $9.00^\circ$; at $\omega_s = 40\omega_c$, it eats $4.50^\circ$. That is the price of the architecture this lesson builds, stated in the same units a Bode plot uses.

::: example Pricing the hold on two real loops
A first-stage rigid-body pitch/yaw loop crosses over at $\omega_c = 2\,\mathrm{rad/s}$, controlled by flight software running at $100\,\mathrm{Hz}$ ($T = 0.01\,\mathrm{s}$). The oversampling ratio is $\omega_s/\omega_c = (2\pi/0.01)/2 = 314$, and the ZOH phase cost is $\phi = -\tfrac12(2)(0.01)(180/\pi) = -0.573^\circ$ — negligible against a typical $30$–$60^\circ$ phase margin target.

Now a faster reaction-wheel attitude loop, crossing over at $\omega_c = 8\,\mathrm{rad/s}$, inherited legacy flight software still running at $20\,\mathrm{Hz}$ ($T = 0.05\,\mathrm{s}$). The oversampling ratio is $\omega_s/\omega_c = (2\pi/0.05)/8 = 15.7$ — *below* the 20-times floor — and the phase cost is $\phi = -\tfrac12(8)(0.05)(180/\pi) = -11.46^\circ$. A loop designed for $35^\circ$ of phase margin without accounting for the hold is really carrying about $23.5^\circ$ once it is actually sampled — a difference large enough to matter, and one that a simulation using anything other than a true zero-order hold at the true rate would never reveal. This is the mechanism by which "just run the flight software a little slower than planned" turns a margin that looked adequate on paper into one that does not survive the sampled implementation.
:::

::: key The two-rate architecture
Integrate the plant on a fine, accurate step; run the flight code at its true rate with its output held constant until the next tick. Each controller tick is a hard step boundary the integrator is driven to — never a point evaluated from inside a stage calculation. $\Delta t_{\text{ctrl}}$ must be an integer multiple of $\Delta t_{\text{plant}}$; anything else silently changes the controller you designed, either by resampling state that was never computed or by corrupting the timing the previous lesson showed matters.
:::

::: key The zero-order hold's phase cost
A zero-order hold at period $T$ behaves like a delay of $T/2$, costing $\phi_{\text{ZOH}} = -\tfrac12\omega T$ radians of phase at frequency $\omega$ — derived from $G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$, whose sinc factor is real. A common design rule is to sample at 20 to 40 times the crossover frequency, which costs $4.5^\circ$ to $9^\circ$ of phase there.
:::

::: warning Picking $\Delta t_{\text{plant}}$ from the control rate instead of the physics
It is tempting to set the plant's fine step equal to, or a simple fraction of, the controller's period and stop there, since that number is already sitting in the requirements document. The fine step has to resolve the *fastest* dynamics actually present in the plant — a structural mode at tens of hertz, a slosh mode, the coupling period between two close moments of inertia — and none of those are obligated to be slow compared with the control rate. A vehicle with a $6\,\mathrm{Hz}$ bending mode simulated with a plant step matched to a $20\,\mathrm{Hz}$ controller ($\Delta t_{\text{plant}} = 0.05\,\mathrm{s}$) is resolving that mode with about three points per cycle — nowhere near enough — regardless of how well the two-rate bookkeeping is implemented.
:::

::: warning Treating the integer-ratio requirement as a rounding inconvenience
Rounding $\Delta t_{\text{ctrl}}/\Delta t_{\text{plant}}$ to the nearest integer and moving on hides the same problem the assertion exists to catch: a controller tick that no longer lands on the time it was supposed to, drifting further from the intended schedule with every step. If the ratio is not an integer, the right fix is to adjust $\Delta t_{\text{plant}}$ — make the physics step a little finer, which only helps accuracy — never to silently round the control period or interpolate the plant state to meet it.
:::

## Check yourself

::: check
Why must $\Delta t_{\text{ctrl}}$ be an integer multiple of $\Delta t_{\text{plant}}$, rather than merely close to one?
:::

::: answer
So that every controller tick coincides exactly with a plant step boundary. If the ratio is not an integer, some tick would fall strictly between two plant steps, and the simulation would have to either interpolate a plant state nobody actually integrated to, or silently shift the tick's timing — both of which reintroduce the timing corruption the previous lesson showed changes the controller's effective behaviour.
:::

::: check
Derive the zero-order hold's phase contribution $\phi_{\text{ZOH}}(\omega)$ from its frequency response $G_{\text{ZOH}}(j\omega) = (1 - e^{-j\omega T})/(j\omega T)$, and state why its magnitude never contributes to that phase.
:::

::: answer
Factor $1 - e^{-j\omega T} = e^{-j\omega T/2}\cdot 2j\sin(\omega T/2)$, so $G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\cdot\sin(\omega T/2)/(\omega T/2) = e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$. The sinc factor is a real number (positive for $\omega T < 2\pi$), so it can only scale the magnitude; every radian of phase comes from $e^{-j\omega T/2}$, giving $\phi_{\text{ZOH}}(\omega) = -\omega T/2$ — exactly the phase of a pure delay of half the sample period.
:::

::: check
A reaction-wheel loop crosses over at $\omega_c = 8\,\mathrm{rad/s}$ and is controlled at $20\,\mathrm{Hz}$. Compute the oversampling ratio and the ZOH's phase cost at crossover, and say whether the common 20-to-40-times design rule is satisfied.
:::

::: answer
$T = 1/20 = 0.05\,\mathrm{s}$, so $\omega_s = 2\pi/T = 125.7\,\mathrm{rad/s}$ and the ratio is $\omega_s/\omega_c = 125.7/8 = 15.7$ — below 20, so the rule is not satisfied. The phase cost is $\phi = -\tfrac12(8)(0.05) = -0.2\,\mathrm{rad} = -11.46^\circ$, larger than the $4.5^\circ$ to $9^\circ$ the rule budgets for.
:::

::: check
In the `closed_loop` code, why does the inner loop pass the exact same `u` to `rk4_step` for every one of the `n_sub` fine steps within a tick, rather than recomputing it?
:::

::: answer
That repetition *is* the zero-order hold: the control law is evaluated once per controller tick and its output is held fixed — not recomputed, not interpolated — across every fine plant step until the next tick. Recomputing `u` inside the inner loop would mean the flight software is being called at the plant's fine rate, which is exactly the corrupted-timing architecture the previous lesson showed changes the effective controller.
:::

::: check
A vehicle has a $6\,\mathrm{Hz}$ structural bending mode and is controlled by flight software at $20\,\mathrm{Hz}$. Someone proposes setting $\Delta t_{\text{plant}} = \Delta t_{\text{ctrl}} = 1/20\,\mathrm{s}$ for simplicity, arguing the integer-ratio rule is satisfied with $n = 1$. What is wrong with this choice even though it satisfies the rule?
:::

::: answer
The integer-ratio rule only protects the relationship between the two clocks; it says nothing about whether $\Delta t_{\text{plant}}$ resolves the fastest dynamics in the plant. A $6\,\mathrm{Hz}$ mode has a period of about $0.167\,\mathrm{s}$, and a $0.05\,\mathrm{s}$ step gives only about three samples per cycle — far too coarse to integrate accurately, independent of the controller entirely. $\Delta t_{\text{plant}}$ must be chosen from the physics, typically a fraction of the fastest period present, with $n$ then computed from the ratio rather than the other way around.
:::

## Summary

| Item | Statement |
| --- | --- |
| Two clocks | $\Delta t_{\text{plant}}$: fine, chosen from the fastest dynamics present. $\Delta t_{\text{ctrl}}$: the flight software's true, fixed period |
| Integer rule | $\Delta t_{\text{ctrl}} = n\,\Delta t_{\text{plant}}$, $n$ a positive integer; a non-integer ratio is refused, never rounded or interpolated |
| Zero-order hold | GNC runs once per tick; its output is held constant across every fine plant step until the next tick |
| $G_{\text{ZOH}}(j\omega)$ | $e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$: real sinc magnitude, all phase in the delay term |
| ZOH phase cost | $\phi_{\text{ZOH}}(\omega) = -\tfrac12\omega T$; the 20–40$\times$ oversampling rule costs $4.5^\circ$–$9^\circ$ at crossover |
| Measured case | $\omega_c = 8\,\mathrm{rad/s}$ at $20\,\mathrm{Hz}$: ratio $15.7$, phase cost $11.5^\circ$ — the rule violated and the margin measurably eaten |
| Choosing $\Delta t_{\text{plant}}$ | From the physics (structural and slosh modes, coupling periods), confirmed by a refinement study — never simply inherited from the control rate |

This architecture fixes *when* each box runs. It says nothing yet about the bookkeeping inside each step — which frame a vector is expressed in, whether a quaternion has drifted off the unit sphere — which is where the next lesson goes: the errors that a correctly timed, correctly integrated simulation can still get completely wrong.
