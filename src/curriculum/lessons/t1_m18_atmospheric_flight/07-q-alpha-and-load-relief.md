---
id: l07-q-alpha-and-load-relief
title: The q-alpha load indicator and load relief
minutes: 22
covers:
  - the q-alpha load indicator and load relief control
---

Put your hand out of a car window, flat and level. The air slides past and barely pushes. Tilt your hand up a little and the air shoves it hard. Two things decide how hard: how fast the car is going, and how much you tilted. A big tilt at walking pace does almost nothing; a small tilt on the highway throws your arm back.

A climbing rocket is that hand, only 70 m long and made of thin metal. The speed part is the **dynamic pressure** $\bar{q}$ (read "q-bar"), the push of the oncoming air from lesson 2. The tilt part is the **angle of attack** $\alpha$ ("alpha"), the angle between the nose and the airflow, from lesson 4. Multiply them and you get the number the rocket's structural designers watch most closely: $\bar{q}\alpha$, read "q-bar alpha".

Ask a structures engineer how the control team could break the rocket, and that is the answer. The product $\bar{q}\alpha$ tracks the sideways bending load on the airframe. It comes with a hard limit, the **envelope** — the range of values the structure has been proven to survive — and the vehicle must stay inside it while the wind pushes it around.

The controller's tool is **load relief**: turning the nose toward the wind to shrink the angle of attack, and accepting that the rocket then drifts a little off its planned path. This lesson shows why $\bar{q}\alpha$ is the right thing to watch, puts numbers on the load a strong wind makes, and works out the trade between load and path. Holding attitude sits at one end of that trade, zero angle of attack at the other, and every load-relief design is a point in between. The max-Q exercise asks you to pick your point and say what it bought and what it cost.

## From sideways push to bending

Picture carrying a long ladder across a windy yard, holding it in the middle. Gusts push on the ends, and the strain is worst in the middle, near your hands. A rocket at an angle of attack is that ladder: a long **beam** loaded sideways.

Three sideways loads act on it:

- The **normal force** $N$, the air's push at right angles to the body. It is spread along the length but bunched up near the nose and the payload fairing, where the shape changes most.
- The engine's sideways push. When the engine swivels (the **gimbal**, from lesson 6) to hold the nose steady, part of its thrust points sideways, and that acts at the tail.
- The vehicle's own sideways acceleration $a_{\text{lat}}$ ("a lat"). Each little piece of mass $dm$ dragged along pushes back with an inertial force $-\,dm\; a_{\text{lat}}$, which partly relieves the bending.

The **[[bending moment|bending-beam]]** at a point along the body is the twisting effect of all these loads on one side of that point, each multiplied by its distance (its **lever arm**). It tells you how hard the structure is being bent there. For a rocket it peaks somewhere around the middle.

The exact bending moment is the structures team's job. What matters to control is that every one of those loads grows in step with the normal force:

- The air load is $N = \bar{q} S C_{N\alpha}\alpha$, with $S$ the reference area and $C_{N\alpha}$ the normal-force slope from lesson 5.
- The engine's trim force is $N\ell_\alpha/\ell_T$. Here $\ell_\alpha$ ("ell alpha") is the lever arm of the air force about the centre of gravity and $\ell_T$ that of the engine. It is a fixed multiple of $N$.
- The inertial relief is $m a_{\text{lat}}$, and $a_{\text{lat}}$ is set by those same two forces divided by the mass $m$.

So for a given vehicle at a given Mach number,

$$
M_{\text{bend}} \;\propto\; N \;\propto\; \bar{q}\,\alpha .
$$

($\propto$ reads "is proportional to".) That is why $\bar{q}\alpha$ — not $\alpha$ or $\bar{q}$ alone — is the **load indicator**. A $4^\circ$ angle of attack at $5\ \mathrm{kPa}$ early in flight is harmless. The same $4^\circ$ at $31\ \mathrm{kPa}$ is a structural emergency.

The indicator is usually quoted in **[[kPa·deg|kpa-deg]]**: kilopascals of dynamic pressure times degrees of angle of attack. Older American documents use psf·deg (pounds per square foot times degrees); $1\ \mathrm{kPa\cdot deg} = 20.9\ \mathrm{psf\cdot deg}$. A rocket is round, so the limit is set on the *total* angle of attack $\alpha_T$, whichever way it points: a certified $\bar{q}\alpha_T$ of order $100\ \mathrm{kPa\cdot deg}$ for a large launcher, though every vehicle certifies its own number and safety factors.

::: example The load from a 4° angle of attack
Use the example booster from lessons 5 and 6 at max-Q: $\bar{q} = 31.3\ \mathrm{kPa}$ and $N_\alpha = 1.317\ \mathrm{MN}$ per radian. ($N_\alpha = \bar{q} S C_{N\alpha}$ is the normal force per radian of angle of attack.)

**Load indicator.** Multiply dynamic pressure by the angle in degrees:

$$
\bar{q}\alpha = 31.3 \times 4 = 125\ \mathrm{kPa\cdot deg}.
$$

**Normal force.** The force formula needs the angle in radians. $4^\circ$ is $4 \times \pi/180 = 0.0698$ rad, so

$$
N = 1.317 \times 10^6 \times 0.0698 = 92\ \mathrm{kN}.
$$

**Bending moment.** That force acts on the fairing some 20 m forward of the middle of the body, and the vehicle's sideways acceleration only partly relieves it. So the bending moment at mid-body is of order $92\ \mathrm{kN} \times 20\ \mathrm{m} \approx 1.8\ \mathrm{MN\cdot m}$ — somewhere in the range $1.5$–$2\ \mathrm{MN\cdot m}$.

**Stress.** A tank wall of radius 1.83 m (a 3.66 m diameter) and 4 mm thickness resists bending with a **section modulus** of about $\pi r^2 t$:

$$
\pi \times 1.83^2 \times 0.004 = 0.042\ \mathrm{m^3}.
$$

Dividing the moment by it gives a bending stress of about $1.8 \times 10^6 / 0.042 \approx 4.3 \times 10^7$ pascals, or 43 MPa — of order $40\ \mathrm{MPa}$.

**Sanity check.** That is modest next to the strength of aluminium alloy (hundreds of MPa). But it adds to the squeeze from thrust and drag, the tank pressure loads and the shaking of a gusty ride, and thin pressurized shells fail by **[[buckling|buckling]]** — crumpling sideways — long before the metal yields. The envelope is set by that combination, and 125 kPa·deg would exceed it on many vehicles.
:::

::: key
$\bar{q}\alpha$ is the product of dynamic pressure and angle of attack. It is proportional to the aerodynamic normal force $N = \bar{q} S C_{N\alpha}\alpha$ and therefore to the bending moment on the airframe, which makes it a hard structural constraint during ascent, typically quoted in kPa·deg.
:::

Where does the angle of attack come from? The planned path is designed for $\alpha \approx 0$ — that is what a gravity turn is. The average wind, measured a few hours before launch, is designed *out* too: the steering programs are recomputed so the vehicle flies nose-into the measured wind. This is **[[wind biasing|wind-biasing]]**, the day-of-launch steering update. What is left — the error in the wind measurement, shears and gusts nobody can see coming, and the controller's own small errors — is what load relief handles.

## The rigid rocket in a wind

Lesson 6 wrote the pitch motion with a few terms left out. Put them back.

Let $z$ be the sideways distance from the planned path, measured in the direction the normal force pushes. Read $\ddot z$ as "z double-dot": the sideways acceleration. Let $\theta$ be the attitude error (how far the nose is turned from the planned direction), $\delta$ the gimbal angle, $T$ the thrust, $I$ the pitch moment of inertia, $V$ the airspeed and $\alpha_w$ ("alpha sub w") the angle of attack the wind alone would cause. The pitch-plane equations are

$$
I\ddot\theta = N_\alpha\ell_\alpha\alpha + T\ell_T\delta, \qquad
m\ddot z = N_\alpha\alpha - T\delta + T\theta, \qquad
\alpha = \theta + \alpha_w - \frac{\dot z}{V}.
$$

In words: the air and the engine both twist the rocket; the air, the engine's sideways push and one new term move it sideways; and the angle of attack is the nose's own turn, plus the wind, minus the effect of the rocket already sliding sideways.

The new term is $T\theta$. When the nose turns away from the planned direction by $\theta$, the *whole* thrust turns with it and gets a sideways part, $T\sin\theta \approx T\theta$. Per radian, this is much bigger than the air's push. For the example booster (mass 380 t, thrust 7.6 MN):

$$
\frac{T}{m} = 20\ \mathrm{m/s^2} \quad\text{against}\quad \frac{N_\alpha}{m} = 3.5\ \mathrm{m/s^2}.
$$

This thrust-tilt term is how load relief costs you trajectory.

### The settled picture

Take a steady wind $\alpha_w$ and ask where the vehicle ends up once everything has settled. This **quasi-static** picture holds for wind changes slower than the control loop.

Settled means $\ddot\theta = 0$, so the gimbal must exactly balance the air's twisting moment. This is **trim**:

$$
\delta = -\frac{N_\alpha\ell_\alpha}{T\ell_T}\,\alpha = -\frac{\mu_\alpha}{\mu_\delta}\,\alpha .
$$

($\mu_\alpha$, "mu alpha", and $\mu_\delta$, "mu delta", are the moment coefficients of lesson 6. For the example booster their ratio is $0.173$.)

Now put this gimbal angle into the sideways equation. The engine's sideways force is $-T\delta = N_\alpha(\ell_\alpha/\ell_T)\alpha$. It is positive — the *same* direction as the normal force, which surprises people. The air pushes the nose away from the wind, so the engine must twist it back, and from the tail it does that by pushing the tail *away* from the wind, the same way the air pushes the nose. So the air's part of the sideways acceleration is

$$
a_{\text{aero}} = \frac{N_\alpha}{m}\left(1 + \frac{\ell_\alpha}{\ell_T}\right)\alpha \equiv c\,\alpha,
$$

pointing downwind. (The sign $\equiv$ means "which we name".) The number $c$ is the sideways acceleration per radian of angle of attack, from the air plus the engine that trims it. For the example booster, $\ell_\alpha = \ell_T = 26\ \mathrm{m}$, so the bracket is $2$ and

$$
c = 2 \times 3.466 = 6.93\ \mathrm{m/s^2} \text{ per radian},
$$

which is $6.93 \times \pi/180 = 0.121\ \mathrm{m/s^2}$ per degree. Add the thrust tilt and the total sideways acceleration is

$$
a_{\text{lat}} = c\,\alpha + \frac{T}{m}\,\theta, \qquad \theta = \alpha - \alpha_w .
$$

The second equation is the third pitch equation with the $\dot z/V$ term dropped. It is a fair first estimate while the drift speed is small next to the airspeed.

## Attitude hold, load minimum and drift minimum

Two extreme controllers mark the ends of the line.

**Attitude hold.** A perfect attitude loop keeps the nose exactly on plan, $\theta = 0$. Then the whole wind turns into angle of attack: $\alpha = \alpha_w$. The load is $\bar{q}\alpha_w$, and the vehicle is pushed downwind at $a_{\text{lat}} = c\,\alpha_w$.

For a $4^\circ$ wind angle at max-Q:

- load: $31.3 \times 4 = 125\ \mathrm{kPa\cdot deg}$;
- drift: $0.121 \times 4 = 0.48\ \mathrm{m/s^2}$ downwind;
- over a 20 s wind layer: $0.484 \times 20 = 9.7\ \mathrm{m/s}$ of sideways speed, and about $\tfrac{1}{2} \times 0.48 \times 20^2 \approx 100\ \mathrm{m}$ of sideways distance.

The path error is modest; the load is not.

**Load minimum.** Turn the nose fully into the wind, $\theta = -\alpha_w$, so that $\alpha = 0$. The load vanishes. But now the thrust points $\alpha_w$ away from the planned direction, and

$$
a_{\text{lat}} = -\frac{T}{m}\alpha_w = -20 \times 0.0698 = -1.40\ \mathrm{m/s^2},
$$

*upwind* — about three times the attitude-hold drift, the other way: $28\ \mathrm{m/s}$ over 20 s. Zero load buys a big path error, and it cannot even be reached, because gusts arrive faster than the loop can turn the nose.

One point between these two deserves a name. Ask for zero sideways acceleration — the rocket stays on its planned path while the wind blows. Set $a_{\text{lat}} = 0$ and use $\theta = \alpha - \alpha_w$:

$$
c\,\alpha = \frac{T}{m}(\alpha_w - \alpha).
$$

Collect the $\alpha$ terms on the left, divide through by $T/m$, and use $c/(T/m) = (N_\alpha/T)(1 + \ell_\alpha/\ell_T)$:

$$
\frac{\alpha}{\alpha_w}\bigg|_{\text{drift min}} = \frac{1}{1 + \dfrac{N_\alpha}{T}\left(1 + \dfrac{\ell_\alpha}{\ell_T}\right)} .
$$

This is the **[[drift-minimum|three-cases]]** condition, worked out for the Saturn rockets in the 1960s. For the example booster $N_\alpha/T = 1.317/7.6 = 0.173$, so

$$
\frac{\alpha}{\alpha_w} = \frac{1}{1 + 0.173 \times 2} = \frac{1}{1.346} = 0.743 .
$$

In a $4^\circ$ wind: turn the nose $1.0^\circ$ into the wind, carry $3.0^\circ$ of angle of attack ($93\ \mathrm{kPa\cdot deg}$), and the air's push downwind exactly cancels the thrust's push upwind. Turn further than this and you are trading path for load. Turn less and you are paying in both.

## Load relief with an accelerometer

How does the controller know how much to turn? It cannot measure the wind, but it can feel the rocket being shoved sideways.

An **[[accelerometer|accelerometer]]** is a sensor that measures the push on the vehicle from everything except gravity (engineers call that the **specific force**). One mounted sideways on the body feels the air plus engine push, which in trim is $c\,\alpha$. So its reading is a direct, if noisy, stand-in for the angle of attack that needs no wind estimate. The control law adds it to the usual terms:

$$
\delta = -K_p\,\theta - K_d\,\dot\theta - K_a\,a_{\text{meas}}.
$$

$K_p$ and $K_d$ are the attitude and rate gains from lesson 6. $K_a$ ("K sub a") is the new **load-relief gain**, in radians of gimbal per m/s² of measured acceleration.

What does it do once things settle? In the quasi-static limit the rate is zero, $\dot\theta = 0$, and the reading is $a_{\text{meas}} = c\,\alpha$. The gimbal must still be the trim value $\delta = -(\mu_\alpha/\mu_\delta)\alpha$. Set the two expressions for $\delta$ equal and put in $\theta = \alpha - \alpha_w$:

$$
-\frac{\mu_\alpha}{\mu_\delta}\alpha = -K_p(\alpha - \alpha_w) - K_a c\,\alpha .
$$

Move every $\alpha$ term to one side: $\alpha\,(K_p + K_a c - \mu_\alpha/\mu_\delta) = K_p\,\alpha_w$. Divide:

$$
\frac{\alpha}{\alpha_w} = \frac{K_p}{K_p + K_a c - \mu_\alpha/\mu_\delta} .
$$

With $K_a = 0$ it is $K_p/(K_p - \mu_\alpha/\mu_\delta)$, which is *bigger than one*. A real attitude loop with finite gain on an unstable rocket lets the wind through slightly amplified. With $K_p = 1.88$ and $\mu_\alpha/\mu_\delta = 0.173$,

$$
\frac{\alpha}{\alpha_w} = \frac{1.88}{1.88 - 0.173} = 1.10 .
$$

The air keeps pushing the nose away from the wind, and the loop holds it back only with a small leftover error. Now raise $K_a$: the bottom of the fraction grows and the ratio falls toward zero. The attitude error is $\theta = \alpha - \alpha_w$, which is negative: the nose turns into the wind by exactly the angle of attack that was removed.

::: example Choosing a load-relief gain
The example booster: $K_p = 1.88$, $\mu_\alpha/\mu_\delta = 0.173$, $c = 6.93\ \mathrm{m/s^2}$ per radian, $T/m = 20\ \mathrm{m/s^2}$. The wind angle is $4^\circ$. Aim for half the wind as angle of attack, $\alpha/\alpha_w = 0.5$.

**The gain.** Turn the formula around to solve for $K_a c$. Flip both sides: $(K_p + K_a c - 0.173)/K_p = 1/0.5$. Multiply by $K_p$ and move the other terms across:

$$
K_a c = \frac{K_p}{0.5} - K_p + 0.173 = 3.76 - 1.88 + 0.173 = 2.05 .
$$

So $K_a = 2.05/6.93 = 0.30$ rad per m/s². In degrees, that is 17° of gimbal for every m/s² of measured sideways acceleration.

**What it gives.**

- Angle of attack $2.0^\circ$, so a load of $31.3 \times 2 = 63\ \mathrm{kPa\cdot deg}$ — down from 125.
- Attitude error $\theta = 2.0 - 4 = -2.0^\circ$: the nose points two degrees into the wind.
- Sideways acceleration $a_{\text{lat}} = c\alpha + (T/m)\theta$, using $c = 0.121$ per degree and $2^\circ = 0.0349$ rad: $0.121 \times 2 - 20 \times 0.0349 = 0.24 - 0.70 = -0.46\ \mathrm{m/s^2}$, upwind.
- Over a 20 s wind layer: $0.456 \times 20 \approx 9.1\ \mathrm{m/s}$ of sideways speed and about $\tfrac{1}{2} \times 0.456 \times 400 \approx 90\ \mathrm{m}$ of sideways distance, upwind. There is also a **steering loss** — thrust wasted because it points off-plan — of $(T/m)(1 - \cos\theta) = 20 \times (1 - \cos 2^\circ) = 0.012\ \mathrm{m/s^2}$. That is tiny.

**Compare the drift-minimum gain.** For $\alpha/\alpha_w = 0.743$: $K_a c = 1.88/0.743 - 1.88 + 0.173 = 0.82$, so $K_a = 0.12$. It gives $93\ \mathrm{kPa\cdot deg}$ with zero drift.

**The trade.** The first 32 kPa·deg of relief (from 125 down to 93) is free — no drift at all. The next 30 (from 93 down to 63) costs about 9 m/s of sideways speed that guidance must remove later. That is the trade the exercise asks you to state.

**Sanity check.** Half the angle of attack gave half the load, 63 against 125, as it must.
:::

::: key
Load relief: the controller partially steers into the wind, accepting attitude and trajectory error to reduce $\alpha$ and hence $\bar{q}\alpha$. The cost is insertion accuracy and extra $\Delta v$; the benefit is not breaking the vehicle. It is active only through the high-$\bar{q}$ region.
:::

## What the trade costs later

The sideways speed built up during load relief does not vanish when $\bar{q}$ does. Through the thick air, ascent guidance is **open-loop**: it follows a stored, wind-biased pitch program and does not try to fix the path. The **[[closed-loop guidance|guidance-takeover]]** that steers to the target orbit takes over only once dynamic pressure has fallen away, typically two to three minutes into flight. It must then steer out the error, using thrust that would otherwise have gone into the orbit: a few metres per second of $\Delta v$ ("delta-v", change in velocity) for a typical wind, tens for a severe one, plus a scatter in the state at staging that the upper stage must absorb. That is the "insertion accuracy and extra $\Delta v$" of the key statement.

The benefit exists only when $\bar{q}$ is large, so the accelerometer gain is **[[scheduled|gain-schedule]]** — changed with time along the flight. It is zero at lift-off, ramps up entering the high-$\bar{q}$ window (roughly 40 to 100 s for the vehicle of lesson 2), and ramps back to zero as dynamic pressure collapses. Outside that window it would only add drift and noise.

Two warnings about the settled picture. First, it assumes the loop has had time to settle. A gust that rises in one second hits a loop with a 0.36 Hz crossover almost at full strength, so the *momentary* $\bar{q}\alpha$ overshoots the settled value; design gust allowances cover that.

Second, the accelerometer feels more than the air. It feels the gimbal's own sideways force $-T\delta/m$, and if it sits a distance $\ell_{\text{acc}}$ from the centre of gravity it feels the spin-up $\ell_{\text{acc}}\ddot\theta$ too. Both feed back through the actuator and reshape the loop, so too large a $K_a$ eats into the phase margin. Load relief is a stability design as much as a load design.

::: warning
Load relief does not mean flying at zero angle of attack. Zero $\alpha$ is the load-minimum extreme, and it steers the vehicle upwind at $T\alpha_w/m$ — three times faster than the wind pushes an attitude-holding vehicle downwind. Every practical design carries part of the wind as angle of attack. Even the drift-minimum point, where the two pushes cancel, still carries three quarters of it.
:::

::: warning
Watch the units of the load indicator. $\bar{q}\alpha$ in kPa·deg uses $\alpha$ in degrees. The normal-force formula uses $\alpha$ in radians. $125\ \mathrm{kPa\cdot deg}$ is $2.18\ \mathrm{kPa\cdot rad}$. An envelope stated in psf·deg must be converted before you compare it with anything.
:::

## Check yourself

::: check
A vehicle at $\bar{q} = 28\ \mathrm{kPa}$ has a certified load-indicator limit of 90 kPa·deg. What total angle of attack does that allow? The mean wind has been biased out, and the leftover wind produces $\alpha_w = 2.5^\circ$. Is the attitude-hold response inside the envelope?
:::

::: answer
The allowed angle of attack is the limit divided by the dynamic pressure: $90/28 = 3.2^\circ$.

Attitude hold gives $\alpha \approx \alpha_w$, or a little more with a finite-gain loop. With the 10 % amplification of the lesson's example, that is about $2.5 \times 1.1 = 2.75^\circ$, and the load is $28 \times 2.75 = 77\ \mathrm{kPa\cdot deg}$. That is inside the envelope, but with only about 13 kPa·deg to spare. A gust adding less than half a degree ($13/28 \approx 0.46^\circ$) would use it all up. Load relief is what provides the margin.
:::

::: check
Explain in physical terms why the gimbal's trim force adds to the air's side force instead of cancelling it. What does that do to the drift of an attitude-holding vehicle?
:::

::: answer
The centre of pressure is forward of the centre of gravity, so the normal force turns the nose away from the wind. To hold attitude, the engine at the tail must push the tail *away* from the wind — the same direction the normal force pushes the nose. Both forces point downwind, and the net sideways force is $N(1 + \ell_\alpha/\ell_T)$, about twice $N$ for the example booster. So an attitude-holding vehicle drifts downwind faster than the air alone would carry it.
:::

::: check
For the example booster, what accelerometer gain $K_a$ makes $\alpha/\alpha_w = 0.25$? What sideways acceleration results in a $4^\circ$ wind? Compare with the $\alpha/\alpha_w = 0.5$ design.
:::

::: answer
The gain: $K_a c = K_p/0.25 - K_p + 0.173 = 7.52 - 1.88 + 0.173 = 5.81$, so $K_a = 5.81/6.93 = 0.84$ rad per m/s².

The result: the angle of attack is $1^\circ$ (31 kPa·deg) and the attitude error is $1 - 4 = -3^\circ$. With $3^\circ = 0.0524$ rad,

$a_{\text{lat}} = 0.121 \times 1 - 20 \times 0.0524 = 0.12 - 1.05 = -0.93\ \mathrm{m/s^2}$, upwind.

Against the 0.5 design: twice the drift for another 32 kPa·deg of relief, and a gain almost three times larger ($0.84$ against $0.30$), which eats into the attitude loop's margins.
:::

::: check
Why is load relief switched off outside the high-dynamic-pressure window, instead of being left on for the whole climb?
:::

::: answer
Its benefit, a smaller $\bar{q}\alpha$, is only worth having when $\bar{q}$ is big enough for $\alpha$ to threaten the structure. Its costs — drift from tilting the thrust, plus the noise and phase loss of the accelerometer loop — are paid whenever the gain is not zero. Above 40–60 km the dynamic pressure is a few kilopascals or less: even large angles of attack are harmless there, while every degree of attitude error steers the path off course. So the gain is scheduled to zero outside the window.
:::

::: check
A 30 m/s wind shear over one kilometre of altitude is crossed in three seconds at 420 m/s airspeed. Using the settled formula, what does the load-relief loop of the worked example do to the resulting $\alpha$? Why will the real peak $\bar{q}\alpha$ be higher than that?
:::

::: answer
The shear produces $\alpha_w = \arctan(30/420) = 4.1^\circ$. In the settled picture, the $\alpha/\alpha_w = 0.5$ design holds $\alpha$ at about $2.0^\circ$, which is 63 kPa·deg at 31.3 kPa.

But the shear arrives in three seconds, and a loop with a 0.36 Hz crossover takes a second or two to respond. For the first second or so the vehicle feels close to the full $4.1^\circ$. The momentary peak lies between the two values, and the design must budget for it — the exercise's shear injection shows exactly this spike.
:::

## Summary

| Symbol or fact | Meaning or value |
| --- | --- |
| $\bar{q}\alpha$ | load indicator, kPa·deg; proportional to $N$ and to the bending moment |
| $N = \bar{q} S C_{N\alpha}\alpha$ | normal force; 92 kN at 4° and 31.3 kPa for the example booster |
| $m\ddot z = N_\alpha\alpha - T\delta + T\theta$ | sideways equation, including the thrust-tilt term $T\theta$ |
| $\delta_{\text{trim}} = -(\mu_\alpha/\mu_\delta)\alpha$ | settled (quasi-static) trim gimbal |
| $c = (N_\alpha/m)(1 + \ell_\alpha/\ell_T)$ | air plus trim-gimbal sideways acceleration per radian of $\alpha$ |
| $a_{\text{lat}} = c\alpha + (T/m)\theta$ | total sideways acceleration; $\theta = \alpha - \alpha_w$ |
| Attitude hold | $\alpha = \alpha_w$: full load, downwind drift $c\alpha_w$ |
| Load minimum | $\alpha = 0$: no load, upwind drift $(T/m)\alpha_w$ |
| Drift minimum | $\alpha/\alpha_w = 1/[1 + (N_\alpha/T)(1 + \ell_\alpha/\ell_T)]$, 0.743 for the example |
| Accelerometer law | $\alpha/\alpha_w = K_p/(K_p + K_a c - \mu_\alpha/\mu_\delta)$ |
| Cost of relief | sideways speed and position error, extra $\Delta v$ at guidance takeover; used only through high $\bar{q}$ |

So far the wind has been a single number, $\alpha_w$. The next lesson describes the real thing: average wind profiles, shear, sudden gusts, and the Dryden and von Kármán turbulence models a simulation uses to create them.

::: context bending-beam Where a beam bends most
Hold a ruler in the middle and press down on both ends: it curves, and the strain is worst in the middle. A rocket in a crosswind is loaded the same way. The air pushes near the nose, the trimming engine pushes near the tail (the same way), and the rocket's own mass, dragged sideways, pushes back along the whole length. The bending moment is zero at the free ends and largest near the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="42" width="280" height="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="320,42 320,58 340,50" fill="#1f2a44"/>
  <line x1="300" y1="100" x2="300" y2="66" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,60 294,72 306,72" fill="#b4232c"/>
  <text x="300" y="114" font-size="11" text-anchor="middle" fill="#b4232c">air load</text>
  <line x1="50" y1="100" x2="50" y2="66" stroke="#f2b880" stroke-width="3"/>
  <polygon points="50,60 44,72 56,72" fill="#f2b880"/>
  <text x="50" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">engine</text>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="110" y1="14" x2="110" y2="34"/><line x1="150" y1="14" x2="150" y2="34"/><line x1="190" y1="14" x2="190" y2="34"/><line x1="230" y1="14" x2="230" y2="34"/>
  </g>
  <g fill="#6c7a93">
    <polygon points="110,40 106,32 114,32"/><polygon points="150,40 146,32 154,32"/><polygon points="190,40 186,32 194,32"/><polygon points="230,40 226,32 234,32"/>
  </g>
  <text x="170" y="12" font-size="11" text-anchor="middle" fill="#6c7a93">inertial relief</text>
  <line x1="40" y1="170" x2="320" y2="170" stroke="#1f2a44" stroke-width="1"/>
  <path d="M40,170 Q180,70 320,170" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#1d6fd1">bending moment</text>
</svg>
```
:::

::: context kpa-deg Why such an odd unit
Multiplying a pressure by an angle looks strange, but it is honest bookkeeping. For a given rocket at a given Mach number, the normal force is (area) × (slope) × $\bar{q}$ × $\alpha$, and the area and slope are fixed. So $\bar{q}\alpha$ alone ranks every moment of flight by how hard the structure is loaded, without redoing the aerodynamics each time.

Degrees are used because people think in degrees. The Space Shuttle era quoted limits in psf·deg; converting needs $1\ \mathrm{kPa} = 20.9\ \mathrm{psf}$. Always check which unit a limit is in before comparing.
:::

::: context buckling Why thin shells crumple
Stand an empty soda can upright and you can balance a surprising weight on it. Put a tiny dent in its side and it folds almost at once. The metal did not get weaker — the shape did. A thin wall under squeezing can suddenly bow out sideways, and once it starts it keeps going. That is **buckling**.

Rocket tanks are thin shells too, so buckling, not the raw strength of the metal, usually sets their limit. Pressurizing the tank helps, the way a sealed full can is far stiffer than an open one, which is one reason tanks are kept pressurized during flight.
:::

::: context wind-biasing Steering into the measured wind
On launch morning, weather balloons (and on some ranges, radar) measure the wind at every altitude. The team then recomputes the rocket's steering program so it leans into that wind all the way up, keeping the average angle of attack near zero. NASA's Space Shuttle did this routinely; its version was called the day-of-launch I-load update.

This removes the *average* wind only. Anything that changes after the measurement, and every gust smaller than the balloon can resolve, is left for the flight controller — and for load relief.
:::

::: context three-cases Three ways to meet the same wind
The wind comes from the left, so the air flows past the rocket along the dashed line. Angles are exaggerated. Holding attitude leaves the nose straight up and takes the whole wind as angle of attack. Turning fully into the airflow removes the angle of attack but tilts the thrust, which drives the rocket upwind. The drift minimum turns the nose about a quarter of the way, so the air's push and the thrust's push cancel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <text x="180" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">wind from the left →   dashed: airflow direction</text>
  <line x1="60" y1="108" x2="33.3" y2="34.7" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <g transform="rotate(0 60 108)">
    <rect x="53" y="68" width="14" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="53,68 67,68 60,52" fill="#1f2a44"/>
  </g>
  <text x="60" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">attitude hold</text>
  <text x="60" y="194" font-size="12" text-anchor="middle" fill="#b4232c">α = α_w</text>
  <line x1="180" y1="108" x2="153.3" y2="34.7" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <g transform="rotate(-5.1 180 108)">
    <rect x="173" y="68" width="14" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="173,68 187,68 180,52" fill="#1f2a44"/>
  </g>
  <text x="180" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">drift minimum</text>
  <text x="180" y="194" font-size="12" text-anchor="middle" fill="#b4232c">α ≈ 0.74 α_w</text>
  <line x1="300" y1="108" x2="273.3" y2="34.7" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <g transform="rotate(-20 300 108)">
    <rect x="293" y="68" width="14" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="293,68 307,68 300,52" fill="#1f2a44"/>
  </g>
  <text x="300" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">load minimum</text>
  <text x="300" y="194" font-size="12" text-anchor="middle" fill="#b4232c">α = 0</text>
</svg>
```
:::

::: context accelerometer What an accelerometer feels
Inside an accelerometer is, in effect, a tiny weight on a spring. When the case is shoved sideways, the weight lags behind and stretches the spring; the stretch is the reading. Gravity pulls the weight and the case equally, so it never shows up — the sensor feels only pushes from outside, like the air and the engine. That quantity is the specific force.

It is the same feeling you get in a car turning a corner: you are pressed against the door by the push of the seat and door, not by anything you can see.
:::

::: context guidance-takeover Why guidance waits for thin air
Low in the atmosphere, steering hard to correct the path would raise the angle of attack exactly when $\bar{q}$ is highest — trading a small path error for a broken rocket. So the first two to three minutes fly a stored, wind-biased program, and the attitude loop only keeps the nose where the program says.

Once dynamic pressure has fallen away, the closed-loop guidance switches on. It measures where the vehicle really is and how fast it is going, and steers the rest of the way to the target orbit, cleaning up everything load relief and the wind left behind. The guidance module later in the course builds that algorithm.
:::

::: context gain-schedule A gain that follows the dynamic pressure
The load-relief gain $K_a$ (blue) is off at lift-off, ramps up as $\bar{q}$ (grey sketch) grows, holds through the peak and ramps off again as the air thins. The times are illustrative for a vehicle whose max-Q is near 70 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,159.6 45,159.4 50,159.1 55,158.7 60,158.2 65,157.5 70,156.5 75,155.3 80,153.8 85,151.8 90,149.5 95,146.6 100,143.1 105,139.0 110,134.4 115,129.1 120,123.2 125,116.8 130,110.1 135,103.0 140,95.9 145,88.8 150,82.1 155,75.9 160,70.5 165,66.1 170,62.7 175,60.7 180,60.0 185,60.7 190,62.7 195,66.1 200,70.5 205,75.9 210,82.1 215,88.8 220,95.9 225,103.0 230,110.1 235,116.8 240,123.2 245,129.1 250,134.4 255,139.0 260,143.1 265,146.6 270,149.5 275,151.8 280,153.8 285,155.3 290,156.5 295,157.5 300,158.2 305,158.7 310,159.1 315,159.4 320,159.6 325,159.7 330,159.8 335,159.9 340,159.9" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polyline points="40,160 120,160 140,90 220,90 240,160 340,160" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="180" y="52" font-size="12" text-anchor="middle" fill="#6c7a93">q̄</text>
  <text x="180" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">K_a</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="176">0</text><text x="120" y="176">40</text><text x="180" y="176">70</text><text x="240" y="176">100</text><text x="340" y="176">150 s</text>
  </g>
</svg>
```
:::
