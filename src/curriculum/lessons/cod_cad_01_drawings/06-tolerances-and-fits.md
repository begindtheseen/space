---
id: l06-tolerances-and-fits
title: Tolerances and fits
minutes: 26
covers:
  - 'Tolerances: limit, plus/minus, bilateral and unilateral'
  - 'Fits: clearance, transition, interference'
---

Take the cap off a pen and put it back on. It slides on with a little push and stays there. Now imagine the factory made the cap a hair too big: it falls off in your pocket. A hair too small, and you cannot get it on at all. Somewhere in the factory, someone decided how big "a hair" is allowed to be — and decided it separately for the cap and for the pen.

No machine makes a part to an exact size. Cut a hundred shafts that are all meant to be 20 mm across, measure them with a good enough [[gauge|go-no-go]], and no two will match. So every drawing has to say not only what size a feature should be, but *how far off* it may be and still count as good. That allowed amount is the **tolerance**.

When two parts go together — a pin in a hole, a bearing on a shaft, a star tracker on its bracket — their two tolerances decide how they meet. Always loose, always tight, or sometimes either. That relationship is the **fit**. This lesson covers how a drawing writes a tolerance, how to compute a fit from hole and shaft limits, and why choosing the fit is a real design decision.

## Every size is a range

Start with three words.

- The **nominal size** is the size you are aiming for, the round number you would say out loud: "a 25 mm hole".
- The **limits** are the largest and smallest sizes that are still acceptable. Call them the **upper limit** $U$ and the **lower limit** $L$.
- The **tolerance** $T$ is the width of the band between them:

$$
T = U - L.
$$

A tolerance is a *width*, so it is always positive. It does not say where the band sits, only how wide it is.

A part is **in tolerance** if every measured size lands between its limits, including exactly on a limit. If one size lands outside, the part is **out of tolerance**, and inspection rejects it. That is the most common reason a part is rejected, and you can see it coming from the drawing alone: the smaller $T$ is, the [[harder the feature is to make|tolerance-cost]] and the more likely it is to fail.

Drawings in this module are in millimetres, and tolerances on machined parts are often a few hundredths of a millimetre. For a feel of the size: a human hair is roughly $0.07$ mm thick. A tolerance of $\pm 0.02$ mm is a band narrower than a hair.

## Four ways to write a tolerance

A drawing can write the same range in several ways. They all boil down to the same two numbers, $U$ and $L$, so the skill is converting any of them to limits.

### Limit dimensioning

The most direct way is to write the two limits themselves. This is **limit dimensioning**. Stacked on two lines, the upper limit goes on top:

$$
\begin{aligned}
&25.03\\
&24.97
\end{aligned}
$$

Nobody has to do any arithmetic. Here $U = 25.03$, $L = 24.97$, and $T = 25.03 - 24.97 = 0.06$ mm.

### Plus or minus, the same both ways

The most familiar way writes the nominal size and how far each way it may go: $25.00 \pm 0.03$. Read it "twenty-five point oh oh, plus or minus point oh three". This is **plus/minus tolerancing**, and because the size may go both up and down, it is **bilateral** — "two-sided". Because the two sides are the same, it is an **equal bilateral** tolerance.

The limits are the nominal plus and minus the amount: $U = 25.00 + 0.03 = 25.03$ and $L = 25.00 - 0.03 = 24.97$. That is exactly the same band as the limit dimension above, written a different way.

### Plus or minus, different each way

Sometimes the designer wants more room on one side than the other. Then the two amounts are written separately, the plus above the minus:

$$
25.00\,{}^{+0.05}_{-0.02}
$$

Read it "twenty-five, plus point oh five, minus point oh two". It is still bilateral, because the size may move both ways, but now it is an **unequal bilateral** tolerance.

### Unilateral: only one way

A **unilateral** tolerance — "one-sided" — lets the size go in only one direction from the nominal. The other side is zero:

$$
8.00\,{}^{\;\;0}_{-0.04}
$$

This says the diameter may be $8.00$ mm or smaller, down to $7.96$ mm, but never larger than $8.00$. In millimetre drawings, the zero side is usually written as a plain $0$, with no sign.

Why would anyone want this? Because sometimes one direction is harmless and the other is fatal. A shaft that must slide into a bearing bore of exactly $8.00$ mm can be a little small and still go in, but never a little big. The unilateral tolerance points all the allowed variation toward the safe side.

::: key
Every tolerance form reduces to two limits. Nominal $N$ with $^{+a}_{-b}$ gives

$$
U = N + a, \qquad L = N - b, \qquad T = U - L = a + b.
$$

Equal bilateral: $a = b$. Unequal bilateral: $a \ne b$, both nonzero. Unilateral: $a = 0$ or $b = 0$.
:::

::: note Why the form does not change the tolerance
Take any plus/minus callout, nominal $N$, plus $a$, minus $b$. The upper limit is $N + a$ and the lower limit is $N - b$. Subtract:

$$
T = (N + a) - (N - b) = N + a - N + b = a + b.
$$

The nominal cancels out. So the tolerance is the sum of the two amounts, whatever the nominal, and a limit dimension with the same $U$ and $L$ is the identical requirement. Writing it differently changes how easy it is to read, not what it allows.
:::

::: example Converting four callouts, and finding the tightest
A bracket drawing has four features: (a) a slot, limits $25.03$ over $24.97$; (b) a boss, $25.00 \pm 0.03$; (c) a bore, $25.00$ plus $0.05$ minus $0.02$; (d) a pin diameter, $8.00$ plus $0$ minus $0.04$. Find each one's limits and tolerance, and say which is the tightest.

(a) Limits read directly: $U = 25.03$, $L = 24.97$. $T = 25.03 - 24.97 = 0.06$ mm.

(b) $U = 25.00 + 0.03 = 25.03$, $L = 25.00 - 0.03 = 24.97$. $T = 0.03 + 0.03 = 0.06$ mm. Same band as (a).

(c) $U = 25.00 + 0.05 = 25.05$, $L = 25.00 - 0.02 = 24.98$. $T = 0.05 + 0.02 = 0.07$ mm.

(d) $U = 8.00 + 0 = 8.00$, $L = 8.00 - 0.04 = 7.96$. $T = 0 + 0.04 = 0.04$ mm.

The tightest tolerance is the smallest band: (d), at $0.04$ mm. Sanity check: the unequal bilateral (c) has the biggest band even though neither of its numbers looks large, because its two sides add, $0.05 + 0.02$.
:::

::: warning The tolerance is the whole band, not the number after the sign
"$\pm 0.03$" does not mean a tolerance of $0.03$. The size can go $0.03$ up *and* $0.03$ down, so the band is $0.06$ mm wide. Mixing these up halves or doubles every number you carry into later calculations. When someone says "the tolerance is 0.03", ask whether they mean plus-or-minus or total.
:::

::: warning The nominal is not special
A part at the nominal size is not "more correct" than one at the limit, and a part $0.001$ mm outside the limit is not "nearly fine". The drawing draws a line. In tolerance is a pass; out of tolerance is a reject, sent to review.
:::

### Where the default comes from

Many dimensions carry no tolerance of their own. They get the default from the **tolerance block** in the title block, which you met two lessons ago, set by the number of decimal places. The tolerances you see written at a feature are the ones the designer thought hard about. They are usually the tightest, and a good place to start when you want to know what on a part really matters.

## Fits: when a hole meets a shaft

Now put two parts together. In fit language, a **hole** is any feature that goes *around* something (a bore, a slot) and a **shaft** is any feature that goes *inside* (a pin, an axle, a key). Each has its own limits:

- hole: $H_{\min}$ to $H_{\max}$ (read "H min" and "H max");
- shaft: $S_{\min}$ to $S_{\max}$.

The **clearance** is the hole size minus the shaft size. A positive clearance is a gap. A negative clearance means the shaft is bigger than the hole: the two overlap, and that overlap is called **interference**.

Because both sizes vary, the clearance varies too. The loosest case is the biggest hole with the smallest shaft. The tightest case is the smallest hole with the biggest shaft:

$$
c_{\max} = H_{\max} - S_{\min}, \qquad c_{\min} = H_{\min} - S_{\max}.
$$

Read $c_{\max}$ "c max", the maximum clearance, and $c_{\min}$ "c min", the minimum clearance. These two numbers sort every fit into one of three classes:

- **Clearance fit**: $c_{\min} \ge 0$. Even in the tightest case there is a gap, or at worst the parts touch. They always go together by hand.
- **Interference fit**: $c_{\max} \le 0$. Even in the loosest case the shaft is at least as big as the hole. Assembly always needs force or a temperature trick.
- **Transition fit**: $c_{\max} > 0$ but $c_{\min} < 0$. Depending on where each part lands in its tolerance, a given pair may slide together or may need a push.

For an interference fit, engineers usually quote the amounts as positive interference: the **maximum interference** is $-c_{\min} = S_{\max} - H_{\min}$.

::: key
Clearance always leaves a gap; interference always requires force or thermal assembly; transition can be either depending on where within tolerance the two parts land. The fit class is a design decision about assembly and load transfer, not a leftover.
:::

### Named fits

Designers rarely invent these limits from scratch. International standard tables give ready-made combinations, named with a letter and a number, like **[[H7/g6|fit-codes]]**. The capital letter is the hole, the lowercase letter is the shaft. The letter sets where the band sits relative to the nominal size; the number, the **tolerance grade**, sets how wide the band is — a bigger number means a wider, cheaper band. Most shops use a **hole-basis system**: the hole is always an "H", whose lower limit is exactly the nominal size, and the fit is chosen by picking the shaft. That way holes can be made and checked with standard tools, and only the shaft changes.

You do not need to memorize the tables. You look them up — the *Machinery's Handbook* is the usual place. What you must be able to do is turn the limits into $c_{\max}$ and $c_{\min}$ and read what they mean. The next three examples all use the same $20$ mm H7 hole, whose limits are $20.000$ to $20.021$ mm, with three different shafts.

::: example A clearance fit: H7/g6
Hole $20.000$ to $20.021$ mm. Shaft (g6) $19.980$ to $19.993$ mm. Classify the fit.

Loosest case, biggest hole with smallest shaft: $c_{\max} = 20.021 - 19.980 = 0.041$ mm.

Tightest case, smallest hole with biggest shaft: $c_{\min} = 20.000 - 19.993 = 0.007$ mm.

$c_{\min}$ is positive, so every pair has a gap between $0.007$ and $0.041$ mm. This is a **clearance fit**. It is a close sliding fit: the shaft turns or slides in the hole by hand, with very little play. Sanity check: every shaft size is below $20$ and every hole size is at or above $20$, so of course they never touch.
:::

::: example A transition and an interference fit: H7/k6 and H7/p6
Same hole, $20.000$ to $20.021$ mm. First shaft (k6): $20.002$ to $20.015$ mm. Second shaft (p6): $20.022$ to $20.035$ mm.

**k6.** $c_{\max} = 20.021 - 20.002 = 0.019$ mm, a gap. $c_{\min} = 20.000 - 20.015 = -0.015$ mm, an overlap. One is positive and one is negative, so this is a **transition fit**: a pair can have up to $0.019$ mm of clearance or up to $0.015$ mm of interference. A big hole with a small shaft slips in; a small hole with a big shaft needs a light press.

**p6.** $c_{\max} = 20.021 - 20.022 = -0.001$ mm. $c_{\min} = 20.000 - 20.035 = -0.035$ mm. Both are negative, so this is an **interference fit**, with interference between $0.001$ and $0.035$ mm. Even the biggest hole is smaller than the smallest shaft.

Sanity check: the shaft bands climb, g6 below the hole, k6 overlapping it, p6 entirely above it. The fit went from loose to tight in step with them.
:::

The [[picture of the three bands|fit-bands]] in the notes shows the same three cases at a glance.

::: warning Pairing the wrong limits
To get the *loosest* case you need the *biggest* hole and the *smallest* shaft; for the tightest, the reverse. Beginners often subtract max from max and min from min. For H7/g6 that gives $20.021 - 19.993 = 0.028$ and $20.000 - 19.980 = 0.020$, which misses both the true extremes, $0.041$ and $0.007$. Say it aloud: "loose is big hole, small shaft".
:::

## Choosing the fit is a design decision

The fit is not something the drafter fills in at the end. It decides how the parts are assembled, whether they can be taken apart, how precisely one locates the other, and how a load gets from one to the other.

**Clearance fits** are for parts that must move, or must come apart easily. A hinge pin, a sliding guide, a cover located on a spigot, a pin that is removed for access. The price is **play**: the part can shift inside the gap. Under load, it shifts until one side makes contact, and then the load goes through that small contact patch. For many parts, play is harmless. For a part that sets an *angle* someone depends on, play is a direct alignment error.

**Transition fits** are for **location**: putting one part in an accurate position relative to another, while still being able to assemble it with light force and take it apart again. Dowel pins that line up two halves of a housing are a typical use. Because some pairs will have a little clearance, a transition fit is not relied on to carry torque.

**Interference fits** are for **load transfer without fasteners**. A gear or a hub pressed onto a shaft is squeezed so hard that friction across the whole contact surface carries torque and force, with zero play. The parts are assembled by pressing, or by a [[thermal trick|shrink-fit]]: heat the outer part so it grows, or cool the inner part so it shrinks, slip them together, and let the temperature even out. They are hard to take apart, and the squeeze puts stress in both parts, so the designer has to check that too.

Bearings show all of this in one place. A ball bearing's rings are fitted to a shaft and a housing, and the ring that turns relative to the load is usually given an interference fit so it cannot slowly creep round. The other ring often gets a lighter fit so the bearing can be assembled. Get it wrong and the bearing's internal play or friction changes — which, in a **[[gimbal or a reaction wheel|bearing-friction]]**, changes the friction torque in the actuator model a control engineer tunes against.

::: example How much can a clearance fit tilt a bracket?
A star-tracker bracket is located on a panel by two pins $100$ mm apart. Each pin sits in its hole with the H7/g6 fit above, so each has up to $c_{\max} = 0.041$ mm of clearance. In the worst case, how far can the bracket rotate before the pins touch, in degrees and in arcseconds?

The worst case is one pin pushed fully to one side of its hole while the other is pushed fully to the opposite side. Relative to the centered position, each moves by half the clearance, in opposite directions, so the two ends of the bracket shift apart sideways by $0.041/2 + 0.041/2 = 0.041$ mm.

For a small angle, rotation in radians is sideways shift divided by distance:

$$
\theta \approx \frac{0.041\,\mathrm{mm}}{100\,\mathrm{mm}} = 0.000410\,\mathrm{rad}.
$$

Convert to degrees by multiplying by $180/\pi$: $0.000410 \times 57.3 \approx 0.0235°$.

Convert to [[arcseconds|arcseconds]]: $0.0235 \times 3600 \approx 84.6$ arcseconds.

Many star trackers measure attitude to a few arcseconds. A bracket that can wobble by about 85 arcseconds would throw that away. This is why a tracker bracket gets a tighter locating fit, or is shimmed and measured after assembly. Sanity check: $0.041$ mm over $100$ mm is about 4 parts in 10,000, a tiny angle, as expected.
:::

::: note Why rotation is shift over distance
Picture the bracket turning about its middle through a small angle $\theta$ (in radians). A point at distance $r$ from the pivot moves along a circular arc of length $r\theta$. For small angles the arc is almost a straight sideways shift. The two pins are $r = 50$ mm either side of the middle, so they move $50\theta$ each, in opposite directions, and apart by $100\theta$ in total. Setting $100\theta = 0.041$ gives $\theta = 0.041/100$. Any pivot point gives the same answer, because only the *difference* between the two shifts matters.
:::

### Temperature can change the fit

A fit is computed at room temperature, usually $20\,°\mathrm{C}$. A spacecraft does not stay there. Different materials grow and shrink by different amounts when temperature changes, so a fit between two different metals changes in orbit. A steel shaft in an aluminium housing is the classic case: aluminium shrinks more when cold, so the clearance shrinks, and a sliding fit on the ground can bind in the cold. The check questions below put numbers on this.

## Check yourself

::: check
A boss is dimensioned $12.5 \pm 0.2$ mm. Give its limits and its tolerance, and then write the same requirement as a limit dimension.
:::

::: answer
$U = 12.5 + 0.2 = 12.7$ mm and $L = 12.5 - 0.2 = 12.3$ mm. The tolerance is $T = 12.7 - 12.3 = 0.4$ mm — the whole band, twice the $0.2$. As a limit dimension it is $12.7$ stacked over $12.3$.
:::

::: check
A pin is dimensioned $8.00$, plus $0$, minus $0.04$ mm. Three pins measure $7.97$, $8.00$ and $8.01$ mm. Which pass inspection? Why might the designer have used a one-sided tolerance here?
:::

::: answer
The limits are $7.96$ and $8.00$ mm. $7.97$ passes (inside). $8.00$ passes (exactly on the upper limit counts as in tolerance). $8.01$ fails: it is $0.01$ mm over the upper limit. The unilateral tolerance means the pin may be smaller than nominal but never bigger — typical when being too big would stop it fitting into its mating hole, while being slightly small is harmless.
:::

::: check
A hole is $12.000$ to $12.018$ mm and its shaft is $12.007$ to $12.018$ mm. Compute $c_{\max}$ and $c_{\min}$ and classify the fit.
:::

::: answer
Loosest case: $c_{\max} = H_{\max} - S_{\min} = 12.018 - 12.007 = 0.011$ mm. Tightest case: $c_{\min} = H_{\min} - S_{\max} = 12.000 - 12.018 = -0.018$ mm. $c_{\max}$ is positive and $c_{\min}$ is negative, so this is a transition fit: anything from $0.011$ mm of clearance to $0.018$ mm of interference.
:::

::: check
For each part, pick a clearance, transition or interference fit, and give one reason: (a) a flywheel hub that must carry the motor's torque to the rotor without keys or screws; (b) a pin that a technician pulls out by hand to open an access door; (c) dowel pins that set the position of a sensor housing but must allow it to be removed for rework.
:::

::: answer
(a) Interference: the squeeze creates friction over the whole contact surface that carries the torque, with no play. (b) Clearance: it must go in and out by hand every time. (c) Transition: it locates accurately with little or no play, but a pair can still be assembled and removed with light force, and it is not relied on to carry torque.
:::

::: check
A steel shaft sits in an aluminium housing, nominal diameter $20$ mm. Aluminium shrinks by about $23 \times 10^{-6}$ of its size per degree Celsius and steel by about $12 \times 10^{-6}$. The assembly cools by $60\,°\mathrm{C}$ in orbit. By how much does the diametral clearance change, and in which direction? What would that do to the H7/g6 fit, whose minimum clearance was $0.007$ mm?
:::

::: answer
The hole shrinks by $20 \times 23 \times 10^{-6} \times 60 = 0.0276$ mm. The shaft shrinks by $20 \times 12 \times 10^{-6} \times 60 = 0.0144$ mm. The hole shrinks more, so the clearance *decreases* by $0.0276 - 0.0144 = 0.0132$ mm. The worst-case clearance becomes $0.007 - 0.0132 = -0.0062$ mm: the tightest pairs now interfere. A fit that slides on the ground can bind in the cold, so the designer must check the fit at the operating temperatures, not only at room temperature.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Limits | Largest and smallest acceptable size | Upper U, lower L |
| Tolerance | Width of the band | T = U − L, always positive |
| Limit dimension | Both limits written, upper on top | No arithmetic needed |
| Equal bilateral | Same amount both ways | N ± a gives T = 2a |
| Unequal bilateral | Different amounts each way | N +a −b gives T = a + b |
| Unilateral | Variation only one way | One side is 0 |
| Max clearance | Biggest hole minus smallest shaft | c max = H max − S min |
| Min clearance | Smallest hole minus biggest shaft | c min = H min − S max |
| Clearance fit | Always a gap | c min ≥ 0 |
| Transition fit | Gap or overlap | c max > 0 and c min < 0 |
| Interference fit | Always an overlap | c max ≤ 0 |

This lesson looked at one feature, or one pair of features, at a time. The next lesson adds up the tolerances of several parts stacked in a row — the tolerance stack-up — and shows the two ways of doing it, worst case and root-sum-square, that set alignment budgets for sensors like the star tracker.

::: context go-no-go Checking limits without reading a number
On a production floor, a hole is often checked with a **go/no-go gauge**: a plug with two precise ends. The "go" end is made at the hole's lower limit and must slide in. The "no-go" end is made at the upper limit and must not. If go goes and no-go does not, the hole is between its limits. The gauge tests the limits directly, which is one reason limit dimensioning is so natural to inspectors.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="42" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="48" width="170" height="14" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="38" width="80" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">GO = lower limit</text>
  <text x="55" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">must enter</text>
  <text x="300" y="30" font-size="12" text-anchor="middle" fill="#b4232c">NO-GO = upper limit</text>
  <text x="300" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">must not enter</text>
  <text x="175" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">handle</text>
</svg>
```

The no-go end is the bigger one, which is why it cannot enter a good hole.
:::

::: context tolerance-cost Tight costs money
A wide tolerance can be met by a quick cut on an ordinary machine. A narrow one may need slower cuts, a finishing step such as grinding or reaming, a temperature-controlled room, more careful inspection, and more scrapped parts. So every tight tolerance on a drawing is a cost someone pays. Good designers make a tolerance tight only where the function needs it, and leave everything else at the title-block default.
:::

::: context fit-codes Reading a fit name
In a name like H7/g6, the part before the slash is the hole and the part after is the shaft. The letter is the **fundamental deviation**: how far the band sits from the nominal size. "H" means the hole's lower limit is exactly the nominal; shaft letters early in the alphabet sit below the nominal (looser), later letters sit above it (tighter). The number is the **tolerance grade**, the width: grade 6 is narrower than grade 7. The tables come from the ISO system of limits and fits, which the *Machinery's Handbook* reprints alongside the older US inch fit classes.
:::

::: context fit-bands Three shafts, one hole
Each bar is a tolerance band, drawn against the nominal 20 mm line (the dashed zero). Heights are to scale, in thousandths of a millimetre (micrometres).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="24" y="124" font-size="11" fill="#6c7a93">20.000</text>
  <rect x="80" y="57.5" width="50" height="52.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">hole H7</text>
  <text x="105" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">0 to +21</text>
  <rect x="150" y="127.5" width="45" height="32.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="172" y="174" font-size="11" text-anchor="middle" fill="#1f2a44">g6 −20 to −7</text>
  <rect x="215" y="72.5" width="45" height="32.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="237" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">k6 +2 to +15</text>
  <rect x="280" y="22.5" width="45" height="32.5" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="302" y="16" font-size="11" text-anchor="middle" fill="#b4232c">p6 +22 to +35</text>
</svg>
```

g6 sits wholly below the hole band: clearance. k6 overlaps it: transition. p6 sits wholly above it: interference.
:::

::: context shrink-fit Using heat instead of a hammer
Metal grows when heated and shrinks when cooled. To join parts with an interference fit, a technician can heat the outer part — a gear or a bearing ring — in an oven until its hole is bigger than the shaft, or chill the shaft, sometimes in liquid nitrogen at about $-196\,°\mathrm{C}$. The parts slide together with no force. As they return to the same temperature, the outer part tries to shrink back and grips the shaft hard. This avoids the scratching and uneven stress that pressing can cause.
:::

::: context bearing-friction Why a fit reaches the control loop
A reaction wheel spins on bearings, and a gimbal rotates on them. How tightly the bearing rings are fitted changes how much the balls are squeezed, and so how much friction torque the bearing has. The attitude controller commands a torque and assumes a friction model. If the real friction is higher, or changes as the fit shifts with temperature, part of every command is eaten by friction the model does not know about. That is one concrete way a mechanical drawing choice turns up in a GNC engineer's tuning.
:::

::: context arcseconds Very small angles
A degree is split into 60 arcminutes, and each arcminute into 60 arcseconds, so one degree is 3,600 arcseconds. Pointing and attitude people work in arcseconds because the angles they care about are tiny. One arcsecond is about the angle a coin 2 cm wide makes when seen from 4 km away. Star trackers, telescopes and laser links all quote their accuracy in arcseconds, which is why a hundredth of a millimetre on a bracket can matter.
:::
