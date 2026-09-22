---
id: l05-the-gravity-turn
title: "The gravity turn"
minutes: 17
covers:
  - the gravity turn as the zero-angle-of-attack special case
---

A launch vehicle is a long thin tube full of pressurised propellant, and the thing it is least able to survive is being bent. Point it even a couple of degrees away from the oncoming air at high dynamic pressure and the aerodynamic force distributed along its side produces a bending moment that sizes the structure — which means it sizes the dry mass, which by the rocket equation sizes the payload. The gravity turn exists to make that force zero.

The idea is one line. Fly with the angle of attack held at zero, so the vehicle's axis is always aligned with its own velocity vector, and let gravity do all the pitching. Put $\alpha = 0$ and $L = 0$ into the flight-path-angle equation from the previous lesson and everything on the right disappears except the gravity term:

$$
mv\dot\gamma = -mg\cos\gamma
\quad\Longrightarrow\quad
\dot\gamma = -\frac{g}{v}\cos\gamma.
$$

That is the gravity turn. This lesson establishes why it is flown, what has to happen to start it, how sensitive the resulting trajectory is to that start, and where it stops being the right thing to do. It is also a good demonstration of a habit this round rewards: a special case that collapses an equation to one term is usually worth finding, and saying *"let me look at the special case first"* is a legitimate move at a whiteboard.

## Why zero angle of attack

Three separate benefits, and an interviewer will want at least two.

**No aerodynamic side load.** The normal force on a slender body is proportional to the angle of attack, so at $\alpha = 0$ it vanishes and the bending moment along the vehicle goes with it. The load metric used in practice is the product $\bar q\alpha$ — dynamic pressure times angle of attack — and the gravity turn drives its second factor to zero through the part of flight where the first factor is largest.

**No aerodynamic moment to trim.** A launch vehicle is usually aerodynamically unstable: its centre of pressure sits ahead of its centre of mass, so any angle of attack produces a moment that increases the angle of attack. At $\alpha = 0$ that moment is zero and the thrust vector control system has nothing to fight except wind, thrust misalignment and slosh. Holding an attitude against the airstream, by contrast, means gimballing continuously, which costs control authority and adds a $\cos\delta$ loss to the thrust.

**It is free.** The turn is performed by gravity, a force that is acting anyway. Any pitch profile that is not a gravity turn has to be paid for with angle of attack, which means with structure.

::: key
The gravity turn is the zero-angle-of-attack special case, $\alpha = 0$, in which the flight path angle evolves as $\dot\gamma = -(g/v)\cos\gamma$. Gravity alone pitches the vehicle over. It minimises aerodynamic side loads and needs no control effort to hold an attitude against the airstream.
:::

## Starting it: the pitch-over kick

Look at the equation at liftoff. The vehicle rises vertically, $\gamma = 90^\circ$, and $\cos 90^\circ = 0$, so $\dot\gamma = 0$. A vehicle flying straight up at zero angle of attack stays flying straight up forever. The gravity turn cannot start itself.

So it is started deliberately, with a small manoeuvre called the **pitch-over kick**: shortly after clearing the tower, while the speed is still low and the dynamic pressure negligible, the vehicle gimbals briefly to pitch a degree or two away from vertical, then returns the gimbal to neutral. From then on $\cos\gamma \neq 0$, gravity has a component across the velocity vector, and the turn proceeds on its own.

Two things make the kick cheap at that moment. The dynamic pressure is tiny, so the brief non-zero angle of attack costs almost nothing structurally. And $\dot\gamma$ scales as $1/v$, so at low speed a small angular displacement grows quickly — the same kick applied later would barely bend the trajectory.

::: warning The kick is an open-loop decision with a closed-loop consequence
Nothing after the kick corrects the flight path angle back towards a plan: the trajectory is then an initial-value problem. A kick that is a fraction of a degree too shallow leaves the vehicle too steep at staging, wasting $\Delta v$ on altitude it does not need; too deep and it is too flat, spending longer in the atmosphere and possibly failing a structural or heating constraint. This is why launch vehicles fly a pre-computed pitch profile rather than a pure gravity turn — the pure version is an idealisation used to understand the shape.
:::

::: example Integrating a gravity turn, twice
**Model and assumptions.** Flat, non-rotating Earth. No drag — so burnout speeds here are optimistic by roughly fifty metres per second. Constant thrust $T = 7.00\,\mathrm{MN}$, $I_{sp} = 300\,\mathrm{s}$, liftoff mass $5.00\times 10^5\,\mathrm{kg}$, burn time 160 s. Vertical rise until $v = 60\,\mathrm{m/s}$, then an instantaneous kick of $\theta_k$ degrees, then $\alpha = 0$ throughout.

**Check the setup before integrating.** Liftoff thrust-to-weight is $7.0\times 10^6/(5.00\times 10^5 \times 9.80665) = 1.43$ — above one, so it leaves the pad, and not so far above that the vehicle is over-accelerating through max-Q. Propellant flow is $7.0\times 10^6/(300 \times 9.80665) = 2379\,\mathrm{kg/s}$, so the stage burns $2379.3 \times 160 = 380690\,\mathrm{kg}$ and ends at 119.3 t.

**Integrate** the five equations of the previous lesson with $\alpha = 0$, $D = L = 0$, at a 1 ms step:

| Kick $\theta_k$ | Burnout speed | Burnout $\gamma$ | Burnout altitude |
| --- | --- | --- | --- |
| $1.5^\circ$ | 2973 m/s | $29.7^\circ$ | 94.8 km |
| $2.0^\circ$ | 3130 m/s | $17.4^\circ$ | 74.7 km |

**Read it.** Half a degree of difference at 60 m/s, applied about eight seconds into the flight, changes the flight path angle at staging by 12.3 degrees and the staging altitude by 20 km. That extreme sensitivity is the single most important property of the gravity turn and the reason the kick is the most carefully tuned number in an ascent design.

**Sanity check.** The shallower trajectory is faster (3130 against 2973 m/s) and lower, which is right: less of the burn was spent climbing, so less of it was spent fighting gravity. The two effects have to trade against each other, and they do.
:::

::: example Gravity loss for the flown trajectory
Take the $2.0^\circ$ case. What did gravity cost?

**Ideal $\Delta v$.** Mass ratio $500/119.3 = 4.191$, and $\ln 4.191 = 1.4329$, so with $c = 2942\,\mathrm{m/s}$ the rocket equation gives $2942 \times 1.4329 = 4215.6\,\mathrm{m/s}$.

**Delivered.** The integration ended at 3129.6 m/s from a standing start.

**Gravity loss.** $4215.6 - 3129.6 = 1086.0\,\mathrm{m/s}$, which is 25.8 per cent of the ideal figure.

**Cross-check against the integral.** The loss must equal $\int_0^{160} g\sin\gamma\,dt$. An upper bound is flying vertically the whole way, $9.80665 \times 160 = 1569\,\mathrm{m/s}$; the computed 1086 m/s is 69 per cent of that, consistent with a trajectory that spends its first third steep and its last third fairly flat. It also sits inside the 1.0–1.5 km/s band that lesson 3 gave for ascent gravity losses. Two independent checks agreeing is worth saying out loud.

**Uncertainty.** The largest omission is drag, worth tens of metres per second for a vehicle this size, and the second largest is the constant-$c$ assumption, worth of order a hundred. Neither changes the conclusion that gravity is the dominant loss.
:::

## Why not simply kick harder

If a flatter trajectory is faster, why not pitch over aggressively and stay low?

Because three constraints bite, and naming them is the expected follow-up.

**Dynamic pressure and heating.** Staying low means passing through dense air at high speed. Max-Q rises, aerodynamic loads rise with it, and the fairing's thermal environment worsens.

**Altitude at staging.** The second stage has to finish the job somewhere the atmosphere is thin enough not to matter. A booster that hands over at 40 km leaves the upper stage to fight drag it was never designed for.

**The flight path angle at orbit insertion must be close to zero.** A vehicle arriving at orbital speed with a large positive $\gamma$ is on an ellipse whose perigee is inside the atmosphere. Getting $\gamma$ to zero at the right moment is the actual guidance objective, and the gravity turn is a way of arriving there with the least structural cost, not the fastest way of gaining speed.

The real profile is therefore a compromise, tuned so the vehicle is near zero angle of attack through the high-dynamic-pressure region and free to manoeuvre afterwards.

## Where the gravity turn ends

Above roughly 60 to 80 km the dynamic pressure has fallen to the point where angle of attack costs nothing structurally. At that point the reason for $\alpha = 0$ disappears, and the vehicle switches to a guidance law that commands attitude to meet the terminal conditions — the correct velocity, flight path angle and altitude at cutoff — rather than letting gravity choose them.

That transition is worth mentioning at a board because it separates two regimes an interviewer may probe: inside the atmosphere the trajectory is load-limited, outside it the trajectory is optimisation-limited. The equations are the same; only the active constraint changes.

## Check yourself

::: check
Starting from the planar equations, derive the gravity-turn relation and state the two assumptions that produce it.
:::

::: answer
The flight-path-angle equation is $mv\dot\gamma = T\sin\alpha + L - mg\cos\gamma$. Set $\alpha = 0$, which kills the thrust term, and $L = 0$, which is consistent — lift on a slender body at zero angle of attack is zero. That leaves

$$
mv\dot\gamma = -mg\cos\gamma \quad\Longrightarrow\quad \dot\gamma = -\frac{g}{v}\cos\gamma.
$$

The mass cancels, which is worth remarking on: the rate at which gravity turns the vehicle does not depend on how heavy it is. The two assumptions are zero angle of attack and no lift; the flat-Earth and no-wind assumptions were already in the equation you started from.
:::

::: check
A vehicle is flying a gravity turn at $v = 1500\,\mathrm{m/s}$ and $\gamma = 40^\circ$. How fast is its flight path angle changing, in degrees per second, and how long would it take to reach the horizontal if the rate stayed the same?
:::

::: answer
$\dot\gamma = -(g/v)\cos\gamma$. With $g/v = 9.80665/1500 = 0.006538\,\mathrm{s^{-1}}$ and $\cos 40^\circ = 0.76604$:

$$
\dot\gamma = -0.006538 \times 0.76604 = -0.00501\,\mathrm{rad/s},
$$

which is $-0.287$ degrees per second.

At a constant rate, reaching $\gamma = 0$ from $40^\circ$ would take $40/0.287 = 139\,\mathrm{s}$. The true time is shorter at first and longer later: as $\gamma$ falls, $\cos\gamma$ grows towards 1, which speeds the turn, while $v$ grows, which slows it. Saying which way each factor pushes is the part that shows you understand the equation rather than having evaluated it.
:::

::: check
Why can a gravity turn not begin without a deliberate manoeuvre?
:::

::: answer
Because $\gamma = 90^\circ$ is an equilibrium of the gravity-turn equation. At exactly vertical, $\cos\gamma = 0$, so $\dot\gamma = 0$, and a vehicle flying straight up at zero angle of attack has no mechanism to depart from vertical: gravity is exactly anti-parallel to the velocity and has no component across it.

So the vehicle performs a pitch-over kick — a brief commanded gimbal a few seconds after liftoff — to establish a small non-zero displacement from vertical. After that, $\cos\gamma \neq 0$ and the turn is self-sustaining. The kick is done early because $\dot\gamma \propto 1/v$, so it has the most effect when the vehicle is slow, and because the dynamic pressure is still negligible, so the momentary angle of attack is structurally free.
:::

::: check
Two vehicles fly identical gravity turns except that one has twice the thrust-to-weight ratio. Which reaches orbit with less gravity loss, and why?
:::

::: answer
The higher thrust-to-weight vehicle, because gravity loss is $\int g\sin\gamma\,dt$ and the dominant variable in that integral is the **time** spent under thrust at a steep angle. Accelerating harder shortens the burn, so there is less of it to integrate over.

The limit makes it obvious: an impulsive burn has zero duration and therefore zero gravity loss, which is why orbital manoeuvres are modelled as impulsive. The opposite limit is a vehicle hovering at thrust-to-weight exactly 1, which spends propellant at full rate and gains no speed at all.

The countervailing costs, which you should name: higher thrust-to-weight means more engine mass, higher max-Q because the vehicle reaches high speed while still low in the atmosphere, and higher structural loads. Launch vehicles typically lift off between about 1.2 and 1.5 for this reason rather than as high as the engines would allow.
:::

::: check
An interviewer says: "You have told me the gravity turn minimises loads. Show me that it is not simply the fastest route to orbit."
:::

::: answer
It is not, and the demonstration is in the worked example: the flatter of the two trajectories reached a higher speed at burnout, 3130 m/s against 2973 m/s. If speed were the only objective, you would kick harder.

The reason you do not is that orbit is a state, not a speed. Insertion requires the right speed *and* a flight path angle near zero *and* an altitude above the atmosphere, all at the same instant. Trajectories that gain speed fastest arrive low and often still climbing steeply, which is an ellipse with its perigee inside the atmosphere — not an orbit.

The gravity turn is the shape that gets to the required terminal state while holding $\bar q\alpha$ near zero through the load-critical region. It is a constrained optimum, and the constraint is structural. Saying "constrained optimum, and here is the constraint" is the whole answer.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gravity turn | The $\alpha = 0$ special case; gravity alone pitches the vehicle |
| Governing equation | $\dot\gamma = -(g/v)\cos\gamma$; mass cancels |
| Why fly it | Zero aerodynamic side load, zero aerodynamic trim moment, no control effort spent holding attitude |
| Load metric | $\bar q\alpha$, dynamic pressure times angle of attack |
| Starting it | $\gamma = 90^\circ$ is an equilibrium, so a pitch-over kick is required |
| Kick sensitivity | $1.5^\circ$ against $2.0^\circ$ changes burnout $\gamma$ by 12.3° and altitude by 20 km |
| Worked gravity loss | 4215.6 m/s ideal against 3129.6 m/s delivered: 1086.0 m/s, 25.8 % |
| Ends when | Dynamic pressure becomes negligible, around 60–80 km; guidance then commands attitude |

The next lesson gives the vehicle an attitude of its own. Replacing the prescribed $\alpha$ with a rotational state means adding Euler's equation and the moment produced by a gimballed engine, which is the 6-DOF extension the module's first exercise asks you to describe verbally.
