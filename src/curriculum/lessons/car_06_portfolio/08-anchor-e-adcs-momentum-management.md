---
id: l08-anchor-e-adcs-momentum-management
title: "Anchor E: ADCS momentum management"
minutes: 19
covers:
  - "anchor project E — ADCS momentum management with reaction wheels and magnetorquers"
---

Reaction wheels store momentum; they do not remove it. Every environmental torque that pushes consistently in one direction over time — gravity gradient on a nadir-pointing bus, residual aerodynamic torque, a spacecraft's own uncancelled magnetic dipole — adds momentum a wheel has to absorb, and a wheel that runs out of capacity saturates, at which point it can no longer produce a controlling torque at all. Momentum management is the discipline of budgeting that accumulation and removing it before it becomes a problem, usually with magnetorquers, and it is chosen as an anchor project because it is a systems-level study — sizing, budgeting, margin — rather than a single algorithm, which is exactly the kind of judgment an ADCS role actually exercises day to day.

## What the project has to contain

The individual disturbance-torque models — gravity gradient, aerodynamic, solar radiation pressure, residual magnetic dipole — and the magnetic torque relation $\mathbf M = \mathbf m\times\mathbf B$ that governs both the disturbance and the magnetorquer's own actuation are developed in full elsewhere in this curriculum. This project's job is to use them for something those derivations do not do on their own: a momentum budget across a real mission's disturbance environment, and a demonstrated desaturation capability against it.

Three things make the budget credible. First, a worst-case torque bound, not only a nominal-attitude estimate — a disturbance torque's magnitude depends on attitude, and a defensible budget states the bound the attitude control system has to design against, not only the value at the currently-assumed pointing. Second, a secular-versus-cyclic accounting — a disturbance that reverses sign as the spacecraft orbits contributes little net accumulation over an orbit even if its instantaneous peak is large, while a disturbance that stays one-signed for a held attitude accumulates directly, and the two demand very different wheel sizing. Third, a stated desaturation margin — how much momentum the magnetorquers (or thrusters) can remove per orbit against how much the environment adds, with the ratio reported explicitly rather than asserted as "sufficient."

## A worst-case torque bound, checked two independent ways

::: example Peak gravity-gradient torque, found numerically and confirmed against a closed form
For a 6U-class small-sat with principal inertias $\mathbf I=\mathrm{diag}(0.30,\,0.35,\,0.12)\,\mathrm{kg\,m^2}$ in a $500\,\mathrm{km}$ circular orbit ($r=6878.137\,\mathrm{km}$, period $5677\,\mathrm{s}$), scanning the gravity-gradient torque $\mathbf T_{gg}=\tfrac{3\mu}{r^3}\hat{\mathbf r}\times(\mathbf I\hat{\mathbf r})$ numerically over every nadir-vector direction in the body frame finds a peak magnitude of $4.226\times10^{-7}\,\mathrm{N\,m}$. The closed-form worst-case bound, $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|=\tfrac{3\mu}{2r^3}|0.35-0.12|=4.226\times10^{-7}\,\mathrm{N\,m}$, matches to four significant figures — confirming both that the numerical scan located the true worst case and that it occurs, as the closed form predicts, when the nadir vector bisects the axes carrying the largest and smallest principal moments. At a more representative $5^\circ$ pointing offset from a well-aligned nadir attitude, the actual torque is $5.74\times10^{-8}\,\mathrm{N\,m}$, about seven times smaller than the worst case — the gap between "worst case" and "typical" that a budget needs to report as two separate numbers, not one.
:::

A conservative, secular sizing bound — the worst-case torque sustained for a full orbit, as if the attitude never moved relative to the disturbance direction — gives $4.226\times10^{-7}\,\mathrm{N\,m}\times5677\,\mathrm{s}=2.40\times10^{-3}\,\mathrm{N\,m\,s}$ per orbit. Against representative reaction-wheel momentum capacities, that bound alone would saturate a $0.01\,\mathrm{N\,m\,s}$ wheel in about $4.2$ orbits, a $0.05\,\mathrm{N\,m\,s}$ wheel in about $20.8$, and a $0.18\,\mathrm{N\,m\,s}$ wheel in about $75$ — a direct, checkable answer to "how often does this vehicle need to desaturate," stated before a magnetorquer's actual capability is even considered.

::: key
A momentum budget needs a worst-case torque bound, not the value at one assumed attitude — and a good bound is one you can check two independent ways, as the numerical scan and the closed-form $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$ result did here, matching to four significant figures. Report both the worst case and a representative case; the ratio between them is itself useful sizing information.
:::

## Desaturation capability, checked against the bound it exists to cover

A magnetorquer produces torque via the same relation as the disturbance it is meant to counteract, $\mathbf M=\mathbf m\times\mathbf B$, with the geomagnetic field magnitude near $500\,\mathrm{km}$ altitude around $B\approx B_0(R_\oplus/r)^3$, as this curriculum's disturbance-torque material develops.

::: example Desaturation margin, computed against the worst-case bound above
With $B_0\approx3.12\times10^{-5}\,\mathrm T$ at the surface, $B\approx2.49\times10^{-5}\,\mathrm{T}$ near $500\,\mathrm{km}$. A representative small-sat torquer with dipole moment $0.2\,\mathrm{A\,m^2}$ gives a maximum torque $T=0.2\times2.49\times10^{-5}=4.98\times10^{-6}\,\mathrm{N\,m}$ — over an orbit, a maximum desaturation capability of $4.98\times10^{-6}\times5677=2.83\times10^{-2}\,\mathrm{N\,m\,s}$, roughly $11.8$ times the conservative one-orbit gravity-gradient accumulation bound of $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ found earlier. That margin, not an unsupported "sufficient," is the actual engineering answer to "can this system keep up" — a ratio with enough headroom to also cover the aerodynamic and residual-dipole torques a full budget would add alongside gravity gradient.
:::

::: warning
A desaturation controller demonstrated only against the nominal disturbance environment and the nominal wheel and torquer models — no wheel friction, no magnetorquer misalignment, no field-model error — has proven the control law can close a loop, not that it is robust. This is the same trap this module has named for a guidance law tested only on the plant it was designed against: re-run the desaturation control against a perturbed environment (a torquer misaligned by a few degrees, a field magnitude uncertain by 10%, added wheel friction) before calling the margin demonstrated rather than assumed.
:::

## What the interviewer asks, and what the project needs ready

Why gravity gradient specifically, rather than a more exotic disturbance — because in low Earth orbit it and aerodynamic torque dominate the budget, and a candidate should be able to say so and justify the ranking, not only compute one number. Is your torque bound the worst case or a typical case, and how do you know — the closed-form cross-check above is the direct answer; a bound with no independent confirmation is a number, not evidence. Why magnetorquers rather than thrusters for desaturation — because they consume no propellant and desaturate continuously as the field rotates under the vehicle, at the cost of only producing torque perpendicular to the instantaneous field direction, so magnetic-only control is momentarily underactuated and depends on orbital motion to become fully controllable over time. And what happens during an extended period with poor desaturation geometry or authority — a gap the budget should address directly, with a stated margin and a stated worst case, not silence.

## Check yourself

::: check
Explain why the peak gravity-gradient torque in this lesson's worked example occurred specifically when the nadir vector was oriented between the axes carrying the largest and smallest principal moments, rather than along any single principal axis.
:::

::: answer
Along any single principal axis, $\hat{\mathbf r}$ and $\mathbf I\hat{\mathbf r}$ are parallel, so their cross product — and hence the torque — is exactly zero regardless of how large the inertia difference is. The torque instead depends on how much $\hat{\mathbf r}$ and $\mathbf I\hat{\mathbf r}$ diverge in direction, which is maximized at an intermediate angle between the two axes with the most different principal moments; this is exactly what both the numerical scan and the closed-form bound $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$ confirmed here, agreeing to four significant figures.
:::

::: check
A vehicle holds a fixed attitude relative to the orbital frame (nadir-pointing) rather than a fixed inertial attitude. Explain why this specific choice makes the gravity-gradient torque's secular accumulation much worse, using the language of secular versus cyclic disturbance.
:::

::: answer
With a fixed orientation relative to the orbit frame, the nadir vector's direction in body axes never changes as the vehicle orbits, so the gravity-gradient torque never reverses sign — it is secular, and its effect on stored wheel momentum accumulates directly, orbit after orbit, exactly as the one-orbit bound in this lesson computed. An inertially-fixed attitude instead sees the nadir direction sweep through a full circle in body axes once per orbit, so the torque reverses roughly twice per orbit and its net accumulation over a full orbit nearly cancels, leaving only a bounded cyclic swing the wheels ride out rather than a growing one they must be periodically unloaded against.
:::

::: check
A project reports "the magnetorquers are sufficient to desaturate the wheels" with no supporting number. Using this lesson's approach, state what specific ratio should replace that sentence and why it needs both a numerator and a denominator stated explicitly.
:::

::: answer
The ratio of desaturation capability to disturbance accumulation over the same interval — here, maximum torquer-delivered momentum per orbit ($2.82\times10^{-2}\,\mathrm{N\,m\,s}$) divided by the conservative worst-case disturbance-torque accumulation over the same orbit ($2.40\times10^{-3}\,\mathrm{N\,m\,s}$), giving a margin of about $11.8$. Both numbers need to be stated because the ratio alone, with neither value shown, cannot be checked or recomputed by a reviewer, and a margin near $1$ would be a very different engineering situation from a margin near $12$ even though both could be described by the same unsupported word "sufficient."
:::

::: check
Why is a desaturation control law that has only ever been tested against a perfectly modelled magnetic field and a perfectly aligned torquer a weaker piece of evidence than one additionally tested against a misaligned torquer and an uncertain field magnitude?
:::

::: answer
A perfectly modelled test only demonstrates that the control law can close the loop under the exact conditions it was designed and tuned against, which proves the logic is implemented correctly but says nothing about how much margin exists before real hardware imperfection — torquer mounting error, field-model uncertainty, wheel friction — degrades performance or breaks the loop entirely. This is the same "tested only on the plant it was designed against" failure mode named elsewhere in this module for guidance and control projects generally; re-testing against a perturbed environment is what actually demonstrates robustness rather than only correctness.
:::

::: check
State the role family this anchor project maps to, and the single most important number a reviewer from that role family will want to see in the write-up's opening screen.
:::

::: answer
ADCS — attitude determination and control. The single most important opening number is the desaturation margin: the ratio of magnetorquer (or thruster) momentum-removal capability to the worst-case disturbance-torque accumulation over the same period, since that ratio is the direct, checkable answer to whether the momentum-management system actually works across the mission's real environment rather than only in a nominal case.
:::

## Summary

| Item | Value in this lesson's worked example |
| --- | --- |
| Peak gravity-gradient torque | $4.226\times10^{-7}\,\mathrm{N\,m}$ (numerical scan, matching closed form to 4 s.f.) |
| Representative ($5^\circ$ offset) torque | $5.74\times10^{-8}\,\mathrm{N\,m}$, about $7\times$ smaller than worst case |
| One-orbit secular momentum bound | $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ |
| Magnetorquer max torque, one-orbit capability | $4.98\times10^{-6}\,\mathrm{N\,m}$; $2.82\times10^{-2}\,\mathrm{N\,m\,s}$ per orbit |
| Desaturation margin | $\approx11.8\times$ the worst-case secular accumulation |
| Common trap | Desaturation control demonstrated only against a perfectly modelled field and torquer, never a perturbed one |

The next lesson leaves the five anchor projects and turns to work that complements them: hardware-adjacent projects, where the evidence is not a simulation's correctness but a real sensor's noise, bias, and misalignment, measured rather than assumed.
