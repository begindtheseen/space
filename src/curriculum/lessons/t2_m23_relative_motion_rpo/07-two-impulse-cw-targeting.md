---
id: l07-two-impulse-cw-targeting
title: Two-impulse CW rendezvous targeting
minutes: 18
covers:
  - two-impulse CW rendezvous targeting
---

Picture tossing a ball to a friend across a yard. You know where the ball starts (in your hand). You know where you want it to end up (in her hands). You even know roughly how long you want it in the air. The only thing you get to choose is how hard, and in which direction, you throw. Getting that one choice right is called **aiming** — and in spaceflight it is called **[[targeting|targeting-word]]**.

Every lesson in this module so far ran the other way. It started from a burn and asked what relative motion came out. A real rendezvous asks the backward question. The chaser sits at a known spot near the target. The mission wants it somewhere else — at the target, or at a hold point near it — after a chosen amount of time. What velocity should the chaser give itself *right now* to make that happen?

Because the Clohessy-Wiltshire (CW) equations are linear, the answer comes out of one matrix equation. It uses the same state transition matrix you built in the STM lesson. There it predicted where the chaser would go. Here you run it backward to decide where to send it. Rendezvous planners use some version of this idea for the far-field burns of vehicles flying to the International Space Station (ISS).

## The question targeting asks

Recall the **state transition matrix** $\boldsymbol\Phi(t)$ (read "capital phi of t"). It takes the chaser's relative state at time zero and gives you the state at time $t$. Split into four $3\times3$ blocks, it reads

$$
\begin{bmatrix}\boldsymbol\rho(t)\\ \dot{\boldsymbol\rho}(t)\end{bmatrix} =
\begin{bmatrix}\boldsymbol\Phi_{rr}(t) & \boldsymbol\Phi_{rv}(t) \\ \boldsymbol\Phi_{vr}(t) & \boldsymbol\Phi_{vv}(t)\end{bmatrix}
\begin{bmatrix}\boldsymbol\rho_0\\ \dot{\boldsymbol\rho}_0\end{bmatrix}.
$$

Here $\boldsymbol\rho$ (Greek "rho") is the chaser's position relative to the target, in the LVLH frame: $x$ radial (up), $y$ in-track (the direction of flight), $z$ cross-track. $\dot{\boldsymbol\rho}$, read "rho-dot", is its relative velocity. The little subscripts say which block does what. $\boldsymbol\Phi_{rv}$, read "phi r-v", turns a starting **v**elocity into a final position (**r**). $\boldsymbol\Phi_{rr}$ turns a starting position into a final position, and so on.

Now sort the quantities into what you know and what you can choose.

- **Fixed:** the chaser's current position $\boldsymbol\rho_0$. You cannot teleport a spacecraft. A thruster changes velocity, not position.
- **Chosen by the mission:** the place you want to arrive, $\boldsymbol\rho_f$ ("f" for final), and the **transfer time** $T$ — how long the trip takes. For a direct rendezvous, $\boldsymbol\rho_f = \mathbf{0}$: arrive exactly at the target.
- **Free:** the velocity right after the first burn. Call it $\mathbf{v}_0$. It is the one thing you get to pick, like the strength and direction of the throw.

## Solving for the departure velocity

Write out the top row of the matrix equation at $t = T$. It says where the chaser ends up:

$$
\boldsymbol\rho_f = \boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0 + \boldsymbol\Phi_{rv}(T)\,\mathbf{v}_0.
$$

In words: the final position is "where the starting position alone would carry you" plus "how much the starting velocity moves you". Everything here is known except $\mathbf{v}_0$. So solve for it, the same way you would solve $5 = 2 + 3v$ for $v$. Move the known piece to the left, then divide by what multiplies the unknown. For matrices, "divide" means multiply by the **[[inverse|matrix-inverse]]**, written $\boldsymbol\Phi_{rv}(T)^{-1}$ — the matrix that undoes $\boldsymbol\Phi_{rv}(T)$:

$$
\mathbf{v}_0 = \boldsymbol\Phi_{rv}(T)^{-1}\big(\boldsymbol\rho_f - \boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0\big).
$$

This is why the $\boldsymbol\Phi_{rv}$ block was worth naming back in the STM lesson. It measures how sensitive the arrival position is to the departure velocity. Targeting reads that sensitivity backward. $\boldsymbol\Phi_{rr}$ is never inverted: it multiplies $\boldsymbol\rho_0$, which you already know, so it only shifts the goal.

The first burn, $\Delta\mathbf{v}_1$ (read "delta-v one"), is the change from the velocity the chaser had right before the burn, written $\dot{\boldsymbol\rho}_0^{\,-}$ (the little minus means "right before"), to the one it needs:

$$
\Delta\mathbf{v}_1 = \mathbf{v}_0 - \dot{\boldsymbol\rho}_0^{\,-}.
$$

If the chaser was holding still relative to the target, $\dot{\boldsymbol\rho}_0^{\,-} = \mathbf{0}$ and the burn is the whole of $\mathbf{v}_0$.

## The second burn

Back to the ball. You aimed well, and it reaches your friend's hands at the planned moment. It is still moving fast. If she does not catch it, it sails right past.

The same is true in orbit. The first burn fixes *where* the chaser is at time $T$. It says nothing about how fast it is going when it gets there. Read the arrival velocity off the bottom row of the matrix equation:

$$
\mathbf{v}_f = \boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0 + \boldsymbol\Phi_{vv}(T)\,\mathbf{v}_0.
$$

This is almost never zero, even when $\boldsymbol\rho_f = \mathbf{0}$. A true **rendezvous** means arriving *and* matching the target's motion, so the chaser stops beside it. That needs a second burn, the "catch":

$$
\Delta\mathbf{v}_2 = \mathbf{v}_f^{\text{desired}} - \mathbf{v}_f,
$$

with $\mathbf{v}_f^{\text{desired}} = \mathbf{0}$ for docking or for stopping at a hold point. Two burns: one to shape the trip, one to kill the leftover speed. It is the same two-burn pattern as a **[[Hohmann transfer|hohmann-bridge]]**, now solved in the target's frame instead of between two whole orbits.

::: key Two-impulse CW targeting
$$
\mathbf{v}_0 = \boldsymbol\Phi_{rv}(T)^{-1}\big(\boldsymbol\rho_f-\boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0\big), \qquad
\Delta\mathbf{v}_1 = \mathbf{v}_0-\dot{\boldsymbol\rho}_0^{\,-}, \qquad
\Delta\mathbf{v}_2 = \mathbf{v}_f^{\text{desired}} - \big(\boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0+\boldsymbol\Phi_{vv}(T)\mathbf{v}_0\big).
$$
:::

We call these **impulses** because the model treats each burn as instant. That is a fair picture: a burn lasts seconds, and the trip lasts thousands of seconds.

## Transfer times you must avoid

An inverse does not always exist. The number $0$ has no reciprocal, and a matrix can fail the same way. A matrix with no inverse is called **[[singular|singular-meaning]]**. When $\boldsymbol\Phi_{rv}(T)$ is singular, some arrival points cannot be reached at that $T$ at all, whatever you do with the first burn — and when it is *nearly* singular, the required $\mathbf{v}_0$ becomes huge.

The CW equations split into two separate problems, and each has its own bad times.

**Cross-track.** The out-of-plane motion is the plain oscillator $z(t) = z_0\cos nt + (\dot z_0/n)\sin nt$, where $n$ is the target's orbital rate (its mean motion). Look at the second term. Whenever $\sin nT = 0$ — at every multiple of half an orbit — the starting sideways velocity $\dot z_0$ has no effect on $z(T)$ at all. A swing on a playground is the same: however hard you push it, it passes back through the bottom at the same moments. So the cross-track channel is singular at $T = $ half an orbit, one orbit, one and a half orbits, and so on.

**In-plane.** The radial and in-track block has different bad times. It is singular at every *whole* orbit, and at a few odd times such as $nT \approx 8.84$ radians (about $1.41$ orbits). It is *not* singular at half an orbit.

::: note Why a whole orbit is a bad transfer time
Put $nT = 2\pi$ into the in-plane part of $\boldsymbol\Phi_{rv}$ from the STM lesson. With $\sin nT = 0$ and $\cos nT = 1$, the terms $\sin nT/n$ and $(2/n)(1-\cos nT)$ vanish, and $(4\sin nT - 3nT)/n$ becomes $-6\pi/n$:

$$
\boldsymbol\Phi_{rv}^{\text{in-plane}}(2\pi/n) = \begin{bmatrix} 0 & 0 \\ 0 & -6\pi/n \end{bmatrix}.
$$

The whole top row is zero. So after exactly one orbit, *no* starting velocity changes your radial position $x$. Every relative orbit that leaves a point comes back to the same height one orbit later. You can drift ahead or behind, but you cannot arrive higher or lower. A matrix with a row of zeros has determinant zero, and has no inverse.

The general in-plane determinant is $\big(8(1-\cos nT) - 3nT\sin nT\big)/n^2$. At half an orbit ($nT = \pi$) it is $16/n^2$, far from zero. It is zero at $nT = 0$, at every multiple of $2\pi$, and where $\tan(nT/2) = 3nT/8$, first at $nT \approx 8.84$.
:::

::: warning Do not pick a bad transfer time
Never target a transfer that lands on, or very near, one of these singular times. Near them the required $\mathbf{v}_0$ grows without limit. In practice, solve the in-plane $2\times2$ problem and the cross-track $1\times1$ problem separately. That way a half-orbit transfer with no cross-track goal ($z_0 = z_f = 0$) works fine, even though the full $3\times3$ block has no inverse there. If you do need to change $z$, avoid $\sin nT = 0$.
:::

## A worked transfer

Now some real numbers. The chaser sits $1\,\mathrm{km}$ behind the target on the V-bar (the in-track line through the target): $\boldsymbol\rho_0 = (0,\ -1000,\ 0)\,\mathrm{m}$. It is holding still, so $\dot{\boldsymbol\rho}_0^{\,-} = \mathbf{0}$. The goal is the target itself, $\boldsymbol\rho_f = \mathbf{0}$. The orbit is this module's reference orbit: $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, one orbit every $5569.4\,\mathrm{s}$, so half an orbit is $2784.7\,\mathrm{s}$.

Solving the targeting equations for several transfer times gives

| Transfer time $T$ | 1200 s | 1800 s | 2400 s | 2784.7 s (half orbit) |
| --- | --- | --- | --- | --- |
| $\lVert\Delta\mathbf{v}_1\rVert$ | 0.902 m/s | 0.560 m/s | 0.366 m/s | 0.282 m/s |
| $\lVert\Delta\mathbf{v}_2\rVert$ | 0.902 m/s | 0.560 m/s | 0.366 m/s | 0.282 m/s |
| Total $\Delta v$ | 1.804 m/s | 1.120 m/s | 0.731 m/s | 0.564 m/s |

($\lVert\cdot\rVert$, read "the size of", is the length of a vector.)

Two things stand out. First, a faster trip costs more propellant. This is the same **[[time-fuel trade|lambert-trade]]** you met in Lambert targeting. Second, the two burns are the same size in every column. That is special to this start and finish: a start straight behind the target, an arrival at the target, stopping dead. The trip is a mirror image of itself, so the braking burn mirrors the departure burn. It is not a general law.

::: example Working out the 1800 s burn by hand
**Step 1: the pieces of $\boldsymbol\Phi$.** At $T = 1800\,\mathrm{s}$, $nT = 2.0307\,\mathrm{rad}$. Only the in-plane part matters here, because nothing happens cross-track. From the STM formulas,

$$
\boldsymbol\Phi_{rr}\boldsymbol\rho_0 = (0,\ -1000)\,\mathrm{m}, \qquad
\boldsymbol\Phi_{rv}^{\text{in-plane}} = \begin{bmatrix} 794.31 & 2559.65 \\ -2559.65 & -2222.75 \end{bmatrix}\,\mathrm{s}.
$$

The first result says: with no burn at all, the chaser stays put at $y = -1000\,\mathrm{m}$. That makes sense — a vehicle sitting still on the V-bar is on the target's own orbit, a little behind it.

**Step 2: the goal minus where you would drift anyway.** $\boldsymbol\rho_f - \boldsymbol\Phi_{rr}\boldsymbol\rho_0 = (0,0) - (0,-1000) = (0,\ 1000)\,\mathrm{m}$. The burn must move the chaser $1000\,\mathrm{m}$ forward and $0$ up or down.

**Step 3: invert the $2\times2$.** For $\begin{bmatrix} a & b \\ c & d\end{bmatrix}$ the inverse is $\frac{1}{ad-bc}\begin{bmatrix} d & -b \\ -c & a\end{bmatrix}$. The determinant is

$$
ad - bc = (794.31)(-2222.75) - (2559.65)(-2559.65) \approx -1\,765\,600 + 6\,551\,800 \approx 4.786\times10^{6}\,\mathrm{s^2}.
$$

Then

$$
\dot x_0 = \frac{d\cdot 0 - b\cdot 1000}{4.786\times10^6} = \frac{-2\,559\,650}{4.786\times10^6} \approx -0.535\,\mathrm{m/s}, \qquad
\dot y_0 = \frac{-c\cdot 0 + a\cdot 1000}{4.786\times10^6} = \frac{794\,310}{4.786\times10^6} \approx 0.166\,\mathrm{m/s}.
$$

So $\mathbf{v}_0 = (-0.535,\ 0.166,\ 0)\,\mathrm{m/s}$, and since the chaser was still, $\Delta\mathbf{v}_1 = \mathbf{v}_0$. Its size is $\sqrt{0.535^2 + 0.166^2} \approx 0.560\,\mathrm{m/s}$, matching the table.

**Step 4: the arrival velocity.** The bottom row gives $\mathbf{v}_f = (0.535,\ 0.166,\ 0)\,\mathrm{m/s}$, so the braking burn is $\Delta\mathbf{v}_2 = -\mathbf{v}_f = (-0.535,\ -0.166,\ 0)\,\mathrm{m/s}$.

**Does it make sense?** The biggest part of the burn is *downward* ($\dot x_0 < 0$), more than three times the forward part. That looks odd for a trip that is purely forward. But it is the CW coupling at work. The chaser [[dips below the target|dip-to-catch-up]], and a lower orbit is a faster orbit, so it gains ground. The path swings down about $264\,\mathrm{m}$ at the halfway point and climbs back up to arrive at the target. A naive push straight forward along $+y$ would do the opposite of what you want: speeding up raises the orbit, and a higher orbit falls *behind*.
:::

## Checking the plan against reality

The targeting answer is exact *for the CW model*. It has to be: it was built from the CW solution itself. The real question is how well a CW-designed transfer works in the real, **nonlinear** physics — full two-body gravity, with nothing straightened out. To test it, apply the planned $\Delta\mathbf{v}_1$ to the chaser's true orbit around Earth, and let a computer integrate the exact equations of motion.

::: example The 1 km transfer in nonlinear truth
Fly the $T = 1800\,\mathrm{s}$ transfer above through full two-body gravity. The chaser does not arrive at $\boldsymbol\rho = \mathbf{0}$. It arrives at

$$
\boldsymbol\rho(T) = (0.237,\ -0.304,\ 0)\,\mathrm{m}.
$$

The miss distance is $\sqrt{0.237^2 + 0.304^2} \approx 0.385\,\mathrm{m}$ — about $38.5\,\mathrm{cm}$. The arrival velocity is $(0.5349,\ 0.1655,\ 0)\,\mathrm{m/s}$, very close to the CW prediction $(0.5348,\ 0.1660,\ 0)\,\mathrm{m/s}$.

**Is that reasonable?** Yes. The arithmetic is fine. This is the validity gap from the CW-validity lesson showing up in a real plan. The vehicles are never more than about a kilometre apart, the trip is about a third of an orbit, and the validity lesson predicted errors of a few tenths of a metre for exactly that. The miss is $0.04\%$ of the distance flown.
:::

A $38.5\,\mathrm{cm}$ miss after a kilometre-long trip is small. A sensor and a tiny trim burn fix it easily. But it is not zero, and it grows fast for longer or larger transfers. So no real rendezvous flies a CW-planned burn pair **[[open-loop|open-loop]]** over any serious distance. The first burn gets the chaser close, using exactly the algebra above. Then **[[mid-course corrections|mid-course]]** re-plan from fresh measurements. For the last few hundred metres, guidance switches to closed-loop laws that watch the sensors continuously — the glideslope of the next lesson. Two-impulse CW targeting is the coarse solve. It is not, by itself, the whole guidance system.

## Check yourself

::: check
The first burn alone puts the chaser exactly at $\boldsymbol\rho_f$ at time $T$. Explain in one or two sentences why a rendezvous still needs a second impulse.
:::

::: answer
The first burn only makes the *position* match $\boldsymbol\rho_f$ at time $T$. It says nothing about the *velocity* the chaser carries when it arrives, which is generally not zero. Without a second impulse to cancel that leftover relative velocity, the chaser would fly straight through the target point instead of stopping there.
:::

::: check
Why is $\boldsymbol\Phi_{rv}(T)$ the block you invert to find the departure velocity, and not $\boldsymbol\Phi_{rr}(T)$ or one of the others?
:::

::: answer
In the equation for final position, $\boldsymbol\Phi_{rv}(T)$ is the block that multiplies the one unknown, $\mathbf{v}_0$. To get $\mathbf{v}_0$ by itself you must undo that multiplication, which means inverting $\boldsymbol\Phi_{rv}(T)$. $\boldsymbol\Phi_{rr}(T)$ multiplies the already known $\boldsymbol\rho_0$. It moves to the other side as a known offset and never needs to be inverted, because nothing about it is unknown.
:::

::: check
A transfer is planned for $T$ equal to exactly one orbital period. What goes wrong? Give a physical reason why one full orbit is a bad choice, even before doing any algebra.
:::

::: answer
One orbital period is $T = 2\pi/n$, so $nT = 2\pi$, $\sin nT = 0$ and $\cos nT = 1$. The in-plane $\boldsymbol\Phi_{rv}(T)$ becomes $\begin{bmatrix}0 & 0\\ 0 & -6\pi/n\end{bmatrix}$. It has a whole row of zeros, so it has no inverse, and the targeting equation has no unique solution. (The cross-track entry $\sin nT/n$ is zero too.)

Physically: every free relative orbit that starts at a point returns to the same radial height exactly one orbit later. A velocity kick can make the chaser drift ahead or behind in that time, but it cannot make it arrive higher or lower. So most arrival points are out of reach at that transfer time, and those nearly out of reach need enormous burns.
:::

::: check
In the worked $1\,\mathrm{km}$ transfer, the total $\Delta v$ falls from $1.804\,\mathrm{m/s}$ at $T = 1200\,\mathrm{s}$ to $0.564\,\mathrm{m/s}$ at half an orbit. What general trade does this show, and where have you seen it before?
:::

::: answer
It is the time-versus-propellant trade. A shorter trip must cover the same distance in less time, which needs a larger velocity change to start it and a larger one to stop it. A longer trip can go more gently and costs less. You met the same trade in Lambert targeting between two whole orbits. It holds until the transfer gets too long for the mission's schedule, or runs into one of the singular transfer times.
:::

::: check
The $1\,\mathrm{km}$, $1800\,\mathrm{s}$ transfer misses by $0.385\,\mathrm{m}$ in nonlinear truth. A similar transfer starts $10\,\mathrm{km}$ behind instead, with the same $1800\,\mathrm{s}$ transfer time. Using what the CW-validity lesson taught about how the error grows, predict the miss, and say what it means for how you would fly it.
:::

::: answer
The CW-validity lesson showed that CW's position error grows roughly with the *square* of the separation, for the same fraction of an orbit. Ten times the separation gives about $10^2 = 100$ times the error: roughly $100 \times 0.385 \approx 38.5\,\mathrm{m}$. (A nonlinear propagation of that transfer gives $38.5\,\mathrm{m}$, right on the prediction.)

Tens of metres is not a rounding issue near a space station. A transfer that long must include a mid-course correction burn, re-planned from new measurements, instead of trusting one open-loop CW solution all the way in.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{v}_0=\boldsymbol\Phi_{rv}(T)^{-1}(\boldsymbol\rho_f-\boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0)$ | Required departure velocity for a chosen transfer time $T$ |
| $\Delta\mathbf{v}_1 = \mathbf{v}_0 - \dot{\boldsymbol\rho}_0^{\,-}$ | First impulse: needed velocity minus the velocity right before the burn |
| $\mathbf{v}_f=\boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0+\boldsymbol\Phi_{vv}(T)\mathbf{v}_0$ | Arrival relative velocity, generally not zero |
| $\Delta\mathbf{v}_2 = \mathbf{v}_f^{\text{desired}} - \mathbf{v}_f$ | Second impulse: cancels the arrival velocity for a true rendezvous |
| Cross-track singular | $\sin nT = 0$: every multiple of half an orbit |
| In-plane singular | Every whole orbit, and odd times such as $nT \approx 8.84\,\mathrm{rad}$; not at half an orbit |
| Shorter $T$ | Larger total $\Delta v$ — the same time-fuel trade as Lambert targeting |
| 1 km, 1800 s worked transfer | $\Delta\mathbf{v}_1 = (-0.535,\ 0.166,\ 0)\,\mathrm{m/s}$; nonlinear truth misses by $0.385\,\mathrm{m}$ |

Two-impulse targeting moves a chaser from one relative state to another at a chosen time. It does not yet say how to fly the last few hundred metres safely, or along which line. The next lesson starts on that with the glideslope: a rule that sets the closing speed from the range that is left, and keeps correcting as it goes.

::: context targeting-word Aiming, in orbit
In spaceflight, **targeting** means solving for the burn that makes a vehicle arrive at a chosen place at a chosen time. It is the orbital version of aiming. An artillery crew picks the angle and charge that land a shell on a spot. A basketball player picks the speed and angle that put the ball through the hoop. In both cases the start is fixed and the end is chosen, and the job is to find the one launch velocity that connects them. Here, the "launch" is the chaser's first burn.
:::

::: context matrix-inverse What "inverse" means
For ordinary numbers, dividing by $3$ is the same as multiplying by $\frac{1}{3}$, the number that undoes "times $3$". A matrix inverse does the same job for a matrix. If $\mathbf{A}$ turns a velocity into a position, $\mathbf{A}^{-1}$ turns that position back into the velocity. Multiplying the two gives the identity matrix $\mathbf{I}$, the matrix version of the number $1$.

For a $2\times2$ matrix there is a short recipe: swap the two diagonal numbers, flip the signs of the other two, and divide everything by the **determinant** $ad - bc$:

$$
\begin{bmatrix} a & b \\ c & d\end{bmatrix}^{-1} = \frac{1}{ad-bc}\begin{bmatrix} d & -b \\ -c & a\end{bmatrix}.
$$

In flight software, nobody writes out the inverse. The code calls a linear solver such as NumPy's `np.linalg.solve`, which is faster and more accurate.
:::

::: context hohmann-bridge The same two burns, seen from a different chair
A Hohmann transfer moves a spacecraft between two circular orbits with two burns: one to leave the first orbit on an oval path, one to settle into the second. Two-impulse CW targeting has the same shape — a burn to start the trip and a burn to end it. The difference is where you stand. Hohmann is worked out from Earth's center, using whole orbits. CW targeting is worked out from the target, using small relative motions. For two vehicles a few kilometres apart, the relative picture is far easier to use, and it is what rendezvous engineers work in.
:::

::: context singular-meaning A matrix that cannot be undone
A matrix is **singular** when it squashes some directions flat, so that different inputs give the same output. Then you cannot work backward: seeing the output, you cannot tell which input made it. Its determinant is zero, and it has no inverse, the same way the number $0$ has no reciprocal.

The curve below is the in-plane determinant of $\boldsymbol\Phi_{rv}$ (times $n^2$) against $nT$. It crosses zero at a whole orbit ($2\pi$) and near $8.84$, but not at half an orbit ($\pi$), where it is well above zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="345" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,110.0 43.3,110.0 46.7,109.9 50.0,109.7 53.3,109.5 56.7,109.1 60.0,108.7 63.3,108.2 66.7,107.7 70.0,107.0 73.3,106.2 76.7,105.2 80.0,104.2 83.3,103.0 86.7,101.6 90.0,100.1 93.3,98.5 96.7,96.7 100.0,94.7 103.3,92.6 106.7,90.3 110.0,87.9 113.3,85.3 116.7,82.7 120.0,79.9 123.3,77.0 126.7,74.0 130.0,71.0 133.3,68.0 136.7,65.0 140.0,62.0 143.3,59.1 146.7,56.3 150.0,53.6 153.3,51.0 156.7,48.7 160.0,46.6 163.3,44.8 166.7,43.3 170.0,42.2 173.3,41.4 176.7,40.9 180.0,40.9 183.3,41.4 186.7,42.2 190.0,43.6 193.3,45.4 196.7,47.7 200.0,50.4 203.3,53.6 206.7,57.2 210.0,61.2 213.3,65.6 216.7,70.4 220.0,75.5 223.3,80.9 226.7,86.5 230.0,92.2 233.3,98.1 236.7,104.1 240.0,110.0 243.3,115.9 246.7,121.6 250.0,127.2 253.3,132.5 256.7,137.4 260.0,142.0 263.3,146.1 266.7,149.7 270.0,152.7 273.3,155.1 276.7,156.9 280.0,158.0 283.3,158.3 286.7,157.9 290.0,156.7 293.3,154.7 296.7,152.0 300.0,148.5 303.3,144.3 306.7,139.3 310.0,133.7 313.3,127.4 316.7,120.5 320.0,113.1 323.3,105.3 326.7,97.0 330.0,88.5 333.3,79.8 336.7,70.9 340.0,62.0"/>
  <circle cx="240" cy="110" r="5" fill="#b4232c"/>
  <circle cx="321.3" cy="110" r="5" fill="#b4232c"/>
  <circle cx="140" cy="62" r="4" fill="#1f2a44"/>
  <line x1="140" y1="62" x2="140" y2="110" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="140" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">π (half)</text>
  <text x="240" y="100" font-size="11" text-anchor="middle" fill="#b4232c">2π</text>
  <text x="321" y="126" font-size="11" text-anchor="middle" fill="#b4232c">8.84</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">8(1−cos nT) − 3nT sin nT</text>
  <text x="345" y="184" font-size="11" text-anchor="end" fill="#1f2a44">nT (radians) →</text>
  <text x="44" y="184" font-size="11" fill="#b4232c">red dots: no inverse</text>
</svg>
```
:::

::: context lambert-trade Hurry costs fuel
In Lambert targeting you picked a flight time between two points in space and solved for the orbit that connects them. Short flight times needed fast, expensive orbits. The same thing happens here in miniature. Think of catching a bus: leave early and you can walk; leave late and you have to sprint, then stop hard at the door. Here both the sprint and the stop cost propellant, which is why total $\Delta v$ climbs so steeply as $T$ shrinks — from $0.564\,\mathrm{m/s}$ at half an orbit to $1.804\,\mathrm{m/s}$ at $1200\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="25.7" width="46" height="144.3" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="73" y="19.7" font-size="11" text-anchor="middle" fill="#1f2a44">1.804</text>
  <text x="73" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">1200 s</text>
  <rect x="125" y="80.4" width="46" height="89.6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="148" y="74.4" font-size="11" text-anchor="middle" fill="#1f2a44">1.120</text>
  <text x="148" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">1800 s</text>
  <rect x="200" y="111.5" width="46" height="58.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="223" y="105.5" font-size="11" text-anchor="middle" fill="#1f2a44">0.731</text>
  <text x="223" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">2400 s</text>
  <rect x="275" y="124.9" width="46" height="45.1" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="298" y="118.9" font-size="11" text-anchor="middle" fill="#1f2a44">0.564</text>
  <text x="298" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">2785 s</text>
  <text x="345" y="20" font-size="11" text-anchor="end" fill="#1f2a44">total Δv (m/s) for the 1 km transfer</text>
</svg>
```
:::

::: context dip-to-catch-up Go down to get ahead
In orbit, lower means faster. A vehicle below the target is on a smaller orbit with a shorter period, so it creeps ahead. That is why the targeting answer points mostly downward. The picture shows the planned $1800\,\mathrm{s}$ path in the target's frame: it leaves $1000\,\mathrm{m}$ behind, sinks to about $264\,\mathrm{m}$ below the target halfway through, and rises back to meet it. (The up-down direction is drawn stretched to about twice the scale of the forward direction.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="335" y="42" font-size="11" text-anchor="end" fill="#6c7a93">V-bar (target's height)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,50.0 43.4,65.7 47.9,80.6 53.6,94.8 60.3,108.0 67.9,120.4 76.5,131.7 85.9,141.9 96.0,151.1 106.8,159.2 118.1,166.0 129.9,171.7 142.1,176.1 154.6,179.3 167.2,181.2 180.0,181.9 192.8,181.2 205.4,179.3 217.9,176.1 230.1,171.7 241.9,166.0 253.2,159.2 264.0,151.1 274.1,141.9 283.5,131.7 292.1,120.4 299.7,108.0 306.4,94.8 312.1,80.6 316.6,65.7 320.0,50.0"/>
  <circle cx="40" cy="50" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="313" y="43" width="14" height="14" fill="#1f2a44"/>
  <text x="40" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">chaser, 1000 m behind</text>
  <text x="320" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">target</text>
  <line x1="180" y1="50" x2="180" y2="182" stroke="#b4232c" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="186" y="120" font-size="11" fill="#b4232c">264 m below at 900 s</text>
  <text x="180" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">direction of flight →</text>
</svg>
```
:::

::: context open-loop Open loop and closed loop
**Open-loop** means you work out the commands once and then carry them out without looking again, like throwing a dart with your eyes shut after aiming. **Closed-loop** means you keep measuring where you are and correcting, like steering a bicycle. Open-loop plans are cheap and easy to check before flight. Closed-loop guidance forgives small errors in the model, the burns and the sensors. Real rendezvous uses both: open-loop plans for the long early legs, closed-loop control for the close-in part.
:::

::: context mid-course Planning in steps
Visiting vehicles do not reach a space station with one pair of burns. Their approach is a sequence of burns over many hours, each one planned from the latest navigation data. After each burn the vehicle measures where it really is, and the next burn is re-targeted with the same kind of algebra you used in this lesson. Small errors are caught while they are still small. The $38.5\,\mathrm{cm}$ miss from the worked example is exactly the kind of error a later, smaller burn tidies up.
:::
