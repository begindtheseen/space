---
id: l07-successive-convexification
title: "Successive convexification: the idea and its price"
minutes: 21
covers:
  - "Successive convexification (SCvx): linearise about a reference, solve, update, repeat"
---

Everything in this module up to now has been, in a precise sense, free. Lossless convexification is not an approximation; the change of variables is exact; the mass bounds cost a checked fraction of a percent; the flight-time search sits outside a still-certified inner solve. A learner could be forgiven for expecting the rest of powered-descent guidance to work the same way. It does not. A 6-DoF vehicle — one whose attitude is part of the optimization, not assumed away — brings in nonlinearities that no relaxation resolves and no change of variables removes, and the tool this module reaches for next, successive convexification, pays for handling them with everything Act One of this module was built to avoid: no global optimum guarantee, no bounded iteration count, and a real chance of failing to converge at all. This lesson introduces the idea and is explicit, from the first paragraph, about that price.

## What stays nonlinear once attitude joins the state

Three-DoF powered descent treated thrust as a free vector: point it wherever the optimizer likes, subject to the cones already built. A real vehicle cannot do that — thrust comes out of an engine bolted to the airframe, and the airframe has an attitude, described by a unit quaternion $\mathbf{q}=(q_w,q_x,q_y,q_z)$ and an angular velocity $\boldsymbol{\omega}$ that are now part of the state. Three things this introduces resist every tool this module has used so far.

**The rotation itself.** If the engine is fixed along the body $+\hat{\mathbf{z}}$ axis producing a mass-normalised thrust of magnitude $\sigma$, the *inertial*-frame acceleration it produces is $\mathbf{u} = \mathbf{R}(\mathbf{q})\,(0,0,\sigma)^\top$, where $\mathbf{R}(\mathbf{q})$ is the rotation matrix built from the quaternion — a matrix whose entries are quadratic polynomials in $q_w,q_x,q_y,q_z$. This is not linear, not convex, and not bilinear in a way any earlier lesson's trick clears: there is no division to invert and no norm to relax, only a genuinely curved function of the attitude.

**The kinematics.** Attitude evolves by $\dot{\mathbf{q}} = \tfrac12\,\Xi(\mathbf{q})\,\boldsymbol{\omega}$, a product of the attitude and the angular rate — the exact bilinear shape mass-depletion had in $\mathbf{T}/m$, except this time no substitution analogous to $\mathbf{u}=\mathbf{T}/m$ exists, because both factors are genuinely needed as separate states elsewhere in the problem.

**The unit-norm constraint.** A quaternion must satisfy $\|\mathbf{q}\|_2=1$ to represent a physical attitude at all. That is an equality constraint on a sphere — the same non-convex shape as every curved equality this module has met, and, unlike the mass-depletion bilinearity, there is no exact reparametrisation that turns "stay on a sphere" into an affine statement globally.

::: example Confirming the nonlinearity directly, not by assertion
Fix a body thrust of $\sigma=6\,\mathrm{m/s^2}$ along $+\hat{\mathbf{z}}_{\text{body}}$ and two nearby attitudes, $\mathbf{q}_1 \propto (1,\,0.05,\,0.02,\,0)$ and $\mathbf{q}_2 \propto (1,\,-0.05,\,0.10,\,0.03)$ (both renormalised to unit length). The inertial accelerations they produce are $\mathbf{u}_1=(0.2393,-0.5983,5.9653)$ and $\mathbf{u}_2=(1.1664,0.6276,5.8520)\,\mathrm{m/s^2}$. If $\mathbf{u}(\mathbf{q})$ were affine in $\mathbf{q}$, the value at the *averaged* quaternion $\mathbf{q}_{\text{mid}}=\tfrac12(\mathbf{q}_1+\mathbf{q}_2)$ (renormalised) would equal the average of $\mathbf{u}_1$ and $\mathbf{u}_2$. Computed directly, $\mathbf{u}(\mathbf{q}_{\text{mid}}) = (0.7160,0.0092,5.9571)$, against the affine prediction $\tfrac12(\mathbf{u}_1+\mathbf{u}_2)=(0.7028,0.0147,5.9086)$ — a genuine discrepancy of $0.0505\,\mathrm{m/s^2}$, not solver noise, computed from two attitudes only a few degrees apart. Whatever tool handles this has to handle a function that really is curved.
:::

## The successive-convexification loop

Since none of this bends into an exact convex form, successive convexification (SCvx) does not try to convert the problem once and for all — it approximates, solves, and repeats:

::: key The SCvx loop
1. **Linearise** every non-convex term (dynamics, unit-norm constraint) about the current reference trajectory $(\bar{\mathbf{x}}(t),\bar{\mathbf{u}}(t))$, producing locally affine dynamics $\dot{\mathbf{x}} \approx \mathbf{A}(t)\mathbf{x}+\mathbf{B}(t)\mathbf{u}+\mathbf{c}(t)$.
2. **Discretise** the linearised, time-varying system exactly over each zero-order-hold step (the same augmented-matrix-exponential construction used for any linear time-invariant system, applied fresh at each step since $\mathbf{A}(t),\mathbf{B}(t)$ now vary node to node).
3. **Solve** the resulting convex SOCP — every constraint this module already knows how to write, plus the linearised dynamics in place of the true ones.
4. **Update** the reference to the new solution (subject to the safeguards the next lesson builds) and **repeat** until the reference stops changing.
:::

Step 3 is the crucial thing to hold onto: *that* solve is a genuine SOCP, with every guarantee the optimization module and this module's earlier lessons established — a global optimum of the linearised subproblem, in a bounded number of interior-point iterations. What SCvx gives up lives entirely in the loop *around* that solve. The linearised subproblem is not the real problem; it is the real problem's best affine guess at the current reference, and solving it exactly tells you nothing certified about the true, nonlinear problem until the loop has converged — and nothing in the loop's construction proves it will.

::: example How fast the linear guess stops being a guess
Take the rotation example above and linearise $\mathbf{u}(\mathbf{q})=\mathbf{R}(\mathbf{q})(0,0,6)^\top$ about the level attitude $\mathbf{q}_{\text{ref}}=(1,0,0,0)$, using the Jacobian computed by finite differences (a stand-in for the analytic or automatic-differentiation Jacobian a real implementation would use). Compare the true value against the linear prediction at increasing tilt about one body axis:

| tilt from reference | true $\mathbf{u}$ | linearised $\mathbf{u}$ | error |
| --- | --- | --- | --- |
| $1°$ | $(0,\,-0.1047,\,5.9991)$ | $(0,\,-0.1047,\,6.0000)$ | $0.00091$ |
| $5°$ | $(0,\,-0.5229,\,5.9772)$ | $(0,\,-0.5234,\,6.0000)$ | $0.02284$ |
| $10°$ | $(0,\,-1.0419,\,5.9088)$ | $(0,\,-1.0459,\,6.0000)$ | $0.09124$ |
| $20°$ | $(0,\,-2.0521,\,5.6382)$ | $(0,\,-2.0838,\,6.0000)$ | $0.36323$ |
| $30°$ | $(0,\,-3.0000,\,5.1962)$ | $(0,\,-3.1058,\,6.0000)$ | $0.81078$ |

The error does not grow linearly with the deviation — it grows like its square, exactly what a first-order Taylor truncation predicts: doubling the tilt from $10°$ to $20°$ multiplies the error by $4.0$, and scaling from $20°$ to $30°$ (a factor of $1.5$) multiplies it by $2.23\approx1.5^2$. A reference that is close to the true optimal trajectory gives SCvx a trustworthy linear model to solve against; a reference that is far away hands the convex subproblem a description of the dynamics that is confidently, quadratically wrong, and nothing stops the subproblem's solver — which has no way to know the model is bad — from exploiting that wrongness to report an excellent-looking answer that the real, nonlinear vehicle cannot fly.
:::

::: warning "The subproblem solved exactly" is not "the problem solved exactly"
This is the single easiest mistake to make with SCvx, and it is worth stating baldly before the next two lessons build the machinery that manages it. Every individual SOCP inside the loop terminates with a duality gap certificate — a real, checkable proof that *that* convex problem was solved to the stated accuracy. None of that certifies the *trajectory*, because the trajectory the subproblem describes is only as good as the linearisation it was built from. A flight program reporting "the guidance solver converged" about an SCvx iterate has said something true and much weaker than the same sentence said about a lossless-convexification solve — it needs the additional, separate claim that the loop itself converged, to a reference close enough to a true feasible trajectory that the linearisation error is negligible, and that claim is exactly what the next two lessons' trust region and virtual control exist to make checkable.
:::

## Check yourself

::: check
Why does the unit-norm constraint $\|\mathbf{q}\|_2=1$ count as a non-convexity of the same character as the thrust annulus, rather than something the lossless-convexification slack trick could handle?
:::

::: answer
The thrust annulus excluded an *open region* (a ball around the origin) from an otherwise convex set, and the fix was to enlarge the feasible set with a slack variable, then prove the optimizer never wants to use the extra room. The unit sphere $\{\mathbf{q}:\|\mathbf{q}\|=1\}$ is a different shape of non-convexity: it is a *lower-dimensional equality surface*, not a region with a hole in it, so there is no natural "outer" convex relaxation whose optimum could be proven to land back on the sphere — relaxing $\|\mathbf{q}\|=1$ to $\|\mathbf{q}\|\le1$ (a convex ball) gives an optimizer every incentive to shrink $\|\mathbf{q}\|$ toward zero if doing so ever reduces cost, with no mechanism analogous to the thrust bound's cost-coupling to push it back to the boundary. This is why SCvx handles it by linearising the sphere locally (a tangent-plane approximation, re-derived at each new reference) rather than by any exact convex reformulation.
:::

::: check
A colleague reports "our SCvx solve converged in eight iterations with a tiny duality gap on the final subproblem" and asks whether that is sufficient evidence to fly the resulting trajectory. What is missing from that report?
:::

::: answer
The duality gap certifies only the *last linear subproblem* was solved accurately — it says nothing about how well that subproblem's linearised dynamics matched the true nonlinear dynamics at the final reference. The missing evidence is whatever this module's next lesson's virtual control reports (how large the residual between the linearised step and the true nonlinear step is at the converged reference) and whether the trust region had shrunk to a size where the linearisation is locally trustworthy. A converged subproblem with a large leftover virtual-control residual describes a trajectory the true nonlinear vehicle cannot actually fly, no matter how small the SOCP's own duality gap is.
:::

::: check
The quadratic error growth in the tilt example suggests that halving the trust region's allowed deviation per iteration should cut the linearisation error by a factor of four, not two. Why might a real SCvx implementation not simply shrink the trust region as fast as possible on every iteration to exploit this?
:::

::: answer
A trust region that shrinks aggressively on every iteration also shrinks how far the reference is allowed to move toward the true optimum on each pass, so while each individual step's linearisation grows more trustworthy, the number of iterations needed to travel from a poor initial guess to the true optimal trajectory grows accordingly — trading iteration quality for iteration count. The next lesson's trust-region rule instead grows the region on iterations where the linear model predicted the true cost change well and shrinks it only when the prediction was poor, which spends the fast, large steps a good linearisation affords while still protecting against the quadratic blow-up this lesson's table demonstrates.
:::

## Summary

| Object | Statement |
| --- | --- |
| What 6-DoF adds | Attitude $\mathbf{q}$, rate $\boldsymbol{\omega}$; thrust direction becomes $\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top$ |
| Three new non-convexities | $\mathbf{R}(\mathbf{q})$ quadratic in $\mathbf{q}$; $\dot{\mathbf{q}}=\tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}$ bilinear; $\|\mathbf{q}\|=1$ a sphere, not a region |
| Confirmed nonlinearity | Averaging two nearby attitudes' thrust vectors differs from the thrust vector at the averaged attitude by $0.0505\,\mathrm{m/s^2}$ |
| The SCvx loop | Linearise about a reference $\to$ discretise exactly $\to$ solve the convex subproblem $\to$ update the reference $\to$ repeat |
| What step 3 keeps | A genuine, certified SOCP solve of the *linearised* subproblem — global optimum, bounded iterations, for that subproblem only |
| What the loop does not keep | Any guarantee of global optimality, convergence, or even feasibility for the true, nonlinear problem |
| Error scaling | Roughly quadratic in deviation from the reference — confirmed: $4\times$ error for $2\times$ tilt, $2.23\times$ for $1.5\times$ tilt |
| The core warning | A converged subproblem's duality gap certifies the subproblem, never the trajectory, without the loop-level evidence the next two lessons build |

The next lesson builds the two devices that make this loop usable rather than merely hopeful: virtual control, which stops a bad linearisation from making the subproblem infeasible outright, and the trust region, which stops it from being exploited past the point the linear model means anything.
