---
id: l03-two-rate-simulation-and-zoh
title: Two rates and the zero-order hold
minutes: 16
covers:
  - Running the plant at a fine step while the flight software runs at its true rate, with zero-order hold between updates
---

Picture a road trip with a friend navigating from the passenger seat. Every block, she glances at the map and says "a bit more to the left". The driver sets the wheel there and holds it until the next instruction. Meanwhile the car keeps moving smoothly the whole time — it does not wait for the navigator. Two clocks are running at once: the car's smooth, continuous motion, and the navigator's once-a-block instructions, each one held steady until the next.

A closed-loop simulation works exactly this way. The **plant** — the vehicle's motion — is the car. It needs small, careful time steps so its motion is computed accurately. The **flight software** is the navigator. It speaks only on its own fixed beat, and between beats its last command is held.

The previous lesson set up the problem. The plant can be integrated as accurately as the physics demands. But the flight software must be called exactly once per its true sample period, on a fixed, unwavering grid, and never from inside an integrator's stage evaluations. Those two demands look like they fight. One wants a step small enough to catch the fastest motion in the vehicle. The other wants a step that matches a particular, usually much slower, control rate. They stop fighting once you notice that nothing forces them to be the *same* step.

This lesson builds the setup that keeps them apart. A fine, accurate plant step sits inside each controller tick, and the controller's output is held fixed across all of those fine steps by a **zero-order hold**. Every closed-loop simulation in this course sits on this decision.

## Two clocks, one whole-number link

Give the two clocks names. $\Delta t_{\text{plant}}$ (read "delta t plant") is the plant's integration step. $\Delta t_{\text{ctrl}}$ ("delta t control") is the flight software's true sample period.

**Choosing $\Delta t_{\text{plant}}$.** Pick it the way the Numerical Methods module taught you to pick any fixed step. Make it small compared with the shortest period you need to follow — a **[[structural mode|structural-mode]]**, a slosh mode, the fastest wobble in the rigid-body motion. Then confirm it with a refinement study: halve it, and check the answer barely moves. Do not guess it.

**Choosing $\Delta t_{\text{ctrl}}$.** You don't. It belongs to the flight software. Its designers fixed it before you wrote a line of the simulation, and the previous lesson is the reason it cannot move.

One rule ties the two clocks together. The control period must be a whole number of plant steps:

$$
\Delta t_{\text{ctrl}} = n\,\Delta t_{\text{plant}}, \qquad n \in \mathbb{Z}^+ .
$$

Read $n \in \mathbb{Z}^+$ as "$n$ is a positive whole number": $1, 2, 3, \ldots$ This is not a convenience. It is what makes every controller tick land exactly on a plant step boundary, with [[no in-between guessing|two-clocks]] and no chopped-off last step.

What if the ratio is not a whole number? Say $\Delta t_{\text{ctrl}} = 0.025\,\mathrm{s}$ and $\Delta t_{\text{plant}} = 0.002\,\mathrm{s}$. Then $0.025 / 0.002 = 12.5$. The honest response is to refuse and ask for different numbers. Do not quietly **[[interpolate|interpolation]]** the plant state onto the tick time. An interpolated state is a state nobody actually integrated to. It is manufactured. And manufacturing state is exactly the kind of quiet, unmodeled error this module exists to keep out.

::: example The two-rate loop, and a mismatched ratio refused
Use the bus from the previous two lessons, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, stopping a small leftover spin with a $400\,\mathrm{N\,m\,s/rad}$ reaction-wheel damper limited to $\pm0.20\,\mathrm{N\,m}$. Run the loop for half a second with $\Delta t_{\text{plant}} = 2\,\mathrm{ms}$ and $\Delta t_{\text{ctrl}} = 20\,\mathrm{ms}$ — a clean ratio of $20/2 = 10$. Then try again with $\Delta t_{\text{ctrl}} = 25\,\mathrm{ms}$, a ratio of $12.5$.

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

Walk through what happened.

- The run lasts $t_{\text{end}} = 0.5\,\mathrm{s}$ and the control period is $0.02\,\mathrm{s}$, so there are $0.5 / 0.02 = 25$ controller ticks. The control law was called exactly $25$ times — no more, no fewer.
- Inside each tick, the plant took ten fine RK4 steps of $2\,\mathrm{ms}$.
- The `u` in the inner loop is the same array for all ten substeps. That repetition *is* the zero-order hold.
- Asked for a ratio of $12.5$, the function refuses. It will not guess what state to hand the controller at $t = 0.025\,\mathrm{s}$, a time the plant never actually reached.

**Sanity check.** The $x$ command, $-400 \times 0.002 = -0.8\,\mathrm{N\,m}$, is clipped to $-0.2\,\mathrm{N\,m}$ and stays clipped all run. So $\omega_x$ should fall by about $0.2/1200 \times 0.5 = 8.33\times10^{-5}\,\mathrm{rad/s}$, from $0.00200$ to about $0.001917$. The printout says $0.00191671$. It matches.
:::

::: key The two-rate architecture
Integrate the plant on a fine, accurate step; run the flight code at its true rate with its output held constant until the next tick. Each controller tick is a hard step boundary the integrator is driven to — never a point evaluated from inside a stage calculation. $\Delta t_{\text{ctrl}}$ must be an integer multiple of $\Delta t_{\text{plant}}$; anything else silently changes the controller you designed, either by resampling state that was never computed or by corrupting the timing the previous lesson showed matters.
:::

::: warning Picking $\Delta t_{\text{plant}}$ from the control rate instead of the physics
It is tempting to set the plant step equal to the control period, or a simple fraction of it, and stop there — that number is already in the requirements document. But the plant step has to follow the *fastest* motion actually present in the plant: a structural mode at tens of hertz, a slosh mode, the wobble between two close moments of inertia. None of those have to be slow compared with the control rate. Take a vehicle with a $6\,\mathrm{Hz}$ bending mode, simulated with a plant step matched to a $20\,\mathrm{Hz}$ controller, $\Delta t_{\text{plant}} = 0.05\,\mathrm{s}$. One cycle of the mode lasts $1/6 \approx 0.167\,\mathrm{s}$, so it gets only about $0.167 / 0.05 \approx 3.3$ points per cycle. That is [[nowhere near enough|coarse-sampling]], however neatly the two-rate bookkeeping is done.
:::

::: warning Treating the whole-number rule as a rounding nuisance
Rounding $\Delta t_{\text{ctrl}}/\Delta t_{\text{plant}}$ to the nearest whole number and moving on hides the very problem the check exists to catch. The controller ticks no longer land when they should, and they drift further from the intended schedule with every tick. If the ratio is not whole, change $\Delta t_{\text{plant}}$ — make the physics step a little finer, which only helps accuracy. Never quietly round the control period, and never interpolate the plant state to meet it.
:::

## The zero-order hold, and what it costs

Look at what the hold does to a smooth command. Between ticks the command sits still, then jumps to the next value. So the smooth curve the controller "meant" becomes a **staircase**. Draw a smooth curve through the middle of each stair, and you will see it runs *behind* the original curve — by half a stair. A [[staircase lags its curve|zoh-staircase]] by half a step on average.

Lagging behind by a fixed time is a **time delay**, and a delay is bad news for a feedback loop. Here is why. A loop that corrects itself late tends to over-correct, like a person adjusting a shower that responds a few seconds late. Engineers measure how much lateness a loop can take with its **[[phase margin|phase-margin]]**: the extra lag, in degrees, it can absorb at its **[[crossover frequency|crossover]]** $\omega_c$ before it starts to oscillate out of control.

So holding the control fixed between ticks is not free. It is a controller design assumption, and the control tier gave you the tool to price it. A zero-order hold of period $T$ has the **[[frequency response|frequency-response]]**

$$
G_{\text{ZOH}}(j\omega) = \frac{1 - e^{-j\omega T}}{j\omega T} .
$$

Here $j$ is the imaginary unit ($j^2 = -1$; engineers write $j$ because $i$ means current), and $\omega$ ("omega") is the frequency of a test signal in radians per second. With one line of algebra, shown in the note below, this becomes

$$
G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\,\mathrm{sinc}\!\left(\frac{\omega T}{2}\right),
$$

where $\mathrm{sinc}(x) = \sin(x)/x$. Read the two factors separately.

- The **[[sinc|sinc]]** factor is a real, positive number for every $\omega T < 2\pi$ — every case that matters in practice. A real, positive number only makes the signal a little smaller or bigger. It adds no lag.
- So all the lag lives in $e^{-j\omega T/2}$. That is exactly the frequency response of a pure time delay of $T/2$.

The phase (the lag, in radians) is therefore

$$
\phi_{\text{ZOH}}(\omega) = -\frac{\omega T}{2} .
$$

In words: a zero-order hold behaves, in phase, exactly like a delay of half the sample period. At the loop's crossover frequency $\omega_c$, it costs $\tfrac12\omega_c T$ radians of phase margin that the control design must budget for.

::: note Why it has to be true
Start from $G_{\text{ZOH}}(j\omega) = (1 - e^{-j\omega T})/(j\omega T)$. The trick is to pull out the phase of the midpoint of the interval, $e^{-j\omega T/2}$:

$$
1 - e^{-j\omega T} = e^{-j\omega T/2}\left(e^{j\omega T/2} - e^{-j\omega T/2}\right).
$$

(Multiply it back out to check: $e^{-j\omega T/2}\,e^{j\omega T/2} = 1$ and $e^{-j\omega T/2}\,e^{-j\omega T/2} = e^{-j\omega T}$.)

Euler's formula, $e^{jx} = \cos x + j\sin x$, gives $e^{jx} - e^{-jx} = 2j\sin x$. With $x = \omega T/2$:

$$
1 - e^{-j\omega T} = e^{-j\omega T/2}\cdot 2j\sin(\omega T/2).
$$

Divide by $j\omega T$. The $j$ cancels, and $2/(\omega T) = 1/(\omega T/2)$:

$$
G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\cdot\frac{\sin(\omega T/2)}{\omega T/2} = e^{-j\omega T/2}\,\mathrm{sinc}\!\left(\frac{\omega T}{2}\right).
$$

For $0 < \omega T/2 < \pi$, both $\sin(\omega T/2)$ and $\omega T/2$ are positive, so the sinc factor is a positive real number with zero phase. The whole phase is the angle of $e^{-j\omega T/2}$, which is $-\omega T/2$.
:::

### Turning the design rule into degrees

A common design rule says: sample at $20$ to $40$ times the crossover frequency. In symbols, the **sampling frequency** $\omega_s = 2\pi/T$ should be between $20\,\omega_c$ and $40\,\omega_c$. What does that cost in phase?

At $\omega_s = 20\,\omega_c$: rearrange to $\omega_c T = 2\pi/20 = 0.3142\,\mathrm{rad}$. Half of that is $0.1571\,\mathrm{rad}$. Multiply by $180/\pi$ to get degrees: $9.00^\circ$.

At $\omega_s = 40\,\omega_c$: everything halves, so the hold costs $4.50^\circ$.

That is the price of the setup this lesson builds, in the same units a Bode plot uses.

::: key The zero-order hold's phase cost
A zero-order hold at period $T$ behaves like a delay of $T/2$, costing $\phi_{\text{ZOH}} = -\tfrac12\omega T$ radians of phase at frequency $\omega$ — derived from $G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$, whose sinc factor is real. A common design rule is to sample at 20 to 40 times the crossover frequency, which costs $4.5^\circ$ to $9^\circ$ of phase there.
:::

::: example Pricing the hold on two real loops
**A first-stage pitch/yaw loop.** It crosses over at $\omega_c = 2\,\mathrm{rad/s}$, and the flight software runs at $100\,\mathrm{Hz}$, so $T = 1/100 = 0.01\,\mathrm{s}$.

- Sampling frequency: $\omega_s = 2\pi/0.01 = 628.3\,\mathrm{rad/s}$.
- Oversampling ratio: $\omega_s/\omega_c = 628.3/2 = 314$ — far above the $20$-times floor.
- Phase cost: $\phi = -\tfrac12 \times 2 \times 0.01 = -0.01\,\mathrm{rad}$. In degrees, $-0.01 \times 180/\pi = -0.573^\circ$.

That is negligible against a typical phase-margin target of $30$ to $60^\circ$.

**A faster reaction-wheel attitude loop.** It crosses over at $\omega_c = 8\,\mathrm{rad/s}$, but it inherited **[[legacy|legacy-software]]** flight software still running at $20\,\mathrm{Hz}$, so $T = 0.05\,\mathrm{s}$.

- Sampling frequency: $\omega_s = 2\pi/0.05 = 125.7\,\mathrm{rad/s}$.
- Oversampling ratio: $125.7/8 = 15.7$ — *below* the $20$-times floor.
- Phase cost: $\phi = -\tfrac12 \times 8 \times 0.05 = -0.2\,\mathrm{rad} = -11.46^\circ$.

A loop designed for $35^\circ$ of phase margin, without counting the hold, really carries about $35 - 11.46 \approx 23.5^\circ$ once it is sampled. That difference matters. And a simulation that used anything other than a true zero-order hold at the true rate would never show it.

**Sanity check.** Doubling $T$ doubles the phase cost, and so does doubling $\omega_c$. The second loop has $4\times$ the crossover and $5\times$ the period of the first, so its cost should be $20\times$ larger: $20 \times 0.573^\circ = 11.46^\circ$. It is.

This is how "run the flight software a bit slower than planned, it's only a schedule change" turns a margin that looked fine on paper into one that does not survive the real, sampled implementation.
:::

## Check yourself

::: check
Why must $\Delta t_{\text{ctrl}}$ be a whole-number multiple of $\Delta t_{\text{plant}}$, rather than merely close to one?
:::

::: answer
So that every controller tick falls exactly on a plant step boundary. If the ratio is not whole, some tick lands strictly between two plant steps. The simulation then has to either interpolate a plant state nobody actually integrated to, or quietly shift the tick's timing. Both bring back the timing damage the previous lesson showed changes the controller's effective behavior.
:::

::: check
Derive the zero-order hold's phase $\phi_{\text{ZOH}}(\omega)$ from its frequency response $G_{\text{ZOH}}(j\omega) = (1 - e^{-j\omega T})/(j\omega T)$. Why does its magnitude factor add nothing to that phase?
:::

::: answer
Pull out the midpoint phase: $1 - e^{-j\omega T} = e^{-j\omega T/2}\left(e^{j\omega T/2} - e^{-j\omega T/2}\right) = e^{-j\omega T/2}\cdot 2j\sin(\omega T/2)$, using $e^{jx} - e^{-jx} = 2j\sin x$.

Divide by $j\omega T$: $G_{\text{ZOH}}(j\omega) = e^{-j\omega T/2}\cdot\sin(\omega T/2)/(\omega T/2) = e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$.

The sinc factor is a real number, positive whenever $\omega T < 2\pi$. A positive real number only scales the size; it has zero angle. So every radian of phase comes from $e^{-j\omega T/2}$, giving $\phi_{\text{ZOH}}(\omega) = -\omega T/2$ — exactly the phase of a pure delay of half the sample period.
:::

::: check
A reaction-wheel loop crosses over at $\omega_c = 8\,\mathrm{rad/s}$ and is controlled at $20\,\mathrm{Hz}$. Work out the oversampling ratio and the hold's phase cost at crossover. Is the 20-to-40-times rule met?
:::

::: answer
$T = 1/20 = 0.05\,\mathrm{s}$, so $\omega_s = 2\pi/T = 125.7\,\mathrm{rad/s}$. The ratio is $\omega_s/\omega_c = 125.7/8 = 15.7$. That is below $20$, so the rule is not met.

The phase cost is $\phi = -\tfrac12 \times 8 \times 0.05 = -0.2\,\mathrm{rad}$. In degrees, $-0.2 \times 180/\pi = -11.46^\circ$ — more than the $4.5^\circ$ to $9^\circ$ the rule budgets for.
:::

::: check
In the `closed_loop` code, why does the inner loop pass the exact same `u` to `rk4_step` for every one of the `n_sub` fine steps in a tick, instead of recomputing it?
:::

::: answer
That repetition *is* the zero-order hold. The control law runs once per controller tick, and its output is held fixed — not recomputed, not interpolated — across every fine plant step until the next tick.

Recomputing `u` inside the inner loop would mean calling the flight software at the plant's fine rate. That is exactly the scrambled-timing setup the previous lesson showed changes the effective controller.
:::

::: check
A vehicle has a $6\,\mathrm{Hz}$ structural bending mode and flight software at $20\,\mathrm{Hz}$. Someone proposes $\Delta t_{\text{plant}} = \Delta t_{\text{ctrl}} = 1/20\,\mathrm{s}$ for simplicity, pointing out that the whole-number rule holds with $n = 1$. What is wrong with this, even though it obeys the rule?
:::

::: answer
The whole-number rule only protects the link between the two clocks. It says nothing about whether $\Delta t_{\text{plant}}$ can follow the fastest motion in the plant.

A $6\,\mathrm{Hz}$ mode has a period of $1/6 \approx 0.167\,\mathrm{s}$. A $0.05\,\mathrm{s}$ step gives only about $3.3$ samples per cycle — far too coarse to integrate accurately, whatever the controller does. $\Delta t_{\text{plant}}$ must be chosen from the physics, usually a small fraction of the fastest period present. Then $n$ is worked out from the ratio, not the other way around.
:::

## Summary

| Item | Statement |
| --- | --- |
| Two clocks | $\Delta t_{\text{plant}}$: fine, chosen from the fastest dynamics present. $\Delta t_{\text{ctrl}}$: the flight software's true, fixed period |
| Whole-number rule | $\Delta t_{\text{ctrl}} = n\,\Delta t_{\text{plant}}$, $n$ a positive integer; a non-whole ratio is refused, never rounded or interpolated |
| Zero-order hold | GNC runs once per tick; its output is held constant across every fine plant step until the next tick |
| $G_{\text{ZOH}}(j\omega)$ | $e^{-j\omega T/2}\,\mathrm{sinc}(\omega T/2)$: real sinc magnitude, all phase in the delay term |
| Hold phase cost | $\phi_{\text{ZOH}}(\omega) = -\tfrac12\omega T$; the 20–40$\times$ oversampling rule costs $4.5^\circ$–$9^\circ$ at crossover |
| Worked case | $\omega_c = 8\,\mathrm{rad/s}$ at $20\,\mathrm{Hz}$: ratio $15.7$, phase cost $11.5^\circ$ — rule broken, margin measurably eaten |
| Choosing $\Delta t_{\text{plant}}$ | From the physics (structural and slosh modes, coupling periods), confirmed by a refinement study — never copied from the control rate without checking |

This setup fixes *when* each box runs. It says nothing yet about the bookkeeping inside each step — which frame a vector is written in, which unit a number carries. The next lesson is about those errors: the ones a correctly timed, correctly integrated simulation can still get completely wrong.

::: context structural-mode Vehicles bend
A rocket is long and thin, and it is not perfectly stiff. Tap it and it bends back and forth like a diving board, at its own natural rhythm — its first bending mode, often a few hertz to tens of hertz for a launch vehicle. Liquid sloshing in the tanks has its own rhythms too. If the plant step is too coarse to follow these wobbles, the simulation cannot show the controller accidentally pumping energy into them, which is one of the classic ways a launch vehicle loses control. A later lesson in this module inserts slosh and bending into the loop.
:::

::: context two-clocks The two clocks, drawn
One controller period with $n = 5$: the flight software speaks at the tall blue ticks, and the plant takes five fine steps (short grey ticks) between them. Every blue tick sits exactly on a grey one. That is what the whole-number rule buys.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="20" y1="54" x2="20" y2="66"/><line x1="52" y1="54" x2="52" y2="66"/><line x1="84" y1="54" x2="84" y2="66"/>
    <line x1="116" y1="54" x2="116" y2="66"/><line x1="148" y1="54" x2="148" y2="66"/><line x1="180" y1="54" x2="180" y2="66"/>
    <line x1="212" y1="54" x2="212" y2="66"/><line x1="244" y1="54" x2="244" y2="66"/><line x1="276" y1="54" x2="276" y2="66"/>
    <line x1="308" y1="54" x2="308" y2="66"/><line x1="340" y1="54" x2="340" y2="66"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="20" y1="30" x2="20" y2="60"/><line x1="180" y1="30" x2="180" y2="60"/><line x1="340" y1="30" x2="340" y2="60"/>
  </g>
  <text x="100" y="24" font-size="12" text-anchor="middle" fill="#1d6fd1">Δt_ctrl</text>
  <text x="36" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">Δt_plant</text>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">Δt_ctrl = 5 × Δt_plant</text>
</svg>
```
:::

::: context interpolation Filling in between known points
To interpolate is to estimate a value between two points you actually know — for example, drawing a straight line between the plant state at $0.024\,\mathrm{s}$ and at $0.026\,\mathrm{s}$ and reading off $0.025\,\mathrm{s}$. It is often a fine trick for plotting. Here it is a trap: the controller would be handed a state that no equation of motion produced, and every result downstream would carry that small invented error without any record of it.
:::

::: context coarse-sampling Three points per wobble
A $6\,\mathrm{Hz}$ wobble over half a second (three full cycles), with dots every $0.05\,\mathrm{s}$ — the plant step matched to a $20\,\mathrm{Hz}$ controller. The straight lines between dots are all an integrator this coarse can "see". The peaks are cut off, and the shape is barely recognizable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="330" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="30,80.0 34,70.1 38,60.7 42,52.6 46,46.2 50,42.0 54,40.1 58,40.7 62,43.8 66,49.2 70,56.5 74,65.3 78,75.0 82,85.0 86,94.7 90,103.5 94,110.8 98,116.2 102,119.3 106,119.9 110,118.0 114,113.8 118,107.4 122,99.3 126,89.9 130,80.0 134,70.1 138,60.7 142,52.6 146,46.2 150,42.0 154,40.1 158,40.7 162,43.8 166,49.2 170,56.5 174,65.3 178,75.0 182,85.0 186,94.7 190,103.5 194,110.8 198,116.2 202,119.3 206,119.9 210,118.0 214,113.8 218,107.4 222,99.3 226,89.9 230,80.0 234,70.1 238,60.7 242,52.6 246,46.2 250,42.0 254,40.1 258,40.7 262,43.8 266,49.2 270,56.5 274,65.3 278,75.0 282,85.0 286,94.7 290,103.5 294,110.8 298,116.2 302,119.3 306,119.9 310,118.0 314,113.8 318,107.4 322,99.3 326,89.9 330,80.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="30,80.0 60,42.0 90,103.5 120,103.5 150,42.0 180,80.0 210,118.0 240,56.5 270,56.5 300,118.0 330,80.0"/>
  <g fill="#b4232c">
    <circle cx="30" cy="80" r="3.5"/><circle cx="60" cy="42" r="3.5"/><circle cx="90" cy="103.5" r="3.5"/><circle cx="120" cy="103.5" r="3.5"/>
    <circle cx="150" cy="42" r="3.5"/><circle cx="180" cy="80" r="3.5"/><circle cx="210" cy="118" r="3.5"/><circle cx="240" cy="56.5" r="3.5"/>
    <circle cx="270" cy="56.5" r="3.5"/><circle cx="300" cy="118" r="3.5"/><circle cx="330" cy="80" r="3.5"/>
  </g>
  <text x="30" y="20" font-size="12" fill="#1d6fd1">true 6 Hz motion</text>
  <text x="30" y="142" font-size="12" fill="#b4232c">samples every 0.05 s</text>
  <text x="330" y="142" font-size="11" text-anchor="end" fill="#1f2a44">0.5 s</text>
</svg>
```
:::

::: context zoh-staircase Why the staircase runs half a step late
A smooth command (blue) held at eight samples per cycle becomes the red staircase. Each stair starts at a sample and holds it for a full step, so on average the held value is half a step old. The dashed curve is the original shifted right by exactly half a step, $T/2$ — and it runs right through the middle of each stair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,90.0 48,81.1 56,72.4 64,64.4 72,57.1 80,50.9 88,46.0 96,42.4 104,40.5 112,40.1 120,41.3 128,44.0 136,48.3 144,53.9 152,60.6 160,68.3 168,76.7 176,85.5 184,94.5 192,103.3 200,111.7 208,119.4 216,126.1 224,131.7 232,136.0 240,138.7 248,139.9 256,139.5 264,137.6 272,134.0 280,129.1 288,122.9 296,115.6 304,107.6 312,98.9 320,90.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40,90.0 75,90.0 75,54.6 110,54.6 110,40.0 145,40.0 145,54.6 180,54.6 180,90.0 215,90.0 215,125.4 250,125.4 250,140.0 285,140.0 285,125.4 320,125.4"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4" points="40,109.1 48,100.6 56,91.7 64,82.7 72,74.0 80,65.8 88,58.4 96,52.0 104,46.8 112,43.0 120,40.7 128,40.0 136,40.9 144,43.4 152,47.4 160,52.7 168,59.3 176,66.8 184,75.1 192,83.8 200,92.8 208,101.7 216,110.2 224,118.0 232,125.0 240,130.8 248,135.3 256,138.3 264,139.8 272,139.7 280,138.0 288,134.8 296,130.1 304,124.1 312,117.1 320,109.1"/>
  <text x="200" y="24" font-size="12" fill="#1d6fd1">smooth command</text>
  <text x="200" y="40" font-size="12" fill="#b4232c">held (staircase)</text>
  <text x="40" y="162" font-size="12" fill="#1f2a44">dashed: the smooth curve delayed by T/2</text>
</svg>
```
:::

::: context phase-margin How much lateness a loop can take
Push a child on a swing at the right moment and the swing grows. Push late by the wrong amount and you fight it. A feedback loop is similar: the controller's correction arrives with some lag, and if the lag at the crossover frequency reaches half a cycle ($180^\circ$), corrections start adding to the error instead of removing it. Phase margin is how many degrees short of that point the loop is. Every delay in the loop — the hold, sensor latency, computation time — eats into it.
:::

::: context crossover The frequency where the loop decides
Every feedback loop amplifies slow disturbances a lot and fast ones hardly at all. The crossover frequency $\omega_c$ is where its gain around the loop drops to exactly $1$. Below it, the controller is in charge; above it, the controller has little effect. Stability is decided by what happens right there, so that is where every delay's phase cost is measured — which is why the hold's cost is quoted "at crossover".
:::

::: context frequency-response Testing with a pure tone
One way to describe any linear system is to feed it a steady sine wave of frequency $\omega$ and watch what comes out. The output is a sine at the same frequency, but scaled in size and shifted in time. The frequency response $G(j\omega)$ is a complex number that packs both: its size is the scaling, and its angle is the shift, the phase. A Bode plot draws the size and the angle against frequency. You met these tools in the control tier.
:::

::: context sinc A curve with a name
$\mathrm{sinc}(x) = \sin(x)/x$ starts at $1$ when $x = 0$ (the limit from the small-angle rule $\sin x \approx x$), falls to $0$ at $x = \pi$, and then wobbles with shrinking ripples. For the hold, $x = \omega T/2$, so at the $20$-times sampling rule, $x = \pi/20$ and $\mathrm{sinc} \approx 0.996$: the hold barely changes the signal's size at crossover. The damage is almost all phase.
:::

::: context legacy-software Old code that still flies
Legacy software is code carried over from an earlier vehicle or program. It has flight heritage — it has flown and worked — which makes teams very reluctant to change it, because every change reopens testing. The catch is that it was designed around the old vehicle's needs, including its sample rate. A newer, faster vehicle can outgrow it without anyone touching a line of code, which is exactly the situation the example prices.
:::
