---
id: l16-tooling
title: "Tooling: automatic differentiation and the trajectory-optimization stack"
minutes: 21
covers:
  - "Tooling: CasADi with IPOPT, GPOPS-II, PSOPT, Dymos/OpenMDAO, PyOMO, ACADO, trajax"
---

Suppose you want to know how fast a car is going, and all you have is a camera. You take two photos a moment apart, measure how far the car moved between them, and divide by the time between the shots. Take the photos a whole second apart and you get the average speed over that second, not the speed right now. Take them a millionth of a second apart and the car has moved less than the width of one pixel, so the answer is mostly blur. There is a best spacing in between, and even that one is not perfect.

Now suppose you could sit in the driver's seat and read the speedometer. No photos, no spacing to choose. The speedometer is wired to the wheels, and it reports the speed directly.

Every solver in this module needs slopes: how much each defect changes when each unknown is nudged. Those slopes fill the **Jacobian**, the table of partial derivatives from lesson 13. So far this module built them two ways: by hand, from the defect formulas, or by nudging the unknowns and measuring, which is the two-photo method. This lesson shows why the two-photo method has a floor it can never get under, and how **automatic differentiation** reads the speedometer instead. Then it walks through the real software that engineers use to set up and solve trajectory problems — CasADi with IPOPT, GPOPS-II, PSOPT, Dymos, Pyomo, ACADO and trajax — and what each one does for you, and what none of them do.

## Slopes by nudging: finite differences

The slope of a function $g$ at a point $x$ is how much $g$ changes per unit change in $x$. The two-photo way to estimate it is a **finite difference**: evaluate $g$ at two nearby points and divide the change by the distance between them. The **central difference** puts one point a little to each side:

$$
g'(x) \approx \frac{g(x+\delta) - g(x-\delta)}{2\delta}.
$$

Read $g'(x)$ as "g prime of x", the slope. The small number $\delta$ ("delta") is the **step size**, the spacing between the photos.

Two different errors fight over $\delta$.

- **Truncation error.** If $\delta$ is big, you are measuring an average slope over a stretch where the true slope is changing. For the central difference this error is about $\delta^2\,|g'''|/6$, where $g'''$ ("g triple prime") is the third derivative. It shrinks fast as $\delta$ shrinks.
- **Round-off error.** A computer stores each number to about 16 significant digits — **[[double precision|round-off]]**. When $\delta$ is tiny, $g(x+\delta)$ and $g(x-\delta)$ agree in almost all of those digits. Subtracting them leaves only the last few digits, which are mostly rounding noise. Then you divide that noise by the tiny $2\delta$, which blows it up. This error is about $10^{-16}\,|g|/\delta$. It *grows* as $\delta$ shrinks.

One error falls as $\delta$ shrinks and the other rises. No choice of $\delta$ makes both small. That is the floor.

::: example The floor a finite difference cannot get under
Take $g(x) = x^3\sin x + \dfrac{e^{2x}}{x+1}$ at $x = 1.7$.

**Step 1: the exact answer, by hand.** Use the product rule on the first term and the quotient rule on the second:

$$
g'(x) = 3x^2\sin x + x^3\cos x + \frac{2e^{2x}(x+1) - e^{2x}}{(x+1)^2}.
$$

At $x = 1.7$ the three pieces are $8.597734$, $-0.633013$ and $18.085328$. They add to $g'(1.7) = 26.050049$.

**Step 2: central differences at six step sizes.**

| $\delta$ | estimated slope | error |
| --- | --- | --- |
| $10^{-2}$ | $26.050569$ | $5.20\times10^{-4}$ |
| $10^{-4}$ | $26.050049$ | $5.20\times10^{-8}$ |
| $10^{-6}$ | $26.050049$ | $2.58\times10^{-9}$ |
| $10^{-8}$ | $26.050049$ | $8.52\times10^{-8}$ |
| $10^{-10}$ | $26.050060$ | $1.11\times10^{-5}$ |
| $10^{-12}$ | $26.052938$ | $2.89\times10^{-3}$ |

**Step 3: read the table.** From $10^{-2}$ to $10^{-4}$ the error falls by a factor of $10^4$, exactly as $\delta^2$ predicts: $g''' \approx 31.19$ here, and $31.19 \times 10^{-4}/6 = 5.20\times10^{-4}$. Around $\delta = 10^{-6}$ the error [[bottoms out|v-curve]]. Below that, round-off takes over and the error climbs again. At $\delta = 10^{-12}$ the estimate is wrong in the third decimal place.

**Sanity check.** The best error, about $2.6\times10^{-9}$ on a slope of $26$, means about ten correct digits out of sixteen. Every finite-difference Jacobian in this module lost about six digits to this floor, silently, before the solver ever saw it.
:::

::: warning Shrinking the step does not keep helping
The natural instinct is "smaller step, better slope". That is true only down to the floor. Past it, a smaller step makes the slope *worse*, and nothing in the output warns you. If you must use finite differences, a step near the cube root of $10^{-16}$ times the size of the numbers involved (here about $5\times10^{-6}$) is about the best you can do.
:::

## Automatic differentiation: reading the speedometer

**Automatic differentiation**, or **AD**, computes slopes that are exact to the last digit the computer stores. It does not compare two nearby values of $g$ at all. Instead it carries the slope along *with* the value, through every single step of the calculation — every add, multiply, sine and exponential — applying the chain rule at each one. Your program computes the value of $g$; AD makes the same program compute $g'$ at the same time.

The simplest version is called **forward mode**, and it runs on **[[dual numbers|dual-numbers]]**. A dual number looks like

$$
a + b\,\varepsilon, \qquad \text{with the one rule } \varepsilon^2 = 0.
$$

Read $\varepsilon$ as "epsilon". It is not a small number. It is a new symbol that obeys one rule: its square is exactly zero. The part $a$ carries the value, and the part $b$ carries the slope.

Adding and multiplying work like ordinary algebra, then the rule throws away the $\varepsilon^2$ term:

$$
(a+b\varepsilon)+(c+d\varepsilon) = (a+c)+(b+d)\varepsilon, \qquad (a+b\varepsilon)(c+d\varepsilon) = ac + (ad+bc)\varepsilon.
$$

Multiply out the product and you get $ac + ad\varepsilon + bc\varepsilon + bd\varepsilon^2$. The last term is zero by the rule. What is left in front of $\varepsilon$, $ad + bc$, is exactly the product rule from calculus.

Functions like sine and exponential get the **[[chain rule|chain-rule]]** built in, once each:

$$
\sin(a+b\varepsilon) = \sin a + b\cos a\,\varepsilon, \qquad \exp(a+b\varepsilon) = e^a + b\,e^a\,\varepsilon.
$$

To find $g'(x_0)$, **seed** the input as $x = x_0 + 1\cdot\varepsilon$ and run the ordinary program. The number that comes out in front of $\varepsilon$ is $g'(x_0)$. Not an estimate of it: the slope itself, rounded only the way every computer number is rounded.

::: note Why it has to be true
Every smooth function has a Taylor expansion: $g(x_0 + \varepsilon) = g(x_0) + g'(x_0)\,\varepsilon + \tfrac12 g''(x_0)\,\varepsilon^2 + \dots$ With ordinary numbers the later terms are small but not zero, which is where a finite difference's truncation error comes from. With dual numbers $\varepsilon^2 = 0$ exactly, so every later term vanishes exactly, and $g(x_0 + \varepsilon) = g(x_0) + g'(x_0)\,\varepsilon$ with nothing left over. Each arithmetic rule above is this fact for one operation. Chaining the operations chains the rules, which is the chain rule, so the slope of the whole program comes out exact.
:::

Here is the whole idea as a short program. It handles add, subtract, multiply, divide, sine and exponential — enough for $g$.

```python
import math

class Dual:
    """A dual number a + b*eps with eps*eps = 0. a is the value, b the slope."""
    def __init__(self, a, b=0.0):
        self.a, self.b = a, b
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.a + o.a, self.b + o.b)
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.a * o.a, self.a * o.b + self.b * o.a)     # product rule
    __rmul__ = __mul__
    def __truediv__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.a / o.a, (self.b * o.a - self.a * o.b) / o.a**2)  # quotient rule

def sin(x): return Dual(math.sin(x.a), x.b * math.cos(x.a))      # chain rule, once
def exp(x): return Dual(math.exp(x.a), x.b * math.exp(x.a))

def g(x):
    return x * x * x * sin(x) + exp(2 * x) / (x + 1)

x0 = 1.7
ad = g(Dual(x0, 1.0)).b                                          # seed with slope 1
exact = (3 * x0**2 * math.sin(x0) + x0**3 * math.cos(x0)
         + (2 * math.exp(2 * x0) * (x0 + 1) - math.exp(2 * x0)) / (x0 + 1)**2)
print(repr(ad))      # 26.05004878112112
print(repr(exact))   # 26.05004878112112
```

The two numbers agree in all sixteen digits Python prints. There is no step size to tune, because nothing was approximated.

::: key Why this changes what "build the Jacobian" means
A hand-derived Jacobian costs labor and invites sign errors; a finite-difference Jacobian loses about half its digits and costs one extra run of the model per unknown. Automatic differentiation, applied to the same defect and cost functions this module wrote by hand, produces exact derivatives automatically, at a cost of a small constant multiple of evaluating the function itself. That is the specific advance that turns transcribing a fifteen-state, multi-phase vehicle problem from a week of algebra into an afternoon's work.
:::

::: example The same dual numbers on this module's Mars descent
The descent dynamics used all through this module are $\dot v = T/m - g$ and $\dot m = -T/c$, with Mars gravity $g = 3.71\,\mathrm{m/s^2}$ and exhaust velocity $c = 2206.5\,\mathrm{m/s}$. Pick a point partway down the descent: $m = 950\,\mathrm{kg}$, $T = 6000\,\mathrm{N}$.

**Seed the mass.** Set $m = 950 + 1\cdot\varepsilon$ and $T = 6000$ (no $\varepsilon$). Dividing, $T/m = 6.31579 - 0.0066482\,\varepsilon$. Subtracting $g$ does not touch the slope part. So $\partial\dot v/\partial m = -0.0066482\,\mathrm{s^{-2}}$. The hand formula is $-T/m^2 = -6000/950^2 = -0.0066482$. They match.

**Seed the thrust.** Now set $T = 6000 + 1\cdot\varepsilon$ and $m = 950$. Then $\dot v = 2.60579 + 0.0010526\,\varepsilon$ and $\dot m = -2.71924 - 0.00045321\,\varepsilon$. So $\partial\dot v/\partial T = 0.0010526 = 1/m$ and $\partial\dot m/\partial T = -0.00045321 = -1/c$. They match too.

**What it means.** Every entry of the dynamics block that a defect's slope needs — the block this module built by hand or by nudging in every worked example — comes out of the [[same program run with a seed|mars-graph]], one seed per unknown. No algebra on paper, so no sign to drop.

**Sanity check on units.** $\dot v$ is in $\mathrm{m/s^2}$ and $m$ in $\mathrm{kg}$, so $\partial \dot v/\partial m$ is in $\mathrm{m/(s^2\,kg)}$. More mass, same thrust, less acceleration: the minus sign is right.
:::

### Reverse mode: all the slopes of one output at once

Forward mode needs one run per input: seed $m$, run; seed $T$, run. A trajectory NLP has thousands of unknowns but only one cost. Running the program thousands of times to get the cost's gradient would be slow.

**Reverse mode** runs the other way. First it runs the program forward once and records every operation. Then it sweeps backward through that record, from the output to the inputs, asking at each step "how much does the output change if this intermediate number changes?" One backward sweep delivers the slope of one output with respect to *every* input, at a cost of a few function evaluations, no matter how many inputs there are. It is the same idea as **[[backpropagation|backprop]]** in machine learning, and the same backward direction as the costate equations of lesson 2.

The rule of thumb is simple. Many inputs and few outputs (a scalar cost, a Lagrangian): reverse mode. Few inputs and many outputs: forward mode. Good AD tools pick the direction for you, piece by piece, and combine it with the sparsity pattern of lesson 13 so that a whole block-banded Jacobian comes out in a handful of sweeps.

## The toolbox

Think of a workshop. There is a general-purpose drill that does most jobs, a jig built for one exact cut, a machine that fits into a larger factory line, and a small tool that rides along in the truck. Trajectory software is the same.

**CasADi with IPOPT** is the drill most engineers reach for first. **[[CasADi|casadi-name]]** is a symbolic framework: you write the dynamics, cost and constraints once, in Python, MATLAB or C++, and it builds a graph of every operation. From that graph it computes exact derivatives by AD (forward or reverse, chosen per piece) and detects the sparsity pattern itself, rather than you guessing or configuring it. It hands all of that to **[[IPOPT|ipopt-name]]**, an open-source interior-point solver built for large sparse NLPs. The collocation transcriptions of lessons 6 to 8 become a few dozen lines, and you still choose the transcription yourself.

**GPOPS-II** and **PSOPT** are pseudospectral specialists. They automate what lessons 9 to 11 built by hand: Legendre-Gauss-Radau nodes, and hp-adaptive mesh refinement that splits the time interval where the error estimate says a feature (a switch, a constraint activation) is hiding. GPOPS-II is a commercial MATLAB package. PSOPT is open-source C++.

**Dymos**, built on NASA's **[[OpenMDAO|openmdao]]** framework, puts trajectory optimization inside a larger design loop. It can optimize a vehicle's mass, engine size or wing along with its trajectory, instead of the trajectory alone. The price is a bigger, more general framework to learn.

**Pyomo** (spelled PyOMO in some lists) is a general algebraic modeling language from the operations-research world, not built for aerospace at all. It poses a trajectory NLP the same way it poses a power-grid or supply-chain problem. It earns its place when a trajectory problem has to plug into a larger model, or when you want to swap between many solvers.

**ACADO** targets real-time and **[[embedded|embedded]]** use. It generates self-contained C code for one fixed-structure problem — fixed numbers of states, controls and mesh points — so the solver can run inside a flight computer's control loop in a predictable time. It is the natural next step after the real-time iLQR discussion of lesson 12.

**trajax**, built on Google's **[[JAX|jax]]**, exposes AD through a framework designed for GPUs and "differentiable programming" in general. It fits iLQR and DDP, which need derivatives of an entire rollout, and it fits newer work that mixes classical trajectory optimization with dynamics models learned from data.

| Tool | What it automates | Best at |
| --- | --- | --- |
| CasADi + IPOPT | AD, sparsity detection, sparse interior-point solve | General transcriptions, fast setup |
| GPOPS-II / PSOPT | hp-adaptive pseudospectral meshing | Best offline answer for smooth-with-junctions problems |
| Dymos / OpenMDAO | Trajectory coupled to vehicle design | Multidisciplinary design studies |
| Pyomo | Algebraic modeling, many solver back ends | Trajectories inside larger models |
| ACADO | Code generation for a fixed problem | Embedded, real-time control |
| trajax | AD on GPUs, whole-rollout derivatives | iLQR/DDP, learned dynamics |

::: warning None of this tooling replaces knowing what it does
An AD framework computes an exact Jacobian. It does not know whether the problem is well scaled, whether the mesh resolves a bang-bang switch, or whether a "successful" solve found a good answer or a poor local one. Lesson 14 measured the raw-SI orbit transfer's condition number with slopes exact to rounding, and it was still about $200$ times worse than in canonical units. AD fixes derivative accuracy completely and does nothing for conditioning, which comes from the units you chose, not from how the slopes were computed. Reading a switching function, checking a covector-mapped costate, refining a mesh from an interpolated-defect estimate, spotting bad scaling — every skill this module built is exactly as necessary with professional tools as with the from-scratch code.
:::

## Check yourself

::: check
Why does a finite-difference slope get *worse* again when the step $\delta$ becomes very small, instead of improving forever?
:::

::: answer
The central difference is $[g(x+\delta)-g(x-\delta)]/(2\delta)$. The computer stores $g(x+\delta)$ and $g(x-\delta)$ to only about sixteen significant digits. Once $\delta$ is so small that the two values agree in most of those digits, their difference is mostly rounding noise from the last few digits, not the true tiny change in $g$. Dividing that noise by an even smaller $2\delta$ magnifies it. The table shows both effects: truncation error shrinks from $\delta = 10^{-2}$ down to about $10^{-6}$, then round-off error grows as $\delta$ keeps shrinking. No step size escapes both.
:::

::: check
A dual number $a+b\varepsilon$ with $\varepsilon^2=0$ is used to compute a slope by seeding $b = 1$. Why does seeding $b = 1$ (rather than, say, $b = 2$) give the slope directly, with nothing to divide afterward?
:::

::: answer
Running $x = x_0 + 1\cdot\varepsilon$ through the dual-number rules computes the first-order Taylor expansion $g(x_0+\varepsilon) = g(x_0) + g'(x_0)\,\varepsilon$ exactly, because $\varepsilon^2 = 0$ is enforced exactly, not approximately. So the number in front of $\varepsilon$ is $g'(x_0)\times 1$, the slope itself. Seeding $b = 2$ would track $g(x_0 + 2\varepsilon) = g(x_0) + 2g'(x_0)\,\varepsilon$, whose coefficient is $2g'(x_0)$. You could divide by $2$ to recover the slope, but there is no reason to, which is why every AD tool seeds with $1$.
:::

::: check
Work out $(3 + 2\varepsilon)(4 - \varepsilon)$ by hand. Then say what derivative it computed if $3 + 2\varepsilon$ and $4 - \varepsilon$ are the values and slopes of two functions $u$ and $w$ at some point.
:::

::: answer
Multiply out: $3\cdot4 + 3(-\varepsilon) + 2\varepsilon\cdot 4 + 2\varepsilon(-\varepsilon) = 12 - 3\varepsilon + 8\varepsilon - 2\varepsilon^2$. The last term is zero by the rule, leaving $12 + 5\varepsilon$.

The value part, $12$, is $u\,w$. The slope part, $5$, is $u\,w' + u'\,w = 3(-1) + 2(4) = -3 + 8 = 5$ — the product rule for $(uw)'$. The dual-number arithmetic did calculus without being told to.
:::

::: check
GPOPS-II and PSOPT automate the pseudospectral nodes and mesh refinement this module built by hand. Does that make the earlier lessons unnecessary once one of these tools is installed?
:::

::: answer
No. It makes the *labor* of writing node generators and refinement loops unnecessary, not the judgment needed to use the tool well. Choosing trapezoidal, Hermite-Simpson or pseudospectral transcription for a problem; noticing when apparent convergence hides a mesh too coarse to see a switch; understanding why a refinement loop is not settling; telling a scaling failure from a real structural one — the tool's output has to be read through all of these, and it makes none of those calls for you. That is the point of the warning above, and the reason to build these methods by hand once before handing them to software that does it faster.
:::

::: check
Why would ACADO's code-generation approach be a poor fit for the hp-adaptive mesh refinement that GPOPS-II specializes in, even though both are optimal-control software?
:::

::: answer
Code generation for a real-time embedded solver needs a *fixed* problem structure, known in advance: a fixed number of states, controls and mesh points. That is what gives the generated code a bounded, predictable running time and memory use, which is what a flight computer and its certification need. hp-adaptive refinement, by design, changes the number and placement of mesh points from one solve to the next, wherever the error estimate asks for resolution. A structure that changes at run time is exactly what fixed, pre-generated code cannot handle. So the two tools sit at opposite ends of the field: one for the best possible offline answer, one for a bounded, repeatable answer fast enough to fly with.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Central difference | $g'(x) \approx [g(x+\delta)-g(x-\delta)]/(2\delta)$; truncation about $\delta^2\lvert g'''\rvert/6$, round-off about $10^{-16}\lvert g\rvert/\delta$ |
| Finite-difference floor | Error bottoms out (here near $\delta = 10^{-6}$, error $2.6\times10^{-9}$) and worsens on both sides |
| Dual numbers | $a + b\varepsilon$, $\varepsilon^2 = 0$; the $\varepsilon$ part carries the exact slope; seed the input with $b = 1$ |
| Verified example | AD slope $26.05004878112112$ matches the hand formula in all sixteen digits |
| Forward vs reverse mode | Forward: one run per input. Reverse: one backward sweep per output, the shape of an NLP's scalar cost |
| CasADi + IPOPT | Symbolic AD, automatic sparsity detection, sparse interior-point solve |
| GPOPS-II / PSOPT | hp-adaptive pseudospectral meshing, automated |
| Dymos / OpenMDAO | Trajectory coupled to a larger multidisciplinary design problem |
| Pyomo | General algebraic modeling language, not aerospace-specific |
| ACADO | Real-time embedded code generation for a fixed problem structure |
| trajax | JAX-based, GPU-capable; iLQR/DDP and learned-dynamics work |
| What tools do not replace | Scaling judgment, mesh interpretation, deciding whether "converged" means "correct" |

The last lesson of the module puts every diagnostic built so far to work at once: a catalog of the ways a trajectory optimization fails — some loudly, some while looking perfectly fine — and the checks that catch each one before it reaches a vehicle.

::: context round-off Where the sixteen digits go
A computer's "double precision" number keeps about 16 significant digits. Subtracting two numbers that agree in their first 12 digits leaves only about 4 trustworthy ones — the rest were never stored. This is called **catastrophic cancellation**. It is why the finite difference in the table goes wrong at small steps: $g(1.7 + 10^{-12})$ and $g(1.7 - 10^{-12})$ agree in their first dozen or so digits, so their difference is mostly the rounding in the last few. Lesson 14's complex-step trick dodges this by never subtracting at all.
:::

::: context v-curve The two errors, drawn
The error of the central difference from the table, on a log scale: each step right makes $\delta$ a hundred times smaller, and each gridline down is a hundred times less error. Truncation error falls to the left of the floor; round-off error rises to the right of it. The lowest point sits near $\delta = 10^{-6}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="14" x2="50" y2="152" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="152" x2="350" y2="152" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.5" stroke-dasharray="3 3">
    <line x1="50" y1="20" x2="350" y2="20"/><line x1="50" y1="52" x2="350" y2="52"/>
    <line x1="50" y1="84" x2="350" y2="84"/><line x1="50" y1="116" x2="350" y2="116"/>
    <line x1="50" y1="148" x2="350" y2="148"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="24">10⁻²</text><text x="45" y="56">10⁻⁴</text><text x="45" y="88">10⁻⁶</text>
    <text x="45" y="120">10⁻⁸</text><text x="45" y="152">10⁻¹⁰</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="167">10⁻²</text><text x="116" y="167">10⁻⁴</text><text x="172" y="167">10⁻⁶</text>
    <text x="228" y="167">10⁻⁸</text><text x="284" y="167">10⁻¹⁰</text><text x="340" y="167">10⁻¹²</text>
  </g>
  <text x="200" y="182" font-size="11" fill="#1f2a44" text-anchor="middle">step size δ (smaller to the right)</text>
  <polyline points="60,40.5 116,104.5 172,125.4 228,101.1 284,67.3 340,28.6" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="60" cy="40.5" r="3.5"/><circle cx="116" cy="104.5" r="3.5"/><circle cx="172" cy="125.4" r="3.5"/>
    <circle cx="228" cy="101.1" r="3.5"/><circle cx="284" cy="67.3" r="3.5"/><circle cx="340" cy="28.6" r="3.5"/>
  </g>
  <text x="92" y="36" font-size="11" fill="#b4232c">truncation</text>
  <text x="250" y="44" font-size="11" fill="#b4232c">round-off</text>
  <text x="172" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">floor</text>
</svg>
```
:::

::: context dual-numbers An idea from 1873
The English mathematician William Kingdon Clifford introduced dual numbers in 1873, while studying the geometry of motion — long before anyone had a computer to differentiate with. They are a cousin of complex numbers: complex numbers add a symbol $i$ with $i^2 = -1$; dual numbers add $\varepsilon$ with $\varepsilon^2 = 0$. Robotics engineers still use "dual quaternions" built from them to describe a rigid body's rotation and position in one object.
:::

::: context chain-rule The chain rule, one link at a time
The chain rule says: if $y$ depends on $u$ and $u$ depends on $x$, then the slope of $y$ with respect to $x$ is the product of the two slopes, $\frac{dy}{dx} = \frac{dy}{du}\,\frac{du}{dx}$. In $\sin(a + b\varepsilon)$, the outer slope is $\cos a$ and the inner slope, carried in from earlier, is $b$. Their product, $b\cos a$, is the new slope. AD applies this rule once per operation, thousands of times, and never gets bored or drops a sign.
:::

::: context mars-graph The descent dynamics as a graph
AD sees a program as a graph of small operations. Here the thrust is seeded with slope $1$, and each box carries a value and its slope. Dividing by $m$ passes the slope on as $1/m$; subtracting $g$ leaves it alone; dividing by $c$ and flipping the sign gives $-1/c$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="80" width="84" height="40" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="50" y="97" font-size="12" fill="#1f2a44" text-anchor="middle">T = 6000</text>
  <text x="50" y="112" font-size="11" fill="#b4232c" text-anchor="middle">+ 1 ε</text>
  <rect x="128" y="20" width="96" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="176" y="37" font-size="12" fill="#1f2a44" text-anchor="middle">T / m = 6.3158</text>
  <text x="176" y="52" font-size="11" fill="#b4232c" text-anchor="middle">+ 0.0010526 ε</text>
  <rect x="252" y="20" width="100" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="37" font-size="12" fill="#1f2a44" text-anchor="middle">v̇ = 2.6058</text>
  <text x="302" y="52" font-size="11" fill="#b4232c" text-anchor="middle">+ 0.0010526 ε</text>
  <rect x="128" y="140" width="96" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="176" y="157" font-size="12" fill="#1f2a44" text-anchor="middle">T / c = 2.7192</text>
  <text x="176" y="172" font-size="11" fill="#b4232c" text-anchor="middle">+ 0.00045321 ε</text>
  <rect x="252" y="140" width="100" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="157" font-size="12" fill="#1f2a44" text-anchor="middle">ṁ = −2.7192</text>
  <text x="302" y="172" font-size="11" fill="#b4232c" text-anchor="middle">− 0.00045321 ε</text>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <line x1="92" y1="92" x2="126" y2="46"/><line x1="92" y1="108" x2="126" y2="154"/>
    <line x1="224" y1="40" x2="250" y2="40"/><line x1="224" y1="160" x2="250" y2="160"/>
  </g>
  <text x="176" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">÷ m = 950</text>
  <text x="176" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">÷ c = 2206.5</text>
  <text x="302" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">− g</text>
  <text x="302" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">flip sign</text>
</svg>
```
:::

::: context backprop The same trick that trains neural networks
A neural network has millions of adjustable weights and one number to minimize, its error. Training needs the slope of that one number with respect to every weight, every step. Reverse-mode AD, which the machine-learning world calls **backpropagation**, delivers all of them in one backward sweep. The tools built for that job — JAX, PyTorch — are the same kind of machinery a trajectory NLP needs for its scalar cost, which is why trajax could be built on top of one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <circle cx="40" cy="25" r="12"/><circle cx="40" cy="55" r="12"/><circle cx="40" cy="85" r="12"/><circle cx="40" cy="115" r="12"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="29">z₁</text><text x="40" y="59">z₂</text><text x="40" y="89">z₃</text><text x="40" y="119">z₄</text>
  </g>
  <rect x="130" y="45" width="100" height="50" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">program</text>
  <circle cx="310" cy="70" r="14" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="310" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">J</text>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="52" y1="25" x2="130" y2="55"/><line x1="52" y1="55" x2="130" y2="65"/>
    <line x1="52" y1="85" x2="130" y2="75"/><line x1="52" y1="115" x2="130" y2="85"/>
    <line x1="230" y1="70" x2="296" y2="70"/>
  </g>
  <path d="M 300 92 Q 180 150 60 128" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="56,127 66,122 65,133" fill="#b4232c"/>
  <text x="180" y="20" font-size="11" fill="#1d6fd1" text-anchor="middle">forward mode: one run per input</text>
  <text x="200" y="146" font-size="11" fill="#b4232c" text-anchor="middle">reverse mode: one sweep back gives every slope</text>
</svg>
```
:::

::: context casadi-name What the name means
CasADi was created at KU Leuven in Belgium by Joel Andersson and Joris Gillis, in Moritz Diehl's optimization group. The name comes from "computer algebra system with automatic differentiation". It is free and open source, and it has become a common first choice for posing trajectory and model-predictive-control problems in research and industry. The module's CasADi documentation link is the fastest way from equations of motion to a solved trajectory.
:::

::: context ipopt-name Interior Point OPTimizer
IPOPT stands for "Interior Point OPTimizer". Andreas Wächter and Lorenz Biegler at Carnegie Mellon described its algorithm in a 2006 paper, and it is maintained as free software by the COIN-OR project. It keeps its variables strictly inside their bounds with a barrier term, which it weakens step by step as the solve goes on, and it uses a sparse linear solver for the KKT system of lesson 13. Its log and its "restoration phase" come back in the next lesson.
:::

::: context openmdao Designing everything at once
OpenMDAO is NASA Glenn Research Center's open-source framework for multidisciplinary design, analysis and optimization (MDAO). The idea: a vehicle's aerodynamics, structure, propulsion and trajectory all affect each other, so optimizing them one at a time leaves performance on the table. Dymos adds trajectory phases to that framework, so a mission profile can be optimized together with, say, the size of the engine flying it.
:::

::: context embedded Running on the flight computer
"Embedded" software runs on a small computer built into the vehicle, not on a desktop. Flight computers have limited memory and speed, and a guidance update that arrives late is as bad as a wrong one. So embedded solvers avoid anything whose running time is hard to predict — like memory allocated on the fly or a mesh that grows. Next module's convex guidance is built around the same need.
:::

::: context jax Google's array library with gradients
JAX is a Python library from Google that looks like NumPy but can differentiate any function you write with it, in forward or reverse mode, and compile it to run on GPUs. trajax, also from Google Research, builds iLQR and related trajectory optimizers on top of it, so the derivatives of a whole simulated rollout come for free.
:::
