---
id: l09-load-relief-and-guidance
title: Load relief and its interaction with guidance
minutes: 20
covers:
  - Load relief and its interaction with guidance
---

Walk into a strong gust holding an umbrella. Hold it rigidly in place and the wind grabs it — the frame bends, maybe it flips inside out. Let it tip a little into the wind and the gust slides over it. The umbrella survives. The price is that you are no longer holding it exactly where you wanted, and you drift a step or two sideways.

A rocket passing through max-Q makes the same choice. Lesson 2 showed that the air's sideways push bends the airframe, and that the bending grows with $\bar q\alpha$ — dynamic pressure times angle of attack. When the wind changes direction, holding the planned attitude rigidly would put the whole wind into angle of attack. So the rocket's autopilot runs **load relief**: it lets the rocket turn partway into the wind, to keep the bending load safe, and accepts a small drift off the planned path.

Lesson 2 also explained why guidance cannot help during that window. What neither lesson answered is what happens to the drift afterward. It does not vanish when dynamic pressure fades. Exoatmospheric guidance inherits it as the first thing it has to deal with. This lesson puts a price on that inheritance — and finds that not every kind of leftover error costs the same.

## What load relief does

The rocket's nose feels the air coming from the direction of its motion *through the air*. A crosswind changes that direction. Suppose the rocket moves up through still air at speed $v$ and then flies into a sideways wind of speed $w$. The air now meets the rocket slightly from the side, at the **wind angle**

$$
\alpha_w = \arctan\frac{w}{v}.
$$

(Read $\alpha_w$ as "alpha sub w".) If the autopilot holds the nose exactly where the pitch program says, the whole wind angle becomes angle of attack: $\alpha = \alpha_w$.

Load relief turns the nose part of the way into the wind, like a **[[weathervane|weathervane]]**. Turn it by an angle $\theta$ toward the wind and the angle of attack drops to $\alpha = \alpha_w - \theta$. The bending load drops with it.

How does the autopilot know which way the wind is blowing? It does not measure the wind directly. It feels its effect. A sideways air push makes the rocket accelerate sideways, and an **[[accelerometer|lateral-accelerometer]]** mounted across the body measures that. Some vehicles instead estimate the angle of attack from air-data sensors or from the navigation and wind estimates. Either signal tells the autopilot "the air is pushing on my side" — and it turns the nose to ease that push.

The cost is drift. With the nose turned into the wind, the engine's thrust is tilted too. A thrust tilted by $\theta$ has a sideways part, $(T/m)\sin\theta$ per kilogram, which carries the rocket off its planned path toward the wind. Load relief does not try to fix that. Its only job is to protect the structure.

It is also **[[scheduled|gain-scheduling]]**: switched on as dynamic pressure climbs toward max-Q and faded out as dynamic pressure falls away. Outside that window there is nothing to protect, and the drift would be pure cost.

::: key Load relief
A control mode that trades trajectory accuracy for reduced angle of attack, using measured lateral acceleration or an $\alpha$ estimate. It deliberately lets the vehicle weathervane into the wind instead of fighting it.
:::

::: example A crosswind at max-Q
Use the module's vehicle at max-Q: $\bar q = 44.6\ \mathrm{kPa}$, speed $v = 495\ \mathrm{m/s}$, mass $375{,}125\ \mathrm{kg}$, thrust about $8.0\ \mathrm{MN}$, and normal-force slope $N_\alpha = 1.877\ \mathrm{MN/rad}$ from lesson 2. A crosswind of $w = 20\ \mathrm{m/s}$ arrives that the pitch program did not expect.

**Holding attitude.** $\alpha_w = \arctan(20/495) = 2.314^\circ$. The load indicator is $\bar q\alpha = 44.6 \times 2.314 = 103.2\ \mathrm{kPa\cdot deg}$ — just over a 100 kPa·deg envelope.

**With load relief.** Suppose the autopilot turns the nose halfway into the wind. Then $\theta = 1.157^\circ$ and $\alpha = 2.314 - 1.157 = 1.157^\circ$. The load indicator halves to $44.6 \times 1.157 = 51.6\ \mathrm{kPa\cdot deg}$. Comfortably safe.

**The drift, roughly.** Convert $1.157^\circ$ to radians: $0.0202\ \mathrm{rad}$. The thrust tilt pushes toward the wind at $(T/m)\sin\theta = 21.3 \times 0.0202 = 0.431\ \mathrm{m/s^2}$. The remaining angle of attack still lets the air push the other way, at $(N_\alpha/m)\,\alpha = 5.00 \times 0.0202 = 0.101\ \mathrm{m/s^2}$. The net is about $0.33\ \mathrm{m/s^2}$ toward the wind.

**Over the window.** Max-Q's high-pressure stretch lasts about $20\ \mathrm{s}$. Speed gained sideways: $0.33 \times 20 = 6.6\ \mathrm{m/s}$. Distance drifted: $\tfrac12 \times 0.33 \times 20^2 = 66\ \mathrm{m}$.

**Sanity check.** A few metres per second and some tens of metres, against a rocket moving at $495\ \mathrm{m/s}$ — small, as the atmospheric flight module found for realistic gusts with a well-tuned gain. This rough sum leaves out the extra sideways push of the engine's own trim and the way the drift itself changes the wind angle; the atmospheric flight module does the full model.
:::

## What guidance actually receives

At the moment closed-loop guidance switches on — staging, in this module's vehicle — load relief has been running through the whole high-$\bar q$ window. Whatever sideways speed and position it built up is the rocket's actual state at that instant.

Guidance does not see "an error". It sees a current position and velocity, the same as it would for any other **dispersed** start — one that differs from the plan. Being explicit, it re-solves toward the target from wherever the rocket really is. The question worth answering is how much propellant that re-solve costs. The answer depends on *which direction* the leftover error points.

It helps to name the directions. The **orbit plane** is the flat sheet the rocket is flying in. Errors that stay **[[in the plane|in-plane-cross-range]]** — a bit too high or too low, climbing a bit too fast or too slow — are **in-plane** errors. Errors that push the rocket out of that sheet, sideways, are **cross-range** errors.

## A sideways velocity error is cheap

Suppose load relief leaves the rocket with a small cross-range velocity $\delta v_\perp$ ("delta v perp", perpendicular to the plane). Guidance must remove it by the end of the burn.

Here is the trick. The remaining burn is going to deliver a big speed change anyway — call it $\Delta v_{\text{burn}}$. Guidance does not need a separate sideways burn. It tilts the whole remaining burn by a tiny angle $\theta$ out of the plane. The sideways part of the burn is $\Delta v_{\text{burn}}\sin\theta$, and that must equal $\delta v_\perp$. The forward part shrinks from $\Delta v_{\text{burn}}$ to $\Delta v_{\text{burn}}\cos\theta$. The shortfall has to be made up with extra burning. It is

$$
\Delta v_{\text{penalty}} = \sqrt{\Delta v_{\text{burn}}^2 + \delta v_\perp^2} - \Delta v_{\text{burn}} \approx \frac{\delta v_\perp^2}{2\,\Delta v_{\text{burn}}}
$$

for $\delta v_\perp \ll \Delta v_{\text{burn}}$ (read $\ll$ as "much smaller than").

Notice the square. Double the error and the cost goes up four times — but the cost starts out so tiny that it stays tiny. Engineers call this **second order**: the cost grows like the error times itself.

::: note Why it has to be true
Picture a **[[right triangle|right-triangle-penalty]]**. One side is the forward speed the burn must deliver, $\Delta v_{\text{burn}}$. The other is the sideways correction, $\delta v_\perp$. The total burn is the long side, $\sqrt{\Delta v_{\text{burn}}^2 + \delta v_\perp^2}$, by Pythagoras. The extra is the long side minus the forward side.

Factor out $\Delta v_{\text{burn}}$ and write $x = \delta v_\perp / \Delta v_{\text{burn}}$, a small number:

$$
\sqrt{\Delta v_{\text{burn}}^2 + \delta v_\perp^2} - \Delta v_{\text{burn}} = \Delta v_{\text{burn}}\left(\sqrt{1 + x^2} - 1\right).
$$

For small $x$, $\sqrt{1 + x^2} \approx 1 + x^2/2$. (Check: $(1 + x^2/2)^2 = 1 + x^2 + x^4/4$, and $x^4/4$ is tiny.) So the extra is $\Delta v_{\text{burn}}\,x^2/2 = \delta v_\perp^2/(2\,\Delta v_{\text{burn}})$.

The important $\Delta v$ in the bottom is the one the remaining burn delivers, not the orbital speed. The correction rides on the burn, so a bigger burn hides it better.
:::

How big is $\Delta v_{\text{burn}}$ for our stage 2? The rocket equation gives it from the nominal masses: it starts at $112{,}400\ \mathrm{kg}$ and ends at $18{,}457\ \mathrm{kg}$, with $v_e = 3412.7\ \mathrm{m/s}$. So

$$
\Delta v_{\text{burn}} = v_e \ln\frac{m_0}{m_f} = 3412.7 \ln\frac{112{,}400}{18{,}457} = 6165\ \mathrm{m/s}.
$$

::: example How little a cross-range velocity error costs
With $\Delta v_{\text{burn}} = 6165\ \mathrm{m/s}$:

| $\delta v_\perp$ | penalty $\delta v_\perp^2 / (2 \times 6165)$ |
| --- | --- |
| 4 m/s | 0.0013 m/s |
| 8 m/s | 0.0052 m/s |
| 12 m/s | 0.0117 m/s |
| 20 m/s | 0.0324 m/s |

Take the crosswind example's $6.6\ \mathrm{m/s}$: $6.6^2/12{,}330 = 43.56/12{,}330 = 0.0035\ \mathrm{m/s}$.

What is that in propellant? At the end of the burn the stage weighs about $18{,}457\ \mathrm{kg}$, and each extra metre per second there costs about $m/v_e = 18{,}457/3412.7 = 5.4\ \mathrm{kg}$. So $0.0035\ \mathrm{m/s}$ costs about $0.02\ \mathrm{kg}$ — twenty grams.

**Sanity check.** Even $20\ \mathrm{m/s}$ of cross-range error, far more than load relief normally leaves, costs three hundredths of a metre per second. A small tilt of a big burn barely shortens it.
:::

::: key
A cross-range (perpendicular) velocity error costs a $\Delta v$ penalty $\approx \delta v_\perp^2 / (2\,\Delta v_{\text{burn}})$, where $\Delta v_{\text{burn}}$ is the speed change the remaining burn delivers. It is second order, and small for any realistic load-relief disturbance. Guidance absorbs it almost for free.
:::

## An in-plane error is the expensive kind

Now suppose the leftover error lies in the plane instead. The rocket reaches the handoff a little too low, or climbing a little too slowly. There is no right-triangle trick here. The missing height or climb is work the burn must do *along* its main direction. Every bit of error costs its own bit of propellant, in proportion. Engineers call this **first order**: double the error, double the cost.

A too-low start is expensive for a plain reason: the rocket must still climb to 400 km, so it must climb farther, fighting gravity the whole way.

::: example What in-plane errors at handoff cost
Fly the module's stage 2 to the 400 km circular orbit, with the steering solved on the full curved-Earth equations, from handoff states nudged away from nominal. Record the propellant left at insertion compared with the unnudged run.

**Altitude.** Start $10\ \mathrm{km}$ higher: $607\ \mathrm{kg}$ *more* left. Start $10\ \mathrm{km}$ lower: $604\ \mathrm{kg}$ *less*. That is about $60\ \mathrm{kg}$ per kilometre.

**Climb rate.** Start with the radial (upward) speed $5\ \mathrm{m/s}$ higher: $71\ \mathrm{kg}$ more left. $5\ \mathrm{m/s}$ lower: $71\ \mathrm{kg}$ less. That is about $14\ \mathrm{kg}$ per metre per second.

**Compare with the crosswind.** Suppose the same $6.6\ \mathrm{m/s}$ from the load-relief example had landed in the climb rate instead of cross-range: $6.6 \times 14.3 \approx 94\ \mathrm{kg}$. Cross-range it cost about $0.02\ \mathrm{kg}$. Same size of error, roughly five thousand times the price.

**Sanity check.** Starting higher helps and starting lower hurts, by nearly equal amounts. That is what a first-order cost looks like: a straight line through zero.
:::

The reason is not that guidance treats the two cases differently. The same re-converging cycle handles both, as it must, being explicit. The two disturbances are different in kind. A cross-range error is fixed by a small tilt of a burn that is happening anyway, and a small tilt barely shortens it. An in-plane error changes how much work the burn itself has to do.

Which kind does load relief leave? Both. A crosswind in the side plane leaves the cheap kind. A wind blowing along the rocket's direction of flight, or a **[[wind shear|wind-shear]]** in the pitch plane, makes load relief tip the nose up or down instead — and that leaves an error in climb rate and height at staging. That is the expensive kind. It is bounded, and modest for a well-designed load-relief gain, but it is real and worth pricing.

::: warning
Do not conclude from the cross-range formula that load relief's cost to guidance is always negligible. The formula applies only to velocity errors *out of the plane*. The in-plane height and climb-rate errors load relief leaves in the pitch plane are the costly kind. The number to reason about is the reserve a guidance run from the dispersed state actually consumes, not a quick angle-based estimate.
:::

## The handoff, precisely

Nothing about this requires load relief and guidance to talk to each other in flight. Load relief runs through the high-$\bar q$ window, keeping $\bar q\alpha$ inside its envelope, with no idea that a guidance algorithm exists. Guidance switches on afterward, reads the rocket's actual state, and treats whatever that state is — on plan, or pushed off by a windy day — as the starting point of its problem.

The interaction this lesson priced is not a conversation between two control laws. It is the fact that one law's leftover state is the other's entire input. The cost of that handoff is measured, not designed away — by running the same explicit, re-converging guidance on whatever state it is handed. And some of it can be avoided before launch: measuring the day's winds and building them into the pitch program, the **[[day-of-launch update|bridge-wind-update]]**, leaves load relief less to do in the first place.

## Check yourself

::: check
A load-relief event leaves the rocket with a $6\ \mathrm{m/s}$ cross-range velocity error at guidance handoff. Estimate the $\Delta v$ penalty, using $\Delta v_{\text{burn}} = 6165\ \mathrm{m/s}$.
:::

::: answer
$\Delta v_{\text{penalty}} \approx \delta v_\perp^2 / (2\,\Delta v_{\text{burn}}) = 6^2/(2 \times 6165) = 36/12{,}330 = 0.0029\ \mathrm{m/s}$.

That is about three thousandths of a metre per second — around 16 grams of propellant at the end of the burn ($0.0029 \times 5.4\ \mathrm{kg}$ per m/s). Negligible against any real propellant budget.
:::

::: check
Explain why the cross-range formula cannot be reused as it is — with $\delta v_\perp$ swapped for some other quantity — to estimate the cost of a height error at handoff.
:::

::: answer
The formula comes from a right triangle: the correction is at right angles to a large burn that is happening anyway, so tilting the burn slightly fixes it, and the cost is only the tiny shortening of the long side — a second-order effect.

A height error is not at right angles to the burn's work. The rocket still has to reach the same final altitude, so a too-low start means the burn itself must climb farther and fight gravity longer. That changes the amount of work the burn does, in proportion to the error — a first-order effect. No substitution into the triangle formula captures it. That is why this lesson priced it by running the actual guidance problem rather than by a shortcut.
:::

::: check
Using the lesson's numbers (about $60\ \mathrm{kg}$ of reserve per kilometre), estimate the reserve cost of starting $3\ \mathrm{km}$ low at handoff. Then give one reason the true cost need not scale exactly in a straight line from the $10\ \mathrm{km}$ figure.
:::

::: answer
**Estimate.** $604\ \mathrm{kg}/10\ \mathrm{km} = 60.4\ \mathrm{kg/km}$, so $3\ \mathrm{km} \times 60.4 \approx 181\ \mathrm{kg}$. (Running the case directly gives $181.6\ \mathrm{kg}$ — very close, because $3\ \mathrm{km}$ is a small nudge.)

**Why not exactly a straight line.** The guidance problem is nonlinear: gravity, the curved path and the rocket equation all bend the relationship a little. You can already see it in the $10\ \mathrm{km}$ numbers — $607\ \mathrm{kg}$ gained going up but $604\ \mathrm{kg}$ lost going down, not quite equal. For small errors the straight line is an excellent guide; for large ones, run the case.
:::

::: check
Load relief's output directly decides how much of guidance's propellant margin gets used. Why is it still correct to say the two need no special interaction protocol?
:::

::: answer
Because guidance is explicit. Every cycle it reads the rocket's actual state and re-solves toward the target from there, with no interest in how that state came about. Load relief's leftover position and velocity error is, to guidance, one more dispersed starting condition — the kind this module has already shown guidance absorbs. The two systems never need to exchange information, because guidance's own input, the true state, already carries everything load relief did.
:::

::: check
A load-relief gain is retuned to cut the typical cross-range velocity error in half, at the cost of a somewhat larger typical in-plane (height and climb-rate) error. (Trades like this are real in load-relief design; the details belong to the atmospheric flight module.) Based on this lesson, is that trade clearly good for guidance's propellant budget?
:::

::: answer
No — it may well be the opposite. This lesson found cross-range velocity errors cheap for guidance (hundredths of a metre per second even for errors of tens of metres per second), while in-plane errors are the expensive kind (tens of kilograms per kilometre of height, or per few metres per second of climb rate). A retune that shrinks the already-cheap error while growing the already-expensive one could cost guidance more propellant overall, even though it looks like an improvement measured in velocity alone. The fair test prices both changes in the currency that matters to guidance — reserve consumed.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Load relief | autopilot turns the nose partway into the wind, sensed by lateral acceleration or an $\alpha$ estimate; protects the structure, accepts drift |
| $\alpha_w = \arctan(w/v)$ | wind angle; 20 m/s crosswind at 495 m/s gives $2.31^\circ$, 103 kPa·deg if held rigidly |
| What guidance inherits | load relief's leftover position and velocity at the moment closed-loop guidance switches on |
| $\Delta v_{\text{penalty}} \approx \delta v_\perp^2 / (2\,\Delta v_{\text{burn}})$ | cost of a cross-range velocity error; second order; $\Delta v_{\text{burn}} = 6165$ m/s for stage 2 |
| Cross-range example | 20 m/s costs 0.032 m/s; 6.6 m/s costs 0.0035 m/s (about 20 g) |
| In-plane errors | first order: about 60 kg per km of height and 14 kg per m/s of climb rate at handoff |
| The handoff | no protocol needed — guidance reads the true state and re-solves, as for any dispersed start |

Everything so far has treated the pieces designed on the ground — the kick angle, the pitch program, the reference state guidance's dispersions are measured from — as given. The next lesson looks at where they come from: the offline optimization problem that sets them, and what it hands to the onboard algorithms this module has built.

::: context weathervane Nose into the wind
A weathervane on a barn roof has a big tail fin, so the wind swings it until its arrow points straight into the wind — the position where the air pushes it least. Load relief lets a rocket do some of the same. The wind's sideways push on the rocket's side is what bends it, so turning the nose toward where the air is coming from shrinks that push.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="180" x2="180" y2="20" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="174" y="30" font-size="11" text-anchor="end" fill="#6c7a93">planned attitude</text>
  <line x1="180" y1="180" x2="214.5" y2="23" stroke="#b4232c" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="222" y="30" font-size="11" fill="#b4232c">air comes from here</text>
  <g transform="translate(180,160) rotate(6.2)">
    <rect x="-9" y="-110" width="18" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="-9,-110 0,-128 9,-110" fill="#1f2a44"/>
  </g>
  <line x1="340" y1="95" x2="272" y2="95" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="262,95 274,89 274,101" fill="#1d6fd1"/>
  <text x="305" y="85" font-size="11" text-anchor="middle" fill="#1d6fd1">wind</text>
  <text x="20" y="150" font-size="11" fill="#1f2a44">nose turned halfway</text>
  <text x="20" y="165" font-size="11" fill="#1f2a44">toward where the air comes from</text>
</svg>
```

The angles are exaggerated about five times: the relative air comes $12.4^\circ$ off the planned attitude, and the rocket turns halfway, $6.2^\circ$, leaving half as much angle of attack.
:::

::: context lateral-accelerometer Feeling the push instead of seeing the wind
An accelerometer measures the push on it, not the wind. Mounted crosswise in the rocket, it reads how hard the rocket is being shoved sideways — mostly by the air pushing on the body at an angle of attack. That makes it a handy, direct signal of the thing load relief cares about, with no need to know the wind itself. The drawback is noise: a rocket shakes, and its long body bends, so the signal is filtered before the autopilot uses it.
:::

::: context gain-scheduling Turning a control law up and down with the flight
A **gain** is how strongly a controller reacts to what it senses. **Gain scheduling** means changing that strength according to the flight conditions — here, according to dynamic pressure or time since liftoff. Load relief's gain is zero at liftoff, rises into the high-$\bar q$ window, and fades back to zero as the air thins. Nearly every launch-vehicle autopilot schedules its gains this way, because the rocket's behavior changes so much between liftoff and space.
:::

::: context in-plane-cross-range Two kinds of direction
Picture the orbit plane as a flat sheet the rocket flies along. In-plane errors live in the sheet: too high, too low, too fast, too slow, climbing at the wrong angle. Cross-range errors poke out of the sheet, to the side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="40,130 250,130 320,60 110,60" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="150" font-size="11" fill="#1f2a44">orbit plane (the sheet)</text>
  <line x1="150" y1="100" x2="250" y2="100" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="260,100 248,94 248,106" fill="#1d6fd1"/>
  <text x="238" y="92" font-size="11" fill="#1d6fd1">flight</text>
  <line x1="150" y1="100" x2="150" y2="30" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="150,20 144,32 156,32" fill="#f2b880"/>
  <text x="158" y="30" font-size="11" fill="#1f2a44">cross-range</text>
  <line x1="150" y1="100" x2="183" y2="67" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="190,60 177,64 186,73" fill="#b4232c"/>
  <text x="194" y="60" font-size="11" fill="#b4232c">up (in-plane)</text>
</svg>
```

Up and forward both lie in the sheet; only the orange arrow leaves it.
:::

::: context right-triangle-penalty The long side is barely longer
Draw a right triangle with a long side of $6165$ and a short side of $20$. The slanted side is $\sqrt{6165^2 + 20^2} = 6165.03$ — only three hundredths longer. When one side is tiny compared with the other, the hypotenuse is almost exactly the long side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <polygon points="30,90 330,90 330,60" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="90" x2="330" y2="60" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">Δv burn (forward)</text>
  <text x="336" y="80" font-size="11" fill="#1f2a44">δv⊥</text>
  <text x="150" y="62" font-size="11" fill="#1d6fd1">total burn, barely longer</text>
</svg>
```

The short side here is drawn about thirty times its true proportion so you can see it at all; at true scale it would be thinner than the line.
:::

::: context wind-shear When the wind changes with height
Wind shear is a change in wind speed or direction over a short distance — here, over a short change in altitude. The jet stream, a river of fast wind about 10 km up, often has sharp shear at its edges. A rocket climbing through it can meet a wind that changes by tens of metres per second in a few hundred metres of height, which the autopilot feels as a sudden gust. Shear in the pitch plane is what makes load relief tip the nose up or down.
:::

::: context bridge-wind-update Where this goes next
Lesson 11 shows how the day's measured winds are built into the pitch program before liftoff, so the rocket already flies nose-into the average wind. Load relief is then left with only the difference between that measurement and the real wind, plus gusts — a smaller job, a smaller drift, and less for guidance to clean up afterward.
:::
