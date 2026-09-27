---
id: l08-anchor-e-adcs-momentum-management
title: "Anchor E: ADCS momentum management"
minutes: 19
covers:
  - "anchor project E — ADCS momentum management with reaction wheels and magnetorquers"
---

Put a bucket under a slowly dripping tap. The bucket does a fine job — it catches every drop. But it does not make the water go away. Leave it long enough and it overflows. Somebody has to come by and empty it, and the real question is: how often?

A spacecraft's **[[reaction wheels|reaction-wheel]]** are that bucket. They are heavy wheels spun by electric motors. Speeding a wheel up one way twists the spacecraft the other way, so the wheels can point the spacecraft without burning any fuel. But every small, steady push from space — a pull from gravity, a brush of thin air, a magnet on board that is not perfectly cancelled — gets caught by the wheels as extra spin. The wheels **store** that spin; they do not remove it. A wheel that reaches its top speed is **[[saturated|saturation]]**, and a saturated wheel can no longer twist the spacecraft at all.

**Momentum management** is the work of budgeting how fast that spin piles up and removing it before it becomes a problem — usually with **magnetorquers**, electromagnets that push against Earth's magnetic field. It belongs to **ADCS** (said "A-D-C-S"), attitude determination and control: the part of a spacecraft that knows which way it points and keeps it pointing there. It is chosen as an anchor project because it is a systems study — sizing, budgeting, margin — rather than a single algorithm. That kind of judgment is exactly what an ADCS engineer uses day to day.

## Spin you cannot see: angular momentum

A spinning thing carries **angular momentum** — the "amount of spin", which depends on how heavy it is, how its mass is spread out, and how fast it turns. It is measured in **newton-meter-seconds**, written $\mathrm{N\,m\,s}$.

A **torque** is a twist, measured in newton-meters ($\mathrm{N\,m}$). The rule that ties them together is the spinning version of "force changes speed": a torque held for a time changes the angular momentum by torque times time.

$$
\Delta H = T\,\Delta t \qquad (\text{for a steady torque}).
$$

Here $H$ is angular momentum, $T$ is torque and $\Delta t$ is the time it acts. Newton-meters times seconds gives newton-meter-seconds, so the units agree.

Out in space, nothing outside the spacecraft can hold it steady. So when an outside torque twists the spacecraft and the control system fights back with the wheels, the extra angular momentum goes into the wheels. Every steady outside torque becomes wheel speed that keeps growing.

## What the project has to contain

The individual **disturbance torques** — the unwanted twists from space — are:

- **gravity gradient**: gravity pulls a little harder on the parts of the spacecraft nearer Earth;
- **aerodynamic torque**: thin air at low orbit pushes unevenly on the body;
- **solar radiation pressure**: sunlight itself pushes, very gently, on sunlit surfaces;
- **residual magnetic dipole**: the spacecraft's own electronics act like a weak bar magnet, which Earth's field twists.

Their models, and the magnetic torque rule

$$
\mathbf M = \mathbf m\times\mathbf B,
$$

are built in full elsewhere in this course. Here $\mathbf m$ is the **magnetic dipole moment** (how strong a magnet something is, in ampere-square-meters, $\mathrm{A\,m^2}$), $\mathbf B$ is Earth's magnetic field (in teslas, $\mathrm T$), $\mathbf M$ is the torque, and $\times$ is the **cross product** — the result points at right angles to both, and is biggest when they are at right angles to each other. The same rule governs both a disturbance (an unwanted on-board magnet) and a magnetorquer (a magnet you control on purpose).

This project uses those models for something the derivations do not do on their own: a **momentum budget** across a real mission's environment, and a demonstrated ability to remove the momentum. Three things make the budget credible.

1. **A worst-case torque bound.** A disturbance torque depends on which way the spacecraft points. A defensible budget states the biggest torque the control system must handle, not only the value at one assumed attitude.
2. **Secular versus cyclic accounting.** A **[[secular|secular-cyclic]]** disturbance keeps pushing the same way, so its momentum piles up orbit after orbit. A **cyclic** one flips direction as the spacecraft goes around, so over an orbit it mostly cancels even if its peak is large. They call for very different wheel sizes.
3. **A stated desaturation margin.** **Desaturation** (or "momentum dumping") means emptying the bucket. The margin compares how much momentum the magnetorquers (or thrusters) can remove per orbit with how much the environment adds — reported as a ratio, not asserted as "sufficient".

::: key
A momentum budget needs three things: a worst-case disturbance-torque bound, not the value at one assumed attitude; a secular-versus-cyclic accounting, because one-signed torques accumulate and sign-reversing ones mostly cancel; and a desaturation margin stated as a ratio of removal capability to accumulation over the same interval.
:::

## A worst-case torque bound, checked two ways

### Why gravity twists a spacecraft

Hold a pencil by its middle and imagine Earth far below. The bottom end is a little closer to Earth, so gravity pulls it a little harder than the top end. If the pencil is tilted, that small difference twists it until it hangs straight down. That is the **[[gravity-gradient torque|gravity-gradient]]**.

The size of the twist depends on how the spacecraft's mass is spread out, described by its **[[principal moments of inertia|moment-of-inertia]]** — three numbers saying how hard it is to spin about each of its three natural axes. Put them on the diagonal of a matrix, $\mathbf I=\mathrm{diag}(I_x,\,I_y,\,I_z)$, in $\mathrm{kg\,m^2}$. The torque is

$$
\mathbf T_{gg}=\frac{3\mu}{r^3}\,\hat{\mathbf r}\times(\mathbf I\hat{\mathbf r}),
$$

where $\mu$ ("mew") $=3.986\times10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravity constant, $r$ is the distance from Earth's center, and $\hat{\mathbf r}$ ("r hat") is the unit arrow pointing toward (or away from) Earth, written in the spacecraft's own axes. Earth's direction is called **nadir** (said "NAY-der").

Its biggest possible size, over every way the spacecraft could point, has a short closed form:

$$
T_{gg,\max}=\frac{3\mu}{2r^3}\,|I_{\max}-I_{\min}|.
$$

::: note Why the worst case is at 45 degrees between two axes
First, if $\hat{\mathbf r}$ lies along one of the three natural axes, then $\mathbf I\hat{\mathbf r}$ points the same way (it is only stretched). A cross product of two parallel arrows is zero. So the torque is zero along every principal axis, however lopsided the body is.

Now tilt $\hat{\mathbf r}$ by an angle $\theta$ ("theta") between axis $a$ and axis $b$: $\hat{\mathbf r}=(\cos\theta,\ \sin\theta)$ in those two axes. Then $\mathbf I\hat{\mathbf r}=(I_a\cos\theta,\ I_b\sin\theta)$, and the cross product of the two has size

$$
\cos\theta\cdot I_b\sin\theta-\sin\theta\cdot I_a\cos\theta=(I_b-I_a)\sin\theta\cos\theta=\tfrac12(I_b-I_a)\sin2\theta.
$$

The first step multiplies out the 2-D cross product. The second pulls out $\sin\theta\cos\theta$. The third uses $\sin2\theta=2\sin\theta\cos\theta$. The biggest value of $\sin2\theta$ is $1$, at $\theta=45^\circ$. Picking the pair of axes with the most different moments gives the $|I_{\max}-I_{\min}|$ in the bound, and multiplying by $3\mu/r^3$ gives the formula.
:::

::: example Peak gravity-gradient torque, found by brute force and confirmed by the formula
A small satellite has principal moments $\mathbf I=\mathrm{diag}(0.30,\,0.35,\,0.12)\,\mathrm{kg\,m^2}$ and flies a $500\,\mathrm{km}$ circular orbit. Earth's radius is $6378.137\,\mathrm{km}$, so $r=6878.137\,\mathrm{km}$, and the **orbital period** (time for one lap) is $2\pi\sqrt{r^3/\mu}\approx5677\,\mathrm s$, about $95$ minutes.

**Step 1 — the common factor.** $\dfrac{3\mu}{r^3}=\dfrac{3\times3.986\times10^{14}}{(6.878\times10^{6})^3}\approx3.675\times10^{-6}\,\mathrm{s^{-2}}$.

**Step 2 — brute force.** A computer tries every nadir direction in the body frame and keeps the biggest torque: $4.226\times10^{-7}\,\mathrm{N\,m}$.

**Step 3 — the formula.** $I_{\max}-I_{\min}=0.35-0.12=0.23\,\mathrm{kg\,m^2}$, so $T_{gg,\max}=\tfrac12\times3.675\times10^{-6}\times0.23=4.226\times10^{-7}\,\mathrm{N\,m}$.

The two agree to four significant figures. That confirms the scan found the true worst case, and that it happens — as the formula predicts — when nadir sits halfway between the $0.35$ axis and the $0.12$ axis.

**Step 4 — a typical case.** Now point the $0.12$ axis (the smallest moment) at Earth, tipped $5^\circ$ toward the $0.30$ axis — a realistic pointing error. Using the two-axis result from the note, $3.675\times10^{-6}\times(0.30-0.12)\times\sin5^\circ\cos5^\circ=3.675\times10^{-6}\times0.18\times0.0868\approx5.74\times10^{-8}\,\mathrm{N\,m}$.

**Sanity check.** That is about $4.226/0.574\approx7$ times smaller than the worst case, which makes sense for a spacecraft pointing nearly along a natural axis. A budget should report both numbers: the worst case to design against, and the typical case to expect.
:::

### From torque to piled-up momentum

For a conservative sizing bound, pretend the worst-case torque keeps pushing the same way for a whole orbit, as if the attitude never moved relative to it. Using $\Delta H=T\,\Delta t$:

$$
4.226\times10^{-7}\,\mathrm{N\,m}\times5677\,\mathrm s=2.40\times10^{-3}\,\mathrm{N\,m\,s}\ \text{per orbit}.
$$

Divide a wheel's **momentum capacity** (the most spin it can hold) by this to get the orbits until it is full:

| Wheel capacity | Orbits to saturate |
| --- | --- |
| $0.01\,\mathrm{N\,m\,s}$ | $0.01/0.0024\approx4.2$ |
| $0.05\,\mathrm{N\,m\,s}$ | $\approx20.8$ |
| $0.18\,\mathrm{N\,m\,s}$ | $\approx75$ |

That is a direct, checkable answer to "how often does this vehicle need to empty its wheels?" — stated before the magnetorquers are even considered.

::: key
A good worst-case bound is one you can check two independent ways — here a numerical scan and the closed form $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$, matching to four significant figures. Report both the worst case and a representative case; the ratio between them is itself useful sizing information.
:::

## Secular or cyclic: does it pile up?

Picture pushing a child on a swing. Push at the right moment every time, always the same way, and the swing goes higher and higher. Push forward on one pass and backward on the next, and it barely moves. A steady one-way push adds up. A push that flips direction cancels itself.

Which one gravity gradient is depends on how the spacecraft points:

- **Nadir-pointing** (always facing Earth, turning once per orbit to do so): the nadir direction never changes in the body's own axes. The torque never flips sign. It is **secular**, and the wheel momentum grows every orbit — the case the $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ bound describes.
- **Inertially fixed** (pointing at the same stars all the time): nadir sweeps a full circle in the body axes once per orbit. The torque flips roughly twice per orbit, so over a full orbit it mostly cancels. It is **cyclic**: the wheels ride a bounded up-and-down swing instead of a growing pile.

## Emptying the bucket: magnetorquers

A **[[magnetorquer|magnetorquer]]** is a coil of wire (often wound on a metal rod). Run current through it and it becomes an electromagnet with dipole moment $\mathbf m$. Earth's field twists it by $\mathbf M=\mathbf m\times\mathbf B$. The control system picks $\mathbf m$ so that this twist opposes the stored wheel momentum; the wheels then slow down while the spacecraft stays still.

Earth's field weakens with height roughly as the cube of distance:

$$
B\approx B_0\left(\frac{R_\oplus}{r}\right)^3,
$$

where $B_0$ is the field at the surface and $R_\oplus$ ("R earth") is Earth's radius. It also varies around the orbit, roughly doubling from equator to pole, so the numbers below are representative, not exact.

::: example Desaturation margin against the worst-case bound
**Step 1 — the field.** With $B_0\approx3.12\times10^{-5}\,\mathrm T$ at the surface, $(6378.137/6878.137)^3\approx0.797$, so $B\approx3.12\times10^{-5}\times0.797\approx2.49\times10^{-5}\,\mathrm T$ at $500\,\mathrm{km}$.

**Step 2 — the biggest torque.** A typical small-satellite torquer has $m=0.2\,\mathrm{A\,m^2}$. At best (dipole at right angles to the field), $T=mB=0.2\times2.49\times10^{-5}=4.98\times10^{-6}\,\mathrm{N\,m}$.

**Step 3 — per orbit.** $4.98\times10^{-6}\times5677\approx2.83\times10^{-2}\,\mathrm{N\,m\,s}$ of momentum removed per orbit, at most.

**Step 4 — the margin.** $\dfrac{2.83\times10^{-2}}{2.40\times10^{-3}}\approx11.8$.

**Sanity check.** The torquer's best torque, $4.98\times10^{-6}\,\mathrm{N\,m}$, is about $12$ times the worst gravity-gradient torque, $4.226\times10^{-7}\,\mathrm{N\,m}$ — the same ratio, as it must be, since both were multiplied by the same orbit time. A margin near $12$, not the word "sufficient", is the engineering answer to "can this system keep up?" It leaves room for the aerodynamic and residual-dipole torques a full budget would add on top of gravity gradient — and for the fact that a real torquer is rarely at right angles to the field.
:::

::: warning
A desaturation controller tested only against perfect models — no wheel friction, no torquer misalignment, no error in the field model — has proven that the control law can close a loop, not that it is robust. This is the same trap this module named for a guidance law tested only on the plant it was designed against. Re-run the desaturation against a perturbed environment — a torquer misaligned by a few degrees, a field strength uncertain by $10\%$, added wheel friction — before calling the margin demonstrated rather than assumed.
:::

## What the interviewer asks, and what to have ready

- **"Why gravity gradient, and not something more exotic?"** Because at low orbit it and aerodynamic torque often dominate the budget. You should be able to say so, and justify the ranking, not only compute one number.
- **"Is your torque bound the worst case or a typical one, and how do you know?"** The closed-form cross-check. A bound with no independent confirmation is a number, not evidence.
- **"Why magnetorquers rather than thrusters for dumping momentum?"** Magnetorquers use no propellant and can work continuously as the field turns under the vehicle. The cost: they only make torque at right angles to the field at that moment. With magnets alone, the spacecraft is **[[underactuated|underactuated]]** at any instant — one direction of torque is missing — and it relies on the field changing direction around the orbit to become fully controllable over time.
- **"What happens during a long stretch of poor geometry or weak authority?"** The budget should answer this directly, with a stated margin and a stated worst case, not silence.

## Check yourself

::: check
Explain why the peak gravity-gradient torque in the worked example happened with nadir between the axes of largest and smallest moment, and not along any single principal axis.
:::

::: answer
Along any single principal axis, $\hat{\mathbf r}$ and $\mathbf I\hat{\mathbf r}$ point the same way, so their cross product — and the torque — is exactly zero, however lopsided the body is.

The torque depends on how far apart in direction $\hat{\mathbf r}$ and $\mathbf I\hat{\mathbf r}$ are. For $\hat{\mathbf r}$ tilted by $\theta$ between two axes, the size is $\tfrac12|I_a-I_b|\sin2\theta$ times $3\mu/r^3$, which is largest at $45^\circ$ between the two axes with the most different moments. The numerical scan and the closed form $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$ agreed on this to four significant figures.
:::

::: check
A vehicle holds a fixed attitude relative to the orbit (nadir-pointing) instead of a fixed attitude relative to the stars. Using secular and cyclic, explain why this makes gravity-gradient momentum pile-up much worse.
:::

::: answer
Nadir-pointing means the nadir direction never changes in the body's axes as the vehicle orbits. So the gravity-gradient torque never flips sign: it is secular, and its momentum adds up in the wheels orbit after orbit, just as the one-orbit bound computed.

A star-fixed attitude sees nadir sweep a full circle in the body axes once per orbit. The torque flips roughly twice per orbit and nearly cancels over a lap, leaving a bounded cyclic swing the wheels ride out, not a growing pile they must be emptied of again and again.
:::

::: check
A project says "the magnetorquers are sufficient to desaturate the wheels" with no number. What ratio should replace that sentence, and why state both the top and the bottom of it?
:::

::: answer
The ratio of removal capability to disturbance accumulation over the same interval. Here: the most momentum the torquers can remove per orbit, $2.83\times10^{-2}\,\mathrm{N\,m\,s}$, divided by the conservative worst-case accumulation per orbit, $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ — a margin of about $11.8$.

Both numbers must be shown because a reviewer cannot check or recompute a bare ratio. And a margin near $1$ is a very different situation from a margin near $12$, even though the same vague word "sufficient" could describe either.
:::

::: check
Why is a desaturation law tested only against a perfectly modeled field and a perfectly aligned torquer weaker evidence than one also tested against a misaligned torquer and an uncertain field?
:::

::: answer
A perfect-model test only shows the law closes the loop under the exact conditions it was designed and tuned for. That proves the logic is coded correctly, but says nothing about how much room there is before real imperfections — torquer mounting error, field-model error, wheel friction — degrade it or break it.

It is the same "tested only on the plant it was designed against" failure this module names for guidance and control projects in general. Re-testing against a perturbed environment is what shows robustness, not only correctness.
:::

::: check
Which role family does this anchor map to, and what single number will a reviewer from that family want to see at the top of the write-up?
:::

::: answer
ADCS — attitude determination and control. The most important opening number is the desaturation margin: the ratio of magnetorquer (or thruster) momentum-removal capability to the worst-case disturbance accumulation over the same period. It is the direct, checkable answer to whether momentum management works across the mission's real environment, not only in a nominal case.
:::

## Summary

| Item | Value in this lesson's worked example |
| --- | --- |
| Momentum from a steady torque | $\Delta H=T\,\Delta t$, in $\mathrm{N\,m\,s}$ |
| Gravity-gradient torque | $\mathbf T_{gg}=\tfrac{3\mu}{r^3}\hat{\mathbf r}\times(\mathbf I\hat{\mathbf r})$; worst case $\tfrac{3\mu}{2r^3}\lvert I_{\max}-I_{\min}\rvert$ |
| Peak gravity-gradient torque | $4.226\times10^{-7}\,\mathrm{N\,m}$ (scan and closed form agree to 4 s.f.) |
| Representative ($5^\circ$ offset) torque | $5.74\times10^{-8}\,\mathrm{N\,m}$, about $7\times$ smaller than worst case |
| One-orbit secular momentum bound | $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ |
| Magnetorquer | $\mathbf M=\mathbf m\times\mathbf B$; max $4.98\times10^{-6}\,\mathrm{N\,m}$; $2.83\times10^{-2}\,\mathrm{N\,m\,s}$ per orbit |
| Desaturation margin | $\approx11.8\times$ the worst-case secular accumulation |
| Secular vs cyclic | One-signed torques pile up; sign-flipping torques mostly cancel over an orbit |
| Common trap | Desaturation shown only against a perfect field and torquer, never a perturbed one |

The next lesson leaves the five anchor projects for work that complements them: hardware-adjacent projects, where the evidence is not a simulation's correctness but a real sensor's noise, bias and misalignment — measured, not assumed.

::: context reaction-wheel Turning by spinning the other way
Sit on a swivel chair with your feet off the floor and spin a bicycle wheel held above your head. As the wheel speeds up one way, you and the chair turn the other way. Nothing outside pushed you: the total spin stayed the same, it just moved between you and the wheel.

A reaction wheel does this inside a spacecraft. Most spacecraft carry three or four, set on different axes, so they can turn about any axis. They give smooth, precise pointing — which is why space telescopes and imaging satellites rely on them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="25" width="160" height="80" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="65" r="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 158 50 A 26 26 0 0 1 202 50" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="206,56 198,46 208,44" fill="#1d6fd1"/>
  <text x="180" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">wheel</text>
  <path d="M 80 35 A 110 110 0 0 0 80 95" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="80,102 74,90 86,90" fill="#b4232c"/>
  <text x="20" y="120" font-size="11" fill="#b4232c">body turns this way</text>
  <text x="190" y="18" font-size="11" fill="#1d6fd1">wheel spins up this way</text>
</svg>
```
:::

::: context saturation When the bucket is full
Every wheel motor has a top speed, often a few thousand revolutions per minute. Once there, it cannot speed up any further, so it cannot make any more torque in that direction. The spacecraft then drifts off its target, which for an imaging or communications satellite means lost data. Operators watch wheel speeds on their telemetry displays and schedule momentum dumps well before that point — which is exactly the margin this project puts a number on.
:::

::: context secular-cyclic Growing pile or bounded swing
"Secular" comes from the Latin *saeculum*, "an age" — something that keeps going over long times. Astronomers use it for slow, steady drifts that build up, as opposed to effects that repeat around each orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">time (orbits)</text>
  <text x="14" y="75" font-size="11" fill="#1f2a44" transform="rotate(-90 14 75)" text-anchor="middle">wheel momentum</text>
  <line x1="40" y1="105" x2="320" y2="25" stroke="#b4232c" stroke-width="2.5"/>
  <text x="60" y="40" font-size="11" fill="#b4232c">secular: keeps growing</text>
  <path d="M40,105 Q75,80 110,105 T180,105 T250,105 T320,105" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="330" y="80" font-size="11" fill="#1d6fd1" text-anchor="end">cyclic: bounded swing</text>
</svg>
```
:::

::: context gravity-gradient Why the Moon always shows one face
Gravity gradient is weak on a satellite, but over millions of years it is powerful. It is part of why the Moon keeps the same face toward Earth: Earth's pull on the Moon's slightly stretched shape locked its spin to its orbit.

Some small satellites use the same effect on purpose. A long boom with a weight on the end makes the satellite hang "down" toward Earth by itself, with no wheels at all. The torque is proportional to $1/r^3$, so it matters most in low orbit and fades quickly farther out.
:::

::: context moment-of-inertia The figure skater's arms
A figure skater spins faster when she pulls her arms in. With her arms out, more of her mass is far from the spin axis, which makes her harder to spin — a larger **moment of inertia**. Every rigid body has three natural axes, the **principal axes**, where spinning is "clean" (no wobble). The moments about those axes are the principal moments. A long, thin spacecraft has a small moment about its long axis and larger ones about the other two — just the lopsidedness that gravity gradient acts on.
:::

::: context magnetorquer An electromagnet with no moving parts
A magnetorquer is a loop or rod of coiled wire. Current through the coil makes it a magnet, just like a classroom electromagnet made from a nail and a battery. Its strength is the dipole moment: for a flat coil, the number of turns times the current times the coil's area, so its units are $\mathrm{A\,m^2}$.

It has no moving parts and uses only electrical power, so it cannot wear out or run out of fuel. It only works where there is a strong enough planetary field — fine in low Earth orbit, useless far from Earth, where thrusters must dump momentum instead.
:::

::: context underactuated Pushing sideways only
The cross product $\mathbf m\times\mathbf B$ is always at right angles to $\mathbf B$. So whatever current you choose, a magnetorquer can never make torque *along* the field line. At any instant one direction of twist is missing. That is what "underactuated" means: fewer independent controls than directions to control.

The rescue is time. As the spacecraft moves around its orbit, the direction of Earth's field in its body turns. A twist that was impossible over the equator becomes possible later in the orbit. Averaged over an orbit, all three directions are reachable. This is why magnetic desaturation is judged per orbit, not per second.
:::
