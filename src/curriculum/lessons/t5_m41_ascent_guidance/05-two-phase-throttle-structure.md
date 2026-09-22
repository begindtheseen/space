---
id: l05-two-phase-throttle-structure
title: The two-phase throttle structure
minutes: 22
covers:
  - "The two-phase throttle structure: constant thrust to a g-limit, then throttled constant acceleration"
---

The linear tangent law and the PEG cycle that flies it both take the thrust *magnitude* as given and solve only for direction. This lesson fills in the piece they deliberately left open: what the throttle is doing, and why it is doing two entirely different things in two different parts of the burn.

## Acceleration grows without bound at constant thrust

Hold thrust $T$ fixed and let the vehicle burn propellant at a constant mass-flow rate $\dot m$. The acceleration is $a(t) = T/m(t)$, and since $m(t) = m_0 - \dot m\, t$ decreases monotonically toward the dry mass, $a(t)$ increases monotonically — without bound as $m \to m_{\text{dry}}$, in the idealized limit of burning every kilogram of propellant at unchanged thrust. No real burn is flown all the way to that limit unmanaged.

::: example How steep the climb actually is
The stage-2 vehicle from the last two lessons ignites at 112,400 kg against a fixed 934 kN of thrust: $a_0 = 934{,}000/112{,}400 = 8.31\ \mathrm{m/s^2} = 0.85g$, an unremarkable start. Run the same constant thrust all the way to the vehicle's dry-plus-payload mass of 13,500 kg and $a = 934{,}000/13{,}500 = 69.2\ \mathrm{m/s^2} = 7.05g$ — an acceleration no crew could survive and few payloads are built to tolerate, reached smoothly, with no single dramatic event marking the crossing from fine to intolerable.
:::

## The g-limit

Real vehicles cap acceleration at a structural or payload limit — a value in the range of 3 to 6g is typical, set by what the payload, the crew, or the vehicle's own structure can take, and specified as a hard constraint the flight profile must never exceed. Below that limit, running at full thrust is strictly better: it delivers the required velocity change in the least time, which by the gravity-loss argument from earlier in this module also minimizes gravity loss. Above it, full thrust is not an option at all.

## Two phases, one continuous burn

The resulting throttle profile has exactly two regimes. **Phase one** runs at full, constant thrust from ignition until the acceleration limit is reached — the fastest way to use the propellant while it is still safe to do so. **Phase two** begins the instant $a(t)$ would otherwise exceed the limit, and throttles the engine down just enough to hold acceleration *exactly* at the limit for the rest of the burn, rather than letting it climb further.

Phase two has a clean closed form. Holding $a(t) = a_{\lim}$ requires $T(t) = a_{\lim}\, m(t)$, and since mass flow is proportional to thrust ($\dot m = T/v_e$ for exhaust velocity $v_e$), that becomes $\dot m(t) = -(a_{\lim}/v_e)\, m(t)$ — a first-order linear equation whose solution is an **exponential decay** of mass, not the linear decay of constant-thrust flight:

$$
m(t) = m_{\lim}\, \exp\!\left[-\frac{a_{\lim}}{v_e}(t - t_{\lim})\right], \qquad \tau_{\text{throttle}} \equiv \frac{v_e}{a_{\lim}},
$$

with $m_{\lim}$ and $t_{\lim}$ the mass and time at which the limit was first reached. The throttle setting, $T(t) = a_{\lim} m(t)$, decays along with it — the engine runs down smoothly from full thrust toward its minimum practical throttle as the burn completes.

::: key
Two-phase throttle: constant (full) thrust until the acceleration limit $a_{\lim}$ is reached, then throttled to hold $a_{\lim}$ exactly, with mass decaying exponentially, $m(t) = m_{\lim} e^{-(t-t_{\lim})/\tau_{\text{throttle}}}$, $\tau_{\text{throttle}} = v_e/a_{\lim}$, for the rest of the burn.
:::

::: example Where the limit bites, for a real burn
Take the same stage-2 vehicle and impose a $4g$ limit, $a_{\lim} = 39.2266\ \mathrm{m/s^2}$. Constant thrust reaches that acceleration at $m_{\lim} = T/a_{\lim} = 934{,}000/39.2266 = 23{,}810.4\ \mathrm{kg}$, which constant-thrust burning from 112,400 kg reaches at

$$
t_{\lim} = \frac{112{,}400 - 23{,}810.4}{273.6825} = 323.69\ \mathrm{s}.
$$

From there, $\tau_{\text{throttle}} = v_e/a_{\lim} = 3412.71/39.2266 = 87.00\ \mathrm{s}$, and burning the remaining propellant down to the 13,500 kg dry-plus-payload mass under this exponential law takes

$$
t_{\text{throttle}} = \tau_{\text{throttle}}\ln\!\left(\frac{m_{\lim}}{m_f}\right) = 87.00 \times \ln\!\left(\frac{23{,}810.4}{13{,}500}\right) = 49.37\ \mathrm{s}.
$$

Sampling the throttle setting through that final 49.4 seconds: full thrust (934 kN) at $t_{\lim}$, down to 832.6 kN (89.1%) ten seconds later, 700.7 kN (75.0%) at 25 seconds, and 529.5 kN (56.7% of maximum) by cutoff — a smooth ramp-down landing well inside the throttle range most liquid engines are actually built to hold. The whole limited phase lasts under 50 seconds out of a burn several hundred seconds long: the constraint that dominates the *shape* of the last part of the flight only becomes active in its final quarter.
:::

## Why guidance has to know which phase it is in

The time-to-go formula the previous lesson derived, $t_{go} = \tau(1 - e^{-\Delta v/v_e})$ with $\tau = m/\dot m$, assumes constant thrust and constant mass-flow rate for the remainder of the burn — exactly phase one's regime, and exactly wrong for phase two. During throttle-hold, acceleration itself is the fixed quantity, so the velocity gained over any interval is simply $a_{\lim}$ times the interval's duration, and the correct relation is the much simpler

$$
t_{go} = \frac{\Delta v_{\text{required}}}{a_{\lim}}.
$$

::: example The wrong formula, quantified
At the moment the $4g$ limit is first reached ($m = 23{,}810.4\ \mathrm{kg}$), suppose 500 m/s of velocity is still required. The correct, constant-acceleration time-to-go is $500/39.2266 = 12.746\ \mathrm{s}$. Apply the constant-*thrust* rocket-equation formula instead — as if the engine were about to run unthrottled rather than immediately capped — and $\tau = m/\dot m = 23{,}810.4/273.6825 = 87.00\ \mathrm{s}$ gives $t_{go} = 87.00\,(1 - e^{-500/3412.71}) = 11.857\ \mathrm{s}$: 0.89 s short, a 7.0% error, from using a formula that assumes an acceleration profile the vehicle is not actually flying.
:::

A guidance cycle that used the constant-thrust formula throughout the burn would, every cycle it spent in the throttled phase, misjudge how much burn time remains — a modest error in this example, but one that grows if the throttled phase is longer, and one with no reason to be tolerated when the correct formula is no harder to evaluate. This is precisely why the throttle-structure card in this module's flashcard set exists as its own idea, separate from steering: PEG's time-to-go estimate is only as good as its model of the thrust profile, and a real implementation tracks which phase the vehicle is in and switches formulas at the boundary, exactly as it tracks which stage is burning.

::: warning
Do not confuse the acceleration limit with a *steering* constraint. Throttling affects only $|T(t)|$; the linear tangent pitch law from earlier in this module still determines the thrust *direction* throughout both phases, entirely independently. A throttled engine still steers.
:::

## Check yourself

::: check
Explain why running at full thrust is optimal below the acceleration limit but must stop being an option once the limit is reached, rather than merely becoming undesirable.
:::

::: answer
Below the limit, full thrust delivers a given velocity change in the least time, which minimizes gravity loss and is otherwise unconstrained — there is no reason to throttle down. At the limit, acceleration is a hard structural or payload constraint: continuing at full, unthrottled thrust would push $a(t) = T/m(t)$ past it as mass keeps falling, which is not merely inefficient but not permitted at all. The limit is a ceiling the vehicle is not allowed to cross, not a preference that trades off against something else.
:::

::: check
Derive, from $T(t) = a_{\lim} m(t)$ and $\dot m = -T/v_e$, why mass decays exponentially rather than linearly during the throttled phase.
:::

::: answer
Substituting the throttle law into the mass-flow relation gives $\dot m = -(a_{\lim}/v_e)\, m$, a first-order linear ODE whose solution is $m(t) = m_{\lim} e^{-(a_{\lim}/v_e)(t-t_{\lim})}$ — exponential decay, with rate constant $a_{\lim}/v_e$. This is qualitatively different from the constant-thrust phase, where $\dot m$ is itself constant and mass falls *linearly* with time; the difference exists because during throttle-hold, thrust (and hence mass-flow) is proportional to the *current* mass rather than fixed, so the rate of loss slows down as the vehicle gets lighter, in exactly the way exponential decay does.
:::

::: check
A vehicle enters its throttled phase with 30,000 kg of mass remaining, $v_e = 3400\ \mathrm{m/s}$, and a $3.5g$ limit. Find $\tau_{\text{throttle}}$ and the throttle setting (as a fraction of the value at entry) after one $\tau_{\text{throttle}}$ has elapsed.
:::

::: answer
$a_{\lim} = 3.5 \times 9.80665 = 34.323\ \mathrm{m/s^2}$, so $\tau_{\text{throttle}} = v_e/a_{\lim} = 3400/34.323 = 99.06\ \mathrm{s}$. After one $\tau_{\text{throttle}}$, $m(t) = m_{\lim}\, e^{-1} = 0.3679\, m_{\lim}$, and since $T \propto m$ during throttle-hold, the throttle setting is also $e^{-1} \approx 36.8\%$ of its value at entry to the phase — a substantial throttle-down within a single time constant, which is why the throttled phase is normally the shorter, later part of the burn rather than a long, gentle taper.
:::

::: check
Why is the constant-thrust time-to-go formula wrong specifically during throttle-hold, rather than merely less accurate?
:::

::: answer
It is not a matter of degree — the formula's derivation assumes $\dot m$ is constant for the remainder of the burn, which is the defining feature of the constant-thrust phase and is false by construction during throttle-hold, where $\dot m$ is proportional to the shrinking mass and therefore itself continuously decreasing. Using a formula built on an assumption the vehicle is actively violating does not merely lose some precision; it answers a different question (how long would this burn take at today's mass-flow rate, held fixed) than the one guidance needs answered (how long will this burn actually take, given the throttle law in force).
:::

::: check
The worked example found the throttled phase lasts only 49.4 s out of a burn several hundred seconds long. Does that make the throttle structure a minor detail guidance can safely approximate away?
:::

::: answer
Not safely. The throttled phase is short in duration but it is also, by construction, the *final* part of the burn — the part where insertion accuracy is actually being set and where $t_{go}$ is smallest and guidance's sensitivity to a wrong estimate is highest, as an earlier lesson in this module showed for the general $t_{go}$ formula near cutoff. A 7% time-to-go error of the kind this lesson quantified, occurring during exactly the window where the burn is about to end, is the wrong place to accept an avoidable modeling error even though the window itself is brief.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $a(t) = T/m(t)$ | acceleration under constant thrust; grows without bound as $m \to m_{\text{dry}}$ |
| $a_{\lim}$ | structural or payload acceleration limit, typically 3–6g |
| Phase one | constant, full thrust until $a(t) = a_{\lim}$ |
| Phase two | throttle to hold $a(t) = a_{\lim}$ exactly |
| $\dot m = -(a_{\lim}/v_e)\, m$ | throttled-phase mass-flow law |
| $m(t) = m_{\lim} e^{-(t-t_{\lim})/\tau_{\text{throttle}}}$, $\tau_{\text{throttle}} = v_e/a_{\lim}$ | exponential mass decay during throttle-hold |
| Constant-accel $t_{go} = \Delta v/a_{\lim}$ | correct time-to-go formula during throttle-hold; the constant-thrust formula is wrong there, not merely approximate |
| Worked example, $4g$ limit | reached at $m=23{,}810$ kg, $t=323.7$ s; throttled phase lasts 49.4 s, throttle falls to 56.7% by cutoff |

The next lesson looks at the historical answer to this whole steering-and-throttle problem — Saturn V's Iterative Guidance Mode, the linear tangent law's first flight, a decade before PEG.
