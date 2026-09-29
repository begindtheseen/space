---
id: l03-poles-zeros-root-locus
title: Poles, zeros and the root locus with pole, zero, damp, pzmap and rlocus
minutes: 22
covers:
  - rlocus, pzmap, damp, pole, zero
---

Tap a wine glass with a spoon and it rings with one clear note. Tap a big church bell and it hums, lower and longer. Push a child on a swing once and let go: the swing goes back and forth at its own pace, slowing down a little each time. Every object has its own natural ways of moving when you disturb it and leave it alone. You cannot change the note of the glass by tapping harder. The note belongs to the glass.

A control system is the same. The last lesson watched the antenna loop overshoot by 16% and settle in about 4 seconds, and watched a fin actuator creep up with a 50 ms time constant. Those shapes were not accidents of the input. They were the system's own natural motions showing through. In a transfer function, those natural motions are the **poles**. The **zeros** decide how strongly each motion shows up at the output, and one kind of zero makes a response start off in the wrong direction.

This lesson reads poles and zeros with `pole`, `zero` and `pzmap`, turns them into damping and frequency with `damp`, and then uses `rlocus` to watch the poles move as a controller's gain is turned up. On a real vehicle this is how you check whether a pitch loop is stable, how quickly a flexible mode of the rocket's body dies away, and how much gain you can use before something starts to shake.

## What a pole means

Lesson 1 defined a pole as a value of $s$ that makes the denominator zero. Here is what that value *does*. Each pole $p$ adds a piece shaped like $e^{pt}$ to the system's response. The **[[exponential|e-to-the-pt]]** $e^{pt}$ is either a smooth decay, a smooth growth, or — when $p$ is complex — a wave inside a decaying or growing envelope.

- A **real, negative pole**, like $p = -5$, gives $e^{-5t}$: a smooth decay. The further left, the faster. Its time constant is $1/5 = 0.2\,\mathrm{s}$.
- A **real, positive pole**, like $p = +1$, gives $e^{t}$: it grows without limit. That is an unstable system.
- A **pole at zero**, $p = 0$, gives a constant: an integrator that holds whatever it was pushed to, like the antenna's angle.
- A **complex pair**, $p = -\sigma \pm j\omega_d$ (read "minus sigma plus or minus j omega d"), gives $e^{-\sigma t}$ times a sine wave at $\omega_d$ radians per second. Here $j$ is the imaginary unit, $j^2 = -1$. The real part sets the decay; the imaginary part sets the wiggle.

So every pole can be placed on a flat map called the **[[s-plane|s-plane-map]]**: the real part across, the imaginary part up. Where a pole sits on the map tells you what its motion looks like.

::: key
An LTI system is stable when every pole has a negative real part: every pole sits in the left half of the s-plane. A pole on the right side grows without limit. For a closed loop, the poles that count are the closed-loop poles, the poles of the feedback system.
:::

In MATLAB, `pole(sys)` returns the poles as a column vector.

::: example Reading the antenna loop's poles
The closed antenna loop from lessons 1 and 2 was $T = \frac{4}{s^2 + 2s + 4}$.

```matlab
s = tf('s');
T = 4/(s^2 + 2*s + 4);
p = pole(T)
% p =
%   -1.0000 + 1.7321i
%   -1.0000 - 1.7321i
```

**Step 1: solve by hand.** $s^2 + 2s + 4 = 0$ gives $s = \frac{-2 \pm \sqrt{4 - 16}}{2} = -1 \pm \frac{\sqrt{-12}}{2} = -1 \pm j\sqrt{3}$. And $\sqrt{3} = 1.7321$, matching MATLAB.

**Step 2: read the real part.** $\sigma = 1$, so the wiggle lives inside an envelope $e^{-t}$, which has a time constant of $1\,\mathrm{s}$.

**Step 3: read the imaginary part.** $\omega_d = 1.732\,\mathrm{rad/s}$, so one full wiggle takes $2\pi / 1.732 = 3.63\,\mathrm{s}$.

**Sanity check.** Lesson 2 found the peak at $1.81\,\mathrm{s}$. That is half of $3.63\,\mathrm{s}$: the response reaches its first peak half a wiggle after the step, as a sine wave does. And the envelope $e^{-t}$ falls below 2% after about $4\,\mathrm{s}$ ($e^{-4} = 0.018$), matching the settling time of about 4 s.
:::

## damp: damping and frequency from each pole

Lesson 2 described second-order systems with a natural frequency $\omega_n$ and a damping ratio $\zeta$. Those two numbers come straight from the pole. For a pole $p$:

$$
\omega_n = |p|, \qquad \zeta = -\frac{\operatorname{Re}(p)}{|p|}
$$

Read $|p|$ as "the size of p": its distance from the origin of the s-plane. Read $\operatorname{Re}(p)$ as "the real part of p". So the natural frequency is how far the pole is from the origin, and the damping ratio is how much of that distance points to the left. A pole straight up the imaginary axis has $\zeta = 0$ and rings forever. A pole on the negative real axis has $\zeta = 1$ and never rings. The **time constant** of the pole's envelope is $1/(\zeta\omega_n) = 1/\sigma$.

For the antenna: $|p| = \sqrt{1^2 + 1.732^2} = \sqrt{4} = 2$, and $\zeta = 1/2 = 0.5$. Exactly the $\omega_n = 2$ and $\zeta = 0.5$ that lesson 2 found by matching coefficients.

`damp` does this for every pole at once:

```matlab
damp(T)              % prints a table
[wn, zeta, p] = damp(T);
% wn   = [2; 2]
% zeta = [0.5; 0.5]
```

Octave prints the table like this:

```matlab
%   Pole                   Damping     Frequency        Time Constant
%                                      (rad/seconds)    (seconds)
%   -1.00e+00+1.73e+00i    5.00e-01    2.00e+00         1.00e+00
%   -1.00e+00-1.73e+00i    5.00e-01    2.00e+00         1.00e+00
```

MATLAB's table has the same four columns (pole, damping, frequency, time constant) with slightly different spacing. When you write a script, use the output form `[wn, zeta, p] = damp(sys)`; the numbers are the same everywhere and you can test them with `assert`, as lesson 2 did with `stepinfo`.

::: example A flexible mode of a rocket body
A launch vehicle is long and thin, and it bends. Its first **[[bending mode|bending-mode-shape]]** behaves like a very lightly damped second-order system. Take a mode at $\omega_n = 20\,\mathrm{rad/s}$ with $\zeta = 0.01$, as in this module's first exercise.

```matlab
s = tf('s');
wn = 20; zeta = 0.01;
Bm = wn^2/(s^2 + 2*zeta*wn*s + wn^2);
pole(Bm)
% ans =
%   -0.200 + 19.999i
%   -0.200 - 19.999i
[w, z] = damp(Bm)
% w = [20; 20],  z = [0.0100; 0.0100]
```

**Step 1: real part.** $\sigma = \zeta\omega_n = 0.01 \times 20 = 0.2\,\mathrm{s^{-1}}$, so the time constant is $1/0.2 = 5\,\mathrm{s}$.

**Step 2: imaginary part.** $\omega_d = \omega_n\sqrt{1 - \zeta^2} = 20\sqrt{0.9999} = 19.999\,\mathrm{rad/s}$, so one wiggle takes $2\pi/20 = 0.314\,\mathrm{s}$.

**Step 3: how long it rings.** To fall to about 2% takes four time constants, $20\,\mathrm{s}$. That is $20/0.314 \approx 64$ wiggles.

**Sanity check.** On the s-plane, this pole pair sits almost on the imaginary axis: $0.2$ to the left, $20$ up. A pole so close to the axis means a motion that barely dies away, which is exactly what "lightly damped" means. Tap a long metal pole and it hums for a long time; a rocket body does the same. That is why flight controllers include filters to keep their commands away from this frequency, the subject of lesson 4.
:::

::: warning Frequency in damp is rad/s, not hertz
`damp` reports $\omega_n$ in radians per second. A mode at $20\,\mathrm{rad/s}$ is $20/(2\pi) = 3.18\,\mathrm{Hz}$. Structural engineers usually quote hertz and control engineers usually use rad/s, so a "20" in one report and a "3.2" in another may be the same mode. Always write the unit.
:::

## Zeros: what shows up at the output

Poles decide which motions exist. **Zeros** decide how much of each motion reaches the output. `zero(sys)` returns them. A zero never makes a system unstable on its own, but it changes the shape of the response, sometimes a lot.

`pzmap(sys)` draws both on the s-plane: poles as crosses (x), zeros as circles (o). With outputs, `[p, z] = pzmap(sys)` returns them instead of drawing. It is the fastest way to see a model's whole personality at a glance.

A zero in the left half plane makes the response faster and adds overshoot. A zero in the right half plane does something stranger.

::: example A response that starts the wrong way
Take $G(s) = \frac{1 - s}{(s+1)(s+2)}$. It has poles at $-1$ and $-2$ (stable) and a zero at $s = +1$, on the right side.

```matlab
s = tf('s');
G = (1 - s)/((s + 1)*(s + 2));
[p, z] = pzmap(G)
% p = [-2; -1],   z = 1
[y, t] = step(G, 8);
% y dips to about -0.167 near t = 0.41 s, then rises to 0.5
```

**Step 1: final value.** At $s = 0$, $G = \frac{1}{1 \times 2} = 0.5$. So the output should end at $0.5$.

**Step 2: the exact response.** Splitting $\frac{G(s)}{s}$ into simple fractions gives $y(t) = 0.5 - 2e^{-t} + 1.5e^{-2t}$. At $t = 0$ that is $0.5 - 2 + 1.5 = 0$, as it should be.

**Step 3: the dip.** The slope is $2e^{-t} - 3e^{-2t}$, which is negative at first ($2 - 3 = -1$ at $t = 0$). It is zero when $e^{-t} = 2/3$, at $t = \ln 1.5 = 0.405\,\mathrm{s}$. There $y = 0.5 - 2(2/3) + 1.5(4/9) = 0.5 - 1.333 + 0.667 = -0.167$.

**Step 4: what stepinfo would say.** The output first goes $0.167$ the wrong way, a third of its final value $0.5$. So `stepinfo(G)` reports `Undershoot` of about 33.3%.

**Sanity check.** The output first goes *down* when it was asked to go *up*, then turns around and ends at $+0.5$. If a zero in the right half plane really inverts the start of the response, that is exactly the picture you should see — and you do.
:::

A system with a zero in the right half plane is called **[[non-minimum phase|wrong-way-aircraft]]**. The name comes from the phase. On a frequency sweep (lesson 4's subject), a zero at $s = -a$ and a zero at $s = +a$ have exactly the same size at every frequency: both grow as the frequency rises. But the left-half-plane zero pushes the phase *ahead*, up to $+90^\circ$, while the right-half-plane zero drags it *behind*, down to $-90^\circ$. At the frequency $\omega = a$, both have grown the gain by a factor of $\sqrt{2}$; one has added $+45^\circ$ and the other $-45^\circ$. More gain and more lag at the same time is the worst combination for a feedback loop.

::: key
A non-minimum-phase zero is a zero in the right half plane, which adds phase lag while increasing gain and puts a hard limit on achievable bandwidth. Sensor placement relative to the mode shape of a flexible mode can invert the initial response, producing exactly this.
:::

**Bandwidth** here means roughly how fast the loop is allowed to respond. You cannot tune the limit away: no controller can undo the wrong-way start, because it is in the plant. A common rule of thumb keeps the loop's crossover frequency, where its gain falls through 1 (lesson 4), below about half the zero's frequency.

Why would a rocket have one? When a booster bends, some points along its body do not move sideways at all; those are the **nodes** of the mode. A [[rate gyro|rate-gyro]] measures rotation where it is mounted, and that local rotation is the rigid-body rotation plus the bending. Where the gyro sits relative to the mode's shape decides the sign of the bending part. In a bad spot, the first thing the gyro sees after a nozzle command is the bending, going the opposite way to the rigid-body turn. The transfer function from nozzle to that gyro then has a right-half-plane zero. Flight-control teams choose sensor locations with the mode shapes in hand for exactly this reason.

::: warning A right-half-plane zero is not unstable
People sometimes see a positive entry in `zero(sys)` and call the system unstable. Stability depends only on the poles. The system above has poles at $-1$ and $-2$ and settles perfectly well. The zero makes it harder to control fast, and it will pull closed-loop poles to the right as gain rises, which is the next section's story.
:::

## The root locus: poles on the move

Here is the question every control designer asks: "If I turn the gain up, what happens?" Put a gain $K$ in front of an open-loop system $L(s)$ and close the loop with negative feedback. The closed loop is `feedback(K*L, 1)`, and its poles move as $K$ changes. The **root locus** is the set of paths they trace as $K$ goes from $0$ to infinity. "Root" because closed-loop poles are roots of a polynomial; "locus" is Latin for "place". The method dates from **[[Walter Evans|evans-history]]** around 1948.

Two rules make the picture easy to predict:

- At $K = 0$ the loop is open, so the paths **start at the open-loop poles**.
- As $K$ grows without limit, the paths **end at the open-loop zeros**, and any paths left over head off to infinity.

In MATLAB, `rlocus(L)` draws the paths. Click a point on the plot and a data tip shows the gain and damping there. `r = rlocus(L, K)` returns the closed-loop poles for a list of gains, one column per gain. Octave's `rlocus` takes different optional arguments, so the gain sweep below uses `pole(feedback(K*L, 1))`, which works the same in both and gives the same numbers.

::: example Choosing the antenna's gain
Take the antenna plant $L(s) = \frac{1}{s(s+2)}$ with gain $K$.

```matlab
s = tf('s');
L = 1/(s*(s + 2));
rlocus(L)                          % draw the locus
for K = [0.5 1 4 10]
    disp(pole(feedback(K*L, 1)).')
end
%  -1.7071  -0.2929               (K = 0.5)
%  -1       -1                    (K = 1)
%  -1.0000 + 1.7321i  -1.0000 - 1.7321i   (K = 4)
%  -1 + 3i  -1 - 3i               (K = 10)
```

**Step 1: the closed-loop polynomial.** $1 + KL = 0$ means $s(s+2) + K = 0$, that is $s^2 + 2s + K = 0$. Its roots are $s = -1 \pm \sqrt{1 - K}$.

**Step 2: small gain.** At $K = 0.5$, $\sqrt{0.5} = 0.7071$, so the poles are $-0.293$ and $-1.707$. They started at $0$ and $-2$ (the open-loop poles) and have moved toward each other.

**Step 3: they meet.** At $K = 1$ the square root is zero and both poles sit at $-1$.

**Step 4: they turn.** For $K > 1$ the square root is imaginary, so the poles are $-1 \pm j\sqrt{K - 1}$. They shoot straight up and down along the line $\operatorname{Re}(s) = -1$. There are no zeros, so both paths head to infinity.

**Step 5: pick the damping.** Here $\omega_n = \sqrt{K}$ and $\zeta = 1/\sqrt{K}$. For $\zeta = 0.5$ you need $\sqrt{K} = 2$, so $K = 4$ — the gain lesson 1 used. At $K = 10$, $\zeta = 1/\sqrt{10} = 0.316$: faster wiggles, the same decay, more overshoot.

**Sanity check.** The real part stays at $-1$ for every $K > 1$, so the envelope decays at the same rate no matter how high the gain. Turning up the gain here buys faster wiggling, not faster settling. That matches lesson 2's settling estimate $4/(\zeta\omega_n) = 4/1 = 4\,\mathrm{s}$ for any $K > 1$.
:::

Drawn out, those two paths make a simple cross: [[the antenna's locus|locus-picture]] slides along the real axis, then turns straight up and down. Now add the non-minimum-phase zero. Take $L(s) = \frac{1 - s}{s(s+2)}$. The closed-loop polynomial is $s(s+2) + K(1 - s) = s^2 + (2 - K)s + K$. The middle coefficient shrinks as $K$ grows. At $K = 2$ it is zero and the poles sit on the imaginary axis at $\pm j\sqrt{2} = \pm 1.414j$: the loop oscillates forever. At $K = 3$ they are at $0.5 \pm 1.658j$, on the right side: unstable. The zero at $+1$ is a place where one path must end, so as the gain grows the locus is dragged across into the right half plane. That is the "hard limit" of the key block drawn as a picture: past $K = 2$, more gain destroys the loop.

::: warning rlocus assumes negative feedback and a positive gain
`rlocus(L)` plots the poles of `feedback(K*L, 1)` for $K \ge 0$. If your loop has a sign flip somewhere (a sensor that reads positive for a nose-down pitch, say), the real closed loop is a different one, and the plot you are looking at is the wrong locus. Check the sign convention of every block before you trust the picture.
:::

## Check yourself

::: check
A model has poles at $-3$, $-0.5 \pm 4j$ and $+0.1$. Is it stable? Which pole dominates the long-term behavior, and why?
:::

::: answer
It is not stable: the pole at $+0.1$ has a positive real part, so its $e^{0.1t}$ piece grows without limit, doubling about every $\ln 2 / 0.1 = 6.9\,\mathrm{s}$. That pole dominates in the long run, because every other piece decays ($e^{-3t}$ and $e^{-0.5t}$ envelopes) while this one grows.
:::

::: check
For the pole $p = -3 + 4j$, find $\omega_n$, $\zeta$, the time constant and the period of its wiggle, and say what `damp` would print in its frequency column.
:::

::: answer
$|p| = \sqrt{3^2 + 4^2} = 5$, so $\omega_n = 5\,\mathrm{rad/s}$, which is what `damp` prints as the frequency. $\zeta = 3/5 = 0.6$. Time constant $= 1/3 = 0.333\,\mathrm{s}$. The wiggle frequency is the imaginary part, $4\,\mathrm{rad/s}$, so its period is $2\pi/4 = 1.57\,\mathrm{s}$.
:::

::: check
A structures report says the first bending mode is at $2.5\,\mathrm{Hz}$ with 1% damping. What pole pair should you expect `pole` to show for that mode?
:::

::: answer
$\omega_n = 2\pi \times 2.5 = 15.7\,\mathrm{rad/s}$ and $\zeta = 0.01$. The real part is $-\zeta\omega_n = -0.157$ and the imaginary part is $\omega_n\sqrt{1 - \zeta^2} \approx 15.7$. So expect about $-0.157 \pm 15.7j$: very close to the imaginary axis, as a lightly damped mode must be.
:::

::: check
`zero(G)` returns `2` and `pole(G)` returns `[-1; -4]`. A colleague says "G is unstable because of the 2". Correct them, and say what the 2 means for the step response and for how fast you can make a loop around G.
:::

::: answer
Stability depends only on the poles, and both poles are negative, so $G$ is stable. The zero at $+2$ is in the right half plane, so $G$ is non-minimum phase: its step response starts off in the wrong direction (undershoot) before heading to its final value. It also adds phase lag while raising the gain at high frequency, which limits bandwidth; a common rule of thumb keeps the crossover below about $1\,\mathrm{rad/s}$, half the zero's frequency.
:::

::: check
For $L(s) = \frac{1}{s(s+4)}$ with gain $K$, find the gain at which the two closed-loop poles meet, and the gain that gives $\zeta = 0.5$.
:::

::: answer
The closed-loop polynomial is $s^2 + 4s + K = 0$, with roots $-2 \pm \sqrt{4 - K}$. They meet when $4 - K = 0$, at $K = 4$, both at $s = -2$. For $K > 4$, $\omega_n = \sqrt{K}$ and $2\zeta\omega_n = 4$, so $\zeta = 2/\sqrt{K}$. Setting $\zeta = 0.5$ gives $\sqrt{K} = 4$, so $K = 16$. Check: $s^2 + 4s + 16$ has roots $-2 \pm j\sqrt{12} = -2 \pm 3.46j$, with $|p| = 4$ and $\zeta = 2/4 = 0.5$.
:::

## Summary

| Idea | Meaning | MATLAB or formula |
|---|---|---|
| Pole | natural motion $e^{pt}$ of the system | `pole(sys)` |
| Stability | every pole has a negative real part | left half of the s-plane |
| Complex pair | $-\sigma \pm j\omega_d$: decay $e^{-\sigma t}$, wiggle at $\omega_d$ | time constant $1/\sigma$ |
| Natural frequency, damping | $\omega_n = \lvert p \rvert$, $\zeta = -\operatorname{Re}(p)/\lvert p \rvert$ | `[wn, zeta, p] = damp(sys)` |
| Zero | shapes how much of each motion reaches the output | `zero(sys)` |
| Pole-zero map | poles as x, zeros as o | `pzmap(sys)`, `[p, z] = pzmap(sys)` |
| Non-minimum-phase zero | zero in the right half plane | wrong-way start, extra lag, bandwidth limit |
| Root locus | closed-loop poles of `feedback(K*L,1)` as $K$ grows | `rlocus(L)`, `r = rlocus(L, K)` |
| Locus rules | start at open-loop poles, end at zeros or infinity | |

Next, lesson 4 looks at the same loops from the frequency side — `bode`, `nyquist` and `margin` — and turns "how close are these poles to the right half plane?" into gain and phase margins, the numbers a flight-control review board asks for first.

::: context e-to-the-pt Why a pole gives e to the pt
Split a transfer function into simple fractions, one per pole: $\frac{c_1}{s - p_1} + \frac{c_2}{s - p_2} + \cdots$. Each piece $\frac{1}{s - p}$ is the transformed version of $e^{pt}$ — the one signal whose rate of change is always $p$ times itself. So the response is a sum of $e^{p_1 t}$, $e^{p_2 t}$ and so on. When $p = -\sigma + j\omega_d$ is complex, Euler's formula $e^{j\omega_d t} = \cos\omega_d t + j\sin\omega_d t$ turns $e^{pt}$ into $e^{-\sigma t}$ times a wave, and the pair's imaginary parts cancel to leave a real response.
:::

::: context s-plane-map A map of motions
Across is the real part: left is decay, right is growth. Up is the imaginary part: higher means faster wiggling. A pole far to the left dies fast. A pole close to the vertical axis barely dies at all. A pole on the right side runs away. Poles on the real axis do not wiggle. Every closed loop you design is a choice of where to put its poles on this map.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="220" y="10" width="130" height="180" fill="#f2b880" opacity="0.3"/>
  <line x1="10" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="220" y1="10" x2="220" y2="190" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="340" y="116" font-size="11" fill="#6c7a93" text-anchor="end">real part</text>
  <text x="226" y="22" font-size="11" fill="#6c7a93">imaginary part</text>
  <text x="120" y="24" font-size="12" fill="#1d6fd1" text-anchor="middle">stable side</text>
  <text x="285" y="182" font-size="12" fill="#b4232c" text-anchor="middle">unstable side</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="44" y1="94" x2="56" y2="106"/><line x1="44" y1="106" x2="56" y2="94"/>
    <line x1="164" y1="44" x2="176" y2="56"/><line x1="164" y1="56" x2="176" y2="44"/>
    <line x1="164" y1="144" x2="176" y2="156"/><line x1="164" y1="156" x2="176" y2="144"/>
    <line x1="204" y1="24" x2="216" y2="36"/><line x1="204" y1="36" x2="216" y2="24"/>
    <line x1="204" y1="164" x2="216" y2="176"/><line x1="204" y1="176" x2="216" y2="164"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="274" y1="94" x2="286" y2="106"/><line x1="274" y1="106" x2="286" y2="94"/>
  </g>
  <text x="50" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">fast decay</text>
  <text x="130" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">rings, dies</text>
  <text x="200" y="48" font-size="11" fill="#1f2a44" text-anchor="end">rings long</text>
  <text x="290" y="124" font-size="11" fill="#b4232c" text-anchor="middle">grows</text>
</svg>
```
:::

::: context bending-mode-shape Where a rocket bends
In its first bending mode a free rocket flexes like a banana: the middle moves one way while both ends move the other. Two points, roughly a fifth of the length in from each end for a uniform body, stay still; they are the nodes. Near a node, the body still tilts even though it does not move sideways, and the direction of that tilt changes from one part of the body to another. A rate gyro mounted in the wrong place sees the bending's tilt in the opposite direction to the rigid-body turn. Real vehicles are not uniform, so their node positions come from structural models and tests.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30.0,40.0 40.0,44.6 50.0,49.3 60.0,53.9 70.0,58.4 80.0,62.8 90.0,67.1 100.0,71.1 110.0,74.8 120.0,78.2 130.0,81.1 140.0,83.6 150.0,85.6 160.0,87.1 170.0,87.9 180.0,88.2 190.0,87.9 200.0,87.1 210.0,85.6 220.0,83.6 230.0,81.1 240.0,78.2 250.0,74.8 260.0,71.1 270.0,67.1 280.0,62.8 290.0,58.4 300.0,53.9 310.0,49.3 320.0,44.6 330.0,40.0"/>
  <circle cx="97" cy="70" r="5" fill="#b4232c"/>
  <circle cx="263" cy="70" r="5" fill="#b4232c"/>
  <text x="97" y="112" font-size="11" fill="#b4232c" text-anchor="middle">node</text>
  <text x="263" y="112" font-size="11" fill="#b4232c" text-anchor="middle">node</text>
  <text x="30" y="24" font-size="11" fill="#1f2a44">tail</text>
  <text x="330" y="24" font-size="11" fill="#1f2a44" text-anchor="end">nose</text>
  <text x="180" y="112" font-size="11" fill="#1d6fd1" text-anchor="middle">bent shape (exaggerated)</text>
</svg>
```
:::

::: context wrong-way-aircraft The airplane that dips before it climbs
Airplanes have a famous non-minimum-phase response. To climb, the pilot raises the elevator on the tail. That pushes the tail *down*, which first reduces the total lift a little, so the airplane's height sags for a moment. Only then does the nose come up, the wing's angle grow, and the airplane climb. Height after an elevator command starts off the wrong way, like this lesson's step response. Pilots do not notice it, but an autopilot designer controlling altitude directly has to respect it.
:::

::: context rate-gyro Sensing rotation
A rate gyro measures how fast the body it is bolted to is turning, in degrees or radians per second, about one or more axes. Launch vehicles use them in their inertial measurement units and often in separate rate-gyro packages for the flight-control loop. The gyro cannot tell whether its rotation came from the whole vehicle turning or from the body flexing under it; it reports the sum. That is why its location along a flexible rocket matters so much.
:::

::: context evans-history A method drawn by hand
Walter R. Evans, an American control engineer, published the root-locus method around 1948 to 1950. Before computers, designers sketched the locus by hand using a set of construction rules, and Evans even sold a plastic drafting tool, the Spirule, to help measure the angles. MATLAB now draws the whole locus in a fraction of a second, but the two rules in this lesson — start at the poles, end at the zeros or infinity — are still how engineers predict the picture before they plot it, and how they spot a plot that looks wrong.
:::

::: context locus-picture The antenna locus drawn
The two paths start at the open-loop poles, $0$ and $-2$ (crosses). They slide toward each other along the real axis, meet at $-1$ when $K = 1$, then split and run straight up and down the line $\operatorname{Re}(s) = -1$. The dots mark $K = 4$, at $-1 \pm 1.73j$, where $\zeta = 0.5$. Both axes use the same scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="270" y1="5" x2="270" y2="215" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="276" y="127" font-size="11" fill="#6c7a93">0</text>
  <text x="228" y="127" font-size="11" fill="#6c7a93">-1</text>
  <text x="170" y="127" font-size="11" fill="#6c7a93" text-anchor="middle">-2</text>
  <line x1="170" y1="110" x2="270" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="220" y1="110" x2="220" y2="8" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="220" y1="110" x2="220" y2="212" stroke="#1d6fd1" stroke-width="3"/>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="163" y1="103" x2="177" y2="117"/><line x1="163" y1="117" x2="177" y2="103"/>
    <line x1="263" y1="103" x2="277" y2="117"/><line x1="263" y1="117" x2="277" y2="103"/>
  </g>
  <circle cx="220" cy="23.4" r="5" fill="#b4232c"/>
  <circle cx="220" cy="196.6" r="5" fill="#b4232c"/>
  <text x="230" y="27" font-size="11" fill="#b4232c">K = 4</text>
  <text x="230" y="200" font-size="11" fill="#b4232c">K = 4</text>
  <text x="212" y="16" font-size="11" fill="#1d6fd1" text-anchor="end">to infinity</text>
  <text x="212" y="210" font-size="11" fill="#1d6fd1" text-anchor="end">to infinity</text>
</svg>
```
:::
