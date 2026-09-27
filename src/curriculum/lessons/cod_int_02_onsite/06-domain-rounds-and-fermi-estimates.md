---
id: l06-domain-rounds-and-fermi-estimates
title: Domain rounds and Fermi estimates, out loud
minutes: 25
covers:
  - Domain rounds for GNC roles: PD control, orbit determination, frequency domain, aerodynamic drag with real examples
  - Fermi and order-of-magnitude estimation out loud
---

Stick your hand out of a car window on the highway. Tilt it up a little and your arm is pushed back and lifted. Speed up and the push grows fast — much faster than the speed itself. You did not need an equation to feel that. But if someone asked *why* it grows so fast, and roughly how hard the air pushes at $100\,\mathrm{km/h}$, you would need a little physics and a little arithmetic, said out loud.

That is what a **domain round** is: an interview where a senior engineer in your field asks about the physics and mathematics of the job itself, not about code. For guidance, navigation and control (GNC) roles, the topics candidates have reported are few and specific. And almost every such round, and many others, can include a **Fermi question** — "roughly how many of X are there?" — where you estimate from scratch while the interviewer listens.

Last lesson was about verifying flight software and building a flight computer that survives faults. This lesson gives you a short, first-principles refresher on each reported GNC topic, with worked numbers, and then a method for estimating anything out loud.

## What gets asked in the GNC domain round

Candidates have reported four topics: PD control, orbit determination, the frequency domain, and aerodynamic drag — and the drag questions came with real-life examples, asked by a senior GNC engineer.

::: key Reported GNC domain topics (card int02_c9)
PD control, orbit determination, the frequency domain, and aerodynamic drag with real-life examples from a senior GNC engineer. **[[Glassdoor|glassdoor]]** rates the GNC interview difficulty around 2.8 out of 5 with a large majority positive: hard but fair. (These are reported figures from candidate reviews, not official ones.)
:::

"Hard but fair" is the important part. The interviewer is not hunting for a memorised formula. They want to see you start from physics you trust, build the answer in steps, attach real numbers, and say what the numbers mean for a real vehicle. Each section below is shaped that way.

## PD control: a spring and a shock absorber

Picture a screen door with a closer. Push it open and let go. A spring pulls it shut — the farther open, the harder it pulls. A shock absorber slows it down — the faster it moves, the harder it resists. Too little shock absorber and the door slams and bounces. Too much and it creeps shut forever. Just right and it closes quickly with at most a tiny bounce.

A **PD controller** (proportional-derivative) does the same thing with software. For a spacecraft turning about one axis:

- $\theta$ (read "theta") is the pointing error, in radians;
- $\dot{\theta}$ (read "theta dot") is how fast the error is changing, in radians per second;
- $J$ is the **moment of inertia** — how hard the spacecraft is to spin — in $\mathrm{kg\,m^2}$;
- $u$ is the torque the controller commands, in newton-metres.

The spacecraft obeys $J\ddot{\theta} = u$: torque equals inertia times angular acceleration ($\ddot{\theta}$, "theta double dot"). The PD law is

$$
u = -K_p\,\theta - K_d\,\dot{\theta}.
$$

$K_p$, the **proportional gain**, is the spring. $K_d$, the **derivative gain**, is the shock absorber.

Put the law into the equation of motion and divide by $J$:

$$
\ddot{\theta} + \frac{K_d}{J}\,\dot{\theta} + \frac{K_p}{J}\,\theta = 0.
$$

Engineers write every such equation in one standard shape,

$$
\ddot{\theta} + 2\zeta\omega_n\,\dot{\theta} + \omega_n^2\,\theta = 0,
$$

where $\omega_n$ ("omega n") is the **natural frequency** — how fast the system wants to respond, in radians per second — and $\zeta$ ("zeta") is the **[[damping ratio|damping-ratio]]** — how much shock absorber there is, with no units. Match the two lines term by term:

$$
K_p = J\,\omega_n^2, \qquad K_d = 2\,\zeta\,\omega_n\,J.
$$

That is the whole design recipe: choose how fast ($\omega_n$) and how smooth ($\zeta$), then read off the gains.

::: example PD gains for a spacecraft axis
A spacecraft has $J = 500\,\mathrm{kg\,m^2}$ about one axis. We choose $\omega_n = 0.1\,\mathrm{rad/s}$ (a gentle, slow loop, typical of a large satellite) and $\zeta = 0.707$ (a common choice with a small overshoot).

**Proportional gain.** $K_p = J\omega_n^2 = 500 \times 0.1^2 = 500 \times 0.01 = 5\,\mathrm{N\,m/rad}$.

**Derivative gain.** $K_d = 2\zeta\omega_n J = 2 \times 0.707 \times 0.1 \times 500 = 70.7\,\mathrm{N\,m\,s/rad}$.

**How long to settle.** A common rule says the error settles within about $2\%$ after $t_s \approx 4/(\zeta\omega_n) = 4/(0.707 \times 0.1) \approx 56.6\,\mathrm{s}$.

**Overshoot.** For this damping the peak overshoot is $e^{-\pi\zeta/\sqrt{1-\zeta^2}} \approx 0.043$, about $4.3\%$. A $10$ degree turn would swing about $0.43$ degrees past the target before settling.

**Sanity check.** About a minute to settle a large satellite's turn is ordinary. And $K_d$ is much bigger than $K_p$ because $\omega_n$ is small: slow loops lean hard on damping.
:::

::: warning Units on gains
$K_p$ and $K_d$ carry units. The same numbers with degrees instead of radians are wrong by a factor of $57.3$. In an interview, write the units on each gain as you compute it; it is the quickest way to show you would not make that mistake in flight code.
:::

## Orbit determination: where exactly are we?

Think of guessing where a friend's car is on a long road trip. You know the route and the usual speed. Every so often your friend texts a rough location. Between texts, you move your guess forward along the route. When a text arrives, you nudge your guess toward it — more if the text is precise, less if it is vague.

**Orbit determination** (OD) is that, for a spacecraft. The unknown is the **[[state vector|state-vector]]**: three numbers for position and three for velocity, six in all. The "route" is a **dynamics model** — gravity, including Earth's flattening, drag and other small pushes. The "texts" are **measurements**: GPS fixes on board, or radar range and range-rate from the ground.

There are two families of method:

- **Batch least squares.** Collect a stretch of measurements, then find the one starting state whose predicted path best fits all of them at once.
- **Sequential filtering**, usually a **Kalman filter**. Predict forward, then correct at each measurement, weighting the correction by how much you trust the prediction versus the measurement.

The fact that makes OD interesting is that errors do not stay put. A small error in orbit height grows into a large error *along* the orbit.

::: example How a 10-metre error becomes 94 metres
A spacecraft's estimated **semi-major axis** — roughly the orbit's average radius — is off by $\Delta a = 10\,\mathrm{m}$. A higher orbit is a slower orbit, so the estimated spacecraft drifts behind or ahead of the real one.

**The rule.** For a near-circular orbit, the along-track error grows by $3\pi\,\Delta a$ every orbit.

**Compute.** $3\pi \times 10 \approx 94.2\,\mathrm{m}$ per orbit.

**Over a day.** A low orbit takes about $92$ minutes, so about $15.6$ orbits a day: $94.2 \times 15.6 \approx 1470\,\mathrm{m}$, roughly $1.5\,\mathrm{km}$.

**Sanity check.** A $10\,\mathrm{m}$ height error is small; a $1.5\,\mathrm{km}$ position error after a day is not. That is why OD reports care most about the **[[along-track|along-track]]** direction, and why drag, which changes $a$ slowly and unpredictably, is the hardest part of predicting a low orbit.
:::

::: note Why it has to be true
The orbital rate is $n = \sqrt{\mu / a^3}$, where $\mu$ is Earth's gravity constant. A small change $\Delta a$ changes the rate by $\Delta n \approx -\tfrac{3}{2}\,\frac{n}{a}\,\Delta a$ (the power $-3/2$ comes down in front). Over one orbit, which lasts $2\pi/n$, the angle gained or lost is $\Delta n \cdot 2\pi/n = -3\pi\,\Delta a / a$. Multiply that angle by the radius $a$ to get distance along the orbit: $-3\pi\,\Delta a$. The minus sign says a higher orbit falls behind.
:::

## The frequency domain: how a system answers a wobble

Push a child on a swing at the right rhythm and they go higher each time. Push at a random rhythm and not much happens. A system's reaction depends on *how fast* you shake it. The **frequency domain** describes systems that way: for each shaking frequency, how much bigger or smaller the output is (the **gain**) and how late it arrives (the **phase**).

For a control loop, three ideas carry most interviews.

- **Bandwidth.** Roughly the fastest wobble the loop can follow. It is close to the natural frequency you chose for the PD loop.
- **Phase margin.** How much extra delay the loop could take before it starts to oscillate on its own. It is measured at the **crossover frequency**, where the loop's gain is exactly $1$. Common targets are around $30$ to $60$ degrees.
- **Delay costs phase.** A pure time delay $\tau$ ("tau") adds a phase lag of $\omega\tau$ radians at frequency $\omega$. Computers, sensors and data buses all add delay.

For example, a loop with crossover at $\omega = 2\,\mathrm{rad/s}$ and a total delay of $\tau = 20\,\mathrm{ms}$ loses $\omega\tau = 2 \times 0.02 = 0.04\,\mathrm{rad}$, about $2.3$ degrees, of phase margin. Small here; large for a faster loop.

The real-vehicle example to reach for is **bending**. A long rocket flexes like a diving board at a few hertz, and a spacecraft's solar arrays flap slowly. If the control loop's bandwidth gets too close to a **[[structural mode|bending-modes]]**, the controller can pump energy into the flexing. A common rule of thumb keeps the control bandwidth well below the first bending frequency — often by a factor of five to ten — and adds filters to cut the controller's response near that frequency.

## Aerodynamic drag, from first principles

Back to your hand out the car window. The air you hit has to be shoved aside. In each second you shove a slab of air whose mass grows with your speed, and you give it a push that also grows with your speed. Two factors of speed: that is why the push goes with speed *squared*.

That idea has a name. **Dynamic pressure** is

$$
q = \tfrac{1}{2}\rho v^2,
$$

where $\rho$ (read "rho") is the air density in $\mathrm{kg/m^3}$ and $v$ is the speed in $\mathrm{m/s}$. It is a pressure, in pascals ($1\,\mathrm{Pa} = 1\,\mathrm{N/m^2}$). The drag force is

$$
D = q\,C_D\,A,
$$

where $A$ is a reference area in $\mathrm{m^2}$ and $C_D$ is the **drag coefficient**, a number without units that captures the shape.

For your car at $30\,\mathrm{m/s}$ (about $108\,\mathrm{km/h}$) at sea level, $\rho = 1.225\,\mathrm{kg/m^3}$: $q = 0.5 \times 1.225 \times 30^2 \approx 551\,\mathrm{Pa}$. With $C_D = 0.3$ and $A = 2.2\,\mathrm{m^2}$, $D \approx 551 \times 0.3 \times 2.2 \approx 364\,\mathrm{N}$ — like a $37\,\mathrm{kg}$ weight hanging off the back bumper.

### Max-q on a rocket

A rocket climbing through the atmosphere has two things changing at once: speed rises, and density falls as the air thins. Early on, speed wins and $q$ climbs. Higher up, thin air wins and $q$ falls. The peak in between is called **[[max-q|max-q]]**.

::: example Dynamic pressure at max-q
Assume (stated out loud) a launcher reaches max-q at about $12\,\mathrm{km}$ altitude, where standard-atmosphere density is $\rho \approx 0.311\,\mathrm{kg/m^3}$, moving at $v = 400\,\mathrm{m/s}$.

**Square the speed.** $400^2 = 160\,000\,\mathrm{m^2/s^2}$.

**Multiply.** $q = 0.5 \times 0.3108 \times 160\,000 \approx 24\,900\,\mathrm{Pa}$, about $25\,\mathrm{kPa}$.

**Compare.** The same speed at sea level would give $0.5 \times 1.225 \times 160\,000 = 98\,000\,\mathrm{Pa}$ — four times more. Climbing before going fast is what keeps $q$ down.

**Drag force.** With a $3.66\,\mathrm{m}$ diameter body, $A = \pi \times 1.83^2 \approx 10.5\,\mathrm{m^2}$. With an assumed $C_D \approx 0.5$ near this speed, $D \approx 24\,900 \times 0.5 \times 10.5 \approx 131\,\mathrm{kN}$.

**Sanity check.** The speed of sound at $12\,\mathrm{km}$ is about $295\,\mathrm{m/s}$, so this is about Mach $1.36$ — max-q near Mach one to one and a half is the usual picture. Tens of kilopascals is the right size for a large launcher.
:::

### What the interviewer actually wants

A strong answer does not stop at $\tfrac{1}{2}\rho v^2$. It says what that number *does* to the vehicle.

- **$C_D$ is not a constant.** It changes with **Mach number** (speed divided by the local speed of sound) and rises sharply around Mach $1$, where shock waves form. So drag peaks in the **[[transonic|cd-mach]]** region, which is close to max-q.
- **Loads.** Aerodynamic forces on the structure scale with $q$. Any angle between the rocket's nose and the oncoming air — from wind gusts, say — turns into a sideways bending load that also scales with $q$. That is why engineers watch the product of $q$ and that angle, and why many launchers throttle their engines down briefly through max-q.
- **Control authority.** The guidance system must steer against aerodynamic turning moments. Near max-q those moments are largest, so the engine **gimbal** (the swivel that steers the engine) or the fins have the least margin left. Grid fins on a returning booster work the other way: they need dynamic pressure to have any authority at all.

::: warning Treating drag as one fixed number
Saying "drag is $\tfrac{1}{2}\rho v^2 C_D A$" and stopping is the answer the question is designed to go beyond. Name what varies — density with altitude, $C_D$ with Mach — and connect the peak to loads and control. That is the difference between recall and reasoning.
:::

## Fermi estimation, out loud

The same habit — break the problem down, attach numbers, check the size — powers a different question: "roughly how many satellites are above us right now?" or "about how much energy does the space station carry?" This is a **[[Fermi estimate|fermi-story]]**: an answer good to within a factor of a few, built from things you can reason about.

::: key How to handle a Fermi question (card int02_c10)
Decompose out loud into quantities you can bound, state each assumption and its uncertainty, carry units throughout, compute to one significant figure, then sanity-check the magnitude against something you know. The reasoning is the answer.
:::

**One significant figure** means you round to a single non-zero digit: $37$ becomes $40$, $2834$ becomes $3000$. Anything more is false precision when the inputs were guesses.

::: example Fermi 1: how many of 6000 satellites can see your city?
**Decompose.** Visible satellites = total satellites × fraction of the sky shell that is above your horizon at a usable angle.

**Assumptions.** $6000$ satellites in low orbit, spread evenly (a big simplification). A satellite is usable if it sits above a patch of ground within about $1000\,\mathrm{km}$ of you — a guess good to perhaps a factor of two in area.

**Fraction.** That patch is roughly a disk: $\pi \times 1000^2 \approx 3.1 \times 10^6\,\mathrm{km^2}$. Earth's surface is $4\pi \times 6371^2 \approx 5.1 \times 10^8\,\mathrm{km^2}$. The fraction is about $3.1 \times 10^6 / 5.1 \times 10^8 \approx 0.0062$.

**Multiply.** $6000 \times 0.0062 \approx 37$, which to one significant figure is about $40$ satellites.

**Sanity check.** Tens, not ones or thousands. It is enough for a user to always see several, which a broadband constellation needs. And say the caveat: inclined orbits bunch satellites toward mid-latitudes, so a city there could see more than the even-spread guess.
:::

::: example Fermi 2: the space station's kinetic energy in TNT
**Decompose.** Kinetic energy $= \tfrac{1}{2}mv^2$, then divide by the energy in one tonne of TNT.

**Assumptions.** Mass $m \approx 400\,\mathrm{t} = 4 \times 10^5\,\mathrm{kg}$ (good to about $10\%$). Orbital speed $v \approx 7.7\,\mathrm{km/s} = 7.7 \times 10^3\,\mathrm{m/s}$ (well known). One tonne of TNT releases $4.184 \times 10^9\,\mathrm{J}$ (a defined value).

**Compute.** $v^2 = (7.7 \times 10^3)^2 \approx 5.9 \times 10^7\,\mathrm{m^2/s^2}$. So $\tfrac{1}{2} \times 4 \times 10^5 \times 5.9 \times 10^7 \approx 1.2 \times 10^{13}\,\mathrm{J}$. Divide: $1.2 \times 10^{13} / 4.184 \times 10^9 \approx 2800$ tonnes of TNT.

**One significant figure.** About $3000$ tonnes, or $3$ kilotons.

**Sanity check.** Units: kilograms times metres squared per second squared is joules, as energy should be. And it is a big number for a good reason — this is the energy the atmosphere turns into heat when a spacecraft re-enters, which is why re-entry needs a heat shield.
:::

::: warning Silent arithmetic
The most common Fermi failure is thinking quietly for a minute and then announcing a number. The interviewer cannot grade reasoning they did not hear. Say each factor and its uncertainty as you write it down; a wrong assumption said aloud can be corrected, while a wrong number with no reasoning cannot.
:::

## Check yourself

::: check
You want the spacecraft from the PD example ($J = 500\,\mathrm{kg\,m^2}$) to respond twice as fast, $\omega_n = 0.2\,\mathrm{rad/s}$, with the same $\zeta = 0.707$. Find the new gains, and say which one grew more.
:::

::: answer
$K_p = J\omega_n^2 = 500 \times 0.04 = 20\,\mathrm{N\,m/rad}$, four times the old $5$. $K_d = 2\zeta\omega_n J = 2 \times 0.707 \times 0.2 \times 500 = 141.4\,\mathrm{N\,m\,s/rad}$, twice the old $70.7$. $K_p$ grew more because it goes with $\omega_n^2$, while $K_d$ goes with $\omega_n$. The settling time halves to about $28\,\mathrm{s}$.
:::

::: check
A satellite at about $400\,\mathrm{km}$ has mass $300\,\mathrm{kg}$, frontal area $5\,\mathrm{m^2}$ and $C_D = 2.2$. Assume $\rho = 3 \times 10^{-12}\,\mathrm{kg/m^3}$ and $v = 7670\,\mathrm{m/s}$. Find its drag deceleration and how much speed it loses per day.
:::

::: answer
$q = 0.5 \times 3 \times 10^{-12} \times 7670^2 \approx 8.8 \times 10^{-5}\,\mathrm{Pa}$. Drag $D = q C_D A \approx 8.8 \times 10^{-5} \times 2.2 \times 5 \approx 9.7 \times 10^{-4}\,\mathrm{N}$. Deceleration $= D/m \approx 3.2 \times 10^{-6}\,\mathrm{m/s^2}$. Per day: $3.2 \times 10^{-6} \times 86\,400 \approx 0.28\,\mathrm{m/s}$. Tiny, but steady and uncertain, because the upper-atmosphere density rises and falls with solar activity — which is why drag dominates low-orbit prediction errors.
:::

::: check
Why does the along-track error in orbit determination grow over time, while a radial error of the same size does not grow the same way?
:::

::: answer
A radial error means the estimated semi-major axis is wrong, and a different semi-major axis means a different orbital speed. The estimated spacecraft therefore runs slightly ahead or behind every orbit, by about $3\pi\,\Delta a$ each time, so the along-track error keeps growing. The radial error itself stays roughly the same size; it is the timing along the orbit that accumulates.
:::

::: check
A control loop crosses over at $\omega = 10\,\mathrm{rad/s}$ and has $30\,\mathrm{ms}$ of total delay. How much phase margin does the delay cost, in degrees? Is that worrying if the margin was $40$ degrees?
:::

::: answer
Phase lag $= \omega\tau = 10 \times 0.03 = 0.3\,\mathrm{rad}$. In degrees: $0.3 \times 180/\pi \approx 17.2$ degrees. That takes a $40$ degree margin down to about $23$ degrees — below the usual $30$ degree floor, so yes, it is worrying. Options: reduce the delay, or lower the crossover frequency.
:::

::: check
Estimate, to one significant figure and out loud, how many times a satellite in a $92$-minute orbit circles Earth in a year. State each step.
:::

::: answer
Minutes in a year: $365 \times 24 \times 60 = 525\,600$. Orbits: $525\,600 / 92 \approx 5713$. To one significant figure, about $6000$ orbits a year. Sanity check: about $16$ orbits a day ($1440 / 92 \approx 15.7$), times about $365$ days, is about $5700$ — the same size.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Reported GNC topics | PD control, orbit determination, frequency domain, drag with real examples; reported difficulty about 2.8 out of 5 |
| PD law | $u = -K_p\theta - K_d\dot{\theta}$ on $J\ddot{\theta} = u$ |
| PD gains | $K_p = J\omega_n^2$, $K_d = 2\zeta\omega_n J$ |
| Orbit determination | estimate the six-number state from a dynamics model plus measurements |
| Along-track growth | about $3\pi\,\Delta a$ per orbit |
| Delay and phase | a delay $\tau$ costs $\omega\tau$ radians of phase at frequency $\omega$ |
| Dynamic pressure | $q = \frac{1}{2}\rho v^2$; drag $D = qC_DA$; $C_D$ peaks near Mach 1 |
| Max-q | peak of $q$ as speed rises and density falls; loads and control margin are tightest there |
| Fermi method | decompose, state assumptions and uncertainty, carry units, one significant figure, sanity-check |

Next lesson is the technical presentation: about twelve minutes of slides on your own work, then a longer stretch of questions — where exactly this first-principles reasoning is tested on your own numbers.

::: context glassdoor Where that rating comes from
Glassdoor is a website where people post anonymous reviews of employers, including what their job interviews were like and how hard they felt. A rating like "2.8 out of 5" is an average of what candidates chose to report, so it is a rough signal, not a measurement: the people who write reviews are not a random sample, and every interviewer is different. Treat it as "people found it demanding but reasonable", not as a prediction of your day.
:::

::: context damping-ratio What zeta looks like
The damping ratio sets the shape of the response to a sudden change. Below $1$ the response overshoots and rings; at $1$ it rises as fast as it can without overshooting; above $1$ it creeps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="140" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="60" x2="345" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="340" y="54" font-size="11" text-anchor="end" fill="#6c7a93">target</text>
  <path d="M30,140 C60,20 80,20 100,40 C120,70 135,75 150,62 C165,50 180,52 195,60 C215,66 240,62 345,60" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M30,140 C70,50 100,55 130,60 C170,62 250,60 345,60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M30,140 C90,110 180,80 345,64" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="105" y="30" font-size="11" fill="#b4232c">zeta 0.2: rings</text>
  <text x="150" y="90" font-size="11" fill="#1d6fd1">zeta 0.7</text>
  <text x="230" y="110" font-size="11" fill="#1f2a44">zeta 2: creeps</text>
  <text x="330" y="156" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
</svg>
```

The value $0.707$ is popular because it gives only about $4\%$ overshoot while still rising briskly.
:::

::: context state-vector Six numbers pin down an orbit
Position needs three numbers (x, y, z) and velocity needs three more. With those six at one instant, plus a model of the forces, you can in principle predict the whole future path — which is why OD estimates exactly six things (sometimes plus extras, like a drag scale factor). The same information is often written as six **orbital elements** instead: size, shape, tilt and three angles. Converting between the two forms is a standard exercise from the orbital mechanics modules.
:::

::: context along-track Why a higher orbit is slower
It feels backwards: to catch a spacecraft ahead of you in the same orbit, you slow down. Lower orbits are faster and take less time per lap; higher orbits are slower and take longer. So if your estimate puts the spacecraft $10\,\mathrm{m}$ too high, your estimated copy laps a bit more slowly than the real one and falls further behind every orbit. The error is not in *where the orbit is*, which stays close, but in *when* the spacecraft gets to each point.
:::

::: context bending-modes Rockets bend
A tall, thin rocket is more like a flexible pole than a solid brick. It has natural bending shapes, each with its own frequency; the lowest is often only a few hertz on a large launcher. The navigation sensors sit at one point on the body, so they feel the bending as if it were rotation. If the controller answers that fake rotation by swivelling the engine, it can feed the bending instead of damping it. Where the sensors are mounted, and filters tuned to each mode, are both part of the fix.
:::

::: context max-q Why q rises and then falls
Speed rises steadily during ascent, while air density drops roughly by half every $5$ to $6\,\mathrm{km}$ of height. Their product in $q = \tfrac{1}{2}\rho v^2$ first grows, peaks, then shrinks toward zero as the air runs out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="35" y1="130" x2="345" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="35" y1="130" x2="35" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M35,130 C80,125 110,40 150,32 C190,28 230,90 345,125" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="152" y1="31" x2="152" y2="130" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="158" y="26" font-size="12" fill="#b4232c">max-q</text>
  <text x="340" y="148" font-size="11" text-anchor="end" fill="#1f2a44">altitude and time</text>
  <text x="42" y="24" font-size="11" fill="#1f2a44">q</text>
  <text x="70" y="100" font-size="11" fill="#1f2a44">speed wins</text>
  <text x="240" y="80" font-size="11" fill="#1f2a44">thin air wins</text>
</svg>
```
:::

::: context cd-mach The transonic bump
As a body approaches the speed of sound, shock waves form on it and drag climbs steeply. The drag coefficient typically peaks a little above Mach $1$, then falls off gradually at higher speed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="35" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="35" y1="120" x2="35" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M35,95 C90,95 110,92 125,70 C135,40 145,35 155,38 C185,50 250,70 345,80" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="125" y1="120" x2="125" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">Mach 1</text>
  <text x="340" y="138" font-size="11" text-anchor="end" fill="#1f2a44">Mach number</text>
  <text x="42" y="24" font-size="11" fill="#1f2a44">C_D</text>
</svg>
```

The exact shape depends on the vehicle, which is why real trajectories use a table of $C_D$ against Mach, not a single value.
:::

::: context fermi-story Named after Enrico Fermi
Enrico Fermi, a physicist, was famous for quick estimates from almost nothing. At the first nuclear test in 1945 he dropped small scraps of paper as the blast wave passed, watched how far they drifted, and estimated the explosion's energy on the spot — within about a factor of two of the careful measurement made later. His classroom version, "how many piano tuners are in Chicago?", is still the standard example. The skill is the same: split an impossible question into small ones you can guess.
:::
