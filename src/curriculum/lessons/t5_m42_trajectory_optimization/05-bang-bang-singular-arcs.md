---
id: l05-bang-bang-singular-arcs
title: Bang-bang control, the switching function, and singular arcs
minutes: 21
covers:
  - Bang-bang control, the switching function, and singular arcs
---

You need to get your bike across an empty parking lot and stop exactly at the far fence, as fast as possible. What do you do? You do not pedal gently. You pedal as hard as you can, and at just the right moment you squeeze the brakes as hard as you can. No half measures: full on, then full the other way. The only real decision is *when* to switch.

That pattern has a name: **[[bang-bang|bang-bang-name]] control** — a control that jumps between its limits and never rests in between. Lesson three met it in a tiny case: when the Hamiltonian is a straight line in the control, its lowest point is at a limit. This lesson turns that into a rule you can use, solves the Mars powered descent from lessons one and two in full, and proves why it has exactly one switch. Then it takes on the strange case where the rule goes silent: the **singular arc**.

## Why the control jumps to its limits

Many vehicles are **[[control-affine|control-affine]]**: the control enters the dynamics in a straight line. Engineers write that as

$$
\dot{\mathbf{x}} = \mathbf{a}(\mathbf{x}) + \mathbf{B}(\mathbf{x})\,\mathbf{u}.
$$

Here $\mathbf{a}(\mathbf{x})$ is what the vehicle does on its own (gravity, coasting) and $\mathbf{B}(\mathbf{x})\,\mathbf{u}$ is what the control adds. Thrust on a rocket is like this: double the thrust and you double the push.

Now suppose the running cost $L$ does not contain $\mathbf{u}$ at all — true for minimum time ($L=1$) and for minimum propellant written in Mayer form, as below. Build the Hamiltonian and collect the terms with $\mathbf{u}$:

$$
H = L + \boldsymbol\lambda^\top\mathbf{a} + \big(\mathbf{B}^\top\boldsymbol\lambda\big)^{\!\top}\mathbf{u}.
$$

Everything in front of $\mathbf{u}$ is one vector, the **switching function**. These lessons write it $\mathbf{S}$ (or $S$ for one control); the flashcards write it $s$, with the costate as $\mathbf{p}$. So $S = \mathbf{B}^\top\boldsymbol\lambda$ is the same thing as $s = \mathbf{B}^\top\mathbf{p}$.

For one control between $u_{\min}$ and $u_{\max}$, $H$ is a straight line in $u$ with slope $S$. The minimum principle says pick the $u$ that makes $H$ smallest. A straight line over an interval is smallest at one end:

- if $S<0$, $H$ falls as $u$ grows, so $u^\star = u_{\max}$;
- if $S>0$, $H$ rises as $u$ grows, so $u^\star = u_{\min}$;
- the control switches exactly when $S$ changes sign.

::: key Switching function
For control-affine dynamics $\mathbf{f} = \mathbf{a}(\mathbf{x}) + \mathbf{B}(\mathbf{x})\mathbf{u}$ with no $\mathbf{u}$ in the running cost, $s(t) = \mathbf{B}(\mathbf{x})^\top\mathbf{p}$. The control $u$ sits on the bound opposite the sign of $s$: $u^\star = u_{\max}$ where $s<0$, $u^\star=u_{\min}$ where $s>0$. Sign changes of $s$ are the switch times. How many switches there are, and where, is a fact about the particular costate history, not a fixed property of "bang-bang problems".
:::

Compare lesson three's LQR example, where $H$ had a $\tfrac12\mathbf{u}^\top\mathbf{R}\mathbf{u}$ term. That term makes $H$ a bowl in $\mathbf{u}$, and a bowl can have its lowest point in the middle, so the best control there is smooth. The straight-line shape is what forces the jumps.

::: example Crossing the lot as fast as possible
Take the bike as a **double integrator**: position $x$, speed $v$, with $\dot x = v$, $\dot v = u$ and $|u|\le u_{\max}$. Minimum time from rest at $x_0 = 4\,\mathrm{m}$ to rest at the origin, with $u_{\max}=0.5\,\mathrm{m/s^2}$.

**Step 1: the Hamiltonian.** $H = 1 + p_1 v + p_2 u$, so the switching function is $s = p_2$.

**Step 2: the costates.** $\dot p_1 = -\partial H/\partial x = 0$, so $p_1$ is constant. $\dot p_2 = -\partial H/\partial v = -p_1$, so $p_2$ changes at a constant rate: it is **affine in time**, a straight line. A straight line crosses zero at most once, so there is **at most one switch**.

**Step 3: which way first.** The bike starts at positive $x$ and must go back to $0$, so it pushes at $u=-0.5$ first, then brakes with $u=+0.5$. By symmetry (same push, same brake, rest at both ends) the switch comes halfway, at $x = 2\,\mathrm{m}$.

**Step 4: the times.** Covering $2\,\mathrm{m}$ from rest at $0.5\,\mathrm{m/s^2}$ takes $t$ with $\tfrac12(0.5)t^2 = 2$, so $t^2 = 8$ and $t = 2.828\,\mathrm{s}$. The whole trip takes twice that: $5.657\,\mathrm{s}$. Top speed, at the switch, is $0.5\times2.828 = 1.414\,\mathrm{m/s}$.

**Step 5: the switching curve.** Work backward from the origin under full braking. Every state from which full braking lands exactly at rest satisfies

$$
x = -\frac{v\,|v|}{2\,u_{\max}}.
$$

That is the **[[switching curve|switching-curve]]**: fly bang until you hit it, then switch and ride it home. Check with the numbers: at the switch, $v = -1.414\,\mathrm{m/s}$, so $x = -(-1.414)(1.414)/(2\times0.5) = 2.0\,\mathrm{m}$. It matches.
:::

## The Mars descent, solved by shooting

Now the real problem promised back in lesson one. A lander of mass $m_0 = 1000\,\mathrm{kg}$ starts at altitude $h_0=1500\,\mathrm{m}$, falling at $v_0 = -75\,\mathrm{m/s}$ (minus means down), under Mars gravity $g=3.71\,\mathrm{m/s^2}$. Its engine gives thrust $T$ anywhere from $0$ to $T_{\max}=6000\,\mathrm{N}$, with exhaust speed $c=2206.50\,\mathrm{m/s}$. It must touch down with $h=0$ and $v=0$, using as little propellant as possible. The final time is free.

**The states and dynamics.** Three states, $(h, v, m)$:

$$
\dot h = v, \qquad \dot v = \frac{T}{m} - g, \qquad \dot m = -\frac{T}{c}.
$$

Thrust enters in a straight line, so the problem is control-affine with $\mathbf{B} = (0,\ 1/m,\ -1/c)$.

**The cost.** Use the Mayer form from lesson one: maximize the landed mass, $\phi = -m(t_f)$, with $L = 0$. (It is the same as minimizing propellant $m_0 - m(t_f)$, since $m_0$ is fixed.)

**The switching function.** $H = \lambda_h v - \lambda_v g + S\,T$ with

$$
S = \frac{\lambda_v}{m} - \frac{\lambda_m}{c},
$$

measured in seconds per meter. Full thrust where $S<0$, engine off where $S>0$.

**The costates.** $\dot\lambda_h = -\partial H/\partial h = 0$, so $\lambda_h$ is constant. $\dot\lambda_v = -\partial H/\partial v = -\lambda_h$, a straight line. $\dot\lambda_m = -\partial H/\partial m = \lambda_v T/m^2$.

**The end conditions.** $h(t_f)$ and $v(t_f)$ are pinned, so their costates are free there. The final mass is not pinned, so transversality gives $\lambda_m(t_f) = \partial\phi/\partial m = -1$. The final time is free and nothing depends on the clock, so $H(t_f) = 0$.

**The shooting problem.** Four unknowns: $\lambda_h$, $\lambda_v(0)$, $\lambda_m(0)$ and $t_f$. Four residuals: $h(t_f)$, $v(t_f)$, $\lambda_m(t_f)+1$ and $H(t_f)$. Exactly the recipe of lesson four.

::: example The descent's switching function, start to touchdown
Shooting converges to

$$
\lambda_h = 0.017615\,\mathrm{kg/m}, \quad \lambda_v(0) = -0.356101\,\mathrm{kg/(m/s)}, \quad \lambda_m(0) = -0.857822, \quad t_f = 33.7598\,\mathrm{s}.
$$

**Step 1: the start.** $S(0) = \lambda_v(0)/m_0 - \lambda_m(0)/c = -0.000356101 + 0.000388771 = +3.267\times10^{-5}\,\mathrm{s/m}$. Positive, so the engine starts **off**: the lander coasts.

**Step 2: the switch.** $S$ falls and crosses zero at $t_1 = 1.8546\,\mathrm{s}$. By then the lander has fallen to $h = 1500 - 75(1.8546) - \tfrac12(3.71)(1.8546)^2 = 1354.52\,\mathrm{m}$ and sped up to $v = -75 - 3.71(1.8546) = -81.881\,\mathrm{m/s}$.

**Step 3: the burn.** From there $S$ stays negative all the way down, ending at $S(t_f) = -5.879\times10^{-4}\,\mathrm{s/m}$. Full thrust for $31.9051\,\mathrm{s}$.

**Step 4: the bill.** $6000/2206.50 = 2.7192\,\mathrm{kg/s}$ for $31.9051\,\mathrm{s}$ is $86.7579\,\mathrm{kg}$ — the number lessons one and two used. One sign change, one switch: coast, then burn.

**Step 5: read the mass price.** $\lambda_m(0) = -0.858$ says one extra kilogram of lander at the start raises the landed mass by only $0.858\,\mathrm{kg}$; the other $0.142\,\mathrm{kg}$ is extra propellant. Check by brute force: re-solving the whole landing at $m_0 = 999$ and $1001\,\mathrm{kg}$ changes the propellant by $0.142178\,\mathrm{kg}$ per kilogram. It matches to six figures.
:::

Here is the same calculation as a short program. It uses a fact proved in the note below: $S$ falls at the rate $\lambda_h/m$.

```python
import numpy as np

c = 225 * 9.80665                 # exhaust speed, m/s
m0 = 1000.0                       # starting mass, kg
q = 6000.0 / c                    # mass flow at full thrust, kg/s
lam_h = 0.017615                  # altitude costate, kg/m (constant)
lam_v0 = -0.356101                # velocity costate at t = 0, kg/(m/s)
lam_m0 = -0.857822                # mass costate at t = 0 (Mayer form)
t1, t_burn = 1.854647, 31.905148  # coast and burn durations, s

s0 = lam_v0 / m0 - lam_m0 / c              # switching function at the start
s1 = s0 - lam_h * t1 / m0                  # coast: mass fixed, s falls in a straight line
m_f = m0 - q * t_burn                      # mass at touchdown
s_f = s1 - lam_h / q * np.log(m0 / m_f)    # burn: add up -lam_h/m over the burn

print(f"s(0)  = {s0:.4e} s/m")
print(f"s(t1) = {s1:.0e} s/m")
print(f"s(tf) = {s_f:.4e} s/m")
print(f"propellant = {q * t_burn:.4f} kg")
# s(0)  = 3.2670e-05 s/m
# s(t1) = 5e-10 s/m
# s(tf) = -5.8790e-04 s/m
# propellant = 86.7579 kg
```

The $5\times10^{-10}$ at the switch is zero up to the six-figure rounding of the costates.

::: note Why it has to be true: the descent switches only once
Differentiate $S = \lambda_v/m - \lambda_m/c$ along the flight. The quotient rule on the first term and the costate equations give

$$
\dot S = \frac{\dot\lambda_v}{m} - \frac{\lambda_v\dot m}{m^2} - \frac{\dot\lambda_m}{c}
= \frac{-\lambda_h}{m} + \frac{\lambda_v T}{c\,m^2} - \frac{\lambda_v T}{c\,m^2}
= -\frac{\lambda_h}{m}.
$$

The two thrust terms cancel exactly. What is left has a fixed sign: $\lambda_h>0$ (starting higher costs propellant, as lesson two showed) and $m>0$. So $S$ always falls. A function that always falls can cross zero at most once, and only from positive to negative. So the best landing is always "coast, then burn" — never burn, coast, burn. During the coast $m$ is fixed and $S$ is a straight line; during the burn $m$ shrinks, so $S$ falls about $9.5\,\%$ faster by touchdown ($1000/913.24 = 1.095$). That is a curved $S$, but still a one-switch $S$. This is a classical result for the soft landing without air drag ([[Meditch, 1964|meditch]]).
:::

## Singular arcs: when the switching function goes flat

Everything so far assumed $S$ touches zero only at single instants. But nothing forbids $S(t)\equiv0$ — "identically zero", zero at every instant — over a whole stretch $[t_1,t_2]$. Then every allowed $u$ gives the same $H$, and minimizing $H$ tells you nothing about $u$. That stretch is a **singular arc**.

Picture a see-saw perfectly balanced: push either end and nothing tips. The minimum principle is that see-saw on a singular arc. You need another way to find $u$.

The way is to **keep differentiating**. If $S$ is zero over a whole interval, then its rate of change is zero there too, and the rate of that, and so on. Compute $\dot S$, $\ddot S$ ("S double dot"), and onward, using the state and costate equations at each step. For a well-behaved control-affine system, $u$ does not appear in these derivatives until an even order $2q$. Then setting $S^{(2q)}=0$ (the $2q$-th derivative) is one equation that contains $u$. Solve it: that is the **singular control**. The whole number $q$ is the **order** of the singular arc.

A singular arc can still be a fake — a balance point that is a maximum, not a minimum. The **generalized Legendre-Clebsch condition**, the singular-arc version of lesson three's second-order check, weeds those out:

$$
(-1)^q\,\frac{\partial}{\partial u}\left(\frac{d^{2q}}{dt^{2q}}\frac{\partial H}{\partial u}\right) \ge 0.
$$

(Here $\partial H/\partial u$ is $S$ itself.)

::: key Singular arc
An interval on which the switching function is identically zero, $s(t)\equiv0$, so the Minimum Principle does not determine $u$ pointwise. Recover $u$ by differentiating $s$ in time until $u$ appears explicitly, at derivative $2q$, and solving $s^{(2q)}=0$. Goddard ascent and many low-thrust transfers have one.
:::

::: example An order-two singular arc you can check by hand
Take the double integrator again, $\dot x_1 = x_2$, $\dot x_2 = u$ with $|u|\le1$, but now minimize $J=\int_0^{t_f}x_1^2\,dt$: charge for how far the state sits from zero, second by second. Think of a camera's pointing axis charged for aim error during a long exposure.

**Step 1: Hamiltonian and costates.** $H = x_1^2+\lambda_1x_2+\lambda_2u$, so $S=\lambda_2$. The costate equations are $\dot\lambda_1=-\partial H/\partial x_1 = -2x_1$ and $\dot\lambda_2=-\partial H/\partial x_2=-\lambda_1$. Now $\dot\lambda_1$ depends on the *state*, so $S$ is no longer a simple straight line in time.

**Step 2: differentiate until $u$ appears.** Each step uses one state or costate equation:

$$
S=\lambda_2,\qquad \dot S=-\lambda_1,\qquad \ddot S = 2x_1,\qquad \dddot S = 2x_2,\qquad S^{(4)} = 2u.
$$

$u$ first shows up at the fourth derivative. So $2q=4$ and $q=2$: an order-two singular arc.

**Step 3: where can it happen?** On the arc, all of $S$, $\dot S$, $\ddot S$, $\dddot S$ must be zero at once. That forces $\lambda_2=\lambda_1=x_1=x_2=0$. The only singular state is the origin, at rest, with zero costates. Then $S^{(4)} = 2u = 0$ gives $u = 0$.

**Step 4: does it make sense?** Yes. Once the aim error and its rate are both zero, the cheapest thing to do is nothing, forever.

**Step 5: is it a real minimum?** $\partial S^{(4)}/\partial u = 2$, and $(-1)^2\times2 = 2 \ge 0$. It passes.

**Step 6: check the chain by machine.** Start from $x_1=0.5$, $x_2=-0.2$, $\lambda_1=0.3$, $\lambda_2=0.1$ with a fixed $u=0.4$. The formulas predict $\dot S = -0.3$, $\ddot S = 1.0$, $\dddot S = -0.4$, $S^{(4)} = 0.8$. Integrating the equations and taking finite differences of $\lambda_2(t)$ with a step of $0.05$ gives $-0.30017$, $1.00017$, $-0.40000$ and $0.80000$. The tiny misses, $1.7\times10^{-4}$, are exactly the error of the finite-difference step, not of the formulas.
:::

This example has a famous twist, told in the [[note on Fuller|fuller]] at the end: reaching that singular point takes infinitely many switches.

## Why Goddard's rocket has one

The toy example shows the mechanism. The **[[Goddard problem|goddard]]** is where a singular arc first appears in a real flight: send a rocket straight up to the highest possible altitude against gravity and air drag, with $0\le T\le T_{\max}$ and a fixed load of propellant.

Drag grows with the square of speed and fades with height, roughly $D = D_0v^2e^{-h/h_s}$. The **[[scale height|scale-height]]** $h_s$ is how far you climb for the air to thin by a factor of $e\approx2.72$. Take an $800\,\mathrm{kg}$ rocket at $250\,\mathrm{m/s}$, with $h_s = 8.5\,\mathrm{km}$ and $D_0 = 0.183\,\mathrm{kg/m}$. Its weight is $800\times9.80665 = 7845\,\mathrm{N}$.

- At sea level, drag is $0.183\times250^2 \approx 11\,450\,\mathrm{N}$: about $1.46$ times its weight.
- At $10\,\mathrm{km}$, $e^{-10/8.5} = 0.308$, so drag is $0.45$ times its weight.
- At $15\,\mathrm{km}$, $e^{-15/8.5} = 0.171$, so drag is $0.25$ times its weight.

That collapsing ratio is the whole story. Low down, air is thick and speed is expensive: burning hard to go faster buys drag you immediately pay back. High up, air is thin and speed is nearly free. In between there is a **balance point**: a throttle setting strictly between $0$ and $T_{\max}$ where a little more thrust gains exactly as much as the extra drag costs. The rocket holds that balance over a whole interval as it climbs through the transition. That is a singular arc.

For Goddard, $T$ appears already at the second derivative, $\ddot S$, so the arc is order one ($q=1$). The algebra, with three states $(h,v,m)$, is longer than the toy's but follows the same differentiate-until-$u$-appears recipe. This module's Goddard exercise transcribes and solves the full problem directly, and lesson fourteen's scaling is what makes it solvable at all.

::: warning Chattering usually means a singular arc, not a bug
A direct solver may report the control [[flipping between its limits|chatter-bridge]] every one or two mesh points over a long stretch. That is usually not a broken solver. It is trying to draw a singular arc with a method that knows the limits well but has no idea of the balance point in between, so it fakes the middle value by rapid switching — like dimming a light by flicking it on and off. The fix is not a better guess or a tighter tolerance. Recognize the stretch as singular: rebuild the switching function from the solution's multipliers and check whether it *hovers* near zero there rather than crossing through. Then either impose the singular control directly or refine the mesh sharply at the junctions where the arc begins and ends.
:::

## Check yourself

::: check
In the parking-lot example the switching function is a straight line in time. In the Mars descent it is slightly curved. Why the difference, and why does the descent still switch only once?
:::

::: answer
In the double integrator, $s = p_2$ and $\dot p_2 = -p_1$ with $p_1$ constant, so $s$ changes at a constant rate: a straight line. In the descent, $S = \lambda_v/m - \lambda_m/c$ contains the mass, and its rate works out to $\dot S = -\lambda_h/m$ (the thrust terms cancel). While the lander coasts, $m$ is fixed and $S$ is a straight line. During the burn $m$ shrinks, so the slope steepens a little: that is the curve. But the slope's *sign* never changes, because $\lambda_h>0$ and $m>0$. A function that always falls crosses zero at most once, so there is one switch, from coasting to burning.
:::

::: check
In the order-two example, why does the argument conclude $x_1=x_2=0$ on the arc, and not only $\lambda_1=\lambda_2=0$?
:::

::: answer
Because the chain of derivatives ties the costates to the states. $\ddot S = 2x_1$ must be zero over the whole arc, which forces $x_1\equiv0$, and $\dddot S = 2x_2$ must be zero too, which forces $x_2\equiv0$. The costates vanish for the same reason one step earlier: $S=\lambda_2\equiv0$ and $\dot S=-\lambda_1\equiv0$. "Zero over an interval" is much stronger than "zero at one instant": it passes down through every derivative. That is why an order-$q$ arc pins $2q$ quantities along the state-costate trajectory, not only the one that made $S$ vanish.
:::

::: check
A colleague simulates the order-two example starting exactly at the origin with zero costates and $u=0$, and is surprised that nothing ever moves. Is the simulation wrong?
:::

::: answer
No. With $x_1=x_2=0$ and $u=0$, the state equations give $\dot x_1 = x_2 = 0$ and $\dot x_2 = u = 0$, so the state stays put. With $x_1\equiv0$, the costate equations give $\dot\lambda_1 = -2x_1 = 0$ and $\dot\lambda_2 = -\lambda_1 = 0$, so the costates stay at zero too. All four numbers of the necessary-condition system sit at a resting point. That is exactly the "sit at the target and do nothing" answer, and a simulation that reproduces it is behaving correctly.
:::

::: check
Explain, without the full algebra, why Goddard's singular arc should disappear if drag were a constant force that did not depend on speed or altitude.
:::

::: answer
The singular arc comes from a balance between two effects that both depend on how the flight is going: thrust buys speed, and speed costs drag that depends on how fast you already are and how thick the air still is. A constant drag force has no such feedback. It is just an extra fixed deceleration added to gravity, equally annoying at any throttle setting. There is then no rising "cost of speed" to balance against the gain from thrust, and so no reason for any in-between throttle to beat a limit. The singular arc belongs to drag's $v^2e^{-h/h_s}$ shape, not to "drag" in general.
:::

::: check
A student adds a small extra term $\varepsilon T^2$ (with $\varepsilon>0$) to the descent's running cost, to smooth things out. What happens to the thrust history, and what happens as $\varepsilon$ shrinks toward zero?
:::

::: answer
The Hamiltonian gains $\varepsilon T^2$, so as a function of $T$ it is no longer a straight line but a bowl: $H = (\ldots) + S\,T + \varepsilon T^2$. Its lowest point is where the slope is zero, $S + 2\varepsilon T = 0$, so $T = -S/(2\varepsilon)$, clipped to $[0, T_{\max}]$. Where $S$ is clearly positive, $T=0$; where $S$ is clearly negative, $T=T_{\max}$; but near the switch, while $-S/(2\varepsilon)$ lies between the limits, the thrust ramps smoothly instead of jumping. As $\varepsilon\to0$ that ramp gets steeper and shorter, and the answer returns to bang-bang. This trick, called **regularization**, is sometimes used to help a solver, at the price of solving a slightly different problem.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Control-affine | $\dot{\mathbf{x}} = \mathbf{a}(\mathbf{x}) + \mathbf{B}(\mathbf{x})\mathbf{u}$; with no $\mathbf{u}$ in $L$, $H$ is a straight line in $\mathbf{u}$ |
| Switching function | $S = \mathbf{B}^\top\boldsymbol\lambda$ (cards: $s = \mathbf{B}^\top\mathbf{p}$); $u^\star=u_{\max}$ where $S<0$, $u_{\min}$ where $S>0$ |
| Double integrator | $p_2$ affine in time, at most one switch; switching curve $x = -v\lvert v\rvert/(2u_{\max})$ |
| Descent costates | $\lambda_h = 0.017615$, $\lambda_v(0)=-0.356101$, $\lambda_m(0)=-0.857822$, $t_f = 33.7598\,\mathrm{s}$ |
| Descent switch | $S(0)=+3.27\times10^{-5}$, zero at $1.8546\,\mathrm{s}$ ($1354.52\,\mathrm{m}$, $-81.881\,\mathrm{m/s}$), $S(t_f)=-5.88\times10^{-4}\,\mathrm{s/m}$ |
| One switch, proved | $\dot S = -\lambda_h/m < 0$: coast, then burn |
| Singular arc | $S\equiv0$ on an interval; differentiate until $u$ appears at order $2q$ |
| Generalized Legendre-Clebsch | $(-1)^q\,\partial S^{(2q)}/\partial u \ge 0$ at a real minimum |
| Toy arc | $S=\lambda_2,\ \dot S=-\lambda_1,\ \ddot S=2x_1,\ \dddot S=2x_2,\ S^{(4)}=2u$; $q=2$; only at the origin |
| Goddard | Drag/weight at $250\,\mathrm{m/s}$: $1.46$ (sea level), $0.45$ ($10\,\mathrm{km}$), $0.25$ ($15\,\mathrm{km}$); singular arc of order one |
| Chattering | Rapid flipping over a stretch usually signals an unresolved singular arc |

Everything so far has been indirect: derive the conditions, then solve them. The next lesson starts the other branch, the one the rest of this module follows: turn the problem itself into a finite list of numbers, before any condition is derived, and hand it to an optimizer.

::: context bang-bang-name Where "bang-bang" comes from
The name is older than optimal control. It comes from simple on-off servomechanisms that drove a valve or control surface hard against one stop, then hard against the other: bang, bang. Engineers kept the word for any control that lives on its limits. Here is the Mars descent's own switching function and thrust, drawn to scale over $33.76\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="330" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <polyline points="40.0,34.6 60.0,41.6 80.0,48.7 100.0,55.9 120.0,63.1 140.0,70.4 160.0,77.7 180.0,85.0 200.0,92.4 220.0,99.9 240.0,107.4 260.0,115.0 280.0,122.6 300.0,130.3 320.0,138.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="200" y="80" font-size="12" fill="#1d6fd1">switching function S(t)</text>
  <line x1="55.4" y1="20" x2="55.4" y2="200" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="24" font-size="11" fill="#b4232c">switch at 1.85 s</text>
  <line x1="40" y1="190" x2="330" y2="190" stroke="#1f2a44" stroke-width="1"/>
  <polyline points="40,190 55.4,190 55.4,160 320,160" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="34" y="194" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="164" font-size="11" text-anchor="end" fill="#1f2a44">max</text>
  <text x="190" y="154" font-size="12" text-anchor="middle" fill="#1f2a44">thrust T(t): off, then full</text>
  <text x="320" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">33.76 s</text>
</svg>
```
:::

::: context control-affine What "affine" means
A function is **affine** when it is a straight line with an offset: $a + b\,u$. ("Linear" strictly means no offset, $b\,u$ alone, though people often say linear for both.) A system is control-affine when, for each frozen state, its rate of change is affine in the control. Thrust, torque from a reaction wheel, and current through a magnetic torquer all work this way, so bang-bang answers turn up all over spacecraft guidance.
:::

::: context switching-curve The switching curve in the phase plane
Plot position across and speed up. Under full push or full brake, the path is a parabola. Exactly two parabolas lead into the origin: those two halves form the switching curve $x = -v|v|/(2u_{\max})$, drawn here for $u_{\max} = 1$. Start anywhere, ride a full-push or full-brake parabola until you meet the curve, then switch and slide along it home.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <text x="300" y="115" font-size="11" text-anchor="end" fill="#1f2a44">position x</text>
  <text x="186" y="28" font-size="11" fill="#1f2a44">speed v</text>
  <polyline points="180.0,100.0 178.8,91.2 175.0,82.5 168.8,73.8 160.0,65.0 148.8,56.2 135.0,47.5 118.8,38.8 100.0,30.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="180.0,100.0 181.2,108.8 185.0,117.5 191.2,126.2 200.0,135.0 211.2,143.8 225.0,152.5 241.2,161.2 260.0,170.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <text x="96" y="24" font-size="11" fill="#1d6fd1">brake with u = −1</text>
  <text x="200" y="186" font-size="11" fill="#b4232c">brake with u = +1</text>
  <text x="100" y="46" font-size="11" text-anchor="end" fill="#1f2a44">x = −2, v = 2</text>
</svg>
```
:::

::: context meditch The soft-landing result
J. S. Meditch published the analysis of the minimum-fuel soft landing on the Moon in the *IEEE Transactions on Automatic Control* in 1964, while the Apollo program was designing its lunar descent. His result is the one proved in the note: with no air drag and a thrust limit, the propellant-optimal landing is a free fall followed by a single full-thrust burn to touchdown. Real landing guidance adds margins and other limits, but this shape is the propellant-optimal baseline it is measured against.
:::

::: context fuller Fuller's chattering surprise
In 1960 A. T. Fuller studied exactly this order-two example: minimize $\int x_1^2\,dt$ for a double integrator with $|u|\le1$. He found that the best way into the singular point at the origin switches the control infinitely many times, with the gaps between switches shrinking geometrically, so the infinitely many switches still fit in a finite time. This **chattering** is not a numerical artifact; it is the true optimum. Joining an order-two singular arc to bang arcs often needs chattering like this, which is one reason such arcs are treated with care.
:::

::: context goddard Goddard's altitude problem
Robert Goddard, the American rocket pioneer, raised the question in his 1919 paper *A Method of Reaching Extreme Altitudes*: how should a rocket spend its propellant to climb highest through the air? In 1951 Hsue-shen Tsien and Robert Evans solved a version with the calculus of variations and found the three-part answer: full thrust, an in-between singular stretch, then coasting. It has been a standard test problem for trajectory optimizers ever since.
:::

::: context scale-height How fast the air thins
Air density falls off roughly exponentially with height. Every scale height you climb, it drops by a factor of $e \approx 2.72$. For Earth's lower atmosphere the scale height is about $8.5\,\mathrm{km}$. Here is what that does to drag on the lesson's rocket at a steady $250\,\mathrm{m/s}$, as a multiple of its weight:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="20" x2="80" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="30" width="219" height="22" fill="#b4232c"/>
  <rect x="80" y="65" width="67.5" height="22" fill="#f2b880"/>
  <rect x="80" y="100" width="37.5" height="22" fill="#8fb8f0"/>
  <line x1="230" y1="22" x2="230" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="230" y="145" font-size="11" text-anchor="middle" fill="#6c7a93">drag = weight</text>
  <text x="74" y="45" font-size="11" text-anchor="end" fill="#1f2a44">0 km</text>
  <text x="74" y="80" font-size="11" text-anchor="end" fill="#1f2a44">10 km</text>
  <text x="74" y="115" font-size="11" text-anchor="end" fill="#1f2a44">15 km</text>
  <text x="305" y="45" font-size="11" fill="#1f2a44">1.46</text>
  <text x="153" y="80" font-size="11" fill="#1f2a44">0.45</text>
  <text x="123" y="115" font-size="11" fill="#1f2a44">0.25</text>
</svg>
```

Bars are to scale: $150$ pixels stand for one weight.
:::

::: context chatter-bridge Where chattering comes back
Rapid control flipping reappears later in this module in two places. Lesson eleven, on mesh refinement, shows how to put extra mesh points exactly at the junctions of a singular arc so the solver can draw it properly. Lesson seventeen, on failure modes, lists "mesh-induced control ringing" among the symptoms to recognize in a solver's output before blaming the solver.
:::
