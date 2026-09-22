---
id: l05-ballistic-coefficient-and-trajectory-shape
title: Ballistic coefficient and the shape of the trajectory
minutes: 14
covers:
  - ballistic coefficient and its effect on the trajectory
---

Lessons 2 through 4 kept returning to the same fact from different angles: peak deceleration ignores $\beta$ entirely, while peak heating and total heat load both scale as $\sqrt\beta$. That leaves an obvious gap. If $\beta$ barely touches the number every structural margin is built from, what is it actually *for* — why does a mission ever choose one ballistic coefficient over another? This lesson answers that by holding entry speed and angle fixed and sweeping $\beta$ alone through the same numerically integrated model lesson 3 validated, tracking everything the peak-load formulas do not: how deep the vehicle penetrates, how long the entry takes, how far downrange it travels, and how fast it is still moving when it reaches the ground.

## Downrange and duration

Two quantities not yet defined in this module are worth pinning down. **Downrange distance** is the horizontal path length travelled during entry, the integral of the horizontal speed component:

$$
s_{\mathrm{downrange}} = \int_0^{t_f} v\cos\gamma\, dt,
$$

evaluated along the numerically integrated trajectory from lesson 3 (the closed-form Allen-Eggers solution does not reduce this integral to anything as clean as the heat-load result of lesson 4 — the $1/v$ weighting here has no matching power of $\rho$ to make the substitution tidy, so this module answers it numerically rather than forcing an ugly closed form). **Entry duration** $t_f$ is simply the time from the $120\ \mathrm{km}$ interface to ground level, $h=0$, read directly off the same integration.

## The sweep

Fix $v_E = 7800\ \mathrm{m/s}$, $\gamma_E = -6.5^\circ$ — a representative shallow, LEO-return-class entry angle — and sweep $\beta$ from $50$ to $1600\ \mathrm{kg/m^2}$, a $32$-fold range spanning a light capsule to a dense, slender reentry body:

| $\beta$ ($\mathrm{kg/m^2}$) | peak $a$ ($g_0$) | $h^*$ (km) | peak $\dot q$ ($\mathrm{W/cm^2}$) | duration (s) | downrange (km) | impact speed (m/s) |
| --- | --- | --- | --- | --- | --- | --- |
| $50$ | $19.39$ | $52.06$ | $119.2$ | $591.9$ | $683.4$ | $28.4$ |
| $100$ | $19.42$ | $47.07$ | $168.9$ | $448.6$ | $727.1$ | $40.2$ |
| $200$ | $19.45$ | $42.08$ | $239.4$ | $349.4$ | $770.8$ | $57.2$ |
| $400$ | $19.47$ | $37.09$ | $339.4$ | $281.5$ | $814.5$ | $82.0$ |
| $800$ | $19.50$ | $32.10$ | $481.0$ | $236.1$ | $858.2$ | $119.4$ |
| $1600$ | $19.52$ | $27.11$ | $681.8$ | $206.9$ | $901.6$ | $177.3$ |

Four trends sit in this table, and all four are exactly what lessons 2 through 4 predict once you know where to look.

**Peak deceleration is nearly flat** — $19.39$ to $19.52\,g_0$ across a $32$-fold range in $\beta$, varying by under a percent. This is lesson 2's $\beta$-independence, confirmed numerically rather than in closed form; the small residual drift (not exactly zero) is the same curvature error lesson 3 identified, which depends weakly on $\beta$ through the trajectory's exact shape, but the dominant, $\beta$-independent physics is unmistakable in this column.

**Peak altitude falls steadily**, and by a specific, checkable amount: from $\beta=50$ to $\beta=1600$, $h^*$ drops by $52.06 - 27.11 = 24.95\ \mathrm{km}$, and the closed-form prediction from lesson 2 is $H\ln(1600/50) = 7200\ln 32 = 24.95\ \mathrm{km}$ — matching to four significant figures, even though the *absolute* altitudes here differ from the closed form by several percent (lesson 3's curvature error, evaluated at this shallow angle). The systematic error in $h^*$ depends mainly on $\gamma_E$, not on $\beta$, so it very nearly cancels when comparing two $\beta$ values at the *same* angle, leaving the *spacing* between them close to the pure Allen-Eggers prediction even where the individual altitudes are not.

**Duration shrinks as $\beta$ rises** — nearly a factor of three from the lightest to the heaviest vehicle in the table. This can look backwards at first: surely a vehicle that resists deceleration (high $\beta$) should take *longer* to come down? It does not, because "longer" here means longer spent losing speed to drag at high altitude, in thin air, where very little is happening. A high-$\beta$ vehicle blows through that slow, thin-air phase largely unaffected and reaches its (much shorter, much more violent) deceleration pulse deep in the atmosphere sooner in absolute time, even though it is still moving fast when it gets there.

**Downrange distance grows with $\beta$**, by roughly a third across the table, and **impact speed grows sharply with $\beta$** — from under $30\ \mathrm{m/s}$ to nearly $180\ \mathrm{m/s}$ by the time the trajectory reaches $h=0$ in this idealised, infinite-exponential-atmosphere model. Both trends say the same thing in two different units: a high-$\beta$ vehicle is, by definition, hard to slow down, so it keeps more of its horizontal speed (covering more ground) and more of its total speed (arriving faster) than a low-$\beta$ vehicle given the identical entry state.

::: key What $\beta$ actually controls
Holding entry speed and angle fixed, raising $\beta$: leaves peak deceleration essentially unchanged; pushes the peak (of both deceleration and heating) deeper into the atmosphere, by $H\ln(\beta_2/\beta_1)$; shortens total entry duration; lengthens downrange distance; and raises the speed still remaining when the trajectory reaches low altitude. None of this shows up in the peak-$g$ number alone — it is why $\beta$ is chosen deliberately rather than minimised or maximised on reflex.
:::

::: example Two real vehicle classes, same entry state
A crewed capsule with a $4\ \mathrm{m}$ heat shield, mass near $9.5\ \mathrm{t}$, has $\beta \approx 540\ \mathrm{kg/m^2}$ (t1_m18's own worked figure for this class of vehicle). A dense, slender reentry test body of similar mass but a fraction of the frontal area might carry $\beta \approx 4000$–$8000\ \mathrm{kg/m^2}$; an unshielded iron meteoroid, tiny and extremely dense for its size, can reach $\beta$ in the tens of thousands. Given the *same* entry state, the capsule decelerates high, gently (relatively speaking), over hundreds of kilometres of downrange travel and several minutes — exactly the profile a parachute or landing system needs time to work with. The dense body plunges through with barely any deceleration until very low altitude, arriving at the ground (or detonation altitude, for the original ICBM application this analysis was built for) at high speed after a short, violent pulse deep in the atmosphere. Both vehicles can see comparable peak $g$; nothing else about their entries looks alike.
:::

::: example Sizing a landing footprint from downrange sensitivity
An entry team plots downrange distance against $\beta$ for its vehicle, from the table above, and fits a local slope near $\beta = 200\ \mathrm{kg/m^2}$: downrange rises by about $770.8 - 727.1 = 43.7\ \mathrm{km}$ as $\beta$ goes from $100$ to $200$. If manufacturing tolerances on mass and drag area give this vehicle a $\pm5\ \mathrm{percent}$ uncertainty in $\beta$ (so $\beta = 200 \pm 10\ \mathrm{kg/m^2}$), the corresponding downrange uncertainty is of order $\pm5\ \mathrm{percent}$ of that local slope times $10/100$, a few kilometres — small next to the $770\ \mathrm{km}$ total, but not small next to a landing ellipse a guided vehicle is trying to hit within a few kilometres of the aim point. A ballistic vehicle with no active guidance has to accept this dispersion; the guided vehicles of lessons 8 and 10 exist largely to correct for it in real time.
:::

## Check yourself

::: check
Explain why a high-$\beta$ vehicle reaches the ground *sooner* in total elapsed time than a low-$\beta$ vehicle, even though it penetrates deeper into denser air before decelerating.
:::

::: answer
Most of a ballistic entry's duration is spent in the thin, high-altitude part of the atmosphere where drag is weak and very little deceleration happens, regardless of $\beta$. A high-$\beta$ vehicle passes through that slow phase essentially unaffected — it is "hard to slow down" by definition — and only decelerates sharply once it reaches denser air, deep in the atmosphere, which it reaches sooner in absolute time precisely because it was not slowed earlier. The low-$\beta$ vehicle, by contrast, starts decelerating (and therefore slowing its own descent rate) much higher up, stretching the whole event out.
:::

::: check
Two vehicles share an entry state; one has $\beta$ four times the other. Using the result from lesson 2, by how many kilometres do their peak-deceleration altitudes differ, in terms of $H$?
:::

::: answer
$h^*_1 - h^*_2 = H\ln(\beta_2/\beta_1) = H\ln 4 = 7200 \times 1.3863 = 9982\ \mathrm{m} \approx 10.0\ \mathrm{km}$, with the higher-$\beta$ vehicle's peak lower in the atmosphere by that amount, regardless of the entry angle or speed shared by both.
:::

::: check
The table shows peak deceleration varying by under a percent across a $32$-fold range in $\beta$, but not *exactly* zero variation as the pure closed-form result would predict. What is the source of that small residual variation?
:::

::: answer
The table comes from the numerically integrated (truth) trajectory of lesson 3, not the pure Allen-Eggers closed form, and lesson 3 established that the closed form's error at a fixed entry angle comes mostly from the frozen-flight-path-angle assumption. That error depends on how the trajectory's shape and duration play out, which does shift slightly with $\beta$ even at fixed $\gamma_E$ — so the true $\beta$-independence of the idealised closed form survives in the numerical truth model only approximately, as a dominant effect with a small, physically explicable residual on top.
:::

::: check
Why does peak-altitude *spacing* between two ballistic coefficients match the closed-form prediction $H\ln(\beta_2/\beta_1)$ so closely in the numerical results, even though the individual peak altitudes differ from the closed form by several percent?
:::

::: answer
The systematic error between the closed form and the numerical truth model at a fixed entry angle comes primarily from $\gamma_E$, not from $\beta$ — lesson 3's ablation showed the curvature error is a function of how shallow the entry is, largely independent of the vehicle. Comparing two different $\beta$ values at the *same* $\gamma_E$ therefore applies almost the same systematic offset to both, and that common offset cancels out of the *difference* between the two altitudes, leaving the spacing close to the pure closed-form value even where each individual altitude is not.
:::

::: check
A mission needs to minimise downrange dispersion from manufacturing uncertainty in $\beta$ for an unguided ballistic vehicle. Based on the trends in this lesson, would choosing a higher or lower nominal $\beta$ reduce the *sensitivity* of downrange to a given percentage uncertainty in $\beta$, and how would you check?
:::

::: answer
This lesson does not answer that directly — it would require computing the local slope $d(\text{downrange})/d\beta$ at several candidate nominal $\beta$ values and comparing them, exactly as the second worked example does at one point on the curve. The table's spacing is a hint: downrange gained per doubling of $\beta$ shrinks somewhat at higher $\beta$ ($727.1\to770.8$ then $770.8\to814.5$ are both about $44\ \mathrm{km}$ per doubling, roughly flat here), so the answer is not obvious from the coarse table alone and is exactly the kind of question this module's numerical tools — not a memorised rule — are built to settle.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $s_{\mathrm{downrange}} = \int v\cos\gamma\,dt$ | Horizontal distance travelled during entry; no clean closed form in this model, evaluated numerically |
| $t_f$ | Entry duration, interface to ground |
| Peak deceleration vs. $\beta$ | Nearly flat (lesson 2's result, confirmed numerically to under 1% across a 32-fold $\beta$ range) |
| $h^*_1 - h^*_2 = H\ln(\beta_2/\beta_1)$ | Peak-altitude spacing between two ballistic coefficients — holds closely even in the numerical model |
| Duration vs. $\beta$ | Falls as $\beta$ rises — high-$\beta$ vehicles reach their (deeper) deceleration pulse sooner |
| Downrange, impact speed vs. $\beta$ | Both rise with $\beta$ — a high-$\beta$ vehicle keeps more of its speed, horizontal and total, all the way down |
| Typical $\beta$ (this module's running examples) | Capsule $\approx 540\ \mathrm{kg/m^2}$; dense reentry body $\approx$ several thousand; iron meteoroid $\approx$ tens of thousands |

The next lesson puts a stated deceleration limit and a stated heat-rate limit on top of this same numerical machinery and asks, for the first time in this module, a question with a hard numerical answer: over what range of entry angles can a vehicle actually fly?
