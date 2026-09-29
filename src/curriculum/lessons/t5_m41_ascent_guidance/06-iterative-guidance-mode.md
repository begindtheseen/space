---
id: l06-iterative-guidance-mode
title: Iterative Guidance Mode, Saturn V's explicit guidance
minutes: 23
covers:
  - Iterative Guidance Mode as flown on Saturn V
---

Think about working out a 15% tip at a restaurant. You do not do long division at the table. You know a shortcut: move the decimal point one place to get 10%, then add half of that again. On a \$42 bill that is \$4.20 plus \$2.10, so \$6.30. Somebody did the real arithmetic once, long ago, and boiled it down to a trick fast enough to do in your head. And you do the trick fresh for every bill — you never reuse last night's tip.

That is the whole idea of this lesson. In the 1960s the Saturn V had to steer itself to orbit, and then out toward the Moon, with a flight computer far too slow for the shooting method of lessons 3 and 4. So its engineers did the hard mathematics on paper, before launch, and boiled it down to a few lines of algebra. The computer ran those lines fresh from the rocket's measured state every couple of seconds. That scheme is **Iterative Guidance Mode**, or **IGM** — the Saturn V's guidance above the atmosphere. It rests on the same linear tangent law you derived in lesson 3, and it was the first **explicit guidance** — steering computed straight from the present state and the target, with no stored trajectory — ever to fly. Powered Explicit Guidance, from lesson 4, is its descendant.

This lesson shows which shortcuts IGM used, where they are exact, where they are only close, and why the word "iterative" does not mean what it seems to.

## A guidance computer slower than a pocket calculator

IGM steered the Saturn V's upper stages. The first stage, the [[S-IC|saturn-stack]], flew a stored pitch program through the thick air, exactly like the open-loop steering of lesson 2. Once the second stage, the S-II, was burning and the air was thin, IGM took over. It then steered the third stage, the **S-IVB**, into a parking orbit, and later steered that same stage's second burn, the one that sent Apollo crews toward the Moon. The smaller Saturn IB used IGM for its S-IVB upper stage too.

The computer doing this was the **[[Launch Vehicle Digital Computer|lvdc]]**, in a ring called the Instrument Unit that sat on top of the S-IVB. It could manage roughly ten thousand additions a second. A modern phone chip does billions.

Now recall what the shooting method of lesson 3 needs. Guess $(A, B)$. Integrate the equations of motion across the whole remaining burn, thousands of small steps. Compare with the target. Correct with Newton's method. Repeat until the answer settles. That is a whole loop of numerical integrations *inside* each guidance cycle — hopeless on the LVDC.

IGM's way out was to find **[[closed-form|closed-form]]** expressions for everything the steering solve needs. A closed form is a formula you can evaluate with a fixed, short list of arithmetic steps: no step-by-step integration, and no loop that repeats until an answer settles.

## Doing the calculus before launch

Which integrals can be done once, by hand, and never again? The thrust acceleration has a clean enough form to allow it.

Hold the thrust constant and let the engine burn at a steady **mass flow rate** $\dot m$ ("m dot", kilograms per second). The mass falls in a straight line, $m(t) = m_0 - \dot m\,t$. The thrust is $T = \dot m\, v_e$, with $v_e$ ("v sub e") the exhaust velocity. So the **thrust acceleration** — the push per kilogram — is

$$
a(t) = \frac{T}{m(t)} = \frac{v_e\,\dot m}{m_0 - \dot m\,t}.
$$

Two integrals of this function matter. The first is the total speed the burn can add, if all of it points one way. It is the rocket equation, which you already know:

$$
L \equiv \int_0^{t_f} a(t)\, dt = v_e \ln\!\frac{m_0}{m_f}.
$$

Read $L$ as "the burn's velocity capability". The symbol $\equiv$ means "is defined as", $t_f$ is the burn time, and $m_f = m_0 - \dot m\,t_f$ is the mass at cutoff.

The second weights each moment of the push by the time it happens:

$$
J \equiv \int_0^{t_f} a(t)\, t\, dt = \frac{v_e}{\dot m}\left[m_0\ln\!\frac{m_0}{m_f} - (m_0 - m_f)\right].
$$

This is the **[[first moment|first-moment]]** of the acceleration in time — "moment" in the seesaw sense, where weight times distance from the pivot is what counts. $J$ has units of meters, since it is meters per second times seconds.

Here is a friendly way to see what $J$ says. Divide it by $L$:

$$
\bar t = \frac{J}{L}.
$$

This $\bar t$ ("t bar") is the **thrust-weighted average time** of the burn: the balance point of the push along the time axis. The push grows as the stage gets lighter, so the balance point sits later than the middle of the burn. Keep $\bar t$ in mind. It is the reason $J$ is useful.

Both formulas are pure algebra once $m_0$, $m_f$, $\dot m$ and $v_e$ are known. The integration was done once, on paper, before anyone wrote the flight code.

::: note Why it has to be true
**For $L$.** Substitute $u = m_0 - \dot m\,t$, the mass. Then $du = -\dot m\,dt$, and $u$ runs from $m_0$ down to $m_f$:

$$
L = \int_{m_0}^{m_f} \frac{v_e\,\dot m}{u}\cdot\frac{-du}{\dot m} = v_e\int_{m_f}^{m_0}\frac{du}{u} = v_e\ln\frac{m_0}{m_f}.
$$

The minus sign flipped the limits, and the $\dot m$'s canceled.

**For $J$.** Use the same substitution. Now we also need $t$ in terms of $u$: from $u = m_0 - \dot m\,t$, we get $t = (m_0 - u)/\dot m$. So

$$
J = \int_{m_f}^{m_0} \frac{v_e\,\dot m}{u}\cdot\frac{m_0 - u}{\dot m}\cdot\frac{du}{\dot m}
= \frac{v_e}{\dot m}\int_{m_f}^{m_0}\left(\frac{m_0}{u} - 1\right)du
= \frac{v_e}{\dot m}\left[m_0\ln\frac{m_0}{m_f} - (m_0 - m_f)\right].
$$

The fraction $(m_0 - u)/u$ splits into $m_0/u$ minus $1$. The first piece integrates to a logarithm, and the second to the change in mass.
:::

::: example Checking L and J against brute force
Take a light upper stage of $20{,}000\ \mathrm{kg}$ carrying this module's stage-2 engine: $\dot m = 273.6825\ \mathrm{kg/s}$ and $v_e = 3412.71\ \mathrm{m/s}$, so the thrust is about $934\ \mathrm{kN}$. It burns for $t_f = 37.429\ \mathrm{s}$.

**Mass at cutoff.** $m_f = 20{,}000 - 273.6825 \times 37.429 = 20{,}000 - 10{,}243.66 = 9756.34\ \mathrm{kg}$. The stage burns just over half its mass.

**Velocity capability.** The mass ratio is $20{,}000/9756.34 = 2.0499$, and its natural log is $0.71781$. So

$$
L = 3412.71 \times 0.71781 = 2449.695\ \mathrm{m/s}.
$$

**First moment.** The bracket is $20{,}000 \times 0.71781 - 10{,}243.66 = 14{,}356.19 - 10{,}243.66 = 4112.53\ \mathrm{kg}$. The factor in front is $3412.71/273.6825 = 12.4696\ \mathrm{m/s}$ per kg/s, which is seconds times m/s. So

$$
J = 12.4696 \times 4112.53 = 51{,}282.972\ \mathrm{m}.
$$

**Balance point.** $\bar t = J/L = 51{,}282.972/2449.695 = 20.93\ \mathrm{s}$. The middle of the burn is $37.429/2 = 18.71\ \mathrm{s}$. The balance point is about two seconds later, as it should be, because the push is heavier near the end.

**Brute force.** Adding up $a(t)$ and $a(t)\,t$ numerically over 200,000 tiny time steps gives the same $L$ and $J$ to better than a millionth of a unit. The closed forms are not approximations. They are exact for constant thrust and constant $\dot m$.
:::

::: key
Two closed-form thrust-acceleration integrals feed IGM's algebra: $L = v_e\ln(m_0/m_f)$ (total velocity capability) and $J = (v_e/\dot m)\left[m_0\ln(m_0/m_f) - (m_0-m_f)\right]$ (its first moment in time) — both ordinary algebra from $m_0$, $m_f$, $\dot m$, $v_e$, with no numerical integration required in flight.
:::

::: warning The closed forms assume full, constant thrust
$L$ and $J$ as written hold only while thrust and flow are constant — phase one of lesson 5's two-phase structure. This example stage starts at about $4.8$ g and would end near $9.8$ g, far past any real g-limit. A real stage throttles in phase two, and there the acceleration is constant, so the integrals change form (they get simpler: $L = a_{\lim} t$ and $J = a_{\lim} t^2/2$). Flight code must use the pair that matches the phase it is in, for the same reason time-to-go must in lesson 5.
:::

## One angle, solved exactly

Start with the simplest steering: hold the pitch angle $\beta$ ("beta", the thrust direction above the local horizontal) fixed for the whole burn. Use the flat model of lesson 3: $x$ along the direction of flight, $z$ straight up, gravity $g$ straight down.

A constant $\cos\beta$ and $\sin\beta$ are plain numbers, so they come straight out of the integrals. Everything left is $L$:

$$
v_x(t_f) = v_{x0} + L\cos\beta, \qquad v_z(t_f) = v_{z0} + L\sin\beta - g\,t_f.
$$

Here $v_{x0}$ and $v_{z0}$ are the velocity components at ignition. These equations are exact within the flat model. Want a particular final $v_x$? Rearrange for $\cos\beta$ and undo the cosine. No shooting, no loop.

::: example A constant pitch aimed at a transfer orbit
Put the stage above in a $300\ \mathrm{km}$ circular [[parking orbit|gto]], moving sideways at $v_{x0} = 7725.76\ \mathrm{m/s}$ with no vertical speed, $v_{z0} = 0$. The goal is the speed at the low point of a **geostationary transfer orbit** — an ellipse reaching up to the height of geostationary satellites — which is $v_x(t_f) = 10{,}151.49\ \mathrm{m/s}$. This high-energy kind of burn is what IGM-family guidance was built for. Gravity at $300\ \mathrm{km}$ is $g = 8.94\ \mathrm{m/s^2}$.

**Solve for the angle.** Rearrange $v_x(t_f) = v_{x0} + L\cos\beta$:

$$
\cos\beta = \frac{v_x(t_f) - v_{x0}}{L} = \frac{10{,}151.49 - 7725.76}{2449.695} = \frac{2425.73}{2449.695} = 0.990218.
$$

The inverse cosine gives $\beta = 8.021^\circ$. That is pure algebra.

**Fly it.** Holding $8.021^\circ$ for the full $37.429\ \mathrm{s}$ gives $v_x(t_f) = 10{,}151.49\ \mathrm{m/s}$, right on target.

**The other component.** $v_z(t_f) = 0 + 2449.695 \times \sin 8.021^\circ - 8.94 \times 37.429 = 341.82 - 334.53 = 7.29\ \mathrm{m/s}$.

**Sanity check.** A clean injection at the low point of the ellipse wants zero vertical speed. We got $7.29\ \mathrm{m/s}$ — small, but not zero, because we only aimed for one of the two velocity components. One adjustable number can meet one condition. That is lesson 3's counting argument again.
:::

::: note A caution about flat gravity in orbit
This flat model lets gravity pull the vertical speed down at the full $8.94\ \mathrm{m/s^2}$. A rocket already moving at orbital speed is really [[falling around the Earth|falling-around]]: the ground curves away as fast as it falls, so its vertical speed hardly changes. Real IGM, like real PEG, adds a term for that. The arithmetic here keeps lesson 3's flat model so each step stays visible, but the $7.29\ \mathrm{m/s}$ is a flat-model number, not a prediction of a real flight.
:::

## Two targets: bend the angle a little

To reach *both* velocity components — and the altitude — guidance needs lesson 3's second steering parameter. The best steering is $\tan\beta(t) = A + Bt$. So why not put that into the integrals and solve for $A$ and $B$ by algebra?

Look at what the integrals become. Since $\cos\beta = 1/\sqrt{1 + (A+Bt)^2}$, the horizontal one is

$$
\int_0^{t_f} a(t)\cos\beta(t)\,dt = \int_0^{t_f} \frac{v_e\,\dot m}{(m_0 - \dot m\,t)\sqrt{1 + (A + Bt)^2}}\,dt .
$$

A patient mathematician can integrate this by hand. The answer is a long chain of logarithms and square roots. The trouble is where $A$ and $B$ end up: tangled inside those logarithms and roots. Setting the results equal to the target speeds gives two **nonlinear equations** — equations where the unknowns are not only multiplied by numbers and added — and in general no algebra untangles them. You are back to guessing and correcting with Newton's method: the in-flight loop IGM was designed to avoid.

IGM's answer, and PEG's after it, is to **[[linearize|linearize]]**: replace a curve by its straight tangent line near one point, where the two are almost the same. Pick a **reference angle** $\tilde\beta$ ("beta tilde"), and write the steering as that angle plus a small correction that changes at a steady rate:

$$
\beta(t) = \tilde\beta + \delta(t), \qquad \delta(t) = c_0 + c_1 t .
$$

The two unknowns $c_0$ and $c_1$ (read "c nought" and "c one") play the part of $A$ and $B$. Over the short stretch that one guidance cycle trusts, $\arctan(A+Bt)$ is very nearly a straight line in angle, so this form loses little.

Here $\delta$ ("delta") is the correction, measured in radians. For a small angle, $\cos\delta$ is almost exactly $1$ and $\sin\delta$ is almost exactly $\delta$. Put those into the angle-sum formulas for cosine and sine, and you get the first-order rules: $\cos(\tilde\beta + \delta) \approx \cos\tilde\beta - \delta\sin\tilde\beta$ and $\sin(\tilde\beta + \delta) \approx \sin\tilde\beta + \delta\cos\tilde\beta$. Put these into the velocity integrals. The constant parts give $L$, as before. The correction gives

$$
\int_0^{t_f} a(t)\,\delta(t)\,dt = c_0\int_0^{t_f} a\,dt + c_1\int_0^{t_f} a\,t\,dt = c_0 L + c_1 J .
$$

That is the job $J$ was made for. So, to first order,

$$
v_x(t_f) \approx v_{x0} + L\cos\tilde\beta - (c_0 L + c_1 J)\sin\tilde\beta, \qquad
v_z(t_f) \approx v_{z0} + L\sin\tilde\beta + (c_0 L + c_1 J)\cos\tilde\beta - g\,t_f .
$$

Look at where the unknowns sit now: $c_0$ and $c_1$ appear only multiplied by known numbers and added. A system like that is a **linear system**, and a few multiplications and divisions solve it outright, with no loop. The altitude condition works the same way, using a few more hand-integrated quantities built from $L$ and $J$. The reference angle is picked from the velocity still to be gained, gravity's pull included, so the correction $\delta$ stays small and the tangent-line swap stays accurate.

There is a neat consequence. Choose the correction to cross zero at the balance point, $\delta(t) = c_1(t - \bar t)$, so $c_0 = -c_1\bar t$. Then $c_0 L + c_1 J = c_1(J - \bar t L) = 0$, because $\bar t = J/L$. To first order, *that* kind of tilt leaves the final velocity alone. It is a separate knob that reshapes the path, and so the altitude, without spending velocity.

::: example A tilt the velocity barely notices
Go back to the constant $8.021^\circ$ burn. Now add a steady pitch-down of $0.2^\circ$ per second, centered on the balance point $\bar t = 20.93\ \mathrm{s}$: $\delta(t) = -0.2^\circ/\mathrm{s} \times (t - 20.93\ \mathrm{s})$.

**The pitch history.** At ignition, $\delta = -0.2 \times (0 - 20.93) = +4.19^\circ$, so $\beta = 12.21^\circ$. At cutoff, $\delta = -0.2 \times (37.429 - 20.93) = -3.30^\circ$, so $\beta = 4.72^\circ$. The rocket starts nose-higher and ends nose-lower.

**First-order prediction.** $c_0 L + c_1 J = 0$, so the velocity at cutoff should not change.

**What the exact flight gives.** Integrating the flat-model equations with this $\beta(t)$: $v_x(t_f) = 10{,}149.78\ \mathrm{m/s}$, only $1.71\ \mathrm{m/s}$ below the constant-angle run. $v_z(t_f) = 7.04\ \mathrm{m/s}$, only $0.25\ \mathrm{m/s}$ lower.

**What did change.** The altitude at cutoff. With constant pitch the stage ends $622\ \mathrm{m}$ below where it started (flat-model gravity again). With the tilt it ends $353\ \mathrm{m}$ above. That is a shift of $975\ \mathrm{m}$.

**Sanity check.** A tilt of a few degrees moved the altitude by nearly a kilometer, yet cost under $2\ \mathrm{m/s}$ of speed. That $1.71\ \mathrm{m/s}$ is the second-order piece the tangent-line swap threw away — the price of a few degrees off the reference, about the size of $L$ times the average of $\delta^2/2$. The next guidance cycle, starting from the true state, picks it up.
:::

::: key
IGM (and the closed-form part of PEG after it): the exact single-angle solution uses $L$ alone; the full two-parameter linear-tangent correction linearizes about a reference angle using $L$ and $J$ together, solving a small linear system algebraically each cycle rather than integrating or iterating numerically in flight.
:::

The linear solve is not exact the way the single-angle case is. It is accurate while the pitch does not swing far from the reference over the rest of the burn. That is lesson 4's idea again: trust a local approximation only briefly. What makes IGM "closed form" is that no cycle ever runs a numerical integrator, or loops to find its answer. Each cycle is a short, fixed list of operations on $L$, $J$ and the measured state — fast enough for the LVDC to fly a Saturn V.

## Iterative means "every cycle", not "solved by iteration"

The name is easy to misread. In mathematics, an "iterative method" usually means one that loops — guess, improve, guess again — until the answer settles. Newton's method is iterative in that sense. IGM is *not*: the whole point of the closed forms is that one pass through the algebra gives the answer.

IGM is iterative in the same sense as lesson 4's PEG cycle. The algebra is re-run from scratch, from the rocket's actual measured state, every guidance cycle, for as long as the burn lasts. The *repetition* — not any loop inside one cycle — is what lets a locally linearized answer fly a whole ascent. Each cycle's small errors, from the tangent-line swap and from flat gravity, are thrown away when the next cycle starts from the true state. And as the remaining burn shortens, the pitch has less room to swing, so the linearization gets better and better toward cutoff.

Fly one cycle's answer open loop for the whole burn and those errors pile up instead. Lesson 4 measured how badly: its first solution, flown open loop, ended $194.8\ \mathrm{km}$ too high. IGM avoids that by never trusting one cycle's answer past the next.

::: key Iterative Guidance Mode
The Saturn V exoatmospheric guidance, the ancestor of PEG. Also based on the linear tangent law, with closed-form terminal constraint solution — the first flown explicit guidance.
:::

::: warning Closed form does not mean simpler
Do not read IGM's short algebra as a sign it is a *simpler* algorithm than PEG. It solves the same boundary-value problem this module has built since lesson 3, under a tighter computing budget, by trading exactness (the linearization) for speed. PEG, on faster hardware, can afford a numerical shooting solve like this module's worked examples and gets a more exact answer each cycle, at the cost of more arithmetic. They are two points on the same accuracy-versus-computation trade, not two different problems.
:::

IGM's design is written up in a 1967 paper by [[Marshall Space Flight Center|igm-history]] engineers Doris Chandler and Isaac Smith, which describes applying it to several vehicles and missions. From 1967 to 1973, it guided every Saturn V's upper stages to Earth orbit, and every Apollo crew's burn toward the Moon.

## Check yourself

::: check
$L = \int a(t)\,dt$ has a one-line closed form. The integral $\int a(t)\cos\beta(t)\,dt$ with $\beta(t) = \arctan(A + Bt)$ can also be worked out by hand. So why can't IGM use it to find $A$ and $B$ directly by algebra?
:::

::: answer
$a(t) = v_e\dot m/(m_0 - \dot m t)$ is a simple fraction in $t$, and its antiderivative is the logarithm that gives $L$. With varying steering, $\cos\beta(t) = 1/\sqrt{1 + (A+Bt)^2}$ multiplies that fraction by one over the square root of a quadratic in $t$. That product *can* be integrated by hand, but the result is a long expression of logarithms and square roots with $A$ and $B$ buried inside them. Setting it (and the matching $\sin\beta$ integral) equal to the targets gives two nonlinear equations in $A$ and $B$ that algebra cannot untangle in general. Solving them needs Newton-style iteration in flight — exactly what IGM avoids. Linearizing $\cos\beta$ and $\sin\beta$ about a reference angle makes the unknowns appear linearly, with $L$ and $J$ as coefficients, so one direct linear solve does the job.
:::

::: check
A stage has $m_0 = 15{,}000\ \mathrm{kg}$, $\dot m = 200\ \mathrm{kg/s}$, $v_e = 3000\ \mathrm{m/s}$, and burns for $20\ \mathrm{s}$. Compute $L$ and $J$.
:::

::: answer
**Mass at cutoff.** $m_f = 15{,}000 - 200 \times 20 = 11{,}000\ \mathrm{kg}$.

**Log of the mass ratio.** $\ln(15{,}000/11{,}000) = 0.310155$.

**Velocity capability.** $L = 3000 \times 0.310155 = 930.46\ \mathrm{m/s}$.

**First moment.** $J = (3000/200)\left[15{,}000 \times 0.310155 - (15{,}000 - 11{,}000)\right] = 15 \times (4652.33 - 4000) = 15 \times 652.33 = 9784.86\ \mathrm{m}$.

**Sanity check.** $\bar t = J/L = 9784.86/930.46 = 10.52\ \mathrm{s}$, a little past the $10\ \mathrm{s}$ midpoint, as it should be for a push that grows as the stage lightens.
:::

::: check
Using $L = 930.46\ \mathrm{m/s}$ from the last question, with $v_{x0} = 7200\ \mathrm{m/s}$ and $v_{z0} = 0$, find the constant pitch angle that reaches $v_x(t_f) = 7950\ \mathrm{m/s}$ exactly. Then find $v_z(t_f)$ if $g = 9.5\ \mathrm{m/s^2}$ over the $20\ \mathrm{s}$ burn. (That $g$ is a little below $g_0$, a reminder that local gravity need not be exactly $9.80665\ \mathrm{m/s^2}$.)
:::

::: answer
**Angle.** $\cos\beta = (7950 - 7200)/930.46 = 750/930.46 = 0.80605$, so $\beta = 36.29^\circ$ and $\sin\beta = 0.59185$.

**Vertical speed.** $v_z(t_f) = v_{z0} + L\sin\beta - g\,t_f = 0 + 930.46 \times 0.59185 - 9.5 \times 20 = 550.70 - 190.0 = 360.70\ \mathrm{m/s}$.

It is far from zero because this single-parameter solve constrained only $v_x$. Nothing controlled $v_z$.
:::

::: check
Why does IGM linearize about a reference angle chosen from the velocity still to be gained, instead of always linearizing about straight up, or straight along the horizon?
:::

::: answer
A tangent-line approximation is only accurate near the point where it touches the curve. The farther the true best angle is from the reference, the larger the neglected second-order terms — like the $1.71\ \mathrm{m/s}$ in the tilt example — become. Choosing the reference from the velocity still to be gained (roughly, the direction the rocket still needs to push) puts the touching point close to where the true answer lies. The correction stays small and the approximation stays good. It is the same spirit as PEG starting each cycle's numerical solve from the previous cycle's answer rather than from an arbitrary guess.
:::

::: check
A learner says IGM must be less accurate than the numerically shot PEG of this module, since it relies on a linearization rather than an exact nonlinear solve. Is a single IGM cycle's steering command a worse answer than a single PEG cycle's?
:::

::: answer
As a one-off answer, yes: a linearized solve is less exact than a fully converged nonlinear one, as any first-order approximation is less exact than the function it stands in for. But neither algorithm trusts a single cycle's answer to fly the rest of the burn. Both re-solve from the true state every cycle. IGM's re-solving wipes out its linearization error the same way PEG's wipes out its flat-gravity error: by never letting either build up past one cycle. The comparison that matters in practice is closed-loop accuracy at cutoff over the whole burn, not how exact one isolated cycle's algebra is.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| IGM | Saturn V guidance above the air (S-II and S-IVB burns, including the burn toward the Moon) | linear tangent law, closed-form solve; first flown explicit guidance; ancestor of PEG |
| $L$ | velocity capability of a constant-thrust burn | $L = \int a\,dt = v_e\ln(m_0/m_f)$ |
| $J$ | first time-moment of thrust acceleration | $J = \int a\,t\,dt = (v_e/\dot m)[m_0\ln(m_0/m_f) - (m_0-m_f)]$ |
| $\bar t$ | thrust-weighted average time | $\bar t = J/L$, later than the burn's midpoint |
| Single angle | constant pitch, exact in the flat model | $v_x(t_f) = v_{x0} + L\cos\beta$, $v_z(t_f) = v_{z0} + L\sin\beta - g t_f$ |
| Two parameters | nonlinear in $A, B$ if done exactly | linearize about $\tilde\beta$: $\int a\,\delta\,dt = c_0 L + c_1 J$, a linear system |
| Worked numbers | 37.429 s burn | $L = 2449.695$ m/s, $J = 51{,}282.972$ m, $\bar t = 20.93$ s; $\beta = 8.021^\circ$ |
| Tilt about $\bar t$ | reshapes altitude, leaves velocity alone to first order | $-0.2^\circ$/s: altitude $+975$ m, $v_x$ only $-1.71$ m/s |
| "Iterative" | re-run every cycle from the true state | not a loop inside one cycle |
| IGM vs PEG | same boundary-value problem | IGM trades exactness for closed-form speed; PEG affords a more exact numerical solve |

The next lesson steps back from *how* the steering is computed to what it is computed *toward*: exactly which numbers a target orbit hands to guidance, and why one of them is deliberately left free.

::: context saturn-stack Three stages, two kinds of guidance
The Saturn V stacked three stages under the Apollo spacecraft. The S-IC first stage (42 m long) burned through the thick air on a stored pitch program. The S-II (about 25 m) and the S-IVB (about 18 m) flew under IGM. The thin ring on top of the S-IVB was the Instrument Unit, home of the guidance computer. The drawing is to scale in length.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="42" width="147" height="36" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="155" y="42" width="87" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="242" y="48" width="62" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="304" y="48" width="5" height="24" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="309,48 309,72 332,66 352,60 332,54" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="81" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">S-IC</text>
  <text x="198" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">S-II</text>
  <text x="273" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">S-IVB</text>
  <text x="81" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">stored pitch program</text>
  <line x1="155" y1="92" x2="304" y2="92" stroke="#1d6fd1" stroke-width="2"/>
  <text x="230" y="108" font-size="11" text-anchor="middle" fill="#1d6fd1">Iterative Guidance Mode</text>
  <line x1="306" y1="44" x2="306" y2="24" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="20" font-size="11" text-anchor="end" fill="#b4232c">Instrument Unit</text>
  <text x="340" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">Apollo</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">engines at left, nose at right</text>
</svg>
```
:::

::: context lvdc The Saturn V's brain
IBM built the Launch Vehicle Digital Computer. It lived in the Instrument Unit, a ring about 6.6 m across and under a meter tall, together with the gyroscope platform that measured the rocket's motion. Everything the rocket did on its own — reading the platform, running IGM, commanding the engines to swivel, timing each stage — ran on this one machine. It checked its own work, too: key circuits were built three times over, and a majority vote decided each result, so one failed part could not steer the rocket wrong.
:::

::: context closed-form What "closed form" means
A **closed-form** answer is a formula you can evaluate with a fixed number of ordinary steps — add, multiply, take a logarithm or a square root. The rocket equation is one. Its opposite is an answer you can only reach by a procedure that repeats until it is good enough, like Newton's method or adding up thousands of small time steps. For flight software, the difference is about predictability: a closed form always takes the same time to compute, so it always finishes before the next guidance cycle is due.
:::

::: context first-moment The balance point of the push
Lay the burn along a seesaw, time running left to right, with the push at each instant as weight. $L$ is the total weight. $J$ is the total of weight times distance from the left end. $J/L$ is where the seesaw balances. For the worked stage the push grows from $46.7$ to $95.7\ \mathrm{m/s^2}$, so the balance point ($20.93\ \mathrm{s}$) sits right of the middle ($18.71\ \mathrm{s}$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="50,150 50,89 78,86 106,82 134,78 162,74 190,68 218,62 246,55 274,47 302,37 330,26 330,150" fill="#8fb8f0" stroke="none"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,89 78,86 106,82 134,78 162,74 190,68 218,62 246,55 274,47 302,37 330,26"/>
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190" y1="150" x2="190" y2="68" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="207" y1="150" x2="207" y2="65" stroke="#b4232c" stroke-width="2"/>
  <polygon points="207,152 200,166 214,166" fill="#b4232c"/>
  <text x="186" y="176" font-size="11" text-anchor="end" fill="#6c7a93">middle 18.7 s</text>
  <text x="220" y="176" font-size="11" fill="#b4232c">balance 20.9 s</text>
  <text x="46" y="89" font-size="11" text-anchor="end" fill="#1f2a44">47</text>
  <text x="46" y="30" font-size="11" text-anchor="end" fill="#1f2a44">96</text>
  <text x="58" y="20" font-size="11" fill="#1f2a44">a (m/s²)</text>
  <text x="330" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">37.4 s</text>
</svg>
```
:::

::: context gto Parking orbit to transfer orbit
A satellite bound for geostationary orbit, about 35,800 km up, is usually first put into a low **parking orbit**, a waiting circle. A burn at the right moment then stretches the circle into a long ellipse, the **geostationary transfer orbit**, whose low point stays near the burn and whose high point reaches geostationary height. From a 300 km circle, that burn raises the speed from 7725.76 to 10,151.49 m/s. The satellite later circularizes at the top with its own engine.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <ellipse cx="162" cy="105" rx="142" ry="97" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="59" cy="105" r="37" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="59" cy="105" r="41" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="20" cy="105" r="5" fill="#b4232c"/>
  <text x="59" y="109" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="28" y="160" font-size="11" fill="#6c7a93">parking orbit</text>
  <text x="14" y="90" font-size="11" fill="#b4232c">burn</text>
  <circle cx="304" cy="105" r="3" fill="#1f2a44"/>
  <text x="298" y="95" font-size="11" text-anchor="end" fill="#1f2a44">high point:</text>
  <text x="298" y="125" font-size="11" text-anchor="end" fill="#1f2a44">GEO height</text>
  <text x="200" y="30" font-size="11" fill="#1d6fd1">transfer orbit</text>
</svg>
```
:::

::: context falling-around Why orbital speed cancels gravity
Throw a ball sideways and it curves down to the ground. Throw it faster and it lands farther away. At about 7.7 km/s, near Earth, the ground curves away beneath it exactly as fast as it falls, so it never lands: that is an orbit. Gravity is still pulling — at 300 km, with $8.94\ \mathrm{m/s^2}$ — but all of it goes into bending the path around the Earth, none into changing the height. Real guidance adds this "falling around" term, $v_x^2/r$, to the flat model, which is why the flat-model vertical speeds in this lesson are only bookkeeping.
:::

::: context linearize Swapping a curve for its tangent line
Near any point, a smooth curve looks almost straight — like the Earth looks flat from a parking lot. Linearizing means using that straight tangent line instead of the curve. It is excellent close to the touching point and gets worse farther away. Below is $\cos\beta$ (blue) and its tangent line at a reference angle of $30^\circ$ (red).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="73" y1="160" x2="73" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,35 73,33 107,35 140,40 173,50 207,63 240,78 273,96 307,116 340,138"/>
  <line x1="73" y1="16" x2="273" y2="83" stroke="#b4232c" stroke-width="2"/>
  <circle cx="173" cy="50" r="4" fill="#1f2a44"/>
  <text x="178" y="42" font-size="11" fill="#1f2a44">reference 30°</text>
  <text x="68" y="36" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="73" y="174" font-size="11" text-anchor="middle" fill="#1f2a44">0°</text>
  <text x="273" y="174" font-size="11" text-anchor="middle" fill="#1f2a44">60°</text>
  <text x="300" y="130" font-size="11" text-anchor="end" fill="#1d6fd1">cos β</text>
  <text x="280" y="76" font-size="11" fill="#b4232c">tangent line</text>
</svg>
```

Within about $10^\circ$ of the reference the two are hard to tell apart; by $30^\circ$ away they have clearly split.
:::

::: context igm-history From Saturn to the Shuttle and beyond
Marshall Space Flight Center in Huntsville, Alabama, was NASA's rocket center, and it developed the Saturn family. Its guidance engineers built IGM for the Saturn vehicles in the 1960s, and it flew operationally on the Saturn IB and Saturn V. When the Space Shuttle was designed in the 1970s, its ascent guidance (lesson 4's PEG and UPFG) kept IGM's core ideas — a linear-tangent-style law, closed-form pieces, and a fresh solve every cycle from the measured state — and added the bookkeeping for more phases and targets.
:::
