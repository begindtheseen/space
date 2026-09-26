---
id: l10-time-to-go-estimation
title: Time-to-go estimation
minutes: 23
covers:
  - Time-to-go estimation and why it is the critical quantity
---

You are on a road trip, and the map app on the phone says "arriving in 40 minutes". How does it know? It takes the distance left and divides by how fast you are going. If the road ahead is straight and the traffic steady, that guess is spot on. If the road winds through the hills, the app is too hopeful, and the real trip takes longer.

Now imagine the driver uses that guess to decide how hard to press the gas. Think you have lots of time, and you dawdle and arrive late. Think you have almost no time, and you floor it. A wrong arrival time does not just make you late. It changes how you drive.

Guidance has exactly this number. It is called **[[time-to-go|tgo-name]]** and written $t_{go}$ (read it "t go"): the time left until the vehicle reaches its target — the intercept, the touchdown, the docking. Every guidance law in this module needs it. The previous lessons used it without asking where it comes from. This lesson closes that gap, and shows why a wrong $t_{go}$ is never a small error.

## Why every law here needs it

Look back at the laws this module has built.

The zero-effort-miss and zero-effort-velocity law (lesson 8) commands

$$
\mathbf{a} = \frac{6}{t_{go}^2}\,ZEM - \frac{2}{t_{go}}\,ZEV .
$$

Proportional navigation, written in its zero-effort-miss form (lesson 7), is $a_c = N\,ZEM/t_{go}^2$. The linear-quadratic gains of lesson 7 approach $3/\tau^2$ and $3/\tau$, where $\tau$ is again the time left.

Each law multiplies an error by a **[[gain|gain-knob]]** — a number that says how hard to push for each meter or meter per second of error. And every one of those gains has $t_{go}$ or $t_{go}^2$ on the bottom. That makes sense: with lots of time left, a small push fixes the error. With little time left, you must push hard.

So $t_{go}$ is not a side detail. It sets the gains. If $t_{go}$ is wrong, every gain is wrong, even when the position and velocity are known perfectly.

## The simple estimate: distance over closing speed

The map app's rule works for guidance too. Call the distance to the target the **range** $R$. Call the speed at which that distance is shrinking the **[[closing velocity|closing-velocity]]** $V_c$ (read "V sub c"). If neither vehicle changes its velocity from now on, the range drops by $V_c$ every second, so it hits zero after

$$
t_{go} = \frac{R}{V_c}.
$$

On a true **collision course** — both vehicles flying straight at constant velocity toward the same meeting point — this is exact, not a guess. It is what every worked example before this lesson assumed.

::: example Head-on at constant speed
A pursuer flies at $90\,\mathrm{m/s}$ straight at a target $4000\,\mathrm{m}$ away. The target flies straight back toward it at $30\,\mathrm{m/s}$.

Step 1, the closing speed. They approach each other, so their speeds add: $V_c = 90 + 30 = 120\,\mathrm{m/s}$.

Step 2, divide. $t_{go} = 4000 / 120 = 33.3\,\mathrm{s}$.

Sanity check: in $33.3\,\mathrm{s}$ the pursuer covers $90 \times 33.3 \approx 3000\,\mathrm{m}$ and the target covers about $1000\,\mathrm{m}$. Together that is the $4000\,\mathrm{m}$ gap. It adds up.
:::

## Why it runs short once the path curves

Now suppose the pursuer does not start pointed straight at the target. It is off by some angle, called the **[[heading error|heading-error-picture]]** $\theta_L$ (read "theta sub L"): the angle between the pursuer's velocity and the line of sight to the target. Proportional navigation will fix that, but only by curving the path. The pursuer is flying a bend, not a straight road.

Here is the key fact. While the line of sight is turning, the closing speed can only go **down**. So $R/V_c$, which uses today's closing speed for the whole rest of the trip, always comes out too short. It **underestimates** $t_{go}$, like the map app on a mountain road.

::: note Why the closing speed can only fall
Put yourself on the pursuer and describe the target with two numbers: the range $R$ and the line-of-sight angle $\lambda$. Motion described this way (polar coordinates) has a well-known acceleration along the line of sight:

$$
\ddot R - R\dot\lambda^2 = a_{r},
$$

where $\ddot R$ ("R double dot") is how fast the range rate is changing and $a_r$ is the relative acceleration along the line of sight. The $R\dot\lambda^2$ term is the same effect that throws you outward on a merry-go-round.

True proportional navigation pushes perpendicular to the line of sight, and a target flying straight does not accelerate. So nothing pushes along the line of sight: $a_r = 0$, and

$$
\ddot R = R\dot\lambda^2 \ge 0 .
$$

Closing velocity is $V_c = -\dot R$, so $\dot V_c = -R\dot\lambda^2 \le 0$. Whenever the line of sight is turning ($\dot\lambda \ne 0$), the closing speed drops. It stays constant only when $\dot\lambda = 0$ — a collision course. In the $45^\circ$ run in the example below, $V_c$ sinks from $93.6\,\mathrm{m/s}$ at launch to about $82.1\,\mathrm{m/s}$ at the end.
:::

A better guess adds a correction for that bend. For a converging proportional navigation engagement with navigation constant $N$, a standard **[[series correction|series-correction]]** is

$$
t_{go} = \frac{R}{V_c}\left[1 + \frac{\theta_L^2}{2(2N-1)}\right],
$$

with $\theta_L$ in radians. Read the bracket as "one plus a small extra". With no heading error the extra is zero and you are back to $R/V_c$. The extra grows with the square of the heading error, so small errors barely matter and big ones matter a lot. A larger $N$ turns the pursuer onto its collision course sooner, so the bend is shorter and the extra is smaller.

::: example How far off R/V_c gets, and how much the correction fixes
Take the engagement from lesson 6: a pursuer at the origin with speed $V_M = 90\,\mathrm{m/s}$, a target at $(4000, 0, 0)\,\mathrm{m}$ flying toward it at $(-30, 0, 0)\,\mathrm{m/s}$, true proportional navigation with $N = 3$. Launch it with different heading errors and compare the real flight time $t_f$ (from a full simulation) with the two estimates made at launch.

| $\theta_L$ | Real $t_f$ | $R/V_c$ (error) | Corrected (error) |
| --- | --- | --- | --- |
| $1^\circ$ | $33.338\,\mathrm{s}$ | $33.337\,\mathrm{s}$ ($-0.00\%$) | $33.338\,\mathrm{s}$ ($-0.00\%$) |
| $10^\circ$ | $33.835\,\mathrm{s}$ | $33.718\,\mathrm{s}$ ($-0.35\%$) | $33.820\,\mathrm{s}$ ($-0.04\%$) |
| $20^\circ$ | $35.429\,\mathrm{s}$ | $34.912\,\mathrm{s}$ ($-1.46\%$) | $35.338\,\mathrm{s}$ ($-0.26\%$) |
| $30^\circ$ | $38.425\,\mathrm{s}$ | $37.057\,\mathrm{s}$ ($-3.56\%$) | $38.073\,\mathrm{s}$ ($-0.92\%$) |
| $45^\circ$ | $47.404\,\mathrm{s}$ | $42.717\,\mathrm{s}$ ($-9.89\%$) | $45.352\,\mathrm{s}$ ($-4.33\%$) |

Walk through the $45^\circ$ row by hand.

Step 1, the closing speed at launch. Only the part of the pursuer's velocity along the line of sight closes the gap: $90\cos 45^\circ = 63.64\,\mathrm{m/s}$. Add the target's $30\,\mathrm{m/s}$: $V_c = 93.64\,\mathrm{m/s}$.

Step 2, the simple estimate. $R/V_c = 4000/93.64 = 42.717\,\mathrm{s}$.

Step 3, the correction. $45^\circ = 0.7854\,\mathrm{rad}$, and $0.7854^2 = 0.6169$. With $N = 3$ the bottom is $2(2 \cdot 3 - 1) = 10$. So the bracket is $1 + 0.06169 = 1.06169$, and $42.717 \times 1.06169 = 45.352\,\mathrm{s}$.

Every estimate is short, as the note above says it must be. The correction cuts the error by a factor of about nine at $10^\circ$, about four to six at $20^\circ$ and $30^\circ$, and about two at $45^\circ$. It is not perfect — it is itself an approximation that assumes a small angle — but in the moderate range where most engagements live, it is very good.

```python
import math

def naive_tgo(R, Vc):
    return R / Vc

def refined_tgo(R, Vc, theta_L, N):
    return (R / Vc) * (1 + theta_L**2 / (2 * (2 * N - 1)))

th = math.radians(45)
Vc = 90 * math.cos(th) + 30
print(round(naive_tgo(4000, Vc), 3), round(refined_tgo(4000, Vc, th, 3), 3))
# 42.717 45.352
```
:::

## Estimating t_go for a powered descent

A coasting intercept has a closing speed to divide by. A lander burning its engine does not. Its velocity changes every second under thrust and gravity, so there is no single "current closing speed" that stays true for the rest of the flight. Dividing height by today's sink rate would be like guessing a car's arrival time while it is braking hard for a stop sign.

So a lander **chooses** $t_{go}$ instead of measuring it. There are several common ways to choose:

- **A fixed schedule.** Pick a starting $t_{go}$ and count it down one second per second.
- **A constraint.** Pick the $t_{go}$ that keeps the command inside what the engine can deliver.
- **An optimum.** Solve for the flight time that uses the least fuel, as part of the trajectory problem itself.

The constraint idea is easy to try. Ask: for the state I am in right now, what is the shortest $t_{go}$ whose ZEM/ZEV command the engine can still deliver? Committing to anything shorter would ask for more thrust than exists from the very first second.

::: example Solving for a first t_go against a thrust limit
Use the lunar descent from lesson 8: position $\mathbf{r}_0 = (300, 1500)\,\mathrm{m}$ (downrange, height), velocity $\mathbf{v}_0 = (-8, -40)\,\mathrm{m/s}$, lunar gravity $\mathbf{g} = (0, -1.62)\,\mathrm{m/s^2}$, and a target of zero position and zero velocity. The engine can deliver $3.0\,\mathrm{m/s^2}$ of acceleration.

Step 1, write the command as a function of the guessed $t_{go}$. With $\mathbf{r}_f = \mathbf{v}_f = \mathbf{0}$, $ZEM = -(\mathbf{r}_0 + \mathbf{v}_0 t_{go} + \tfrac12\mathbf{g}t_{go}^2)$ and $ZEV = -(\mathbf{v}_0 + \mathbf{g}t_{go})$.

Step 2, see how the size of the command changes with $t_{go}$. At $t_{go} = 20\,\mathrm{s}$ it is $13.2\,\mathrm{m/s^2}$, far too much. At $30\,\mathrm{s}$ it is $3.19\,\mathrm{m/s^2}$, still a little too much. At $35\,\mathrm{s}$ it is $1.28\,\mathrm{m/s^2}$, comfortable. The answer is between $30$ and $35\,\mathrm{s}$.

Step 3, let a **[[root finder|root-finding]]** pin it down. It hunts for the $t_{go}$ where "command minus limit" is exactly zero:

```python
import numpy as np
from scipy.optimize import brentq

r0 = np.array([300.0, 1500.0])   # m: downrange, height
v0 = np.array([-8.0, -40.0])     # m/s
g = np.array([0.0, -1.62])       # m/s^2, lunar gravity

def zem_zev_cmd(r, v, tgo):
    zem = -(r + v*tgo + 0.5*g*tgo**2)   # target r_f = 0
    zev = -(v + g*tgo)                  # target v_f = 0
    return (6/tgo**2)*zem - (2/tgo)*zev

def cmd_minus_limit(tgo, a_max=3.0):
    return np.linalg.norm(zem_zev_cmd(r0, v0, tgo)) - a_max

tgo_seed = brentq(cmd_minus_limit, 5.0, 80.0)
print(round(tgo_seed, 3))
# 30.384
```

So $t_{go} = 30.384\,\mathrm{s}$ is where this state's command exactly equals the $3.0\,\mathrm{m/s^2}$ limit. Anything shorter asks for more than the engine has.

Sanity check: $30.384\,\mathrm{s}$ lies between $30$ and $35\,\mathrm{s}$, as step 2 predicted. And a lander sinking at $40\,\mathrm{m/s}$ from $1500\,\mathrm{m}$ would hit the ground in about $1500/40 = 37.5\,\mathrm{s}$ if nothing changed. A half-minute braking burn is the right size.
:::

There is no neat formula for that answer. The command depends on $t_{go}$ in a tangled, nonlinear way, so you cannot solve for $t_{go}$ with algebra. A root finder is the normal tool.

## Why t_go is the critical quantity

Now for the heart of the lesson. Because every gain has $t_{go}$ on the bottom, an error in $t_{go}$ goes straight into the gains. It is not one more error sitting beside sensor noise in a list. It is a wrong multiplier on everything.

::: key Why t_go is the critical quantity
Every terminal guidance gain scales as $1/t_{go}$ or $1/t_{go}^2$. A $t_{go}$ error IS a gain error: too small a $t_{go}$ gives huge commands and saturates the actuators; too large a $t_{go}$ gives a lazy response that runs out of time. All these laws are singular at $t_{go} = 0$, so a floor on $t_{go}$ and a terminal hold law are mandatory.
:::

What about proportional navigation in the form $a_c = N V_c \dot\lambda$? There is no $t_{go}$ in sight. But the same quantity hides inside it. Along a collision course $V_c = R/t_{go}$, so an error in the measured closing velocity is the same kind of gain error as an error in $t_{go}$. Proportional navigation escapes the explicit $t_{go}$, not the problem.

::: example The same 20 percent error, early and late
Early in the lunar descent above, with $t_{go} = 45\,\mathrm{s}$, the command is $0.752\,\mathrm{m/s^2}$. Suppose $t_{go}$ is guessed $20\%$ low: $36\,\mathrm{s}$ instead of $45\,\mathrm{s}$. The command becomes $1.012\,\mathrm{m/s^2}$. That is $1.012/0.752 = 1.35$, a $35\%$ change. Noticeable, but survivable.

Now take a lander close to touchdown, at $\mathbf{r} = (2, 15)\,\mathrm{m}$ with $\mathbf{v} = (-1, -6)\,\mathrm{m/s}$ and a true $t_{go} = 3.0\,\mathrm{s}$.

Step 1, the two errors. $ZEM = -(\mathbf{r} + 3\mathbf{v} + \tfrac12\mathbf{g}\cdot 9) = (1.0,\ 10.29)\,\mathrm{m}$ and $ZEV = -(\mathbf{v} + 3\mathbf{g}) = (1.0,\ 10.86)\,\mathrm{m/s}$. Both are fairly large.

Step 2, the two terms. $(6/9)\,ZEM = (0.667,\ 6.86)$ and $(2/3)\,ZEV = (0.667,\ 7.24)$, both in $\mathrm{m/s^2}$.

Step 3, subtract. The command is $(0,\ -0.38)$, a size of only $0.380\,\mathrm{m/s^2}$. Two big numbers nearly **cancel**, leaving a small one. That is what a well-tracked trajectory looks like near the end: large terms balanced against each other.

Step 4, the same $20\%$ error. Use $t_{go} = 2.4\,\mathrm{s}$. Now $ZEM$ and $ZEV$ change too, and the two terms become $(0.417,\ 4.24)$ and $(0.833,\ 8.24)$. They no longer balance. The command jumps to $4.027\,\mathrm{m/s^2}$ — more than ten times the true $0.380$, a change of about $960\%$.

Why so much worse late than early? Not because of the gain exponents alone. A $20\%$ low $t_{go}$ inflates $1/t_{go}^2$ by the same factor, $1/0.8^2 = 1.5625$, whether $t_{go}$ is $45\,\mathrm{s}$ or $3\,\mathrm{s}$. The difference is the cancellation. Late in flight the true command is a small leftover between two large terms, so a small upset to either term is a huge upset to the leftover.
:::

::: warning A confident-looking t_go is not the same as a correct one
Nothing about $R/V_c$ or the corrected formula warns you when it is wrong. Both hand back a number, and the guidance loop uses whatever it is given. A bad $t_{go}$ makes a badly scaled command that looks like normal guidance output — right up until the actuators saturate or the vehicle arrives too fast. Treat $t_{go}$ as something to check: compare $R/V_c$ with the corrected estimate, and watch for a command growing faster than the geometry explains.
:::

### Floors and terminal holds

Look at what happens to the gain $6/t_{go}^2$ as time runs out. At $t_{go} = 1\,\mathrm{s}$ it is $6$. At $0.1\,\mathrm{s}$ it is $600$. At $0.01\,\mathrm{s}$ it is $60{,}000$. At exactly zero it is a division by zero. The law is **[[singular|singular-meaning]]** there: it stops giving an answer at all. Any tiny leftover error, times a gain racing toward infinity, gives a command no engine can follow.

Real systems guard against this in two ways, and they use both.

- A **floor on $t_{go}$**: never let the value fed to the gains drop below some small minimum, say $0.5\,\mathrm{s}$. Then $6/t_{go}^2$ can never exceed $6/0.25 = 24$.
- A **[[terminal hold|terminal-hold]]** law: in the last fraction of a second, stop running the full law. Hold the last sensible command, or switch to something simpler, such as holding attitude and a fixed thrust, until contact.

Neither one is a hack. Both follow from the fact that the law itself runs out of meaning at $t_{go} = 0$.

## Check yourself

::: check
Why is $t_{go} = R/V_c$ exact on a true collision course but only approximate for a proportional navigation engagement that starts with a heading error?
:::

::: answer
$R/V_c$ is the time until the range hits zero *if both vehicles keep their current velocity*. On a true collision course they do, so the estimate is exact by its very definition. With a heading error, the pursuer is curving its path to drive the line-of-sight rate $\dot\lambda$ to zero. While the line of sight turns, the closing speed falls ($\dot V_c = -R\dot\lambda^2$), so the real flight takes longer than a straight-line closing at today's $V_c$. The estimate is only as good as the straight-line assumption inside it.
:::

::: check
An engagement has $R/V_c = 34.208\,\mathrm{s}$ at launch, a heading error of $15^\circ$, and $N = 4$. What does the corrected estimate give?
:::

::: answer
Convert the angle: $15^\circ = 0.2618\,\mathrm{rad}$, and $0.2618^2 = 0.06854$. The bottom of the fraction is $2(2 \cdot 4 - 1) = 14$. So the extra is $0.06854/14 = 0.004896$, and $t_{go} = 34.208 \times 1.004896 = 34.375\,\mathrm{s}$. That is a small correction, about $0.5\%$, which fits: $15^\circ$ is a modest heading error.
:::

::: check
In the worked example, a $20\%$ low $t_{go}$ near touchdown changed the command almost tenfold, but the same error early in the descent changed it by only $35\%$. Explain why the $1/t_{go}$ scaling of the gains cannot, on its own, account for the difference.
:::

::: answer
A fixed *fractional* error in $t_{go}$ changes $1/t_{go}$ and $1/t_{go}^2$ by the same factor whatever $t_{go}$ is: $20\%$ low always multiplies $1/t_{go}^2$ by $1.5625$, at $45\,\mathrm{s}$ or at $3\,\mathrm{s}$. The big difference comes from elsewhere. $ZEM$ and $ZEV$ themselves depend on the guessed $t_{go}$, and near the end the true command is the small difference of two large terms that almost cancel. Changing $t_{go}$ upsets that balance. A small absolute change in the two terms becomes a huge relative change in the small leftover. Pure gain scaling misses this completely.
:::

::: check
Why does a powered descent need to *solve* for a first $t_{go}$ — for example by root-finding against a thrust limit — instead of measuring it the way $R/V_c$ does for a coasting intercept?
:::

::: answer
$R/V_c$ works because a coasting engagement has a closing speed that, carried forward, tells you when the range reaches zero. A powered descent has no such steady rate: thrust and gravity change the velocity for the whole rest of the flight, so there is nothing constant to divide by. What you can pin down is a condition you care about — here, the shortest $t_{go}$ whose ZEM/ZEV command stays within the available thrust. The command depends on $t_{go}$ in a nonlinear way, so finding the $t_{go}$ that meets the condition is a true root-finding problem, not a measurement.
:::

::: check
An engineer proposes fixing an over-large terminal command by clamping it to the actuator limit whenever it is exceeded, without changing how $t_{go}$ is estimated. Why might this hide the real problem instead of fixing it?
:::

::: answer
Clamping treats the symptom (too big a command), not the cause (a wrong $t_{go}$ feeding wrong gains into a correct law). A clamped command is no longer what the law computed, so any monitoring, tuning, or miss-distance analysis (like the adjoint method of the last lesson) that assumes the applied command is the law's output is quietly wrong. Worse, clamping can hide the exact warning sign this lesson is about: a command blowing up as $t_{go} \to 0$ looks, after clamping, like an ordinary saturated burn. The right fix works on the estimate itself — a floor on $t_{go}$, or an explicit terminal hold law.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Time-to-go $t_{go}$ | Time left until intercept, touchdown or docking |
| Simple estimate | $t_{go} = R/V_c$; exact on a constant-velocity collision course |
| Why it runs short | With the line of sight turning, $\dot V_c = -R\dot\lambda^2 \le 0$, so the closing speed only falls |
| Corrected estimate | $t_{go} = (R/V_c)\big[1+\theta_L^2/(2(2N-1))\big]$, $\theta_L$ in radians |
| Powered descent | No steady closing speed; choose $t_{go}$ by schedule, by a constraint (such as a thrust limit, found by root-finding), or by optimization |
| Why it is critical | Every gain scales as $1/t_{go}$ or $1/t_{go}^2$, so a $t_{go}$ error is a gain error; PN meets the same problem through $V_c$ |
| Late-flight danger | Near the end the true command is a near-cancellation of large terms, which a $t_{go}$ error upsets badly |
| Mandatory guard | A floor on $t_{go}$ and a terminal hold law near $t_{go} = 0$ |

Every law so far assumed the vehicle can command any acceleration it likes, and ignored the air. The next lesson turns to a rocket climbing through the atmosphere, where steering at the wrong moment can break the vehicle — and where the best plan is to let gravity do the steering.

::: context tgo-name One number with many names
Engineers write it $t_{go}$, $T_{go}$ or $\tau$, and say "time-to-go" or "t-go". Missile guidance books use it for the time until intercept. Landing guidance uses it for the time until touchdown, and ascent guidance for the time until engine cutoff, where the rocket reaches its target orbit. The meaning is always the same: how much time is left to fix whatever is still wrong. Your phone's "estimated time of arrival" is the everyday cousin of the same idea.
:::

::: context gain-knob A gain is a volume knob
A gain is the number a guidance law multiplies an error by. Turn it up and the vehicle reacts harder to the same error; turn it down and it reacts gently. In these laws the knob turns itself up as time runs out, because $t_{go}$ sits on the bottom:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="106" y="186">1</text><text x="162" y="186">2</text><text x="218" y="186">3</text><text x="274" y="186">4</text><text x="330" y="186">5</text>
    <text x="190" y="204">time-to-go (s)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0</text><text x="44" y="139">1</text><text x="44" y="104">2</text><text x="44" y="69">3</text><text x="44" y="34">4</text>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="64.0,30.0 70.8,75.9 77.6,99.1 84.5,113.1 91.3,122.5 98.1,129.3 104.9,134.3 111.7,138.3 118.6,141.4 125.4,144.0 132.2,146.2 139.0,148.0 145.8,149.6 152.7,150.9 159.5,152.1 166.3,153.1 173.1,154.1 179.9,154.9 186.8,155.7 193.6,156.3 200.4,157.0 207.2,157.5 214.1,158.1 220.9,158.5 227.7,159.0 234.5,159.4 241.3,159.8 248.2,160.1 255.0,160.4 261.8,160.7 268.6,161.0 275.4,161.3 282.3,161.6 289.1,161.8 295.9,162.0 302.7,162.2 309.5,162.4 316.4,162.6 323.2,162.8 330.0,163.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="78.0,30.0 84.5,77.6 90.9,104.5 97.4,121.1 103.8,132.1 110.3,139.8 116.8,145.4 123.2,149.5 129.7,152.7 136.2,155.2 142.6,157.2 149.1,158.8 155.5,160.1 162.0,161.2 168.5,162.2 174.9,163.0 181.4,163.6 187.8,164.2 194.3,164.7 200.8,165.2 207.2,165.6 213.7,165.9 220.2,166.2 226.6,166.5 233.1,166.7 239.5,166.9 246.0,167.1 252.5,167.3 258.9,167.5 265.4,167.6 271.8,167.8 278.3,167.9 284.8,168.0 291.2,168.1 297.7,168.2 304.2,168.3 310.6,168.4 317.1,168.5 323.5,168.5 330.0,168.6"/>
  <text x="130" y="120" font-size="12" fill="#1d6fd1">1/t_go</text>
  <text x="104" y="160" font-size="12" fill="#b4232c">1/t_go²</text>
</svg>
```

Both curves shoot up near zero; the squared one (red) rises later but faster.
:::

::: context closing-velocity Closing velocity, precisely
Closing velocity is how fast the gap is shrinking: $V_c = -\dot R$, the minus sign because a shrinking range has a negative rate. From the relative position $\mathbf{r}_{rel}$ and relative velocity $\mathbf{v}_{rel}$ it is $V_c = -(\mathbf{r}_{rel}\cdot\mathbf{v}_{rel})/\lVert\mathbf{r}_{rel}\rVert$ — the part of the relative velocity pointing down the line of sight. Two cars driving at each other at $90$ and $30\,\mathrm{m/s}$ have $V_c = 120\,\mathrm{m/s}$. If one only chases the other, the speeds subtract instead.
:::

::: context heading-error-picture What the heading error looks like
The heading error $\theta_L$ is the angle between where the pursuer is going and where the target is. Here it is $30^\circ$. Only the part of the velocity along the line of sight, $V_M\cos\theta_L$, closes the gap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="320" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <circle cx="40" cy="110" r="6" fill="#1d6fd1"/>
  <circle cx="320" cy="110" r="6" fill="#b4232c"/>
  <line x1="40" y1="110" x2="178.6" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="187.2,25 173.8,25.8 179.8,36.2" fill="#1d6fd1"/>
  <path d="M 100 110 A 60 60 0 0 0 92.0 80.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="108" y="97" font-size="13" fill="#1f2a44">θ_L = 30°</text>
  <text x="40" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">pursuer</text>
  <text x="320" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">target</text>
  <text x="230" y="102" font-size="12" fill="#6c7a93">line of sight</text>
  <text x="120" y="40" font-size="12" fill="#1d6fd1">velocity</text>
</svg>
```
:::

::: context series-correction Where the correction comes from
A "series correction" is the first extra term of a longer formula, kept because it is the biggest one. It comes from an approximate analysis of the curved flight that assumes $\theta_L$ is small. Terms with higher powers, like $\theta_L^4$, are dropped, because for a small angle they are much smaller than $\theta_L^2$. That is also why the correction weakens at $45^\circ$: $0.785\,\mathrm{rad}$ is no longer small, and the dropped terms start to matter. Paul Zarchan's *Tactical and Strategic Missile Guidance* works through this kind of estimate in detail.
:::

::: context root-finding How a root finder hunts
A root finder looks for where a curve crosses a line. `brentq` needs two guesses that land on opposite sides — here $5\,\mathrm{s}$ (command far too big) and $80\,\mathrm{s}$ (command small enough). It keeps shrinking the gap between them, mostly by halving it, until it has pinned the crossing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">25</text><text x="90" y="186">30</text><text x="170" y="186">40</text><text x="250" y="186">50</text><text x="330" y="186">60</text>
    <text x="190" y="204">guessed time-to-go (s)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0</text><text x="44" y="114">3</text><text x="44" y="54">6</text>
  </g>
  <line x1="50" y1="110" x2="330" y2="110" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="330" y="104" font-size="11" fill="#b4232c" text-anchor="end">limit 3.0 m/s²</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="54.0,47.3 58.7,56.9 63.4,65.9 68.0,74.2 72.7,81.9 77.4,89.1 82.1,95.9 86.7,102.1 91.4,108.0 96.1,113.5 100.8,118.7 105.5,123.5 110.1,128.0 114.8,132.3 119.5,136.3 124.2,140.0 128.8,143.5 133.5,146.8 138.2,149.9 142.9,152.7 147.6,155.4 152.2,157.8 156.9,159.9 161.6,161.6 166.3,162.9 170.9,163.6 175.6,163.5 180.3,162.9 185.0,161.9 189.7,160.7 194.3,159.4 199.0,158.0 203.7,156.7 208.4,155.4 213.1,154.1 217.7,152.9 222.4,151.7 227.1,150.5 231.8,149.4 236.4,148.4 241.1,147.4 245.8,146.4 250.5,145.5 255.2,144.6 259.8,143.7 264.5,142.9 269.2,142.1 273.9,141.3 278.5,140.6 283.2,139.9 287.9,139.2 292.6,138.6 297.3,138.0 301.9,137.4 306.6,136.8 311.3,136.2 316.0,135.7 320.6,135.2 325.3,134.7 330.0,134.3"/>
  <circle cx="93.1" cy="110" r="5" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="100" y="80" font-size="12" fill="#1f2a44">30.384 s</text>
</svg>
```

The blue curve is the command's size for each guess. It crosses the limit once, at $30.384\,\mathrm{s}$.
:::

::: context singular-meaning What "singular" means
A formula is singular at a point where it stops giving a finite answer — almost always because something on the bottom of a fraction reaches zero. $1/x$ is singular at $x = 0$: as $x$ shrinks, $1/x$ grows without limit. A calculator shows an error; a flight computer may show a huge number, or a "not a number" value that then spreads into everything computed from it. That is why engineers guard the singular point by design instead of hoping the vehicle never gets there — and a vehicle that reaches its target always gets there.
:::

::: context terminal-hold Why holding the last command is safe
In the last fraction of a second, there is almost no time left to change anything. Even an ideal law could only move the vehicle a tiny amount: at $1\,\mathrm{m/s^2}$ for $0.2\,\mathrm{s}$, the position shifts by only $\tfrac12 \times 1 \times 0.2^2 = 0.02\,\mathrm{m}$. So giving up the last bit of correction costs almost nothing, while running the full law there risks a wild command. The terminal hold trades a tiny bit of accuracy for a lot of safety. Ascent guidance uses the same kind of guard: the Space Shuttle's ascent guidance stopped updating its steering in the last few seconds before main engine cutoff.
:::
