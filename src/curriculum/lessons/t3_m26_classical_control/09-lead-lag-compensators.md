---
id: l09-lead-lag-compensators
title: Lead, lag and lead-lag compensators
minutes: 17
covers:
  - Lead, lag and lead-lag compensators
---

A loop needs two different things in two different places.

Near crossover it needs **phase**, because phase margin is what keeps it stable — and no amount of gain buys phase. Far below crossover it needs **gain**, because a big loop gain is what makes $|S|$ small and pushes disturbances away. A plain proportional gain cannot give either one selectively. Turn it up and the whole magnitude curve rises, moving crossover and phase margin together, usually for the worse.

Think of the tone controls on a stereo. One volume knob makes everything louder. A bass knob and a treble knob let you change the low notes and the high notes separately. Lead and lag networks are the bass and treble knobs of a control loop. They are two simple first-order filters — [[compensators|compensator-word]] — that split the two jobs apart:

- A **lead** adds phase in a band you choose, at the cost of more gain at high frequency.
- A **lag** adds gain at low frequency, at the cost of a little phase near crossover.
- A **lead-lag** does both.

Between them they cover most of what a PID does, in a form whose settings map straight onto the specification.

You meet them in flight hardware that predates digital computers — where they were built as [[electrical networks|rc-network]] — and in plenty that does not. A launch-vehicle autopilot is typically rate feedback plus a lead plus notch filters. A gimbal servo loop is a lead. A thermal control loop is a lag.

The plant for this lesson is an electromechanical [[gimbal actuator|gimbal]]: current command in, gimbal angle out, with a motor pole at $3\ \mathrm{rad/s}$:

$$
G(s) = \frac{2}{s\,(s + 3)} .
$$

## The lead network

A soccer player passing to a running teammate kicks the ball to where the teammate *will* be, not where they are. That is "leading" the target. A lead network does the same with a signal: near its design frequency, its output runs ahead of its input.

$$
C_{\text{lead}}(s) = K\,\frac{Ts + 1}{\alpha Ts + 1}, \qquad 0 < \alpha < 1 .
$$

Here $T$ is a time constant in seconds, $K$ is the gain, and $\alpha$ ("alpha") is a number between 0 and 1. The **zero** — where the top is zero — is at $s = -1/T$. The **pole** — where the bottom is zero — is at $s = -1/(\alpha T)$. Because $\alpha < 1$, the pole is $1/\alpha$ times farther out than the zero, so [[the zero comes first|pole-zero-lead]] as frequency rises.

Between the two corner frequencies, the magnitude climbs at $+20\ \mathrm{dB/decade}$ and the phase is positive. The phase is the zero's angle minus the pole's angle:

$$
\angle C = \arctan(\omega T) - \arctan(\alpha\omega T).
$$

At low frequency both angles are near zero. At high frequency both are near $90^\circ$ and cancel. In between, [[the phase rises to a peak and falls back|lead-phase-curve]]. The peak sits at the **[[geometric mean|geometric-mean]]** of the two corners, and its height depends only on $\alpha$:

$$
\omega_m = \frac{1}{T\sqrt{\alpha}} = \sqrt{\frac{1}{T}\cdot\frac{1}{\alpha T}},
\qquad
\sin\phi_m = \frac{1-\alpha}{1+\alpha},
\qquad
|C(j\omega_m)| = \frac{K}{\sqrt{\alpha}} .
$$

Read $\omega_m$ as "omega sub m", the frequency of maximum lead, and $\phi_m$ ("phi sub m") as the maximum lead angle.

Everything about designing a lead comes from those three. $\alpha$ sets *how much* phase you get. $T$ sets *where* you get it. $K$ sets the gain. Turning the middle formula around gives the one you use in design:

$$
\alpha = \frac{1-\sin\phi_m}{1+\sin\phi_m}.
$$

::: note Why the peak has to be where it is
Take the derivative of the phase with respect to $\omega$ and set it to zero:

$$
\frac{d}{d\omega}\angle C = \frac{T}{1+\omega^2T^2} - \frac{\alpha T}{1+\alpha^2\omega^2T^2} = 0
\quad\Longrightarrow\quad
1+\alpha^2\omega^2T^2 = \alpha\bigl(1+\omega^2T^2\bigr).
$$

Collect terms: $1 - \alpha = \alpha\omega^2T^2(1-\alpha)$. Divide by $1-\alpha$ (not zero, since $\alpha < 1$) to get $\omega^2 = 1/(\alpha T^2)$, so $\omega_m = 1/(T\sqrt{\alpha})$.

At that frequency $\omega_mT = 1/\sqrt\alpha$ and $\alpha\omega_mT = \sqrt\alpha$. The tangent of a difference of angles gives

$$
\tan\phi_m = \frac{1/\sqrt\alpha - \sqrt\alpha}{1 + 1} = \frac{1-\alpha}{2\sqrt\alpha}.
$$

A right triangle with legs $1-\alpha$ and $2\sqrt\alpha$ has hypotenuse $\sqrt{(1-\alpha)^2 + 4\alpha} = 1+\alpha$, so $\sin\phi_m = (1-\alpha)/(1+\alpha)$. Finally the size: $|C(j\omega_m)| = K\sqrt{1+1/\alpha}\,/\sqrt{1+\alpha} = K/\sqrt\alpha$.
:::

How much does a given $\alpha$ buy, and what does it cost?

| $\alpha$ | max phase lead | high-frequency gain boost $1/\alpha$ |
| --- | --- | --- |
| 0.5 | 19.5° | 2.0 |
| 0.3 | 32.6° | 3.3 |
| 0.2 | 41.8° | 5.0 |
| 0.1 | 54.9° | 10 |
| 0.05 | 64.8° | 20 |
| 0.01 | 78.6° | 100 |

That table is the whole trade. One section can in principle give almost $90^\circ$. But the gain at high frequency grows as $1/\alpha$, and with it the sensor noise the actuator sees and the loop gain sitting on top of every resonance nobody modelled. Below about $\alpha = 0.1$ (about $55^\circ$) designers usually refuse to pay. When more than $55^\circ$ is truly needed, two lead sections in a row with $\alpha = 0.3$ give $2 \times 32.6 = 65^\circ$ for a high-frequency boost of $3.3 \times 3.3 = 11$. A single section giving $65^\circ$ would need $\alpha = 0.049$ and cost a boost of about $20$.

::: example A lead for the gimbal actuator: 4 rad/s and 60° of phase margin
**Step 1: look at the plant at the target crossover**, $\omega_c = 4\ \mathrm{rad/s}$:

$$
G(j4) = \frac{2}{j4\,(j4+3)},\qquad |G(j4)| = \frac{2}{4\sqrt{16+9}} = \frac{2}{20} = 0.100,\qquad \angle G(j4) = -90^\circ - \arctan\tfrac43 = -143.13^\circ .
$$

The $-90^\circ$ is the integrator $1/s$; the $\arctan(4/3)$ is the motor pole.

**Step 2: how much lead is needed?** For $60^\circ$ of phase margin, the loop's angle at crossover must be $-180^\circ + 60^\circ = -120^\circ$. The plant supplies $-143.13^\circ$, so the lead must add $-120^\circ + 143.13^\circ = +23.13^\circ$. It should add its *maximum* right there, so $\phi_m = 23.13^\circ$ and

$$
\alpha = \frac{1-\sin 23.13^\circ}{1+\sin 23.13^\circ} = \frac{1 - 0.3928}{1.3928} = 0.4359 .
$$

**Step 3: put the peak at crossover.** Set $\omega_m = 4$: $T = 1/(\omega_m\sqrt{\alpha}) = 1/(4 \times 0.6602) = 0.3786\ \mathrm{s}$. The zero is at $1/T = 2.641\ \mathrm{rad/s}$ and the pole at $1/(\alpha T) = 6.058\ \mathrm{rad/s}$. Check: $\sqrt{2.641 \times 6.058} = 4.00$, the geometric mean, as it should be.

**Step 4: set the gain.** At $4\ \mathrm{rad/s}$ the lead's size is $K/\sqrt{\alpha}$. The loop's size must be one there, so $K/\sqrt\alpha$ must equal $1/|G(j4)| = 10$:

$$
K = 10\sqrt{\alpha} = 10 \times 0.6602 = 6.602 .
$$

**Check the result.** Evaluating the finished loop on a computer gives crossover at $4.0000\ \mathrm{rad/s}$ and a phase margin of $60.00^\circ$, exactly as designed. The closed-loop poles are $-3.283 \pm 4.618j$ and $-2.492$. The modulus margin is $0.737$, so $\lVert S\rVert_\infty = 1.36$ — a comfortable design.

**The step that catches people.** The lead's gain at $\omega_m$ is $K/\sqrt{\alpha}$, not $K$. If you size $K$ from the plant alone and then bolt the lead on, the extra factor $1/\sqrt{\alpha} = 1.51$ pushes crossover above the target. Up there the plant has more lag, and the lead is past its peak, so you get less margin than you designed for. Either fold $\sqrt\alpha$ into $K$ as above, or iterate.
:::

## The lag network

A lag works the other way round. Picture a hiker who ignores every small wiggle in the trail but slowly corrects any steady drift off course. That patience, applied only to slow errors, is what a lag gives the loop.

$$
C_{\text{lag}}(s) = \frac{Ts + 1}{\beta Ts + 1}, \qquad \beta > 1 .
$$

Here $\beta$ ("beta") is bigger than one, so now the *pole* comes first, at $s = -1/(\beta T)$, and the zero comes a factor $\beta$ later, at $s = -1/T$. The magnitude falls from $1$ at zero frequency (DC) to $1/\beta$ above the zero. The phase is negative everywhere, with its biggest dip given by the same formula as before: $\sin\phi_m = (\beta-1)/(\beta+1)$.

Written like that, the lag looks like it only turns the signal down. The trick is how it is used:

1. Place both corners well below the crossover you want.
2. Multiply the overall gain by $\beta$.

Near and above crossover, the lag's $1/\beta$ and the extra $\beta$ cancel. So crossover and phase margin barely change. But below the lag's corners, the loop gain is now $\beta$ times larger. You have bought low-frequency gain without spending phase where it matters.

The cost is a little leftover phase lag at crossover. Placing the lag's zero a decade (a factor of ten) below crossover, $1/T = \omega_c/10$, leaves

$$
\angle C_{\text{lag}}(j\omega_c) = \arctan(10) - \arctan(10\beta),
$$

which is $-4.6^\circ$ for $\beta = 5$ and $-5.1^\circ$ for $\beta = 10$. Push the corners closer to crossover and the penalty grows quickly. Push them farther down and the loop takes longer to show the benefit in time.

::: example Adding a lag to fix the ramp error
Suppose the gimbal must track a steadily moving target — a command that rises in a straight line, called a **ramp**. The measure of how well a loop follows a ramp is the **[[velocity error constant|velocity-error]]** $K_v = \lim_{s\to0} sL(s)$: the steady error to a unit ramp is $1/K_v$.

For the lead design, $L = C_{\text{lead}}G$, and at $s \to 0$ the lead is $K$ and $sG \to 2/3$:

$$
K_v = K\cdot\frac{2}{3} = 6.602 \times 0.6667 = 4.40\ \mathrm{s^{-1}},
$$

so the ramp error is $1/4.40 = 0.227$. Suppose the specification asks for $K_v \ge 20$, which is $20/4.40 = 4.5$ times more.

**Add a lag** with $\beta = 5$ and its zero a decade below crossover: $1/T_{\text{lag}} = 4/10 = 0.4\ \mathrm{rad/s}$, so $T_{\text{lag}} = 2.5\ \mathrm{s}$, and the pole is at $1/(\beta T_{\text{lag}}) = 1/12.5 = 0.08\ \mathrm{rad/s}$. Raise the gain to $K' = \beta K = 5 \times 6.602 = 33.01$. The full compensator is

$$
C(s) = 33.01\,\frac{(0.3786\,s + 1)}{(0.1650\,s + 1)}\cdot\frac{(2.5\,s + 1)}{(12.5\,s + 1)} .
$$

**Check what happened at crossover.** At $4\ \mathrm{rad/s}$ the lag's size is $0.201$ — almost exactly $1/\beta = 0.2$ — so the $\beta$ in $K'$ cancels it. Crossover barely moves, from $4.000$ to $4.015\ \mathrm{rad/s}$. The lag adds $-4.57^\circ$ of phase, so the phase margin falls from $60.0^\circ$ to $55.3^\circ$.

**Check what happened at low frequency.** $K_v$ rises to $33.01 \times 2/3 = 22.0\ \mathrm{s^{-1}}$, which meets the specification, and the ramp error falls from $0.227$ to $1/22.0 = 0.045$.

Five times the low-frequency gain for under five degrees of phase margin. That is the lag's whole offer, and it is usually a good trade.
:::

## They are PID in disguise

Lead and lag are the same objects the PID lesson built, written differently. Seeing the match saves a great deal of confusion.

**A practical PD is exactly a lead.** Put the filtered PD over one common denominator:

$$
k_p + \frac{k_dNs}{s+N} = \frac{k_p(s+N) + k_dNs}{s+N} = \frac{(k_p + k_dN)\,s + k_pN}{s + N}.
$$

That is a zero at $s = -k_pN/(k_p + k_dN)$ over a pole at $s = -N$ — a lead network with $\alpha = k_p/(k_p + k_dN)$.

For the attitude loop of the PID lesson ($k_p = 4800$, $k_d = 3360$, $N = 10\ \mathrm{rad/s}$), $\alpha = 4800/(4800 + 33\,600) = 4800/38\,400 = 0.125$. The zero is at $1.25\ \mathrm{rad/s}$, so the maximum lead is $\arcsin(0.875/1.125) = 51.1^\circ$, at $\omega_m = \sqrt{1.25 \times 10} = 3.54\ \mathrm{rad/s}$. That loop crossed over at $3.26\ \mathrm{rad/s}$ — so the derivative filter was, without anyone saying so, a lead with its peak placed close to crossover. At $3.26\ \mathrm{rad/s}$ it supplies $51.0^\circ$, which is exactly that loop's phase margin, because the rigid body alone sits at $-180^\circ$. The unfiltered PD had $65.2^\circ$; the $14.2^\circ$ gap is what the filter cost.

**A lag is a PI with the integrator moved off the origin.** A PI is $k_p(T_is + 1)/(T_is)$: a zero at $-1/T_i$ over a pole at exactly zero, which gives infinite gain at DC. A lag has the same shape with the pole moved to $-1/(\beta T)$, giving a DC gain of $\beta$ instead of infinity. Let $\beta$ grow without limit, with $T$ fixed, and the lag becomes a PI.

That difference is a design decision, not a detail. An integrator gives zero steady-state error. It also brings windup, a mode-switching problem, a pole sitting on the stability boundary, and $90^\circ$ of lag at low frequency. A lag gives a *finite* error — for a constant command, $1/(1+\beta L_{\text{other}}(0))$, where $L_{\text{other}}(0)$ is the rest of the loop's DC gain — and none of those problems. On a loop whose actuator saturates often, or whose controller is often switched in and out, choosing $\beta = 20$ and accepting a small leftover error is often the better engineering.

::: warning
A lag leaves a slow closed-loop pole sitting next to its own zero, near the origin. That [[nearly cancelling pair|lag-dipole]] adds a slow, small tail to the step response. In the gimbal design above, the tail starts at about 9% of the step and dies with a time constant of $1/0.433 = 2.3\ \mathrm{s}$. It raises the overshoot from 8.4% to 15.9%, and it stretches the 2% settling time from $1.0\ \mathrm{s}$ to $3.5\ \mathrm{s}$ and the 1% settling time from $1.5\ \mathrm{s}$ to $5.1\ \mathrm{s}$ — while the 5% settling time only moves from $0.89$ to $1.18\ \mathrm{s}$. A loose settling criterion can hide the tail entirely. Simulate the step response out to several times $\beta T$ before calling the design finished.
:::

::: warning
A lead raises high-frequency loop gain by $1/\alpha$, and that gain sits on top of everything you did not model: sensor noise, the next bending mode, the effects of running on a digital computer. Whenever you add lead, recheck what the actuator is being asked to do in response to noise, and recheck the loop gain at every structural frequency. Two of this module's later limits — the notch filter's phase cost and the waterbed effect — are both statements about the same high-frequency gain you are spending here.
:::

## Check yourself

::: check
A lead network has a zero at $2\ \mathrm{rad/s}$ and a pole at $18\ \mathrm{rad/s}$. What is $\alpha$, what is the maximum phase lead, and at what frequency does it occur?
:::

::: answer
$\alpha$ is the ratio of the two corner frequencies, $2/18 = 0.1111$. The maximum lead is $\arcsin\bigl((1-0.1111)/(1+0.1111)\bigr) = \arcsin(0.8889/1.1111) = \arcsin(0.8) = 53.13^\circ$. It occurs at the geometric mean, $\omega_m = \sqrt{2 \times 18} = \sqrt{36} = 6\ \mathrm{rad/s}$.

The network's size there is $1/\sqrt{\alpha} = 3.0$ times its DC gain, and its high-frequency gain is $1/\alpha = 9$ times its DC gain.
:::

::: check
Why does choosing the gain from the plant alone, and only then adding the lead network, give less phase margin than intended?
:::

::: answer
Because the lead adds size as well as phase. If $K$ is chosen so that $K|G(j\omega_c)| = 1$, and the lead is added afterwards, the loop's size at $\omega_c$ becomes $K|G|/\sqrt{\alpha} = 1/\sqrt{\alpha}$, which is more than one. So crossover moves up to a higher frequency. Up there the plant has more phase lag, and the lead — whose peak was placed at the *old* $\omega_c$ — supplies less than its maximum. Both effects cut the margin. The fix in the worked example is to set $K = \sqrt{\alpha}/|G(j\omega_c)|$, so the $1/\sqrt\alpha$ is paid for in advance.
:::

::: check
A loop crosses over at $8\ \mathrm{rad/s}$ with $55^\circ$ of phase margin. You need ten times more loop gain at low frequency without losing more than $6^\circ$ of margin. Design a lag and state the result.
:::

::: answer
Take $\beta = 10$ for the factor of ten. Put the lag's zero a decade below crossover, at $0.8\ \mathrm{rad/s}$, so $T = 1/0.8 = 1.25\ \mathrm{s}$ and the pole is at $1/(\beta T) = 1/12.5 = 0.08\ \mathrm{rad/s}$.

The phase cost at crossover is $\arctan(8 \times 1.25) - \arctan(8 \times 12.5) = \arctan 10 - \arctan 100 = 84.29^\circ - 89.43^\circ = -5.14^\circ$ — inside the $6^\circ$ budget. Multiply the overall gain by $\beta = 10$ so the loop gain near crossover is restored.

Result: crossover stays essentially at $8\ \mathrm{rad/s}$, the phase margin is about $55 - 5.1 \approx 50^\circ$, and the loop gain is ten times larger below $0.08\ \mathrm{rad/s}$. Note that the full benefit appears only below the lag's *pole*, not its zero; between the two it builds up gradually.
:::

::: check
Write the lead compensator $6.602(0.3786s + 1)/(0.1650s + 1)$ as a filtered PD, giving $k_p$, $k_d$ and $N$.
:::

::: answer
Match it against $\bigl[(k_p + k_dN)s + k_pN\bigr]/(s+N)$, which has a bottom that starts with plain $s$. Divide the top and bottom of the lead by $0.1650$:

$$
\frac{6.602\,(0.3786s+1)}{0.1650s + 1} = \frac{(6.602 \times 0.3786/0.1650)\,s + 6.602/0.1650}{s + 1/0.1650} = \frac{15.15s + 40.01}{s + 6.061}.
$$

So $N = 6.061\ \mathrm{rad/s}$. Then $k_pN = 40.01$ gives $k_p = 40.01/6.061 = 6.602$. And $k_p + k_dN = 15.15$ gives $k_d = (15.15 - 6.602)/6.061 = 1.410$.

Check it the other way: $\alpha = k_p/(k_p + k_dN) = 6.602/15.15 = 0.436$, the $\alpha$ the design started from. The derivative time is $T_d = k_d/k_p = 0.214\ \mathrm{s}$, and the filter pole at $6.06\ \mathrm{rad/s}$ is only $1.5$ times crossover. That is heavy filtering, which is why this lead gives $23^\circ$ rather than the much larger phase an unfiltered derivative would.
:::

::: check
When would you deliberately choose a lag network over a PI controller, and what do you give up?
:::

::: answer
Choose a lag when an integrator is a liability rather than a help:

- when the actuator saturates often enough that windup is a real risk;
- when the controller is switched in and out of the loop and would need bumpless-transfer machinery;
- when a pole exactly on the stability boundary is unacceptable to the certification process;
- when the integrator's extra $90^\circ$ of low-frequency lag interacts badly with something else — a structural mode below crossover that you are phase-stabilizing, for instance.

What you give up is exactly zero steady-state error. A lag shrinks the leftover error by about the factor $\beta$ instead of removing it, so $\beta = 20$ turns a 10% trim error into about 0.5%. If the requirement is truly "zero", you need the integrator and the machinery that comes with it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $C_{\text{lead}} = K(Ts+1)/(\alpha Ts+1)$, $\alpha < 1$ | zero first, then pole; adds phase, raises high-frequency gain |
| $\omega_m = 1/(T\sqrt{\alpha})$ | frequency of maximum lead, the geometric mean of the corners |
| $\sin\phi_m = (1-\alpha)/(1+\alpha)$ | maximum lead; turned around, $\alpha = (1-\sin\phi_m)/(1+\sin\phi_m)$ |
| $\lvert C(j\omega_m)\rvert = K/\sqrt{\alpha}$ | the size boost that moves crossover if you forget it |
| $1/\alpha$ | high-frequency gain penalty; practical limit near $\alpha = 0.1$, $55^\circ$ |
| $C_{\text{lag}} = (Ts+1)/(\beta Ts+1)$, $\beta > 1$ | pole first, then zero; DC gain 1, high-frequency gain $1/\beta$ |
| Using a lag | put the corners below crossover, multiply the overall gain by $\beta$ |
| Lag phase cost | $\arctan(\omega_cT) - \arctan(\beta\omega_cT)$; $-4.6^\circ$ at $\beta = 5$, zero a decade down |
| $K_v = \lim_{s\to0}sL(s)$ | velocity error constant; ramp error $1/K_v$ |
| Gimbal example | $\alpha = 0.436$, zero 2.64, pole 6.06, $K = 6.60$: $\omega_{gc} = 4.0$, PM $60.0^\circ$ |
| With the lag | $\beta = 5$, zero 0.4, pole 0.08, $K' = 33.0$: PM $55.3^\circ$, $K_v$ from 4.40 to 22.0 |
| Practical PD $=$ lead | $\alpha = k_p/(k_p + k_dN)$, pole at $N$ |
| Lag $=$ PI with finite DC gain | pole moved from $0$ to $-1/(\beta T)$; error cut by about $\beta$ rather than to zero |

The next lesson uses the same tools for the opposite purpose: a filter designed to remove loop gain at one narrow frequency, where a structural mode lives — and the phase that removal costs.

::: context compensator-word Why "compensator"
To compensate is to make up for something. A plant on its own usually has the wrong shape: too much lag near crossover, or too little gain at low frequency. The compensator is the part you add in series to make up for what the plant lacks.

Engineers use "compensator" and "controller" almost interchangeably. "Compensator" hints at the frequency-shaping way of thinking in this lesson — you are reshaping a curve, not writing a rule.
:::

::: context rc-network Built from resistors and capacitors
Before flight computers, a lead or lag was a small circuit: a couple of resistors and a capacitor. A capacitor passes fast-changing signals more easily than slow ones, so placing one across a resistor makes a circuit whose gain rises with frequency — a lead. Moving it gives a lag.

That is why they are still called "networks". The same two numbers — one zero and one pole — describe the circuit and the software version that replaced it.
:::

::: context gimbal What a gimbal actuator does
Most large rockets steer by swiveling their engines. The engine hangs on a pivot called a **gimbal**, and actuators push it a few degrees one way or the other, pointing the thrust off-center to turn the vehicle.

An electromechanical actuator does the pushing with an electric motor and a screw. The command is a current; the output is an angle. The motor's own sluggishness is the pole at $3\ \mathrm{rad/s}$, and the $1/s$ is there because the motor sets a speed and the angle is that speed added up over time.
:::

::: context pole-zero-lead Where the lead puts its zero and pole
This is the gimbal loop on the left half of the $s$-plane, drawn to scale along the real axis. Crosses are poles, circles are zeros.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="350" y2="55" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="330" y1="25" x2="330" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="60" y1="51" x2="60" y2="59"/><line x1="150" y1="51" x2="150" y2="59"/><line x1="240" y1="51" x2="240" y2="59"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="100">−6</text><text x="150" y="100">−4</text><text x="240" y="100">−2</text><text x="330" y="100">0</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="325" y1="50" x2="335" y2="60"/><line x1="325" y1="60" x2="335" y2="50"/>
    <line x1="190" y1="50" x2="200" y2="60"/><line x1="190" y1="60" x2="200" y2="50"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="52.4" y1="50" x2="62.4" y2="60"/><line x1="52.4" y1="60" x2="62.4" y2="50"/>
  </g>
  <circle cx="211.2" cy="55" r="5.5" fill="#fff" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="57" y="38" font-size="11" fill="#b4232c" text-anchor="middle">lead pole −6.06</text>
  <text x="222" y="38" font-size="11" fill="#1d6fd1" text-anchor="middle">lead zero −2.64</text>
  <text x="178" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">motor −3</text>
  <text x="318" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">1/s</text>
</svg>
```

The zero sits closer to the origin than the pole, so it "switches on" first as frequency rises; the pole switches on later and stops the rise. Notice the zero lands slightly inside the motor pole — it partly undoes the motor's lag right where crossover lives.
:::

::: context lead-phase-curve The phase hump of the gimbal lead
The phase the gimbal lead adds, from $0.1$ to $100\ \mathrm{rad/s}$ on a log scale. It peaks at $23.1^\circ$ exactly at $4\ \mathrm{rad/s}$, the geometric mean of its corners at $2.64$ and $6.06\ \mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="170" x2="40" y2="35" stroke="#1f2a44" stroke-width="1.2"/>
  <g stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="2 3">
    <line x1="40" y1="120" x2="330" y2="120"/><line x1="40" y1="70" x2="330" y2="70"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0.1</text><text x="136.7" y="186">1</text><text x="233.3" y="186">10</text><text x="330" y="186">100</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="174">0°</text><text x="35" y="124">10°</text><text x="35" y="74">20°</text>
  </g>
  <path d="M40.0,163.9 L49.7,162.3 L59.3,160.3 L69.0,157.8 L78.7,154.7 L88.3,150.8 L98.0,145.9 L107.7,139.9 L117.3,132.5 L127.0,123.7 L136.7,113.2 L146.3,101.3 L156.0,88.5 L165.7,75.8 L175.3,64.8 L185.0,57.2 L189.8,55.1 L194.7,54.4 L199.5,55.0 L204.3,56.9 L214.0,64.4 L223.7,75.3 L233.3,87.9 L243.0,100.7 L252.7,112.7 L262.3,123.3 L272.0,132.2 L281.7,139.6 L291.3,145.7 L301.0,150.6 L310.7,154.6 L320.3,157.7 L330.0,160.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="194.9" y1="54.4" x2="194.9" y2="170" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="177.4" y1="165" x2="177.4" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="212.3" y1="165" x2="212.3" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="44" font-size="11" fill="#b4232c">peak 23.1° at 4 rad/s</text>
  <text x="250" y="160" font-size="11" fill="#1f2a44">ω (rad/s)</text>
</svg>
```

On a log axis the hump is symmetric, which is the picture behind "the peak sits at the geometric mean".
:::

::: context geometric-mean The middle on a log scale
The ordinary average of 2 and 18 is 10. The **geometric mean** is $\sqrt{2 \times 18} = 6$. It is the number that is the same *factor* away from each end: $6/2 = 3$ and $18/6 = 3$.

On a log scale, like a Bode plot's frequency axis, equal factors look like equal distances. So the geometric mean is the point halfway between the two corners as your eye sees it. That is why the lead's phase peak looks centered on a Bode plot.
:::

::: context velocity-error Following a moving target
Imagine a ground antenna turning to follow a satellite crossing the sky at a steady rate. The pointing command is a ramp. A loop with one integrator — like this gimbal, with its $1/s$ — can follow a ramp, but it trails behind by a constant amount. That trailing error is $1/K_v$ of the ramp's slope.

Double $K_v$ and the trailing error halves. Adding a second integrator would drive it to zero, at the cost of the extra phase lag the lag network is designed to avoid.
:::

::: context lag-dipole The nearly cancelling pair
Zoom in near the origin of the $s$-plane for the gimbal loop with its lag (to scale).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="55" x2="345" y2="55" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="320" y1="25" x2="320" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="95" y1="51" x2="95" y2="59"/><line x1="207.5" y1="51" x2="207.5" y2="59"/></g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle"><text x="95" y="100">−0.5</text><text x="207.5" y="100">−0.25</text><text x="320" y="100">0</text></g>
  <circle cx="140" cy="55" r="5.5" fill="#fff" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#1f2a44" stroke-width="2.5"><line x1="279" y1="50" x2="289" y2="60"/><line x1="279" y1="60" x2="289" y2="50"/></g>
  <circle cx="125.2" cy="55" r="4.5" fill="#b4232c"/>
  <text x="150" y="38" font-size="11" fill="#1d6fd1">lag zero −0.4</text>
  <text x="284" y="38" font-size="11" fill="#1f2a44" text-anchor="middle">lag pole −0.08</text>
  <text x="60" y="80" font-size="11" fill="#b4232c">closed-loop pole −0.433</text>
</svg>
```

When the loop closes, the lag's pole at $-0.08$ is pulled over to $-0.433$, right beside the zero at $-0.4$. A pole and zero this close nearly cancel, so this pole shows up only faintly in the response — about 9% of the step. But because it is so close to the origin, that faint part dies slowly: that is the lag tail.
:::
