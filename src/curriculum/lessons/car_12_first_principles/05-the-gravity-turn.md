---
id: l05-the-gravity-turn
title: "The gravity turn"
minutes: 17
covers:
  - the gravity turn as the zero-angle-of-attack special case
---

Hold a long drinking straw by one end and wave it through the air point-first. Easy. Now wave it sideways, broadside to the air. It bends and wobbles. A rocket is that straw made huge: a long, thin tube full of propellant under pressure, and the thing it is worst at surviving is being **bent**. Tilt it even a couple of degrees away from the oncoming air while it is moving fast through thick air, and the air pushes on its whole side. That push creates a **[[bending moment|bending-moment]]** — a twisting force that tries to fold the tube — and the structure has to be made strong enough to take it. Stronger means heavier. Heavier empty mass, by the rocket equation, means less payload.

The **gravity turn** exists to make that sideways push zero. The idea fits in one line: keep the angle of attack at zero, so the rocket always points exactly where it is going, and let gravity do all the bending of the path.

Put $\alpha = 0$ and $L = 0$ into the flight-path-angle equation from the last lesson, and everything on the right disappears except the gravity term:

$$
mv\dot\gamma = -mg\cos\gamma
\quad\Longrightarrow\quad
\dot\gamma = -\frac{g}{v}\cos\gamma.
$$

That is the gravity turn. This lesson covers why it is flown, what has to happen to start it, how touchy the resulting path is to that start, and where it stops being the right thing to do. It also shows off a habit this interview round rewards: a special case that shrinks an equation to one term is usually worth finding. Saying *"let me look at the special case first"* is a perfectly good move at a whiteboard.

## Why zero angle of attack

There are three separate benefits, and an interviewer will want at least two.

**No sideways air load.** The sideways air force on a long, thin body grows in step with the angle of attack. At $\alpha = 0$ it vanishes, and the bending moment along the vehicle goes with it. The load measure engineers use is the product $\bar q\alpha$ — **[[dynamic pressure|dynamic-pressure]]** times angle of attack. Dynamic pressure, $\bar q$ (read "q bar"), is how hard the oncoming air presses on the vehicle; it peaks at a moment called **max-Q**. The gravity turn drives the second factor, $\alpha$, to zero through the part of the flight where the first factor is largest.

**No air-driven twist to fight.** A launch vehicle is usually aerodynamically **unstable**. Its **[[center of pressure|center-of-pressure]]** — the point where the air's push effectively acts — sits ahead of its **center of mass**, the balance point. So any angle of attack makes a twist that *increases* the angle of attack. At $\alpha = 0$ that twist is zero, and the steering system has nothing to fight except wind gusts, small engine misalignments and propellant sloshing in the tanks. Holding some other attitude against the airstream would mean swiveling the engine continuously. That uses up steering ability, and it wastes a little thrust: an engine tilted by $\delta$ (read "delta") pushes forward with only $T\cos\delta$.

**It is free.** Gravity does the turning, and gravity is acting anyway. Any pitch plan that is *not* a gravity turn has to be paid for with angle of attack — which means with structure.

::: key
The gravity turn is the zero-angle-of-attack special case, $\alpha = 0$, in which the flight path angle evolves as $\dot\gamma = -(g/v)\cos\gamma$. Gravity alone pitches the vehicle over. It minimizes aerodynamic side loads and needs no control effort to hold an attitude against the airstream.
:::

Notice the mass canceled. How fast gravity bends the path does not depend on how heavy the rocket is — the same reason a heavy ball and a light ball thrown the same way follow the same arc.

## Starting it: the pitch-over kick

Look at the equation at liftoff. The rocket rises straight up, so $\gamma = 90^\circ$, and $\cos 90^\circ = 0$. That makes $\dot\gamma = 0$. A rocket flying exactly straight up at zero angle of attack stays flying straight up forever. Gravity pulls exactly backward along its path and has no sideways part to bend it. Straight up is an **[[equilibrium|equilibrium]]** — a state that, left alone, stays put. The gravity turn cannot start itself.

So it is started on purpose, with a small move called the **pitch-over kick**. Shortly after clearing the tower, while the rocket is still slow and the air pressure on it is tiny, the engine swivels briefly to tip the rocket a degree or two away from vertical, then goes back to center. From then on $\cos\gamma$ is not zero, gravity has a sideways part across the path, and the turn carries on by itself.

Two things make the kick cheap at that moment:

- The dynamic pressure is tiny, so the brief non-zero angle of attack costs almost nothing in structural load.
- $\dot\gamma$ goes as $1/v$ — the slower the rocket, the faster gravity bends its path. So early on a small tilt grows quickly. The same kick later in flight would barely bend the path.

::: warning The kick is decided once, and the consequences last the whole flight
After the kick, nothing steers the flight path angle back toward a plan: the path becomes an **[[initial-value problem|initial-value]]**, fixed entirely by where it started. A kick a fraction of a degree too small leaves the vehicle too steep when the first stage runs out, wasting $\Delta v$ (said "delta-v", change in velocity) on height it did not need. Too large, and it is too flat — spending longer in thick air and possibly breaking a structural or heating limit. That is why real launch vehicles fly a pre-computed pitch plan rather than a pure gravity turn. The pure version is an idealization used to understand the shape.
:::

::: example Integrating a gravity turn, twice
**Model and assumptions.** Flat, non-rotating Earth. No drag — so the burnout speeds here come out too high, by something like fifty meters per second. Constant thrust $T = 7.00\,\mathrm{MN}$, $I_{sp} = 300\,\mathrm{s}$, liftoff mass $5.00\times 10^5\,\mathrm{kg}$, burn time 160 s. The rocket rises vertically until $v = 60\,\mathrm{m/s}$, then gets an instant kick of $\theta_k$ degrees, then flies at $\alpha = 0$ the rest of the way.

**Check the setup before integrating.** Liftoff **[[thrust-to-weight|thrust-to-weight]]** is $7.0\times 10^6/(5.00\times 10^5 \times 9.80665) = 1.43$. It is above one, so the rocket leaves the pad, and not so far above that it races through max-Q. Propellant flow is $7.0\times 10^6/(300 \times 9.80665) = 2379\,\mathrm{kg/s}$. Over the burn that is $2379.3 \times 160 = 380\,690\,\mathrm{kg}$, so the stage ends at 119.3 t.

**Integrate** the five equations of the last lesson with $\alpha = 0$ and $D = L = 0$, at a 1 ms step:

| Kick $\theta_k$ | Burnout speed | Burnout $\gamma$ | Burnout altitude |
| --- | --- | --- | --- |
| $1.5^\circ$ | 2973 m/s | $29.7^\circ$ | 94.8 km |
| $2.0^\circ$ | 3130 m/s | $17.4^\circ$ | 74.7 km |

**Read it.** A half-degree difference in the kick, applied at 60 m/s about thirteen seconds into flight, changes the flight path angle at staging by $29.7 - 17.4 = 12.3$ degrees and the staging altitude by about 20 km. That extreme sensitivity is the most important property of the gravity turn, and the reason the kick is the most carefully tuned number in an ascent design.

**Sanity check.** The flatter path is faster (3130 against 2973 m/s) and lower. That is right: less of the burn went into climbing, so less of it went into fighting gravity. Speed and height trade against each other, and they do here.
:::

::: example Gravity loss for the flown trajectory
Take the $2.0^\circ$ case. What did gravity cost?

**Ideal $\Delta v$.** The effective exhaust speed is $c = I_{sp}g_0 = 300 \times 9.80665 = 2942\,\mathrm{m/s}$. The mass ratio is $500/119.3 = 4.191$, and $\ln 4.191 = 1.4329$. The rocket equation gives $2942 \times 1.4329 = 4215.6\,\mathrm{m/s}$.

**Delivered.** The integration ended at 3129.5 m/s, starting from rest.

**Gravity loss.** $4215.6 - 3129.5 = 1086.1\,\mathrm{m/s}$, which is $1086.1/4215.6 = 0.258$, or 25.8 percent of the ideal figure.

**Cross-check against the integral.** The loss must equal $\int_0^{160} g\sin\gamma\,dt$ — the **[[gravity loss integral|gravity-loss]]**. The worst case is flying straight up the whole time, where $\sin\gamma = 1$: $9.80665 \times 160 = 1569\,\mathrm{m/s}$. The computed 1086 m/s is 69 percent of that, which fits a path that spends its first third steep and its last third fairly flat. It also sits inside the 1.0–1.5 km/s band that lesson 3 gave for ascent gravity losses. Two independent checks agreeing is worth saying out loud.

**Uncertainty.** The biggest thing left out is drag, worth tens of meters per second for a vehicle this size. The second biggest is assuming $c$ stays constant, worth around a hundred. Neither changes the conclusion that gravity is the dominant loss.
:::

## Why not kick harder?

If a flatter path is faster, why not tip over hard and stay low?

Because three limits bite, and naming them is the expected follow-up.

**Dynamic pressure and heating.** Staying low means moving fast through thick air. Max-Q rises, the air loads rise with it, and the payload **fairing** — the nose cone that shields the satellite — gets hotter.

**Altitude at staging.** The second stage has to finish the job where the air is thin enough not to matter. A booster that hands over at 40 km leaves the upper stage fighting drag it was never designed for.

**The flight path angle at orbit insertion must be close to zero.** Arrive at orbital speed while still climbing steeply, and you are on a stretched orbit whose lowest point, the **[[perigee|perigee]]**, dips inside the atmosphere. Getting $\gamma$ to zero at the right moment is the real guidance goal. The gravity turn is a way of getting there with the least structural cost, not the fastest way to gain speed.

So the real pitch plan is a compromise, tuned so the vehicle is near zero angle of attack through the high-dynamic-pressure part of flight and free to maneuver afterward.

## Where the gravity turn ends

Above roughly 60 to 80 km, the air is so thin that angle of attack costs nothing structurally. The reason for $\alpha = 0$ is gone. The vehicle switches to a **[[guidance law|guidance-law]]** — a rule, run by the flight computer, that commands attitude to hit the targets at engine cutoff (the right speed, flight path angle and altitude) instead of letting gravity choose them.

That handover is worth mentioning at a board, because it separates two regimes an interviewer may probe. Inside the atmosphere the path is **load-limited**. Outside it the path is **optimization-limited**. The equations are the same; only the limit that matters changes.

## Check yourself

::: check
Starting from the planar equations, derive the gravity-turn relation and state the two assumptions that produce it.
:::

::: answer
The flight-path-angle equation is $mv\dot\gamma = T\sin\alpha + L - mg\cos\gamma$. Set $\alpha = 0$, which removes the thrust term. Set $L = 0$, which fits: a slender body at zero angle of attack makes no lift. That leaves

$$
mv\dot\gamma = -mg\cos\gamma \quad\Longrightarrow\quad \dot\gamma = -\frac{g}{v}\cos\gamma.
$$

Divide both sides by $mv$ to get the second form. The mass cancels, which is worth remarking on: how fast gravity turns the vehicle does not depend on how heavy it is. The two assumptions are zero angle of attack and no lift. The flat-Earth and no-wind assumptions were already in the equation you started from.
:::

::: check
A vehicle is flying a gravity turn at $v = 1500\,\mathrm{m/s}$ and $\gamma = 40^\circ$. How fast is its flight path angle changing, in degrees per second, and how long would it take to reach level flight if that rate stayed the same?
:::

::: answer
$\dot\gamma = -(g/v)\cos\gamma$. Here $g/v = 9.80665/1500 = 0.006538\,\mathrm{s^{-1}}$ and $\cos 40^\circ = 0.76604$, so

$$
\dot\gamma = -0.006538 \times 0.76604 = -0.00501\,\mathrm{rad/s},
$$

which, times $180/\pi$, is $-0.287$ degrees per second.

At that steady rate, getting from $40^\circ$ to $0$ would take $40/0.287 = 139\,\mathrm{s}$. The real time differs, because two things change on the way. As $\gamma$ falls, $\cos\gamma$ grows toward 1, which speeds the turn. Meanwhile $v$ grows, which slows it. Saying which way each factor pushes shows you understand the equation, not only that you can plug numbers into it.
:::

::: check
Why can a gravity turn not begin without a deliberate maneuver?
:::

::: answer
Because $\gamma = 90^\circ$ is an equilibrium of the gravity-turn equation. At exactly vertical, $\cos\gamma = 0$, so $\dot\gamma = 0$. A vehicle flying straight up at zero angle of attack has no way to leave vertical: gravity points exactly opposite to the velocity and has no part across it.

So the vehicle performs a pitch-over kick — a brief commanded engine swivel a few seconds after liftoff — to create a small tilt away from vertical. After that, $\cos\gamma$ is not zero and the turn keeps itself going. The kick is done early for two reasons: $\dot\gamma \propto 1/v$ (read "is proportional to"), so a tilt has the most effect while the vehicle is slow; and the dynamic pressure is still tiny, so the brief angle of attack costs nothing structurally.
:::

::: check
Two vehicles fly identical gravity turns except that one has twice the thrust-to-weight ratio. Which reaches orbit with less gravity loss, and why?
:::

::: answer
The one with higher thrust-to-weight. Gravity loss is $\int g\sin\gamma\,dt$, and the biggest factor in that integral is the **time** spent thrusting at a steep angle. Pushing harder shortens the burn, so there is less time for gravity to take its toll.

The extreme cases make it plain. An instant, **impulsive** burn lasts zero time and so has zero gravity loss, which is why orbital maneuvers are often modeled as impulsive. At the other extreme, a vehicle with thrust-to-weight exactly 1 hovers: it burns propellant at full rate and gains no speed at all.

The costs on the other side, which you should name: higher thrust-to-weight means heavier engines, a higher max-Q because the vehicle gets fast while still low in the atmosphere, and higher structural loads. Launch vehicles typically lift off between about 1.2 and 1.5 for these reasons, not as high as the engines would allow.
:::

::: check
An interviewer says: "You have told me the gravity turn minimizes loads. Show me that it is not the fastest route to orbit."
:::

::: answer
It is not, and the worked example shows it: the flatter of the two paths reached a higher speed at burnout, 3130 m/s against 2973 m/s. If speed were the only goal, you would kick harder.

You do not, because orbit is a *state*, not a speed. Insertion needs the right speed *and* a flight path angle near zero *and* an altitude above the atmosphere, all at the same moment. Paths that gain speed fastest arrive low and often still climbing steeply, which puts you on a stretched orbit whose perigee is inside the atmosphere — not a real orbit.

The gravity turn is the shape that reaches the required end state while holding $\bar q\alpha$ near zero through the part of flight where loads are critical. It is a **constrained optimum**, and the constraint is structural. Saying "constrained optimum, and here is the constraint" is the whole answer.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gravity turn | The $\alpha = 0$ special case; gravity alone pitches the vehicle |
| Governing equation | $\dot\gamma = -(g/v)\cos\gamma$; mass cancels |
| Why fly it | Zero aerodynamic side load, zero aerodynamic trim moment, no control effort spent holding attitude |
| Load measure | $\bar q\alpha$, dynamic pressure times angle of attack |
| Starting it | $\gamma = 90^\circ$ is an equilibrium, so a pitch-over kick is required |
| Kick sensitivity | $1.5^\circ$ against $2.0^\circ$ changes burnout $\gamma$ by 12.3° and altitude by 20 km |
| Worked gravity loss | 4215.6 m/s ideal against 3129.5 m/s delivered: 1086.1 m/s, 25.8 % |
| Ends when | Dynamic pressure becomes negligible, around 60–80 km; guidance then commands attitude |

The next lesson gives the vehicle an attitude of its own. Replacing the handed-in $\alpha$ with a rotational state means adding Euler's equation and the moment made by a swiveling engine — the 6-DOF extension the module's first exercise asks you to describe aloud.

::: context bending-moment Why sideways air is so dangerous
Push on the middle of a ruler held at both ends and it bows; push harder and it snaps. A **bending moment** is the turning effect that bows a beam, and it grows with both the push and the length it acts over. A launch vehicle is a very long beam, and a sideways air load spread along it bends it hardest in the middle. Structures engineers size the tank walls for the worst $\bar q\alpha$ the vehicle is expected to see, so every bit of angle of attack flown through max-Q is paid for in metal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="300" y="118" font-size="11" fill="#6c7a93">oncoming air</text>
  <rect x="60" y="50" width="220" height="24" rx="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">vehicle, tilted by α</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="90" y1="100" x2="90" y2="78"/><line x1="130" y1="100" x2="130" y2="78"/><line x1="170" y1="100" x2="170" y2="78"/><line x1="210" y1="100" x2="210" y2="78"/><line x1="250" y1="100" x2="250" y2="78"/>
  </g>
  <g fill="#b4232c">
    <polygon points="90,75 85,84 95,84"/><polygon points="130,75 125,84 135,84"/><polygon points="170,75 165,84 175,84"/><polygon points="210,75 205,84 215,84"/><polygon points="250,75 245,84 255,84"/>
  </g>
  <text x="170" y="30" font-size="12" text-anchor="middle" fill="#b4232c">side load spread along the body bends it</text>
</svg>
```
:::

::: context dynamic-pressure The push you feel from a car window
Put your hand out of a moving car's window. At walking pace you barely feel it; on the highway it shoves your hand back hard. That shove per square meter is **dynamic pressure**: $\bar q = \tfrac{1}{2}\rho v^2$, where $\rho$ (read "rho") is air density. It grows with the square of speed but shrinks with density, and a rocket is speeding up while the air thins out. So $\bar q$ rises, peaks, then falls. The peak is **max-Q**, typically a minute or so into flight, at a few tens of kilopascals. Engines are often throttled down through it.
:::

::: context center-of-pressure Why a dart flies straight and a rocket wants to flip
A dart's feathers put its center of pressure *behind* its center of mass, so if it tilts, the air pushes the tail back into line: stable. Most large rockets have no big fins, and their center of pressure sits *ahead* of the center of mass. Tilt one and the air pushes the nose further round: unstable, like trying to throw a dart backwards. The engine's steering is what keeps it pointed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">dart: stable</text>
  <rect x="20" y="45" width="140" height="16" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="110" cy="53" r="5" fill="#1f2a44"/>
  <text x="110" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">CM</text>
  <circle cx="50" cy="53" r="5" fill="#b4232c"/>
  <text x="50" y="82" font-size="11" text-anchor="middle" fill="#b4232c">CP (behind)</text>
  <text x="90" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">nose →</text>
  <text x="270" y="18" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">rocket: unstable</text>
  <rect x="200" y="45" width="140" height="16" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="53" r="5" fill="#1f2a44"/>
  <text x="250" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">CM</text>
  <circle cx="310" cy="53" r="5" fill="#b4232c"/>
  <text x="310" y="82" font-size="11" text-anchor="middle" fill="#b4232c">CP (ahead)</text>
  <text x="270" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">nose →</text>
  <text x="180" y="138" font-size="11" text-anchor="middle" fill="#6c7a93">both fly to the right</text>
</svg>
```
:::

::: context equilibrium A pencil standing on its tip
A pencil balanced perfectly on its point would stay there forever — in principle. That is an equilibrium. But the tiniest nudge and it falls, faster and faster. A rocket flying straight up at zero angle of attack is balanced the same way: exactly vertical, gravity has nothing to turn. The pitch-over kick is the deliberate nudge, and once the rocket leans, gravity makes the lean grow — exactly the pencil tipping over, but slowed by the rocket's rising speed.
:::

::: context initial-value Set it and it runs
An **initial-value problem** is one where you know the rule for how things change and the starting point, and the whole future follows from those alone. A ball thrown from your hand is one: once it leaves your fingers, its path is fixed by how you threw it. A pure gravity turn is the same after the kick — no correction, only the consequences of the start. That is why a small error in the kick grows into a big error at staging.
:::

::: context thrust-to-weight The number that decides if it leaves the pad
**Thrust-to-weight** is thrust divided by weight, $T/(mg)$. Below 1, the rocket sits on the pad burning fuel. At exactly 1 it hovers. Above 1 it climbs, and the extra above 1 is how many "g" of upward acceleration it has before drag: at 1.43, that is $0.43 \times 9.81 \approx 4.2\,\mathrm{m/s^2}$ at liftoff. As propellant burns, the mass drops and the ratio climbs, so a stage that lifts off gently can end its burn pulling several g.
:::

::: context gravity-loss Gravity loss as an area
Gravity steals speed at a rate $g\sin\gamma$ — all of $g$ when climbing straight up, none when flying level. Plot that rate against time and the gravity loss is the area underneath. A gravity turn starts at the top of the plot and slides down as the path flattens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">g</text>
  <text x="44" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <line x1="50" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="330" y="24" font-size="11" text-anchor="end" fill="#6c7a93">straight up: g × t</text>
  <polygon points="50,140 50,30 67,30 85,30 103,32 120,35 137,40 155,47 172,55 190,63 208,70 225,78 243,84 260,90 278,95 295,100 313,104 330,107 330,140" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="170" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">gravity loss = area under g sin γ</text>
</svg>
```

The curve is the $2.0^\circ$ worked example, drawn to scale: its shaded area is about 69 percent of the rectangle under the dashed line.
:::

::: context perigee Low point, high point
An orbit around Earth is usually a slightly stretched circle, an ellipse. Its lowest point is the **perigee** (from Greek: "near the Earth") and its highest is the **apogee** ("away from the Earth"). If the perigee dips into the atmosphere, every pass drags the spacecraft a little lower, and within a few orbits it falls back. So "reach orbital speed" is not enough — the path has to be pointing level at the right height when the engine stops.
:::

::: context guidance-law From gravity steering to computer steering
Once the air is thin, the flight computer takes over the choice of direction. It repeatedly asks: "given where I am and how fast I am going, which way should I point so that when the engine stops I have exactly the target speed, height and flight path angle?" A rule that answers that is a guidance law. The Space Shuttle's upper-stage guidance belonged to a family called powered explicit guidance. The GNC lessons later in the course build guidance laws like this from the ground up.
:::
