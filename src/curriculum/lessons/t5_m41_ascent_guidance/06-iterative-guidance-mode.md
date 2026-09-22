---
id: l06-iterative-guidance-mode
title: Iterative Guidance Mode, Saturn V's explicit guidance
minutes: 13
covers:
  - Iterative Guidance Mode as flown on Saturn V
---

Powered Explicit Guidance did not appear first. A decade before it flew, the Saturn IB and Saturn V launch vehicles' upper stage — the S-IVB — flew to Earth orbit, and later out toward the Moon, under **Iterative Guidance Mode**, IGM: the same linear tangent steering law this module already derived, computed from the vehicle's actual state and re-issued every guidance cycle, running on a flight computer with a small fraction of the arithmetic throughput a modern implementation takes for granted. It is the first flown explicit guidance, developed at NASA's Marshall Space Flight Center — Helmut Horn's team embedded a version of the same bilinear tangent steering law this module derives from Pontryagin's conditions into the onboard flight equations around 1960–61 — and understanding what it had to do differently from the numerical shooting method of the last two lessons — because a 1960s flight computer could not afford an iterative numerical solver running in real time — is what earns the name "iterative" its actual meaning.

## What a real-time solve can and cannot afford

The shooting method in this module's derivation of the linear tangent law finds $(A,B)$ by numerically integrating trial trajectories and correcting with Newton's method — entirely reasonable on modern hardware, and exactly what the worked PEG examples in this module actually do. It is not reasonable for a computer built to run a whole vehicle's guidance, navigation and control on a cycle time measured in seconds, with no numerical integration library and extremely limited memory. IGM's contribution was to find **closed-form expressions** — ordinary algebra, no numerical integration, no inner iteration loop — for the quantities the steering solve needs, built from exact integrals of the one function that does have a clean closed form: the thrust acceleration itself.

## Two closed-form integrals

With constant thrust and constant mass-flow rate $\dot m$, thrust acceleration is $a(t) = v_e \dot m/(m_0 - \dot m t)$, and two of its moments integrate exactly. The first is the rocket equation itself:

$$
L \equiv \int_0^{t_f} a(t)\, dt = v_e \ln\!\frac{m_0}{m_f}.
$$

The second, less familiar but no harder to derive by substitution, is its first moment in time:

$$
J \equiv \int_0^{t_f} a(t)\, t\, dt = \frac{v_e}{\dot m}\left[m_0\ln\!\frac{m_0}{m_f} - (m_0 - m_f)\right].
$$

Both are pure algebra once $m_0$, $m_f$, $\dot m$ and $v_e$ are known — no integration performed in flight, because it was already performed, once, by hand, before the algorithm was ever coded.

::: example Verifying J against a direct integration
Take a 20,000 kg upper stage, $\dot m = 273.6825\ \mathrm{kg/s}$, $v_e = 3412.71\ \mathrm{m/s}$, burning $t_f = 37.429\ \mathrm{s}$ (so $m_f = 20{,}000 - 273.6825 \times 37.429 = 9756.34\ \mathrm{kg}$). The closed forms give

$$
L = 3412.71\ln\!\frac{20{,}000}{9756.34} = 2449.695\ \mathrm{m/s}, \qquad
J = \frac{3412.71}{273.6825}\left[20{,}000\ln\!\frac{20{,}000}{9756.34} - 10{,}243.66\right] = 51{,}282.972\ \mathrm{m}.
$$

Numerically integrating $a(t)$ and $a(t)\,t$ directly over the same interval reproduces both values to six decimal places — the closed forms are exact, not approximations, for the constant-thrust, constant-$\dot m$ case they assume.
:::

::: key
Two closed-form thrust-acceleration integrals feed IGM's algebra: $L = v_e\ln(m_0/m_f)$ (total velocity capability) and $J = (v_e/\dot m)\left[m_0\ln(m_0/m_f) - (m_0-m_f)\right]$ (its first moment in time) — both ordinary algebra from $m_0$, $m_f$, $\dot m$, $v_e$, with no numerical integration required in flight.
:::

## The exact case: a single, constant pitch angle

$L$ alone is already enough to solve the one-parameter version of the steering problem in closed form, exactly, with no approximation. Holding pitch $\beta$ constant (this module's earlier "one angle, one target" case) gives $v_x(t_f) = v_{x0} + L\cos\beta$ and $v_z(t_f) = v_{z0} + L\sin\beta - g t_f$ exactly — no integration remains to be done, because a constant $\beta$ can be pulled straight out of the integral. Matching a single terminal-velocity component gives $\beta$ by inverse trigonometry alone.

::: example Closed-form pitch for a single constraint
Continue the stage above from a 300 km circular parking orbit, $v_{x0} = 7725.76\ \mathrm{m/s}$, toward a target tangential speed $v_x(t_f) = 10{,}151.49\ \mathrm{m/s}$ — the perigee speed of a geostationary transfer ellipse, the kind of high-energy injection IGM-family guidance is built for. With $L = 2449.695\ \mathrm{m/s}$ from above,

$$
\cos\beta = \frac{v_x(t_f) - v_{x0}}{L} = \frac{10{,}151.49 - 7725.76}{2449.695} = 0.990218
\quad\Longrightarrow\quad
\beta = 8.021^\circ,
$$

pure algebra, no shooting. Flying that constant $8.021^\circ$ pitch for the full 37.429 s reaches $v_x(t_f) = 10{,}151.492$ m/s exactly (to the precision quoted) and leaves $v_z(t_f) = 7.27\ \mathrm{m/s}$ — close to, but not exactly, the zero radial rate a clean perigee injection wants, because only one of the two terminal velocity components was actually constrained.
:::

## The linear-tangent case: closed form about a reference

Reaching *both* terminal velocity components, as the earlier lessons in this module showed, needs the second steering parameter $B$ — and this is where an exact closed form stops being available even in principle: $\int a(t)\cos\beta(t)\,dt$ and $\int a(t)\sin\beta(t)\,dt$ with $\beta(t) = \arctan(A+Bt)$ involve $a(t)$ multiplied by a square root of a quadratic in $t$, and that product has no elementary antiderivative. IGM's answer, and PEG's after it, is to linearize: expand $\cos\beta(t)$ and $\sin\beta(t)$ to first order about a reference angle $\beta_0$ chosen from the terminal velocity gap itself, which turns the two integrals into combinations of exactly $L$ and $J$ — the moment $J$ exists precisely to capture this first-order correction — and solves a small *linear* system for the reference angle and steering rate, each guidance cycle, using only the closed forms above. The system is not exact the way the single-angle case is; it is accurate to the extent the pitch angle does not swing far over one cycle's remaining burn, which is exactly the same "trust the local approximation only briefly" idea the PEG lesson built the re-convergence argument on. What makes it "closed form" is that no cycle ever runs a numerical integrator or an inner iteration to find it — the correction is a handful of algebraic operations on $L$, $J$, and the current state, fast enough for a machine built in the 1960s to fly a Saturn V.

::: key
IGM (and the closed-form part of PEG after it): the exact single-angle solution uses $L$ alone; the full two-parameter linear-tangent correction linearizes about a reference angle using $L$ and $J$ together, solving a small linear system algebraically each cycle rather than integrating or iterating numerically in flight.
:::

## Iterative means "every cycle," not "solved by iteration"

The name is worth pausing on, because it points at the right idea only once the last two lessons' machinery is in view. IGM is not "iterative" because it runs an iterative numerical solver to find its answer — the whole point of the closed forms above is that it does not. It is iterative in the same sense the PEG cycle from earlier in this module is: the algebra above is re-evaluated from scratch, from the vehicle's actual current state, every guidance cycle, for as long as the burn continues, and it is that *repetition* — not any iteration inside a single cycle's computation — that lets a locally linearized approximation fly an entire ascent to orbit, exactly as the previous lesson's re-convergence argument showed for PEG in general. A single-shot solve of the linearized system, flown open loop for the whole burn, would carry the same accumulating error the PEG lesson demonstrated numerically; IGM avoids it by never trusting a single cycle's answer past the next one.

::: warning
Do not read the closed-form algebra here as evidence IGM is a *simpler* algorithm than PEG. It solves the same underlying boundary-value problem this module has been building toward since the linear tangent law, under a tighter computational budget, by trading exactness (the linearization) for speed. PEG, running on more capable hardware, can afford the numerical shooting solve this module's own worked examples use and gets a more exact answer each cycle at the cost of more arithmetic — a different point on the same accuracy-versus-computation trade, not a different problem.
:::

## Check yourself

::: check
Explain why $L = \int a(t)\,dt$ has an elementary closed form but $\int a(t)\cos\beta(t)\,dt$ does not, once $\beta(t) = \arctan(A+Bt)$ is not constant.
:::

::: answer
$a(t) = v_e\dot m/(m_0-\dot m t)$ is itself a simple rational function of $t$, and its antiderivative is the standard logarithm that gives $L$. Once $\beta(t)$ varies with $t$, $\cos\beta(t) = 1/\sqrt{1+(A+Bt)^2}$ introduces a square root of a quadratic in $t$ multiplying that rational function, and the product of those two forms does not reduce to elementary functions by substitution — which is exactly why IGM and PEG both resort to linearizing $\cos\beta(t)$ and $\sin\beta(t)$ about a reference angle rather than integrating them exactly.
:::

::: check
A stage has $m_0 = 15{,}000$ kg, $\dot m = 200$ kg/s, $v_e = 3000$ m/s, and burns for 20 s. Compute $L$ and $J$.
:::

::: answer
$m_f = 15{,}000 - 200\times20 = 11{,}000\ \mathrm{kg}$. $L = 3000\ln(15{,}000/11{,}000) = 3000\times0.310155 = 930.46\ \mathrm{m/s}$. $J = (3000/200)\left[15{,}000\ln(15{,}000/11{,}000) - (15{,}000-11{,}000)\right] = 15\left[15{,}000\times0.310155 - 4000\right] = 15\left[4652.33-4000\right] = 15\times652.33 = 9784.86\ \mathrm{m}$.
:::

::: check
Using $L = 930.46\ \mathrm{m/s}$ from the previous question, and initial velocity components $v_{x0}=7200$ m/s, $v_{z0}=0$, find the constant pitch angle that reaches $v_x(t_f) = 7950$ m/s exactly, and state what $v_z(t_f)$ comes out to if $g = 9.5\ \mathrm{m/s^2}$ (a lower local value, illustrating that $g$ need not be exactly $g_0$) over the 20 s burn.
:::

::: answer
$\cos\beta = (7950-7200)/930.46 = 0.80605$, so $\beta = 36.29^\circ$ and $\sin\beta = 0.59185$. Then $v_z(t_f) = v_{z0} + L\sin\beta - g t_f = 0 + 930.46\times0.59185 - 9.5\times20 = 550.70 - 190.0 = 360.70\ \mathrm{m/s}$ — nonzero, because only $v_x$ was constrained by this single-parameter solve.
:::

::: check
Why does IGM linearize about a reference angle chosen from the current terminal-velocity gap, rather than, say, always linearizing about straight up or straight ahead?
:::

::: answer
A first-order linearization is only accurate near the point it is taken about — the further the true optimal angle is from the reference, the larger the neglected higher-order terms become. Choosing the reference from the actual terminal-velocity gap (roughly, the direction the vehicle still needs to accelerate in) puts the linearization point close to where the true solution is likely to lie, keeping the linear correction small and the approximation good, in the same spirit as PEG's warm-started numerical solve using the previous cycle's answer as its starting guess rather than an arbitrary one.
:::

::: check
A learner claims IGM must be less accurate than the numerically-shot PEG examples in this module, since it relies on a linearization rather than an exact nonlinear solve. Is a single IGM cycle's steering command therefore a worse answer than a single PEG cycle's?
:::

::: answer
A single cycle's linearized answer is indeed less exact than a single cycle's fully converged nonlinear shooting solution, for the same reason any first-order approximation is less exact than the function it approximates. But neither algorithm trusts a single cycle's answer to fly the whole remaining burn — both re-solve from the true state every cycle, and IGM's re-convergence corrects a linearization's error the same way PEG's re-convergence corrects a local-flat-gravity error: by never letting it accumulate past one cycle's duration. The comparison that matters operationally is closed-loop insertion accuracy over the whole burn, not the exactness of one isolated cycle's algebra.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| IGM | Saturn V's exoatmospheric guidance (S-IVB Earth-orbit and translunar burns); linear-tangent law, closed-form solve; the first flown explicit guidance |
| $L = \int a\,dt = v_e\ln(m_0/m_f)$ | closed-form total thrust-velocity capability |
| $J = \int a\,t\,dt = (v_e/\dot m)[m_0\ln(m_0/m_f) - (m_0-m_f)]$ | closed-form first time-moment of thrust acceleration |
| Single-angle case | $v_x(t_f)=v_{x0}+L\cos\beta$, $v_z(t_f)=v_{z0}+L\sin\beta-gt_f$ — exact, solved by inverse trigonometry |
| Two-parameter case | no elementary closed form; linearize $\cos\beta(t)$, $\sin\beta(t)$ about a reference angle using $L$ and $J$, solve a small linear system |
| Worked example | $L=2449.695$ m/s, $J=51{,}282.972$ m for a 37.429 s burn; single-angle solve gives $\beta=8.021^\circ$ |
| "Iterative" | re-evaluated every guidance cycle from the true state, exactly as PEG re-converges — not an inner numerical iteration within one cycle |
| IGM vs. PEG | same boundary-value problem; IGM trades exactness for closed-form speed on 1960s hardware, PEG affords a more exact per-cycle numerical solve on more capable hardware |

The next lesson steps back from how the steering is computed to what it is computed *toward*: exactly what numbers a target orbit hands to guidance, and why one of them is deliberately left unconstrained.
