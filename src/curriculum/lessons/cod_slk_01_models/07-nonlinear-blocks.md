---
id: l07-nonlinear-blocks
title: Nonlinear blocks and the limits every real actuator has
minutes: 19
covers:
  - 'Nonlinear blocks: Saturation, Rate Limiter, Dead Zone, Quantizer, Switch, Relay, MinMax'
---

Push the gas pedal of a car to the floor. The car speeds up, but only so fast, and only up to its top speed. Stomp harder and nothing more happens. Turn the steering wheel quickly and the front wheels turn too, but they cannot turn faster than the steering rack allows, and they stop at a lock. The pedal and the wheel have limits, and every driver learns them without thinking.

Everything you have built so far in this module has been **linear**: double the input and the output doubles, forever, with no ceiling. A Gain of 2 turns 1,000 into 2,000 as happily as it turns 1 into 2. A real rocket engine gimbal does not. It can swing the engine only a few degrees, and only so many degrees per second. A **nonlinear** block is one whose output is not a fixed multiple of its input: it clips, waits, jumps, or rounds.

This lesson meets the seven nonlinear blocks you will use most. Five live in the **[[Discontinuities|discontinuities-library]]** sub-library: Saturation, Rate Limiter, Dead Zone, Quantizer and Relay. Switch lives in Signal Routing, and MinMax in Math Operations. The first two matter more than the other five together, so they come first.

## Saturation: a ceiling and a floor

Picture a thermostat dial that only turns from 10 °C to 30 °C. You can wish for 35 °C, but the dial stops at 30. That stop is **saturation**: the output follows the input until it hits a limit, then stays at the limit.

The **Saturation** block has two parameters, **Upper limit** and **Lower limit**. Its rule is

$$
y = \begin{cases} \text{upper} & u > \text{upper} \\ u & \text{lower} \le u \le \text{upper} \\ \text{lower} & u < \text{lower} \end{cases}
$$

Read it as "y equals the upper limit when u is above it, u itself in between, and the lower limit when u is below it". In MATLAB terms it is `min(max(u, lower), upper)`.

On a vehicle, saturation is everywhere. An **[[actuator|actuator]]** — the part that turns a command into a physical push, like the motor that tilts an engine or moves a fin — can only move so far. A Falcon 9 or Atlas V engine gimbal moves a few degrees. A reaction wheel has a maximum torque. A throttle valve cannot open past fully open. Whatever the controller asks for, the vehicle gets the saturated version.

## Rate Limiter: how fast it can move

Now picture a playground slide. You can go from the top to the bottom, but you cannot teleport: you slide at some speed. A **rate limit** caps how fast an output may change, no matter how fast the input jumps.

The **Rate Limiter** block has a **Rising slew rate** (the fastest it may go up, in units per second) and a **Falling slew rate** (the fastest it may go down, written as a negative number). **[[Slew rate|slew-rate]]** means "rate of change of the output". At each step the block works out how fast the input is asking it to change,

$$
\text{rate} = \frac{u(t_i) - y(t_{i-1})}{t_i - t_{i-1}},
$$

that is, the new input minus the last output, divided by the time since the last step. If that rate is above the rising limit $R$, the output only climbs by $R$ times the time step. If it is below the falling limit $F$, it only drops by $F$ times the time step. Otherwise the output equals the input.

A gimbal motor has exactly this limit. Its position cannot change faster than its motor and gearing allow, typically tens of degrees per second for an engine gimbal. A step command of 5° does not arrive at once: it arrives as a ramp.

::: key
Saturation and Rate Limiter: why model them early? Actuators always saturate in position and rate, and nearly every surprising closed-loop behavior in a real vehicle involves one of them, including integrator windup and limit cycles. A linear-only model hides the problem you will be asked about.
:::

::: example An engine gimbal: does the order of the two blocks matter?
A gimbal can reach $\pm 6°$ and move at most $20\,°/\mathrm{s}$. The controller sends a command of $10°$ from $t = 0$ to $t = 1$ s, then $0°$. Model the actuator two ways and trace the output.

**Order A: Saturation, then Rate Limiter.** The Saturation clips the $10°$ command to $6°$. The Rate Limiter then ramps from $0°$ toward $6°$ at $20\,°/\mathrm{s}$. The time to get there is distance divided by rate: $6 / 20 = 0.3$ s. At $t = 1$ s the command drops to $0°$, and the output ramps down from $6°$ at $20\,°/\mathrm{s}$, arriving at $0°$ at $1 + 0.3 = 1.3$ s.

**Order B: Rate Limiter, then Saturation.** The Rate Limiter ramps its own output toward the full $10°$. That takes $10/20 = 0.5$ s. The Saturation shows $6°$ from $t = 0.3$ s, the same as before. But inside, the Rate Limiter keeps climbing to $10°$. At $t = 1$ s it starts down from $10°$. It passes $6°$ after $(10 - 6)/20 = 0.2$ s, at $t = 1.2$ s, and only then does the visible output leave the stop. It reaches $0°$ at $1.2 + 0.3 = 1.5$ s.

**The answer.** Order B returns $0.2$ s late. The Rate Limiter's hidden state ran past a stop the real gimbal can never pass. A python simulation of both orders with a $10^{-4}$ s step gives the same times: $0.3$ s up, back at $1.3$ s for A and $1.5$ s for B.

**Sanity check.** A real gimbal sitting on its stop at $6°$ starts moving back the moment it is told to, so it should arrive $0.3$ s after the command changes. Order A does. Clip the command first, then limit the rate.
:::

::: warning The falling slew rate is negative
The Rate Limiter's Falling slew rate is a negative number, such as `-20`. Type `20` there and you have told the block the output must always rise, which is not what you meant. When a rate-limited signal refuses to come back down, check the sign first.
:::

## Windup: what saturation does to an integrator

Here is why the key block above says "nearly every surprising behavior". Imagine asking a friend to push a stalled car while you count how long it has been stuck. The longer it stays stuck, the more you yell "push harder!". But your friend is already pushing as hard as they can. When the car finally rolls, you are still yelling, and it rolls right past the spot where you wanted it.

A controller with an **integral** term does the same thing. The integral part adds up the error over time, so it can remove a steady offset. When the actuator is saturated, the error stays large, and the integral keeps growing even though the actuator cannot deliver more. This is **[[integrator windup|windup]]**. When the output finally reaches the target, the integral is far too big, and the loop overshoots while it unwinds.

::: example Windup in a roll-rate loop
A vehicle's roll rate $p$ responds to a torque command $u$ as a first-order lag with a time constant of 1 s: $\dot{p} = -p + u$ (read $\dot{p}$ as "p dot", the rate of change of $p$). A PI controller computes $u = K_p e + K_i \int e\,dt$ with $K_p = 2$, $K_i = 4$ and error $e = 1 - p$, so the target is $p = 1$. The actuator saturates at $u = \pm 1.2$. All values are in normalized units.

**Step 1: what the loop needs at rest.** At steady state $p = 1$, so $\dot{p} = 0$ and $u = p = 1$. The error is zero, so the proportional part is zero, and the integral part must supply all of it: $4 \times \int e\,dt = 1$, so the integral must settle at $0.25$.

**Step 2: the first instant.** At $t = 0$ the error is $1$, so the controller asks for $u = 2 \times 1 = 2$. The actuator gives $1.2$. It is saturated.

**Step 3: the ride up.** With $u$ stuck at $1.2$, the roll rate follows $p = 1.2\,(1 - e^{-t})$. It reaches the target when $1.2\,(1 - e^{-t}) = 1$, so $e^{-t} = 1/6$ and $t = \ln 6 \approx 1.79$ s. By then, the python simulation shows the integral has grown to about $0.64$ — more than two and a half times the $0.25$ it needs.

**Step 4: the overshoot.** With that much stored up, the controller keeps asking for more than $1.2$ even after $p$ passes 1. The actuator stays pinned until about $3.94$ s. The roll rate peaks at about $1.18$ near $t = 3.97$ s and takes about $5.3$ s to settle within 2%.

**Compare.** The same loop with no saturation peaks at $1.08$ at $1.46$ s and settles in $2.5$ s. With a simple **anti-windup** rule (stop integrating while the actuator is saturated and the error would push it further), it peaks at $1.02$ and settles in $1.8$ s.

**Sanity check.** Saturation more than doubled the settling time, and a two-line fix brought it back below the linear case. A linear model would have predicted the 8% overshoot and missed the 18% one.
:::

In Simulink you meet anti-windup in two places. The Integrator block has optional output limits, which lesson 2 introduced. The PID Controller block, in the Continuous library, has an anti-windup setting with clamping and back-calculation methods. Both only help if the model has a Saturation for them to know about.

## Dead Zone: nothing happens near zero

A game controller's thumbstick has a small region around center where wiggling it does nothing. That is a **dead zone**: inputs close to zero give zero output.

The **Dead Zone** block has **Start of dead zone** and **End of dead zone**. Inside that band the output is zero. Outside it, the output is the input shifted by the edge it crossed:

$$
y = \begin{cases} u - \text{end} & u > \text{end} \\ 0 & \text{start} \le u \le \text{end} \\ u - \text{start} & u < \text{start} \end{cases}
$$

With the band from $-0.5$ to $0.5$, an input of $2$ gives $2 - 0.5 = 1.5$, an input of $-0.3$ gives $0$, and an input of $-1$ gives $-1 - (-0.5) = -0.5$. The output is continuous: it does not jump at the edges.

Dead zones appear in gear **[[backlash|backlash]]**, in valves that need a minimum push to crack open, and on purpose in attitude controllers that ignore tiny errors to save thruster propellant.

## Quantizer: rounding to steps

A digital bathroom scale shows 71.4 kg or 71.5 kg, never anything in between. The true weight is rounded to the nearest step. The **Quantizer** block does this with one parameter, the **Quantization interval** $q$:

$$
y = q \cdot \operatorname{round}\!\left(\frac{u}{q}\right)
$$

With $q = 0.5$, an input of $1.3$ becomes $0.5 \times \operatorname{round}(2.6) = 0.5 \times 3 = 1.5$, and $1.2$ becomes $0.5 \times 2 = 1.0$. Use it to model a sensor's **[[resolution|quantization]]**, such as an encoder that reports a gimbal angle in steps of $0.01°$, or the counts of an analog-to-digital converter. A controller that looks perfect on smooth signals can chatter when every measurement moves in visible steps.

## Switch, Relay and MinMax: choosing and jumping

The last three blocks make a choice instead of reshaping a value.

**Switch** has three inputs. The middle one, $u_2$, is the control. When the control meets the **Criteria for passing first input** — one of `u2 >= Threshold`, `u2 > Threshold` or `u2 ~= 0` — the output is the first input; otherwise it is the third. Think of a railroad switch: the middle input throws the lever, and one of the two tracks goes through. A flight model uses it to pick a gain set before and after staging, or to swap in a backup sensor.

**Relay** is an on/off output with memory. It has a **Switch on point**, a **Switch off point**, an **Output when on** and an **Output when off**. Once on, it stays on until the input drops below the off point. Once off, it stays off until the input rises above the on point. The gap between the two points is **[[hysteresis|hysteresis]]**. A home thermostat works this way: heat on below 19 °C, off above 21 °C, so it does not click on and off every second. Cold-gas and hydrazine thrusters on a spacecraft are on/off devices, so a Relay is the natural first model of one.

**MinMax** outputs the smallest or largest of its inputs, set by its **Function** parameter (`min` or `max`). With several input ports it compares them element by element. With one vector input it returns the smallest or largest element. A throttle command might be the minimum of what guidance wants and what the engine's temperature limit allows.

::: key
Nonlinear blocks at a glance. Saturation clips to Upper and Lower limits. Rate Limiter caps the output's rate of change with a Rising and a (negative) Falling slew rate. Dead Zone outputs zero inside a band. Quantizer rounds to multiples of an interval. Switch picks input 1 or 3 based on input 2. Relay switches between two outputs with hysteresis. MinMax takes the smallest or largest input.
:::

::: warning A relay loop can ring forever
Put a Relay in a feedback loop and the output often settles into a steady back-and-forth that never dies out, called a **[[limit cycle|limit-cycle]]**. That may be exactly right: a spacecraft on thrusters holds attitude by drifting between the edges of a deadband. But if you expected the loop to settle to a single value, a linear analysis will not warn you. Look at the plot, and measure the period and the size of the swing.
:::

## Nonlinear blocks and the solver

Most of these blocks have a corner or a jump. A variable-step solver that steps right over a corner can put the switch at the wrong moment. So Saturation, Dead Zone, Relay, Switch and MinMax have an option to **enable zero-crossing detection**: the solver notices the input crossed a limit and backs up to find the exact moment. It is on by default, and it is why a model full of saturations sometimes slows to a crawl. The next module explains zero crossings in full; for now, know that they exist and why.

For checking a nonlinear model against an analytic answer, the lesson 4 habit still works. Pick a case where the limit is either never reached, so the model must match the linear result exactly, or always reached, so the actuator is a constant or a ramp you can integrate by hand. The windup example above did the second on its way up: $p = 1.2\,(1 - e^{-t})$ is exact while the actuator is pinned.

## Check yourself

::: check
A Saturation block has Upper limit 6 and Lower limit −6. What does it output for inputs of 4, 9 and −7.5?
:::

::: answer
$4$ is inside the limits, so the output is $4$. $9$ is above the upper limit, so the output is $6$. $-7.5$ is below the lower limit, so the output is $-6$. In MATLAB terms: `min(max([4 9 -7.5], -6), 6)` gives `[4 6 -6]`.
:::

::: check
A fin actuator can slew at $60\,°/\mathrm{s}$. A step command of $15°$ arrives at $t = 2$ s. When does the fin reach $15°$, and what is its angle at $t = 2.1$ s? Assume no position limit is hit.
:::

::: answer
The Rate Limiter turns the step into a ramp at $60\,°/\mathrm{s}$. It needs $15/60 = 0.25$ s, so the fin arrives at $t = 2.25$ s. At $t = 2.1$ s it has been ramping for $0.1$ s, so it is at $60 \times 0.1 = 6°$.
:::

::: check
A Dead Zone runs from $-0.2$ to $0.2$, and a Quantizer has interval $0.1$. What does each output for an input of $0.57$?
:::

::: answer
Dead Zone: $0.57$ is above the end of the zone, so $y = 0.57 - 0.2 = 0.37$. Quantizer: $0.57 / 0.1 = 5.7$, which rounds to $6$, so $y = 0.1 \times 6 = 0.6$.
:::

::: check
A Relay has Switch on point 21, Switch off point 19, Output when on 0 and Output when off 1 (a heater that turns off when warm). The temperature rises from 18 to 22, then falls back to 18. At what temperatures does the output change?
:::

::: answer
Say it starts off, so it outputs 1 (heater running). Rising, it stays off until the input exceeds the on point, 21; there it turns on and outputs 0 (heater stops). Falling, it stays on until the input drops below the off point, 19; there it turns off and outputs 1 again. So the heater stops at 21 and restarts at 19. The 2-degree gap is the hysteresis that keeps it from chattering.
:::

::: check
Your linear model of a pitch loop predicts 8% overshoot, but flight data shows 25% on large maneuvers and 8% on small ones. What is the first thing you would add to the model, and why?
:::

::: answer
A Saturation and a Rate Limiter on the actuator. Behavior that depends on the size of the maneuver is a sign of a nonlinearity: small commands stay inside the limits, so the linear model is right for them, and large ones hit the limits. If the controller has an integral term, windup during saturation is a likely cause of the extra overshoot.
:::

## Summary

| Block | Library | Key parameters | What it does |
|---|---|---|---|
| Saturation | Discontinuities | Upper limit, Lower limit | Clips the output to a range |
| Rate Limiter | Discontinuities | Rising slew rate, Falling slew rate | Caps how fast the output changes |
| Dead Zone | Discontinuities | Start of dead zone, End of dead zone | Zero inside a band, shifted outside |
| Quantizer | Discontinuities | Quantization interval | $y = q \cdot \operatorname{round}(u/q)$ |
| Relay | Discontinuities | Switch on point, Switch off point, outputs | On/off with hysteresis |
| Switch | Signal Routing | Criteria for passing first input, Threshold | Picks input 1 or 3 using input 2 |
| MinMax | Math Operations | Function, Number of input ports | Smallest or largest input |
| Windup (an effect, not a block) | — | — | The integral grows while the actuator is saturated; fix it with anti-windup |

Real aerodynamic and engine data is not a formula at all but a grid of numbers from wind tunnels and test stands. The next lesson shows how the n-D Lookup Table turns such a grid into a signal, and why its behavior at the table's edges is another nonlinearity you have to choose on purpose.

::: context discontinuities-library Why the library has that name
A function is **continuous** if you can draw it without lifting your pencil. Saturation and Dead Zone have corners but no gaps. Quantizer and Relay have real jumps. MathWorks groups all of these in a sub-library called Discontinuities because what they share, from the solver's point of view, is that their slope or their value changes suddenly. Smooth numerical methods like `ode45` assume the opposite, which is why these blocks need special care from the solver.
:::

::: context actuator The muscles of a vehicle
Sensors are a vehicle's eyes, the flight computer its brain, and **actuators** its muscles. On a launch vehicle the main ones are the engine gimbal actuators, which tilt each engine to steer, and on some vehicles aerodynamic fins, such as Falcon 9's grid fins used during descent. On a spacecraft they are reaction wheels, magnetic torquers and thrusters. Each has a limit on how far and how fast it can act, and a GNC engineer's model of each one starts with exactly the two blocks in this lesson.
:::

::: context slew-rate Where "slew" comes from
To **slew** originally meant to turn something heavy around on the spot, like a ship's mast or a gun. Telescope and spacecraft engineers still say a satellite "slews" when it turns to point somewhere new. Electronics engineers borrowed the word for how fast an amplifier's output can change, measured in volts per microsecond. Simulink uses it in that sense: the slew rate is the output's rate of change, in the signal's units per second.
:::

::: context windup A picture of windup
The actuator is pinned at its limit (orange). The integral term keeps growing the whole time (blue). Even after the output passes the target, the stored-up integral holds the actuator on its stop, and the output overshoots.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="168" font-size="11" fill="#1f2a44">t</text>
  <line x1="40" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="44" y="64" font-size="11" fill="#6c7a93">target</text>
  <polyline points="40,50 176,50 186,60 200,72 230,76 260,74 340,70" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="96" y="44" font-size="11" fill="#1f2a44">actuator on its stop</text>
  <path d="M40,150 C80,110 120,82 150,70 C175,60 190,52 200,52 C230,54 260,66 340,70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="205" y="44" font-size="11" fill="#1f2a44">overshoot</text>
  <path d="M40,150 C90,138 140,118 180,112 C220,112 260,120 340,124" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="250" y="140" font-size="11" fill="#1d6fd1">integral term</text>
</svg>
```

The cure is to stop feeding the integral while the actuator cannot use it.
:::

::: context backlash Slack in the gears
**Backlash** is the small gap between the teeth of two meshing gears. Reverse the motor and, for a moment, the driving gear turns without touching the driven one. The load does not move until the gap closes. A Dead Zone is the simplest stand-in for that effect in a command path. A true backlash acts on position and remembers which side of the gap it is on, and Simulink has a separate Backlash block for that.
:::

::: context quantization Staircases from smooth signals
A quantizer with interval $q$ turns a smooth ramp into a staircase whose steps are $q$ tall. The rounding error is never more than $q/2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="310" y2="15" stroke="#8fb8f0" stroke-width="2"/>
  <polyline points="40,150 70,150 70,120 130,120 130,90 190,90 190,60 250,60 250,30 310,30" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="200" y="112" font-size="11" fill="#1d6fd1">input u</text>
  <text x="120" y="80" font-size="11" fill="#b4232c">output y</text>
  <text x="18" y="124" font-size="11" fill="#1f2a44">q</text>
  <text x="18" y="94" font-size="11" fill="#1f2a44">2q</text>
  <text x="18" y="64" font-size="11" fill="#1f2a44">3q</text>
</svg>
```

A 16-bit converter spanning $\pm 10$ volts has $2^{16} = 65{,}536$ levels, so its step is $20/65{,}536 \approx 0.305$ millivolts.
:::

::: context hysteresis A loop, not a line
Hysteresis is Greek for "lagging behind". A relay's output depends on where the input has been, not only where it is now. Going up it switches at the on point; coming down it switches at the lower off point. Between them, both outputs are possible, and memory decides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="325" y="158" font-size="11" fill="#1f2a44">u</text>
  <polyline points="40,120 210,120 210,40 330,40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="330,40 150,40 150,120 40,120" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="210,70 205,80 215,80" fill="#1d6fd1"/>
  <polygon points="150,90 145,80 155,80" fill="#b4232c"/>
  <text x="200" y="158" font-size="11" fill="#1d6fd1">on point</text>
  <text x="112" y="158" font-size="11" fill="#b4232c">off point</text>
  <text x="44" y="112" font-size="11" fill="#1f2a44">output when off</text>
  <text x="240" y="32" font-size="11" fill="#1f2a44">output when on</text>
</svg>
```
:::

::: context limit-cycle Ringing on purpose
A limit cycle is a repeating swing that a loop falls into and stays in. A satellite holding attitude with on/off thrusters lives in one: it drifts to one edge of an allowed band, fires a short pulse, drifts to the other edge, and fires again. Designers size the band and the pulse so that propellant lasts the mission. Limit cycles also appear by accident when an actuator's rate limit makes a loop too slow to keep up. Analyzing them is part of the nonlinear control module later in the course.
:::
