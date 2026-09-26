---
id: l03-verification-toolkit
title: "How you know the result is right: the verification toolkit"
minutes: 23
covers:
  - "stating how you know the result is right: analytic cases, conservation checks, convergence, cross-comparison"
---

How do you know your calculator works? You probably never thought about it, but you could check. Type $2 + 2$ and see $4$ — a case where you already know the answer. Add a column of numbers top to bottom, then bottom to top, and see the same total — a quantity that should not change. Work it out on paper too — an independent second path. Each check catches a different kind of broken calculator.

A simulation needs the same kind of checking, and it matters far more. "It ran, and the plot looked right" is the sentence that separates a hobby project from an engineering one. The last lesson named the section of the write-up — verification — where that sentence has to be replaced with something specific. This lesson supplies the replacement: four techniques that turn "I believe this is correct" into "here is what I checked, and here is the number it produced."

The four are an **analytic case**, a **conservation check**, a **convergence study** and a **cross-comparison**. None is enough alone, because each one is built to catch a different kind of bug, and a bug that slips past one is often caught by another. A strong verification section uses at least two.

Every number in this lesson was computed by actually running the check, not estimated. That is the same habit the write-up should follow: run it, read the real output, report exactly that. The examples use a spinning rigid body and a satellite in orbit — physics taught elsewhere in this course. This lesson does not re-derive it. It shows what you do with it once you have code that claims to get it right.

## Analytic cases: not all known answers are equally good tests

An **analytic case** is a special version of your problem that has a known, exact formula for the answer — a **closed-form** solution, one you can write down in a line instead of computing step by step. You run your general code on that special version and compare. That part is easy. The part worth real thought is that some known-answer cases catch bugs much better than others. The difference is whether the case actually uses the parts of the code most likely to be wrong.

### The spinning body

Think of a spinning book tossed in the air. How its spin changes is described by **[[Euler's equations|euler-equations]]** for a rigid body with no outside twisting force (no **torque**). Here $\omega_1, \omega_2, \omega_3$ (read "omega one, two, three") are how fast the body spins about its three **[[principal axes|principal-axes]]** — its three natural spin axes — in radians per second. $I_1, I_2, I_3$ are the body's **moments of inertia** about those axes: how hard it is to spin up about each one, in $\mathrm{kg\,m^2}$. The dot, as in $\dot\omega_1$ ("omega one dot"), means "rate of change."

$$
I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3, \qquad
I_2\dot\omega_2 = (I_3 - I_1)\,\omega_3\omega_1, \qquad
I_3\dot\omega_3 = (I_1 - I_2)\,\omega_1\omega_2.
$$

The right-hand sides are the **coupling terms**: they are how spin about one axis leaks into the others. They are also where a sign error most likely hides. Flip $(I_2 - I_3)$ to $(I_3 - I_2)$ by mistake and the code still runs.

### A weak test and a strong test

**A weak test.** Start the body spinning exactly about one axis, say $\boldsymbol\omega = (0, 0, n)$. Then every coupling term contains a zero: $\omega_2\omega_3 = 0$, $\omega_3\omega_1 = 0$, $\omega_1\omega_2 = 0$. So every rate of change is zero and the spin stays exactly constant forever. Any code that fails this has a real bug. But look what else it means: a sign error in a coupling term *also* gives zero, because zero times anything is zero, whatever sign sits in front. The test passes with the bug still there.

**A strong test.** Take an **axisymmetric** body — one shaped like a can or a spinning top, where two of the three moments are equal: $I_1 = I_2 = I_t$ ("I sub t," the transverse moment) and $I_3$ is different. Spin it at rate $n$ about the symmetry axis, with a small extra spin $\omega_t$ across it. Now the tip of the spin vector does something neat: seen from the body, $\omega_1$ and $\omega_2$ trace an exact circle.

$$
\omega_1(t) = \omega_t\cos(\lambda t), \qquad \omega_2(t) = \omega_t\sin(\lambda t), \qquad \lambda = \frac{n\,(I_3 - I_t)}{I_t}.
$$

Here $\lambda$ ("lambda") is how fast the spin vector goes around that circle, in rad/s — the body-frame **[[precession|precession]]** rate. This circle only happens if the coupling terms have the right signs and sizes, because they are what drive it. Get one sign wrong and the circle is gone.

::: note Why the circle has to be true
With $I_1 = I_2 = I_t$, the third equation reads $I_3\dot\omega_3 = (I_t - I_t)\omega_1\omega_2 = 0$, so $\omega_3$ stays at $n$. Put $\omega_3 = n$ into the first two and divide by $I_t$:

$$
\dot\omega_1 = \frac{(I_t - I_3)\,n}{I_t}\,\omega_2 = -\lambda\,\omega_2, \qquad
\dot\omega_2 = \frac{(I_3 - I_t)\,n}{I_t}\,\omega_1 = \lambda\,\omega_1.
$$

Now test the proposed answer. If $\omega_1 = \omega_t\cos(\lambda t)$, its rate of change is $-\lambda\omega_t\sin(\lambda t) = -\lambda\omega_2$. If $\omega_2 = \omega_t\sin(\lambda t)$, its rate of change is $\lambda\omega_t\cos(\lambda t) = \lambda\omega_1$. Both equations hold. Now flip the sign of one coupling term, say to $\dot\omega_1 = +\lambda\omega_2$. The pair then describes growth, not a circle: the transverse spin runs away exponentially. So the test cannot pass with that bug.
:::

::: example An axisymmetric analytic case against a from-scratch RK4
The body: $I_t = 0.024\,\mathrm{kg\,m^2}$, $I_3 = 0.036\,\mathrm{kg\,m^2}$, spin $n = 0.15\,\mathrm{rad/s}$ about the symmetry axis, transverse spin $\omega_t = 0.10\,\mathrm{rad/s}$.

**Step 1: the predicted rate.**

$$
\lambda = \frac{n\,(I_3 - I_t)}{I_t} = \frac{0.15 \times (0.036 - 0.024)}{0.024} = \frac{0.15 \times 0.012}{0.024} = 0.075\,\mathrm{rad/s}.
$$

**Step 2: run the code.** Integrate Euler's equations from $\boldsymbol\omega = (0.10,\ 0,\ 0.15)\,\mathrm{rad/s}$ with a hand-written RK4 integrator at a $0.0125\,\mathrm{s}$ step for $60\,\mathrm{s}$. That is $60 / 0.0125 = 4800$ steps.

**Step 3: compare.** At every step, compare $\omega_1$ and $\omega_2$ with $\omega_t\cos(\lambda t)$ and $\omega_t\sin(\lambda t)$. The largest difference over the whole run is about $3\times10^{-15}\,\mathrm{rad/s}$.

**Sanity check.** The signal is about $0.1\,\mathrm{rad/s}$, so the error is about $3\times10^{-14}$ of it — agreement to roughly thirteen or fourteen digits, close to the limit of the computer's arithmetic. And it cannot be luck: a wrong coupling sign would destroy the circle outright, not leave a tiny leftover. In 60 s the spin vector sweeps $0.075 \times 60 = 4.5\,\mathrm{rad}$, about $258^\circ$ — most of a lap — so the test really exercised the motion.
:::

::: key Choosing an analytic case
A good analytic case exercises the terms most likely to hold a bug. A case where those terms happen to vanish (like spin about a single principal axis with no torque) still catches gross errors but misses a sign error in the coupling. A case that needs those terms to have the right sign and size — like the axisymmetric precession rate $\lambda = n(I_3 - I_t)/I_t$ — is the stronger check.
:::

## Conservation checks: a number the physics promises to keep

Often there is no exact formula for the whole motion. But there may still be a quantity the equations promise will never change — like the total in a piggy bank that nobody opens. If your code shows it changing, something is wrong.

Two examples from this course:

- A rigid body spinning with no torque keeps its **rotational kinetic energy** (its energy of spinning) and the size of its **angular momentum** (how much "spin" it carries) constant.
- A satellite under two-body gravity keeps its **specific orbital energy** constant — "specific" means per kilogram. With $v$ the speed, $r$ the distance from Earth's center, $a$ the orbit's semi-major axis (half its longest width) and $\mu$ ("mew," Earth's **[[gravitational parameter|mu]]**):

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}.
$$

Read $\varepsilon$ as "epsilon." The first term is energy of motion, the second is gravity's (negative) energy of height.

The big advantage: a conservation check works on the case you actually care about, not only a special one. You do not need a symmetric body or a perfect orbit. The quantity is conserved along *every* path the equations produce, whatever the orbit's shape or the body's inertia.

Lesson 1's two-body example was exactly this. A $7000\,\mathrm{km}$, $e = 0.01$ orbit (a nearly round one; $e$ is the eccentricity) was propagated for twenty periods by a hand-written RK4 at a $1\,\mathrm{s}$ step. Its starting energy is

$$
\varepsilon = -\frac{\mu}{2a} = -\frac{398\,600.4418\,\mathrm{km^3/s^2}}{2 \times 7000\,\mathrm{km}} \approx -28.4715\,\mathrm{km^2/s^2},
$$

and over the whole run it never drifted more than $3.9\times10^{-14}$ of that, in relative terms.

A check like this is cheap. It costs nothing beyond the run you were already doing. And it is sensitive to the most dangerous kind of numerical bug: a small, steady error that would otherwise look like reasonable, physical drift.

::: warning Conserved is not the same as correct
A conservation check tells you the equations were solved consistently with themselves. It does not tell you they are the right equations. A two-body propagator with the wrong value of $\mu$ typed in will still conserve energy perfectly — only the wrong amount of it. So pair a conservation check with an analytic case wherever you can. The analytic case checks the number is right; the conservation check watches it stay right over a long run.
:::

## Convergence studies: does the error shrink the way it should?

Imagine drawing a circle by walking in straight steps. With big steps you get a clumsy polygon. With smaller steps it gets closer to a real circle. A simulation works the same way: it moves forward in small time steps of size $h$, and smaller steps mean smaller error.

The useful part is that each method promises *how fast* the error shrinks. A method of **[[order|order]]** $p$ has an error roughly proportional to $h^p$. So if you halve the step, the error should shrink by about

$$
2^p.
$$

RK4 is fourth order, $p = 4$, so halving $h$ should cut the error by about $2^4 = 16$. This keeps going until the error gets so small that the computer's own [[rounding|roundoff]] takes over. Below that floor, smaller steps stop helping.

A **convergence study** runs the same problem at several step sizes and checks that the error really behaves this way. It is one of the few checks that catches code which gives a *plausible* answer but at the *wrong order* — say, an RK4 with a typo that quietly makes it behave like a first-order method. At any single step size the output can look perfectly reasonable. Only the pattern across step sizes gives it away.

::: example A convergence study on a tumbling body
Take a lopsided body with three different moments, $I = \mathrm{diag}(0.020,\ 0.028,\ 0.036)\,\mathrm{kg\,m^2}$ ("diag" means those three numbers down the diagonal, one per axis), starting at $\boldsymbol\omega = (0.20,\ 0.15,\ 0.10)\,\mathrm{rad/s}$. There is no simple formula for this motion, so measure the error through the kinetic energy, which must stay constant: track its largest relative drift over $60\,\mathrm{s}$.

Run it at five step sizes, halving each time, and divide each error by the next one:

| Step $h$ | Largest energy drift | Ratio to next |
| --- | --- | --- |
| $0.2\,\mathrm{s}$ | $2.51\times10^{-10}$ | $15.5$ |
| $0.1\,\mathrm{s}$ | $1.62\times10^{-11}$ | $15.7$ |
| $0.05\,\mathrm{s}$ | $1.03\times10^{-12}$ | $16.8$ |
| $0.025\,\mathrm{s}$ | $6.14\times10^{-14}$ | $6.3$ |
| $0.0125\,\mathrm{s}$ | $9.69\times10^{-15}$ | — |

**Reading it.** The first three ratios sit close to the promised $16$. That is RK4 behaving like a fourth-order method. The last ratio drops to about $6$. Is that a bug? Look at the size of the error: by then it is around $10^{-14}$, right where double-precision rounding lives. The method's own error has fallen below the computer's arithmetic noise, so halving the step cannot shrink it further.

That flattening is what a correctly written fourth-order method *should* do once it hits the floor. Reading a convergence study honestly means expecting it, not demanding a factor of $16$ forever.
:::

The method matters as much as the step size. Take the same $7000\,\mathrm{km}$ orbit for two periods at a fixed $1\,\mathrm{s}$ step with **[[forward Euler|forward-euler]]**, a first-order method that takes one straight-line step at a time. The largest relative energy drift is $2.57\times10^{-2}$ — more than two percent. RK4 at the identical step holds the same run to $9.1\times10^{-15}$. Dividing, $2.57\times10^{-2} / 9.1\times10^{-15} \approx 2.8\times10^{12}$: about twelve powers of ten tighter.

Both methods "ran." Both drew something that, at a glance, looks like an orbit. Only the numbers show that one of them is not fit for the job.

::: note Why halving the step divides the error by 2 to the p
Say the error is about $E \approx C h^p$, where $C$ is some constant that depends on the problem. Halve the step:

$$
E_{\text{new}} \approx C\left(\frac{h}{2}\right)^p = \frac{C h^p}{2^p} = \frac{E}{2^p}.
$$

So the ratio $E / E_{\text{new}}$ is $2^p$: $2$ for a first-order method, $16$ for fourth order. That is also how you *measure* the order from data: $p \approx \log_2(\text{ratio})$. In the table, $\log_2 15.7 \approx 3.97$ — fourth order, as promised.
:::

::: key Convergence
A method of order $p$ should cut its error by about $2^p$ each time the step is halved, until floating-point roundoff sets a floor. RK4 ($p = 4$) showed ratios near $16$ for three halvings here, then flattened at about $10^{-14}$. A flattening ratio is only healthy if the error has already reached that roundoff floor.
:::

## Cross-comparison: an independent second path

The last technique is to get the same answer a completely different way and see if they agree. Two people doing the same sum with different methods rarely make the *same* mistake.

::: example Your RK4 against a different solver
Run the tumbling body above with SciPy's `solve_ivp`, using `method='DOP853'` — a **[[different algorithm|dop853]]** entirely, which picks its own step sizes, set here to a tight tolerance (`rtol=1e-13`, `atol=1e-15`). Compare its state at $t = 60\,\mathrm{s}$ with the hand-written RK4 at its smallest step, $0.0125\,\mathrm{s}$.

The RK4 ends at $\boldsymbol\omega \approx (0.1483,\ -0.2196,\ -0.0018)\,\mathrm{rad/s}$. The largest difference between the two, across all three components, is about $1.2\times10^{-15}\,\mathrm{rad/s}$.

**Sanity check.** The components are up to about $0.2\,\mathrm{rad/s}$, so the two agree to roughly fourteen digits. Two separately built methods, on different algorithms, agreeing that closely is strong evidence that neither has a coding error big enough to matter. The two do not share bugs: an error in one would show up as a *disagreement*, not as the same wrong answer twice.
:::

The SciPy comparison is the cleanest kind of cross-comparison, but the idea is broader than "run someone else's solver." A worked example with numbers from a textbook, a second version you write using a different description of the same physics (position-and-velocity versus orbital elements, for instance), or a colleague's code all do the same job: an independent path to the answer that does not share your mistakes.

The value grows with how independent the second path really is. Two programs that both call the same library function are not a check on that function. A hand-derived formula and a library solver are far more independent, because a mistake in the algebra and a mistake in the library's algorithm are very unlikely to agree by coincidence.

::: key How you show a simulation is correct
Reproduce a closed-form analytic case to a stated tolerance; check a conserved quantity such as energy or angular momentum in a force-free case; show convergence as the step size shrinks; and cross-compare against published data or another implementation. Two independent methods agreeing to many digits is evidence neither has a coding defect that matters, because an error in one would show up as disagreement rather than as a shared wrong answer.
:::

## Check yourself

::: check
Explain why torque-free spin started exactly about one principal axis is a weaker analytic case than the axisymmetric precession case, even though both have an exact answer.
:::

::: answer
Starting about one principal axis makes every coupling term in Euler's equations zero, because each is a product containing a zero component — $\omega_2\omega_3 = 0$ whatever sign stands in front. So a sign error in a coupling term still passes.

The axisymmetric case needs those same coupling terms to have the right sign and size to produce the predicted rate $\lambda = n(I_3 - I_t)/I_t$. A sign error there changes the motion completely (the circle turns into runaway growth), so the check fails. A strong analytic case is one where the terms most likely to hold a bug are actually *used* by the chosen starting condition, not merely present in the equations.
:::

::: check
A student says that because their two-body propagator conserves specific orbital energy to $10^{-13}$ over many orbits, it must be using the correct value of $\mu$. Is that sound?
:::

::: answer
No. Energy conservation shows the equations are being solved consistently with themselves. It would hold equally well with a *wrong* $\mu$ used consistently everywhere, because $\varepsilon = -\mu/2a$ would still stay constant along the (now wrong) path.

Conservation catches a mismatch between how a quantity is computed and how the path evolves. It does not catch a wrong constant applied everywhere. To catch that, use an analytic case with a known number — for instance, compare the propagated orbit's period with $T = 2\pi\sqrt{a^3/\mu}$ using the correct $\mu$ — or cross-compare with an independent source that used the right value.
:::

::: check
A convergence study of a claimed fourth-order integrator shows error ratios of $15.6$, $15.9$, $16.1$, then $2.1$ as the step is halved four times. Is the drop at the end evidence of a bug?
:::

::: answer
Not necessarily — it depends on how big the error is at that point.

If the error has already fallen to around double-precision roundoff (roughly $10^{-15}$ to $10^{-14}$ in relative terms), a flattening ratio is the expected sign of hitting that floor. This lesson's own tumbling-body study dropped from about $16$ to about $6$ once the error reached about $10^{-14}$.

But a ratio of $2.1$ is suspiciously close to $2$, the ratio of a *first-order* method. If it happens while the error is still well above roundoff, the code is probably not achieving fourth order, and it is worth investigating rather than dismissing. The error level where the flattening happens is what separates a healthy study from a suspicious one.
:::

::: check
Why is comparing your hand-written RK4 with `scipy.integrate.solve_ivp` a stronger cross-comparison than comparing it with a second copy of your own RK4 code run at the same step?
:::

::: answer
A second copy of the same code, run the same way, repeats any bug exactly, because it has the identical algorithm and the identical mistake. Their agreement proves only that you copied the file correctly.

`solve_ivp` with a high-order adaptive method like DOP853 is a different algorithm, built and tested separately from your code, so a mistake in your RK4 has no reason to appear there too. Agreement between truly independent implementations is evidence against a shared error. Agreement between two copies of one implementation is not independent evidence of anything.
:::

::: check
Rank each as weak, moderate or strong verification evidence for a rigid-body simulation, and say why: (a) "the animation looked physically plausible"; (b) rotational kinetic energy conserved to $10^{-12}$ over a long run, using an inertia matrix that was typed in and never checked; (c) the axisymmetric precession matched the closed-form $\lambda$ to about $3\times10^{-15}\,\mathrm{rad/s}$.
:::

::: answer
(a) **Weak.** Looking plausible fits many hidden bugs, including sign errors a human eye watching an animation would never notice.

(b) **Moderate.** It is real, numerical evidence that the equations are integrated consistently. But as the earlier question showed, conservation alone cannot catch a wrong constant used consistently — here, an unchecked inertia matrix. It needs pairing with an independent check on the inertia values.

(c) **Strong.** It is a match to many digits against a case chosen *because* it depends on the coupling terms having the right sign and size — exactly where rigid-body code most often goes wrong.
:::

## Summary

| Technique | What it catches | Example from this lesson |
| --- | --- | --- |
| Analytic case | Wrong equations or wrong-signed terms, if the case uses them | Axisymmetric precession, $\lambda = n(I_3 - I_t)/I_t = 0.075\,\mathrm{rad/s}$, matched to about $3\times10^{-15}$ |
| Conservation check | Mismatch between a conserved quantity and the path; not a wrong constant | Two-body energy $\varepsilon = -\mu/2a$ held to $3.9\times10^{-14}$ over 20 orbits |
| Convergence study | Wrong method order; error should fall by $2^p$ per halving | RK4 ratios near 16, then a floor near $10^{-14}$; Euler $2.6\times10^{-2}$ vs RK4 $9.1\times10^{-15}$ at the same step |
| Cross-comparison | Any defect not shared by an independent second path | Hand-written RK4 vs `solve_ivp`/DOP853: agreement to about $10^{-15}$ |

Testing whether an estimator's reported uncertainty is honest — the same "prove it, don't only report it" idea applied to a filter — gets its own treatment later in this module, with the quaternion filter project. The next lesson starts the anchor projects themselves, with the first one: the 6-DOF launch vehicle simulation.

::: context euler-equations Euler, said "OY-ler"
Leonhard Euler was a Swiss mathematician of the 1700s, and one of the most productive who ever lived. So many results carry his name that engineers have to say *which* Euler equations they mean. These ones describe how a spinning rigid body's spin changes. Later in this lesson, "forward Euler" is a different idea of his: a simple way to step equations forward in time. Same man, two very different tools.
:::

::: context principal-axes Three natural spin axes
Every rigid body has three special, perpendicular axes it can spin about smoothly without wobbling. These are its **principal axes**. For a book, they run through its center: one along its length, one across its width, one straight through its cover.

Try tossing a book (with a rubber band around it) while spinning it about each axis. About the longest and the shortest axes it spins cleanly. About the middle axis it flips over as it spins, however carefully you throw. This is called the intermediate-axis or tennis-racket effect, and Euler's equations predict it.
:::

::: context precession The spin vector going round
**Precession** is when the axis of a spinning thing slowly swings around in a circle, like a wobbling spinning top. In the axisymmetric test, seen from the body, the spin vector's tip goes round a circle of radius $\omega_t$ at rate $\lambda$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="195" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="30" x2="110" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <text x="198" y="114" font-size="12" fill="#1f2a44">ω₁</text>
  <text x="115" y="28" font-size="12" fill="#1f2a44">ω₂</text>
  <circle cx="110" cy="110" r="70" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
  <path d="M180,110 A70,70 0 1,0 95.2,178.4" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="95.2,178.4 84.4,181.2 86.4,171.4" fill="#1d6fd1"/>
  <circle cx="180" cy="110" r="4" fill="#1f2a44"/>
  <text x="150" y="130" font-size="11" fill="#1f2a44">start</text>
  <g font-size="12" fill="#1f2a44">
    <text x="215" y="80">λ = 0.075 rad/s</text>
    <text x="215" y="102">one lap ≈ 83.8 s</text>
    <text x="215" y="124" fill="#1d6fd1">60 s run ≈ 258°</text>
  </g>
</svg>
```

One full lap takes $2\pi / 0.075 \approx 83.8\,\mathrm{s}$, so the 60 s run covers about $258^\circ$ of it.
:::

::: context mu Mu, Earth's gravity number
The Greek letter $\mu$, said "mew," is Earth's **gravitational parameter**: the gravitational constant times Earth's mass. Engineers use the product because it is known far more precisely than either piece alone. For Earth, $\mu \approx 398\,600\,\mathrm{km^3/s^2}$, or $3.986\times10^{14}\,\mathrm{m^3/s^2}$. Every orbit calculation leans on it, which is why a mistyped $\mu$ is such a sneaky bug: everything still looks self-consistent.
:::

::: context order A convergence plot, drawn to scale
Engineers plot a convergence study with both axes on a log scale, where each grid step is a factor of ten. Then a method of order $p$ shows up as a straight line whose steepness is set by $p$. Here are this lesson's five RK4 runs, with the dashed line showing an exact factor of $16$ per halving.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="140" width="290" height="30" fill="#f2b880" opacity="0.35"/>
  <line x1="60" y1="175" x2="350" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="15" x2="60" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="24">10⁻⁹</text><text x="55" y="74">10⁻¹¹</text><text x="55" y="124">10⁻¹³</text><text x="55" y="174">10⁻¹⁵</text>
  </g>
  <line x1="90" y1="35" x2="330" y2="155.4" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline points="90,35.0 150,64.8 210,94.7 270,125.3 330,145.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="90" cy="35.0" r="4"/><circle cx="150" cy="64.8" r="4"/><circle cx="210" cy="94.7" r="4"/><circle cx="270" cy="125.3" r="4"/><circle cx="330" cy="145.3" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="190">0.2</text><text x="150" y="190">0.1</text><text x="210" y="190">0.05</text><text x="270" y="190">0.025</text><text x="330" y="190">0.0125</text>
  </g>
  <text x="205" y="205" font-size="11" fill="#1f2a44" text-anchor="middle">step size h (s), halving each time</text>
  <text x="200" y="30" font-size="11" fill="#6c7a93">dashed: exactly ÷16 per halving</text>
  <text x="120" y="160" font-size="11" fill="#1f2a44">roundoff floor</text>
</svg>
```

The dots follow the dashed line for three halvings, then bend flat at the last one as they reach the floor.
:::

::: context roundoff Why computers have a floor
Computers store most numbers in **double precision**: about 16 significant digits, no more. Every calculation is rounded to fit. The smallest relative gap between two stored numbers near $1$ is about $2.2\times10^{-16}$, called **machine epsilon**.

Each step of a simulation adds a speck of rounding error, and thousands of steps add up. That is why the errors in this lesson bottom out around $10^{-15}$ to $10^{-14}$ instead of reaching zero. Past that point, smaller steps only mean more steps, and more steps mean more specks.
:::

::: context forward-euler What forward Euler gets wrong
**Forward Euler** takes each step in a straight line along the current direction of motion. On a curved orbit, a straight step always lands a little outside the curve. So each step adds a bit of energy, and the path spirals outward instead of closing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="110" r="70" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="150" cy="110" r="5" fill="#1f2a44"/>
  <polyline points="220.0,110.0 218.6,95.4 214.3,81.4 207.1,68.6 197.4,57.4 185.8,48.5 172.5,42.1 158.3,38.4 143.7,37.7 129.3,39.7 115.6,44.5 103.1,51.7 92.3,61.0 83.4,72.1 76.8,84.5 72.5,97.8 70.6,111.4 71.1,125.1 73.8,138.4 78.8,150.9 85.6,162.4 94.2,172.5 104.3,181.0 115.5,187.8 127.6,192.7 140.2,195.6 153.2,196.5 166.0,195.4 178.6,192.3 190.5,187.4 201.5,180.6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="220" cy="110" r="4" fill="#1f2a44"/>
  <circle cx="201.5" cy="180.6" r="4" fill="#b4232c"/>
  <text x="250" y="60" font-size="12" fill="#1d6fd1">true orbit</text>
  <text x="250" y="170" font-size="12" fill="#b4232c">forward Euler,</text>
  <text x="250" y="186" font-size="12" fill="#b4232c">one lap</text>
  <text x="228" y="114" font-size="11" fill="#1f2a44">start</text>
</svg>
```

This lap used 300 steps. By the end the path has not come back to its start, and the energy has risen by about 18%. RK4, with four slope checks per step, bends each step to follow the curve.
:::

::: context dop853 What the name DOP853 means
DOP853 is a Runge–Kutta method developed by the mathematicians Dormand and Prince (hence "DOP"). The "8" is its order: eighth order, so halving its step would cut the error by about $2^8 = 256$. The "5" and "3" refer to lower-order estimates it computes alongside, which it uses to judge its own error and choose each step's size automatically. That self-adjusting step is why it is called **adaptive**, and it is a big reason it shares no bugs with a fixed-step RK4 you wrote yourself.
:::
