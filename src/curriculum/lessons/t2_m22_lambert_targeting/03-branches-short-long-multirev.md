---
id: l03-branches-short-long-multirev
title: "Branches, honestly: short way, long way, and multiple revolutions"
minutes: 21
covers:
  - multi-revolution solutions and their multiplicity
---

The previous lesson solved one Lambert problem and proved the answer correct. It is tempting to walk away thinking Lambert's problem has one answer, full stop — plug in $\mathbf{r}_1$, $\mathbf{r}_2$, $\Delta t$, and out comes *the* transfer. It does not. The same two points and the same time of flight support several genuinely different orbits, and the solver from the last lesson only found one of them because it was told, implicitly, which one to look for: the short way, zero revolutions. Change either of those choices and $F(z)=0$ has a different root, a different orbit, and — as this lesson shows with real numbers — a substantially different cost.

This lesson takes the same solver and the same benchmark transfer and asks it different questions. First: for the *same* two points and the *same* time of flight, what does going the short way cost against going the long way around? Then: what happens when the time of flight is generous enough that the spacecraft could complete one or more extra full revolutions before arriving — how many solutions are there, and is there a shortest possible flight time for each revolution count? Every number below comes from the same $F(z)=0$ of the last lesson; nothing new is added except which part of its domain you search.

## Short way versus long way

Fix $\mathbf{r}_1 = (5000,10\,000,2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,2500,7000)\,\mathrm{km}$, $\Delta t=3600\,\mathrm{s}$, exactly the previous lesson's transfer. The short way is $\Delta\nu = 100.293°$ and was already solved: $\mathbf{v}_1 = (-5.9925,1.9254,3.2456)\,\mathrm{km/s}$. The long way, for the same two points and the same sense of orbital motion, sweeps the other arc around the plane: $\Delta\nu' = 360°-100.293° = 259.707°$. Nothing about the solver changes — same $F(z)=0$, same $y(z)$ — except that $A$ now carries $\sin(259.707°)$, which is negative, so $A$ itself is negative.

::: example The same two points, the other way around
Solving $F(z)=0$ for $\Delta\nu'=259.707°$ (so $A=-12\,372.272\,\mathrm{km}$, from $A=\sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ with the new angle) and the same $\Delta t=3600\,\mathrm{s}$ gives $\mathbf{v}_1 = (0.8886,\,-6.6353,\,-3.1117)\,\mathrm{km/s}$, propagating forward to $\mathbf{r}_2$ to within $9.3\times10^{-12}\,\mathrm{km}$ — the same clean closure as the short-way case, confirming this is a genuine, correctly found second solution and not an artefact.

Compare cost using a circular reference orbit at $r_1$ and $r_2$, tangent to each transfer's own plane and direction of motion (the orbital plane is the same for both — it contains the origin, $\mathbf{r}_1$, and $\mathbf{r}_2$ regardless of which way you go around it — but the sense of circulation, and so the reference velocity direction, reverses between the two cases):
$$
\Delta v_{\text{short way}} = 3.351\,\mathrm{km/s}, \qquad \Delta v_{\text{long way}} = 11.538\,\mathrm{km/s} .
$$
For this one-hour transfer, the long way costs close to $3.4$ times as much.
:::

The size of that gap is specific to this example — a fast, aggressive one-hour transfer between orbits of quite different radius — but the direction of the effect is general and easy to see geometrically: the long-way transfer has to change the spacecraft's angular position by *more*, in the *same* amount of time, than the short way does. More angular distance in the same $\Delta t$ generally means a more energetic orbit, and a more energetic orbit generally means a larger $\mathbf{v}_1$ further from whatever reference velocity you are departing from. This is why the short way is the default choice whenever there is no reason to prefer otherwise, and why a mission designer only takes the long way on purpose — for a specific geometric reason, such as controlling the lighting condition at arrival, avoiding a particular pointing constraint, or because the mission architecture (a specific launch date, a specific arrival date) leaves no short way available at all.

::: warning "Short way" is about the transfer angle, not about time or distance travelled
A common slip is to assume the short way is always cheaper. It is the more direct route through *angle*, and it usually costs less, but Lambert's theorem from the first lesson already tells you cost is governed by $a$, $c$, and $s$ together, not by $\Delta\nu$ alone — the balance can tip the other way for slower transfers, or when a long-way transfer happens to sit closer to the minimum-energy ellipse from earlier in this module than the short way does for that particular $\Delta t$. Compute both before assuming.
:::

## Multiple revolutions: where the extra solutions live

Recall from the universal-variables lesson that $\chi = \sqrt{a}\,\Delta E$ on an ellipse, where $\Delta E$ is the total change in eccentric anomaly. Nothing in that relation caps $\Delta E$ at $2\pi$ — a transfer that winds around the focus once before reaching $\mathbf{r}_2$ has a correspondingly larger $\Delta E$, namely $2\pi + \Delta E_{\text{partial}}$ for some $0 < \Delta E_{\text{partial}} < 2\pi$, and correspondingly $\chi$ is bigger and $z=\alpha\chi^2 = (\Delta E)^2$ is bigger too. Because $\cos$ and $\sin$ are periodic, the *geometry* — $f$, $g$, and therefore $y$ — comes out identical whether you represent a given transfer angle as $\Delta E_{\text{partial}}$ or as $2\pi N + \Delta E_{\text{partial}}$ for any integer $N$; only the *time* changes, because time integrates $r$ over the whole path, extra loops included. The formulas from the previous lesson — $y(z)$, $F(z)$ — are literally unchanged; you let $z$ range higher, into the bracket

$$
(2\pi N)^2 \;<\; z \;<\; \big(2\pi(N+1)\big)^2
$$

for $N$ complete extra revolutions before arrival at $\mathbf{r}_2$.

Inside the $N=0$ bracket, $F(z)$ — equivalently $\Delta t(z)$ — is strictly increasing, as the previous lesson used to argue there is exactly one zero-revolution solution. Inside any $N\ge 1$ bracket, it is not. $\Delta t(z)$ comes down from an infinite value at the bracket's lower edge (an orbit that barely manages a whole extra revolution takes an enormous semi-major axis and hence an enormous period), reaches a genuine interior *minimum*, and then rises again to infinity at the bracket's upper edge (the same behaviour, mirrored). A minimum in the interior of an increasing-then-decreasing-then-increasing curve means that for any target $\Delta t$ above that minimum, there are exactly *two* values of $z$ that hit it — two distinct orbits, two distinct $\mathbf{v}_1$'s, for the identical $\mathbf{r}_1$, $\mathbf{r}_2$, $\Delta t$, and revolution count. Conventionally these are called the low-path and high-path branches (the low branch has the smaller $z$ and, for these two-body transfers, tends to run less eccentric than the high branch, though which one costs less in $\Delta v$ is a question you answer by computing, not by the label).

::: key Multi-revolution multiplicity
For each revolution count $N \ge 1$ there are generally two solutions — a low-path and a high-path branch — that merge into one at a minimum time of flight for that $N$; below that minimum, $N$ has no solution at all. Counting the single zero-revolution solution, up to $N$ revolutions gives $2N+1$ solutions in total.
:::

::: example Minimum flight time for one, two, and three extra revolutions
For the same $\mathbf{r}_1$, $\mathbf{r}_2$ and the short-way transfer angle ($\Delta\nu=100.293°$, $A=12\,372.272\,\mathrm{km}$), minimising $\Delta t(z)$ within each bracket gives:

| $N$ | $z^\ast$ | Minimum $\Delta t$ |
| --- | --- | --- |
| 1 | $70.803$ | $19\,665.76\,\mathrm{s}$ ($5.463\,\mathrm{h}$) |
| 2 | $219.438$ | $33\,546.89\,\mathrm{s}$ ($9.319\,\mathrm{h}$) |
| 3 | $447.114$ | $47\,275.71\,\mathrm{s}$ ($13.132\,\mathrm{h}$) |

A one-revolution transfer between these two points is impossible in under $5.463\,\mathrm{h}$, no matter how much energy you are willing to spend — not a limitation of the solver, but a fact about the geometry: an orbit cannot both pass through $\mathbf{r}_1$ and $\mathbf{r}_2$ on this transfer angle *and* complete a whole extra lap *and* do it arbitrarily fast, because completing a lap takes at least one full period, and the fastest (smallest-period) orbit consistent with the endpoints is bounded below by the same kind of geometric constraint that produced $a_{\min}$ two lessons ago.
:::

::: example The two branches, made concrete
Ask for a one-revolution transfer in $\Delta t = 25\,000\,\mathrm{s}$ (comfortably above the $19\,665.76\,\mathrm{s}$ minimum). Bracketing $F(z)=0$ on either side of $z^\ast=70.803$ finds both roots:

| Branch | $z$ | $\mathbf{v}_1$ (km/s) | $\lvert\mathbf{v}_1\rvert$ | Total $\Delta v$ |
| --- | --- | --- | --- | --- |
| low | $60.061$ | $(-5.508,\ 2.300,\ 3.203)$ | $6.773\,\mathrm{km/s}$ | $2.426\,\mathrm{km/s}$ |
| high | $85.539$ | $(-2.545,\ 4.900,\ 3.070)$ | $6.317\,\mathrm{km/s}$ | $6.681\,\mathrm{km/s}$ |

Both propagate back to $\mathbf{r}_2$ to within $2\times10^{-10}\,\mathrm{km}$, so both are genuine solutions of the same problem — same $\mathbf{r}_1$, same $\mathbf{r}_2$, same $\Delta t=25\,000\,\mathrm{s}$, same $N=1$ — yet the total $\Delta v$ (against the same circular-orbit reference used earlier in this lesson) differs by a factor of about $2.75$. A solver that returns "a" one-revolution answer without letting you choose the branch is choosing that factor on your behalf, silently.

For comparison, the zero-revolution transfer at this same $\Delta\nu$ costs $3.351\,\mathrm{km/s}$ for a much shorter, $3600\,\mathrm{s}$ flight; the one-revolution low branch, with almost seven times as long to work with, costs less still, $2.426\,\mathrm{km/s}$ — more time generally buys a cheaper transfer, which is the entire reason multi-revolution transfers are worth considering for a mission that is not in a hurry, particularly for electric-propulsion trajectories where a Lambert arc seeds a full low-thrust optimisation.
:::

## Reading the branches

The practical content of this lesson is that "solve Lambert's problem" is not a well-defined instruction on its own — it is shorthand for "solve Lambert's problem for revolution count $N$ and branch (short way / long way, and for $N\ge1$, low / high)," and a production targeting system either fixes those choices from mission requirements or searches over them deliberately. A porkchop-plot generator (the subject of a later lesson) typically only needs the zero-revolution, short-way and long-way solutions, since it is scanning departure and arrival *dates* and letting the transfer angle itself sweep past and around $180°$ as the dates change. A low-thrust trajectory search, by contrast, often wants every branch of every low revolution count, because a many-revolution, low-energy Lambert arc is a good initial guess for a spiral trajectory that a full low-thrust optimiser will subsequently refine — and initial guesses on the wrong branch send that optimiser looking in the wrong part of the solution space entirely.

::: warning The low-path/high-path split exists even at $N=0$ for a different reason
Do not confuse the two-branches-per-$N$ result here with the fact, from the minimum-energy discussion earlier in this module, that for a fixed *semi-major axis* above $a_{\min}$ there are also generally two ellipses through $\mathbf{r}_1,\mathbf{r}_2$ (one on each side of the minimum-energy point in $a$). That is a genuine feature of the geometry too, but it is not what gives $N\ge1$ two solutions for a fixed *time of flight*: within the $N=0$ bracket, $\Delta t(z)$ itself is monotonic, so a fixed $\Delta t$ still picks out one $z$ (and hence one $a$) uniquely, even though a fixed $a$ does not pick out one $z$ uniquely. It is the $N\ge1$ non-monotonicity in $\Delta t(z)$, not in $a(z)$, that produces the branch pair this lesson is about.
:::

## Check yourself

::: check
For the same $\mathbf{r}_1$ and $\mathbf{r}_2$, and the same $\Delta t$, do the short-way and long-way transfers lie in the same orbital plane? Justify your answer.
:::

::: answer
Yes. The orbital plane of any transfer between two fixed position vectors and a fixed focus is the plane containing the origin, $\mathbf{r}_1$, and $\mathbf{r}_2$ — there is only one such plane (as long as the three points are not collinear). Going the short way or the long way changes which arc of that plane the spacecraft traverses and which direction it circulates, but not the plane itself.
:::

::: check
Explain why a one-revolution Lambert transfer cannot exist for arbitrarily short times of flight, using the idea of a minimum period.
:::

::: answer
Completing one extra full revolution takes at least one full orbital period on top of the direct transfer arc, and among all ellipses through $\mathbf{r}_1$ and $\mathbf{r}_2$ there is a smallest possible semi-major axis (bounded below in spirit by the same kind of geometric constraint as $a_{\min}$), which bounds the period below by some positive number. No orbit connecting these two points can complete an extra lap faster than that bound allows, so any target time of flight below the resulting minimum has no one-revolution solution at all — the minimum found by minimising $\Delta t(z)$ over the $N=1$ bracket is exactly that bound.
:::

::: check
You are told a certain $\mathbf{r}_1$, $\mathbf{r}_2$, and $\Delta t$ admit a two-revolution transfer. How many total Lambert solutions exist for this geometry and time of flight, counting every revolution count from zero up to two and every branch, for one fixed transfer direction?
:::

::: answer
One zero-revolution solution, plus two branches (low and high) for $N=1$, plus two branches for $N=2$: $1+2+2=5$ solutions, matching the general count $2N+1$ for $N=2$. (This is for one fixed choice of short way/long way; the other direction of travel, if also considered, would double the count again.)
:::

::: check
In the worked example above, the low branch and high branch for $N=1$, $\Delta t=25\,000\,\mathrm{s}$ propagate back to $\mathbf{r}_2$ to residuals near $10^{-10}\,\mathrm{km}$. What would it mean if only the low branch closed this well and the high branch had a residual of, say, $50\,\mathrm{km}$?
:::

::: answer
It would mean the high-branch root was not actually converged — the bracketing search for $z$ on that side of $z^\ast$ either used too loose a tolerance or, more likely, used the wrong bracket (for instance searching on the low-branch side of $z^\ast$ by mistake, or stopping at a spurious near-root introduced by evaluating the Stumpff functions without their series expansions near a problematic $z$). A genuine high-branch solution, found correctly, closes the loop exactly as tightly as the low branch does, because both satisfy the identical $F(z)=0$ equation to the same numerical tolerance.
:::

::: check
Why does increasing $N$ (allowing more extra revolutions) tend to make the *minimum* achievable time of flight for that $N$ larger, as shown in the table of minimum flight times above?
:::

::: answer
Each additional revolution requires completing at least one more full orbital period beyond what the previous revolution count needed, on top of the same underlying transfer arc between $\mathbf{r}_1$ and $\mathbf{r}_2$. Since the fastest orbit consistent with the geometry has a period bounded below by some fixed positive number (independent of $N$), each extra required lap adds at least that much time to the achievable minimum, which is exactly the pattern in the table: $5.463\,\mathrm{h}$, $9.319\,\mathrm{h}$, $13.132\,\mathrm{h}$ for $N=1,2,3$, each roughly $3.86$–$3.81\,\mathrm{h}$ more than the last.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Short way / long way | $\Delta\nu<180°$ or $\Delta\nu=360°-\Delta\nu_{\text{short}}$; same plane, opposite sense; $A$ changes sign |
| $N$ | Complete extra revolutions before arrival; $z$ ranges over $\big((2\pi N)^2,(2\pi(N+1))^2\big)$ |
| $N=0$ | $\Delta t(z)$ monotonic; exactly one solution per direction |
| $N\ge1$ | $\Delta t(z)$ has an interior minimum; two solutions (low/high branch) above it, none below |
| $2N+1$ | Total solutions counting zero-rev plus every branch up to revolution count $N$, for one direction |
| Branch choice | Not automatic — a production solver must expose $N$ and branch, or it is choosing silently |

The next lesson pushes $\Delta\nu$ toward the one geometry every branch above assumed was well-behaved — $180°$ — and shows numerically how sharply that assumption breaks down.
